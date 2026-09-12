// /src/backend/SKANDI_CORE/payroll.web.js
// B-008 — only frontend-callable Payroll backend boundary.

import { Permissions, webMethod } from "@wix/web-methods";
import {
  createPayrollPeriodCore,
  createPayrollProviderExportCore,
  createPayrollRunFromPeriodCore,
  finalizePayrollRunCore,
  getPayrollWorkspaceCore,
  markPayrollProviderExportSentCore,
  savePayrollAdjustmentCore,
  savePayrollEmployeeProfileCore,
  savePayrollRunLineCore
} from "backend/SKANDI_CORE/payroll.js";

export const getPayrollWorkspace = webMethod(Permissions.SiteMember, getPayrollWorkspaceCore);
export const savePayrollEmployeeProfile = webMethod(Permissions.SiteMember, savePayrollEmployeeProfileCore);
export const createPayrollPeriod = webMethod(Permissions.SiteMember, createPayrollPeriodCore);
export const createPayrollRunFromPeriod = webMethod(Permissions.SiteMember, createPayrollRunFromPeriodCore);
export const savePayrollRunLine = webMethod(Permissions.SiteMember, savePayrollRunLineCore);
export const savePayrollAdjustment = webMethod(Permissions.SiteMember, savePayrollAdjustmentCore);
export const finalizePayrollRun = webMethod(Permissions.SiteMember, finalizePayrollRunCore);
export const createPayrollProviderExport = webMethod(Permissions.SiteMember, createPayrollProviderExportCore);
export const markPayrollProviderExportSent = webMethod(Permissions.SiteMember, markPayrollProviderExportSentCore);
