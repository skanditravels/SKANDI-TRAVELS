// /src/pages/Document Viewer.hz1s8.js
// Wix page identity is retained; the product surface is now Document Filler.
// This bridge is V12 canonical and supports the legacy viewer contract plus the forward Document Filler contract.

import wixWindowFrontend from "wix-window-frontend";
import wixLocationFrontend from "wix-location-frontend";
import {
  getDocumentFillerPayload,
  saveDocumentFillerDraft,
  submitDocumentFiller,
  acknowledgeDocumentFiller
} from "backend/SKANDI_CORE/documentFiller.web";

const HTML_ID = "#documentViewerHtml";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";
const CHILD_SOURCES = new Set(["SKANDI_DOCUMENT_VIEWER", "SKANDI_DOCUMENT_FILLER"]);

function send(html, type, payload = {}, message = "") {
  html.postMessage({
    source: PARENT_SOURCE,
    type,
    payload,
    ...(message ? { message } : {}),
    timestamp: new Date().toISOString()
  });
}
function contextData() {
  let lightbox = {};
  try { lightbox = wixWindowFrontend.lightbox.getContext() || {}; } catch (_) {}
  const query = wixLocationFrontend.query || {};
  return {
    bookingId: String(lightbox.bookingId || query.bookingId || query.booking || ""),
    documentId: String(lightbox.documentId || query.documentId || query.document || "")
  };
}

$w.onReady(() => {
  const html = $w(HTML_ID);
  let context = contextData();

  async function load(extra = {}) {
    context = { ...context, ...extra };
    if (!context.bookingId || !context.documentId) {
      send(html, "DOCUMENT_FILLER_ERROR", {
        code: "DOCUMENT_CONTEXT_REQUIRED",
        message: "Document Filler requires both bookingId and documentId."
      });
      return;
    }
    const result = await getDocumentFillerPayload(context);
    send(html, "DOCUMENT_FILLER_LOAD", result);
    send(html, "DOCUMENT_VIEWER_LOAD", {
      instance: result.instance,
      definition: result.definition,
      fieldMappings: result.fieldMappings,
      editable: result.editable
    });
  }

  html.onMessage(async event => {
    const message = event.data || {};
    if (message.source && !CHILD_SOURCES.has(message.source)) return;
    const payload = message.payload || {};
    const requestContext = {
      bookingId: payload.bookingId || context.bookingId,
      documentId: payload.documentId || context.documentId
    };

    try {
      switch (message.type) {
        case "DOCUMENT_FILLER_READY":
        case "DOCUMENT_FILLER_LOAD_REQUEST":
        case "DOCUMENT_VIEWER_READY":
          await load(requestContext);
          return;

        case "DOCUMENT_FILLER_SAVE_DRAFT": {
          const result = await saveDocumentFillerDraft({ ...requestContext, fields: payload.fields || {} });
          send(html, "DOCUMENT_FILLER_SAVE_RESULT", result, result?.message || "Draft saved.");
          await load(requestContext);
          return;
        }

        case "DOCUMENT_FILLER_SUBMIT": {
          const result = await submitDocumentFiller({ ...requestContext, fields: payload.fields || {} });
          send(html, "DOCUMENT_FILLER_SUBMIT_RESULT", result, result?.message || "Document submitted.");
          await load(requestContext);
          return;
        }

        case "DOCUMENT_FILLER_ACKNOWLEDGE":
        case "DOCUMENT_VIEWER_ACKNOWLEDGE": {
          const result = await acknowledgeDocumentFiller(requestContext);
          send(html, "DOCUMENT_FILLER_ACKNOWLEDGE_RESULT", result);
          await load(requestContext);
          return;
        }

        case "DOCUMENT_VIEWER_DOWNLOAD":
        case "DOCUMENT_FILLER_DOWNLOAD":
          send(html, "DOCUMENT_VIEWER_USE_PRINT_PDF", requestContext);
          return;

        default:
          return;
      }
    } catch (error) {
      send(html, "DOCUMENT_FILLER_ERROR", {
        code: String(error?.code || "DOCUMENT_FILLER_ACTION_FAILED"),
        message: String(error?.message || error || "Document Filler action failed.")
      });
    }
  });

  load().catch(error => send(html, "DOCUMENT_FILLER_ERROR", {
    code: String(error?.code || "DOCUMENT_FILLER_LOAD_FAILED"),
    message: String(error?.message || error || "Document Filler could not load.")
  }));
});
