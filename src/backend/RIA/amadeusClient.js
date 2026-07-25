// Install as: backend/RIA/amadeusClient.js
// This is an internal backend module. Do not import it from page code or HTML.

import { secrets } from 'wix-secrets-backend.v2';
import { elevate } from 'wix-auth';
import { fetch } from 'wix-fetch';

const elevatedGetSecretValue = elevate(secrets.getSecretValue);
const TOKEN_SKEW_MS = 60_000;
const MAX_TRAVELLERS = 9;
const ALLOWED_TRAVEL_CLASSES = new Set([
  'ECONOMY',
  'PREMIUM_ECONOMY',
  'BUSINESS',
  'FIRST',
]);

let configurationPromise;
let tokenCache = {
  accessToken: null,
  expiresAt: 0,
};

function requiredText(value, code) {
  const normalized = String(value || '').trim();
  if (!normalized) throw new Error(code);
  return normalized;
}

function normalizeEnvironment(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'test') return 'test';
  if (['prod', 'production', 'live'].includes(normalized)) return 'production';
  throw new Error('AMADEUS_ENV_INVALID');
}

function expectedBaseUrl(environment) {
  return environment === 'production'
    ? 'https://api.amadeus.com'
    : 'https://test.api.amadeus.com';
}

async function loadConfiguration() {
  const [apiKey, apiSecret, rawBaseUrl, rawEnvironment] = await Promise.all([
    elevatedGetSecretValue('AMADEUS_API_KEY'),
    elevatedGetSecretValue('AMADEUS_API_SECRET'),
    elevatedGetSecretValue('AMADEUS_BASE_URL'),
    elevatedGetSecretValue('AMADEUS_ENV'),
  ]);

  const environment = normalizeEnvironment(rawEnvironment);
  const baseUrl = requiredText(rawBaseUrl, 'AMADEUS_BASE_URL_MISSING').replace(/\/+$/, '');
  const expectedUrl = expectedBaseUrl(environment);

  if (baseUrl !== expectedUrl) {
    throw new Error('AMADEUS_BASE_URL_ENV_MISMATCH');
  }

  return {
    apiKey: requiredText(apiKey, 'AMADEUS_API_KEY_MISSING'),
    apiSecret: requiredText(apiSecret, 'AMADEUS_API_SECRET_MISSING'),
    baseUrl,
    environment,
  };
}

async function getConfiguration() {
  if (!configurationPromise) {
    configurationPromise = loadConfiguration().catch((error) => {
      configurationPromise = undefined;
      throw error;
    });
  }
  return configurationPromise;
}

async function parseJson(response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch (_) {
    throw new Error('AMADEUS_INVALID_JSON_RESPONSE');
  }
}

function safeUpstreamError(prefix, response, data) {
  const rawCode = String(
    data?.errors?.[0]?.code || data?.error || `HTTP_${response.status}`,
  );
  const code = rawCode.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 80);
  return new Error(`${prefix}_${response.status}_${code}`);
}

async function getAccessToken() {
  const now = Date.now();
  if (tokenCache.accessToken && tokenCache.expiresAt > now + TOKEN_SKEW_MS) {
    return tokenCache.accessToken;
  }

  const config = await getConfiguration();
  const body = [
    'grant_type=client_credentials',
    `client_id=${encodeURIComponent(config.apiKey)}`,
    `client_secret=${encodeURIComponent(config.apiSecret)}`,
  ].join('&');

  const response = await fetch(`${config.baseUrl}/v1/security/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body,
  });

  const data = await parseJson(response);
  if (!response.ok || !data?.access_token) {
    throw safeUpstreamError('AMADEUS_OAUTH', response, data);
  }

  const expiresInSeconds = Number(data.expires_in);
  const tokenLifetimeSeconds = Number.isFinite(expiresInSeconds) && expiresInSeconds > 60
    ? expiresInSeconds
    : 60;

  tokenCache = {
    accessToken: data.access_token,
    expiresAt: Date.now() + tokenLifetimeSeconds * 1000,
  };

  return tokenCache.accessToken;
}

async function amadeusRequest(path, { method = 'GET', headers = {}, body } = {}) {
  if (!path.startsWith('/')) throw new Error('AMADEUS_PATH_INVALID');

  const [{ baseUrl }, token] = await Promise.all([
    getConfiguration(),
    getAccessToken(),
  ]);

  const requestHeaders = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
    ...headers,
  };

  if (body !== undefined) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: requestHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const data = await parseJson(response);
  if (!response.ok) {
    throw safeUpstreamError('AMADEUS_REQUEST', response, data);
  }

  return data;
}

function cleanIata(value) {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, 3);
}

function cleanDate(value) {
  const text = String(value || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return '';

  const date = new Date(`${text}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== text
    ? ''
    : text;
}

function integerInRange(value, fallback, minimum, maximum) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return fallback;
  if (parsed < minimum || parsed > maximum) return fallback;
  return parsed;
}

function queryString(values) {
  return Object.entries(values)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');
}

export async function searchFlightOffers(search = {}) {
  const origin = cleanIata(search.origin || search.originLocationCode);
  const destination = cleanIata(search.destination || search.destinationLocationCode);
  const departureDate = cleanDate(search.departureDate);
  const returnDate = cleanDate(search.returnDate);
  const adults = integerInRange(search.adults, 1, 1, MAX_TRAVELLERS);
  const children = integerInRange(search.children, 0, 0, MAX_TRAVELLERS);
  const infants = integerInRange(search.infants, 0, 0, adults);
  const max = integerInRange(search.max, 20, 1, 50);
  const currencyCode = String(search.currency || search.currencyCode || 'SEK').trim().toUpperCase();
  const travelClass = String(search.travelClass || '').trim().toUpperCase();

  if (!origin || !destination || !departureDate) {
    throw new Error('AMADEUS_SEARCH_REQUIRED_FIELDS_MISSING');
  }
  if (origin === destination) throw new Error('AMADEUS_SEARCH_ROUTE_INVALID');
  if (returnDate && returnDate < departureDate) throw new Error('AMADEUS_SEARCH_DATE_RANGE_INVALID');
  if (adults + children > MAX_TRAVELLERS) throw new Error('AMADEUS_SEARCH_TRAVELLER_LIMIT');
  if (!/^[A-Z]{3}$/.test(currencyCode)) throw new Error('AMADEUS_SEARCH_CURRENCY_INVALID');
  if (travelClass && !ALLOWED_TRAVEL_CLASSES.has(travelClass)) {
    throw new Error('AMADEUS_SEARCH_TRAVEL_CLASS_INVALID');
  }

  const query = queryString({
    originLocationCode: origin,
    destinationLocationCode: destination,
    departureDate,
    returnDate: returnDate || undefined,
    adults,
    children: children || undefined,
    infants: infants || undefined,
    travelClass: travelClass || undefined,
    nonStop: search.nonStop === true ? 'true' : undefined,
    currencyCode,
    max,
  });

  return amadeusRequest(`/v2/shopping/flight-offers?${query}`);
}

export async function priceFlightOffer(offer) {
  if (!offer || typeof offer !== 'object' || Array.isArray(offer)) {
    throw new Error('AMADEUS_PRICE_OFFER_INVALID');
  }

  return amadeusRequest('/v1/shopping/flight-offers/pricing', {
    method: 'POST',
    body: {
      data: {
        type: 'flight-offers-pricing',
        flightOffers: [offer],
      },
    },
  });
}

export function clearAmadeusTokenCache() {
  tokenCache = { accessToken: null, expiresAt: 0 };
}