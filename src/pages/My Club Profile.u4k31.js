// /src/pages/My Club Profile.u4k31.js
// B-011.31 / V12.1 — SKANDI customer My Profile + SKANDI Club page controller.
// V12.1 repairs startup handshake loss and duplicate bootstrap pressure without changing the embed contract.

import wixLocationFrontend from "wix-location-frontend";
import { authentication } from "wix-members-frontend";
import {
  getCustomerProfileBootstrap,
  updateCustomerProfile,
  saveCustomerTraveler,
  removeCustomerTraveler,
  markCustomerNotificationRead,
  removeCustomerFavorite,
  linkCustomerBooking,
  getCustomerBookingDetail,
  quoteCustomerFlightCancellation,
  confirmCustomerFlightCancellation,
  searchCustomerFlightChanges,
  createCustomerPendingFlightChange,
  prepareCustomerFlightChangePayment,
  confirmCustomerFlightChange,
  listCustomerPostBookingBaggage,
  prepareCustomerPostBookingBaggage,
  confirmCustomerPostBookingBaggage,
  listCustomerAirlineInitiatedChanges,
  acceptCustomerAirlineInitiatedChange,
  cancelCustomerStay,
  cancelCustomerCar,
  getCustomerDocument
} from "backend/SKANDI_CORE/customerProfile.web.js";

const HTML_SOURCE = "SKANDI_MY_PROFILE";
const DOCUMENT_SOURCE = "SKANDI_CUSTOMER_DOCUMENT_CENTER";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";
const VERSION = "V12.1-MY-PROFILE-2026.10.14";
const BOOTSTRAP_CACHE_MS = 5000;
const BOOTSTRAP_TIMEOUT_MS = 22000;
const STARTUP_BOOTSTRAP_DELAY_MS = 250;
const HOST_READY_DELAYS_MS = Object.freeze([0, 450, 1400, 3200]);
const STARTUP_REPLAY_DELAYS_MS = Object.freeze([650, 1800, 4200]);

let embed = null;
let inboundSeen = false;
let bootstrapPromise = null;
let bootstrapCache = null;
let bootstrapCacheAt = 0;

function post(type, payload = {}) {
  try {
    embed?.postMessage({
      source: PARENT_SOURCE,
      type,
      payload,
      timestamp: new Date().toISOString()
    });
  } catch (_) {}
}

function safeError(error) {
  return {
    code: String(error?.code || "MY_PROFILE_REQUEST_FAILED").slice(0, 100),
    message: String(error?.publicMessage || error?.message || "The request could not be completed.").slice(0, 500)
  };
}

function safePath(value) {
  const path = String(value || "").trim();
  if (!path.startsWith("/") || path.startsWith("//") || /[\r\n]/.test(path)) return "";
  return path.slice(0, 1200);
}

function requestId(payload = {}) {
  return String(payload.requestId || "").slice(0, 120);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withTimeout(promise, timeoutMs, code, message) {
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(() => {
          const error = new Error(message);
          error.code = code;
          error.publicMessage = message;
          reject(error);
        }, timeoutMs);
      })
    ]);
  } finally {
    clearTimeout(timer);
  }
}

const VALID_PAGES = Object.freeze({
  club: new Set(["overview", "activity", "program"]),
  trips: new Set(["upcoming", "past", "drafts"]),
  profile: new Set(["details", "travelers", "wallet", "saved"]),
  account: new Set(["notifications", "settings"])
});

const LEGACY_TABS = Object.freeze({
  overview: ["club", "overview"],
  club: ["club", "overview"],
  trips: ["trips", "upcoming"],
  orders: ["trips", "drafts"],
  documents: ["trips", "upcoming"],
  travelers: ["profile", "travelers"],
  wallet: ["profile", "wallet"],
  saved: ["profile", "saved"],
  notifications: ["account", "notifications"],
  settings: ["account", "settings"]
});

function resolvePage(payload = {}) {
  const q = wixLocationFrontend.query || {};
  let section = String(payload.section || q.section || "").toLowerCase().slice(0, 40);
  let view = String(payload.view || q.view || "").toLowerCase().slice(0, 40);
  if (!VALID_PAGES[section]?.has(view)) {
    const legacy = String(payload.tab || q.tab || "overview").toLowerCase().slice(0, 40);
    [section, view] = LEGACY_TABS[legacy] || ["club", "overview"];
  }
  return { section, view };
}

function legacyTab(section, view) {
  if (section === "trips" && view === "drafts") return "orders";
  if (section === "trips") return "trips";
  if (section === "profile" && view === "travelers") return "travelers";
  if (section === "profile" && view === "wallet") return "wallet";
  if (section === "profile" && view === "saved") return "saved";
  if (section === "account" && view === "notifications") return "notifications";
  if (section === "account" && view === "settings") return "settings";
  return "club";
}

function invalidateBootstrapCache() {
  bootstrapCache = null;
  bootstrapCacheAt = 0;
}

async function loadBootstrap(tab, { force = false } = {}) {
  if (!force && bootstrapCache && Date.now() - bootstrapCacheAt <= BOOTSTRAP_CACHE_MS) {
    return bootstrapCache;
  }

  if (bootstrapPromise) {
    if (!force) return bootstrapPromise;
    try { await bootstrapPromise; } catch (_) {}
  }

  if (force) invalidateBootstrapCache();

  const load = withTimeout(
    getCustomerProfileBootstrap({ tab }),
    BOOTSTRAP_TIMEOUT_MS,
    "MY_PROFILE_BOOTSTRAP_TIMEOUT",
    "Your profile is taking too long to load. Please retry."
  ).then((data) => {
    bootstrapCache = data;
    bootstrapCacheAt = Date.now();
    return data;
  });

  bootstrapPromise = load;
  try {
    return await load;
  } finally {
    if (bootstrapPromise === load) bootstrapPromise = null;
  }
}

function shapeBootstrap(data, page, tab) {
  return {
    ...data,
    requestedTab: tab,
    requestedSection: page.section,
    requestedView: page.view
  };
}

function replayStartupMessage(type, payload) {
  for (const ms of STARTUP_REPLAY_DELAYS_MS) {
    setTimeout(() => {
      if (!inboundSeen) post(type, payload);
    }, ms);
  }
}

async function bootstrap(payload = {}, { force = false, startupReplay = false } = {}) {
  const page = resolvePage(payload);
  const tab = legacyTab(page.section, page.view);
  const data = await loadBootstrap(tab, { force });
  const shaped = shapeBootstrap(data, page, tab);
  post("MY_PROFILE_DATA", shaped);
  if (startupReplay) replayStartupMessage("MY_PROFILE_DATA", shaped);
  return shaped;
}

async function bootstrapDocuments(payload = {}, { force = false } = {}) {
  // Load documents independently; do not reset the selected workspace by emitting MY_PROFILE_DATA.
  const data = await loadBootstrap("trips", { force });
  const bookingId = String(payload.bookingId || "");
  post("CUSTOMER_DOCUMENTS_LOAD", {
    bookingId,
    documents: bookingId
      ? (data.documents || []).filter((document) => String(document.bookingId || "") === bookingId)
      : (data.documents || [])
  });
  return data;
}

async function run(type, payload = {}) {
  const request = requestId(payload);
  try {
    let result;
    switch (type) {
      case "MY_PROFILE_READY":
        await bootstrap(payload);
        return;
      case "MY_PROFILE_REFRESH":
        result = await bootstrap(payload, { force: true });
        post("MY_PROFILE_RESULT", { requestId: request, action: type, result });
        return;
      case "MY_PROFILE_SAVE_PROFILE":
        result = await updateCustomerProfile(payload);
        break;
      case "MY_PROFILE_SAVE_TRAVELER":
        result = await saveCustomerTraveler(payload);
        break;
      case "MY_PROFILE_REMOVE_TRAVELER":
        result = await removeCustomerTraveler(payload);
        break;
      case "MY_PROFILE_MARK_NOTIFICATION_READ":
        result = await markCustomerNotificationRead(payload);
        break;
      case "MY_PROFILE_REMOVE_FAVORITE":
        result = await removeCustomerFavorite(payload);
        break;
      case "MY_PROFILE_LINK_BOOKING":
        result = await linkCustomerBooking(payload);
        break;
      case "MY_PROFILE_BOOKING_DETAIL":
        result = await getCustomerBookingDetail(payload);
        break;
      case "MY_PROFILE_FLIGHT_CANCEL_QUOTE":
        result = await quoteCustomerFlightCancellation(payload);
        break;
      case "MY_PROFILE_FLIGHT_CANCEL_CONFIRM":
        result = await confirmCustomerFlightCancellation(payload);
        break;
      case "MY_PROFILE_FLIGHT_CHANGE_SEARCH":
        result = await searchCustomerFlightChanges(payload);
        break;
      case "MY_PROFILE_FLIGHT_CHANGE_SELECT":
        result = await createCustomerPendingFlightChange(payload);
        break;
      case "MY_PROFILE_FLIGHT_CHANGE_PREPARE_PAYMENT":
        result = await prepareCustomerFlightChangePayment(payload);
        break;
      case "MY_PROFILE_FLIGHT_CHANGE_CONFIRM":
        result = await confirmCustomerFlightChange(payload);
        break;
      case "MY_PROFILE_BAGGAGE_LIST":
        result = await listCustomerPostBookingBaggage(payload);
        break;
      case "MY_PROFILE_BAGGAGE_PREPARE_PAYMENT":
        result = await prepareCustomerPostBookingBaggage(payload);
        break;
      case "MY_PROFILE_BAGGAGE_CONFIRM":
        result = await confirmCustomerPostBookingBaggage(payload);
        break;
      case "MY_PROFILE_AIRLINE_CHANGES":
        result = await listCustomerAirlineInitiatedChanges(payload);
        break;
      case "MY_PROFILE_AIRLINE_CHANGE_ACCEPT":
        result = await acceptCustomerAirlineInitiatedChange(payload);
        break;
      case "MY_PROFILE_STAY_CANCEL":
        result = await cancelCustomerStay(payload);
        break;
      case "MY_PROFILE_CAR_CANCEL":
        result = await cancelCustomerCar(payload);
        break;
      case "CUSTOMER_DOCUMENT_CENTER_READY":
        await bootstrapDocuments(payload);
        return;
      case "CUSTOMER_DOCUMENT_OPEN":
        result = await getCustomerDocument(payload);
        post("CUSTOMER_DOCUMENT_RESULT", { requestId: request, ...result });
        return;
      case "CUSTOMER_DOCUMENT_REFRESH":
        await bootstrapDocuments(payload, { force: true });
        return;
      case "CUSTOMER_DOCUMENT_COMPLETE":
        result = await getCustomerDocument(payload);
        post("CUSTOMER_DOCUMENT_ACTION_REQUIRED", {
          requestId: request,
          document: result.document,
          recommendedSection: result.document?.source === "CUSTOMER_PROFILE" ? "profile" : "trips",
          recommendedView: result.document?.source === "CUSTOMER_PROFILE" ? "travelers" : "upcoming",
          recommendedTab: result.document?.source === "CUSTOMER_PROFILE" ? "travelers" : "trips"
        });
        return;
      case "CUSTOMER_DOCUMENT_CLOSE":
        post("MY_PROFILE_SET_PAGE", { section: "trips", view: "upcoming" });
        return;
      case "MY_PROFILE_QUERY_UPDATE": {
        const section = String(payload.section || "").toLowerCase().slice(0, 40);
        const view = String(payload.view || "").toLowerCase().slice(0, 40);
        if (!VALID_PAGES[section]?.has(view)) {
          post("MY_PROFILE_URL_SYNC_ERROR", { code: "MY_PROFILE_INVALID_PAGE" });
          return;
        }
        try {
          // Wix Location updates the address bar without navigating or rebuilding this page.
          wixLocationFrontend.queryParams.add({ section, view });
        } catch (error) {
          console.error("[My Profile] Unable to update the current page query parameters.", error);
          post("MY_PROFILE_URL_SYNC_ERROR", { code: "MY_PROFILE_QUERY_SYNC_FAILED" });
        }
        return;
      }
      case "MY_PROFILE_NAVIGATE": {
        const path = safePath(payload.path);
        if (path) wixLocationFrontend.to(path);
        return;
      }
      case "MY_PROFILE_LOGOUT":
        try { await authentication.logout(); } catch (_) {}
        wixLocationFrontend.to("/");
        return;
      default:
        return;
    }

    post("MY_PROFILE_RESULT", { requestId: request, action: type, result });

    if ([
      "MY_PROFILE_SAVE_PROFILE",
      "MY_PROFILE_SAVE_TRAVELER",
      "MY_PROFILE_REMOVE_TRAVELER",
      "MY_PROFILE_MARK_NOTIFICATION_READ",
      "MY_PROFILE_REMOVE_FAVORITE",
      "MY_PROFILE_LINK_BOOKING",
      "MY_PROFILE_FLIGHT_CANCEL_CONFIRM",
      "MY_PROFILE_FLIGHT_CHANGE_CONFIRM",
      "MY_PROFILE_BAGGAGE_CONFIRM",
      "MY_PROFILE_AIRLINE_CHANGE_ACCEPT",
      "MY_PROFILE_STAY_CANCEL",
      "MY_PROFILE_CAR_CANCEL"
    ].includes(type)) {
      invalidateBootstrapCache();
      await bootstrap(payload, { force: true });
    }
  } catch (error) {
    const safe = safeError(error);
    const errorPayload = { requestId: request, action: type, ...safe };
    post("MY_PROFILE_ERROR", errorPayload);
    if (type.startsWith("CUSTOMER_DOCUMENT_")) {
      post("CUSTOMER_DOCUMENT_ERROR", { requestId: request, ...safe });
    }
  }
}

function announceHostReady(page) {
  const payload = {
    version: VERSION,
    section: page.section,
    view: page.view,
    tab: legacyTab(page.section, page.view)
  };
  for (const ms of HOST_READY_DELAYS_MS) {
    setTimeout(() => {
      if (!inboundSeen) post("MY_PROFILE_HOST_READY", payload);
    }, ms);
  }
}

async function startupFallback(page) {
  await delay(STARTUP_BOOTSTRAP_DELAY_MS);
  if (inboundSeen) return;
  try {
    await bootstrap(page, { startupReplay: true });
  } catch (error) {
    const safe = safeError(error);
    const payload = { requestId: "", action: "MY_PROFILE_READY", ...safe };
    post("MY_PROFILE_ERROR", payload);
    replayStartupMessage("MY_PROFILE_ERROR", payload);
  }
}

$w.onReady(() => {
  embed = $w("#htmlMyProfile");

  embed.onMessage((event) => {
    let message = event.data;
    if (typeof message === "string") {
      try { message = JSON.parse(message); } catch (_) { return; }
    }
    if (!message || typeof message !== "object") return;
    if (message.source && message.source !== HTML_SOURCE && message.source !== DOCUMENT_SOURCE) return;

    inboundSeen = true;
    run(String(message.type || ""), message.payload || {});
  });

  if (typeof wixLocationFrontend.onChange === "function") {
    wixLocationFrontend.onChange(() => {
      post("MY_PROFILE_SET_PAGE", resolvePage({}));
    });
  }

  const page = resolvePage({});
  announceHostReady(page);
  startupFallback(page);
});
