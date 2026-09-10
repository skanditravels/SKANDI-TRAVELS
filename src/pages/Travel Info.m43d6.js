// Wix page code: /travel-info
// HTML Component: #travelInfoHtml
// SKANDI Travel Info + Alexandra V9.12

import { getTravelInfoPayload, getTravelInfoAircraft, createTravelInfoSupportRequest, getTravelWeather } from "backend/travelInfoService.web";
import { processAlexandraMessage } from "backend/alexandraBot.web";

const HTML_ID="#travelInfoHtml",SOURCE="SKANDI_PUBLIC_TRAVEL_INFO",PARENT="SKANDI_WIX_PARENT",VERSION="2026.09.10.12";
let loadPromise=null;
let alexandraSession={currentState:"IDLE",userData:{},history:[]};
function clean(v,n=4000){return String(v??"").trim().slice(0,n)}
function parse(v){if(typeof v==="string"){try{return JSON.parse(v)}catch(_){return null}}return v&&typeof v==="object"?v:null}
function getHtml(){try{const e=$w(HTML_ID);return e&&typeof e.onMessage==="function"&&typeof e.postMessage==="function"?e:null}catch(_){return null}}
function post(e,type,payload={}){try{e.postMessage({source:PARENT,type,payload,timestamp:new Date().toISOString()})}catch(_){}}
function err(e,x){post(e,"TRAVEL_INFO_ERROR",{message:clean(x?.publicMessage||x?.message||"Travel information is temporarily unavailable.",500)})}
async function data(e,force=false,settings={}){if(loadPromise&&!force)return loadPromise;loadPromise=(async()=>{try{post(e,"TRAVEL_INFO_PROGRESS",{message:"Loading SKANDI Travel Info…"});const p=await getTravelInfoPayload({language:settings.language||"EN"});post(e,"TRAVEL_INFO_DATA",p);return p}catch(x){err(e,x)}finally{loadPromise=null}})();return loadPromise}
$w.onReady(()=>{const e=getHtml();if(!e){console.error(`[Travel Info V9.12] Missing ${HTML_ID}`);return}e.onMessage(async ev=>{const m=parse(ev?.data);if(!m||m.source!==SOURCE)return;const p=m.payload&&typeof m.payload==="object"?m.payload:{};try{switch(clean(m.type,120)){
case"TRAVEL_INFO_READY":case"TRAVEL_INFO_HTML_READY":await data(e,false,p.settings||{});return;
case"TRAVEL_INFO_REFRESH":await data(e,true,p.settings||{});return;
case"TRAVEL_INFO_REQUEST_AIRCRAFT":post(e,"TRAVEL_INFO_AIRCRAFT_DATA",await getTravelInfoAircraft(p));return;
case"TRAVEL_SUPPORT_REQUEST":post(e,"TRAVEL_SUPPORT_RESULT",await createTravelInfoSupportRequest(p));return;
case"TRAVEL_INFO_WEATHER_REQUEST":post(e,"TRAVEL_INFO_WEATHER",await getTravelWeather(p));return;
case"ALEXANDRA_MESSAGE":case"TRAVEL_INFO_AI_ASK":{const r=await processAlexandraMessage({message:p.message||p.question||"",session:alexandraSession,language:p.language||"EN"});alexandraSession=r.updatedSession||alexandraSession;post(e,"ALEXANDRA_RESPONSE",r);post(e,"TRAVEL_INFO_AI_RESULT",r);return}
case"ALEXANDRA_RESET":alexandraSession={currentState:"IDLE",userData:{},history:[]};post(e,"ALEXANDRA_RESPONSE",{ok:true,reply:"Conversation reset. How can I help?",updatedSession:alexandraSession});return;
default:return}}catch(x){err(e,x)}});post(e,"TRAVEL_INFO_HOST_READY",{protocolVersion:VERSION,embedId:HTML_ID,readyAt:new Date().toISOString()})});
