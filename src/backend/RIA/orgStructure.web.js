import { webMethod, Permissions } from "wix-web-module";
import { currentMember } from "wix-members-backend";
import { secrets } from "wix-secrets-backend.v2";
import { fetch } from "wix-fetch";

const getSecret = (name) => secrets.getSecretValue(name);
let cfgPromise;

async function config() {
  if (!cfgPromise) cfgPromise = (async () => {
    const url = String(await getSecret("SUPABASE_URL") || "").replace(/\/$/, "");
    let key = String(await getSecret("SUPABASE_SECRET_KEY") || "");
    if (!key) key = String(await getSecret("SUPABASE_SERVICE_ROLE_KEY") || "");
    if (!url || !key) throw new Error("Supabase server configuration is incomplete.");
    return { url, key };
  })();
  return cfgPromise;
}

function safeText(v, max = 300) { return String(v ?? "").trim().slice(0, max); }
function isUuid(v) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(v || "")); }
function enc(v) { return encodeURIComponent(String(v ?? "")); }
function legacyJwt(key) { return String(key || "").split(".").length === 3; }

async function sb(path, { method = "GET", body, prefer = "return=representation" } = {}) {
  const { url, key } = await config();
  const headers = { apikey: key, "Content-Type": "application/json" };
  if (legacyJwt(key)) headers.Authorization = `Bearer ${key}`;
  if (prefer) headers.Prefer = prefer;
  const response = await fetch(`${url}/rest/v1/${path}`, {
    method,
    headers,
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  });
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!response.ok) throw new Error(`Supabase request failed (${response.status}).`);
  return data;
}

function permissionTokens(agent = {}) {
  const p = agent.payload && typeof agent.payload === "object" ? agent.payload : {};
  const values = [agent.permission_keys, agent.allowed_apps, p.permissions, p.allowedApps, p.permissionGroups, p.roles, p.accessRole];
  return values.flatMap(v => Array.isArray(v) ? v : (v ? [v] : [])).map(v => String(v).toLowerCase());
}

async function requireOrgAdmin() {
  const member = await currentMember.getMember().catch(() => null);
  const memberId = member?._id || member?.id || "";
  if (!memberId) throw new Error("An authenticated staff session is required.");
  const rows = await sb(`agent_users?select=*&or=(wix_member_id.eq.${enc(memberId)},member_id.eq.${enc(memberId)})&limit=1`);
  const agent = Array.isArray(rows) ? rows[0] : null;
  if (!agent || agent.active === false || agent.portal_access === false || agent.authorized === false) throw new Error("Staff access is not authorized.");
  const tokens = permissionTokens(agent);
  const privileged = agent.can_manage === true || tokens.some(x => ["hr","hr_admin","hr_manager","super_admin","owner","company_owner","all"].includes(x));
  if (!privileged) throw new Error("HR organization administration permission is required.");
  return agent;
}

function rowId(item = {}) { return item.id || item._id || ""; }
function array(v) { return Array.isArray(v) ? v : []; }
function publicCatalog({ departments, bases, roles, accessRoles, presets, roleBaseRules, audit }) {
  return {
    companyCode: "SK01",
    departments: array(departments),
    bases: array(bases),
    roles: array(roles),
    accessRoles: array(accessRoles),
    permissionPresets: array(presets),
    roleBaseRules: array(roleBaseRules),
    audit: array(audit)
  };
}

export const getOrgStructureBootstrap = webMethod(Permissions.SiteMember, async () => {
  await requireOrgAdmin();
  const [departments, bases, roles, accessRoles, presets, roleBaseRules, audit] = await Promise.all([
    sb("org_departments?select=*&active=eq.true&order=sort_order.asc,code.asc"),
    sb("org_bases?select=*&active=eq.true&order=sort_order.asc,code.asc"),
    sb("org_job_roles?select=*&active=eq.true&order=department_code.asc,title.asc"),
    sb("org_access_roles?select=*&active=eq.true&order=access_role_code.asc"),
    sb("org_permission_presets?select=*&active=eq.true&order=preset_id.asc"),
    sb("org_role_base_rules?select=*&active=eq.true&order=priority.asc"),
    sb("org_assignment_audit?select=id,agent_user_id,actor_agent_user_id,action,old_assignment,new_assignment,reason,created_at&order=created_at.desc&limit=100")
  ]);
  return { ok: true, ...publicCatalog({ departments, bases, roles, accessRoles, presets, roleBaseRules, audit }) };
});

async function getOne(path) {
  const rows = await sb(`${path}&limit=1`);
  return Array.isArray(rows) ? rows[0] : null;
}

async function resolveEmployee(input = {}) {
  const id = safeText(input.employeeId || input.id || input._id, 80);
  const skId = safeText(input.skId || input.skID, 32).toUpperCase();
  if (isUuid(id)) return getOne(`agent_users?select=*&id=eq.${enc(id)}`);
  if (skId) return getOne(`agent_users?select=*&sk_id=eq.${enc(skId)}`);
  throw new Error("Employee ID or SK-ID is required for organization assignment.");
}

async function managerCandidates(managerRoleId, baseCode, excludeId = "") {
  if (!managerRoleId) return [];
  const rows = await sb(`agent_users?select=id,sk_id,display_name,first_name,last_name,corporate_email_address,email,base,base_code,station,job_title,role_id,job_code,active&active=eq.true&role_id=eq.${enc(managerRoleId)}&order=display_name.asc`);
  const filtered = array(rows).filter(x => String(x.id) !== String(excludeId));
  if (!baseCode) return filtered;
  const same = filtered.filter(x => String(x.base_code || "").toUpperCase() === String(baseCode).toUpperCase());
  return same.length ? same : filtered;
}

function managerName(m = {}) {
  return safeText(m.display_name || [m.first_name, m.last_name].filter(Boolean).join(" ") || m.email || m.sk_id, 160);
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
    is_visible: true,
    payload: { ...(existing?.payload || {}), orgManaged: true, canGroupTalk: !!canGroupTalk },
    created_by_agent_user_id: existing?.created_by_agent_user_id || actorId || null,
    updated_at: new Date().toISOString()
  };
  if (existing?.id) await sb(`grouptalk_phonebook?id=eq.${enc(existing.id)}`, { method: "PATCH", body: row });
  else await sb("grouptalk_phonebook", { method: "POST", body: row });
}

async function updatePayrollMirror(employee, snapshot) {
  const rows = await sb(`staff_payroll_profiles?select=id,payload&agent_user_id=eq.${enc(employee.id)}&limit=1`);
  const existing = array(rows)[0];
  if (!existing?.id) return;
  await sb(`staff_payroll_profiles?id=eq.${enc(existing.id)}`, {
    method: "PATCH",
    body: { payload: { ...(existing.payload || {}), orgAssignment: snapshot }, updated_at: new Date().toISOString() }
  });
}

export const provisionStaffOrganization = webMethod(Permissions.SiteMember, async (input = {}) => {
  const actor = await requireOrgAdmin();
  const employee = await resolveEmployee(input);
  if (!employee) throw new Error("Employee record was not found.");

  const requestedRoleId = safeText(input.roleId || input.jobCode, 80).toUpperCase();
  if (!requestedRoleId) throw new Error("Job Code / Job Title is required.");
  const role = await getOne(`org_job_roles?select=*&active=eq.true&or=(role_id.eq.${enc(requestedRoleId)},job_code.eq.${enc(requestedRoleId)})`);
  if (!role) throw new Error("The selected job code is not active in the organization structure.");
  const department = await getOne(`org_departments?select=*&active=eq.true&id=eq.${enc(role.department_id)}`);
  if (!department) throw new Error("The job role has no active department.");

  const baseCode = safeText(input.baseCode || input.assignedBase || input.base, 40).toUpperCase();
  let base = null;
  if (baseCode) {
    base = await getOne(`org_bases?select=*&active=eq.true&code=eq.${enc(baseCode)}`);
    if (!base) throw new Error("The selected base is not active.");
    const rule = await getOne(`org_role_base_rules?select=id&active=eq.true&role_id=eq.${enc(role.role_id)}&base_code=eq.${enc(base.code)}`);
    if (!rule) throw new Error("The selected base is not allowed for this job role.");
  }

  const accessRole = await getOne(`org_access_roles?select=*&active=eq.true&access_role_code=eq.${enc(role.default_access_role)}`);
  if (!accessRole) throw new Error("The role has no valid access-role mapping.");
  // Owner / break-glass roles can only be assigned through a separate privileged process.
  if (accessRole.restricted) throw new Error("Restricted platform-owner access cannot be granted automatically from a job title.");
  const preset = await getOne(`org_permission_presets?select=*&active=eq.true&preset_id=eq.${enc(role.permission_preset_id || accessRole.preset_id)}`);
  if (!preset) throw new Error("The role has no valid permission preset.");

  let manager = null;
  const requestedManagerId = safeText(input.managerAgentUserId, 80);
  const candidates = await managerCandidates(role.reports_to_role_id, base?.code || "", employee.id);
  if (requestedManagerId && isUuid(requestedManagerId)) manager = candidates.find(x => x.id === requestedManagerId) || null;
  if (!manager && candidates.length === 1) manager = candidates[0];
  if (!manager && candidates.length > 1) {
    const exact = candidates.find(x => String(x.base_code || "").toUpperCase() === String(base?.code || "").toUpperCase());
    manager = exact || null;
  }

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
    companyCode: safeText(input.companyCode || "SK01", 20).toUpperCase(),
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
    countryCode: base?.country_code || "",
    station: base?.airport_iata || base?.destination_code || base?.code || "",
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
    canAccessPayroll: preset.can_access_payroll !== false,
    canAccessGroupTalk: preset.can_access_grouptalk === true,
    effectiveFrom: safeText(input.effectiveFrom || new Date().toISOString().slice(0,10), 10),
    source: "SUCCESSFACTORS_ORG_AUTO"
  };

  const existingPayload = employee.payload && typeof employee.payload === "object" ? employee.payload : {};
  const version = Number(employee.org_assignment_version || 0) + 1;
  const update = {
    company_code: snapshot.companyCode,
    role_id: snapshot.roleId,
    job_code: snapshot.jobCode,
    job_level: snapshot.jobLevel,
    department_id: snapshot.departmentId,
    department_code: snapshot.departmentCode,
    base_code: snapshot.baseCode || null,
    destination_code: snapshot.destinationCode || null,
    country_code: snapshot.countryCode || null,
    manager_agent_user_id: snapshot.managerAgentUserId || null,
    manager_role_id: snapshot.managerRoleId || null,
    manager_sk_id: snapshot.managerSkId || null,
    manager_email: snapshot.managerEmail || null,
    access_role: snapshot.accessRole,
    permission_preset: snapshot.permissionPreset,
    permission_keys: snapshot.permissionKeys,
    allowed_apps: snapshot.allowedApps,
    permission_groups: snapshot.permissionGroups,
    org_assignment_version: version,
    org_assignment_source: snapshot.source,
    job_title: snapshot.jobTitle,
    department: snapshot.departmentName,
    base: snapshot.baseCode || null,
    station: snapshot.station || null,
    manager_name: snapshot.managerName || null,
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
      managerAgentUserId: snapshot.managerAgentUserId,
      managerSkId: snapshot.managerSkId,
      accessRole: snapshot.accessRole,
      permissionPreset: snapshot.permissionPreset,
      permissions: snapshot.permissionKeys,
      allowedApps: snapshot.allowedApps,
      permissionGroups: snapshot.permissionGroups,
      orgAssignment: snapshot
    },
    updated_at: new Date().toISOString()
  };

  const savedRows = await sb(`agent_users?id=eq.${enc(employee.id)}`, { method: "PATCH", body: update });
  const saved = array(savedRows)[0] || { ...employee, ...update };

  await sb(`org_employee_assignments?agent_user_id=eq.${enc(employee.id)}&active=eq.true`, {
    method: "PATCH",
    body: { active: false, effective_to: snapshot.effectiveFrom, updated_at: new Date().toISOString() }
  });
  await sb("org_employee_assignments", { method: "POST", body: {
    agent_user_id: employee.id,
    company_code: snapshot.companyCode,
    role_id: snapshot.roleId,
    job_code: snapshot.jobCode,
    department_id: snapshot.departmentId,
    base_code: snapshot.baseCode || null,
    manager_agent_user_id: snapshot.managerAgentUserId || null,
    manager_role_id: snapshot.managerRoleId || null,
    access_role: snapshot.accessRole,
    permission_preset_id: snapshot.permissionPreset,
    effective_from: snapshot.effectiveFrom,
    active: true,
    source: snapshot.source,
    assigned_by_agent_user_id: actor.id
  }});
  await sb("org_assignment_audit", { method: "POST", body: {
    agent_user_id: employee.id,
    actor_agent_user_id: actor.id,
    action: "ASSIGNMENT_CHANGED",
    old_assignment: oldSnapshot,
    new_assignment: snapshot,
    reason: safeText(input.reason || "SuccessFactors organization assignment", 500)
  }});

  await Promise.allSettled([
    updatePayrollMirror(saved, snapshot),
    updatePhonebook(saved, role, department, base, actor.id, snapshot.canAccessGroupTalk)
  ]);

  return {
    ok: true,
    item: saved,
    assignment: snapshot,
    managerResolution: manager ? "AUTO_RESOLVED" : (role.reports_to_role_id ? "MANAGER_ROLE_UNFILLED_OR_AMBIGUOUS" : "NO_MANAGER_REQUIRED"),
    message: manager || !role.reports_to_role_id
      ? "Employee organization, manager and permissions were provisioned."
      : `Organization and permissions were provisioned. Assign an active holder for ${role.reports_to_title || role.reports_to_role_id} to complete the manager link.`
  };
});
