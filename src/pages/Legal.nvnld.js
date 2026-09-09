import wixLocation from "wix-location-frontend";
import { getPublicLegalHub } from "backend/LEGAL/legalPolicyService.web";

const EMBED_ID = "#legalHubEmbed";
const HTML_SOURCE = "SKANDI_LEGAL_HUB";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";

let embed = null;
let cachedHub = null;
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

function setEmbedHeight(value) {
  const height = Number(value || 0);
  if (!Number.isFinite(height) || height <= 0 || !embed) return;
  embed.height = Math.max(600, Math.min(14000, Math.ceil(height)));
}

async function load(force = false) {
  if (!force && cachedHub) {
    send("LEGAL_HUB_DATA", cachedHub);
    return cachedHub;
  }

  if (loadPromise) {
    const result = await loadPromise;
    if (result) send("LEGAL_HUB_DATA", result);
    return result;
  }

  loadPromise = (async () => {
    const result = await getPublicLegalHub();
    if (!result?.ok) {
      throw new Error(result?.message || "LEGAL_HUB_LOAD_FAILED");
    }
    cachedHub = result;
    return result;
  })();

  try {
    const result = await loadPromise;
    send("LEGAL_HUB_DATA", result);
    return result;
  } catch (error) {
    console.error("[Legal Hub] load failed", error);
    send("LEGAL_ERROR", {
      message: "Legal information is temporarily unavailable."
    });
    return null;
  } finally {
    loadPromise = null;
  }
}

function replayOrLoad() {
  if (cachedHub) {
    send("LEGAL_HUB_DATA", cachedHub);
  } else {
    void load(false);
  }
}

$w.onReady(function () {
  embed = $w(EMBED_ID);

  embed.onMessage(async (event) => {
    const message = parseMessage(event.data);
    if (!message || message.source !== HTML_SOURCE) return;

    if (message.type === "LEGAL_HUB_READY") {
      replayOrLoad();
      return;
    }

    if (message.type === "LEGAL_HUB_REFRESH") {
      await load(true);
      return;
    }

    if (message.type === "LEGAL_HUB_HEIGHT") {
      setEmbedHeight(message.payload?.height);
      return;
    }

    if (message.type === "LEGAL_NAVIGATE" && message.payload?.path) {
      const path = String(message.payload.path || "");
      if (path.startsWith("/")) wixLocation.to(path);
    }
  });

  send("LEGAL_HUB_PARENT_READY", { page: "/about/legal" });
  void load(false);

  setTimeout(() => {
    send("LEGAL_HUB_PARENT_READY", { page: "/about/legal" });
    replayOrLoad();
  }, 350);

  setTimeout(() => {
    replayOrLoad();
  }, 1200);
});
