// /src/pages/Finance Control.gboi3.js
// SKANDI V12 Corporate Finance Control page bridge.
// HTML embed -> this controller -> backend/SKANDI_CORE/financeControl.web.js -> financeControl.js -> canonical Supabase transport.

import wixLocationFrontend from "wix-location-frontend";
import { authentication } from "wix-members-frontend";
import {
  getFinanceControlBootstrap,
  saveFinanceExpenseReport,
  saveFinanceInvoice,
  saveFinanceRecord,
  saveFinancePurchaseRequest,
  getFinanceControlDiagnostics
} from "backend/SKANDI_CORE/financeControl.web";

const EMBED_ID = "#corporateFinanceEmbed";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";
const CHILD_SOURCES = new Set([
  "SKANDI_CORPORATE_FINANCE_CONTROL",
  "SKANDI_CORPORATE_FINANCE",
  "SKANDI_FINANCE_CONTROL"
]);

function send(embed, type, payload = {}, message = "") {
  embed.postMessage({
    source: PARENT_SOURCE,
    type,
    payload,
    ...(message ? { message } : {}),
    timestamp: new Date().toISOString()
  });
}
function errMessage(error) {
  return String(error?.message || error || "Corporate Finance action failed.").slice(0, 1000);
}
async function sendBootstrap(embed, payload = {}) {
  const result = await getFinanceControlBootstrap(payload || {});
  send(embed, "CORPORATE_FINANCE_BOOTSTRAP", result);
}
function invoiceResultType(payload = {}) {
  const status = String(payload?.header?.postingStatus || payload?.header?.status || "").toUpperCase();
  return status === "POSTED" ? "INVOICE_ISSUE_RESULT" : "INVOICE_DRAFT_RESULT";
}

$w.onReady(() => {
  const embed = $w(EMBED_ID);

  embed.onMessage(async event => {
    const message = event.data || {};
    if (message.source && !CHILD_SOURCES.has(message.source)) return;
    const payload = message.payload || {};

    try {
      switch (message.type) {
        case "CORPORATE_FINANCE_READY":
        case "CORPORATE_FINANCE_REFRESH":
          await sendBootstrap(embed, payload);
          return;

        case "FINANCE_SAVE_EXPENSE_REPORT": {
          const result = await saveFinanceExpenseReport(payload);
          send(embed, "FINANCE_ACTION_RESULT", result, result?.message || "Expense report saved.");
          await sendBootstrap(embed, {});
          return;
        }

        case "FINANCE_SAVE_PURCHASE_REQUEST": {
          const result = await saveFinancePurchaseRequest(payload);
          send(embed, "FINANCE_ACTION_RESULT", result, result?.message || "Purchase request saved.");
          await sendBootstrap(embed, {});
          return;
        }

        case "FINANCE_SAVE_INVOICE": {
          const result = await saveFinanceInvoice(payload);
          send(embed, invoiceResultType(payload), result, result?.message || "Invoice saved.");
          await sendBootstrap(embed, {});
          return;
        }

        case "FINANCE_SAVE_RECORD": {
          const result = await saveFinanceRecord(payload);
          send(embed, "FINANCE_SAVE_RESULT", result, result?.message || "Finance record saved.");
          await sendBootstrap(embed, {});
          return;
        }

        case "FINANCE_DIAGNOSTICS_REQUEST":
          send(embed, "FINANCE_DIAGNOSTICS_RESULT", await getFinanceControlDiagnostics());
          return;

        case "FINANCE_EXPORT_REPORT":
          send(embed, "FINANCE_EXPORT_REQUEST", {
            ...payload,
            message: "Export is generated inside the Finance Control embed from the currently loaded canonical dataset."
          });
          return;

        case "INTERNAL_LOGOUT":
        case "CORPORATE_FINANCE_LOGOUT":
          await authentication.logout();
          wixLocationFrontend.to("/");
          return;

        case "CORPORATE_FINANCE_OPEN_PATH":
        case "CORPORATE_FINANCE_NAVIGATE":
          if (payload.path) wixLocationFrontend.to(payload.path);
          return;

        default:
          return;
      }
    } catch (error) {
      const body = {
        code: String(error?.code || "CORPORATE_FINANCE_ACTION_FAILED"),
        message: errMessage(error)
      };
      const type = String(message.type || "").includes("INVOICE") ? "INVOICE_ERROR" : "CORPORATE_FINANCE_ERROR";
      send(embed, type, body, body.message);
    }
  });
});
