// Canonical SKANDI backend travel-provider facade.
// Keeps customer booking code provider-agnostic while using the hardened Duffel/Stripe client.

import {
  ProviderError,
  duffelRequest,
  createStripePaymentIntent,
  retrieveStripePaymentIntent,
  attachDuffelOrderToPaymentIntent,
  getStripePublishableKey,
  getProviderEnvironment
} from "backend/duffelClient";

export class TravelProviderError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = "TravelProviderError";
    this.code = options.code || "TRAVEL_PROVIDER_ERROR";
    this.status = options.status || 500;
    this.retryable = Boolean(options.retryable);
    this.publicMessage = options.publicMessage || "Live travel availability could not complete the request.";
    this.providerRequestId = options.providerRequestId || "";
  }
}

function translate(error) {
  if (error instanceof TravelProviderError) return error;
  if (error instanceof ProviderError || error?.publicMessage || error?.code) {
    return new TravelProviderError(error?.message || "Travel provider request failed.", {
      code: error?.code || "TRAVEL_PROVIDER_ERROR",
      status: error?.status || 500,
      retryable: error?.retryable,
      publicMessage: error?.publicMessage || "Live travel availability could not complete the request.",
      providerRequestId: error?.providerRequestId || ""
    });
  }
  return new TravelProviderError("Travel provider request failed.", {
    code: "TRAVEL_PROVIDER_ERROR",
    status: 500,
    publicMessage: "Live travel availability could not complete the request."
  });
}

async function call(fn) {
  try {
    return await fn();
  } catch (error) {
    throw translate(error);
  }
}

export function travelProviderRequest(path, options = {}) {
  return call(() => duffelRequest(path, options));
}

export function prepareSecurePaymentIntent(input) {
  return call(() => createStripePaymentIntent(input));
}

export function retrieveSecurePaymentIntent(paymentIntentId) {
  return call(() => retrieveStripePaymentIntent(paymentIntentId));
}

export function attachAirOrderToPaymentIntent(paymentIntentId, orderId) {
  return call(() => attachDuffelOrderToPaymentIntent(paymentIntentId, orderId));
}

export function getSecurePaymentPublishableKey() {
  return call(() => getStripePublishableKey());
}

export function getTravelProviderEnvironment() {
  return call(() => getProviderEnvironment());
}
