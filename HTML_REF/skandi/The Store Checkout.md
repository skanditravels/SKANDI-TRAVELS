<!--
INFO
Canonical path: /HTML_REF/skandi/The Store Checkout.md
Display page: The Store Checkout
System: SKANDI
Route: /the-store/store-checkout
Wix page controller: /src/pages/Checkout.lof54.js
HTML component: #storeCheckoutEmbed
Runtime HTML: /embed/SKANDI-The-Store-Checkout-B011.16.html
Status: B011.16 — STATICALLY VERIFIED / LIVE WIX TEST REQUIRED

SOURCE OF TRUTH
- No prior canonical The Store Checkout HTML_REF record was found in the inspected B-011 workspace.
- This record is created from the user-provided current checkout HTML and preserves its checkout message/business contract.
- Global presentation/config authority: /src/pages/masterPage.js
- Canonical checkout backend facade: /src/backend/SKANDI_CORE/storeCheckout.web.js
- The checkout brand shell consumes masterPage brand.assets.logos.storeHeader, brand.assets.logos.storeFooter, brand.slogans and routes.theStore.
- No payment, cart, delivery, coupon, quantity, validation or Wix eCommerce behavior is moved into this HTML_REF document.

MESSAGING CONTRACT
CHILD SOURCE: SKANDI_STORE_CHECKOUT
PARENT SOURCE: SKANDI_WIX_PARENT
CHILD -> PARENT:
- SKANDI_MASTER_CONFIG_REQUEST
- CHECKOUT_READY
- CHECKOUT_SAVE_DETAILS
- CHECKOUT_SET_DELIVERY
- CHECKOUT_APPLY_COUPON
- CHECKOUT_REMOVE_COUPON
- CHECKOUT_UPDATE_QTY
- CHECKOUT_REMOVE_ITEM
- CHECKOUT_SUBMIT
- CHECKOUT_NAVIGATE
PARENT -> CHILD:
- SKANDI_MASTER_CONFIG
- CHECKOUT_PARENT_READY
- CHECKOUT_STATE
- CHECKOUT_PROGRESS
- CHECKOUT_PAYMENT_STATUS
- CHECKOUT_ERROR

LOG
2026-09-24 — B011.16
- Connected checkout header logo to masterPage brand.assets.logos.storeHeader.
- Connected checkout footer logo to masterPage brand.assets.logos.storeFooter.
- Connected bottom-left checkout footer slogan to the active language in masterPage brand.slogans.
- Added masterPage route consumption for return-to-store actions.
- Preserved the complete existing checkout state and commerce message contract.
- Added responsive checkout-specific header/footer shell only; no backend/payment logic changed.
-->

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>SKANDI The Store — Secure Checkout</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
:root{
  --navy:#022e64;
  --cyan:#5fc7cf;
  --ink:#101828;
  --muted:#667085;
  --line:#e5e7eb;
  --soft:#f6f8fb;
  --soft-blue:#f3f8ff;
  --ok:#087443;
  --warn:#9a6700;
  --danger:#b42318;
  --shadow:0 14px 40px rgba(2,46,100,.10);
}
*{box-sizing:border-box}
html,body{margin:0;min-height:100%;background:#fff;color:var(--ink);font-family:Montserrat,system-ui,sans-serif}
button,input,select,textarea{font:inherit}
button{cursor:pointer}
button:disabled{cursor:not-allowed;opacity:.55}
.checkout{width:min(1240px,calc(100% - 36px));margin:0 auto;padding:42px 0 72px}
.eyebrow{color:var(--navy);font-size:11px;font-weight:900;letter-spacing:.16em;text-transform:uppercase}
.hero{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;margin-bottom:28px}
.hero h1{margin:7px 0 7px;font-size:clamp(31px,4vw,52px);line-height:1;letter-spacing:-.045em;color:var(--navy)}
.hero p{margin:0;color:var(--muted);max-width:650px;line-height:1.65;font-size:14px}
.secure{display:flex;align-items:center;gap:9px;color:var(--navy);font-size:12px;font-weight:800;white-space:nowrap}
.secure svg{width:19px;height:19px}
.progress{display:grid;grid-template-columns:repeat(4,1fr);border:1px solid var(--line);border-radius:17px;overflow:hidden;margin-bottom:26px}
.progress div{position:relative;padding:13px 14px;text-align:center;font-size:11px;font-weight:800;color:var(--muted);background:#fff}
.progress div+div{border-left:1px solid var(--line)}
.progress .on{color:var(--navy);background:var(--soft-blue)}
.progress .on:before{content:"";position:absolute;left:0;right:0;bottom:0;height:3px;background:var(--cyan)}
.layout{display:grid;grid-template-columns:minmax(0,1fr) 430px;gap:28px;align-items:start}
.card{border:1px solid var(--line);border-radius:20px;background:#fff;box-shadow:0 7px 24px rgba(15,23,42,.04);overflow:hidden}
.card+.card{margin-top:18px}
.card-head{padding:20px 22px 16px;border-bottom:1px solid var(--line)}
.card-head h2{margin:0;color:var(--navy);font-size:18px;letter-spacing:-.02em}
.card-head p{margin:6px 0 0;color:var(--muted);font-size:12px;line-height:1.55}
.card-body{padding:22px}
.grid2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:15px}
.full{grid-column:1/-1}
.field label{display:block;margin:0 0 7px;font-size:11px;font-weight:800;color:#344054}
.field input,.field select,.field textarea{width:100%;border:1px solid #d0d5dd;border-radius:12px;background:#fff;color:var(--ink);padding:12px 13px;outline:none;transition:.15s}
.field textarea{min-height:88px;resize:vertical}
.field input:focus,.field select:focus,.field textarea:focus{border-color:var(--cyan);box-shadow:0 0 0 3px rgba(95,199,207,.17)}
.actions{display:flex;justify-content:flex-end;gap:10px;margin-top:18px}
.btn{border:0;border-radius:12px;padding:12px 17px;font-size:12px;font-weight:900}
.btn-primary{background:var(--navy);color:#fff}
.btn-secondary{background:#eef4fb;color:var(--navy)}
.delivery-list{display:grid;gap:10px}
.delivery-option{display:grid;grid-template-columns:auto 1fr auto;gap:12px;align-items:center;border:1px solid var(--line);border-radius:14px;padding:14px;transition:.15s}
.delivery-option:hover{border-color:#bacfe6}
.delivery-option.selected{border-color:var(--navy);box-shadow:0 0 0 2px rgba(2,46,100,.08)}
.delivery-option input{accent-color:var(--navy)}
.delivery-title{font-weight:800;font-size:13px;color:var(--navy)}
.delivery-meta{font-size:11px;color:var(--muted);margin-top:3px}
.delivery-price{font-size:12px;font-weight:900;color:var(--ink)}
.notice{border-radius:13px;padding:12px 14px;font-size:12px;line-height:1.5;margin-bottom:12px}
.notice.error{background:#fff1f0;color:var(--danger);border:1px solid #ffd7d3}
.notice.warn{background:#fffaeb;color:var(--warn);border:1px solid #fedf89}
.notice.info{background:var(--soft-blue);color:var(--navy);border:1px solid #d4e4f7}
.sticky{position:sticky;top:18px}
.order-items{display:grid;gap:14px}
.order-item{display:grid;grid-template-columns:72px 1fr auto;gap:12px;align-items:start;padding-bottom:14px;border-bottom:1px solid var(--line)}
.order-item:last-child{border-bottom:0}
.product-img{width:72px;height:82px;border-radius:11px;object-fit:cover;background:var(--soft);border:1px solid var(--line)}
.product-placeholder{width:72px;height:82px;border-radius:11px;display:flex;align-items:center;justify-content:center;background:var(--soft);color:var(--navy);border:1px solid var(--line);font-weight:900;font-size:9px}
.product-name{font-weight:800;font-size:12px;color:var(--ink);line-height:1.35}
.product-options{font-size:10px;color:var(--muted);margin-top:4px;line-height:1.45}
.item-price{font-size:12px;font-weight:900;color:var(--navy);white-space:nowrap}
.qty-row{display:flex;align-items:center;gap:7px;margin-top:8px}
.qty-btn{width:25px;height:25px;border:1px solid var(--line);background:#fff;border-radius:8px;color:var(--navy);font-weight:900;line-height:1}
.qty-num{min-width:20px;text-align:center;font-size:11px;font-weight:800}
.remove{border:0;background:transparent;color:#667085;font-size:9px;text-decoration:underline;padding:2px 0 2px 5px}
.coupon{display:grid;grid-template-columns:1fr auto;gap:8px;margin-top:18px}
.coupon input{border:1px solid #d0d5dd;border-radius:11px;padding:11px 12px;outline:none}
.coupon button{border:0;border-radius:11px;background:#eaf2fb;color:var(--navy);font-weight:900;padding:0 14px;font-size:11px}
.coupon-active{display:flex;justify-content:space-between;align-items:center;margin-top:12px;padding:10px 12px;border-radius:11px;background:#ecfdf3;font-size:11px;color:var(--ok);font-weight:800}
.coupon-active button{border:0;background:transparent;color:var(--ok);font-size:10px;text-decoration:underline}
.totals{border-top:1px solid var(--line);margin-top:18px;padding-top:15px;display:grid;gap:10px}
.total-row{display:flex;justify-content:space-between;gap:12px;font-size:11px;color:#475467}
.total-row strong{color:var(--ink)}
.total-row.grand{border-top:1px solid var(--line);padding-top:13px;margin-top:2px;font-size:15px;font-weight:900;color:var(--navy)}
.terms{display:flex;gap:9px;align-items:flex-start;margin:18px 0 13px;font-size:10px;line-height:1.5;color:var(--muted)}
.terms input{margin-top:2px;accent-color:var(--navy)}
.pay-btn{width:100%;border:0;border-radius:13px;background:var(--navy);color:#fff;font-weight:900;padding:15px 16px;font-size:12px;letter-spacing:.02em}
.payment-note{text-align:center;color:var(--muted);font-size:9px;line-height:1.5;margin-top:10px}
.loader{min-height:420px;display:flex;align-items:center;justify-content:center;color:var(--navy);font-weight:800;font-size:12px}
.empty{border:1px solid var(--line);border-radius:22px;padding:52px 24px;text-align:center}
.empty h2{color:var(--navy);margin:0 0 8px}
.empty p{color:var(--muted);font-size:13px}
.statusbar{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:100;max-width:min(560px,calc(100% - 32px));background:#0b213c;color:#fff;border-radius:14px;box-shadow:var(--shadow);padding:11px 15px;font-size:11px;font-weight:700;display:none}
.statusbar.show{display:block}
@media(max-width:900px){
  .checkout{width:min(100% - 24px,760px);padding-top:28px}
  .hero{align-items:flex-start;flex-direction:column}
  .layout{grid-template-columns:1fr}
  .sticky{position:static}
}
@media(max-width:600px){
  .checkout{width:calc(100% - 20px);padding-top:20px}
  .hero h1{font-size:34px}
  .secure{display:none}
  .progress div{padding:10px 5px;font-size:9px}
  .grid2{grid-template-columns:1fr}
  .full{grid-column:auto}
  .card-head,.card-body{padding-left:16px;padding-right:16px}
  .order-item{grid-template-columns:62px 1fr}
  .product-img,.product-placeholder{width:62px;height:72px}
  .item-price{grid-column:2;text-align:left;margin-top:-3px}
}


/* The Store Checkout — master-controlled brand shell */
.store-checkout-header{
  position:relative;
  z-index:20;
  background:#fff;
  border-bottom:1px solid var(--line);
}
.store-checkout-header-inner{
  width:min(1240px,calc(100% - 36px));
  min-height:86px;
  margin:0 auto;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:24px;
}
.store-checkout-brand{
  display:flex;
  align-items:center;
  gap:17px;
  min-width:0;
}
.store-checkout-brand-logo{
  border:0;
  background:transparent;
  padding:0;
  display:flex;
  align-items:center;
  flex:0 0 auto;
}
.store-checkout-brand-logo img{
  display:block;
  width:auto;
  height:58px;
  max-width:220px;
  object-fit:contain;
  object-position:left center;
}
.store-checkout-brand-divider{
  width:1px;
  height:32px;
  background:#cfd5dc;
  flex:0 0 auto;
}
.store-checkout-brand-context{
  min-width:0;
  color:var(--navy);
  font-size:10px;
  line-height:1.45;
  font-weight:800;
  text-transform:uppercase;
  letter-spacing:.09em;
}
.store-checkout-brand-context span{
  display:block;
  color:var(--muted);
  margin-top:2px;
  font-size:8px;
  letter-spacing:.075em;
  font-weight:700;
}
.store-checkout-return{
  border:1px solid #d0d5dd;
  border-radius:11px;
  background:#fff;
  color:var(--navy);
  min-height:40px;
  padding:0 14px;
  font-size:10px;
  font-weight:900;
  white-space:nowrap;
}
.store-checkout-return:hover{border-color:var(--navy)}
.store-checkout-footer{
  margin-top:0;
  background:#071b44;
  color:#fff;
}
.store-checkout-footer-main{
  width:min(1240px,calc(100% - 36px));
  min-height:124px;
  margin:0 auto;
  padding:28px 0;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:32px;
}
.store-checkout-footer-brand{
  display:flex;
  align-items:center;
  gap:18px;
  min-width:0;
}
.store-checkout-footer-brand img{
  display:block;
  width:auto;
  height:36px;
  max-width:210px;
  object-fit:contain;
  object-position:left center;
}
.store-checkout-footer-copy{
  color:#cbd5e1;
  font-size:9px;
  line-height:1.6;
}
.store-checkout-footer-copy strong{
  display:block;
  color:#fff;
  margin-bottom:2px;
  font-size:10px;
  text-transform:uppercase;
  letter-spacing:.08em;
}
.store-checkout-footer-return{
  border:1px solid rgba(255,255,255,.28);
  border-radius:11px;
  background:transparent;
  color:#fff;
  min-height:40px;
  padding:0 14px;
  font-size:9px;
  font-weight:900;
  text-transform:uppercase;
  letter-spacing:.055em;
  white-space:nowrap;
}
.store-checkout-footer-bottom{
  border-top:1px solid rgba(255,255,255,.14);
}
.store-checkout-footer-bottom-inner{
  width:min(1240px,calc(100% - 36px));
  min-height:54px;
  margin:0 auto;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:24px;
}
.store-checkout-slogan{
  color:#fff;
  font-size:9px;
  font-weight:800;
  letter-spacing:.09em;
  text-transform:uppercase;
}
.store-checkout-copyright{
  color:#aeb9c8;
  font-size:8px;
}
@media(max-width:600px){
  .store-checkout-header-inner,
  .store-checkout-footer-main,
  .store-checkout-footer-bottom-inner{width:calc(100% - 20px)}
  .store-checkout-header-inner{min-height:72px;gap:12px}
  .store-checkout-brand{gap:11px}
  .store-checkout-brand-logo img{height:46px;max-width:165px}
  .store-checkout-brand-divider{height:26px}
  .store-checkout-brand-context{font-size:8px;letter-spacing:.065em}
  .store-checkout-brand-context span{font-size:7px}
  .store-checkout-return{padding:0 10px;font-size:8px}
  .store-checkout-footer-main{align-items:flex-start;flex-direction:column;min-height:0;padding:26px 0}
  .store-checkout-footer-brand{align-items:flex-start;flex-direction:column;gap:12px}
  .store-checkout-footer-return{width:100%}
  .store-checkout-footer-bottom-inner{align-items:flex-start;flex-direction:column;gap:7px;padding:14px 0}
}

</style>
</head>
<body>

<header class="store-checkout-header" aria-label="SKANDI The Store checkout header">
  <div class="store-checkout-header-inner">
    <div class="store-checkout-brand">
      <button class="store-checkout-brand-logo" type="button" data-master-route="theStore" aria-label="Return to SKANDI The Store">
        <img id="storeCheckoutHeaderLogo" data-master-logo="storeHeader" src="https://static.wixstatic.com/media/394052_eaf2188b7f7e48468fa25d61f8881b10~mv2.png" alt="SKANDI">
      </button>
      <span class="store-checkout-brand-divider" aria-hidden="true"></span>
      <div class="store-checkout-brand-context">The Store<span>Secure checkout</span></div>
    </div>
    <button class="store-checkout-return" type="button" data-master-route="theStore">Back to The Store</button>
  </div>
</header>

<main class="checkout">
  <section class="hero">
    <div>
      <div class="eyebrow">SKANDI STORE</div>
      <h1>Secure checkout</h1>
      <p>Complete your order without leaving the SKANDI experience. Delivery, taxes and availability are validated before payment.</p>
    </div>
    <div class="secure">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>
      Secure payment
    </div>
  </section>

  <div class="progress">
    <div class="on">Bag</div>
    <div class="on">Details</div>
    <div class="on">Delivery</div>
    <div class="on">Payment</div>
  </div>

  <div id="app" class="loader">Loading your shopping bag…</div>
</main>


<footer class="store-checkout-footer" aria-label="SKANDI The Store checkout footer">
  <div class="store-checkout-footer-main">
    <div class="store-checkout-footer-brand">
      <img id="storeCheckoutFooterLogo" data-master-logo="storeFooter" src="https://static.wixstatic.com/media/394052_cd31153a91694b14a27c5f756f8089bd~mv2.png" alt="SKANDI">
      <div class="store-checkout-footer-copy"><strong>The Store</strong>Secure checkout powered by SKANDI.</div>
    </div>
    <button class="store-checkout-footer-return" type="button" data-master-route="theStore">Return to The Store</button>
  </div>
  <div class="store-checkout-footer-bottom">
    <div class="store-checkout-footer-bottom-inner">
      <div id="storeCheckoutSlogan" class="store-checkout-slogan">Unforgettable Moments.</div>
      <div class="store-checkout-copyright">© <span id="storeCheckoutFooterYear"></span> SKANDI Travels. All rights reserved.</div>
    </div>
  </div>
</footer>

<div id="statusbar" class="statusbar"></div>

<script>
(()=>{
"use strict";

const SOURCE="SKANDI_STORE_CHECKOUT";
const PARENT="SKANDI_WIX_PARENT";

let STATE=null;
let BUSY=false;
let selectedDeliveryKey="";
let MASTER_CONFIG_STATE=null;

const $=(id)=>document.getElementById(id);
const esc=(v)=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const post=(type,payload={})=>window.parent.postMessage({
  source:SOURCE,type,payload,timestamp:new Date().toISOString()
},"*");

function masterAsset(key){
  return String(MASTER_CONFIG_STATE?.brand?.assets?.logos?.[key]||"").trim();
}

function currentMasterSlogan(){
  const language=String(MASTER_CONFIG_STATE?.settings?.language||"EN").trim().toLowerCase();
  const slogans=MASTER_CONFIG_STATE?.brand?.slogans||{};
  return String(slogans[language]||slogans.en||"Unforgettable Moments.").trim();
}

function masterRoute(key,fallback){
  const route=String(MASTER_CONFIG_STATE?.routes?.[key]||"").trim();
  return route||fallback;
}

function renderMasterBranding(){
  const headerLogo=masterAsset("storeHeader");
  const footerLogo=masterAsset("storeFooter");
  if(headerLogo){
    document.querySelectorAll('[data-master-logo="storeHeader"]').forEach(img=>img.src=headerLogo);
  }
  if(footerLogo){
    document.querySelectorAll('[data-master-logo="storeFooter"]').forEach(img=>img.src=footerLogo);
  }
  const slogan=$("storeCheckoutSlogan");
  if(slogan)slogan.textContent=currentMasterSlogan();
  const year=$("storeCheckoutFooterYear");
  if(year)year.textContent=String(new Date().getFullYear());
}

document.addEventListener("click",event=>{
  const button=event.target.closest("[data-master-route]");
  if(!button)return;
  const key=String(button.dataset.masterRoute||"").trim();
  const fallback=key==="theStore"?"/the-store":"/";
  post("CHECKOUT_NAVIGATE",{path:masterRoute(key,fallback)});
});


function status(message,duration=3200){
  const el=$("statusbar");
  if(!el)return;
  el.textContent=message||"";
  el.classList.add("show");
  clearTimeout(status._t);
  if(duration>0)status._t=setTimeout(()=>el.classList.remove("show"),duration);
}

function money(m){
  if(!m)return"—";
  if(m.formatted)return String(m.formatted);
  const amount=Number(m.amount||0);
  return `${m.currency||"USD"} ${amount.toFixed(2)}`;
}

function formValue(id){
  return ($(id)?.value||"").trim();
}

function formPayload(){
  return {
    customer:{
      firstName:formValue("firstName"),
      lastName:formValue("lastName"),
      email:formValue("email"),
      phone:formValue("phone")
    },
    address:{
      country:formValue("country"),
      addressLine:formValue("addressLine"),
      addressLine2:formValue("addressLine2"),
      city:formValue("city"),
      subdivision:formValue("subdivision"),
      postalCode:formValue("postalCode")
    },
    note:formValue("note")
  };
}

function validateForm(){
  const p=formPayload();
  const required=[
    [p.customer.firstName,"First name"],
    [p.customer.lastName,"Last name"],
    [p.customer.email,"Email"],
    [p.address.country,"Country"],
    [p.address.addressLine,"Address"],
    [p.address.city,"City"],
    [p.address.postalCode,"ZIP / postal code"]
  ];
  const missing=required.find(([v])=>!v);
  if(missing){
    status(`${missing[1]} is required.`);
    return false;
  }
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.customer.email)){
    status("Enter a valid email address.");
    return false;
  }
  return true;
}

function countries(selected){
  const rows=[
    ["US","United States"],["CA","Canada"],["GB","United Kingdom"],
    ["SE","Sweden"],["NO","Norway"],["DK","Denmark"],["FI","Finland"],
    ["DE","Germany"],["FR","France"],["ES","Spain"],["GR","Greece"],
    ["IT","Italy"],["NL","Netherlands"],["CH","Switzerland"],["AT","Austria"],
    ["TH","Thailand"],["AU","Australia"],["NZ","New Zealand"]
  ];
  return `<option value="">Select country</option>`+rows.map(([c,n])=>
    `<option value="${c}" ${String(selected||"").toUpperCase()===c?"selected":""}>${esc(n)}</option>`
  ).join("");
}

function violationsHtml(){
  const list=STATE?.summary?.violations||[];
  if(!list.length)return"";
  return list.map(v=>{
    const severity=String(v.severity||"").toUpperCase();
    const cls=severity==="ERROR"?"error":"warn";
    return `<div class="notice ${cls}">${esc(v.description||"Please review your checkout details.")}</div>`;
  }).join("");
}

function renderDelivery(){
  const methods=STATE?.deliveryMethods||[];
  const selected=STATE?.cart?.selectedDeliveryMethod||null;

  if(selected&&!selectedDeliveryKey){
    selectedDeliveryKey=`${selected.appId||""}|${selected.code||""}`;
  }

  if(!STATE?.cart?.address?.country && !formValue("country")){
    return `<div class="notice info">Enter your delivery address and select <b>Update delivery options</b> to see available shipping.</div>`;
  }

  if(!methods.length){
    return `<div class="notice warn">No delivery method is currently available for this address. Check the address and try again.</div>`;
  }

  return `<div class="delivery-list">`+methods.map(m=>{
    const key=`${m.appId||""}|${m.code||""}`;
    const isSelected=selectedDeliveryKey===key ||
      (selected?.code===m.code && (!selected?.appId || selected.appId===m.appId));
    return `
      <label class="delivery-option ${isSelected?"selected":""}">
        <input type="radio" name="delivery" value="${esc(key)}" ${isSelected?"checked":""}>
        <span>
          <div class="delivery-title">${esc(m.title||"Delivery")}</div>
          <div class="delivery-meta">${esc(m.regionName||"")}</div>
        </span>
        <span class="delivery-price">${esc(m.priceLabel||"Calculated")}</span>
      </label>`;
  }).join("")+`</div>`;
}

function itemHtml(item){
  const image=item.imageUrl
    ? `<img class="product-img" src="${esc(item.imageUrl)}" alt="${esc(item.name)}">`
    : `<div class="product-placeholder">SKANDI</div>`;
  const opts=(item.descriptionLines||[]).join(" · ");
  const fixed=item.fixedQuantity===true;
  return `
    <div class="order-item" data-id="${esc(item.id)}">
      ${image}
      <div>
        <div class="product-name">${esc(item.name)}</div>
        ${opts?`<div class="product-options">${esc(opts)}</div>`:""}
        <div class="qty-row">
          <button class="qty-btn" data-qty="-1" ${fixed?"disabled":""}>−</button>
          <span class="qty-num">${Number(item.quantity||1)}</span>
          <button class="qty-btn" data-qty="1" ${fixed?"disabled":""}>+</button>
          <button class="remove" data-remove ${fixed?"disabled":""}>Remove</button>
        </div>
      </div>
      <div class="item-price">${esc(money(item.totalPrice))}</div>
    </div>`;
}

function totalsHtml(){
  const s=STATE?.summary||{};
  const discount=Number(s.discount?.amount||0);
  const fees=Number(s.additionalFees?.amount||0);
  return `
    <div class="totals">
      <div class="total-row"><span>Subtotal</span><strong>${esc(money(s.subtotal||STATE?.cart?.subtotal))}</strong></div>
      ${discount?`<div class="total-row"><span>Discount</span><strong>− ${esc(money(s.discount))}</strong></div>`:""}
      <div class="total-row"><span>Delivery</span><strong>${esc(money(s.delivery))}</strong></div>
      ${fees?`<div class="total-row"><span>Fees</span><strong>${esc(money(s.additionalFees))}</strong></div>`:""}
      <div class="total-row"><span>Tax</span><strong>${esc(money(s.tax))}</strong></div>
      <div class="total-row grand"><span>Total</span><span>${esc(money(s.total||STATE?.cart?.subtotal))}</span></div>
    </div>`;
}

function couponHtml(){
  const coupon=STATE?.cart?.coupons?.[0];
  if(coupon){
    return `
      <div class="coupon-active">
        <span>Promo ${esc(coupon.code)} applied</span>
        <button data-remove-coupon="${esc(coupon.id)}">Remove</button>
      </div>`;
  }
  return `
    <div class="coupon">
      <input id="couponCode" type="text" maxlength="50" placeholder="Promo code">
      <button id="applyCoupon">Apply</button>
    </div>`;
}

function formHtml(){
  const c=STATE?.cart?.customer||{};
  const a=STATE?.cart?.address||{};
  return `
    <section class="card">
      <div class="card-head">
        <h2>Your details</h2>
        <p>We'll use this information for your order confirmation and delivery.</p>
      </div>
      <div class="card-body">
        <div class="grid2">
          <div class="field"><label>First name</label><input id="firstName" autocomplete="given-name" value="${esc(c.firstName||"")}"></div>
          <div class="field"><label>Last name</label><input id="lastName" autocomplete="family-name" value="${esc(c.lastName||"")}"></div>
          <div class="field"><label>Email</label><input id="email" type="email" autocomplete="email" value="${esc(c.email||"")}"></div>
          <div class="field"><label>Phone</label><input id="phone" autocomplete="tel" value="${esc(c.phone||"")}"></div>
        </div>
      </div>
    </section>

    <section class="card">
      <div class="card-head">
        <h2>Delivery address</h2>
        <p>Your shipping options and taxes are calculated from this address.</p>
      </div>
      <div class="card-body">
        <div class="grid2">
          <div class="field full"><label>Country</label><select id="country">${countries(a.country||"US")}</select></div>
          <div class="field full"><label>Street address</label><input id="addressLine" autocomplete="address-line1" value="${esc(a.addressLine||"")}"></div>
          <div class="field full"><label>Apartment, suite, floor (optional)</label><input id="addressLine2" autocomplete="address-line2" value="${esc(a.addressLine2||"")}"></div>
          <div class="field"><label>City</label><input id="city" autocomplete="address-level2" value="${esc(a.city||"")}"></div>
          <div class="field"><label>State / province</label><input id="subdivision" autocomplete="address-level1" placeholder="NY" value="${esc((a.subdivision||"").replace(/^US-/,""))}"></div>
          <div class="field"><label>ZIP / postal code</label><input id="postalCode" autocomplete="postal-code" value="${esc(a.postalCode||"")}"></div>
          <div class="field full"><label>Order note (optional)</label><textarea id="note" maxlength="1000" placeholder="Special instructions">${esc(STATE?.cart?.note||"")}</textarea></div>
        </div>
        <div class="actions">
          <button id="saveDetails" class="btn btn-secondary">Update delivery options</button>
        </div>
      </div>
    </section>

    <section class="card">
      <div class="card-head">
        <h2>Delivery method</h2>
        <p>Available options come directly from SKANDI's live Wix shipping configuration.</p>
      </div>
      <div class="card-body" id="deliveryWrap">${renderDelivery()}</div>
    </section>

    <section class="card">
      <div class="card-head">
        <h2>Payment</h2>
        <p>Your payment details are collected in a secure payment window after SKANDI validates the final order total.</p>
      </div>
      <div class="card-body">
        <div class="notice info">Card and supported wallet information is handled securely by the configured Wix payment provider. SKANDI does not store your card number in this page.</div>
      </div>
    </section>`;
}

function orderHtml(){
  const items=STATE?.cart?.lineItems||[];
  return `
    <aside class="card sticky">
      <div class="card-head">
        <h2>Order summary</h2>
        <p>${items.length} ${items.length===1?"item":"items"} in your bag</p>
      </div>
      <div class="card-body">
        <div class="order-items">${items.map(itemHtml).join("")}</div>
        ${couponHtml()}
        ${totalsHtml()}
        <label class="terms">
          <input id="terms" type="checkbox">
          <span>I agree to SKANDI's store terms, privacy policy and applicable delivery conditions.</span>
        </label>
        <button id="payBtn" class="pay-btn">Complete purchase</button>
        <div class="payment-note">Your order total is recalculated and verified immediately before the order is placed.</div>
      </div>
    </aside>`;
}

function bind(){
  $("saveDetails")?.addEventListener("click",()=>{
    if(!validateForm())return;
    setBusy(true,"Updating delivery options…");
    post("CHECKOUT_SAVE_DETAILS",formPayload());
  });

  document.querySelectorAll('input[name="delivery"]').forEach(input=>{
    input.addEventListener("change",()=>{
      selectedDeliveryKey=input.value;
      document.querySelectorAll(".delivery-option").forEach(x=>x.classList.remove("selected"));
      input.closest(".delivery-option")?.classList.add("selected");
      const [appId,code]=input.value.split("|");
      setBusy(true,"Updating delivery…");
      post("CHECKOUT_SET_DELIVERY",{appId,code});
    });
  });

  $("applyCoupon")?.addEventListener("click",()=>{
    const code=formValue("couponCode");
    if(!code){status("Enter a promo code.");return}
    setBusy(true,"Applying promo code…");
    post("CHECKOUT_APPLY_COUPON",{code});
  });

  document.querySelector("[data-remove-coupon]")?.addEventListener("click",e=>{
    setBusy(true,"Removing promo code…");
    post("CHECKOUT_REMOVE_COUPON",{couponId:e.currentTarget.dataset.removeCoupon});
  });

  document.querySelectorAll("[data-qty]").forEach(btn=>{
    btn.addEventListener("click",()=>{
      const row=btn.closest(".order-item");
      const id=row?.dataset.id;
      const item=STATE?.cart?.lineItems?.find(x=>x.id===id);
      if(!item)return;
      const next=Math.max(1,Math.min(99,Number(item.quantity||1)+Number(btn.dataset.qty||0)));
      if(next===Number(item.quantity||1))return;
      setBusy(true,"Updating bag…");
      post("CHECKOUT_UPDATE_QTY",{lineItemId:id,quantity:next});
    });
  });

  document.querySelectorAll("[data-remove]").forEach(btn=>{
    btn.addEventListener("click",()=>{
      const id=btn.closest(".order-item")?.dataset.id;
      if(!id)return;
      setBusy(true,"Removing item…");
      post("CHECKOUT_REMOVE_ITEM",{lineItemId:id});
    });
  });

  $("payBtn")?.addEventListener("click",()=>{
    if(BUSY)return;
    if(!validateForm())return;
    if(!$("terms")?.checked){status("Please accept the terms before continuing.");return}

    const methods=STATE?.deliveryMethods||[];
    let deliveryMethod=null;

    if(methods.length){
      const checked=document.querySelector('input[name="delivery"]:checked');
      if(!checked){status("Choose a delivery method.");return}
      const [appId,code]=checked.value.split("|");
      deliveryMethod={appId,code};
    }else if(STATE?.cart?.selectedDeliveryMethod){
      deliveryMethod=STATE.cart.selectedDeliveryMethod;
    }

    setBusy(true,"Checking your order…");
    post("CHECKOUT_SUBMIT",{
      ...formPayload(),
      deliveryMethod
    });
  });
}

function setBusy(value,message=""){
  BUSY=Boolean(value);
  document.querySelectorAll("button").forEach(btn=>{
    if(!btn.dataset.permanentDisabled)btn.disabled=BUSY;
  });
  if(message)status(message,0);
}

function render(){
  const app=$("app");
  if(!app)return;

  if(!STATE){
    app.className="loader";
    app.textContent="Loading your shopping bag…";
    return;
  }

  if(STATE.empty){
    app.className="";
    app.innerHTML=`
      <section class="empty">
        <div class="eyebrow">SKANDI STORE</div>
        <h2>Your bag is empty</h2>
        <p>Add something from the store before continuing to checkout.</p>
        <button class="btn btn-primary" id="backStore">Continue shopping</button>
      </section>`;
    $("backStore")?.addEventListener("click",()=>post("CHECKOUT_NAVIGATE",{path:"/store"}));
    return;
  }

  app.className="";
  app.innerHTML=`
    ${violationsHtml()}
    <div class="layout">
      <div>${formHtml()}</div>
      ${orderHtml()}
    </div>`;

  bind();
}

window.addEventListener("message",event=>{
  const message=event.data||{};
  if(message.source&&message.source!==PARENT)return;
  const payload=message.payload||{};

  if(message.type==="SKANDI_MASTER_CONFIG"){
    MASTER_CONFIG_STATE=payload;
    renderMasterBranding();
    return;
  }

  if(message.type==="CHECKOUT_PARENT_READY"){
    post("CHECKOUT_READY",{});
    return;
  }

  if(message.type==="CHECKOUT_STATE"){
    STATE=payload;
    BUSY=false;
    $("statusbar")?.classList.remove("show");
    render();
    return;
  }

  if(message.type==="CHECKOUT_PROGRESS"){
    setBusy(true,payload.message||"Working…");
    return;
  }

  if(message.type==="CHECKOUT_PAYMENT_STATUS"){
    BUSY=false;
    render();
    status(payload.status||"Payment not completed.",5000);
    return;
  }

  if(message.type==="CHECKOUT_ERROR"){
    BUSY=false;
    render();
    status(payload.message||"We could not complete that action.",5500);
  }
});

renderMasterBranding();
post("SKANDI_MASTER_CONFIG_REQUEST",{});
post("CHECKOUT_READY",{});
})();
</script>
</body>
</html>

```
