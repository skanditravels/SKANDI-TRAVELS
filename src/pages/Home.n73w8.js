import wixLocationFrontend from "wix-location-frontend";
import { currentMember, authentication } from "wix-members-frontend";

import {
  getHomeBootstrap,
  searchUnifiedOffers,
  createBookingCartFromOffer
} from "backend/bookingOrchestrator.web";

import { getHomeContent, getHomeSearchLocations } from "backend/homeContent.web";
import { searchDuffelStays } from "src/backend/RIA/duffelGroundProducts.web";

import {
  getCustomerHeaderSession,
  subscribeCustomerNewsletter
} from "backend/customerHeader.web";

const EMBED_ID = "#htmlHome";
const HOME_SOURCE = "SKANDI_HOME";
const HOME_SOURCES = new Set(["SKANDI_HOME","SKANDI_HOME_LONG_DISCOVERY_V2","SKANDI_HOME_OLD_STYLE"]);
const HEADER_SOURCE = "SKANDI_CUSTOMER_HEADER_EXPANDBAR";
const FOOTER_SOURCE = "SKANDI_CUSTOMER_FOOTER";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";

const SUPPORTED_LANGUAGES = ["EN","SV","NO","DA","ES","FI","FR-FR","FR-CA","DE","TH"];
const SUPPORTED_CURRENCIES = ["USD","SEK","NOK","DKK","EUR"];

let bootstrapPromise = null;
let headerPromise = null;
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
  const checkOutDate = /^\d{4}-\d{2}-\d{2}$/.test(clean(value.checkOutDate || value.returnDate, 10))
    ? clean(value.checkOutDate || value.returnDate, 10)
    : addDays(67);
  return {
    checkInDate,
    checkOutDate: checkOutDate > checkInDate ? checkOutDate : addDays(67),
    adults: Math.max(1, Math.min(9, Number(value.adults || 2))),
    children: Math.max(0, Math.min(8, Number(value.children || 0))),
    childAges: arr(value.childAges).slice(0,8),
    rooms: Math.max(1, Math.min(4, Number(value.rooms || 1)))
  };
}
function getHtmlComponent() {
  try {
    const html = $w(EMBED_ID);
    if (!html || typeof html.onMessage !== "function" || typeof html.postMessage !== "function") {
      console.error(`[Home] ${EMBED_ID} is not an HTML Component.`);
      return null;
    }
    return html;
  } catch (error) {
    console.error(`[Home] ${EMBED_ID} not found.`, error);
    return null;
  }
}
function parseMessage(data) {
  if (typeof data === "string") {
    try { return JSON.parse(data); } catch (_) { return null; }
  }
  return data && typeof data === "object" ? data : null;
}
function postToHtml(html, type, payload = {}) {
  html.postMessage({ source:PARENT_SOURCE, type, payload, timestamp:new Date().toISOString() });
}
function postHomeError(html, error) {
  postToHtml(html, "HOME_ERROR", { message:error?.publicMessage || error?.message || "The request could not be completed." });
}
function closeHeaderPanels(html) { postToHtml(html, "CLOSE_CUSTOMER_HEADER_PANELS", {}); }
function navigateTo(html, rawPath) {
  const path = clean(rawPath, 1600);
  if (!path || !(path.startsWith("/") || /^https?:\/\//i.test(path) || /^mailto:/i.test(path) || /^tel:/i.test(path))) return;
  closeHeaderPanels(html);
  wixLocationFrontend.to(path);
}

function guestHeaderState() { return { loggedIn:false, displayName:"", points:0, tierName:"", menu:[] }; }
async function sendHeaderState(html, forceRefresh = false) {
  if (headerPromise && !forceRefresh) return headerPromise;
  headerPromise = (async () => {
    try {
      const member = await currentMember.getMember();
      if (!member) { postToHtml(html, "CUSTOMER_HEADER_STATE", guestHeaderState()); return; }
      const session = await getCustomerHeaderSession();
      postToHtml(html, "CUSTOMER_HEADER_STATE", {
        loggedIn:true,
        displayName:session?.displayName || session?.name || session?.member?.displayName || member?.profile?.nickname || member?.loginEmail || "",
        points:Number(session?.points || session?.clubPoints || session?.rewards?.points || 0),
        tierName:session?.tierName || session?.tier || session?.clubTier || "",
        menu:Array.isArray(session?.menu) ? session.menu : []
      });
    } catch (error) {
      console.error("[Home] Header state failed.", error);
      postToHtml(html, "CUSTOMER_HEADER_STATE", guestHeaderState());
    } finally { headerPromise = null; }
  })();
  return headerPromise;
}

async function handleHeaderMessage(html, message) {
  const payload = message.payload || {};
  const path = clean(message.path || payload.path, 1600);
  switch (message.type) {
    case "HEADER_READY": await sendHeaderState(html); return true;
    case "HEADER_NAVIGATE": navigateTo(html, path); return true;
    case "HEADER_SEARCH": closeHeaderPanels(html); postToHtml(html, "HOME_FOCUS_SEARCH", {}); return true;
    case "HEADER_LOGIN":
      closeHeaderPanels(html);
      try { await authentication.promptLogin(); } catch (_) {}
      await sendHeaderState(html, true);
      return true;
    case "HEADER_LOGOUT":
      closeHeaderPanels(html);
      try { await Promise.resolve(authentication.logout()); } catch (_) {}
      postToHtml(html, "CUSTOMER_HEADER_STATE", guestHeaderState());
      wixLocationFrontend.to("/home");
      return true;
    case "UPDATE_SETTINGS":
      currentSettings = normalizeSettings(payload);
      await sendHomeBootstrap(html, true, currentSettings);
      postToHtml(html, "HOME_SETTINGS_APPLIED", { settings:currentSettings });
      return true;
    default: return false;
  }
}

async function handleFooterMessage(html, message) {
  const payload = message.payload || {};
  const path = clean(message.path || payload.path, 1600);
  switch (message.type) {
    case "FOOTER_READY": postToHtml(html, "CUSTOMER_FOOTER_STATE", { ready:true }); return true;
    case "FOOTER_NAVIGATE": navigateTo(html, path); return true;
    case "FOOTER_STAFF_LOGIN": navigateTo(html, "/riaintra"); return true;
    case "FOOTER_NEWSLETTER_SIGNUP": {
      const email = clean(message.email || payload.email, 254);
      if (!email) { postToHtml(html, "FOOTER_NEWSLETTER_RESULT", { ok:false, code:"EMAIL_REQUIRED", message:"Please enter your email address." }); return true; }
      try {
        const result = await subscribeCustomerNewsletter({ email, source:payload.source || "Footer" });
        postToHtml(html, "FOOTER_NEWSLETTER_RESULT", {
          ok:true,
          code:result?.status === "updated" ? "ALREADY_ACTIVE" : "SUBSCRIBED",
          message:result?.status === "updated" ? "Your subscription is already active." : "Thank you for subscribing.",
          ...(result || {})
        });
      } catch (error) {
        postToHtml(html, "FOOTER_NEWSLETTER_RESULT", { ok:false, code:"SIGNUP_FAILED", message:error?.message || "Newsletter signup failed." });
      }
      return true;
    }
    default: return false;
  }
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

async function sendHomeLocations(html) {
  try {
    const locations = await getHomeSearchLocations();
    postToHtml(html, "HOME_LOCATION_DATA", locations || { airports:[], destinations:[], searchDestinations:[] });
    return locations || { airports:[], destinations:[], searchDestinations:[] };
  } catch (error) {
    console.error("[Home] Location catalogue failed.", error);
    postToHtml(html, "HOME_LOCATION_DATA", {
      airports:[], destinations:[], searchDestinations:[],
      sync:{ ok:false, fetchedAt:new Date().toISOString(), counts:{airports:0,destinations:0}, errors:[{source:"LOCATION_CATALOG",message:clean(error?.message || error,300)}] }
    });
    return { airports:[], destinations:[], searchDestinations:[] };
  }
}

async function sendHomeBootstrap(html, forceRefresh = false, settingsOverride = null) {
  if (bootstrapPromise && !forceRefresh) return bootstrapPromise;
  if (settingsOverride) currentSettings = normalizeSettings(settingsOverride);
  bootstrapPromise = (async () => {
    const request = { locale:currentSettings.language, language:currentSettings.language, currency:currentSettings.currency };
    try {
      // Content and booking are intentionally isolated. A booking/Duffel issue must not blank Supabase Home content.
      const [bookingResult, contentResult, locationResult] = await Promise.allSettled([
        getHomeBootstrap(request),
        getHomeContent(request),
        getHomeSearchLocations()
      ]);

      const booking = bookingResult.status === "fulfilled" ? (bookingResult.value || {}) : {};
      let content = contentResult.status === "fulfilled" ? (contentResult.value || {}) : {};
      const locations = locationResult.status === "fulfilled" ? (locationResult.value || {}) : { airports:[], destinations:[] };
      const bootstrapErrors = [];

      // Location autocomplete is a separate data plane. Always merge it into Home content and send it independently.
      content = {
        ...content,
        airports: Array.isArray(locations.airports) && locations.airports.length ? locations.airports : (Array.isArray(content.airports) ? content.airports : []),
        searchDestinations: Array.isArray(locations.destinations) && locations.destinations.length ? locations.destinations : (Array.isArray(content.searchDestinations) ? content.searchDestinations : [])
      };
      postToHtml(html, "HOME_LOCATION_DATA", locations);

      if (bookingResult.status === "rejected") {
        console.warn("[Home] Booking bootstrap unavailable.", bookingResult.reason);
        bootstrapErrors.push({ source:"BOOKING_BOOTSTRAP", message:clean(bookingResult.reason?.message || bookingResult.reason, 300) });
      }
      if (contentResult.status === "rejected") {
        console.error("[Home] Supabase Home content unavailable.", contentResult.reason);
        bootstrapErrors.push({ source:"SUPABASE_HOME_CONTENT", message:clean(contentResult.reason?.message || contentResult.reason, 300) });
      }
      if (locationResult.status === "rejected") {
        console.error("[Home] Supabase location catalogue unavailable.", locationResult.reason);
        bootstrapErrors.push({ source:"SUPABASE_LOCATION_CATALOG", message:clean(locationResult.reason?.message || locationResult.reason, 300) });
      }

      if (contentResult.status === "fulfilled") {
        try {
          content = await hydrateLiveHomePrices(content, homePriceSearch);
        } catch (priceError) {
          console.warn("[Home] Duffel Home price hydration failed; canonical content will still render.", priceError);
          bootstrapErrors.push({ source:"DUFFEL_HOME_PRICE", message:clean(priceError?.message || priceError, 300) });
        }
      }

      postToHtml(html, "HOME_BOOTSTRAP_RESULT", {
        booking,
        content,
        settings:currentSettings,
        sync:{
          ok: contentResult.status === "fulfilled",
          fetchedAt:new Date().toISOString(),
          errors:bootstrapErrors
        }
      });

      if (contentResult.status === "rejected") postHomeError(html, contentResult.reason);
    } catch (error) {
      console.error("[Home] Bootstrap failed.", error);
      postHomeError(html, error);
    } finally { bootstrapPromise = null; }
  })();
  return bootstrapPromise;
}

async function handleHomeMessage(html, message) {
  const payload = message.payload || {};
  switch (message.type) {
    case "HOME_READY":
      currentSettings = normalizeSettings(message.settings || payload.settings || currentSettings);
      homePriceSearch = normalizePriceSearch(message.priceSearch || payload.priceSearch || homePriceSearch || {});
      await sendHomeBootstrap(html, false, currentSettings);
      return true;
    case "HOME_LOCATIONS_REQUEST":
      await sendHomeLocations(html);
      return true;
    case "HOME_REFRESH":
      if (message.priceSearch || payload.priceSearch) homePriceSearch = normalizePriceSearch(message.priceSearch || payload.priceSearch);
      await sendHomeBootstrap(html, true, currentSettings);
      return true;
    case "HOME_SEARCH": {
      const rawSearch = message.search || payload.search || {};
      const search = { ...rawSearch, locale:rawSearch.locale || currentSettings.language, language:rawSearch.language || currentSettings.language, currency:rawSearch.currency || currentSettings.currency };
      const result = await searchUnifiedOffers({ search });
      postToHtml(html, "HOME_SEARCH_RESULT", { ...(result || {}), items:Array.isArray(result?.items) ? result.items : [] });
      return true;
    }
    case "HOME_SELECT_OFFER": {
      const offer = message.offer || payload.offer || {};
      const search = message.search || payload.search || offer.searchContext || {};
      let result = await createBookingCartFromOffer({ offer, search });
      if (result?.requiresLogin) {
        try { await authentication.promptLogin(); }
        catch (_) { postHomeError(html, { message:"Sign in was cancelled. The offer was not saved." }); return true; }
        await sendHeaderState(html, true);
        result = await createBookingCartFromOffer({ offer, search });
      }
      if (result?.requiresLogin) throw new Error(result?.message || "Sign in to continue with this offer.");
      if (!result?.cartId) throw new Error("The booking cart was not created because no cart ID was returned.");
      postToHtml(html, "HOME_NAVIGATE_TO_OFFER", result);
      const allowed = ["offer","extras","transfer","apis","seats","payment","confirmation"];
      const step = allowed.includes(result?.step) ? result.step : "offer";
      navigateTo(html, `/booking?step=${encodeURIComponent(step)}&cartId=${encodeURIComponent(result.cartId)}`);
      return true;
    }
    case "HOME_NAVIGATE":
      navigateTo(html, message.path || payload.path);
      return true;
    default: return false;
  }
}

function handleMessageError(html, message, error) {
  console.error(`[Home] ${message.source || "Unknown"}/${message.type || "Unknown"} failed.`, error);
  if (HOME_SOURCES.has(message.source)) postHomeError(html, error);
  else if (message.source === FOOTER_SOURCE && message.type === "FOOTER_NEWSLETTER_SIGNUP") {
    postToHtml(html, "FOOTER_NEWSLETTER_RESULT", { ok:false, message:error?.message || "Newsletter signup failed." });
  } else if (message.source === HEADER_SOURCE) postToHtml(html, "CUSTOMER_HEADER_STATE", guestHeaderState());
}

$w.onReady(function () {
  const html = getHtmlComponent();
  if (!html) return;

  // Push the location catalogue proactively. This is intentionally independent of HOME_READY,
  // because Wix HTML iframes can start before their own boot message reaches page code.
  sendHomeLocations(html).catch(error => console.error("[Home] Initial location push failed.", error));
  setTimeout(() => {
    sendHomeLocations(html).catch(error => console.error("[Home] Retry location push failed.", error));
  }, 900);

  html.onMessage(async event => {
    const message = parseMessage(event.data);
    if (!message?.source || !message?.type) return;
    try {
      if (HOME_SOURCES.has(message.source)) { await handleHomeMessage(html, message); return; }
      if (message.source === HEADER_SOURCE) { await handleHeaderMessage(html, message); return; }
      if (message.source === FOOTER_SOURCE) { await handleFooterMessage(html, message); return; }
    } catch (error) { handleMessageError(html, message, error); }
  });
});
