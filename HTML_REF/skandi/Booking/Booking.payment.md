# SKANDI INFO / LOG — V12 journey integration

- Source identity: `/HTML_REF/skandi/Booking/Booking.payment.md`. System: SKANDI. Complete intended source; HTML_REF is never imported at runtime.
- Page: Booking; route `/booking`; state `statePayment`; observed HTML `#paymentEmbed`. Paste `embed/Booking/payment.html` into this existing component.
- Runtime: `/src/pages/Booking.e8twe.js`, state box `#bookingFlowStates`; shared search handoff `public/bookingSearch.js`; authentication popup `public/customerAuthUi.js` remains canonical.
- Facade: unchanged `backend/SKANDI_CORE/customerBooking.web.js`; implementation: changed `customerBooking.js`, existing `bookingMapper.js`, `bookingCart.js`, `bookingSecurity.js`, `bookingReconciliation.js`, `duffelAir.js`, `duffelGround.js`, `stripeClient.js`, `supabaseServer.js`.
- Database: existing owned `booking_carts`, cart-item/payment repositories and confirmed-cart ALTEA handoff; no SQL/schema/RLS changes. Database transport, ownership checks and traveler encryption remain canonical.
- Authorization: public search; cart creation requires a resolved server member; cart reads and booking mutations retain SiteMember and owned-cart checks. Client-supplied IDs, amounts, step names and payment messages are never payment authority.
- Sequence: `stateOffer → stateExtras → stateTransfer → stateApis → stateSeatMap → statePayment → stateConfirmation`. Optional `stateDocuments` remains reachable after confirmation. The duplicate confirmation in the request is represented by one existing confirmation state.
- Required editor migration: the published seat state is currently named `seatMapEmbed`. Rename that **state** to `stateSeatMap`; keep HTML component `#seatmapEmbed`. The prior controller's `stateSeats` does not exist on the published page. Missing states now produce an explicit installation error.
- Lifecycle: existing state READY/LOADED contracts remain; `BOOKING_HOST_READY`, `BOOKING_STEP_ACTIVE`, `BOOKING_STEP_INACTIVE`, `BOOKING_RETRY`, and request IDs provide reconnect/recovery. READY retries are read-only; hidden-state mutations, duplicate in-flight actions and forward URL jumps are blocked. Uncertain writes are checked before resubmission.
- Search contract: `BOOKING_SEARCH_LOADING`, `BOOKING_SEARCH_RESULTS`, `BOOKING_SEARCH_SELECT`, `BOOKING_SEARCH_REFRESH`, `BOOKING_BACK_TO_RESULTS`; stateOffer displays results and then the selected cart. Selection resolves only an ID from the controller's current server results.
- Hotel-only carts now begin at Offer, show real empty extras/transfer states, collect the provider-quoted guest count, and show a seats-not-applicable state before Payment. The core never requests airline seats for hotel-only carts.
- Payment recovery retrieves the existing owned PaymentIntent through the canonical Stripe client. The iframe accepts an already authorized intent only for server-side completion; it does not reauthorize it. Processing/reconciliation remains in Payment; only server `Confirmed` status can open Confirmation. Stripe return URL includes the cart ID.
- Transfer limitation: the existing canonical transfer service currently returns no options; users see Transfer and explicitly continue without a transfer. No fictitious transfer service was added.
- Status: **VERIFIED locally** with Node.js + jsdom and simulated Wix/provider adapters; **STATICALLY VERIFIED** import/export and message contracts; **REQUIRES LIVE TEST** in Wix after installation. This source package has not been deployed.
- Source authority: `skanditravels/SKANDI-TRAVELS`, `main`, commit `e8dd84a3af35797062be60f021cba83a4fc21bf6`, compared with the supplied complete HTML and approved Home/Country V12 repairs. Existing approved source history is preserved below.
- Last inspected: 2026-10-07 UTC. Published route/component configuration, Home/Country proxy exports, and Supabase public catalog/schema were inspected read-only. No GitHub, Wix or database writes were performed.
- Ownership: HTML → postMessage → Wix page controller → `backend/SKANDI_CORE/*.web.js` → canonical core/client → Supabase / existing providers. The site master retains global header/footer, account and settings ownership.

## Preserved history — earlier architecture/status is superseded above

# Booking.payment

## INFO / LOG

- **Status:** `B-011.1 — STATICALLY VERIFIED / LIVE WIX TEST REQUIRED`
- **System:** SKANDI customer booking flow
- **Route:** `/booking`
- **Wix page:** `Booking.e8twe`
- **State:** `statePayment`
- **HTML component:** `#paymentEmbed`
- **HTML source:** `SKANDI_BOOKING_PAYMENT`
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

`#paymentEmbed`
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

**Payment**

B-011.1 preserves the existing message source and state/component IDs while aligning the implementation to the canonical customerBooking payloads.

---

## COMPLETE INTENDED LIVE HTML SOURCE


## CHANGE LOG — 2026-10-07 UTC

Retains Stripe Elements and canonical server commit. Return navigation retains cartId; existing authorized intents are completed without another confirmPayment. Uncertain/processing/reconciliation responses provide a status check and do not claim confirmation or invite another charge. All seven changed states use parent-window verification, request IDs, bounded connection feedback and explicit read-only recovery. Existing design and message sources are preserved.

## COMPLETE INTENDED HTML

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="color-scheme" content="light">
<meta name="theme-color" content="#022e64">
<title>Payment · SKANDI Booking B-011.1</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<script src="https://js.stripe.com/v3/"></script>
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


.payment-grid{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(300px,.65fr);gap:16px;align-items:start}
#payment-element{min-height:200px}
.secure-note{
  display:flex;gap:9px;align-items:flex-start;margin-top:14px;padding:11px;
  border:1px solid var(--sk-border-soft);border-radius:10px;background:var(--sk-bg);
  color:var(--sk-muted);font-size:8px;line-height:1.5
}
.secure-dot{width:9px;height:9px;flex:0 0 9px;margin-top:2px;border-radius:50%;background:var(--sk-cyan)}
@media(max-width:820px){.payment-grid{grid-template-columns:1fr}}

</style>
<style id="booking-v12-style">
#status{white-space:pre-line}.status[hidden]{display:none!important}.status button{margin:8px 8px 0 0}.results-toolbar{display:flex;gap:16px;flex-wrap:wrap;align-items:center;justify-content:space-between;margin:0 0 20px}.results-toolbar label{display:flex;gap:8px;align-items:center;font-size:13px}.results-toolbar input,.results-toolbar select{font:inherit;min-height:44px;border:1px solid var(--sk-line,#e6e9ee);border-radius:12px;padding:9px 12px;max-width:100%}.result-list{display:grid;gap:18px}.result-card{display:grid;grid-template-columns:minmax(0,1fr) 210px;border:1px solid #e6e9ee;border-radius:20px;overflow:hidden;background:#fff;box-shadow:0 8px 30px rgba(2,46,100,.05)}.result-main{padding:24px}.result-main h3{font-family:'Playfair Display',Georgia,serif;font-size:25px;line-height:1.25;margin:12px 0}.result-main p{font-size:13px;line-height:1.7;color:#50627a}.result-side{padding:24px;background:#f6faff;display:flex;flex-direction:column;justify-content:center;gap:12px;align-items:stretch}.result-side .price{font-size:27px}.result-image{float:left;width:132px;height:110px;object-fit:cover;border-radius:12px;margin:0 20px 12px 0}.result-meta{font-size:12px;color:#50627a;line-height:1.7}.results-count{font-weight:700;color:#022e64}.btn:focus-visible,input:focus-visible,select:focus-visible{outline:3px solid #5fc7cf;outline-offset:3px}@media(max-width:680px){.result-card{grid-template-columns:1fr}.result-side{border-top:1px solid #e6e9ee}.result-main,.result-side{padding:18px}.result-image{float:none;width:100%;height:160px;margin:0 0 12px}.results-toolbar{align-items:stretch}.results-toolbar label{flex:1 1 100%;justify-content:space-between}}@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important;scroll-behavior:auto!important}}
</style>
</head>
<body>
<div class="loader" id="pageLoader"><div class="loader-card"><div class="spinner"></div><div id="loaderText">Updating your booking…</div></div></div>
<div class="flow-shell">
<div class="flow-stepper" aria-label="Booking progress"><div class="flow-step done"><div class="flow-dot">✓</div><div class="flow-label">Offer</div></div><div class="flow-step done"><div class="flow-dot">✓</div><div class="flow-label">Extras</div></div><div class="flow-step done"><div class="flow-dot">✓</div><div class="flow-label">Transfer</div></div><div class="flow-step done"><div class="flow-dot">✓</div><div class="flow-label">Travelers</div></div><div class="flow-step done"><div class="flow-dot">✓</div><div class="flow-label">Seats</div></div><div class="flow-step active"><div class="flow-dot">6</div><div class="flow-label">Payment</div></div><div class="flow-step "><div class="flow-dot">7</div><div class="flow-label">Done</div></div></div>
<section class="page-hero">
  <div class="eyebrow">BOOKING · STEP 6</div>
  <h1>Secure payment</h1>
  <p>Review the server-authoritative total, authorize payment, and let SKANDI create the live supplier reservation.</p>
</section>
<div id="status" class="status show">Loading…</div>
<main id="root"></main>
</div>
<script>

(()=>{
"use strict";
const SOURCE="SKANDI_BOOKING_PAYMENT",PARENT="SKANDI_WIX_PARENT";
let CART=null,PAYMENT=null,stripe=null,elements=null,paymentElement=null,busy=false,commitPosted=false;
const $=id=>document.getElementById(id);
let wire=null;
function post(type,payload={}){if(wire&&!wire.before(type))return;window.parent.postMessage({source:SOURCE,type,requestId:wire?.id||"",...payload},"*")}
function esc(v=""){return String(v??"").replace(/[&<>"']/g,s=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[s]))}
function status(m,c=""){const e=$("status");e.textContent=m;e.className="status show "+c}
function loading(show,text="Processing payment…"){const l=$("pageLoader");$("loaderText").textContent=text;l.classList.toggle("active",show)}
function money(amount,currency){const n=Number(amount);if(!Number.isFinite(n))return [currency||"",amount||""].filter(Boolean).join(" ");try{return new Intl.NumberFormat(undefined,{style:"currency",currency:currency||"USD"}).format(n)}catch(_){return `${currency||""} ${n.toFixed(2)}`.trim()}}
function destroy(){try{paymentElement?.unmount()}catch(_){} paymentElement=null;elements=null;stripe=null}
function render(session={}){
  CART=session.cart||{};PAYMENT=session.payment||{};
  if(!window.Stripe||!PAYMENT.publishableKey||!PAYMENT.clientSecret||!PAYMENT.paymentIntentId){status("Secure payment could not be initialized.","error");return}
  destroy();commitPosted=false;
  const authorized=["requires_capture","succeeded"].includes(PAYMENT.status);
  $("root").innerHTML=`
    <div class="payment-grid">
      <section class="panel">
        <div class="panel-head"><h2>Secure payment</h2><p>Authorize the current total. SKANDI creates the supplier reservation before final capture when supported by the booking flow.</p></div>
        <div class="panel-body">
          <div id="payment-element"></div>
          <label class="checkline"><input id="terms" type="checkbox"><span>I accept the booking terms, supplier fare/rate rules, cancellation and refund conditions, privacy policy and payment terms.</span></label>
          <div class="secure-note"><span class="secure-dot"></span><span>Card details are handled by the secure payment processor and are not stored in this HTML component.</span></div>
          <div class="actions">
            <button class="btn secondary" id="backBtn" type="button">← Back</button>
            <div class="actions-right"><button class="btn" id="payBtn" type="button" disabled>Authorize ${esc(money(PAYMENT.amount,PAYMENT.currency||CART.currency))}</button></div>
          </div>
        </div>
      </section>
      <aside class="panel">
        <div class="panel-head"><h2>Booking summary</h2><p>Your current trip total.</p></div>
        <div class="panel-body">
          <div class="price">${esc(money(CART.total??PAYMENT.amount,CART.currency||PAYMENT.currency))}</div>
          <div class="meta-list">
            <div class="meta-row"><span>Product</span><strong>${esc(CART.productType||"Travel booking")}</strong></div>
            <div class="meta-row"><span>Status</span><strong>${esc(CART.status||"Payment pending")}</strong></div>
            <div class="meta-row"><span>Booking cart</span><strong>${esc(CART.cartId||"")}</strong></div>
          </div>
          <div class="secure-note"><span class="secure-dot"></span><span>If the booking needs review, check its status or contact SKANDI before making another payment.</span></div>
        </div>
      </aside>
    </div>`;
  $("backBtn").onclick=()=>post("BOOKING_NAVIGATE",{path:"/booking/seats"});
  $("payBtn").onclick=submit;
  if(authorized){$("payment-element").textContent="Payment is authorized. Complete your reservation below.";$("payBtn").textContent="Complete reservation";$("payBtn").disabled=false;status("Payment authorized. Your reservation still needs to be completed.","ok");return;}
  if(PAYMENT.status==="processing"){status("Your payment is processing. Check booking status before trying again.","warn");showPaymentStatusCheck();return;}
  try{
    stripe=Stripe(PAYMENT.publishableKey);
    elements=stripe.elements({
      clientSecret:PAYMENT.clientSecret,
      appearance:{
        theme:"stripe",
        variables:{
          colorPrimary:"#022e64",fontFamily:"Montserrat, system-ui, sans-serif",
          borderRadius:"10px",colorBackground:"#ffffff",colorText:"#111827"
        }
      }
    });
    paymentElement=elements.create("payment",{layout:"tabs"});
    paymentElement.mount("#payment-element");
    paymentElement.on("ready",()=>{$("payBtn").disabled=false;status("Secure checkout ready.","ok")});
    paymentElement.on("loaderror",()=>status("The secure payment form could not be loaded. Refresh and try again.","error"));
  }catch(_){status("The secure payment form could not be initialized.","error");return}
  $("payBtn").onclick=submit;
}
async function submit(){
  if(busy||commitPosted)return;
  if(!$("terms")?.checked)return status("Accept the booking and payment terms before continuing.","warn");
  if(["requires_capture","succeeded"].includes(PAYMENT?.status)){busy=true;commitPosted=true;$("payBtn").disabled=true;loading(true,"Completing your reservation…");post("PAYMENT_COMMIT",{termsAccepted:true,paymentIntentId:PAYMENT.paymentIntentId});return;}
  if(!stripe||!elements||!PAYMENT?.paymentIntentId)return status("Secure payment is not ready yet.","warn");
  busy=true;$("payBtn").disabled=true;loading(true,"Authorizing payment…");status("Authorizing payment…","");
  try{
    const result=await stripe.confirmPayment({
      elements,
      redirect:"if_required",
      confirmParams:{return_url:"https://www.skanditravels.com/booking?step=payment&cartId="+encodeURIComponent(CART.cartId)}
    });
    if(result.error){busy=false;loading(false);$("payBtn").disabled=false;status(result.error.message||"Payment authorization failed.","error");return}
    const pi=result.paymentIntent;
    if(!pi){loading(false);status("Payment status could not be verified. Check booking status before trying again.","error");showPaymentStatusCheck();return}
    if(!["requires_capture","succeeded"].includes(String(pi.status||""))){
      loading(false);showPaymentStatusCheck();
      status(pi.status==="processing"?"Payment is still processing. Wait before trying again.":`Payment is ${pi.status||"not authorized"}.`,"warn");
      return;
    }
    commitPosted=true;
    loading(true,"Creating your reservation…");
    status("Payment authorized. Creating your reservation…","");
    post("PAYMENT_COMMIT",{termsAccepted:true,paymentIntentId:pi.id});
  }catch(_){
    loading(false);showPaymentStatusCheck();
    status("Payment could not be completed. Check the payment status before trying again.","error");
  }
}
function showPaymentStatusCheck(){busy=true;if($("payBtn"))$("payBtn").disabled=true;let b=$("paymentStatusCheck");if(!b){b=document.createElement("button");b.id="paymentStatusCheck";b.className="btn secondary";b.textContent="Check booking status";$("root").append(b);}b.onclick=()=>post("BOOKING_RETRY");}
window.addEventListener("message",e=>{
  const m=e.data||{};if(e.source!==window.parent||m.source!==PARENT||m.requestId&&m.requestId!==wire?.id)return;
  if(m.type==="PAYMENT_SESSION_LOADED"){busy=false;loading(false);render(m.payload||{})}
  if(m.type==="PAYMENT_PROGRESS"){loading(true,m.message||"Creating your reservation…");status(m.message||"Processing…","")}
  if(m.type==="BOOKING_ERROR"){loading(false);showPaymentStatusCheck();status(m.message||"Payment could not be completed.","error")}
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

startBookingBridge("PAYMENT_READY",["PAYMENT_SESSION_LOADED"]);
})();

</script>
</body>
</html>
```
