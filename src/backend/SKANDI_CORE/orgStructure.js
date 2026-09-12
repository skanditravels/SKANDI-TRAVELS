// /src/backend/SKANDI_CORE/orgStructure.js
// SKANDI Backend Base 1.0 — B-008
// Canonical SuccessFactors / Employee Central organization core.
//
// Authority boundary:
// - Organization/job/base/access catalog: org_* + hr_* tables.
// - Staff identity projection: agent_users.
// - Effective organization assignment: org_employee_assignments.
// - Payroll commercial controls NEVER live here.
// - This core may synchronize only derived payroll identity/jurisdiction fields
//   (currency/tax region) into staff_payroll_profiles after an HR assignment.

import { restRequest } from "backend/SKANDI_CORE/supabaseServer.js";
import { requireStaffPortalSessionCore } from "backend/SKANDI_CORE/staffAuth.js";
import { SkandiError, errorCode } from "backend/SKANDI_CORE/platformErrors.js";
import {
  firstRow,
  isoDateOnly,
  normalizeSkId,
  safeBoolean,
  stringArray,
  text,
  upper
} from "backend/SKANDI_CORE/platformValidation.js";

const RESTRICTED_ACCESS_ROLES = new Set(["SUPER_ADMIN", "OWNER", "COMPANY_OWNER"]);
const PRIVILEGED_ACCESS_ROLES = new Set(["SUPER_ADMIN", "OWNER", "COMPANY_OWNER"]);
const ACTIVE_EMPLOYMENT_BLOCK = new Set(["TERMINATED", "SUSPENDED", "FURLOUGHED", "INACTIVE"]);

function rows(value) {
  return Array.isArray(value) ? value : [];
}

async function select(table, query = {}) {
  return rows(await restRequest({ table, method: "GET", query, prefer: "" }));
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
    canManageHr: canManageHr(session),
    canAccessPayroll: session.canAccessPayroll === true,
    isPayrollAdmin: session.isPayrollAdmin === true
  };
}

function safeAgent(row = {}) {
  return {
    id: text(row.id, 80),
    skId: normalizeSkId(row.sk_id),
    firstName: text(row.first_name, 120),
    lastName: text(row.last_name, 120),
    preferredName: text(row.preferred_name, 120),
    displayName: text(row.preferred_name || row.display_name || [row.first_name, row.last_name].filter(Boolean).join(" ") || row.sk_id, 180),
    email: text(row.corporate_email_address || row.email, 320),
    badgePhotoUrl: text(row.badge_photo_url, 1500),
    employmentStatus: text(row.employment_status || row.status, 80),
    companyCode: text(row.company_code, 20),
    roleId: text(row.role_id, 80),
    jobCode: text(row.job_code, 80),
    jobTitle: text(row.job_title || row.position, 180),
    departmentId: text(row.department_id, 80),
    departmentCode: text(row.department_code, 40),
    department: text(row.department, 180),
    baseCode: upper(row.base_code, 80),
    base: text(row.base || row.station, 180),
    countryCode: upper(row.country_code, 8),
    managerAgentUserId: text(row.manager_agent_user_id, 80),
    managerRoleId: text(row.manager_role_id, 80),
    managerSkId: normalizeSkId(row.manager_sk_id),
    accessRole: upper(row.access_role || row.role, 80),
    permissionPreset: text(row.permission_preset, 100),
    active: row.active === true,
    authorized: row.authorized === true,
    portalAccess: row.portal_access === true
  };
}

function safeAssignment(row = {}) {
  if (!row || !row.id) return null;
  return {
    id: text(row.id, 80),
    agentUserId: text(row.agent_user_id, 80),
    companyCode: text(row.company_code, 20),
    roleId: text(row.role_id, 80),
    jobCode: text(row.job_code, 80),
    departmentId: text(row.department_id, 80),
    baseCode: upper(row.base_code, 80),
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

function safePayrollProfile(row = {}) {
  if (!row || !row.id) return null;
  // SuccessFactors receives only identity/jurisdiction/status fields.
  // Compensation and rate fields remain Payroll-only.
  return {
    id: text(row.id, 80),
    agentUserId: text(row.agent_user_id, 80),
    skId: normalizeSkId(row.sk_id),
    payrollEnabled: row.payroll_enabled === true,
    employmentType: text(row.employment_type, 80),
    currency: upper(row.currency, 8),
    taxRegion: text(row.tax_region, 120),
    bankStatus: text(row.bank_status, 80),
    updatedAt: text(row.updated_at, 80)
  };
}

async function findAgent({ agentUserId = "", skId = "" } = {}) {
  const byId = text(agentUserId, 80);
  if (byId) {
    return firstRow(await select("agent_users", { select: "*", id: `eq.${byId}`, limit: 1 }));
  }
  const bySkId = normalizeSkId(skId);
  if (bySkId) {
    return firstRow(await select("agent_users", { select: "*", sk_id: `eq.${bySkId}`, limit: 1 }));
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

async function payrollProfile(agentUserId) {
  return firstRow(await select("staff_payroll_profiles", {
    select: "*",
    agent_user_id: `eq.${text(agentUserId, 80)}`,
    limit: 1
  }));
}

async function loadCatalog() {
  const [departments, roles, bases, roleBaseRules, accessRoles, permissionPresets, countryRules, baseJurisdictions, roleRequirements] = await Promise.all([
    select("org_departments", { select: "*", active: "eq.true", order: "sort_order.asc,name.asc" }),
    select("org_job_roles", { select: "*", active: "eq.true", order: "sort_order.asc,title.asc" }),
    select("org_bases", { select: "*", active: "eq.true", order: "sort_order.asc,name.asc" }),
    select("org_role_base_rules", { select: "role_id,base_code,priority,active", active: "eq.true", order: "priority.asc" }),
    select("org_access_roles", { select: "access_role_code,purpose,preset_id,provisioning_rule,restricted,active", active: "eq.true", order: "access_role_code.asc" }),
    select("org_permission_presets", { select: "preset_id,name,description,permission_keys,allowed_apps,permission_groups,can_manage,can_access_payroll,is_hr,is_payroll_admin,is_system_admin,active", active: "eq.true", order: "preset_id.asc" }),
    select("hr_country_rules", { select: "country_code,country_name,currency_code,employment_enabled,bank_scheme,employment_type_options,required_hr_fields,required_payroll_fields,field_rules,bank_fields,compliance_checks,notes,active", active: "eq.true", order: "country_name.asc" }),
    select("hr_base_jurisdictions", { select: "base_code,country_code,region_code,payroll_region,legal_work_location,active", active: "eq.true", order: "base_code.asc" }),
    select("hr_role_requirements", { select: "role_id,required_hr_fields,required_payroll_fields,required_documents,field_rules,active", active: "eq.true", order: "role_id.asc" })
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
  const list = await select("agent_users", {
    select: "id,sk_id,first_name,last_name,preferred_name,display_name,corporate_email_address,email,badge_photo_url,employment_status,status,active,authorized,portal_access,company_code,role_id,job_code,job_title,position,department_id,department_code,department,base_code,base,station,country_code,manager_agent_user_id,manager_role_id,manager_sk_id,access_role,permission_preset",
    order: "last_name.asc,first_name.asc",
    limit: 1000
  });
  return list.map(safeAgent);
}

async function loadAssignmentsSummary() {
  const list = await select("org_employee_assignments", {
    select: "*",
    order: "updated_at.desc",
    limit: 1000
  });
  return list.map(safeAssignment).filter(Boolean);
}

export async function getOrgStructureBootstrapCore() {
  const session = await requireHr({ manage: false });
  const [catalog, staff, assignments] = await Promise.all([
    loadCatalog(),
    canManageHr(session) ? loadStaffSummary() : Promise.resolve([]),
    canManageHr(session) ? loadAssignmentsSummary() : Promise.resolve([])
  ]);

  return {
    ok: true,
    version: "BACKEND-BASE-1.0-B008",
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
    payrollAuthority: {
      owner: "PAYROLL",
      successFactorsCanEditCompensation: false,
      successFactorsCanEditRates: false,
      successFactorsCanCreatePeriods: false,
      successFactorsCanCreateRuns: false,
      successFactorsCanFinalizeRuns: false
    }
  };
}

export async function getEmployeeWorkspaceCore({ agentUserId = "", skId = "" } = {}) {
  const session = await requireStaffPortalSessionCore();
  const target = await findAgent({ agentUserId, skId });
  if (!target) throw new SkandiError("HR_EMPLOYEE_NOT_FOUND", "Employee not found.", { publicMessage: "Employee not found." });

  const self = text(session.profile?.agentUserId || session.profile?.id, 80) === text(target.id, 80);
  if (!self && !canReadHr(session)) {
    throw new SkandiError("HR_EMPLOYEE_ACCESS_DENIED", "Employee access denied.", { publicMessage: "You do not have permission to view this employee." });
  }

  const [assignment, payroll] = await Promise.all([
    currentAssignment(target.id),
    payrollProfile(target.id)
  ]);

  return {
    ok: true,
    employee: safeAgent(target),
    assignment: safeAssignment(assignment),
    payroll: safePayrollProfile(payroll),
    permissions: {
      canManageEmployee: canManageHr(session),
      canOpenPayroll: session.canAccessPayroll === true,
      isPayrollAdmin: session.isPayrollAdmin === true
    }
  };
}

async function validateAssignmentInput(input = {}) {
  const target = await findAgent({ agentUserId: input.agentUserId, skId: input.skId });
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
  const requestedManagerId = text(input.managerAgentUserId, 80);

  if (requestedManagerId) {
    manager = await findAgent({ agentUserId: requestedManagerId });
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

function payrollJurisdictionProjection(plan, existing = {}) {
  return {
    agent_user_id: plan.target.id,
    staff_key: text(existing.staff_key || plan.target.sk_id || plan.target.id, 160),
    sk_id: normalizeSkId(plan.target.sk_id) || null,
    display_name: text(plan.target.preferred_name || plan.target.display_name || [plan.target.first_name, plan.target.last_name].filter(Boolean).join(" ") || plan.target.sk_id, 180),
    email: text(plan.target.corporate_email_address || plan.target.email, 320) || null,
    employment_type: text(existing.employment_type, 80) || "employee",
    payroll_enabled: existing.payroll_enabled !== false,
    currency: upper(plan.countryRule.currency_code, 8) || upper(existing.currency, 8) || "USD",
    tax_region: text(plan.jurisdiction.payroll_region || plan.jurisdiction.region_code || plan.countryRule.country_code, 120),
    bank_status: text(existing.bank_status, 80) || "not_verified",
    updated_at: new Date().toISOString()
  };
}

async function tryCompensate({ newAssignmentId, oldAgent, oldPayroll, createdPayrollId, actorId }) {
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
  if (oldPayroll?.id) {
    try {
      await restRequest({
        table: "staff_payroll_profiles",
        method: "PATCH",
        query: { id: `eq.${oldPayroll.id}` },
        body: {
          currency: oldPayroll.currency,
          tax_region: oldPayroll.tax_region,
          display_name: oldPayroll.display_name,
          email: oldPayroll.email,
          employment_type: oldPayroll.employment_type,
          payroll_enabled: oldPayroll.payroll_enabled,
          bank_status: oldPayroll.bank_status,
          updated_at: new Date().toISOString()
        }
      });
    } catch (error) { failures.push(`payroll:${errorCode(error)}`); }
  } else if (createdPayrollId) {
    try {
      await restRequest({ table: "staff_payroll_profiles", method: "DELETE", query: { id: `eq.${createdPayrollId}` } });
    } catch (error) { failures.push(`payroll-delete:${errorCode(error)}`); }
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
        reason: "B-008 compensating rollback after partial SuccessFactors write"
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
  const oldPayroll = await payrollProfile(plan.target.id);
  const actorId = text(session.profile?.agentUserId || session.profile?.id, 80) || null;

  let newAssignment = null;
  let createdPayrollId = "";
  try {
    const inserted = await restRequest({
      table: "org_employee_assignments",
      method: "POST",
      body: {
        agent_user_id: plan.target.id,
        company_code: "SK01",
        role_id: plan.role.role_id,
        job_code: plan.role.job_code,
        department_id: plan.role.department_id,
        base_code: plan.base.code,
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

    const payrollBody = payrollJurisdictionProjection(plan, oldPayroll || {});
    if (oldPayroll?.id) {
      await restRequest({
        table: "staff_payroll_profiles",
        method: "PATCH",
        query: { id: `eq.${oldPayroll.id}` },
        body: payrollBody
      });
    } else {
      const created = firstRow(await restRequest({
        table: "staff_payroll_profiles",
        method: "POST",
        body: { ...payrollBody, created_by_agent_user_id: actorId }
      }));
      createdPayrollId = text(created?.id, 80);
    }

    // Only after the new assignment, identity projection and payroll jurisdiction mirror succeed
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
        agent_user_id: plan.target.id,
        actor_agent_user_id: actorId,
        action: "ASSIGNMENT_CHANGED",
        old_assignment: oldAssignment || {},
        new_assignment: newAssignment,
        reason: plan.reason
      }
    });

    return getEmployeeWorkspaceCore({ agentUserId: plan.target.id });
  } catch (error) {
    const failures = await tryCompensate({
      newAssignmentId: text(newAssignment?.id, 80),
      oldAgent,
      oldPayroll,
      createdPayrollId,
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
        select: "id,sk_id,first_name,last_name,preferred_name,display_name,corporate_email_address,email,badge_photo_url,employment_status,status,active,authorized,portal_access,company_code,role_id,job_code,job_title,position,department_id,department_code,department,base_code,base,station,country_code,manager_agent_user_id,manager_role_id,manager_sk_id,access_role,permission_preset",
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
