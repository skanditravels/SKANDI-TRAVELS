// Wix page code: /travel-info
// HTML Component: #travelInfoHtml
// SKANDI Travel Info V9 — listener-first bridge; masterPage owns global chrome/navigation.

import { getTravelInfoPayload, getTravelInfoAircraft, createTravelInfoSupportRequest, getTravelWeather, askTravelInfoAgent } from "backend/travelInfoService.web";

const HTML_ID="#travelInfoHtml";
const SOURCE="SKANDI_PUBLIC_TRAVEL_INFO";
const PARENT="SKANDI_WIX_PARENT";
const VERSION="2026.09.10.9";
let loadPromise=null;

function clean(v,max=4000){return String(v??"").trim().slice(0,max)}
function parse(data){if(typeof data==="string"){try{return JSON.parse(data)}catch(_){return null}}return data&&typeof data==="object"?data:null}
function html(){try{const el=$w(HTML_ID);return el&&typeof el.onMessage==="function"&&typeof el.postMessage==="function"?el:null}catch(_){return null}}
function post(el,type,payload={}){try{el.postMessage({source:PARENT,type,payload,timestamp:new Date().toISOString()})}catch(_){}}
function error(el,e){post(el,"TRAVEL_INFO_ERROR",{message:clean(e?.publicMessage||e?.message||"Travel information is temporarily unavailable.",500)})}
async function sendData(el,force=false,settings={}){
  if(loadPromise&&!force)return loadPromise;
  loadPromise=(async()=>{try{post(el,"TRAVEL_INFO_PROGRESS",{message:"Loading SKANDI Travel Info…"});const data=await getTravelInfoPayload({language:settings.language||"EN"});post(el,"TRAVEL_INFO_DATA",data);return data}catch(e){error(el,e)}finally{loadPromise=null}})();
  return loadPromise;
}

$w.onReady(()=>{
  const el=html(); if(!el){console.error(`[Travel Info V9] Missing ${HTML_ID}`);return}
  el.onMessage(async event=>{
    const m=parse(event?.data); if(!m||m.source!==SOURCE)return;
    const p=m.payload&&typeof m.payload==="object"?m.payload:{};
    try{
      switch(clean(m.type,120)){
        case "TRAVEL_INFO_READY": case "TRAVEL_INFO_HTML_READY": await sendData(el,false,p.settings||{}); return;
        case "TRAVEL_INFO_REFRESH": await sendData(el,true,p.settings||{}); return;
        case "TRAVEL_INFO_REQUEST_AIRCRAFT": post(el,"TRAVEL_INFO_AIRCRAFT_DATA",await getTravelInfoAircraft(p)); return;
        case "TRAVEL_SUPPORT_REQUEST": post(el,"TRAVEL_SUPPORT_RESULT",await createTravelInfoSupportRequest(p)); return;
        case "TRAVEL_INFO_WEATHER_REQUEST": post(el,"TRAVEL_INFO_WEATHER",await getTravelWeather(p)); return;
        case "TRAVEL_INFO_AI_ASK": post(el,"TRAVEL_INFO_AI_RESULT",await askTravelInfoAgent(p)); return;
        default:return;
      }
    }catch(e){error(el,e)}
  });
  post(el,"TRAVEL_INFO_HOST_READY",{protocolVersion:VERSION,embedId:HTML_ID,readyAt:new Date().toISOString()});
});
