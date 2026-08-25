// pages/Signature Club Support.yk7x3.js
import wixLocationFrontend from "wix-location-frontend";
import { currentMember, authentication } from "wix-members-frontend";

import {
  getCustomerSupportBootstrap,
  createCustomerSupportCase,
  listCustomerSupportCases,
  getCustomerSupportCase,
  addCustomerSupportMessage
} from "backend/chatwootSupport.web";

import {
  getCustomerHeaderSession,
  subscribeCustomerNewsletter
} from "backend/customerHeader.web";

const EMBED_ID="#helpdeskEmbed";
const SOURCE="SKANDI_SUPPORT_CUSTOMER_PORTAL";
const PARENT="SKANDI_WIX_PARENT";

function html(){
  try{
    const el=$w(EMBED_ID);
    return el&&typeof el.onMessage==="function"&&typeof el.postMessage==="function"?el:null;
  }catch(_){return null}
}
function post(el,type,payload={},requestId=""){
  el.postMessage({source:PARENT,type,requestId,payload,timestamp:new Date().toISOString()});
}
function payload(m){return m?.payload&&typeof m.payload==="object"?m.payload:{}}
async function memberSafe(){try{return await currentMember.getMember()}catch(_){return null}}
async function headerState(el){
  const member=await memberSafe();
  if(!member){
    post(el,"CUSTOMER_HEADER_STATE",{loggedIn:false,displayName:"",points:0,tierName:"",menu:[]});
    return;
  }
  const s=await getCustomerHeaderSession().catch(()=>({}));
  post(el,"CUSTOMER_HEADER_STATE",{
    loggedIn:true,
    displayName:s?.displayName||member?.profile?.nickname||member?.loginEmail||"",
    points:Number(s?.points||s?.clubPoints||0),
    tierName:s?.tierName||s?.tier||"",
    menu:Array.isArray(s?.menu)?s.menu:[]
  });
}
async function bootstrap(el){
  const member=await memberSafe();
  const data=await getCustomerSupportBootstrap().catch(()=>({}));
  post(el,"CUSTOMER_PORTAL_STATE",{loggedIn:Boolean(member),...(data||{})});
  await headerState(el);
  if(member){
    const list=await listCustomerSupportCases().catch(()=>({cases:[]}));
    post(el,"CUSTOMER_CASE_LIST",list||{cases:[]});
  }else{
    post(el,"CUSTOMER_CASE_LIST",{cases:[],requiresLogin:true});
  }
}
async function ensureLogin(){
  let member=await memberSafe();
  if(member) return member;
  await authentication.promptLogin();
  member=await memberSafe();
  if(!member) throw new Error("Sign in to continue.");
  return member;
}

$w.onReady(function(){
  const el=html();
  if(!el) return;

  el.onMessage(async(event)=>{
    const m=event?.data;
    if(!m||typeof m!=="object"||m.source!==SOURCE||!m.type) return;
    const p=payload(m);
    const requestId=String(m.requestId||p.requestId||"");

    try{
      switch(m.type){
        case "CUSTOMER_READY":
          await bootstrap(el);
          return;
        case "CUSTOMER_LIST_CASES":{
          await ensureLogin();
          post(el,"CUSTOMER_CASE_LIST",await listCustomerSupportCases(),requestId);
          return;
        }
        case "CUSTOMER_OPEN_CASE":{
          await ensureLogin();
          post(el,"CUSTOMER_CASE_DETAIL",await getCustomerSupportCase({caseId:String(p.caseId||"")}),requestId);
          return;
        }
        case "CUSTOMER_REPLY_CASE":{
          await ensureLogin();
          const result=await addCustomerSupportMessage({
            caseId:String(p.caseId||""),
            content:String(p.content||p.message||"").trim()
          });
          post(el,"CUSTOMER_REPLY_SENT",result||{ok:true},requestId);
          post(el,"CUSTOMER_CASE_DETAIL",await getCustomerSupportCase({caseId:String(p.caseId||"")}),requestId);
          return;
        }
        case "CUSTOMER_CREATE_CASE":{
          await ensureLogin();
          const input=p.case||p.input||p;
          const result=await createCustomerSupportCase({input});
          post(el,"CUSTOMER_CASE_CREATED",{...(result||{}),case:result||{}},requestId);
          post(el,"CUSTOMER_CASE_LIST",await listCustomerSupportCases(),requestId);
          return;
        }
        case "HEADER_READY":
          await headerState(el);
          return;
        case "HEADER_LOGIN":
          await authentication.promptLogin().catch(()=>{});
          await bootstrap(el);
          return;
        case "HEADER_LOGOUT":
        case "CUSTOMER_LOGOUT":
          await Promise.resolve(authentication.logout()).catch(()=>{});
          await bootstrap(el);
          return;
        case "HEADER_NAVIGATE":
        case "CUSTOMER_NAVIGATE":
        case "FOOTER_NAVIGATE":{
          const path=String(p.path||m.path||"").trim();
          if(path) wixLocationFrontend.to(path);
          return;
        }
        case "FOOTER_STAFF_LOGIN":
          wixLocationFrontend.to("/riaintra");
          return;
        case "FOOTER_READY":
          post(el,"CUSTOMER_FOOTER_STATE",{ready:true});
          return;
        case "FOOTER_NEWSLETTER_SIGNUP":{
          const email=String(p.email||"").trim();
          if(!email){
            post(el,"FOOTER_NEWSLETTER_RESULT",{ok:false,message:"Please enter your email address."});
            return;
          }
          const result=await subscribeCustomerNewsletter({email,source:p.source||"Support Footer"});
          post(el,"FOOTER_NEWSLETTER_RESULT",{ok:true,...(result||{})});
          return;
        }
        default:
          return;
      }
    }catch(error){
      console.error("[Customer Support]",m.type,error);
      post(el,"CUSTOMER_ERROR",{message:error?.message||"Customer support action failed."},requestId);
    }
  });
});
