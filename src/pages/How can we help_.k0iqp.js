// /src/pages/How can we help_.k0iqp.js
// V12 — single canonical public support bridge. Alexandra uses Wix AI SDK.
// Existing case/human handoff persistence remains in customerSupport.web.js.
import wixLocationFrontend from 'wix-location-frontend';
import { openCustomerLogin } from 'public/customerAuthUi';
import {
  getCustomerSupportBootstrap,
  createCustomerSupportCase,
  startAlexandraSupportSession,
  sendAlexandraAiMessage,
  requestCustomerHumanHandoff,
  addCustomerLiveSupportMessage
} from 'backend/SKANDI_CORE/customerSupport.web';

const HELP_EMBED_ID='#skandiHelpCenterEmbed';
const CHAT_EMBED_ID='#skandiSupportChatEmbed';
const HELP_SOURCE='SKANDI_SUPPORT_PUBLIC';
const CHAT_SOURCE='SKANDI_SUPPORT_CHAT';
const PARENT_SOURCE='SKANDI_WIX_PARENT';
const HELP_SOURCE_TAG='help-center';
const HELP_SOURCE_CHANNEL='HELP_CENTER';
const ALEXANDRA_AVATAR_MP4_URL='https://video.wixstatic.com/video/394052_b44198f20fc44baa90b3fc03d87602ea/1080p/mp4/file.mp4';
const obj = x => x && typeof x==='object' && !Array.isArray(x) ? x : {};
const payloadOf = msg => ({...obj(msg),...obj(msg.payload)});
const clean = (value,max=5000) => String(value??'').trim().slice(0,max);
const safePath = value => { const path=clean(value,1000);return path.startsWith('/')&&!path.startsWith('//')&&!/[\\\x00-\x1f]/.test(path)?path:''; };
function err(error){return clean(error?.publicMessage||error?.message||'Support action failed.',500)}
function standardInput(value={}){return {...obj(value),source:HELP_SOURCE_TAG,sourceChannel:HELP_SOURCE_CHANNEL,sourcePage:'/about/support'};}
function post(html,type,payload={},requestId='') { if(html)html.postMessage({source:PARENT_SOURCE,type,requestId,payload:{...obj(payload),requestId}}); }

$w.onReady(function(){
  let help=null,chat=null;
  try{help=$w(HELP_EMBED_ID)}catch(_){}
  try{chat=$w(CHAT_EMBED_ID)}catch(_){}
  if(!help||!chat){console.error('[SKANDI Help] Both canonical Support embeds are required.');return}
  let bootstrap=null;
  async function ensureBootstrap(){if(!bootstrap)bootstrap=await getCustomerSupportBootstrap();return bootstrap}
  async function pushHelpBootstrap(requestId=''){
    const data=await ensureBootstrap(),q=obj(wixLocationFrontend.query);
    post(help,'PUBLIC_SUPPORT_BOOTSTRAP',{...obj(data),prefill:{category:clean(q.category,80),subCategory:clean(q.topic||q.subCategory,160),caseId:clean(q.caseId,160)}},requestId);
  }
  async function pushChatBootstrap(requestId=''){
    const data=await ensureBootstrap();
    post(chat,'SUPPORT_CHAT_BOOTSTRAP',{...obj(data),alexandra:{avatarAssetKey:'alexandra-support-avatar',avatarVideoUrl:ALEXANDRA_AVATAR_MP4_URL,playbackRate:0.75,displayName:'Alexandra',role:'SKANDI Digital Customer Service Assistant',provider:'Wix AI APIs'}},requestId);
  }
  async function openAlexandra(requestId=''){
    await pushChatBootstrap(requestId);
    const result=await startAlexandraSupportSession({locale:clean(wixLocationFrontend.query?.lang||'en-US',40),currency:clean(wixLocationFrontend.query?.currency||'USD',12),pagePath:'/about/support'});
    if(!result?.ok||!result?.session?.sessionId)throw new Error('Alexandra could not start.');
    post(chat,'SUPPORT_CHAT_OPEN',{mode:'ALEXANDRA',alexandraSession:result.session,loggedIn:result.loggedIn===true},requestId);
  }
  async function requestHuman(payload={},requestId=''){
    const input=standardInput(payload.input||payload);
    const result=await requestCustomerHumanHandoff({caseId:clean(payload.caseId,160),input,reason:clean(payload.reason||'Customer requested a Human SKANDI Customer Service Agent.',2000),summary:clean(payload.summary,6000),collectedFields:obj(payload.collectedFields),transcript:clean(payload.transcript,10000)});
    post(chat,'SUPPORT_CHAT_HUMAN_HANDOFF',result,requestId);
  }
  help.onMessage(async event=>{
    const message=obj(event?.data);if(message.source!==HELP_SOURCE)return;
    const payload=payloadOf(message),requestId=clean(message.requestId||payload.requestId,160);
    try{
      switch(message.type){
        case 'PUBLIC_SUPPORT_READY':case 'PUBLIC_SUPPORT_REQUEST_BOOTSTRAP':await pushHelpBootstrap(requestId);return;
        case 'PUBLIC_SUPPORT_LOGIN':await openCustomerLogin({sourcePage:'HELP_CENTER',reason:clean(payload.reason||'SKANDI_CLUB_LOGIN',120),returnTo:'/about/support'});bootstrap=null;await pushHelpBootstrap(requestId);return;
        case 'PUBLIC_SUPPORT_CREATE_CASE':{const result=await createCustomerSupportCase({input:standardInput(payload)});post(help,'PUBLIC_SUPPORT_CASE_CREATED',result,requestId);post(chat,'SUPPORT_CHAT_CASE_CREATED',result,requestId);return}
        case 'PUBLIC_SUPPORT_OPEN_ALEXANDRA':await openAlexandra(requestId);return;
        case 'PUBLIC_SUPPORT_REQUEST_HUMAN':await pushChatBootstrap(requestId);post(chat,'SUPPORT_CHAT_OPEN',{mode:'HANDOFF_PENDING'},requestId);await requestHuman(payload,requestId);return;
        case 'PUBLIC_SUPPORT_OPEN_FORM':await pushChatBootstrap(requestId);post(chat,'SUPPORT_CHAT_OPEN',{mode:'FORM',formPrefill:payload},requestId);return;
        case 'PUBLIC_SUPPORT_NAVIGATE':{const path=safePath(payload.path||message.path);if(path)wixLocationFrontend.to(path);return}
        default:return;
      }
    }catch(e){console.error('[SKANDI Help] action failed',clean(message.type,90));post(help,'PUBLIC_SUPPORT_ERROR',{action:clean(message.type,120),message:err(e)},requestId);post(chat,'SUPPORT_CHAT_ERROR',{action:clean(message.type,120),message:err(e)},requestId)}
  });
  chat.onMessage(async event=>{
    const message=obj(event?.data);if(message.source!==CHAT_SOURCE)return;
    const payload=payloadOf(message),requestId=clean(message.requestId||payload.requestId,160);
    try{
      switch(message.type){
        case 'SUPPORT_CHAT_READY':await pushChatBootstrap(requestId);return;
        case 'SUPPORT_CHAT_START_ALEXANDRA':await openAlexandra(requestId);return;
        case 'SUPPORT_CHAT_ALEXANDRA_MESSAGE':{
          const result=await sendAlexandraAiMessage({sessionId:clean(payload.sessionId,90),message:clean(payload.message,1700),history:Array.isArray(payload.history)?payload.history.slice(-8):[]});
          post(chat,'SUPPORT_CHAT_ALEXANDRA_REPLY',result,requestId);return;
        }
        case 'SUPPORT_CHAT_START_HUMAN':await requestHuman(payload,requestId);return;
        case 'SUPPORT_CHAT_HUMAN_MESSAGE':{const result=await addCustomerLiveSupportMessage({caseId:clean(payload.caseId,160),content:clean(payload.content,30000)});post(chat,'SUPPORT_CHAT_HUMAN_MESSAGE_SAVED',result,requestId);return}
        case 'SUPPORT_CHAT_SUBMIT_FORM':{const result=await createCustomerSupportCase({input:{...standardInput(payload.input||payload),source:'alexandra',sourceChannel:'ALEXANDRA_WIX_AI',sourcePage:'/about/support'}});post(chat,'SUPPORT_CHAT_CASE_CREATED',result,requestId);post(help,'PUBLIC_SUPPORT_CASE_CREATED',result,requestId);return}
        case 'SUPPORT_CHAT_NAVIGATE':{const path=safePath(payload.path||message.path);if(path)wixLocationFrontend.to(path);return}
        default:return;
      }
    }catch(e){console.error('[SKANDI Alexandra] action failed',clean(message.type,90));post(chat,'SUPPORT_CHAT_ERROR',{action:clean(message.type,120),message:err(e)},requestId)}
  });
});
