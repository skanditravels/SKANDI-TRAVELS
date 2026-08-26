import wixWindowFrontend from "wix-window-frontend";
import {
  getDocumentViewerPayload
} from "backend/FINAL/documentControl.web";

import {
  acknowledgeDocument
} from "backend/FINAL/documentPortal.web";

const HTML_ID = "#documentViewerHtml";
const CHILD_SOURCE = "SKANDI_DOCUMENT_VIEWER";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";

function send(html, type, payload = {}) {
  html.postMessage({ source: PARENT_SOURCE, type, payload, timestamp: new Date().toISOString() });
}

$w.onReady(function () {
  const html = $w(HTML_ID);
  const context = wixWindowFrontend.lightbox.getContext() || {};
  const documentId = String(context.documentId || "");

  async function load() {
    if (!documentId) return;
    const result = await getDocumentViewerPayload({ documentId });
    send(html, "DOCUMENT_VIEWER_LOAD", {
      instance: result.instance,
      definition: result.definition
    });
  }

  html.onMessage(async (event) => {
    const message = event.data;
    if (!message || message.source !== CHILD_SOURCE) return;

    if (message.type === "DOCUMENT_VIEWER_ACKNOWLEDGE") {
      await acknowledgeDocument({ documentId });
      await load();
      return;
    }

    if (message.type === "DOCUMENT_VIEWER_DOWNLOAD") {
      send(html, "DOCUMENT_VIEWER_USE_PRINT_PDF", { documentId });
    }
  });

  load();
});
