// /src/backend/SKANDI_CORE/duffelAir.js
// SKANDI Backend Base 1.0 — B-005R1 canonical Duffel Air provider core.
// Pure provider-domain logic: no Wix page methods, no staff/customer auth, no Supabase/ALTEA writes.
// Customer money is authorized through stripeClient and captured only by the higher booking/orchestration layer.

import { duffelRequest, getDuffelEnvironment, ProviderError } from "backend/SKANDI_CORE/duffelClient.js";
import {
  createStripePaymentIntent,
  retrieveStripePaymentIntent,
  getStripePublishableKey,
  assertStripeAuthorization,
  updateStripePaymentIntentMetadata
} from "backend/SKANDI_CORE/stripeClient.js";

const CABINS = new Set(["economy", "premium_economy", "business", "first"]);
const ZERO_DECIMAL_CURRENCIES = new Set([
  "BIF","CLP","DJF","GNF","JPY","KMF","KRW","MGA","PYG","RWF","UGX","VND","VUV","XAF","XOF","XPF"
]);

function arr(v) { return Array.isArray(v) ? v : []; }
function clean(v, max = 500) { return String(v ?? "").trim().slice(0, max); }
function upper(v, max = 500) { return clean(v, max).toUpperCase(); }
function lower(v, max = 500) { return clean(v, max).toLowerCase(); }
function integer(v, min, max, fallback) {
  const n = Number(v);
  return Number.isInteger(n) && n >= min && n <= max ? n : fallback;
}
function error(code, message, status = 400) {
  const e = new Error(message);
  e.name = "DuffelAirError";
  e.code = code;
  e.status = status;
  e.publicMessage = message;
  return e;
}
function resourceId(value, prefix, label) {
  const id = clean(value, 220);
  if (!new RegExp(`^${prefix}[A-Za-z0-9_]+$`).test(id)) throw error("INVALID_RESOURCE_ID", `The ${label} reference is invalid.`);
  return id;
}
function genericId(value, label) {
  const id = clean(value, 220);
  if (!/^[A-Za-z0-9_:-]{5,220}$/.test(id)) throw error("INVALID_RESOURCE_ID", `The ${label} reference is invalid.`);
  return id;
}
function isoFutureDate(value, label) {
  const d = clean(value, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) throw error("INVALID_DATE", `The ${label} is invalid.`);
  const parsed = new Date(`${d}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== d || d < new Date().toISOString().slice(0, 10)) {
    throw error("INVALID_DATE", `The ${label} must be today or later.`);
  }
  return d;
}

export function duffelAmountToMinor(amount, currency) {
  const code = upper(currency, 3);
  const raw = clean(amount, 40);
  if (!/^[A-Z]{3}$/.test(code) || !/^\d+(?:\.\d+)?$/.test(raw)) throw error("INVALID_AMOUNT", "The provider amount is invalid.");
  if (ZERO_DECIMAL_CURRENCIES.has(code)) {
    const rounded = Math.round(Number(raw));
    if (!Number.isSafeInteger(rounded)) throw error("INVALID_AMOUNT", "The provider amount is too large.");
    return rounded;
  }
  const [whole, fraction = ""] = raw.split(".");
  const minor = Number(whole) * 100 + Number(`${fraction}00`.slice(0, 2));
  if (!Number.isSafeInteger(minor)) throw error("INVALID_AMOUNT", "The provider amount is too large.");
  return minor;
}

function normalizeLocation(place = {}) {
  return {
    id: place?.id || null,
    type: place?.type || null,
    iataCode: place?.iata_code || null,
    icaoCode: place?.icao_code || null,
    name: place?.name || null,
    cityName: place?.city_name || null,
    countryCode: place?.iata_country_code || place?.country_code || null,
    timeZone: place?.time_zone || null,
    latitude: Number.isFinite(Number(place?.latitude)) ? Number(place.latitude) : null,
    longitude: Number.isFinite(Number(place?.longitude)) ? Number(place.longitude) : null
  };
}

function normalizeCarrier(carrier = {}) {
  return {
    id: carrier?.id || null,
    name: carrier?.name || null,
    iataCode: carrier?.iata_code || null,
    icaoCode: carrier?.icao_code || null,
    logoSymbolUrl: carrier?.logo_symbol_url || null,
    logoLockupUrl: carrier?.logo_lockup_url || null
  };
}

function normalizeSegment(segment = {}) {
  return {
    id: segment.id || null,
    duration: segment.duration || null,
    departingAt: segment.departing_at || null,
    arrivingAt: segment.arriving_at || null,
    origin: normalizeLocation(segment.origin),
    destination: normalizeLocation(segment.destination),
    originTerminal: segment.origin_terminal || null,
    destinationTerminal: segment.destination_terminal || null,
    marketingCarrier: normalizeCarrier(segment.marketing_carrier),
    marketingFlightNumber: segment.marketing_carrier_flight_number || null,
    operatingCarrier: normalizeCarrier(segment.operating_carrier),
    operatingFlightNumber: segment.operating_carrier_flight_number || null,
    aircraft: segment.aircraft ? {
      id: segment.aircraft.id || null,
      iataCode: segment.aircraft.iata_code || null,
      name: segment.aircraft.name || null
    } : null
  };
}

function normalizeSlice(slice = {}) {
  return {
    id: slice.id || null,
    duration: slice.duration || null,
    origin: normalizeLocation(slice.origin),
    destination: normalizeLocation(slice.destination),
    fareBrandName: slice.fare_brand_name || null,
    segments: arr(slice.segments).map(normalizeSegment)
  };
}

function serviceLabel(service = {}) {
  if (service.type === "baggage") return service.metadata?.type || "Baggage";
  if (service.type === "seat") return service.metadata?.designator ? `Seat ${service.metadata.designator}` : "Seat";
  return service.type ? String(service.type).replace(/_/g, " ") : "Service";
}

function normalizeService(service = {}, labels = {}) {
  return {
    id: service.id || null,
    type: service.type || null,
    label: service.label || serviceLabel(service),
    totalAmount: service.total_amount ?? null,
    totalCurrency: service.total_currency ?? null,
    maximumQuantity: Number(service.maximum_quantity || 1),
    passengerId: service.passenger_id || service.passenger_ids?.[0] || null,
    passengerIds: arr(service.passenger_ids).length ? arr(service.passenger_ids) : (service.passenger_id ? [service.passenger_id] : []),
    passengerName: labels.passengerLabel || null,
    segmentId: service.segment_id || service.segment_ids?.[0] || null,
    segmentIds: arr(service.segment_ids).length ? arr(service.segment_ids) : (service.segment_id ? [service.segment_id] : []),
    segmentLabel: labels.segmentLabel || null
  };
}

function normalizeOffer(offer = {}) {
  const passengers = arr(offer.passengers).map(p => ({ id: p.id || null, type: p.type || null, age: Number.isInteger(p.age) ? p.age : null }));
  const passengerLabels = new Map(passengers.map((p, i) => [p.id, `Traveler ${i + 1}`]));
  return {
    id: offer.id || null,
    liveMode: offer.live_mode === true,
    createdAt: offer.created_at || null,
    expiresAt: offer.expires_at || null,
    isExpired: !offer.expires_at || Date.parse(offer.expires_at) <= Date.now(),
    totalAmount: offer.total_amount ?? null,
    totalCurrency: offer.total_currency ?? null,
    taxAmount: offer.tax_amount ?? null,
    taxCurrency: offer.tax_currency ?? null,
    owner: normalizeCarrier(offer.owner),
    passengers,
    requiresInstantPayment: offer.payment_requirements?.requires_instant_payment === true,
    paymentRequiredBy: offer.payment_requirements?.payment_required_by || null,
    priceGuaranteeExpiresAt: offer.payment_requirements?.price_guarantee_expires_at || null,
    identityDocumentRequired: offer.passenger_identity_documents_required === true,
    supportedIdentityDocumentTypes: arr(offer.supported_passenger_identity_document_types),
    conditions: offer.conditions || {},
    slices: arr(offer.slices).map(normalizeSlice),
    availableServices: arr(offer.available_services).map(s => normalizeService(s, {
      passengerLabel: arr(s.passenger_ids).map(id => passengerLabels.get(id) || id).join(", "),
      segmentLabel: arr(s.segment_ids).join(", ")
    }))
  };
}

function normalizeSeatMap(seatMap = {}) {
  const seats = [];
  for (const cabin of arr(seatMap.cabins)) {
    for (const row of arr(cabin.rows)) {
      for (const section of arr(row.sections)) {
        for (const element of arr(section.elements)) {
          if (element?.type !== "seat") continue;
          seats.push({
            designator: element.designator || null,
            cabinName: cabin.cabin_class_marketing_name || cabin.cabin_class || null,
            disclosures: arr(element.disclosures),
            availableServices: arr(element.available_services).map(s => ({
              ...normalizeService({ ...s, type: "seat", segment_id: seatMap.segment_id || s.segment_id }),
              label: `Seat ${element.designator || ""}`.trim()
            }))
          });
        }
      }
    }
  }
  return { id: seatMap.id || null, sliceId: seatMap.slice_id || null, segmentId: seatMap.segment_id || null, seats };
}

function normalizeOrder(order = {}) {
  const slices = arr(order.slices).map(normalizeSlice);
  return {
    id: order.id || null,
    bookingReference: order.booking_reference || null,
    bookingReferences: arr(order.booking_references),
    offerId: order.offer_id || null,
    type: order.type || null,
    status: order.cancelled_at ? "cancelled" : (order.type === "hold" && order.payment_status?.awaiting_payment ? "held" : "confirmed"),
    route: slices.map(s => `${s.origin?.iataCode || "—"}–${s.destination?.iataCode || "—"}`).join(" / "),
    createdAt: order.created_at || null,
    cancelledAt: order.cancelled_at || null,
    syncedAt: order.synced_at || null,
    paymentRequiredBy: order.payment_required_by || null,
    priceGuaranteedExpiresAt: order.price_guaranteed_expires_at || null,
    totalAmount: order.total_amount ?? null,
    totalCurrency: order.total_currency ?? null,
    passengerCount: arr(order.passengers).length,
    availableActions: arr(order.available_actions),
    slices,
    passengers: arr(order.passengers).map(p => ({
      id: p.id || null, givenName: p.given_name || null, familyName: p.family_name || null,
      bornOn: p.born_on || null, gender: p.gender || null, title: p.title || null
    })),
    documents: arr(order.documents).map(d => ({ id: d.id || null, type: d.type || null, uniqueIdentifier: d.unique_identifier || null, passengerIds: arr(d.passenger_ids) })),
    confirmationDeliveryPolicy: upper(order.metadata?.confirmation_delivery_policy || "SKANDI", 20)
  };
}

function normalizeCancellation(c = {}) {
  return {
    id: c.id || null, orderId: c.order_id || null, confirmedAt: c.confirmed_at || null,
    expiresAt: c.expires_at || null, refundAmount: c.refund_amount ?? null, refundCurrency: c.refund_currency ?? null
  };
}

function validateSearch(input = {}) {
  const slices = arr(input.slices);
  const passengers = arr(input.passengers);
  if (slices.length < 1 || slices.length > 2) throw error("INVALID_SLICES", "Use one or two flight slices.");
  if (passengers.length < 1 || passengers.length > 9) throw error("INVALID_PASSENGERS", "Use between one and nine travelers.");
  const normalizedSlices = slices.map(s => {
    const origin = upper(s.origin, 3), destination = upper(s.destination, 3);
    if (!/^[A-Z0-9]{3}$/.test(origin) || !/^[A-Z0-9]{3}$/.test(destination) || origin === destination) throw error("INVALID_ROUTE", "The flight route is invalid.");
    return { origin, destination, departure_date: isoFutureDate(s.departureDate || s.departure_date, "departure date") };
  });
  if (normalizedSlices[1] && normalizedSlices[1].departure_date < normalizedSlices[0].departure_date) throw error("INVALID_RETURN_DATE", "Return must be on or after departure.");
  const normalizedPassengers = passengers.map(p => p?.type ? { type: lower(p.type, 30) } : { age: integer(p?.age, 0, 17, null) });
  if (normalizedPassengers.some(p => p.type ? p.type !== "adult" : p.age === null)) throw error("INVALID_PASSENGER", "The passenger request is invalid.");
  const adults = normalizedPassengers.filter(p => p.type === "adult").length;
  const infants = normalizedPassengers.filter(p => Number.isInteger(p.age) && p.age < 2).length;
  if (adults < 1 || infants > adults) throw error("INVALID_PASSENGER_MIX", "At least one adult is required and each infant needs a separate adult.");
  const cabin = lower(input.cabinClass || input.cabin_class || "economy", 30);
  if (!CABINS.has(cabin)) throw error("INVALID_CABIN_CLASS", "Choose a supported cabin class.");
  return {
    slices: normalizedSlices,
    passengers: normalizedPassengers,
    cabin_class: cabin,
    max_connections: integer(input.maxConnections ?? input.max_connections, 0, 2, 1),
    supplierTimeout: integer(input.supplierTimeout ?? input.supplier_timeout, 2000, 60000, 15000)
  };
}

function validateServices(value) {
  if (value == null) return [];
  if (!Array.isArray(value) || value.length > 36) throw error("INVALID_SERVICES", "The selected services are invalid.");
  const seen = new Set();
  return value.map(s => {
    const id = resourceId(s?.id, "ase_", "service");
    if (seen.has(id)) throw error("DUPLICATE_SERVICE", "The same service cannot be selected twice.");
    seen.add(id);
    return { id, quantity: integer(s?.quantity, 1, 9, 1) };
  });
}

async function getRawOffer(offerId, { services = false } = {}) {
  const id = resourceId(offerId, "off_", "offer");
  const response = await duffelRequest(`/air/offers/${encodeURIComponent(id)}`, {
    query: services ? { return_available_services: true } : {}, retrySafe: true
  });
  if (!response.data?.id) throw error("OFFER_NOT_FOUND", "The airline offer could not be retrieved.", 404);
  return response.data;
}

async function priceRawOffer(offerId, services = []) {
  const id = resourceId(offerId, "off_", "offer");
  const intended = validateServices(services);
  const response = await duffelRequest(`/air/offers/${encodeURIComponent(id)}/actions/price`, {
    method: "POST", retrySafe: false,
    body: { data: { intended_services: intended } }
  });
  if (!response.data?.id) throw error("OFFER_PRICE_FAILED", "The airline could not refresh the selected price.");
  return response.data;
}

function toOrderPassenger(p = {}) {
  const id = resourceId(p.id, "pas_", "traveler");
  const out = {
    id,
    title: lower(p.title, 10), gender: lower(p.gender, 5),
    given_name: clean(p.givenName || p.given_name, 80), family_name: clean(p.familyName || p.family_name, 80),
    born_on: clean(p.bornOn || p.born_on, 10),
    email: lower(p.email, 254), phone_number: clean(p.phoneNumber || p.phone_number, 30)
  };
  if (!out.given_name || !out.family_name || !/^\d{4}-\d{2}-\d{2}$/.test(out.born_on)) throw error("INVALID_PASSENGER", "Traveler details are incomplete.");
  const docs = arr(p.identityDocuments || p.identity_documents).map(d => ({
    type: lower(d.type || "passport", 40),
    unique_identifier: upper(d.uniqueIdentifier || d.unique_identifier || d.number, 50),
    issuing_country_code: upper(d.issuingCountryCode || d.issuing_country_code, 2),
    expires_on: clean(d.expiresOn || d.expires_on, 10)
  }));
  if (docs.length) out.identity_documents = docs;
  return out;
}

export async function getDuffelWorkspaceBootstrapCore() {
  const [environment, orders] = await Promise.all([
    getDuffelEnvironment(),
    listDuffelOrdersCore({ limit: 50 }).catch(() => ({ orders: [] }))
  ]);
  return { environment, defaultCurrency: "USD", orders: orders.orders || [] };
}

export async function searchDuffelOffersCore(input = {}) {
  const q = validateSearch(input);
  const response = await duffelRequest("/air/offer_requests", {
    method: "POST",
    query: { return_offers: true, view: "offers", supplier_timeout: q.supplierTimeout },
    body: { data: { slices: q.slices, passengers: q.passengers, cabin_class: q.cabin_class, max_connections: q.max_connections } },
    timeoutMs: Math.max(30000, q.supplierTimeout + 12000),
    retrySafe: false
  });
  const data = response.data || {};
  return {
    offerRequestId: data.id || null,
    offers: arr(data.offers).filter(o => !o.partial).map(normalizeOffer),
    requestId: response.requestId || null,
    providerRequestId: response.requestId || null,
    correlationId: response.correlationId || null,
    rateLimit: response.rateLimit || null
  };
}

export async function refreshDuffelOfferCore({ offerId } = {}) {
  return { offer: normalizeOffer(await getRawOffer(offerId, { services: true })) };
}

export async function priceDuffelOfferCore({ offerId, services = [] } = {}) {
  return { offer: normalizeOffer(await priceRawOffer(offerId, services)) };
}

export async function getDuffelSeatMapsCore({ offerId } = {}) {
  const id = resourceId(offerId, "off_", "offer");
  const response = await duffelRequest("/air/seat_maps", { query: { offer_id: id }, retrySafe: true });
  return { seatMaps: arr(response.data).map(normalizeSeatMap) };
}

export async function prepareDuffelPaymentCore(input = {}) {
  const services = validateServices(input.services);
  const raw = await priceRawOffer(input.offerId, services);
  const offer = normalizeOffer(raw);
  const amount = duffelAmountToMinor(offer.totalAmount, offer.totalCurrency);
  const idempotencyContext = clean(input.idempotencyContext || offer.id, 120);
  const intent = await createStripePaymentIntent({
    amount,
    currency: offer.totalCurrency,
    captureMethod: "manual",
    idempotencyContext,
    idempotencyKey: `skandi_auth_${idempotencyContext}_${amount}_${lower(offer.totalCurrency, 3)}`.slice(0, 255),
    metadata: {
      integration: "skandi_duffel_air",
      offer_id: offer.id,
      idempotency_context: idempotencyContext,
      selection_signature: services.map(s => `${s.id}:${s.quantity}`).sort().join("|")
    }
  });
  const publishableKey = await getStripePublishableKey();
  return {
    payment: {
      paymentIntentId: intent.id,
      clientSecret: intent.client_secret,
      publishableKey,
      amount: offer.totalAmount,
      currency: offer.totalCurrency,
      status: intent.status,
      captureMethod: intent.capture_method || "manual"
    },
    offer
  };
}

export async function listDuffelOrdersCore(input = {}) {
  const response = await duffelRequest("/air/orders", {
    query: { limit: integer(input.limit, 1, 200, 50), sort: "-created_at", ...(input.offerId ? { offer_id: resourceId(input.offerId, "off_", "offer") } : {}) },
    retrySafe: true
  });
  return { orders: arr(response.data).map(normalizeOrder), page: response.meta || null };
}

export async function getDuffelOrderCore(input = {}) {
  const ref = clean(input.orderIdOrReference || input.orderId || input.bookingReference, 100);
  if (!ref) throw error("ORDER_REFERENCE_REQUIRED", "Enter a Duffel order ID or booking reference.");
  if (ref.startsWith("ord_")) {
    const response = await duffelRequest(`/air/orders/${encodeURIComponent(resourceId(ref, "ord_", "order"))}`, { retrySafe: true });
    if (!response.data?.id) throw error("ORDER_NOT_FOUND", "No Duffel order matches that reference.", 404);
    return { order: normalizeOrder(response.data) };
  }
  const bookingReference = upper(ref, 20);
  if (!/^[A-Z0-9-]{2,20}$/.test(bookingReference)) throw error("INVALID_BOOKING_REFERENCE", "The booking reference format is invalid.");
  const response = await duffelRequest("/air/orders", { query: { limit: 20, booking_reference: bookingReference, sort: "-created_at" }, retrySafe: true });
  const order = arr(response.data).find(o => upper(o.booking_reference, 20) === bookingReference);
  if (!order) throw error("ORDER_NOT_FOUND", "No Duffel order matches that booking reference.", 404);
  return { order: normalizeOrder(order) };
}

export async function getDuffelOrderByOfferCore({ offerId } = {}) {
  const id = resourceId(offerId, "off_", "offer");
  const response = await duffelRequest("/air/orders", { query: { limit: 5, offer_id: id, sort: "-created_at" }, retrySafe: true });
  const order = arr(response.data)[0] || null;
  return { order: order ? normalizeOrder(order) : null };
}

export async function createDuffelOrderCore(input = {}) {
  const offerId = resourceId(input.offerId, "off_", "offer");
  const orderType = lower(input.orderType || "instant", 20);
  if (!new Set(["instant", "hold"]).has(orderType)) throw error("INVALID_ORDER_TYPE", "Choose instant purchase or hold.");
  const services = validateServices(input.services);
  const rawOffer = await priceRawOffer(offerId, services);
  const offer = normalizeOffer(rawOffer);

  const existing = await getDuffelOrderByOfferCore({ offerId });
  if (existing.order?.id) return { order: existing.order, recoveredExistingOrder: true };

  const data = {
    type: orderType,
    selected_offers: [offerId],
    passengers: arr(input.passengers).map(toOrderPassenger),
    metadata: {
      integration: "skandi_duffel",
      confirmation_delivery_policy: upper(input.confirmationDeliveryPolicy || "SKANDI", 20),
      ...(clean(input.internalReference, 100) ? { internal_reference: clean(input.internalReference, 100) } : {})
    }
  };

  if (orderType === "hold") {
    if (offer.requiresInstantPayment) throw error("HOLD_NOT_AVAILABLE", "The airline requires immediate payment for this offer.");
    if (services.length) throw error("HOLD_SERVICES_NOT_AVAILABLE", "Paid seats and baggage cannot be added while creating a hold order.");
  } else {
    const paymentIntentId = resourceId(input.paymentIntentId, "pi_", "payment");
    const intent = await retrieveStripePaymentIntent(paymentIntentId);
    const internalReference = clean(input.internalReference || "", 120);
    assertStripeAuthorization(intent, {
      amount: duffelAmountToMinor(offer.totalAmount, offer.totalCurrency),
      currency: offer.totalCurrency,
      ...(internalReference ? { metadata: { idempotency_context: internalReference } } : {}),
      allowCaptured: false
    });
    data.services = services;
    data.payments = [{ type: "balance", amount: offer.totalAmount, currency: offer.totalCurrency }];
    data.metadata.payment_intent_id = paymentIntentId;
  }

  let response;
  try {
    response = await duffelRequest("/air/orders", { method: "POST", body: { data }, timeoutMs: 130000, retrySafe: false });
  } catch (err) {
    if (err instanceof ProviderError && err.outcomeUnknown) throw err;
    throw err;
  }

  if (response.status === 202 || !response.data?.id) {
    return {
      order: response.data?.id ? normalizeOrder(response.data) : null,
      recoveredExistingOrder: false,
      reconciliationRequired: true,
      providerStatus: response.status,
      requestId: response.requestId || null,
      providerRequestId: response.requestId || null,
      correlationId: response.correlationId || null
    };
  }

  if (input.paymentIntentId) {
    updateStripePaymentIntentMetadata(input.paymentIntentId, { duffel_order_id: response.data.id }, `skandi_duffel_order_${response.data.id}`).catch(() => {});
  }
  return {
    order: normalizeOrder(response.data),
    recoveredExistingOrder: false,
    reconciliationRequired: false,
    requestId: response.requestId || null,
    providerRequestId: response.requestId || null,
    correlationId: response.correlationId || null
  };
}

export async function createDuffelOrderCancellationCore({ orderId } = {}) {
  const id = resourceId(orderId, "ord_", "order");
  const current = await getDuffelOrderCore({ orderIdOrReference: id });
  if (!arr(current.order?.availableActions).includes("cancel")) throw error("CANCELLATION_NOT_AVAILABLE", "The airline does not currently allow API cancellation for this order.");
  const response = await duffelRequest("/air/order_cancellations", { method: "POST", body: { data: { order_id: id } }, retrySafe: false });
  return { cancellation: normalizeCancellation(response.data || {}) };
}

export async function confirmDuffelOrderCancellationCore({ cancellationId } = {}) {
  const id = genericId(cancellationId, "cancellation");
  const response = await duffelRequest(`/air/order_cancellations/${encodeURIComponent(id)}/actions/confirm`, { method: "POST", retrySafe: false });
  if (response.status === 202 || !response.data) {
    return { cancellation: response.data ? normalizeCancellation(response.data) : null, order: null, reconciliationRequired: true, requestId: response.requestId || null, correlationId: response.correlationId || null };
  }
  const cancellation = normalizeCancellation(response.data);
  const order = cancellation.orderId ? (await getDuffelOrderCore({ orderIdOrReference: cancellation.orderId })).order : null;
  return { cancellation, order, customerRefundRequired: Number(cancellation.refundAmount || 0) > 0 };
}
