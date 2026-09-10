// /src/backend/SKANDI_CORE/reservations.web.js
// SKANDI ALTEA Reservations — single page-facing facade.
// Recovery R-005.
//
// The Wix page imports ONLY this module.
// Duffel provider modules remain internal dependencies until R-006.

import { webMethod, Permissions } from "wix-web-module";

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

const VERSION=RESERVATIONS_CORE_VERSION;

function clean(v,n=500){return String(v??"").trim().slice(0,n)}
function upper(v,n=500){return clean(v,n).toUpperCase()}

async function workspace(bookingId){
  if(!bookingId)return null;
  try{return (await getAlteaBookingWorkspaceCore({bookingId})).workspace||null}
  catch(_){return null}
}
async function refreshResult(input={},result={}){
  const bookingId=input.bookingId||result?.booking?.id||result?.component?.booking_id||
    result?.component?.bookingId||result?.passenger?.booking_id||result?.passenger?.bookingId||null;
  const w=await workspace(bookingId);
  return{...result,workspace:w};
}
async function unifiedBootstrap(input={}){
  const [base,inventory,dcs]=await Promise.all([
    getAlteaUnifiedBootstrapCore(input),
    searchReservationInventoryCore({query:"",serviceDate:input.serviceDate||""}),
    getTransferDcsBootstrapCore({})
  ]);
  return{
    ...(base||{}),
    inventory:inventory?.items||[],
    transferDepartures:dcs?.departures||[],
    transferDcsPersistence:true,
    capabilities:{
      ...(base?.capabilities||{}),
      onePageFacade:true,
      inventoryControl:true,
      atomicInventory:true,
      transferDcs:true,
      transferDcsPersistence:true,
      skandiClub:true,
      documents:true,
      platformAssetDocuments:true,
      packageBuilder:true
    }
  };
}
async function createAndSyncOrder(input={}){
  const result=await createDuffelOrder(input);
  const sync=await syncDuffelOrderToAlteaCore({
    order:result.order,
    bookingInput:input,
    eventType:result.recoveredExistingOrder?"DUFFEL_ORDER_RECOVERED":"DUFFEL_ORDER_CREATED"
  });
  return{...result,alteaWorkspace:sync.workspace};
}
async function retrieveAndSyncOrder(input={}){
  const result=await getDuffelOrder(input);
  let alteaWorkspace=null;
  try{
    alteaWorkspace=(await syncDuffelOrderToAlteaCore({
      order:result.order,eventType:"DUFFEL_ORDER_RETRIEVED"
    })).workspace;
  }catch(error){
    console.warn("[ALTEA] Supplier order retrieved but internal sync refresh failed.",error);
  }
  return{...result,alteaWorkspace};
}
async function cancelAndSync(input={}){
  const result=await confirmDuffelOrderCancellation(input);
  let alteaWorkspace=null;
  try{
    alteaWorkspace=(await syncDuffelOrderToAlteaCore({
      order:result.order,eventType:"DUFFEL_ORDER_CANCELLED"
    })).workspace;
  }catch(error){
    console.warn("[ALTEA] Cancellation confirmed but internal sync refresh failed.",error);
  }
  return{...result,alteaWorkspace};
}
async function confirmChangeAndSync(input={}){
  const result=await confirmDuffelOrderChange(input);
  const latest=await getDuffelOrder({orderIdOrReference:result.orderId});
  let alteaWorkspace=null;
  try{
    alteaWorkspace=(await syncDuffelOrderToAlteaCore({
      order:latest.order,eventType:"DUFFEL_ORDER_CHANGED"
    })).workspace;
  }catch(error){
    console.warn("[ALTEA] Order changed but internal sync refresh failed.",error);
  }
  return{...result,order:latest.order,alteaWorkspace};
}
async function updatePassengerAndRefresh(input={}){return refreshResult(input,await updateAlteaPassengerCore(input))}
async function addHistoryAndRefresh(input={}){return refreshResult(input,await addAlteaHistoryNoteCore(input))}
async function updateDocumentAndRefresh(input={}){return refreshResult(input,await updateAlteaDocumentStatusCore(input))}
async function createPassengerAndRefresh(input={}){return refreshResult(input,await createAlteaPassengerCore(input))}
async function updateComponentAndRefresh(input={}){
  if(upper(input.status||input.patch?.status)==="REMOVED"){
    return refreshResult(input,await releaseReservationInventoryComponentCore({componentId:input.componentId,bookingId:input.bookingId}));
  }
  return refreshResult(input,await updateAlteaBookingComponentCore(input));
}
async function addInventoryAndRefresh(input={}){return refreshResult(input,await addReservationInventoryComponentCore(input))}
async function releaseInventoryAndRefresh(input={}){return refreshResult(input,await releaseReservationInventoryComponentCore(input))}
async function updateBookingAndRefresh(input={}){return refreshResult(input,await updateAlteaBookingCore(input))}
async function linkClubAndRefresh(input={}){return refreshResult(input,await linkSkandiClubMemberCore(input))}
async function pointsAndRefresh(input={}){return refreshResult(input,await adjustSkandiClubPointsCore(input))}
async function requirementsAndRefresh(input={}){return refreshResult(input,await checkAlteaTravelRequirementsCore(input))}
async function documentAndRefresh(input={}){return refreshResult(input,await generateAlteaBookingDocumentCore(input))}
async function dcsPassengerAndRefresh(input={}){return refreshResult(input,await updateAlteaDcsPassengerCore(input))}
async function transferPassengerAndRefresh(input={}){
  const result=await updateTransferDcsPassengerCore(input);
  const [w,d]=await Promise.all([workspace(input.bookingId),getTransferDcsBootstrapCore({bookingId:input.bookingId})]);
  return{...result,workspace:w,departures:d.departures||[]};
}
async function transferDepartureAndRefresh(input={}){
  const result=await updateTransferDcsDepartureCore(input);
  const [w,d]=await Promise.all([workspace(input.bookingId),getTransferDcsBootstrapCore({bookingId:input.bookingId})]);
  return{...result,workspace:w,departures:d.departures||[]};
}
async function transferDocumentAndRefresh(input={}){return refreshResult(input,await recordTransferDcsDocumentCore(input))}
async function finalizeGeneratedAndRefresh(input={}){
  return finalizeGeneratedReservationsAssetCore(input);
}

const ACTIONS=Object.freeze({
  DUFFEL_APP_READY:["DUFFEL_BOOTSTRAP_RESULT",()=>getDuffelWorkspaceBootstrap()],
  DUFFEL_SEARCH_OFFERS:["DUFFEL_OFFERS_RESULT",searchDuffelOffers],
  DUFFEL_REFRESH_OFFER:["DUFFEL_OFFER_RESULT",refreshDuffelOffer],
  DUFFEL_GET_SEAT_MAPS:["DUFFEL_SEAT_MAPS_RESULT",getDuffelSeatMaps],
  DUFFEL_PREPARE_PAYMENT:["DUFFEL_PAYMENT_RESULT",prepareDuffelPayment],
  DUFFEL_LIST_ORDERS:["DUFFEL_ORDERS_RESULT",listDuffelOrders],
  DUFFEL_GET_ORDER:["DUFFEL_ORDER_RESULT",retrieveAndSyncOrder],
  DUFFEL_CREATE_ORDER:["DUFFEL_ORDER_CREATED",createAndSyncOrder],
  DUFFEL_CREATE_CANCELLATION:["DUFFEL_CANCELLATION_QUOTED",createDuffelOrderCancellation],
  DUFFEL_CONFIRM_CANCELLATION:["DUFFEL_CANCELLATION_CONFIRMED",cancelAndSync],
  DUFFEL_SEARCH_ORDER_CHANGES:["DUFFEL_ORDER_CHANGE_OFFERS",searchDuffelOrderChanges],
  DUFFEL_CREATE_ORDER_CHANGE:["DUFFEL_ORDER_CHANGE_PENDING",createDuffelPendingOrderChange],
  DUFFEL_GET_ORDER_CHANGE:["DUFFEL_ORDER_CHANGE_PENDING",getDuffelPendingOrderChange],
  DUFFEL_PREPARE_CHANGE_PAYMENT:["DUFFEL_CHANGE_PAYMENT_RESULT",prepareDuffelOrderChangePayment],
  DUFFEL_CONFIRM_ORDER_CHANGE:["DUFFEL_ORDER_CHANGE_CONFIRMED",confirmChangeAndSync],

  DUFFEL_SEARCH_STAYS:["DUFFEL_STAYS_RESULT",searchDuffelStays],
  DUFFEL_FETCH_STAY_RATES:["DUFFEL_STAY_RATES_RESULT",fetchDuffelStayRates],
  DUFFEL_QUOTE_STAY:["DUFFEL_STAY_QUOTE_RESULT",quoteDuffelStay],
  DUFFEL_CREATE_STAY_BOOKING:["DUFFEL_STAY_BOOKING_RESULT",createDuffelStayBookingStaff],
  DUFFEL_GET_STAY_BOOKING:["DUFFEL_STAY_BOOKING_RESULT",getDuffelStayBookingStaff],
  DUFFEL_CANCEL_STAY_BOOKING:["DUFFEL_STAY_CANCEL_RESULT",cancelDuffelStayBookingStaff],

  DUFFEL_SEARCH_CARS:["DUFFEL_CARS_RESULT",searchDuffelCars],
  DUFFEL_QUOTE_CAR:["DUFFEL_CAR_QUOTE_RESULT",quoteDuffelCar],
  DUFFEL_PREPARE_CAR_CARD:["DUFFEL_CAR_CARD_READY",createDuffelComponentClientKeyStaff],
  DUFFEL_CREATE_CAR_BOOKING:["DUFFEL_CAR_BOOKING_RESULT",createDuffelCarBookingStaff],
  DUFFEL_GET_CAR_BOOKING:["DUFFEL_CAR_BOOKING_RESULT",getDuffelCarBookingStaff],
  DUFFEL_CANCEL_CAR_BOOKING:["DUFFEL_CAR_CANCEL_RESULT",cancelDuffelCarBookingStaff],

  ALTEA_UNIFIED_BOOTSTRAP:["ALTEA_UNIFIED_BOOTSTRAP_RESULT",unifiedBootstrap],
  ALTEA_SEARCH_BOOKINGS:["ALTEA_BOOKINGS_RESULT",searchAlteaBookingsCore],
  ALTEA_GET_BOOKING:["ALTEA_BOOKING_RESULT",getAlteaBookingWorkspaceCore],
  ALTEA_UPDATE_PASSENGER:["ALTEA_PASSENGER_UPDATED",updatePassengerAndRefresh],
  ALTEA_ADD_HISTORY_NOTE:["ALTEA_HISTORY_UPDATED",addHistoryAndRefresh],
  ALTEA_UPDATE_DOCUMENT_STATUS:["ALTEA_DOCUMENT_UPDATED",updateDocumentAndRefresh],
  ALTEA_CREATE_LOCAL_BOOKING:["ALTEA_LOCAL_BOOKING_CREATED",createAlteaLocalBookingCore],
  ALTEA_UPDATE_COMPONENT:["ALTEA_COMPONENT_UPDATED",updateComponentAndRefresh],
  ALTEA_CREATE_PASSENGER:["ALTEA_PASSENGER_CREATED",createPassengerAndRefresh],
  ALTEA_UPDATE_BOOKING:["ALTEA_BOOKING_UPDATED",updateBookingAndRefresh],

  INVENTORY_SEARCH_SELLABLE:["INVENTORY_SEARCH_RESULT",searchReservationInventoryCore],
  INVENTORY_ADD_COMPONENT:["INVENTORY_COMPONENT_ADDED",addInventoryAndRefresh],
  INVENTORY_RELEASE_COMPONENT:["INVENTORY_COMPONENT_RELEASED",releaseInventoryAndRefresh],
  INVENTORY_BOOKING_STATUS:["INVENTORY_BOOKING_STATUS_RESULT",getReservationInventoryStatusCore],
  ALTEA_ADD_INVENTORY_COMPONENT:["ALTEA_COMPONENT_UPDATED",addInventoryAndRefresh],

  ALTEA_CLUB_SEARCH:["ALTEA_CLUB_SEARCH_RESULT",searchSkandiClubMembersCore],
  ALTEA_CLUB_LINK_MEMBER:["ALTEA_CLUB_MEMBER_LINKED",linkClubAndRefresh],
  ALTEA_CLUB_ADJUST_POINTS:["ALTEA_CLUB_MEMBER_UPDATED",pointsAndRefresh],
  ALTEA_TRAVEL_REQUIREMENTS_CHECK:["ALTEA_TRAVEL_REQUIREMENTS_RESULT",requirementsAndRefresh],

  ALTEA_GENERATE_DOCUMENT:["ALTEA_DOCUMENT_GENERATED",documentAndRefresh],
  ALTEA_SEND_DOCUMENT:["ALTEA_DOCUMENT_SENT",requestAlteaDocumentDeliveryCore],
  ALTEA_FINALIZE_GENERATED_ASSET:["ALTEA_GENERATED_ASSET_FINALIZED",finalizeGeneratedAndRefresh],

  ALTEA_DCS_UPDATE_PASSENGER:["ALTEA_DCS_PASSENGER_UPDATED",dcsPassengerAndRefresh],
  ALTEA_DCS_RECORD_DOCUMENT:["ALTEA_DCS_DOCUMENT_RECORDED",documentAndRefresh],

  ALTEA_TRANSFER_DCS_BOOTSTRAP:["ALTEA_TRANSFER_DCS_BOOTSTRAP_RESULT",getTransferDcsBootstrapCore],
  ALTEA_TRANSFER_DCS_UPDATE_PASSENGER:["ALTEA_TRANSFER_DCS_PASSENGER_UPDATED",transferPassengerAndRefresh],
  ALTEA_TRANSFER_DCS_UPDATE_DEPARTURE:["ALTEA_TRANSFER_DCS_DEPARTURE_UPDATED",transferDepartureAndRefresh],
  ALTEA_TRANSFER_DCS_RECORD_DOCUMENT:["ALTEA_DCS_DOCUMENT_RECORDED",transferDocumentAndRefresh],

  ALTEA_SEND_MANIFEST:["ALTEA_MANIFEST_SENT",sendAlteaManifestCore]
});

const PROGRESS=Object.freeze({
  DUFFEL_SEARCH_OFFERS:"Searching live airline offers…",
  DUFFEL_REFRESH_OFFER:"Refreshing price and availability…",
  DUFFEL_CREATE_ORDER:"Creating supplier order…",
  DUFFEL_CONFIRM_ORDER_CHANGE:"Confirming supplier order change…",
  DUFFEL_CONFIRM_CANCELLATION:"Confirming cancellation…",
  DUFFEL_SEARCH_STAYS:"Searching live hotel stays…",
  DUFFEL_CREATE_STAY_BOOKING:"Creating hotel booking…",
  DUFFEL_SEARCH_CARS:"Searching live car rentals…",
  DUFFEL_CREATE_CAR_BOOKING:"Creating car-rental booking…",
  ALTEA_GENERATE_DOCUMENT:"Generating SKANDI document…",
  ALTEA_SEND_MANIFEST:"Generating operations manifest…"
});

async function dispatch(input={}){
  await requireReservationsAccessCore();
  const type=upper(input.type,100);
  const payload=input.payload&&typeof input.payload==="object"?input.payload:{};

  if(type==="ALTEA_ENTERPRISE_MODULE_READY"){
    return{
      responseType:"ALTEA_ENTERPRISE_MODULE_ACK",
      payload:{
        version:VERSION,
        capabilities:Object.keys(ACTIONS).filter(k=>k.startsWith("ALTEA_")||k.startsWith("INVENTORY_"))
      }
    };
  }

  const action=ACTIONS[type];
  if(!action)throw new Error("ALTEA_ACTION_NOT_SUPPORTED");
  const result=await action[1](payload);
  return{
    responseType:action[0],
    payload:result||{},
    progressMessage:PROGRESS[type]||""
  };
}

export const handleReservationsAction=webMethod(Permissions.SiteMember,dispatch);
