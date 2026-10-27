
/* =========================================
   SKANDI GROUPTALK JS
   ========================================= */
const SOURCE="GROUPTALK_HTML",PARENT="SKANDI_WIX_PARENT";
const state={
  mode:"mobile",profile:{},canManage:false,groups:[],activeGroup:null,config:{},
  lkCbs:new Map(),realtimeCbs:new Map(),room:null,voiceConnectPromise:null,voiceConnectTarget:"",voiceRoomName:"",
  supabaseClient:null,supabaseUrl:"",supabaseKey:"",realtimeChannel:null,realtimeConfig:null,realtimeConnecting:false,
  realtimeHeartbeat:null,realtimePresenceRefresh:null,realtimeAuthRefresh:null,databaseRefreshTimer:null,syncTimer:null,
  members:new Map(),phonebook:[],tickets:[],ticketCategories:[],caseTargets:new Set(),selectedTicket:null,
  outputDeviceId:"",map:null,mapLoaded:false,mapResizeObserver:null,mapRefreshTimer:null,
  mapFitPending:true,markers:new Map(),watch:null,speaking:false,pttHeld:false,pttSequence:0
};
function $(id){return document.getElementById(id)}function post(type,payload={}){parent.postMessage({source:SOURCE,type,payload,timestamp:new Date().toISOString()},"*")}function req(p="REQ"){return p+"-"+Date.now()+"-"+Math.random().toString(36).slice(2,8)}function text(id,v){const e=$(id);if(e)e.textContent=v}function toast(m){const t=$("toast");t.textContent=m;t.style.display="block";setTimeout(()=>t.style.display="none",2500)}function gid(){return state.activeGroup?.groupId||""}function mobile(){return innerWidth<=767}
let chromeClockUtc=false;
function updateChromeClock(){
  const now=new Date();
  const opts={hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false};
  if(chromeClockUtc)opts.timeZone="UTC";
  text("skChromeClockTime",now.toLocaleTimeString("en-GB",opts));
  text("skChromeClockDate",chromeClockUtc?"UTC":"LOCAL");
}
setInterval(updateChromeClock,1000);
updateChromeClock();
function decide(){state.mode=mobile()?"mobile":"desktop";document.body.classList.toggle("mode-mobile",state.mode==="mobile");document.body.classList.toggle("mode-desktop",state.mode==="desktop");document.body.classList.toggle("can-manage",!!state.canManage);if(state.mode==="desktop"){initMap();scheduleMapResize();startMapRefresh()}else{stopMapRefresh()}}addEventListener("resize",decide,{passive:true});
function render(){const p=state.profile,g=state.activeGroup||{};text("skChromeUserName",p.name||"—");text("skChromeSkid",p.skId||"—");text("skChromePosition",p.role||"—");text("skChromeBase",p.base||"—");text("mGroup",g.title||"—");text("mActiveGroup",g.title||"—");text("dActiveGroup",g.title||"—");text("mSub","Shortcuts");text("mActiveUser",p.name?`${p.name}${p.role?` (${p.role})`:""}`:[p.base,p.role].filter(Boolean).join(" • "));text("dUser",p.name||"—");text("dMeta",[p.skId,p.role,p.base].filter(Boolean).join(" · "));text("dActiveSub",`${g.base||p.base||""} • ${g.category||"Operations"}`);groups();phonebook();tickets();members();renderTicketCategories()}
function groups(){const a=$("groupList"),m=$("mobileGroupList");if(a)a.innerHTML="";if(m)m.innerHTML="";state.groups.forEach(g=>{const active=state.activeGroup&&g.groupId===state.activeGroup.groupId;const d=document.createElement("div");d.className="groupItem"+(active?" active":"");d.innerHTML=`<b>${g.title}</b><div class="small">${g.base||""} · ${g.category||""}</div><span class="badge">${g.capabilities?.canTalk?"Talk":"Listen"}</span> <span class="badge">${g.capabilities?.canCreateTickets?"Tickets":"No tickets"}</span>`;d.onclick=()=>switchGroup(g.groupId);a?.appendChild(d);const b=document.createElement("button");b.className="tile";b.style.width="100%";b.style.marginBottom="8px";b.innerHTML=`<span class="ico">🌐</span><span class="main">${g.title}</span><span class="sub">${g.base||""}</span>`;b.onclick=()=>{switchGroup(g.groupId);close("groupSheet")};m?.appendChild(b)})}
function phonebook(){mobilePhonebook();desktopPhonebook();renderCaseTargets()}
function mobilePhonebook(){const b=$("phoneList");if(!b)return;b.innerHTML="";if(!state.phonebook.length){b.textContent="No contacts in phone book.";return}state.phonebook.forEach(c=>{const r=document.createElement("div");r.className="phoneRow";r.innerHTML=`<div><b>${c.name||"Unnamed"}</b><div class="small">${[c.role,c.base,c.status].filter(Boolean).join(" • ")}</div></div>`;const btn=document.createElement("button");btn.className="mini";btn.textContent=c.phone||"Call";btn.onclick=()=>sendPtt("PHONE_BOOK_CALL",{targetSkId:c.skId,targetName:c.name,targetPhone:c.phone});r.appendChild(btn);b.appendChild(r)})}
function desktopPhonebook(){const d=$("desktopPhoneList");if(!d)return;d.innerHTML="";if(!state.phonebook.length){d.className="desktopPhoneList empty";d.textContent="No contacts loaded. Use Open to request the phonebook.";return}d.className="desktopPhoneList";state.phonebook.forEach(c=>{const row=document.createElement("div");row.className="phoneCard";const label=document.createElement("div");label.innerHTML=`<b>${c.name||"Unnamed"}</b><div class="small">${[c.skId,c.role,c.base,c.status].filter(Boolean).join(" • ")}</div>`;const actions=document.createElement("div");actions.className="phoneActions";const add=document.createElement("button");add.className="mini";add.type="button";add.textContent=state.caseTargets.has(c.skId)?"Selected":"Add Case";add.onclick=()=>toggleCaseTarget(c.skId);const call=document.createElement("button");call.className="mini";call.type="button";call.textContent=c.phone?"Call":"Ping";call.onclick=()=>sendPtt("PHONE_BOOK_CALL",{targetSkId:c.skId,targetName:c.name,targetPhone:c.phone});actions.appendChild(add);actions.appendChild(call);row.appendChild(label);row.appendChild(actions);d.appendChild(row)})}
function tickets(){const tb=$("ticketTable"),mine=$("myTicketsList");if(tb)tb.innerHTML="";if(mine)mine.innerHTML="";text("ticketCount",String(state.tickets.length));state.tickets.forEach(t=>{const tr=document.createElement("tr");tr.className="click";tr.innerHTML=`<td>${t.priority||"Normal"}</td><td>${t.subject||t.title||t.ticketId}</td><td>${t.status||"OPEN"}</td>`;tr.onclick=()=>openTicket(t.ticketId);tb?.appendChild(tr);const r=document.createElement("div");r.className="ticketRow";r.innerHTML=`<div><b>${t.subject||t.title||t.ticketId}</b><div class="small">${t.category} · ${t.status}</div></div><button class="mini">Open</button>`;r.querySelector("button").onclick=()=>openTicket(t.ticketId);mine?.appendChild(r)})}
function members(){
  const arr=[...state.members.values()];
  text("mOnlineCount",String(arr.length));
  text("onlineCount",String(arr.length));

  const mobile=$("mobileOnlineList");
  if(mobile){
    mobile.innerHTML="";
    if(!arr.length){
      mobile.innerHTML='<div class="small" style="padding:12px 0">No active colleagues.</div>'
    }else{
      arr.forEach(m=>{
        const row=document.createElement("div");
        row.className="phoneRow";
        row.innerHTML=`<div><b>${m.name||m.id||"Staff"}</b><div class="small">${[m.role,m.base].filter(Boolean).join(" • ")}</div></div><span class="badge">${m.state||"online"}</span>`;
        mobile.appendChild(row)
      })
    }
  }

  const tb=$("onlineTable");
  if(tb){
    tb.innerHTML="";
    arr.forEach(m=>{
      const tr=document.createElement("tr");
      tr.innerHTML=`<td>${m.name||m.id||"Staff"}<div class="small">${[m.role,m.base].filter(Boolean).join(" • ")}</div></td><td><span class="badge">${m.state||"online"}</span></td>`;
      tb.appendChild(tr)
    })
  }

  caseEmployees()
}
function switchGroup(id){
  const g=state.groups.find(x=>(x.groupId||x.id)===id);if(!g)return;
  const previous=gid();
  if(previous&&previous!==id){
    if(state.watch){try{navigator.geolocation.clearWatch(state.watch)}catch(_){ } state.watch=null}
    disconnectSupabaseRealtime(true);
    disconnectVoiceRoom().catch(()=>{});
  }
  state.activeGroup=g;
  if(previous!==gid())clearMapMarkers();
  render();
  connectSupabaseRealtime().catch(e=>{setRealtimeStatus("error","Connection error");console.error("Supabase Realtime connect failed:",e)});
  connectLiveKit(false).catch(e=>console.warn("LiveKit preconnect failed:",e));
  post("PHONEBOOK_REQUEST",{groupId:gid()});
  post("TICKET_LIST_REQUEST",{groupId:gid()});
  requestLiveLocations(true);
  sendPtt("GROUP_CHANGED",{groupId:gid()})
}
function open(id){$(id)?.classList.add("active")}
function close(id){$(id)?.classList.remove("active")}
document.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>close(b.dataset.close));
document.addEventListener("click",e=>{const b=e.target?.closest?.("[data-close]");if(b?.dataset?.close)close(b.dataset.close)});


function syncAppViewport(){
  const apply=()=>{
    const layoutH=document.documentElement.clientHeight||window.innerHeight||320;
    const layoutW=document.documentElement.clientWidth||window.innerWidth||280;
    const visualH=window.visualViewport?.height||layoutH;
    const visualW=window.visualViewport?.width||layoutW;
    const h=Math.min(layoutH,visualH);
    const w=Math.min(layoutW,visualW);
    document.documentElement.style.setProperty("--gt-app-height",`${Math.max(320,Math.round(h))}px`);
    document.documentElement.style.setProperty("--gt-app-width",`${Math.max(280,Math.round(w))}px`);
    decide();
    scheduleMapResize();
  };
  apply();
  window.visualViewport?.addEventListener("resize",apply,{passive:true});
  window.addEventListener("resize",apply,{passive:true});
  window.addEventListener("orientationchange",()=>setTimeout(apply,120),{passive:true});
}

function clearMapMarkers(){
  state.markers.forEach(m=>{try{m.remove()}catch(_){ }});
  state.markers.clear();
  state.mapFitPending=true;
}

function normalizeLocation(d){
  if(!d)return null;
  const latitude=Number(d.latitude ?? d.lat);
  const longitude=Number(d.longitude ?? d.lng ?? d.lon);
  if(!Number.isFinite(latitude)||!Number.isFinite(longitude))return null;
  return {
    key:String(d.skId||d.agentUserId||d.id||`${latitude}:${longitude}`),
    skId:d.skId||"",
    name:d.name||d.displayName||d.skId||"Staff",
    role:d.role||d.position||"",
    base:d.base||d.station||"",
    groupId:d.groupId||d.groupKey||d.group_key||"",
    latitude,longitude
  }
}

function initMap(){
  if(state.map||state.mode!=="desktop")return;
  if(!window.maplibregl){text("mapMissing","Map library failed to load.");return}
  state.map=new maplibregl.Map({
    container:"map",
    style:"https://tiles.openfreemap.org/styles/liberty",
    center:[-73.7781,40.6413],
    zoom:10.5
  });
  state.map.addControl(new maplibregl.NavigationControl(),"top-right");
  state.map.on("load",()=>{
    state.mapLoaded=true;
    const mm=$("mapMissing");if(mm)mm.style.display="none";
    scheduleMapResize();
    requestLiveLocations(true)
  });
  state.map.on("error",e=>{
    console.error("MapLibre error:",e);
    text("mapMissing","Map failed to load.")
  })
}

function scheduleMapResize(){
  if(!state.map)return;
  requestAnimationFrame(()=>{try{state.map.resize()}catch(_){ }})
}

function requestLiveLocations(fit=false){
  if(!gid())return;
  if(fit)state.mapFitPending=true;
  post("LIVE_LOCATIONS_REQUEST",{requestId:req("LOC"),groupId:gid()})
}

function syncLiveLocations(items=[],fit=false){
  const valid=(Array.isArray(items)?items:[]).map(normalizeLocation).filter(Boolean);
  valid.forEach(marker);
  if((fit||state.mapFitPending)&&state.map&&state.mapLoaded&&valid.length){
    try{
      if(valid.length===1){
        state.map.easeTo({center:[valid[0].longitude,valid[0].latitude],zoom:13,duration:350})
      }else{
        const b=new maplibregl.LngLatBounds();
        valid.forEach(l=>b.extend([l.longitude,l.latitude]));
        state.map.fitBounds(b,{padding:55,maxZoom:14,duration:350})
      }
      state.mapFitPending=false
    }catch(_){}
  }
}

function startMapRefresh(){
  if(state.mapRefreshTimer)return;
  state.mapRefreshTimer=setInterval(()=>requestLiveLocations(false),30000)
}
function stopMapRefresh(){
  if(state.mapRefreshTimer){clearInterval(state.mapRefreshTimer);state.mapRefreshTimer=null}
}

function cleanupRemoteAudio(){
  document.querySelectorAll("audio[data-grouptalk-audio='1']").forEach(el=>{try{el.pause()}catch(_){};try{el.remove()}catch(_){}})
}
async function disconnectVoiceRoom(){
  try{await setMic(false)}catch(_){}
  const room=state.room;
  state.room=null;state.voiceRoomName="";
  if(room){try{await room.disconnect()}catch(_){}}
  cleanupRemoteAudio();
}
function resumeVoicePlayback(){
  try{state.room?.startAudio?.().catch?.(()=>{})}catch(_){}
  document.querySelectorAll("audio[data-grouptalk-audio='1']").forEach(el=>{try{el.play?.().catch?.(()=>{})}catch(_){}})
}
async function connectLiveKit(mic=false){
  if(!state.activeGroup)throw new Error("Select a GroupTalk group first.");
  if(!window.LivekitClient)throw new Error("LiveKit client failed to load.");
  const roomName=state.activeGroup.livekitRoomName||state.activeGroup.livekit_room||state.activeGroup.channelName;
  if(state.room&&state.room.name===roomName){
    if(mic)await setMic(true);
    return state.room
  }
  if(state.voiceConnectPromise&&state.voiceConnectTarget===roomName){
    const room=await state.voiceConnectPromise;
    if(mic)await setMic(true);
    return room
  }
  state.voiceConnectTarget=roomName;
  state.voiceConnectPromise=(async()=>{
    const requestId=req("LK");
    const response=await new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>{state.lkCbs.delete(requestId);reject(new Error("LiveKit token timed out."))},12000);
      state.lkCbs.set(requestId,{resolve:v=>{clearTimeout(timer);resolve(v)},reject:e=>{clearTimeout(timer);reject(e)}});
      post("LIVEKIT_TOKEN_REQUEST",{requestId,groupId:gid()})
    });
    await disconnectVoiceRoom();
    state.voiceRoomName=roomName;
    const LK=window.LivekitClient;
    const room=new LK.Room({adaptiveStream:true,dynacast:true});
    room.on(LK.RoomEvent.TrackSubscribed,track=>{
      if(track.kind==="audio"){
        const el=track.attach();
        el.autoplay=true;el.playsInline=true;el.dataset.grouptalkAudio="1";
        document.body.appendChild(el);
        el.play?.().catch(()=>{})
      }
    });
    room.on(LK.RoomEvent.TrackUnsubscribed,track=>{try{track.detach().forEach(el=>el.remove())}catch(_){}});
    room.on(LK.RoomEvent.Disconnected,()=>{if(state.room===room){state.room=null;state.voiceRoomName=""}cleanupRemoteAudio()});
    await room.connect(response.livekitUrl,response.token);
    state.room=room;
    await setMic(false);
    sendPtt("LIVEKIT_JOIN",{groupId:gid(),room:roomName});
    return room
  })();
  try{
    const room=await state.voiceConnectPromise;
    if(mic)await setMic(true);
    return room
  }finally{
    state.voiceConnectPromise=null;
    state.voiceConnectTarget=""
  }
}
async function ensureVoiceConnected(){return connectLiveKit(false)}
async function connectVoice(mic=false){return connectLiveKit(mic)}

async function setMic(on){
  if(!state.room)return;
  const lp=state.room.localParticipant;
  if(lp&&typeof lp.setMicrophoneEnabled==="function")await lp.setMicrophoneEnabled(!!on)
}

function micLevelStart(){
  // visual PTT level without exposing raw audio; LiveKit owns the actual track.
  let n=0;
  clearInterval(state._pttMeter);
  state._pttMeter=setInterval(()=>{
    if(!state.speaking){clearInterval(state._pttMeter);state._pttMeter=null;setPttLevel(0);return}
    n=(n+17)%100;setPttLevel(35+Math.abs(50-Math.abs(n-50)))
  },120)
}
function micLevelStop(){if(state._pttMeter){clearInterval(state._pttMeter);state._pttMeter=null}setPttLevel(0)}

async function startPtt(){
  if(state.speaking||state.pttHeld)return;
  const canTalk=state.activeGroup?.capabilities?.canTalk!==false;
  if(!canTalk){toast("You do not have talk permission in this group.");return}
  state.pttHeld=true;state.speaking=true;
  document.body.classList.add("ptt-lock");
  $("mPtt")?.classList.add("pressed");$("dPtt")?.classList.add("pressed");
  try{
    await connectLiveKit(true);
    await setMic(true);
    micLevelStart();
    sendPtt(state.mode==="desktop"?"PTT_DOWN_DESKTOP":"PTT_DOWN",{groupId:gid()})
  }catch(e){
    state.speaking=false;state.pttHeld=false;
    $("mPtt")?.classList.remove("pressed");$("dPtt")?.classList.remove("pressed");
    document.body.classList.remove("ptt-lock");
    micLevelStop();
    toast(e.message||"Voice failed")
  }
}
async function stopPtt(){
  if(!state.speaking&&!state.pttHeld)return;
  state.speaking=false;state.pttHeld=false;
  document.body.classList.remove("ptt-lock");
  $("mPtt")?.classList.remove("pressed");$("dPtt")?.classList.remove("pressed");
  micLevelStop();
  try{await setMic(false)}catch(_){}
  sendPtt(state.mode==="desktop"?"PTT_UP_DESKTOP":"PTT_UP",{groupId:gid()})
}
function sendPtt(type,extra={}){
  post("PTT_EVENT",{requestId:req("PTT"),type,groupId:gid(),extra})
}

function startLocation(){
  if(!navigator.geolocation){toast("Location not supported");return}
  if(state.watch){
    navigator.geolocation.clearWatch(state.watch);state.watch=null;
    toast("Live location stopped");return
  }
  let last=0;
  state.watch=navigator.geolocation.watchPosition(pos=>{
    const now=Date.now();if(now-last<8000)return;last=now;
    const c=pos.coords;
    post("LOCATION_PING",{requestId:req("GPS"),groupId:gid(),latitude:c.latitude,longitude:c.longitude,accuracy:c.accuracy,heading:c.heading,speed:c.speed})
  },err=>toast(err.message||"Location denied"),{enableHighAccuracy:true,maximumAge:10000,timeout:15000});
  toast("Live location started")
}


function caseEmployees(){renderCaseTargets()}

function stopLightweightSync(){
  if(state.syncTimer){clearInterval(state.syncTimer);state.syncTimer=null}
}
function runLightweightSync(){
  if(!gid())return;
  post("PHONEBOOK_REQUEST",{requestId:req("PHONE"),groupId:gid()});
  post("TICKET_LIST_REQUEST",{requestId:req("TICK"),groupId:gid()});
  post("TICKET_CATEGORY_LIST_REQUEST",{requestId:req("CAT"),groupId:gid()});
  post("PRESENCE_REQUEST",{requestId:req("PRES"),groupId:gid()})
}
function startLightweightSync(){
  stopLightweightSync();
  state.syncTimer=setInterval(runLightweightSync,45000)
}

function setRealtimeStatus(status,label){
  text("realtimeState",status||"offline");$("mDot")?.classList.toggle("on",status==="online");
  text("mStatus",label||(status==="online"?"Connected":status==="connecting"?"Connecting…":status==="error"?"Connection error":"Offline"))
}
function clearRealtimeTimers(){
  if(state.realtimeHeartbeat){clearInterval(state.realtimeHeartbeat);state.realtimeHeartbeat=null}
  if(state.realtimePresenceRefresh){clearInterval(state.realtimePresenceRefresh);state.realtimePresenceRefresh=null}
  if(state.realtimeAuthRefresh){clearInterval(state.realtimeAuthRefresh);state.realtimeAuthRefresh=null}
}
function requestPresence(){if(gid())post("PRESENCE_REQUEST",{requestId:req("PRES"),groupId:gid()})}
function startPresenceTimers(){
  clearRealtimeTimers();
  state.realtimeHeartbeat=setInterval(()=>{const c=state.realtimeConfig;if(c?.sessionKey&&gid())post("PRESENCE_UPDATE",{requestId:req("HB"),groupId:gid(),sessionKey:c.sessionKey,status:"online",heartbeat:true})},20000);
  state.realtimePresenceRefresh=setInterval(requestPresence,30000)
}
function requestRealtimeAuthRefresh(){
  const id=req("RTA");return new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>{state.realtimeCbs.delete(id);reject(new Error("Supabase Realtime authorization refresh timed out."))},12000);
    state.realtimeCbs.set(id,{resolve:v=>{clearTimeout(timer);resolve(v)},reject:e=>{clearTimeout(timer);reject(e)}});
    post("REALTIME_AUTH_REFRESH_REQUEST",{requestId:id,groupId:gid()})
  })
}
function startRealtimeAuthRefresh(){
  if(state.realtimeAuthRefresh)clearInterval(state.realtimeAuthRefresh);
  state.realtimeAuthRefresh=setInterval(async()=>{
    if(!state.supabaseClient||!state.realtimeChannel||!gid())return;
    try{
      const auth=await requestRealtimeAuthRefresh();
      if(!auth?.realtimeToken)throw new Error("Realtime authorization token was not returned.");
      await state.supabaseClient.realtime.setAuth(auth.realtimeToken)
    }catch(error){
      console.error("Supabase Realtime authorization refresh failed:",error);
      setRealtimeStatus("error","Reconnecting…");
      disconnectSupabaseRealtime(true);
      connectSupabaseRealtime().catch(e=>{setRealtimeStatus("error","Connection error");console.error("Supabase Realtime reconnect failed:",e)})
    }
  },120000)
}
function disconnectSupabaseRealtime(markOffline=false){
  clearRealtimeTimers();const c=state.realtimeConfig;
  if(markOffline&&c?.sessionKey&&c?.groupId)post("PRESENCE_UPDATE",{requestId:req("OFF"),groupId:c.groupId,sessionKey:c.sessionKey,status:"offline",heartbeat:false});
  if(state.realtimeChannel&&state.supabaseClient){try{state.supabaseClient.removeChannel(state.realtimeChannel)}catch(e){}}
  state.realtimeChannel=null;state.realtimeConfig=null;state.realtimeConnecting=false;state.members.clear();members();setRealtimeStatus("offline","Offline")
}
function requestRealtimeConfig(){
  const id=req("RT");return new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>{state.realtimeCbs.delete(id);reject(new Error("Supabase Realtime configuration timed out."))},12000);
    state.realtimeCbs.set(id,{resolve:v=>{clearTimeout(timer);resolve(v)},reject:e=>{clearTimeout(timer);reject(e)}});
    post("REALTIME_CONFIG_REQUEST",{requestId:id,groupId:gid()})
  })
}
function ticketKey(t){return t?.ticketId||t?.id||t?.ticketNumber||""}
function upsertTicket(ticket,front=false){
  if(!ticket)return;const key=ticketKey(ticket);if(!key)return;const i=state.tickets.findIndex(t=>ticketKey(t)===key);
  if(i>=0)state.tickets[i]=ticket;else if(front)state.tickets.unshift(ticket);else state.tickets.push(ticket);tickets()
}
function applyPresenceMember(member){
  if(!member)return;const key=member.id||member.agentUserId||member.skId;if(!key)return;const status=String(member.state||member.status||"online").toLowerCase();
  if(status==="offline")state.members.delete(key);else state.members.set(key,{id:key,skId:member.skId||"",name:member.name||member.displayName||member.skId||"Staff",role:member.role||"",base:member.base||"",state:"online"});members()
}
function handleSupabaseRealtime(message){
  const event=message?.event||message?.type||"",data=message?.payload??message?.data??message??{};
  if(message?.groupId&&gid()&&message.groupId!==gid())return;
  if(event==="database-changed"){
    if(state.databaseRefreshTimer)clearTimeout(state.databaseRefreshTimer);
    state.databaseRefreshTimer=setTimeout(()=>{
      state.databaseRefreshTimer=null;
      const table=data.table||"";
      if(table==="grouptalk_groups"||table==="grouptalk_group_members"){post("GT_REFRESH",{reason:"supabase-database-change"});return}
      if(table==="grouptalk_locations"){requestLiveLocations(false);return}
      if(table==="grouptalk_realtime_sessions"){requestPresence();post("PHONEBOOK_REQUEST",{groupId:gid()});return}
      if(table==="grouptalk_phonebook"){post("PHONEBOOK_REQUEST",{groupId:gid()});return}
      if(table==="grouptalk_ticket_categories"){post("TICKET_CATEGORY_LIST_REQUEST",{groupId:gid()});return}
      if(table==="grouptalk_tickets"||table==="grouptalk_ticket_replies"){
        post("TICKET_LIST_REQUEST",{groupId:gid()});
        if(state.selectedTicket)openTicket(ticketKey(state.selectedTicket));
      }
    },180);
    return
  }
  if(event==="presence-updated"){applyPresenceMember(data.member||data);return}
  if(event==="ptt-started"){if(data.skId!==state.profile.skId){text("mActiveUser",`${data.name||data.skId} speaking`);text("dActiveSub",`${data.name||data.skId} speaking`);vu(true)}return}
  if(event==="ptt-ended"){if(data.skId!==state.profile.skId){text("mActiveUser",[state.profile.base,state.profile.role].filter(Boolean).join(" • "));text("dActiveSub",`${state.activeGroup?.base||state.profile.base||""} • ${state.activeGroup?.category||"Operations"}`);vu(false)}return}
  if(event==="emergency-alert"){text("emergencyText",`EMERGENCY\n${data.name||data.skId}\n${data.group||""}`);$("emergencyOverlay")?.classList.add("active");if(navigator.vibrate)navigator.vibrate([80,40,80,40,80]);setTimeout(()=>$("emergencyOverlay")?.classList.remove("active"),4000);return}
  if(event==="location-updated"){if(state.mode==="desktop")marker(data);return}
  if(event==="ticket-created"){upsertTicket(data.ticket,true);if(data.ticket?.requesterSkId!==state.profile.skId)toast("New helpdesk ticket");return}
  if(event==="ticket-updated"){upsertTicket(data.ticket,true);if(state.selectedTicket&&ticketKey(state.selectedTicket)===ticketKey(data.ticket))openTicket(ticketKey(data.ticket));toast("Ticket updated");return}
  if(event==="group-updated"||event==="membership-updated"){post("GT_REFRESH",{reason:event});return}
  if(event==="ticket-categories-updated"||event==="categories-updated"){post("TICKET_CATEGORY_LIST_REQUEST",{groupId:gid()});return}
}
async function connectSupabaseRealtime(){
  if(!state.activeGroup||state.realtimeConnecting)return;
  if(!window.supabase?.createClient){setRealtimeStatus("error","Supabase library failed");return}
  state.realtimeConnecting=true;setRealtimeStatus("connecting","Connecting…");
  try{
    if(state.realtimeChannel)disconnectSupabaseRealtime(true);
    const config=await requestRealtimeConfig();if(!config?.ok)throw new Error(config?.message||"Supabase Realtime is unavailable.");
    if(!state.supabaseClient||state.supabaseUrl!==config.supabaseUrl||state.supabaseKey!==config.publishableKey){
      state.supabaseClient=window.supabase.createClient(config.supabaseUrl,config.publishableKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},realtime:{params:{eventsPerSecond:20}}});state.supabaseUrl=config.supabaseUrl;state.supabaseKey=config.publishableKey
    }
    if(!config.realtimeToken)throw new Error("Supabase Realtime authorization token is missing.");
    await state.supabaseClient.realtime.setAuth(config.realtimeToken);
    state.realtimeConfig=config;
    const channel=state.supabaseClient.channel(config.topic,{config:{private:true,broadcast:{self:false}}}).on("broadcast",{event:config.broadcastEvent||"grouptalk"},({payload})=>handleSupabaseRealtime(payload));
    state.realtimeChannel=channel;
    channel.subscribe(status=>{
      if(state.realtimeChannel!==channel)return;
      if(status==="SUBSCRIBED"){setRealtimeStatus("online","Connected");requestPresence();startPresenceTimers();startRealtimeAuthRefresh()}
      else if(status==="CHANNEL_ERROR"||status==="TIMED_OUT")setRealtimeStatus("error","Connection error");
      else if(status==="CLOSED")setRealtimeStatus("offline","Offline")
    })
  }finally{state.realtimeConnecting=false}
}
function setPttLevel(value){
  const numeric=Math.max(0,Math.min(100,Number(value)||0));
  const display=numeric<2?0:Math.max(8,numeric);
  ["mPtt","dPtt"].forEach(id=>{
    const el=$(id);
    if(el)el.style.setProperty("--ptt-level",`${display}%`)
  })
}
function vu(on){
  ["mPtt","dPtt"].forEach(id=>$(id)?.classList.toggle("speaking",on));
  if(!on)setPttLevel(0)
}
function marker(d){
  if(!state.map||!state.mapLoaded)return;
  const l=normalizeLocation(d);if(!l)return;if(l.groupId&&gid()&&l.groupId!==gid())return;
  let m=state.markers.get(l.key);
  if(!m){const el=document.createElement("div");el.style.cssText="width:18px;height:18px;background:#022e64;border:3px solid #5FC7CF;border-radius:50%;box-shadow:0 0 0 3px rgba(2,46,100,.2)";m=new maplibregl.Marker({element:el}).setLngLat([l.longitude,l.latitude]).setPopup(new maplibregl.Popup({offset:16}).setText([l.name||l.skId||"Staff",l.role,l.base].filter(Boolean).join(" · "))).addTo(state.map);state.markers.set(l.key,m)}else{m.setLngLat([l.longitude,l.latitude])}
}

const DEFAULT_TICKET_CATEGORIES=["Bus Manifest","Guest Issue","Hotel Issue","Transfer Issue","Flight Disruption","Emergency Support","Documents","Schedule Change","Lost Item","Operations Question","Other"];
function slug(s){return String(s||"").trim().toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||"category"}
function normalizedCategories(raw){const arr=Array.isArray(raw)?raw:[];const src=arr.length?arr:DEFAULT_TICKET_CATEGORIES;return src.map((c,i)=>{if(typeof c==="string")return{categoryId:slug(c),title:c,active:true,sort:i+1};return{categoryId:c.categoryId||c.id||slug(c.title||c.name||c.label||("Category "+(i+1))),title:c.title||c.name||c.label||("Category "+(i+1)),active:c.active!==false,sort:Number(c.sort||c.order||i+1)}})}
function ensureCategories(){if(!state.ticketCategories||!state.ticketCategories.length)state.ticketCategories=normalizedCategories()}
function catTitle(c){return typeof c==="string"?c:(c.title||c.name||c.label||c.categoryId||"Category")}
function catId(c){return typeof c==="string"?slug(c):(c.categoryId||c.id||slug(catTitle(c)))}
function sortedCats(){ensureCategories();return state.ticketCategories.slice().sort((a,b)=>(Number(a.sort||0)-Number(b.sort||0))||catTitle(a).localeCompare(catTitle(b)))}
function fillCategorySelect(id){const el=$(id);if(!el)return;const prev=el.value;el.innerHTML="";sortedCats().filter(c=>c.active!==false).forEach(c=>{const o=document.createElement("option");o.value=catTitle(c);o.textContent=catTitle(c);el.appendChild(o)});if([...el.options].some(o=>o.value===prev))el.value=prev}
function renderTicketCategories(){fillCategorySelect("ticketCategory");fillCategorySelect("caseCategory");renderCategoryAdmin()}
function renderCategoryAdmin(){const list=$("categoryList");if(!list)return;list.innerHTML="";const cats=sortedCats();if(!cats.length){list.className="categoryList empty";list.textContent="No categories yet.";return}list.className="categoryList";cats.forEach(c=>{const row=document.createElement("div");row.className="categoryRow"+(c.active===false?" hiddenCat":"");const info=document.createElement("div");info.innerHTML=`<b>${catTitle(c)}</b><div class="categoryMeta">${c.active===false?"Hidden":"Active"} · sort ${c.sort||""}</div>`;const edit=document.createElement("button");edit.className="mini";edit.type="button";edit.textContent="Edit";edit.onclick=()=>editCategory(catId(c));row.appendChild(info);row.appendChild(edit);list.appendChild(row)})}
function resetCategoryForm(){if($("catId"))$("catId").value="";if($("catTitle"))$("catTitle").value="";if($("catSort"))$("catSort").value=String((state.ticketCategories||[]).length+1);if($("catActive"))$("catActive").value="true"}
function editCategory(id){const c=sortedCats().find(x=>catId(x)===id);if(!c)return;if($("catId"))$("catId").value=catId(c);if($("catTitle"))$("catTitle").value=catTitle(c);if($("catSort"))$("catSort").value=c.sort||"";if($("catActive"))$("catActive").value=String(c.active!==false)}
function saveCategory(){const title=($("catTitle")?.value||"").trim();if(!title){toast("Enter category name");return}const id=$("catId")?.value||slug(title);const category={categoryId:id,title,active:($("catActive")?.value||"true")==="true",sort:Number($("catSort")?.value||state.ticketCategories.length+1)};const i=state.ticketCategories.findIndex(c=>catId(c)===id);if(i>=0)state.ticketCategories[i]=category;else state.ticketCategories.push(category);renderTicketCategories();post("TICKET_CATEGORY_SAVE",{requestId:req("CAT"),groupId:gid(),category});toast("Category saved")}
function deleteCategory(){const id=$("catId")?.value;if(!id){toast("Select a category first");return}const c=state.ticketCategories.find(x=>catId(x)===id);if(!c)return;if(!confirm(`Delete category "${catTitle(c)}"?`))return;state.ticketCategories=state.ticketCategories.filter(x=>catId(x)!==id);resetCategoryForm();renderTicketCategories();post("TICKET_CATEGORY_DELETE",{requestId:req("CAT"),groupId:gid(),categoryId:id});toast("Category deleted")}
function toggleCaseTarget(skId){if(!skId){toast("Employee has no SK-ID");return}state.caseTargets.has(skId)?state.caseTargets.delete(skId):state.caseTargets.add(skId);desktopPhonebook();renderCaseTargets()}
function clearCaseTargets(){state.caseTargets.clear();desktopPhonebook();renderCaseTargets()}
function renderCaseTargets(){const box=$("caseEmployeeList");if(!box)return;text("caseTargetCount",`${state.caseTargets.size} selected`);box.innerHTML="";if(!state.phonebook.length){box.className="caseEmployeeList empty";box.textContent="Phonebook not loaded.";return}box.className="caseEmployeeList";state.phonebook.forEach(c=>{const id=c.skId||"";const row=document.createElement("label");row.className="caseEmployee"+(state.caseTargets.has(id)?" selected":"");const cb=document.createElement("input");cb.type="checkbox";cb.checked=state.caseTargets.has(id);cb.onchange=()=>toggleCaseTarget(id);const info=document.createElement("div");info.innerHTML=`<b>${c.name||"Unnamed"}</b><div class="small">${[c.skId,c.role,c.base].filter(Boolean).join(" • ")}</div>`;row.appendChild(cb);row.appendChild(info);box.appendChild(row)})}
function startCase(){const targetSkIds=[...state.caseTargets];if(!targetSkIds.length){toast("Select one or more employees");return}const employees=state.phonebook.filter(c=>targetSkIds.includes(c.skId)).map(c=>({skId:c.skId,name:c.name,role:c.role,base:c.base,phone:c.phone}));const subject=($("caseSubject")?.value||"").trim();const message=($("caseMessage")?.value||"").trim();if(!subject){toast("Enter case subject");return}post("TICKET_CREATE",{requestId:req("CASE"),caseMode:true,createdFrom:"DESKTOP_CASE",groupId:gid(),targetSkIds,employees,category:$("caseCategory")?.value||"",priority:$("casePriority")?.value||"Normal",routeRef:$("caseRoute")?.value||"",subject,message});toast("Case started")}
function openTicket(ticketId){post("TICKET_LIST_REQUEST",{ticketId})}
function detail(t,msgs=[]){state.selectedTicket=t;text("detailStatus",t.status||"—");$("ticketDetail").innerHTML=`<b>${t.subject||t.title||t.ticketId}</b>\n${t.category||""} · ${t.priority||""} · ${t.status||""}\nRequester: ${t.requesterSkId||""}\nRoute/ref: ${t.routeRef||""}\n\n${t.message||""}\n\n--- Messages ---\n${msgs.map(m=>`[${m.senderRole||""}] ${m.senderSkId||""}: ${m.body||""}`).join("\n\n")}`}
function createTicket(){post("TICKET_CREATE",{groupId:gid(),category:$("ticketCategory").value,priority:$("ticketPriority").value,subject:$("ticketSubject").value,message:$("ticketMessage").value,routeRef:$("ticketRoute").value})}
function reply(status){if(!state.selectedTicket){toast("Select ticket");return}post("TICKET_REPLY",{ticketId:state.selectedTicket.ticketId,body:$("replyBody").value||(status==="RESOLVED"?"Resolved.":""),manifestText:$("manifestText").value,delivery:$("replyDelivery").value,emailTo:$("replyEmail").value,status})}
addEventListener("message",e=>{
  const msg=e.data||{},p=msg.payload||{};if(msg.source!==PARENT)return;
  if(msg.type==="GT_BOOTSTRAP"){
    state.profile=p.profile||{};state.groups=p.groups||[];state.config=p.config||{};state.canManage=!!p.canManage||!!state.profile.canManage;
    state.phonebook=p.phonebook||[];state.tickets=p.tickets||[];state.ticketCategories=normalizedCategories(p.ticketCategories||p.categories||state.config.ticketCategories||state.ticketCategories);
    state.activeGroup=state.groups.find(g=>(g.groupId||g.id)===(p.activeGroupId||p.active_group_id))||state.groups[0]||null;decide();render();
    if(state.activeGroup){
      startLightweightSync();
      connectSupabaseRealtime().catch(e=>{setRealtimeStatus("error","Connection error");console.error("Supabase Realtime connect failed:",e)});
      ensureVoiceConnected().catch(e=>console.warn("Voice preconnect failed:",e));
      post("PHONEBOOK_REQUEST",{groupId:gid()});
      post("TICKET_LIST_REQUEST",{groupId:gid()});
      requestLiveLocations(true)
    }
    else{stopLightweightSync();setRealtimeStatus("offline","No group selected")}
    post("TICKET_CATEGORY_LIST_REQUEST",{groupId:gid()});return
  }
  if(msg.type==="LIVEKIT_TOKEN_RESPONSE"){
    const cb=state.lkCbs.get(p.requestId);
    if(cb){state.lkCbs.delete(p.requestId);p.ok!==false?cb.resolve(p):cb.reject(new Error(p.message||"LiveKit token failed"))}
    return
  }
  if(msg.type==="PTT_EVENT_RESULT"){return}
  if(msg.type==="REALTIME_CONFIG_RESPONSE"){
    const cb=state.realtimeCbs.get(p.requestId);if(cb){state.realtimeCbs.delete(p.requestId);p.ok!==false?cb.resolve(p):cb.reject(new Error(p.message||"Supabase Realtime configuration failed"))}return
  }
  if(msg.type==="REALTIME_AUTH_REFRESH_RESPONSE"){
    const cb=state.realtimeCbs.get(p.requestId);if(cb){state.realtimeCbs.delete(p.requestId);p.ok!==false?cb.resolve(p):cb.reject(new Error(p.message||"Supabase Realtime authorization refresh failed"))}return
  }
  if(msg.type==="PRESENCE_RESPONSE"){state.members.clear();(p.members||[]).forEach(applyPresenceMember);members();return}
  if(msg.type==="LOCATION_SHARING_STATE"){
    state.watch=p.active===true;
    if(p.error)toast(p.message||"Location unavailable");
    else if(p.active)toast("Live location started");
    return
  }
  if(msg.type==="GT_DIAGNOSTICS"){
    if(p.ok===false)console.warn("GroupTalk diagnostics:",p);
    else console.info("GroupTalk diagnostics:",p);
    return
  }
  if(msg.type==="PHONEBOOK_RESPONSE"){state.phonebook=p.contacts||[];phonebook();return}
  if(msg.type==="TICKET_LIST_RESPONSE"){if(p.ticket)detail(p.ticket,p.messages||[]);if(p.tickets){state.tickets=p.tickets;tickets()}return}
  if(msg.type==="TICKET_CREATE_RESPONSE"){if(p.ticket){upsertTicket(p.ticket,true);toast("Ticket created");close("ticketSheet")}return}
  if(msg.type==="TICKET_REPLY_RESPONSE"){if(p.ticket){upsertTicket(p.ticket,true);detail(p.ticket,p.messages||[])}toast("Reply sent");return}
  if(msg.type==="LOCATION_PING_RESULT"){if(p.location)marker(p.location);requestLiveLocations(false);return}
  if(msg.type==="LIVE_LOCATIONS_RESPONSE"){syncLiveLocations(p.locations||p.items||[],state.mapFitPending);return}
  if(msg.type==="TICKET_CATEGORY_LIST_RESPONSE"){state.ticketCategories=normalizedCategories(p.categories||p.ticketCategories);renderTicketCategories();return}
  if(msg.type==="TICKET_CATEGORY_SAVE_RESPONSE"){if(p.categories||p.ticketCategories)state.ticketCategories=normalizedCategories(p.categories||p.ticketCategories);renderTicketCategories();toast(p.message||"Category saved");return}
  if(msg.type==="TICKET_CATEGORY_DELETE_RESPONSE"){if(p.categories||p.ticketCategories)state.ticketCategories=normalizedCategories(p.categories||p.ticketCategories);renderTicketCategories();toast(p.message||"Category deleted");return}
  if(msg.type==="GT_ERROR"){toast(p.message||"GroupTalk error");return}
});

$("btnPhone").onclick=()=>{open("phoneSheet");post("PHONEBOOK_REQUEST",{groupId:gid()})};
$("btnGroups").onclick=()=>open("groupSheet");
$("btnScanGroups")?.addEventListener("click",()=>{
  post("GT_REFRESH",{reason:"scan-groups"});
  toast("Scanning groups…");
  setTimeout(()=>open("groupSheet"),250)
});
$("btnSettings")?.addEventListener("click",()=>open("mobileSettingsSheet"));
$("btnMobileMenu")?.addEventListener("click",()=>open("mobileSettingsSheet"));
$("btnMobileUsers")?.addEventListener("click",()=>{open("mobileOnlineSheet");members()});
$("btnMobileMessages")?.addEventListener("click",()=>{open("myTicketsSheet");post("TICKET_LIST_REQUEST",{mineOnly:true})});
$("btnSettingsLocation")?.addEventListener("click",()=>{close("mobileSettingsSheet");startLocation()});
$("btnSettingsHelpdesk")?.addEventListener("click",()=>{close("mobileSettingsSheet");open("ticketSheet")});
$("btnSettingsTickets")?.addEventListener("click",()=>{close("mobileSettingsSheet");open("myTicketsSheet");post("TICKET_LIST_REQUEST",{mineOnly:true})});
$("btnGoOffline")?.addEventListener("click",()=>{
  if(state.watch){try{navigator.geolocation.clearWatch(state.watch)}catch(_){ }state.watch=null}
  disconnectSupabaseRealtime(true);
  disconnectVoiceRoom().catch(()=>{});
  state.members.clear();members();setRealtimeStatus("offline","Offline");
  sendPtt("GO_OFFLINE",{groupId:gid()});
  toast("Offline")
});
$("btnCreateTicket").onclick=createTicket;$("btnReply").onclick=()=>reply();$("btnResolve").onclick=()=>reply("RESOLVED");$("btnSaveGroup").onclick=()=>post("ADMIN_SAVE_GROUP",{title:$("adminGroupTitle").value,base:$("adminGroupBase").value,allowAllStaff:true,canStaffTalk:true,canStaffCreateTickets:true});if($("btnDesktopPhonebook"))$("btnDesktopPhonebook").onclick=()=>{open("phoneSheet");post("PHONEBOOK_REQUEST",{groupId:gid()})};if($("btnNewCategory"))$("btnNewCategory").onclick=resetCategoryForm;if($("btnSaveCategory"))$("btnSaveCategory").onclick=saveCategory;if($("btnDeleteCategory"))$("btnDeleteCategory").onclick=deleteCategory;if($("btnStartCase"))$("btnStartCase").onclick=startCase;if($("btnClearCaseTargets"))$("btnClearCaseTargets").onclick=clearCaseTargets;
["mPtt","dPtt"].forEach(id=>{
  const b=$(id);
  if(!b)return;

  const down=e=>{
    e.preventDefault();
    e.stopPropagation();
    window.getSelection?.()?.removeAllRanges?.();
    startPtt()
  };
  const up=e=>{
    e?.preventDefault?.();
    e?.stopPropagation?.();
    stopPtt()
  };

  ["contextmenu","selectstart","dragstart"].forEach(ev=>b.addEventListener(ev,e=>e.preventDefault()));
  b.setAttribute("draggable","false");

  b.addEventListener("touchstart",down,{passive:false});
  b.addEventListener("touchend",up,{passive:false});
  b.addEventListener("touchcancel",up,{passive:false});

  if(window.PointerEvent){
    b.addEventListener("pointerdown",e=>{
      if(e.pointerType==="touch")return;
      try{b.setPointerCapture?.(e.pointerId)}catch(_){}
      down(e)
    });
    b.addEventListener("pointerup",e=>{if(e.pointerType!=="touch")up(e)});
    b.addEventListener("pointercancel",e=>{if(e.pointerType!=="touch")up(e)});
    b.addEventListener("lostpointercapture",()=>{if(state.pttHeld)stopPtt()})
  }else{
    b.addEventListener("mousedown",down);
    addEventListener("mouseup",up)
  }
});

document.addEventListener("pointerdown",resumeVoicePlayback,{passive:true});
document.addEventListener("touchstart",resumeVoicePlayback,{passive:true});
document.addEventListener("selectionchange",()=>{
  if(state.pttHeld)window.getSelection?.()?.removeAllRanges?.()
});

let emergencyTimer=null;{
  const emergency=$("btnEmergency");
  const beginEmergency=e=>{
    e?.preventDefault?.();
    clearTimeout(emergencyTimer);
    emergencyTimer=setTimeout(()=>{
      sendPtt("EMERGENCY",{priority:"critical"});
      $("emergencyOverlay")?.classList.add("active");
      if(navigator.vibrate)navigator.vibrate([80,40,80])
    },3000)
  };
  const endEmergency=()=>{
    clearTimeout(emergencyTimer);
    setTimeout(()=>$("emergencyOverlay")?.classList.remove("active"),1800)
  };
  if(emergency){
    ["contextmenu","selectstart","dragstart"].forEach(ev=>emergency.addEventListener(ev,e=>e.preventDefault()));
    if(window.PointerEvent){
      emergency.addEventListener("pointerdown",beginEmergency);
      emergency.addEventListener("pointerup",endEmergency);
      emergency.addEventListener("pointercancel",endEmergency)
    }else{
      emergency.addEventListener("touchstart",beginEmergency,{passive:false});
      emergency.addEventListener("mousedown",beginEmergency);
      ["touchend","mouseup"].forEach(ev=>addEventListener(ev,endEmergency))
    }
  }
}
addEventListener("blur",()=>{if(state.pttHeld||state.speaking)stopPtt()});
document.addEventListener("visibilitychange",()=>{if(document.hidden&&(state.pttHeld||state.speaking))stopPtt()});
addEventListener("pagehide",()=>{
  stopLightweightSync();
  if(state.watch){try{navigator.geolocation.clearWatch(state.watch)}catch(_){ }}
  disconnectSupabaseRealtime(true);
  disconnectVoiceRoom().catch(()=>{});
});
function init(){ensureCategories();renderTicketCategories();decide();setRealtimeStatus("offline","Offline");syncAppViewport();post("GT_READY",{wantsInit:true,realtimeProvider:"SUPABASE_REALTIME",voiceProvider:"LIVEKIT",audioAlwaysOn:true})}init();
