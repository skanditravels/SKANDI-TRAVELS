

(()=>{
"use strict";
const SOURCE="SKANDI_BOOKING_OFFER",PARENT="SKANDI_WIX_PARENT";
let CART=null,busy=false;
const $=id=>document.getElementById(id);
let wire=null;
function post(type,payload={}){if(wire&&!wire.before(type))return;window.parent.postMessage({source:SOURCE,type,requestId:wire?.id||"",...payload},"*")}
function esc(v=""){return String(v??"").replace(/[&<>"']/g,s=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[s]))}
function status(m,c=""){const e=$("status");e.textContent=m;e.className="status show "+c}
function loading(show,text="Updating your booking…"){const l=$("pageLoader");$("loaderText").textContent=text;l.classList.toggle("active",show)}
function money(amount,currency){const n=Number(amount);if(!Number.isFinite(n))return "Price pending";try{return new Intl.NumberFormat(undefined,{style:"currency",currency:currency||"USD"}).format(n)}catch(_){return `${currency||""} ${n.toFixed(2)}`.trim()}}
function when(v){if(!v)return"";const d=new Date(v);return Number.isNaN(d.getTime())?String(v):d.toLocaleString([], {dateStyle:"medium",timeStyle:"short"})}
function carrier(seg={}){return seg.marketingCarrier?.name||seg.operatingCarrierDisplayName||seg.operatingCarrier?.name||seg.marketingCarrier?.iataCode||seg.operatingCarrier?.iataCode||""}
function renderSlices(slices=[]){
  if(!slices.length)return"";
  return `<div class="route-list">${slices.map(slice=>{
    const first=(slice.segments||[])[0]||{},last=(slice.segments||[]).slice(-1)[0]||first;
    const o=slice.origin?.iataCode||first.origin?.iataCode||"—",d=slice.destination?.iataCode||last.destination?.iataCode||"—";
    return `<div class="route-item"><div class="route-code">${esc(o)} → ${esc(d)}</div><div class="route-main"><strong>${esc(carrier(first)||"Flight")}</strong>${first.marketingFlightNumber?` · ${esc(first.marketingFlightNumber)}`:""}<br>${esc(when(first.departingAt))}</div><div class="route-side">${(slice.segments||[]).length>1?`${(slice.segments||[]).length-1} stop${(slice.segments||[]).length>2?"s":""}`:"Nonstop"}</div></div>`;
  }).join("")}</div>`;
}

let RESULTS=[],SEARCH={},filterText="",sortOrder="recommended";
function safeImage(value){try{const u=new URL(value);return u.protocol==="https:"?u.href:"";}catch(_){return "";}}
function renderSearch(payload={}){
  CART=null;RESULTS=Array.isArray(payload.items)?payload.items:[];SEARCH=payload.search||{};
  document.querySelector(".page-hero h1").textContent="Find your next journey";
  document.querySelector(".page-hero p").textContent=[SEARCH.originLabel||SEARCH.origin,SEARCH.destinationLabel||SEARCH.destination,SEARCH.departureDate||SEARCH.checkInDate,SEARCH.returnDate||SEARCH.checkOutDate].filter(Boolean).join(" · ");
  $("root").innerHTML=`<section class="panel"><div class="panel-head"><h2>Your travel options</h2><p>Choose an available option to review its current price and booking conditions.</p></div><div class="panel-body"><div class="results-toolbar"><span id="resultsCount" class="results-count" aria-live="polite"></span><label>Filter <input id="resultFilter" type="search" placeholder="Airline, hotel or destination" value="${esc(filterText)}"></label><label>Sort <select id="resultSort"><option value="recommended">Recommended</option><option value="priceAsc">Price: low to high</option><option value="priceDesc">Price: high to low</option></select></label></div><div id="resultList" class="result-list"></div><div class="actions"><button id="editSearch" class="btn secondary" type="button">← Edit search</button><button id="refreshSearch" class="btn secondary" type="button">Refresh availability</button></div></div></section>`;
  $("resultSort").value=sortOrder;
  $("resultFilter").oninput=()=>{filterText=$("resultFilter").value;drawResults();};
  $("resultSort").onchange=()=>{sortOrder=$("resultSort").value;drawResults();};
  $("editSearch").onclick=()=>post("BOOKING_NAVIGATE",{path:"/home"});
  $("refreshSearch").onclick=()=>{if(busy)return;busy=true;loading(true,"Refreshing live availability…");post("BOOKING_SEARCH_REFRESH");};
  drawResults();
  status(payload.errors?.length?"Some travel providers could not return results. You can retry availability or change your search.":RESULTS.length?"Choose an option to continue.":"No live options matched this search. Try different dates or a nearby destination.",payload.errors?.length?"warn":"");
}
function drawResults(){
  const needle=filterText.toLocaleLowerCase().trim();
  const rows=RESULTS.map((item,index)=>({item,index})).filter(({item})=>[item.title,item.summary,item.routeSummary,item.stay?.title,item.owner?.name,item.airlineName].filter(Boolean).join(" ").toLocaleLowerCase().includes(needle));
  if(sortOrder!=="recommended")rows.sort((a,b)=>String(a.item.price?.currency||"").localeCompare(String(b.item.price?.currency||""))||(Number(a.item.price?.amount)-Number(b.item.price?.amount))*(sortOrder==="priceDesc"?-1:1));
  $("resultsCount").textContent=`${rows.length} option${rows.length===1?"":"s"}`;
  $("resultList").innerHTML=rows.length?rows.map(({item:x,index})=>{
    const type=String(x.itemType||x.productType||"flight").toLowerCase(),isHotel=type.includes("hotel"),isPackage=type.includes("package"),price=x.price||{},img=safeImage(x.imageUrl||x.stay?.imageUrl||""),expires=x.expiresAt||x.flight?.expiresAt,expired=expires&&Date.parse(expires)<=Date.now();
    return `<article class="result-card"><div class="result-main">${img?`<img class="result-image" src="${esc(img)}" alt="" loading="lazy">`:""}<span class="badge">${esc(isPackage?"Flight + Hotel":isHotel?"Hotel":type.includes("car")?"Car rental":"Flight")}</span><h3>${esc(x.title||x.routeSummary||"Travel option")}</h3><p>${esc(x.summary||x.description||"")}</p>${renderSlices((x.flight||x).slices||[])}${isHotel||isPackage?`<div class="result-meta">${esc(x.stay?.title||x.accommodation?.name||"")}<br>${esc(SEARCH.checkInDate||SEARCH.departureDate||"")} – ${esc(SEARCH.checkOutDate||SEARCH.returnDate||"")} · ${Number(SEARCH.rooms)||1} room${Number(SEARCH.rooms)>1?"s":""}</div>`:""}</div><div class="result-side"><span class="kicker">Total for your search</span><div class="price">${esc(money(price.amount,price.currency))}</div><div class="result-meta">${isHotel?"Lowest available room rate. Review current conditions before continuing.":"Price and availability are checked again when you continue."}</div><button class="btn" data-select-result="${index}" type="button" ${expired?"disabled":""}>${expired?"Expired — refresh":"Review option →"}</button></div></article>`;
  }).join(""):`<div class="empty"><strong>${RESULTS.length?"No options match this filter.":"No available options found."}</strong><p>${RESULTS.length?"Clear your filter to see all results.":"Change your search or refresh availability."}</p></div>`;
  document.querySelectorAll("[data-select-result]").forEach(b=>b.onclick=()=>{if(busy)return;const x=RESULTS[Number(b.dataset.selectResult)];if(!x)return;busy=true;loading(true,"Checking your selected option…");post("BOOKING_SEARCH_SELECT",{offerId:x.id||x.staySearchResultId});});
}

function render(cart={}){
  document.querySelector(".page-hero h1").textContent="Review your offer";
  document.querySelector(".page-hero p").textContent="Review your selected trip before continuing to extras and traveler details.";
  CART=cart;
  const offer=cart.selectedOffer||{};
  const quote=cart.stayQuote||cart.hotel?.quote||{};
  const product=String(cart.productType||"FLIGHT").toUpperCase();
  const isHotel=product==="HOTEL_ONLY";
  const isPackage=product.includes("PACKAGE");
  const title=isHotel?(quote.accommodation?.name||"Hotel stay"):isPackage?"Flight + Hotel package":(offer.routeSummary||"Selected flight");
  const summary=isHotel
    ?[quote.checkInDate&&`Check-in ${quote.checkInDate}`,quote.checkOutDate&&`Check-out ${quote.checkOutDate}`].filter(Boolean).join(" · ")
    :(offer.summary||"Live travel option");
  const expires=cart.expiresAt||offer.expiresAt||quote.expiresAt||"";
  $("root").innerHTML=`
    <article class="panel">
      <div class="panel-head"><h2>${esc(title)}</h2><p>${esc(summary)}</p></div>
      <div class="panel-body">
        <div class="grid-3">
          <div class="summary-card"><div class="kicker">Trip total</div><div class="price">${esc(money(cart.total,cart.currency))}</div><p>Live price. Availability is revalidated before payment.</p></div>
          <div class="summary-card"><div class="kicker">Booking type</div><h3>${esc(isHotel?"Hotel":isPackage?"Package":"Flight")}</h3><p>${esc(cart.status||"Open booking")}</p></div>
          <div class="summary-card"><div class="kicker">Price validity</div><h3>${esc(expires?when(expires):"Live")}</h3><p>Supplier availability and price can change until the reservation is created.</p></div>
        </div>
        ${!isHotel&&offer.slices?.length?`<div style="margin-top:18px">${renderSlices(offer.slices)}</div>`:""}
        ${isHotel?`<div class="summary-card" style="margin-top:18px"><div class="kicker">Hotel</div><h3>${esc(quote.accommodation?.name||"Selected accommodation")}</h3><div class="meta-list"><div class="meta-row"><span>Check-in</span><strong>${esc(quote.checkInDate||"—")}</strong></div><div class="meta-row"><span>Check-out</span><strong>${esc(quote.checkOutDate||"—")}</strong></div></div></div>`:""}
        <label class="checkline"><input id="acceptTerms" type="checkbox"><span>I accept the booking conditions and understand that SKANDI will revalidate current supplier price and availability as this booking proceeds.</span></label>
        <div class="actions">
          <button class="btn secondary" id="backBtn" type="button">← Back to search</button>
          <div class="actions-right"><button class="btn" id="continueBtn" type="button">Continue →</button></div>
        </div>
      </div>
    </article>`;
  status("Offer ready.","ok");
  $("continueBtn").onclick=()=>{
    if(busy)return;
    if(!$("acceptTerms").checked)return status("Accept the booking conditions before continuing.","warn");
    busy=true;loading(true,"Revalidating your offer…");
    post("BOOKING_OFFER_ACCEPTED",{cartId:CART.cartId,termsAccepted:true});
  };
  $("backBtn").onclick=()=>{loading(true,"Returning to search…");post("BOOKING_BACK_TO_RESULTS")};
}
window.addEventListener("message",e=>{
  const m=e.data||{};if(e.source!==window.parent||m.source!==PARENT||m.requestId&&m.requestId!==wire?.id)return;
  if(m.type==="BOOKING_SEARCH_LOADING"){busy=true;loading(true,"Finding your travel options…");status("Searching live availability…");}
  if(m.type==="BOOKING_SEARCH_RESULTS"){busy=false;loading(false);renderSearch(m.payload||{});}
  if(m.type==="BOOKING_CART_LOADED"){busy=false;loading(false);render(m.payload?.cart||{})}
  if(m.type==="BOOKING_ERROR"){busy=false;loading(false);status(m.message||"Could not load this offer.","error")}
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

startBookingBridge("BOOKING_OFFER_READY",["BOOKING_SEARCH_RESULTS", "BOOKING_CART_LOADED"]);
})();

