// /src/backend/SKANDI_CORE/flightStatus.js
// SKANDI Flight Status B-011.40 — AirLabs v9 strict provider contract.
// API request parameters are endpoint-specific and limited to AirLabs-documented
// fields. Public airport context remains on canonical Supabase resources.

import { fetch } from "wix-fetch";
import { elevate } from "wix-auth";
import { secrets } from "wix-secrets-backend.v2";
import { restRequest } from "backend/SKANDI_CORE/supabaseServer.js";
import { SkandiError } from "backend/SKANDI_CORE/platformErrors.js";
import {
  text,
  upper,
  lower,
  record,
  safeNumber
} from "backend/SKANDI_CORE/platformValidation.js";

const FLIGHT_STATUS_CORE_VERSION = "B-011.40";
const AIRLABS_BASE = "https://airlabs.co/api/v9";
const AIRLABS_SECRET_NAMES = Object.freeze([
  "AIRLABS_API_KEY",
  "AIRLABS_KEY",
  "airlabs",
  "AIRLABS"
]);

const getSecretValue = elevate(secrets.getSecretValue);

const PUBLIC_ENTITY_TYPES = new Set([
  "TRANSFER",
  "HOTEL",
  "DESTINATION",
  "GUIDED_TOUR",
  "ACTIVITY"
]);

const DIRECTORY_TTL_MS = 5 * 60 * 1000;
const CONTEXT_TTL_MS = 2 * 60 * 1000;

let airlabsKeyPromise = null;
let directoryCache = null;
const contextCache = new Map();

function arr(value) {
  return Array.isArray(value) ? value : [];
}

function cleanIata(value) {
  return upper(value, 4)
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 4);
}

function cleanCode(value, max = 12) {
  return upper(value, max)
    .replace(/[^A-Z0-9-]/g, "");
}

function isoDateOnly(value = new Date()) {
  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function currentDateWindow() {
  const today = isoDateOnly(new Date());

  return {
    min: today,
    today,
    max: today
  };
}

function validateClientDate(value) {
  const date = text(value, 10);

  if (
    date &&
    !/^\d{4}-\d{2}-\d{2}$/.test(date)
  ) {
    throw new SkandiError(
      "FLIGHT_STATUS_DATE_INVALID",
      "Flight status date is invalid.",
      {
        publicMessage:
          "Please reload Flight Status and try again."
      }
    );
  }

  // AirLabs /schedules is a current live window and does not accept a date
  // parameter. Keep the client date only as display/request context.
  return date || currentDateWindow().today;
}

function parseLooseJson(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  if (typeof value === "object") return value;

  const raw = text(value, 100000);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch (_) {}

  try {
    return JSON.parse(
      raw.replace(/,\s*([}\]])/g, "$1")
    );
  } catch (_) {}

  return raw;
}

function normalizeLooseList(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return [];
  }

  const parsed = parseLooseJson(value);
  const input =
    Array.isArray(parsed)
      ? parsed
      : [parsed];

  const out = [];

  for (const entry of input) {
    const next = parseLooseJson(entry);

    if (Array.isArray(next)) {
      out.push(...next.filter(Boolean));
    } else if (
      next !== null &&
      next !== undefined &&
      next !== ""
    ) {
      out.push(next);
    }
  }

  return out;
}

function normalizeLooseObject(value) {
  const parsed = parseLooseJson(value);

  return parsed &&
    typeof parsed === "object" &&
    !Array.isArray(parsed)
      ? parsed
      : {};
}

function secretText(result) {
  if (typeof result === "string") {
    return result.trim();
  }

  return text(
    result?.value ??
    result?.secretValue ??
    result?.secret?.value ??
    "",
    5000
  );
}

async function airlabsApiKey() {
  if (airlabsKeyPromise) {
    return airlabsKeyPromise;
  }

  airlabsKeyPromise = (async () => {
    for (const name of AIRLABS_SECRET_NAMES) {
      try {
        const value = secretText(
          await getSecretValue(name)
        );

        if (value) return value;
      } catch (_) {}
    }

    throw new SkandiError(
      "AIRLABS_API_KEY_MISSING",
      "AirLabs credential is not configured.",
      {
        publicMessage:
          "Live flight status is temporarily unavailable."
      }
    );
  })();

  try {
    return await airlabsKeyPromise;
  } catch (error) {
    airlabsKeyPromise = null;
    throw error;
  }
}

function airlabsErrorCode(payload) {
  return lower(
    payload?.error?.code || "",
    80
  );
}

function airlabsErrorMessage(payload, status) {
  return text(
    payload?.error?.message ||
    payload?.message ||
    `AIRLABS_HTTP_${status}`,
    500
  );
}

async function callAirlabs(endpoint, params = {}) {
  const key = await airlabsApiKey();
  const query = new URLSearchParams();

  for (const [name, value] of Object.entries(params)) {
    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      continue;
    }

    query.set(name, String(value));
  }

  query.set("api_key", key);

  let response;

  try {
    response = await fetch(
      `${AIRLABS_BASE}/${endpoint}?${query.toString()}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json"
        }
      }
    );
  } catch (_) {
    throw new SkandiError(
      "AIRLABS_NETWORK_ERROR",
      "AirLabs request failed.",
      {
        retryable: true,
        publicMessage:
          "Live flight information could not be reached. Please try again."
      }
    );
  }

  const raw = await response.text();
  let payload = {};

  if (raw) {
    try {
      payload = JSON.parse(raw);
    } catch (_) {
      throw new SkandiError(
        "AIRLABS_INVALID_RESPONSE",
        "AirLabs returned invalid JSON.",
        {
          status: response.status,
          retryable: response.status >= 500,
          publicMessage:
            "Live flight information returned an invalid response. Please try again."
        }
      );
    }
  }

  const code = airlabsErrorCode(payload);

  if (code === "not_found") {
    return {
      response: null,
      request: payload?.request || null
    };
  }

  if (!response.ok || payload?.error) {
    const providerMessage =
      airlabsErrorMessage(
        payload,
        response.status
      );

    const retryable =
      code === "minute_limit_exceeded" ||
      code === "hour_limit_exceeded" ||
      response.status === 429 ||
      response.status >= 500;

    let publicMessage =
      "Live flight information is temporarily unavailable. Please try again.";

    if (
      code === "unknown_api_key" ||
      code === "expired_api_key"
    ) {
      publicMessage =
        "Live flight status is temporarily unavailable.";
    } else if (
      code === "minute_limit_exceeded" ||
      code === "hour_limit_exceeded" ||
      code === "month_limit_exceeded"
    ) {
      publicMessage =
        "The live flight feed has reached its AirLabs request limit. Please try again later.";
    } else if (code === "wrong_params") {
      publicMessage =
        "The live flight provider rejected this search request.";
    }

    throw new SkandiError(
      "AIRLABS_REQUEST_FAILED",
      `${code || "provider_error"}: ${providerMessage}`,
      {
        status: response.status,
        retryable,
        publicMessage
      }
    );
  }

  return payload;
}

function airlabsResponse(payload) {
  if (
    payload &&
    typeof payload === "object" &&
    Object.prototype.hasOwnProperty.call(
      payload,
      "response"
    )
  ) {
    return payload.response;
  }

  // AirLabs' endpoint docs sometimes show the unwrapped payload directly.
  // This fallback keeps the integration compatible with both documented forms.
  return payload;
}

function utcTimestamp(utcValue, localValue) {
  const utc = text(utcValue, 50).trim();

  if (utc) {
    const normalized =
      utc.replace(" ", "T");

    if (
      /Z$|[+-]\d{2}:?\d{2}$/.test(normalized)
    ) {
      return normalized;
    }

    return `${
      normalized.length === 16
        ? `${normalized}:00`
        : normalized
    }Z`;
  }

  const local = text(localValue, 50).trim();
  if (!local) return "";

  return local.replace(" ", "T");
}

function normalizedStatus(value) {
  const status = lower(value, 80);

  if (status === "active") {
    return "en-route";
  }

  if (status === "en route") {
    return "en-route";
  }

  return status || "scheduled";
}

function normalizeScheduleFlight(item = {}) {
  const flightIata = text(
    item.flight_iata ||
    `${item.airline_iata || ""}${
      item.flight_number || ""
    }`,
    24
  );

  return {
    id: text(
      `${flightIata}|${
        item.dep_time_ts ||
        item.dep_time_utc ||
        item.dep_time ||
        ""
      }|${
        item.arr_time_ts ||
        item.arr_time_utc ||
        item.arr_time ||
        ""
      }`,
      240
    ),

    flightIata,
    flightIcao:
      text(item.flight_icao, 24),
    flightNumber:
      text(item.flight_number, 16),

    airlineName:
      text(item.airline_iata, 180),
    airlineIata:
      cleanCode(item.airline_iata, 4),
    airlineIcao:
      cleanCode(item.airline_icao, 6),
    airlineLogoUrl: "",

    operatingAirlineIata:
      cleanCode(
        item.cs_airline_iata,
        4
      ),
    operatingFlightIata:
      text(item.cs_flight_iata, 24),

    status:
      normalizedStatus(item.status),

    departure: {
      airport:
        cleanIata(item.dep_iata),
      city: "",
      iata:
        cleanIata(item.dep_iata),
      icao:
        cleanCode(item.dep_icao, 8),
      terminal:
        text(item.dep_terminal, 40),
      gate:
        text(item.dep_gate, 40),
      timezone: "",
      scheduled:
        utcTimestamp(
          item.dep_time_utc,
          item.dep_time
        ),
      estimated:
        utcTimestamp(
          item.dep_estimated_utc,
          item.dep_estimated
        ),
      actual:
        utcTimestamp(
          item.dep_actual_utc,
          item.dep_actual
        ),
      delay:
        item.dep_delayed ??
        item.delayed ??
        ""
    },

    arrival: {
      airport:
        cleanIata(item.arr_iata),
      city: "",
      iata:
        cleanIata(item.arr_iata),
      icao:
        cleanCode(item.arr_icao, 8),
      terminal:
        text(item.arr_terminal, 40),
      gate:
        text(item.arr_gate, 40),
      baggage:
        text(item.arr_baggage, 40),
      timezone: "",
      scheduled:
        utcTimestamp(
          item.arr_time_utc,
          item.arr_time
        ),
      estimated:
        utcTimestamp(
          item.arr_estimated_utc,
          item.arr_estimated
        ),
      actual:
        utcTimestamp(
          item.arr_actual_utc,
          item.arr_actual
        ),
      delay:
        item.arr_delayed ??
        item.delayed ??
        ""
    },

    aircraft: {
      registration: "",
      iata: "",
      icao: "",
      model: "",
      manufacturer: ""
    },

    live: null
  };
}

function normalizeDetailedFlight(item = {}) {
  const base =
    normalizeScheduleFlight(item);

  return {
    ...base,

    aircraft: {
      registration:
        text(item.reg_number, 40),
      iata: "",
      icao:
        text(item.aircraft_icao, 20),
      model:
        text(item.model, 180),
      manufacturer:
        text(item.manufacturer, 120)
    },

    live: (
      Number.isFinite(Number(item.lat)) &&
      Number.isFinite(Number(item.lng))
    )
      ? {
          updated:
            text(item.updated, 80),
          latitude:
            Number(item.lat),
          longitude:
            Number(item.lng),
          altitude:
            Number.isFinite(Number(item.alt))
              ? Number(item.alt)
              : null
        }
      : null
  };
}

function validateSearch(payload = {}) {
  const modeRaw =
    lower(
      payload.mode || "airport",
      20
    );

  const mode =
    ["flight", "route", "airport"]
      .includes(modeRaw)
      ? modeRaw
      : "airport";

  const date =
    validateClientDate(payload.date);

  const out = {
    mode,
    date,
    flightNumber:
      upper(payload.flightNumber, 16)
        .replace(/[^A-Z0-9]/g, ""),
    from:
      cleanIata(payload.from),
    to:
      cleanIata(payload.to),
    airport:
      cleanIata(payload.airport),
    boardType:
      lower(
        payload.boardType || "departures",
        20
      ) === "arrivals"
        ? "arrivals"
        : "departures"
  };

  if (
    mode === "flight" &&
    !out.flightNumber
  ) {
    throw new SkandiError(
      "FLIGHT_STATUS_FLIGHT_REQUIRED",
      "Flight number is required.",
      {
        publicMessage:
          "Enter a flight number."
      }
    );
  }

  if (
    mode === "route" &&
    !out.from &&
    !out.to
  ) {
    throw new SkandiError(
      "FLIGHT_STATUS_ROUTE_REQUIRED",
      "Route airport is required.",
      {
        publicMessage:
          "Enter at least a From or To airport."
      }
    );
  }

  if (
    mode === "airport" &&
    !/^[A-Z0-9]{3,4}$/.test(
      out.airport
    )
  ) {
    throw new SkandiError(
      "FLIGHT_STATUS_AIRPORT_REQUIRED",
      "Airport IATA code is required.",
      {
        publicMessage:
          "Select an airport or enter a valid airport code."
      }
    );
  }

  return out;
}

function flightIdentifierParams(value) {
  const flight =
    upper(value, 16)
      .replace(/[^A-Z0-9]/g, "");

  if (
    /^[A-Z]{3}\d+[A-Z]?$/.test(flight)
  ) {
    return {
      flight_icao: flight
    };
  }

  return {
    flight_iata: flight
  };
}

export async function searchFlightStatusCore(
  payload = {}
) {
  const p = validateSearch(payload);

  if (p.mode === "flight") {
    // AirLabs /flight documented request contract:
    // api_key + one of flight_iata / flight_icao.
    const result =
      await callAirlabs(
        "flight",
        flightIdentifierParams(
          p.flightNumber
        )
      );

    const response =
      airlabsResponse(result);

    const rows =
      response &&
      typeof response === "object" &&
      !Array.isArray(response)
        ? [
            normalizeDetailedFlight(
              response
            )
          ]
        : arr(response)
            .map(
              normalizeDetailedFlight
            );

    return {
      ok: true,
      items:
        rows.filter(
          item =>
            item.flightIata ||
            item.flightIcao ||
            item.departure.iata ||
            item.arrival.iata
        ),
      meta: {
        mode: p.mode,
        date: p.date,
        boardType: p.boardType,
        provider: "airlabs",
        providerApi: "v9",
        endpoint: "flight",
        providerScope:
          "closest-live-scheduled-or-landed-flight",
        searchedAt:
          new Date().toISOString()
      }
    };
  }

  // AirLabs /schedules documented request contract:
  // api_key plus one or more supported flight/airport/airline filters.
  const params = {};

  if (p.mode === "route") {
    if (p.from) {
      params.dep_iata = p.from;
    }

    if (p.to) {
      params.arr_iata = p.to;
    }
  }

  if (p.mode === "airport") {
    if (p.boardType === "arrivals") {
      params.arr_iata = p.airport;
    } else {
      params.dep_iata = p.airport;
    }
  }

  const result =
    await callAirlabs(
      "schedules",
      params
    );

  const response =
    airlabsResponse(result);

  const rawRows =
    Array.isArray(response)
      ? response
      : response &&
        typeof response === "object"
        ? [response]
        : [];

  // Do not post-filter by calendar date. AirLabs controls the live schedule
  // window and explicitly documents that /schedules returns up to ~10h ahead.
  const rows =
    rawRows.map(
      normalizeScheduleFlight
    );

  return {
    ok: true,
    items: rows,
    meta: {
      mode: p.mode,
      date: p.date,
      boardType: p.boardType,
      airport: p.airport,
      provider: "airlabs",
      providerApi: "v9",
      endpoint: "schedules",
      providerScope:
        "current-live-schedule-window",
      searchedAt:
        new Date().toISOString(),
      note:
        rows.length
          ? ""
          : "AirLabs returned no flights in the current live schedule window."
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
  const hero =
    media.find(item => item?.isHero || item?.isPrimary || upper(item?.role, 20) === "PRIMARY") ||
    media[0] ||
    {};

  return {
    iata: cleanIata(row.iata),
    icao: cleanCode(row.icao, 8),
    title: text(row.title || en.title, 240),
    city: text(row.locationCity, 180),
    country: text(row.country, 120),
    timezone: text(row.timezone, 80) || "UTC",
    summary: text(row.summary || en.shortDescription || row.information || row.body, 3000),
    information: text(row.information, 5000),
    distanceToCityCenterKm: Number.isFinite(Number(row.distanceToCityCenterKm))
      ? Number(row.distanceToCityCenterKm)
      : null,
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

  const value = {
    ok: true,
    items: rows,
    meta: {
      version: FLIGHT_STATUS_CORE_VERSION,
      loadedAt: new Date().toISOString()
    }
  };

  directoryCache = {
    expiresAt: now + DIRECTORY_TTL_MS,
    value
  };

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
  const select =
    "public_id,entity_type,code,name,slug,featured,sort_priority,details,commercial,localized,media,relations,updated_at";
  const base = {
    select,
    entity_type: "in.(TRANSFER,HOTEL,DESTINATION,GUIDED_TOUR,ACTIVITY)",
    limit: "200"
  };

  const [bySearchAirport, byAirport] = await Promise.all([
    restRequest({
      table: "inventory_public_entities_v",
      query: { ...base, "details->>searchAirportIata": `eq.${code}` }
    }),
    restRequest({
      table: "inventory_public_entities_v",
      query: { ...base, "details->>airportIata": `eq.${code}` }
    })
  ]);

  const map = new Map();
  for (const row of [...arr(bySearchAirport), ...arr(byAirport)]) {
    const key = text(
      row?.public_id || row?.id || `${row?.entity_type}:${row?.slug}`,
      300
    );
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
  const chosen =
    media.find(item =>
      item?.isHero ||
      item?.isPrimary ||
      ["HERO", "PRIMARY", "CARD"].includes(upper(item?.role, 20))
    ) ||
    media[0] ||
    {};

  return text(chosen?.url, 2000);
}

function destinationRelation(row = {}) {
  return normalizeLooseList(row.relations)
    .find(rel => upper(rel?.targetType, 30) === "DESTINATION") || {};
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
    summary: text(
      localized.shortDescription ||
      localized.fullDescription ||
      details.summary ||
      details.description,
      1200
    ),
    imageUrl: mediaUrl(row),
    destination: text(details.destination || destination.targetName, 180),
    destinationSlug: text(destination.targetSlug, 240),
    airportIata: cleanIata(details.airportIata || details.searchAirportIata),
    skandiTier: text(details.skandiTier, 60),
    transferType: text(details.transferType, 80),
    terminal: text(details.terminal, 40),
    meetingPoint: text(details.meetingPoint, 500),
    publishedTimeMin: Number.isFinite(Number(details.publishedTimeMin))
      ? Number(details.publishedTimeMin)
      : null,
    publishedTimeMax: Number.isFinite(Number(details.publishedTimeMax))
      ? Number(details.publishedTimeMax)
      : null,
    durationMinutes: Number.isFinite(Number(details.durationMinutes))
      ? Number(details.durationMinutes)
      : null,
    distanceToAirport: Number.isFinite(Number(details.distanceToAirport))
      ? Number(details.distanceToAirport)
      : null,
    guestRating: Number.isFinite(Number(details.guestRating))
      ? Number(details.guestRating)
      : null,
    officialStarRating: Number.isFinite(Number(details.officialStarRating))
      ? Number(details.officialStarRating)
      : null,
    publicPrice: price > 0 ? price : null,
    currency: text(commercial.currency, 12),
    priceBasis: text(commercial.priceBasis, 80),
    featured: row.featured === true,
    sortPriority: Number.isFinite(Number(row.sort_priority))
      ? Number(row.sort_priority)
      : 9999
  };
}

function entitySort(a, b) {
  return (
    Number(b?.featured === true) -
      Number(a?.featured === true) ||
    Number(a?.sortPriority || 9999) -
      Number(b?.sortPriority || 9999) ||
    text(a?.title).localeCompare(text(b?.title))
  );
}

export async function getFlightStatusAirportContextCore(payload = {}) {
  const iata = cleanIata(payload.iata || payload.airport);

  if (!/^[A-Z0-9]{3,4}$/.test(iata)) {
    throw new SkandiError(
      "FLIGHT_STATUS_AIRPORT_REQUIRED",
      "Airport IATA is required.",
      { publicMessage: "Select a valid airport." }
    );
  }

  const boardType =
    lower(payload.boardType || "departures", 20) === "arrivals"
      ? "arrivals"
      : "departures";

  const today = currentDateWindow().today;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(text(payload.date, 10))
    ? text(payload.date, 10)
    : today;

  const contextKey = `${iata}|${date}|${boardType}`;
  const cached = contextCache.get(contextKey);

  if (cached && cached.expiresAt > Date.now()) {
    return {
      ...cached.value,
      requestSerial: Number(payload.requestSerial || 0),
      contextKey
    };
  }

  const [airportRow, entityRows] = await Promise.all([
    readAirport(iata),
    readPublicEntitiesForAirport(iata)
  ]);

  if (!airportRow) {
    throw new SkandiError(
      "FLIGHT_STATUS_AIRPORT_NOT_PUBLISHED",
      `Published airport record not found for ${iata}.`,
      { publicMessage: "This airport guide is not currently available." }
    );
  }

  const entities = entityRows
    .map(publicEntity)
    .filter(Boolean)
    .sort(entitySort);

  const value = {
    ok: true,
    airport: publicAirport(airportRow),
    commerce: {
      transferOffers: entities
        .filter(item => item.entityType === "TRANSFER")
        .slice(0, 4),
      hotels: entities
        .filter(item => item.entityType === "HOTEL")
        .slice(0, 6),
      destinations: entities
        .filter(item => item.entityType === "DESTINATION")
        .slice(0, 6),
      tours: entities
        .filter(item =>
          item.entityType === "GUIDED_TOUR" ||
          item.entityType === "ACTIVITY"
        )
        .slice(0, 6)
    },
    meta: {
      version: FLIGHT_STATUS_CORE_VERSION,
      iata,
      date,
      boardType,
      loadedAt: new Date().toISOString()
    },
    contextKey
  };

  contextCache.set(contextKey, {
    expiresAt: Date.now() + CONTEXT_TTL_MS,
    value
  });

  if (contextCache.size > 80) {
    for (const [key, entry] of contextCache) {
      if (entry.expiresAt <= Date.now()) contextCache.delete(key);
    }
  }

  return {
    ...value,
    requestSerial: Number(payload.requestSerial || 0)
  };
}

export async function handleFlightStatusActionCore(
  input = {}
) {
  const request =
    record(input);

  const action =
    upper(
      request.action,
      60
    );

  const payload =
    record(
      request.payload
    );

  if (action === "SEARCH") {
    return searchFlightStatusCore(
      payload
    );
  }

  if (
    action === "AIRPORT_DIRECTORY"
  ) {
    return getFlightStatusAirportDirectoryCore();
  }

  if (
    action === "AIRPORT_CONTEXT"
  ) {
    return getFlightStatusAirportContextCore(
      payload
    );
  }

  throw new SkandiError(
    "FLIGHT_STATUS_ACTION_UNSUPPORTED",
    `Unsupported Flight Status action: ${action || "EMPTY"}`,
    {
      publicMessage:
        "Flight Status request is not supported."
    }
  );
}

export {
  FLIGHT_STATUS_CORE_VERSION
};
