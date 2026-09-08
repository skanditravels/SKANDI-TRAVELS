import { secrets } from "wix-secrets-backend.v2";
import { elevate } from "wix-auth";
import { fetch } from "wix-fetch";

const COLLECTION_TYPES = new Set(["SKANDI_COLLECTION", "SKANDI_PARTNER"]);
const clean = (v, m = 500) => String(v ?? "").trim().slice(0, m);
const upper = (v, m = 500) => clean(v, m).toUpperCase();
const obj = v => v && typeof v === "object" && !Array.isArray(v) ? v : {};
const arr = v => Array.isArray(v) ? v : [];
const norm = v => clean(v, 500).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");


const getSecretValue = elevate(secrets.getSecretValue);
let dbConfigPromise = null;
function secretText(r) { return typeof r === "string" ? r.trim() : String(r?.value ?? r?.secretValue ?? r?.secret?.value ?? "").trim(); }
async function secret(name) { const v = secretText(await getSecretValue(name)); if (!v) throw new Error(`WIX_SECRET_EMPTY_${name}`); return v; }
async function dbConfig() {
  if (dbConfigPromise) return dbConfigPromise;
  dbConfigPromise = (async () => {
    const url = (await secret("SUPABASE_URL")).replace(/\/+$/, "");
    let key = ""; try { key = await secret("SUPABASE_SECRET_KEY"); } catch (_) { key = await secret("SUPABASE_SERVICE_ROLE_KEY"); }
    if (!url || !key) throw new Error("SUPABASE_SERVER_CONFIGURATION_INVALID");
    return { url, key, legacy: key.startsWith("eyJ") };
  })();
  return dbConfigPromise;
}
function queryString(query = {}) { return Object.entries(query).filter(([,v]) => v !== undefined && v !== null && v !== "").map(([k,v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join("&"); }
async function select(table, query = {}) {
  const c = await dbConfig(), qs = queryString(query);
  const response = await fetch(`${c.url}/rest/v1/${table}${qs ? `?${qs}` : ""}`, { headers: { apikey: c.key, ...(c.legacy ? { Authorization: `Bearer ${c.key}` } : {}), Accept: "application/json" } });
  const raw = await response.text(); let data = []; if (raw) { try { data = JSON.parse(raw); } catch (_) { data = []; } }
  if (!response.ok) throw new Error(data?.message || `SUPABASE_${response.status}`);
  return Array.isArray(data) ? data : [];
}
let cache = { at: 0, value: null };
const CACHE_MS = 60 * 1000;

async function eligibleRows() {
  if (cache.value && Date.now() - cache.at < CACHE_MS) return cache.value;
  const rows = await select("inventory_searchable_catalog_v", {
    select: "*",
    order: "search_priority.asc,sort_priority.asc,name.asc",
    limit: 4000
  }).catch(() => []);
  const eligible = arr(rows).filter(x => COLLECTION_TYPES.has(upper(x.collection_type, 40)) && x.searchable === true);
  const value = {
    airlines: eligible.filter(x => x.entity_type === "AIRLINE"),
    destinations: eligible.filter(x => x.entity_type === "DESTINATION"),
    hotels: eligible.filter(x => x.entity_type === "HOTEL"),
    masters: eligible
  };
  cache = { at: Date.now(), value };
  return value;
}

function collectionMeta(row = {}) {
  return {
    inventoryMasterId: row.id || row.ID || "",
    collectionType: upper(row.collection_type || "NONE", 40),
    partnerTier: clean(row.partner_tier, 80),
    searchPriority: Number(row.search_priority || 100),
    collectionLabel: upper(row.collection_type, 40) === "SKANDI_PARTNER" ? "SKANDI Partner" : "SKANDI Collection"
  };
}

function destinationNeedles(row = {}) {
  const d = obj(row.details);
  return [row.code, row.name, row.slug, row.public_id, d.searchAirportIata, d.destinationIata, d.airportIata, d.city, d.destinationName, d.areaName]
    .map(v => norm(v)).filter(Boolean);
}
function airlineNeedles(row = {}) {
  return [row.name, row.Title, row.details?.shortName, row.shortName, row.code, row.iataCode].map(v => norm(v)).filter(Boolean);
}
function hotelProviderIds(row = {}) {
  const d = obj(row.details);
  return [d.providerAccommodationId, d.duffelAccommodationId, d.liveAccommodationId, row.source_reference]
    .map(v => clean(v, 200)).filter(Boolean);
}

export async function getSearchableCatalogPolicy() {
  const data = await eligibleRows();
  return {
    airlines: data.airlines.map(x => ({ id: x.id || x.ID, name: x.name || x.Title, code: x.code || x.iataCode, details: x.details || {}, ...collectionMeta(x) })),
    destinations: data.destinations.map(x => ({ id: x.id, name: x.name, code: x.code, slug: x.slug, details: x.details || {}, ...collectionMeta(x) })),
    hotels: data.hotels.map(x => ({ id: x.id, name: x.name, code: x.code, slug: x.slug, providerAccommodationIds: hotelProviderIds(x), ...collectionMeta(x) })),
    rule: "Only PUBLISHED + active + customer-visible records marked searchable and assigned to SKANDI_COLLECTION or SKANDI_PARTNER are searchable."
  };
}

export async function resolveEligibleDestination(search = {}, item = null) {
  const data = await eligibleRows();
  const candidates = [
    search.destination, search.destinationRegion, search.destinationCode, search.destinationIata,
    item?.destinationCode, item?.destinationIata,
    clean(item?.routeSummary, 200).split("→").pop()
  ].map(norm).filter(Boolean);
  if (!candidates.length) return null;
  return data.destinations.find(row => {
    const needles = destinationNeedles(row);
    return candidates.some(candidate => needles.some(needle => needle === candidate || (candidate.length > 3 && needle.includes(candidate)) || (needle.length > 3 && candidate.includes(needle))));
  }) || null;
}

export async function resolveEligibleAirline(item = {}) {
  const data = await eligibleRows();
  const candidates = [item.airlineName, item.sourceLabel, item.ownerName, item.marketingCarrier, item.airlineCode]
    .map(norm).filter(Boolean);
  if (!candidates.length && item.flight) return resolveEligibleAirline(item.flight);
  return data.airlines.find(row => {
    const needles = airlineNeedles(row);
    return candidates.some(candidate => needles.some(needle => needle === candidate));
  }) || null;
}

export async function resolveEligibleHotel(item = {}) {
  const data = await eligibleRows();
  const providerId = clean(item.accommodationId || item.providerAccommodationId || item.hotelProviderId, 200);
  const masterId = clean(item.inventoryMasterId || item.hotelInventoryMasterId, 100);
  if (masterId) {
    const direct = data.hotels.find(row => row.id === masterId);
    if (direct) return direct;
  }
  if (providerId) {
    const match = data.hotels.find(row => hotelProviderIds(row).includes(providerId));
    if (match) return match;
  }
  const title = norm(item.hotelName || item.title || item.name);
  if (!title) return null;
  const exact = data.hotels.filter(row => norm(row.name) === title);
  return exact.length === 1 ? exact[0] : null;
}

export async function decorateSearchableOffer(item = {}, search = {}) {
  const type = upper(item.itemType || item.productType, 30);
  const destination = await resolveEligibleDestination(search, item);
  if (!destination) return null;

  if (type === "FLIGHT") {
    const airline = await resolveEligibleAirline(item);
    if (!airline) return null;
    return { ...item, destinationCollection: collectionMeta(destination), airlineCollection: collectionMeta(airline), collectionType: upper(destination.collection_type, 40), collectionLabel: collectionMeta(destination).collectionLabel };
  }
  if (type === "HOTEL") {
    const hotel = await resolveEligibleHotel(item);
    if (!hotel) return null;
    return { ...item, inventoryMasterId: hotel.id, destinationCollection: collectionMeta(destination), hotelCollection: collectionMeta(hotel), collectionType: upper(hotel.collection_type, 40), collectionLabel: collectionMeta(hotel).collectionLabel };
  }
  if (type === "PACKAGE") {
    const flight = await decorateSearchableOffer(item.flight || {}, search);
    const stay = await decorateSearchableOffer(item.stay || {}, search);
    if (!flight || !stay) return null;
    return { ...item, flight, stay, inventoryMasterId: stay.inventoryMasterId, collectionType: stay.collectionType || flight.collectionType, collectionLabel: stay.collectionLabel || flight.collectionLabel };
  }
  return null;
}

export async function filterSearchableOffers(items = [], search = {}) {
  const output = [];
  for (const item of arr(items)) {
    const allowed = await decorateSearchableOffer(item, search);
    if (allowed) output.push(allowed);
  }
  return output.sort((a, b) => Number(a.searchPriority || a.hotelCollection?.searchPriority || a.destinationCollection?.searchPriority || 100) - Number(b.searchPriority || b.hotelCollection?.searchPriority || b.destinationCollection?.searchPriority || 100));
}

export async function assertSearchableOffer(offer = {}, search = {}) {
  const allowed = await decorateSearchableOffer(offer, search);
  if (!allowed) {
    const error = new Error("BOOKING_NOT_IN_SKANDI_COLLECTION");
    error.publicMessage = "That option is not currently part of the SKANDI Collection or SKANDI Partners selection.";
    throw error;
  }
  return allowed;
}

export async function assertSearchableHotelMaster({ inventoryMasterId, accommodationId } = {}) {
  const hotel = await resolveEligibleHotel({ inventoryMasterId, accommodationId });
  if (!hotel) {
    const error = new Error("HOTEL_NOT_IN_SKANDI_COLLECTION");
    error.publicMessage = "This hotel is not currently searchable through SKANDI Collection / SKANDI Partners.";
    throw error;
  }
  if (accommodationId && !hotelProviderIds(hotel).includes(clean(accommodationId, 200))) {
    const error = new Error("HOTEL_PROVIDER_MAPPING_MISMATCH");
    error.publicMessage = "The live hotel mapping does not match the selected SKANDI hotel.";
    throw error;
  }
  return hotel;
}

function mediaArray(row = {}) {
  const value = row.media;
  return Array.isArray(value) ? value : [];
}
function mediaUrl(row = {}, preferred = ["CARD", "HERO", "PRIMARY"]) {
  const media = mediaArray(row).filter(x => x?.url);
  for (const role of preferred) {
    const found = media.find(x => upper(x.role, 30) === role || (role === "HERO" && x.isHero) || (role === "CARD" && x.isCard) || (role === "PRIMARY" && x.isPrimary));
    if (found) return found.url;
  }
  return media[0]?.url || "";
}
function localizedTitle(row = {}, language = "EN") {
  const list = Array.isArray(row.localized) ? row.localized : [];
  const code = upper(language || "EN", 12);
  const hit = list.find(x => upper(x.language, 12) === code) || list.find(x => upper(x.language, 12) === "EN") || list[0] || {};
  return { title: hit.title || row.name || "", description: hit.shortDescription || hit.short_description || hit.fullDescription || hit.full_description || "" };
}

export async function getSearchableFinderData(language = "EN") {
  const data = await eligibleRows();
  const destinations = data.destinations.map(row => ({ ...row, details: obj(row.details), text: localizedTitle(row, language) }));
  const countries = destinations.filter(row => upper(row.details.level, 20) === "COUNTRY");
  const areas = destinations.filter(row => upper(row.details.level, 20) !== "COUNTRY");
  const countryFor = area => {
    if (area.parent_entity_id && countries.some(c => c.id === area.parent_entity_id)) return area.parent_entity_id;
    const code = upper(area.details.countryCode, 10), name = norm(area.details.countryName);
    return countries.find(c => (code && upper(c.code, 10) === code) || (name && norm(c.name) === name))?.id || "";
  };
  return {
    countries: countries.map(row => ({
      id: row.id, name: row.text.title, slug: row.slug, code: row.code,
      countryCode: row.details.countryCode || row.code, details: row.details,
      image: mediaUrl(row, ["HERO", "CARD", "PRIMARY"]), gallery: mediaArray(row).map(x => x.url).filter(Boolean),
      description: row.text.description, collectionType: row.collection_type, searchable: true
    })),
    areas: areas.map(row => ({
      id: row.id, countryId: countryFor(row), name: row.text.title, slug: row.slug,
      details: row.details, image: mediaUrl(row), gallery: mediaArray(row).map(x => x.url).filter(Boolean),
      description: row.text.description,
      destinationIata: upper(row.details.searchAirportIata || row.details.destinationIata, 3),
      airportIata: upper(row.details.searchAirportIata || row.details.destinationIata, 3),
      nearestAirportIata: upper(row.details.searchAirportIata || row.details.destinationIata, 3),
      collectionType: row.collection_type, searchable: true
    })),
    hotels: data.hotels.map(row => {
      const d = obj(row.details), text = localizedTitle(row, language);
      return {
        id: row.id, publicId: row.public_id, hotelId: row.public_id || row.code, code: row.code,
        name: text.title, title: text.title, slug: row.slug, details: d,
        areaId: d.areaId || d.destinationId || row.parent_entity_id || "",
        destinationId: d.destinationId || row.parent_entity_id || "",
        location: d.address || d.city || "", city: d.city || "",
        rating: Number(d.skandiRating || d.officialStarRating || d.guestRating || 0),
        guestRating: Number(d.guestRating || 0), reviewCount: Number(d.reviewCount || 0),
        tags: arr(d.facilities), image: mediaUrl(row), imageUrl: mediaUrl(row), gallery: mediaArray(row).map(x => x.url).filter(Boolean),
        description: text.description, summary: text.description,
        providerAccommodationId: d.providerAccommodationId || d.duffelAccommodationId || d.liveAccommodationId || row.source_reference || "",
        collectionType: row.collection_type, partnerTier: row.partner_tier || "", searchable: true
      };
    })
  };
}
