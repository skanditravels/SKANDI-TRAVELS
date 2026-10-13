// /src/pages/Uniform Control.yx92b.js
// V12 Uniform Control bridge — single canonical Uniform facade, single-flight bootstrap.
import wixLocation from "wix-location-frontend";
import { SITE_MAP, isSafeInternalRoute } from "public/siteMap.js";
import { handleUniformAction } from "backend/SKANDI_CORE/uniform.web";
const HTML_ID="#uniformControlEmbed",CHILD_SOURCE="SKANDI_UNIFORM_ADMIN",PARENT_SOURCE="SKANDI_WIX_PARENT",LOGIN_PATH=SITE_MAP.riaintra||"/riaintra";
const LEGACY=new Set(["/riaintra/uniform","/riaintra/altea/uniform-control"]);let bootstrapPromise=null;
function reply(html,type,requestId="",payload={},extra={}){html.postMessage({source:PARENT_SOURCE,type,requestId:requestId||"",payload:payload||{},...extra,timestamp:new Date().toISOString()});}
async function callUniform(type,payload={}){if(typeof handleUniformAction!=="function"){const e=new Error("Uniform backend facade is unavailable.");e.code="UNIFORM_WEB_FACADE_MISMATCH";throw e;}const result=await handleUniformAction({type,payload});if(!result||result.ok!==true){const e=new Error(result?.payload?.message||"Uniform Control action failed.");e.code=result?.payload?.code||"UNIFORM_ACTION_FAILED";throw e;}return result;}
async function dispatch(html,type,payload={},requestId=""){const result=await callUniform(type,payload);reply(html,result.responseType||"UNIFORM_ADMIN_SAVED",requestId,result.payload||{});return result;}
async function bootstrap(html){if(bootstrapPromise)return bootstrapPromise;bootstrapPromise=dispatch(html,"UNIFORM_ADMIN_BOOTSTRAP",{},"").finally(()=>{bootstrapPromise=null});return bootstrapPromise;}
$w.onReady(function(){const html=$w(HTML_ID);html.onMessage(async event=>{const msg=event.data||{};if(msg.source!==CHILD_SOURCE)return;const type=String(msg.type||""),payload=msg.payload||{},requestId=String(msg.requestId||payload.requestId||"");try{
  if(type==="UNIFORM_ADMIN_NAVIGATE"){const requested=String(payload.path||msg.path||"");const path=requested==="/riaintra/uniform"?SITE_MAP.uniformCenter:requested==="/riaintra/altea/uniform-control"?SITE_MAP.uniformControl:requested;if((LEGACY.has(requested)||isSafeInternalRoute(path))&&path)wixLocation.to(path);return;}
  if(type==="UNIFORM_ADMIN_READY"||type==="UNIFORM_ADMIN_BOOTSTRAP"){await bootstrap(html);return;}
  if(type.startsWith("UNIFORM_ADMIN_")||type==="UNIFORM_SYSTEM_STATUS")await dispatch(html,type,payload,requestId);
}catch(error){if(["STAFF_AUTH_REQUIRED","STAFF_PROFILE_NOT_FOUND"].includes(String(error?.code||"")))wixLocation.to(LOGIN_PATH);reply(html,"UNIFORM_ADMIN_ERROR",requestId,{code:error?.code||"UNIFORM_ADMIN_ERROR",message:error?.message||"Uniform Control action failed."},{code:error?.code||"UNIFORM_ADMIN_ERROR",message:error?.message||"Uniform Control action failed."});}});
reply(html,"UNIFORM_ADMIN_HOST_READY","",{version:"V12-2026.10.13",route:SITE_MAP.uniformControl});bootstrap(html).catch(error=>reply(html,"UNIFORM_ADMIN_ERROR","",{code:error?.code||"UNIFORM_ADMIN_BOOTSTRAP_FAILED",message:error?.message||"Uniform Control could not synchronize."}));});
