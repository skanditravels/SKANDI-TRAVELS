// /src/backend/SKANDI_CORE/supabaseServer.js
// SKANDI canonical backend-only Supabase transport.
// Recovery R-003.7 source of truth.
//
// Rules:
// - Never import this file from Wix page/frontend code.
// - Never expose server credentials through a webMethod.
// - Domain backends must use literal, allowlisted object/function names.
// - New domain objects must be registered here and in the Development Source Registry.

import { secrets } from "wix-secrets-backend.v2";
import { elevate } from "wix-auth";
import { fetch } from "wix-fetch";

const elevatedGetSecretValue = elevate(secrets.getSecretValue);

let serverConfigurationPromise = null;
let browserConfigurationPromise = null;

const ALLOWED_METHODS = new Set(["GET", "POST", "PATCH", "PUT", "DELETE", "HEAD"]);

/*
 * Exact PostgREST objects approved for the current SKANDI platform.
 * Legacy *_legacy_* compatibility tables are intentionally excluded.
 */
const REST_OBJECTS = new Set([
  // Staff / identity / organization / HR
  "agent_users",
  "staff_login_audit",
  "admin_audit_logs",
  "org_access_roles",
  "org_assignment_audit",
  "org_bases",
  "org_departments",
  "org_employee_assignments",
  "org_job_roles",
  "org_permission_presets",
  "org_role_base_rules",
  "hr_base_jurisdictions",
  "hr_country_rules",
  "hr_role_requirements",

  // Payroll
  "staff_payroll_adjustments",
  "staff_payroll_periods",
  "staff_payroll_profiles",
  "staff_payroll_provider_exports",
  "staff_payroll_run_lines",
  "staff_payroll_runs",
  "staff_payroll_settings",

  // GroupTalk
  "grouptalk_audit",
  "grouptalk_group_members",
  "grouptalk_groups",
  "grouptalk_history",
  "grouptalk_locations",
  "grouptalk_phonebook",
  "grouptalk_realtime_sessions",
  "grouptalk_ticket_categories",
  "grouptalk_ticket_replies",
  "grouptalk_tickets",

  // Uniform
  "uniform_allowance_rules",
  "uniform_audit",
  "uniform_catalog_items",
  "uniform_categories",
  "uniform_order_items",
  "uniform_orders",
  "uniform_policies",
  "uniform_policy_acknowledgements",
  "uniform_storage_assets",
  "uniform_wallet_ledger",
  "uniform_wallets",

  // Inventory canonical tables + read surfaces
  "inventory_master_entities",
  "inventory_localized_content",
  "inventory_media_assets",
  "inventory_entity_relations",
  "inventory_catalog_entries",
  "inventory_dated_inventory",
  "inventory_flight_legs",
  "inventory_flight_classes",
  "inventory_schedule_lines",
  "inventory_nesting_controls",
  "inventory_source_registry",
  "inventory_canonical_entities_v",
  "inventory_public_entities_v",
  "inventory_public_dated_v",
  "inventory_searchable_catalog_v",
  "inventory_source_health_v",

  // Global platform Asset Library
  "platform_assets",
  "platform_asset_usages",
  "platform_asset_upload_sessions",

  // Inventory operational compatibility layers
  "hotel_allocations",
  "tour_activity_inventory",
  "partner_ticket_inventory",
  "travel_products",
  "travel_product_components",
  "travel_product_price_cache",
  "master_inventory_audit",

  // Travel Info canonical/reference data
  "travel_info_airlines",
  "travel_info_airports",
  "travel_info_articles",
  "travel_info_faq",
  "travel_info_faq_groups",
  "travel_info_support_requests",
  "travel_info_hotels",
  "travel_info_transfers",
  "travel_info_tours",
  "travel_info_activities",
  "travel_info_tickets",

  // Aircraft / cabin experience — Inventory Control is writer
  "travel_info_aircraft",
  "travel_info_aircraft_cabins",
  "travel_info_aircraft_views",
  "travel_info_aircraft_hotspots",
  "travel_info_aircraft_walk_scenes",
  "travel_info_aircraft_scene_hotspots",

  // Customer booking data plane
  "booking_carts",
  "booking_cart_items",
  "customer_profiles",
  "club_profiles",
  "club_tiers",
  "skandi_points_ledger",
  "customer_travelers",
  "customer_travel_documents",
  "customer_favorites",
  "customer_payment_methods",
  "customer_profiles_booking_links",
  "customer_support_cases",
  "customer_support_messages",
  "customer_notifications",
  "customer_wallet_items",
  "countries_list",
  "languages",

  // ALTEA operational booking ledger
  "altea_bookings",
  "altea_booking_components",
  "altea_booking_documents",
  "altea_documents",
  "altea_fids_flights",
  "altea_offer_cache",
  "altea_package_inventory",
  "altea_passengers",
  "altea_pnr_history",
  "altea_queue_items",
  "altea_search_logs",
  "altea_segments",
  "altea_sync_events",

  // Existing compatibility cache retained until provider recovery
  "amadeus_offer_cache",

  // Existing career / application objects retained until HR/Recruiting recovery
  "career_applicant_accounts",
  "career_applicant_access_codes",
  "career_applicant_sessions",
  "career_application_files",
  "career_positions",

  // Existing document packet objects retained until DocuNet recovery
  "document_acknowledgements",
  "document_packet_items",
  "document_packets",
  "document_templates",

  // Current DocuNet public-schema objects. DocuNet's direct client is migrated later.
  "docunet_audit_events",
  "docunet_categories",
  "docunet_distributions",
  "docunet_documents",
  "docunet_receipts",
  "docunet_revisions",
  "docunet_upload_sessions"
]);

/*
 * Only functions intentionally callable as RPCs.
 * Trigger/default helper functions are NOT exposed here.
 */
const RPC_FUNCTIONS = new Set([
  "inventory_altea_add_component_v9",
  "inventory_altea_release_component_v9"
]);

function clean(value, max = 20000) {
  return String(value ?? "").trim().slice(0, max);
}

function secretString(response) {
  if (typeof response === "string") return response.trim();
  return clean(
    response?.value ??
    response?.secretValue ??
    response?.secret?.value ??
    ""
  );
}

async function secret(name, { optional = false } = {}) {
  try {
    const response = await elevatedGetSecretValue(name);
    const value = secretString(response);
    if (!value && !optional) throw new Error(`WIX_SECRET_EMPTY_${name}`);
    return value;
  } catch (error) {
    if (optional) return "";
    throw error;
  }
}

function classifyKey(key) {
  if (key.startsWith("sb_secret_")) return "modern-secret";
  if (key.startsWith("sb_publishable_")) return "modern-publishable";
  if (key.split(".").length === 3) return "legacy-jwt";
  return "api-key";
}

function normalizeBaseUrl(value) {
  const baseUrl = clean(value).replace(/\/+$/, "");
  if (!/^https:\/\/[^/]+\.supabase\.co$/i.test(baseUrl)) {
    throw new Error("SUPABASE_URL_INVALID");
  }
  return baseUrl;
}

async function getServerConfiguration() {
  if (serverConfigurationPromise) return serverConfigurationPromise;

  serverConfigurationPromise = (async () => {
    const baseUrl = normalizeBaseUrl(await secret("SUPABASE_URL"));

    const modernSecret = await secret("SUPABASE_SECRET_KEY", { optional: true });
    const legacyServiceRole = modernSecret
      ? ""
      : await secret("SUPABASE_SERVICE_ROLE_KEY", { optional: true });

    const apiKey = modernSecret || legacyServiceRole;
    if (!apiKey) throw new Error("SUPABASE_SERVER_KEY_MISSING");

    const keyType = classifyKey(apiKey);
    if (keyType === "modern-publishable") {
      throw new Error("SUPABASE_SERVER_KEY_IS_PUBLISHABLE");
    }

    return Object.freeze({ baseUrl, apiKey, keyType });
  })();

  try {
    return await serverConfigurationPromise;
  } catch (error) {
    serverConfigurationPromise = null;
    throw error;
  }
}

async function getBrowserConfiguration() {
  if (browserConfigurationPromise) return browserConfigurationPromise;

  browserConfigurationPromise = (async () => {
    const baseUrl = normalizeBaseUrl(await secret("SUPABASE_URL"));

    const publishableKey =
      await secret("SUPABASE_PUBLISHABLE_KEY", { optional: true }) ||
      await secret("SUPABASE_ANON_KEY", { optional: true });

    if (!publishableKey) throw new Error("SUPABASE_BROWSER_KEY_MISSING");

    const keyType = classifyKey(publishableKey);
    if (keyType === "modern-secret") {
      throw new Error("SUPABASE_BROWSER_KEY_IS_SECRET");
    }

    return Object.freeze({ baseUrl, publishableKey, keyType });
  })();

  try {
    return await browserConfigurationPromise;
  } catch (error) {
    browserConfigurationPromise = null;
    throw error;
  }
}

function encodedQuery(query = {}) {
  const parts = Object.entries(query)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => {
      const scalar = Array.isArray(value) ? value.join(",") : String(value);
      return `${encodeURIComponent(key)}=${encodeURIComponent(scalar)}`;
    });

  return parts.length ? `?${parts.join("&")}` : "";
}

function headersFor({ apiKey, keyType, prefer = "", extra = {} }) {
  const headers = {
    apikey: apiKey,
    Accept: "application/json",
    "Content-Type": "application/json"
  };

  // Legacy service-role keys are JWTs. Opaque sb_secret_ keys are API keys.
  if (keyType === "legacy-jwt") {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  if (prefer) headers.Prefer = prefer;

  for (const [key, value] of Object.entries(extra || {})) {
    if (value !== undefined && value !== null && value !== "") {
      headers[key] = String(value);
    }
  }

  return headers;
}

function safeErrorPayload(payload) {
  return {
    code: clean(payload?.code, 100),
    message: clean(payload?.message, 300),
    details: clean(payload?.details, 300),
    hint: clean(payload?.hint, 300)
  };
}

async function executeJsonRequest({
  path,
  method = "GET",
  body,
  prefer = "return=representation",
  extraHeaders = {}
}) {
  const normalizedMethod = clean(method, 12).toUpperCase();
  if (!ALLOWED_METHODS.has(normalizedMethod)) {
    throw new Error("SUPABASE_METHOD_NOT_ALLOWED");
  }

  const { baseUrl, apiKey, keyType } = await getServerConfiguration();

  const response = await fetch(`${baseUrl}${path}`, {
    method: normalizedMethod,
    headers: headersFor({
      apiKey,
      keyType,
      prefer,
      extra: extraHeaders
    }),
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  if (normalizedMethod === "HEAD" || response.status === 204) {
    if (!response.ok) {
      throw new Error(`SUPABASE_HTTP_${response.status}`);
    }
    return null;
  }

  const raw = await response.text();
  let payload = null;

  if (raw) {
    try {
      payload = JSON.parse(raw);
    } catch (_) {
      const error = new Error("SUPABASE_INVALID_JSON_RESPONSE");
      error.status = response.status;
      throw error;
    }
  }

  if (!response.ok) {
    const safe = safeErrorPayload(payload);
    console.error("[SKANDI Supabase]", {
      status: response.status,
      path: clean(path, 220),
      ...safe
    });

    const error = new Error(
      `SUPABASE_HTTP_${response.status}` +
      (safe.code ? `_${safe.code}` : "")
    );
    error.status = response.status;
    error.code = safe.code || "SUPABASE_HTTP_ERROR";
    error.supabase = safe;
    throw error;
  }

  return payload;
}

function assertRestObject(name) {
  const objectName = clean(name, 120);
  if (!REST_OBJECTS.has(objectName)) {
    throw new Error("SUPABASE_OBJECT_NOT_ALLOWED");
  }
  return objectName;
}

function assertRpc(name) {
  const functionName = clean(name, 120);
  if (!RPC_FUNCTIONS.has(functionName)) {
    throw new Error("SUPABASE_RPC_NOT_ALLOWED");
  }
  return functionName;
}

/**
 * Canonical PostgREST table/view request.
 * Backend-only.
 */
export async function restRequest({
  table,
  method = "GET",
  query = {},
  body,
  prefer = "return=representation"
}) {
  const objectName = assertRestObject(table);

  return executeJsonRequest({
    path: `/rest/v1/${encodeURIComponent(objectName)}${encodedQuery(query)}`,
    method,
    body,
    prefer
  });
}

/**
 * Canonical PostgREST RPC request.
 * Only explicitly approved functions can be called.
 * Backend-only.
 */
export async function rpcRequest({
  functionName,
  body = {},
  prefer = "return=representation"
}) {
  const rpc = assertRpc(functionName);

  return executeJsonRequest({
    path: `/rest/v1/rpc/${encodeURIComponent(rpc)}`,
    method: "POST",
    body,
    prefer
  });
}


const STORAGE_BUCKETS = Object.freeze({
  "skandi-public-assets": Object.freeze({ public: true, write: true }),
  "skandi-private-assets": Object.freeze({ public: false, write: true }),

  // Legacy buckets are readable/indexed during recovery but no new platform upload
  // may be created in them.
  "inventory-media": Object.freeze({ public: true, write: false }),
  "aircraft-assets": Object.freeze({ public: true, write: false }),
  "uniform-assets": Object.freeze({ public: true, write: false }),
  "docunet-controlled": Object.freeze({ public: false, write: false }),
  "internal-mail-attachments": Object.freeze({ public: false, write: false })
});

function assertStorageBucket(bucket, { write = false } = {}) {
  const name = clean(bucket, 120);
  const config = STORAGE_BUCKETS[name];
  if (!config) throw new Error("SUPABASE_STORAGE_BUCKET_NOT_ALLOWED");
  if (write && config.write !== true) {
    throw new Error("SUPABASE_STORAGE_BUCKET_READ_ONLY");
  }
  return { name, ...config };
}

function encodeStoragePath(path) {
  return clean(path, 3000)
    .replace(/^\/+|\/+$/g, "")
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

async function storageJsonRequest({
  path,
  method = "GET",
  body,
  extraHeaders = {}
}) {
  const normalizedMethod = clean(method, 12).toUpperCase();
  if (!ALLOWED_METHODS.has(normalizedMethod)) {
    throw new Error("SUPABASE_STORAGE_METHOD_NOT_ALLOWED");
  }

  const { baseUrl, apiKey, keyType } = await getServerConfiguration();

  const response = await fetch(`${baseUrl}/storage/v1${path}`, {
    method: normalizedMethod,
    headers: headersFor({
      apiKey,
      keyType,
      extra: extraHeaders
    }),
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  if (normalizedMethod === "HEAD" || response.status === 204) {
    if (!response.ok) {
      const error = new Error(`SUPABASE_STORAGE_HTTP_${response.status}`);
      error.status = response.status;
      throw error;
    }
    return null;
  }

  const raw = await response.text();
  let payload = null;
  if (raw) {
    try {
      payload = JSON.parse(raw);
    } catch (_) {
      const error = new Error("SUPABASE_STORAGE_INVALID_JSON_RESPONSE");
      error.status = response.status;
      throw error;
    }
  }

  if (!response.ok) {
    const safe = safeErrorPayload(payload);
    console.error("[SKANDI Supabase Storage]", {
      status: response.status,
      path: clean(path, 260),
      ...safe
    });
    const error = new Error(
      `SUPABASE_STORAGE_HTTP_${response.status}` +
      (safe.code ? `_${safe.code}` : "")
    );
    error.status = response.status;
    error.code = safe.code || "SUPABASE_STORAGE_HTTP_ERROR";
    error.supabase = safe;
    throw error;
  }

  return payload;
}

/**
 * Creates a two-hour signed upload URL for one approved canonical asset bucket.
 * The returned URL/token may be handed to a browser after domain authorization.
 */
export async function storageCreateSignedUploadUrl({
  bucket,
  path,
  upsert = false
}) {
  const config = assertStorageBucket(bucket, { write: true });
  const encodedBucket = encodeURIComponent(config.name);
  const encodedPath = encodeStoragePath(path);

  const data = await storageJsonRequest({
    path: `/object/upload/sign/${encodedBucket}/${encodedPath}`,
    method: "POST",
    body: {},
    extraHeaders: upsert ? { "x-upsert": "true" } : { "x-upsert": "false" }
  });

  const { baseUrl } = await getServerConfiguration();
  const relative = clean(data?.url || data?.signedURL || data?.signedUrl, 5000);
  if (!relative) throw new Error("SUPABASE_STORAGE_SIGNED_UPLOAD_URL_MISSING");

  const signedUrl = /^https?:\/\//i.test(relative)
    ? relative
    : `${baseUrl}/storage/v1${relative.startsWith("/") ? "" : "/"}${relative}`;

  const token = (() => {
    try {
      return new URL(signedUrl).searchParams.get("token") || "";
    } catch (_) {
      return "";
    }
  })();

  if (!token) throw new Error("SUPABASE_STORAGE_SIGNED_UPLOAD_TOKEN_MISSING");

  return {
    bucket: config.name,
    path: clean(path, 3000).replace(/^\/+/, ""),
    signedUrl,
    token,
    public: config.public === true
  };
}

/**
 * Creates a short-lived signed read URL for a private asset.
 */
export async function storageCreateSignedReadUrl({
  bucket,
  path,
  expiresIn = 600,
  download = false
}) {
  const config = assertStorageBucket(bucket);
  const encodedBucket = encodeURIComponent(config.name);
  const encodedPath = encodeStoragePath(path);
  const seconds = Math.min(60 * 60, Math.max(30, Number(expiresIn) || 600));

  if (config.public) {
    return {
      bucket: config.name,
      path,
      signedUrl: await storagePublicUrl({ bucket: config.name, path, download }),
      expiresIn: null,
      public: true
    };
  }

  const data = await storageJsonRequest({
    path: `/object/sign/${encodedBucket}/${encodedPath}`,
    method: "POST",
    body: { expiresIn: seconds }
  });

  const { baseUrl } = await getServerConfiguration();
  const relative = clean(data?.signedURL || data?.signedUrl || data?.url, 5000);
  if (!relative) throw new Error("SUPABASE_STORAGE_SIGNED_READ_URL_MISSING");

  let signedUrl = /^https?:\/\//i.test(relative)
    ? relative
    : `${baseUrl}/storage/v1${relative.startsWith("/") ? "" : "/"}${relative}`;

  if (download) {
    signedUrl += `${signedUrl.includes("?") ? "&" : "?"}download=`;
  }

  return {
    bucket: config.name,
    path,
    signedUrl,
    expiresIn: seconds,
    public: false
  };
}

/**
 * Verifies an uploaded object and returns authoritative Storage metadata.
 */
export async function storageGetObjectInfo({ bucket, path }) {
  const config = assertStorageBucket(bucket);
  const encodedBucket = encodeURIComponent(config.name);
  const encodedPath = encodeStoragePath(path);
  return storageJsonRequest({
    path: `/object/info/${encodedBucket}/${encodedPath}`,
    method: "GET"
  });
}

/**
 * Lists objects in an approved bucket. Used only by platform recovery/index tools.
 */
export async function storageListObjects({
  bucket,
  prefix = "",
  limit = 100,
  offset = 0,
  search = ""
}) {
  const config = assertStorageBucket(bucket);
  return storageJsonRequest({
    path: `/object/list/${encodeURIComponent(config.name)}`,
    method: "POST",
    body: {
      prefix: clean(prefix, 2000).replace(/^\/+|\/+$/g, ""),
      limit: Math.min(1000, Math.max(1, Number(limit) || 100)),
      offset: Math.max(0, Number(offset) || 0),
      sortBy: { column: "name", order: "asc" },
      search: clean(search, 300)
    }
  });
}

/**
 * Public CDN URL helper. Does not perform a network request.
 */
export async function storageGetPublicUrl({ bucket, path, download = false }) {
  return {
    publicUrl: await storagePublicUrl({ bucket, path, download })
  };
}

function storagePublicUrl({ bucket, path, download = false }) {
  const config = assertStorageBucket(bucket);
  if (!config.public) throw new Error("SUPABASE_STORAGE_BUCKET_NOT_PUBLIC");

  const encodedBucket = encodeURIComponent(config.name);
  const encodedPath = encodeStoragePath(path);

  // URL is built server-side so the browser never receives the project secret.
  // SUPABASE_URL itself is not a credential, but retaining URL construction here
  // keeps every asset consumer on the same source of truth.
  return getServerConfiguration().then(({ baseUrl }) =>
    `${baseUrl}/storage/v1/object/public/${encodedBucket}/${encodedPath}` +
    (download ? "?download=" : "")
  );
}

/**
 * Public Realtime configuration for an authorized backend to hand to a browser.
 * This returns only the publishable/anon key, never the server secret.
 */
export async function getSupabaseRealtimeBrowserConfig() {
  const config = await getBrowserConfiguration();
  return {
    url: config.baseUrl,
    publishableKey: config.publishableKey
  };
}

/**
 * Safe server diagnostics. Never returns a credential.
 */
export async function getSupabaseServerDiagnostics() {
  const config = await getServerConfiguration();
  return {
    ok: true,
    host: new URL(config.baseUrl).host,
    keyType: config.keyType,
    allowedObjectCount: REST_OBJECTS.size,
    allowedRpcCount: RPC_FUNCTIONS.size,
    allowedStorageBucketCount: Object.keys(STORAGE_BUCKETS).length
  };
}

export async function writeAdminAudit({
  actorId,
  action,
  targetMember = null,
  targetResource = null,
  before = null,
  after = null
}) {
  const cleanActor = clean(actorId, 160);
  const cleanAction = clean(action, 160);

  if (!cleanActor || !cleanAction) {
    throw new Error("AUDIT_INPUT_INVALID");
  }

  const stamp = new Date().toISOString();

  return restRequest({
    table: "admin_audit_logs",
    method: "POST",
    body: {
      log_id: `AUD-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      timestamp: stamp,
      admin_id: cleanActor,
      target_member: targetMember ? clean(targetMember, 200) : null,
      target_resource: targetResource ? clean(targetResource, 300) : null,
      action_performed: cleanAction,
      old_value: before,
      new_value: after,
      created_at: stamp
    }
  });
}
