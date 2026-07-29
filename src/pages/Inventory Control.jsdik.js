// pages/riaintra-altea-inventory-control.js
// Production Wix page bridge for SKANDI Master Inventory Control.
// Page contains one HTML embed with element ID: #inventoryControlEmbed

import wixLocation from "wix-location";
import { authentication } from "wix-members-frontend";
import { getStaffPortalSession } from "src/backend/RIA/staffPortalAuth.web";
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
} from "src/backend/RIA/masterInventory.web";
import { bindInternalHtmlBridge } from 'src/public/internalHtmlBridge';
import {
  getHrSession,
  listStaff,
  saveStaff,
  setStaffActive,
  generateSkId,
  printStaffBadge,
  getStaffHrReports,
} from 'src/backend/RIA/staffHR.web';
import {
  savePayrollProfile,
  createPayrollPeriod,
  calculatePayrollRun,
  finalizePayrollRun,
} from 'src/backend/RIA/staffPayroll.web';

const HR_TYPES = new Set([
  'HR_READY', 'HR_REFRESH', 'HR_SAVE_STAFF', 'HR_DEACTIVATE', 'HR_REACTIVATE',
  'HR_GENERATE_SKID', 'HR_PRINT_BADGE', 'HR_REPORTS_REQUEST',
  'PAYROLL_SAVE_PROFILE', 'PAYROLL_CREATE_PERIOD', 'PAYROLL_CALCULATE_RUN', 'PAYROLL_FINALIZE_RUN',
  // Keep the existing handlers for HR_WIX_*, HR_PORTAL_*, Crewcontrol, and Badge Control.
]);
const EMBED_ID = "#inventoryControlEmbed";

const INVENTORY_SOURCE = "SKANDI_ALTEA_MASTER";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";

const LOGIN_PATH = "/riaintra";
const HOME_PATH = "/";

function post(html, type, payload = {}) {
  html.postMessage({
    source: PARENT_SOURCE,
    type,
    payload,
    timestamp: new Date().toISOString()
  });
}

function cleanError(error) {
  return error?.message || "Master inventory action failed.";
}

async function getAuthorizedSession() {
  const session = await getStaffPortalSession().catch(() => null);

  if (!session || session.authorized === false || session.ok === false) {
    wixLocation.to(LOGIN_PATH);
    return null;
  }

  return session;
}

function normalizeProfile(session = {}) {
  const p = session.profile || session.staff || session.user || session.agent || {};

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
    role: p.role || "",
    position: p.position || p.jobTitle || p.role || "",
    base: p.base || p.station || "",
    station: p.station || p.base || ""
  };
}

async function doLogout() {
  try {
    await authentication.logout();
  } catch (err) {
    console.warn("Logout warning:", err);
  }

  wixLocation.to(HOME_PATH);
}

async function bootstrapInventory(html, module = "fdi") {
  const session = await getAuthorizedSession();
  if (!session) return;

  const result = await getMasterInventoryState({
    module
  });

  post(html, "MASTER_INVENTORY_BOOTSTRAP", {
    ...result,
    session: normalizeProfile(session)
  });
}
$w.onReady(() => {
  bindInternalHtmlBridge({
    embed: $w('#staffHrEmbed'),
    allowedSources: new Set(['SKANDI_HR_STAFF', 'SKANDI_CAREERS_CONTROL']),
    allowedTypes: HR_TYPES,
    toError: () => ({ type: 'HR_ERROR', payload: { code: 'ACTION_FAILED' } }),
    handle: async ({ type, payload }) => {
      switch (type) {
        case 'HR_READY':
        case 'HR_REFRESH': {
          const [session, staff] = await Promise.all([getHrSession(), listStaff(payload)]);
          return [
            { type: 'HR_SESSION', payload: session },
            { type: 'HR_STAFF_LIST', payload: { staff } },
          ];
        }
        case 'HR_SAVE_STAFF':
          return { type: 'HR_STAFF_SAVED', payload: await saveStaff(payload) };
        case 'HR_DEACTIVATE':
          return { type: 'HR_ACTION_OK', payload: await setStaffActive({ ...payload, active: false }) };
        case 'HR_REACTIVATE':
          return { type: 'HR_ACTION_OK', payload: await setStaffActive({ ...payload, active: true }) };
        case 'HR_GENERATE_SKID':
          return { type: 'HR_SKID_GENERATED', payload: await generateSkId(payload) };
        case 'HR_PRINT_BADGE':
          return { type: 'HR_BADGE_PRINTED', payload: await printStaffBadge(payload) };
        case 'HR_REPORTS_REQUEST':
          return { type: 'HR_REPORTS', payload: await getStaffHrReports(payload) };
        case 'PAYROLL_SAVE_PROFILE':
          return { type: 'PAYROLL_PROFILE_SAVED', payload: await savePayrollProfile(payload) };
        case 'PAYROLL_CREATE_PERIOD':
          return { type: 'PAYROLL_PERIOD_CREATED', payload: await createPayrollPeriod(payload) };
        case 'PAYROLL_CALCULATE_RUN':
          return { type: 'PAYROLL_RUN_CALCULATED', payload: await calculatePayrollRun(payload) };
        case 'PAYROLL_FINALIZE_RUN':
          return { type: 'PAYROLL_RUN_FINALIZED', payload: await finalizePayrollRun(payload) };
        default:
          return { type: 'HR_ERROR', payload: { code: 'UNHANDLED_EVENT' } };
      }
    },
  });
});
$w.onReady(function () {
  const html = $w(EMBED_ID);

  html.onMessage(async (event) => {
    const msg = event.data || {};
    const source = msg.source || "";
    const type = msg.type || msg.event || "";
    const payload = msg.payload || {};

    if (source !== INVENTORY_SOURCE) {
      return;
    }

    try {
      if (type === "MASTER_INVENTORY_READY") {
        await bootstrapInventory(html, payload.module || "fdi");
        return;
      }

      if (type === "INTERNAL_LOGOUT") {
        await doLogout();
        return;
      }

      if (type === "INVENTORY_FETCH_FLIGHT") {
        const result = await fetchFlightInventory(payload);
        post(html, "INVENTORY_FLIGHT_RESULT", result);
        return;
      }

      if (type === "INVENTORY_UPDATE_CLASS_CAPACITY") {
        const result = await updateFlightClassCapacity(payload);

        post(html, "INVENTORY_ACTION_OK", {
          message: "Flight class capacity updated.",
          result
        });

        return;
      }

      if (type === "INVENTORY_FETCH_SCHEDULE") {
        const result = await fetchScheduleInventory(payload);
        post(html, "INVENTORY_SCHEDULE_RESULT", result);
        return;
      }

      if (type === "INVENTORY_FETCH_NESTING") {
        const result = await fetchNestingControls(payload);
        post(html, "INVENTORY_NESTING_RESULT", result);
        return;
      }

      if (type === "INVENTORY_FETCH_AUDIT") {
        const result = await fetchInventoryAudit(payload);
        post(html, "INVENTORY_AUDIT_RESULT", result);
        return;
      }

      if (type === "HOTEL_FETCH_ALLOCATIONS") {
        const result = await fetchHotelAllocations(payload);
        post(html, "HOTEL_ALLOCATIONS_RESULT", result);
        return;
      }

      if (type === "HOTEL_UPDATE_ALLOTMENT") {
        const result = await updateHotelAllotment(payload);

        post(html, "INVENTORY_ACTION_OK", {
          message: "Hotel allotment updated.",
          result
        });

        return;
      }

      if (type === "TOUR_FETCH_CAPACITY") {
        const result = await fetchTourCapacity(payload);
        post(html, "TOUR_CAPACITY_RESULT", result);
        return;
      }

      if (type === "TOUR_UPDATE_CAPACITY") {
        const result = await updateTourCapacity(payload);

        post(html, "INVENTORY_ACTION_OK", {
          message: "Tour capacity updated.",
          result
        });

        return;
      }

      if (type === "PARTNER_FETCH_TICKETS") {
        const result = await fetchPartnerTickets(payload);
        post(html, "PARTNER_TICKETS_RESULT", result);
        return;
      }

      if (type === "PARTNER_SYNC_REQUEST") {
        const result = await syncPartnerTickets(payload);
        post(html, "PARTNER_TICKETS_RESULT", result);
        return;
      }

      if (type === "PACKAGE_FETCH_BUNDLES") {
        const result = await fetchPackageBundles(payload);
        post(html, "PACKAGE_BUNDLES_RESULT", result);
        return;
      }

      if (type === "PACKAGE_COMMIT_BUNDLE") {
        const result = await commitPackageBundle(payload);

        post(html, "INVENTORY_ACTION_OK", {
          message: "Package bundle committed to PostgreSQL.",
          result
        });

        return;
      }

      if (type === "INVENTORY_SYNC_REQUEST") {
        const result = await getMasterInventoryState({
          module: payload.module || "fdi",
          filters: payload.filters || {}
        });

        post(html, "MASTER_INVENTORY_BOOTSTRAP", result);
        return;
      }

      if (type === "INVENTORY_EXPORT_GRID") {
        post(html, "INVENTORY_ACTION_OK", {
          message: "Export request received. Backend export can be connected next.",
          result: {
            module: payload.module || "",
            filters: payload.filters || {}
          }
        });

        return;
      }

    } catch (error) {
      post(html, "INVENTORY_ERROR", {
        message: cleanError(error)
      });
    }
  });
});
