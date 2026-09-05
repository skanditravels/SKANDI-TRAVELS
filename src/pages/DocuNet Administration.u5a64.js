import wixLocation from "wix-location";
import {
  getDocuNetAdminBootstrap,
  setDocuNetDocumentStatus,
  deleteDocuNetDocument,
  saveDocuNetCategory,
  deleteDocuNetCategory,
  searchDocuNetAudit
} from "backend/docuNet.web";
import {
  searchDocuNetAdminDocumentsSynced,
  createDocuNetUploadSynced,
  finalizeDocuNetUploadSynced,
  saveDocuNetMetadataSynced,
  getDocuNetAdminPreview
} from "backend/docuNetSync.web";

const SOURCE = "SKANDI_DOCUNET_ADMIN";
const PARENT = "SKANDI_WIX_PARENT";
const HTML_IDS = "#docuNetAdminEmbed";
const STAFF_PATH = "/riaintra/success-factors/docunet";

function htmlElement() {
  for (const id of HTML_IDS) {
    try {
      const el = $w(id);
      if (el) return el;
    } catch (_) {}
  }
  throw new Error(`DocuNet Admin HTML component not found. Tried: ${HTML_IDS.join(", ")}`);
}

function send(html, type, payload={}, message="") {
  html.postMessage({ source:PARENT, type, payload, ...(message ? {message} : {}) });
}

async function refreshedCategories() {
  const boot = await getDocuNetAdminBootstrap();
  return { categories: boot.categories || [] };
}

$w.onReady(() => {
  const html = htmlElement();

  html.onMessage(async event => {
    const msg = event.data || {};
    if (msg.source !== SOURCE) return;

    try {
      switch (msg.type) {
        case "ADMIN_READY":
        case "ADMIN_BOOTSTRAP": {
          const payload = await getDocuNetAdminBootstrap();
          send(html, "ADMIN_BOOTSTRAP_RESULT", payload);
          return;
        }
        case "ADMIN_SEARCH_DOCS": {
          const payload = await searchDocuNetAdminDocumentsSynced(msg.filters || {});
          send(html, "ADMIN_DOC_SEARCH_RESULT", payload);
          return;
        }
        case "ADMIN_SUPABASE_UPLOAD_INIT": {
          const payload = await createDocuNetUploadSynced({
            requestId: msg.requestId,
            metadata: msg.metadata || {},
            file: msg.file || {}
          });
          send(html, "ADMIN_SUPABASE_UPLOAD_READY", payload);
          return;
        }
        case "ADMIN_DOC_SAVE_WITH_UPLOAD": {
          const payload = await finalizeDocuNetUploadSynced({ requestId: msg.requestId });
          send(html, "ADMIN_DOC_RESULT", payload, "Document revision saved and synchronized.");
          return;
        }
        case "ADMIN_DOC_SAVE_METADATA": {
          const payload = await saveDocuNetMetadataSynced(msg.metadata || {});
          send(html, "ADMIN_DOC_RESULT", payload, "Document metadata saved and synchronized.");
          return;
        }
        case "ADMIN_DOC_STATUS": {
          const payload = await setDocuNetDocumentStatus({
            documentId: msg.documentId,
            publishStatus: msg.publishStatus
          });
          send(html, "ADMIN_DOC_RESULT", payload, "Document status updated.");
          return;
        }
        case "ADMIN_DOC_DELETE": {
          const payload = await deleteDocuNetDocument({ documentId: msg.documentId });
          send(html, "ADMIN_DOC_RESULT", payload, "Document deleted.");
          return;
        }
        case "ADMIN_DOC_PREVIEW": {
          const payload = await getDocuNetAdminPreview({ documentId: msg.documentId });
          send(html, "ADMIN_DOC_PREVIEW_RESULT", { ...payload, title: msg.title || payload.title });
          return;
        }
        case "ADMIN_CATEGORY_SAVE": {
          await saveDocuNetCategory(msg.category || {});
          send(html, "ADMIN_CATEGORIES_RESULT", await refreshedCategories(), "Category saved.");
          return;
        }
        case "ADMIN_CATEGORY_DELETE": {
          await deleteDocuNetCategory({ categoryId: msg.categoryId });
          send(html, "ADMIN_CATEGORIES_RESULT", await refreshedCategories(), "Category deleted.");
          return;
        }
        case "ADMIN_AUDIT_SEARCH": {
          const payload = await searchDocuNetAudit();
          send(html, "ADMIN_AUDIT_RESULT", payload);
          return;
        }
        case "ADMIN_NAVIGATE_STAFF":
          wixLocation.to(STAFF_PATH);
          return;
        case "NAVIGATE":
          if (msg.path) wixLocation.to(msg.path);
          return;
      }
    } catch (error) {
      send(
        html,
        msg.type === "ADMIN_SUPABASE_UPLOAD_INIT" ? "ADMIN_SUPABASE_UPLOAD_ERROR" : "ADMIN_ERROR",
        {},
        error?.message || "DocuNet Admin action failed."
      );
    }
  });
});
