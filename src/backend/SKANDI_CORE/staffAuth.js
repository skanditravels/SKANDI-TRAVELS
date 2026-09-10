// /src/backend/SKANDI_CORE/staffAuth.js
// SKANDI Staff Identity & Authorization — canonical implementation.
// R-001 recovery source of truth.
// IMPORTANT: No webMethod wrappers, UI routes, or navigation live in this file.

import { authentication, currentMember } from "wix-members-backend";
import { restRequest } from "../RIA/supabaseServer.js";

const SK_ID_PATTERN = /^[A-Z]{2}[0-9]{4}$/;
const BLOCKED_EMPLOYMENT_STATUSES = new Set([
  "TERMINATED",
  "SUSPENDED",
  "FURLOUGHED",
  "INACTIVE"
]);

function asString(value) {
  return String(value ?? "").trim();
}

function upper(value) {
  return asString(value).toUpperCase();
}

function lower(value) {
  return asString(value).toLowerCase();
}

function stringArray(value) {
  return Array.isArray(value)
    ? [...new Set(value.map((item) => asString(item)).filter(Boolean))]
    : [];
}

function normalizeSkId(value) {
  return upper(value).replace(/[^A-Z0-9]/g, "").slice(0, 6);
}

function memberIdOf(member = {}) {
  return asString(member?._id || member?.id);
}

function memberEmailOf(member = {}) {
  const candidates = [
    member?.loginEmail,
    member?.contactDetails?.email,
    member?.profile?.email,
    ...(Array.isArray(member?.contactDetails?.emails)
      ? member.contactDetails.emails.map((entry) =>
          typeof entry === "string" ? entry : entry?.email
        )
      : [])
  ];

  return lower(candidates.find((value) => asString(value)) || "");
}

function agentEmailOf(agent = {}) {
  return lower(agent.corporate_email_address || agent.email);
}

function firstRow(value) {
  return Array.isArray(value) && value.length ? value[0] : null;
}

async function readOne(query) {
  const rows = await restRequest({
    table: "agent_users",
    query: {
      select: "*",
      ...query,
      limit: 1
    }
  });

  return firstRow(rows);
}

async function findAgentBySkId(skId) {
  return readOne({ sk_id: `eq.${normalizeSkId(skId)}` });
}

async function findAgentByMember(member = {}) {
  const memberId = memberIdOf(member);

  if (memberId) {
    const byWixId = await readOne({ wix_member_id: `eq.${memberId}` });
    if (byWixId) return { agent: byWixId, matchedBy: "wix_member_id" };

    const byMemberId = await readOne({ member_id: `eq.${memberId}` });
    if (byMemberId) return { agent: byMemberId, matchedBy: "member_id" };
  }

  const email = memberEmailOf(member);
  if (email) {
    const byCorporateEmail = await readOne({
      corporate_email_address: `eq.${email}`
    });
    if (byCorporateEmail) {
      return { agent: byCorporateEmail, matchedBy: "corporate_email_address" };
    }

    const byEmail = await readOne({ email: `eq.${email}` });
    if (byEmail) return { agent: byEmail, matchedBy: "email" };
  }

  return { agent: null, matchedBy: "" };
}

function authorizationState(agent) {
  if (!agent) {
    return { authorized: false, reason: "STAFF_PROFILE_NOT_FOUND" };
  }

  if (agent.active !== true) {
    return { authorized: false, reason: "STAFF_ACCOUNT_INACTIVE" };
  }

  if (agent.authorized !== true) {
    return { authorized: false, reason: "STAFF_NOT_AUTHORIZED" };
  }

  if (agent.portal_access !== true) {
    return { authorized: false, reason: "STAFF_PORTAL_ACCESS_DISABLED" };
  }

  const employmentStatus = upper(agent.employment_status);
  if (BLOCKED_EMPLOYMENT_STATUSES.has(employmentStatus)) {
    return {
      authorized: false,
      reason: `STAFF_EMPLOYMENT_${employmentStatus}`
    };
  }

  return { authorized: true, reason: "" };
}

function publicProfile(agent = {}) {
  const permissionKeys = stringArray(agent.permission_keys);
  const allowedApps = stringArray(agent.allowed_apps);
  const permissionGroups = stringArray(agent.permission_groups);
  const accessRole = upper(agent.access_role || agent.role);
  const permissionPreset = asString(agent.permission_preset);

  const firstName = asString(agent.first_name);
  const lastName = asString(agent.last_name);
  const displayName =
    asString(agent.display_name) ||
    asString(agent.preferred_name) ||
    [firstName, lastName].filter(Boolean).join(" ") ||
    asString(agent.sk_id);

  return {
    id: asString(agent.id),
    agentUserId: asString(agent.id),
    agentId: asString(agent.agent_id),
    skId: normalizeSkId(agent.sk_id),

    email: agentEmailOf(agent),
    corporateEmailAddress: lower(agent.corporate_email_address),
    wixMemberId: asString(agent.wix_member_id),
    memberId: asString(agent.member_id),

    firstName,
    lastName,
    preferredName: asString(agent.preferred_name),
    displayName,
    fullName: displayName,

    companyCode: upper(agent.company_code),
    roleId: asString(agent.role_id),
    jobCode: asString(agent.job_code),
    jobTitle: asString(agent.job_title || agent.position),
    position: asString(agent.job_title || agent.position),
    jobLevel: asString(agent.job_level),

    department: asString(agent.department),
    departmentId: asString(agent.department_id),
    departmentCode: upper(agent.department_code),

    base: asString(agent.base),
    baseCode: upper(agent.base_code),
    station: upper(agent.station),
    destinationCode: upper(agent.destination_code),
    countryCode: upper(agent.country_code),

    managerName: asString(agent.manager_name),
    managerAgentUserId: asString(agent.manager_agent_user_id),
    managerRoleId: asString(agent.manager_role_id),
    managerSkId: normalizeSkId(agent.manager_sk_id),
    managerEmail: lower(agent.manager_email),

    accessRole,
    role: accessRole,
    permissionPreset,
    permissionKeys,
    permissions: permissionKeys,
    allowedApps,
    permissionGroups,

    canManage: agent.can_manage === true,
    canAccessPayroll: agent.can_access_payroll === true,
    canAccessGroupTalk: agent.can_access_grouptalk === true,

    employmentStatus: asString(agent.employment_status),
    status: asString(agent.status),
    active: agent.active === true,
    authorized: agent.authorized === true,
    portalAccess: agent.portal_access === true,

    badgePhotoUrl: asString(agent.badge_photo_url),
    orgAssignmentVersion: Number(agent.org_assignment_version || 0),
    orgAssignmentSource: asString(agent.org_assignment_source)
  };
}

function publicApps(agent = {}) {
  return stringArray(agent.allowed_apps).map((id) => ({
    id,
    key: id,
    permission: id
  }));
}

function sessionPayload(agent, overrides = {}) {
  const auth = authorizationState(agent);
  const profile = agent ? publicProfile(agent) : null;
  const permissions = profile?.permissionKeys || [];
  const allowedApps = profile?.allowedApps || [];
  const permissionGroups = profile?.permissionGroups || [];

  return {
    ok: auth.authorized,
    loggedIn: overrides.loggedIn === true,
    authorized: auth.authorized,
    reason: auth.reason,
    profile,
    agent: profile,

    accessRole: profile?.accessRole || "",
    permissionPreset: profile?.permissionPreset || "",
    permissionGroups,
    permissionKeys: permissions,
    permissions,
    allowedApps,
    apps: agent ? publicApps(agent) : [],

    canManage: profile?.canManage === true,
    canAccessPayroll: profile?.canAccessPayroll === true,
    canAccessGroupTalk: profile?.canAccessGroupTalk === true,

    ...overrides
  };
}

async function audit({
  agent = null,
  skId = "",
  email = "",
  eventType,
  success,
  errorMessage = ""
}) {
  try {
    await restRequest({
      table: "staff_login_audit",
      method: "POST",
      body: {
        agent_user_id: agent?.id || null,
        sk_id: normalizeSkId(skId || agent?.sk_id) || null,
        email: lower(email || agentEmailOf(agent)) || null,
        event_type: asString(eventType),
        success: success === true,
        error_message: asString(errorMessage).slice(0, 500) || null
      }
    });
  } catch (error) {
    console.warn("[SKANDI Staff Auth] Audit write failed.", error);
  }
}

async function touchSuccessfulLogin(agent) {
  if (!agent?.id) return;

  try {
    await restRequest({
      table: "agent_users",
      method: "PATCH",
      query: { id: `eq.${agent.id}` },
      body: {
        last_login_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.warn("[SKANDI Staff Auth] Could not update last_login_at.", error);
  }
}

async function linkAuthenticatedMemberIfSafe(agent, member) {
  if (!agent?.id) return agent;

  const memberId = memberIdOf(member);
  if (!memberId) return agent;

  const existingIds = [
    asString(agent.wix_member_id),
    asString(agent.member_id)
  ].filter(Boolean);

  if (existingIds.length && !existingIds.includes(memberId)) {
    return agent;
  }

  const update = {};
  if (!asString(agent.wix_member_id)) update.wix_member_id = memberId;
  if (!asString(agent.member_id)) update.member_id = memberId;

  if (!Object.keys(update).length) return agent;

  update.updated_at = new Date().toISOString();

  const rows = await restRequest({
    table: "agent_users",
    method: "PATCH",
    query: { id: `eq.${agent.id}` },
    body: update
  });

  return firstRow(rows) || { ...agent, ...update };
}

function publicLoginError(error) {
  const raw = [
    error?.code,
    error?.message,
    error
  ]
    .map((value) => lower(value))
    .join(" ");

  if (
    raw.includes("invalid credential") ||
    raw.includes("incorrect password") ||
    raw.includes("wrong password") ||
    raw.includes("member not found") ||
    raw.includes("unknown sk-id") ||
    raw.includes("staff_profile_not_found")
  ) {
    return "The SK-ID or password is incorrect.";
  }

  if (
    raw.includes("too many") ||
    raw.includes("rate limit") ||
    raw.includes("thrott")
  ) {
    return "Too many sign-in attempts. Please wait and try again.";
  }

  if (
    raw.includes("inactive") ||
    raw.includes("terminated") ||
    raw.includes("suspended") ||
    raw.includes("furloughed") ||
    raw.includes("portal_access") ||
    raw.includes("not_authorized")
  ) {
    return "This account is not authorized for the staff portal.";
  }

  return "Unable to sign in. Please try again.";
}

function sessionTokenFromLogin(result) {
  if (typeof result === "string") return result.trim();

  return asString(
    result?.sessionToken ||
    result?.session_token ||
    result?.token
  );
}

export async function loginStaffWithSkIdCore({ skId, password } = {}) {
  const cleanSkId = normalizeSkId(skId);
  const cleanPassword = typeof password === "string" ? password : "";

  if (!SK_ID_PATTERN.test(cleanSkId)) {
    throw new Error("Enter a valid SK-ID in the AA0000 format.");
  }

  if (!cleanPassword.trim()) {
    throw new Error("Password is required.");
  }

  if (cleanPassword.length > 256) {
    throw new Error("The password is too long.");
  }

  let agent = null;

  try {
    agent = await findAgentBySkId(cleanSkId);
    const auth = authorizationState(agent);

    if (!auth.authorized) {
      throw new Error(auth.reason || "STAFF_NOT_AUTHORIZED");
    }

    const email = agentEmailOf(agent);
    if (!email) {
      throw new Error("STAFF_LOGIN_EMAIL_MISSING");
    }

    const loginResult = await authentication.login(email, cleanPassword);
    const sessionToken = sessionTokenFromLogin(loginResult);

    if (!sessionToken) {
      throw new Error("WIX_SESSION_TOKEN_MISSING");
    }

    await Promise.all([
      touchSuccessfulLogin(agent),
      audit({
        agent,
        eventType: "login_attempt",
        success: true
      })
    ]);

    return {
      ...sessionPayload(agent, {
        loggedIn: false,
        ok: true,
        authorized: true
      }),
      success: true,
      sessionToken
    };
  } catch (error) {
    await audit({
      agent,
      skId: cleanSkId,
      eventType: "login_failed",
      success: false,
      errorMessage: asString(error?.message || error)
    });

    throw new Error(publicLoginError(error));
  }
}

export async function getStaffPortalSessionCore() {
  let member = null;

  try {
    member = await currentMember.getMember({ fieldsets: ["FULL"] });
  } catch (_) {
    return sessionPayload(null, {
      ok: true,
      loggedIn: false,
      authorized: false,
      reason: "NOT_LOGGED_IN"
    });
  }

  if (!member) {
    return sessionPayload(null, {
      ok: true,
      loggedIn: false,
      authorized: false,
      reason: "NOT_LOGGED_IN"
    });
  }

  const match = await findAgentByMember(member);
  let agent = match.agent;

  if (!agent) {
    await audit({
      email: memberEmailOf(member),
      eventType: "session_check",
      success: false,
      errorMessage: "Authenticated Wix member is not linked to agent_users."
    });

    return sessionPayload(null, {
      ok: false,
      loggedIn: true,
      authorized: false,
      reason: "STAFF_PROFILE_NOT_FOUND"
    });
  }

  try {
    agent = await linkAuthenticatedMemberIfSafe(agent, member);
  } catch (error) {
    console.warn("[SKANDI Staff Auth] Safe member-link update failed.", error);
  }

  const auth = authorizationState(agent);

  await audit({
    agent,
    eventType: "session_check",
    success: auth.authorized,
    errorMessage: auth.authorized ? "" : auth.reason
  });

  return sessionPayload(agent, {
    ok: auth.authorized,
    loggedIn: true,
    authorized: auth.authorized,
    reason: auth.reason,
    matchedBy: match.matchedBy
  });
}

export async function getPortalAppsCore() {
  const session = await getStaffPortalSessionCore();

  if (!session.loggedIn || !session.authorized) {
    throw new Error("Staff portal access denied.");
  }

  return {
    ok: true,
    profile: session.profile,
    permissions: session.permissions,
    permissionKeys: session.permissionKeys,
    permissionGroups: session.permissionGroups,
    allowedApps: session.allowedApps,
    apps: session.apps,
    accessRole: session.accessRole,
    permissionPreset: session.permissionPreset,
    canManage: session.canManage,
    canAccessPayroll: session.canAccessPayroll,
    canAccessGroupTalk: session.canAccessGroupTalk
  };
}
