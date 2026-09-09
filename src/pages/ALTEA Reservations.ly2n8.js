// Unified ALTEA workspace page code
// HTML Embed ID: #alteaReservationsEmbed
/* global $w */

import wixLocation from "wix-location-frontend";
import {
  getDuffelWorkspaceBootstrap,
  searchDuffelOffers,
  refreshDuffelOffer,
  getDuffelSeatMaps,
  prepareDuffelPayment,
  listDuffelOrders,
  getDuffelOrder,
  createDuffelOrder,
  createDuffelOrderCancellation,
  confirmDuffelOrderCancellation
} from "src/backend/duffelTravel.web";
import {
  getAlteaUnifiedBootstrap,
  searchAlteaBookings,
  getAlteaBookingWorkspace,
  syncDuffelOrderToAltea,
  updateAlteaPassenger,
  addAlteaHistoryNote,
  updateAlteaDocumentStatus,
  createAlteaLocalBooking,
  addAlteaInventoryComponent,
  updateAlteaBookingComponent,
  createAlteaPassenger
} from "src/backend/RIA/alteaUnified.web";
import {
  searchDuffelOrderChanges,
  createDuffelPendingOrderChange,
  getDuffelPendingOrderChange,
  prepareDuffelOrderChangePayment,
  confirmDuffelOrderChange
} from "src/backend/RIA/duffelServicing.web";
import {
  searchDuffelStays,
  fetchDuffelStayRates,
  quoteDuffelStay,
  createDuffelStayBookingStaff,
  getDuffelStayBookingStaff,
  cancelDuffelStayBookingStaff,
  searchDuffelCars,
  quoteDuffelCar,
  createDuffelCarBookingStaff,
  getDuffelCarBookingStaff,
  cancelDuffelCarBookingStaff,
  createDuffelComponentClientKeyStaff
} from "src/backend/RIA/duffelGroundProducts.web";

const EMBED_ID = "#alteaReservationsEmbed";
const STAFF_LOGIN_PATH = "/riaintra";
const CHILD_SOURCE = "SKANDI_DUFFEL_RESERVATIONS";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";

async function createAndSyncOrder(input = {}) {
  const result = await createDuffelOrder(input);
  const sync = await syncDuffelOrderToAltea({
    order: result.order,
    bookingInput: input,
    eventType: result.recoveredExistingOrder ? "DUFFEL_ORDER_RECOVERED" : "DUFFEL_ORDER_CREATED"
  });
  return { ...result, alteaWorkspace: sync.workspace };
}

async function retrieveAndSyncOrder(input = {}) {
  const result = await getDuffelOrder(input);
  let alteaWorkspace = null;
  try {
    const sync = await syncDuffelOrderToAltea({
      order: result.order,
      eventType: "DUFFEL_ORDER_RETRIEVED"
    });
    alteaWorkspace = sync.workspace;
  } catch (error) {
    console.warn("[ALTEA] Supplier order retrieved but internal sync could not be refreshed.", error);
  }
  return { ...result, alteaWorkspace };
}

async function cancelAndSync(input = {}) {
  const result = await confirmDuffelOrderCancellation(input);
  let alteaWorkspace = null;
  try {
    const sync = await syncDuffelOrderToAltea({
      order: result.order,
      eventType: "DUFFEL_ORDER_CANCELLED"
    });
    alteaWorkspace = sync.workspace;
  } catch (error) {
    console.warn("[ALTEA] Cancellation confirmed but internal sync could not be refreshed.", error);
  }
  return { ...result, alteaWorkspace };
}

async function confirmChangeAndSync(input = {}) {
  const result = await confirmDuffelOrderChange(input);
  const latest = await getDuffelOrder({ orderIdOrReference: result.orderId });

  let alteaWorkspace = null;
  try {
    const sync = await syncDuffelOrderToAltea({
      order: latest.order,
      eventType: "DUFFEL_ORDER_CHANGED"
    });
    alteaWorkspace = sync.workspace;
  } catch (error) {
    console.warn("[ALTEA] Order change confirmed but internal sync could not be refreshed.", error);
  }

  return { ...result, order: latest.order, alteaWorkspace };
}

function featureNotConfigured(name) {
  const error = new Error(`${name} is not connected to a backend service yet.`);
  error.code = "FEATURE_NOT_CONFIGURED";
  error.publicMessage = `${name} is not connected to a backend service yet.`;
  throw error;
}

async function getTransferDepartureBootstrap(input = {}) {
  const bootstrap = await getAlteaUnifiedBootstrap(input);
  return {
    departures: Array.isArray(bootstrap?.transferDepartures) ? bootstrap.transferDepartures : [],
    persistenceAvailable: Boolean(bootstrap?.transferDcsPersistence || bootstrap?.capabilities?.transferDcsPersistence || bootstrap?.capabilities?.transferDcs),
    station: bootstrap?.transferStation || bootstrap?.station || null,
    date: input?.date || new Date().toISOString().slice(0, 10)
  };
}

const ACTIONS = {
  // Core Duffel / flight reservation
  DUFFEL_APP_READY: {
    resultType: "DUFFEL_BOOTSTRAP_RESULT",
    run: () => getDuffelWorkspaceBootstrap()
  },
  DUFFEL_SEARCH_OFFERS: {
    resultType: "DUFFEL_OFFERS_RESULT",
    progress: "Searching live airline offers...",
    run: searchDuffelOffers
  },
  DUFFEL_REFRESH_OFFER: {
    resultType: "DUFFEL_OFFER_RESULT",
    progress: "Refreshing price and availability...",
    run: refreshDuffelOffer
  },
  DUFFEL_GET_SEAT_MAPS: {
    resultType: "DUFFEL_SEAT_MAPS_RESULT",
    run: getDuffelSeatMaps
  },
  DUFFEL_PREPARE_PAYMENT: {
    resultType: "DUFFEL_PAYMENT_RESULT",
    progress: "Preparing secure payment...",
    run: prepareDuffelPayment
  },
  DUFFEL_LIST_ORDERS: {
    resultType: "DUFFEL_ORDERS_RESULT",
    run: listDuffelOrders
  },
  DUFFEL_GET_ORDER: {
    resultType: "DUFFEL_ORDER_RESULT",
    progress: "Retrieving supplier order...",
    run: retrieveAndSyncOrder
  },
  DUFFEL_CREATE_ORDER: {
    resultType: "DUFFEL_ORDER_CREATED",
    progress: "Creating airline order and ALTEA booking file...",
    run: createAndSyncOrder
  },
  DUFFEL_CREATE_CANCELLATION: {
    resultType: "DUFFEL_CANCELLATION_QUOTED",
    progress: "Calculating airline cancellation refund...",
    run: createDuffelOrderCancellation
  },
  DUFFEL_CONFIRM_CANCELLATION: {
    resultType: "DUFFEL_CANCELLATION_CONFIRMED",
    progress: "Confirming airline cancellation and updating ALTEA...",
    run: cancelAndSync
  },

  // Air servicing / changes
  DUFFEL_SEARCH_ORDER_CHANGES: {
    resultType: "DUFFEL_ORDER_CHANGE_OFFERS",
    progress: "Searching airline change options...",
    run: searchDuffelOrderChanges
  },
  DUFFEL_CREATE_ORDER_CHANGE: {
    resultType: "DUFFEL_ORDER_CHANGE_PENDING",
    progress: "Creating pending airline change...",
    run: createDuffelPendingOrderChange
  },
  DUFFEL_GET_ORDER_CHANGE: {
    resultType: "DUFFEL_ORDER_CHANGE_PENDING",
    run: getDuffelPendingOrderChange
  },
  DUFFEL_PREPARE_CHANGE_PAYMENT: {
    resultType: "DUFFEL_CHANGE_PAYMENT_RESULT",
    progress: "Preparing secure change payment...",
    run: prepareDuffelOrderChangePayment
  },
  DUFFEL_CONFIRM_ORDER_CHANGE: {
    resultType: "DUFFEL_ORDER_CHANGE_CONFIRMED",
    progress: "Confirming airline change and updating ALTEA...",
    run: confirmChangeAndSync
  },

  // Duffel Stays
  DUFFEL_SEARCH_STAYS: {
    resultType: "DUFFEL_STAYS_RESULT",
    progress: "Searching live Duffel Stays...",
    run: searchDuffelStays
  },
  DUFFEL_FETCH_STAY_RATES: {
    resultType: "DUFFEL_STAY_RATES_RESULT",
    progress: "Loading live room rates...",
    run: fetchDuffelStayRates
  },
  DUFFEL_QUOTE_STAY: {
    resultType: "DUFFEL_STAY_QUOTE_RESULT",
    progress: "Confirming hotel price and availability...",
    run: quoteDuffelStay
  },
  DUFFEL_CREATE_STAY_BOOKING: {
    resultType: "DUFFEL_STAY_BOOKING_RESULT",
    progress: "Creating Duffel stay booking...",
    run: createDuffelStayBookingStaff
  },
  DUFFEL_GET_STAY_BOOKING: {
    resultType: "DUFFEL_STAY_BOOKING_RESULT",
    run: getDuffelStayBookingStaff
  },
  DUFFEL_CANCEL_STAY_BOOKING: {
    resultType: "DUFFEL_STAY_CANCEL_RESULT",
    progress: "Cancelling Duffel stay booking...",
    run: cancelDuffelStayBookingStaff
  },

  // Duffel Cars
  DUFFEL_SEARCH_CARS: {
    resultType: "DUFFEL_CARS_RESULT",
    progress: "Searching live Duffel Cars...",
    run: searchDuffelCars
  },
  DUFFEL_QUOTE_CAR: {
    resultType: "DUFFEL_CAR_QUOTE_RESULT",
    progress: "Confirming car price and availability...",
    run: quoteDuffelCar
  },
  DUFFEL_PREPARE_CAR_CARD: {
    resultType: "DUFFEL_CAR_CARD_READY",
    progress: "Preparing secure supplier card entry...",
    run: createDuffelComponentClientKeyStaff
  },
  DUFFEL_CREATE_CAR_BOOKING: {
    resultType: "DUFFEL_CAR_BOOKING_RESULT",
    progress: "Creating Duffel car booking...",
    run: createDuffelCarBookingStaff
  },
  DUFFEL_GET_CAR_BOOKING: {
    resultType: "DUFFEL_CAR_BOOKING_RESULT",
    run: getDuffelCarBookingStaff
  },
  DUFFEL_CANCEL_CAR_BOOKING: {
    resultType: "DUFFEL_CAR_CANCEL_RESULT",
    progress: "Cancelling Duffel car booking...",
    run: cancelDuffelCarBookingStaff
  },

  // Current ALTEA unified booking functions
  ALTEA_UNIFIED_BOOTSTRAP: {
    resultType: "ALTEA_UNIFIED_BOOTSTRAP_RESULT",
    run: getAlteaUnifiedBootstrap
  },
  ALTEA_SEARCH_BOOKINGS: {
    resultType: "ALTEA_BOOKINGS_RESULT",
    run: searchAlteaBookings
  },
  ALTEA_GET_BOOKING: {
    resultType: "ALTEA_BOOKING_RESULT",
    run: getAlteaBookingWorkspace
  },
  ALTEA_UPDATE_PASSENGER: {
    resultType: "ALTEA_PASSENGER_UPDATED",
    run: updateAlteaPassenger
  },
  ALTEA_ADD_HISTORY_NOTE: {
    resultType: "ALTEA_HISTORY_UPDATED",
    run: addAlteaHistoryNote
  },
  ALTEA_UPDATE_DOCUMENT_STATUS: {
    resultType: "ALTEA_DOCUMENT_UPDATED",
    run: updateAlteaDocumentStatus
  },
  ALTEA_CREATE_LOCAL_BOOKING: {
    resultType: "ALTEA_LOCAL_BOOKING_CREATED",
    progress: "Creating SKANDI booking file...",
    run: createAlteaLocalBooking
  },
  ALTEA_ADD_INVENTORY_COMPONENT: {
    resultType: "ALTEA_COMPONENT_UPDATED",
    run: addAlteaInventoryComponent
  },
  ALTEA_UPDATE_COMPONENT: {
    resultType: "ALTEA_COMPONENT_UPDATED",
    run: updateAlteaBookingComponent
  },
  ALTEA_CREATE_PASSENGER: {
    resultType: "ALTEA_PASSENGER_CREATED",
    run: createAlteaPassenger
  },

  // Transfer Departure Control. The bootstrap can read live transfer departures
  // when alteaUnified exposes them. Passenger/departure persistence is only
  // activated in the HTML when the backend advertises transferDcsPersistence.
  ALTEA_TRANSFER_DCS_BOOTSTRAP: {
    resultType: "ALTEA_TRANSFER_DCS_BOOTSTRAP_RESULT",
    run: getTransferDepartureBootstrap
  },
  ALTEA_TRANSFER_DCS_UPDATE_PASSENGER: {
    resultType: "ALTEA_TRANSFER_DCS_PASSENGER_UPDATED",
    run: () => featureNotConfigured("Transfer Departure Control passenger persistence")
  },
  ALTEA_TRANSFER_DCS_UPDATE_DEPARTURE: {
    resultType: "ALTEA_TRANSFER_DCS_DEPARTURE_UPDATED",
    run: () => featureNotConfigured("Transfer Departure Control departure persistence")
  },
  ALTEA_TRANSFER_DCS_RECORD_DOCUMENT: {
    resultType: "ALTEA_TRANSFER_DCS_DOCUMENT_RECORDED",
    run: () => featureNotConfigured("Transfer Departure Control document persistence")
  },

  // v3.3 UI contracts not yet backed by confirmed project exports.
  // They return a clear error instead of silently doing nothing.
  ALTEA_UPDATE_BOOKING: {
    resultType: "ALTEA_BOOKING_UPDATED",
    run: () => featureNotConfigured("Master booking update")
  },
  ALTEA_CLUB_SEARCH: {
    resultType: "ALTEA_CLUB_SEARCH_RESULT",
    run: () => featureNotConfigured("SKANDI Club search")
  },
  ALTEA_CLUB_LINK_MEMBER: {
    resultType: "ALTEA_CLUB_MEMBER_LINKED",
    run: () => featureNotConfigured("SKANDI Club member linking")
  },
  ALTEA_CLUB_ADJUST_POINTS: {
    resultType: "ALTEA_CLUB_POINTS_UPDATED",
    run: () => featureNotConfigured("SKANDI Club points")
  },
  ALTEA_GENERATE_DOCUMENT: {
    resultType: "ALTEA_DOCUMENT_GENERATED",
    run: () => featureNotConfigured("Document generation")
  },
  ALTEA_SEND_DOCUMENT: {
    resultType: "ALTEA_DOCUMENT_SENT",
    run: () => featureNotConfigured("Document sending")
  },
  ALTEA_SEND_MANIFEST: {
    resultType: "ALTEA_MANIFEST_SENT",
    run: () => featureNotConfigured("Manifest sending")
  },
  ALTEA_TRAVEL_REQUIREMENTS_CHECK: {
    resultType: "ALTEA_TRAVEL_REQUIREMENTS_RESULT",
    run: () => featureNotConfigured("Travel requirements provider")
  },
  ALTEA_DCS_UPDATE_PASSENGER: {
    resultType: "ALTEA_DCS_PASSENGER_UPDATED",
    run: () => featureNotConfigured("Departure Control persistence")
  },
  ALTEA_DCS_RECORD_DOCUMENT: {
    resultType: "ALTEA_DCS_DOCUMENT_RECORDED",
    run: () => featureNotConfigured("Departure Control document persistence")
  }
};

$w.onReady(function () {
  const html = $w(EMBED_ID);

  html.onMessage(async event => {
    const message = event.data || {};
    if (message.source !== CHILD_SOURCE) return;

    // v3 enterprise module can announce itself without needing a backend call.
    if (message.type === "ALTEA_ENTERPRISE_MODULE_READY") {
      postToEmbed(html, "ALTEA_ENTERPRISE_MODULE_ACK", {
        connected: true,
        embedId: EMBED_ID
      }, cleanRequestId(message.requestId));
      return;
    }

    const action = ACTIONS[message.type];
    if (!action) {
      postToEmbed(html, "ALTEA_ERROR", {
        code: "UNKNOWN_RESERVATION_ACTION",
        message: `Unsupported reservation action: ${String(message.type || "").slice(0, 80)}`
      }, cleanRequestId(message.requestId));
      return;
    }

    const requestId = cleanRequestId(message.requestId);

    try {
      if (action.progress) {
        postToEmbed(html, "DUFFEL_PROGRESS", {
          message: action.progress
        }, "");
      }

      const payload = await action.run(message.payload || {});
      postToEmbed(html, action.resultType, payload || {}, requestId);
    } catch (error) {
      const code = cleanErrorCode(error);
      const isDuffel = message.type.startsWith("DUFFEL_") || code.startsWith("DUFFEL_");

      postToEmbed(html, isDuffel ? "DUFFEL_ERROR" : "ALTEA_ERROR", {
        code,
        message: cleanErrorMessage(error)
      }, requestId);

      if (code === "AUTH_REQUIRED") {
        wixLocation.to(STAFF_LOGIN_PATH);
      }
    }
  });

  // Always trigger a new handshake after the Wix listener is attached.
  postToEmbed(html, "DUFFEL_PARENT_READY", {
    embedId: EMBED_ID,
    unified: true,
    version: "3.3"
  }, "");
});

function postToEmbed(html, type, payload = {}, requestId = "") {
  html.postMessage({
    source: PARENT_SOURCE,
    type,
    requestId,
    payload,
    timestamp: new Date().toISOString()
  });
}

function cleanRequestId(value) {
  const requestId = String(value || "").trim();
  return /^[A-Za-z0-9_-]{1,100}$/.test(requestId) ? requestId : "";
}

function cleanErrorCode(error) {
  const code = String(error?.code || "").trim().toUpperCase();
  return /^[A-Z0-9_]{1,60}$/.test(code) ? code : "ALTEA_ACTION_FAILED";
}

function cleanErrorMessage(error) {
  const message = String(
    error?.publicMessage ||
    error?.message ||
    "The ALTEA reservation action could not be completed."
  ).trim();

  return message.slice(0, 300) || "The ALTEA reservation action could not be completed.";
}
