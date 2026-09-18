// /src/backend/SKANDI_CORE/flightStatus.js
// SKANDI Flight Status B-011.37 — canonical public flight-status + airport-context core.
// Owns Aviationstack transport/normalization and public-safe airport-context assembly.
// No page routing or direct frontend database access belongs here.

import { fetch } from "wix-fetch";
import { elevate } from "wix-auth";
import { secrets } from "wix-secrets-backend.v2";
import { restRequest } from "backend/SKANDI_CORE/supabaseServer.js";
import { SkandiError } from "backend/SKANDI_CORE/platformErrors.js";
import { text, upper, lower, record, safeNumber } from "backend/SKANDI_CORE/platformValidation.js";

const FLIGHT_STATUS_CORE_VERSION = "B-011.37";
const AVIATIONSTACK_BASE = "https://api.aviationstack.com/v1";
const AVIATIONSTACK_SECRET_NAMES = Object.freeze([
  "AVIATIONSTACK_API_KEY",
  "AVIATIONSTACK_ACCESS_KEY",
  "aviationstack",
  "AVIATIONSTACK"
]);
const getSecretValue = elevate(secrets.getSecretValue);

const PUBLIC_ENTITY_TYPES = new Set(["TRANSFER", "HOTEL", "DESTINATION", "GUIDED_TOUR", "ACTIVITY"]);
const DIRECTORY_TTL_MS = 5 * 60 * 1000;
const CONTEXT_TTL_MS = 2 * 60 * 1000;

let aviationstackKeyPromise = null;
let directoryCache = null;
const contextCache = new Map();

function arr(value) { return Array.isArray(value) ? value : []; }
function cleanIata(value) { return upper(value, 4).replace(/[^A-Z0-9]/g, "").slice(0, 4); }
function cleanCode(value, max = 12) { return upper(value, max).replace(/[^A-Z0-9-]/g, ""); }
function isoDateOnly(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}
function addUtcDays(date, days) {
  const out = new Date(date.getTime());
  out.setUTCDate(out.getUTCDate() + Number(days || 0));
  return out;
}
function currentDateWindow() {
  const now = new Date();
  return {
    min: isoDateOnly(addUtcDays(now, -1)),
    today: isoDateOnly(now),
    max: isoDateOnly(addUtcDays(now, 3))
  };
}
function validateDate(value) {
  const date = text(value, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new SkandiError("FLIGHT_STATUS_DATE_REQUIRED", "Please select a travel date.", { publicMessage: "Please select a travel date." });
  }
  const window = currentDateWindow();
  if (date < window.min || date > window.max) {
    throw new SkandiError("FLIGHT_STATUS_DATE_OUT_OF_RANGE", "Flight status date is outside the supported search window.", {
      publicMessage: `Choose a date from ${window.min} through ${window.max}.`
    });
  }
  return { date, window };
}
function parseLooseJson(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "object") return value;
  const raw = text(value, 100000);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch (_) {}
  try { return JSON.parse(raw.replace(/,\s*([}\]])/g, "$1")); } catch (_) {}
  return raw;
}
function normalizeLooseList(value) {
  if (value === null || value === undefined || value === "") return [];
  const parsed = parseLooseJson(value);
  const input = Array.isArray(parsed) ? parsed : [parsed];
  const out = [];
  for (const entry of input) {
    const next = parseLooseJson(entry);
    if (Array.isArray(next)) out.push(...next.filter(Boolean));
    else if (next !== null && next !== undefined && next !== "") out.push(next);
  }
  return out;
}
function normalizeLooseObject(value) {
  const parsed = parseLooseJson(value);
  return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
}
function secretText(result) {
  if (typeof result === "string") return result.trim();
  return text(result?.value ?? result?.secretValue ?? result?.secret?.value ?? "", 5000);
}
async function aviationstackApiKey() {
  if (aviationstackKeyPromise) return aviationstackKeyPromise;
  aviationstackKeyPromise = (async () => {
    for (const name of AVIATIONSTACK_SECRET_NAMES) {
      try {
        const value = secretText(await getSecretValue(name));
        if (value) return value;
      } catch (_) {}
    }
    throw new SkandiError("AVIATIONSTACK_API_KEY_MISSING", "Aviationstack credential is not configured.", {
      publicMessage: "Live flight status is temporarily unavailable."
    });
  })();
  try { return await aviationstackKeyPromise; }
  catch (error) { aviationstackKeyPromise = null; throw error; }
}
function safeProviderMessage(payload, status) {
  return text(
    payload?.error?.message || payload?.message || payload?.error?.info || `AVIATIONSTACK_HTTP_${status}`,
    400
  );
}
async function callAviationstack(endpoint, params = {}) {
  const key = await aviationstackApiKey();
  const query = new URLSearchParams({ access_key: key, ...params });
  let response;
  try {
    response = await fetch(`${AVIATIONSTACK_BASE}/${endpoint}?${query.toString()}`, {
      method: "GET",
      headers: { Accept: "application/json" }
    });
  } catch (error) {
    throw new SkandiError("AVIATIONSTACK_NETWORK_ERROR", "Aviationstack request failed.", {
      retryable: true,
      publicMessage: "Live flight information could not be reached. Please try again."
    });
  }

  const raw = await response.text();
  let payload = {};
  if (raw) {
    try { payload = JSON.parse(raw); }
    catch (_) {
      throw new SkandiError("AVIATIONSTACK_INVALID_RESPONSE", "Aviationstack returned invalid JSON.", {
        status: response.status,
        retryable: response.status >= 500,
        publicMessage: "Live flight information returned an invalid response. Please try again."
      });
    }
  }

  if (!response.ok || payload?.error) {
    const providerMessage = safeProviderMessage(payload, response.status);
    const accessRestricted = /access|subscription|plan|future|historical/i.test(providerMessage);
    throw new SkandiError("AVIATIONSTACK_REQUEST_FAILED", providerMessage, {
      status: response.status,
      retryable: response.status === 429 || response.status >= 500,
      publicMessage: accessRestricted
        ? "Flight information for this date is not available with the configured live-data service."
        : "Live flight information is temporarily unavailable. Please try again."
    });
  }
  return payload;
}
function localSchedule(date, value) {
  const clean = text(value, 40);
  if (!clean) return "";
  if (/^\d{2}:\d{2}(?::\d{2})?$/.test(clean)) return `${date}T${clean.length === 5 ? `${clean}:00` : clean}`;
  return clean;
}
function normalizeFlight(item = {}, fallbackDate = "") {
  const departure = record(item.departure);
  const arrival = record(item.arrival);
  const flight = record(item.flight);
  const airline = record(item.airline);
  const aircraft = record(item.aircraft);
  const futureStyle = Boolean(
    departure.iataCode || arrival.iataCode || flight.iataNumber || airline.iataCode || departure.scheduledTime || arrival.scheduledTime
  );

  const flightIata = text(
    flight.iata || flight.iataNumber || item.flight_iata || item.flightIata ||
    `${airline.iataCode || airline.iata || ""}${flight.number || item.flight_number || ""}`,
    24
  );

  return {
    id: text(item.id || `${flightIata}|${departure.scheduled || departure.scheduledTime || ""}|${arrival.scheduled || arrival.scheduledTime || ""}`, 240),
    flightIata,
    flightIcao: text(flight.icao || flight.icaoNumber || item.flight_icao || item.flightIcao, 24),
    flightNumber: text(flight.number || item.flight_number || item.flightNumber, 16),
    airlineName: text(airline.name || item.airline_name || item.airlineName, 180),
    airlineIata: cleanCode(airline.iata || airline.iataCode || item.airline_iata || item.airlineIata, 4),
    airlineIcao: cleanCode(airline.icao || airline.icaoCode || item.airline_icao || item.airlineIcao, 6),
    airlineLogoUrl: text(item.airlineLogoUrl, 2000),
    status: text(item.flight_status || item.status || (futureStyle ? "scheduled" : "scheduled"), 80) || "scheduled",
    departure: {
      airport: text(departure.airport || departure.name, 180),
      iata: cleanIata(departure.iata || departure.iataCode),
      icao: cleanCode(departure.icao || departure.icaoCode, 8),
      terminal: text(departure.terminal, 40),
      gate: text(departure.gate, 40),
      timezone: text(departure.timezone, 80),
      scheduled: localSchedule(fallbackDate, departure.scheduled || departure.scheduledTime),
      estimated: localSchedule(fallbackDate, departure.estimated || departure.estimatedTime),
      actual: localSchedule(fallbackDate, departure.actual || departure.actualTime),
      delay: departure.delay ?? ""
    },
    arrival: {
      airport: text(arrival.airport || arrival.name, 180),
      iata: cleanIata(arrival.iata || arrival.iataCode),
      icao: cleanCode(arrival.icao || arrival.icaoCode, 8),
      terminal: text(arrival.terminal, 40),
      gate: text(arrival.gate, 40),
      timezone: text(arrival.timezone, 80),
      scheduled: localSchedule(fallbackDate, arrival.scheduled || arrival.scheduledTime),
      estimated: localSchedule(fallbackDate, arrival.estimated || arrival.estimatedTime),
      actual: localSchedule(fallbackDate, arrival.actual || arrival.actualTime),
      delay: arrival.delay ?? ""
    },
    aircraft: {
      registration: text(aircraft.registration, 40),
      iata: text(aircraft.iata || aircraft.modelCode, 20),
      icao: text(aircraft.icao, 20),
      model: text(aircraft.modelText || aircraft.model, 180)
    },
    live: item.live && typeof item.live === "object" ? {
      updated: text(item.live.updated, 80),
      latitude: Number.isFinite(Number(item.live.latitude)) ? Number(item.live.latitude) : null,
      longitude: Number.isFinite(Number(item.live.longitude)) ? Number(item.live.longitude) : null,
      altitude: Number.isFinite(Number(item.live.altitude)) ? Number(item.live.altitude) : null
    } : null
  };
}
function validateSearch(payload = {}) {
  const modeRaw = lower(payload.mode || "airport", 20);
  const mode = ["flight", "route", "airport"].includes(modeRaw) ? modeRaw : "airport";
  const { date, window } = validateDate(payload.date);
  const out = {
    mode,
    date,
    window,
    flightNumber: upper(payload.flightNumber, 16).replace(/[^A-Z0-9]/g, ""),
    from: cleanIata(payload.from),
    to: cleanIata(payload.to),
    airport: cleanIata(payload.airport),
    boardType: lower(payload.boardType || "departures", 20) === "arrivals" ? "arrivals" : "departures"
  };
  if (mode === "flight" && !out.flightNumber) {
    throw new SkandiError("FLIGHT_STATUS_FLIGHT_REQUIRED", "Flight number is required.", { publicMessage: "Enter a flight number." });
  }
  if (mode === "route" && !out.from && !out.to) {
    throw new SkandiError("FLIGHT_STATUS_ROUTE_REQUIRED", "Route airport is required.", { publicMessage: "Enter at least a From or To airport." });
  }
  if (mode === "airport" && !/^[A-Z0-9]{3,4}$/.test(out.airport)) {
    throw new SkandiError("FLIGHT_STATUS_AIRPORT_REQUIRED", "Airport IATA code is required.", { publicMessage: "Select an airport or enter a valid airport code." });
  }
  return out;
}

export async function searchFlightStatusCore(payload = {}) {
  const p = validateSearch(payload);
  const isFuture = p.date > p.window.today;
  let endpoint = "flights";
  let params = { limit: "100" };

  if (isFuture && p.mode === "airport") {
    endpoint = "flightsFuture";
    params = {
      iataCode: p.airport,
      type: p.boardType === "arrivals" ? "arrival" : "departure",
      date: p.date
    };
  } else {
    params.flight_date = p.date;
    if (p.mode === "flight") params.flight_iata = p.flightNumber;
    if (p.mode === "route") {
      if (p.from) params.dep_iata = p.from;
      if (p.to) params.arr_iata = p.to;
    }
    if (p.mode === "airport") {
      params[p.boardType === "arrivals" ? "arr_iata" : "dep_iata"] = p.airport;
    }
  }

  const result = await callAviationstack(endpoint, params);
  const rows = arr(result?.data).map(item => normalizeFlight(item, p.date));
  return {
    ok: true,
    items: rows,
    meta: {
      mode: p.mode,
      date: p.date,
      boardType: p.boardType,
      airport: p.airport,
      provider: "aviationstack",
      endpoint,
      futureSchedule: endpoint === "flightsFuture",
      searchedAt: new Date().toISOString(),
      pagination: result?.pagination && typeof result.pagination === "object" ? result.pagination : {}
    }
  };
}

function publicAirport(row = {}) {
  const localized = normalizeLooseList(row.localized_content);
  const en = localized.find(item => upper(item?.language, 10) === "EN") || localized[0] || {};
  const quickFacts = normalizeLooseList(row.quickFactsJson);
  const terminals = normalizeLooseList(row.terminalsJson);
  const transport = normalizeLooseList(row.transportJson);
  const foodDrinks = normalizeLooseList(row.foodDrinksJson);
  const destinationAds = normalizeLooseList(row.destinationAdsJson);
  const lostFound = normalizeLooseList(row.lostFoundJson);
  const loungeObject = normalizeLooseObject(row.lounges);
  const lounges = arr(loungeObject.lounges).length ? loungeObject.lounges : normalizeLooseList(row.lounges);
  const airportHotel = normalizeLooseObject(row.airportHotels);
  const media = normalizeLooseList(row.media_assets);
  const hero = media.find(item => item?.isHero || item?.isPrimary || upper(item?.role, 20) === "PRIMARY") || media[0] || {};

  return {
    iata: cleanIata(row.iata),
    icao: cleanCode(row.icao, 8),
    title: text(row.title || en.title, 240),
    city: text(row.locationCity, 180),
    country: text(row.country, 120),
    timezone: text(row.timezone, 80) || "UTC",
    summary: text(row.summary || en.shortDescription || row.information || row.body, 3000),
    information: text(row.information, 5000),
    distanceToCityCenterKm: Number.isFinite(Number(row.distanceToCityCenterKm)) ? Number(row.distanceToCityCenterKm) : null,
    website: text(row.website, 2000),
    contactUrl: text(row.contactUrl, 2000),
    logoUrl: text(row.logoUrl || row.logoIconUrl, 2000),
    heroImageUrl: text(row.heroImageUrl || row.image_url || hero.url, 2000),
    primaryColor: text(row.primaryColor, 20),
    accentColor: text(row.accentColor, 20),
    quickFacts,
    terminals,
    transport,
    lounges,
    foodDrinks,
    airportHotel,
    destinationAds,
    lostFound,
    lastReviewed: text(row.lastReviewed, 80)
  };
}
function publicDirectoryAirport(row = {}) {
  return {
    iata: cleanIata(row.iata),
    icao: cleanCode(row.icao, 8),
    title: text(row.title, 240),
    city: text(row.locationCity, 180),
    country: text(row.country, 120),
    timezone: text(row.timezone, 80) || "UTC",
    logoUrl: text(row.logoIconUrl || row.logoUrl, 2000)
  };
}
async function readPublishedAirports() {
  return restRequest({
    table: "travel_info_airports",
    query: {
      select: "title,iata,icao,country,locationCity,timezone,logoUrl,logoIconUrl,sortOrder,active,published,customer_visible,status",
      active: "eq.true",
      published: "eq.true",
      customer_visible: "eq.true",
      limit: "500"
    }
  });
}
export async function getFlightStatusAirportDirectoryCore() {
  const now = Date.now();
  if (directoryCache && directoryCache.expiresAt > now) return directoryCache.value;
  const rows = arr(await readPublishedAirports())
    .map(publicDirectoryAirport)
    .filter(item => /^[A-Z0-9]{3,4}$/.test(item.iata))
    .sort((a, b) => a.iata.localeCompare(b.iata));
  const value = { ok: true, items: rows, meta: { version: FLIGHT_STATUS_CORE_VERSION, loadedAt: new Date().toISOString() } };
  directoryCache = { expiresAt: now + DIRECTORY_TTL_MS, value };
  return value;
}
async function readAirport(code) {
  const rows = await restRequest({
    table: "travel_info_airports",
    query: {
      select: "*",
      iata: `eq.${code}`,
      active: "eq.true",
      published: "eq.true",
      customer_visible: "eq.true",
      limit: "1"
    }
  });
  return arr(rows)[0] || null;
}
async function readPublicEntitiesForAirport(code) {
  const select = "public_id,entity_type,code,name,slug,featured,sort_priority,details,commercial,localized,media,relations,updated_at";
  const base = {
    select,
    entity_type: "in.(TRANSFER,HOTEL,DESTINATION,GUIDED_TOUR,ACTIVITY)",
    limit: "200"
  };
  const [bySearchAirport, byAirport] = await Promise.all([
    restRequest({ table: "inventory_public_entities_v", query: { ...base, "details->>searchAirportIata": `eq.${code}` } }),
    restRequest({ table: "inventory_public_entities_v", query: { ...base, "details->>airportIata": `eq.${code}` } })
  ]);
  const map = new Map();
  for (const row of [...arr(bySearchAirport), ...arr(byAirport)]) {
    const key = text(row?.public_id || row?.id || `${row?.entity_type}:${row?.slug}`, 300);
    if (key) map.set(key, row);
  }
  return [...map.values()];
}
function localizedEnglish(row = {}) {
  const localized = normalizeLooseList(row.localized);
  return localized.find(item => upper(item?.language, 10) === "EN") || localized[0] || {};
}
function mediaUrl(row = {}) {
  const media = normalizeLooseList(row.media);
  const chosen = media.find(item => item?.isHero || item?.isPrimary || ["HERO", "PRIMARY", "CARD"].includes(upper(item?.role, 20))) || media[0] || {};
  return text(chosen?.url, 2000);
}
function destinationRelation(row = {}) {
  return normalizeLooseList(row.relations).find(rel => upper(rel?.targetType, 30) === "DESTINATION") || {};
}
function publicEntity(row = {}) {
  const entityType = upper(row.entity_type, 40);
  if (!PUBLIC_ENTITY_TYPES.has(entityType)) return null;
  const details = record(row.details);
  const commercial = record(row.commercial);
  const localized = localizedEnglish(row);
  const destination = destinationRelation(row);
  const price = safeNumber(commercial.publicPrice, 0);
  return {
    publicId: text(row.public_id, 200),
    entityType,
    code: text(row.code, 120),
    title: text(localized.title || row.name, 240),
    slug: text(row.slug, 240),
    summary: text(localized.shortDescription || localized.fullDescription || details.summary || details.description, 1200),
    imageUrl: mediaUrl(row),
    destination: text(details.destination || destination.targetName, 180),
    destinationSlug: text(destination.targetSlug, 240),
    airportIata: cleanIata(details.airportIata || details.searchAirportIata),
    skandiTier: text(details.skandiTier, 60),
    transferType: text(details.transferType, 80),
    terminal: text(details.terminal, 40),
    meetingPoint: text(details.meetingPoint, 500),
    publishedTimeMin: Number.isFinite(Number(details.publishedTimeMin)) ? Number(details.publishedTimeMin) : null,
    publishedTimeMax: Number.isFinite(Number(details.publishedTimeMax)) ? Number(details.publishedTimeMax) : null,
    durationMinutes: Number.isFinite(Number(details.durationMinutes)) ? Number(details.durationMinutes) : null,
    distanceToAirport: Number.isFinite(Number(details.distanceToAirport)) ? Number(details.distanceToAirport) : null,
    guestRating: Number.isFinite(Number(details.guestRating)) ? Number(details.guestRating) : null,
    officialStarRating: Number.isFinite(Number(details.officialStarRating)) ? Number(details.officialStarRating) : null,
    publicPrice: price > 0 ? price : null,
    currency: text(commercial.currency, 12),
    priceBasis: text(commercial.priceBasis, 80),
    featured: row.featured === true,
    sortPriority: Number.isFinite(Number(row.sort_priority)) ? Number(row.sort_priority) : 9999
  };
}
function entitySort(a, b) {
  return Number(b?.featured === true) - Number(a?.featured === true) || Number(a?.sortPriority || 9999) - Number(b?.sortPriority || 9999) || text(a?.title).localeCompare(text(b?.title));
}

export async function getFlightStatusAirportContextCore(payload = {}) {
  const iata = cleanIata(payload.iata || payload.airport);
  if (!/^[A-Z0-9]{3,4}$/.test(iata)) {
    throw new SkandiError("FLIGHT_STATUS_AIRPORT_REQUIRED", "Airport IATA is required.", { publicMessage: "Select a valid airport." });
  }
  const boardType = lower(payload.boardType || "departures", 20) === "arrivals" ? "arrivals" : "departures";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(text(payload.date, 10)) ? text(payload.date, 10) : currentDateWindow().today;
  const contextKey = `${iata}|${date}|${boardType}`;
  const cached = contextCache.get(contextKey);
  if (cached && cached.expiresAt > Date.now()) {
    return { ...cached.value, requestSerial: Number(payload.requestSerial || 0), contextKey };
  }

  const [airportRow, entityRows] = await Promise.all([readAirport(iata), readPublicEntitiesForAirport(iata)]);
  if (!airportRow) {
    throw new SkandiError("FLIGHT_STATUS_AIRPORT_NOT_PUBLISHED", `Published airport record not found for ${iata}.`, {
      publicMessage: "This airport guide is not currently available."
    });
  }

  const entities = entityRows.map(publicEntity).filter(Boolean).sort(entitySort);
  const value = {
    ok: true,
    airport: publicAirport(airportRow),
    commerce: {
      transferOffers: entities.filter(item => item.entityType === "TRANSFER").slice(0, 4),
      hotels: entities.filter(item => item.entityType === "HOTEL").slice(0, 6),
      destinations: entities.filter(item => item.entityType === "DESTINATION").slice(0, 6),
      tours: entities.filter(item => item.entityType === "GUIDED_TOUR" || item.entityType === "ACTIVITY").slice(0, 6)
    },
    meta: { version: FLIGHT_STATUS_CORE_VERSION, iata, date, boardType, loadedAt: new Date().toISOString() },
    contextKey
  };
  contextCache.set(contextKey, { expiresAt: Date.now() + CONTEXT_TTL_MS, value });
  if (contextCache.size > 80) {
    for (const [key, entry] of contextCache) if (entry.expiresAt <= Date.now()) contextCache.delete(key);
  }
  return { ...value, requestSerial: Number(payload.requestSerial || 0) };
}

export { FLIGHT_STATUS_CORE_VERSION };
