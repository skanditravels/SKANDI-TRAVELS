// /src/backend/SKANDI_CORE/financeControl.web.js
// Direct webMethod exports are intentional: do not wrap these in a helper factory.
// Wix frontend proxy generation must see each named export as a direct webMethod declaration.

import { Permissions, webMethod } from "@wix/web-methods";
import {
  getFinanceControlBootstrapCore,
  saveFinanceExpenseReportCore,
  saveFinanceInvoiceCore,
  saveFinanceRecordCore,
  saveFinancePurchaseRequestCore,
  getFinanceControlDiagnosticsCore
} from "backend/SKANDI_CORE/financeControl";

export const getFinanceControlBootstrap = webMethod(Permissions.SiteMember, async (input = {}) =>
  getFinanceControlBootstrapCore(input || {})
);
export const saveFinanceExpenseReport = webMethod(Permissions.SiteMember, async (input = {}) =>
  saveFinanceExpenseReportCore(input || {})
);
export const saveFinanceInvoice = webMethod(Permissions.SiteMember, async (input = {}) =>
  saveFinanceInvoiceCore(input || {})
);
export const saveFinanceRecord = webMethod(Permissions.SiteMember, async (input = {}) =>
  saveFinanceRecordCore(input || {})
);
export const saveFinancePurchaseRequest = webMethod(Permissions.SiteMember, async (input = {}) =>
  saveFinancePurchaseRequestCore(input || {})
);
export const getFinanceControlDiagnostics = webMethod(Permissions.SiteMember, async () =>
  getFinanceControlDiagnosticsCore()
);
