# Booking.seats

STATUS: NEEDS REVIEW
SLUG: /booking/seats
WIX PAGE: Booking.e8twe
AREA: SKANDI
LIVE HTML: YES
ELEMENT: #seatMapEmbed
LAST SYNCED: 2026-09-16

## HOW TO USE
***STATUS (OWNER): "TODO", "IN PROGRESS", "NEEDS REVIEW", "REVISIONS NEEDED", "READY", "LIVE", "ARCHIVED"
STATUS (AGENT): "TODO", "IN PROGRESS", "REVISIONS NEEDED", "READY".***

###  COMMENT SECTION (START ON A NEW ROW, LOG IF A CHANGE IS MADE THAT REQUIRES ATTENTION) 
1. 9/17 12:535PM "Page is ready styled from my end, page not syncing correctly yet /Samuel"
2.
3.
...
***END*** 

``` LIVE HTML
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Seat Map</title>
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700;800;900&display=swap" rel="stylesheet">
<style>
:root{
  --sk-blue:#022e64;--sk-blue-soft:#285ca8;--sk-light:#d7e6ff;--sk-pale:#f6faff;
  --sk-bg:#f7faff;--sk-border:#dbe3ef;--sk-text:#111;--sk-muted:#667085;
  --sk-cyan:#5FC7CF;--sk-ok:#087443;--sk-warn:#a15c00;--sk-danger:#b42318;
  --sk-shadow:0 8px 26px rgba(0,0,0,.08);--sk-shadow-strong:0 14px 34px rgba(0,0,0,.12);
}
*{box-sizing:border-box}
html,body{margin:0;width:100%;min-height:100%;font-family:"Montserrat",system-ui,sans-serif;background:#fff;color:var(--sk-text);overflow-x:hidden;}
button{font-family:inherit;cursor:pointer}

@keyframes fadeUp{0%{opacity:0;transform:translateY(20px)}100%{opacity:1;transform:translateY(0)}}
.wrap{max-width:1180px;margin:0 auto;padding:40px 24px 80px;animation:fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) forwards}

/* --- PREMIUM BOOKING FLOW METER --- */
.sk-stepper-container { position: relative; display: flex; justify-content: space-between; margin-bottom: 48px; padding: 0 10px; }
.sk-stepper-track { position: absolute; top: 14px; left: 30px; right: 30px; height: 2px; background: var(--sk-border); z-index: 1; }
.sk-stepper-progress { position: absolute; top: 14px; left: 30px; height: 2px; background: var(--sk-cyan); z-index: 2; transition: width 0.8s cubic-bezier(0.16, 1, 0.3, 1); width: 66%; }
.sk-step { position: relative; z-index: 3; display: flex; flex-direction: column; align-items: center; gap: 8px; }
.sk-step-circle { width: 30px; height: 30px; border-radius: 50%; background: #fff; border: 2px solid var(--sk-border); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; color: var(--sk-muted); transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
.sk-step-label { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: var(--sk-muted); transition: color 0.3s ease; }
.sk-step.completed .sk-step-circle { background: var(--sk-blue); border-color: var(--sk-blue); color: #fff; }
.sk-step.completed .sk-step-label { color: var(--sk-blue); }
.sk-step.active .sk-step-circle { border-color: var(--sk-cyan); color: var(--sk-blue); box-shadow: 0 0 0 4px rgba(95,199,207,0.2); }
.sk-step.active .sk-step-label { color: var(--sk-blue); }
.sk-step-circle svg { width: 14px; height: 14px; stroke: currentColor; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; fill: none; }

.hero{background:linear-gradient(135deg,var(--sk-light),var(--sk-pale));border:1px solid var(--sk-border);border-radius:24px;box-shadow:var(--sk-shadow);padding:40px;margin-bottom:32px}
.kicker{font-size:11px;text-transform:uppercase;letter-spacing:.14em;font-weight:900;color:var(--sk-cyan);margin-bottom:8px}
h1{color:var(--sk-blue);font-size:clamp(32px,5vw,46px);line-height:.96;font-weight:800;letter-spacing:-.04em;margin:0 0 12px}
h2{font-size:22px;margin:0 0 16px;font-weight:800;color:var(--sk-blue)}
.hero p{color:#475467;margin:0;font-size:14px;font-weight:500;line-height:1.6}

.status{border-radius:16px;padding:18px;background:var(--sk-bg);border:1px solid var(--sk-border);margin-bottom:24px;color:var(--sk-muted);font-size:13px;font-weight:700}
.status.ok{background:#ecfdf3;color:var(--sk-ok);border-color:#abefc6}
.status.warn{background:#fff7ed;color:var(--sk-warn);border-color:#fed7aa}
.status.error{background:#fff1f0;color:var(--sk-danger);border-color:#ffd5d2}

.shell{display:grid;grid-template-columns:320px 1fr;gap:24px; animation:fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.2s forwards; opacity:0;}
.card,.cabin{padding:30px;background:#fff;border:1px solid var(--sk-border);border-radius:20px;box-shadow:var(--sk-shadow);transition:box-shadow 0.3s ease}
.card:hover,.cabin:hover{box-shadow:var(--sk-shadow-strong)}

.traveler,.segment{width:100%;border:1px solid var(--sk-border);background:var(--sk-bg);color:var(--sk-blue);border-radius:12px;padding:14px 16px;margin:0 0 10px;text-align:left;font-weight:800;font-size:13px;transition:all 0.25s cubic-bezier(0.16,1,0.3,1)}
.traveler:hover:not(.active),.segment:hover:not(.active){border-color:var(--sk-cyan);box-shadow:0 4px 12px rgba(95,199,207,.15);transform:translateX(4px);}
.traveler.active,.segment.active{background:linear-gradient(135deg,var(--sk-blue),var(--sk-blue-soft));color:#fff;border-color:var(--sk-blue);box-shadow:0 6px 16px rgba(2,46,100,.2)}

/* Seat Map Enhancements */
.seat-row{display:flex;align-items:center;justify-content:center;gap:12px;margin:12px 0}
.row-label{width:36px;text-align:right;padding-right:12px;font-size:12px;font-weight:800;color:var(--sk-muted)}
.seat{width:48px;height:48px;border-radius:12px;border:2px solid #dbe3ef;background:#fff;color:var(--sk-blue);font-weight:800;font-size:13px;cursor:pointer;position:relative;transition:all 0.3s cubic-bezier(0.16,1,0.3,1);display:flex;flex-direction:column;align-items:center;justify-content:center;}
.seat:hover:not(.disabled){border-color:var(--sk-cyan);box-shadow:0 0 0 4px rgba(95,199,207,.15);transform:scale(1.1);z-index:2}
.seat.selected{background:var(--sk-blue);color:#fff;border-color:var(--sk-blue);transform:scale(1.1);box-shadow:0 8px 20px rgba(2,46,100,.25);z-index:3}
.seat.disabled{background:var(--sk-bg);color:#94a3b8;border-color:#e2e8f0;cursor:not-allowed;opacity:0.7}
.aisle{width:34px}
.price-dot{display:block;font-size:9px;font-weight:800;margin-top:2px;color:var(--sk-cyan)}
.seat.selected .price-dot{color:#8fe7e8}

.actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:32px;justify-content:flex-end}
.btn{border:0;border-radius:12px;background:linear-gradient(135deg,var(--sk-blue),var(--sk-blue-soft));color:#fff;padding:16px 28px;font-weight:800;font-size:14px;box-shadow:0 6px 20px rgba(2,46,100,.15);transition:all .25s cubic-bezier(0.16,1,0.3,1); position:relative; overflow:hidden;}
.btn:hover{transform:translateY(-2px);box-shadow:0 10px 26px rgba(2,46,100,.25)}
.btn::after {content:"";position:absolute;top:0;left:-100%;width:50%;height:100%;background:linear-gradient(to right,rgba(255,255,255,0) 0%,rgba(255,255,255,0.25) 50%,rgba(255,255,255,0) 100%);transform:skewX(-25deg);transition:all 0.6s ease;}
.btn:hover::after {left:150%;}
.btn.secondary{background:#fff;color:var(--sk-blue);border:1px solid var(--sk-border);box-shadow:0 4px 12px rgba(0,0,0,.04)}
.btn.secondary:hover{border-color:var(--sk-cyan);color:var(--sk-cyan)}

@media(max-width:860px){
  .shell{grid-template-columns:1fr}
  .wrap{padding:24px 16px 60px}
  .seat{width:42px;height:42px}
  .cabin{overflow-x:auto}
  .btn{width:100%}
  .sk-step-label{display:none;}
  .sk-stepper-container{margin-bottom:32px;}
}
</style>
</head>
<body>
<div class="wrap">
  
  <div class="sk-stepper-container">
    <div class="sk-stepper-track"></div>
    <div class="sk-stepper-progress" style="width: 66%;"></div>
    
    <div class="sk-step completed">
      <div class="sk-step-circle"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg></div>
      <div class="sk-step-label">Offer</div>
    </div>
    <div class="sk-step completed">
      <div class="sk-step-circle"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg></div>
      <div class="sk-step-label">Extras</div>
    </div>
    <div class="sk-step completed">
      <div class="sk-step-circle"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg></div>
      <div class="sk-step-label">Transfer</div>
    </div>
    <div class="sk-step completed">
      <div class="sk-step-circle"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg></div>
      <div class="sk-step-label">Travelers</div>
    </div>
    <div class="sk-step active">
      <div class="sk-step-circle">5</div>
      <div class="sk-step-label">Seats</div>
    </div>
    <div class="sk-step">
      <div class="sk-step-circle">6</div>
      <div class="sk-step-label">Payment</div>
    </div>
    <div class="sk-step">
      <div class="sk-step-circle">7</div>
      <div class="sk-step-label">Done</div>
    </div>
  </div>

  <section class="hero">
    <div class="kicker">Seat selection</div>
    <h1>Choose seats</h1>
    <p>Seat availability is loaded when supported. Any selected seat and applicable fee are revalidated before payment.</p>
  </section>

  <div id="status" class="status">Loading seat availability...</div>
  <div id="root"></div>

</div>
<script>
const SOURCE="SKANDI_BOOKING_SEATMAP",PARENT="SKANDI_WIX_PARENT";
let DATA=null,activeTraveler=0,activeSegment=0,selections={};
const $=id=>document.getElementById(id);
function post(type,payload={}){window.parent.postMessage({source:SOURCE,type,...payload},"*")}
function esc(v=""){return String(v??"").replace(/[&<>"']/g,s=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[s]))}
function status(m,c=""){const e=$("status");e.textContent=m;e.className="status "+c}

function travelerName(t,i){return [t.firstName||"Traveler",t.lastName||String(i+1)].filter(Boolean).join(" ")}
function selectedFor(passengerId,segmentId){return selections[`${passengerId}:${segmentId}`]||null}
function seatService(seat,passengerId){
  return (seat.services||[]).find(s=>!(s.passengerIds||[]).length||(s.passengerIds||[]).includes(passengerId))||null;
}

function render(payload){
  DATA=payload||{};selections=DATA.existingSelections||selections||{};
  if(DATA.unavailable){
    status(DATA.reason||"Seat selection is not available for this flight.","warn");
    $("root").innerHTML=`<section class="card"><h2>Seat selection unavailable</h2><p style="color:#475467;margin-bottom:24px;line-height:1.6;font-size:14px">You can continue without choosing a seat. Seat assignment may still be available later through check-in.</p><div class="actions"><button class="btn" id="continue">Continue to payment →</button></div></section>`;
    $("continue").onclick=()=>post("SEATMAP_SKIP");
    return;
  }
  const travelers=DATA.travelers||[],segments=DATA.seatmap?.segments||[];
  if(!travelers.length||!segments.length){
    status("Seat selection is not available for this booking.","warn");
    $("root").innerHTML=`<section class="card"><div class="actions"><button class="btn" id="continue">Continue to payment →</button></div></section>`;
    $("continue").onclick=()=>post("SEATMAP_SKIP");return;
  }
  activeTraveler=Math.min(activeTraveler,travelers.length-1);activeSegment=Math.min(activeSegment,segments.length-1);
  const t=travelers[activeTraveler],seg=segments[activeSegment];
  $("root").innerHTML=`<div class="shell"><aside class="card"><h2>Travelers</h2>${travelers.map((x,i)=>`<button class="traveler ${i===activeTraveler?"active":""}" data-t="${i}">${esc(travelerName(x,i))}</button>`).join("")}<h2 style="font-size:18px;margin-top:24px">Flight segments</h2>${segments.map((x,i)=>`<button class="segment ${i===activeSegment?"active":""}" data-s="${i}">Segment ${i+1}</button>`).join("")}</aside><section class="cabin"><h2>Cabin Layout</h2><div id="seats"></div><div class="actions"><button class="btn secondary" id="skip">Skip seats</button><button class="btn" id="save">Save seats and continue →</button></div></section></div>`;
  document.querySelectorAll("[data-t]").forEach(b=>b.onclick=()=>{activeTraveler=Number(b.dataset.t);render(DATA)});
  document.querySelectorAll("[data-s]").forEach(b=>b.onclick=()=>{activeSegment=Number(b.dataset.s);render(DATA)});
  $("skip").onclick=()=>post("SEATMAP_SKIP");
  $("save").onclick=()=>post("SEATMAP_SAVE",{selections});
  renderSeats(seg,t);
}

function renderSeats(segment,traveler){
  const groups={};
  (segment.seats||[]).forEach(seat=>{const row=seat.row||parseInt(String(seat.designator).replace(/\D/g,""),10)||0;(groups[row]||(groups[row]=[])).push(seat)});
  let html="";
  Object.keys(groups).map(Number).sort((a,b)=>a-b).forEach(row=>{
    const seats=groups[row].sort((a,b)=>String(a.column).localeCompare(String(b.column)));
    html+=`<div class="seat-row"><div class="row-label">${row}</div>`;
    seats.forEach((seat,i)=>{
      if(i===Math.ceil(seats.length/2))html+=`<div class="aisle"></div>`;
      const service=seatService(seat,traveler.travelerId);
      const key=`${traveler.travelerId}:${segment.segmentId}`;
      const chosen=selections[key]?.seat===seat.designator;
      const disabled=!service;
      const fee=service&&Number(service.amount)>0?`${service.currency} ${Number(service.amount).toFixed(2)}`:"";
      html+=`<button class="seat ${chosen?"selected":""} ${disabled?"disabled":""}" data-seat="${esc(seat.designator)}" data-service="${esc(service?.serviceId||"")}" data-amount="${esc(service?.amount||0)}" data-currency="${esc(service?.currency||"")}" ${disabled?"disabled":""}>${esc(seat.designator)}${fee?`<span class="price-dot">${esc(fee)}</span>`:""}</button>`;
    });
    html+=`</div>`;
  });
  $("seats").innerHTML=html||"<p style='color:var(--sk-muted);font-size:14px;margin-bottom:24px'>No selectable seats were returned for this segment.</p>";
  
  document.querySelectorAll("[data-service]").forEach(b=>b.onclick=()=>{
    const key=`${traveler.travelerId}:${segment.segmentId}`;
    selections[key]={seat:b.dataset.seat,serviceId:b.dataset.service,passengerId:traveler.travelerId,segmentId:segment.segmentId,amount:Number(b.dataset.amount||0),currency:b.dataset.currency||""};
    render(DATA);
  });
}

window.addEventListener("message",e=>{
  const m=e.data||{};
  if(m.source!==PARENT)return;
  if(m.type==="SEATMAP_LOADED")render(m.payload);
  if(m.type==="BOOKING_ERROR")status(m.message||"Seat selection could not be loaded.","error")
});
post("SEATMAP_READY");
</script>
</body>
</html>
