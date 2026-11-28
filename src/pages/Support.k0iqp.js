// /src/pages/Support.k0iqp.js
// Help Center owns its content and forms. The public master owns the chat.
import wixLocationFrontend from 'wix-location-frontend';
import { openCustomerLogin } from 'public/customerAuthUi';
import { getAlexandraGlobal } from 'public/alexandraGlobalBridge';
import {
  getCustomerSupportBootstrap,
  createCustomerSupportCase
} from 'backend/SKANDI_CORE/customerSupport.web';

const HELP_EMBED_ID='#skandiHelpCenterEmbed';
const HELP_SOURCE='SKANDI_SUPPORT_PUBLIC';
const CHAT_SOURCE='SKANDI_SUPPORT_CHAT';
const PARENT_SOURCE='SKANDI_WIX_PARENT';
const HELP_SOURCE_TAG='help-center';
const HELP_SOURCE_CHANNEL='HELP_CENTER';
const obj = x => x && typeof x==='object' && !Array.isArray(x) ? x : {};
const payloadOf = msg => ({...obj(msg),...obj(msg.payload)});
const clean = (value,max=5000) => String(value??'').trim().slice(0,max);
const safePath = value => { const path=clean(value,1000);return path.startsWith('/')&&!path.startsWith('//')&&!/[\\\x00-\x1f]/.test(path)?path:''; };
function errorReference(){return `SK-SUP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,8).toUpperCase()}`}
function err(reference){return `Sorry, we couldn’t complete your request. Please try again. Error ID: ${reference}`}
function standardInput(value={}){return {...obj(value),source:HELP_SOURCE_TAG,sourceChannel:HELP_SOURCE_CHANNEL,sourcePage:'/help'};}
function post(html,type,payload={},requestId='') { if(html)html.postMessage({source:PARENT_SOURCE,type,requestId,payload:{...obj(payload),requestId}}); }

$w.onReady(function(){
  let help=null;
  try{help=$w(HELP_EMBED_ID)}catch(_){}
  if(!help){console.error('[SKANDI Help] Help Center embed is required.');return}
  let bootstrap=null;
  async function ensureBootstrap(){if(!bootstrap)bootstrap=await getCustomerSupportBootstrap();return bootstrap}
  async function pushHelpBootstrap(requestId=''){
    const data=await ensureBootstrap(),q=obj(wixLocationFrontend.query);
    post(help,'PUBLIC_SUPPORT_BOOTSTRAP',{...obj(data),prefill:{category:clean(q.category,80),subCategory:clean(q.topic||q.subCategory,160),caseId:clean(q.caseId,160)}},requestId);
  }
  async function handleHelp(event){
    const message=obj(event?.data);if(message.source!==HELP_SOURCE)return;
    const payload=payloadOf(message),requestId=clean(message.requestId||payload.requestId,160);
    try{
      switch(message.type){
        case 'PUBLIC_SUPPORT_READY':case 'PUBLIC_SUPPORT_REQUEST_BOOTSTRAP':await pushHelpBootstrap(requestId);return;
        case 'PUBLIC_SUPPORT_LOGIN':await openCustomerLogin({sourcePage:'HELP_CENTER',reason:clean(payload.reason||'SKANDI_CLUB_LOGIN',120),returnTo:'/about/support'});bootstrap=null;await getAlexandraGlobal()?.refreshIdentity();await pushHelpBootstrap(requestId);return;
        case 'PUBLIC_SUPPORT_CREATE_CASE':{const result=await createCustomerSupportCase({input:standardInput(payload)});post(help,'PUBLIC_SUPPORT_CASE_CREATED',result,requestId);getAlexandraGlobal()?.reportSupportCase(result,requestId);return}
        case 'PUBLIC_SUPPORT_OPEN_ALEXANDRA':
        case 'PUBLIC_SUPPORT_REQUEST_HUMAN':
        case 'PUBLIC_SUPPORT_OPEN_FORM':{
          const mode={PUBLIC_SUPPORT_OPEN_ALEXANDRA:'ALEXANDRA',PUBLIC_SUPPORT_REQUEST_HUMAN:'HUMAN',PUBLIC_SUPPORT_OPEN_FORM:'FORM'}[message.type];
          if(!await getAlexandraGlobal()?.open({mode,payload,requestId}))throw new Error('Chat host is unavailable.');
          return;
        }
        case 'PUBLIC_SUPPORT_NAVIGATE':{const path=safePath(payload.path||message.path);if(path)wixLocationFrontend.to(path);return}
        default:return;
      }
    }catch(e){const reference=errorReference();console.error('[SKANDI Help] action failed',clean(message.type,90),reference);post(help,'PUBLIC_SUPPORT_ERROR',{action:clean(message.type,120),message:err(reference)},requestId)}
  }
  help.onMessage(event=>{
    const source=obj(event?.data).source;
    if(source===HELP_SOURCE)return handleHelp(event);
    if(source===CHAT_SOURCE)return getAlexandraGlobal()?.handleSupportMessage(help,event.data);
  });
});
