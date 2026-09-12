// /src/backend/SKANDI_CORE/reservations.web.js
// SKANDI ALTEA Reservations — canonical SKANDI-owned web-method facade.
// Recovery R-006.3 — one page-callable Reservations facade.
//
// IMPORTANT WIX BOUNDARY:
// This module imports reusable backend .js cores only. The Reservations page
// must not import Duffel provider .web modules directly.


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
  searchReservationInventoryCore,
  addReservationInventoryComponentCore,
  releaseReservationInventoryComponentCore,
  getReservationInventoryStatusCore,
  searchSkandiClubMembersCore,
  linkSkandiClubMemberCore,
  adjustSkandiClubPointsCore,
  checkAlteaTravelRequirementsCore,
  generateAlteaBookingDocumentCore,
  getAlteaDocumentCore,
  finalizeGeneratedReservationsAssetCore,
  requestAlteaDocumentDeliveryCore,
  updateAlteaDcsPassengerCore,
  getTransferDcsBootstrapCore,
  updateTransferDcsPassengerCore,
  updateTransferDcsDepartureCore,
  recordTransferDcsDocumentCore,
  sendAlteaManifestCore,
  syncDuffelGroundBookingToAlteaCore
} from "./reservations.js";


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
} from "./duffelAir.js";

import {
  searchDuffelOrderChangesCore,
  createDuffelPendingOrderChangeCore,
  getDuffelPendingOrderChangeCore,
  prepareDuffelOrderChangePaymentCore,
  confirmDuffelOrderChangeCore
} from "./duffelServicing.js";

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
} from "./duffelGround.js";

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
      wixBoundaryVersion: "BACKEND-BASE-1.0-B007",
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



async function syncGroundBooking(result,input={},componentType="HOTEL",eventType="DUFFEL_GROUND_BOOKING_SYNCED"){
  const booking=result?.booking||null;
  if(!booking?.id||!input.alteaBookingId)return{...result,alteaWorkspace:null};
  const sync=await syncDuffelGroundBookingToAlteaCore({
    alteaBookingId:input.alteaBookingId,
    componentType,
    booking,
    eventType
  });
  return{...result,alteaWorkspace:sync?.workspace||null};
}
async function createStayAndSync(input={}){
  return syncGroundBooking(await createDuffelStayBookingCore(input),input,"HOTEL","DUFFEL_STAY_BOOKING_CREATED");
}
async function getStayAndSync(input={}){
  const result=await getDuffelStayBookingCore(input);
  try{return await syncGroundBooking(result,input,"HOTEL","DUFFEL_STAY_BOOKING_RETRIEVED");}catch(_){return result;}
}
async function cancelStayAndSync(input={}){
  return syncGroundBooking(await cancelDuffelStayBookingCore(input),input,"HOTEL","DUFFEL_STAY_BOOKING_CANCELLED");
}
async function createCarAndSync(input={}){
  return syncGroundBooking(await createDuffelCarBookingCore(input),input,"CAR_RENTAL","DUFFEL_CAR_BOOKING_CREATED");
}
async function getCarAndSync(input={}){
  const result=await getDuffelCarBookingCore(input);
  try{return await syncGroundBooking(result,input,"CAR_RENTAL","DUFFEL_CAR_BOOKING_RETRIEVED");}catch(_){return result;}
}
async function cancelCarAndSync(input={}){
  return syncGroundBooking(await cancelDuffelCarBookingCore(input),input,"CAR_RENTAL","DUFFEL_CAR_BOOKING_CANCELLED");
}

async function syncSupplierOrder(order, bookingInput={}, eventType="DUFFEL_ORDER_SYNCED"){
  if(!order?.id)return null;
  const sync=await syncDuffelOrderToAlteaCore({order,bookingInput,eventType});
  return sync?.workspace||null;
}

async function createAndSyncOrder(input={}){
  const result=await createDuffelOrderCore(input);
  const alteaWorkspace=await syncSupplierOrder(
    result?.order,input,
    result?.recoveredExistingOrder?"DUFFEL_ORDER_RECOVERED":"DUFFEL_ORDER_CREATED"
  );
  return{...result,alteaWorkspace};
}

async function retrieveAndSyncOrder(input={}){
  const result=await getDuffelOrderCore(input);
  let alteaWorkspace=null;
  try{alteaWorkspace=await syncSupplierOrder(result?.order,{},"DUFFEL_ORDER_RETRIEVED");}catch(_){}
  return{...result,alteaWorkspace};
}

async function cancelAndSyncOrder(input={}){
  const result=await confirmDuffelOrderCancellationCore(input);
  let alteaWorkspace=null;
  try{alteaWorkspace=await syncSupplierOrder(result?.order,{},"DUFFEL_ORDER_CANCELLED");}catch(_){}
  return{...result,alteaWorkspace};
}

async function confirmChangeAndSyncOrder(input={}){
  const result=await confirmDuffelOrderChangeCore(input);
  const latest=await getDuffelOrderCore({orderIdOrReference:result?.orderId});
  let alteaWorkspace=null;
  try{alteaWorkspace=await syncSupplierOrder(latest?.order,{},"DUFFEL_ORDER_CHANGED");}catch(_){}
  return{...result,order:latest?.order||result?.order||null,alteaWorkspace};
}

const ACTIONS = Object.freeze({
  DUFFEL_APP_READY: ["DUFFEL_BOOTSTRAP_RESULT", getDuffelWorkspaceBootstrapCore],
  DUFFEL_SEARCH_OFFERS: ["DUFFEL_OFFERS_RESULT", searchDuffelOffersCore],
  DUFFEL_REFRESH_OFFER: ["DUFFEL_OFFER_RESULT", refreshDuffelOfferCore],
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

  DUFFEL_SEARCH_STAYS: ["DUFFEL_STAYS_RESULT", searchDuffelStaysCore],
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
  ALTEA_GET_DOCUMENT: [
    "ALTEA_DOCUMENT_RESULT",
    getAlteaDocumentCore
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