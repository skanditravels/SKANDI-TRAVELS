// Inventory Control page code — SKANDI V9
// Single secure backend boundary. Global internal chrome remains owned by masterPage.js.

import wixLocationFrontend from "wix-location-frontend";
import { inventoryControlDispatch } from "backend/RIA/inventoryControlV4.web";

const EMBED_IDS = [
  "#inventoryControlEmbed",
  "#alteaInventoryControlEmbed",
  "#masterInventoryEmbed"
];

const INVENTORY_SOURCES = new Set([
  "SKANDI_INVENTORY_EMBED",
  "SKANDI_ALTEA_MASTER",      // migration compatibility only
  "ALTEA_INVENTORY_EMBED"     // migration compatibility only
]);

const PARENT_SOURCE = "SKANDI_INVENTORY_PARENT";
const LOGIN_PATH = "/riaintra";
const VERSION = "2026.09.10.9";

function getInventoryEmbed() {
  for (const id of EMBED_IDS) {
    try {
      const candidate = $w(id);
      if (
        candidate &&
        typeof candidate.onMessage === "function" &&
        typeof candidate.postMessage === "function"
      ) {
        console.log(`[Inventory Control V9] Bound HTML Component ${id}.`);
        return { html: candidate, id };
      }
    } catch (_) {}
  }
  console.error(`[Inventory Control V9] No HTML Component found. Checked: ${EMBED_IDS.join(", ")}`);
  return null;
}

function post(html, type, payload = {}, requestId = "") {
  html.postMessage({
    source: PARENT_SOURCE,
    type,
    payload,
    ...(requestId ? { requestId } : {}),
    version: VERSION,
    timestamp: new Date().toISOString()
  });
}

function cleanError(error) {
  const message = String(error?.message || error || "").trim();
  if (!message || message.length > 240) return "Inventory Control could not complete the request.";
  return message;
}

function shouldReturnToLogin(payload = {}) {
  const code = String(payload.code || "").toUpperCase();
  return code === "INVENTORY_AUTH_REQUIRED" || code === "INVENTORY_ACCESS_DENIED";
}

$w.onReady(function () {
  const resolved = getInventoryEmbed();
  if (!resolved) return;

  const { html, id } = resolved;

  // Listener is registered before any host message or backend request.
  html.onMessage(async (event) => {
    const msg = event.data || {};
    if (!INVENTORY_SOURCES.has(String(msg.source || ""))) return;

    const type = String(msg.type || msg.event || "").trim();
    const payload = msg.payload && typeof msg.payload === "object" ? msg.payload : {};
    const requestId = String(msg.requestId || "");
    if (!type) return;

    try {
      const result = await inventoryControlDispatch(type, payload);
      const responseType = result?.type || (result?.ok === false ? "INVENTORY_ERROR" : "INVENTORY_ERROR");
      const responsePayload = result?.payload || {
        code: "INVENTORY_EMPTY_RESPONSE",
        message: "Inventory Control received an empty system response."
      };

      post(html, responseType, responsePayload, requestId);

      if (responseType === "INVENTORY_ERROR" && shouldReturnToLogin(responsePayload)) {
        wixLocationFrontend.to(LOGIN_PATH);
      }
    } catch (error) {
      post(html, "INVENTORY_ERROR", {
        code: "INVENTORY_PAGE_BRIDGE_ERROR",
        message: cleanError(error)
      }, requestId);
    }
  });

  post(html, "INVENTORY_V9_HOST_READY", {
    embedId: id,
    supportedEmbedIds: EMBED_IDS,
    version: VERSION
  });
});
