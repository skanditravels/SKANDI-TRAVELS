

(()=>{
"use strict";
const SOURCE="SKANDI_BOOKING_DOCUMENTS",PARENT="SKANDI_WIX_PARENT";
const $=id=>document.getElementById(id);
function post(type,payload={}){window.parent.postMessage({source:SOURCE,type,...payload},"*")}
function esc(v=""){return String(v??"").replace(/[&<>"']/g,s=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[s]))}
function status(m,c=""){const e=$("status");e.textContent=m;e.className="status show "+c}
function when(v){if(!v)return"";const d=new Date(v);return Number.isNaN(d.getTime())?String(v):d.toLocaleString([], {dateStyle:"medium",timeStyle:"short"})}
function itinerary(d={}){
  const slices=Array.isArray(d.slices)?d.slices:[];
  if(!slices.length)return`<div class="empty">No flight itinerary is attached to this booking.</div>`;
  const segments=slices.flatMap(s=>Array.isArray(s.segments)?s.segments:[]);
  return `<div class="route-list">${segments.map(s=>{
    const o=s.origin?.iataCode||s.origin||"—",dest=s.destination?.iataCode||s.destination||"—";
    const carrier=s.operatingCarrierDisplayName||s.marketingCarrier?.name||s.operatingCarrier?.name||s.marketingCarrier?.iataCode||"";
    const flight=s.marketingFlightNumber||s.flightNumber||"";
    return `<div class="route-item"><div class="route-code">${esc(o)} → ${esc(dest)}</div><div class="route-main"><strong>${esc(carrier||"Flight")}</strong>${flight?` · ${esc(flight)}`:""}<br>${esc(when(s.departingAt||s.departureAt))}</div><div class="route-side">${esc(s.cabinClass||s.fareBrandName||"")}</div></div>`
  }).join("")}</div>`;
}
function confirmation(c={}){
  const stay=c.stayBooking||{};
  return `<article class="doc-card"><header><strong>Booking confirmation</strong><span class="badge">${esc(c.status||"Confirmed")}</span></header><div class="doc-body"><div class="grid-2"><div><div class="kicker">SKANDI reference</div><div class="price" style="font-size:21px">${esc(c.bookingReference||c.cartId||"—")}</div><p style="color:var(--sk-body);font-size:10px;line-height:1.6">${esc(c.summary||"Your SKANDI booking is confirmed.")}</p></div><div class="meta-list"><div class="meta-row"><span>Type</span><strong>${esc(c.confirmationType||"Travel booking")}</strong></div>${c.pnrLocator?`<div class="meta-row"><span>Supplier reference</span><strong>${esc(c.pnrLocator)}</strong></div>`:""}${stay.reference?`<div class="meta-row"><span>Hotel reference</span><strong>${esc(stay.reference)}</strong></div>`:""}</div></div></div></article>`;
}
function tickets(e={}){
  const docs=Array.isArray(e.documents)?e.documents:[];
  return `<article class="doc-card"><header><strong>${esc(e.title||"Airline ticket documents")}</strong><span class="badge">${docs.length} issued</span></header><div class="doc-body">${docs.length?docs.map(d=>`<div class="ticket"><div><strong>${esc(d.type||"Travel document")}</strong><span style="display:block;margin-top:4px">${esc((d.passengerIds||[]).join(", "))}</span></div><strong>${esc(d.ticketNumber||d.id||"")}</strong></div>`).join(""):`<div class="empty">${esc(e.note||"No supplier-issued ticket document is available yet.")}</div>`}</div></article>`;
}
function render(payload={}){
  const docs=payload.documents||{};
  $("root").innerHTML=`<div class="doc-stack">
    ${docs.confirmation?confirmation(docs.confirmation):""}
    <article class="doc-card"><header><strong>${esc(docs.itinerary?.title||"SKANDI itinerary")}</strong><span class="badge">Itinerary</span></header><div class="doc-body">${itinerary(docs.itinerary||{})}</div></article>
    ${tickets(docs.eTickets||{})}
  </div>
  <div class="actions">
    <button class="btn secondary" id="homeBtn" type="button">Home</button>
    <div class="actions-right"><button class="btn secondary" id="profileBtn" type="button">My Profile</button><button class="btn" id="printBtn" type="button">Print / Save PDF</button></div>
  </div>`;
  $("homeBtn").onclick=()=>post("BOOKING_NAVIGATE",{path:"/home"});
  $("profileBtn").onclick=()=>post("BOOKING_NAVIGATE",{path:"/my-profile"});
  $("printBtn").onclick=()=>window.print();
  status("Travel documents ready.","ok");
}
window.addEventListener("message",e=>{
  const m=e.data||{};if(m.source!==PARENT)return;
  if(m.type==="BOOKING_DOCUMENTS_LOADED")render(m.payload||{});
  if(m.type==="BOOKING_ERROR")status(m.message||"Could not load travel documents.","error");
});
post("BOOKING_DOCUMENTS_READY");
})();

