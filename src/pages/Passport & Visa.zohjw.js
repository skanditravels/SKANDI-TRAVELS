// /src/pages/Passport & Visa.zohjw.js
// B-011.3 canonical bridge for /travel-info/passport-visa.
// Destination-specific SKANDI guidance is a planning aid; it does not replace official border/visa authority decisions.

import wixLocationFrontend from "wix-location-frontend";
import {
  getPublicPassportVisaPayload,
  searchPublicTravelRequirements
} from "backend/SKANDI_CORE/publicContent.web";
import { APP_ROUTES, isSafeInternalRoute } from "public/siteMap";

const SOURCE = "SKANDI_PASSPORT_VISA_PAGE";
const PARENT = "SKANDI_WIX_PARENT";
const VERSION = "BACKEND-BASE-1.0-B011.3";
const EMBED_ID = "#passportVisaEmbed";

function parse(v) {
  if (typeof v === "string") {
    try { return JSON.parse(v); } catch (_) { return null; }
  }
  return v && typeof v === "object" ? v : null;
}

function send(embed, type, payload = {}) {
  embed.postMessage({
    source: PARENT,
    type,
    payload,
    timestamp: new Date().toISOString()
  });
}

function nav(path) {
  const target = String(path || "").trim();
  if (target && isSafeInternalRoute(target)) wixLocationFrontend.to(target);
}

async function load(embed, payload = {}) {
  try {
    send(embed, "PASSPORT_VISA_LOADING", {});
    send(embed, "PASSPORT_VISA_DATA", await getPublicPassportVisaPayload({
      language: payload.language || "EN"
    }));
  } catch (error) {
    send(embed, "PASSPORT_VISA_ERROR", {
      message: error?.publicMessage || error?.message || "Passport and visa guidance is unavailable."
    });
  }
}

async function searchRequirements(embed, payload = {}) {
  try {
    send(embed, "PASSPORT_VISA_SEARCHING", {});
    send(embed, "PASSPORT_VISA_SEARCH_RESULT", await searchPublicTravelRequirements({
      language: payload.language || "EN",
      nationality: payload.nationality || "",
      residenceCountry: payload.residenceCountry || "",
      origin: payload.origin || "",
      destination: payload.destination || "",
      departureDate: payload.departureDate || "",
      returnDate: payload.returnDate || "",
      documentType: payload.documentType || "PASSPORT"
    }));
  } catch (error) {
    send(embed, "PASSPORT_VISA_SEARCH_ERROR", {
      message: error?.publicMessage || error?.message || "Travel requirements search is unavailable."
    });
  }
}

$w.onReady(() => {
  let embed;
  try {
    embed = $w(EMBED_ID);
  } catch (error) {
    console.error(`[Passport/Visa B-011.3] Missing ${EMBED_ID}.`, error);
    return;
  }

  if (!embed || typeof embed.onMessage !== "function" || typeof embed.postMessage !== "function") {
    console.error(`[Passport/Visa B-011.3] ${EMBED_ID} is not a compatible HTML Component.`);
    return;
  }

  embed.onMessage(async event => {
    const message = parse(event?.data);
    if (!message || (message.source && message.source !== SOURCE)) return;
    const payload = message.payload || {};

    if (message.type === "PASSPORT_VISA_READY" || message.type === "PASSPORT_VISA_REFRESH") {
      await load(embed, payload);
      return;
    }

    if (message.type === "PASSPORT_VISA_SEARCH") {
      await searchRequirements(embed, payload);
      return;
    }

    if (message.type === "PASSPORT_VISA_NAVIGATE") {
      nav(payload.path || message.path);
    }
  });

  send(embed, "PASSPORT_VISA_HOST_READY", {
    version: VERSION,
    embedId: EMBED_ID,
    route: APP_ROUTES.passportVisa
  });
});
