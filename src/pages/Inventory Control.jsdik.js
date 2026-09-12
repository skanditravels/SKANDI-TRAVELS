// /src/pages/Inventory Control.jsdik.js
// SKANDI Backend Base 1.0 — B-003+B-004 Inventory page bridge.
// Preferred HTML component: #inventoryControlEmbed

import * as inventoryApi from "backend/SKANDI_CORE/inventory.web";

const EMBED_IDS=["#inventoryControlEmbed","#alteaInventoryControlEmbed","#masterInventoryEmbed"];
const CHILD_SOURCE="SKANDI_INVENTORY_EMBED";
const PARENT_SOURCE="SKANDI_INVENTORY_PARENT";
const VERSION="BACKEND-BASE-1.0/B-003+B-004";

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
let bootstrapPromise=null;
let bootstrapSnapshot=null;
let bootstrapSnapshotAt=0;
const BOOTSTRAP_REUSE_MS=15000;

function requireBackendMethod(name){
  const fn=inventoryApi?.[name];
  if(typeof fn!=="function"){
    const error=new Error("INVENTORY_WEB_FACADE_MISMATCH");
    error.code="INVENTORY_WEB_FACADE_MISMATCH";
    error.publicMessage=`Inventory Control backend contract is out of sync. Missing web method: ${name}. Publish /src/backend/SKANDI_CORE/inventory.web.js together with this page.`;
    throw error;
  }
  return fn;
}

function callBackend(name,payload={}){
  return requireBackendMethod(name)(payload);
}

async function loadInventoryBootstrap({force=false}={}){
  if(!force && bootstrapSnapshot && Date.now()-bootstrapSnapshotAt<BOOTSTRAP_REUSE_MS){
    return bootstrapSnapshot;
  }
  if(bootstrapPromise)return bootstrapPromise;
  bootstrapPromise=Promise.resolve()
    .then(()=>callBackend("getInventoryBootstrap"))
    .then((value)=>{
      bootstrapSnapshot=value;
      bootstrapSnapshotAt=Date.now();
      return value;
    })
    .finally(()=>{bootstrapPromise=null});
  return bootstrapPromise;
}

function invalidateBootstrap(){
  bootstrapSnapshot=null;
  bootstrapSnapshotAt=0;
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
    INVENTORY_ASSET_LIBRARY_REQUIRED:"Choose this image from the SKANDI Asset Library. New direct image URLs are not accepted.",
    INVENTORY_PUBLIC_ASSET_REQUIRED:"Inventory website media must use a public Asset Library file.",
    INVENTORY_ASSET_NOT_FOUND:"The selected Asset Library file no longer exists or is archived.",
    INVENTORY_ASSET_ID_INVALID:"The selected Asset Library reference is invalid.",
    INVENTORY_ASSET_PUBLIC_URL_MISSING:"The selected public Asset Library file has no usable public URL.",
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
    INVENTORY_WEB_FACADE_MISMATCH:"Inventory Control page and backend facade are out of sync. Publish the canonical inventory.web.js together with this page.",
    REFERENCE_QUERY_REQUIRED:"Enter a search term.",
    NEGOTIATED_RATE_SCOPE_REQUIRED:"Choose a hotel chain or at least one accommodation for the negotiated rate.",
    NEGOTIATED_RATE_SCOPE_INVALID:"Choose either a hotel chain or specific accommodations, not both."
  };
  return{code,message:friendly[code]||String(error?.publicMessage||error?.message||"Inventory request failed.").slice(0,700)};
}

const ACTIONS={
  INVENTORY_V9_REFRESH:{response:"INVENTORY_V9_BOOTSTRAP",run:()=>loadInventoryBootstrap({force:true})},
  INVENTORY_V9_GET_RECORD:{response:"INVENTORY_V9_RECORD",run:payload=>callBackend("getInventoryRecord",payload)},
  INVENTORY_V9_SAVE_BUNDLE:{response:"INVENTORY_V9_SAVED",run:payload=>callBackend("saveInventoryBundle",payload)},
  INVENTORY_V9_ARCHIVE_RECORD:{response:"INVENTORY_V9_ARCHIVED",run:payload=>callBackend("archiveInventoryRecord",payload)},
  INVENTORY_V9_GET_DATED:{response:"INVENTORY_V9_DATED",run:payload=>callBackend("getDatedInventory",payload)},
  INVENTORY_V9_SAVE_DATED:{response:"INVENTORY_V9_DATED_SAVED",run:payload=>callBackend("saveDatedInventory",payload)},
  INVENTORY_V9_DELETE_DATED:{response:"INVENTORY_V9_DATED_DELETED",run:payload=>callBackend("deleteDatedInventory",payload)},
  INVENTORY_V9_GET_AIR:{response:"INVENTORY_V9_AIR",run:payload=>callBackend("getAirInventory",payload)},
  INVENTORY_V9_SAVE_AIR_ROW:{response:"INVENTORY_V9_AIR_SAVED",run:payload=>callBackend("saveAirInventoryRow",payload)},
  INVENTORY_V9_GET_AUDIT:{response:"INVENTORY_V9_AUDIT",run:payload=>callBackend("getInventoryAudit",payload)},
  INVENTORY_V9_QUALITY:{response:"INVENTORY_V9_QUALITY_RESULT",run:payload=>callBackend("getInventoryQuality",payload)},
  INVENTORY_V9_GET_AIRCRAFT:{response:"INVENTORY_V9_AIRCRAFT_RECORD",run:payload=>callBackend("getAircraftRecord",payload)},
  INVENTORY_V9_SAVE_AIRCRAFT:{response:"INVENTORY_V9_AIRCRAFT_SAVED",run:payload=>callBackend("saveAircraft",payload)},
  INVENTORY_V9_ARCHIVE_AIRCRAFT:{response:"INVENTORY_V9_AIRCRAFT_ARCHIVED",run:payload=>callBackend("archiveAircraft",payload)},
  INVENTORY_V9_SAVE_AIRCRAFT_CHILD:{response:"INVENTORY_V9_AIRCRAFT_CHILD_SAVED",run:payload=>callBackend("saveAircraftChild",payload)},
  INVENTORY_V9_ARCHIVE_AIRCRAFT_CHILD:{response:"INVENTORY_V9_AIRCRAFT_CHILD_ARCHIVED",run:payload=>callBackend("archiveAircraftChild",payload)},
  INVENTORY_V9_SMART_SYNC_AIRCRAFT:{response:"INVENTORY_V9_SMART_SYNC_RESULT",run:payload=>callBackend("smartSyncAircraft",payload)},
  INVENTORY_V9_CABIN_NORMALIZATION_PREVIEW:{response:"INVENTORY_V9_CABIN_NORMALIZATION_RESULT",run:payload=>callBackend("getCabinNormalizationPreview",payload)},
  INVENTORY_PROVIDER_SEARCH:{response:"INVENTORY_PROVIDER_SEARCH_RESULT",run:payload=>callBackend("searchInventoryProvider",payload)},
  INVENTORY_PROVIDER_GET_RESOURCE:{response:"INVENTORY_PROVIDER_RESOURCE",run:payload=>callBackend("getInventoryProviderResource",payload)},
  INVENTORY_PROVIDER_IMPORT:{response:"INVENTORY_PROVIDER_IMPORTED",run:payload=>callBackend("importInventoryProviderResource",payload)},
  INVENTORY_PROVIDER_REFRESH:{response:"INVENTORY_PROVIDER_REFRESHED",run:payload=>callBackend("refreshInventoryProviderResource",payload)},
  INVENTORY_NEGOTIATED_RATES_LIST:{response:"INVENTORY_NEGOTIATED_RATES_RESULT",run:payload=>callBackend("listInventoryNegotiatedRates",payload)},
  INVENTORY_NEGOTIATED_RATE_GET:{response:"INVENTORY_NEGOTIATED_RATE_RESULT",run:payload=>callBackend("getInventoryNegotiatedRate",payload)},
  INVENTORY_NEGOTIATED_RATE_CREATE:{response:"INVENTORY_NEGOTIATED_RATE_SAVED",run:payload=>callBackend("createInventoryNegotiatedRate",payload)},
  INVENTORY_NEGOTIATED_RATE_UPDATE:{response:"INVENTORY_NEGOTIATED_RATE_SAVED",run:payload=>callBackend("updateInventoryNegotiatedRate",payload)},
  INVENTORY_NEGOTIATED_RATE_DELETE:{response:"INVENTORY_NEGOTIATED_RATE_DELETED",run:payload=>callBackend("deleteInventoryNegotiatedRate",payload)},
  INVENTORY_ASSET_LIST:{response:"INVENTORY_ASSET_LIST_RESULT",run:payload=>callBackend("listAssetLibrary",payload)},
  INVENTORY_ASSET_CHECK_DUPLICATE:{response:"INVENTORY_ASSET_DUPLICATE_RESULT",run:payload=>callBackend("checkAssetLibraryDuplicate",payload)},
  INVENTORY_ASSET_PREPARE_UPLOAD:{response:"INVENTORY_ASSET_UPLOAD_PREPARED",run:payload=>callBackend("prepareAssetLibraryUpload",payload)},
  INVENTORY_ASSET_FINALIZE_UPLOAD:{response:"INVENTORY_ASSET_UPLOAD_FINALIZED",run:payload=>callBackend("finalizeAssetLibraryUpload",payload)},
  INVENTORY_ASSET_ACCESS_URL:{response:"INVENTORY_ASSET_ACCESS_URL_RESULT",run:payload=>callBackend("getAssetLibraryAccessUrl",payload)},
  INVENTORY_ASSET_REGISTER_USAGE:{response:"INVENTORY_ASSET_USAGE_REGISTERED",run:payload=>callBackend("registerAssetLibraryUsage",payload)},
  INVENTORY_ASSET_ARCHIVE:{response:"INVENTORY_ASSET_ARCHIVED",run:payload=>callBackend("archiveAssetLibraryItem",payload)}
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
        post(embed,"INVENTORY_V9_BOOTSTRAP",await loadInventoryBootstrap(),requestId);
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
        invalidateBootstrap();
        post(embed,"INVENTORY_V9_BOOTSTRAP",await loadInventoryBootstrap({force:true}),requestId);
      }
    }catch(error){
      post(embed,"INVENTORY_ERROR",errorPayload(error),requestId);
    }
  });

  post(embed,"INVENTORY_V9_HOST_READY",{version:VERSION,embedId:embed.id||"",readyAt:new Date().toISOString()});
});
