import {
  webMethod,
  Permissions
} from "wix-web-module";

import {
  authentication
} from "wix-members-backend";

import {
  members
} from "wix-members.v2";

import {
  elevate
} from "wix-auth";

import {
  restRequest
} from "./supabaseServer.js";

import {
  HR_ROLES,
  requireInternalAgent,
  text,
  upper,
  writeInternalAudit
} from "./internalAccess.js";


const AGENT_TABLE = "agent_users";
const MAX_STAFF = 1000;

const elevatedCreateMember = elevate(members.createMember);
const elevatedGetMember = elevate(members.getMember);
const elevatedQueryMembers = elevate(members.queryMembers);
const elevatedUpdateMember = elevate(members.updateMember);

const elevatedApproveByEmail = elevate(authentication.approveByEmail);
const elevatedBlockByEmail = elevate(authentication.blockByEmail);
const elevatedSendSetPasswordEmail = elevate(authentication.sendSetPasswordEmail);
const elevatedChangeLoginEmail = elevate(authentication.changeLoginEmail);

const BLOCKED_STATUSES = new Set([
  "blocked",
  "inactive",
  "suspended",
  "terminated",
  "archived",
  "disabled"
]);

const SENSITIVE_KEY =
  /(password|secret|token|authorization|api[_-]?key|service[_-]?role|private[_-]?key)/i;


/* ==========================================================================
   HELPERS
   ========================================================================== */

function now() {
  return new Date().toISOString();
}

function first(rows) {
  return Array.isArray(rows) && rows.length
    ? rows[0]
    : null;
}

function objectValue(value) {
  return value &&
    typeof value === "object" &&
    !Array.isArray(value)
    ? value
    : {};
}

function normalizeEmail(value) {
  return text(
    value,
    254
  ).toLowerCase();
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    normalizeEmail(value)
  );
}

function boolValue(
  value,
  fallback = false
) {
  if (
    value === true ||
    value === "true" ||
    value === 1 ||
    value === "1"
  ) {
    return true;
  }

  if (
    value === false ||
    value === "false" ||
    value === 0 ||
    value === "0"
  ) {
    return false;
  }

  return fallback;
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    text(
      value,
      80
    )
  );
}

function normalizeSkId(value) {
  return upper(
    value,
    20
  ).replace(
    /[^A-Z0-9]/g,
    ""
  );
}

function validSkId(value) {
  return /^[A-Z]{2}\d{4}$/.test(
    normalizeSkId(value)
  );
}

function safeClientValue(
  value,
  depth = 0
) {
  if (
    depth > 6 ||
    value === null ||
    value === undefined
  ) {
    return null;
  }

  if (Array.isArray(value)) {
    return value
      .slice(
        0,
        500
      )
      .map(
        (item) =>
          safeClientValue(
            item,
            depth + 1
          )
      );
  }

  if (
    typeof value !==
    "object"
  ) {
    return value;
  }

  const output = {};

  Object.entries(
    value
  ).forEach(
    ([
      key,
      item
    ]) => {
      if (
        SENSITIVE_KEY.test(
          String(
            key ||
            ""
          )
        )
      ) {
        return;
      }

      output[key] =
        safeClientValue(
          item,
          depth + 1
        );
    }
  );

  return output;
}

function itemOf(
  input = {}
) {
  if (
    !input ||
    typeof input !== "object" ||
    Array.isArray(input)
  ) {
    return {};
  }

  return input.item &&
    typeof input.item === "object"
    ? input.item
    : input.staff &&
      typeof input.staff === "object"
      ? input.staff
      : input.profile &&
        typeof input.profile === "object"
        ? input.profile
        : input;
}

function displayNameFrom(
  item = {}
) {
  return text(
    item.preferredName ||
    item.preferred_name ||
    item.displayName ||
    item.display_name ||
    [
      item.firstName ||
        item.first_name,
      item.lastName ||
        item.last_name
    ]
      .filter(Boolean)
      .join(" ") ||
    item.email ||
    item.corporateEmailAddress ||
    item.corporate_email_address ||
    item.skId ||
    item.sk_id ||
    "Staff",
    180
  );
}

function employmentStatusFrom(
  item = {},
  existing = null
) {
  const raw = text(
    item.employmentStatus ||
    item.employment_status ||
    existing?.employment_status ||
    "active",
    80
  ).toLowerCase();

  return raw || "active";
}

function accountStatusFrom(
  item = {},
  existing = null,
  active = true
) {
  const raw = text(
    item.status ||
    existing?.status ||
    "",
    80
  ).toLowerCase();

  if (raw) {
    return raw;
  }

  return active
    ? "active"
    : "inactive";
}

function permissionsFromPayload(
  payload = {}
) {
  const permissions =
    objectValue(
      payload.permissions
    );

  return safeClientValue(
    permissions
  ) || {};
}

function mergedPermissions(
  existingPayload = {},
  item = {}
) {
  const existing =
    permissionsFromPayload(
      existingPayload
    );

  const incoming =
    objectValue(
      item.permissions ||
      item.access ||
      item.accessRoles
    );

  const output = {
    ...existing
  };

  Object.entries(
    incoming
  ).forEach(
    ([
      key,
      value
    ]) => {
      output[
        text(
          key,
          120
        )
      ] =
        value === true ||
        value === false
          ? value
          : safeClientValue(
              value
            );
    }
  );

  return output;
}

function selfServiceFromPayload(
  payload = {}
) {
  const self =
    objectValue(
      payload.selfService
    );

  return safeClientValue(
    self
  ) || {};
}

function hrRecordFromPayload(
  payload = {}
) {
  const hr =
    objectValue(
      payload.hrRecord
    );

  return safeClientValue(
    hr
  ) || {};
}

function hrRecordPatch(
  item = {}
) {
  const skip =
    new Set([
      "_id",
      "id",

      "agentId",
      "agent_id",

      "memberId",
      "member_id",

      "wixMemberId",
      "wix_member_id",

      "contactId",
      "contact_id",

      "skId",
      "skID",
      "sk_id",

      "firstName",
      "first_name",

      "lastName",
      "last_name",

      "preferredName",
      "preferred_name",

      "displayName",
      "display_name",

      "email",

      "corporateEmailAddress",
      "corporate_email_address",

      "jobTitle",
      "job_title",

      "position",
      "role",

      "department",

      "station",
      "base",

      "managerName",
      "manager_name",

      "employmentStatus",
      "employment_status",

      "status",
      "active",

      "portalAccess",
      "portal_access",

      "authorized",

      "canAccessPayroll",
      "can_access_payroll",
      "canUsePayroll",

      "canAccessGroupTalk",
      "can_access_grouptalk",
      "canUseGroupTalk",

      "canManage",
      "can_manage",

      "badgePhotoUrl",
      "badge_photo_url",
      "badgePhoto",

      "permissions",
      "access",
      "accessRoles",

      "payload"
    ]);

  const output = {};

  Object.entries(
    item ||
    {}
  ).forEach(
    ([
      key,
      value
    ]) => {
      if (
        skip.has(key) ||
        SENSITIVE_KEY.test(key)
      ) {
        return;
      }

      output[key] =
        safeClientValue(
          value
        );
    }
  );

  return output;
}

function staffMap(
  row = {}
) {
  const payload =
    objectValue(
      row.payload
    );

  const selfService =
    selfServiceFromPayload(
      payload
    );

  const hrRecord =
    hrRecordFromPayload(
      payload
    );

  const permissions =
    permissionsFromPayload(
      payload
    );

  const displayName =
    text(
      row.preferred_name ||
      row.display_name ||
      [
        row.first_name,
        row.last_name
      ]
        .filter(Boolean)
        .join(" ") ||
      row.corporate_email_address ||
      row.email ||
      row.sk_id ||
      "Staff",
      180
    );

  return {
    ...hrRecord,

    _id:
      row.id ||
      "",

    id:
      row.id ||
      "",

    agentId:
      row.agent_id ||
      "",

    memberId:
      row.member_id ||
      "",

    wixMemberId:
      row.wix_member_id ||
      "",

    contactId:
      row.contact_id ||
      "",

    skId:
      row.sk_id ||
      "",

    skID:
      row.sk_id ||
      "",

    firstName:
      row.first_name ||
      "",

    lastName:
      row.last_name ||
      "",

    preferredName:
      row.preferred_name ||
      "",

    displayName,

    fullName:
      displayName,

    name:
      displayName,

    email:
      row.email ||
      row.corporate_email_address ||
      "",

    corporateEmailAddress:
      row.corporate_email_address ||
      row.email ||
      "",

    jobTitle:
      row.job_title ||
      "",

    position:
      row.job_title ||
      "",

    role:
      row.job_title ||
      "",

    department:
      row.department ||
      "",

    assignedDepartment:
      row.department ||
      "",

    station:
      row.station ||
      row.base ||
      "",

    base:
      row.base ||
      row.station ||
      "",

    assignedBase:
      row.station ||
      row.base ||
      "",

    managerName:
      row.manager_name ||
      "",

    employmentStatus:
      row.employment_status ||
      "",

    status:
      row.status ||
      "",

    active:
      row.active ===
      true,

    portalAccess:
      row.portal_access ===
      true,

    authorized:
      row.authorized ===
      true,

    canAccessPayroll:
      row.can_access_payroll ===
      true,

    canUsePayroll:
      row.can_access_payroll ===
      true,

    canAccessGroupTalk:
      row.can_access_grouptalk ===
      true,

    canUseGroupTalk:
      row.can_access_grouptalk ===
      true,

    canManage:
      row.can_manage ===
      true,

    badgePhotoUrl:
      row.badge_photo_url ||
      "",

    badgePhoto:
      row.badge_photo_url ||
      "",

    permissions,

    access:
      permissions,

    selfService,

    phone:
      selfService.phone ||
      selfService.personalPhoneMobile ||
      hrRecord.phone ||
      "",

    workPhone:
      selfService.workPhone ||
      hrRecord.workPhone ||
      "",

    createdAt:
      row.created_at ||
      "",

    updatedAt:
      row.updated_at ||
      "",

    lastLoginAt:
      row.last_login_at ||
      ""
  };
}

function wixMemberMap(
  member = {}
) {
  const value =
    member?.member &&
    typeof member.member ===
      "object"
      ? member.member
      : member ||
        {};

  return {
    id:
      value._id ||
      value.id ||
      "",

    memberId:
      value._id ||
      value.id ||
      "",

    contactId:
      value.contactId ||
      value.contact?.contactId ||
      "",

    loginEmail:
      normalizeEmail(
        value.loginEmail
      ),

    loginEmailVerified:
      value.loginEmailVerified ===
      true,

    status:
      value.status ||
      "",

    activityStatus:
      value.activityStatus ||
      "",

    privacyStatus:
      value.privacyStatus ||
      "",

    firstName:
      value.contact?.firstName ||
      "",

    lastName:
      value.contact?.lastName ||
      "",

    nickname:
      value.profile?.nickname ||
      "",

    createdAt:
      value._createdDate ||
      value.createdDate ||
      "",

    updatedAt:
      value._updatedDate ||
      value.updatedDate ||
      "",

    lastLoginAt:
      value.lastLoginDate ||
      ""
  };
}

function groupCounts(
  rows = [],
  selector
) {
  const map =
    new Map();

  rows.forEach(
    (row) => {
      const key =
        text(
          selector(row),
          160
        ) ||
        "Unassigned";

      map.set(
        key,
        (
          map.get(key) ||
          0
        ) +
        1
      );
    }
  );

  return [
    ...map.entries()
  ]
    .map(
      ([
        name,
        count
      ]) => ({
        name,
        count
      })
    )
    .sort(
      (a, b) =>
        a.name.localeCompare(
          b.name
        )
    );
}

function organizationFromStaff(
  staff = []
) {
  const departments =
    new Map();

  staff.forEach(
    (person) => {
      const department =
        person.department ||
        "Unassigned";

      const station =
        person.station ||
        person.base ||
        "Unassigned";

      if (
        !departments.has(
          department
        )
      ) {
        departments.set(
          department,
          {
            name:
              department,

            count:
              0,

            active:
              0,

            inactive:
              0,

            stations:
              new Map()
          }
        );
      }

      const departmentRow =
        departments.get(
          department
        );

      departmentRow.count +=
        1;

      if (
        person.active
      ) {
        departmentRow.active +=
          1;
      } else {
        departmentRow.inactive +=
          1;
      }

      departmentRow.stations.set(
        station,
        (
          departmentRow.stations.get(
            station
          ) ||
          0
        ) +
        1
      );
    }
  );

  return {
    departments: [
      ...departments.values()
    ]
      .map(
        (department) => ({
          name:
            department.name,

          count:
            department.count,

          active:
            department.active,

          inactive:
            department.inactive,

          stations: [
            ...department.stations.entries()
          ]
            .map(
              ([
                name,
                count
              ]) => ({
                name,
                count
              })
            )
            .sort(
              (a, b) =>
                a.name.localeCompare(
                  b.name
                )
            )
        })
      )
      .sort(
        (a, b) =>
          a.name.localeCompare(
            b.name
          )
      ),

    stations:
      groupCounts(
        staff,
        (person) =>
          person.station ||
          person.base
      ),

    jobTitles:
      groupCounts(
        staff,
        (person) =>
          person.jobTitle
      )
  };
}

function reportSummary(
  staff = []
) {
  const active =
    staff.filter(
      (item) =>
        item.active === true
    );

  const inactive =
    staff.filter(
      (item) =>
        item.active !== true
    );

  const payroll =
    staff.filter(
      (item) =>
        item.canAccessPayroll ===
        true
    );

  const groupTalk =
    staff.filter(
      (item) =>
        item.canAccessGroupTalk ===
        true
    );

  const managers =
    staff.filter(
      (item) =>
        item.canManage ===
        true
    );

  const portalEnabled =
    staff.filter(
      (item) =>
        item.portalAccess ===
          true &&
        item.authorized ===
          true
    );

  const badgesMissing =
    staff.filter(
      (item) =>
        !item.badgePhotoUrl
    );

  return {
    total:
      staff.length,

    active:
      active.length,

    inactive:
      inactive.length,

    portalEnabled:
      portalEnabled.length,

    payrollAccess:
      payroll.length,

    groupTalkAccess:
      groupTalk.length,

    managers:
      managers.length,

    badgesMissing:
      badgesMissing.length,

    departments:
      groupCounts(
        staff,
        (item) =>
          item.department
      ),

    stations:
      groupCounts(
        staff,
        (item) =>
          item.station ||
          item.base
      ),

    employmentStatuses:
      groupCounts(
        staff,
        (item) =>
          item.employmentStatus ||
          item.status
      )
  };
}

async function audit(
  agent,
  action,
  target,
  before = null,
  after = null
) {
  await writeInternalAudit({
    agent,

    action:
      `HR_${action}`,

    target,

    before,

    after
  }).catch(
    () => null
  );
}

async function requireHr() {
  return requireInternalAgent({
    roles:
      HR_ROLES
  });
}


/* ==========================================================================
   STAFF LOOKUP
   ========================================================================== */

async function getStaffRow(
  key
) {
  const value =
    text(
      key,
      180
    );

  if (!value) {
    return null;
  }

  if (
    isUuid(value)
  ) {
    const byId =
      first(
        await restRequest({
          table:
            AGENT_TABLE,

          query: {
            select:
              "*",

            id:
              `eq.${value}`,

            limit:
              1
          }
        })
      );

    if (byId) {
      return byId;
    }
  }

  const skId =
    normalizeSkId(
      value
    );

  if (
    validSkId(skId)
  ) {
    const bySkId =
      first(
        await restRequest({
          table:
            AGENT_TABLE,

          query: {
            select:
              "*",

            sk_id:
              `eq.${skId}`,

            limit:
              1
          }
        })
      );

    if (bySkId) {
      return bySkId;
    }
  }

  return first(
    await restRequest({
      table:
        AGENT_TABLE,

      query: {
        select:
          "*",

        agent_id:
          `eq.${value}`,

        limit:
          1
      }
    })
  );
}

async function requireStaffRow(
  key
) {
  const row =
    await getStaffRow(
      key
    );

  if (!row) {
    throw new Error(
      "HR_STAFF_NOT_FOUND"
    );
  }

  return row;
}

async function duplicateEmail(
  email,
  exceptId = ""
) {
  const normalized =
    normalizeEmail(
      email
    );

  if (!normalized) {
    return null;
  }

  const row =
    first(
      await restRequest({
        table:
          AGENT_TABLE,

        query: {
          select:
            "id,sk_id,email,corporate_email_address",

          email:
            `ilike.${normalized}`,

          limit:
            1
        }
      })
    );

  if (
    row &&
    row.id !==
      exceptId
  ) {
    return row;
  }

  return null;
}


/* ==========================================================================
   SK-ID
   ========================================================================== */

function skPrefix(
  input = {}
) {
  if (
    typeof input ===
    "string"
  ) {
    const supplied =
      upper(
        input,
        10
      )
        .replace(
          /[^A-Z]/g,
          ""
        )
        .slice(
          0,
          2
        );

    return supplied.length ===
      2
      ? supplied
      : supplied.length ===
        1
        ? `${supplied}K`
        : "SK";
  }

  const item =
    itemOf(
      input
    );

  const supplied =
    upper(
      input.prefix ||
      item.prefix ||
      item.skPrefix ||
      "",
      10
    )
      .replace(
        /[^A-Z]/g,
        ""
      )
      .slice(
        0,
        2
      );

  if (
    supplied.length ===
    2
  ) {
    return supplied;
  }

  const firstInitial =
    upper(
      item.firstName ||
      item.first_name,
      1
    )
      .replace(
        /[^A-Z]/g,
        ""
      );

  const lastInitial =
    upper(
      item.lastName ||
      item.last_name,
      1
    )
      .replace(
        /[^A-Z]/g,
        ""
      );

  const initials =
    `${firstInitial}${lastInitial}`;

  if (
    initials.length ===
    2
  ) {
    return initials;
  }

  if (
    supplied.length ===
    1
  ) {
    return `${supplied}K`;
  }

  return "SK";
}

async function uniqueSkId(
  input = {}
) {
  const prefix =
    skPrefix(
      input
    );

  for (
    let attempt = 0;
    attempt < 150;
    attempt += 1
  ) {
    const digits =
      String(
        1000 +
        Math.floor(
          Math.random() *
          9000
        )
      );

    const candidate =
      `${prefix}${digits}`;

    const existing =
      first(
        await restRequest({
          table:
            AGENT_TABLE,

          query: {
            select:
              "id",

            sk_id:
              `eq.${candidate}`,

            limit:
              1
          }
        })
      );

    if (!existing) {
      return candidate;
    }
  }

  throw new Error(
    "HR_SKID_POOL_EXHAUSTED"
  );
}


/* ==========================================================================
   WIX MEMBER HELPERS
   ========================================================================== */

async function wixMemberById(
  memberId
) {
  const id =
    text(
      memberId,
      160
    );

  if (!id) {
    return null;
  }

  try {
    const result =
      await elevatedGetMember(
        id,
        {
          fieldsets: [
            "FULL"
          ]
        }
      );

    return result?.member ||
      result ||
      null;

  } catch (_) {
    return null;
  }
}

async function wixMemberByEmail(
  email
) {
  const loginEmail =
    normalizeEmail(
      email
    );

  if (
    !validEmail(
      loginEmail
    )
  ) {
    return null;
  }

  try {
    const builder =
      elevatedQueryMembers({
        fieldsets: [
          "FULL"
        ]
      });

    const result =
      await builder
        .eq(
          "loginEmail",
          loginEmail
        )
        .limit(1)
        .find();

    const items =
      Array.isArray(
        result?.items
      )
        ? result.items
        : Array.isArray(
            result?._items
          )
          ? result._items
          : [];

    return items[0] ||
      null;

  } catch (_) {
    return null;
  }
}

async function resolveWixMember(
  staffRow
) {
  const linkedId =
    staffRow?.wix_member_id ||
    staffRow?.member_id ||
    "";

  if (linkedId) {
    const linked =
      await wixMemberById(
        linkedId
      );

    if (linked) {
      return linked;
    }
  }

  const email =
    normalizeEmail(
      staffRow
        ?.corporate_email_address ||
      staffRow
        ?.email
    );

  return wixMemberByEmail(
    email
  );
}

async function linkWixMember(
  staffRow,
  member
) {
  const safe =
    wixMemberMap(
      member
    );

  if (
    !safe.memberId
  ) {
    throw new Error(
      "HR_WIX_MEMBER_ID_MISSING"
    );
  }

  const rows =
    await restRequest({
      table:
        AGENT_TABLE,

      method:
        "PATCH",

      query: {
        id:
          `eq.${staffRow.id}`
      },

      body: {
        wix_member_id:
          safe.memberId,

        member_id:
          safe.memberId,

        contact_id:
          safe.contactId ||
          staffRow.contact_id ||
          null,

        updated_at:
          now()
      }
    });

  return first(
    rows
  ) || {
    ...staffRow,

    wix_member_id:
      safe.memberId,

    member_id:
      safe.memberId,

    contact_id:
      safe.contactId ||
      staffRow.contact_id ||
      null,

    updated_at:
      now()
  };
}

function wixCreatePayload(
  staffRow
) {
  const staff =
    staffMap(
      staffRow
    );

  const email =
    normalizeEmail(
      staff.corporateEmailAddress ||
      staff.email
    );

  if (
    !validEmail(
      email
    )
  ) {
    throw new Error(
      "HR_WIX_EMAIL_REQUIRED"
    );
  }

  return {
    member: {
      loginEmail:
        email,

      privacyStatus:
        "PRIVATE",

      contact: {
        firstName:
          staff.firstName ||
          undefined,

        lastName:
          staff.lastName ||
          undefined,

        emails: [
          email
        ]
      },

      profile: {
        nickname:
          staff.displayName ||
          email
      }
    }
  };
}

async function updateWixMemberFromStaff(
  member,
  staffRow
) {
  const safeMember =
    wixMemberMap(
      member
    );

  const staff =
    staffMap(
      staffRow
    );

  const memberId =
    safeMember.memberId;

  if (!memberId) {
    throw new Error(
      "HR_WIX_MEMBER_ID_MISSING"
    );
  }

  const desiredEmail =
    normalizeEmail(
      staff.corporateEmailAddress ||
      staff.email
    );

  if (
    validEmail(
      desiredEmail
    ) &&
    safeMember.loginEmail &&
    desiredEmail !==
      safeMember.loginEmail
  ) {
    await elevatedChangeLoginEmail(
      memberId,
      desiredEmail
    );
  }

  const update = {
    contact: {
      firstName:
        staff.firstName ||
        undefined,

      lastName:
        staff.lastName ||
        undefined,

      emails:
        validEmail(
          desiredEmail
        )
          ? [
              desiredEmail
            ]
          : undefined
    },

    profile: {
      nickname:
        staff.displayName ||
        desiredEmail ||
        staff.skId ||
        "Staff"
    }
  };

  const result =
    await elevatedUpdateMember(
      memberId,
      update
    );

  return result?.member ||
    result ||
    member;
}


/* ==========================================================================
   SESSION
   ========================================================================== */

export const getHrSession =
  webMethod(
    Permissions.SiteMember,

    async function () {
      try {
        const session =
          await requireHr();

        const profile =
          session.profile ||
          staffMap(
            session.agent ||
            {}
          );

        return {
          ok:
            true,

          authorized:
            true,

          authenticated:
            true,

          profile,

          agent:
            profile,

          staff:
            profile,

          permissions:
            profile.permissions ||
            {},

          canManage:
            session.agent
              ?.can_manage ===
            true,

          checkedAt:
            now()
        };

      } catch (error) {
        return {
          ok:
            false,

          authorized:
            false,

          authenticated:
            false,

          code:
            text(
              error?.message ||
              error,
              160
            ) ||
            "HR_ACCESS_DENIED",

          profile:
            null,

          agent:
            null,

          staff:
            null,

          permissions:
            {},

          checkedAt:
            now()
        };
      }
    }
  );


/* ==========================================================================
   LIST STAFF
   ========================================================================== */

export const listStaff =
  webMethod(
    Permissions.SiteMember,

    async function (
      input = {}
    ) {
      await requireHr();

      const filters =
        objectValue(
          input.filters ||
          input
        );

      const limit =
        Math.min(
          Math.max(
            Number(
              filters.limit
            ) ||
            MAX_STAFF,
            1
          ),
          MAX_STAFF
        );

      const rows =
        await restRequest({
          table:
            AGENT_TABLE,

          query: {
            select:
              "*",

            order:
              "last_name.asc,first_name.asc",

            limit
          }
        });

      let staff =
        (
          Array.isArray(
            rows
          )
            ? rows
            : []
        )
          .map(
            staffMap
          );

      const search =
        text(
          filters.search ||
          filters.query ||
          filters.q,
          160
        )
          .toLowerCase();

      const department =
        text(
          filters.department,
          160
        )
          .toLowerCase();

      const station =
        text(
          filters.station ||
          filters.base,
          160
        )
          .toLowerCase();

      const status =
        text(
          filters.status ||
          filters.employmentStatus,
          80
        )
          .toLowerCase();

      const hasActiveFilter =
        Object.prototype
          .hasOwnProperty
          .call(
            filters,
            "active"
          );

      const activeFilter =
        boolValue(
          filters.active,
          true
        );

      staff =
        staff.filter(
          (person) => {
            if (
              hasActiveFilter &&
              person.active !==
                activeFilter
            ) {
              return false;
            }

            if (
              department &&
              person.department
                .toLowerCase() !==
                department
            ) {
              return false;
            }

            if (
              station &&
              (
                person.station ||
                person.base ||
                ""
              )
                .toLowerCase() !==
                station
            ) {
              return false;
            }

            if (
              status &&
              ![
                person.status,
                person.employmentStatus
              ]
                .map(
                  (value) =>
                    String(
                      value ||
                      ""
                    )
                      .toLowerCase()
                )
                .includes(
                  status
                )
            ) {
              return false;
            }

            if (search) {
              const haystack =
                [
                  person.skId,
                  person.firstName,
                  person.lastName,
                  person.preferredName,
                  person.displayName,
                  person.email,
                  person.corporateEmailAddress,
                  person.jobTitle,
                  person.department,
                  person.station,
                  person.base,
                  person.managerName
                ]
                  .join(" ")
                  .toLowerCase();

              if (
                !haystack.includes(
                  search
                )
              ) {
                return false;
              }
            }

            return true;
          }
        );

      const archive =
        staff.filter(
          (person) =>
            person.active !==
            true
        );

      const activeStaff =
        staff.filter(
          (person) =>
            person.active ===
            true
        );

      return {
        ok:
          true,

        staff,

        items:
          staff,

        activeStaff,

        archive,

        organization:
          organizationFromStaff(
            staff
          ),

        reports:
          reportSummary(
            staff
          ),

        selectedId:
          text(
            input.selectedId ||
            filters.selectedId,
            160
          ),

        filters:
          safeClientValue(
            filters
          ) ||
          {},

        total:
          staff.length,

        syncedAt:
          now()
      };
    }
  );


/* ==========================================================================
   SAVE STAFF
   ========================================================================== */

export const saveStaff =
  webMethod(
    Permissions.SiteMember,

    async function (
      input = {}
    ) {
      const {
        agent
      } =
        await requireHr();

      const item =
        itemOf(
          input
        );

      const lookupKey =
        text(
          item._id ||
          item.id ||
          item.skId ||
          item.skID ||
          item.sk_id ||
          item.agentId ||
          item.agent_id,
          180
        );

      const existing =
        lookupKey
          ? await getStaffRow(
              lookupKey
            )
          : null;

      let skId =
        normalizeSkId(
          item.skId ||
          item.skID ||
          item.sk_id ||
          existing?.sk_id ||
          ""
        );

      if (!skId) {
        skId =
          await uniqueSkId(
            item
          );
      }

      if (
        !validSkId(
          skId
        )
      ) {
        throw new Error(
          "HR_SKID_INVALID"
        );
      }

      if (
        existing &&
        existing.sk_id &&
        existing.sk_id !==
          skId
      ) {
        const duplicateSk =
          await getStaffRow(
            skId
          );

        if (
          duplicateSk &&
          duplicateSk.id !==
            existing.id
        ) {
          throw new Error(
            "HR_SKID_ALREADY_EXISTS"
          );
        }

      } else if (
        !existing
      ) {
        const duplicateSk =
          await getStaffRow(
            skId
          );

        if (duplicateSk) {
          throw new Error(
            "HR_SKID_ALREADY_EXISTS"
          );
        }
      }

      const email =
        normalizeEmail(
          item.email ||
          item.corporateEmailAddress ||
          item.corporate_email_address ||
          existing?.email ||
          existing
            ?.corporate_email_address ||
          ""
        );

      const corporateEmail =
        normalizeEmail(
          item.corporateEmailAddress ||
          item.corporate_email_address ||
          item.email ||
          existing
            ?.corporate_email_address ||
          existing?.email ||
          ""
        );

      if (
        email &&
        !validEmail(
          email
        )
      ) {
        throw new Error(
          "HR_STAFF_EMAIL_INVALID"
        );
      }

      const duplicate =
        await duplicateEmail(
          email,
          existing?.id ||
          ""
        );

      if (duplicate) {
        throw new Error(
          "HR_STAFF_EMAIL_ALREADY_EXISTS"
        );
      }

      const firstName =
        text(
          item.firstName ||
          item.first_name ||
          existing?.first_name,
          100
        );

      const lastName =
        text(
          item.lastName ||
          item.last_name ||
          existing?.last_name,
          100
        );

      const preferredName =
        text(
          item.preferredName ||
          item.preferred_name ||
          existing
            ?.preferred_name,
          100
        );

      const displayName =
        displayNameFrom({
          ...existing,
          ...item,
          firstName,
          lastName,
          preferredName,
          email,
          skId
        });

      const active =
        Object.prototype
          .hasOwnProperty
          .call(
            item,
            "active"
          )
          ? boolValue(
              item.active,
              true
            )
          : existing
            ? existing.active ===
              true
            : true;

      const employmentStatus =
        employmentStatusFrom(
          item,
          existing
        );

      const status =
        accountStatusFrom(
          item,
          existing,
          active
        );

      const existingPayload =
        objectValue(
          existing?.payload
        );

      const existingHr =
        hrRecordFromPayload(
          existingPayload
        );

      const existingSelf =
        selfServiceFromPayload(
          existingPayload
        );

      const incomingPayload =
        objectValue(
          item.payload
        );

      const incomingSelf =
        objectValue(
          incomingPayload.selfService
        );

      const incomingHr =
        objectValue(
          incomingPayload.hrRecord
        );

      const permissions =
        mergedPermissions(
          {
            ...existingPayload,

            permissions: {
              ...permissionsFromPayload(
                existingPayload
              ),

              ...objectValue(
                incomingPayload.permissions
              )
            }
          },
          item
        );

      const nextPayload = {
        ...existingPayload,

        ...safeClientValue(
          incomingPayload
        ),

        selfService: {
          ...existingSelf,

          ...safeClientValue(
            incomingSelf
          )
        },

        hrRecord: {
          ...existingHr,

          ...safeClientValue(
            incomingHr
          ),

          ...hrRecordPatch(
            item
          ),

          sourceModule:
            text(
              item.sourceModule,
              80
            ) ||
            existingHr
              .sourceModule ||
            "HR",

          lastHrUpdatedAt:
            now()
        },

        permissions
      };

      const body = {
        agent_id:
          text(
            item.agentId ||
            item.agent_id ||
            existing
              ?.agent_id ||
            skId,
            160
          ),

        sk_id:
          skId,

        first_name:
          firstName ||
          null,

        last_name:
          lastName ||
          null,

        preferred_name:
          preferredName ||
          null,

        display_name:
          displayName,

        email:
          email ||
          null,

        corporate_email_address:
          corporateEmail ||
          email ||
          null,

        job_title:
          text(
            item.jobTitle ||
            item.job_title ||
            item.position ||
            item.role ||
            existing
              ?.job_title,
            160
          ) ||
          null,

        department:
          text(
            item.department ||
            item.assignedDepartment ||
            existing
              ?.department,
            160
          ) ||
          null,

        station:
          text(
            item.station ||
            item.assignedBase ||
            item.base ||
            existing
              ?.station ||
            existing
              ?.base,
            80
          ) ||
          null,

        base:
          text(
            item.base ||
            item.assignedBase ||
            item.station ||
            existing?.base ||
            existing?.station,
            80
          ) ||
          null,

        manager_name:
          text(
            item.managerName ||
            item.manager_name ||
            existing
              ?.manager_name,
            180
          ) ||
          null,

        employment_status:
          employmentStatus,

        status,

        active,

        portal_access:
          Object.prototype
            .hasOwnProperty
            .call(
              item,
              "portalAccess"
            ) ||
          Object.prototype
            .hasOwnProperty
            .call(
              item,
              "portal_access"
            )
            ? boolValue(
                item.portalAccess ??
                item.portal_access,
                true
              )
            : existing
              ? existing
                  .portal_access ===
                true
              : true,

        authorized:
          Object.prototype
            .hasOwnProperty
            .call(
              item,
              "authorized"
            )
            ? boolValue(
                item.authorized,
                true
              )
            : existing
              ? existing
                  .authorized ===
                true
              : true,

        can_access_payroll:
          Object.prototype
            .hasOwnProperty
            .call(
              item,
              "canAccessPayroll"
            ) ||
          Object.prototype
            .hasOwnProperty
            .call(
              item,
              "can_access_payroll"
            ) ||
          Object.prototype
            .hasOwnProperty
            .call(
              item,
              "canUsePayroll"
            )
            ? boolValue(
                item.canAccessPayroll ??
                item.can_access_payroll ??
                item.canUsePayroll,
                false
              )
            : existing
                ?.can_access_payroll ===
              true,

        can_access_grouptalk:
          Object.prototype
            .hasOwnProperty
            .call(
              item,
              "canAccessGroupTalk"
            ) ||
          Object.prototype
            .hasOwnProperty
            .call(
              item,
              "can_access_grouptalk"
            ) ||
          Object.prototype
            .hasOwnProperty
            .call(
              item,
              "canUseGroupTalk"
            )
            ? boolValue(
                item.canAccessGroupTalk ??
                item.can_access_grouptalk ??
                item.canUseGroupTalk,
                false
              )
            : existing
                ?.can_access_grouptalk ===
              true,

        can_manage:
          Object.prototype
            .hasOwnProperty
            .call(
              item,
              "canManage"
            ) ||
          Object.prototype
            .hasOwnProperty
            .call(
              item,
              "can_manage"
            )
            ? boolValue(
                item.canManage ??
                item.can_manage,
                false
              )
            : existing
                ?.can_manage ===
              true,

        badge_photo_url:
          text(
            item.badgePhotoUrl ||
            item.badge_photo_url ||
            item.badgePhoto ||
            existing
              ?.badge_photo_url,
            2000
          ) ||
          null,

        payload:
          nextPayload,

        updated_at:
          now()
      };

      if (
        existing?.wix_member_id ||
        item.wixMemberId ||
        item.wix_member_id
      ) {
        body.wix_member_id =
          text(
            item.wixMemberId ||
            item.wix_member_id ||
            existing
              ?.wix_member_id,
            160
          ) ||
          null;
      }

      if (
        existing?.member_id ||
        item.memberId ||
        item.member_id
      ) {
        body.member_id =
          text(
            item.memberId ||
            item.member_id ||
            existing
              ?.member_id,
            160
          ) ||
          null;
      }

      if (
        existing?.contact_id ||
        item.contactId ||
        item.contact_id
      ) {
        body.contact_id =
          text(
            item.contactId ||
            item.contact_id ||
            existing
              ?.contact_id,
            160
          ) ||
          null;
      }

      const rows =
        existing
          ? await restRequest({
              table:
                AGENT_TABLE,

              method:
                "PATCH",

              query: {
                id:
                  `eq.${existing.id}`
              },

              body
            })
          : await restRequest({
              table:
                AGENT_TABLE,

              method:
                "POST",

              body
            });

      const saved =
        first(
          rows
        ) || {
          ...existing,
          ...body
        };

      await audit(
        agent,

        existing
          ? "STAFF_UPDATED"
          : "STAFF_CREATED",

        saved?.id ||
        skId,

        existing
          ? staffMap(
              existing
            )
          : null,

        staffMap(
          saved
        )
      );

      return {
        ok:
          true,

        created:
          !existing,

        staff:
          staffMap(
            saved
          ),

        item:
          staffMap(
            saved
          ),

        skId:
          saved?.sk_id ||
          skId,

        message:
          existing
            ? "Staff record updated."
            : "Staff record created."
      };
    }
  );


/* ==========================================================================
   ACTIVATE / DEACTIVATE
   ========================================================================== */

export const setStaffActive =
  webMethod(
    Permissions.SiteMember,

    async function (
      input = {},
      explicitActive
    ) {
      const {
        agent
      } =
        await requireHr();

      const value =
        typeof input ===
          "object" &&
        input !==
          null
          ? input
          : {
              id:
                input
            };

      const key =
        text(
          value._id ||
          value.id ||
          value.skId ||
          value.skID ||
          value.sk_id ||
          value.agentId ||
          value.agent_id,
          180
        );

      const active =
        explicitActive ===
          true ||
        explicitActive ===
          false
          ? explicitActive
          : boolValue(
              value.active,
              false
            );

      const existing =
        await requireStaffRow(
          key
        );

      const existingPayload =
        objectValue(
          existing.payload
        );

      const existingHr =
        hrRecordFromPayload(
          existingPayload
        );

      const body = {
        active,

        status:
          active
            ? "active"
            : "inactive",

        employment_status:
          active
            ? "active"
            : "inactive",

        portal_access:
          active,

        authorized:
          active,

        payload: {
          ...existingPayload,

          hrRecord: {
            ...existingHr,

            lastStatusChangedAt:
              now(),

            lastStatusChangedTo:
              active
                ? "active"
                : "inactive"
          }
        },

        updated_at:
          now()
      };

      const rows =
        await restRequest({
          table:
            AGENT_TABLE,

          method:
            "PATCH",

          query: {
            id:
              `eq.${existing.id}`
          },

          body
        });

      const saved =
        first(
          rows
        ) || {
          ...existing,
          ...body
        };

      await audit(
        agent,

        active
          ? "STAFF_REACTIVATED"
          : "STAFF_DEACTIVATED",

        existing.id,

        staffMap(
          existing
        ),

        staffMap(
          saved
        )
      );

      return {
        ok:
          true,

        active,

        staff:
          staffMap(
            saved
          ),

        item:
          staffMap(
            saved
          ),

        message:
          active
            ? "Staff record reactivated."
            : "Staff record deactivated."
      };
    }
  );


/* ==========================================================================
   GENERATE SK-ID
   ========================================================================== */

export const generateSkId =
  webMethod(
    Permissions.SiteMember,

    async function (
      input = {}
    ) {
      await requireHr();

      const skId =
        await uniqueSkId(
          input
        );

      return {
        ok:
          true,

        skId,

        skID:
          skId,

        prefix:
          skId.slice(
            0,
            2
          )
      };
    }
  );


/* ==========================================================================
   ACCESS / PERMISSIONS
   ========================================================================== */

export const saveStaffAccess =
  webMethod(
    Permissions.SiteMember,

    async function (
      input = {}
    ) {
      const {
        agent
      } =
        await requireHr();

      const item =
        itemOf(
          input
        );

      const key =
        text(
          item._id ||
          item.id ||
          input.staffId ||
          input.id ||
          item.skId ||
          item.skID ||
          item.sk_id,
          180
        );

      const existing =
        await requireStaffRow(
          key
        );

      const payload =
        objectValue(
          existing.payload
        );

      const accessInput = {
        ...objectValue(
          input.permissions
        ),

        ...objectValue(
          input.access
        ),

        ...objectValue(
          item.permissions
        ),

        ...objectValue(
          item.access
        )
      };

      const permissions = {
        ...permissionsFromPayload(
          payload
        )
      };

      Object.entries(
        accessInput
      ).forEach(
        ([
          name,
          value
        ]) => {
          permissions[
            text(
              name,
              120
            )
          ] =
            value === true ||
            value === false
              ? value
              : safeClientValue(
                  value
                );
        }
      );

      const portalAccess =
        Object.prototype
          .hasOwnProperty
          .call(
            item,
            "portalAccess"
          ) ||
        Object.prototype
          .hasOwnProperty
          .call(
            input,
            "portalAccess"
          )
          ? boolValue(
              item.portalAccess ??
              input.portalAccess,
              existing
                .portal_access ===
              true
            )
          : existing
              .portal_access ===
            true;

      const authorized =
        Object.prototype
          .hasOwnProperty
          .call(
            item,
            "authorized"
          ) ||
        Object.prototype
          .hasOwnProperty
          .call(
            input,
            "authorized"
          )
          ? boolValue(
              item.authorized ??
              input.authorized,
              existing
                .authorized ===
              true
            )
          : existing
              .authorized ===
            true;

      const canPayroll =
        Object.prototype
          .hasOwnProperty
          .call(
            item,
            "canAccessPayroll"
          ) ||
        Object.prototype
          .hasOwnProperty
          .call(
            input,
            "canAccessPayroll"
          ) ||
        Object.prototype
          .hasOwnProperty
          .call(
            accessInput,
            "payroll"
          )
          ? boolValue(
              item.canAccessPayroll ??
              input.canAccessPayroll ??
              accessInput.payroll,
              existing
                .can_access_payroll ===
              true
            )
          : existing
              .can_access_payroll ===
            true;

      const canGroupTalk =
        Object.prototype
          .hasOwnProperty
          .call(
            item,
            "canAccessGroupTalk"
          ) ||
        Object.prototype
          .hasOwnProperty
          .call(
            input,
            "canAccessGroupTalk"
          ) ||
        Object.prototype
          .hasOwnProperty
          .call(
            accessInput,
            "grouptalk"
          )
          ? boolValue(
              item.canAccessGroupTalk ??
              input.canAccessGroupTalk ??
              accessInput.grouptalk,
              existing
                .can_access_grouptalk ===
              true
            )
          : existing
              .can_access_grouptalk ===
            true;

      const canManage =
        Object.prototype
          .hasOwnProperty
          .call(
            item,
            "canManage"
          ) ||
        Object.prototype
          .hasOwnProperty
          .call(
            input,
            "canManage"
          ) ||
        Object.prototype
          .hasOwnProperty
          .call(
            accessInput,
            "manage"
          )
          ? boolValue(
              item.canManage ??
              input.canManage ??
              accessInput.manage,
              existing
                .can_manage ===
              true
            )
          : existing
              .can_manage ===
            true;

      const body = {
        portal_access:
          portalAccess,

        authorized,

        can_access_payroll:
          canPayroll,

        can_access_grouptalk:
          canGroupTalk,

        can_manage:
          canManage,

        payload: {
          ...payload,

          permissions,

          access:
            permissions,

          accessRoles:
            permissions
        },

        updated_at:
          now()
      };

      const rows =
        await restRequest({
          table:
            AGENT_TABLE,

          method:
            "PATCH",

          query: {
            id:
              `eq.${existing.id}`
          },

          body
        });

      const saved =
        first(
          rows
        ) || {
          ...existing,
          ...body
        };

      await audit(
        agent,

        "STAFF_ACCESS_UPDATED",

        existing.id,

        {
          portalAccess:
            existing
              .portal_access ===
            true,

          authorized:
            existing
              .authorized ===
            true,

          canAccessPayroll:
            existing
              .can_access_payroll ===
            true,

          canAccessGroupTalk:
            existing
              .can_access_grouptalk ===
            true,

          canManage:
            existing
              .can_manage ===
            true,

          permissions:
            permissionsFromPayload(
              payload
            )
        },

        {
          portalAccess,

          authorized,

          canAccessPayroll:
            canPayroll,

          canAccessGroupTalk:
            canGroupTalk,

          canManage,

          permissions
        }
      );

      return {
        ok:
          true,

        staff:
          staffMap(
            saved
          ),

        item:
          staffMap(
            saved
          ),

        access: {
          portalAccess,

          authorized,

          canAccessPayroll:
            canPayroll,

          canAccessGroupTalk:
            canGroupTalk,

          canManage,

          permissions
        }
      };
    }
  );


/* ==========================================================================
   WIX MEMBER LINKING
   ========================================================================== */

export const lookupAndLinkWixMember =
  webMethod(
    Permissions.SiteMember,

    async function (
      input = {}
    ) {
      const {
        agent
      } =
        await requireHr();

      const item =
        itemOf(
          input
        );

      const key =
        text(
          typeof input ===
            "string"
            ? input
            : item._id ||
              item.id ||
              item.skId ||
              item.skID ||
              input.staffId,
          180
        );

      const staffRow =
        await requireStaffRow(
          key
        );

      const member =
        await resolveWixMember(
          staffRow
        );

      if (!member) {
        return {
          ok:
            true,

          found:
            false,

          linked:
            false,

          staff:
            staffMap(
              staffRow
            ),

          member:
            null,

          message:
            "No Wix member was found for this employee."
        };
      }

      const linked =
        await linkWixMember(
          staffRow,
          member
        );

      await audit(
        agent,

        "WIX_MEMBER_LINKED",

        staffRow.id,

        {
          memberId:
            staffRow
              .wix_member_id ||
            staffRow
              .member_id ||
            ""
        },

        {
          memberId:
            wixMemberMap(
              member
            ).memberId
        }
      );

      return {
        ok:
          true,

        found:
          true,

        linked:
          true,

        staff:
          staffMap(
            linked
          ),

        member:
          wixMemberMap(
            member
          )
      };
    }
  );


export const createLinkedWixMember =
  webMethod(
    Permissions.SiteMember,

    async function (
      input = {}
    ) {
      const {
        agent
      } =
        await requireHr();

      const item =
        itemOf(
          input
        );

      const key =
        text(
          typeof input ===
            "string"
            ? input
            : item._id ||
              item.id ||
              item.skId ||
              item.skID ||
              input.staffId,
          180
        );

      const staffRow =
        await requireStaffRow(
          key
        );

      const existingMember =
        await resolveWixMember(
          staffRow
        );

      if (
        existingMember
      ) {
        const linked =
          await linkWixMember(
            staffRow,
            existingMember
          );

        return {
          ok:
            true,

          created:
            false,

          linked:
            true,

          staff:
            staffMap(
              linked
            ),

          member:
            wixMemberMap(
              existingMember
            ),

          message:
            "An existing Wix member was found and linked."
        };
      }

      const result =
        await elevatedCreateMember(
          wixCreatePayload(
            staffRow
          )
        );

      const member =
        result?.member ||
        result;

      const linked =
        await linkWixMember(
          staffRow,
          member
        );

      await audit(
        agent,

        "WIX_MEMBER_CREATED",

        staffRow.id,

        null,

        wixMemberMap(
          member
        )
      );

      return {
        ok:
          true,

        created:
          true,

        linked:
          true,

        staff:
          staffMap(
            linked
          ),

        member:
          wixMemberMap(
            member
          ),

        message:
          "Wix staff member created and linked."
      };
    }
  );


export const syncLinkedWixMember =
  webMethod(
    Permissions.SiteMember,

    async function (
      input = {}
    ) {
      const {
        agent
      } =
        await requireHr();

      const item =
        itemOf(
          input
        );

      const key =
        text(
          typeof input ===
            "string"
            ? input
            : item._id ||
              item.id ||
              item.skId ||
              item.skID ||
              input.staffId,
          180
        );

      const staffRow =
        await requireStaffRow(
          key
        );

      let member =
        await resolveWixMember(
          staffRow
        );

      if (!member) {
        throw new Error(
          "HR_WIX_MEMBER_NOT_FOUND"
        );
      }

      member =
        await updateWixMemberFromStaff(
          member,
          staffRow
        );

      const linked =
        await linkWixMember(
          staffRow,
          member
        );

      await audit(
        agent,

        "WIX_MEMBER_SYNCED",

        staffRow.id,

        null,

        wixMemberMap(
          member
        )
      );

      return {
        ok:
          true,

        linked:
          true,

        synchronized:
          true,

        staff:
          staffMap(
            linked
          ),

        member:
          wixMemberMap(
            member
          ),

        message:
          "Wix member synchronized with the staff record."
      };
    }
  );


export const sendLinkedWixSetPasswordEmail =
  webMethod(
    Permissions.SiteMember,

    async function (
      input = {}
    ) {
      const {
        agent
      } =
        await requireHr();

      const item =
        itemOf(
          input
        );

      const key =
        text(
          typeof input ===
            "string"
            ? input
            : item._id ||
              item.id ||
              item.skId ||
              item.skID ||
              input.staffId,
          180
        );

      const staffRow =
        await requireStaffRow(
          key
        );

      const member =
        await resolveWixMember(
          staffRow
        );

      if (!member) {
        throw new Error(
          "HR_WIX_MEMBER_NOT_FOUND"
        );
      }

      const email =
        normalizeEmail(
          wixMemberMap(
            member
          ).loginEmail ||
          staffRow
            .corporate_email_address ||
          staffRow.email
        );

      if (
        !validEmail(
          email
        )
      ) {
        throw new Error(
          "HR_WIX_EMAIL_REQUIRED"
        );
      }

      await elevatedSendSetPasswordEmail(
        email
      );

      const payload =
        objectValue(
          staffRow.payload
        );

      const hrRecord =
        hrRecordFromPayload(
          payload
        );

      await restRequest({
        table:
          AGENT_TABLE,

        method:
          "PATCH",

        query: {
          id:
            `eq.${staffRow.id}`
        },

        body: {
          payload: {
            ...payload,

            hrRecord: {
              ...hrRecord,

              lastSetPasswordEmailAt:
                now()
            }
          },

          updated_at:
            now()
        },

        prefer:
          "return=minimal"
      });

      await audit(
        agent,

        "WIX_PASSWORD_EMAIL_SENT",

        staffRow.id,

        null,

        {
          email
        }
      );

      return {
        ok:
          true,

        sent:
          true,

        email,

        member:
          wixMemberMap(
            member
          ),

        message:
          "Set-password email sent."
      };
    }
  );


export const approveLinkedWixMember =
  webMethod(
    Permissions.SiteMember,

    async function (
      input = {}
    ) {
      const {
        agent
      } =
        await requireHr();

      const item =
        itemOf(
          input
        );

      const key =
        text(
          typeof input ===
            "string"
            ? input
            : item._id ||
              item.id ||
              item.skId ||
              item.skID ||
              input.staffId,
          180
        );

      const staffRow =
        await requireStaffRow(
          key
        );

      const member =
        await resolveWixMember(
          staffRow
        );

      if (!member) {
        throw new Error(
          "HR_WIX_MEMBER_NOT_FOUND"
        );
      }

      const email =
        normalizeEmail(
          wixMemberMap(
            member
          ).loginEmail ||
          staffRow
            .corporate_email_address ||
          staffRow.email
        );

      if (
        !validEmail(
          email
        )
      ) {
        throw new Error(
          "HR_WIX_EMAIL_REQUIRED"
        );
      }

      await elevatedApproveByEmail(
        email
      );

      const rows =
        await restRequest({
          table:
            AGENT_TABLE,

          method:
            "PATCH",

          query: {
            id:
              `eq.${staffRow.id}`
          },

          body: {
            authorized:
              true,

            portal_access:
              true,

            status:
              staffRow.active ===
                true
                ? "active"
                : staffRow.status ||
                  "inactive",

            updated_at:
              now()
          }
        });

      const saved =
        first(
          rows
        ) || {
          ...staffRow,

          authorized:
            true,

          portal_access:
            true
        };

      await audit(
        agent,

        "WIX_MEMBER_APPROVED",

        staffRow.id,

        null,

        {
          email
        }
      );

      return {
        ok:
          true,

        approved:
          true,

        staff:
          staffMap(
            saved
          ),

        member:
          wixMemberMap(
            member
          ),

        message:
          "Wix member approved."
      };
    }
  );


export const blockLinkedWixMember =
  webMethod(
    Permissions.SiteMember,

    async function (
      input = {}
    ) {
      const {
        agent
      } =
        await requireHr();

      const item =
        itemOf(
          input
        );

      const key =
        text(
          typeof input ===
            "string"
            ? input
            : item._id ||
              item.id ||
              item.skId ||
              item.skID ||
              input.staffId,
          180
        );

      const staffRow =
        await requireStaffRow(
          key
        );

      const member =
        await resolveWixMember(
          staffRow
        );

      if (!member) {
        throw new Error(
          "HR_WIX_MEMBER_NOT_FOUND"
        );
      }

      const email =
        normalizeEmail(
          wixMemberMap(
            member
          ).loginEmail ||
          staffRow
            .corporate_email_address ||
          staffRow.email
        );

      if (
        !validEmail(
          email
        )
      ) {
        throw new Error(
          "HR_WIX_EMAIL_REQUIRED"
        );
      }

      await elevatedBlockByEmail(
        email
      );

      const rows =
        await restRequest({
          table:
            AGENT_TABLE,

          method:
            "PATCH",

          query: {
            id:
              `eq.${staffRow.id}`
          },

          body: {
            authorized:
              false,

            portal_access:
              false,

            status:
              "blocked",

            updated_at:
              now()
          }
        });

      const saved =
        first(
          rows
        ) || {
          ...staffRow,

          authorized:
            false,

          portal_access:
            false,

          status:
            "blocked"
        };

      await audit(
        agent,

        "WIX_MEMBER_BLOCKED",

        staffRow.id,

        null,

        {
          email
        }
      );

      return {
        ok:
          true,

        blocked:
          true,

        staff:
          staffMap(
            saved
          ),

        member:
          wixMemberMap(
            member
          ),

        message:
          "Wix member blocked and portal access disabled."
      };
    }
  );


/* ==========================================================================
   BADGE / PRINT
   ========================================================================== */

export const printStaffBadge =
  webMethod(
    Permissions.SiteMember,

    async function (
      input = {},
      options = {}
    ) {
      const {
        agent
      } =
        await requireHr();

      const item =
        typeof input ===
          "object" &&
        input !==
          null
          ? itemOf(
              input
            )
          : {
              _id:
                input,

              ...objectValue(
                options
              )
            };

      const key =
        text(
          item._id ||
          item.id ||
          item.skId ||
          item.skID ||
          item.sk_id,
          180
        );

      const existing =
        await requireStaffRow(
          key
        );

      const payload =
        objectValue(
          existing.payload
        );

      const hrRecord =
        hrRecordFromPayload(
          payload
        );

      const badgePhoto =
        text(
          item.badgePhoto ||
          item.badgePhotoUrl ||
          item.badge_photo_url ||
          existing
            .badge_photo_url,
          2000
        );

      const badgeStatus =
        text(
          item.badgeStatus ||
          item.status ||
          hrRecord.badgeStatus ||
          "PRINTED",
          80
        )
          .toUpperCase();

      const printJobId =
        `BADGE-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)
          .toUpperCase()}`;

      const body = {
        badge_photo_url:
          badgePhoto ||
          existing
            .badge_photo_url ||
          null,

        payload: {
          ...payload,

          hrRecord: {
            ...hrRecord,

            badgeStatus,

            lastBadgePrintId:
              printJobId,

            lastBadgePrintedAt:
              now()
          }
        },

        updated_at:
          now()
      };

      const rows =
        await restRequest({
          table:
            AGENT_TABLE,

          method:
            "PATCH",

          query: {
            id:
              `eq.${existing.id}`
          },

          body
        });

      const saved =
        first(
          rows
        ) || {
          ...existing,
          ...body
        };

      const staff =
        staffMap(
          saved
        );

      const badge = {
        printJobId,

        skId:
          staff.skId,

        displayName:
          staff.displayName,

        firstName:
          staff.firstName,

        lastName:
          staff.lastName,

        jobTitle:
          staff.jobTitle,

        department:
          staff.department,

        station:
          staff.station,

        badgePhotoUrl:
          staff.badgePhotoUrl,

        badgeStatus,

        printedAt:
          now()
      };

      await audit(
        agent,

        "BADGE_PRINTED",

        existing.id,

        null,

        badge
      );

      return {
        ok:
          true,

        printed:
          true,

        staff,

        badge,

        printData:
          badge,

        message:
          "Badge print record created."
      };
    }
  );


/* ==========================================================================
   REPORTS / CREWCONTROL / BADGE CONTROL
   ========================================================================== */

export const getStaffHrReports =
  webMethod(
    Permissions.SiteMember,

    async function (
      input = {}
    ) {
      await requireHr();

      const rows =
        await restRequest({
          table:
            AGENT_TABLE,

          query: {
            select:
              "*",

            order:
              "last_name.asc,first_name.asc",

            limit:
              MAX_STAFF
          }
        });

      let staff =
        (
          Array.isArray(
            rows
          )
            ? rows
            : []
        )
          .map(
            staffMap
          );

      const skId =
        normalizeSkId(
          input.skId ||
          input.skID ||
          input.sk_id
        );

      const section =
        text(
          input.section,
          80
        )
          .toLowerCase();

      if (skId) {
        staff =
          staff.filter(
            (person) =>
              person.skId ===
              skId
          );
      }

      const summary =
        reportSummary(
          staff
        );

      const organization =
        organizationFromStaff(
          staff
        );

      const crewcontrol =
        staff.map(
          (person) => ({
            _id:
              person.id,

            id:
              person.id,

            skId:
              person.skId,

            displayName:
              person.displayName,

            firstName:
              person.firstName,

            lastName:
              person.lastName,

            jobTitle:
              person.jobTitle,

            department:
              person.department,

            station:
              person.station,

            base:
              person.base,

            managerName:
              person.managerName,

            employmentStatus:
              person.employmentStatus,

            active:
              person.active,

            route:
              person.route ||
              person.crewRoute ||
              person.crewcontrolRoute ||
              "",

            dutyCode:
              person.dutyCode ||
              "",

            officeId:
              person.officeId ||
              "",

            payload:
              safeClientValue(
                person.selfService
              ) ||
              {}
          })
        );

      const badgeControl =
        staff.map(
          (person) => ({
            _id:
              person.id,

            id:
              person.id,

            skId:
              person.skId,

            displayName:
              person.displayName,

            jobTitle:
              person.jobTitle,

            department:
              person.department,

            station:
              person.station,

            badgePhotoUrl:
              person.badgePhotoUrl,

            badgeStatus:
              person.badgeStatus ||
              "",

            badgeIssuedAt:
              person.badgeIssuedAt ||
              "",

            badgeExpiresAt:
              person.badgeExpiresAt ||
              "",

            active:
              person.active
          })
        );

      const response = {
        ok:
          true,

        section,

        staff,

        items:
          staff,

        archive:
          staff.filter(
            (person) =>
              person.active !==
              true
          ),

        summary,

        reports:
          summary,

        organization,

        crewcontrol,

        badgeControl,

        generatedAt:
          now()
      };

      if (
        section ===
        "crewcontrol"
      ) {
        return {
          ...response,

          items:
            crewcontrol,

          staff:
            crewcontrol
        };
      }

      if (
        section ===
          "badgecontrol" ||
        section ===
          "badge-control"
      ) {
        return {
          ...response,

          items:
            badgeControl,

          staff:
            badgeControl
        };
      }

      return response;
    }
  );
