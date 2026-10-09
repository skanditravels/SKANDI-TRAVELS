// /src/backend/SKANDI_CORE/reservations.web.js
// SKANDI ALTEA Reservations — canonical SKANDI-owned web-method facade.
// V12 Reservations action contract. Provider calls remain internal to SKANDI_CORE.

import { webMethod, Permissions } from "@wix/web-methods";
import {
  RESERVATIONS_CORE_VERSION, requireReservationsAccessCore, getAlteaUnifiedBootstrapCore,
  searchAlteaBookingsCore, getAlteaBookingWorkspaceCore, createAlteaLocalBookingCore,
  updateAlteaBookingCore, updateAlteaPassengerCore, createAlteaPassengerCore,
  addAlteaHistoryNoteCore, updateAlteaDocumentStatusCore, updateAlteaBookingComponentCore,
  syncDuffelOrderToAlteaCore, syncDuffelGroundBookingToAlteaCore, searchReservationInventoryCore,
  addReservationInventoryComponentCore, releaseReservationInventoryComponentCore,
  getReservationInventoryStatusCore, resolveReservationDestinationCore, searchSkandiClubMembersCore,
  getCustomerProfileCore, linkSkandiClubMemberCore, adjustSkandiClubPointsCore,
  checkAlteaTravelRequirementsCore, generateAlteaBookingDocumentCore,
  previewAlteaBookingConfirmationCore, getAlteaDocumentCore, finalizeGeneratedReservationsAssetCore,
  requestAlteaDocumentDeliveryCore, updateAlteaDcsPassengerCore, getTransferDcsBootstrapCore,
  updateTransferDcsPassengerCore, updateTransferDcsDepartureCore, recordTransferDcsDocumentCore,
  sendAlteaManifestCore, enrichDuffelFlightPayloadCore
} from "backend/SKANDI_CORE/reservations";
import {
  getDuffelWorkspaceBootstrapCore, searchDuffelOffersCore, refreshDuffelOfferCore,
  getDuffelSeatMapsCore, prepareDuffelPaymentCore, listDuffelOrdersCore, getDuffelOrderCore,
  createDuffelOrderCore, createDuffelOrderCancellationCore, confirmDuffelOrderCancellationCore
} from "backend/SKANDI_CORE/duffelAir";
import {
  searchDuffelOrderChangesCore, createDuffelPendingOrderChangeCore, getDuffelPendingOrderChangeCore,
  prepareDuffelOrderChangePaymentCore, confirmDuffelOrderChangeCore
} from "backend/SKANDI_CORE/duffelServicing";
import {
  searchDuffelStaysCore, fetchDuffelStayRatesCore, quoteDuffelStayCore, createDuffelStayBookingCore,
  getDuffelStayBookingCore, cancelDuffelStayBookingCore, searchDuffelCarsCore, quoteDuffelCarCore,
  createDuffelCarBookingCore, getDuffelCarBookingCore, cancelDuffelCarBookingCore,
  createDuffelComponentClientKeyCore
} from "backend/SKANDI_CORE/duffelGround";
import {
  searchReservationAirportsCore, getReservationComponentSuggestionsCore, deleteUnconfirmedAlteaBookingCore
} from "backend/SKANDI_CORE/reservationsExperience";

const VERSION = "BACKEND-BASE-1.0-B007.7";
const ACTION_CONTRACT_VERSION = "3";
const clean=(v,max=500)=>String(v??"").trim().slice(0,max);
const upper=(v,max=500)=>clean(v,max).toUpperCase();
function actionError(code,publicMessage=""){const e=new Error(code);e.code=code;if(publicMessage)e.publicMessage=publicMessage;return e;}
async function workspace(bookingId){if(!bookingId)return null;try{return(await getAlteaBookingWorkspaceCore({bookingId})).workspace||null;}catch(_){return null;}}
async function refreshResult(input={},result={}){const bookingId=input.bookingId||result?.booking?.id||result?.component?.booking_id||result?.component?.bookingId||result?.passenger?.booking_id||result?.passenger?.bookingId||null;return{...result,workspace:await workspace(bookingId)};}
async function unifiedBootstrap(input={}){const[base,inventory,dcs]=await Promise.all([getAlteaUnifiedBootstrapCore(input),searchReservationInventoryCore({query:"",serviceDate:input.serviceDate||""}),getTransferDcsBootstrapCore({})]);return{...(base||{}),inventory:inventory?.items||[],transferDepartures:dcs?.departures||[],transferDcsPersistence:true,capabilities:{...(base?.capabilities||{}),wixBoundaryVersion:VERSION,actionContractVersion:ACTION_CONTRACT_VERSION,shapeSafeActionDispatch:true,skandiOwnedFacade:true,providerWebMethodsPageBound:false,providerInternalized:true,inventoryControl:true,atomicInventory:true,transferDcs:true,transferDcsPersistence:true,skandiClub:true,documents:true,platformAssetDocuments:true,packageBuilder:true,airportAutocomplete:true,contextualInventorySuggestions:true,draftBookingDeletion:true}};}
async function updatePassengerAndRefresh(i={}){return refreshResult(i,await updateAlteaPassengerCore(i));}
async function addHistoryAndRefresh(i={}){return refreshResult(i,await addAlteaHistoryNoteCore(i));}
async function updateDocumentAndRefresh(i={}){return refreshResult(i,await updateAlteaDocumentStatusCore(i));}
async function createPassengerAndRefresh(i={}){return refreshResult(i,await createAlteaPassengerCore(i));}
async function updateComponentAndRefresh(i={}){if(upper(i.status||i.patch?.status)==="REMOVED")return refreshResult(i,await releaseReservationInventoryComponentCore({componentId:i.componentId,bookingId:i.bookingId}));return refreshResult(i,await updateAlteaBookingComponentCore(i));}
async function addInventoryAndRefresh(i={}){return refreshResult(i,await addReservationInventoryComponentCore(i));}
async function releaseInventoryAndRefresh(i={}){return refreshResult(i,await releaseReservationInventoryComponentCore(i));}
async function updateBookingAndRefresh(i={}){return refreshResult(i,await updateAlteaBookingCore(i));}
async function linkClubAndRefresh(i={}){return refreshResult(i,await linkSkandiClubMemberCore(i));}
async function pointsAndRefresh(i={}){return refreshResult(i,await adjustSkandiClubPointsCore(i));}
async function requirementsAndRefresh(i={}){return refreshResult(i,await checkAlteaTravelRequirementsCore(i));}
async function documentAndRefresh(i={}){return refreshResult(i,await generateAlteaBookingDocumentCore(i));}
async function dcsPassengerAndRefresh(i={}){return refreshResult(i,await updateAlteaDcsPassengerCore(i));}
async function transferPassengerAndRefresh(i={}){const result=await updateTransferDcsPassengerCore(i);const[currentWorkspace,dcs]=await Promise.all([workspace(i.bookingId),getTransferDcsBootstrapCore({bookingId:i.bookingId})]);return{...result,workspace:currentWorkspace,departures:dcs?.departures||[]};}
async function transferDepartureAndRefresh(i={}){const result=await updateTransferDcsDepartureCore(i);const[currentWorkspace,dcs]=await Promise.all([workspace(i.bookingId),getTransferDcsBootstrapCore({bookingId:i.bookingId})]);return{...result,workspace:currentWorkspace,departures:dcs?.departures||[]};}
async function transferDocumentAndRefresh(i={}){return refreshResult(i,await recordTransferDcsDocumentCore(i));}
async function syncSupplierOrder(order,bookingInput={},eventType="DUFFEL_ORDER_SYNCED"){if(!order?.id)return null;const sync=await syncDuffelOrderToAlteaCore({order,bookingInput,eventType});return sync?.workspace||null;}
async function createAndSyncOrder(i={}){const providerResult=await createDuffelOrderCore(i);const result=await enrichDuffelFlightPayloadCore(providerResult);const alteaWorkspace=await syncSupplierOrder(result?.order,{...i,offer:result?.offer||null},result?.recoveredExistingOrder?"DUFFEL_ORDER_RECOVERED":"DUFFEL_ORDER_CREATED");return{...result,alteaWorkspace};}
async function retrieveAndSyncOrder(i={}){const result=await enrichDuffelFlightPayloadCore(await getDuffelOrderCore(i));let alteaWorkspace=null;try{alteaWorkspace=await syncSupplierOrder(result?.order,{},"DUFFEL_ORDER_RETRIEVED");}catch(_){}return{...result,alteaWorkspace};}
async function cancelAndSyncOrder(i={}){const result=await confirmDuffelOrderCancellationCore(i);let alteaWorkspace=null;try{alteaWorkspace=await syncSupplierOrder(result?.order,{},"DUFFEL_ORDER_CANCELLED");}catch(_){}return{...result,alteaWorkspace};}
async function confirmChangeAndSyncOrder(i={}){const result=await confirmDuffelOrderChangeCore(i);const latest=await getDuffelOrderCore({orderIdOrReference:result?.orderId});let alteaWorkspace=null;try{alteaWorkspace=await syncSupplierOrder(latest?.order,{},"DUFFEL_ORDER_CHANGED");}catch(_){}return{...result,order:latest?.order||result?.order||null,alteaWorkspace};}
function providerBooking(r){if(r?.booking?.id)return r.booking;if(r?.id)return r;return null;}
function normalizedGroundResult(r){if(r?.booking||r?.reconciliationRequired)return r||{};return r?.id?{booking:r}:{...(r||{})};}
async function syncGroundResult(input,result,componentType,eventType){const out=normalizedGroundResult(result),booking=providerBooking(out),alteaBookingId=clean(input.alteaBookingId||input.bookingId,80);if(!booking?.id||!alteaBookingId)return out;const synced=await syncDuffelGroundBookingToAlteaCore({alteaBookingId,componentType,providerBooking:booking,eventType});return{...out,alteaWorkspace:synced?.workspace||null};}
async function createStayAndSync(i={}){return syncGroundResult(i,await createDuffelStayBookingCore(i),"HOTEL","DUFFEL_STAY_BOOKING_CREATED");}
async function getStayAndSync(i={}){return syncGroundResult(i,await getDuffelStayBookingCore(i),"HOTEL","DUFFEL_STAY_BOOKING_RETRIEVED");}
async function cancelStayAndSync(i={}){return syncGroundResult(i,await cancelDuffelStayBookingCore(i),"HOTEL","DUFFEL_STAY_BOOKING_CANCELLED");}
async function createCarAndSync(i={}){return syncGroundResult(i,await createDuffelCarBookingCore(i),"CAR_RENTAL","DUFFEL_CAR_BOOKING_CREATED");}
async function getCarAndSync(i={}){return syncGroundResult(i,await getDuffelCarBookingCore(i),"CAR_RENTAL","DUFFEL_CAR_BOOKING_RETRIEVED");}
async function cancelCarAndSync(i={}){return syncGroundResult(i,await cancelDuffelCarBookingCore(i),"CAR_RENTAL","DUFFEL_CAR_BOOKING_CANCELLED");}
async function searchOffersWithReference(i={}){return enrichDuffelFlightPayloadCore(await searchDuffelOffersCore(i));}
async function refreshOfferWithReference(i={}){return enrichDuffelFlightPayloadCore(await refreshDuffelOfferCore(i));}
async function searchResolvedStays(i={}){if(i?.location?.latitude!==undefined||i?.latitude!==undefined||i?.accommodationId||Array.isArray(i?.accommodationIds))return searchDuffelStaysCore(i);const resolved=await resolveReservationDestinationCore(i);return searchDuffelStaysCore({...i,location:resolved.location});}

const ACTIONS=Object.freeze({
DUFFEL_APP_READY:["DUFFEL_BOOTSTRAP_RESULT",getDuffelWorkspaceBootstrapCore],DUFFEL_SEARCH_OFFERS:["DUFFEL_OFFERS_RESULT",searchOffersWithReference],DUFFEL_REFRESH_OFFER:["DUFFEL_OFFER_RESULT",refreshOfferWithReference],DUFFEL_GET_SEAT_MAPS:["DUFFEL_SEAT_MAPS_RESULT",getDuffelSeatMapsCore],DUFFEL_PREPARE_PAYMENT:["DUFFEL_PAYMENT_RESULT",prepareDuffelPaymentCore],DUFFEL_LIST_ORDERS:["DUFFEL_ORDERS_RESULT",listDuffelOrdersCore],DUFFEL_GET_ORDER:["DUFFEL_ORDER_RESULT",retrieveAndSyncOrder],DUFFEL_CREATE_ORDER:["DUFFEL_ORDER_CREATED",createAndSyncOrder],DUFFEL_CREATE_CANCELLATION:["DUFFEL_CANCELLATION_QUOTED",createDuffelOrderCancellationCore],DUFFEL_CONFIRM_CANCELLATION:["DUFFEL_CANCELLATION_CONFIRMED",cancelAndSyncOrder],
DUFFEL_SEARCH_ORDER_CHANGES:["DUFFEL_ORDER_CHANGE_OFFERS",searchDuffelOrderChangesCore],DUFFEL_CREATE_ORDER_CHANGE:["DUFFEL_ORDER_CHANGE_PENDING",createDuffelPendingOrderChangeCore],DUFFEL_GET_ORDER_CHANGE:["DUFFEL_ORDER_CHANGE_PENDING",getDuffelPendingOrderChangeCore],DUFFEL_PREPARE_CHANGE_PAYMENT:["DUFFEL_CHANGE_PAYMENT_RESULT",prepareDuffelOrderChangePaymentCore],DUFFEL_CONFIRM_ORDER_CHANGE:["DUFFEL_ORDER_CHANGE_CONFIRMED",confirmChangeAndSyncOrder],
DUFFEL_SEARCH_STAYS:["DUFFEL_STAYS_RESULT",searchResolvedStays],DUFFEL_FETCH_STAY_RATES:["DUFFEL_STAY_RATES_RESULT",fetchDuffelStayRatesCore],DUFFEL_QUOTE_STAY:["DUFFEL_STAY_QUOTE_RESULT",quoteDuffelStayCore],DUFFEL_CREATE_STAY_BOOKING:["DUFFEL_STAY_BOOKING_RESULT",createStayAndSync],DUFFEL_GET_STAY_BOOKING:["DUFFEL_STAY_BOOKING_RESULT",getStayAndSync],DUFFEL_CANCEL_STAY_BOOKING:["DUFFEL_STAY_CANCEL_RESULT",cancelStayAndSync],
DUFFEL_SEARCH_CARS:["DUFFEL_CARS_RESULT",searchDuffelCarsCore],DUFFEL_QUOTE_CAR:["DUFFEL_CAR_QUOTE_RESULT",quoteDuffelCarCore],DUFFEL_PREPARE_CAR_CARD:["DUFFEL_CAR_CARD_READY",createDuffelComponentClientKeyCore],DUFFEL_CREATE_CAR_BOOKING:["DUFFEL_CAR_BOOKING_RESULT",createCarAndSync],DUFFEL_GET_CAR_BOOKING:["DUFFEL_CAR_BOOKING_RESULT",getCarAndSync],DUFFEL_CANCEL_CAR_BOOKING:["DUFFEL_CAR_CANCEL_RESULT",cancelCarAndSync],
ALTEA_UNIFIED_BOOTSTRAP:["ALTEA_UNIFIED_BOOTSTRAP_RESULT",unifiedBootstrap],ALTEA_SEARCH_BOOKINGS:["ALTEA_BOOKINGS_RESULT",searchAlteaBookingsCore],ALTEA_GET_BOOKING:["ALTEA_BOOKING_RESULT",getAlteaBookingWorkspaceCore],ALTEA_UPDATE_PASSENGER:["ALTEA_PASSENGER_UPDATED",updatePassengerAndRefresh],ALTEA_ADD_HISTORY_NOTE:["ALTEA_HISTORY_UPDATED",addHistoryAndRefresh],ALTEA_UPDATE_DOCUMENT_STATUS:["ALTEA_DOCUMENT_UPDATED",updateDocumentAndRefresh],ALTEA_CREATE_LOCAL_BOOKING:["ALTEA_LOCAL_BOOKING_CREATED",createAlteaLocalBookingCore],ALTEA_UPDATE_COMPONENT:["ALTEA_COMPONENT_UPDATED",updateComponentAndRefresh],ALTEA_CREATE_PASSENGER:["ALTEA_PASSENGER_CREATED",createPassengerAndRefresh],ALTEA_UPDATE_BOOKING:["ALTEA_BOOKING_UPDATED",updateBookingAndRefresh],ALTEA_DELETE_DRAFT_BOOKING:["ALTEA_DRAFT_BOOKING_DELETED",deleteUnconfirmedAlteaBookingCore],ALTEA_AIRPORT_SUGGEST:["ALTEA_AIRPORT_SUGGESTIONS_RESULT",searchReservationAirportsCore],ALTEA_COMPONENT_SUGGESTIONS:["ALTEA_COMPONENT_SUGGESTIONS_RESULT",getReservationComponentSuggestionsCore],
ALTEA_SYNC_DUFFEL_ORDER:["ALTEA_DUFFEL_SYNC_RESULT",syncDuffelOrderToAlteaCore],INVENTORY_SEARCH_SELLABLE:["INVENTORY_SEARCH_RESULT",searchReservationInventoryCore],INVENTORY_ADD_COMPONENT:["INVENTORY_COMPONENT_ADDED",addInventoryAndRefresh],INVENTORY_RELEASE_COMPONENT:["INVENTORY_COMPONENT_RELEASED",releaseInventoryAndRefresh],INVENTORY_BOOKING_STATUS:["INVENTORY_BOOKING_STATUS_RESULT",getReservationInventoryStatusCore],ALTEA_ADD_INVENTORY_COMPONENT:["ALTEA_COMPONENT_UPDATED",addInventoryAndRefresh],
ALTEA_CLUB_SEARCH:["ALTEA_CLUB_SEARCH_RESULT",searchSkandiClubMembersCore],ALTEA_CUSTOMER_PROFILE_GET:["ALTEA_CUSTOMER_PROFILE_RESULT",getCustomerProfileCore],ALTEA_CLUB_LINK_MEMBER:["ALTEA_CLUB_MEMBER_LINKED",linkClubAndRefresh],ALTEA_CLUB_ADJUST_POINTS:["ALTEA_CLUB_MEMBER_UPDATED",pointsAndRefresh],ALTEA_TRAVEL_REQUIREMENTS_CHECK:["ALTEA_TRAVEL_REQUIREMENTS_RESULT",requirementsAndRefresh],
ALTEA_GENERATE_DOCUMENT:["ALTEA_DOCUMENT_GENERATED",documentAndRefresh],ALTEA_PREVIEW_BOOKING_CONFIRMATION:["ALTEA_BOOKING_CONFIRMATION_PREVIEW",previewAlteaBookingConfirmationCore],ALTEA_GET_DOCUMENT:["ALTEA_DOCUMENT_RESULT",getAlteaDocumentCore],ALTEA_SEND_DOCUMENT:["ALTEA_DOCUMENT_SENT",requestAlteaDocumentDeliveryCore],ALTEA_FINALIZE_GENERATED_ASSET:["ALTEA_GENERATED_ASSET_FINALIZED",finalizeGeneratedReservationsAssetCore],ALTEA_DCS_UPDATE_PASSENGER:["ALTEA_DCS_PASSENGER_UPDATED",dcsPassengerAndRefresh],ALTEA_DCS_RECORD_DOCUMENT:["ALTEA_DCS_DOCUMENT_RECORDED",documentAndRefresh],ALTEA_TRANSFER_DCS_BOOTSTRAP:["ALTEA_TRANSFER_DCS_BOOTSTRAP_RESULT",getTransferDcsBootstrapCore],ALTEA_TRANSFER_DCS_UPDATE_PASSENGER:["ALTEA_TRANSFER_DCS_PASSENGER_UPDATED",transferPassengerAndRefresh],ALTEA_TRANSFER_DCS_UPDATE_DEPARTURE:["ALTEA_TRANSFER_DCS_DEPARTURE_UPDATED",transferDepartureAndRefresh],ALTEA_TRANSFER_DCS_RECORD_DOCUMENT:["ALTEA_DCS_DOCUMENT_RECORDED",transferDocumentAndRefresh],ALTEA_SEND_MANIFEST:["ALTEA_MANIFEST_SENT",sendAlteaManifestCore]
});

function resolveActionEntry(type,entry){if(!entry)throw actionError("ALTEA_ACTION_NOT_SUPPORTED","This ALTEA action is not supported by the current backend generation.");let responseType="",handler=null;if(Array.isArray(entry)){responseType=clean(entry[0],100);handler=entry[1];}else if(entry&&typeof entry==="object"){responseType=clean(entry.responseType||entry.resultType,100);handler=entry.handler||entry.run;}if(!responseType)throw actionError("ALTEA_ACTION_CONTRACT_INVALID",`The ${type||"Reservations"} action does not define a valid response contract.`);if(typeof handler!=="function")throw actionError("ALTEA_ACTION_HANDLER_INVALID",`The ${type||"Reservations"} action is not connected to a callable backend handler.`);return{responseType,handler};}
function actionRegistryDiagnostics(){const invalidActions=[];for(const[type,entry]of Object.entries(ACTIONS)){try{resolveActionEntry(type,entry);}catch(error){invalidActions.push({type,code:clean(error?.code||"ALTEA_ACTION_CONTRACT_INVALID",80)});}}return{actionCount:Object.keys(ACTIONS).length,invalidActionCount:invalidActions.length,invalidActions};}
function errorCode(error){const raw=upper(error?.code||error?.message||"ALTEA_ACTION_FAILED",120);return raw.match(/[A-Z][A-Z0-9_]{2,80}/)?.[0]||"ALTEA_ACTION_FAILED";}
function safeErrorMessage(error,code){const explicit=clean(error?.publicMessage||"",500);if(explicit)return explicit;const known={AUTH_REQUIRED:"Your ALTEA staff session has expired. Sign in again.",BOOKING_REQUIRED:"Open a booking before running this action.",BOOKING_NOT_FOUND:"The booking could not be found.",BOOKING_DELETE_NOT_ALLOWED:"Only an empty, unconfirmed booking file can be deleted.",PASSENGER_REQUIRED:"Select a passenger before generating this document.",SKANDI_TRANSFER_AUTHORITY_REQUIRED:"A live SKANDI transfer component is required before a transfer document can be generated.",SKANDI_DCS_AUTHORITY_REQUIRED:"This document requires SKANDI DCS authority.",BAGGAGE_LICENSE_PLATE_10_DIGITS_REQUIRED:"A valid 10-digit baggage license plate is required.",ALTEA_ACTION_NOT_SUPPORTED:"This ALTEA action is not supported by the current backend generation.",ALTEA_ACTION_CONTRACT_INVALID:"The Reservations action contract is invalid. No backend action was executed.",ALTEA_ACTION_HANDLER_INVALID:"The Reservations action is not connected to a callable backend handler."};return known[code]||`ALTEA action failed (${code}).`;}
async function dispatch(input={}){const type=upper(input.type,100),payload=input.payload&&typeof input.payload==="object"?input.payload:{};try{await requireReservationsAccessCore();if(type==="ALTEA_ENTERPRISE_MODULE_READY"){const diagnostics=actionRegistryDiagnostics();return{responseType:"ALTEA_ENTERPRISE_MODULE_ACK",payload:{version:VERSION,reservationsCoreVersion:RESERVATIONS_CORE_VERSION,actionContractVersion:ACTION_CONTRACT_VERSION,actionCount:diagnostics.actionCount,invalidActionCount:diagnostics.invalidActionCount,invalidActions:diagnostics.invalidActions,capabilities:Object.keys(ACTIONS)}};}const{responseType,handler}=resolveActionEntry(type,ACTIONS[type]);const result=await handler(payload);return{responseType,payload:result||{}};}catch(error){const code=errorCode(error);console.error("[ALTEA B-007.7 ACTION]",JSON.stringify({type,code,message:clean(error?.message,500)}));return{responseType:type.startsWith("DUFFEL_")?"DUFFEL_ERROR":"ALTEA_ERROR",payload:{ok:false,action:type,code,message:safeErrorMessage(error,code)}};}}
export const handleReservationsAction=webMethod(Permissions.SiteMember,dispatch);
