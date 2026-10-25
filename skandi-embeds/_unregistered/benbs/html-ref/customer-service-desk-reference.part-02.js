
/* SKANDI ALTEA ground-products extension: Duffel Stays + Duffel Cars. */
(function(){
  VIEW_TITLES.hotels = "Hotel Search";
  VIEW_TITLES.cars = "Car Rental";
  EXCLUSIVE_ACTIONS.add("DUFFEL_CREATE_STAY_BOOKING");
  EXCLUSIVE_ACTIONS.add("DUFFEL_CREATE_CAR_BOOKING");
  EXCLUSIVE_ACTIONS.add("DUFFEL_CANCEL_STAY_BOOKING");
  EXCLUSIVE_ACTIONS.add("DUFFEL_CANCEL_CAR_BOOKING");
  state.stayResults = [];
  state.stayRates = [];
  state.selectedStayResult = null;
  state.selectedStayRate = null;
  state.stayQuote = null;
  state.carResults = [];
  state.carQuote = null;
  state.selectedCarRate = null;
  state.carClientKey = "";
  state.carCardValid = false;
  state.carThreeDSecureSessionId = "";


  const flightButton = document.querySelector('.nav-item[data-view="search"]');
  if (flightButton && !document.querySelector('.nav-item[data-view="hotels"]')) {
    const hotel = document.createElement("button");
    hotel.type="button"; hotel.className="nav-item"; hotel.dataset.view="hotels";
    hotel.innerHTML='<span class="nav-icon">▤</span><span class="nav-label">Hotel Search</span>';
    flightButton.insertAdjacentElement("afterend",hotel);
    const car = document.createElement("button");
    car.type="button"; car.className="nav-item"; car.dataset.view="cars";
    car.innerHTML='<span class="nav-icon">▱</span><span class="nav-label">Car Rental</span>';
    hotel.insertAdjacentElement("afterend",car);
  }




  function val(id){return String(document.getElementById(id)?.value||"").trim()}
  function numVal(id,fallback){const n=Number(val(id));return Number.isFinite(n)?n:fallback}
  function currentAlteaBookingId(){return state.alteaWorkspace?.booking?.id||""}


  function renderHotels(){
    return `${pageHead("Hotel Search","Live accommodation search. Inventory Control supplies SKANDI content, not room availability.")}
      <section class="panel"><div class="panel-head">Search live stays</div><div class="panel-body">
        <div class="form-grid">
          <div class="field"><label>Destination / IATA</label><input id="stayDest" class="input" placeholder="STO or Stockholm"></div>
          <div class="field"><label>Check-in</label><input id="stayIn" class="input" type="date"></div>
          <div class="field"><label>Check-out</label><input id="stayOut" class="input" type="date"></div>
          <div class="field"><label>Rooms</label><input id="stayRooms" class="input" type="number" min="1" max="9" value="1"></div>
          <div class="field"><label>Adults</label><input id="stayAdults" class="input" type="number" min="1" max="9" value="2"></div>
        </div>
      </div><div class="panel-foot"><button class="primary" id="staySearchBtn">Search Hotels</button></div></section>
      <section class="panel" style="margin-top:10px"><div class="panel-head"><span>Live results</span><span class="muted">${state.stayResults.length} accommodations</span></div><div class="panel-body">${stayResultsMarkup()}</div></section>
      ${stayRatePanel()}`;
  }


  function stayResultsMarkup(){
    if(!state.stayResults.length)return emptyState("⌂","No stay results loaded","Run a live Hotel search.");
    return `<table class="data-table"><thead><tr><th>Accommodation</th><th>City</th><th>Total from</th><th></th></tr></thead><tbody>${state.stayResults.map(r=>`<tr><td><strong>${escapeHTML(r.title||"Accommodation")}</strong></td><td>${escapeHTML(r.address?.city||"")}</td><td>${money(r.cheapestRateTotalAmount||r.total,r.cheapestRateTotalCurrency||r.currency)}</td><td><button class="link" data-stay-result="${escapeAttr(r.id)}">Rooms & rates</button></td></tr>`).join("")}</tbody></table>`;
  }
  function stayRatePanel(){
    if(!state.selectedStayResult&&!state.stayRates.length)return "";
    return `<section class="panel" style="margin-top:10px"><div class="panel-head">Rooms & rates</div><div class="panel-body">${state.stayRates.length?`<table class="data-table"><thead><tr><th>Room</th><th>Board</th><th>Total</th><th></th></tr></thead><tbody>${state.stayRates.map(r=>`<tr><td>${escapeHTML(r.roomName||"Room")}</td><td>${escapeHTML(r.boardType||"—")}</td><td>${money(r.totalAmount,r.totalCurrency)}</td><td><button class="link" data-stay-rate="${escapeAttr(r.rateId)}">Quote</button></td></tr>`).join("")}</tbody></table>`:emptyState("▤","Loading rates","Select an accommodation to retrieve current room rates.")}</div>${state.stayQuote?`<div class="panel-foot"><span class="muted">Quoted ${money(state.stayQuote.totalAmount,state.stayQuote.totalCurrency)}</span><button class="primary" id="bookStayBtn">Book into open ALTEA file</button></div>`:""}</section>`;
  }


  function renderCars(){
    return `${pageHead("Car Rental","Live vehicle search, quotes and bookings through car rental system.")}
      <section class="panel"><div class="panel-head">Search live cars</div><div class="panel-body">
        <div class="form-grid">
          <div class="field"><label>Pickup</label><input id="carPickup" class="input" placeholder="ARN or Stockholm" value="${escapeAttr(state.carSearchDraft?.pickup || "")}"></div>
          <div class="field"><label>Drop-off</label><input id="carDropoff" class="input" placeholder="ARN or Stockholm" value="${escapeAttr(state.carSearchDraft?.dropoff || "")}"></div>
          <div class="field"><label>Pickup date</label><input id="carPickupDate" class="input" type="date" value="${escapeAttr(state.carSearchDraft?.pickupDate || "")}"></div>
          <div class="field"><label>Pickup time</label><input id="carPickupTime" class="input" type="time" value="${escapeAttr(state.carSearchDraft?.pickupTime || "10:00")}"></div>
          <div class="field"><label>Drop-off date</label><input id="carDropoffDate" class="input" type="date" value="${escapeAttr(state.carSearchDraft?.dropoffDate || "")}"></div>
          <div class="field"><label>Drop-off time</label><input id="carDropoffTime" class="input" type="time" value="${escapeAttr(state.carSearchDraft?.dropoffTime || "10:00")}"></div>
          <div class="field"><label>Driver age</label><input id="carAge" class="input" type="number" min="18" max="99" value="${escapeAttr(String(state.carSearchDraft?.age || 30))}"></div>
          <div class="field"><label>Residence country</label><input id="carResidence" class="input mono" maxlength="2" placeholder="US" value="${escapeAttr(state.carSearchDraft?.residence || "")}"></div>
        </div>
      </div><div class="panel-foot"><button class="primary" id="carSearchBtn">Search Cars</button></div></section>
      <section class="panel" style="margin-top:10px"><div class="panel-head"><span>Live rates</span><span class="muted">${state.carResults.length} rates</span></div><div class="panel-body">${carResultsMarkup()}</div></section>
      ${carQuotePanel()}`;
  }
  function carResultsMarkup(){
    if(!state.carResults.length)return emptyState("▱","No car rates loaded","Run a live search.");
    return `<table class="data-table"><thead><tr><th>Vehicle</th><th>Supplier</th><th>Transmission</th><th>Payment</th><th>Total</th><th></th></tr></thead><tbody>${state.carResults.map(r=>`<tr><td><strong>${escapeHTML(r.car?.name||"Vehicle")}</strong><div class="muted">${escapeHTML(r.car?.category||"")}</div></td><td>${escapeHTML(r.supplier?.name||"")}</td><td>${escapeHTML(r.car?.transmission||"")}</td><td>${escapeHTML(r.paymentType||"")}</td><td>${money(r.totalAmount,r.totalCurrency)}</td><td><button class="link" data-car-rate="${escapeAttr(r.rateId)}">Quote</button></td></tr>`).join("")}</tbody></table>`;
  }
  function carQuotePanel(){
    const q=state.carQuote;if(!q)return "";
    const direct=q.paymentType==="postpaid";
    return `<section class="panel" style="margin-top:10px"><div class="panel-head"><span>Confirmed car quote</span><span class="badge info">${escapeHTML(q.paymentType||"payment")}</span></div><div class="panel-body">
      <div class="grid grid-3"><div><span class="muted">Vehicle</span><div class="strong">${escapeHTML(q.car?.name||"Vehicle")}</div></div><div><span class="muted">Supplier</span><div class="strong">${escapeHTML(q.supplier?.name||"")}</div></div><div><span class="muted">Total</span><div class="price-total">${money(q.totalAmount,q.totalCurrency)}</div></div></div>
      ${direct?alertBox("info","Payment","System reports this rate as postpaid. No customer card data is collected by ALTEA."):alertBox("warning","Secure payment")}
      <div class="form-grid" style="margin-top:10px"><div class="field"><label>Driver first name</label><input id="carFirst" class="input"></div><div class="field"><label>Driver last name</label><input id="carLast" class="input"></div><div class="field"><label>Date of birth</label><input id="carDob" class="input" type="date"></div><div class="field"><label>Email</label><input id="carEmail" class="input" type="email"></div><div class="field"><label>Phone (E.164)</label><input id="carPhone" class="input" placeholder="+12125550123"></div></div>
      ${direct?"":`<div style="margin-top:12px;padding:12px;border:1px solid var(--line);background:#fff"><div class="strong" style="margin-bottom:7px">Card input form</div>${state.carClientKey?`<duffel-card-form id="alteaCarCardForm"></duffel-card-form><div class="muted" style="margin-top:7px">${state.carThreeDSecureSessionId?"3-D Secure authenticated and ready for booking.":"Complete the card input, then authenticate."}</div>`:`<div class="muted">Prepare to enter the customer's card.</div>`}</div>`}
    </div><div class="panel-foot">${direct?"":`<button class="secondary" id="prepareCarCardBtn">${state.carClientKey?"Refresh secure component":"Prepare secure card component"}</button>${state.carClientKey&&!state.carThreeDSecureSessionId?`<button class="secondary" id="authenticateCarCardBtn" ${state.carCardValid?"":"disabled"}>Authenticate card</button>`:""}`}<button class="primary" id="bookCarBtn" ${!direct&&!state.carThreeDSecureSessionId?"disabled":""}>Book car${currentAlteaBookingId()?" into open ALTEA file":""}</button></div></section>`;
  }


  const baseRender=render;
  render=function(){
    if(state.activeView==="hotels"||state.activeView==="cars"){
      main.innerHTML=`<section class="view">${state.activeView==="hotels"?renderHotels():renderCars()}</section>`;
      bindGroundEvents();
      return;
    }
    baseRender();
  };


  function bindGroundEvents(){
    document.getElementById("staySearchBtn")?.addEventListener("click",()=>post("DUFFEL_SEARCH_STAYS",{destination:val("stayDest"),checkInDate:val("stayIn"),checkOutDate:val("stayOut"),rooms:numVal("stayRooms",1),adults:numVal("stayAdults",2),instantPayment:true}));
    document.querySelectorAll("[data-stay-result]").forEach(b=>b.addEventListener("click",()=>{state.selectedStayResult=b.dataset.stayResult;state.stayRates=[];state.stayQuote=null;post("DUFFEL_FETCH_STAY_RATES",{searchResultId:b.dataset.stayResult});render();}));
    document.querySelectorAll("[data-stay-rate]").forEach(b=>b.addEventListener("click",()=>{state.selectedStayRate=b.dataset.stayRate;post("DUFFEL_QUOTE_STAY",{rateId:b.dataset.stayRate});}));
    document.getElementById("bookStayBtn")?.addEventListener("click",()=>{
      const q=state.stayQuote;if(!q)return;
      openModal("Book Hotel",`<div class="field"><label>Lead guest first name</label><input id="stayGuestFirst" class="input"></div><div class="field" style="margin-top:8px"><label>Lead guest last name</label><input id="stayGuestLast" class="input"></div><div class="field" style="margin-top:8px"><label>Email</label><input id="stayGuestEmail" class="input" type="email"></div><div class="field" style="margin-top:8px"><label>Phone (E.164)</label><input id="stayGuestPhone" class="input" placeholder="+12125550123"></div>`,[{label:"Back",className:"secondary",close:true},{label:"Book stay",className:"primary",onClick:()=>{const payload={quoteId:q.id,guests:[{givenName:val("stayGuestFirst"),familyName:val("stayGuestLast")}],email:val("stayGuestEmail"),phoneNumber:val("stayGuestPhone"),alteaBookingId:currentAlteaBookingId()};closeModal();post("DUFFEL_CREATE_STAY_BOOKING",payload);}}]);
    });
    document.getElementById("carSearchBtn")?.addEventListener("click",()=>post("DUFFEL_SEARCH_CARS",{pickupLocationText:val("carPickup"),dropoffLocationText:val("carDropoff")||val("carPickup"),sameLocation:!val("carDropoff")||val("carDropoff")===val("carPickup"),pickupDate:val("carPickupDate"),pickupTime:val("carPickupTime"),dropoffDate:val("carDropoffDate"),dropoffTime:val("carDropoffTime"),driverAge:numVal("carAge",30),residenceCountry:val("carResidence")}));
    document.querySelectorAll("[data-car-rate]").forEach(b=>b.addEventListener("click",()=>{state.selectedCarRate=b.dataset.carRate;post("DUFFEL_QUOTE_CAR",{rateId:b.dataset.carRate});}));
    document.getElementById("prepareCarCardBtn")?.addEventListener("click",()=>{state.carThreeDSecureSessionId="";post("DUFFEL_PREPARE_CAR_CARD",{});});
    document.getElementById("authenticateCarCardBtn")?.addEventListener("click",()=>{try{window.createCardForTemporaryUse()}catch(error){toast("Secure card error",error?.message||"Could not tokenize the card.","danger")}});
    document.getElementById("bookCarBtn")?.addEventListener("click",()=>{const q=state.carQuote;if(!q)return;post("DUFFEL_CREATE_CAR_BOOKING",{quoteId:q.id,paymentType:q.paymentType,threeDSecureSessionId:state.carThreeDSecureSessionId||"",alteaBookingId:currentAlteaBookingId(),driver:{givenName:val("carFirst"),familyName:val("carLast"),dateOfBirth:val("carDob"),email:val("carEmail"),phoneNumber:val("carPhone")}});});
    initAlteaCarCardForm();
  }


  function initAlteaCarCardForm(){
    const q=state.carQuote,el=document.getElementById("alteaCarCardForm");
    if(!q||!el||!state.carClientKey||typeof window.renderDuffelCardFormCustomElement!=="function")return;
    try{
      window.renderDuffelCardFormCustomElement({clientKey:state.carClientKey,intent:"to-create-card-for-temporary-use"});
      el.addEventListener("onValidateSuccess",()=>{state.carCardValid=true;document.getElementById("authenticateCarCardBtn")?.removeAttribute("disabled")});
      el.addEventListener("onValidateFailure",()=>{state.carCardValid=false;document.getElementById("authenticateCarCardBtn")?.setAttribute("disabled","disabled")});
      el.addEventListener("onCreateCardForTemporaryUseFailure",event=>toast("Secure card failed",event.detail?.error?.message||"System failure.","danger"));
      el.addEventListener("onCreateCardForTemporaryUseSuccess",async event=>{
        try{
          const cardId=event.detail?.data?.id;if(!cardId)throw new Error("System did not return a temporary card ID.");
          const session=await window.createThreeDSecureSession(state.carClientKey,cardId,q.id,[],false);
          if(!session||session.status!=="ready_for_payment")throw new Error("The 3-D Secure session is not ready for payment.");
          state.carThreeDSecureSessionId=session.id;toast("Card authenticated","The supplier payment can now be confirmed.","success");render();
        }catch(error){toast("3-D Secure failed",error?.message||"Authentication could not be completed.","danger")}
      });
    }catch(error){toast("Secure card unavailable",error?.message||"Card Form could not be rendered.","danger")}
  }


  window.addEventListener("message",event=>{
    if(event.source!==window.parent)return;
    const m=event.data||{};if(m.source!==PARENT_SOURCE)return;const p=m.payload||{};
    if(m.type==="DUFFEL_STAYS_RESULT"){state.stayResults=p.items||[];state.stayRates=[];state.stayQuote=null;navigate("hotels");toast("Live stays loaded",`${state.stayResults.length} accommodation${state.stayResults.length===1?"":"s"} returned.`,"success");}
    if(m.type==="DUFFEL_STAY_RATES_RESULT"){state.stayRates=p.rates||[];state.stayQuote=null;render();}
    if(m.type==="DUFFEL_STAY_QUOTE_RESULT"){state.stayQuote=p.quote||null;render();}
    if(m.type==="DUFFEL_STAY_BOOKING_RESULT"){toast("Hotel booked",`Booking reference ${p.booking?.reference||p.booking?.id||"confirmed"}.`,"success");if(currentAlteaBookingId())post("ALTEA_GET_BOOKING",{bookingId:currentAlteaBookingId()});}
    if(m.type==="DUFFEL_CARS_RESULT"){state.carResults=p.items||[];state.carQuote=null;navigate("cars");toast("Live cars loaded",`${state.carResults.length} rate${state.carResults.length===1?"":"s"} returned.`,"success");}
    if(m.type==="DUFFEL_CAR_QUOTE_RESULT"){state.carQuote=p.quote||null;render();}
    if(m.type==="DUFFEL_CAR_CARD_READY"){state.carClientKey=p.componentClientKey||"";state.carCardValid=false;state.carThreeDSecureSessionId="";toast("Secure card component ready","info");render();}
    if(m.type==="DUFFEL_CAR_BOOKING_RESULT"){toast("Car booked",`Booking reference ${p.booking?.reference||p.booking?.id||"confirmed"}.`,"success");if(currentAlteaBookingId())post("ALTEA_GET_BOOKING",{bookingId:currentAlteaBookingId()});}
  });
})();
