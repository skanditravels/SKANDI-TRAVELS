import {
  getDocumentPacketForExecution,
  submitDocumentExecution
} from "backend/documentExecution.web";

import wixLocation from "wix-location-frontend";

const EMBED_ID = "#documentExecutionEmbed";
const HTML_SOURCE = "SKANDI_DOCUMENT_EXECUTION";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";

function send(type, payload = {}) {
  $w(EMBED_ID).postMessage({ source: PARENT_SOURCE, type, payload, timestamp: new Date().toISOString() });
}

$w.onReady(function () {
  const html = $w(EMBED_ID);

  html.onMessage(async (event) => {
    const msg = event.data || {};
    const source = msg.source || "";
    if (source && source !== HTML_SOURCE) return;

    try {
      if (msg.type === "DOCUMENT_EXEC_READY") {
        const { email, token } = wixLocation.query || {};
        if (email && token) {
          send("DOCUMENT_PACKET_DATA", await getDocumentPacketForExecution({ email, token }));
        }
        return;
      }

      if (msg.type === "DOCUMENT_PACKET_LOAD_REQUEST") {
        send("DOCUMENT_PACKET_DATA", await getDocumentPacketForExecution(msg.payload || {}));
        return;
      }

      if (msg.type === "DOCUMENT_EXEC_SUBMIT") {
        send("DOCUMENT_EXECUTION_RESULT", await submitDocumentExecution(msg.payload || {}));
        return;
      }

      if (msg.type === "DOCUMENT_SUPPORT_REQUEST") {
        send("DOCUMENT_EXECUTION_RESULT", { ok: true, message: "Support request received." });
        return;
      }
    } catch (error) {
      send("DOCUMENT_EXECUTION_ERROR", { message: error.message || "Document action failed." });
    }
  });
});