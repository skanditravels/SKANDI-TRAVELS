// /src/backend/SKANDI_CORE/staffAuth.js
// SKANDI canonical staff identity + authorization core.
// R-003.6
//
// Source-of-truth contract:
// - Wix Members authenticates credentials / owns the browser session.
// - Supabase public.agent_users is the runtime staff identity projection.
// - Supabase org_access_roles + org_permission_presets own app authorization.
// - org_employee_assignments may override the projected organization assignment
//   when an effective active assignment exists.
//
// This module contains the business logic. Web-method exposure belongs only in
// /src/backend/RIA/staffPortalAuth.web.js.

import { authentication, currentMember } from "wix-members-backend";
import { restRequest } from "./supabaseServer.js";

const AGENT_TABLE = "agent_users";
const ASSIGNMENT_TABLE = "org_employee_assignments";
const ACCESS_ROLE_TABLE = "org_access_roles";
const PRESET_TABLE = "org_permission_presets";
const LOGIN_AUDIT_TABLE = "staff_login_audit";

const BLOCKED_EMPLOYMENT_STATUSES = new Set([
  "TERMINATED",
  "SUSPENDED",
  "FURLOUGHED"
]);

const APP_CATALOG = Object.freeze({
  altea: Object.freeze({
    id: "altea",
    title: "ALTEA Operations",
    subtitle: "Reservations, DCS and destination operations",
    path: "/riaintra/success-factors/altea",
    group: "Operations",
    icon: "A"
  }),
  mail: Object.freeze({
    id: "mail",
    title: "H-Mail",
    subtitle: "Internal messages and station notices",
    path: "/riaintra/success-factors/mail",
    group: "Communication",
    icon: "M"
  }),
  grouptalk: Object.freeze({
    id: "grouptalk",
    title: "GroupTalk",
    subtitle: "Operational communication and team channels",
    path: "/riaintra/success-factors/altea/grouptalk",
    group: "Communication",
    icon: "G"
  }),
  uniform: Object.freeze({
    id: "uniform",
    title: "Uniform Center",
    subtitle: "Uniform orders and staff issue",
    path: "/riaintra/uniform",
    group: "MyProfile",
    icon: "U"
  }),
  myroster: Object.freeze({
    id: "myroster",
    title: "MyRoster",
    subtitle: "Shifts, duties and assignments",
    path: "/riaintra/success-factors/my-roster",
    group: "MyProfile",
    icon: "R"
  }),
  payroll: Object.freeze({
    id: "payroll",
    title: "Pay & Time",
    subtitle: "Payroll and staff pay information",
    path: "/riaintra/success-factors/my-payroll",
    group: "MyProfile",
    icon: "P"
  }),
  "inventory-control": Object.freeze({
    id: "inventory-control",
    title: "Inventory Control",
    subtitle: "Product, capacity and aircraft inventory",
    path: "/riaintra/success-factors/altea/inventory-control",
    group: "Administration",
    icon: "I"
  }),
  hr: Object.freeze({
    id: "hr",
    title: "SuccessFactors",
    subtitle: "Staff and organization management",
    path: "/riaintra/success-factors",
    group: "Administration",
    icon: "H"
  }),
  policies: Object.freeze({
    id: "policies",
    title: "Policy Control",
    subtitle: "Internal policies and controlled documents",
    path: "/riaintra/success-factors/legal",
    group: "Administration",
    icon: "P"
  }),
});

// Role/preset definitions are slow-changing control data. Cache only those
// definitions in the backend process; never cache staff identity/session rows.
const CONTROL_CACHE_TTL_MS = 5 * 60 * 1000;
const accessRoleCache = new Map();
const permissionPresetCache = new Map();

function cached(map, key) {
  const item = map.get(key);
  if (!item) return null;
  if (Date.now() - item.at > CONTROL_CACHE_TTL_MS) {
    map.delete(key);
    return null;
  }
  return item.value;
}

function putCache(map, key, value) {
  if (value) map.set(key, { at: Date.now(), value });
  return value;
}

function clean(value, max = 5000) {
  return String(value ?? "").trim().slice(0, max);
}

function upper(value, max = 160) {
  return clean(value, max).toUpperCase();
}

function lower(value, max = 160) {
  return clean(value, max).toLowerCase();
}

function normalizeEmail(value) {
  return lower(value, 254);
}

function normalizeSkId(value) {
  return upper(value, 40).replace(/[^A-Z0-9]/g, "");
}

function isValidSkId(value) {
  return /^[A-Z]{2}[0-9]{4}$/.test(normalizeSkId(value));
}

function array(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => clean(item, 160))
      .filter(Boolean);
  }

  if (typeof value === "string") {
    const raw = value.trim();
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return array(parsed);
    } catch (_) {}
    return raw.split(",").map((item) => clean(item, 160)).filter(Boolean);
  }

  return [];
}

function first(rows) {
  return Array.isArray(rows) && rows.length ? rows[0] : null;
}

function memberId(member = {}) {
  return clean(member?._id || member?.id, 120);
}

function memberEmail(member = {}) {
  const contactEmails = member?.contactDetails?.emails;
  const firstContactEmail = Array.isArray(contactEmails)
    ? contactEmails[0]
    : contactEmails;

  return normalizeEmail(
    member?.loginEmail ||
    firstContactEmail ||
    member?.profile?.email ||
    member?.email ||
    ""
  );
}

function displayName(agent = {}) {
  return clean(
    agent.preferred_name ||
    agent.display_name ||
    [agent.first_name, agent.last_name].filter(Boolean).join(" ") ||
    agent.corporate_email_address ||
    agent.email ||
    agent.sk_id ||
    "Staff",
    180
  );
}

function agentSelect() {
  return [
    "id",
    "agent_id",
    "wix_member_id",
    "member_id",
    "contact_id",
    "email",
    "corporate_email_address",
    "sk_id",
    "first_name",
    "last_name",
    "display_name",
    "preferred_name",
    "job_title",
    "position",
    "department",
    "station",
    "base",
    "employment_status",
    "status",
    "active",
    "portal_access",
    "authorized",
    "can_access_payroll",
    "can_access_grouptalk",
    "can_manage",
    "last_login_at",
    "badge_photo_url",
    "company_code",
    "role_id",
    "job_code",
    "job_level",
    "department_id",
    "department_code",
    "base_code",
    "destination_code",
    "country_code",
    "manager_agent_user_id",
    "manager_role_id",
    "manager_sk_id",
    "manager_email",
    "access_role",
    "permission_preset",
    "permission_keys",
    "allowed_apps",
    "permission_groups",
    "org_assignment_version",
    "org_assignment_source",
    "role"
  ].join(",");
}

async function select(table, query = {}) {
  const result = await restRequest({
    table,
    method: "GET",
    query,
    prefer: ""
  });
  return Array.isArray(result) ? result : [];
}

async function currentWixMember() {
  try {
    return await currentMember.getMember({ fieldsets: ["FULL"] }) || null;
  } catch (_) {
    return null;
  }
}

async function findAgentBySkId(skId) {
  const value = normalizeSkId(skId);
  if (!value) return null;
  return first(await select(AGENT_TABLE, {
    select: agentSelect(),
    sk_id: `eq.${value}`,
    limit: 1
  }));
}

async function findAgentByMemberReference(member = {}) {
  const id = memberId(member);
  const email = memberEmail(member);

  if (id) {
    let agent = first(await select(AGENT_TABLE, {
      select: agentSelect(),
      wix_member_id: `eq.${id}`,
      limit: 1
    }));
    if (agent) return agent;

    agent = first(await select(AGENT_TABLE, {
      select: agentSelect(),
      member_id: `eq.${id}`,
      limit: 1
    }));
    if (agent) return agent;
  }

  if (email) {
    let agent = first(await select(AGENT_TABLE, {
      select: agentSelect(),
      corporate_email_address: `ilike.${email}`,
      limit: 1
    }));
    if (agent) return agent;

    agent = first(await select(AGENT_TABLE, {
      select: agentSelect(),
      email: `ilike.${email}`,
      limit: 1
    }));
    if (agent) return agent;
  }

  return null;
}

function assertIdentityState(agent) {
  if (!agent) throw codedError("STAFF_PROFILE_NOT_FOUND");
  if (agent.active !== true) throw codedError("STAFF_PROFILE_INACTIVE");
  if (agent.authorized !== true) throw codedError("STAFF_PROFILE_NOT_AUTHORIZED");
  if (agent.portal_access !== true) throw codedError("STAFF_PROFILE_PORTAL_DISABLED");

  const employmentStatus = upper(agent.employment_status || agent.status, 80);
  if (BLOCKED_EMPLOYMENT_STATUSES.has(employmentStatus)) {
    throw codedError(`STAFF_EMPLOYMENT_${employmentStatus}`);
  }
}

function codedError(code, message = code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

async function syncMemberLink(agent, member) {
  if (!agent?.id || !member) return agent;

  const id = memberId(member);
  if (!id) return agent;

  const wixId = clean(agent.wix_member_id, 120);
  const legacyMemberId = clean(agent.member_id, 120);

  if ((wixId && wixId !== id) || (legacyMemberId && legacyMemberId !== id)) {
    throw codedError("WIX_MEMBER_LINK_MISMATCH");
  }

  const now = new Date();
  const lastLogin = Date.parse(clean(agent.last_login_at, 80));
  const loginStampStale = !Number.isFinite(lastLogin) || (now.getTime() - lastLogin) >= 15 * 60 * 1000;
  const patch = {};

  if (!wixId) patch.wix_member_id = id;
  if (!legacyMemberId) patch.member_id = id;
  if (loginStampStale) patch.last_login_at = now.toISOString();

  // Avoid writing agent_users on every page bootstrap. Link repair is immediate,
  // while last-login telemetry is intentionally throttled.
  if (!Object.keys(patch).length) return agent;
  patch.updated_at = now.toISOString();

  const rows = await restRequest({
    table: AGENT_TABLE,
    method: "PATCH",
    query: { id: `eq.${agent.id}` },
    body: patch
  });

  return first(rows) || { ...agent, ...patch };
}

function isEffectiveAssignment(row, today) {
  if (!row?.active) return false;
  const start = clean(row.effective_from, 10);
  const end = clean(row.effective_to, 10);
  if (start && start > today) return false;
  if (end && end < today) return false;
  return true;
}

async function loadEffectiveAssignment(agentId) {
  const id = clean(agentId, 80);
  if (!id) return null;

  const rows = await select(ASSIGNMENT_TABLE, {
    select: "id,agent_user_id,company_code,role_id,job_code,department_id,base_code,manager_agent_user_id,manager_role_id,access_role,permission_preset_id,effective_from,effective_to,active,source,updated_at",
    agent_user_id: `eq.${id}`,
    active: "eq.true",
    order: "effective_from.desc",
    limit: 20
  });

  const today = new Date().toISOString().slice(0, 10);
  return rows.find((row) => isEffectiveAssignment(row, today)) || null;
}

async function loadAccessRole(accessRoleCode) {
  const code = upper(accessRoleCode, 80);
  if (!code) return null;
  const fromCache = cached(accessRoleCache, code);
  if (fromCache) return fromCache;

  const row = first(await select(ACCESS_ROLE_TABLE, {
    select: "access_role_code,purpose,preset_id,provisioning_rule,restricted,active",
    access_role_code: `eq.${code}`,
    limit: 1
  }));
  return putCache(accessRoleCache, code, row);
}

async function loadPermissionPreset(presetId) {
  const id = clean(presetId, 100);
  if (!id) return null;
  const fromCache = cached(permissionPresetCache, id);
  if (fromCache) return fromCache;

  const row = first(await select(PRESET_TABLE, {
    select: "preset_id,name,description,permission_keys,allowed_apps,permission_groups,grouptalk_group_keys,can_manage,can_access_payroll,can_access_grouptalk,is_hr,is_payroll_admin,is_system_admin,active",
    preset_id: `eq.${id}`,
    limit: 1
  }));
  return putCache(permissionPresetCache, id, row);
}

async function resolveAuthorization(agent) {
  assertIdentityState(agent);

  const assignment = await loadEffectiveAssignment(agent.id);
  const accessRoleCode = upper(
    assignment?.access_role || agent.access_role || agent.role,
    80
  );

  if (!accessRoleCode) throw codedError("STAFF_ACCESS_ROLE_MISSING");

  const accessRole = await loadAccessRole(accessRoleCode);
  if (!accessRole || accessRole.active !== true) {
    throw codedError("STAFF_ACCESS_ROLE_INVALID");
  }

  // Effective organization assignment wins. Otherwise the canonical access-role
  // crosswalk owns the preset. agent_users.permission_preset remains a runtime
  // projection only and is used solely as a migration fallback if the role row
  // does not yet specify a preset.
  const presetId = clean(
    assignment?.permission_preset_id ||
    accessRole.preset_id ||
    agent.permission_preset,
    100
  );

  if (!presetId) throw codedError("STAFF_PERMISSION_PRESET_MISSING");

  const preset = await loadPermissionPreset(presetId);
  if (!preset || preset.active !== true) {
    throw codedError("STAFF_PERMISSION_PRESET_INVALID");
  }

  return {
    assignment,
    accessRole,
    preset,
    accessRoleCode,
    presetId,
    permissionKeys: array(preset.permission_keys),
    allowedApps: array(preset.allowed_apps),
    permissionGroups: array(preset.permission_groups),
    groupTalkGroupKeys: array(preset.grouptalk_group_keys),
    canManage: preset.can_manage === true,
    canAccessPayroll: preset.can_access_payroll === true,
    canAccessGroupTalk: preset.can_access_grouptalk === true,
    isHr: preset.is_hr === true,
    isPayrollAdmin: preset.is_payroll_admin === true,
    isSystemAdmin: preset.is_system_admin === true
  };
}

function publicProfile(agent, authorization) {
  const assignment = authorization?.assignment || {};
  const accessRole = authorization?.accessRoleCode || "";
  const presetId = authorization?.presetId || "";

  return {
    id: clean(agent.id, 80),
    agentUserId: clean(agent.id, 80),
    agentId: clean(agent.agent_id, 120),
    skId: normalizeSkId(agent.sk_id),
    firstName: clean(agent.first_name, 100),
    lastName: clean(agent.last_name, 100),
    preferredName: clean(agent.preferred_name, 100),
    displayName: displayName(agent),
    fullName: displayName(agent),
    email: normalizeEmail(agent.corporate_email_address || agent.email),
    corporateEmailAddress: normalizeEmail(agent.corporate_email_address || agent.email),
    jobTitle: clean(agent.job_title || agent.position, 180),
    position: clean(agent.position || agent.job_title, 180),
    roleId: clean(assignment.role_id || agent.role_id, 80),
    jobCode: clean(assignment.job_code || agent.job_code, 80),
    jobLevel: clean(agent.job_level, 80),
    departmentId: clean(assignment.department_id || agent.department_id, 80),
    departmentCode: clean(agent.department_code, 80),
    department: clean(agent.department, 180),
    baseCode: clean(assignment.base_code || agent.base_code, 80),
    base: clean(agent.base || agent.station, 160),
    station: clean(agent.station || agent.base, 160),
    destinationCode: clean(agent.destination_code, 80),
    countryCode: upper(agent.country_code, 8),
    employmentStatus: clean(agent.employment_status || agent.status, 80),
    active: agent.active === true,
    portalAccess: agent.portal_access === true,
    authorized: agent.authorized === true,
    accessRole,
    role: accessRole,
    permissionPreset: presetId,
    permissionKeys: [...authorization.permissionKeys],
    allowedApps: [...authorization.allowedApps],
    permissionGroups: [...authorization.permissionGroups],
    canManage: authorization.canManage,
    canUsePayroll: authorization.canAccessPayroll,
    canUseGroupTalk: authorization.canAccessGroupTalk,
    isHr: authorization.isHr,
    isPayrollAdmin: authorization.isPayrollAdmin,
    isSystemAdmin: authorization.isSystemAdmin,
    badgePhotoUrl: clean(agent.badge_photo_url, 1000),
    organizationSource: clean(assignment.source || agent.org_assignment_source, 120)
  };
}

function navigableApps(allowedApps = []) {
  const allowed = new Set(array(allowedApps).map((id) => lower(id, 100)));
  return Object.values(APP_CATALOG)
    .filter((app) => allowed.has(app.id))
    .map((app) => ({ ...app }));
}

function unauthorizedSession({ loggedIn = false, reason = "STAFF_AUTH_REQUIRED" } = {}) {
  return {
    ok: true,
    loggedIn,
    authorized: false,
    reason,
    profile: null,
    agent: null,
    apps: [],
    allowedApps: [],
    permissionKeys: [],
    permissionGroups: [],
    permissions: [],
    accessRole: "",
    permissionPreset: "",
    canManage: false
  };
}

function authorizedSession(agent, authorization) {
  const profile = publicProfile(agent, authorization);
  const apps = navigableApps(authorization.allowedApps);

  return {
    ok: true,
    loggedIn: true,
    authorized: true,
    profile,
    agent: profile,
    apps,
    allowedApps: [...authorization.allowedApps],
    permissionKeys: [...authorization.permissionKeys],
    permissionGroups: [...authorization.permissionGroups],
    permissions: [...authorization.permissionKeys],
    accessRole: authorization.accessRoleCode,
    permissionPreset: authorization.presetId,
    canManage: authorization.canManage,
    canAccessPayroll: authorization.canAccessPayroll,
    canAccessGroupTalk: authorization.canAccessGroupTalk,
    isHr: authorization.isHr,
    isPayrollAdmin: authorization.isPayrollAdmin,
    isSystemAdmin: authorization.isSystemAdmin,
    organization: {
      roleId: profile.roleId,
      jobCode: profile.jobCode,
      departmentId: profile.departmentId,
      baseCode: profile.baseCode,
      source: profile.organizationSource
    }
  };
}

async function auditLogin({ agent = null, skId = "", email = "", eventType, success, errorMessage = "" }) {
  try {
    await restRequest({
      table: LOGIN_AUDIT_TABLE,
      method: "POST",
      body: {
        agent_user_id: agent?.id || null,
        sk_id: normalizeSkId(skId || agent?.sk_id) || null,
        email: normalizeEmail(email || agent?.corporate_email_address || agent?.email) || null,
        event_type: clean(eventType, 100),
        success: success === true,
        error_message: clean(errorMessage, 300) || null
      }
    });
  } catch (_) {
    // Authentication must not fail solely because audit persistence is unavailable.
  }
}

function safeLoginFailureMessage(code) {
  const messages = {
    STAFF_PROFILE_NOT_FOUND: "No active SKANDI staff profile is linked to this SK-ID.",
    STAFF_PROFILE_INACTIVE: "This staff account is inactive.",
    STAFF_PROFILE_NOT_AUTHORIZED: "This staff account is not authorized for RIAINTRA.",
    STAFF_PROFILE_PORTAL_DISABLED: "Portal access is disabled for this staff account.",
    STAFF_ACCESS_ROLE_MISSING: "No system access role is assigned to this staff account.",
    STAFF_ACCESS_ROLE_INVALID: "The assigned system access role is not active.",
    STAFF_PERMISSION_PRESET_MISSING: "No permission preset is assigned to this staff account.",
    STAFF_PERMISSION_PRESET_INVALID: "The assigned permission preset is not active."
  };
  return messages[code] || "Staff sign-in is not available for this account.";
}

export async function loginStaffWithSkIdCore({ skId, password } = {}) {
  const cleanSkId = normalizeSkId(skId);
  if (!isValidSkId(cleanSkId)) {
    throw codedError("STAFF_SK_ID_INVALID", "Enter a valid SK-ID, for example SH1234.");
  }
  if (!password) throw codedError("STAFF_PASSWORD_REQUIRED", "Password is required.");

  let agent = null;
  let email = "";
  try {
    agent = await findAgentBySkId(cleanSkId);
    assertIdentityState(agent);
    const authorization = await resolveAuthorization(agent);

    email = normalizeEmail(agent.corporate_email_address || agent.email);
    if (!email) throw codedError("STAFF_LOGIN_EMAIL_MISSING");

    const sessionToken = await authentication.login(email, password);

    await auditLogin({
      agent,
      skId: cleanSkId,
      email,
      eventType: "STAFF_LOGIN_OK",
      success: true
    });

    const session = authorizedSession(agent, authorization);
    return {
      ok: true,
      sessionToken,
      profile: session.profile,
      apps: session.apps,
      allowedApps: session.allowedApps,
      permissionKeys: session.permissionKeys,
      permissionGroups: session.permissionGroups,
      accessRole: session.accessRole,
      permissionPreset: session.permissionPreset,
      canManage: session.canManage
    };
  } catch (error) {
    const code = clean(error?.code || error?.message, 120) || "STAFF_LOGIN_FAILED";
    await auditLogin({
      agent,
      skId: cleanSkId,
      email,
      eventType: "STAFF_LOGIN_FAILED",
      success: false,
      errorMessage: code
    });

    if (code.startsWith("STAFF_")) {
      throw codedError(code, safeLoginFailureMessage(code));
    }

    throw codedError(
      "STAFF_CREDENTIALS_INVALID",
      "The SK-ID or password could not be verified."
    );
  }
}

export async function getStaffPortalSessionCore() {
  const member = await currentWixMember();
  if (!member) return unauthorizedSession({ loggedIn: false, reason: "STAFF_AUTH_REQUIRED" });

  try {
    let agent = await findAgentByMemberReference(member);
    if (!agent) {
      return unauthorizedSession({ loggedIn: true, reason: "STAFF_PROFILE_NOT_FOUND" });
    }

    assertIdentityState(agent);
    agent = await syncMemberLink(agent, member);
    const authorization = await resolveAuthorization(agent);
    return authorizedSession(agent, authorization);
  } catch (error) {
    return unauthorizedSession({
      loggedIn: true,
      reason: clean(error?.code || error?.message, 120) || "STAFF_ACCESS_DENIED"
    });
  }
}

export async function requireStaffPortalSessionCore() {
  const session = await getStaffPortalSessionCore();
  if (!session.loggedIn) throw codedError("STAFF_AUTH_REQUIRED");
  if (!session.authorized) throw codedError(session.reason || "STAFF_ACCESS_DENIED");
  return session;
}

export async function getPortalAppsCore() {
  const session = await requireStaffPortalSessionCore();
  return {
    ok: true,
    apps: session.apps,
    profile: session.profile,
    allowedApps: session.allowedApps,
    permissionKeys: session.permissionKeys,
    permissionGroups: session.permissionGroups,
    accessRole: session.accessRole,
    permissionPreset: session.permissionPreset,
    canManage: session.canManage
  };
}
