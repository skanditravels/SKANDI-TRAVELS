# Booking.documents

STATUS: NEEDS REVIEW
SLUG: /booking/documents
WIX PAGE: Booking.e8twe
AREA: SKANDI
LIVE HTML: YES
ELEMENT: #bookingDocumentsEmbed
LAST SYNCED: 2026-09-16

## HOW TO USE
***STATUS (OWNER): "TODO", "IN PROGRESS", "NEEDS REVIEW", "REVISIONS NEEDED", "READY", "LIVE", "ARCHIVED"
STATUS (AGENT): "TODO", "IN PROGRESS", "REVISIONS NEEDED", "READY".***

###  COMMENT SECTION (START ON A NEW ROW, LOG IF A CHANGE IS MADE THAT REQUIRES ATTENTION) 
1. 9/17 1:02PM "Page is ready styled from my end, page not syncing correctly yet /Samuel"
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
<title>Booking Documents</title>
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
body{font-family:"Montserrat",system-ui,sans-serif;margin:0;background:#fff;color:var(--sk-text);overflow-x:hidden;}

@keyframes fadeUp{0%{opacity:0;transform:translateY(20px)}100%{opacity:1;transform:translateY(0)}}
.wrap{max-width:1180px;margin:0 auto;padding:40px 24px 80px;animation:fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) forwards}

/* --- PREMIUM BOOKING FLOW METER --- */
.sk-stepper-container { position: relative; display: flex; justify-content: space-between; margin-bottom: 48px; padding: 0 10px; animation:fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) forwards; }
.sk-stepper-track { position: absolute; top: 14px; left: 30px; right: 30px; height: 2px; background: var(--sk-border); z-index: 1; }
.sk-stepper-progress { position: absolute; top: 14px; left: 30px; height: 2px; background: var(--sk-cyan); z-index: 2; transition: width 0.8s cubic-bezier(0.16, 1, 0.3, 1); width: 100%; }
.sk-step { position: relative; z-index: 3; display: flex; flex-direction: column; align-items: center; gap: 8px; }
.sk-step-circle { width: 30px; height: 30px; border-radius: 50%; background: #fff; border: 2px solid var(--sk-border); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; color: var(--sk-muted); transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
.sk-step-label { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: var(--sk-muted); transition: color 0.3s ease; }
.sk-step.completed .sk-step-circle { background: var(--sk-blue); border-color: var(--sk-blue); color: #fff; }
.sk-step.completed .sk-step-label { color: var(--sk-blue); }
.sk-step-circle svg { width: 14px; height: 14px; stroke: currentColor; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; fill: none; }

.hero{background:linear-gradient(135deg,var(--sk-light),var(--sk-pale));border:1px solid var(--sk-border);border-radius:24px;padding:40px;box-shadow:var(--sk-shadow);margin-bottom:32px; animation:fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.1s forwards; opacity:0;}
h1,h2,h3{color:var(--sk-blue);letter-spacing:-.04em;margin-top:0}
h1{font-size:clamp(32px,5vw,46px);font-weight:800;margin-bottom:12px;line-height:1}
.hero p{color:#475467;margin:0;font-size:14px;font-weight:500;line-height:1.6}

.status{display:none;border-radius:16px;padding:18px;background:var(--sk-bg);border:1px solid var(--sk-border);margin:14px 0 24px;color:var(--sk-muted);white-space:pre-line;font-size:13px;font-weight:700; animation:fadeUp 0.4s ease forwards;}
.status.show{display:block;}
.ok{background:#ecfdf3;color:var(--sk-ok);border-color:#abefc6}
.err{background:#fff1f0;color:var(--sk-danger);border-color:#ffd5d2}

.grid{display:grid;gap:24px}
.doc{background:#fff;border:1px solid var(--sk-border);border-radius:20px;box-shadow:var(--sk-shadow);overflow:hidden;transition:transform 0.3s cubic-bezier(0.16,1,0.3,1),box-shadow 0.3s ease; animation:fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.2s forwards; opacity:0;}
.doc:hover{transform:translateY(-4px);box-shadow:var(--sk-shadow-strong);border-color:var(--sk-cyan)}
.doc-head{display:grid;grid-template-columns:1fr auto;gap:20px;padding:26px 30px;background:linear-gradient(135deg,var(--sk-light),var(--sk-pale));border-bottom:1px solid var(--sk-border)}
.brand{font-size:18px;font-weight:900;color:var(--sk-blue);letter-spacing:.12em}
.pill{display:inline-flex;background:var(--sk-cyan);color:var(--sk-blue);border-radius:999px;padding:8px 14px;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:.05em}
.doc-body{padding:30px}

.meta{width:100%;border-collapse:collapse}
.meta td{padding:8px 0;font-size:14px;vertical-align:top}
.meta td:first-child{width:42%;color:#475467;font-weight:500;}
.meta td:last-child{font-weight:800;color:var(--sk-blue)}
.pnr{color:var(--sk-blue);font-size:20px!important;letter-spacing:.08em;font-weight:900!important}

.segment{display:grid;grid-template-columns:140px 1fr auto;gap:20px;padding:20px 24px;border:1px solid var(--sk-border);border-radius:16px;align-items:start;margin-bottom:12px;background:var(--sk-bg);transition:border-color 0.2s ease;}
.segment:hover{border-color:var(--sk-cyan);}
.segment:last-child{margin-bottom:0}
.route{font-size:20px;font-weight:900;color:var(--sk-blue);margin-bottom:6px}
.muted{color:var(--sk-muted);font-size:13px;line-height:1.55;font-weight:500}

.voucher{display:grid;grid-template-columns:1fr 1fr;gap:30px}
.issued{display:grid;gap:12px}
.issued-item{display:flex;justify-content:space-between;align-items:center;gap:12px;border:1px solid var(--sk-border);border-radius:12px;padding:16px 20px;font-size:14px;background:var(--sk-bg);transition:border-color 0.2s ease;}
.issued-item:hover{border-color:var(--sk-cyan);}
.issued-item strong{color:var(--sk-blue)}
.empty{padding:48px;text-align:center;color:var(--sk-muted); font-size:14px;}

@media(max-width:760px){
  .doc-head,.voucher,.segment{grid-template-columns:1fr}
  .wrap{padding:24px 16px 60px}
  .hero{padding:30px}
  .segment{gap:12px}
  .sk-step-label{display:none;}
  .sk-stepper-container{margin-bottom:32px;}
}
</style>
</head>
<body>
<div class="wrap">
  
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
    <div class="sk-step completed">
      <div class="sk-step-circle"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg></div>
      <div class="sk-step-label">Done</div>
    </div>
  </div>

  <section class="hero">
    <h1>Travel documents</h1>
    <p>Confirmed itinerary, reservation references and issued travel documents for your SKANDI booking.</p>
  </section>
  
  <div id="status" class="status show">Loading documents...</div>
  <main id="root" class="grid"></main>

</div>
<script>
const SOURCE="SKANDI_BOOKING_DOCUMENTS",PARENT="SKANDI_WIX_PARENT";
const $=id=>document.getElementById(id);
function post(type,payload={}){window.parent.postMessage({source:SOURCE,type,...payload},"*")}
function esc(v=""){return String(v??"").replace(/[&<>"']/g,s=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[s]))}
function status(m,c=""){const e=$("status");e.textContent=m;e.className="status show "+c}

function renderConfirmation(d={}){
  return `<article class="doc">
    <header class="doc-head">
      <div>
        <div class="brand">SKANDI TRAVELS</div>
        <p class="muted" style="margin:6px 0 0">Booking confirmation / travel itinerary</p>
      </div>
      <span class="pill">${esc(d.status||"Confirmed")}</span>
    </header>
    <div class="doc-body">
      <h2 style="font-size:24px; margin-bottom: 20px;">${esc(d.title||"Booking Confirmation")}</h2>
      <table class="meta">
        <tr><td>SKANDI reference:</td><td class="pnr">${esc(d.bookingReference||"")}</td></tr>
        ${d.pnrLocator?`<tr><td>Airline reference:</td><td>${esc(d.pnrLocator)}</td></tr>`:""}
        ${d.hotelReference?`<tr><td>Hotel reference:</td><td>${esc(d.hotelReference)}</td></tr>`:""}
        <tr><td>Booking type:</td><td>${esc(d.confirmationType||"")}</td></tr>
        <tr><td>Status:</td><td>${esc(d.status||"")}</td></tr>
      </table>
      <p class="muted" style="margin-top:20px">${esc(d.summary||"Your SKANDI booking is confirmed.")}</p>
    </div>
  </article>`
}

function renderFlight(d={}){
  const items=d.segments||[];
  return `<article class="doc">
    <header class="doc-head">
      <div>
        <div class="brand">FLIGHT ITINERARY</div>
        <p class="muted" style="margin:6px 0 0">Your confirmed flight routing and airline booking reference.</p>
      </div>
      ${d.pnrLocator?`<span class="pill">${esc(d.pnrLocator)}</span>`:""}
    </header>
    <div class="doc-body">
      ${items.length?items.map(s=>`
        <div class="segment">
          <div>
            <div class="route">${esc(s.origin||"---")} → ${esc(s.destination||"---")}</div>
            <div class="muted" style="color:var(--sk-cyan);font-weight:800">${esc(s.date||"")}</div>
          </div>
          <div>
            <strong style="color:var(--sk-blue);font-size:15px">${esc([s.carrier,s.flightNumber].filter(Boolean).join(" ")||"Flight")}</strong>
            ${s.departureAt?`<div class="muted" style="margin-top:4px">Departure: ${esc(new Date(s.departureAt).toLocaleString())}</div>`:""}
            ${s.arrivalAt?`<div class="muted">Arrival: ${esc(new Date(s.arrivalAt).toLocaleString())}</div>`:""}
          </div>
          <div class="muted">${esc(s.route||"")}</div>
        </div>
      `).join(""):`<div class="empty">No flight segments were returned.</div>`}
    </div>
  </article>`
}

function renderHotel(d={}){
  return `<article class="doc">
    <header class="doc-head">
      <div>
        <div class="brand">HOTEL RESERVATION</div>
        <p class="muted" style="margin:6px 0 0">Accommodation reservation summary.</p>
      </div>
      ${d.hotelReference?`<span class="pill">${esc(d.hotelReference)}</span>`:""}
    </header>
    <div class="doc-body">
      <h2 style="font-size:24px; margin-bottom:20px;">${esc(d.hotelName||"Hotel reservation")}</h2>
      <div class="voucher">
        <table class="meta">
          <tr><td>Check-in:</td><td>${esc(d.checkInDate||"")}</td></tr>
          <tr><td>Check-out:</td><td>${esc(d.checkOutDate||"")}</td></tr>
          <tr><td>Room:</td><td>${esc(d.roomName||"See reservation")}</td></tr>
          <tr><td>Board:</td><td>${esc(d.boardType||"See reservation")}</td></tr>
        </table>
        <table class="meta">
          <tr><td>SKANDI reference:</td><td>${esc(d.bookingReference||"")}</td></tr>
          <tr><td>Hotel reference:</td><td>${esc(d.hotelReference||"")}</td></tr>
          <tr><td>Guests:</td><td>${esc((d.guests||[]).map(g=>g.fullName).filter(Boolean).join(", "))}</td></tr>
        </table>
      </div>
    </div>
  </article>`
}

function renderIssued(d={}){
  const items=d.items||[];
  return `<article class="doc">
    <header class="doc-head">
      <div>
        <div class="brand">ISSUED DOCUMENTS</div>
        <p class="muted" style="margin:6px 0 0">Documents issued by the operating supplier.</p>
      </div>
    </header>
    <div class="doc-body">
      <div class="issued">
        ${items.length?items.map(i=>`
          <div class="issued-item">
            <strong>${esc(i.type||"Travel document")}</strong>
            <span style="font-weight:700;color:var(--sk-muted)">${esc(i.uniqueIdentifier||i.id||"")}</span>
          </div>
        `).join(""):`<div class="empty">No supplier-issued documents are available yet.</div>`}
      </div>
    </div>
  </article>`
}

function render(payload={}){
  const docs=payload.documents||{};
  status("Documents ready.","ok");
  let html="";
  if(docs.confirmation)html+=renderConfirmation(docs.confirmation);
  if(docs.flightItinerary)html+=renderFlight(docs.flightItinerary);
  if(docs.hotelVoucher)html+=renderHotel(docs.hotelVoucher);
  if(docs.issuedDocuments)html+=renderIssued(docs.issuedDocuments);
  $("root").innerHTML=html||`<article class="doc"><div class="empty"><h2>No documents available</h2><p>Documents will appear here after the booking is confirmed and issued.</p></div></article>`;
}

window.addEventListener("message",e=>{
  const m=e.data||{};
  if(m.source!==PARENT)return;
  if(m.type==="BOOKING_DOCUMENTS_LOADED")render(m.payload||{});
  if(m.type==="BOOKING_ERROR")status(m.message||"Could not load documents.","err")
});
post("BOOKING_DOCUMENTS_READY");
</script>
</body>
</html>
