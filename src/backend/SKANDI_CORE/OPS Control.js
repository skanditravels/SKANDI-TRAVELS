// /src/pages/OPS Control.js
// B-011.29 — Wix page bridge for #opsControlEmbed. Visual/UI ownership remains in the supplied Jeppesen HTML.
import wixLocation from "wix-location";
import { authentication } from "wix-members-frontend";
import { getStaffPortalSession } from "backend/SKANDI_CORE/staffAuth.web";
import { getOpsControlBootstrap, handleOpsControlAction } from "backend/SKANDI_CORE/opsControl.web";

const EMBED_IDS=["#opsControlEmbed","#occEmbed","#htmlOpsControl"];
const SOURCE="SKANDI_OPS_CONTROL";
const PARENT="SKANDI_WIX_PARENT";
const LOGIN_PATH="/riaintra";
let bootstrapInFlight=null;
function embed(){for(const id of EMBED_IDS){try{const el=$w(id);if(el)return el}catch{}}return null}
function post(html,type,payload={}){html?.postMessage({source:PARENT,type,payload,timestamp:new Date().toISOString()})}
async function logout(){try{await authentication.logout()}catch{} wixLocation.to(LOGIN_PATH)}
async function bootstrap(html,payload={}){
  if(bootstrapInFlight)return bootstrapInFlight;
  bootstrapInFlight=(async()=>{
    const session=await getStaffPortalSession().catch(()=>null);
    if(!session?.authorized){wixLocation.to(LOGIN_PATH);return null}
    const data=await getOpsControlBootstrap(payload);
    post(html,"OPS_BOOTSTRAP",data);
    return data;
  })().finally(()=>{bootstrapInFlight=null});
  return bootstrapInFlight;
}
$w.onReady(()=>{
  const html=embed(); if(!html){console.error("[OPS Control] embed not found");return}
  html.onMessage(async(event)=>{
    const msg=event.data||{}, type=msg.type||msg.action||"", payload=msg.payload||{};
    if(msg.source!==SOURCE)return;
    try{
      if(type==="OPS_READY"||type==="OPS_REFRESH"){await bootstrap(html,payload);return}
      if(type==="OPS_LOGOUT"){await logout();return}
      if(type==="OPS_ACTION"){
        const result=await handleOpsControlAction({type:payload.action,payload:payload.payload||{}});
        post(html,"OPS_ACTION_RESULT",{requestId:payload.requestId||"",...result});
        return;
      }
    }catch(error){
      console.error("[OPS Control]",error);
      post(html,"OPS_ERROR",{requestId:payload.requestId||"",action:type,code:error?.code||"OPS_CONTROL_FAILED",message:error?.message||"OPS Control action failed."});
    }
  });
  bootstrap(html).catch(error=>console.error("[OPS Control bootstrap]",error));
});
