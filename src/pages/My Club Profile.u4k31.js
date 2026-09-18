// /src/pages/My Profile.u4k31.js
// B-011.31 SKANDI customer My Profile + SKANDI Club page controller.

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
const PARENT_SOURCE = "SKANDI_WIX_PARENT";
const VERSION = "B-011.31";
let embed = null;

function post(type, payload = {}) {
  try { embed?.postMessage({ source: PARENT_SOURCE, type, payload, timestamp: new Date().toISOString() }); } catch (_) {}
}
function safeError(error) {
  return { code: String(error?.code || "MY_PROFILE_REQUEST_FAILED").slice(0, 100), message: String(error?.publicMessage || error?.message || "The request could not be completed.").slice(0, 500) };
}
function safePath(value) {
  const path = String(value || "").trim();
  if (!path.startsWith("/") || path.startsWith("//") || /[\r\n]/.test(path)) return "";
  return path.slice(0, 1200);
}
function requestId(payload = {}) { return String(payload.requestId || "").slice(0, 120); }
const VALID_PAGES = Object.freeze({
  club: new Set(["overview","activity","program"]),
  trips: new Set(["upcoming","past","drafts"]),
  profile: new Set(["details","travelers","wallet","saved"]),
  account: new Set(["notifications","settings"])
});
const LEGACY_TABS = Object.freeze({
  overview:["club","overview"], club:["club","overview"], trips:["trips","upcoming"], orders:["trips","drafts"], documents:["trips","upcoming"],
  travelers:["profile","travelers"], wallet:["profile","wallet"], saved:["profile","saved"], notifications:["account","notifications"], settings:["account","settings"]
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
async function bootstrap(payload = {}) {
  const page = resolvePage(payload);
  const tab = legacyTab(page.section, page.view);
  const data = await getCustomerProfileBootstrap({ tab });
  post("MY_PROFILE_DATA", { ...data, requestedTab: tab, requestedSection: page.section, requestedView: page.view });
  return { ...data, requestedTab: tab, requestedSection: page.section, requestedView: page.view };
}
async function run(type, payload = {}) {
  const request = requestId(payload);
  try {
    let result;
    switch (type) {
      case "MY_PROFILE_READY":
      case "MY_PROFILE_REFRESH": result = await bootstrap(payload); break;
      case "MY_PROFILE_SAVE_PROFILE": result = await updateCustomerProfile(payload); break;
      case "MY_PROFILE_SAVE_TRAVELER": result = await saveCustomerTraveler(payload); break;
      case "MY_PROFILE_REMOVE_TRAVELER": result = await removeCustomerTraveler(payload); break;
      case "MY_PROFILE_MARK_NOTIFICATION_READ": result = await markCustomerNotificationRead(payload); break;
      case "MY_PROFILE_REMOVE_FAVORITE": result = await removeCustomerFavorite(payload); break;
      case "MY_PROFILE_LINK_BOOKING": result = await linkCustomerBooking(payload); break;
      case "MY_PROFILE_BOOKING_DETAIL": result = await getCustomerBookingDetail(payload); break;
      case "MY_PROFILE_FLIGHT_CANCEL_QUOTE": result = await quoteCustomerFlightCancellation(payload); break;
      case "MY_PROFILE_FLIGHT_CANCEL_CONFIRM": result = await confirmCustomerFlightCancellation(payload); break;
      case "MY_PROFILE_FLIGHT_CHANGE_SEARCH": result = await searchCustomerFlightChanges(payload); break;
      case "MY_PROFILE_FLIGHT_CHANGE_SELECT": result = await createCustomerPendingFlightChange(payload); break;
      case "MY_PROFILE_FLIGHT_CHANGE_PREPARE_PAYMENT": result = await prepareCustomerFlightChangePayment(payload); break;
      case "MY_PROFILE_FLIGHT_CHANGE_CONFIRM": result = await confirmCustomerFlightChange(payload); break;
      case "MY_PROFILE_BAGGAGE_LIST": result = await listCustomerPostBookingBaggage(payload); break;
      case "MY_PROFILE_BAGGAGE_PREPARE_PAYMENT": result = await prepareCustomerPostBookingBaggage(payload); break;
      case "MY_PROFILE_BAGGAGE_CONFIRM": result = await confirmCustomerPostBookingBaggage(payload); break;
      case "MY_PROFILE_AIRLINE_CHANGES": result = await listCustomerAirlineInitiatedChanges(payload); break;
      case "MY_PROFILE_AIRLINE_CHANGE_ACCEPT": result = await acceptCustomerAirlineInitiatedChange(payload); break;
      case "MY_PROFILE_STAY_CANCEL": result = await cancelCustomerStay(payload); break;
      case "MY_PROFILE_CAR_CANCEL": result = await cancelCustomerCar(payload); break;
      case "CUSTOMER_DOCUMENT_CENTER_READY": {
        const data = await bootstrap({ section: "trips", view: "upcoming" });
        post("CUSTOMER_DOCUMENTS_LOAD", { bookingId: "", documents: data.documents });
        return;
      }
      case "CUSTOMER_DOCUMENT_OPEN": {
        result = await getCustomerDocument(payload);
        post("CUSTOMER_DOCUMENT_RESULT", { requestId: request, ...result });
        return;
      }
      case "CUSTOMER_DOCUMENT_REFRESH": {
        const data = await bootstrap({ section: "trips", view: "upcoming" });
        const bookingId = String(payload.bookingId || "");
        post("CUSTOMER_DOCUMENTS_LOAD", { bookingId, documents: bookingId ? data.documents.filter(d => String(d.bookingId || "") === bookingId) : data.documents });
        return;
      }
      case "CUSTOMER_DOCUMENT_COMPLETE": {
        result = await getCustomerDocument(payload);
        post("CUSTOMER_DOCUMENT_ACTION_REQUIRED", { requestId: request, document: result.document, recommendedSection: result.document?.source === "CUSTOMER_PROFILE" ? "profile" : "trips", recommendedView: result.document?.source === "CUSTOMER_PROFILE" ? "travelers" : "upcoming", recommendedTab: result.document?.source === "CUSTOMER_PROFILE" ? "travelers" : "trips" });
        return;
      }
      case "CUSTOMER_DOCUMENT_CLOSE": post("MY_PROFILE_SET_PAGE", { section: "trips", view: "upcoming" }); return;
      case "MY_PROFILE_NAVIGATE": {
        const path = safePath(payload.path);
        if (path) wixLocationFrontend.to(path);
        return;
      }
      case "MY_PROFILE_LOGOUT":
        try { await authentication.logout(); } catch (_) {}
        wixLocationFrontend.to("/");
        return;
      default: return;
    }
    post("MY_PROFILE_RESULT", { requestId: request, action: type, result });
    if (["MY_PROFILE_SAVE_PROFILE","MY_PROFILE_SAVE_TRAVELER","MY_PROFILE_REMOVE_TRAVELER","MY_PROFILE_MARK_NOTIFICATION_READ","MY_PROFILE_REMOVE_FAVORITE","MY_PROFILE_LINK_BOOKING","MY_PROFILE_FLIGHT_CANCEL_CONFIRM","MY_PROFILE_FLIGHT_CHANGE_CONFIRM","MY_PROFILE_BAGGAGE_CONFIRM","MY_PROFILE_AIRLINE_CHANGE_ACCEPT","MY_PROFILE_STAY_CANCEL","MY_PROFILE_CAR_CANCEL"].includes(type)) {
      await bootstrap(payload);
    }
  } catch (error) {
    const safe = safeError(error);
    post("MY_PROFILE_ERROR", { requestId: request, action: type, ...safe });
    if (type.startsWith("CUSTOMER_DOCUMENT_")) post("CUSTOMER_DOCUMENT_ERROR", { requestId: request, ...safe });
  }
}

$w.onReady(() => {
  embed = $w("#htmlMyProfile");
  embed.onMessage((event) => {
    let message = event.data;
    if (typeof message === "string") { try { message = JSON.parse(message); } catch (_) { return; } }
    if (!message || typeof message !== "object") return;
    if (message.source && message.source !== HTML_SOURCE && message.source !== "SKANDI_CUSTOMER_DOCUMENT_CENTER") return;
    run(String(message.type || ""), message.payload || {});
  });
  const page = resolvePage({});
  post("MY_PROFILE_HOST_READY", { version: VERSION, section: page.section, view: page.view, tab: legacyTab(page.section, page.view) });
});
