import { webMethod, Permissions } from "wix-web-module";
import { secrets } from "wix-secrets-backend.v2";
import { elevate } from "wix-auth";
import { fetch } from "wix-fetch";
import { getStaffPortalSession } from "backend/RIA/staffPortalAuth.web";

const TABLES = Object.freeze({
  master: "inventory_master_entities",
  catalog: "inventory_catalog_entries",
  canonical: "inventory_canonical_entities_v",
  searchable: "inventory_searchable_catalog_v",
  localized: "inventory_localized_content",
  media: "inventory_media_assets",
  relations: "inventory_entity_relations",
  dated: "inventory_dated_inventory",
  audit: "master_inventory_audit",
  sourceRegistry: "inventory_source_registry",
  sourceHealth: "inventory_source_health_v",
  airports: "travel_info_airports",
  airlines: "travel_info_airlines"
});

const REFERENCE_TYPES = new Set(["AIRPORT", "AIRLINE"]);
const ENTITY_TYPES = new Set([
  "COUNTRY", "AREA", DESTINATION", "AIRPORT", "AIRLINE", "SUPPLIER", "HOTEL", "GUIDED_TOUR",
  "ACTIVITY", "PARTNER_TICKET", "TRANSFER", "CAR_RENTAL", "PACKAGE", "ANCILLARY"
]);
const MASTER_STATUSES = new Set(["DRAFT", "REVIEW", "PUBLISHED", "HIDDEN", "SUSPENDED", "ARCHIVED"]);
const DATED_STATUSES = new Set(["OPEN", "CLOSED", "STOP_SALE", "BLACKOUT", "SOLD_OUT"]);
const COLLECTION_TYPES = new Set(["NONE", "SKANDI_COLLECTION", "SKANDI_PARTNER"]);
const LANGUAGES = ["EN", "SV", "NO", "DA", "FI"];
const MEDIA_ROLES = new Set(["PRIMARY", "HERO", "CARD", "MOBILE", "GALLERY", "OG", "LOGO", "MAP", "ROOM", "THUMBNAIL"]);
const IMAGE_MIMES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"]);
const INVENTORY_BUCKET = "inventory-media";
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;

const clean = (v, m = 1000) => String(v ?? "").trim().slice(0, m);
const upper = (v, m = 1000) => clean(v, m).toUpperCase();
const object = v => v && typeof v === "object" && !Array.isArray(v) ? v : {};
function bool(v, fallback = false) {
  if ([true, "true", "TRUE", "YES", 1, "1"].includes(v)) return true;
  if ([false, "false", "FALSE", "NO", 0, "0"].includes(v)) return false;
  return fallback;
}
function num(v, fallback = 0) { const n = Number(v); return Number.isFinite(n) ? n : fallback; }
const int = (v, fallback = 0) => Math.trunc(num(v, fallback));
function arr(v) {
  if (Array.isArray(v)) return v;
  if (v == null || v === "") return [];
  return String(v).split(/\n|,/).map(x => x.trim()).filter(Boolean);
}
const slugify = v => clean(v, 240).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 160);
const safeDate = v => /^\d{4}-\d{2}-\d{2}$/.test(clean(v, 20)) ? clean(v, 20) : null;
const safeTime = v => /^\d{2}:\d{2}(:\d{2})?$/.test(clean(v, 12)) ? clean(v, 12) : null;
const eq = (field, value) => `${field}=eq.${encodeURIComponent(String(value))}`;
function makeUuid() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") return globalThis.crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0, v = c === "x" ? r : (r & 3 | 8); return v.toString(16);
  });
}
function listValue(v) {
  if (Array.isArray(v)) return v;
  if (v == null || v === "") return [];
  if (typeof v === "string") { try { const p = JSON.parse(v); return Array.isArray(p) ? p : []; } catch (_) { return []; } }
  return [];
}
function jsonText(v) { return v == null || v === "" ? null : (typeof v === "string" ? v : JSON.stringify(v)); }

const elevatedGetSecretValue = elevate(secrets.getSecretValue);
let configPromise = null;
function secretString(r) { return typeof r === "string" ? r.trim() : String(r?.value ?? r?.secretValue ?? r?.secret?.value ?? "").trim(); }
async function readSecret(name) {
  const response = await elevatedGetSecretValue(name);
  const value = secretString(response);
  if (!value) throw new Error(`WIX_SECRET_EMPTY_${name}`);
  return value;
}
async function cfg() {
  if (configPromise) return configPromise;
  configPromise = (async () => {
    const url = (await readSecret("SUPABASE_URL")).replace(/\/+$/, "");
    let key = "";
    try { key = await readSecret("SUPABASE_SECRET_KEY"); }
    catch (_) { key = await readSecret("SUPABASE_SERVICE_ROLE_KEY"); }
    if (!/^https:\/\/[^/]+\.supabase\.co$/i.test(url)) throw new Error("SUPABASE_URL_INVALID");
    if (!key) throw new Error("SUPABASE_SERVER_KEY_MISSING");
    return { url, key, legacyJwt: key.startsWith("eyJ") };
  })();
  try { return await configPromise; } catch (e) { configPromise = null; throw e; }
}
async function sb(path, { method = "GET", body, headers = {} } = {}) {
  const c = await cfg();
  const response = await fetch(`${c.url}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: c.key,
      ...(c.legacyJwt ? { Authorization: `Bearer ${c.key}` } : {}),
      "Content-Type": "application/json",
      ...(method === "POST" || method === "PATCH" ? { Prefer: "return=representation" } : {}),
      ...headers
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {})
  });
  const raw = await response.text();
  let data = null;
  if (raw) { try { data = JSON.parse(raw); } catch (_) { data = raw; } }
  if (!response.ok) {
    const error = new Error(data?.message || data?.error || `${response.status} ${response.statusText}`);
    error.code = data?.code || "";
    throw error;
  }
  return data;
}
async function createSignedInventoryUpload(path) {
  const c = await cfg();
  const storagePath = `${INVENTORY_BUCKET}/${path}`;
  const response = await fetch(`${c.url}/storage/v1/object/upload/sign/${storagePath}`, {
    method: "POST",
    headers: {
      apikey: c.key,
      ...(c.legacyJwt ? { Authorization: `Bearer ${c.key}` } : {}),
      "Content-Type": "application/json"
    },
    body: "{}"
  });
  const raw = await response.text();
  let data = null;
  if (raw) { try { data = JSON.parse(raw); } catch (_) { data = raw; } }
  if (!response.ok) {
    const error = new Error(data?.message || data?.error || `Storage upload-sign failed (${response.status}).`);
    error.code = data?.statusCode || data?.code || "STORAGE_SIGN_FAILED";
    throw error;
  }
  const relative = data?.url || data?.signedURL || data?.signedUrl || "";
  if (!relative) throw new Error("Supabase Storage did not return a signed upload URL.");
  const signedUrl = /^https?:\/\//i.test(relative)
    ? relative
    : `${c.url}/storage/v1${relative.startsWith("/") ? relative : `/${relative}`}`;
  let token = data?.token || "";
  if (!token) {
    try { token = new URL(signedUrl).searchParams.get("token") || ""; } catch (_) {}
  }
  if (!token) throw new Error("Supabase Storage did not return an upload token.");
  return { signedUrl, token, path };
}

function profileOf(session = {}) {
  const p = session.profile || session.staff || session.user || session.data?.profile || {};
  return {
    skId: upper(p.skId || p.sk_id || p.employeeId || p.employee_id, 40),
    name: clean(p.name || p.fullName || p.title || p.displayName || p.display_name || p.email, 160),
    email: clean(p.email || p.corporateEmailAddress, 200).toLowerCase()
  };
}
async function requireStaff() {
  const session = await getStaffPortalSession();
  if (!session || session.ok === false || session.authorized === false || session.loggedIn === false) {
    throw new Error("Inventory Control requires an authorized staff session.");
  }
  const p = profileOf(session);
  let rows = [];
  if (p.skId) rows = await sb(`agent_users?select=id,sk_id,email,active,authorized,portal_access,can_manage&${eq("sk_id", p.skId)}&limit=1`);
  if ((!rows || !rows.length) && p.email) rows = await sb(`agent_users?select=id,sk_id,email,active,authorized,portal_access,can_manage&${eq("email", p.email)}&limit=1`);
  const actor = rows?.[0];
  if (!actor) throw new Error("Your Wix staff profile is not linked to Supabase agent_users.");
  if (actor.active === false || actor.authorized === false || actor.portal_access === false) throw new Error("Your Supabase staff account is not authorized for Inventory Control.");
  return { id: actor.id, skId: upper(actor.sk_id || p.skId, 40), name: p.name || p.email || p.skId, email: clean(actor.email || p.email, 200).toLowerCase(), canManage: actor.can_manage === true };
}

function apiRecord(r = {}) {
  return {
    id: r.id, publicId: r.public_id, entityType: r.entity_type, code: r.code, name: r.name,
    slug: r.slug || "", status: r.status, active: r.active, customerVisible: r.customer_visible,
    staffVisible: r.staff_visible, alteaVisible: r.altea_visible,
    searchable: bool(r.searchable, false), collectionType: upper(r.collection_type || "NONE", 40),
    partnerTier: r.partner_tier || "", searchPriority: int(r.search_priority, 100), searchKeywords: r.search_keywords || [],
    featured: r.featured, homepageFeatured: r.homepage_featured, sortPriority: r.sort_priority,
    parentEntityId: r.parent_entity_id || "", supplierEntityId: r.supplier_entity_id || "",
    source: r.source || "SKANDI", sourceReference: r.source_reference || "", sourceTable: r.source_table || "",
    details: r.details || {}, commercial: r.commercial || {}, operations: r.operations || {}, seo: r.seo || {},
    publication: r.publication || {}, payload: r.payload || {}, createdAt: r.created_at, updatedAt: r.updated_at
  };
}
function apiLocalized(r = {}) {
  return { id: r.id, entityId: r.entity_id, language: r.language, title: r.title || "", eyebrow: r.eyebrow || "", shortDescription: r.short_description || "", fullDescription: r.full_description || "", highlights: r.highlights || [], included: r.included || [], notIncluded: r.not_included || [], importantInformation: r.important_information || "", seoTitle: r.seo_title || "", seoDescription: r.seo_description || "", content: r.content || {} };
}
function apiMedia(r = {}) {
  return {
    id: r.id, entityId: r.entity_id, mediaType: r.media_type || "IMAGE", url: r.url || "", altText: r.alt_text || "",
    caption: r.caption || "", credit: r.credit || "", language: r.language || "", sortOrder: r.sort_order,
    role: upper(r.role || (r.is_hero ? "HERO" : r.is_card ? "CARD" : r.is_mobile ? "MOBILE" : "GALLERY"), 30),
    isPrimary: r.is_primary, isCard: r.is_card, isHero: r.is_hero, isMobile: r.is_mobile, active: r.active,
    storageBucket: r.storage_bucket || "", storagePath: r.storage_path || "", mimeType: r.mime_type || "",
    fileSizeBytes: r.file_size_bytes || null, width: r.width_px || null, height: r.height_px || null,
    focalX: r.focal_x == null ? null : Number(r.focal_x), focalY: r.focal_y == null ? null : Number(r.focal_y),
    sourceKind: r.source_kind || "URL", payload: r.payload || {}
  };
}
function apiRelation(r = {}) { return { id: r.id, sourceEntityId: r.source_entity_id, targetEntityId: r.target_entity_id, relationType: r.relation_type, sequenceNo: r.sequence_no, active: r.active, payload: r.payload || {} }; }
function apiDated(r = {}) {
  return { id: r.id, entityId: r.entity_id, inventoryType: r.inventory_type, serviceDate: r.service_date, startTime: r.start_time || "", endTime: r.end_time || "", variantCode: r.variant_code || "", variantName: r.variant_name || "", capacityTotal: r.capacity_total, held: r.held, sold: r.sold, available: r.available, waitlistLimit: r.waitlist_limit, overbookingLimit: r.overbooking_limit, stopSale: r.stop_sale, blackout: r.blackout, status: r.status, supplierCost: Number(r.supplier_cost || 0), publicPrice: Number(r.public_price || 0), adultPrice: Number(r.adult_price || 0), childPrice: Number(r.child_price || 0), infantPrice: Number(r.infant_price || 0), privatePrice: Number(r.private_price || 0), currency: r.currency, priceBasis: r.price_basis, bookingCutoffHours: r.booking_cutoff_hours, minStay: r.min_stay, maxStay: r.max_stay, releaseDays: r.release_days, supplierReference: r.supplier_reference || "", payload: r.payload || {}, createdAt: r.created_at, updatedAt: r.updated_at };
}

function canonicalInlineBundle(row = {}) {
  const localized = Array.isArray(row.localized) ? row.localized : listValue(row.localized);
  const media = Array.isArray(row.media) ? row.media : listValue(row.media);
  const relations = Array.isArray(row.relations) ? row.relations : listValue(row.relations);
  return {
    record: apiRecord(row),
    localizedContent: localized.map(x => ({ ...x, language: upper(x.language, 12) })),
    media: media.map(x => ({ ...x, role: x.role || (x.isHero ? "HERO" : x.isCard ? "CARD" : x.isMobile ? "MOBILE" : "GALLERY") })),
    relations
  };
}
async function bundle(id) {
  const rows = await sb(`${TABLES.canonical}?select=*&${eq("id", id)}&limit=1`);
  const row = rows?.[0];
  if (!row) throw new Error("Inventory record not found.");
  if (row.source_table !== TABLES.master) return canonicalInlineBundle(row);
  const [localized, media, relations] = await Promise.all([
    sb(`${TABLES.localized}?select=*&${eq("entity_id", id)}&order=language.asc`),
    sb(`${TABLES.media}?select=*&${eq("entity_id", id)}&order=sort_order.asc`),
    sb(`${TABLES.relations}?select=*&${eq("source_entity_id", id)}&order=sequence_no.asc`)
  ]);
  return { record: apiRecord(row), localizedContent: (localized || []).map(apiLocalized), media: (media || []).map(apiMedia), relations: (relations || []).map(apiRelation) };
}

async function references() {
  const rows = await sb(`${TABLES.canonical}?select=id,public_id,entity_type,code,name,slug,status,active,details,source_table&order=entity_type.asc,name.asc&limit=4000`);
  return (rows || []).map(r => ({ id: r.id, publicId: r.public_id, entityType: r.entity_type, code: r.code, name: r.name, slug: r.slug, status: r.status, active: r.active, details: r.details || {}, sourceTable: r.source_table }));
}

const STRUCT = {
  facts: [["label"], ["value"]], faqs: [["question"], ["answer"]],
  climate: [["month"], ["avg_low_c", "number"], ["avg_high_c", "number"], ["daylight_hours", "number"], ["precipitation_mm", "number"]],
  signature: [["title"], ["description"]],
  rooms: [["code"], ["name"], ["roomType"], ["maxGuests", "number"], ["bedType"], ["sizeSqm", "number"], ["description"]],
  itinerary: [["sequence", "number"], ["stopName"], ["durationMinutes", "number"], ["description"], ["latitude", "number"], ["longitude", "number"]],
  pickups: [["name"], ["hotelId"], ["timeOffsetMinutes", "number"], ["instructions"]],
  zones: [["code"], ["name"], ["durationMinutes", "number"], ["distanceKm", "number"], ["price", "number"], ["currency"]],
  sourceUrls: [["label"], ["url"]], quickFacts: [["label"], ["value"]], hubs: [["iata"], ["name"]], fleet: [["aircraft"], ["count", "number"], ["notes"]]
};
function cleanRows(v, schema) {
  return (Array.isArray(v) ? v : []).slice(0, 300).map(row => {
    const out = {}; for (const [key, type] of schema) out[key] = type === "number" ? num(row?.[key], 0) : clean(row?.[key], 5000); return out;
  }).filter(row => Object.values(row).some(v => v !== "" && v !== null && v !== undefined));
}
function applyStructures(record, structures = {}) {
  const d = { ...object(record.details) }, o = { ...object(record.operations) };
  if (structures.facts) d.facts = cleanRows(structures.facts, STRUCT.facts);
  if (structures.quickFacts) { const x = cleanRows(structures.quickFacts, STRUCT.quickFacts); d.pageFacts = x; d.quickFactsJson = x; }
  if (structures.faqs) d.faqs = cleanRows(structures.faqs, STRUCT.faqs);
  if (structures.climate) d.climate = cleanRows(structures.climate, STRUCT.climate);
  if (structures.signature) d.signature = cleanRows(structures.signature, STRUCT.signature);
  if (structures.rooms) d.rooms = cleanRows(structures.rooms, STRUCT.rooms);
  if (structures.sourceUrls) d.sourceUrlsJson = cleanRows(structures.sourceUrls, STRUCT.sourceUrls);
  if (structures.hubs) d.hubsJson = cleanRows(structures.hubs, STRUCT.hubs);
  if (structures.fleet) d.fleetSummaryJson = cleanRows(structures.fleet, STRUCT.fleet);
  if (structures.itinerary) o.itinerary = cleanRows(structures.itinerary, STRUCT.itinerary);
  if (structures.pickups) o.pickups = cleanRows(structures.pickups, STRUCT.pickups);
  if (structures.zones) o.transferZones = cleanRows(structures.zones, STRUCT.zones);
  for (const key of ["goodFor", "tags", "facilities", "languages", "boardOptions", "aircraftFamilies"]) if (structures[key]) d[key] = arr(structures[key]).slice(0, 300);
  return { ...record, details: d, operations: o };
}
async function airportIata(id) {
  if (!id) return "";
  const rows = await sb(`${TABLES.airports}?select=ID,iata&${eq("ID", id)}&limit=1`);
  return upper(rows?.[0]?.iata, 12);
}
async function lookupMaster(id) {
  if (!id) return null;
  const rows = await sb(`${TABLES.master}?select=*&${eq("id", id)}&limit=1`); return rows?.[0] || null;
}
function localizedSeoHints(input = {}, record = {}) {
  const list = Array.isArray(input.localizedContent) ? input.localizedContent : [];
  const en = list.find(x => upper(x.language, 12) === "EN") || list[0] || {};
  const title = clean(en.title || record.name, 240);
  const description = clean(en.seoDescription || en.shortDescription || en.fullDescription || record.details?.summary || record.details?.description, 5000);
  return { title, description };
}
function mediaSeoImage(input = {}) {
  const media = Array.isArray(input.media) ? input.media : [];
  const pick = media.find(x => upper(x.role, 30) === "OG") || media.find(x => x.isHero || upper(x.role, 30) === "HERO") || media.find(x => x.isCard || upper(x.role, 30) === "CARD") || media[0];
  return clean(pick?.url, 2000);
}
async function smartDefaults(record, input = {}) {
  const x = JSON.parse(JSON.stringify(record || {}));
  x.entityType = upper(x.entityType, 40);
  x.details = object(x.details); x.commercial = object(x.commercial); x.operations = object(x.operations); x.seo = object(x.seo); x.publication = object(x.publication); x.payload = object(x.payload);
  x.code = upper(x.code, 80); x.name = clean(x.name, 240); x.slug = slugify(x.slug || x.name); x.source = clean(x.source || "SKANDI", 80) || "SKANDI";
  // Search merchandising is intentionally separate from master/reference data.
  x.collectionType = "NONE"; x.partnerTier = ""; x.searchPriority = 100; x.searchKeywords = []; x.searchable = false;
  if (!x.code) throw new Error("System Code is required."); if (!x.name) throw new Error("Master Name / Title is required."); if (!ENTITY_TYPES.has(x.entityType)) throw new Error("Unsupported inventory entity type.");
  if (x.entityType === "DESTINATION") {
    x.details.level = upper(x.details.level || "DESTINATION", 20);
    const parent = await lookupMaster(x.parentEntityId);
    if (parent?.entity_type === "DESTINATION") {
      const pd = object(parent.details);
      for (const key of ["countryCode", "countryName", "currency", "languages", "drivingSide", "electricalPlug", "emergencyNumber", "passportSummary", "visaSummary", "timezone"]) {
        if (x.details[key] === undefined || x.details[key] === null || x.details[key] === "" || (Array.isArray(x.details[key]) && !x.details[key].length)) {
          if (pd[key] !== undefined && pd[key] !== null && pd[key] !== "") x.details[key] = pd[key];
        }
      }
    }
    if (!x.details.searchAirportIata && x.details.nearestAirportId) x.details.searchAirportIata = await airportIata(x.details.nearestAirportId);
  }
  if (x.entityType === "HOTEL") {
    if (!x.details.searchAirportIata && x.details.nearestAirportId) x.details.searchAirportIata = await airportIata(x.details.nearestAirportId);
  }
  if (x.entityType === "PACKAGE") {
    const a = safeDate(x.details.startDate), b = safeDate(x.details.endDate);
    if (a && b) { const days = Math.max(1, Math.round((new Date(`${b}T12:00:00Z`) - new Date(`${a}T12:00:00Z`)) / 86400000) + 1); x.details.numberOfDays = days; x.details.numberOfNights = Math.max(0, days - 1); }
  }
  x.status = MASTER_STATUSES.has(upper(x.status, 20)) ? upper(x.status, 20) : "DRAFT";
  x.commercial.currency = upper(x.commercial.currency || "USD", 3); x.commercial.supplierCost = Math.max(0, num(x.commercial.supplierCost, 0)); x.commercial.publicPrice = Math.max(0, num(x.commercial.publicPrice, 0)); x.commercial.marginPct = x.commercial.publicPrice > 0 ? Math.round(((x.commercial.publicPrice - x.commercial.supplierCost) / x.commercial.publicPrice) * 10000) / 100 : 0;
  if (x.entityType === "SUPPLIER") { x.customerVisible = false; x.featured = false; x.homepageFeatured = false; x.seo.indexable = false; }
  if (x.status === "PUBLISHED") x.active = true;
  if (["ARCHIVED", "SUSPENDED"].includes(x.status)) { x.active = false; x.customerVisible = false; }
  if (x.status !== "PUBLISHED") x.homepageFeatured = false;
  if (x.homepageFeatured) { x.featured = true; x.customerVisible = true; }
  const hints = localizedSeoHints(input, x), title = hints.title || x.name;
  x.seo.canonicalSlug = x.seo.canonicalSlug || x.slug;
  x.seo.title = clean(x.seo.title || `${title} | SKANDI Travels`, 70);
  x.seo.description = clean(x.seo.description || hints.description || (x.entityType === "DESTINATION" ? `Explore ${title} with SKANDI Travels.` : `Discover ${title} with SKANDI Travels.`), 160);
  x.seo.ogTitle = clean(x.seo.ogTitle || x.seo.title, 100);
  x.seo.ogDescription = clean(x.seo.ogDescription || x.seo.description, 200);
  x.seo.ogImage = clean(x.seo.ogImage || mediaSeoImage(input), 2000);
  if (x.seo.indexable === undefined) x.seo.indexable = true;
  x.payload.smartInventoryVersion = "2026-09-08-v7"; x.payload.canonicalSource = REFERENCE_TYPES.has(x.entityType) ? (x.entityType === "AIRPORT" ? TABLES.airports : TABLES.airlines) : TABLES.master;
  return x;
}
function dbMaster(r, actor, old = null) {
  const publication = { ...object(r.publication) };
  if (r.status === "PUBLISHED" && (!old || old.status !== "PUBLISHED")) { publication.publishedAt = new Date().toISOString(); publication.publishedBy = actor.id || actor.skId; }
  return {
    ...(r.publicId ? { public_id: clean(r.publicId, 160) } : {}), entity_type: r.entityType, code: r.code, name: r.name, slug: r.slug || null,
    status: r.status, active: r.active !== false, customer_visible: bool(r.customerVisible, false), staff_visible: bool(r.staffVisible, true), altea_visible: bool(r.alteaVisible, true),
    searchable: false, collection_type: "NONE", partner_tier: null, search_priority: 100, search_keywords: [],
    featured: bool(r.featured, false), homepage_featured: bool(r.homepageFeatured, false), sort_priority: int(r.sortPriority, 100), parent_entity_id: r.parentEntityId || null, supplier_entity_id: r.supplierEntityId || null,
    source: r.source || "SKANDI", source_reference: clean(r.sourceReference, 500) || null, details: object(r.details), commercial: object(r.commercial), operations: object(r.operations), seo: object(r.seo), publication,
    payload: { ...object(r.payload), smartInventoryVersion: "2026-09-08-v7", canonicalSource: TABLES.master }, updated_by_agent_user_id: actor.id || null, ...(old ? {} : { created_by_agent_user_id: actor.id || null })
  };
}

function referenceStatus(r = {}) { const s = upper(r.status, 20); if (MASTER_STATUSES.has(s)) return s; if (r.published === true) return "PUBLISHED"; if (r.active === false) return "HIDDEN"; return "DRAFT"; }
function referenceDefaults(record, input = {}) {
  const r = JSON.parse(JSON.stringify(record || {})); r.entityType = upper(r.entityType, 40); r.details = object(r.details); r.commercial = object(r.commercial); r.operations = object(r.operations); r.seo = object(r.seo); r.publication = object(r.publication); r.payload = object(r.payload);
  r.name = clean(r.name, 240); r.slug = slugify(r.slug || r.name); r.status = MASTER_STATUSES.has(upper(r.status, 20)) ? upper(r.status, 20) : "DRAFT"; r.source = clean(r.source || "SKANDI", 80) || "SKANDI";
  r.searchable = false; r.collectionType = "NONE"; r.partnerTier = ""; r.searchPriority = 100; r.searchKeywords = [];
  if (!r.name) throw new Error("Master Name / Title is required.");
  if (r.entityType === "AIRPORT") { r.details.iata = upper(r.details.iata || r.code, 12); r.details.icao = upper(r.details.icao, 12); r.code = r.details.iata; r.searchable = false; r.collectionType = "NONE"; if (!r.details.iata) throw new Error("IATA Code is required."); }
  else if (r.entityType === "AIRLINE") { r.details.iata = upper(r.details.iata || r.code, 20); r.details.icao = upper(r.details.icao, 20); r.code = r.details.iata; if (!r.details.iata) throw new Error("Airline IATA Code is required."); }
  else throw new Error("Unsupported reference entity type.");
  if (r.status === "PUBLISHED") r.active = true; if (["ARCHIVED", "SUSPENDED"].includes(r.status)) { r.active = false; r.customerVisible = false; }
  const hints = localizedSeoHints(input, r), title = hints.title || r.name;
  r.seo.canonicalSlug = r.seo.canonicalSlug || r.slug; r.seo.title = clean(r.seo.title || `${title} | SKANDI Travels`, 70); r.seo.description = clean(r.seo.description || hints.description || `Travel information for ${title} from SKANDI Travels.`, 160); r.seo.ogTitle = clean(r.seo.ogTitle || r.seo.title, 100); r.seo.ogDescription = clean(r.seo.ogDescription || r.seo.description, 200); r.seo.ogImage = clean(r.seo.ogImage || mediaSeoImage(input), 2000); if (r.seo.indexable === undefined) r.seo.indexable = true;
  return r;
}
function inlineReferencePayload(record, input = {}) {
  const media = (Array.isArray(input.media) ? input.media : []).map((x, i) => ({ ...x, role: upper(x.role || (x.isHero ? "HERO" : x.isCard ? "CARD" : x.isMobile ? "MOBILE" : "GALLERY"), 30), sortOrder: int(x.sortOrder, (i + 1) * 10), active: x.active !== false }));
  return { payload: { ...object(record.payload), inventoryRelations: Array.isArray(input.relations) ? input.relations : [], smartInventoryVersion: "2026-09-08-v7" }, localized_content: Array.isArray(input.localizedContent) ? input.localizedContent : [], media_assets: media };
}
function dbAirport(r, input = {}) {
  const d = object(r.details), extra = inlineReferencePayload(r, input);
  return {
    title: r.name, slug: r.slug || null, active: r.active !== false, sort_order: int(r.sortPriority, 100), iata: upper(d.iata || r.code, 12) || null, icao: upper(d.icao, 12) || null,
    country: clean(d.country, 160) || null, locationCity: clean(d.city, 240) || null, distanceToCityCenterKm: num(d.distanceToCityCenterKm, 0), website: clean(d.website, 2000) || null,
    summary: clean(d.overview || d.summary, 10000) || null, latitude: num(d.latitude, 0), longitude: num(d.longitude, 0), information: clean(d.information, 20000) || null,
    quickFactsJson: Array.isArray(d.quickFactsJson) ? d.quickFactsJson : [], transportJson: Array.isArray(d.transportJson) ? d.transportJson : [], runwaysJson: Array.isArray(d.runwaysJson) ? d.runwaysJson : [], terminalsJson: Array.isArray(d.terminalsJson) ? d.terminalsJson : [],
    logoUrl: clean(d.logoUrl, 2000) || null, logoIconUrl: clean(d.logoIconUrl, 2000) || null, logoAltText: clean(d.logoAltText, 1000) || null, heroImageUrl: clean(d.heroImageUrl, 2000) || null,
    sourceUrlsJson: Array.isArray(d.sourceUrlsJson) ? d.sourceUrlsJson : [], lounges: clean(d.lounges, 20000) || null, foodDrinksJson: Array.isArray(d.foodDrinksJson) ? d.foodDrinksJson : [], airportHotels: clean(d.airportHotels, 10000) || null,
    lostFoundJson: Array.isArray(d.lostFoundJson) ? d.lostFoundJson : [], destinationsServing: clean(d.destinationsServing, 10000) || null, contactUrl: clean(d.contactUrl, 2000) || null, sectionsJson: Array.isArray(d.sectionsJson) ? d.sectionsJson : [], lastReviewed: d.lastReviewed || null,
    primaryColor: clean(d.primaryColor, 40) || null, accentColor: clean(d.accentColor, 40) || null, notes: clean(d.notes, 20000) || null,
    status: r.status, customer_visible: bool(r.customerVisible, false), staff_visible: bool(r.staffVisible, true), altea_visible: bool(r.alteaVisible, true), featured: bool(r.featured, false), homepage_featured: bool(r.homepageFeatured, false), published: r.status === "PUBLISHED",
    source: r.source || "SKANDI", source_reference: clean(r.sourceReference, 500) || null, timezone: clean(d.timezone, 120) || null, inventory_details: d, commercial: object(r.commercial), operations: object(r.operations), seo: object(r.seo), publication: object(r.publication), ...extra,
    ...(r.publicId ? { itemId: clean(r.publicId, 160) } : {})
  };
}
function dbAirline(r, input = {}, old = null) {
  const d = object(r.details), extra = inlineReferencePayload(r, input), id = clean(r.id || old?.ID, 120) || makeUuid();
  return {
    ID: id, Title: r.name, "Record ID": clean(r.publicId || old?.["Record ID"] || r.slug, 160) || null, slug: r.slug || null,
    shortName: clean(d.shortName, 240) || null, alliance: clean(d.alliance, 120) || null, brandGroup: clean(d.brandGroup, 160) || null, locationCountry: clean(d.country, 160) || null, locationCity: clean(d.city, 160) || null,
    website: clean(d.website, 2000) || null, quickFactsJson: d.quickFactsJson ?? [], primaryColor: clean(d.primaryColor, 40) || null, accentColor: clean(d.accentColor, 40) || null, notes: clean(d.notes, 20000) || null,
    cabinsJson: jsonText(d.cabinsJson), logoFile: clean(d.logoUrl, 2000) || null, logoIcon: clean(d.logoIconUrl, 2000) || null, logoAltText: clean(d.logoAltText, 1000) || null, heroAircraftUrl: clean(d.heroImageUrl, 2000) || null,
    sourceUrlsJson: jsonText(d.sourceUrlsJson), checkInDeadline: clean(d.checkInDeadline, 10000) || null, lounges: clean(d.lounges, 20000) || null, classComparisonText: clean(d.classComparisonText, 20000) || null,
    loyaltyProgram: clean(d.loyaltyProgram, 1000) || null, loyaltyProgramUrl: clean(d.loyaltyProgramUrl, 2000) || null, hubsJson: d.hubsJson ?? [], fleetSummaryJson: jsonText(d.fleetSummaryJson), aircraftFamiliesText: clean(d.aircraftFamiliesText, 20000) || null,
    aircraftConfigurationsJson: jsonText(d.aircraftConfigurationsJson), boarding: clean(d.boarding, 20000) || null, foodDrinksJson: jsonText(d.foodDrinksJson), wifiOnboardJson: jsonText(d.wifiOnboardJson), delayCancellationJson: jsonText(d.delayCancellationJson),
    damagedBaggageJson: jsonText(d.damagedBaggageJson), lostFoundJson: jsonText(d.lostFoundJson), childrenInfantsJson: jsonText(d.childrenInfantsJson), ticketTypesJson: jsonText(d.ticketTypesJson), baggageAllowence: clean(d.baggageAllowance, 20000) || null,
    contactUrl: clean(d.contactUrl, 2000) || null, sectionsJson: jsonText(d.sectionsJson), lastReviewed: d.lastReviewed || null, active: r.active !== false, iataCode: upper(d.iata || r.code, 20) || null, icaoCode: upper(d.icao, 20) || null,
    sort_order: int(r.sortPriority, 100), status: r.status, customer_visible: bool(r.customerVisible, false), staff_visible: bool(r.staffVisible, true), altea_visible: bool(r.alteaVisible, true),
    searchable: false, collection_type: "NONE", partner_tier: null, search_priority: 100, search_keywords: [],
    featured: bool(r.featured, false), homepage_featured: bool(r.homepageFeatured, false), published: r.status === "PUBLISHED", source: r.source || "SKANDI", source_reference: clean(r.sourceReference, 500) || null,
    inventory_details: d, commercial: object(r.commercial), operations: object(r.operations), seo: object(r.seo), publication: object(r.publication), ...extra
  };
}
async function saveReferenceRecord(actor, input = {}) {
  let r = applyStructures(object(input.record), input.structures); r = referenceDefaults(r, input);
  const id = clean(r.id, 120); let old = null;
  if (id) {
    const table = r.entityType === "AIRPORT" ? TABLES.airports : TABLES.airlines;
    const rows = await sb(`${table}?select=*&${eq("ID", id)}&limit=1`); old = rows?.[0] || null;
    if (!old) throw new Error(`${r.entityType} record no longer exists.`);
  }
  const table = r.entityType === "AIRPORT" ? TABLES.airports : TABLES.airlines;
  const body = r.entityType === "AIRPORT" ? dbAirport(r, input) : dbAirline(r, input, old);
  const savedRows = old ? await sb(`${table}?${eq("ID", old.ID)}`, { method: "PATCH", body }) : await sb(table, { method: "POST", body });
  const saved = savedRows?.[0]; if (!saved) throw new Error("Supabase did not return the saved reference record.");
  await audit(actor, old ? "REFERENCE_UPDATED" : "REFERENCE_CREATED", saved.ID, `${r.entityType} ${r.code} ${old ? "updated" : "created"}.`, { sourceTable: table, code: r.code, status: r.status });
  return { record: apiRecord((await sb(`${TABLES.canonical}?select=*&${eq("id", saved.ID)}&limit=1`))?.[0] || {}), bundle: await bundle(saved.ID) };
}

async function replaceLocalized(id, rows = [], record = {}) {
  await sb(`${TABLES.localized}?${eq("entity_id", id)}`, { method: "DELETE", headers: { Prefer: "return=minimal" } });
  const body = (Array.isArray(rows) ? rows : []).filter(x => LANGUAGES.includes(upper(x.language, 12))).map(x => {
    const language = upper(x.language, 12), title = clean(x.title || record.name, 500), short = clean(x.shortDescription, 10000), full = clean(x.fullDescription, 50000);
    return { entity_id: id, language, title: title || null, eyebrow: clean(x.eyebrow, 500) || null, short_description: short || null, full_description: full || null, highlights: Array.isArray(x.highlights) ? x.highlights : [], included: Array.isArray(x.included) ? x.included : [], not_included: Array.isArray(x.notIncluded) ? x.notIncluded : [], important_information: clean(x.importantInformation, 20000) || null, seo_title: clean(x.seoTitle || (title ? `${title} | SKANDI Travels` : ""), 70) || null, seo_description: clean(x.seoDescription || short || full, 160) || null, content: object(x.content) };
  });
  if (body.length) await sb(TABLES.localized, { method: "POST", body });
}
async function replaceMedia(id, rows = [], record = {}) {
  await sb(`${TABLES.media}?${eq("entity_id", id)}`, { method: "DELETE", headers: { Prefer: "return=minimal" } });
  const body = (Array.isArray(rows) ? rows : []).filter(x => clean(x.url, 2000)).map((x, i) => {
    const role = MEDIA_ROLES.has(upper(x.role, 30)) ? upper(x.role, 30) : (x.isHero ? "HERO" : x.isCard ? "CARD" : x.isMobile ? "MOBILE" : "GALLERY");
    const alt = clean(x.altText || `${record.name || "SKANDI"}${role === "GALLERY" ? "" : ` – ${role.toLowerCase()} image`}`, 1000);
    return { entity_id: id, media_type: upper(x.mediaType || "IMAGE", 30), url: clean(x.url, 2000), alt_text: alt || null, caption: clean(x.caption, 3000) || null, credit: clean(x.credit, 1000) || null, language: upper(x.language, 12) || null, sort_order: int(x.sortOrder, (i + 1) * 10), role,
      is_primary: role === "PRIMARY" || bool(x.isPrimary, false), is_hero: role === "HERO", is_card: role === "CARD", is_mobile: role === "MOBILE", active: x.active !== false,
      storage_bucket: clean(x.storageBucket, 100) || null, storage_path: clean(x.storagePath, 1000) || null, mime_type: clean(x.mimeType, 100) || null, file_size_bytes: x.fileSizeBytes == null ? null : Math.max(0, int(x.fileSizeBytes, 0)), width_px: x.width == null ? null : Math.max(0, int(x.width, 0)), height_px: x.height == null ? null : Math.max(0, int(x.height, 0)), focal_x: x.focalX == null ? null : Math.max(0, Math.min(100, num(x.focalX, 50))), focal_y: x.focalY == null ? null : Math.max(0, Math.min(100, num(x.focalY, 50))), source_kind: upper(x.sourceKind || (x.storagePath ? "UPLOAD" : "URL"), 20), payload: object(x.payload) };
  });
  if (body.length) await sb(TABLES.media, { method: "POST", body });
}
async function replaceRelations(id, rows = []) {
  await sb(`${TABLES.relations}?${eq("source_entity_id", id)}`, { method: "DELETE", headers: { Prefer: "return=minimal" } });
  const body = [];
  for (const [i, x] of (Array.isArray(rows) ? rows : []).entries()) {
    const target = clean(x.targetEntityId, 120); if (!target || target === id || !x.relationType) continue;
    const check = await sb(`${TABLES.master}?select=id&${eq("id", target)}&limit=1`).catch(() => []);
    if (!check?.[0]) continue; // Airport/airline links belong in typed reference fields, never fake FK relations.
    body.push({ source_entity_id: id, target_entity_id: target, relation_type: upper(x.relationType, 80), sequence_no: int(x.sequenceNo, (i + 1) * 10), active: bool(x.active, true), payload: object(x.payload) });
  }
  if (body.length) await sb(TABLES.relations, { method: "POST", body });
}
async function audit(actor, eventType, entityId, message, payload = {}) {
  try { await sb(TABLES.audit, { method: "POST", body: { event_type: eventType, domain: "MASTER_INVENTORY", entity_table: payload.sourceTable || TABLES.master, entity_id: entityId || null, product_key: payload.publicId || payload.code || entityId || null, source: "wix-smart-inventory-v4", message, payload, created_by_agent_user_id: actor.id || null, created_by_name: actor.name || actor.skId } }); } catch (_) {}
}

function dbDated(r, actor) {
  const total = Math.max(0, int(r.capacityTotal, 0)), held = Math.max(0, int(r.held, 0)), sold = Math.max(0, int(r.sold, 0)), overbooking = Math.max(0, int(r.overbookingLimit, 0));
  const available = Math.max(0, total + overbooking - held - sold); let status = DATED_STATUSES.has(upper(r.status, 20)) ? upper(r.status, 20) : "OPEN";
  if (bool(r.blackout, false)) status = "BLACKOUT"; else if (bool(r.stopSale, false)) status = "STOP_SALE"; else if (total > 0 && available === 0) status = "SOLD_OUT"; else if (["BLACKOUT", "STOP_SALE", "SOLD_OUT"].includes(status)) status = "OPEN";
  const adult = Math.max(0, num(r.adultPrice, 0)), publicPrice = Math.max(0, num(r.publicPrice, adult));
  return { entity_id: clean(r.entityId, 100), inventory_type: upper(r.inventoryType || "GENERAL", 50), service_date: safeDate(r.serviceDate), start_time: safeTime(r.startTime), end_time: safeTime(r.endTime), variant_code: upper(r.variantCode, 80) || null, variant_name: clean(r.variantName, 240) || null, capacity_total: total, held, sold, available, waitlist_limit: Math.max(0, int(r.waitlistLimit, 0)), overbooking_limit: overbooking, stop_sale: bool(r.stopSale, false), blackout: bool(r.blackout, false), status, supplier_cost: Math.max(0, num(r.supplierCost, 0)), public_price: publicPrice, adult_price: adult, child_price: Math.max(0, num(r.childPrice, 0)), infant_price: Math.max(0, num(r.infantPrice, 0)), private_price: Math.max(0, num(r.privatePrice, 0)), currency: upper(r.currency || "USD", 3), price_basis: upper(r.priceBasis || "PER_PERSON", 40), booking_cutoff_hours: Math.max(0, int(r.bookingCutoffHours, 0)), min_stay: Math.max(0, int(r.minStay, 0)), max_stay: Math.max(0, int(r.maxStay, 0)), release_days: Math.max(0, int(r.releaseDays, 0)), supplier_reference: clean(r.supplierReference, 500) || null, payload: { ...object(r.payload), calculatedAvailable: available, smartInventoryVersion: "2026-09-08-v7" }, updated_by_agent_user_id: actor.id || null, ...(r.id ? {} : { created_by_agent_user_id: actor.id || null }) };
}


function apiCatalog(r = {}, ref = null) {
  return {
    id: r.id || "",
    targetEntityId: r.target_entity_id || "",
    targetRecordType: upper(r.target_record_type || ref?.entityType || "", 40),
    targetRecordId: clean(r.target_record_id || ref?.id || "", 120),
    targetCode: upper(r.target_code || ref?.code || "", 80),
    targetName: clean(ref?.name || "", 240),
    targetSlug: clean(ref?.slug || "", 180),
    catalogType: upper(r.catalog_type || "SKANDI_COLLECTION", 40),
    partnerTier: clean(r.partner_tier, 80),
    searchable: r.searchable === true,
    featured: r.featured === true,
    homepageFeatured: r.homepage_featured === true,
    searchPriority: int(r.search_priority, 100),
    searchKeywords: r.search_keywords || [],
    marketCodes: r.market_codes || [],
    salesChannels: r.sales_channels || ["WEB"],
    publicLabel: clean(r.public_label, 160),
    badge: clean(r.badge, 120),
    validFrom: r.valid_from || "",
    validTo: r.valid_to || "",
    notes: clean(r.notes, 5000),
    active: r.active !== false,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    eligibleNow: Boolean(ref && ref.status === "PUBLISHED" && ref.active !== false && ref.customerVisible === true && !["AIRPORT","SUPPLIER"].includes(ref.entityType))
  };
}
async function catalogRows() {
  const [rows, refs] = await Promise.all([
    sb(`${TABLES.catalog}?select=*&order=search_priority.asc,created_at.asc&limit=4000`).catch(() => []),
    references()
  ]);
  const byId = new Map(refs.map(x => [String(x.id), x]));
  return (rows || []).map(r => {
    const key = String(r.target_entity_id || r.target_record_id || "");
    const ref = byId.get(key) || refs.find(x => r.target_record_type && x.entityType === r.target_record_type && (String(x.id) === String(r.target_record_id) || upper(x.code,80) === upper(r.target_code,80))) || null;
    return apiCatalog(r, ref);
  });
}
async function resolveCatalogTarget(input = {}) {
  const id = clean(input.targetEntityId || input.targetRecordId || input.targetId, 120);
  if (!id) throw new Error("Select a master/reference record for the catalog entry.");
  const refs = await references();
  const ref = refs.find(x => String(x.id) === id);
  if (!ref) throw new Error("The selected catalog target no longer exists.");
  if (["AIRPORT","SUPPLIER"].includes(ref.entityType)) throw new Error(`${ref.entityType} records cannot be customer-search catalog entries.`);
  return ref;
}

export const getSmartInventoryBootstrap = webMethod(Permissions.SiteMember, async (input = {}) => {
  const actor = await requireStaff();
  const filters = ["select=*"]; const type = upper(input.entityType, 40);
  if (type && ENTITY_TYPES.has(type)) filters.push(eq("entity_type", type));
  if (input.status && MASTER_STATUSES.has(upper(input.status, 20))) filters.push(eq("status", upper(input.status, 20)));
  if (input.customerVisible === true || input.customerVisible === "true") filters.push("customer_visible=eq.true");
  if (input.customerVisible === false || input.customerVisible === "false") filters.push("customer_visible=eq.false");
  filters.push("order=sort_priority.asc,name.asc", "limit=3000");
  let rows = await sb(`${TABLES.canonical}?${filters.join("&")}`);
  const search = clean(input.query, 200).toLowerCase();
  if (search) rows = (rows || []).filter(r => [r.public_id, r.entity_type, r.code, r.name, r.slug, ...(r.search_keywords || [])].join(" ").toLowerCase().includes(search));
  const [refs, registry, health, catalog] = await Promise.all([references(), sb(`${TABLES.sourceRegistry}?select=*&active=eq.true&order=category.asc`).catch(() => []), sb(`${TABLES.sourceHealth}?select=*&order=category.asc`).catch(() => []), catalogRows()]);
  return { session: actor, records: (rows || []).map(apiRecord), references: refs, catalog, sourceRegistry: registry || [], sourceHealth: health || [], lastSync: new Date().toISOString(), canonicalSource: TABLES.canonical, catalogSource: TABLES.catalog };
});


export const listInventoryCatalogEntries = webMethod(Permissions.SiteMember, async () => {
  await requireStaff();
  return { entries: await catalogRows(), generatedAt: new Date().toISOString() };
});

export const saveInventoryCatalogEntry = webMethod(Permissions.SiteMember, async ({ entry = {} } = {}) => {
  const actor = await requireStaff();
  const ref = await resolveCatalogTarget(entry);
  const catalogType = upper(entry.catalogType || "SKANDI_COLLECTION", 40);
  if (!new Set(["SKANDI_COLLECTION","SKANDI_PARTNER"]).has(catalogType)) throw new Error("Catalog Type must be SKANDI Collection or SKANDI Partner.");
  const eligible = ref.status === "PUBLISHED" && ref.active !== false && ref.customerVisible === true;
  const searchable = eligible && bool(entry.searchable, false);
  const body = {
    target_entity_id: ref.sourceTable === TABLES.master ? ref.id : null,
    target_record_type: ref.entityType,
    target_record_id: String(ref.id),
    target_code: ref.code || null,
    catalog_type: catalogType,
    partner_tier: clean(entry.partnerTier,80) || null,
    searchable,
    featured: bool(entry.featured,false),
    homepage_featured: bool(entry.homepageFeatured,false),
    search_priority: Math.max(0,int(entry.searchPriority,100)),
    search_keywords: arr(entry.searchKeywords).slice(0,100),
    market_codes: arr(entry.marketCodes).map(x=>upper(x,20)).slice(0,100),
    sales_channels: arr(entry.salesChannels).map(x=>upper(x,40)).slice(0,40).length ? arr(entry.salesChannels).map(x=>upper(x,40)).slice(0,40) : ["WEB"],
    public_label: clean(entry.publicLabel,160) || null,
    badge: clean(entry.badge,120) || null,
    valid_from: safeDate(entry.validFrom),
    valid_to: safeDate(entry.validTo),
    notes: clean(entry.notes,5000) || null,
    active: entry.active !== false,
    updated_by_agent_user_id: actor.id || null,
    ...(entry.id ? {} : { created_by_agent_user_id: actor.id || null })
  };
  let saved;
  if (entry.id) {
    saved = (await sb(`${TABLES.catalog}?${eq("id",clean(entry.id,120))}`, { method:"PATCH", body }))?.[0];
  } else {
    saved = (await sb(TABLES.catalog, { method:"POST", body }))?.[0];
  }
  if (!saved?.id) throw new Error("Supabase did not return the saved catalog entry.");
  await audit(actor, entry.id ? "CATALOG_UPDATED" : "CATALOG_CREATED", String(ref.id), `${ref.entityType} ${ref.code} catalog entry ${entry.id ? "updated" : "created"}.`, { sourceTable: TABLES.catalog, catalogType, searchable });
  const entries = await catalogRows();
  return { entry: entries.find(x=>x.id===saved.id) || apiCatalog(saved,ref), entries };
});

export const deleteInventoryCatalogEntry = webMethod(Permissions.SiteMember, async ({ id } = {}) => {
  const actor = await requireStaff();
  const key = clean(id,120); if (!key) throw new Error("Catalog entry ID is required.");
  await sb(`${TABLES.catalog}?${eq("id",key)}`, { method:"DELETE", headers:{Prefer:"return=minimal"} });
  await audit(actor,"CATALOG_DELETED",key,"Collection/Partner catalog entry deleted.",{sourceTable:TABLES.catalog});
  return { ok:true, id:key, entries:await catalogRows() };
});

export const getSmartInventoryRecord = webMethod(Permissions.SiteMember, async ({ id } = {}) => { await requireStaff(); return bundle(clean(id, 120)); });

export const saveSmartInventoryRecord = webMethod(Permissions.SiteMember, async (input = {}) => {
  const actor = await requireStaff(); const entityType = upper(input?.record?.entityType, 40);
  if (REFERENCE_TYPES.has(entityType)) return saveReferenceRecord(actor, input);
  let r = applyStructures(object(input.record), input.structures); r = await smartDefaults(r, input);
  const id = clean(r.id, 100); let old = null;
  if (id) { const rows = await sb(`${TABLES.master}?select=*&${eq("id", id)}&limit=1`); old = rows?.[0] || null; if (!old) throw new Error("Inventory master record no longer exists."); }
  const body = dbMaster(r, actor, old); const savedRows = old ? await sb(`${TABLES.master}?${eq("id", old.id)}`, { method: "PATCH", body }) : await sb(TABLES.master, { method: "POST", body });
  const saved = savedRows?.[0]; if (!saved?.id) throw new Error("Supabase did not return the saved master record.");
  await replaceLocalized(saved.id, input.localizedContent || [], r); await replaceMedia(saved.id, input.media || [], r); await replaceRelations(saved.id, input.relations || []);
  // If OG image was not explicitly set, inherit from the canonical media role after media save.
  if (!clean(saved.seo?.ogImage, 2000)) {
    const mediaRows = await sb(`${TABLES.media}?select=url,role,is_hero,is_card,sort_order&${eq("entity_id", saved.id)}&active=eq.true&order=sort_order.asc`);
    const image = mediaRows?.find(x => x.role === "OG")?.url || mediaRows?.find(x => x.role === "HERO" || x.is_hero)?.url || mediaRows?.find(x => x.role === "CARD" || x.is_card)?.url || mediaRows?.[0]?.url || "";
    if (image) await sb(`${TABLES.master}?${eq("id", saved.id)}`, { method: "PATCH", body: { seo: { ...object(saved.seo), ogImage: image } } });
  }
  await audit(actor, old ? "MASTER_UPDATED" : "MASTER_CREATED", saved.id, `${saved.entity_type} ${saved.code} ${old ? "updated" : "created"}.`, { publicId: saved.public_id, code: saved.code, status: saved.status });
  return { record: apiRecord(saved), bundle: await bundle(saved.id) };
});

export const getSmartDatedInventory = webMethod(Permissions.SiteMember, async ({ entityId } = {}) => {
  await requireStaff(); const id = clean(entityId, 100); const rows = await sb(`${TABLES.dated}?select=*&${eq("entity_id", id)}&order=service_date.asc,start_time.asc,variant_code.asc&limit=3000`); return { inventory: (rows || []).map(apiDated), lastSync: new Date().toISOString() };
});
export const saveSmartDatedInventory = webMethod(Permissions.SiteMember, async ({ row } = {}) => {
  const actor = await requireStaff(); if (!row?.entityId) throw new Error("Master inventory entity is required."); if (!safeDate(row.serviceDate)) throw new Error("Service Date is required.");
  const body = dbDated(row, actor), savedRows = row.id ? await sb(`${TABLES.dated}?${eq("id", row.id)}`, { method: "PATCH", body }) : await sb(TABLES.dated, { method: "POST", body }); const saved = savedRows?.[0];
  await audit(actor, "DATED_INVENTORY_SAVED", row.entityId, `Dated inventory saved for ${row.serviceDate}.`, { entityId: row.entityId, inventoryId: saved?.id, status: saved?.status, available: saved?.available }); return { row: apiDated(saved) };
});
export const deleteSmartDatedInventory = webMethod(Permissions.SiteMember, async ({ id } = {}) => {
  const actor = await requireStaff(), rowId = clean(id, 100), old = await sb(`${TABLES.dated}?select=*&${eq("id", rowId)}&limit=1`); await sb(`${TABLES.dated}?${eq("id", rowId)}`, { method: "DELETE", headers: { Prefer: "return=minimal" } }); await audit(actor, "DATED_INVENTORY_DELETED", old?.[0]?.entity_id || null, "Dated inventory row deleted.", { inventoryId: rowId }); return { deleted: true, id: rowId };
});
export const getSmartInventoryAudit = webMethod(Permissions.SiteMember, async (input = {}) => {
  await requireStaff(); const rows = await sb(`${TABLES.audit}?select=*&order=created_at.desc&limit=750`), domain = clean(input.domain, 80).toLowerCase(), key = clean(input.productKey, 120).toLowerCase();
  const filtered = (rows || []).filter(r => (!domain || String(r.domain || "").toLowerCase().includes(domain)) && (!key || String(r.product_key || "").toLowerCase().includes(key)));
  return { audit: filtered.map(r => ({ id: r.id, eventType: r.event_type, domain: r.domain, entityTable: r.entity_table, entityId: r.entity_id, productKey: r.product_key, message: r.message, agentName: r.created_by_name, timestamp: r.created_at, payload: r.payload || {} })) };
});

export const createInventoryMediaUploadTicket = webMethod(Permissions.SiteMember, async (input = {}) => {
  const actor = await requireStaff();
  const mimeType = clean(input.mimeType, 100).toLowerCase();
  const fileSizeBytes = Math.max(0, int(input.fileSizeBytes, 0));
  if (!IMAGE_MIMES.has(mimeType)) throw new Error("Only JPG, PNG, WebP, AVIF and GIF images are supported.");
  if (!fileSizeBytes || fileSizeBytes > MAX_IMAGE_BYTES) throw new Error("Image must be 15 MB or smaller.");
  const ext = ({ "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif", "image/gif": "gif" })[mimeType] || "img";
  const entityType = slugify(input.entityType || "general") || "general";
  const code = slugify(input.code || input.entityId || "draft") || "draft";
  const role = MEDIA_ROLES.has(upper(input.role, 30)) ? upper(input.role, 30) : "GALLERY";
  const base = slugify(clean(input.fileName, 240).replace(/\.[^.]+$/, "")) || role.toLowerCase();
  const date = new Date().toISOString().slice(0, 10);
  const path = `${entityType}/${code}/${date}/${makeUuid()}-${base}.${ext}`;
  const signed = await createSignedInventoryUpload(path);
  const c = await cfg();
  const publicUrl = `${c.url}/storage/v1/object/public/${INVENTORY_BUCKET}/${path.split('/').map(encodeURIComponent).join('/')}`;
  await audit(actor, "MEDIA_UPLOAD_TICKET_CREATED", input.entityId || null, `Inventory media upload prepared (${role}).`, {
    sourceTable: TABLES.media, storageBucket: INVENTORY_BUCKET, storagePath: path, role, mimeType, fileSizeBytes
  });
  return {
    signedUrl: signed.signedUrl,
    token: signed.token,
    path,
    publicUrl,
    role,
    storageBucket: INVENTORY_BUCKET,
    storagePath: path,
    mimeType,
    fileSizeBytes,
    sourceKind: "UPLOAD",
    cacheControl: "31536000",
    expiresInSeconds: 7200
  };
});

export const getInventorySourceHealth = webMethod(Permissions.SiteMember, async () => {
  await requireStaff(); const [registry, health] = await Promise.all([sb(`${TABLES.sourceRegistry}?select=*&active=eq.true&order=category.asc`), sb(`${TABLES.sourceHealth}?select=*&order=category.asc`)]); return { registry: registry || [], health: health || [], canonicalView: TABLES.canonical, searchableView: TABLES.searchable, generatedAt: new Date().toISOString() };
});
