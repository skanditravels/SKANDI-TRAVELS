// Backend/GROUPTALK/grouptalk.web.js
// SKANDI GroupTalk — Supabase PostgreSQL + Supabase Realtime + LiveKit
// Pusher is fully removed. LiveKit remains the voice/WebRTC transport.

import { webMethod, Permissions } from "wix-web-module";
import { currentMember } from "wix-members-backend";
import { secrets } from "wix-secrets-backend.v2";
import { elevate } from "wix-auth";
import { fetch } from "wix-fetch";
import { AccessToken } from "livekit-server-sdk";
import { randomBytes } from "crypto";
import { restRequest } from "backend/RIA/supabaseServer.js";

const T = Object.freeze({
  agents: "agent_users",
  groups: "grouptalk_groups",
  members: "grouptalk_group_members",
  phonebook: "grouptalk_phonebook",
  categories: "grouptalk_ticket_categories",
  tickets: "grouptalk_tickets",
  replies: "grouptalk_ticket_replies",
  locations: "grouptalk_locations",
  history: "grouptalk_history",
  sessions: "grouptalk_realtime_sessions",
  audit: "grouptalk_audit"
});

const DEFAULT_CATEGORIES = [
  ["bus-manifest", "Bus Manifest"], ["guest-issue", "Guest Issue"],
  ["hotel-issue", "Hotel Issue"], ["transfer-issue", "Transfer Issue"],
  ["flight-disruption", "Flight Disruption"], ["emergency-support", "Emergency Support"],
  ["documents", "Documents"], ["schedule-change", "Schedule Change"],
  ["lost-item", "Lost Item"], ["operations-question", "Operations Question"], ["other", "Other"]
];

const BLOCKED = new Set(["blocked","inactive","suspended","terminated","archived","disabled"]);
const ALLOWED_RT_EVENTS = new Set([
  "ptt-started","ptt-ended","emergency-alert","grouptalk-event",
  "location-updated","ticket-created","ticket-updated","group-updated",
  "membership-updated","categories-updated","presence-updated"
]);
const elevatedGetSecretValue = elevate(secrets.getSecretValue);

function clean(v, max=5000){ return String(v ?? "").trim().slice(0,max); }
function lower(v){ return clean(v,300).toLowerCase(); }
function upper(v){ return clean(v,300).toUpperCase(); }
function first(rows){ return Array.isArray(rows) && rows.length ? rows[0] : null; }
function obj(v){ return v && typeof v === "object" && !Array.isArray(v) ? v : {}; }
function now(){ return new Date().toISOString(); }
function randomPart(n=14){ return randomBytes(Math.max(8,Math.ceil(n/2))).toString("hex").slice(0,n); }
function opaque(){ return randomBytes(32).toString("hex"); }
function slug(v){ return clean(v,120).toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"") || "group"; }
function ticketNumber(){ return `GT-${now().slice(0,10).replaceAll("-","")}-${randomPart(6).toUpperCase()}`; }
function displayName(a={}){ return clean(a.preferred_name || a.display_name || [a.first_name,a.last_name].filter(Boolean).join(" ") || a.email || a.sk_id || "Staff",160); }
function memberEmail(m={}){ const e=m?.contactDetails?.emails; return lower(m.loginEmail || (Array.isArray(e)?e[0]:e) || m?.profile?.email || m.email || ""); }
function jsonText(v){ try{return JSON.stringify(v ?? null)}catch(_){return ""} }

function secretString(r){
  if(typeof r === "string") return r.trim();
  return clean(r?.value ?? r?.secretValue ?? r?.secret?.value ?? "",20000);
}
async function secret(name, fallback=""){
  try{ return secretString(await elevatedGetSecretValue(name)) || fallback; }
  catch(_){ return fallback; }
}
async function realtimeServerConfig(){
  const url=(await secret("SUPABASE_URL")).replace(/\/+$/,"");
  const key=(await secret("SUPABASE_SECRET_KEY")) || (await secret("SUPABASE_SERVICE_ROLE_KEY"));
  if(!/^https:\/\/[^/]+\.supabase\.co$/i.test(url)) throw new Error("SUPABASE_URL_INVALID");
  if(!key) throw new Error("SUPABASE_SERVER_KEY_MISSING");
  return {url,key};
}
async function realtimeBrowserConfig(){
  const url=(await secret("SUPABASE_URL")).replace(/\/+$/,"");
  const publishableKey=(await secret("SUPABASE_PUBLISHABLE_KEY")) || (await secret("SUPABASE_ANON_KEY"));
  if(!/^https:\/\/[^/]+\.supabase\.co$/i.test(url)) throw new Error("SUPABASE_URL_INVALID");
  if(!publishableKey) throw new Error("SUPABASE_PUBLISHABLE_KEY_MISSING");
  return {url,publishableKey};
}

const AGENT_FIELDS = [
  "id","agent_id","member_id","wix_member_id","email","corporate_email_address","sk_id",
  "first_name","last_name","preferred_name","display_name","role","position","job_title",
  "department","station","base","active","status","employment_status","portal_access",
  "authorized","can_access_grouptalk","can_manage","payload"
].join(",");

async function wixMember(){ try{return await currentMember.getMember({fieldsets:["FULL"]})}catch(_){return null} }
async function agentForMember(member){
  const memberId=clean(member?._id || member?.id,120), email=memberEmail(member);
  if(memberId){
    let a=first(await restRequest({table:T.agents,query:{select:AGENT_FIELDS,wix_member_id:`eq.${memberId}`,limit:1}}));
    if(a)return a;
    a=first(await restRequest({table:T.agents,query:{select:AGENT_FIELDS,member_id:`eq.${memberId}`,limit:1}}));
    if(a)return a;
  }
  if(email){
    let a=first(await restRequest({table:T.agents,query:{select:AGENT_FIELDS,corporate_email_address:`ilike.${email}`,limit:1}}));
    if(a)return a;
    a=first(await restRequest({table:T.agents,query:{select:AGENT_FIELDS,email:`ilike.${email}`,limit:1}}));
    if(a)return a;
  }
  return null;
}
function assertStaff(a){
  if(!a) throw new Error("GROUPTALK_STAFF_NOT_FOUND");
  if(a.active!==true) throw new Error("GROUPTALK_STAFF_INACTIVE");
  if(a.portal_access!==true || a.authorized!==true) throw new Error("GROUPTALK_STAFF_NOT_AUTHORIZED");
  if(BLOCKED.has(lower(a.status))) throw new Error("GROUPTALK_STAFF_BLOCKED");
  if(a.can_access_grouptalk!==true && a.can_manage!==true) throw new Error("GROUPTALK_ACCESS_DISABLED");
}
function publicProfile(a={}){
  return {
    id:a.id||"", agentId:a.agent_id||a.id||"", skId:a.sk_id||"", name:displayName(a), displayName:displayName(a),
    firstName:a.first_name||"", lastName:a.last_name||"", email:a.corporate_email_address||a.email||"",
    role:a.role||a.position||a.job_title||"", position:a.position||a.job_title||a.role||"",
    department:a.department||"", base:a.base||a.station||"", station:a.station||a.base||"",
    canManage:a.can_manage===true, canAccessGroupTalk:a.can_access_grouptalk===true || a.can_manage===true
  };
}
async function requireStaff(){
  const member=await wixMember(); if(!member)throw new Error("WIX_MEMBER_SESSION_REQUIRED");
  const agent=await agentForMember(member); assertStaff(agent);
  return {member,agent,profile:publicProfile(agent)};
}
async function requireOps(){ const ctx=await requireStaff(); if(ctx.agent.can_manage!==true)throw new Error("GROUPTALK_ADMIN_REQUIRED"); return ctx; }

async function allGroupRows(){
  const rows=await restRequest({table:T.groups,query:{select:"*",order:"sort_order.asc",limit:500}});
  return (Array.isArray(rows)?rows:[]).filter(g=>!["archived","deleted","disabled","inactive"].includes(lower(g.status)));
}
async function membershipRows(agent){
  const rows=await restRequest({table:T.members,query:{select:"*",agent_user_id:`eq.${agent.id}`,limit:500}});
  return (Array.isArray(rows)?rows:[]).filter(m=>!["inactive","removed","revoked","disabled"].includes(lower(m.membership_status)));
}
function allowAll(g){ const p=obj(g.payload); return p.allowAllStaff===true || ["all_staff","all-staff","staff"].includes(lower(g.visibility)); }
function memberFor(ms,g){ return ms.find(m=>m.group_id===g.id || (m.group_key && m.group_key===g.group_key)) || null; }
function publicGroup(g,m,a){
  const p=obj(g.payload), canAdmin=a.can_manage===true || m?.can_admin===true;
  const canListen=m ? m.can_listen!==false : true;
  return {
    groupId:g.id,id:g.id,groupKey:g.group_key,slug:g.group_key,title:g.name,name:g.name,description:g.description||"",
    base:p.base||p.station||"",category:g.group_type||"Operations",groupType:g.group_type||"operations",
    visibility:g.visibility||"staff",status:g.status||"active",channelName:g.channel_name||`grouptalk-${g.group_key}`,
    livekitRoomName:g.livekit_room||`grouptalk-${g.group_key}`,sortOrder:Number(g.sort_order||0),defaultGroup:p.defaultGroup===true,
    capabilities:{
      canListen,
      canTalk:g.can_voice!==false && canListen && (canAdmin || !m || m.can_talk!==false),
      canViewLocations:g.can_location!==false && (canAdmin || !m || m.can_view_locations!==false),
      canCreateTickets:g.can_ticket!==false && (canAdmin || !m || m.can_manage_tickets!==false),
      canAdmin
    }
  };
}
async function allowedPairs(agent){
  const groups=await allGroupRows();
  if(agent.can_manage===true)return groups.map(group=>({group,membership:null}));
  const ms=await membershipRows(agent);
  return groups.map(group=>({group,membership:memberFor(ms,group)})).filter(x=>x.membership || allowAll(x.group));
}
async function allowedGroups(agent){ return (await allowedPairs(agent)).map(x=>publicGroup(x.group,x.membership,agent)); }
async function requireGroup(agent,groupId){
  const pairs=await allowedPairs(agent), q=clean(groupId,160);
  const pair=pairs.find(x=>x.group.id===q || x.group.group_key===q) || (!q ? pairs[0] : null);
  if(!pair)throw new Error("GROUPTALK_GROUP_NOT_ALLOWED");
  return {row:pair.group,membership:pair.membership,public:publicGroup(pair.group,pair.membership,agent)};
}

async function ensureTopic(group){
  const p=obj(group.payload), existing=clean(p.realtimeTopic || p.realtime_topic,240);
  if(existing)return existing;
  const realtimeTopic=`grouptalk:${opaque()}`;
  await restRequest({table:T.groups,method:"PATCH",query:{id:`eq.${group.id}`},body:{payload:{...p,realtimeTopic},updated_at:now()},prefer:"return=minimal"});
  group.payload={...p,realtimeTopic};
  return realtimeTopic;
}
async function broadcast(group,event,payload={}){
  if(!ALLOWED_RT_EVENTS.has(event))throw new Error("GROUPTALK_REALTIME_EVENT_NOT_ALLOWED");
  const {url,key}=await realtimeServerConfig(), topic=await ensureTopic(group);
  const res=await fetch(`${url}/realtime/v1/api/broadcast`,{
    method:"POST",
    headers:{apikey:key,Authorization:`Bearer ${key}`,"Content-Type":"application/json"},
    body:JSON.stringify({messages:[{topic,event:"grouptalk",payload:{event,groupId:group.id,groupKey:group.group_key,emittedAt:now(),payload}}]})
  });
  if(!res.ok)throw new Error(`SUPABASE_REALTIME_HTTP_${res.status}`);
  return {ok:true,event,topic};
}

async function audit(eventType,{agent,group=null,entityTable=null,entityId=null,ticketNo=null,before=null,after=null,message=null,payload={}}={}){
  try{
    await restRequest({table:T.audit,method:"POST",body:{event_type:eventType,entity_table:entityTable,entity_id:entityId,group_key:group?.group_key||null,ticket_number:ticketNo,before_value:before===null?null:jsonText(before),after_value:after===null?null:jsonText(after),source:"wix-grouptalk",message,payload,created_by_agent_user_id:agent?.id||null,created_by_name:agent?displayName(agent):null,created_at:now()},prefer:"return=minimal"});
  }catch(e){console.warn("[GroupTalk] audit write failed",e?.message||e)}
}
async function history(eventType,{agent,group=null,ticketNo=null,livekitRoom=null,message=null,payload={}}={}){
  try{
    await restRequest({table:T.history,method:"POST",body:{event_type:eventType,group_key:group?.group_key||null,channel_name:group?.channel_name||null,actor_agent_user_id:agent?.id||null,actor_sk_id:agent?.sk_id||null,actor_name:agent?displayName(agent):null,ticket_number:ticketNo,livekit_room:livekitRoom,pusher_channel:null,message,payload,created_at:now()},prefer:"return=minimal"});
  }catch(e){console.warn("[GroupTalk] history write failed",e?.message||e)}
}

function publicCategory(r){ return {categoryId:r.category_key,id:r.category_key,title:r.label,name:r.label,label:r.label,description:r.description||"",active:r.is_active!==false,sort:Number(r.sort_order||100),priorityDefault:r.priority_default||"normal",slaMinutes:Number(r.sla_minutes||1440)}; }
async function categoryRows(includeHidden=false){
  const q={select:"*",order:"sort_order.asc",limit:500}; if(!includeHidden)q.is_active="eq.true";
  const rows=await restRequest({table:T.categories,query:q}); return Array.isArray(rows)?rows:[];
}
async function ensureCategories(agent){
  const current=await categoryRows(true); if(current.length)return current;
  const rows=DEFAULT_CATEGORIES.map(([category_key,label],i)=>({category_key,label,priority_default:"normal",sla_minutes:1440,is_active:true,sort_order:(i+1)*10,payload:{},created_by_agent_user_id:agent.id,created_at:now(),updated_at:now()}));
  const created=await restRequest({table:T.categories,method:"POST",body:rows}); return Array.isArray(created)?created:[];
}

async function phonebook(){
  const rows=await restRequest({table:T.phonebook,query:{select:"*",is_visible:"eq.true",order:"display_name.asc",limit:1000}});
  if(Array.isArray(rows)&&rows.length)return rows.map(r=>({name:r.display_name,skId:r.sk_id||"",role:r.position||r.department||"",base:r.base||r.station||"",phone:r.phone||r.extension||"",email:r.email||"",status:r.presence_status||r.availability_status||"offline",avatarUrl:r.avatar_url||""}));
  const agents=await restRequest({table:T.agents,query:{select:"id,sk_id,first_name,last_name,preferred_name,display_name,role,position,department,station,base,email,corporate_email_address,active,authorized",active:"eq.true",authorized:"eq.true",order:"last_name.asc",limit:1000}});
  return (Array.isArray(agents)?agents:[]).map(a=>({name:displayName(a),skId:a.sk_id||"",role:a.role||a.position||"",base:a.base||a.station||"",phone:"",email:a.corporate_email_address||a.email||"",status:"offline"}));
}

function publicTicket(r){
  const p=obj(r.payload);
  return {ticketId:r.id,id:r.id,ticketNumber:r.ticket_number,category:r.category_key,categoryKey:r.category_key,groupId:r.group_id,groupKey:r.group_key,subject:r.title,title:r.title,message:r.description||"",description:r.description||"",status:upper(r.status||"open"),priority:r.priority||"Normal",requesterAgentId:r.requester_agent_user_id,requesterSkId:r.requester_sk_id||"",requesterName:r.requester_name||"",requesterEmail:r.requester_email||"",assignedAgentId:r.assigned_agent_user_id,assignedSkId:r.assigned_sk_id||"",assignedName:r.assigned_name||"",routeRef:p.routeRef||p.route_ref||"",caseMode:p.caseMode===true,targetSkIds:Array.isArray(p.targetSkIds)?p.targetSkIds:[],employees:Array.isArray(p.employees)?p.employees:[],locationLabel:r.location_label||"",latitude:r.latitude,longitude:r.longitude,createdAt:r.created_at,updatedAt:r.updated_at,closedAt:r.closed_at};
}
function publicReply(r){ return {id:r.id,ticketId:r.ticket_id,ticketNumber:r.ticket_number,body:r.body,senderRole:r.reply_type||"STAFF",senderSkId:r.author_sk_id||"",senderName:r.author_name||"",isInternal:r.is_internal!==false,createdAt:r.created_at,payload:obj(r.payload)}; }

async function startRealtimeSession(agent,group){
  const sessionKey=`GT-RT-${opaque()}`, topic=await ensureTopic(group);
  await restRequest({table:T.sessions,method:"POST",body:{session_key:sessionKey,agent_user_id:agent.id,sk_id:agent.sk_id||null,display_name:displayName(agent),pusher_socket_id:null,pusher_channel:null,livekit_room:group.livekit_room||null,livekit_identity:agent.sk_id||agent.id,status:"online",joined_at:now(),left_at:null,payload:{provider:"supabase-realtime",groupId:group.id,groupKey:group.group_key,topic,role:agent.role||agent.position||"",base:agent.base||agent.station||""},created_at:now(),updated_at:now()},prefer:"return=minimal"});
  return {sessionKey,topic};
}
async function presence(group){
  const cutoff=new Date(Date.now()-70000).toISOString();
  const rows=await restRequest({table:T.sessions,query:{select:"*",status:"eq.online",updated_at:`gte.${cutoff}`,order:"updated_at.desc",limit:1000}});
  const out=[], seen=new Set();
  for(const r of Array.isArray(rows)?rows:[]){ const p=obj(r.payload); if(p.groupId!==group.id && p.groupKey!==group.group_key)continue; const k=r.agent_user_id||r.sk_id||r.session_key; if(seen.has(k))continue; seen.add(k); out.push({id:k,agentUserId:r.agent_user_id,skId:r.sk_id||"",name:r.display_name||r.sk_id||"Staff",role:p.role||"",base:p.base||"",state:"online",updatedAt:r.updated_at}); }
  return out;
}

export const getGroupTalkBootstrap = webMethod(Permissions.SiteMember, async function(){
  const {agent,profile}=await requireStaff();
  const [groups,cats,contacts]=await Promise.all([allowedGroups(agent),ensureCategories(agent),phonebook()]);
  const active=groups.find(g=>g.defaultGroup)||groups[0]||null;
  const ticketQuery={select:"*",order:"updated_at.desc",limit:200}; if(agent.can_manage!==true)ticketQuery.requester_agent_user_id=`eq.${agent.id}`;
  const ticketRows=await restRequest({table:T.tickets,query:ticketQuery});
  return {ok:true,provider:"SUPABASE",realtimeProvider:"SUPABASE_REALTIME",voiceProvider:"LIVEKIT",profile,groups,activeGroupId:active?.groupId||"",phonebook:contacts,tickets:(Array.isArray(ticketRows)?ticketRows:[]).map(publicTicket),ticketCategories:(Array.isArray(cats)?cats:[]).filter(x=>x.is_active!==false).sort((a,b)=>Number(a.sort_order||100)-Number(b.sort_order||100)).map(publicCategory),config:{realtimeProvider:"SUPABASE_REALTIME",voiceProvider:"LIVEKIT",mapProvider:"OPENFREEMAP",presenceProvider:"SUPABASE_REALTIME_SESSIONS"},canManage:agent.can_manage===true};
});

export const getGroupTalkRealtimeConfig = webMethod(Permissions.SiteMember, async function({groupId=""}={}){
  const {agent,profile}=await requireStaff(); const {row:group,public:g}=await requireGroup(agent,groupId);
  const [browser,session]=await Promise.all([realtimeBrowserConfig(),startRealtimeSession(agent,group)]);
  await broadcast(group,"presence-updated",{member:{id:agent.id,agentUserId:agent.id,skId:profile.skId,name:profile.name,role:profile.role,base:profile.base,state:"online"}}).catch(()=>null);
  return {ok:true,provider:"SUPABASE_REALTIME",supabaseUrl:browser.url,publishableKey:browser.publishableKey,topic:session.topic,broadcastEvent:"grouptalk",sessionKey:session.sessionKey,groupId:g.groupId,groupKey:g.groupKey};
});

export const updateGroupTalkPresence = webMethod(Permissions.SiteMember, async function({groupId="",sessionKey="",status="online",heartbeat=false}={}){
  const {agent,profile}=await requireStaff(); const {row:group}=await requireGroup(agent,groupId); const key=clean(sessionKey,240); if(!key)throw new Error("GROUPTALK_REALTIME_SESSION_REQUIRED");
  const s=first(await restRequest({table:T.sessions,query:{select:"*",session_key:`eq.${key}`,agent_user_id:`eq.${agent.id}`,limit:1}})); if(!s)throw new Error("GROUPTALK_REALTIME_SESSION_NOT_FOUND");
  const next=lower(status)==="offline"?"offline":"online";
  await restRequest({table:T.sessions,method:"PATCH",query:{id:`eq.${s.id}`},body:{status:next,left_at:next==="offline"?now():null,updated_at:now()},prefer:"return=minimal"});
  if(!heartbeat || next==="offline")await broadcast(group,"presence-updated",{member:{id:agent.id,agentUserId:agent.id,skId:profile.skId,name:profile.name,role:profile.role,base:profile.base,state:next}}).catch(()=>null);
  return {ok:true,status:next};
});

export const getGroupTalkPresence = webMethod(Permissions.SiteMember, async function({groupId=""}={}){ const {agent}=await requireStaff(); const {row}=await requireGroup(agent,groupId); return {ok:true,members:await presence(row)}; });

export const createLiveKitToken = webMethod(Permissions.SiteMember, async function({groupId=""}={}){
  const {agent,profile}=await requireStaff(); const {row:group,public:g}=await requireGroup(agent,groupId);
  if(g.capabilities.canListen!==true)throw new Error("GROUPTALK_AUDIO_LISTEN_DISABLED");
  const [apiKey,apiSecret,livekitUrl]=await Promise.all([secret("LIVEKIT_API_KEY"),secret("LIVEKIT_API_SECRET"),secret("LIVEKIT_URL")]);
  if(!apiKey||!apiSecret||!livekitUrl)throw new Error("LIVEKIT_SECRETS_MISSING");
  const room=group.livekit_room||`grouptalk-${group.group_key}`, identity=profile.skId||profile.agentId||agent.id;
  const token=new AccessToken(apiKey,apiSecret,{identity,name:profile.name,ttl:"15m",metadata:JSON.stringify({skId:profile.skId,role:profile.role,base:profile.base,groupId:group.id,provider:"SKANDI_GROUPTALK"})});
  token.addGrant({roomJoin:true,room,canSubscribe:true,canPublish:g.capabilities.canTalk===true,canPublishData:true});
  const jwt=await token.toJwt(); await history("LIVEKIT_TOKEN_CREATED",{agent,group,livekitRoom:room,payload:{canPublishAudio:g.capabilities.canTalk===true}});
  return {ok:true,token:jwt,livekitUrl,room,roomName:room,groupId:group.id,canPublishAudio:g.capabilities.canTalk===true,canSubscribe:true};
});

export const triggerGroupTalkEvent = webMethod(Permissions.SiteMember, async function(payload={}){
  const {agent,profile}=await requireStaff(); const type=upper(payload.type||"EVENT"); const {row:group,public:g}=await requireGroup(agent,payload.groupId||payload.group);
  if(type.includes("DESKTOP") && agent.can_manage!==true)throw new Error("GROUPTALK_DESKTOP_ACTION_NOT_ALLOWED");
  if((type.includes("PTT_DOWN")||type.includes("AUDIO_START")) && g.capabilities.canTalk!==true)throw new Error("GROUPTALK_TALK_DISABLED");
  const data={type,groupId:group.id,groupKey:group.group_key,group:group.name,skId:profile.skId,name:profile.name,role:profile.role,base:profile.base,targetSkId:clean(payload.targetSkId,80)||null,targetName:clean(payload.targetName,160)||null,targetPhone:clean(payload.targetPhone,80)||null,silent:payload.silent===true,priority:clean(payload.priority,40)||null,createdAt:now()};
  const event=type==="EMERGENCY"?"emergency-alert":(type.includes("PTT_DOWN")||type.includes("AUDIO_START"))?"ptt-started":(type.includes("PTT_UP")||type.includes("AUDIO_STOP"))?"ptt-ended":"grouptalk-event";
  await Promise.all([audit(type,{agent,group,entityTable:T.groups,entityId:group.id,payload:data}),history(type,{agent,group,message:event,payload:data})]);
  return {ok:true,eventType:type,realtime:await broadcast(group,event,data)};
});

export const getPhoneBook = webMethod(Permissions.SiteMember, async function({groupId=""}={}){ const {agent}=await requireStaff(); if(groupId)await requireGroup(agent,groupId); return {ok:true,contacts:await phonebook()}; });

export const sendLocationPing = webMethod(Permissions.SiteMember, async function(payload={}){
  const {agent,profile}=await requireStaff(); const latitude=Number(payload.latitude),longitude=Number(payload.longitude); if(!Number.isFinite(latitude)||!Number.isFinite(longitude))throw new Error("Valid latitude and longitude are required.");
  const {row:group,public:g}=await requireGroup(agent,payload.groupId); if(g.capabilities.canViewLocations!==true)throw new Error("GROUPTALK_LOCATION_DISABLED");
  const stamp=now(); const rows=await restRequest({table:T.locations,method:"POST",query:{on_conflict:"agent_user_id"},body:{agent_user_id:agent.id,sk_id:profile.skId||null,display_name:profile.name,latitude,longitude,accuracy_meters:Number.isFinite(Number(payload.accuracy))?Number(payload.accuracy):null,heading:Number.isFinite(Number(payload.heading))?Number(payload.heading):null,speed:Number.isFinite(Number(payload.speed))?Number(payload.speed):null,source:"browser-geolocation",group_key:group.group_key,last_seen_at:stamp,payload:{role:profile.role,base:profile.base,groupId:group.id},updated_at:stamp},prefer:"resolution=merge-duplicates,return=representation"});
  const r=first(rows)||{}; const location={id:r.id,agentUserId:agent.id,skId:r.sk_id||profile.skId,name:r.display_name||profile.name,role:obj(r.payload).role||profile.role,base:obj(r.payload).base||profile.base,groupId:group.id,groupKey:group.group_key,latitude:Number(r.latitude??latitude),longitude:Number(r.longitude??longitude),accuracy:r.accuracy_meters,heading:r.heading,speed:r.speed,lastSeenAt:r.last_seen_at||stamp};
  await broadcast(group,"location-updated",location); return {ok:true,location};
});

export const getLiveLocations = webMethod(Permissions.SiteMember, async function({groupId=""}={}){
  const {agent}=await requireStaff(); const {row:group,public:g}=await requireGroup(agent,groupId); if(g.capabilities.canViewLocations!==true)return {ok:true,locations:[]};
  const cutoff=new Date(Date.now()-15*60*1000).toISOString(); const rows=await restRequest({table:T.locations,query:{select:"*",group_key:`eq.${group.group_key}`,last_seen_at:`gte.${cutoff}`,order:"last_seen_at.desc",limit:1000}});
  return {ok:true,locations:(Array.isArray(rows)?rows:[]).map(r=>({id:r.id,agentUserId:r.agent_user_id,skId:r.sk_id||"",name:r.display_name||r.sk_id||"Staff",role:obj(r.payload).role||"",base:obj(r.payload).base||"",groupId:obj(r.payload).groupId||group.id,groupKey:r.group_key,latitude:Number(r.latitude),longitude:Number(r.longitude),accuracy:r.accuracy_meters,heading:r.heading,speed:r.speed,lastSeenAt:r.last_seen_at}))};
});

async function categoryKey(value,agent){ await ensureCategories(agent); const key=slug(value||"operations-question"); const row=first(await restRequest({table:T.categories,query:{select:"category_key",category_key:`eq.${key}`,is_active:"eq.true",limit:1}})); return row?.category_key||"operations-question"; }

export const createGroupTalkTicket = webMethod(Permissions.SiteMember, async function(payload={}){
  const {agent,profile}=await requireStaff(); const {row:group,public:g}=await requireGroup(agent,payload.groupId); if(g.capabilities.canCreateTickets!==true && agent.can_manage!==true)throw new Error("GROUPTALK_TICKET_CREATE_DISABLED");
  const cat=await categoryKey(payload.category,agent), stamp=now();
  const inserted=first(await restRequest({table:T.tickets,method:"POST",body:{ticket_number:ticketNumber(),category_key:cat,group_id:group.id,group_key:group.group_key,title:clean(payload.subject,240)||"Ops request",description:clean(payload.message,6000),status:"open",priority:lower(payload.priority||"normal"),requester_agent_user_id:agent.id,requester_sk_id:profile.skId||null,requester_name:profile.name,requester_email:profile.email||null,location_label:clean(payload.locationLabel,300)||null,latitude:Number.isFinite(Number(payload.latitude))?Number(payload.latitude):null,longitude:Number.isFinite(Number(payload.longitude))?Number(payload.longitude):null,payload:{routeRef:clean(payload.routeRef,300),caseMode:payload.caseMode===true,createdFrom:clean(payload.createdFrom,120),targetSkIds:Array.isArray(payload.targetSkIds)?payload.targetSkIds.map(v=>clean(v,80)).filter(Boolean):[],employees:Array.isArray(payload.employees)?payload.employees.slice(0,100):[]},created_by_agent_user_id:agent.id,created_at:stamp,updated_at:stamp}}));
  if(!inserted)throw new Error("GROUPTALK_TICKET_CREATE_FAILED");
  const body=clean(payload.message,6000); if(body)await restRequest({table:T.replies,method:"POST",body:{ticket_id:inserted.id,ticket_number:inserted.ticket_number,body,author_agent_user_id:agent.id,author_sk_id:profile.skId||null,author_name:profile.name,reply_type:"staff",is_internal:true,payload:{initial:true},created_at:stamp},prefer:"return=minimal"});
  const ticket=publicTicket(inserted); await Promise.all([audit("OPS_REQUEST_CREATED",{agent,group,entityTable:T.tickets,entityId:inserted.id,ticketNo:inserted.ticket_number,after:ticket}),history("OPS_REQUEST_CREATED",{agent,group,ticketNo:inserted.ticket_number,message:ticket.subject,payload:ticket}),broadcast(group,"ticket-created",{ticket})]);
  return {ok:true,ticket};
});

export const getGroupTalkTickets = webMethod(Permissions.SiteMember, async function(payload={}){
  const {agent,profile}=await requireStaff(); const ticketId=clean(payload.ticketId,160);
  if(ticketId){
    let row=first(await restRequest({table:T.tickets,query:{select:"*",id:`eq.${ticketId}`,limit:1}})); if(!row)row=first(await restRequest({table:T.tickets,query:{select:"*",ticket_number:`eq.${ticketId}`,limit:1}})); if(!row)throw new Error("Ticket not found.");
    await requireGroup(agent,row.group_id||row.group_key); if(agent.can_manage!==true && row.requester_agent_user_id!==agent.id && row.requester_sk_id!==profile.skId)throw new Error("Not authorized for this ticket.");
    const replies=await restRequest({table:T.replies,query:{select:"*",ticket_id:`eq.${row.id}`,order:"created_at.asc",limit:500}}); return {ok:true,ticket:publicTicket(row),messages:(Array.isArray(replies)?replies:[]).map(publicReply)};
  }
  const q={select:"*",order:"updated_at.desc",limit:300}; if(payload.groupId){const {row}=await requireGroup(agent,payload.groupId);q.group_id=`eq.${row.id}`;} if(payload.mineOnly||agent.can_manage!==true)q.requester_agent_user_id=`eq.${agent.id}`;
  const rows=await restRequest({table:T.tickets,query:q}); return {ok:true,tickets:(Array.isArray(rows)?rows:[]).map(publicTicket)};
});

export const replyToGroupTalkTicket = webMethod(Permissions.SiteMember, async function(payload={}){
  const {agent,profile}=await requireStaff(); const id=clean(payload.ticketId,160); if(!id)throw new Error("Ticket ID is required."); const row=first(await restRequest({table:T.tickets,query:{select:"*",id:`eq.${id}`,limit:1}})); if(!row)throw new Error("Ticket not found.");
  const {row:group}=await requireGroup(agent,row.group_id||row.group_key); const owner=row.requester_agent_user_id===agent.id||row.requester_sk_id===profile.skId; if(!owner&&agent.can_manage!==true)throw new Error("Not authorized for this ticket.");
  const body=clean(payload.body,6000)||(upper(payload.status)==="RESOLVED"?"Resolved.":""); if(!body)throw new Error("Reply body is required."); const stamp=now();
  await restRequest({table:T.replies,method:"POST",body:{ticket_id:row.id,ticket_number:row.ticket_number,body,author_agent_user_id:agent.id,author_sk_id:profile.skId||null,author_name:profile.name,reply_type:agent.can_manage===true?"operations":"staff",is_internal:true,payload:{manifestText:clean(payload.manifestText,10000),delivery:clean(payload.delivery,80),emailTo:clean(payload.emailTo,320)},created_at:stamp},prefer:"return=minimal"});
  const next=upper(payload.status)==="RESOLVED"?"resolved":row.status; const updated=first(await restRequest({table:T.tickets,method:"PATCH",query:{id:`eq.${row.id}`},body:{status:next,closed_at:next==="resolved"?stamp:row.closed_at,updated_at:stamp}}))||{...row,status:next,updated_at:stamp};
  const replies=await restRequest({table:T.replies,query:{select:"*",ticket_id:`eq.${row.id}`,order:"created_at.asc",limit:500}}); const ticket=publicTicket(updated);
  await Promise.all([audit("TICKET_REPLY",{agent,group,entityTable:T.tickets,entityId:row.id,ticketNo:row.ticket_number,after:ticket}),history("TICKET_REPLY",{agent,group,ticketNo:row.ticket_number,message:body,payload:{status:next}}),broadcast(group,"ticket-updated",{ticket})]);
  return {ok:true,ticket,messages:(Array.isArray(replies)?replies:[]).map(publicReply)};
});

export const searchGroupTalkHistory = webMethod(Permissions.SiteMember, async function({query="",groupId="",limit=200}={}){
  const {agent}=await requireStaff(); let group=null; if(groupId)group=(await requireGroup(agent,groupId)).row; const q={select:"*",order:"created_at.desc",limit:Math.min(Math.max(Number(limit)||200,1),1000)}; if(group)q.group_key=`eq.${group.group_key}`;
  const rows=await restRequest({table:T.history,query:q}), needle=lower(query); const items=(Array.isArray(rows)?rows:[]).filter(r=>!needle||[r.event_type,r.actor_sk_id,r.actor_name,r.target_sk_id,r.target_name,r.ticket_number,r.message,jsonText(r.payload)].join(" ").toLowerCase().includes(needle)).map(r=>({id:r.id,eventType:r.event_type,groupKey:r.group_key,actorSkId:r.actor_sk_id,actorName:r.actor_name,targetSkId:r.target_sk_id,targetName:r.target_name,ticketNumber:r.ticket_number,message:r.message,payload:obj(r.payload),createdAt:r.created_at}));
  return {ok:true,items};
});

export const adminSaveGroup = webMethod(Permissions.SiteMember, async function(payload={}){
  const {agent}=await requireOps(); const requested=clean(payload.groupId,160); let existing=null; if(requested)existing=first(await restRequest({table:T.groups,query:{select:"*",id:`eq.${requested}`,limit:1}}));
  const name=clean(payload.title||payload.name,160)||existing?.name||"GroupTalk Group", key=existing?.group_key||`${slug(name)}-${randomPart(5)}`, oldPayload=obj(existing?.payload), realtimeTopic=clean(oldPayload.realtimeTopic||oldPayload.realtime_topic,240)||`grouptalk:${opaque()}`;
  const body={group_key:key,name,description:clean(payload.description,1000)||existing?.description||"",channel_name:existing?.channel_name||`grouptalk-${key}`,pusher_channel:null,livekit_room:clean(payload.livekitRoomName,220)||existing?.livekit_room||`grouptalk-${key}`,group_type:clean(payload.category||payload.groupType,80)||existing?.group_type||"Operations",visibility:payload.allowAllStaff!==false?"all_staff":"restricted",status:payload.active===false?"inactive":"active",can_voice:payload.canStaffTalk!==false,can_chat:true,can_location:payload.canLocation!==false,can_ticket:payload.canStaffCreateTickets!==false,sort_order:Number(payload.sortOrder??existing?.sort_order??0),payload:{...oldPayload,base:clean(payload.base,80)||oldPayload.base||"",allowAllStaff:payload.allowAllStaff!==false,defaultGroup:payload.defaultGroup===true||oldPayload.defaultGroup===true,realtimeTopic},updated_at:now()};
  const saved=existing?first(await restRequest({table:T.groups,method:"PATCH",query:{id:`eq.${existing.id}`},body})):first(await restRequest({table:T.groups,method:"POST",body:{...body,created_by_agent_user_id:agent.id,created_at:now()}})); if(!saved)throw new Error("GROUPTALK_GROUP_SAVE_FAILED");
  await Promise.all([audit("ADMIN_SAVE_GROUP",{agent,group:saved,entityTable:T.groups,entityId:saved.id,before:existing,after:saved}),broadcast(saved,"group-updated",{group:publicGroup(saved,null,agent)})]); return {ok:true,group:publicGroup(saved,null,agent)};
});

async function resolveAgent(value){
  const key=clean(value,320); if(!key)return null;
  if(/^[0-9a-f-]{36}$/i.test(key)){const r=first(await restRequest({table:T.agents,query:{select:AGENT_FIELDS,id:`eq.${key}`,limit:1}}));if(r)return r;}
  let r=first(await restRequest({table:T.agents,query:{select:AGENT_FIELDS,sk_id:`ilike.${key}`,limit:1}})); if(r)return r;
  return first(await restRequest({table:T.agents,query:{select:AGENT_FIELDS,corporate_email_address:`ilike.${lower(key)}`,limit:1}}));
}

export const adminSetMembership = webMethod(Permissions.SiteMember, async function(payload={}){
  const {agent}=await requireOps(); const {row:group}=await requireGroup(agent,payload.groupId); const target=await resolveAgent(payload.agentUserId||payload.memberKey||payload.skId||payload.email); if(!target)throw new Error("GROUPTALK_MEMBER_NOT_FOUND"); const active=payload.active!==false;
  const rows=await restRequest({table:T.members,method:"POST",query:{on_conflict:"group_key,agent_user_id"},body:{group_id:group.id,group_key:group.group_key,agent_user_id:target.id,sk_id:target.sk_id||null,display_name:displayName(target),email:target.corporate_email_address||target.email||null,role:clean(payload.role,80)||"member",membership_status:active?"active":"inactive",can_talk:payload.canTalk!==false,can_listen:payload.canListen!==false,can_admin:payload.canAdmin===true,can_view_locations:payload.canViewLocations!==false,can_manage_tickets:payload.canManageTickets!==false,payload:{},created_by_agent_user_id:agent.id,updated_at:now()},prefer:"resolution=merge-duplicates,return=representation"}); const membership=first(rows);
  await Promise.all([audit("ADMIN_SET_MEMBERSHIP",{agent,group,entityTable:T.members,entityId:membership?.id||null,after:membership}),broadcast(group,"membership-updated",{agentUserId:target.id,skId:target.sk_id,active})]); return {ok:true,membership};
});

export const getTicketCategories = webMethod(Permissions.SiteMember, async function(){ const {agent}=await requireStaff(); const rows=await ensureCategories(agent); return {ok:true,categories:(Array.isArray(rows)?rows:[]).filter(r=>r.is_active!==false).sort((a,b)=>Number(a.sort_order||100)-Number(b.sort_order||100)).map(publicCategory)}; });

export const saveTicketCategory = webMethod(Permissions.SiteMember, async function(payload={}){
  const {agent}=await requireOps(), c=obj(payload.category), label=clean(c.title||c.label||c.name,160); if(!label)throw new Error("Ticket category name is required."); const key=slug(c.categoryId||c.id||label);
  const rows=await restRequest({table:T.categories,method:"POST",query:{on_conflict:"category_key"},body:{category_key:key,label,description:clean(c.description,1000),priority_default:lower(c.priorityDefault||"normal"),sla_minutes:Math.max(Number(c.slaMinutes||1440),1),is_active:c.active!==false,sort_order:Number(c.sort||c.sortOrder||100),payload:{},created_by_agent_user_id:agent.id,updated_at:now()},prefer:"resolution=merge-duplicates,return=representation"}); const saved=first(rows); await audit("TICKET_CATEGORY_SAVE",{agent,entityTable:T.categories,entityId:saved?.id||key,after:saved});
  if(payload.groupId){try{const {row:g}=await requireGroup(agent,payload.groupId);await broadcast(g,"categories-updated",{categoryKey:key})}catch(_){}}
  return {ok:true,category:saved?publicCategory(saved):null,categories:(await categoryRows()).map(publicCategory),message:"Category saved"};
});

export const deleteTicketCategory = webMethod(Permissions.SiteMember, async function(payload={}){
  const {agent}=await requireOps(), key=slug(payload.categoryId); await restRequest({table:T.categories,method:"PATCH",query:{category_key:`eq.${key}`},body:{is_active:false,updated_at:now()},prefer:"return=minimal"}); await audit("TICKET_CATEGORY_DELETE",{agent,entityTable:T.categories,entityId:key,payload:{categoryKey:key}});
  if(payload.groupId){try{const {row:g}=await requireGroup(agent,payload.groupId);await broadcast(g,"categories-updated",{categoryKey:key})}catch(_){}}
  return {ok:true,categories:(await categoryRows()).map(publicCategory),message:"Category removed"};
});
