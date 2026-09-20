// /src/pages/Flight Status.cn7ah.js
// SKANDI Flight Status B-011.39 — AirLabs provider convergence + complete HTML bridge.
// Page URL: /travel-info/flight-status
// HTML Embed ID: #flightStatusEmbed
/* global $w */

import wixLocationFrontend from "wix-location-frontend";
import { SITE_MAP } from "public/siteMap.js";
import {
  searchFlightStatus,
  getFlightStatusAirportDirectory,
  getFlightStatusAirportContext
} from "backend/SKANDI_CORE/flightStatus.web";

const EMBED_ID = "#flightStatusEmbed";
const HTML_SOURCE = "SKANDI_FLIGHT_STATUS";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";
const VERSION = "B-011.39-AIRLABS";

let latestSearch = 0;
let latestDirectory = 0;
let latestContext = 0;

function object(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function clean(value, max = 500) {
  return String(value ?? "").replace(/[\r\n\t]+/g, " ").trim().slice(0, max);
}

function cleanError(error, fallback = "Flight status request failed.") {
  return clean(
    error?.publicMessage ||
    error?.message ||
    error?.error ||
    fallback,
    500
  ) || fallback;
}

function send(embed, type, payload = {}) {
  embed.postMessage({
    source: PARENT_SOURCE,
    type,
    payload: object(payload),
    timestamp: new Date().toISOString()
  });
}

function routeWithQuery(base, params = {}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    const next = clean(value, 240);
    if (next) query.set(key, next);
  }
  const suffix = query.toString();
  return suffix ? `${base}?${suffix}` : base;
}

function handleAirportAction(payload = {}) {
  const kind = clean(payload.kind, 40).toUpperCase();
  const item = object(payload.item);
  const entityType = clean(item.entityType, 40).toUpperCase();
  const slug = clean(item.slug, 240);
  const destinationSlug = clean(item.destinationSlug, 240);

  if (kind === "TRANSFER") {
    wixLocationFrontend.to(routeWithQuery(SITE_MAP.transfers, { airport: payload.airportIata }));
    return;
  }

  if (kind === "HOTEL") {
    wixLocationFrontend.to(routeWithQuery(SITE_MAP.hotels, {
      hotel: slug,
      destination: destinationSlug,
      airport: payload.airportIata
    }));
    return;
  }

  if (kind === "EXPERIENCE") {
    const route = entityType === "ACTIVITY" ? SITE_MAP.activities : SITE_MAP.tours;
    wixLocationFrontend.to(routeWithQuery(route, {
      item: slug,
      destination: destinationSlug,
      airport: payload.airportIata
    }));
    return;
  }

  if (kind === "DESTINATION") {
    wixLocationFrontend.to(routeWithQuery(SITE_MAP.destinations, {
      destination: destinationSlug || slug,
      airport: payload.airportIata
    }));
  }
}

$w.onReady(function () {
  const embed = $w(EMBED_ID);

  embed.onMessage(async event => {
    const message = object(event?.data);
    if (!message || message.source !== HTML_SOURCE) return;

    if (message.type === "FLIGHT_STATUS_READY") {
      send(embed, "FLIGHT_STATUS_HOST_READY", { version: VERSION });
      return;
    }

    if (message.type === "FLIGHT_STATUS_AIRPORT_ACTION") {
      handleAirportAction(message.payload || {});
      return;
    }

    if (message.type === "FLIGHT_STATUS_AIRPORTS_REQUEST") {
      const requestNumber = ++latestDirectory;
      try {
        const result = await getFlightStatusAirportDirectory();
        if (requestNumber !== latestDirectory) return;
        send(embed, "FLIGHT_STATUS_AIRPORTS_RESULTS", {
          items: Array.isArray(result?.items) ? result.items : [],
          meta: object(result?.meta)
        });
      } catch (error) {
        if (requestNumber !== latestDirectory) return;
        send(embed, "FLIGHT_STATUS_AIRPORTS_ERROR", {
          message: cleanError(error, "Airport search is temporarily unavailable.")
        });
      }
      return;
    }

    if (message.type === "FLIGHT_STATUS_AIRPORT_CONTEXT_REQUEST") {
      const requestNumber = ++latestContext;
      const payload = object(message.payload);
      try {
        const result = await getFlightStatusAirportContext(payload);
        if (requestNumber !== latestContext) return;
        send(embed, "FLIGHT_STATUS_AIRPORT_CONTEXT_RESULTS", {
          ...object(result),
          requestSerial: Number(result?.requestSerial || payload.requestSerial || 0),
          contextKey: clean(result?.contextKey || payload.contextKey, 300)
        });
      } catch (error) {
        if (requestNumber !== latestContext) return;
        send(embed, "FLIGHT_STATUS_AIRPORT_CONTEXT_ERROR", {
          message: cleanError(error, "This airport guide is temporarily unavailable."),
          requestSerial: Number(payload.requestSerial || 0),
          contextKey: clean(payload.contextKey, 300)
        });
      }
      return;
    }

    if (message.type !== "FLIGHT_STATUS_SEARCH") return;

    const searchNumber = ++latestSearch;

    try {
      const result = await searchFlightStatus(message.payload || {});
      if (searchNumber !== latestSearch) return;

      if (!result || result.ok === false) {
        send(embed, "FLIGHT_STATUS_ERROR", {
          message: cleanError(result, "Flight status lookup failed.")
        });
        return;
      }

      send(embed, "FLIGHT_STATUS_RESULTS", {
        items: Array.isArray(result.items) ? result.items : [],
        meta: object(result.meta)
      });
    } catch (error) {
      if (searchNumber !== latestSearch) return;

      send(embed, "FLIGHT_STATUS_ERROR", {
        message: cleanError(error, "Flight status lookup failed.")
      });
    }
  });

  send(embed, "FLIGHT_STATUS_HOST_READY", { version: VERSION });
});
