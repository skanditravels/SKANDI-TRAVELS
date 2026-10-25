

(()=>{
"use strict";
const SOURCE="SKANDI_BOOKING_EXTRAS",PARENT="SKANDI_WIX_PARENT";
let ITEMS=[],SELECTED=new Map(),busy=false;
const $=id=>document.getElementById(id);
let wire=null;
function post(type,payload={}){if(wire&&!wire.before(type))return;window.parent.postMessage({source:SOURCE,type,requestId:wire?.id||"",...payload},"*")}
function esc(v=""){return String(v??"").replace(/[&<>"']/g,s=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[s]))}
function status(m,c=""){const e=$("status");e.textContent=m;e.className="status show "+c}
function loading(show,text="Updating extras…"){const l=$("pageLoader");$("loaderText").textContent=text;l.classList.toggle("active",show)}
function money(p={}){const n=Number(p.amount??p.total);if(!Number.isFinite(n)||n===0)return"Included";try{return new Intl.NumberFormat(undefined,{style:"currency",currency:p.currency||"USD"}).format(n)}catch(_){return `${p.currency||""} ${n.toFixed(2)}`.trim()}}
function render(payload={}){
  ITEMS=Array.isArray(payload.items)?payload.items:[];
  SELECTED=new Map((payload.selectedExtras||[]).map(x=>[String(x.id||x.serviceId||""),Math.max(1,Number(x.quantity||1))]));
  $("root").innerHTML=`
    <article class="panel">
      <div class="panel-head"><h2>Optional extras</h2><p>Add available services to this booking. The live total is recalculated before payment.</p></div>
      <div class="panel-body">
        <div class="extras-list">
        ${ITEMS.length?ITEMS.map((x,i)=>{
          const id=String(x.id||x.serviceId||"");
          const checked=SELECTED.has(id);
          const max=Math.max(1,Number(x.maximumQuantity||1));
          return `<label class="option-card ${checked?"selected":""}" data-card="${i}">
            <input type="checkbox" data-check="${i}" ${checked?"checked":""}>
            <div><h3>${esc(x.title||"Travel extra")}</h3><p>${esc(x.description||"Optional travel service.")}</p></div>
            <div style="display:grid;gap:7px;justify-items:end"><div class="option-price">${esc(money(x.price||{}))}</div>${max>1?`<select class="qty" data-qty="${i}" aria-label="Quantity" ${checked?"":"disabled"}>${Array.from({length:max},(_,n)=>`<option value="${n+1}" ${Number(SELECTED.get(id)||1)===n+1?"selected":""}>× ${n+1}</option>`).join("")}</select>`:""}</div>
          </label>`
        }).join(""):`<div class="empty"><strong>No optional extras are available.</strong><br>You can continue without adding anything.</div>`}
        </div>
        <div class="actions">
          <button class="btn secondary" id="back" type="button">← Back to offer</button>
          <div class="actions-right"><button class="btn" id="continue" type="button">Continue →</button></div>
        </div>
      </div>
    </article>`;
  document.querySelectorAll("[data-check]").forEach(cb=>{
    cb.onchange=()=>{
      const i=Number(cb.dataset.check),x=ITEMS[i],id=String(x.id||x.serviceId||"");
      const card=cb.closest(".option-card"),q=card.querySelector("[data-qty]");
      if(cb.checked){SELECTED.set(id,Number(q?.value||1));card.classList.add("selected");if(q)q.disabled=false}
      else{SELECTED.delete(id);card.classList.remove("selected");if(q)q.disabled=true}
    };
  });
  document.querySelectorAll("[data-qty]").forEach(sel=>sel.onchange=()=>{
    const x=ITEMS[Number(sel.dataset.qty)],id=String(x.id||x.serviceId||"");
    if(SELECTED.has(id))SELECTED.set(id,Number(sel.value||1));
  });
  $("continue").onclick=()=>{
    if(busy)return;busy=true;loading(true,"Saving extras…");
    const selectedExtras=ITEMS.filter(x=>SELECTED.has(String(x.id||x.serviceId||""))).map(x=>({
      id:String(x.id||x.serviceId||""),
      serviceId:String(x.id||x.serviceId||""),
      quantity:SELECTED.get(String(x.id||x.serviceId||""))||1
    }));
    post("BOOKING_EXTRAS_SAVE",{selectedExtras});
  };
  $("back").onclick=()=>post("BOOKING_NAVIGATE",{path:"/booking/offer"});
  status(ITEMS.length?"Choose any extras you want, or continue without them.":"No optional extras are currently available.",ITEMS.length?"ok":"warn");
}
window.addEventListener("message",e=>{
  const m=e.data||{};if(e.source!==window.parent||m.source!==PARENT||m.requestId&&m.requestId!==wire?.id)return;
  if(m.type==="BOOKING_EXTRAS_LOADED"){busy=false;loading(false);render(m.payload||{})}
  if(m.type==="BOOKING_ERROR"){busy=false;loading(false);status(m.message||"Could not load extras.","error")}
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

startBookingBridge("BOOKING_EXTRAS_READY",["BOOKING_EXTRAS_LOADED"]);
})();

