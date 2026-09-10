// /src/backend/SKANDI_CORE/reservations.web.js
// SKANDI ALTEA Reservations — canonical SKANDI-owned web-method facade.
// Recovery R-005.2.
//
// IMPORTANT WIX BOUNDARY:
// This module imports ONLY reusable backend .js code.
// It must not import Duffel page-callable .web.js provider modules.
// Existing Duffel .web providers remain page-boundary dependencies until R-006
// extracts reusable internal provider .js modules.

import { webMethod, Permissions } from "wix-web-module";

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
  searchReservationInventoryCore,
  addReservationInventoryComponentCore,
  releaseReservationInventoryComponentCore,
  getReservationInventoryStatusCore,
  searchSkandiClubMembersCore,
  linkSkandiClubMemberCore,
  adjustSkandiClubPointsCore,
  checkAlteaTravelRequirementsCore,
  generateAlteaBookingDocumentCore,
  finalizeGeneratedReservationsAssetCore,
  requestAlteaDocumentDeliveryCore,
  updateAlteaDcsPassengerCore,
  getTransferDcsBootstrapCore,
  updateTransferDcsPassengerCore,
  updateTransferDcsDepartureCore,
  recordTransferDcsDocumentCore,
  sendAlteaManifestCore
} from "./reservations.js";

const VERSION = RESERVATIONS_CORE_VERSION;

function clean(value, max = 500) {
  return String(value ?? "").trim().slice(0, max);
}

function upper(value, max = 500) {
  return clean(value, max).toUpperCase();
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
      wixBoundaryVersion: "R-005.2",
      skandiOwnedFacade: true,
      providerWebMethodsPageBound: true,
      providerInternalizationTarget: "R-006",
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

const ACTIONS = Object.freeze({
  ALTEA_UNIFIED_BOOTSTRAP: [
    "ALTEA_UNIFIED_BOOTSTRAP_RESULT",
    unifiedBootstrap
  ],
  ALTEA_SEARCH_BOOKINGS: [
    "ALTEA_BOOKINGS_RESULT",
    searchAlteaBookingsCore
  ],
  ALTEA_GET_BOOKING: [
    "ALTEA_BOOKING_RESULT",
    getAlteaBookingWorkspaceCore
  ],
  ALTEA_UPDATE_PASSENGER: [
    "ALTEA_PASSENGER_UPDATED",
    updatePassengerAndRefresh
  ],
  ALTEA_ADD_HISTORY_NOTE: [
    "ALTEA_HISTORY_UPDATED",
    addHistoryAndRefresh
  ],
  ALTEA_UPDATE_DOCUMENT_STATUS: [
    "ALTEA_DOCUMENT_UPDATED",
    updateDocumentAndRefresh
  ],
  ALTEA_CREATE_LOCAL_BOOKING: [
    "ALTEA_LOCAL_BOOKING_CREATED",
    createAlteaLocalBookingCore
  ],
  ALTEA_UPDATE_COMPONENT: [
    "ALTEA_COMPONENT_UPDATED",
    updateComponentAndRefresh
  ],
  ALTEA_CREATE_PASSENGER: [
    "ALTEA_PASSENGER_CREATED",
    createPassengerAndRefresh
  ],
  ALTEA_UPDATE_BOOKING: [
    "ALTEA_BOOKING_UPDATED",
    updateBookingAndRefresh
  ],

  // Supplier order synchronization remains ALTEA-owned even while Duffel
  // web methods are temporarily invoked at the Wix page boundary.
  ALTEA_SYNC_DUFFEL_ORDER: [
    "ALTEA_DUFFEL_SYNC_RESULT",
    syncDuffelOrderToAlteaCore
  ],

  INVENTORY_SEARCH_SELLABLE: [
    "INVENTORY_SEARCH_RESULT",
    searchReservationInventoryCore
  ],
  INVENTORY_ADD_COMPONENT: [
    "INVENTORY_COMPONENT_ADDED",
    addInventoryAndRefresh
  ],
  INVENTORY_RELEASE_COMPONENT: [
    "INVENTORY_COMPONENT_RELEASED",
    releaseInventoryAndRefresh
  ],
  INVENTORY_BOOKING_STATUS: [
    "INVENTORY_BOOKING_STATUS_RESULT",
    getReservationInventoryStatusCore
  ],
  ALTEA_ADD_INVENTORY_COMPONENT: [
    "ALTEA_COMPONENT_UPDATED",
    addInventoryAndRefresh
  ],

  ALTEA_CLUB_SEARCH: [
    "ALTEA_CLUB_SEARCH_RESULT",
    searchSkandiClubMembersCore
  ],
  ALTEA_CLUB_LINK_MEMBER: [
    "ALTEA_CLUB_MEMBER_LINKED",
    linkClubAndRefresh
  ],
  ALTEA_CLUB_ADJUST_POINTS: [
    "ALTEA_CLUB_MEMBER_UPDATED",
    pointsAndRefresh
  ],
  ALTEA_TRAVEL_REQUIREMENTS_CHECK: [
    "ALTEA_TRAVEL_REQUIREMENTS_RESULT",
    requirementsAndRefresh
  ],

  ALTEA_GENERATE_DOCUMENT: [
    "ALTEA_DOCUMENT_GENERATED",
    documentAndRefresh
  ],
  ALTEA_SEND_DOCUMENT: [
    "ALTEA_DOCUMENT_SENT",
    requestAlteaDocumentDeliveryCore
  ],
  ALTEA_FINALIZE_GENERATED_ASSET: [
    "ALTEA_GENERATED_ASSET_FINALIZED",
    finalizeGeneratedReservationsAssetCore
  ],

  ALTEA_DCS_UPDATE_PASSENGER: [
    "ALTEA_DCS_PASSENGER_UPDATED",
    dcsPassengerAndRefresh
  ],
  ALTEA_DCS_RECORD_DOCUMENT: [
    "ALTEA_DCS_DOCUMENT_RECORDED",
    documentAndRefresh
  ],

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

  ALTEA_SEND_MANIFEST: [
    "ALTEA_MANIFEST_SENT",
    sendAlteaManifestCore
  ]
});

async function dispatch(input = {}) {
  await requireReservationsAccessCore();

  const type = upper(input.type, 100);
  const payload =
    input.payload && typeof input.payload === "object"
      ? input.payload
      : {};

  if (type === "ALTEA_ENTERPRISE_MODULE_READY") {
    return {
      responseType: "ALTEA_ENTERPRISE_MODULE_ACK",
      payload: {
        version: VERSION,
        capabilities: Object.keys(ACTIONS)
      }
    };
  }

  const action = ACTIONS[type];
  if (!action) {
    const error = new Error("ALTEA_ACTION_NOT_SUPPORTED");
    error.code = "ALTEA_ACTION_NOT_SUPPORTED";
    throw error;
  }

  const result = await action[1](payload);
  return {
    responseType: action[0],
    payload: result || {}
  };
}

export const handleReservationsAction = webMethod(
  Permissions.SiteMember,
  dispatch
);
