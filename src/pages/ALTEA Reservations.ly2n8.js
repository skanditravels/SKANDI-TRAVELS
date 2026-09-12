// /src/pages/ALTEA Reservations.ly2n8.js
// SKANDI Backend Base 1.0 — B-007.1 ALTEA Reservations page convergence.
//
// Wix page boundary only.
// All ALTEA, Inventory and Duffel provider actions are routed through the
// single canonical backend facade: backend/SKANDI_CORE/reservations.web
//
// HTML Embed: #alteaReservationsEmbed

import wixLocation from "wix-location-frontend";
import { handleReservationsAction } from "backend/SKANDI_CORE/reservations.web";

const EMBED_ID = "#alteaReservationsEmbed";
const STAFF_LOGIN_PATH = "/riaintra";
const CHILD_SOURCE = "SKANDI_DUFFEL_RESERVATIONS";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";
const VERSION = "BACKEND-BASE-1.0-B007.1";

function parse(value) {
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch (_) {
      return null;
    }
  }
  return value && typeof value === "object" ? value : null;
}

function cleanRequestId(value) {
  const requestId = String(value || "");
  return /^[A-Za-z0-9_-]{1,100}$/.test(requestId) ? requestId : "";
}

function cleanActionType(value) {
  const type = String(value || "").trim().toUpperCase();
  return /^[A-Z0-9_]{3,100}$/.test(type) ? type : "";
}

function postToEmbed(embed, type, payload = {}, requestId = "") {
  embed.postMessage({
    source: PARENT_SOURCE,
    type,
    payload,
    requestId,
    timestamp: new Date().toISOString()
  });
}

function errorCode(error) {
  const raw = String(
    error?.code ||
    error?.details?.applicationError?.code ||
    error?.message ||
    "ALTEA_ACTION_FAILED"
  ).toUpperCase();

  return raw.match(/[A-Z][A-Z0-9_]{2,80}/)?.[0] || "ALTEA_ACTION_FAILED";
}

function publicMessage(error, fallback = "The reservation action could not be completed.") {
  const raw =
    error?.publicMessage ||
    error?.details?.applicationError?.data?.message ||
    error?.details?.applicationError?.message ||
    error?.message ||
    fallback;

  const text = String(raw).trim();
  if (!text || /unable to handle the request/i.test(text)) {
    return fallback;
  }

  return text.slice(0, 600);
}

function progressFor(type) {
  const messages = {
    DUFFEL_APP_READY: "Connecting to live travel providers…",
    DUFFEL_SEARCH_OFFERS: "Searching live airline offers…",
    DUFFEL_REFRESH_OFFER: "Refreshing price and availability…",
    DUFFEL_GET_SEAT_MAPS: "Loading live seat maps…",
    DUFFEL_PREPARE_PAYMENT: "Preparing secure payment…",
    DUFFEL_LIST_ORDERS: "Loading supplier orders…",
    DUFFEL_GET_ORDER: "Retrieving supplier order…",
    DUFFEL_CREATE_ORDER: "Creating supplier order…",
    DUFFEL_CREATE_CANCELLATION: "Calculating cancellation terms…",
    DUFFEL_CONFIRM_CANCELLATION: "Confirming cancellation…",
    DUFFEL_SEARCH_ORDER_CHANGES: "Searching airline change options…",
    DUFFEL_CREATE_ORDER_CHANGE: "Creating pending airline change…",
    DUFFEL_GET_ORDER_CHANGE: "Loading pending airline change…",
    DUFFEL_PREPARE_CHANGE_PAYMENT: "Preparing secure change payment…",
    DUFFEL_CONFIRM_ORDER_CHANGE: "Confirming supplier order change…",
    DUFFEL_SEARCH_STAYS: "Searching live hotel stays…",
    DUFFEL_FETCH_STAY_RATES: "Loading live room rates…",
    DUFFEL_QUOTE_STAY: "Confirming hotel price and availability…",
    DUFFEL_CREATE_STAY_BOOKING: "Creating hotel booking…",
    DUFFEL_GET_STAY_BOOKING: "Retrieving hotel booking…",
    DUFFEL_CANCEL_STAY_BOOKING: "Cancelling hotel booking…",
    DUFFEL_SEARCH_CARS: "Searching live car rentals…",
    DUFFEL_QUOTE_CAR: "Confirming car price and availability…",
    DUFFEL_PREPARE_CAR_CARD: "Preparing secure supplier card entry…",
    DUFFEL_CREATE_CAR_BOOKING: "Creating car-rental booking…",
    DUFFEL_GET_CAR_BOOKING: "Retrieving car-rental booking…",
    DUFFEL_CANCEL_CAR_BOOKING: "Cancelling car-rental booking…",
    ALTEA_GENERATE_DOCUMENT: "Generating SKANDI document…",
    ALTEA_SEND_MANIFEST: "Generating operations manifest…"
  };

  return messages[type] || "";
}

function isProviderAction(type) {
  return type.startsWith("DUFFEL_");
}

async function dispatchAction(type, payload = {}) {
  const result = await handleReservationsAction({
    type,
    payload
  });

  return {
    responseType: String(result?.responseType || ""),
    payload:
      result?.payload && typeof result.payload === "object"
        ? result.payload
        : {}
  };
}

$w.onReady(() => {
  const embed = $w(EMBED_ID);

  // Listener must be registered before the parent-ready handshake.
  embed.onMessage(async (event) => {
    const input = parse(event?.data);

    if (!input || input.source !== CHILD_SOURCE) {
      return;
    }

    const type = cleanActionType(input.type);
    const payload =
      input.payload && typeof input.payload === "object"
        ? input.payload
        : {};
    const requestId = cleanRequestId(input.requestId);

    if (!type) {
      return;
    }

    if (type === "MASTER_NAVIGATE") {
      const path = String(payload?.path || input?.path || "").trim();
      if (path.startsWith("/") && !path.startsWith("//")) {
        wixLocation.to(path);
      }
      return;
    }

    const progress = progressFor(type);
    if (progress) {
      postToEmbed(
        embed,
        "DUFFEL_PROGRESS",
        { message: progress },
        requestId
      );
    }

    try {
      const result = await dispatchAction(type, payload);

      if (!result.responseType) {
        throw Object.assign(
          new Error("ALTEA_EMPTY_RESPONSE_TYPE"),
          {
            code: "ALTEA_EMPTY_RESPONSE_TYPE",
            publicMessage: "The reservation backend returned an incomplete response."
          }
        );
      }

      postToEmbed(
        embed,
        result.responseType,
        result.payload,
        requestId
      );
    } catch (error) {
      const code = errorCode(error);
      const providerAction = isProviderAction(type);

      console.error("[ALTEA B-007.1]", {
        type,
        code,
        message: String(error?.message || "")
      });

      postToEmbed(
        embed,
        providerAction ? "DUFFEL_ERROR" : "ALTEA_ERROR",
        {
          code,
          action: type,
          message: publicMessage(
            error,
            providerAction
              ? `Supplier action ${type} failed (${code}).`
              : `ALTEA action ${type} failed (${code}).`
          )
        },
        requestId
      );

      if (code === "AUTH_REQUIRED") {
        wixLocation.to(STAFF_LOGIN_PATH);
      }
    }
  });

  // Parent handshake only after the listener exists.
  postToEmbed(embed, "DUFFEL_PARENT_READY", {
    embedId: EMBED_ID,
    version: VERSION,
    unified: true,
    wixBoundaryFix: true,
    oneBackendDependency: true,
    providerWebMethodsPageBound: false,
    providerInternalized: true,
    inventoryControl: true,
    enterprise: true,
    transferDcs: true,
    skandiClub: true,
    documents: true,
    platformAssetDocuments: true
  });
});
