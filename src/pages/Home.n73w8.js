// /src/pages/Home.n73w8.js
// SKANDI Home V12 — correlated embed bridge; canonical backend owns data and prices.

import wixLocationFrontend from "wix-location-frontend";
import { startBookingSearch } from "public/bookingSearch";
import { getHomeContent, getHomeSearchLocations, getHomeLivePrices } from "backend/SKANDI_CORE/homeContent.web";
import { SITE_MAP, APP_ROUTES } from "public/siteMap";

const HOME_EMBED_IDS = ["#htmlHome", "#htmlhome", "#home"];
const HOME_SOURCES = new Set(["SKANDI_HOME", "SKANDI_HOME_LONG_DISCOVERY_V2", "SKANDI_HOME_OLD_STYLE"]);
const PARENT_SOURCE = "SKANDI_WIX_PARENT";
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
  const job = { key, settings, priceSearch, requestId:clean(message.requestId, 160), content:null, complete:false };
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
  postToHtml(html, "HOME_NAVIGATE_TO_OFFER", {path,step:"offer"}, clean(message.requestId,160));
  navigateTo(path);
}
async function selectOffer(html, message, payload) {
  // Search and offer selection are owned by /booking stateOffer.
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

$w.onReady(function () {
  const html = firstHomeEmbed();
  if (!html) return;
  html.onMessage(async event => {
    const message = parseMessage(event?.data);
    if (!message?.type || !HOME_SOURCES.has(String(message.source || ""))) return;
    try { await handleHomeMessage(html, message); }
    catch (error) { postHomeError(html, error, message); }
  });
  postToHtml(html, "HOME_HOST_READY", {
    protocolVersion:PROTOCOL_VERSION, embedId:clean(html.id, 80),
    routes:{ ...SITE_MAP, ...APP_ROUTES }, readyAt:new Date().toISOString()
  });
});
