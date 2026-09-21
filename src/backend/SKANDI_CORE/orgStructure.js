// /src/backend/SKANDI_CORE/orgStructure.js
// SKANDI Backend Base 1.0 — B-011.30
// Canonical SuccessFactors / Human Experience Management core.
//
// Authority boundary:
// - Organization/job/base/access catalog: org_* + hr_* tables.
// - Staff identity projection: agent_users.
// - Effective organization assignment: org_employee_assignments.
// - Payroll commercial controls NEVER live here.
// - Roster/schedule/Crew Control NEVER live here.
// - Recruiting, performance/learning profile data, badge control and employee/member onboarding are HR-owned here.
// - This core does not read or write staff_payroll_profiles. Payroll owns all payroll state.

import { restRequest } from "backend/SKANDI_CORE/supabaseServer";
import { requireStaffPortalSessionCore } from "backend/SKANDI_CORE/staffAuth";
import { members, authentication as memberAuthentication } from "@wix/members";
import { auth } from "@wix/essentials";
import { SkandiError, errorCode } from "backend/SKANDI_CORE/platformErrors";
import {
  firstRow,
  isoDateOnly,
  normalizeSkId,
  safeBoolean,
  stringArray,
  text,
  upper
} from "backend/SKANDI_CORE/platformValidation";

const RESTRICTED_ACCESS_ROLES = new Set(["SUPER_ADMIN", "OWNER", "COMPANY_OWNER"]);
const PRIVILEGED_ACCESS_ROLES = new Set(["SUPER_ADMIN", "OWNER", "COMPANY_OWNER"]);
const ACTIVE_EMPLOYMENT_BLOCK = new Set(["TERMINATED", "SUSPENDED", "FURLOUGHED", "INACTIVE"]);
const DEFAULT_ACCESS_ROLE = "READ_ONLY";
const DEFAULT_PERMISSION_PRESET = "read-only";
const CORPORATE_EMAIL_MAX = 320;

const elevatedCreateMember = auth.elevate(members.createMember);
const elevatedListMembers = auth.elevate(members.listMembers);
const elevatedUpdateMember = auth.elevate(members.updateMember);
const elevatedDeleteMember = auth.elevate(members.deleteMember);
const elevatedSendSetPasswordEmail = auth.elevate(memberAuthentication.sendSetPasswordEmail);

function rows(value) {
  return Array.isArray(value) ? value : [];
}

async function select(table, query = {}) {
  return rows(await restRequest({ table, method: "GET", query, prefer: "" }));
}

const SELECT_PAGE_SIZE = 500;

async function selectAllPaged(table, query = {}, { pageSize = SELECT_PAGE_SIZE, maxRows = 20000 } = {}) {
  const limit = Math.max(1, Math.min(Number(pageSize) || SELECT_PAGE_SIZE, 1000));
  const result = [];
  let offset = 0;

  while (result.length < maxRows) {
    const page = await select(table, {
      ...query,
      limit,
      offset
    });

    result.push(...page);
    if (page.length < limit) break;
    offset += page.length;
  }

  if (result.length >= maxRows) {
    throw new SkandiError("HR_CATALOG_TOO_LARGE", `SuccessFactors catalog exceeded ${maxRows} rows for ${table}.`, {
      publicMessage: "The SuccessFactors organization catalog is too large to load safely."
    });
  }

  return result;
}

function hasToken(values, candidates) {
  const source = new Set(stringArray(values).map((value) => String(value).trim().toLowerCase()));
  return candidates.some((candidate) => source.has(String(candidate).toLowerCase()));
}

function isPrivileged(session = {}) {
  return session.isSystemAdmin === true || PRIVILEGED_ACCESS_ROLES.has(upper(session.accessRole, 80));
}

function canReadHr(session = {}) {
  return isPrivileged(session) || session.isHr === true ||
    hasToken(session.allowedApps, ["successfactors", "hr", "employee-central"]) ||
    hasToken(session.permissionKeys, ["hr", "hr.read", "successfactors", "employee.read"]) ||
    hasToken(session.permissionGroups, ["hr", "hr-admin", "hr-manager", "system-admin"]);
}

function canManageHr(session = {}) {
  // isHr is derived from the permission preset, not from job title.
  return isPrivileged(session) || session.isHr === true ||
    hasToken(session.permissionKeys, ["hr.manage", "employee.manage", "organization.manage"]) ||
    hasToken(session.permissionGroups, ["hr-admin", "hr-manager", "system-admin"]);
}

function canReadRecruiting(session = {}) {
  return canReadHr(session) ||
    hasToken(session.allowedApps, ["recruiting", "careers", "careers-control"]) ||
    hasToken(session.permissionKeys, ["recruiting", "recruiting.read", "careers", "careers.read"]) ||
    hasToken(session.permissionGroups, ["recruiting", "recruiter", "talent-acquisition"]);
}

function canManageRecruiting(session = {}) {
  return canManageHr(session) ||
    hasToken(session.permissionKeys, ["recruiting.manage", "careers.manage"]) ||
    hasToken(session.permissionGroups, ["recruiting-admin", "recruiter", "talent-acquisition"]);
}

async function requireRecruiting({ manage = false } = {}) {
  const session = await requireStaffPortalSessionCore();
  const allowed = manage ? canManageRecruiting(session) : canReadRecruiting(session);
  if (!allowed) {
    throw new SkandiError(
      manage ? "RECRUITING_MANAGE_ACCESS_REQUIRED" : "RECRUITING_ACCESS_REQUIRED",
      "Recruiting access is required.",
      { publicMessage: "You do not have permission to use this Recruiting function." }
    );
  }
  return session;
}

async function requireHr({ manage = false } = {}) {
  const session = await requireStaffPortalSessionCore();
  const allowed = manage ? canManageHr(session) : canReadHr(session);
  if (!allowed) {
    throw new SkandiError(
      manage ? "HR_MANAGE_ACCESS_REQUIRED" : "HR_ACCESS_REQUIRED",
      "HR access is required.",
      { publicMessage: "You do not have permission to use this SuccessFactors function." }
    );
  }
  return session;
}

function safeSession(session = {}) {
  return {
    profile: session.profile || null,
    accessRole: text(session.accessRole, 80),
    permissionPreset: text(session.permissionPreset, 100),
    isHr: session.isHr === true,
    isSystemAdmin: session.isSystemAdmin === true,
    canReadHr: canReadHr(session),
    canManageHr: canManageHr(session),
    canReadRecruiting: canReadRecruiting(session),
    canManageRecruiting: canManageRecruiting(session)
  };
}

const EXTERNAL_OWNED_PROFILE_KEYS = new Set([
  "rosterGroup","scheduleGroup","monthlyClockedHours","currentMonthHours","rosterMonthlyHours","clockedHoursMonth",
  "approvedHours","monthlyApprovedHours","scheduledHours","monthlyScheduledHours","accumulatedOvertime","overtimeHours",
  "monthlyOvertimeHours","totalOvertimeHours","nightShiftPremiumHours","nightPremiumHours","monthlyNightHours","holidayHours",
  "monthlyHolidayHours","holidayPayMultiplier","holidayMultiplier","holidayPayRate","absenceHours","monthlyAbsenceHours",
  "lateMinutes","monthlyLateMinutes","missedPunchCount","monthlyMissedPunches","managerCorrectionRequired","timeCorrectionRequired",
  "clockedTimeStamps","lastClockEvents","timeClockLogs","myRosterLogs","lastRosterSyncAt","lastSyncedAt","annualLeaveHours",
  "vacationBalanceHours","personalLeaveHours","sickLeaveHours","holidayBalanceHours","unpaidLeaveHours","timeOffAsOfDate","asOfDate",
  "salaryAnnual","salary","annualSalary","baseSalary","hourlyBaseRate","hourlyRate","ratePerHour","hourlyBaseWageTier","wageTier",
  "currency","payCurrency","payFrequency","paySchedule","payGrade","grade","overtimeEligible","nightShiftEligible","holidayPayEligible",
  "taxWithholdingProfileStatus","taxWithholdingStatus","taxProfileStatus","skandiClubBalance","skandiClubPerkBalance","clubPerkBalance",
  "uniformAllowanceBalance","uniformBalance","payrollProvider","payrollProviderEmployeeId","payrollId","payrollNumber","paymentSetupStatus",
  "directDepositStatus","usDirectDepositStatus","sePayrollRoutingStatus","paymentMethod","bankName","usBankName","seBankName","accountType",
  "usAccountType","seClearingNumber","bankClearingNumber","clearingNumber","seAccountNumberLast4","bankAccountNumberLast4","accountNumberLast4",
  "usRoutingNumberLast4","routingLast4","routingNumberLast4","usAccountNumberLast4","accountLast4","lastPayrollSyncAt",
  "bankIban","bankBicSwift","bankAccountNumber","usRoutingNumber","usAccountNumber"
]);

const CORE_PROFILE_KEYS = new Set([
  "recordId","id","agentUserId","skId","skID","staffId","employeeId","employeeNumber","firstName","lastName","preferredName",
  "displayName","fullName","corporateEmail","corporateEmailAddress","email","workEmail","companyEmail","badgePhotoUrl","photoUrl","active",
  "status","employmentStatus","companyCode","roleId","jobCode","jobTitle","departmentId","departmentCode","assignedDepartment","department",
  "baseCode","assignedBase","base","station","countryCode","managerAgentUserId","managerRoleId","managerSkId","managerName","managerEmail",
  "accessRole","permissionPreset","permissionPresetId","effectiveFrom","reason","sendPasswordEmail"
]);

const SELF_PROFILE_KEYS = new Set([
  "preferredName","phone","personalMobile","mobilePhone","personalPhone","homeAddressStreet","homeAddressCity","homeAddressState",
  "homeAddressPostalCode","homeAddressCountry","emergencyContactName","emergencyContactRelationship","emergencyContactPhone"
]);

function primitiveProfileValue(value) {
  if (value === null || value === undefined) return undefined;
  if (["string","number","boolean"].includes(typeof value)) return typeof value === "string" ? text(value, 5000) : value;
  if (Array.isArray(value)) return value.slice(0, 100).map((item) => text(item, 500)).filter(Boolean);
  return undefined;
}

function hrProfilePatch(input = {}) {
  const out = {};
  for (const [key, value] of Object.entries(input || {})) {
    if (!/^[A-Za-z][A-Za-z0-9_]{0,80}$/.test(key)) continue;
    if (CORE_PROFILE_KEYS.has(key) || EXTERNAL_OWNED_PROFILE_KEYS.has(key)) continue;
    const clean = primitiveProfileValue(value);
    if (clean !== undefined) out[key] = clean;
  }
  return out;
}

function storedHrProfile(row = {}) {
  const payload = row?.payload && typeof row.payload === "object" ? row.payload : {};
  const sf = payload?.successFactors && typeof payload.successFactors === "object" ? payload.successFactors : {};
  return sf?.profile && typeof sf.profile === "object" ? sf.profile : {};
}

function mergedSuccessFactorsPayload(row = {}, patch = {}) {
  const payload = row?.payload && typeof row.payload === "object" ? { ...row.payload } : {};
  const sf = payload?.successFactors && typeof payload.successFactors === "object" ? { ...payload.successFactors } : {};
  sf.profile = { ...(sf.profile && typeof sf.profile === "object" ? sf.profile : {}), ...patch };
  payload.successFactors = sf;
  return payload;
}

function safeBadge(row = {}) {
  const payload = row?.payload && typeof row.payload === "object" ? row.payload : {};
  const badge = payload?.successFactors?.badge && typeof payload.successFactors.badge === "object"
    ? payload.successFactors.badge
    : {};
  return {
    staffId: text(badge.staffId || row.sk_id, 80),
    template: text(badge.template || "SKANDI_STANDARD", 80),
    status: upper(badge.status || "NOT_REQUESTED", 60),
    expiryDate: text(badge.expiryDate, 32),
    photoUrl: text(badge.photoUrl || row.badge_photo_url, 1500),
    lastPrintedAt: text(badge.lastPrintedAt, 80),
    updatedAt: text(badge.updatedAt, 80)
  };
}

function safeAgent(row = {}) {
  const stored = storedHrProfile(row);
  const agentUserUuid = text(row.id, 80);
  const agentId = normalizeSkId(row.agent_id || row.sk_id);
  return {
    ...stored,
    id: agentUserUuid,
    agentId,
    skId: agentId,
    agentUserUuid,
    agentUserId: agentUserUuid,
    firstName: text(row.first_name, 120),
    lastName: text(row.last_name, 120),
    preferredName: text(row.preferred_name, 120),
    displayName: text(row.preferred_name || row.display_name || [row.first_name, row.last_name].filter(Boolean).join(" ") || row.sk_id, 180),
    fullName: text(row.preferred_name || row.display_name || [row.first_name, row.last_name].filter(Boolean).join(" ") || row.sk_id, 180),
    email: text(row.corporate_email_address || row.email, 320),
    corporateEmail: text(row.corporate_email_address || row.email, 320),
    corporateEmailAddress: text(row.corporate_email_address || row.email, 320),
    wixMemberId: text(row.wix_member_id, 120),
    memberId: text(row.member_id, 120),
    contactId: text(row.contact_id, 120),
    badgePhotoUrl: text(row.badge_photo_url, 1500),
    badge: safeBadge(row),
    badgeStatus: safeBadge(row).status,
    badgeExpiryDate: safeBadge(row).expiryDate,
    employmentStatus: text(row.employment_status || row.status, 80),
    status: text(row.status, 80),
    companyCode: text(row.company_code, 20),
    roleId: text(row.role_id, 80),
    jobCode: text(row.job_code, 80),
    jobTitle: text(row.job_title || row.position, 180),
    departmentId: text(row.department_id, 80),
    departmentCode: text(row.department_code, 40),
    department: text(row.department, 180),
    assignedDepartment: text(row.department, 180),
    baseCode: upper(row.base_code, 80),
    base: text(row.base || row.station, 180),
    assignedBase: text(row.base || row.station, 180),
    station: text(row.station || row.base, 180),
    countryCode: upper(row.country_code, 8),
    managerAgentId: normalizeSkId(row.manager_agent_id),
    managerAgentUserUuid: text(row.manager_agent_user_id, 80),
    managerAgentUserId: text(row.manager_agent_user_id, 80),
    managerRoleId: text(row.manager_role_id, 80),
    managerSkId: normalizeSkId(row.manager_sk_id),
    accessRole: upper(row.access_role || row.role, 80),
    permissionPreset: text(row.permission_preset, 100),
    permissions: stringArray(row.permission_keys),
    allowedApps: stringArray(row.allowed_apps),
    permissionGroups: stringArray(row.permission_groups),
    active: row.active === true,
    authorized: row.authorized === true,
    portalAccess: row.portal_access === true
  };
}

function safeAssignment(row = {}) {
  if (!row || !row.id) return null;
  return {
    id: text(row.id, 80),
    agentId: normalizeSkId(row.agent_id),
    agentUserUuid: text(row.agent_user_id, 80),
    agentUserId: text(row.agent_user_id, 80),
    companyCode: text(row.company_code, 20),
    roleId: text(row.role_id, 80),
    jobCode: text(row.job_code, 80),
    departmentId: text(row.department_id, 80),
    baseCode: upper(row.base_code, 80),
    managerAgentId: normalizeSkId(row.manager_agent_id),
    managerAgentUserUuid: text(row.manager_agent_user_id, 80),
    managerAgentUserId: text(row.manager_agent_user_id, 80),
    managerRoleId: text(row.manager_role_id, 80),
    accessRole: upper(row.access_role, 80),
    permissionPresetId: text(row.permission_preset_id, 100),
    effectiveFrom: text(row.effective_from, 32),
    effectiveTo: text(row.effective_to, 32),
    active: row.active === true,
    source: text(row.source, 120),
    updatedAt: text(row.updated_at, 80)
  };
}

async function findAgent({ agentId = "", agentUserUuid = "", agentUserId = "", skId = "" } = {}) {
  const legacy = text(agentUserId, 80);
  const legacyAsAgentId = /^[A-Z]{2}\d{4}$/.test(normalizeSkId(legacy)) ? normalizeSkId(legacy) : "";
  const byAgentId = normalizeSkId(agentId || skId || legacyAsAgentId);
  if (byAgentId) {
    return firstRow(await select("agent_users", { select: "*", sk_id: `eq.${byAgentId}`, limit: 1 }));
  }
  const byUuid = text(agentUserUuid || (!legacyAsAgentId ? legacy : ""), 80);
  if (byUuid) {
    return firstRow(await select("agent_users", { select: "*", id: `eq.${byUuid}`, limit: 1 }));
  }
  return null;
}

async function currentAssignment(agentUserId) {
  const today = isoDateOnly();
  const list = await select("org_employee_assignments", {
    select: "*",
    agent_user_id: `eq.${text(agentUserId, 80)}`,
    active: "eq.true",
    effective_from: `lte.${today}`,
    or: `(effective_to.is.null,effective_to.gte.${today})`,
    order: "effective_from.desc",
    limit: 20
  });
  return list[0] || null;
}

async function loadCatalog() {
  const [departments, roles, bases, roleBaseRules, accessRoles, permissionPresets, countryRules, baseJurisdictions, roleRequirements] = await Promise.all([
    selectAllPaged("org_departments", { select: "*", active: "eq.true", order: "sort_order.asc,name.asc" }),
    selectAllPaged("org_job_roles", { select: "*", active: "eq.true", order: "sort_order.asc,title.asc" }),
    selectAllPaged("org_bases", { select: "*", active: "eq.true", order: "sort_order.asc,name.asc" }),
    selectAllPaged("org_role_base_rules", { select: "role_id,base_code,priority,active", active: "eq.true", order: "priority.asc,role_id.asc,base_code.asc" }),
    selectAllPaged("org_access_roles", { select: "access_role_code,purpose,preset_id,provisioning_rule,restricted,active", active: "eq.true", order: "access_role_code.asc" }),
    selectAllPaged("org_permission_presets", { select: "preset_id,name,description,permission_keys,allowed_apps,permission_groups,can_manage,can_access_payroll,can_access_grouptalk,is_hr,is_payroll_admin,is_system_admin,active", active: "eq.true", order: "preset_id.asc" }),
    selectAllPaged("hr_country_rules", { select: "country_code,country_name,currency_code,employment_enabled,bank_scheme,employment_type_options,required_hr_fields,required_payroll_fields,field_rules,bank_fields,compliance_checks,notes,active", active: "eq.true", order: "country_name.asc" }),
    selectAllPaged("hr_base_jurisdictions", { select: "base_code,country_code,region_code,payroll_region,legal_work_location,active", active: "eq.true", order: "base_code.asc" }),
    selectAllPaged("hr_role_requirements", { select: "role_id,required_hr_fields,required_payroll_fields,required_documents,field_rules,active", active: "eq.true", order: "role_id.asc" })
  ]);

  return {
    departments,
    roles,
    bases,
    roleBaseRules,
    accessRoles,
    permissionPresets,
    countryRules,
    baseJurisdictions,
    roleRequirements
  };
}

async function loadStaffSummary() {
  const list = await selectAllPaged("agent_users", {
    select: "id,agent_id,sk_id,first_name,last_name,preferred_name,display_name,corporate_email_address,email,wix_member_id,member_id,contact_id,badge_photo_url,employment_status,status,active,authorized,portal_access,company_code,role_id,job_code,job_title,position,department_id,department_code,department,base_code,base,station,country_code,manager_agent_user_id,manager_agent_id,manager_role_id,manager_sk_id,access_role,permission_preset,permission_keys,allowed_apps,permission_groups,payload",
    order: "last_name.asc,first_name.asc,sk_id.asc"
  });
  return list.map(safeAgent);
}

async function loadAssignmentsSummary() {
  const list = await selectAllPaged("org_employee_assignments", {
    select: "*",
    order: "updated_at.desc,id.asc"
  });
  return list.map(safeAssignment).filter(Boolean);
}

export async function getSuccessFactorsPortalBootstrapCore() {
  const session = await requireStaffPortalSessionCore();
  if (session?.authorized !== true || !session?.profile) {
    throw new SkandiError("STAFF_AUTH_REQUIRED", "Authenticated staff session required.", { publicMessage: "Sign in to RIAINTRA to open SuccessFactors." });
  }
  const profile = {
    ...session.profile,
    permissions: [...stringArray(session.permissionKeys)],
    permissionKeys: [...stringArray(session.permissionKeys)],
    allowedApps: [...stringArray(session.allowedApps)],
    permissionGroups: [...stringArray(session.permissionGroups)],
    successFactorsAccess: {
      fullHr: canReadHr(session),
      workforce: canReadHr(session),
      employee: canReadHr(session),
      organization: canReadHr(session),
      recruiting: canReadRecruiting(session),
      performance: canReadHr(session),
      badge: canManageHr(session),
      access: canReadHr(session)
    }
  };
  return {
    ok: true,
    version: "BACKEND-BASE-1.0-B011.30-SUCCESSFACTORS-V9",
    profile,
    apps: rows(session.apps),
    news: [],
    tasks: [],
    quickActions: [],
    notifications: [],
    favoriteApps: [],
    stats: {},
    hrAccess: { read: canReadHr(session), manage: canManageHr(session), recruiting: canReadRecruiting(session) }
  };
}

export async function getSuccessFactorsDirectoryCore({ query = "" } = {}) {
  await requireStaffPortalSessionCore();
  const staff = await loadStaffSummary();
  const needle = text(query, 180).toLowerCase();
  const items = staff.filter((item) => item.active !== false).filter((item) => !needle || [item.displayName,item.skId,item.jobTitle,item.department,item.baseCode,item.email].join(" ").toLowerCase().includes(needle));
  return {
    ok: true,
    items: items.slice(0, 500).map((item) => ({
      displayName: item.displayName,
      firstName: item.firstName,
      lastName: item.lastName,
      jobTitle: item.jobTitle,
      roleId: item.roleId,
      departmentId: item.departmentId,
      department: item.department,
      baseCode: item.baseCode,
      station: item.base,
      corporateEmailAddress: item.email,
      skId: item.skId
    }))
  };
}

export async function saveSuccessFactorsSelfProfileCore(input = {}) {
  const session = await requireStaffPortalSessionCore();
  const agentUserId = text(session.profile?.agentUserId || session.profile?.id, 80);
  const target = await findAgent({ agentUserId });
  if (!target) throw new SkandiError("HR_EMPLOYEE_NOT_FOUND", "Employee not found.");
  const patch = {};
  for (const key of SELF_PROFILE_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(input, key)) continue;
    const clean = primitiveProfileValue(input[key]);
    if (clean !== undefined) patch[key] = clean;
  }
  const body = { payload: mergedSuccessFactorsPayload(target, patch), updated_at: new Date().toISOString() };
  if (Object.prototype.hasOwnProperty.call(input, "preferredName")) {
    body.preferred_name = text(input.preferredName, 120) || null;
    body.display_name = body.preferred_name || [target.first_name,target.last_name].filter(Boolean).join(" ");
  }
  const saved = firstRow(await restRequest({ table: "agent_users", method: "PATCH", query: { id: `eq.${target.id}` }, body }));
  return { ok: true, profile: safeAgent(saved || { ...target, ...body }) };
}

export async function getOrgStructureBootstrapCore() {
  const session = await requireStaffPortalSessionCore();
  if (session?.authorized !== true || !session?.profile) {
    throw new SkandiError("STAFF_AUTH_REQUIRED", "Authenticated staff session required.", {
      publicMessage: "Sign in to RIAINTRA to open SuccessFactors."
    });
  }
  const hrRead = canReadHr(session);
  const hrManage = canManageHr(session);
  const emptyCatalog = {
    departments: [], roles: [], bases: [], roleBaseRules: [], accessRoles: [],
    permissionPresets: [], countryRules: [], baseJurisdictions: [], roleRequirements: []
  };
  const [catalog, staff, assignments] = await Promise.all([
    hrRead ? loadCatalog() : Promise.resolve(emptyCatalog),
    hrManage ? loadStaffSummary() : Promise.resolve([]),
    hrManage ? loadAssignmentsSummary() : Promise.resolve([])
  ]);

  return {
    ok: true,
    version: "BACKEND-BASE-1.0-B011.30-SUCCESSFACTORS",
    session: safeSession(session),
    catalog,
    staff,
    assignments,
    counts: {
      departments: catalog.departments.length,
      roles: catalog.roles.length,
      bases: catalog.bases.length,
      accessRoles: catalog.accessRoles.length,
      roleBaseRules: catalog.roleBaseRules.length,
      staff: staff.length,
      assignments: assignments.filter((item) => item?.active).length
    },
    boundaries: {
      payroll: "SEPARATE_APPLICATION",
      rosterSchedule: "SEPARATE_APPLICATION",
      recruiting: "SUCCESSFACTORS",
      badgeControl: "SUCCESSFACTORS",
      employeeMaster: "SUCCESSFACTORS"
    }
  };
}

export async function getEmployeeWorkspaceCore({ agentId = "", agentUserUuid = "", agentUserId = "", skId = "" } = {}) {
  const session = await requireStaffPortalSessionCore();
  const target = await findAgent({ agentId, agentUserUuid, agentUserId, skId });
  if (!target) throw new SkandiError("HR_EMPLOYEE_NOT_FOUND", "Employee not found.", { publicMessage: "Employee not found." });

  const self = text(session.profile?.agentUserId || session.profile?.id, 80) === text(target.id, 80);
  if (!self && !canReadHr(session)) {
    throw new SkandiError("HR_EMPLOYEE_ACCESS_DENIED", "Employee access denied.", { publicMessage: "You do not have permission to view this employee." });
  }

  const assignment = await currentAssignment(target.id);

  return {
    ok: true,
    employee: safeAgent(target),
    assignment: safeAssignment(assignment),
    permissions: {
      canManageEmployee: canManageHr(session)
    }
  };
}

async function validateAssignmentInput(input = {}) {
  const target = await findAgent({ agentId: input.agentId, agentUserUuid: input.agentUserUuid, agentUserId: input.agentUserId, skId: input.skId });
  if (!target) throw new SkandiError("HR_EMPLOYEE_NOT_FOUND", "Employee not found.");
  if (target.active !== true || ACTIVE_EMPLOYMENT_BLOCK.has(upper(target.employment_status || target.status, 80))) {
    throw new SkandiError("HR_EMPLOYEE_NOT_ACTIVE", "Employee is not active.", { publicMessage: "Organization assignment can only be changed for an active employee." });
  }

  const roleId = text(input.roleId, 80);
  const baseCode = upper(input.baseCode, 80);
  if (!roleId || !baseCode) throw new SkandiError("HR_ASSIGNMENT_ROLE_BASE_REQUIRED", "Role and base are required.");

  const [role, base, roleBase, jurisdiction] = await Promise.all([
    firstRow(await select("org_job_roles", { select: "*", role_id: `eq.${roleId}`, active: "eq.true", limit: 1 })),
    firstRow(await select("org_bases", { select: "*", code: `eq.${baseCode}`, active: "eq.true", limit: 1 })),
    firstRow(await select("org_role_base_rules", { select: "*", role_id: `eq.${roleId}`, base_code: `eq.${baseCode}`, active: "eq.true", limit: 1 })),
    firstRow(await select("hr_base_jurisdictions", { select: "*", base_code: `eq.${baseCode}`, active: "eq.true", limit: 1 }))
  ]);

  if (!role) throw new SkandiError("HR_ROLE_NOT_FOUND", "Role is not active.");
  if (!base) throw new SkandiError("HR_BASE_NOT_FOUND", "Base is not active.");
  if (!roleBase) throw new SkandiError("HR_ROLE_BASE_NOT_ALLOWED", "Role is not eligible for the selected base.", { publicMessage: "That position is not approved for the selected work location." });
  if (!jurisdiction) throw new SkandiError("HR_BASE_JURISDICTION_MISSING", "Base jurisdiction is not configured.");

  const countryCode = upper(input.countryCode || jurisdiction.country_code || base.country_code, 8);
  if (countryCode !== upper(jurisdiction.country_code || base.country_code, 8)) {
    throw new SkandiError("HR_COUNTRY_BASE_MISMATCH", "Country does not match selected base jurisdiction.");
  }

  const countryRule = firstRow(await select("hr_country_rules", {
    select: "*",
    country_code: `eq.${countryCode}`,
    active: "eq.true",
    employment_enabled: "eq.true",
    limit: 1
  }));
  if (!countryRule) throw new SkandiError("HR_COUNTRY_NOT_ENABLED", "Employment country is not enabled.");

  let accessRoleCode = upper(input.accessRole || role.default_access_role, 80);
  if (!accessRoleCode) throw new SkandiError("HR_ACCESS_ROLE_REQUIRED", "Access role is required.");
  const accessRole = firstRow(await select("org_access_roles", {
    select: "*",
    access_role_code: `eq.${accessRoleCode}`,
    active: "eq.true",
    limit: 1
  }));
  if (!accessRole) throw new SkandiError("HR_ACCESS_ROLE_INVALID", "Access role is not active.");
  if (accessRole.restricted === true || RESTRICTED_ACCESS_ROLES.has(accessRoleCode)) {
    throw new SkandiError(
      "HR_RESTRICTED_ACCESS_ROLE_SEPARATE_APPROVAL",
      "Restricted access role cannot be provisioned from SuccessFactors.",
      { publicMessage: "OWNER, COMPANY_OWNER and SUPER_ADMIN require the separate Identity & Access approval process." }
    );
  }

  const presetId = text(input.permissionPresetId || accessRole.preset_id || role.permission_preset_id, 100);
  const preset = firstRow(await select("org_permission_presets", {
    select: "*",
    preset_id: `eq.${presetId}`,
    active: "eq.true",
    limit: 1
  }));
  if (!preset) throw new SkandiError("HR_PERMISSION_PRESET_INVALID", "Permission preset is not active.");

  let manager = null;
  const expectedManagerRoleId = text(role.reports_to_role_id, 80);
  const requestedManagerId = text(input.managerAgentId || input.managerAgentUserId, 80);

  if (requestedManagerId) {
    manager = await findAgent({ agentId: input.managerAgentId, agentUserId: input.managerAgentUserId });
    if (!manager || manager.active !== true) throw new SkandiError("HR_MANAGER_INVALID", "Manager is not active.");
    const managerAssignment = await currentAssignment(manager.id);
    if (!managerAssignment || (expectedManagerRoleId && managerAssignment.role_id !== expectedManagerRoleId)) {
      throw new SkandiError("HR_MANAGER_ROLE_MISMATCH", "Selected manager does not hold the required reporting role.");
    }
  } else if (expectedManagerRoleId) {
    const candidates = await select("org_employee_assignments", {
      select: "agent_user_id,role_id,base_code,active,effective_from,effective_to",
      role_id: `eq.${expectedManagerRoleId}`,
      active: "eq.true",
      order: "effective_from.desc",
      limit: 200
    });
    const sameBase = candidates.filter((item) => upper(item.base_code, 80) === baseCode);
    const unique = sameBase.length === 1 ? sameBase[0] : (sameBase.length === 0 && candidates.length === 1 ? candidates[0] : null);
    if (unique) manager = await findAgent({ agentUserId: unique.agent_user_id });
    // If manager is not unique, leave unresolved instead of guessing.
  }

  return {
    target,
    role,
    base,
    countryRule,
    jurisdiction,
    accessRole,
    preset,
    accessRoleCode,
    presetId,
    manager,
    effectiveFrom: text(input.effectiveFrom, 32) || isoDateOnly(),
    reason: text(input.reason, 500) || "SuccessFactors organization assignment"
  };
}

function employeeProjection(plan) {
  return {
    company_code: "SK01",
    role_id: plan.role.role_id,
    job_code: plan.role.job_code,
    job_title: plan.role.title,
    position: plan.role.title,
    job_level: plan.role.level,
    department_id: plan.role.department_id,
    department_code: plan.role.department_code,
    department: plan.role.department_code,
    base_code: plan.base.code,
    base: plan.base.name,
    station: plan.base.name,
    country_code: plan.countryRule.country_code,
    manager_agent_user_id: plan.manager?.id || null,
    manager_role_id: plan.role.reports_to_role_id || null,
    manager_sk_id: plan.manager?.sk_id || null,
    manager_email: plan.manager?.corporate_email_address || plan.manager?.email || null,
    manager_name: plan.manager ? text(plan.manager.preferred_name || plan.manager.display_name || [plan.manager.first_name, plan.manager.last_name].filter(Boolean).join(" "), 180) : null,
    access_role: plan.accessRoleCode,
    permission_preset: plan.presetId,
    permission_keys: stringArray(plan.preset.permission_keys),
    allowed_apps: stringArray(plan.preset.allowed_apps),
    permission_groups: stringArray(plan.preset.permission_groups),
    can_manage: plan.preset.can_manage === true,
    can_access_payroll: plan.preset.can_access_payroll === true,
    can_access_grouptalk: plan.preset.can_access_grouptalk === true,
    org_assignment_source: "SUCCESSFACTORS",
    updated_at: new Date().toISOString()
  };
}

async function tryCompensate({ newAssignmentId, oldAgent, actorId }) {
  const failures = [];
  if (newAssignmentId) {
    try {
      await restRequest({ table: "org_employee_assignments", method: "PATCH", query: { id: `eq.${newAssignmentId}` }, body: { active: false, effective_to: isoDateOnly(), updated_at: new Date().toISOString() } });
    } catch (error) { failures.push(`assignment:${errorCode(error)}`); }
  }
  if (oldAgent?.id) {
    try {
      const restore = employeeProjection({
        role: { role_id: oldAgent.role_id, job_code: oldAgent.job_code, title: oldAgent.job_title, level: oldAgent.job_level, department_id: oldAgent.department_id, department_code: oldAgent.department_code, reports_to_role_id: oldAgent.manager_role_id },
        base: { code: oldAgent.base_code, name: oldAgent.base || oldAgent.station },
        countryRule: { country_code: oldAgent.country_code },
        manager: null,
        accessRoleCode: oldAgent.access_role,
        presetId: oldAgent.permission_preset,
        preset: { permission_keys: oldAgent.permission_keys, allowed_apps: oldAgent.allowed_apps, permission_groups: oldAgent.permission_groups, can_manage: oldAgent.can_manage, can_access_payroll: oldAgent.can_access_payroll, can_access_grouptalk: oldAgent.can_access_grouptalk }
      });
      restore.manager_agent_user_id = oldAgent.manager_agent_user_id || null;
      restore.manager_role_id = oldAgent.manager_role_id || null;
      restore.manager_sk_id = oldAgent.manager_sk_id || null;
      restore.manager_email = oldAgent.manager_email || null;
      restore.manager_name = oldAgent.manager_name || null;
      await restRequest({ table: "agent_users", method: "PATCH", query: { id: `eq.${oldAgent.id}` }, body: restore });
    } catch (error) { failures.push(`agent:${errorCode(error)}`); }
  }

  try {
    await restRequest({
      table: "org_assignment_audit",
      method: "POST",
      body: {
        agent_user_id: oldAgent?.id || null,
        actor_agent_user_id: actorId || null,
        action: "ASSIGNMENT_COMPENSATION",
        old_assignment: {},
        new_assignment: { failed_assignment_id: newAssignmentId, compensation_failures: failures },
        reason: "B-011.5 compensating rollback after partial SuccessFactors write"
      }
    });
  } catch (_) {}

  return failures;
}

export async function provisionStaffOrganizationCore(input = {}) {
  const session = await requireHr({ manage: true });
  const plan = await validateAssignmentInput(input);
  const oldAgent = { ...plan.target };
  const oldAssignment = await currentAssignment(plan.target.id);
  const actorId = text(session.profile?.agentUserId || session.profile?.id, 80) || null;

  let newAssignment = null;
  try {
    const inserted = await restRequest({
      table: "org_employee_assignments",
      method: "POST",
      body: {
        agent_id: plan.target.sk_id,
        agent_user_id: plan.target.id,
        company_code: "SK01",
        role_id: plan.role.role_id,
        job_code: plan.role.job_code,
        department_id: plan.role.department_id,
        base_code: plan.base.code,
        manager_agent_id: plan.manager?.sk_id || null,
        manager_agent_user_id: plan.manager?.id || null,
        manager_role_id: plan.role.reports_to_role_id || null,
        access_role: plan.accessRoleCode,
        permission_preset_id: plan.presetId,
        effective_from: plan.effectiveFrom,
        effective_to: null,
        active: true,
        source: "SUCCESSFACTORS",
        assigned_by_agent_user_id: actorId
      }
    });
    newAssignment = firstRow(inserted);
    if (!newAssignment?.id) throw new SkandiError("HR_ASSIGNMENT_INSERT_FAILED", "New assignment did not return an ID.");

    await restRequest({
      table: "agent_users",
      method: "PATCH",
      query: { id: `eq.${plan.target.id}` },
      body: employeeProjection(plan)
    });

    // Only after the new assignment and employee identity projection succeed
    // do we retire earlier active assignments.
    if (oldAssignment?.id && oldAssignment.id !== newAssignment.id) {
      await restRequest({
        table: "org_employee_assignments",
        method: "PATCH",
        query: { id: `eq.${oldAssignment.id}` },
        body: { active: false, effective_to: plan.effectiveFrom, updated_at: new Date().toISOString() }
      });
    }

    await restRequest({
      table: "org_assignment_audit",
      method: "POST",
      body: {
        agent_id: plan.target.sk_id,
        agent_user_id: plan.target.id,
        actor_agent_user_id: actorId,
        action: "ASSIGNMENT_CHANGED",
        old_assignment: oldAssignment || {},
        new_assignment: newAssignment,
        reason: plan.reason
      }
    });

    return getEmployeeWorkspaceCore({ agentId: plan.target.sk_id });
  } catch (error) {
    const failures = await tryCompensate({
      newAssignmentId: text(newAssignment?.id, 80),
      oldAgent,
      actorId
    });
    throw new SkandiError(
      "HR_ASSIGNMENT_WRITE_FAILED",
      "Organization assignment could not be completed.",
      {
        publicMessage: "The assignment was not completed. The system attempted to restore the prior employee state.",
        details: { cause: errorCode(error), compensationFailures: failures }
      }
    );
  }
}


function normalizeCorporateEmail(value) {
  const email = text(value, CORPORATE_EMAIL_MAX).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new SkandiError("HR_CORPORATE_EMAIL_INVALID", "Corporate email is invalid.", {
      publicMessage: "Enter a valid corporate email address."
    });
  }
  return email;
}

function memberItem(result) {
  return result?.member || result?.item || result || null;
}

function memberSummary(result) {
  const item = memberItem(result);
  if (!item) return null;
  return {
    id: text(item._id || item.id, 120),
    loginEmail: text(item.loginEmail, 320).toLowerCase(),
    status: text(item.status, 80),
    activityStatus: text(item.activityStatus, 80),
    contactId: text(item.contactId || item.contact?.contactId, 120),
    nickname: text(item.profile?.nickname, 180)
  };
}

async function findWixMemberByCorporateEmail(email) {
  const cleanEmail = normalizeCorporateEmail(email);
  const pageSize = 100;
  let offset = 0;

  // This lookup MUST be elevated. SuccessFactors creates PRIVATE members, and
  // ordinary SiteMember identity cannot reliably enumerate private members.
  for (let page = 0; page < 100; page += 1) {
    const result = await elevatedListMembers({
      fieldsets: ["FULL"],
      paging: { limit: pageSize, offset }
    });
    const items = rows(result?.members || result?.items || result?._items);
    const match = items.find((item) => text(item?.loginEmail, 320).toLowerCase() === cleanEmail);
    if (match) return match;

    const total = Number(result?.metadata?.total);
    offset += items.length;
    if (!items.length || items.length < pageSize || (Number.isFinite(total) && offset >= total)) break;
  }

  return null;
}

async function patchAgentMemberLink(agentUserId, member) {
  const snapshot = memberSummary(member);
  if (!snapshot?.id) throw new SkandiError("HR_WIX_MEMBER_ID_MISSING", "Wix member ID is missing.");
  const body = {
    wix_member_id: snapshot.id,
    member_id: snapshot.id,
    contact_id: snapshot.contactId || null,
    updated_at: new Date().toISOString()
  };
  const updated = firstRow(await restRequest({
    table: "agent_users",
    method: "PATCH",
    query: { id: `eq.${text(agentUserId, 80)}` },
    body
  }));
  return updated;
}

async function provisionWixMemberForAgent(agent, { sendPasswordEmail = true } = {}) {
  const email = normalizeCorporateEmail(agent.corporate_email_address || agent.email);
  let member = await findWixMemberByCorporateEmail(email);
  let created = false;
  let memberRecord = memberItem(member);

  if (!memberRecord) {
    try {
      member = await elevatedCreateMember({
        member: {
          loginEmail: email,
          privacyStatus: "PRIVATE",
          contact: {
            firstName: text(agent.first_name, 120),
            lastName: text(agent.last_name, 120),
            emails: [email],
            company: "SKANDI",
            jobTitle: text(agent.job_title || agent.position, 100)
          },
          profile: {
            nickname: text(agent.preferred_name || agent.display_name || [agent.first_name, agent.last_name].filter(Boolean).join(" ") || email, 180)
          }
        }
      });
      created = true;
      memberRecord = memberItem(member);
    } catch (error) {
      // If Wix reports a duplicate, resolve it again using the elevated member list.
      const retry = await findWixMemberByCorporateEmail(email);
      if (!retry) throw error;
      memberRecord = retry;
    }
  }

  const snapshot = memberSummary(memberRecord);
  if (!snapshot?.id) {
    throw new SkandiError("HR_WIX_MEMBER_ID_MISSING", "Wix Member creation did not return a member ID.", {
      publicMessage: "The Wix Member account could not be verified."
    });
  }
  if (snapshot.loginEmail && snapshot.loginEmail !== email) {
    throw new SkandiError("HR_WIX_MEMBER_EMAIL_MISMATCH", "Wix Member login email does not match the employee corporate email.", {
      publicMessage: "The Wix Member login email does not match the employee corporate email."
    });
  }

  let linked;
  try {
    linked = await patchAgentMemberLink(agent.id, memberRecord);
  } catch (error) {
    // Keep employee/member creation atomic. If we created the Wix Member in
    // this attempt and linking failed, remove that newly-created member.
    if (created && snapshot.id) {
      try {
        await elevatedDeleteMember(snapshot.id);
      } catch (cleanupError) {
        console.warn("[SuccessFactors] Wix member rollback failed", { code: errorCode(cleanupError), memberId: snapshot.id });
      }
    }
    throw error;
  }

  let passwordEmailSent = false;
  let passwordEmailError = "";
  if (sendPasswordEmail) {
    try {
      const response = await elevatedSendSetPasswordEmail(email, { hideIgnoreMessage: false });
      passwordEmailSent = response?.accepted !== false;
    } catch (error) {
      passwordEmailError = errorCode(error);
      console.warn("[SuccessFactors] Wix password email failed", { code: passwordEmailError });
    }
  }

  return {
    ok: true,
    created,
    linked: true,
    passwordEmailSent,
    passwordEmailError,
    member: snapshot,
    employee: safeAgent(linked || agent)
  };
}

async function uniqueSkId(prefix = "SK") {
  const cleanPrefix = upper(prefix, 2).replace(/[^A-Z]/g, "").padEnd(2, "S").slice(0, 2);
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const candidate = `${cleanPrefix}${String(Math.floor(1000 + Math.random() * 9000))}`;
    const exists = firstRow(await select("agent_users", { select: "id", sk_id: `eq.${candidate}`, limit: 1 }));
    if (!exists) return candidate;
  }
  throw new SkandiError("HR_SKID_GENERATION_FAILED", "Could not generate a unique SK-ID.", { publicMessage: "Could not generate a unique SK-ID. Try again." });
}

export async function generateEmployeeSkIdCore({ prefix = "SK" } = {}) {
  await requireHr({ manage: true });
  return { ok: true, skId: await uniqueSkId(prefix) };
}

export async function createEmployeeCore(input = {}) {
  const session = await requireHr({ manage: true });
  const actorId = text(session.profile?.agentUserId || session.profile?.id, 80) || null;
  const firstName = text(input.firstName, 120);
  const lastName = text(input.lastName, 120);
  const preferredName = text(input.preferredName, 120);
  const email = normalizeCorporateEmail(input.corporateEmail || input.corporateEmailAddress || input.workEmail || input.companyEmail || input.email);
  if (!firstName || !lastName) {
    throw new SkandiError("HR_EMPLOYEE_NAME_REQUIRED", "First and last name are required.", { publicMessage: "First name and last name are required." });
  }

  const duplicate = firstRow(await select("agent_users", {
    select: "id,sk_id,corporate_email_address,email",
    or: `(corporate_email_address.ilike.${email},email.ilike.${email})`,
    limit: 1
  }));
  if (duplicate) {
    throw new SkandiError("HR_EMPLOYEE_EMAIL_EXISTS", "Employee email already exists.", { publicMessage: "An employee already uses that corporate email." });
  }

  let skId = normalizeSkId(input.skId);
  if (skId && !/^[A-Z]{2}\d{4}$/.test(skId)) {
    throw new SkandiError("HR_SKID_INVALID", "SK-ID must use AA0000 format.", { publicMessage: "SK-ID must use the format AA0000." });
  }
  if (!skId) skId = await uniqueSkId(input.skIdPrefix || "SK");
  const skidDuplicate = firstRow(await select("agent_users", { select: "id", sk_id: `eq.${skId}`, limit: 1 }));
  if (skidDuplicate) throw new SkandiError("HR_SKID_EXISTS", "SK-ID already exists.", { publicMessage: "That SK-ID is already assigned." });

  const now = new Date().toISOString();
  const inserted = firstRow(await restRequest({
    table: "agent_users",
    method: "POST",
    body: {
      agent_id: skId,
      sk_id: skId,
      first_name: firstName,
      last_name: lastName,
      preferred_name: preferredName || null,
      display_name: preferredName || `${firstName} ${lastName}`,
      corporate_email_address: email,
      email,
      active: true,
      status: "ONBOARDING",
      employment_status: "ONBOARDING",
      portal_access: true,
      authorized: true,
      company_code: "SK01",
      access_role: DEFAULT_ACCESS_ROLE,
      permission_preset: DEFAULT_PERMISSION_PRESET,
      permission_keys: [],
      allowed_apps: [],
      permission_groups: [],
      can_manage: false,
      can_access_payroll: false,
      can_access_grouptalk: false,
      badge_photo_url: text(input.badgePhotoUrl || input.photoUrl, 1500) || null,
      payload: {
        successFactors: {
          createdByAgentUserId: actorId,
          createdAt: now,
          source: "SUCCESSFACTORS",
          badge: { staffId: skId, template: "SKANDI_STANDARD", status: "NOT_REQUESTED", photoUrl: text(input.badgePhotoUrl || input.photoUrl, 1500), updatedAt: now },
          profile: hrProfilePatch(input)
        }
      },
      updated_at: now
    }
  }));
  if (!inserted?.id) throw new SkandiError("HR_EMPLOYEE_CREATE_FAILED", "Employee row was not created.");

  let wixMember;
  try {
    wixMember = await provisionWixMemberForAgent(inserted, { sendPasswordEmail: input.sendPasswordEmail !== false });
    if (wixMember?.ok !== true || wixMember?.linked !== true || !wixMember?.member?.id) {
      throw new SkandiError("HR_WIX_MEMBER_PROVISION_INCOMPLETE", "Wix Member provisioning did not complete.");
    }
  } catch (error) {
    // SuccessFactors may not retain an employee that has no usable Wix Member
    // identity. Roll the employee projection back and surface one clear error.
    try {
      await restRequest({
        table: "agent_users",
        method: "DELETE",
        query: { id: `eq.${inserted.id}` },
        prefer: ""
      });
    } catch (cleanupError) {
      console.error("[SuccessFactors] Employee rollback failed after Wix Member provisioning error", {
        employeeId: inserted.id,
        code: errorCode(cleanupError)
      });
    }
    throw new SkandiError("HR_WIX_MEMBER_PROVISION_FAILED", "Employee creation was rolled back because Wix Member provisioning failed.", {
      publicMessage: "The employee was not created because the Wix Member account could not be created or linked."
    });
  }

  try {
    await restRequest({
      table: "org_assignment_audit",
      method: "POST",
      body: {
        agent_id: skId,
        agent_user_id: inserted.id,
        actor_agent_user_id: actorId,
        action: "EMPLOYEE_CREATED",
        old_assignment: {},
        new_assignment: { sk_id: skId, corporate_email_address: email, wix_member_id: wixMember.member.id },
        reason: "SuccessFactors employee creation"
      }
    });
  } catch (_) {}

  const finalAgent = await findAgent({ agentUserId: inserted.id });
  return { ok: true, employee: safeAgent(finalAgent || inserted), wixMember };
}

export async function updateEmployeeCore(input = {}) {
  await requireHr({ manage: true });
  const target = await findAgent({ agentId: input.agentId, agentUserUuid: input.agentUserUuid, agentUserId: input.agentUserId, skId: input.skId });
  if (!target) throw new SkandiError("HR_EMPLOYEE_NOT_FOUND", "Employee not found.");
  const body = { updated_at: new Date().toISOString() };
  if (input.firstName !== undefined) body.first_name = text(input.firstName, 120);
  if (input.lastName !== undefined) body.last_name = text(input.lastName, 120);
  if (input.preferredName !== undefined) body.preferred_name = text(input.preferredName, 120) || null;
  if (input.badgePhotoUrl !== undefined || input.photoUrl !== undefined) body.badge_photo_url = text(input.badgePhotoUrl || input.photoUrl, 1500) || null;
  if (input.corporateEmail !== undefined || input.corporateEmailAddress !== undefined || input.workEmail !== undefined || input.companyEmail !== undefined || input.email !== undefined) {
    const email = normalizeCorporateEmail(input.corporateEmail || input.corporateEmailAddress || input.workEmail || input.companyEmail || input.email);
    const linkedMemberId = text(target.wix_member_id || target.member_id, 120);
    if (linkedMemberId) {
      const currentEmail = normalizeCorporateEmail(target.corporate_email_address || target.email);
      if (email !== currentEmail) {
        throw new SkandiError("HR_WIX_LOGIN_EMAIL_IMMUTABLE", "A linked Wix Member login email cannot be changed.", {
          publicMessage: "Corporate email cannot be changed after the Wix Member account has been linked."
        });
      }
    }
    const duplicate = firstRow(await select("agent_users", { select: "id", or: `(corporate_email_address.ilike.${email},email.ilike.${email})`, limit: 2 }));
    if (duplicate && text(duplicate.id, 80) !== text(target.id, 80)) throw new SkandiError("HR_EMPLOYEE_EMAIL_EXISTS", "Corporate email already exists.");
    body.corporate_email_address = email;
    body.email = email;
  }
  const first = body.first_name ?? target.first_name;
  const last = body.last_name ?? target.last_name;
  const preferred = body.preferred_name ?? target.preferred_name;
  body.display_name = preferred || [first, last].filter(Boolean).join(" ");
  const profilePatch = hrProfilePatch(input);
  if (Object.keys(profilePatch).length) body.payload = mergedSuccessFactorsPayload(target, profilePatch);
  const saved = firstRow(await restRequest({ table: "agent_users", method: "PATCH", query: { id: `eq.${target.id}` }, body }));
  const effective = saved || { ...target, ...body };

  const linkedMemberId = text(effective.wix_member_id || effective.member_id, 120);
  let wixMemberSync = null;
  if (linkedMemberId) {
    try {
      const updatedMember = await elevatedUpdateMember(linkedMemberId, {
        contact: {
          firstName: text(effective.first_name, 120),
          lastName: text(effective.last_name, 120),
          company: "SKANDI",
          jobTitle: text(effective.job_title || effective.position, 100)
        },
        profile: {
          nickname: text(effective.preferred_name || effective.display_name || [effective.first_name, effective.last_name].filter(Boolean).join(" "), 180)
        }
      });
      wixMemberSync = { ok: true, member: memberSummary(updatedMember) };
    } catch (error) {
      wixMemberSync = { ok: false, code: errorCode(error), message: "Employee updated, but Wix Member profile synchronization needs retry." };
    }
  }

  return { ok: true, employee: safeAgent(effective), wixMemberSync };
}

export async function setEmployeeActiveCore({ agentId = "", agentUserUuid = "", agentUserId = "", skId = "", active = true } = {}) {
  const session = await requireHr({ manage: true });
  const target = await findAgent({ agentId, agentUserUuid, agentUserId, skId });
  if (!target) throw new SkandiError("HR_EMPLOYEE_NOT_FOUND", "Employee not found.");
  const selfId = text(session.profile?.agentUserId || session.profile?.id, 80);
  if (!active && selfId === text(target.id, 80)) throw new SkandiError("HR_SELF_DEACTIVATE_FORBIDDEN", "You cannot deactivate your own HR account.");
  const body = {
    active: active === true,
    employment_status: active === true ? "ACTIVE" : "INACTIVE",
    status: active === true ? "ACTIVE" : "INACTIVE",
    portal_access: active === true,
    authorized: active === true,
    updated_at: new Date().toISOString()
  };
  const saved = firstRow(await restRequest({ table: "agent_users", method: "PATCH", query: { id: `eq.${target.id}` }, body }));
  return { ok: true, employee: safeAgent(saved || { ...target, ...body }) };
}

export async function provisionEmployeeWixMemberCore({ agentId = "", agentUserUuid = "", agentUserId = "", skId = "", sendPasswordEmail = true } = {}) {
  await requireHr({ manage: true });
  const target = await findAgent({ agentId, agentUserUuid, agentUserId, skId });
  if (!target) throw new SkandiError("HR_EMPLOYEE_NOT_FOUND", "Employee not found.");
  return provisionWixMemberForAgent(target, { sendPasswordEmail });
}

export async function getBadgeControlCore({ query = "" } = {}) {
  await requireHr({ manage: true });
  const staff = await loadStaffSummary();
  const needle = text(query, 180).toLowerCase();
  const filtered = !needle ? staff : staff.filter((item) => [item.skId, item.displayName, item.email, item.jobTitle, item.baseCode].join(" ").toLowerCase().includes(needle));
  return { ok: true, items: filtered.map((item) => ({ ...item, badge: item.badge || {} })) };
}

export async function saveBadgeControlCore(input = {}) {
  const session = await requireHr({ manage: true });
  const target = await findAgent({ agentId: input.agentId, agentUserUuid: input.agentUserUuid, agentUserId: input.agentUserId, skId: input.skId });
  if (!target) throw new SkandiError("HR_EMPLOYEE_NOT_FOUND", "Employee not found.");
  const payload = target.payload && typeof target.payload === "object" ? { ...target.payload } : {};
  const sf = payload.successFactors && typeof payload.successFactors === "object" ? { ...payload.successFactors } : {};
  sf.badge = {
    ...(sf.badge && typeof sf.badge === "object" ? sf.badge : {}),
    staffId: text(input.staffId || target.sk_id, 80),
    template: text(input.template || "SKANDI_STANDARD", 80),
    status: upper(input.status || "REQUESTED", 60),
    expiryDate: text(input.expiryDate, 32) || null,
    photoUrl: text(input.photoUrl || target.badge_photo_url, 1500) || "",
    lastPrintedAt: input.markPrinted === true ? new Date().toISOString() : text(sf.badge?.lastPrintedAt, 80) || null,
    updatedAt: new Date().toISOString(),
    updatedByAgentUserId: text(session.profile?.agentUserId || session.profile?.id, 80) || null
  };
  payload.successFactors = sf;
  const body = {
    payload,
    badge_photo_url: text(input.photoUrl || target.badge_photo_url, 1500) || null,
    updated_at: new Date().toISOString()
  };
  const saved = firstRow(await restRequest({ table: "agent_users", method: "PATCH", query: { id: `eq.${target.id}` }, body }));
  return { ok: true, employee: safeAgent(saved || { ...target, ...body }), badge: sf.badge };
}

async function recruitingAudit(actorId, action, entityType, entityId, details = {}) {
  try {
    await restRequest({
      table: "career_audit_log",
      method: "POST",
      body: {
        action: text(action, 120),
        entity_id: text(entityId, 160),
        actor_agent_user_id: actorId || null,
        payload: { entityType: text(entityType, 80), ...(details && typeof details === "object" ? details : {}) },
        created_at: new Date().toISOString()
      }
    });
  } catch (_) {}
}

async function careerRows(table, order = "updated_at.desc", limit = 500) {
  return select(table, { select: "*", order, limit });
}

export async function getRecruitingBootstrapCore() {
  const session = await requireRecruiting({ manage: false });
  const canManage = canManageRecruiting(session);
  const [candidates, positions, interviews, documents, packets, history, gaps, vetting, training, onboarding, mailbox, maintenance, integrations, settingsRows, audit] = await Promise.all([
    careerRows("career_applicant_accounts"),
    careerRows("career_positions"),
    careerRows("career_interviews"),
    careerRows("career_documents"),
    careerRows("career_document_packets"),
    careerRows("career_candidate_history"),
    careerRows("career_history_gaps"),
    careerRows("career_sra_vetting"),
    careerRows("career_training_records"),
    careerRows("career_onboarding_tasks"),
    careerRows("career_mailbox_messages"),
    careerRows("career_maintenance_schedule"),
    careerRows("career_integration_snapshots"),
    careerRows("career_settings"),
    canManage ? careerRows("career_audit_log", "created_at.desc") : Promise.resolve([])
  ]);
  const normalizedAudit = audit.map((item) => ({ ...item, entity_type: text(item?.payload?.entityType, 80) }));
  const settingsRow = settingsRows.find((item) => text(item.setting_key, 120) === "successfactors-recruiting") || settingsRows[0] || {};
  const settings = settingsRow?.setting_value && typeof settingsRow.setting_value === "object"
    ? settingsRow.setting_value
    : (settingsRow?.payload && typeof settingsRow.payload === "object" ? settingsRow.payload : {});
  return {
    ok: true,
    canManage,
    candidates,
    applicants: candidates,
    positions,
    jobPostings: positions,
    interviews,
    documents,
    documentPackets: packets,
    history,
    historySegments: history,
    gaps,
    historyGaps: gaps,
    vetting,
    vettingCases: vetting,
    training,
    trainingRecords: training,
    onboarding,
    onboardingTasks: onboarding,
    mailbox,
    mailboxMessages: mailbox,
    maintenanceSchedule: maintenance,
    integrations,
    integrationSnapshots: integrations,
    settings,
    audit: normalizedAudit,
    auditEvents: normalizedAudit,
    counts: {
      candidates: candidates.length,
      activePositions: positions.filter((x) => x.active !== false).length,
      interviews: interviews.filter((x) => upper(x.status, 40) === "SCHEDULED").length,
      onboardingOpen: onboarding.filter((x) => upper(x.status, 40) !== "COMPLETE").length
    }
  };
}

function generateBusinessKey(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export async function saveRecruitingCandidateCore(input = {}) {
  const session = await requireRecruiting({ manage: true });
  const actorId = text(session.profile?.agentUserId || session.profile?.id, 80) || null;
  const id = text(input.id, 80);
  const applicantId = text(input.applicantId || input.candidateId, 120) || generateBusinessKey("CAND");
  const firstName = text(input.firstName, 120), lastName = text(input.lastName, 120), email = normalizeCorporateEmail(input.email);
  if (!firstName || !lastName) throw new SkandiError("RECRUITING_CANDIDATE_NAME_REQUIRED", "Candidate name is required.");
  const body = {
    applicant_id: applicantId,
    position_id: text(input.positionId || input.positionApplied, 120) || null,
    first_name: firstName,
    last_name: lastName,
    email,
    phone: text(input.phone, 80) || null,
    status: text(input.status || input.stage, 80) || "applied",
    resume_url: text(input.resumeUrl, 1500) || null,
    cover_letter_url: text(input.coverLetterUrl, 1500) || null,
    payload: { ...(input.payload && typeof input.payload === "object" ? input.payload : {}), positionApplied: text(input.positionApplied, 180) || undefined, location: text(input.location, 180) || undefined },
    updated_at: new Date().toISOString()
  };
  const saved = id
    ? firstRow(await restRequest({ table: "career_applicant_accounts", method: "PATCH", query: { id: `eq.${id}` }, body }))
    : firstRow(await restRequest({ table: "career_applicant_accounts", method: "POST", body }));
  await recruitingAudit(actorId, id ? "CANDIDATE_UPDATED" : "CANDIDATE_CREATED", "candidate", saved?.applicant_id || applicantId, { status: body.status, positionId: body.position_id });
  return { ok: true, candidate: saved || { id, ...body } };
}

export async function updateRecruitingCandidateStageCore({ id = "", status = "" } = {}) {
  const session = await requireRecruiting({ manage: true });
  const actorId = text(session.profile?.agentUserId || session.profile?.id, 80) || null;
  const cleanStatus = text(status, 80);
  if (!id || !cleanStatus) throw new SkandiError("RECRUITING_STAGE_INPUT_REQUIRED", "Candidate and status are required.");
  const saved = firstRow(await restRequest({ table: "career_applicant_accounts", method: "PATCH", query: { id: `eq.${text(id, 80)}` }, body: { status: cleanStatus, updated_at: new Date().toISOString() } }));
  await recruitingAudit(actorId, "CANDIDATE_STAGE_CHANGED", "candidate", saved?.applicant_id || id, { status: cleanStatus });
  return { ok: true, candidate: saved };
}

export async function saveRecruitingPositionCore(input = {}) {
  const session = await requireRecruiting({ manage: true });
  const actorId = text(session.profile?.agentUserId || session.profile?.id, 80) || null;
  const id = text(input.id, 80);
  const positionId = text(input.positionId, 120) || generateBusinessKey("JOB");
  const title = text(input.title, 180);
  if (!title) throw new SkandiError("RECRUITING_POSITION_TITLE_REQUIRED", "Position title is required.");
  const body = {
    position_id: positionId,
    title,
    department: text(input.department, 180) || null,
    location: text(input.location, 180) || null,
    employment_type: text(input.employmentType, 80) || null,
    salary_range: text(input.salaryRange, 120) || null,
    description: text(input.description, 5000) || null,
    active: input.active !== false && upper(input.status || "PUBLISHED", 40) !== "ARCHIVED",
    payload: input.payload && typeof input.payload === "object" ? input.payload : {},
    updated_at: new Date().toISOString()
  };
  const saved = id
    ? firstRow(await restRequest({ table: "career_positions", method: "PATCH", query: { id: `eq.${id}` }, body }))
    : firstRow(await restRequest({ table: "career_positions", method: "POST", body }));
  await recruitingAudit(actorId, id ? "POSITION_UPDATED" : "POSITION_CREATED", "position", saved?.position_id || positionId, { title, active: body.active });
  return { ok: true, position: saved || { id, ...body } };
}

export async function saveRecruitingInterviewCore(input = {}) {
  const session = await requireRecruiting({ manage: true });
  const actorId = text(session.profile?.agentUserId || session.profile?.id, 80) || null;
  const id = text(input.id, 80);
  const interviewId = text(input.interviewId, 120) || generateBusinessKey("INT");
  const candidateId = text(input.candidateId, 120);
  if (!candidateId) throw new SkandiError("RECRUITING_CANDIDATE_REQUIRED", "Candidate is required.");
  const body = {
    interview_id: interviewId,
    candidate_id: candidateId,
    interview_type: text(input.interviewType, 80) || "INTERVIEW",
    scheduled_at: text(input.scheduledAt, 80) || null,
    status: text(input.status, 80) || "SCHEDULED",
    owner_agent_user_id: actorId,
    payload: input.payload && typeof input.payload === "object" ? input.payload : {},
    updated_at: new Date().toISOString()
  };
  const saved = id
    ? firstRow(await restRequest({ table: "career_interviews", method: "PATCH", query: { id: `eq.${id}` }, body }))
    : firstRow(await restRequest({ table: "career_interviews", method: "POST", body }));
  await recruitingAudit(actorId, id ? "INTERVIEW_UPDATED" : "INTERVIEW_CREATED", "interview", saved?.interview_id || interviewId, { candidateId, status: body.status });
  return { ok: true, interview: saved || { id, ...body } };
}

export async function saveRecruitingVettingCore(input = {}) {
  const session = await requireRecruiting({ manage: true });
  const actorId = text(session.profile?.agentUserId || session.profile?.id, 80) || null;
  const id = text(input.id, 80);
  const vettingId = text(input.vettingId, 120) || generateBusinessKey("SRA");
  const candidateId = text(input.candidateId, 120);
  if (!candidateId) throw new SkandiError("RECRUITING_CANDIDATE_REQUIRED", "Candidate is required.");
  const body = {
    vetting_id: vettingId,
    candidate_id: candidateId,
    status: text(input.status, 80) || "STARTED",
    requested_by_agent_user_id: actorId,
    payload: input.payload && typeof input.payload === "object" ? input.payload : {},
    updated_at: new Date().toISOString()
  };
  const saved = id
    ? firstRow(await restRequest({ table: "career_sra_vetting", method: "PATCH", query: { id: `eq.${id}` }, body }))
    : firstRow(await restRequest({ table: "career_sra_vetting", method: "POST", body }));
  await recruitingAudit(actorId, id ? "VETTING_UPDATED" : "VETTING_STARTED", "vetting", saved?.vetting_id || vettingId, { candidateId, status: body.status });
  return { ok: true, vetting: saved || { id, ...body } };
}

export async function saveRecruitingOnboardingTaskCore(input = {}) {
  const session = await requireRecruiting({ manage: true });
  const actorId = text(session.profile?.agentUserId || session.profile?.id, 80) || null;
  const id = text(input.id, 80);
  const taskId = text(input.taskId, 120) || generateBusinessKey("ONB");
  const candidateId = text(input.candidateId, 120), taskName = text(input.taskName, 180);
  if (!candidateId || !taskName) throw new SkandiError("RECRUITING_ONBOARDING_INPUT_REQUIRED", "Candidate and task name are required.");
  const status = text(input.status, 80) || "OPEN";
  const body = {
    task_id: taskId,
    candidate_id: candidateId,
    task_name: taskName,
    status,
    due_at: text(input.dueAt, 80) || null,
    completed_at: upper(status, 40) === "COMPLETE" ? (text(input.completedAt, 80) || new Date().toISOString()) : null,
    owner_agent_user_id: actorId,
    payload: input.payload && typeof input.payload === "object" ? input.payload : {},
    updated_at: new Date().toISOString()
  };
  const saved = id
    ? firstRow(await restRequest({ table: "career_onboarding_tasks", method: "PATCH", query: { id: `eq.${id}` }, body }))
    : firstRow(await restRequest({ table: "career_onboarding_tasks", method: "POST", body }));
  await recruitingAudit(actorId, id ? "ONBOARDING_TASK_UPDATED" : "ONBOARDING_TASK_CREATED", "onboarding", saved?.task_id || taskId, { candidateId, status });
  return { ok: true, task: saved || { id, ...body } };
}

export async function saveRecruitingHistoryCore(input = {}) {
  const session = await requireRecruiting({ manage: true });
  const actorId = text(session.profile?.agentUserId || session.profile?.id, 80) || null;
  const id = text(input.id || input.historySegmentId || input.segmentId, 80);
  const candidateId = text(input.candidateId, 120);
  if (!candidateId) throw new SkandiError("RECRUITING_CANDIDATE_REQUIRED", "Candidate is required.");
  const body = {
    candidate_id: candidateId,
    start_date: text(input.startDate || input.start_date, 32) || null,
    end_date: text(input.endDate || input.end_date, 32) || null,
    verification_status: text(input.verificationStatus || input.status, 80) || "PENDING",
    payload: {
      employer: text(input.employer || input.organization, 240) || null,
      role: text(input.role || input.position, 180) || null,
      description: text(input.description, 3000) || null
    },
    updated_at: new Date().toISOString()
  };
  const saved = id
    ? firstRow(await restRequest({ table: "career_candidate_history", method: "PATCH", query: { id: `eq.${id}` }, body }))
    : firstRow(await restRequest({ table: "career_candidate_history", method: "POST", body }));
  await recruitingAudit(actorId, id ? "HISTORY_UPDATED" : "HISTORY_CREATED", "history", saved?.id || id || candidateId, { candidateId });
  return { ok: true, history: saved || { id, ...body } };
}

export async function verifyRecruitingHistoryCore({ historySegmentId = "", candidateId = "" } = {}) {
  const session = await requireRecruiting({ manage: true });
  const id = text(historySegmentId, 80);
  if (!id) throw new SkandiError("RECRUITING_HISTORY_ID_REQUIRED", "History segment is required.");
  const actorId = text(session.profile?.agentUserId || session.profile?.id, 80) || null;
  const saved = firstRow(await restRequest({ table: "career_candidate_history", method: "PATCH", query: { id: `eq.${id}` }, body: { verification_status: "VERIFIED", verified_by_agent_user_id: actorId, verified_at: new Date().toISOString(), updated_at: new Date().toISOString() } }));
  await recruitingAudit(actorId, "HISTORY_VERIFIED", "history", id, { candidateId });
  return { ok: true, history: saved };
}

export async function detectRecruitingHistoryGapsCore({ candidateId = "" } = {}) {
  const session = await requireRecruiting({ manage: true });
  const candidate = text(candidateId, 120);
  if (!candidate) throw new SkandiError("RECRUITING_CANDIDATE_REQUIRED", "Candidate is required.");
  const actorId = text(session.profile?.agentUserId || session.profile?.id, 80) || null;
  const history = await select("career_candidate_history", { select: "*", candidate_id: `eq.${candidate}`, order: "start_date.asc", limit: 100 });
  const valid = history.filter((row) => row.start_date).sort((a,b) => String(a.start_date).localeCompare(String(b.start_date)));
  const existing = await select("career_history_gaps", { select: "*", candidate_id: `eq.${candidate}`, limit: 100 });
  const wanted = [];
  const cutoff = new Date(); cutoff.setUTCFullYear(cutoff.getUTCFullYear() - 5);
  let cursor = cutoff.toISOString().slice(0,10);
  for (const segment of valid) {
    const start = String(segment.start_date || "").slice(0,10);
    if (start && start > cursor) wanted.push({ start, end: start, from: cursor, to: start, previous: null, next: segment.id });
    const end = String(segment.end_date || new Date().toISOString().slice(0,10)).slice(0,10);
    if (end > cursor) cursor = end;
  }
  const today = new Date().toISOString().slice(0,10);
  if (cursor < today) wanted.push({ from: cursor, to: today, previous: valid.at(-1)?.id || null, next: null });
  const created = [];
  for (const gap of wanted) {
    const start = new Date(`${gap.from}T00:00:00Z`), end = new Date(`${gap.to}T00:00:00Z`);
    const gapDays = Math.max(0, Math.round((end-start)/86400000));
    if (gapDays <= 30) continue;
    const key = `${candidate}:${gap.from}:${gap.to}`;
    const found = existing.find((row) => text(row.gap_key, 240) === key);
    if (found) { created.push(found); continue; }
    const row = firstRow(await restRequest({ table: "career_history_gaps", method: "POST", body: { gap_key: key, candidate_id: candidate, previous_history_id: gap.previous, next_history_id: gap.next, start_date: gap.from, end_date: gap.to, gap_days: gapDays, status: "OPEN", payload: {}, updated_at: new Date().toISOString() } }));
    if (row) created.push(row);
  }
  await recruitingAudit(actorId, "HISTORY_GAPS_DETECTED", "candidate", candidate, { gapCount: created.length });
  return { ok: true, gaps: created };
}

export async function resolveRecruitingGapCore({ gapId = "", candidateId = "", resolutionNote = "Reviewed by Recruiting" } = {}) {
  const session = await requireRecruiting({ manage: true });
  const id = text(gapId, 80);
  if (!id) throw new SkandiError("RECRUITING_GAP_ID_REQUIRED", "Gap is required.");
  const actorId = text(session.profile?.agentUserId || session.profile?.id, 80) || null;
  const saved = firstRow(await restRequest({ table: "career_history_gaps", method: "PATCH", query: { id: `eq.${id}` }, body: { status: "RESOLVED", resolved_by_agent_user_id: actorId, resolved_at: new Date().toISOString(), resolution_note: text(resolutionNote, 1000), updated_at: new Date().toISOString() } }));
  await recruitingAudit(actorId, "HISTORY_GAP_RESOLVED", "gap", id, { candidateId });
  return { ok: true, gap: saved };
}

export async function requestRecruitingDocumentCore({ candidateId = "", documentType = "GENERAL", title = "Requested document" } = {}) {
  const session = await requireRecruiting({ manage: true });
  const actorId = text(session.profile?.agentUserId || session.profile?.id, 80) || null;
  const candidate = text(candidateId, 120);
  if (!candidate) throw new SkandiError("RECRUITING_CANDIDATE_REQUIRED", "Candidate is required.");
  const documentId = generateBusinessKey("DOC");
  const saved = firstRow(await restRequest({ table: "career_documents", method: "POST", body: { document_id: documentId, candidate_id: candidate, document_type: text(documentType,120), title: text(title,240), file_url: null, verification_status: "REQUESTED", requested_by_agent_user_id: actorId, payload: {}, updated_at: new Date().toISOString() } }));
  await recruitingAudit(actorId, "DOCUMENT_REQUESTED", "document", documentId, { candidateId: candidate });
  return { ok: true, document: saved };
}

export async function verifyRecruitingDocumentCore({ documentId = "", candidateId = "" } = {}) {
  const session = await requireRecruiting({ manage: true });
  const actorId = text(session.profile?.agentUserId || session.profile?.id, 80) || null;
  const id = text(documentId, 80);
  if (!id) throw new SkandiError("RECRUITING_DOCUMENT_ID_REQUIRED", "Document is required.");
  const saved = firstRow(await restRequest({ table: "career_documents", method: "PATCH", query: { or: `(id.eq.${id},document_id.eq.${id})` }, body: { verification_status: "VERIFIED", verified_by_agent_user_id: actorId, verified_at: new Date().toISOString(), updated_at: new Date().toISOString() } }));
  await recruitingAudit(actorId, "DOCUMENT_VERIFIED", "document", id, { candidateId });
  return { ok: true, document: saved };
}

export async function createRecruitingDocumentPacketCore({ candidateId = "", email = "" } = {}) {
  const session = await requireRecruiting({ manage: true });
  const actorId = text(session.profile?.agentUserId || session.profile?.id, 80) || null;
  const candidate = text(candidateId, 120);
  if (!candidate) throw new SkandiError("RECRUITING_CANDIDATE_REQUIRED", "Candidate is required.");
  let targetEmail = text(email, 320);
  if (!targetEmail) {
    const applicant = firstRow(await select("career_applicant_accounts", { select: "email", or: `(id.eq.${candidate},applicant_id.eq.${candidate})`, limit: 1 }));
    targetEmail = text(applicant?.email, 320);
  }
  const packetId = generateBusinessKey("PACKET");
  const saved = firstRow(await restRequest({ table: "career_document_packets", method: "POST", body: { packet_id: packetId, candidate_id: candidate, email: targetEmail || null, status: "CREATED", resend_count: 0, created_by_agent_user_id: actorId, payload: {}, updated_at: new Date().toISOString() } }));
  await recruitingAudit(actorId, "DOCUMENT_PACKET_CREATED", "packet", packetId, { candidateId: candidate });
  return { ok: true, packet: saved };
}

export async function resendRecruitingDocumentPacketCore({ packetId = "" } = {}) {
  const session = await requireRecruiting({ manage: true });
  const actorId = text(session.profile?.agentUserId || session.profile?.id, 80) || null;
  const id = text(packetId, 120);
  const existing = firstRow(await select("career_document_packets", { select: "*", or: `(id.eq.${id},packet_id.eq.${id})`, limit: 1 }));
  if (!existing) throw new SkandiError("RECRUITING_PACKET_NOT_FOUND", "Document packet not found.");
  const saved = firstRow(await restRequest({ table: "career_document_packets", method: "PATCH", query: { id: `eq.${existing.id}` }, body: { status: "PENDING_SEND", resend_count: Number(existing.resend_count || 0) + 1, updated_at: new Date().toISOString() } }));
  await recruitingAudit(actorId, "DOCUMENT_PACKET_RESEND_QUEUED", "packet", existing.packet_id || id, {});
  return { ok: true, packet: saved, message: "Packet was queued for the configured external dispatcher." };
}

export async function publishRecruitingPositionCore({ item = {} } = {}) {
  const session = await requireRecruiting({ manage: true });
  const source = item && typeof item === "object" ? item : {};
  const id = text(source.id || source.jobPostingId || source.positionId, 80);
  if (!id) throw new SkandiError("RECRUITING_POSITION_ID_REQUIRED", "Position is required.");
  const existing = firstRow(await select("career_positions", { select: "*", or: `(id.eq.${id},position_id.eq.${id})`, limit: 1 }));
  if (!existing) throw new SkandiError("RECRUITING_POSITION_NOT_FOUND", "Position not found.");
  const payload = existing.payload && typeof existing.payload === "object" ? { ...existing.payload, status: "PUBLISHED", publishedAt: new Date().toISOString() } : { status: "PUBLISHED", publishedAt: new Date().toISOString() };
  const saved = firstRow(await restRequest({ table: "career_positions", method: "PATCH", query: { id: `eq.${existing.id}` }, body: { active: true, payload, updated_at: new Date().toISOString() } }));
  await recruitingAudit(text(session.profile?.agentUserId || session.profile?.id, 80) || null, "POSITION_PUBLISHED", "position", existing.position_id || id, {});
  return { ok: true, position: saved };
}

export async function duplicateRecruitingPositionCore({ jobPostingId = "" } = {}) {
  const session = await requireRecruiting({ manage: true });
  const id = text(jobPostingId, 120);
  const existing = firstRow(await select("career_positions", { select: "*", or: `(id.eq.${id},position_id.eq.${id})`, limit: 1 }));
  if (!existing) throw new SkandiError("RECRUITING_POSITION_NOT_FOUND", "Position not found.");
  const positionId = generateBusinessKey("JOB");
  const saved = firstRow(await restRequest({ table: "career_positions", method: "POST", body: { position_id: positionId, title: `${text(existing.title,170)} Copy`, department: existing.department, location: existing.location, employment_type: existing.employment_type, salary_range: existing.salary_range, description: existing.description, active: false, payload: { ...(existing.payload && typeof existing.payload === "object" ? existing.payload : {}), status: "DRAFT", duplicatedFrom: existing.position_id || existing.id }, updated_at: new Date().toISOString() } }));
  await recruitingAudit(text(session.profile?.agentUserId || session.profile?.id, 80) || null, "POSITION_DUPLICATED", "position", positionId, { source: existing.position_id || existing.id });
  return { ok: true, position: saved };
}

export async function saveRecruitingTrainingCore(input = {}) {
  const session = await requireRecruiting({ manage: true });
  const actorId = text(session.profile?.agentUserId || session.profile?.id, 80) || null;
  const id = text(input.id, 80), candidateId = text(input.candidateId, 120), course = text(input.course, 240);
  if (!candidateId || !course) throw new SkandiError("RECRUITING_TRAINING_INPUT_REQUIRED", "Candidate and course are required.");
  const trainingId = text(input.trainingRecordId,120) || generateBusinessKey("TRN");
  const body = { training_record_id: trainingId, candidate_id: candidateId, course, status: text(input.status,80) || "PENDING", valid_until: text(input.validUntil,32) || null, completed_at: text(input.completedAt,80) || null, owner_agent_user_id: actorId, payload: { notes: text(input.notes,3000) || null }, updated_at: new Date().toISOString() };
  const saved = id ? firstRow(await restRequest({ table:"career_training_records", method:"PATCH", query:{id:`eq.${id}`}, body })) : firstRow(await restRequest({ table:"career_training_records", method:"POST", body }));
  await recruitingAudit(actorId, id ? "TRAINING_UPDATED" : "TRAINING_CREATED", "training", saved?.training_record_id || trainingId, { candidateId });
  return { ok:true, training:saved };
}

export async function saveRecruitingSettingsCore(input = {}) {
  const session = await requireRecruiting({ manage: true });
  const actorId = text(session.profile?.agentUserId || session.profile?.id, 80) || null;
  const existing = firstRow(await select("career_settings", { select:"*", setting_key:"eq.successfactors-recruiting", limit:1 }));
  const settingValue = { defaultHub:text(input.defaultHub,180), careerSitePath:text(input.careerSitePath,300), documentPath:text(input.documentPath,300), mailboxMode:text(input.mailboxMode,80), notes:text(input.notes,3000) };
  const body = { setting_key:"successfactors-recruiting", setting_value:settingValue, payload:{ source:"SUCCESSFACTORS_V9" }, updated_by_agent_user_id:actorId, updated_at:new Date().toISOString() };
  const saved = existing ? firstRow(await restRequest({ table:"career_settings", method:"PATCH", query:{id:`eq.${existing.id}`}, body })) : firstRow(await restRequest({ table:"career_settings", method:"POST", body }));
  await recruitingAudit(actorId, "RECRUITING_SETTINGS_SAVED", "settings", "successfactors-recruiting", {});
  return { ok:true, settings:saved };
}

export async function testRecruitingIntegrationsCore() {
  const session = await requireRecruiting({ manage: true });
  const actorId = text(session.profile?.agentUserId || session.profile?.id, 80) || null;
  const key = generateBusinessKey("CHECK");
  const saved = firstRow(await restRequest({ table:"career_integration_snapshots", method:"POST", body:{ integration_key:key, status:"NOT_CONFIGURED", checked_at:new Date().toISOString(), payload:{ source:"SUCCESSFACTORS_V9", note:"No external Recruiting integration is claimed by B011.6." }, created_by_agent_user_id:actorId, updated_at:new Date().toISOString() } }));
  return { ok:true, snapshot:saved, message:"Integration status recorded. No external provider is configured in the canonical B011.6 source." };
}

export async function scheduleRecruitingMaintenanceCore(input = {}) {
  const session = await requireRecruiting({ manage: true });
  const actorId = text(session.profile?.agentUserId || session.profile?.id, 80) || null;
  const maintenanceId = generateBusinessKey("MAINT");
  const scheduledAt = text(input.scheduledAt,80) || new Date(Date.now()+3600000).toISOString();
  const saved = firstRow(await restRequest({ table:"career_maintenance_schedule", method:"POST", body:{ maintenance_id:maintenanceId, status:"SCHEDULED", scheduled_at:scheduledAt, requested_by_agent_user_id:actorId, payload:{ settings: input.settings && typeof input.settings === "object" ? input.settings : {}, source:text(input.source,80)||"SuccessFactors" }, updated_at:new Date().toISOString() } }));
  await recruitingAudit(actorId, "RECRUITING_MAINTENANCE_SCHEDULED", "maintenance", maintenanceId, { scheduledAt });
  return { ok:true, maintenance:saved };
}

export async function exportRecruitingAuditCore() {
  await requireRecruiting({ manage: true });
  const items = await careerRows("career_audit_log", "created_at.desc", 1000);
  return { ok:true, items, generatedAt:new Date().toISOString() };
}

export async function getManagerCandidatesCore({ roleId = "", baseCode = "" } = {}) {
  await requireHr({ manage: true });
  const role = firstRow(await select("org_job_roles", {
    select: "role_id,reports_to_role_id,reports_to_title",
    role_id: `eq.${text(roleId, 80)}`,
    active: "eq.true",
    limit: 1
  }));
  if (!role) throw new SkandiError("HR_ROLE_NOT_FOUND");
  const managerRoleId = text(role.reports_to_role_id, 80);
  if (!managerRoleId) return { ok: true, managerRoleId: "", candidates: [] };

  const assignments = await select("org_employee_assignments", {
    select: "agent_user_id,role_id,base_code,active,effective_from,effective_to",
    role_id: `eq.${managerRoleId}`,
    active: "eq.true",
    order: "effective_from.desc",
    limit: 500
  });
  const uniqueIds = [...new Set(assignments.map((item) => text(item.agent_user_id, 80)).filter(Boolean))].slice(0, 100);
  const agents = uniqueIds.length
    ? (await select("agent_users", {
        select: "id,sk_id,first_name,last_name,preferred_name,display_name,corporate_email_address,email,wix_member_id,member_id,contact_id,badge_photo_url,employment_status,status,active,authorized,portal_access,company_code,role_id,job_code,job_title,position,department_id,department_code,department,base_code,base,station,country_code,manager_agent_user_id,manager_role_id,manager_sk_id,access_role,permission_preset,permission_keys,allowed_apps,permission_groups,payload",
        id: `in.(${uniqueIds.join(",")})`,
        active: "eq.true",
        limit: 100
      }))
    : [];
  const assignmentByAgent = new Map(assignments.map((item) => [text(item.agent_user_id, 80), item]));
  const requestedBase = upper(baseCode, 80);
  const candidates = agents.map((agent) => {
    const assignment = assignmentByAgent.get(text(agent.id, 80)) || {};
    return {
      ...safeAgent(agent),
      managerRoleId,
      assignedBaseCode: upper(assignment.base_code, 80),
      sameBase: requestedBase ? upper(assignment.base_code, 80) === requestedBase : false
    };
  }).sort((a, b) => Number(b.sameBase) - Number(a.sameBase) || a.displayName.localeCompare(b.displayName));

  return { ok: true, managerRoleId, reportsToTitle: text(role.reports_to_title, 180), candidates };
}
