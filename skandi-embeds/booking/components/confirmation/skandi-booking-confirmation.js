

(()=>{
"use strict";
const SOURCE="SKANDI_BOOKING_CONFIRMATION_V2",PARENT="SKANDI_WIX_PARENT";
const $=id=>document.getElementById(id);
let wire=null;
function post(type,payload={}){if(wire&&!wire.before(type))return;window.parent.postMessage({source:SOURCE,type,requestId:wire?.id||"",...payload},"*")}
function esc(v=""){return String(v??"").replace(/[&<>"']/g,s=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[s]))}
function status(m,c=""){const e=$("status");e.textContent=m;e.className="status show "+c}
function when(v){if(!v)return"";const d=new Date(v);return Number.isNaN(d.getTime())?String(v):d.toLocaleString([], {dateStyle:"medium",timeStyle:"short"})}
function carrier(s={}){return s.operatingCarrierDisplayName||s.marketingCarrier?.name||s.operatingCarrier?.name||s.marketingCarrier?.iataCode||s.operatingCarrier?.iataCode||""}
function segments(items=[]){
  if(!items.length)return"";
  return `<div style="margin-top:18px"><div class="kicker">Flight itinerary</div><div class="route-list">${items.map(s=>`<div class="route-item"><div class="route-code">${esc(s.origin||"—")} → ${esc(s.destination||"—")}</div><div class="route-main"><strong>${esc(carrier(s)||"Flight")}</strong>${s.flightNumber?` · ${esc(s.flightNumber)}`:""}<br>${esc(when(s.departingAt||s.departureAt))}</div><div class="route-side">${esc(s.bookingClass||"")}</div></div>`).join("")}</div></div>`;
}
function stayBlock(s={}){
  if(!s||!s.id)return"";
  const name=s.accommodation?.name||s.name||"Hotel reservation";
  return `<div class="summary-card" style="margin-top:18px"><div class="kicker">Hotel</div><h3>${esc(name)}</h3><div class="meta-list">${s.reference?`<div class="meta-row"><span>Hotel reference</span><strong>${esc(s.reference)}</strong></div>`:""}${s.checkInDate?`<div class="meta-row"><span>Check-in</span><strong>${esc(s.checkInDate)}</strong></div>`:""}${s.checkOutDate?`<div class="meta-row"><span>Check-out</span><strong>${esc(s.checkOutDate)}</strong></div>`:""}</div></div>`;
}
function render(c={}){
  if(c.status!=="Confirmed"||!c.bookingReference){$("root").innerHTML="";status("Your reservation is not confirmed yet. Check My Booking or contact SKANDI.","warn");return;}
  $("root").innerHTML=`
    <div class="confirmed-banner"><div><strong>Booking confirmed</strong><p>Your reservation is confirmed. Your booking reference and travel details are below.</p></div><span class="badge">Confirmed</span></div>
    <article class="panel">
      <div class="panel-head"><h2>${esc(c.title||"Your trip is confirmed")}</h2><p>${esc(c.summary||"Your SKANDI booking is confirmed.")}</p></div>
      <div class="panel-body">
        <div class="grid-2">
          <div class="summary-card"><div class="kicker">SKANDI reference</div><div class="ref">${esc(c.bookingReference||c.cartId||"—")}</div><p>Use this reference when contacting SKANDI.</p></div>
          <div class="summary-card"><div class="kicker">Booking details</div><div class="meta-list"><div class="meta-row"><span>Status</span><strong>${esc(c.status||"Confirmed")}</strong></div><div class="meta-row"><span>Booking type</span><strong>${esc(c.confirmationType||"Travel booking")}</strong></div>${c.pnrLocator?`<div class="meta-row"><span>Supplier reference</span><strong>${esc(c.pnrLocator)}</strong></div>`:""}${c.seatSummary?`<div class="meta-row"><span>Seats</span><strong>${esc(c.seatSummary)}</strong></div>`:""}</div></div>
        </div>
        ${segments(c.segments||[])}
        ${stayBlock(c.stayBooking||{})}
        <div class="summary-card" style="margin-top:18px"><div class="kicker">Before you travel</div><p>Review traveler names, travel dates, entry requirements, supplier rules, baggage and check-in information. Additional supplier documents can appear separately.</p></div>
        <div class="actions">
          <button class="btn secondary" id="homeBtn" type="button">Home</button>
          <div class="actions-right"><button class="btn secondary" id="profileBtn" type="button">My Profile</button><button class="btn" id="docsBtn" type="button">Open travel documents →</button></div>
        </div>
      </div>
    </article>`;
  $("docsBtn").onclick=()=>post("CONFIRMATION_NAVIGATE",{path:"/booking/documents"});
  $("profileBtn").onclick=()=>post("CONFIRMATION_NAVIGATE",{path:"/my-profile"});
  $("homeBtn").onclick=()=>post("CONFIRMATION_NAVIGATE",{path:"/home"});
  status("Booking confirmed.","ok");
}
window.addEventListener("message",e=>{
  const m=e.data||{};if(e.source!==window.parent||m.source!==PARENT||m.requestId&&m.requestId!==wire?.id)return;
  if(m.type==="CONFIRMATION_LOADED")render(m.payload?.confirmation||{});
  if(m.type==="BOOKING_ERROR")status(m.message||"Could not load confirmation.","error");
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

startBookingBridge("CONFIRMATION_READY",["CONFIRMATION_LOADED"]);
})();

