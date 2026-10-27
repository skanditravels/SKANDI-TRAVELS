

(()=>{
  "use strict";

  const SOURCE="SKANDI_CLUB_LOGIN";
  const PARENT="SKANDI_WIX_PARENT";
  const $=selector=>document.querySelector(selector);
  const liveMessage=$("#liveMessage");
  let toastTimer=0;
  let mediaHeroOverride="";

  function post(type,payload={}){
    window.parent.postMessage({source:SOURCE,type,payload,timestamp:new Date().toISOString()},"*");
  }

  function toast(message){
    if(!liveMessage)return;
    liveMessage.textContent=String(message||"");
    liveMessage.style.display="block";
    clearTimeout(toastTimer);
    toastTimer=setTimeout(()=>{liveMessage.style.display="none"},3600);
  }

  function safeStorageUrl(value){
    const raw=String(value||"").trim();
    return /^https:\/\/[a-z0-9.-]+\.supabase\.co\/storage\/v1\/object\/public\/skandi-public-assets\//i.test(raw)?raw:"";
  }

  function applyPresentation(payload={}){
    const blocks=Array.isArray(payload.contentBlocks)?payload.contentBlocks:[];
    for(const item of blocks){
      const id=String(item.contentId||"");
      if(!id)continue;
      document.querySelectorAll(`[data-content-id="${CSS.escape(id)}"]`).forEach(node=>{
        if(item.value!==undefined)node.textContent=String(item.value??"");
      });
    }

    const media=Array.isArray(payload.mediaSlots)?payload.mediaSlots:[];
    for(const item of media){
      if(String(item.slotId||"")!=="club-login-hero")continue;
      const url=safeStorageUrl(item.assetUrl||item.imageUrl);
      if(!url)continue;
      mediaHeroOverride=url;
      applyHeroImage(url,item.alt);
    }
  }

  function applyHeroImage(url,alt=""){
    const image=document.querySelector('[data-media-slot="club-login-hero"]');
    if(!image||!url)return;
    image.src=url;
    if(alt)image.alt=String(alt);
  }

  function applyMasterAssets(assets={}){
    if(mediaHeroOverride)return;
    const url=safeStorageUrl(assets?.images?.clubLoginHero);
    if(url)applyHeroImage(url,"SKANDI Club travel in Santorini, Greece");
  }

  document.addEventListener("click",event=>{
    const action=event.target.closest(".club-login [data-action]");
    if(action){
      const type=action.dataset.action;
      if(type==="login")post("SKANDI_CLUB_LOGIN_OPEN");
      else if(type==="signup")post("SKANDI_CLUB_SIGNUP_OPEN");
      else if(type==="reset")post("SKANDI_CLUB_RESET_OPEN");
      return;
    }

    const route=event.target.closest(".club-login [data-route]");
    if(route){
      event.preventDefault();
      post("SKANDI_CLUB_LOGIN_NAVIGATE",{path:route.dataset.route||route.getAttribute("href")||""});
    }
  });

  window.addEventListener("message",event=>{
    let message=event.data;
    if(typeof message==="string"){
      try{message=JSON.parse(message)}catch(_){return}
    }
    if(!message||typeof message!=="object")return;
    if(message.source===PARENT&&message.type==="SKANDI_CLUB_LOGIN_PARENT_READY")return;
    if(message.source===PARENT&&message.type==="SKANDI_CLUB_LOGIN_ERROR"){
      toast(message.payload?.message||"We could not open the sign-in window. Please try again.");
      return;
    }
    if(message.source===PARENT&&message.type==="SKANDI_MASTER_ASSETS"){
      applyMasterAssets(message.payload||{});
      return;
    }
    if(message.source===PARENT&&message.type==="SKANDI_PRESENTATION_DATA")applyPresentation(message.payload||{});
  });

  function requestHeight(){
    const height=Math.ceil(Math.max(document.documentElement.scrollHeight,document.body.scrollHeight));
    post("SKANDI_CLUB_LOGIN_HEIGHT",{height});
  }
  if("ResizeObserver"in window)new ResizeObserver(requestHeight).observe(document.body);
  else window.addEventListener("resize",requestHeight);
  window.addEventListener("load",requestHeight,{once:true});
  post("SKANDI_CLUB_LOGIN_READY",{});
  post("MASTER_ASSETS_REQUEST",{context:"club-login"});
  post("SKANDI_PRESENTATION_READY",{pageKey:"clubLogin",path:"/skandi-club/login"});
  requestHeight();
})();
