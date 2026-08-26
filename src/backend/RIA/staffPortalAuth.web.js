import {
  webMethod,
  Permissions
} from "wix-web-module";

import {
  authentication,
  currentMember
} from "wix-members-backend";

import {
  restRequest
} from "./supabaseServer.js";

const AGENT_TABLE = "agent_users";
const LOGIN_AUDIT_TABLE = "staff_login_audit";

const AGENT_SELECT = [
  "id",
  "agent_id",
  "member_id",
  "wix_member_id",
  "email",
  "corporate_email_address",
  "sk_id",
  "first_name",
  "last_name",
  "preferred_name",
  "display_name",
  "job_title",
  "department",
  "station",
  "base",
  "active",
  "status",
  "employment_status",
  "portal_access",
  "authorized",
  "badge_photo_url",
  "can_access_payroll",
  "can_access_grouptalk",
  "can_manage",
  "payload",
  "last_login_at"
].join(",");

const BLOCKED_STATUSES = new Set([
  "blocked",
  "inactive",
  "suspended",
  "terminated",
  "archived",
  "disabled"
]);

const BLOCKED_EMPLOYMENT_STATUSES = new Set([
  "suspended",
  "terminated",
  "furloughed",
  "inactive",
  "archived"
]);

const PORTAL_APPS = Object.freeze([
  {
    id: "staff-portal",
    title: "RIAINTRA",
    subtitle: "Staff portal",
    path: "/riaintra/",
    group: "Staff",
    icon: "R"
  },
  {
    id: "success-factors",
    title: "SuccessFactors",
    subtitle: "HR and people operations",
    path: "/riaintra/success-factors",
    group: "Staff",
    icon: "S"
  },
  {
    id: "altea",
    title: "ALTEA",
    subtitle: "Operations platform",
    path: "/riaintra/success-factors/altea",
    group: "Operations",
    icon: "A"
  },
  {
    id: "reservations",
    title: "ALTEA Reservations",
    subtitle: "Reservations platform",
    path: "/riaintra/success-factors/altea/reservations",
    group: "Operations",
    icon: "AR"
  },
  {
    id: "ticketing",
    title: "ALTEA Ticketing",
    subtitle: "Ticketing platform",
    path: "/riaintra/success-factors/altea/ticketing",
    group: "Operations",
    icon: "AT"
  },
  {
    id: "timatic",
    title: "ALTEA Timatic",
    subtitle: "Timatic Passenger Document Compliance Check",
    path: "/riaintra/success-factors/altea/timatic",
    group: "Operations",
    icon: "AT"
  },
  {
    id: "occ",
    title: "ALTEA OCC",
    subtitle: "OPS Operational Control Center",
    path: "/riaintra/success-factors/altea/occ",
    group: "Operations",
    icon: "AOCC"
  },
  {
    id: "dcs",
    title: "ALTEA Departure Control",
    subtitle: "Customer Management / Departure Control",
    path: "/riaintra/success-factors/altea/departure-control",
    group: "Operations",
    icon: "ADC"
  },
  {
    id: "mail",
    title: "Mail",
    subtitle: "Internal messages",
    path: "/riaintra/mail",
    group: "Communication",
    icon: "M"
  },
  {
    id: "inventory",
    title: "ALTEA Inventory Control",
    subtitle: "SKANDI's travel inventory center",
    path: "/riaintra/success-factors/altea/inventory-control",
    group: "Operations",
    icon: "AI"
  },
  {
    id: "grouptalk",
    title: "GroupTalk",
    subtitle: "Operational team communication",
    path: "/riaintra/success-factors/alteagrouptalk",
    group: "Communication",
    icon: "APTT"
  },
  {
    id: "docunet",
    title: "DocuNet",
    subtitle: "Internal documents and manuals library",
    path: "/riaintra/success-factors/docunet",
    group: "Operations",
    icon: "D"
  },
  {
    id: "helpdesk",
    title: "HelpDesk",
    subtitle: "Internal support",
    path: "/riaintra/success-factors/helpdesk",
    group: "Support",
    icon: "HD"
  },
  {
    id: "finance",
    title: "Finance Center",
    subtitle: "Corporate Finance Portal",
    path: "/riaintra/success-factors/finance-control",
    group: "Administration",
    icon: "FC",
    permission: "excecutive"
  },
  {
    id: "uniform-center",
    title: "Uniform Center",
    subtitle: "Employee Uniform Portal",
    path: "/riaintra/success-factors/uniform",
    group: "Staff",
    icon: "UC"
  },
  {
    id: "storeadmin",
    title: "THE STORE Admin",
    subtitle: "THE STORE Admin Portal",
    path: "/riaintra/success-factors/store-admin",
    group: "administration",
    icon: "SA",
    permission: "store"
  },
  {
    id: "uniform-control",
    title: "Uniform Control",
    subtitle: "Admin UC Portal",
    path: "/riaintra/success-factors/uniform/uniform-control",
    group: "Administration",
    icon: "UCC",
    permission: "uniform"
  },
  {
    id: "mediacontrol",
    title: "Media Control",
    subtitle: "Newsroom, VOY & Marketing Portal",
    path: "/riaintra/success-factors/media-control",
    group: "Administration",
    icon: "MM",
    permission: "media"
  },
  {
    id: "my-payroll",
    title: "MyPayroll",
    subtitle: "Employee Payroll Portal",
    path: "/riaintra/success-factors/my-payroll",
    group: "Staff",
    icon: "P"
  },
  {
    id: "payroll",
    title: "Payroll Admin",
    subtitle: "Admin Payroll Portal",
    path: "/riaintra/success-factors/my-payroll/payroll-admin",
    group: "Administration",
    icon: "PA",
    permission: "payroll"
  }
]);

function clean(value, max = 5000) {
  return String(value ?? "").trim().slice(0, max);
}

function normalizeSkId(value) {
  return clean(value, 32).replace(/\s+/g, "").toUpperCase();
}

function normalizeEmail(value) {
  return clean(value, 254).toLowerCase();
}

function first(rows) {
  return Array.isArray(rows) && rows.length ? rows[0] : null;
}

function isValidSkId(value) {
  return /^[A-Z]{2,4}\d{4}$/i.test(value);
}

function memberEmail(member = {}) {
  const emails = member?.contactDetails?.emails;
  const contactEmail = Array.isArray(emails) ? emails[0] : emails;

  return normalizeEmail(
    member.loginEmail ||
    contactEmail ||
    member?.profile?.email ||
    member.email ||
    ""
  );
}

function agentLoginEmail(agent = {}) {
  return normalizeEmail(
    agent.corporate_email_address ||
    agent.email ||
    ""
  );
}

function displayName(agent = {}) {
  return clean(
    agent.preferred_name ||
    agent.display_name ||
    [agent.first_name, agent.last_name].filter(Boolean).join(" ") ||
    agent.email ||
    agent.sk_id ||
    "Staff",
    160
  );
}

function normalizedRole(agent = {}) {
  return clean(
    agent.role ||
    agent.position ||
    agent.job_title ||
    "",
    120
  );
}

function publicAgent(agent = {}) {
  return {
    id: agent.id || "",
    agentId: agent.agent_id || "",
    skId: agent.sk_id || "",
    firstName: agent.first_name || "",
    lastName: agent.last_name || "",
    preferredName: agent.preferred_name || "",
    displayName: displayName(agent),
    name: displayName(agent),
    email: agentLoginEmail(agent),
    corporateEmailAddress: normalizeEmail(agent.corporate_email_address),
    jobTitle: agent.job_title || agent.position || "",
    department: agent.department || "",
    station: agent.station || agent.base || "",
    base: agent.base || agent.station || "",
    employmentStatus: agent.employment_status || "",
    status: agent.status || "",
    active: agent.active === true,
    portalAccess: agent.portal_access === true,
    authorized: agent.authorized === true,
    canManage: agent.can_manage === true,
    permissions: {
      payroll: agent.can_access_payroll === true,
      groupTalk: agent.can_access_grouptalk === true,
      manage: agent.can_manage === true
    }
  };
}

function payloadPermissions(agent = {}) {
  const payload =
    agent.payload && typeof agent.payload === "object"
      ? agent.payload
      : {};

  const values = [
    payload.permissions,
    payload.apps,
    payload.access,
    payload.accessRoles
  ];

  const output = new Set();

  const visit = (value) => {
    if (!value) return;

    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }

    if (typeof value === "object") {
      Object.entries(value).forEach(([key, enabled]) => {
        if (enabled === true) {
          output.add(String(key).trim().toLowerCase());
        } else {
          visit(enabled);
        }
      });
      return;
    }

    output.add(String(value).trim().toLowerCase());
  };

  values.forEach(visit);
  return output;
}

function appsForAgent(agent = {}) {
  if (agent.can_manage === true) {
    return PORTAL_APPS.map(({ permission, ...safe }) => safe);
  }

  const permissions = payloadPermissions(agent);

  return PORTAL_APPS
    .filter((app) => {
      if (!app.permission) return true;

      if (app.permission === "payroll") {
        return (
          agent.can_access_payroll === true ||
          permissions.has("payroll") ||
          permissions.has("all")
        );
      }

      return (
        permissions.has(app.id) ||
        permissions.has(app.permission) ||
        permissions.has("all")
      );
    })
    .filter((app) => {
      if (app.id === "grouptalk") {
        return (
          agent.can_access_grouptalk === true ||
          permissions.has("grouptalk") ||
          permissions.has("all")
        );
      }

      return true;
    })
    .map(({ permission, ...safe }) => safe);
}

async function findAgentBySkId(skId) {
  const value = normalizeSkId(skId);

  if (!value) {
    return null;
  }

  return first(
    await restRequest({
      table: "agent_users",
      query: {
        select: AGENT_SELECT,
        sk_id: `eq.${value}`,
        limit: 1
      }
    })
  );
}

async function findAgentByWixMemberId(memberId) {
  const value = clean(memberId, 100);
  if (!value) return null;

  let row = first(
    await restRequest({
      table: AGENT_TABLE,
      query: {
        select: AGENT_SELECT,
        wix_member_id: `eq.${value}`,
        limit: 1
      }
    })
  );

  if (row) return row;

  return first(
    await restRequest({
      table: AGENT_TABLE,
      query: {
        select: AGENT_SELECT,
        member_id: `eq.${value}`,
        limit: 1
      }
    })
  );
}

async function findAgentByEmail(email) {
  const value = normalizeEmail(email);
  if (!value) return null;

  let row = first(
    await restRequest({
      table: AGENT_TABLE,
      query: {
        select: AGENT_SELECT,
        email: `ilike.${value}`,
        limit: 1
      }
    })
  );

  if (row) return row;

  return first(
    await restRequest({
      table: AGENT_TABLE,
      query: {
        select: AGENT_SELECT,
        corporate_email_address: `ilike.${value}`,
        limit: 1
      }
    })
  );
}

async function findAgentForMember(member) {
  const memberId = clean(member?._id || member?.id || "", 100);
  const email = memberEmail(member);

  const linked = await findAgentByWixMemberId(memberId);

  if (linked) {
    return {
      agent: linked,
      memberId,
      email,
      matchedBy: "member_id"
    };
  }

  const byEmail = await findAgentByEmail(email);

  if (!byEmail) {
    return {
      agent: null,
      memberId,
      email,
      matchedBy: ""
    };
  }

  const existingLinks = [
    clean(byEmail.wix_member_id, 100),
    clean(byEmail.member_id, 100)
  ].filter(Boolean);

  if (
    existingLinks.length &&
    memberId &&
    !existingLinks.includes(memberId)
  ) {
    throw new Error("WIX_MEMBER_LINK_MISMATCH");
  }

  return {
    agent: byEmail,
    memberId,
    email,
    matchedBy: "email"
  };
}

function accessFailureCode(agent) {
  if (!agent) return "AGENT_NOT_FOUND";
  if (agent.active !== true) return "AGENT_INACTIVE";
  if (agent.portal_access !== true) return "PORTAL_ACCESS_DISABLED";
  if (agent.authorized !== true) return "AGENT_NOT_AUTHORIZED";

  const status = clean(agent.status, 80).toLowerCase();
  if (BLOCKED_STATUSES.has(status)) {
    return "AGENT_STATUS_BLOCKED";
  }

  const employmentStatus =
    clean(agent.employment_status, 80).toLowerCase();

  if (BLOCKED_EMPLOYMENT_STATUSES.has(employmentStatus)) {
    return "EMPLOYMENT_STATUS_BLOCKED";
  }

  return "";
}

function assertAuthorized(agent) {
  const code = accessFailureCode(agent);
  if (!code) return;

  const messages = {
    AGENT_NOT_FOUND: "Staff profile not found.",
    AGENT_INACTIVE: "This staff account is inactive.",
    PORTAL_ACCESS_DISABLED:
      "This staff account does not have RIAINTRA portal access.",
    AGENT_NOT_AUTHORIZED:
      "This staff account is not authorized for RIAINTRA.",
    AGENT_STATUS_BLOCKED: "This staff account is blocked.",
    EMPLOYMENT_STATUS_BLOCKED:
      "This staff account cannot access RIAINTRA because its employment status is not active."
  };

  const error = new Error(
    messages[code] ||
    "Staff portal access denied."
  );

  error.code = code;
  throw error;
}

async function syncMemberLink({
  agent,
  memberId,
  email
}) {
  if (!agent?.id || !memberId) {
    return agent;
  }

  const currentWixId = clean(agent.wix_member_id, 100);
  const currentMemberId = clean(agent.member_id, 100);

  if (
    (currentWixId && currentWixId !== memberId) ||
    (currentMemberId && currentMemberId !== memberId)
  ) {
    throw new Error("WIX_MEMBER_LINK_MISMATCH");
  }

  const patch = {
    wix_member_id: memberId,
    member_id: memberId,
    updated_at: new Date().toISOString()
  };

  if (email && !normalizeEmail(agent.email)) {
    patch.email = email;
  }

  const rows = await restRequest({
    table: AGENT_TABLE,
    method: "PATCH",
    query: {
      id: `eq.${agent.id}`
    },
    body: patch
  });

  return first(rows) || {
    ...agent,
    ...patch
  };
}

async function touchLastLogin(agentId) {
  if (!agentId) return;

  await restRequest({
    table: AGENT_TABLE,
    method: "PATCH",
    query: {
      id: `eq.${agentId}`
    },
    body: {
      last_login_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    prefer: "return=minimal"
  });
}

async function loginAudit({
  agent = null,
  skId = null,
  email = null,
  eventType,
  success,
  errorMessage = null
}) {
  try {
    await restRequest({
      table: LOGIN_AUDIT_TABLE,
      method: "POST",
      body: {
        agent_user_id: agent?.id || null,
        sk_id: skId || agent?.sk_id || null,
        email:
          normalizeEmail(
            email ||
            agentLoginEmail(agent || {})
          ) ||
          null,
        event_type: eventType,
        success: Boolean(success),
        error_message: errorMessage || null,
        created_at: new Date().toISOString()
      },
      prefer: "return=minimal"
    });
  } catch (error) {
    console.warn("[RIAINTRA Auth] Audit write failed.", {
      eventType,
      status: error?.message || "unknown"
    });
  }
}

function loggedOutSession(
  code = "WIX_MEMBER_SESSION_REQUIRED"
) {
  return {
    ok: true,
    loggedIn: false,
    authenticated: false,
    authorized: false,
    code,
    profile: null,
    staff: null,
    agent: null,
    apps: [],
    permissions: {}
  };
}

function authorizedSession(agent) {
  const profile = publicAgent(agent);
  const apps = appsForAgent(agent);

  return {
    ok: true,
    loggedIn: true,
    authenticated: true,
    authorized: true,
    profile,
    staff: profile,
    agent: profile,
    skId: profile.skId,
    station: profile.station,
    jobTitle: profile.job_title,
    apps,
    permissions: profile.permissions,
    checkedAt: new Date().toISOString()
  };
}

export const loginStaffWithSkId =
  webMethod(
    Permissions.Anyone,
    async function ({
      skId,
      password
    } = {}) {
      const cleanSkId = normalizeSkId(skId);

      if (!isValidSkId(cleanSkId)) {
        await loginAudit({
          skId: cleanSkId || null,
          eventType: "login_failed",
          success: false,
          errorMessage: "SK_ID_INVALID"
        });

        throw new Error(
          "Enter a valid SK-ID, for example SH1234."
        );
      }

      if (!password || typeof password !== "string") {
        await loginAudit({
          skId: cleanSkId,
          eventType: "login_failed",
          success: false,
          errorMessage: "PASSWORD_REQUIRED"
        });

        throw new Error("Password is required.");
      }

     const agent =
  await findAgentBySkId(cleanSkId);

if (!agent) {
  throw new Error(
    "SK-ID or password is incorrect."
  );
}

const email =
  normalizeEmail(agent.email);

if (!email) {
  throw new Error(
    "This SK-ID is not linked to a Wix email."
  );
}

const sessionToken =
  await authentication.login(
    email,
    password
  );

return {
  ok: true,
  sessionToken,

  profile: {
    skId: agent.sk_id || "",
    jobTitle: agent.job_title || "",
    station: agent.station || "",
    department: agent.department || "",
    badgePhotoUrl:
      agent.badge_photo_url || "",
    email: agent.email || ""
  }
};

export const getStaffPortalSession =
  webMethod(
    Permissions.Anyone,
    async function () {
      let member;

      try {
        member =
          await currentMember
            .getMember({
              fieldsets: [
                "FULL"
              ]
            });
      } catch (_) {
        return loggedOutSession();
      }

      if (!member?._id && !member?.id) {
        return loggedOutSession();
      }

      let resolved;

      try {
        resolved =
          await findAgentForMember(
            member
          );
      } catch (error) {
        await loginAudit({
          email: memberEmail(member),
          eventType: "session_check",
          success: false,
          errorMessage:
            error.message ||
            "WIX_MEMBER_LINK_MISMATCH"
        });

        return {
          ...loggedOutSession(
            "WIX_MEMBER_LINK_MISMATCH"
          ),
          loggedIn: true,
          authenticated: true
        };
      }

      let agent = resolved.agent;

      if (!agent) {
        await loginAudit({
          email: resolved.email,
          eventType: "session_check",
          success: false,
          errorMessage: "AGENT_NOT_FOUND"
        });

        return {
          ...loggedOutSession(
            "AGENT_NOT_FOUND"
          ),
          loggedIn: true,
          authenticated: true
        };
      }

      const failure =
        accessFailureCode(
          agent
        );

      if (failure) {
        await loginAudit({
          agent,
          email: resolved.email,
          eventType: "session_check",
          success: false,
          errorMessage: failure
        });

        const profile =
          publicAgent(
            agent
          );

        return {
          ok: true,
          loggedIn: true,
          authenticated: true,
          authorized: false,
          code: failure,
          profile,
          staff: profile,
          agent: profile,
          apps: [],
          permissions: {}
        };
      }

      try {
        agent =
          await syncMemberLink({
            agent,
            memberId: resolved.memberId,
            email: resolved.email
          });
      } catch (error) {
        await loginAudit({
          agent,
          email: resolved.email,
          eventType: "session_check",
          success: false,
          errorMessage:
            error.message ||
            "MEMBER_SYNC_FAILED"
        });

        return {
          ok: false,
          loggedIn: true,
          authenticated: true,
          authorized: false,
          code:
            error.message ||
            "MEMBER_SYNC_FAILED",
          profile: null,
          staff: null,
          agent: null,
          apps: [],
          permissions: {}
        };
      }

      await touchLastLogin(
        agent.id
      ).catch(() => {});

      await loginAudit({
        agent,
        email: resolved.email,
        eventType: "session_check",
        success: true
      });

      return authorizedSession(
        agent
      );
    }
  );

export const getPortalApps =
  webMethod(
    Permissions.SiteMember,
    async function () {
      const session =
        await getStaffPortalSession();

      if (!session?.authorized) {
        throw new Error(
          "Staff portal access denied."
        );
      }

      return {
        ok: true,
        apps: session.apps,
        profile: session.profile,
        permissions: session.permissions
      };
    }
  );
