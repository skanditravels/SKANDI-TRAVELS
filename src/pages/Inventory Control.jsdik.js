import {
  getSmartInventoryBootstrap,
  getSmartInventoryRecord,
  saveSmartInventoryRecord,
  getSmartDatedInventory,
  saveSmartDatedInventory,
  deleteSmartDatedInventory,
  getSmartInventoryAudit
} from "backend/RIA/smartInventory.web";
import {
  fetchFlightInventory,
  updateFlightClassCapacity,
  fetchScheduleInventory,
  fetchNestingControls
} from "backend/RIA/masterInventory.web";

const HTML_SOURCE="SKANDI_ALTEA_MASTER";
const PARENT_SOURCE="SKANDI_WIX_PARENT";
const EMBED_IDS="#inventoryControlEmbed";

function embed(){for(const id of EMBED_IDS){try{const el=$w(id);if(el)return el}catch(_e){}}throw new Error("Inventory Control HTML embed was not found.")}
function send(type,payload={},requestId=""){embed().postMessage({source:PARENT_SOURCE,type,payload,...(requestId?{requestId}:{}),timestamp:new Date().toISOString()})}

$w.onReady(function(){
  const box=embed();
  box.onMessage(async event=>{
    const msg=event.data||{};
    if(msg.source!==HTML_SOURCE)return;
    const p=msg.payload||{},requestId=msg.requestId||"";
    try{
      switch(msg.type){
        case "MASTER_INVENTORY_READY":
        case "INVENTORY_V2_LIST": send("INVENTORY_V2_BOOTSTRAP",await getSmartInventoryBootstrap(p),requestId);break;
        case "INVENTORY_V2_GET": send("INVENTORY_V2_RECORD",await getSmartInventoryRecord(p),requestId);break;
        case "INVENTORY_V2_SAVE": send("INVENTORY_V2_SAVED",await saveSmartInventoryRecord(p),requestId);break;
        case "INVENTORY_V2_GET_DATED": send("INVENTORY_V2_DATED",await getSmartDatedInventory(p),requestId);break;
        case "INVENTORY_V2_SAVE_DATED": send("INVENTORY_V2_DATED_SAVED",await saveSmartDatedInventory(p),requestId);break;
        case "INVENTORY_V2_DELETE_DATED": send("INVENTORY_V2_DATED_DELETED",await deleteSmartDatedInventory(p),requestId);break;
        case "INVENTORY_FETCH_AUDIT": send("INVENTORY_AUDIT_RESULT",await getSmartInventoryAudit(p),requestId);break;
        case "INVENTORY_FETCH_FLIGHT": send("INVENTORY_FLIGHT_RESULT",await fetchFlightInventory(p),requestId);break;
        case "INVENTORY_UPDATE_CLASS_CAPACITY": send("INVENTORY_ACTION_OK",await updateFlightClassCapacity(p),requestId);break;
        case "INVENTORY_FETCH_SCHEDULE": send("INVENTORY_SCHEDULE_RESULT",await fetchScheduleInventory(p),requestId);break;
        case "INVENTORY_FETCH_NESTING": send("INVENTORY_NESTING_RESULT",await fetchNestingControls(p),requestId);break;
        default: break;
      }
    }catch(error){
      console.error("[Smart Inventory]",msg.type,error);
      send("INVENTORY_ERROR",{message:error?.message||"Inventory request failed.",code:error?.code||""},requestId);
    }
  });
});
