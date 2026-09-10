// Wix page code — Unified Inventory Control V9.12
// Route: /riaintra/success-factors/altea/inventory-control
// Preferred HTML Component: #inventoryControlEmbed

import {
  getUnifiedInventoryBootstrap,getUnifiedInventoryRecord,saveUnifiedInventoryRecord,
  saveInventoryLocalizedContent,saveInventoryMediaAsset,saveInventoryDatedRow,saveAirInventoryRow,getInventoryQualityReport,
  getAircraftControlRecord,saveAircraftControl,archiveAircraftControl,saveAircraftControlChild,archiveAircraftControlChild,
  smartFillAircraft,smartSyncAllAircraft,getCabinNormalizationPreview
} from "backend/RIA/inventoryControlV9.web";

const IDS=["#inventoryControlEmbed","#alteaInventoryControlEmbed","#masterInventoryEmbed"];
const CHILD="SKANDI_INVENTORY_EMBED";
const PARENT="SKANDI_WIX_PARENT";
const VERSION="2026.09.10.12";
function find(){for(const id of IDS){try{const e=$w(id);if(e&&typeof e.onMessage==="function"&&typeof e.postMessage==="function")return e}catch(_){}}return null}
function parse(v){if(typeof v==="string"){try{return JSON.parse(v)}catch(_){return null}}return v&&typeof v==="object"?v:null}
function post(e,type,payload={},requestId=""){try{e.postMessage({source:PARENT,type,payload,requestId,timestamp:new Date().toISOString()})}catch(_){}}
function fail(e,error,requestId=""){post(e,"INVENTORY_ERROR",{code:String(error?.code||"INVENTORY_ERROR"),message:String(error?.publicMessage||error?.message||"Inventory request failed.").slice(0,700)},requestId)}
async function bootstrap(e){post(e,"INVENTORY_BOOTSTRAP",await getUnifiedInventoryBootstrap())}
const ACTIONS={
  INVENTORY_REFRESH:{type:"INVENTORY_BOOTSTRAP",run:getUnifiedInventoryBootstrap},
  INVENTORY_GET_RECORD:{type:"INVENTORY_RECORD",run:getUnifiedInventoryRecord},
  INVENTORY_SAVE_RECORD:{type:"INVENTORY_RECORD_SAVED",run:saveUnifiedInventoryRecord},
  INVENTORY_SAVE_LOCALIZED:{type:"INVENTORY_LOCALIZED_SAVED",run:saveInventoryLocalizedContent},
  INVENTORY_SAVE_MEDIA:{type:"INVENTORY_MEDIA_SAVED",run:saveInventoryMediaAsset},
  INVENTORY_SAVE_DATED:{type:"INVENTORY_DATED_SAVED",run:saveInventoryDatedRow},
  INVENTORY_SAVE_AIR_ROW:{type:"INVENTORY_AIR_ROW_SAVED",run:saveAirInventoryRow},
  INVENTORY_QUALITY_REPORT:{type:"INVENTORY_QUALITY_RESULT",run:getInventoryQualityReport},
  INVENTORY_GET_AIRCRAFT:{type:"INVENTORY_AIRCRAFT_RECORD",run:p=>getAircraftControlRecord({aircraftId:p.aircraftId||p.id})},
  INVENTORY_SAVE_AIRCRAFT:{type:"INVENTORY_AIRCRAFT_SAVED",run:p=>saveAircraftControl({aircraft:p.aircraft||p})},
  INVENTORY_ARCHIVE_AIRCRAFT:{type:"INVENTORY_AIRCRAFT_ARCHIVED",run:p=>archiveAircraftControl({aircraftId:p.aircraftId||p.id})},
  INVENTORY_SAVE_AIRCRAFT_CHILD:{type:"INVENTORY_AIRCRAFT_CHILD_SAVED",run:saveAircraftControlChild},
  INVENTORY_ARCHIVE_AIRCRAFT_CHILD:{type:"INVENTORY_AIRCRAFT_CHILD_ARCHIVED",run:archiveAircraftControlChild},
  INVENTORY_SMART_FILL_AIRCRAFT:{type:"INVENTORY_SMART_FILL_RESULT",run:smartFillAircraft},
  INVENTORY_SMART_SYNC_AIRCRAFT:{type:"INVENTORY_SMART_SYNC_RESULT",run:smartSyncAllAircraft},
  INVENTORY_CABIN_NORMALIZATION_PREVIEW:{type:"INVENTORY_CABIN_NORMALIZATION_RESULT",run:getCabinNormalizationPreview}
};
$w.onReady(()=>{const e=find();if(!e){console.error("[Inventory V9.12] HTML component not found");return}e.onMessage(async event=>{const m=parse(event?.data);if(!m||m.source!==CHILD)return;const p=m.payload&&typeof m.payload==="object"?m.payload:{};try{if(m.type==="INVENTORY_V9_READY"){await bootstrap(e);return}const a=ACTIONS[m.type];if(!a)return;post(e,"INVENTORY_PROGRESS",{action:m.type});const result=await a.run(p);post(e,a.type,result||{},m.requestId||"")}catch(err){fail(e,err,m.requestId||"")}});post(e,"INVENTORY_HOST_READY",{protocolVersion:VERSION,embedId:e.id||"",readyAt:new Date().toISOString()})});
