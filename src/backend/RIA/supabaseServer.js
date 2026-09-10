// backend/RIA/supabaseServer.js
// Shared backend-only Supabase REST/RPC client — V9.12 unified Inventory + ALTEA.

import { secrets } from "wix-secrets-backend.v2";
import { elevate } from "wix-auth";
import { fetch } from "wix-fetch";

const elevatedGetSecretValue = elevate(secrets.getSecretValue);
let configurationPromise = null;

const INTERNAL_TABLES = new Set([
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
  "document_templates",

  // Customer booking/search data plane used by bookingOrchestrator.web.js.
  "travel_info_airports",
  "inventory_master_entities",
  "booking_carts",
  "booking_cart_items",

  // Travel Info V9 public/read + support data plane.
  "travel_info_airlines",
  "travel_info_airports",
  "travel_info_faq",
  "travel_info_faq_groups",
  "travel_info_articles",
  "travel_info_support_requests",
  "travel_requirements",

  // Canonical Inventory Control V9 content used by Travel Info.
  "inventory_localized_content",
  "inventory_media_assets",
  "inventory_entity_relations",
  "inventory_public_entities_v",
  "inventory_canonical_entities_v",

  // Aircraft Display Control V9 detailed aircraft authority.
  "travel_info_aircraft",
  "travel_info_aircraft_cabins",
  "travel_info_aircraft_views",
  "travel_info_aircraft_hotspots",
  "travel_info_aircraft_walk_scenes",
  "inventory_catalog_entries",
  "inventory_dated_inventory",
  "inventory_source_registry",
  "altea_bookings",
  "altea_booking_components",
  "altea_booking_documents",
  "altea_documents",
  "altea_passengers",
  "altea_pnr_history",
  "altea_segments",
  "altea_queue_items",
  "altea_sync_events",
  "altea_package_inventory",
  "altea_search_logs",
  "club_profiles",
  "club_tiers",
  "bus_manifests",
  "bus_manifest_passengers",
  "bus_routes",
  "bus_route_stops",
  "operational_manifests",
  "airport_transfers",
  "travel_info_aircraft_scene_hotspots"
]);

function secretString(response) {
  if (typeof response === "string") return response.trim();
  return String(
    response?.value ??
    response?.secretValue ??
    response?.secret?.value ??
    ""
  ).trim();
}

async function getSecret(name) {
  const response = await elevatedGetSecretValue(name);
  const value = secretString(response);
  if (!value) throw new Error(`WIX_SECRET_EMPTY_${name}`);
  return value;
}

async function getConfiguration() {
  if (configurationPromise) return configurationPromise;

  configurationPromise = (async () => {
    const baseUrl = await getSecret("SUPABASE_URL");
    let apiKey = "";

    try {
      apiKey = await getSecret("SUPABASE_SECRET_KEY");
    } catch (_) {
      apiKey = await getSecret("SUPABASE_SERVICE_ROLE_KEY");
    }

    if (!/^https:\/\/[^/]+\.supabase\.co\/?$/i.test(baseUrl)) {
      throw new Error("SUPABASE_URL_INVALID");
    }

    if (!apiKey) {
      throw new Error("SUPABASE_SERVER_KEY_MISSING");
    }

    const keyType =
      apiKey.startsWith("sb_secret_")
        ? "modern-secret"
        : apiKey.startsWith("eyJ")
          ? "legacy-jwt"
          : "api-key";

    return {
      baseUrl: baseUrl.replace(/\/+$/, ""),
      apiKey,
      keyType
    };
  })();

  try {
    return await configurationPromise;
  } catch (error) {
    configurationPromise = null;
    throw error;
  }
}

function makeQuery(query = {}) {
  const output = Object.entries(query)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) =>
      `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`
    )
    .join("&");

  return output ? `?${output}` : "";
}

function buildHeaders({ apiKey, keyType, prefer }) {
  const headers = {
    apikey: apiKey,
    Accept: "application/json",
    "Content-Type": "application/json"
  };

  // sb_secret_... is an API key, not a JWT.
  if (keyType === "legacy-jwt") {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  if (prefer) {
    headers.Prefer = prefer;
  }

  return headers;
}

export async function restRequest({
  table,
  method = "GET",
  query = {},
  body,
  prefer = "return=representation"
}) {
  if (!INTERNAL_TABLES.has(table)) {
    throw new Error("SUPABASE_TABLE_NOT_ALLOWED");
  }

  const { baseUrl, apiKey, keyType } = await getConfiguration();

  const response = await fetch(
    `${baseUrl}/rest/v1/${table}${makeQuery(query)}`,
    {
      method,
      headers: buildHeaders({ apiKey, keyType, prefer }),
      body: body === undefined ? undefined : JSON.stringify(body)
    }
  );

  const raw = await response.text();
  let payload = null;

  if (raw) {
    try {
      payload = JSON.parse(raw);
    } catch (_) {
      throw new Error("SUPABASE_INVALID_RESPONSE");
    }
  }

  if (!response.ok) {
    const safeError = {
      table,
      method,
      status: response.status,
      code: String(payload?.code || ""),
      message: String(payload?.message || "").slice(0, 240),
      details: String(payload?.details || "").slice(0, 240),
      hint: String(payload?.hint || "").slice(0, 240)
    };

    console.error("[Supabase]", safeError);

    const error = new Error(
      `SUPABASE_HTTP_${response.status}` +
      (safeError.code ? `_${safeError.code}` : "")
    );

    error.status = response.status;
    error.code = safeError.code || "SUPABASE_HTTP_ERROR";
    error.supabase = safeError;
    throw error;
  }

  return payload;
}


export async function rpcRequest({ functionName, body = {}, prefer = "" }) {
  const allowed = new Set([
    "inventory_altea_add_component_v9",
    "inventory_altea_release_component_v9"
  ]);
  if (!allowed.has(String(functionName || ""))) throw new Error("SUPABASE_RPC_NOT_ALLOWED");
  const { baseUrl, apiKey, keyType } = await getConfiguration();
  const response = await fetch(`${baseUrl}/rest/v1/rpc/${encodeURIComponent(functionName)}`, {
    method: "POST",
    headers: buildHeaders({ apiKey, keyType, prefer }),
    body: JSON.stringify(body || {})
  });
  const raw = await response.text();
  let payload = null;
  if (raw) { try { payload = JSON.parse(raw); } catch (_) { throw new Error("SUPABASE_INVALID_RESPONSE"); } }
  if (!response.ok) {
    const error = new Error(`SUPABASE_RPC_HTTP_${response.status}`);
    error.status = response.status;
    error.code = String(payload?.code || "SUPABASE_RPC_ERROR");
    error.supabase = { message:String(payload?.message || "").slice(0,240), details:String(payload?.details || "").slice(0,240), hint:String(payload?.hint || "").slice(0,240) };
    throw error;
  }
  return payload;
}

export async function writeAdminAudit({
  actorId,
  action,
  targetMember = null,
  before = null,
  after = null
}) {
  if (!actorId || !action) {
    throw new Error("AUDIT_INPUT_INVALID");
  }

  return restRequest({
    table: "admin_audit_logs",
    method: "POST",
    body: {
      log_id: `AUD-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      admin_id: actorId,
      target_member: targetMember,
      action_performed: action,
      old_value: before,
      new_value: after,
      timestamp: new Date().toISOString(),
      created_at: new Date().toISOString()
    }
  });
}
