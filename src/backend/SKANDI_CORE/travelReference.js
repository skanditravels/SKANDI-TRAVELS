// /src/backend/SKANDI_CORE/travelReference.js
// SKANDI shared Duffel reference-data core.
// R-003.9.1
//
// Server-only provider layer. No webMethod wrappers, no Inventory writes, no UI.
// All Duffel HTTP traffic is delegated to the canonical duffelClient.js transport.

import { duffelRequest } from "backend/SKANDI_CORE/duffelClient.js";

export const TRAVEL_REFERENCE_CORE_VERSION = "R-003.9.1";
export const TRAVEL_REFERENCE_PROVIDER = "DUFFEL";

const CACHE = new Map();
const CACHE_TTL = Object.freeze({
  AIRLINES: 15 * 60 * 1000,
  AIRCRAFT: 24 * 60 * 60 * 1000,
  BRANDS: 24 * 60 * 60 * 1000,
  CHAINS: 6 * 60 * 60 * 1000,
  AIR_LOYALTY: 24 * 60 * 60 * 1000,
  STAY_LOYALTY: 24 * 60 * 60 * 1000
});

const clean = (value, max = 5000) => String(value ?? "").trim().slice(0, max);
const upper = (value, max = 5000) => clean(value, max).toUpperCase();
const lower = (value, max = 5000) => clean(value, max).toLowerCase();
const list = value => Array.isArray(value) ? value : [];
const object = value => value && typeof value === "object" && !Array.isArray(value) ? value : {};
const finite = value => Number.isFinite(Number(value)) ? Number(value) : null;
const clampInt = (value, min, max, fallback) => {
  const number = Number(value);
  return Number.isInteger(number) && number >= min && number <= max ? number : fallback;
};

function resourceError(code, message) {
  const error = new Error(message);
  error.name = "TravelReferenceError";
  error.code = code;
  error.publicMessage = message;
  return error;
}

function assertId(value, prefix, label) {
  const id = clean(value, 180);
  const pattern = new RegExp(`^${prefix}[A-Za-z0-9_]+$`);
  if (!pattern.test(id)) throw resourceError("INVALID_RESOURCE_ID", `The ${label} reference is invalid.`);
  return id;
}

function assertQuery(value, minLength = 1, maxLength = 160) {
  const query = clean(value, maxLength);
  if (query.length < minLength) throw resourceError("REFERENCE_QUERY_REQUIRED", `Enter at least ${minLength} characters.`);
  return query;
}

function pageQuery(input = {}) {
  const out = { limit: clampInt(input.limit, 1, 200, 200) };
  const after = clean(input.after, 1000);
  const before = clean(input.before, 1000);
  if (after) out.after = after;
  else if (before) out.before = before;
  return out;
}

function metaShape(meta) {
  const source = object(meta);
  return {
    limit: Number(source.limit || 0) || null,
    after: clean(source.after, 1000) || null,
    before: clean(source.before, 1000) || null
  };
}

async function cached(key, ttlMs, loader) {
  const hit = CACHE.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.value;
  const value = await loader();
  CACHE.set(key, { value, expiresAt: Date.now() + ttlMs });
  return value;
}

function clearCache(prefixes = []) {
  const wanted = list(prefixes).map(prefix => String(prefix));
  for (const key of CACHE.keys()) {
    if (!wanted.length || wanted.some(prefix => key.startsWith(prefix))) CACHE.delete(key);
  }
}

async function getAllPages(path, query = {}, options = {}) {
  const maxPages = clampInt(options.maxPages, 1, 50, 25);
  const maxItems = clampInt(options.maxItems, 1, 10000, 5000);
  const items = [];
  let after = "";
  let lastMeta = null;

  for (let page = 0; page < maxPages && items.length < maxItems; page += 1) {
    const response = await duffelRequest(path, {
      query: {
        ...query,
        limit: Math.min(200, maxItems - items.length),
        ...(after ? { after } : {})
      }
    });
    items.push(...list(response.data));
    lastMeta = response.meta || null;
    after = clean(response.meta?.after, 1000);
    if (!after) break;
  }

  return { items: items.slice(0, maxItems), meta: metaShape(lastMeta) };
}

function filterByQuery(items, query, fields, limit = 50) {
  const needle = lower(query, 160);
  if (!needle) return items.slice(0, limit);
  return items.filter(item => fields.some(field => lower(item?.[field], 500).includes(needle))).slice(0, limit);
}

function normalizeAirline(raw = {}) {
  return {
    resourceType: "AIRLINE",
    id: clean(raw.id, 180),
    name: clean(raw.name, 300),
    iataCode: upper(raw.iata_code, 2) || null,
    conditionsOfCarriageUrl: clean(raw.conditions_of_carriage_url, 3000) || null,
    logoLockupUrl: clean(raw.logo_lockup_url, 3000) || null,
    logoSymbolUrl: clean(raw.logo_symbol_url, 3000) || null
  };
}

function normalizeAircraft(raw = {}) {
  return {
    resourceType: "AIRCRAFT",
    id: clean(raw.id, 180),
    iataCode: upper(raw.iata_code, 3),
    name: clean(raw.name, 300)
  };
}

function normalizeAirportLite(raw = {}) {
  return {
    id: clean(raw.id, 180),
    name: clean(raw.name, 300),
    iataCode: upper(raw.iata_code, 3),
    iataCountryCode: upper(raw.iata_country_code, 2),
    icaoCode: upper(raw.icao_code, 4) || null,
    latitude: finite(raw.latitude),
    longitude: finite(raw.longitude),
    timeZone: clean(raw.time_zone, 120) || null
  };
}

function normalizeCity(raw = {}) {
  return {
    resourceType: "CITY",
    id: clean(raw.id, 180),
    name: clean(raw.name, 300),
    iataCode: upper(raw.iata_code, 3),
    iataCountryCode: upper(raw.iata_country_code, 2),
    airports: list(raw.airports).map(normalizeAirportLite)
  };
}

function normalizeAirport(raw = {}) {
  const city = raw.city ? normalizeCity(raw.city) : null;
  return {
    resourceType: "AIRPORT",
    id: clean(raw.id, 180),
    name: clean(raw.name, 300),
    iataCode: upper(raw.iata_code, 3),
    iataCityCode: upper(raw.iata_city_code, 3) || null,
    iataCountryCode: upper(raw.iata_country_code, 2),
    icaoCode: upper(raw.icao_code, 4) || null,
    cityName: clean(raw.city_name, 300) || city?.name || null,
    latitude: finite(raw.latitude),
    longitude: finite(raw.longitude),
    timeZone: clean(raw.time_zone, 120) || null,
    city
  };
}

function normalizePlace(raw = {}) {
  const type = lower(raw.type, 20);
  if (type === "city") {
    const city = normalizeCity(raw);
    return {
      ...city,
      resourceType: "PLACE",
      placeType: "city",
      cityName: city.name,
      iataCityCode: city.iataCode,
      icaoCode: null,
      latitude: finite(raw.latitude),
      longitude: finite(raw.longitude),
      timeZone: clean(raw.time_zone, 120) || null,
      city,
      airports: list(raw.airports).map(normalizeAirport)
    };
  }
  const airport = normalizeAirport(raw);
  return {
    ...airport,
    resourceType: "PLACE",
    placeType: "airport",
    airports: list(raw.airports).map(normalizeAirport)
  };
}

function normalizeHotelBrand(raw = {}) {
  return {
    resourceType: "HOTEL_BRAND",
    id: clean(raw.id, 180),
    name: clean(raw.name, 300)
  };
}

function normalizeHotelChain(raw = {}) {
  return {
    resourceType: "HOTEL_CHAIN",
    id: clean(raw.id, 180),
    name: clean(raw.name, 300),
    preview: true
  };
}

function normalizeAirLoyalty(raw = {}) {
  return {
    resourceType: "AIR_LOYALTY_PROGRAMME",
    id: clean(raw.id, 180),
    name: clean(raw.name, 300),
    alliance: clean(raw.alliance, 200) || null,
    logoUrl: clean(raw.logo_url, 3000) || null,
    ownerAirlineId: clean(raw.owner_airline_id, 180)
  };
}

function normalizeStayLoyalty(raw = {}) {
  return {
    resourceType: "STAY_LOYALTY_PROGRAMME",
    reference: clean(raw.reference, 160),
    name: clean(raw.name, 300),
    logoUrlSvg: clean(raw.logo_url_svg, 3000) || null,
    logoUrlPngSmall: clean(raw.logo_url_png_small, 3000) || null
  };
}

function normalizeAccommodationLocation(raw = {}) {
  const address = object(raw.address);
  const coordinates = object(raw.geographic_coordinates);
  return {
    address: {
      lineOne: clean(address.line_one, 500) || null,
      cityName: clean(address.city_name, 300) || null,
      region: clean(address.region, 300) || null,
      postalCode: clean(address.postal_code, 80) || null,
      countryCode: upper(address.country_code, 2) || null
    },
    latitude: finite(coordinates.latitude),
    longitude: finite(coordinates.longitude)
  };
}

function normalizeAccommodation(raw = {}) {
  return {
    resourceType: "ACCOMMODATION",
    id: clean(raw.id, 180),
    name: clean(raw.name, 300),
    description: clean(raw.description, 20000) || null,
    location: normalizeAccommodationLocation(raw.location),
    rating: finite(raw.rating),
    ratings: list(raw.ratings),
    reviewScore: finite(raw.review_score),
    reviewCount: finite(raw.review_count),
    photos: list(raw.photos).map(photo => ({ url: clean(photo?.url, 3000) })).filter(photo => photo.url),
    amenities: list(raw.amenities).map(item => ({
      type: clean(item?.type, 160) || null,
      description: clean(item?.description, 1000) || null
    })),
    brand: raw.brand ? normalizeHotelBrand(raw.brand) : null,
    chain: raw.chain ? normalizeHotelChain(raw.chain) : null,
    checkInInformation: object(raw.check_in_information),
    keyCollection: object(raw.key_collection),
    supportedLoyaltyProgramme: clean(raw.supported_loyalty_programme, 160) || null,
    paymentInstructionSupported: raw.payment_instruction_supported === true,
    phoneNumber: clean(raw.phone_number, 160) || null,
    email: clean(raw.email, 320) || null
  };
}

function normalizeAccommodationSuggestion(raw = {}) {
  return {
    resourceType: "ACCOMMODATION_SUGGESTION",
    id: clean(raw.accommodation_id, 180),
    accommodationId: clean(raw.accommodation_id, 180),
    name: clean(raw.accommodation_name, 300),
    location: normalizeAccommodationLocation(raw.accommodation_location)
  };
}

function normalizeNegotiatedRate(raw = {}) {
  return {
    resourceType: "NEGOTIATED_RATE",
    id: clean(raw.id, 180),
    displayName: clean(raw.display_name, 300),
    rateAccessCode: upper(raw.rate_access_code, 20),
    liveMode: raw.live_mode === true,
    chainId: clean(raw.chain_id, 180) || null,
    accommodationIds: list(raw.accommodation_ids).map(id => clean(id, 180)).filter(Boolean)
  };
}

export async function listDuffelAirlinesCore(input = {}) {
  const all = await cached("airlines:all", CACHE_TTL.AIRLINES, async () => {
    const response = await getAllPages("/air/airlines", {}, { maxItems: 5000 });
    return response.items.map(normalizeAirline);
  });
  const limit = clampInt(input.resultLimit ?? input.limit, 1, 200, 50);
  return { items: filterByQuery(all, input.query, ["name", "iataCode", "id"], limit), totalCached: all.length };
}

export async function getDuffelAirlineCore(input = {}) {
  const id = assertId(input.id || input.airlineId, "arl_", "airline");
  const response = await duffelRequest(`/air/airlines/${encodeURIComponent(id)}`);
  return { item: normalizeAirline(response.data), ...(input.includeRaw === true ? { raw: response.data || null } : {}) };
}

export async function listDuffelAircraftCore(input = {}) {
  const all = await cached("aircraft:all", CACHE_TTL.AIRCRAFT, async () => {
    const response = await getAllPages("/air/aircraft", {}, { maxItems: 5000 });
    return response.items.map(normalizeAircraft);
  });
  const limit = clampInt(input.resultLimit ?? input.limit, 1, 200, 50);
  return { items: filterByQuery(all, input.query, ["name", "iataCode", "id"], limit), totalCached: all.length };
}

export async function getDuffelAircraftCore(input = {}) {
  const id = assertId(input.id || input.aircraftId, "arc_", "aircraft");
  const response = await duffelRequest(`/air/aircraft/${encodeURIComponent(id)}`);
  return { item: normalizeAircraft(response.data), ...(input.includeRaw === true ? { raw: response.data || null } : {}) };
}

export async function listDuffelAirportsCore(input = {}) {
  const query = pageQuery(input);
  const country = upper(input.iataCountryCode || input.countryCode, 2);
  if (country) query.iata_country_code = country;
  const response = await duffelRequest("/air/airports", { query });
  return { items: list(response.data).map(normalizeAirport), meta: metaShape(response.meta) };
}

export async function getDuffelAirportCore(input = {}) {
  const id = assertId(input.id || input.airportId, "arp_", "airport");
  const response = await duffelRequest(`/air/airports/${encodeURIComponent(id)}`);
  return { item: normalizeAirport(response.data), ...(input.includeRaw === true ? { raw: response.data || null } : {}) };
}

export async function listDuffelCitiesCore(input = {}) {
  const response = await duffelRequest("/air/cities", { query: pageQuery(input) });
  return { items: list(response.data).map(normalizeCity), meta: metaShape(response.meta) };
}

export async function getDuffelCityCore(input = {}) {
  const id = assertId(input.id || input.cityId, "cit_", "city");
  const response = await duffelRequest(`/air/cities/${encodeURIComponent(id)}`);
  return { item: normalizeCity(response.data), ...(input.includeRaw === true ? { raw: response.data || null } : {}) };
}

export async function searchDuffelPlacesCore(input = {}) {
  const query = assertQuery(input.query, 1, 160);
  const requestQuery = { query };
  const lat = finite(input.latitude ?? input.lat);
  const lng = finite(input.longitude ?? input.lng);
  const radius = finite(input.radiusMeters ?? input.rad);
  if (lat !== null && lng !== null) {
    requestQuery.lat = lat;
    requestQuery.lng = lng;
    if (radius !== null && radius > 0) requestQuery.rad = Math.round(radius);
  }
  const response = await duffelRequest("/places/suggestions", { query: requestQuery });
  const kind = lower(input.placeType, 20);
  const items = list(response.data).map(normalizePlace).filter(item => !kind || item.placeType === kind);
  return { items: items.slice(0, clampInt(input.limit, 1, 100, 50)) };
}

export async function listDuffelHotelBrandsCore(input = {}) {
  const items = await cached("brands:all", CACHE_TTL.BRANDS, async () => {
    const response = await duffelRequest("/stays/brands");
    return list(response.data).map(normalizeHotelBrand);
  });
  return { items: filterByQuery(items, input.query, ["name", "id"], clampInt(input.limit, 1, 200, 100)) };
}

export async function getDuffelHotelBrandCore(input = {}) {
  const id = assertId(input.id || input.brandId, "bra_", "hotel brand");
  const response = await duffelRequest(`/stays/brands/${encodeURIComponent(id)}`);
  return { item: normalizeHotelBrand(response.data), ...(input.includeRaw === true ? { raw: response.data || null } : {}) };
}

export async function listDuffelHotelChainsCore(input = {}) {
  const items = await cached("chains:all", CACHE_TTL.CHAINS, async () => {
    const response = await duffelRequest("/stays/chains");
    return list(response.data).map(normalizeHotelChain);
  });
  return { items: filterByQuery(items, input.query, ["name", "id"], clampInt(input.limit, 1, 200, 100)), preview: true };
}

export async function getDuffelHotelChainCore(input = {}) {
  const id = assertId(input.id || input.chainId, "chn_", "hotel chain");
  const response = await duffelRequest(`/stays/chains/${encodeURIComponent(id)}`);
  return { item: normalizeHotelChain(response.data), preview: true, ...(input.includeRaw === true ? { raw: response.data || null } : {}) };
}

export async function listDuffelAirLoyaltyProgrammesCore(input = {}) {
  const items = await cached("air-loyalty:all", CACHE_TTL.AIR_LOYALTY, async () => {
    const response = await getAllPages("/air/loyalty_programmes", {}, { maxItems: 5000 });
    return response.items.map(normalizeAirLoyalty);
  });
  return { items: filterByQuery(items, input.query, ["name", "alliance", "ownerAirlineId", "id"], clampInt(input.limit, 1, 200, 100)) };
}

export async function getDuffelAirLoyaltyProgrammeCore(input = {}) {
  const id = assertId(input.id || input.loyaltyProgrammeId, "loy_", "loyalty programme");
  const response = await duffelRequest(`/air/loyalty_programmes/${encodeURIComponent(id)}`);
  return { item: normalizeAirLoyalty(response.data), ...(input.includeRaw === true ? { raw: response.data || null } : {}) };
}

export async function listDuffelStayLoyaltyProgrammesCore(input = {}) {
  const items = await cached("stay-loyalty:all", CACHE_TTL.STAY_LOYALTY, async () => {
    const response = await duffelRequest("/stays/loyalty_programmes");
    return list(response.data).map(normalizeStayLoyalty);
  });
  return { items: filterByQuery(items, input.query, ["name", "reference"], clampInt(input.limit, 1, 200, 100)) };
}

export async function searchDuffelAccommodationSuggestionsCore(input = {}) {
  const query = assertQuery(input.query, 3, 160);
  const data = { query };
  const lat = finite(input.latitude);
  const lng = finite(input.longitude);
  if (lat !== null && lng !== null) {
    data.location = {
      radius: clampInt(input.radiusKm, 1, 100, 5),
      geographic_coordinates: { latitude: lat, longitude: lng }
    };
  }
  const response = await duffelRequest("/stays/accommodation/suggestions", {
    method: "POST",
    body: { data }
  });
  return { items: list(response.data).map(normalizeAccommodationSuggestion).slice(0, clampInt(input.limit, 1, 100, 50)) };
}

export async function getDuffelAccommodationCore(input = {}) {
  const id = assertId(input.id || input.accommodationId, "acc_", "accommodation");
  const response = await duffelRequest(`/stays/accommodation/${encodeURIComponent(id)}`);
  return { item: normalizeAccommodation(response.data), ...(input.includeRaw === true ? { raw: response.data || null } : {}) };
}

export async function listDuffelNegotiatedRatesCore(input = {}) {
  const response = await duffelRequest("/stays/negotiated_rates", { query: pageQuery(input) });
  return { items: list(response.data).map(normalizeNegotiatedRate), meta: metaShape(response.meta) };
}

export async function getDuffelNegotiatedRateCore(input = {}) {
  const id = assertId(input.id || input.negotiatedRateId, "nre_", "negotiated rate");
  const response = await duffelRequest(`/stays/negotiated_rates/${encodeURIComponent(id)}`);
  return { item: normalizeNegotiatedRate(response.data), ...(input.includeRaw === true ? { raw: response.data || null } : {}) };
}

function negotiatedRateBody(input = {}, creating = false) {
  const displayName = clean(input.displayName ?? input.display_name, 300);
  const rateAccessCode = upper(input.rateAccessCode ?? input.rate_access_code, 20);
  const chainIdRaw = clean(input.chainId ?? input.chain_id, 180);
  const accommodationIds = list(input.accommodationIds ?? input.accommodation_ids)
    .map(id => assertId(id, "acc_", "accommodation"));

  if (!displayName) throw resourceError("NEGOTIATED_RATE_NAME_REQUIRED", "Enter a display name for the negotiated rate.");
  if (creating && !rateAccessCode) throw resourceError("NEGOTIATED_RATE_ACCESS_CODE_REQUIRED", "Enter the negotiated rate access code.");
  if (chainIdRaw && accommodationIds.length) throw resourceError("NEGOTIATED_RATE_SCOPE_INVALID", "Choose either a hotel chain or specific accommodations, not both.");
  if (!chainIdRaw && !accommodationIds.length) throw resourceError("NEGOTIATED_RATE_SCOPE_REQUIRED", "Choose a hotel chain or at least one accommodation.");

  const data = { display_name: displayName };
  if (creating) data.rate_access_code = rateAccessCode;
  if (chainIdRaw) data.chain_id = assertId(chainIdRaw, "chn_", "hotel chain");
  else data.accommodation_ids = accommodationIds;
  return data;
}

export async function createDuffelNegotiatedRateCore(input = {}) {
  const response = await duffelRequest("/stays/negotiated_rates", {
    method: "POST",
    body: { data: negotiatedRateBody(input, true) }
  });
  clearCache(["negotiated-rate:"]);
  return { item: normalizeNegotiatedRate(response.data) };
}

export async function updateDuffelNegotiatedRateCore(input = {}) {
  const id = assertId(input.id || input.negotiatedRateId, "nre_", "negotiated rate");
  const response = await duffelRequest(`/stays/negotiated_rates/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: { data: negotiatedRateBody(input, false) }
  });
  clearCache(["negotiated-rate:"]);
  return { item: normalizeNegotiatedRate(response.data) };
}

export async function deleteDuffelNegotiatedRateCore(input = {}) {
  const id = assertId(input.id || input.negotiatedRateId, "nre_", "negotiated rate");
  const response = await duffelRequest(`/stays/negotiated_rates/${encodeURIComponent(id)}`, { method: "DELETE" });
  clearCache(["negotiated-rate:"]);
  return { ok: true, id, item: response.data ? normalizeNegotiatedRate(response.data) : null };
}
