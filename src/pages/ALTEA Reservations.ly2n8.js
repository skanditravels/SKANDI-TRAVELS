// /src/pages/ALTEA Reservations.<WIX_PAGE_ID>.js
// SKANDI Recovery R-005.4.2 — ALTEA Reservations document visibility hotfix.
//
// IMPORTANT:
// Retain the existing Wix-generated page filename/internal page ID.
// Replace the COMPLETE contents with this file.
//
// Architecture for R-005.4.2:
// - SKANDI-owned ALTEA logic remains in one canonical reservations.web facade.
// - R-005.4 generated HTML is uploaded/finalized through the private Asset Library here.
// - Broken Duffel provider exports are guarded so internal ALTEA remains usable.
// - R-006 still owns Duffel provider consolidation.
//
// HTML Embed: #alteaReservationsEmbed


import wixLocation from "wix-location-frontend";


import {
  handleReservationsAction
} from "backend/SKANDI_CORE/reservations.web";


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
} from "backend/duffelTravel.web";


import {
  searchDuffelOrderChanges,
  createDuffelPendingOrderChange,
  getDuffelPendingOrderChange,
  prepareDuffelOrderChangePayment,
  confirmDuffelOrderChange
} from "backend/RIA/duffelServicing.web";


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
} from "backend/RIA/duffelGroundProducts.web";


const EMBED_ID = "#alteaReservationsEmbed";
const STAFF_LOGIN_PATH = "/riaintra";
const CHILD_SOURCE = "SKANDI_DUFFEL_RESERVATIONS";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";
const VERSION = "R-005.4.2";


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


  // Wix can replace backend messages with a generic platform string.
  // Do not echo a misleading generic message when we have a stable action code.
  if (!text || /unable to handle the request/i.test(text)) {
    return fallback;
  }


  return text.slice(0, 600);
}


function progressFor(type) {
  const messages = {
    DUFFEL_SEARCH_OFFERS: "Searching live airline offers…",
    DUFFEL_REFRESH_OFFER: "Refreshing price and availability…",
    DUFFEL_PREPARE_PAYMENT: "Preparing secure payment…",
    DUFFEL_GET_ORDER: "Retrieving supplier order…",
    DUFFEL_CREATE_ORDER: "Creating supplier order…",
    DUFFEL_CREATE_CANCELLATION: "Calculating cancellation terms…",
    DUFFEL_CONFIRM_CANCELLATION: "Confirming cancellation…",
    DUFFEL_SEARCH_ORDER_CHANGES: "Searching airline change options…",
    DUFFEL_CREATE_ORDER_CHANGE: "Creating pending airline change…",
    DUFFEL_PREPARE_CHANGE_PAYMENT: "Preparing secure change payment…",
    DUFFEL_CONFIRM_ORDER_CHANGE: "Confirming supplier order change…",
    DUFFEL_SEARCH_STAYS: "Searching live hotel stays…",
    DUFFEL_FETCH_STAY_RATES: "Loading live room rates…",
    DUFFEL_QUOTE_STAY: "Confirming hotel price and availability…",
    DUFFEL_CREATE_STAY_BOOKING: "Creating hotel booking…",
    DUFFEL_CANCEL_STAY_BOOKING: "Cancelling hotel booking…",
    DUFFEL_SEARCH_CARS: "Searching live car rentals…",
    DUFFEL_QUOTE_CAR: "Confirming car price and availability…",
    DUFFEL_PREPARE_CAR_CARD: "Preparing secure supplier card entry…",
    DUFFEL_CREATE_CAR_BOOKING: "Creating car-rental booking…",
    DUFFEL_CANCEL_CAR_BOOKING: "Cancelling car-rental booking…",
    ALTEA_GENERATE_DOCUMENT: "Generating SKANDI document…",
    ALTEA_SEND_MANIFEST: "Generating operations manifest…"
  };
  return messages[type] || "";
}


async function runCore(type, payload = {}) {
  const result = await handleReservationsAction({ type, payload });
  return {
    responseType: result?.responseType || "",
    payload: result?.payload || {}
  };
}


async function uploadGeneratedAsset(assetUpload = {}) {
  const upload = assetUpload?.upload || {};
  const signedUrl = String(upload?.signedUrl || "").trim();
  const body = assetUpload?.content;

  if (!assetUpload?.requestId || !signedUrl || typeof body !== "string") {
    throw new Error("GENERATED_ASSET_UPLOAD_CONTRACT_INVALID");
  }

  if (typeof globalThis.fetch !== "function") {
    throw new Error("BROWSER_FETCH_UNAVAILABLE");
  }

  const response = await globalThis.fetch(signedUrl, {
    method: String(upload?.method || "PUT").toUpperCase(),
    headers: {
      "Content-Type": String(assetUpload?.mimeType || upload?.contentType || "text/html"),
      "cache-control": String(upload?.cacheControl || "3600"),
      "x-upsert": "false"
    },
    body
  });

  if (!response.ok) {
    const error = new Error(`GENERATED_ASSET_UPLOAD_HTTP_${response.status}`);
    error.code = `GENERATED_ASSET_UPLOAD_HTTP_${response.status}`;
    throw error;
  }

  return true;
}

async function finalizeGeneratedAssetAfterResponse(embed, type, inputPayload = {}, result = {}, requestId = "") {
  const payload = result?.payload || {};
  const assetUpload = payload?.assetUpload;

  if (!assetUpload?.requestId) {
    return;
  }

  try {
    await uploadGeneratedAsset(assetUpload);

    const finalized = await runCore("ALTEA_FINALIZE_GENERATED_ASSET", {
      requestId: assetUpload.requestId,
      bookingId: inputPayload?.bookingId || payload?.document?.bookingId || "",
      documentId: assetUpload.documentId || payload?.document?.id || "",
      manifestId: assetUpload.manifestId || payload?.manifest?.id || ""
    });

    const finalWorkspace =
      finalized?.payload?.workspace ||
      payload?.workspace ||
      null;

    if (finalWorkspace) {
      postToEmbed(
        embed,
        "ALTEA_BOOKING_RESULT",
        { workspace: finalWorkspace },
        ""
      );
    }

    postToEmbed(
      embed,
      "ALTEA_GENERATED_ASSET_FINALIZED",
      finalized?.payload || {},
      requestId
    );
  } catch (error) {
    const code = errorCode(error);

    console.error("[ALTEA R-005.4.2] Generated document asset finalization failed after document creation.", {
      type,
      code,
      message: String(error?.message || ""),
      error
    });

    postToEmbed(
      embed,
      "ALTEA_ASSET_WARNING",
      {
        code,
        action: type,
        message: "Document created in ALTEA, but private file storage could not be finalized."
      },
      requestId
    );
  }
}

function providerCallable(action) {
  return Boolean(action && typeof action.run === "function");
}


async function syncSupplierOrder(order, bookingInput = {}, eventType = "DUFFEL_ORDER_SYNCED") {
  if (!order?.id) return null;


  const sync = await runCore("ALTEA_SYNC_DUFFEL_ORDER", {
    order,
    bookingInput,
    eventType
  });


  return sync?.payload?.workspace || null;
}


async function createAndSyncOrder(input = {}) {
  const result = await createDuffelOrder(input);
  const alteaWorkspace = await syncSupplierOrder(
    result?.order,
    input,
    result?.recoveredExistingOrder
      ? "DUFFEL_ORDER_RECOVERED"
      : "DUFFEL_ORDER_CREATED"
  );


  return {
    ...result,
    alteaWorkspace
  };
}


async function retrieveAndSyncOrder(input = {}) {
  const result = await getDuffelOrder(input);
  let alteaWorkspace = null;


  try {
    alteaWorkspace = await syncSupplierOrder(
      result?.order,
      {},
      "DUFFEL_ORDER_RETRIEVED"
    );
  } catch (error) {
    console.warn(
      "[ALTEA R-005.4.2] Supplier order retrieved, but internal ALTEA sync refresh failed.",
      error
    );
  }


  return {
    ...result,
    alteaWorkspace
  };
}


async function cancelAndSyncOrder(input = {}) {
  const result = await confirmDuffelOrderCancellation(input);
  let alteaWorkspace = null;


  try {
    alteaWorkspace = await syncSupplierOrder(
      result?.order,
      {},
      "DUFFEL_ORDER_CANCELLED"
    );
  } catch (error) {
    console.warn(
      "[ALTEA R-005.4.2] Cancellation confirmed, but internal ALTEA sync refresh failed.",
      error
    );
  }


  return {
    ...result,
    alteaWorkspace
  };
}


async function confirmChangeAndSyncOrder(input = {}) {
  const result = await confirmDuffelOrderChange(input);


  const latest = await getDuffelOrder({
    orderIdOrReference: result?.orderId
  });


  let alteaWorkspace = null;


  try {
    alteaWorkspace = await syncSupplierOrder(
      latest?.order,
      {},
      "DUFFEL_ORDER_CHANGED"
    );
  } catch (error) {
    console.warn(
      "[ALTEA R-005.4.2] Order change confirmed, but internal ALTEA sync refresh failed.",
      error
    );
  }


  return {
    ...result,
    order: latest?.order || result?.order || null,
    alteaWorkspace
  };
}


const DUFFEL_ACTIONS = Object.freeze({
  DUFFEL_APP_READY: {
    responseType: "DUFFEL_BOOTSTRAP_RESULT",
    run: () => getDuffelWorkspaceBootstrap()
  },
  DUFFEL_SEARCH_OFFERS: {
    responseType: "DUFFEL_OFFERS_RESULT",
    run: searchDuffelOffers
  },
  DUFFEL_REFRESH_OFFER: {
    responseType: "DUFFEL_OFFER_RESULT",
    run: refreshDuffelOffer
  },
  DUFFEL_GET_SEAT_MAPS: {
    responseType: "DUFFEL_SEAT_MAPS_RESULT",
    run: getDuffelSeatMaps
  },
  DUFFEL_PREPARE_PAYMENT: {
    responseType: "DUFFEL_PAYMENT_RESULT",
    run: prepareDuffelPayment
  },
  DUFFEL_LIST_ORDERS: {
    responseType: "DUFFEL_ORDERS_RESULT",
    run: listDuffelOrders
  },
  DUFFEL_GET_ORDER: {
    responseType: "DUFFEL_ORDER_RESULT",
    run: retrieveAndSyncOrder
  },
  DUFFEL_CREATE_ORDER: {
    responseType: "DUFFEL_ORDER_CREATED",
    run: createAndSyncOrder
  },
  DUFFEL_CREATE_CANCELLATION: {
    responseType: "DUFFEL_CANCELLATION_QUOTED",
    run: createDuffelOrderCancellation
  },
  DUFFEL_CONFIRM_CANCELLATION: {
    responseType: "DUFFEL_CANCELLATION_CONFIRMED",
    run: cancelAndSyncOrder
  },


  DUFFEL_SEARCH_ORDER_CHANGES: {
    responseType: "DUFFEL_ORDER_CHANGE_OFFERS",
    run: searchDuffelOrderChanges
  },
  DUFFEL_CREATE_ORDER_CHANGE: {
    responseType: "DUFFEL_ORDER_CHANGE_PENDING",
    run: createDuffelPendingOrderChange
  },
  DUFFEL_GET_ORDER_CHANGE: {
    responseType: "DUFFEL_ORDER_CHANGE_PENDING",
    run: getDuffelPendingOrderChange
  },
  DUFFEL_PREPARE_CHANGE_PAYMENT: {
    responseType: "DUFFEL_CHANGE_PAYMENT_RESULT",
    run: prepareDuffelOrderChangePayment
  },
  DUFFEL_CONFIRM_ORDER_CHANGE: {
    responseType: "DUFFEL_ORDER_CHANGE_CONFIRMED",
    run: confirmChangeAndSyncOrder
  },


  DUFFEL_SEARCH_STAYS: {
    responseType: "DUFFEL_STAYS_RESULT",
    run: searchDuffelStays
  },
  DUFFEL_FETCH_STAY_RATES: {
    responseType: "DUFFEL_STAY_RATES_RESULT",
    run: fetchDuffelStayRates
  },
  DUFFEL_QUOTE_STAY: {
    responseType: "DUFFEL_STAY_QUOTE_RESULT",
    run: quoteDuffelStay
  },
  DUFFEL_CREATE_STAY_BOOKING: {
    responseType: "DUFFEL_STAY_BOOKING_RESULT",
    run: createDuffelStayBookingStaff
  },
  DUFFEL_GET_STAY_BOOKING: {
    responseType: "DUFFEL_STAY_BOOKING_RESULT",
    run: getDuffelStayBookingStaff
  },
  DUFFEL_CANCEL_STAY_BOOKING: {
    responseType: "DUFFEL_STAY_CANCEL_RESULT",
    run: cancelDuffelStayBookingStaff
  },


  DUFFEL_SEARCH_CARS: {
    responseType: "DUFFEL_CARS_RESULT",
    run: searchDuffelCars
  },
  DUFFEL_QUOTE_CAR: {
    responseType: "DUFFEL_CAR_QUOTE_RESULT",
    run: quoteDuffelCar
  },
  DUFFEL_PREPARE_CAR_CARD: {
    responseType: "DUFFEL_CAR_CARD_READY",
    run: createDuffelComponentClientKeyStaff
  },
  DUFFEL_CREATE_CAR_BOOKING: {
    responseType: "DUFFEL_CAR_BOOKING_RESULT",
    run: createDuffelCarBookingStaff
  },
  DUFFEL_GET_CAR_BOOKING: {
    responseType: "DUFFEL_CAR_BOOKING_RESULT",
    run: getDuffelCarBookingStaff
  },
  DUFFEL_CANCEL_CAR_BOOKING: {
    responseType: "DUFFEL_CAR_CANCEL_RESULT",
    run: cancelDuffelCarBookingStaff
  }
});


function isCoreAction(type) {
  return (
    type.startsWith("ALTEA_") ||
    type.startsWith("INVENTORY_")
  );
}


$w.onReady(() => {
  const embed = $w(EMBED_ID);


  // Listener FIRST. This is the proven SKANDI/Wix embed bootstrap rule.
  embed.onMessage(async (event) => {
    const input = parse(event?.data);


    if (!input || input.source !== CHILD_SOURCE) {
      return;
    }


    const type = String(input.type || "").toUpperCase();
    const payload =
      input.payload && typeof input.payload === "object"
        ? input.payload
        : {};
    const requestId = cleanRequestId(input.requestId);


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
      const providerAction = DUFFEL_ACTIONS[type];

      // R-005.4.1 isolates the known revision-906 Duffel export mismatch.
      // Internal ALTEA must not fail because a supplier provider method is
      // currently unresolved in Wix runtime.
      if (type === "DUFFEL_APP_READY") {
        if (!providerCallable(providerAction)) {
          postToEmbed(
            embed,
            "DUFFEL_ERROR",
            {
              code: "DUFFEL_PROVIDER_DEGRADED",
              action: type,
              message: "Supplier services are temporarily unavailable. Internal ALTEA remains available."
            },
            requestId
          );
          return;
        }
      }

      if (providerAction) {
        if (!providerCallable(providerAction)) {
          postToEmbed(
            embed,
            "DUFFEL_ERROR",
            {
              code: "DUFFEL_PROVIDER_METHOD_UNAVAILABLE",
              action: type,
              message: "This supplier action is temporarily unavailable. Internal ALTEA remains available."
            },
            requestId
          );
          return;
        }

        const result = await providerAction.run(payload);
        postToEmbed(
          embed,
          providerAction.responseType,
          result || {},
          requestId
        );
        return;
      }


      if (isCoreAction(type)) {
        const result = await runCore(type, payload);

        if (result.responseType) {
          postToEmbed(
            embed,
            result.responseType,
            result.payload,
            requestId
          );
        }

        if (type === "ALTEA_GENERATE_DOCUMENT" || type === "ALTEA_DCS_RECORD_DOCUMENT" ||
            type === "ALTEA_TRANSFER_DCS_RECORD_DOCUMENT" || type === "ALTEA_SEND_MANIFEST") {
          await finalizeGeneratedAssetAfterResponse(
            embed,
            type,
            payload,
            result,
            requestId
          );
        }

        return;
      }


      console.warn(
        "[ALTEA R-005.4.2] Ignored unsupported embed action:",
        type
      );
    } catch (error) {
      const code = errorCode(error);
      const isProvider = type.startsWith("DUFFEL_");


      console.error("[ALTEA R-005.4.2]", {
        type,
        code,
        message: String(error?.message || ""),
        error
      });


      postToEmbed(
        embed,
        isProvider ? "DUFFEL_ERROR" : "ALTEA_ERROR",
        {
          code,
          action: type,
          message: publicMessage(
            error,
            isProvider
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
    documentBridgeHotfix: true,
    documentVisibilityFirst: true,
    generatedAssetAutoFinalize: true,
    providerWebMethodsPageBound: true,
    providerInternalizationTarget: "R-006",
    inventoryControl: true,
    enterprise: true,
    transferDcs: true,
    skandiClub: true,
    documents: true,
    platformAssetDocuments: true
  });
});
