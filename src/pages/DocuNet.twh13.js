import {
  getDocuNetDocumentAccess,
  acknowledgeDocuNetDocument
} from "backend/docuNet.web";
import {
  getDocuNetViewerBootstrapSynced
} from "backend/docuNetSync.web";

const SOURCE = "SKANDI_DOCUNET_VIEWER";
const PARENT = "SKANDI_WIX_PARENT";
const HTML_IDS = ["#alteaDocunetStaffEmbed", "#docuNetEmbed", "#docunetEmbed"];

function htmlElement() {
  for (const id of HTML_IDS) {
    try {
      const el = $w(id);
      if (el) return el;
    } catch (_) {}
  }
  throw new Error(`DocuNet Viewer HTML component not found. Tried: ${HTML_IDS.join(", ")}`);
}

function send(html, type, payload={}, message="") {
  html.postMessage({ source:PARENT, type, payload, ...(message ? {message} : {}) });
}

$w.onReady(() => {
  const html = htmlElement();

  html.onMessage(async event => {
    const msg = event.data || {};
    if (msg.source !== SOURCE) return;
    const payload = msg.payload || {};

    try {
      if (msg.type === "DOCUNET_READY") {
        const bootstrap = await getDocuNetViewerBootstrapSynced();
        send(html, "DOCUNET_BOOTSTRAP_RESULT", bootstrap);
        return;
      }

      if (msg.type === "DOCUNET_OPEN_DOCUMENT") {
        const result = await getDocuNetDocumentAccess({ documentId: payload.documentId });
        send(html, "DOCUNET_DOCUMENT_ACCESS_RESULT", result);
        return;
      }

      if (msg.type === "DOCUNET_ACKNOWLEDGE") {
        const result = await acknowledgeDocuNetDocument({ documentId: payload.documentId });
        send(html, "DOCUNET_ACKNOWLEDGE_RESULT", result);
        return;
      }
    } catch (error) {
      send(html, "DOCUNET_ERROR", {}, error?.message || "DocuNet request failed.");
    }
  });
});
