import wixLocation from "wix-location";
import { authentication } from "wix-members-frontend";
import {
  getCustomerPortalState,
  saveCustomerProfile,
  saveTravelCompanion,
  deleteTravelCompanion,
  saveTravelDocument,
  deleteTravelDocument,
  redeemWixLoyaltyReward
} from "backend/customerPortal.web";
import {
  getCustomerBookingHubState,
  getCustomerBookingDetail,
  claimCustomerBooking,
  addCustomerTripExtra,
  removeCustomerTripExtra,
  quoteCustomerAirCancellation,
  confirmCustomerAirCancellation
} from "backend/customerBookingPortal.web";

const EMBED_ID = "#customerProfileEmbed";
const CHILD_SOURCE = "SKANDI_CUSTOMER_PORTAL";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";

const ACCOUNT_PATHS = {
  profile: "/account/my-account",
  settings: "/account/settings",
  orders: "/account/my-orders"
};

function safeElement() {
  try { return $w(EMBED_ID); }
  catch (_error) { return null; }
}

function post(type, payload = {}) {
  const embed = safeElement();
  if (!embed?.postMessage) return;
  embed.postMessage({
    source: PARENT_SOURCE,
    type,
    payload: payload || {},
    timestamp: new Date().toISOString()
  });
}

function currentRouteState() {
  const requested = String(wixLocation.query.tab || "overview").trim().toLowerCase();
  const aliases = {
    trips: "bookings",
    trip: "bookings",
    "my-trips": "bookings",
    "club-rewards": "club",
    rewards: "club"
  };
  return {
    tab: aliases[requested] || requested || "overview",
    bookingId: String(wixLocation.query.booking || "").trim()
  };
}

async function mergedState() {
  const [portal, bookingHub] = await Promise.all([
    getCustomerPortalState(),
    getCustomerBookingHubState()
  ]);
  const bookings = Array.isArray(bookingHub?.bookings) ? bookingHub.bookings : [];
  return {
    ...(portal || {}),
    bookingHubVersion: bookingHub?.bookingHubVersion || "",
    bookingCounts: bookingHub?.counts || {},
    bookings,
    trips: bookings
  };
}

async function sendState(message = "Loading profile...") {
  await progress(message);
  const state = await mergedState();
  post("CUSTOMER_PORTAL_STATE", state);
  post("CUSTOMER_PORTAL_ROUTE", currentRouteState());
}

async function progress(message) {
  post("CUSTOMER_PORTAL_PROGRESS", { message });
}

async function sendBookingDetail(bookingId, message = "Loading trip...") {
  await progress(message);
  const result = await getCustomerBookingDetail({ bookingId });
  post("CUSTOMER_BOOKING_DETAIL", { booking: result?.booking || null });
  return result?.booking || null;
}

function bookingIdOf(payload = {}) {
  return String(payload.bookingId || payload.id || payload.booking?.id || "").trim();
}

$w.onReady(function () {
  const embed = safeElement();
  if (!embed) {
    console.error(`[My Profile] Missing HTML embed ${EMBED_ID}`);
    return;
  }

  embed.onMessage(async (event) => {
    const message = event.data || {};
    if (message.source !== CHILD_SOURCE) return;
    const payload = message.payload || {};

    try {
      switch (message.type) {
        case "CUSTOMER_PORTAL_READY":
        case "CUSTOMER_REFRESH_REQUEST":
          await sendState("Loading profile...");
          return;

        case "CUSTOMER_SAVE_PROFILE":
          await progress("Saving profile...");
          await saveCustomerProfile(payload);
          await sendState("Profile saved");
          return;

        case "CUSTOMER_SAVE_COMPANION":
          await progress("Saving companion...");
          await saveTravelCompanion(payload);
          await sendState("Companion saved");
          return;

        case "CUSTOMER_DELETE_COMPANION":
          await progress("Deleting companion...");
          await deleteTravelCompanion(payload?._id);
          await sendState("Companion deleted");
          return;

        case "CUSTOMER_SAVE_DOCUMENT":
          await progress("Saving document...");
          await saveTravelDocument(payload);
          await sendState("Document saved");
          return;

        case "CUSTOMER_DELETE_DOCUMENT":
          await progress("Deleting document...");
          await deleteTravelDocument(payload?._id);
          await sendState("Document deleted");
          return;

        case "CUSTOMER_REDEEM_REWARD": {
          await progress("Redeeming reward...");
          const result = await redeemWixLoyaltyReward(payload);
          post(result?.ok === false ? "CUSTOMER_PORTAL_ERROR" : "CUSTOMER_PORTAL_PROGRESS", {
            message: result?.message || result?.error || "Loyalty action complete."
          });
          await sendState("Reward updated");
          return;
        }

        case "CUSTOMER_OPEN_BOOKING": {
          const bookingId = bookingIdOf(payload);
          if (!bookingId) throw new Error("Choose a booking first.");
          await sendBookingDetail(bookingId);
          return;
        }

        case "CUSTOMER_CLAIM_BOOKING": {
          await progress("Verifying booking...");
          const result = await claimCustomerBooking({
            bookingReference: payload.bookingReference || "",
            lastName: payload.lastName || ""
          });
          post("CUSTOMER_BOOKING_ACTION_RESULT", {
            ok: true,
            message: "Booking added to My Trips."
          });
          if (result?.booking) post("CUSTOMER_BOOKING_DETAIL", { booking: result.booking });
          await sendState("Booking linked");
          return;
        }

        case "CUSTOMER_ADD_TRIP_EXTRA": {
          await progress("Adding to your trip...");
          const result = await addCustomerTripExtra({
            bookingId: bookingIdOf(payload),
            entityId: payload.entityId || "",
            quantity: payload.quantity || 1,
            serviceDate: payload.serviceDate || ""
          });
          post("CUSTOMER_BOOKING_ACTION_RESULT", {
            ok: true,
            message: result?.message || "Trip updated."
          });
          if (result?.booking) post("CUSTOMER_BOOKING_DETAIL", { booking: result.booking });
          await sendState("Trip updated");
          return;
        }

        case "CUSTOMER_REMOVE_TRIP_EXTRA": {
          await progress("Removing trip extra...");
          const result = await removeCustomerTripExtra({
            bookingId: bookingIdOf(payload),
            componentId: payload.componentId || ""
          });
          post("CUSTOMER_BOOKING_ACTION_RESULT", {
            ok: true,
            message: result?.message || "Trip updated."
          });
          if (result?.booking) post("CUSTOMER_BOOKING_DETAIL", { booking: result.booking });
          await sendState("Trip updated");
          return;
        }

        case "CUSTOMER_QUOTE_CANCELLATION": {
          await progress("Checking airline cancellation conditions...");
          const result = await quoteCustomerAirCancellation({ bookingId: bookingIdOf(payload) });
          post("CUSTOMER_CANCELLATION_QUOTE", {
            bookingId: bookingIdOf(payload),
            quote: result?.quote || null
          });
          return;
        }

        case "CUSTOMER_CONFIRM_CANCELLATION": {
          await progress("Processing cancellation request...");
          const result = await confirmCustomerAirCancellation({
            bookingId: bookingIdOf(payload),
            cancellationId: payload.cancellationId || ""
          });
          post("CUSTOMER_BOOKING_ACTION_RESULT", {
            ok: true,
            message: result?.message || "Cancellation updated.",
            requiresStaffRefund: result?.requiresStaffRefund === true
          });
          if (result?.booking) post("CUSTOMER_BOOKING_DETAIL", { booking: result.booking });
          await sendState("Booking updated");
          return;
        }

        case "CUSTOMER_LOGOUT":
          await authentication.logout();
          wixLocation.to("/");
          return;

        case "CUSTOMER_OPEN_LOGIN":
          await authentication.promptLogin({ mode: "login" });
          await sendState("Loading profile...");
          return;

        case "CUSTOMER_OPEN_PATH":
          if (payload.path) wixLocation.to(payload.path);
          return;

        case "CUSTOMER_SET_ROUTE": {
          const tab = String(payload.tab || "").trim();
          const booking = String(payload.bookingId || "").trim();
          const query = {};
          if (tab) query.tab = tab;
          if (booking) query.booking = booking;
          try {
            wixLocation.queryParams.add(query);
          } catch (_error) {}
          return;
        }

        case "CUSTOMER_ACCOUNT_ACTION":
          await handleAccountAction(payload?.action);
          return;

        default:
          return;
      }
    } catch (error) {
      await handleError(error);
    }
  });

  // Proactive load in case the iframe READY message fired before Wix attached.
  sendState("Loading profile...").catch(handleError);
});

async function handleError(error) {
  const code = String(error?.code || error?.name || "");
  const message = String(error?.publicMessage || error?.message || "Something went wrong.");
  if (code === "NOT_LOGGED_IN" || message.includes("NOT_LOGGED_IN") || message.includes("Sign in to view your trips")) {
    try {
      await authentication.promptLogin({ mode: "login" });
      await sendState("Loading profile...");
      return;
    } catch (_loginError) {}
  }
  post("CUSTOMER_PORTAL_ERROR", { message: message.slice(0, 300) || "Something went wrong." });
}

async function handleAccountAction(action) {
  switch (action) {
    case "native-profile":
      wixLocation.to(ACCOUNT_PATHS.profile);
      return;
    case "native-settings":
      wixLocation.to(ACCOUNT_PATHS.settings);
      return;
    case "native-orders":
      wixLocation.to(ACCOUNT_PATHS.orders);
      return;
    case "forgot-password":
      await authentication.promptForgotPassword();
      return;
    case "logout":
      await authentication.logout();
      wixLocation.to("/");
      return;
    default:
      return;
  }
}
