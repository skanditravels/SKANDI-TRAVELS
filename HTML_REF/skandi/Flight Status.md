# Flight Status

STATUS: IN PROGRESS
SLUG: /travel-info/flight-status
WIX PAGE: Flight Status.cn7ah
AREA: SKANDI
LIVE HTML: YES
ELEMENT: #hflightStatusEmbed
LAST SYNCED: 2026-09-16

## HOW TO USE
***STATUS (OWNER): "TODO", "IN PROGRESS", "NEEDS REVIEW", "REVISIONS NEEDED", "READY", "LIVE", "ARCHIVED"
STATUS (AGENT): "TODO", "IN PROGRESS", "REVISIONS NEEDED", "READY".***

###  COMMENT SECTION (START ON A NEW ROW, LOG IF A CHANGE IS MADE THAT REQUIRES ATTENTION) 
1. 9/18 3:07PM "Unsure if API is working. Pagecode is wrong. Design is set /Samuel"
2.
3.
...
***END*** 

#### LIVE HTML

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SKANDI Flight Status</title>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Roboto+Mono:wght@500;700&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{
  font-family:"Montserrat",sans-serif;
  background-color: #02060d;
  background-image: url('https://static.wixstatic.com/media/394052_0036344e484f44999d9a0d52a2258d1b~mv2.png');
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  color:#fff;
  padding:32px 24px;
  min-height: 100vh;
  position: relative;
}

/* Dark overlay to ensure the board pops against the background */
body::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(4, 12, 24, 0.75); 
  pointer-events: none;
  z-index: 0;
}
.board{
  max-width:1500px;
  margin:0 auto;
  position: relative;
  z-index: 1;
}
.head{
  display:flex;
  justify-content:space-between;
  align-items:center;
  margin-bottom:20px;
  gap:20px;
}
.logo{
  height:36px;
  width:auto;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
}
.title{
  font-size:32px;
  font-weight:700;
  letter-spacing: -0.02em;
  text-shadow: 0 4px 12px rgba(0,0,0,0.8);
  margin-top: 4px;
}
.meta{
  color:#8fd3ff;
  font-size:13px;
  font-weight: 500;
  opacity: 0.8;
}

/* Hardware LED Live Indicator */
.live-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #0a0e14;
  padding: 6px 14px;
  border-radius: 4px;
  border: 1px solid #1a222d;
  font-size: 11px;
  font-weight: 700;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.1);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #5d8ab5;
}
.live-dot {
  width: 8px;
  height: 8px;
  background: #67fca9;
  border-radius: 50%;
  box-shadow: 0 0 8px #67fca9;
  animation: pulse 1.5s infinite cubic-bezier(0.4, 0, 0.2, 1);
}
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.8); }
}

/* =========================================
   COMPACT MECHANICAL CONTROL PANEL
   ========================================= */
.controls{
  background: #1a1e24; /* Matches hardware casing */
  border: 6px solid #0a0e14;
  border-radius: 8px;
  padding: 16px 20px;
  margin-bottom: 24px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.7), inset 0 2px 10px rgba(0,0,0,0.5);
  position: relative;
}
.controls::before {
  content: '';
  position: absolute;
  top: 4px; left: 4px; right: 4px; bottom: 4px;
  border: 1px solid rgba(255,255,255,0.04);
  border-radius: 4px;
  pointer-events: none;
}
.mode-tabs{
  display:flex;
  flex-wrap:wrap;
  gap:6px;
  margin-bottom:16px;
  position: relative;
  z-index: 2;
}
.tab{
  background: #0d1218;
  border: 1px solid #000;
  color: #5d8ab5;
  border-radius: 3px;
  min-height: 28px;
  padding: 0 14px;
  font-size: 10px;
  font-family: 'Roboto Mono', monospace;
  font-weight: 700;
  letter-spacing: .05em;
  text-transform: uppercase;
  cursor: pointer;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.05), 0 2px 4px rgba(0,0,0,0.5);
  transition: all 0.1s ease;
}
.tab:hover {
  background: #141b24;
  color: #8fd3ff;
}
.tab.active{
  background: #1a222d;
  color: #8fd3ff;
  border-color: #000;
  box-shadow: inset 0 2px 6px rgba(0,0,0,0.8); /* Pressed-in effect */
  transform: translateY(1px);
}
.form-grid{
  display:grid;
  grid-template-columns:repeat(12,1fr);
  gap:12px;
  align-items:end;
  position: relative;
  z-index: 2;
}
.field{
  display:flex;
  flex-direction:column;
  gap:6px;
}
.field label{
  color:#7b8f9e;
  font-size:9px;
  font-weight:700;
  text-transform:uppercase;
  letter-spacing:.15em;
}
.field input,.field select{
  width:100%;
  min-height:34px;
  border-radius:3px;
  border:1px solid #000;
  background: #02060d; /* Deep recessed LCD color */
  color:#e0e0e0;
  padding:4px 10px;
  font-family: 'Roboto Mono', monospace; /* Monospace input to match flaps */
  font-size: 14px;
  font-weight: 500;
  outline:none;
  transition: all 0.2s ease;
  box-shadow: inset 0 3px 6px rgba(0,0,0,0.8);
}
.field input:focus,.field select:focus{
  border-color:#5d8ab5;
  color: #fff;
  box-shadow: 0 0 0 1px #5d8ab5, inset 0 3px 6px rgba(0,0,0,0.8);
}
.field input::placeholder {
  color: rgba(123, 143, 158, 0.4);
}
.col-2{grid-column:span 2}
.col-3{grid-column:span 3}
.col-4{grid-column:span 4}
.col-5{grid-column:span 5}
.col-6{grid-column:span 6}
.col-12{grid-column:span 12}
.btn{
  min-height:34px;
  border:1px solid #000;
  border-radius:3px;
  background: #233242; /* Matte mechanical button */
  color:#fff;
  padding:0 16px;
  font-family: 'Roboto Mono', monospace;
  font-size:11px;
  font-weight:700;
  letter-spacing:.08em;
  text-transform:uppercase;
  cursor:pointer;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.1), 0 2px 4px rgba(0,0,0,0.6);
  transition: all 0.1s ease;
}
.btn:hover {
  background: #2a3d52;
}
.btn:active {
  transform: translateY(2px);
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.6);
}
.btn.secondary{
  background: #0d1218;
  color: #7b8f9e;
}
.btn.secondary:hover {
  background: #141b24;
  color: #fff;
}
.hint{
  margin-top:14px;
  color:#5d758a;
  font-family: 'Roboto Mono', monospace;
  font-size:10px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
  text-transform: uppercase;
}
.notice{
  display:none;
  margin-bottom:16px;
  border-radius:4px;
  padding:10px 14px;
  background:#02060d;
  border:1px solid #000;
  color:#67fca9;
  font-family: 'Roboto Mono', monospace;
  font-size:12px;
  font-weight: 500;
  box-shadow: inset 0 2px 6px rgba(0,0,0,0.8);
  animation: slideDown 0.2s ease-out;
}
@keyframes slideDown {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}
.notice.error{
  display:block;
  color:#ff7a7a;
}
.notice.ok{display:block}

/* Retro Mechanical Hardware Casing for the Board */
.hardware-casing {
  background: #1a1e24;
  border: 8px solid #0a0e14;
  border-radius: 8px;
  box-shadow: 0 30px 60px rgba(0,0,0,0.8), inset 0 2px 10px rgba(0,0,0,0.5);
  padding: 16px 20px 24px;
  position: relative;
}
.hardware-casing::before {
  content: '';
  position: absolute;
  top: 4px; left: 4px; right: 4px; bottom: 4px;
  border: 1px solid rgba(255,255,255,0.04);
  border-radius: 4px;
  pointer-events: none;
}

.table-wrap{
  width:100%;
  overflow-x:auto;
}
.table{
  width:100%;
  border-collapse:separate;
  border-spacing: 0 4px;
  min-width:1450px; 
}
th,td{
  padding: 8px;
  text-align:left;
  vertical-align:middle;
}
thead tr{
  background:transparent;
}
thead th{
  font-size:10px;
  color:#7b8f9e;
  text-transform:uppercase;
  letter-spacing:.15em;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}

/* Mechanical Module Row */
tbody tr{
  background: #0d1218; 
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.03);
  border-radius: 4px;
  height: 48px; 
}
tbody td:first-child { border-top-left-radius: 4px; border-bottom-left-radius: 4px; padding-left: 14px; }
tbody td:last-child { border-top-right-radius: 4px; border-bottom-right-radius: 4px; padding-right: 14px;}

/* =========================================
   TRUE SPLIT-FLAP MECHANICS
   ========================================= */
.flap-container {
  display: inline-flex;
  gap: 1px;
  background: #000;
  padding: 2px;
  border-radius: 3px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.5);
  white-space: nowrap;
  position: relative;
}
.flap {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  width: 15px; 
  height: 26px;
  background: #181818; 
  color: #e0e0e0; 
  font-family: 'Roboto Mono', monospace;
  font-size: 14px;
  font-weight: 500;
  border-radius: 2px;
  position: relative;
  border: 1px solid #080808;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.1);
  transform-origin: center center;
  animation: flapFlipDown 0.4s cubic-bezier(0.4, 0, 0.2, 1) both;
}

/* The physical split line through the middle */
.flap::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 2px;
  background: #000;
  box-shadow: 0 1px 0 rgba(255,255,255,0.05);
  transform: translateY(-50%);
  z-index: 2;
}

@keyframes flapFlipDown {
  0% { transform: rotateX(-90deg); filter: brightness(0.5); }
  100% { transform: rotateX(0deg); filter: brightness(1); }
}

/* Base Classes for Display Toggling */
.tv-text { display: none; }
.flap-letters { display: inline-flex; }
.desktop-logo-img { display: inline-block; }
.mobile-logo-img { display: none; }

/* ENGRAVED LOGO OVERLAY */
.logo-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1; 
  pointer-events: none;
  padding: 4px 10px;
}
.logo-overlay img {
  max-width: 100%;
  max-height: 18px; 
  object-fit: contain;
  filter: brightness(0) invert(1) drop-shadow(0 -1px 1px rgba(0,0,0,0.8));
  opacity: 0.45;
  animation: logoFadeIn 0.8s ease-in-out both;
  animation-delay: 0.3s; 
}
@keyframes logoFadeIn {
  from { opacity: 0; filter: blur(4px) brightness(0) invert(1); }
  to { opacity: 0.45; filter: blur(0px) brightness(0) invert(1) drop-shadow(0 -1px 1px rgba(0,0,0,0.8)); }
}

/* Status Flap Colors */
.flap-ok .flap { color: #8fffc1; }
.flap-warn .flap { color: #ffd27a; }
.flap-bad .flap { color: #ff7a7a; }

.route-slash {
  color: #5d8ab5;
  margin: 0 4px;
  font-size: 16px;
  font-weight: 700;
  display: inline-block;
}

@media(max-width:1000px){
  .form-grid{grid-template-columns:repeat(6,1fr)}
  .col-2, .col-3 {grid-column: span 3}
}
@media(max-width:400px){
  body{padding:16px}
  .head{display:block}
  .title{font-size:26px;margin-top:10px}
  .live-indicator { margin-top: 16px; width: max-content; }
  .form-grid{grid-template-columns:1fr}
  .col-2,.col-3,.col-4,.col-5,.col-6,.col-12{grid-column:auto}
  .btn{width:100%}
  .controls, .hardware-casing { padding: 12px; border-width: 4px; }
  
  /* =========================================
     TV FIDS MOBILE OVERRIDES
     ========================================= */
  .hardware-casing {
    background: #080e1a;
    border: 2px solid #1e293b;
    border-radius: 4px;
    box-shadow: 0 15px 40px rgba(0,0,0,0.95);
    padding: 0;
  }
  th, td { padding: 10px 8px; }
  thead th {
    background: #02060d;
    color: #94a3b8;
    font-size: 10px;
    border-bottom: 2px solid #334155;
    padding: 12px 8px;
  }
  tbody tr {
    background: #0f172a;
    height: 44px;
    box-shadow: none;
    border-radius: 0;
    border-bottom: 1px solid #1e293b;
  }
  tbody tr:nth-child(even) { background: #0a101d; }
  tbody td:first-child, tbody td:last-child {
    border-radius: 0;
    padding-left: 8px;
    padding-right: 8px;
  }

  .flap-letters { display: none !important; }
  .flap-container {
    background: transparent !important;
    padding: 0 !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    display: block !important;
  }

  .tv-text {
    display: inline-block !important;
    font-family: 'Montserrat', sans-serif !important;
    font-size: 11px !important;
    font-weight: 600 !important;
    color: #f1f5f9 !important;
  }
  .flap-warn .tv-text { color: #ffb703 !important; }
  .flap-bad .tv-text { color: #ef4444 !important; }
  
  /* MOBILE SOLID WHITE LOGO DISPLAY (WITH FLEX FIX) */
  .desktop-logo-img { display: none !important; }
  .mobile-logo-img {
    display: inline-block !important;
    height: 18px !important;
    width: 80px !important;
    object-fit: contain;
    filter: brightness(0) !important; 
    opacity: 1 !important;
    animation: none !important;
  }
  .logo-overlay {
    position: relative !important;
    padding: 3px 6px !important;
    background: #ffffff !important;
    border-radius: 3px !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
  }
  .route-slash {
    font-size: 12px;
    margin: 0 2px;
  }
}
</style>
</head>
<body>
<div class="board">
  <div class="head">
    <div>
      <img class="logo" src="https://static.wixstatic.com/media/394052_fafffe6d26434eddbf62eb645ee9c844~mv2.png" alt="SKANDI Travels">
      <div class="title">Terminal Flight Board</div>
      <div class="meta" id="boardMeta">Locate specific itinerary via carrier code & flight number.</div>
    </div>
    <div class="live-indicator">
      <div class="live-dot"></div>
      <span id="updatedAt">Live Sync</span>
    </div>
  </div>

  <div class="controls" aria-label="Flight status search">
    <div class="mode-tabs" role="tablist" aria-label="Search type">
      <button class="tab active" type="button" data-mode="flight">Flight Number</button>
      <button class="tab" type="button" data-mode="route">From / To</button>
      <button class="tab" type="button" data-mode="airport">Airport Board</button>
    </div>

    <div id="notice" class="notice"></div>

    <div class="form-grid">
      <div class="field col-3" data-field="flight">
        <label for="flightNumber">Flight Number</label>
        <input id="flightNumber" placeholder="SK502" autocomplete="off">
      </div>

      <div class="field col-2" data-field="from" style="display:none;">
        <label for="fromAirport">From</label>
        <input id="fromAirport" placeholder="CPH" maxlength="4" autocomplete="off">
      </div>

      <div class="field col-2" data-field="to" style="display:none;">
        <label for="toAirport">To</label>
        <input id="toAirport" placeholder="ARN" maxlength="4" autocomplete="off">
      </div>

      <div class="field col-2" data-field="airport" style="display:none;">
        <label for="airport">Airport</label>
        <input id="airport" placeholder="CPH" maxlength="4" autocomplete="off">
      </div>

      <div class="field col-3">
        <label for="date">Date</label>
        <input id="date" type="date">
      </div>

      <div class="field col-2">
        <label for="boardType">Board</label>
        <select id="boardType">
          <option value="departures">Departures</option>
          <option value="arrivals">Arrivals</option>
        </select>
      </div>

      <div class="field col-2">
        <label>&nbsp;</label>
        <button class="btn" id="searchBtn" type="button">Search</button>
      </div>

      <div class="field col-2">
        <label>&nbsp;</label>
        <button class="btn secondary" id="clearBtn" type="button">Clear</button>
      </div>
    </div>

    <div class="hint" id="dateHint">Allowed range: yesterday to three days ahead.</div>
  </div>

  <div class="hardware-casing">
    <div class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Flight No.</th>
            <th>Dep. Time</th>
            <th>Departure</th>
            <th>Arr. Time</th>
            <th>Arrival</th>
            <th>Airline</th>
            <th>Remarks</th>
            <th>Go To Gate</th>
          </tr>
        </thead>
        <tbody id="rows">
          <tr><td colspan='9' style="text-align: center; color: #4a5d70; padding: 40px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;">Awaiting Flight Parameters...</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</div>

<script>
(function(){
  const SOURCE = "SKANDI_FLIGHT_STATUS";
  const PARENT_SOURCE = "SKANDI_WIX_PARENT";
  let currentMode = "flight";

  const el = (id) => document.getElementById(id);
  const fields = {
    flight: document.querySelector('[data-field="flight"]'),
    from: document.querySelector('[data-field="from"]'),
    to: document.querySelector('[data-field="to"]'),
    airport: document.querySelector('[data-field="airport"]')
  };

  function post(type, payload){
    window.parent.postMessage({
      source: SOURCE,
      type,
      payload: payload || {},
      timestamp: new Date().toISOString()
    }, "*");
  }

  function isoDate(d){
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0,10);
  }

  function setDateLimits(){
    const today = new Date();
    const min = new Date(today);
    min.setDate(today.getDate() - 1);
    const max = new Date(today);
    max.setDate(today.getDate() + 3);

    el("date").min = isoDate(min);
    el("date").max = isoDate(max);
    if(!el("date").value) el("date").value = isoDate(today);

    el("dateHint").textContent = `System constraint: ${el("date").min} // ${el("date").max}`;
  }

  function setMode(mode){
    currentMode = mode;
    document.querySelectorAll(".tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.mode === mode));

    fields.flight.style.display = mode === "flight" ? "flex" : "none";
    fields.from.style.display = mode === "route" ? "flex" : "none";
    fields.to.style.display = mode === "route" ? "flex" : "none";
    fields.airport.style.display = mode === "airport" ? "flex" : "none";

    if(mode === "flight"){
      el("boardMeta").textContent = "Locate specific itinerary via carrier code & flight number.";
    } else if(mode === "route"){
      el("boardMeta").textContent = "Filter schedule by origin & destination IATA codes.";
    } else {
      el("boardMeta").textContent = "View live terminal departures or arrivals board.";
    }

    setNotice("");
  }

  function cleanIata(value){
    return String(value || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  }

  function values(){
    return {
      mode: currentMode,
      flightNumber: cleanIata(el("flightNumber").value),
      from: cleanIata(el("fromAirport").value),
      to: cleanIata(el("toAirport").value),
      airport: cleanIata(el("airport").value),
      date: el("date").value,
      boardType: el("boardType").value
    };
  }

  function validate(v){
    if(!v.date) return "ERR: SELECT SCHEDULE DATE";

    const selected = new Date(v.date + "T12:00:00");
    const min = new Date(el("date").min + "T00:00:00");
    const max = new Date(el("date").max + "T23:59:59");

    if(selected < min || selected > max) return "ERR: DATE EXCEEDS OPERATIONAL WINDOW";
    if(v.mode === "flight" && !v.flightNumber) return "ERR: FLIGHT NUMBER REQUIRED";
    if(v.mode === "route" && !v.from && !v.to) return "ERR: ORIGIN OR DEST REQUIRED";
    if(v.mode === "airport" && !v.airport) return "ERR: AIRPORT IATA REQUIRED";

    return "";
  }

  function setNotice(message, isError){
    const notice = el("notice");
    if(!message){
      notice.style.display = "none";
      notice.textContent = "";
      return;
    }
    notice.className = isError ? "notice error" : "notice ok";
    notice.textContent = message;
    notice.style.display = "block";
  }

  function search(){
    const v = values();
    const error = validate(v);
    if(error){
      setNotice(error, true);
      return;
    }
    setNotice("");
    el("rows").innerHTML = `<tr><td colspan='9' style="text-align:center; padding: 60px;"><div class="live-dot" style="margin: 0 auto;"></div></td></tr>`;
    post("FLIGHT_STATUS_SEARCH", v);
  }

  function fmtDate(value){
    if(!value) return "";
    const d = new Date(value);
    if(Number.isNaN(d.getTime())) return String(value).slice(0,9);
    const months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
    return `${months[d.getMonth()]} ${String(d.getDate()).padStart(2,'0')}`;
  }

  function fmtTime(value){
    if(!value) return "";
    const d = new Date(value);
    if(Number.isNaN(d.getTime())) return String(value).slice(0,5);
    return d.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit", hour12: false });
  }

  function statusColorClass(status){
    const s = String(status || "").toLowerCase();
    if(s.includes("delay") || s.includes("incident") || s.includes("divert") || s.includes("estimated") || s.includes("board")) return "flap-warn";
    if(s.includes("cancel")) return "flap-bad";
    return "flap-ok";
  }

  function getAirlineLogo(name) {
    const n = String(name || "").toUpperCase();
    if (n.includes("ALASKA") || n.includes("HAWAIIAN") || n === "AS") {return "https://static.wixstatic.com/shapes/394052_6535b791dd404055903a12f5350d61c3.svg,https://static.wixstatic.com/shapes/394052_5bb1675bcf714b2c841e938d36962878.svg";}
    if(n.includes("AMERICAN") || n.includes("AA")) return "https://static.wixstatic.com/shapes/394052_47809f4547c04f6eb7e098c5602ff57c.svg";
    if(n.includes("BANGKOK") || n.includes("PG")) return "https://static.wixstatic.com/shapes/394052_3627db92f99544d8bc42c98e684ce5d4.svg"; 
    if (n.includes("BRITISH") || n.includes("BA")) {
        return "https://static.wixstatic.com/shapes/394052_85c56f21c63c42d2b5fba0273ee3b0a6.svg";}
    if(n.includes("DELTA") || n.includes("DL")) return "https://static.wixstatic.com/shapes/394052_4f692ba92b43482292d87d1c6b7df036.svg";   
    if(n.includes("FINNAIR") || n.includes("AY")) return "https://static.wixstatic.com/shapes/394052_97cf9b3a9a884781b3186ededecd7b45.svg";
    if(n.includes("FRONTIER") || n.includes("F9")) return "https://static.wixstatic.com/shapes/394052_cca48f82a42043d79743561a784e92c8.svg";
    if(n.includes("IBERIA") || n.includes("IB")) return "https://static.wixstatic.com/shapes/394052_3726a2f12dcd44ab8dea7085713902b9.svg";
    if(n.includes("ICELANDAIR") || n.includes("FI")) return "https://static.wixstatic.com/shapes/394052_e09b3c2f6dfd4ca3a87497e34f538c53.svg";
    if(n.includes("JETBLUE") || n.includes("B6")) return "https://static.wixstatic.com/shapes/394052_d0e052d862be40cba0231eae50b4b5dd.svg";
    if(n.includes("KLM") || n.includes("KL")) return "https://static.wixstatic.com/shapes/394052_0c2eaf7331a147648b444fdb12329073.svg";
    if(n.includes("LUFTHANSA") || n.includes("LH")) return "https://static.wixstatic.com/shapes/394052_76a1dce4673a429d86b4d816faf88b6d.svg";
    if(n.includes("NORSE") || n.includes("N0") || n.includes("Z0")) return "https://static.wixstatic.com/shapes/394052_2c0b19b3399a4938a36e4dd7d8820c91.svg";
    if(n.includes("NORWEGIAN") || n.includes("D8") || n.includes("DY")) return "https://static.wixstatic.com/shapes/394052_05f76b5094374d11951f14a93fa1ea88.svg";
    if (n.includes("SAS") || n.includes("SCANDINAVIAN") || n === "SK") {return "https://static.wixstatic.com/shapes/394052_bfbc7fc4f8b74360bf5398ac8d12a280.svg";}
    if(n.includes("SWISS") || n.includes("LX")) return "https://static.wixstatic.com/shapes/394052_69b2702a5c434d03a9aa0182c430979e.svg";
    if(n.includes("THAI") || n.includes("TG")) return "https://static.wixstatic.com/shapes/394052_c370132e76c64a29befdfd67496234fe.svg";
    if(n.includes("UNITED") || n.includes("UA")) return "https://static.wixstatic.com/shapes/394052_6002f849a3574cd4827d4ba1c3d339ef.svg";
    return "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Star_Alliance_logo.svg/2560px-Star_Alliance_logo.svg.png"; 
  }

  function getAirlineMobileLogo(name) {
    const n = String(name || "").toUpperCase();
    if (n.includes("ALASKA") || n.includes("HAWAIIAN") || n === "AS") {return "https://static.wixstatic.com/media/394052_e25e41b407f34c9db7a77db92d871dd7~mv2.png,https://static.wixstatic.com/shapes/394052_71baaaf34d4b495996bb80015b4f61e3.svg,https://static.wixstatic.com/shapes/394052_5bb1675bcf714b2c841e938d36962878.svg";}
    if(n.includes("AMERICAN") || n.includes("AA")) return "https://static.wixstatic.com/shapes/394052_47809f4547c04f6eb7e098c5602ff57c.svg";
    if(n.includes("BANGKOK") || n.includes("PG")) return "https://static.wixstatic.com/shapes/394052_3627db92f99544d8bc42c98e684ce5d4.svg"; 
    if (n.includes("BRITISH") || n.includes("BA")) {
        return "https://static.wixstatic.com/shapes/394052_85c56f21c63c42d2b5fba0273ee3b0a6.svg";}
    if(n.includes("DELTA") || n.includes("DL")) return "https://static.wixstatic.com/shapes/394052_377043bf26d7497b8c2768693bb823be.svg";   
    if(n.includes("FINNAIR") || n.includes("AY")) return "https://static.wixstatic.com/shapes/394052_97cf9b3a9a884781b3186ededecd7b45.svg";
    if(n.includes("FRONTIER") || n.includes("F9")) return "https://static.wixstatic.com/shapes/394052_cca48f82a42043d79743561a784e92c8.svg";
    if(n.includes("IBERIA") || n.includes("IB")) return "https://static.wixstatic.com/shapes/394052_3726a2f12dcd44ab8dea7085713902b9.svg";
    if(n.includes("ICELANDAIR") || n.includes("FI")) return "https://static.wixstatic.com/shapes/394052_e09b3c2f6dfd4ca3a87497e34f538c53.svg";
    if(n.includes("JETBLUE") || n.includes("B6")) return "https://static.wixstatic.com/shapes/394052_b77843700bd7450ea2fdc315f34f2c7b.svg";
    if(n.includes("KLM") || n.includes("KL")) return "https://static.wixstatic.com/shapes/394052_0c2eaf7331a147648b444fdb12329073.svg";
    if(n.includes("LUFTHANSA") || n.includes("LH")) return "https://static.wixstatic.com/shapes/394052_faab76c9dd784c1099c2ea8aa6296ad1.svg";
    if(n.includes("NORSE") || n.includes("N0") || n.includes("Z0")) return "https://static.wixstatic.com/shapes/394052_2c0b19b3399a4938a36e4dd7d8820c91.svg";
    if(n.includes("NORWEGIAN") || n.includes("D8") || n.includes("DY")) return "https://static.wixstatic.com/media/394052_447bec5532dc4efab1b1775d6b92170f~mv2.png";
    if (n.includes("SAS") || n.includes("SCANDINAVIAN") || n === "SK") {return "https://static.wixstatic.com/shapes/394052_a0d0be73c163471b97280438e22247fe.svg";}
    if(n.includes("SWISS") || n.includes("LX")) return "https://static.wixstatic.com/shapes/394052_69b2702a5c434d03a9aa0182c430979e.svg";
    if(n.includes("THAI") || n.includes("TG")) return "https://static.wixstatic.com/shapes/394052_c370132e76c64a29befdfd67496234fe.svg";
    if(n.includes("UNITED") || n.includes("UA")) return "https://static.wixstatic.com/shapes/394052_2bcd8cefebfa4daf85cf962e23302058.svg";
    return "https://static.wixstatic.com/media/394052_0f900c2c6bf9407ea5cf8e78394e7b9c~mv2.png"; 
  }

  function createFlaps(str, exactLength = 0, statusClass = "") {
    if (!str) str = "";
    const cleanText = String(str).trim().toUpperCase(); 
    str = String(str).toUpperCase();
    if (exactLength && str.length > exactLength) str = str.substring(0, exactLength);
    while (exactLength && str.length < exactLength) str += " "; 
    
    const flapSpans = str.split('').map((char) => {
      const delay = (Math.random() * 0.5).toFixed(2);
      return `<span class="flap" style="animation-delay: ${delay}s">${char === ' ' ? '&nbsp;' : char}</span>`;
    }).join('');

    return `
      <div class="flap-container ${statusClass}">
        <span class="tv-text">${cleanText}</span>
        <span class="flap-letters">${flapSpans}</span>
      </div>
    `;
  }

  function createLogoFlaps(airlineName) {
    const desktopUrls = getAirlineLogo(airlineName).split(',');
    const mobileUrls = getAirlineMobileLogo(airlineName).split(',');

    const mainDesktopLogo = desktopUrls[0];
    const mainMobileLogo = mobileUrls[0];

    const flapBackground = createFlaps("              ", 14);

    return `
    <div style="position: relative; display: inline-flex;">
        ${flapBackground}
        <div class="logo-overlay">
            <img src="${mainDesktopLogo}" class="rotator desktop-logo-img" data-logos="${desktopUrls.join(',')}" data-index="0" />
            <img src="${mainMobileLogo}" class="rotator mobile-logo-img" data-logos="${mobileUrls.join(',')}" data-index="0" />
        </div>
    </div>
    `;
  }

  function render(items, meta) {
    const rows = el("rows");
    if (!items || !items.length) {
      rows.innerHTML = "<tr><td colspan='9' style='text-align:center; color: rgba(143,211,255,0.4); padding: 60px; font-weight: 600; text-transform: uppercase;'>No flights matched the criteria.</td></tr>";
      el("boardMeta").textContent = meta?.message || "No flights matched your search.";
      el("updatedAt").innerHTML = `<div class="live-dot" style="background:#ff7a7a; box-shadow: 0 0 12px #ff7a7a;"></div> Sync Completed`;
      return;
    }

    rows.innerHTML = items.map((item) => {
      const depCity = item.departure?.city || item.departure?.airport || "---";
      const arrCity = item.arrival?.city || item.arrival?.airport || "---";
      
      return `
      <tr>
        <td>${createFlaps(fmtDate(item.departure?.scheduled), 9)}</td>
        <td>${createFlaps(item.flightIata, 8)}</td>
        <td>${createFlaps(fmtTime(item.departure?.estimated || item.departure?.scheduled), 7)}</td>
        <td>
          <div style="display:flex; align-items:center;">
            ${createFlaps(depCity, 10)}
            <span class="route-slash">/</span>
            ${createFlaps(item.departure?.iata, 4)}
          </div>
        </td>
        <td>${createFlaps(fmtTime(item.arrival?.estimated || item.arrival?.scheduled), 7)}</td>
        <td>
          <div style="display:flex; align-items:center;">
            ${createFlaps(arrCity, 10)}
            <span class="route-slash">/</span>
            ${createFlaps(item.arrival?.iata, 4)}
          </div>
        </td>
        <td>
          ${createLogoFlaps(item.airlineName)}
        </td>
        <td>${createFlaps(item.status, 12, statusColorClass(item.status))}</td>
        <td>${createFlaps(item.departure?.gate, 4)}</td>
      </tr>
    `}).join("");

    el("boardMeta").textContent = meta?.message || `Displaying ${items.length} live flights`;
    el("updatedAt").innerHTML = `<div class="live-dot"></div> Live Sync`;
    setNotice(meta?.note || "", false);
  }

  window.addEventListener("message", function(event){
    const data = event.data || {};
    if(data.source !== PARENT_SOURCE) return;

    if(data.type === "FLIGHT_STATUS_RESULTS"){
      const payload = data.payload || {};
      render(payload.items || [], payload.meta || {});
      return;
    }

    if(data.type === "FLIGHT_STATUS_ERROR"){
      const payload = data.payload || {};
      setNotice(payload.message || "ERR: CONNECTION TIMEOUT", true);
      el("rows").innerHTML = "<tr><td colspan='9' style='text-align:center; color: #ff7a7a; padding: 60px; font-weight: 600; text-transform: uppercase;'>Connection Error.</td></tr>";
      el("updatedAt").innerHTML = `<div class="live-dot" style="background:#ff7a7a; box-shadow: 0 0 12px #ff7a7a;"></div> Sync Failed`;
    }
  });

  document.querySelectorAll(".tab").forEach((tab) => tab.addEventListener("click", () => setMode(tab.dataset.mode)));
  el("searchBtn").addEventListener("click", search);
  el("clearBtn").addEventListener("click", function(){
    ["flightNumber","fromAirport","toAirport","airport"].forEach((id) => el(id).value = "");
    el("rows").innerHTML = "<tr><td colspan='9' style='text-align:center; color: #4a5d70; padding: 40px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;'>Awaiting Flight Parameters...</td></tr>";
    setNotice("");
    el("boardMeta").textContent = "Locate specific itinerary via carrier code & flight number.";
  });

  ["flightNumber","fromAirport","toAirport","airport"].forEach((id) => {
    el(id).addEventListener("keydown", (event) => {
      if(event.key === "Enter") search();
    });
  });

  setDateLimits();
  setMode("flight");
  post("FLIGHT_STATUS_READY", {});
})();
</script>
</body>
</html>
