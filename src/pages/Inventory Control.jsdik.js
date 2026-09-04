// Inventory Control.jsdik.js
// SKANDI Master Inventory Control V2
// Wix page contains one HTML component: #inventoryControlEmbed

import wixLocation from "wix-location";
import { authentication } from "wix-members-frontend";

import { getStaffPortalSession } from "backend/RIA/staffPortalAuth.web";

import {
  getInventoryControlV2Bootstrap,
  getInventoryMasterRecord,
  saveInventoryMasterRecord,
  setInventoryMasterPublication,
  getInventoryDatedInventory,
  saveInventoryDatedInventory,
  deleteInventoryDatedInventory
} from "backend/RIA/inventoryControlV2.web";

import {
  getMasterInventoryState,
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

const EMBED_ID = "#inventoryControlEmbed";
const INVENTORY_SOURCE = "SKANDI_ALTEA_MASTER";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";

const LOGIN_PATH = "/riaintra";
const HOME_PATH = "/";

function parseMessage(data) {
  if (typeof data === "string") {
    try {
      return JSON.parse(data);
    } catch (_) {
      return null;
    }
  }

  return data && typeof data === "object" ? data : null;
}

function post(html, type, payload = {}, requestId = "") {
  if (!html || typeof html.postMessage !== "function") return;

  html.postMessage({
    source: PARENT_SOURCE,
    type,
    payload,
    ...(requestId ? { requestId } : {}),
    timestamp: new Date().toISOString()
  });
}

function cleanError(error) {
  return String(
    error?.message ||
    error?.code ||
    "Master Inventory Control request failed."
  ).slice(0, 500);
}

async function getAuthorizedSession() {
  const session = await getStaffPortalSession().catch(() => null);

  if (
    !session ||
    session.loggedIn === false ||
    session.authenticated === false ||
    session.authorized === false ||
    session.ok === false
  ) {
    wixLocation.to(LOGIN_PATH);
    return null;
  }

  return session;
}

function normalizeProfile(session = {}) {
  const p =
    session.profile ||
    session.staff ||
    session.user ||
    session.agent ||
    {};

  return {
    name:
      p.name ||
      p.displayName ||
      [p.firstName, p.lastName].filter(Boolean).join(" ") ||
      p.email ||
      "",
    firstName: p.firstName || "",
    lastName: p.lastName || "",
    email: p.email || "",
    skId: p.skId || p.skID || p.employeeId || "",
    role: p.role || p.jobTitle || "",
    position: p.position || p.jobTitle || p.role || "",
    base: p.base || p.station || "",
    station: p.station || p.base || ""
  };
}

async function doLogout() {
  try {
    await authentication.logout();
  } catch (error) {
    console.warn("[Inventory Control] logout warning", error);
  }

  wixLocation.to(HOME_PATH);
}

async function bootstrapV2(html, payload = {}, requestId = "") {
  const session = await getAuthorizedSession();
  if (!session) return;

  const result = await getInventoryControlV2Bootstrap({
    entityType: payload.entityType || "",
    query: payload.query || "",
    status: payload.status || "",
    customerVisible:
      payload.customerVisible === undefined
        ? ""
        : payload.customerVisible,
    limit: payload.limit || 500
  });

  post(
    html,
    "INVENTORY_V2_BOOTSTRAP",
    {
      ...result,
      session: normalizeProfile(session)
    },
    requestId
  );
}

async function handleV2(html, type, payload, requestId) {
  switch (type) {
    case "INVENTORY_V2_LIST":
    case "INVENTORY_V2_REFRESH":
      await bootstrapV2(html, payload, requestId);
      return true;

    case "INVENTORY_V2_GET": {
      const result = await getInventoryMasterRecord({
        id: payload.id || payload.entityId
      });
      post(html, "INVENTORY_V2_RECORD", result, requestId);
      return true;
    }

    case "INVENTORY_V2_SAVE": {
      const result = await saveInventoryMasterRecord(payload);
      post(html, "INVENTORY_V2_SAVED", result, requestId);
      return true;
    }

    case "INVENTORY_V2_PUBLICATION": {
      const result = await setInventoryMasterPublication(payload);
      post(html, "INVENTORY_V2_SAVED", result, requestId);
      return true;
    }

    case "INVENTORY_V2_GET_DATED": {
      const result = await getInventoryDatedInventory(payload);
      post(html, "INVENTORY_V2_DATED", result, requestId);
      return true;
    }

    case "INVENTORY_V2_SAVE_DATED": {
      const result = await saveInventoryDatedInventory(payload);
      post(html, "INVENTORY_V2_DATED_SAVED", result, requestId);
      return true;
    }

    case "INVENTORY_V2_DELETE_DATED": {
      const result = await deleteInventoryDatedInventory({
        id: payload.id
      });
      post(html, "INVENTORY_V2_DATED_DELETED", result, requestId);
      return true;
    }

    default:
      return false;
  }
}

async function handleLegacy(html, type, payload, requestId) {
  switch (type) {
    case "INVENTORY_FETCH_FLIGHT": {
      const result = await fetchFlightInventory(payload);
      post(html, "INVENTORY_FLIGHT_RESULT", result, requestId);
      return true;
    }

    case "INVENTORY_UPDATE_CLASS_CAPACITY": {
      const result = await updateFlightClassCapacity(payload);
      post(
        html,
        "INVENTORY_ACTION_OK",
        {
          message: "Flight class capacity updated.",
          result
        },
        requestId
      );
      return true;
    }

    case "INVENTORY_FETCH_SCHEDULE": {
      const result = await fetchScheduleInventory(payload);
      post(html, "INVENTORY_SCHEDULE_RESULT", result, requestId);
      return true;
    }

    case "INVENTORY_FETCH_NESTING": {
      const result = await fetchNestingControls(payload);
      post(html, "INVENTORY_NESTING_RESULT", result, requestId);
      return true;
    }

    case "INVENTORY_FETCH_AUDIT": {
      const result = await fetchInventoryAudit(payload);
      post(html, "INVENTORY_AUDIT_RESULT", result, requestId);
      return true;
    }

    // Legacy operational records remain available while V2 is rolled out.
    case "HOTEL_FETCH_ALLOCATIONS": {
      const result = await fetchHotelAllocations(payload);
      post(html, "HOTEL_ALLOCATIONS_RESULT", result, requestId);
      return true;
    }

    case "HOTEL_UPDATE_ALLOTMENT": {
      const result = await updateHotelAllotment(payload);
      post(
        html,
        "INVENTORY_ACTION_OK",
        {
          message: "Hotel allotment updated.",
          result
        },
        requestId
      );
      return true;
    }

    case "TOUR_FETCH_CAPACITY": {
      const result = await fetchTourCapacity(payload);
      post(html, "TOUR_CAPACITY_RESULT", result, requestId);
      return true;
    }

    case "TOUR_UPDATE_CAPACITY": {
      const result = await updateTourCapacity(payload);
      post(
        html,
        "INVENTORY_ACTION_OK",
        {
          message: "Tour capacity updated.",
          result
        },
        requestId
      );
      return true;
    }

    case "PARTNER_FETCH_TICKETS": {
      const result = await fetchPartnerTickets(payload);
      post(html, "PARTNER_TICKETS_RESULT", result, requestId);
      return true;
    }

    case "PARTNER_SYNC_REQUEST": {
      const result = await syncPartnerTickets(payload);
      post(html, "PARTNER_TICKETS_RESULT", result, requestId);
      return true;
    }

    case "PACKAGE_FETCH_BUNDLES": {
      const result = await fetchPackageBundles(payload);
      post(html, "PACKAGE_BUNDLES_RESULT", result, requestId);
      return true;
    }

    case "PACKAGE_COMMIT_BUNDLE": {
      const result = await commitPackageBundle(payload);
      post(
        html,
        "INVENTORY_ACTION_OK",
        {
          message: "Package bundle committed.",
          result
        },
        requestId
      );
      return true;
    }

    case "INVENTORY_SYNC_REQUEST": {
      const result = await getMasterInventoryState({
        module: payload.module || "fdi",
        filters: payload.filters || {}
      });
      post(html, "MASTER_INVENTORY_BOOTSTRAP", result, requestId);
      return true;
    }

    default:
      return false;
  }
}

$w.onReady(async function () {
  const html = $w(EMBED_ID);

  if (!html || typeof html.onMessage !== "function") {
    console.error("[Inventory Control] #inventoryControlEmbed is missing.");
    return;
  }

  html.onMessage(async event => {
    const msg = parseMessage(event?.data);
    if (!msg || msg.source !== INVENTORY_SOURCE) return;

    const type = String(msg.type || msg.event || "");
    const payload =
      msg.payload && typeof msg.payload === "object"
        ? msg.payload
        : {};
    const requestId = String(msg.requestId || "");

    try {
      if (
        type === "MASTER_INVENTORY_READY" ||
        type === "INVENTORY_V2_READY"
      ) {
        await bootstrapV2(html, payload, requestId);
        return;
      }

      if (type === "INTERNAL_LOGOUT") {
        await doLogout();
        return;
      }

      if (await handleV2(html, type, payload, requestId)) return;
      if (await handleLegacy(html, type, payload, requestId)) return;

      post(
        html,
        "INVENTORY_ERROR",
        {
          code: "UNHANDLED_EVENT",
          message: `Unsupported inventory event: ${type}`
        },
        requestId
      );
    } catch (error) {
      console.error("[Inventory Control]", type, error);

      post(
        html,
        "INVENTORY_ERROR",
        {
          code: error?.code || "ACTION_FAILED",
          message: cleanError(error)
        },
        requestId
      );
    }
  });

  // Proactively verify the session. The HTML also sends READY once loaded.
  const session = await getAuthorizedSession();
  if (session) {
    post(html, "INVENTORY_PAGE_READY", {
      session: normalizeProfile(session)
    });
  }
});
