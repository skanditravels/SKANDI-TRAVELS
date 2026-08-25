import {
  secrets
} from "wix-secrets-backend.v2";

import {
  elevate
} from "wix-auth";

import {
  fetch
} from "wix-fetch";


const elevatedGetSecretValue =
  elevate(
    secrets.getSecretValue
  );


let configurationPromise =
  null;


const INTERNAL_TABLES =
  new Set([
    "agent_users",
    "staff_login_audit",
    "admin_audit_logs",

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
   SECRETS
   ========================================================================== */

function secretString(
  response
) {
  if (
    typeof response ===
    "string"
  ) {
    return response.trim();
  }

  return String(
    response?.value ??
    response?.secretValue ??
    response?.secret?.value ??
    ""
  ).trim();
}


async function getSecret(
  name
) {
  const response =
    await elevatedGetSecretValue(
      name
    );

  const value =
    secretString(
      response
    );

  if (
    !value
  ) {
    throw new Error(
      `WIX_SECRET_EMPTY_${name}`
    );
  }

  return value;
}


/* ==========================================================================
   CONFIGURATION
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
        await getSecret(
          "SUPABASE_URL"
        );


      let apiKey =
        "";

      let keyType =
        "";


      /*
       * Prefer the modern Supabase secret key.
       */
      try {
        apiKey =
          await getSecret(
            "SUPABASE_SECRET_KEY"
          );

        keyType =
          apiKey.startsWith(
            "sb_secret_"
          )
            ? "secret"
            : "legacy";

      } catch (_) {

        /*
         * Fallback for the legacy JWT-based service_role key.
         */
        apiKey =
          await getSecret(
            "SUPABASE_SERVICE_ROLE_KEY"
          );

        keyType =
          "legacy";
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

        apiKey,

        keyType
      };

    })();


  try {
    return await configurationPromise;

  } catch (error) {

    configurationPromise =
      null;

    throw error;
  }
}


/* ==========================================================================
   QUERY BUILDER
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
          value !==
            undefined &&
          value !==
            null &&
          value !==
            ""
      )
      .map(
        ([
          key,
          value
        ]) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`
      )
      .join(
        "&"
      );


  return output
    ? `?${output}`
    : "";
}


/* ==========================================================================
   HEADERS
   ========================================================================== */

function buildHeaders({
  apiKey,
  keyType,
  prefer
}) {
  const headers = {
    apikey:
      apiKey,

    Accept:
      "application/json",

    "Content-Type":
      "application/json",

    Prefer:
      prefer
  };


  /*
   * IMPORTANT:
   *
   * Modern sb_secret_... keys are API keys, not JWTs.
   * They must NOT be sent as Authorization: Bearer.
   *
   * Legacy service_role keys are JWTs and may be sent
   * through both apikey and Authorization.
   */
  if (
    keyType ===
    "legacy"
  ) {
    headers.Authorization =
      `Bearer ${apiKey}`;
  }


  return headers;
}


/* ==========================================================================
   SUPABASE REST
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
    apiKey,
    keyType
  } =
    await getConfiguration();


  const url =
    `${baseUrl}/rest/v1/${table}${makeQuery(query)}`;


  const response =
    await fetch(
      url,
      {
        method,

        headers:
          buildHeaders({
            apiKey,
            keyType,
            prefer
          }),

        body:
          body ===
          undefined
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

      console.error(
        "[Supabase] Invalid JSON response",
        {
          table,
          method,
          status:
            response.status
        }
      );

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


  const now =
    new Date()
      .toISOString();


  return restRequest({
    table:
      "admin_audit_logs",

    method:
      "POST",

    body: {

      log_id:
        `AUD-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 10)}`,

      timestamp:
        now,

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
        now
    }
  });
}
