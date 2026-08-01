import wixLocation from "wix-location-frontend";
import { getPublicLegalHub } from "backend/LEGAL/legalPolicyService.web";

const EMBED_ID = "#legalHubEmbed";
const HTML_SOURCE = "SKANDI_LEGAL_HUB";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";

function send(type, payload = {}) {
  $w(EMBED_ID).postMessage({ source: PARENT_SOURCE, type, payload, timestamp: new Date().toISOString() });
}

async function load() {
  try {
    send("LEGAL_HUB_DATA", await getPublicLegalHub());
  } catch (error) {
    send("LEGAL_ERROR", { message: "Legal information is temporarily unavailable." });
  }
}

$w.onReady(function () {
  const embed = $w(EMBED_ID);
  embed.onMessage(async (event) => {
    const message = event.data || {};
    if (message.source && message.source !== HTML_SOURCE) return;
    if (message.type === "LEGAL_HUB_READY" || message.type === "LEGAL_HUB_REFRESH") await load();
    if (message.type === "LEGAL_HUB_HEIGHT") embed.height = Math.max(600, Math.min(14000, Number(message.payload?.height || 0)));
    if (message.type === "LEGAL_NAVIGATE" && message.payload?.path) wixLocation.to(message.payload.path);
  });
  load();
});
