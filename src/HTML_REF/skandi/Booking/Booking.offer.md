# Booking Offer

STATUS: NEEDS REVIEW
SLUG: /booking.offer
WIX PAGE: Booking.e8twe
AREA: SKANDI
LIVE HTML: YES
ELEMENT: [MULTISTATE]
LAST SYNCED: 2026-09-16

## HOW TO USE
STATUS (OWNER): "TODO", "IN PROGRESS", "NEEDS REVIEW", "REVISIONS NEEDED", "READY", "LIVE", "ARCHIVED"
STATUS (AGENT): "TODO", "IN PROGRESS", "REVISIONS NEEDED", "READY".
END

### COMMENT SECTION (START ON A NEW ROW, LOG IF A CHANGE IS MADE THAT REQUIRES ATTENTION) 
1. 9/17 12:09PM "Review, functions, flow, payload needs reviewed"
2.
3.
...
END 

``` LIVE HTML
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>SKANDI Offer</title>
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700;800;900&display=swap" rel="stylesheet">
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
@keyframes skSpin {0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); }}

.sk-page-loader { position: fixed; inset: 0; background: rgba(2, 46, 100, 0.4); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); z-index: 999999; display: none; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.25s ease; }
.sk-page-loader.active { display: flex; opacity: 1; }
.sk-page-loader-box { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(16px); padding: 22px 30px; border-radius: 20px; box-shadow: 0 24px 60px rgba(2, 46, 100, 0.25); display: flex; align-items: center; gap: 16px; font-weight: 800; color: var(--sk-blue); font-size: 13px; letter-spacing: 0.02em; border: 1px solid rgba(255, 255, 255, 0.8); }
.sk-page-loader-spinner { width: 24px; height: 24px; border: 3px solid #dbe3ef; border-top-color: var(--sk-cyan); border-radius: 50%; animation: skSpin 0.7s linear infinite; }

.sk-wrap{max-width:1180px;margin:0 auto;padding:40px 24px 80px;animation:fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) forwards}

.sk-stepper-container { position: relative; display: flex; justify-content: space-between; margin-bottom: 48px; padding: 0 10px; }
.sk-stepper-track { position: absolute; top: 14px; left: 30px; right: 30px; height: 2px; background: var(--sk-border); z-index: 1; }
.sk-stepper-progress { position: absolute; top: 14px; left: 30px; height: 2px; background: var(--sk-cyan); z-index: 2; transition: width 0.8s cubic-bezier(0.16, 1, 0.3, 1); width: 0%; }
.sk-step { position: relative; z-index: 3; display: flex; flex-direction: column; align-items: center; gap: 8px; }
.sk-step-circle { width: 30px; height: 30px; border-radius: 50%; background: #fff; border: 2px solid var(--sk-border); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; color: var(--sk-muted); transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
.sk-step-label { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: var(--sk-muted); transition: color 0.3s ease; }
.sk-step.completed .sk-step-circle { background: var(--sk-blue); border-color: var(--sk-blue); color: #fff; }
.sk-step.completed .sk-step-label { color: var(--sk-blue); }
.sk-step.active .sk-step-circle { border-color: var(--sk-cyan); color: var(--sk-blue); box-shadow: 0 0 0 4px rgba(95,199,207,0.2); }
.sk-step.active .sk-step-label { color: var(--sk-blue); }
.sk-step-circle svg { width: 14px; height: 14px; stroke: currentColor; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; fill: none; }

.sk-hero{background:linear-gradient(135deg,var(--sk-light),var(--sk-pale));border:1px solid var(--sk-border);border-radius:24px;box-shadow:var(--sk-shadow);padding:40px;margin-bottom:32px}
.sk-kicker{font-size:11px;text-transform:uppercase;letter-spacing:.14em;font-weight:900;color:var(--sk-cyan);margin-bottom:8px}
h1{color:var(--sk-blue);font-size:clamp(32px,5vw,46px);line-height:.96;letter-spacing:-.04em;margin:0 0 12px;font-weight:800}
h2,h3{color:var(--sk-blue);margin:0 0 12px;font-weight:800}
p{color:#475467;line-height:1.6;font-size:14px;margin:0;font-weight:500}

.sk-card{background:#fff;border:1px solid var(--sk-border);border-radius:20px;box-shadow:var(--sk-shadow);padding:34px;margin-bottom:24px;transition:box-shadow 0.3s ease; animation:fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.1s forwards; opacity:0;}
.sk-card:hover{box-shadow:var(--sk-shadow-strong)}
.sk-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:24px}
.sk-grid .sk-card { padding:24px; margin-bottom:0; box-shadow:none; border-color:var(--sk-border-soft); background:var(--sk-bg); animation:none; opacity:1;}

.sk-price{font-size:36px;color:var(--sk-blue);font-weight:900;letter-spacing:-.04em;margin-bottom:8px}
.sk-status{display:none;border-radius:16px;padding:18px;background:var(--sk-bg);border:1px solid var(--sk-border);margin:14px 0 24px;color:var(--sk-muted);font-size:13px;font-weight:700}
.sk-status.show{display:block; animation:fadeUp 0.4s ease forwards;}
.sk-status.ok{background:#ecfdf3;color:var(--sk-ok);border-color:#abefc6}
.sk-status.warn{background:#fff7ed;color:var(--sk-warn);border-color:#fed7aa}
.sk-status.error{background:#fff1f0;color:var(--sk-danger);border-color:#ffd5d2}

.sk-actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:32px}
.sk-btn{border:0;border-radius:12px;background:linear-gradient(135deg,var(--sk-blue),var(--sk-blue-soft));color:#fff;padding:16px 28px;font-weight:800;font-size:14px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 6px 20px rgba(2,46,100,.15);transition:all .25s cubic-bezier(0.16,1,0.3,1); position:relative; overflow:hidden;}
.sk-btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 10px 26px rgba(2,46,100,.25)}
.sk-btn::after {content:"";position:absolute;top:0;left:-100%;width:50%;height:100%;background:linear-gradient(to right,rgba(255,255,255,0) 0%,rgba(255,255,255,0.25) 50%,rgba(255,255,255,0) 100%);transform:skewX(-25deg);transition:all 0.6s ease;}
.sk-btn:hover::after {left:150%;}
.sk-btn.secondary{background:#fff;color:var(--sk-blue);border:1px solid var(--sk-border);box-shadow:0 4px 12px rgba(0,0,0,.04)}
.sk-btn.secondary:hover{border-color:var(--sk-cyan);color:var(--sk-cyan)}

.terms-label{display:flex;gap:12px;margin-top:30px;align-items:flex-start;cursor:pointer;font-size:14px;font-weight:500;color:#475467;line-height:1.5}
.terms-label input{margin-top:4px;width:18px;height:18px;accent-color:var(--sk-blue)}

@media(max-width:860px){
  .sk-grid{grid-template-columns:1fr}
  .sk-wrap{padding:24px 16px 60px}
  .sk-step-label{display:none;}
  .sk-stepper-container{margin-bottom:32px;}
  .sk-btn{width:100%;}
}
</style>
</head>
<body>
<div id="pageLoader" class="sk-page-loader">
  <div class="sk-page-loader-box">
    <div class="sk-page-loader-spinner"></div>
    <span>Loading next step...</span>
  </div>
</div>

<div class="sk-wrap">
  <div class="sk-stepper-container">
    <div class="sk-stepper-track"></div>
    <div class="sk-stepper-progress" style="width: 0%;"></div>
    
    <div class="sk-step active">
      <div class="sk-step-circle">1</div>
      <div class="sk-step-label">Offer</div>
    </div>
    <div class="sk-step">
      <div class="sk-step-circle">2</div>
      <div class="sk-step-label">Extras</div>
    </div>
    <div class="sk-step">
      <div class="sk-step-circle">3</div>
      <div class="sk-step-label">Transfer</div>
    </div>
    <div class="sk-step">
      <div class="sk-step-circle">4</div>
      <div class="sk-step-label">Travelers</div>
    </div>
    <div class="sk-step">
      <div class="sk-step-circle">5</div>
      <div class="sk-step-label">Seats</div>
    </div>
    <div class="sk-step">
      <div class="sk-step-circle">6</div>
      <div class="sk-step-label">Payment</div>
    </div>
    <div class="sk-step">
      <div class="sk-step-circle">7</div>
      <div class="sk-step-label">Done</div>
    </div>
  </div>

  <section class="sk-hero">
    <div class="sk-kicker">Booking details</div>
    <h1>Review your trip</h1>
    <p>Confirm the selected travel option, live price and booking conditions before continuing.</p>
  </section>

  <div id="status" class="sk-status show">Loading offer...</div>
  <section id="root"></section>
</div>

<script>
const SOURCE="SKANDI_BOOKING_OFFER",PARENT="SKANDI_WIX_PARENT";let CART=null;
const $=id=>document.getElementById(id);
function post(type,payload={}){window.parent.postMessage({source:SOURCE,type,...payload},"*")}
function esc(v=""){return String(v??"").replace(/[&<>"']/g,s=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[s]))}
function money(p,currency,total){if(p&&typeof p==="object"){currency=p.currency||currency;total=p.total??p.amount??total}const n=Number(total);return Number.isFinite(n)?`${esc(currency||"")} ${n.toFixed(2)}`.trim():"Pending"}
function status(m,c=""){const e=$("status");e.textContent=m;e.className="sk-status show "+c}

function showPageLoader(show = true) {
  const loader = document.getElementById("pageLoader");
  if (loader) { if (show) loader.classList.add("active"); else loader.classList.remove("active"); }
}

function render(cart){
  CART=cart||{};const offer=CART.selectedOffer||{};status("Offer ready.","ok");
  const type=offer.travelType||CART.productType||"Travel";
  
  $("root").innerHTML=`
    <article class="sk-card">
      <h2 style="font-size:24px">${esc(offer.title||"Selected travel offer")}</h2>
      <p>${esc(offer.summary||"Your selected live travel option is ready for review.")}</p>
      
      <div class="sk-grid">
        <div class="sk-card">
          <div class="sk-kicker">Trip Total</div>
          <div class="sk-price">${money(CART.totalPrice,CART.currency,CART.total)}</div>
          <p style="font-size:12px">Price and availability are revalidated before payment.</p>
        </div>
        <div class="sk-card">
          <div class="sk-kicker">Itinerary</div>
          <h3 style="font-size:18px">${esc(type)}</h3>
          ${offer.airlineName?`<p style="font-size:13px;margin-bottom:6px"><b>Airline:</b> ${esc(offer.airlineName)}</p>`:""}
          ${offer.hotelName?`<p style="font-size:13px"><b>Hotel:</b> ${esc(offer.hotelName)}</p>`:""}
        </div>
        <div class="sk-card">
          <div class="sk-kicker">Rules</div>
          <h3 style="font-size:18px">Conditions</h3>
          <p style="font-size:12px">${esc(CART.termsSummary||offer.termsSummary||"Fare, hotel, cancellation and supplier conditions apply.")}</p>
        </div>
      </div>
      
      <label class="terms-label">
        <input id="acceptTerms" type="checkbox"> 
        <span>I accept that price and availability will be revalidated before payment and applicable supplier conditions apply.</span>
      </label>
      
      <div class="sk-actions">
        <button class="sk-btn secondary" id="backBtn">← Back to search</button>
        <button class="sk-btn" id="continueBtn">Continue to extras →</button>
      </div>
    </article>`;
    
  $("continueBtn").onclick=()=>{
    if(!$("acceptTerms").checked)return status("Please accept the booking conditions before continuing.","warn");
    showPageLoader(true);
    post("BOOKING_OFFER_ACCEPTED",{cartId:CART.cartId,termsAccepted:true});
    setTimeout(()=>showPageLoader(false), 3000);
  };
  $("backBtn").onclick=()=>{
    showPageLoader(true);
    post("BOOKING_NAVIGATE",{path:"/home"});
    setTimeout(()=>showPageLoader(false), 3000);
  };
}

window.addEventListener("message",e=>{
  const m=e.data||{};
  if(m.source!==PARENT)return;
  if(m.type==="BOOKING_CART_LOADED")render(m.payload.cart);
  if(m.type==="BOOKING_ERROR"){ showPageLoader(false); status(m.message||"Could not load offer.","error"); }
});
post("BOOKING_OFFER_READY");
</script>
</body>
</html>
