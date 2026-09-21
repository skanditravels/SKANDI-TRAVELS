// /src/backend/SKANDI_CORE/customerBooking.js
// SKANDI Backend Base 1.0 — B-010 canonical customer booking orchestration.
// Owns the single customer-facing search/cart boundary plus Air/Hotel/Cars checkout state.
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
} from "backend/SKANDI_CORE/duffelAir";
import {
  searchDuffelStaysCore,
  fetchDuffelStayRatesCore,
  quoteDuffelStayCore,
  getDuffelStayQuoteCore,
  createDuffelStayBookingCore,
  getDuffelStayBookingCore,
  searchDuffelCarsCore,
  quoteDuffelCarCore,
  getDuffelCarQuoteCore,
  createDuffelComponentClientKeyCore,
  createDuffelCarBookingCore,
  getDuffelCarBookingCore,
  cancelDuffelCarBookingCore
} from "backend/SKANDI_CORE/duffelGround";
import {
  createStripePaymentIntent,
  retrieveStripePaymentIntent,
  captureStripePaymentIntent,
  cancelStripePaymentIntent,
  getStripePublishableKey,
  assertStripeAuthorization
} from "backend/SKANDI_CORE/stripeClient";
import { restRequest } from "backend/SKANDI_CORE/supabaseServer";
import {
  createOwnedCart,
  getOwnedCart,
  getOwnedCartByOffer,
  listOwnedCarts,
  updateOwnedCart,
  transitionOwnedCart,
  addCartItem,
  recordPaymentEventOnce
} from "backend/SKANDI_CORE/bookingCart";
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
} from "backend/SKANDI_CORE/bookingMapper";
import { encryptBookingData, decryptBookingData } from "backend/SKANDI_CORE/bookingSecurity";
import {
  markBookingReconciliationRequired,
  voidUnusedAuthorization,
  reconcileFlightCart,
  refreshConfirmedAirOrder
} from "backend/SKANDI_CORE/bookingReconciliation";
import { text, upper, lower, record } from "backend/SKANDI_CORE/platformValidation";


const LOCKED_STATUSES = new Set(["Confirmed", "Committing", "CarCancellationPending", "ReconciliationRequired"]);
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
function numberValue(value) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}
function publicFlightItems(result = {}, search = {}) {
  return arr(result.items).map(item => ({
    ...item,
    source: "duffel",
    sourceLabel: "Live flight",
    itemType: "flight",
    tripType: text(search.tripType || "flightOnly", 40),
    price: {
      amount: numberValue(item.totalAmount ?? item.price?.amount ?? item.total),
      currency: upper(item.totalCurrency || item.price?.currency || search.currency || "USD", 3)
    },
    searchContext: item.searchContext || search
  }));
}
function publicStayItems(result = {}, search = {}) {
  return arr(result.items).map(item => ({
    ...item,
    source: "duffel",
    sourceLabel: "Live hotel",
    itemType: "hotel",
    tripType: text(search.tripType || "hotelOnly", 40),
    title: item.title || item.name || item.accommodation?.name || "Hotel",
    price: {
      amount: numberValue(item.total ?? item.cheapestRateTotalAmount),
      currency: upper(item.currency || item.cheapestRateTotalCurrency || search.currency || "USD", 3)
    },
    searchContext: item.searchContext || search
  }));
}


function roundMoney(value) {
  return Math.round((numberValue(value) + Number.EPSILON) * 100) / 100;
}
function expiryMin(values = [], fallbackMinutes = 25) {
  const valid = arr(values)
    .map(value => Date.parse(String(value || "")))
    .filter(value => Number.isFinite(value) && value > Date.now());
  const fallback = Date.now() + fallbackMinutes * 60 * 1000;
  return new Date(valid.length ? Math.min(...valid, fallback) : fallback).toISOString();
}
function packageSearchItems(flights = [], stays = [], search = {}) {
  const output = [];
  const sortedFlights = arr(flights).slice().sort((a, b) => numberValue(a.price?.amount) - numberValue(b.price?.amount)).slice(0, 10);
  const sortedStays = arr(stays).slice().sort((a, b) => numberValue(a.price?.amount) - numberValue(b.price?.amount)).slice(0, 12);
  for (const stay of sortedStays) {
    const stayCurrency = upper(stay.price?.currency || search.currency || "USD", 3);
    const flight = sortedFlights.find(candidate => upper(candidate.price?.currency || search.currency || "USD", 3) === stayCurrency);
    if (!flight) continue;
    const flightOfferId = text(flight.id || flight.offerId, 180);
    const staySearchResultId = text(stay.staySearchResultId || stay.id, 180);
    if (!flightOfferId || !staySearchResultId) continue;
    const total = roundMoney(numberValue(flight.price?.amount) + numberValue(stay.price?.amount));
    const departure = Date.parse(`${text(search.departureDate, 10)}T00:00:00Z`);
    const returning = Date.parse(`${text(search.returnDate, 10)}T00:00:00Z`);
    const nights = Number.isFinite(departure) && Number.isFinite(returning) && returning > departure
      ? Math.max(1, Math.round((returning - departure) / 86400000))
      : Math.max(1, Number(search.nights) || 7);
    output.push({
      id: `PKG-${flightOfferId}-${staySearchResultId}`,
      offerId: `PKG-${flightOfferId}-${staySearchResultId}`,
      itemType: "PACKAGE",
      productType: "PACKAGE",
      provider: "SKANDI",
      source: "SKANDI_PACKAGE",
      sourceLabel: "SKANDI Flight + Hotel",
      title: `${flight.routeSummary || flight.title || "Flight"} · ${stay.title || "Hotel"}`,
      summary: [`${nights} nights`, stay.title || "Hotel", flight.sourceLabel || "Live flight"].filter(Boolean).join(" · "),
      price: { amount: total, total, currency: stayCurrency },
      total,
      currency: stayCurrency,
      tripType: search.tripType === "signaturePackage" ? "signaturePackage" : "Flight + Hotel",
      flightOfferId,
      staySearchResultId,
      accommodationId: stay.accommodationId || null,
      imageUrl: stay.imageUrl || "",
      badges: ["Flight + Hotel", "Live pricing"],
      flight,
      stay,
      searchContext: search
    });
    if (output.length >= 20) break;
  }
  return output;
}
function isPackageCart(row = {}) {
  return upper(row?.payload?.productType, 40) === "PACKAGE" || upper(row?.payload?.productType, 40) === "MIXED_PACKAGE";
}
function airOfferIdForCart(row = {}) {
  const payload = record(row?.payload);
  return text(payload.flightOfferId || payload.selectedOffer?.id || payload.selectedOffer?.offerId || row?.selected_offer_id, 180);
}
function packageSelectionId(flightOfferId, staySearchResultId) {
  const flight = text(flightOfferId, 80);
  const stay = text(staySearchResultId, 80);
  return `PKG-${flight}-${stay}`.slice(0, 180);
}
async function quoteStaySearchResult(searchResultId, preferredRateId = "") {
  const ratesResult = await fetchDuffelStayRatesCore({ searchResultId });
  const rates = arr(ratesResult.rates).slice().sort((a, b) => numberValue(a.totalAmount) - numberValue(b.totalAmount));
  const rate = rates.find(item => text(item.rateId || item.id, 180) === text(preferredRateId, 180)) || rates[0];
  if (!rate?.id && !rate?.rateId) throw bookingError("STAY_RATE_REQUIRED", "No hotel room is currently available for this package.");
  const quoteResult = await quoteDuffelStayCore({ rateId: rate.rateId || rate.id });
  if (!quoteResult?.quote?.id) throw bookingError("STAY_QUOTE_REQUIRED", "The hotel quote could not be created.");
  return { quote: quoteResult.quote, rate, accommodation: ratesResult.accommodation || null };
}
async function priceAirAndPackageCart(row, services = []) {
  const offerId = airOfferIdForCart(row);
  if (!/^off_[A-Za-z0-9_]+$/.test(offerId)) throw bookingError("INVALID_OFFER_ID", "The selected flight offer is invalid.");
  const air = await priceDuffelOfferCore({ offerId, services });
  let currency = upper(air.offer.totalCurrency, 3);
  let subtotal = numberValue(air.offer.totalAmount);
  let taxes = numberValue(air.offer.taxAmount);
  const expiries = [air.offer.expiresAt];
  let stay = null;
  if (isPackageCart(row)) {
    const searchResultId = text(row.payload?.staySearchResultId, 180);
    if (!searchResultId) throw bookingError("STAY_SEARCH_RESULT_REQUIRED", "The hotel portion of this package is missing.");
    stay = await quoteStaySearchResult(searchResultId, row.payload?.stayRateId);
    const stayCurrency = upper(stay.quote.totalCurrency, 3);
    if (stayCurrency !== currency) throw bookingError("PACKAGE_CURRENCY_MISMATCH", "The flight and hotel are no longer available in the same currency.");
    subtotal += numberValue(stay.quote.totalAmount);
    taxes += numberValue(stay.quote.taxAmount);
    expiries.push(stay.quote.expiresAt);
  }
  return {
    offer: air.offer,
    stay,
    currency,
    subtotal: roundMoney(subtotal),
    taxes: roundMoney(taxes),
    total: roundMoney(subtotal),
    expiresAt: expiryMin(expiries)
  };
}
function packagePricingPayload(row, pricing) {
  const payload = {
    ...(row.payload || {}),
    flightOfferId: airOfferIdForCart(row),
    selectedOffer: mapOfferForCart(pricing.offer)
  };
  if (pricing.stay) {
    payload.stayRateId = pricing.stay.rate?.rateId || pricing.stay.rate?.id || payload.stayRateId || null;
    payload.stayQuote = pricing.stay.quote;
  }
  return payload;
}
function stayGuestsFromPassengers(passengers = []) {
  return arr(passengers).map(passenger => ({
    givenName: text(passenger.givenName, 80),
    familyName: text(passenger.familyName, 80)
  })).filter(guest => guest.givenName && guest.familyName);
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


function unifiedTripType(search = {}) {
  const explicit = text(search.tripType, 40);
  if (["flightOnly", "hotelOnly", "package", "signaturePackage", "localOnly", "carOnly"].includes(explicit)) return explicit;
  const product = lower(search.productType || search.product || search.mode, 60);
  const accommodation = lower(search.accommodationType, 60);
  if (product.includes("signature")) return "signaturePackage";
  if ((product.includes("flight") && product.includes("hotel")) || product.includes("holiday") || product.includes("package")) return "package";
  if (product.includes("flight")) return "flightOnly";
  if (product.includes("hotel") || accommodation === "hotel") return "hotelOnly";
  if (product.includes("car")) return "carOnly";
  return "package";
}


export async function searchUnifiedOffersCore(input = {}) {
  const search = record(input.search || input);
  const tripType = unifiedTripType(search);
  search.tripType = tripType;
  const errors = [];


  if (["package", "signaturePackage"].includes(tripType)) {
    let flights = [];
    let stays = [];
    const [flightResult, stayResult] = await Promise.allSettled([
      searchLiveFlightOffersCore({ search }),
      searchLiveStaysCore({
        ...search,
        checkInDate: search.checkInDate || search.departureDate,
        checkOutDate: search.checkOutDate || search.returnDate,
        location: search.location || {
          iata: search.destinationIata || search.destination,
          destination: search.destinationCode || search.destinationRegion || search.destination,
          locationText: search.destinationLabel || search.destination
        }
      })
    ]);
    if (flightResult.status === "fulfilled") flights = publicFlightItems(flightResult.value, search);
    else errors.push({ source: "flight", code: safeCode(flightResult.reason?.code || "FLIGHT_SEARCH_FAILED"), message: text(flightResult.reason?.publicMessage || flightResult.reason?.message || "Live flight search is unavailable.", 300) });
    if (stayResult.status === "fulfilled") stays = publicStayItems(stayResult.value, search);
    else errors.push({ source: "hotel", code: safeCode(stayResult.reason?.code || "STAY_SEARCH_FAILED"), message: text(stayResult.reason?.publicMessage || stayResult.reason?.message || "Live hotel search is unavailable.", 300) });
    const items = packageSearchItems(flights, stays, search);
    return {
      items,
      errors,
      provider: "Duffel",
      generatedAt: nowIso(),
      tripType,
      meta: { flightCount: flights.length, hotelCount: stays.length, packageCount: items.length }
    };
  }


  const items = [];
  if (tripType === "flightOnly") {
    try { items.push(...publicFlightItems(await searchLiveFlightOffersCore({ search }), search)); }
    catch (error) { errors.push({ source: "flight", code: safeCode(error?.code || "FLIGHT_SEARCH_FAILED"), message: text(error?.publicMessage || error?.message || "Live flight search is unavailable.", 300) }); }
  } else if (tripType === "hotelOnly") {
    try {
      items.push(...publicStayItems(await searchLiveStaysCore({
        ...search,
        checkInDate: search.checkInDate || search.departureDate,
        checkOutDate: search.checkOutDate || search.returnDate,
        location: search.location || { iata: search.destinationIata || search.destination, destination: search.destinationCode || search.destinationRegion || search.destination, locationText: search.destinationLabel || search.destination }
      }), search));
    } catch (error) { errors.push({ source: "hotel", code: safeCode(error?.code || "STAY_SEARCH_FAILED"), message: text(error?.publicMessage || error?.message || "Live hotel search is unavailable.", 300) }); }
  } else if (["localOnly", "carOnly"].includes(tripType)) {
    try {
      const cars = await searchLiveCarsCore(search);
      items.push(...arr(cars.items).map(item => ({
        ...item,
        source: "duffel",
        sourceLabel: "Live car rental",
        itemType: "car",
        tripType: "carOnly",
        price: { amount: numberValue(item.totalAmount), currency: upper(item.totalCurrency || search.currency || "USD", 3) },
        searchContext: search
      })));
    } catch (error) { errors.push({ source: "car", code: safeCode(error?.code || "CAR_SEARCH_FAILED"), message: text(error?.publicMessage || error?.message || "Live car search is unavailable.", 300) }); }
  }


  return { items, errors, provider: "Duffel", generatedAt: nowIso(), tripType };
}


export async function createBookingCartFromOfferCore(context = null, input = {}) {
  if (!text(context?.memberId, 180)) return { requiresLogin: true, message: "Sign in to continue with this offer." };


  const offer = record(input.offer);
  const search = record(input.search || offer.searchContext);
  const type = upper(offer.itemType || offer.productType || offer.type || offer.tripType, 40);
  const offerId = text(offer.id, 180);


  if (type === "PACKAGE" || (offer.flightOfferId && offer.staySearchResultId)) {
    return createPackageCartCore(context, { offer, search });
  }
  if (type.includes("FLIGHT") || /^off_[A-Za-z0-9_]+$/.test(offerId)) {
    return createFlightCartCore(context, { offer, offerId, search });
  }
  if (type.includes("HOTEL") || offer.accommodationId || offer.staySearchResultId) {
    let quoteId = text(offer.quoteId, 180);
    if (!quoteId) {
      let rateId = text(offer.rateId, 180);
      if (!rateId && offer.staySearchResultId) {
        const rates = await fetchStayRatesCore({ searchResultId: offer.staySearchResultId });
        const sorted = arr(rates.rates).slice().sort((a, b) => numberValue(a.totalAmount) - numberValue(b.totalAmount));
        rateId = text(sorted[0]?.rateId || sorted[0]?.id, 180);
      }
      if (!rateId) throw bookingError("STAY_RATE_REQUIRED", "Select an available hotel room before continuing.");
      const quoted = await quoteStayCore({ rateId });
      quoteId = text(quoted?.quote?.quoteId || quoted?.quote?.id, 180);
    }
    if (!quoteId) throw bookingError("STAY_QUOTE_REQUIRED", "The hotel quote could not be created.");
    return createHotelCartCore(context, { quoteId, ...search });
  }
  if (type.includes("CAR") || text(offer.rateId, 180).startsWith("rae_")) {
    let quoteId = text(offer.quoteId, 180);
    if (!quoteId) {
      const quoted = await quoteCarCore({ rateId: offer.rateId || offer.id });
      quoteId = text(quoted?.quote?.quoteId || quoted?.quote?.id, 180);
    }
    if (!quoteId) throw bookingError("CAR_QUOTE_REQUIRED", "The car quote could not be created.");
    return createCarCartCore(context, { quoteId, ...search });
  }
  throw bookingError("BOOKING_PRODUCT_NOT_SUPPORTED", "This offer type is not supported by the canonical customer checkout.");
}


export async function createPackageCartCore(context, input = {}) {
  requireMemberContext(context);
  const offer = record(input.offer);
  const search = record(input.search || offer.searchContext);
  const flightOfferId = text(offer.flightOfferId || offer.flight?.id || offer.flight?.offerId, 180);
  const staySearchResultId = text(offer.staySearchResultId || offer.stay?.staySearchResultId || offer.stay?.id, 180);
  if (!/^off_[A-Za-z0-9_]+$/.test(flightOfferId)) throw bookingError("INVALID_OFFER_ID", "The package flight offer is invalid.");
  if (!/^srr_[A-Za-z0-9_]+$/.test(staySearchResultId)) throw bookingError("STAY_SEARCH_RESULT_REQUIRED", "The package hotel result is invalid.");
  const selectionId = packageSelectionId(flightOfferId, staySearchResultId);
  const existing = await getOwnedCartByOffer(context, selectionId);
  if (existing?.cart_id && existing.status !== "Confirmed") {
    return { cartId: existing.cart_id, step: resumeStepForStatus(existing.status), recoveredExistingCart: true };
  }


  const normalized = toDuffelOfferSearch(search);
  const [airResult, stay] = await Promise.all([
    refreshDuffelOfferCore({ offerId: flightOfferId }),
    quoteStaySearchResult(staySearchResultId, offer.stayRateId || offer.stay?.rateId)
  ]);
  assertOfferMatchesSearch(airResult.offer, normalized.searchContext);
  const selectedOffer = mapOfferForCart(airResult.offer);
  const airCurrency = upper(airResult.offer.totalCurrency, 3);
  const stayCurrency = upper(stay.quote.totalCurrency, 3);
  if (airCurrency !== stayCurrency) throw bookingError("PACKAGE_CURRENCY_MISMATCH", "The selected flight and hotel are no longer available in the same currency.");
  const subtotal = roundMoney(numberValue(airResult.offer.totalAmount) + numberValue(stay.quote.totalAmount));
  const taxes = roundMoney(numberValue(airResult.offer.taxAmount) + numberValue(stay.quote.taxAmount));
  const expiresAt = expiryMin([airResult.offer.expiresAt, stay.quote.expiresAt]);
  const payload = {
    version: 3,
    provider: "Duffel",
    productType: "PACKAGE",
    search: normalized.searchContext,
    searchContext: normalized.searchContext,
    selectedOffer,
    flightOfferId,
    staySearchResultId,
    stayRateId: stay.rate?.rateId || stay.rate?.id || null,
    stayQuote: stay.quote,
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
    currency: airCurrency,
    subtotal: decimal(subtotal),
    taxes: decimal(taxes),
    total: decimal(subtotal),
    selectedOfferId: selectionId,
    expiresAt,
    payload,
    source: "customer"
  });
  await addCartItem(row.cart_id, {
    itemType: "flight",
    itemId: flightOfferId,
    title: selectedOffer.routeSummary || offer.flight?.title || "Flight",
    quantity: 1,
    unitPrice: airResult.offer.totalAmount,
    total: airResult.offer.totalAmount,
    payload: { provider: "Duffel", owner: airResult.offer.owner, expiresAt: airResult.offer.expiresAt }
  });
  await addCartItem(row.cart_id, {
    itemType: "hotel",
    itemId: stay.quote.id,
    title: stay.quote.accommodation?.name || offer.stay?.title || "Hotel",
    quantity: 1,
    unitPrice: stay.quote.totalAmount,
    total: stay.quote.totalAmount,
    payload: { provider: "Duffel", searchResultId: staySearchResultId, rateId: payload.stayRateId, quoteId: stay.quote.id, accommodation: stay.quote.accommodation }
  });
  return { cartId: row.cart_id, step: "offer", recoveredExistingCart: false };
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
  const services = combineServiceSelections(row.payload || {});
  const pricing = await priceAirAndPackageCart(row, services);
  assertOfferMatchesSearch(pricing.offer, row.payload?.searchContext || row.payload?.search || {});
  const payload = packagePricingPayload(row, pricing);
  return updateOwnedCart(context, row.cart_id, {
    currency: pricing.currency,
    subtotal: decimal(pricing.subtotal),
    taxes: decimal(pricing.taxes),
    total: decimal(pricing.total),
    expiresAt: pricing.expiresAt,
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
  const offerId = airOfferIdForCart(row);
  const refreshed = await refreshDuffelOfferCore({ offerId });
  const currentOffer = mapOfferForCart(refreshed.offer);
  const mapped = buildDuffelPassengers(input.travelers, input.contact, currentOffer);
  const encrypted = await encryptBookingData(mapped);
  const services = combineServiceSelections(row.payload || {});
  const pricing = await priceAirAndPackageCart(row, services);
  const payload = {
    ...packagePricingPayload(row, pricing),
    secureTravelers: encrypted,
    travelers: travelerTriggerProjection(mapped.passengers),
    travelerCount: mapped.passengers.length,
    flow: { ...(row.payload?.flow || {}), currentStep: "seats" }
  };
  const updated = await updateOwnedCart(context, row.cart_id, {
    email: mapped.contact.email,
    status: "TravelersSaved",
    currency: pricing.currency,
    subtotal: decimal(pricing.subtotal),
    taxes: decimal(pricing.taxes),
    total: decimal(pricing.total),
    expiresAt: pricing.expiresAt,
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
  const result = await getDuffelSeatMapsCore({ offerId: airOfferIdForCart(loaded.row) });
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
    const mapResult = await getDuffelSeatMapsCore({ offerId: airOfferIdForCart(row) });
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
  let payload = { ...(row.payload || {}), seatSelections, seatsSkipped: input.skipped === true, flow: { ...(row.payload?.flow || {}), currentStep: "payment" } };
  const services = combineServiceSelections(payload);
  const pricing = await priceAirAndPackageCart({ ...row, payload }, services);
  payload = { ...packagePricingPayload({ ...row, payload }, pricing), seatSelections, seatsSkipped: input.skipped === true, flow: payload.flow };
  const updated = await updateOwnedCart(context, row.cart_id, {
    status: "PaymentReady",
    currency: pricing.currency,
    subtotal: decimal(pricing.subtotal),
    taxes: decimal(pricing.taxes),
    total: decimal(pricing.total),
    expiresAt: pricing.expiresAt,
    payload
  });
  return { cart: toPublicCart(updated) };
}


export async function prepareBookingPaymentCore(context, input = {}) {
  const row = await requireOwnedCart(context, input.cartId);
  if (!row.payload?.secureTravelers) throw bookingError("TRAVELERS_REQUIRED", "Save traveler details before payment.");
  if (LOCKED_STATUSES.has(row.status)) throw bookingError("BOOKING_RECONCILIATION_REQUIRED", "This booking is already confirmed, committing, or being reconciled. Do not submit another payment.", 409);
  const services = combineServiceSelections(row.payload || {});


  if (isPackageCart(row)) {
    const pricing = await priceAirAndPackageCart(row, services);
    const amountMinor = duffelAmountToMinor(pricing.total, pricing.currency);
    const selectionSignature = services.map(service => `${service.id}:${service.quantity}`).sort().join("|");
    const intent = await createStripePaymentIntent({
      amount: amountMinor,
      currency: pricing.currency,
      captureMethod: "manual",
      idempotencyContext: row.cart_id,
      idempotencyKey: `skandi_package_${row.cart_id}_${amountMinor}_${lower(pricing.currency, 3)}`.slice(0, 255),
      description: `SKANDI Flight + Hotel ${row.cart_id}`,
      metadata: {
        integration: "skandi_package",
        cart_id: row.cart_id,
        idempotency_context: row.cart_id,
        air_offer_id: pricing.offer.id,
        stay_quote_id: pricing.stay?.quote?.id || "",
        selection_signature: selectionSignature
      }
    });
    const publishableKey = await getStripePublishableKey();
    let payload = packagePricingPayload(row, pricing);
    payload = {
      ...payload,
      payment: {
        paymentIntentId: intent.id,
        amount: pricing.total,
        amountMinor,
        currency: pricing.currency,
        status: intent.status,
        captureMethod: "manual",
        preparedAt: nowIso()
      },
      paymentIntentId: intent.id,
      flow: { ...(payload.flow || {}), currentStep: "payment" }
    };
    const updated = await updateOwnedCart(context, row.cart_id, {
      status: "PaymentPending",
      currency: pricing.currency,
      subtotal: decimal(pricing.subtotal),
      taxes: decimal(pricing.taxes),
      total: decimal(pricing.total),
      expiresAt: pricing.expiresAt,
      payload
    });
    return {
      cart: toPublicCart(updated),
      payment: {
        paymentIntentId: intent.id,
        clientSecret: intent.client_secret,
        publishableKey,
        amount: pricing.total,
        currency: pricing.currency,
        status: intent.status,
        captureMethod: intent.capture_method || "manual"
      }
    };
  }


  const result = await prepareDuffelPaymentCore({ offerId: airOfferIdForCart(row), services, idempotencyContext: row.cart_id, manualCapture: true });
  const amountMinor = duffelAmountToMinor(result.offer.totalAmount, result.offer.totalCurrency);
  const payload = {
    ...(row.payload || {}),
    selectedOffer: mapOfferForCart(result.offer),
    payment: { paymentIntentId: result.payment.paymentIntentId, amount: result.payment.amount, amountMinor, currency: result.payment.currency, status: result.payment.status, captureMethod: "manual", preparedAt: nowIso() },
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


async function commitPackageBookingCore(context, input = {}) {
  if (input.termsAccepted !== true) throw bookingError("TERMS_REQUIRED", "Accept the booking and payment terms before continuing.");
  let loaded = await loadBookingCartCore(context, input, { includeTravelers: true });
  if (loaded.row.status === "Confirmed") return confirmedResult(loaded.row);
  if (loaded.row.status === "ReconciliationRequired") throw bookingError("BOOKING_RECONCILIATION_REQUIRED", "This package is already being reconciled. Do not pay or book again.", 409);
  const payment = loaded.row.payload?.payment || {};
  const paymentIntentId = text(input.paymentIntentId, 180);
  if (!payment.paymentIntentId || payment.paymentIntentId !== paymentIntentId) throw bookingError("PAYMENT_REFERENCE_MISMATCH", "The completed payment authorization does not match this package.", 409);
  if (loaded.row.status === "PaymentPending") {
    const claimed = await transitionOwnedCart(context, loaded.row.cart_id, "PaymentPending", "Committing");
    loaded = await loadBookingCartCore(context, input, { includeTravelers: true });
    if (!claimed && loaded.row.status !== "Committing") throw bookingError("BOOKING_COMMIT_CONFLICT", "This package is already being processed.", 409);
  }
  if (loaded.row.status !== "Committing") throw bookingError("BOOKING_NOT_READY", "This package is not ready to be committed.", 409);
  if (!loaded.sensitive?.passengers?.length) throw bookingError("TRAVELERS_REQUIRED", "Traveler details are missing from this package.");


  const intent = await retrieveStripePaymentIntent(paymentIntentId);
  assertStripeAuthorization(intent, {
    amount: payment.amountMinor,
    currency: payment.currency,
    metadata: { cart_id: loaded.row.cart_id, idempotency_context: loaded.row.cart_id },
    allowCaptured: true
  });


  const contact = loaded.sensitive.contact || {};
  const guests = stayGuestsFromPassengers(loaded.sensitive.passengers);
  let row = loaded.row;
  let stayBooking = row.payload?.stayBooking || null;
  let airOrder = row.payload?.airOrder || null;


  if (!stayBooking?.id) {
    let stayProvider;
    try {
      stayProvider = await createDuffelStayBookingCore({
        quoteId: row.payload?.stayQuote?.id,
        guests,
        email: contact.email,
        phoneNumber: contact.phoneNumber,
        specialRequests: input.specialRequests,
        loyaltyProgrammeAccountNumber: input.loyaltyProgrammeAccountNumber,
        internalReference: row.cart_id,
        integration: "skandi_customer_package"
      });
    } catch (error) {
      if (["DUFFEL_TIMEOUT", "DUFFEL_HTTP_500", "DUFFEL_HTTP_502", "DUFFEL_HTTP_503", "DUFFEL_HTTP_504"].includes(String(error?.code || ""))) {
        const updated = await markBookingReconciliationRequired(context, row, { kind: "PACKAGE_STAY_OUTCOME_UNKNOWN", code: safeCode(error.code), providerRequestId: error.providerRequestId, correlationId: error.correlationId });
        throw bookingError("BOOKING_RECONCILIATION_REQUIRED", `The hotel portion of this package is being reconciled. Do not retry. Cart: ${updated.cart_id}`, 409);
      }
      await voidUnusedAuthorization(row);
      await updateOwnedCart(context, row.cart_id, { status: "PaymentReady", payload: { ...(row.payload || {}), payment: { ...payment, status: "authorization_released" } } });
      throw error;
    }
    if (stayProvider.reconciliationRequired || !stayProvider.booking?.id) {
      const updated = await markBookingReconciliationRequired(context, row, { kind: "PACKAGE_STAY_PENDING", code: "DUFFEL_STAY_PENDING", providerRequestId: stayProvider.requestId, correlationId: stayProvider.correlationId, providerStatus: stayProvider.providerStatus });
      return { cartId: updated.cart_id, status: updated.status, reconciliationRequired: true };
    }
    stayBooking = stayProvider.booking;
    row = await updateOwnedCart(context, row.cart_id, {
      payload: {
        ...(row.payload || {}),
        stayBooking,
        providerProgress: { ...(row.payload?.providerProgress || {}), stayBookingId: stayBooking.id, stayReference: stayBooking.reference || null, stayConfirmedAt: nowIso() }
      }
    });
  }


  if (!airOrder?.id) {
    const services = combineServiceSelections(row.payload || {});
    let airProvider;
    try {
      airProvider = await createDuffelOrderCore({
        offerId: airOfferIdForCart(row),
        orderType: "instant",
        services,
        paymentIntentId,
        customerAuthorizationAmountMinor: payment.amountMinor,
        passengers: toDuffelOrderPassengers(loaded.sensitive.passengers),
        internalReference: row.cart_id,
        confirmationDeliveryPolicy: "SKANDI"
      });
    } catch (error) {
      const updated = await markBookingReconciliationRequired(context, row, {
        kind: ["DUFFEL_TIMEOUT", "DUFFEL_HTTP_500", "DUFFEL_HTTP_502", "DUFFEL_HTTP_503", "DUFFEL_HTTP_504"].includes(String(error?.code || "")) ? "PACKAGE_AIR_ORDER_OUTCOME_UNKNOWN" : "PACKAGE_AIR_ORDER_FAILED_AFTER_STAY",
        code: safeCode(error?.code || error?.message),
        providerRequestId: error.providerRequestId,
        correlationId: error.correlationId,
        stayBooking,
        customerPaymentCaptureRequired: false
      });
      throw bookingError("BOOKING_RECONCILIATION_REQUIRED", `The hotel is confirmed but the airline portion requires reconciliation. Do not retry or pay again. Cart: ${updated.cart_id}`, 409);
    }
    if (airProvider.reconciliationRequired || !airProvider.order?.id) {
      const updated = await markBookingReconciliationRequired(context, row, { kind: "PACKAGE_AIR_ORDER_PENDING", code: "DUFFEL_ORDER_PENDING", providerRequestId: airProvider.requestId, correlationId: airProvider.correlationId, providerStatus: airProvider.providerStatus, stayBooking });
      return { cartId: updated.cart_id, status: updated.status, reconciliationRequired: true };
    }
    airOrder = airProvider.order;
    row = await updateOwnedCart(context, row.cart_id, {
      payload: {
        ...(row.payload || {}),
        airOrder,
        order: airOrder,
        providerProgress: { ...(row.payload?.providerProgress || {}), stayBookingId: stayBooking.id, airOrderId: airOrder.id, airBookingReference: airOrder.bookingReference || null, airConfirmedAt: nowIso() }
      }
    });
  }


  let capture;
  try { capture = intent.status === "succeeded" ? intent : await captureStripePaymentIntent(paymentIntentId, `skandi_package_capture_${row.cart_id}`.slice(0, 255)); }
  catch (error) {
    const updated = await markBookingReconciliationRequired(context, row, { kind: "PACKAGE_PAYMENT_CAPTURE_REQUIRED", code: safeCode(error?.code), airOrder, stayBooking, supplierOrderId: airOrder.id, customerPaymentCaptureRequired: true, paymentStatus: "capture_required" });
    throw bookingError("BOOKING_RECONCILIATION_REQUIRED", `The package suppliers are confirmed but payment capture requires reconciliation. Do not pay again. Cart: ${updated.cart_id}`, 409);
  }
  if (capture.status !== "succeeded") {
    const updated = await markBookingReconciliationRequired(context, row, { kind: "PACKAGE_PAYMENT_CAPTURE_REQUIRED", code: "PAYMENT_CAPTURE_NOT_COMPLETE", airOrder, stayBooking, customerPaymentCaptureRequired: true, paymentStatus: capture.status || "capture_pending" });
    throw bookingError("BOOKING_RECONCILIATION_REQUIRED", `The package suppliers are confirmed but payment capture is incomplete. Do not pay again. Cart: ${updated.cart_id}`, 409);
  }


  const bookingReference = airOrder.bookingReference || stayBooking.reference || row.cart_id;
  const payload = {
    ...(row.payload || {}),
    productType: "PACKAGE",
    airOrder,
    order: airOrder,
    stayBooking,
    bookingReference,
    paymentIntentId,
    payment: { ...payment, status: "succeeded", capturedAt: nowIso() },
    reconciliation: null,
    flow: { ...(row.payload?.flow || {}), currentStep: "confirmation", confirmedAt: nowIso() }
  };
  const updated = await updateOwnedCart(context, row.cart_id, { status: "Confirmed", payload });
  recordPaymentEventOnce({
    eventId: paymentIntentId,
    provider: "Stripe",
    memberId: context.memberId,
    bookingId: row.cart_id,
    amount: updated.total,
    currency: updated.currency,
    status: "succeeded",
    payload: { duffelOrderId: airOrder.id, duffelStayBookingId: stayBooking.id, bookingReference }
  }).catch(() => {});
  return confirmedResult(updated);
}


export async function commitBookingCore(context, input = {}) {
  if (input.termsAccepted !== true) throw bookingError("TERMS_REQUIRED", "Accept the booking and payment terms before continuing.");
  const initial = await requireOwnedCart(context, input.cartId);
  if (isPackageCart(initial)) return commitPackageBookingCore(context, input);
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
      offerId: airOfferIdForCart(loaded.row),
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
  if (upper(row.payload?.productType, 40).includes("FLIGHT") || isPackageCart(row)) {
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
    row = await updateOwnedCart(context, row.cart_id, { payload: { ...(row.payload || {}), stayBooking: stay.booking || stay } });
  }
  if (row.payload?.carBooking?.id) {
    const car = await getDuffelCarBookingCore({ bookingId: row.payload.carBooking.id });
    row = await updateOwnedCart(context, row.cart_id, { payload: { ...(row.payload || {}), carBooking: car.booking || car } });
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
  const car = row?.payload?.carBooking || {};
  return {
    cartId: row?.cart_id || "",
    bookingReference: row?.payload?.bookingReference || air.bookingReference || stay.reference || car.reference || "",
    orderId: air.id || stay.id || car.id || "",
    status: row?.status || "Confirmed"
  };
}
function confirmationFromRow(row) {
  const air = row.payload?.airOrder || {};
  const stay = row.payload?.stayBooking || {};
  const car = row.payload?.carBooking || {};
  const selectedOffer = row.payload?.selectedOffer || {};
  const productType = row.payload?.productType || "SKANDI booking";
  const title = productType === "HOTEL_ONLY" ? "Your hotel is confirmed" : productType === "CAR_RENTAL_ONLY" ? "Your car is confirmed" : "Your trip is confirmed";
  return {
    cartId: row.cart_id,
    title,
    summary: selectedOffer.summary || stay.accommodation?.name || car.car?.name || "Your SKANDI booking is confirmed.",
    bookingReference: row.payload?.bookingReference || air.bookingReference || stay.reference || car.reference || row.cart_id,
    pnrLocator: air.bookingReference || stay.reference || car.reference || "",
    orderId: air.id || stay.id || car.id || "",
    confirmationType: productType,
    status: row.status,
    seatSummary: Object.values(record(row.payload?.seatSelections)).map(s => s?.designator).filter(Boolean).join(", ") || "Not selected",
    segments: flattenSegments(air.slices),
    stayBooking: stay.id ? stay : null,
    carBooking: car.id ? car : null
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


function carQuoteFromResult(result = {}) { return result?.quote || result || {}; }
function carBookingFromResult(result = {}) { return result?.booking || (result?.id ? result : null); }
function carPaymentType(value) {
  const type = lower(value, 30);
  if (!["postpaid", "guarantee", "prepaid"].includes(type)) throw bookingError("CAR_PAYMENT_TYPE_INVALID", "The rental supplier returned an unsupported payment type.", 409);
  return type;
}
function carDriver(input = {}) {
  const d = record(input.driver || input);
  const out = {
    givenName: text(d.givenName || d.firstName, 80),
    familyName: text(d.familyName || d.lastName, 80),
    email: lower(d.email, 254),
    phoneNumber: text(d.phoneNumber || d.phone, 20),
    dateOfBirth: text(d.dateOfBirth || d.bornOn, 10)
  };
  if (!out.givenName || !out.familyName) throw bookingError("DRIVER_NAME_REQUIRED", "Enter the main driver's full name.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(out.email)) throw bookingError("INVALID_EMAIL", "Enter a valid driver email address.");
  if (!/^\+[1-9]\d{7,14}$/.test(out.phoneNumber)) throw bookingError("INVALID_PHONE", "Enter the driver's phone number in international format.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(out.dateOfBirth)) throw bookingError("INVALID_DATE", "Enter the driver's date of birth as YYYY-MM-DD.");
  const parsed = new Date(`${out.dateOfBirth}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== out.dateOfBirth) throw bookingError("INVALID_DATE", "Enter a valid driver date of birth.");
  return out;
}
function privacyPolicyKey(policy = {}, index = 0) {
  return text(policy.id || policy.url || policy.href || policy.name || policy.title || `policy-${index + 1}`, 500);
}
function acceptedCarPrivacy(quote = {}, input = {}, existing = null) {
  const policies = arr(quote.privacyPolicies);
  if (!policies.length) return { accepted: true, acceptedAt: existing?.acceptedAt || nowIso(), policies: [] };
  const blanket = input.privacyPoliciesAccepted === true || existing?.accepted === true;
  const supplied = new Set(arr(input.privacyPolicyAcceptances).map((entry, index) => {
    if (typeof entry === "string") return text(entry, 500);
    if (entry?.accepted === false) return "";
    return privacyPolicyKey(record(entry), index);
  }).filter(Boolean));
  const acceptedPolicies = policies.map((policy, index) => ({
    key: privacyPolicyKey(record(policy), index),
    accepted: blanket || supplied.has(privacyPolicyKey(record(policy), index)),
    policy
  }));
  if (acceptedPolicies.some(item => !item.accepted)) throw bookingError("CAR_PRIVACY_POLICY_REQUIRED", "Accept every rental supplier privacy policy before booking.", 409);
  return { accepted: true, acceptedAt: nowIso(), policies: acceptedPolicies };
}


export async function createCarCartCore(context, input = {}) {
  requireMemberContext(context);
  const quote = carQuoteFromResult(await getDuffelCarQuoteCore({ quoteId: input.quoteId }));
  if (!quote?.id) throw bookingError("CAR_QUOTE_REQUIRED", "The rental quote could not be found.");
  const paymentType = carPaymentType(quote.paymentType);
  const payload = {
    version: 4,
    provider: "Duffel",
    productType: "CAR_RENTAL_ONLY",
    carQuote: quote,
    carBooking: null,
    secureTravelers: null,
    travelers: [],
    carPrivacy: null,
    payment: { provider: "Duffel", paymentType, status: "not_prepared" },
    search: {
      origin: quote.pickupLocation?.name || input.pickupLocationText || input.pickupIata || null,
      destination: quote.dropoffLocation?.name || input.dropoffLocationText || input.dropoffIata || null,
      departureDate: quote.pickupDate || input.pickupDate || null,
      returnDate: quote.dropoffDate || input.dropoffDate || null
    },
    flow: { currentStep: "driver", createdAt: nowIso() }
  };
  const row = await createOwnedCart(context, {
    email: context.email,
    status: "TravelersPending",
    currency: quote.totalCurrency,
    subtotal: decimal(quote.totalAmount),
    taxes: "0.00",
    total: decimal(quote.totalAmount),
    payload,
    source: "customer"
  });
  await addCartItem(row.cart_id, {
    itemType: "car",
    itemId: quote.id,
    title: quote.car?.name || "Car rental",
    quantity: 1,
    unitPrice: quote.totalAmount,
    total: quote.totalAmount,
    payload: { provider: "Duffel", quoteId: quote.id, supplier: quote.supplier || null, paymentType }
  });
  return { cartId: row.cart_id, step: "driver", paymentType };
}


export async function saveCarDriverCore(context, input = {}) {
  const row = await requireOwnedCart(context, input.cartId);
  assertEditable(row);
  if (row.payload?.productType !== "CAR_RENTAL_ONLY") throw bookingError("INVALID_PRODUCT_TYPE", "This is not a car-rental checkout.");
  const quote = carQuoteFromResult(await getDuffelCarQuoteCore({ quoteId: row.payload?.carQuote?.id }));
  if (!quote?.id) throw bookingError("CAR_QUOTE_REQUIRED", "The rental quote has expired or cannot be retrieved.", 409);
  const driver = carDriver(input.driver || input);
  const secure = await encryptBookingData({ driver });
  const triggerTravelers = [{
    id: "CAR_DRIVER_1",
    givenName: driver.givenName,
    familyName: driver.familyName,
    dateOfBirth: driver.dateOfBirth,
    nationality: null,
    gender: null,
    paxType: "ADT"
  }];
  const privacy = acceptedCarPrivacy(quote, input, row.payload?.carPrivacy);
  const payload = {
    ...(row.payload || {}),
    carQuote: quote,
    secureTravelers: secure,
    travelers: triggerTravelers,
    travelerCount: 1,
    carPrivacy: privacy,
    payment: { provider: "Duffel", paymentType: carPaymentType(quote.paymentType), status: "not_prepared" },
    flow: { ...(row.payload?.flow || {}), currentStep: "payment" }
  };
  const updated = await updateOwnedCart(context, row.cart_id, { email: driver.email, status: "PaymentReady", currency: quote.totalCurrency, subtotal: decimal(quote.totalAmount), taxes: "0.00", total: decimal(quote.totalAmount), payload });
  return { cart: toPublicCart(updated), paymentType: carPaymentType(quote.paymentType) };
}


export async function prepareCarCheckoutCore(context, input = {}) {
  const row = await requireOwnedCart(context, input.cartId);
  if (row.payload?.productType !== "CAR_RENTAL_ONLY") throw bookingError("INVALID_PRODUCT_TYPE", "This is not a car-rental checkout.");
  if (!row.payload?.secureTravelers) throw bookingError("DRIVER_REQUIRED", "Save the main driver before booking.");
  const quote = carQuoteFromResult(await getDuffelCarQuoteCore({ quoteId: row.payload?.carQuote?.id }));
  if (!quote?.id) throw bookingError("CAR_QUOTE_REQUIRED", "The rental quote has expired or cannot be retrieved.", 409);
  const privacy = acceptedCarPrivacy(quote, input, row.payload?.carPrivacy);
  const paymentType = carPaymentType(quote.paymentType);
  let componentClientKey = null;
  if (paymentType !== "postpaid") {
    const key = await createDuffelComponentClientKeyCore({});
    componentClientKey = text(key?.componentClientKey || key?.component_client_key, 5000);
    if (!componentClientKey) throw bookingError("DUFFEL_COMPONENT_KEY_UNAVAILABLE", "The secure rental card form could not be prepared. Try again.", 503);
  }
  const payment = {
    provider: "Duffel",
    paymentType,
    status: paymentType === "postpaid" ? "pay_at_counter" : "awaiting_duffel_card_3ds",
    method: paymentType === "postpaid" ? "PAY_AT_COUNTER" : "DUFFEL_CARD_3DS",
    quoteId: quote.id,
    amount: quote.totalAmount,
    currency: quote.totalCurrency,
    requiresCard: paymentType !== "postpaid",
    requiresThreeDS: paymentType !== "postpaid",
    preparedAt: nowIso()
  };
  const payload = { ...(row.payload || {}), carQuote: quote, carPrivacy: privacy, payment, flow: { ...(row.payload?.flow || {}), currentStep: "payment" } };
  const updated = await updateOwnedCart(context, row.cart_id, { status: "PaymentPending", currency: quote.totalCurrency, subtotal: decimal(quote.totalAmount), taxes: "0.00", total: decimal(quote.totalAmount), payload });
  return {
    cart: toPublicCart(updated),
    checkout: {
      ...payment,
      componentClientKey,
      threeDSResourceId: quote.id,
      threeDSResourceType: "car_quote"
    }
  };
}


export async function commitCarBookingCore(context, input = {}) {
  if (input.termsAccepted !== true) throw bookingError("TERMS_REQUIRED", "Accept the booking and rental terms before continuing.");
  let row = await requireOwnedCart(context, input.cartId);
  if (row.status === "Confirmed") return confirmedResult(row);
  if (row.status === "ReconciliationRequired") throw bookingError("BOOKING_RECONCILIATION_REQUIRED", "This car booking is being reconciled. Do not book again.", 409);
  if (row.payload?.productType !== "CAR_RENTAL_ONLY") throw bookingError("INVALID_PRODUCT_TYPE", "This is not a car-rental checkout.");
  if (!row.payload?.secureTravelers) throw bookingError("DRIVER_REQUIRED", "Save the main driver before booking.");
  const quote = carQuoteFromResult(await getDuffelCarQuoteCore({ quoteId: row.payload?.carQuote?.id }));
  if (!quote?.id) throw bookingError("CAR_QUOTE_REQUIRED", "The rental quote has expired or cannot be retrieved.", 409);
  const privacy = acceptedCarPrivacy(quote, input, row.payload?.carPrivacy);
  const paymentType = carPaymentType(quote.paymentType);
  const threeDSecureSessionId = text(input.threeDSecureSessionId, 180);
  if (paymentType !== "postpaid" && !/^3ds_[A-Za-z0-9_]+$/.test(threeDSecureSessionId)) {
    throw bookingError("CAR_3DS_REQUIRED", "Complete the secure Duffel card and 3-D Secure step before booking this rental.", 409);
  }
  if (["PaymentReady", "PaymentPending"].includes(row.status)) {
    const claimed = await transitionOwnedCart(context, row.cart_id, row.status, "Committing");
    row = await requireOwnedCart(context, row.cart_id);
    if (!claimed && row.status !== "Committing") throw bookingError("BOOKING_COMMIT_CONFLICT", "This rental is already being processed.", 409);
  } else if (row.status !== "Committing") {
    throw bookingError("BOOKING_NOT_READY", "Prepare the rental checkout before booking.", 409);
  }
  const secure = await decryptBookingData(row.payload.secureTravelers);
  const driver = carDriver(secure?.driver || {});
  let provider;
  try {
    provider = await createDuffelCarBookingCore({
      quoteId: quote.id,
      driver,
      paymentType,
      ...(paymentType !== "postpaid" ? { threeDSecureSessionId } : {}),
      inboundFlightNumber: input.inboundFlightNumber,
      supplierLoyaltyProgrammeAccountNumber: input.supplierLoyaltyProgrammeAccountNumber,
      internalReference: row.cart_id,
      integration: "skandi_customer"
    });
  } catch (error) {
    if (["DUFFEL_TIMEOUT", "DUFFEL_HTTP_500", "DUFFEL_HTTP_502", "DUFFEL_HTTP_503", "DUFFEL_HTTP_504"].includes(String(error?.code || ""))) {
      const updated = await markBookingReconciliationRequired(context, row, {
        kind: "CAR_BOOKING_OUTCOME_UNKNOWN",
        code: safeCode(error.code),
        providerRequestId: error.providerRequestId,
        correlationId: error.correlationId,
        paymentType
      });
      throw bookingError("BOOKING_RECONCILIATION_REQUIRED", `The car booking outcome is being reconciled. Do not retry. Cart: ${updated.cart_id}`, 409);
    }
    await updateOwnedCart(context, row.cart_id, { status: "PaymentReady", payload: { ...(row.payload || {}), carQuote: quote, carPrivacy: privacy, payment: { ...(row.payload?.payment || {}), status: "provider_declined_or_failed" } } });
    throw error;
  }
  const booking = carBookingFromResult(provider);
  if (provider?.reconciliationRequired || !booking?.id) {
    const updated = await markBookingReconciliationRequired(context, row, {
      kind: "CAR_BOOKING_PENDING",
      code: "DUFFEL_CAR_PENDING",
      providerRequestId: provider?.requestId,
      correlationId: provider?.correlationId,
      providerStatus: provider?.providerStatus,
      paymentType
    });
    return { cartId: updated.cart_id, status: updated.status, reconciliationRequired: true };
  }
  const paymentStatus = paymentType === "postpaid" ? "pay_at_supplier" : paymentType === "guarantee" ? "guaranteed_at_supplier" : "supplier_card_confirmed";
  const payload = {
    ...(row.payload || {}),
    carQuote: quote,
    carBooking: booking,
    carPrivacy: privacy,
    bookingReference: booking.reference || row.cart_id,
    paymentIntentId: null,
    payment: { provider: "Duffel", paymentType, status: paymentStatus, method: paymentType === "postpaid" ? "PAY_AT_COUNTER" : "DUFFEL_CARD_3DS", confirmedAt: nowIso() },
    reconciliation: null,
    flow: { ...(row.payload?.flow || {}), currentStep: "confirmation", confirmedAt: nowIso() }
  };
  const updated = await updateOwnedCart(context, row.cart_id, { status: "Confirmed", currency: booking.totalCurrency || quote.totalCurrency, subtotal: decimal(booking.totalAmount || quote.totalAmount), taxes: "0.00", total: decimal(booking.totalAmount || quote.totalAmount), payload });
  return confirmedResult(updated);
}


// Compatibility alias retained for consumers that used the B-006 name.
export async function createCustomerCarBookingCore(context, input = {}) {
  return commitCarBookingCore(context, input);
}


// Recovered APIS form contract; cart access remains with this orchestrator.
function bookingIdentityRules(cart = {}) {
  const destination = text(
    cart?.search?.destination ||
    cart?.flight?.offer?.slices?.[0]?.destination?.iataCode ||
    "",
    100
  );
  return {
    status: "READY",
    summary: destination
      ? `Traveler identity and document details are required for travel to ${destination}. Entry and transit requirements should be checked before departure.`
      : "Traveler identity and document details are required before the reservation can be issued.",
    destination,
    fields: [],
    notices: [],
    providerStatus: "Traveler identity form validation"
  };
}




export async function loadBookingRequirementsCore(context, input = {}) {
  const loaded = await loadBookingCartCore(context, input);
  return bookingIdentityRules({ ...loaded.cart, search: loaded.row.payload?.search || {} });
}


export async function refreshBookingRequirementsCore(context, input = {}) {
  const loaded = await loadBookingCartCore(context, input);
  const cart = { ...loaded.cart, search: loaded.row.payload?.search || {} };
  const travelers = Array.isArray(input.travelers) ? input.travelers : [];
    const rules = bookingIdentityRules(cart);
    const notices = [];


    for (const [index, traveler] of (Array.isArray(travelers) ? travelers : []).entries()) {
      const nationality = text(traveler?.nationality, 2).toUpperCase();
      const document = Array.isArray(traveler?.documents) ? traveler.documents[0] || {} : {};
      const documentNumber = text(
        traveler?.documentNumber || document?.number || "",
        50
      );
      const expiry = text(
        traveler?.documentExpiry || document?.expiryDate || "",
        10
      );


      if (!/^[A-Z]{2}$/.test(nationality)) {
        notices.push(`Traveler ${index + 1}: enter nationality as a two-letter country code.`);
      }
      if (!documentNumber) {
        notices.push(`Traveler ${index + 1}: travel document number is required.`);
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(expiry)) {
        notices.push(`Traveler ${index + 1}: enter a valid document expiry date.`);
      }
    }


    return {
      ...rules,
      status: notices.length ? "REVIEW" : "READY",
      notices
    };
}


export async function createCarComponentClientKeyCore() {
  return createDuffelComponentClientKeyCore();
}


export async function loadCustomerCarBookingCore(context, input = {}) {
  const row = await requireOwnedCart(context, input.cartId);
  if (row.payload?.productType !== "CAR_RENTAL_ONLY") throw bookingError("INVALID_PRODUCT_TYPE", "This is not a car-rental booking.");
  const bookingId = text(row.payload?.carBooking?.id, 180);
  if (!bookingId) throw bookingError("CAR_BOOKING_NOT_FOUND", "This cart has no confirmed rental booking.");
  if (input.bookingId && text(input.bookingId, 180) !== bookingId) throw bookingError("CAR_BOOKING_REFERENCE_MISMATCH", "The supplier reference does not match this rental.");
  return getDuffelCarBookingCore({ bookingId });
}


export async function cancelCustomerCarBookingCore(context, input = {}) {
  const row = await requireOwnedCart(context, input.cartId);
  if (row.payload?.productType !== "CAR_RENTAL_ONLY") throw bookingError("INVALID_PRODUCT_TYPE", "This is not a car-rental booking.");
  const bookingId = text(row.payload?.carBooking?.id, 180);
  if (!bookingId || (input.bookingId && text(input.bookingId, 180) !== bookingId)) throw bookingError("CAR_BOOKING_REFERENCE_MISMATCH", "The supplier reference does not match this rental.");
  if (row.payload?.carCancellation?.status === "canceled") return { canceled: true, bookingId, requiresReconciliation: true };
  if (row.status !== "Confirmed") throw bookingError("BOOKING_RECONCILIATION_REQUIRED", "This rental is already being changed or reconciled. Do not submit another cancellation.", 409);
  const startedAt = nowIso();
  const claimed = await transitionOwnedCart(context, row.cart_id, "Confirmed", "CarCancellationPending", {
    payload: { ...(row.payload || {}), carCancellation: { bookingId, status: "pending", startedAt } }
  });
  if (!claimed) throw bookingError("BOOKING_COMMIT_CONFLICT", "This rental is already being processed.", 409);
  try {
    const result = await cancelDuffelCarBookingCore({ bookingId });
    const supplierBooking = result?.booking || {};
    const cancellationResolved = result?.reconciliationRequired !== true &&
      supplierBooking.id === bookingId &&
      (/^(canceled|cancelled)$/i.test(String(supplierBooking.status || "")) || Boolean(supplierBooking.cancelledAt));
    await updateOwnedCart(context, row.cart_id, {
      status: "ReconciliationRequired",
      payload: {
        ...(claimed.payload || row.payload || {}),
        carCancellation: { bookingId, status: cancellationResolved ? "canceled" : "outcome_unknown", startedAt, completedAt: nowIso(), result },
        reconciliation: { reason: cancellationResolved ? "CAR_CANCELLATION_ALTEA_SYNC_REQUIRED" : "CAR_CANCELLATION_OUTCOME_REVIEW", supplierMutationResolved: cancellationResolved, bookingId, createdAt: nowIso() }
      }
    });
    return { ...result, canceled: cancellationResolved, bookingId, requiresReconciliation: true };
  } catch (error) {
    await markBookingReconciliationRequired(context, claimed, {
      kind: "CAR_CANCELLATION_OUTCOME_REVIEW", code: text(error?.code || "CAR_CANCELLATION_FAILED", 100), supplierOrderId: bookingId
    });
    throw bookingError("BOOKING_RECONCILIATION_REQUIRED", "The rental cancellation needs review before any further action. Do not submit it again.", 409);
  }
}
