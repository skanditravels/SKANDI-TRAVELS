// /src/pages/Policies.sgcey.js
// SKANDI Public Policy Document — B-011.2 canonical bridge.
// Route: /about/legal/policies
// HTML Component: #legalPolicyEmbed

import wixLocationFrontend from "wix-location-frontend";
import { getPublicLegalDocument } from "backend/SKANDI_CORE/legalPolicy.web";
import { SITE_MAP, isSafeInternalRoute } from "public/siteMap";

const EMBED_ID = "#legalPolicyEmbed";
const HTML_SOURCE = "SKANDI_LEGAL_DOCUMENT";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";
const VERSION = "B-011.2";

let embed = null;
let cachedKey = "";
let cachedPayload = null;
let loadPromise = null;

function queryValue(name) {
  return String(wixLocationFrontend.query?.[name] || "").trim();
}

function contextPayload() {
  return {
    type: queryValue("type"),
    slug: queryValue("slug"),
    documentId: queryValue("documentId"),
    policyId: queryValue("policyId")
  };
}

function contextKey(context = {}) {
  return [
    context.type,
    context.slug,
    context.documentId,
    context.policyId
  ].map(value => String(value || "").trim()).join("|");
}

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
  embed.height = Math.max(720, Math.min(30000, Math.ceil(height)));
}

function publicError(error) {
  const code = String(error?.code || error?.message || "").trim();
  if (code === "LEGAL_DOCUMENT_IDENTIFIER_REQUIRED") {
    return "No legal document identifier was provided.";
  }
  if (code === "LEGAL_DOCUMENT_NOT_FOUND") {
    return "The requested legal document is not available.";
  }
  return "This legal document is temporarily unavailable.";
}

async function load(force = false) {
  const context = contextPayload();
  const key = contextKey(context);

  if (!key.replace(/\|/g, "")) {
    post("LEGAL_DOCUMENT_ERROR", {
      message: "No legal document identifier was provided."
    });
    return null;
  }

  if (!force && cachedPayload && cachedKey === key) {
    post("LEGAL_DOCUMENT_DATA", cachedPayload);
    return cachedPayload;
  }

  if (loadPromise && !force) return loadPromise;

  loadPromise = (async () => {
    const result = await getPublicLegalDocument(context);
    if (!result || result.ok === false) {
      throw new Error(result?.message || "LEGAL_DOCUMENT_LOAD_FAILED");
    }

    cachedKey = key;
    cachedPayload = {
      ...result,
      backPath: SITE_MAP.legal,
      policyPath: SITE_MAP.policies
    };

    return cachedPayload;
  })();

  try {
    const result = await loadPromise;
    post("LEGAL_DOCUMENT_DATA", result);
    return result;
  } catch (error) {
    console.error("[Legal Policy B-011.2] load failed", error);
    post("LEGAL_DOCUMENT_ERROR", {
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
    console.error(`[Legal Policy B-011.2] Missing ${EMBED_ID}.`, error);
    return;
  }

  if (!embed || typeof embed.onMessage !== "function" || typeof embed.postMessage !== "function") {
    console.error(`[Legal Policy B-011.2] ${EMBED_ID} is not a compatible HTML Component.`);
    return;
  }

  embed.onMessage(async event => {
    const message = parseMessage(event?.data);
    if (!message || (message.source && message.source !== HTML_SOURCE)) return;

    const payload =
      message.payload && typeof message.payload === "object"
        ? message.payload
        : {};

    if (message.type === "LEGAL_DOCUMENT_READY") {
      post("LEGAL_DOCUMENT_CONTEXT", {
        ...contextPayload(),
        backPath: SITE_MAP.legal,
        policyPath: SITE_MAP.policies,
        version: VERSION
      });
      await load(false);
      return;
    }

    if (message.type === "LEGAL_DOCUMENT_REFRESH") {
      cachedKey = "";
      cachedPayload = null;
      await load(true);
      return;
    }

    if (message.type === "LEGAL_DOCUMENT_HEIGHT") {
      setEmbedHeight(payload.height);
      return;
    }

    if (message.type === "LEGAL_DOCUMENT_NAVIGATE") {
      navigate(payload.path);
    }
  });

  post("LEGAL_DOCUMENT_CONTEXT", {
    ...contextPayload(),
    backPath: SITE_MAP.legal,
    policyPath: SITE_MAP.policies,
    version: VERSION
  });

  void load(false);
});
