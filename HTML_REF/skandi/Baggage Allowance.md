# Baggage Allowence

STATUS: NEEDS REVIEW
SLUG: /
WIX PAGE: Baggage Allowence.tf8xc
AREA: SKANDI
LIVE HTML: YES
ELEMENT: #baggageInfoEmbed
LAST SYNCED: 2026-09-16

## HOW TO USE
***STATUS (OWNER): "TODO", "IN PROGRESS", "NEEDS REVIEW", "REVISIONS NEEDED", "READY", "LIVE", "ARCHIVED"
STATUS (AGENT): "TODO", "IN PROGRESS", "REVISIONS NEEDED", "READY".***

###  COMMENT SECTION (START ON A NEW ROW, LOG IF A CHANGE IS MADE THAT REQUIRES ATTENTION) 
1. 9/17 5:07PM "Page is not styled from my end, payload wont change, page not syncing correctly yet /Samuel"
2.
3.
...
***END*** 

#### LIVE HTML

```html
<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>SKANDI • Baggage Information · B-011.2</title><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet"><style>
*{box-sizing:border-box;margin:0;padding:0}
:root{
  --sk-blue:#022e64;
  --sk-blue-soft:#285ca8;
  --sk-blue2:#0b3a7a;
  --sk-light:#d7e6ff;
  --sk-pale:#f6faff;
  --sk-bg:#f7faff;
  --sk-border:#dbe3ef;
  --sk-border-soft:#eef2f7;
  --sk-text:#111;
  --sk-body:#555;
  --sk-muted:#667085;
  --sk-cyan:#5FC7CF;
  --sk-ok:#087443;
  --sk-danger:#8a1f1f;
  --sk-shadow:0 8px 26px rgba(0,0,0,.08);
  --sk-shadow-strong:0 14px 34px rgba(0,0,0,.12);
}
html,body{
  width:100%;
  min-height:100%;
  font-family:"Montserrat",system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
  background:#fff;
  color:var(--sk-text);
  overflow-x:hidden;
}

/* HERO SECTION */
#hero-wrap{
  transition: all 0.3s ease;    
  width:100%;
  min-height:420px;
  background: linear-gradient(rgba(2, 46, 100, 0.5), rgba(2, 46, 100, 0.8)), url("https://images.unsplash.com/photo-1551201584-1772cdb93706?auto=format&fit=crop&w=1920&q=80") center/cover;
  padding:76px 32px 54px;
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  text-align:center;
}
.hero-kicker{
  font-size:12px;
  font-weight:800;
  color:var(--sk-cyan);
  text-transform:uppercase;
  letter-spacing:.14em;
  margin-bottom:10px;
}
#hero-title{
  font-size:clamp(36px,4vw,56px);
  line-height:1.1;
  letter-spacing:-.04em;
  font-weight:700;
  color:#fff;
  margin-bottom:16px;
}
#hero-sub{
  font-size:16px;
  color:rgba(255,255,255,0.9);
  line-height:1.65;
  max-width:720px;
}

/* CONTENT LAYOUT */
.content-section{
  padding:58px 32px;
  max-width:1180px;
  margin:0 auto;
}
.section-title{
  font-size:30px;
  font-weight:700;
  color:var(--sk-blue);
  margin-bottom:12px;
  letter-spacing:-.04em;
  text-align:center;
}
.section-subtitle{
  color:#555;
  font-size:15px;
  line-height:1.6;
  margin-bottom:32px;
  max-width:780px;
  text-align:center;
  margin-inline:auto;
}

/* BAGGAGE CARDS (Standard Allowance) */
.bag-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
}
.bag-card {
  background: #fff;
  border: 1px solid var(--sk-border);
  border-radius: 16px;
  padding: 32px;
  box-shadow: var(--sk-shadow);
  display: flex;
  flex-direction: column;
}
.bag-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--sk-border-soft);
}
.bag-icon {
  width: 56px;
  height: 56px;
  background: var(--sk-pale);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: var(--sk-blue);
}
.bag-header h3 {
  font-size: 22px;
  color: var(--sk-blue);
}
.bag-specs {
  display: flex;
  gap: 20px;
  margin-bottom: 24px;
}
.spec-box {
  flex: 1;
  background: var(--sk-bg);
  padding: 16px;
  border-radius: 12px;
  text-align: center;
}
.spec-box span {
  display: block;
  font-size: 11px;
  color: var(--sk-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 4px;
}
.spec-box strong {
  font-size: 18px;
  color: var(--sk-blue);
  font-weight: 800;
}
.bag-card p {
  color: var(--sk-body);
  font-size: 14px;
  line-height: 1.6;
  flex-grow: 1;
}

/* ADD-ON BANNER */
.addon-banner {
  background: linear-gradient(135deg, var(--sk-blue), var(--sk-blue2));
  color: #fff;
  border-radius: 16px;
  padding: 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  box-shadow: var(--sk-shadow);
}
.addon-banner h4 {
  font-size: 20px;
  margin-bottom: 8px;
}
.addon-banner p {
  font-size: 14px;
  color: rgba(255,255,255,0.85);
  line-height: 1.5;
}
.btn-secondary {
  background: #fff;
  color: var(--sk-blue);
  padding: 14px 24px;
  border-radius: 999px;
  border: none;
  font-weight: 800;
  cursor: pointer;
  white-space: nowrap;
  transition: transform 0.2s ease;
}
.btn-secondary:hover {
  transform: scale(1.03);
}

/* SPECIAL BAGGAGE / RULES GRID */
.rules-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}
.rule-card {
  border: 1px solid var(--sk-border);
  border-radius: 12px;
  padding: 24px;
  background: #fff;
}
.rule-card h4 {
  font-size: 16px;
  color: var(--sk-blue);
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.rule-card p {
  font-size: 13px;
  color: var(--sk-body);
  line-height: 1.6;
}

/* FAQ / ACCORDION */
.faq-grid {
  max-width: 800px;
  margin: 0 auto;
}
details {
  background: #fff;
  border: 1px solid var(--sk-border);
  border-radius: 12px;
  margin-bottom: 12px;
  overflow: hidden;
}
summary {
  padding: 20px;
  font-weight: 700;
  color: var(--sk-blue);
  cursor: pointer;
  list-style: none;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
summary::-webkit-details-marker {
  display: none;
}
summary::after {
  content: "+";
  font-size: 20px;
  color: var(--sk-cyan);
}
details[open] summary::after {
  content: "−";
}
.faq-content {
  padding: 0 20px 20px;
  color: var(--sk-body);
  font-size: 14px;
  line-height: 1.6;
}

/* RESPONSIVE */
@media(max-width:860px){
  #hero-wrap { padding: 54px 14px 38px; min-height: 320px; }
  #hero-title { font-size: 32px; }
  .content-section { padding: 42px 14px; }
  .addon-banner { flex-direction: column; text-align: center; }
  .btn-secondary { width: 100%; }
}

/* LIVE AIRLINE SEARCH */
.airline-search-shell{background:#fff;border:1px solid var(--sk-border);border-radius:18px;padding:28px;box-shadow:var(--sk-shadow);margin-bottom:28px}
.search-row{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:end}.search-field label{display:block;font-size:11px;font-weight:800;color:var(--sk-muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px}.search-field input{width:100%;min-height:50px;border:1px solid var(--sk-border);border-radius:14px;padding:0 16px;font:600 14px Montserrat;color:var(--sk-blue);outline:none}.search-field input:focus{border-color:var(--sk-cyan);box-shadow:0 0 0 4px rgba(95,199,207,.12)}
.search-button{min-height:50px;border:0;border-radius:999px;background:var(--sk-blue);color:#fff;padding:0 24px;font-weight:800;cursor:pointer}.search-button:hover{background:var(--sk-blue2)}
.airline-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px;margin-top:18px}.airline-option{border:1px solid var(--sk-border-soft);border-radius:12px;background:#fff;padding:12px 14px;text-align:left;color:var(--sk-blue);font-weight:700;cursor:pointer}.airline-option:hover,.airline-option.active{border-color:var(--sk-cyan);background:var(--sk-pale)}
.live-card{margin-top:24px;background:#fff;border:1px solid var(--sk-border);border-radius:18px;padding:28px;box-shadow:var(--sk-shadow)}.live-head{display:flex;gap:16px;align-items:center;margin-bottom:20px}.live-logo{width:72px;height:48px;object-fit:contain}.live-head h3{font-size:24px;color:var(--sk-blue);margin:0}.live-meta{font-size:12px;color:var(--sk-muted);font-weight:700;text-transform:uppercase;letter-spacing:.08em}.live-copy{white-space:pre-wrap;color:var(--sk-body);font-size:14px;line-height:1.75}
.cabin-block{border-top:1px solid var(--sk-border-soft);padding-top:18px;margin-top:18px}.cabin-block h4{font-size:18px;color:var(--sk-blue);margin-bottom:12px}.fare-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px}.fare-card{border:1px solid var(--sk-border-soft);border-radius:12px;padding:16px;background:var(--sk-bg)}.fare-card h5{font-size:14px;color:var(--sk-blue);margin-bottom:10px}.allowance-line{display:grid;grid-template-columns:120px 1fr;gap:10px;font-size:12px;line-height:1.5;margin-top:8px}.allowance-line strong{color:var(--sk-blue)}
.live-notice{background:var(--sk-pale);border-left:4px solid var(--sk-cyan);border-radius:12px;padding:16px;color:var(--sk-body);font-size:13px;line-height:1.6;margin-bottom:18px}.source-note{font-size:11px;color:var(--sk-muted);margin-top:16px;line-height:1.5}.hidden{display:none!important}.guide-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px;margin-top:20px}
@media(max-width:860px){.search-row{grid-template-columns:1fr}.search-button{width:100%}.allowance-line{grid-template-columns:1fr}}
</style></head><body>
<section id="hero-wrap">
  <div class="hero-kicker">SKANDI BAGGAGE</div>
  <div id="hero-title">Everything You Need to Pack</div>
  <div id="hero-sub">Baggage rules vary by airline, route, fare and passenger. Search your operating airline below for the published SKANDI guidance linked to that airline.</div>
</section>

<section class="content-section">
  <div class="section-title">Find your airline's baggage allowance</div>
  <div class="section-subtitle">Search by airline name or IATA code. The final allowance shown in your booking and by the operating airline remains authoritative.</div>
  <div id="status" class="live-notice">Loading published airline baggage information…</div>
  <div class="airline-search-shell">
    <div class="search-row">
      <div class="search-field"><label for="airlineSearch">Airline</label><input id="airlineSearch" type="search" autocomplete="off" placeholder="Search SAS, Finnair, Norwegian, BA…"></div>
      <button id="airlineSearchButton" class="search-button" type="button">Search airline</button>
    </div>
    <div id="airlineList" class="airline-list"></div>
    <div id="airlineResult" class="live-card hidden"></div>
  </div>

  <div class="section-title">Understanding baggage types</div>
  <div class="section-subtitle">The size, weight and number of pieces depend on the airline and fare you booked.</div>
  <div class="bag-grid">
    <article class="bag-card"><div class="bag-header"><div class="bag-icon">🎒</div><h3>Hand Luggage</h3></div><div class="bag-specs"><div class="spec-box"><span>Weight</span><strong>Varies</strong></div><div class="spec-box"><span>Dimensions</span><strong>Varies</strong></div></div><p>Some fares include only a small under-seat item, while others include an overhead cabin bag. Search your airline above and check the baggage line on your booking.</p></article>
    <article class="bag-card"><div class="bag-header"><div class="bag-icon">🧳</div><h3>Checked Baggage</h3></div><div class="bag-specs"><div class="spec-box"><span>Pieces</span><strong>Fare based</strong></div><div class="spec-box"><span>Weight</span><strong>Fare based</strong></div></div><p>Checked baggage can be included, optional or restricted by route and fare family. Pre-booking additional baggage is often simpler than paying at the airport, when the airline allows it.</p></article>
  </div>
  <div class="addon-banner"><div><h4>Need to bring more?</h4><p>Open your booking to see the baggage options attached to your actual itinerary and fare. Availability and prices are supplier specific.</p></div><button id="manageBooking" class="btn-secondary" type="button">Manage Booking</button></div>
</section>

<section class="content-section" style="background:var(--sk-bg)">
  <div class="section-title">Special Baggage & Security</div>
  <div class="section-subtitle">These are planning reminders. Your operating airline and departure airport can apply more specific rules.</div>
  <div class="rules-grid">
    <div class="rule-card"><h4>👶 Strollers & Child Equipment</h4><p>Many airlines have special allowances for strollers, car seats and child equipment. Whether they are free, checked at the counter or delivered at the aircraft door depends on the carrier and airport.</p></div>
    <div class="rule-card"><h4>⛳ Sports Equipment</h4><p>Golf bags, skis, bicycles and other oversized equipment often require advance booking because aircraft hold space and handling rules are limited.</p></div>
    <div class="rule-card"><h4>🔋 Batteries & Powerbanks</h4><p>Portable lithium batteries and powerbanks are normally subject to cabin-baggage restrictions and capacity limits. Confirm the airline's dangerous-goods rules before packing.</p></div>
    <div class="rule-card"><h4>💧 Liquids at Security</h4><p>Liquid screening rules can vary by airport and security technology. Many airports still apply the familiar 100 ml container rule, but check your departure and transfer airports before travel.</p></div>
  </div>
  <div id="guidance" class="guide-grid"></div>
</section>

<section class="content-section">
  <div class="section-title">Frequently Asked Questions</div>
  <div class="faq-grid">
    <details><summary>Can travelers on the same booking pool baggage weight?</summary><div class="faq-content">Some airlines allow pooling and others do not. Individual-bag safety limits may still apply. Search the operating airline above and review your fare conditions.</div></details>
    <details><summary>Is baggage included for infants?</summary><div class="faq-content">Infant baggage allowances vary significantly by airline, route and ticket type. Strollers or child seats may have separate rules.</div></details>
    <details><summary>What if my cabin bag is too large or heavy?</summary><div class="faq-content">The airline may require the bag to be checked and may charge an airport or gate fee. The exact handling depends on the operating carrier and fare.</div></details>
  </div>
</section>
<script>
(()=>{"use strict";
const SOURCE="SKANDI_BAGGAGE_PAGE",PARENT="SKANDI_WIX_PARENT",VERSION="BACKEND-BASE-1.0-B011.2";
const $=id=>document.getElementById(id),esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let DATA={airlines:[],guidance:[]},selectedId="";
function post(type,payload={}){window.parent.postMessage({source:SOURCE,type,payload,timestamp:new Date().toISOString()},"*")}
function airlineLabel(x){return `${x.name||x.title||x.shortName||x.iataCode||"Airline"}${x.iataCode?` (${x.iataCode})`:""}`}
function filteredAirlines(){const q=String($("airlineSearch").value||"").trim().toLowerCase();const rows=DATA.airlines||[];if(!q)return rows.slice(0,12);return rows.filter(x=>`${x.name||""} ${x.title||""} ${x.shortName||""} ${x.iataCode||""} ${x.icaoCode||""}`.toLowerCase().includes(q)).slice(0,20)}
function renderAirlineList(){const rows=filteredAirlines();$("airlineList").innerHTML=rows.length?rows.map(x=>`<button type="button" class="airline-option ${selectedId===x.id?"active":""}" data-airline-id="${esc(x.id)}">${esc(airlineLabel(x))}</button>`).join(""):`<div class="live-notice">No matching airline is published in SKANDI Travel Info.</div>`;$("airlineList").querySelectorAll("[data-airline-id]").forEach(btn=>btn.onclick=()=>selectAirline(btn.dataset.airlineId))}
function renderStructured(baggage){return (baggage.cabins||[]).map(cabin=>`<section class="cabin-block"><h4>${esc(cabin.cabinType||cabin.travelClass||"Cabin")}</h4><div class="fare-grid">${(cabin.fares||[]).map(fare=>`<article class="fare-card"><h5>${esc(fare.name||"Fare")}</h5>${fare.description?`<div class="live-copy" style="font-size:12px;margin-bottom:10px">${esc(fare.description)}</div>`:""}${fare.underSeatBag?`<div class="allowance-line"><strong>Under-seat</strong><span>${esc(fare.underSeatBag)}</span></div>`:""}${fare.overheadCarryOn?`<div class="allowance-line"><strong>Cabin bag</strong><span>${esc(fare.overheadCarryOn)}</span></div>`:""}${fare.checkedBag?`<div class="allowance-line"><strong>Checked bag</strong><span>${esc(fare.checkedBag)}</span></div>`:""}</article>`).join("")}</div></section>`).join("")}
function selectAirline(id){const x=(DATA.airlines||[]).find(item=>item.id===id);if(!x)return;selectedId=id;$("airlineSearch").value=x.name||x.title||x.iataCode||"";renderAirlineList();const bag=x.baggage||{mode:"none"};let body="";if(bag.mode==="structured")body=renderStructured(bag);else if(bag.mode==="narrative")body=`<div class="live-copy">${esc(bag.text||"")}</div>`;else body=`<div class="live-notice">No baggage allowance is currently published for this airline in SKANDI Travel Info. Check your booking and the airline's official information.</div>`;$("airlineResult").classList.remove("hidden");$("airlineResult").innerHTML=`<div class="live-head">${x.logo?`<img class="live-logo" src="${esc(x.logo)}" alt="">`:""}<div><div class="live-meta">Published airline guidance</div><h3>${esc(x.name||x.title||x.iataCode||"Airline")}</h3>${x.iataCode?`<div class="live-meta">IATA ${esc(x.iataCode)}${x.icaoCode?` · ICAO ${esc(x.icaoCode)}`:""}</div>`:""}</div></div>${body}${x.website?`<div class="source-note">Official airline website: <a href="${esc(x.website)}" target="_blank" rel="noopener">${esc(x.website)}</a></div>`:""}<div class="source-note">Always use the operating carrier and your booked fare as the final baggage authority.</div>`}
function runSearch(){const rows=filteredAirlines();renderAirlineList();if(rows.length===1)selectAirline(rows[0].id)}
function renderGuidance(){const rows=DATA.guidance||[];$("guidance").innerHTML=rows.length?rows.map(x=>`<article class="rule-card"><h4>${esc(x.title||"Baggage guidance")}</h4><p>${esc(x.excerpt||x.summary||x.body||"")}</p></article>`).join(""):""}
function render(){renderAirlineList();renderGuidance();const count=(DATA.airlines||[]).length;$("status").textContent=count?`${count} published airlines loaded from SKANDI Travel Info. Search by airline name or code.`:"No published airline baggage data is currently available. Confirm baggage directly with the operating airline."}
$("airlineSearch").addEventListener("input",renderAirlineList);$("airlineSearch").addEventListener("keydown",e=>{if(e.key==="Enter")runSearch()});$("airlineSearchButton").onclick=runSearch;$("manageBooking").onclick=()=>post("BAGGAGE_NAVIGATE",{path:"/my-profile"});
window.addEventListener("message",e=>{let m=e.data;if(typeof m==="string"){try{m=JSON.parse(m)}catch(_){return}}if(!m||m.source!==PARENT)return;if(m.type==="BAGGAGE_HOST_READY")post("BAGGAGE_READY",{language:"EN",version:VERSION});else if(m.type==="BAGGAGE_LOADING")$("status").textContent="Loading published airline baggage information…";else if(m.type==="BAGGAGE_DATA"){DATA=m.payload||DATA;render()}else if(m.type==="BAGGAGE_ERROR")$("status").textContent=m.payload?.message||"Baggage guidance is unavailable."});
post("BAGGAGE_READY",{language:"EN",version:VERSION});
})();
</script></body></html>
