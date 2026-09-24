# Booking.apis

## INFO / LOG

- **Status:** `B-011.1 — STATICALLY VERIFIED / LIVE WIX TEST REQUIRED`
- **System:** SKANDI customer booking flow
- **Route:** `/booking`
- **Wix page:** `Booking.e8twe`
- **State:** `stateApis`
- **HTML component:** `#apisHtml`
- **HTML source:** `SKANDI_BOOKING_APIS_V2`
- **Parent source:** `SKANDI_WIX_PARENT`
- **Page controller:** `/src/pages/Booking.e8twe.js`
- **Canonical facade:** `/src/backend/SKANDI_CORE/customerBooking.web.js`
- **Canonical core:** `/src/backend/SKANDI_CORE/customerBooking.js`
- **Shared booking mapper:** `/src/backend/SKANDI_CORE/bookingMapper.js`
- **Providers:** Duffel + Stripe, with confirmed `booking_carts` as the customer → ALTEA handoff
- **Version:** `B-011.1`
- **Last verified:** `2026-09-24`

### B-011.1 convergence

This state is part of one Wix multi-state booking application, not a standalone route implementation.

Canonical chain:

`#apisHtml`
→ `postMessage`
→ `/src/pages/Booking.e8twe.js`
→ `backend/SKANDI_CORE/customerBooking.web`
→ `backend/SKANDI_CORE/customerBooking`
→ booking repositories / Duffel / Stripe
→ confirmed `booking_carts`
→ existing ALTEA sync handoff.

### Visual system

- Shared customer palette: `#022e64`, `#0b3a7a`, `#285ca8`, `#5FC7CF`, `#d7e6ff`, `#f6faff`, `#f7faff`, `#dbe3ef`.
- Shared seven-step progress treatment: Offer → Extras → Transfer → Travelers → Seats → Payment → Done.
- Global customer header/footer remain owned by `masterPage.js`.
- This embed contains no duplicate global chrome.

### State-specific correction

**Travelers / APIS**

B-011.1 preserves the existing message source and state/component IDs while aligning the implementation to the canonical customerBooking payloads.

---

## COMPLETE INTENDED LIVE HTML SOURCE

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="color-scheme" content="light">
<meta name="theme-color" content="#022e64">
<title>Travelers · SKANDI Booking B-011.1</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">

<style>

:root{
  --sk-blue:#022e64;
  --sk-blue2:#0b3a7a;
  --sk-blue-soft:#285ca8;
  --sk-cyan:#5FC7CF;
  --sk-light:#d7e6ff;
  --sk-pale:#f6faff;
  --sk-bg:#f7faff;
  --sk-border:#dbe3ef;
  --sk-border-soft:#eef2f7;
  --sk-text:#111827;
  --sk-body:#475467;
  --sk-muted:#667085;
  --sk-ok:#087443;
  --sk-warn:#a15c00;
  --sk-danger:#b42318;
  --sk-ink:#03111f;
  --sk-shadow:0 8px 26px rgba(2,46,100,.08);
  --sk-shadow-strong:0 18px 48px rgba(2,46,100,.14);
  --sk-radius:18px;
  --sk-max:1180px;
}
*{box-sizing:border-box}
html{background:#fff;scroll-behavior:smooth}
body{
  margin:0;
  background:#fff;
  color:var(--sk-text);
  font-family:Montserrat,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
button,input,select,textarea{font:inherit}
button{cursor:pointer}
button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible,a:focus-visible{
  outline:3px solid rgba(95,199,207,.42);
  outline-offset:2px;
}
.flow-shell{max-width:var(--sk-max);margin:0 auto;padding:28px 24px 72px}
.flow-stepper{
  position:relative;
  display:grid;
  grid-template-columns:repeat(7,1fr);
  gap:4px;
  margin:0 0 30px;
  padding:0 8px;
}
.flow-stepper::before{
  content:"";
  position:absolute;
  top:15px;
  left:7%;
  right:7%;
  height:2px;
  background:var(--sk-border);
}
.flow-step{position:relative;z-index:1;text-align:center}
.flow-dot{
  width:30px;height:30px;margin:0 auto 7px;
  display:grid;place-items:center;
  border:2px solid var(--sk-border);
  border-radius:50%;
  background:#fff;
  color:var(--sk-muted);
  font-size:10px;font-weight:900;
}
.flow-step.done .flow-dot{border-color:var(--sk-blue);background:var(--sk-blue);color:#fff}
.flow-step.active .flow-dot{
  border-color:var(--sk-cyan);
  background:var(--sk-blue);
  color:#fff;
  box-shadow:0 0 0 5px rgba(95,199,207,.16);
}
.flow-label{
  color:var(--sk-muted);
  font-size:9px;
  font-weight:800;
  letter-spacing:.06em;
  text-transform:uppercase;
}
.flow-step.done .flow-label,.flow-step.active .flow-label{color:var(--sk-blue)}
.page-hero{
  position:relative;
  overflow:hidden;
  margin-bottom:22px;
  padding:34px 36px;
  border:1px solid var(--sk-border);
  border-radius:22px;
  background:
    radial-gradient(circle at 92% 0%,rgba(95,199,207,.16),transparent 28%),
    linear-gradient(135deg,#fff 0%,var(--sk-pale) 64%,#edf7f9 100%);
  box-shadow:var(--sk-shadow);
}
.page-hero::after{
  content:"";
  position:absolute;left:36px;right:36px;bottom:0;height:2px;
  background:linear-gradient(90deg,var(--sk-cyan),rgba(209,188,152,.75),transparent);
}
.eyebrow{
  display:flex;align-items:center;gap:10px;
  color:var(--sk-blue);
  font-size:10px;font-weight:900;letter-spacing:.16em;text-transform:uppercase;
}
.eyebrow::before{content:"";width:30px;height:2px;border-radius:99px;background:var(--sk-cyan)}
.page-hero h1{
  margin:9px 0 10px;
  color:var(--sk-blue);
  font-size:clamp(31px,4.6vw,48px);
  line-height:1;
  letter-spacing:-.045em;
}
.page-hero p{max-width:760px;margin:0;color:var(--sk-body);font-size:13px;line-height:1.7}
.status{
  display:none;
  margin:0 0 18px;
  padding:13px 15px;
  border:1px solid var(--sk-border);
  border-radius:12px;
  background:var(--sk-bg);
  color:var(--sk-muted);
  font-size:11px;
  line-height:1.55;
  white-space:pre-line;
}
.status.show{display:block}
.status.ok{background:#ecfdf3;border-color:#abefc6;color:var(--sk-ok)}
.status.warn{background:#fffaeb;border-color:#fedf89;color:var(--sk-warn)}
.status.error{background:#fff1f0;border-color:#ffd5d2;color:var(--sk-danger)}
.panel{
  border:1px solid var(--sk-border);
  border-radius:18px;
  background:#fff;
  box-shadow:var(--sk-shadow);
}
.panel-head{
  padding:21px 22px 18px;
  border-bottom:1px solid var(--sk-border-soft);
}
.panel-head h2,.panel h2,.panel h3{margin:0;color:var(--sk-blue);letter-spacing:-.025em}
.panel-head h2{font-size:20px}
.panel-head p{margin:7px 0 0;color:var(--sk-body);font-size:11px;line-height:1.6}
.panel-body{padding:22px}
.grid-2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
.grid-3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
.summary-card{
  padding:18px;
  border:1px solid var(--sk-border-soft);
  border-radius:14px;
  background:linear-gradient(180deg,#fff,var(--sk-bg));
}
.summary-card h3{font-size:14px}
.summary-card p{margin:7px 0 0;color:var(--sk-body);font-size:10px;line-height:1.55}
.kicker{
  margin-bottom:6px;
  color:var(--sk-cyan);
  font-size:8px;font-weight:900;letter-spacing:.13em;text-transform:uppercase;
}
.price{
  color:var(--sk-blue);
  font-size:26px;font-weight:800;letter-spacing:-.045em;
}
.meta-list{display:grid;gap:7px;margin-top:12px}
.meta-row{display:flex;justify-content:space-between;gap:16px;color:var(--sk-body);font-size:10px}
.meta-row strong{color:var(--sk-blue);text-align:right}
.actions{
  display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;
  margin-top:20px;padding-top:18px;border-top:1px solid var(--sk-border-soft);
}
.actions-right{display:flex;gap:8px;flex-wrap:wrap;margin-left:auto}
.btn{
  min-height:43px;
  padding:0 16px;
  border:1px solid var(--sk-blue);
  border-radius:10px;
  background:var(--sk-blue);
  color:#fff;
  font-size:10px;font-weight:850;
}
.btn:hover{background:var(--sk-blue2)}
.btn.secondary{
  border-color:var(--sk-border);
  background:#fff;
  color:var(--sk-blue);
}
.btn.secondary:hover{border-color:rgba(95,199,207,.65);background:var(--sk-pale)}
.btn:disabled{opacity:.55;cursor:not-allowed}
.field{min-width:0}
.field label{
  display:block;margin:0 0 6px;color:var(--sk-muted);
  font-size:8px;font-weight:850;letter-spacing:.08em;text-transform:uppercase;
}
.field input,.field select,.field textarea{
  width:100%;min-height:42px;padding:9px 11px;
  border:1px solid var(--sk-border);
  border-radius:9px;
  background:#fff;color:var(--sk-text);
  font-size:10px;
}
.field textarea{min-height:88px;resize:vertical}
.field input:focus,.field select:focus,.field textarea:focus{
  border-color:var(--sk-cyan);
  box-shadow:0 0 0 3px rgba(95,199,207,.11);
  outline:0;
}
.checkline{
  display:flex;align-items:flex-start;gap:10px;
  margin-top:17px;padding:14px;
  border:1px solid var(--sk-border-soft);
  border-radius:11px;background:var(--sk-pale);
  color:var(--sk-body);font-size:10px;line-height:1.55;
}
.checkline input{width:17px;height:17px;flex:0 0 17px;margin-top:1px;accent-color:var(--sk-blue)}
.option-card{
  display:grid;
  grid-template-columns:auto minmax(0,1fr) auto;
  gap:15px;
  align-items:center;
  padding:18px;
  border:1px solid var(--sk-border);
  border-radius:15px;
  background:#fff;
  transition:.18s ease;
}
.option-card:hover{transform:translateY(-1px);box-shadow:var(--sk-shadow)}
.option-card.selected{border-color:var(--sk-cyan);background:var(--sk-pale)}
.option-card input[type=checkbox],.option-card input[type=radio]{width:18px;height:18px;accent-color:var(--sk-blue)}
.option-card h3{font-size:14px}
.option-card p{margin:5px 0 0;color:var(--sk-body);font-size:10px;line-height:1.5}
.option-price{color:var(--sk-blue);font-size:14px;font-weight:800;white-space:nowrap}
.empty{
  padding:34px;
  border:1px dashed var(--sk-border);
  border-radius:14px;
  background:var(--sk-bg);
  color:var(--sk-muted);
  text-align:center;
  font-size:11px;line-height:1.6;
}
.route-list{display:grid;gap:10px}
.route-item{
  display:grid;grid-template-columns:96px minmax(0,1fr) auto;gap:14px;align-items:center;
  padding:14px;border:1px solid var(--sk-border-soft);border-radius:12px;background:var(--sk-bg)
}
.route-code{color:var(--sk-blue);font-size:16px;font-weight:850}
.route-main{color:var(--sk-text);font-size:10px;line-height:1.5}
.route-side{color:var(--sk-muted);font-size:9px;text-align:right}
.badge{
  display:inline-flex;align-items:center;min-height:25px;padding:0 9px;
  border:1px solid rgba(95,199,207,.45);border-radius:999px;
  background:var(--sk-pale);color:var(--sk-blue);
  font-size:8px;font-weight:850;letter-spacing:.04em;text-transform:uppercase;
}
.loader{
  position:fixed;inset:0;z-index:100;display:none;place-items:center;
  background:rgba(255,255,255,.78);backdrop-filter:blur(5px);
}
.loader.active{display:grid}
.loader-card{
  min-width:230px;padding:22px;border:1px solid var(--sk-border);border-radius:16px;
  background:#fff;box-shadow:var(--sk-shadow-strong);text-align:center;color:var(--sk-blue);
  font-size:10px;font-weight:800
}
.spinner{
  width:28px;height:28px;margin:0 auto 12px;border:3px solid var(--sk-border);
  border-top-color:var(--sk-cyan);border-radius:50%;animation:spin .8s linear infinite
}
@keyframes spin{to{transform:rotate(360deg)}}
@media(max-width:820px){
  .grid-2,.grid-3{grid-template-columns:1fr}
  .route-item{grid-template-columns:1fr}
  .route-side{text-align:left}
}
@media(max-width:680px){
  .flow-shell{padding:18px 14px 54px}
  .flow-label{display:none}
  .flow-stepper{margin-bottom:18px}
  .page-hero{padding:27px 20px}
  .page-hero::after{left:20px;right:20px}
  .panel-body{padding:17px}
  .actions{display:grid;grid-template-columns:1fr}
  .actions-right{display:grid;grid-template-columns:1fr;margin-left:0}
  .btn{width:100%}
}
@media(prefers-reduced-motion:reduce){
  html{scroll-behavior:auto}
  *,*::before,*::after{animation:none!important;transition-duration:.01ms!important}
}


.traveler-stack{display:grid;gap:14px}
.traveler-card{border:1px solid var(--sk-border);border-radius:16px;background:#fff;box-shadow:var(--sk-shadow)}
.traveler-card .panel-head{background:linear-gradient(180deg,#fff,var(--sk-pale));border-radius:16px 16px 0 0}
.rules-box{margin-bottom:16px;padding:14px;border:1px solid rgba(95,199,207,.38);border-radius:12px;background:var(--sk-pale);color:var(--sk-body);font-size:10px;line-height:1.6}
.required{color:var(--sk-danger)}

</style>
</head>
<body>
<div class="loader" id="pageLoader"><div class="loader-card"><div class="spinner"></div><div id="loaderText">Updating your booking…</div></div></div>
<div class="flow-shell">
<div class="flow-stepper" aria-label="Booking progress"><div class="flow-step done"><div class="flow-dot">✓</div><div class="flow-label">Offer</div></div><div class="flow-step done"><div class="flow-dot">✓</div><div class="flow-label">Extras</div></div><div class="flow-step done"><div class="flow-dot">✓</div><div class="flow-label">Transfer</div></div><div class="flow-step active"><div class="flow-dot">4</div><div class="flow-label">Travelers</div></div><div class="flow-step "><div class="flow-dot">5</div><div class="flow-label">Seats</div></div><div class="flow-step "><div class="flow-dot">6</div><div class="flow-label">Payment</div></div><div class="flow-step "><div class="flow-dot">7</div><div class="flow-label">Done</div></div></div>
<section class="page-hero">
  <div class="eyebrow">BOOKING · STEP 4</div>
  <h1>Who is travelling?</h1>
  <p>Enter traveler and contact details exactly as they should appear in the reservation.</p>
</section>
<div id="status" class="status show">Loading…</div>
<main id="root"></main>
</div>
<script>

(()=>{
"use strict";
const SOURCE="SKANDI_BOOKING_APIS_V2",PARENT="SKANDI_WIX_PARENT";
let CART=null,RULES=null,busy=false;
const $=id=>document.getElementById(id);
function post(type,payload={}){window.parent.postMessage({source:SOURCE,type,...payload},"*")}
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
  $("backBtn").onclick=()=>post("BOOKING_NAVIGATE",{path:isHotel()?"/home":"/booking/extras"});
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
  const m=e.data||{};if(m.source!==PARENT)return;
  if(m.type==="APIS_CART_RULES_LOADED"){busy=false;loading(false);render(m.payload?.cart||{},m.payload?.rules||{})}
  if(m.type==="APIS_REQUIREMENTS_RESULT"){RULES=m.payload?.rules||m.payload||{};const box=$("ruleSummary");if(box)box.textContent=rulesText();status(RULES.status==="REVIEW"?(RULES.notices||[]).join("\n"):"Requirements checked.",RULES.status==="REVIEW"?"warn":"ok")}
  if(m.type==="BOOKING_ERROR"){busy=false;loading(false);status(m.message||"Traveler details could not be saved.","error")}
});
post("APIS_HTML_READY");
})();

</script>
</body>
</html>
```
