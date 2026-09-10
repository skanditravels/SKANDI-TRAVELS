// Wix page code: /riaintra/success-factors/altea/reservations
// SKANDI ALTEA Reservations V9.12.1 — rich unified workspace + Duffel + Inventory Control.
import wixLocation from "wix-location-frontend";
import { getDuffelWorkspaceBootstrap,searchDuffelOffers,refreshDuffelOffer,getDuffelSeatMaps,prepareDuffelPayment,listDuffelOrders,getDuffelOrder,createDuffelOrder,createDuffelOrderCancellation,confirmDuffelOrderCancellation } from "src/backend/duffelTravel.web";
import { getAlteaUnifiedBootstrap,searchAlteaBookings,getAlteaBookingWorkspace,syncDuffelOrderToAltea,updateAlteaPassenger,addAlteaHistoryNote,updateAlteaDocumentStatus,createAlteaLocalBooking,updateAlteaBookingComponent,createAlteaPassenger } from "src/backend/RIA/alteaUnified.web";
import { searchDuffelOrderChanges,createDuffelPendingOrderChange,getDuffelPendingOrderChange,prepareDuffelOrderChangePayment,confirmDuffelOrderChange } from "src/backend/RIA/duffelServicing.web";
import { searchDuffelStays,fetchDuffelStayRates,quoteDuffelStay,createDuffelStayBookingStaff,getDuffelStayBookingStaff,cancelDuffelStayBookingStaff,searchDuffelCars,quoteDuffelCar,createDuffelCarBookingStaff,getDuffelCarBookingStaff,cancelDuffelCarBookingStaff,createDuffelComponentClientKeyStaff } from "src/backend/RIA/duffelGroundProducts.web";
import { searchReservationInventory,addReservationInventoryComponent,releaseReservationInventoryComponent,getReservationInventoryStatus } from "backend/RIA/inventoryReservationsV9.web";
import { updateAlteaBookingEnterprise,searchSkandiClubMembers,linkSkandiClubMember,adjustSkandiClubPoints,checkAlteaTravelRequirements,generateAlteaBookingDocument,requestAlteaDocumentDelivery,updateAlteaDcsPassenger,getTransferDcsBootstrap,updateTransferDcsPassenger,updateTransferDcsDeparture,recordTransferDcsDocument,sendAlteaManifest } from "backend/RIA/alteaEnterpriseV912.web";

const EMBED_ID="#alteaReservationsEmbed";
const LOGIN="/riaintra";
const CHILD="SKANDI_DUFFEL_RESERVATIONS";
const PARENT="SKANDI_WIX_PARENT";
const VERSION="2026.09.10.12.1";

async function createAndSyncOrder(input={}){const result=await createDuffelOrder(input);const sync=await syncDuffelOrderToAltea({order:result.order,bookingInput:input,eventType:result.recoveredExistingOrder?"DUFFEL_ORDER_RECOVERED":"DUFFEL_ORDER_CREATED"});return{...result,alteaWorkspace:sync.workspace}}
async function retrieveAndSyncOrder(input={}){const result=await getDuffelOrder(input);let alteaWorkspace=null;try{alteaWorkspace=(await syncDuffelOrderToAltea({order:result.order,eventType:"DUFFEL_ORDER_RETRIEVED"})).workspace}catch(_){}return{...result,alteaWorkspace}}
async function cancelAndSync(input={}){const result=await confirmDuffelOrderCancellation(input);let alteaWorkspace=null;try{alteaWorkspace=(await syncDuffelOrderToAltea({order:result.order,eventType:"DUFFEL_ORDER_CANCELLED"})).workspace}catch(_){}return{...result,alteaWorkspace}}
async function confirmChangeAndSync(input={}){const result=await confirmDuffelOrderChange(input);const latest=await getDuffelOrder({orderIdOrReference:result.orderId});let alteaWorkspace=null;try{alteaWorkspace=(await syncDuffelOrderToAltea({order:latest.order,eventType:"DUFFEL_ORDER_CHANGED"})).workspace}catch(_){}return{...result,order:latest.order,alteaWorkspace}}
async function workspace(bookingId){if(!bookingId)return null;try{return (await getAlteaBookingWorkspace({bookingId})).workspace||null}catch(_){return null}}
async function unifiedBootstrap(input={}){const [base,inv,dcs]=await Promise.all([getAlteaUnifiedBootstrap(input),searchReservationInventory({query:"",serviceDate:input.serviceDate||""}),getTransferDcsBootstrap({})]);return{...(base||{}),inventory:inv?.items||base?.inventory||[],transferDepartures:dcs?.departures||[],transferDcsPersistence:true,travelRequirementsProvider:base?.travelRequirementsProvider||base?.timaticProvider||"SKANDI_GUIDANCE",capabilities:{...(base?.capabilities||{}),inventoryControl:true,atomicInventory:true,transferDcs:true,transferDcsPersistence:true,skandiClub:true,documents:true,packageBuilder:true}}}
async function refreshResult(input={},result={}){const bookingId=input.bookingId||result?.booking?.id||result?.component?.booking_id||result?.passenger?.booking_id||null;const w=await workspace(bookingId);return{...result,workspace:w}}
async function updatePassengerAndRefresh(input={}){return refreshResult(input,await updateAlteaPassenger(input))}
async function addHistoryAndRefresh(input={}){return refreshResult(input,await addAlteaHistoryNote(input))}
async function updateDocumentAndRefresh(input={}){return refreshResult(input,await updateAlteaDocumentStatus(input))}
async function createPassengerAndRefresh(input={}){return refreshResult(input,await createAlteaPassenger(input))}
async function updateComponentAndRefresh(input={}){if(String(input.status||input.patch?.status||"").toUpperCase()==="REMOVED"){const r=await releaseReservationInventoryComponent({componentId:input.componentId});return refreshResult(input,r)}return refreshResult(input,await updateAlteaBookingComponent(input))}
async function addInventoryAndRefresh(input={}){return refreshResult(input,await addReservationInventoryComponent(input))}
async function releaseInventoryAndRefresh(input={}){return refreshResult(input,await releaseReservationInventoryComponent(input))}
async function updateBookingAndRefresh(input={}){return refreshResult(input,await updateAlteaBookingEnterprise(input))}
async function linkClubAndRefresh(input={}){return refreshResult(input,await linkSkandiClubMember(input))}
async function pointsAndRefresh(input={}){return refreshResult(input,await adjustSkandiClubPoints(input))}
async function reqAndRefresh(input={}){return refreshResult(input,await checkAlteaTravelRequirements(input))}
async function docAndRefresh(input={}){return refreshResult(input,await generateAlteaBookingDocument(input))}
async function dcsPassengerAndRefresh(input={}){return refreshResult(input,await updateAlteaDcsPassenger(input))}
async function transferPassengerAndRefresh(input={}){const r=await updateTransferDcsPassenger(input);const [w,d]=await Promise.all([workspace(input.bookingId),getTransferDcsBootstrap({bookingId:input.bookingId})]);return{...r,workspace:w,departures:d.departures||[]}}
async function transferDepartureAndRefresh(input={}){const r=await updateTransferDcsDeparture(input);const [w,d]=await Promise.all([workspace(input.bookingId),getTransferDcsBootstrap({bookingId:input.bookingId})]);return{...r,workspace:w,departures:d.departures||[]}}
async function recordTransferDocAndRefresh(input={}){return refreshResult(input,await recordTransferDcsDocument(input))}

const A={
  DUFFEL_APP_READY:["DUFFEL_BOOTSTRAP_RESULT",()=>getDuffelWorkspaceBootstrap()],
  DUFFEL_SEARCH_OFFERS:["DUFFEL_OFFERS_RESULT",searchDuffelOffers],DUFFEL_REFRESH_OFFER:["DUFFEL_OFFER_RESULT",refreshDuffelOffer],DUFFEL_GET_SEAT_MAPS:["DUFFEL_SEAT_MAPS_RESULT",getDuffelSeatMaps],DUFFEL_PREPARE_PAYMENT:["DUFFEL_PAYMENT_RESULT",prepareDuffelPayment],DUFFEL_LIST_ORDERS:["DUFFEL_ORDERS_RESULT",listDuffelOrders],DUFFEL_GET_ORDER:["DUFFEL_ORDER_RESULT",retrieveAndSyncOrder],DUFFEL_CREATE_ORDER:["DUFFEL_ORDER_CREATED",createAndSyncOrder],DUFFEL_CREATE_CANCELLATION:["DUFFEL_CANCELLATION_QUOTED",createDuffelOrderCancellation],DUFFEL_CONFIRM_CANCELLATION:["DUFFEL_CANCELLATION_CONFIRMED",cancelAndSync],DUFFEL_SEARCH_ORDER_CHANGES:["DUFFEL_ORDER_CHANGE_OFFERS",searchDuffelOrderChanges],DUFFEL_CREATE_ORDER_CHANGE:["DUFFEL_ORDER_CHANGE_PENDING",createDuffelPendingOrderChange],DUFFEL_GET_ORDER_CHANGE:["DUFFEL_ORDER_CHANGE_PENDING",getDuffelPendingOrderChange],DUFFEL_PREPARE_CHANGE_PAYMENT:["DUFFEL_CHANGE_PAYMENT_RESULT",prepareDuffelOrderChangePayment],DUFFEL_CONFIRM_ORDER_CHANGE:["DUFFEL_ORDER_CHANGE_CONFIRMED",confirmChangeAndSync],
  DUFFEL_SEARCH_STAYS:["DUFFEL_STAYS_RESULT",searchDuffelStays],DUFFEL_FETCH_STAY_RATES:["DUFFEL_STAY_RATES_RESULT",fetchDuffelStayRates],DUFFEL_QUOTE_STAY:["DUFFEL_STAY_QUOTE_RESULT",quoteDuffelStay],DUFFEL_CREATE_STAY_BOOKING:["DUFFEL_STAY_BOOKING_RESULT",createDuffelStayBookingStaff],DUFFEL_GET_STAY_BOOKING:["DUFFEL_STAY_BOOKING_RESULT",getDuffelStayBookingStaff],DUFFEL_CANCEL_STAY_BOOKING:["DUFFEL_STAY_CANCEL_RESULT",cancelDuffelStayBookingStaff],DUFFEL_SEARCH_CARS:["DUFFEL_CARS_RESULT",searchDuffelCars],DUFFEL_QUOTE_CAR:["DUFFEL_CAR_QUOTE_RESULT",quoteDuffelCar],DUFFEL_PREPARE_CAR_CARD:["DUFFEL_CAR_CARD_READY",createDuffelComponentClientKeyStaff],DUFFEL_CREATE_CAR_BOOKING:["DUFFEL_CAR_BOOKING_RESULT",createDuffelCarBookingStaff],DUFFEL_GET_CAR_BOOKING:["DUFFEL_CAR_BOOKING_RESULT",getDuffelCarBookingStaff],DUFFEL_CANCEL_CAR_BOOKING:["DUFFEL_CAR_CANCEL_RESULT",cancelDuffelCarBookingStaff],

  ALTEA_UNIFIED_BOOTSTRAP:["ALTEA_UNIFIED_BOOTSTRAP_RESULT",unifiedBootstrap],ALTEA_SEARCH_BOOKINGS:["ALTEA_BOOKINGS_RESULT",searchAlteaBookings],ALTEA_GET_BOOKING:["ALTEA_BOOKING_RESULT",getAlteaBookingWorkspace],ALTEA_UPDATE_PASSENGER:["ALTEA_PASSENGER_UPDATED",updatePassengerAndRefresh],ALTEA_ADD_HISTORY_NOTE:["ALTEA_HISTORY_UPDATED",addHistoryAndRefresh],ALTEA_UPDATE_DOCUMENT_STATUS:["ALTEA_DOCUMENT_UPDATED",updateDocumentAndRefresh],ALTEA_CREATE_LOCAL_BOOKING:["ALTEA_LOCAL_BOOKING_CREATED",createAlteaLocalBooking],ALTEA_UPDATE_COMPONENT:["ALTEA_COMPONENT_UPDATED",updateComponentAndRefresh],ALTEA_CREATE_PASSENGER:["ALTEA_PASSENGER_CREATED",createPassengerAndRefresh],

  INVENTORY_SEARCH_SELLABLE:["INVENTORY_SEARCH_RESULT",searchReservationInventory],INVENTORY_ADD_COMPONENT:["INVENTORY_COMPONENT_ADDED",addInventoryAndRefresh],INVENTORY_RELEASE_COMPONENT:["INVENTORY_COMPONENT_RELEASED",releaseInventoryAndRefresh],INVENTORY_BOOKING_STATUS:["INVENTORY_BOOKING_STATUS_RESULT",getReservationInventoryStatus],
  // Legacy rich Reservations aliases retained for V9.12.1.
  ALTEA_ADD_INVENTORY_COMPONENT:["ALTEA_COMPONENT_UPDATED",addInventoryAndRefresh],

  ALTEA_UPDATE_BOOKING:["ALTEA_BOOKING_UPDATED",updateBookingAndRefresh],ALTEA_CLUB_SEARCH:["ALTEA_CLUB_SEARCH_RESULT",searchSkandiClubMembers],ALTEA_CLUB_LINK_MEMBER:["ALTEA_CLUB_MEMBER_LINKED",linkClubAndRefresh],ALTEA_CLUB_ADJUST_POINTS:["ALTEA_CLUB_MEMBER_UPDATED",pointsAndRefresh],ALTEA_TRAVEL_REQUIREMENTS_CHECK:["ALTEA_TRAVEL_REQUIREMENTS_RESULT",reqAndRefresh],ALTEA_GENERATE_DOCUMENT:["ALTEA_DOCUMENT_GENERATED",docAndRefresh],ALTEA_SEND_DOCUMENT:["ALTEA_DOCUMENT_SENT",requestAlteaDocumentDelivery],ALTEA_DCS_UPDATE_PASSENGER:["ALTEA_DCS_PASSENGER_UPDATED",dcsPassengerAndRefresh],ALTEA_DCS_RECORD_DOCUMENT:["ALTEA_DCS_DOCUMENT_RECORDED",docAndRefresh],ALTEA_TRANSFER_DCS_BOOTSTRAP:["ALTEA_TRANSFER_DCS_BOOTSTRAP_RESULT",getTransferDcsBootstrap],ALTEA_TRANSFER_DCS_UPDATE_PASSENGER:["ALTEA_TRANSFER_DCS_PASSENGER_UPDATED",transferPassengerAndRefresh],ALTEA_TRANSFER_DCS_UPDATE_DEPARTURE:["ALTEA_TRANSFER_DCS_DEPARTURE_UPDATED",transferDepartureAndRefresh],ALTEA_TRANSFER_DCS_RECORD_DOCUMENT:["ALTEA_DCS_DOCUMENT_RECORDED",recordTransferDocAndRefresh],ALTEA_SEND_MANIFEST:["ALTEA_MANIFEST_SENT",sendAlteaManifest]
};

function post(e,t,p={},r=""){e.postMessage({source:PARENT,type:t,requestId:r,payload:p,timestamp:new Date().toISOString()})}
function errCode(x){const c=String(x?.code||x?.message||"").toUpperCase().match(/[A-Z][A-Z0-9_]{2,60}/)?.[0];return c||"ALTEA_ACTION_FAILED"}
function msg(x){return String(x?.publicMessage||x?.message||"The ALTEA action could not be completed.").slice(0,400)}

$w.onReady(()=>{
  const e=$w(EMBED_ID);
  e.onMessage(async ev=>{
    const m=ev.data||{};if(m.source!==CHILD)return;
    if(m.type==="ALTEA_ENTERPRISE_MODULE_READY")return post(e,"ALTEA_ENTERPRISE_MODULE_ACK",{version:VERSION,capabilities:Object.keys(A).filter(x=>x.startsWith("ALTEA_")||x.startsWith("INVENTORY_"))},m.requestId||"");
    const a=A[m.type];if(!a)return;
    const r=/^[A-Za-z0-9_-]{1,100}$/.test(String(m.requestId||""))?m.requestId:"";
    try{const p=await a[1](m.payload||{});post(e,a[0],p||{},r)}catch(x){const c=errCode(x);post(e,m.type.startsWith("DUFFEL_")?"DUFFEL_ERROR":"ALTEA_ERROR",{code:c,message:msg(x)},r);if(c==="AUTH_REQUIRED")wixLocation.to(LOGIN)}
  });
  post(e,"DUFFEL_PARENT_READY",{embedId:EMBED_ID,unified:true,inventoryControl:true,enterprise:true,transferDcs:true,skandiClub:true,documents:true,version:VERSION});
  // Proactively seed the canonical sellable Inventory catalog even if the child loads before its bootstrap listener.
  Promise.resolve(searchReservationInventory({query:""})).then(p=>post(e,"INVENTORY_SEARCH_RESULT",p||{})).catch(()=>{});
});
