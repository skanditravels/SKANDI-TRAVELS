// /src/pages/OPS Control.uposx.js
// V12 — OPS Control Wix/HTML bridge for the canonical ALTEA OPS route.

import wixLocationFrontend from "wix-location-frontend";
import { authentication } from "wix-members-frontend";
import { SITE_MAP } from "public/siteMap";
import { getStaffPortalSession } from "backend/SKANDI_CORE/staffAuth.web";
import { getOpsControlBootstrap, handleOpsControlAction } from "backend/SKANDI_CORE/opsControl.web";

const EMBED_IDS = ["#opsControlEmbed", "#occEmbed", "#htmlOpsControl"];
const SOURCE = "SKANDI_OPS_CONTROL";
const PARENT = "SKANDI_WIX_PARENT";
let bootstrapInFlight = null;

function embed() {
  for (const id of EMBED_IDS) {
    try {
      const element = $w(id);
      if (element) return element;
    } catch (_) {}
  }
  return null;
}

function post(html, type, payload = {}) {
  html?.postMessage({ source: PARENT, type, payload, timestamp: new Date().toISOString() });
}

async function logout() {
  try { await authentication.logout(); } catch (_) {}
  wixLocationFrontend.to(SITE_MAP.staffLogin);
}

async function bootstrap(html, payload = {}) {
  if (bootstrapInFlight) return bootstrapInFlight;
  bootstrapInFlight = (async () => {
    const session = await getStaffPortalSession().catch(() => null);
    if (!session?.authorized) {
      wixLocationFrontend.to(SITE_MAP.staffLogin);
      return null;
    }
    const data = await getOpsControlBootstrap(payload);
    post(html, "OPS_BOOTSTRAP", data);
    return data;
  })().finally(() => { bootstrapInFlight = null; });
  return bootstrapInFlight;
}

$w.onReady(() => {
  const html = embed();
  if (!html) {
    console.error("[OPS Control] HTML component not found.");
    return;
  }

  html.onMessage(async event => {
    const message = event?.data || {};
    if (message.source !== SOURCE) return;
    const type = message.type || message.action || "";
    const payload = message.payload || {};

    try {
      if (type === "OPS_READY" || type === "OPS_REFRESH" || type === "OPS_BOOTSTRAP_REQUEST") {
        await bootstrap(html, payload);
        return;
      }
      if (type === "OPS_LOGOUT") {
        await logout();
        return;
      }
      if (type === "OPS_ACTION") {
        const result = await handleOpsControlAction({
          type: payload.action,
          payload: payload.payload || {}
        });
        post(html, "OPS_ACTION_RESULT", { requestId: payload.requestId || "", ...result });
      }
    } catch (error) {
      console.error("[OPS Control]", error);
      post(html, "OPS_ERROR", {
        requestId: payload.requestId || "",
        action: type,
        code: error?.code || "OPS_CONTROL_FAILED",
        message: error?.publicMessage || error?.message || "OPS Control action failed."
      });
    }
  });

  bootstrap(html).catch(error => console.error("[OPS Control bootstrap]", error));
});
