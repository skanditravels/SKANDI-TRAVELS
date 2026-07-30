// Page URL: /travel-info/flight-status
// HTML Embed ID: #flightStatusEmbed
/* global $w */

import { searchFlightStatus } from "backend/FINAL/flightStatusService.web";

const EMBED_ID = "#flightStatusEmbed";
const HTML_SOURCE = "SKANDI_FLIGHT_STATUS";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";

let latestSearch = 0;

function send(embed, type, payload = {}) {
  embed.postMessage({
    source: PARENT_SOURCE,
    type,
    payload,
    timestamp: new Date().toISOString()
  });
}

$w.onReady(function () {
  const embed = $w(EMBED_ID);

  embed.onMessage(async (event) => {
    const message = event?.data;
    if (!message || typeof message !== "object" || Array.isArray(message)) return;
    if (message.source !== HTML_SOURCE) return;

    if (message.type === "FLIGHT_STATUS_READY") return;
    if (message.type !== "FLIGHT_STATUS_SEARCH") return;

    const searchNumber = ++latestSearch;

    try {
      const result = await searchFlightStatus(message.payload || {});
      if (searchNumber !== latestSearch) return;

      if (!result || result.ok === false) {
        send(embed, "FLIGHT_STATUS_ERROR", {
          message: cleanError(result?.error)
        });
        return;
      }

      send(embed, "FLIGHT_STATUS_RESULTS", {
        items: Array.isArray(result.items) ? result.items : [],
        meta: result.meta && typeof result.meta === "object" ? result.meta : {}
      });
    } catch (error) {
      if (searchNumber !== latestSearch) return;

      send(embed, "FLIGHT_STATUS_ERROR", {
        message: cleanError(error?.message)
      });
    }
  });
});

function cleanError(value) {
  const message = String(value || "Flight status lookup failed.")
    .replace(/[\r\n\t]+/g, " ")
    .trim()
    .slice(0, 240);

  return message || "Flight status lookup failed.";
}
