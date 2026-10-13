import {
  getDocuNetViewerBootstrap,getDocuNetDocumentAccess,acknowledgeDocuNetDocument
} from "backend/SKANDI_CORE/docuNet.web";
const HTML_ID="#docuNetViewerEmbed", SOURCE="SKANDI_DOCUNET_VIEWER", PARENT="SKANDI_WIX_PARENT";
const send=(html,type,payload={},message="")=>html.postMessage({source:PARENT,type,payload,...(message?{message}:{}),timestamp:new Date().toISOString()});
$w.onReady(()=>{const html=$w(HTML_ID);html.onMessage(async event=>{const m=event.data||{};if(m.source&&m.source!==SOURCE)return;try{if(m.type==="DOCUNET_READY"){send(html,"DOCUNET_BOOTSTRAP_RESULT",await getDocuNetViewerBootstrap());return}if(m.type==="DOCUNET_OPEN_DOCUMENT"){send(html,"DOCUNET_DOCUMENT_ACCESS_RESULT",await getDocuNetDocumentAccess({documentId:m.documentId||m.payload?.documentId}));return}if(m.type==="DOCUNET_ACKNOWLEDGE"){send(html,"DOCUNET_ACKNOWLEDGE_RESULT",await acknowledgeDocuNetDocument({documentId:m.documentId||m.payload?.documentId,revisionId:m.revisionId||m.payload?.revisionId}));return}}catch(error){send(html,"DOCUNET_ERROR",{},error?.message||"DocuNet action failed.")}});});
