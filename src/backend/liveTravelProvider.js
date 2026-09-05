// Customer-booking travel-provider adapter.
// Keeps supplier-specific integration details out of the SKANDI booking flow.

import {
  duffelRequest,
  createStripePaymentIntent,
  retrieveStripePaymentIntent,
  attachDuffelOrderToPaymentIntent,
  getStripePublishableKey,
  getProviderEnvironment
} from "./duffelClient.js";

function neutralMessage(error) {
  const raw = String(
    error?.publicMessage ||
    error?.message ||
    "The live travel provider could not complete the request."
  ).trim();

  if (/network request failed|could not be reached/i.test(raw)) {
    return "The live travel provider could not be reached. Please try again.";
  }
  if (/rate limit|rate limiting/i.test(raw)) {
    return "Live availability is temporarily busy. Please try again shortly.";
  }

  // Provider adapters must never expose supplier/distribution brand names
  // through customer-booking errors.
  return raw
    .replace(/\bDuffel\b/gi, "the live travel provider")
    .replace(/\bAmadeus\b/gi, "the live travel provider");
}

function neutralCode(error) {
  const raw = String(error?.code || "TRAVEL_PROVIDER_ERROR")
    .trim()
    .toUpperCase();
  return raw
    .replace(/^DUFFEL_/, "TRAVEL_PROVIDER_")
    .replace(/^AMADEUS_/, "TRAVEL_PROVIDER_");
}

function wrap(error) {
  const wrapped = new Error(neutralMessage(error));
  wrapped.name = "TravelProviderError";
  wrapped.code = neutralCode(error);
  wrapped.status = Number(error?.status) || 500;
  wrapped.retryable = Boolean(error?.retryable);
  wrapped.publicMessage = neutralMessage(error);
  return wrapped;
}

export async function travelProviderRequest(path, options = {}) {
  try {
    return await duffelRequest(path, options);
  } catch (error) {
    throw wrap(error);
  }
}

export async function prepareSecurePaymentIntent(input) {
  try {
    return await createStripePaymentIntent(input);
  } catch (error) {
    throw wrap(error);
  }
}

export async function retrieveSecurePaymentIntent(paymentIntentId) {
  try {
    return await retrieveStripePaymentIntent(paymentIntentId);
  } catch (error) {
    throw wrap(error);
  }
}

export async function attachAirOrderToPaymentIntent(paymentIntentId, orderId) {
  try {
    return await attachDuffelOrderToPaymentIntent(paymentIntentId, orderId);
  } catch (error) {
    throw wrap(error);
  }
}

export async function getSecurePaymentPublishableKey() {
  try {
    return await getStripePublishableKey();
  } catch (error) {
    throw wrap(error);
  }
}

export async function getTravelProviderEnvironment() {
  try {
    return await getProviderEnvironment();
  } catch (error) {
    throw wrap(error);
  }
}
