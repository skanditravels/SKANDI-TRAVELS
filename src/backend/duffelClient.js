// Backend-only HTTP clients for Duffel and Stripe.
// Never import this file from public page code.

import { fetch } from "wix-fetch";
import { elevate } from "wix-auth";
import { secrets } from "wix-secrets-backend.v2";

const DUFFEL_BASE_URL = "https://api.duffel.com";
const STRIPE_BASE_URL = "https://api.stripe.com";
const DUFFEL_VERSION = "v2";

const elevatedGetSecretValue = elevate(secrets.getSecretValue);
const secretCache = new Map();

export class ProviderError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = "ProviderError";
    this.code = options.code || "PROVIDER_ERROR";
    this.status = options.status || 500;
    this.retryable = Boolean(options.retryable);
    this.publicMessage = options.publicMessage || "The travel provider could not complete the request.";
  }
}

export async function duffelRequest(path, options = {}) {
  const token = await getRequiredSecret("DUFFEL_ACCESS_TOKEN");
  const url = buildUrl(DUFFEL_BASE_URL, path, options.query);
  const headers = {
    Accept: "application/json",
    "Accept-Encoding": "gzip",
    Authorization: `Bearer ${token}`,
    "Duffel-Version": DUFFEL_VERSION,
    ...options.headers
  };

  const request = {
    method: options.method || "GET",
    headers
  };

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    request.body = JSON.stringify(options.body);
  }

  let response;
  try {
    response = await fetch(url, request);
  } catch (error) {
    throw new ProviderError("Duffel network request failed.", {
      code: "DUFFEL_NETWORK_ERROR",
      status: 503,
      retryable: true,
      publicMessage: "Duffel could not be reached. Retry without submitting a second payment."
    });
  }

  const payload = await parseResponse(response);
  if (!response.ok) {
    throw duffelError(response.status, payload);
  }

  return {
    data: payload?.data,
    meta: payload?.meta || null,
    status: response.status
  };
}

export async function createStripePaymentIntent({
  amount,
  currency,
  offerId,
  selectionSignature,
  idempotencyKey
}) {
  const form = {
    amount: String(amount),
    currency: String(currency).toLowerCase(),
    "automatic_payment_methods[enabled]": "true",
    "metadata[offer_id]": offerId,
    "metadata[selection_signature]": selectionSignature,
    "metadata[integration]": "skandi_duffel"
  };

  const response = await stripeRequest("/v1/payment_intents", {
    method: "POST",
    form,
    idempotencyKey
  });

  return response.data;
}

export async function retrieveStripePaymentIntent(paymentIntentId) {
  const id = assertStripeId(paymentIntentId, "pi_");
  const response = await stripeRequest(`/v1/payment_intents/${encodeURIComponent(id)}`);
  return response.data;
}

export async function attachDuffelOrderToPaymentIntent(paymentIntentId, orderId) {
  const id = assertStripeId(paymentIntentId, "pi_");
  const response = await stripeRequest(`/v1/payment_intents/${encodeURIComponent(id)}`, {
    method: "POST",
    form: {
      "metadata[duffel_order_id]": orderId
    }
  });
  return response.data;
}

export async function getStripePublishableKey() {
  const key = await getRequiredSecret("STRIPE_PUBLISHABLE_KEY");
  if (!/^pk_(test|live)_[A-Za-z0-9]+$/.test(key)) {
    throw new ProviderError("Invalid Stripe publishable key.", {
      code: "STRIPE_CONFIGURATION_ERROR",
      status: 500,
      publicMessage: "Secure payment is not configured correctly."
    });
  }
  return key;
}

export async function getProviderEnvironment() {
  const token = await getRequiredSecret("DUFFEL_ACCESS_TOKEN");
  return token.includes("_test_") || token.startsWith("duffel_test_") ? "test" : "live";
}

async function stripeRequest(path, options = {}) {
  const secretKey = await getRequiredSecret("STRIPE_SECRET_KEY");
  const headers = {
    Accept: "application/json",
    Authorization: `Bearer ${secretKey}`
  };
  const request = {
    method: options.method || "GET",
    headers
  };

  if (options.form) {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    request.body = encodeForm(options.form);
  }
  if (options.idempotencyKey) {
    headers["Idempotency-Key"] = String(options.idempotencyKey).slice(0, 255);
  }

  let response;
  try {
    response = await fetch(`${STRIPE_BASE_URL}${path}`, request);
  } catch (error) {
    throw new ProviderError("Stripe network request failed.", {
      code: "STRIPE_NETWORK_ERROR",
      status: 503,
      retryable: true,
      publicMessage: "The payment provider could not be reached. Check payment status before retrying."
    });
  }

  const payload = await parseResponse(response);
  if (!response.ok) {
    throw new ProviderError(payload?.error?.message || "Stripe rejected the request.", {
      code: String(payload?.error?.code || "STRIPE_REQUEST_FAILED").toUpperCase(),
      status: response.status,
      retryable: response.status >= 500 || response.status === 429,
      publicMessage: safeStripeMessage(payload, response.status)
    });
  }

  return { data: payload, status: response.status };
}

async function getRequiredSecret(name) {
  if (!secretCache.has(name)) {
    secretCache.set(name, loadSecret(name).catch((error) => {
      secretCache.delete(name);
      throw error;
    }));
  }
  return secretCache.get(name);
}

async function loadSecret(name) {
  let result;
  try {
    result = await elevatedGetSecretValue(name);
  } catch (error) {
    throw new ProviderError(`Unable to read ${name}.`, {
      code: "SECRET_CONFIGURATION_ERROR",
      status: 500,
      publicMessage: "The reservation backend is missing required secure configuration."
    });
  }

  const value = typeof result === "string" ? result : result?.value;
  if (!value || typeof value !== "string") {
    throw new ProviderError(`Missing ${name}.`, {
      code: "SECRET_CONFIGURATION_ERROR",
      status: 500,
      publicMessage: "The reservation backend is missing required secure configuration."
    });
  }
  return value.trim();
}

function buildUrl(baseUrl, path, query = {}) {
  const normalizedPath = String(path || "").startsWith("/") ? String(path) : `/${path}`;
  const entries = Object.entries(query).filter(([, value]) => value !== undefined && value !== null && value !== "");
  if (!entries.length) return `${baseUrl}${normalizedPath}`;

  const search = entries.flatMap(([key, value]) => {
    const values = Array.isArray(value) ? value : [value];
    return values.map((item) => `${encodeURIComponent(key)}=${encodeURIComponent(String(item))}`);
  }).join("&");

  return `${baseUrl}${normalizedPath}?${search}`;
}

async function parseResponse(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new ProviderError("Provider returned invalid JSON.", {
      code: "INVALID_PROVIDER_RESPONSE",
      status: 502,
      retryable: response.status >= 500,
      publicMessage: "The provider returned an unreadable response."
    });
  }
}

function duffelError(status, payload) {
  const firstError = Array.isArray(payload?.errors) ? payload.errors[0] : null;
  const code = String(firstError?.code || `DUFFEL_HTTP_${status}`).toUpperCase();
  const retryable = status === 408 || status === 409 || status === 425 || status === 429 || status >= 500;

  const publicMessages = {
    OFFER_NO_LONGER_AVAILABLE: "That offer is no longer available. Search again for a current option.",
    OFFER_EXPIRED: "That offer expired. Search again for a current option.",
    PRICE_CHANGED: "The airline changed the price. Refresh the offer before continuing.",
    ALREADY_BOOKED: "This offer has already been booked. Retrieve the existing order.",
    INSUFFICIENT_BALANCE: "The Duffel balance is insufficient to create this order.",
    SERVICE_UNAVAILABLE: "A selected seat or baggage service is no longer available."
  };

  const fallback = status === 429
    ? "Duffel is temporarily rate limiting requests. Retry shortly."
    : status >= 500
      ? "Duffel could not complete the request. Check the order by offer ID before retrying."
      : "Duffel rejected the reservation request. Refresh the offer and review the traveler details.";

  return new ProviderError(firstError?.message || firstError?.title || `Duffel request failed (${status}).`, {
    code,
    status,
    retryable,
    publicMessage: publicMessages[code] || fallback
  });
}

function safeStripeMessage(payload, status) {
  if (status === 402) return payload?.error?.message || "Payment was declined.";
  if (status === 429) return "The payment provider is busy. Check payment status before retrying.";
  if (status >= 500) return "The payment provider could not complete the request. Check payment status before retrying.";
  return payload?.error?.message || "The payment request was rejected.";
}

function encodeForm(form) {
  return Object.entries(form)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join("&");
}

function assertStripeId(value, prefix) {
  const id = String(value || "").trim();
  const pattern = new RegExp(`^${prefix}[A-Za-z0-9_]+$`);
  if (!pattern.test(id)) {
    throw new ProviderError("Invalid Stripe resource ID.", {
      code: "INVALID_PAYMENT_REFERENCE",
      status: 400,
      publicMessage: "The payment reference is invalid."
    });
  }
  return id;
}
