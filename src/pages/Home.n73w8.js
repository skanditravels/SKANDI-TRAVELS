// /src/pages/Home.n73w8.js
// SKANDI Home V12 — correlated embed bridge; canonical backend owns data and prices.

import wixLocationFrontend from "wix-location-frontend";
import wixWindowFrontend from "wix-window-frontend";
import { startBookingSearch } from "public/bookingSearch";
import { createBookingFlowHost } from "public/bookingFlowHost";
import { getHomeContent, getHomeSearchLocations, getHomeLivePrices } from "backend/SKANDI_CORE/homeContent.web";
import { SITE_MAP, APP_ROUTES } from "public/siteMap";

const HOME_EMBED_IDS = ["#htmlHome", "#htmlhome", "#home"];
const HOME_SOURCES = new Set(["SKANDI_HOME", "SKANDI_HOME_LONG_DISCOVERY_V2", "SKANDI_HOME_OLD_STYLE"]);
const MOBILE_APP_EMBED_ID = "#homeMobileAppEmbed";
const MOBILE_APP_SOURCE = "SKANDI_HOME_MOBILE_APP";
const MOBILE_APP_BAR_HEIGHT = 88;
const PARENT_SOURCE = "SKANDI_WIX_PARENT";
const BOOKING_SOURCE = "SKANDI_BOOKING_OFFER";
const PROTOCOL_VERSION = "V12-HOME";
const SUPPORTED_LANGUAGES = ["EN","SV","NO","DA","ES","FI","FR-FR","FR-CA","DE","TH"];
const SUPPORTED_CURRENCIES = ["USD","SEK","NOK","DKK","EUR"];
const READ_TIMEOUT_MS = 30000;
const SEARCH_TIMEOUT_MS = 85000;

let currentSettings = { language:"EN", currency:"USD" };
let homePriceSearch = {};
let bootstrapJob = null;
let locationJob = null;
let searchJob = null;
let selectionJob = null;
let mobileAppNav = null;
let mobileRefreshId = "";
let mobileDrawerExpanded = false;
let bookingHost = null;

function clean(value, max = 1000) { return String(value ?? "").trim().slice(0, max); }
function arr(value) { return Array.isArray(value) ? value : []; }
function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
function normalizeSettings(value = {}) {
  const language = clean(value.language, 12).toUpperCase();
  const currency = clean(value.currency, 3).toUpperCase();
  return {
    language:SUPPORTED_LANGUAGES.includes(language) ? language : "EN",
    currency:SUPPORTED_CURRENCIES.includes(currency) ? currency : "USD"
  };
}
function failure(code, publicMessage) {
  const error = new Error(publicMessage);
  error.code = code;
  error.publicMessage = publicMessage;
  return error;
}
function boundedRead(promise, ms = READ_TIMEOUT_MS) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(failure("HOME_TIMEOUT", "This request took too long. Please try again.")), ms);
    })
  ]).finally(() => clearTimeout(timer));
}
function firstHomeEmbed() {
  for (const id of HOME_EMBED_IDS) {
    try {
      const candidate = $w(id);
      if (candidate && typeof candidate.onMessage === "function" && typeof candidate.postMessage === "function") return candidate;
    } catch (_) {}
  }
  console.error("[Home V12] Home HTML component is missing.");
  return null;
}
function parseMessage(data) {
  if (typeof data === "string") {
    try { return obj(JSON.parse(data)); } catch (_) { return null; }
  }
  return data && typeof data === "object" && !Array.isArray(data) ? data : null;
}
function postToHtml(html, type, payload = {}, requestId = "") {
  html.postMessage({ source:PARENT_SOURCE, type, payload, requestId, timestamp:new Date().toISOString() });
}
function postMobile(type, payload = {}, requestId = "") {
  if (mobileAppNav) postToHtml(mobileAppNav, type, payload, requestId);
}
function postHomeError(html, error, message = {}) {
  const code = /^[A-Z][A-Z0-9_]{1,79}$/.test(String(error?.code || "")) ? error.code : "HOME_REQUEST_FAILED";
  postToHtml(html, "HOME_ERROR", {
    code,
    action:message.type || "",
    message:clean(error?.publicMessage || "The request could not be completed. Please try again.", 400)
  }, clean(message.requestId, 160));
}
function navigateTo(rawPath) {
  const path = clean(rawPath, 1600);
  if (!/^\/(?!\/)/.test(path) || /[\\\u0000-\u0020]/.test(path) || /%5c|%0[0-9a-f]|%1[0-9a-f]/i.test(path)) {
    throw failure("HOME_INVALID_ROUTE", "This destination link is unavailable.");
  }
  wixLocationFrontend.to(path);
}
function unpriced(card) {
  return { ...card, fromPrice:null, currency:"", livePriceFound:false, livePriceStatus:"PENDING" };
}
function postBootstrap(html, job, phase) {
  if (bootstrapJob !== job) return;
  postToHtml(html, "HOME_BOOTSTRAP_RESULT", {
    content:job.content, settings:job.settings, sync:job.content.sync,
    phase, routes:{ ...SITE_MAP, ...APP_ROUTES }
  }, job.requestId);
  if (job.mobileRequestId && (phase === "content" || phase === "complete")) {
    postMobile("HOME_APP_REFRESH_RESULT", {phase, completed:phase === "complete"}, job.mobileRequestId);
  }
}

async function hydrateLiveHomePrices(html, job) {
  const rows = [
    ...job.content.destinations.map((card, index) => ({ card, index, key:"destinations" })),
    ...job.content.hotels.map((card, index) => ({ card, index, key:"hotels" }))
  ];
  let cursor = 0;
  const deadline = Date.now() + 75000;
  async function worker() {
    while (cursor < rows.length && bootstrapJob === job) {
      const row = rows[cursor++];
      let card = { ...row.card, livePriceStatus:"UNAVAILABLE" };
      if (Date.now() < deadline) {
        try {
          const result = await boundedRead(getHomeLivePrices({
            recordId:row.card.id, language:job.settings.language, priceSearch:job.priceSearch
          }), 50000);
          if (result?.card?.id === row.card.id) card = result.card;
        } catch (_) {}
      }
      if (bootstrapJob !== job) return;
      job.content[row.key][row.index] = card;
    }
  }
  await Promise.all(Array.from({ length:Math.min(3, rows.length) }, worker));
  if (bootstrapJob !== job) return;
  job.complete = true;
  job.completedAt = Date.now();
  postBootstrap(html, job, "complete");
}
async function sendHomeBootstrap(html, message, force = false) {
  const settings = { ...currentSettings };
  const priceSearch = { ...homePriceSearch };
  const key = JSON.stringify({ settings, priceSearch });
  if (bootstrapJob?.key === key && !force &&
      (!bootstrapJob.complete || Date.now() - bootstrapJob.completedAt < 60000)) {
    bootstrapJob.requestId = clean(message.requestId, 160);
    if (bootstrapJob.content) postBootstrap(html, bootstrapJob, bootstrapJob.complete ? "complete" : "content");
    return bootstrapJob.promise;
  }
  const job = { key, settings, priceSearch, requestId:clean(message.requestId, 160), content:null, complete:false,
    mobileRequestId:clean(message.mobileRequestId, 160) };
  bootstrapJob = job;
  job.promise = (async () => {
    try {
      const content = await boundedRead(getHomeContent({ language:settings.language, force }));
      if (bootstrapJob !== job) return;
      if (!content || !Array.isArray(content.airports) || !Array.isArray(content.searchDestinations)) {
        throw failure("HOME_INVALID_CONTENT", "Home content is temporarily unavailable.");
      }
      job.content = {
        ...content,
        destinations:arr(content.destinations).map(unpriced),
        hotels:arr(content.hotels).map(unpriced)
      };
      postBootstrap(html, job, "content");
      await hydrateLiveHomePrices(html, job);
    } catch (error) {
      if (bootstrapJob !== job) return;
      bootstrapJob = null;
      postHomeError(html, error, message);
      if (job.mobileRequestId) postMobile("HOME_APP_REFRESH_ERROR", {
        message:clean(error?.publicMessage || "Could not refresh Home. Please try again.", 200)
      }, job.mobileRequestId);
    }
  })();
  return job.promise;
}
async function sendHomeLocations(html, message) {
  const language = currentSettings.language;
  if (!locationJob || locationJob.language !== language) {
    const job = { language, promise:null };
    locationJob = job;
    job.promise = boundedRead(getHomeSearchLocations({ language })).finally(() => {
      if (locationJob === job) locationJob = null;
    });
  }
  const payload = await locationJob.promise;
  if (language !== currentSettings.language) return;
  if (!payload || !Array.isArray(payload.airports) || !Array.isArray(payload.searchDestinations)) {
    throw failure("HOME_INVALID_LOCATIONS", "Locations are temporarily unavailable.");
  }
  postToHtml(html, "HOME_LOCATION_DATA", payload, clean(message.requestId, 160));
}
function safeSearchErrors(errors) {
  return arr(errors).map(error => ({
    source:["flight","hotel","car"].includes(error?.source) ? error.source : "search",
    code:/^[A-Z0-9_]{2,80}$/.test(String(error?.code || "")) ? error.code : "SEARCH_FAILED"
  }));
}
async function searchHome(html, message, payload) {
  const raw = obj(message.search || payload.search);
  const search = {...raw,language:raw.language||currentSettings.language,locale:raw.locale||currentSettings.language,currency:raw.currency||currentSettings.currency};
  const path = startBookingSearch(search, "HOME");
  const searchId = new URL(path, "https://www.skanditravels.com").searchParams.get("searchId");
  if (!searchId || !bookingHost) throw failure("BOOKING_HOST_UNAVAILABLE", "The booking flow is temporarily unavailable. Please try again.");
  postToHtml(html, "HOME_NAVIGATE_TO_OFFER", {path,step:"offer"}, clean(message.requestId,160));
  postToHtml(html, "HOME_BOOKING_MODE", {step:"offer"});
  await bookingHost.startSearch(searchId);
}
async function selectOffer(html, message, payload) {
  // Search and offer selection are handled by the Home booking child.
  return searchHome(html, message, {search:message.search||payload.search||searchJob?.search||{}});
}
async function handleHomeMessage(html, message) {
  const payload = obj(message.payload);
  switch (message.type) {
    case "HOME_READY":
    case "HOME_REFRESH":
      currentSettings = normalizeSettings(message.settings || payload.settings || currentSettings);
      homePriceSearch = obj(message.priceSearch || payload.priceSearch || homePriceSearch);
      await sendHomeBootstrap(html, message, message.type === "HOME_REFRESH");
      return;
    case "HOME_LOCATIONS_REQUEST":
      await sendHomeLocations(html, message);
      return;
    case "HOME_SEARCH":
      await searchHome(html, message, payload);
      return;
    case "HOME_SELECT_OFFER":
      await selectOffer(html, message, payload);
      return;
    case "HOME_NAVIGATE":
      navigateTo(message.path || payload.path);
      return;
    case "RESIZE_IFRAME": {
      const height = Number(payload.height);
      if (Number.isFinite(height) && height > 0 && "height" in html) {
        try { html.height = Math.min(20000, Math.max(600, Math.round(height))); } catch (_) {}
      }
      return;
    }
    default:
      return; // Global configuration/settings messages belong to masterPage.js.
  }
}
function firstMobileAppNav() {
  try {
    const element = $w(MOBILE_APP_EMBED_ID);
    return element && typeof element.onMessage === "function" && typeof element.postMessage === "function" ? element : null;
  } catch (_) { return null; }
}
function wireMobileAppNav(html) {
  const nav = firstMobileAppNav();
  if (!nav) return;
  mobileAppNav = nav;
  try {
    if (wixWindowFrontend.formFactor !== "Mobile") {
      if (typeof nav.collapse === "function") nav.collapse();
      return;
    }
  } catch (_) {}
  try {
    if ("height" in nav) nav.height = MOBILE_APP_BAR_HEIGHT;
  } catch (_) {}
  nav.onMessage(async (event) => {
    const message = parseMessage(event?.data);
    if (!message || message.source !== MOBILE_APP_SOURCE) return;
    const requestId = clean(message.requestId, 160);
    switch (message.type) {
      case "HOME_APP_READY":
        postMobile("HOME_APP_READY_ACK", { route:SITE_MAP.home, mobile:true }, requestId);
        return;
      case "HOME_APP_DRAWER_RESIZE": {
        // Keep the pinned Home mobile iframe at tab-bar height until the drawer opens.
        // A child iframe cannot display a full-height side drawer beyond its Wix bounds.
        const expand = message.payload?.open === true;
        try {
          let height = MOBILE_APP_BAR_HEIGHT;
          if (expand) {
            const bounds = await wixWindowFrontend.getBoundingRect();
            const viewportHeight = Number(bounds?.window?.height);
            if (!Number.isFinite(viewportHeight) || viewportHeight < 280) {
              throw new Error("Mobile viewport dimensions are unavailable.");
            }
            height = Math.max(240, Math.min(820, Math.floor(viewportHeight) - 16));
          }
          if (!("height" in nav)) throw new Error("Wix HTML component does not support resizing.");
          nav.height = height;
          mobileDrawerExpanded = expand;
          postMobile("HOME_APP_DRAWER_RESIZE_ACK", {open:expand, height}, requestId);
        } catch (error) {
          console.error("[Home V12] Mobile drawer resize failed.", error);
          postMobile("HOME_APP_DRAWER_RESIZE_ERROR", {open:expand, message:"The menu could not be displayed. Please try again."}, requestId);
        }
        return;
      }
      case "HOME_APP_FOCUS_SEARCH":
        postToHtml(html, "HOME_FOCUS_SEARCH", {}, requestId);
        postMobile("HOME_APP_FOCUS_ACK", {}, requestId);
        return;
      case "HOME_APP_REFRESH":
        if (mobileRefreshId) {
          postMobile("HOME_APP_REFRESH_ERROR", {message:"Home is already refreshing."}, requestId);
          return;
        }
        mobileRefreshId = requestId;
        try {
          await sendHomeBootstrap(html, {type:"HOME_REFRESH",requestId:"",mobileRequestId:requestId}, true);
        } catch (_) {
          postMobile("HOME_APP_REFRESH_ERROR", {message:"Could not refresh Home."}, requestId);
        } finally {
          if (mobileRefreshId === requestId) mobileRefreshId = "";
        }
        return;
      default:
        return;
    }
  });
  postMobile("HOME_APP_READY_ACK", {route:SITE_MAP.home, mobile:true});
}

$w.onReady(function () {
  const html = firstHomeEmbed();
  if (!html) return;
  bookingHost = createBookingFlowHost({
    html, location:wixLocationFrontend,
    onReturnHome:() => {
      try { wixLocationFrontend.queryParams?.remove(["step","searchId","cartId","cartToken"]); } catch (_) {}
      postToHtml(html, "HOME_CONTENT_MODE", {});
    }
  });
  html.onMessage(async event => {
    const message = parseMessage(event?.data);
    if (!message?.type) return;
    if (message.source === BOOKING_SOURCE) {
      await bookingHost.handleMessage(message);
      return;
    }
    if (!HOME_SOURCES.has(String(message.source || ""))) return;
    try { await handleHomeMessage(html, message); }
    catch (error) { postHomeError(html, error, message); }
  });
  wireMobileAppNav(html);
  bookingHost.announceReady();
  postToHtml(html, "HOME_HOST_READY", {
    protocolVersion:PROTOCOL_VERSION, embedId:clean(html.id, 80),
    routes:{ ...SITE_MAP, ...APP_ROUTES }, readyAt:new Date().toISOString()
  });
  bookingHost.startFromLocation().then(started => {
    if (started) postToHtml(html, "HOME_BOOKING_MODE", {step:"offer"});
  }).catch(error => bookingHost.reportError(error));
});
