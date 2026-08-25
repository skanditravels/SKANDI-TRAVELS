// GroupTalk Wix page code
// HTML Component: #htmlGroupTalk
// Supabase Realtime replaces Pusher. LiveKit remains voice transport.
// The GroupTalk HTML is headerless.

import wixLocation from "wix-location";
import { getStaffPortalSession } from "backend/RIA/staffPortalAuth.web";
import {
  getGroupTalkBootstrap,
  getGroupTalkRealtimeConfig,
  updateGroupTalkPresence,
  getGroupTalkPresence,
  createLiveKitToken,
  triggerGroupTalkEvent,
  getPhoneBook,
  sendLocationPing,
  getLiveLocations,
  createGroupTalkTicket,
  getGroupTalkTickets,
  replyToGroupTalkTicket,
  searchGroupTalkHistory,
  adminSaveGroup,
  adminSetMembership,
  getTicketCategories,
  saveTicketCategory,
  deleteTicketCategory
} from "backend/GROUPTALK/grouptalk.web";

const EMBED = "#htmlGroupTalk";
const GROUPTALK_SOURCE = "GROUPTALK_HTML";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";
const LOGIN_PATH = "/riaintra";
let html = null;
let bootstrapPromise = null;

function delay(ms){ return new Promise(resolve=>setTimeout(resolve,ms)); }
function allowedInternalPath(path){ const p=String(path||"").trim(); return p==="/" || p===LOGIN_PATH || p.startsWith("/riaintra") || p.startsWith("/altea"); }
function messageOf(error,fallback="GroupTalk action failed."){ const m=String(error?.message||error||"").trim(); return m&&m.length<=220?m:fallback; }
function post(type,payload={}){
  if(!html||typeof html.postMessage!=="function"){console.warn("[GroupTalk] #htmlGroupTalk is not an HTML Component.");return false;}
  try{ html.postMessage({source:PARENT_SOURCE,type,payload,timestamp:new Date().toISOString()}); return true; }
  catch(error){ console.error(`[GroupTalk] postMessage failed for ${type}.`,error); return false; }
}

async function authorizedSession(){
  const waits=[0,150,400]; let last=null;
  for(const wait of waits){
    if(wait)await delay(wait);
    try{last=await getStaffPortalSession();if(last?.authorized===true&&last?.ok!==false)return last;}
    catch(error){console.warn("[GroupTalk] Staff session lookup warning.",error);}
  }
  return last;
}

async function bootstrap(force=false){
  if(bootstrapPromise&&!force)return bootstrapPromise;
  bootstrapPromise=(async()=>{
    const session=await authorizedSession();
    if(!session||session.authorized!==true||session.ok===false){
      post("GT_ERROR",{action:"BOOTSTRAP",message:"Your RIAINTRA staff session is not authorized."});
      wixLocation.to(LOGIN_PATH);return null;
    }
    const result=await getGroupTalkBootstrap();
    if(!result)throw new Error("GroupTalk bootstrap returned no data.");
    post("GT_BOOTSTRAP",result);return result;
  })();
  try{return await bootstrapPromise;}finally{bootstrapPromise=null;}
}

async function handle(type,payload){
  switch(type){
    case "GT_READY": await bootstrap(); return;
    case "GT_REFRESH": await bootstrap(true); return;

    case "SUPABASE_REALTIME_CONFIG_REQUEST": {
      const result=await getGroupTalkRealtimeConfig({groupId:payload.groupId});
      post("SUPABASE_REALTIME_CONFIG_RESPONSE",{requestId:payload.requestId||"",...(result||{})}); return;
    }
    case "SUPABASE_PRESENCE_UPDATE": {
      const result=await updateGroupTalkPresence({groupId:payload.groupId,sessionKey:payload.sessionKey,status:payload.status,heartbeat:payload.heartbeat===true});
      post("SUPABASE_PRESENCE_UPDATE_RESPONSE",{requestId:payload.requestId||"",...(result||{})}); return;
    }
    case "SUPABASE_PRESENCE_REQUEST": {
      const result=await getGroupTalkPresence({groupId:payload.groupId});
      post("SUPABASE_PRESENCE_RESPONSE",{requestId:payload.requestId||"",...(result||{})}); return;
    }

    case "LIVEKIT_TOKEN_REQUEST": {
      const result=await createLiveKitToken({groupId:payload.groupId});
      post("LIVEKIT_TOKEN_RESPONSE",{requestId:payload.requestId||"",ok:true,...(result||{})}); return;
    }
    case "PTT_EVENT": {
      const result=await triggerGroupTalkEvent(payload);
      post("PTT_EVENT_RESULT",{requestId:payload.requestId||"",ok:true,...(result||{})}); return;
    }
    case "PHONEBOOK_REQUEST": {
      const result=await getPhoneBook(payload);
      post("PHONEBOOK_RESPONSE",{requestId:payload.requestId||"",...(result||{})}); return;
    }
    case "LOCATION_PING": {
      const result=await sendLocationPing(payload);
      post("LOCATION_PING_RESULT",{requestId:payload.requestId||"",...(result||{})}); return;
    }
    case "LIVE_LOCATIONS_REQUEST": {
      const result=await getLiveLocations(payload);
      post("LIVE_LOCATIONS_RESPONSE",{requestId:payload.requestId||"",...(result||{})}); return;
    }
    case "TICKET_CREATE": {
      const result=await createGroupTalkTicket(payload);
      post("TICKET_CREATE_RESPONSE",{requestId:payload.requestId||"",...(result||{})}); return;
    }
    case "TICKET_LIST_REQUEST": {
      const result=await getGroupTalkTickets(payload);
      post("TICKET_LIST_RESPONSE",{requestId:payload.requestId||"",...(result||{})}); return;
    }
    case "TICKET_REPLY": {
      const result=await replyToGroupTalkTicket(payload);
      post("TICKET_REPLY_RESPONSE",{requestId:payload.requestId||"",...(result||{})}); return;
    }
    case "HISTORY_SEARCH_REQUEST": {
      const result=await searchGroupTalkHistory(payload);
      post("HISTORY_SEARCH_RESPONSE",{requestId:payload.requestId||"",...(result||{})}); return;
    }
    case "TICKET_CATEGORY_LIST_REQUEST": {
      const result=await getTicketCategories(payload);
      post("TICKET_CATEGORY_LIST_RESPONSE",{requestId:payload.requestId||"",...(result||{})}); return;
    }
    case "TICKET_CATEGORY_SAVE": {
      const result=await saveTicketCategory(payload);
      post("TICKET_CATEGORY_SAVE_RESPONSE",{requestId:payload.requestId||"",...(result||{})}); return;
    }
    case "TICKET_CATEGORY_DELETE": {
      const result=await deleteTicketCategory(payload);
      post("TICKET_CATEGORY_DELETE_RESPONSE",{requestId:payload.requestId||"",...(result||{})}); return;
    }
    case "ADMIN_SAVE_GROUP": {
      const result=await adminSaveGroup(payload);
      post("ADMIN_SAVE_GROUP_RESPONSE",{requestId:payload.requestId||"",...(result||{})});
      await bootstrap(true); return;
    }
    case "ADMIN_SET_MEMBERSHIP": {
      const result=await adminSetMembership(payload);
      post("ADMIN_SET_MEMBERSHIP_RESPONSE",{requestId:payload.requestId||"",...(result||{})});
      await bootstrap(true); return;
    }
    case "GT_NAVIGATE": if(allowedInternalPath(payload.path))wixLocation.to(payload.path); return;
    default: console.info("[GroupTalk] Unhandled message:",type);
  }
}

$w.onReady(function(){
  try{html=$w(EMBED);}catch(error){console.error("[GroupTalk] #htmlGroupTalk is missing.",error);return;}
  if(!html||typeof html.onMessage!=="function"||typeof html.postMessage!=="function"){
    console.error("[GroupTalk] #htmlGroupTalk must be an HTML Component.");return;
  }
  html.onMessage(async event=>{
    const msg=event?.data||{}, source=msg.source||"", type=msg.type||msg.event||msg.action||"", payload=msg.payload||{};
    if(source!==GROUPTALK_SOURCE)return;
    try{await handle(type,payload);}
    catch(error){
      console.error(`[GroupTalk] ${type||"UNKNOWN"} failed.`,error); const message=messageOf(error);
      if(type==="LIVEKIT_TOKEN_REQUEST"){post("LIVEKIT_TOKEN_RESPONSE",{requestId:payload.requestId||"",ok:false,message});return;}
      if(type==="SUPABASE_REALTIME_CONFIG_REQUEST"){post("SUPABASE_REALTIME_CONFIG_RESPONSE",{requestId:payload.requestId||"",ok:false,message});return;}
      post("GT_ERROR",{requestId:payload.requestId||"",action:type,message});
    }
  });
  void bootstrap().catch(error=>post("GT_ERROR",{action:"INITIAL_BOOTSTRAP",message:messageOf(error,"GroupTalk could not initialize.")}));
});
