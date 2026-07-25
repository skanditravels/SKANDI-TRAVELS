import wixLocation from "wix-location";
import { authentication } from "wix-members-frontend";
import { getStaffPortalSession } from "backend/RIA/staffPortalAuth.web";
import { runInternalGlobalSearch } from "backend/FINAL/internalChrome.web";
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
import {
  getHrSession,
  listStaff,
  saveStaff,
  setStaffActive,
  generateSkId,
  lookupAndLinkWixMember,
  createLinkedWixMember,
  syncLinkedWixMember,
  sendLinkedWixSetPasswordEmail,
  approveLinkedWixMember,
  blockLinkedWixMember,
  printStaffBadge,
  getStaffHrReports
} from "backend/RIA/staffHR.web";

import {
  savePayrollProfile,
  createPayrollPeriod,
  calculatePayrollRun,
  finalizePayrollRun
} from "backend/RIA/staffPayroll.web";

const EMBED_ID = "#staffHrEmbed";
const EMBED_SOURCE = "SKANDI_HR_STAFF";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";
const CHROME_SOURCE = "SKANDI_INTERNAL_CHROME";
const LOGIN_PATH = "/riaintra";
const HOME_PATH = "/";

function currentPath() { return "/" + wixLocation.path.join("/"); }
function send(type, payload = {}) {
  $w(EMBED_ID).postMessage({ source: PARENT_SOURCE, type, payload: payload || {}, timestamp: new Date().toISOString() });
}
function cleanError(err) {
  const msg = String(err?.message || err || "").trim();
  if (!msg) return "Something went wrong.";
  return msg.length > 220 ? "Something went wrong." : msg;
}
function allowedInternalPath(path) {
  const p = String(path || "");
  return p === "/" || p === LOGIN_PATH || p.startsWith("/riaintra") || p.startsWith("/altea");
}
async function logout() {
  try { await authentication.logout(); } catch (err) {}
  wixLocation.to(HOME_PATH);
}
async function bootstrapChrome(session) {
  send("INTERNAL_CHROME_BOOTSTRAP", {
    pageName: "Staff HR",
    pagePath: currentPath(),
    pageSubtitle: "Staff master, portal login, ID documents and reports",
    profile: session?.agent || session?.profile || {},
    apps: session?.apps || [],
    isAltea: false
  });
}
async function sendSessionAndList() {
  const portalSession = await getStaffPortalSession().catch(() => null);
  if (!portalSession || portalSession.authorized === false || portalSession.ok === false) {
    wixLocation.to(LOGIN_PATH);
    return;
  }
  const session = await getHrSession();
  send("HR_SESSION", session);
  await bootstrapChrome(session);
  if (!session.authorized) return;
  send("HR_STAFF_LIST", await listStaff({}));
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
  const embed = $w(EMBED_ID);
  embed.onMessage(async (event) => {
    const data = event.data || {};
    const source = data.source || "";
    const type = data.type || "";
    const payload = data.payload || {};
    try {
      if (source === CHROME_SOURCE) {
        if (type === "INTERNAL_CHROME_READY") { await bootstrapChrome(await getHrSession().catch(() => ({}))); return; }
        if (type === "INTERNAL_LOGOUT") { await logout(); return; }
        if (type === "INTERNAL_NAVIGATE") { const path = payload.path || data.path || ""; if (allowedInternalPath(path)) wixLocation.to(path); return; }
        if (type === "INTERNAL_GLOBAL_SEARCH") { send("INTERNAL_SEARCH_RESULTS", await runInternalGlobalSearch(payload.query || "")); return; }
      }
      if (source && source !== EMBED_SOURCE) return;

      if (type === "HR_READY") { await sendSessionAndList(); return; }
      if (type === "HR_REFRESH") { send("HR_STAFF_LIST", { ...(await listStaff(payload?.filters || {})), selectedId: payload?.selectedId || "" }); return; }
      if (type === "HR_SAVE_STAFF") {
        const result = await saveStaff(payload?.item || {});
        if (!result.ok) throw new Error(result.message || "Save failed.");
        send("HR_STAFF_SAVED", result);
        send("HR_STAFF_LIST", await listStaff({}));
        return;
      }
      if (type === "HR_DEACTIVATE") { const r = await setStaffActive(payload?._id, false); if(!r.ok) throw new Error(r.message || "Deactivate failed."); send("HR_STAFF_SAVED", r); send("HR_STAFF_LIST", await listStaff({})); return; }
      if (type === "HR_REACTIVATE") { const r = await setStaffActive(payload?._id, true); if(!r.ok) throw new Error(r.message || "Reactivate failed."); send("HR_STAFF_SAVED", r); send("HR_STAFF_LIST", await listStaff({})); return; }
      if (type === "HR_GENERATE_SKID") { const r = await generateSkId(payload?.prefix || ""); if(!r.ok) throw new Error(r.message || "Could not generate SK-ID."); send("HR_SKID_GENERATED", r); return; }

      if (type === "HR_WIX_LOOKUP" || type === "HR_PORTAL_LOOKUP") { send("HR_WIX_RESULT", await lookupAndLinkWixMember(payload?._id)); return; }
      if (type === "HR_WIX_CREATE" || type === "HR_PORTAL_CREATE") { send("HR_WIX_RESULT", await createLinkedWixMember(payload?._id)); return; }
      if (type === "HR_WIX_SYNC" || type === "HR_PORTAL_SYNC") { send("HR_WIX_RESULT", await syncLinkedWixMember(payload?._id)); return; }
      if (type === "HR_WIX_SEND_PASSWORD" || type === "HR_PORTAL_SEND_PASSWORD") { send("HR_WIX_RESULT", await sendLinkedWixSetPasswordEmail(payload?._id)); return; }
      if (type === "HR_WIX_APPROVE" || type === "HR_PORTAL_APPROVE") { send("HR_WIX_RESULT", await approveLinkedWixMember(payload?._id)); return; }
      if (type === "HR_WIX_BLOCK" || type === "HR_PORTAL_BLOCK") { send("HR_WIX_RESULT", await blockLinkedWixMember(payload?._id)); return; }

      if (type === "HR_PRINT_BADGE") { send("HR_BADGE_PRINTED", await printStaffBadge(payload?._id, { badgePhoto: payload?.badgePhoto || "", badgeStatus: payload?.badgeStatus || "" })); return; }
      if (type === "HR_REPORTS_REQUEST") { send("HR_REPORTS", await getStaffHrReports({ skId: payload?.skId || "" })); return; }
      if (type === "HR_NAVIGATE") { if (allowedInternalPath(payload.path)) wixLocation.to(payload.path); return; }
      if (type === "HR_PRINT_PAGE") {
  send("HR_ACTION_OK", {
    message: "Print command received."
  });
  return;
}

if (type === "HR_CLOSE_RECORD") {
  send("HR_RECORD_CLOSED", {
    ok: true
  });
  return;
}

if (type === "HR_CREWCONTROL_REFRESH") {
  send("HR_CREWCONTROL_DATA", await getStaffHrReports({
    section: "crewcontrol",
    skId: payload?.skId || ""
  }));
  return;
}

if (type === "HR_CREWCONTROL_ROUTE_SAVE") {
  const result = await saveStaff({
    ...(payload?.item || payload || {}),
    sourceModule: "crewcontrol"
  });

  if (!result.ok) {
    throw new Error(result.message || "Crewcontrol save failed.");
  }

  send("HR_CREWCONTROL_DATA", result);
  send("HR_STAFF_LIST", await listStaff({}));
  return;
}

if (type === "HR_BADGE_CONTROL_REFRESH") {
  send("HR_BADGE_CONTROL_DATA", await getStaffHrReports({
    section: "badgeControl",
    skId: payload?.skId || ""
  }));
  return;
}

if (type === "HR_BADGE_CONTROL_SAVE") {
  const result = await saveStaff({
    ...(payload?.item || payload || {}),
    sourceModule: "badgeControl"
  });

  if (!result.ok) {
    throw new Error(result.message || "Badge Control save failed.");
  }

  send("HR_BADGE_CONTROL_SAVED", result);
  send("HR_STAFF_LIST", await listStaff({}));
  return;
}
if (type === "PAYROLL_SAVE_PROFILE") {
  const result = await savePayrollProfile(payload);
  send("PAYROLL_PROFILE_SAVED", result);
  return;
}

if (type === "PAYROLL_CREATE_PERIOD") {
  const result = await createPayrollPeriod(payload);
  send("PAYROLL_PERIOD_CREATED", result);
  return;
}

if (type === "PAYROLL_CALCULATE_RUN") {
  const result = await calculatePayrollRun(payload);
  send("PAYROLL_RUN_CALCULATED", result);
  return;
}

if (type === "PAYROLL_FINALIZE_RUN") {
  const result = await finalizePayrollRun(payload);
  send("PAYROLL_RUN_FINALIZED", result);
  return;
}
    } catch (err) {
      send("HR_ERROR", { message: cleanError(err), action: type });
    }
  });
});