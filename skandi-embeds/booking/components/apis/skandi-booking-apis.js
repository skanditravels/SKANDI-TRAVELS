

(()=>{
"use strict";
const SOURCE="SKANDI_BOOKING_APIS_V2",PARENT="SKANDI_WIX_PARENT";
let CART=null,RULES=null,busy=false;
const $=id=>document.getElementById(id);
let wire=null;
function post(type,payload={}){if(wire&&!wire.before(type))return;window.parent.postMessage({source:SOURCE,type,requestId:wire?.id||"",...payload},"*")}
function esc(v=""){return String(v??"").replace(/[&<>"']/g,s=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[s]))}
function status(m,c=""){const e=$("status");e.textContent=m;e.className="status show "+c}
function loading(show,text="Saving traveler details…"){const l=$("pageLoader");$("loaderText").textContent=text;l.classList.toggle("active",show)}
function isHotel(){return String(CART?.productType||"").toUpperCase()==="HOTEL_ONLY"}
function expectedTravelers(){
  if(isHotel()){
    const c=Number(CART?.travelerCount||CART?.search?.guests||CART?.search?.adults||1);
    return Array.from({length:Math.max(1,c)},(_,i)=>({id:`HOTEL_GUEST_${i+1}`}));
  }
  const p=CART?.selectedOffer?.passengers;
  if(Array.isArray(p)&&p.length)return p;
  const c=Number(CART?.travelerCount||CART?.search?.passengerCount||1);
  return Array.from({length:Math.max(1,c)},(_,i)=>({id:String(i+1)}));
}
function basicExisting(i){return Array.isArray(CART?.travelers)?(CART.travelers[i]||{}):{}}
function rulesText(){
  const r=RULES||{};
  return [r.summary,r.providerStatus,(r.notices||[]).join("\n")].filter(Boolean).join("\n")||"Enter traveler details exactly as they appear on the travel document.";
}
function travelerForm(p,i){
  const old=basicExisting(i);
  const flight=!isHotel();
  return `<article class="traveler-card" data-traveler="${i}" data-id="${esc(p.id||String(i+1))}">
    <div class="panel-head"><h2>Traveler ${i+1}</h2><p>${flight?"Enter legal identity and travel-document details.":"Enter the hotel guest's legal name and contact-relevant details."}</p></div>
    <div class="panel-body">
      <div class="grid-3">
        ${flight?`<div class="field"><label>Title <span class="required">*</span></label><select data-f="title"><option value="mr">Mr</option><option value="ms">Ms</option><option value="mrs">Mrs</option><option value="miss">Miss</option><option value="dr">Dr</option></select></div>`:""}
        <div class="field"><label>First name <span class="required">*</span></label><input data-f="givenName" autocomplete="given-name" value="${esc(old.givenName||old.firstName||"")}"></div>
        <div class="field"><label>Last name <span class="required">*</span></label><input data-f="familyName" autocomplete="family-name" value="${esc(old.familyName||old.lastName||"")}"></div>
        <div class="field"><label>Date of birth <span class="required">*</span></label><input data-f="bornOn" type="date" value="${esc(old.bornOn||old.dateOfBirth||"")}"></div>
        <div class="field"><label>Gender <span class="required">*</span></label><select data-f="gender"><option value="">Choose</option><option value="m" ${old.gender==="m"?"selected":""}>Male</option><option value="f" ${old.gender==="f"?"selected":""}>Female</option></select></div>
        <div class="field"><label>Nationality ${flight?'<span class="required">*</span>':""}</label><input data-f="nationality" maxlength="2" placeholder="SE" value="${esc(old.nationality||"")}"></div>
        ${flight?`
        <div class="field"><label>Document type <span class="required">*</span></label><select data-f="documentType"><option value="passport">Passport</option><option value="national_identity_card">National identity card</option></select></div>
        <div class="field"><label>Document number <span class="required">*</span></label><input data-f="documentNumber" autocomplete="off"></div>
        <div class="field"><label>Issuing country <span class="required">*</span></label><input data-f="issuingCountryCode" maxlength="2" placeholder="SE"></div>
        <div class="field"><label>Document expiry <span class="required">*</span></label><input data-f="expiresOn" type="date"></div>`:""}
      </div>
    </div>
  </article>`;
}
function render(cart,rules){
  CART=cart||{};RULES=rules||{};
  const pax=expectedTravelers();
  $("root").innerHTML=`
    <div class="grid-2" style="grid-template-columns:minmax(0,1.6fr) minmax(280px,.7fr)">
      <section>
        <div class="rules-box" id="ruleSummary">${esc(rulesText())}</div>
        <div class="traveler-stack">${pax.map(travelerForm).join("")}</div>
      </section>
      <aside class="panel" style="align-self:start">
        <div class="panel-head"><h2>Contact details</h2><p>Used for booking updates and supplier servicing.</p></div>
        <div class="panel-body">
          <div class="field"><label>Email <span class="required">*</span></label><input id="email" type="email" autocomplete="email"></div>
          <div class="field" style="margin-top:12px"><label>Mobile phone <span class="required">*</span></label><input id="phone" type="tel" autocomplete="tel" placeholder="+12125551234"></div>
          ${!isHotel()?`<button class="btn secondary" id="refreshRulesBtn" type="button" style="width:100%;margin-top:14px">Check document requirements</button>`:""}
          <div class="actions" style="margin-top:18px">
            <button class="btn secondary" id="backBtn" type="button">← Back</button>
            <button class="btn" id="continueBtn" type="button">Save & continue →</button>
          </div>
        </div>
      </aside>
    </div>`;
  if($("refreshRulesBtn"))$("refreshRulesBtn").onclick=()=>post("APIS_RULES_REFRESH",{travelers:collect()});
  $("backBtn").onclick=()=>post("BOOKING_NAVIGATE",{path:"/booking/transfer"});
  $("continueBtn").onclick=()=>{
    if(busy)return;
    const travelers=collect(),errors=validate(travelers);
    if(errors.length)return status("Please correct:\n"+errors.join("\n"),"warn");
    busy=true;loading(true,isHotel()?"Saving guest details…":"Saving traveler details and revalidating price…");
    post("APIS_SAVE_AND_CONTINUE",{contact:{email:$("email").value.trim(),phone:$("phone").value.trim(),phoneNumber:$("phone").value.trim()},travelers});
  };
  status(isHotel()?"Guest details ready.":"Traveler details ready.","ok");
}
function collect(){
  return [...document.querySelectorAll("[data-traveler]")].map((el,i)=>{
    const get=name=>String(el.querySelector(`[data-f="${name}"]`)?.value||"").trim();
    const id=el.dataset.id||String(i+1);
    const base={
      id,
      passengerId:id,
      title:get("title"),
      gender:get("gender"),
      givenName:get("givenName"),
      familyName:get("familyName"),
      firstName:get("givenName"),
      lastName:get("familyName"),
      bornOn:get("bornOn"),
      dateOfBirth:get("bornOn"),
      nationality:get("nationality").toUpperCase()
    };
    if(isHotel())return base;
    const doc={
      type:get("documentType")||"passport",
      uniqueIdentifier:get("documentNumber").toUpperCase(),
      number:get("documentNumber").toUpperCase(),
      issuingCountryCode:get("issuingCountryCode").toUpperCase(),
      expiresOn:get("expiresOn"),
      expiryDate:get("expiresOn")
    };
    return {...base,identityDocuments:[doc],documents:[doc]};
  });
}
function validate(list){
  const e=[];
  list.forEach((t,i)=>{
    if(!t.givenName)e.push(`Traveler ${i+1}: first name`);
    if(!t.familyName)e.push(`Traveler ${i+1}: last name`);
    if(!t.bornOn)e.push(`Traveler ${i+1}: date of birth`);
    if(!t.gender)e.push(`Traveler ${i+1}: gender`);
    if(!isHotel()){
      if(!t.title)e.push(`Traveler ${i+1}: title`);
      if(!/^[A-Z]{2}$/.test(t.nationality||""))e.push(`Traveler ${i+1}: nationality must be a two-letter code`);
      const d=t.identityDocuments?.[0]||{};
      if(!d.uniqueIdentifier)e.push(`Traveler ${i+1}: document number`);
      if(!/^[A-Z]{2}$/.test(d.issuingCountryCode||""))e.push(`Traveler ${i+1}: issuing country must be a two-letter code`);
      if(!d.expiresOn)e.push(`Traveler ${i+1}: document expiry`);
    }
  });
  const email=$("email").value.trim(),phone=$("phone").value.trim();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))e.push("Valid contact email");
  if(!/^\+[1-9]\d{7,14}$/.test(phone))e.push("Mobile phone in international format, for example +12125551234");
  return e;
}
window.addEventListener("message",e=>{
  const m=e.data||{};if(e.source!==window.parent||m.source!==PARENT||m.requestId&&m.requestId!==wire?.id)return;
  if(m.type==="APIS_CART_RULES_LOADED"){busy=false;loading(false);render(m.payload?.cart||{},m.payload?.rules||{})}
  if(m.type==="APIS_REQUIREMENTS_RESULT"){RULES=m.payload?.rules||m.payload||{};const box=$("ruleSummary");if(box)box.textContent=rulesText();status(RULES.status==="REVIEW"?(RULES.notices||[]).join("\n"):"Requirements checked.",RULES.status==="REVIEW"?"warn":"ok")}
  if(m.type==="BOOKING_ERROR"){busy=false;loading(false);status(m.message||"Traveler details could not be saved.","error")}
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

startBookingBridge("APIS_HTML_READY",["APIS_CART_RULES_LOADED"]);
})();

