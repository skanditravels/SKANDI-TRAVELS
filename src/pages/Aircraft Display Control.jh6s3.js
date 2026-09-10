// Wix page code: /riaintra/aircraft-display-control
// HTML Component: #aircraftDisplayControlEmbed (legacy fallback #aircraftControlEmbed)
// SKANDI Aircraft Display Control V9

import { getAircraftControlBootstrap, getAircraftControlRecord, saveAircraftControl, archiveAircraftControl, saveAircraftControlChild, archiveAircraftControlChild, smartFillAircraft, getCabinNormalizationPreview } from "backend/RIA/aircraftDisplayControl.web";

const IDS=["#aircraftDisplayControlEmbed","#aircraftControlEmbed"];
const SOURCE="SKANDI_AIRCRAFT_DISPLAY_CONTROL";
const PARENT="SKANDI_WIX_PARENT";
const VERSION="2026.09.10.9";
function parse(v){if(typeof v==="string"){try{return JSON.parse(v)}catch(_){return null}}return v&&typeof v==="object"?v:null}
function find(){for(const id of IDS){try{const e=$w(id);if(e&&typeof e.onMessage==="function"&&typeof e.postMessage==="function")return e}catch(_){}}return null}
function post(e,type,payload={},requestId=""){try{e.postMessage({source:PARENT,type,payload,requestId,timestamp:new Date().toISOString()})}catch(_){}}
function fail(e,err,requestId=""){post(e,"AIRCRAFT_CONTROL_ERROR",{message:String(err?.publicMessage||err?.message||"Aircraft Display Control request failed.").slice(0,500)},requestId)}
async function bootstrap(e){post(e,"AIRCRAFT_CONTROL_BOOTSTRAP",await getAircraftControlBootstrap())}
$w.onReady(()=>{
  const e=find();if(!e){console.error("[Aircraft Display Control V9] HTML embed not found.");return}
  e.onMessage(async event=>{const m=parse(event?.data);if(!m||m.source!==SOURCE)return;const p=m.payload&&typeof m.payload==="object"?m.payload:{};try{
    switch(String(m.type||"")){
      case "AIRCRAFT_CONTROL_READY":case "AIRCRAFT_CONTROL_REFRESH":await bootstrap(e);return;
      case "AIRCRAFT_CONTROL_GET":post(e,"AIRCRAFT_CONTROL_RECORD",await getAircraftControlRecord(p),m.requestId);return;
      case "AIRCRAFT_CONTROL_SAVE":post(e,"AIRCRAFT_CONTROL_SAVED",await saveAircraftControl(p),m.requestId);return;
      case "AIRCRAFT_CONTROL_DELETE":post(e,"AIRCRAFT_CONTROL_DELETED",await archiveAircraftControl(p),m.requestId);return;
      case "AIRCRAFT_CONTROL_CHILD_SAVE":post(e,"AIRCRAFT_CONTROL_CHILD_SAVED",await saveAircraftControlChild(p),m.requestId);return;
      case "AIRCRAFT_CONTROL_CHILD_DELETE":post(e,"AIRCRAFT_CONTROL_CHILD_DELETED",await archiveAircraftControlChild(p),m.requestId);return;
      case "AIRCRAFT_CONTROL_SMART_FILL":post(e,"AIRCRAFT_CONTROL_SMART_FILL_RESULT",await smartFillAircraft(p),m.requestId);return;
      case "AIRCRAFT_CONTROL_CABIN_NORMALIZATION_PREVIEW":post(e,"AIRCRAFT_CONTROL_CABIN_NORMALIZATION_RESULT",await getCabinNormalizationPreview(),m.requestId);return;
      default:return;
    }}catch(err){fail(e,err,m.requestId)}});
  post(e,"AIRCRAFT_CONTROL_HOST_READY",{protocolVersion:VERSION,embedId:e.id||"",readyAt:new Date().toISOString()});
});
