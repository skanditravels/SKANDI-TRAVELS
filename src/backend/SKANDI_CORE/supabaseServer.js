// /src/backend/SKANDI_CORE/supabaseServer.js
// SKANDI Backend Base 1.0 — canonical server-only Supabase transport.
// B-001 + B-006 allowlist convergence
//
// This file owns credentials, allowlists and raw REST/RPC/Storage transport only.
// It must never contain domain authorization, Inventory logic, ALTEA logic, or UI state.


import { Buffer } from "buffer";
import { secrets } from "wix-secrets-backend.v2";
import { elevate } from "wix-auth";
import { fetch } from "wix-fetch";
import { SkandiError, isTransientHttpStatus } from "backend/SKANDI_CORE/platformErrors";
import { text } from "backend/SKANDI_CORE/platformValidation";


const getSecretValue = elevate(secrets.getSecretValue);
const HTTP_METHODS = new Set(["GET", "POST", "PATCH", "PUT", "DELETE", "HEAD"]);


const REST_OBJECTS = new Set([
  // Identity / organization / HR
  "agent_users", "staff_login_audit", "admin_audit_logs",
  "org_access_roles", "org_assignment_audit", "org_bases", "org_departments",
  "org_employee_assignments", "org_job_roles", "org_permission_presets",
  "org_role_base_rules", "hr_base_jurisdictions", "hr_country_rules", "hr_role_requirements",


  // Payroll
  "staff_payroll_adjustments", "staff_payroll_periods", "staff_payroll_profiles",
  "staff_payroll_provider_exports", "staff_payroll_run_lines", "staff_payroll_runs",
  "staff_payroll_settings",


  // GroupTalk
  "grouptalk_audit", "grouptalk_group_members", "grouptalk_groups", "grouptalk_history",
  "grouptalk_locations", "grouptalk_phonebook", "grouptalk_realtime_sessions",
  "grouptalk_ticket_categories", "grouptalk_ticket_replies", "grouptalk_tickets",


  // Uniform
  "uniform_allowance_rules", "uniform_audit", "uniform_catalog_items", "uniform_categories",
  "uniform_order_items", "uniform_orders", "uniform_policies", "uniform_policy_acknowledgements",
  "uniform_storage_assets", "uniform_wallet_ledger", "uniform_wallets",


  // Workforce / OPS Control
  "roster_shifts", "roster_clock_events", "roster_time_ledger", "schedule_change_requests",
  "time_off_balances", "vacation_sick_leave_ledger", "crew_assignments", "driver_assignments",
  "tour_assignments", "airport_duty_assignments", "vehicle_assignments",


  // Inventory
  "inventory_master_entities", "inventory_localized_content", "inventory_media_assets",
  "inventory_entity_relations", "inventory_catalog_entries", "inventory_dated_inventory",
  "inventory_flight_legs", "inventory_flight_classes", "inventory_schedule_lines",
  "inventory_nesting_controls", "inventory_source_registry", "inventory_canonical_entities_v",
  "inventory_public_entities_v", "inventory_public_dated_v", "inventory_searchable_catalog_v",
  "inventory_source_health_v", "hotel_allocations", "tour_activity_inventory",
  "partner_ticket_inventory", "travel_products", "travel_product_components",
  "travel_product_price_cache", "master_inventory_audit",


  // Platform assets
  "platform_assets", "platform_asset_usages", "platform_asset_upload_sessions",


  // Travel Info / reference
  "travel_info_airlines", "travel_info_airports", "travel_info_articles", "travel_info_faq",
  "baggage_allowance",
  "travel_info_faq_groups", "travel_info_support_requests", "travel_info_hotels",
  "travel_info_transfers", "travel_info_tours", "travel_info_activities", "travel_info_tickets",
  "travel_info_aircraft", "travel_info_aircraft_cabins", "travel_info_aircraft_views",
  "travel_info_aircraft_hotspots", "travel_info_aircraft_walk_scenes",
  "travel_info_aircraft_scene_hotspots",


  // Customer / loyalty / support / booking carts
  "customer_profiles", "customer_profiles_booking_links", "club_profiles", "club_tiers", "skandi_points_ledger",
  "customer_favorites", "customer_travelers", "customer_travel_documents",
  "customer_support_cases", "customer_support_messages", "alexandra_chat_sessions",
  "booking_carts", "booking_cart_items", "payment_events",


  // ALTEA operational ledger
  "altea_bookings", "altea_booking_components", "altea_booking_documents", "altea_documents",
  "altea_fids_flights", "altea_offer_cache", "altea_package_inventory", "altea_passengers",
  "altea_pnr_history", "altea_queue_items", "altea_search_logs", "altea_segments",
  "altea_sync_events", "operational_manifests", "travel_requirements",


  // Internal mail
  "internal_mail_accounts", "internal_mail_threads", "internal_mail_messages",
  "internal_mail_recipients", "internal_mail_entries", "internal_mail_attachments", "internal_mail_events",


  // Transitional data objects that remain real database objects until their domain rebuild
  "career_applicant_accounts", "career_applicant_access_codes",
  "career_applicant_sessions", "career_application_files", "career_positions",
  "career_audit_log", "career_candidate_history", "career_document_packets",
  "career_documents", "career_history_gaps", "career_integration_snapshots",
  "career_interviews", "career_mailbox_messages", "career_maintenance_schedule", "career_onboarding_tasks",
  "career_settings", "career_sra_vetting", "career_training_records",
  "document_acknowledgements", "document_packet_items", "document_packets", "document_templates",
  "docunet_audit_events", "docunet_categories", "docunet_distributions", "docunet_documents",
  "docunet_receipts", "docunet_revisions", "docunet_upload_sessions",


  // Editorial / VOY / Newsroom
  "newsroom_articles", "newsroom_categories", "newsroom_media_assets", "newsroom_press_contacts",
  "organizations", "voy_issues", "voy_pages", "voy_entities",
  "voy_publications", "voy_interactions", "voy_saved_issues",

  // Shared language/country reference objects used by customer profile and content services
  "countries_list", "languages", "storefront_promotions"
]);


const RPC_FUNCTIONS = new Set([
  "inventory_altea_add_component_v9",
  "inventory_altea_release_component_v9",
  "get_public_about_payload",
  "get_public_network_map_payload",
  "publish_voy_issue"
]);


const STORAGE_BUCKETS = Object.freeze({
  "skandi-public-assets": Object.freeze({ public: true, write: true }),
  "skandi-private-assets": Object.freeze({ public: false, write: true }),
  "inventory-media": Object.freeze({ public: true, write: false }),
  "aircraft-assets": Object.freeze({ public: true, write: false }),
  "uniform-assets": Object.freeze({ public: true, write: false }),
  "docunet-controlled": Object.freeze({ public: false, write: false }),
  "internal-mail-attachments": Object.freeze({ public: false, write: false })
});


let serverConfigPromise = null;
let browserConfigPromise = null;


function secretValue(result) {
  if (typeof result === "string") return result.trim();
  return text(result?.value ?? result?.secretValue ?? result?.secret?.value ?? "", 10000);
}


async function readSecret(name, { optional = false } = {}) {
  try {
    const value = secretValue(await getSecretValue(name));
    if (!value && !optional) throw new SkandiError(`WIX_SECRET_EMPTY_${name}`);
    return value;
  } catch (error) {
    if (optional) return "";
    throw error;
  }
}


function normalizeBaseUrl(value) {
  const baseUrl = text(value, 1000).replace(/\/+$/, "");
  if (!/^https:\/\/[^/]+\.supabase\.co$/i.test(baseUrl)) {
    throw new SkandiError("SUPABASE_URL_INVALID");
  }
  return baseUrl;
}


function keyType(key) {
  if (key.startsWith("sb_secret_")) return "modern-secret";
  if (key.startsWith("sb_publishable_")) return "modern-publishable";
  if (key.split(".").length === 3) return "legacy-jwt";
  return "api-key";
}


async function serverConfig() {
  if (serverConfigPromise) return serverConfigPromise;
  serverConfigPromise = (async () => {
    const baseUrl = normalizeBaseUrl(await readSecret("SUPABASE_URL"));
    const modern = await readSecret("SUPABASE_SECRET_KEY", { optional: true });
    const legacy = modern ? "" : await readSecret("SUPABASE_SERVICE_ROLE_KEY", { optional: true });
    const apiKey = modern || legacy;
    if (!apiKey) throw new SkandiError("SUPABASE_SERVER_KEY_MISSING");
    const type = keyType(apiKey);
    if (type === "modern-publishable") throw new SkandiError("SUPABASE_SERVER_KEY_IS_PUBLISHABLE");
    return Object.freeze({ baseUrl, apiKey, type });
  })();
  try {
    return await serverConfigPromise;
  } catch (error) {
    serverConfigPromise = null;
    throw error;
  }
}


async function browserConfig() {
  if (browserConfigPromise) return browserConfigPromise;
  browserConfigPromise = (async () => {
    const baseUrl = normalizeBaseUrl(await readSecret("SUPABASE_URL"));
    const publishableKey =
      await readSecret("SUPABASE_PUBLISHABLE_KEY", { optional: true }) ||
      await readSecret("SUPABASE_ANON_KEY", { optional: true });
    if (!publishableKey) throw new SkandiError("SUPABASE_BROWSER_KEY_MISSING");
    if (keyType(publishableKey) === "modern-secret") {
      throw new SkandiError("SUPABASE_BROWSER_KEY_IS_SECRET");
    }
    return Object.freeze({ baseUrl, publishableKey });
  })();
  try {
    return await browserConfigPromise;
  } catch (error) {
    browserConfigPromise = null;
    throw error;
  }
}


function queryString(query = {}) {
  const parts = [];
  for (const [key, raw] of Object.entries(query || {})) {
    if (raw === undefined || raw === null || raw === "") continue;
    const value = Array.isArray(raw) ? raw.join(",") : String(raw);
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
  }
  return parts.length ? `?${parts.join("&")}` : "";
}


function requestHeaders({ apiKey, type, prefer = "", extra = {} }) {
  const headers = {
    apikey: apiKey,
    Accept: "application/json",
    "Content-Type": "application/json"
  };
  if (type === "legacy-jwt") headers.Authorization = `Bearer ${apiKey}`;
  if (prefer) headers.Prefer = prefer;
  for (const [key, value] of Object.entries(extra || {})) {
    if (value !== undefined && value !== null && value !== "") headers[key] = String(value);
  }
  return headers;
}


function safeProviderError(payload) {
  return {
    code: text(payload?.code, 120),
    message: text(payload?.message, 500),
    details: text(payload?.details, 500),
    hint: text(payload?.hint, 500)
  };
}


async function jsonRequest({ path, method = "GET", body, rawBody = false, prefer = "return=representation", extraHeaders = {} }) {
  const normalizedMethod = text(method, 12).toUpperCase();
  if (!HTTP_METHODS.has(normalizedMethod)) throw new SkandiError("SUPABASE_METHOD_NOT_ALLOWED");


  const { baseUrl, apiKey, type } = await serverConfig();
  let response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method: normalizedMethod,
      headers: requestHeaders({ apiKey, type, prefer, extra: extraHeaders }),
      body: body === undefined ? undefined : rawBody ? body : JSON.stringify(body)
    });
  } catch (error) {
    throw new SkandiError("SUPABASE_NETWORK_ERROR", "Supabase could not be reached.", {
      retryable: normalizedMethod === "GET" || normalizedMethod === "HEAD",
      details: { cause: text(error?.message || error, 300) }
    });
  }


  if (normalizedMethod === "HEAD" || response.status === 204) {
    if (!response.ok) {
      throw new SkandiError(`SUPABASE_HTTP_${response.status}`, "Supabase request failed.", {
        status: response.status,
        retryable: isTransientHttpStatus(response.status)
      });
    }
    return null;
  }


  const raw = await response.text();
  let payload = null;
  if (raw) {
    try {
      payload = JSON.parse(raw);
    } catch (_) {
      throw new SkandiError("SUPABASE_INVALID_JSON_RESPONSE", "Supabase returned an invalid response.", {
        status: response.status,
        retryable: isTransientHttpStatus(response.status)
      });
    }
  }


  if (!response.ok) {
    const safe = safeProviderError(payload);
    console.error("[SKANDI Supabase]", JSON.stringify({
      status: response.status,
      path: text(path, 320),
      ...safe
    }));


    const error = new SkandiError(`SUPABASE_HTTP_${response.status}`, safe.message || "Supabase request failed.", {
      status: response.status,
      retryable: isTransientHttpStatus(response.status),
      details: safe
    });
    error.supabase = safe;
    throw error;
  }


  return payload;
}


const REST_SCHEMAS = new Set(["public", "magazine_manager"]);

function restSchema(name = "public") {
  const value = text(name || "public", 120) || "public";
  if (!REST_SCHEMAS.has(value)) throw new SkandiError("SUPABASE_SCHEMA_NOT_ALLOWED");
  return value;
}

function schemaHeaders(schema, method = "GET") {
  if (!schema || schema === "public") return {};
  const normalized = text(method, 12).toUpperCase();
  return (normalized === "GET" || normalized === "HEAD")
    ? { "Accept-Profile": schema }
    : { "Accept-Profile": schema, "Content-Profile": schema };
}

function restObject(name) {
  const value = text(name, 120);
  if (!REST_OBJECTS.has(value)) throw new SkandiError("SUPABASE_OBJECT_NOT_ALLOWED");
  return value;
}


function rpcName(name) {
  const value = text(name, 120);
  if (!RPC_FUNCTIONS.has(value)) throw new SkandiError("SUPABASE_RPC_NOT_ALLOWED");
  return value;
}


export async function restRequest({
  table,
  schema = "public",
  method = "GET",
  query = {},
  body,
  prefer = "return=representation"
} = {}) {
  const object = restObject(table);
  const profile = restSchema(schema);
  return jsonRequest({
    path: `/rest/v1/${encodeURIComponent(object)}${queryString(query)}`,
    method,
    body,
    prefer,
    extraHeaders: schemaHeaders(profile, method)
  });
}


export async function rpcRequest({
  functionName,
  schema = "public",
  body = {},
  prefer = "return=representation"
} = {}) {
  const name = rpcName(functionName);
  const profile = restSchema(schema);
  return jsonRequest({
    path: `/rest/v1/rpc/${encodeURIComponent(name)}`,
    method: "POST",
    body,
    prefer,
    extraHeaders: schemaHeaders(profile, "POST")
  });
}


function storageBucket(bucket, { write = false } = {}) {
  const name = text(bucket, 120);
  const config = STORAGE_BUCKETS[name];
  if (!config) throw new SkandiError("SUPABASE_STORAGE_BUCKET_NOT_ALLOWED");
  if (write && config.write !== true) throw new SkandiError("SUPABASE_STORAGE_BUCKET_READ_ONLY");
  return { name, ...config };
}


function storagePath(path) {
  const normalized = text(path, 3000).replace(/^\/+|\/+$/g, "");
  if (!normalized) throw new SkandiError("SUPABASE_STORAGE_PATH_REQUIRED");
  if (normalized.split("/").some(part => part === "." || part === "..")) throw new SkandiError("SUPABASE_STORAGE_PATH_INVALID");
  return normalized.split("/").filter(Boolean).map(encodeURIComponent).join("/");
}


async function storageJson({ path, method = "GET", body, extraHeaders = {} }) {
  return jsonRequest({ path: `/storage/v1${path}`, method, body, prefer: "", extraHeaders });
}


export async function storageCreateSignedUploadUrl({ bucket, path, upsert = false } = {}) {
  const config = storageBucket(bucket, { write: true });
  const encodedPath = storagePath(path);
  const data = await storageJson({
    path: `/object/upload/sign/${encodeURIComponent(config.name)}/${encodedPath}`,
    method: "POST",
    body: {},
    extraHeaders: { "x-upsert": upsert ? "true" : "false" }
  });
  const { baseUrl } = await serverConfig();
  const relative = text(data?.url || data?.signedURL || data?.signedUrl, 5000);
  if (!relative) throw new SkandiError("SUPABASE_STORAGE_SIGNED_UPLOAD_URL_MISSING");
  const signedUrl = /^https?:\/\//i.test(relative)
    ? relative
    : `${baseUrl}/storage/v1${relative.startsWith("/") ? "" : "/"}${relative}`;
  let token = "";
  try { token = new URL(signedUrl).searchParams.get("token") || ""; } catch (_) {}
  if (!token) throw new SkandiError("SUPABASE_STORAGE_SIGNED_UPLOAD_TOKEN_MISSING");
  return { bucket: config.name, path: text(path, 3000).replace(/^\/+/, ""), signedUrl, token, public: config.public === true };
}


export async function storageCreateSignedReadUrl({ bucket, path, expiresIn = 600, download = false } = {}) {
  const config = storageBucket(bucket);
  if (config.public) {
    const { publicUrl } = await storageGetPublicUrl({ bucket: config.name, path, download });
    return { bucket: config.name, path, signedUrl: publicUrl, expiresIn: null, public: true };
  }
  const seconds = Math.min(3600, Math.max(30, Number(expiresIn) || 600));
  const data = await storageJson({
    path: `/object/sign/${encodeURIComponent(config.name)}/${storagePath(path)}`,
    method: "POST",
    body: { expiresIn: seconds }
  });
  const { baseUrl } = await serverConfig();
  const relative = text(data?.signedURL || data?.signedUrl || data?.url, 5000);
  if (!relative) throw new SkandiError("SUPABASE_STORAGE_SIGNED_READ_URL_MISSING");
  let signedUrl = /^https?:\/\//i.test(relative)
    ? relative
    : `${baseUrl}/storage/v1${relative.startsWith("/") ? "" : "/"}${relative}`;
  if (download) signedUrl += `${signedUrl.includes("?") ? "&" : "?"}download=`;
  return { bucket: config.name, path, signedUrl, expiresIn: seconds, public: false };
}


export async function storageGetObjectInfo({ bucket, path } = {}) {
  const config = storageBucket(bucket);
  return storageJson({
    path: `/object/info/${encodeURIComponent(config.name)}/${storagePath(path)}`,
    method: "GET"
  });
}


export async function storageListObjects({ bucket, prefix = "", limit = 100, offset = 0, search = "" } = {}) {
  const config = storageBucket(bucket);
  return storageJson({
    path: `/object/list/${encodeURIComponent(config.name)}`,
    method: "POST",
    body: {
      prefix: text(prefix, 2000).replace(/^\/+|\/+$/g, ""),
      limit: Math.min(1000, Math.max(1, Number(limit) || 100)),
      offset: Math.max(0, Number(offset) || 0),
      sortBy: { column: "name", order: "asc" },
      search: text(search, 300)
    }
  });
}


export async function storageGetPublicUrl({ bucket, path, download = false } = {}) {
  const config = storageBucket(bucket);
  if (!config.public) throw new SkandiError("SUPABASE_STORAGE_BUCKET_NOT_PUBLIC");
  const { baseUrl } = await serverConfig();
  const publicUrl = `${baseUrl}/storage/v1/object/public/${encodeURIComponent(config.name)}/${storagePath(path)}` +
    (download ? "?download=" : "");
  return { publicUrl };
}


export async function getSupabaseRealtimeBrowserConfig() {
  const config = await browserConfig();
  return { url: config.baseUrl, publishableKey: config.publishableKey };
}


export async function getSupabaseServerDiagnostics() {
  const server = await serverConfig();
  return {
    ok: true,
    baseUrlConfigured: Boolean(server.baseUrl),
    serverKeyConfigured: Boolean(server.apiKey),
    serverKeyType: server.type,
    allowedRestObjects: REST_OBJECTS.size,
    allowedRpcFunctions: RPC_FUNCTIONS.size,
    storageBuckets: Object.keys(STORAGE_BUCKETS)
  };
}


// Server-only Supabase Realtime broadcast transport. Domain modules provide only a topic/event/payload;
// credentials stay inside this shared transport and are never returned to page/frontend code.
export async function realtimeBroadcast({ topic, event = "broadcast", payload = {} } = {}) {
  const safeTopic = text(topic, 240);
  const safeEvent = text(event, 120);
  if (!safeTopic) throw new SkandiError("SUPABASE_REALTIME_TOPIC_REQUIRED");
  if (!safeEvent) throw new SkandiError("SUPABASE_REALTIME_EVENT_REQUIRED");
  const { baseUrl, apiKey, type } = await serverConfig();
  const headers = { apikey: apiKey, "Content-Type": "application/json" };
  if (type === "legacy-jwt") headers.Authorization = `Bearer ${apiKey}`;
  const response = await fetch(`${baseUrl}/realtime/v1/api/broadcast`, {
    method: "POST",
    headers,
    body: JSON.stringify({ messages: [{ topic: safeTopic, event: safeEvent, payload }] })
  });
  const raw = await response.text().catch(() => "");
  if (!response.ok) {
    throw new SkandiError(`SUPABASE_REALTIME_HTTP_${response.status}`, {
      status: response.status,
      details: raw.slice(0, 500)
    });
  }
  return { ok: true, topic: safeTopic, event: safeEvent };
}


export async function storageUploadBase64Object({
  bucket, path, dataBase64, mimeType = "application/octet-stream",
  maxBytes = 10 * 1024 * 1024, upsert = false
} = {}) {
  const config = storageBucket(bucket, { write: true });
  const cleanPath = text(path, 3000).replace(/^\/+/, "");
  const encodedPath = storagePath(cleanPath);
  const raw = String(dataBase64 || "");
  const payload = (raw.includes(",") ? raw.slice(raw.lastIndexOf(",") + 1) : raw).replace(/\s/g, "");
  if (!payload || !/^[A-Za-z0-9+/]*={0,2}$/.test(payload) || payload.length % 4 !== 0) throw new SkandiError("SUPABASE_STORAGE_BASE64_INVALID");
  const bytes = Buffer.from(payload, "base64");
  const limit = Math.min(25 * 1024 * 1024, Math.max(1, Number(maxBytes) || 1));
  if (!bytes.length || bytes.length > limit) throw new SkandiError("SUPABASE_STORAGE_OBJECT_SIZE_INVALID");
  const type = text(mimeType, 150) || "application/octet-stream";
  const result = await jsonRequest({
    path: `/storage/v1/object/${encodeURIComponent(config.name)}/${encodedPath}`,
    method: "POST", rawBody: true, body: bytes, prefer: "",
    extraHeaders: { "Content-Type": type, "x-upsert": upsert ? "true" : "false" }
  });
  return { ok: true, bucket: config.name, path: cleanPath, sizeBytes: bytes.length, mimeType: type, result };
}
