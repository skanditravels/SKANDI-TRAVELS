// backend/RIA/inventoryControlV4.web.js
// SKANDI Inventory Control V9 — single secure backend boundary.
// Direct Supabase REST/Storage access. No browser credentials and no Supabase npm client.

import { webMethod, Permissions } from "wix-web-module";
import { currentMember } from "wix-members-backend";
import { secrets } from "wix-secrets-backend.v2";
import { elevate } from "wix-auth";
import { fetch } from "wix-fetch";

const VERSION = "2026.09.10.9";
const INVENTORY_BUCKET = "inventory-media";
const MAX_MEDIA_BYTES = 15 * 1024 * 1024;
const ALLOWED_MEDIA_TYPES = new Set(["image/jpeg","image/png","image/webp","image/avif","image/gif"]);
const MASTER_TYPES = new Set(["COUNTRY","DESTINATION","AREA","SUPPLIER","HOTEL","GUIDED_TOUR","ACTIVITY","PARTNER_TICKET","TRANSFER","CAR_RENTAL","PACKAGE","ANCILLARY"]);
const REFERENCE_TYPES = new Set(["AIRPORT","AIRLINE"]);
const GEO_TYPES = new Set(["COUNTRY","DESTINATION","AREA"]);
const CATALOG_ELIGIBLE = new Set(["COUNTRY","AREA","DESTINATION","AIRLINE","HOTEL","GUIDED_TOUR","ACTIVITY","PARTNER_TICKET","TRANSFER","CAR_RENTAL","PACKAGE"]);
const INVENTORY_ROLES = new Set(["SUPER_ADMIN","OWNER","COMPANY_OWNER","DESTINATION_CONTROLLER","INVENTORY_ADMIN","OCC_CONTROLLER"]);
const SUPPORTED_LANGUAGES = new Set(["EN","SV","NO","DA"]);
const STATUS = new Set(["DRAFT","REVIEW","PUBLISHED","HIDDEN","SUSPENDED","ARCHIVED"]);

const elevatedGetSecretValue = elevate(secrets.getSecretValue);
let configurationPromise = null;

function clean(value, max = 5000) {
  return String(value ?? "").trim().slice(0, max);
}
function upper(value, max = 5000) { return clean(value, max).toUpperCase(); }
function arr(value) { return Array.isArray(value) ? value : []; }
function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
function first(rows) { return Array.isArray(rows) && rows.length ? rows[0] : null; }
function bool(value, fallback = false) {
  if (value === true || value === "true" || value === "YES" || value === 1) return true;
  if (value === false || value === "false" || value === "NO" || value === 0) return false;
  return fallback;
}
function nullableNumber(value) {
  if (value === "" || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
function intOr(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}
function dateOnly(value) {
  const s = clean(value, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}
function timeOnly(value) {
  const s = clean(value, 8);
  return /^\d{2}:\d{2}(?::\d{2})?$/.test(s) ? s : null;
}
function slugify(value) {
  return clean(value, 300).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/&/g," and ").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");
}
function uniq(values) { return [...new Set(arr(values).map(v => clean(v, 300)).filter(Boolean))]; }
function uuidV4() {
  try { if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID(); } catch (_) {}
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === "x" ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
function errorCode(error) {
  return clean(error?.code || error?.message || error || "INVENTORY_ERROR", 240);
}
function safeMessage(error) {
  const raw = errorCode(error);
  const known = {
    INVENTORY_AUTH_REQUIRED: "Your staff session has expired. Sign in again.",
    INVENTORY_ACCESS_DENIED: "Your staff account does not have Inventory Control access.",
    INVENTORY_PARENT_CYCLE: "That parent would create a circular destination hierarchy.",
    INVENTORY_DUPLICATE_CODE: "Another record already uses that code in this inventory family.",
    INVENTORY_DUPLICATE_SLUG: "Another record already uses that URL slug in this inventory family.",
    INVENTORY_RECORD_NOT_FOUND: "The inventory record could not be found.",
    INVENTORY_MEDIA_TYPE_NOT_ALLOWED: "That image format is not allowed.",
    INVENTORY_MEDIA_TOO_LARGE: "The image exceeds the 15 MB upload limit."
  };
  return known[raw] || (raw.startsWith("INVENTORY_") ? raw.replaceAll("_"," ") : "Inventory Control could not complete the request.");
}

function secretString(response) {
  if (typeof response === "string") return response.trim();
  return String(response?.value ?? response?.secretValue ?? response?.secret?.value ?? "").trim();
}
async function getSecret(name) {
  const response = await elevatedGetSecretValue(name);
  const value = secretString(response);
  if (!value) throw new Error(`WIX_SECRET_EMPTY_${name}`);
  return value;
}
async function getConfiguration() {
  if (!configurationPromise) {
    configurationPromise = (async () => {
      const baseUrl = (await getSecret("SUPABASE_URL")).replace(/\/+$/g, "");
      let apiKey = "";
      try { apiKey = await getSecret("SUPABASE_SECRET_KEY"); }
      catch (_) { apiKey = await getSecret("SUPABASE_SERVICE_ROLE_KEY"); }
      if (!/^https:\/\/[^/]+\.supabase\.co$/i.test(baseUrl)) throw new Error("SUPABASE_URL_INVALID");
      if (!apiKey) throw new Error("SUPABASE_SERVER_KEY_MISSING");
      const keyType = apiKey.startsWith("sb_secret_") ? "modern-secret" : apiKey.startsWith("eyJ") ? "legacy-jwt" : "api-key";
      return { baseUrl, apiKey, keyType };
    })();
  }
  try {
    return await configurationPromise;
  } catch (error) {
    configurationPromise = null;
    throw error;
  }
}
function queryString(query = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query || {})) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }
  return params.toString();
}
async function rest(table, { method = "GET", query = {}, body, prefer = "return=representation" } = {}) {
  const { baseUrl, apiKey, keyType } = await getConfiguration();
  const qs = queryString(query);
  const url = `${baseUrl}/rest/v1/${table}${qs ? `?${qs}` : ""}`;
  const headers = {
    apikey: apiKey,
    Accept: "application/json",
    Prefer: prefer
  };
  if (keyType === "legacy-jwt") headers.Authorization = `Bearer ${apiKey}`;
  const options = { method, headers };
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }
  const response = await fetch(url, options);
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (_) { data = text; }
  if (!response.ok) {
    const detail = typeof data === "object" && data ? (data.message || data.details || data.hint || data.code) : text;
    throw new Error(`INVENTORY_SUPABASE_${response.status}:${clean(detail, 500)}`);
  }
  return data;
}
async function storageSignUpload(path) {
  const { baseUrl, apiKey, keyType } = await getConfiguration();
  const encodedPath = String(path).split("/").map(encodeURIComponent).join("/");
  const url = `${baseUrl}/storage/v1/object/upload/sign/${encodeURIComponent(INVENTORY_BUCKET)}/${encodedPath}`;
  const headers = { apikey: apiKey, "Content-Type": "application/json", Accept: "application/json" };
  if (keyType === "legacy-jwt") headers.Authorization = `Bearer ${apiKey}`;
  const response = await fetch(url, {
    method: "POST",
    headers,
    body: "{}"
  });
  const text = await response.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch (_) {}
  if (!response.ok) throw new Error(`INVENTORY_STORAGE_SIGN_${response.status}`);
  const token = clean(data.token || data.signedToken || "", 5000);
  if (!token) throw new Error("INVENTORY_STORAGE_SIGN_TOKEN_MISSING");
  return {
    token,
    signedUrl: `${baseUrl}/storage/v1/object/upload/sign/${encodeURIComponent(INVENTORY_BUCKET)}/${encodedPath}`,
    publicUrl: `${baseUrl}/storage/v1/object/public/${encodeURIComponent(INVENTORY_BUCKET)}/${encodedPath}`
  };
}

function memberEmail(member = {}) {
  const emails = member?.contactDetails?.emails;
  return clean(member.loginEmail || (Array.isArray(emails) ? emails[0] : emails) || member?.profile?.email || "", 254).toLowerCase();
}
async function currentIdentity() {
  try {
    const member = await currentMember.getMember({ fieldsets: ["FULL"] });
    return { memberId: clean(member?._id || member?.id, 200), email: memberEmail(member) };
  } catch (_) {
    return { memberId: "", email: "" };
  }
}
async function findAgent(identity) {
  const select = "id,member_id,wix_member_id,email,first_name,last_name,preferred_name,display_name,job_title,department,station,base,active,status,employment_status,portal_access,authorized,can_manage,access_role,role_id,permission_preset,permission_keys,allowed_apps";
  if (identity.memberId) {
    let row = first(await rest("agent_users", { query: { select, member_id: `eq.${identity.memberId}`, limit: 1 } }));
    if (row) return row;
    row = first(await rest("agent_users", { query: { select, wix_member_id: `eq.${identity.memberId}`, limit: 1 } }));
    if (row) return row;
  }
  if (identity.email) {
    return first(await rest("agent_users", { query: { select, email: `ilike.${identity.email}`, limit: 1 } }));
  }
  return null;
}
function agentHasInventoryAccess(agent) {
  if (!agent || agent.active !== true || agent.portal_access !== true || agent.authorized !== true) return false;
  const employment = clean(agent.employment_status, 80).toLowerCase();
  if (employment && employment !== "active") return false;
  const status = clean(agent.status, 80).toLowerCase();
  if (["inactive","blocked","suspended","terminated","deleted"].includes(status)) return false;
  const keys = arr(agent.permission_keys).map(v => clean(v, 120).toLowerCase());
  const apps = arr(agent.allowed_apps).map(v => clean(v, 120).toLowerCase());
  const roles = [agent.access_role,agent.role_id,agent.permission_preset,agent.job_title].map(v => upper(v, 120)).filter(Boolean);
  return agent.can_manage === true || keys.includes("inventory-control") || apps.includes("inventory") || apps.includes("inventory-control") || roles.some(r => INVENTORY_ROLES.has(r));
}
async function requireInventoryAgent() {
  const identity = await currentIdentity();
  if (!identity.memberId) throw new Error("INVENTORY_AUTH_REQUIRED");
  const agent = await findAgent(identity);
  if (!agent) throw new Error("INVENTORY_ACCESS_DENIED");
  if (!agentHasInventoryAccess(agent)) throw new Error("INVENTORY_ACCESS_DENIED");
  return {
    id: agent.id,
    skId: clean(agent.sk_id || agent.agent_id || "", 40),
    displayName: clean(agent.preferred_name || agent.display_name || [agent.first_name,agent.last_name].filter(Boolean).join(" ") || agent.email || "Staff", 180),
    role: clean(agent.access_role || agent.role_id || agent.job_title || "", 120),
    department: clean(agent.department || "", 120),
    station: clean(agent.station || agent.base || "", 80)
  };
}

function toUiRecord(row = {}) {
  return {
    id: row.id || "",
    publicId: row.public_id || "",
    entityType: upper(row.entity_type, 40),
    code: clean(row.code, 120),
    name: clean(row.name, 500),
    slug: clean(row.slug, 500),
    status: upper(row.status || "DRAFT", 40),
    active: row.active !== false,
    customerVisible: row.customer_visible === true,
    staffVisible: row.staff_visible !== false,
    alteaVisible: row.altea_visible !== false,
    searchable: row.searchable === true,
    collectionType: clean(row.collection_type || "NONE", 80),
    partnerTier: clean(row.partner_tier || "", 80),
    searchPriority: intOr(row.search_priority, 100),
    searchKeywords: arr(row.search_keywords),
    featured: row.featured === true,
    homepageFeatured: row.homepage_featured === true,
    sortPriority: intOr(row.sort_priority, 100),
    parentEntityId: row.parent_entity_id || "",
    supplierEntityId: row.supplier_entity_id || "",
    source: clean(row.source || "SKANDI", 120),
    sourceReference: clean(row.source_reference || "", 500),
    details: obj(row.details),
    commercial: obj(row.commercial),
    operations: obj(row.operations),
    seo: obj(row.seo),
    publication: obj(row.publication),
    payload: obj(row.payload),
    sourceTable: clean(row.source_table || "inventory_master_entities", 120),
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null
  };
}
function toCatalog(entry = {}) {
  return {
    id: entry.id || "",
    targetEntityId: entry.target_entity_id || "",
    targetRecordType: upper(entry.target_record_type, 40),
    targetRecordId: clean(entry.target_record_id, 200),
    targetCode: clean(entry.target_code, 120),
    catalogType: clean(entry.catalog_type || "NONE", 80),
    partnerTier: clean(entry.partner_tier || "", 80),
    searchable: entry.searchable === true,
    featured: entry.featured === true,
    homepageFeatured: entry.homepage_featured === true,
    searchPriority: intOr(entry.search_priority, 100),
    searchKeywords: arr(entry.search_keywords),
    marketCodes: arr(entry.market_codes),
    salesChannels: arr(entry.sales_channels),
    publicLabel: clean(entry.public_label, 300),
    badge: clean(entry.badge, 160),
    validFrom: entry.valid_from || "",
    validTo: entry.valid_to || "",
    notes: clean(entry.notes, 5000),
    active: entry.active !== false
  };
}
function localizedFromCanonical(row = {}) {
  return arr(row.localized).map(item => ({
    id: item.id || "",
    language: upper(item.language, 12),
    title: clean(item.title, 1000),
    eyebrow: clean(item.eyebrow, 500),
    shortDescription: clean(item.shortDescription ?? item.short_description, 5000),
    fullDescription: clean(item.fullDescription ?? item.full_description, 30000),
    highlights: arr(item.highlights),
    included: arr(item.included),
    notIncluded: arr(item.notIncluded ?? item.not_included),
    importantInformation: clean(item.importantInformation ?? item.important_information, 10000),
    seoTitle: clean(item.seoTitle ?? item.seo_title, 1000),
    seoDescription: clean(item.seoDescription ?? item.seo_description, 5000),
    content: obj(item.content)
  }));
}
function mediaFromCanonical(row = {}) { return arr(row.media); }
function relationsFromCanonical(row = {}) { return arr(row.relations); }

async function canonicalRows() {
  const data = await rest("inventory_canonical_entities_v", { query: { select: "*", order: "sort_priority.asc,name.asc", limit: 1000 } });
  return arr(data);
}
async function listCatalogRows() {
  return arr(await rest("inventory_catalog_entries", { query: { select: "*", order: "search_priority.asc,updated_at.desc", limit: 1000 } }));
}
async function loadBootstrap(payload = {}) {
  const rows = await canonicalRows();
  const records = filterRecords(rows.map(toUiRecord), payload);
  const references = rows.filter(r => r.active !== false).map(toUiRecord).map(r => ({
    id:r.id, publicId:r.publicId, entityType:r.entityType, code:r.code, name:r.name, slug:r.slug,
    parentEntityId:r.parentEntityId, sourceTable:r.sourceTable, details:r.details
  }));
  const catalog = (await listCatalogRows()).map(toCatalog);
  return { version: VERSION, records, references, catalog, total: rows.length };
}
function filterRecords(records, payload = {}) {
  const type = upper(payload.entityType, 40);
  const query = clean(payload.query, 300).toLowerCase();
  const status = upper(payload.status, 40);
  const cv = payload.customerVisible;
  return arr(records).filter(r => {
    if (type && r.entityType !== type) return false;
    if (status && r.status !== status) return false;
    if (cv !== undefined && cv !== null && cv !== "" && r.customerVisible !== bool(cv)) return false;
    if (query) {
      const hay = [r.publicId,r.id,r.entityType,r.code,r.name,r.slug,r.details?.iata,r.details?.icao,r.details?.city,r.details?.country].join(" ").toLowerCase();
      if (!hay.includes(query)) return false;
    }
    return true;
  });
}
async function listRecords(payload = {}) {
  const rows = (await canonicalRows()).map(toUiRecord);
  return { records: filterRecords(rows, payload), total: rows.length };
}
async function getRecordBundle(payload = {}) {
  const id = clean(payload.id, 200);
  if (!id) throw new Error("INVENTORY_RECORD_NOT_FOUND");
  const row = first(await rest("inventory_canonical_entities_v", { query: { select: "*", id: `eq.${id}`, limit: 1 } }));
  if (!row) throw new Error("INVENTORY_RECORD_NOT_FOUND");
  const record = toUiRecord(row);
  return {
    record,
    localizedContent: localizedFromCanonical(row),
    media: mediaFromCanonical(row),
    relations: relationsFromCanonical(row)
  };
}

function normalizeLocalized(items) {
  return arr(items).map(item => {
    const language = upper(item.language, 12);
    if (!SUPPORTED_LANGUAGES.has(language)) return null;
    return {
      id: clean(item.id, 100), language,
      title: clean(item.title, 1000), eyebrow: clean(item.eyebrow, 500),
      shortDescription: clean(item.shortDescription, 5000), fullDescription: clean(item.fullDescription, 30000),
      highlights: uniq(item.highlights), included: uniq(item.included), notIncluded: uniq(item.notIncluded),
      importantInformation: clean(item.importantInformation, 10000),
      seoTitle: clean(item.seoTitle, 1000), seoDescription: clean(item.seoDescription, 5000),
      content: obj(item.content)
    };
  }).filter(Boolean);
}
function normalizeMedia(items) {
  return arr(items).map((item, index) => ({
    id: clean(item.id, 100), mediaType: upper(item.mediaType || "IMAGE", 40), role: upper(item.role || "GALLERY", 40),
    url: clean(item.url, 5000), altText: clean(item.altText, 1000), caption: clean(item.caption, 3000), credit: clean(item.credit, 1000),
    language: upper(item.language, 12), sortOrder: intOr(item.sortOrder, (index + 1) * 10),
    isPrimary: bool(item.isPrimary), isHero: bool(item.isHero), isCard: bool(item.isCard), isMobile: bool(item.isMobile), active: item.active !== false,
    storageBucket: clean(item.storageBucket, 120), storagePath: clean(item.storagePath, 1000), mimeType: clean(item.mimeType, 120),
    fileSizeBytes: nullableNumber(item.fileSizeBytes), width: nullableNumber(item.width), height: nullableNumber(item.height),
    focalX: nullableNumber(item.focalX), focalY: nullableNumber(item.focalY), sourceKind: clean(item.sourceKind || "URL", 80)
  })).filter(item => item.url);
}
function normalizeRelations(items) {
  return arr(items).map((item, index) => ({
    relationType: upper(item.relationType || "OTHER", 80),
    targetEntityId: clean(item.targetEntityId, 100),
    sequenceNo: intOr(item.sequenceNo, (index + 1) * 10),
    active: item.active !== false
  })).filter(item => item.targetEntityId);
}
function applyStructures(record, structures = {}) {
  const d = { ...obj(record.details) };
  const o = { ...obj(record.operations) };
  const s = obj(structures);
  const dMap = {
    facts:"facts", quickFacts:"quickFactsJson", faqs:"faqs", climate:"climate", signature:"signature", rooms:"rooms",
    sourceUrls:"sourceUrlsJson", hubs:"hubsJson", fleet:"fleetSummaryJson",
    goodFor:"goodFor", tags:"tags", facilities:"facilities", languages:"languages", boardOptions:"boardOptions"
  };
  for (const [key, target] of Object.entries(dMap)) if (key in s) d[target] = arr(s[key]);
  if ("itinerary" in s) o.itinerary = arr(s.itinerary);
  if ("pickups" in s) o.pickups = arr(s.pickups);
  if ("zones" in s) o.transferZones = arr(s.zones);
  return { ...record, details:d, operations:o };
}
function normalizeRecord(input = {}, structures = {}) {
  const raw = applyStructures(obj(input), structures);
  const type = upper(raw.entityType, 40);
  if (!MASTER_TYPES.has(type) && !REFERENCE_TYPES.has(type)) throw new Error("INVENTORY_TYPE_INVALID");
  const details = obj(raw.details);
  const code = type === "AIRPORT" ? upper(details.iata || raw.code, 12) : type === "AIRLINE" ? upper(details.iata || raw.code, 12) : upper(raw.code, 120);
  const name = clean(raw.name, 500);
  const slug = clean(raw.slug, 500) || slugify(name || code);
  const status = STATUS.has(upper(raw.status, 40)) ? upper(raw.status,40) : "DRAFT";
  const record = {
    id: clean(raw.id, 100), publicId: clean(raw.publicId, 200), entityType:type, code, name, slug,
    status, active: raw.active !== false, customerVisible: bool(raw.customerVisible), staffVisible: raw.staffVisible !== false,
    alteaVisible: raw.alteaVisible !== false, searchable: bool(raw.searchable), collectionType: clean(raw.collectionType || "NONE", 80),
    partnerTier: clean(raw.partnerTier, 80), searchPriority: intOr(raw.searchPriority, 100), searchKeywords: uniq(raw.searchKeywords),
    featured: bool(raw.featured), homepageFeatured: bool(raw.homepageFeatured), sortPriority: intOr(raw.sortPriority, 100),
    parentEntityId: clean(raw.parentEntityId, 100), supplierEntityId: clean(raw.supplierEntityId, 100),
    source: clean(raw.source || "SKANDI", 120), sourceReference: clean(raw.sourceReference, 500),
    details, commercial:obj(raw.commercial), operations:obj(raw.operations), seo:obj(raw.seo), publication:obj(raw.publication), payload:obj(raw.payload),
    sourceTable: clean(raw.sourceTable, 120)
  };
  if (type === "COUNTRY" && !record.code) record.code = upper(details.countryCode, 12);
  if (!record.publicId && MASTER_TYPES.has(type)) record.publicId = `${type}-${record.code || slugify(record.name) || uuidV4().slice(0,8).toUpperCase()}`;
  return record;
}
function normalizeCatalog(input, record) {
  if (!CATALOG_ELIGIBLE.has(record.entityType)) return null;
  const c = obj(input);
  const catalogType = ["SKANDI_COLLECTION","SKANDI_PARTNER"].includes(upper(c.catalogType,80)) ? upper(c.catalogType,80) : "NONE";
  const searchable = catalogType !== "NONE" && bool(c.searchable);
  const featured = catalogType !== "NONE" && bool(c.featured);
  const homepageFeatured = catalogType !== "NONE" && bool(c.homepageFeatured);
  return {
    id:clean(c.id,100), catalogType, partnerTier: catalogType === "SKANDI_PARTNER" ? upper(c.partnerTier,80) : "",
    searchable, featured: homepageFeatured || featured, homepageFeatured,
    active: catalogType !== "NONE" && c.active !== false,
    searchPriority:intOr(c.searchPriority, record.sortPriority || 100), searchKeywords:uniq(c.searchKeywords),
    marketCodes:uniq(c.marketCodes).map(v=>upper(v,12)), salesChannels:uniq(c.salesChannels).map(v=>upper(v,20)),
    publicLabel:clean(c.publicLabel,300), badge:clean(c.badge,160), validFrom:dateOnly(c.validFrom), validTo:dateOnly(c.validTo), notes:clean(c.notes,5000)
  };
}
function syncRecordCatalog(record, catalog) {
  const listed = catalog && catalog.catalogType !== "NONE";
  // Search merchandising is authoritative in inventory_catalog_entries.
  // Core master entities deliberately keep their compatibility search fields at DB defaults.
  // Airlines retain equivalent compatibility fields because their canonical reference-table trigger supports them.
  if (record.entityType === "AIRLINE") {
    record.searchable = listed ? catalog.searchable : false;
    record.collectionType = listed ? catalog.catalogType : "NONE";
    record.partnerTier = listed ? catalog.partnerTier : "";
    record.searchPriority = listed ? catalog.searchPriority : 100;
    record.searchKeywords = listed ? catalog.searchKeywords : [];
  }
  record.featured = listed ? catalog.featured : false;
  record.homepageFeatured = listed ? catalog.homepageFeatured : false;
  return record;
}
function validateBundle(record, catalog) {
  const d = record.details;
  if (!record.name) throw new Error("INVENTORY_NAME_REQUIRED");
  if (!record.code && record.entityType !== "SUPPLIER") throw new Error("INVENTORY_CODE_REQUIRED");
  if (!record.slug && record.entityType !== "SUPPLIER") throw new Error("INVENTORY_SLUG_REQUIRED");
  const finalizing = record.status === "PUBLISHED" || record.status === "REVIEW";
  if (record.entityType === "COUNTRY" && !upper(d.countryCode || record.code,12)) throw new Error("INVENTORY_COUNTRY_CODE_REQUIRED");
  if (finalizing && ["AREA","DESTINATION"].includes(record.entityType) && !record.parentEntityId) throw new Error("INVENTORY_PARENT_REQUIRED");
  if (finalizing && record.entityType === "HOTEL" && !d.destinationId && !d.areaId) throw new Error("INVENTORY_GEO_REQUIRED");
  if (finalizing && ["GUIDED_TOUR","ACTIVITY","PARTNER_TICKET","PACKAGE"].includes(record.entityType) && !d.destinationId && !d.areaId) throw new Error("INVENTORY_GEO_REQUIRED");
  if (finalizing && record.entityType === "TRANSFER" && (!d.airportId || (!d.destinationId && !d.areaId))) throw new Error("INVENTORY_TRANSFER_ROUTE_REQUIRED");
  if (finalizing && record.entityType === "CAR_RENTAL" && !d.destinationId && !d.airportId) throw new Error("INVENTORY_CAR_LOCATION_REQUIRED");
  if (catalog?.catalogType === "SKANDI_PARTNER" && ["HOTEL","GUIDED_TOUR","ACTIVITY","PARTNER_TICKET","TRANSFER","CAR_RENTAL","PACKAGE"].includes(record.entityType) && !record.supplierEntityId) throw new Error("INVENTORY_SUPPLIER_REQUIRED");
  if (catalog?.validFrom && catalog?.validTo && catalog.validTo < catalog.validFrom) throw new Error("INVENTORY_CATALOG_DATE_INVALID");
  if (catalog && catalog.catalogType !== "NONE" && record.status === "PUBLISHED") record.customerVisible = true;
  if (record.entityType === "SUPPLIER") record.customerVisible = false;
}
async function assertNoDuplicate(record) {
  if (!MASTER_TYPES.has(record.entityType)) return;
  if (record.code) {
    const rows = arr(await rest("inventory_master_entities", { query:{ select:"id", entity_type:`eq.${record.entityType}`, code:`eq.${record.code}`, limit:2 } }));
    if (rows.some(r => String(r.id) !== String(record.id || ""))) throw new Error("INVENTORY_DUPLICATE_CODE");
  }
  if (record.slug) {
    const rows = arr(await rest("inventory_master_entities", { query:{ select:"id", entity_type:`eq.${record.entityType}`, slug:`eq.${record.slug}`, limit:2 } }));
    if (rows.some(r => String(r.id) !== String(record.id || ""))) throw new Error("INVENTORY_DUPLICATE_SLUG");
  }
}
async function assertNoHierarchyCycle(record) {
  if (!MASTER_TYPES.has(record.entityType) || !record.parentEntityId || !record.id) return;
  if (record.parentEntityId === record.id) throw new Error("INVENTORY_PARENT_CYCLE");
  const rows = arr(await rest("inventory_master_entities", { query:{ select:"id,parent_entity_id", limit:1000 } }));
  const parentById = new Map(rows.map(r => [String(r.id), String(r.parent_entity_id || "")]));
  let current = record.parentEntityId;
  const seen = new Set();
  while (current) {
    if (current === record.id) throw new Error("INVENTORY_PARENT_CYCLE");
    if (seen.has(current)) throw new Error("INVENTORY_PARENT_CYCLE");
    seen.add(current);
    current = parentById.get(current) || "";
  }
}

function masterBody(r) {
  return {
    public_id:r.publicId, entity_type:r.entityType, code:r.code, name:r.name, slug:r.slug, status:r.status, active:r.active,
    customer_visible:r.customerVisible, staff_visible:r.staffVisible, altea_visible:r.alteaVisible,
    featured:r.featured, homepage_featured:r.homepageFeatured, sort_priority:r.sortPriority,
    parent_entity_id:r.parentEntityId || null, supplier_entity_id:r.supplierEntityId || null, source:r.source, source_reference:r.sourceReference || null,
    details:r.details, commercial:r.commercial, operations:r.operations, seo:r.seo, publication:r.publication, payload:r.payload
  };
}
function airportBody(r, localized, media) {
  const d = r.details;
  return {
    title:r.name, slug:r.slug, active:r.active, sort_order:r.sortPriority,
    iata:upper(d.iata || r.code,12), icao:upper(d.icao,12), country:clean(d.country,200), locationCity:clean(d.city,200), timezone:clean(d.timezone,120),
    latitude:nullableNumber(d.latitude), longitude:nullableNumber(d.longitude), distanceToCityCenterKm:nullableNumber(d.distanceToCityCenterKm),
    website:clean(d.website,2000), contactUrl:clean(d.contactUrl,2000), summary:clean(d.overview || d.summary,10000),
    status:r.status, customer_visible:r.customerVisible, staff_visible:r.staffVisible, altea_visible:r.alteaVisible, featured:r.featured, homepage_featured:r.homepageFeatured,
    published:r.status === "PUBLISHED", source:r.source, source_reference:r.sourceReference || null,
    inventory_details:d, commercial:r.commercial, operations:r.operations, seo:r.seo, publication:r.publication,
    localized_content:localized, media_assets:media, payload:r.payload
  };
}
function airlineBody(r, localized, media) {
  const d = r.details;
  return {
    "Title":r.name, slug:r.slug, "Record ID":r.publicId || r.id, "iataCode":upper(d.iata || r.code,12), "icaoCode":upper(d.icao,12),
    "shortName":clean(d.shortName,200), alliance:clean(d.alliance,200), "brandGroup":clean(d.brandGroup,200), "locationCountry":clean(d.country,200), "locationCity":clean(d.city,200),
    website:clean(d.website,2000), summary:clean(d.summary || d.overview,10000),
    checkInDeadline:clean(d.checkInDeadline,3000), baggageAllowence:clean(d.baggageAllowance,5000),
    loyaltyProgram:clean(d.loyaltyProgram,500), loyaltyProgramUrl:clean(d.loyaltyProgramUrl,2000),
    active:r.active, sort_order:r.sortPriority, status:r.status, customer_visible:r.customerVisible, staff_visible:r.staffVisible, altea_visible:r.alteaVisible,
    featured:r.featured, homepage_featured:r.homepageFeatured, published:r.status === "PUBLISHED", source:r.source, source_reference:r.sourceReference || null,
    inventory_details:d, commercial:r.commercial, operations:r.operations, seo:r.seo, publication:r.publication, localized_content:localized, media_assets:media, payload:r.payload,
    searchable:r.searchable, collection_type:r.collectionType || "NONE", partner_tier:r.partnerTier || null, search_priority:r.searchPriority, search_keywords:r.searchKeywords
  };
}
async function savePrimary(record, localized, media) {
  if (MASTER_TYPES.has(record.entityType)) {
    const body = masterBody(record);
    if (record.id) {
      const rows = arr(await rest("inventory_master_entities", { method:"PATCH", query:{id:`eq.${record.id}`}, body }));
      if (!rows.length) throw new Error("INVENTORY_RECORD_NOT_FOUND");
      return toUiRecord({ ...rows[0], source_table:"inventory_master_entities" });
    }
    const rows = arr(await rest("inventory_master_entities", { method:"POST", body }));
    return toUiRecord({ ...first(rows), source_table:"inventory_master_entities" });
  }
  if (record.entityType === "AIRPORT") {
    const body = airportBody(record, localized, media);
    if (record.id) {
      const rows = arr(await rest("travel_info_airports", { method:"PATCH", query:{ID:`eq.${record.id}`}, body }));
      const saved = first(rows);
      if (!saved) throw new Error("INVENTORY_RECORD_NOT_FOUND");
      return { ...record, id:saved.ID || record.id, code:upper(saved.iata || body.iata,12), sourceTable:"travel_info_airports" };
    }
    const rows = arr(await rest("travel_info_airports", { method:"POST", body }));
    const saved = first(rows);
    return { ...record, id:saved?.ID || "", code:upper(saved?.iata || body.iata,12), sourceTable:"travel_info_airports" };
  }
  if (record.entityType === "AIRLINE") {
    const id = record.id || uuidV4();
    const body = { ID:id, ...airlineBody({ ...record, id }, localized, media) };
    if (record.id) {
      const updateBody = { ...body }; delete updateBody.ID;
      const rows = arr(await rest("travel_info_airlines", { method:"PATCH", query:{ID:`eq.${record.id}`}, body:updateBody }));
      const saved = first(rows);
      if (!saved) throw new Error("INVENTORY_RECORD_NOT_FOUND");
      return { ...record, id, code:upper(saved.iataCode || body.iataCode,12), sourceTable:"travel_info_airlines" };
    }
    const rows = arr(await rest("travel_info_airlines", { method:"POST", body }));
    const saved = first(rows);
    return { ...record, id:saved?.ID || id, code:upper(saved?.iataCode || body.iataCode,12), sourceTable:"travel_info_airlines" };
  }
  throw new Error("INVENTORY_TYPE_INVALID");
}

async function saveLocalized(entityId, items) {
  for (const item of items) {
    const existing = first(await rest("inventory_localized_content", { query:{select:"id",entity_id:`eq.${entityId}`,language:`eq.${item.language}`,limit:1} }));
    const body = {
      entity_id:entityId, language:item.language, title:item.title || null, eyebrow:item.eyebrow || null,
      short_description:item.shortDescription || null, full_description:item.fullDescription || null,
      highlights:item.highlights, included:item.included, not_included:item.notIncluded,
      important_information:item.importantInformation || null, seo_title:item.seoTitle || null, seo_description:item.seoDescription || null, content:item.content
    };
    if (existing?.id) await rest("inventory_localized_content", {method:"PATCH",query:{id:`eq.${existing.id}`},body});
    else await rest("inventory_localized_content", {method:"POST",body});
  }
}
async function saveMedia(entityId, items) {
  const existing = arr(await rest("inventory_media_assets", {query:{select:"*",entity_id:`eq.${entityId}`,limit:1000}}));
  const seen = new Set();
  for (const item of items) {
    const body = {
      entity_id:entityId, media_type:item.mediaType, url:item.url, alt_text:item.altText || null, caption:item.caption || null, credit:item.credit || null,
      language:item.language || null, sort_order:item.sortOrder, is_primary:item.isPrimary, is_card:item.isCard, is_hero:item.isHero, is_mobile:item.isMobile,
      active:item.active, role:item.role, storage_bucket:item.storageBucket || null, storage_path:item.storagePath || null, mime_type:item.mimeType || null,
      file_size_bytes:item.fileSizeBytes, width_px:item.width, height_px:item.height, focal_x:item.focalX, focal_y:item.focalY, source_kind:item.sourceKind || "URL"
    };
    if (item.id && existing.some(x => String(x.id) === item.id)) {
      await rest("inventory_media_assets", {method:"PATCH",query:{id:`eq.${item.id}`},body});
      seen.add(item.id);
    } else {
      const rows = arr(await rest("inventory_media_assets", {method:"POST",body}));
      if (first(rows)?.id) seen.add(String(first(rows).id));
    }
  }
  for (const old of existing) {
    if (old.active === true && !seen.has(String(old.id))) await rest("inventory_media_assets", {method:"PATCH",query:{id:`eq.${old.id}`},body:{active:false}});
  }
}
async function saveRelations(entityId, items) {
  const existing = arr(await rest("inventory_entity_relations", {query:{select:"*",source_entity_id:`eq.${entityId}`,limit:1000}}));
  const matched = new Set();
  for (const item of items) {
    const old = existing.find(x => String(x.target_entity_id) === item.targetEntityId && upper(x.relation_type,80) === item.relationType);
    const body = { source_entity_id:entityId, target_entity_id:item.targetEntityId, relation_type:item.relationType, sequence_no:item.sequenceNo, active:item.active };
    if (old?.id) {
      await rest("inventory_entity_relations", {method:"PATCH",query:{id:`eq.${old.id}`},body});
      matched.add(String(old.id));
    } else {
      const rows = arr(await rest("inventory_entity_relations", {method:"POST",body}));
      if (first(rows)?.id) matched.add(String(first(rows).id));
    }
  }
  for (const old of existing) {
    if (old.active === true && !matched.has(String(old.id))) await rest("inventory_entity_relations", {method:"PATCH",query:{id:`eq.${old.id}`},body:{active:false}});
  }
}
async function findCatalogForRecord(record) {
  if (MASTER_TYPES.has(record.entityType)) {
    return first(await rest("inventory_catalog_entries", {query:{select:"*",target_entity_id:`eq.${record.id}`,limit:1}}));
  }
  return first(await rest("inventory_catalog_entries", {query:{select:"*",target_record_type:`eq.${record.entityType}`,target_record_id:`eq.${record.id}`,limit:1}}));
}
async function saveCatalog(record, catalog) {
  if (!CATALOG_ELIGIBLE.has(record.entityType)) return null;
  const existing = await findCatalogForRecord(record);
  if (!catalog || catalog.catalogType === "NONE") {
    if (existing?.id) await rest("inventory_catalog_entries", {method:"DELETE",query:{id:`eq.${existing.id}`},prefer:"return=minimal"});
    return null;
  }
  const target = MASTER_TYPES.has(record.entityType)
    ? { target_entity_id:record.id, target_record_type:record.entityType, target_record_id:record.id, target_code:record.code }
    : { target_entity_id:null, target_record_type:record.entityType, target_record_id:record.id, target_code:record.code };
  const body = {
    ...target, catalog_type:catalog.catalogType, partner_tier:catalog.partnerTier || null, searchable:catalog.searchable,
    featured:catalog.featured, homepage_featured:catalog.homepageFeatured, search_priority:catalog.searchPriority,
    search_keywords:catalog.searchKeywords, market_codes:catalog.marketCodes, sales_channels:catalog.salesChannels.length ? catalog.salesChannels : ["WEB"],
    public_label:catalog.publicLabel || null, badge:catalog.badge || null, valid_from:catalog.validFrom, valid_to:catalog.validTo, notes:catalog.notes || null, active:catalog.active
  };
  if (existing?.id) return first(arr(await rest("inventory_catalog_entries", {method:"PATCH",query:{id:`eq.${existing.id}`},body})));
  return first(arr(await rest("inventory_catalog_entries", {method:"POST",body})));
}

async function snapshotBundle(record) {
  if (!record.id) return { isNew:true, primary:null, localized:[], media:[], relations:[], catalog:null };
  if (MASTER_TYPES.has(record.entityType)) {
    return {
      isNew:false,
      primary:first(await rest("inventory_master_entities",{query:{select:"*",id:`eq.${record.id}`,limit:1}})),
      localized:arr(await rest("inventory_localized_content",{query:{select:"*",entity_id:`eq.${record.id}`,limit:1000}})),
      media:arr(await rest("inventory_media_assets",{query:{select:"*",entity_id:`eq.${record.id}`,limit:1000}})),
      relations:arr(await rest("inventory_entity_relations",{query:{select:"*",source_entity_id:`eq.${record.id}`,limit:1000}})),
      catalog:await findCatalogForRecord(record)
    };
  }
  const table = record.entityType === "AIRPORT" ? "travel_info_airports" : "travel_info_airlines";
  const key = "ID";
  return { isNew:false, primary:first(await rest(table,{query:{select:"*",[key]:`eq.${record.id}`,limit:1}})), localized:[],media:[],relations:[],catalog:await findCatalogForRecord(record), table };
}
function rollbackPatchBody(row, table) {
  const body = { ...obj(row) };
  if (table === "inventory_master_entities") {
    delete body.id; delete body.created_at; delete body.updated_at;
    delete body.created_by_agent_user_id; delete body.updated_by_agent_user_id;
  } else if (table === "travel_info_airports") {
    delete body.ID; delete body.created_at; delete body.updated_at;
  } else if (table === "travel_info_airlines") {
    delete body.ID; delete body["Created Date"]; delete body.updated_at;
  }
  return body;
}

async function restoreSnapshot(record, savedRecord, snap) {
  try {
    const id = savedRecord?.id || record.id;
    if (snap.isNew) {
      if (MASTER_TYPES.has(record.entityType)) {
        if (id) {
          await rest("inventory_catalog_entries",{method:"DELETE",query:{target_entity_id:`eq.${id}`},prefer:"return=minimal"}).catch(()=>{});
          await rest("inventory_entity_relations",{method:"DELETE",query:{source_entity_id:`eq.${id}`},prefer:"return=minimal"}).catch(()=>{});
          await rest("inventory_media_assets",{method:"DELETE",query:{entity_id:`eq.${id}`},prefer:"return=minimal"}).catch(()=>{});
          await rest("inventory_localized_content",{method:"DELETE",query:{entity_id:`eq.${id}`},prefer:"return=minimal"}).catch(()=>{});
          await rest("inventory_master_entities",{method:"DELETE",query:{id:`eq.${id}`},prefer:"return=minimal"}).catch(()=>{});
        }
      } else if (id) {
        const table = record.entityType === "AIRPORT" ? "travel_info_airports" : "travel_info_airlines";
        await rest("inventory_catalog_entries",{method:"DELETE",query:{target_record_type:`eq.${record.entityType}`,target_record_id:`eq.${id}`},prefer:"return=minimal"}).catch(()=>{});
        await rest(table,{method:"DELETE",query:{ID:`eq.${id}`},prefer:"return=minimal"}).catch(()=>{});
      }
      return;
    }
    if (MASTER_TYPES.has(record.entityType)) {
      if (snap.primary) await rest("inventory_master_entities",{method:"PATCH",query:{id:`eq.${record.id}`},body:rollbackPatchBody(snap.primary,"inventory_master_entities")});
      await rest("inventory_localized_content",{method:"DELETE",query:{entity_id:`eq.${record.id}`},prefer:"return=minimal"}).catch(()=>{});
      if (snap.localized.length) await rest("inventory_localized_content",{method:"POST",body:snap.localized});
      await rest("inventory_media_assets",{method:"DELETE",query:{entity_id:`eq.${record.id}`},prefer:"return=minimal"}).catch(()=>{});
      if (snap.media.length) await rest("inventory_media_assets",{method:"POST",body:snap.media});
      await rest("inventory_entity_relations",{method:"DELETE",query:{source_entity_id:`eq.${record.id}`},prefer:"return=minimal"}).catch(()=>{});
      if (snap.relations.length) await rest("inventory_entity_relations",{method:"POST",body:snap.relations});
    } else if (snap.primary) {
      await rest(snap.table,{method:"PATCH",query:{ID:`eq.${record.id}`},body:rollbackPatchBody(snap.primary,snap.table)});
    }
    const existingCatalog = await findCatalogForRecord(record).catch(()=>null);
    if (existingCatalog?.id) await rest("inventory_catalog_entries",{method:"DELETE",query:{id:`eq.${existingCatalog.id}`},prefer:"return=minimal"}).catch(()=>{});
    if (snap.catalog) await rest("inventory_catalog_entries",{method:"POST",body:snap.catalog}).catch(()=>{});
  } catch (_) {
    // Rollback is best-effort. The original error is preserved for the caller.
  }
}
async function insertAudit(agent, eventType, record, message, extra = {}) {
  await rest("master_inventory_audit", {method:"POST",body:{
    event_type:eventType, domain:"INVENTORY_CONTROL", entity_table:record.sourceTable || (MASTER_TYPES.has(record.entityType)?"inventory_master_entities":record.entityType==="AIRPORT"?"travel_info_airports":"travel_info_airlines"),
    entity_id:record.id || null, product_key:record.publicId || record.code || record.id || null, source:"WIX_INVENTORY_V9", message,
    payload:{version:VERSION,entityType:record.entityType,code:record.code,status:record.status,...extra}, created_by_agent_user_id:agent.id || null, created_by_name:agent.displayName || null
  },prefer:"return=minimal"});
}
async function saveBundle(payload, agent) {
  let record = normalizeRecord(payload.record, payload.structures);
  const hasCatalogPayload = Object.prototype.hasOwnProperty.call(obj(payload), "catalog");
  let catalog = hasCatalogPayload ? normalizeCatalog(payload.catalog, record) : null;
  if (!hasCatalogPayload && record.id && CATALOG_ELIGIBLE.has(record.entityType)) {
    const existing = await findCatalogForRecord(record);
    catalog = existing ? normalizeCatalog(toCatalog(existing), record) : normalizeCatalog(null, record);
  }
  syncRecordCatalog(record, catalog);
  validateBundle(record, catalog);
  await assertNoDuplicate(record);
  await assertNoHierarchyCycle(record);
  const localized = normalizeLocalized(payload.localizedContent);
  const media = normalizeMedia(payload.media);
  const relations = normalizeRelations(payload.relations);
  const snap = await snapshotBundle(record);
  let savedRecord = null;
  try {
    savedRecord = await savePrimary(record, localized, media);
    record = { ...record, ...savedRecord, id:savedRecord.id || record.id };
    if (MASTER_TYPES.has(record.entityType)) {
      await saveLocalized(record.id, localized);
      await saveMedia(record.id, media);
      await saveRelations(record.id, relations);
    }
    const savedCatalog = await saveCatalog(record, catalog);
    await insertAudit(agent,"SAVE_BUNDLE",record,`${record.entityType} ${record.code || record.name} saved.`,{catalogType:catalog?.catalogType||"NONE"});
    const fresh = await getRecordBundle({id:record.id});
    return { bundle:fresh, record:fresh.record, catalog:savedCatalog ? toCatalog(savedCatalog) : null, version:VERSION };
  } catch (error) {
    await restoreSnapshot(record, savedRecord, snap);
    throw error;
  }
}

async function saveCatalogOnly(payload, agent) {
  const recordInput = obj(payload.record || payload.entry?.record);
  let record = normalizeRecord(recordInput);
  if (!record.id && payload.entry) {
    const e = payload.entry;
    record.id = clean(e.targetEntityId || e.targetRecordId,100);
    record.entityType = upper(e.targetRecordType || record.entityType,40);
    record.code = clean(e.targetCode || record.code,120);
  }
  if (!record.id) throw new Error("INVENTORY_RECORD_NOT_FOUND");
  const row = first(await rest("inventory_canonical_entities_v",{query:{select:"*",id:`eq.${record.id}`,limit:1}}));
  if (!row) throw new Error("INVENTORY_RECORD_NOT_FOUND");
  record = toUiRecord(row);
  const input = payload.entry ? {
    ...payload.entry,
    catalogType:payload.entry.catalogType,
    partnerTier:payload.entry.partnerTier,
    searchable:payload.entry.searchable,featured:payload.entry.featured,homepageFeatured:payload.entry.homepageFeatured,
    active:payload.entry.active,searchPriority:payload.entry.searchPriority,searchKeywords:payload.entry.searchKeywords,marketCodes:payload.entry.marketCodes,
    salesChannels:payload.entry.salesChannels,publicLabel:payload.entry.publicLabel,badge:payload.entry.badge,validFrom:payload.entry.validFrom,validTo:payload.entry.validTo,notes:payload.entry.notes
  } : payload.catalog;
  const catalog = normalizeCatalog(input,record);
  const saved = await saveCatalog(record,catalog);
  syncRecordCatalog(record,catalog);
  if (MASTER_TYPES.has(record.entityType)) await rest("inventory_master_entities",{method:"PATCH",query:{id:`eq.${record.id}`},body:{featured:record.featured,homepage_featured:record.homepageFeatured}});
  if (record.entityType === "AIRLINE") await rest("travel_info_airlines",{method:"PATCH",query:{ID:`eq.${record.id}`},body:{searchable:record.searchable,collection_type:record.collectionType,partner_tier:record.partnerTier||null,search_priority:record.searchPriority,search_keywords:record.searchKeywords,featured:record.featured,homepage_featured:record.homepageFeatured}});
  await insertAudit(agent,"SAVE_CATALOG",record,"Website catalog placement saved.",{catalogType:catalog?.catalogType||"NONE"});
  return saved ? toCatalog(saved) : null;
}
async function deleteCatalogOnly(payload, agent) {
  const id = clean(payload.id,100);
  if (!id) return;
  const entry = first(await rest("inventory_catalog_entries",{query:{select:"*",id:`eq.${id}`,limit:1}}));
  if (!entry) return;
  await rest("inventory_catalog_entries",{method:"DELETE",query:{id:`eq.${id}`},prefer:"return=minimal"});
  if (entry.target_entity_id) {
    await rest("inventory_master_entities",{method:"PATCH",query:{id:`eq.${entry.target_entity_id}`},body:{featured:false,homepage_featured:false}}).catch(()=>{});
  } else if (entry.target_record_type === "AIRLINE" && entry.target_record_id) {
    await rest("travel_info_airlines",{method:"PATCH",query:{ID:`eq.${entry.target_record_id}`},body:{searchable:false,collection_type:"NONE",partner_tier:null,featured:false,homepage_featured:false}}).catch(()=>{});
  }
  await insertAudit(agent,"DELETE_CATALOG",{id:entry.target_entity_id||entry.target_record_id,entityType:entry.target_record_type||"CATALOG",code:entry.target_code,sourceTable:"inventory_catalog_entries"},"Website catalog placement removed.");
}

function normalizeDatedRow(input = {}) {
  const total = Math.max(0,intOr(input.capacityTotal,0));
  const held = Math.max(0,intOr(input.held,0));
  const sold = Math.max(0,intOr(input.sold,0));
  const over = Math.max(0,intOr(input.overbookingLimit,0));
  const available = Math.max(0,total + over - held - sold);
  const blackout = bool(input.blackout);
  const stopSale = bool(input.stopSale);
  let status = "OPEN";
  if (blackout) status = "BLACKOUT";
  else if (stopSale) status = "STOP_SALE";
  else if (total > 0 && available === 0) status = "SOLD_OUT";
  return {
    id:clean(input.id,100), entityId:clean(input.entityId,100), inventoryType:upper(input.inventoryType,40), serviceDate:dateOnly(input.serviceDate),
    startTime:timeOnly(input.startTime), endTime:timeOnly(input.endTime), variantCode:clean(input.variantCode,120), variantName:clean(input.variantName,300),
    capacityTotal:total, held, sold, overbookingLimit:over, waitlistLimit:Math.max(0,intOr(input.waitlistLimit,0)), available, stopSale, blackout, status,
    supplierCost:nullableNumber(input.supplierCost), publicPrice:nullableNumber(input.publicPrice), adultPrice:nullableNumber(input.adultPrice), childPrice:nullableNumber(input.childPrice),
    infantPrice:nullableNumber(input.infantPrice), privatePrice:nullableNumber(input.privatePrice), currency:upper(input.currency||"USD",3), priceBasis:upper(input.priceBasis||"PER_PERSON",40),
    bookingCutoffHours:nullableNumber(input.bookingCutoffHours), minStay:nullableNumber(input.minStay), maxStay:nullableNumber(input.maxStay), releaseDays:nullableNumber(input.releaseDays), supplierReference:clean(input.supplierReference,500)
  };
}
function datedDb(r) {
  return {entity_id:r.entityId,inventory_type:r.inventoryType,service_date:r.serviceDate,start_time:r.startTime,end_time:r.endTime,variant_code:r.variantCode||null,variant_name:r.variantName||null,
    capacity_total:r.capacityTotal,held:r.held,sold:r.sold,available:r.available,waitlist_limit:r.waitlistLimit,overbooking_limit:r.overbookingLimit,stop_sale:r.stopSale,blackout:r.blackout,status:r.status,
    supplier_cost:r.supplierCost,public_price:r.publicPrice,adult_price:r.adultPrice,child_price:r.childPrice,infant_price:r.infantPrice,private_price:r.privatePrice,currency:r.currency,price_basis:r.priceBasis,
    booking_cutoff_hours:r.bookingCutoffHours,min_stay:r.minStay,max_stay:r.maxStay,release_days:r.releaseDays,supplier_reference:r.supplierReference||null};
}
function datedUi(row={}) {
  return {id:row.id,entityId:row.entity_id,inventoryType:row.inventory_type,serviceDate:row.service_date,startTime:row.start_time,endTime:row.end_time,variantCode:row.variant_code,variantName:row.variant_name,
    capacityTotal:row.capacity_total,held:row.held,sold:row.sold,available:row.available,waitlistLimit:row.waitlist_limit,overbookingLimit:row.overbooking_limit,stopSale:row.stop_sale,blackout:row.blackout,status:row.status,
    supplierCost:row.supplier_cost,publicPrice:row.public_price,adultPrice:row.adult_price,childPrice:row.child_price,infantPrice:row.infant_price,privatePrice:row.private_price,currency:row.currency,priceBasis:row.price_basis,
    bookingCutoffHours:row.booking_cutoff_hours,minStay:row.min_stay,maxStay:row.max_stay,releaseDays:row.release_days,supplierReference:row.supplier_reference,updatedAt:row.updated_at};
}
async function getDated(payload={}) {
  const entityId=clean(payload.entityId,100); if(!entityId) return {inventory:[]};
  const rows=arr(await rest("inventory_dated_inventory",{query:{select:"*",entity_id:`eq.${entityId}`,order:"service_date.asc,start_time.asc",limit:1000}}));
  return {inventory:rows.map(datedUi)};
}
async function saveDated(payload,agent) {
  const row=normalizeDatedRow(payload.row); if(!row.entityId||!row.serviceDate) throw new Error("INVENTORY_DATED_DATE_REQUIRED");
  const body=datedDb(row); let saved;
  if(row.id) saved=first(arr(await rest("inventory_dated_inventory",{method:"PATCH",query:{id:`eq.${row.id}`},body})));
  else saved=first(arr(await rest("inventory_dated_inventory",{method:"POST",body})));
  await insertAudit(agent,"SAVE_DATED",{id:row.entityId,entityType:row.inventoryType,code:row.variantCode,sourceTable:"inventory_dated_inventory"},"Dated inventory saved.",{serviceDate:row.serviceDate,status:row.status});
  return {row:datedUi(saved||body)};
}
async function deleteDated(payload,agent) {
  const id=clean(payload.id,100); if(!id)return {};
  const old=first(await rest("inventory_dated_inventory",{query:{select:"*",id:`eq.${id}`,limit:1}}));
  await rest("inventory_dated_inventory",{method:"DELETE",query:{id:`eq.${id}`},prefer:"return=minimal"});
  if(old) await insertAudit(agent,"DELETE_DATED",{id:old.entity_id,entityType:old.inventory_type,code:old.variant_code,sourceTable:"inventory_dated_inventory"},"Dated inventory deleted.",{serviceDate:old.service_date});
  return {};
}

function flightFilter(payload={}) {
  const q={select:"*",limit:500};
  if(clean(payload.flightNumber,20)) q.flight_number=`eq.${upper(payload.flightNumber,20)}`;
  if(dateOnly(payload.departureDate)) q.departure_date=`eq.${dateOnly(payload.departureDate)}`;
  if(clean(payload.boardPoint,8)) q.board_point=`eq.${upper(payload.boardPoint,8)}`;
  if(clean(payload.offPoint,8)) q.off_point=`eq.${upper(payload.offPoint,8)}`;
  return q;
}
async function fetchFlight(payload={}) {
  const q=flightFilter(payload); const legs=arr(await rest("inventory_flight_legs",{query:{...q,order:"departure_date.asc,flight_number.asc"}}));
  const classes=arr(await rest("inventory_flight_classes",{query:{...q,order:"departure_date.asc,flight_number.asc,class_code.asc"}}));
  const leg=first(legs);
  return {flight:leg?{id:leg.id,flightNumber:leg.flight_number,departureDate:leg.departure_date,boardPoint:leg.board_point,offPoint:leg.off_point,equipmentType:leg.equipment_type,physicalCapacity:leg.physical_capacity,status:leg.status}:null,
    classes:classes.map(c=>({id:c.id,flightNumber:c.flight_number,departureDate:c.departure_date,boardPoint:c.board_point,offPoint:c.off_point,classCode:c.class_code,cabin:c.cabin,nest:c.nest,authorized:c.authorized,sold:c.sold,available:c.available,status:c.status}))};
}
async function fetchSchedule(payload={}) {
  const q={select:"*",limit:500,order:"season_code.asc,flight_number.asc"};
  if(clean(payload.flightNumber,20)) q.flight_number=`eq.${upper(payload.flightNumber,20)}`;
  if(clean(payload.boardPoint,8)) q.board_point=`eq.${upper(payload.boardPoint,8)}`;
  if(clean(payload.offPoint,8)) q.off_point=`eq.${upper(payload.offPoint,8)}`;
  if(clean(payload.seasonCode,40)) q.season_code=`eq.${upper(payload.seasonCode,40)}`;
  const rows=arr(await rest("inventory_schedule_lines",{query:q}));
  return {schedule:rows.map(r=>({id:r.id,seasonCode:r.season_code,flightNumber:r.flight_number,daysOfOperation:r.days_of_operation,boardPoint:r.board_point,offPoint:r.off_point,viaPoint:r.via_point,std:r.std,sta:r.sta,equipmentType:r.equipment_type,capacity:r.capacity,status:r.status}))};
}
async function fetchNesting(payload={}) {
  const q={...flightFilter(payload),order:"departure_date.asc,flight_number.asc,class_code.asc"};
  const rows=arr(await rest("inventory_nesting_controls",{query:q}));
  return {nesting:rows.map(r=>({id:r.id,flightNumber:r.flight_number,departureDate:r.departure_date,boardPoint:r.board_point,offPoint:r.off_point,classCode:r.class_code,cabin:r.cabin,nest:r.nest,parentClass:r.parent_class,bidPrice:r.bid_price,hurdle:r.hurdle,authorized:r.authorized,protection:r.protection,status:r.status}))};
}
async function fetchAudit(payload={}) {
  const rows=arr(await rest("master_inventory_audit",{query:{select:"*",order:"created_at.desc",limit:Math.min(500,Math.max(1,intOr(payload.limit,200)))}}));
  return {audit:rows.map(r=>({id:r.id,timestamp:r.created_at,eventType:r.event_type,productKey:r.product_key,entityId:r.entity_id,message:r.message,agentName:r.created_by_name,source:r.source}))};
}
async function createMediaTicket(payload={}) {
  const mime=clean(payload.mimeType,120).toLowerCase(); const size=Number(payload.fileSizeBytes||0);
  if(!ALLOWED_MEDIA_TYPES.has(mime)) throw new Error("INVENTORY_MEDIA_TYPE_NOT_ALLOWED");
  if(!Number.isFinite(size)||size<1||size>MAX_MEDIA_BYTES) throw new Error("INVENTORY_MEDIA_TOO_LARGE");
  const type=slugify(payload.entityType||"record")||"record"; const id=slugify(payload.entityId||"draft")||"draft"; const role=slugify(payload.role||"gallery")||"gallery";
  const ext={"image/jpeg":"jpg","image/png":"png","image/webp":"webp","image/avif":"avif","image/gif":"gif"}[mime]||"bin";
  const path=`${type}/${id}/${Date.now()}-${role}-${uuidV4().slice(0,8)}.${ext}`;
  const signed=await storageSignUpload(path);
  return {...signed,storageBucket:INVENTORY_BUCKET,storagePath:path,mimeType:mime,fileSizeBytes:size,cacheControl:"31536000",sourceKind:"UPLOAD"};
}

async function dispatch(type,payload,agent) {
  switch(type) {
    case "INVENTORY_V4_READY": return {type:"INVENTORY_V4_BOOTSTRAP",payload:await loadBootstrap(payload)};
    case "INVENTORY_V4_LIST": return {type:"INVENTORY_V4_BOOTSTRAP",payload:{...(await loadBootstrap(payload))}};
    case "INVENTORY_V4_GET": return {type:"INVENTORY_V4_RECORD",payload:await getRecordBundle(payload)};
    case "INVENTORY_V9_SAVE_BUNDLE": return {type:"INVENTORY_V4_SAVED",payload:await saveBundle(payload,agent)};
    case "INVENTORY_V4_SAVE": return {type:"INVENTORY_V4_SAVED",payload:await saveBundle(payload,agent)};
    case "INVENTORY_V4_LIST_CATALOG": return {type:"INVENTORY_V4_CATALOG_RESULT",payload:{entries:(await listCatalogRows()).map(toCatalog)}};
    case "INVENTORY_V4_SAVE_CATALOG": {
      const saved=await saveCatalogOnly(payload,agent); return {type:"INVENTORY_V4_CATALOG_SAVED",payload:{entry:saved,entries:(await listCatalogRows()).map(toCatalog)}};
    }
    case "INVENTORY_V4_DELETE_CATALOG": {
      await deleteCatalogOnly(payload,agent); return {type:"INVENTORY_V4_CATALOG_DELETED",payload:{entries:(await listCatalogRows()).map(toCatalog)}};
    }
    case "INVENTORY_V4_GET_DATED": return {type:"INVENTORY_V4_DATED",payload:await getDated(payload)};
    case "INVENTORY_V4_SAVE_DATED": return {type:"INVENTORY_V4_DATED_SAVED",payload:await saveDated(payload,agent)};
    case "INVENTORY_V4_DELETE_DATED": return {type:"INVENTORY_V4_DATED_DELETED",payload:await deleteDated(payload,agent)};
    case "INVENTORY_V4_MEDIA_UPLOAD_TICKET": return {type:"INVENTORY_V4_MEDIA_UPLOAD_TICKET_RESULT",payload:await createMediaTicket(payload)};
    case "INVENTORY_FETCH_FLIGHT": return {type:"INVENTORY_FLIGHT_RESULT",payload:await fetchFlight(payload)};
    case "INVENTORY_FETCH_SCHEDULE": return {type:"INVENTORY_SCHEDULE_RESULT",payload:await fetchSchedule(payload)};
    case "INVENTORY_FETCH_NESTING": return {type:"INVENTORY_NESTING_RESULT",payload:await fetchNesting(payload)};
    case "INVENTORY_FETCH_AUDIT": return {type:"INVENTORY_AUDIT_RESULT",payload:await fetchAudit(payload)};
    default: throw new Error("INVENTORY_EVENT_NOT_SUPPORTED");
  }
}

export const inventoryControlDispatch = webMethod(Permissions.SiteMember, async (type, payload = {}) => {
  try {
    const agent = await requireInventoryAgent();
    const result = await dispatch(clean(type,120), obj(payload), agent);
    return {ok:true,version:VERSION,...result};
  } catch (error) {
    return {ok:false,version:VERSION,type:"INVENTORY_ERROR",payload:{code:errorCode(error),message:safeMessage(error)}};
  }
});
