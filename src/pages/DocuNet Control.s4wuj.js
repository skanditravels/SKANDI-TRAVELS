import wixLocation from "wix-location";
import { getStaffPortalSession } from "backend/RIA/staffPortalAuth.web";
import {
  getDocuNetAdminBootstrap,
  searchDocuNetAdminDocuments,
  createDocuNetUpload,
  finalizeDocuNetUpload,
  saveDocuNetMetadata,
  setDocuNetDocumentStatus,
  deleteDocuNetDocument,
  saveDocuNetCategory,
  deleteDocuNetCategory,
  searchDocuNetAudit
} from "backend/RIA/docuNet.web";

const EMBED = "#docuNetAdminEmbed";
const SOURCES = new Set(["SKANDI_DOCUNET_ADMIN", "SKANDI_ALTEA_DOC_ADMIN"]);
const STAFF_LOGIN_PATH = "/riaintra";
const ALLOWED_PATH_PREFIXES = ["/riaintra"];
let sessionPromise = null;

function post(type, payload = {}, extra = {}) {
  $w(EMBED).postMessage({ type, payload, ...extra });
}

function fail(error) {
  post("ADMIN_ERROR", {}, { message: error?.message || "DocuNet request failed." });
}

async function bootstrap() {
  post("ADMIN_BOOTSTRAP_RESULT", await getDocuNetAdminBootstrap());
}

async function getSession() {
  if (!sessionPromise) sessionPromise = getStaffPortalSession().finally(() => { sessionPromise = null; });
  return sessionPromise;
}

async function sendStaffProfile() {
  const session = await getSession();
  const profile = session?.profile || session?.agent || null;
  if (session?.authorized !== true || !profile) {
    post("PROFILE_ERROR", { code: session?.code || "STAFF_ACCESS_DENIED" });
    wixLocation.to(STAFF_LOGIN_PATH);
    return;
  }
  post("MEMBER_DATA", profile);
}

function openInternalPath(rawPath) {
  const path = String(rawPath || "").trim();
  if (!path || !ALLOWED_PATH_PREFIXES.some(prefix => path === prefix || path.startsWith(`${prefix}/`))) {
    throw new Error("Invalid internal destination.");
  }
  wixLocation.to(path);
}

$w.onReady(() => {
  $w(EMBED).onMessage(async event => {
    const message = event.data || {};
    if (!SOURCES.has(message.source)) return;
    try {
      if (message.type === "NAVIGATE") {
        openInternalPath(message.path || message.payload?.path);
        return;
      }
      if (["UI_READY", "PROFILE_REFRESH", "INTERNAL_CHROME_READY"].includes(message.type)) {
        await sendStaffProfile();
        return;
      }
      switch (message.type) {
        case "ADMIN_READY":
        case "ADMIN_BOOTSTRAP":
          await bootstrap();
          break;
        case "ADMIN_SEARCH_DOCS":
          post("ADMIN_DOC_SEARCH_RESULT", await searchDocuNetAdminDocuments(message.payload || message));
          break;
        case "ADMIN_AUDIT_SEARCH":
          post("ADMIN_AUDIT_RESULT", await searchDocuNetAudit(message.payload || {}));
          break;
        case "ADMIN_SUPABASE_UPLOAD_INIT":
          post("ADMIN_SUPABASE_UPLOAD_READY", await createDocuNetUpload(message.payload || message), {
            requestId: message.requestId
          });
          break;
        case "ADMIN_DOC_SAVE_WITH_UPLOAD": {
          const result = await finalizeDocuNetUpload({ requestId: message.requestId });
          post("ADMIN_DOC_RESULT", result, { message: "Document revision saved." });
          await bootstrap();
          break;
        }
        case "ADMIN_DOC_SAVE_METADATA": {
          const result = await saveDocuNetMetadata(message.metadata || message.payload?.metadata || {});
          post("ADMIN_DOC_RESULT", result, { message: "Document metadata saved." });
          await bootstrap();
          break;
        }
        case "ADMIN_DOC_STATUS": {
          const result = await setDocuNetDocumentStatus(message.payload || message);
          post("ADMIN_DOC_RESULT", result, { message: "Document status updated." });
          await bootstrap();
          break;
        }
        case "ADMIN_DOC_DELETE": {
          const result = await deleteDocuNetDocument(message.payload || message);
          post("ADMIN_DOC_RESULT", result, { message: "Document removed from DocuNet." });
          await bootstrap();
          break;
        }
        case "ADMIN_CATEGORY_SAVE": {
          await saveDocuNetCategory(message.category || message.payload?.category || {});
          const result = await getDocuNetAdminBootstrap();
          post("ADMIN_CATEGORIES_RESULT", { categories: result.categories }, { message: "Category saved." });
          break;
        }
        case "ADMIN_CATEGORY_DELETE": {
          await deleteDocuNetCategory(message.payload || message);
          const result = await getDocuNetAdminBootstrap();
          post("ADMIN_CATEGORIES_RESULT", { categories: result.categories }, { message: "Category deleted." });
          break;
        }
        case "ADMIN_NAVIGATE_STAFF":
          wixLocation.to("/riaintra/success-factors/docunet");
          break;
      }
    } catch (error) {
      fail(error);
    }
  });
  sendStaffProfile().catch(fail);
});
