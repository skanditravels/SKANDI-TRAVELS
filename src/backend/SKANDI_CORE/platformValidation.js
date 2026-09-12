// /src/backend/SKANDI_CORE/platformValidation.js
// SKANDI Backend Base 1.0 — shared input normalization only.
// No database, auth, routing, or domain business rules belong here.

export function text(value, max = 5000) {
  const limit = Number.isFinite(Number(max)) ? Math.max(0, Number(max)) : 5000;
  return String(value ?? "").trim().slice(0, limit);
}

export function lower(value, max = 5000) {
  return text(value, max).toLowerCase();
}

export function upper(value, max = 5000) {
  return text(value, max).toUpperCase();
}

export function email(value) {
  const clean = lower(value, 320);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean) ? clean : "";
}

export function normalizeSkId(value) {
  return upper(value, 32).replace(/[^A-Z0-9]/g, "").slice(0, 6);
}

export function isValidSkId(value) {
  return /^[A-Z]{2}[0-9]{4}$/.test(normalizeSkId(value));
}

export function stringArray(value, { maxItems = 250, itemMax = 240 } = {}) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const out = [];
  for (const raw of value) {
    const clean = text(raw, itemMax);
    if (!clean || seen.has(clean)) continue;
    seen.add(clean);
    out.push(clean);
    if (out.length >= maxItems) break;
  }
  return out;
}

export function record(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

export function firstRow(value) {
  return Array.isArray(value) && value.length ? value[0] : null;
}

export function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function safeBoolean(value, fallback = false) {
  if (value === true || value === false) return value;
  if (value === 1 || value === "1" || lower(value, 16) === "true") return true;
  if (value === 0 || value === "0" || lower(value, 16) === "false") return false;
  return fallback;
}

export function isoDateOnly(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export function cleanPath(value, { internalOnly = false, max = 500 } = {}) {
  const path = text(value, max);
  if (!path.startsWith("/") || path.startsWith("//")) return "";
  if (/^(javascript|data|vbscript):/i.test(path)) return "";
  if (path.includes("\\") || path.includes("..")) return "";
  if (internalOnly && !(path === "/riaintra" || path.startsWith("/riaintra/"))) return "";
  return path;
}

export function cleanRequestId(value) {
  return text(value, 120).replace(/[^A-Za-z0-9._:-]/g, "");
}

export function jsonObject(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) return value;
  return {};
}
