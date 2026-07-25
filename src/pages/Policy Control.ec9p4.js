import wixLocation from "wix-location";
import { authentication } from "wix-members-frontend";
import { getStaffPortalSession } from "backend/RIA/staffPortalAuth.web";
import { runInternalGlobalSearch } from "backend/FINAL/internalChrome.web";
import {
  getPolicyControlBootstrap,
  listPolicyDocuments,
  getPolicyDocument,
  savePolicyDocument,
  publishPolicyDocument,
  archivePolicyDocument,
  savePolicyAttachment
} from "backend/LEGAL/policyControl.web";

const EMBED_ID = "#policyControlEmbed";
const EMBED_SOURCE = "SKANDI_POLICY_CONTROL";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";
const CHROME_SOURCE = "SKANDI_INTERNAL_CHROME";
const LOGIN_PATH = "/riaintra";
const HOME_PATH = "/";

function currentPath() {
  return "/" + wixLocation.path.join("/");
}

function send(type, payload = {}) {
  $w(EMBED_ID).postMessage({
    source: PARENT_SOURCE,
    type,
    payload,
    timestamp: new Date().toISOString()
  });
}

function cleanError(err) {
  const msg = String(err?.message || err || "").trim();
  if (!msg) return "Something went wrong.";
  if (msg.length > 220) return "Something went wrong.";
  return msg;
}

function allowedInternalPath(path) {
  const p = String(path || "");
  return p === "/" || p === LOGIN_PATH || p.startsWith("/riaintra") || p.startsWith("/altea");
}

async function logout() {
  try { await authentication.logout(); } catch (err) {}
  wixLocation.to(HOME_PATH);
}

async function bootstrap() {
  const portalSession = await getStaffPortalSession().catch(() => null);
  if (!portalSession || portalSession.authorized === false || portalSession.ok === false) {
    wixLocation.to(LOGIN_PATH);
    return;
  }

  const data = await getPolicyControlBootstrap();
  send("POLICY_BOOTSTRAP", data);

  send("INTERNAL_CHROME_BOOTSTRAP", {
    pageName: "Policy Control",
    pagePath: currentPath(),
    pageSubtitle: "Controlled documents, versions and acknowledgements",
    profile: data.profile || portalSession.profile || {},
    apps: data.apps || [],
    isAltea: false
  });
}

$w.onReady(function () {
  const embed = $w(EMBED_ID);

  embed.onMessage(async (event) => {
    const msg = event.data || {};
    const source = msg.source || "";
    const type = msg.type || "";
    const payload = msg.payload || {};

    try {
      if (source === CHROME_SOURCE) {
        if (type === "INTERNAL_CHROME_READY") {
          await bootstrap();
          return;
        }

        if (type === "INTERNAL_LOGOUT") {
          await logout();
          return;
        }

        if (type === "INTERNAL_NAVIGATE") {
          const path = payload.path || msg.path || "";
          if (allowedInternalPath(path)) wixLocation.to(path);
          return;
        }

        if (type === "INTERNAL_GLOBAL_SEARCH") {
          send("INTERNAL_SEARCH_RESULTS", await runInternalGlobalSearch(payload.query || ""));
          return;
        }
      }

      if (source && source !== EMBED_SOURCE) return;

      if (type === "POLICY_READY") {
        await bootstrap();
        return;
      }

      if (type === "POLICY_LIST_REQUEST") {
        send("POLICY_LIST", await listPolicyDocuments(payload));
        return;
      }

      if (type === "POLICY_GET_REQUEST") {
        send("POLICY_DETAIL", await getPolicyDocument(payload));
        return;
      }

      if (type === "POLICY_SAVE_REQUEST") {
        const result = await savePolicyDocument(payload.policy || {});
        if (!result.ok) throw new Error(result.error || "Policy save failed.");
        send("POLICY_SAVED", result);
        send("POLICY_LIST", await listPolicyDocuments({}));
        return;
      }

      if (type === "POLICY_PUBLISH_REQUEST") {
        const result = await publishPolicyDocument(payload);
        if (!result.ok) throw new Error(result.error || "Policy publish failed.");
        send("POLICY_SAVED", result);
        send("POLICY_LIST", await listPolicyDocuments({}));
        return;
      }

      if (type === "POLICY_ARCHIVE_REQUEST") {
        const result = await archivePolicyDocument(payload);
        if (!result.ok) throw new Error(result.error || "Policy archive failed.");
        send("POLICY_SAVED", result);
        send("POLICY_LIST", await listPolicyDocuments({}));
        return;
      }

      if (type === "POLICY_ATTACHMENT_SAVE_REQUEST") {
        const result = await savePolicyAttachment(payload.attachment || {});
        if (!result.ok) throw new Error(result.error || "Attachment save failed.");
        send("POLICY_ATTACHMENT_SAVED", result);
        return;
      }

      if (type === "POLICY_NAVIGATE") {
        if (allowedInternalPath(payload.path)) wixLocation.to(payload.path);
        return;
      }
    } catch (err) {
      send("POLICY_ERROR", { message: cleanError(err), action: type });
    }
  });
});