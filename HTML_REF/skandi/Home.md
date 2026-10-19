# INFO / LOG — SKANDI Home Mobile App Navigation

- SOURCE FILE: `/HTML_REF/skandi/Home Mobile App Navigation.md`
- DISPLAY/PAGE: Home — mobile-only app navigation component
- SYSTEM: SKANDI
- ROUTE: `/` (customer Home; mobile layout only)
- WIX PAGE CONTROLLER: `/src/pages/Home.n73w8.js`
- WIX HTML COMPONENT ID: `#homeMobileAppEmbed`
- COMPONENT SOURCE: `SKANDI_HOME_MOBILE_APP`
- PARENT MESSAGE SOURCE: `SKANDI_WIX_PARENT`
- CANONICAL BACKEND (UNCHANGED): `backend/SKANDI_CORE/homeContent.web.js` → `homeContent.js` → existing Inventory/Supabase/provider ownership
- GLOBAL NAVIGATION OWNER (UNCHANGED): `/src/pages/masterPage.js`; `MASTER_NAVIGATE` and `MASTER_CONFIG_REQUEST` are pre-existing contracts.
- RELATION TO EXISTING HOME: Separate auxiliary Wix iframe; DOES NOT replace the `#htmlHome` HTML payload or `/HTML_REF/skandi/Home.md`.
- RELATION TO BOOKING: No `/booking` merge in this revision. V12 `/booking` remains canonical until Home Wix statebox/editor and controller migration.
- AUTHENTICATION / DATA AUTHORITY: No browser Supabase access, no new auth/provider APIs, no sensitive credential storage.
- STATUS: STATICALLY VERIFIED; REQUIRES LIVE TEST with Wix Studio mobile positioning, masterPage routing and Home live data.
- LAST VERIFIED: 2026-10-19, against current `skanditravels/SKANDI-TRAVELS` `main` Wix Home source and controller.

## CHANGE LOG
- 2026-10-19 — Initial new mobile Home app-nav embed. Branded bottom tab bar for Home, Book, Explore, My Trips and Account; Book relays focus to existing V12 Home HTML; refresh uses existing Home content gateway via V12 Home controller; inactive on desktop; no other system behavior altered.

## COMPLETE INTENDED LIVE HTML SOURCE

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="color-scheme" content="light">
<meta name="theme-color" content="#ffffff">
<title>SKANDI Home · Mobile Navigation</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
:root{color-scheme:light;--navy:#022e64;--cyan:#5fc7cf;--ink:#122744;--muted:#60748a;--line:#dfe7f0;--base:#ffffff;--safe-bottom:env(safe-area-inset-bottom,0px)}
*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden;overscroll-behavior:none;background:transparent;font-family:Montserrat,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;-webkit-text-size-adjust:100%;touch-action:pan-x pan-y}
body{display:flex;justify-content:stretch;align-items:flex-end;color:var(--ink)}button{font-family:inherit}button,svg{-webkit-tap-highlight-color:transparent}
#app-nav{width:100%;position:relative;min-height:88px;padding:8px 6px max(10px,var(--safe-bottom));background:rgba(255,255,255,.975);border-top:1px solid var(--line);box-shadow:0 -8px 24px rgba(2,46,100,.09);display:grid;grid-template-columns:repeat(5,minmax(0,1fr));align-items:stretch;gap:1px;isolation:isolate}
.nav-item{appearance:none;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;min-height:63px;border:0;border-radius:12px;color:#58708e;background:transparent;cursor:pointer;font-weight:700;font-size:10px;letter-spacing:-.01em;white-space:nowrap;user-select:none}
.nav-item svg{width:23px;height:23px;flex:none;stroke:currentColor;stroke-width:1.85;stroke-linecap:round;stroke-linejoin:round;fill:none}
.nav-item.active{color:var(--navy);background:#edf4fa}
.nav-item.active .nav-label{font-weight:800}
.nav-item:active{transform:scale(.97)}.nav-item:focus-visible,#refresh:focus-visible{outline:2px solid var(--cyan);outline-offset:-2px}
#status{position:absolute;bottom:8px;left:50%;width:min(94%,355px);transform:translateX(-50%) translateY(8px);border:1px solid rgba(2,46,100,.12);border-radius:13px;background:#fff;color:var(--navy);padding:11px 42px 11px 13px;box-shadow:0 10px 30px rgba(2,46,100,.13);font-size:12px;font-weight:600;line-height:1.4;opacity:0;visibility:hidden;pointer-events:none;transition:opacity .18s ease,transform .18s ease;z-index:5;display:flex;align-items:center;gap:9px}
#status.show{opacity:1;visibility:visible;transform:translateX(-50%) translateY(0);pointer-events:auto}
#status.error{color:#972c38}
#status-spinner{width:16px;height:16px;flex:none;display:none;border:2px solid #bdd9e7;border-top-color:var(--navy);border-radius:50%;animation:spin .75s linear infinite}
#status.busy #status-spinner{display:block}
#refresh{appearance:none;position:absolute;right:7px;top:7px;width:28px;height:28px;display:grid;place-items:center;border:0;border-radius:8px;background:#f2f6fa;color:var(--navy);cursor:pointer}
#refresh svg{width:17px;height:17px;stroke:currentColor;stroke-width:2;fill:none;stroke-linejoin:round;stroke-linecap:round}
#status-copy{padding-right:15px}
#pull-zone{position:absolute;top:0;left:0;right:0;height:18px;touch-action:pan-x;z-index:4}
#pull-zone:before{content:"";display:block;margin:3px auto;width:32px;height:3px;border-radius:6px;background:#dce4ed}
@keyframes spin{to{transform:rotate(360deg)}}
@media(min-width:751px){html,body,#app-nav{display:none!important}}
@media(max-width:350px){#app-nav{padding-left:3px;padding-right:3px}.nav-item{font-size:9px;gap:4px}}
@media(prefers-reduced-motion:reduce){*,*:before,*:after{animation:none!important;transition:none!important;scroll-behavior:auto!important}}
</style>
</head>
<body>
<nav id="app-nav" aria-label="SKANDI mobile app navigation">
  <div id="pull-zone" role="presentation"></div>
  <button class="nav-item active" id="nav-home" type="button" data-action="home" aria-current="page">
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/></svg><span class="nav-label">Home</span>
  </button>
  <button class="nav-item" id="nav-book" type="button" data-action="book">
    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5M7.5 10.5h6M10.5 7.5v6"/></svg><span class="nav-label">Book</span>
  </button>
  <button class="nav-item" id="nav-explore" type="button" data-action="explore">
    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m15 9-2 6-4 1 1-4z"/></svg><span class="nav-label">Explore</span>
  </button>
  <button class="nav-item" id="nav-trips" type="button" data-action="trips">
    <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="18" height="15" rx="2"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 12h18"/></svg><span class="nav-label">My Trips</span>
  </button>
  <button class="nav-item" id="nav-account" type="button" data-action="account">
    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.5 3.5-7 8-7s8 2.5 8 7"/></svg><span class="nav-label">Account</span>
  </button>
  <div id="status" role="status" aria-live="polite" aria-atomic="true"><span id="status-spinner" aria-hidden="true"></span><span id="status-copy"></span><button id="refresh" type="button" aria-label="Refresh Home data" title="Refresh Home data"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11a8 8 0 1 0 1 3M20 4v7h-7"/></svg></button></div>
</nav>
<script>
(function(){
  "use strict";
  const SOURCE="SKANDI_HOME_MOBILE_APP",PARENT="SKANDI_WIX_PARENT";
  const defaultRoutes=Object.freeze({home:"/",destinations:"/destinations",myTrips:"/my-profile?tab=trips",myProfile:"/my-profile"});
  const state={routes:{...defaultRoutes},busy:false,refreshId:"",ready:false,feedbackTimer:null,request:0};
  const status=document.getElementById("status"),statusCopy=document.getElementById("status-copy");
  const nav=document.getElementById("app-nav"),refresh=document.getElementById("refresh");
  function nextId(kind){state.request+=1;return kind+"-"+Date.now()+"-"+state.request;}
  function post(type,payload={},requestId=""){
    const message={source:SOURCE,type,payload,timestamp:new Date().toISOString()};
    if(requestId)message.requestId=requestId;
    window.parent.postMessage(message,"*");
  }
  function route(key){const value=String(state.routes[key]||defaultRoutes[key]||"");return value.startsWith("/")&&!value.startsWith("//")?value:"";}
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
    setActive("book");
    post("HOME_APP_FOCUS_SEARCH",{},nextId("focus"));
  }
  function refreshHome(){
    if(state.busy)return;
    state.busy=true;
    state.refreshId=nextId("refresh");
    notice("Updating Home content…",{busy:true});
    post("HOME_APP_REFRESH",{},state.refreshId);
  }
  function navigate(action){
    if(state.busy)return;
    const key=action==="explore"?"destinations":action==="trips"?"myTrips":action==="account"?"myProfile":"home";
    const path=route(key);
    if(!path){notice("This page is currently unavailable.",{error:true});return;}
    setActive(action);
    state.busy=true;
    notice("Opening…",{busy:true});
    post("MASTER_NAVIGATE",{path},nextId("nav"));
    setTimeout(()=>{if(state.busy&&!state.refreshId){state.busy=false;notice("Navigation could not be confirmed. Try again.",{error:true});}},8500);
  }
  nav.addEventListener("click",event=>{
    const button=event.target.closest("button[data-action]");
    if(!button)return;
    if(button.dataset.action==="book")return showBook();
    if(button.dataset.action==="home"){setActive("home");return;}
    navigate(button.dataset.action);
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
    if(dy>42&&Math.abs(dy)>Math.abs(dx)*1.2)refreshHome();
  },{passive:true});
  window.addEventListener("message",event=>{
    if(event.source!==window.parent)return;
    let data=event.data;
    if(typeof data==="string"){try{data=JSON.parse(data);}catch(_){return;}}
    if(!data||data.source!==PARENT)return;
    if(data.type==="SKANDI_MASTER_CONFIG"){
      const r=data.payload?.routes;
      if(r&&typeof r==="object")state.routes={...state.routes,...r};
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
  post("MASTER_CONFIG_REQUEST",{context:"home-mobile-nav"});
  post("HOME_APP_READY",{},nextId("ready"));
})();
</script>
</body>
</html>

```
