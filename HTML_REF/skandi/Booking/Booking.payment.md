# Booking.payment

STATUS: NEEDS REVIEW
SLUG: /booking/payment
WIX PAGE: Booking.e8twe
AREA: SKANDI
LIVE HTML: YES
ELEMENT: #paymentEmbed
LAST SYNCED: 2026-09-16

## HOW TO USE
***STATUS (OWNER): "TODO", "IN PROGRESS", "NEEDS REVIEW", "REVISIONS NEEDED", "READY", "LIVE", "ARCHIVED"
STATUS (AGENT): "TODO", "IN PROGRESS", "REVISIONS NEEDED", "READY".***

###  COMMENT SECTION (START ON A NEW ROW, LOG IF A CHANGE IS MADE THAT REQUIRES ATTENTION) 
1. 9/17 12:55PM "Page is ready styled from my end, page not syncing correctly yet /Samuel"
2.
3.
...
***END*** 

#### LIVE HTML

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>SKANDI Payment</title>
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700;800;900&display=swap" rel="stylesheet">
<script src="https://js.stripe.com/v3/"></script>
<style>
:root{
  --sk-blue:#022e64;--sk-blue-soft:#285ca8;--sk-light:#d7e6ff;--sk-pale:#f6faff;
  --sk-bg:#f7faff;--sk-border:#dbe3ef;--sk-text:#111;--sk-muted:#667085;
  --sk-cyan:#5FC7CF;--sk-ok:#087443;--sk-warn:#a15c00;--sk-danger:#b42318;
  --sk-shadow:0 8px 26px rgba(0,0,0,.08);--sk-shadow-strong:0 14px 34px rgba(0,0,0,.12);
}
*{box-sizing:border-box}
html,body{margin:0;width:100%;min-height:100%;font-family:"Montserrat",system-ui,sans-serif;color:var(--sk-text);background:#fff;overflow-x:hidden;}
button,input{font-family:inherit}

@keyframes fadeUp{0%{opacity:0;transform:translateY(20px)}100%{opacity:1;transform:translateY(0)}}
.sk-wrap{max-width:1180px;margin:0 auto;padding:40px 24px 80px;animation:fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) forwards}

/* --- PREMIUM BOOKING FLOW METER --- */
.sk-stepper-container { position: relative; display: flex; justify-content: space-between; margin-bottom: 48px; padding: 0 10px; }
.sk-stepper-track { position: absolute; top: 14px; left: 30px; right: 30px; height: 2px; background: var(--sk-border); z-index: 1; }
.sk-stepper-progress { position: absolute; top: 14px; left: 30px; height: 2px; background: var(--sk-cyan); z-index: 2; transition: width 0.8s cubic-bezier(0.16, 1, 0.3, 1); width: 83%; }
.sk-step { position: relative; z-index: 3; display: flex; flex-direction: column; align-items: center; gap: 8px; }
.sk-step-circle { width: 30px; height: 30px; border-radius: 50%; background: #fff; border: 2px solid var(--sk-border); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; color: var(--sk-muted); transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
.sk-step-label { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: var(--sk-muted); transition: color 0.3s ease; }
.sk-step.completed .sk-step-circle { background: var(--sk-blue); border-color: var(--sk-blue); color: #fff; }
.sk-step.completed .sk-step-label { color: var(--sk-blue); }
.sk-step.active .sk-step-circle { border-color: var(--sk-cyan); color: var(--sk-blue); box-shadow: 0 0 0 4px rgba(95,199,207,0.2); }
.sk-step.active .sk-step-label { color: var(--sk-blue); }
.sk-step-circle svg { width: 14px; height: 14px; stroke: currentColor; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; fill: none; }

.sk-hero{background:linear-gradient(135deg,var(--sk-light),var(--sk-pale));border:1px solid var(--sk-border);border-radius:24px;box-shadow:var(--sk-shadow);padding:40px;margin-bottom:32px;display:flex;justify-content:space-between;align-items:center;}
.hero-content { flex: 1; }
.lock-icon { width: 48px; height: 48px; stroke: var(--sk-blue); stroke-width: 1.5; fill: none; opacity: 0.8; }
.sk-kicker{font-size:11px;text-transform:uppercase;letter-spacing:.14em;font-weight:900;color:var(--sk-cyan);margin-bottom:8px}
h1{color:var(--sk-blue);font-size:clamp(32px,5vw,46px);font-weight:800;line-height:.96;letter-spacing:-.04em;margin:0 0 12px}
h2{color:var(--sk-blue);font-size:22px;letter-spacing:-.02em;margin:0 0 16px;font-weight:800}
p{color:#475467;line-height:1.6;font-size:14px;font-weight:500;margin:0}

.sk-card{background:#fff;border:1px solid var(--sk-border);border-radius:20px;box-shadow:var(--sk-shadow);padding:34px;margin-bottom:16px;transition:box-shadow 0.3s ease; animation:fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.2s forwards; opacity:0;}
.sk-card:hover{box-shadow:var(--sk-shadow-strong)}
.sk-grid{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(320px,.75fr);gap:24px}

/* Button & Spinners */
@keyframes skSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
.sk-btn{border:0;border-radius:12px;background:linear-gradient(135deg,var(--sk-blue),var(--sk-blue-soft));color:#fff;padding:16px 28px;font-weight:800;font-size:15px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:54px;box-shadow:0 6px 20px rgba(2,46,100,.15);transition:all .25s cubic-bezier(0.16,1,0.3,1); position:relative; overflow:hidden;}
.sk-btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 10px 26px rgba(2,46,100,.25)}
.sk-btn::after {content:"";position:absolute;top:0;left:-100%;width:50%;height:100%;background:linear-gradient(to right,rgba(255,255,255,0) 0%,rgba(255,255,255,0.25) 50%,rgba(255,255,255,0) 100%);transform:skewX(-25deg);transition:all 0.6s ease;}
.sk-btn:hover::after {left:150%;}
.sk-btn:disabled{opacity:.6;cursor:not-allowed}
.sk-btn.loading { color: transparent !important; pointer-events: none; }
.sk-btn.loading::after { content: ""; position: absolute; top: 50%; left: 50%; width: 22px; height: 22px; margin: -11px 0 0 -11px; border: 2.5px solid rgba(255,255,255,0.4); border-top-color: #fff; border-radius: 50%; animation: skSpin 0.7s linear infinite; transform:none;}

.sk-price{font-size:40px;color:var(--sk-blue);font-weight:900;letter-spacing:-.04em;margin-bottom:20px}
.sk-status{display:none;border-radius:16px;padding:18px;background:var(--sk-bg);border:1px solid var(--sk-border);margin:14px 0 24px;color:var(--sk-muted);white-space:pre-line;font-size:13px;font-weight:700}
.sk-status.show{display:block; animation:fadeUp 0.4s ease forwards;}
.sk-status.error{background:#fff1f0;color:var(--sk-danger);border-color:#ffd5d2}
.sk-status.ok{background:#ecfdf3;color:var(--sk-ok);border-color:#abefc6}
.sk-status.warn{background:#fff7ed;color:var(--sk-warn);border-color:#fed7aa}

#payment-element{min-height:120px;background:var(--sk-bg);border-radius:16px;padding:20px;border:1px solid var(--sk-border)}
.summary-row{display:flex;justify-content:space-between;gap:16px;padding:14px 0;border-bottom:1px solid var(--sk-border);font-size:14px}
.summary-row:last-child{border-bottom:0}
.summary-row span:first-child{color:#475467;font-weight:500}
.summary-row strong{color:var(--sk-blue);font-weight:800;text-align:right;}

.secure-note{font-size:11px;color:var(--sk-muted);margin:20px 0 0;font-weight:500; display:flex; gap:8px; align-items:flex-start;}
.secure-note svg { width: 14px; height: 14px; flex-shrink: 0; margin-top:2px; }

.terms{display:flex;gap:12px;align-items:flex-start;font-size:13px;line-height:1.6;margin:28px 0;font-weight:500;color:#475467;cursor:pointer}
.terms input{margin-top:4px;accent-color:var(--sk-blue);width:16px;height:16px}
.pay-action{display:flex;justify-content:flex-end;margin-top:24px}

@media(max-width:860px){
  .sk-grid{grid-template-columns:1fr}
  .sk-wrap{padding:24px 16px 60px}
  .sk-card{padding:24px}
  .pay-action .sk-btn{width:100%}
  .lock-icon{display:none;}
  .sk-step-label{display:none;}
  .sk-stepper-container{margin-bottom:32px;}
}
</style>
</head>
<body>
<div class="sk-wrap">

  <div class="sk-stepper-container">
    <div class="sk-stepper-track"></div>
    <div class="sk-stepper-progress" style="width: 83%;"></div>
    
    <div class="sk-step completed">
      <div class="sk-step-circle"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg></div>
      <div class="sk-step-label">Offer</div>
    </div>
    <div class="sk-step completed">
      <div class="sk-step-circle"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg></div>
      <div class="sk-step-label">Extras</div>
    </div>
    <div class="sk-step completed">
      <div class="sk-step-circle"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg></div>
      <div class="sk-step-label">Transfer</div>
    </div>
    <div class="sk-step completed">
      <div class="sk-step-circle"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg></div>
      <div class="sk-step-label">Travelers</div>
    </div>
    <div class="sk-step completed">
      <div class="sk-step-circle"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg></div>
      <div class="sk-step-label">Seats</div>
    </div>
    <div class="sk-step active">
      <div class="sk-step-circle">6</div>
      <div class="sk-step-label">Payment</div>
    </div>
    <div class="sk-step">
      <div class="sk-step-circle">7</div>
      <div class="sk-step-label">Done</div>
    </div>
  </div>

  <section class="sk-hero">
    <div class="hero-content">
      <div class="sk-kicker">Secure checkout</div>
      <h1>Complete payment</h1>
      <p>Your live trip price is revalidated before checkout.</p>
    </div>
    <svg class="lock-icon" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
  </section>

  <div id="status" class="sk-status show">Preparing secure payment...</div>
  <section id="root"></section>

</div>
<script>
const SOURCE="SKANDI_BOOKING_PAYMENT";
const PARENT="SKANDI_WIX_PARENT";
let CART=null, PAYMENT=null, stripe=null, elements=null, paymentElement=null, busy=false;
const $=id=>document.getElementById(id);
function post(type,payload={}){window.parent.postMessage({source:SOURCE,type,...payload},"*")}
function esc(v=""){return String(v??"").replace(/[&<>"']/g,s=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[s]))}
function status(msg,mode=""){const e=$("status");e.textContent=msg;e.className="sk-status show "+mode}

function formatMoney(amount,currency){const n=Number(amount);if(!Number.isFinite(n))return [currency||"",amount||""].filter(Boolean).join(" ");try{return new Intl.NumberFormat(undefined,{style:"currency",currency:currency||"USD"}).format(n)}catch(_){return `${currency||""} ${n.toFixed(2)}`.trim()}}
function destroyPaymentElement(){try{if(paymentElement)paymentElement.unmount()}catch(_){} paymentElement=null;elements=null;stripe=null}

function render(session){
  CART=session?.cart||{}; PAYMENT=session?.payment||{};
  if(!PAYMENT.publishableKey||!PAYMENT.clientSecret||!PAYMENT.paymentIntentId){status("Secure payment could not be initialized.","error");return}
  destroyPaymentElement();
  
  $("root").innerHTML=`
    <div class="sk-grid">
      <section class="sk-card">
        <h2>Payment details</h2>
        <div id="payment-element"></div>
        <label class="terms">
          <input id="terms" type="checkbox">
          <span>I accept the booking terms, supplier fare/rate rules, cancellation and refund conditions, privacy policy and payment terms.</span>
        </label>
        <div class="pay-action">
          <button class="sk-btn" id="payBtn" disabled>
            <svg viewBox="0 0 24 24" style="width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            Pay ${esc(formatMoney(PAYMENT.amount,CART.currency||PAYMENT.currency))}
          </button>
        </div>
        <div class="secure-note">
          <svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="none" stroke="currentColor" stroke-width="2"/></svg>
          <span>Payment details are handled by our secure processor and are not stored on this page.</span>
        </div>
      </section>
      
      <aside class="sk-card" style="align-self: start;">
        <h2>Order summary</h2>
        <div class="sk-price">${esc(formatMoney(CART.total??PAYMENT.amount,CART.currency||PAYMENT.currency))}</div>
        <div class="summary-row"><span>Trip</span><strong>${esc(CART.selectedOffer?.tripType||CART.productType||"Travel booking")}</strong></div>
        <div class="summary-row"><span>Booking status</span><strong>${esc(CART.status||"Payment pending")}</strong></div>
        <div class="summary-row"><span>Reference</span><strong>${esc(CART.cartId||"")}</strong></div>
        <div class="secure-note" style="margin-top:24px;">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><polyline points="12 6 12 12 16 14" fill="none" stroke="currentColor" stroke-width="2"/></svg>
          <span>Live availability is checked again before the reservation is finalized.</span>
        </div>
      </aside>
    </div>`;
    
  try{
    stripe=Stripe(PAYMENT.publishableKey);
    elements=stripe.elements({clientSecret:PAYMENT.clientSecret,appearance:{theme:"stripe",variables:{colorPrimary:"#022e64",fontFamily:"Montserrat, system-ui, sans-serif",borderRadius:"12px",colorBackground:"#ffffff"}}});
    paymentElement=elements.create("payment",{layout:"tabs"});
    paymentElement.mount("#payment-element");
    paymentElement.on("ready",()=>{$("payBtn").disabled=false;status("Checkout ready.","ok")});
    paymentElement.on("loaderror",()=>status("Secure payment form could not be loaded. Please refresh and try again.","error"));
  }catch(_){status("Secure payment form could not be initialized.","error");return}
  $("payBtn").onclick=submitPayment;
}

async function submitPayment(){
  if(busy)return;
  if(!$("terms")?.checked){status("Please accept the booking terms before paying.","warn");return}
  if(!stripe||!elements||!PAYMENT?.paymentIntentId){status("Secure payment is not ready yet.","warn");return}
  
  busy=true;const btn=$("payBtn");if(btn){btn.disabled=true; btn.classList.add("loading");}
  status("Processing payment...");
  
  try{
    const result=await stripe.confirmPayment({elements,redirect:"if_required",confirmParams:{return_url:"https://www.skanditravels.com/booking"}});
    if(result.error){status(result.error.message||"Payment could not be completed.","error");return}
    const pi=result.paymentIntent;
    if(!pi||pi.status!=="succeeded"){
      const readable=pi?.status==="processing"?"Payment is still processing. Please wait before trying again.":"Payment was not completed.";
      status(readable,"warn");return
    }
    status("Payment received. Creating your reservation...");
    post("PAYMENT_COMMIT",{termsAccepted:true,paymentIntentId:pi.id});
  }catch(_){
    status("Payment could not be completed. Please check your payment status before trying again.","error")
  }
  finally{
    busy=false;
    if(btn){btn.disabled=false; btn.classList.remove("loading");}
  }
}

window.addEventListener("message",e=>{
  const m=e.data||{};
  if(m.source!==PARENT)return;
  if(m.type==="PAYMENT_SESSION_LOADED")render(m.payload||{});
  if(m.type==="PAYMENT_PROGRESS")status(m.message||"Processing...");
  if(m.type==="BOOKING_ERROR")status(m.message||"Payment could not be completed.","error")
});
post("PAYMENT_READY");
</script>
</body>
</html>
