// backend/RIA/orgStructure.web.js
// SKANDI SuccessFactors V9 FINAL — live Supabase organization, atomic assignment core.
// Version 2026.09.10.9

import { webMethod, Permissions } from "wix-web-module";
import { currentMember } from "wix-members-backend";
import { secrets } from "wix-secrets-backend.v2";
import { elevate } from "wix-auth";
import { fetch } from "wix-fetch";

const COMPANY_CODE = "SK01";
const SMART_LOGIC_VERSION = "2026.09.10.9";
const ASSIGNMENT_RPC = "successfactors_apply_assignment_v9";
const elevatedGetSecretValue = elevate(secrets.getSecretValue);
let configurationPromise = null;

const safeText = (v, max = 300) => String(v ?? "").trim().slice(0, max);
const upper = (v, max = 300) => safeText(v, max).toUpperCase();
const array = v => Array.isArray(v) ? v : [];
const object = v => v && typeof v === "object" && !Array.isArray(v) ? v : {};
const enc = v => encodeURIComponent(String(v ?? ""));
const isUuid = v => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(v || ""));

function secretString(response) {
  if (typeof response === "string") return response.trim();
  return String(
    response?.value ??
    response?.secretValue ??
    response?.secret?.value ??
    ""
  ).trim();
}

async function getSecret(name) {
  const response = await elevatedGetSecretValue(name);
  const value = secretString(response);
  if (!value) throw new Error(`WIX_SECRET_EMPTY_${name}`);
  return value;
}

async function config() {
  if (configurationPromise) return configurationPromise;
  configurationPromise = (async () => {
    const url = await getSecret("SUPABASE_URL");
    let key = "";
    try {
      key = await getSecret("SUPABASE_SECRET_KEY");
    } catch (_) {
      key = await getSecret("SUPABASE_SERVICE_ROLE_KEY");
    }
    if (!/^https:\/\/[^/]+\.supabase\.co\/?$/i.test(url)) throw new Error("SUPABASE_URL_INVALID");
    if (!key) throw new Error("SUPABASE_SERVER_KEY_MISSING");
    return {
      url: url.replace(/\/+$/, ""),
      key,
      keyType: key.startsWith("eyJ") ? "legacy-jwt" : "api-key"
    };
  })();
  try {
    return await configurationPromise;
  } catch (error) {
    configurationPromise = null;
    throw error;
  }
}

function headersFor({ key, keyType, prefer }) {
  const headers = {
    apikey: key,
    Accept: "application/json",
    "Content-Type": "application/json"
  };
  if (keyType === "legacy-jwt") headers.Authorization = `Bearer ${key}`;
  if (prefer) headers.Prefer = prefer;
  return headers;
}

async function request(endpoint, { method = "GET", body, prefer = "return=representation" } = {}) {
  const { url, key, keyType } = await config();
  const response = await fetch(`${url}/rest/v1/${endpoint}`, {
    method,
    headers: headersFor({ key, keyType, prefer }),
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  });
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (_) { data = text; }
  if (!response.ok) {
    const code = safeText(data?.code, 80);
    const detail = safeText(data?.message || data?.details || "", 240);
    console.error("[SuccessFactors V9] System request failed", {
      status: response.status,
      endpoint: safeText(endpoint, 180),
      code,
      detail
    });
    const error = new Error(`SUCCESSFACTORS_DATA_${response.status}${code ? `_${code}` : ""}`);
    error.status = response.status;
    error.code = code || "SUCCESSFACTORS_DATA_ERROR";
    throw error;
  }
  return data;
}

const sb = (path, options = {}) => request(path, options);
const rpc = (name, body) => request(`rpc/${name}`, { method: "POST", body, prefer: "return=representation" });

function permissionTokens(agent = {}) {
  const p = object(agent.payload);
  const values = [
    agent.permission_keys, agent.allowed_apps, agent.permission_groups,
    p.permissions, p.permissionKeys, p.allowedApps, p.permissionGroups,
    p.roles, p.accessRole, agent.access_role
  ];
  return values
    .flatMap(v => Array.isArray(v) ? v : (v ? [v] : []))
    .map(v => String(v).trim().toLowerCase())
    .filter(Boolean);
}

async function requireOrgAdmin() {
  const member = await currentMember.getMember().catch(() => null);
  const memberId = member?._id || member?.id || "";
  if (!memberId) throw new Error("STAFF_AUTH_REQUIRED");
  const rows = await sb(`agent_users?select=*&or=(wix_member_id.eq.${enc(memberId)},member_id.eq.${enc(memberId)})&limit=1`);
  const agent = array(rows)[0];
  if (!agent || agent.active === false || agent.portal_access === false || agent.authorized === false) {
    throw new Error("STAFF_ACCESS_DENIED");
  }
  const tokens = permissionTokens(agent);
  const privileged = agent.can_manage === true || tokens.some(x =>
    ["hr", "hr_admin", "hr_manager", "super_admin", "owner", "company_owner", "all"].includes(x)
  );
  if (!privileged) throw new Error("HR_ORG_ADMIN_REQUIRED");
  return agent;
}

function countryView(rule = {}) {
  return {
    country_code: upper(rule.country_code, 2),
    country_name: safeText(rule.country_name, 120),
    currency_code: upper(rule.currency_code, 3),
    employment_enabled: rule.employment_enabled === true,
    bank_scheme: safeText(rule.bank_scheme, 80),
    employment_type_options: array(rule.employment_type_options),
    required_hr_fields: array(rule.required_hr_fields),
    required_payroll_fields: array(rule.required_payroll_fields),
    field_rules: object(rule.field_rules),
    bank_fields: array(rule.bank_fields),
    compliance_checks: object(rule.compliance_checks),
    source_links: array(rule.source_links),
    source_checked_at: rule.source_checked_at || null,
    notes: safeText(rule.notes, 1000),
    active: rule.active !== false
  };
}

function publicCatalog({ departments, bases, roles, accessRoles, presets, roleBaseRules, audit, countryRules, baseJurisdictions, roleRequirements }) {
  const enabledCountrySet = new Set(
    array(countryRules).filter(r => r.employment_enabled === true).map(r => upper(r.country_code, 2))
  );
  const countries = array(countryRules)
    .filter(r => r.employment_enabled === true)
    .map(countryView)
    .sort((a, b) => a.country_name.localeCompare(b.country_name));
  return {
    ok: true,
    companyCode: COMPANY_CODE,
    departments: array(departments),
    bases: array(bases),
    roles: array(roles),
    accessRoles: array(accessRoles),
    permissionPresets: array(presets),
    roleBaseRules: array(roleBaseRules),
    audit: array(audit),
    countries,
    countryRules: array(countryRules).map(countryView),
    baseJurisdictions: array(baseJurisdictions),
    roleRequirements: array(roleRequirements),
    activeEmploymentCountries: [...enabledCountrySet].sort(),
    smartLogicVersion: SMART_LOGIC_VERSION
  };
}

export const getOrgStructureBootstrap = webMethod(Permissions.SiteMember, async () => {
  await requireOrgAdmin();
  const [departments, bases, roles, accessRoles, presets, roleBaseRules, audit, countryRules, baseJurisdictions, roleRequirements] = await Promise.all([
    sb("org_departments?select=*&active=eq.true&order=sort_order.asc,code.asc"),
    sb("org_bases?select=*&active=eq.true&order=sort_order.asc,code.asc"),
    sb("org_job_roles?select=*&active=eq.true&order=department_code.asc,title.asc"),
    sb("org_access_roles?select=*&active=eq.true&order=access_role_code.asc"),
    sb("org_permission_presets?select=*&active=eq.true&order=preset_id.asc"),
    sb("org_role_base_rules?select=*&active=eq.true&order=priority.asc"),
    sb("org_assignment_audit?select=id,agent_user_id,actor_agent_user_id,action,old_assignment,new_assignment,reason,created_at&order=created_at.desc&limit=100"),
    sb("hr_country_rules?select=*&active=eq.true&order=country_name.asc"),
    sb("hr_base_jurisdictions?select=*&active=eq.true&order=base_code.asc"),
    sb("hr_role_requirements?select=*&active=eq.true&order=role_id.asc")
  ]);
  return publicCatalog({ departments, bases, roles, accessRoles, presets, roleBaseRules, audit, countryRules, baseJurisdictions, roleRequirements });
});

async function getOne(path) {
  const rows = await sb(`${path}&limit=1`);
  return array(rows)[0] || null;
}

async function resolveEmployee(input = {}) {
  const id = safeText(input.employeeId || input.id || input._id, 80);
  const skId = upper(input.skId || input.skID, 32);
  if (isUuid(id)) return getOne(`agent_users?select=*&id=eq.${enc(id)}`);
  if (skId) return getOne(`agent_users?select=*&sk_id=eq.${enc(skId)}`);
  throw new Error("EMPLOYEE_ID_REQUIRED");
}

function managerName(m = {}) {
  return safeText(
    m.display_name || [m.first_name, m.last_name].filter(Boolean).join(" ") || m.email || m.sk_id,
    160
  );
}

async function managerCandidates(managerRoleId, baseCode, excludeId = "") {
  if (!managerRoleId) return [];
  const rows = await sb(
    `agent_users?select=id,sk_id,display_name,first_name,last_name,corporate_email_address,email,base,base_code,station,job_title,role_id,job_code,active,badge_photo_url` +
    `&active=eq.true&role_id=eq.${enc(managerRoleId)}&order=display_name.asc`
  );
  const filtered = array(rows).filter(x => String(x.id) !== String(excludeId));
  if (!baseCode) return filtered;
  const sameBase = filtered.filter(x => upper(x.base_code, 40) === upper(baseCode, 40));
  return sameBase.length ? sameBase : filtered;
}

function hrRecord(employee = {}) { return object(object(employee.payload).hrRecord); }
function inputCountry(employee = {}, input = {}) {
  return upper(
    input.employmentCountry || input.countryCode || hrRecord(employee).employmentCountry ||
    hrRecord(employee).countryOfEmployment || employee.country_code,
    2
  );
}

async function resolveSmartContext({ employee = {}, role, base, input = {} }) {
  const countryCode = inputCountry(employee, input) || upper(base?.country_code, 2);
  if (!countryCode) throw new Error("EMPLOYMENT_COUNTRY_REQUIRED");
  const countryRule = await getOne(`hr_country_rules?select=*&active=eq.true&country_code=eq.${enc(countryCode)}`);
  if (!countryRule || countryRule.employment_enabled !== true) throw new Error("EMPLOYMENT_COUNTRY_NOT_ENABLED");
  if (base?.country_code && upper(base.country_code, 2) !== countryCode) throw new Error("BASE_COUNTRY_MISMATCH");
  const baseJurisdiction = base
    ? await getOne(`hr_base_jurisdictions?select=*&active=eq.true&base_code=eq.${enc(base.code)}`)
    : null;
  const roleRequirement = role
    ? await getOne(`hr_role_requirements?select=*&active=eq.true&role_id=eq.${enc(role.role_id)}`)
    : null;
  return { countryCode, countryRule, baseJurisdiction, roleRequirement };
}

function requiredValues(employee = {}, input = {}) {
  return { ...hrRecord(employee), ...object(input.hrRecord), ...input };
}

function missingFields(required = [], values = {}) {
  return array(required).filter(key => {
    const value = values[key];
    return value === undefined || value === null || String(value).trim() === "";
  });
}

async function updatePhonebook(employee, role, department, base, actorId, canGroupTalk) {
  const current = await sb(`grouptalk_phonebook?select=*&agent_user_id=eq.${enc(employee.id)}&limit=1`);
  const existing = array(current)[0];
  const row = {
    agent_user_id: employee.id,
    sk_id: employee.sk_id || "",
    display_name: managerName(employee),
    email: employee.corporate_email_address || employee.email || "",
    department: department.name,
    base: base?.code || "",
    station: base?.airport_iata || base?.destination_code || base?.code || "",
    position: role.title,
    avatar_url: employee.badge_photo_url || existing?.avatar_url || null,
    is_visible: true,
    payload: { ...(existing?.payload || {}), orgManaged: true, canGroupTalk: Boolean(canGroupTalk) },
    created_by_agent_user_id: existing?.created_by_agent_user_id || actorId || null,
    updated_at: new Date().toISOString()
  };
  if (existing?.id) await sb(`grouptalk_phonebook?id=eq.${enc(existing.id)}`, { method: "PATCH", body: row });
  else await sb("grouptalk_phonebook", { method: "POST", body: row });
}

async function updatePayrollMirror(employee, snapshot, smart, input = {}) {
  const rows = await sb(`staff_payroll_profiles?select=*&agent_user_id=eq.${enc(employee.id)}&limit=1`);
  const existing = array(rows)[0];
  const rule = smart.countryRule || {};
  const jurisdiction = smart.baseJurisdiction || {};
  const hr = requiredValues(employee, input);
  const roleReq = smart.roleRequirement || {};
  const requiredPayrollFields = [...new Set([
    ...array(rule.required_payroll_fields),
    ...array(roleReq.required_payroll_fields)
  ])];
  const payload = {
    ...(existing?.payload || {}),
    orgAssignment: snapshot,
    employmentCountry: smart.countryCode,
    countryRuleVersion: rule.source_checked_at || null,
    bankScheme: rule.bank_scheme || "",
    requiredPayrollFields,
    bankFields: array(rule.bank_fields),
    complianceChecks: object(rule.compliance_checks),
    baseJurisdiction: jurisdiction,
    roleRequirements: roleReq,
    employmentType: hr.employmentType || hr.classificationStatus || "",
    payFrequency: hr.payFrequency || "",
    compensationType: hr.compensationType || ""
  };
  const row = {
    staff_key: existing?.staff_key || employee.sk_id || employee.id,
    agent_user_id: employee.id,
    sk_id: employee.sk_id || null,
    display_name: managerName(employee),
    email: employee.corporate_email_address || employee.email || null,
    employment_type: hr.employmentType || hr.classificationStatus || existing?.employment_type || "employee",
    payroll_enabled: true,
    currency: rule.currency_code || existing?.currency || "USD",
    tax_region: jurisdiction.payroll_region || hr.taxRegion || existing?.tax_region || null,
    bank_status: hr.bankStatus || existing?.bank_status || "not_verified",
    payload,
    updated_at: new Date().toISOString()
  };
  if (existing?.id) await sb(`staff_payroll_profiles?id=eq.${enc(existing.id)}`, { method: "PATCH", body: row });
  else await sb("staff_payroll_profiles", { method: "POST", body: row });
}

async function mirrorResult(name, fn) {
  try {
    await fn();
    return { name, ok: true };
  } catch (error) {
    console.error(`[SuccessFactors V9] ${name} mirror failed`, error?.message || error);
    return { name, ok: false, code: safeText(error?.code || error?.message || "MIRROR_FAILED", 120) };
  }
}

export const provisionStaffOrganization = webMethod(Permissions.SiteMember, async (input = {}) => {
  const actor = await requireOrgAdmin();
  const employee = await resolveEmployee(input);
  if (!employee) throw new Error("EMPLOYEE_NOT_FOUND");

  const requestedRoleId = upper(input.roleId || input.jobCode, 80);
  if (!requestedRoleId) throw new Error("JOB_ROLE_REQUIRED");
  const role = await getOne(`org_job_roles?select=*&active=eq.true&or=(role_id.eq.${enc(requestedRoleId)},job_code.eq.${enc(requestedRoleId)})`);
  if (!role) throw new Error("JOB_ROLE_INACTIVE_OR_UNKNOWN");

  const department = await getOne(`org_departments?select=*&active=eq.true&id=eq.${enc(role.department_id)}`);
  if (!department) throw new Error("JOB_ROLE_DEPARTMENT_INVALID");

  const baseCode = upper(input.baseCode || input.assignedBase || input.base, 40);
  let base = null;
  if (baseCode) {
    base = await getOne(`org_bases?select=*&active=eq.true&code=eq.${enc(baseCode)}`);
    if (!base) throw new Error("BASE_INACTIVE_OR_UNKNOWN");
    const rule = await getOne(`org_role_base_rules?select=id&active=eq.true&role_id=eq.${enc(role.role_id)}&base_code=eq.${enc(base.code)}`);
    if (!rule) throw new Error("ROLE_BASE_NOT_ALLOWED");
  }

  const smart = await resolveSmartContext({ employee, role, base, input });
  const accessRole = await getOne(`org_access_roles?select=*&active=eq.true&access_role_code=eq.${enc(role.default_access_role)}`);
  if (!accessRole) throw new Error("ACCESS_ROLE_MAPPING_INVALID");
  if (accessRole.restricted === true) throw new Error("RESTRICTED_ACCESS_REQUIRES_MANUAL_ADMINISTRATION");

  const preset = await getOne(`org_permission_presets?select=*&active=eq.true&preset_id=eq.${enc(role.permission_preset_id || accessRole.preset_id)}`);
  if (!preset) throw new Error("PERMISSION_PRESET_MAPPING_INVALID");

  const requestedManagerId = safeText(input.managerAgentUserId, 80);
  const candidates = await managerCandidates(role.reports_to_role_id, base?.code || "", employee.id);
  let manager = null;
  if (requestedManagerId) {
    if (!isUuid(requestedManagerId)) throw new Error("MANAGER_ID_INVALID");
    manager = candidates.find(x => String(x.id) === requestedManagerId) || null;
    if (!manager) throw new Error("MANAGER_NOT_ELIGIBLE_FOR_ROLE");
  } else if (candidates.length === 1) {
    manager = candidates[0];
  }
  // IMPORTANT: two or more eligible candidates always remain unresolved.

  const values = requiredValues(employee, input);
  const requiredHr = [...new Set([
    ...array(smart.countryRule.required_hr_fields),
    ...array(smart.roleRequirement?.required_hr_fields)
  ])];
  const requiredPayroll = [...new Set([
    ...array(smart.countryRule.required_payroll_fields),
    ...array(smart.roleRequirement?.required_payroll_fields)
  ])];
  const missingHr = missingFields(requiredHr, values);

  const oldSnapshot = {
    companyCode: employee.company_code || "",
    roleId: employee.role_id || "",
    jobCode: employee.job_code || "",
    departmentId: employee.department_id || "",
    baseCode: employee.base_code || "",
    managerAgentUserId: employee.manager_agent_user_id || "",
    accessRole: employee.access_role || "",
    permissionPreset: employee.permission_preset || ""
  };

  const snapshot = {
    companyCode: upper(input.companyCode || COMPANY_CODE, 20),
    roleId: role.role_id,
    jobCode: role.job_code,
    jobTitle: role.title,
    jobLevel: role.level || "",
    departmentId: department.id,
    departmentCode: department.code,
    departmentName: department.name,
    division: department.division || "",
    baseCode: base?.code || "",
    baseName: base?.name || "",
    destinationCode: base?.destination_code || "",
    countryCode: smart.countryCode,
    station: base?.airport_iata || base?.destination_code || base?.code || "",
    payrollRegion: smart.baseJurisdiction?.payroll_region || "",
    legalWorkLocation: smart.baseJurisdiction?.legal_work_location || base?.name || "",
    currency: smart.countryRule.currency_code || "",
    bankScheme: smart.countryRule.bank_scheme || "",
    managerRoleId: role.reports_to_role_id || "",
    managerRoleTitle: role.reports_to_title || "",
    managerAgentUserId: manager?.id || "",
    managerSkId: manager?.sk_id || "",
    managerName: manager ? managerName(manager) : "",
    managerEmail: manager?.corporate_email_address || manager?.email || "",
    accessRole: accessRole.access_role_code,
    permissionPreset: preset.preset_id,
    permissionKeys: array(preset.permission_keys),
    allowedApps: array(preset.allowed_apps),
    permissionGroups: array(preset.permission_groups),
    canManage: role.can_manage === true || preset.can_manage === true,
    canAccessPayroll: preset.can_access_payroll === true,
    canAccessGroupTalk: preset.can_access_grouptalk === true,
    effectiveFrom: safeText(input.effectiveFrom || new Date().toISOString().slice(0, 10), 10),
    requiredHrFields: requiredHr,
    missingHrFields: missingHr,
    requiredPayrollFields: requiredPayroll,
    requiredDocuments: [...new Set(array(smart.roleRequirement?.required_documents))],
    source: "SUCCESSFACTORS_V9_SMART_ORG"
  };

  const existingPayload = object(employee.payload);
  const version = Number(employee.org_assignment_version || 0) + 1;
  const update = {
    company_code: snapshot.companyCode,
    role_id: snapshot.roleId,
    job_code: snapshot.jobCode,
    job_level: snapshot.jobLevel,
    department_id: snapshot.departmentId,
    department_code: snapshot.departmentCode,
    base_code: snapshot.baseCode || "",
    destination_code: snapshot.destinationCode || "",
    country_code: snapshot.countryCode || "",
    manager_agent_user_id: snapshot.managerAgentUserId || "",
    manager_role_id: snapshot.managerRoleId || "",
    manager_sk_id: snapshot.managerSkId || "",
    manager_email: snapshot.managerEmail || "",
    access_role: snapshot.accessRole,
    permission_preset: snapshot.permissionPreset,
    permission_keys: snapshot.permissionKeys,
    allowed_apps: snapshot.allowedApps,
    permission_groups: snapshot.permissionGroups,
    org_assignment_version: version,
    org_assignment_source: snapshot.source,
    job_title: snapshot.jobTitle,
    department: snapshot.departmentName,
    base: snapshot.baseCode || "",
    station: snapshot.station || "",
    manager_name: snapshot.managerName || "",
    can_manage: snapshot.canManage,
    can_access_payroll: snapshot.canAccessPayroll,
    can_access_grouptalk: snapshot.canAccessGroupTalk,
    payload: {
      ...existingPayload,
      companyCode: snapshot.companyCode,
      roleId: snapshot.roleId,
      jobCode: snapshot.jobCode,
      departmentId: snapshot.departmentId,
      departmentCode: snapshot.departmentCode,
      baseCode: snapshot.baseCode,
      countryCode: snapshot.countryCode,
      employmentCountry: snapshot.countryCode,
      managerAgentUserId: snapshot.managerAgentUserId,
      managerSkId: snapshot.managerSkId,
      accessRole: snapshot.accessRole,
      permissionPreset: snapshot.permissionPreset,
      permissions: snapshot.permissionKeys,
      allowedApps: snapshot.allowedApps,
      permissionGroups: snapshot.permissionGroups,
      orgAssignment: snapshot,
      hrSmartRequirements: {
        countryCode: snapshot.countryCode,
        requiredHrFields: snapshot.requiredHrFields,
        missingHrFields: snapshot.missingHrFields,
        requiredPayrollFields: snapshot.requiredPayrollFields,
        requiredDocuments: snapshot.requiredDocuments,
        currency: snapshot.currency,
        bankScheme: snapshot.bankScheme,
        payrollRegion: snapshot.payrollRegion
      }
    }
  };

  const assignmentRow = {
    company_code: snapshot.companyCode,
    role_id: snapshot.roleId,
    job_code: snapshot.jobCode,
    department_id: snapshot.departmentId,
    base_code: snapshot.baseCode,
    manager_agent_user_id: snapshot.managerAgentUserId,
    manager_role_id: snapshot.managerRoleId,
    access_role: snapshot.accessRole,
    permission_preset_id: snapshot.permissionPreset,
    effective_from: snapshot.effectiveFrom,
    source: snapshot.source
  };

  // One RPC = one Postgres transaction for employee master + assignment ledger + audit.
  const core = await rpc(ASSIGNMENT_RPC, {
    p_employee_id: employee.id,
    p_actor_id: actor.id,
    p_update: update,
    p_assignment: assignmentRow,
    p_old_assignment: oldSnapshot,
    p_new_assignment: snapshot,
    p_reason: safeText(input.reason || "SuccessFactors V9 smart organization assignment", 500)
  });

  const saved = object(core?.item);
  if (!saved.id) throw new Error("ASSIGNMENT_RPC_RETURN_INVALID");

  const mirrors = await Promise.all([
    mirrorResult("payroll", () => updatePayrollMirror(saved, snapshot, smart, input)),
    mirrorResult("grouptalk", () => updatePhonebook(saved, role, department, base, actor.id, snapshot.canAccessGroupTalk))
  ]);
  const mirrorWarnings = mirrors.filter(item => !item.ok);
  const managerResolution = manager
    ? (requestedManagerId ? "HR_SELECTED" : "AUTO_RESOLVED_UNIQUE")
    : (role.reports_to_role_id ? (candidates.length > 1 ? "AMBIGUOUS_REQUIRES_SELECTION" : "MANAGER_ROLE_UNFILLED") : "NO_MANAGER_REQUIRED");

  let message;
  if (mirrorWarnings.length) {
    message = "Organization assignment was saved, but one or more downstream employee-service mirrors require attention.";
  } else if (missingHr.length) {
    message = `Organization and payroll jurisdiction saved. ${missingHr.length} required HR field(s) remain incomplete.`;
  } else if (!manager && role.reports_to_role_id) {
    message = candidates.length > 1
      ? `Organization and payroll jurisdiction saved. Select one eligible ${role.reports_to_title || role.reports_to_role_id} to complete the manager link.`
      : `Organization and payroll jurisdiction saved. No active holder of ${role.reports_to_title || role.reports_to_role_id} is available yet.`;
  } else {
    message = "Employee organization, jurisdiction, payroll defaults, manager and permissions were provisioned.";
  }

  return {
    ok: true,
    item: saved,
    assignment: snapshot,
    assignmentId: core.assignmentId || "",
    auditId: core.auditId || "",
    smartRequirements: {
      country: countryView(smart.countryRule),
      baseJurisdiction: smart.baseJurisdiction || {},
      roleRequirements: smart.roleRequirement || {},
      missingHrFields: missingHr
    },
    managerResolution,
    managerCandidates: candidates.map(item => ({
      id: item.id,
      skId: item.sk_id || "",
      displayName: managerName(item),
      baseCode: item.base_code || "",
      roleId: item.role_id || "",
      badgePhotoUrl: item.badge_photo_url || ""
    })),
    sync: {
      degraded: mirrorWarnings.length > 0,
      mirrors
    },
    message
  };
});
