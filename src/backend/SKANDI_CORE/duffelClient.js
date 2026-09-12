// /src/backend/SKANDI_CORE/duffelClient.js
// SKANDI Backend Base 1.0 — B-004 canonical Duffel HTTP transport.
// Duffel only: no Stripe, no page/webMethod ownership, no Inventory business logic.

import { fetch } from "wix-fetch";
import { elevate } from "wix-auth";
import { secrets } from "wix-secrets-backend.v2";
import { randomUUID } from "crypto";
import { text } from "backend/SKANDI_CORE/platformValidation.js";

const BASE_URL = "https://api.duffel.com";
const API_VERSION = "v2";
const DEFAULT_TIMEOUT_MS = 30000;
const MAX_TIMEOUT_MS = 130000;
const elevatedGetSecretValue = elevate(secrets.getSecretValue);
const secretCache = new Map();

export class ProviderError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = "ProviderError";
    this.code = options.code || "DUFFEL_PROVIDER_ERROR";
    this.status = Number(options.status || 500);
    this.retryable = options.retryable === true;
    this.publicMessage = options.publicMessage || "The travel provider could not complete the request.";
    this.providerRequestId = text(options.providerRequestId, 240);
    this.correlationId = text(options.correlationId, 240);
    this.rateLimit = options.rateLimit || null;
  }
}

function secretString(value) {
  if (typeof value === "string") return value.trim();
  if (value && typeof value === "object") {
    for (const key of ["value", "secretValue", "secret", "data"]) {
      if (typeof value[key] === "string" && value[key].trim()) return value[key].trim();
    }
  }
  return "";
}

async function getRequiredSecret(name) {
  if (secretCache.has(name)) return secretCache.get(name);
  const raw = await elevatedGetSecretValue(name);
  const value = secretString(raw);
  if (!value) {
    throw new ProviderError(`Missing Wix secret: ${name}`, {
      code: "DUFFEL_CONFIGURATION_ERROR",
      status: 500,
      publicMessage: "Duffel is not configured for this environment."
    });
  }
  secretCache.set(name, value);
  return value;
}

function safeHeader(response, name) {
  try { return text(response?.headers?.get?.(name), 240); }
  catch (_) { return ""; }
}

function rateLimitMeta(response) {
  const limit = safeHeader(response, "ratelimit-limit");
  const remaining = safeHeader(response, "ratelimit-remaining");
  const reset = safeHeader(response, "ratelimit-reset");
  return { limit: limit || null, remaining: remaining || null, reset: reset || null };
}

function encodeQuery(query = {}) {
  const parts = [];
  for (const [key, raw] of Object.entries(query || {})) {
    if (raw === undefined || raw === null || raw === "") continue;
    if (Array.isArray(raw)) {
      raw.forEach(value => parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`));
    } else {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(raw))}`);
    }
  }
  return parts.join("&");
}

function buildUrl(path, query) {
  const cleanPath = String(path || "").startsWith("/") ? String(path) : `/${String(path || "")}`;
  const qs = encodeQuery(query);
  return `${BASE_URL}${cleanPath}${qs ? `?${qs}` : ""}`;
}

function timeoutPromise(ms, correlationId) {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new ProviderError("Duffel request timed out.", {
      code: "DUFFEL_TIMEOUT",
      status: 504,
      retryable: true,
      correlationId,
      publicMessage: "Duffel did not respond in time. Please try again."
    })), ms);
  });
}

async function fetchBounded(url, request, timeoutMs, correlationId) {
  return Promise.race([
    fetch(url, request),
    timeoutPromise(timeoutMs, correlationId)
  ]);
}

async function readJson(response, path, correlationId) {
  const raw = String(await response.text() ?? "").replace(/^\uFEFF/, "").trim();
  if (!raw && Number(response.status) === 204) return { payload: null, raw: "" };
  if (!raw) {
    throw new ProviderError("Duffel returned an empty response.", {
      code: "DUFFEL_EMPTY_RESPONSE",
      status: 502,
      retryable: true,
      providerRequestId: safeHeader(response, "x-request-id"),
      correlationId,
      publicMessage: "Duffel returned an incomplete response. Please try again."
    });
  }
  try { return { payload: JSON.parse(raw), raw }; }
  catch (_) {
    console.error("[SKANDI Duffel] Invalid JSON", {
      path: String(path || "").split("?")[0].slice(0, 180),
      status: Number(response.status || 0),
      requestId: safeHeader(response, "x-request-id"),
      correlationId,
      bodyLength: raw.length
    });
    throw new ProviderError("Duffel returned invalid JSON.", {
      code: "DUFFEL_INVALID_RESPONSE",
      status: 502,
      retryable: true,
      providerRequestId: safeHeader(response, "x-request-id"),
      correlationId,
      publicMessage: "Duffel returned an invalid response. Please try again."
    });
  }
}

function providerMessage(payload, fallback) {
  const errors = Array.isArray(payload?.errors) ? payload.errors : [];
  return text(errors[0]?.message || errors[0]?.title || fallback, 700);
}

function httpError(response, payload, correlationId) {
  const status = Number(response?.status || 500);
  const requestId = safeHeader(response, "x-request-id");
  const retryable = status === 408 || status === 429 || status === 502 || status === 503 || status === 504;
  const message = providerMessage(payload, `Duffel HTTP ${status}`);
  return new ProviderError(message, {
    code: `DUFFEL_HTTP_${status}`,
    status,
    retryable,
    providerRequestId: requestId,
    correlationId,
    rateLimit: rateLimitMeta(response),
    publicMessage: status === 429
      ? "Duffel is rate-limiting requests. Please try again shortly."
      : status >= 500
        ? "Duffel is temporarily unavailable. Please try again."
        : message || "The Duffel request could not be completed."
  });
}

function retryDelayMs(error) {
  const raw = Number(error?.rateLimit?.reset || 0);
  if (Number.isFinite(raw) && raw > 0) return Math.min(3000, Math.max(250, raw * 1000));
  return 500;
}

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

export async function duffelRequest(path, options = {}) {
  const token = await getRequiredSecret("DUFFEL_ACCESS_TOKEN");
  const method = String(options.method || "GET").toUpperCase();
  const correlationId = text(options.correlationId, 120) || `skandi-${randomUUID()}`;
  const timeoutMs = Math.min(MAX_TIMEOUT_MS, Math.max(1000, Number(options.timeoutMs || DEFAULT_TIMEOUT_MS)));
  const retrySafe = options.retrySafe === true || method === "GET" || method === "HEAD";
  const maxAttempts = retrySafe ? Math.min(2, Math.max(1, Number(options.maxAttempts || 2))) : 1;
  const url = buildUrl(path, options.query);

  const headers = {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
    "Duffel-Version": API_VERSION,
    "x-client-correlation-id": correlationId,
    ...(options.headers || {})
  };
  delete headers["Accept-Encoding"];
  delete headers["accept-encoding"];

  const request = { method, headers };
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    request.body = JSON.stringify(options.body);
  }

  let lastError = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetchBounded(url, request, timeoutMs, correlationId);
      const { payload } = await readJson(response, path, correlationId);
      if (!response.ok) throw httpError(response, payload, correlationId);
      return {
        data: payload?.data,
        meta: payload?.meta || null,
        warnings: Array.isArray(payload?.warnings) ? payload.warnings : [],
        status: Number(response.status || 0),
        requestId: safeHeader(response, "x-request-id"),
        correlationId: safeHeader(response, "x-client-correlation-id") || correlationId,
        rateLimit: rateLimitMeta(response)
      };
    } catch (error) {
      lastError = error instanceof ProviderError ? error : new ProviderError("Duffel network request failed.", {
        code: "DUFFEL_NETWORK_ERROR",
        status: 503,
        retryable: true,
        correlationId,
        publicMessage: "Duffel could not be reached. Please try again."
      });
      if (attempt >= maxAttempts || !lastError.retryable || !retrySafe) throw lastError;
      await sleep(retryDelayMs(lastError));
    }
  }
  throw lastError || new ProviderError("Duffel request failed.");
}

export async function getDuffelEnvironment() {
  const token = await getRequiredSecret("DUFFEL_ACCESS_TOKEN");
  return /test/i.test(token) ? "test" : "live";
}
