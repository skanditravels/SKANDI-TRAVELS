import wixLocation from "wix-location-frontend";
import {
  getPublicLegalDocument,
  getPublicLegalHub
} from "backend/LEGAL/legalPolicyService.web";

const EMBED_ID = "#legalPolicyEmbed";
const HTML_SOURCE = "SKANDI_LEGAL_DOCUMENT";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";

let embed = null;
let cachedResult = null;
let cachedKey = "";
let loadPromise = null;

function send(type, payload = {}) {
  if (!embed) return;
  embed.postMessage({
    source: PARENT_SOURCE,
    type,
    payload,
    timestamp: new Date().toISOString()
  });
}

function parseMessage(value) {
  if (typeof value === "string") {
    try { return JSON.parse(value); } catch (_) { return null; }
  }
  return value && typeof value === "object" ? value : null;
}

function queryValue(name) {
  return String(wixLocation.query?.[name] || "").trim();
}

function lookupKey(lookup) {
  return [
    lookup.type || "",
    lookup.slug || "",
    lookup.documentId || ""
  ].join("|").toLowerCase();
}

async function resolveLookup() {
  const type = queryValue("type");
  const slug = queryValue("slug");
  const documentId = queryValue("documentId");

  if (type || slug || !documentId) {
    return { type, slug, documentId };
  }

  // The document iframe already emits documentId, and Policy Control uses
  // document_id as a stable identity. Resolve it to the current published
  // route without exposing an admin-only lookup.
  const hub = await getPublicLegalHub();
  const needle = documentId.toLowerCase();
  const policy = (hub?.policies || []).find((item) =>
    String(item.documentId || "").toLowerCase() === needle ||
    String(item.policyId || item._id || "").toLowerCase() === needle
  );

  if (!policy) {
    return { type: "", slug: "", documentId };
  }

  const publicType = String(policy.publicType || "").trim();
  return {
    type: publicType && publicType !== "custom" ? publicType : "",
    slug: publicType && publicType !== "custom" ? "" : String(policy.slug || ""),
    documentId
  };
}

function setEmbedHeight(value) {
  const height = Number(value || 0);
  if (!Number.isFinite(height) || height <= 0 || !embed) return;
  embed.height = Math.max(700, Math.min(24000, Math.ceil(height)));
}

async function load(force = false) {
  const lookup = await resolveLookup();
  const key = lookupKey(lookup);

  if (!force && cachedResult && cachedKey === key) {
    send("LEGAL_DOCUMENT_DATA", cachedResult);
    return cachedResult;
  }

  if (loadPromise) {
    const result = await loadPromise;
    if (result) send("LEGAL_DOCUMENT_DATA", result);
    return result;
  }

  loadPromise = (async () => {
    const result = await getPublicLegalDocument({
      type: lookup.type,
      slug: lookup.slug
    });

    if (!result?.ok) {
      throw new Error(result?.message || "LEGAL_DOCUMENT_LOAD_FAILED");
    }

    cachedResult = result;
    cachedKey = key;
    return result;
  })();

  try {
    const result = await loadPromise;
    send("LEGAL_DOCUMENT_DATA", result);
    return result;
  } catch (error) {
    console.error("[Legal Document] load failed", error);
    cachedResult = null;
    cachedKey = "";
    send("LEGAL_ERROR", {
      message:
        error?.message === "This legal document is not published or is unavailable."
          ? error.message
          : "This legal document is temporarily unavailable."
    });
    return null;
  } finally {
    loadPromise = null;
  }
}

function replayOrLoad() {
  const key = lookupKey({
    type: queryValue("type"),
    slug: queryValue("slug"),
    documentId: queryValue("documentId")
  });

  if (cachedResult && (!key || key === cachedKey)) {
    send("LEGAL_DOCUMENT_DATA", cachedResult);
  } else {
    void load(false);
  }
}

$w.onReady(function () {
  embed = $w(EMBED_ID);

  embed.onMessage(async (event) => {
    const message = parseMessage(event.data);
    if (!message || message.source !== HTML_SOURCE) return;

    if (message.type === "LEGAL_DOCUMENT_READY") {
      replayOrLoad();
      return;
    }

    if (message.type === "LEGAL_DOCUMENT_REFRESH") {
      await load(true);
      return;
    }

    if (message.type === "LEGAL_DOCUMENT_HEIGHT") {
      setEmbedHeight(message.payload?.height);
    }
  });

  send("LEGAL_DOCUMENT_PARENT_READY", {
    page: "/about/legal/policies",
    type: queryValue("type"),
    slug: queryValue("slug"),
    documentId: queryValue("documentId")
  });

  void load(false);

  setTimeout(() => {
    send("LEGAL_DOCUMENT_PARENT_READY", {
      page: "/about/legal/policies",
      type: queryValue("type"),
      slug: queryValue("slug"),
      documentId: queryValue("documentId")
    });
    replayOrLoad();
  }, 350);

  setTimeout(() => {
    replayOrLoad();
  }, 1200);
});
