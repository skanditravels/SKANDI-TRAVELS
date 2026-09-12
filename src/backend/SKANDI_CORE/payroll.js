// /src/backend/SKANDI_CORE/payroll.js
// SKANDI Backend Base 1.0 — B-008
// Canonical Payroll business core.
//
// Payroll is the only owner of payroll setup, rates, periods, runs, line amounts,
// adjustments and provider-export state. SuccessFactors may synchronize only the
// derived employee/jurisdiction mirror needed to place an employee in Payroll.

import { restRequest } from "backend/SKANDI_CORE/supabaseServer.js";
import { requireStaffPortalSessionCore } from "backend/SKANDI_CORE/staffAuth.js";
import { SkandiError } from "backend/SKANDI_CORE/platformErrors.js";
import {
  firstRow,
  isoDateOnly,
  normalizeSkId,
  safeBoolean,
  safeNumber,
  stringArray,
  text,
  upper
} from "backend/SKANDI_CORE/platformValidation.js";

const PRIVILEGED_ACCESS_ROLES = new Set(["SUPER_ADMIN", "OWNER", "COMPANY_OWNER"]);

function rows(value) { return Array.isArray(value) ? value : []; }
async function select(table, query = {}) { return rows(await restRequest({ table, method: "GET", query, prefer: "" })); }

function hasToken(values, candidates) {
  const source = new Set(stringArray(values).map((value) => String(value).trim().toLowerCase()));
  return candidates.some((candidate) => source.has(String(candidate).toLowerCase()));
}

function isPrivileged(session = {}) {
  return session.isSystemAdmin === true || PRIVILEGED_ACCESS_ROLES.has(upper(session.accessRole, 80));
}

function canAdminPayroll(session = {}) {
  if (isPrivileged(session)) return true;
  if (session.canAccessPayroll !== true) return false;
  return session.isPayrollAdmin === true ||
    hasToken(session.permissionKeys, ["payroll.admin", "payroll.manage", "payroll.control"]) ||
    hasToken(session.permissionGroups, ["payroll-admin", "payroll", "system-admin"]);
}

async function requirePayroll({ admin = false } = {}) {
  const session = await requireStaffPortalSessionCore();
  if (admin && !canAdminPayroll(session)) {
    throw new SkandiError(
      "PAYROLL_ADMIN_ACCESS_REQUIRED",
      "Payroll administrator access is required.",
      { publicMessage: "You do not have permission to use Payroll Control." }
    );
  }
  return session;
}

function safeSession(session = {}) {
  return {
    profile: session.profile || null,
    accessRole: text(session.accessRole, 80),
    permissionPreset: text(session.permissionPreset, 100),
    payrollAdmin: canAdminPayroll(session),
    isSystemAdmin: session.isSystemAdmin === true
  };
}

function payrollProfileDto(row = {}, { includeCompensation = false } = {}) {
  if (!row?.id) return null;
  const dto = {
    id: text(row.id, 80),
    staffKey: text(row.staff_key, 160),
    agentUserId: text(row.agent_user_id, 80),
    skId: normalizeSkId(row.sk_id),
    displayName: text(row.display_name, 180),
    email: text(row.email, 320),
    employmentType: text(row.employment_type, 80),
    payrollEnabled: row.payroll_enabled === true,
    currency: upper(row.currency, 8),
    taxRegion: text(row.tax_region, 120),
    bankStatus: text(row.bank_status, 80),
    payrollNote: text(row.payroll_note, 1000),
    updatedAt: text(row.updated_at, 80)
  };
  if (includeCompensation) {
    dto.baseSalary = safeNumber(row.base_salary, 0);
    dto.hourlyRate = safeNumber(row.hourly_rate, 0);
    dto.standardHours = safeNumber(row.standard_hours, 0);
  }
  return dto;
}

function periodDto(row = {}) {
  if (!row?.id) return null;
  return {
    id: text(row.id, 80),
    periodCode: text(row.period_code, 100),
    startDate: text(row.start_date, 32),
    endDate: text(row.end_date, 32),
    currency: upper(row.currency, 8),
    status: text(row.status, 60),
    createdAt: text(row.created_at, 80),
    updatedAt: text(row.updated_at, 80)
  };
}

function runDto(row = {}) {
  if (!row?.id) return null;
  return {
    id: text(row.id, 80),
    runCode: text(row.run_code, 120),
    payrollPeriodId: text(row.payroll_period_id, 80),
    periodCode: text(row.period_code, 100),
    status: text(row.status, 60),
    currency: upper(row.currency, 8),
    grossTotal: safeNumber(row.gross_total, 0),
    deductionsTotal: safeNumber(row.deductions_total, 0),
    netTotal: safeNumber(row.net_total, 0),
    lineCount: safeNumber(row.line_count, 0),
    calculatedAt: text(row.calculated_at, 80),
    finalizedAt: text(row.finalized_at, 80),
    createdAt: text(row.created_at, 80),
    updatedAt: text(row.updated_at, 80)
  };
}

function lineDto(row = {}, { includeRates = false } = {}) {
  if (!row?.id) return null;
  const dto = {
    id: text(row.id, 80),
    payrollRunId: text(row.payroll_run_id, 80),
    staffKey: text(row.staff_key, 160),
    agentUserId: text(row.agent_user_id, 80),
    skId: normalizeSkId(row.sk_id),
    displayName: text(row.display_name, 180),
    currency: upper(row.currency, 8),
    hours: safeNumber(row.hours, 0),
    earnings: safeNumber(row.earnings, 0),
    deductions: safeNumber(row.deductions, 0),
    netPay: safeNumber(row.net_pay, 0),
    status: text(row.status, 60),
    createdAt: text(row.created_at, 80),
    updatedAt: text(row.updated_at, 80)
  };
  if (includeRates) {
    dto.baseSalary = safeNumber(row.base_salary, 0);
    dto.hourlyRate = safeNumber(row.hourly_rate, 0);
  }
  return dto;
}

function adjustmentDto(row = {}) {
  if (!row?.id) return null;
  return {
    id: text(row.id, 80),
    adjustmentKey: text(row.adjustment_key, 160),
    payrollRunId: text(row.payroll_run_id, 80),
    payrollPeriodId: text(row.payroll_period_id, 80),
    staffKey: text(row.staff_key, 160),
    agentUserId: text(row.agent_user_id, 80),
    skId: normalizeSkId(row.sk_id),
    adjustmentType: text(row.adjustment_type, 80),
    amount: safeNumber(row.amount, 0),
    taxable: row.taxable === true,
    reason: text(row.reason, 1000),
    status: text(row.status, 60),
    createdAt: text(row.created_at, 80),
    updatedAt: text(row.updated_at, 80)
  };
}

function exportDto(row = {}) {
  if (!row?.id) return null;
  return {
    id: text(row.id, 80),
    exportKey: text(row.export_key, 160),
    payrollRunId: text(row.payroll_run_id, 80),
    provider: text(row.provider, 80),
    status: text(row.status, 60),
    providerReference: text(row.provider_reference, 300),
    createdAt: text(row.created_at, 80),
    updatedAt: text(row.updated_at, 80)
  };
}

async function ownProfile(session) {
  const agentUserId = text(session.profile?.agentUserId || session.profile?.id, 80);
  if (!agentUserId) return null;
  return firstRow(await select("staff_payroll_profiles", { select: "*", agent_user_id: `eq.${agentUserId}`, limit: 1 }));
}

async function ownLines(session, profile) {
  const agentUserId = text(session.profile?.agentUserId || session.profile?.id, 80);
  if (!agentUserId) return [];
  return select("staff_payroll_run_lines", {
    select: "*",
    agent_user_id: `eq.${agentUserId}`,
    order: "created_at.desc",
    limit: 100
  });
}

export async function getPayrollWorkspaceCore() {
  const session = await requirePayroll({ admin: false });
  const admin = canAdminPayroll(session);
  const selfProfile = await ownProfile(session);
  const selfLines = await ownLines(session, selfProfile);

  if (!admin) {
    return {
      ok: true,
      version: "BACKEND-BASE-1.0-B008",
      session: safeSession(session),
      mode: "EMPLOYEE",
      self: {
        profile: payrollProfileDto(selfProfile, { includeCompensation: false }),
        payslips: selfLines.map((row) => lineDto(row, { includeRates: false })).filter(Boolean)
      },
      admin: null,
      controls: {
        canEditProfile: false,
        canCreatePeriod: false,
        canCreateRun: false,
        canEditRunLines: false,
        canFinalizeRun: false,
        canManageAdjustments: false,
        canExportProviderFile: false
      }
    };
  }

  const [profiles, periods, runs, lines, adjustments, exports, countryRules, baseJurisdictions] = await Promise.all([
    select("staff_payroll_profiles", { select: "*", order: "display_name.asc", limit: 1000 }),
    select("staff_payroll_periods", { select: "*", order: "start_date.desc", limit: 300 }),
    select("staff_payroll_runs", { select: "*", order: "created_at.desc", limit: 300 }),
    select("staff_payroll_run_lines", { select: "*", order: "created_at.desc", limit: 5000 }),
    select("staff_payroll_adjustments", { select: "*", order: "created_at.desc", limit: 1000 }),
    select("staff_payroll_provider_exports", { select: "*", order: "created_at.desc", limit: 500 }),
    select("hr_country_rules", { select: "country_code,country_name,currency_code,employment_enabled,bank_scheme,required_payroll_fields,bank_fields,compliance_checks,active", active: "eq.true", order: "country_name.asc" }),
    select("hr_base_jurisdictions", { select: "base_code,country_code,region_code,payroll_region,legal_work_location,active", active: "eq.true", order: "base_code.asc" })
  ]);

  return {
    ok: true,
    version: "BACKEND-BASE-1.0-B008",
    session: safeSession(session),
    mode: "ADMIN",
    self: {
      profile: payrollProfileDto(selfProfile, { includeCompensation: false }),
      payslips: selfLines.map((row) => lineDto(row, { includeRates: false })).filter(Boolean)
    },
    admin: {
      profiles: profiles.map((row) => payrollProfileDto(row, { includeCompensation: true })).filter(Boolean),
      periods: periods.map(periodDto).filter(Boolean),
      runs: runs.map(runDto).filter(Boolean),
      lines: lines.map((row) => lineDto(row, { includeRates: true })).filter(Boolean),
      adjustments: adjustments.map(adjustmentDto).filter(Boolean),
      exports: exports.map(exportDto).filter(Boolean),
      countryRules,
      baseJurisdictions
    },
    controls: {
      canEditProfile: true,
      canCreatePeriod: true,
      canCreateRun: true,
      canEditRunLines: true,
      canFinalizeRun: true,
      canManageAdjustments: true,
      canExportProviderFile: true
    }
  };
}

async function resolveProfileTarget({ id = "", agentUserId = "", skId = "" } = {}) {
  const profileId = text(id, 80);
  if (profileId) return firstRow(await select("staff_payroll_profiles", { select: "*", id: `eq.${profileId}`, limit: 1 }));
  const agentId = text(agentUserId, 80);
  if (agentId) return firstRow(await select("staff_payroll_profiles", { select: "*", agent_user_id: `eq.${agentId}`, limit: 1 }));
  const cleanSkId = normalizeSkId(skId);
  if (cleanSkId) return firstRow(await select("staff_payroll_profiles", { select: "*", sk_id: `eq.${cleanSkId}`, limit: 1 }));
  return null;
}

async function agentForProfile(input = {}, existing = null) {
  const agentUserId = text(input.agentUserId || existing?.agent_user_id, 80);
  if (agentUserId) return firstRow(await select("agent_users", { select: "*", id: `eq.${agentUserId}`, limit: 1 }));
  const skId = normalizeSkId(input.skId || existing?.sk_id);
  if (skId) return firstRow(await select("agent_users", { select: "*", sk_id: `eq.${skId}`, limit: 1 }));
  return null;
}

async function derivedJurisdiction(agent) {
  const baseCode = upper(agent?.base_code, 80);
  if (!baseCode) throw new SkandiError("PAYROLL_EMPLOYEE_BASE_REQUIRED", "Employee base is required before Payroll setup.", { publicMessage: "Assign the employee's work location in SuccessFactors first." });
  const jurisdiction = firstRow(await select("hr_base_jurisdictions", { select: "*", base_code: `eq.${baseCode}`, active: "eq.true", limit: 1 }));
  if (!jurisdiction) throw new SkandiError("PAYROLL_JURISDICTION_MISSING", "Payroll jurisdiction is not configured for the employee base.");
  const countryRule = firstRow(await select("hr_country_rules", { select: "*", country_code: `eq.${upper(jurisdiction.country_code, 8)}`, active: "eq.true", employment_enabled: "eq.true", limit: 1 }));
  if (!countryRule) throw new SkandiError("PAYROLL_COUNTRY_NOT_ENABLED", "Payroll country is not enabled.");
  return { jurisdiction, countryRule };
}

export async function savePayrollEmployeeProfileCore(input = {}) {
  const session = await requirePayroll({ admin: true });
  const existing = await resolveProfileTarget(input);
  const agent = await agentForProfile(input, existing);
  if (!agent) throw new SkandiError("PAYROLL_EMPLOYEE_NOT_FOUND", "Employee identity not found.", { publicMessage: "Assign the employee in SuccessFactors before creating Payroll setup." });
  const { jurisdiction, countryRule } = await derivedJurisdiction(agent);
  const actorId = text(session.profile?.agentUserId || session.profile?.id, 80) || null;

  const employmentType = text(input.employmentType ?? existing?.employment_type, 80) || "employee";
  const allowedEmploymentTypes = stringArray(countryRule.employment_type_options).map((value) => value.toLowerCase());
  if (allowedEmploymentTypes.length && !allowedEmploymentTypes.includes(employmentType.toLowerCase())) {
    throw new SkandiError("PAYROLL_EMPLOYMENT_TYPE_INVALID", "Employment type is not approved for the employee country.");
  }

  const body = {
    staff_key: text(existing?.staff_key || input.staffKey || agent.sk_id || agent.id, 160),
    agent_user_id: agent.id,
    sk_id: normalizeSkId(agent.sk_id) || null,
    display_name: text(agent.preferred_name || agent.display_name || [agent.first_name, agent.last_name].filter(Boolean).join(" ") || agent.sk_id, 180),
    email: text(agent.corporate_email_address || agent.email, 320) || null,
    employment_type: employmentType,
    payroll_enabled: safeBoolean(input.payrollEnabled, existing ? existing.payroll_enabled !== false : true),
    currency: upper(countryRule.currency_code, 8),
    base_salary: Math.max(0, safeNumber(input.baseSalary, safeNumber(existing?.base_salary, 0))),
    hourly_rate: Math.max(0, safeNumber(input.hourlyRate, safeNumber(existing?.hourly_rate, 0))),
    standard_hours: Math.max(0, safeNumber(input.standardHours, safeNumber(existing?.standard_hours, 0))),
    tax_region: text(jurisdiction.payroll_region || jurisdiction.region_code || countryRule.country_code, 120),
    bank_status: text(input.bankStatus ?? existing?.bank_status, 80) || "not_verified",
    payroll_note: text(input.payrollNote ?? existing?.payroll_note, 2000) || null,
    updated_at: new Date().toISOString()
  };

  if (existing?.id) {
    await restRequest({ table: "staff_payroll_profiles", method: "PATCH", query: { id: `eq.${existing.id}` }, body });
  } else {
    await restRequest({ table: "staff_payroll_profiles", method: "POST", body: { ...body, created_by_agent_user_id: actorId } });
  }
  return getPayrollWorkspaceCore();
}

function dateOrder(startDate, endDate) {
  const start = Date.parse(`${startDate}T00:00:00Z`);
  const end = Date.parse(`${endDate}T00:00:00Z`);
  return Number.isFinite(start) && Number.isFinite(end) && start <= end;
}

export async function createPayrollPeriodCore(input = {}) {
  const session = await requirePayroll({ admin: true });
  const startDate = text(input.startDate, 32);
  const endDate = text(input.endDate, 32);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate) || !dateOrder(startDate, endDate)) {
    throw new SkandiError("PAYROLL_PERIOD_DATES_INVALID", "Payroll period dates are invalid.");
  }
  const currency = upper(input.currency, 8);
  if (!/^[A-Z]{3}$/.test(currency)) throw new SkandiError("PAYROLL_PERIOD_CURRENCY_INVALID", "Currency must be an ISO 4217 code.");
  const periodCode = text(input.periodCode, 100) || `${currency}-${startDate}-${endDate}`;
  const duplicate = firstRow(await select("staff_payroll_periods", { select: "id", period_code: `eq.${periodCode}`, limit: 1 }));
  if (duplicate) throw new SkandiError("PAYROLL_PERIOD_EXISTS", "Payroll period already exists.");

  await restRequest({
    table: "staff_payroll_periods",
    method: "POST",
    body: {
      period_code: periodCode,
      start_date: startDate,
      end_date: endDate,
      currency,
      status: "open",
      payload: {},
      created_by_agent_user_id: text(session.profile?.agentUserId || session.profile?.id, 80) || null
    }
  });
  return getPayrollWorkspaceCore();
}

export async function createPayrollRunFromPeriodCore({ periodId = "" } = {}) {
  const session = await requirePayroll({ admin: true });
  const id = text(periodId, 80);
  const period = firstRow(await select("staff_payroll_periods", { select: "*", id: `eq.${id}`, limit: 1 }));
  if (!period) throw new SkandiError("PAYROLL_PERIOD_NOT_FOUND", "Payroll period not found.");
  if (!["open", "draft"].includes(String(period.status || "").toLowerCase())) {
    throw new SkandiError("PAYROLL_PERIOD_NOT_OPEN", "Payroll run can only be created from an open period.");
  }
  const existing = firstRow(await select("staff_payroll_runs", { select: "id", payroll_period_id: `eq.${id}`, status: "neq.cancelled", limit: 1 }));
  if (existing) throw new SkandiError("PAYROLL_RUN_EXISTS", "A payroll run already exists for this period.");

  const profiles = await select("staff_payroll_profiles", {
    select: "*",
    payroll_enabled: "eq.true",
    currency: `eq.${upper(period.currency, 8)}`,
    order: "display_name.asc",
    limit: 2000
  });
  const runCode = `RUN-${text(period.period_code, 80)}-${Date.now()}`;
  const actorId = text(session.profile?.agentUserId || session.profile?.id, 80) || null;
  const run = firstRow(await restRequest({
    table: "staff_payroll_runs",
    method: "POST",
    body: {
      run_code: runCode,
      payroll_period_id: period.id,
      period_code: period.period_code,
      status: "draft",
      currency: period.currency,
      gross_total: 0,
      deductions_total: 0,
      net_total: 0,
      line_count: profiles.length,
      payload: { calculationMode: "EXPLICIT_LINE_AMOUNTS", automaticPayFormula: false },
      created_by_agent_user_id: actorId
    }
  }));
  if (!run?.id) throw new SkandiError("PAYROLL_RUN_CREATE_FAILED", "Payroll run was not created.");

  for (const profile of profiles) {
    await restRequest({
      table: "staff_payroll_run_lines",
      method: "POST",
      body: {
        payroll_run_id: run.id,
        staff_key: profile.staff_key,
        agent_user_id: profile.agent_user_id,
        sk_id: profile.sk_id,
        display_name: profile.display_name,
        currency: period.currency,
        base_salary: safeNumber(profile.base_salary, 0),
        hourly_rate: safeNumber(profile.hourly_rate, 0),
        hours: 0,
        earnings: 0,
        deductions: 0,
        net_pay: 0,
        status: "pending_amounts",
        payload: { sourceProfileId: profile.id, automaticPayFormula: false }
      }
    });
  }

  await restRequest({ table: "staff_payroll_periods", method: "PATCH", query: { id: `eq.${period.id}` }, body: { status: "processing", updated_at: new Date().toISOString() } });
  return getPayrollWorkspaceCore();
}

export async function savePayrollRunLineCore(input = {}) {
  await requirePayroll({ admin: true });
  const id = text(input.id, 80);
  const line = firstRow(await select("staff_payroll_run_lines", { select: "*", id: `eq.${id}`, limit: 1 }));
  if (!line) throw new SkandiError("PAYROLL_LINE_NOT_FOUND", "Payroll line not found.");
  const run = firstRow(await select("staff_payroll_runs", { select: "*", id: `eq.${line.payroll_run_id}`, limit: 1 }));
  if (!run || ["finalized", "sent", "closed"].includes(String(run.status || "").toLowerCase())) {
    throw new SkandiError("PAYROLL_RUN_LOCKED", "Finalized payroll run cannot be edited.");
  }

  const hours = Math.max(0, safeNumber(input.hours, safeNumber(line.hours, 0)));
  const earnings = Math.max(0, safeNumber(input.earnings, safeNumber(line.earnings, 0)));
  const deductions = Math.max(0, safeNumber(input.deductions, safeNumber(line.deductions, 0)));
  const netPay = Math.max(0, earnings - deductions);
  await restRequest({
    table: "staff_payroll_run_lines",
    method: "PATCH",
    query: { id: `eq.${id}` },
    body: {
      hours,
      earnings,
      deductions,
      net_pay: netPay,
      status: "calculated",
      updated_at: new Date().toISOString()
    }
  });
  return getPayrollWorkspaceCore();
}

export async function savePayrollAdjustmentCore(input = {}) {
  const session = await requirePayroll({ admin: true });
  const id = text(input.id, 80);
  const body = {
    adjustment_key: text(input.adjustmentKey, 160) || `ADJ-${Date.now()}`,
    payroll_run_id: text(input.payrollRunId, 80) || null,
    payroll_period_id: text(input.payrollPeriodId, 80) || null,
    staff_key: text(input.staffKey, 160) || null,
    agent_user_id: text(input.agentUserId, 80) || null,
    sk_id: normalizeSkId(input.skId) || null,
    adjustment_type: upper(input.adjustmentType || "OTHER", 80),
    amount: safeNumber(input.amount, 0),
    taxable: safeBoolean(input.taxable, true),
    reason: text(input.reason, 1000) || null,
    status: upper(input.status || "DRAFT", 40),
    updated_at: new Date().toISOString()
  };
  if (!body.staff_key && !body.agent_user_id && !body.sk_id) throw new SkandiError("PAYROLL_ADJUSTMENT_EMPLOYEE_REQUIRED", "Employee is required.");
  if (id) {
    await restRequest({ table: "staff_payroll_adjustments", method: "PATCH", query: { id: `eq.${id}` }, body });
  } else {
    await restRequest({ table: "staff_payroll_adjustments", method: "POST", body: { ...body, created_by_agent_user_id: text(session.profile?.agentUserId || session.profile?.id, 80) || null } });
  }
  return getPayrollWorkspaceCore();
}

export async function finalizePayrollRunCore({ runId = "" } = {}) {
  await requirePayroll({ admin: true });
  const id = text(runId, 80);
  const run = firstRow(await select("staff_payroll_runs", { select: "*", id: `eq.${id}`, limit: 1 }));
  if (!run) throw new SkandiError("PAYROLL_RUN_NOT_FOUND", "Payroll run not found.");
  if (["finalized", "sent", "closed"].includes(String(run.status || "").toLowerCase())) return getPayrollWorkspaceCore();
  const lines = await select("staff_payroll_run_lines", { select: "*", payroll_run_id: `eq.${id}`, limit: 5000 });
  if (!lines.length) throw new SkandiError("PAYROLL_RUN_HAS_NO_LINES", "Payroll run has no lines.");
  const incomplete = lines.filter((line) => String(line.status || "").toLowerCase() !== "calculated");
  if (incomplete.length) {
    throw new SkandiError("PAYROLL_RUN_LINES_INCOMPLETE", "All payroll lines must be explicitly calculated before finalization.", { publicMessage: `${incomplete.length} payroll line(s) still require amounts before finalization.` });
  }
  const gross = lines.reduce((sum, line) => sum + Math.max(0, safeNumber(line.earnings, 0)), 0);
  const deductions = lines.reduce((sum, line) => sum + Math.max(0, safeNumber(line.deductions, 0)), 0);
  const net = lines.reduce((sum, line) => sum + Math.max(0, safeNumber(line.net_pay, 0)), 0);
  const now = new Date().toISOString();
  await restRequest({
    table: "staff_payroll_runs",
    method: "PATCH",
    query: { id: `eq.${id}` },
    body: { status: "finalized", gross_total: gross, deductions_total: deductions, net_total: net, line_count: lines.length, calculated_at: now, finalized_at: now, updated_at: now }
  });
  if (run.payroll_period_id) {
    await restRequest({ table: "staff_payroll_periods", method: "PATCH", query: { id: `eq.${run.payroll_period_id}` }, body: { status: "finalized", updated_at: now } });
  }
  return getPayrollWorkspaceCore();
}

function csvCell(value) {
  const raw = String(value ?? "");
  return /[",\n\r]/.test(raw) ? `"${raw.replace(/"/g, '""')}"` : raw;
}

export async function createPayrollProviderExportCore({ runId = "", provider = "GUSTO" } = {}) {
  const session = await requirePayroll({ admin: true });
  const id = text(runId, 80);
  const run = firstRow(await select("staff_payroll_runs", { select: "*", id: `eq.${id}`, limit: 1 }));
  if (!run) throw new SkandiError("PAYROLL_RUN_NOT_FOUND", "Payroll run not found.");
  if (String(run.status || "").toLowerCase() !== "finalized") throw new SkandiError("PAYROLL_EXPORT_REQUIRES_FINALIZED_RUN", "Finalize the payroll run before export.");
  const lines = await select("staff_payroll_run_lines", { select: "*", payroll_run_id: `eq.${id}`, order: "display_name.asc", limit: 5000 });
  const columns = ["run_code","period_code","staff_key","sk_id","display_name","currency","hours","earnings","deductions","net_pay"];
  const csv = [columns.join(","), ...lines.map((line) => [
    run.run_code, run.period_code, line.staff_key, line.sk_id, line.display_name,
    line.currency, safeNumber(line.hours, 0), safeNumber(line.earnings, 0),
    safeNumber(line.deductions, 0), safeNumber(line.net_pay, 0)
  ].map(csvCell).join(","))].join("\r\n");
  const providerCode = upper(provider, 80) || "GUSTO";
  const exportKey = `EXP-${providerCode}-${Date.now()}`;
  const created = firstRow(await restRequest({
    table: "staff_payroll_provider_exports",
    method: "POST",
    body: {
      export_key: exportKey,
      payroll_run_id: run.id,
      provider: providerCode,
      status: "READY",
      provider_reference: null,
      csv_content: csv,
      payload: { generatedBy: "BACKEND-BASE-1.0-B008", transport: "MANUAL_FILE", externalApiCall: false },
      created_by_agent_user_id: text(session.profile?.agentUserId || session.profile?.id, 80) || null
    }
  }));
  return { ok: true, export: exportDto(created), csv, fileName: `skandi-payroll-${text(run.run_code, 100)}-${providerCode}.csv` };
}

export async function markPayrollProviderExportSentCore({ exportId = "", providerReference = "" } = {}) {
  await requirePayroll({ admin: true });
  const id = text(exportId, 80);
  const existing = firstRow(await select("staff_payroll_provider_exports", { select: "*", id: `eq.${id}`, limit: 1 }));
  if (!existing) throw new SkandiError("PAYROLL_EXPORT_NOT_FOUND", "Payroll export not found.");
  await restRequest({
    table: "staff_payroll_provider_exports",
    method: "PATCH",
    query: { id: `eq.${id}` },
    body: { status: "SENT", provider_reference: text(providerReference, 300) || null, updated_at: new Date().toISOString() }
  });
  return getPayrollWorkspaceCore();
}
