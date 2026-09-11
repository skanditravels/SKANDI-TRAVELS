import wixLocation from "wix-location";
import {
  getPublicSupportBootstrap,
  createPublicSupportCase
} from "backend/supportCenter.web";

const EMBED_ID = "#skandiHelpCenterEmbed";
const CHILD_SOURCE = "SKANDI_SUPPORT_PUBLIC";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";

function objectOf(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function payloadOf(message) {
  return { ...objectOf(message), ...objectOf(message?.payload) };
}

function post(html, type, payload = {}, requestId = "") {
  html.postMessage({
    source: PARENT_SOURCE,
    type,
    requestId,
    payload: { ...objectOf(payload), requestId }
  });
}

function messageOf(error) {
  return String(error?.publicMessage || error?.message || "Support Center action failed.").slice(0, 300);
}

$w.onReady(function () {
  let html;
  try {
    html = $w(EMBED_ID);
  } catch (error) {
    console.error(`[Help Center] Missing HTML component ${EMBED_ID}.`, error);
    return;
  }

  html.onMessage(async event => {
    const message = objectOf(event.data);
    if (message.source !== CHILD_SOURCE) return;

    const payload = payloadOf(message);
    const requestId = String(message.requestId || payload.requestId || "");

    try {
      switch (message.type) {
        case "PUBLIC_SUPPORT_READY":
        case "PUBLIC_SUPPORT_REQUEST_BOOTSTRAP": {
          const result = await getPublicSupportBootstrap({ page: "/help" });
          post(html, "PUBLIC_SUPPORT_BOOTSTRAP", result, requestId);
          return;
        }

        case "PUBLIC_SUPPORT_CREATE_CASE": {
          const result = await createPublicSupportCase(payload);
          post(html, "PUBLIC_SUPPORT_CASE_CREATED", result, requestId);
          return;
        }

        case "PUBLIC_SUPPORT_NAVIGATE":
          if (payload.path) wixLocation.to(String(payload.path));
          return;

        default:
          return;
      }
    } catch (error) {
      console.error(`[Help Center] ${message.type || "Unknown action"} failed.`, error);
      post(html, "PUBLIC_SUPPORT_ERROR", { message: messageOf(error) }, requestId);
    }
  });
});
