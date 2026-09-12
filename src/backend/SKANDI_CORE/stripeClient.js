// /src/backend/SKANDI_CORE/stripeClient.js
// SKANDI Backend Base 1.0 — B-005R1 canonical Stripe-only transport.
// Server-only. Owns PaymentIntent transport and authorization assertions.
// It never owns Duffel, ALTEA/Supabase persistence, booking state, or Wix page methods.

import { fetch } from "wix-fetch";
import { elevate } from "wix-auth";
import { secrets } from "wix-secrets-backend.v2";

const STRIPE_BASE_URL = "https://api.stripe.com";
const elevatedGetSecretValue = elevate(secrets.getSecretValue);
const secretCache = new Map();

export class StripeProviderError extends Error {
  constructor(message, options = {}) {
    super(String(message || "Stripe request failed."));
    this.name = "StripeProviderError";
    this.code = String(options.code || "STRIPE_ERROR");
    this.status = Number(options.status || 500);
    this.retryable = options.retryable === true;
    this.publicMessage = String(options.publicMessage || "The payment provider could not complete the request.");
    this.requestId = String(options.requestId || "");
    this.provider = "Stripe";
  }
}

function clean(value, max = 500) { return String(value ?? "").trim().slice(0, max); }
function upper(value, max = 500) { return clean(value, max).toUpperCase(); }

function encodeForm(form = {}) {
  const parts = [];
  for (const [key, raw] of Object.entries(form)) {
    if (raw === undefined || raw === null) continue;
    const values = Array.isArray(raw) ? raw : [raw];
    for (const value of values) parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  }
  return parts.join("&");
}

function assertStripeId(value, prefix, label = "payment reference") {
  const id = clean(value, 255);
  if (!new RegExp(`^${prefix}[A-Za-z0-9_]+$`).test(id)) {
    throw new StripeProviderError(`Invalid ${label}.`, {
      code: "INVALID_PAYMENT_REFERENCE", status: 400, publicMessage: `The ${label} is invalid.`
    });
  }
  return id;
}

function normalizeMetadata(value = {}) {
  const out = {};
  for (const [key, raw] of Object.entries(value || {})) {
    const k = clean(key, 40).replace(/[^A-Za-z0-9_-]/g, "_");
    if (!k) continue;
    out[k] = clean(raw, 500);
  }
  return out;
}

function safeStripeMessage(payload, status) {
  const message = clean(payload?.error?.message, 400);
  if (status === 402) return message || "Payment was declined.";
  if (status === 429) return "The payment provider is busy. Check payment status before retrying.";
  if (status >= 500) return "The payment provider could not complete the request. Check payment status before retrying.";
  return message || "The payment request was rejected.";
}

async function stripeRequest(path, options = {}) {
  const secretKey = await requiredSecret("STRIPE_SECRET_KEY");
  const headers = { Accept: "application/json", Authorization: `Bearer ${secretKey}` };
  const request = { method: clean(options.method || "GET", 12).toUpperCase(), headers };
  if (options.form) {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    request.body = encodeForm(options.form);
  }
  if (options.idempotencyKey) headers["Idempotency-Key"] = clean(options.idempotencyKey, 255);

  let response;
  try { response = await fetch(`${STRIPE_BASE_URL}${path}`, request); }
  catch (_) {
    throw new StripeProviderError("Stripe network request failed.", {
      code: "STRIPE_NETWORK_ERROR", status: 503, retryable: true,
      publicMessage: "The payment provider could not be reached. Check payment status before retrying."
    });
  }

  let payload = null;
  const raw = String(await response.text() || "").trim();
  if (raw) {
    try { payload = JSON.parse(raw); }
    catch (_) {
      throw new StripeProviderError("Stripe returned invalid JSON.", {
        code: "INVALID_PAYMENT_PROVIDER_RESPONSE", status: 502, retryable: true,
        publicMessage: "The payment provider returned an invalid response. Check payment status before retrying.",
        requestId: clean(response?.headers?.get?.("request-id"), 240)
      });
    }
  }

  if (!response.ok) {
    throw new StripeProviderError(payload?.error?.message || `Stripe request failed (${response.status}).`, {
      code: upper(payload?.error?.code || `STRIPE_HTTP_${response.status}`, 100),
      status: Number(response.status || 500),
      retryable: Number(response.status) === 429 || Number(response.status) >= 500,
      publicMessage: safeStripeMessage(payload, Number(response.status || 500)),
      requestId: clean(response?.headers?.get?.("request-id"), 240)
    });
  }
  return payload || {};
}

export async function createStripePaymentIntent(input = {}) {
  const amount = Number(input.amount);
  const currency = clean(input.currency, 3).toLowerCase();
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    throw new StripeProviderError("Invalid PaymentIntent amount.", {
      code: "INVALID_PAYMENT_AMOUNT", status: 400, publicMessage: "The payment amount is invalid."
    });
  }
  if (!/^[a-z]{3}$/.test(currency)) {
    throw new StripeProviderError("Invalid PaymentIntent currency.", {
      code: "INVALID_PAYMENT_CURRENCY", status: 400, publicMessage: "The payment currency is invalid."
    });
  }

  const metadata = normalizeMetadata({
    ...(input.metadata || {}),
    ...(input.offerId ? { offer_id: input.offerId } : {}),
    ...(input.selectionSignature !== undefined ? { selection_signature: input.selectionSignature } : {}),
    ...(input.cartId ? { cart_id: input.cartId } : {}),
    ...(input.idempotencyContext ? { idempotency_context: input.idempotencyContext } : {}),
    integration: input.metadata?.integration || "skandi_booking"
  });

  const form = {
    amount: String(amount),
    currency,
    capture_method: input.captureMethod === "automatic" ? "automatic" : "manual",
    "payment_method_types[]": "card"
  };
  if (input.description) form.description = clean(input.description, 1000);
  if (input.receiptEmail) form.receipt_email = clean(input.receiptEmail, 254).toLowerCase();
  for (const [key, value] of Object.entries(metadata)) form[`metadata[${key}]`] = value;

  return stripeRequest("/v1/payment_intents", {
    method: "POST",
    form,
    idempotencyKey: clean(input.idempotencyKey || `skandi_pi_${input.idempotencyContext || Date.now()}`, 255)
  });
}

export async function retrieveStripePaymentIntent(paymentIntentId) {
  const id = assertStripeId(paymentIntentId, "pi_", "payment reference");
  return stripeRequest(`/v1/payment_intents/${encodeURIComponent(id)}`);
}

export async function captureStripePaymentIntent(paymentIntentId, idempotencyKey = "") {
  const id = assertStripeId(paymentIntentId, "pi_", "payment reference");
  return stripeRequest(`/v1/payment_intents/${encodeURIComponent(id)}/capture`, {
    method: "POST",
    form: {},
    idempotencyKey: clean(idempotencyKey || `skandi_capture_${id}`, 255)
  });
}

export async function cancelStripePaymentIntent(paymentIntentId, idempotencyKey = "") {
  const id = assertStripeId(paymentIntentId, "pi_", "payment reference");
  return stripeRequest(`/v1/payment_intents/${encodeURIComponent(id)}/cancel`, {
    method: "POST",
    form: {},
    idempotencyKey: clean(idempotencyKey || `skandi_cancel_${id}`, 255)
  });
}

export async function updateStripePaymentIntentMetadata(paymentIntentId, metadata = {}, idempotencyKey = "") {
  const id = assertStripeId(paymentIntentId, "pi_", "payment reference");
  const form = {};
  for (const [key, value] of Object.entries(normalizeMetadata(metadata))) form[`metadata[${key}]`] = value;
  return stripeRequest(`/v1/payment_intents/${encodeURIComponent(id)}`, {
    method: "POST", form, idempotencyKey: clean(idempotencyKey || `skandi_meta_${id}`, 255)
  });
}

export async function getStripePublishableKey() {
  const key = await requiredSecret("STRIPE_PUBLISHABLE_KEY");
  if (!/^pk_(test|live)_[A-Za-z0-9]+$/.test(key)) {
    throw new StripeProviderError("Invalid Stripe publishable key.", {
      code: "STRIPE_CONFIGURATION_ERROR", status: 500,
      publicMessage: "Secure payment is not configured correctly."
    });
  }
  return key;
}

export function assertStripeAuthorization(intent, expected = {}) {
  if (!intent?.id || !String(intent.id).startsWith("pi_")) {
    throw new StripeProviderError("Payment authorization is missing.", {
      code: "PAYMENT_AUTHORIZATION_MISSING", status: 409,
      publicMessage: "The payment authorization could not be verified."
    });
  }
  const allowedStatuses = expected.allowCaptured === true
    ? new Set(["requires_capture", "succeeded"])
    : new Set(["requires_capture"]);
  if (!allowedStatuses.has(String(intent.status || ""))) {
    throw new StripeProviderError(`PaymentIntent is ${intent.status || "not authorized"}.`, {
      code: "PAYMENT_NOT_AUTHORIZED", status: 409,
      publicMessage: "The card authorization is not ready for booking."
    });
  }
  if (expected.amount !== undefined && Number(intent.amount) !== Number(expected.amount)) {
    throw new StripeProviderError("Payment amount mismatch.", {
      code: "PAYMENT_AMOUNT_MISMATCH", status: 409,
      publicMessage: "The authorized amount does not match the current booking price."
    });
  }
  if (expected.currency && upper(intent.currency, 3) !== upper(expected.currency, 3)) {
    throw new StripeProviderError("Payment currency mismatch.", {
      code: "PAYMENT_CURRENCY_MISMATCH", status: 409,
      publicMessage: "The authorized currency does not match the current booking price."
    });
  }
  for (const [key, value] of Object.entries(normalizeMetadata(expected.metadata || {}))) {
    if (String(intent.metadata?.[key] ?? "") !== String(value)) {
      throw new StripeProviderError(`Payment metadata mismatch for ${key}.`, {
        code: "PAYMENT_CONTEXT_MISMATCH", status: 409,
        publicMessage: "The payment authorization belongs to a different booking."
      });
    }
  }
  if (String(intent.capture_method || "manual") !== "manual" && intent.status !== "succeeded") {
    throw new StripeProviderError("PaymentIntent is not configured for manual capture.", {
      code: "PAYMENT_CAPTURE_MODE_MISMATCH", status: 409,
      publicMessage: "The payment authorization is not configured for safe supplier-first capture."
    });
  }
  return true;
}

async function requiredSecret(name) {
  if (!secretCache.has(name)) {
    secretCache.set(name, loadSecret(name).catch(error => { secretCache.delete(name); throw error; }));
  }
  return secretCache.get(name);
}

async function loadSecret(name) {
  try {
    const result = await elevatedGetSecretValue(name);
    const value = typeof result === "string" ? result : result?.value;
    if (!clean(value, 10000)) throw new Error("empty");
    return String(value).trim();
  } catch (_) {
    throw new StripeProviderError(`Unable to read ${name}.`, {
      code: "SECRET_CONFIGURATION_ERROR", status: 500,
      publicMessage: "The payment backend is missing required secure configuration."
    });
  }
}
