// /src/backend/SKANDI_CORE/cruises.js
// SKANDI Cruises — B-011.42
// Canonical public cruise catalogue core.
// Royal Caribbean sailing/pricing data is obtained server-side through Apify.
// SKANDI Inventory remains the optional public merchandising/editorial overlay.

import { secrets } from "wix-secrets-backend.v2";
import { elevate } from "wix-auth";
import { fetch } from "wix-fetch";
import { restRequest } from "backend/SKANDI_CORE/supabaseServer";

const APIFY_ACTOR = "sercul~royal-caribbean";
const APIFY_TOKEN_SECRET = "APIFY_API_TOKEN";
const APIFY_SYNC_URL = `https://api.apify.com/v2/actors/${APIFY_ACTOR}/run-sync-get-dataset-items`;
const PUBLIC_VIEW = "inventory_public_entities_v";
const PROVIDER_CACHE_TTL_MS = 15 * 60 * 1000;
const INVENTORY_CACHE_TTL_MS = 60 * 1000;
const PROVIDER_MAX_ROWS = 750;
const PROVIDER_TIMEOUT_SECONDS = 90;
const elevatedGetSecretValue = elevate(secrets.getSecretValue);

const SUPPORTED_REGIONS = new Set(["USA", "GBR", "AUS", "ITA", "DEU", "NLD", "CAN", "FRA", "IRL"]);
const REGION_CURRENCY = Object.freeze({ USA: "USD", GBR: "GBP", AUS: "AUD", ITA: "EUR", DEU: "EUR", NLD: "EUR", CAN: "CAD", FRA: "EUR", IRL: "EUR" });

const providerCache = new Map();
const providerInflight = new Map();
let inventoryCache = null;
let inventoryCacheExpiresAt = 0;
let inventoryInflight = null;

function clean(value, max = 5000) { return String(value ?? "").trim().slice(0, max); }
function upper(value, max = 80) { return clean(value, max).toUpperCase(); }
function arr(value) { return Array.isArray(value) ? value : []; }
function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
function bool(value) { return value === true || String(value || "").toLowerCase() === "true"; }
function finite(value, fallback = null) { const n = Number(value); return Number.isFinite(n) ? n : fallback; }
function unique(values) { return [...new Set(arr(values).map(v => clean(v, 600)).filter(Boolean))]; }
function slugify(value) {
  return clean(value, 400).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function isoDate(value) {
  const raw = clean(value, 80);
  const match = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : "";
}
function numericMoney(value) {
  if (typeof value === "number") return Number.isFinite(value) && value > 0 ? value : null;
  if (typeof value !== "string") return null;
  const normalized = value.replace(/[^0-9.,-]/g, "").replace(/,(?=\d{3}(?:\D|$))/g, "").replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) && n > 0 ? n : null;
}
function secretString(result) {
  if (typeof result === "string") return result.trim();
  return clean(result?.value ?? result?.secretValue ?? result?.secret?.value, 10000);
}
async function readSecret(name) {
  try { return secretString(await elevatedGetSecretValue(name)); }
  catch (_) { return ""; }
}
function publicError(code, message) {
  const error = new Error(message);
  error.code = code;
  error.publicMessage = message;
  return error;
}

function requestedRegion(input = {}) {
  const explicit = upper(input.region || input.providerRegion, 8);
  if (SUPPORTED_REGIONS.has(explicit)) return explicit;
  const currency = upper(input.currency || input.settings?.currency, 3);
  const language = upper(input.language || input.settings?.language, 8);
  if (currency === "SEK") return "SWE";
  if (currency === "NOK") return "NOR";
  if (currency === "DKK") return "DNK";
  if (currency === "EUR") {
    if (language === "DE") return "DEU";
    if (language === "FR") return "FRA";
    if (language === "IT") return "ITA";
    if (language === "NL") return "NLD";
    return "IRL";
  }
  return "USA";
}

function portLabel(value) {
  if (typeof value === "string") return clean(value, 240);
  const row = obj(value);
  return clean(row.name || row.portName || row.port_name || row.label || row.title || row.city || row.code || row.id, 240);
}
function portCode(value) {
  if (typeof value === "string") return "";
  const row = obj(value);
  return upper(row.code || row.portCode || row.port_code || row.id, 20);
}
function highlightLabel(value) {
  if (typeof value === "string") return clean(value, 300);
  const row = obj(value);
  return clean(row.title || row.name || row.label || row.text || row.description, 300);
}
function imageFromRow(row = {}) {
  return clean(row.itineraryImage || arr(row.rcItineraryImages)[0] || row.imageUrl || row.image, 1800);
}
function providerCurrency(row = {}) {
  const direct = upper(row.currency || obj(row.price).currency || obj(row.price).currencyCode || obj(row.price).currency_code, 3);
  if (direct) return direct;
  for (const key of Object.keys(row || {})) {
    const match = key.match(/^price_([A-Z]{3})_/i);
    if (match) return upper(match[1], 3);
  }
  return "";
}
function providerPrice(row = {}) {
  const price = obj(row.price);
  const directCandidates = [price.amount, price.value, price.price, price.currentPrice, price.current_price, price.lowestPrice, price.lowest_price, row.lowestPrice, row.lowest_price];
  for (const candidate of directCandidates) {
    const n = numericMoney(candidate);
    if (n) return n;
  }
  const dynamic = Object.entries(row || {})
    .filter(([key]) => /^price_[A-Z]{3}_[A-Z0-9]+$/i.test(key))
    .map(([, value]) => numericMoney(value)).filter(Boolean);
  if (dynamic.length) return Math.min(...dynamic);
  const organized = obj(row.organized_pricing);
  const tiers = obj(organized.tiers);
  const tierPrices = [];
  for (const tier of Object.values(tiers)) {
    const current = obj(tier);
    for (const key of ["price", "currentPrice", "current_price", "amount", "value"]) {
      const n = numericMoney(current[key]);
      if (n) tierPrices.push(n);
    }
  }
  return tierPrices.length ? Math.min(...tierPrices) : null;
}
function availabilityStatus(row = {}) {
  return upper(row.rcSailingStatus || row.availabilityStatus || row.availability_status, 80);
}
function soldOut(row = {}) {
  const status = availabilityStatus(row);
  return /(^|_)(SOLD.?OUT|CLOSED|UNAVAILABLE|CANCELLED|CANCELED)(_|$)/.test(status.replace(/\s+/g, "_"));
}
function destinationPairs(row = {}) {
  const names = unique([...(arr(row.destinationNames)), ...(arr(row.seaDestinations))]);
  const ids = arr(row.destinationIds).map(v => clean(v, 100));
  const length = Math.max(names.length, ids.length);
  const out = [];
  for (let i = 0; i < length; i += 1) {
    const title = names[i] || ids[i] || "";
    const id = ids[i] || slugify(title);
    if (title || id) out.push({ id, slug: slugify(title || id), title: title || id });
  }
  return out;
}
function itineraryFromRow(row = {}) {
  const detailed = arr(row.rcPortsDetailedInfo);
  const source = detailed.length ? detailed : arr(row.portsOfCall);
  if (source.length) {
    return source.slice(0, 40).map((entry, index) => {
      const item = obj(entry);
      const title = portLabel(entry) || `Stop ${index + 1}`;
      const day = finite(item.day ?? item.dayNumber ?? item.day_number, index + 1);
      const arrival = clean(item.arrivalTime || item.arrival_time || item.arrival, 60);
      const departure = clean(item.departureTime || item.departure_time || item.departure, 60);
      const detail = [arrival ? `Arrival ${arrival}` : "", departure ? `Departure ${departure}` : ""].filter(Boolean).join(" · ");
      return { day, title, detail };
    });
  }
  const sequence = clean(row.rcPortSequence, 2500);
  if (!sequence) return [];
  return sequence.split(/\s*(?:,|>|→|\|)\s*/).filter(Boolean).slice(0, 40).map((title, index) => ({ day: index + 1, title: clean(title, 240), detail: "" }));
}
function routeSummary(row = {}, itinerary = []) {
  const departure = portLabel(row.departurePort);
  const arrival = portLabel(row.arrivalPort);
  const stops = itinerary.map(item => item.title).filter(Boolean);
  const route = unique([departure, ...stops, arrival]).slice(0, 6);
  return route.join(" → ");
}
function providerKeys(row = {}) {
  return unique([row.cruiseId, row.itineraryId, row.masterCruise, row.rcGroupId]).map(v => v.toLowerCase());
}
function groupKey(row = {}) {
  const stable = clean(row.itineraryId || row.masterCruise || row.rcGroupId, 300);
  if (stable) return stable;
  return [clean(row.title, 300), clean(row.shipName, 200), String(row.sailingNights || row.rcTotalNights || ""), portLabel(row.departurePort), portLabel(row.arrivalPort)].join("|");
}
function sailingFromRow(row = {}, fallbackCurrency = "USD") {
  const serviceDate = isoDate(row.departureDate || row.rcSailDate);
  const amount = providerPrice(row);
  const currency = providerCurrency(row) || fallbackCurrency;
  const key = clean(row.cruiseId || row.rcGroupId || `${row.itineraryId || row.masterCruise || row.shipId || "sailing"}-${serviceDate || row.departureDate || "undated"}`, 500);
  return {
    id: `rc-sailing-${slugify(`${key}-${serviceDate || row.departureDate || "undated"}`) || "undated"}`,
    providerSailingId: clean(row.cruiseId || row.rcGroupId, 300),
    serviceDate,
    arrivalDate: isoDate(row.arrivalDate),
    variantName: clean(row.nightTitle || row.rcItineraryType, 300),
    soldOut: soldOut(row),
    availabilityKnown: false,
    available: null,
    status: availabilityStatus(row),
    departurePort: portLabel(row.departurePort),
    departurePortCode: portCode(row.departurePort),
    arrivalPort: portLabel(row.arrivalPort),
    arrivalPortCode: portCode(row.arrivalPort),
    publicPrice: amount,
    currency,
    priceBasis: "",
  };
}

function normalizeProviderRows(rows = [], fallbackCurrency = "USD") {
  const groups = new Map();
  for (const raw of arr(rows)) {
    const row = obj(raw);
    const key = groupKey(row);
    if (!key) continue;
    const itinerary = itineraryFromRow(row);
    const destinations = destinationPairs(row);
    const sailing = sailingFromRow(row, fallbackCurrency);
    let group = groups.get(key);
    if (!group) {
      const nights = finite(row.sailingNights ?? row.rcTotalNights ?? row.duration, 0) || 0;
      group = {
        id: `rc-${slugify(key) || slugify(row.title || row.cruiseId || row.itineraryId)}`,
        provider: "ROYAL_CARIBBEAN",
        providerKeys: providerKeys(row),
        cruiseLine: "Royal Caribbean",
        title: clean(row.title || `${nights || ""} Night Royal Caribbean Cruise`, 500),
        description: clean(row.description, 4000),
        summary: clean(row.description, 1200),
        imageUrl: imageFromRow(row),
        featured: false,
        searchPriority: 100,
        shipName: clean(row.shipName, 300),
        shipId: clean(row.shipId, 120),
        destinationLabel: destinations.map(d => d.title).filter(Boolean).slice(0, 3).join(" · "),
        destination: destinations[0] || null,
        area: destinations[1] || null,
        destinations,
        departurePort: portLabel(row.departurePort),
        arrivalPort: portLabel(row.arrivalPort),
        routeSummary: routeSummary(row, itinerary),
        nights,
        startDate: sailing.serviceDate,
        priceFrom: null,
        nextSailing: null,
        sailings: [],
        highlights: unique(arr(row.rcHighlights).map(highlightLabel)).slice(0, 20),
        itinerary,
        inclusions: [],
        bookingMessage: "Continue with SKANDI Support to plan this Royal Caribbean sailing.",
        sourceUpdatedAt: clean(row.date, 80)
      };
      groups.set(key, group);
    }
    group.providerKeys = unique([...group.providerKeys, ...providerKeys(row)]);
    if (!group.imageUrl) group.imageUrl = imageFromRow(row);
    if (!group.description) group.description = clean(row.description, 4000);
    if (!group.routeSummary) group.routeSummary = routeSummary(row, itinerary);
    if (!group.itinerary.length && itinerary.length) group.itinerary = itinerary;
    group.destinations = mergeDestinationPairs(group.destinations, destinations);
    group.destination = group.destinations[0] || group.destination;
    group.area = group.destinations[1] || group.area;
    group.destinationLabel = group.destinations.map(d => d.title).filter(Boolean).slice(0, 3).join(" · ");
    if (!group.sailings.some(existing => existing.id === sailing.id)) group.sailings.push(sailing);
  }

  const cruises = [...groups.values()];
  for (const cruise of cruises) {
    cruise.sailings.sort((a, b) => String(a.serviceDate || "9999").localeCompare(String(b.serviceDate || "9999")));
    const available = cruise.sailings.filter(s => !s.soldOut);
    cruise.nextSailing = available[0] || cruise.sailings[0] || null;
    cruise.startDate = cruise.nextSailing?.serviceDate || cruise.startDate || "";
    const priced = cruise.sailings.filter(s => Number.isFinite(Number(s.publicPrice)) && Number(s.publicPrice) > 0);
    if (priced.length) {
      const lowest = priced.reduce((best, current) => Number(current.publicPrice) < Number(best.publicPrice) ? current : best, priced[0]);
      cruise.priceFrom = { amount: Number(lowest.publicPrice), currency: lowest.currency || fallbackCurrency, basis: lowest.priceBasis || "" };
    }
  }
  cruises.sort((a, b) => String(a.nextSailing?.serviceDate || "9999").localeCompare(String(b.nextSailing?.serviceDate || "9999")) || a.title.localeCompare(b.title));
  return cruises;
}
function mergeDestinationPairs(a = [], b = []) {
  const map = new Map();
  for (const item of [...arr(a), ...arr(b)]) {
    const row = obj(item);
    const key = clean(row.id || row.slug || row.title, 200).toLowerCase();
    if (key && !map.has(key)) map.set(key, { id: clean(row.id || row.slug || row.title, 200), slug: clean(row.slug || slugify(row.title || row.id), 240), title: clean(row.title || row.id, 300) });
  }
  return [...map.values()];
}

function localized(record = {}, language = "EN") {
  const rows = arr(record.localized);
  const lang = upper(language, 12) || "EN";
  return rows.find(row => upper(row?.language, 12) === lang) || rows.find(row => upper(row?.language, 12) === "EN") || rows[0] || {};
}
function mediaUrl(record = {}) {
  for (const raw of arr(record.media)) {
    if (typeof raw === "string" && clean(raw, 1800)) return clean(raw, 1800);
    const row = obj(raw);
    const value = clean(row.url || row.publicUrl || row.public_url || row.assetUrl || row.asset_url || row.src, 1800);
    if (value) return value;
  }
  return "";
}
function inventoryCruiseMarker(record = {}) {
  const details = obj(record.details);
  const commercial = obj(record.commercial);
  const values = [details.packageType, details.package_type, details.productType, details.product_type, details.type, details.category, details.subtype, commercial.packageType, commercial.package_type, commercial.category];
  return values.some(value => upper(value, 120).includes("CRUISE"));
}
function inventoryProviderKeys(record = {}) {
  const details = obj(record.details);
  return unique([
    details.apifyCruiseId, details.apify_cruise_id, details.royalCaribbeanCruiseId, details.royal_caribbean_cruise_id,
    details.providerCruiseId, details.provider_cruise_id, details.cruiseId, details.cruise_id,
    details.itineraryId, details.itinerary_id, details.masterCruise, details.master_cruise, details.rcGroupId, details.rc_group_id
  ]).map(v => v.toLowerCase());
}
function mapInventoryRecord(row = {}) {
  return {
    id: clean(row.id, 120), publicId: clean(row.public_id, 160), code: clean(row.code, 120), name: clean(row.name, 500), slug: clean(row.slug, 240),
    featured: row.featured === true, homepageFeatured: row.homepage_featured === true, sortPriority: finite(row.sort_priority, 100),
    details: obj(row.details), commercial: obj(row.commercial), localized: arr(row.localized), media: arr(row.media), updatedAt: row.updated_at || null
  };
}
async function readInventoryCruises() {
  const rows = await restRequest({
    table: PUBLIC_VIEW,
    query: {
      select: "id,public_id,entity_type,code,name,slug,featured,homepage_featured,sort_priority,details,commercial,localized,media,updated_at",
      entity_type: "eq.PACKAGE",
      order: "sort_priority.asc,name.asc",
      limit: 2000
    }
  });
  return arr(rows).map(mapInventoryRecord).filter(inventoryCruiseMarker);
}
async function inventoryCruises(force = false) {
  if (!force && inventoryCache && Date.now() < inventoryCacheExpiresAt) return inventoryCache;
  if (!inventoryInflight) {
    inventoryInflight = readInventoryCruises().then(rows => {
      inventoryCache = rows;
      inventoryCacheExpiresAt = Date.now() + INVENTORY_CACHE_TTL_MS;
      return rows;
    }).finally(() => { inventoryInflight = null; });
  }
  return inventoryInflight;
}
function overlayCruise(cruise, record, language) {
  const loc = localized(record, language);
  const details = record.details;
  const commercial = record.commercial;
  const title = clean(loc.pageTitle || loc.page_title || details.publicTitle || details.public_title || record.name, 500);
  const description = clean(loc.description || loc.shortDescription || loc.short_description || details.description || details.shortDescription || details.short_description, 4000);
  const image = mediaUrl(record);
  return {
    ...cruise,
    title: title || cruise.title,
    description: description || cruise.description,
    summary: clean(loc.shortDescription || loc.short_description || description, 1200) || cruise.summary,
    imageUrl: image || cruise.imageUrl,
    featured: record.featured || record.homepageFeatured || cruise.featured,
    searchPriority: Number.isFinite(Number(record.sortPriority)) ? Number(record.sortPriority) : cruise.searchPriority,
    highlights: unique([...(arr(details.highlights)), ...cruise.highlights]).slice(0, 20),
    inclusions: unique([...(arr(details.inclusions)), ...(arr(commercial.inclusions)), ...cruise.inclusions]).slice(0, 30),
    bookingMessage: clean(details.bookingMessage || details.booking_message, 1000) || cruise.bookingMessage,
    inventoryId: record.id,
    inventoryPublicId: record.publicId,
    inventoryCode: record.code,
    inventorySlug: record.slug,
    inventoryUpdatedAt: record.updatedAt
  };
}
function inventoryOnlyCruise(record, language, fallbackCurrency) {
  const loc = localized(record, language);
  const d = record.details;
  const c = record.commercial;
  const destinationTitle = clean(d.destinationLabel || d.destination_label || d.destination || d.area, 300);
  const destinationId = clean(d.destinationId || d.destination_id || slugify(destinationTitle), 200);
  const departurePort = clean(d.departurePort || d.departure_port, 300);
  const arrivalPort = clean(d.arrivalPort || d.arrival_port, 300);
  const price = numericMoney(c.fromPrice ?? c.from_price ?? d.fromPrice ?? d.from_price);
  const currency = upper(c.currency || d.currency || fallbackCurrency, 3) || fallbackCurrency;
  const nights = finite(d.nights ?? d.durationNights ?? d.duration_nights, 0) || 0;
  const destination = destinationTitle || destinationId ? { id: destinationId || slugify(destinationTitle), slug: slugify(destinationTitle || destinationId), title: destinationTitle || destinationId } : null;
  return {
    id: `inventory-${record.publicId || record.id}`,
    provider: "SKANDI_INVENTORY",
    providerKeys: inventoryProviderKeys(record),
    cruiseLine: clean(d.cruiseLine || d.cruise_line, 300) || "SKANDI Cruise",
    title: clean(loc.pageTitle || loc.page_title || record.name, 500),
    description: clean(loc.description || loc.shortDescription || loc.short_description || d.description, 4000),
    summary: clean(loc.shortDescription || loc.short_description || d.summary || d.description, 1200),
    imageUrl: mediaUrl(record),
    featured: record.featured || record.homepageFeatured,
    searchPriority: record.sortPriority,
    shipName: clean(d.shipName || d.ship_name, 300),
    shipId: clean(d.shipId || d.ship_id, 120),
    destinationLabel: destination?.title || "",
    destination,
    area: null,
    destinations: destination ? [destination] : [],
    departurePort,
    arrivalPort,
    routeSummary: clean(d.routeSummary || d.route_summary, 1200) || [departurePort, arrivalPort].filter(Boolean).join(" → "),
    nights,
    startDate: isoDate(d.startDate || d.start_date),
    priceFrom: price ? { amount: price, currency, basis: clean(c.priceBasis || c.price_basis || d.priceBasis || d.price_basis, 80) } : null,
    nextSailing: null,
    sailings: [],
    highlights: unique(arr(d.highlights)).slice(0, 20),
    itinerary: arr(d.itinerary).slice(0, 40),
    inclusions: unique([...(arr(d.inclusions)), ...(arr(c.inclusions))]).slice(0, 30),
    bookingMessage: clean(d.bookingMessage || d.booking_message, 1000) || "Contact SKANDI Support for current sailing availability.",
    inventoryId: record.id,
    inventoryPublicId: record.publicId,
    inventoryCode: record.code,
    inventorySlug: record.slug,
    inventoryUpdatedAt: record.updatedAt
  };
}
function applyInventoryOverlays(cruises, inventoryRecords, language, fallbackCurrency) {
  const remaining = new Set(inventoryRecords.map(record => record.id));
  const output = cruises.map(cruise => {
    const keys = new Set(arr(cruise.providerKeys).map(v => String(v).toLowerCase()));
    const match = inventoryRecords.find(record => inventoryProviderKeys(record).some(key => keys.has(key)));
    if (!match) return cruise;
    remaining.delete(match.id);
    return overlayCruise(cruise, match, language);
  });
  for (const record of inventoryRecords) {
    if (remaining.has(record.id)) output.push(inventoryOnlyCruise(record, language, fallbackCurrency));
  }
  output.sort((a, b) => Number(b.featured) - Number(a.featured) || (a.searchPriority || 100) - (b.searchPriority || 100) || String(a.nextSailing?.serviceDate || a.startDate || "9999").localeCompare(String(b.nextSailing?.serviceDate || b.startDate || "9999")));
  return output;
}

async function runRoyalCaribbeanActor({ region, force = false } = {}) {
  const key = region;
  const cached = providerCache.get(key);
  if (!force && cached && Date.now() < cached.expiresAt) return cached.rows;
  if (!providerInflight.has(key)) {
    providerInflight.set(key, (async () => {
      const token = await readSecret(APIFY_TOKEN_SECRET);
      if (!token) throw publicError("CRUISES_APIFY_TOKEN_MISSING", "Cruise data is not connected yet. Add the APIFY_API_TOKEN Wix secret to enable Royal Caribbean sailings.");
      const query = `timeout=${PROVIDER_TIMEOUT_SECONDS}&maxItems=${PROVIDER_MAX_ROWS}`;
      const response = await fetch(`${APIFY_SYNC_URL}?${query}`, {
        method: "post",
        headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          region,
          maxRows: PROVIDER_MAX_ROWS,
          maxRequestRetries: 3,
          minConcurrency: 1,
          maxConcurrency: 10,
          requestHandlerTimeoutSecs: 30,
          useApifyProxy: false
        })
      });
      let payload;
      try { payload = await response.json(); } catch (_) { payload = null; }
      if (!response.ok) {
        const providerMessage = clean(payload?.error?.message || payload?.message || payload?.error, 600);
        const code = response.status === 408 ? "CRUISES_PROVIDER_TIMEOUT" : response.status === 401 || response.status === 403 ? "CRUISES_PROVIDER_AUTH" : response.status === 429 ? "CRUISES_PROVIDER_RATE_LIMIT" : "CRUISES_PROVIDER_ERROR";
        throw publicError(code, providerMessage || "Royal Caribbean cruise data could not be refreshed right now.");
      }
      const rows = Array.isArray(payload) ? payload : arr(payload?.data?.items || payload?.items);
      providerCache.set(key, { rows, expiresAt: Date.now() + PROVIDER_CACHE_TTL_MS });
      return rows;
    })().finally(() => providerInflight.delete(key)));
  }
  return providerInflight.get(key);
}

function filtersFromCruises(cruises = []) {
  const destinationMap = new Map();
  const ports = new Set();
  const months = new Set();
  const nights = new Set();
  for (const cruise of cruises) {
    for (const destination of arr(cruise.destinations?.length ? cruise.destinations : [cruise.destination, cruise.area].filter(Boolean))) {
      const row = obj(destination);
      const id = clean(row.id || row.slug || row.title, 200);
      const title = clean(row.title || row.id, 300);
      if (id && title && !destinationMap.has(id)) destinationMap.set(id, { id, slug: clean(row.slug || slugify(title), 240), title });
    }
    if (clean(cruise.departurePort, 300)) ports.add(clean(cruise.departurePort, 300));
    if (Number(cruise.nights) > 0) nights.add(Number(cruise.nights));
    for (const sailing of arr(cruise.sailings)) {
      if (clean(sailing.departurePort, 300)) ports.add(clean(sailing.departurePort, 300));
      const date = isoDate(sailing.serviceDate);
      if (date) months.add(date.slice(0, 7));
    }
    const start = isoDate(cruise.startDate);
    if (start) months.add(start.slice(0, 7));
  }
  return {
    destinations: [...destinationMap.values()].sort((a, b) => a.title.localeCompare(b.title)),
    ports: [...ports].sort((a, b) => a.localeCompare(b)),
    months: [...months].sort(),
    nights: [...nights].sort((a, b) => a - b)
  };
}
function countsFromCruises(cruises = []) {
  const destinations = new Set();
  let sailings = 0;
  for (const cruise of cruises) {
    sailings += arr(cruise.sailings).length;
    for (const destination of arr(cruise.destinations)) {
      const id = clean(destination?.id || destination?.title, 200);
      if (id) destinations.add(id);
    }
  }
  return { cruises: cruises.length, sailings, destinations: destinations.size };
}

async function buildBootstrap(input = {}, { forceProvider = false } = {}) {
  const language = upper(input.language || input.settings?.language, 8) || "EN";
  const requestedCurrency = upper(input.currency || input.settings?.currency, 3) || "USD";
  const region = requestedRegion(input);
  const providerCurrencyCode = REGION_CURRENCY[region] || "USD";
  const [inventoryRecords, providerResult] = await Promise.all([
    inventoryCruises(false).catch(() => []),
    runRoyalCaribbeanActor({ region, force: forceProvider }).then(rows => ({ rows, error: null })).catch(error => ({ rows: [], error }))
  ]);

  let cruises = normalizeProviderRows(providerResult.rows, providerCurrencyCode);
  cruises = applyInventoryOverlays(cruises, inventoryRecords, language, providerCurrencyCode);
  if (!cruises.length && providerResult.error) throw providerResult.error;

  const notice = providerResult.error
    ? "Live Royal Caribbean data is temporarily unavailable. Showing published SKANDI cruise content only."
    : inventoryRecords.length
      ? "Royal Caribbean sailing data is live. SKANDI Inventory merchandising overrides are applied where configured."
      : "Royal Caribbean sailing data is live. No SKANDI Inventory cruise merchandising overrides are currently published.";

  return {
    version: "B-011.42",
    settings: { language, currency: providerCurrencyCode, requestedCurrency, providerRegion: region },
    query: obj(input.query),
    cruises,
    filters: filtersFromCruises(cruises),
    counts: countsFromCruises(cruises),
    generatedAt: new Date().toISOString(),
    notice,
    source: { kind: "ROYAL_CARIBBEAN_LIVE", inventoryOverlay: inventoryRecords.length > 0 }
  };
}

export async function getCruisesBootstrapCore(input = {}) {
  return buildBootstrap(input, { forceProvider: false });
}

export async function refreshCruisesCore(input = {}) {
  return buildBootstrap(input, { forceProvider: true });
}
