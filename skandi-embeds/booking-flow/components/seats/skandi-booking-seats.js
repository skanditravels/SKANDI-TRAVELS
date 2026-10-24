

(()=>{
"use strict";
const SOURCE="SKANDI_BOOKING_SEATMAP",PARENT="SKANDI_WIX_PARENT";
let DATA=null,activeTraveler=0,activeSegment=0,selections={},busy=false;
const $=id=>document.getElementById(id);
let wire=null;
function post(type,payload={}){if(wire&&!wire.before(type))return;window.parent.postMessage({source:SOURCE,type,requestId:wire?.id||"",...payload},"*")}
function esc(v=""){return String(v??"").replace(/[&<>"']/g,s=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[s]))}
function status(m,c=""){const e=$("status");e.textContent=m;e.className="status show "+c}
function loading(show,text="Saving seat selections…"){const l=$("pageLoader");$("loaderText").textContent=text;l.classList.toggle("active",show)}
function travelerName(t,i){return t.label||[t.firstName,t.lastName].filter(Boolean).join(" ")||`Traveler ${i+1}`}
function segmentLabel(map,i){return `Flight ${i+1}${map.cabins?.[0]?.cabinName?` · ${map.cabins[0].cabinName}`:""}`}
function serviceFor(seat,travelerId){
  return (seat.availableServices||[]).find(s=>s.passengerId?s.passengerId===travelerId:!(s.passengerIds||[]).length||(s.passengerIds||[]).includes(travelerId))||null;
}
function seatRow(designator=""){const m=String(designator).match(/^\d+/);return m?Number(m[0]):0}
function seatCol(designator=""){return String(designator).replace(/^\d+/,"")}
function money(amount,currency){const n=Number(amount);if(!Number.isFinite(n)||n<=0)return"";try{return new Intl.NumberFormat(undefined,{style:"currency",currency:currency||"USD",maximumFractionDigits:0}).format(n)}catch(_){return `${currency||""}${n}`}}
function currentKey(traveler,map){return `${traveler.travelerId||traveler.id}:${map.segmentId||map.id||activeSegment}`}
function render(payload){
  DATA=payload||DATA||{};selections={...(DATA.existingSelections||{}),...selections};
  const travelers=DATA.travelers||[],maps=DATA.seatMaps||[];
  if(DATA.unavailable||!travelers.length||!maps.length){
    $("root").innerHTML=`<article class="panel"><div class="panel-head"><h2>Seat selection unavailable</h2><p>${esc(DATA.reason||"The airline did not return selectable seats for this booking.")}</p></div><div class="panel-body"><div class="actions"><button class="btn secondary" id="back" type="button">← Back to travelers</button><div class="actions-right"><button class="btn" id="skip" type="button">Continue to payment →</button></div></div></div></article>`;
    $("back").onclick=()=>post("BOOKING_NAVIGATE",{path:"/booking/apis"});
    $("skip").onclick=()=>{if(busy)return;busy=true;loading(true,"Continuing to payment…");post("SEATMAP_SKIP")};
    status(DATA.reason||"Seat selection is not available for this booking.","warn");return;
  }
  activeTraveler=Math.min(activeTraveler,travelers.length-1);activeSegment=Math.min(activeSegment,maps.length-1);
  const traveler=travelers[activeTraveler],map=maps[activeSegment];
  $("root").innerHTML=`
    <div class="seat-layout">
      <aside class="panel">
        <div class="panel-head"><h2>Choose passenger</h2></div>
        <div class="panel-body">
          <div class="selector">${travelers.map((t,i)=>`<button type="button" data-t="${i}" class="${i===activeTraveler?"active":""}">${esc(travelerName(t,i))}</button>`).join("")}</div>
          <div class="kicker" style="margin-top:20px">Flight segment</div>
          <div class="selector">${maps.map((m,i)=>`<button type="button" data-s="${i}" class="${i===activeSegment?"active":""}">${esc(segmentLabel(m,i))}</button>`).join("")}</div>
        </div>
      </aside>
      <section class="panel">
        <div class="panel-head"><h2>${esc(segmentLabel(map,activeSegment))}</h2><p>Select one available seat for ${esc(travelerName(traveler,activeTraveler))}. Seat fees are included in the booking total after saving.</p></div>
        <div class="panel-body">
          <div class="legend"><span>Available</span><span class="lg-selected">Selected</span><span class="lg-unavailable">Unavailable</span></div>
          <div class="seat-map" id="seatMap">${renderSeatMap(map,traveler)}</div>
          <div class="actions">
            <button class="btn secondary" id="back" type="button">← Back to travelers</button>
            <div class="actions-right"><button class="btn secondary" id="skip" type="button">Skip seats</button><button class="btn" id="save" type="button">Save seats & continue →</button></div>
          </div>
        </div>
      </section>
    </div>`;
  document.querySelectorAll("[data-t]").forEach(b=>b.onclick=()=>{activeTraveler=Number(b.dataset.t);render(DATA)});
  document.querySelectorAll("[data-s]").forEach(b=>b.onclick=()=>{activeSegment=Number(b.dataset.s);render(DATA)});
  document.querySelectorAll("[data-seat]").forEach(b=>b.onclick=()=>{
    const service=(map.seats||[]).flatMap(seat=>seat.designator===b.dataset.seat?[serviceFor(seat,traveler.travelerId||traveler.id)]:[]).filter(Boolean)[0];
    if(!service)return;
    const key=currentKey(traveler,map);
    selections[key]={
      travelerId:traveler.travelerId||traveler.id,
      passengerId:traveler.travelerId||traveler.id,
      segmentId:map.segmentId||service.segmentId||"",
      serviceId:service.id,
      id:service.id,
      designator:b.dataset.seat,
      amount:Number(service.totalAmount||0),
      currency:service.totalCurrency||""
    };
    render(DATA);
  });
  $("back").onclick=()=>post("BOOKING_NAVIGATE",{path:"/booking/apis"});
  $("skip").onclick=()=>{if(busy)return;busy=true;loading(true,"Continuing without seats…");post("SEATMAP_SKIP")};
  $("save").onclick=()=>{if(busy)return;busy=true;loading(true,"Repricing selected seats…");post("SEATMAP_SAVE",{selections})};
  status("Seat map ready.","ok");
}
function renderSeatMap(map,traveler){
  const groups={};
  (map.seats||[]).forEach(seat=>{const r=seatRow(seat.designator);(groups[r]||(groups[r]=[])).push(seat)});
  const key=currentKey(traveler,map),selected=selections[key]?.designator;
  return Object.keys(groups).map(Number).sort((a,b)=>a-b).map(row=>{
    const seats=groups[row].sort((a,b)=>seatCol(a.designator).localeCompare(seatCol(b.designator)));
    let out=`<div class="seat-row"><div class="row-num">${row||""}</div>`;
    seats.forEach((seat,i)=>{
      if(i===Math.ceil(seats.length/2))out+=`<div class="aisle"></div>`;
      const service=serviceFor(seat,traveler.travelerId||traveler.id),disabled=!service,chosen=selected===seat.designator;
      out+=`<button class="seat ${chosen?"selected":""}" data-seat="${esc(seat.designator||"")}" type="button" ${disabled?"disabled":""}>${esc(seat.designator||"—")}${service?`<span class="seat-fee">${esc(money(service.totalAmount,service.totalCurrency))}</span>`:""}</button>`;
    });
    return out+`</div>`;
  }).join("")||`<div class="empty">No seats were returned for this flight segment.</div>`;
}
window.addEventListener("message",e=>{
  const m=e.data||{};if(e.source!==window.parent||m.source!==PARENT||m.requestId&&m.requestId!==wire?.id)return;
  if(m.type==="SEATMAP_LOADED"){busy=false;selections={};loading(false);render(m.payload||{})}
  if(m.type==="BOOKING_ERROR"){busy=false;loading(false);status(m.message||"Seat selection could not be loaded.","error")}
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

startBookingBridge("SEATMAP_READY",["SEATMAP_LOADED"]);
})();

