// /src/pages/ALTEA Reservations.page.js
// Replace the existing ALTEA Reservations Wix page code.
// IMPORTANT: if your Git-managed Wix filename includes an internal page ID,
// retain that filename and replace its COMPLETE contents with this file.

import wixLocation from "wix-location-frontend";
import { handleReservationsAction } from "backend/SKANDI_CORE/reservations.web";

const EMBED_ID="#alteaReservationsEmbed";
const LOGIN="/riaintra";
const CHILD="SKANDI_DUFFEL_RESERVATIONS";
const PARENT="SKANDI_WIX_PARENT";
const VERSION="R-005.1";

function parse(value){
  if(typeof value==="string"){try{return JSON.parse(value)}catch(_){return null}}
  return value&&typeof value==="object"?value:null;
}
function safeRequestId(value){
  const v=String(value||"");
  return /^[A-Za-z0-9_-]{1,100}$/.test(v)?v:"";
}
function post(embed,type,payload={},requestId=""){
  embed.postMessage({source:PARENT,type,payload,requestId,timestamp:new Date().toISOString()});
}
function errorCode(error){
  const raw=String(error?.code||error?.message||"ALTEA_ACTION_FAILED").toUpperCase();
  return raw.match(/[A-Z][A-Z0-9_]{2,60}/)?.[0]||"ALTEA_ACTION_FAILED";
}
function message(error){
  return String(error?.publicMessage||error?.message||"The ALTEA action could not be completed.").slice(0,500);
}
function progressFor(type){
  const map={
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
  };
  return map[type]||"";
}

$w.onReady(()=>{
  const embed=$w(EMBED_ID);

  // Listener FIRST: avoids the historical bootstrap/offline race.
  embed.onMessage(async(event)=>{
    const input=parse(event?.data);
    if(!input||input.source!==CHILD)return;

    const type=String(input.type||"").toUpperCase();
    const requestId=safeRequestId(input.requestId);

    if(type==="MASTER_NAVIGATE"){
      const path=String(input.payload?.path||input.path||"").trim();
      if(path.startsWith("/"))wixLocation.to(path);
      return;
    }

    const progress=progressFor(type);
    if(progress)post(embed,"DUFFEL_PROGRESS",{message:progress},requestId);

    try{
      const result=await handleReservationsAction({
        type,
        payload:input.payload&&typeof input.payload==="object"?input.payload:{}
      });
      if(result?.responseType){
        post(embed,result.responseType,result.payload||{},requestId);
      }
    }catch(error){
      const code=errorCode(error);
      const responseType=type.startsWith("DUFFEL_")?"DUFFEL_ERROR":"ALTEA_ERROR";
      post(embed,responseType,{code,message:message(error)},requestId);
      if(code==="AUTH_REQUIRED")wixLocation.to(LOGIN);
    }
  });

  post(embed,"DUFFEL_PARENT_READY",{
    embedId:EMBED_ID,
    version:VERSION,
    unified:true,
    onePageFacade:true,
    inventoryControl:true,
    enterprise:true,
    transferDcs:true,
    skandiClub:true,
    documents:true,
    platformAssetDocuments:true
  });

  // Seed Inventory through the same canonical facade; no second backend import.
  Promise.resolve(
    handleReservationsAction({type:"INVENTORY_SEARCH_SELLABLE",payload:{query:""}})
  ).then(result=>{
    if(result?.responseType)post(embed,result.responseType,result.payload||{});
  }).catch(()=>{});
});
