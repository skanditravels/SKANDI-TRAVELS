// Swedavia AirportInfo v2 and WaitTime v2. Read-only provider data for Travel Info.
import { fetch } from "wix-fetch";
import { elevate } from "wix-auth";
import { secrets } from "wix-secrets-backend.v2";
import { TtlCache } from "backend/SKANDI_CORE/platformCache";
import { lower, record, text, upper } from "backend/SKANDI_CORE/platformValidation";

const BASE = "https://api.swedavia.se";
const AIRPORT_INFO = "airportinfo/v2";
const WAIT_TIME = "waittimepublic/v2";
const SECRET_NAMES = {
  [AIRPORT_INFO]: "SWEDAVIA_AIRPORT_INFO_SUBSCRIPTION_KEY",
  [WAIT_TIME]: "SWEDAVIA_WAIT_TIME_SUBSCRIPTION_KEY"
};
const AIRPORTS = new Set(["ARN", "BMA", "GOT", "MMX", "LLA", "UME", "OSD", "VBY", "RNB", "KRN"]);
const SECURITY_AIRPORTS = new Set(["ARN", "BMA", "GOT"]);
const LANGUAGES = new Set(["en", "sv", "no", "da", "fi"]);
const FACILITIES = ["restaurants", "shops", "services"];
const TTL = {
  languages: 6 * 60 * 60 * 1000,
  facilities: 30 * 60 * 1000,
  parking: 10 * 60 * 1000,
  routes: 60 * 60 * 1000,
  security: 60 * 1000,
  unavailable: 30 * 1000
};
const MAX_WAIT_AGE_MS = 5 * 60 * 1000;
const getSecretValue = elevate(secrets.getSecretValue);
const cache = new TtlCache({ maxEntries: 250 });
const inFlight = new Map();
const productCooldown = new Map();
const unavailable = () => ({ status: "unavailable" });

function fields(value) {
  return Object.fromEntries(Object.entries(record(value)).map(([key, entry]) => [key.toLowerCase(), entry]));
}

function list(value, field) {
  const rows = field && !Array.isArray(value) ? fields(value)[field] : value;
  if (!Array.isArray(rows)) throw new Error("Unexpected Swedavia response shape");
  return rows;
}

function deadline(promise) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error("Swedavia request timed out")), 4000);
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
  if (!key) return unavailable();
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
    console.warn("[Travel Info] Swedavia API request failed", { product, status: response.status });
    return unavailable();
  }
  const snapshot = normalize(response.status === 204 ? [] : await response.json());
  return { ...snapshot, status: "ready" };
}

function readSection(product, path, ttl, normalize) {
  const key = `${product}/${path}`;
  const cached = cache.get(key);
  if (cached) return Promise.resolve(cached);
  if (inFlight.has(key)) return inFlight.get(key);
  const pending = readProduct(product, path, normalize)
    .catch(() => unavailable())
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
        return {
          name: plainText(row.name, 160),
          description: plainText(row.description),
          openingHours: plainText(row.openinghours, 800),
          terminal: plainText(location.terminalname || location.terminalid, 100),
          place: plainText(location.place, 200),
          beforeSecurity: typeof location.beforesecurity === "boolean" ? location.beforesecurity : null
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
  return { status: results.some(result => result.status === "ready") ? "ready" : "unavailable", providerLanguage, groups };
}

function bookingLink(value) {
  try {
    const link = new URL(text(value, 2048));
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
  const items = list(value, "citydestinations").map(fields).flatMap(row => {
    const iata = upper(row.iata);
    if (!/^[A-Z]{3}$/.test(iata)) return [];
    const operators = Array.isArray(row.operators) ? row.operators.map(fields) : [];
    return [{ iata, airlines: [...new Set(operators.map(item => plainText(item.name, 160)).filter(Boolean))] }];
  });
  return { items };
}

export async function getSwedaviaAirportInfoCore(input = {}) {
  const { iata: rawIata, scope: rawScope, language: rawLanguage } = record(input);
  const iata = upper(rawIata);
  const scope = lower(rawScope);
  const preferredLanguage = lower(rawLanguage);
  const language = LANGUAGES.has(preferredLanguage) ? preferredLanguage : "en";
  const context = { iata, scope, language };
  if (!AIRPORTS.has(iata)) return { ...context, status: "unsupported" };
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
    case "routes":
      return { ...context, ...await readSection(AIRPORT_INFO, `${iata}/destinations?startMonth=0&endMonth=2&minimumDepartures=1`, TTL.routes, destinations) };
    default:
      return { ...context, status: "unsupported" };
  }
}
