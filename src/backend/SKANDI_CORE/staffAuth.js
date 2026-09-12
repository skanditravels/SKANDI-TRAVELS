// /src/backend/SKANDI_CORE/staffAuth.js
// SKANDI Backend Base 1.0 — canonical staff identity + authorization core.
// B-002
//
// Authority chain:
//   Wix Members -> authenticated browser/member session
//   Supabase agent_users -> SKANDI staff identity projection
//   org_employee_assignments -> effective organization assignment
//   org_access_roles -> system access role
//   org_permission_presets -> permissions/apps/groups/management flags
//
// Job titles and departments NEVER grant system permissions by themselves.

import { authentication, currentMember } from "wix-members-backend";
import { restRequest } from "backend/SKANDI_CORE/supabaseServer.js";
import { TtlCache } from "backend/SKANDI_CORE/platformCache.js";
import { SkandiError, errorCode, isTransientHttpStatus } from "backend/SKANDI_CORE/platformErrors.js";
import {
  email,
  firstRow,
  isoDateOnly,
  isValidSkId,
  lower,
  normalizeSkId,
  stringArray,
  text,
  upper
} from "backend/SKANDI_CORE/platformValidation.js";
import { tryWriteStaffLoginAudit } from "backend/SKANDI_CORE/platformAudit.js";

const AGENT_TABLE = "agent_users";
const ASSIGNMENT_TABLE = "org_employee_assignments";
const ACCESS_ROLE_TABLE = "org_access_roles";
const PRESET_TABLE = "org_permission_presets";

const BLOCKED_EMPLOYMENT = new Set(["TERMINATED", "SUSPENDED", "FURLOUGHED", "INACTIVE"]);
const PRIVILEGED_ACCESS_ROLES = new Set(["SUPER_ADMIN", "OWNER", "COMPANY_OWNER"]);
const controlCache = new TtlCache({ ttlMs: 5 * 60 * 1000, maxEntries: 50 });

const APP_CATALOG = Object.freeze({
  altea: Object.freeze({ id:"altea", title:"ALTEA Operations", subtitle:"Reservations, DCS and destination operations", path:"/riaintra/success-factors/altea", group:"Operations", icon:"A" }),
  mail: Object.freeze({ id:"mail", title:"H-Mail", subtitle:"Internal messages and station notices", path:"/riaintra/success-factors/mail", group:"Communication", icon:"M" }),
  grouptalk: Object.freeze({ id:"grouptalk", title:"GroupTalk", subtitle:"Operational communication and team channels", path:"/riaintra/success-factors/altea/grouptalk", group:"Communication", icon:"G" }),
  uniform: Object.freeze({ id:"uniform", title:"Uniform Center", subtitle:"Uniform orders and staff issue", path:"/riaintra/uniform", group:"MyProfile", icon:"U" }),
  myroster: Object.freeze({ id:"myroster", title:"MyRoster", subtitle:"Shifts, duties and assignments", path:"/riaintra/success-factors/my-roster", group:"MyProfile", icon:"R" }),
  payroll: Object.freeze({ id:"payroll", title:"Pay & Time", subtitle:"Payroll and staff pay information", path:"/riaintra/success-factors/my-payroll", group:"MyProfile", icon:"P" }),
  "inventory-control": Object.freeze({ id:"inventory-control", title:"Inventory Control", subtitle:"Product, capacity and aircraft inventory", path:"/riaintra/success-factors/altea/inventory-control", group:"Administration", icon:"I" }),
  hr: Object.freeze({ id:"hr", title:"SuccessFactors", subtitle:"Staff and organization management", path:"/riaintra/success-factors", group:"Administration", icon:"H" }),
  policies: Object.freeze({ id:"policies", title:"Policy Control", subtitle:"Internal policies and controlled documents", path:"/riaintra/success-factors/legal", group:"Administration", icon:"P" })
});

const ALTEA_APPS = Object.freeze([
  Object.freeze({ id:"ardw", title:"Amadeus Altéa Reservation Desktop Web (ARDW)", description:"Create and service passenger name records, air segments, ancillary services, and customer itineraries.", icon:"plane", code:"RESERVATIONS", accent:"#005eb8", path:"/riaintra/success-factors/altea/reservations", groups:Object.freeze(["sales","operations","occ","destination","system-admin"]) }),
  Object.freeze({ id:"inventory", title:"Amadeus Altéa Inventory", description:"Manage SKANDI flight, product, capacity, aircraft and inventory controls.", icon:"inventory", code:"INVENTORY", accent:"#006f8f", path:"/riaintra/success-factors/altea/inventory-control", requiredApp:"inventory-control", groups:Object.freeze(["inventory","system-admin"]) }),
  Object.freeze({ id:"ticketing", title:"Amadeus Ticketing Platform", description:"Issue, revalidate, exchange, refund and audit electronic tickets and EMD transactions.", icon:"barcode", code:"TICKETING", accent:"#3155a6", path:"/riaintra/success-factors/altea/ticketing", groups:Object.freeze(["sales","operations","occ","system-admin"]) }),
  Object.freeze({ id:"pss-dcs", title:"Amadeus Altéa Passenger Service System (PSS / DCS)", description:"Run check-in, seating, baggage, boarding and departure-control workflows.", icon:"passenger", code:"PSS / DCS", accent:"#007a64", path:"/riaintra/success-factors/altea/departure-control", groups:Object.freeze(["airport","operations","occ","system-admin"]) }),
  Object.freeze({ id:"timatic", title:"IATA Timatic (Regulatory & Document Check)", description:"Validate passport, visa, health and destination entry requirements before passenger acceptance.", icon:"passport", code:"DOCUMENT CHECK", accent:"#6650a4", path:"/riaintra/success-factors/altea/timatic", groups:Object.freeze(["sales","airport","destination","operations","occ","system-admin"]) }),
  Object.freeze({ id:"grouptalk", title:"GroupTalk", description:"Operational team communication, voice, field coordination and support channels.", icon:"communication", code:"GROUPTALK", accent:"#005eb8", path:"/riaintra/success-factors/altea/grouptalk", requiredApp:"grouptalk", requiresGroupTalk:true, groups:Object.freeze(["airport","sales","destination","operations","occ","managers","system-admin"]) }),
  Object.freeze({ id:"occ", title:"OCC (Operations Control Center)", description:"Coordinate flights, disruptions, operational recovery and network control.", icon:"arrow", code:"OPERATIONS CONTROL", accent:"#6650a4", path:"/riaintra/success-factors/altea/occ", groups:Object.freeze(["operations","occ","system-admin"]) })
]);

function memberId(member = {}) {
  return text(member?._id || member?.id, 160);
}

function memberEmail(member = {}) {
  const emails = member?.contactDetails?.emails;
  const candidate = Array.isArray(emails) ? emails[0] : emails;
  return email(
    member?.loginEmail ||
    (typeof candidate === "string" ? candidate : candidate?.email) ||
    member?.contactDetails?.email ||
    member?.profile?.email ||
    member?.email
  );
}

function agentSelect() {
  return [
    "id","agent_id","wix_member_id","member_id","contact_id","email","corporate_email_address",
    "sk_id","first_name","last_name","display_name","preferred_name","job_title","position",
    "department","station","base","employment_status","status","active","portal_access","authorized",
    "can_access_payroll","can_access_grouptalk","can_manage","last_login_at","badge_photo_url","company_code",
    "role_id","job_code","job_level","department_id","department_code","base_code","destination_code",
    "country_code","manager_agent_user_id","manager_role_id","manager_sk_id","manager_email","access_role",
    "permission_preset","permission_keys","allowed_apps","permission_groups","org_assignment_version",
    "org_assignment_source","role"
  ].join(",");
}

function safeOrValue(value) {
  const clean = text(value, 320);
  return /[(),]/.test(clean) ? "" : clean;
}

function isTransientReadError(error) {
  const status = Number(error?.status || 0);
  return isTransientHttpStatus(status) || /SUPABASE_(NETWORK_ERROR|HTTP_(429|502|503|504))/.test(errorCode(error));
}

async function select(table, query = {}) {
  const started = Date.now();
  try {
    const result = await restRequest({ table, method:"GET", query, prefer:"" });
    return Array.isArray(result) ? result : [];
  } catch (error) {
    // One quick retry is allowed only for read failures that return promptly.
    // A full gateway/database timeout is not immediately repeated.
    if (!isTransientReadError(error) || Date.now() - started > 2500) throw error;
    await new Promise((resolve) => setTimeout(resolve, 250));
    const result = await restRequest({ table, method:"GET", query, prefer:"" });
    return Array.isArray(result) ? result : [];
  }
}

async function currentWixMember() {
  try {
    return await currentMember.getMember({ fieldsets:["FULL"] }) || null;
  } catch (_) {
    return null;
  }
}

async function findAgentBySkId(skId) {
  const value = normalizeSkId(skId);
  if (!value) return null;
  return firstRow(await select(AGENT_TABLE, {
    select: agentSelect(),
    sk_id: `eq.${value}`,
    limit: 1
  }));
}

async function findAgentByMember(member = {}) {
  const wixId = safeOrValue(memberId(member));
  const wixEmail = safeOrValue(memberEmail(member));
  const filters = [];
  if (wixId) filters.push(`wix_member_id.eq.${wixId}`, `member_id.eq.${wixId}`);
  if (wixEmail) filters.push(`corporate_email_address.ilike.${wixEmail}`, `email.ilike.${wixEmail}`);
  if (!filters.length) return null;

  // Deliberately ONE identity request. Do not reintroduce serial probes.
  const rows = await select(AGENT_TABLE, {
    select: agentSelect(),
    or: `(${filters.join(",")})`,
    limit: 8
  });

  if (wixId) {
    const direct = rows.find((row) => text(row?.wix_member_id, 160) === wixId) ||
      rows.find((row) => text(row?.member_id, 160) === wixId);
    if (direct) return direct;
  }
  if (wixEmail) {
    return rows.find((row) => email(row?.corporate_email_address) === wixEmail) ||
      rows.find((row) => email(row?.email) === wixEmail) || null;
  }
  return null;
}

function assertIdentity(agent) {
  if (!agent) throw new SkandiError("STAFF_PROFILE_NOT_FOUND");
  if (agent.active !== true) throw new SkandiError("STAFF_PROFILE_INACTIVE");
  if (agent.authorized !== true) throw new SkandiError("STAFF_PROFILE_NOT_AUTHORIZED");
  if (agent.portal_access !== true) throw new SkandiError("STAFF_PROFILE_PORTAL_DISABLED");
  const status = upper(agent.employment_status || agent.status, 80);
  if (BLOCKED_EMPLOYMENT.has(status)) throw new SkandiError(`STAFF_EMPLOYMENT_${status}`);
}

async function syncMemberLink(agent, member) {
  const wixId = memberId(member);
  if (!agent?.id || !wixId) return agent;

  const existingWix = text(agent.wix_member_id, 160);
  const existingMember = text(agent.member_id, 160);
  if ((existingWix && existingWix !== wixId) || (existingMember && existingMember !== wixId)) {
    throw new SkandiError("WIX_MEMBER_LINK_MISMATCH");
  }

  const now = new Date();
  const lastLogin = Date.parse(text(agent.last_login_at, 80));
  const patch = {};
  if (!existingWix) patch.wix_member_id = wixId;
  if (!existingMember) patch.member_id = wixId;
  if (!Number.isFinite(lastLogin) || now.getTime() - lastLogin >= 15 * 60 * 1000) {
    patch.last_login_at = now.toISOString();
  }
  if (!Object.keys(patch).length) return agent;
  patch.updated_at = now.toISOString();

  const rows = await restRequest({
    table: AGENT_TABLE,
    method: "PATCH",
    query: { id: `eq.${agent.id}` },
    body: patch
  });
  return firstRow(rows) || { ...agent, ...patch };
}

async function loadAssignment(agentId) {
  const id = text(agentId, 80);
  if (!id) return null;
  const today = isoDateOnly();
  const rows = await select(ASSIGNMENT_TABLE, {
    select: "id,agent_user_id,company_code,role_id,job_code,department_id,base_code,manager_agent_user_id,manager_role_id,access_role,permission_preset_id,effective_from,effective_to,active,source,updated_at",
    agent_user_id: `eq.${id}`,
    active: "eq.true",
    effective_from: `lte.${today}`,
    or: `(effective_to.is.null,effective_to.gte.${today})`,
    order: "effective_from.desc",
    limit: 5
  });
  return rows.find((row) => row?.active === true) || null;
}

async function loadAccessRole(code) {
  const key = upper(code, 80);
  if (!key) return null;
  return controlCache.getOrLoad(`role:${key}`, async () => firstRow(await select(ACCESS_ROLE_TABLE, {
    select: "access_role_code,purpose,preset_id,provisioning_rule,restricted,active",
    access_role_code: `eq.${key}`,
    limit: 1
  })));
}

async function loadPreset(id) {
  const key = text(id, 100);
  if (!key) return null;
  return controlCache.getOrLoad(`preset:${key}`, async () => firstRow(await select(PRESET_TABLE, {
    select: "preset_id,name,description,permission_keys,allowed_apps,permission_groups,grouptalk_group_keys,can_manage,can_access_payroll,can_access_grouptalk,is_hr,is_payroll_admin,is_system_admin,active",
    preset_id: `eq.${key}`,
    limit: 1
  })));
}

async function resolveAuthorization(agent) {
  assertIdentity(agent);
  const assignment = await loadAssignment(agent.id);
  const accessRoleCode = upper(assignment?.access_role || agent.access_role || agent.role, 80);
  if (!accessRoleCode) throw new SkandiError("STAFF_ACCESS_ROLE_MISSING");

  const accessRole = await loadAccessRole(accessRoleCode);
  if (!accessRole || accessRole.active !== true) throw new SkandiError("STAFF_ACCESS_ROLE_INVALID");

  const presetId = text(
    assignment?.permission_preset_id || accessRole.preset_id || agent.permission_preset,
    100
  );
  if (!presetId) throw new SkandiError("STAFF_PERMISSION_PRESET_MISSING");

  const preset = await loadPreset(presetId);
  if (!preset || preset.active !== true) throw new SkandiError("STAFF_PERMISSION_PRESET_INVALID");

  return {
    assignment,
    accessRole,
    preset,
    accessRoleCode,
    presetId,
    permissionKeys: stringArray(preset.permission_keys),
    allowedApps: stringArray(preset.allowed_apps),
    permissionGroups: stringArray(preset.permission_groups),
    groupTalkGroupKeys: stringArray(preset.grouptalk_group_keys),
    canManage: preset.can_manage === true,
    canAccessPayroll: preset.can_access_payroll === true,
    canAccessGroupTalk: preset.can_access_grouptalk === true,
    isHr: preset.is_hr === true,
    isPayrollAdmin: preset.is_payroll_admin === true,
    isSystemAdmin: preset.is_system_admin === true
  };
}

function displayName(agent = {}) {
  return text(
    agent.preferred_name ||
    agent.display_name ||
    [agent.first_name, agent.last_name].filter(Boolean).join(" ") ||
    agent.corporate_email_address || agent.email || agent.sk_id || "Staff",
    180
  );
}

function publicProfile(agent, auth) {
  const assignment = auth.assignment || {};
  return {
    id: text(agent.id, 80),
    agentUserId: text(agent.id, 80),
    agentId: text(agent.agent_id, 120),
    skId: normalizeSkId(agent.sk_id),
    firstName: text(agent.first_name, 100),
    lastName: text(agent.last_name, 100),
    preferredName: text(agent.preferred_name, 100),
    displayName: displayName(agent),
    fullName: displayName(agent),
    email: email(agent.corporate_email_address || agent.email),
    corporateEmailAddress: email(agent.corporate_email_address || agent.email),
    jobTitle: text(agent.job_title || agent.position, 180),
    position: text(agent.position || agent.job_title, 180),
    roleId: text(assignment.role_id || agent.role_id, 80),
    jobCode: text(assignment.job_code || agent.job_code, 80),
    jobLevel: text(agent.job_level, 80),
    departmentId: text(assignment.department_id || agent.department_id, 80),
    departmentCode: text(agent.department_code, 80),
    department: text(agent.department, 180),
    baseCode: text(assignment.base_code || agent.base_code, 80),
    base: text(agent.base || agent.station, 160),
    station: text(agent.station || agent.base, 160),
    destinationCode: text(agent.destination_code, 80),
    countryCode: upper(agent.country_code, 8),
    employmentStatus: text(agent.employment_status || agent.status, 80),
    accessRole: auth.accessRoleCode,
    role: auth.accessRoleCode,
    permissionPreset: auth.presetId,
    permissionKeys: [...auth.permissionKeys],
    allowedApps: [...auth.allowedApps],
    permissionGroups: [...auth.permissionGroups],
    canManage: auth.canManage,
    canUsePayroll: auth.canAccessPayroll,
    canUseGroupTalk: auth.canAccessGroupTalk,
    isHr: auth.isHr,
    isPayrollAdmin: auth.isPayrollAdmin,
    isSystemAdmin: auth.isSystemAdmin,
    badgePhotoUrl: text(agent.badge_photo_url, 1200),
    organizationSource: text(assignment.source || agent.org_assignment_source, 120)
  };
}

function isWildcardAllowed(values = []) {
  const set = new Set(stringArray(values).map((value) => lower(value, 100)));
  return set.has("*") || set.has("all");
}

function portalApps(auth) {
  const allowed = new Set(auth.allowedApps.map((value) => lower(value, 100)));
  const privileged = PRIVILEGED_ACCESS_ROLES.has(auth.accessRoleCode) || auth.isSystemAdmin || isWildcardAllowed(auth.allowedApps);
  return Object.values(APP_CATALOG)
    .filter((app) => privileged || allowed.has(app.id))
    .map((app) => ({ ...app }));
}

function alteaApps(session) {
  const allowedApps = new Set(stringArray(session.allowedApps).map((value) => lower(value, 100)));
  const keys = new Set(stringArray(session.permissionKeys).map((value) => lower(value, 100)));
  const groups = new Set(stringArray(session.permissionGroups).map((value) => lower(value, 100)));
  const privileged = PRIVILEGED_ACCESS_ROLES.has(upper(session.accessRole, 80)) || session.isSystemAdmin === true || groups.has("system-admin") || isWildcardAllowed(session.allowedApps);
  const alteaAllowed = privileged || allowedApps.has("altea") || keys.has("altea");

  return ALTEA_APPS.filter((app) => {
    if (privileged) return true;
    if (!alteaAllowed) return false;
    if (app.requiredApp) {
      const required = lower(app.requiredApp, 100);
      if (!allowedApps.has(required) && !keys.has(required)) return false;
    }
    if (app.requiresGroupTalk && session.canAccessGroupTalk !== true) return false;
    const requiredGroups = stringArray(app.groups).map((value) => lower(value, 100));
    return !requiredGroups.length || requiredGroups.some((group) => groups.has(group));
  }).map((app) => ({
    id: app.id,
    title: app.title,
    description: app.description,
    icon: app.icon,
    code: app.code,
    accent: app.accent,
    path: app.path
  }));
}

function unauthorized({ loggedIn = false, reason = "STAFF_AUTH_REQUIRED" } = {}) {
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
    canManage: false,
    canAccessPayroll: false,
    canAccessGroupTalk: false,
    isHr: false,
    isPayrollAdmin: false,
    isSystemAdmin: false
  };
}

function authorized(agent, auth) {
  const profile = publicProfile(agent, auth);
  return {
    ok: true,
    loggedIn: true,
    authorized: true,
    reason: "",
    profile,
    agent: profile,
    apps: portalApps(auth),
    allowedApps: [...auth.allowedApps],
    permissionKeys: [...auth.permissionKeys],
    permissionGroups: [...auth.permissionGroups],
    permissions: [...auth.permissionKeys],
    accessRole: auth.accessRoleCode,
    permissionPreset: auth.presetId,
    canManage: auth.canManage,
    canAccessPayroll: auth.canAccessPayroll,
    canAccessGroupTalk: auth.canAccessGroupTalk,
    isHr: auth.isHr,
    isPayrollAdmin: auth.isPayrollAdmin,
    isSystemAdmin: auth.isSystemAdmin,
    organization: {
      roleId: profile.roleId,
      jobCode: profile.jobCode,
      departmentId: profile.departmentId,
      baseCode: profile.baseCode,
      source: profile.organizationSource
    }
  };
}

function loginToken(result) {
  if (typeof result === "string") return text(result, 8000);
  return text(result?.sessionToken || result?.session_token || result?.token, 8000);
}

function publicLoginMessage(code) {
  const map = {
    STAFF_PROFILE_NOT_FOUND: "No active SKANDI staff profile is linked to this SK-ID.",
    STAFF_PROFILE_INACTIVE: "This staff account is inactive.",
    STAFF_PROFILE_NOT_AUTHORIZED: "This staff account is not authorized for RIAINTRA.",
    STAFF_PROFILE_PORTAL_DISABLED: "Portal access is disabled for this staff account.",
    STAFF_ACCESS_ROLE_MISSING: "No system access role is assigned to this staff account.",
    STAFF_ACCESS_ROLE_INVALID: "The assigned system access role is not active.",
    STAFF_PERMISSION_PRESET_MISSING: "No permission preset is assigned to this staff account.",
    STAFF_PERMISSION_PRESET_INVALID: "The assigned permission preset is not active."
  };
  return map[code] || "The SK-ID or password could not be verified.";
}

export async function loginStaffWithSkIdCore({ skId, password } = {}) {
  const cleanSkId = normalizeSkId(skId);
  const cleanPassword = typeof password === "string" ? password : "";
  if (!isValidSkId(cleanSkId)) {
    throw new SkandiError("STAFF_SK_ID_INVALID", "Invalid SK-ID.", { publicMessage:"Enter a valid SK-ID in the AA0000 format." });
  }
  if (!cleanPassword.trim()) throw new SkandiError("STAFF_PASSWORD_REQUIRED", "Password is required.", { publicMessage:"Enter your password." });
  if (cleanPassword.length > 256) throw new SkandiError("STAFF_PASSWORD_TOO_LONG", "Password is too long.");

  let agent = null;
  let loginEmail = "";
  try {
    agent = await findAgentBySkId(cleanSkId);
    assertIdentity(agent);
    const auth = await resolveAuthorization(agent);
    loginEmail = email(agent.corporate_email_address || agent.email);
    if (!loginEmail) throw new SkandiError("STAFF_LOGIN_EMAIL_MISSING");

    const token = loginToken(await authentication.login(loginEmail, cleanPassword));
    if (!token) throw new SkandiError("WIX_SESSION_TOKEN_MISSING");

    await tryWriteStaffLoginAudit({
      agentUserId: agent.id,
      skId: cleanSkId,
      emailAddress: loginEmail,
      eventType: "STAFF_LOGIN_OK",
      success: true
    });

    const session = authorized(agent, auth);
    return {
      ok: true,
      sessionToken: token,
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
    const code = errorCode(error, "STAFF_LOGIN_FAILED");
    await tryWriteStaffLoginAudit({
      agentUserId: agent?.id || null,
      skId: cleanSkId,
      emailAddress: loginEmail,
      eventType: "STAFF_LOGIN_FAILED",
      success: false,
      errorMessage: code
    });
    if (code.startsWith("STAFF_") || code.startsWith("WIX_")) {
      throw new SkandiError(code, code, { publicMessage: publicLoginMessage(code) });
    }
    throw new SkandiError("STAFF_CREDENTIALS_INVALID", "Credentials could not be verified.", { publicMessage:"The SK-ID or password could not be verified." });
  }
}

export async function getStaffPortalSessionCore() {
  const member = await currentWixMember();
  if (!member) return unauthorized({ loggedIn:false, reason:"STAFF_AUTH_REQUIRED" });

  try {
    let agent = await findAgentByMember(member);
    if (!agent) return unauthorized({ loggedIn:true, reason:"STAFF_PROFILE_NOT_FOUND" });
    assertIdentity(agent);
    agent = await syncMemberLink(agent, member);
    return authorized(agent, await resolveAuthorization(agent));
  } catch (error) {
    return unauthorized({
      loggedIn:true,
      reason:errorCode(error, "STAFF_ACCESS_DENIED")
    });
  }
}

export async function requireStaffPortalSessionCore() {
  const session = await getStaffPortalSessionCore();
  if (!session.loggedIn) throw new SkandiError("STAFF_AUTH_REQUIRED");
  if (!session.authorized) throw new SkandiError(session.reason || "STAFF_ACCESS_DENIED");
  return session;
}

export async function getPortalAppsCore() {
  const session = await requireStaffPortalSessionCore();
  return {
    ok:true,
    profile:session.profile,
    apps:session.apps,
    allowedApps:session.allowedApps,
    permissionKeys:session.permissionKeys,
    permissionGroups:session.permissionGroups,
    accessRole:session.accessRole,
    permissionPreset:session.permissionPreset,
    canManage:session.canManage
  };
}

export async function getAlteaLaunchpadAppsCore() {
  const session = await requireStaffPortalSessionCore();
  return {
    ok:true,
    profile:session.profile,
    apps:alteaApps(session),
    accessRole:session.accessRole,
    permissionPreset:session.permissionPreset
  };
}
