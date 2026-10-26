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
