// /src/backend/SKANDI_CORE/platformErrors.js 
// SKANDI Backend Base 1.0 — coded error contract.

import { text } from "backend/SKANDI_CORE/platformValidation";

function field(value, key) {
  if (!value || (typeof value !== "object" && typeof value !== "function")) return undefined;
  try { return Reflect.get(value, key); } catch (_) { return undefined; }
}

export class SkandiError extends Error {
  constructor(code, message = "", options = {}) {
    const safeCode = text(code, 120) || "SKANDI_ERROR";
    super(text(message, 1000) || safeCode);
    this.name = "SkandiError";
    this.code = safeCode;
    this.status = Number(field(options, "status") || 0) || undefined;
    this.retryable = field(options, "retryable") === true;
    this.publicMessage = text(field(options, "publicMessage"), 1000) || this.message;
    const details = field(options, "details");
    this.details = details && typeof details === "object" ? details : undefined;
    const supabase = field(options, "supabase");
    this.supabase = supabase && typeof supabase === "object" ? supabase : undefined;
  }
}

export function fail(code, message = "", options = {}) {
  throw new SkandiError(code, message, options);
}

export function errorCode(error, fallback = "SKANDI_ERROR") {
  return text(field(error, "code") || field(error, "message"), 120) || fallback;
}

export function errorStatus(error) {
  const status = Number(field(error, "status") || field(error, "statusCode") || 0);
  return Number.isFinite(status) && status > 0 ? status : undefined;
}

export function isTransientHttpStatus(status) {
  return new Set([408, 425, 429, 502, 503, 504]).has(Number(status));
}

export function publicError(error, fallbackMessage = "The request could not be completed.") {
  if (error instanceof SkandiError) {
    return {
      code: error.code,
      message: error.publicMessage || error.message,
      status: error.status || null,
      retryable: error.retryable === true
    };
  }

  const code = errorCode(error);
  const status = errorStatus(error);
  return {
    code,
    message: text(field(error, "publicMessage"), 1000) || fallbackMessage,
    status: status || null,
    retryable: isTransientHttpStatus(status)
  };
}
