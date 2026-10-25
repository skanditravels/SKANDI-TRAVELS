
(()=>{
  "use strict";
  const SOURCE="SKANDI_FORGOT_PASSWORD";
  const PARENT="SKANDI_WIX_PARENT";
  const $=id=>document.getElementById(id);
  const post=(type,payload={})=>{
    if(window.parent&&window.parent!==window){
      window.parent.postMessage({source:SOURCE,type,payload,timestamp:new Date().toISOString()},"*");
    }
  };
  const setStatus=(text="",error=false)=>{
    const target=$("status");
    if(!target)return;
    target.textContent=String(text||"");
    target.classList.toggle("error",Boolean(error));
  };
  $("resetBtn")?.addEventListener("click",()=>{
    setStatus("Opening secure password reset…");
    post("FORGOT_PASSWORD_OPEN_RESET",{});
  });
  $("loginBtn")?.addEventListener("click",()=>{
    post("FORGOT_PASSWORD_OPEN_LOGIN",{});
  });
  window.addEventListener("message",event=>{
    const message=event.data||{};
    if(message.source!==PARENT)return;
    if(message.type==="FORGOT_PASSWORD_RESULT"){
      const payload=message.payload||{};
      setStatus(payload.message||"",payload.ok===false);
    }
  });
  post("FORGOT_PASSWORD_READY",{});
  post("SKANDI_EMBED_RESIZE",{height:620});
})();
