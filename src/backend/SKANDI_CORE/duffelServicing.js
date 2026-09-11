// /src/backend/SKANDI_CORE/duffelServicing.js
// SKANDI R-006.2 — reusable Duffel order-servicing core.

import {
  ProviderError,
  duffelRequest,
  createStripePaymentIntent,
  retrieveStripePaymentIntent,
  getStripePublishableKey
} from "./duffelClient.js";
const CABIN_CLASSES = new Set(["economy","premium_economy","business","first"]);
const ZERO_DECIMAL_CURRENCIES = new Set([
  "BIF","CLP","DJF","GNF","JPY","KMF","KRW","MGA","PYG","RWF","UGX","VND","VUV","XAF","XOF","XPF"
]);


export const searchDuffelOrderChangesCore = secureCore(async (input={}) => {
  const orderId = resourceId(input.orderId,"ord_","order");
  const removeSliceId = genericResourceId(input.removeSliceId,"slice");
  const add = validateAddSlice(input.addSlice || {});


  const order = (await duffelRequest(`/air/orders/${encodeURIComponent(orderId)}`)).data;
  if (!Array.isArray(order?.available_actions) || !order.available_actions.includes("change")) {
    throw portalError("ORDER_CHANGE_NOT_AVAILABLE","The airline does not currently allow a flight change for this order.");
  }
  if (!(order.slices || []).some(slice => slice.id === removeSliceId)) {
    throw portalError("SLICE_NOT_IN_ORDER","The selected flight slice is not part of this order.");
  }


  const response = await duffelRequest("/air/order_change_requests", {
    method: "POST",
    body: {
      data: {
        order_id: orderId,
        slices: {
          remove: [{ slice_id: removeSliceId }],
          add: [{
            origin: add.origin,
            destination: add.destination,
            departure_date: add.departureDate,
            cabin_class: add.cabinClass
          }]
        }
      }
    }
  });


  const request = response.data || {};
  return {
    changeRequestId: request.id || null,
    orderId,
    offers: (request.order_change_offers || []).map(normalizeChangeOffer)
  };
});


export const createDuffelPendingOrderChangeCore = secureCore(async (input={}) => {
  const offerId = resourceId(input.orderChangeOfferId,"oco_","order change offer");
  const response = await duffelRequest("/air/order_changes", {
    method: "POST",
    body: { data: { selected_order_change_offer: offerId } }
  });
  const change = normalizeOrderChange(response.data);
  if (!change.id) throw portalError("ORDER_CHANGE_CREATE_FAILED","Duffel did not return a pending order change.");
  return { change };
});


export const getDuffelPendingOrderChangeCore = secureCore(async (input={}) => {
  const changeId = genericResourceId(input.orderChangeId,"order change");
  const response = await duffelRequest(`/air/order_changes/${encodeURIComponent(changeId)}`);
  return { change: normalizeOrderChange(response.data) };
});


export const prepareDuffelOrderChangePaymentCore = secureCore(async (input={}) => {
  const changeId = genericResourceId(input.orderChangeId,"order change");
  const raw = (await duffelRequest(`/air/order_changes/${encodeURIComponent(changeId)}`)).data;
  assertPendingChange(raw);
  const amount = Number(raw.change_total_amount || 0);
  if (!(amount > 0)) {
    return { change: normalizeOrderChange(raw), payment: null, paymentRequired: false };
  }
  const currency = currencyCode(raw.change_total_currency);
  const minor = amountToMinor(raw.change_total_amount,currency);
  const metadataOfferId = `order_change:${changeId}`;
  const idempotencyKey = `skandi_change_${changeId}_${minor}_${currency}`.slice(0,255);
  const [intent,publishableKey] = await Promise.all([
    createStripePaymentIntent({
      amount: minor,
      currency,
      offerId: metadataOfferId,
      selectionSignature: "order-change",
      idempotencyKey
    }),
    getStripePublishableKey()
  ]);
  if (!intent?.id || !intent?.client_secret) {
    throw portalError("CHANGE_PAYMENT_SETUP_FAILED","Secure change payment could not be prepared.");
  }
  return {
    change: normalizeOrderChange(raw),
    paymentRequired: true,
    payment: {
      paymentIntentId: intent.id,
      clientSecret: intent.client_secret,
      publishableKey,
      amount: raw.change_total_amount,
      currency,
      status: intent.status
    }
  };
});


export const confirmDuffelOrderChangeCore = secureCore(async (input={}) => {
  const changeId = genericResourceId(input.orderChangeId,"order change");
  const raw = (await duffelRequest(`/air/order_changes/${encodeURIComponent(changeId)}`)).data;
  assertPendingChange(raw);


  const changeAmount = Number(raw.change_total_amount || 0);
  const currency = raw.change_total_currency ? currencyCode(raw.change_total_currency) : null;
  const data = {};


  if (changeAmount > 0) {
    const paymentIntentId = stripeId(input.paymentIntentId);
    const intent = await retrieveStripePaymentIntent(paymentIntentId);
    const expectedMinor = amountToMinor(raw.change_total_amount,currency);
    if (intent?.status !== "succeeded") {
      throw portalError("CHANGE_PAYMENT_NOT_COMPLETE","Complete the customer payment before confirming the airline change.");
    }
    if (String(intent.currency || "").toUpperCase() !== currency) {
      throw portalError("CHANGE_PAYMENT_CURRENCY_MISMATCH","The completed payment currency does not match the current airline change price.");
    }
    if (Number(intent.amount_received) !== expectedMinor) {
      throw portalError("CHANGE_PAYMENT_AMOUNT_MISMATCH","The completed payment amount does not match the current airline change price.");
    }
    if (intent.metadata?.offer_id !== `order_change:${changeId}` || intent.metadata?.selection_signature !== "order-change") {
      throw portalError("CHANGE_PAYMENT_REFERENCE_MISMATCH","The payment belongs to a different airline change.");
    }
    data.payment = {
      type: "balance",
      currency,
      amount: String(raw.change_total_amount)
    };
  }


  const response = await duffelRequest(`/air/order_changes/${encodeURIComponent(changeId)}/actions/confirm`, {
    method: "POST",
    body: { data }
  });
  const change = normalizeOrderChange(response.data);
  return {
    change,
    orderId: change.orderId,
    customerRefundRequired: changeAmount < 0,
    customerRefundAmount: changeAmount < 0 ? Math.abs(changeAmount).toFixed(2) : "0.00",
    customerRefundCurrency: currency
  };
});


function validateAddSlice(value={}) {
  const origin = iata(value.origin,"origin");
  const destination = iata(value.destination,"destination");
  if (origin === destination) throw portalError("INVALID_CHANGE_ROUTE","Origin and destination must be different.");
  const departureDate = isoFutureDate(value.departureDate,"departure date");
  const cabinClass = clean(value.cabinClass,30).toLowerCase();
  if (!CABIN_CLASSES.has(cabinClass)) throw portalError("INVALID_CABIN_CLASS","Choose a supported cabin class.");
  return { origin,destination,departureDate,cabinClass };
}


function normalizeChangeOffer(offer={}) {
  return {
    id: offer.id || null,
    expiresAt: offer.expires_at || null,
    changeTotalAmount: offer.change_total_amount ?? null,
    changeTotalCurrency: offer.change_total_currency || null,
    penaltyTotalAmount: offer.penalty_total_amount ?? null,
    penaltyTotalCurrency: offer.penalty_total_currency || null,
    newTotalAmount: offer.new_total_amount ?? null,
    newTotalCurrency: offer.new_total_currency || null,
    slices: normalizeChangeSlices(offer.slices)
  };
}


function normalizeOrderChange(change={}) {
  return {
    id: change.id || null,
    orderId: change.order_id || null,
    createdAt: change.created_at || null,
    updatedAt: change.updated_at || null,
    expiresAt: change.expires_at || null,
    confirmedAt: change.confirmed_at || null,
    changeTotalAmount: change.change_total_amount ?? "0.00",
    changeTotalCurrency: change.change_total_currency || null,
    penaltyTotalAmount: change.penalty_total_amount ?? null,
    penaltyTotalCurrency: change.penalty_total_currency || null,
    newTotalAmount: change.new_total_amount ?? null,
    newTotalCurrency: change.new_total_currency || null,
    refundTo: change.refund_to || null,
    slices: normalizeChangeSlices(change.slices)
  };
}


function normalizeChangeSlices(slices={}) {
  return {
    remove: (slices?.remove || []).map(normalizeSlice),
    add: (slices?.add || []).map(normalizeSlice)
  };
}


function normalizeSlice(slice={}) {
  return {
    id: slice.id || slice.slice_id || null,
    origin: normalizeLocation(slice.origin),
    destination: normalizeLocation(slice.destination),
    duration: slice.duration || null,
    segments: (slice.segments || []).map(segment => ({
      id: segment.id || null,
      departingAt: segment.departing_at || null,
      arrivingAt: segment.arriving_at || null,
      origin: normalizeLocation(segment.origin),
      destination: normalizeLocation(segment.destination),
      marketingCarrier: normalizeCarrier(segment.marketing_carrier),
      marketingFlightNumber: segment.marketing_carrier_flight_number || null,
      operatingCarrier: normalizeCarrier(segment.operating_carrier),
      operatingFlightNumber: segment.operating_carrier_flight_number || null
    }))
  };
}
function normalizeCarrier(x){ return x ? {id:x.id||null,iataCode:x.iata_code||null,name:x.name||null} : null; }
function normalizeLocation(x){
  if (!x) return null;
  if (typeof x === "string") return { iataCode:x, name:null, cityName:null };
  return {id:x.id||null,iataCode:x.iata_code||null,name:x.name||null,cityName:x.city_name||x.city?.name||null};
}


function assertPendingChange(change) {
  if (!change?.id) throw portalError("ORDER_CHANGE_NOT_FOUND","The pending airline change could not be found.");
  if (change.confirmed_at) throw portalError("ORDER_CHANGE_ALREADY_CONFIRMED","This airline change has already been confirmed.");
  if (change.expires_at && new Date(change.expires_at).getTime() <= Date.now()) {
    throw portalError("ORDER_CHANGE_EXPIRED","The airline change price expired. Search for a new change offer.");
  }
}


function amountToMinor(amount,currency) {
  const code = currencyCode(currency);
  const raw = String(amount ?? "").trim();
  if (!/^\d+(\.\d+)?$/.test(raw)) throw portalError("INVALID_AMOUNT","The airline change amount is invalid.");
  if (ZERO_DECIMAL_CURRENCIES.has(code)) {
    const v = Math.round(Number(raw));
    if (!Number.isSafeInteger(v)) throw portalError("INVALID_AMOUNT","The airline change amount is too large.");
    return v;
  }
  const [whole,fraction=""] = raw.split(".");
  const v = Number(whole)*100 + Number(`${fraction}00`.slice(0,2));
  if (!Number.isSafeInteger(v)) throw portalError("INVALID_AMOUNT","The airline change amount is too large.");
  return v;
}
function currencyCode(value){ const x=clean(value,3).toUpperCase(); if(!/^[A-Z]{3}$/.test(x))throw portalError("INVALID_CURRENCY","The airline currency is invalid."); return x; }
function stripeId(value){ const x=clean(value,140); if(!/^pi_[A-Za-z0-9_]+$/.test(x))throw portalError("PAYMENT_REQUIRED","A valid completed payment is required."); return x; }
function resourceId(value,prefix,label){ const x=clean(value,140); if(!new RegExp(`^${prefix}[A-Za-z0-9_]+$`).test(x))throw portalError("INVALID_RESOURCE_ID",`The ${label} ID is invalid.`); return x; }
function genericResourceId(value,label){ const x=clean(value,140); if(!/^[a-z]{2,20}_[A-Za-z0-9_]+$/.test(x))throw portalError("INVALID_RESOURCE_ID",`The ${label} ID is invalid.`); return x; }
function iata(value,label){ const x=clean(value,3).toUpperCase(); if(!/^[A-Z]{3}$/.test(x))throw portalError("INVALID_IATA_CODE",`The ${label} must be a three-letter IATA code.`); return x; }
function isoFutureDate(value,label){
  const x=clean(value,10);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(x)) throw portalError("INVALID_DATE",`The ${label} must be today or later.`);
  const parsed=new Date(`${x}T00:00:00Z`);
  if(Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0,10)!==x || x<new Date().toISOString().slice(0,10)){
    throw portalError("INVALID_DATE",`The ${label} must be today or later.`);
  }
  return x;
}
function clean(value,max=2000){ return String(value ?? "").trim().slice(0,max); }


function secureCore(handler) {
  return async (input = {}) => {
    try {
      return await handler(input);
    } catch (error) {
      throw sanitize(error);
    }
  };
}

function portalError(code,message){ const e=new Error(message);e.code=code;e.publicMessage=message;return e; }
function sanitize(error){
  const e = new Error(clean(error?.publicMessage,300) || (error instanceof ProviderError ? "The travel provider could not complete the request." : "The servicing action could not be completed."));
  e.name="ReservationError";
  e.code=/^[A-Z0-9_]{1,60}$/.test(String(error?.code||"").toUpperCase())?String(error.code).toUpperCase():"SERVICING_ACTION_FAILED";
  e.publicMessage=e.message;
  return e;
}