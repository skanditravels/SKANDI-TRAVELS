import {
  currentMember
} from "wix-members-backend";

import {
  findAgentByMemberOrEmail,
  isAgentAuthorized,
  publicAgent
} from "./staffPortalAuth.repository.js";

import {
  writeAdminAudit
} from "./supabaseServer.js";


export const HR_ROLES =
  Object.freeze([
    "hr",
    "human resources",
    "people operations",
    "recruiter",
    "recruiting",
    "talent acquisition",
    "founder",
    "ceo",
    "owner",
    "super admin",
    "administrator",
    "admin"
  ]);


export function text(
  value,
  max = 5000
) {
  return String(
    value ?? ""
  )
    .trim()
    .slice(
      0,
      max
    );
}


export function upper(
  value,
  max = 120
) {
  return text(
    value,
    max
  )
    .toUpperCase();
}


function memberEmail(
  member = {}
) {
  const emails =
    member
      ?.contactDetails
      ?.emails;

  const contactEmail =
    Array.isArray(
      emails
    )
      ? emails[0]
      : emails;

  return text(
    member.loginEmail ||
    contactEmail ||
    member?.profile?.email ||
    member.email ||
    "",
    254
  )
    .toLowerCase();
}


function payloadPermissions(
  agent = {}
) {
  const payload =
    agent.payload &&
    typeof agent.payload === "object" &&
    !Array.isArray(
      agent.payload
    )
      ? agent.payload
      : {};

  const sources = [
    payload.permissions,
    payload.apps,
    payload.access,
    payload.accessRoles
  ];

  const output =
    new Set();

  const visit = (
    value
  ) => {
    if (!value) {
      return;
    }

    if (
      Array.isArray(
        value
      )
    ) {
      value.forEach(
        visit
      );
      return;
    }

    if (
      typeof value ===
      "object"
    ) {
      Object.entries(
        value
      )
        .forEach(
          ([
            key,
            enabled
          ]) => {
            if (
              enabled === true ||
              enabled === "true" ||
              enabled === 1
            ) {
              output.add(
                text(
                  key,
                  120
                )
                  .toLowerCase()
              );
            } else {
              visit(
                enabled
              );
            }
          }
        );

      return;
    }

    output.add(
      text(
        value,
        120
      )
        .toLowerCase()
    );
  };

  sources.forEach(
    visit
  );

  return output;
}


function roleText(
  agent = {}
) {
  return text(
    agent.job_title ||
    "",
    160
  )
    .toLowerCase();
}


function hasRequestedRole(
  agent,
  roles = []
) {
  if (
    !Array.isArray(
      roles
    ) ||
    !roles.length
  ) {
    return true;
  }

  const role =
    roleText(
      agent
    );

  const permissions =
    payloadPermissions(
      agent
    );

  return roles.some(
    candidate => {
      const wanted =
        text(
          candidate,
          120
        )
          .toLowerCase();

      if (!wanted) {
        return false;
      }

      return (
        role === wanted ||
        role.includes(
          wanted
        ) ||
        permissions.has(
          wanted
        ) ||
        permissions.has(
          "all"
        )
      );
    }
  );
}


function hasCapability(
  agent,
  capability
) {
  const value =
    text(
      capability,
      80
    )
      .toLowerCase();

  if (!value) {
    return true;
  }

  if (
    value === "manage"
  ) {
    return (
      agent.can_manage ===
      true
    );
  }

  if (
    value === "payroll"
  ) {
    return (
      agent.can_access_payroll ===
        true ||
      agent.can_manage ===
        true
    );
  }

  if (
    value === "grouptalk"
  ) {
    return (
      agent.can_access_grouptalk ===
        true ||
      agent.can_manage ===
        true
    );
  }

  const permissions =
    payloadPermissions(
      agent
    );

  return (
    permissions.has(
      value
    ) ||
    permissions.has(
      "all"
    )
  );
}


export async function requireInternalAgent({
  roles = [],
  capability = ""
} = {}) {

  const member =
    await currentMember
      .getMember({
        fieldsets: [
          "FULL"
        ]
      })
      .catch(
        () => null
      );

  if (!member) {
    throw new Error(
      "STAFF_LOGIN_REQUIRED"
    );
  }

  const memberId =
    text(
      member._id ||
      member.id,
      160
    );

  const email =
    memberEmail(
      member
    );

  const agent =
    await findAgentByMemberOrEmail({
      memberId,
      email
    });

  if (
    !agent ||
    !isAgentAuthorized(
      agent
    )
  ) {
    throw new Error(
      "STAFF_ACCESS_DENIED"
    );
  }

  if (
    !hasRequestedRole(
      agent,
      roles
    )
  ) {
    throw new Error(
      "STAFF_ROLE_REQUIRED"
    );
  }

  if (
    !hasCapability(
      agent,
      capability
    )
  ) {
    throw new Error(
      "STAFF_CAPABILITY_REQUIRED"
    );
  }

  return {
    member,
    agent,

    profile:
      publicAgent(
        agent
      )
  };
}


export async function writeInternalAudit({
  agent = {},
  action,
  target = null,
  before = null,
  after = null
} = {}) {

  if (
    !agent?.id ||
    !action
  ) {
    return null;
  }

  return writeAdminAudit({
    actorId:
      agent.sk_id ||
      agent.id,

    action:
      text(
        action,
        160
      ),

    targetMember:
      target == null
        ? null
        : text(
            target,
            200
          ),

    before,
    after
  });
}
