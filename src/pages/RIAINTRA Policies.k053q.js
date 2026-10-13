import wixLocation from "wix-location-frontend";
import { getInternalLegalDocument } from "backend/SKANDI_CORE/policyControl.web";
const EMBED_ID="#internalLegalPolicyEmbed", HTML_SOURCE="SKANDI_LEGAL_DOCUMENT", PARENT_SOURCE="SKANDI_WIX_PARENT";
const send=(type,payload={})=>$w(EMBED_ID).postMessage({source:PARENT_SOURCE,type,payload,timestamp:new Date().toISOString()});
async function load(){try{const result=await getInternalLegalDocument({slug:String(wixLocation.query?.slug||"")});if(!result?.ok){send("LEGAL_ERROR",{message:result?.message||"Internal policy unavailable."});return}send("LEGAL_DOCUMENT_DATA",{...result,context:"internal"})}catch(error){send("LEGAL_ERROR",{message:error?.message||"Internal policy unavailable."})}}
$w.onReady(()=>{const embed=$w(EMBED_ID);embed.onMessage(async event=>{const m=event.data||{};if(m.source&&m.source!==HTML_SOURCE)return;if(m.type==="LEGAL_DOCUMENT_READY"||m.type==="LEGAL_DOCUMENT_REFRESH")await load();if(m.type==="LEGAL_DOCUMENT_HEIGHT")embed.height=Math.max(700,Math.min(24000,Number(m.payload?.height||0)))});load()});
