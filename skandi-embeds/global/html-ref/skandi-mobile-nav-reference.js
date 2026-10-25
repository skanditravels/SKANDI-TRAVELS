
(function(){
  "use strict";
  const SOURCE="SKANDI_HOME_MOBILE_APP",PARENT="SKANDI_WIX_PARENT";
  const $=id=>document.getElementById(id);
  const defaultRoutes=Object.freeze({home:"/",destinations:"/destinations",travelInfo:"/travel-info",myTrips:"/my-profile?tab=trips",myProfile:"/my-profile",flights:"/flights",hotels:"/hotels",packages:"/packages",cruises:"/cruises",carRental:"/car-rental",tours:"/tours",offers:"/offers",support:"/about/support"});
  const state={routes:{...defaultRoutes},busy:false,refreshId:"",ready:false,feedbackTimer:null,request:0,drawerOpen:false,drawerRequestId:"",drawerTimer:null,currentPath:"/"};
  const status=document.getElementById("status"),statusCopy=document.getElementById("status-copy");
  const nav=document.getElementById("app-nav"),refresh=document.getElementById("refresh");
  const drawerLayer=document.getElementById("drawer-layer"),drawer=document.getElementById("app-drawer"),menuButton=document.getElementById("nav-menu");
  const chat=$("alexandra-chat-view"),chatStatus=$("alexandra-status"),chatMessages=$("alexandra-messages"),chatQuestion=$("alexandra-question");
  const chatState={sessionId:"",messages:[],history:[],pending:false,casePending:false,requestId:"",responseTimer:null,caseTimer:null,loggedIn:false,connected:false,responseSeen:false};
  let liveRoom=null,liveEpoch=0,liveConnecting=null;
  function nextId(kind){state.request+=1;return kind+"-"+Date.now()+"-"+state.request;}
  function post(type,payload={},requestId=""){
    const message={source:SOURCE,type,payload,timestamp:new Date().toISOString()};
    if(requestId)message.requestId=requestId;
    window.parent.postMessage(message,"*");
  }
  function route(key){const value=String(state.routes[key]||defaultRoutes[key]||"");return value.startsWith("/")&&!value.startsWith("//")?value:"";}
  // Same wire contract and service ownership as Alexandra's existing desktop chat.
  function postChat(type,payload={}){
    window.parent.postMessage({source:"SKANDI_SUPPORT_CHAT",type,requestId:payload.requestId||"",payload},"*");
  }
  function chatNotice(message,bad=false){chatStatus.textContent=String(message||"");chatStatus.classList.toggle("error",bad);}
  function chatBusy(value){chatState.pending=value;$("alexandra-send").disabled=value||!chatState.connected;chatQuestion.disabled=value||!chatState.connected;}
  function chatSay(role,message,save=true){
    const content=String(message||"").slice(0,1900);if(!content)return;
    const bubble=document.createElement("div");bubble.className="alexandra-bubble"+(role==="user"?" customer":"");
    const from=document.createElement("small");from.textContent=role==="user"?"You":"Alexandra";
    const body=document.createElement("div");body.textContent=content;
    bubble.append(from,body);chatMessages.append(bubble);chatMessages.scrollTop=chatMessages.scrollHeight;
    if(save){chatState.messages.push({role,content});chatState.messages=chatState.messages.slice(-18);chatSnapshot();}
  }
  function chatSnapshot(){postChat("SUPPORT_CHAT_SNAPSHOT",{messages:chatState.messages.slice(-18),history:chatState.history.slice(-8)});}
  function liveDisconnect(){
    liveEpoch++;
    const old=liveRoom;liveRoom=null;liveConnecting=null;chatState.connected=false;
    clearTimeout(chatState.responseTimer);chatBusy(false);
    try{old?.disconnect();}catch(_){}
  }
  async function liveConnect(session){
    liveDisconnect();
    const epoch=liveEpoch, sdk=window.LivekitClient;
    if(!sdk?.Room||!session?.url||!session?.token||!session?.sessionId){chatNotice("Alexandra's LiveKit connection is unavailable.",true);return;}
    const room=new sdk.Room({adaptiveStream:true,dynacast:true});
    liveRoom=room;
    const receive=async(reader,participant)=>{
      if(epoch!==liveEpoch||!liveRoom)return;
      if(participant?.identity===room.localParticipant?.identity)return;
      try{
        const message=String(await reader.readAll()||"").trim().slice(0,1900);
        if(!message||epoch!==liveEpoch||liveRoom!==room)return;
        chatState.responseSeen=true;
        clearTimeout(chatState.responseTimer);chatBusy(false);
        chatSay("assistant",message);chatState.history.push({role:"assistant",content:message});chatState.history=chatState.history.slice(-8);
        chatSnapshot();chatNotice("");
      }catch(error){if(epoch===liveEpoch)chatNotice("Alexandra's reply could not be read. Please retry.",true);}
    };
    room.registerTextStreamHandler("lk.transcription",receive);
    // Also accept custom agent text on lk.chat, if the installed worker emits it.
    room.registerTextStreamHandler("lk.chat",receive);
    room.on(sdk.RoomEvent.Disconnected,()=>{
      if(epoch!==liveEpoch)return;
      chatState.connected=false;chatBusy(false);
      chatNotice("Alexandra disconnected. Return to Menu and reopen to reconnect.",true);
    });
    try{
      liveConnecting=room.connect(session.url,session.token);
      await liveConnecting;
      if(epoch!==liveEpoch){room.disconnect();return;}
      chatState.connected=true;chatBusy(false);chatNotice("");
    }catch(error){if(epoch===liveEpoch){chatState.connected=false;chatBusy(false);chatNotice("Could not connect to Alexandra's LiveKit room. Please reopen chat.",true);}}
    finally{if(epoch===liveEpoch)liveConnecting=null;}
  }
  function showChat(){
    if(!state.drawerOpen)return;
    drawer.classList.add("chat-mode");chat.hidden=false;$("drawer-title").textContent="SKANDI Support";
    chatState.connected=false;chatBusy(false);chatNotice("Connecting to Alexandra...");
    postChat("SUPPORT_CHAT_START_ALEXANDRA",{requestId:nextId("alexandra-open")});
  }
  function backToMenu(){
    liveDisconnect();postChat("SUPPORT_CHAT_PANEL_CLOSE");
    drawer.classList.remove("chat-mode");chat.hidden=true;$("drawer-title").textContent="Explore SKANDI";
    $("alexandra-case-form").hidden=true;$("alexandra-entry").focus({preventScroll:true});
  }
  function chatOpened(data={}){
    if(!state.drawerOpen||chat.hidden){postChat("SUPPORT_CHAT_PANEL_CLOSE");return;}
    const newSession=data?.alexandraSession;
    if(!newSession?.sessionId||!newSession?.token||!newSession?.url){chatNotice("LiveKit did not return a usable connection.",true);return;}
    const reset=chatState.sessionId!==newSession.sessionId;
    chatState.sessionId=String(newSession.sessionId);chatState.loggedIn=data.loggedIn===true;
    if(reset){
      chatState.messages=[];chatState.history=[];chatMessages.replaceChildren();
      if(Array.isArray(data.messages)&&data.messages.length){
        for(const m of data.messages.slice(-18))if(m&&["user","assistant"].includes(m.role))chatSay(m.role,m.content,false);
        chatState.messages=data.messages.slice(-18).filter(m=>m&&["user","assistant"].includes(m.role));
        chatState.history=Array.isArray(data.history)?data.history.slice(-8):[];
      }else chatSay("assistant","Welcome to SKANDI Travels. I'm Alexandra, your AI travel assistant. How can I help?");
    }
    chatSnapshot();void liveConnect(newSession);
  }
  $("alexandra-entry").addEventListener("click",showChat);
  $("alexandra-back").addEventListener("click",backToMenu);
  $("alexandra-compose").addEventListener("submit",async event=>{
    event.preventDefault();const message=chatQuestion.value.trim();
    if(!message||chatState.pending)return;
    if(!chatState.connected||!liveRoom){chatNotice("Alexandra is not connected. Reopen chat to try again.",true);return;}
    const requestId=nextId("alexandra-msg");chatState.requestId=requestId;
    chatState.responseSeen=false;chatBusy(true);chatNotice("Sending to Alexandra...");
    try{
      await liveRoom.localParticipant.sendText(message,{topic:"lk.chat"});
      if(chatState.requestId!==requestId)return;
      chatSay("user",message);chatQuestion.value="";
      chatState.history.push({role:"user",content:message});chatState.history=chatState.history.slice(-8);chatSnapshot();
      if(!chatState.responseSeen){
        chatNotice("Alexandra is preparing a response...");
        clearTimeout(chatState.responseTimer);
        chatState.responseTimer=setTimeout(()=>{if(chatState.pending&&chatState.requestId===requestId){chatBusy(false);chatNotice("Alexandra did not respond. You can try again.",true);}},35000);
      }
    }catch(error){if(chatState.requestId===requestId){chatBusy(false);chatNotice("Message not sent through LiveKit. Please retry.",true);}}
  });
  $("alexandra-support").addEventListener("click",()=>postChat("SUPPORT_CHAT_NAVIGATE",{path:chatState.loggedIn?"/my-profile?section=support&view=cases":"/about/support"}));
  $("alexandra-followup").addEventListener("click",()=>{$("alexandra-case-form").hidden=!$("alexandra-case-form").hidden;
    if(!$("alexandra-case-details").value)$("alexandra-case-details").value="I would like assistance from SKANDI Customer Service.";
  });
  $("alexandra-case-form").addEventListener("submit",event=>{
    event.preventDefault();if(chatState.casePending)return;
    chatState.casePending=true;$("alexandra-case-submit").disabled=true;chatNotice("Submitting your request...");
    clearTimeout(chatState.caseTimer);
    chatState.caseTimer=setTimeout(()=>{if(chatState.casePending){chatState.casePending=false;$("alexandra-case-submit").disabled=false;chatNotice("SKANDI did not confirm the request. Check My Support before retrying.",true)}},35000);
    const fullName=$("alexandra-case-name").value.trim(),names=fullName.split(/\s+/);
    postChat("SUPPORT_CHAT_SUBMIT_FORM",{requestId:nextId("alexandra-case"),input:{firstName:names[0]||"",lastName:names.slice(1).join(" "),fullName,email:$("alexandra-case-email").value.trim(),subject:$("alexandra-case-subject").value.trim(),message:$("alexandra-case-details").value.trim(),category:"general"}});
  });
  const avatarVideo=$("alexandra-entry").querySelector("video");
  if(avatarVideo){avatarVideo.playbackRate=.75;avatarVideo.addEventListener("ratechange",()=>{if(avatarVideo.playbackRate!==.75)avatarVideo.playbackRate=.75});}
  function handleChatParentMessage(data){
    const p=data.payload||{};
    switch(data.type){
      case "SUPPORT_CHAT_OPEN":chatOpened(p);return true;
      case "SUPPORT_CHAT_CASE_CREATED":
        clearTimeout(chatState.caseTimer);chatState.casePending=false;$("alexandra-case-submit").disabled=false;
        if(p.caseId||p.caseRef){$("alexandra-case-form").hidden=true;chatNotice("Case submitted: "+(p.caseRef||p.caseId));}
        else chatNotice("The server did not confirm the case.",true);return true;
      case "SUPPORT_CHAT_ERROR":
        clearTimeout(chatState.caseTimer);
        chatState.casePending=false;$("alexandra-case-submit").disabled=false;
        chatNotice(p.message||"Request failed.",true);return true;
      default:return false;
    }
  }
  function notice(text,opts={}){
    clearTimeout(state.feedbackTimer);
    statusCopy.textContent=String(text||"").slice(0,170);
    status.classList.toggle("busy",Boolean(opts.busy));
    status.classList.toggle("error",Boolean(opts.error));
    status.classList.toggle("show",Boolean(text));
    refresh.disabled=Boolean(opts.busy);
    if(text&&!opts.busy)state.feedbackTimer=setTimeout(()=>notice(""),opts.duration||3600);
  }
  function setActive(name){
    nav.querySelectorAll(".nav-item").forEach(button=>{
      const active=button.dataset.action===name;
      button.classList.toggle("active",active);
      if(active)button.setAttribute("aria-current","page");else button.removeAttribute("aria-current");
    });
  }
  function showBook(){
    if(state.busy)return;
    if(state.drawerOpen)closeDrawer();
    post("HOME_APP_FOCUS_SEARCH",{},nextId("focus"));
  }
  function openDrawer(){
    if(state.busy||state.drawerOpen||state.drawerRequestId)return;
    state.drawerRequestId=nextId("drawer-open");
    post("HOME_APP_DRAWER_RESIZE",{open:true},state.drawerRequestId);
    clearTimeout(state.drawerTimer);
    state.drawerTimer=setTimeout(()=>{
      if(!state.drawerRequestId)return;
      state.drawerRequestId="";
      notice("The menu could not open. Please try again.",{error:true});
    },4000);
  }
  function closeDrawer(){
    if(!state.drawerOpen&&!state.drawerRequestId)return;
    clearTimeout(state.drawerTimer);
    state.drawerRequestId="";
    const wasOpen=state.drawerOpen;
    if(!chat.hidden){liveDisconnect();postChat("SUPPORT_CHAT_PANEL_CLOSE");}
    state.drawerOpen=false;
    drawerLayer.classList.remove("open");
    drawerLayer.setAttribute("aria-hidden","true");
    drawer.classList.remove("chat-mode");chat.hidden=true;$("drawer-title").textContent="Explore SKANDI";
    menuButton.setAttribute("aria-expanded","false");
    menuButton.setAttribute("aria-label","Open menu");
    if(wasOpen){post("HOME_APP_DRAWER_RESIZE",{open:false},nextId("drawer-close"));menuButton.focus({preventScroll:true});}
  }
  function drawerReady(){
    clearTimeout(state.drawerTimer);
    const requestId=state.drawerRequestId;
    if(!requestId)return;
    let attempts=0;
    function verifyExpandedFrame(){
      if(state.drawerRequestId!==requestId)return;
      // An ACK confirms the requested Wix height, NOT the rendered iframe geometry.
      // In particular, an 88px footer/cell can clip the whole drawer.
      if(window.innerHeight >= 220){
        state.drawerRequestId="";
        state.drawerOpen=true;
        drawerLayer.classList.add("open");
        drawerLayer.setAttribute("aria-hidden","false");
        menuButton.setAttribute("aria-expanded","true");
        menuButton.setAttribute("aria-label","Close menu");
        document.getElementById("drawer-close").focus({preventScroll:true});
        return;
      }
      if(++attempts<14){setTimeout(verifyExpandedFrame,95);return;}
      state.drawerRequestId="";
      post("HOME_APP_DRAWER_RESIZE",{open:false},nextId("drawer-layout-reset"));
      console.warn("[SKANDI Mobile Nav] The iframe is still 88px after Wix acknowledged resize. Move #skandiMobileAppNavEmbed outside #skandiFooter, pin it to Page with bottom 0, disable proportional scaling, and remove any 88px parent/max-height constraint.");
    }
    requestAnimationFrame(verifyExpandedFrame);
  }
  function refreshHome(){
    if(state.busy||state.currentPath!=="/")return;
    state.busy=true;
    state.refreshId=nextId("refresh");
    notice("Updating Home content…",{busy:true});
    post("HOME_APP_REFRESH",{},state.refreshId);
  }
  function navigate(key,activeAction=""){
    if(state.busy)return;
    const path=route(key);
    if(!path){notice("This page is currently unavailable.",{error:true});return;}
    if(state.drawerOpen)closeDrawer();
    if(activeAction)setActive(activeAction);
    if(path===state.currentPath||key==="home"&&state.currentPath==="/"){state.busy=false;return;}
    state.busy=true;
    notice("Opening…",{busy:true});
    post("MASTER_NAVIGATE",{path},nextId("nav"));
    setTimeout(()=>{if(state.busy&&!state.refreshId){state.busy=false;notice("Navigation could not be confirmed. Try again.",{error:true});}},8500);
  }
  nav.addEventListener("click",event=>{
    const button=event.target.closest("button[data-action]");
    if(!button)return;
    const action=button.dataset.action;
    if(action==="menu"){if(state.drawerOpen)closeDrawer();else openDrawer();return;}
    if(action==="home")return navigate("home","home");
    if(action==="explore")return navigate("destinations","explore");
    if(action==="travelInfo")return navigate("travelInfo","travelInfo");
    if(action==="myProfile")return navigate("myProfile","myProfile");
  });
  document.getElementById("drawer-close").addEventListener("click",closeDrawer);
  document.getElementById("drawer-backdrop").addEventListener("click",closeDrawer);
  drawer.querySelectorAll(".drawer-link").forEach(button=>button.addEventListener("click",()=>{
    if(button.dataset.focusSearch==="true"){showBook();return;}
    const key=button.dataset.route;
    if(key)navigate(key);
  }));
  document.addEventListener("keydown",event=>{
    if(!state.drawerOpen)return;
    if(event.key==="Escape"){event.preventDefault();closeDrawer();return;}
    if(event.key!=="Tab")return;
    const focusables=[...drawer.querySelectorAll("button:not([disabled]):not([hidden]),a[href],textarea:not([disabled]),input:not([disabled])")].filter(el=>el.getClientRects().length);
    const first=focusables[0],last=focusables[focusables.length-1];
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  });
  refresh.addEventListener("click",refreshHome);
  let touchStart=null;
  document.getElementById("pull-zone").addEventListener("touchstart",event=>{
    if(event.touches.length!==1||state.busy)return;
    touchStart={x:event.touches[0].clientX,y:event.touches[0].clientY};
  },{passive:true});
  document.getElementById("pull-zone").addEventListener("touchend",event=>{
    if(!touchStart||!event.changedTouches.length)return;
    const dx=event.changedTouches[0].clientX-touchStart.x;
    const dy=event.changedTouches[0].clientY-touchStart.y;
    touchStart=null;
    if(state.currentPath==="/"&&dy>42&&Math.abs(dy)>Math.abs(dx)*1.2)refreshHome();
  },{passive:true});
  window.addEventListener("message",event=>{
    if(event.source!==window.parent)return;
    let data=event.data;
    if(typeof data==="string"){try{data=JSON.parse(data);}catch(_){return;}}
    if(!data||data.source!==PARENT)return;
    if(handleChatParentMessage(data))return;
    if(data.type==="SKANDI_MASTER_CONFIG"){
      const r=data.payload?.routes;
      if(r&&typeof r==="object")state.routes={...state.routes,...r};
      const path=data.payload?.currentPath;
      if(typeof path==="string"&&path.startsWith("/")){
        state.currentPath=path;
        setActive(path==="/"?"home":(path==="/destinations"||path.startsWith("/destinations/"))?"explore":(path==="/travel-info"||path.startsWith("/travel-info/"))?"travelInfo":(path==="/my-profile"||path.startsWith("/my-profile/"))?"myProfile":"");
      }
    }
    if(data.type==="HOME_APP_DRAWER_FORCE_CLOSE"){
      if(!chat.hidden){liveDisconnect();postChat("SUPPORT_CHAT_PANEL_CLOSE");}
      drawer.classList.remove("chat-mode");chat.hidden=true;$("drawer-title").textContent="Explore SKANDI";
      clearTimeout(state.drawerTimer);
      state.drawerRequestId="";
      state.drawerOpen=false;
      drawerLayer.classList.remove("open");
      drawerLayer.setAttribute("aria-hidden","true");
      menuButton.setAttribute("aria-expanded","false");
      menuButton.setAttribute("aria-label","Open menu");
      return;
    }
    if(data.type==="HOME_APP_DRAWER_RESIZE_ACK"){
      if(data.payload?.open===true&&data.requestId===state.drawerRequestId)drawerReady();
      return;
    }
    if(data.type==="HOME_APP_DRAWER_RESIZE_ERROR"){
      if(data.requestId===state.drawerRequestId){
        clearTimeout(state.drawerTimer);state.drawerRequestId="";
        notice(data.payload?.message||"The menu could not open.",{error:true});
      }
      return;
    }
    if(data.type==="HOME_APP_READY_ACK"){state.ready=true;return;}
    if(data.type==="HOME_APP_FOCUS_ACK"){notice("");return;}
    if(data.type==="HOME_APP_REFRESH_RESULT"&&data.requestId===state.refreshId){
      state.busy=false;state.refreshId="";
      notice(data.payload?.completed?"Home content and price checks updated.":"Home content updated. Live price checks continue.");
      return;
    }
    if(data.type==="HOME_APP_REFRESH_ERROR"&&data.requestId===state.refreshId){
      state.busy=false;state.refreshId="";
      notice(data.payload?.message||"Could not refresh Home.",{error:true});
    }
  });
  chatBusy(false);
  post("MASTER_CONFIG_REQUEST",{context:"home-mobile-nav"});
  post("HOME_APP_READY",{},nextId("ready"));
})();
