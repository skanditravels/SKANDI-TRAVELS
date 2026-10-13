import wixLocation from "wix-location-frontend";
import { getInternalLegalHub } from "backend/SKANDI_CORE/policyControl.web";
const EMBED_ID="#internalLegalHubEmbed", HTML_SOURCE="SKANDI_INTERNAL_LEGAL_HUB", PARENT_SOURCE="SKANDI_WIX_PARENT";
const send=(type,payload={})=>$w(EMBED_ID).postMessage({source:PARENT_SOURCE,type,payload,timestamp:new Date().toISOString()});
async function load(){try{send("INTERNAL_LEGAL_HUB_DATA",await getInternalLegalHub())}catch(error){send("INTERNAL_LEGAL_ERROR",{message:error?.message||"Internal policies are temporarily unavailable."})}}
$w.onReady(()=>{const embed=$w(EMBED_ID);embed.onMessage(async event=>{const m=event.data||{};if(m.source&&m.source!==HTML_SOURCE)return;if(m.type==="INTERNAL_LEGAL_READY"||m.type==="INTERNAL_LEGAL_REFRESH")await load();if(m.type==="INTERNAL_LEGAL_HEIGHT")embed.height=Math.max(600,Math.min(14000,Number(m.payload?.height||0)));if(m.type==="NAVIGATE"&&m.payload?.path)wixLocation.to(m.payload.path)});load()});
