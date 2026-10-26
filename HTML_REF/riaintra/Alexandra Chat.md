# SKANDI ALEXANDRA — V12.7 SITEWIDE ALEXANDRA GLOBAL CHAT

## INFO / LOG
- Wix site: SKANDI TRAVELS, Wix Studio.
- System: customer-facing SKANDI only. Exclude staff/ALTEA/RIA INTRA pages.
- Wix site-master HTML Component: `#skandiAlexandraGlobalEmbed` (integrated launcher and chat panel; keep on customer SKANDI pages and exclude `/riaintra`/internal routes).
- Runtime source: `skandi-embeds/global/alexandra/skandi-alexandra-chat.html` with extracted `.css` and `.js`; regenerate from this complete HTML_REF source.
- Required site Velo host: current `src/pages/masterPage.js` invoking `src/public/alexandraGlobalBridge.js` (masterPage.js binding now provided from the user-supplied 2026-10-21 Wix source, preserving newer custom logo assets).
- Purpose: Sitewide integrated launcher and customer-support chat for public SKANDI routes. The site master keeps the widget off RIAINTRA and other internal/ALTEA routes.
- Message source: `SKANDI_SUPPORT_CHAT` for panel; `SKANDI_ALEXANDRA_LAUNCHER` for launcher; parent replies source `SKANDI_WIX_PARENT`.
- Canonical backend: `backend/SKANDI_CORE/customerSupport.web.js` → `customerSupport.js` → `livekitServer.js` for Alexandra LiveKit dispatch; existing customer-support bootstrap, case creation, human handoff, and live message facade methods. The retained Wix AI facade remains owned by `/about/support`; no duplicate database or provider.
- Canonical support cases: existing customer_support_cases / customer_support_messages.
- Persistence: The integrated widget keeps transcript state in iframe memory. The bridge does not store LiveKit room credentials, tokens or dispatches; its retained mobile/legacy transcript cache uses Wix `session` storage and resets on member changes.
- Security: never pass customer bookings/private notes into AI context; members' support cases remain under auth/ownership checks.
- Staff routes, payment credentials and internal content must never be sent to AI.
- Verification: source-level contracts, imports/exports, route filters, HTML sidecar reconstruction and JavaScript syntax are statically checked; Wix Studio sitewide placement, LiveKit dispatch and customer-support actions REQUIRES LIVE TEST.
- Current Alexandra provider: `backend/SKANDI_CORE/customerSupport.web.js` → `customerSupport.js` → `livekitServer.js` (`alexandra-prod` agent dispatch); the integrated widget receives short-lived room credentials through `src/public/alexandraGlobalBridge.js`, publishes on `lk.chat` and subscribes on the returned `transcriptionTopic` (`lk.transcription`). Human handoff and member messages use the existing site-member-protected facade methods. No LiveKit credentials or tokens are stored in browser session.
- Active presentation: the current integrated launcher/chat source is the complete site-owner upload from 2026-10-26; older separate chat and launcher sources are retained as historical/legacy references.

## CHANGE LOG
- 2026-10-21 V12.7: new public sitewide global component prepared; dark-navy SKANDI branding, fixed bottom-left pin location by Wix Studio setup, minimization, browser-tab conversation state, canonical Customer Service case creation, WhatsApp +1 711-216-0382 and call +1 951-620-7875. WhatsApp supplied number is an invalid +1 N11 area code; link held pending a valid Meta-registered number.
- 2026-10-21 V12.7 master-source convergence: compared the complete user-provided 1059-line Wix masterPage.js, installed bridge bootstrapping and live route/identity handling without reverting branded Supabase logos, preserved canonical Customer Service case creation. WhatsApp contact remains disabled until valid Meta Business number; voice phone +1 951-620-7875 retained. STATICALLY VERIFIED; REQUIRES LIVE TEST.
- 2026-10-22 V12 LiveKit Alexandra restoration: Added a separate frontend-callable LiveKit session method for sitewide Alexandra (retaining the existing Wix AI method for `/about/support`), and changed only desktop/mobile chat transport: Wix AI reply method is no longer called from the sitewide Alexandra bridge; existing `alexandra-prod` LiveKit worker receives `lk.chat`, produces `lk.transcription`; signed tokens are ephemeral, and a new room is dispatched on reopening. Existing case, profile, contact and navigation contracts remain. STATICALLY VERIFIED, REQUIRES LIVE TEST on published Wix and active LiveKit Cloud worker.


- 2026-10-26 V12 integrated-widget and sitewide bridge repair: Replaced the active HTML payload with the single integrated launcher/chat widget supplied by the site owner, split losslessly into the mapped runtime HTML/CSS/JS files, aligned its LiveKit client at 2.23.0, and corrected inbound response subscription to the backend-issued `lk.transcription` topic while publishing traveler messages on `lk.chat`. The Wix bridge accepts the integrated READY handshake without requiring the obsolete separate launcher, supplies canonical customer-support bootstrap data, starts the existing Alexandra LiveKit dispatch, routes case creation/human handoff/live support messages through existing facade exports, and closes/disconnects/clears the widget on restricted staff/internal routes. Guest case forms collect required name/email; signed-in profile details prefill those fields. `/my-profile` is the member-support destination. STATICALLY VERIFIED; REQUIRES LIVE TEST on published Wix, active LiveKit worker, and live customer-support permissions.
## COMPLETE HTML SOURCE

```html
<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,interactive-widget=resizes-content">
<title>SKANDI Support Chat</title>
<style>
:root{--navy:#022e64;--teal:#5fc7cf;--ink:#111827;--muted:#687386;--line:#dfe5ef;--soft:#f5f7fa;--white:#fff;--green:#14805e;--red:#b42318;--vvh:100dvh;--safe-bottom:env(safe-area-inset-bottom,0px)}
*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden;font:14px/1.45 Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:var(--ink);background:transparent}button,input,textarea,select{font:inherit}button{cursor:pointer}.host{position:relative;width:100%;height:100%;pointer-events:none}.launcher{pointer-events:auto;position:absolute;right:18px;bottom:max(18px,var(--safe-bottom));width:58px;height:58px;border:0;border-radius:50%;background:var(--navy);color:#fff;box-shadow:0 14px 34px #022e6440;font-size:24px;display:grid;place-items:center}.panel{pointer-events:auto;position:absolute;right:18px;bottom:max(18px,var(--safe-bottom));width:min(420px,calc(100vw - 36px));height:min(700px,calc(var(--vvh) - 36px));background:#fff;border:1px solid var(--line);border-radius:20px;box-shadow:0 28px 80px #022e6433;display:none;overflow:hidden}.panel.open{display:grid}.chat-shell{height:100%;min-height:0;display:grid;grid-template-rows:auto minmax(0,1fr) auto;background:#fff}.head{background:var(--navy);color:#fff;padding:12px 14px;display:flex;align-items:center;gap:10px}.avatar-wrap{width:44px;height:44px;border-radius:50%;overflow:hidden;background:#eaf2fb;display:grid;place-items:center;flex:0 0 44px;border:2px solid #ffffff66}.avatar-wrap video{width:100%;height:100%;object-fit:cover;display:none}.avatar-fallback{font-weight:900;color:var(--navy);font-size:17px}.who{min-width:0;flex:1}.who b,.who small{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.who small{font-size:11px;color:#d7e6fa}.presence{display:inline-flex;align-items:center;gap:5px;font-size:10px;margin-top:2px}.dot{width:7px;height:7px;border-radius:50%;background:#55d69d}.head-btn{width:34px;height:34px;border:0;border-radius:8px;background:#ffffff16;color:#fff;font-size:20px}.messages{min-height:0;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;background:linear-gradient(#f8fafc,#fff);padding:16px 12px 20px;display:flex;flex-direction:column;gap:10px}.msg{max-width:84%;padding:10px 12px;border-radius:14px;white-space:pre-wrap;word-break:break-word;box-shadow:0 1px 2px #0000000c}.msg.remote{align-self:flex-start;background:#fff;border:1px solid var(--line);border-top-left-radius:5px}.msg.mine{align-self:flex-end;background:#e8f1fb;color:#082b52;border-top-right-radius:5px}.msg.system{align-self:center;max-width:94%;background:#eef7f7;color:#31575a;font-size:12px;text-align:center;box-shadow:none}.msg strong{display:block;font-size:11px;margin-bottom:3px;color:var(--navy)}.typing{align-self:flex-start;border:1px solid var(--line);background:#fff;border-radius:14px;padding:9px 12px;color:var(--muted);font-size:12px}.composer{border-top:1px solid var(--line);background:#fff;padding:9px 10px calc(9px + var(--safe-bottom));display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:8px;align-items:end}.composer textarea{min-width:0;min-height:42px;max-height:112px;resize:none;border:1px solid #cbd5e1;border-radius:18px;padding:10px 12px;outline:none;background:#fafbfd}.composer textarea:focus{border-color:var(--teal);box-shadow:0 0 0 3px #5fc7cf28}.circle{width:42px;height:42px;border:0;border-radius:50%;display:grid;place-items:center}.tool{background:#edf2f7;color:var(--navy)}.send{background:var(--navy);color:#fff;font-weight:900}.send:disabled,.circle:disabled{opacity:.45;cursor:not-allowed}.sheet{position:absolute;inset:0;background:#fff;z-index:20;display:none;grid-template-rows:auto minmax(0,1fr) auto}.sheet.open{display:grid}.sheet-head{padding:14px;border-bottom:1px solid var(--line);display:flex;align-items:center;gap:10px}.sheet-head h2{font-size:16px;margin:0;flex:1;color:var(--navy)}.sheet-body{overflow:auto;padding:14px;overscroll-behavior:contain}.field{display:grid;gap:6px;margin-bottom:13px}.field label{font-size:10px;text-transform:uppercase;letter-spacing:.08em;font-weight:800;color:var(--muted)}.field input,.field select,.field textarea{width:100%;border:1px solid var(--line);border-radius:9px;padding:10px;background:#fafbfc}.field textarea{min-height:100px;resize:vertical}.sheet-foot{border-top:1px solid var(--line);padding:10px 12px calc(10px + var(--safe-bottom));display:flex;gap:8px}.btn{min-height:42px;border:1px solid var(--line);border-radius:10px;background:#fff;padding:0 14px;font-weight:800}.btn.primary{background:var(--navy);border-color:var(--navy);color:#fff;flex:1}.notice{padding:9px 10px;border-radius:8px;background:#fff7ed;color:#9a3412;font-size:11px;line-height:1.5;margin-bottom:12px}.hidden{display:none!important}
@media(max-width:699px){.host{height:var(--vvh)}.launcher{right:14px;bottom:max(14px,var(--safe-bottom))}.panel,.panel.open{position:fixed;inset:0;width:100vw;height:var(--vvh);max-width:none;max-height:none;border:0;border-radius:0;box-shadow:none}.head{padding-top:max(10px,env(safe-area-inset-top,0px))}.messages{padding-bottom:18px}.composer{position:relative}.panel:not(.open){display:none}}
</style>
</head>
<body>
<div class="host">
  <button class="launcher" id="launcher" type="button" aria-label="Open SKANDI Support">💬</button>
  <section class="panel" id="panel" aria-label="SKANDI Support chat">
    <div class="chat-shell">
      <header class="head">
        <button class="head-btn hidden" id="backBtn" type="button" aria-label="Back">‹</button>
        <div class="avatar-wrap" data-asset-key="alexandra-support-avatar"><video id="avatarVideo" muted="" loop="" autoplay="" playsinline="" preload="metadata"></video><span class="avatar-fallback" id="avatarFallback">A</span></div>
        <div class="who"><b id="agentName">Alexandra</b><small id="agentRole">Digital Customer Service Agent</small><span class="presence"><i class="dot"></i><span id="presenceText">Online</span></span></div>
        <button class="head-btn" id="humanBtn" type="button" title="Human Customer Service">♙</button>
        <button class="head-btn" id="closeBtn" type="button" aria-label="Close">×</button>
      </header>
      <main class="messages" id="messages" aria-live="polite"><div class="msg system">To start human live chat directly, sign in to your SKANDI account. Alexandra can still collect your contact details and transfer the conversation to Customer Service when needed.</div><div class="msg mine"><strong>You</strong>Hi</div><div class="msg system">Connecting to Alexandra…</div></main>
      <footer class="composer">
        <button class="circle tool" id="formBtn" type="button" title="Support form">＋</button>
        <textarea id="input" rows="1" placeholder="Type a message…" enterkeyhint="send" style="height: 40px;"></textarea>
        <button class="circle send" id="sendBtn" type="button" aria-label="Send">➤</button>
      </footer>
    </div>
    <section class="sheet" id="formSheet">
      <header class="sheet-head"><button class="btn" id="formClose" type="button">Back</button><h2>Support request</h2></header>
      <div class="sheet-body">
        <div id="formNotice" class="notice hidden"></div>
        <div class="field"><label for="contactName">Full name</label><input id="contactName" maxlength="200" autocomplete="name" required></div>
        <div class="field"><label for="contactEmail">Email</label><input id="contactEmail" type="email" maxlength="254" autocomplete="email" required></div>
        <div class="field"><label>Category</label><select id="category"><option value="general">General Support</option></select></div>
        <div class="field"><label>Topic</label><select id="topic"><option value="general-question">General Question</option></select></div>
        <div class="field"><label>Booking reference / PNR</label><input id="bookingRef" maxlength="80" placeholder="Optional"></div>
        <div class="field"><label>Subject</label><input id="subject" maxlength="240" required="" placeholder="What do you need help with?"></div>
        <div id="baggageFields" class="hidden">
          <div class="field"><label>Have you already filed a PIR?</label><select id="hasPir"><option value="">Select</option><option value="yes">Yes</option><option value="no">No</option></select></div>
          <div class="field hidden" id="pirWrap"><label>PIR number</label><input id="pirNumber" maxlength="80"></div>
          <div class="field"><label>Baggage tag</label><input id="bagTag" maxlength="80"></div>
          <div class="field"><label>Baggage type</label><input id="bagType" maxlength="120"></div>
          <div class="field"><label>Color</label><input id="bagColor" maxlength="120"></div>
          <div class="field"><label>Brand / distinguishing features</label><input id="bagBrand" maxlength="300"></div>
        </div>
        <div class="field"><label>Description</label><textarea id="description" required="" placeholder="Describe what happened or what you need."></textarea></div>
      </div>
      <footer class="sheet-foot"><button class="btn primary" id="submitForm" type="button">Submit request</button></footer>
    </section>
  </section>
</div>
<script src="https://cdn.jsdelivr.net/npm/livekit-client@2.23.0/dist/livekit-client.umd.min.js"></script>
<script>
(() => {
  "use strict";
  const SOURCE="SKANDI_SUPPORT_CHAT",PARENT="SKANDI_WIX_PARENT",ALEX_TOPIC="lk.chat",HUMAN_TOPIC="skandi.support.chat";
  const $=id=>document.getElementById(id);let boot={},mode="ALEXANDRA",caseId="",alexRoom=null,humanRoom=null,alexSession=null,humanSession=null,transcript=[],connected=false,loggedIn=false,avatarCfg={},roomEpoch=0,bootstrapReceived=false,hostBlocked=false;
  const clean=(v,n=30000)=>String(v??"").trim().slice(0,n);const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  function post(type,payload={}){window.parent.postMessage({source:SOURCE,type,requestId:`${Date.now()}-${Math.random().toString(36).slice(2,8)}`,payload},"*")}
  function setViewport(){const h=window.visualViewport?.height||window.innerHeight||document.documentElement.clientHeight;document.documentElement.style.setProperty("--vvh",`${Math.round(h)}px`)}
  setViewport();window.addEventListener("resize",setViewport);window.visualViewport?.addEventListener("resize",setViewport);window.visualViewport?.addEventListener("scroll",setViewport);
  function openPanel(){ $("panel").classList.add("open");$("launcher").classList.add("hidden");setViewport();setTimeout(()=>$("input").focus(),80)}
  function closePanel(){ $("panel").classList.remove("open");$("launcher").classList.remove("hidden");$("input").blur() }
  function disconnectRooms(){
    roomEpoch++;
    const rooms=[alexRoom,humanRoom].filter(Boolean);
    alexRoom=null;humanRoom=null;alexSession=null;humanSession=null;connected=false;
    for(const room of rooms){try{Promise.resolve(room.disconnect()).catch(()=>{})}catch(_){}}
  }
  function forceClose(){
    hostBlocked=true;disconnectRooms();caseId="";transcript=[];loggedIn=false;boot={};avatarCfg={};
    $("messages").replaceChildren();$("input").value="";$("input").disabled=false;$("sendBtn").disabled=false;
    $("formSheet").classList.remove("open");$("subject").value="";$("description").value="";
    $("contactName").value="";$("contactEmail").value="";$("humanBtn").title="Sign in for human chat";setMode("ALEXANDRA");closePanel();
  }
  function scrollBottom(){requestAnimationFrame(()=>{$("messages").scrollTop=$("messages").scrollHeight})}
  function message(kind,text,name=""){text=clean(text);if(!text)return;const n=document.createElement("div");n.className=`msg ${kind}`;n.innerHTML=(name?`<strong>${esc(name)}</strong>`:"")+esc(text);$("messages").appendChild(n);scrollBottom();if(kind!=="system")transcript.push({role:kind==="mine"?"customer":mode==="ALEXANDRA"?"alexandra":"human-agent",text,at:new Date().toISOString()})}
  function system(text){message("system",text)}
  function setMode(next){mode=next;const human=next==="HUMAN";$("agentName").textContent=human?"SKANDI Customer Service":"Alexandra";$("agentRole").textContent=human?"Human SKANDI Customer Service Agent":"Digital Customer Service Agent";$("avatarFallback").textContent=human?"S":"A";if(human){$("avatarVideo").pause?.();$("avatarVideo").style.display="none";$("avatarFallback").style.display="inline"}else{setupAvatar(avatarCfg)}$("presenceText").textContent=next==="HANDOFF_PENDING"?"Connecting…":"Online";$("humanBtn").classList.toggle("hidden",human);$("input").disabled=next==="HANDOFF_PENDING";$("sendBtn").disabled=next==="HANDOFF_PENDING"}
  function setupAvatar(cfg={}){avatarCfg=cfg||{};const video=$("avatarVideo"),url=clean(cfg.avatarVideoUrl,2000);if(!url){video.removeAttribute("src");video.style.display="none";$("avatarFallback").style.display="inline";return}video.src=url;video.defaultPlaybackRate=0.75;const apply=()=>{video.playbackRate=0.75;video.muted=true;video.loop=true;video.playsInline=true;video.style.display="block";$("avatarFallback").style.display="none";video.play().catch(()=>{})};video.onloadedmetadata=apply;video.oncanplay=apply}
  function applyBoot(p={}){boot=p||{};loggedIn=Boolean(p.loggedIn||p.profile?.loggedIn||p.profile?.memberId);setupAvatar(boot.alexandra||{});$("humanBtn").title=loggedIn?"Human Customer Service":"Sign in for human chat";const profile=boot.profile||{};if(!$("contactName").value)$("contactName").value=clean(profile.displayName||[profile.firstName,profile.lastName].filter(Boolean).join(" "),200);if(!$("contactEmail").value)$("contactEmail").value=clean(profile.email,254);const list=Array.isArray(boot.workflows)?boot.workflows:[];$("category").innerHTML=list.map(w=>`<option value="${esc(w.key)}">${esc(w.title||w.key)}</option>`).join("")||'<option value="general">General Support</option>';updateTopics()}
  function workflow(){return (boot.workflows||[]).find(w=>w.key===$("category").value)||null}
  function updateTopics(){const w=workflow();$("topic").innerHTML=(w?.topics||[{key:"general-question",title:"General Question"}]).map(t=>`<option value="${esc(t.key)}">${esc(t.title||t.key)}</option>`).join("");$("baggageFields").classList.toggle("hidden",$("category").value!=="baggage");updatePir()}
  function updatePir(){const yes=$("hasPir").value==="yes",no=$("hasPir").value==="no";$("pirWrap").classList.toggle("hidden",!yes);const w=workflow();$("formNotice").textContent=no?(w?.guidance?.noPir||"A SKANDI support case does not replace the formal baggage report/PIR required by the operating airline or airport baggage service."):"";$("formNotice").classList.toggle("hidden",!no)}
  async function connectAlex(s){
    if(!s?.url||!s?.token||!window.LivekitClient)return;
    const epoch=++roomEpoch,previous=[alexRoom,humanRoom].filter(Boolean);
    alexRoom=null;humanRoom=null;alexSession=s;humanSession=null;connected=false;
    for(const room of previous){try{await room.disconnect()}catch(_){}}
    if(epoch!==roomEpoch)return;
    const sdk=window.LivekitClient,r=new sdk.Room({adaptiveStream:true,dynacast:true});
    r.registerTextStreamHandler(s.transcriptionTopic||"lk.transcription",async(reader,p)=>{
      if(p?.identity===r.localParticipant?.identity)return;
      try{const text=await reader.readAll();if(epoch===roomEpoch&&r===alexRoom)message("remote",text,"Alexandra")}catch(_){}
    });
    r.on(sdk.RoomEvent.TrackSubscribed,track=>{if(track.kind==="audio"){const el=track.attach();el.autoplay=true;document.body.appendChild(el)}});
    r.on(sdk.RoomEvent.Disconnected,()=>{if(epoch===roomEpoch){connected=false;system("Alexandra disconnected. Reopen the chat to reconnect.")}});
    r.registerRpcMethod("open_support_form",async(data)=>{let parsed={};try{parsed=JSON.parse(data?.payload||"{}")}catch(_){}openForm(parsed);return JSON.stringify({ok:true})});
    r.registerRpcMethod("start_human_chat",async(data)=>{let parsed={};try{parsed=JSON.parse(data?.payload||"{}")}catch(_){}await startHuman(parsed);return JSON.stringify({ok:true})});
    try{await r.connect(s.url,s.token)}catch(error){if(epoch===roomEpoch)system("Alexandra could not connect. Please try again.");return}
    if(epoch!==roomEpoch){try{await r.disconnect()}catch(_){}return}
    alexRoom=r;connected=true;setMode("ALEXANDRA");
  }
  async function connectHuman(s){
    if(!s?.url||!s?.token||!window.LivekitClient)return;
    const epoch=++roomEpoch,previous=[alexRoom,humanRoom].filter(Boolean);
    alexRoom=null;humanRoom=null;alexSession=null;humanSession=s;connected=false;
    for(const room of previous){try{await room.disconnect()}catch(_){}}
    if(epoch!==roomEpoch)return;
    const sdk=window.LivekitClient,r=new sdk.Room({adaptiveStream:true,dynacast:true});
    r.registerTextStreamHandler(s.textTopic||HUMAN_TOPIC,async(reader,p)=>{
      if(p?.identity===r.localParticipant?.identity)return;
      try{const text=await reader.readAll();if(epoch===roomEpoch&&r===humanRoom)message("remote",text,"SKANDI Customer Service")}catch(_){}
    });
    r.on(sdk.RoomEvent.TrackSubscribed,track=>{if(track.kind==="audio"){const el=track.attach();el.autoplay=true;document.body.appendChild(el)}});
    r.on(sdk.RoomEvent.Disconnected,()=>{if(epoch===roomEpoch){connected=false;system("Customer Service chat disconnected. You can continue through your case.")}});
    try{await r.connect(s.url,s.token)}catch(error){if(epoch===roomEpoch)system("Customer Service chat could not connect. Your request remains in the queue.");return}
    if(epoch!==roomEpoch){try{await r.disconnect()}catch(_){}return}
    humanRoom=r;connected=true;setMode("HUMAN");
  }
  async function send(){const text=clean($("input").value);if(!text)return;$("input").value="";message("mine",text,"You");if(mode==="ALEXANDRA"){if(!alexRoom||alexRoom.state!=="connected"){system("Connecting to Alexandra…");post("SUPPORT_CHAT_START_ALEXANDRA");return}await alexRoom.localParticipant.sendText(text,{topic:alexSession?.textTopic||ALEX_TOPIC})}else if(mode==="HUMAN"){if(!caseId){system("No support case is connected yet.");return}$("sendBtn").disabled=true;post("SUPPORT_CHAT_HUMAN_MESSAGE",{caseId,content:text})}}
  async function startHuman(extra={}){
    if(extra?.caseId&&extra?.livekitSession){caseId=String(extra.caseId);setMode("HANDOFF_PENDING");system(extra.message||"Connecting you with a Human SKANDI Customer Service Agent. Your existing context will be passed along.");try{if(alexRoom)await alexRoom.disconnect()}catch(_){}alexRoom=null;connected=false;await connectHuman(extra.livekitSession);system("A Human SKANDI Customer Service Agent can now join this conversation.");return}
    if(extra?.status==="queued"&&extra?.caseId){caseId=String(extra.caseId);setMode("HUMAN");$("input").disabled=true;$("sendBtn").disabled=true;system(extra.message||"Your request is in the Customer Service queue.");return}
    if(!loggedIn){system("To start human live chat directly, sign in to your SKANDI account. Alexandra can still collect your contact details and transfer the conversation to Customer Service when needed.");return}
    setMode("HANDOFF_PENDING");system("Connecting you with a Human SKANDI Customer Service Agent. Your existing context will be passed along.");post("SUPPORT_CHAT_START_HUMAN",{caseId,reason:extra.reason||"Customer requested a human agent.",summary:extra.summary||"",transcript:transcript.slice(-60)})
  }
  function openForm(prefill={}){$("formSheet").classList.add("open");if(prefill.category){$("category").value=prefill.category;updateTopics()}if(prefill.subject)$("subject").value=prefill.subject;if(prefill.message)$("description").value=prefill.message}
  function formPayload(){const fullName=clean($("contactName").value,200),parts=fullName.split(/\s+/);return{firstName:parts[0]||"",lastName:parts.slice(1).join(" "),fullName,email:clean($("contactEmail").value,254),category:$("category").value,subCategory:$("topic").value,bookingRef:clean($("bookingRef").value,80),pnr:clean($("bookingRef").value,80),subject:clean($("subject").value,240),message:clean($("description").value,12000),hasPir:$("hasPir").value,pirNumber:clean($("pirNumber").value,80),bagTag:clean($("bagTag").value,80),bagType:clean($("bagType").value,120),bagColor:clean($("bagColor").value,120),bagBrand:clean($("bagBrand").value,300),source:"support-chat-form",sourcePage:"/about/support"}}
  $("launcher").onclick=()=>{openPanel();if(boot.defaultMode==="HUMAN"){startHuman().catch(()=>{})}else if(!connected)post("SUPPORT_CHAT_START_ALEXANDRA")};$("closeBtn").onclick=closePanel;$("humanBtn").onclick=()=>{startHuman().catch(()=>{})};$("sendBtn").onclick=()=>send().catch(e=>system(e.message||"Message failed."));$("input").onkeydown=e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send().catch(()=>{})}};$("input").oninput=e=>{e.target.style.height="42px";e.target.style.height=Math.min(e.target.scrollHeight,112)+"px"};$("formBtn").onclick=()=>openForm();$("formClose").onclick=()=>$("formSheet").classList.remove("open");$("category").onchange=updateTopics;$("hasPir").onchange=updatePir;$("submitForm").onclick=()=>{const p=formPayload();if(!p.fullName||!p.email){$("formNotice").textContent="Enter your name and email so Customer Service can reply.";$("formNotice").classList.remove("hidden");return}if(!p.subject||!p.message){$("formNotice").textContent="Subject and description are required.";$("formNotice").classList.remove("hidden");return}post("SUPPORT_CHAT_SUBMIT_FORM",{input:p})};
  window.addEventListener("message",async e=>{const m=e.data||{};if(m.source!==PARENT)return;const p=m.payload||{};if(m.type==="SUPPORT_CHAT_FORCE_CLOSE"){forceClose();return}if(m.type==="SUPPORT_CHAT_BOOTSTRAP"){bootstrapReceived=true;hostBlocked=false;applyBoot(p)}if(m.type==="SUPPORT_CHAT_OPEN"){openPanel();if(p.mode==="FORM"){openForm(p.formPrefill||{});return}if(p.mode==="HANDOFF_PENDING"){setMode("HANDOFF_PENDING");return}if(p.alexandraSession){await connectAlex(p.alexandraSession);if(!transcript.length)system("Hi, I’m Alexandra. How can I help you today?")}}if(m.type==="SUPPORT_CHAT_HUMAN_HANDOFF"){caseId=String(p.caseId||caseId);if(alexRoom){try{await alexRoom.disconnect()}catch(_){}alexRoom=null}connected=false;if(p.status==="live"&&p.livekitSession){await connectHuman(p.livekitSession);system("A Human SKANDI Customer Service Agent can now join this conversation.")}else{setMode("HUMAN");$("input").disabled=true;$("sendBtn").disabled=true;system(p.message||"Your request is in the Customer Service queue.")}}if(m.type==="SUPPORT_CHAT_HUMAN_MESSAGE_SAVED"){$("sendBtn").disabled=false;const s=p.livekitSession||humanSession;if(s){if(!humanRoom||humanRoom.state!=="connected")await connectHuman(s);const text=clean(p.sentMessage?.content||p.sentMessage?.body);if(text)await humanRoom.localParticipant.sendText(text,{topic:s.textTopic||HUMAN_TOPIC,attributes:{caseId:String(p.caseId||caseId),messageId:String(p.sentMessage?.messageId||p.sentMessage?.id||""),senderType:"customer"}})}}if(m.type==="SUPPORT_CHAT_CASE_CREATED"){caseId=String(p.caseId||caseId);$("formSheet").classList.remove("open");system(`Support request ${p.caseRef||""} was created.`)}if(m.type==="SUPPORT_CHAT_ERROR"){setMode(mode==="HANDOFF_PENDING"?"ALEXANDRA":mode);system(p.message||"Support action failed.")}});
  const signalReady=()=>{if(!bootstrapReceived&&!hostBlocked)post("SUPPORT_CHAT_READY",{integrated:true,page:window.location.pathname})};
  signalReady();setTimeout(signalReady,900);setTimeout(signalReady,2600);
})();
</script>


</body></html>
```
