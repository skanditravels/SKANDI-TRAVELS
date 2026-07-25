import {
  getSignatureCollectionPayload,
  searchSignatureCollectionPackages
} from "backend/skandiAboutSignature.web";

const EMBED_ID = "#signatureCollectionEmbed";
const HTML_SOURCE = "SKANDI_SIGNATURE_COLLECTION";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";

function send(type, payload = {}) {
  $w(EMBED_ID).postMessage({
    source: PARENT_SOURCE,
    type,
    payload,
    timestamp: new Date().toISOString()
  });
}

async function load() {
  try {
    send("SIGNATURE_COLLECTION_DATA", await getSignatureCollectionPayload());
  } catch (error) {
    send("SIGNATURE_COLLECTION_ERROR", { message: "Signature Collection content is temporarily unavailable." });
  }
}

$w.onReady(function () {
  const embed = $w(EMBED_ID);

  embed.onMessage(async (event) => {
    const message = event.data || {};
    if (message.source !== HTML_SOURCE) return;

    try {
      if (message.type === "SIGNATURE_COLLECTION_READY" || message.type === "SIGNATURE_COLLECTION_REFRESH") {
        await load();
        return;
      }

      if (message.type === "SIGNATURE_PACKAGE_SEARCH") {
        send("SIGNATURE_PACKAGE_RESULTS", await searchSignatureCollectionPackages(message.payload || {}));
      }
    } catch (error) {
      send("SIGNATURE_COLLECTION_ERROR", { message: error.message || "Signature Collection search failed." });
    }
  });

  load();
});