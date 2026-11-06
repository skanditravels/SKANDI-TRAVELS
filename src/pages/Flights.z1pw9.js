// Flights.z1pw9.js
import { getHomeContent } from "backend/SKANDI_CORE/homeContent.web";
import { startBookingSearch } from "public/bookingSearch";

const clean = (value, max = 120) => String(value ?? "").trim().slice(0, max);
const list = value => Array.isArray(value) ? value : [];
const object = value => value && typeof value === "object" && !Array.isArray(value) ? value : {};
const LANGUAGES = new Set(["EN","SV","NO","DA","ES","FI","FR-FR","FR-CA","DE","TH"]);
const CURRENCIES = new Set(["USD","SEK","NOK","DKK","EUR"]);

function bounded(promise, ms = 30000) {
  let timer;
  return Promise.race([promise, new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error("Flights content took too long to load. Please try again.")), ms);
  })]).finally(() => clearTimeout(timer));
}
function settingsFor(settings = {}) {
  const language = clean(settings.language, 12).toUpperCase(), currency = clean(settings.currency, 3).toUpperCase();
  return { language:LANGUAGES.has(language) ? language : "EN", currency:CURRENCIES.has(currency) ? currency : "USD" };
}
export function createFlightsPageHost({ post, navigate, settings }) {
  let contentJob = null;
  return async function handleFlightsMessage(message = {}) {
    const type = clean(message.type, 80), payload = object(message.payload), requestId = clean(message.requestId, 160);
    const reply = (event, data = {}) => post(event, data, requestId);
    try {
      if (type === "FLIGHTS_READY" || type === "FLIGHTS_REFRESH") {
        const preferences = settingsFor(settings());
        if (!contentJob || contentJob.language !== preferences.language) {
          const job = {language:preferences.language, promise:bounded(getHomeContent({language:preferences.language, force:type === "FLIGHTS_REFRESH"}))};
          contentJob = job;
          job.promise.finally(() => { if (contentJob === job) contentJob = null; }).catch(() => {});
        }
        const content = await contentJob.promise;
        if (!Array.isArray(content?.airports) || !Array.isArray(content?.destinations)) throw new Error("Flights content is temporarily unavailable. Please try again.");
        reply("FLIGHTS_CONTENT", { airports:content.airports, destinations:content.destinations, offers:list(content.offers), inspiration:list(content.inspiration), settings:preferences });
        return;
      }
      if (type === "FLIGHTS_SEARCH") {
        const preferences = settingsFor(settings());
        const input = object(payload.search);
        // The browser controls search criteria only; booking and supplier prices stay server-owned.
        const path = startBookingSearch({...input, tripType:"flightOnly", language:preferences.language, locale:preferences.language, currency:preferences.currency}, "FLIGHTS");
        reply("FLIGHTS_OPENING", {});
        navigate(path);
      }
    } catch (error) {
      reply("FLIGHTS_ERROR", { action:type, message:clean(error?.publicMessage || error?.message || "The request could not be completed. Please try again.", 300) });
    }
  };
}
