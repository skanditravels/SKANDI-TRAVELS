// pages/riaintra-altea-inventory-control.js
// Production Wix page bridge for ALTEA Inventory Control.
// Page contains one HTML embed with element ID: #inventoryControlEmbed

import wixLocation from "wix-location";
import { authentication } from "wix-members-frontend";
import { getStaffPortalSession } from "src/backend/RIA/staffPortalAuth.web";
import { runInternalGlobalSearch } from "src/backend/FINAL/internalChrome.web";
import {
  getInventorySchema,
  listInventoryItems,
  getInventoryItem,
  saveInventoryItem,
  duplicateInventoryItem,
  deleteInventoryItem
} from "src/backend/AMADEUS/inventoryControl.web";

const EMBED_ID = "#inventoryControlEmbed";
const INVENTORY_SOURCE = "SKANDI_INVENTORY_EMBED";
const LEGACY_INVENTORY_SOURCE = "ALTEA_INVENTORY_EMBED";
const PARENT_SOURCE = "SKANDI_INVENTORY_PARENT";
const CHROME_SOURCE = "SKANDI_INTERNAL_CHROME";
const LOGIN_PATH = "/riaintra";
const HOME_PATH = "/";

function currentPath() {
  return "/" + wixLocation.path.join("/");
}

function post(html, type, payload = {}) {
  html.postMessage({
    source: PARENT_SOURCE,
    type,
    payload,
    timestamp: new Date().toISOString()
  });
}

function allowedInternalPath(path) {
  const p = String(path || "");
  return p === "/" || p === LOGIN_PATH || p.startsWith("/riaintra") || p.startsWith("/altea");
}

function normalizeProfile(session = {}) {
  const p = session.profile || session.staff || session.user || session.agent || {};
  return {
    name: p.name || [p.firstName, p.lastName].filter(Boolean).join(" ") || p.email || "",
    firstName: p.firstName || "",
    lastName: p.lastName || "",
    email: p.email || "",
    skId: p.skId || p.employeeId || "",
    role: p.role || "",
    position: p.position || p.jobTitle || p.role || "",
    base: p.base || p.station || "",
    station: p.station || p.base || ""
  };
}

async function getAuthorizedSession() {
  const session = await getStaffPortalSession().catch(() => null);
  if (!session || session.authorized === false || session.ok === false) {
    wixLocation.to(LOGIN_PATH);
    return null;
  }
  return session;
}

async function sendChromeBootstrap(html) {
  const session = await getAuthorizedSession();
  if (!session) return null;

  post(html, "INTERNAL_CHROME_BOOTSTRAP", {
    pageName: "Inventory Control",
    pagePath: currentPath(),
    pageSubtitle: "ALTEA product, content and operations records",
    profile: normalizeProfile(session),
    apps: session.apps || [],
    isAltea: true
  });

  return session;
}

async function doLogout() {
  try {
    await authentication.logout();
  } catch (err) {
    console.warn("Logout warning:", err);
  }
  wixLocation.to(HOME_PATH);
}

$w.onReady(function () {
  const html = $w(EMBED_ID);

  html.onMessage(async (event) => {
    const msg = event.data || {};
    const source = msg.source || "";
    const type = msg.type || msg.event || "";
    const payload = msg.payload || {};

    try {
      if (source === CHROME_SOURCE) {
        if (type === "INTERNAL_CHROME_READY") {
          await sendChromeBootstrap(html);
          return;
        }

        if (type === "INTERNAL_LOGOUT") {
          await doLogout();
          return;
        }

        if (type === "INTERNAL_NAVIGATE") {
          const path = payload.path || msg.path;
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

      if (source && source !== INVENTORY_SOURCE && source !== LEGACY_INVENTORY_SOURCE) {
        return;
      }

      if (type === "INV_READY") {
        const session = await sendChromeBootstrap(html);
        if (!session) return;

        const schema = await getInventorySchema();
        post(html, "INV_SCHEMA", { schema });
        return;
      }

      if (type === "INV_LIST_REQUEST") {
        const result = await listInventoryItems(payload);
        post(html, "INV_LIST", result);
        return;
      }

      if (type === "INV_GET_REQUEST") {
        const result = await getInventoryItem(payload);
        post(html, "INV_ITEM", result);
        return;
      }

      if (type === "INV_SAVE_REQUEST") {
        const result = await saveInventoryItem(payload);
        post(html, "INV_SAVE_OK", result);
        return;
      }

      if (type === "INV_DUPLICATE_REQUEST") {
        const result = await duplicateInventoryItem(payload);
        post(html, "INV_DUPLICATE_OK", result);
        return;
      }

      if (type === "INV_DELETE_REQUEST") {
        const result = await deleteInventoryItem(payload);
        post(html, "INV_DELETE_OK", result);
        return;
      }
    } catch (error) {
      post(html, "INV_ERROR", {
        message: error.message || "Inventory action failed."
      });
    }
  });
});
