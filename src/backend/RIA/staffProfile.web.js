import {
  webMethod,
  Permissions
} from "wix-web-module";

import {
  currentMember
} from "wix-members-backend";

import {
  restRequest
} from "backend/RIA/supabaseServer.js";


const AGENT_TABLE =
  "agent_users";

const PAYROLL_TABLE =
  "staff_payroll_profiles";


/* ==========================================================================
   FIELD POLICY
   ========================================================================== */

const SELF_SERVICE_FIELDS =
  Object.freeze([
    "phone",
    "homeAddressStreet",
    "homeAddressLine2",
    "homeAddressCity",
    "homeAddressState",
    "homeAddressPostalCode",
    "homeAddressCountry",
    "emergencyContactName",
    "emergencyContactRelationship",
    "emergencyContactPhone"
  ]);

const PAYROLL_PAYMENT_FIELDS =
  Object.freeze([
    "bankName",
    "bankIban",
    "bankBicSwift",
    "bankClearingNumber",
    "bankAccountNumber",
    "usAccountType",
    "usRoutingNumber",
    "usAccountNumber"
  ]);

const SENSITIVE_PAYMENT_FIELDS =
  new Set([
    "bankIban",
    "bankClearingNumber",
    "bankAccountNumber",
    "usRoutingNumber",
    "usAccountNumber"
  ]);


/* ==========================================================================
   HELPERS
   ========================================================================== */

function clean(
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

function normalizeEmail(
  value
) {
  return clean(
    value,
    254
  )
    .toLowerCase();
}

function first(
  rows
) {
  return (
    Array.isArray(
      rows
    ) &&
    rows.length
  )
    ? rows[0]
    : null;
}

function objectValue(
  value
) {
  return (
    value &&
    typeof value ===
      "object" &&
    !Array.isArray(
      value
    )
  )
    ? value
    : {};
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

  return normalizeEmail(
    member.loginEmail ||
    contactEmail ||
    member
      ?.profile
      ?.email ||
    member.email ||
    ""
  );
}

function displayName(
  agent = {}
) {
  return clean(
    agent.preferred_name ||
    agent.display_name ||
    [
      agent.first_name,
      agent.last_name
    ]
      .filter(
        Boolean
      )
      .join(
        " "
      ) ||
    agent.email ||
    agent.sk_id ||
    "Staff",
    160
  );
}

function employmentRole(
  agent = {}
) {
  return clean(
    agent.job_title ||
    "",
    120
  );
}

function agentSelect() {
  return [
    "id",
    "agent_id",
    "member_id",
    "wix_member_id",
    "contact_id",
    "email",
    "corporate_email_address",
    "sk_id",
    "first_name",
    "last_name",
    "display_name",
    "preferred_name",
    "job_title",
    "department",
    "station",
    "base",
    "manager_name",
    "employment_status",
    "status",
    "active",
    "portal_access",
    "authorized",
    "can_access_payroll",
    "can_access_grouptalk",
    "can_manage",
    "payload",
    "created_at",
    "updated_at",
    "last_login_at"
    "badge_photo_url",

  ].join(",");
}


/* ==========================================================================
   CURRENT MEMBER -> SUPABASE AGENT
   ========================================================================== */

async function currentWixMember() {
  try {
    const member =
      await currentMember
        .getMember({
          fieldsets: [
            "FULL"
          ]
        });

    return member ||
      null;
  } catch (_) {
    return null;
  }
}

async function findAgentByMemberId(
  memberId
) {
  const id =
    clean(
      memberId,
      100
    );

  if (!id) {
    return null;
  }

  let agent =
    first(
      await restRequest({
        table:
          AGENT_TABLE,

        query: {
          select:
            agentSelect(),

          wix_member_id:
            `eq.${id}`,

          limit:
            1
        }
      })
    );

  if (agent) {
    return agent;
  }

  agent =
    first(
      await restRequest({
        table:
          AGENT_TABLE,

        query: {
          select:
            agentSelect(),

          member_id:
            `eq.${id}`,

          limit:
            1
        }
      })
    );

  return agent;
}

async function findAgentByEmail(
  email
) {
  const value =
    normalizeEmail(
      email
    );

  if (!value) {
    return null;
  }

  let agent =
    first(
      await restRequest({
        table:
          AGENT_TABLE,

        query: {
          select:
            agentSelect(),

          corporate_email_address:
            `ilike.${value}`,

          limit:
            1
        }
      })
    );

  if (agent) {
    return agent;
  }

  return first(
    await restRequest({
      table:
        AGENT_TABLE,

      query: {
        select:
          agentSelect(),

        email:
          `ilike.${value}`,

        limit:
          1
      }
    })
  );
}

async function syncMemberLink(
  agent,
  member
) {
  if (!agent?.id || !member) {
    return agent;
  }

  const memberId =
    clean(
      member._id ||
      member.id,
      100
    );

  if (!memberId) {
    return agent;
  }

  const wixId =
    clean(
      agent.wix_member_id,
      100
    );

  const legacyId =
    clean(
      agent.member_id,
      100
    );

  if (
    (wixId && wixId !== memberId) ||
    (legacyId && legacyId !== memberId)
  ) {
    throw new Error(
      "WIX_MEMBER_LINK_MISMATCH"
    );
  }

  if (
    wixId === memberId &&
    legacyId === memberId
  ) {
    return agent;
  }

  const rows =
    await restRequest({
      table:
        AGENT_TABLE,

      method:
        "PATCH",

      query: {
        id:
          `eq.${agent.id}`
      },

      body: {
        wix_member_id:
          memberId,

        member_id:
          memberId,

        updated_at:
          new Date()
            .toISOString()
      }
    });

  return first(
    rows
  ) || {
    ...agent,
    wix_member_id:
      memberId,
    member_id:
      memberId
  };
}

function assertAgentAccess(
  agent
) {
  if (!agent) {
    throw new Error(
      "STAFF_PROFILE_NOT_FOUND"
    );
  }

  if (
    agent.active !== true
  ) {
    throw new Error(
      "STAFF_PROFILE_INACTIVE"
    );
  }

  if (
    agent.authorized !== true
  ) {
    throw new Error(
      "STAFF_PROFILE_NOT_AUTHORIZED"
    );
  }

  if (
    agent.portal_access !== true
  ) {
    throw new Error(
      "STAFF_PROFILE_PORTAL_DISABLED"
    );
  }
}

async function requireProfileSession() {
  const member =
    await currentWixMember();

  if (
    !member?._id &&
    !member?.id
  ) {
    throw new Error(
      "STAFF_PROFILE_AUTH_REQUIRED"
    );
  }

  const memberId =
    clean(
      member._id ||
      member.id,
      100
    );

  const email =
    memberEmail(
      member
    );

  let agent =
    await findAgentByMemberId(
      memberId
    );

  if (!agent) {
    agent =
      await findAgentByEmail(
        email
      );
  }

  assertAgentAccess(
    agent
  );

  agent =
    await syncMemberLink(
      agent,
      member
    );

  return {
    member,
    memberId,
    email,
    agent,
    agentId:
      agent.id
  };
}


/* ==========================================================================
   PAYROLL PROFILE
   ========================================================================== */

function payrollStaffKey(
  agent = {}
) {
  return clean(
    agent.sk_id ||
    agent.agent_id ||
    agent.id,
    160
  );
}

async function loadPayrollProfile(
  agent
) {
  const staffKey =
    payrollStaffKey(
      agent
    );

  if (!staffKey) {
    return null;
  }

  const rows =
    await restRequest({
      table:
        PAYROLL_TABLE,

      query: {
        select:
          "*",

        staff_key:
          `eq.${staffKey}`,

        limit:
          1
      }
    });

  return first(
    rows
  );
}

function safePaymentView(
  payroll = {}
) {
  const payload =
    objectValue(
      payroll.payload
    );

  const payment =
    objectValue(
      payload.paymentPreference
    );

  const output = {
    bankName:
      clean(
        payment.bankName,
        120
      ),

    bankBicSwift:
      clean(
        payment.bankBicSwift,
        40
      ),

    usAccountType:
      clean(
        payment.usAccountType,
        40
      ),

    paymentSetupStatus:
      clean(
        payroll.bank_status ||
        payment.paymentSetupStatus ||
        "",
        80
      )
  };

  SENSITIVE_PAYMENT_FIELDS.forEach(
    (key) => {
      output[key] =
        "";
    }
  );

  return output;
}


/* ==========================================================================
   PUBLIC PROFILE SHAPE
   ========================================================================== */

function publicProfile(
  agent = {},
  payroll = null
) {
  const payload =
    objectValue(
      agent.payload
    );

  const self =
    objectValue(
      payload.selfService
    );

  const canManage =
    agent.can_manage ===
    true;

  const payrollAccess =
    agent.can_access_payroll ===
    true;

  return {
    id:
      agent.id ||
      "",

    agentId:
      agent.agent_id ||
      "",

    employeeId:
      agent.id ||
      "",

    memberId:
      agent.member_id ||
      "",

    wixMemberId:
      agent.wix_member_id ||
      "",

    skId:
      agent.sk_id ||
      "",

    firstName:
      agent.first_name ||
      "",

    lastName:
      agent.last_name ||
      "",

    displayName:
      displayName(
        agent
      ),

    fullName:
      displayName(
        agent
      ),

    preferredName:
      agent.preferred_name ||
      self.preferredName ||
      "",

    email:
      agent.email ||
      "",

    corporateEmailAddress:
      agent.corporate_email_address ||
      agent.email ||
      "",

    role:
      employmentRole(
        agent
      ),


    jobTitle:
      agent.job_title ||
      "",

    department:
      agent.department ||
      "",

    assignedDepartment:
      agent.department ||
      "",

    station:
      agent.station ||
      agent.base ||
      "",

    base:
      agent.base ||
      agent.station ||
      "",

    assignedBase:
      agent.station ||
      agent.base ||
      "",

    managerName:
      agent.manager_name ||
      "",

    employmentStatus:
      agent.employment_status ||
      "",

    status:
      agent.status ||
      "",

    active:
      agent.active ===
      true,

    portalAccess:
      agent.portal_access ===
      true,

    authorized:
      agent.authorized ===
      true,

    canManage,

    canUsePayroll:
      payrollAccess,

    canUseGroupTalk:
      agent.can_access_grouptalk ===
      true,

    permissions: {
      payroll:
        payrollAccess,

      groupTalk:
        agent.can_access_grouptalk ===
        true,

      manage:
        canManage
    },

    phone:
      clean(
        self.phone,
        60
      ),

    homeAddressStreet:
      clean(
        self.homeAddressStreet,
        160
      ),

    homeAddressLine2:
      clean(
        self.homeAddressLine2,
        120
      ),

    homeAddressCity:
      clean(
        self.homeAddressCity,
        80
      ),

    homeAddressState:
      clean(
        self.homeAddressState,
        80
      ),

    homeAddressPostalCode:
      clean(
        self.homeAddressPostalCode,
        40
      ),

    homeAddressCountry:
      clean(
        self.homeAddressCountry,
        80
      ),

    emergencyContactName:
      clean(
        self.emergencyContactName,
        120
      ),

    emergencyContactRelationship:
      clean(
        self.emergencyContactRelationship,
        80
      ),

    emergencyContactPhone:
      clean(
        self.emergencyContactPhone,
        60
      ),

    ...safePaymentView(
      payroll ||
      {}
    ),

    updatedAt:
      agent.updated_at ||
      ""
  };
}


/* ==========================================================================
   PROFILE MUTATIONS
   ========================================================================== */

function requestedSelfService(
  profile = {}
) {
  const output =
    {};

  SELF_SERVICE_FIELDS.forEach(
    (key) => {
      if (
        Object.prototype.hasOwnProperty.call(
          profile,
          key
        )
      ) {
        output[key] =
          clean(
            profile[key],
            key.includes(
              "Address"
            )
              ? 160
              : 120
          );
      }
    }
  );

  return output;
}

function requestedPayment(
  profile = {}
) {
  const output =
    {};

  PAYROLL_PAYMENT_FIELDS.forEach(
    (key) => {
      if (
        Object.prototype.hasOwnProperty.call(
          profile,
          key
        )
      ) {
        output[key] =
          clean(
            profile[key],
            160
          );
      }
    }
  );

  return output;
}

async function savePayrollPayment(
  agent,
  paymentPatch
) {
  if (
    !paymentPatch ||
    !Object.keys(
      paymentPatch
    ).length
  ) {
    return loadPayrollProfile(
      agent
    );
  }

  const existing =
    await loadPayrollProfile(
      agent
    );

  const staffKey =
    payrollStaffKey(
      agent
    );

  const now =
    new Date()
      .toISOString();

  const existingPayload =
    objectValue(
      existing?.payload
    );

  const existingPayment =
    objectValue(
      existingPayload
        .paymentPreference
    );

  const mergedPayment = {
    ...existingPayment
  };

  Object.entries(
    paymentPatch
  ).forEach(
    ([key, value]) => {
      if (
        SENSITIVE_PAYMENT_FIELDS.has(
          key
        ) &&
        !value
      ) {
        return;
      }

      mergedPayment[key] =
        value;
    }
  );

  const payload = {
    ...existingPayload,

    paymentPreference:
      mergedPayment
  };

  if (existing?.id) {
    const rows =
      await restRequest({
        table:
          PAYROLL_TABLE,

        method:
          "PATCH",

        query: {
          id:
            `eq.${existing.id}`
        },

        body: {
          display_name:
            displayName(
              agent
            ),

          email:
            agent.corporate_email_address ||
            agent.email ||
            null,

          sk_id:
            agent.sk_id ||
            null,

          agent_user_id:
            agent.id,

          payload,

          updated_at:
            now
        }
      });

    return first(
      rows
    ) || existing;
  }

  const rows =
    await restRequest({
      table:
        PAYROLL_TABLE,

      method:
        "POST",

      body: {
        staff_key:
          staffKey,

        agent_user_id:
          agent.id,

        sk_id:
          agent.sk_id ||
          null,

        display_name:
          displayName(
            agent
          ),

        email:
          agent.corporate_email_address ||
          agent.email ||
          null,

        employment_type:
          "employee",

        payroll_enabled:
          agent.can_access_payroll ===
          true,

        bank_status:
          "not_verified",

        payload,

        created_by_agent_user_id:
          agent.id,

        updated_at:
          now
      }
    });

  return first(
    rows
  );
}


/* ==========================================================================
   WEB METHODS
   ========================================================================== */

export const getMyStaffProfile =
  webMethod(
    Permissions.Anyone,

    async function () {
      const {
        agent
      } =
        await requireProfileSession();

      const payroll =
        await loadPayrollProfile(
          agent
        );

      return {
        ok:
          true,

        profile:
          publicProfile(
            agent,
            payroll
          )
      };
    }
  );


export const updateMyStaffProfile =
  webMethod(
    Permissions.Anyone,

    async function ({
      profile = {}
    } = {}) {
      const {
        agent
      } =
        await requireProfileSession();

      const currentPayload =
        objectValue(
          agent.payload
        );

      const currentSelf =
        objectValue(
          currentPayload.selfService
        );

      const selfPatch =
        requestedSelfService(
          profile
        );

      const paymentPatch =
        requestedPayment(
          profile
        );

      const preferredName =
        Object.prototype.hasOwnProperty.call(
          profile,
          "preferredName"
        )
          ? clean(
              profile.preferredName,
              80
            )
          : agent.preferred_name ||
            "";

      const nextPayload = {
        ...currentPayload,

        selfService: {
          ...currentSelf,
          ...selfPatch,
          preferredName
        }
      };

      const now =
        new Date()
          .toISOString();

      const updatedRows =
        await restRequest({
          table:
            AGENT_TABLE,

          method:
            "PATCH",

          query: {
            id:
              `eq.${agent.id}`
          },

          body: {
            preferred_name:
              preferredName,

            display_name:
              displayName({
                ...agent,
                preferred_name:
                  preferredName
              }),

            payload:
              nextPayload,

            updated_at:
              now
          }
        });

      const updatedAgent =
        first(
          updatedRows
        ) || {
          ...agent,
          preferred_name:
            preferredName,
          payload:
            nextPayload,
          updated_at:
            now
        };

      const payroll =
        await savePayrollPayment(
          updatedAgent,
          paymentPatch
        );

      return {
        ok:
          true,

        profile:
          publicProfile(
            updatedAgent,
            payroll
          ),

        synchronized: {
          agentUsers:
            true,

          payroll:
            Object.keys(
              paymentPatch
            ).length >
            0
        },

        updatedAt:
          now
      };
    }
  );


export const searchStaffDirectory =
  webMethod(
    Permissions.Anyone,

    async function ({
      query = ""
    } = {}) {
      await requireProfileSession();

      const rows =
        await restRequest({
          table:
            AGENT_TABLE,

          query: {
            select:
              "id,sk_id,first_name,last_name,preferred_name,display_name,job_title,department,station,base,corporate_email_address,email,payload",

            active:
              "eq.true",

            limit:
              1000,

            order:
              "last_name.asc"
          }
        });

      const needle =
        clean(
          query,
          80
        )
          .toLowerCase();

      const items =
        (
          Array.isArray(
            rows
          )
            ? rows
            : []
        )
          .filter(
            (agent) => {
              if (!needle) {
                return true;
              }

              const haystack = [
                displayName(
                  agent
                ),
                agent.sk_id,
                agent.job_title,
                agent.department,
                agent.station,
                agent.base,
                agent.corporate_email_address,
                agent.email
              ]
                .map(
                  (value) =>
                    String(
                      value ||
                      ""
                    )
                      .toLowerCase()
                )
                .join(
                  " "
                );

              return haystack.includes(
                needle
              );
            }
          )
          .map(
            (agent) => ({
              id:
                agent.id,

              displayName:
                displayName(
                  agent
                ),

              firstName:
                agent.first_name ||
                "",

              lastName:
                agent.last_name ||
                "",

              preferredName:
                agent.preferred_name ||
                "",

              skId:
                agent.sk_id ||
                "",

              role:
                employmentRole(
                  agent
                ),

              position:
                agent.position ||
                agent.job_title ||
                agent.role ||
                "",

              jobTitle:
                agent.job_title ||
                agent.position ||
                agent.role ||
                "",

              department:
                agent.department ||
                "",

              station:
                agent.station ||
                agent.base ||
                "",

              base:
                agent.base ||
                agent.station ||
                "",

              corporateEmailAddress:
                agent.corporate_email_address ||
                agent.email ||
                "",

              workPhone:
                clean(
                  objectValue(
                    agent.payload
                  )
                    ?.selfService
                    ?.workPhone ||
                  "",
                  60
                )
            })
          );

      return {
        ok:
          true,

        items
      };
    }
  );
