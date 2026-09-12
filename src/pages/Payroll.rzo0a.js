// /src/pages/Payroll.js
// B-008 — merged Employee Payroll + Payroll Control bridge.
// One backend dependency only. No RIAINTRA header/footer embed contract.

import wixLocation from "wix-location";
import {
  createPayrollPeriod,
  createPayrollProviderExport,
  createPayrollRunFromPeriod,
  finalizePayrollRun,
  getPayrollWorkspace,
  markPayrollProviderExportSent,
  savePayrollAdjustment,
  savePayrollEmployeeProfile,
  savePayrollRunLine
} from "backend/SKANDI_CORE/payroll.web";

const EMBED_ID = "#payrollStaffEmbed";
const CHILD_SOURCE = "SKANDI_ZALARIS_PAYROLL";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";

function send(type, payload = {}) {
  $w(EMBED_ID).postMessage({ source: PARENT_SOURCE, type, payload, timestamp: new Date().toISOString() });
}

function internalPath(value) {
  const path = String(value || "").trim();
  return path === "/riaintra" || path.startsWith("/riaintra/") ? path : "";
}

async function bootstrap() {
  send("PAYROLL_WORKSPACE", await getPayrollWorkspace());
}

$w.onReady(function () {
  const embed = $w(EMBED_ID);
  embed.onMessage(async (event) => {
    const message = event.data || {};
    if (message.source && message.source !== CHILD_SOURCE) return;
    const type = String(message.type || "");
    const payload = message.payload || {};

    try {
      if (type === "PAYROLL_READY" || type === "PAYROLL_REFRESH") {
        await bootstrap();
        return;
      }

      const actions = {
        PAYROLL_SAVE_PROFILE: () => savePayrollEmployeeProfile(payload),
        PAYROLL_CREATE_PERIOD: () => createPayrollPeriod(payload),
        PAYROLL_CREATE_RUN: () => createPayrollRunFromPeriod(payload),
        PAYROLL_SAVE_RUN_LINE: () => savePayrollRunLine(payload),
        PAYROLL_SAVE_ADJUSTMENT: () => savePayrollAdjustment(payload),
        PAYROLL_FINALIZE_RUN: () => finalizePayrollRun(payload),
        PAYROLL_CREATE_EXPORT: () => createPayrollProviderExport(payload),
        PAYROLL_MARK_EXPORT_SENT: () => markPayrollProviderExportSent(payload)
      };

      if (type === "PAYROLL_NAVIGATE") {
        const path = internalPath(payload.path);
        if (path) wixLocation.to(path);
        return;
      }

      if (actions[type]) {
        const result = await actions[type]();
        if (type === "PAYROLL_CREATE_EXPORT" && result?.csv) {
          send("PAYROLL_EXPORT_READY", result);
          return;
        }
        send("PAYROLL_WORKSPACE", result);
      }
    } catch (error) {
      send("PAYROLL_ERROR", {
        action: type,
        code: error?.code || "PAYROLL_ACTION_FAILED",
        message: error?.message || "The Payroll action could not be completed."
      });
    }
  });
});
