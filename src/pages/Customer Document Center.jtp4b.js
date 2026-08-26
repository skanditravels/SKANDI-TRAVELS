import wixWindowFrontend from "wix-window-frontend";
import {
  listMyBookingDocuments,
  acknowledgeDocument
} from "backend/FINAL/documentPortal.web";

const HTML_ID = "#customerDocumentCenterHtml";
const CHILD_SOURCE = "SKANDI_CUSTOMER_DOCUMENT_CENTER";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";

function send(html, type, payload = {}) {
  html.postMessage({ source: PARENT_SOURCE, type, payload, timestamp: new Date().toISOString() });
}

$w.onReady(function () {
  const html = $w(HTML_ID);
  const context = wixWindowFrontend.lightbox.getContext() || {};
  const bookingId = String(context.bookingId || context.cartId || "");

  async function load() {
    if (!bookingId) {
      send(html, "CUSTOMER_DOCUMENTS_LOAD", { bookingId: "", documents: [] });
      return;
    }

    const result = await listMyBookingDocuments({ bookingId });
    send(html, "CUSTOMER_DOCUMENTS_LOAD", {
      bookingId,
      documents: result.documents || []
    });
  }

  html.onMessage(async (event) => {
    const message = event.data;
    if (!message || message.source !== CHILD_SOURCE) return;

    if (message.type === "CUSTOMER_DOCUMENT_CENTER_READY" ||
        message.type === "CUSTOMER_DOCUMENT_REFRESH") {
      await load();
      return;
    }

    if (message.type === "CUSTOMER_DOCUMENT_OPEN" ||
        message.type === "CUSTOMER_DOCUMENT_COMPLETE") {
      wixWindowFrontend.lightbox.close({
        action: message.type === "CUSTOMER_DOCUMENT_COMPLETE" ? "COMPLETE_DOCUMENT" : "OPEN_DOCUMENT",
        documentId: message.payload?.documentId || "",
        bookingId
      });
      return;
    }

    if (message.type === "CUSTOMER_DOCUMENT_CLOSE") {
      wixWindowFrontend.lightbox.close({ action: "CLOSE", bookingId });
    }
  });
});
