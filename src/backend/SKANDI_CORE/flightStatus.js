// /src/backend/SKANDI_CORE/flightStatus.js
// SKANDI Flight Status — V12 AirLabs v9 provider integration.
// API request parameters are endpoint-specific and limited to AirLabs-documented
// fields. Public airport context remains on canonical Supabase resources.

import { fetch } from "wix-fetch";
import { elevate } from "wix-auth";
import { secrets } from "wix-secrets-backend.v2";
import { restRequest } from "backend/SKANDI_CORE/supabaseServer";
import { SkandiError } from "backend/SKANDI_CORE/platformErrors";
import { text, upper, lower, record, safeNumber } from "backend/SKANDI_CORE/platformValidation";

const FLIGHT_STATUS_CORE_VERSION = "V12-AIRLABS";
const AIRLABS_BASE = "https://airlabs.co/api/v9";
const AIRLABS_SECRET_NAMES = Object.freeze(["AIRLABS_API_KEY"]);
const getSecretValue = elevate(secrets.getSecretValue);
const PUBLIC_ENTITY_TYPES = new Set(["TRANSFER", "HOTEL", "DESTINATION", "GUIDED_TOUR", "ACTIVITY"]);
const DIRECTORY_TTL_MS = 5 * 60 * 1000;
const AIRLINE_BRAND_TTL_MS = 5 * 60 * 1000;
const CONTEXT_TTL_MS = 2 * 60 * 1000;
const FLIGHT_TTL_MS = 60 * 1000;

let airlabsKeyPromise = null;
let directoryCache = null;
let airlineBrandCache = null;
const contextCache = new Map();
const flightCache = new Map();
const flightRequests = new Map();

function arr(value) { return Array.isArray(value) ? value : []; }
function cleanIata(value) { return upper(value, 4).replace(/[^A-Z0-9]/g, "").slice(0, 4); }
function cleanCode(value, max = 12) { return upper(value, max).replace(/[^A-Z0-9-]/g, ""); }
function isoDateOnly(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}
function currentDateWindow() {
  const today = isoDateOnly(new Date());
  return { min: today, today, max: today };
}
function validateClientDate(value) {
  const date = text(value, 10);
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new SkandiError("FLIGHT_STATUS_DATE_INVALID", "Flight status date is invalid.", {
      publicMessage: "Please reload Flight Status and try again."
    });
  }
  return date || currentDateWindow().today;
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
async function airlabsApiKey() {
  if (airlabsKeyPromise) return airlabsKeyPromise;
  airlabsKeyPromise = (async () => {
    for (const name of AIRLABS_SECRET_NAMES) {
      try {
        const value = secretText(await getSecretValue(name));
        if (value) return value;
      } catch (_) {}
    }
    throw new SkandiError("AIRLABS_API_KEY_MISSING", "AirLabs credential is not configured.", {
      publicMessage: "Live flight status is temporarily unavailable."
    });
  })();
  try { return await airlabsKeyPromise; }
  catch (error) { airlabsKeyPromise = null; throw error; }
}
function airlabsErrorCode(payload) { return lower(payload?.error?.code || "", 80); }
function airlabsErrorMessage(payload, status) {
  return text(payload?.error?.message || payload?.message || `AIRLABS_HTTP_${status}`, 500);
}
async function callAirlabs(endpoint, params = {}) {
  const key = await airlabsApiKey();
  const query = new URLSearchParams();
  for (const [name, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") query.set(name, String(value));
  }
  query.set("api_key", key);
  let response;
  try {
    response = await fetch(`${AIRLABS_BASE}/${endpoint}?${query.toString()}`, {
      method: "GET", headers: { Accept: "application/json" }
    });
  } catch (_) {
    throw new SkandiError("AIRLABS_NETWORK_ERROR", "AirLabs request failed.", {
      retryable: true, publicMessage: "Live flight information could not be reached. Please try again."
    });
  }
  let raw;
  try { raw = await response.text(); }
  catch (_) {
    throw new SkandiError("AIRLABS_READ_FAILED", "Flight feed response could not be read.", {
      publicMessage: "The flight feed could not be read. Please try again."
    });
  }
  let payload = {};
  if (raw) {
    try { payload = JSON.parse(raw); }
    catch (_) {
      throw new SkandiError("AIRLABS_INVALID_RESPONSE", "AirLabs returned invalid JSON.", {
        status: response.status, retryable: response.status >= 500,
        publicMessage: "Live flight information returned an invalid response. Please try again."
      });
    }
  }
  const code = airlabsErrorCode(payload);
  if (code === "not_found") return { response: null, request: payload?.request || null };
  if (!response.ok || payload?.error) {
    const retryable = code === "minute_limit_exceeded" || code === "hour_limit_exceeded" || response.status === 429 || response.status >= 500;
    let publicMessage = "Live flight information is temporarily unavailable. Please try again.";
    if (code === "unknown_api_key" || code === "expired_api_key") publicMessage = "Live flight status is temporarily unavailable.";
    else if (["minute_limit_exceeded", "hour_limit_exceeded", "month_limit_exceeded"].includes(code)) publicMessage = "The live flight feed has reached its AirLabs request limit. Please try again later.";
    else if (code === "wrong_params") publicMessage = "The live flight provider rejected this search request.";
    throw new SkandiError("AIRLABS_REQUEST_FAILED", `AirLabs rejected the request (${code || "provider_error"}): ${airlabsErrorMessage(payload, response.status)}`, {
      status: response.status, retryable, publicMessage
    });
  }
  if (!raw || !payload || typeof payload !== "object") {
    throw new SkandiError("AIRLABS_INVALID_RESPONSE", "Flight feed response is empty.", {
      publicMessage: "The flight feed returned an invalid response. Please try again."
    });
  }
  return payload;
}
function airlabsResponse(payload) {
  return payload && typeof payload === "object" && Object.prototype.hasOwnProperty.call(payload, "response") ? payload.response : payload;
}
function utcTimestamp(utcValue, localValue) {
  const utc = text(utcValue, 50).trim();
  if (utc) {
    const normalized = utc.replace(" ", "T");
    if (/Z$|[+-]\d{2}:?\d{2}$/.test(normalized)) return normalized;
    return `${normalized.length === 16 ? `${normalized}:00` : normalized}Z`;
  }
  const local = text(localValue, 50).trim();
  return local ? local.replace(" ", "T") : "";
}
function providerLocalTime(value) {
  const match = text(value, 50).match(/^\d{4}-\d{2}-\d{2}[ T](\d{2}:\d{2})/);
  return match ? match[1] : "";
}
function normalizedStatus(value) {
  const status = lower(value, 80);
  if (status === "active" || status === "en route") return "en-route";
  return status || "unknown";
}
function normalizeScheduleFlight(item = {}) {
  const flightIata = text(item.flight_iata || `${item.airline_iata || ""}${item.flight_number || ""}`, 24);
  return {
    id: text(`${flightIata}|${item.dep_time_ts || item.dep_time_utc || item.dep_time || ""}|${item.arr_time_ts || item.arr_time_utc || item.arr_time || ""}`, 240),
    flightIata,
    flightIcao: text(item.flight_icao, 24),
    flightNumber: text(item.flight_number, 16),
    airlineName: text(item.airline_name || item.airline_iata, 180),
    airlineIata: cleanCode(item.airline_iata, 4),
    airlineIcao: cleanCode(item.airline_icao, 6),
    airlineLogoUrl: "",
    operatingAirlineIata: cleanCode(item.cs_airline_iata, 4),
    operatingFlightIata: text(item.cs_flight_iata, 24),
    status: normalizedStatus(item.status),
    departure: {
      airport: cleanIata(item.dep_iata), city: "", iata: cleanIata(item.dep_iata), icao: cleanCode(item.dep_icao, 8),
      terminal: text(item.dep_terminal, 40), gate: text(item.dep_gate, 40), timezone: "",
      scheduledLocal: providerLocalTime(item.dep_time), estimatedLocal: providerLocalTime(item.dep_estimated), actualLocal: providerLocalTime(item.dep_actual),
      scheduled: utcTimestamp(item.dep_time_utc, item.dep_time), estimated: utcTimestamp(item.dep_estimated_utc, item.dep_estimated), actual: utcTimestamp(item.dep_actual_utc, item.dep_actual),
      delay: item.dep_delayed ?? item.delayed ?? ""
    },
    arrival: {
      airport: cleanIata(item.arr_iata), city: "", iata: cleanIata(item.arr_iata), icao: cleanCode(item.arr_icao, 8),
      terminal: text(item.arr_terminal, 40), gate: text(item.arr_gate, 40), baggage: text(item.arr_baggage, 40), timezone: "",
      scheduledLocal: providerLocalTime(item.arr_time), estimatedLocal: providerLocalTime(item.arr_estimated), actualLocal: providerLocalTime(item.arr_actual),
      scheduled: utcTimestamp(item.arr_time_utc, item.arr_time), estimated: utcTimestamp(item.arr_estimated_utc, item.arr_estimated), actual: utcTimestamp(item.arr_actual_utc, item.arr_actual),
      delay: item.arr_delayed ?? item.delayed ?? ""
    },
    aircraft: { registration: "", iata: "", icao: "", model: "", manufacturer: "" },
    live: null
  };
}
function normalizeDetailedFlight(item = {}) {
  const base = normalizeScheduleFlight(item);
  return {
    ...base,
    aircraft: {
      registration: text(item.reg_number, 40), iata: "", icao: text(item.aircraft_icao, 20),
      model: text(item.model, 180), manufacturer: text(item.manufacturer, 120)
    },
    live: item.lat != null && item.lng != null && item.lat !== "" && item.lng !== "" && Number.isFinite(Number(item.lat)) && Math.abs(Number(item.lat)) <= 90 && Number.isFinite(Number(item.lng)) && Math.abs(Number(item.lng)) <= 180
      ? {
          updated: Number.isFinite(Number(item.updated)) && Number(item.updated) > 0 && Number(item.updated) < 8640000000000 ? new Date(Number(item.updated) * 1000).toISOString() : "",
          latitude: Number(item.lat), longitude: Number(item.lng),
          altitude: item.alt != null && item.alt !== "" && Number.isFinite(Number(item.alt)) ? Number(item.alt) : null
        }
      : null
  };
}
function validateSearch(payload = {}) {
  const modeRaw = lower(payload.mode || "airport", 20);
  const mode = ["flight", "route", "airport"].includes(modeRaw) ? modeRaw : "airport";
  const out = {
    mode,
    date: validateClientDate(payload.date),
    flightNumber: upper(payload.flightNumber, 16).replace(/[^A-Z0-9]/g, ""),
    from: cleanIata(payload.from), to: cleanIata(payload.to), airport: cleanIata(payload.airport),
    boardType: lower(payload.boardType || "departures", 20) === "arrivals" ? "arrivals" : "departures"
  };
  if (mode === "flight" && !out.flightNumber) throw new SkandiError("FLIGHT_STATUS_FLIGHT_REQUIRED", "Flight number is required.", { publicMessage: "Enter a flight number." });
  if (mode === "route" && !out.from && !out.to) throw new SkandiError("FLIGHT_STATUS_ROUTE_REQUIRED", "Route airport is required.", { publicMessage: "Enter at least a From or To airport." });
  if (mode === "airport" && !/^[A-Z0-9]{3,4}$/.test(out.airport)) throw new SkandiError("FLIGHT_STATUS_AIRPORT_REQUIRED", "Airport IATA code is required.", { publicMessage: "Select an airport or enter a valid airport code." });
  for (const value of [out.airport, out.from, out.to].filter(Boolean)) {
    if (!/^[A-Z]{3,4}$/.test(value)) throw new SkandiError("FLIGHT_STATUS_AIRPORT_INVALID", "Invalid airport code.", { publicMessage: "Enter a three-letter IATA or four-letter ICAO airport code." });
  }
  if (mode === "flight" && !/^(?:[A-Z0-9]{2}|[A-Z]{3})\d{1,4}[A-Z]?$/.test(out.flightNumber)) throw new SkandiError("FLIGHT_STATUS_FLIGHT_INVALID", "Invalid flight number.", { publicMessage: "Enter an airline code and flight number, for example SK904." });
  return out;
}
function flightIdentifierParams(value) {
  const flight = upper(value, 16).replace(/[^A-Z0-9]/g, "");
  return /^[A-Z]{3}\d+[A-Z]?$/.test(flight) ? { flight_icao: flight } : { flight_iata: flight };
}
function airportFilter(side, code) { return code ? { [`${side}_${code.length === 4 ? "icao" : "iata"}`]: code } : {}; }
function providerRows(result) {
  const rows = airlabsResponse(result);
  if (rows === null) return [];
  if (Array.isArray(rows)) return rows;
  if (rows && typeof rows === "object" && (rows.flight_iata || rows.flight_icao)) return [rows];
  throw new SkandiError("AIRLABS_INVALID_RESPONSE", "Flight data shape is invalid.", { publicMessage: "The flight feed returned an invalid response. Please try again." });
}
async function readSchedules(params) {
  const rows = [];
  let hasMore = false;
  for (let page = 0; page < 20; page++) {
    const result = await callAirlabs("schedules", { ...params, limit: 50, offset: rows.length });
    const batch = providerRows(result);
    rows.push(...batch);
    hasMore = result?.request?.has_more === true;
    if (!hasMore || !batch.length) break;
  }
  return { rows, hasMore };
}
function sameFlight(a, b) {
  const names = [a.flight_iata, a.flight_icao, a.cs_flight_iata].filter(Boolean);
  return [b.flight_iata, b.flight_icao, b.cs_flight_iata].some(x => x && names.includes(x)) && (!a.dep_iata || !b.dep_iata || a.dep_iata === b.dep_iata) && (!a.arr_iata || !b.arr_iata || a.arr_iata === b.arr_iata);
}
async function airlineBrandDirectory() {
  const now = Date.now();
  if (airlineBrandCache && airlineBrandCache.expiresAt > now) return airlineBrandCache.value;

  try {
    const rows = arr(await restRequest({
      table: "travel_info_airlines",
      query: {
        select: "iataCode,inventory_details",
        active: "eq.true",
        customer_visible: "eq.true",
        status: "eq.PUBLISHED",
        limit: "500"
      }
    }));

    const value = new Map();
    for (const row of rows) {
      const iata = cleanCode(row?.iataCode, 4);
      if (!iata) continue;
      const details = normalizeLooseObject(row?.inventory_details);
      const logoLockupUrl = text(details?.logoLockupUrl, 3000);
      if (logoLockupUrl) value.set(iata, logoLockupUrl);
    }

    airlineBrandCache = { expiresAt: now + AIRLINE_BRAND_TTL_MS, value };
    return value;
  } catch (error) {
    console.warn("[SKANDI Flight Status] Airline logo lookup unavailable", error);
    return new Map();
  }
}
async function applyAirlineBranding(items = []) {
  const directory = await airlineBrandDirectory();
  if (!directory.size) return items;

  return items.map(item => {
    const iata = cleanCode(item?.airlineIata || item?.operatingAirlineIata, 4);
    const airlineLogoUrl = directory.get(iata) || text(item?.airlineLogoUrl, 3000);
    return airlineLogoUrl ? { ...item, airlineLogoUrl } : item;
  });
}
const BOARDING_RULES = Object.freeze({
  DL: { boarding_window: 45, final_call_window: 15, name: "Delta Air Lines" },
  AA: { boarding_window: 40, final_call_window: 15, name: "American Airlines" },
  UA: { boarding_window: 40, final_call_window: 15, name: "United Airlines" },
  B6: { boarding_window: 35, final_call_window: 12, name: "JetBlue" },
  SK: { boarding_window: 40, final_call_window: 15, name: "SAS" },
  LH: { boarding_window: 45, final_call_window: 15, name: "Lufthansa" },
  FR: { boarding_window: 30, final_call_window: 10, name: "Ryanair" },
  DEFAULT: { boarding_window: 40, final_call_window: 15, name: "" }
});
async function loadFlightSearch(p) {
  const filters = p.mode === "flight" ? flightIdentifierParams(p.flightNumber)
    : p.mode === "route" ? { ...airportFilter("dep", p.from), ...airportFilter("arr", p.to) }
      : airportFilter(p.boardType === "arrivals" ? "arr" : "dep", p.airport);
  const responses = await Promise.allSettled([
    callAirlabs("flights", filters).then(providerRows),
    p.mode === "flight" ? callAirlabs("flight", filters).then(result => ({ rows: providerRows(result), hasMore: false })) : readSchedules(filters)
  ]);
  if (responses.every(result => result.status === "rejected")) throw responses[0].reason;
  const live = responses[0].status === "fulfilled" ? responses[0].value : [];
  const scheduled = responses[1].status === "fulfilled" ? responses[1].value.rows : [];
  const rows = scheduled.map(item => ({ ...item }));
  for (const signal of live) {
    const candidates = rows.map((item, index) => ({ item, index })).filter(x => sameFlight(x.item, signal));
    candidates.sort((a, b) => Math.abs(Number(a.item.dep_time_ts || 0) - Date.now() / 1000) - Math.abs(Number(b.item.dep_time_ts || 0) - Date.now() / 1000));
    if (candidates.length) {
      const index = candidates[0].index;
      const valid = Object.fromEntries(Object.entries(signal).filter(([, value]) => value !== null && value !== undefined && value !== ""));
      const identity = Object.fromEntries(["flight_iata", "flight_icao", "flight_number", "airline_iata", "airline_icao", "cs_flight_iata", "cs_airline_iata"].filter(key => rows[index][key]).map(key => [key, rows[index][key]]));
      rows[index] = { ...rows[index], ...valid, ...identity };
    } else rows.push(signal);
  }
  const warnings = [];
  if (responses[0].status === "rejected") warnings.push("Live tracking is unavailable; showing timetable data.");
  if (responses[1].status === "rejected") warnings.push("Timetable information is unavailable; showing live tracking only. Times and gates may be missing.");
  if (responses[1].status === "fulfilled" && responses[1].value?.hasMore) warnings.push("This board contains the first 1,000 schedule entries. Narrow the route to see more.");
  const normalizedItems = rows.map(normalizeDetailedFlight).filter(item => item.flightIata || item.flightIcao);
  const items = await applyAirlineBranding(normalizedItems);
  return {
    ok: true,
    items,
    meta: {
      mode: p.mode, date: p.date, boardType: p.boardType, airport: p.airport,
      provider: "airlabs", providerApi: "v9",
      endpoint: p.mode === "flight" ? "flights + flight" : "flights + schedules",
      providerScope: p.mode === "flight" ? "closest-live-scheduled-or-landed-flight" : "live-tracking-and-current-schedule-window",
      searchedAt: new Date().toISOString(), refreshAfterMs: FLIGHT_TTL_MS,
      partial: warnings.length > 0, note: warnings.join(" "),
      message: "Airport-local times when supplied; UTC otherwise. Schedule coverage is up to 10 hours ahead.",
      boardingRules: BOARDING_RULES
    }
  };
}
export async function searchFlightStatusCore(payload = {}) {
  const p = validateSearch(payload);
  const key = JSON.stringify({ ...p, date: "" });
  const cached = flightCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  if (flightRequests.has(key)) return flightRequests.get(key);
  const pending = loadFlightSearch(p).then(value => {
    flightCache.set(key, { value, expiresAt: Date.now() + FLIGHT_TTL_MS });
    if (flightCache.size > 100) flightCache.delete(flightCache.keys().next().value);
    return value;
  }).finally(() => flightRequests.delete(key));
  flightRequests.set(key, pending);
  return pending;
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
    iata: cleanIata(row.iata), icao: cleanCode(row.icao, 8), title: text(row.title || en.title, 240),
    city: text(row.locationCity, 180), country: text(row.country, 120), timezone: text(row.timezone, 80) || "UTC",
    summary: text(row.summary || en.shortDescription || row.information || row.body, 3000), information: text(row.information, 5000),
    distanceToCityCenterKm: Number.isFinite(Number(row.distanceToCityCenterKm)) ? Number(row.distanceToCityCenterKm) : null,
    website: text(row.website, 2000), contactUrl: text(row.contactUrl, 2000), logoUrl: text(row.logoUrl || row.logoIconUrl, 2000),
    heroImageUrl: text(row.heroImageUrl || row.image_url || hero.url, 2000), primaryColor: text(row.primaryColor, 20), accentColor: text(row.accentColor, 20),
    quickFacts, terminals, transport, lounges, foodDrinks, airportHotel, destinationAds, lostFound, lastReviewed: text(row.lastReviewed, 80)
  };
}
function publicDirectoryAirport(row = {}) {
  return {
    iata: cleanIata(row.iata), icao: cleanCode(row.icao, 8), title: text(row.title, 240), city: text(row.locationCity, 180),
    country: text(row.country, 120), timezone: text(row.timezone, 80) || "UTC", logoUrl: text(row.logoIconUrl || row.logoUrl, 2000)
  };
}
async function readPublishedAirports() {
  return restRequest({
    table: "travel_info_airports",
    query: {
      select: "title,iata,icao,country,locationCity,timezone,logoUrl,logoIconUrl,sortOrder,active,published,customer_visible,status",
      active: "eq.true", published: "eq.true", customer_visible: "eq.true", limit: "500"
    }
  });
}
export async function getFlightStatusAirportDirectoryCore() {
  const now = Date.now();
  if (directoryCache && directoryCache.expiresAt > now) return directoryCache.value;
  const rows = arr(await readPublishedAirports()).map(publicDirectoryAirport).filter(item => /^[A-Z0-9]{3,4}$/.test(item.iata)).sort((a, b) => a.iata.localeCompare(b.iata));
  const value = { ok: true, items: rows, meta: { version: FLIGHT_STATUS_CORE_VERSION, loadedAt: new Date().toISOString() } };
  directoryCache = { expiresAt: now + DIRECTORY_TTL_MS, value };
  return value;
}
async function readAirport(code) {
  const rows = await restRequest({
    table: "travel_info_airports",
    query: { select: "*", iata: `eq.${code}`, active: "eq.true", published: "eq.true", customer_visible: "eq.true", limit: "1" }
  });
  return arr(rows)[0] || null;
}
async function readPublicEntitiesForAirport(code) {
  const select = "public_id,entity_type,code,name,slug,featured,sort_priority,details,commercial,localized,media,relations,updated_at";
  const base = { select, entity_type: "in.(TRANSFER,HOTEL,DESTINATION,GUIDED_TOUR,ACTIVITY)", limit: "200" };
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
    publicId: text(row.public_id, 200), entityType, code: text(row.code, 120), title: text(localized.title || row.name, 240), slug: text(row.slug, 240),
    summary: text(localized.shortDescription || localized.fullDescription || details.summary || details.description, 1200), imageUrl: mediaUrl(row),
    destination: text(details.destination || destination.targetName, 180), destinationSlug: text(destination.targetSlug, 240),
    airportIata: cleanIata(details.airportIata || details.searchAirportIata), skandiTier: text(details.skandiTier, 60), transferType: text(details.transferType, 80),
    terminal: text(details.terminal, 40), meetingPoint: text(details.meetingPoint, 500),
    publishedTimeMin: Number.isFinite(Number(details.publishedTimeMin)) ? Number(details.publishedTimeMin) : null,
    publishedTimeMax: Number.isFinite(Number(details.publishedTimeMax)) ? Number(details.publishedTimeMax) : null,
    durationMinutes: Number.isFinite(Number(details.durationMinutes)) ? Number(details.durationMinutes) : null,
    distanceToAirport: Number.isFinite(Number(details.distanceToAirport)) ? Number(details.distanceToAirport) : null,
    guestRating: Number.isFinite(Number(details.guestRating)) ? Number(details.guestRating) : null,
    officialStarRating: Number.isFinite(Number(details.officialStarRating)) ? Number(details.officialStarRating) : null,
    publicPrice: price > 0 ? price : null, currency: text(commercial.currency, 12), priceBasis: text(commercial.priceBasis, 80),
    featured: row.featured === true, sortPriority: Number.isFinite(Number(row.sort_priority)) ? Number(row.sort_priority) : 9999
  };
}
function entitySort(a, b) {
  return Number(b?.featured === true) - Number(a?.featured === true)
    || Number(a?.sortPriority || 9999) - Number(b?.sortPriority || 9999)
    || text(a?.title).localeCompare(text(b?.title));
}
export async function getFlightStatusAirportContextCore(payload = {}) {
  const iata = cleanIata(payload.iata || payload.airport);
  if (!/^[A-Z0-9]{3,4}$/.test(iata)) throw new SkandiError("FLIGHT_STATUS_AIRPORT_REQUIRED", "Airport IATA is required.", { publicMessage: "Select a valid airport." });
  const boardType = lower(payload.boardType || "departures", 20) === "arrivals" ? "arrivals" : "departures";
  const today = currentDateWindow().today;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(text(payload.date, 10)) ? text(payload.date, 10) : today;
  const contextKey = `${iata}|${date}|${boardType}`;
  const cached = contextCache.get(contextKey);
  if (cached && cached.expiresAt > Date.now()) return { ...cached.value, requestSerial: Number(payload.requestSerial || 0), contextKey };
  const [airportRow, entityRows] = await Promise.all([readAirport(iata), readPublicEntitiesForAirport(iata)]);
  if (!airportRow) throw new SkandiError("FLIGHT_STATUS_AIRPORT_NOT_PUBLISHED", `Published airport record not found for ${iata}.`, { publicMessage: "This airport guide is not currently available." });
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
  if (contextCache.size > 80) for (const [key, entry] of contextCache) if (entry.expiresAt <= Date.now()) contextCache.delete(key);
  return { ...value, requestSerial: Number(payload.requestSerial || 0) };
}
export async function handleFlightStatusActionCore(input = {}) {
  const request = record(input);
  const action = upper(request.action, 60);
  const payload = record(request.payload);
  if (action === "SEARCH") return searchFlightStatusCore(payload);
  if (action === "AIRPORT_DIRECTORY") return getFlightStatusAirportDirectoryCore();
  if (action === "AIRPORT_CONTEXT") return getFlightStatusAirportContextCore(payload);
  throw new SkandiError("FLIGHT_STATUS_ACTION_UNSUPPORTED", `Unsupported Flight Status action: ${action || "EMPTY"}`, {
    publicMessage: "Flight Status request is not supported."
  });
}
export { FLIGHT_STATUS_CORE_VERSION };
