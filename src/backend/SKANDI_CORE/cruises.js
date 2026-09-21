// /src/backend/SKANDI_CORE/cruises.js
// SKANDI Cruises — B-011.44 Travel Info
// Canonical customer cruise catalogue core.
// Supabase Travel Info is the operational source of truth.
// Royal Caribbean/Apify is an upstream server-side synchronization provider only.

import { secrets } from "wix-secrets-backend.v2";
import { elevate } from "wix-auth";
import { fetch } from "wix-fetch";
import { restRequest } from "backend/SKANDI_CORE/supabaseServer";

const TABLES = Object.freeze({
  cruises: "travel_info_cruises",
  sailings: "travel_info_cruise_sailings",
  syncRuns: "travel_info_cruise_sync_runs"
});

const APIFY_ACTOR = "sercul~royal-caribbean";
const APIFY_TOKEN_SECRET = "APIFY_API_TOKEN";
const APIFY_SYNC_URL = `https://api.apify.com/v2/actors/${APIFY_ACTOR}/run-sync-get-dataset-items`;
const PROVIDER = "ROYAL_CARIBBEAN";
const PROVIDER_MAX_ROWS = 750;
const PROVIDER_SYNC_TIMEOUT_SECONDS = 300; // Apify sync endpoint hard limit.
const PROVIDER_MEMORY_MB = 512;
const PROVIDER_BUILD = "latest";
const PROVIDER_MAX_REQUEST_RETRIES = 5;
const PROVIDER_MIN_CONCURRENCY = 1;
const PROVIDER_MAX_CONCURRENCY = 10;
const PROVIDER_HANDLER_TIMEOUT_SECONDS = 30;
const PROVIDER_USE_APIFY_PROXY = true;
const PROVIDER_PROXY_GROUPS = Object.freeze(["RESIDENTIAL"]);
const EMPTY_SEED_COOLDOWN_MS = 15 * 60 * 1000;
const elevatedGetSecretValue = elevate(secrets.getSecretValue);

const SUPPORTED_REGIONS = new Set(["USA", "GBR", "AUS", "ITA", "DEU", "NLD", "CAN", "FRA", "IRL"]);
const REGION_CURRENCY = Object.freeze({
  USA: "USD", GBR: "GBP", AUS: "AUD", ITA: "EUR", DEU: "EUR",
  NLD: "EUR", CAN: "CAD", FRA: "EUR", IRL: "EUR"
});

const SUPPORTED_DESTINATIONS = new Set([
  "ALCAN", "FAR.E", "AUSTL", "BAHAM", "BERMU", "ATLCO", "CARIB", "EUROP",
  "HAWAI", "MEXCO", "PACIF", "T.PAN", "ISLAN", "SOPAC", "T.ATL", "TPACI"
]);
const SUPPORTED_DEPARTURE_PORTS = new Set([
  "MIA", "FLL", "PCN", "TPA", "GAL", "MSY", "SJU", "BOS", "BYE", "BWI",
  "SEA", "LAX", "SAN", "HNL", "STH", "BCN", "ROM", "BLQ", "TRS", "ATH",
  "CTG", "LIS", "SYD", "BNE", "SIN", "HKG", "BAO", "YOK", "YVR", "SWD",
  "ONX", "CPT", "IST"
]);

const syncInflight = new Map();

function clean(value, max = 5000) { return String(value ?? "").trim().slice(0, max); }
function upper(value, max = 80) { return clean(value, max).toUpperCase(); }
function arr(value) { return Array.isArray(value) ? value : []; }
function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
function finite(value, fallback = null) { const n = Number(value); return Number.isFinite(n) ? n : fallback; }
function unique(values) { return [...new Set(arr(values).map(value => clean(value, 600)).filter(Boolean))]; }
function nowIso() { return new Date().toISOString(); }
function todayIso() { return nowIso().slice(0, 10); }
function qeq(value) { return `eq.${clean(value, 1000)}`; }

function slugify(value) {
  return clean(value, 1200).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function fnv1a(value) {
  let hash = 0x811c9dc5;
  for (const char of String(value || "")) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(36);
}
function stableToken(value, prefix = "item") {
  const raw = clean(value, 3000) || prefix;
  const slug = slugify(raw).slice(0, 92) || prefix;
  return `${slug}-${fnv1a(raw)}`;
}
function isoDate(value) {
  const raw = clean(value, 80);
  const match = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : "";
}
function numericMoney(value) {
  if (typeof value === "number") return Number.isFinite(value) && value >= 0 ? value : null;
  if (typeof value !== "string") return null;
  const normalized = value.replace(/[^0-9.,-]/g, "").replace(/,(?=\d{3}(?:\D|$))/g, "").replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) && n >= 0 ? n : null;
}
function publicError(code, message) {
  const error = new Error(message);
  error.code = code;
  error.publicMessage = message;
  return error;
}
function secretString(result) {
  if (typeof result === "string") return result.trim();
  return clean(result?.value ?? result?.secretValue ?? result?.secret?.value, 10000);
}
async function readSecret(name) {
  try { return secretString(await elevatedGetSecretValue(name)); }
  catch (_) { return ""; }
}

function requestedRegion(input = {}) {
  const explicit = upper(input.region || input.providerRegion, 8);
  if (SUPPORTED_REGIONS.has(explicit)) return explicit;
  const currency = upper(input.currency || input.settings?.currency, 3);
  const language = upper(input.language || input.settings?.language, 8);
  if (currency === "GBP") return "GBR";
  if (currency === "AUD") return "AUS";
  if (currency === "CAD") return "CAN";
  if (currency === "EUR") {
    if (language === "DE") return "DEU";
    if (language === "FR") return "FRA";
    if (language === "IT") return "ITA";
    if (language === "NL") return "NLD";
    return "IRL";
  }
  return "USA";
}

function supportedCodes(values, allowed) {
  return unique(arr(values).map(value => upper(value, 20))).filter(code => allowed.has(code));
}
function providerFilters(input = {}) {
  const query = obj(input.query);
  const explicitDestinations = [
    ...arr(input.destinations),
    ...arr(input.provider?.destinations),
    query.destination
  ];
  const explicitPorts = [
    ...arr(input.departurePorts),
    ...arr(input.provider?.departurePorts),
    query.departurePort
  ];
  return {
    destinations: supportedCodes(explicitDestinations, SUPPORTED_DESTINATIONS),
    departurePorts: supportedCodes(explicitPorts, SUPPORTED_DEPARTURE_PORTS)
  };
}
function providerActorInput(region, input = {}) {
  const filters = providerFilters(input);
  const body = {
    region,
    maxRows: PROVIDER_MAX_ROWS,
    maxRequestRetries: PROVIDER_MAX_REQUEST_RETRIES,
    minConcurrency: PROVIDER_MIN_CONCURRENCY,
    maxConcurrency: PROVIDER_MAX_CONCURRENCY,
    requestHandlerTimeoutSecs: PROVIDER_HANDLER_TIMEOUT_SECONDS,
    useApifyProxy: PROVIDER_USE_APIFY_PROXY,
    apifyProxyGroups: [...PROVIDER_PROXY_GROUPS]
  };
  if (filters.destinations.length) body.destinations = filters.destinations;
  if (filters.departurePorts.length) body.departurePorts = filters.departurePorts;
  return body;
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
function dynamicMoneyValues(row, prefix, currency = "") {
  const wanted = upper(currency, 3);
  return Object.entries(obj(row)).filter(([key]) => {
    const match = key.match(new RegExp(`^${prefix}_([A-Z]{3})_[A-Z0-9]+$`, "i"));
    return match && (!wanted || upper(match[1], 3) === wanted);
  }).map(([, value]) => numericMoney(value)).filter(value => value !== null);
}
function providerPrice(row = {}) {
  const price = obj(row.price);
  const directCandidates = [price.amount, price.value, price.price, price.currentPrice, price.current_price, price.lowestPrice, price.lowest_price, row.lowestPrice, row.lowest_price];
  for (const candidate of directCandidates) {
    const n = numericMoney(candidate);
    if (n !== null && n > 0) return n;
  }
  const currency = providerCurrency(row);
  const dynamic = dynamicMoneyValues(row, "price", currency).filter(value => value > 0);
  if (dynamic.length) return Math.min(...dynamic);
  const tiers = obj(obj(row.organized_pricing).tiers);
  const tierPrices = [];
  for (const tier of Object.values(tiers)) {
    const current = obj(tier);
    for (const key of ["price", "currentPrice", "current_price", "amount", "value"]) {
      const n = numericMoney(current[key]);
      if (n !== null && n > 0) tierPrices.push(n);
    }
  }
  return tierPrices.length ? Math.min(...tierPrices) : null;
}
function providerOriginalPrice(row = {}) {
  const currency = providerCurrency(row);
  const dynamic = dynamicMoneyValues(row, "originalPrice", currency).filter(value => value > 0);
  if (dynamic.length) return Math.min(...dynamic);
  const tiers = obj(obj(row.organized_pricing).tiers);
  const values = Object.values(tiers).map(tier => numericMoney(obj(tier).originalPrice)).filter(value => value !== null && value > 0);
  return values.length ? Math.min(...values) : null;
}
function providerDiscount(row = {}) {
  const currency = providerCurrency(row);
  const dynamic = dynamicMoneyValues(row, "discount", currency).filter(value => value > 0);
  if (dynamic.length) return Math.max(...dynamic);
  const tiers = obj(obj(row.organized_pricing).tiers);
  const values = Object.values(tiers).map(tier => numericMoney(obj(tier).discountAmount)).filter(value => value !== null && value > 0);
  return values.length ? Math.max(...values) : null;
}
function availabilityStatus(row = {}) {
  return upper(row.rcSailingStatus || row.availabilityStatus || row.availability_status, 80) || "UNKNOWN";
}
function soldOut(row = {}) {
  const status = availabilityStatus(row).replace(/\s+/g, "_");
  return /(^|_)(SOLD.?OUT|CLOSED|UNAVAILABLE|CANCELLED|CANCELED)(_|$)/.test(status);
}
function destinationPairs(row = {}) {
  const names = unique([...(arr(row.destinationNames)), ...(arr(row.seaDestinations))]);
  const ids = arr(row.destinationIds).map(value => clean(value, 100));
  const length = Math.max(names.length, ids.length);
  const out = [];
  for (let index = 0; index < length; index += 1) {
    const title = names[index] || ids[index] || "";
    const id = ids[index] || slugify(title);
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
  return sequence.split(/\s*(?:,|>|→|\|)\s*/).filter(Boolean).slice(0, 40).map((title, index) => ({
    day: index + 1,
    title: clean(title, 240),
    detail: ""
  }));
}
function routeSummaryFromParts(departure, itinerary, arrival) {
  return unique([departure, ...arr(itinerary).map(item => item?.title), arrival]).slice(0, 6).join(" → ");
}
function groupKey(row = {}) {
  const stable = clean(row.itineraryId || row.masterCruise || row.rcGroupId, 300);
  if (stable) return stable;
  return [clean(row.title, 300), clean(row.shipName, 200), String(row.sailingNights || row.rcTotalNights || ""), portLabel(row.departurePort), portLabel(row.arrivalPort)].join("|");
}
function providerItineraryId(row = {}) {
  return clean(row.itineraryId || row.masterCruise || row.rcGroupId || groupKey(row), 500);
}
function providerCruiseId(row = {}) {
  return clean(row.masterCruise || row.rcGroupId || row.cruiseId, 500);
}
function sailingProviderId(row = {}) {
  return clean(row.cruiseId || row.rcGroupId || `${providerItineraryId(row)}-${isoDate(row.departureDate || row.rcSailDate)}`, 500);
}
function cruiseRecordId(region, row = {}) {
  return `RC-${region}-${stableToken(providerItineraryId(row), "cruise")}`.toUpperCase();
}
function sailingRecordId(region, row = {}) {
  const key = `${sailingProviderId(row)}|${isoDate(row.departureDate || row.rcSailDate)}|${providerItineraryId(row)}`;
  return `RC-${region}-SAIL-${stableToken(key, "sailing")}`.toUpperCase();
}
function compactProviderPayload(row = {}) {
  return {
    platform: clean(row.platform, 120) || null,
    company: clean(row.company, 120) || null,
    itineraryURL: clean(row.itineraryURL, 1800) || null,
    visitingCountries: clean(row.visitingCountries, 1200) || null,
    nightTitle: clean(row.nightTitle, 300) || null,
    rcItineraryType: clean(row.rcItineraryType, 300) || null,
    rcPortSequence: clean(row.rcPortSequence, 2500) || null,
    scrapeDate: clean(row.date, 120) || null
  };
}

function normalizeProviderRows(rows = [], region = "USA") {
  const groups = new Map();
  const fallbackCurrency = REGION_CURRENCY[region] || "USD";
  for (const raw of arr(rows)) {
    const row = obj(raw);
    const departureDate = isoDate(row.departureDate || row.rcSailDate);
    if (!departureDate) continue;
    const key = groupKey(row);
    if (!key) continue;
    const destinations = destinationPairs(row);
    const itinerary = itineraryFromRow(row);
    const departurePortName = portLabel(row.departurePort);
    const arrivalPortName = portLabel(row.arrivalPort);
    const price = providerPrice(row);
    const currency = providerCurrency(row) || fallbackCurrency;
    const sailing = {
      recordId: sailingRecordId(region, row),
      providerSailingId: sailingProviderId(row),
      providerGroupId: clean(row.rcGroupId, 500),
      serviceDate: departureDate,
      returnDate: isoDate(row.arrivalDate),
      departurePortCode: portCode(row.departurePort),
      departurePortName,
      arrivalPortCode: portCode(row.arrivalPort),
      arrivalPortName,
      status: availabilityStatus(row),
      soldOut: soldOut(row),
      currency,
      publicPrice: price,
      originalPrice: providerOriginalPrice(row),
      discountAmount: providerDiscount(row),
      organizedPricing: obj(row.organized_pricing),
      stateroomClasses: arr(row.rcStateroomClasses),
      serviceCharges: arr(row.serviceCharges),
      portCharges: obj(row.portCharges),
      bookingUrl: clean(row.rcBookingLink, 1800),
      sourceUrl: clean(row.source_url || row.rcProductViewLink || row.itineraryURL, 1800),
      locale: clean(row.locale, 40),
      providerUpdatedAt: clean(row.date, 120),
      providerPayload: compactProviderPayload(row)
    };
    let group = groups.get(key);
    if (!group) {
      const nights = finite(row.sailingNights ?? row.rcTotalNights ?? row.duration, 0) || 0;
      group = {
        recordId: cruiseRecordId(region, row),
        providerCruiseId: providerCruiseId(row),
        providerItineraryId: providerItineraryId(row),
        title: clean(row.title, 500) || `${clean(row.shipName, 250) || "Royal Caribbean"} cruise`,
        slug: slugify(clean(row.title, 500) || `${row.shipName || "royal-caribbean"}-${key}`),
        cruiseLine: "Royal Caribbean International",
        shipName: clean(row.shipName, 300),
        shipCode: clean(row.shipId, 120),
        destinations,
        departurePortCode: portCode(row.departurePort),
        departurePortName,
        arrivalPortCode: portCode(row.arrivalPort),
        arrivalPortName,
        nights,
        summary: clean(row.description, 1200),
        description: clean(row.description, 5000),
        imageUrl: imageFromRow(row),
        gallery: unique([imageFromRow(row), ...arr(row.rcItineraryImages)]).filter(Boolean),
        highlights: unique(arr(row.rcHighlights).map(highlightLabel)).slice(0, 30),
        inclusions: [],
        itinerary,
        bookingUrl: clean(row.rcBookingLink, 1800),
        productUrl: clean(row.rcProductViewLink || row.itineraryURL, 1800),
        sourceUrl: clean(row.source_url, 1800),
        currency,
        locale: clean(row.locale, 40),
        providerUpdatedAt: clean(row.date, 120),
        providerPayload: compactProviderPayload(row),
        sailings: []
      };
      groups.set(key, group);
    }
    group.sailings.push(sailing);
    group.gallery = unique([...group.gallery, ...arr(row.rcItineraryImages), imageFromRow(row)]).filter(Boolean);
    group.highlights = unique([...group.highlights, ...arr(row.rcHighlights).map(highlightLabel)]).slice(0, 30);
    if (!group.description && row.description) group.description = clean(row.description, 5000);
    if (!group.imageUrl) group.imageUrl = imageFromRow(row);
  }
  return [...groups.values()].map(group => {
    group.sailings.sort((a, b) => a.serviceDate.localeCompare(b.serviceDate));
    return group;
  });
}

async function insertSyncRun(region, input = {}) {
  const actorInput = providerActorInput(region, input);
  const rows = await restRequest({
    table: TABLES.syncRuns,
    method: "POST",
    body: {
      provider: PROVIDER,
      region,
      status: "STARTED",
      input: {
        ...actorInput,
        reason: clean(input.reason, 120) || "SYNC"
      },
      metadata: {
        actor: "sercul/royal-caribbean",
        version: "B-011.44",
        runOptions: {
          build: PROVIDER_BUILD,
          timeoutSeconds: PROVIDER_SYNC_TIMEOUT_SECONDS,
          memoryMb: PROVIDER_MEMORY_MB,
          maximumCostPerRun: "UNLIMITED"
        },
        omittedWhenEmpty: ["proxyUrl", "apifyProxyCountryCode", "destinations", "departurePorts"]
      }
    }
  });
  return arr(rows)[0] || null;
}
async function finishSyncRun(id, body) {
  if (!id) return;
  await restRequest({ table: TABLES.syncRuns, method: "PATCH", query: { id: qeq(id) }, body });
}
async function lastSyncRun(region) {
  const rows = await restRequest({
    table: TABLES.syncRuns,
    query: {
      select: "id,status,started_at,completed_at,error_code,error_message",
      provider: qeq(PROVIDER),
      region: qeq(region),
      order: "started_at.desc",
      limit: "1"
    }
  });
  return arr(rows)[0] || null;
}
async function recentSyncAttempt(region) {
  const row = await lastSyncRun(region).catch(() => null);
  if (!row?.started_at) return null;
  const time = new Date(row.started_at).getTime();
  return Number.isFinite(time) && Date.now() - time < EMPTY_SEED_COOLDOWN_MS ? row : null;
}

async function runRoyalCaribbeanActor(region, input = {}) {
  const token = await readSecret(APIFY_TOKEN_SECRET);
  if (!token) throw publicError("CRUISES_APIFY_TOKEN_MISSING", "Cruise synchronization is not connected yet. Add the APIFY_API_TOKEN Wix secret.");
  const runUrl = `${APIFY_SYNC_URL}?timeout=${PROVIDER_SYNC_TIMEOUT_SECONDS}&memory=${PROVIDER_MEMORY_MB}&maxItems=${PROVIDER_MAX_ROWS}&build=${encodeURIComponent(PROVIDER_BUILD)}`;
  const response = await fetch(runUrl, {
    method: "post",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(providerActorInput(region, input))
  });
  let payload = null;
  try { payload = await responseon(); } catch (_) { payload = null; }
  if (!response.ok) {
    const providerMessage = clean(payload?.error?.message || payload?.message || payload?.error, 600);
    const code = response.status === 408 ? "CRUISES_PROVIDER_TIMEOUT"
      : response.status === 401 || response.status === 403 ? "CRUISES_PROVIDER_AUTH"
      : response.status === 429 ? "CRUISES_PROVIDER_RATE_LIMIT"
      : "CRUISES_PROVIDER_ERROR";
    throw publicError(code, providerMessage || "Royal Caribbean cruise data could not be synchronized right now.");
  }
  return Array.isArray(payload) ? payload : arr(payload?.data?.items || payload?.items);
}

function cruiseDbRow(cruise, region, syncedAt) {
  return {
    record_id: cruise.recordId,
    provider: PROVIDER,
    provider_cruise_id: cruise.providerCruiseId || null,
    provider_itinerary_id: cruise.providerItineraryId || null,
    title: cruise.title,
    slug: cruise.slug || null,
    cruise_line: cruise.cruiseLine,
    ship_name: cruise.shipName || null,
    ship_code: cruise.shipCode || null,
    destination_codes: cruise.destinations.map(item => clean(item.id, 120)).filter(Boolean),
    destination_names: cruise.destinations.map(item => clean(item.title, 300)).filter(Boolean),
    departure_port_code: cruise.departurePortCode || null,
    departure_port_name: cruise.departurePortName || null,
    arrival_port_code: cruise.arrivalPortCode || null,
    arrival_port_name: cruise.arrivalPortName || null,
    nights: cruise.nights || null,
    summary: cruise.summary || null,
    description: cruise.description || null,
    image_url: cruise.imageUrl || null,
    gallery: cruise.gallery,
    highlights: cruise.highlights,
    inclusions: cruise.inclusions,
    itinerary: cruise.itinerary,
    booking_url: cruise.bookingUrl || null,
    product_url: cruise.productUrl || null,
    source_url: cruise.sourceUrl || null,
    region,
    locale: cruise.locale || null,
    currency: cruise.currency || REGION_CURRENCY[region] || null,
    provider_payload: cruise.providerPayload,
    provider_updated_at: cruise.providerUpdatedAt || null,
    last_synced_at: syncedAt
  };
}
function sailingDbRow(cruiseId, sailing, region, syncedAt) {
  return {
    cruise_id: cruiseId,
    record_id: sailing.recordId,
    provider: PROVIDER,
    provider_sailing_id: sailing.providerSailingId || null,
    provider_group_id: sailing.providerGroupId || null,
    service_date: sailing.serviceDate,
    return_date: sailing.returnDate || null,
    departure_port_code: sailing.departurePortCode || null,
    departure_port_name: sailing.departurePortName || null,
    arrival_port_code: sailing.arrivalPortCode || null,
    arrival_port_name: sailing.arrivalPortName || null,
    status: sailing.status || "UNKNOWN",
    sold_out: sailing.soldOut === true,
    availability_known: false,
    available: null,
    currency: sailing.currency || REGION_CURRENCY[region] || null,
    public_price: sailing.publicPrice,
    original_price: sailing.originalPrice,
    discount_amount: sailing.discountAmount,
    price_basis: "UNSPECIFIED",
    organized_pricing: sailing.organizedPricing,
    stateroom_classes: sailing.stateroomClasses,
    service_charges: sailing.serviceCharges,
    port_charges: sailing.portCharges,
    booking_url: sailing.bookingUrl || null,
    source_url: sailing.sourceUrl || null,
    region,
    locale: sailing.locale || null,
    provider_payload: sailing.providerPayload,
    provider_updated_at: sailing.providerUpdatedAt || null,
    last_synced_at: syncedAt
  };
}
async function upsertCruises(cruises, region, syncedAt) {
  if (!cruises.length) return new Map();
  const rows = await restRequest({
    table: TABLES.cruises,
    method: "POST",
    query: { on_conflict: "record_id" },
    prefer: "resolution=merge-duplicates,return=representation",
    body: cruises.map(cruise => cruiseDbRow(cruise, region, syncedAt))
  });
  return new Map(arr(rows).map(row => [row.record_id, row.id]));
}
async function upsertSailings(cruises, cruiseIdByRecordId, region, syncedAt) {
  const body = [];
  for (const cruise of cruises) {
    const cruiseId = cruiseIdByRecordId.get(cruise.recordId);
    if (!cruiseId) continue;
    for (const sailing of cruise.sailings) body.push(sailingDbRow(cruiseId, sailing, region, syncedAt));
  }
  if (!body.length) return [];
  return restRequest({
    table: TABLES.sailings,
    method: "POST",
    query: { on_conflict: "record_id" },
    prefer: "resolution=merge-duplicates,return=representation",
    body
  });
}

export async function syncRoyalCaribbeanCruisesCore(input = {}) {
  const region = requestedRegion(input);
  if (syncInflight.has(region)) return syncInflight.get(region);
  const task = (async () => {
    const run = await insertSyncRun(region, input);
    const syncedAt = nowIso();
    try {
      const providerRows = await runRoyalCaribbeanActor(region, input);
      const cruises = normalizeProviderRows(providerRows, region);
      const cruiseIds = await upsertCruises(cruises, region, syncedAt);
      const sailingRows = await upsertSailings(cruises, cruiseIds, region, syncedAt);
      await finishSyncRun(run?.id, {
        status: "COMPLETED",
        completed_at: nowIso(),
        fetched_count: providerRows.length,
        cruise_upserts: cruiseIds.size,
        sailing_upserts: arr(sailingRows).length,
        error_code: null,
        error_message: null
      });
      return {
        ok: true,
        provider: PROVIDER,
        region,
        fetchedCount: providerRows.length,
        cruiseUpserts: cruiseIds.size,
        sailingUpserts: arr(sailingRows).length,
        syncedAt
      };
    } catch (error) {
      await finishSyncRun(run?.id, {
        status: "FAILED",
        completed_at: nowIso(),
        error_code: clean(error?.code || "CRUISES_SYNC_FAILED", 120),
        error_message: clean(error?.publicMessage || error?.message || "Cruise synchronization failed.", 700)
      }).catch(() => {});
      throw error;
    }
  })().finally(() => syncInflight.delete(region));
  syncInflight.set(region, task);
  return task;
}

async function readTravelInfoRows(region) {
  const [cruiseRows, sailingRows] = await Promise.all([
    restRequest({
      table: TABLES.cruises,
      query: {
        select: "id,record_id,provider,provider_cruise_id,provider_itinerary_id,title,slug,cruise_line,ship_name,ship_code,destination_codes,destination_names,departure_port_code,departure_port_name,arrival_port_code,arrival_port_name,nights,summary,description,image_url,gallery,highlights,inclusions,itinerary,booking_url,product_url,source_url,region,locale,currency,featured,sort_order,last_synced_at,updated_at",
        region: qeq(region),
        active: "eq.true",
        published: "eq.true",
        customer_visible: "eq.true",
        order: "featured.desc,sort_order.asc,title.asc",
        limit: "2500"
      }
    }),
    restRequest({
      table: TABLES.sailings,
      query: {
        select: "id,cruise_id,record_id,provider_sailing_id,provider_group_id,service_date,return_date,departure_port_code,departure_port_name,arrival_port_code,arrival_port_name,status,sold_out,availability_known,available,currency,public_price,original_price,discount_amount,price_basis,organized_pricing,stateroom_classes,service_charges,port_charges,booking_url,source_url,region,locale,last_synced_at,updated_at",
        region: qeq(region),
        active: "eq.true",
        published: "eq.true",
        customer_visible: "eq.true",
        service_date: `gte.${todayIso()}`,
        order: "service_date.asc",
        limit: "5000"
      }
    })
  ]);
  return { cruiseRows: arr(cruiseRows), sailingRows: arr(sailingRows) };
}

function publicSailing(row = {}) {
  return {
    id: clean(row.record_id || row.id, 500),
    providerSailingId: clean(row.provider_sailing_id, 500),
    serviceDate: isoDate(row.service_date),
    arrivalDate: isoDate(row.return_date),
    variantName: "",
    soldOut: row.sold_out === true,
    availabilityKnown: row.availability_known === true,
    available: row.availability_known === true ? finite(row.available, null) : null,
    status: upper(row.status, 80) || "UNKNOWN",
    departurePort: clean(row.departure_port_name || row.departure_port_code, 300),
    departurePortCode: upper(row.departure_port_code, 20),
    arrivalPort: clean(row.arrival_port_name || row.arrival_port_code, 300),
    arrivalPortCode: upper(row.arrival_port_code, 20),
    publicPrice: finite(row.public_price, null),
    originalPrice: finite(row.original_price, null),
    discountAmount: finite(row.discount_amount, null),
    currency: upper(row.currency, 3),
    priceBasis: upper(row.price_basis, 80) === "UNSPECIFIED" ? "" : clean(row.price_basis, 80),
    stateroomClasses: arr(row.stateroom_classes),
    bookingUrl: clean(row.booking_url, 1800)
  };
}
function publicCruise(row, sailingRows) {
  const codes = arr(row.destination_codes);
  const names = arr(row.destination_names);
  const destinations = [];
  const length = Math.max(codes.length, names.length);
  for (let index = 0; index < length; index += 1) {
    const title = clean(names[index] || codes[index], 300);
    const id = clean(codes[index] || slugify(title), 120);
    if (id || title) destinations.push({ id, slug: slugify(title || id), title: title || id });
  }
  const sailings = sailingRows.map(publicSailing).filter(item => item.serviceDate).sort((a, b) => a.serviceDate.localeCompare(b.serviceDate));
  if (!sailings.length) return null;
  const availableSailing = sailings.find(item => !item.soldOut) || sailings[0];
  const priced = sailings.filter(item => Number.isFinite(Number(item.publicPrice)) && Number(item.publicPrice) > 0);
  priced.sort((a, b) => Number(a.publicPrice) - Number(b.publicPrice));
  const cheapest = priced[0] || null;
  const departurePort = clean(row.departure_port_name || row.departure_port_code, 300);
  const arrivalPort = clean(row.arrival_port_name || row.arrival_port_code, 300);
  const itinerary = arr(row.itinerary).slice(0, 40);
  return {
    id: clean(row.record_id || row.id, 500),
    provider: clean(row.provider, 120),
    cruiseLine: clean(row.cruise_line, 300) || "Royal Caribbean International",
    title: clean(row.title, 500),
    description: clean(row.description, 5000),
    summary: clean(row.summary || row.description, 1200),
    imageUrl: clean(row.image_url, 1800),
    gallery: arr(row.gallery),
    featured: row.featured === true,
    searchPriority: finite(row.sort_order, 999),
    shipName: clean(row.ship_name, 300),
    shipId: clean(row.ship_code, 120),
    destinationLabel: destinations[0]?.title || "",
    destination: destinations[0] || null,
    area: destinations[0] || null,
    destinations,
    departurePort,
    arrivalPort,
    routeSummary: routeSummaryFromParts(departurePort, itinerary, arrivalPort),
    nights: finite(row.nights, 0) || 0,
    startDate: availableSailing?.serviceDate || "",
    priceFrom: cheapest ? { amount: Number(cheapest.publicPrice), currency: cheapest.currency || upper(row.currency, 3), basis: cheapest.priceBasis || "" } : null,
    nextSailing: availableSailing,
    sailings,
    highlights: unique(arr(row.highlights)).slice(0, 30),
    itinerary,
    inclusions: unique(arr(row.inclusions)).slice(0, 30),
    bookingMessage: "Cruise details and current provider sailing information are stored in SKANDI Travel Info. Continue with SKANDI Support for planning and booking assistance.",
    bookingUrl: clean(row.booking_url, 1800),
    productUrl: clean(row.product_url, 1800),
    updatedAt: clean(row.updated_at, 120),
    lastSyncedAt: clean(row.last_synced_at, 120)
  };
}
function assembleCruises(cruiseRows, sailingRows) {
  const byCruise = new Map();
  for (const sailing of sailingRows) {
    const key = clean(sailing.cruise_id, 120);
    if (!byCruise.has(key)) byCruise.set(key, []);
    byCruise.get(key).push(sailing);
  }
  return cruiseRows.map(row => publicCruise(row, byCruise.get(clean(row.id, 120)) || [])).filter(Boolean)
    .sort((a, b) => Number(b.featured) - Number(a.featured) || (a.searchPriority || 999) - (b.searchPriority || 999) || String(a.nextSailing?.serviceDate || "9999").localeCompare(String(b.nextSailing?.serviceDate || "9999")));
}
function filtersFromCruises(cruises = []) {
  const destinationMap = new Map();
  const ports = new Set();
  const months = new Set();
  const nights = new Set();
  for (const cruise of cruises) {
    for (const destination of arr(cruise.destinations)) {
      const id = clean(destination?.id || destination?.slug || destination?.title, 200);
      const title = clean(destination?.title || destination?.id, 300);
      if (id && title && !destinationMap.has(id)) destinationMap.set(id, { id, slug: clean(destination?.slug || slugify(title), 240), title });
    }
    if (clean(cruise.departurePort, 300)) ports.add(clean(cruise.departurePort, 300));
    if (Number(cruise.nights) > 0) nights.add(Number(cruise.nights));
    for (const sailing of arr(cruise.sailings)) {
      if (clean(sailing.departurePort, 300)) ports.add(clean(sailing.departurePort, 300));
      const date = isoDate(sailing.serviceDate);
      if (date) months.add(date.slice(0, 7));
    }
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

async function readCatalogue(region) {
  const { cruiseRows, sailingRows } = await readTravelInfoRows(region);
  return assembleCruises(cruiseRows, sailingRows);
}
async function seedIfEmpty(region, input = {}) {
  const existing = await readCatalogue(region);
  if (existing.length) return existing;
  const recent = await recentSyncAttempt(region);
  if (recent) {
    if (upper(recent.status, 30) === "FAILED") {
      throw publicError(
        clean(recent.error_code || "CRUISES_SYNC_RECENT_FAILURE", 120),
        clean(recent.error_message || "Cruise synchronization recently failed. Try again after the synchronization cooldown.", 700)
      );
    }
    if (upper(recent.status, 30) === "STARTED") {
      throw publicError("CRUISES_SYNC_IN_PROGRESS", "Cruise synchronization is already in progress. Try again shortly.");
    }
    return existing;
  }
  await syncRoyalCaribbeanCruisesCore({ ...input, region, reason: "EMPTY_TRAVEL_INFO_SEED" });
  return readCatalogue(region);
}

async function buildBootstrap(input = {}) {
  const language = upper(input.language || input.settings?.language, 8) || "EN";
  const requestedCurrency = upper(input.currency || input.settings?.currency, 3) || "USD";
  const region = requestedRegion(input);
  const displayCurrency = REGION_CURRENCY[region] || requestedCurrency;
  let cruises;
  try {
    cruises = await seedIfEmpty(region, input);
  } catch (error) {
    const existing = await readCatalogue(region).catch(() => []);
    if (existing.length) cruises = existing;
    else throw error;
  }
  const generatedAt = cruises.map(item => item.lastSyncedAt || item.updatedAt).filter(Boolean).sort().pop() || nowIso();
  return {
    version: "B-011.44",
    settings: { language, currency: displayCurrency, requestedCurrency, providerRegion: region },
    query: obj(input.query),
    cruises,
    filters: filtersFromCruises(cruises),
    counts: countsFromCruises(cruises),
    generatedAt,
    notice: cruises.length
      ? "Cruise catalogue served from SKANDI Travel Info. Royal Caribbean data is synchronized server-side."
      : "No published cruise sailings are currently stored for this market.",
    source: { kind: "SKANDI_TRAVEL_INFO", provider: PROVIDER, region }
  };
}

export async function getCruisesBootstrapCore(input = {}) {
  return buildBootstrap(input);
}

export async function refreshCruisesCore(input = {}) {
  return buildBootstrap(input);
}
