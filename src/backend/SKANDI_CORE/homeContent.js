// /src/backend/SKANDI_CORE/homeContent.js
// SKANDI Backend Base 1.0 — B-010 Home content core.
// Public Home content is projected from the same canonical public Inventory view used by Destination Flow.
// No Wix page state, provider HTTP, secrets, or booking mutation belongs here.

import { restRequest } from "backend/SKANDI_CORE/supabaseServer.js";

const PUBLIC_VIEW = "inventory_public_entities_v";
const CACHE_TTL_MS = 60_000;
const MAX_ROWS = 5000;

let cache = null;
let cacheExpiresAt = 0;
let inFlight = null;

function clean(value, max = 5000) { return String(value ?? "").trim().slice(0, max); }
function arr(value) { return Array.isArray(value) ? value : []; }
function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
function num(value, fallback = 0) { const n = Number(value); return Number.isFinite(n) ? n : fallback; }
function upper(value, max = 80) { return clean(value, max).toUpperCase(); }
function slugify(value) {
  return clean(value, 240).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function publicRecord(row = {}) {
  return {
    id: clean(row.id, 120),
    publicId: clean(row.public_id, 160),
    entityType: upper(row.entity_type, 60),
    code: clean(row.code, 80),
    name: clean(row.name, 500),
    slug: clean(row.slug, 240),
    featured: row.featured === true,
    homepageFeatured: row.homepage_featured === true,
    sortPriority: num(row.sort_priority),
    parentEntityId: clean(row.parent_entity_id, 120),
    details: obj(row.details),
    commercial: obj(row.commercial),
    seo: obj(row.seo),
    localized: arr(row.localized),
    media: arr(row.media),
    relations: arr(row.relations),
    updatedAt: row.updated_at || null
  };
}

async function readCatalog() {
  const rows = await restRequest({
    table: PUBLIC_VIEW,
    query: {
      select: "id,public_id,entity_type,code,name,slug,featured,homepage_featured,sort_priority,parent_entity_id,details,commercial,seo,localized,media,relations,updated_at",
      order: "sort_priority.asc,name.asc",
      limit: MAX_ROWS
    }
  });
  return arr(rows).map(publicRecord);
}

async function catalog(force = false) {
  if (!force && cache && Date.now() < cacheExpiresAt) return cache;
  if (!inFlight) {
    inFlight = readCatalog().then(records => {
      cache = records;
      cacheExpiresAt = Date.now() + CACHE_TTL_MS;
      return records;
    }).finally(() => { inFlight = null; });
  }
  return inFlight;
}

function localized(record, language = "EN") {
  const rows = arr(record?.localized);
  const key = upper(language, 12) || "EN";
  return rows.find(row => upper(row?.language, 12) === key)
    || rows.find(row => upper(row?.language, 12) === "EN")
    || rows[0]
    || {};
}

function mediaUrl(record) {
  const rows = arr(record?.media).slice().sort((a, b) => num(a?.sortOrder ?? a?.sort_order) - num(b?.sortOrder ?? b?.sort_order));
  for (const raw of rows) {
    if (typeof raw === "string" && clean(raw, 1800)) return clean(raw, 1800);
    const row = obj(raw);
    const value = clean(row.url || row.publicUrl || row.public_url || row.assetUrl || row.asset_url || row.src, 1800);
    if (value) return value;
  }
  return "";
}

function relationTarget(records, record, relationTypes = [], targetTypes = []) {
  const relSet = new Set(relationTypes.map(v => upper(v, 80)));
  const targetSet = new Set(targetTypes.map(v => upper(v, 80)));
  for (const relation of arr(record?.relations)) {
    const rel = upper(relation?.relationType || relation?.relation_type || relation?.type, 80);
    const targetType = upper(relation?.targetEntityType || relation?.target_entity_type || relation?.targetType, 80);
    if (relSet.size && !relSet.has(rel)) continue;
    if (targetSet.size && !targetSet.has(targetType)) continue;
    const targetId = clean(relation?.targetEntityId || relation?.target_entity_id || relation?.targetId, 120);
    const targetSlug = slugify(relation?.targetSlug || relation?.target_slug || relation?.targetName);
    const found = records.find(row => (targetId && row.id === targetId)
      || (targetSlug && slugify(row.slug || row.name || row.code) === targetSlug));
    if (found) return found;
  }
  return null;
}

function parentOf(records, record) {
  if (!record) return null;
  if (record.parentEntityId) {
    const direct = records.find(row => row.id === record.parentEntityId);
    if (direct) return direct;
  }
  return relationTarget(records, record, ["PARENT"], []);
}

function airportFor(records, record) {
  if (!record) return null;
  if (record.entityType === "AIRPORT") return record;
  const details = obj(record.details);
  const iata = upper(details.searchAirportIata || details.destinationIata || details.nearestAirportIata || details.arrivalAirportIata || details.iata, 3);
  if (iata) {
    const byCode = records.find(row => row.entityType === "AIRPORT" && upper(obj(row.details).iata || row.code, 3) === iata);
    if (byCode) return byCode;
  }
  const relation = relationTarget(records, record, ["NEAREST_AIRPORT", "ARRIVAL_AIRPORT", "AIRPORT"], ["AIRPORT"]);
  if (relation) return relation;
  const parent = parentOf(records, record);
  return parent && parent.id !== record.id ? airportFor(records, parent) : null;
}

function customerPath(record) {
  const details = obj(record.details);
  const commercial = obj(record.commercial);
  const explicit = clean(details.customerPath || details.customer_path || details.url || commercial.customerPath || commercial.customer_path, 1200);
  if (explicit?.startsWith("/")) return explicit;
  const slug = slugify(record.slug || record.name || record.code);
  if (record.entityType === "HOTEL") return `/hotel-detail?hotel=${encodeURIComponent(slug || record.id)}`;
  if (["COUNTRY", "DESTINATION", "AREA"].includes(record.entityType)) return `/destinations?${record.entityType.toLowerCase()}=${encodeURIComponent(slug)}`;
  return "/destinations";
}

function card(records, record, language = "EN") {
  const loc = localized(record, language);
  const details = obj(record.details);
  const commercial = obj(record.commercial);
  const airport = airportFor(records, record);
  const airportDetails = obj(airport?.details);
  const latitude = num(details.latitude ?? details.lat, NaN);
  const longitude = num(details.longitude ?? details.lng ?? details.lon, NaN);
  const price = num(commercial.fromPrice ?? commercial.from_price ?? details.fromPrice ?? details.from_price, 0);
  const currency = upper(commercial.currency || details.currency, 3);
  return {
    id: record.id,
    publicId: record.publicId,
    entityType: record.entityType,
    code: record.code,
    slug: record.slug || slugify(record.name),
    name: clean(loc.pageTitle || loc.page_title || record.name, 500),
    title: clean(loc.pageTitle || loc.page_title || record.name, 500),
    eyebrow: clean(loc.eyebrow, 300),
    description: clean(loc.shortDescription || loc.short_description || loc.description || details.shortDescription || details.short_description, 1500),
    image: mediaUrl(record),
    href: customerPath(record),
    fromPrice: price > 0 ? price : null,
    currency: currency || "",
    badges: arr(details.tags || commercial.tags).map(value => clean(value, 80)).filter(Boolean).slice(0, 8),
    duffelAccommodationId: clean(details.duffelAccommodationId || details.duffel_accommodation_id || commercial.duffelAccommodationId, 180),
    priceLookup: {
      latitude: Number.isFinite(latitude) ? latitude : undefined,
      longitude: Number.isFinite(longitude) ? longitude : undefined,
      iata: upper(airportDetails.iata || airport?.code || details.searchAirportIata, 3),
      destination: record.code || record.slug || record.name,
      label: record.name
    }
  };
}

function airportDto(record) {
  const details = obj(record.details);
  const iata = upper(details.iata || record.code, 3);
  return {
    id: record.id,
    type: "AIRPORT",
    iata,
    icao: upper(details.icao, 4),
    code: iata,
    title: clean(record.name, 500),
    name: clean(record.name, 500),
    city: clean(details.city || details.locationCity || details.location_city, 300),
    country: clean(details.country || details.countryCode || details.country_code, 200),
    label: [clean(details.city, 200), clean(record.name, 300), iata ? `(${iata})` : ""].filter(Boolean).join(" · ")
  };
}


async function readAirportFallback() {
  try {
    const rows = await restRequest({
      table: "travel_info_airports",
      query: {
        select: "*",
        order: "iata.asc",
        limit: 500
      }
    });
    return arr(rows).map(row => {
      const iata = upper(row.iata || row.code, 3);
      const title = clean(row.title || row.name || row.airport_name || row.airportName, 500);
      const city = clean(row.locationCity || row.location_city || row.city, 300);
      const country = clean(row.country || row.countryCode || row.country_code, 200);
      return {
        id: clean(row.id || row._id || iata, 120),
        type: "AIRPORT",
        iata,
        icao: upper(row.icao, 4),
        code: iata,
        title,
        name: title,
        city,
        country,
        label: [city, title, iata ? `(${iata})` : ""].filter(Boolean).join(" · ")
      };
    }).filter(row => row.iata);
  } catch (error) {
    console.warn("[homeContent] Airport fallback unavailable.", error?.message || error);
    return [];
  }
}

function destinationSearchDto(records, record) {
  const details = obj(record.details);
  const airport = airportFor(records, record);
  const airportDetails = obj(airport?.details);
  return {
    id: record.id,
    type: record.entityType,
    code: clean(record.code, 80),
    slug: record.slug || slugify(record.name),
    title: record.name,
    name: record.name,
    destinationCode: clean(record.code || record.slug, 160),
    iata: upper(airportDetails.iata || airport?.code || details.searchAirportIata, 3),
    label: [record.name, upper(airportDetails.iata || airport?.code, 3) ? `(${upper(airportDetails.iata || airport?.code, 3)})` : ""].filter(Boolean).join(" ")
  };
}

export async function getHomeContentCore(input = {}) {
  const language = upper(input.language || "EN", 12) || "EN";
  const records = await catalog(input.force === true);
  const visible = records.filter(row => !["HIDDEN", "ARCHIVED", "SUSPENDED"].includes(upper(obj(row.details).status, 30)));
  const featured = visible.filter(row => row.homepageFeatured || row.featured).sort((a, b) => a.sortPriority - b.sortPriority || a.name.localeCompare(b.name));
  let airports = visible.filter(row => row.entityType === "AIRPORT").map(airportDto);
  if (!airports.length) airports = await readAirportFallback();
  const searchDestinations = visible.filter(row => ["DESTINATION", "AREA"].includes(row.entityType)).map(row => destinationSearchDto(visible, row));
  const destinations = featured.filter(row => ["DESTINATION", "AREA", "COUNTRY"].includes(row.entityType)).slice(0, 12).map(row => card(visible, row, language));
  const hotels = featured.filter(row => row.entityType === "HOTEL").slice(0, 10).map(row => card(visible, row, language));
  const offers = featured.filter(row => ["PACKAGE", "GUIDED_TOUR", "ACTIVITY", "TRANSFER", "CAR_RENTAL"].includes(row.entityType)).slice(0, 12).map(row => card(visible, row, language));
  const inspiration = featured.filter(row => ["DESTINATION", "AREA", "COUNTRY", "GUIDED_TOUR", "ACTIVITY"].includes(row.entityType)).slice(0, 12).map(row => card(visible, row, language));
  return {
    source: "SUPABASE_PUBLIC_INVENTORY",
    protocolVersion: "BACKEND-BASE-1.0-B010",
    airports,
    searchDestinations,
    destinations,
    hotels,
    offers,
    inspiration,
    sync: {
      ok: true,
      fetchedAt: new Date().toISOString(),
      counts: { records: visible.length, airports: airports.length, destinations: searchDestinations.length, homepageDestinations: destinations.length, hotels: hotels.length, offers: offers.length }
    }
  };
}

export async function getHomeSearchLocationsCore(input = {}) {
  const content = await getHomeContentCore(input);
  return {
    source: content.source,
    airports: content.airports,
    destinations: content.searchDestinations,
    searchDestinations: content.searchDestinations,
    sync: content.sync
  };
}

export async function getOldStyleHomeContentCore(input = {}) {
  return getHomeContentCore(input);
}
