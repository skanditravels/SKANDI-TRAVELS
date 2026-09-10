// /src/pages/Inventory Control.jsdik.js
// SKANDI Inventory Control — R-003 canonical page bridge.
// Preferred HTML component: #inventoryControlEmbed

import {
  getInventoryBootstrap,getInventoryRecord,saveInventoryBundle,archiveInventoryRecord,
  getDatedInventory,saveDatedInventory,deleteDatedInventory,
  getAirInventory,saveAirInventoryRow,
  getAircraftRecord,saveAircraft,archiveAircraft,saveAircraftChild,archiveAircraftChild,
  smartSyncAircraft,getCabinNormalizationPreview,getInventoryAudit,getInventoryQuality
} from "backend/SKANDI_CORE/inventory.web";

const EMBED_IDS=["#inventoryControlEmbed","#alteaInventoryControlEmbed","#masterInventoryEmbed"];
const CHILD_SOURCE="SKANDI_INVENTORY_EMBED";
const PARENT_SOURCE="SKANDI_INVENTORY_PARENT";
const VERSION="R-003.1";

function findEmbed(){
  for(const id of EMBED_IDS){
    try{
      const el=$w(id);
      if(el&&typeof el.onMessage==="function"&&typeof el.postMessage==="function")return el;
    }catch(_){}
  }
  return null;
}
function parse(value){
  if(typeof value==="string"){try{return JSON.parse(value)}catch(_){return null}}
  return value&&typeof value==="object"?value:null;
}
function post(embed,type,payload={},requestId=""){
  embed.postMessage({source:PARENT_SOURCE,type,payload,requestId,timestamp:new Date().toISOString()});
}
function errorPayload(error){
  const code=String(error?.code||error?.message||"INVENTORY_ERROR").slice(0,120);
  const friendly={
    INVENTORY_AUTH_REQUIRED:"Your staff session has expired. Sign in again.",
    INVENTORY_ACCESS_DENIED:"You do not have access to Inventory Control.",
    INVENTORY_WRITE_ACCESS_DENIED:"Your role does not allow this Inventory change.",
    INVENTORY_DUPLICATE_CODE:"That code is already in use for this record family.",
    INVENTORY_DUPLICATE_SLUG:"That URL slug is already in use for this record family.",
    INVENTORY_PARENT_CYCLE:"That parent selection would create a geography loop."
  };
  return{code,message:friendly[code]||String(error?.publicMessage||error?.message||"Inventory request failed.").slice(0,700)};
}

const ACTIONS={
  INVENTORY_V9_REFRESH:{response:"INVENTORY_V9_BOOTSTRAP",run:getInventoryBootstrap},
  INVENTORY_V9_GET_RECORD:{response:"INVENTORY_V9_RECORD",run:getInventoryRecord},
  INVENTORY_V9_SAVE_BUNDLE:{response:"INVENTORY_V9_SAVED",run:saveInventoryBundle},
  INVENTORY_V9_ARCHIVE_RECORD:{response:"INVENTORY_V9_ARCHIVED",run:archiveInventoryRecord},
  INVENTORY_V9_GET_DATED:{response:"INVENTORY_V9_DATED",run:getDatedInventory},
  INVENTORY_V9_SAVE_DATED:{response:"INVENTORY_V9_DATED_SAVED",run:saveDatedInventory},
  INVENTORY_V9_DELETE_DATED:{response:"INVENTORY_V9_DATED_DELETED",run:deleteDatedInventory},
  INVENTORY_V9_GET_AIR:{response:"INVENTORY_V9_AIR",run:getAirInventory},
  INVENTORY_V9_SAVE_AIR_ROW:{response:"INVENTORY_V9_AIR_SAVED",run:saveAirInventoryRow},
  INVENTORY_V9_GET_AUDIT:{response:"INVENTORY_V9_AUDIT",run:getInventoryAudit},
  INVENTORY_V9_QUALITY:{response:"INVENTORY_V9_QUALITY_RESULT",run:getInventoryQuality},
  INVENTORY_V9_GET_AIRCRAFT:{response:"INVENTORY_V9_AIRCRAFT_RECORD",run:getAircraftRecord},
  INVENTORY_V9_SAVE_AIRCRAFT:{response:"INVENTORY_V9_AIRCRAFT_SAVED",run:saveAircraft},
  INVENTORY_V9_ARCHIVE_AIRCRAFT:{response:"INVENTORY_V9_AIRCRAFT_ARCHIVED",run:archiveAircraft},
  INVENTORY_V9_SAVE_AIRCRAFT_CHILD:{response:"INVENTORY_V9_AIRCRAFT_CHILD_SAVED",run:saveAircraftChild},
  INVENTORY_V9_ARCHIVE_AIRCRAFT_CHILD:{response:"INVENTORY_V9_AIRCRAFT_CHILD_ARCHIVED",run:archiveAircraftChild},
  INVENTORY_V9_SMART_SYNC_AIRCRAFT:{response:"INVENTORY_V9_SMART_SYNC_RESULT",run:smartSyncAircraft},
  INVENTORY_V9_CABIN_NORMALIZATION_PREVIEW:{response:"INVENTORY_V9_CABIN_NORMALIZATION_RESULT",run:getCabinNormalizationPreview}
};

$w.onReady(()=>{
  const embed=findEmbed();
  if(!embed){console.error("[SKANDI Inventory] #inventoryControlEmbed not found.");return}

  // Listener first: prevents the historical offline race.
  embed.onMessage(async(event)=>{
    const message=parse(event?.data);
    if(!message||message.source!==CHILD_SOURCE)return;
    const payload=message.payload&&typeof message.payload==="object"?message.payload:{};
    const requestId=message.requestId||"";

    try{
      if(message.type==="INVENTORY_V9_READY"){
        post(embed,"INVENTORY_V9_BOOTSTRAP",await getInventoryBootstrap(),requestId);
        return;
      }
      const action=ACTIONS[message.type];
      if(!action)return;
      post(embed,"INVENTORY_V9_PROGRESS",{action:message.type},requestId);
      const result=await action.run(payload);
      post(embed,action.response,result||{},requestId);
      if(message.type!=="INVENTORY_V9_REFRESH" && [
        "INVENTORY_V9_SAVE_BUNDLE","INVENTORY_V9_ARCHIVE_RECORD","INVENTORY_V9_SAVE_DATED",
        "INVENTORY_V9_DELETE_DATED","INVENTORY_V9_SAVE_AIR_ROW","INVENTORY_V9_SAVE_AIRCRAFT",
        "INVENTORY_V9_ARCHIVE_AIRCRAFT","INVENTORY_V9_SAVE_AIRCRAFT_CHILD",
        "INVENTORY_V9_ARCHIVE_AIRCRAFT_CHILD","INVENTORY_V9_SMART_SYNC_AIRCRAFT"
      ].includes(message.type)){
        post(embed,"INVENTORY_V9_BOOTSTRAP",await getInventoryBootstrap(),requestId);
      }
    }catch(error){
      post(embed,"INVENTORY_ERROR",errorPayload(error),requestId);
    }
  });

  post(embed,"INVENTORY_V9_HOST_READY",{version:VERSION,embedId:embed.id||"",readyAt:new Date().toISOString()});
});
