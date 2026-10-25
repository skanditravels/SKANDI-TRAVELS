
(()=>{
"use strict";

const SOURCE="SKANDI_STORE_CHECKOUT";
const PARENT="SKANDI_WIX_PARENT";

let STATE=null;
let BUSY=false;
let selectedDeliveryKey="";
let MASTER_CONFIG_STATE=null;
let DRAFT=null, TERMS=false;
function captureDraft(){if($("firstName")){DRAFT=formPayload();TERMS=Boolean($("terms")?.checked)}}

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
function requiresDelivery(){
  return STATE?.cart?.requiresDelivery!==false;
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
  if(!requiresDelivery())return `<div class="notice info">Digital order — no shipping method is required.</div>`;
  if(STATE?.deliveryError)return `<div class="notice error">${esc(STATE.deliveryError)}</div>`;
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
  const totalAmount=Number(s.total?.amount||0);
  const afterAmount=Number(s.totalAfterGiftCards?.amount);
  const hasGiftCard=Boolean(STATE?.cart?.giftCards?.length);
  const giftCardApplied=hasGiftCard&&Number.isFinite(afterAmount)?Math.max(0,totalAmount-afterAmount):0;
  const currency=s.total?.currency||STATE?.cart?.currency||"USD";
  const finalTotal=hasGiftCard&&Number.isFinite(afterAmount)?s.totalAfterGiftCards:s.total;
  return `
    <div class="totals">
      <div class="total-row"><span>Subtotal</span><strong>${esc(money(s.subtotal||STATE?.cart?.subtotal))}</strong></div>
      ${discount?`<div class="total-row"><span>Discount</span><strong>− ${esc(money(s.discount))}</strong></div>`:""}
      ${requiresDelivery()?`<div class="total-row"><span>Delivery</span><strong>${esc(money(s.delivery))}</strong></div>`:""}
      ${fees?`<div class="total-row"><span>Fees</span><strong>${esc(money(s.additionalFees))}</strong></div>`:""}
      <div class="total-row"><span>Tax</span><strong>${esc(money(s.tax))}</strong></div>
      ${giftCardApplied>0?`<div class="total-row"><span>Gift card</span><strong>− ${esc(money({amount:giftCardApplied,currency}))}</strong></div>`:""}
      <div class="total-row grand"><span>${hasGiftCard?"Total due":"Total"}</span><span>${esc(money(finalTotal))}</span></div>
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

function giftCardHtml(){
  const card=STATE?.cart?.giftCards?.[0];
  if(card){
    return `
      <div class="gift-card-label">Gift card</div>
      <div class="coupon-active">
        <span>${esc(card.obfuscatedCode||"Gift card")} applied</span>
        <button data-remove-gift-card="${esc(card.id)}">Remove</button>
      </div>`;
  }
  return `
    <div class="gift-card-label">Gift card</div>
    <div class="coupon">
      <input id="giftCardCode" type="text" maxlength="50" autocomplete="off" placeholder="Gift card code">
      <button id="applyGiftCard">Apply</button>
    </div>
    <div class="gift-card-note">SKANDI Gift Cards are validated and redeemed by Wix against this current cart.</div>`;
}

function formHtml(){
  const c=DRAFT?.customer||STATE?.cart?.customer||{};
  const a=DRAFT?.address||STATE?.cart?.address||{};
  const delivery=requiresDelivery();
  const deliveryMethodSection=delivery?`
    <section class="card">
      <div class="card-head">
        <h2>Delivery method</h2>
        <p>Available options come directly from SKANDI's live Wix shipping configuration.</p>
      </div>
      <div class="card-body" id="deliveryWrap">${renderDelivery()}</div>
    </section>`:"";
  return `
    <section class="card">
      <div class="card-head">
        <h2>Your details</h2>
        <p>${delivery?"We'll use this information for your order confirmation and delivery.":"We'll use this information for your order confirmation."}</p>
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
        <h2>${delivery?"Delivery address":"Billing address"}</h2>
        <p>${delivery?"Your shipping options and taxes are calculated from this address.":"No shipping method is required. Wix uses this address for billing and applicable tax calculation."}</p>
      </div>
      <div class="card-body">
        <div class="grid2">
          <div class="field full"><label>Country</label><select id="country">${countries(a.country||"US")}</select></div>
          <div class="field full"><label>Street address</label><input id="addressLine" autocomplete="address-line1" value="${esc(a.addressLine||"")}"></div>
          <div class="field full"><label>Apartment, suite, floor (optional)</label><input id="addressLine2" autocomplete="address-line2" value="${esc(a.addressLine2||"")}"></div>
          <div class="field"><label>City</label><input id="city" autocomplete="address-level2" value="${esc(a.city||"")}"></div>
          <div class="field"><label>State / province</label><input id="subdivision" autocomplete="address-level1" placeholder="NY" value="${esc((a.subdivision||"").replace(/^US-/,""))}"></div>
          <div class="field"><label>ZIP / postal code</label><input id="postalCode" autocomplete="postal-code" value="${esc(a.postalCode||"")}"></div>
          <div class="field full"><label>Order note (optional)</label><textarea id="note" maxlength="1000" placeholder="Special instructions">${esc(DRAFT?.note??STATE?.cart?.note??"")}</textarea></div>
        </div>
        <div class="actions">
          <button id="saveDetails" class="btn btn-secondary">${delivery?"Update delivery options":"Update order details"}</button>
        </div>
      </div>
    </section>

    ${deliveryMethodSection}

    <section class="card">
      <div class="card-head">
        <h2>Payment</h2>
        <p>Gift card value is applied first. If a balance remains, your payment details are collected in a secure payment window after SKANDI validates the final order total.</p>
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
        ${giftCardHtml()}
        ${totalsHtml()}
        <label class="terms">
          <input id="terms" type="checkbox" ${TERMS?"checked":""}>
          <span>I agree to SKANDI's store terms, privacy policy and applicable delivery conditions.</span>
        </label>
        <button id="payBtn" class="pay-btn">${STATE?.summary?.requiresPayment===false?"Place order":"Complete purchase"}</button>
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

  $("applyGiftCard")?.addEventListener("click",()=>{
    const code=formValue("giftCardCode");
    if(!code){status("Enter a gift card code.");return}
    setBusy(true,"Applying gift card…");
    post("CHECKOUT_APPLY_GIFT_CARD",{code});
  });

  document.querySelector("[data-remove-gift-card]")?.addEventListener("click",e=>{
    const giftCardId=e.currentTarget.dataset.removeGiftCard;
    if(!giftCardId)return;
    setBusy(true,"Removing gift card…");
    post("CHECKOUT_REMOVE_GIFT_CARD",{giftCardId});
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
    if(requiresDelivery()&&STATE?.deliveryError){status(STATE.deliveryError,0);return}
    if(!$("terms")?.checked){status("Please accept the terms before continuing.");return}

    const methods=requiresDelivery()?(STATE?.deliveryMethods||[]):[];
    let deliveryMethod=null;

    if(requiresDelivery()&&methods.length){
      const checked=document.querySelector('input[name="delivery"]:checked');
      if(!checked){status("Choose a delivery method.");return}
      const [appId,code]=checked.value.split("|");
      deliveryMethod={appId,code};
    }else if(requiresDelivery()&&STATE?.cart?.selectedDeliveryMethod){
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
  captureDraft();
  BUSY=Boolean(value);
  document.querySelectorAll("button").forEach(btn=>{
    if(btn.dataset.busyDisabled===undefined)btn.dataset.busyDisabled=String(btn.disabled);
    btn.disabled=BUSY||btn.dataset.busyDisabled==="true";
  });
  if(message)status(message,0);
}

function render(){
  captureDraft();
  const app=$("app");
  if(!app)return;

  if(!STATE){
    app.className="loader";
    app.textContent="Loading your shopping bag…";
    return;
  }

  if(STATE.pendingPayment){
    app.className="";app.innerHTML=`<section class="empty"><div class="eyebrow">SECURE PAYMENT</div><h2>Complete payment for your order</h2><p>Your order has been created. Retry payment for this same order or check its latest status in My Orders.</p><button class="btn btn-primary" id="retryPayment">Retry secure payment</button><button class="btn" id="viewOrder">My Orders</button></section>`;
    $("retryPayment").onclick=()=>{if(BUSY)return;setBusy(true,"Opening secure payment…");post("CHECKOUT_SUBMIT",{})};
    $("viewOrder").onclick=()=>post("CHECKOUT_NAVIGATE",{path:"/my-orders"});
    setBusy(BUSY);return;
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
    $("backStore")?.addEventListener("click",()=>post("CHECKOUT_NAVIGATE",{path:"/the-store"}));
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
  setBusy(BUSY);
}

window.addEventListener("message",event=>{
  if(event.source!==window.parent)return;
  const message=event.data||{};
  if(message.source!==PARENT)return;
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
    captureDraft();STATE=payload;
    BUSY=Boolean(payload.busy);
    $("statusbar")?.classList.remove("show");
    render();
    return;
  }

  if(message.type==="CHECKOUT_PROGRESS"){
    setBusy(true,payload.message||"Working…");
    return;
  }

  if(message.type==="CHECKOUT_PAYMENT_STATUS"){
    if(STATE)STATE.pendingPayment=Boolean(payload.pendingPayment);
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
