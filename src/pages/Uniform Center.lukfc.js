// /src/pages/Uniform Center.lukfc.js
// V12 Uniform Center employee bridge with server-authoritative Uniform Control access gate.
import wixLocation from "wix-location";
import { getStaffPortalSession } from "backend/SKANDI_CORE/staffAuth.web";
import { handleUniformAction } from "backend/SKANDI_CORE/uniform.web";
import { SITE_MAP } from "public/siteMap";

const HTML_ID = "#uniformCenterEmbed";
const CHILD_SOURCE = "SKANDI_UNIFORM_EMPLOYEE";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";
const LOGIN_PATH = SITE_MAP.riaintra || "/riaintra";
let bootstrapPromise = null;

function postFlat(html,type,payload={}){html.postMessage({source:PARENT_SOURCE,type,...(payload||{}),timestamp:new Date().toISOString()});}
async function requirePortalSession(){const session=await getStaffPortalSession().catch(()=>null);if(!session||session.authorized===false||session.ok===false){wixLocation.to(LOGIN_PATH);return null;}return session;}
async function bootstrap(html){if(bootstrapPromise)return bootstrapPromise;bootstrapPromise=(async()=>{const session=await requirePortalSession();if(!session)return null;const result=await handleUniformAction({type:"UNIFORM_EMPLOYEE_BOOTSTRAP"});postFlat(html,result.responseType,result.ok?{payload:result.payload}:result.payload);return result;})();try{return await bootstrapPromise;}finally{bootstrapPromise=null;}}
async function checkAdminAccess(html){
  const session=await requirePortalSession();if(!session)return;
  const result=await handleUniformAction({type:"UNIFORM_ADMIN_BOOTSTRAP",payload:{accessCheckOnly:true}});
  if(result?.ok===true){postFlat(html,"UNIFORM_EMPLOYEE_ADMIN_GRANTED",{payload:{authorized:true}});wixLocation.to(SITE_MAP.uniformControl);return;}
  postFlat(html,"UNIFORM_EMPLOYEE_ADMIN_DENIED",{payload:{authorized:false,code:result?.payload?.code||"UNIFORM_ADMIN_ACCESS_DENIED",message:"Your current staff role is not authorized to open Uniform Control."}});
}
$w.onReady(function(){
  const html=$w(HTML_ID);
  html.onMessage(async event=>{const msg=event.data||{},source=msg.source||"",type=String(msg.type||""),payload=msg.payload||{};if(source!==CHILD_SOURCE)return;
    try{
      if(type==="UNIFORM_EMPLOYEE_READY"||type==="UNIFORM_EMPLOYEE_BOOTSTRAP"){await bootstrap(html);return;}
      if(type==="UNIFORM_EMPLOYEE_ADMIN_LOGIN"){await checkAdminAccess(html);return;}
      if(type==="UNIFORM_EMPLOYEE_SUBMIT_ORDER"){const result=await handleUniformAction({type,payload:{items:msg.items||payload.items||[],note:msg.note||payload.note||""}});postFlat(html,result.responseType,result.ok?{payload:result.payload}:result.payload);return;}
      if(type==="UNIFORM_EMPLOYEE_ACK_POLICY"){const result=await handleUniformAction({type,payload:{policyId:msg.policyId||payload.policyId||"",policyVersion:msg.policyVersion||payload.policyVersion||""}});postFlat(html,result.responseType,result.ok?{payload:result.payload}:result.payload);return;}
      if(type==="UNIFORM_EMPLOYEE_NAVIGATE"){const path=String(msg.path||payload.path||"");if(path.startsWith("/riaintra")||path.startsWith("/altea"))wixLocation.to(path);}
    }catch(error){postFlat(html,"UNIFORM_EMPLOYEE_ERROR",{message:error?.message||"Uniform Center action failed."});}
  });
  postFlat(html,"UNIFORM_EMPLOYEE_HOST_READY",{payload:{version:"V12-2026.10.13"}});
  bootstrap(html).catch(error=>postFlat(html,"UNIFORM_EMPLOYEE_ERROR",{message:error?.message||"Uniform Center could not synchronize."}));
});
