import wixLocation from "wix-location-frontend";

const EMBED_ID = "#legalPolicyEmbed";
const HTML_SOURCE = "SKANDI_LEGAL_DOCUMENT";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";

let embed = null;

function queryValue(name) {
  return String(wixLocation.query?.[name] || "").trim();
}

function contextPayload() {
  return {
    type: queryValue("type"),
    slug: queryValue("slug"),
    documentId: queryValue("documentId"),
    policyId: queryValue("policyId")
  };
}

function sendContext() {
  if (!embed) return;

  embed.postMessage({
    source: PARENT_SOURCE,
    type: "LEGAL_DOCUMENT_CONTEXT",
    payload: contextPayload(),
    timestamp: new Date().toISOString()
  });
}

$w.onReady(function () {
  embed = $w(EMBED_ID);

  embed.onMessage((event) => {
    const message = event.data || {};
    if (message.source && message.source !== HTML_SOURCE) return;

    if (message.type === "LEGAL_DOCUMENT_READY") {
      sendContext();
      return;
    }

    if (message.type === "LEGAL_DOCUMENT_HEIGHT") {
      const height = Number(message.payload?.height || 0);
      if (Number.isFinite(height) && height > 0) {
        embed.height = Math.max(700, Math.min(24000, Math.ceil(height)));
      }
    }
  });

  sendContext();
  setTimeout(sendContext, 300);
  setTimeout(sendContext, 1000);
});
