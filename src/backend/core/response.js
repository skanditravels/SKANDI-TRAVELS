export function ok(payload = {}) {
  return {
    ok: true,
    ...payload
  };
}

export function fail(message = "Something went wrong.", extra = {}) {
  return {
    ok: false,
    message,
    error: message,
    ...extra
  };
}

export function nowIso() {
  return new Date().toISOString();
}

export function clean(value) {
  return String(value || "").trim();
}

export function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function uid(prefix = "ID") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`.toUpperCase();
}