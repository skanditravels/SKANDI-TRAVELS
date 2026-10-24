
/* SKANDI V12 Presentation Runtime — Magazine Manager controlled presentation only. */
(function(){
  "use strict";
  const PARENT="SKANDI_WIX_PARENT";
  function safeUrl(v){try{const u=new URL(String(v||""),location.href);return u.protocol==="https:"?u.href:""}catch(_){return""}}
  function apply(payload){
    const blocks=Array.isArray(payload?.contentBlocks)?payload.contentBlocks:[];
    const media=Array.isArray(payload?.mediaSlots)?payload.mediaSlots:[];
    blocks.forEach(item=>{const id=String(item.contentId||"");if(!id)return;document.querySelectorAll(`[data-content-id="${CSS.escape(id)}"]`).forEach(el=>{if(item.value!==undefined)el.textContent=String(item.value??"")})});
    media.forEach(item=>{const slot=String(item.slotId||"");if(!slot||String(item.ownership||"").toUpperCase()==="INVENTORY")return;const url=safeUrl(item.assetUrl||item.imageUrl);if(!url)return;document.querySelectorAll(`[data-media-slot="${CSS.escape(slot)}"]`).forEach(el=>{if(el.tagName==="IMG"){el.src=url;if(item.alt)el.alt=String(item.alt)}else{el.style.backgroundImage=`url("${url.replace(/"/g,"%22")}")`}})});
  }
  window.addEventListener("message",e=>{const m=e.data||{};if(m.source===PARENT&&m.type==="SKANDI_PRESENTATION_DATA")apply(m.payload||{})});
  window.parent.postMessage({source:"SKANDI_PRESENTATION_RUNTIME",type:"SKANDI_PRESENTATION_READY",payload:{path:location.pathname}},"*");
})();
