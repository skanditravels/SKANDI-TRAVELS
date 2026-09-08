 SKANDI Uniform Control page code
// Signed Supabase Storage upload version.
// Replaces uniform-control-pagecode-multi-image-upload.js.
//
// New flow:
// HTML -> UNIFORM_ADMIN_CREATE_IMAGE_UPLOAD
// -> backend authorizes + creates signed URL
// -> HTML uploads binary directly to signed Supabase URL
// -> UNIFORM_ADMIN_COMPLETE_IMAGE_UPLOAD
// -> backend audits/finalizes
// -> existing UNIFORM_ADMIN_IMAGE_UPLOADED gallery event

import wixLocation from "wix-location";
import { authentication } from "wix-members-frontend";
import { getStaffPortalSession } from "backend/RIA/staffPortalAuth.web";
import { runInternalGlobalSearch } from "backend/FINAL/internalChrome.web";

import {
  getUniformAdminBootstrap,
  adminSaveUniformCatalogItem,
  adminSaveUniformCategory,
  adminSaveUniformAllowanceRule,
  adminUniformOrderAction,
  adminAdjustUniformWallet,
  adminDeleteUniformItem,
  adminUploadUniformImage, // legacy rollout fallback
  adminCreateUniformImageUpload,
  adminCompleteUniformImageUpload
} from "backend/uniformCenterSupabase.web";

const HTML_ID = "#uniformControlEmbed";
const CHILD_SOURCE = "SKANDI_UNIFORM_ADMIN";
const CHROME_SOURCE = "SKANDI_INTERNAL_CHROME";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";
const LOGIN_PATH = "/riaintra";
const HOME_PATH = "/";

function currentPath() {
  return "/" + wixLocation.path.join("/");
}

function post(html, type, payload = {}) {
  html.postMessage({
    source: PARENT_SOURCE,
    type,
    payload: payload || {},
    timestamp: new Date().toISOString()
  });
}

function postFlat(html, type, payload = {}) {
  html.postMessage({
    source: PARENT_SOURCE,
    type,
    ...(payload || {}),
    timestamp: new Date().toISOString()
  });
}

function allowedInternalPath(path) {
  const p = String(path || "");
  return (
    p === "/" ||
    p === LOGIN_PATH ||
    p.startsWith("/riaintra") ||
    p.startsWith("/altea")
  );
}

async function logout() {
  try {
    await authentication.logout();
  } catch (err) {
    console.warn("Logout warning:", err);
  }

  wixLocation.to(HOME_PATH);
}

async function sendChromeBootstrap(html, adminPayload = {}) {
  post(html, "INTERNAL_CHROME_BOOTSTRAP", {
    pageName: "Uniform Control",
    pagePath: currentPath(),
    pageSubtitle: "Enterprise uniform catalog, wallets, allowance rules and order control",
    profile: adminPayload.profile || adminPayload.session || {},
    apps: adminPayload.apps || [],
    isAltea: true
  });
}

async function requirePortalSession() {
  const session = await getStaffPortalSession().catch(() => null);

  if (!session || session.authorized === false || session.ok === false) {
    wixLocation.to(LOGIN_PATH);
    return null;
  }

  return session;
}

async function bootstrap(html, query = "") {
  const portalSession = await requirePortalSession();

  if (!portalSession) {
    return;
  }

  const payload = await getUniformAdminBootstrap({ query });
  postFlat(html, "UNIFORM_ADMIN_BOOTSTRAP_RESULT", { payload });
  await sendChromeBootstrap(html, payload);
}

$w.onReady(function () {
  const html = $w(HTML_ID);

  html.onMessage(async (event) => {
    const msg = event.data || {};
    const source = msg.source || "";
    const type = msg.type || "";
    const payload = msg.payload || {};

    try {
      if (source === CHROME_SOURCE) {
        if (type === "INTERNAL_CHROME_READY") {
          await bootstrap(html);
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
          const query = payload.query || msg.query || "";
          const result = await runInternalGlobalSearch(query);

          post(html, "INTERNAL_SEARCH_RESULTS", {
            requestId: payload.requestId || msg.requestId || "",
            query,
            results: result.results || result.items || []
          });
          return;
        }
      }

      if (source !== CHILD_SOURCE) {
        return;
      }

      if (type === "UNIFORM_ADMIN_BOOTSTRAP") {
        await bootstrap(html, msg.query || payload.query || "");
        return;
      }

      if (type === "UNIFORM_ADMIN_CREATE_IMAGE_UPLOAD") {
        const requestId = msg.requestId || payload.requestId || "";

        const result = await adminCreateUniformImageUpload({
          requestId,
          fileName: msg.fileName || payload.fileName || "",
          mimeType: msg.mimeType || payload.mimeType || "",
          size: msg.size ?? payload.size ?? 0,
          itemId: msg.itemId || payload.itemId || "",
          itemCode: msg.itemCode || payload.itemCode || "",
          title: msg.title || payload.title || ""
        });

        postFlat(html, "UNIFORM_ADMIN_IMAGE_UPLOAD_READY", {
          payload: {
            ...result,
            requestId: result.requestId || requestId
          }
        });
        return;
      }

      if (type === "UNIFORM_ADMIN_COMPLETE_IMAGE_UPLOAD") {
        const result = await adminCompleteUniformImageUpload({
          requestId: msg.requestId || payload.requestId || "",
          objectPath:
            msg.objectPath ||
            payload.objectPath ||
            msg.storagePath ||
            payload.storagePath ||
            "",
          fileName: msg.fileName || payload.fileName || "",
          mimeType: msg.mimeType || payload.mimeType || "",
          size: msg.size ?? payload.size ?? 0,
          itemId: msg.itemId || payload.itemId || "",
          itemCode: msg.itemCode || payload.itemCode || "",
          title: msg.title || payload.title || ""
        });

        postFlat(html, "UNIFORM_ADMIN_IMAGE_UPLOADED", { payload: result });
        return;
      }

      // Legacy fallback. New HTML does not call this.
      if (type === "UNIFORM_ADMIN_UPLOAD_IMAGE") {
        const result = await adminUploadUniformImage({
          fileName: msg.fileName || payload.fileName || "",
          mimeType: msg.mimeType || payload.mimeType || "",
          dataUrl: msg.dataUrl || payload.dataUrl || "",
          base64: msg.base64 || payload.base64 || "",
          itemId: msg.itemId || payload.itemId || "",
          itemCode: msg.itemCode || payload.itemCode || "",
          title: msg.title || payload.title || ""
        });

        postFlat(html, "UNIFORM_ADMIN_IMAGE_UPLOADED", { payload: result });
        return;
      }

      if (type === "UNIFORM_ADMIN_SAVE_ITEM") {
        const result = await adminSaveUniformCatalogItem({
          item: msg.item || payload.item || {}
        });
        postFlat(html, "UNIFORM_ADMIN_SAVED", { payload: result });
        return;
      }

      if (type === "UNIFORM_ADMIN_SAVE_CATEGORY") {
        const result = await adminSaveUniformCategory({
          category: msg.category || payload.category || {}
        });
        postFlat(html, "UNIFORM_ADMIN_SAVED", { payload: result });
        return;
      }

      if (type === "UNIFORM_ADMIN_SAVE_RULE") {
        const result = await adminSaveUniformAllowanceRule({
          rule: msg.rule || payload.rule || {}
        });
        postFlat(html, "UNIFORM_ADMIN_SAVED", { payload: result });
        return;
      }

      if (type === "UNIFORM_ADMIN_ORDER_ACTION") {
        const result = await adminUniformOrderAction({
          orderId: msg.orderId || payload.orderId,
          action: msg.action || payload.action,
          note: msg.note || payload.note || ""
        });
        postFlat(html, "UNIFORM_ADMIN_SAVED", { payload: result });
        return;
      }

      if (type === "UNIFORM_ADMIN_ADJUST_WALLET") {
        const result = await adminAdjustUniformWallet({
          skId: msg.skId || payload.skId || "",
          email: msg.email || payload.email || "",
          points: msg.points ?? payload.points,
          reason: msg.reason || payload.reason || ""
        });
        postFlat(html, "UNIFORM_ADMIN_SAVED", { payload: result });
        return;
      }

      if (type === "UNIFORM_ADMIN_DELETE") {
        const result = await adminDeleteUniformItem({
          collectionId: msg.collectionId || payload.collectionId || "",
          itemId: msg.itemId || payload.itemId || ""
        });
        postFlat(html, "UNIFORM_ADMIN_SAVED", { payload: result });
        return;
      }

      if (type === "UNIFORM_ADMIN_NAVIGATE") {
        const path = msg.path || payload.path || "";
        if (allowedInternalPath(path)) wixLocation.to(path);
      }
    } catch (error) {
      postFlat(html, "UNIFORM_ADMIN_ERROR", {
        message: error.message || "Uniform Control action failed."
      });
    }
  });
});
