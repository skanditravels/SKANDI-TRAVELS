/*
 * SKANDI Travel Info Control
 * File: backend/FINAL/travelInfoControl.web.js
 *
 * Purpose
 * -------
 * Controls the customer-facing Travel Info fields that are NOT owned by
 * Smart Inventory Control. Canonical inventory identity, operational,
 * commercial, hotel/product and aircraft/cabin display data stay read-only.
 *
 * Architecture
 * ------------
 * HTML embed -> Wix page code -> this web module -> Supabase REST
 *
 * No Supabase secret is ever returned to the browser.
 */

import { webMethod, Permissions } from "wix-web-module";
import { currentMember } from "wix-members-backend";
import { secrets } from "wix-secrets-backend.v2";
import { elevate } from "wix-auth";
import { fetch } from "wix-fetch";

const elevatedGetSecretValue = elevate(secrets.getSecretValue);
let configPromise = null;

const BLOCKED = new Set(["blocked", "suspended", "terminated", "inactive", "furloughed"]);
const ACCESS_TOKENS = new Set([
  "admin", "administrator", "site owner", "owner", "company owner", "super admin", "system admin",
  "content admin", "help center admin", "travel info admin", "travel-info-admin", "travel info control",
  "operations admin", "destination controller", "altea operations", "all", "manage", "help-data",
  "travel-info", "travel-info-control"
]);

const KINDS = Object.freeze({
  airlines: {
    table: "travel_info_airlines",
    pk: "ID",
    label: "Airlines",
    create: false,
    order: "sort_order.asc.nullslast,Title.asc",
    listSelect: "ID,Title,slug,shortName,iataCode,icaoCode,summary,logoFile,logoIcon,active,status,customer_visible,sort_order,updated_at,inventory_details",
    supplement: "airline"
  },
  airports: {
    table: "travel_info_airports",
    pk: "ID",
    label: "Airports",
    create: false,
    order: "sort_order.asc.nullslast,title.asc",
    listSelect: "ID,title,slug,iata,icao,summary,logoUrl,logoIconUrl,active,status,customer_visible,sort_order,updated_at,inventory_details",
    supplement: "airport"
  },
  hotels: {
    table: "travel_info_hotels",
    pk: "id",
    label: "Hotels",
    create: false,
    order: "sort_order.asc.nullslast,title.asc",
    listSelect: "id,title,slug,category,body,image_url,active,sort_order,updated_at,payload",
    supplement: "generic-product"
  },
  transfers: {
    table: "travel_info_transfers",
    pk: "id",
    label: "Transfers",
    create: false,
    order: "sort_order.asc.nullslast,title.asc",
    listSelect: "id,title,slug,category,body,image_url,active,sort_order,updated_at,payload",
    supplement: "generic-product"
  },
  tours: {
    table: "travel_info_tours",
    pk: "id",
    label: "Tours",
    create: false,
    order: "sort_order.asc.nullslast,title.asc",
    listSelect: "id,title,slug,category,body,image_url,active,sort_order,updated_at,payload",
    supplement: "generic-product"
  },
  activities: {
    table: "travel_info_activities",
    pk: "id",
    label: "Activities",
    create: false,
    order: "sort_order.asc.nullslast,title.asc",
    listSelect: "id,title,slug,category,body,image_url,active,sort_order,updated_at,payload",
    supplement: "generic-product"
  },
  tickets: {
    table: "travel_info_tickets",
    pk: "id",
    label: "Tickets & Vouchers",
    create: false,
    order: "sort_order.asc.nullslast,title.asc",
    listSelect: "id,title,slug,category,body,image_url,active,sort_order,updated_at,payload",
    supplement: "generic-product"
  },
  faqGroups: {
    table: "travel_info_faq_groups",
    pk: "id",
    label: "Journey Groups",
    create: true,
    order: "sort_order.asc.nullslast,title.asc",
    listSelect: "id,group_id,title,subtitle,eyebrow,icon,active,sort_order,updated_at",
    supplement: "faq-group"
  },
  faq: {
    table: "travel_info_faq",
    pk: "id",
    label: "FAQ / Help Topics",
    create: true,
    order: "sort_order.asc.nullslast,title.asc",
    listSelect: "id,title,slug,category,body,image_url,active,sort_order,updated_at,topicId,groupId,subtitle,tags,featured,actionType,actionTarget,linkedLibrary",
    supplement: "faq"
  },
  articles: {
    table: "travel_info_articles",
    pk: "id",
    label: "Travel Articles",
    create: true,
    order: "sort_order.asc.nullslast,title.asc",
    listSelect: "id,title,slug,category,body,image_url,active,sort_order,updated_at,payload",
    supplement: "article"
  },
  baggage: {
    table: "baggage_allowance",
    pk: "id",
    label: "Baggage Allowance Rules",
    create: true,
    order: "airlineCode.asc.nullslast,cabinClass.asc.nullslast,fareBrand.asc.nullslast",
    listSelect: "id,title,slug,category,active,sort_order,updated_at,ruleId,airlineCode,routeId,fareBrand,cabinClass,checkedBagsIncluded,checkedBagWeightKg,cabinBagsIncluded,cabinBagWeightKg,effectiveFrom,effectiveTo,sourceUrl",
    supplement: "baggage"
  },
  requirements: {
    table: "travel_requirements",
    pk: "id",
    label: "Travel Requirements",
    create: true,
    order: "sort_order.asc.nullslast,title.asc",
    listSelect: "id,title,slug,category,body,image_url,active,sort_order,updated_at,payload",
    supplement: "requirements"
  }
});

const AIRLINE_EDITABLE = new Set([
  "summary", "quickFactsJson", "primaryColor", "accentColor", "notes", "destinationAdsJson",
  "reviewNotes", "lounges",
  "classComparisonText", "boarding", "foodDrinksJson", "wifiOnboardJson", "delayCancellationJson",
  "damagedBaggageJson", "lostFoundJson", "childrenInfantsJson", "ticketTypesJson",
  "servicePolicySourceUrlsJson", "contactUrl", "sectionsJson", "meta", "servicePolicyReviewNotes",
  "lastReviewed", "fidsScript"
]);

const AIRPORT_EDITABLE = new Set([
  "summary", "information", "destinationAdsJson", "transportJson", "runwaysJson", "terminalsJson",
  "lounges", "foodDrinksJson",
  "airportHotels", "lostFoundJson", "destinationsServing", "sectionsJson", "meta",
  "servicePolicyReviewNotes", "lastReviewed", "primaryColor", "accentColor", "notes"
]);

const ARRAY_COLUMNS_AIRPORT = new Set([
  "transportJson", "runwaysJson", "terminalsJson", "foodDrinksJson", "lostFoundJson", "sectionsJson"
]);

const JSON_COLUMNS_AIRLINE = new Set([
  "quickFactsJson", "destinationAdsJson"
]);

const JSON_TEXT_AIRLINE = new Set([
  "lounges", "boarding", "foodDrinksJson", "wifiOnboardJson", "delayCancellationJson",
  "damagedBaggageJson", "lostFoundJson", "childrenInfantsJson", "ticketTypesJson",
  "servicePolicySourceUrlsJson", "sectionsJson", "meta"
]);

const JSON_TEXT_AIRPORT = new Set(["lounges", "airportHotels", "destinationsServing", "meta"]);

function cleanText(value, max = 50000) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/\u0000/g, "").trim().slice(0, max);
}

function cleanUrl(value) {
  const v = cleanText(value, 4000);
  if (!v) return "";
  if (/^(https?:\/\/|wix:image:\/\/|wix:vector:\/\/)/i.test(v)) return v;
  return v;
}

function bool(value, fallback = false) {
  if (value === undefined || value === null || value === "") return fallback;
  return value === true || String(value).toLowerCase() === "true" || String(value).toLowerCase() === "yes";
}

function num(value, fallback = 0) {
  if (value === "" || value === null || value === undefined) return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function parseJson(value, fallback = null) {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "object") return value;
  let v = String(value).trim();
  for (let i = 0; i < 3; i += 1) {
    try {
      const parsed = JSON.parse(v);
      if (typeof parsed === "string" && parsed !== v) {
        v = parsed;
        continue;
      }
      return parsed;
    } catch (_) {
      break;
    }
  }
  return fallback;
}

function safeArray(value) {
  const parsed = parseJson(value, value);
  if (Array.isArray(parsed)) return parsed;
  if (parsed === null || parsed === undefined || parsed === "") return [];
  return [parsed];
}

function safeObject(value) {
  const parsed = parseJson(value, value);
  return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
}

function deepClone(value, fallback = {}) {
  try { return JSON.parse(JSON.stringify(value ?? fallback)); } catch (_) { return fallback; }
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

async function getConfig() {
  if (configPromise) return configPromise;
  configPromise = (async () => {
    const baseUrl = await getSecret("SUPABASE_URL");
    let apiKey = "";
    try { apiKey = await getSecret("SUPABASE_SECRET_KEY"); }
    catch (_) { apiKey = await getSecret("SUPABASE_SERVICE_ROLE_KEY"); }
    if (!/^https:\/\/[^/]+\.supabase\.co\/?$/i.test(baseUrl)) throw new Error("SUPABASE_URL_INVALID");
    if (!apiKey) throw new Error("SUPABASE_SERVER_KEY_MISSING");
    return {
      baseUrl: baseUrl.replace(/\/+$/, ""),
      apiKey,
      legacyJwt: apiKey.startsWith("eyJ")
    };
  })();
  try { return await configPromise; }
  catch (error) { configPromise = null; throw error; }
}

function queryString(query = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    params.set(key, String(value));
  });
  const s = params.toString();
  return s ? `?${s}` : "";
}

async function rest({ table, method = "GET", query = {}, body, prefer = "return=representation" }) {
  const allowed = new Set([...Object.values(KINDS).map(x => x.table), "agent_users"]);
  if (!allowed.has(table)) throw new Error("TRAVEL_INFO_TABLE_NOT_ALLOWED");
  const cfg = await getConfig();
  const headers = { apikey: cfg.apiKey, Accept: "application/json" };
  if (cfg.legacyJwt) headers.Authorization = `Bearer ${cfg.apiKey}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (prefer) headers.Prefer = prefer;
  const response = await fetch(`${cfg.baseUrl}/rest/v1/${encodeURIComponent(table)}${queryString(query)}`, {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {})
  });
  const text = await response.text();
  let data = null;
  if (text) {
    try { data = JSON.parse(text); }
    catch (_) { data = text; }
  }
  if (!response.ok) {
    const message = data?.message || data?.hint || data?.details || String(data || `HTTP ${response.status}`);
    const error = new Error(message);
    error.code = data?.code || `SUPABASE_${response.status}`;
    throw error;
  }
  return data;
}

function first(rows) { return Array.isArray(rows) && rows.length ? rows[0] : null; }

function getMemberEmail(member = {}) {
  return cleanText(member?.loginEmail || member?.contactDetails?.emails?.[0] || member?.profile?.email, 320).toLowerCase();
}

async function currentIdentity() {
  let member = null;
  try { member = await currentMember.getMember({ fieldsets: ["FULL"] }); }
  catch (_) { member = null; }
  if (!member?._id && !member?.id) throw new Error("STAFF_MEMBER_SESSION_REQUIRED");
  let roles = [];
  try {
    const result = await currentMember.getRoles();
    roles = Array.isArray(result) ? result : [];
  } catch (_) { roles = []; }
  return { member, memberId: member?._id || member?.id || "", email: getMemberEmail(member), roles };
}

async function findAgent(identity) {
  const select = "id,agent_id,wix_member_id,member_id,email,corporate_email_address,display_name,preferred_name,first_name,last_name,job_title,department,active,status,employment_status,portal_access,authorized,can_manage,payload,sk_id";
  if (identity.memberId) {
    const row = first(await rest({
      table: "agent_users",
      query: { select, or: `(wix_member_id.eq.${identity.memberId},member_id.eq.${identity.memberId})`, limit: 1 }
    }));
    if (row) return row;
  }
  if (identity.email) {
    const row = first(await rest({
      table: "agent_users",
      query: { select, or: `(email.ilike.${identity.email},corporate_email_address.ilike.${identity.email})`, limit: 1 }
    }));
    if (row) return row;
  }
  return null;
}

function tokensFrom(value, out = []) {
  if (value === null || value === undefined) return out;
  if (Array.isArray(value)) { value.forEach(v => tokensFrom(v, out)); return out; }
  if (typeof value === "object") {
    Object.entries(value).forEach(([k, v]) => {
      if (v === true) out.push(String(k));
      else if (["role", "roles", "permission", "permissions", "access", "apps"].includes(String(k).toLowerCase())) tokensFrom(v, out);
    });
    return out;
  }
  String(value).split(/[;,|\n]/).map(v => v.trim()).filter(Boolean).forEach(v => out.push(v));
  return out;
}

function normalizeAccessToken(value) {
  return String(value || "").toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
}

function hasControlAccess(identity, agent) {
  if (agent?.can_manage === true) return true;
  const values = [];
  identity.roles.forEach(role => {
    values.push(role?.name, role?.title, role?._id, role?.id);
  });
  values.push(agent?.job_title, agent?.department);
  tokensFrom(agent?.payload, values);
  return values.map(normalizeAccessToken).some(token => ACCESS_TOKENS.has(token) || token.includes("travel info") || token.includes("content admin"));
}

async function requireEditor() {
  const identity = await currentIdentity();
  const agent = await findAgent(identity);
  if (!agent) throw new Error("TRAVEL_INFO_EDITOR_NOT_FOUND");
  const status = normalizeAccessToken(agent.status);
  const employment = normalizeAccessToken(agent.employment_status);
  if (agent.active !== true || agent.portal_access !== true || agent.authorized !== true || BLOCKED.has(status) || BLOCKED.has(employment)) {
    throw new Error("TRAVEL_INFO_EDITOR_NOT_AUTHORIZED");
  }
  if (!hasControlAccess(identity, agent)) throw new Error("TRAVEL_INFO_CONTROL_PERMISSION_REQUIRED");
  return {
    id: agent.id,
    skId: agent.sk_id || "",
    displayName: agent.preferred_name || agent.display_name || [agent.first_name, agent.last_name].filter(Boolean).join(" ") || identity.email,
    role: agent.job_title || "Travel Info Control"
  };
}

function assertKind(kind) {
  const key = cleanText(kind, 40);
  const cfg = KINDS[key];
  if (!cfg) throw new Error("TRAVEL_INFO_KIND_NOT_ALLOWED");
  return { key, cfg };
}

function rowId(kind, row = {}) {
  if (kind === "airlines") return row.ID || "";
  if (kind === "airports") return row.ID || "";
  return row.id || "";
}

function recordTitle(kind, row = {}) {
  if (kind === "airlines") return row.Title || row.shortName || row.iataCode || row.ID || "Airline";
  if (kind === "airports") return row.title || row.iata || row.ID || "Airport";
  if (kind === "faqGroups") return row.title || row.group_id || row.id || "Journey Group";
  return row.title || row.topicId || row.ruleId || row.slug || row.id || "Record";
}

function listItem(kind, row) {
  const inventory = safeObject(row.inventory_details || row?.payload?.details);
  const payload = safeObject(row.payload);
  const ti = safeObject(payload.travelInfo);
  let code = "";
  let subtitle = "";
  let lockedByInventory = false;
  if (kind === "airlines") {
    code = row.iataCode || inventory.iata || "";
    subtitle = [row.icaoCode || inventory.icao, row.shortName, inventory.country].filter(Boolean).join(" · ");
    lockedByInventory = true;
  } else if (kind === "airports") {
    code = row.iata || inventory.iata || "";
    subtitle = [row.icao || inventory.icao, inventory.city || row.locationCity, inventory.country || row.country].filter(Boolean).join(" · ");
    lockedByInventory = true;
  } else if (["hotels", "transfers", "tours", "activities", "tickets"].includes(kind)) {
    code = payload.publicId || payload.details?.code || "";
    subtitle = [payload.details?.city, payload.details?.countryName, payload.details?.destinationName, row.category].filter(Boolean).join(" · ");
    lockedByInventory = true;
  } else if (kind === "faqGroups") {
    code = row.group_id || "";
    subtitle = row.eyebrow || row.subtitle || "";
  } else if (kind === "faq") {
    code = row.topicId || "";
    subtitle = [row.groupId, row.category].filter(Boolean).join(" · ");
  } else if (kind === "baggage") {
    code = row.airlineCode || "";
    subtitle = [row.cabinClass, row.fareBrand, row.routeId].filter(Boolean).join(" · ");
  } else if (kind === "requirements") {
    const d = { ...payload, ...safeObject(payload.travelInfo) };
    code = d.ruleId || row.slug || "";
    subtitle = [d.ruleType, d.countryName, d.region].filter(Boolean).join(" · ");
  } else if (kind === "articles") {
    code = row.slug || "";
    subtitle = [row.category, ti.appliesToProductType || payload.appliesToProductType].filter(Boolean).join(" · ");
  }
  const overlayActive = ["hotels", "transfers", "tours", "activities", "tickets"].includes(kind) && ti.active !== undefined
    ? ti.active !== false
    : row.active !== false;
  const overlaySortOrder = ["hotels", "transfers", "tours", "activities", "tickets"].includes(kind) && ti.sortOrder !== undefined
    ? num(ti.sortOrder, row.sort_order ?? 100)
    : (row.sort_order ?? row.sortOrder ?? 100);
  return {
    id: rowId(kind, row),
    title: recordTitle(kind, row),
    code,
    subtitle,
    active: overlayActive,
    status: row.status || (overlayActive ? "ACTIVE" : "HIDDEN"),
    customerVisible: row.customer_visible !== false,
    sortOrder: overlaySortOrder,
    updatedAt: row.updated_at || "",
    lockedByInventory,
    hasSupplement: Object.keys(ti).length > 0 || Boolean(row.summary || row.body || row.lounges || row.sectionsJson)
  };
}

async function listRows(kind, { query = "", active = "" } = {}) {
  const { cfg } = assertKind(kind);
  const q = { select: cfg.listSelect, order: cfg.order, limit: 1000 };
  if (active === true || active === "true") q.active = "eq.true";
  if (active === false || active === "false") q.active = "eq.false";
  let rows = await rest({ table: cfg.table, query: q });
  rows = Array.isArray(rows) ? rows : [];
  const needle = cleanText(query, 200).toLowerCase();
  if (needle) {
    rows = rows.filter(row => {
      const item = listItem(kind, row);
      return [item.title, item.code, item.subtitle, row.slug, row.category].join(" ").toLowerCase().includes(needle);
    });
  }
  return rows.map(row => listItem(kind, row));
}

async function getRawRecord(kind, id) {
  const { cfg } = assertKind(kind);
  const recordId = cleanText(id, 200);
  if (!recordId) return null;
  return first(await rest({ table: cfg.table, query: { select: "*", [cfg.pk]: `eq.${recordId}`, limit: 1 } }));
}

function inventorySnapshot(kind, row) {
  const inventory = safeObject(row.inventory_details || row?.payload?.details);
  if (kind === "airlines") return {
    name: row.Title || "",
    slug: row.slug || "",
    iata: row.iataCode || inventory.iata || "",
    icao: row.icaoCode || inventory.icao || "",
    shortName: row.shortName || inventory.shortName || "",
    alliance: row.alliance || inventory.alliance || "",
    brandGroup: row.brandGroup || inventory.brandGroup || "",
    country: row.locationCountry || inventory.country || "",
    city: row.locationCity || inventory.city || "",
    website: row.website || inventory.website || "",
    checkInDeadline: row.checkInDeadline || inventory.checkInDeadline || "",
    baggageAllowance: inventory.baggageAllowance || row.baggageAllowence || "",
    cabinClasses: inventory.cabinClasses || "",
    mealInfo: inventory.mealInfo || "",
    wifiInfo: inventory.wifiInfo || "",
    seatInfo: inventory.seatInfo || "",
    specialAssistanceInfo: inventory.specialAssistanceInfo || "",
    loyaltyProgram: row.loyaltyProgram || inventory.loyaltyProgram || "",
    loyaltyProgramUrl: row.loyaltyProgramUrl || inventory.loyaltyProgramUrl || "",
    sourceUrls: inventory.sourceUrlsJson || safeArray(row.sourceUrlsJson),
    fleetSummary: inventory.fleetSummaryJson || safeArray(row.fleetSummaryJson),
    hubs: inventory.hubsJson || row.hubsJson || [],
    mediaAssets: safeArray(row.media_assets),
    localizedContent: safeArray(row.localized_content)
  };
  if (kind === "airports") return {
    name: row.title || "",
    slug: row.slug || "",
    iata: row.iata || inventory.iata || "",
    icao: row.icao || inventory.icao || "",
    city: row.locationCity || inventory.city || "",
    country: row.country || inventory.country || "",
    timezone: row.timezone || inventory.timezone || "",
    latitude: row.latitude ?? inventory.latitude ?? "",
    longitude: row.longitude ?? inventory.longitude ?? "",
    distanceToCityCenterKm: row.distanceToCityCenterKm ?? inventory.distanceToCityCenterKm ?? "",
    website: row.website || inventory.website || "",
    contactUrl: row.contactUrl || inventory.contactUrl || "",
    overview: inventory.overview || row.body || "",
    arrivalInfo: inventory.arrivalInfo || "",
    departureInfo: inventory.departureInfo || "",
    transferInfo: inventory.transferInfo || "",
    checkinInfo: inventory.checkinInfo || "",
    securityInfo: inventory.securityInfo || "",
    wifiInfo: inventory.wifiInfo || "",
    accessibilityInfo: inventory.accessibilityInfo || "",
    quickFacts: inventory.quickFactsJson || row.quickFactsJson || [],
    sourceUrls: inventory.sourceUrlsJson || row.sourceUrlsJson || [],
    mediaAssets: safeArray(row.media_assets),
    localizedContent: safeArray(row.localized_content)
  };
  if (["hotels", "transfers", "tours", "activities", "tickets"].includes(kind)) {
    const payload = safeObject(row.payload);
    const details = safeObject(payload.details);
    return {
      publicId: payload.publicId || "",
      name: row.title || payload.name || "",
      slug: row.slug || payload.seo?.canonicalSlug || "",
      category: row.category || details.propertyType || details.category || "",
      details,
      commercial: safeObject(payload.commercial),
      operations: safeObject(payload.operations),
      seo: safeObject(payload.seo),
      localizedContent: safeArray(payload.localized_content || payload.localizedContent),
      mediaAssets: safeArray(payload.media_assets || payload.mediaAssets)
    };
  }
  return {};
}

function airlineSupplement(row) {
  const out = {};
  AIRLINE_EDITABLE.forEach(key => {
    let value = row[key];
    if (JSON_COLUMNS_AIRLINE.has(key) || JSON_TEXT_AIRLINE.has(key)) value = parseJson(value, value || (JSON_COLUMNS_AIRLINE.has(key) ? [] : {}));
    out[key] = value ?? "";
  });
  return out;
}

function airportSupplement(row) {
  const out = {};
  AIRPORT_EDITABLE.forEach(key => {
    let value = row[key];
    if (ARRAY_COLUMNS_AIRPORT.has(key)) value = safeArray(value).map(x => parseJson(x, x));
    else if (JSON_TEXT_AIRPORT.has(key)) value = parseJson(value, value || {});
    out[key] = value ?? "";
  });
  const payload = safeObject(row.payload);
  out.parkingInfo = cleanText(payload?.travelInfo?.parkingInfo || payload?.parkingInfo || "", 20000);
  return out;
}

function genericProductSupplement(row) {
  const payload = safeObject(row.payload);
  const ti = safeObject(payload.travelInfo);
  return {
    summary: cleanText(ti.summary ?? row.body ?? "", 30000),
    intro: cleanText(ti.intro ?? "", 30000),
    badges: safeArray(ti.badges),
    included: safeArray(ti.included),
    bookingUrl: cleanUrl(ti.bookingUrl || ""),
    sections: safeObject(ti.sections),
    sourceUrls: safeArray(ti.sourceUrls),
    publicDisclaimer: cleanText(ti.publicDisclaimer || "", 30000),
    reviewNotes: cleanText(ti.reviewNotes || "", 30000),
    lastReviewed: cleanText(ti.lastReviewed || "", 40),
    travelInfoActive: ti.active === undefined ? row.active !== false : ti.active !== false,
    sortOrder: num(ti.sortOrder ?? row.sort_order, 100)
  };
}

function normalizeRecord(kind, row) {
  if (!row) return null;
  let supplemental = {};
  if (kind === "airlines") supplemental = airlineSupplement(row);
  else if (kind === "airports") supplemental = airportSupplement(row);
  else if (["hotels", "transfers", "tours", "activities", "tickets"].includes(kind)) supplemental = genericProductSupplement(row);
  else if (kind === "faqGroups") supplemental = {
    groupId: row.group_id || "", title: row.title || "", subtitle: row.subtitle || "", eyebrow: row.eyebrow || "",
    icon: row.icon || "", active: row.active !== false, sortOrder: num(row.sort_order, 100)
  };
  else if (kind === "faq") supplemental = {
    title: row.title || "", slug: row.slug || "", category: row.category || "", body: row.body || "", imageUrl: row.image_url || "",
    active: row.active !== false, sortOrder: num(row.sort_order, 100), topicId: row.topicId || "", groupId: row.groupId || "",
    subtitle: row.subtitle || "", bullets: safeArray(row.bulletsJson), tags: row.tags || "", featured: row.featured === true,
    actionType: row.actionType || "article", actionTarget: row.actionTarget || "", linkedLibrary: row.linkedLibrary || ""
  };
  else if (kind === "articles") {
    const payload = { ...safeObject(row.payload), ...safeObject(row.payload?.travelInfo) };
    supplemental = {
      title: row.title || "", slug: row.slug || "", category: row.category || "", body: row.body || "", imageUrl: row.image_url || "",
      active: row.active !== false, sortOrder: num(row.sort_order, 100), summary: payload.summary || "", destinationRef: payload.destinationRef || payload.destination || "",
      airlineRef: payload.airlineRef || payload.airline || "", appliesToProductType: payload.appliesToProductType || "", sourceName: payload.sourceName || "",
      officialSourceUrl: payload.officialSourceUrl || "", lastReviewedAt: payload.lastReviewedAt || "", reviewFrequencyDays: num(payload.reviewFrequencyDays, 0),
      requiresLegalReview: bool(payload.requiresLegalReview, false)
    };
  } else if (kind === "baggage") supplemental = {
    title: row.title || "", slug: row.slug || "", category: row.category || "", active: row.active !== false, sortOrder: num(row.sort_order, 100),
    ruleId: row.ruleId || "", airlineCode: row.airlineCode || "", routeId: row.routeId || "", fareBrand: row.fareBrand || "", cabinClass: row.cabinClass || "",
    checkedBagsIncluded: row.checkedBagsIncluded || "", checkedBagWeightKg: row.checkedBagWeightKg ?? "", cabinBagsIncluded: row.cabinBagsIncluded || "",
    cabinBagWeightKg: row.cabinBagWeightKg ?? "", sportsEquipmentPolicy: row.sportsEquipmentPolicy || "", infantPolicy: row.infantPolicy || "",
    effectiveFrom: row.effectiveFrom || "", effectiveTo: row.effectiveTo || "", sourceUrl: row.sourceUrl || "", details: safeObject(row.payload)
  };
  else if (kind === "requirements") {
    const payload = { ...safeObject(row.payload), ...safeObject(row.payload?.travelInfo) };
    supplemental = {
      title: row.title || "", slug: row.slug || "", category: row.category || "", body: row.body || "", active: row.active !== false,
      sortOrder: num(row.sort_order, 100), ruleId: payload.ruleId || "", ruleType: payload.ruleType || "country", countryName: payload.countryName || "",
      region: payload.region || "", key: payload.key || "", valueText: payload.valueText || row.body || "", valueJson: payload.valueJson ?? {},
      sourceName: payload.sourceName || "", officialSourceUrl: payload.officialSourceUrl || "", lastReviewedAt: payload.lastReviewedAt || ""
    };
  }
  return {
    kind,
    id: rowId(kind, row),
    title: recordTitle(kind, row),
    inventoryLocked: ["airlines", "airports", "hotels", "transfers", "tours", "activities", "tickets"].includes(kind),
    inventory: inventorySnapshot(kind, row),
    supplemental,
    updatedAt: row.updated_at || ""
  };
}

function cleanJsonForDb(value, fallback) {
  const parsed = typeof value === "string" ? parseJson(value, fallback) : value;
  return parsed === undefined || parsed === null ? fallback : parsed;
}

function jsonText(value, fallback = {}) {
  const v = cleanJsonForDb(value, fallback);
  try { return JSON.stringify(v); } catch (_) { return JSON.stringify(fallback); }
}

function pgTextArray(value) {
  return safeArray(value).map(item => typeof item === "string" ? item : JSON.stringify(item));
}

function airlinePatch(input = {}) {
  const out = {};
  AIRLINE_EDITABLE.forEach(key => {
    if (!Object.prototype.hasOwnProperty.call(input, key)) return;
    let value = input[key];
    if (JSON_COLUMNS_AIRLINE.has(key)) value = cleanJsonForDb(value, []);
    else if (JSON_TEXT_AIRLINE.has(key)) value = jsonText(value, key === "meta" ? [] : {});
    else if (["logoFile", "logoIcon", "heroAircraftUrl", "contactUrl"].includes(key)) value = cleanUrl(value);
    else value = cleanText(value, 50000);
    out[key] = value;
  });
  return out;
}

function airportPatch(input = {}, currentPayload = {}) {
  const out = {};
  AIRPORT_EDITABLE.forEach(key => {
    if (!Object.prototype.hasOwnProperty.call(input, key)) return;
    let value = input[key];
    if (ARRAY_COLUMNS_AIRPORT.has(key)) value = pgTextArray(value);
    else if (JSON_TEXT_AIRPORT.has(key)) value = jsonText(value, key === "meta" ? [] : {});
    else if (["logoUrl", "logoIconUrl", "heroImageUrl"].includes(key)) value = cleanUrl(value);
    else value = cleanText(value, 50000);
    out[key] = value;
  });
  if (Object.prototype.hasOwnProperty.call(input, "parkingInfo")) {
    const payload = deepClone(currentPayload, {});
    payload.travelInfo = { ...safeObject(payload.travelInfo), parkingInfo: cleanText(input.parkingInfo, 20000) };
    out.payload = payload;
  }
  return out;
}

function productPatch(input = {}, currentRow = {}) {
  const payload = deepClone(safeObject(currentRow.payload), {});
  const old = safeObject(payload.travelInfo);
  const ti = { ...old };

  if (Object.prototype.hasOwnProperty.call(input, "summary")) ti.summary = cleanText(input.summary, 30000);
  if (Object.prototype.hasOwnProperty.call(input, "intro")) ti.intro = cleanText(input.intro, 30000);
  if (Object.prototype.hasOwnProperty.call(input, "badges")) ti.badges = safeArray(input.badges).map(v => cleanText(typeof v === "string" ? v : v?.label || v?.title || JSON.stringify(v), 300));
  if (Object.prototype.hasOwnProperty.call(input, "included")) ti.included = safeArray(input.included).map(v => typeof v === "string" ? cleanText(v, 500) : v);
  if (Object.prototype.hasOwnProperty.call(input, "bookingUrl")) ti.bookingUrl = cleanUrl(input.bookingUrl);
  if (Object.prototype.hasOwnProperty.call(input, "sections")) ti.sections = safeObject(input.sections);
  if (Object.prototype.hasOwnProperty.call(input, "sourceUrls")) ti.sourceUrls = safeArray(input.sourceUrls);
  if (Object.prototype.hasOwnProperty.call(input, "publicDisclaimer")) ti.publicDisclaimer = cleanText(input.publicDisclaimer, 30000);
  if (Object.prototype.hasOwnProperty.call(input, "reviewNotes")) ti.reviewNotes = cleanText(input.reviewNotes, 30000);
  if (Object.prototype.hasOwnProperty.call(input, "lastReviewed")) ti.lastReviewed = cleanText(input.lastReviewed, 40);
  if (Object.prototype.hasOwnProperty.call(input, "travelInfoActive")) ti.active = bool(input.travelInfoActive, currentRow.active !== false);
  if (Object.prototype.hasOwnProperty.call(input, "sortOrder")) ti.sortOrder = num(input.sortOrder, currentRow.sort_order ?? 100);

  payload.travelInfo = ti;
  return { payload };
}

function faqGroupPatch(input = {}) {
  return {
    group_id: cleanText(input.groupId, 120),
    title: cleanText(input.title, 500),
    subtitle: cleanText(input.subtitle, 5000),
    eyebrow: cleanText(input.eyebrow, 300),
    icon: cleanText(input.icon, 80),
    active: bool(input.active, true),
    sort_order: num(input.sortOrder, 100)
  };
}

function faqPatch(input = {}) {
  return {
    title: cleanText(input.title, 1000),
    slug: cleanText(input.slug, 400),
    category: cleanText(input.category, 300),
    body: cleanText(input.body, 50000),
    image_url: cleanUrl(input.imageUrl),
    active: bool(input.active, true),
    sort_order: num(input.sortOrder, 100),
    topicId: cleanText(input.topicId, 160),
    groupId: cleanText(input.groupId, 160),
    subtitle: cleanText(input.subtitle, 5000),
    bulletsJson: safeArray(input.bullets).map(v => cleanText(v, 3000)),
    tags: cleanText(input.tags, 3000),
    featured: bool(input.featured, false),
    actionType: cleanText(input.actionType || "article", 80),
    actionTarget: cleanText(input.actionTarget, 4000),
    linkedLibrary: cleanText(input.linkedLibrary, 120)
  };
}

function articlePatch(input = {}, current = {}) {
  const payload = deepClone(safeObject(current.payload), {});
  const ti = {
    ...safeObject(payload.travelInfo),
    summary: cleanText(input.summary, 30000),
    destinationRef: cleanText(input.destinationRef, 300),
    airlineRef: cleanText(input.airlineRef, 300),
    appliesToProductType: cleanText(input.appliesToProductType, 120),
    sourceName: cleanText(input.sourceName, 500),
    officialSourceUrl: cleanUrl(input.officialSourceUrl),
    lastReviewedAt: cleanText(input.lastReviewedAt, 40),
    reviewFrequencyDays: num(input.reviewFrequencyDays, 0),
    requiresLegalReview: bool(input.requiresLegalReview, false)
  };
  payload.travelInfo = ti;
  return {
    title: cleanText(input.title, 1000), slug: cleanText(input.slug, 400), category: cleanText(input.category, 300),
    body: cleanText(input.body, 50000), image_url: cleanUrl(input.imageUrl), active: bool(input.active, true),
    sort_order: num(input.sortOrder, 100), payload
  };
}

function baggagePatch(input = {}, current = {}) {
  return {
    title: cleanText(input.title, 1000), slug: cleanText(input.slug, 400), category: cleanText(input.category, 300),
    active: bool(input.active, true), sort_order: num(input.sortOrder, 100),
    ruleId: cleanText(input.ruleId, 180), airlineCode: cleanText(input.airlineCode, 20).toUpperCase(), routeId: cleanText(input.routeId, 180),
    fareBrand: cleanText(input.fareBrand, 300), cabinClass: cleanText(input.cabinClass, 300), checkedBagsIncluded: cleanText(input.checkedBagsIncluded, 300),
    checkedBagWeightKg: input.checkedBagWeightKg === "" ? null : num(input.checkedBagWeightKg, 0), cabinBagsIncluded: cleanText(input.cabinBagsIncluded, 300),
    cabinBagWeightKg: input.cabinBagWeightKg === "" ? null : num(input.cabinBagWeightKg, 0), sportsEquipmentPolicy: cleanText(input.sportsEquipmentPolicy, 10000),
    infantPolicy: cleanText(input.infantPolicy, 10000), effectiveFrom: cleanText(input.effectiveFrom, 20) || null, effectiveTo: cleanText(input.effectiveTo, 20) || null,
    sourceUrl: cleanUrl(input.sourceUrl), payload: safeObject(input.details || current.payload)
  };
}

function requirementsPatch(input = {}, current = {}) {
  const payload = deepClone(safeObject(current.payload), {});
  payload.travelInfo = {
    ...safeObject(payload.travelInfo),
    ruleId: cleanText(input.ruleId, 180), ruleType: cleanText(input.ruleType || "country", 80), countryName: cleanText(input.countryName, 300),
    region: cleanText(input.region, 300), key: cleanText(input.key, 300), valueText: cleanText(input.valueText, 50000),
    valueJson: cleanJsonForDb(input.valueJson, {}), sourceName: cleanText(input.sourceName, 500), officialSourceUrl: cleanUrl(input.officialSourceUrl),
    lastReviewedAt: cleanText(input.lastReviewedAt, 40)
  };
  return {
    title: cleanText(input.title, 1000), slug: cleanText(input.slug, 400), category: cleanText(input.category, 300),
    body: cleanText(input.valueText || input.body, 50000), active: bool(input.active, true), sort_order: num(input.sortOrder, 100), payload
  };
}

async function saveRecordInternal(kind, id, input) {
  const { cfg } = assertKind(kind);
  const recordId = cleanText(id, 200);
  const current = recordId ? await getRawRecord(kind, recordId) : null;
  if (!current && !cfg.create) throw new Error("CREATE_IN_INVENTORY_CONTROL_FIRST");
  let patch = {};
  if (kind === "airlines") patch = airlinePatch(input);
  else if (kind === "airports") patch = airportPatch(input, current?.payload);
  else if (["hotels", "transfers", "tours", "activities", "tickets"].includes(kind)) patch = productPatch(input, current);
  else if (kind === "faqGroups") patch = faqGroupPatch(input);
  else if (kind === "faq") patch = faqPatch(input);
  else if (kind === "articles") patch = articlePatch(input, current || {});
  else if (kind === "baggage") patch = baggagePatch(input, current || {});
  else if (kind === "requirements") patch = requirementsPatch(input, current || {});
  else throw new Error("TRAVEL_INFO_SAVE_KIND_NOT_SUPPORTED");

  if (["faqGroups", "faq", "articles", "baggage", "requirements"].includes(kind) && !cleanText(patch.title, 1000)) {
    throw new Error("TITLE_REQUIRED");
  }
  if (kind === "faqGroups" && !patch.group_id) throw new Error("GROUP_ID_REQUIRED");
  if (kind === "faq" && !patch.topicId) throw new Error("TOPIC_ID_REQUIRED");
  if (kind === "baggage" && !patch.airlineCode) throw new Error("AIRLINE_CODE_REQUIRED");

  let rows;
  if (current) {
    rows = await rest({ table: cfg.table, method: "PATCH", query: { [cfg.pk]: `eq.${recordId}` }, body: patch, prefer: "return=representation" });
  } else {
    rows = await rest({ table: cfg.table, method: "POST", body: patch, prefer: "return=representation" });
  }
  const saved = first(rows) || (current ? { ...current, ...patch } : patch);
  return normalizeRecord(kind, saved);
}

export const getTravelInfoControlBootstrap = webMethod(Permissions.SiteMember, async () => {
  const editor = await requireEditor();
  const counts = {};
  for (const kind of Object.keys(KINDS)) {
    try { counts[kind] = (await listRows(kind)).length; }
    catch (_) { counts[kind] = null; }
  }
  return {
    ok: true,
    editor,
    counts,
    defaultKind: "airlines",
    kinds: Object.entries(KINDS).map(([key, cfg]) => ({ key, label: cfg.label, create: cfg.create })),
    ownership: {
      inventoryControl: ["canonical identity", "commercial", "operations", "booking", "hotel/product facts", "inventory media/localized content"],
      aircraftDisplayControl: ["aircraft", "cabins", "cabin views", "hotspots", "walk scenes", "aircraft display images"],
      travelInfoControl: ["public editorial copy", "lounges", "airport routes/terminals", "public hotel/product guidance", "FAQ", "articles", "baggage rules", "travel requirements"]
    },
    checkedAt: new Date().toISOString()
  };
});

export const listTravelInfoRecords = webMethod(Permissions.SiteMember, async ({ kind = "airlines", query = "", active = "" } = {}) => {
  await requireEditor();
  return { ok: true, kind, records: await listRows(kind, { query, active }) };
});

export const getTravelInfoRecord = webMethod(Permissions.SiteMember, async ({ kind, id } = {}) => {
  await requireEditor();
  const row = await getRawRecord(kind, id);
  if (!row) throw new Error("TRAVEL_INFO_RECORD_NOT_FOUND");
  return { ok: true, record: normalizeRecord(kind, row) };
});

export const saveTravelInfoRecord = webMethod(Permissions.SiteMember, async ({ kind, id = "", supplemental = {} } = {}) => {
  const editor = await requireEditor();
  const record = await saveRecordInternal(kind, id, safeObject(supplemental));
  return { ok: true, record, editor: { skId: editor.skId, displayName: editor.displayName }, savedAt: new Date().toISOString() };
});

export const archiveTravelInfoRecord = webMethod(Permissions.SiteMember, async ({ kind, id } = {}) => {
  await requireEditor();
  const { cfg } = assertKind(kind);
  const recordId = cleanText(id, 200);
  if (!recordId) throw new Error("RECORD_ID_REQUIRED");
  if (!cfg.create) throw new Error("INVENTORY_LINKED_RECORD_CANNOT_BE_ARCHIVED_HERE");
  const rows = await rest({ table: cfg.table, method: "PATCH", query: { [cfg.pk]: `eq.${recordId}` }, body: { active: false }, prefer: "return=representation" });
  const row = first(rows);
  return { ok: true, id: recordId, record: row ? normalizeRecord(kind, row) : null };
});
