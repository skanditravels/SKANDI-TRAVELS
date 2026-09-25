// /src/pages/Baggage Allowance.tf8xc.js
// B-011.3 canonical bridge for /travel-info/baggage-allowence.

import wixLocationFrontend from "wix-location-frontend";
import { getPublicBaggagePayload } from "backend/SKANDI_CORE/publicContent.web";
import { APP_ROUTES, isSafeInternalRoute } from "public/siteMap";

const SOURCE = "SKANDI_BAGGAGE_PAGE";
const PARENT = "SKANDI_WIX_PARENT";
const VERSION = "BACKEND-BASE-1.0-B011.3";
const EMBED_ID = "#baggageInfoEmbed";

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
    send(embed, "BAGGAGE_LOADING", {});
    send(embed, "BAGGAGE_DATA", await getPublicBaggagePayload({
      language: payload.language || "EN"
    }));
  } catch (error) {
    send(embed, "BAGGAGE_ERROR", {
      message: error?.publicMessage || error?.message || "Baggage guidance is unavailable."
    });
  }
}

$w.onReady(() => {
  let embed;
  try {
    embed = $w(EMBED_ID);
  } catch (error) {
    console.error(`[Baggage B-011.3] Missing ${EMBED_ID}.`, error);
    return;
  }

  if (!embed || typeof embed.onMessage !== "function" || typeof embed.postMessage !== "function") {
    console.error(`[Baggage B-011.3] ${EMBED_ID} is not a compatible HTML Component.`);
    return;
  }

  embed.onMessage(async event => {
    const message = parse(event?.data);
    if (!message || (message.source && message.source !== SOURCE)) return;
    const payload = message.payload || {};

    if (message.type === "BAGGAGE_READY" || message.type === "BAGGAGE_REFRESH") {
      await load(embed, payload);
      return;
    }

    if (message.type === "BAGGAGE_NAVIGATE") {
      nav(payload.path || message.path);
    }
  });

  send(embed, "BAGGAGE_HOST_READY", {
    version: VERSION,
    embedId: EMBED_ID,
    route: APP_ROUTES.baggageAllowance
  });
});
