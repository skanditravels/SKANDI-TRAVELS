// Swedavia AirportInfo, WaitTime and FlightInfo v2 public data.
import { fetch } from "wix-fetch";
import { elevate } from "wix-auth";
import { secrets } from "wix-secrets-backend.v2";
import { TtlCache } from "backend/SKANDI_CORE/platformCache";
import { restRequest } from "backend/SKANDI_CORE/supabaseServer";
import { lower, record, text, upper } from "backend/SKANDI_CORE/platformValidation";

const BASE = "https://api.swedavia.se";
const AIRPORT_INFO = "airportinfo/v2";
const WAIT_TIME = "waittimepublic/v2";
const FLIGHT_INFO = "flightinfo/v2";
const SECRET_NAMES = {
  [AIRPORT_INFO]: "SWEDAVIA_AIRPORT_INFO_SUBSCRIPTION_KEY",
  [WAIT_TIME]: "SWEDAVIA_WAIT_TIME_SUBSCRIPTION_KEY",
  [FLIGHT_INFO]: "SWEDAVIA_FLIGHT_INFO_SUBSCRIPTION_KEY"
};
const AIRPORTS = {
  ARN: "ESSA", BMA: "ESSB", GOT: "ESGG", MMX: "ESMS", LLA: "ESPA",
  UME: "ESNU", OSD: "ESNZ", VBY: "ESSV", RNB: "ESDF", KRN: "ESNQ"
};
const SECURITY_AIRPORTS = new Set(["ARN", "BMA", "GOT"]);
const LANGUAGES = new Set(["en", "sv", "no", "da", "fi"]);
const FACILITIES = ["restaurants", "shops", "services"];
const TTL = {
  languages: 6 * 60 * 60 * 1000,
  facilities: 30 * 60 * 1000,
  parking: 10 * 60 * 1000,
  routes: 60 * 60 * 1000,
  flights: 60 * 1000,
  security: 60 * 1000,
  unavailable: 30 * 1000
};
const MAX_WAIT_AGE_MS = 5 * 60 * 1000;
const SWEDAVIA_ZONE = "Europe/Stockholm";
const DAY_MS = 86_400_000;
const localDate = new Intl.DateTimeFormat("en-CA", { timeZone: SWEDAVIA_ZONE, year: "numeric", month: "2-digit", day: "2-digit" });
const localClock = new Intl.DateTimeFormat("en-GB", { timeZone: SWEDAVIA_ZONE, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const FLIGHT_STATES = {
  SCH: "scheduled", FPL: "scheduled", FLS: "suspended", SEQ: "sequenced", ACT: "en-route",
  CAN: "cancelled", LAN: "landed", RER: "rerouted", DIV: "diverted"
};
const getSecretValue = elevate(secrets.getSecretValue);
const cache = new TtlCache({ maxEntries: 250 });
const inFlight = new Map();
const productCooldown = new Map();
const unavailable = () => ({ status: "unavailable" });

function reportUnavailable(product, reason) {
  const key = `diagnostic:${product}:${reason}`;
  if (cache.get(key)) return;
  cache.set(key, true, TTL.security);
  console.warn(`[Travel Info] Swedavia ${product}: ${reason}`);
}

function fields(value) {
  return Object.fromEntries(Object.entries(record(value)).map(([key, entry]) => [key.toLowerCase(), entry]));
}

function list(value, field) {
  const rows = field && !Array.isArray(value) ? fields(value)[field] : value;
  if (!Array.isArray(rows)) throw new Error("Unexpected Swedavia response shape");
  return rows;
}

function deadline(promise, timeoutMs = 4000) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error("Swedavia request timed out")), timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function subscriptionKey(product) {
  return cache.getOrLoad(`secret:${product}`, async () => {
    try {
      const result = await deadline(getSecretValue(SECRET_NAMES[product]));
      return text(typeof result === "string" ? result : result?.value ?? result?.secretValue ?? result?.secret?.value);
    } catch (_) {
      return "";
    }
  }, TTL.security);
}

function throttleUntil(response) {
  const now = Date.now();
  const header = text(response.headers?.get?.("Retry-After"), 100);
  const retryAt = /^\d+$/.test(header) ? now + Number(header) * 1000 : Date.parse(header);
  return Number.isFinite(retryAt) && retryAt > now ? retryAt : now + MAX_WAIT_AGE_MS;
}

async function readProduct(product, path, normalize) {
  if ((productCooldown.get(product) || 0) > Date.now()) return unavailable();
  const key = await subscriptionKey(product);
  if (!key) {
    reportUnavailable(product, "Wix subscription key not available");
    return unavailable();
  }
  return deadline(fetchProduct(product, path, key, normalize));
}

async function fetchProduct(product, path, key, normalize) {
  const response = await fetch(`${BASE}/${product}/${path}`, {
    method: "GET",
    redirect: "error",
    headers: { Accept: "application/json", "Ocp-Apim-Subscription-Key": key }
  });
  if (!response.ok) {
    if (response.status === 429) productCooldown.set(product, throttleUntil(response));
    if (response.status === 401 || response.status === 403) productCooldown.set(product, Date.now() + TTL.security);
    reportUnavailable(product, `HTTP ${Number(response.status) || 0}`);
    return unavailable();
  }
  try {
    const snapshot = await normalize(response.status === 204 ? [] : await response.json(), response.headers);
    return { ...snapshot, status: "ready" };
  } catch (_) {
    reportUnavailable(product, "Response could not be decoded");
    return unavailable();
  }
}

function readSection(product, path, ttl, normalize) {
  const key = `${product}/${path}`;
  const cached = cache.get(key);
  if (cached) return Promise.resolve(cached);
  if (inFlight.has(key)) return inFlight.get(key);
  const pending = readProduct(product, path, normalize)
    .catch(() => {
      reportUnavailable(product, "Request failed or timed out");
      return unavailable();
    })
    .then(result => cache.set(key, result, result.status === "ready" ? ttl : TTL.unavailable))
    .finally(() => inFlight.delete(key));
  inFlight.set(key, pending);
  return pending;
}

function utcMeasurement(value) {
  const raw = text(value, 60).replace(" ", "T");
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(raw)) return NaN;
  return Date.parse(/(?:Z|[+-]\d{2}:?\d{2})$/i.test(raw) ? raw : `${raw}Z`);
}

function checkpoints(value) {
  const rows = typeof fields(value).queuename === "string" ? [value] : list(value);
  const items = rows.map(fields).filter(row => plainText(row.queuename, 160)).map(row => {
    const measuredAtMs = utcMeasurement(row.currenttime);
    const validTime = Number.isFinite(measuredAtMs) && measuredAtMs <= Date.now() + 30_000;
    const projected = row.currentprojectedwaittime;
    return {
      name: plainText(row.queuename, 160),
      terminal: plainText(row.terminal, 80),
      fastTrack: typeof row.isfasttrack === "boolean" ? row.isfasttrack : null,
      overflow: row.overflow === true,
      measuredAt: validTime ? new Date(measuredAtMs).toISOString() : "",
      validUntil: validTime ? measuredAtMs + MAX_WAIT_AGE_MS : null,
      minutes: validTime && row.overflow === false && Number.isInteger(projected) && projected >= 0 ? projected : null
    };
  });
  return { items };
}

function plainText(value, limit = 1600) {
  return text(typeof value === "string" ? value : "", limit * 4)
    .replace(/<\/?(?:br|p|div|li)\b[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\n\s*\n/g, "\n")
    .trim().slice(0, limit);
}

function facilityList(value, iata) {
  return {
    items: list(value).map(fields).filter(row => text(row.name) && (!row.airportiata || upper(row.airportiata) === iata))
      .map(row => {
        const location = fields(row.location);
        const appImage = bookingLink(row.appimgurl, "https://www.swedavia.com");
        const photo = bookingLink(row.photoimgurl, "https://www.swedavia.com");
        const isLogo = url => url && /(?:logo|logotyp)/i.test(new URL(url).pathname);
        const logoUrl = [appImage, photo].find(isLogo);
        const imageUrl = [photo, appImage].find(url => url && !isLogo(url));
        return {
          name: plainText(row.name, 160),
          description: plainText(row.description),
          openingHours: plainText(row.openinghours, 800),
          terminal: plainText(location.terminalname || location.terminalid, 100),
          place: plainText(location.place, 200),
          beforeSecurity: typeof location.beforesecurity === "boolean" ? location.beforesecurity : null,
          ...(logoUrl ? { logoUrl } : {}),
          ...(imageUrl ? { imageUrl } : {})
        };
      }).filter(item => item.name)
  };
}

async function airportFacilities(iata, language) {
  const languages = await readSection(AIRPORT_INFO, "languages", TTL.languages, value => ({
    codes: list(value).map(fields).map(row => lower(row.langcode, 8)).filter(code => /^[a-z]{2}$/.test(code))
  }));
  const supported = languages.codes || [];
  const candidates = language === "no" ? ["no", "nb", "nn"] : [language];
  const preferred = candidates.find(code => supported.includes(code));
  const providerLanguage = preferred || ["en", "sv"].find(code => supported.includes(code))
    || (language === "sv" ? "sv" : "en");
  const results = await Promise.all(FACILITIES.map(kind => readSection(
    AIRPORT_INFO, `${iata}/${kind}?langcode=${providerLanguage}`, TTL.facilities, value => facilityList(value, iata)
  )));
  const groups = Object.fromEntries(FACILITIES.map((kind, index) => [kind, results[index]]));
  if (groups.restaurants.items?.length) {
    const logos = await deadline(restaurantLogos(), 800).catch(() => new Map());
    groups.restaurants = {
      ...groups.restaurants,
      items: groups.restaurants.items.map(item => {
        const logoUrl = logos.get(venueKey(item.name));
        return logoUrl ? { ...item, logoUrl } : item;
      })
    };
  }
  return { status: results.some(result => result.status === "ready") ? "ready" : "unavailable", providerLanguage, groups };
}

function venueKey(value) {
  return lower(value, 160).normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/[^a-z0-9]+/g, "");
}

function restaurantLogos() {
  return cache.getOrLoad("restaurant-public-logos", async () => {
    const rows = await restRequest({
      table: "platform_assets",
      query: {
        select: "brand,public_url", category: "eq.AIRPORT_RESTAURANT_LOGO", status: "eq.ACTIVE",
        visibility: "eq.PUBLIC", asset_type: "eq.IMAGE", order: "updated_at.desc", limit: "250"
      }
    });
    const logos = new Map();
    for (const row of Array.isArray(rows) ? rows : []) {
      const name = venueKey(row.brand);
      const logo = bookingLink(row.public_url);
      if (name && logo && !logos.has(name)) logos.set(name, logo);
    }
    return logos;
  }, TTL.facilities);
}

function bookingLink(value, imageBase) {
  try {
    const raw = text(value, 2048);
    if (!raw) return "";
    const link = new URL(raw, imageBase && raw.startsWith("/") ? imageBase : undefined);
    return link.protocol === "https:" && !link.username && !link.password ? link.href : "";
  } catch (_) { return ""; }
}

function parkingLots(value, iata) {
  const response = fields(value);
  return {
    bookingUrl: bookingLink(response.bookinginformationlink),
    items: list(value, "carparks").map(fields)
      .filter(row => text(row.carparkname) && (!row.iata || upper(row.iata) === iata))
      .map(row => ({
        name: plainText(row.carparkname, 160),
        terminal: plainText(row.terminal, 100),
        category: plainText(row.categoryname, 100),
        description: plainText(row.productlabel, 240),
        transfer: plainText(row.transfermethod, 160)
      }))
  };
}

function destinations(value) {
  const routes = new Map();
  for (const row of list(value, "citydestinations").map(fields)) {
    const iata = upper(row.iata);
    if (!/^[A-Z]{3}$/.test(iata)) continue;
    const operators = Array.isArray(row.operators) ? row.operators.map(fields) : [];
    const airlines = routes.get(iata) || new Set();
    for (const operator of operators) {
      const name = plainText(operator.name, 160);
      if (name) airlines.add(name);
    }
    routes.set(iata, airlines);
  }
  return { items: [...routes].map(([iata, airlines]) => ({ iata, airlines: [...airlines] })) };
}

async function routeAirportNames(items, loadGeography) {
  if (!items.length) return items;
  const codes = items.map(item => item.iata);
  // The view exposes the approved airport directory. Bound the IN list per call.
  const lookups = [];
  for (let index = 0; index < codes.length; index += 100) {
    const batch = codes.slice(index, index + 100);
    lookups.push(restRequest({
      table: "inventory_public_entities_v",
      query: {
        select: "code,name,city:details->>city,country:details->>country,countryCode:details->>countryCode",
        entity_type: "eq.AIRPORT", code: `in.(${batch.join(",")})`, limit: "100"
      }
    }));
  }
  const [rows, geography] = await Promise.all([
    Promise.allSettled(lookups.map(lookup => deadline(lookup, 900))).then(results => results.flatMap(outcome =>
      outcome.status === "fulfilled" && Array.isArray(outcome.value) ? outcome.value : []
    )),
    loadGeography ? deadline(loadGeography(), 2200).catch(() => new Map()) : new Map()
  ]);
  const names = new Map(rows.map(row => [upper(row.code), row]));
  return items.map(item => {
    const airport = names.get(item.iata);
    const fallback = geography.get(item.iata);
    const name = plainText(airport?.name || fallback?.name, 180);
    const city = plainText(airport?.city || fallback?.city, 140);
    const country = plainText(airport?.country, 140);
    const storedCode = upper(airport?.countryCode || country, 8);
    const countryCode = /^[A-Z]{2}$/.test(storedCode) ? storedCode : fallback?.countryCode;
    return { ...item, ...(name ? { name } : {}), ...(city ? { city } : {}), ...(country ? { country } : {}),
      ...(/^[A-Z]{2}$/.test(countryCode) ? { countryCode } : {}) };
  });
}

export function swedaviaAirportIata(airport) {
  const code = upper(airport, 8);
  if (Object.hasOwn(AIRPORTS, code)) return code;
  return Object.keys(AIRPORTS).find(iata => AIRPORTS[iata] === code) || "";
}

export function swedaviaLocalDate(now = Date.now()) {
  const parts = Object.fromEntries(localDate.formatToParts(new Date(now)).map(({ type, value }) => [type, value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function flightTimestamp(value) {
  const time = utcMeasurement(value);
  return Number.isFinite(time) ? new Date(time).toISOString() : "";
}

function flightLocalClock(timestamp) {
  return timestamp ? localClock.format(new Date(timestamp)) : "";
}

function flightCode(value) {
  return upper(value, 24).replace(/\s+/g, "");
}

function flightRemarks(values) {
  return Array.isArray(values) ? [...new Set(values.map(fields).map(row => plainText(row.text, 160)).filter(Boolean))].join(" · ") : "";
}

function normalizeBoardFlight(raw, airport, headers, arrivals) {
  const flight = fields(raw), id = fields(flight.flightlegidentifier), airline = fields(flight.airlineoperator);
  const location = fields(flight.locationandstatus);
  const statusCode = upper(location.flightlegstatus, 10);
  const number = flightCode(flight.flightid || id.flightid);
  if (!/^[A-Z0-9]{2,3}\d{1,5}[A-Z]?$/.test(number)) return null;
  const time = fields(arrivals ? flight.arrivaltime : flight.departuretime);
  const scheduled = flightTimestamp(time.scheduledutc), estimated = flightTimestamp(time.estimatedutc), actual = flightTimestamp(time.actualutc);
  const checkIn = fields(flight.checkin), baggage = fields(flight.baggage);
  const firstDesk = Number.isInteger(checkIn.checkindeskfrom) && checkIn.checkindeskfrom > 0 ? String(checkIn.checkindeskfrom) : "";
  const lastDesk = Number.isInteger(checkIn.checkindeskto) && checkIn.checkindeskto > 0 ? String(checkIn.checkindeskto) : "";
  const here = arrivals ? "arrival" : "departure", other = arrivals ? "departure" : "arrival";
  const iata = upper(id[other + "airportiata"], 3);
  const codeShares = Array.isArray(flight.codesharedata) ? flight.codesharedata.map(flightCode) : [];
  let status = FLIGHT_STATES[statusCode] || "unknown";
  if (actual && !["cancelled", "diverted"].includes(status)) status = arrivals ? "landed" : "departed";
  return {
    id: [number, airport, iata, scheduled || estimated || actual].join("|"),
    flightIata: number,
    airlineIata: upper(airline.iata, 3),
    airlineIcao: upper(airline.icao, 4),
    airlineName: plainText(airline.name, 160),
    codeshareFlightIatas: [...new Set(codeShares.filter(code => code !== number && /^[A-Z0-9]{2,3}\d{1,5}[A-Z]?$/.test(code)))],
    status,
    fidsRemarks: { en: flightRemarks(flight.remarksenglish), sv: flightRemarks(flight.remarksswedish) },
    statusLabels: {
      en: plainText(location.flightlegstatusenglish, 160),
      sv: plainText(location.flightlegstatusswedish, 160)
    },
    checkInDesks: arrivals ? "" : [...new Set([firstDesk, lastDesk].filter(Boolean))].join("–"),
    [here]: {
      iata: airport,
      icao: upper(id[here + "airporticao"] || headers[here + "airporticao"] || AIRPORTS[airport], 4),
      airport: plainText(headers[here + "airportenglish"], 180),
      airportSv: plainText(headers[here + "airportswedish"], 180),
      terminal: plainText(location.terminal, 40),
      gate: plainText(location.gate, 40),
      baggage: arrivals ? plainText(baggage.baggageclaimunit, 40) : "",
      scheduled, estimated, actual,
      scheduledLocal: flightLocalClock(scheduled), estimatedLocal: flightLocalClock(estimated), actualLocal: flightLocalClock(actual),
      timezone: SWEDAVIA_ZONE
    },
    [other]: {
      iata, icao: upper(id[other + "airporticao"], 4),
      airport: plainText(flight[other + "airportenglish"], 180),
      airportSv: plainText(flight[other + "airportswedish"], 180)
    }
  };
}

function normalizeBoard(payload, headers, airport, arrivals) {
  const response = fields(payload);
  const station = fields(arrivals ? response.to : response.from);
  const stationIata = upper(station[arrivals ? "arrivalairportiata" : "departureairportiata"]);
  if (stationIata && stationIata !== airport) throw new Error("Unexpected Swedavia board airport");
  const rows = response.numberofflights === 0 && !response.flights ? [] : list(payload, "flights");
  const published = rows.filter(row => upper(fields(fields(row).locationandstatus).flightlegstatus, 10) !== "DEL");
  const items = published.map(row => normalizeBoardFlight(row, airport, station, arrivals)).filter(Boolean);
  if (published.length && !items.length) throw new Error("Unexpected Swedavia flight records");
  const lastModified = Date.parse(headers?.get?.("Last-Modified") || "");
  return { items, updatedAt: Number.isFinite(lastModified) ? new Date(lastModified).toISOString() : "" };
}

export async function getSwedaviaFlightBoardCore({ iata, boardType, date } = {}) {
  const airport = swedaviaAirportIata(iata);
  const localDay = swedaviaLocalDate();
  // The public boards show today. The provider partitions its rows by UTC day.
  if (!airport || date !== localDay || !["arrivals", "departures"].includes(boardType)) return unavailable();
  const previousDay = new Date(Date.parse(`${localDay}T00:00:00Z`) - DAY_MS).toISOString().slice(0, 10);
  const arrivals = boardType === "arrivals";
  const side = arrivals ? "arrival" : "departure";
  const normalize = (payload, headers) => normalizeBoard(payload, headers, airport, arrivals);
  const overnight = Number(localClock.format(new Date()).slice(0, 2)) < 6;
  const [main, previous] = await Promise.all([
    readSection(FLIGHT_INFO, `${airport}/${boardType}/${localDay}`, TTL.flights, normalize),
    readSection(FLIGHT_INFO, `${airport}/${boardType}/${previousDay}`, overnight ? TTL.flights : TTL.routes, normalize)
  ]);
  if (main.status !== "ready" || (overnight && previous.status !== "ready")) return unavailable();
  const fromToday = (item, keepUntimed) => {
    const time = item[side].scheduled || item[side].estimated || item[side].actual;
    return time ? swedaviaLocalDate(Date.parse(time)) === localDay : keepUntimed;
  };
  const items = new Map([
    ...(previous.items || []).filter(item => fromToday(item, false)),
    ...main.items.filter(item => fromToday(item, true))
  ].map(item => [item.id, item]));
  return { status: "ready", items: [...items.values()], updatedAt: main.updatedAt, partial: previous.status !== "ready" };
}

export async function getSwedaviaAirportInfoCore(input = {}, loadGeography) {
  const { iata: rawIata, scope: rawScope, language: rawLanguage } = record(input);
  const iata = upper(rawIata);
  const scope = lower(rawScope);
  const preferredLanguage = lower(rawLanguage);
  const language = LANGUAGES.has(preferredLanguage) ? preferredLanguage : "en";
  const context = { iata, scope, language };
  if (!Object.hasOwn(AIRPORTS, iata)) return { ...context, status: "unsupported" };
  switch (scope) {
    case "security": {
      if (!SECURITY_AIRPORTS.has(iata)) return { ...context, status: "unsupported" };
      const result = await readSection(WAIT_TIME, `airports/${iata}`, TTL.security, checkpoints);
      const now = Date.now();
      const items = (result.items || []).map(item => item.validUntil > now ? item : { ...item, minutes: null });
      return { ...context, ...result, items };
    }
    case "services":
      return { ...context, ...await airportFacilities(iata, language) };
    case "parking":
      return { ...context, ...await readSection(AIRPORT_INFO, `${iata}/parkinglots/`, TTL.parking, value => parkingLots(value, iata)) };
    case "routes": {
      const result = await readSection(AIRPORT_INFO, `${iata}/destinations?startMonth=0&endMonth=2&minimumDepartures=1`, TTL.routes, destinations);
      if (!result.items?.length) return { ...context, ...result };
      const key = `route-geography:${iata}`;
      const cached = cache.get(key);
      if (cached?.source === result.items) return { ...context, ...result, items: cached.items };
      const items = await routeAirportNames(result.items, loadGeography);
      // Retry missing reference data sooner while keeping every route visible.
      cache.set(key, { source: result.items, items }, items.some(item => !item.countryCode && !item.country) ? TTL.security : TTL.routes);
      return { ...context, ...result, items };
    }
    default:
      return { ...context, status: "unsupported" };
  }
}
