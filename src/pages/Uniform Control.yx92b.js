// SKANDI Uniform Control — FULL REPLACEMENT PAGE CODE v3
// Replace the entire Wix page code for the Uniform Control page.
//
// IMPORTANT:
// - Keeps the locked existing backend export contract.
// - Echoes requestId on every request/response.
// - Handles UNIFORM_ADMIN_READY and UNIFORM_ADMIN_BOOTSTRAP.
// - Signed image upload reuses existing adminUploadUniformImage export.

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
  adminUploadUniformImage
} from "backend/uniformCenterCms.web";

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

function reply(html, type, requestId = "", payload = {}) {
  html.postMessage({
    source: PARENT_SOURCE,
    type,
    requestId: requestId || "",
    payload: payload || {},
    timestamp: new Date().toISOString()
  });
}

function replyError(html, requestId = "", error) {
  html.postMessage({
    source: PARENT_SOURCE,
    type: "UNIFORM_ADMIN_ERROR",
    requestId: requestId || "",
    message: error?.message || "Uniform Control action failed.",
    payload: {
      message: error?.message || "Uniform Control action failed."
    },
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
  reply(html, "UNIFORM_ADMIN_BOOTSTRAP_RESULT", "", payload);
  await sendChromeBootstrap(html, payload);
}

$w.onReady(function () {
  const html = $w(HTML_ID);

  html.onMessage(async (event) => {
    const msg = event.data || {};
    const source = msg.source || "";
    const type = msg.type || "";
    const payload = msg.payload || {};
    const requestId = msg.requestId || payload.requestId || "";

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
            requestId,
            query,
            results: result.results || result.items || []
          });
          return;
        }
      }

      if (source !== CHILD_SOURCE) {
        return;
      }

      // The HTML sends READY on startup. Treat it as a bootstrap handshake.
      if (type === "UNIFORM_ADMIN_READY") {
        await bootstrap(html, "");
        return;
      }

      if (type === "UNIFORM_ADMIN_BOOTSTRAP") {
        await bootstrap(html, payload.query || msg.query || "");
        return;
      }

      if (type === "UNIFORM_ADMIN_CREATE_IMAGE_UPLOAD") {
        const result = await adminUploadUniformImage({
          mode: "CREATE_SIGNED_UPLOAD",
          requestId,
          fileName: payload.fileName || msg.fileName || "",
          mimeType: payload.mimeType || msg.mimeType || "",
          size: payload.size ?? msg.size ?? 0,
          itemId: payload.itemId || msg.itemId || "",
          itemCode: payload.itemCode || msg.itemCode || "",
          title: payload.title || msg.title || ""
        });

        reply(html, "UNIFORM_ADMIN_IMAGE_UPLOAD_READY", requestId, result);
        return;
      }

      if (type === "UNIFORM_ADMIN_COMPLETE_IMAGE_UPLOAD") {
        const result = await adminUploadUniformImage({
          mode: "COMPLETE_SIGNED_UPLOAD",
          requestId,
          objectPath:
            payload.objectPath ||
            msg.objectPath ||
            payload.storagePath ||
            msg.storagePath ||
            "",
          storagePath:
            payload.storagePath ||
            msg.storagePath ||
            payload.objectPath ||
            msg.objectPath ||
            "",
          fileName: payload.fileName || msg.fileName || "",
          mimeType: payload.mimeType || msg.mimeType || "",
          size: payload.size ?? msg.size ?? 0,
          itemId: payload.itemId || msg.itemId || "",
          itemCode: payload.itemCode || msg.itemCode || "",
          title: payload.title || msg.title || ""
        });

        reply(html, "UNIFORM_ADMIN_IMAGE_UPLOADED", requestId, result);
        return;
      }

      // Legacy Base64 fallback remains available.
      if (type === "UNIFORM_ADMIN_UPLOAD_IMAGE") {
        const result = await adminUploadUniformImage({
          fileName: payload.fileName || msg.fileName || "",
          mimeType: payload.mimeType || msg.mimeType || "",
          dataUrl: payload.dataUrl || msg.dataUrl || "",
          base64: payload.base64 || msg.base64 || "",
          itemId: payload.itemId || msg.itemId || "",
          itemCode: payload.itemCode || msg.itemCode || "",
          title: payload.title || msg.title || ""
        });

        reply(html, "UNIFORM_ADMIN_IMAGE_UPLOADED", requestId, result);
        return;
      }

      if (type === "UNIFORM_ADMIN_SAVE_ITEM") {
        const result = await adminSaveUniformCatalogItem({
          item: payload.item || msg.item || {}
        });

        reply(html, "UNIFORM_ADMIN_SAVED", requestId, result);
        return;
      }

      if (type === "UNIFORM_ADMIN_SAVE_CATEGORY") {
        const result = await adminSaveUniformCategory({
          category: payload.category || msg.category || {}
        });

        reply(html, "UNIFORM_ADMIN_SAVED", requestId, result);
        return;
      }

      if (type === "UNIFORM_ADMIN_SAVE_RULE") {
        const result = await adminSaveUniformAllowanceRule({
          rule: payload.rule || msg.rule || {}
        });

        reply(html, "UNIFORM_ADMIN_SAVED", requestId, result);
        return;
      }

      if (type === "UNIFORM_ADMIN_ORDER_ACTION") {
        const result = await adminUniformOrderAction({
          orderId: payload.orderId || msg.orderId,
          action: payload.action || msg.action,
          note: payload.note || msg.note || ""
        });

        reply(html, "UNIFORM_ADMIN_SAVED", requestId, result);
        return;
      }

      if (type === "UNIFORM_ADMIN_ADJUST_WALLET") {
        const result = await adminAdjustUniformWallet({
          skId: payload.skId || msg.skId || "",
          email: payload.email || msg.email || "",
          points: payload.points ?? msg.points,
          reason: payload.reason || msg.reason || ""
        });

        reply(html, "UNIFORM_ADMIN_SAVED", requestId, result);
        return;
      }

      if (type === "UNIFORM_ADMIN_DELETE") {
        const result = await adminDeleteUniformItem({
          collectionId: payload.collectionId || msg.collectionId || "",
          itemId: payload.itemId || msg.itemId || ""
        });

        reply(html, "UNIFORM_ADMIN_SAVED", requestId, result);
        return;
      }

      if (type === "UNIFORM_ADMIN_NAVIGATE") {
        const path = payload.path || msg.path || "";
        if (allowedInternalPath(path)) wixLocation.to(path);
        return;
      }
    } catch (error) {
      replyError(html, requestId, error);
    }
  });
});
