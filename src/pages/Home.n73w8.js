// Home page code — SKANDI Home V9 FINAL
// Bind listener first; child HOME_READY drives bootstrap.

import wixLocationFrontend from "wix-location-frontend";
import { authentication } from "wix-members-frontend";
import {
  searchUnifiedOffers,
  createBookingCartFromOffer
} from "backend/bookingOrchestrator.web";
import { getHomeContent, getHomeSearchLocations } from "backend/homeContent.web";
import { searchDuffelStays } from "backend/RIA/duffelGroundProducts.web";

const HOME_EMBED_IDS = ["#htmlHome", "#htmlhome", "#home"];
const HOME_SOURCE = "SKANDI_HOME";
const HOME_SOURCES = new Set(["SKANDI_HOME", "SKANDI_HOME_LONG_DISCOVERY_V2", "SKANDI_HOME_OLD_STYLE"]);
const PARENT_SOURCE = "SKANDI_WIX_PARENT";
const PROTOCOL_VERSION = "2026.09.09.9";
const SUPPORTED_LANGUAGES = ["EN","SV","NO","DA","ES","FI","FR-FR","FR-CA","DE","TH"];
const SUPPORTED_CURRENCIES = ["USD","SEK","NOK","DKK","EUR"];

let bootstrapPromise = null;
let locationPromise = null;
let homePriceSearch = null;
let currentSettings = { language:"EN", currency:"USD" };

function clean(v, max = 1000) { return String(v ?? "").trim().slice(0, max); }
function arr(v) { return Array.isArray(v) ? v : []; }
function obj(v) { return v && typeof v === "object" && !Array.isArray(v) ? v : {}; }
function normalizeName(v) {
  return clean(v, 300).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
}
function addDays(days) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + Number(days || 0));
  return d.toISOString().slice(0,10);
}
function normalizeSettings(value = {}) {
  const language = clean(value.language, 12).toUpperCase();
  const currency = clean(value.currency, 3).toUpperCase();
  return {
    language: SUPPORTED_LANGUAGES.includes(language) ? language : "EN",
    currency: SUPPORTED_CURRENCIES.includes(currency) ? currency : "USD"
  };
}
function normalizePriceSearch(value = {}) {
  const checkInDate = /^\d{4}-\d{2}-\d{2}$/.test(clean(value.checkInDate || value.departureDate, 10))
    ? clean(value.checkInDate || value.departureDate, 10)
    : addDays(60);
  const requestedOut = /^\d{4}-\d{2}-\d{2}$/.test(clean(value.checkOutDate || value.returnDate, 10))
    ? clean(value.checkOutDate || value.returnDate, 10)
    : addDays(67);
  return {
    checkInDate,
    checkOutDate: requestedOut > checkInDate ? requestedOut : addDays(67),
    adults: Math.max(1, Math.min(9, Number(value.adults || 2))),
    children: Math.max(0, Math.min(8, Number(value.children || 0))),
    childAges: arr(value.childAges).slice(0,8),
    rooms: Math.max(1, Math.min(4, Number(value.rooms || 1)))
  };
}

function firstHomeEmbed() {
  for (const id of HOME_EMBED_IDS) {
    try {
      const candidate = $w(id);
      if (candidate && typeof candidate.onMessage === "function" && typeof candidate.postMessage === "function") {
        console.log(`[Home] Bound HTML Component ${id}.`);
        return candidate;
      }
    } catch (_) {}
  }
  console.error(`[Home] No HTML Component found. Checked: ${HOME_EMBED_IDS.join(", ")}`);
  return null;
}

function parseMessage(data) {
  if (typeof data === "string") {
    try { return JSON.parse(data); } catch (_) { return null; }
  }
  return data && typeof data === "object" ? data : null;
}
function postToHtml(html, type, payload = {}) {
  if (!html || typeof html.postMessage !== "function") return;
  html.postMessage({ source:PARENT_SOURCE, type, payload, timestamp:new Date().toISOString() });
}
function postHomeError(html, error) {
  postToHtml(html, "HOME_ERROR", { message:error?.publicMessage || error?.message || "The request could not be completed." });
}
function navigateTo(rawPath) {
  const path = clean(rawPath, 1600);
  if (!path) return;
  const safe = path.startsWith("/") && !path.startsWith("//");
  const external = /^https?:\/\//i.test(path) || /^mailto:/i.test(path) || /^tel:/i.test(path);
  if (!safe && !external) return;
  wixLocationFrontend.to(path);
}

async function mapWithConcurrency(items, limit, fn) {
  const rows = arr(items);
  const output = new Array(rows.length);
  let cursor = 0;
  async function worker() {
    while (cursor < rows.length) {
      const index = cursor++;
      try { output[index] = await fn(rows[index], index); }
      catch (error) { output[index] = rows[index]; console.warn("[Home] Live card price unavailable.", error?.message || error); }
    }
  }
  await Promise.all(Array.from({ length:Math.min(limit, Math.max(1, rows.length)) }, worker));
  return output;
}
function lowestStay(items = []) {
  return arr(items)
    .filter(item => Number(item?.total || item?.cheapestRateTotalAmount || 0) > 0)
    .sort((a,b) => Number(a.total || a.cheapestRateTotalAmount) - Number(b.total || b.cheapestRateTotalAmount))[0] || null;
}
async function priceDestination(card, priceSearch) {
  const lookup = obj(card.priceLookup);
  const result = await searchDuffelStays({
    checkInDate:priceSearch.checkInDate,
    checkOutDate:priceSearch.checkOutDate,
    adults:priceSearch.adults,
    children:priceSearch.children,
    childAges:priceSearch.childAges,
    rooms:priceSearch.rooms,
    radiusKm:25,
    latitude:lookup.latitude,
    longitude:lookup.longitude,
    iata:lookup.iata,
    destination:lookup.destination,
    label:lookup.label,
    fetchRates:false
  });
  const cheapest = lowestStay(result?.items);
  if (!cheapest) return { ...card, fromPrice:null, currency:"", livePriceFound:false };
  return {
    ...card,
    fromPrice:Number(cheapest.total || cheapest.cheapestRateTotalAmount),
    currency:clean(cheapest.currency || cheapest.cheapestRateTotalCurrency, 3).toUpperCase(),
    livePriceFound:true,
    livePriceType:"DUFFEL_DESTINATION_STAY",
    liveAccommodationName:cheapest.title || "",
    pricePeriod:{ checkInDate:priceSearch.checkInDate, checkOutDate:priceSearch.checkOutDate }
  };
}
async function priceHotel(card, priceSearch) {
  const lookup = obj(card.priceLookup);
  let result;
  if (card.duffelAccommodationId) {
    result = await searchDuffelStays({
      accommodationId:card.duffelAccommodationId,
      checkInDate:priceSearch.checkInDate,
      checkOutDate:priceSearch.checkOutDate,
      adults:priceSearch.adults,
      children:priceSearch.children,
      childAges:priceSearch.childAges,
      rooms:priceSearch.rooms,
      fetchRates:true
    });
  } else {
    result = await searchDuffelStays({
      checkInDate:priceSearch.checkInDate,
      checkOutDate:priceSearch.checkOutDate,
      adults:priceSearch.adults,
      children:priceSearch.children,
      childAges:priceSearch.childAges,
      rooms:priceSearch.rooms,
      radiusKm:4,
      latitude:lookup.latitude,
      longitude:lookup.longitude,
      iata:lookup.iata,
      destination:lookup.destination,
      label:lookup.label,
      fetchRates:false
    });
  }
  const exactName = normalizeName(card.name || card.title);
  const candidates = arr(result?.items);
  const match = card.duffelAccommodationId
    ? candidates.find(x => clean(x.accommodationId, 180) === clean(card.duffelAccommodationId, 180)) || lowestStay(candidates)
    : candidates.find(x => normalizeName(x.title || x.name) === exactName);
  if (!match || Number(match.total || match.cheapestRateTotalAmount || 0) <= 0) {
    return { ...card, fromPrice:null, currency:"", livePriceFound:false };
  }
  return {
    ...card,
    fromPrice:Number(match.total || match.cheapestRateTotalAmount),
    currency:clean(match.currency || match.cheapestRateTotalCurrency, 3).toUpperCase(),
    livePriceFound:true,
    livePriceType:"DUFFEL_EXACT_HOTEL",
    resolvedDuffelAccommodationId:match.accommodationId || card.duffelAccommodationId || "",
    pricePeriod:{ checkInDate:priceSearch.checkInDate, checkOutDate:priceSearch.checkOutDate }
  };
}
async function hydrateLiveHomePrices(content = {}, priceSearch) {
  const search = normalizePriceSearch(priceSearch || homePriceSearch || {});
  const [destinations, hotels] = await Promise.all([
    mapWithConcurrency(arr(content.destinations).slice(0,12), 3, card => priceDestination(card, search)),
    mapWithConcurrency(arr(content.hotels).slice(0,10), 3, card => priceHotel(card, search))
  ]);
  return { ...content, destinations, hotels, priceSearch:search, livePriceSupplier:"DUFFEL_STAYS" };
}



async function sendHomeLocations(html, force = false) {
  if (locationPromise && !force) return locationPromise;
  locationPromise = (async () => {
    try {
      const locations = await getHomeSearchLocations();
      const payload = locations || { airports:[], destinations:[], searchDestinations:[] };
      postToHtml(html, "HOME_LOCATION_DATA", payload);
      return payload;
    } catch (error) {
      console.error("[Home] Location catalogue failed.", error);
      const payload = {
        airports:[], destinations:[], searchDestinations:[],
        sync:{ ok:false, fetchedAt:new Date().toISOString(), counts:{airports:0,destinations:0}, errors:[{source:"LOCATION_CATALOG",message:clean(error?.message || error,300)}] }
      };
      postToHtml(html, "HOME_LOCATION_DATA", payload);
      return payload;
    } finally {
      locationPromise = null;
    }
  })();
  return locationPromise;
}

async function sendHomeBootstrap(html, forceRefresh = false) {
  if (bootstrapPromise && !forceRefresh) return bootstrapPromise;
  bootstrapPromise = (async () => {
    try {
      // 1) Canonical Supabase content is sent immediately. Autocomplete does not wait for Duffel.
      let content = await getHomeContent();
      content = content || { airports:[], searchDestinations:[], destinations:[], hotels:[], offers:[], inspiration:[] };

      postToHtml(html, "HOME_LOCATION_DATA", {
        airports: arr(content.airports),
        destinations: arr(content.searchDestinations),
        searchDestinations: arr(content.searchDestinations),
        source: content.source || "SUPABASE_HOME_DIRECT_REST",
        sync: content.sync || null
      });

      postToHtml(html, "HOME_BOOTSTRAP_RESULT", {
        content,
        settings: currentSettings,
        sync: content.sync || null
      });

      // If the full content call suffered a partial location failure, retry through the small location-only method.
      if (!arr(content.searchDestinations).length || !arr(content.airports).length) {
        await sendHomeLocations(html, true);
      }

      // 2) Price cards afterward. A Duffel problem never blocks database content/search.
      try {
        const priced = await hydrateLiveHomePrices(content, homePriceSearch);
        postToHtml(html, "HOME_BOOTSTRAP_RESULT", {
          content: priced,
          settings: currentSettings,
          sync: priced.sync || content.sync || null
        });
      } catch (priceError) {
        console.warn("[Home] Duffel Home price hydration unavailable; content remains live.", priceError?.message || priceError);
      }
    } catch (error) {
      console.error("[Home] Bootstrap failed.", error);
      await sendHomeLocations(html, true);
      postHomeError(html, error);
    } finally {
      bootstrapPromise = null;
    }
  })();
  return bootstrapPromise;
}

async function handleHomeMessage(html, message) {
  const payload = obj(message.payload);
  switch (message.type) {
    case "HOME_READY":
      currentSettings = normalizeSettings(message.settings || payload.settings || currentSettings);
      homePriceSearch = normalizePriceSearch(message.priceSearch || payload.priceSearch || homePriceSearch || {});
      await sendHomeBootstrap(html, false);
      return;

    case "HOME_LOCATIONS_REQUEST":
      await sendHomeLocations(html, true);
      return;

    case "HOME_REFRESH":
      if (message.priceSearch || payload.priceSearch) homePriceSearch = normalizePriceSearch(message.priceSearch || payload.priceSearch);
      await sendHomeBootstrap(html, true);
      return;

    case "HOME_SEARCH": {
      const rawSearch = obj(message.search || payload.search);
      const search = {
        ...rawSearch,
        locale: rawSearch.locale || currentSettings.language,
        language: rawSearch.language || currentSettings.language,
        currency: rawSearch.currency || currentSettings.currency
      };
      const result = await searchUnifiedOffers({ search });
      postToHtml(html, "HOME_SEARCH_RESULT", { ...(result || {}), items:arr(result?.items) });
      return;
    }

    case "HOME_SELECT_OFFER": {
      const offer = obj(message.offer || payload.offer);
      const search = obj(message.search || payload.search || offer.searchContext);
      let result = await createBookingCartFromOffer({ offer, search });
      if (result?.requiresLogin) {
        try { await authentication.promptLogin(); }
        catch (_) { postHomeError(html, { message:"Sign in was cancelled. The offer was not saved." }); return; }
        result = await createBookingCartFromOffer({ offer, search });
      }
      if (result?.requiresLogin) throw new Error(result?.message || "Sign in to continue with this offer.");
      if (!result?.cartId) throw new Error("The booking cart was not created because no cart ID was returned.");
      postToHtml(html, "HOME_NAVIGATE_TO_OFFER", result);
      const allowed = ["offer","extras","transfer","apis","seats","payment","confirmation"];
      const step = allowed.includes(result?.step) ? result.step : "offer";
      const token = clean(result?.cartToken || result?.token, 300);
      navigateTo(`/booking?step=${encodeURIComponent(step)}&cartId=${encodeURIComponent(result.cartId)}${token ? `&cartToken=${encodeURIComponent(token)}` : ""}`);
      return;
    }

    case "HOME_NAVIGATE":
      navigateTo(message.path || payload.path);
      return;

    default:
      return;
  }
}

$w.onReady(function () {
  const html = firstHomeEmbed();
  if (!html) return;

  // Listener FIRST. If the child's early HOME_READY was missed, HOME_HOST_READY makes it resend.
  html.onMessage(async event => {
    const message = parseMessage(event?.data);
    if (!message?.type || !HOME_SOURCES.has(String(message.source || ""))) return;
    try {
      await handleHomeMessage(html, message);
    } catch (error) {
      console.error(`[Home] ${message.type} failed.`, error);
      postHomeError(html, error);
    }
  });

  postToHtml(html, "HOME_HOST_READY", {
    protocolVersion: PROTOCOL_VERSION,
    embedId: clean(html.id, 80),
    readyAt: new Date().toISOString()
  });
});
