import { webMethod, Permissions } from "wix-web-module";
import { currentMember } from "wix-members-backend";
import { getSecret } from "wix-secrets-backend";
import { fetch } from "wix-fetch";

import {
  findAgentByMemberOrEmail,
  isAgentAuthorized
} from "backend/RIA/staffPortalAuth.repository.js";

const SUPABASE_URL_SECRET = "SUPABASE_URL";
const SUPABASE_SERVICE_ROLE_SECRET = "SUPABASE_SERVICE_ROLE_KEY";

let configCache = null;

async function getSupabaseConfig() {
  if (configCache?.url && configCache?.key) {
    return configCache;
  }

  const url = String(await getSecret(SUPABASE_URL_SECRET) || "").replace(/\/$/, "");
  const key = String(await getSecret(SUPABASE_SERVICE_ROLE_SECRET) || "").trim();

  if (!url || !key) {
    throw new Error("Supabase secrets are missing.");
  }

  configCache = { url, key };
  return configCache;
}

async function supabaseRequest(path, options = {}) {
  const { url, key } = await getSupabaseConfig();

  const response = await fetch(`${url}/rest/v1/${String(path).replace(/^\//, "")}`, {
    method: options.method || "GET",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(options.prefer ? { Prefer: options.prefer } : {}),
      ...(options.headers || {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const text = await response.text();
  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch (err) {
      data = text;
    }
  }

  if (!response.ok) {
    throw new Error(data?.message || data?.error || `Supabase request failed: ${response.status}`);
  }

  return data;
}

function cleanText(value, max = 255) {
  return String(value || "").trim().slice(0, max);
}

function cleanUpper(value, max = 40) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "")
    .slice(0, max);
}

function cleanDate(value) {
  const text = String(value || "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : "";
}

function money(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
}

function boolValue(value, fallback = true) {
  if (value === true || value === "true" || value === 1 || value === "1") return true;
  if (value === false || value === "false" || value === 0 || value === "0") return false;
  return fallback;
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ""));
}

function periodCodeFromDates(startDate, endDate) {
  if (startDate) return startDate.slice(0, 7);
  if (endDate) return endDate.slice(0, 7);
  return new Date().toISOString().slice(0, 7);
}

function runCodeForPeriod(periodCode) {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  return `PAY-${cleanUpper(periodCode, 20)}-${stamp}`;
}

function cleanError(error) {
  return error?.message || "Payroll request failed.";
}

async function requireStaffAgent() {
  const member = await currentMember.getMember().catch(() => null);

  if (!member) {
    throw new Error("Staff login required.");
  }

  const memberId = member._id || member.id || "";
  const email =
    member.loginEmail ||
    member.email ||
    member.contactDetails?.emails?.[0] ||
    "";

  const agent = await findAgentByMemberOrEmail({
    memberId,
    email
  });

  if (!agent || !isAgentAuthorized(agent)) {
    throw new Error("You are not authorized to access payroll.");
  }

  return { member, agent };
}

function profilePayload(input = {}, agent = {}) {
  const item = input.item || input.profile || input;

  const rawStaffKey =
    item.staffKey ||
    item.staff_key ||
    item._id ||
    item.id ||
    item.agentUserId ||
    item.agent_user_id ||
    item.skId ||
    item.skID ||
    item.sk_id;

  const staffKey = cleanText(rawStaffKey, 160);

  if (!staffKey) {
    throw new Error("Staff key is required for payroll profile.");
  }

  const agentUserIdCandidate =
    item.agentUserId ||
    item.agent_user_id ||
    item.agentId ||
    item.agent_id ||
    item._id ||
    item.id;

  return {
    staff_key: staffKey,
    agent_user_id: isUuid(agentUserIdCandidate) ? agentUserIdCandidate : null,

    sk_id: cleanUpper(item.skId || item.skID || item.sk_id, 80),
    display_name: cleanText(
      item.displayName ||
      item.display_name ||
      item.name ||
      [item.firstName || item.first_name, item.lastName || item.last_name].filter(Boolean).join(" "),
      240
    ),
    email: cleanText(item.email, 240),

    employment_type: cleanText(item.employmentType || item.employment_type || "employee", 80),
    payroll_enabled: boolValue(item.payrollEnabled ?? item.payroll_enabled, true),

    currency: cleanUpper(item.currency || "SEK", 3),
    base_salary: money(item.baseSalary ?? item.base_salary),
    hourly_rate: money(item.hourlyRate ?? item.hourly_rate),
    standard_hours: money(item.standardHours ?? item.standard_hours),

    tax_region: cleanText(item.taxRegion || item.tax_region, 120),
    bank_status: cleanText(item.bankStatus || item.bank_status || "not_verified", 80),
    payroll_note: cleanText(item.payrollNote || item.payroll_note || item.note, 1000),

    payload: item,
    created_by_agent_user_id: agent?.id || null
  };
}

function mapProfile(row = {}) {
  return {
    id: row.id || "",
    staffKey: row.staff_key || "",
    agentUserId: row.agent_user_id || "",
    skId: row.sk_id || "",
    displayName: row.display_name || "",
    email: row.email || "",
    employmentType: row.employment_type || "",
    payrollEnabled: Boolean(row.payroll_enabled),
    currency: row.currency || "SEK",
    baseSalary: row.base_salary || 0,
    hourlyRate: row.hourly_rate || 0,
    standardHours: row.standard_hours || 0,
    taxRegion: row.tax_region || "",
    bankStatus: row.bank_status || "",
    payrollNote: row.payroll_note || "",
    payload: row.payload || {},
    updatedAt: row.updated_at || ""
  };
}

function mapPeriod(row = {}) {
  return {
    id: row.id || "",
    periodCode: row.period_code || "",
    startDate: row.start_date || "",
    endDate: row.end_date || "",
    currency: row.currency || "SEK",
    status: row.status || "open",
    payload: row.payload || {},
    updatedAt: row.updated_at || ""
  };
}

function mapRun(row = {}) {
  return {
    id: row.id || "",
    runCode: row.run_code || "",
    payrollPeriodId: row.payroll_period_id || "",
    periodCode: row.period_code || "",
    status: row.status || "",
    currency: row.currency || "SEK",
    grossTotal: row.gross_total || 0,
    deductionsTotal: row.deductions_total || 0,
    netTotal: row.net_total || 0,
    lineCount: row.line_count || 0,
    calculatedAt: row.calculated_at || "",
    finalizedAt: row.finalized_at || "",
    payload: row.payload || {},
    updatedAt: row.updated_at || ""
  };
}

function mapLine(row = {}) {
  return {
    id: row.id || "",
    payrollRunId: row.payroll_run_id || "",
    staffKey: row.staff_key || "",
    agentUserId: row.agent_user_id || "",
    skId: row.sk_id || "",
    displayName: row.display_name || "",
    currency: row.currency || "SEK",
    baseSalary: row.base_salary || 0,
    hourlyRate: row.hourly_rate || 0,
    hours: row.hours || 0,
    earnings: row.earnings || 0,
    deductions: row.deductions || 0,
    netPay: row.net_pay || 0,
    status: row.status || "",
    payload: row.payload || {}
  };
}

async function insertPayrollAudit(eventType, payload = {}, agent = {}) {
  await supabaseRequest("master_inventory_audit", {
    method: "POST",
    body: {
      event_type: eventType,
      domain: "payroll",
      entity_table: cleanText(payload.entityTable || "staff_payroll", 120),
      entity_id: cleanText(payload.entityId || "", 160),
      product_key: cleanText(payload.productKey || payload.periodCode || "", 160),
      source: "postgres",
      message: cleanText(payload.message || eventType, 500),
      payload,
      created_by_agent_user_id: agent?.id || null,
      created_by_name: cleanText(agent?.display_name || agent?.displayName || agent?.email || agent?.sk_id || "", 180)
    },
    prefer: "return=minimal"
  }).catch(() => null);
}

export const savePayrollProfile = webMethod(
  Permissions.Anyone,
  async (input = {}) => {
    try {
      const { agent } = await requireStaffAgent();
      const row = profilePayload(input, agent);

      const result = await supabaseRequest("staff_payroll_profiles?on_conflict=staff_key", {
        method: "POST",
        body: row,
        prefer: "resolution=merge-duplicates,return=representation"
      });

      const saved = result?.[0] || null;

      await insertPayrollAudit("payroll_profile_saved", {
        entityTable: "staff_payroll_profiles",
        entityId: saved?.id || "",
        productKey: saved?.staff_key || "",
        message: "Payroll profile saved.",
        profile: saved
      }, agent);

      return {
        ok: true,
        profile: mapProfile(saved)
      };
    } catch (error) {
      throw new Error(cleanError(error));
    }
  }
);

export const createPayrollPeriod = webMethod(
  Permissions.Anyone,
  async (input = {}) => {
    try {
      const { agent } = await requireStaffAgent();

      const startDate = cleanDate(input.startDate || input.start_date);
      const endDate = cleanDate(input.endDate || input.end_date);

      if (!startDate || !endDate) {
        throw new Error("Payroll period start date and end date are required.");
      }

      const periodCode = cleanUpper(input.periodCode || input.period_code || periodCodeFromDates(startDate, endDate), 40);

      const result = await supabaseRequest("staff_payroll_periods?on_conflict=period_code", {
        method: "POST",
        body: {
          period_code: periodCode,
          start_date: startDate,
          end_date: endDate,
          currency: cleanUpper(input.currency || "SEK", 3),
          status: cleanText(input.status || "open", 40),
          payload: input,
          created_by_agent_user_id: agent?.id || null
        },
        prefer: "resolution=merge-duplicates,return=representation"
      });

      const saved = result?.[0] || null;

      await insertPayrollAudit("payroll_period_created", {
        entityTable: "staff_payroll_periods",
        entityId: saved?.id || "",
        productKey: periodCode,
        periodCode,
        message: "Payroll period created.",
        period: saved
      }, agent);

      return {
        ok: true,
        period: mapPeriod(saved)
      };
    } catch (error) {
      throw new Error(cleanError(error));
    }
  }
);

export const calculatePayrollRun = webMethod(
  Permissions.Anyone,
  async (input = {}) => {
    try {
      const { agent } = await requireStaffAgent();

      const periodCode = cleanUpper(input.periodCode || input.period_code, 40);

      if (!periodCode) {
        throw new Error("Payroll period code is required.");
      }

      const periodRows = await supabaseRequest(
        `staff_payroll_periods?period_code=eq.${encodeURIComponent(periodCode)}&select=*&limit=1`
      );

      const period = periodRows?.[0];

      if (!period) {
        throw new Error("Payroll period was not found.");
      }

      if (period.status === "finalized") {
        throw new Error("Payroll period is already finalized.");
      }

      const profiles = await supabaseRequest(
        "staff_payroll_profiles?payroll_enabled=eq.true&select=*&order=display_name.asc&limit=1000"
      );

      const hoursByStaffKey = input.hoursByStaffKey || input.hours || {};
      const deductionsByStaffKey = input.deductionsByStaffKey || input.deductions || {};

      const runCode = cleanUpper(input.runCode || input.run_code || runCodeForPeriod(periodCode), 80);

      const runRows = await supabaseRequest("staff_payroll_runs?on_conflict=run_code", {
        method: "POST",
        body: {
          run_code: runCode,
          payroll_period_id: period.id,
          period_code: periodCode,
          status: "calculated",
          currency: period.currency || "SEK",
          gross_total: 0,
          deductions_total: 0,
          net_total: 0,
          line_count: 0,
          calculated_at: new Date().toISOString(),
          payload: input,
          created_by_agent_user_id: agent?.id || null
        },
        prefer: "resolution=merge-duplicates,return=representation"
      });

      const run = runRows?.[0];

      await supabaseRequest(`staff_payroll_run_lines?payroll_run_id=eq.${encodeURIComponent(run.id)}`, {
        method: "DELETE",
        prefer: "return=minimal"
      });

      const lines = [];

      for (const profile of profiles || []) {
        const staffKey = profile.staff_key;
        const hours = money(hoursByStaffKey[staffKey] ?? profile.standard_hours ?? 0);
        const hourlyEarnings = money(profile.hourly_rate) * hours;
        const salaryEarnings = money(profile.base_salary);
        const earnings = money(salaryEarnings + hourlyEarnings);
        const deductions = money(deductionsByStaffKey[staffKey] || 0);
        const netPay = money(earnings - deductions);

        lines.push({
          payroll_run_id: run.id,
          staff_key: staffKey,
          agent_user_id: profile.agent_user_id || null,
          sk_id: profile.sk_id || "",
          display_name: profile.display_name || "",
          currency: profile.currency || period.currency || "SEK",
          base_salary: money(profile.base_salary),
          hourly_rate: money(profile.hourly_rate),
          hours,
          earnings,
          deductions,
          net_pay: netPay,
          status: "calculated",
          payload: {
            profileId: profile.id,
            periodCode,
            source: "staff_payroll_profiles"
          }
        });
      }

      let savedLines = [];

      if (lines.length) {
        savedLines = await supabaseRequest("staff_payroll_run_lines", {
          method: "POST",
          body: lines,
          prefer: "return=representation"
        });
      }

      const grossTotal = money(lines.reduce((sum, line) => sum + money(line.earnings), 0));
      const deductionsTotal = money(lines.reduce((sum, line) => sum + money(line.deductions), 0));
      const netTotal = money(lines.reduce((sum, line) => sum + money(line.net_pay), 0));

      const updatedRunRows = await supabaseRequest(`staff_payroll_runs?id=eq.${encodeURIComponent(run.id)}`, {
        method: "PATCH",
        body: {
          gross_total: grossTotal,
          deductions_total: deductionsTotal,
          net_total: netTotal,
          line_count: lines.length,
          status: "calculated",
          calculated_at: new Date().toISOString()
        },
        prefer: "return=representation"
      });

      const updatedRun = updatedRunRows?.[0] || run;

      await insertPayrollAudit("payroll_run_calculated", {
        entityTable: "staff_payroll_runs",
        entityId: updatedRun.id,
        productKey: periodCode,
        periodCode,
        runCode,
        message: "Payroll run calculated.",
        totals: {
          grossTotal,
          deductionsTotal,
          netTotal,
          lineCount: lines.length
        }
      }, agent);

      return {
        ok: true,
        run: mapRun(updatedRun),
        lines: (savedLines || []).map(mapLine)
      };
    } catch (error) {
      throw new Error(cleanError(error));
    }
  }
);

export const finalizePayrollRun = webMethod(
  Permissions.Anyone,
  async (input = {}) => {
    try {
      const { agent } = await requireStaffAgent();

      const runId = cleanText(input.runId || input.id, 160);
      const runCode = cleanUpper(input.runCode || input.run_code, 80);

      if (!runId && !runCode) {
        throw new Error("Payroll run ID or run code is required.");
      }

      const query = runId
        ? `staff_payroll_runs?id=eq.${encodeURIComponent(runId)}&select=*&limit=1`
        : `staff_payroll_runs?run_code=eq.${encodeURIComponent(runCode)}&select=*&limit=1`;

      const runRows = await supabaseRequest(query);
      const run = runRows?.[0];

      if (!run) {
        throw new Error("Payroll run was not found.");
      }

      if (run.status === "finalized") {
        return {
          ok: true,
          run: mapRun(run),
          alreadyFinalized: true
        };
      }

      const updatedRunRows = await supabaseRequest(`staff_payroll_runs?id=eq.${encodeURIComponent(run.id)}`, {
        method: "PATCH",
        body: {
          status: "finalized",
          finalized_at: new Date().toISOString()
        },
        prefer: "return=representation"
      });

      await supabaseRequest(`staff_payroll_run_lines?payroll_run_id=eq.${encodeURIComponent(run.id)}`, {
        method: "PATCH",
        body: {
          status: "finalized"
        },
        prefer: "return=minimal"
      });

      await supabaseRequest(`staff_payroll_periods?id=eq.${encodeURIComponent(run.payroll_period_id)}`, {
        method: "PATCH",
        body: {
          status: "finalized"
        },
        prefer: "return=minimal"
      });

      const updatedRun = updatedRunRows?.[0] || run;

      await insertPayrollAudit("payroll_run_finalized", {
        entityTable: "staff_payroll_runs",
        entityId: updatedRun.id,
        productKey: updatedRun.period_code,
        periodCode: updatedRun.period_code,
        runCode: updatedRun.run_code,
        message: "Payroll run finalized.",
        run: updatedRun
      }, agent);

      return {
        ok: true,
        run: mapRun(updatedRun)
      };
    } catch (error) {
      throw new Error(cleanError(error));
    }
  }
);
