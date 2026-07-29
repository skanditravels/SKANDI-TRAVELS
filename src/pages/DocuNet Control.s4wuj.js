import wixLocation from "wix-location";
import {
  getDocAdminBootstrap,
  searchDocAdminDocuments,
  adminSaveDocumentWithFile,
  adminSaveDocumentMetadata,
  adminSetDocumentStatus,
  adminDeleteDocument,
  adminSaveCategory,
  adminDeleteCategory,
  adminSearchAudit
} from "src/backend/alteaDocunetV2.web";

const HTML_ID = "#alteaDocunetAdminEmbed";
const UPLOAD_ID = "#docControlUploadButton";

$w.onReady(function () {
  const html = $w(HTML_ID);
  const upload = uploadElement();
  if (upload?.show) upload.show();

  html.onMessage(async (event) => {
    const msg = event.data || {};
    if (msg.source !== "SKANDI_ALTEA_DOC_ADMIN") return;

    try {
      if (msg.type === "ADMIN_READY" || msg.type === "ADMIN_BOOTSTRAP") {
        const payload = await getDocAdminBootstrap();
        html.postMessage({ source: "SKANDI_WIX_PARENT", type: "ADMIN_BOOTSTRAP_RESULT", payload });
        return;
      }

      if (msg.type === "ADMIN_SEARCH_DOCS") {
        const payload = await searchDocAdminDocuments({ filters: msg.filters || {} });
        html.postMessage({ source: "SKANDI_WIX_PARENT", type: "ADMIN_DOC_SEARCH_RESULT", payload });
        return;
      }

      if (msg.type === "ADMIN_DOC_SAVE_WITH_UPLOAD") {
        const uploadButton = uploadElement();
        if (!uploadButton) throw new Error("Upload Button #docControlUploadButton is missing.");
        const uploaded = await uploadButton.uploadFiles();
        const file = uploaded?.[0];
        if (!file) throw new Error("Select a PDF using #docControlUploadButton before saving.");

        const payload = await adminSaveDocumentWithFile({
          metadata: msg.metadata || {},
          file: {
            fileUrl: file.fileUrl || file.url,
            fileName: file.fileName || file.originalFileName || "document.pdf",
            originalFileName: file.originalFileName || file.fileName || "",
            fileSize: file.fileSize || file.size || 0,
            mediaId: file.mediaId || file.fileId || ""
          }
        });

        html.postMessage({
          source: "SKANDI_WIX_PARENT",
          type: "ADMIN_DOC_RESULT",
          payload,
          message: "Document and PDF saved."
        });
        return;
      }

      if (msg.type === "ADMIN_DOC_SAVE_METADATA") {
        const payload = await adminSaveDocumentMetadata({ metadata: msg.metadata || {} });
        html.postMessage({ source: "SKANDI_WIX_PARENT", type: "ADMIN_DOC_RESULT", payload, message: "Metadata saved." });
        return;
      }

      if (msg.type === "ADMIN_DOC_STATUS") {
        const payload = await adminSetDocumentStatus({
          documentId: msg.documentId,
          publishStatus: msg.publishStatus
        });
        html.postMessage({ source: "SKANDI_WIX_PARENT", type: "ADMIN_DOC_RESULT", payload, message: "Document status updated." });
        return;
      }

      if (msg.type === "ADMIN_DOC_DELETE") {
        const payload = await adminDeleteDocument({ documentId: msg.documentId });
        html.postMessage({ source: "SKANDI_WIX_PARENT", type: "ADMIN_DOC_RESULT", payload, message: "Document deleted." });
        return;
      }

      if (msg.type === "ADMIN_CATEGORY_SAVE") {
        const payload = await adminSaveCategory({ category: msg.category || {} });
        html.postMessage({ source: "SKANDI_WIX_PARENT", type: "ADMIN_CATEGORIES_RESULT", payload, message: "Category saved." });
        return;
      }

      if (msg.type === "ADMIN_CATEGORY_DELETE") {
        const payload = await adminDeleteCategory({ categoryId: msg.categoryId });
        html.postMessage({ source: "SKANDI_WIX_PARENT", type: "ADMIN_CATEGORIES_RESULT", payload, message: "Category deleted." });
        return;
      }

      if (msg.type === "ADMIN_AUDIT_SEARCH") {
        const payload = await adminSearchAudit({ filters: msg.filters || {} });
        html.postMessage({ source: "SKANDI_WIX_PARENT", type: "ADMIN_AUDIT_RESULT", payload });
        return;
      }

      if (msg.type === "ADMIN_NAVIGATE_STAFF") {
        wixLocation.to("/riaintra/altea/documents");
      }
    } catch (error) {
      html.postMessage({
        source: "SKANDI_WIX_PARENT",
        type: "ADMIN_ERROR",
        message: error.message || "Document admin action failed."
      });
    }
  });
});

function uploadElement() {
  try {
    return $w(UPLOAD_ID);
  } catch (error) {
    return null;
  }
}
