import wixLocation from "wix-location";
import { getStaffPortalSession } from "backend/RIA/staffPortalAuth.web";
import {
  getDocuNetViewerBootstrap,
  getDocuNetDocumentAccess,
  acknowledgeDocuNetDocument
} from "backend/docuNet.web";

const EMBED = "#docuNetViewerEmbed";
const SOURCE = "SKANDI_DOCUNET_VIEWER";
const STAFF_LOGIN_PATH = "/riaintra";
const ALLOWED_PATH_PREFIXES = ["/riaintra"];
let sessionPromise = null;

function post(type, payload = {}, extra = {}) {
  $w(EMBED).postMessage({ type, payload, ...extra });
}

function fail(error) {
  post("DOCUNET_ERROR", {}, { message: error?.message || "DocuNet request failed." });
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
    if (message.source !== SOURCE) return;
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
        case "DOCUNET_READY":
        case "DOCUNET_BOOTSTRAP":
          post("DOCUNET_BOOTSTRAP_RESULT", await getDocuNetViewerBootstrap());
          break;
        case "DOCUNET_OPEN_DOCUMENT":
          post("DOCUNET_DOCUMENT_ACCESS_RESULT", await getDocuNetDocumentAccess(message.payload || {}));
          break;
        case "DOCUNET_ACKNOWLEDGE":
          post("DOCUNET_ACKNOWLEDGE_RESULT", await acknowledgeDocuNetDocument(message.payload || {}));
          break;
      }
    } catch (error) {
      fail(error);
    }
  });
  sendStaffProfile().catch(fail);
});
