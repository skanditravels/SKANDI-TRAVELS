/* =========================================================
   SKANDI GROUPTALK RUNTIME — ZERO SAMPLE DATA, EXACT PAYLOADS
   ========================================================= */
const SOURCE="GROUPTALK_HTML",PARENT="SKANDI_WIX_PARENT";
const appRoot = document.querySelector(".app").parentElement;
const state={
  mode:"mobile",profile:{},canManage:false,groups:[],activeGroup:null,config:{},
  lkCbs:new Map(),realtimeCbs:new Map(),room:null,voiceJob:null,voiceRoomName:"",connectionEpoch:0,
  supabaseClient:null,supabaseUrl:"",supabaseKey:"",realtimeChannel:null,realtimeConfig:null,realtimeConnecting:false,
  realtimeHeartbeat:null,realtimePresenceRefresh:null,realtimeAuthRefresh:null,databaseRefreshTimer:null,syncTimer:null,
  members:new Map(),phonebook:[],tickets:[],myTickets:null,mineRequest:"",ticketCategories:[],caseTargets:new Set(),selectedTicket:null,
  map:null,mapLoaded:false,mapRefreshTimer:null,mapFitPending:true,mapRequest:"",markers:new Map(),
  watch:null,locationLive:false,locationRequest:"",speaking:false,pttHeld:false,pttSequence:0,micQueue:Promise.resolve(),
  radioTones:true,lightMode:false,pcLightMode:false,isOfflineManual:false,
  remoteSpeakerName:"",remoteSpeakerSkId:"",txStartTs:0,txTimerInterval:null,
  pcLastActivityTs:0,pcLastActivityLabel:"",
  groupQuery:"",phoneQuery:"",onlineQuery:"",ticketQuery:"",
  pcCustomLayerId:"pc-custom-geojson",pcCustomGeoData:null,pcImageLayerId:"pc-custom-image",pcImageUrl:"",pcImageCoordinates:null,
  pcMapStyle:"standard",pcGroupFilter:"all",pcFavGroups:new Set(),
  pcGroupFields:{base:true,category:true,caps:true,users:true,compact:false},
  pcAudioMuted:false,pcSoloGroupId:"",locationsByKey:new Map(),emergencyRequest:"",
  deleteConfirmCatId:"",deleteConfirmTimer:null
};

const SVG_MIC=`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.49 6-3.31 6-6.72h-1.7z"/></svg>`;
const SVG_SPEAKER=`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>`;
const SVG_SPEAKER_OFF=`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 0 0 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4 9.91 6.09 12 8.18V4z"/></svg>`;
function $(id){return document.getElementById(id)}
function post(type,payload={}){try{window.parent?.postMessage({source:SOURCE,type,payload,timestamp:new Date().toISOString()},"*")}catch(_){}}
function req(p="REQ"){return p+"-"+Date.now()+"-"+Math.random().toString(36).slice(2,8)}
function text(id,v){const e=$(id);if(e)e.textContent=v}
function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, character=>({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[character]));
}
function profileName() {
  return state.profile.displayName || state.profile.fullName || state.profile.name || state.profile.skId || "";
}
let toastTimer=null;
function toast(m){const t=$("toast");if(!t)return;t.textContent=m;t.style.display="block";clearTimeout(toastTimer);toastTimer=setTimeout(()=>{t.style.display="none"},2500)}
function gid(){return state.activeGroup?.groupId||state.activeGroup?.id||""}
function mobile(){return window.innerWidth<900}

/* =========================================================
   WEB AUDIO SYNTHESIZED RADIO TONES
   ========================================================= */
let audioCtx=null;
function ensureAudioCtx(){
  try{
    const AC=window.AudioContext||window.webkitAudioContext;
    if(!AC)return null;
    if(!audioCtx)audioCtx=new AC();
    if(audioCtx.state==="suspended")audioCtx.resume().catch(()=>{});
    return audioCtx;
  }catch(_){return null}
}
function playToneSeq(notes){
  if(!state.radioTones)return;
  const ctx=ensureAudioCtx();
  if(!ctx)return;
  try{
    let t=ctx.currentTime+0.005;
    notes.forEach(([freq,dur,gap=0.01,vol=0.14])=>{
      const osc=ctx.createOscillator(),gain=ctx.createGain();
      osc.type="sine";
      osc.frequency.setValueAtTime(freq,t);
      gain.gain.setValueAtTime(0.0001,t);
      gain.gain.linearRampToValueAtTime(vol,t+0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001,t+dur);
      osc.connect(gain);gain.connect(ctx.destination);
      osc.start(t);osc.stop(t+dur+0.01);
      t+=dur+gap;
    });
  }catch(_){}
}
function playRadioTone(kind){
  if(kind==="txStart")playToneSeq([[980,0.045,0.01],[1380,0.06,0]]);
  else if(kind==="txStop")playToneSeq([[1150,0.035,0.01],[780,0.045,0]]);
  else if(kind==="rxStart")playToneSeq([[1040,0.05,0]]);
  else if(kind==="rxStop")playToneSeq([[720,0.04,0]]);
  else if(kind==="groupActive")playToneSeq([[660,0.04,0.015],[990,0.055,0]]);
  else if(kind==="toneSignal")playToneSeq([[1200,0.09,0.02],[1600,0.12,0]]);
  else if(kind==="busy")playToneSeq([[220,0.16,0,0.16]]);
  else if(kind==="disconnect")playToneSeq([[540,0.09,0.03],[380,0.14,0]]);
  else if(kind==="panic")playToneSeq([[960,0.14,0.03,0.22],[1440,0.14,0.03,0.22],[960,0.14,0,0.22]]);
}

/* =========================================================
   CLOCK, VIEWPORT & MODE SWITCH
   ========================================================= */
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

function decide(){
  state.mode=mobile()?"mobile":"desktop";
  window.document.body.classList.toggle("mode-mobile",state.mode==="mobile");
  window.document.body.classList.toggle("mode-desktop",state.mode==="desktop");
  window.document.body.classList.toggle("can-manage",!!state.canManage);
  if(state.mode==="desktop"){initMap();scheduleMapResize();startMapRefresh()}
  else{stopMapRefresh()}
}

function syncAppViewport(){
  const apply=()=>{
    const layoutH=window.document.documentElement.clientHeight||window.innerHeight||320;
    const layoutW=window.document.documentElement.clientWidth||window.innerWidth||280;
    const visualH=window.visualViewport?.height||layoutH;
    const visualW=window.visualViewport?.width||layoutW;
    const h=Math.min(layoutH,visualH);
    const w=Math.min(layoutW,visualW);
    appRoot.style.setProperty("--gt-app-height",`${Math.max(320,Math.round(h))}px`);
    appRoot.style.setProperty("--gt-app-width",`${Math.max(280,Math.round(w))}px`);
    decide();
    scheduleMapResize();
  };
  apply();
  window.visualViewport?.addEventListener("resize",apply,{passive:true});
  window.addEventListener("resize",apply,{passive:true});
  window.addEventListener("orientationchange",()=>setTimeout(apply,120),{passive:true});
}

/* =========================================================
   TX TIMER & PTT / ACTIVITY VISUALS
   ========================================================= */
function startTxTimer(){
  stopTxTimer();
  state.txStartTs=Date.now();
  const tick=()=>{
    const sec=Math.floor((Date.now()-state.txStartTs)/1000);
    text("mPttTimer",`${String(Math.floor(sec/60)).padStart(2,"0")}:${String(sec%60).padStart(2,"0")}`);
    updatePcActivityBar();
  };
  tick();
  state.txTimerInterval=setInterval(tick,500);
}
function stopTxTimer(){
  if(state.txTimerInterval){clearInterval(state.txTimerInterval);state.txTimerInterval=null}
  state.txStartTs=0;
  text("mPttTimer","00:00");
}

function updateLocationVisuals() {
  const watching=state.watch!==null, live=state.locationLive;
  const pill=$("mLocationPill");
  if (pill) {
    pill.textContent=live?"GPS Live":watching?"Locating…":"Live GPS";
    pill.classList.toggle("gps-on",live);
  }
  text("settingsLocSub",live?"Location sharing active. Tap to stop.":watching?"Waiting for a position. Tap to stop.":"Update the operations map");
}

function updatePttVisuals(){
  const iconEl=$("mPttIcon");
  const pcLabel=$("dPttLabel");
  if(state.speaking){
    if(iconEl)iconEl.innerHTML=SVG_MIC;
    text("mActiveUser",`${profileName()||"You"} (TX)`);
    const sec=state.txStartTs?Math.floor((Date.now()-state.txStartTs)/1000):0;
    if(pcLabel)pcLabel.textContent=`TX ${String(Math.floor(sec/60)).padStart(2,"0")}:${String(sec%60).padStart(2,"0")}`;
  }else if(state.remoteSpeakerName){
    if(iconEl)iconEl.innerHTML=SVG_SPEAKER;
    text("mActiveUser",`${state.remoteSpeakerName} speaking`);
    text("mPttTimer","RX");
    if(pcLabel)pcLabel.textContent=`RX: ${state.remoteSpeakerName}`;
  }else{
    if(iconEl)iconEl.innerHTML=SVG_MIC;
    const p=state.profile;
    text("mActiveUser",profileName()?`${profileName()}${p.role?` (${p.role})`:""}`:[p.base,p.role].filter(Boolean).join(" • ")||"—");
    text("mPttTimer","");
    if(pcLabel)pcLabel.textContent=state.pttHeld?"CONNECTING…":"HOLD TO TALK";
  }
  const pill=$("pcAudioStatePill");
  if(pill){
    const lbl=state.pcAudioMuted?"AUDIO MUTED":(state.pcSoloGroupId?"SOLO ACTIVE":"");
    pill.textContent=lbl;
    pill.classList.toggle("hidden",!lbl);
  }
  $("pcMuteBadge")?.classList.toggle("show",state.pcAudioMuted);
  const muteBtn=$("btnPcMasterMute");
  if(muteBtn){
    muteBtn.classList.toggle("is-muted",state.pcAudioMuted);
    muteBtn.innerHTML=state.pcAudioMuted?SVG_SPEAKER_OFF:SVG_SPEAKER;
    muteBtn.title=state.pcAudioMuted?"Unmute dispatch audio":"Mute dispatch audio";
    muteBtn.setAttribute("aria-pressed",String(state.pcAudioMuted));
    const talkEnabled = canTransmit();
    for (const id of ["mPtt","dPtt"]) {
      const control=$(id);
      if (control) control.disabled=!talkEnabled;
    }
  }
  updatePcActivityBar();
}

function updatePcActivityBar(){
  const bar=$("pcActivityBar"),txt=$("pcActivityText"),since=$("pcActivitySince");
  if(!bar||!txt||!since)return;
  const gTitle=state.activeGroup?.title||"—";
  bar.classList.remove("is-tx","is-rx","is-online");
  if(state.speaking){
    bar.classList.add("is-tx");
    txt.textContent=`TX · ${gTitle} · You`;
    const sec=state.txStartTs?Math.floor((Date.now()-state.txStartTs)/1000):0;
    since.textContent=`${String(Math.floor(sec/60)).padStart(2,"0")}:${String(sec%60).padStart(2,"0")}`;
  }else if(state.remoteSpeakerName){
    bar.classList.add("is-rx");
    txt.textContent=`RX · ${gTitle} · ${state.remoteSpeakerName}`;
    since.textContent="LIVE";
  }else{
    const online=$("realtimeState")?.textContent==="online";
    if(online)bar.classList.add("is-online");
    txt.textContent=state.pcLastActivityLabel||"No recent PTT";
    if(state.pcLastActivityTs){
      const sec=Math.max(0,Math.floor((Date.now()-state.pcLastActivityTs)/1000));
      const m=Math.floor(sec/60),s=sec%60;
      since.textContent=m>0?`${m}m ${String(s).padStart(2,"0")}s ago`:`${s}s ago`;
    }else{since.textContent="—"}
  }
}
setInterval(updatePcActivityBar,1000);

/* =========================================================
   PC DISPATCH 2 TABS, INLINE RENAME & RESIZE SPLITTERS
   ========================================================= */
function activatePaneTab(paneId,tabId){
  const pane=$(paneId);if(!pane)return;
  if(paneId!=="paneCenterTop"&&$("pcWorkspace")?.classList.contains("map-maximized")){
    $("pcWorkspace").classList.remove("map-maximized");
    text("btnMapExpand","Expand");
  }
  pane.querySelectorAll(":scope > .pcPaneBar .pcTab").forEach(t=>t.classList.toggle("active",t.dataset.tab===tabId));
  pane.querySelectorAll(":scope > .pcTabPanel").forEach(p=>p.classList.toggle("active",p.id===tabId));
  if(tabId==="tabLocations")scheduleMapResize();
}
function wireTabClick(btn){
  btn.addEventListener("click",e=>{
    if(e.target?.classList?.contains("pcTabClose"))return;
    activatePaneTab(btn.dataset.pane,btn.dataset.tab);
  });
  btn.addEventListener("dblclick",e=>{
    if(e.target?.classList?.contains("pcTabClose"))return;
    const lbl=btn.querySelector(".pcTabLabel");if(!lbl)return;
    const prev=lbl.textContent;
    const inp=window.document.createElement("input");
    inp.className="pcTabRenameInput";inp.value=prev;
    lbl.replaceWith(inp);inp.focus();inp.select();
    let done=false;
    const finish=save=>{
      if(done)return;done=true;
      const span=window.document.createElement("span");
      span.className="pcTabLabel";
      span.textContent=(save&&inp.value.trim())?inp.value.trim():prev;
      inp.replaceWith(span);
    };
    inp.addEventListener("keydown",ev=>{if(ev.key==="Enter"){ev.preventDefault();finish(true)}else if(ev.key==="Escape"){ev.preventDefault();finish(false)}});
    inp.addEventListener("blur",()=>finish(true));
  });
}
document.querySelectorAll(".pcTab").forEach(wireTabClick);

function spawnDynamicTab(paneId,stripId,tabId,title,html){
  const pane=$(paneId),strip=$(stripId);if(!pane||!strip)return;
  const existing=$(tabId);
  if(existing){
    const body=existing.querySelector(".panelBody");
    if(body)body.innerHTML=html;
    activatePaneTab(paneId,tabId);
    return existing;
  }
  const btn=window.document.createElement("button");
  btn.type="button";btn.className="pcTab";btn.dataset.pane=paneId;btn.dataset.tab=tabId;
  btn.innerHTML=`<span class="pcTabLabel">${escapeHTML(title)}</span><span class="pcTabClose" title="Close tab">&times;</span>`;
  wireTabClick(btn);
  btn.querySelector(".pcTabClose")?.addEventListener("click",ev=>{
    ev.stopPropagation();
    const wasActive=btn.classList.contains("active");
    btn.remove();$(tabId)?.remove();
    if(wasActive){const first=strip.querySelector(".pcTab");if(first)activatePaneTab(paneId,first.dataset.tab)}
  });
  strip.appendChild(btn);
  const panel=window.document.createElement("div");
  panel.className="pcTabPanel";panel.id=tabId;
  panel.innerHTML=`<div class="panelBody">${html}</div>`;
  pane.appendChild(panel);
  activatePaneTab(paneId,tabId);
  return panel;
}

function initSplitters(){
  const bindV=(splitId,colId,invert=false)=>{
    const sp=$(splitId),col=$(colId);if(!sp||!col)return;
    sp.addEventListener("pointerdown",e=>{
      e.preventDefault();sp.classList.add("dragging");
      const startX=e.clientX,startW=col.getBoundingClientRect().width;
      const move=ev=>{const dx=ev.clientX-startX;const w=Math.max(200,Math.min(540,invert?startW-dx:startW+dx));col.style.flex=`0 0 ${Math.round(w)}px`;scheduleMapResize()};
      const up=()=>{sp.classList.remove("dragging");window.removeEventListener("pointermove",move);window.removeEventListener("pointerup",up)};
      window.addEventListener("pointermove",move);window.addEventListener("pointerup",up);
    });
  };
  const bindH=(splitId,topId,botId)=>{
    const sp=$(splitId),top=$(topId),bot=$(botId);if(!sp||!top||!bot)return;
    sp.addEventListener("pointerdown",e=>{
      e.preventDefault();sp.classList.add("dragging");
      const startY=e.clientY,topH=top.getBoundingClientRect().height,totH=topH+bot.getBoundingClientRect().height;
      const move=ev=>{const nh=Math.max(120,Math.min(totH-120,topH+(ev.clientY-startY)));const pct=(nh/totH)*100;top.style.flex=`1 1 ${pct.toFixed(1)}%`;bot.style.flex=`1 1 ${(100-pct).toFixed(1)}%`;scheduleMapResize()};
      const up=()=>{sp.classList.remove("dragging");window.removeEventListener("pointermove",move);window.removeEventListener("pointerup",up)};
      window.addEventListener("pointermove",move);window.addEventListener("pointerup",up);
    });
  };
  bindV("splitV1","pcLeftCol",false);
  bindV("splitV2","pcRightCol",true);
  bindH("splitHL","paneLeftTop","paneLeftBot");
  bindH("splitHC","paneCenterTop","paneCenterBot");
  bindH("splitHR","paneRightTop","paneRightBot");
}

function renderSelectedGroupTab(){
  const box=$("selectedGroupCard");if(!box)return;
  const g=state.activeGroup;
  if(!g){box.innerHTML='<div class="small">No active group selected.</div>';return}
  box.innerHTML=`
    <div class="detail" style="margin-bottom:8px;">
      <b style="font-size:14px;color:#ffffff;">${escapeHTML(g.title||"—")}</b>\nBase: ${escapeHTML(g.base||"—")} · Category: ${escapeHTML(g.category||"Operations")}\nOnline Members: ${state.members.size}\nPermissions: ${g.capabilities?.canTalk!==false?"Talk & Listen":"Listen Only"} · ${g.capabilities?.canCreateTickets?"Tickets Enabled":"No Tickets"}
    </div>
    <div class="inlineActions">
      <button id="btnSelGroupPtt" class="primary" type="button" style="flex:1;">Hold to Talk</button>
      <button id="btnSelGroupTicket" class="mini" type="button">New Ticket</button>
    </div>
  `;
  const ptt=$("btnSelGroupPtt");
  ptt.disabled=!canTransmit();
  bindPtt(ptt);
  const ticket=$("btnSelGroupTicket");
  ticket.disabled=!mayCreateTicket();
  ticket.addEventListener("click",()=>open("ticketSheet"));
}

function applyAudioMute(){
  window.document.querySelectorAll("audio[data-grouptalk-audio='1']").forEach(el=>{try{el.muted=!!state.pcAudioMuted}catch(_){}});
  updatePttVisuals();
}

/* =========================================================
   CORE RENDERERS (SINGLE AUTHORITATIVE IMPLEMENTATIONS)
   ========================================================= */
function render(){
  const p=state.profile,g=state.activeGroup||{};
  text("mGroup",g.title||"—");
  text("mActiveGroup",g.title||"—");
  text("dActiveGroup",g.title||"—");
  text("mSub",[g.base||p.base,g.category].filter(Boolean).join(" • ")||"Shortcuts");
  text("dUser",profileName()||"—");
  text("dMeta",[p.skId,p.role,p.base].filter(Boolean).join(" · ")||"—");
  text("dActiveSub",[g.base||p.base,g.category||"Operations"].filter(Boolean).join(" • ")||"—");
  updatePttVisuals();
  updateLocationVisuals();
  renderSelectedGroupTab();
  groups();
  phonebook();
  tickets();
  members();
  renderTicketCategories();
}

function phonebook(){
  mobilePhonebook();
  desktopPhonebook();
  renderCaseTargets();
}

function groups(){
  const a=$("groupList"),m=$("mobileGroupList");
  if(a)a.innerHTML="";
  if(m)m.innerHTML="";
  const q=state.groupQuery.trim().toLowerCase();
  const f=state.pcGroupFields;
  state.groups.forEach(g=>{
    const id=g.groupId||g.id;
    const active=state.activeGroup&&(state.activeGroup.groupId||state.activeGroup.id)===id;
    const isFav=state.pcFavGroups.has(id);
    const matchSearch=!q||`${g.title||""} ${g.base||""} ${g.category||""}`.toLowerCase().includes(q);
    const matchFilter=state.pcGroupFilter==="all"||(state.pcGroupFilter==="fav"&&isFav)||(state.pcGroupFilter==="joined"&&active)||(state.pcGroupFilter==="online"&&active&&state.members.size>0);
    if(a&&matchSearch&&matchFilter){
      const d=window.document.createElement("div");
      d.className="groupItem"+(active?" active":"")+(f.compact?" is-compact":"");
      const left=window.document.createElement("div");left.className="groupItemLeft";
      const pwr=window.document.createElement("button");pwr.type="button";pwr.className="pcPowerBtn";pwr.title=active?"Joined":"Join Group";
      pwr.innerHTML=`<svg viewBox="0 0 24 24"><path d="M13 3h-2v10h2V3zm4.8 2.2-1.4 1.4A6.98 6.98 0 0 1 19 12a7 7 0 1 1-14 0c0-2.1.9-4 2.6-5.4L6.2 5.2A8.96 8.96 0 0 0 3 12a9 9 0 0 0 18 0c0-2.7-1.2-5.1-3.2-6.8z"/></svg>`;
      pwr.setAttribute("aria-label",(active?"Joined: ":"Join ")+(g.title||"Group"));
      pwr.onclick=ev=>{ev.stopPropagation();switchGroup(id)};
      const meta=window.document.createElement("div");meta.className="groupItemMeta";
      const subParts=[];
      if(f.base&&g.base)subParts.push(g.base);
      if(f.category&&g.category)subParts.push(g.category);
      if(f.caps)subParts.push(g.capabilities?.canTalk!==false?"Talk":"Listen");
      meta.innerHTML=`<b>${escapeHTML(g.title)}</b>${subParts.length?`<div class="small">${escapeHTML(subParts.join(" · "))}</div>`:""}`;
      left.append(pwr,meta);

      const ctrls=window.document.createElement("div");ctrls.className="groupItemControls";
      const star=window.document.createElement("button");star.type="button";star.className="pcRowBtn"+(isFav?" fav-on":"");star.title="Favorite";star.textContent="★";
      star.onclick=ev=>{ev.stopPropagation();isFav?state.pcFavGroups.delete(id):state.pcFavGroups.add(id);groups()};
      ctrls.appendChild(star);

      if(active&&canTransmit()){
        const mic=window.document.createElement("button");mic.type="button";mic.className="pcRowBtn"+(state.speaking?" is-tx":"");mic.title="Hold to Talk";
        mic.innerHTML=`<svg viewBox="0 0 24 24"><path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3c0 2.8-2.2 5-5 5s-5-2.2-5-5H5c0 3.5 2.6 6.4 6 6.9V21h2v-3.1c3.4-.5 6-3.4 6-6.9h-2z"/></svg>`;
        mic.setAttribute("aria-label","Hold to talk");
        bindPtt(mic);
        mic.addEventListener("click",event=>event.stopPropagation());
        ctrls.appendChild(mic);
      }

      const mute=window.document.createElement("button");mute.type="button";mute.className="pcRowBtn"+(active&&state.pcAudioMuted?" is-muted":"");mute.title="Mute Audio";mute.textContent="M";
      mute.disabled=!active;
      mute.setAttribute("aria-label",state.pcAudioMuted?"Unmute group audio":"Mute group audio");
      mute.setAttribute("aria-pressed",String(active&&state.pcAudioMuted));
      mute.onclick=ev=>{ev.stopPropagation();state.pcAudioMuted=!state.pcAudioMuted;applyAudioMute();groups()};
      const solo=window.document.createElement("button");solo.type="button";solo.className="pcRowBtn"+(state.pcSoloGroupId===id?" is-solo":"");solo.title="Solo Group";solo.textContent="S";
      solo.setAttribute("aria-pressed",String(state.pcSoloGroupId===id));
      solo.onclick=ev=>{
        ev.stopPropagation();
        state.pcSoloGroupId=state.pcSoloGroupId===id?"":id;
        if(state.pcSoloGroupId&&!active) switchGroup(id);
        updatePttVisuals();groups();
      };
      ctrls.append(mute,solo);

      if(f.users&&active){
        const uc=window.document.createElement("span");uc.className="badge";uc.textContent=String(state.members.size);
        ctrls.appendChild(uc);
      }

      const pop=window.document.createElement("button");pop.type="button";pop.className="pcRowBtn";pop.title="Open group in tab";pop.textContent="↗";
      pop.onclick=ev=>{
        ev.stopPropagation();
        const panel=spawnDynamicTab("paneLeftTop","tabsLeftTop","dynGrp_"+slug(id),g.title||"Group",
          `<div class="detail"><b>${escapeHTML(g.title)}</b>\nBase: ${escapeHTML(g.base||"—")}\nCategory: ${escapeHTML(g.category||"Operations")}\nTalk: ${g.capabilities?.canTalk===true?"Yes":"No"} · Tickets: ${g.capabilities?.canCreateTickets?"Yes":"No"}</div>
          <div class="inlineActions" style="margin-top:8px;"><button class="primary" type="button">Activate Group</button></div>`);
        panel?.querySelector("button")?.addEventListener("click",()=>switchGroup(id));
      };
      ctrls.appendChild(pop);

      d.append(left,ctrls);
      d.onclick=()=>switchGroup(id);
      a.appendChild(d);
    }
    if(m){
      const b=window.document.createElement("button");
      b.type="button";
      b.className="gtSheetCard"+(active?" is-active-group":"");
      b.innerHTML=`<div><b>${escapeHTML(g.title)}</b><div class="small">${escapeHTML([g.base,g.category].filter(Boolean).join(" · "))}</div></div><span class="badge">${active?"ACTIVE":(g.capabilities?.canTalk?"Talk":"Listen")}</span>`;
      b.onclick=()=>{switchGroup(id);close("groupSheet")};
      m.appendChild(b);
    }
  });
}

function openContactContextMenu(e,c){
  e.stopPropagation();
  const menu=$("pcContactMenu");if(!menu)return;
  const inCase=state.caseTargets.has(c.skId);
  menu.innerHTML="";
  const addItem=(label,fn)=>{
    const btn=window.document.createElement("button");btn.type="button";btn.className="pcMenuAction";btn.textContent=label;
    btn.onclick=()=>{menu.classList.remove("open");fn()};
    menu.appendChild(btn);
  };
  if (callableNumber(c.phone)) addItem("Call phone",()=>callContact(c));
  if (c.skId && mayCreateTicket()) addItem(inCase?"Remove from Case":"Add to Case",()=>toggleCaseTarget(c.skId));
  if (c.skId && state.activeGroup?.capabilities?.canViewLocations) addItem("Show Location",()=>focusUserOnMap(c.skId,c.name));
  if (!menu.childElementCount) return;
  menu.style.left=Math.min(window.innerWidth-210,Math.max(8,e.clientX-160))+"px";
  menu.style.top=Math.min(window.innerHeight-180,Math.max(50,e.clientY+6))+"px";
  menu.classList.add("open");
}

function callableNumber(value) {
  const number=String(value||"").replace(/[ ().-]/g,"");
  return /^\+?\d{2,15}$/.test(number) ? number : "";
}
function callContact(contact) {
  const phone=callableNumber(contact?.phone);
  if (!phone) { toast("No phone number for this contact."); return; }
  if (gid()) sendPtt("PHONE_BOOK_CALL",{targetSkId:contact.skId,targetName:contact.name,targetPhone:phone});
  window.location.href="tel:"+phone;
}

function focusUserOnMap(skId,name){
  const loc=[...state.locationsByKey.values()].find(l=>l.skId===skId||l.key===skId);
  if(!loc||!state.map||!state.mapLoaded){toast(`No live GPS pin for ${name||skId||"user"}`);return}
  activatePaneTab("paneCenterTop","tabLocations");
  try{
    state.map.easeTo({center:[loc.longitude,loc.latitude],zoom:14,duration:400});
    state.markers.get(loc.key)?.togglePopup?.();
  }catch(_){}
}

function mobilePhonebook(){
  const b=$("phoneList");if(!b)return;b.innerHTML="";
  if(!state.phonebook.length){b.innerHTML='<div class="small">No contacts in phone book.</div>';return}
  state.phonebook.forEach(c=>{
    const r=window.document.createElement("div");r.className="phoneRow";
    r.innerHTML=`<div><b>${escapeHTML(c.name||"Unnamed")}</b><div class="small">${escapeHTML([c.role,c.base,c.status].filter(Boolean).join(" • "))}</div></div>`;
    const btn=window.document.createElement("button");btn.className="mini";btn.type="button";btn.textContent=c.phone||"Call";
    btn.disabled=!callableNumber(c.phone);
    btn.onclick=()=>callContact(c);
    r.appendChild(btn);b.appendChild(r);
  });
}

function desktopPhonebook(){
  const d=$("desktopPhoneList");if(!d)return;d.innerHTML="";
  if(!state.phonebook.length){d.className="desktopPhoneList empty";d.textContent="No contacts loaded.";return}
  const q=state.phoneQuery.trim().toLowerCase();
  const list=q?state.phonebook.filter(c=>`${c.name||""} ${c.skId||""} ${c.role||""} ${c.base||""}`.toLowerCase().includes(q)):state.phonebook;
  if(!list.length){d.className="desktopPhoneList empty";d.textContent="No matching contacts.";return}
  d.className="desktopPhoneList";
  list.forEach(c=>{
    const row=window.document.createElement("div");row.className="phoneCard";
    const online=[...state.members.values()].some(m=>m.skId&&m.skId===c.skId);
    const label=window.document.createElement("div");
    label.innerHTML=`<div style="display:flex;align-items:center;gap:6px;"><span class="dot${online?" on":""}"></span><b>${escapeHTML(c.name||"Unnamed")}</b></div><div class="small">${escapeHTML([c.skId,c.role,c.base,c.status].filter(Boolean).join(" • "))}</div>`;
    const actions=window.document.createElement("div");actions.className="phoneActions";
    const pop=window.document.createElement("button");pop.className="pcRowBtn";pop.type="button";pop.title="Open Contact Tab";pop.textContent="↗";
    pop.onclick=()=>spawnDynamicTab("paneLeftBot","tabsLeftBot","dynCnt_"+slug(c.skId||c.name),c.name||"Contact",`<div class="detail"><b>${escapeHTML(c.name||"Unnamed")}</b>\nSK-ID: ${escapeHTML(c.skId||"—")}\nRole: ${escapeHTML(c.role||"—")}\nBase: ${escapeHTML(c.base||"—")}\nPhone: ${escapeHTML(c.phone||"—")}\nStatus: ${c.status||"—"}</div>`);
    const more=window.document.createElement("button");more.className="pcRowBtn";more.type="button";more.title="Contact Actions";more.textContent="⋮";
    more.onclick=e=>openContactContextMenu(e,c);
    actions.append(pop,more);row.append(label,actions);d.appendChild(row);
  });
}

function tickets(){
  const tb=$("ticketTable"),mine=$("myTicketsList");
  if(tb)tb.innerHTML="";if(mine)mine.innerHTML="";
  const countStr=String(state.tickets.length);
  const openCount=state.tickets.filter(t=>String(t.status||"OPEN").toUpperCase()!=="RESOLVED").length;
  text("ticketCount",countStr);
  text("mTicketBadge",countStr);
  const badge=$("tileTicketBadge");
  if(badge){badge.textContent=String(openCount);badge.classList.toggle("hidden",openCount===0)}
  const q=state.ticketQuery.trim().toLowerCase();
  state.tickets.forEach(t=>{
    const match=!q||`${t.priority||""} ${t.subject||t.title||t.ticketId||""} ${t.status||""}`.toLowerCase().includes(q);
    if(tb&&match){
      const prio=String(t.priority||"Normal");
      const cls="prio-"+prio.toLowerCase().replace(/[^a-z]/g,"");
      const tr=window.document.createElement("tr");tr.className="click";
      tr.innerHTML=`<td><span class="pcPrioPill ${cls}">${escapeHTML(prio)}</span></td><td>${escapeHTML(t.subject||t.title||t.ticketId)}</td><td><span class="badge">${escapeHTML(t.status||"OPEN")}</span></td><td><button class="headMini" type="button">Pick</button></td>`;
      tr.onclick=()=>openTicket(t.ticketId);
      tr.querySelector("button")?.addEventListener("click",ev=>{ev.stopPropagation();openTicket(t.ticketId)});
      tb.appendChild(tr);
    }
  });
  if (mine) {
    const list=state.myTickets || state.tickets.filter(ticket=>ticket.requesterSkId===state.profile.skId);
    for (const t of list) {
      const r=window.document.createElement("div");r.className="ticketRow";
      r.innerHTML=`<div><b>${escapeHTML(t.subject||t.title||t.ticketId)}</b><div class="small">${escapeHTML(t.category||"")} · ${escapeHTML(t.status||"OPEN")}</div></div><button class="mini" type="button">Open</button>`;
      r.querySelector("button")?.addEventListener("click",()=>openTicket(t.ticketId));
      mine.appendChild(r);
    }
  }
}

function members(){
  const arr=[...state.members.values()];
  text("mOnlineCount",String(arr.length));
  text("onlineCount",String(arr.length));

  const mobileList=$("mobileOnlineList");
  if(mobileList){
    mobileList.innerHTML="";
    if(!arr.length){mobileList.innerHTML='<div class="small">No active colleagues.</div>'}
    else{
      arr.forEach(m=>{
        const row=window.document.createElement("div");row.className="phoneRow";
        row.innerHTML=`<div><b>${escapeHTML(m.name||m.id||"Staff")}</b><div class="small">${escapeHTML([m.role,m.base].filter(Boolean).join(" • "))}</div></div><span class="badge">${escapeHTML(m.state||"online")}</span>`;
        mobileList.appendChild(row);
      });
    }
  }

  const tb=$("onlineTable");
  if(tb){
    tb.innerHTML="";
    const q=state.onlineQuery.trim().toLowerCase();
    arr.filter(m=>!q||`${m.name||""} ${m.role||""} ${m.base||""}`.toLowerCase().includes(q)).forEach(m=>{
      const isSpk=state.remoteSpeakerSkId&&m.skId&&m.skId===state.remoteSpeakerSkId;
      const tr=window.document.createElement("tr");
      if(isSpk)tr.className="is-speaking";
      tr.innerHTML=`<td>${escapeHTML(m.name||m.id||"Staff")}<div class="small">${escapeHTML([m.role,m.base].filter(Boolean).join(" • "))}</div></td><td><span class="badge">${escapeHTML(isSpk?"speaking":(m.state||"online"))}</span></td><td><div class="inlineActions"><button class="headMini" type="button" data-act="loc">Loc</button><button class="headMini" type="button" data-act="call">Call</button></div></td>`;
      tr.querySelector("[data-act='loc']")?.addEventListener("click",()=>focusUserOnMap(m.skId||m.id,m.name));
      const contact=state.phonebook.find(item=>m.skId && m.skId===item.skId);
      const call=tr.querySelector("[data-act='call']");
      call.disabled=!callableNumber(contact?.phone);
      call.addEventListener("click",()=>callContact(contact));
      tb.appendChild(tr);
    });
  }
  renderSelectedGroupTab();
  desktopPhonebook();
  renderCaseTargets();
}

function connectionCurrent(epoch) {
  return epoch===state.connectionEpoch && !state.isOfflineManual && Boolean(gid());
}
function endGroupSession() {
  state.connectionEpoch++;
  if (state.pttHeld || state.speaking) void stopPtt();
  holdInput=null;
  stopLocation();
  stopLightweightSync();
  disconnectSupabaseRealtime(true);
  state.supabaseClient=null;
  void disconnectVoiceRoom();
  state.remoteSpeakerName="";
  state.remoteSpeakerSkId="";
  state.mapRequest="";
  cancelEmergencyHold();
  vu(false);
  clearMapMarkers();
}
function connectGroup() {
  if (state.isOfflineManual || !gid()) return;
  const epoch=state.connectionEpoch;
  startLightweightSync();
  connectSupabaseRealtime().catch(()=>{
    if (connectionCurrent(epoch)) setRealtimeStatus("error","Connection error");
  });
  if (state.activeGroup.capabilities?.canListen!==false) {
    ensureVoiceConnected().catch(error=>{
      if (connectionCurrent(epoch)) toast("Group audio unavailable: "+error.message);
    });
  }
  post("PHONEBOOK_REQUEST",{groupId:gid()});
  post("TICKET_LIST_REQUEST",{groupId:gid()});
  requestLiveLocations(true);
}
function switchGroup(id) {
  const group=state.groups.find(item=>(item.groupId||item.id)===id);
  if (!group || (id===gid() && !state.isOfflineManual)) return;
  endGroupSession();
  state.activeGroup=group;
  state.isOfflineManual=false;
  if (state.pcSoloGroupId!==id) state.pcSoloGroupId="";
  playRadioTone("groupActive");
  render();
  connectGroup();
  sendPtt("GROUP_CHANGED");
}

function open(id){$(id)?.classList.add("active")}
function close(id){$(id)?.classList.remove("active")}
document.querySelectorAll("[data-close]").forEach(b=>b.addEventListener("click",()=>close(b.dataset.close)));

/* =========================================================
   MAPLIBRE LOCATIONS: 3 STYLES + GEOJSON/IMAGE LAYERS + ACCURACY
   ========================================================= */
const MAP_STYLES={
  standard:"https://tiles.openfreemap.org/styles/liberty",
  alternative:"https://tiles.openfreemap.org/styles/positron",
  satellite:{
    version:8,
    sources:{"esri-sat":{type:"raster",tiles:["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],tileSize:256,attribution:"Esri, Vantor, Earthstar Geographics, and the GIS User Community"}},
    layers:[{id:"esri-sat-layer",type:"raster",source:"esri-sat"}]
  }
};

function scheduleMapResize(){
  if(!state.map)return;
  requestAnimationFrame(()=>{try{state.map.resize()}catch(_){}});
}
function startMapRefresh(){
  if(state.mapRefreshTimer)return;
  state.mapRefreshTimer=setInterval(()=>requestLiveLocations(false),30000);
}
function stopMapRefresh(){
  if(state.mapRefreshTimer){clearInterval(state.mapRefreshTimer);state.mapRefreshTimer=null}
}
function requestLiveLocations(fit=false){
  if(!gid()||state.isOfflineManual||!state.activeGroup.capabilities?.canViewLocations)return;
  if(fit)state.mapFitPending=true;
  state.mapRequest=req("LOC");
  post("LIVE_LOCATIONS_REQUEST",{requestId:state.mapRequest,groupId:gid()});
}
function syncLiveLocations(items=[],fit=false){
  const valid=(Array.isArray(items)?items:[]).map(normalizeLocation).filter(item=>item && (!item.groupId || item.groupId===gid()));
  const keys=new Set(valid.map(item=>item.key));
  for (const [key,element] of state.markers) {
    if (!keys.has(key)) { element.remove();state.markers.delete(key); }
  }
  state.locationsByKey.clear();
  valid.forEach(marker);
  text("mapPinCount",String(state.markers.size));
  if((fit||state.mapFitPending)&&state.map&&state.mapLoaded&&valid.length&&window.maplibregl){
    try{
      if(valid.length===1){
        state.map.easeTo({center:[valid[0].longitude,valid[0].latitude],zoom:13,duration:350});
      }else{
        const b=new window.maplibregl.LngLatBounds();
        valid.forEach(l=>b.extend([l.longitude,l.latitude]));
        state.map.fitBounds(b,{padding:55,maxZoom:14,duration:350});
      }
      state.mapFitPending=false;
    }catch(_){}
  }
}

function clearMapMarkers(){
  state.markers.forEach(m=>{try{m.remove()}catch(_){}});
  state.markers.clear();
  state.locationsByKey.clear();
  state.mapFitPending=true;
  text("mapPinCount","0");
}
function normalizeLocation(d){
  if(!d)return null;
  const latitude=Number(d.latitude??d.lat),longitude=Number(d.longitude??d.lng??d.lon);
  if(!Number.isFinite(latitude)||Math.abs(latitude)>90||!Number.isFinite(longitude)||Math.abs(longitude)>180)return null;
  const accuracy=Number(d.accuracy);
  return{key:String(d.key||d.skId||d.agentUserId||d.id||`${latitude}:${longitude}`),skId:d.skId||"",name:d.name||d.displayName||d.skId||"Staff",role:d.role||d.position||"",base:d.base||d.station||"",groupId:d.groupId||d.groupKey||d.group_key||"",accuracy:Number.isFinite(accuracy)?accuracy:null,latitude,longitude};
}

function removeCustomLayer(clearData=false){
  if(clearData)state.pcCustomGeoData=null;
  if(!state.map||!state.mapLoaded)return;
  const id=state.pcCustomLayerId;
  [id+"-fill",id+"-line",id+"-pts"].forEach(l=>{try{if(state.map.getLayer(l))state.map.removeLayer(l)}catch(_){}});
  try{if(state.map.getSource(id))state.map.removeSource(id)}catch(_){}
}
function applyGeoJsonLayer(data){
  if(!state.map||!state.mapLoaded||!data)return;
  removeCustomLayer(false);
  const id=state.pcCustomLayerId;
  const op=Number($("pcLayerOpacity")?.value||40)/100;
  const vis=$("pcLayerVisible")?.checked===false?"none":"visible";
  state.map.addSource(id,{type:"geojson",data});
  state.map.addLayer({id:id+"-fill",type:"fill",source:id,layout:{visibility:vis},paint:{"fill-color":"#F39200","fill-opacity":op}});
  state.map.addLayer({id:id+"-line",type:"line",source:id,layout:{visibility:vis},paint:{"line-color":"#F39200","line-width":2}});
  state.map.addLayer({id:id+"-pts",type:"circle",source:id,layout:{visibility:vis},paint:{"circle-radius":6,"circle-color":"#F39200","circle-stroke-width":2,"circle-stroke-color":"#ffffff"}});
  state.pcCustomGeoData=data;
}

function removeImageOverlay(clearUrl=false){
  if(clearUrl){state.pcImageUrl="";state.pcImageCoordinates=null;}
  if(!state.map||!state.mapLoaded)return;
  const id=state.pcImageLayerId;
  try{if(state.map.getLayer(id))state.map.removeLayer(id)}catch(_){}
  try{if(state.map.getSource(id))state.map.removeSource(id)}catch(_){}
}
function applyImageOverlay(url,coordinates) {
  if(!state.map || !state.mapLoaded || !url)return;
  if (!coordinates) {
    const bounds=state.map.getBounds();
    const west=bounds.getWest(),east=bounds.getEast(),north=bounds.getNorth(),south=bounds.getSouth();
    const x=(east-west)*.12,y=(north-south)*.12;
    coordinates=[[west+x,north-y],[east-x,north-y],[east-x,south+y],[west+x,south+y]];
  }
  removeImageOverlay(false);
  const opacity=Number($("pcImageOpacity")?.value||70)/100;
  state.map.addSource(state.pcImageLayerId,{type:"image",url,coordinates});
  state.map.addLayer({id:state.pcImageLayerId,type:"raster",source:state.pcImageLayerId,paint:{"raster-opacity":opacity}});
  state.pcImageUrl=url;
  state.pcImageCoordinates=coordinates;
}

function reapplyCustomLayers(){
  if(state.pcCustomGeoData)applyGeoJsonLayer(state.pcCustomGeoData);
  if(state.pcImageUrl)applyImageOverlay(state.pcImageUrl,state.pcImageCoordinates);
}
function initMap(){
  if(state.map||state.mode!=="desktop")return;
  if(!window.maplibregl){text("mapMissing","Map library unavailable.");return}
  try{
    state.map=new window.maplibregl.Map({container:"map",style:MAP_STYLES[state.pcMapStyle]||MAP_STYLES.standard,center:[-73.7781,40.6413],zoom:10.5});
    state.map.addControl(new window.maplibregl.NavigationControl(),"top-right");
    state.map.on("load",()=>{
      state.mapLoaded=true;
      const mm=$("mapMissing");if(mm)mm.style.display="none";
      scheduleMapResize();
      requestLiveLocations(true);
    });
    state.map.on("style.load",()=>{
      state.mapLoaded=true;
      $("mapMissing").hidden=true;
      try { reapplyCustomLayers(); } catch (_) { toast("A custom layer could not be restored."); }
      state.locationsByKey.forEach(marker);
    });
    state.map.on("error",()=>{
      if (!state.mapLoaded) {
        $("mapMissing").hidden=false;
        $("mapMissing").style.removeProperty("display");
        text("mapMissing","Map tiles unavailable. Try another map style.");
      }
    });
  }catch(e){
    console.warn("MapLibre init skipped:",e);
    text("mapMissing","Map unavailable in this browser/sandbox.");
  }
}
function switchMapStyle(styleKey){
  if(!MAP_STYLES[styleKey]||state.pcMapStyle===styleKey)return;
  state.pcMapStyle=styleKey;
  document.querySelectorAll("[data-map-style]").forEach(b=>b.classList.toggle("active",b.dataset.mapStyle===styleKey));
  if(state.map){
    try { state.mapLoaded=false; state.map.setStyle(MAP_STYLES[styleKey]); }
    catch (_) { toast("The map style could not be loaded."); }
  }
}
function marker(d){
  const l=normalizeLocation(d);
  if(!l || state.isOfflineManual || (l.groupId && l.groupId!==gid()))return;
  state.locationsByKey.set(l.key,l);
  if(!state.map||!state.mapLoaded||!window.maplibregl)return;
  try{
    let m=state.markers.get(l.key);
    const accTxt=l.accuracy?` · ±${Math.round(l.accuracy)}m`:"";
    const popupTxt=[l.name||l.skId||"Staff",l.role,l.base].filter(Boolean).join(" · ")+accTxt;
    if(!m){
      const el=window.document.createElement("div");
      const ringSize=l.accuracy?Math.min(54,Math.max(28,Math.round(l.accuracy/4))):0;
      el.style.cssText="position:relative;width:18px;height:18px;background:#0077C8;border:3px solid #ffffff;border-radius:50%;box-shadow:0 0 0 2px rgba(0,119,200,.45)";
      if(ringSize){
        const ring=window.document.createElement("div");
        ring.style.cssText=`position:absolute;left:50%;top:50%;width:${ringSize}px;height:${ringSize}px;transform:translate(-50%,-50%);border-radius:50%;background:rgba(0,119,200,.18);border:1px solid rgba(0,119,200,.55);pointer-events:none;`;
        el.appendChild(ring);
      }
      m=new window.maplibregl.Marker({element:el}).setLngLat([l.longitude,l.latitude]).setPopup(new window.maplibregl.Popup({offset:16}).setText(popupTxt)).addTo(state.map);
      state.markers.set(l.key,m);
    }else{m.setLngLat([l.longitude,l.latitude]);m.getPopup?.()?.setText?.(popupTxt)}
    text("mapPinCount",String(state.markers.size));
  }catch(_){}
}

/* =========================================================
   LIVEKIT VOICE & PTT FLOOR CONTROL
   ========================================================= */
function detachRoomAudio(elements) {
  for (const audio of elements) {
    try { audio.pause(); } catch (_) {}
    audio.remove();
  }
  elements.clear();
}
async function disconnectVoiceRoom() {
  const room=state.room;
  if (!room) return;
  const mute=setMic(false);
  state.room=null;
  state.voiceRoomName="";
  await mute.catch(()=>{});
  try { await room.disconnect(); } catch (_) {}
}
function resumeVoicePlayback(){
  ensureAudioCtx();
  state.room?.startAudio?.().catch(()=>{});
  window.document.querySelectorAll("audio[data-grouptalk-audio='1']").forEach(audio=>audio.play?.().catch(()=>{}));
}
async function connectLiveKit() {
  const epoch=state.connectionEpoch;
  if (!connectionCurrent(epoch)) throw new Error("Select a group and go online first.");
  if (state.activeGroup.capabilities?.canListen===false) throw new Error("Listening is unavailable for this group.");
  if (!window.LivekitClient) throw new Error("LiveKit client failed to load.");
  const groupId=gid();
  const roomName=state.activeGroup.livekitRoomName || state.activeGroup.livekit_room || state.activeGroup.channelName;
  if (state.room && state.voiceRoomName===roomName) return state.room;
  if (state.voiceJob?.epoch===epoch) return state.voiceJob.promise;

  const job={epoch,promise:null};
  state.voiceJob=job;
  job.promise=(async()=>{
    const requestId=req("LK");
    const response=await new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>{
        state.lkCbs.delete(requestId);
        reject(new Error("LiveKit token timed out."));
      },12000);
      state.lkCbs.set(requestId,{
        resolve:value=>{clearTimeout(timer);resolve(value);},
        reject:error=>{clearTimeout(timer);reject(error);}
      });
      post("LIVEKIT_TOKEN_REQUEST",{requestId,groupId});
    });
    if (!connectionCurrent(epoch)) return null;
    await disconnectVoiceRoom();
    if (!connectionCurrent(epoch)) return null;
    const LK=window.LivekitClient;
    const room=new LK.Room({adaptiveStream:true,dynacast:true});
    const audioElements=new Set();
    room.on(LK.RoomEvent.TrackSubscribed,track=>{
      if (track.kind!=="audio" || !connectionCurrent(epoch)) return;
      const audio=track.attach();
      audio.autoplay=true;
      audio.playsInline=true;
      audio.muted=state.pcAudioMuted;
      audio.dataset.grouptalkAudio="1";
      audioElements.add(audio);
      appRoot.appendChild(audio);
      audio.play().catch(()=>{});
    });
    room.on(LK.RoomEvent.TrackUnsubscribed,track=>{
      for (const audio of track.detach()) {
        audioElements.delete(audio);
        audio.remove();
      }
    });
    room.on(LK.RoomEvent.Disconnected,()=>{
      if (state.room===room) {
        if (state.speaking || state.pttHeld) void stopPtt();
        state.room=null;
        state.voiceRoomName="";
      }
      detachRoomAudio(audioElements);
    });
    try {
      await room.connect(response.livekitUrl,response.token);
      if (!connectionCurrent(epoch)) {
        await room.disconnect();
        return null;
      }
      state.room=room;
      state.voiceRoomName=roomName;
      await setMic(false);
      if (!connectionCurrent(epoch)) return null;
      sendPtt("LIVEKIT_JOIN",{room:roomName,groupId});
      return room;
    } catch (error) {
      detachRoomAudio(audioElements);
      await room.disconnect().catch(()=>{});
      throw error;
    }
  })();
  try { return await job.promise; }
  finally { if (state.voiceJob===job) state.voiceJob=null; }
}
function ensureVoiceConnected(){return connectLiveKit();}
async function setMic(on,pttSequence=null){
  const room=state.room;if(!room)return false;
  const op=state.micQueue.catch(()=>{}).then(async()=>{
    if(on&&(state.room!==room||(pttSequence!==null&&(!state.pttHeld||pttSequence!==state.pttSequence))))return false;
    const lp=room.localParticipant;
    if(!lp||typeof lp.setMicrophoneEnabled!=="function")throw new Error("Microphone is unavailable.");
    await lp.setMicrophoneEnabled(!!on);
    return true;
  });
  state.micQueue=op;return op;
}
function setPttLevel(value){
  const n=Math.max(0,Math.min(100,Number(value)||0));
  const d=n<2?0:Math.max(8,n);
  ["mPtt","dPtt"].forEach(id=>{const el=$(id);if(el)el.style.setProperty("--ptt-level",`${d}%`)});
}
function vu(on){["mPtt","dPtt"].forEach(id=>$(id)?.classList.toggle("speaking",on));if(!on)setPttLevel(0)}

function canTransmit() {
  return Boolean(gid()) && !state.isOfflineManual && state.activeGroup.capabilities?.canTalk===true;
}
async function startPtt(){
  if (state.speaking || state.pttHeld) return;
  if (!canTransmit()) { playRadioTone("busy");toast("Go online in a group with talk permission.");return; }
  const sequence=++state.pttSequence;
  const groupId=gid();
  state.pttHeld=true;
  document.body.classList.add("ptt-lock");
  updatePttVisuals();
  try {
    const room=await connectLiveKit();
    if (!room || sequence!==state.pttSequence || !state.pttHeld || gid()!==groupId || !canTransmit() || state.room!==room) return;
    const enabled=await setMic(true,sequence);
    if (!enabled || sequence!==state.pttSequence || !state.pttHeld) return;
    state.speaking=true;
    $("mPtt")?.classList.add("pressed");$("dPtt")?.classList.add("pressed");
    startTxTimer();
    playRadioTone("txStart");
    updatePttVisuals();
    sendPtt(state.mode==="desktop"?"PTT_DOWN_DESKTOP":"PTT_DOWN",{groupId});
  } catch (error) {
    if (sequence!==state.pttSequence) return;
    await stopPtt();
    playRadioTone("busy");
    toast(error.message||"Voice failed");
  }
}
async function stopPtt(){
  if (!state.speaking && !state.pttHeld) return;
  const wasSpeaking=state.speaking;
  const groupId=gid();
  const event=state.mode==="desktop"?"PTT_UP_DESKTOP":"PTT_UP";
  ++state.pttSequence;
  state.speaking=false;
  state.pttHeld=false;
  document.body.classList.remove("ptt-lock");
  $("mPtt")?.classList.remove("pressed");$("dPtt")?.classList.remove("pressed");
  stopTxTimer();
  if (wasSpeaking) {
    state.pcLastActivityTs=Date.now();
    state.pcLastActivityLabel=`You (${state.activeGroup?.title||"Group"})`;
    playRadioTone("txStop");
  }
  updatePttVisuals();
  try { await setMic(false); }
  catch (_) { await disconnectVoiceRoom(); }
  if (wasSpeaking) sendPtt(event,{groupId});
}
function sendPtt(type,{groupId=gid(),...extra}={}) {
  const requestId=req("PTT");
  post("PTT_EVENT",{requestId,type,groupId,extra});
  return requestId;
}

function stopLocation() {
  if (state.watch!==null) navigator.geolocation?.clearWatch(state.watch);
  state.watch=null;
  state.locationLive=false;
  state.locationRequest="";
  updateLocationVisuals();
}
function startLocation(){
  if (!navigator.geolocation) { toast("Location unavailable in this browser.");return; }
  if (state.watch!==null) { stopLocation();toast("Live location stopped.");return; }
  if (!gid() || state.isOfflineManual || !state.activeGroup.capabilities?.canViewLocations) {
    toast("Live location is unavailable for this group.");
    return;
  }
  const epoch=state.connectionEpoch, groupId=gid();
  let last=0;
  state.watch=navigator.geolocation.watchPosition(position=>{
    if (!connectionCurrent(epoch) || state.watch===null) return;
    const now=Date.now();
    if (now-last<8000) return;
    last=now;
    const {latitude,longitude,accuracy,heading,speed}=position.coords;
    state.locationRequest=req("GPS");
    post("LOCATION_PING",{requestId:state.locationRequest,groupId,latitude,longitude,accuracy,heading,speed});
  }, error=>{
    if (!connectionCurrent(epoch) || state.watch===null) return;
    stopLocation();
    toast(error.message||"Location permission denied.");
  },{enableHighAccuracy:true,maximumAge:10000,timeout:15000});
  updateLocationVisuals();
}

/* =========================================================
   SUPABASE REALTIME
   ========================================================= */
function stopLightweightSync(){if(state.syncTimer){clearInterval(state.syncTimer);state.syncTimer=null}}
function runLightweightSync(){
  if(!gid()||state.isOfflineManual)return;
  post("PHONEBOOK_REQUEST",{requestId:req("PHONE"),groupId:gid()});
  post("TICKET_LIST_REQUEST",{requestId:req("TICK"),groupId:gid()});
  post("TICKET_CATEGORY_LIST_REQUEST",{requestId:req("CAT"),groupId:gid()});
  post("PRESENCE_REQUEST",{requestId:req("PRES"),groupId:gid()});
}
function startLightweightSync(){stopLightweightSync();state.syncTimer=setInterval(runLightweightSync,45000)}

function setRealtimeStatus(status,label){
  const rt=$("realtimeState");
  if(rt){
    rt.textContent=status||"offline";
    rt.classList.remove("state-online","state-connecting","state-error");
    if(status==="online")rt.classList.add("state-online");
    else if(status==="connecting")rt.classList.add("state-connecting");
    else if(status==="error")rt.classList.add("state-error");
  }
  const pwr=$("btnPcOffline");
  if(pwr){
    pwr.classList.remove("state-online","state-connecting","state-error");
    if(status==="online")pwr.classList.add("state-online");
    else if(status==="connecting")pwr.classList.add("state-connecting");
    else if(status==="error")pwr.classList.add("state-error");
    pwr.title=state.isOfflineManual||status==="offline"||status==="error"?"Go Online":"Go Offline";
    pwr.setAttribute("aria-label",pwr.title);
  }
  const dot=$("mDot");
  if(dot){dot.classList.toggle("on",status==="online");dot.classList.toggle("warn",status==="connecting"||status==="error")}
  text("mStatus",label||(status==="online"?"Connected":status==="connecting"?"Connecting…":status==="error"?"Error":"Offline"));
  const action=state.isOfflineManual||status==="offline"||status==="error"?"Go Online":"Go Offline";
  text("mOfflineLabel",action);
  text("pcOfflineLabel",action);
  updatePcActivityBar();
}
function clearRealtimeTimers(){
  if(state.realtimeHeartbeat){clearInterval(state.realtimeHeartbeat);state.realtimeHeartbeat=null}
  if(state.realtimePresenceRefresh){clearInterval(state.realtimePresenceRefresh);state.realtimePresenceRefresh=null}
  if(state.realtimeAuthRefresh){clearInterval(state.realtimeAuthRefresh);state.realtimeAuthRefresh=null}
}
function requestPresence(){if(gid()&&!state.isOfflineManual)post("PRESENCE_REQUEST",{requestId:req("PRES"),groupId:gid()})}
function startPresenceTimers(){
  clearRealtimeTimers();
  state.realtimeHeartbeat=setInterval(()=>{const c=state.realtimeConfig;if(c?.sessionKey&&gid())post("PRESENCE_UPDATE",{requestId:req("HB"),groupId:gid(),sessionKey:c.sessionKey,status:"online",heartbeat:true})},20000);
  state.realtimePresenceRefresh=setInterval(requestPresence,30000);
}
function requestRealtimeAuthRefresh(){
  const id=req("RTA");return new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>{state.realtimeCbs.delete(id);reject(new Error("Realtime auth refresh timed out."))},12000);
    state.realtimeCbs.set(id,{resolve:v=>{clearTimeout(timer);resolve(v)},reject:e=>{clearTimeout(timer);reject(e)}});
    post("REALTIME_AUTH_REFRESH_REQUEST",{requestId:id,groupId:gid()});
  });
}
function startRealtimeAuthRefresh() {
  if (state.realtimeAuthRefresh) clearInterval(state.realtimeAuthRefresh);
  const epoch=state.connectionEpoch, client=state.supabaseClient;
  state.realtimeAuthRefresh=setInterval(async()=>{
    if (!state.realtimeChannel || !connectionCurrent(epoch)) return;
    try {
      const auth=await requestRealtimeAuthRefresh();
      if (!connectionCurrent(epoch)) return;
      if (!auth?.realtimeToken) throw new Error("Missing realtime token");
      await client.realtime.setAuth(auth.realtimeToken);
    } catch (_) {
      if (!connectionCurrent(epoch)) return;
      disconnectSupabaseRealtime(true);
      connectSupabaseRealtime().catch(()=>{
        if (connectionCurrent(epoch)) setRealtimeStatus("error","Connection error");
      });
    }
  },120000);
}
function disconnectSupabaseRealtime(markOffline=false){
  clearRealtimeTimers();clearTimeout(state.databaseRefreshTimer);const c=state.realtimeConfig;
  if(markOffline&&c?.sessionKey&&c?.groupId)post("PRESENCE_UPDATE",{requestId:req("OFF"),groupId:c.groupId,sessionKey:c.sessionKey,status:"offline",heartbeat:false});
  if(state.realtimeChannel&&state.supabaseClient){try{state.supabaseClient.removeChannel(state.realtimeChannel)}catch(_){}}
  state.realtimeChannel=null;state.realtimeConfig=null;state.realtimeConnecting=false;state.members.clear();members();setRealtimeStatus("offline","Offline");
}
function requestRealtimeConfig(){
  const id=req("RT");return new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>{state.realtimeCbs.delete(id);reject(new Error("Realtime config timed out."))},12000);
    state.realtimeCbs.set(id,{resolve:v=>{clearTimeout(timer);resolve(v)},reject:e=>{clearTimeout(timer);reject(e)}});
    post("REALTIME_CONFIG_REQUEST",{requestId:id,groupId:gid()});
  });
}
function ticketKey(t){return t?.ticketId||t?.id||t?.ticketNumber||""}
function upsertTicket(ticket,front=false){
  if(!ticket)return;const key=ticketKey(ticket);if(!key)return;
  const i=state.tickets.findIndex(t=>ticketKey(t)===key);
  if(i>=0)state.tickets[i]=ticket;else if(front)state.tickets.unshift(ticket);else state.tickets.push(ticket);
  if (state.myTickets && ticket.requesterSkId===state.profile.skId) {
    const ownIndex=state.myTickets.findIndex(item=>ticketKey(item)===key);
    if (ownIndex===-1) state.myTickets.unshift(ticket); else state.myTickets[ownIndex]=ticket;
  }
  tickets();
}
function applyPresenceMember(member){
  if(!member)return;const key=member.id||member.agentUserId||member.skId;if(!key)return;
  const status=String(member.state||member.status||"online").toLowerCase();
  if(status==="offline")state.members.delete(key);
  else state.members.set(key,{id:key,skId:member.skId||"",name:member.name||member.displayName||member.skId||"Staff",role:member.role||"",base:member.base||"",state:"online"});
  members();
}
function handleSupabaseRealtime(message){
  const event=message?.event||message?.type||"",data=message?.payload??message?.data??message??{};
  if(message?.groupId&&gid()&&message.groupId!==gid())return;
  if(event==="database-changed"){
    if(state.databaseRefreshTimer)clearTimeout(state.databaseRefreshTimer);
    state.databaseRefreshTimer=setTimeout(()=>{
      state.databaseRefreshTimer=null;const table=data.table||"";
      if(table==="grouptalk_groups"||table==="grouptalk_group_members"){post("GT_REFRESH",{reason:"supabase-database-change"});return}
      if(table==="grouptalk_locations"){requestLiveLocations(false);return}
      if(table==="grouptalk_realtime_sessions"){requestPresence();post("PHONEBOOK_REQUEST",{groupId:gid()});return}
      if(table==="grouptalk_phonebook"){post("PHONEBOOK_REQUEST",{groupId:gid()});return}
      if(table==="grouptalk_ticket_categories"){post("TICKET_CATEGORY_LIST_REQUEST",{groupId:gid()});return}
      if(table==="grouptalk_tickets"||table==="grouptalk_ticket_replies"){post("TICKET_LIST_REQUEST",{groupId:gid()});if(state.selectedTicket)openTicket(ticketKey(state.selectedTicket))}
    },180);return;
  }
  if(event==="presence-updated"){applyPresenceMember(data.member||data);return}
  if(event==="ptt-started"){
    if(data.skId!==state.profile.skId){
      state.remoteSpeakerName=data.name||data.skId||"Colleague";
      state.remoteSpeakerSkId=data.skId||"";
      text("dActiveSub",`${state.remoteSpeakerName} speaking`);
      playRadioTone("rxStart");vu(true);updatePttVisuals();members();
    }return;
  }
  if(event==="ptt-ended"){
    if(data.skId!==state.profile.skId){
      state.pcLastActivityTs=Date.now();
      state.pcLastActivityLabel=`${state.remoteSpeakerName||data.name||data.skId||"Colleague"} (${state.activeGroup?.title||"Group"})`;
      state.remoteSpeakerName="";state.remoteSpeakerSkId="";
      text("dActiveSub",[state.activeGroup?.base||state.profile.base,state.activeGroup?.category||"Operations"].filter(Boolean).join(" • ")||"—");
      playRadioTone("rxStop");vu(false);updatePttVisuals();members();
    }return;
  }
  if(event==="emergency-alert"){
    playRadioTone("panic");
    text("emergencyText",`EMERGENCY\n${data.name||data.skId}\n${data.group||""}`);
    $("emergencyOverlay")?.classList.add("active");
    if(navigator.vibrate)navigator.vibrate([80,40,80,40,80]);
    setTimeout(()=>$("emergencyOverlay")?.classList.remove("active"),4000);return;
  }
  if(event==="grouptalk-event" && data.type==="TONE_SIGNAL" && data.skId!==state.profile.skId){
    playRadioTone("toneSignal");return;
  }
  if(event==="location-updated"){if(state.mode==="desktop")marker(data);return}
  if(event==="ticket-created"){upsertTicket(data.ticket,true);if(data.ticket?.requesterSkId!==state.profile.skId)toast("New helpdesk ticket");return}
  if(event==="ticket-updated"){upsertTicket(data.ticket,true);if(state.selectedTicket&&ticketKey(state.selectedTicket)===ticketKey(data.ticket))openTicket(ticketKey(data.ticket));toast("Ticket updated");return}
  if(event==="group-updated"||event==="membership-updated"){post("GT_REFRESH",{reason:event});return}
  if(event==="ticket-categories-updated"||event==="categories-updated"){post("TICKET_CATEGORY_LIST_REQUEST",{groupId:gid()});return}
}
async function connectSupabaseRealtime(){
  const epoch=state.connectionEpoch;
  if(!connectionCurrent(epoch)||state.realtimeConnecting||state.realtimeChannel)return;
  if(!window.supabase?.createClient){setRealtimeStatus("error","Supabase library failed");return}
  state.realtimeConnecting=true;setRealtimeStatus("connecting","Connecting…");
  try{
    const config=await requestRealtimeConfig();
    if(!connectionCurrent(epoch))return;
    if(!config?.ok)throw new Error(config?.message||"Supabase Realtime is unavailable.");
    if(!state.supabaseClient||state.supabaseUrl!==config.supabaseUrl||state.supabaseKey!==config.publishableKey){
      state.supabaseClient=window.supabase.createClient(config.supabaseUrl,config.publishableKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},realtime:{params:{eventsPerSecond:20}}});
      state.supabaseUrl=config.supabaseUrl;state.supabaseKey=config.publishableKey;
    }
    if(!config.realtimeToken)throw new Error("Supabase Realtime authorization token is missing.");
    await state.supabaseClient.realtime.setAuth(config.realtimeToken);
    if(!connectionCurrent(epoch))return;
    state.realtimeConfig=config;
    const channel=state.supabaseClient.channel(config.topic,{config:{private:true,broadcast:{self:false}}}).on("broadcast",{event:config.broadcastEvent||"grouptalk"},({payload})=>handleSupabaseRealtime(payload));
    state.realtimeChannel=channel;
    channel.subscribe(status=>{
      if(state.realtimeChannel!==channel)return;
      if(status==="SUBSCRIBED"){setRealtimeStatus("online","Connected");requestPresence();startPresenceTimers();startRealtimeAuthRefresh()}
      else if(status==="CHANNEL_ERROR"||status==="TIMED_OUT"){playRadioTone("disconnect");setRealtimeStatus("error","Connection error")}
      else if(status==="CLOSED")setRealtimeStatus("offline","Offline");
    });
  }finally{if(connectionCurrent(epoch))state.realtimeConnecting=false;}
}

/* =========================================================
   TICKETS, CATEGORIES & CASES
   ========================================================= */
function slug(s){return String(s||"").trim().toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||"category"}
function normalizedCategories(raw) {
  return Array.isArray(raw) ? raw.filter(category=>category && (category.categoryId||category.id)) : [];
}
function catTitle(category){return category.title||category.name||category.label||category.categoryId;}
function catId(category){return category.categoryId||category.id;}
function sortedCats(){
  return state.ticketCategories.slice().sort((a,b)=>Number(a.sort||0)-Number(b.sort||0)||catTitle(a).localeCompare(catTitle(b)));
}
function fillCategorySelect(id) {
  const select=$(id);
  if (!select) return;
  const selected=select.value;
  const options=sortedCats().filter(category=>category.active!==false)
    .map(category=>new Option(catTitle(category),catId(category)));
  select.replaceChildren(...options);
  if (options.some(option=>option.value===selected)) select.value=selected;
  if (!options.length) select.append(new Option("No categories available",""));
}
function mayCreateTicket() {
  return Boolean(gid()) && (state.canManage || state.activeGroup.capabilities?.canCreateTickets===true);
}
function renderTicketCategories(){fillCategorySelect("ticketCategory");fillCategorySelect("caseCategory");renderCategoryAdmin()}
function renderCategoryAdmin(){
  const list=$("categoryList");if(!list)return;list.innerHTML="";
  const cats=sortedCats();
  if(!cats.length){list.className="categoryList empty";list.textContent="No categories yet.";return}
  list.className="categoryList";
  cats.forEach(c=>{
    const row=window.document.createElement("div");row.className="categoryRow"+(c.active===false?" hiddenCat":"");
    const info=window.document.createElement("div");info.innerHTML=`<b>${escapeHTML(catTitle(c))}</b><div class="small">${c.active===false?"Hidden":"Active"} · sort ${escapeHTML(c.sort||"")}</div>`;
    const edit=window.document.createElement("button");edit.className="mini";edit.type="button";edit.textContent="Edit";edit.onclick=()=>editCategory(catId(c));
    row.append(info,edit);list.appendChild(row);
  });
}
function resetDeleteConfirm(){state.deleteConfirmCatId="";clearTimeout(state.deleteConfirmTimer);const b=$("btnDeleteCategory");if(b)b.textContent="Delete"}
function resetCategoryForm(){if($("catId"))$("catId").value="";if($("catTitle"))$("catTitle").value="";if($("catSort"))$("catSort").value=String((state.ticketCategories||[]).length+1);if($("catActive"))$("catActive").value="true";resetDeleteConfirm()}
function editCategory(id){const c=sortedCats().find(x=>catId(x)===id);if(!c)return;if($("catId"))$("catId").value=catId(c);if($("catTitle"))$("catTitle").value=catTitle(c);if($("catSort"))$("catSort").value=c.sort||"";if($("catActive"))$("catActive").value=String(c.active!==false);resetDeleteConfirm()}
function saveCategory() {
  const title=$("catTitle").value.trim();
  if (!state.canManage || !title) { toast("Enter a category name.");return; }
  const category={
    categoryId:$("catId").value||slug(title),
    title,
    active:$("catActive").value==="true",
    sort:Number($("catSort").value||state.ticketCategories.length+1)
  };
  post("TICKET_CATEGORY_SAVE",{requestId:req("CAT"),groupId:gid(),category});
}
function deleteCategory(){
  const id=$("catId")?.value;if(!id){toast("Select a category first");return}
  const c=state.ticketCategories.find(x=>catId(x)===id);if(!c)return;
  if(state.deleteConfirmCatId!==id){
    state.deleteConfirmCatId=id;const b=$("btnDeleteCategory");if(b)b.textContent="Confirm Delete";
    toast(`Tap "Confirm Delete" again to remove "${catTitle(c)}"`);
    clearTimeout(state.deleteConfirmTimer);state.deleteConfirmTimer=setTimeout(resetDeleteConfirm,4000);return;
  }
  resetDeleteConfirm();
  post("TICKET_CATEGORY_DELETE",{requestId:req("CAT"),groupId:gid(),categoryId:id});
}
function toggleCaseTarget(skId){if(!skId){toast("Employee has no SK-ID");return}state.caseTargets.has(skId)?state.caseTargets.delete(skId):state.caseTargets.add(skId);desktopPhonebook();renderCaseTargets()}
function clearCaseTargets(){state.caseTargets.clear();desktopPhonebook();renderCaseTargets()}
function renderCaseTargets(){
  const box=$("caseEmployeeList");if(!box)return;text("caseTargetCount",`${state.caseTargets.size} selected`);box.innerHTML="";
  if(!state.phonebook.length){box.className="caseEmployeeList empty";box.textContent="Phonebook not loaded.";return}
  box.className="caseEmployeeList";
  state.phonebook.forEach(c=>{
    const id=c.skId||"";const row=window.document.createElement("label");row.className="caseEmployee"+(state.caseTargets.has(id)?" selected":"");
    const cb=window.document.createElement("input");cb.type="checkbox";cb.disabled=!id;cb.checked=state.caseTargets.has(id);cb.onchange=()=>toggleCaseTarget(id);
    const info=window.document.createElement("div");info.innerHTML=`<b>${escapeHTML(c.name||"Unnamed")}</b><div class="small">${escapeHTML([c.skId,c.role,c.base].filter(Boolean).join(" • "))}</div>`;
    row.append(cb,info);box.appendChild(row);
  });
}
function submitTicket(fields) {
  if (!mayCreateTicket()) { toast("Select a group with ticket access.");return; }
  if (!fields.subject || !fields.category) { toast("Enter a subject and choose a category.");return; }
  post("TICKET_CREATE",{requestId:req("TICK"),groupId:gid(),...fields});
}
function startCase() {
  const employees=state.phonebook.filter(contact=>state.caseTargets.has(contact.skId))
    .map(({skId,name,role,base,phone})=>({skId,name,role,base,phone}));
  if (!employees.length) { toast("Select at least one employee.");return; }
  submitTicket({
    caseMode:true,createdFrom:"DESKTOP_CASE",targetSkIds:employees.map(contact=>contact.skId),employees,
    subject:$("caseSubject").value.trim(),message:$("caseMessage").value.trim(),
    category:$("caseCategory").value,priority:$("casePriority").value,routeRef:$("caseRoute").value.trim()
  });
}
function openTicket(ticketId){post("TICKET_LIST_REQUEST",{ticketId})}
function openMyTickets() {
  $("mobileTicketDetail").hidden=true;
  open("myTicketsSheet");
  state.mineRequest=req("MINE");
  post("TICKET_LIST_REQUEST",{mineOnly:true,requestId:state.mineRequest});
}
function detail(ticket,messages=[]) {
  state.selectedTicket=ticket;
  text("detailStatus",ticket.status||"—");
  const title=ticket.subject||ticket.title||ticket.ticketId;
  const body=[
    [ticket.category,ticket.priority,ticket.status].filter(Boolean).join(" · "),
    "Requester: "+(ticket.requesterSkId||"—"),
    "Route/ref: "+(ticket.routeRef||"—"),
    ticket.message||"",
    ...messages.map(reply=>`${reply.senderName||reply.senderSkId||"Staff"}: ${reply.body||""}`)
  ].join("\n\n");
  for (const id of ["ticketDetail","mobileTicketDetail"]) {
    const detail=$(id);
    const heading=document.createElement("strong");
    heading.textContent=title;
    detail.replaceChildren(heading,document.createTextNode("\n\n"+body));
    detail.hidden=false;
  }
  if (state.mode==="desktop") activatePaneTab("paneRightTop","tabDetail");
  else {
    $("mobileTicketDetail").focus({preventScroll:true});
    $("mobileTicketDetail").scrollIntoView?.({block:"nearest"});
  }
}
function createTicket(){
  submitTicket({
    category:$("ticketCategory").value,priority:$("ticketPriority").value,
    subject:$("ticketSubject").value.trim(),message:$("ticketMessage").value.trim(),routeRef:$("ticketRoute").value.trim()
  });
}
function reply(status) {
  if (!state.canManage || !state.selectedTicket) { toast("Select a ticket first.");return; }
  const body=$("replyBody").value.trim()||(status==="RESOLVED"?"Resolved.":"");
  const manifestText=$("manifestText").value.trim();
  if (!body && !manifestText) { toast("Enter a reply or manifest.");return; }
  post("TICKET_REPLY",{
    requestId:req("REPLY"),ticketId:state.selectedTicket.ticketId,body,manifestText,
    delivery:$("replyDelivery").value,emailTo:$("replyEmail").value.trim(),status
  });
}

/* =========================================================
   PARENT MESSAGE HANDLER
   ========================================================= */
window.addEventListener("message",e=>{
  const msg=e.data||{},p=msg.payload||{};
  if(e.source!==window.parent || msg.source!==PARENT)return;
  if (msg.type==="GT_BOOTSTRAP") {
    const previous=gid();
    const available=p.groups||[];
    const next=available.find(g=>(g.groupId||g.id)===previous)
      || available.find(g=>(g.groupId||g.id)===p.activeGroupId) || available[0] || null;
    if (previous && (previous!==(next?.groupId||next?.id||"")
      || state.activeGroup.capabilities?.canListen!==false && next?.capabilities?.canListen===false)) endGroupSession();
    else if (state.pttHeld && next?.capabilities?.canTalk!==true) endHold();
    state.profile=p.profile||{};
    state.groups=available;
    state.config=p.config||{};
    state.canManage=Boolean(p.canManage||state.profile.canManage);
    state.phonebook=p.phonebook||[];
    state.tickets=p.tickets||[];
    state.ticketCategories=normalizedCategories(p.ticketCategories||p.categories);
    state.activeGroup=next;
    decide();
    render();
    if (!gid()) setRealtimeStatus("offline","No group selected");
    else if (!state.isOfflineManual) connectGroup();
    post("TICKET_CATEGORY_LIST_REQUEST",{groupId:gid()});
    return;
  }
  if(msg.type==="LIVEKIT_TOKEN_RESPONSE"){const cb=state.lkCbs.get(p.requestId);if(cb){state.lkCbs.delete(p.requestId);p.ok!==false?cb.resolve(p):cb.reject(new Error(p.message||"LiveKit token failed"))}return}
  if (msg.type==="PTT_EVENT_RESULT") {
    if (p.requestId===state.emergencyRequest && state.emergencyRequest) {
      state.emergencyRequest="";
      text("emergencyTileLabel","Emergency");
      if (p.ok && p.realtime?.ok) { playRadioTone("panic");showEmergencyNotice("Emergency alert sent"); }
      else toast("The emergency alert could not be sent.");
    } else if (p.eventType==="TONE_SIGNAL" && p.ok && p.realtime?.ok) playRadioTone("toneSignal");
    return;
  }
  if(msg.type==="REALTIME_CONFIG_RESPONSE"||msg.type==="REALTIME_AUTH_REFRESH_RESPONSE"){const cb=state.realtimeCbs.get(p.requestId);if(cb){state.realtimeCbs.delete(p.requestId);p.ok!==false?cb.resolve(p):cb.reject(new Error(p.message||"Realtime error"))}return}
  if(msg.type==="PRESENCE_RESPONSE"){
    if (!state.isOfflineManual) {
      state.members.clear();
      (p.members||[]).forEach(applyPresenceMember);
      members();
    }
    return;
  }
  if(msg.type==="GT_DIAGNOSTICS"){if(p.ok===false)console.warn("GroupTalk diagnostics:",p);return}
  if(msg.type==="PHONEBOOK_RESPONSE"){state.phonebook=p.contacts||[];phonebook();return}
  if(msg.type==="TICKET_LIST_RESPONSE"){
    if(p.ticket)detail(p.ticket,p.messages||[]);
    if(p.tickets){
      if (state.mineRequest && p.requestId===state.mineRequest) state.myTickets=p.tickets;
      else state.tickets=p.tickets;
      tickets();
    }
    return;
  }
  if(msg.type==="TICKET_CREATE_RESPONSE"){
    if(p.ok && p.ticket){upsertTicket(p.ticket,true);toast(p.ticket.caseMode?"Case created":"Ticket created");close("ticketSheet");}
    return;
  }
  if(msg.type==="TICKET_REPLY_RESPONSE"){
    if(p.ok && p.ticket){upsertTicket(p.ticket,true);detail(p.ticket,p.messages||[]);toast("Reply saved");}
    return;
  }
  if(msg.type==="LOCATION_PING_RESULT"){
    if(state.watch!==null && p.ok===true && p.requestId===state.locationRequest){
      state.locationLive=true;
      updateLocationVisuals();
      if(p.location)marker(p.location);
      requestLiveLocations(false);
    }
    return;
  }
  if(msg.type==="LIVE_LOCATIONS_RESPONSE"){
    if (!state.isOfflineManual && p.requestId===state.mapRequest) syncLiveLocations(p.locations||p.items||[],state.mapFitPending);
    return;
  }
  if(["TICKET_CATEGORY_LIST_RESPONSE","TICKET_CATEGORY_SAVE_RESPONSE","TICKET_CATEGORY_DELETE_RESPONSE"].includes(msg.type)){
    if (p.categories || p.ticketCategories) state.ticketCategories=normalizedCategories(p.categories||p.ticketCategories);
    renderTicketCategories();
    if (msg.type==="TICKET_CATEGORY_SAVE_RESPONSE" && p.ok) toast("Category saved");
    if (msg.type==="TICKET_CATEGORY_DELETE_RESPONSE" && p.ok) { resetCategoryForm();toast("Category removed"); }
    return;
  }
  if(msg.type==="GT_ERROR"){
    if (p.requestId===state.emergencyRequest && state.emergencyRequest) {
      state.emergencyRequest="";
      text("emergencyTileLabel","Emergency");
      toast("The emergency alert could not be sent.");
      return;
    }
    if (p.action==="LOCATION_PING" && p.requestId===state.locationRequest) stopLocation();
    toast(p.message||"GroupTalk error");
    return;
  }
});

/* =========================================================
   EVENT BINDINGS (MOBILE + DESKTOP PC DISPATCH 2)
   ========================================================= */
$("btnPhone")?.addEventListener("click",()=>{open("phoneSheet");post("PHONEBOOK_REQUEST",{groupId:gid()})});
$("btnGroups")?.addEventListener("click",()=>open("groupSheet"));
$("gtChannelBar")?.addEventListener("click",()=>open("groupSheet"));
$("btnScanGroups")?.addEventListener("click",()=>{playRadioTone("groupActive");post("GT_REFRESH",{reason:"scan-groups"});toast("Scanning groups…");setTimeout(()=>open("groupSheet"),250)});
$("btnTileHelpdesk")?.addEventListener("click",()=>open("ticketSheet"));
$("btnTileLocation")?.addEventListener("click",()=>startLocation());
$("btnTileTickets")?.addEventListener("click",openMyTickets);
$("btnSettings")?.addEventListener("click",()=>open("mobileSettingsSheet"));
$("btnMobileMenu")?.addEventListener("click",()=>open("mobileSettingsSheet"));
$("btnMobileUsers")?.addEventListener("click",()=>{open("mobileOnlineSheet");members()});
$("btnMobileAlerts")?.addEventListener("click",()=>open("ticketSheet"));
$("btnMobileMessages")?.addEventListener("click",openMyTickets);
$("btnSettingsLocation")?.addEventListener("click",()=>{close("mobileSettingsSheet");startLocation()});
$("btnSettingsHelpdesk")?.addEventListener("click",()=>{close("mobileSettingsSheet");open("ticketSheet")});
$("btnSettingsTickets")?.addEventListener("click",()=>{close("mobileSettingsSheet");openMyTickets();});
$("btnSettingsTones")?.addEventListener("click",()=>{
  state.radioTones=!state.radioTones;
  text("settingsToneSub",`PTT start, roger & incoming tones: ${state.radioTones?"ON":"OFF"}`);
  const b=$("settingsToneBadge");if(b){b.textContent=state.radioTones?"ON":"OFF";b.classList.toggle("state-online",state.radioTones)}
  if(state.radioTones)playRadioTone("groupActive");
});
$("btnSettingsTheme")?.addEventListener("click",()=>{
  state.lightMode=!state.lightMode;
  document.body.classList.toggle("gt-light",state.lightMode);
  text("settingsThemeSub",state.lightMode?"Light Mode":"Dark Mode (Default)");
  text("settingsThemeBadge",state.lightMode?"LIGHT":"DARK");
});
for (const id of ["mToneBtn","dToneBtn"]) $(id)?.addEventListener("click",()=>{
  if (!canTransmit()) { toast("Go online in a group with talk permission.");return; }
  resumeVoicePlayback();
  sendPtt("TONE_SIGNAL");
});

function toggleOffline() {
  if (!gid()) { toast("Select a group first.");return; }
  if (state.isOfflineManual || $("realtimeState")?.textContent==="error") {
    endGroupSession();
    state.isOfflineManual=false;
    render();
    connectGroup();
    return;
  }
  state.isOfflineManual=true;
  endGroupSession();
  setRealtimeStatus("offline","Offline");
  render();
  playRadioTone("disconnect");
  toast("Offline");
}
$("btnGoOffline")?.addEventListener("click",toggleOffline);
$("btnPcOffline")?.addEventListener("click",toggleOffline);

$("btnCreateTicket")?.addEventListener("click",createTicket);
$("btnReply")?.addEventListener("click",()=>reply());
$("btnResolve")?.addEventListener("click",()=>reply("RESOLVED"));
$("btnSaveGroup")?.addEventListener("click",()=>post("ADMIN_SAVE_GROUP",{title:$("adminGroupTitle")?.value||"",base:$("adminGroupBase")?.value||"",allowAllStaff:true,canStaffTalk:true,canStaffCreateTickets:true}));
$("btnDesktopPhonebook")?.addEventListener("click",()=>{post("PHONEBOOK_REQUEST",{groupId:gid()});toast("Refreshing contacts…")});
$("btnNewCategory")?.addEventListener("click",resetCategoryForm);
$("btnSaveCategory")?.addEventListener("click",saveCategory);
$("btnDeleteCategory")?.addEventListener("click",deleteCategory);
$("btnStartCase")?.addEventListener("click",startCase);
$("btnClearCaseTargets")?.addEventListener("click",clearCaseTargets);

/* Desktop PC Dispatch 2 Top Bar, Popovers & Panel Controls */
$("btnChromeClock")?.addEventListener("click",()=>{chromeClockUtc=!chromeClockUtc;updateChromeClock()});
$("btnPcMasterMute")?.addEventListener("click",()=>{state.pcAudioMuted=!state.pcAudioMuted;applyAudioMute();groups();toast(state.pcAudioMuted?"Dispatch audio muted":"Dispatch audio unmuted")});
$("btnPcSettings")?.addEventListener("click",e=>{
  e.stopPropagation();
  $("pcPanelsPopover")?.classList.remove("open");
  $("pcGroupGearPopover")?.classList.remove("open");
  $("pcContactMenu")?.classList.remove("open");
  $("pcSettingsPopover")?.classList.toggle("open");
});
$("btnPcSync")?.addEventListener("click",()=>{playRadioTone("groupActive");post("GT_REFRESH",{reason:"pc-dispatch-sync"});runLightweightSync();requestLiveLocations(false);$("pcSettingsPopover")?.classList.remove("open");toast("Workspace synced")});
$("btnPcReplayCue")?.addEventListener("click",()=>{resumeVoicePlayback();playRadioTone("toneSignal");toast(state.pcLastActivityLabel?`Last PTT: ${state.pcLastActivityLabel}`:"Audio cue played")});
$("btnPcTones")?.addEventListener("click",()=>{
  state.radioTones=!state.radioTones;
  $("btnPcTones")?.classList.toggle("active",state.radioTones);
  text("pcTonesLabel",state.radioTones?"ON":"OFF");
  if(state.radioTones)playRadioTone("groupActive");
});
$("btnPcTheme")?.addEventListener("click",()=>{
  state.pcLightMode=!state.pcLightMode;
  $("desktopDispatchRoot")?.classList.toggle("pc-light",state.pcLightMode);
  text("pcThemeLabel",state.pcLightMode?"Light":"Dark");
});

/* + Add / Focus Panel Popover & Reset Layout */
$("btnPcPanels")?.addEventListener("click",e=>{
  e.stopPropagation();
  $("pcSettingsPopover")?.classList.remove("open");
  $("pcGroupGearPopover")?.classList.remove("open");
  $("pcContactMenu")?.classList.remove("open");
  $("pcPanelsPopover")?.classList.toggle("open");
});
document.querySelectorAll("[data-pc-focus]").forEach(btn=>btn.addEventListener("click",()=>{
  const [paneId,tabId]=String(btn.dataset.pcFocus||"").split(":");
  if(paneId&&tabId)activatePaneTab(paneId,tabId);
  $("pcPanelsPopover")?.classList.remove("open");
}));
$("btnPcResetLayout")?.addEventListener("click",()=>{
  if($("pcLeftCol"))$("pcLeftCol").style.flex="";
  if($("pcRightCol"))$("pcRightCol").style.flex="";
  ["paneLeftTop","paneLeftBot","paneCenterTop","paneCenterBot","paneRightTop","paneRightBot"].forEach(id=>{if($(id))$(id).style.flex=""});
  $("pcWorkspace")?.classList.remove("map-maximized");
  text("btnMapExpand","Expand");
  activatePaneTab("paneLeftTop","tabGroups");
  activatePaneTab("paneLeftBot","tabContacts");
  activatePaneTab("paneCenterTop","tabLocations");
  activatePaneTab("paneCenterBot","tabTickets");
  activatePaneTab("paneRightTop","tabDetail");
  activatePaneTab("paneRightBot","tabCase");
  $("pcPanelsPopover")?.classList.remove("open");
  scheduleMapResize();
});

/* Groups Panel Gear Customize Popover & 4 Filter Buttons */
$("btnGroupGear")?.addEventListener("click",e=>{
  e.stopPropagation();
  $("pcPanelsPopover")?.classList.remove("open");
  $("pcSettingsPopover")?.classList.remove("open");
  $("pcContactMenu")?.classList.remove("open");
  $("pcGroupGearPopover")?.classList.toggle("open");
});
document.querySelectorAll("[data-gfield]").forEach(row=>row.addEventListener("click",e=>{
  e.stopPropagation();
  const key=row.dataset.gfield;
  if(!key||!(key in state.pcGroupFields))return;
  state.pcGroupFields[key]=!state.pcGroupFields[key];
  row.classList.toggle("on",state.pcGroupFields[key]);
  groups();
}));
document.querySelectorAll("[data-gfilter]").forEach(btn=>btn.addEventListener("click",()=>{
  const f=btn.dataset.gfilter||"all";
  state.pcGroupFilter=f;
  document.querySelectorAll("[data-gfilter]").forEach(b=>b.classList.toggle("active",b.dataset.gfilter===f));
  groups();
}));

/* Dismiss open popovers / floating menus on outside click */
window.document.addEventListener("click",e=>{
  if(!e.target?.closest?.(".pcMenuWrap")){
    $("pcPanelsPopover")?.classList.remove("open");
    $("pcSettingsPopover")?.classList.remove("open");
    $("pcGroupGearPopover")?.classList.remove("open");
  }
  if(!e.target?.closest?.("#pcContactMenu")){
    $("pcContactMenu")?.classList.remove("open");
  }
});

/* Inline Search Inputs */
$("groupSearch")?.addEventListener("input",e=>{state.groupQuery=e.target.value||"";groups()});
$("phoneSearch")?.addEventListener("input",e=>{state.phoneQuery=e.target.value||"";desktopPhonebook()});
$("onlineSearch")?.addEventListener("input",e=>{state.onlineQuery=e.target.value||"";members()});
$("ticketSearch")?.addEventListener("input",e=>{state.ticketQuery=e.target.value||"";tickets()});

/* Map Styles, Fit, Expand & Custom GeoJSON / Image Layers */
document.querySelectorAll("[data-map-style]").forEach(btn=>btn.addEventListener("click",()=>{
  switchMapStyle(btn.dataset.mapStyle);
}));
$("btnMapFit")?.addEventListener("click",()=>{requestLiveLocations(true)});
$("btnMapExpand")?.addEventListener("click",()=>{
  const exp=$("pcWorkspace")?.classList.toggle("map-maximized");
  text("btnMapExpand",exp?"Restore":"Expand");
  scheduleMapResize();
});
$("btnMapLayers")?.addEventListener("click",()=>{$("pcLayerDrawer")?.classList.toggle("open");scheduleMapResize()});
$("pcGeoJsonFile")?.addEventListener("change",e=>{
  const file=e.target.files?.[0];if(!file)return;
  if(file.size>10*1024*1024){toast("Use a GeoJSON file smaller than 10 MB.");e.target.value="";return;}
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      if(!state.map||!state.mapLoaded){toast("Map still loading");return}
      const data=JSON.parse(String(reader.result||""));
      if (!data || !["FeatureCollection","Feature","Point","MultiPoint","LineString","MultiLineString","Polygon","MultiPolygon","GeometryCollection"].includes(data.type)) {
        throw new Error("Invalid GeoJSON");
      }
      applyGeoJsonLayer(data);
      toast("Custom GeoJSON layer added");
    }catch(_){toast("Invalid GeoJSON file")}
  };
  reader.readAsText(file);e.target.value="";
});
$("pcLayerVisible")?.addEventListener("change",e=>{
  if(!state.map||!state.mapLoaded)return;const vis=e.target.checked?"visible":"none",id=state.pcCustomLayerId;
  [id+"-fill",id+"-line",id+"-pts"].forEach(l=>{try{if(state.map.getLayer(l))state.map.setLayoutProperty(l,"visibility",vis)}catch(_){}});
});
$("pcLayerOpacity")?.addEventListener("input",e=>{
  if(!state.map||!state.mapLoaded)return;
  try{if(state.map.getLayer(state.pcCustomLayerId+"-fill"))state.map.setPaintProperty(state.pcCustomLayerId+"-fill","fill-opacity",Number(e.target.value||40)/100)}catch(_){}
});
$("btnPcClearLayer")?.addEventListener("click",()=>{removeCustomLayer(true);toast("Custom layer cleared")});
$("btnPcAddImage")?.addEventListener("click",async()=>{
  const button=$("btnPcAddImage");
  const field=$("pcImageLayerUrl");
  let url;
  try {
    url=new URL(field.value.trim());
    if (url.protocol!=="https:" || url.username || url.password) throw new Error("HTTPS image required");
  } catch (_) { toast("Enter an HTTPS image URL.");return; }
  if (!state.mapLoaded) { toast("Wait for the map to load.");return; }
  button.disabled=true;
  try {
    const image=new Image();
    image.crossOrigin="anonymous";
    image.src=url.href;
    await image.decode();
    if (!state.mapLoaded) { toast("Wait for the map to load.");return; }
    applyImageOverlay(url.href);
    toast("Image overlay added");
  } catch (_) { toast("The image overlay could not be loaded."); }
  finally { button.disabled=false; }
});
$("pcImageOpacity")?.addEventListener("input",e=>{
  if(!state.map||!state.mapLoaded)return;
  try{if(state.map.getLayer(state.pcImageLayerId))state.map.setPaintProperty(state.pcImageLayerId,"raster-opacity",Number(e.target.value||70)/100)}catch(_){}
});
$("btnPcClearImage")?.addEventListener("click",()=>{
  removeImageOverlay(true);
  if($("pcImageLayerUrl"))$("pcImageLayerUrl").value="";
  toast("Image overlay cleared");
});

/* Mouse, touch and keyboard share one microphone hold. */
let holdInput=null;
function beginHold(event, input) {
  if (holdInput || !canTransmit()) return;
  event.preventDefault();
  event.stopPropagation();
  holdInput=input;
  void startPtt();
}
function endHold(input=holdInput) {
  if (input!==holdInput) return;
  holdInput=null;
  void stopPtt();
}
function bindPtt(button) {
  if (!button) return;
  for (const type of ["contextmenu","selectstart","dragstart"]) {
    button.addEventListener(type,event=>event.preventDefault());
  }
  button.draggable=false;
  if (window.PointerEvent) {
    button.addEventListener("pointerdown",event=>{
      if (event.button!==0 || !event.isPrimary) return;
      beginHold(event,"pointer:"+event.pointerId);
      try { button.setPointerCapture(event.pointerId); } catch (_) {}
    });
    button.addEventListener("lostpointercapture",event=>endHold("pointer:"+event.pointerId));
  } else {
    button.addEventListener("touchstart",event=>beginHold(event,"touch"),{passive:false});
    button.addEventListener("mousedown",event=>{if(event.button===0)beginHold(event,"mouse");});
  }
  button.addEventListener("keydown",event=>{
    if (!event.repeat && ["Space","Enter"].includes(event.code)) beginHold(event,event.code);
  });
}
for (const type of ["pointerup","pointercancel"]) {
  window.addEventListener(type,event=>endHold("pointer:"+event.pointerId));
}
window.addEventListener("mouseup",()=>endHold("mouse"));
for (const type of ["touchend","touchcancel"]) window.addEventListener(type,()=>endHold("touch"));
window.addEventListener("keydown",event=>{
  if (state.mode!=="desktop" || event.code!=="Space" || event.repeat || event.defaultPrevented) return;
  const target=event.target;
  if (target.closest?.("button,input,textarea,select,a,summary,[contenteditable]")) return;
  beginHold(event,event.code);
});
window.addEventListener("keyup",event=>endHold(event.code));
["mPtt","dPtt"].forEach(id=>bindPtt($(id)));
window.document.addEventListener("pointerdown",resumeVoicePlayback,{passive:true});
window.document.addEventListener("touchstart",resumeVoicePlayback,{passive:true});

/* A three-second press requests assistance for the selected group. */
let emergencyTimer=null,emergencyRaf=null;
function cancelEmergencyHold() {
  clearTimeout(emergencyTimer);
  cancelAnimationFrame(emergencyRaf);
  emergencyTimer=null;
  emergencyRaf=null;
  const fill=$("emergencyHoldFill");
  if(fill)fill.style.height="0%";
  text("emergencyTileLabel","Emergency");
}
function showEmergencyNotice(message) {
  text("emergencyText",message);
  $("emergencyOverlay")?.classList.add("active");
  navigator.vibrate?.([80,40,80]);
  setTimeout(()=>$("emergencyOverlay")?.classList.remove("active"),2500);
}
{
  const emergency=$("btnEmergency");
  const begin=event=>{
    if (event.type==="pointerdown" && event.button!==0) return;
    event.preventDefault();
    if (!gid() || state.isOfflineManual) { toast("Go online in a group to send an emergency alert.");return; }
    if (state.emergencyRequest || emergencyTimer!==null) return;
    const start=Date.now(), epoch=state.connectionEpoch;
    const step=()=>{
      const elapsed=Date.now()-start;
      $("emergencyHoldFill").style.height=Math.min(100,elapsed/30)+"%";
      text("emergencyTileLabel",`Hold ${Math.max(1,Math.ceil((3000-elapsed)/1000))}s…`);
      emergencyRaf=requestAnimationFrame(step);
    };
    emergencyRaf=requestAnimationFrame(step);
    emergencyTimer=setTimeout(()=>{
      cancelEmergencyHold();
      if (!connectionCurrent(epoch)) return;
      state.emergencyRequest=sendPtt("EMERGENCY",{priority:"critical"});
      text("emergencyTileLabel","Sending…");
    },3000);
  };
  for (const type of ["contextmenu","selectstart","dragstart"]) emergency.addEventListener(type,event=>event.preventDefault());
  if (window.PointerEvent) {
    emergency.addEventListener("pointerdown",begin);
    for (const type of ["pointerup","pointercancel","pointerleave"]) emergency.addEventListener(type,cancelEmergencyHold);
  } else {
    emergency.addEventListener("touchstart",begin,{passive:false});
    emergency.addEventListener("mousedown",begin);
    for (const type of ["touchend","mouseup","touchcancel"]) window.addEventListener(type,cancelEmergencyHold);
  }
  emergency.addEventListener("keydown",event=>{
    if (!event.repeat && ["Space","Enter"].includes(event.code)) begin(event);
  });
  emergency.addEventListener("keyup",cancelEmergencyHold);
  emergency.addEventListener("blur",cancelEmergencyHold);
}
function releaseControls() {
  endHold();
  cancelEmergencyHold();
}
window.addEventListener("blur",releaseControls);
window.document.addEventListener("visibilitychange",()=>{if(window.document.hidden)releaseControls();});
window.addEventListener("pagehide",()=>{
  releaseControls();
  state.isOfflineManual=true;
  stopMapRefresh();
  endGroupSession();
});

/* =========================================================
   INIT (INITIALIZES SPLITTERS, VIEWPORT & SIGNALS GT_READY)
   ========================================================= */
function init(){
  try{
    initSplitters();
    decide();
    renderTicketCategories();
    setRealtimeStatus("offline","Offline");
    syncAppViewport();
    post("GT_READY",{wantsInit:true,realtimeProvider:"SUPABASE_REALTIME",voiceProvider:"LIVEKIT",audioAlwaysOn:true});
  }catch(err){
    console.error("SKANDI GroupTalk init error:",err);
  }
}
if(window.document.readyState==="loading"){
  window.document.addEventListener("DOMContentLoaded",init,{once:true});
}else{
  init();
}
