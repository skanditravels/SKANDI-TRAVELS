// /src/backend/SKANDI_CORE/duffelServicing.js
// SKANDI Backend Base 1.0 — B-005R1 Duffel order-change servicing core.
// Owns the order-change transaction sequence. Stripe HTTP stays in stripeClient.
// For positive changes: manual customer authorization -> Duffel confirmation -> Stripe capture.
// For negative changes: reports the customer refund requirement; no automatic customer refund is issued here.

import { duffelRequest, ProviderError } from "backend/SKANDI_CORE/duffelClient.js";
import {
  createStripePaymentIntent,
  retrieveStripePaymentIntent,
  captureStripePaymentIntent,
  cancelStripePaymentIntent,
  getStripePublishableKey,
  assertStripeAuthorization
} from "backend/SKANDI_CORE/stripeClient.js";

const CABIN_CLASSES = new Set(["economy", "premium_economy", "business", "first"]);
const ZERO_DECIMAL_CURRENCIES = new Set(["BIF","CLP","DJF","GNF","JPY","KMF","KRW","MGA","PYG","RWF","UGX","VND","VUV","XAF","XOF","XPF"]);

function arr(v) { return Array.isArray(v) ? v : []; }
function clean(v, max = 500) { return String(v ?? "").trim().slice(0, max); }
function upper(v, max = 500) { return clean(v, max).toUpperCase(); }
function fail(code, message, status = 400, extra = {}) { const e = new Error(message); e.name = "DuffelServicingError"; e.code = code; e.status = status; e.publicMessage = message; Object.assign(e, extra); return e; }
function id(value, prefix, label) { const x = clean(value, 180); if (!new RegExp(`^${prefix}[A-Za-z0-9_]+$`).test(x)) throw fail("INVALID_RESOURCE_ID", `The ${label} reference is invalid.`); return x; }
function genericId(value, label) { const x = clean(value, 180); if (!/^[a-z]{2,20}_[A-Za-z0-9_]+$/.test(x)) throw fail("INVALID_RESOURCE_ID", `The ${label} reference is invalid.`); return x; }
function iata(value, label) { const x = upper(value, 3); if (!/^[A-Z0-9]{3}$/.test(x)) throw fail("INVALID_IATA_CODE", `The ${label} must be a three-letter IATA code.`); return x; }
function futureDate(value, label) { const x = clean(value, 10); if (!/^\d{4}-\d{2}-\d{2}$/.test(x)) throw fail("INVALID_DATE", `The ${label} must be today or later.`); const parsed = new Date(`${x}T00:00:00Z`); if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== x || x < new Date().toISOString().slice(0, 10)) throw fail("INVALID_DATE", `The ${label} must be today or later.`); return x; }
function currency(value) { const x = upper(value, 3); if (!/^[A-Z]{3}$/.test(x)) throw fail("INVALID_CURRENCY", "The airline change currency is invalid."); return x; }
function amountToMinor(amount, currencyCode) { const raw = clean(amount, 40); if (!/^\d+(?:\.\d+)?$/.test(raw)) throw fail("INVALID_AMOUNT", "The airline change amount is invalid."); if (ZERO_DECIMAL_CURRENCIES.has(currencyCode)) return Math.round(Number(raw)); const [w, f = ""] = raw.split("."); const n = Number(w) * 100 + Number(`${f}00`.slice(0, 2)); if (!Number.isSafeInteger(n)) throw fail("INVALID_AMOUNT", "The airline change amount is too large."); return n; }

function normalizeCarrier(x) { return x ? { id: x.id || null, iataCode: x.iata_code || null, name: x.name || null } : null; }
function normalizeLocation(x) { if (!x) return null; if (typeof x === "string") return { iataCode: x, name: null, cityName: null }; return { id: x.id || null, iataCode: x.iata_code || null, name: x.name || null, cityName: x.city_name || x.city?.name || null }; }
function normalizeSlice(slice = {}) { return { id: slice.id || slice.slice_id || null, origin: normalizeLocation(slice.origin), destination: normalizeLocation(slice.destination), duration: slice.duration || null, segments: arr(slice.segments).map(segment => ({ id: segment.id || null, departingAt: segment.departing_at || null, arrivingAt: segment.arriving_at || null, origin: normalizeLocation(segment.origin), destination: normalizeLocation(segment.destination), marketingCarrier: normalizeCarrier(segment.marketing_carrier), marketingFlightNumber: segment.marketing_carrier_flight_number || null, operatingCarrier: normalizeCarrier(segment.operating_carrier), operatingFlightNumber: segment.operating_carrier_flight_number || null })) }; }
function normalizeChangeSlices(slices = {}) { return { remove: arr(slices?.remove).map(normalizeSlice), add: arr(slices?.add).map(normalizeSlice) }; }
function normalizeChangeOffer(offer = {}) { return { id: offer.id || null, expiresAt: offer.expires_at || null, changeTotalAmount: offer.change_total_amount ?? null, changeTotalCurrency: offer.change_total_currency || null, penaltyTotalAmount: offer.penalty_total_amount ?? null, penaltyTotalCurrency: offer.penalty_total_currency || null, newTotalAmount: offer.new_total_amount ?? null, newTotalCurrency: offer.new_total_currency || null, slices: normalizeChangeSlices(offer.slices) }; }
function normalizeOrderChange(change = {}) { return { id: change.id || null, orderId: change.order_id || null, createdAt: change.created_at || null, updatedAt: change.updated_at || null, expiresAt: change.expires_at || null, confirmedAt: change.confirmed_at || null, changeTotalAmount: change.change_total_amount ?? "0.00", changeTotalCurrency: change.change_total_currency || null, penaltyTotalAmount: change.penalty_total_amount ?? null, penaltyTotalCurrency: change.penalty_total_currency || null, newTotalAmount: change.new_total_amount ?? null, newTotalCurrency: change.new_total_currency || null, refundTo: change.refund_to || null, slices: normalizeChangeSlices(change.slices) }; }

function validateAddSlice(value = {}) {
  const origin = iata(value.origin, "origin"), destination = iata(value.destination, "destination");
  if (origin === destination) throw fail("INVALID_CHANGE_ROUTE", "Origin and destination must be different.");
  const departureDate = futureDate(value.departureDate, "departure date");
  const cabinClass = clean(value.cabinClass || "economy", 30).toLowerCase();
  if (!CABIN_CLASSES.has(cabinClass)) throw fail("INVALID_CABIN_CLASS", "Choose a supported cabin class.");
  return { origin, destination, departureDate, cabinClass };
}

function assertPendingChange(change) {
  if (!change?.id) throw fail("ORDER_CHANGE_NOT_FOUND", "The pending airline change could not be found.", 404);
  if (change.confirmed_at) throw fail("ORDER_CHANGE_ALREADY_CONFIRMED", "This airline change has already been confirmed.", 409);
  if (change.expires_at && Date.parse(change.expires_at) <= Date.now()) throw fail("ORDER_CHANGE_EXPIRED", "The airline change price expired. Search for a new change offer.", 409);
}

export async function searchDuffelOrderChangesCore(input = {}) {
  const orderId = id(input.orderId, "ord_", "order");
  const removeSliceId = genericId(input.removeSliceId, "slice");
  const add = validateAddSlice(input.addSlice || {});
  const orderResponse = await duffelRequest(`/air/orders/${encodeURIComponent(orderId)}`, { retrySafe: true });
  const order = orderResponse.data;
  if (!arr(order?.available_actions).includes("change")) throw fail("ORDER_CHANGE_NOT_AVAILABLE", "The airline does not currently allow a flight change for this order.", 409);
  if (!arr(order.slices).some(s => s.id === removeSliceId)) throw fail("SLICE_NOT_IN_ORDER", "The selected flight slice is not part of this order.");
  const response = await duffelRequest("/air/order_change_requests", { method: "POST", retrySafe: false, body: { data: { order_id: orderId, slices: { remove: [{ slice_id: removeSliceId }], add: [{ origin: add.origin, destination: add.destination, departure_date: add.departureDate, cabin_class: add.cabinClass }] } } } });
  const request = response.data || {};
  return { changeRequestId: request.id || null, orderId, offers: arr(request.order_change_offers).map(normalizeChangeOffer) };
}

export async function createDuffelPendingOrderChangeCore(input = {}) {
  const offerId = id(input.orderChangeOfferId, "oco_", "order change offer");
  const response = await duffelRequest("/air/order_changes", { method: "POST", body: { data: { selected_order_change_offer: offerId } }, retrySafe: false });
  if (response.status === 202 || !response.data?.id) return { change: response.data?.id ? normalizeOrderChange(response.data) : null, reconciliationRequired: true, providerStatus: response.status, requestId: response.requestId || null, correlationId: response.correlationId || null };
  return { change: normalizeOrderChange(response.data) };
}

export async function getDuffelPendingOrderChangeCore(input = {}) {
  const changeId = genericId(input.orderChangeId, "order change");
  const response = await duffelRequest(`/air/order_changes/${encodeURIComponent(changeId)}`, { retrySafe: true });
  return { change: normalizeOrderChange(response.data || {}) };
}

export async function prepareDuffelOrderChangePaymentCore(input = {}) {
  const changeId = genericId(input.orderChangeId, "order change");
  const raw = (await duffelRequest(`/air/order_changes/${encodeURIComponent(changeId)}`, { retrySafe: true })).data;
  assertPendingChange(raw);
  const changeAmount = Number(raw.change_total_amount || 0);
  if (!(changeAmount > 0)) return { change: normalizeOrderChange(raw), paymentRequired: false, payment: null };
  const code = currency(raw.change_total_currency), minor = amountToMinor(raw.change_total_amount, code);
  const [intent, publishableKey] = await Promise.all([
    createStripePaymentIntent({
      amount: minor, currency: code, captureMethod: "manual",
      idempotencyContext: `order_change:${changeId}`,
      idempotencyKey: `skandi_change_auth_${changeId}_${minor}_${code}`.slice(0, 255),
      description: `SKANDI airline change ${changeId}`,
      metadata: { integration: "skandi_duffel_order_change", order_change_id: changeId }
    }),
    getStripePublishableKey()
  ]);
  return { change: normalizeOrderChange(raw), paymentRequired: true, payment: { paymentIntentId: intent.id, clientSecret: intent.client_secret, publishableKey, amount: raw.change_total_amount, currency: code, status: intent.status, captureMethod: intent.capture_method || "manual" } };
}

export async function confirmDuffelOrderChangeCore(input = {}) {
  const changeId = genericId(input.orderChangeId, "order change");
  const raw = (await duffelRequest(`/air/order_changes/${encodeURIComponent(changeId)}`, { retrySafe: true })).data;
  assertPendingChange(raw);
  const changeAmount = Number(raw.change_total_amount || 0);
  const code = raw.change_total_currency ? currency(raw.change_total_currency) : null;
  const data = {};
  let paymentIntentId = null;

  if (changeAmount > 0) {
    paymentIntentId = id(input.paymentIntentId, "pi_", "payment");
    const intent = await retrieveStripePaymentIntent(paymentIntentId);
    assertStripeAuthorization(intent, { amount: amountToMinor(raw.change_total_amount, code), currency: code, metadata: { order_change_id: changeId }, allowCaptured: false });
    data.payment = { type: "balance", currency: code, amount: String(raw.change_total_amount) };
  }

  let response;
  try {
    response = await duffelRequest(`/air/order_changes/${encodeURIComponent(changeId)}/actions/confirm`, { method: "POST", body: { data }, timeoutMs: 130000, retrySafe: false });
  } catch (err) {
    // When the supplier result is definitely rejected (not an outcome-unknown transport failure), release the unused customer hold.
    if (paymentIntentId && (!(err instanceof ProviderError) || err.outcomeUnknown !== true)) {
      cancelStripePaymentIntent(paymentIntentId, `skandi_change_void_${changeId}`.slice(0, 255)).catch(() => {});
    }
    throw err;
  }

  if (response.status === 202 || !response.data?.id) {
    return { change: response.data?.id ? normalizeOrderChange(response.data) : null, orderId: response.data?.order_id || raw.order_id || null, reconciliationRequired: true, providerStatus: response.status, paymentIntentId, customerPaymentCaptureRequired: Boolean(paymentIntentId), requestId: response.requestId || null, correlationId: response.correlationId || null };
  }

  const change = normalizeOrderChange(response.data);
  let capture = null;
  if (paymentIntentId) {
    try {
      capture = await captureStripePaymentIntent(paymentIntentId, `skandi_change_capture_${changeId}`.slice(0, 255));
    } catch (err) {
      throw fail("ORDER_CHANGE_PAYMENT_CAPTURE_RECONCILIATION_REQUIRED", "The airline change was confirmed, but the customer payment capture requires reconciliation. Do not confirm the airline change again.", 409, { orderId: change.orderId, orderChangeId: change.id, paymentIntentId, customerPaymentCaptureRequired: true, causeCode: err?.code || null });
    }
    if (capture.status !== "succeeded") {
      throw fail("ORDER_CHANGE_PAYMENT_CAPTURE_RECONCILIATION_REQUIRED", "The airline change was confirmed, but the customer payment capture is incomplete. Do not confirm the airline change again.", 409, { orderId: change.orderId, orderChangeId: change.id, paymentIntentId, customerPaymentCaptureRequired: true, paymentStatus: capture.status || null });
    }
  }

  return {
    change,
    orderId: change.orderId,
    paymentIntentId,
    paymentCaptureStatus: capture?.status || null,
    customerPaymentCaptureRequired: false,
    customerRefundRequired: changeAmount < 0,
    customerRefundAmount: changeAmount < 0 ? Math.abs(changeAmount).toFixed(2) : "0.00",
    customerRefundCurrency: code
  };
}
