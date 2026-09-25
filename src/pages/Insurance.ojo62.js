// /src/pages/Insurance.ojo62.js
// B-011.3 canonical bridge for /travel-info/insurance.
// No insurer, premium, coverage, eligibility or regulatory claim is invented client-side.

import wixLocationFrontend from "wix-location-frontend";
import { getPublicInsurancePayload } from "backend/SKANDI_CORE/publicContent.web";
import { SITE_MAP, APP_ROUTES, isSafeInternalRoute } from "public/siteMap";

const SOURCE = "SKANDI_INSURANCE_PAGE";
const PARENT = "SKANDI_WIX_PARENT";
const VERSION = "BACKEND-BASE-1.0-B011.3";
const EMBED_ID = "#travelInsuranceEmbed";

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
    send(embed, "INSURANCE_LOADING", {});
    send(embed, "INSURANCE_DATA", await getPublicInsurancePayload({
      language: payload.language || "EN"
    }));
  } catch (error) {
    send(embed, "INSURANCE_ERROR", {
      message: error?.publicMessage || error?.message || "Travel insurance information is unavailable."
    });
  }
}

$w.onReady(() => {
  let embed;
  try {
    embed = $w(EMBED_ID);
  } catch (error) {
    console.error(`[Insurance B-011.3] Missing ${EMBED_ID}.`, error);
    return;
  }

  if (!embed || typeof embed.onMessage !== "function" || typeof embed.postMessage !== "function") {
    console.error(`[Insurance B-011.3] ${EMBED_ID} is not a compatible HTML Component.`);
    return;
  }

  embed.onMessage(async event => {
    const message = parse(event?.data);
    if (!message || (message.source && message.source !== SOURCE)) return;
    const payload = message.payload || {};

    if (message.type === "INSURANCE_READY" || message.type === "INSURANCE_REFRESH") {
      await load(embed, payload);
      return;
    }

    if (message.type === "INSURANCE_NAVIGATE") {
      nav(payload.path || message.path);
      return;
    }

    if (message.type === "INSURANCE_SEARCH_TRIPS") {
      wixLocationFrontend.to(SITE_MAP.search);
      return;
    }

    if (message.type === "INSURANCE_SUPPORT") {
      wixLocationFrontend.to(SITE_MAP.support);
    }
  });

  send(embed, "INSURANCE_HOST_READY", {
    version: VERSION,
    embedId: EMBED_ID,
    route: APP_ROUTES.travelInsurance
  });
});
