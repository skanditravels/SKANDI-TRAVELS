

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

