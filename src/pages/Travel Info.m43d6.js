// /src/pages/Travel Info.m43d6.js
// B-011.1 canonical Travel Info page bridge.
// Public travel content is read from SKANDI_CORE/publicContent. Support uses the shared customer support core.
// Alexandra remains the shared Support/LiveKit experience at /about/support; no second bot/session is created here.

import wixLocationFrontend from "wix-location-frontend";
import {
  getPublicTravelInfoPayload,
  getPublicTravelInfoAircraft,
  searchPublicTravelRequirements
} from "backend/SKANDI_CORE/publicContent.web";
import { createPublicSupportCase } from "backend/SKANDI_CORE/customerSupport.web";
import { SITE_MAP, APP_ROUTES, isSafeInternalRoute } from "public/siteMap.js";

const SOURCE = "SKANDI_PUBLIC_TRAVEL_INFO";
const PARENT = "SKANDI_WIX_PARENT";
const VERSION = "BACKEND-BASE-1.0-B011.2";
const EMBED_IDS = ["#travelInfoHtml", "#travelInfoEmbed", "#html1"];
let loadPromise = null;

const clean = (value, max = 4000) => String(value ?? "").trim().slice(0, max);

function getHtml() {
  for (const id of EMBED_IDS) {
    try {
      const element = $w(id);
      if (element && typeof element.onMessage === "function" && typeof element.postMessage === "function") return { id, element };
    } catch (_) {}
  }
  return null;
}

function parse(value) {
  if (typeof value === "string") {
    try { return JSON.parse(value); } catch (_) { return null; }
  }
  return value && typeof value === "object" ? value : null;
}

function post(html, type, payload = {}) {
  try { html.postMessage({ source: PARENT, type, payload, timestamp: new Date().toISOString() }); }
  catch (_) {}
}

function postError(html, error) {
  post(html, "TRAVEL_INFO_ERROR", { message: clean(error?.publicMessage || error?.message || "Travel information is temporarily unavailable.", 500) });
}

async function loadData(html, force = false, settings = {}) {
  if (loadPromise && !force) return loadPromise;
  loadPromise = (async () => {
    try {
      post(html, "TRAVEL_INFO_PROGRESS", { message: "Loading SKANDI Travel Info…" });
      const payload = await getPublicTravelInfoPayload({ language: settings.language || "EN" });
      post(html, "TRAVEL_INFO_DATA", payload || {});
      return payload;
    } catch (error) {
      postError(html, error);
      return null;
    } finally {
      loadPromise = null;
    }
  })();
  return loadPromise;
}

async function createSupport(html, payload = {}) {
  const result = await createPublicSupportCase({
    input: {
      fullName: clean(payload.name || payload.fullName, 160),
      email: clean(payload.email, 320),
      bookingRef: clean(payload.bookingReference || payload.bookingRef, 80),
      category: clean(payload.category || "Travel Info", 120),
      message: clean(payload.message, 6000),
      sourcePage: SITE_MAP.travelInfo,
      source: "travel-info"
    }
  });
  post(html, "TRAVEL_SUPPORT_RESULT", result || { ok: true });
}

function navigate(path) {
  const target = clean(path, 1000);
  if (!target || !isSafeInternalRoute(target)) return;
  wixLocationFrontend.to(target);
}

$w.onReady(() => {
  const resolved = getHtml();
  if (!resolved) {
    console.error(`[Travel Info B-011.1] No compatible HTML component found. Tried ${EMBED_IDS.join(", ")}`);
    return;
  }
  const html = resolved.element;

  html.onMessage(async event => {
    const message = parse(event?.data);
    if (!message || (message.source && message.source !== SOURCE)) return;
    const payload = message.payload && typeof message.payload === "object" ? message.payload : {};
    try {
      switch (clean(message.type, 120)) {
        case "TRAVEL_INFO_READY":
        case "TRAVEL_INFO_HTML_READY":
          await loadData(html, false, payload.settings || payload);
          return;
        case "TRAVEL_INFO_REFRESH":
          await loadData(html, true, payload.settings || payload);
          return;
        case "TRAVEL_INFO_REQUEST_AIRCRAFT":
          post(html, "TRAVEL_INFO_AIRCRAFT_DATA", await getPublicTravelInfoAircraft(payload));
          return;
        case "TRAVEL_INFO_REQUIREMENTS_SEARCH":
          post(html, "TRAVEL_INFO_REQUIREMENTS_SEARCHING", { message: "Checking current travel requirements…" });
          try {
            post(html, "TRAVEL_INFO_REQUIREMENTS_RESULT", await searchPublicTravelRequirements({
              language: clean(payload.language || "EN", 10),
              nationality: clean(payload.nationality, 120),
              residenceCountry: clean(payload.residenceCountry, 120),
              origin: clean(payload.origin, 120),
              transit: clean(payload.transit, 120),
              destination: clean(payload.destination, 120),
              departureDate: clean(payload.departureDate, 40),
              returnDate: clean(payload.returnDate, 40),
              documentType: clean(payload.documentType || "PASSPORT", 40)
            }));
          } catch (error) {
            post(html, "TRAVEL_INFO_REQUIREMENTS_ERROR", { message: clean(error?.publicMessage || error?.message || "Travel requirements are temporarily unavailable.", 500) });
          }
          return;
        case "TRAVEL_SUPPORT_REQUEST":
          await createSupport(html, payload);
          return;
        case "TRAVEL_INFO_WEATHER_REQUEST":
          post(html, "TRAVEL_INFO_WEATHER", {
            ok: false,
            locations: [],
            message: "Live weather is not configured in the canonical SKANDI backend yet."
          });
          return;
        case "TRAVEL_INFO_OPEN_ALEXANDRA":
        case "ALEXANDRA_MESSAGE":
        case "TRAVEL_INFO_AI_ASK":
          wixLocationFrontend.to(SITE_MAP.support);
          return;
        case "ALEXANDRA_RESET":
          post(html, "ALEXANDRA_RESPONSE", { ok: true, redirected: true, message: "Alexandra is available in SKANDI Support." });
          return;
        case "MASTER_NAVIGATE":
        case "TRAVEL_INFO_NAVIGATE":
          navigate(payload.path || message.path);
          return;
        case "TRAVEL_INFO_OPEN_PASSPORT_VISA":
          wixLocationFrontend.to(APP_ROUTES.passportVisa);
          return;
        case "TRAVEL_INFO_OPEN_BAGGAGE":
          wixLocationFrontend.to(APP_ROUTES.baggageAllowance);
          return;
        case "TRAVEL_INFO_OPEN_INSURANCE":
          wixLocationFrontend.to(APP_ROUTES.travelInsurance);
          return;
        default:
          return;
      }
    } catch (error) {
      postError(html, error);
    }
  });

  post(html, "TRAVEL_INFO_HOST_READY", { protocolVersion: VERSION, embedId: resolved.id, route: SITE_MAP.travelInfo });
});
