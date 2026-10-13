import {
  getTransportComplianceBootstrap,verifyTransportCompliance
} from "backend/SKANDI_CORE/documentControl.web";
const HTML_ID="#transportComplianceHtml",CHILD="SKANDI_TRANSPORT_COMPLIANCE_CONTROL",PARENT="SKANDI_WIX_PARENT";
const send=(html,type,payload={})=>html.postMessage({source:PARENT,type,payload,timestamp:new Date().toISOString()});
$w.onReady(()=>{const html=$w(HTML_ID);async function load(){send(html,"TRANSPORT_COMPLIANCE_LOAD",await getTransportComplianceBootstrap())}html.onMessage(async event=>{const m=event.data||{};if(m.source!==CHILD)return;try{if(m.type==="TRANSPORT_COMPLIANCE_READY"||m.type==="TRANSPORT_COMPLIANCE_REFRESH"){await load();return}if(m.type==="TRANSPORT_COMPLIANCE_OPEN"){send(html,"TRANSPORT_COMPLIANCE_OPEN_RECORD",m.payload||{});return}if(m.type==="TRANSPORT_COMPLIANCE_VERIFY"){const r=await verifyTransportCompliance(m.payload||{});send(html,"TRANSPORT_COMPLIANCE_VERIFIED",r);await load();return}}catch(error){send(html,"TRANSPORT_COMPLIANCE_ERROR",{message:error?.message||"Compliance action failed."})}});});
