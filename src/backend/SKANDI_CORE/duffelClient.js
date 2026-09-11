// /src/backend/SKANDI_CORE/duffelClient.js
// SKANDI canonical server-only Duffel + Stripe transport.
// Recovery R-006.5: bounded request lifecycle, Duffel request tracing,
// current retry semantics, rate-limit metadata, and 130s booking mutations.
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
    this.providerRequestId = options.providerRequestId || "";
    this.correlationId = options.correlationId || "";
    this.retryAfter = options.retryAfter || "";
    this.rateLimit = options.rateLimit || null;
    this.outcomeUnknown = Boolean(options.outcomeUnknown);
  }
}


function safeHeader(response, name) {
  try {
    return String(response?.headers?.get?.(name) || "").slice(0, 240);
  } catch (_) {
    return "";
  }
}


function safeProviderLog(provider, path, response, raw, reason) {
  const meta = {
    provider,
    path: String(path || "").split("?")[0].slice(0, 180),
    status: Number(response?.status || 0),
    contentType: safeHeader(response, "content-type"),
    requestId: safeHeader(response, "x-request-id"),
    bodyLength: String(raw || "").length,
    reason
  };
  // Never log credentials, request bodies, card data, or provider response bodies.
  console.error("[TravelProvider]", meta);
  return meta;
}


async function readJsonResponse(response, provider, path) {
  const rawValue = await response.text();
  const raw = String(rawValue ?? "").replace(/^\uFEFF/, "").trim();
  if (!raw) {
    return { payload: null, validJson: response?.status === 204, raw };
  }
  try {
    return { payload: JSON.parse(raw), validJson: true, raw };
  } catch (_) {
    safeProviderLog(provider, path, response, raw, "NON_JSON_RESPONSE");
    return { payload: null, validJson: false, raw };
  }
}


export async function duffelRequest(path, options = {}) {
  const token = await getRequiredSecret("DUFFEL_ACCESS_TOKEN");
  const method = String(options.method || "GET").toUpperCase();
  const correlationId = cleanCorrelationId(options.correlationId) || makeCorrelationId();
  const timeoutMs = resolveDuffelTimeout(path, method, options.timeoutMs);
  const url = buildUrl(DUFFEL_BASE_URL, path, options.query);
  const headers = {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
    "Duffel-Version": DUFFEL_VERSION,
    "x-client-correlation-id": correlationId,
    ...options.headers
  };

  // Wix can negotiate/decompress automatically. Do not force gzip here because
  // some Wix gateway responses otherwise surface as undecoded/non-JSON bodies.
  delete headers["Accept-Encoding"];
  delete headers["accept-encoding"];

  const request = { method, headers };
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    request.body = JSON.stringify(options.body);
  }

  let response;
  try {
    response = await withTimeout(
      fetch(url, request),
      timeoutMs,
      () => new ProviderError("Duffel request timed out before Wix received a response.", {
        code: "DUFFEL_CLIENT_TIMEOUT",
        status: 504,
        retryable: isSafeToRetryAfterClientTimeout(method, path),
        publicMessage: timeoutPublicMessage(method, path),
        correlationId,
        outcomeUnknown: isTransactionalMutation(method, path)
      })
    );
  } catch (error) {
    if (error instanceof ProviderError) throw error;
    throw new ProviderError("Duffel network request failed.", {
      code: "DUFFEL_NETWORK_ERROR",
      status: 503,
      retryable: isSafeToRetryAfterNetworkFailure(method, path),
      publicMessage: isTransactionalMutation(method, path)
        ? "The supplier connection ended before the booking outcome was known. Do not retry the booking. Reconcile the supplier order first."
        : "Live travel availability could not be reached. Please try the search again.",
      correlationId,
      outcomeUnknown: isTransactionalMutation(method, path)
    });
  }

  const { payload, validJson, raw } = await readJsonResponse(response, "DUFFEL", path);
  const diagnostics = readDuffelDiagnostics(response, correlationId);

  if (!response.ok) {
    if (!validJson) {
      safeProviderLog("DUFFEL", path, response, raw, "HTTP_ERROR_NON_JSON");
      throw new ProviderError(`Duffel HTTP ${response.status} returned a non-JSON response.`, {
        code: `DUFFEL_HTTP_${response.status}`,
        status: response.status,
        retryable: duffelStatusIsRetryable(response.status),
        providerRequestId: diagnostics.requestId,
        correlationId: diagnostics.correlationId,
        retryAfter: diagnostics.retryAfter || diagnostics.rateLimit?.reset || "",
        rateLimit: diagnostics.rateLimit,
        outcomeUnknown: response.status === 500 || response.status === 502,
        publicMessage: duffelHttpPublicMessage(response.status, diagnostics)
      });
    }

    const error = duffelError(response.status, payload, diagnostics);
    throw error;
  }

  if (!validJson) {
    throw new ProviderError("Duffel returned invalid JSON.", {
      code: "INVALID_PROVIDER_RESPONSE",
      status: 502,
      retryable: false,
      providerRequestId: diagnostics.requestId,
      correlationId: diagnostics.correlationId,
      rateLimit: diagnostics.rateLimit,
      outcomeUnknown: isTransactionalMutation(method, path),
      publicMessage: "Duffel returned an invalid response. Do not automatically retry a booking mutation. Use the provider request reference for reconciliation."
    });
  }

  return {
    data: payload?.data,
    meta: payload?.meta || null,
    status: response.status,
    requestId: diagnostics.requestId,
    correlationId: diagnostics.correlationId,
    rateLimit: diagnostics.rateLimit,
    retryAfter: diagnostics.retryAfter || ""
  };
}

function readDuffelDiagnostics(response, fallbackCorrelationId = "") {
  const requestId = safeHeader(response, "x-request-id");
  const correlationId = safeHeader(response, "x-client-correlation-id") || fallbackCorrelationId;
  const limit = safeHeader(response, "ratelimit-limit");
  const remaining = safeHeader(response, "ratelimit-remaining");
  const reset = safeHeader(response, "ratelimit-reset");
  const retryAfter = safeHeader(response, "retry-after");
  return {
    requestId,
    correlationId,
    retryAfter,
    rateLimit: (limit || remaining || reset) ? { limit, remaining, reset } : null
  };
}

function resolveDuffelTimeout(path, method, explicitValue) {
  const explicit = Number(explicitValue);
  if (Number.isFinite(explicit) && explicit >= 1000 && explicit <= 135000) return Math.round(explicit);
  if (isTransactionalMutation(method, path)) return 130000;
  if (String(path || "").startsWith("/air/offer_requests")) return 30000;
  return 45000;
}

function isTransactionalMutation(method, path) {
  if (method !== "POST") return false;
  const value = String(path || "").split("?")[0];
  return (
    value === "/air/orders" ||
    value === "/stays/bookings" ||
    value === "/cars/bookings" ||
    value.includes("/actions/confirm")
  );
}

function isSafeToRetryAfterClientTimeout(method, path) {
  return !isTransactionalMutation(method, path);
}

function isSafeToRetryAfterNetworkFailure(method, path) {
  return !isTransactionalMutation(method, path);
}

function timeoutPublicMessage(method, path) {
  if (isTransactionalMutation(method, path)) {
    return "The supplier did not settle the booking response in time. Do not retry or submit payment again. Reconcile the supplier booking first.";
  }
  return "Live travel availability took too long to respond. Please run the search again.";
}

function duffelStatusIsRetryable(status) {
  return status === 429 || status === 503 || status === 504;
}

function duffelHttpPublicMessage(status, diagnostics = {}) {
  const ref = diagnostics.requestId ? ` Provider reference: ${diagnostics.requestId}.` : "";
  if (status === 429) {
    const reset = diagnostics.retryAfter || diagnostics.rateLimit?.reset;
    return reset
      ? `Duffel rate-limited the request. Retry after ${reset}.${ref}`
      : `Duffel rate-limited the request. Retry after the current rate-limit window.${ref}`;
  }
  if (status === 500 || status === 502) {
    return `Duffel could not confirm the provider outcome. Do not automatically retry this request.${ref}`;
  }
  if (status === 503 || status === 504) {
    return `Duffel is temporarily unavailable. Retry later.${ref}`;
  }
  return `The live travel request could not be completed. Review the request and try again if it is safe to do so.${ref}`;
}

function cleanCorrelationId(value) {
  const text = String(value || "").trim();
  return /^[A-Za-z0-9._:-]{1,120}$/.test(text) ? text : "";
}

function makeCorrelationId() {
  const random = Math.random().toString(36).slice(2, 12);
  return `skandi-${Date.now().toString(36)}-${random}`;
}

function withTimeout(promise, timeoutMs, errorFactory) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(errorFactory()), timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
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
    form: { "metadata[duffel_order_id]": orderId }
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
  const request = { method: options.method || "GET", headers };


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
  } catch (_) {
    throw new ProviderError("Stripe network request failed.", {
      code: "STRIPE_NETWORK_ERROR",
      status: 503,
      retryable: true,
      publicMessage: "The payment provider could not be reached. Check payment status before retrying."
    });
  }


  const { payload, validJson, raw } = await readJsonResponse(response, "STRIPE", path);
  if (!response.ok) {
    if (!validJson) {
      safeProviderLog("STRIPE", path, response, raw, "HTTP_ERROR_NON_JSON");
      throw new ProviderError(`Stripe HTTP ${response.status} returned a non-JSON response.`, {
        code: `STRIPE_HTTP_${response.status}`,
        status: response.status,
        retryable: response.status === 429 || response.status >= 500,
        publicMessage: "The payment provider could not complete the request. Check payment status before retrying."
      });
    }
    throw new ProviderError(payload?.error?.message || "Stripe rejected the request.", {
      code: String(payload?.error?.code || "STRIPE_REQUEST_FAILED").toUpperCase(),
      status: response.status,
      retryable: response.status >= 500 || response.status === 429,
      publicMessage: safeStripeMessage(payload, response.status)
    });
  }


  if (!validJson) {
    throw new ProviderError("Stripe returned invalid JSON.", {
      code: "INVALID_PAYMENT_PROVIDER_RESPONSE",
      status: 502,
      retryable: true,
      publicMessage: "The payment provider returned an invalid response. Check payment status before retrying."
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
  } catch (_) {
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


function duffelError(status, payload, diagnostics = {}) {
  const firstError = Array.isArray(payload?.errors) ? payload.errors[0] : null;
  const code = String(firstError?.code || `DUFFEL_HTTP_${status}`).toUpperCase();
  const retryable = duffelStatusIsRetryable(status);

  const publicMessages = {
    OFFER_NO_LONGER_AVAILABLE: "That offer is no longer available. Search again for a current option.",
    OFFER_EXPIRED: "That offer expired. Search again for a current option.",
    PRICE_CHANGED: "The airline changed the price. Refresh the offer before continuing.",
    ALREADY_BOOKED: "This offer has already been booked. Retrieve the existing order.",
    DUPLICATE_BOOKING: "The airline found a possible duplicate booking. Do not create another order until the existing booking is reconciled.",
    INSUFFICIENT_BALANCE: "The supplier balance is insufficient to create this booking.",
    SERVICE_UNAVAILABLE: "A selected seat or baggage service is no longer available.",
    ANCILLARY_SERVICE_NOT_AVAILABLE: "A selected seat or baggage service is no longer available."
  };

  const fallback = duffelHttpPublicMessage(status, diagnostics);
  return new ProviderError(
    firstError?.message || firstError?.title || `Duffel request failed (${status}).`,
    {
      code,
      status,
      retryable,
      publicMessage: publicMessages[code] || fallback,
      providerRequestId: diagnostics.requestId || payload?.meta?.request_id || "",
      correlationId: diagnostics.correlationId || "",
      retryAfter: diagnostics.retryAfter || diagnostics.rateLimit?.reset || "",
      rateLimit: diagnostics.rateLimit || null,
      outcomeUnknown: status === 500 || status === 502
    }
  );
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
