// /src/pages/Inventory Control.jsdik.js
// SKANDI Inventory Control — R-003.8 canonical page bridge.
// Preferred HTML component: #inventoryControlEmbed

import {
  getInventoryBootstrap,getInventoryRecord,saveInventoryBundle,archiveInventoryRecord,
  getDatedInventory,saveDatedInventory,deleteDatedInventory,
  getAirInventory,saveAirInventoryRow,
  getAircraftRecord,saveAircraft,archiveAircraft,saveAircraftChild,archiveAircraftChild,
  smartSyncAircraft,getCabinNormalizationPreview,getInventoryAudit,getInventoryQuality,
  searchInventoryProvider,getInventoryProviderResource,importInventoryProviderResource,refreshInventoryProviderResource,
  listInventoryNegotiatedRates,getInventoryNegotiatedRate,createInventoryNegotiatedRate,updateInventoryNegotiatedRate,deleteInventoryNegotiatedRate,
  listAssetLibrary,checkAssetLibraryDuplicate,prepareAssetLibraryUpload,finalizeAssetLibraryUpload,
  getAssetLibraryAccessUrl,registerAssetLibraryUsage,archiveAssetLibraryItem
} from "backend/SKANDI_CORE/inventoryControl.web";

const EMBED_IDS=["#inventoryControlEmbed","#alteaInventoryControlEmbed","#masterInventoryEmbed"];
const CHILD_SOURCE="SKANDI_INVENTORY_EMBED";
const PARENT_SOURCE="SKANDI_INVENTORY_PARENT";
const VERSION="R-003.8";

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
    INVENTORY_PARENT_CYCLE:"That parent selection would create a geography loop.",
    ASSET_AUTH_REQUIRED:"Your staff session has expired. Sign in again.",
    ASSET_WRITE_ACCESS_DENIED:"Your role does not allow Asset Library uploads.",
    ASSET_MIME_NOT_ALLOWED:"That file type is not allowed in this Asset Library.",
    ASSET_FILE_TOO_LARGE:"That file exceeds the Asset Library size limit.",
    ASSET_FOLDER_REQUIRED:"Choose an Asset Library root and folder before uploading.",
    INVENTORY_PROVIDER_TYPE_UNSUPPORTED:"That Duffel reference type is not supported by Inventory Control.",
    INVENTORY_PROVIDER_IMPORT_TYPE_UNSUPPORTED:"That Duffel reference can be searched but is not importable into the current Inventory model.",
    INVENTORY_PROVIDER_CANONICAL_MATCH:"A matching SKANDI record already exists. Link Duffel to the existing record instead of creating a duplicate.",
    INVENTORY_NON_IATA_AIRLINE_SCHEMA_REQUIRED:"This airline has no IATA code. It can be used as Duffel reference data, but the current SKANDI airline store needs a separate internal-code field before it can be imported safely.",
    INVENTORY_DUFFEL_SOURCE_REQUIRED:"This record is not linked to a Duffel source resource and cannot be refreshed from Duffel.",
    REFERENCE_QUERY_REQUIRED:"Enter a search term.",
    NEGOTIATED_RATE_SCOPE_REQUIRED:"Choose a hotel chain or at least one accommodation for the negotiated rate.",
    NEGOTIATED_RATE_SCOPE_INVALID:"Choose either a hotel chain or specific accommodations, not both."
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
  INVENTORY_V9_CABIN_NORMALIZATION_PREVIEW:{response:"INVENTORY_V9_CABIN_NORMALIZATION_RESULT",run:getCabinNormalizationPreview},
  INVENTORY_PROVIDER_SEARCH:{response:"INVENTORY_PROVIDER_SEARCH_RESULT",run:searchInventoryProvider},
  INVENTORY_PROVIDER_GET_RESOURCE:{response:"INVENTORY_PROVIDER_RESOURCE",run:getInventoryProviderResource},
  INVENTORY_PROVIDER_IMPORT:{response:"INVENTORY_PROVIDER_IMPORTED",run:importInventoryProviderResource},
  INVENTORY_PROVIDER_REFRESH:{response:"INVENTORY_PROVIDER_REFRESHED",run:refreshInventoryProviderResource},
  INVENTORY_NEGOTIATED_RATES_LIST:{response:"INVENTORY_NEGOTIATED_RATES_RESULT",run:listInventoryNegotiatedRates},
  INVENTORY_NEGOTIATED_RATE_GET:{response:"INVENTORY_NEGOTIATED_RATE_RESULT",run:getInventoryNegotiatedRate},
  INVENTORY_NEGOTIATED_RATE_CREATE:{response:"INVENTORY_NEGOTIATED_RATE_SAVED",run:createInventoryNegotiatedRate},
  INVENTORY_NEGOTIATED_RATE_UPDATE:{response:"INVENTORY_NEGOTIATED_RATE_SAVED",run:updateInventoryNegotiatedRate},
  INVENTORY_NEGOTIATED_RATE_DELETE:{response:"INVENTORY_NEGOTIATED_RATE_DELETED",run:deleteInventoryNegotiatedRate},
  INVENTORY_ASSET_LIST:{response:"INVENTORY_ASSET_LIST_RESULT",run:listAssetLibrary},
  INVENTORY_ASSET_CHECK_DUPLICATE:{response:"INVENTORY_ASSET_DUPLICATE_RESULT",run:checkAssetLibraryDuplicate},
  INVENTORY_ASSET_PREPARE_UPLOAD:{response:"INVENTORY_ASSET_UPLOAD_PREPARED",run:prepareAssetLibraryUpload},
  INVENTORY_ASSET_FINALIZE_UPLOAD:{response:"INVENTORY_ASSET_UPLOAD_FINALIZED",run:finalizeAssetLibraryUpload},
  INVENTORY_ASSET_ACCESS_URL:{response:"INVENTORY_ASSET_ACCESS_URL_RESULT",run:getAssetLibraryAccessUrl},
  INVENTORY_ASSET_REGISTER_USAGE:{response:"INVENTORY_ASSET_USAGE_REGISTERED",run:registerAssetLibraryUsage},
  INVENTORY_ASSET_ARCHIVE:{response:"INVENTORY_ASSET_ARCHIVED",run:archiveAssetLibraryItem}
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
        "INVENTORY_V9_ARCHIVE_AIRCRAFT_CHILD","INVENTORY_V9_SMART_SYNC_AIRCRAFT",
        "INVENTORY_PROVIDER_IMPORT","INVENTORY_PROVIDER_REFRESH"
      ].includes(message.type)){
        post(embed,"INVENTORY_V9_BOOTSTRAP",await getInventoryBootstrap(),requestId);
      }
    }catch(error){
      post(embed,"INVENTORY_ERROR",errorPayload(error),requestId);
    }
  });

  post(embed,"INVENTORY_V9_HOST_READY",{version:VERSION,embedId:embed.id||"",readyAt:new Date().toISOString()});
});
