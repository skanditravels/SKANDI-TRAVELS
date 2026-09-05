import wixLocation from "wix-location";
import { getStaffPortalSession } from "backend/RIA/staffPortalAuth.web";
import {
  getUniformAdminBootstrap,
  adminSaveUniformCatalogItem,
  adminSaveUniformCategory,
  adminSaveUniformAllowanceRule,
  adminUniformOrderAction,
  adminAdjustUniformWallet,
  adminDeleteUniformItem,
  adminUploadUniformImage
} from "backend/uniformCenterSupabase.web";

const HTML_ID = "#uniformControlEmbed";
const CHILD_SOURCE = "SKANDI_UNIFORM_ADMIN";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";
const LOGIN_PATH = "/riaintra";

function send(html, type, payload = {}, extra = {}) {
  html.postMessage({
    source: PARENT_SOURCE,
    type,
    payload,
    ...extra,
    timestamp: new Date().toISOString()
  });
}

function allowedInternalPath(path) {
  const p = String(path || "").trim();
  return p === "/" || p === LOGIN_PATH || p.startsWith("/riaintra") || p.startsWith("/altea");
}

async function requirePortalSession() {
  const session = await getStaffPortalSession().catch(() => null);
  if (!session || session.ok === false || session.authorized === false) {
    wixLocation.to(LOGIN_PATH);
    return null;
  }
  return session;
}

async function bootstrap(html, query = "") {
  const session = await requirePortalSession();
  if (!session) return;

  const payload = await getUniformAdminBootstrap({ query });
  send(html, "UNIFORM_ADMIN_BOOTSTRAP_RESULT", payload);
}

$w.onReady(function () {
  const html = $w(HTML_ID);

  html.onMessage(async (event) => {
    const msg = event.data || {};
    if (msg.source !== CHILD_SOURCE) return;

    const payload = msg.payload || {};
    const requestId = msg.requestId || payload.requestId || "";

    try {
      switch (msg.type) {
        case "UNIFORM_ADMIN_READY":
        case "UNIFORM_ADMIN_BOOTSTRAP":
          await bootstrap(html, msg.query || payload.query || "");
          return;

        case "UNIFORM_ADMIN_UPLOAD_IMAGE": {
          const result = await adminUploadUniformImage({
            fileName: msg.fileName || payload.fileName || "",
            mimeType: msg.mimeType || payload.mimeType || "",
            dataUrl: msg.dataUrl || payload.dataUrl || "",
            base64: msg.base64 || payload.base64 || "",
            itemId: msg.itemId || payload.itemId || "",
            itemCode: msg.itemCode || payload.itemCode || "",
            title: msg.title || payload.title || ""
          });
          send(html, "UNIFORM_ADMIN_IMAGE_UPLOADED", result, { requestId });
          return;
        }

        case "UNIFORM_ADMIN_SAVE_ITEM": {
          const result = await adminSaveUniformCatalogItem({ item: msg.item || payload.item || {} });
          send(html, "UNIFORM_ADMIN_SAVED", result, { requestId });
          return;
        }

        case "UNIFORM_ADMIN_SAVE_CATEGORY": {
          const result = await adminSaveUniformCategory({ category: msg.category || payload.category || {} });
          send(html, "UNIFORM_ADMIN_SAVED", result, { requestId });
          return;
        }

        case "UNIFORM_ADMIN_SAVE_RULE": {
          const result = await adminSaveUniformAllowanceRule({ rule: msg.rule || payload.rule || {} });
          send(html, "UNIFORM_ADMIN_SAVED", result, { requestId });
          return;
        }

        case "UNIFORM_ADMIN_ORDER_ACTION": {
          const result = await adminUniformOrderAction({
            orderId: msg.orderId || payload.orderId || "",
            action: msg.action || payload.action || "",
            note: msg.note || payload.note || ""
          });
          send(html, "UNIFORM_ADMIN_SAVED", result, { requestId });
          return;
        }

        case "UNIFORM_ADMIN_ADJUST_WALLET": {
          const result = await adminAdjustUniformWallet({
            agentUserId: msg.agentUserId || payload.agentUserId || "",
            skId: msg.skId || payload.skId || "",
            email: msg.email || payload.email || "",
            points: msg.points ?? payload.points,
            reason: msg.reason || payload.reason || ""
          });
          send(html, "UNIFORM_ADMIN_SAVED", result, { requestId });
          return;
        }

        case "UNIFORM_ADMIN_DELETE": {
          const result = await adminDeleteUniformItem({ itemId: msg.itemId || payload.itemId || "" });
          send(html, "UNIFORM_ADMIN_SAVED", result, { requestId });
          return;
        }

        case "UNIFORM_ADMIN_NAVIGATE": {
          const path = msg.path || payload.path || "";
          if (allowedInternalPath(path)) wixLocation.to(path);
          return;
        }

        default:
          return;
      }
    } catch (error) {
      send(html, "UNIFORM_ADMIN_ERROR", {}, {
        requestId,
        message: error?.message || "Uniform Control action failed."
      });
    }
  });
});
