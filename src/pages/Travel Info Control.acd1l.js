/*
 * Wix page code
 * Route: /riaintra/altea/help-data-controller
 * HTML component: #helpCenterAdminHtml
 */

import wixLocationFrontend from "wix-location-frontend";
import {
  getTravelInfoControlBootstrap,
  listTravelInfoRecords,
  getTravelInfoRecord,
  saveTravelInfoRecord,
  archiveTravelInfoRecord
} from "backend/FINAL/travelInfoControl.web";

const HTML_ID = "#helpCenterAdminHtml";
const CHILD_SOURCE = "SKANDI_HELP_DATA_CONTROLLER";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";

function htmlComponent() {
  try {
    const html = $w(HTML_ID);
    return html && typeof html.onMessage === "function" && typeof html.postMessage === "function" ? html : null;
  } catch (_) {
    return null;
  }
}

function parseMessage(data) {
  if (typeof data === "string") {
    try { return JSON.parse(data); } catch (_) { return null; }
  }
  return data && typeof data === "object" ? data : null;
}

function post(html, type, payload = {}, requestId = "") {
  html.postMessage({
    source: PARENT_SOURCE,
    type,
    payload,
    ...(requestId ? { requestId } : {}),
    timestamp: new Date().toISOString()
  });
}

function errorPayload(error) {
  const message = String(error?.message || error || "Travel Info Control request failed.");
  return { message, code: error?.code || "TRAVEL_INFO_CONTROL_ERROR" };
}

async function bootstrap(html, requestId = "") {
  try {
    const result = await getTravelInfoControlBootstrap();
    post(html, "TIC_BOOTSTRAP", result, requestId);
    const list = await listTravelInfoRecords({ kind: result?.defaultKind || "airlines" });
    post(html, "TIC_LIST", list, requestId);
  } catch (error) {
    console.error("[Travel Info Control] bootstrap failed", error);
    post(html, "TIC_ERROR", errorPayload(error), requestId);
  }
}

async function handle(html, message) {
  const payload = message.payload || {};
  const requestId = message.requestId || "";
  try {
    switch (message.type) {
      case "TIC_READY":
      case "TIC_REFRESH":
      case "HC_ADMIN_READY":
      case "HC_ADMIN_REFRESH":
        await bootstrap(html, requestId);
        return;

      case "TIC_LIST_REQUEST": {
        const result = await listTravelInfoRecords(payload);
        post(html, "TIC_LIST", result, requestId);
        return;
      }

      case "TIC_GET_REQUEST": {
        const result = await getTravelInfoRecord(payload);
        post(html, "TIC_RECORD", result, requestId);
        return;
      }

      case "TIC_SAVE_REQUEST": {
        const result = await saveTravelInfoRecord(payload);
        post(html, "TIC_SAVED", result, requestId);
        const list = await listTravelInfoRecords({ kind: payload.kind || result?.record?.kind || "airlines" });
        post(html, "TIC_LIST", list, requestId);
        return;
      }

      case "TIC_ARCHIVE_REQUEST": {
        const result = await archiveTravelInfoRecord(payload);
        post(html, "TIC_ARCHIVED", result, requestId);
        const list = await listTravelInfoRecords({ kind: payload.kind || "airlines" });
        post(html, "TIC_LIST", list, requestId);
        return;
      }

      case "TIC_NAVIGATE": {
        const path = String(payload.path || message.path || "").trim();
        if (path === "/" || path.startsWith("/riaintra") || path.startsWith("/altea")) {
          wixLocationFrontend.to(path);
        }
        return;
      }

      default:
        return;
    }
  } catch (error) {
    console.error(`[Travel Info Control] ${message.type || "request"} failed`, error);
    post(html, "TIC_ERROR", errorPayload(error), requestId);
  }
}

$w.onReady(async function () {
  const html = htmlComponent();
  if (!html) {
    console.error(`[Travel Info Control] ${HTML_ID} is missing or is not an HTML Component.`);
    return;
  }

  html.onMessage(async event => {
    const message = parseMessage(event.data);
    if (!message || message.source !== CHILD_SOURCE) return;
    await handle(html, message);
  });

  // Proactive boot so a fast iframe READY event can never be lost.
  await bootstrap(html);
});
