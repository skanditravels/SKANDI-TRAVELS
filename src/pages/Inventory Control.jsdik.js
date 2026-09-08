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
  deleteInventoryCatalogEntry
} from "backend/RIA/inventoryControlV4.web";
import {
  fetchFlightInventory,
  updateFlightClassCapacity,
  fetchScheduleInventory,
  fetchNestingControls,
  fetchInventoryAudit,
  fetchHotelAllocations,
  updateHotelAllotment,
  fetchTourCapacity,
  updateTourCapacity,
  fetchPartnerTickets,
  syncPartnerTickets,
  fetchPackageBundles,
  commitPackageBundle
} from "backend/RIA/masterInventory.web";

const HTML_SOURCE = "SKANDI_ALTEA_MASTER";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";
const EMBED_IDS = ["#inventoryControlEmbed", "#alteaInventoryControlEmbed", "#masterInventoryEmbed"];

function embed() {
  for (const id of EMBED_IDS) {
    try { const el = $w(id); if (el) return el; } catch (_) {}
  }
  throw new Error("Inventory Control HTML embed was not found.");
}
function send(type, payload = {}, requestId = "") {
  embed().postMessage({ source: PARENT_SOURCE, type, payload, ...(requestId ? { requestId } : {}), timestamp: new Date().toISOString() });
}
function cleanError(error) {
  return { message: error?.publicMessage || error?.message || "Inventory request failed.", code: error?.code || "" };
}
async function bootstrap(payload = {}) {
  return getSmartInventoryBootstrap(payload || {});
}

$w.onReady(function () {
  const box = embed();
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
        case "INVENTORY_V2_LIST": {
          const result = await bootstrap(p);
          send(msg.type === "INVENTORY_V2_LIST" ? "INVENTORY_V2_BOOTSTRAP" : "INVENTORY_V4_BOOTSTRAP", result, requestId);
          break;
        }
        case "INVENTORY_V4_GET":
        case "INVENTORY_V2_GET": {
          const result = await getSmartInventoryRecord(p);
          send(msg.type === "INVENTORY_V2_GET" ? "INVENTORY_V2_RECORD" : "INVENTORY_V4_RECORD", result, requestId);
          break;
        }
        case "INVENTORY_V4_SAVE":
        case "INVENTORY_V2_SAVE": {
          const result = await saveSmartInventoryRecord(p);
          send(msg.type === "INVENTORY_V2_SAVE" ? "INVENTORY_V2_SAVED" : "INVENTORY_V4_SAVED", result, requestId);
          break;
        }
        case "INVENTORY_V4_GET_DATED":
        case "INVENTORY_V2_GET_DATED": {
          const result = await getSmartDatedInventory(p);
          send(msg.type === "INVENTORY_V2_GET_DATED" ? "INVENTORY_V2_DATED" : "INVENTORY_V4_DATED", result, requestId);
          break;
        }
        case "INVENTORY_V4_SAVE_DATED":
        case "INVENTORY_V2_SAVE_DATED": {
          const result = await saveSmartDatedInventory(p);
          send(msg.type === "INVENTORY_V2_SAVE_DATED" ? "INVENTORY_V2_DATED_SAVED" : "INVENTORY_V4_DATED_SAVED", result, requestId);
          break;
        }
        case "INVENTORY_V4_DELETE_DATED":
        case "INVENTORY_V2_DELETE_DATED": {
          const result = await deleteSmartDatedInventory(p);
          send(msg.type === "INVENTORY_V2_DELETE_DATED" ? "INVENTORY_V2_DATED_DELETED" : "INVENTORY_V4_DATED_DELETED", result, requestId);
          break;
        }
        case "INVENTORY_V4_MEDIA_UPLOAD_TICKET":
          send("INVENTORY_V4_MEDIA_UPLOAD_TICKET_RESULT", await createInventoryMediaUploadTicket(p), requestId);
          break;
        case "INVENTORY_V4_SOURCE_HEALTH":
          send("INVENTORY_V4_SOURCE_HEALTH_RESULT", await getInventorySourceHealth(), requestId);
          break;
        case "INVENTORY_V4_LIST_CATALOG":
          send("INVENTORY_V4_CATALOG_RESULT", await listInventoryCatalogEntries(p), requestId);
          break;
        case "INVENTORY_V4_SAVE_CATALOG":
          send("INVENTORY_V4_CATALOG_SAVED", await saveInventoryCatalogEntry(p), requestId);
          break;
        case "INVENTORY_V4_DELETE_CATALOG":
          send("INVENTORY_V4_CATALOG_DELETED", await deleteInventoryCatalogEntry(p), requestId);
          break;
        case "INVENTORY_FETCH_AUDIT":
          send("INVENTORY_AUDIT_RESULT", await getSmartInventoryAudit(p), requestId);
          break;

        // Existing ALTEA operational inventory modules remain authoritative for these functions.
        case "INVENTORY_FETCH_FLIGHT":
          send("INVENTORY_FLIGHT_RESULT", await fetchFlightInventory(p), requestId);
          break;
        case "INVENTORY_UPDATE_CLASS_CAPACITY":
          send("INVENTORY_ACTION_OK", await updateFlightClassCapacity(p), requestId);
          break;
        case "INVENTORY_FETCH_SCHEDULE":
          send("INVENTORY_SCHEDULE_RESULT", await fetchScheduleInventory(p), requestId);
          break;
        case "INVENTORY_FETCH_NESTING":
          send("INVENTORY_NESTING_RESULT", await fetchNestingControls(p), requestId);
          break;
        case "INVENTORY_FETCH_LEGACY_AUDIT":
          send("INVENTORY_AUDIT_RESULT", await fetchInventoryAudit(p), requestId);
          break;
        case "HOTEL_FETCH_ALLOCATIONS":
          send("HOTEL_ALLOCATIONS_RESULT", await fetchHotelAllocations(p), requestId);
          break;
        case "HOTEL_UPDATE_ALLOTMENT":
          send("INVENTORY_ACTION_OK", await updateHotelAllotment(p), requestId);
          break;
        case "TOUR_FETCH_CAPACITY":
          send("TOUR_CAPACITY_RESULT", await fetchTourCapacity(p), requestId);
          break;
        case "TOUR_UPDATE_CAPACITY":
          send("INVENTORY_ACTION_OK", await updateTourCapacity(p), requestId);
          break;
        case "PARTNER_TICKETS_FETCH":
          send("PARTNER_TICKETS_RESULT", await fetchPartnerTickets(p), requestId);
          break;
        case "PARTNER_TICKETS_SYNC":
          send("INVENTORY_ACTION_OK", await syncPartnerTickets(p), requestId);
          break;
        case "PACKAGE_BUNDLES_FETCH":
          send("PACKAGE_BUNDLES_RESULT", await fetchPackageBundles(p), requestId);
          break;
        case "PACKAGE_BUNDLE_COMMIT":
          send("INVENTORY_ACTION_OK", await commitPackageBundle(p), requestId);
          break;
        default:
          break;
      }
    } catch (error) {
      console.error("[Inventory Control V4]", msg.type, error);
      send("INVENTORY_ERROR", cleanError(error), requestId);
    }
  });

  // Proactive bootstrap prevents a missed iframe READY event from leaving Inventory Control blank.
  bootstrap({})
    .then(payload => {
      send("INVENTORY_PAGE_READY", { version: "4.0", session: payload.session, canonicalSource: payload.canonicalSource });
      send("INVENTORY_V4_BOOTSTRAP", payload);
    })
    .catch(error => {
      console.error("[Inventory Control V4] bootstrap", error);
      send("INVENTORY_ERROR", cleanError(error));
    });
});
