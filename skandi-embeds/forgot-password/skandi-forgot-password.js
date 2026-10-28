
(()=>{
  "use strict";
  const SOURCE="SKANDI_FORGOT_PASSWORD";
  const PARENT="SKANDI_WIX_PARENT";
  const $=id=>document.getElementById(id);
  const resetButton=$("resetBtn");
  let resetPending=false;
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
  resetButton?.addEventListener("click",()=>{
    if(resetButton.disabled)return;
    resetButton.disabled=true;
    resetPending=true;
    setStatus("Opening secure Wix password reset…");
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
      if(payload.ok===false){
        resetPending=false;
        setStatus(payload.message||"Wix Members password reset is temporarily unavailable. Please try again.",true);
      }else if(resetPending){
        resetPending=false;
        const resultText=String(payload.message||"").toLowerCase();
        setStatus(resultText.includes("closed")
          ?"The reset window was closed. You can open it again whenever you’re ready."
          :"Follow any confirmation shown by Wix Members. If you requested a reset email, check your inbox.");
      }else{
        setStatus("Secure Wix Members password reset is ready.");
      }
      if(resetButton)resetButton.disabled=false;
    }
  });
  post("FORGOT_PASSWORD_READY",{});
  post("SKANDI_EMBED_RESIZE",{height:620});
})();
