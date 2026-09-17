# Booking.confirmation

STATUS: NEEDS REVIEW
SLUG: /booking/confirmation
WIX PAGE: Booking.e8twe
AREA: SKANDI
LIVE HTML: YES
ELEMENT: #confirmationEmbed
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
<title>SKANDI Booking Confirmation</title>
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700;800;900&display=swap" rel="stylesheet">
<style>
:root{
  --sk-blue:#022e64;--sk-blue-soft:#285ca8;--sk-light:#d7e6ff;--sk-pale:#f6faff;
  --sk-bg:#f7faff;--sk-border:#dbe3ef;--sk-text:#111;--sk-muted:#667085;
  --sk-cyan:#5FC7CF;--sk-ok:#087443;--sk-danger:#b42318;
  --sk-shadow:0 8px 26px rgba(0,0,0,.08);--sk-shadow-strong:0 14px 34px rgba(0,0,0,.12);
}
*{box-sizing:border-box}
html,body{margin:0;width:100%;min-height:100%;font-family:"Montserrat",system-ui,sans-serif;background:#fff;color:var(--sk-text);overflow-x:hidden;}
button{font-family:inherit;cursor:pointer}

@keyframes fadeUp{0%{opacity:0;transform:translateY(20px)}100%{opacity:1;transform:translateY(0)}}
.sk-wrap{max-width:1100px;margin:0 auto;padding:40px 24px 80px;animation:fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) forwards}

/* --- PREMIUM BOOKING FLOW METER --- */
.sk-stepper-container { position: relative; display: flex; justify-content: space-between; margin-bottom: 48px; padding: 0 10px; }
.sk-stepper-track { position: absolute; top: 14px; left: 30px; right: 30px; height: 2px; background: var(--sk-border); z-index: 1; }
.sk-stepper-progress { position: absolute; top: 14px; left: 30px; height: 2px; background: var(--sk-cyan); z-index: 2; transition: width 0.8s cubic-bezier(0.16, 1, 0.3, 1); width: 100%; }
.sk-step { position: relative; z-index: 3; display: flex; flex-direction: column; align-items: center; gap: 8px; }
.sk-step-circle { width: 30px; height: 30px; border-radius: 50%; background: #fff; border: 2px solid var(--sk-border); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; color: var(--sk-muted); transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
.sk-step-label { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: var(--sk-muted); transition: color 0.3s ease; }
.sk-step.completed .sk-step-circle { background: var(--sk-blue); border-color: var(--sk-blue); color: #fff; }
.sk-step.completed .sk-step-label { color: var(--sk-blue); }
.sk-step.active .sk-step-circle { border-color: var(--sk-cyan); color: var(--sk-blue); box-shadow: 0 0 0 4px rgba(95,199,207,0.2); }
.sk-step.active .sk-step-label { color: var(--sk-blue); }
.sk-step-circle svg { width: 14px; height: 14px; stroke: currentColor; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; fill: none; }

.document{background:#fff;border:1px solid var(--sk-border);border-radius:24px;box-shadow:var(--sk-shadow);overflow:hidden;transition:box-shadow 0.3s ease; animation:fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.2s forwards; opacity:0;}
.document:hover{box-shadow:var(--sk-shadow-strong)}

/* Ticket Header */
.doc-head{display:grid;grid-template-columns:1fr auto;gap:22px;padding:40px;background:linear-gradient(135deg,var(--sk-light),var(--sk-pale));border-bottom:2px dashed var(--sk-border)}
.logo{font-size:24px;font-weight:900;color:var(--sk-blue);letter-spacing:.12em}
.title{text-align:right;color:var(--sk-blue)}
.title h1{margin:0;font-size:clamp(30px,4vw,40px);letter-spacing:-.04em;line-height:1;font-weight:800}
.title p{margin:8px 0 0;color:#475467;font-size:14px;font-weight:500}

/* Status Bar */
.confirmed{display:grid;grid-template-columns:1fr auto;gap:18px;align-items:center;border-bottom:1px solid var(--sk-border);margin:0 40px;padding:24px 0}
.confirmed b{color:var(--sk-blue);font-size:16px;font-weight:800}
.confirmed p{font-size:13px;color:#444;line-height:1.6;margin:6px 0 0}
.pill{display:inline-flex;background:var(--sk-cyan);color:var(--sk-blue);border-radius:999px;padding:10px 16px;font-size:11px;font-weight:900;letter-spacing:.1em;text-transform:uppercase}

.content{padding:34px 40px 40px}
.info-grid{display:grid;grid-template-columns:1.2fr 0.8fr;gap:40px;margin-bottom:40px}
.info-grid h2{margin:0;color:var(--sk-blue);font-weight:800;font-size:24px;letter-spacing:-.02em}
.info-grid p{color:#475467;line-height:1.6;font-size:14px;margin-top:10px}

/* Meta Data / PNR */
.meta{width:100%;border-collapse:collapse}
.meta td{font-size:14px;padding:8px 0;vertical-align:top}
.meta td:first-child{color:#475467;width:46%;font-weight:500;}
.meta td:last-child{font-weight:800;color:var(--sk-blue)}
.pnr{font-size:24px!important;color:var(--sk-blue);letter-spacing:.1em;font-weight:900!important}

.section-title{font-size:16px;font-weight:800;color:var(--sk-blue);border-bottom:2px solid var(--sk-border);padding-bottom:10px;margin:40px 0 16px}
.summary-box{background:var(--sk-bg);border-radius:16px;border:1px solid var(--sk-border);padding:20px;color:#444;line-height:1.6;font-size:14px}
.route-list{display:grid;gap:12px}
.route-item{padding:18px 20px;border:1px solid var(--sk-border);border-radius:16px;background:#fff;font-size:14px;line-height:1.5;box-shadow:0 4px 12px rgba(0,0,0,.02); transition: transform 0.2s ease, border-color 0.2s ease;}
.route-item:hover{transform:translateX(4px); border-color:var(--sk-cyan);}
.route-item strong{color:var(--sk-blue);font-size:16px;display:block;margin-bottom:6px}

.actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:40px}
.btn{border:0;border-radius:12px;background:linear-gradient(135deg,var(--sk-blue),var(--sk-blue-soft));color:#fff;padding:16px 28px;font-weight:800;font-size:14px;box-shadow:0 6px 20px rgba(2,46,100,.15);transition:all .25s cubic-bezier(0.16,1,0.3,1);cursor:pointer; position:relative; overflow:hidden;}
.btn:hover{transform:translateY(-2px);box-shadow:0 10px 26px rgba(2,46,100,.25)}
.btn::after {content:"";position:absolute;top:0;left:-100%;width:50%;height:100%;background:linear-gradient(to right,rgba(255,255,255,0) 0%,rgba(255,255,255,0.25) 50%,rgba(255,255,255,0) 100%);transform:skewX(-25deg);transition:all 0.6s ease;}
.btn:hover::after {left:150%;}
.btn.secondary{background:#fff;color:var(--sk-blue);border:1px solid var(--sk-border);box-shadow:0 4px 12px rgba(0,0,0,.04)}
.btn.secondary:hover{border-color:var(--sk-cyan);color:var(--sk-cyan)}

.status{display:none;border-radius:16px;padding:18px;background:var(--sk-bg);border:1px solid var(--sk-border);margin:14px 0 24px;color:var(--sk-muted);font-size:13px;font-weight:700}
.status.show{display:block;}
.status.ok{background:#ecfdf3;color:var(--sk-ok);border-color:#abefc6}
.status.error{background:#fff1f0;color:var(--sk-danger);border-color:#ffd5d2}

@media(max-width:780px){
  .doc-head,.confirmed,.info-grid{grid-template-columns:1fr}
  .title{text-align:left}
  .content{padding:24px}
  .confirmed{margin:0 24px; padding:20px 0;}
  .doc-head{padding:30px 24px}
  .btn{width:100%}
  .sk-step-label{display:none;}
  .sk-stepper-container{margin-bottom:32px;}
}
</style>
</head>
<body>
<div class="sk-wrap">

  <div class="sk-stepper-container">
    <div class="sk-stepper-track"></div>
    <div class="sk-stepper-progress" style="width: 100%;"></div>
    
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
    <div class="sk-step completed">
      <div class="sk-step-circle"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg></div>
      <div class="sk-step-label">Payment</div>
    </div>
    <div class="sk-step active">
      <div class="sk-step-circle"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg></div>
      <div class="sk-step-label">Done</div>
    </div>
  </div>

  <div id="status" class="status show">Loading confirmation...</div>
  <main id="root"></main>

</div>
<script>
const SOURCE="SKANDI_BOOKING_CONFIRMATION_V2",PARENT="SKANDI_WIX_PARENT";let CARTID="";
const $=id=>document.getElementById(id);
function post(type,payload={}){window.parent.postMessage({source:SOURCE,type,...payload},"*")}
function esc(v=""){return String(v??"").replace(/[&<>"']/g,s=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[s]))}
function status(msg,mode=""){const e=$("status");e.textContent=msg;e.className="status show "+mode}

function renderSegments(items=[]){
  if(!items.length)return"";
  return `<div class="section-title">Flight itinerary</div><div class="route-list">${items.map(s=>`<div class="route-item"><strong>${esc(s.route||`${s.origin||""} → ${s.destination||""}`)}</strong>${s.carrier||s.flightNumber?`<span style="color:var(--sk-muted)">${esc([s.carrier,s.flightNumber].filter(Boolean).join(" "))}</span>`:""}${s.departureAt?`<br><span style="color:var(--sk-blue);font-weight:700;font-size:13px;margin-top:6px;display:inline-block">${esc(new Date(s.departureAt).toLocaleString())}</span>`:""}</div>`).join("")}</div>`
}

function render(c={}){
  CARTID=c.cartId||"";
  status("Booking confirmed.","ok");
  const kind=c.confirmationType||"Travel booking";
  const ref=c.pnrLocator||c.hotelReference||c.bookingReference||"";
  
  $("root").innerHTML=`
    <article class="document">
      <header class="doc-head">
        <div>
          <div class="logo">SKANDI TRAVELS</div>
          <p>Your confirmed SKANDI travel itinerary and booking references.</p>
        </div>
        <div class="title">
          <h1>Booking Confirmation</h1>
          <p>${esc(kind)}</p>
        </div>
      </header>
      
      <section class="confirmed">
        <div>
          <b>Confirmed booking</b>
          <p>Your reservation has been completed. Keep your booking references available when contacting SKANDI or the operating supplier.</p>
        </div>
        <span class="pill">Confirmed</span>
      </section>
      
      <div class="content">
        <div class="info-grid">
          <div>
            <h2>${esc(c.title||"Booking confirmed")}</h2>
            <p>${esc(c.summary||"Your SKANDI booking is confirmed.")}</p>
          </div>
          <div>
            <table class="meta">
              <tr><td>SKANDI reference:</td><td class="pnr">${esc(c.bookingReference||"")}</td></tr>
              ${c.pnrLocator?`<tr><td>Airline booking reference:</td><td>${esc(c.pnrLocator)}</td></tr>`:""}
              ${c.hotelReference?`<tr><td>Hotel reference:</td><td>${esc(c.hotelReference)}</td></tr>`:""}
              <tr><td>Booking type:</td><td>${esc(kind)}</td></tr>
              <tr><td>Status:</td><td>${esc(c.status||"Confirmed")}</td></tr>
              ${c.primaryPassenger?`<tr><td>Lead traveler:</td><td>${esc(c.primaryPassenger)}</td></tr>`:""}
            </table>
          </div>
        </div>
        
        ${renderSegments(c.segments||[])}
        
        ${c.hotelName?`<div class="section-title">Hotel</div><div class="summary-box"><strong>${esc(c.hotelName)}</strong>${c.hotelReference?`<br>Hotel reference: ${esc(c.hotelReference)}`:""}</div>`:""}
        
        <div class="section-title">Important information</div>
        <div class="summary-box">Check all traveler names, travel dates, passport and entry requirements, supplier rules, cancellation conditions, baggage allowances and check-in information before departure. Tickets, vouchers and other documents may be issued separately.</div>
        
        <div class="actions">
          <button class="btn" id="docsBtn">Open travel documents</button>
          <button class="btn secondary" id="profileBtn">My Profile</button>
          <button class="btn secondary" id="homeBtn">Home</button>
        </div>
      </div>
    </article>`;
    
  $("docsBtn").onclick=()=>post("CONFIRMATION_NAVIGATE",{path:"/booking/documents"});
  $("profileBtn").onclick=()=>post("CONFIRMATION_NAVIGATE",{path:"/my-profile"});
  $("homeBtn").onclick=()=>post("CONFIRMATION_NAVIGATE",{path:"/home"})
}

window.addEventListener("message",e=>{
  const m=e.data||{};
  if(m.source!==PARENT)return;
  if(m.type==="CONFIRMATION_LOADED")render(m.payload?.confirmation||{});
  if(m.type==="BOOKING_ERROR")status(m.message||"Could not load confirmation.","error")
});
post("CONFIRMATION_READY");
</script>
</body>
</html>
