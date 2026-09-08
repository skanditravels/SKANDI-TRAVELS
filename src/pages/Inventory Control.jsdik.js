import {
  getSmartInventoryBootstrap,
  getSmartInventoryRecord,
  saveSmartInventoryRecord,
  getSmartDatedInventory,
  saveSmartDatedInventory,
  deleteSmartDatedInventory,
  getSmartInventoryAudit,
  createInventoryMediaUploadTicket,
  getInventorySourceHealth,
  listInventoryCatalogEntries,
  saveInventoryCatalogEntry,
  deleteInventoryCatalogEntry,
  getSmartFlightInventory,
  getSmartScheduleInventory,
  getSmartNestingInventory
} from "backend/RIA/inventoryControlV4.web";

const HTML_SOURCE = "SKANDI_ALTEA_MASTER";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";
const EMBED_IDS = ["#inventoryControlEmbed", "#alteaInventoryControlEmbed", "#masterInventoryEmbed"];

function embed() {
  for (const id of EMBED_IDS) {
    try {
      const el = $w(id);
      if (el) return el;
    } catch (_) {}
  }
  throw new Error("Inventory Control HTML embed was not found. Expected #inventoryControlEmbed, #alteaInventoryControlEmbed, or #masterInventoryEmbed.");
}
function send(type, payload = {}, requestId = "") {
  embed().postMessage({
    source: PARENT_SOURCE,
    type,
    payload,
    ...(requestId ? { requestId } : {}),
    timestamp: new Date().toISOString()
  });
}
function cleanError(error) {
  return {
    message: error?.publicMessage || error?.message || "Inventory request failed.",
    code: error?.code || ""
  };
}
function replyType(requestType, v4Type, v3Type = "", v2Type = "") {
  const t = String(requestType || "");
  if (t.startsWith("INVENTORY_V3_") && v3Type) return v3Type;
  if (t.startsWith("INVENTORY_V2_") && v2Type) return v2Type;
  return v4Type;
}

$w.onReady(function () {
  let box;
  try {
    box = embed();
  } catch (error) {
    console.error("[Inventory Control V4.4] EMBED", error);
    return;
  }

  // Tell the iframe immediately that page code is alive, before any backend call.
  send("INVENTORY_PAGE_READY", {
    version: "4.4",
    bridge: "single-backend",
    backend: "backend/RIA/inventoryControlV4.web"
  });

  box.onMessage(async event => {
    const msg = event.data || {};
    if (msg.source !== HTML_SOURCE) return;
    const p = msg.payload || {};
    const requestId = msg.requestId || "";

    try {
      switch (msg.type) {
        case "MASTER_INVENTORY_READY":
        case "INVENTORY_V4_READY":
        case "INVENTORY_V4_LIST":
        case "INVENTORY_V3_READY":
        case "INVENTORY_V3_LIST":
        case "INVENTORY_V2_READY":
        case "INVENTORY_V2_LIST": {
          const result = await getSmartInventoryBootstrap(p || {});
          send(replyType(msg.type, "INVENTORY_V4_BOOTSTRAP", "INVENTORY_V3_BOOTSTRAP", "INVENTORY_V2_BOOTSTRAP"), result, requestId);
          break;
        }

        case "INVENTORY_V4_GET":
        case "INVENTORY_V3_GET":
        case "INVENTORY_V2_GET":
          send(replyType(msg.type, "INVENTORY_V4_RECORD", "INVENTORY_V3_RECORD", "INVENTORY_V2_RECORD"), await getSmartInventoryRecord(p), requestId);
          break;

        case "INVENTORY_V4_SAVE":
        case "INVENTORY_V3_SAVE":
        case "INVENTORY_V2_SAVE":
          send(replyType(msg.type, "INVENTORY_V4_SAVED", "INVENTORY_V3_SAVED", "INVENTORY_V2_SAVED"), await saveSmartInventoryRecord(p), requestId);
          break;

        case "INVENTORY_V4_GET_DATED":
        case "INVENTORY_V3_GET_DATED":
        case "INVENTORY_V2_GET_DATED":
          send(replyType(msg.type, "INVENTORY_V4_DATED", "INVENTORY_V3_DATED", "INVENTORY_V2_DATED"), await getSmartDatedInventory(p), requestId);
          break;

        case "INVENTORY_V4_SAVE_DATED":
        case "INVENTORY_V3_SAVE_DATED":
        case "INVENTORY_V2_SAVE_DATED":
          send(replyType(msg.type, "INVENTORY_V4_DATED_SAVED", "INVENTORY_V3_DATED_SAVED", "INVENTORY_V2_DATED_SAVED"), await saveSmartDatedInventory(p), requestId);
          break;

        case "INVENTORY_V4_DELETE_DATED":
        case "INVENTORY_V3_DELETE_DATED":
        case "INVENTORY_V2_DELETE_DATED":
          send(replyType(msg.type, "INVENTORY_V4_DATED_DELETED", "INVENTORY_V3_DATED_DELETED", "INVENTORY_V2_DATED_DELETED"), await deleteSmartDatedInventory(p), requestId);
          break;

        case "INVENTORY_V4_MEDIA_UPLOAD_TICKET":
        case "INVENTORY_V3_MEDIA_UPLOAD_TICKET":
          send(replyType(msg.type, "INVENTORY_V4_MEDIA_UPLOAD_TICKET_RESULT", "INVENTORY_V3_MEDIA_UPLOAD_TICKET_RESULT"), await createInventoryMediaUploadTicket(p), requestId);
          break;

        case "INVENTORY_V4_SOURCE_HEALTH":
        case "INVENTORY_V3_SOURCE_HEALTH":
          send(replyType(msg.type, "INVENTORY_V4_SOURCE_HEALTH_RESULT", "INVENTORY_V3_SOURCE_HEALTH_RESULT"), await getInventorySourceHealth(), requestId);
          break;

        case "INVENTORY_V4_LIST_CATALOG":
        case "INVENTORY_V3_LIST_CATALOG":
          send(replyType(msg.type, "INVENTORY_V4_CATALOG_RESULT", "INVENTORY_V3_CATALOG_RESULT"), await listInventoryCatalogEntries(p), requestId);
          break;

        case "INVENTORY_V4_SAVE_CATALOG":
        case "INVENTORY_V3_SAVE_CATALOG":
          send(replyType(msg.type, "INVENTORY_V4_CATALOG_SAVED", "INVENTORY_V3_CATALOG_SAVED"), await saveInventoryCatalogEntry(p), requestId);
          break;

        case "INVENTORY_V4_DELETE_CATALOG":
        case "INVENTORY_V3_DELETE_CATALOG":
          send(replyType(msg.type, "INVENTORY_V4_CATALOG_DELETED", "INVENTORY_V3_CATALOG_DELETED"), await deleteInventoryCatalogEntry(p), requestId);
          break;

        case "INVENTORY_FETCH_AUDIT":
          send("INVENTORY_AUDIT_RESULT", await getSmartInventoryAudit(p), requestId);
          break;

        case "INVENTORY_FETCH_FLIGHT":
          send("INVENTORY_FLIGHT_RESULT", await getSmartFlightInventory(p), requestId);
          break;

        case "INVENTORY_FETCH_SCHEDULE":
          send("INVENTORY_SCHEDULE_RESULT", await getSmartScheduleInventory(p), requestId);
          break;

        case "INVENTORY_FETCH_NESTING":
          send("INVENTORY_NESTING_RESULT", await getSmartNestingInventory(p), requestId);
          break;

        default:
          console.warn("[Inventory Control V4.4] Unhandled message", msg.type);
      }
    } catch (error) {
      console.error("[Inventory Control V4.4]", msg.type, error);
      send("INVENTORY_ERROR", cleanError(error), requestId);
    }
  });

  // Proactive live bootstrap. If this fails, HTML gets a real error instead of fake snapshot data.
  getSmartInventoryBootstrap({})
    .then(payload => {
      send("INVENTORY_V4_BOOTSTRAP", payload);
    })
    .catch(error => {
      console.error("[Inventory Control V4.4] bootstrap", error);
      send("INVENTORY_ERROR", cleanError(error));
    });
});
