import wixLocation from "wix-location";
import { authentication } from "wix-members-frontend";
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
    embed: $w('#staffDasboardEmbed'),
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
import {
  getCorporateFinanceBootstrap,
  getProfitAndLossStatement,
  listFinanceLedgerEntries,
  syncFinanceLedger,
  saveManualFinanceEntry
} from "backend/corporateFinance";

const EMBED_ID = "#corporateFinanceEmbed";

const PARENT_SOURCE = "SKANDI_WIX_PARENT";

const ALLOWED_HTML_SOURCES = new Set([
  "SKANDI_CORPORATE_FINANCE",
  "SKANDI_CORPORATE_FINANCE_CONTROL",
  "SKANDI_FINANCE_CONTROL"
]);

function send(type, payload = {}) {
  $w(EMBED_ID).postMessage({
    source: PARENT_SOURCE,
    type,
    payload,
    timestamp: new Date().toISOString()
  });
}

function errorMessage(error) {
  const raw = error?.message || String(error || "Corporate Finance action failed.");

  if (
    raw.includes("Corporate Finance access required") ||
    raw.includes("Not signed in") ||
    raw.includes("Staff profile not found") ||
    raw.includes("Staff profile is not active")
  ) {
    return raw;
  }

  return raw || "Corporate Finance action failed.";
}

function normalizePeriod(payload = {}) {
  return {
    startDate: payload.startDate || payload.period?.startDate || "",
    endDate: payload.endDate || payload.period?.endDate || ""
  };
}

async function loadBootstrap(payload = {}) {
  send("CORPORATE_FINANCE_PROGRESS", {
    message: "Loading corporate finance..."
  });

  const result = await getCorporateFinanceBootstrap(normalizePeriod(payload));

  send("CORPORATE_FINANCE_BOOTSTRAP", result);
}

async function loadProfitAndLoss(payload = {}) {
  send("CORPORATE_FINANCE_PROGRESS", {
    message: "Calculating profit and loss..."
  });

  const result = await getProfitAndLossStatement(normalizePeriod(payload));

  send("CORPORATE_FINANCE_P_AND_L", result);
}

async function loadLedger(payload = {}) {
  send("CORPORATE_FINANCE_PROGRESS", {
    message: "Loading finance ledger..."
  });

  const result = await listFinanceLedgerEntries(normalizePeriod(payload));

  send("CORPORATE_FINANCE_LEDGER", result);
}

async function runLedgerSync(payload = {}) {
  send("CORPORATE_FINANCE_PROGRESS", {
    message: "Synchronizing finance ledger..."
  });

  const result = await syncFinanceLedger(normalizePeriod(payload));

  send("CORPORATE_FINANCE_SYNC_RESULT", result);

  await loadBootstrap(payload);
}

async function saveManualEntry(payload = {}) {
  send("CORPORATE_FINANCE_PROGRESS", {
    message: "Saving manual finance entry..."
  });

  const result = await saveManualFinanceEntry(payload);

  send("CORPORATE_FINANCE_MANUAL_ENTRY_RESULT", result);

  await loadLedger(payload);
  await loadBootstrap(payload);
}

function handleNavigation(payload = {}) {
  if (payload.path) {
    wixLocation.to(payload.path);
  }
}

$w.onReady(function () {
  const embed = $w(EMBED_ID);

  embed.onMessage(async (event) => {
    const message = event.data || {};
    const source = message.source || "";
    const payload = message.payload || {};

    if (source && !ALLOWED_HTML_SOURCES.has(source)) {
      return;
    }

    try {
      switch (message.type) {
        case "CORPORATE_FINANCE_READY":
        case "CORPORATE_FINANCE_REFRESH":
          await loadBootstrap(payload);
          break;

        case "CORPORATE_FINANCE_P_AND_L_REQUEST":
          await loadProfitAndLoss(payload);
          break;

        case "CORPORATE_FINANCE_LEDGER_REQUEST":
          await loadLedger(payload);
          break;

        case "CORPORATE_FINANCE_SYNC_LEDGER":
          await runLedgerSync(payload);
          break;

        case "CORPORATE_FINANCE_SAVE_MANUAL_ENTRY":
          await saveManualEntry(payload);
          break;

        case "CORPORATE_FINANCE_OPEN_PATH":
        case "CORPORATE_FINANCE_NAVIGATE":
          handleNavigation(payload);
          break;

        case "CORPORATE_FINANCE_LOGOUT":
          await authentication.logout();
          wixLocation.to("/");
          break;

        default:
          break;
      }
    } catch (error) {
      send("CORPORATE_FINANCE_ERROR", {
        message: errorMessage(error)
      });
    }
  });

  loadBootstrap({});
});
