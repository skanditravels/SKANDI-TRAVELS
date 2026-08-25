import wixLocation from "wix-location";
import { getStaffPortalSession } from "backend/RIA/staffPortalAuth.web";

import {
  getUniformEmployeeBootstrap,
  submitUniformEmployeeOrder,
  acknowledgeUniformPolicy
} from "backend/uniformCenterCms.web";
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
const HTML_ID = "#uniformCenterEmbed";
const CHILD_SOURCE = "SKANDI_UNIFORM_EMPLOYEE";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";
const LOGIN_PATH = "/riaintra";

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

async function requirePortalSession() {
  const session = await getStaffPortalSession().catch(() => null);

  if (!session || session.authorized === false || session.ok === false) {
    wixLocation.to(LOGIN_PATH);
    return null;
  }

  return session;
}

async function bootstrap(html) {
  const portalSession = await requirePortalSession();

  if (!portalSession) {
    return;
  }

  const payload = await getUniformEmployeeBootstrap();
  postFlat(html, "UNIFORM_EMPLOYEE_BOOTSTRAP_RESULT", { payload });
}

$w.onReady(function () {
  const html = $w(HTML_ID);

  html.onMessage(async (event) => {
    const msg = event.data || {};
    const source = msg.source || "";
    const type = msg.type || "";
    const payload = msg.payload || {};

    if (source !== CHILD_SOURCE) {
      return;
    }

    try {
      if (type === "UNIFORM_EMPLOYEE_READY" || type === "UNIFORM_EMPLOYEE_BOOTSTRAP") {
        await bootstrap(html);
        return;
      }

      if (type === "UNIFORM_EMPLOYEE_SUBMIT_ORDER") {
        const result = await submitUniformEmployeeOrder({
          items: msg.items || payload.items || [],
          note: msg.note || payload.note || ""
        });
        postFlat(html, "UNIFORM_EMPLOYEE_ORDER_SUBMITTED", { payload: result });
        return;
      }

      if (type === "UNIFORM_EMPLOYEE_ACK_POLICY") {
        const result = await acknowledgeUniformPolicy({
          policyId: msg.policyId || payload.policyId || "",
          policyVersion: msg.policyVersion || payload.policyVersion || ""
        });
        postFlat(html, "UNIFORM_EMPLOYEE_ACK_OK", { payload: result });
      }
    } catch (error) {
      postFlat(html, "UNIFORM_EMPLOYEE_ERROR", {
        message: error.message || "Uniform Shop action failed."
      });
    }
  });
});
