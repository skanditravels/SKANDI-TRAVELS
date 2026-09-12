// /src/backend/SKANDI_CORE/duffelClient.js
// SKANDI Backend Base 1.0 — B-005R2 canonical Duffel-only transport.
// Server-only. Owns Duffel HTTP, credentials, bounded read retries and diagnostics.
// It does NOT own Stripe, booking orchestration, ALTEA/Supabase persistence or Wix page methods.

import { fetch } from "wix-fetch";
import { elevate } from "wix-auth";
import { secrets } from "wix-secrets-backend.v2";

const DUFFEL_BASE_URL = "https://api.duffel.com";
const DUFFEL_VERSION = "v2";
const elevatedGetSecretValue = elevate(secrets.getSecretValue);
const secretCache = new Map();

export class ProviderError extends Error {
  constructor(message, options = {}) {
    super(String(message || "Provider request failed."));
    this.name = "ProviderError";
    this.code = String(options.code || "PROVIDER_ERROR");
    this.status = Number(options.status || 500);
    this.retryable = options.retryable === true;
    this.publicMessage = String(options.publicMessage || "The travel provider could not complete the request.");
    this.providerRequestId = String(options.providerRequestId || "");
    this.correlationId = String(options.correlationId || "");
    this.retryAfter = String(options.retryAfter || "");
    this.rateLimit = options.rateLimit || null;
    this.outcomeUnknown = options.outcomeUnknown === true;
    this.provider = "Duffel";
  }
}

function clean(value, max = 500) {
  return String(value ?? "").trim().slice(0, max);
}

function safeHeader(response, name) {
  try { return clean(response?.headers?.get?.(name), 240); } catch (_) { return ""; }
}

function correlationId(value = "") {
  const supplied = clean(value, 120);
  if (/^[A-Za-z0-9._:-]{1,120}$/.test(supplied)) return supplied;
  return `skandi-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function buildUrl(path, query = {}) {
  const normalized = String(path || "").startsWith("/") ? String(path) : `/${path}`;
  const parts = [];
  for (const [key, raw] of Object.entries(query || {})) {
    if (raw === undefined || raw === null || raw === "") continue;
    const values = Array.isArray(raw) ? raw : [raw];
    for (const value of values) parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  }
  return `${DUFFEL_BASE_URL}${normalized}${parts.length ? `?${parts.join("&")}` : ""}`;
}

function isBookingMutation(method, path) {
  if (String(method).toUpperCase() !== "POST") return false;
  const p = String(path || "").split("?")[0];
  return p === "/air/orders" ||
    p === "/stays/bookings" ||
    p === "/cars/bookings" ||
    /^\/air\/order_changes\/[^/]+\/actions\/confirm$/.test(p) ||
    /^\/air\/order_cancellations\/[^/]+\/actions\/confirm$/.test(p);
}

function retryableStatus(status) {
  // Duffel guidance: 500/502 can represent ambiguous outcomes and must not be blindly retried.
  // 429/503/504 may be retried only when the caller has declared the request retry-safe.
  return status === 429 || status === 503 || status === 504;
}

function defaultTimeout(method, path, explicit) {
  const n = Number(explicit);
  if (Number.isFinite(n) && n >= 1000 && n <= 135000) return Math.round(n);
  if (isBookingMutation(method, path)) return 130000;
  if (String(path || "").startsWith("/air/offer_requests")) return 70000;
  return 45000;
}

function retryDelayMs(response, attempt) {
  const retryAfter = Number(safeHeader(response, "retry-after"));
  if (Number.isFinite(retryAfter) && retryAfter > 0) return Math.min(5000, Math.round(retryAfter * 1000));
  const reset = Number(safeHeader(response, "ratelimit-reset"));
  if (Number.isFinite(reset) && reset > 0) {
    const nowSeconds = Math.floor(Date.now() / 1000);
    const delta = reset > nowSeconds ? (reset - nowSeconds) * 1000 : reset * 1000;
    if (delta > 0) return Math.min(5000, Math.round(delta));
  }
  return Math.min(2500, 250 * (2 ** Math.max(0, attempt - 1)));
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, Math.max(0, Number(ms) || 0)));
}

function withTimeout(promise, timeoutMs, errorFactory) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(errorFactory()), timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function readPayload(response, path, requestCorrelationId) {
  // Duffel flight-search responses can legitimately exceed 2 MB. Never truncate a
  // successful provider body before JSON parsing; truncation turns valid JSON into
  // a false NON_JSON_RESPONSE. Keep logging bounded, not the response itself.
  const raw = String(await response.text() ?? "").replace(/^\uFEFF/, "").trim();
  if (!raw) {
    if ([202, 204].includes(Number(response?.status))) return { payload: null, validJson: true, raw: "" };
    return { payload: null, validJson: false, raw: "" };
  }
  try { return { payload: JSON.parse(raw), validJson: true, raw }; }
  catch (_) {
    console.error("[DuffelTransport]", {
      path: String(path || "").split("?")[0].slice(0, 180),
      status: Number(response?.status || 0),
      requestId: safeHeader(response, "x-request-id"),
      correlationId: safeHeader(response, "x-client-correlation-id") || requestCorrelationId,
      reason: "NON_JSON_RESPONSE",
      bodyLength: raw.length
    });
    return { payload: null, validJson: false, raw };
  }
}

function diagnostics(response, fallbackCorrelationId) {
  const limit = safeHeader(response, "ratelimit-limit");
  const remaining = safeHeader(response, "ratelimit-remaining");
  const reset = safeHeader(response, "ratelimit-reset");
  return {
    requestId: safeHeader(response, "x-request-id"),
    correlationId: safeHeader(response, "x-client-correlation-id") || fallbackCorrelationId,
    retryAfter: safeHeader(response, "retry-after"),
    rateLimit: (limit || remaining || reset) ? { limit, remaining, reset } : null
  };
}

function publicMessage(status, diag = {}, outcomeUnknown = false) {
  const ref = diag.requestId ? ` Provider reference: ${diag.requestId}.` : "";
  if (outcomeUnknown || status === 500 || status === 502) {
    return `Duffel could not confirm the supplier outcome. Do not automatically retry the booking mutation.${ref}`;
  }
  if (status === 429) return `Duffel rate-limited the request. Retry after the current rate-limit window.${ref}`;
  if (status === 503 || status === 504) return `Duffel is temporarily unavailable. Retry the safe request later.${ref}`;
  if (status === 401 || status === 403) return "The travel provider connection is not authorized.";
  if (status === 404) return "The requested travel-provider resource was not found.";
  if (status === 422) return "Duffel rejected the booking request. Review the supplied details before trying again.";
  return `The live travel request could not be completed.${ref}`;
}

function providerErrorFromResponse(status, payload, diag, options = {}) {
  const first = Array.isArray(payload?.errors) ? payload.errors[0] : null;
  const outcomeUnknown = options.outcomeUnknown === true || status === 500 || status === 502;
  return new ProviderError(
    first?.message || first?.title || `Duffel request failed (${status}).`,
    {
      code: clean(first?.code || `DUFFEL_HTTP_${status}`, 100).toUpperCase(),
      status,
      retryable: options.retrySafe === true && retryableStatus(status),
      publicMessage: publicMessage(status, diag, outcomeUnknown),
      providerRequestId: diag.requestId,
      correlationId: diag.correlationId,
      retryAfter: diag.retryAfter || diag.rateLimit?.reset || "",
      rateLimit: diag.rateLimit,
      outcomeUnknown
    }
  );
}

export async function duffelRequest(path, options = {}) {
  const token = await requiredSecret("DUFFEL_ACCESS_TOKEN");
  const method = clean(options.method || "GET", 12).toUpperCase();
  const requestCorrelationId = correlationId(options.correlationId);
  const mutation = isBookingMutation(method, path);
  const retrySafe = options.retrySafe === true || (!mutation && ["GET", "HEAD"].includes(method));
  const maxAttempts = retrySafe ? Math.max(1, Math.min(3, Number(options.maxAttempts || 2))) : 1;
  const timeoutMs = defaultTimeout(method, path, options.timeoutMs);
  const url = buildUrl(path, options.query);

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const headers = {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      "Duffel-Version": DUFFEL_VERSION,
      "x-client-correlation-id": requestCorrelationId,
      ...(options.headers || {})
    };
    delete headers["Accept-Encoding"];
    delete headers["accept-encoding"];

    const request = { method, headers };
    if (options.body !== undefined) {
      headers["Content-Type"] = "application/json";
      request.body = JSON.stringify(options.body);
    }

    let response;
    try {
      response = await withTimeout(fetch(url, request), timeoutMs, () => new ProviderError(
        "Duffel request timed out before Wix received a response.",
        {
          code: "DUFFEL_TIMEOUT",
          status: 504,
          retryable: retrySafe && !mutation,
          publicMessage: mutation
            ? "The supplier did not settle the booking response in time. Do not retry the booking. Reconcile it first."
            : "Live travel availability took too long to respond. Please try the safe search again.",
          correlationId: requestCorrelationId,
          outcomeUnknown: mutation
        }
      ));
    } catch (error) {
      const normalized = error instanceof ProviderError ? error : new ProviderError(
        "Duffel network request failed.",
        {
          code: "DUFFEL_NETWORK_ERROR",
          status: 503,
          retryable: retrySafe && !mutation,
          publicMessage: mutation
            ? "The supplier connection ended before the booking outcome was known. Do not retry the booking. Reconcile it first."
            : "Live travel availability could not be reached. Please try the safe request again.",
          correlationId: requestCorrelationId,
          outcomeUnknown: mutation
        }
      );
      if (attempt < maxAttempts && normalized.retryable) { await delay(250 * attempt); continue; }
      throw normalized;
    }

    const diag = diagnostics(response, requestCorrelationId);
    const { payload, validJson } = await readPayload(response, path, requestCorrelationId);

    if (!response.ok) {
      const error = providerErrorFromResponse(Number(response.status || 500), payload, diag, {
        retrySafe,
        outcomeUnknown: mutation && [500, 502, 503, 504].includes(Number(response.status || 0))
      });
      if (attempt < maxAttempts && error.retryable) { await delay(retryDelayMs(response, attempt)); continue; }
      throw error;
    }

    if (!validJson) {
      throw new ProviderError("Duffel returned an invalid response.", {
        code: "INVALID_PROVIDER_RESPONSE",
        status: 502,
        retryable: false,
        publicMessage: mutation
          ? "Duffel returned an invalid booking response. Do not retry the booking. Reconcile the supplier outcome first."
          : "Duffel returned an invalid response. Please retry the safe request later.",
        providerRequestId: diag.requestId,
        correlationId: diag.correlationId,
        rateLimit: diag.rateLimit,
        outcomeUnknown: mutation
      });
    }

    return {
      data: payload?.data ?? null,
      meta: payload?.meta ?? null,
      status: Number(response.status || 200),
      requestId: diag.requestId || null,
      correlationId: diag.correlationId || requestCorrelationId,
      rateLimit: diag.rateLimit,
      retryAfter: diag.retryAfter || null
    };
  }

  throw new ProviderError("Duffel request failed.", { code: "DUFFEL_REQUEST_FAILED" });
}

export async function getDuffelEnvironment() {
  const token = await requiredSecret("DUFFEL_ACCESS_TOKEN");
  return /(^duffel_test_|_test_)/i.test(token) ? "test" : "live";
}

export async function getDuffelServerConfig() {
  return { provider: "Duffel", apiVersion: DUFFEL_VERSION, environment: await getDuffelEnvironment() };
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
    throw new ProviderError(`Unable to read ${name}.`, {
      code: "SECRET_CONFIGURATION_ERROR",
      status: 500,
      publicMessage: "The reservation backend is missing required secure configuration."
    });
  }
}