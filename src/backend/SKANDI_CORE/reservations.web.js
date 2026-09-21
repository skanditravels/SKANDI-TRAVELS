// /src/backend/SKANDI_CORE/reservations.web.js
// SKANDI ALTEA Reservations — canonical SKANDI-owned web-method facade.
// SKANDI Backend Base 1.0 — B-007.6 shape-safe action dispatch hardening.
//
// IMPORTANT WIX BOUNDARY:
// This module imports reusable backend .js cores only. The Reservations page
// must not import Duffel provider .web modules directly.
//
// B-007.6 CONTRACT RULE:
// Action entries may be represented as [responseType, handler] or as a
// transitional object shape. Dispatch must resolve and validate the handler
// before invoking it. Never call action[1] blindly.

import { webMethod, Permissions } from "@wix/web-methods";

import {
  RESERVATIONS_CORE_VERSION,
  requireReservationsAccessCore,
  getAlteaUnifiedBootstrapCore,
  searchAlteaBookingsCore,
  getAlteaBookingWorkspaceCore,
  createAlteaLocalBookingCore,
  updateAlteaBookingCore,
  updateAlteaPassengerCore,
  createAlteaPassengerCore,
  addAlteaHistoryNoteCore,
  updateAlteaDocumentStatusCore,
  updateAlteaBookingComponentCore,
  syncDuffelOrderToAlteaCore,
  syncDuffelGroundBookingToAlteaCore,
  searchReservationInventoryCore,
  addReservationInventoryComponentCore,
  releaseReservationInventoryComponentCore,
  getReservationInventoryStatusCore,
  resolveReservationDestinationCore,
  searchSkandiClubMembersCore,
  getCustomerProfileCore,
  linkSkandiClubMemberCore,
  adjustSkandiClubPointsCore,
  checkAlteaTravelRequirementsCore,
  generateAlteaBookingDocumentCore,
  previewAlteaBookingConfirmationCore,
  getAlteaDocumentCore,
  finalizeGeneratedReservationsAssetCore,
  requestAlteaDocumentDeliveryCore,
  updateAlteaDcsPassengerCore,
  getTransferDcsBootstrapCore,
  updateTransferDcsPassengerCore,
  updateTransferDcsDepartureCore,
  recordTransferDcsDocumentCore,
  sendAlteaManifestCore,
  enrichDuffelFlightPayloadCore
} from "backend/SKANDI_CORE/reservations";

import {
  getDuffelWorkspaceBootstrapCore,
  searchDuffelOffersCore,
  refreshDuffelOfferCore,
  getDuffelSeatMapsCore,
  prepareDuffelPaymentCore,
  listDuffelOrdersCore,
  getDuffelOrderCore,
  createDuffelOrderCore,
  createDuffelOrderCancellationCore,
  confirmDuffelOrderCancellationCore
} from "backend/SKANDI_CORE/duffelAir";

import {
  searchDuffelOrderChangesCore,
  createDuffelPendingOrderChangeCore,
  getDuffelPendingOrderChangeCore,
  prepareDuffelOrderChangePaymentCore,
  confirmDuffelOrderChangeCore
} from "backend/SKANDI_CORE/duffelServicing";

import {
  searchDuffelStaysCore,
  fetchDuffelStayRatesCore,
  quoteDuffelStayCore,
  createDuffelStayBookingCore,
  getDuffelStayBookingCore,
  cancelDuffelStayBookingCore,
  searchDuffelCarsCore,
  quoteDuffelCarCore,
  createDuffelCarBookingCore,
  getDuffelCarBookingCore,
  cancelDuffelCarBookingCore,
  createDuffelComponentClientKeyCore
} from "backend/SKANDI_CORE/duffelGround";

const VERSION = "BACKEND-BASE-1.0-B007.6";
const ACTION_CONTRACT_VERSION = "2";

function clean(value, max = 500) {
  return String(value ?? "").trim().slice(0, max);
}

function upper(value, max = 500) {
  return clean(value, max).toUpperCase();
}

function actionError(code, publicMessage = "") {
  const error = new Error(code);
  error.code = code;
  if (publicMessage) error.publicMessage = publicMessage;
  return error;
}

async function workspace(bookingId) {
  if (!bookingId) return null;
  try {
    return (await getAlteaBookingWorkspaceCore({ bookingId })).workspace || null;
  } catch (_) {
    return null;
  }
}

async function refreshResult(input = {}, result = {}) {
  const bookingId =
    input.bookingId ||
    result?.booking?.id ||
    result?.component?.booking_id ||
    result?.component?.bookingId ||
    result?.passenger?.booking_id ||
    result?.passenger?.bookingId ||
    null;

  return {
    ...result,
    workspace: await workspace(bookingId)
  };
}

async function unifiedBootstrap(input = {}) {
  const [base, inventory, dcs] = await Promise.all([
    getAlteaUnifiedBootstrapCore(input),
    searchReservationInventoryCore({
      query: "",
      serviceDate: input.serviceDate || ""
    }),
    getTransferDcsBootstrapCore({})
  ]);

  return {
    ...(base || {}),
    inventory: inventory?.items || [],
    transferDepartures: dcs?.departures || [],
    transferDcsPersistence: true,
    capabilities: {
      ...(base?.capabilities || {}),
      wixBoundaryVersion: VERSION,
      actionContractVersion: ACTION_CONTRACT_VERSION,
      shapeSafeActionDispatch: true,
      skandiOwnedFacade: true,
      providerWebMethodsPageBound: false,
      providerInternalized: true,
      inventoryControl: true,
      atomicInventory: true,
      transferDcs: true,
      transferDcsPersistence: true,
      skandiClub: true,
      documents: true,
      platformAssetDocuments: true,
      packageBuilder: true
    }
  };
}

async function updatePassengerAndRefresh(input = {}) {
  return refreshResult(input, await updateAlteaPassengerCore(input));
}

async function addHistoryAndRefresh(input = {}) {
  return refreshResult(input, await addAlteaHistoryNoteCore(input));
}

async function updateDocumentAndRefresh(input = {}) {
  return refreshResult(input, await updateAlteaDocumentStatusCore(input));
}

async function createPassengerAndRefresh(input = {}) {
  return refreshResult(input, await createAlteaPassengerCore(input));
}

async function updateComponentAndRefresh(input = {}) {
  if (upper(input.status || input.patch?.status) === "REMOVED") {
    return refreshResult(
      input,
      await releaseReservationInventoryComponentCore({
        componentId: input.componentId,
        bookingId: input.bookingId
      })
    );
  }
  return refreshResult(input, await updateAlteaBookingComponentCore(input));
}

async function addInventoryAndRefresh(input = {}) {
  return refreshResult(input, await addReservationInventoryComponentCore(input));
}

async function releaseInventoryAndRefresh(input = {}) {
  return refreshResult(input, await releaseReservationInventoryComponentCore(input));
}

async function updateBookingAndRefresh(input = {}) {
  return refreshResult(input, await updateAlteaBookingCore(input));
}

async function linkClubAndRefresh(input = {}) {
  return refreshResult(input, await linkSkandiClubMemberCore(input));
}

async function pointsAndRefresh(input = {}) {
  return refreshResult(input, await adjustSkandiClubPointsCore(input));
}

async function requirementsAndRefresh(input = {}) {
  return refreshResult(input, await checkAlteaTravelRequirementsCore(input));
}

async function documentAndRefresh(input = {}) {
  return refreshResult(input, await generateAlteaBookingDocumentCore(input));
}

async function dcsPassengerAndRefresh(input = {}) {
  return refreshResult(input, await updateAlteaDcsPassengerCore(input));
}

async function transferPassengerAndRefresh(input = {}) {
  const result = await updateTransferDcsPassengerCore(input);
  const [currentWorkspace, dcs] = await Promise.all([
    workspace(input.bookingId),
    getTransferDcsBootstrapCore({ bookingId: input.bookingId })
  ]);

  return {
    ...result,
    workspace: currentWorkspace,
    departures: dcs?.departures || []
  };
}

async function transferDepartureAndRefresh(input = {}) {
  const result = await updateTransferDcsDepartureCore(input);
  const [currentWorkspace, dcs] = await Promise.all([
    workspace(input.bookingId),
    getTransferDcsBootstrapCore({ bookingId: input.bookingId })
  ]);

  return {
    ...result,
    workspace: currentWorkspace,
    departures: dcs?.departures || []
  };
}

async function transferDocumentAndRefresh(input = {}) {
  return refreshResult(input, await recordTransferDcsDocumentCore(input));
}

async function syncSupplierOrder(order, bookingInput = {}, eventType = "DUFFEL_ORDER_SYNCED") {
  if (!order?.id) return null;
  const sync = await syncDuffelOrderToAlteaCore({ order, bookingInput, eventType });
  return sync?.workspace || null;
}

async function createAndSyncOrder(input = {}) {
  const providerResult = await createDuffelOrderCore(input);
  const result = await enrichDuffelFlightPayloadCore(providerResult);
  const alteaWorkspace = await syncSupplierOrder(
    result?.order,
    { ...input, offer: result?.offer || null },
    result?.recoveredExistingOrder ? "DUFFEL_ORDER_RECOVERED" : "DUFFEL_ORDER_CREATED"
  );
  return { ...result, alteaWorkspace };
}

async function retrieveAndSyncOrder(input = {}) {
  const result = await enrichDuffelFlightPayloadCore(await getDuffelOrderCore(input));
  let alteaWorkspace = null;
  try {
    alteaWorkspace = await syncSupplierOrder(result?.order, {}, "DUFFEL_ORDER_RETRIEVED");
  } catch (_) {}
  return { ...result, alteaWorkspace };
}

async function cancelAndSyncOrder(input = {}) {
  const result = await confirmDuffelOrderCancellationCore(input);
  let alteaWorkspace = null;
  try {
    alteaWorkspace = await syncSupplierOrder(result?.order, {}, "DUFFEL_ORDER_CANCELLED");
  } catch (_) {}
  return { ...result, alteaWorkspace };
}

async function confirmChangeAndSyncOrder(input = {}) {
  const result = await confirmDuffelOrderChangeCore(input);
  const latest = await getDuffelOrderCore({ orderIdOrReference: result?.orderId });
  let alteaWorkspace = null;
  try {
    alteaWorkspace = await syncSupplierOrder(latest?.order, {}, "DUFFEL_ORDER_CHANGED");
  } catch (_) {}
  return {
    ...result,
    order: latest?.order || result?.order || null,
    alteaWorkspace
  };
}

function providerBooking(result) {
  if (result?.booking?.id) return result.booking;
  if (result?.id) return result;
  return null;
}

function normalizedGroundResult(result) {
  if (result?.booking || result?.reconciliationRequired) return result || {};
  return result?.id ? { booking: result } : { ...(result || {}) };
}

async function syncGroundResult(input, result, componentType, eventType) {
  const out = normalizedGroundResult(result);
  const booking = providerBooking(out);
  const alteaBookingId = clean(input.alteaBookingId || input.bookingId, 80);
  if (!booking?.id || !alteaBookingId) return out;

  const synced = await syncDuffelGroundBookingToAlteaCore({
    alteaBookingId,
    componentType,
    providerBooking: booking,
    eventType
  });

  return {
    ...out,
    alteaWorkspace: synced?.workspace || null
  };
}

async function createStayAndSync(input = {}) {
  return syncGroundResult(
    input,
    await createDuffelStayBookingCore(input),
    "HOTEL",
    "DUFFEL_STAY_BOOKING_CREATED"
  );
}

async function getStayAndSync(input = {}) {
  return syncGroundResult(
    input,
    await getDuffelStayBookingCore(input),
    "HOTEL",
    "DUFFEL_STAY_BOOKING_RETRIEVED"
  );
}

async function cancelStayAndSync(input = {}) {
  return syncGroundResult(
    input,
    await cancelDuffelStayBookingCore(input),
    "HOTEL",
    "DUFFEL_STAY_BOOKING_CANCELLED"
  );
}

async function createCarAndSync(input = {}) {
  return syncGroundResult(
    input,
    await createDuffelCarBookingCore(input),
    "CAR_RENTAL",
    "DUFFEL_CAR_BOOKING_CREATED"
  );
}

async function getCarAndSync(input = {}) {
  return syncGroundResult(
    input,
    await getDuffelCarBookingCore(input),
    "CAR_RENTAL",
    "DUFFEL_CAR_BOOKING_RETRIEVED"
  );
}

async function cancelCarAndSync(input = {}) {
  return syncGroundResult(
    input,
    await cancelDuffelCarBookingCore(input),
    "CAR_RENTAL",
    "DUFFEL_CAR_BOOKING_CANCELLED"
  );
}

async function searchOffersWithReference(input = {}) {
  return enrichDuffelFlightPayloadCore(await searchDuffelOffersCore(input));
}

async function refreshOfferWithReference(input = {}) {
  return enrichDuffelFlightPayloadCore(await refreshDuffelOfferCore(input));
}

async function searchResolvedStays(input = {}) {
  if (
    input?.location?.latitude !== undefined ||
    input?.latitude !== undefined ||
    input?.accommodationId ||
    Array.isArray(input?.accommodationIds)
  ) {
    return searchDuffelStaysCore(input);
  }

  const resolved = await resolveReservationDestinationCore(input);
  return searchDuffelStaysCore({ ...input, location: resolved.location });
}

const ACTIONS = Object.freeze({
  DUFFEL_APP_READY: ["DUFFEL_BOOTSTRAP_RESULT", getDuffelWorkspaceBootstrapCore],
  DUFFEL_SEARCH_OFFERS: ["DUFFEL_OFFERS_RESULT", searchOffersWithReference],
  DUFFEL_REFRESH_OFFER: ["DUFFEL_OFFER_RESULT", refreshOfferWithReference],
  DUFFEL_GET_SEAT_MAPS: ["DUFFEL_SEAT_MAPS_RESULT", getDuffelSeatMapsCore],
  DUFFEL_PREPARE_PAYMENT: ["DUFFEL_PAYMENT_RESULT", prepareDuffelPaymentCore],
  DUFFEL_LIST_ORDERS: ["DUFFEL_ORDERS_RESULT", listDuffelOrdersCore],
  DUFFEL_GET_ORDER: ["DUFFEL_ORDER_RESULT", retrieveAndSyncOrder],
  DUFFEL_CREATE_ORDER: ["DUFFEL_ORDER_CREATED", createAndSyncOrder],
  DUFFEL_CREATE_CANCELLATION: ["DUFFEL_CANCELLATION_QUOTED", createDuffelOrderCancellationCore],
  DUFFEL_CONFIRM_CANCELLATION: ["DUFFEL_CANCELLATION_CONFIRMED", cancelAndSyncOrder],

  DUFFEL_SEARCH_ORDER_CHANGES: ["DUFFEL_ORDER_CHANGE_OFFERS", searchDuffelOrderChangesCore],
  DUFFEL_CREATE_ORDER_CHANGE: ["DUFFEL_ORDER_CHANGE_PENDING", createDuffelPendingOrderChangeCore],
  DUFFEL_GET_ORDER_CHANGE: ["DUFFEL_ORDER_CHANGE_PENDING", getDuffelPendingOrderChangeCore],
  DUFFEL_PREPARE_CHANGE_PAYMENT: ["DUFFEL_CHANGE_PAYMENT_RESULT", prepareDuffelOrderChangePaymentCore],
  DUFFEL_CONFIRM_ORDER_CHANGE: ["DUFFEL_ORDER_CHANGE_CONFIRMED", confirmChangeAndSyncOrder],

  DUFFEL_SEARCH_STAYS: ["DUFFEL_STAYS_RESULT", searchResolvedStays],
  DUFFEL_FETCH_STAY_RATES: ["DUFFEL_STAY_RATES_RESULT", fetchDuffelStayRatesCore],
  DUFFEL_QUOTE_STAY: ["DUFFEL_STAY_QUOTE_RESULT", quoteDuffelStayCore],
  DUFFEL_CREATE_STAY_BOOKING: ["DUFFEL_STAY_BOOKING_RESULT", createStayAndSync],
  DUFFEL_GET_STAY_BOOKING: ["DUFFEL_STAY_BOOKING_RESULT", getStayAndSync],
  DUFFEL_CANCEL_STAY_BOOKING: ["DUFFEL_STAY_CANCEL_RESULT", cancelStayAndSync],

  DUFFEL_SEARCH_CARS: ["DUFFEL_CARS_RESULT", searchDuffelCarsCore],
  DUFFEL_QUOTE_CAR: ["DUFFEL_CAR_QUOTE_RESULT", quoteDuffelCarCore],
  DUFFEL_PREPARE_CAR_CARD: ["DUFFEL_CAR_CARD_READY", createDuffelComponentClientKeyCore],
  DUFFEL_CREATE_CAR_BOOKING: ["DUFFEL_CAR_BOOKING_RESULT", createCarAndSync],
  DUFFEL_GET_CAR_BOOKING: ["DUFFEL_CAR_BOOKING_RESULT", getCarAndSync],
  DUFFEL_CANCEL_CAR_BOOKING: ["DUFFEL_CAR_CANCEL_RESULT", cancelCarAndSync],

  ALTEA_UNIFIED_BOOTSTRAP: ["ALTEA_UNIFIED_BOOTSTRAP_RESULT", unifiedBootstrap],
  ALTEA_SEARCH_BOOKINGS: ["ALTEA_BOOKINGS_RESULT", searchAlteaBookingsCore],
  ALTEA_GET_BOOKING: ["ALTEA_BOOKING_RESULT", getAlteaBookingWorkspaceCore],
  ALTEA_UPDATE_PASSENGER: ["ALTEA_PASSENGER_UPDATED", updatePassengerAndRefresh],
  ALTEA_ADD_HISTORY_NOTE: ["ALTEA_HISTORY_UPDATED", addHistoryAndRefresh],
  ALTEA_UPDATE_DOCUMENT_STATUS: ["ALTEA_DOCUMENT_UPDATED", updateDocumentAndRefresh],
  ALTEA_CREATE_LOCAL_BOOKING: ["ALTEA_LOCAL_BOOKING_CREATED", createAlteaLocalBookingCore],
  ALTEA_UPDATE_COMPONENT: ["ALTEA_COMPONENT_UPDATED", updateComponentAndRefresh],
  ALTEA_CREATE_PASSENGER: ["ALTEA_PASSENGER_CREATED", createPassengerAndRefresh],
  ALTEA_UPDATE_BOOKING: ["ALTEA_BOOKING_UPDATED", updateBookingAndRefresh],

  ALTEA_SYNC_DUFFEL_ORDER: ["ALTEA_DUFFEL_SYNC_RESULT", syncDuffelOrderToAlteaCore],

  INVENTORY_SEARCH_SELLABLE: ["INVENTORY_SEARCH_RESULT", searchReservationInventoryCore],
  INVENTORY_ADD_COMPONENT: ["INVENTORY_COMPONENT_ADDED", addInventoryAndRefresh],
  INVENTORY_RELEASE_COMPONENT: ["INVENTORY_COMPONENT_RELEASED", releaseInventoryAndRefresh],
  INVENTORY_BOOKING_STATUS: ["INVENTORY_BOOKING_STATUS_RESULT", getReservationInventoryStatusCore],
  ALTEA_ADD_INVENTORY_COMPONENT: ["ALTEA_COMPONENT_UPDATED", addInventoryAndRefresh],

  ALTEA_CLUB_SEARCH: ["ALTEA_CLUB_SEARCH_RESULT", searchSkandiClubMembersCore],
  ALTEA_CUSTOMER_PROFILE_GET: ["ALTEA_CUSTOMER_PROFILE_RESULT", getCustomerProfileCore],
  ALTEA_CLUB_LINK_MEMBER: ["ALTEA_CLUB_MEMBER_LINKED", linkClubAndRefresh],
  ALTEA_CLUB_ADJUST_POINTS: ["ALTEA_CLUB_MEMBER_UPDATED", pointsAndRefresh],
  ALTEA_TRAVEL_REQUIREMENTS_CHECK: ["ALTEA_TRAVEL_REQUIREMENTS_RESULT", requirementsAndRefresh],

  ALTEA_GENERATE_DOCUMENT: ["ALTEA_DOCUMENT_GENERATED", documentAndRefresh],
  ALTEA_PREVIEW_BOOKING_CONFIRMATION: [
    "ALTEA_BOOKING_CONFIRMATION_PREVIEW",
    previewAlteaBookingConfirmationCore
  ],
  ALTEA_GET_DOCUMENT: ["ALTEA_DOCUMENT_RESULT", getAlteaDocumentCore],
  ALTEA_SEND_DOCUMENT: ["ALTEA_DOCUMENT_SENT", requestAlteaDocumentDeliveryCore],
  ALTEA_FINALIZE_GENERATED_ASSET: [
    "ALTEA_GENERATED_ASSET_FINALIZED",
    finalizeGeneratedReservationsAssetCore
  ],

  ALTEA_DCS_UPDATE_PASSENGER: ["ALTEA_DCS_PASSENGER_UPDATED", dcsPassengerAndRefresh],
  ALTEA_DCS_RECORD_DOCUMENT: ["ALTEA_DCS_DOCUMENT_RECORDED", documentAndRefresh],

  ALTEA_TRANSFER_DCS_BOOTSTRAP: [
    "ALTEA_TRANSFER_DCS_BOOTSTRAP_RESULT",
    getTransferDcsBootstrapCore
  ],
  ALTEA_TRANSFER_DCS_UPDATE_PASSENGER: [
    "ALTEA_TRANSFER_DCS_PASSENGER_UPDATED",
    transferPassengerAndRefresh
  ],
  ALTEA_TRANSFER_DCS_UPDATE_DEPARTURE: [
    "ALTEA_TRANSFER_DCS_DEPARTURE_UPDATED",
    transferDepartureAndRefresh
  ],
  ALTEA_TRANSFER_DCS_RECORD_DOCUMENT: [
    "ALTEA_DCS_DOCUMENT_RECORDED",
    transferDocumentAndRefresh
  ],

  ALTEA_SEND_MANIFEST: ["ALTEA_MANIFEST_SENT", sendAlteaManifestCore]
});

function resolveActionEntry(type, entry) {
  if (!entry) {
    throw actionError(
      "ALTEA_ACTION_NOT_SUPPORTED",
      "This ALTEA action is not supported by the current backend generation."
    );
  }

  let responseType = "";
  let handler = null;

  if (Array.isArray(entry)) {
    responseType = clean(entry[0], 100);
    handler = entry[1];
  } else if (entry && typeof entry === "object") {
    responseType = clean(entry.responseType || entry.resultType, 100);
    handler = entry.handler || entry.run;
  }

  if (!responseType) {
    throw actionError(
      "ALTEA_ACTION_CONTRACT_INVALID",
      `The ${type || "Reservations"} action does not define a valid response contract.`
    );
  }

  if (typeof handler !== "function") {
    throw actionError(
      "ALTEA_ACTION_HANDLER_INVALID",
      `The ${type || "Reservations"} action is not connected to a callable backend handler.`
    );
  }

  return { responseType, handler };
}

function actionRegistryDiagnostics() {
  const invalidActions = [];

  for (const [type, entry] of Object.entries(ACTIONS)) {
    try {
      resolveActionEntry(type, entry);
    } catch (error) {
      invalidActions.push({
        type,
        code: clean(error?.code || "ALTEA_ACTION_CONTRACT_INVALID", 80)
      });
    }
  }

  return {
    actionCount: Object.keys(ACTIONS).length,
    invalidActionCount: invalidActions.length,
    invalidActions
  };
}

function errorCode(error) {
  const raw = upper(error?.code || error?.message || "ALTEA_ACTION_FAILED", 120);
  return raw.match(/[A-Z][A-Z0-9_]{2,80}/)?.[0] || "ALTEA_ACTION_FAILED";
}

function safeErrorMessage(error, code) {
  const explicit = clean(error?.publicMessage || "", 500);
  if (explicit) return explicit;

  const known = {
    AUTH_REQUIRED: "Your ALTEA staff session has expired. Sign in again.",
    BOOKING_REQUIRED: "Open a booking before running this action.",
    BOOKING_NOT_FOUND: "The booking could not be found.",
    PASSENGER_REQUIRED: "Select a passenger before generating this document.",
    SKANDI_TRANSFER_AUTHORITY_REQUIRED:
      "A live SKANDI transfer component is required before a transfer document can be generated.",
    SKANDI_DCS_AUTHORITY_REQUIRED: "This document requires SKANDI DCS authority.",
    BAGGAGE_LICENSE_PLATE_10_DIGITS_REQUIRED:
      "A valid 10-digit baggage license plate is required.",
    ALTEA_ACTION_NOT_SUPPORTED:
      "This ALTEA action is not supported by the current backend generation.",
    ALTEA_ACTION_CONTRACT_INVALID:
      "The Reservations action contract is invalid. No backend action was executed.",
    ALTEA_ACTION_HANDLER_INVALID:
      "The Reservations action is not connected to a callable backend handler."
  };

  return known[code] || `ALTEA action failed (${code}).`;
}

async function dispatch(input = {}) {
  const type = upper(input.type, 100);
  const payload = input.payload && typeof input.payload === "object" ? input.payload : {};

  try {
    await requireReservationsAccessCore();

    if (type === "ALTEA_ENTERPRISE_MODULE_READY") {
      const diagnostics = actionRegistryDiagnostics();
      return {
        responseType: "ALTEA_ENTERPRISE_MODULE_ACK",
        payload: {
          version: VERSION,
          reservationsCoreVersion: RESERVATIONS_CORE_VERSION,
          actionContractVersion: ACTION_CONTRACT_VERSION,
          actionCount: diagnostics.actionCount,
          invalidActionCount: diagnostics.invalidActionCount,
          invalidActions: diagnostics.invalidActions,
          capabilities: Object.keys(ACTIONS)
        }
      };
    }

    const { responseType, handler } = resolveActionEntry(type, ACTIONS[type]);
    const result = await handler(payload);

    return {
      responseType,
      payload: result || {}
    };
  } catch (error) {
    const code = errorCode(error);
    console.error(
      "[ALTEA B-007.6 ACTION]",
      JSON.stringify({
        type,
        code,
        message: clean(error?.message, 500)
      })
    );

    return {
      responseType: type.startsWith("DUFFEL_") ? "DUFFEL_ERROR" : "ALTEA_ERROR",
      payload: {
        ok: false,
        action: type,
        code,
        message: safeErrorMessage(error, code)
      }
    };
  }
}

export const handleReservationsAction = webMethod(
  Permissions.SiteMember,
  dispatch
);
