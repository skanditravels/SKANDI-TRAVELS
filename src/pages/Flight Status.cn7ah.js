import { searchFlightStatus } from "src/backend/FINAL/flightStatusService.web";

const EMBED_ID = "#flightStatusEmbed";
const HTML_SOURCE = "SKANDI_FLIGHT_STATUS";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";

function send(type, payload = {}) {
  $w(EMBED_ID).postMessage({
    source: PARENT_SOURCE,
    type,
    payload,
    timestamp: new Date().toISOString()
  });
}

$w.onReady(function () {
  const embed = $w(EMBED_ID);

  embed.onMessage(async (event) => {
    const message = event.data || {};
    if (message.source !== HTML_SOURCE) return;

    try {
      if (message.type === "FLIGHT_STATUS_READY") {
        send("FLIGHT_STATUS_RESULTS", {
          items: [],
          meta: { message: "Search by flight number, route, or airport board." }
        });
        return;
      }

      if (message.type === "FLIGHT_STATUS_SEARCH") {
        const result = await searchFlightStatus(message.payload || {});
        if (result.ok === false) {
          send("FLIGHT_STATUS_ERROR", { message: result.error || "Flight status lookup failed." });
          return;
        }

        send("FLIGHT_STATUS_RESULTS", result);
      }
    } catch (error) {
      send("FLIGHT_STATUS_ERROR", {
        message: error.message || "Flight status lookup failed."
      });
    }
  });
});
