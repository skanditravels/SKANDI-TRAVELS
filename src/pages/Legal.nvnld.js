// /src/pages/Legal.nvnld.js
// SKANDI Legal — B-011.1 canonical public bridge.
// Route: /about/legal
// HTML Component: #legalHubEmbed

import wixLocationFrontend from "wix-location-frontend";
import { getPublicLegalHub } from "backend/SKANDI_CORE/legalPolicy.web";
import { SITE_MAP, isSafeInternalRoute } from "public/siteMap";

const EMBED_ID = "#legalHubEmbed";
const HTML_SOURCE = "SKANDI_LEGAL_HUB";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";
const VERSION = "B-011.1";

let embed = null;
let cachedHub = null;
let loadPromise = null;

function parseMessage(value) {
  if (typeof value === "string") {
    try { return JSON.parse(value); }
    catch (_) { return null; }
  }
  return value && typeof value === "object" ? value : null;
}

function post(type, payload = {}) {
  if (!embed) return;
  embed.postMessage({
    source: PARENT_SOURCE,
    type,
    payload,
    timestamp: new Date().toISOString()
  });
}

function setEmbedHeight(value) {
  const height = Number(value || 0);
  if (!embed || !Number.isFinite(height) || height <= 0) return;
  embed.height = Math.max(620, Math.min(16000, Math.ceil(height)));
}

function publicError(error) {
  const message = String(
    error?.publicMessage ||
    error?.message ||
    ""
  ).trim();

  return message && message.length <= 300
    ? message
    : "Legal information is temporarily unavailable.";
}

async function load(force = false) {
  if (!force && cachedHub) {
    post("LEGAL_HUB_DATA", cachedHub);
    return cachedHub;
  }

  if (loadPromise && !force) return loadPromise;

  loadPromise = (async () => {
    const result = await getPublicLegalHub({});
    if (!result || result.ok === false) {
      throw new Error(result?.message || "LEGAL_HUB_LOAD_FAILED");
    }
    cachedHub = result;
    return result;
  })();

  try {
    const result = await loadPromise;
    post("LEGAL_HUB_DATA", result);
    return result;
  } catch (error) {
    console.error("[Legal B-011.1] load failed", error);
    post("LEGAL_HUB_ERROR", {
      message: publicError(error)
    });
    return null;
  } finally {
    loadPromise = null;
  }
}

function navigate(path) {
  const target = String(path || "").trim();
  if (target && isSafeInternalRoute(target)) wixLocationFrontend.to(target);
}

$w.onReady(() => {
  try {
    embed = $w(EMBED_ID);
  } catch (error) {
    console.error(`[Legal B-011.1] Missing ${EMBED_ID}.`, error);
    return;
  }

  if (!embed || typeof embed.onMessage !== "function" || typeof embed.postMessage !== "function") {
    console.error(`[Legal B-011.1] ${EMBED_ID} is not a compatible HTML Component.`);
    return;
  }

  embed.onMessage(async event => {
    const message = parseMessage(event?.data);
    if (!message || (message.source && message.source !== HTML_SOURCE)) return;

    const payload =
      message.payload && typeof message.payload === "object"
        ? message.payload
        : {};

    if (message.type === "LEGAL_HUB_READY") {
      await load(false);
      return;
    }

    if (message.type === "LEGAL_HUB_REFRESH") {
      await load(true);
      return;
    }

    if (message.type === "LEGAL_HUB_HEIGHT") {
      setEmbedHeight(payload.height);
      return;
    }

    if (message.type === "LEGAL_NAVIGATE") {
      navigate(payload.path);
    }
  });

  post("LEGAL_HUB_PARENT_READY", {
    version: VERSION,
    page: SITE_MAP.legal,
    policyRoute: SITE_MAP.policies
  });

  void load(false);
});
