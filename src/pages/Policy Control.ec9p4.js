import {
  getPolicyControlBootstrap,listPolicyDocuments,getPolicyDocument,savePolicyDocument,
  publishPolicyDocument,archivePolicyDocument,deletePolicyDocument,regeneratePolicyPdf,parsePolicyPdfText
} from "backend/SKANDI_CORE/policyControl.web";

const HTML_ID="#policyControlEmbed", CHILD="SKANDI_POLICY_CONTROL", PARENT="SKANDI_WIX_PARENT";
const send=(html,type,payload={})=>html.postMessage({source:PARENT,type,payload,timestamp:new Date().toISOString()});
$w.onReady(()=>{
  const html=$w(HTML_ID);
  html.onMessage(async event=>{
    const m=event.data||{}; if(m.source&&m.source!==CHILD)return;
    try{
      let result;
      switch(m.type){
        case "POLICY_READY": result=await getPolicyControlBootstrap(); send(html,"POLICY_BOOTSTRAP",result); return;
        case "POLICY_LIST_REQUEST": result=await listPolicyDocuments(m.payload||{}); send(html,"POLICY_LIST",result); return;
        case "POLICY_GET_REQUEST": result=await getPolicyDocument(m.payload||{}); send(html,"POLICY_DETAIL",result); return;
        case "POLICY_SAVE_REQUEST": result=await savePolicyDocument(m.payload||{}); send(html,"POLICY_SAVED",result); return;
        case "POLICY_PUBLISH_REQUEST": result=await publishPolicyDocument(m.payload||{}); send(html,"POLICY_SAVED",result); return;
        case "POLICY_ARCHIVE_REQUEST": result=await archivePolicyDocument(m.payload||{}); send(html,"POLICY_SAVED",result); return;
        case "POLICY_DELETE_REQUEST": result=await deletePolicyDocument(m.payload||{}); send(html,"POLICY_DELETED",result); return;
        case "POLICY_PDF_REGENERATE_REQUEST": result=await regeneratePolicyPdf(m.payload||{}); send(html,"POLICY_SAVED",result); return;
        case "POLICY_PDF_PARSE_REQUEST": result=await parsePolicyPdfText(m.payload||{}); send(html,"POLICY_PDF_PARSED",result); return;
      }
    }catch(error){send(html,"POLICY_ERROR",{message:error?.message||"Policy Control action failed."})}
  });
});
