// /src/pages/Travel Info.m43d6.js
// SKANDI Travel Info v12 — canonical public Travel Info page bridge with bounded bootstrap and retry-safe loading.
// Public Travel Info reads flow through SKANDI_CORE/publicContent; support flows through the shared customer support core.
// Alexandra remains the shared Support/LiveKit experience at /about/support; no second bot/session is created here.

import wixLocationFrontend from "wix-location-frontend";
import {
  getPublicTravelInfoPayload,
  getPublicTravelInfoAircraft,
  searchPublicTravelRequirements
} from "backend/SKANDI_CORE/publicContent.web";
import { createPublicSupportCase } from "backend/SKANDI_CORE/customerSupport.web";
import { SITE_MAP, APP_ROUTES, isSafeInternalRoute } from "public/siteMap";

const SOURCE = "SKANDI_PUBLIC_TRAVEL_INFO";
const PARENT = "SKANDI_WIX_PARENT";
const VERSION = "SKANDI-TRAVEL-INFO-V12";
const BOOTSTRAP_TIMEOUT_MS = 15000;
let loadPromise = null;
let loadGeneration = 0;
let lastPayload = null;

const clean = (value, max = 4000) => String(value ?? "").trim().slice(0, max);

function resolveHtmlComponent(id) {
  try {
    const element = $w(id);
    if (!element) return null;
    if (typeof element.onMessage !== "function" || typeof element.postMessage !== "function") return null;
    return { id, element };
  } catch (_) {
    return null;
  }
}

function getHtml() {
  return (
    resolveHtmlComponent("#travelInfoHtml") ||
    resolveHtmlComponent("#travelInfoEmbed") ||
    resolveHtmlComponent("#html1")
  );
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

function withTimeout(promise, timeoutMs, message) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const error = new Error(message);
      error.code = "TRAVEL_INFO_BOOTSTRAP_TIMEOUT";
      error.publicMessage = message;
      reject(error);
    }, timeoutMs);
  });
  return Promise.race([Promise.resolve(promise), timeout]).finally(() => clearTimeout(timer));
}

async function loadData(html, force = false, settings = {}) {
  if (loadPromise && !force) return loadPromise;
  if (lastPayload && !force) {
    post(html, "TRAVEL_INFO_DATA", lastPayload);
    return lastPayload;
  }
  const generation = ++loadGeneration;
  let currentLoad;
  currentLoad = (async () => {
    try {
      post(html, "TRAVEL_INFO_PROGRESS", { message: "Loading SKANDI Travel Info…" });
      const payload = await withTimeout(
        getPublicTravelInfoPayload({ language: settings.language || "EN" }),
        BOOTSTRAP_TIMEOUT_MS,
        "Travel information is taking longer than expected. Please try again."
      );
      if (generation !== loadGeneration) return null;
      if (!payload || typeof payload !== "object" || Array.isArray(payload) || payload.ok === false) {
        throw new Error("Travel information could not be loaded. Please try again.");
      }
      lastPayload = payload;
      post(html, "TRAVEL_INFO_DATA", payload);
      return payload;
    } catch (error) {
      if (generation === loadGeneration) postError(html, error);
      return null;
    } finally {
      if (loadPromise === currentLoad) loadPromise = null;
    }
  })();
  loadPromise = currentLoad;
  return currentLoad;
}

async function createSupport(html, payload = {}) {
  const result = await withTimeout(createPublicSupportCase({
    input: {
      fullName: clean(payload.name || payload.fullName, 160),
      email: clean(payload.email, 320),
      bookingRef: clean(payload.bookingReference || payload.bookingRef, 80),
      category: clean(payload.category || "Travel Info", 120),
      message: clean(payload.message, 6000),
      sourcePage: SITE_MAP.travelInfo,
      source: "travel-info"
    }
  }), BOOTSTRAP_TIMEOUT_MS,
  "We could not confirm whether your request was sent. Please check for confirmation before sending again.");
  post(html, "TRAVEL_SUPPORT_RESULT", result || { ok: false, message: "We could not confirm whether your request was sent. Please check for confirmation before sending again." });
}

function navigate(path) {
  const target = clean(path, 1000);
  if (!target || !isSafeInternalRoute(target)) return;
  wixLocationFrontend.to(target);
}

$w.onReady(() => {
  const resolved = getHtml();
  if (!resolved) {
    console.error("[SKANDI Travel Info v12] No compatible HTML component found. Tried #travelInfoHtml, #travelInfoEmbed, #html1.");
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
        case "TRAVEL_INFO_REQUEST_AIRCRAFT": {
          const context = {
            scope: "aircraft",
            airlineKey: clean(payload.airlineKey || payload.airlineId || payload.airlineCode, 160),
            requestId: clean(payload.requestId, 160)
          };
          try {
            const result = await withTimeout(getPublicTravelInfoAircraft(payload), BOOTSTRAP_TIMEOUT_MS,
              "Aircraft information is taking longer than expected. Please try again.");
            if (!result || typeof result !== "object" || !Array.isArray(result.aircraft) || result.ok === false) {
              throw new Error("Aircraft information could not be loaded. Please try again.");
            }
            post(html, "TRAVEL_INFO_AIRCRAFT_DATA", { ...result, ...context });
          } catch (error) {
            post(html, "TRAVEL_INFO_ERROR", { ...context, message: clean(error?.publicMessage || "Aircraft information is temporarily unavailable. Please try again.", 500) });
          }
          return;
        }
        case "TRAVEL_INFO_REQUIREMENTS_SEARCH":
          post(html, "TRAVEL_INFO_REQUIREMENTS_SEARCHING", { message: "Checking current travel requirements…" });
          try {
            post(html, "TRAVEL_INFO_REQUIREMENTS_RESULT", await withTimeout(searchPublicTravelRequirements({
              language: clean(payload.language || "EN", 10),
              nationality: clean(payload.nationality, 120),
              residenceCountry: clean(payload.residenceCountry, 120),
              origin: clean(payload.origin, 120),
              transit: clean(payload.transit, 120),
              destination: clean(payload.destination, 120),
              departureDate: clean(payload.departureDate, 40),
              returnDate: clean(payload.returnDate, 40),
              documentType: clean(payload.documentType || "PASSPORT", 40)
            }), BOOTSTRAP_TIMEOUT_MS, "Travel requirements are taking longer than expected. Please try again."));
          } catch (error) {
            post(html, "TRAVEL_INFO_REQUIREMENTS_ERROR", { message: clean(error?.publicMessage || error?.message || "Travel requirements are temporarily unavailable.", 500) });
          }
          return;
        case "TRAVEL_SUPPORT_REQUEST":
          try {
            await createSupport(html, payload);
          } catch (error) {
            post(html, "TRAVEL_SUPPORT_RESULT", { ok: false, message: clean(error?.publicMessage || "Your support request could not be confirmed. Please check for confirmation before sending again.", 500) });
          }
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
