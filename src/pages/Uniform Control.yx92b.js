import wixLocation from "wix-location";
import { authentication } from "wix-members-frontend";
import { getStaffPortalSession } from "backend/RIA/staffPortalAuth.web";
import { runInternalGlobalSearch } from "backend/FINAL/internalChrome.web";

import {
  getUniformAdminBootstrap,
  adminSaveUniformCatalogItem,
  adminSaveUniformCategory,
  adminSaveUniformAllowanceRule,
  adminUniformOrderAction,
  adminAdjustUniformWallet,
  adminDeleteUniformItem
} from "backend/uniformCenterCms.web";

const HTML_ID = "#uniformControlEmbed";
const CHILD_SOURCE = "SKANDI_UNIFORM_ADMIN";
const CHROME_SOURCE = "SKANDI_INTERNAL_CHROME";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";
const LOGIN_PATH = "/riaintra";
const HOME_PATH = "/";
import { bindInternalHtmlBridge } from 'public/internalHtmlBridge';
import {
  getHrSession,
  listStaff,
  saveStaff,
  setStaffActive,
  generateSkId,
  printStaffBadge,
  getStaffHrReports,
} from 'backend/RIA/staffHR.web';
import {
  savePayrollProfile,
  createPayrollPeriod,
  calculatePayrollRun,
  finalizePayrollRun,
} from 'backend/RIA/staffPayroll.web';

const HR_TYPES = new Set([
  'HR_READY', 'HR_REFRESH', 'HR_SAVE_STAFF', 'HR_DEACTIVATE', 'HR_REACTIVATE',
  'HR_GENERATE_SKID', 'HR_PRINT_BADGE', 'HR_REPORTS_REQUEST',
  'PAYROLL_SAVE_PROFILE', 'PAYROLL_CREATE_PERIOD', 'PAYROLL_CALCULATE_RUN', 'PAYROLL_FINALIZE_RUN',
  // Keep the existing handlers for HR_WIX_*, HR_PORTAL_*, Crewcontrol, and Badge Control.
]);

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
function currentPath() {
  return "/" + wixLocation.path.join("/");
}

function post(html, type, payload = {}) {
  html.postMessage({
    source: PARENT_SOURCE,
    type,
    payload: payload || {},
    timestamp: new Date().toISOString()
  });
}

function postFlat(html, type, payload = {}) {
  html.postMessage({
    source: PARENT_SOURCE,
    type,
    ...(payload || {}),
    timestamp: new Date().toISOString()
  });
}

function allowedInternalPath(path) {
  const p = String(path || "");
  return p === "/" || p === LOGIN_PATH || p.startsWith("/riaintra") || p.startsWith("/altea");
}

async function logout() {
  try {
    await authentication.logout();
  } catch (err) {
    console.warn("Logout warning:", err);
  }

  wixLocation.to(HOME_PATH);
}

async function sendChromeBootstrap(html, adminPayload = {}) {
  post(html, "INTERNAL_CHROME_BOOTSTRAP", {
    pageName: "Uniform Control",
    pagePath: currentPath(),
    pageSubtitle: "Enterprise uniform catalog, wallets, allowance rules and order control",
    profile: adminPayload.profile || adminPayload.session || {},
    apps: adminPayload.apps || [],
    isAltea: true
  });
}

async function requirePortalSession() {
  const session = await getStaffPortalSession().catch(() => null);

  if (!session || session.authorized === false || session.ok === false) {
    wixLocation.to(LOGIN_PATH);
    return null;
  }

  return session;
}

async function bootstrap(html, query = "") {
  const portalSession = await requirePortalSession();

  if (!portalSession) {
    return;
  }

  const payload = await getUniformAdminBootstrap({ query });
  postFlat(html, "UNIFORM_ADMIN_BOOTSTRAP_RESULT", { payload });
  await sendChromeBootstrap(html, payload);
}

$w.onReady(function () {
  const html = $w(HTML_ID);

  html.onMessage(async (event) => {
    const msg = event.data || {};
    const source = msg.source || "";
    const type = msg.type || "";
    const payload = msg.payload || {};

    try {
      if (source === CHROME_SOURCE) {
        if (type === "INTERNAL_CHROME_READY") {
          await bootstrap(html);
          return;
        }

        if (type === "INTERNAL_LOGOUT") {
          await logout();
          return;
        }

        if (type === "INTERNAL_NAVIGATE") {
          const path = payload.path || msg.path || "";
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

      if (source !== CHILD_SOURCE) {
        return;
      }

      if (type === "UNIFORM_ADMIN_BOOTSTRAP") {
        await bootstrap(html, msg.query || payload.query || "");
        return;
      }

      if (type === "UNIFORM_ADMIN_SAVE_ITEM") {
        const result = await adminSaveUniformCatalogItem({ item: msg.item || payload.item || {} });
        postFlat(html, "UNIFORM_ADMIN_SAVED", { payload: result });
        return;
      }

      if (type === "UNIFORM_ADMIN_SAVE_CATEGORY") {
        const result = await adminSaveUniformCategory({ category: msg.category || payload.category || {} });
        postFlat(html, "UNIFORM_ADMIN_SAVED", { payload: result });
        return;
      }

      if (type === "UNIFORM_ADMIN_SAVE_RULE") {
        const result = await adminSaveUniformAllowanceRule({ rule: msg.rule || payload.rule || {} });
        postFlat(html, "UNIFORM_ADMIN_SAVED", { payload: result });
        return;
      }

      if (type === "UNIFORM_ADMIN_ORDER_ACTION") {
        const result = await adminUniformOrderAction({
          orderId: msg.orderId || payload.orderId,
          action: msg.action || payload.action,
          note: msg.note || payload.note || ""
        });
        postFlat(html, "UNIFORM_ADMIN_SAVED", { payload: result });
        return;
      }

      if (type === "UNIFORM_ADMIN_ADJUST_WALLET") {
        const result = await adminAdjustUniformWallet({
          skId: msg.skId || payload.skId || "",
          email: msg.email || payload.email || "",
          points: msg.points ?? payload.points,
          reason: msg.reason || payload.reason || ""
        });
        postFlat(html, "UNIFORM_ADMIN_SAVED", { payload: result });
        return;
      }

      if (type === "UNIFORM_ADMIN_DELETE") {
        const result = await adminDeleteUniformItem({
          collectionId: msg.collectionId || payload.collectionId || "",
          itemId: msg.itemId || payload.itemId || ""
        });
        postFlat(html, "UNIFORM_ADMIN_SAVED", { payload: result });
        return;
      }

      if (type === "UNIFORM_ADMIN_NAVIGATE") {
        const path = msg.path || payload.path || "";
        if (allowedInternalPath(path)) wixLocation.to(path);
      }
    } catch (error) {
      postFlat(html, "UNIFORM_ADMIN_ERROR", {
        message: error.message || "Uniform Control action failed."
      });
    }
  });
});