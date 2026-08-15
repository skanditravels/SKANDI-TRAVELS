import { webMethod, Permissions } from 'wix-web-module';
import { restRequest } from 'backend/RIA/supabaseServer.js';
import { requestLiveFlights } from 'backend/flightStatusProvider.js';
import {
  normalizeFlights,
  resultMessage
} from "backend/flightStatusMapper.js";

const CACHE_TTL_MS = 60 * 1000;
const MAX_CACHE_ENTRIES = 75;
const ALLOWED_MODES = new Set(["flight", "route", "airport"]);
const ALLOWED_BOARD_TYPES = new Set(["departures", "arrivals"]);
const responseCache = new Map();

export const searchFlightStatus = webMethod(
  Permissions.Anyone,
  async function (input) {
    try {
      const criteria = validateSearch(input);
      const cacheKey = JSON.stringify(criteria);
      const cached = readCache(cacheKey);

      if (cached) {
        return {
          ...cached,
          meta: {
            ...cached.meta,
            cached: true
          }
        };
      }

      const providerPayload = await requestLiveFlights(criteria);
      const items = normalizeFlights(providerPayload?.data, criteria);
      const total = finiteNumber(providerPayload?.pagination?.total);
      const result = {
        ok: true,
        items,
        meta: {
          message: resultMessage(items.length, criteria),
          note:
            total > items.length
              ? `Showing ${items.length} of ${total} matching flights.`
              : "",
          count: items.length,
          total,
          mode: criteria.mode,
          boardType: criteria.boardType,
          date: criteria.date,
          updatedAt: new Date().toISOString(),
          cached: false
        }
      };

      writeCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error("Flight status search failed.", {
        code: cleanCode(error?.code),
        status: finiteNumber(error?.status),
        message: cleanLogMessage(error?.message)
      });

      return {
        ok: false,
        code: cleanCode(error?.code),
        error:
          error?.publicMessage ||
          "Flight status lookup failed. Please try again."
      };
    }
  }
);

function validateSearch(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw validationError("Invalid flight-status request.");
  }

  const mode = token(input.mode, 20).toLowerCase();
  const boardType = token(input.boardType, 20).toLowerCase();
  const date = validateDate(input.date);

  if (!ALLOWED_MODES.has(mode)) {
    throw validationError("Choose flight number, route, or airport board.");
  }
  if (!ALLOWED_BOARD_TYPES.has(boardType)) {
    throw validationError("Choose departures or arrivals.");
  }

  const criteria = {
    mode,
    boardType,
    date,
    flightNumber: "",
    from: "",
    to: "",
    airport: ""
  };

  if (mode === "flight") {
    criteria.flightNumber = normalizeFlightNumber(input.flightNumber);
  }

  if (mode === "route") {
    criteria.from = optionalIata(input.from, "origin");
    criteria.to = optionalIata(input.to, "destination");
    if (!criteria.from && !criteria.to) {
      throw validationError("Enter an origin or destination airport.");
    }
  }

  if (mode === "airport") {
    criteria.airport = requiredIata(input.airport, "airport");
  }

  return criteria;
}

function validateDate(value) {
  const date = token(value, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw validationError("Select a valid flight date.");
  }

  const selected = new Date(`${date}T00:00:00.000Z`);
  if (
    Number.isNaN(selected.getTime()) ||
    selected.toISOString().slice(0, 10) !== date
  ) {
    throw validationError("Select a valid flight date.");
  }

  const todayText = new Date().toISOString().slice(0, 10);
  const today = new Date(`${todayText}T00:00:00.000Z`);
  const minimum = addUtcDays(today, -1);
  const maximum = addUtcDays(today, 3);

  if (selected < minimum || selected > maximum) {
    throw validationError(
      "Flight status is available from yesterday through three days ahead."
    );
  }

  return date;
}

function normalizeFlightNumber(value) {
  const flightNumber = token(value, 12)
    .toUpperCase()
    .replace(/[\s-]+/g, "");

  if (!/^[A-Z0-9]{2,3}\d{1,4}[A-Z]?$/.test(flightNumber)) {
    throw validationError(
      "Enter a valid airline code and flight number, for example SK502."
    );
  }

  return flightNumber;
}

function requiredIata(value, label) {
  const airport = optionalIata(value, label);
  if (!airport) throw validationError(`Enter a valid ${label} IATA code.`);
  return airport;
}

function optionalIata(value, label) {
  const airport = token(value, 4).toUpperCase();
  if (!airport) return "";
  if (!/^[A-Z]{3}$/.test(airport)) {
    throw validationError(`Enter a valid three-letter ${label} IATA code.`);
  }
  return airport;
}

function readCache(key) {
  const entry = responseCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.createdAt > CACHE_TTL_MS) {
    responseCache.delete(key);
    return null;
  }
  return entry.value;
}

function writeCache(key, value) {
  if (responseCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = responseCache.keys().next().value;
    if (oldestKey !== undefined) responseCache.delete(oldestKey);
  }
  responseCache.set(key, {
    createdAt: Date.now(),
    value
  });
}

function validationError(message) {
  const error = new Error(message);
  error.code = "INVALID_FLIGHT_STATUS_SEARCH";
  error.status = 400;
  error.publicMessage = message;
  return error;
}

function token(value, maxLength) {
  return String(value ?? "")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim()
    .slice(0, maxLength);
}

function addUtcDays(date, days) {
  const result = new Date(date.getTime());
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function finiteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function cleanCode(value) {
  const code = token(value, 80)
    .toUpperCase()
    .replace(/[^A-Z0-9_]/g, "_");
  return code || "FLIGHT_STATUS_FAILED";
}

function cleanLogMessage(value) {
  return token(value, 300).replace(/[\r\n\t]+/g, " ");
}
function text(value, max = 120) { return String(value || '').trim().toUpperCase().slice(0, max); }
function mapFlight(row = {}) { return { id: row.id || '', flightKey: row.flight_key || '', flightNumber: row.flight_number || '', airlineCode: row.airline_code || '', airlineName: row.airline_name || '', origin: row.origin || '', destination: row.destination || '', departureDate: row.departure_date || '', scheduledTime: row.scheduled_time || '', estimatedTime: row.estimated_time || '', actualTime: row.actual_time || '', gate: row.gate || '', terminal: row.terminal || '', belt: row.belt || '', status: row.status || '', aircraftType: row.aircraft_type || '' }; }
export const searchFlightStatus = webMethod(Permissions.Anyone, async (input = {}) => {
  const query = text(input.query || input.flightNumber || input.flight || input.origin || input.destination, 120);
  const date = String(input.date || input.departureDate || '').slice(0, 10);
  const rows = await restRequest({ table: 'altea_fids_flights', query: { select: 'id,flight_key,flight_number,airline_code,airline_name,origin,destination,departure_date,scheduled_time,estimated_time,actual_time,gate,terminal,belt,status,aircraft_type', order: 'departure_date.desc,scheduled_time.asc', limit: 500 } });
  const items = (rows || []).filter((row) => (!date || row.departure_date === date) && (!query || `${row.flight_number} ${row.airline_code} ${row.origin} ${row.destination}`.toUpperCase().includes(query))).map(mapFlight);
  return { ok: true, items, meta: { query, date } };
});
