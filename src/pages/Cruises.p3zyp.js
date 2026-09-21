// /src/pages/Cruises.js
// SKANDI Cruises — B-011.42
// Listener-first Wix bridge for #cruisesEmbed.

import wixLocation from "wix-location-frontend";
import { SITE_MAP, isSafeInternalRoute } from "public/siteMap";
import { getCruisesBootstrap, refreshCruises } from "backend/SKANDI_CORE/cruises.web";

const EMBED_ID = "#cruisesEmbed";
const CHILD_SOURCE = "SKANDI_CRUISES";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";
const SUPPORTED_LANGUAGES = new Set(["EN", "SV", "NO", "DA"]);
let bootstrapInFlight = null;

function clean(value, max = 500) { return String(value ?? "").trim().slice(0, max); }
function integer(value, fallback, min, max) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.trunc(n))) : fallback;
}
function languageValue(value) {
  const code = clean(value, 8).toUpperCase();
  return SUPPORTED_LANGUAGES.has(code) ? code : "EN";
}
function currencyValue(value) {
  const code = clean(value, 3).toUpperCase();
  return /^[A-Z]{3}$/.test(code) ? code : "USD";
}
function post(html, type, payload = {}) {
  html.postMessage({ source: PARENT_SOURCE, type, payload, timestamp: new Date().toISOString() });
}
function queryPayload() {
  const query = wixLocation.query || {};
  return {
    language: languageValue(query.language || query.lang),
    currency: currencyValue(query.currency),
    region: clean(query.region, 8).toUpperCase(),
    query: {
      cruiseId: clean(query.cruiseId, 300),
      destination: clean(query.destination || query.destinationSlug, 300),
      departurePort: clean(query.departurePort || query.port, 300),
      month: clean(query.month, 7),
      nights: clean(query.nights, 8),
      adults: integer(query.adults, 2, 1, 9),
      children: integer(query.children, 0, 0, 8)
    }
  };
}
function safeError(error) {
  return {
    code: clean(error?.code || "CRUISES_ERROR", 120),
    message: clean(error?.publicMessage || error?.message || "Cruise information could not be loaded.", 700)
  };
}
async function loadBootstrap(html, force = false) {
  if (bootstrapInFlight) return bootstrapInFlight;
  post(html, "CRUISES_LOADING", { refresh: force === true });
  bootstrapInFlight = (async () => {
    const result = force ? await refreshCruises(queryPayload()) : await getCruisesBootstrap(queryPayload());
    if (!result?.ok) {
      post(html, "CRUISES_ERROR", result?.error || { code: "CRUISES_ERROR", message: "Cruise information could not be loaded." });
      return;
    }
    post(html, "CRUISES_BOOTSTRAP", result.data || {});
  })().catch(error => {
    post(html, "CRUISES_ERROR", safeError(error));
  }).finally(() => {
    bootstrapInFlight = null;
  });
  return bootstrapInFlight;
}
function supportPath(payload = {}) {
  const params = [];
  const add = (key, value) => {
    const text = clean(value, 500);
    if (text) params.push(`${encodeURIComponent(key)}=${encodeURIComponent(text)}`);
  };
  add("topic", "cruise");
  add("cruiseId", payload.cruiseId);
  add("sailingId", payload.sailingId);
  add("title", payload.title);
  add("adults", integer(payload.adults, 2, 1, 9));
  add("children", integer(payload.children, 0, 0, 8));
  return `${SITE_MAP.support}${params.length ? `?${params.join("&")}` : ""}`;
}

$w.onReady(() => {
  const html = $w(EMBED_ID);
  html.onMessage(async event => {
    const message = event.data || {};
    if (message.source !== CHILD_SOURCE) return;
    const payload = message.payload || {};
    try {
      if (message.type === "CRUISES_READY") {
        await loadBootstrap(html, false);
        return;
      }
      if (message.type === "CRUISES_REFRESH") {
        await loadBootstrap(html, true);
        return;
      }
      if (message.type === "CRUISES_PLAN") {
        const path = supportPath(payload);
        if (!isSafeInternalRoute(path)) throw new Error("Invalid support destination.");
        wixLocation.to(path);
        return;
      }
      if (message.type === "CRUISES_NAVIGATE" && payload.path) {
        const path = clean(payload.path, 1500);
        if (!isSafeInternalRoute(path)) throw new Error("Invalid navigation destination.");
        wixLocation.to(path);
        return;
      }
      if (message.type === "CRUISES_RESIZE") {
        const requested = Number(payload.height);
        const height = Number.isFinite(requested) ? Math.min(30000, Math.max(700, Math.round(requested))) : 1200;
        try { if ("height" in html) html.height = height; } catch (_) {}
      }
    } catch (error) {
      post(html, "CRUISES_ERROR", safeError(error));
    }
  });
});
