// Wix page code for /riaintra/altea/reservations
// HTML Embed ID: #alteaReservationsEmbed
/* global $w */

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

const EMBED_ID = "#alteaReservationsEmbed";
const CHILD_SOURCE = "SKANDI_DUFFEL_RESERVATIONS";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";

const ACTIONS = {
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
    progress: "Retrieving the latest airline order...",
    run: getDuffelOrder
  },
  DUFFEL_CREATE_ORDER: {
    resultType: "DUFFEL_ORDER_CREATED",
    progress: "Creating the airline order. Keep this page open...",
    run: createDuffelOrder
  },
  DUFFEL_CREATE_CANCELLATION: {
    resultType: "DUFFEL_CANCELLATION_QUOTED",
    progress: "Calculating the airline cancellation refund...",
    run: createDuffelOrderCancellation
  },
  DUFFEL_CONFIRM_CANCELLATION: {
    resultType: "DUFFEL_CANCELLATION_CONFIRMED",
    progress: "Confirming the airline cancellation...",
    run: confirmDuffelOrderCancellation
  }
};

$w.onReady(function () {
  const html = $w(EMBED_ID);

  html.onMessage(async (event) => {
    const message = event.data || {};
    if (message.source !== CHILD_SOURCE) return;

    const action = ACTIONS[message.type];
    if (!action) return;

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
      postToEmbed(html, "DUFFEL_ERROR", {
        code: cleanErrorCode(error),
        message: cleanErrorMessage(error)
      }, requestId);
    }
  });
});

function postToEmbed(html, type, payload, requestId) {
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
  return /^[A-Z0-9_]{1,60}$/.test(code) ? code : "RESERVATION_ACTION_FAILED";
}

function cleanErrorMessage(error) {
  const message = String(
    error?.publicMessage ||
    error?.message ||
    "The reservation action could not be completed."
  ).trim();

  return message.slice(0, 300) || "The reservation action could not be completed.";
}
