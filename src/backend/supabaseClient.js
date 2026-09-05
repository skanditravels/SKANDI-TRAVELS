import {
  secrets
} from "wix-secrets-backend.v2";

import {
  elevate
} from "wix-auth";

import {
  fetch
} from "wix-fetch";


/* ==========================================================================
   CONFIGURATION
   ========================================================================== */

const elevatedGetSecretValue =
  elevate(
    secrets.getSecretValue
  );

let configurationPromise = null;


/* ==========================================================================
   TABLE ALLOWLIST
   ========================================================================== */

const INTERNAL_TABLES =
  new Set([
    "agent_users",
    "staff_login_audit",
    "admin_audit_logs",
    "legal_policies",
"legal_policy_revisions",

    "staff_payroll_profiles",
    "staff_payroll_periods",
    "staff_payroll_runs",
    "staff_payroll_run_lines",

    "uniform_categories",
    "uniform_catalog_items",
    "uniform_allowance_rules",
    "uniform_wallets",
    "uniform_wallet_ledger",
    "uniform_orders",
    "uniform_order_items",
    "uniform_policies",
    "uniform_policy_acknowledgements",
    "uniform_audit",

    "grouptalk_groups",
    "grouptalk_group_members",
    "grouptalk_phonebook",
    "grouptalk_ticket_categories",
    "grouptalk_tickets",
    "grouptalk_ticket_replies",
    "grouptalk_locations",
    "grouptalk_history",
    "grouptalk_realtime_sessions",
    "grouptalk_audit",

    "inventory_flight_legs",
    "inventory_flight_classes",
    "inventory_schedule_lines",
    "inventory_nesting_controls",

    "hotel_allocations",
    "tour_activity_inventory",
    "partner_ticket_inventory",

    "travel_products",
    "travel_product_components",
    "travel_product_price_cache",

    "master_inventory_audit",

    "altea_offer_cache",
    "amadeus_offer_cache",

    "career_applicant_accounts",
    "career_applicant_access_codes",
    "career_applicant_sessions",
    "career_application_files",
    "career_positions",

    "document_acknowledgements",
    "document_packet_items",
    "document_packets",
    "document_templates"
  ]);


/* ==========================================================================
   SECRET READER
   ========================================================================== */

async function readSecret(
  name
) {
  const response =
    await elevatedGetSecretValue(
      name
    );

  /*
   * wix-secrets-backend.v2 returns a response object.
   */
  const value =
    response?.value ??
    response?.secretValue ??
    response;

  return String(
    value || ""
  ).trim();
}


/* ==========================================================================
   SUPABASE CONFIGURATION
   ========================================================================== */

async function getConfiguration() {
  if (
    configurationPromise
  ) {
    return configurationPromise;
  }

  configurationPromise =
    (async () => {
      const baseUrl =
        await readSecret(
          "SUPABASE_URL"
        );

      let apiKey =
        "";

      /*
       * New server-side Supabase key first.
       */
      try {
        apiKey =
          await readSecret(
            "SUPABASE_SECRET_KEY"
          );
      } catch (_) {
        apiKey =
          "";
      }

      /*
       * Legacy fallback while migrating.
       */
      if (
        !apiKey
      ) {
        apiKey =
          await readSecret(
            "SUPABASE_SERVICE_ROLE_KEY"
          );
      }

      if (
        !/^https:\/\/[^/]+\.supabase\.co\/?$/i.test(
          baseUrl
        )
      ) {
        throw new Error(
          "SUPABASE_URL_INVALID"
        );
      }

      if (
        !apiKey
      ) {
        throw new Error(
          "SUPABASE_SERVER_KEY_MISSING"
        );
      }

      return {
        baseUrl:
          baseUrl.replace(
            /\/+$/,
            ""
          ),

        apiKey
      };
    })();

  try {
    return await configurationPromise;
  } catch (error) {
    /*
     * Allow a future request to retry configuration
     * if a secret was temporarily unavailable.
     */
    configurationPromise =
      null;

    throw error;
  }
}


/* ==========================================================================
   QUERY HELPERS
   ========================================================================== */

function makeQuery(
  query = {}
) {
  const output =
    Object.entries(
      query
    )
      .filter(
        ([, value]) =>
          value !== undefined &&
          value !== null &&
          value !== ""
      )
      .map(
        ([key, value]) =>
          `${encodeURIComponent(
            key
          )}=${encodeURIComponent(
            String(
              value
            )
          )}`
      )
      .join(
        "&"
      );

  return output
    ? `?${output}`
    : "";
}


/* ==========================================================================
   REST REQUEST
   ========================================================================== */

export async function restRequest({
  table,
  method = "GET",
  query = {},
  body,
  prefer = "return=representation"
}) {
  if (
    !INTERNAL_TABLES.has(
      table
    )
  ) {
    throw new Error(
      "SUPABASE_TABLE_NOT_ALLOWED"
    );
  }

  const {
    baseUrl,
    apiKey
  } =
    await getConfiguration();

  const response =
    await fetch(
      `${baseUrl}/rest/v1/${table}${makeQuery(
        query
      )}`,
      {
        method,

        headers: {
          apikey:
            apiKey,

          Authorization:
            `Bearer ${apiKey}`,

          Accept:
            "application/json",

          "Content-Type":
            "application/json",

          Prefer:
            prefer
        },

        body:
          body === undefined
            ? undefined
            : JSON.stringify(
                body
              )
      }
    );

  const raw =
    await response.text();

  let payload =
    null;

  if (
    raw
  ) {
    try {
      payload =
        JSON.parse(
          raw
        );
    } catch (_) {
      throw new Error(
        "SUPABASE_INVALID_RESPONSE"
      );
    }
  }

  if (
    !response.ok
  ) {
    console.error(
      "[Supabase]",
      {
        table,
        method,
        status:
          response.status
      }
    );

    throw new Error(
      `SUPABASE_HTTP_${response.status}`
    );
  }

  return payload;
}


/* ==========================================================================
   STAFF USER LOOKUP
   ========================================================================== */

export async function findAgentUser({
  wixMemberId = "",
  memberId = "",
  email = ""
} = {}) {
  const cleanWixId =
    String(
      wixMemberId ||
      ""
    ).trim();

  const cleanMemberId =
    String(
      memberId ||
      ""
    ).trim();

  const cleanEmail =
    String(
      email ||
      ""
    )
      .trim()
      .toLowerCase();

  /*
   * Primary key for RIAINTRA/Wix synchronization:
   * wix_member_id
   */
  if (
    cleanWixId
  ) {
    const rows =
      await restRequest({
        table:
          "agent_users",

        query: {
          wix_member_id:
            `eq.${cleanWixId}`,

          select:
            "*",

          limit:
            1
        }
      });

    if (
      Array.isArray(
        rows
      ) &&
      rows[0]
    ) {
      return rows[0];
    }
  }

  /*
   * Legacy member_id fallback.
   */
  if (
    cleanMemberId
  ) {
    const rows =
      await restRequest({
        table:
          "agent_users",

        query: {
          member_id:
            `eq.${cleanMemberId}`,

          select:
            "*",

          limit:
            1
        }
      });

    if (
      Array.isArray(
        rows
      ) &&
      rows[0]
    ) {
      return rows[0];
    }
  }

  /*
   * Email recovery fallback.
   */
  if (
    cleanEmail
  ) {
    const rows =
      await restRequest({
        table:
          "agent_users",

        query: {
          email:
            `ilike.${cleanEmail}`,

          select:
            "*",

          limit:
            1
        }
      });

    if (
      Array.isArray(
        rows
      ) &&
      rows[0]
    ) {
      return rows[0];
    }

    const corporateRows =
      await restRequest({
        table:
          "agent_users",

        query: {
          corporate_email_address:
            `ilike.${cleanEmail}`,

          select:
            "*",

          limit:
            1
        }
      });

    if (
      Array.isArray(
        corporateRows
      ) &&
      corporateRows[0]
    ) {
      return corporateRows[0];
    }
  }

  return null;
}


/* ==========================================================================
   WIX ↔ SUPABASE MEMBER LINK
   ========================================================================== */

export async function syncAgentMemberLink({
  agentUser,
  wixMemberId,
  memberId,
  email
}) {
  if (
    !agentUser?.id
  ) {
    throw new Error(
      "AGENT_USER_REQUIRED"
    );
  }

  const patch = {
    updated_at:
      new Date()
        .toISOString()
  };

  /*
   * Always make Wix member ID the authoritative
   * member link for the staff portal.
   */
  if (
    wixMemberId
  ) {
    patch.wix_member_id =
      String(
        wixMemberId
      );
  }

  if (
    memberId
  ) {
    patch.member_id =
      String(
        memberId
      );
  }

  /*
   * Do not overwrite corporate email with a blank value.
   */
  if (
    email
  ) {
    patch.email =
      String(
        email
      )
        .trim()
        .toLowerCase();
  }

  const rows =
    await restRequest({
      table:
        "agent_users",

      method:
        "PATCH",

      query: {
        id:
          `eq.${agentUser.id}`
      },

      body:
        patch
    });

  return (
    Array.isArray(
      rows
    )
      ? rows[0]
      : rows
  ) || agentUser;
}


/* ==========================================================================
   LOGIN TIMESTAMP
   ========================================================================== */

export async function touchAgentLogin(
  agentUserId
) {
  if (
    !agentUserId
  ) {
    return;
  }

  await restRequest({
    table:
      "agent_users",

    method:
      "PATCH",

    query: {
      id:
        `eq.${agentUserId}`
    },

    body: {
      last_login_at:
        new Date()
          .toISOString(),

      updated_at:
        new Date()
          .toISOString()
    },

    prefer:
      "return=minimal"
  });
}


/* ==========================================================================
   LOGIN AUDIT
   ========================================================================== */

export async function writeStaffLoginAudit({
  agentUserId = null,
  skId = null,
  email = null,
  eventType = "login_attempt",
  success = false,
  errorMessage = null
} = {}) {
  return restRequest({
    table:
      "staff_login_audit",

    method:
      "POST",

    body: {
      agent_user_id:
        agentUserId ||
        null,

      sk_id:
        skId ||
        null,

      email:
        email ||
        null,

      event_type:
        eventType,

      success:
        Boolean(
          success
        ),

      error_message:
        errorMessage ||
        null,

      created_at:
        new Date()
          .toISOString()
    }
  });
}


/* ==========================================================================
   ADMIN AUDIT
   ========================================================================== */

export async function writeAdminAudit({
  actorId,
  action,
  targetMember = null,
  before = null,
  after = null
}) {
  if (
    !actorId ||
    !action
  ) {
    throw new Error(
      "AUDIT_INPUT_INVALID"
    );
  }

  return restRequest({
    table:
      "admin_audit_logs",

    method:
      "POST",

    body: {
      log_id:
        `AUD-${Date.now()}-${Math.random()
          .toString(36)
          .slice(
            2,
            10
          )}`,

      admin_id:
        actorId,

      target_member:
        targetMember,

      action_performed:
        action,

      old_value:
        before,

      new_value:
        after,

      created_at:
        new Date()
          .toISOString()
    }
  });
}
export function eq(column, value) {
  return `${encodeURIComponent(column)}=eq.${encodeURIComponent(String(value ?? ""))}`;
}

export function order(column, direction = "asc") {
  return `order=${encodeURIComponent(column)}.${direction === "desc" ? "desc" : "asc"}`;
}

export function and(...filters) {
  return filters.flat().filter(Boolean).join("&");
}

async function rawRequest({
  table,
  method = "GET",
  queryString = "",
  body,
  prefer = "return=representation"
}) {
  if (!INTERNAL_TABLES.has(table)) {
    throw new Error("SUPABASE_TABLE_NOT_ALLOWED");
  }

  const { baseUrl, apiKey } = await getConfiguration();

  const headers = {
    apikey: apiKey,
    Accept: "application/json",
    "Content-Type": "application/json",
    Prefer: prefer
  };

  // Legacy service_role JWT needs Authorization.
  // New sb_secret_ server keys do not.
  if (!apiKey.startsWith("sb_secret_")) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  const query = String(queryString || "").replace(/^\?/, "");

  const response = await fetch(
    `${baseUrl}/rest/v1/${table}${query ? `?${query}` : ""}`,
    {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body)
    }
  );

  const raw = await response.text();
  const data = raw ? JSON.parse(raw) : null;

  if (!response.ok) {
    throw new Error(
      `SUPABASE_HTTP_${response.status}: ${
        data?.message || data?.error || "Request failed"
      }`
    );
  }

  return data;
}

export async function sbSelect(table, query = "select=*") {
  return rawRequest({
    table,
    method: "GET",
    queryString: query
  });
}

export async function sbInsert(table, body) {
  return rawRequest({
    table,
    method: "POST",
    body
  });
}

export async function sbUpdate(table, filter, body) {
  return rawRequest({
    table,
    method: "PATCH",
    queryString: filter,
    body
  });
}

export async function sbDelete(table, filter) {
  return rawRequest({
    table,
    method: "DELETE",
    queryString: filter
  });
}
