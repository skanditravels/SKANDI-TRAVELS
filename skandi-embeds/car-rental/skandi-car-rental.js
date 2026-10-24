
(()=>{
"use strict";

const SOURCE="SKANDI_CAR_RENTAL";
const PARENT="SKANDI_WIX_PARENT";
const PARENT_ORIGIN=(()=>{
  try{return document.referrer?new URL(document.referrer).origin:"*"}
  catch(_){return"*"}
})();
const $=id=>document.getElementById(id);

const state={
  bookingId:"",
  search:null,
  offers:[],
  quote:null,
  clientKey:"",
  cardValid:false,
  paymentReady:false,
  booking:null
};

function post(type,payload={}){
  window.parent.postMessage({
    source:SOURCE,
    type,
    payload,
    timestamp:new Date().toISOString()
  },PARENT_ORIGIN);
}

function esc(value){
  return String(value??"").replace(/[&<>'"]/g,c=>({
    "&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"
  }[c]));
}

function safeUrl(value){
  const raw=String(value||"").trim();
  if(!raw)return"";
  try{
    const url=new URL(raw,location.origin);
    return["https:","http:"].includes(url.protocol)?url.href:"";
  }catch(_){
    return"";
  }
}

function money(value,currency="USD"){
  try{
    return new Intl.NumberFormat(undefined,{
      style:"currency",
      currency:currency||"USD"
    }).format(Number(value||0));
  }catch(_){
    return `${currency||"USD"} ${Number(value||0).toFixed(2)}`;
  }
}

function paymentLabel(value){
  const type=String(value||"").toLowerCase();
  if(type==="postpaid")return"Pay according to supplier terms";
  if(type==="guarantee")return"Card guarantee required";
  if(type==="prepaid")return"Supplier prepayment";
  return type?type:"Payment terms shown at final quote";
}

function show(viewId){
  ["resultsView","checkoutView","confirmationView"].forEach(id=>{
    $(id).classList.toggle("active",id===viewId);
  });
  if(viewId){
    $(viewId).scrollIntoView({behavior:"smooth",block:"start"});
  }
  requestHeight();
}

function focusSearch(){
  $("searchPanel").scrollIntoView({behavior:"smooth",block:"center"});
  setTimeout(()=>$("pickup").focus({preventScroll:true}),350);
}

function loading(on,title="Working",copy="Please wait."){
  $("loader").classList.toggle("show",on);
  $("loader").setAttribute("aria-hidden",on?"false":"true");
  $("loaderTitle").textContent=title;
  $("loaderCopy").textContent=copy;
}

function toast(message){
  const node=$("toast");
  node.textContent=String(message||"");
  node.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer=setTimeout(()=>node.classList.remove("show"),3600);
}

function setStatus(message,kind=""){
  const node=$("searchStatus");
  node.className=`status ${kind}`.trim();
  node.textContent=message;
  node.classList.toggle("hidden",!message);
}

function searchPayload(){
  const same=$("same").checked;
  return{
    pickupLocationText:$("pickup").value.trim(),
    dropoffLocationText:same
      ?$("pickup").value.trim()
      :$("dropoff").value.trim(),
    pickupDate:$("pickupDate").value,
    pickupTime:$("pickupTime").value,
    dropoffDate:$("dropoffDate").value,
    dropoffTime:$("dropoffTime").value,
    driverAge:Number($("driverAge").value||30),
    residenceCountry:$("residence").value,
    sameLocation:same
  };
}

function validateSearch(search){
  if(!search.pickupLocationText)return"Enter a pick-up location.";
  if(!search.sameLocation&&!search.dropoffLocationText)return"Enter a return location.";
  if(!search.pickupDate||!search.dropoffDate)return"Choose pick-up and return dates.";
  if(search.dropoffDate<search.pickupDate)return"Return date cannot be before pick-up date.";
  if(!Number.isFinite(search.driverAge)||search.driverAge<18||search.driverAge>99)return"Enter a valid driver age.";
  return"";
}

function runSearch(){
  const search=searchPayload();
  const problem=validateSearch(search);
  if(problem){
    setStatus(problem,"error");
    toast(problem);
    return;
  }

  state.search=search;
  state.quote=null;
  state.clientKey="";
  state.cardValid=false;
  setStatus("","");
  loading(true,"Searching live cars","Checking current supplier availability and rates.");
  post("CAR_RENTAL_SEARCH",{search});
}

function offerFeatureChips(offer){
  const car=offer?.car||{};
  const values=[];

  if(car.category)values.push(car.category);
  else if(car.type)values.push(car.type);

  if(car.transmission)values.push(car.transmission);
  if(car.fuel)values.push(car.fuel);
  if(Number(car.maxPassengers)>0)values.push(`${Number(car.maxPassengers)} passengers`);
  if(car.airConditioning===true)values.push("Air conditioning");

  if(car.baggage){
    const baggage=typeof car.baggage==="string"
      ?car.baggage
      :car.baggage.count||car.baggage.total||car.baggage.quantity
        ?`${car.baggage.count||car.baggage.total||car.baggage.quantity} bags`
        :"";
    if(baggage)values.push(baggage);
  }

  return [...new Set(values.filter(Boolean))]
    .slice(0,5)
    .map(value=>`<span class="chip">${esc(value)}</span>`)
    .join("");
}

function renderOffers(){
  let rows=[...state.offers];

  if($("sort").value==="low"){
    rows.sort((a,b)=>Number(a.totalAmount)-Number(b.totalAmount));
  }else if($("sort").value==="high"){
    rows.sort((a,b)=>Number(b.totalAmount)-Number(a.totalAmount));
  }

  const search=state.search||searchPayload();
  $("resultSummary").textContent=rows.length
    ?`${rows.length} live vehicle${rows.length===1?"":"s"} · ${search.pickupLocationText} · ${search.pickupDate} to ${search.dropoffDate}`
    :"No live vehicles matched this search.";

  $("offers").innerHTML=rows.length
    ?rows.map(offer=>{
      const car=offer.car||{};
      const image=safeUrl(car.images?.[0]);
      const logo=safeUrl(offer.supplier?.logoUrl);
      const pickup=offer.pickupLocation?.name||search.pickupLocationText;
      const dropoff=offer.dropoffLocation?.name||search.dropoffLocationText;
      const supplierName=offer.supplier?.name||"Rental supplier";
      const vehicleName=car.name||car.category||"Rental car";
      const classLine=[car.type,car.code].filter(Boolean).join(" · ");

      return `<article class="offer">
        <div class="car-image">
          ${image
            ?`<img src="${esc(image)}" alt="${esc(vehicleName)}">`
            :`<div class="placeholder">${esc(vehicleName)}</div>`}
        </div>

        <div class="offer-copy">
          <div class="supplier-row">
            ${logo?`<img class="supplier-logo" src="${esc(logo)}" alt="">`:""}
            <span class="supplier">${esc(supplierName)}</span>
          </div>
          <h3>${esc(vehicleName)}</h3>
          ${classLine?`<div class="vehicle-class">${esc(classLine)}</div>`:""}
          <div class="chips">${offerFeatureChips(offer)}</div>
          <div class="route-line">
            <span class="route-mark">↗</span>
            <span>${esc(pickup)} → ${esc(dropoff)}</span>
          </div>
        </div>

        <div class="price">
          <span class="price-label">Total rental price</span>
          <strong>${money(offer.totalAmount,offer.totalCurrency)}</strong>
          <span class="price-sub">${esc(paymentLabel(offer.paymentType))}</span>
          <button class="btn" type="button" data-rate="${esc(offer.id)}">Review rate</button>
        </div>
      </article>`;
    }).join("")
    :`<div class="status">No live cars were returned for this search. Change the location or dates and try again.</div>`;

  show("resultsView");
}

function selectRate(rateId){
  if(!rateId)return;
  loading(true,"Checking final rate","Revalidating the selected vehicle and supplier conditions.");
  post("CAR_RENTAL_REPRICE",{rateId});
}

function conditionText(item){
  if(!item)return"";
  if(typeof item==="string")return item;
  return item.description||item.text||item.title||item.name||"Rental condition";
}

function policyText(item){
  if(!item)return"Supplier privacy policy";
  if(typeof item==="string")return item;
  return item.name||item.title||item.description||item.text||item.url||item.href||"Supplier privacy policy";
}

function policyUrl(item){
  if(!item||typeof item==="string")return"";
  return safeUrl(item.url||item.href||"");
}

function renderSummaryVehicle(quote){
  const car=quote?.car||{};
  const image=safeUrl(car.images?.[0]);

  $("summaryVisual").innerHTML=image
    ?`<img src="${esc(image)}" alt="${esc(car.name||car.category||"Selected rental vehicle")}">`
    :`<div class="placeholder">${esc(car.name||car.category||"Selected vehicle")}</div>`;

  $("summarySupplier").textContent=quote?.supplier?.name||"Rental supplier";
  $("summaryVehicle").textContent=car.name||car.category||"Your rental";
}

function renderCheckout(){
  const quote=state.quote||{};
  const car=quote.car||{};

  $("conditions").innerHTML=(quote.conditions||[]).map(item=>`
    <div class="policy">
      <span aria-hidden="true">•</span>
      <span>
        <strong>${esc(item?.title||item?.name||"Rental condition")}</strong><br>
        ${esc(conditionText(item))}
      </span>
    </div>
  `).join("")||`<div class="status">No additional supplier conditions were returned with this quote.</div>`;

  $("policies").innerHTML=(quote.privacyPolicies||[]).map((item,index)=>{
    const url=policyUrl(item);
    const label=policyText(item);
    return `<label class="policy">
      <input type="checkbox" data-policy="${index}">
      <span>
        I acknowledge:
        ${url
          ?`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`
          :esc(label)}
      </span>
    </label>`;
  }).join("");

  renderSummaryVehicle(quote);

  $("summaryRows").innerHTML=`
    <div class="row"><span>Vehicle</span><strong>${esc(car.name||car.category||"Car")}</strong></div>
    <div class="row"><span>Supplier</span><strong>${esc(quote.supplier?.name||"Rental supplier")}</strong></div>
    <div class="row"><span>Pick-up</span><strong>${esc(quote.pickupDate||state.search?.pickupDate||"")} ${esc(quote.pickupTime||state.search?.pickupTime||"")}</strong></div>
    <div class="row"><span>Return</span><strong>${esc(quote.dropoffDate||state.search?.dropoffDate||"")} ${esc(quote.dropoffTime||state.search?.dropoffTime||"")}</strong></div>
    <div class="row"><span>Payment</span><strong>${esc(paymentLabel(quote.paymentType))}</strong></div>
    <div class="row total"><span>Total</span><strong>${money(quote.totalAmount,quote.totalCurrency)}</strong></div>`;

  const needsCard=Boolean(quote.paymentType&&String(quote.paymentType).toLowerCase()!=="postpaid");
  $("securePayment").classList.toggle("hidden",!needsCard);

  $("paymentCopy").innerHTML=needsCard
    ?`<div class="status">This supplier requires a card guarantee or supplier prepayment. Card details and 3-D Secure authentication are handled through Duffel's secure components.</div>`
    :`<div class="status ok">This rate is postpaid. Payment is handled according to the rental supplier's conditions.</div>`;

  state.cardValid=!needsCard;
  state.paymentReady=!needsCard;

  if(needsCard){
    loading(true,"Preparing secure payment","Requesting a short-lived secure payment component key.");
    post("CAR_RENTAL_PREPARE_SUPPLIER_PAYMENT",{quoteId:quote.id});
  }

  show("checkoutView");
}

function allPoliciesAccepted(){
  return Array.from(document.querySelectorAll("[data-policy]")).every(input=>input.checked);
}

function driver(){
  return{
    givenName:$("firstName").value.trim(),
    familyName:$("lastName").value.trim(),
    email:$("email").value.trim(),
    phoneNumber:$("phone").value.trim(),
    dateOfBirth:$("dob").value
  };
}

function bookingPayload(extra={}){
  return{
    quoteId:state.quote?.id||"",
    paymentType:state.quote?.paymentType||"",
    driver:driver(),
    inboundFlightNumber:$("flightNo").value.trim(),
    supplierLoyaltyProgrammeAccountNumber:$("loyaltyNo").value.trim(),
    alteaBookingId:state.bookingId,
    termsAccepted:$("acceptTerms").checked===true,
    privacyPoliciesAccepted:allPoliciesAccepted(),
    ...extra
  };
}

function validateBooking(){
  const d=driver();
  if(!d.givenName||!d.familyName||!d.email||!d.phoneNumber||!d.dateOfBirth){
    return"Complete the main driver details.";
  }
  if(!/^\+[1-9]\d{7,14}$/.test(d.phoneNumber)){
    return"Enter the driver's phone in international format, including the + country code.";
  }
  if(!$("acceptTerms").checked){
    return"Accept the rental and booking terms.";
  }
  if(!allPoliciesAccepted()){
    return"Accept every supplier privacy policy.";
  }
  if(!state.quote?.id){
    return"The final quote is missing. Re-select the car.";
  }
  return"";
}

async function payAndBook(){
  const problem=validateBooking();
  if(problem){
    toast(problem);
    return;
  }

  const paymentType=String(state.quote?.paymentType||"").toLowerCase();

  if(!paymentType||paymentType==="postpaid"){
    loading(true,"Confirming rental","Sending the validated booking to the rental supplier.");
    post("CAR_RENTAL_BOOK",bookingPayload());
    return;
  }

  if(!state.clientKey){
    toast("Secure payment is not ready yet.");
    return;
  }
  if(!state.cardValid){
    toast("Complete the secure card form.");
    return;
  }

  loading(true,"Securing card","Creating a temporary card token. Your card details stay with the secure supplier payment component.");
  try{
    window.createCardForTemporaryUse();
  }catch(error){
    loading(false);
    toast(error?.message||"Could not start secure card tokenisation.");
  }
}

function initCardForm(){
  const element=document.querySelector("duffel-card-form");
  if(!element||!state.clientKey)return;

  window.renderDuffelCardFormCustomElement({
    clientKey:state.clientKey,
    intent:"to-create-card-for-temporary-use",
    styles:{
      input:{
        default:{
          "font-family":"Montserrat, sans-serif",
          "border-radius":"8px"
        },
        focus:{
          "border-color":"#5fc7cf"
        }
      },
      label:{
        "font-family":"Montserrat, sans-serif",
        "font-weight":"700"
      }
    }
  });

  element.addEventListener("onValidateSuccess",()=>{
    state.cardValid=true;
  });

  element.addEventListener("onValidateFailure",()=>{
    state.cardValid=false;
  });

  element.addEventListener("onCreateCardForTemporaryUseFailure",event=>{
    loading(false);
    toast(event.detail?.error?.message||"Duffel could not tokenize this card.");
  });

  element.addEventListener("onCreateCardForTemporaryUseSuccess",async event=>{
    try{
      const cardId=event.detail?.data?.id;
      if(!cardId)throw new Error("Duffel did not return a temporary card ID.");

      loading(true,"Authenticating payment","Complete the 3-D Secure challenge if your bank requests it.");

      const session=await window.createThreeDSecureSession(
        state.clientKey,
        cardId,
        state.quote.id,
        [],
        true
      );

      if(!session||session.status!=="ready_for_payment"){
        throw new Error("Card authentication is not ready for payment. Please try again.");
      }

      post("CAR_RENTAL_BOOK",bookingPayload({
        threeDSecureSessionId:session.id
      }));
    }catch(error){
      loading(false);
      toast(error?.message||"3-D Secure authentication failed.");
    }
  });
}

function applyBootstrap(payload){
  state.bookingId=payload.bookingId||"";
  const search=payload.search||{};

  if(search.pickupLocationText)$("pickup").value=search.pickupLocationText;
  if(search.dropoffLocationText)$("dropoff").value=search.dropoffLocationText;
  if(search.pickupDate)$("pickupDate").value=search.pickupDate;
  if(search.dropoffDate)$("dropoffDate").value=search.dropoffDate;
  if(search.pickupTime)$("pickupTime").value=search.pickupTime;
  if(search.dropoffTime)$("dropoffTime").value=search.dropoffTime;
  if(search.driverAge)$("driverAge").value=search.driverAge;
  if(search.residenceCountry)$("residence").value=search.residenceCountry;

  syncDateMinimums();
}

function syncDateMinimums(){
  const today=new Date().toISOString().slice(0,10);
  $("pickupDate").min=today;
  $("dropoffDate").min=$("pickupDate").value||today;

  if($("dropoffDate").value&&$("pickupDate").value&&$("dropoffDate").value<$("pickupDate").value){
    $("dropoffDate").value=$("pickupDate").value;
  }
}

window.addEventListener("message",event=>{
  if(event.source!==window.parent)return;

  const message=event.data||{};
  if(message.source!==PARENT)return;

  const payload=message.payload||{};

  if(message.type==="CAR_RENTAL_BOOTSTRAP"){
    applyBootstrap(payload);
    return;
  }

  if(message.type==="CAR_RENTAL_SEARCH_RESULT"){
    loading(false);
    state.offers=payload.items||payload.offers||[];
    setStatus(
      `${state.offers.length} live vehicle${state.offers.length===1?"":"s"} found.`,
      "ok"
    );
    renderOffers();
    return;
  }

  if(message.type==="CAR_RENTAL_REPRICE_RESULT"||message.type==="CAR_RENTAL_OFFER_RESULT"){
    loading(false);
    state.quote=payload.quote||payload;
    renderCheckout();
    return;
  }

  if(message.type==="CAR_RENTAL_SUPPLIER_PAYMENT_READY"){
    loading(false);
    state.clientKey=payload.componentClientKey||"";
    if(!state.clientKey){
      toast("Secure supplier payment could not be prepared.");
      return;
    }
    setTimeout(initCardForm,0);
    return;
  }

  if(message.type==="CAR_RENTAL_BOOKING_RESULT"){
    loading(false);

    if(payload.reconciliationRequired===true){
      setStatus(
        "The rental supplier outcome is being reconciled. Do not retry or make another payment. Check My Trips for the latest status.",
        "error"
      );
      toast("Booking is being reconciled. Do not retry.");
      show("resultsView");
      return;
    }

    state.booking=payload.booking||payload;
    state.bookingId=payload.alteaBookingId||state.bookingId;

    $("confirmationRef").textContent=
      state.booking.bookingReference||
      state.booking.reference||
      state.booking.id||
      state.booking.cartId||
      "CONFIRMED";

    show("confirmationView");
    return;
  }

  if(message.type==="CAR_RENTAL_ERROR"){
    loading(false);
    setStatus(payload.message||"The car-rental request failed.","error");
    toast(payload.message||"The car-rental request failed.");
  }
});

$("same").addEventListener("change",()=>{
  $("dropField").classList.toggle("hidden",$("same").checked);
  if($("same").checked)$("dropoff").value=$("pickup").value;
  requestHeight();
});

$("pickup").addEventListener("input",()=>{
  if($("same").checked)$("dropoff").value=$("pickup").value;
});

$("pickupDate").addEventListener("change",syncDateMinimums);
$("searchBtn").addEventListener("click",runSearch);
$("sort").addEventListener("change",renderOffers);

$("offers").addEventListener("click",event=>{
  const button=event.target.closest("[data-rate]");
  if(button)selectRate(button.dataset.rate);
});

$("backBtn").addEventListener("click",()=>show("resultsView"));
$("bookBtn").addEventListener("click",payAndBook);

document.addEventListener("click",event=>{
  const focus=event.target.closest("[data-focus-search]");
  if(focus){
    focusSearch();
    return;
  }

  const nav=event.target.closest("[data-nav]");
  if(nav){
    post("CAR_RENTAL_NAVIGATE",{path:nav.dataset.nav});
  }
});

let heightTimer=0;
function requestHeight(){
  clearTimeout(heightTimer);
  heightTimer=setTimeout(()=>{
    post("CAR_RENTAL_HEIGHT",{
      height:Math.ceil(document.documentElement.scrollHeight)
    });
  },60);
}

if("ResizeObserver"in window){
  new ResizeObserver(requestHeight).observe(document.body);
}else{
  window.addEventListener("resize",requestHeight);
}

syncDateMinimums();
post("CAR_RENTAL_READY",{version:"B-011.1"});
requestHeight();

})();
