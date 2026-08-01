import wixLocation from "wix-location-frontend";
import { getPublicLegalDocument } from "backend/LEGAL/legalPolicyService.web";

const EMBED_ID = "#legalPolicyEmbed";
const HTML_SOURCE = "SKANDI_LEGAL_DOCUMENT";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";

function send(type, payload = {}) {
  $w(EMBED_ID).postMessage({ source: PARENT_SOURCE, type, payload, timestamp: new Date().toISOString() });
}

function queryValue(name) {
  return String(wixLocation.query?.[name] || "");
}

async function load() {
  try {
    const result = await getPublicLegalDocument({
      type: queryValue("type"),
      slug: queryValue("slug")
    });
    if (!result?.ok) {
      send("LEGAL_ERROR", { message: result?.message || "Document unavailable." });
      return;
    }
    send("LEGAL_DOCUMENT_DATA", result);
  } catch (error) {
    send("LEGAL_ERROR", { message: "This legal document is temporarily unavailable." });
  }
}

$w.onReady(function () {
  const embed = $w(EMBED_ID);
  embed.onMessage(async (event) => {
    const message = event.data || {};
    if (message.source && message.source !== HTML_SOURCE) return;
    if (message.type === "LEGAL_DOCUMENT_READY" || message.type === "LEGAL_DOCUMENT_REFRESH") await load();
    if (message.type === "LEGAL_DOCUMENT_HEIGHT") embed.height = Math.max(700, Math.min(24000, Number(message.payload?.height || 0)));
  });
  load();
});
