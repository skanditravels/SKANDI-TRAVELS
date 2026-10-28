

(()=>{
"use strict";
const SOURCE="SKANDI_SIGNATURE_TRANSFER",PARENT="SKANDI_WIX_PARENT";
let OPTIONS=[],busy=false;
const $=id=>document.getElementById(id);
let wire=null;
function post(type,payload={}){if(wire&&!wire.before(type))return;window.parent.postMessage({source:SOURCE,type,requestId:wire?.id||"",...payload},"*")}
function esc(v=""){return String(v??"").replace(/[&<>"']/g,s=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[s]))}
function status(m,c=""){const e=$("status");e.textContent=m;e.className="status show "+c}
function loading(show,text="Updating transfer…"){const l=$("pageLoader");$("loaderText").textContent=text;l.classList.toggle("active",show)}
function money(p={}){const n=Number(p.amount??p.total);if(!Number.isFinite(n)||n===0)return"Included";try{return new Intl.NumberFormat(undefined,{style:"currency",currency:p.currency||"USD"}).format(n)}catch(_){return `${p.currency||""} ${n.toFixed(2)}`.trim()}}
function render(payload={}){
  OPTIONS=Array.isArray(payload.options)?payload.options:[];
  $("root").innerHTML=`
    <article class="panel">
      <div class="panel-head"><h2>Arrival transfer</h2><p>When a supported SKANDI transfer is attached to this booking, it appears here.</p></div>
      <div class="panel-body">
        <div style="display:grid;gap:12px">
          ${OPTIONS.length?OPTIONS.map((o,i)=>`<article class="option-card"><span class="badge">Transfer</span><div><h3>${esc(o.title||"SKANDI Transfer")}</h3><p>${esc(o.description||"Arrival transfer service.")}</p>${Array.isArray(o.includes)&&o.includes.length?`<p>${o.includes.map(v=>`<span class="badge" style="margin:6px 5px 0 0">${esc(v)}</span>`).join("")}</p>`:""}</div><div style="display:grid;gap:8px;justify-items:end"><div class="option-price">${esc(money(o.price||{}))}</div><button class="btn" type="button" data-select="${i}">Add transfer</button></div></article>`).join(""):`<div class="empty"><strong>No transfer is attached to this booking.</strong><br>${esc(payload.meta?.message||payload.message||"Continue to traveler details.")}</div>`}
        </div>
        <div class="actions">
          <button class="btn secondary" id="back" type="button">← Back to extras</button>
          <div class="actions-right"><button class="btn ${OPTIONS.length?"secondary":""}" id="skip" type="button">Continue without transfer →</button></div>
        </div>
      </div>
    </article>`;
  document.querySelectorAll("[data-select]").forEach(btn=>btn.onclick=()=>{
    if(busy)return;busy=true;loading(true,"Adding transfer…");
    post("SIGNATURE_TRANSFER_SELECT",{transfer:OPTIONS[Number(btn.dataset.select)]});
  });
  $("skip").onclick=()=>{if(busy)return;busy=true;loading(true,"Continuing…");post("SIGNATURE_TRANSFER_SKIP")};
  $("back").onclick=()=>post("BOOKING_NAVIGATE",{path:"/booking/extras"});
  status(OPTIONS.length?"Transfer options available.":(payload.meta?.message||"No transfer is required for this booking."),OPTIONS.length?"ok":"warn");
}
window.addEventListener("message",e=>{
  const m=e.data||{};if(e.source!==window.parent||m.source!==PARENT||m.requestId&&m.requestId!==wire?.id)return;
  if(m.type==="SIGNATURE_TRANSFER_OPTIONS"){busy=false;loading(false);render(m.payload||{})}
  if(m.type==="BOOKING_ERROR"){busy=false;loading(false);status(m.message||"Could not load transfer options.","error")}
});

function startBookingBridge(readyType, resultTypes) {
  const id="booking-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2),mutations=new Set(["BOOKING_SEARCH_SELECT","BOOKING_OFFER_ACCEPTED","BOOKING_EXTRAS_SAVE","SIGNATURE_TRANSFER_SELECT","SIGNATURE_TRANSFER_SKIP","APIS_SAVE_AND_CONTINUE","SEATMAP_SAVE","SEATMAP_SKIP","PAYMENT_COMMIT"]);
  let active=true,settled=false,pending=false,uncertain=false,timer=null,deadline=null;
  const recovery=document.createElement("div");recovery.className="status show";recovery.hidden=true;recovery.setAttribute("role","status");$("status").after(recovery);
  const hideLoader=()=>{const l=$("pageLoader");if(l)l.classList.remove("active");};
  const clear=()=>{clearInterval(timer);clearTimeout(deadline);};
  const lock=()=>document.querySelectorAll("#root button,#root input,#root select").forEach(e=>e.disabled=true);
  function retryPanel(message,check=false){hideLoader();recovery.hidden=false;recovery.textContent=message+" ";const b=document.createElement("button");b.className="btn secondary";b.type="button";b.textContent=check?"Check booking status":"Retry";b.onclick=()=>{if(pending)return;uncertain=false;settled=false;recovery.hidden=true;post("BOOKING_RETRY");waitForResult(90000);};recovery.append(b);const home=document.createElement("button");home.type="button";home.className="btn secondary";home.textContent="Home";home.onclick=()=>post("BOOKING_NAVIGATE",{path:"/home"});recovery.append(home);}
  function waitForResult(ms=90000){clear();deadline=setTimeout(()=>{if(!active)return;settled=true;retryPanel("This step took too long to load.");},ms);}
  function connect(){clear();settled=false;recovery.hidden=true;post(readyType);timer=setInterval(()=>{if(active&&!settled&&!pending)post(readyType);},1500);deadline=setTimeout(()=>{if(!active||settled)return;clear();settled=true;retryPanel("This step could not connect. Please retry.");},90000);}
  wire={id,before(type){
    if(mutations.has(type)){if(!active||pending||uncertain)return false;pending=true;clear();recovery.hidden=true;deadline=setTimeout(()=>{if(!pending)return;pending=false;uncertain=true;hideLoader();lock();retryPanel("The request is still unconfirmed. Check its status before submitting again.",true);},90000);}
    return true;
  }};
  window.addEventListener("message",e=>{
    if(e.source!==window.parent)return;const m=e.data||{};if(m.source!==PARENT||m.requestId&&m.requestId!==id)return;
    if(m.type==="BOOKING_STEP_INACTIVE"){active=false;pending=false;uncertain=false;clear();hideLoader();recovery.hidden=true;return;}
    if(m.type==="BOOKING_STEP_ACTIVE"){active=true;pending=false;uncertain=false;connect();return;}
    if(m.type==="BOOKING_HOST_READY"&&active&&!settled&&!pending){post(readyType);return;}
    if(resultTypes.includes(m.type)){settled=true;pending=false;uncertain=false;clear();recovery.hidden=true;hideLoader();return;}
    if(m.type==="BOOKING_SEARCH_LOADING"){settled=false;waitForResult();return;}
    if(m.type==="BOOKING_ERROR"){
      clear();pending=false;settled=true;
      if(m.retryable===false){uncertain=true;e.stopImmediatePropagation();hideLoader();lock();status(m.message||"Check booking status before continuing.","error");retryPanel("Check the current booking before submitting again.",true);}
      else{uncertain=false;retryPanel("You can retry this step.");}
    }
  },true);
  window.addEventListener("pagehide",clear);connect();
}

startBookingBridge("SIGNATURE_TRANSFER_READY",["SIGNATURE_TRANSFER_OPTIONS"]);
})();

