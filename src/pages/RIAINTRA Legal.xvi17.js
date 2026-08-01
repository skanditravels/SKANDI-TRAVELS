import wixLocation from "wix-location-frontend";
import { getInternalLegalHub } from "backend/LEGAL/legalPolicyService.web";

const EMBED_ID = "#internalLegalHubEmbed";
const HTML_SOURCE = "SKANDI_INTERNAL_LEGAL_HUB";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";

function send(type, payload = {}) {
  $w(EMBED_ID).postMessage({ source: PARENT_SOURCE, type, payload, timestamp: new Date().toISOString() });
}

async function load() {
  try {
    send("INTERNAL_LEGAL_HUB_DATA", await getInternalLegalHub());
  } catch (error) {
    send("INTERNAL_LEGAL_ERROR", { message: error?.message || "Internal policies are temporarily unavailable." });
  }
}

$w.onReady(function () {
  const embed = $w(EMBED_ID);
  embed.onMessage(async (event) => {
    const message = event.data || {};
    if (message.source && message.source !== HTML_SOURCE) return;
    if (message.type === "INTERNAL_LEGAL_READY" || message.type === "INTERNAL_LEGAL_REFRESH") await load();
    if (message.type === "INTERNAL_LEGAL_HEIGHT") embed.height = Math.max(600, Math.min(14000, Number(message.payload?.height || 0)));
    if (message.type === "NAVIGATE" && message.payload?.path) wixLocation.to(message.payload.path);
  });
  load();
});
