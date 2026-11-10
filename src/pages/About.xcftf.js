// /src/pages/About.xcftf.js
// SKANDI About — B-011.4 canonical page bridge.
// Page owns only the About embed/data/navigation bridge.
// Global customer chrome, settings, routes and session are owned by masterPage.js.

import wixLocationFrontend from "wix-location-frontend";
import { getPublicAboutPayload } from "backend/SKANDI_CORE/publicContent.web";
import { getPublicNetworkMapData } from "backend/SKANDI_CORE/networkMap.web";
import { SITE_MAP, isSafeInternalRoute } from "public/siteMap";

const EMBED_ID = "#aboutEmbed";
const SOURCE = "SKANDI_ABOUT_PAGE";
const PARENT = "SKANDI_WIX_PARENT";
const VERSION = "BACKEND-BASE-1.1-B011.4";
const LANGUAGES = new Set(["EN", "SV", "NO", "DA"]);

function parse(value) {
  if (typeof value === "string") {
    try { return JSON.parse(value); }
    catch (_) { return null; }
  }
  return value && typeof value === "object" ? value : null;
}

function normalizeLanguage(value) {
  const language = String(value || "EN").trim().toUpperCase();
  return LANGUAGES.has(language) ? language : "EN";
}

function post(embed, type, payload = {}) {
  embed.postMessage({
    source: PARENT,
    type,
    payload,
    timestamp: new Date().toISOString()
  });
}

async function load(embed, payload = {}) {
  const language = normalizeLanguage(payload.language);
  try {
    post(embed, "ABOUT_PAGE_LOADING", { version: VERSION, language });
    const result = await getPublicAboutPayload({ language });
    post(embed, "ABOUT_PAGE_DATA", result);
  } catch (error) {
    post(embed, "ABOUT_PAGE_ERROR", {
      message: error?.publicMessage || error?.message || "About SKANDI is temporarily unavailable."
    });
  }
}

let networkRequest;
async function loadNetwork(embed) {
  try {
    if (!networkRequest) networkRequest = getPublicNetworkMapData().finally(() => { networkRequest = null; });
    const data = await networkRequest;
    post(embed, "ABOUT_NETWORK_DATA", {
      destinations: data.destinations,
      airports: data.airports,
      airlines: data.airlines,
      routes: data.routes
    });
  } catch (_) {
    post(embed, "ABOUT_NETWORK_ERROR", { message: "The network is temporarily unavailable." });
  }
}

function navigate(path) {
  const target = String(path || "").trim();
  if (target && isSafeInternalRoute(target)) wixLocationFrontend.to(target);
}

$w.onReady(() => {
  let embed;
  try {
    embed = $w(EMBED_ID);
  } catch (_) {
    console.error(`[About B-011.4] Missing canonical HTML component ${EMBED_ID}.`);
    return;
  }

  if (!embed || typeof embed.onMessage !== "function" || typeof embed.postMessage !== "function") {
    console.error(`[About B-011.4] ${EMBED_ID} is not a compatible HTML Component.`);
    return;
  }

  embed.onMessage(async event => {
    const message = parse(event?.data);
    if (!message || (message.source && message.source !== SOURCE)) return;

    const payload =
      message.payload && typeof message.payload === "object"
        ? message.payload
        : {};

    if (message.type === "ABOUT_PAGE_READY" || message.type === "ABOUT_PAGE_REFRESH") {
      await Promise.all([load(embed, payload), loadNetwork(embed)]);
      return;
    }

    if (message.type === "ABOUT_NETWORK_REFRESH") {
      await loadNetwork(embed);
      return;
    }

    if (message.type === "ABOUT_NAVIGATE") {
      navigate(payload.path || message.path);
    }
  });

  post(embed, "ABOUT_HOST_READY", {
    version: VERSION,
    embedId: EMBED_ID,
    route: SITE_MAP.about
  });
});
