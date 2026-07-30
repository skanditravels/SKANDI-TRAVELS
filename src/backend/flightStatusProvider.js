import { fetch } from "wix-fetch";
import { elevate } from "wix-auth";
import { secrets } from "wix-secrets-backend.v2";

const API_URL = "https://api.aviationstack.com/v1/flights";
const API_KEY_SECRET = "AVIATIONSTACK_API_KEY";
const MAX_RESULTS = 100;
const elevatedGetSecretValue = elevate(secrets.getSecretValue);

export async function requestLiveFlights(criteria) {
  const apiKey = await requiredSecret(API_KEY_SECRET);
  const query = {
    access_key: apiKey,
    flight_date: criteria.date,
    limit: MAX_RESULTS
  };

  if (criteria.mode === "flight") query.flight_iata = criteria.flightNumber;
  if (criteria.mode === "route") {
    if (criteria.from) query.dep_iata = criteria.from;
    if (criteria.to) query.arr_iata = criteria.to;
  }
  if (criteria.mode === "airport") {
    query[
      criteria.boardType === "arrivals" ? "arr_iata" : "dep_iata"
    ] = criteria.airport;
  }

  let response;
  try {
    response = await fetch(buildUrl(API_URL, query), {
      method: "GET",
      headers: {
        Accept: "application/json"
      }
    });
  } catch {
    throw providerException(
      "Aviationstack network request failed.",
      "FLIGHT_STATUS_NETWORK_ERROR",
      503,
      "Live flight data is temporarily unavailable. Please try again."
    );
  }

  const payload = await parseProviderResponse(response);
  if (!response.ok || payload?.error) {
    throw providerError(response.status, payload);
  }

  if (!Array.isArray(payload?.data)) {
    throw providerException(
      "Aviationstack returned an invalid payload.",
      "INVALID_PROVIDER_RESPONSE",
      502,
      "The live flight-data provider returned an unreadable response."
    );
  }

  return payload;
}

async function requiredSecret(name) {
  let response;
  try {
    response = await elevatedGetSecretValue(name);
  } catch {
    throw configurationError();
  }

  const value =
    typeof response === "string"
      ? response
      : response?.value ||
        response?.secretValue ||
        response?.secret?.value ||
        "";

  if (!String(value).trim()) throw configurationError();
  return String(value).trim();
}

async function parseProviderResponse(response) {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    throw providerException(
      "Aviationstack returned invalid JSON.",
      "INVALID_PROVIDER_RESPONSE",
      502,
      "The live flight-data provider returned an unreadable response."
    );
  }
}

function providerError(status, payload) {
  const providerCode = cleanCode(payload?.error?.code);
  let publicMessage =
    "The live flight-data provider rejected the search request.";

  if (status === 401 || status === 403) {
    publicMessage = "The flight-status service is not configured correctly.";
  } else if (status === 429) {
    publicMessage =
      "Flight status searches are temporarily busy. Please try again shortly.";
  } else if (status >= 500) {
    publicMessage =
      "Live flight data is temporarily unavailable. Please try again.";
  }

  return providerException(
    payload?.error?.message || `Aviationstack request failed (${status}).`,
    providerCode || `AVIATIONSTACK_HTTP_${status || 500}`,
    status || 502,
    publicMessage
  );
}

function configurationError() {
  return providerException(
    `Missing or unreadable Wix secret ${API_KEY_SECRET}.`,
    "FLIGHT_STATUS_CONFIGURATION_ERROR",
    500,
    "The flight-status service has not been configured yet."
  );
}

function providerException(message, code, status, publicMessage) {
  const error = new Error(message);
  error.code = code;
  error.status = status;
  error.publicMessage = publicMessage;
  return error;
}

function buildUrl(baseUrl, query) {
  const search = Object.entries(query)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`
    )
    .join("&");

  return `${baseUrl}?${search}`;
}

function cleanCode(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_]/g, "_")
    .slice(0, 80);
