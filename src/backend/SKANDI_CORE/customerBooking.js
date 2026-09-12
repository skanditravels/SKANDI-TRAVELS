// /src/backend/SKANDI_CORE/customerBooking.js
// SKANDI Backend Base 1.0 — B-006 canonical customer booking orchestration.
// Owns customer cart/checkout state and customer-payment capture timing.
// Does NOT write ALTEA. booking_carts status=Confirmed remains the single customer->ALTEA handoff.

import {
  searchDuffelOffersCore,
  refreshDuffelOfferCore,
  priceDuffelOfferCore,
  getDuffelSeatMapsCore,
  prepareDuffelPaymentCore,
  createDuffelOrderCore,
  getDuffelOrderCore,
  duffelAmountToMinor
} from "backend/SKANDI_CORE/duffelAir.js";
import {
  searchDuffelStaysCore,
  fetchDuffelStayRatesCore,
  quoteDuffelStayCore,
  getDuffelStayQuoteCore,
  createDuffelStayBookingCore,
  getDuffelStayBookingCore,
  searchDuffelCarsCore,
  quoteDuffelCarCore,
  getDuffelCarQuoteCore
} from "backend/SKANDI_CORE/duffelGround.js";
import {
  createStripePaymentIntent,
  retrieveStripePaymentIntent,
  captureStripePaymentIntent,
  cancelStripePaymentIntent,
  getStripePublishableKey,
  assertStripeAuthorization
} from "backend/SKANDI_CORE/stripeClient.js";
import { restRequest } from "backend/SKANDI_CORE/supabaseServer.js";
import {
  createOwnedCart,
  getOwnedCart,
  getOwnedCartByOffer,
  listOwnedCarts,
  updateOwnedCart,
  transitionOwnedCart,
  addCartItem,
  recordPaymentEventOnce
} from "backend/SKANDI_CORE/bookingCart.js";
import {
  bookingError,
  toDuffelOfferSearch,
  mapOfferForHome,
  mapOfferForCart,
  assertOfferMatchesSearch,
  buildDuffelPassengers,
  toDuffelOrderPassengers,
  travelerTriggerProjection,
  combineServiceSelections,
  toPublicCart
} from "backend/SKANDI_CORE/bookingMapper.js";
import { encryptBookingData, decryptBookingData } from "backend/SKANDI_CORE/bookingSecurity.js";
import {
  markBookingReconciliationRequired,
  voidUnusedAuthorization,
  reconcileFlightCart,
  refreshConfirmedAirOrder
} from "backend/SKANDI_CORE/bookingReconciliation.js";
import { text, upper, lower, record } from "backend/SKANDI_CORE/platformValidation.js";

const LOCKED_STATUSES = new Set(["Confirmed", "Committing", "ReconciliationRequired"]);
const AIRPORTS = "travel_info_airports";
const DESTINATIONS = "inventory_master_entities";

function arr(value) { return Array.isArray(value) ? value : []; }
function eq(value) { return `eq.${String(value ?? "")}`; }
function nowIso() { return new Date().toISOString(); }
function decimal(value) {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n) || n < 0) throw bookingError("INVALID_PRICE", "The provider returned an invalid price.");
  return n.toFixed(2);
}
function safeCode(value) { const code = upper(value || "", 80); return /^[A-Z0-9_]+$/.test(code) ? code : "BOOKING_COMMIT_FAILED"; }
function requireMemberContext(context = {}) {
  if (!text(context.memberId, 180)) throw bookingError("LOGIN_REQUIRED", "Sign in to continue with this booking.", 401);
  return context;
}
async function requireOwnedCart(context, cartId) {
  const row = await getOwnedCart(requireMemberContext(context), text(cartId, 36));
  if (!row) throw bookingError("CART_NOT_FOUND", "This booking cart was not found or belongs to another account.", 404);
  return row;
}
function assertEditable(row) {
  if (LOCKED_STATUSES.has(String(row?.status || ""))) throw bookingError("BOOKING_LOCKED", "This booking can no longer be changed from checkout.", 409);
}
function resumeStepForStatus(status) {
  return ({
    Open: "offer",
    OfferAccepted: "extras",
    ExtrasSaved: "transfer",
    TravelersPending: "apis",
    TravelersSaved: "seats",
    PaymentReady: "payment",
    PaymentPending: "payment",
    Committing: "payment",
    ReconciliationRequired: "payment",
    Confirmed: "confirmation"
  })[String(status || "")] || "offer";
}

export async function searchLiveFlightOffersCore(input = {}) {
  const normalized = toDuffelOfferSearch(input.search || input);
  const result = await searchDuffelOffersCore(normalized.coreRequest);
  const items = arr(result.offers)
    .filter(offer => !offer.isExpired)
    .sort((a, b) => Number(a.totalAmount || 0) - Number(b.totalAmount || 0))
    .slice(0, 50)
    .map(offer => mapOfferForHome(offer, normalized.searchContext));
  return {
    provider: "Duffel",
    offerRequestId: result.offerRequestId,
    items,
    meta: {
      live: true,
      resultCount: items.length,
      searchedAt: nowIso(),
      providerRequestId: result.requestId || null,
      correlationId: result.correlationId || null
    }
  };
}

export async function createFlightCartCore(context, input = {}) {
  requireMemberContext(context);
  const offerId = text(input.offer?.id || input.offerId, 180);
  if (!/^off_[A-Za-z0-9_]+$/.test(offerId)) throw bookingError("INVALID_OFFER_ID", "The selected flight offer is invalid.");
  const existing = await getOwnedCartByOffer(context, offerId);
  if (existing?.cart_id && existing.status !== "Confirmed") {
    return { cartId: existing.cart_id, step: resumeStepForStatus(existing.status), recoveredExistingCart: true };
  }
  const normalized = toDuffelOfferSearch(input.search || input.offer?.searchContext || {});
  const refreshed = await refreshDuffelOfferCore({ offerId });
  assertOfferMatchesSearch(refreshed.offer, normalized.searchContext);
  const selectedOffer = mapOfferForCart(refreshed.offer);
  const payload = {
    version: 3,
    provider: "Duffel",
    productType: "FLIGHT_ONLY",
    search: normalized.searchContext,
    searchContext: normalized.searchContext,
    selectedOffer,
    extras: [],
    transfer: null,
    seatSelections: {},
    secureTravelers: null,
    travelers: [],
    airOrder: null,
    stayBooking: null,
    reconciliation: null,
    flow: { currentStep: "offer", createdAt: nowIso() }
  };
  const row = await createOwnedCart(context, {
    email: context.email,
    status: "Open",
    currency: refreshed.offer.totalCurrency,
    subtotal: decimal(refreshed.offer.totalAmount),
    taxes: decimal(refreshed.offer.taxAmount),
    total: decimal(refreshed.offer.totalAmount),
    selectedOfferId: refreshed.offer.id,
    expiresAt: refreshed.offer.expiresAt,
    payload,
    source: "customer"
  });
  await addCartItem(row.cart_id, {
    itemType: "flight",
    itemId: refreshed.offer.id,
    title: selectedOffer.routeSummary,
    quantity: 1,
    unitPrice: refreshed.offer.totalAmount,
    total: refreshed.offer.totalAmount,
    payload: { provider: "Duffel", owner: refreshed.offer.owner, expiresAt: refreshed.offer.expiresAt }
  });
  return { cartId: row.cart_id, step: "offer", recoveredExistingCart: false };
}

export async function loadBookingCartCore(context, input = {}, options = {}) {
  const row = await requireOwnedCart(context, input.cartId);
  let sensitive = null;
  if (options.includeTravelers && row.payload?.secureTravelers) sensitive = await decryptBookingData(row.payload.secureTravelers);
  return { row, sensitive, cart: toPublicCart(row, sensitive) };
}

export async function listCustomerBookingCartsCore(context, input = {}) {
  requireMemberContext(context);
  const rows = await listOwnedCarts(context, { limit: input.limit || 20, status: input.status || "" });
  return { carts: rows.map(row => toPublicCart(row)) };
}

async function refreshAndPersistOffer(context, row) {
  const refreshed = await refreshDuffelOfferCore({ offerId: row.selected_offer_id });
  assertOfferMatchesSearch(refreshed.offer, row.payload?.searchContext || row.payload?.search || {});
  const payload = { ...(row.payload || {}), selectedOffer: mapOfferForCart(refreshed.offer) };
  return updateOwnedCart(context, row.cart_id, {
    currency: refreshed.offer.totalCurrency,
    subtotal: decimal(refreshed.offer.totalAmount),
    taxes: decimal(refreshed.offer.taxAmount),
    total: decimal(refreshed.offer.totalAmount),
    expiresAt: refreshed.offer.expiresAt,
    payload
  });
}

export async function acceptBookingOfferCore(context, input = {}) {
  if (input.termsAccepted !== true) throw bookingError("TERMS_REQUIRED", "Accept the booking conditions before continuing.");
  const row = await requireOwnedCart(context, input.cartId);
  assertEditable(row);
  const refreshed = await refreshAndPersistOffer(context, row);
  const payload = {
    ...refreshed.payload,
    offerTermsAcceptedAt: nowIso(),
    flow: { ...(refreshed.payload?.flow || {}), currentStep: "extras" }
  };
  return toPublicCart(await updateOwnedCart(context, refreshed.cart_id, { status: "OfferAccepted", payload }));
}

export async function loadBookingExtrasCore(context, input = {}) {
  const row = await requireOwnedCart(context, input.cartId);
  assertEditable(row);
  const refreshed = await refreshAndPersistOffer(context, row);
  const items = arr(refreshed.payload?.selectedOffer?.availableServices)
    .filter(service => service.type === "baggage")
    .map(service => ({
      id: service.id,
      serviceId: service.id,
      title: service.label || "Additional baggage",
      description: [service.passengerName, service.segmentLabel].filter(Boolean).join(" · "),
      price: { amount: service.totalAmount, currency: service.totalCurrency },
      maximumQuantity: service.maximumQuantity || 1
    }));
  return { cart: toPublicCart(refreshed), items, selectedExtras: arr(refreshed.payload?.extras) };
}

export async function storeBookingExtrasCore(context, input = {}) {
  const row = await requireOwnedCart(context, input.cartId);
  assertEditable(row);
  const refreshed = await refreshAndPersistOffer(context, row);
  const available = new Map(arr(refreshed.payload?.selectedOffer?.availableServices).filter(s => s.type === "baggage").map(s => [s.id, s]));
  const seen = new Set();
  const extras = arr(input.selectedExtras).map(selection => {
    const id = text(selection?.id || selection?.serviceId, 180);
    const service = available.get(id);
    if (!service) throw bookingError("SERVICE_UNAVAILABLE", "A selected baggage service is no longer available.");
    if (seen.has(id)) throw bookingError("DUPLICATE_SERVICE", "The same baggage service cannot be selected twice.");
    seen.add(id);
    const quantity = Number(selection?.quantity || 1);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > Number(service.maximumQuantity || 1)) throw bookingError("INVALID_SERVICE_QUANTITY", "A selected baggage quantity is invalid.");
    return { id, quantity, title: service.label, amount: service.totalAmount, currency: service.totalCurrency };
  });
  const payload = { ...refreshed.payload, extras, flow: { ...(refreshed.payload?.flow || {}), currentStep: "transfer" } };
  await updateOwnedCart(context, row.cart_id, { status: "ExtrasSaved", payload });
  return { saved: true, requiresSignatureTransfer: false };
}

export async function loadSignatureTransfersCore(context, input = {}) {
  await requireOwnedCart(context, input.cartId);
  return { options: [], meta: { message: "No live Signature transfer is attached to this flight cart." } };
}

export async function storeSignatureTransferCore(context, input = {}) {
  if (input.transfer) throw bookingError("TRANSFER_UNAVAILABLE", "That transfer is not available for this booking.");
  const row = await requireOwnedCart(context, input.cartId);
  assertEditable(row);
  const payload = { ...(row.payload || {}), transfer: null, flow: { ...(row.payload?.flow || {}), currentStep: "apis" } };
  await updateOwnedCart(context, row.cart_id, { status: "TravelersPending", payload });
  return { saved: true };
}

export async function saveBookingTravelersCore(context, input = {}) {
  const row = await requireOwnedCart(context, input.cartId);
  assertEditable(row);
  const mapped = buildDuffelPassengers(input.travelers, input.contact, row.payload?.selectedOffer || {});
  const encrypted = await encryptBookingData(mapped);
  const services = combineServiceSelections(row.payload || {});
  const priced = await priceDuffelOfferCore({ offerId: row.selected_offer_id, services });
  const payload = {
    ...(row.payload || {}),
    selectedOffer: mapOfferForCart(priced.offer),
    secureTravelers: encrypted,
    travelers: travelerTriggerProjection(mapped.passengers),
    travelerCount: mapped.passengers.length,
    flow: { ...(row.payload?.flow || {}), currentStep: "seats" }
  };
  const updated = await updateOwnedCart(context, row.cart_id, {
    email: mapped.contact.email,
    status: "TravelersSaved",
    currency: priced.offer.totalCurrency,
    subtotal: decimal(priced.offer.totalAmount),
    taxes: decimal(priced.offer.taxAmount),
    total: decimal(priced.offer.totalAmount),
    expiresAt: priced.offer.expiresAt,
    payload
  });
  return { cart: toPublicCart(updated), repriced: true };
}

function availableSeatServices(seatMaps) {
  const result = new Map();
  for (const seatMap of arr(seatMaps)) {
    for (const seat of arr(seatMap.seats)) {
      for (const service of arr(seat.availableServices)) {
        if (!service?.id) continue;
        result.set(service.id, {
          serviceId: service.id,
          id: service.id,
          designator: seat.designator,
          cabinName: seat.cabinName,
          disclosures: arr(seat.disclosures),
          passengerId: service.passengerId || null,
          segmentId: seatMap.segmentId || service.segmentId || null,
          amount: service.totalAmount,
          currency: service.totalCurrency
        });
      }
    }
  }
  return result;
}

export async function loadSeatMapsCore(context, input = {}) {
  const loaded = await loadBookingCartCore(context, input, { includeTravelers: true });
  if (!loaded.sensitive?.passengers?.length) throw bookingError("TRAVELERS_REQUIRED", "Save traveler details before selecting seats.");
  const result = await getDuffelSeatMapsCore({ offerId: loaded.row.selected_offer_id });
  const seatMaps = arr(result.seatMaps);
  const count = seatMaps.reduce((total, map) => total + arr(map.seats).filter(seat => arr(seat.availableServices).length).length, 0);
  return {
    unavailable: count === 0,
    reason: count === 0 ? "The airline did not return selectable seats for this offer." : "",
    provider: "Duffel",
    seatMaps,
    travelers: loaded.sensitive.passengers.map((p, index) => ({ id: p.id, travelerId: p.id, firstName: p.givenName, lastName: p.familyName, label: `${p.givenName || ""} ${p.familyName || ""}`.trim() || `Traveler ${index + 1}` })),
    existingSelections: record(loaded.row.payload?.seatSelections)
  };
}

export async function storeSeatSelectionsCore(context, input = {}) {
  const row = await requireOwnedCart(context, input.cartId);
  assertEditable(row);
  let seatSelections = {};
  if (input.skipped !== true) {
    const mapResult = await getDuffelSeatMapsCore({ offerId: row.selected_offer_id });
    const available = availableSeatServices(mapResult.seatMaps);
    const travelerIds = new Set(arr(row.payload?.selectedOffer?.passengers).map(p => p?.id).filter(Boolean));
    const usedPassengerSegments = new Set();
    const usedSeats = new Set();
    for (const [key, selection] of Object.entries(record(input.selections))) {
      const travelerId = text(selection?.travelerId || key.split(":")[0], 180);
      const serviceId = text(selection?.serviceId || selection?.id, 180);
      if (!travelerIds.has(travelerId)) throw bookingError("SEAT_PASSENGER_MISMATCH", "A selected seat belongs to an unknown traveler.");
      const candidate = available.get(serviceId);
      if (!candidate) throw bookingError("SEAT_UNAVAILABLE", "A selected seat is no longer available.");
      if (candidate.passengerId && candidate.passengerId !== travelerId) throw bookingError("SEAT_PASSENGER_MISMATCH", "A selected seat belongs to a different traveler.");
      const assignmentKey = `${travelerId}:${candidate.segmentId || "segment"}`;
      const seatKey = `${candidate.segmentId || "segment"}:${candidate.designator}`;
      if (usedPassengerSegments.has(assignmentKey) || usedSeats.has(seatKey)) throw bookingError("DUPLICATE_SEAT", "Each traveler can have one seat per flight segment.");
      usedPassengerSegments.add(assignmentKey); usedSeats.add(seatKey);
      seatSelections[key] = { ...candidate, travelerId };
    }
  }
  const payload = { ...(row.payload || {}), seatSelections, seatsSkipped: input.skipped === true, flow: { ...(row.payload?.flow || {}), currentStep: "payment" } };
  const services = combineServiceSelections(payload);
  const priced = await priceDuffelOfferCore({ offerId: row.selected_offer_id, services });
  payload.selectedOffer = mapOfferForCart(priced.offer);
  const updated = await updateOwnedCart(context, row.cart_id, {
    status: "PaymentReady",
    currency: priced.offer.totalCurrency,
    subtotal: decimal(priced.offer.totalAmount),
    taxes: decimal(priced.offer.taxAmount),
    total: decimal(priced.offer.totalAmount),
    expiresAt: priced.offer.expiresAt,
    payload
  });
  return { cart: toPublicCart(updated) };
}

export async function prepareBookingPaymentCore(context, input = {}) {
  const row = await requireOwnedCart(context, input.cartId);
  if (!row.payload?.secureTravelers) throw bookingError("TRAVELERS_REQUIRED", "Save traveler details before payment.");
  if (LOCKED_STATUSES.has(row.status)) throw bookingError("BOOKING_RECONCILIATION_REQUIRED", "This booking is already confirmed, committing, or being reconciled. Do not submit another payment.", 409);
  const services = combineServiceSelections(row.payload || {});
  const result = await prepareDuffelPaymentCore({ offerId: row.selected_offer_id, services, idempotencyContext: row.cart_id, manualCapture: true });
  const amountMinor = duffelAmountToMinor(result.offer.totalAmount, result.offer.totalCurrency);
  const payload = {
    ...(row.payload || {}),
    selectedOffer: mapOfferForCart(result.offer),
    payment: {
      paymentIntentId: result.payment.paymentIntentId,
      amount: result.payment.amount,
      amountMinor,
      currency: result.payment.currency,
      status: result.payment.status,
      captureMethod: "manual",
      preparedAt: nowIso()
    },
    paymentIntentId: result.payment.paymentIntentId,
    flow: { ...(row.payload?.flow || {}), currentStep: "payment" }
  };
  const updated = await updateOwnedCart(context, row.cart_id, {
    status: "PaymentPending",
    currency: result.offer.totalCurrency,
    subtotal: decimal(result.offer.totalAmount),
    taxes: decimal(result.offer.taxAmount),
    total: decimal(result.offer.totalAmount),
    expiresAt: result.offer.expiresAt,
    payload
  });
  return { cart: toPublicCart(updated), payment: result.payment };
}

export async function commitBookingCore(context, input = {}) {
  if (input.termsAccepted !== true) throw bookingError("TERMS_REQUIRED", "Accept the booking and payment terms before continuing.");
  let loaded = await loadBookingCartCore(context, input, { includeTravelers: true });
  if (loaded.row.status === "Confirmed") return confirmedResult(loaded.row);
  if (loaded.row.status === "ReconciliationRequired") throw bookingError("BOOKING_RECONCILIATION_REQUIRED", "This booking is already being reconciled. Do not pay or book again.", 409);
  const payment = loaded.row.payload?.payment || {};
  const submittedPaymentId = text(input.paymentIntentId, 180);
  if (!payment.paymentIntentId || payment.paymentIntentId !== submittedPaymentId) throw bookingError("PAYMENT_REFERENCE_MISMATCH", "The completed payment authorization does not match this booking.", 409);

  if (loaded.row.status === "PaymentPending") {
    const claimed = await transitionOwnedCart(context, loaded.row.cart_id, "PaymentPending", "Committing");
    loaded = await loadBookingCartCore(context, input, { includeTravelers: true });
    if (!claimed && loaded.row.status !== "Committing") throw bookingError("BOOKING_COMMIT_CONFLICT", "This booking is already being processed.", 409);
  }
  if (loaded.row.status !== "Committing") throw bookingError("BOOKING_NOT_READY", "This booking is not ready to be committed.", 409);
  if (!loaded.sensitive?.passengers?.length) throw bookingError("TRAVELERS_REQUIRED", "Traveler details are missing from this booking.");

  const services = combineServiceSelections(loaded.row.payload || {});
  let providerResult;
  try {
    providerResult = await createDuffelOrderCore({
      offerId: loaded.row.selected_offer_id,
      orderType: "instant",
      services,
      paymentIntentId: submittedPaymentId,
      passengers: toDuffelOrderPassengers(loaded.sensitive.passengers),
      internalReference: loaded.row.cart_id,
      confirmationDeliveryPolicy: "SKANDI"
    });
  } catch (error) {
    // A provider error may still represent an outcome-unknown mutation. Never recreate here.
    if (["DUFFEL_TIMEOUT", "DUFFEL_HTTP_500", "DUFFEL_HTTP_502", "DUFFEL_HTTP_503", "DUFFEL_HTTP_504"].includes(String(error?.code || ""))) {
      const updated = await markBookingReconciliationRequired(context, loaded.row, {
        kind: "AIR_ORDER_OUTCOME_UNKNOWN",
        code: safeCode(error.code),
        providerRequestId: error.providerRequestId || null,
        correlationId: error.correlationId || null,
        customerPaymentCaptureRequired: false
      });
      throw bookingError("BOOKING_RECONCILIATION_REQUIRED", `The airline booking outcome is being reconciled. Do not retry. Cart: ${updated.cart_id}`, 409);
    }
    await voidUnusedAuthorization(loaded.row);
    await updateOwnedCart(context, loaded.row.cart_id, {
      status: "PaymentReady",
      payload: { ...(loaded.row.payload || {}), payment: { ...payment, status: "authorization_released" }, flow: { ...(loaded.row.payload?.flow || {}), currentStep: "payment" } }
    });
    throw error;
  }

  if (providerResult.reconciliationRequired || !providerResult.order?.id) {
    const updated = await markBookingReconciliationRequired(context, loaded.row, {
      kind: "AIR_ORDER_PENDING",
      code: "DUFFEL_ORDER_PENDING",
      providerRequestId: providerResult.requestId,
      correlationId: providerResult.correlationId,
      providerStatus: providerResult.providerStatus,
      customerPaymentCaptureRequired: false
    });
    return { cartId: updated.cart_id, status: updated.status, reconciliationRequired: true, providerRequestId: providerResult.requestId || null };
  }

  const order = providerResult.order;
  let capture;
  try {
    capture = await captureStripePaymentIntent(submittedPaymentId, `skandi_capture_${loaded.row.cart_id}`.slice(0, 255));
  } catch (error) {
    const updated = await markBookingReconciliationRequired(context, loaded.row, {
      kind: "PAYMENT_CAPTURE_REQUIRED",
      code: safeCode(error?.code),
      airOrder: order,
      supplierOrderId: order.id,
      customerPaymentCaptureRequired: true,
      paymentStatus: "capture_required"
    });
    throw bookingError("BOOKING_RECONCILIATION_REQUIRED", `The airline booking exists but payment capture requires reconciliation. Do not pay again. Cart: ${updated.cart_id}`, 409);
  }
  if (capture.status !== "succeeded") {
    const updated = await markBookingReconciliationRequired(context, loaded.row, {
      kind: "PAYMENT_CAPTURE_REQUIRED",
      code: "PAYMENT_CAPTURE_NOT_COMPLETE",
      airOrder: order,
      customerPaymentCaptureRequired: true,
      paymentStatus: capture.status || "capture_pending"
    });
    throw bookingError("BOOKING_RECONCILIATION_REQUIRED", `The airline booking exists but payment capture is incomplete. Do not pay again. Cart: ${updated.cart_id}`, 409);
  }

  const payload = {
    ...(loaded.row.payload || {}),
    airOrder: order,
    order,
    bookingReference: order.bookingReference || loaded.row.cart_id,
    paymentIntentId: submittedPaymentId,
    payment: { ...payment, status: "succeeded", capturedAt: nowIso() },
    reconciliation: null,
    flow: { ...(loaded.row.payload?.flow || {}), currentStep: "confirmation", confirmedAt: nowIso() }
  };
  const updated = await updateOwnedCart(context, loaded.row.cart_id, { status: "Confirmed", payload });
  recordPaymentEventOnce({
    eventId: submittedPaymentId,
    provider: "Stripe",
    memberId: context.memberId,
    bookingId: loaded.row.cart_id,
    amount: updated.total,
    currency: updated.currency,
    status: "succeeded",
    payload: { duffelOrderId: order.id, bookingReference: order.bookingReference }
  }).catch(() => {});
  return { ...confirmedResult(updated), recoveredExistingOrder: providerResult.recoveredExistingOrder === true };
}

export async function reconcileBookingCore(context, input = {}) {
  const row = await requireOwnedCart(context, input.cartId);
  if (row.status === "Confirmed") return { resolved: true, cart: toPublicCart(row) };
  if (row.status !== "ReconciliationRequired") throw bookingError("RECONCILIATION_NOT_REQUIRED", "This booking is not awaiting reconciliation.", 409);
  if (upper(row.payload?.productType, 40).includes("FLIGHT")) {
    const result = await reconcileFlightCart(context, row);
    return { ...result, cart: toPublicCart(result.cart) };
  }
  return { resolved: false, cart: toPublicCart(row), message: "This supplier booking is awaiting provider/webhook reconciliation." };
}

export async function loadBookingConfirmationCore(context, input = {}) {
  let row = await requireOwnedCart(context, input.cartId);
  if (row.status !== "Confirmed") throw bookingError("BOOKING_NOT_CONFIRMED", "This booking is not confirmed yet.", 409);
  if (row.payload?.airOrder?.id) row = await refreshConfirmedAirOrder(context, row);
  if (row.payload?.stayBooking?.id) {
    const stay = await getDuffelStayBookingCore({ bookingId: row.payload.stayBooking.id });
    row = await updateOwnedCart(context, row.cart_id, { payload: { ...(row.payload || {}), stayBooking: stay.booking } });
  }
  return confirmationFromRow(row);
}

export async function loadBookingDocumentsCore(context, input = {}) {
  const confirmation = await loadBookingConfirmationCore(context, input);
  const row = await requireOwnedCart(context, input.cartId);
  const order = row.payload?.airOrder || {};
  return {
    cartId: row.cart_id,
    provider: "Duffel",
    documents: {
      confirmation,
      itinerary: { title: "SKANDI itinerary", bookingReference: confirmation.bookingReference, orderId: order.id || null, status: confirmation.status, slices: arr(order.slices) },
      eTickets: {
        title: "Airline ticket documents",
        documents: arr(order.documents).map(d => ({ id: d.id, type: d.type, ticketNumber: d.uniqueIdentifier, passengerIds: arr(d.passengerIds) })),
        note: arr(order.documents).length ? "Ticket identifiers supplied by the airline are shown below." : "No airline ticket document has been issued yet."
      }
    }
  };
}

function flattenSegments(slices) {
  return arr(slices).flatMap(slice => arr(slice.segments).map(segment => ({
    origin: segment.origin?.iataCode,
    destination: segment.destination?.iataCode,
    marketingCarrier: segment.marketingCarrier,
    operatingCarrier: segment.operatingCarrier,
    operatingCarrierDisplayName: segment.operatingCarrierDisplayName || segment.operatingCarrier?.name || null,
    flightNumber: segment.marketingFlightNumber,
    operatingFlightNumber: segment.operatingFlightNumber,
    departingAt: segment.departingAt,
    arrivingAt: segment.arrivingAt,
    date: String(segment.departingAt || "").slice(0, 10),
    bookingClass: slice.fareBrandName || ""
  })));
}
function confirmedResult(row) {
  const air = row?.payload?.airOrder || {};
  const stay = row?.payload?.stayBooking || {};
  return { cartId: row?.cart_id || "", bookingReference: row?.payload?.bookingReference || air.bookingReference || stay.reference || "", orderId: air.id || stay.id || "", status: row?.status || "Confirmed" };
}
function confirmationFromRow(row) {
  const air = row.payload?.airOrder || {};
  const stay = row.payload?.stayBooking || {};
  const selectedOffer = row.payload?.selectedOffer || {};
  return {
    cartId: row.cart_id,
    title: row.payload?.productType === "HOTEL_ONLY" ? "Your hotel is confirmed" : "Your trip is confirmed",
    summary: selectedOffer.summary || stay.accommodation?.name || "Your SKANDI booking is confirmed.",
    bookingReference: row.payload?.bookingReference || air.bookingReference || stay.reference || row.cart_id,
    pnrLocator: air.bookingReference || stay.reference || "",
    orderId: air.id || stay.id || "",
    confirmationType: row.payload?.productType || "SKANDI booking",
    status: row.status,
    seatSummary: Object.values(record(row.payload?.seatSelections)).map(s => s?.designator).filter(Boolean).join(", ") || "Not selected",
    segments: flattenSegments(air.slices),
    stayBooking: stay.id ? stay : null
  };
}

// -------- Ground discovery + hotel customer booking --------
async function resolveGroundLocation(input = {}) {
  const explicitLat = Number(input.latitude);
  const explicitLon = Number(input.longitude);
  if (Number.isFinite(explicitLat) && Number.isFinite(explicitLon) && Math.abs(explicitLat) <= 90 && Math.abs(explicitLon) <= 180 && (explicitLat !== 0 || explicitLon !== 0)) {
    return { latitude: explicitLat, longitude: explicitLon, label: text(input.label || input.locationText || "Location", 160), iata: upper(input.iata, 3) };
  }
  const needleRaw = text(input.iata || input.locationId || input.locationText || input.destination || input.destinationSlug, 180);
  if (!needleRaw) throw bookingError("LOCATION_REQUIRED", "Choose a destination, airport, pickup or drop-off location.");
  const needle = lower(needleRaw, 180);
  const iataNeedle = upper(needleRaw, 3);
  const airports = arr(await restRequest({ table: AIRPORTS, query: { select: "iata,title,locationCity,country,latitude,longitude,active,published,customer_visible", limit: 500 } }));
  const usable = airports.filter(r => Number.isFinite(Number(r.latitude)) && Number.isFinite(Number(r.longitude)) && (Number(r.latitude) !== 0 || Number(r.longitude) !== 0));
  let airport = usable.find(r => upper(r.iata, 3) === iataNeedle) || usable.find(r => [r.locationCity, r.title, r.country, r.iata].map(v => lower(v, 200)).join(" ").includes(needle));
  if (airport) return { latitude: Number(airport.latitude), longitude: Number(airport.longitude), label: text(airport.locationCity || airport.title || airport.iata, 160), iata: upper(airport.iata, 3) };
  const destinations = arr(await restRequest({ table: DESTINATIONS, query: { select: "id,public_id,code,name,slug,details", entity_type: "eq.DESTINATION", active: "eq.true", limit: 500 } }));
  const dest = destinations.find(r => [r.code, r.slug, r.public_id, r.name].map(v => lower(v, 220)).includes(needle)) || destinations.find(r => [r.code, r.slug, r.public_id, r.name].map(v => lower(v, 220)).join(" ").includes(needle));
  if (dest) {
    const d = record(dest.details);
    const lat = Number(d.latitude), lon = Number(d.longitude);
    if (Number.isFinite(lat) && Number.isFinite(lon) && (lat !== 0 || lon !== 0)) return { latitude: lat, longitude: lon, label: text(dest.name, 160), iata: upper(d.searchAirportIata, 3) };
    const fallback = usable.find(r => upper(r.iata, 3) === upper(d.searchAirportIata, 3));
    if (fallback) return { latitude: Number(fallback.latitude), longitude: Number(fallback.longitude), label: text(dest.name, 160), iata: upper(fallback.iata, 3) };
  }
  throw bookingError("LOCATION_NOT_FOUND", "That location is not yet mapped to coordinates in SKANDI Inventory/Travel Info.");
}

export async function searchLiveStaysCore(input = {}) {
  const location = arr(input.accommodationIds).length || input.accommodationId ? null : await resolveGroundLocation(input.location || input);
  const result = await searchDuffelStaysCore({ ...input, ...(location ? { location } : {}) });
  return { provider: "Duffel", ...result, location };
}
export async function fetchStayRatesCore(input = {}) { return fetchDuffelStayRatesCore(input); }
export async function quoteStayCore(input = {}) { return quoteDuffelStayCore(input); }

export async function createHotelCartCore(context, input = {}) {
  requireMemberContext(context);
  const quoted = await getDuffelStayQuoteCore({ quoteId: input.quoteId });
  const quote = quoted.quote;
  if (!quote?.id) throw bookingError("STAY_QUOTE_REQUIRED", "The hotel quote could not be found.");
  const payload = {
    version: 3,
    provider: "Duffel",
    productType: "HOTEL_ONLY",
    stayQuote: quote,
    stayBooking: null,
    travelers: [],
    secureTravelers: null,
    search: {
      origin: upper(input.origin || input.destinationIata, 3) || null,
      destination: upper(input.destination || input.destinationIata, 3) || null,
      departureDate: quote.checkInDate || input.checkInDate || null,
      returnDate: quote.checkOutDate || input.checkOutDate || null
    },
    flow: { currentStep: "apis", createdAt: nowIso() }
  };
  const row = await createOwnedCart(context, {
    email: context.email,
    status: "TravelersPending",
    currency: quote.totalCurrency,
    subtotal: decimal(quote.totalAmount),
    taxes: decimal(quote.taxAmount),
    total: decimal(quote.totalAmount),
    payload,
    source: "customer"
  });
  await addCartItem(row.cart_id, { itemType: "hotel", itemId: quote.id, title: quote.accommodation?.name || "Hotel", quantity: 1, unitPrice: quote.totalAmount, total: quote.totalAmount, payload: { provider: "Duffel", quoteId: quote.id, accommodation: quote.accommodation } });
  return { cartId: row.cart_id, step: "apis" };
}

export async function saveHotelGuestsCore(context, input = {}) {
  const row = await requireOwnedCart(context, input.cartId);
  assertEditable(row);
  const guests = arr(input.guests).map((g, i) => ({
    id: text(g.id || `HOTEL_GUEST_${i + 1}`, 80),
    givenName: text(g.givenName || g.firstName, 80),
    familyName: text(g.familyName || g.lastName, 80),
    bornOn: text(g.bornOn || g.dateOfBirth, 10) || null,
    nationality: upper(g.nationality || g.nationalityCode, 2) || null,
    gender: lower(g.gender, 5) || null,
    identityDocuments: arr(g.identityDocuments)
  })).filter(g => g.givenName && g.familyName);
  if (!guests.length) throw bookingError("GUEST_REQUIRED", "Add at least one hotel guest.");
  const contact = { email: lower(input.email || context.email, 254), phoneNumber: text(input.phoneNumber || input.phone, 20) };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) throw bookingError("INVALID_EMAIL", "Enter a valid email address.");
  if (!/^\+[1-9]\d{7,14}$/.test(contact.phoneNumber)) throw bookingError("INVALID_PHONE", "Enter an international phone number.");
  const secure = await encryptBookingData({ guests, contact });
  const triggerTravelers = guests.map(g => ({ givenName: g.givenName, familyName: g.familyName, dateOfBirth: g.bornOn, nationality: g.nationality, gender: g.gender, paxType: "ADT" }));
  const payload = { ...(row.payload || {}), secureTravelers: secure, travelers: triggerTravelers, travelerCount: guests.length, flow: { ...(row.payload?.flow || {}), currentStep: "payment" } };
  const updated = await updateOwnedCart(context, row.cart_id, { email: contact.email, status: "PaymentReady", payload });
  return { cart: toPublicCart(updated) };
}

export async function prepareHotelPaymentCore(context, input = {}) {
  const row = await requireOwnedCart(context, input.cartId);
  if (row.payload?.productType !== "HOTEL_ONLY") throw bookingError("INVALID_PRODUCT_TYPE", "This is not a hotel checkout.");
  if (!row.payload?.secureTravelers) throw bookingError("GUEST_REQUIRED", "Save hotel guest details before payment.");
  const quoteResult = await getDuffelStayQuoteCore({ quoteId: row.payload?.stayQuote?.id });
  const quote = quoteResult.quote;
  const amountMinor = duffelAmountToMinor(quote.totalAmount, quote.totalCurrency);
  const intent = await createStripePaymentIntent({
    amount: amountMinor,
    currency: quote.totalCurrency,
    manualCapture: true,
    idempotencyKey: `skandi_hotel_${row.cart_id}_${amountMinor}`.slice(0, 255),
    description: `SKANDI hotel ${quote.id}`,
    metadata: { integration: "skandi_duffel_stays", cart_id: row.cart_id, quote_id: quote.id }
  });
  const publishableKey = await getStripePublishableKey();
  const payload = {
    ...(row.payload || {}),
    stayQuote: quote,
    paymentIntentId: intent.id,
    payment: { paymentIntentId: intent.id, amount: quote.totalAmount, amountMinor, currency: quote.totalCurrency, status: intent.status, captureMethod: "manual", preparedAt: nowIso() },
    flow: { ...(row.payload?.flow || {}), currentStep: "payment" }
  };
  const updated = await updateOwnedCart(context, row.cart_id, { status: "PaymentPending", currency: quote.totalCurrency, subtotal: decimal(quote.totalAmount), taxes: decimal(quote.taxAmount), total: decimal(quote.totalAmount), payload });
  return { cart: toPublicCart(updated), payment: { paymentIntentId: intent.id, clientSecret: intent.client_secret, publishableKey, amount: quote.totalAmount, currency: quote.totalCurrency, status: intent.status, captureMethod: "manual" } };
}

export async function commitHotelBookingCore(context, input = {}) {
  if (input.termsAccepted !== true) throw bookingError("TERMS_REQUIRED", "Accept the booking and payment terms before continuing.");
  let row = await requireOwnedCart(context, input.cartId);
  if (row.status === "Confirmed") return confirmedResult(row);
  if (row.status === "ReconciliationRequired") throw bookingError("BOOKING_RECONCILIATION_REQUIRED", "This hotel booking is being reconciled. Do not pay or book again.", 409);
  if (row.payload?.productType !== "HOTEL_ONLY") throw bookingError("INVALID_PRODUCT_TYPE", "This is not a hotel checkout.");
  const payment = row.payload?.payment || {};
  const paymentIntentId = text(input.paymentIntentId, 180);
  if (!payment.paymentIntentId || payment.paymentIntentId !== paymentIntentId) throw bookingError("PAYMENT_REFERENCE_MISMATCH", "The payment authorization does not match this hotel booking.", 409);
  if (row.status === "PaymentPending") {
    const claimed = await transitionOwnedCart(context, row.cart_id, "PaymentPending", "Committing");
    row = await requireOwnedCart(context, row.cart_id);
    if (!claimed && row.status !== "Committing") throw bookingError("BOOKING_COMMIT_CONFLICT", "This booking is already being processed.", 409);
  }
  const intent = await retrieveStripePaymentIntent(paymentIntentId);
  assertStripeAuthorization(intent, { amount: payment.amountMinor, currency: payment.currency, metadata: { cart_id: row.cart_id }, allowCaptured: true });
  const secure = await decryptBookingData(row.payload.secureTravelers);
  const guests = arr(secure?.guests);
  const contact = secure?.contact || {};
  let provider;
  try {
    provider = await createDuffelStayBookingCore({
      quoteId: row.payload.stayQuote.id,
      guests,
      email: contact.email,
      phoneNumber: contact.phoneNumber,
      specialRequests: input.specialRequests,
      loyaltyProgrammeAccountNumber: input.loyaltyProgrammeAccountNumber,
      internalReference: row.cart_id,
      integration: "skandi_customer"
    });
  } catch (error) {
    if (["DUFFEL_TIMEOUT", "DUFFEL_HTTP_500", "DUFFEL_HTTP_502", "DUFFEL_HTTP_503", "DUFFEL_HTTP_504"].includes(String(error?.code || ""))) {
      const updated = await markBookingReconciliationRequired(context, row, { kind: "STAY_BOOKING_OUTCOME_UNKNOWN", code: safeCode(error.code), providerRequestId: error.providerRequestId, correlationId: error.correlationId });
      throw bookingError("BOOKING_RECONCILIATION_REQUIRED", `The hotel booking outcome is being reconciled. Do not retry. Cart: ${updated.cart_id}`, 409);
    }
    try { await cancelStripePaymentIntent(paymentIntentId, `skandi_hotel_void_${row.cart_id}`.slice(0, 255)); } catch (_) {}
    await updateOwnedCart(context, row.cart_id, { status: "PaymentReady", payload: { ...(row.payload || {}), payment: { ...payment, status: "authorization_released" } } });
    throw error;
  }
  if (provider.reconciliationRequired || !provider.booking?.id) {
    const updated = await markBookingReconciliationRequired(context, row, { kind: "STAY_BOOKING_PENDING", code: "DUFFEL_STAY_PENDING", providerRequestId: provider.requestId, correlationId: provider.correlationId, providerStatus: provider.providerStatus });
    return { cartId: updated.cart_id, status: updated.status, reconciliationRequired: true };
  }
  let capture;
  try { capture = await captureStripePaymentIntent(paymentIntentId, `skandi_hotel_capture_${row.cart_id}`.slice(0, 255)); }
  catch (error) {
    const updated = await markBookingReconciliationRequired(context, row, { kind: "PAYMENT_CAPTURE_REQUIRED", code: safeCode(error?.code), supplierOrderId: provider.booking.id, customerPaymentCaptureRequired: true, paymentStatus: "capture_required" });
    await updateOwnedCart(context, updated.cart_id, { payload: { ...(updated.payload || {}), stayBooking: provider.booking } });
    throw bookingError("BOOKING_RECONCILIATION_REQUIRED", `The hotel is booked but payment capture requires reconciliation. Do not pay again. Cart: ${updated.cart_id}`, 409);
  }
  if (capture.status !== "succeeded") throw bookingError("PAYMENT_CAPTURE_NOT_COMPLETE", "The hotel is booked but customer payment capture is incomplete. Contact SKANDI.", 409);
  const booking = provider.booking;
  const payload = {
    ...(row.payload || {}),
    stayBooking: booking,
    bookingReference: booking.reference || row.cart_id,
    paymentIntentId,
    payment: { ...payment, status: "succeeded", capturedAt: nowIso() },
    reconciliation: null,
    flow: { ...(row.payload?.flow || {}), currentStep: "confirmation", confirmedAt: nowIso() }
  };
  const updated = await updateOwnedCart(context, row.cart_id, { status: "Confirmed", payload });
  recordPaymentEventOnce({ eventId: paymentIntentId, provider: "Stripe", memberId: context.memberId, bookingId: row.cart_id, amount: row.total, currency: row.currency, status: "succeeded", payload: { duffelStayBookingId: booking.id, bookingReference: booking.reference } }).catch(() => {});
  return confirmedResult(updated);
}

export async function searchLiveCarsCore(input = {}) {
  const pickup = await resolveGroundLocation(input.pickupLocation || { iata: input.pickupIata, locationText: input.pickupLocationText });
  const dropoff = input.sameLocation === false ? await resolveGroundLocation(input.dropoffLocation || { iata: input.dropoffIata, locationText: input.dropoffLocationText }) : pickup;
  return searchDuffelCarsCore({ ...input, pickupLocation: pickup, dropoffLocation: dropoff });
}
export async function quoteCarCore(input = {}) { return quoteDuffelCarCore(input); }
export async function getCarQuoteCore(input = {}) { return getDuffelCarQuoteCore(input); }
export async function createCustomerCarBookingCore() {
  throw bookingError(
    "CUSTOMER_CAR_COMMIT_REQUIRES_B007",
    "Car search and pricing are live, but customer car booking is intentionally not activated until the canonical ALTEA handoff stores the confirmed car component.",
    409
  );
}
