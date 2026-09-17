# Home

STATUS: NEEDS REVIEW
SLUG: /
WIX PAGE: Home.n73w8
AREA: SKANDI
LIVE HTML: YES
ELEMENT: #htmlHome
LAST SYNCED: 2026-09-16

## HOW TO USE
***STATUS (OWNER): "TODO", "IN PROGRESS", "NEEDS REVIEW", "REVISIONS NEEDED", "READY", "LIVE", "ARCHIVED"
STATUS (AGENT): "TODO", "IN PROGRESS", "REVISIONS NEEDED", "READY".***

###  COMMENT SECTION (START ON A NEW ROW, LOG IF A CHANGE IS MADE THAT REQUIRES ATTENTION) 
1. 9/17 12:07PM "Page is ready styled from my end, page not syncing correctly yet /Samuel"
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
<title data-i18n="page.title">Home • SKANDI TRAVELS</title>
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<style>
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
button,input,select{font-family:inherit}
button{cursor:pointer}
.sk-hidden{display:none!important}
/* ==================================================
   LUXURY LOADING SPINNERS & EFFECTS
   ================================================== */
@keyframes skSpin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
/* Sleek Clear Button for Inputs */
.field input[type="text"]::-webkit-search-cancel-button,
.field input[type="text"]::-webkit-clear-button {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  background-image: url("data:image/svg+xml;utf8,<svg viewBox='0 0 24 24' fill='none' stroke='%238c9ba5' stroke-width='2' stroke-linecap='round' xmlns='http://www.w3.org/2000/svg'><path d='M18 6L6 18M6 6l12 12'/></svg>");
  background-size: contain;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.2s ease;
}
.field input[type="text"]::-webkit-search-cancel-button:hover {
  opacity: 1;
}
/* Swap Button CSS */
.field-row { position: relative; }
.swap-btn {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 32px; height: 32px;
  background: #fff;
  border: 1px solid #dbe3ef;
  border-radius: 50%;
  color: var(--sk-blue);
  display: grid;
  place-items: center;
  cursor: pointer;
  z-index: 10;
  box-shadow: 0 4px 12px rgba(2, 46, 100, 0.08);
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.swap-btn svg { width: 16px; height: 16px; transition: transform 0.3s ease; }
.swap-btn:hover { border-color: var(--sk-cyan); color: var(--sk-cyan); }
.swap-btn:hover svg { transform: rotate(180deg); }
.swap-btn:active { transform: translate(-50%, -50%) scale(0.9); }
/* Smooth Fade-out Mask for Horizontal Rails */
.trip-type-grid, .offer-rail, .recently-rail {
  /* Creates a fade effect on the left and right edges */
  -webkit-mask-image: linear-gradient(to right, 
    rgba(0,0,0,0) 0%, 
    rgba(0,0,0,1) 4%, 
    rgba(0,0,0,1) 96%, 
    rgba(0,0,0,0) 100%);
  mask-image: linear-gradient(to right, 
    rgba(0,0,0,0) 0%, 
    rgba(0,0,0,1) 4%, 
    rgba(0,0,0,1) 96%, 
    rgba(0,0,0,0) 100%);
  padding-left: 16px;
  padding-right: 16px;
}
/* Button Loading State */
.search-submit.loading {
  color: transparent !important;
  pointer-events: none;
}
.search-submit.loading::after {
  content: "";
  position: absolute;
  top: 50%; left: 50%;
  width: 20px; height: 20px;
  margin: -10px 0 0 -10px;
  border: 2px solid rgba(255,255,255,0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: skSpin 0.7s linear infinite;
}

/* Full Page / Section Loading Veil */
.sk-page-loader {
  position: fixed;
  inset: 0;
  background: rgba(2, 46, 100, 0.4);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 999999;
  display: none;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.25s ease;
}
.sk-page-loader.active {
  display: flex;
  opacity: 1;
}
.sk-page-loader-box {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(16px);
  padding: 22px 30px;
  border-radius: 20px;
  box-shadow: 0 24px 60px rgba(2, 46, 100, 0.25);
  display: flex;
  align-items: center;
  gap: 16px;
  font-weight: 800;
  color: var(--sk-blue);
  font-size: 13px;
  letter-spacing: 0.02em;
  border: 1px solid rgba(255, 255, 255, 0.8);
}
.sk-page-loader-spinner {
  width: 24px; height: 24px;
  border: 3px solid #dbe3ef;
  border-top-color: var(--sk-cyan);
  border-radius: 50%;
  animation: skSpin 0.7s linear infinite;
}

/* Extra Life & Micro-Interactions on Cards */
.dest-card, .hotel-card, .offer-card, .mixed-card, .inspo-card, .budget-card, .service-push, .season-card, .guide-card {
  position: relative;
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease !important;
}
.dest-card:hover, .hotel-card:hover, .offer-card:hover, .mixed-card:hover, .inspo-card:hover, .budget-card:hover, .service-push:hover, .season-card:hover, .guide-card:hover {
  transform: translateY(-6px) scale(1.01) !important;
  box-shadow: 0 20px 45px rgba(2, 46, 100, 0.15) !important;
}
/* ==================================================
   ENTRANCE ANIMATIONS 
   ================================================== */
@keyframes smoothFadeUp {
  0% { opacity: 0; transform: translateY(20px); }
  100% { opacity: 1; transform: translateY(0); }
}
@keyframes formFadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ==================================================
   FIXED HERO & BACKGROUND SECTION
   ================================================== */
#hero-wrap{
  position: relative;
  width: 100%;
  min-height: 0 !important;
  padding: 50px 24px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  background: transparent !important;
  z-index: 1;
}

/* Locks the background image size completely so it never shifts */
#hero-wrap::before {
  content: "";
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 420px;
  background: url("https://static.wixstatic.com/media/394052_9a01a12b7bbf4524a3b4ae7c2652477e~mv2.png") center/cover;
  z-index: -1;
  border-radius: 0 0 28px 28px;
}

.hero-kicker{
  font-size: 11px;
  font-weight: 900;
  color: var(--sk-cyan);
  text-transform: uppercase;
  letter-spacing: .16em;
  margin-bottom: 6px;
}
#hero-title{
  font-size: clamp(32px, 4.5vw, 52px);
  line-height: 1;
  letter-spacing: -.04em;
  font-weight: 700;
  color: var(--sk-blue);
  margin-bottom: 8px;
  animation: smoothFadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
#hero-sub{
  font-size: 14px;
  color: #475467;
  max-width: 580px;
  margin-bottom: 24px;
  opacity: 0;
  animation: smoothFadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards;
}

/* ==================================================
   COMPACT SEARCH MODULE CONTAINER
   ================================================== */
#search-tabs{
  background: rgba(255, 255, 255, 0.94) !important;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.8) !important;
  border-radius: 20px !important;
  box-shadow: 0 20px 48px rgba(2, 46, 100, 0.14) !important;
  width: 100%;
  max-width: 900px;
  text-align: left;
  padding: 8px;
  margin-bottom: -40px;
  overflow: visible;
  opacity: 0;
  animation: smoothFadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards;
}

#tab-header{
  display: flex;
  flex-wrap: wrap; /* Allows tabs to wrap gracefully on smaller screens */
  gap: 6px;
  background: rgba(2, 46, 100, 0.05);
  border-radius: 12px;
  padding: 4px;
  border: none !important;
  margin-bottom: 6px;
}
.tab-btn{
  flex: 1 1 130px; /* Flexible sizing that adapts to screen width */
  padding: 9px 12px !important;
  text-align: center;
  font-size: 12px !important;
  font-weight: 700 !important;
  cursor: pointer;
  color: #5c6d7d;
  background: transparent !important;
  border: none !important;
  border-radius: 9px !important;
  transition: all 0.2s ease !important;
}
.tab-btn.active {
  background: #fff !important;
  color: var(--sk-blue) !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
.tab-btn::after { display: none !important; }

#tab-content { padding: 10px 14px 14px !important; }
.tab-panel { display: none; }
.tab-panel.active {
  display: block;
  animation: formFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.field-row{
  display: flex;
  gap: 8px !important;
  margin-bottom: 8px !important;
}

/* ==================================================
   INTEGRATED AIRBNB-STYLE FIELDS 
   ================================================== */
.field{
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
  background: #fff;
  border: 1px solid #dbe3ef;
  border-radius: 12px;
  padding: 6px 12px;
  transition: all 0.2s ease;
}
.field label{
  font-size: 9px !important;
  font-weight: 800 !important;
  text-transform: uppercase !important;
  letter-spacing: 0.08em !important;
  color: #8c9ba5 !important;
  margin-bottom: 2px !important;
}

.field input, 
.field select, 
.date-range-button {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  padding: 2px 0 !important;
  min-height: 26px !important;
  font-size: 13px !important;
  font-weight: 700 !important;
  color: var(--sk-blue) !important;
  outline: none !important;
}

.field:focus-within {
  border-color: var(--sk-cyan);
  box-shadow: 0 0 0 3px rgba(95, 199, 207, 0.15);
}
@media (hover: hover) {
  .field:hover { border-color: #aebbd0; }
}

/* PASSENGER ROW: Forces Adults, Children, Infants side-by-side */
.pax-row {
  display: grid !important;
  grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
  gap: 8px !important;
}
.pax-row .field {
  padding: 6px 10px !important;
}

/* Compact Counters */
.counter{
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: transparent !important;
  border: none !important;
  padding: 0 !important;
  min-height: 26px !important;
}
.counter button {
  width: 26px !important;  
  height: 26px !important;
  border-radius: 6px;
  border: 0;
  background: #f0f4f8 !important;
  font-size: 15px;
  font-weight: 800 !important;
  color: var(--sk-blue) !important;
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: all 0.15s ease;
}
.counter button:hover { background: #e2e8f0 !important; }
.counter button:active { transform: scale(0.9); }
.counter span { font-size: 13px !important; font-weight: 800; color: var(--sk-blue); }
.pax-row small { font-size: 9px !important; color: #8c9ba5 !important; margin-top: 1px; }

/* Custom Select Chevron */
.field select {
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml;utf8,<svg fill='%23022e64' height='16' viewBox='0 0 24 24' width='16' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/></svg>");
  background-repeat: no-repeat;
  background-position: right 0 center;
  padding-right: 20px !important;
}

/* Sleek Gradient Search Button */
.search-submit{
  width: 100%;
  margin-top: 6px;
  min-height: 44px !important;
  border-radius: 10px !important;
  background: linear-gradient(135deg, var(--sk-blue), var(--sk-blue-soft)) !important;
  color: #fff;
  border: none;
  font-size: 13px !important;
  font-weight: 800 !important;
  letter-spacing: 0.02em;
  box-shadow: 0 6px 20px rgba(2, 46, 100, 0.2) !important;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.25s ease !important;
}
@media (hover: hover) {
  .search-submit:hover {
    transform: translateY(-1px);
    box-shadow: 0 10px 26px rgba(2, 46, 100, 0.3) !important;
  }
}
.search-submit:active { transform: scale(0.98); }
.search-submit:disabled { opacity: 0.6; cursor: not-allowed; }

.search-submit::after {
  content: "";
  position: absolute;
  top: 0; left: -100%;
  width: 50%; height: 100%;
  background: linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0) 100%);
  transform: skewX(-25deg);
  transition: all 0.6s ease;
}
.search-submit:hover::after { left: 150%; }

/* ==================================================
   SUGGESTIONS & DATE PICKER OVERLAYS
   ================================================== */
.airport-field{position:relative}
.airport-suggestions{
  display:none;
  position:absolute;
  z-index:60;
  top:calc(100% + 4px);
  left:0;
  right:0;
  background:#fff;
  border:1px solid #d1d8e0;
  border-radius:12px;
  box-shadow:0 14px 34px rgba(0,0,0,.12);
  overflow:hidden;
  max-height:250px;
  overflow-y:auto;
}
.airport-suggestions.active{display:block}
.airport-option{
  width:100%;
  border:0;
  background:#fff;
  padding:10px 12px;
  text-align:left;
  cursor:pointer;
  border-bottom:1px solid #eef2f7;
  display:flex;
  align-items:flex-start;
  gap:8px;
}
.airport-option:hover{background:var(--sk-bg)}
.airport-option strong{color:var(--sk-blue); font-size: 12px;}
.airport-option small{display:block;margin-top:2px;color:#666;font-size: 10px;}
.airport-option-copy{min-width:0;flex:1}
.airport-option-type{flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;border-radius:999px;background:#eef6fb;color:#0b5c85;font-size:8px;font-weight:900;letter-spacing:.08em;padding:4px 6px;}
.search-hint{color:#667482;font-size:9px;margin-top:4px;}

.date-range-button{
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  color: var(--sk-blue);
  font-size: 13px !important;
}
.date-line{flex:1;height:1px;background:#cbd7e6}

.helper-row{
  display:flex;
  gap:8px;
  flex-wrap:wrap;
  margin-top:8px;
}
.helper-pill{
  border:1px solid #dbe3ef;
  border-radius:999px;
  background:#fff;
  color:var(--sk-blue);
  padding:6px 10px;
  font-size:10px;
  font-weight:800;
}

#trust-strip {
  max-width: 900px !important;
  margin: 50px auto 0 !important;
  padding: 0 12px !important;
  position: relative;
  z-index: 2;
}

.trust-grid {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(2, 46, 100, 0.06);
  padding: 16px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.trust-box {
  background: #f8fafc;
  border-radius: 12px;
  padding: 12px 14px;
  border: 1px solid #edf2f7;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.trust-box:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(2, 46, 100, 0.06);
  background: #fff;
}

.trust-box strong {
  color: var(--sk-blue);
  display: block;
  margin-bottom: 3px;
  font-size: 12px;
  font-weight: 800;
}

.trust-box span {
  color: #64748b;
  font-size: 11px;
  line-height: 1.4;
}

@media(max-width: 860px) {
  .trust-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media(max-width: 500px) {
  .trust-grid { grid-template-columns: 1fr; }
}

#flight-selector{display:none}
body.search-mode #flight-selector{display:block}
body.search-mode .content-section:not(#flight-selector),
body.search-mode #why,
body.search-mode #hero-wrap{display:none;}
.content-section{padding:48px 24px;max-width:1180px;margin:0 auto;}

/* Compact 2-Month Upgraded Calendar Modal */
.field.date-field{position:relative;overflow:visible}
.date-overlay{
  display:none;
  position:absolute;
  top:calc(100% + 10px);
  left:0;
  z-index:1200;
  width:min(720px, calc(100vw - 28px));
  background:transparent;
  padding:0;
  animation: dateModalIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
.date-overlay.active{display:block}
@keyframes dateModalIn {
  0% { opacity: 0; transform: translateY(8px) scale(0.98); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}
.date-modal{
  width:100%;
  background: rgba(255, 255, 255, 0.97);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(219, 227, 239, 0.9);
  border-radius: 20px;
  box-shadow: 0 20px 50px rgba(2,46,100,0.18);
  padding: 18px 20px;
  max-height: min(75vh, 520px);
  overflow-y: auto;
}
.date-modal-head{
  display:flex;
  justify-content:space-between;
  align-items:center;
  margin-bottom:10px;
}
.date-modal-head .selector-kicker { font-size: 9px; font-weight: 800; color: var(--sk-cyan); text-transform: uppercase; }
.date-modal-head h3{color:var(--sk-blue);font-size:16px;font-weight:800;margin:0;}
#closeDatePicker{
  border:0; background:#f0f4f9; color:var(--sk-blue); width:30px; height:30px; border-radius:50%; font-size:18px; cursor:pointer; display:grid; place-items:center; transition: all 0.2s ease;
}
#closeDatePicker:hover { background: var(--sk-light); transform: rotate(90deg); }
.date-picked-line{
  display:flex; align-items:center; justify-content:space-between; gap:10px; background: #f7faff; border:1px solid #e0e7f1; border-radius:10px; padding:8px 12px; margin-bottom:14px; color:var(--sk-blue); font-size:12px; font-weight:800;
}
.date-picked-line span:nth-child(2){flex:1;height:1px;background:#cbd7e6}
.nights-pill { background: var(--sk-blue); color: #fff; border-radius: 999px; font-size: 9px; font-weight: 800; padding: 2px 6px; }
.calendar-nav{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
.calendar-nav button{width:30px;height:30px;border:0;background:#f1f5f9;color:var(--sk-blue);border-radius:50%;font-size:16px;cursor:pointer;display:grid;place-items:center;transition: all 0.2s ease;}
.calendar-nav button:hover { background: var(--sk-light); transform: scale(1.05); }
#calendarTitle { font-size: 13px; font-weight: 800; color: var(--sk-blue); }
.calendar-grid{display:grid;grid-template-columns:repeat(2, minmax(0,1fr));gap:24px}
.month-box h4{color:var(--sk-blue);font-size:12px;font-weight:800;text-align:center;margin-bottom:8px;text-transform:capitalize}
.month-days,.month-weekdays{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:3px}
.month-weekdays div{font-size:9px;font-weight:800;color:#8c9ba5;text-align:center;padding:3px 0;text-transform:uppercase}
.day-btn{
  border:0; background:transparent; min-height:32px; border-radius:7px; color:#1a202c; cursor:pointer; font-size:11px; font-weight:700; transition: background 0.15s ease, transform 0.15s ease;
}
.day-btn:hover:not(.disabled){background:#eef6ff;color:var(--sk-blue);transform:translateY(-1px);}
.day-btn.disabled{opacity:.25;cursor:not-allowed;}
.day-btn.selected{background:var(--sk-blue)!important;color:#fff!important;box-shadow:0 3px 10px rgba(2,46,100,0.3);z-index:2;}
.day-btn.in-range{background:#e1f1ff!important;color:var(--sk-blue)!important;border-radius:0;}
.date-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:14px;padding-top:10px;border-top:1px solid #edf2f7;}
.date-actions button{padding:8px 14px;border-radius:999px;font-size:11px;font-weight:800;cursor:pointer;transition: all 0.2s ease;}
#clearDates{border:1px solid #d1d8e0;background:#fff;color:var(--sk-blue)}
#clearDates:hover { background: #f7faff; }
#applyDates{border:0;background:var(--sk-blue);color:#fff; box-shadow: 0 4px 12px rgba(2,46,100,0.2);}
#applyDates:hover { background: var(--sk-blue2); transform: translateY(-1px); }

@media(max-width:760px){
  .date-overlay{position:fixed;inset:auto 10px 10px 10px;width:auto;max-width:none;}
  .calendar-grid{grid-template-columns:1fr;gap:12px;}
  .date-modal{max-height:70vh;border-radius:16px;padding:14px;}
  .day-btn{min-height:36px;font-size:12px;}
}

/* ==================================================
   HOMEPAGE CONTENT & CINEMATIC ZOOMS
   ================================================== */
.section-title{font-size:30px;font-weight:700;color:var(--sk-blue);margin-bottom:8px;letter-spacing:-.04em;}
.section-subtitle{color:#555;font-size:14px;line-height:1.6;margin-bottom:24px;max-width:780px;}
.card-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:26px;}
.dest-card,.offer-card,.type-card,.why-card{background:#fff;border:1px solid #edf0f5;border-radius:16px;overflow:hidden;box-shadow:var(--sk-shadow);cursor:pointer;transition:.24s ease;}
.card-img,.offer-img{width:100%;height:190px;background:#dfe7f2 center/cover;position:relative;}
.card-code{position:absolute;left:14px;bottom:14px;background:rgba(255,255,255,.94);color:var(--sk-blue);border-radius:999px;padding:7px 10px;font-size:11px;font-weight:800;}
.card-body,.offer-body,.type-body{padding:18px 20px;}
.card-body h3,.offer-body h4,.type-body h3,.why-card h3{font-size:18px;font-weight:700;color:var(--sk-blue);margin-bottom:6px;}
.card-body p,.offer-body p,.type-body p,.why-card p{font-size:13px;color:#555;line-height:1.55;}
.dest-meta{display:flex;flex-wrap:wrap;gap:7px;margin-top:12px;}
.dest-pill{border-radius:999px;background:#eef4ff;color:var(--sk-blue);border:1px solid #dbe8ff;padding:6px 8px;font-size:10px;font-weight:800;}
.dest-price,.offer-price{color:#0a4b95;font-size:15px;font-weight:800;margin-top:10px;}
#offers-section{background:var(--sk-bg);max-width:none;padding-left:32px;padding-right:32px;}
#offers-section .inner{max-width:1180px;margin:0 auto;}
.trip-type-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;}
.type-card{padding:0;}
.type-icon{height:76px;background:linear-gradient(135deg,var(--sk-light),var(--sk-pale));color:var(--sk-blue);display:flex;align-items:center;justify-content:center;font-size:28px;}
/* Custom SVG Icon Styling & Hover Animation */
.type-icon svg {
  width: 32px;
  height: 32px;
  stroke: var(--sk-blue);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  fill: none;
  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.2s ease;
}
.type-card:hover .type-icon svg {
  transform: scale(1.12) rotate(-12deg);
  stroke: var(--sk-blue-soft);
}
#why{background:var(--sk-bg);padding:60px 32px;border-top:1px solid #e0e6f2;border-bottom:1px solid #e0e6f2;}
#why-title{text-align:center;font-size:30px;font-weight:700;color:var(--sk-blue);margin-bottom:24px;letter-spacing:-.04em;}
#why-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:24px;max-width:1180px;margin:0 auto;}
.why-card{cursor:default;padding:26px 22px;}
.newsletter-cta{max-width:1180px;margin:0 auto;background:linear-gradient(135deg,var(--sk-blue),var(--sk-blue-soft));color:#fff;border-radius:18px;padding:28px;display:grid;grid-template-columns:1fr auto;align-items:center;gap:20px;}
.newsletter-cta strong{display:block;font-size:22px;margin-bottom:6px;}
.newsletter-cta p{color:rgba(255,255,255,.85);font-size:13px;}
.newsletter-cta button{border:0;background:#fff;color:var(--sk-blue);border-radius:999px;padding:12px 18px;font-weight:800;}

/* MIXED DISCOVERY HOMEPAGE */
.mixed-section{padding-top:54px;padding-bottom:26px;}
.mixed-section-head{display:flex;justify-content:space-between;gap:24px;align-items:flex-end;}
.mixed-feed{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));grid-auto-flow:dense;gap:18px;}
.mixed-card{position:relative;border-radius:20px;overflow:hidden;min-height:230px;background:#dce5ef center/cover;box-shadow:0 12px 32px rgba(2,46,100,.12);cursor:pointer;isolation:isolate;transition:transform .22s ease,box-shadow .22s ease;}
.mixed-card:hover{transform:translateY(-4px);box-shadow:0 18px 42px rgba(2,46,100,.18);}
.mixed-card::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(2,32,66,.03) 18%,rgba(2,32,66,.88) 100%);z-index:-1;}
.mixed-card.lead{grid-column:span 7;grid-row:span 2;min-height:478px;}
.mixed-card.side{grid-column:span 5;min-height:230px;}
.mixed-card.third{grid-column:span 4;min-height:290px;}
.mixed-card.wide{grid-column:span 8;min-height:290px;}
.mixed-card.hotel{background-color:#fff;}
.mixed-card-copy{position:absolute;left:0;right:0;bottom:0;padding:24px;color:#fff;}
.mixed-card.lead .mixed-card-copy{padding:30px;}
.mixed-card-kicker{font-size:10px;line-height:1;font-weight:900;text-transform:uppercase;letter-spacing:.14em;color:#8fe7e8;margin-bottom:9px;}
.mixed-card h3{font-size:clamp(22px,2.5vw,34px);line-height:1.05;letter-spacing:-.035em;margin:0 0 8px;color:#fff;max-width:700px;}
.mixed-card.side h3,.mixed-card.third h3{font-size:22px;}
.mixed-card p{font-size:12px;line-height:1.55;color:rgba(255,255,255,.9);max-width:650px;margin:0;}
.mixed-card-meta{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:13px;}
.mixed-card-price{background:#fff;color:var(--sk-blue);font-size:13px;font-weight:900;border-radius:999px;padding:8px 11px;}
.mixed-card-cta{font-size:11px;font-weight:900;border-bottom:1px solid rgba(255,255,255,.75);padding-bottom:2px;}
.mixed-card.club{background:linear-gradient(135deg,#022e64,#0b5c85);}
.mixed-card.club::after{background:radial-gradient(circle at 80% 20%,rgba(95,199,207,.32),transparent 38%),linear-gradient(135deg,rgba(2,46,100,.2),rgba(2,46,100,.82));}

.offer-rail{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(260px,330px);gap:18px;overflow-x:auto;overscroll-behavior-inline:contain;scroll-snap-type:inline mandatory;padding:4px 2px 16px;}
.offer-rail .offer-card{scroll-snap-align:start;}
#offers-section{background:#f6f8fb;}

.destination-editorial-grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:18px;}
.destination-editorial-grid .dest-card{grid-column:span 4;border-radius:20px;}
.destination-editorial-grid .dest-card:first-child{grid-column:span 8;}
.destination-editorial-grid .dest-card:first-child .card-img{height:300px;}
.destination-editorial-grid .dest-card:nth-child(n+2) .card-img{height:205px;}

/* ==================================================
   RESPONSIVE WRAPPING GRID FOR TRIP CARDS
   ================================================== */
#trip-types-section {
  padding: 60px 24px;
  max-width: 1180px;
  margin: 0 auto;
}

.trip-type-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 16px;
  margin-top: 18px;
}

.type-card {
  background: #ffffff !important;
  border: 1px solid #e2e8f0 !important;
  border-radius: 20px !important;
  overflow: hidden;
  cursor: pointer;
  box-shadow: 0 6px 20px rgba(2, 46, 100, 0.04) !important;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
  display: flex;
  flex-direction: column;
}

@media (hover: hover) {
  .type-card:hover {
    transform: translateY(-6px) !important;
    border-color: var(--sk-cyan) !important;
    box-shadow: 0 18px 40px rgba(2, 46, 100, 0.12) !important;
  }
}

.type-card .type-icon {
  height: 90px; 
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #f1f5f9;
  transition: background 0.3s ease;
}

.type-card:hover .type-icon {
  background: #eef6fb;
}

/* 36px Crisp Icons */
.type-card .type-icon svg {
  width: 36px;
  height: 36px;
  stroke: var(--sk-blue);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  fill: none;
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.type-card:hover .type-icon svg {
  transform: scale(1.15) translateY(-2px);
  stroke: var(--sk-cyan);
}

.type-card .type-body {
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.type-card .type-body h3 {
  font-size: 13px !important;
  font-weight: 800 !important;
  color: var(--sk-blue) !important;
  margin-bottom: 4px !important;
  letter-spacing: -0.01em;
}

.type-card .type-body p {
  font-size: 11px !important;
  color: #64748b !important;
  line-height: 1.45 !important;
  margin: 0 !important;
}

/* Responsive breakpoints for rotation / tablets / phones */
@media(max-width: 980px) {
  .trip-type-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
@media(max-width: 600px) {
  .trip-type-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}



.club-story-section{padding-top:20px;padding-bottom:26px;}
.club-story{min-height:180px;padding:34px 38px;background:radial-gradient(circle at 82% 25%,rgba(95,199,207,.38),transparent 26%),linear-gradient(135deg,#01284f,#064c76);}
.club-story-kicker{display:block;font-size:10px;letter-spacing:.18em;font-weight:900;color:#8ee4e8;margin-bottom:10px;}

.hotel-grid{grid-template-columns:repeat(12,minmax(0,1fr));gap:18px;}
.hotel-grid .hotel-card{grid-column:span 4;}
.hotel-grid .hotel-card:first-child{grid-column:span 6;}
.hotel-grid .hotel-card:nth-child(2){grid-column:span 6;}
.hotel-grid .hotel-card:first-child .hotel-img,.hotel-grid .hotel-card:nth-child(2) .hotel-img{height:260px;}

@media(max-width:980px){
  .trip-type-grid{grid-template-columns:repeat(3,minmax(0,1fr));}
  .mixed-card.lead{grid-column:span 12;min-height:420px;}
  .mixed-card.side,.mixed-card.third,.mixed-card.wide{grid-column:span 6;}
  .destination-editorial-grid .dest-card,.destination-editorial-grid .dest-card:first-child{grid-column:span 6;}
  .hotel-grid .hotel-card,.hotel-grid .hotel-card:first-child,.hotel-grid .hotel-card:nth-child(2){grid-column:span 6;}
}
@media(max-width:620px){
  .mixed-feed,.destination-editorial-grid,.hotel-grid{grid-template-columns:1fr;}
  .mixed-card.lead,.mixed-card.side,.mixed-card.third,.mixed-card.wide,.destination-editorial-grid .dest-card,.destination-editorial-grid .dest-card:first-child,.hotel-grid .hotel-card,.hotel-grid .hotel-card:first-child,.hotel-grid .hotel-card:nth-child(2){grid-column:auto;min-height:300px;}
  .mixed-card.lead{min-height:360px;}
  .trip-type-grid{grid-template-columns:repeat(2,minmax(0,1fr));}
  .offer-rail{grid-auto-columns:minmax(245px,82vw);}
  .club-story{padding:28px 22px;}
}

/* LIVE HOME HOTELS */
#hotels-section{background:#fff;}
.hotel-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:26px;}
.hotel-card{background:#fff;border:1px solid #edf0f5;border-radius:18px;overflow:hidden;box-shadow:var(--sk-shadow);cursor:pointer;transition:.24s ease;}
.hotel-card:hover{transform:translateY(-5px);box-shadow:var(--sk-shadow-strong);}
.hotel-img{height:210px;background:#dfe7f2 center/cover;position:relative;}
.hotel-badge{position:absolute;left:14px;bottom:14px;background:rgba(255,255,255,.95);color:var(--sk-blue);border-radius:999px;padding:7px 10px;font-size:10px;font-weight:800;}
.hotel-body{padding:18px 20px;}
.hotel-location{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.09em;color:var(--sk-cyan);margin-bottom:7px;}
.hotel-body h3{font-size:19px;color:var(--sk-blue);margin-bottom:7px;}
.hotel-body p{font-size:13px;color:#555;line-height:1.55;}
.live-price-row{margin-top:14px;padding-top:13px;border-top:1px solid #edf0f5;display:flex;justify-content:space-between;gap:12px;align-items:flex-end;}
.live-price-row small{display:block;color:#667085;font-size:10px;line-height:1.4;}
.live-price-row strong{display:block;color:#0a4b95;font-size:18px;margin-top:3px;}
.duffel-chip{display:inline-flex;align-items:center;border-radius:999px;background:#eef7fb;color:#235679;padding:6px 9px;font-size:9px;font-weight:800;white-space:nowrap;}

#inspiration-section{max-width:none;background:#f2f7fb;padding-left:32px;padding-right:32px;}
#inspiration-section .inner{max-width:1180px;margin:0 auto;}
.inspiration-grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:20px;}
.inspo-card{grid-column:span 4;min-height:330px;border-radius:20px;overflow:hidden;position:relative;background:#163a66 center/cover;box-shadow:0 14px 34px rgba(2,46,100,.14);cursor:pointer;}
.inspo-card:first-child{grid-column:span 8;min-height:390px;}
.inspo-card::before{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(2,46,100,.05) 22%,rgba(2,46,100,.88) 100%);}
.inspo-copy{position:absolute;left:0;right:0;bottom:0;z-index:1;padding:24px;color:#fff;}
.inspo-kicker{font-size:10px;font-weight:900;letter-spacing:.13em;text-transform:uppercase;color:#8be1e6;margin-bottom:8px;}
.inspo-copy h3{font-size:clamp(20px,2.2vw,30px);line-height:1.05;margin-bottom:9px;max-width:620px;}
.inspo-copy p{font-size:12px;line-height:1.6;color:rgba(255,255,255,.9);max-width:620px;}
.inspo-read{display:inline-flex;margin-top:13px;font-size:11px;font-weight:900;border-bottom:1px solid rgba(255,255,255,.72);padding-bottom:2px;}

@media(max-width:860px){
  .inspiration-grid{grid-template-columns:1fr 1fr;}
  .inspo-card,.inspo-card:first-child{grid-column:auto;min-height:320px;}
  #inspiration-section{padding:42px 14px;}
}
@media(max-width:560px){
  .inspiration-grid{grid-template-columns:1fr;}
  .inspo-card,.inspo-card:first-child{min-height:300px;}
}

/* Shared notification used by footer/actions */
.skandi-toast{
  position:fixed;right:20px;bottom:20px;z-index:100000;max-width:min(380px,calc(100vw - 40px));
  display:none;padding:14px 18px;border-radius:14px;background:#022e64;color:#fff;
  box-shadow:0 18px 42px rgba(2,46,100,.25);font-size:13px;font-weight:700;line-height:1.5;
}
.skandi-toast.show{display:block;}
.skandi-toast.error{background:#8a1f1f;}

/* LONG-FORM DISCOVERY HOME */
.long-band{padding:72px 0;}
.long-band .section-title{max-width:780px;}
.long-band .section-subtitle{max-width:760px;}
.budget-strip{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-top:22px;}
.budget-card{border:1px solid #dbe3ea;border-radius:18px;background:#fff;min-height:164px;padding:22px;display:flex;flex-direction:column;justify-content:space-between;cursor:pointer;transition:.2s ease;box-shadow:0 8px 24px rgba(2,46,100,.05);}
.budget-card:hover{transform:translateY(-3px);box-shadow:0 15px 32px rgba(2,46,100,.11);border-color:#a9c2d8;}
.budget-eyebrow{font-size:10px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:#607387;}
.budget-card strong{display:block;font-size:29px;line-height:1.02;color:#022e64;letter-spacing:-.04em;margin-top:10px;}
.budget-card p{font-size:12px;color:#5c6d7d;line-height:1.5;margin:8px 0 0;}
.budget-card span:last-child{font-size:11px;font-weight:900;color:#022e64;margin-top:18px;}

.signature-push{padding:64px 0;}
.signature-panel{display:grid;grid-template-columns:1.12fr .88fr;min-height:500px;border-radius:26px;overflow:hidden;background:#022e64;box-shadow:0 20px 55px rgba(2,46,100,.18);}
.signature-visual{min-height:500px;background:#173b62 center/cover;position:relative;}
.signature-visual:after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(2,46,100,.06),rgba(2,46,100,.22));}
.signature-copy{padding:50px;color:#fff;display:flex;flex-direction:column;justify-content:center;background:radial-gradient(circle at 100% 0,rgba(95,199,207,.24),transparent 35%),#022e64;}
.signature-kicker{font-size:11px;letter-spacing:.16em;font-weight:900;color:#7be0e3;text-transform:uppercase;margin-bottom:14px;}
.signature-copy h2{font-size:clamp(34px,4vw,54px);line-height:.98;letter-spacing:-.045em;margin:0 0 18px;color:#fff;}
.signature-copy p{font-size:15px;line-height:1.7;color:rgba(255,255,255,.82);margin:0 0 26px;}
.signature-points{display:grid;gap:10px;margin-bottom:28px;}
.signature-points span{display:flex;gap:10px;align-items:center;font-size:12px;font-weight:800;}
.signature-points span:before{content:"◆";color:#7be0e3;font-size:8px;}
.signature-btn{align-self:flex-start;border:0;border-radius:999px;background:#fff;color:#022e64;font-weight:900;padding:13px 18px;cursor:pointer;}

.route-ideas{padding:60px 0 18px;}
.route-grid{display:grid;grid-template-columns:1.15fr .85fr;gap:18px;margin-top:22px;}
.route-feature,.route-stack-card{border-radius:22px;overflow:hidden;position:relative;background:#dae4ec center/cover;cursor:pointer;isolation:isolate;box-shadow:0 12px 34px rgba(2,46,100,.1);}
.route-feature{min-height:470px;}
.route-side{display:grid;grid-template-rows:1fr 1fr;gap:18px;}
.route-stack-card{min-height:226px;}
.route-feature:after,.route-stack-card:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(2,35,68,.02),rgba(2,35,68,.88));z-index:-1;}
.route-copy{position:absolute;left:0;right:0;bottom:0;padding:26px;color:#fff;}
.route-feature .route-copy{padding:34px;}
.route-copy small{font-size:10px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:#83e5e6;}
.route-copy h3{font-size:clamp(24px,3vw,38px);line-height:1.02;margin:8px 0;color:#fff;letter-spacing:-.035em;}
.route-stack-card .route-copy h3{font-size:24px;}
.route-copy p{font-size:12px;line-height:1.5;color:rgba(255,255,255,.88);margin:0 0 12px;}
.route-price{display:inline-flex;background:#fff;color:#022e64;border-radius:999px;padding:8px 11px;font-size:12px;font-weight:900;}

.service-shop{padding:72px 0;background:#f3f6f8;}
.service-shop-grid{display:grid;grid-template-columns:1.25fr .75fr .75fr;grid-auto-rows:210px;gap:16px;margin-top:24px;}
.service-push{border-radius:22px;padding:26px;position:relative;overflow:hidden;cursor:pointer;display:flex;flex-direction:column;justify-content:flex-end;isolation:isolate;box-shadow:0 10px 28px rgba(2,46,100,.08);}
.service-push:first-child{grid-row:span 2;background:linear-gradient(135deg,#022e64,#0b5c85);color:#fff;}
.service-push:nth-child(2){background:#fff;color:#022e64;border:1px solid #dce4eb;}
.service-push:nth-child(3){background:#d9f1f1;color:#022e64;}
.service-push:nth-child(4){background:#f2e9dc;color:#3c2f20;}
.service-push:nth-child(5){background:#e9eef8;color:#022e64;}
.service-icon{font-size:30px;margin-bottom:auto;}
/* Service Icon Sizing & Hover Effects */
.service-icon svg {
  width: 1em;
  height: 1em;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.service-push:hover .service-icon svg {
  transform: scale(1.15) translateY(-2px);
  stroke: var(--sk-cyan) !important;
}

.service-push:first-child:hover .service-icon svg {
  stroke: #fff !important; 
}
.service-push:first-child .service-icon{font-size:48px;}
.service-push small{font-size:10px;font-weight:900;letter-spacing:.13em;text-transform:uppercase;opacity:.72;}
.service-push h3{font-size:24px;line-height:1.05;margin:8px 0 6px;letter-spacing:-.03em;color:inherit;}
.service-push:first-child h3{font-size:38px;color:#fff;}
.service-push p{font-size:12px;line-height:1.5;margin:0;opacity:.78;}
.service-link{font-size:11px;font-weight:900;margin-top:15px;}

.seasonal-band{padding:70px 0;}
.seasonal-rail{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px;margin-top:24px;}
.season-card{min-height:330px;border-radius:22px;position:relative;overflow:hidden;background:#dce4e8 center/cover;cursor:pointer;isolation:isolate;}
.season-card:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,25,50,.04),rgba(0,25,50,.84));z-index:-1;}
.season-card:nth-child(even){min-height:390px;margin-top:28px;}
.season-copy{position:absolute;left:0;right:0;bottom:0;padding:24px;color:#fff;}
.season-copy small{font-size:10px;font-weight:900;letter-spacing:.13em;text-transform:uppercase;color:#87e6e6;}
.season-copy h3{font-size:25px;line-height:1.03;margin:8px 0;color:#fff;}
.season-copy p{font-size:12px;line-height:1.5;color:rgba(255,255,255,.88);margin:0;}

.recently-section{padding:32px 0 64px;}
.recently-rail{display:flex;gap:16px;overflow-x:auto;padding:4px 2px 14px;scroll-snap-type:x mandatory;}
.recent-card{flex:0 0 min(340px,82vw);scroll-snap-align:start;border-radius:18px;overflow:hidden;border:1px solid #dfe6ec;background:#fff;cursor:pointer;box-shadow:0 8px 22px rgba(2,46,100,.06);}
.recent-img{height:180px;background:#dce4e8 center/cover;}
.recent-body{padding:18px;}
.recent-body small{font-size:10px;font-weight:900;color:#6a7a88;letter-spacing:.12em;text-transform:uppercase;}
.recent-body h3{font-size:20px;color:#022e64;margin:7px 0 8px;}
.recent-body p{font-size:12px;color:#647481;line-height:1.5;margin:0;}

.guide-push{padding:72px 0;background:#022e64;color:#fff;}
.guide-push .section-title,.guide-push .section-subtitle{color:#fff;}
.guide-push .section-subtitle{opacity:.78;}
.guide-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-top:26px;}
.guide-card{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);border-radius:20px;padding:26px;min-height:230px;display:flex;flex-direction:column;cursor:pointer;transition:.2s ease;}
.guide-card:hover{background:rgba(255,255,255,.13);transform:translateY(-3px);}
.guide-card .guide-num{font-size:11px;letter-spacing:.14em;color:#7be0e3;font-weight:900;}
.guide-card h3{font-size:26px;line-height:1.05;color:#fff;margin:18px 0 10px;}
.guide-card p{font-size:12px;line-height:1.6;color:rgba(255,255,255,.75);margin:0;}
.guide-card span:last-child{margin-top:auto;padding-top:22px;font-size:11px;font-weight:900;}

.brand-story{padding:74px 0;}
.brand-story-panel{display:grid;grid-template-columns:.82fr 1.18fr;border-radius:26px;overflow:hidden;background:#f0f4f6;min-height:440px;}
.brand-story-copy{padding:46px;display:flex;flex-direction:column;justify-content:center;}
.brand-story-copy small{font-size:10px;font-weight:900;letter-spacing:.15em;text-transform:uppercase;color:#5c7185;}
.brand-story-copy h2{font-size:42px;line-height:1;letter-spacing:-.045em;color:#022e64;margin:12px 0 16px;}
.brand-story-copy p{font-size:14px;line-height:1.7;color:#5d6f7e;margin:0 0 24px;}
.brand-story-copy button{align-self:flex-start;border:0;border-radius:999px;background:#022e64;color:#fff;padding:13px 18px;font-weight:900;cursor:pointer;}
.brand-story-visual{background:linear-gradient(135deg,#5fc7cf,#0b5c85);position:relative;overflow:hidden;}
.brand-story-visual:before{content:"VOY";position:absolute;right:-18px;bottom:-44px;font-size:190px;font-weight:900;letter-spacing:-.08em;color:rgba(255,255,255,.14);}
.brand-story-visual:after{content:"SIGNATURE TRAVELS / UNFORGETTABLE MOMENTS";position:absolute;left:32px;top:34px;color:#fff;font-size:11px;letter-spacing:.16em;font-weight:900;max-width:280px;line-height:1.6;}

@media(max-width:980px){
  .budget-strip,.seasonal-rail{grid-template-columns:repeat(2,minmax(0,1fr));}
  .signature-panel,.route-grid,.brand-story-panel{grid-template-columns:1fr;}
  .signature-visual{min-height:360px;}
  .service-shop-grid{grid-template-columns:1fr 1fr;grid-auto-rows:210px;}
  .service-push:first-child{grid-row:span 1;grid-column:span 2;}
  .guide-grid{grid-template-columns:1fr 1fr;}
}
@media(max-width:650px){
  .long-band,.signature-push,.route-ideas,.seasonal-band,.guide-push,.brand-story{padding:48px 0;}
  .budget-strip,.seasonal-rail,.guide-grid{grid-template-columns:1fr;}
  .season-card,.season-card:nth-child(even){min-height:310px;margin-top:0;}
  .route-grid{grid-template-columns:1fr;}
  .route-feature{min-height:360px;}
  .service-shop-grid{grid-template-columns:1fr;grid-auto-rows:auto;}
  .service-push,.service-push:first-child{grid-column:auto;grid-row:auto;min-height:230px;}
  .signature-copy,.brand-story-copy{padding:32px 24px;}
  .signature-copy h2,.brand-story-copy h2{font-size:36px;}
  .brand-story-visual{min-height:300px;}
}

/* V4 MOBILE HARDENING */
html,body{max-width:100%;overflow-x:hidden}
img,video,svg{max-width:100%}
#hero-wrap,#search-tabs,#tab-content,.content-section,.inner{min-width:0}
@media(max-width:760px){
  #hero-wrap{padding:34px 12px 26px}
  #hero-title{font-size:clamp(32px,10vw,42px);line-height:1}
  #hero-sub{font-size:14px;margin-bottom:22px}
  #search-tabs{border-radius:14px}
  #tab-header{scroll-snap-type:x proximity;scrollbar-width:none}
  #tab-header::-webkit-scrollbar{display:none}
  .tab-btn{flex:0 0 auto;min-width:44%;scroll-snap-align:start;padding:13px 10px;font-size:11px}
  #tab-content{padding:16px 12px 18px}
  .field-row{display:grid;grid-template-columns:1fr;gap:10px;margin-bottom:10px}
  .field input,.field select,.date-range-button{min-height:48px;font-size:14px}
  .airport-suggestions{position:absolute;max-height:250px}
  .pax-row{grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}
  .pax-row .field{gap:4px}
  .counter button{width:38px;height:44px}
  .search-submit{min-height:50px;font-size:15px}
  .helper-row{gap:6px;flex-wrap:wrap}
  .section-title{font-size:26px}
  .section-subtitle{font-size:13px}
  .mixed-feed,.destination-editorial-grid,.hotel-grid,.inspiration-grid,.budget-strip,.seasonal-rail,.guide-grid,.service-shop-grid{width:100%}
  .offer-rail,.recently-rail{margin-left:-2px;padding-right:12px}
  .mixed-card,.dest-card,.hotel-card,.inspo-card,.season-card,.service-push,.guide-card,.budget-card{max-width:100%}
  .signature-panel,.route-grid,.brand-story-panel{width:100%}
  .signature-visual{min-height:280px}
  .signature-copy,.brand-story-copy{padding:28px 20px}
  .route-side{grid-template-rows:auto}
  .route-stack-card{min-height:240px}
  .newsletter-cta{padding:28px 18px}
}
@media(max-width:430px){
  .tab-btn{min-width:58%}
  .pax-row{grid-template-columns:1fr}
  .counter{max-width:100%}
  .airport-option{padding:11px 10px}
  .airport-option-type{min-width:54px;font-size:8px}
  .offer-rail{grid-auto-columns:minmax(230px,88vw)}
  .recent-card{flex-basis:88vw}
}
</style>
</head>
<body>
<!-- Global Loading Veil -->
<div id="pageLoader" class="sk-page-loader">
  <div class="sk-page-loader-box">
    <div class="sk-page-loader-spinner"></div>
    <span data-i18n="home.loader.message">Loading your journey...</span>
  </div>
</div>
<section id="hero-wrap">
  <div class="hero-kicker" data-i18n="home.hero.kicker">SKANDI TRAVELS</div>
  <div id="hero-title" data-i18n="home.hero.title">Discover Your Next Journey</div>
  <div id="hero-sub" data-i18n="home.hero.copy">Find Flight + Hotel packages, flights, hotels and SKANDI Collection packages</div>

  <div id="search-tabs">
    <div id="tab-header" role="tablist">
      <button class="tab-btn active" data-tab="holidays" data-i18n="home.tabs.holidays">Flight + Hotel</button>
      <button class="tab-btn" data-tab="flights" data-i18n="home.tabs.flights">Flights</button>
      <button class="tab-btn" data-tab="hotels" data-i18n="home.tabs.hotels">Hotels</button>
      <button class="tab-btn" data-tab="signature" data-i18n="home.tabs.signature">SKANDI Collection</button>
    </div>

    <div id="tab-content">
      <!-- FLIGHTS PANEL -->
      <div class="tab-panel" id="panel-flights">
        <div class="field-row">
          <div class="field airport-field">
            <label data-i18n="home.fields.from">From</label>
            <input type="text" id="from" data-i18n-placeholder="home.placeholders.airport" autocomplete="off" placeholder="City, airport, IATA or ICAO">
            <input type="hidden" id="fromIata">
            <div class="airport-suggestions" id="fromSuggestions"></div>
          </div>

          <div class="field airport-field">
            <label data-i18n="home.fields.to">To</label>
            <input type="text" id="to" data-i18n-placeholder="home.placeholders.airport" autocomplete="off" placeholder="City, airport, IATA or ICAO">
            <input type="hidden" id="toIata">
            <div class="airport-suggestions" id="toSuggestions"></div>
          </div>
        </div>

        <div class="field-row">
          <div class="field date-field">
            <label data-i18n="home.fields.travelDates">Travel Dates</label>
            <button type="button" id="dateRangeButton" class="date-range-button" data-date-range="flights" aria-expanded="false">
              <span id="dateFromLabel" data-i18n="home.fields.from">From</span>
              <span class="date-line"></span>
              <span id="dateToLabel" data-i18n="home.fields.to">To</span>
            </button>
            <input type="hidden" id="depart">
            <input type="hidden" id="return">
          </div>
        </div>

        <div class="field-row pax-row">
          <div class="field">
            <label data-i18n="home.fields.adults">Adults</label>
            <div class="counter"><button type="button" data-counter="adults" data-step="-1">−</button><span id="adultsCount">2</span><button type="button" data-counter="adults" data-step="1">+</button></div>
            <small data-i18n="home.age.adults">12+ years</small>
          </div>
          <div class="field">
            <label data-i18n="home.fields.children">Children</label>
            <div class="counter"><button type="button" data-counter="children" data-step="-1">−</button><span id="childrenCount">0</span><button type="button" data-counter="children" data-step="1">+</button></div>
            <small data-i18n="home.age.children">2–11 years</small>
          </div>
          <div class="field">
            <label data-i18n="home.fields.infants">Infants</label>
            <div class="counter"><button type="button" data-counter="infants" data-step="-1">−</button><span id="infantsCount">0</span><button type="button" data-counter="infants" data-step="1">+</button></div>
            <small data-i18n="home.age.infants">Under 2 years</small>
          </div>
        </div>

        <div id="ageFields"></div>

        <div class="field-row">
          <div class="field">
            <label data-i18n="home.fields.class">Class</label>
            <select id="travelClass">
              <option value="ECONOMY">Economy</option>
              <option value="PREMIUM_ECONOMY">Premium Economy</option>
              <option value="BUSINESS">Business</option>
              <option value="FIRST">First</option>
            </select>
          </div>
        </div>

        <button class="search-submit" data-search="flights" data-i18n="home.search.flights">Search Flights</button>
      </div>

      <!-- FLIGHT + HOTEL PANEL -->
      <div class="tab-panel active" id="panel-holidays">
        <div class="field-row">
          <div class="field airport-field">
            <label data-i18n="home.fields.departureAirport">Departure Airport</label>
            <input type="text" id="hol-from-search" autocomplete="off" placeholder="City, airport, IATA or ICAO" aria-autocomplete="list" aria-expanded="false">
            <input type="hidden" id="hol-from-iata">
            <div class="airport-suggestions" id="hol-from-suggestions" role="listbox"></div>
          </div>
          <button type="button" class="swap-btn" id="swapAirports" aria-label="Swap origin and destination">
  <svg viewBox="0 0 24 24"><path d="M7 10l5-5 5 5M7 14l5 5 5-5" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>
</button>
          <div class="field airport-field">
            <label data-i18n="home.fields.destination">Destination</label>
            <input type="text" id="hol-destination-search" autocomplete="off" placeholder="City, destination, airport, IATA or ICAO" aria-autocomplete="list" aria-expanded="false">
            <input type="hidden" id="hol-destination">
            <input type="hidden" id="hol-destination-iata">
            <input type="hidden" id="hol-destination-type">
            <div class="airport-suggestions" id="hol-destination-suggestions" role="listbox"></div>
          </div>
        </div>
        <div class="field-row">
          <div class="field date-field">
            <label data-i18n="home.fields.travelDates">Travel Dates</label>
            <button type="button" id="holDateRangeButton" class="date-range-button" data-date-range="holidays" aria-expanded="false">
              <span id="holDateFromLabel" data-i18n="home.fields.from">From</span><span class="date-line"></span><span id="holDateToLabel" data-i18n="home.fields.to">To</span>
            </button>
            <input type="hidden" id="hol-departure-date"><input type="hidden" id="hol-return-date">
          </div>
        </div>
        <div class="field-row pax-row">
          <div class="field"><label data-i18n="home.fields.adults">Adults</label><div class="counter"><button type="button" data-counter="adults" data-step="-1">−</button><span id="holAdultsCount">2</span><button type="button" data-counter="adults" data-step="1">+</button></div><small data-i18n="home.age.adults">12+ years</small></div>
          <div class="field"><label data-i18n="home.fields.children">Children</label><div class="counter"><button type="button" data-counter="children" data-step="-1">−</button><span id="holChildrenCount">0</span><button type="button" data-counter="children" data-step="1">+</button></div><small data-i18n="home.age.children">2–11 years</small></div>
          <div class="field"><label data-i18n="home.fields.infants">Infants</label><div class="counter"><button type="button" data-counter="infants" data-step="-1">−</button><span id="holInfantsCount">0</span><button type="button" data-counter="infants" data-step="1">+</button></div><small data-i18n="home.age.infants">Under 2 years</small></div>
        </div>
        <div id="holAgeFields"></div>
        <button class="search-submit" data-search="holidays" data-i18n="home.search.holidays">Search Flight + Hotel</button>
      </div>

      <!-- HOTELS PANEL -->
      <div class="tab-panel" id="panel-hotels">
        <div class="field-row">
          <div class="field airport-field">
            <label data-i18n="home.fields.destination">Destination</label>
            <input type="text" id="hotel-destination-search" autocomplete="off" placeholder="City, destination, airport, IATA or ICAO" aria-autocomplete="list" aria-expanded="false">
            <input type="hidden" id="hotel-destination">
            <input type="hidden" id="hotel-destination-iata">
            <input type="hidden" id="hotel-destination-type">
            <div class="airport-suggestions" id="hotel-destination-suggestions" role="listbox"></div>
          </div>
          <div class="field"><label data-i18n="home.fields.rooms">Rooms</label><select id="hotel-rooms"><option>1</option><option>2</option><option>3</option><option>4</option></select></div>
        </div>
        <div class="field-row">
          <div class="field date-field">
            <label data-i18n="home.fields.travelDates">Travel Dates</label>
            <button type="button" id="hotelDateRangeButton" class="date-range-button" data-date-range="hotels" aria-expanded="false">
              <span id="hotelDateFromLabel" data-i18n="home.fields.from">From</span><span class="date-line"></span><span id="hotelDateToLabel" data-i18n="home.fields.to">To</span>
            </button>
            <input type="hidden" id="hotel-in"><input type="hidden" id="hotel-out">
          </div>
        </div>
        <button class="search-submit" data-search="hotels" data-i18n="home.search.hotels">Search Hotels</button>
      </div>

      <!-- SIGNATURE COLLECTION PANEL -->
      <div class="tab-panel" id="panel-signature">
        <div class="field-row">
          <div class="field airport-field">
            <label data-i18n="home.fields.signatureDestination">Signature Destination</label>
            <input type="text" id="sig-destination-search" autocomplete="off" placeholder="City, destination, airport, IATA or ICAO" aria-autocomplete="list" aria-expanded="false">
            <input type="hidden" id="sig-destination">
            <input type="hidden" id="sig-destination-iata">
            <input type="hidden" id="sig-destination-type">
            <div class="airport-suggestions" id="sig-destination-suggestions" role="listbox"></div>
          </div>
          <div class="field airport-field">
            <label data-i18n="home.fields.departureAirport">Departure Airport</label>
            <input type="text" id="sig-from-search" autocomplete="off" placeholder="City, airport, IATA or ICAO" aria-autocomplete="list" aria-expanded="false">
            <input type="hidden" id="sig-from-iata">
            <div class="airport-suggestions" id="sig-from-suggestions" role="listbox"></div>
          </div>
        </div>
        <div class="field-row">
          <div class="field date-field">
            <label data-i18n="home.fields.travelDates">Travel Dates</label>
            <button type="button" id="sigDateRangeButton" class="date-range-button" data-date-range="signature" aria-expanded="false">
              <span id="sigDateFromLabel" data-i18n="home.fields.from">From</span><span class="date-line"></span><span id="sigDateToLabel" data-i18n="home.fields.to">To</span>
            </button>
            <input type="hidden" id="sig-departure-date"><input type="hidden" id="sig-return-date">
          </div>
        </div>
        <button class="search-submit" data-search="signature" data-i18n="home.search.signature">Search Signature Collection</button>
      </div>
    </div>
  </div>
</section>

<section id="trust-strip">
  <div class="trust-grid" id="trustGrid"></div>
</section>

<div id="datePickerOverlay" class="date-overlay">
  <div class="date-modal">
    <div class="date-modal-head">
      <div>
        <div class="selector-kicker" data-i18n="home.date.kicker">Select Travel Dates</div>
        <h3 id="dateRangeHeading">From <span></span> To</h3>
      </div>
      <button type="button" id="closeDatePicker">×</button>
    </div>

    <div class="date-picked-line">
      <span id="pickedFrom" data-i18n="home.fields.from">From</span>
      <span></span>
      <span id="pickedTo" data-i18n="home.fields.to">To</span>
    </div>

    <div class="calendar-nav">
      <button type="button" id="prevMonth">‹</button>
      <strong id="calendarTitle"></strong>
      <button type="button" id="nextMonth">›</button>
    </div>

    <div id="calendarGrid" class="calendar-grid"></div>

    <div class="date-actions">
      <button type="button" id="clearDates" data-i18n="home.date.clear">Clear</button>
      <button type="button" id="applyDates" data-i18n="home.date.apply">Apply Dates</button>
    </div>
  </div>
</div>

<section class="content-section mixed-section" id="mixed-section" hidden>
  <div class="mixed-section-head">
    <div>
      <div class="section-title" data-i18n="home.sections.discovery.title">Explore SKANDI</div>
      <div class="section-subtitle" data-i18n="home.sections.discovery.copy">A changing mix of destinations, hotels, current offers and travel stories selected for the homepage.</div>
    </div>
  </div>
  <div id="mixed-feed" class="mixed-feed"></div>
</section>

<section class="content-section" id="offers-section" hidden>
  <div class="inner">
    <div class="section-title" data-i18n="home.sections.offers.title">Top Offers</div>
    <div class="section-subtitle" data-i18n="home.sections.offers.copy">Only public offer cards marked PUBLISHED are shown here.</div>
    <div id="offer-grid" class="offer-rail"></div>
  </div>
</section>

<section class="content-section trip-types-section" id="trip-types-section">
  <div class="section-title" data-i18n="home.sections.tripTypes.title">What kind of trip are you looking for?</div>
  <div class="section-subtitle" data-i18n="home.sections.tripTypes.copy">Fast entry points for last minute, family, city, beach and Signature Collection trips.</div>
  <div id="trip-type-grid" class="trip-type-grid"></div>
</section>

<section class="content-section long-band" id="budget-section">
  <div class="section-title">Find the right trip for your spend</div>
  <div class="section-subtitle">A quicker way into the catalogue. Start with the kind of value you want, then refine dates, hotel and destination.</div>
  <div class="budget-strip" id="budget-strip"></div>
</section>

<section class="content-section club-story-section">
  <div class="newsletter-cta club-story">
    <div>
      <span class="club-story-kicker">SKANDI CLUB</span>
      <strong data-i18n="home.clubCta.title">Join SKANDI Club for offers and trip inspiration</strong>
      <p data-i18n="home.clubCta.copy">Get member offers, destination cards and reminders connected to your trips.</p>
    </div>
    <button type="button" data-route-key="club" data-i18n="home.clubCta.button">Join SKANDI Club</button>
  </div>
</section>

<section class="content-section signature-push" id="signature-push">
  <div class="signature-panel">
    <div class="signature-visual" id="signature-visual"></div>
    <div class="signature-copy">
      <div class="signature-kicker">SKANDI SIGNATURE COLLECTION</div>
      <h2>More than a hotel stay.</h2>
      <p>Curated stays, destination support and a more considered way to travel. Use Signature when the hotel, arrival and local experience should feel like one trip.</p>
      <div class="signature-points">
        <span>Hand-picked hotels and areas</span>
        <span>SKANDI transfer and local support options</span>
        <span>Built for complete flight + stay journeys</span>
      </div>
      <button class="signature-btn" type="button" data-route-key="skandiCollection">Explore Signature Collection</button>
    </div>
  </div>
</section>

<section class="content-section" id="destinations-section" hidden>
  <div class="section-title" id="destination-section-title" data-i18n="home.sections.destinations.title">Popular Destinations</div>
  <div class="section-subtitle" data-i18n="home.sections.destinations.copy">Destination cards are loaded from SKANDI travel content and can show live starting prices when available.</div>
  <div id="destinations-grid" class="destination-editorial-grid"></div>
</section>

<section class="content-section route-ideas" id="route-ideas-section" hidden>
  <div class="section-title">Ideas to start with</div>
  <div class="section-subtitle">A few homepage destinations presented as complete trip ideas, not just destination thumbnails.</div>
  <div class="route-grid" id="route-ideas-grid"></div>
</section>

<section class="content-section" id="hotels-section" hidden>
  <div class="section-title" data-i18n="home.sections.hotels.title">Hotels worth checking out</div>
  <div class="section-subtitle" data-i18n="home.sections.hotels.copy">Exact SKANDI hotels selected for the homepage, priced live through Duffel Stays.</div>
  <div id="hotel-grid" class="hotel-grid"></div>
</section>

<section class="content-section recently-section" id="recently-section" hidden>
  <div class="section-title">Hotels you have looked at</div>
  <div class="section-subtitle">Pick up where you left off.</div>
  <div class="recently-rail" id="recently-rail"></div>
</section>


<section class="service-shop" id="service-shop-section">
  <div class="content-section">
    <div class="section-title">Build more into the trip</div>
    <div class="section-subtitle">The holiday is more than the flight and hotel. Add the parts that make arrival and the days in between easier.</div>
    <div class="service-shop-grid" id="service-shop-grid"></div>
  </div>
</section>

<section class="content-section" id="inspiration-section" hidden>
  <div class="inner">
    <div class="section-title" data-i18n="home.sections.inspiration.title">Travel inspiration</div>
    <div class="section-subtitle" data-i18n="home.sections.inspiration.copy">Stories, guides and ideas selected by SKANDI. Only published inspiration appears here.</div>
    <div id="inspiration-grid" class="inspiration-grid"></div>
  </div>
</section>

<section class="content-section seasonal-band" id="seasonal-section">
  <div class="section-title">Where do you want the year to take you?</div>
  <div class="section-subtitle">Seasonal prompts that change the pace of the homepage and lead into the same SKANDI destination catalogue.</div>
  <div class="seasonal-rail" id="seasonal-rail"></div>
</section>


<section class="guide-push" id="guide-push-section">
  <div class="content-section">
    <div class="section-title">Travel smarter with SKANDI</div>
    <div class="section-subtitle">Useful content belongs on Home too: destination guides, airport information and practical travel support.</div>
    <div class="guide-grid" id="guide-grid"></div>
  </div>
</section>


<section class="content-section brand-story" id="brand-story-section">
  <div class="brand-story-panel">
    <div class="brand-story-copy">
      <small>VOY / SKANDI STORIES</small>
      <h2>Travel is also what you discover before you book.</h2>
      <p>Use Home to push stories, guides, destinations, hotels and SKANDI ideas — not only products with a price tag.</p>
      <button type="button" data-route-key="voy">Explore travel stories</button>
    </div>
    <div class="brand-story-visual"></div>
  </div>
</section>

<section id="why">
  <div id="why-title" data-i18n="home.sections.why">Why Travel With SKANDI</div>
  <div id="why-grid"></div>
</section>


<div id="skandiToast" class="skandi-toast" role="status" aria-live="polite"></div>

<script>
const SOURCE = "SKANDI_HOME";
const HOME_PROTOCOL_VERSION = "2026.09.09.9";
const PARENT = "SKANDI_WIX_PARENT";

const ROUTE_DEFAULTS = Object.freeze({
  home:"/", search:"/search", flights:"/flights", carRental:"/car-rental", hotels:"/hotels", packages:"/packages",
  tours:"/tours", activities:"/activities", transfers:"/transfers", destinations:"/destinations", offers:"/offers", travelInfo:"/travel-info",
  skandiCollection:"/skandi-collection", voy:"/voy-magazine", myTrip:"/my-profile?tab=trips", club:"/skandi-club",
  about:"/about", support:"/about/support", newsroom:"/about/news-room", theStore:"/the-store", ourNetwork:"/about/our-network",
  legal:"/about/legal", policies:"/about/legal/policies"
});
let MASTER_CONTEXT = { routes:{...ROUTE_DEFAULTS}, customer:{} };

function masterRoute(key, fallback="") {
  return String(MASTER_CONTEXT?.routes?.[key] || fallback || ROUTE_DEFAULTS[key] || "/");
}
function flattenMasterLinks() {
  const customer = MASTER_CONTEXT?.customer || {};
  const out = [];
  const add = rows => (Array.isArray(rows) ? rows : []).forEach(row => { if (row?.path) out.push(row); });
  add(customer?.header?.primaryNav); add(customer?.header?.secondaryNav); add(customer?.header?.accountNav);
  (customer?.footer?.columns || []).forEach(col => add(col?.links));
  return out;
}
function masterLinkByLabels(labels, fallback) {
  const wanted = (Array.isArray(labels) ? labels : [labels]).map(x => String(x||"").toLowerCase());
  const hit = flattenMasterLinks().find(row => wanted.some(label => String(row?.label||"").toLowerCase().includes(label)));
  return String(hit?.path || fallback || "/");
}
function offersRoute() { return masterRoute("offers", masterLinkByLabels(["last chance","offer"], "/offers")); }
function travelInfoRoute() { return masterRoute("travelInfo", masterLinkByLabels(["before you travel","travel info"], "/travel-info")); }
function destinationsRoute() {
  // Generic destination navigation follows masterPage.js. Detail cards may carry
  // their own database-generated public detail URL.
  return masterRoute("destinations", "/destinations");
}
function routeByKey(key) {
  if (key === "offers") return offersRoute();
  if (key === "travelInfo") return travelInfoRoute();
  if (key === "destinations") return destinationsRoute();
  return masterRoute(key);
}
function defaultContentPath(kind) {
  if (kind === "offer") return offersRoute();
  if (kind === "hotel") return masterRoute("hotels");
  if (kind === "inspiration") return masterRoute("voy");
  return destinationsRoute();
}
function safeRouteValue(path, fallback="/") {
  const value = String(path || "").trim();
  return value.startsWith("/") && !value.startsWith("//") ? value : fallback;
}

function postToParent(message) {
  // Wix HTML Components can be hosted on a different origin than the surrounding Wix page.
  // Use the standard cross-origin bridge and validate application messages by source/type.
  window.parent.postMessage(message, "*");
}

function showPageLoader(show = true) {
  const loader = document.getElementById("pageLoader");
  if (loader) {
    if (show) loader.classList.add("active");
    else loader.classList.remove("active");
  }
}

function navigateParent(path) {
  const target = String(path || "").trim();
  if (!target) return;
  
  // Show spinner immediately so the user knows the click registered
  showPageLoader(true);

  if (window.parent === window) {
    window.location.assign(target);
    return;
  }

  postToParent({
    source: SOURCE,
    type: "HOME_NAVIGATE",
    path: target
  });
  
  // Safety timeout in case parent responds slowly
  setTimeout(() => showPageLoader(false), 2500);
}


/* ==========================================================================
   LOCKED CUSTOMER LANGUAGE / CURRENCY STANDARD
   ========================================================================== */

const I18N = {
  "EN": {
    "nav.packages": "Packages",
    "nav.destinations": "Destinations",
    "nav.club": "Signature Club",
    "nav.info": "Travel Info",
    "nav.search": "Search",
    "nav.clubBtn": "SKANDI Club",
    "nav.menu": "MENU",
    "nav.signIn": "Sign in",
    "settings.language": "Language",
    "settings.currency": "Currency",
    "settings.apply": "Apply Settings",
    "welcome.title": "Welcome to SKANDI",
    "welcome.copy": "Please confirm your preferred language and currency before continuing.",
    "welcome.btn": "Continue to Site",
    "home.hero.kicker": "SKANDI TRAVELS",
    "home.hero.title": "Discover Your Next Journey",
    "home.hero.copy": "Find Flight + Hotel packages, flights, hotels and SKANDI Collection packages",
    "home.tabs.flights": "Flights",
    "home.tabs.holidays": "Flight + Hotel",
    "home.tabs.hotels": "Hotels",
    "home.tabs.signature": "SKANDI Collection",
    "home.fields.from": "From",
    "home.fields.to": "To",
    "home.fields.travelDates": "Travel Dates",
    "home.fields.adults": "Adults",
    "home.fields.children": "Children",
    "home.fields.infants": "Infants",
    "home.fields.class": "Class",
    "home.fields.stops": "Stops",
    "home.fields.currency": "Currency",
    "home.fields.departureAirport": "Departure Airport",
    "home.fields.destination": "Destination",
    "home.fields.departureDate": "Departure Date",
    "home.fields.lengthStay": "Length of Stay",
    "home.fields.rooms": "Rooms",
    "home.fields.checkIn": "Check-In",
    "home.fields.checkOut": "Check-Out",
    "home.fields.signatureDestination": "Signature Destination",
    "home.fields.length": "Length",
    "home.placeholders.airport": "City, airport, IATA or ICAO",
    "home.age.adults": "12+ years",
    "home.age.children": "2–11 years",
    "home.age.infants": "Under 2 years",
    "home.search.flights": "Search Flights",
    "home.search.holidays": "Search Flight + Hotel",
    "home.search.hotels": "Search Hotels",
    "home.search.signature": "Search Signature Collection",
    "home.helpers.hotels": "Curated hotels",
    "home.helpers.transfers": "Local transfers",
    "home.helpers.experiences": "SKANDI experiences",
    "home.results.kicker": "Search Results",
    "home.results.title": "Available Trips",
    "home.results.copy": "Results will appear here.",
    "home.results.edit": "Edit Search",
    "home.date.kicker": "Select Travel Dates",
    "home.date.clear": "Clear",
    "home.date.apply": "Apply Dates",
    "home.sections.discovery.title": "Explore SKANDI",
    "home.sections.discovery.copy": "A changing mix of destinations, hotels, current offers and travel stories selected for the homepage.",
    "home.sections.destinations.title": "Popular Destinations",
    "home.sections.destinations.copy": "Destination cards are loaded from SKANDI travel content and can show live starting prices when available.",
    "home.sections.offers.title": "Top Offers",
    "home.sections.offers.copy": "Campaign, Signature Collection and seasonal offer cards are controlled from SKANDI content records.",
    "home.sections.hotels.title": "Hotels worth checking out",
    "home.sections.hotels.copy": "Exact SKANDI hotels selected for the homepage, priced live through Duffel Stays.",
    "home.sections.inspiration.title": "Travel inspiration",
    "home.sections.inspiration.copy": "Stories, guides and ideas selected by SKANDI. Only published inspiration appears here.",
    "home.card.liveStay": "Live Duffel price",
    "home.card.sevenNights": "7-night stay",
    "home.card.checkLive": "Check live price",
    "home.card.readMore": "Read more",
    "home.sections.tripTypes.title": "What kind of trip are you looking for?",
    "home.sections.tripTypes.copy": "Fast entry points for last minute, family, city, beach and Signature Collection trips.",
    "home.sections.why": "Why Travel With SKANDI",
    "home.clubCta.title": "Join SKANDI Club for offers and trip inspiration",
    "home.clubCta.copy": "Get member offers, destination cards and reminders connected to your trips.",
    "home.clubCta.button": "Join SKANDI Club",
    "footer.news.title": "Get SKANDI offers and travel inspiration",
    "footer.news.desc": "Receive destination guides, Signature Collection updates and member offers.",
    "footer.news.btn": "Sign up",
    "footer.col1.title": "Book & Travel",
    "footer.col1.l1": "Manage your booking",
    "footer.col1.l2": "Book a trip",
    "footer.col1.l3": "Signature Collection",
    "footer.col1.l4": "Destinations",
    "footer.col1.l5": "Hotels",
    "footer.col1.l6": "Flights",
    "footer.col1.l7": "Tours & Activities",
    "footer.col1.l8": "Car Rental",
    "footer.col1.l9": "Offers",
    "footer.col2.title": "Help & Travel Info",
    "footer.col2.l1": "Before you travel",
    "footer.col2.l2": "Passport & visa",
    "footer.col2.l3": "Baggage",
    "footer.col2.l4": "Insurance",
    "footer.col2.l5": "Help Center",
    "footer.col2.l6": "Contact us",
    "footer.col2.l7": "Special assistance",
    "footer.col3.title": "SKANDI Club",
    "footer.col3.l1": "Join SKANDI Club",
    "footer.col3.l2": "Member benefits",
    "footer.col3.l3": "My Club Status",
    "footer.col3.l4": "Travel Wallet & Vouchers",
    "footer.col4.title": "About",
    "footer.col4.l1": "About SKANDI Travels",
    "footer.col4.l2": "Newsroom",
    "footer.col4.l3": "Careers",
    "footer.col4.l4": "Our Network",
    "footer.bottom.terms": "Payment methods, supplier terms and package travel conditions may vary by product.",
    "footer.bottom.l1": "Legal",
    "footer.bottom.l8": "Terms of Use",
    "footer.bottom.l2": "Accessibility",
    "footer.bottom.l3": "Website disclaimer",
    "footer.bottom.l4": "Privacy Policy",
    "footer.bottom.l5": "Cookies Policy",
    "footer.bottom.l6": "Booking Terms",
    "footer.bottom.l7": "Staff login",
    "nav.myProfile": "My Profile",
    "nav.myTrips": "My Trips & Bookings",
    "nav.clubRewards": "Club Rewards & Status",
    "nav.travelWallet": "Travel Wallet & Vouchers",
    "nav.helpClub": "Help & Club Support",
    "nav.helpCenter": "Help Center",
    "header.explore": "Explore SKANDI Travels",
    "header.member": "Member",
    "header.points": "points",
    "header.yourClub": "Your SKANDI Club",
    "header.joinClub": "Join SKANDI Club",
    "header.hi": "Hi, {name}",
    "header.welcomeBack": "Welcome Back",
    "header.signInMeta": "Sign in to access your trips, points and travel documents.",
    "header.saveFavourites": "Save your favourites",
    "header.saveFavouritesCopy": "Sign in to save destinations, offers and pages to your profile.",
    "header.email": "Email address",
    "header.password": "Password",
    "header.logIn": "Log In",
    "header.logout": "Logout",
    "home.option.economy": "Economy",
    "home.option.premiumEconomy": "Premium Economy",
    "home.option.business": "Business",
    "home.option.first": "First",
    "home.option.anyStops": "Any stops",
    "home.option.nonstopOnly": "Nonstop only",
    "home.option.week1": "1 week",
    "home.option.nights10": "10 nights",
    "home.option.weeks2": "2 weeks",
    "home.option.weeks3": "3 weeks",
    "home.option.nights7": "7 nights",
    "home.option.nights14": "14 nights",
    "home.loading.departureAirports": "Loading departure airports...",
    "home.loading.destinations": "Loading destinations...",
    "home.loading.airports": "Loading airports...",
    "home.select.departureAirport": "Select departure airport",
    "home.select.destination": "Select destination",
    "home.placeholders.hotelDestination": "City, region, hotel name",
    "footer.news.placeholder": "Email address",
    "footer.bottom.rights": "All rights reserved.",
    "home.age.childLabel": "Child {n} Age",
    "home.age.infantLabel": "Infant {n} Age",
    "home.age.underOne": "Under 1",
    "home.date.oneWay": "One-way if selected now",
    "home.status.selectDepartureDate": "Select a From date.",
    "home.status.selectReturnDate": "Select a To date.",
    "home.status.invalidDateRange": "To date must be after From date.",
    "home.status.selectRoute": "Select both origin and destination from the suggestions.",
    "home.status.selectPackageRoute": "Select departure airport and destination.",
    "home.status.enterHotelDestination": "Enter a hotel destination.",
    "home.status.searching": "Searching live availability and SKANDI package cards...",
    "home.status.noResults": "No results found. Try a different date or destination.",
    "home.status.offerSaved": "Offer saved. Continuing...",
    "home.status.searchFailed": "Search failed.",
    "home.status.foundOne": "Found 1 result.",
    "home.status.foundMany": "Found {count} results.",
    "home.result.livePrice": "Live price",
    "home.result.travelOffer": "Travel offer",
    "home.result.summaryFallback": "Final price and availability are confirmed before payment.",
    "home.result.type": "Type",
    "home.result.source": "Source",
    "home.result.check": "Check",
    "home.result.revalidated": "Revalidated before payment",
    "home.result.select": "Select",
    "home.result.travel": "Travel",
    "home.summary.adult": "adult",
    "home.summary.adults": "adults",
    "home.summary.child": "child",
    "home.summary.children": "children",
    "home.title.hotelsIn": "Hotels in {destination}",
    "home.title.holidayPackages": "Holiday packages",
    "home.card.from": "From",
    "home.card.offer": "Offer",
    "home.card.destination": "Destination",
    "home.card.explore": "Explore curated SKANDI travel options.",
    "home.card.limited": "Limited availability. Final price confirmed before payment.",
    "home.card.lastMinute": "Last minute",
    "home.card.lastMinuteText": "Find trips leaving soon.",
    "home.card.flightHotel": "Flight + Hotel",
    "home.card.flightHotelText": "Bundle live flights with hotel content.",
    "home.card.onlyFlights": "Only flights",
    "home.card.onlyFlightsText": "Search live flight offers.",
    "home.card.onlyHotels": "Only hotels",
    "home.card.onlyHotelsText": "Browse hotel stays and details.",
    "home.card.signatureCollection": "Signature Collection",
    "home.card.signatureCollectionText": "Curated SKANDI packages.",
    "home.card.travelGuides": "Travel guides",
    "home.card.travelGuidesText": "Explore destinations before booking.",
    "home.why.curated": "Curated travel",
    "home.why.curatedText": "SKANDI combines live travel components with selected destinations, hotels and local services.",
    "home.why.secure": "Secure booking",
    "home.why.secureText": "Price and availability are revalidated before payment.",
    "home.why.documents": "Documents in one place",
    "home.why.documentsText": "Trips, orders and travel documents stay connected to My Profile.",
    "home.why.support": "Support throughout",
    "home.why.supportText": "Help before, during and after your journey.",
    "home.trust.noSurprise": "No surprise flow",
    "home.trust.noSurpriseText": "Final availability is confirmed before payment.",
    "home.trust.packageClarity": "Package clarity",
    "home.trust.packageClarityText": "Flight, hotel and local services are shown together.",
    "home.trust.myProfile": "My Profile",
    "home.trust.myProfileText": "Trips and documents remain accessible.",
    "home.trust.club": "SKANDI Club",
    "home.trust.clubText": "Points and member offers are connected.",
    "toast.newsletterThanks": "Thank you for subscribing.",
    "toast.newsletterFailed": "Newsletter signup failed."
  },
  "SV": {
    "nav.packages": "Paketresor",
    "nav.destinations": "Destinationer",
    "nav.club": "Signature Club",
    "nav.info": "Reseinfo",
    "nav.search": "Sök",
    "nav.clubBtn": "SKANDI Club",
    "nav.menu": "MENY",
    "nav.signIn": "Logga in",
    "settings.language": "Språk",
    "settings.currency": "Valuta",
    "settings.apply": "Spara inställningar",
    "welcome.title": "Välkommen till SKANDI",
    "welcome.copy": "Bekräfta önskat språk och valuta innan du fortsätter.",
    "welcome.btn": "Fortsätt till webbplatsen",
    "home.hero.kicker": "SKANDI TRAVELS",
    "home.hero.title": "Upptäck din nästa resa",
    "home.hero.copy": "Sök flyg, semesterresor, hotell och paket i SKANDI Collection",
    "home.tabs.flights": "Flyg",
    "home.tabs.holidays": "Flyg + hotell",
    "home.tabs.hotels": "Hotell",
    "home.tabs.signature": "SKANDI Collection",
    "home.fields.from": "Från",
    "home.fields.to": "Till",
    "home.fields.travelDates": "Resedatum",
    "home.fields.adults": "Vuxna",
    "home.fields.children": "Barn",
    "home.fields.infants": "Spädbarn",
    "home.fields.class": "Reseklass",
    "home.fields.stops": "Mellanlandningar",
    "home.fields.currency": "Valuta",
    "home.fields.departureAirport": "Avreseflygplats",
    "home.fields.destination": "Destination",
    "home.fields.departureDate": "Avresedatum",
    "home.fields.lengthStay": "Reslängd",
    "home.fields.rooms": "Rum",
    "home.fields.checkIn": "Incheckning",
    "home.fields.checkOut": "Utcheckning",
    "home.fields.signatureDestination": "Signature-destination",
    "home.fields.length": "Längd",
    "home.placeholders.airport": "Stad, flygplats, IATA eller ICAO",
    "home.age.adults": "12+ år",
    "home.age.children": "2–11 år",
    "home.age.infants": "Under 2 år",
    "home.search.flights": "Sök flyg",
    "home.search.holidays": "Sök flyg + hotell",
    "home.search.hotels": "Sök hotell",
    "home.search.signature": "Sök SKANDI Collection",
    "home.helpers.hotels": "Utvalda hotell",
    "home.helpers.transfers": "Lokala transfers",
    "home.helpers.experiences": "SKANDI-upplevelser",
    "home.results.kicker": "Sökresultat",
    "home.results.title": "Tillgängliga resor",
    "home.results.copy": "Resultaten visas här.",
    "home.results.edit": "Ändra sökning",
    "home.date.kicker": "Välj resedatum",
    "home.date.clear": "Rensa",
    "home.date.apply": "Använd datum",
    "home.sections.destinations.title": "Populära destinationer",
    "home.sections.destinations.copy": "Destinationskort hämtas från SKANDI:s reseinnehåll och kan visa aktuella frånpriser.",
    "home.sections.offers.title": "Bästa erbjudanden",
    "home.sections.offers.copy": "Kampanjer, Signature Collection och säsongserbjudanden styrs från SKANDI:s innehållsposter.",
    "home.sections.hotels.title": "Hotell värda att upptäcka",
    "home.sections.hotels.copy": "Utvalda SKANDI-hotell med aktuella priser från Duffel Stays.",
    "home.sections.inspiration.title": "Reseinspiration",
    "home.sections.inspiration.copy": "Berättelser, guider och idéer utvalda av SKANDI. Endast publicerad inspiration visas här.",
    "home.card.liveStay": "Aktuellt Duffel-pris",
    "home.card.sevenNights": "7 nätters vistelse",
    "home.card.checkLive": "Kontrollera aktuellt pris",
    "home.card.readMore": "Läs mer",
    "home.sections.tripTypes.title": "Vilken typ av resa söker du?",
    "home.sections.tripTypes.copy": "Snabbval för sista minuten, familj, stad, strand och Signature Collection.",
    "home.sections.why": "Varför resa med SKANDI",
    "home.clubCta.title": "Gå med i SKANDI Club för erbjudanden och inspiration",
    "home.clubCta.copy": "Få medlemserbjudanden, destinationstips och påminnelser kopplade till dina resor.",
    "home.clubCta.button": "Gå med i SKANDI Club",
    "footer.news.title": "Få SKANDI-erbjudanden och reseinspiration",
    "footer.news.desc": "Få destinationsguider, uppdateringar om Signature Collection och medlemserbjudanden.",
    "footer.news.btn": "Prenumerera",
    "footer.col1.title": "Boka & Res",
    "footer.col1.l1": "Hantera din bokning",
    "footer.col1.l2": "Boka en resa",
    "footer.col1.l3": "Signature Collection",
    "footer.col1.l4": "Destinationer",
    "footer.col1.l5": "Hotell",
    "footer.col1.l6": "Flyg",
    "footer.col1.l7": "Utflykter & Aktiviteter",
    "footer.col1.l8": "Hyrbil",
    "footer.col1.l9": "Erbjudanden",
    "footer.col2.title": "Hjälp & Reseinfo",
    "footer.col2.l1": "Innan du reser",
    "footer.col2.l2": "Pass & visum",
    "footer.col2.l3": "Bagage",
    "footer.col2.l4": "Försäkring",
    "footer.col2.l5": "Hjälpcenter",
    "footer.col2.l6": "Kontakta oss",
    "footer.col2.l7": "Särskild assistans",
    "footer.col3.title": "SKANDI Club",
    "footer.col3.l1": "Gå med i SKANDI Club",
    "footer.col3.l2": "Medlemsförmåner",
    "footer.col3.l3": "Min klubbstatus",
    "footer.col3.l4": "Resekassa & värdebevis",
    "footer.col4.title": "Om oss",
    "footer.col4.l1": "Om SKANDI Travels",
    "footer.col4.l2": "Nyhetsrum",
    "footer.col4.l3": "Karriär",
    "footer.col4.l4": "Vårt nätverk",
    "footer.bottom.terms": "Betalningsmetoder, leverantörsvillkor och paketresevillkor kan variera per produkt.",
    "footer.bottom.l1": "Juridisk information",
    "footer.bottom.l8": "Användarvillkor",
    "footer.bottom.l2": "Tillgänglighet",
    "footer.bottom.l3": "Ansvarsfriskrivning",
    "footer.bottom.l4": "Integritetspolicy",
    "footer.bottom.l5": "Cookiepolicy",
    "footer.bottom.l6": "Bokningsvillkor",
    "footer.bottom.l7": "Personalinloggning",
    "nav.myProfile": "Min profil",
    "nav.myTrips": "Mina resor & bokningar",
    "nav.clubRewards": "Klubbförmåner & status",
    "nav.travelWallet": "Resekassa & värdebevis",
    "nav.helpClub": "Hjälp & klubbsupport",
    "nav.helpCenter": "Hjälpcenter",
    "header.explore": "Utforska SKANDI Travels",
    "header.member": "Medlem",
    "header.points": "poäng",
    "header.yourClub": "Din SKANDI Club",
    "header.joinClub": "Gå med i SKANDI Club",
    "header.hi": "Hej, {name}",
    "header.welcomeBack": "Välkommen tillbaka",
    "header.signInMeta": "Logga in för att se dina resor, poäng och resedokument.",
    "header.saveFavourites": "Spara dina favoriter",
    "header.saveFavouritesCopy": "Logga in för att spara destinationer, erbjudanden och sidor i din profil.",
    "header.email": "E-postadress",
    "header.password": "Lösenord",
    "header.logIn": "Logga in",
    "header.logout": "Logga ut",
    "home.option.economy": "Ekonomi",
    "home.option.premiumEconomy": "Premium Economy",
    "home.option.business": "Business",
    "home.option.first": "Första klass",
    "home.option.anyStops": "Alla mellanlandningar",
    "home.option.nonstopOnly": "Endast direktflyg",
    "home.option.week1": "1 vecka",
    "home.option.nights10": "10 nätter",
    "home.option.weeks2": "2 veckor",
    "home.option.weeks3": "3 veckor",
    "home.option.nights7": "7 nätter",
    "home.option.nights14": "14 nätter",
    "home.loading.departureAirports": "Laddar avreseflygplatser...",
    "home.loading.destinations": "Laddar destinationer...",
    "home.loading.airports": "Laddar flygplatser...",
    "home.select.departureAirport": "Välj avreseflygplats",
    "home.select.destination": "Välj destination",
    "home.placeholders.hotelDestination": "Stad, region eller hotellnamn",
    "footer.news.placeholder": "E-postadress",
    "footer.bottom.rights": "Alla rättigheter förbehållna.",
    "home.age.childLabel": "Barn {n}, ålder",
    "home.age.infantLabel": "Spädbarn {n}, ålder",
    "home.age.underOne": "Under 1 år",
    "home.date.oneWay": "Enkel resa om du väljer nu",
    "home.status.selectDepartureDate": "Välj ett avresedatum.",
    "home.status.selectRoute": "Välj både avreseort och destination från förslagen.",
    "home.status.selectPackageRoute": "Välj avreseflygplats och destination.",
    "home.status.enterHotelDestination": "Ange en hotelldestination.",
    "home.status.searching": "Söker aktuell tillgänglighet och SKANDI-paket...",
    "home.status.noResults": "Inga resultat hittades. Prova ett annat datum eller en annan destination.",
    "home.status.offerSaved": "Erbjudandet har sparats. Fortsätter...",
    "home.status.searchFailed": "Sökningen misslyckades.",
    "home.status.foundOne": "1 resultat hittades.",
    "home.status.foundMany": "{count} resultat hittades.",
    "home.result.livePrice": "Aktuellt pris",
    "home.result.travelOffer": "Reseerbjudande",
    "home.result.summaryFallback": "Slutpris och tillgänglighet bekräftas före betalning.",
    "home.result.type": "Typ",
    "home.result.source": "Källa",
    "home.result.check": "Kontroll",
    "home.result.revalidated": "Kontrolleras igen före betalning",
    "home.result.select": "Välj",
    "home.result.travel": "Resa",
    "home.summary.adult": "vuxen",
    "home.summary.adults": "vuxna",
    "home.summary.child": "barn",
    "home.summary.children": "barn",
    "home.title.hotelsIn": "Hotell i {destination}",
    "home.title.holidayPackages": "Semesterpaket",
    "home.card.from": "Från",
    "home.card.offer": "Erbjudande",
    "home.card.destination": "Destination",
    "home.card.explore": "Utforska utvalda SKANDI-resor.",
    "home.card.limited": "Begränsad tillgänglighet. Slutpris bekräftas före betalning.",
    "home.card.lastMinute": "Sista minuten",
    "home.card.lastMinuteText": "Hitta resor med nära avresa.",
    "home.card.flightHotel": "Flyg + hotell",
    "home.card.flightHotelText": "Kombinera aktuella flyg med hotell.",
    "home.card.onlyFlights": "Endast flyg",
    "home.card.onlyFlightsText": "Sök aktuella flygerbjudanden.",
    "home.card.onlyHotels": "Endast hotell",
    "home.card.onlyHotelsText": "Utforska hotell och boendedetaljer.",
    "home.card.signatureCollection": "Signature Collection",
    "home.card.signatureCollectionText": "Utvalda SKANDI-paket.",
    "home.card.travelGuides": "Reseguider",
    "home.card.travelGuidesText": "Utforska destinationer före bokning.",
    "home.why.curated": "Utvalda resor",
    "home.why.curatedText": "SKANDI kombinerar aktuella resekomponenter med utvalda destinationer, hotell och lokala tjänster.",
    "home.why.secure": "Säker bokning",
    "home.why.secureText": "Pris och tillgänglighet kontrolleras igen före betalning.",
    "home.why.documents": "Dokument på ett ställe",
    "home.why.documentsText": "Resor, beställningar och resedokument förblir kopplade till Min profil.",
    "home.why.support": "Support hela vägen",
    "home.why.supportText": "Hjälp före, under och efter resan.",
    "home.trust.noSurprise": "Inga överraskningar",
    "home.trust.noSurpriseText": "Slutlig tillgänglighet bekräftas före betalning.",
    "home.trust.packageClarity": "Tydliga paket",
    "home.trust.packageClarityText": "Flyg, hotell och lokala tjänster visas tillsammans.",
    "home.trust.myProfile": "Min profil",
    "home.trust.myProfileText": "Resor och dokument förblir tillgängliga.",
    "home.trust.club": "SKANDI Club",
    "home.trust.clubText": "Poäng och medlemserbjudanden är sammankopplade.",
    "toast.newsletterThanks": "Tack för din prenumeration.",
    "toast.newsletterFailed": "Registreringen för nyhetsbrevet misslyckades."
  },
  "NO": {
    "nav.packages": "Pakkereiser",
    "nav.destinations": "Reisemål",
    "nav.club": "Signature Club",
    "nav.info": "Reiseinfo",
    "nav.search": "Søk",
    "nav.clubBtn": "SKANDI Club",
    "nav.menu": "MENY",
    "nav.signIn": "Logg inn",
    "settings.language": "Språk",
    "settings.currency": "Valuta",
    "settings.apply": "Lagre innstillinger",
    "welcome.title": "Velkommen til SKANDI",
    "welcome.copy": "Bekreft ønsket språk og valuta før du fortsetter.",
    "welcome.btn": "Fortsett til nettstedet",
    "home.hero.kicker": "SKANDI TRAVELS",
    "home.hero.title": "Oppdag din neste reise",
    "home.hero.copy": "Finn fly, feriereiser, hotell og pakker i SKANDI Collection",
    "home.tabs.flights": "Fly",
    "home.tabs.holidays": "Fly + hotell",
    "home.tabs.hotels": "Hotell",
    "home.tabs.signature": "SKANDI Collection",
    "home.fields.from": "Fra",
    "home.fields.to": "Til",
    "home.fields.travelDates": "Reisedatoer",
    "home.fields.adults": "Voksne",
    "home.fields.children": "Barn",
    "home.fields.infants": "Spedbarn",
    "home.fields.class": "Reiseklasse",
    "home.fields.stops": "Mellomlandinger",
    "home.fields.currency": "Valuta",
    "home.fields.departureAirport": "Avreiseflyplass",
    "home.fields.destination": "Reisemål",
    "home.fields.departureDate": "Avreisedato",
    "home.fields.lengthStay": "Reiselengde",
    "home.fields.rooms": "Rom",
    "home.fields.checkIn": "Innsjekking",
    "home.fields.checkOut": "Utsjekking",
    "home.fields.signatureDestination": "Signature-reisemål",
    "home.fields.length": "Lengde",
    "home.placeholders.airport": "By, flyplass, IATA eller ICAO",
    "home.age.adults": "12+ år",
    "home.age.children": "2–11 år",
    "home.age.infants": "Under 2 år",
    "home.search.flights": "Søk fly",
    "home.search.holidays": "Søk fly + hotell",
    "home.search.hotels": "Søk hotell",
    "home.search.signature": "Søk SKANDI Collection",
    "home.helpers.hotels": "Utvalgte hotell",
    "home.helpers.transfers": "Lokale transporter",
    "home.helpers.experiences": "SKANDI-opplevelser",
    "home.results.kicker": "Søkeresultater",
    "home.results.title": "Tilgjengelige reiser",
    "home.results.copy": "Resultatene vises her.",
    "home.results.edit": "Endre søk",
    "home.date.kicker": "Velg reisedatoer",
    "home.date.clear": "Tøm",
    "home.date.apply": "Bruk datoer",
    "home.sections.destinations.title": "Populære reisemål",
    "home.sections.destinations.copy": "Reisemålskort hentes fra SKANDIs reiseinnhold og kan vise aktuelle fra-priser.",
    "home.sections.offers.title": "Beste tilbud",
    "home.sections.offers.copy": "Kampanjer, Signature Collection og sesongtilbud styres fra SKANDIs innholdsposter.",
    "home.sections.hotels.title": "Hotell verdt å oppdage",
    "home.sections.hotels.copy": "Utvalgte SKANDI-hotell med aktuelle priser fra Duffel Stays.",
    "home.sections.inspiration.title": "Reiseinspirasjon",
    "home.sections.inspiration.copy": "Historier, guider og ideer valgt av SKANDI. Kun publisert inspirasjon vises her.",
    "home.card.liveStay": "Aktuell Duffel-pris",
    "home.card.sevenNights": "7 netters opphold",
    "home.card.checkLive": "Sjekk aktuell pris",
    "home.card.readMore": "Les mer",
    "home.sections.tripTypes.title": "Hva slags reise leter du etter?",
    "home.sections.tripTypes.copy": "Hurtigvalg for siste liten, familie, by, strand og Signature Collection.",
    "home.sections.why": "Hvorfor reise med SKANDI",
    "home.clubCta.title": "Bli med i SKANDI Club for tilbud og reiseinspirasjon",
    "home.clubCta.copy": "Få medlemstilbud, reisemålskort og påminnelser knyttet til reisene dine.",
    "home.clubCta.button": "Bli med i SKANDI Club",
    "footer.news.title": "Få SKANDI-tilbud og reiseinspirasjon",
    "footer.news.desc": "Motta reisemålsguider, oppdateringer om Signature Collection og medlemstilbud.",
    "footer.news.btn": "Registrer deg",
    "footer.col1.title": "Bestill & Reis",
    "footer.col1.l1": "Administrer bestillingen",
    "footer.col1.l2": "Bestill en reise",
    "footer.col1.l3": "Signature Collection",
    "footer.col1.l4": "Reisemål",
    "footer.col1.l5": "Hotell",
    "footer.col1.l6": "Fly",
    "footer.col1.l7": "Utflukter & Aktiviteter",
    "footer.col1.l8": "Leiebil",
    "footer.col1.l9": "Tilbud",
    "footer.col2.title": "Hjelp & Reiseinfo",
    "footer.col2.l1": "Før du reiser",
    "footer.col2.l2": "Pass & visum",
    "footer.col2.l3": "Bagasje",
    "footer.col2.l4": "Forsikring",
    "footer.col2.l5": "Hjelpesenter",
    "footer.col2.l6": "Kontakt oss",
    "footer.col2.l7": "Tilrettelagt assistanse",
    "footer.col3.title": "SKANDI Club",
    "footer.col3.l1": "Bli med i SKANDI Club",
    "footer.col3.l2": "Medlemsfordeler",
    "footer.col3.l3": "Min klubbstatus",
    "footer.col3.l4": "Reiselommebok & kuponger",
    "footer.col4.title": "Om",
    "footer.col4.l1": "Om SKANDI Travels",
    "footer.col4.l2": "Nyhetsrom",
    "footer.col4.l3": "Karriere",
    "footer.col4.l4": "Vårt nettverk",
    "footer.bottom.terms": "Betalingsmetoder, leverandørvilkår og pakkereisevilkår kan variere etter produkt.",
    "footer.bottom.l1": "Juridisk",
    "footer.bottom.l8": "Brukervilkår",
    "footer.bottom.l2": "Tilgjengelighet",
    "footer.bottom.l3": "Ansvarsfraskrivelse",
    "footer.bottom.l4": "Personvern",
    "footer.bottom.l5": "Informasjonskapsler",
    "footer.bottom.l6": "Bestillingsvilkår",
    "footer.bottom.l7": "Ansattinnlogging",
    "nav.myProfile": "Min profil",
    "nav.myTrips": "Mine reiser og bestillinger",
    "nav.clubRewards": "Klubbfordeler og status",
    "nav.travelWallet": "Reiselommebok og kuponger",
    "nav.helpClub": "Hjelp og klubbstøtte",
    "nav.helpCenter": "Hjelpesenter",
    "header.explore": "Utforsk SKANDI Travels",
    "header.member": "Medlem",
    "header.points": "poeng",
    "header.yourClub": "Din SKANDI Club",
    "header.joinClub": "Bli med i SKANDI Club",
    "header.hi": "Hei, {name}",
    "header.welcomeBack": "Velkommen tilbake",
    "header.signInMeta": "Logg inn for å se reiser, poeng og reisedokumenter.",
    "header.saveFavourites": "Lagre favorittene dine",
    "header.saveFavouritesCopy": "Logg inn for å lagre reisemål, tilbud og sider i profilen din.",
    "header.email": "E-postadresse",
    "header.password": "Passord",
    "header.logIn": "Logg inn",
    "header.logout": "Logg ut",
    "home.option.economy": "Økonomi",
    "home.option.premiumEconomy": "Premium Economy",
    "home.option.business": "Business",
    "home.option.first": "Første klasse",
    "home.option.anyStops": "Alle mellomlandinger",
    "home.option.nonstopOnly": "Kun direkte",
    "home.option.week1": "1 uke",
    "home.option.nights10": "10 netter",
    "home.option.weeks2": "2 uker",
    "home.option.weeks3": "3 uker",
    "home.option.nights7": "7 netter",
    "home.option.nights14": "14 netter",
    "home.loading.departureAirports": "Laster avreiseflyplasser...",
    "home.loading.destinations": "Laster reisemål...",
    "home.loading.airports": "Laster flyplasser...",
    "home.select.departureAirport": "Velg avreiseflyplass",
    "home.select.destination": "Velg reisemål",
    "home.placeholders.hotelDestination": "By, region eller hotellnavn",
    "footer.news.placeholder": "E-postadresse",
    "footer.bottom.rights": "Alle rettigheter forbeholdt.",
    "home.age.childLabel": "Barn {n}, alder",
    "home.age.infantLabel": "Spedbarn {n}, alder",
    "home.age.underOne": "Under 1 år",
    "home.date.oneWay": "Enveis hvis du velger nå",
    "home.status.selectDepartureDate": "Velg en avreisedato.",
    "home.status.selectRoute": "Velg både avreisested og reisemål fra forslagene.",
    "home.status.selectPackageRoute": "Velg avreiseflyplass og reisemål.",
    "home.status.enterHotelDestination": "Skriv inn et hotellreisemål.",
    "home.status.searching": "Søker i tilgjengelighet og SKANDI-pakker...",
    "home.status.noResults": "Ingen resultater funnet. Prøv en annen dato eller et annet reisemål.",
    "home.status.offerSaved": "Tilbudet er lagret. Fortsetter...",
    "home.status.searchFailed": "Søket mislyktes.",
    "home.status.foundOne": "Fant 1 resultat.",
    "home.status.foundMany": "Fant {count} resultater.",
    "home.result.livePrice": "Aktuell pris",
    "home.result.travelOffer": "Reisetilbud",
    "home.result.summaryFallback": "Sluttpris og tilgjengelighet bekreftes før betaling.",
    "home.result.type": "Type",
    "home.result.source": "Kilde",
    "home.result.check": "Kontroll",
    "home.result.revalidated": "Kontrolleres på nytt før betaling",
    "home.result.select": "Velg",
    "home.result.travel": "Reise",
    "home.summary.adult": "voksen",
    "home.summary.adults": "voksne",
    "home.summary.child": "barn",
    "home.summary.children": "barn",
    "home.title.hotelsIn": "Hotell i {destination}",
    "home.title.holidayPackages": "Feriepakker",
    "home.card.from": "Fra",
    "home.card.offer": "Tilbud",
    "home.card.destination": "Reisemål",
    "home.card.explore": "Utforsk utvalgte SKANDI-reiser.",
    "home.card.limited": "Begrenset tilgjengelighet. Sluttpris bekreftes før betaling.",
    "home.card.lastMinute": "Siste liten",
    "home.card.lastMinuteText": "Finn reiser med avreise snart.",
    "home.card.flightHotel": "Fly + hotell",
    "home.card.flightHotelText": "Kombiner aktuelle fly med hotell.",
    "home.card.onlyFlights": "Kun fly",
    "home.card.onlyFlightsText": "Søk i aktuelle flytilbud.",
    "home.card.onlyHotels": "Kun hotell",
    "home.card.onlyHotelsText": "Utforsk hotellopphold og detaljer.",
    "home.card.signatureCollection": "Signature Collection",
    "home.card.signatureCollectionText": "Utvalgte SKANDI-pakker.",
    "home.card.travelGuides": "Reiseguider",
    "home.card.travelGuidesText": "Utforsk reisemål før bestilling.",
    "home.why.curated": "Utvalgte reiser",
    "home.why.curatedText": "SKANDI kombinerer aktuelle reisekomponenter med utvalgte reisemål, hotell og lokale tjenester.",
    "home.why.secure": "Sikker bestilling",
    "home.why.secureText": "Pris og tilgjengelighet kontrolleres på nytt før betaling.",
    "home.why.documents": "Dokumenter på ett sted",
    "home.why.documentsText": "Reiser, bestillinger og reisedokumenter forblir koblet til Min profil.",
    "home.why.support": "Støtte hele veien",
    "home.why.supportText": "Hjelp før, under og etter reisen.",
    "home.trust.noSurprise": "Ingen overraskelser",
    "home.trust.noSurpriseText": "Endelig tilgjengelighet bekreftes før betaling.",
    "home.trust.packageClarity": "Tydelige pakker",
    "home.trust.packageClarityText": "Fly, hotell og lokale tjenester vises samlet.",
    "home.trust.myProfile": "Min profil",
    "home.trust.myProfileText": "Reiser og dokumenter forblir tilgjengelige.",
    "home.trust.club": "SKANDI Club",
    "home.trust.clubText": "Poeng og medlemstilbud er koblet sammen.",
    "toast.newsletterThanks": "Takk for at du registrerte deg.",
    "toast.newsletterFailed": "Registrering for nyhetsbrevet mislyktes."
  },
  "DA": {
    "nav.packages": "Pakkerejser",
    "nav.destinations": "Destinationer",
    "nav.club": "Signature Club",
    "nav.info": "Rejseinfo",
    "nav.search": "Søg",
    "nav.clubBtn": "SKANDI Club",
    "nav.menu": "MENU",
    "nav.signIn": "Log ind",
    "settings.language": "Sprog",
    "settings.currency": "Valuta",
    "settings.apply": "Gem indstillinger",
    "welcome.title": "Velkommen til SKANDI",
    "welcome.copy": "Bekræft dit foretrukne sprog og din valuta, før du fortsætter.",
    "welcome.btn": "Fortsæt til hjemmesiden",
    "home.hero.kicker": "SKANDI TRAVELS",
    "home.hero.title": "Oplev din næste rejse",
    "home.hero.copy": "Find fly, ferierejser, hoteller og pakker i SKANDI Collection",
    "home.tabs.flights": "Fly",
    "home.tabs.holidays": "Fly + hotel",
    "home.tabs.hotels": "Hoteller",
    "home.tabs.signature": "SKANDI Collection",
    "home.fields.from": "Fra",
    "home.fields.to": "Til",
    "home.fields.travelDates": "Rejsedatoer",
    "home.fields.adults": "Voksne",
    "home.fields.children": "Børn",
    "home.fields.infants": "Spædbørn",
    "home.fields.class": "Rejseklasse",
    "home.fields.stops": "Mellemlandinger",
    "home.fields.currency": "Valuta",
    "home.fields.departureAirport": "Afrejselufthavn",
    "home.fields.destination": "Destination",
    "home.fields.departureDate": "Afrejsedato",
    "home.fields.lengthStay": "Rejsens varighed",
    "home.fields.rooms": "Værelser",
    "home.fields.checkIn": "Check-in",
    "home.fields.checkOut": "Check-out",
    "home.fields.signatureDestination": "Signature-destination",
    "home.fields.length": "Varighed",
    "home.placeholders.airport": "By, lufthavn, IATA eller ICAO",
    "home.age.adults": "12+ år",
    "home.age.children": "2–11 år",
    "home.age.infants": "Under 2 år",
    "home.search.flights": "Søg fly",
    "home.search.holidays": "Søg fly + hotel",
    "home.search.hotels": "Søg hoteller",
    "home.search.signature": "Søg SKANDI Collection",
    "home.helpers.hotels": "Udvalgte hoteller",
    "home.helpers.transfers": "Lokale transporter",
    "home.helpers.experiences": "SKANDI-oplevelser",
    "home.results.kicker": "Søgeresultater",
    "home.results.title": "Tilgængelige rejser",
    "home.results.copy": "Resultaterne vises her.",
    "home.results.edit": "Ændre søgning",
    "home.date.kicker": "Vælg rejsedatoer",
    "home.date.clear": "Ryd",
    "home.date.apply": "Anvend datoer",
    "home.sections.destinations.title": "Populære destinationer",
    "home.sections.destinations.copy": "Destinationer hentes fra SKANDIs rejseindhold og kan vise aktuelle fra-priser.",
    "home.sections.offers.title": "Bedste tilbud",
    "home.sections.offers.copy": "Kampagner, Signature Collection og sæsonbetingede tilbud styres fra SKANDIs indholdsposter.",
    "home.sections.hotels.title": "Hoteller værd at opdage",
    "home.sections.hotels.copy": "Udvalgte SKANDI-hoteller med aktuelle priser fra Duffel Stays.",
    "home.sections.inspiration.title": "Rejseinspiration",
    "home.sections.inspiration.copy": "Historier, guider og idéer udvalgt af SKANDI. Kun publiceret inspiration vises her.",
    "home.card.liveStay": "Aktuel Duffel-pris",
    "home.card.sevenNights": "7 nætters ophold",
    "home.card.checkLive": "Tjek aktuel pris",
    "home.card.readMore": "Læs mere",
    "home.sections.tripTypes.title": "Hvilken type rejse leder du efter?",
    "home.sections.tripTypes.copy": "Hurtigvalg til afbudsrejser, familie, storby, strand og Signature Collection.",
    "home.sections.why": "Hvorfor rejse med SKANDI",
    "home.clubCta.title": "Bliv medlem af SKANDI Club og få tilbud og inspiration",
    "home.clubCta.copy": "Få medlemstilbud, rejsemålskort og påmindelser i forbindelse med dine rejser.",
    "home.clubCta.button": "Bliv medlem af SKANDI Club",
    "footer.news.title": "Få SKANDI-tilbud og rejseinspiration",
    "footer.news.desc": "Modtag destinationsguider, Signature Collection-opdateringer og medlemstilbud.",
    "footer.news.btn": "Tilmeld dig",
    "footer.col1.title": "Book & Rejs",
    "footer.col1.l1": "Administrer din booking",
    "footer.col1.l2": "Book en rejse",
    "footer.col1.l3": "Signature Collection",
    "footer.col1.l4": "Destinationer",
    "footer.col1.l5": "Hoteller",
    "footer.col1.l6": "Fly",
    "footer.col1.l7": "Udflugter & aktiviteter",
    "footer.col1.l8": "Billeje",
    "footer.col1.l9": "Tilbud",
    "footer.col2.title": "Hjælp & Rejseinfo",
    "footer.col2.l1": "Før du rejser",
    "footer.col2.l2": "Pas & visum",
    "footer.col2.l3": "Bagage",
    "footer.col2.l4": "Forsikring",
    "footer.col2.l5": "Hjælpecenter",
    "footer.col2.l6": "Kontakt os",
    "footer.col2.l7": "Særlig assistance",
    "footer.col3.title": "SKANDI Club",
    "footer.col3.l1": "Bliv medlem af SKANDI Club",
    "footer.col3.l2": "Medlemsfordele",
    "footer.col3.l3": "Min klubstatus",
    "footer.col3.l4": "Rejsepung & værdibeviser",
    "footer.col4.title": "Om",
    "footer.col4.l1": "Om SKANDI Travels",
    "footer.col4.l2": "Nyhedsrum",
    "footer.col4.l3": "Karriere",
    "footer.col4.l4": "Vores netværk",
    "footer.bottom.terms": "Betalingsmetoder, leverandørvilkår og pakkerejsevilkår kan variere efter produkt.",
    "footer.bottom.l1": "Juridisk",
    "footer.bottom.l8": "Brugsvilkår",
    "footer.bottom.l2": "Tilgængelighed",
    "footer.bottom.l3": "Ansvarsfraskrivelse",
    "footer.bottom.l4": "Persondatapolitik",
    "footer.bottom.l5": "Cookiepolitik",
    "footer.bottom.l6": "Bookingvilkår",
    "footer.bottom.l7": "Medarbejderlogin",
    "nav.myProfile": "Min profil",
    "nav.myTrips": "Mine rejser og bookinger",
    "nav.clubRewards": "Klubfordele og status",
    "nav.travelWallet": "Rejsepung og værdibeviser",
    "nav.helpClub": "Hjælp og klubsupport",
    "nav.helpCenter": "Hjælpecenter",
    "header.explore": "Udforsk SKANDI Travels",
    "header.member": "Medlem",
    "header.points": "point",
    "header.yourClub": "Din SKANDI Club",
    "header.joinClub": "Bliv medlem af SKANDI Club",
    "header.hi": "Hej, {name}",
    "header.welcomeBack": "Velkommen tilbage",
    "header.signInMeta": "Log ind for at se dine rejser, point og rejsedokumenter.",
    "header.saveFavourites": "Gem dine favoritter",
    "header.saveFavouritesCopy": "Log ind for at gemme destinationer, tilbud og sider på din profil.",
    "header.email": "E-mailadresse",
    "header.password": "Adgangskode",
    "header.logIn": "Log ind",
    "header.logout": "Log ud",
    "home.option.economy": "Economy",
    "home.option.premiumEconomy": "Premium Economy",
    "home.option.business": "Business",
    "home.option.first": "Første klasse",
    "home.option.anyStops": "Alle mellemlandinger",
    "home.option.nonstopOnly": "Kun direkte",
    "home.option.week1": "1 uge",
    "home.option.nights10": "10 nætter",
    "home.option.weeks2": "2 uger",
    "home.option.weeks3": "3 uger",
    "home.option.nights7": "7 nætter",
    "home.option.nights14": "14 nætter",
    "home.loading.departureAirports": "Indlæser afrejselufthavne...",
    "home.loading.destinations": "Indlæser destinationer...",
    "home.loading.airports": "Indlæser lufthavne...",
    "home.select.departureAirport": "Vælg afrejselufthavn",
    "home.select.destination": "Vælg destination",
    "home.placeholders.hotelDestination": "By, region eller hotelnavn",
    "footer.news.placeholder": "E-mailadresse",
    "footer.bottom.rights": "Alle rettigheder forbeholdes.",
    "home.age.childLabel": "Barn {n}, alder",
    "home.age.infantLabel": "Spædbarn {n}, alder",
    "home.age.underOne": "Under 1 år",
    "home.date.oneWay": "Enkeltrejse, hvis du vælger nu",
    "home.status.selectDepartureDate": "Vælg en afrejsedato.",
    "home.status.selectRoute": "Vælg både afrejsested og destination fra forslagene.",
    "home.status.selectPackageRoute": "Vælg afrejselufthavn og destination.",
    "home.status.enterHotelDestination": "Indtast en hoteldestination.",
    "home.status.searching": "Søger i aktuel tilgængelighed og SKANDI-pakker...",
    "home.status.noResults": "Ingen resultater fundet. Prøv en anden dato eller destination.",
    "home.status.offerSaved": "Tilbuddet er gemt. Fortsætter...",
    "home.status.searchFailed": "Søgningen mislykkedes.",
    "home.status.foundOne": "Fandt 1 resultat.",
    "home.status.foundMany": "Fandt {count} resultater.",
    "home.result.livePrice": "Aktuel pris",
    "home.result.travelOffer": "Rejsetilbud",
    "home.result.summaryFallback": "Endelig pris og tilgængelighed bekræftes før betaling.",
    "home.result.type": "Type",
    "home.result.source": "Kilde",
    "home.result.check": "Kontrol",
    "home.result.revalidated": "Kontrolleres igen før betaling",
    "home.result.select": "Vælg",
    "home.result.travel": "Rejse",
    "home.summary.adult": "voksen",
    "home.summary.adults": "voksne",
    "home.summary.child": "barn",
    "home.summary.children": "børn",
    "home.title.hotelsIn": "Hoteller i {destination}",
    "home.title.holidayPackages": "Feriepakker",
    "home.card.from": "Fra",
    "home.card.offer": "Tilbud",
    "home.card.destination": "Destination",
    "home.card.explore": "Udforsk udvalgte SKANDI-rejser.",
    "home.card.limited": "Begrænset tilgængelighed. Endelig pris bekræftes før betaling.",
    "home.card.lastMinute": "Afbudsrejser",
    "home.card.lastMinuteText": "Find rejser med snarlig afrejse.",
    "home.card.flightHotel": "Fly + hotel",
    "home.card.flightHotelText": "Kombinér aktuelle fly med hotel.",
    "home.card.onlyFlights": "Kun fly",
    "home.card.onlyFlightsText": "Søg i aktuelle flytilbud.",
    "home.card.onlyHotels": "Kun hoteller",
    "home.card.onlyHotelsText": "Udforsk hotelophold og detaljer.",
    "home.card.signatureCollection": "Signature Collection",
    "home.card.signatureCollectionText": "Udvalgte SKANDI-pakker.",
    "home.card.travelGuides": "Rejseguider",
    "home.card.travelGuidesText": "Udforsk destinationer før booking.",
    "home.why.curated": "Udvalgte rejser",
    "home.why.curatedText": "SKANDI kombinerer aktuelle rejsekomponenter med udvalgte destinationer, hoteller og lokale tjenester.",
    "home.why.secure": "Sikker booking",
    "home.why.secureText": "Pris og tilgængelighed kontrolleres igen før betaling.",
    "home.why.documents": "Dokumenter samlet ét sted",
    "home.why.documentsText": "Rejser, bestillinger og rejsedokumenter forbliver forbundet med Min profil.",
    "home.why.support": "Support hele vejen",
    "home.why.supportText": "Hjælp før, under og efter rejsen.",
    "home.trust.noSurprise": "Ingen overraskelser",
    "home.trust.noSurpriseText": "Endelig tilgængelighed bekræftes før betaling.",
    "home.trust.packageClarity": "Tydelige pakker",
    "home.trust.packageClarityText": "Fly, hotel og lokale tjenester vises samlet.",
    "home.trust.myProfile": "Min profil",
    "home.trust.myProfileText": "Rejser og dokumenter forbliver tilgængelige.",
    "home.trust.club": "SKANDI Club",
    "home.trust.clubText": "Point og medlemstilbud er forbundet.",
    "toast.newsletterThanks": "Tak for din tilmelding.",
    "toast.newsletterFailed": "Tilmelding til nyhedsbrevet mislykkedes."
  },
  "ES": {
    "nav.packages": "Paquetes de viaje",
    "nav.destinations": "Destinos",
    "nav.club": "Signature Club",
    "nav.info": "Información de viaje",
    "nav.search": "Buscar",
    "nav.clubBtn": "SKANDI Club",
    "nav.menu": "MENÚ",
    "nav.signIn": "Iniciar sesión",
    "settings.language": "Idioma",
    "settings.currency": "Moneda",
    "settings.apply": "Guardar configuración",
    "welcome.title": "Bienvenido a SKANDI",
    "welcome.copy": "Confirma tu idioma y moneda preferidos antes de continuar.",
    "welcome.btn": "Continuar al sitio web",
    "home.hero.kicker": "SKANDI TRAVELS",
    "home.hero.title": "Descubre tu próximo viaje",
    "home.hero.copy": "Busca vuelos, vacaciones, hoteles y paquetes en SKANDI Collection",
    "home.tabs.flights": "Vuelos",
    "home.tabs.holidays": "Vuelo + hotel",
    "home.tabs.hotels": "Hoteles",
    "home.tabs.signature": "SKANDI Collection",
    "home.fields.from": "Origen",
    "home.fields.to": "Destino",
    "home.fields.travelDates": "Fechas de viaje",
    "home.fields.adults": "Adultos",
    "home.fields.children": "Niños",
    "home.fields.infants": "Bebés",
    "home.fields.class": "Clase de viaje",
    "home.fields.stops": "Escalas",
    "home.fields.currency": "Moneda",
    "home.fields.departureAirport": "Aeropuerto de salida",
    "home.fields.destination": "Destino",
    "home.fields.departureDate": "Fecha de salida",
    "home.fields.lengthStay": "Duración de la estancia",
    "home.fields.rooms": "Habitaciones",
    "home.fields.checkIn": "Check-in",
    "home.fields.checkOut": "Check-out",
    "home.fields.signatureDestination": "Destino Signature",
    "home.fields.length": "Duración",
    "home.placeholders.airport": "Ciudad, aeropuerto, IATA o ICAO",
    "home.age.adults": "12+ años",
    "home.age.children": "2–11 años",
    "home.age.infants": "Menores de 2 años",
    "home.search.flights": "Buscar vuelos",
    "home.search.holidays": "Buscar vuelo + hotel",
    "home.search.hotels": "Buscar hoteles",
    "home.search.signature": "Buscar SKANDI Collection",
    "home.helpers.hotels": "Hoteles seleccionados",
    "home.helpers.transfers": "Traslados locales",
    "home.helpers.experiences": "Experiencias SKANDI",
    "home.results.kicker": "Resultados de búsqueda",
    "home.results.title": "Viajes disponibles",
    "home.results.copy": "Los resultados aparecerán aquí.",
    "home.results.edit": "Modificar búsqueda",
    "home.date.kicker": "Selecciona las fechas de viaje",
    "home.date.clear": "Limpiar",
    "home.date.apply": "Aplicar fechas",
    "home.sections.destinations.title": "Destinos populares",
    "home.sections.destinations.copy": "Las tarjetas de destino se obtienen del contenido de SKANDI y pueden mostrar precios mínimos actuales.",
    "home.sections.offers.title": "Las mejores ofertas",
    "home.sections.offers.copy": "Las promociones, la Signature Collection y las ofertas de temporada se gestionan desde el panel de contenido de SKANDI.",
    "home.sections.hotels.title": "Hoteles que merece la pena descubrir",
    "home.sections.hotels.copy": "Hoteles SKANDI seleccionados con precios actuales de Duffel Stays.",
    "home.sections.inspiration.title": "Inspiración para viajar",
    "home.sections.inspiration.copy": "Historias, guías e ideas seleccionadas por SKANDI. Aquí solo aparece inspiración publicada.",
    "home.card.liveStay": "Precio actual de Duffel",
    "home.card.sevenNights": "Estancia de 7 noches",
    "home.card.checkLive": "Consultar precio actual",
    "home.card.readMore": "Leer más",
    "home.sections.tripTypes.title": "¿Qué tipo de viaje buscas?",
    "home.sections.tripTypes.copy": "Accesos rápidos para ofertas de última hora, viajes familiares, urbanos, de playa y Signature Collection.",
    "home.sections.why": "Por qué viajar con SKANDI",
    "home.clubCta.title": "Únete a SKANDI Club para recibir ofertas e inspiración",
    "home.clubCta.copy": "Recibe ofertas para miembros, consejos de destinos y recordatorios vinculados a tus viajes.",
    "home.clubCta.button": "Únete a SKANDI Club",
    "footer.news.title": "Recibe ofertas de SKANDI e inspiración para viajar",
    "footer.news.desc": "Recibe guías de destinos, actualizaciones de Signature Collection y ofertas para miembros.",
    "footer.news.btn": "Registrarse",
    "footer.col1.title": "Reserva y viaja",
    "footer.col1.l1": "Gestionar mi reserva",
    "footer.col1.l2": "Reservar un viaje",
    "footer.col1.l3": "Signature Collection",
    "footer.col1.l4": "Destinos",
    "footer.col1.l5": "Hoteles",
    "footer.col1.l6": "Vuelos",
    "footer.col1.l7": "Excursiones y actividades",
    "footer.col1.l8": "Alquiler de coches",
    "footer.col1.l9": "Ofertas",
    "footer.col2.title": "Ayuda e información de viaje",
    "footer.col2.l1": "Antes de viajar",
    "footer.col2.l2": "Pasaporte y visados",
    "footer.col2.l3": "Equipaje",
    "footer.col2.l4": "Seguros",
    "footer.col2.l5": "Centro de ayuda",
    "footer.col2.l6": "Contacto",
    "footer.col2.l7": "Asistencia especial",
    "footer.col3.title": "SKANDI Club",
    "footer.col3.l1": "Únete a SKANDI Club",
    "footer.col3.l2": "Beneficios de membresía",
    "footer.col3.l3": "Mi estado del club",
    "footer.col3.l4": "Monedero de viaje y cupones",
    "footer.col4.title": "Acerca de",
    "footer.col4.l1": "Acerca de SKANDI Travels",
    "footer.col4.l2": "Sala de prensa",
    "footer.col4.l3": "Empleo",
    "footer.col4.l4": "Nuestra red",
    "footer.bottom.terms": "Los métodos de pago, las condiciones del proveedor y los términos de los paquetes de viaje pueden variar según el producto.",
    "footer.bottom.l1": "Información legal",
    "footer.bottom.l8": "Términos de uso",
    "footer.bottom.l2": "Accesibilidad",
    "footer.bottom.l3": "Aviso legal",
    "footer.bottom.l4": "Política de privacidad",
    "footer.bottom.l5": "Política de cookies",
    "footer.bottom.l6": "Condiciones de reserva",
    "footer.bottom.l7": "Acceso para empleados",
    "nav.myProfile": "Mi perfil",
    "nav.myTrips": "Mis viajes y reservas",
    "nav.clubRewards": "Ventajas y estado del club",
    "nav.travelWallet": "Monedero de viaje y cupones",
    "nav.helpClub": "Ayuda y soporte del club",
    "nav.helpCenter": "Centro de ayuda",
    "header.explore": "Explora SKANDI Travels",
    "header.member": "Miembro",
    "header.points": "puntos",
    "header.yourClub": "Tu SKANDI Club",
    "header.joinClub": "Únete a SKANDI Club",
    "header.hi": "Hola, {name}",
    "header.welcomeBack": "Bienvenido de nuevo",
    "header.signInMeta": "Inicia sesión para acceder a tus viajes, puntos y documentos de viaje.",
    "header.saveFavourites": "Guarda tus favoritos",
    "header.saveFavouritesCopy": "Inicia sesión para guardar destinos, ofertas y páginas en tu perfil.",
    "header.email": "Correo electrónico",
    "header.password": "Contraseña",
    "header.logIn": "Iniciar sesión",
    "header.logout": "Cerrar sesión",
    "home.option.economy": "Económica",
    "home.option.premiumEconomy": "Económica premium",
    "home.option.business": "Business",
    "home.option.first": "Primera clase",
    "home.option.anyStops": "Cualquier número de escalas",
    "home.option.nonstopOnly": "Solo vuelos directos",
    "home.option.week1": "1 semana",
    "home.option.nights10": "10 noches",
    "home.option.weeks2": "2 semanas",
    "home.option.weeks3": "3 semanas",
    "home.option.nights7": "7 noches",
    "home.option.nights14": "14 noches",
    "home.loading.departureAirports": "Cargando aeropuertos de salida...",
    "home.loading.destinations": "Cargando destinos...",
    "home.loading.airports": "Cargando aeropuertos...",
    "home.select.departureAirport": "Selecciona el aeropuerto de salida",
    "home.select.destination": "Selecciona el destino",
    "home.placeholders.hotelDestination": "Ciudad, región o nombre del hotel",
    "footer.news.placeholder": "Correo electrónico",
    "footer.bottom.rights": "Todos los derechos reservados.",
    "home.age.childLabel": "Edad del niño {n}",
    "home.age.infantLabel": "Edad del bebé {n}",
    "home.age.underOne": "Menor de 1 año",
    "home.date.oneWay": "Solo ida si seleccionas ahora",
    "home.status.selectDepartureDate": "Selecciona una fecha de salida.",
    "home.status.selectRoute": "Selecciona el origen y el destino de las sugerencias.",
    "home.status.selectPackageRoute": "Selecciona el aeropuerto de salida y el destino.",
    "home.status.enterHotelDestination": "Introduce un destino para el hotel.",
    "home.status.searching": "Buscando disponibilidad en vivo y paquetes SKANDI...",
    "home.status.noResults": "No se encontraron resultados. Prueba otra fecha o destino.",
    "home.status.offerSaved": "Oferta guardada. Continuando...",
    "home.status.searchFailed": "La búsqueda ha fallado.",
    "home.status.foundOne": "Se encontró 1 resultado.",
    "home.status.foundMany": "Se encontraron {count} resultados.",
    "home.result.livePrice": "Precio en vivo",
    "home.result.travelOffer": "Oferta de viaje",
    "home.result.summaryFallback": "El precio final y la disponibilidad se confirman antes del pago.",
    "home.result.type": "Tipo",
    "home.result.source": "Fuente",
    "home.result.check": "Comprobación",
    "home.result.revalidated": "Se vuelve a validar antes del pago",
    "home.result.select": "Seleccionar",
    "home.result.travel": "Viaje",
    "home.summary.adult": "adulto",
    "home.summary.adults": "adultos",
    "home.summary.child": "niño",
    "home.summary.children": "niños",
    "home.title.hotelsIn": "Hoteles en {destination}",
    "home.title.holidayPackages": "Paquetes vacacionales",
    "home.card.from": "Desde",
    "home.card.offer": "Oferta",
    "home.card.destination": "Destino",
    "home.card.explore": "Explora opciones de viaje seleccionadas por SKANDI.",
    "home.card.limited": "Disponibilidad limitada. El precio final se confirma antes del pago.",
    "home.card.lastMinute": "Última hora",
    "home.card.lastMinuteText": "Encuentra viajes con salida próxima.",
    "home.card.flightHotel": "Vuelo + hotel",
    "home.card.flightHotelText": "Combina vuelos en vivo con hoteles.",
    "home.card.onlyFlights": "Solo vuelos",
    "home.card.onlyFlightsText": "Busca ofertas de vuelos en vivo.",
    "home.card.onlyHotels": "Solo hoteles",
    "home.card.onlyHotelsText": "Explora estancias y detalles de hoteles.",
    "home.card.signatureCollection": "Signature Collection",
    "home.card.signatureCollectionText": "Paquetes SKANDI seleccionados.",
    "home.card.travelGuides": "Guías de viaje",
    "home.card.travelGuidesText": "Explora destinos antes de reservar.",
    "home.why.curated": "Viajes seleccionados",
    "home.why.curatedText": "SKANDI combina componentes de viaje en vivo con destinos, hoteles y servicios locales seleccionados.",
    "home.why.secure": "Reserva segura",
    "home.why.secureText": "El precio y la disponibilidad se vuelven a validar antes del pago.",
    "home.why.documents": "Documentos en un solo lugar",
    "home.why.documentsText": "Los viajes, pedidos y documentos permanecen conectados a Mi perfil.",
    "home.why.support": "Asistencia durante todo el viaje",
    "home.why.supportText": "Ayuda antes, durante y después del viaje.",
    "home.trust.noSurprise": "Sin sorpresas",
    "home.trust.noSurpriseText": "La disponibilidad final se confirma antes del pago.",
    "home.trust.packageClarity": "Paquetes claros",
    "home.trust.packageClarityText": "El vuelo, el hotel y los servicios locales se muestran juntos.",
    "home.trust.myProfile": "Mi perfil",
    "home.trust.myProfileText": "Los viajes y documentos siguen disponibles.",
    "home.trust.club": "SKANDI Club",
    "home.trust.clubText": "Los puntos y las ofertas para miembros están conectados.",
    "toast.newsletterThanks": "Gracias por suscribirte.",
    "toast.newsletterFailed": "No se pudo completar la suscripción al boletín."
  },
  "FI": {
    "nav.packages": "Pakettimatkat",
    "nav.destinations": "Kohteet",
    "nav.club": "Signature Club",
    "nav.info": "Matkatiedot",
    "nav.search": "Hae",
    "nav.clubBtn": "SKANDI Club",
    "nav.menu": "VALIKKO",
    "nav.signIn": "Kirjaudu sisään",
    "settings.language": "Kieli",
    "settings.currency": "Valuutta",
    "settings.apply": "Tallenna asetukset",
    "welcome.title": "Tervetuloa SKANDIin",
    "welcome.copy": "Vahvista haluamasi kieli ja valuutta ennen jatkamista.",
    "welcome.btn": "Jatka sivustolle",
    "home.hero.kicker": "SKANDI TRAVELS",
    "home.hero.title": "Löydä seuraava matkasi",
    "home.hero.copy": "Etsi lentoja, lomamatkoja, hotelleja ja SKANDI Collection -paketteja",
    "home.tabs.flights": "Lennot",
    "home.tabs.holidays": "Lento + hotelli",
    "home.tabs.hotels": "Hotellit",
    "home.tabs.signature": "SKANDI Collection",
    "home.fields.from": "Mistä",
    "home.fields.to": "Minne",
    "home.fields.travelDates": "Matkapäivät",
    "home.fields.adults": "Aikuiset",
    "home.fields.children": "Lapset",
    "home.fields.infants": "Vauvat",
    "home.fields.class": "Matkustusluokka",
    "home.fields.stops": "Välilaskut",
    "home.fields.currency": "Valuutta",
    "home.fields.departureAirport": "Lähtölentoasema",
    "home.fields.destination": "Kohde",
    "home.fields.departureDate": "Lähtöpäivä",
    "home.fields.lengthStay": "Matkan pituus",
    "home.fields.rooms": "Huoneet",
    "home.fields.checkIn": "Sisäänkirjautuminen",
    "home.fields.checkOut": "Uloskirjautuminen",
    "home.fields.signatureDestination": "Signature-kohde",
    "home.fields.length": "Kesto",
    "home.placeholders.airport": "Kaupunki, lentoasema, IATA tai ICAO",
    "home.age.adults": "12+ vuotta",
    "home.age.children": "2–11 vuotta",
    "home.age.infants": "Alle 2 vuotta",
    "home.search.flights": "Hae lentoja",
    "home.search.holidays": "Hae lento + hotelli",
    "home.search.hotels": "Hae hotelleja",
    "home.search.signature": "Hae SKANDI Collectionista",
    "home.helpers.hotels": "Valikoidut hotellit",
    "home.helpers.transfers": "Paikalliset kuljetukset",
    "home.helpers.experiences": "SKANDI-elämykset",
    "home.results.kicker": "Hakutulokset",
    "home.results.title": "Saatavilla olevat matkat",
    "home.results.copy": "Tulokset näkyvät tässä.",
    "home.results.edit": "Muokkaa hakua",
    "home.date.kicker": "Valitse matkapäivät",
    "home.date.clear": "Tyhjennä",
    "home.date.apply": "Käytä päivämääriä",
    "home.sections.destinations.title": "Suositut kohteet",
    "home.sections.destinations.copy": "Kohdekortit ladataan SKANDIn matkasisällöstä ja voivat näyttää ajantasaiset alkaen-hinnat.",
    "home.sections.offers.title": "Parhaat tarjoukset",
    "home.sections.offers.copy": "Kampanjat, Signature Collection ja kausitarjoukset hallitaan SKANDIn sisältötiedoista.",
    "home.sections.hotels.title": "Tutustumisen arvoisia hotelleja",
    "home.sections.hotels.copy": "SKANDIn valitsemat hotellit ajantasaisilla Duffel Stays -hinnoilla.",
    "home.sections.inspiration.title": "Matkainspiraatiota",
    "home.sections.inspiration.copy": "SKANDIn valitsemia tarinoita, oppaita ja ideoita. Vain julkaistu inspiraatio näkyy täällä.",
    "home.card.liveStay": "Ajantasainen Duffel-hinta",
    "home.card.sevenNights": "7 yön majoitus",
    "home.card.checkLive": "Tarkista ajantasainen hinta",
    "home.card.readMore": "Lue lisää",
    "home.sections.tripTypes.title": "Millaista matkaa etsit?",
    "home.sections.tripTypes.copy": "Nopeat valinnat äkkilähdöille, perhematkoille, kaupunkilomille, rantalomille ja Signature Collectioniin.",
    "home.sections.why": "Miksi matkustaa SKANDIn kanssa",
    "home.clubCta.title": "Liity SKANDI Clubiin ja saat tarjouksia sekä matkainspiraatiota",
    "home.clubCta.copy": "Saat jäsentarjouksia, kohdevinkkejä ja matkoihisi liittyviä muistutuksia.",
    "home.clubCta.button": "Liity SKANDI Clubiin",
    "footer.news.title": "Saat SKANDI-tarjouksia ja matkainspiraatiota",
    "footer.news.desc": "Tilaa kohdeoppaita, Signature Collection -uutisia ja jäsentarjouksia.",
    "footer.news.btn": "Tilaa",
    "footer.col1.title": "Varaa & matkusta",
    "footer.col1.l1": "Hallitse varaustasi",
    "footer.col1.l2": "Varaa matka",
    "footer.col1.l3": "Signature Collection",
    "footer.col1.l4": "Kohteet",
    "footer.col1.l5": "Hotellit",
    "footer.col1.l6": "Lennot",
    "footer.col1.l7": "Retket & aktiviteetit",
    "footer.col1.l8": "Autonvuokraus",
    "footer.col1.l9": "Tarjoukset",
    "footer.col2.title": "Apua & matkatiedot",
    "footer.col2.l1": "Ennen matkaa",
    "footer.col2.l2": "Passi & viisumi",
    "footer.col2.l3": "Matkatavarat",
    "footer.col2.l4": "Vakuutus",
    "footer.col2.l5": "Ohjekeskus",
    "footer.col2.l6": "Ota yhteyttä",
    "footer.col2.l7": "Erityisapu",
    "footer.col3.title": "SKANDI Club",
    "footer.col3.l1": "Liity SKANDI Clubiin",
    "footer.col3.l2": "Jäsenedut",
    "footer.col3.l3": "Klubitilani",
    "footer.col3.l4": "Matkalompakko & lahjakortit",
    "footer.col4.title": "Tietoa",
    "footer.col4.l1": "Tietoa SKANDI Travelsista",
    "footer.col4.l2": "Uutishuone",
    "footer.col4.l3": "Urat",
    "footer.col4.l4": "Verkostomme",
    "footer.bottom.terms": "Maksutavat, toimittajien ehdot ja pakettimatkaehdot voivat vaihdella tuotteittain.",
    "footer.bottom.l1": "Oikeudelliset tiedot",
    "footer.bottom.l8": "Käyttöehdot",
    "footer.bottom.l2": "Saavutettavuus",
    "footer.bottom.l3": "Verkkosivuston vastuuvapauslauseke",
    "footer.bottom.l4": "Tietosuojakäytäntö",
    "footer.bottom.l5": "Evästekäytäntö",
    "footer.bottom.l6": "Varausehdot",
    "footer.bottom.l7": "Henkilökunnan kirjautuminen",
    "nav.myProfile": "Oma profiili",
    "nav.myTrips": "Matkani ja varaukseni",
    "nav.clubRewards": "Klubiedut ja taso",
    "nav.travelWallet": "Matkalompakko ja kupongit",
    "nav.helpClub": "Ohje ja klubituki",
    "nav.helpCenter": "Ohjekeskus",
    "header.explore": "Tutustu SKANDI Travelsiin",
    "header.member": "Jäsen",
    "header.points": "pistettä",
    "header.yourClub": "SKANDI Clubisi",
    "header.joinClub": "Liity SKANDI Clubiin",
    "header.hi": "Hei, {name}",
    "header.welcomeBack": "Tervetuloa takaisin",
    "header.signInMeta": "Kirjaudu sisään nähdäksesi matkasi, pisteesi ja matkustusasiakirjasi.",
    "header.saveFavourites": "Tallenna suosikkisi",
    "header.saveFavouritesCopy": "Kirjaudu sisään tallentaaksesi kohteet, tarjoukset ja sivut profiiliisi.",
    "header.email": "Sähköpostiosoite",
    "header.password": "Salasana",
    "header.logIn": "Kirjaudu sisään",
    "header.logout": "Kirjaudu ulos",
    "home.option.economy": "Economy",
    "home.option.premiumEconomy": "Premium Economy",
    "home.option.business": "Business",
    "home.option.first": "First",
    "home.option.anyStops": "Kaikki välilaskut",
    "home.option.nonstopOnly": "Vain suorat lennot",
    "home.option.week1": "1 viikko",
    "home.option.nights10": "10 yötä",
    "home.option.weeks2": "2 viikkoa",
    "home.option.weeks3": "3 viikkoa",
    "home.option.nights7": "7 yötä",
    "home.option.nights14": "14 yötä",
    "home.loading.departureAirports": "Ladataan lähtölentoasemia...",
    "home.loading.destinations": "Ladataan kohteita...",
    "home.loading.airports": "Ladataan lentoasemia...",
    "home.select.departureAirport": "Valitse lähtölentoasema",
    "home.select.destination": "Valitse kohde",
    "home.placeholders.hotelDestination": "Kaupunki, alue tai hotellin nimi",
    "footer.news.placeholder": "Sähköpostiosoite",
    "footer.bottom.rights": "Kaikki oikeudet pidätetään.",
    "home.age.childLabel": "Lapsen {n} ikä",
    "home.age.infantLabel": "Vauvan {n} ikä",
    "home.age.underOne": "Alle 1-vuotias",
    "home.date.oneWay": "Yhdensuuntainen, jos valitset nyt",
    "home.status.selectDepartureDate": "Valitse lähtöpäivä.",
    "home.status.selectRoute": "Valitse lähtöpaikka ja kohde ehdotuksista.",
    "home.status.selectPackageRoute": "Valitse lähtölentoasema ja kohde.",
    "home.status.enterHotelDestination": "Anna hotellin kohde.",
    "home.status.searching": "Haetaan ajantasaista saatavuutta ja SKANDI-paketteja...",
    "home.status.noResults": "Tuloksia ei löytynyt. Kokeile toista päivää tai kohdetta.",
    "home.status.offerSaved": "Tarjous tallennettu. Jatketaan...",
    "home.status.searchFailed": "Haku epäonnistui.",
    "home.status.foundOne": "Löytyi 1 tulos.",
    "home.status.foundMany": "Löytyi {count} tulosta.",
    "home.result.livePrice": "Ajantasainen hinta",
    "home.result.travelOffer": "Matkatarjous",
    "home.result.summaryFallback": "Lopullinen hinta ja saatavuus vahvistetaan ennen maksua.",
    "home.result.type": "Tyyppi",
    "home.result.source": "Lähde",
    "home.result.check": "Tarkistus",
    "home.result.revalidated": "Tarkistetaan uudelleen ennen maksua",
    "home.result.select": "Valitse",
    "home.result.travel": "Matka",
    "home.summary.adult": "aikuinen",
    "home.summary.adults": "aikuista",
    "home.summary.child": "lapsi",
    "home.summary.children": "lasta",
    "home.title.hotelsIn": "Hotellit kohteessa {destination}",
    "home.title.holidayPackages": "Lomapakettimatkat",
    "home.card.from": "Alkaen",
    "home.card.offer": "Tarjous",
    "home.card.destination": "Kohde",
    "home.card.explore": "Tutustu SKANDIn valikoituihin matkavaihtoehtoihin.",
    "home.card.limited": "Rajoitettu saatavuus. Lopullinen hinta vahvistetaan ennen maksua.",
    "home.card.lastMinute": "Äkkilähtö",
    "home.card.lastMinuteText": "Löydä pian lähteviä matkoja.",
    "home.card.flightHotel": "Lento + hotelli",
    "home.card.flightHotelText": "Yhdistä ajantasaiset lennot hotelliin.",
    "home.card.onlyFlights": "Vain lennot",
    "home.card.onlyFlightsText": "Hae ajantasaisia lentotarjouksia.",
    "home.card.onlyHotels": "Vain hotellit",
    "home.card.onlyHotelsText": "Tutustu hotellimajoituksiin ja tietoihin.",
    "home.card.signatureCollection": "Signature Collection",
    "home.card.signatureCollectionText": "Valikoidut SKANDI-paketit.",
    "home.card.travelGuides": "Matkaoppaat",
    "home.card.travelGuidesText": "Tutustu kohteisiin ennen varaamista.",
    "home.why.curated": "Valikoidut matkat",
    "home.why.curatedText": "SKANDI yhdistää ajantasaiset matkakomponentit valittuihin kohteisiin, hotelleihin ja paikallisiin palveluihin.",
    "home.why.secure": "Turvallinen varaus",
    "home.why.secureText": "Hinta ja saatavuus tarkistetaan uudelleen ennen maksua.",
    "home.why.documents": "Asiakirjat yhdessä paikassa",
    "home.why.documentsText": "Matkat, tilaukset ja matkustusasiakirjat pysyvät yhteydessä Oma profiili -sivuun.",
    "home.why.support": "Tukea koko matkan ajan",
    "home.why.supportText": "Apua ennen matkaa, matkan aikana ja sen jälkeen.",
    "home.trust.noSurprise": "Ei yllätyksiä",
    "home.trust.noSurpriseText": "Lopullinen saatavuus vahvistetaan ennen maksua.",
    "home.trust.packageClarity": "Selkeät paketit",
    "home.trust.packageClarityText": "Lento, hotelli ja paikalliset palvelut näytetään yhdessä.",
    "home.trust.myProfile": "Oma profiili",
    "home.trust.myProfileText": "Matkat ja asiakirjat pysyvät saatavilla.",
    "home.trust.club": "SKANDI Club",
    "home.trust.clubText": "Pisteet ja jäsentarjoukset ovat yhteydessä toisiinsa.",
    "toast.newsletterThanks": "Kiitos tilauksestasi.",
    "toast.newsletterFailed": "Uutiskirjeen tilaus epäonnistui."
  },
  "FR-FR": {
    "nav.packages": "Voyages organisés",
    "nav.destinations": "Destinations",
    "nav.club": "Signature Club",
    "nav.info": "Infos voyage",
    "nav.search": "Rechercher",
    "nav.clubBtn": "SKANDI Club",
    "nav.menu": "MENU",
    "nav.signIn": "Se connecter",
    "settings.language": "Langue",
    "settings.currency": "Devise",
    "settings.apply": "Enregistrer les paramètres",
    "welcome.title": "Bienvenue chez SKANDI",
    "welcome.copy": "Veuillez confirmer votre langue et votre devise préférées avant de continuer.",
    "welcome.btn": "Accéder au site web",
    "home.hero.kicker": "SKANDI TRAVELS",
    "home.hero.title": "Découvrez votre prochain voyage",
    "home.hero.copy": "Recherchez des vols, séjours, hôtels et formules de la SKANDI Collection",
    "home.tabs.flights": "Vols",
    "home.tabs.holidays": "Vol + hôtel",
    "home.tabs.hotels": "Hôtels",
    "home.tabs.signature": "SKANDI Collection",
    "home.fields.from": "De",
    "home.fields.to": "À",
    "home.fields.travelDates": "Dates de voyage",
    "home.fields.adults": "Adultes",
    "home.fields.children": "Enfants",
    "home.fields.infants": "Bébés",
    "home.fields.class": "Classe de voyage",
    "home.fields.stops": "Escales",
    "home.fields.currency": "Devise",
    "home.fields.departureAirport": "Aéroport de départ",
    "home.fields.destination": "Destination",
    "home.fields.departureDate": "Date de départ",
    "home.fields.lengthStay": "Durée du séjour",
    "home.fields.rooms": "Chambres",
    "home.fields.checkIn": "Arrivée",
    "home.fields.checkOut": "Départ",
    "home.fields.signatureDestination": "Destination Signature",
    "home.fields.length": "Durée",
    "home.placeholders.airport": "Ville, aéroport, code IATA ou ICAO",
    "home.age.adults": "12+ ans",
    "home.age.children": "2–11 ans",
    "home.age.infants": "Moins de 2 ans",
    "home.search.flights": "Rechercher des vols",
    "home.search.holidays": "Rechercher vol + hôtel",
    "home.search.hotels": "Rechercher des hôtels",
    "home.search.signature": "Rechercher dans SKANDI Collection",
    "home.helpers.hotels": "Hôtels sélectionnés",
    "home.helpers.transfers": "Transferts locaux",
    "home.helpers.experiences": "Expériences SKANDI",
    "home.results.kicker": "Résultats de recherche",
    "home.results.title": "Voyages disponibles",
    "home.results.copy": "Les résultats s'afficheront ici.",
    "home.results.edit": "Modifier la recherche",
    "home.date.kicker": "Sélectionnez les dates de voyage",
    "home.date.clear": "Effacer",
    "home.date.apply": "Valider les dates",
    "home.sections.destinations.title": "Destinations populaires",
    "home.sections.destinations.copy": "Les fiches de destination proviennent du contenu éditorial SKANDI et peuvent indiquer des tarifs à partir de.",
    "home.sections.offers.title": "Meilleures offres",
    "home.sections.offers.copy": "Les promotions, la Signature Collection et les offres saisonnières sont gérées depuis le gestionnaire de contenu SKANDI.",
    "home.sections.hotels.title": "Des hôtels à découvrir",
    "home.sections.hotels.copy": "Des hôtels SKANDI sélectionnés avec des prix actuels via Duffel Stays.",
    "home.sections.inspiration.title": "Inspiration voyage",
    "home.sections.inspiration.copy": "Histoires, guides et idées sélectionnés par SKANDI. Seuls les contenus publiés apparaissent ici.",
    "home.card.liveStay": "Prix Duffel actuel",
    "home.card.sevenNights": "Séjour de 7 nuits",
    "home.card.checkLive": "Voir le prix actuel",
    "home.card.readMore": "En savoir plus",
    "home.sections.hotels.title": "Des hôtels à découvrir",
    "home.sections.hotels.copy": "Des hôtels SKANDI sélectionnés avec des prix actuels via Duffel Stays.",
    "home.sections.inspiration.title": "Inspiration voyage",
    "home.sections.inspiration.copy": "Histoires, guides et idées sélectionnés par SKANDI. Seuls les contenus publiés apparaissent ici.",
    "home.card.liveStay": "Prix Duffel actuel",
    "home.card.sevenNights": "Séjour de 7 nuits",
    "home.card.checkLive": "Voir le prix actuel",
    "home.card.readMore": "En savoir plus",
    "home.sections.tripTypes.title": "Quel type de voyage recherchez-vous ?",
    "home.sections.tripTypes.copy": "Accès rapides pour les offres de dernière minute, les vacances en famille, les séjours urbains, balnéaires et la Signature Collection.",
    "home.sections.why": "Pourquoi voyager avec SKANDI",
    "home.clubCta.title": "Rejoignez le SKANDI Club pour faire le plein d'offres et d'inspiration",
    "home.clubCta.copy": "Profitez d'offres privilèges, de conseils personnalisés et d'alertes concernant vos prochains voyages.",
    "home.clubCta.button": "Rejoindre le SKANDI Club",
    "footer.news.title": "Recevez les offres SKANDI et de l'inspiration pour voyager",
    "footer.news.desc": "Recevez des guides de voyage, les actualités de la Signature Collection et des offres membres.",
    "footer.news.btn": "S'inscrire",
    "footer.col1.title": "Réserver & Voyager",
    "footer.col1.l1": "Gérer ma réservation",
    "footer.col1.l2": "Réserver un voyage",
    "footer.col1.l3": "Signature Collection",
    "footer.col1.l4": "Destinations",
    "footer.col1.l5": "Hôtels",
    "footer.col1.l6": "Vols",
    "footer.col1.l7": "Excursions & Activités",
    "footer.col1.l8": "Location de voitures",
    "footer.col1.l9": "Offres",
    "footer.col2.title": "Aide & Infos voyage",
    "footer.col2.l1": "Avant de partir",
    "footer.col2.l2": "Passeport & visas",
    "footer.col2.l3": "Bagages",
    "footer.col2.l4": "Assurances",
    "footer.col2.l5": "Centre d'aide",
    "footer.col2.l6": "Nous contacter",
    "footer.col2.l7": "Assistance spéciale",
    "footer.col3.title": "SKANDI Club",
    "footer.col3.l1": "Rejoindre le SKANDI Club",
    "footer.col3.l2": "Avantages membres",
    "footer.col3.l3": "Mon statut club",
    "footer.col3.l4": "Portefeuille de voyage & bons",
    "footer.col4.title": "À propos",
    "footer.col4.l1": "À propos de SKANDI Travels",
    "footer.col4.l2": "Espace presse",
    "footer.col4.l3": "Carrières",
    "footer.col4.l4": "Notre réseau",
    "footer.bottom.terms": "Les modes de paiement, les conditions des fournisseurs et les conditions des forfaits de voyage peuvent varier selon le produit.",
    "footer.bottom.l1": "Mentions légales",
    "footer.bottom.l8": "Conditions d'utilisation",
    "footer.bottom.l2": "Accessibilité",
    "footer.bottom.l3": "Avis de non-responsabilité",
    "footer.bottom.l4": "Politique de confidentialité",
    "footer.bottom.l5": "Politique de cookies",
    "footer.bottom.l6": "Conditions de réservation",
    "footer.bottom.l7": "Espace employés",
    "nav.myProfile": "Mon profil",
    "nav.myTrips": "Mes voyages et réservations",
    "nav.clubRewards": "Avantages et statut du club",
    "nav.travelWallet": "Portefeuille de voyage et bons",
    "nav.helpClub": "Aide et support du club",
    "nav.helpCenter": "Centre d’aide",
    "header.explore": "Découvrez SKANDI Travels",
    "header.member": "Membre",
    "header.points": "points",
    "header.yourClub": "Votre SKANDI Club",
    "header.joinClub": "Rejoindre le SKANDI Club",
    "header.hi": "Bonjour, {name}",
    "header.welcomeBack": "Bon retour",
    "header.signInMeta": "Connectez-vous pour accéder à vos voyages, points et documents de voyage.",
    "header.saveFavourites": "Enregistrez vos favoris",
    "header.saveFavouritesCopy": "Connectez-vous pour enregistrer des destinations, offres et pages dans votre profil.",
    "header.email": "Adresse e-mail",
    "header.password": "Mot de passe",
    "header.logIn": "Se connecter",
    "header.logout": "Se déconnecter",
    "home.option.economy": "Économique",
    "home.option.premiumEconomy": "Économique Premium",
    "home.option.business": "Affaires",
    "home.option.first": "Première",
    "home.option.anyStops": "Toutes les escales",
    "home.option.nonstopOnly": "Vols directs uniquement",
    "home.option.week1": "1 semaine",
    "home.option.nights10": "10 nuits",
    "home.option.weeks2": "2 semaines",
    "home.option.weeks3": "3 semaines",
    "home.option.nights7": "7 nuits",
    "home.option.nights14": "14 nuits",
    "home.loading.departureAirports": "Chargement des aéroports de départ...",
    "home.loading.destinations": "Chargement des destinations...",
    "home.loading.airports": "Chargement des aéroports...",
    "home.select.departureAirport": "Sélectionnez l’aéroport de départ",
    "home.select.destination": "Sélectionnez la destination",
    "home.placeholders.hotelDestination": "Ville, région ou nom de l’hôtel",
    "footer.news.placeholder": "Adresse e-mail",
    "footer.bottom.rights": "Tous droits réservés.",
    "home.age.childLabel": "Âge de l’enfant {n}",
    "home.age.infantLabel": "Âge du bébé {n}",
    "home.age.underOne": "Moins de 1 an",
    "home.date.oneWay": "Aller simple si vous sélectionnez maintenant",
    "home.status.selectDepartureDate": "Sélectionnez une date de départ.",
    "home.status.selectRoute": "Sélectionnez l’origine et la destination dans les suggestions.",
    "home.status.selectPackageRoute": "Sélectionnez l’aéroport de départ et la destination.",
    "home.status.enterHotelDestination": "Saisissez une destination d’hôtel.",
    "home.status.searching": "Recherche des disponibilités en direct et des forfaits SKANDI...",
    "home.status.noResults": "Aucun résultat. Essayez une autre date ou destination.",
    "home.status.offerSaved": "Offre enregistrée. Poursuite...",
    "home.status.searchFailed": "La recherche a échoué.",
    "home.status.foundOne": "1 résultat trouvé.",
    "home.status.foundMany": "{count} résultats trouvés.",
    "home.result.livePrice": "Prix en direct",
    "home.result.travelOffer": "Offre de voyage",
    "home.result.summaryFallback": "Le prix final et la disponibilité sont confirmés avant le paiement.",
    "home.result.type": "Type",
    "home.result.source": "Source",
    "home.result.check": "Contrôle",
    "home.result.revalidated": "Revérifié avant le paiement",
    "home.result.select": "Sélectionner",
    "home.result.travel": "Voyage",
    "home.summary.adult": "adulte",
    "home.summary.adults": "adultes",
    "home.summary.child": "enfant",
    "home.summary.children": "enfants",
    "home.title.hotelsIn": "Hôtels à {destination}",
    "home.title.holidayPackages": "Forfaits vacances",
    "home.card.from": "À partir de",
    "home.card.offer": "Offre",
    "home.card.destination": "Destination",
    "home.card.explore": "Découvrez des voyages sélectionnés par SKANDI.",
    "home.card.limited": "Disponibilité limitée. Prix final confirmé avant le paiement.",
    "home.card.lastMinute": "Dernière minute",
    "home.card.lastMinuteText": "Trouvez des voyages avec un départ prochain.",
    "home.card.flightHotel": "Vol + hôtel",
    "home.card.flightHotelText": "Combinez des vols en direct avec un hôtel.",
    "home.card.onlyFlights": "Vols uniquement",
    "home.card.onlyFlightsText": "Recherchez des offres de vols en direct.",
    "home.card.onlyHotels": "Hôtels uniquement",
    "home.card.onlyHotelsText": "Découvrez des séjours et leurs détails.",
    "home.card.signatureCollection": "Signature Collection",
    "home.card.signatureCollectionText": "Forfaits SKANDI sélectionnés.",
    "home.card.travelGuides": "Guides de voyage",
    "home.card.travelGuidesText": "Découvrez les destinations avant de réserver.",
    "home.why.curated": "Voyages sélectionnés",
    "home.why.curatedText": "SKANDI associe des composants de voyage en direct à des destinations, hôtels et services locaux sélectionnés.",
    "home.why.secure": "Réservation sécurisée",
    "home.why.secureText": "Le prix et la disponibilité sont revérifiés avant le paiement.",
    "home.why.documents": "Documents au même endroit",
    "home.why.documentsText": "Les voyages, commandes et documents restent liés à Mon profil.",
    "home.why.support": "Assistance tout au long du voyage",
    "home.why.supportText": "De l’aide avant, pendant et après votre voyage.",
    "home.trust.noSurprise": "Aucune surprise",
    "home.trust.noSurpriseText": "La disponibilité finale est confirmée avant le paiement.",
    "home.trust.packageClarity": "Forfaits transparents",
    "home.trust.packageClarityText": "Le vol, l’hôtel et les services locaux sont présentés ensemble.",
    "home.trust.myProfile": "Mon profil",
    "home.trust.myProfileText": "Vos voyages et documents restent accessibles.",
    "home.trust.club": "SKANDI Club",
    "home.trust.clubText": "Les points et les offres membres sont connectés.",
    "toast.newsletterThanks": "Merci pour votre inscription.",
    "toast.newsletterFailed": "L’inscription à l’infolettre a échoué."
  },
  "FR-CA": {
    "nav.packages": "Forfaits Vacances",
    "nav.destinations": "Destinations",
    "nav.club": "Signature Club",
    "nav.info": "Infos voyage",
    "nav.search": "Rechercher",
    "nav.clubBtn": "SKANDI Club",
    "nav.menu": "MENU",
    "nav.signIn": "Se connecter",
    "settings.language": "Langue",
    "settings.currency": "Devise",
    "settings.apply": "Enregistrer les paramètres",
    "welcome.title": "Bienvenue chez SKANDI",
    "welcome.copy": "Veuillez confirmer votre langue et votre devise préférées avant de continuer.",
    "welcome.btn": "Accéder au site web",
    "home.hero.kicker": "SKANDI TRAVELS",
    "home.hero.title": "Découvrez votre prochain voyage",
    "home.hero.copy": "Recherchez des vols, des vacances, des hôtels et des forfaits de la SKANDI Collection",
    "home.tabs.flights": "Vols",
    "home.tabs.holidays": "Vol + hôtel",
    "home.tabs.hotels": "Hôtels",
    "home.tabs.signature": "SKANDI Collection",
    "home.fields.from": "De",
    "home.fields.to": "À",
    "home.fields.travelDates": "Dates de voyage",
    "home.fields.adults": "Adultes",
    "home.fields.children": "Enfants",
    "home.fields.infants": "Bébés",
    "home.fields.class": "Classe de voyage",
    "home.fields.stops": "Escales",
    "home.fields.currency": "Devise",
    "home.fields.departureAirport": "Aéroport de départ",
    "home.fields.destination": "Destination",
    "home.fields.departureDate": "Date de départ",
    "home.fields.lengthStay": "Durée du séjour",
    "home.fields.rooms": "Chambres",
    "home.fields.checkIn": "Arrivée",
    "home.fields.checkOut": "Départ",
    "home.fields.signatureDestination": "Destination Signature",
    "home.fields.length": "Durée",
    "home.placeholders.airport": "Ville, aéroport, code IATA ou ICAO",
    "home.age.adults": "12 ans et +",
    "home.age.children": "2–11 ans",
    "home.age.infants": "Moins de 2 ans",
    "home.search.flights": "Rechercher des vols",
    "home.search.holidays": "Rechercher vol + hôtel",
    "home.search.hotels": "Rechercher des hôtels",
    "home.search.signature": "Rechercher dans SKANDI Collection",
    "home.helpers.hotels": "Hôtels sélectionnés",
    "home.helpers.transfers": "Transferts locaux",
    "home.helpers.experiences": "Expériences SKANDI",
    "home.results.kicker": "Résultats de recherche",
    "home.results.title": "Voyages disponibles",
    "home.results.copy": "Les résultats s'afficheront ici.",
    "home.results.edit": "Modifier la recherche",
    "home.date.kicker": "Sélectionnez les dates de voyage",
    "home.date.clear": "Effacer",
    "home.date.apply": "Valider les dates",
    "home.sections.destinations.title": "Destinations populaires",
    "home.sections.destinations.copy": "Les fiches de destination proviennent du contenu éditorial SKANDI et peuvent indiquer des tarifs « à partir de ».",
    "home.sections.offers.title": "Meilleures offres",
    "home.sections.offers.copy": "Les promotions, la Signature Collection et les offres saisonnières sont gérées depuis le gestionnaire de contenu SKANDI.",
    "home.sections.tripTypes.title": "Quel type de voyage recherchez-vous ?",
    "home.sections.tripTypes.copy": "Accès rapides pour les offres de dernière minute, les vacances en famille, les séjours urbains, balnéaires et la Signature Collection.",
    "home.sections.why": "Varquoi voyager avec SKANDI",
    "home.clubCta.title": "Rejoignez le SKANDI Club pour faire le plein d'offres et d'inspiration",
    "home.clubCta.copy": "Profitez d'offres privilèges, de conseils personnalisés et d'alertes concernant vos prochains voyages.",
    "home.clubCta.button": "Rejoindre le SKANDI Club",
    "footer.news.title": "Recevez les offres SKANDI et de l'inspiration pour voyager",
    "footer.news.desc": "Recevez des guides de voyage, les actualités de la Signature Collection et des offres membres.",
    "footer.news.btn": "S'inscrire",
    "footer.col1.title": "Réserver & Voyager",
    "footer.col1.l1": "Gérer ma réservation",
    "footer.col1.l2": "Réserver un voyage",
    "footer.col1.l3": "Signature Collection",
    "footer.col1.l4": "Destinations",
    "footer.col1.l5": "Hôtels",
    "footer.col1.l6": "Vols",
    "footer.col1.l7": "Excursions & Activités",
    "footer.col1.l8": "Location de voitures",
    "footer.col1.l9": "Offres",
    "footer.col2.title": "Aide & Infos voyage",
    "footer.col2.l1": "Avant de partir",
    "footer.col2.l2": "Passeport & visas",
    "footer.col2.l3": "Bagages",
    "footer.col2.l4": "Assurances",
    "footer.col2.l5": "Centre d'aide",
    "footer.col2.l6": "Nous contacter",
    "footer.col2.l7": "Assistance spéciale",
    "footer.col3.title": "SKANDI Club",
    "footer.col3.l1": "Rejoindre le SKANDI Club",
    "footer.col3.l2": "Avantages membres",
    "footer.col3.l3": "Mon statut club",
    "footer.col3.l4": "Portefeuille de voyage & coupons",
    "footer.col4.title": "À propos",
    "footer.col4.l1": "À propos de SKANDI Travels",
    "footer.col4.l2": "Salle de presse",
    "footer.col4.l3": "Carrières",
    "footer.col4.l4": "Notre réseau",
    "footer.bottom.terms": "Les modes de paiement, les conditions des fournisseurs et les conditions des forfaits de voyage peuvent varier selon le produit.",
    "footer.bottom.l1": "Avis juridiques",
    "footer.bottom.l8": "Conditions d'utilisation",
    "footer.bottom.l2": "Accessibilité",
    "footer.bottom.l3": "Exonération de responsabilité",
    "footer.bottom.l4": "Politique de confidentialité",
    "footer.bottom.l5": "Politique relative aux témoins",
    "footer.bottom.l6": "Conditions de réservation",
    "footer.bottom.l7": "Connexion employés",
    "nav.myProfile": "Mon profil",
    "nav.myTrips": "Mes voyages et réservations",
    "nav.clubRewards": "Avantages et statut du club",
    "nav.travelWallet": "Portefeuille de voyage et bons",
    "nav.helpClub": "Aide et support du club",
    "nav.helpCenter": "Centre d’aide",
    "header.explore": "Découvrez SKANDI Travels",
    "header.member": "Membre",
    "header.points": "points",
    "header.yourClub": "Votre SKANDI Club",
    "header.joinClub": "Rejoindre le SKANDI Club",
    "header.hi": "Bonjour, {name}",
    "header.welcomeBack": "Bon retour",
    "header.signInMeta": "Connectez-vous pour accéder à vos voyages, points et documents de voyage.",
    "header.saveFavourites": "Enregistrez vos favoris",
    "header.saveFavouritesCopy": "Connectez-vous pour enregistrer des destinations, offres et pages dans votre profil.",
    "header.email": "Adresse e-mail",
    "header.password": "Mot de passe",
    "header.logIn": "Se connecter",
    "header.logout": "Se déconnecter",
    "home.option.economy": "Économique",
    "home.option.premiumEconomy": "Économique Premium",
    "home.option.business": "Affaires",
    "home.option.first": "Première",
    "home.option.anyStops": "Toutes les escales",
    "home.option.nonstopOnly": "Vols directs uniquement",
    "home.option.week1": "1 semaine",
    "home.option.nights10": "10 nuits",
    "home.option.weeks2": "2 semaines",
    "home.option.weeks3": "3 semaines",
    "home.option.nights7": "7 nuits",
    "home.option.nights14": "14 nuits",
    "home.loading.departureAirports": "Chargement des aéroports de départ...",
    "home.loading.destinations": "Chargement des destinations...",
    "home.loading.airports": "Chargement des aéroports...",
    "home.select.departureAirport": "Sélectionnez l’aéroport de départ",
    "home.select.destination": "Sélectionnez la destination",
    "home.placeholders.hotelDestination": "Ville, région ou nom de l’hôtel",
    "footer.news.placeholder": "Adresse e-mail",
    "footer.bottom.rights": "Tous droits réservés.",
    "home.age.childLabel": "Âge de l’enfant {n}",
    "home.age.infantLabel": "Âge du bébé {n}",
    "home.age.underOne": "Moins de 1 an",
    "home.date.oneWay": "Aller simple si vous sélectionnez maintenant",
    "home.status.selectDepartureDate": "Sélectionnez une date de départ.",
    "home.status.selectRoute": "Sélectionnez l’origine et la destination dans les suggestions.",
    "home.status.selectPackageRoute": "Sélectionnez l’aéroport de départ et la destination.",
    "home.status.enterHotelDestination": "Saisissez une destination d’hôtel.",
    "home.status.searching": "Recherche des disponibilités en direct et des forfaits SKANDI...",
    "home.status.noResults": "Aucun résultat. Essayez une autre date ou destination.",
    "home.status.offerSaved": "Offre enregistrée. Poursuite...",
    "home.status.searchFailed": "La recherche a échoué.",
    "home.status.foundOne": "1 résultat trouvé.",
    "home.status.foundMany": "{count} résultats trouvés.",
    "home.result.livePrice": "Prix en direct",
    "home.result.travelOffer": "Offre de voyage",
    "home.result.summaryFallback": "Le prix final et la disponibilité sont confirmés avant le paiement.",
    "home.result.type": "Type",
    "home.result.source": "Source",
    "home.result.check": "Contrôle",
    "home.result.revalidated": "Revérifié avant le paiement",
    "home.result.select": "Sélectionner",
    "home.result.travel": "Voyage",
    "home.summary.adult": "adulte",
    "home.summary.adults": "adultes",
    "home.summary.child": "enfant",
    "home.summary.children": "enfants",
    "home.title.hotelsIn": "Hôtels à {destination}",
    "home.title.holidayPackages": "Forfaits vacances",
    "home.card.from": "À partir de",
    "home.card.offer": "Offre",
    "home.card.destination": "Destination",
    "home.card.explore": "Découvrez des voyages sélectionnés par SKANDI.",
    "home.card.limited": "Disponibilité limitée. Prix final confirmé avant le paiement.",
    "home.card.lastMinute": "Dernière minute",
    "home.card.lastMinuteText": "Trouvez des voyages avec un départ prochain.",
    "home.card.flightHotel": "Vol + hôtel",
    "home.card.flightHotelText": "Combinez des vols en direct avec un hôtel.",
    "home.card.onlyFlights": "Vols uniquement",
    "home.card.onlyFlightsText": "Recherchez des offres de vols en direct.",
    "home.card.onlyHotels": "Hôtels uniquement",
    "home.card.onlyHotelsText": "Découvrez des séjours et leurs détails.",
    "home.card.signatureCollection": "Signature Collection",
    "home.card.signatureCollectionText": "Forfaits SKANDI sélectionnés.",
    "home.card.travelGuides": "Guides de voyage",
    "home.card.travelGuidesText": "Découvrez les destinations avant de réserver.",
    "home.why.curated": "Voyages sélectionnés",
    "home.why.curatedText": "SKANDI associe des composants de voyage en direct à des destinations, hôtels et services locaux sélectionnés.",
    "home.why.secure": "Réservation sécurisée",
    "home.why.secureText": "Le prix et la disponibilité sont revérifiés avant le paiement.",
    "home.why.documents": "Documents au même endroit",
    "home.why.documentsText": "Les voyages, commandes et documents restent liés à Mon profil.",
    "home.why.support": "Assistance tout au long du voyage",
    "home.why.supportText": "De l’aide avant, pendant et après votre voyage.",
    "home.trust.noSurprise": "Aucune surprise",
    "home.trust.noSurpriseText": "La disponibilité finale est confirmée avant le paiement.",
    "home.trust.packageClarity": "Forfaits transparents",
    "home.trust.packageClarityText": "Le vol, l’hôtel et les services locaux sont présentés ensemble.",
    "home.trust.myProfile": "Mon profil",
    "home.trust.myProfileText": "Vos voyages et documents restent accessibles.",
    "home.trust.club": "SKANDI Club",
    "home.trust.clubText": "Les points et les offres membres sont connectés.",
    "toast.newsletterThanks": "Merci pour votre inscription.",
    "toast.newsletterFailed": "L’inscription à l’infolettre a échoué."
  },
  "DE": {
    "nav.packages": "Pauschalreisen",
    "nav.destinations": "Reiseziele",
    "nav.club": "Signature Club",
    "nav.info": "Reiseinfos",
    "nav.search": "Suchen",
    "nav.clubBtn": "SKANDI Club",
    "nav.menu": "MENÜ",
    "nav.signIn": "Anmelden",
    "settings.language": "Sprache",
    "settings.currency": "Währung",
    "settings.apply": "Einstellungen speichern",
    "welcome.title": "Willkommen bei SKANDI",
    "welcome.copy": "Bitte bestätigen Sie Ihre bevorzugte Sprache und Währung, bevor Sie fortfahren.",
    "welcome.btn": "Zur Website",
    "home.hero.kicker": "SKANDI TRAVELS",
    "home.hero.title": "Entdecken Sie Ihre nächste Reise",
    "home.hero.copy": "Finden Sie Flüge, Urlaubsreisen, Hotels und Pakete der SKANDI Collection",
    "home.tabs.flights": "Flüge",
    "home.tabs.holidays": "Flug + Hotel",
    "home.tabs.hotels": "Hotels",
    "home.tabs.signature": "SKANDI Collection",
    "home.fields.from": "Von",
    "home.fields.to": "Nach",
    "home.fields.travelDates": "Reisedaten",
    "home.fields.adults": "Erwachsene",
    "home.fields.children": "Kinder",
    "home.fields.infants": "Kleinkinder",
    "home.fields.class": "Reiseklasse",
    "home.fields.stops": "Zwischenstopps",
    "home.fields.currency": "Währung",
    "home.fields.departureAirport": "Abflughafen",
    "home.fields.destination": "Reiseziel",
    "home.fields.departureDate": "Abreisedatum",
    "home.fields.lengthStay": "Reisedauer",
    "home.fields.rooms": "Zimmer",
    "home.fields.checkIn": "Check-in",
    "home.fields.checkOut": "Check-out",
    "home.fields.signatureDestination": "Signature-Reiseziel",
    "home.fields.length": "Dauer",
    "home.placeholders.airport": "Stadt, Flughafen, IATA oder ICAO",
    "home.age.adults": "Ab 12 Jahren",
    "home.age.children": "2–11 Jahre",
    "home.age.infants": "Unter 2 Jahren",
    "home.search.flights": "Flüge suchen",
    "home.search.holidays": "Flug + Hotel suchen",
    "home.search.hotels": "Hotels suchen",
    "home.search.signature": "SKANDI Collection durchsuchen",
    "home.helpers.hotels": "Ausgewählte Hotels",
    "home.helpers.transfers": "Lokale Transfers",
    "home.helpers.experiences": "SKANDI-Erlebnisse",
    "home.results.kicker": "Suchergebnisse",
    "home.results.title": "Verfügbare Reisen",
    "home.results.copy": "Die Ergebnisse werden hier angezeigt.",
    "home.results.edit": "Suche bearbeiten",
    "home.date.kicker": "Reisedaten auswählen",
    "home.date.clear": "Löschen",
    "home.date.apply": "Daten übernehmen",
    "home.sections.destinations.title": "Beliebte Reiseziele",
    "home.sections.destinations.copy": "Zielkarten werden aus SKANDI-Reiseinhalten geladen und können aktuelle Ab-Preise anzeigen.",
    "home.sections.offers.title": "Top-Angebote",
    "home.sections.offers.copy": "Kampagnen, Signature Collection und Saisonangebote werden über SKANDI-Inhaltsdatensätze gesteuert.",
    "home.sections.hotels.title": "Hotels, die sich zu entdecken lohnen",
    "home.sections.hotels.copy": "Ausgewählte SKANDI-Hotels mit aktuellen Preisen von Duffel Stays.",
    "home.sections.inspiration.title": "Reiseinspiration",
    "home.sections.inspiration.copy": "Geschichten, Guides und Ideen von SKANDI. Hier erscheinen nur veröffentlichte Inhalte.",
    "home.card.liveStay": "Aktueller Duffel-Preis",
    "home.card.sevenNights": "7 Nächte",
    "home.card.checkLive": "Aktuellen Preis prüfen",
    "home.card.readMore": "Mehr erfahren",
    "home.sections.tripTypes.title": "Welche Art von Reise suchen Sie?",
    "home.sections.tripTypes.copy": "Schnelleinstiege für Last Minute, Familien-, Städte-, Strandreisen und Signature Collection.",
    "home.sections.why": "Warum mit SKANDI reisen",
    "home.clubCta.title": "Werden Sie Mitglied im SKANDI Club und erhalten Sie Angebote und Inspiration",
    "home.clubCta.copy": "Erhalten Sie Mitgliederangebote, Reisezieltipps und Erinnerungen zu Ihren Reisen.",
    "home.clubCta.button": "SKANDI Club beitreten",
    "footer.news.title": "SKANDI-Angebote und Reiseinspiration erhalten",
    "footer.news.desc": "Erhalten Sie Reiseführer, Neuigkeiten zur Signature Collection und Mitgliederangebote.",
    "footer.news.btn": "Anmelden",
    "footer.col1.title": "Buchen & Reisen",
    "footer.col1.l1": "Buchung verwalten",
    "footer.col1.l2": "Reise buchen",
    "footer.col1.l3": "Signature Collection",
    "footer.col1.l4": "Reiseziele",
    "footer.col1.l5": "Hotels",
    "footer.col1.l6": "Flüge",
    "footer.col1.l7": "Ausflüge & Aktivitäten",
    "footer.col1.l8": "Mietwagen",
    "footer.col1.l9": "Angebote",
    "footer.col2.title": "Hilfe & Reiseinfos",
    "footer.col2.l1": "Vor der Reise",
    "footer.col2.l2": "Reisepass & Visum",
    "footer.col2.l3": "Gepäck",
    "footer.col2.l4": "Versicherung",
    "footer.col2.l5": "Hilfezentrum",
    "footer.col2.l6": "Kontakt",
    "footer.col2.l7": "Besondere Unterstützung",
    "footer.col3.title": "SKANDI Club",
    "footer.col3.l1": "SKANDI Club beitreten",
    "footer.col3.l2": "Mitgliedsvorteile",
    "footer.col3.l3": "Mein Clubstatus",
    "footer.col3.l4": "Reise-Wallet & Gutscheine",
    "footer.col4.title": "Über uns",
    "footer.col4.l1": "Über SKANDI Travels",
    "footer.col4.l2": "Newsroom",
    "footer.col4.l3": "Karriere",
    "footer.col4.l4": "Unser Netzwerk",
    "footer.bottom.terms": "Zahlungsarten, Anbieterbedingungen und Pauschalreisebedingungen können je nach Produkt variieren.",
    "footer.bottom.l1": "Rechtliches",
    "footer.bottom.l8": "Nutzungsbedingungen",
    "footer.bottom.l2": "Barrierefreiheit",
    "footer.bottom.l3": "Haftungsausschluss",
    "footer.bottom.l4": "Datenschutzrichtlinie",
    "footer.bottom.l5": "Cookie-Richtlinie",
    "footer.bottom.l6": "Buchungsbedingungen",
    "footer.bottom.l7": "Mitarbeiter-Login",
    "nav.myProfile": "Mein Profil",
    "nav.myTrips": "Meine Reisen & Buchungen",
    "nav.clubRewards": "Clubvorteile & Status",
    "nav.travelWallet": "Reise-Wallet & Gutscheine",
    "nav.helpClub": "Hilfe & Club-Support",
    "nav.helpCenter": "Hilfezentrum",
    "header.explore": "SKANDI Travels entdecken",
    "header.member": "Mitglied",
    "header.points": "Punkte",
    "header.yourClub": "Ihr SKANDI Club",
    "header.joinClub": "SKANDI Club beitreten",
    "header.hi": "Hallo, {name}",
    "header.welcomeBack": "Willkommen zurück",
    "header.signInMeta": "Melden Sie sich an, um Ihre Reisen, Punkte und Reisedokumente aufzurufen.",
    "header.saveFavourites": "Favoriten speichern",
    "header.saveFavouritesCopy": "Melden Sie sich an, um Reiseziele, Angebote und Seiten in Ihrem Profil zu speichern.",
    "header.email": "E-Mail-Adresse",
    "header.password": "Passwort",
    "header.logIn": "Anmelden",
    "header.logout": "Abmelden",
    "home.option.economy": "Economy",
    "home.option.premiumEconomy": "Premium Economy",
    "home.option.business": "Business",
    "home.option.first": "First",
    "home.option.anyStops": "Beliebige Zwischenstopps",
    "home.option.nonstopOnly": "Nur Direktflüge",
    "home.option.week1": "1 Woche",
    "home.option.nights10": "10 Nächte",
    "home.option.weeks2": "2 Wochen",
    "home.option.weeks3": "3 Wochen",
    "home.option.nights7": "7 Nächte",
    "home.option.nights14": "14 Nächte",
    "home.loading.departureAirports": "Abflughäfen werden geladen...",
    "home.loading.destinations": "Reiseziele werden geladen...",
    "home.loading.airports": "Flughäfen werden geladen...",
    "home.select.departureAirport": "Abflughafen auswählen",
    "home.select.destination": "Reiseziel auswählen",
    "home.placeholders.hotelDestination": "Stadt, Region oder Hotelname",
    "footer.news.placeholder": "E-Mail-Adresse",
    "footer.bottom.rights": "Alle Rechte vorbehalten.",
    "home.age.childLabel": "Alter Kind {n}",
    "home.age.infantLabel": "Alter Kleinkind {n}",
    "home.age.underOne": "Unter 1 Jahr",
    "home.date.oneWay": "Nur Hinflug, wenn Sie jetzt auswählen",
    "home.status.selectDepartureDate": "Wählen Sie ein Abreisedatum.",
    "home.status.selectRoute": "Wählen Sie Abflugort und Reiseziel aus den Vorschlägen.",
    "home.status.selectPackageRoute": "Wählen Sie Abflughafen und Reiseziel.",
    "home.status.enterHotelDestination": "Geben Sie ein Hotelreiseziel ein.",
    "home.status.searching": "Live-Verfügbarkeit und SKANDI-Pakete werden durchsucht...",
    "home.status.noResults": "Keine Ergebnisse gefunden. Versuchen Sie ein anderes Datum oder Reiseziel.",
    "home.status.offerSaved": "Angebot gespeichert. Weiter...",
    "home.status.searchFailed": "Die Suche ist fehlgeschlagen.",
    "home.status.foundOne": "1 Ergebnis gefunden.",
    "home.status.foundMany": "{count} Ergebnisse gefunden.",
    "home.result.livePrice": "Live-Preis",
    "home.result.travelOffer": "Reiseangebot",
    "home.result.summaryFallback": "Endpreis und Verfügbarkeit werden vor der Zahlung bestätigt.",
    "home.result.type": "Typ",
    "home.result.source": "Quelle",
    "home.result.check": "Prüfung",
    "home.result.revalidated": "Vor der Zahlung erneut geprüft",
    "home.result.select": "Auswählen",
    "home.result.travel": "Reise",
    "home.summary.adult": "Erwachsener",
    "home.summary.adults": "Erwachsene",
    "home.summary.child": "Kind",
    "home.summary.children": "Kinder",
    "home.title.hotelsIn": "Hotels in {destination}",
    "home.title.holidayPackages": "Urlaubspakete",
    "home.card.from": "Ab",
    "home.card.offer": "Angebot",
    "home.card.destination": "Reiseziel",
    "home.card.explore": "Entdecken Sie ausgewählte SKANDI-Reiseoptionen.",
    "home.card.limited": "Begrenzte Verfügbarkeit. Endpreis wird vor der Zahlung bestätigt.",
    "home.card.lastMinute": "Last Minute",
    "home.card.lastMinuteText": "Finden Sie Reisen mit baldiger Abreise.",
    "home.card.flightHotel": "Flug + Hotel",
    "home.card.flightHotelText": "Kombinieren Sie Live-Flüge mit Hotelinhalten.",
    "home.card.onlyFlights": "Nur Flüge",
    "home.card.onlyFlightsText": "Suchen Sie nach Live-Flugangeboten.",
    "home.card.onlyHotels": "Nur Hotels",
    "home.card.onlyHotelsText": "Entdecken Sie Hotelaufenthalte und Details.",
    "home.card.signatureCollection": "Signature Collection",
    "home.card.signatureCollectionText": "Ausgewählte SKANDI-Pakete.",
    "home.card.travelGuides": "Reiseführer",
    "home.card.travelGuidesText": "Entdecken Sie Reiseziele vor der Buchung.",
    "home.why.curated": "Ausgewählte Reisen",
    "home.why.curatedText": "SKANDI kombiniert Live-Reisekomponenten mit ausgewählten Zielen, Hotels und lokalen Leistungen.",
    "home.why.secure": "Sichere Buchung",
    "home.why.secureText": "Preis und Verfügbarkeit werden vor der Zahlung erneut geprüft.",
    "home.why.documents": "Dokumente an einem Ort",
    "home.why.documentsText": "Reisen, Bestellungen und Reisedokumente bleiben mit Mein Profil verbunden.",
    "home.why.support": "Betreuung während der gesamten Reise",
    "home.why.supportText": "Hilfe vor, während und nach Ihrer Reise.",
    "home.trust.noSurprise": "Keine Überraschungen",
    "home.trust.noSurpriseText": "Die endgültige Verfügbarkeit wird vor der Zahlung bestätigt.",
    "home.trust.packageClarity": "Klare Pakete",
    "home.trust.packageClarityText": "Flug, Hotel und lokale Leistungen werden zusammen angezeigt.",
    "home.trust.myProfile": "Mein Profil",
    "home.trust.myProfileText": "Reisen und Dokumente bleiben zugänglich.",
    "home.trust.club": "SKANDI Club",
    "home.trust.clubText": "Punkte und Mitgliederangebote sind miteinander verbunden.",
    "toast.newsletterThanks": "Vielen Dank für Ihre Anmeldung.",
    "toast.newsletterFailed": "Die Newsletter-Anmeldung ist fehlgeschlagen."
  },
  "TH": {
    "nav.packages": "แพ็กเกจท่องเที่ยว",
    "nav.destinations": "จุดหมายปลายทาง",
    "nav.club": "Signature Club",
    "nav.info": "ข้อมูลการเดินทาง",
    "nav.search": "ค้นหา",
    "nav.clubBtn": "SKANDI Club",
    "nav.menu": "เมนู",
    "nav.signIn": "เข้าสู่ระบบ",
    "settings.language": "ภาษา",
    "settings.currency": "สกุลเงิน",
    "settings.apply": "บันทึกการตั้งค่า",
    "welcome.title": "ยินดีต้อนรับสู่ SKANDI",
    "welcome.copy": "กรุณายืนยันภาษาและสกุลเงินที่คุณต้องการก่อนดำเนินการต่อ",
    "welcome.btn": "เข้าสู่เว็บไซต์",
    "home.hero.kicker": "SKANDI TRAVELS",
    "home.hero.title": "ค้นพบการเดินทางครั้งต่อไปของคุณ",
    "home.hero.copy": "ค้นหาเที่ยวบิน วันหยุดพักผ่อน โรงแรม และแพ็กเกจใน SKANDI Collection",
    "home.tabs.flights": "เที่ยวบิน",
    "home.tabs.holidays": "เที่ยวบิน + โรงแรม",
    "home.tabs.hotels": "โรงแรม",
    "home.tabs.signature": "SKANDI Collection",
    "home.fields.from": "จาก",
    "home.fields.to": "ถึง",
    "home.fields.travelDates": "วันที่เดินทาง",
    "home.fields.adults": "ผู้ใหญ่",
    "home.fields.children": "เด็ก",
    "home.fields.infants": "ทารก",
    "home.fields.class": "ชั้นโดยสาร",
    "home.fields.stops": "การแวะพักเครื่อง",
    "home.fields.currency": "สกุลเงิน",
    "home.fields.departureAirport": "สนามบินต้นทาง",
    "home.fields.destination": "จุดหมายปลายทาง",
    "home.fields.departureDate": "วันที่ออกเดินทาง",
    "home.fields.lengthStay": "ระยะเวลาเข้าพัก",
    "home.fields.rooms": "ห้องพัก",
    "home.fields.checkIn": "เช็กอิน",
    "home.fields.checkOut": "เช็กเอาต์",
    "home.fields.signatureDestination": "จุดหมายปลายทาง Signature",
    "home.fields.length": "ระยะเวลา",
    "home.placeholders.airport": "เมือง, สนามบิน, รหัส IATA หรือ ICAO",
    "home.age.adults": "อายุ 12 ปีขึ้นไป",
    "home.age.children": "อายุ 2–11 ปี",
    "home.age.infants": "อายุต่ำกว่า 2 ปี",
    "home.search.flights": "ค้นหาเที่ยวบิน",
    "home.search.holidays": "ค้นหาเที่ยวบิน + โรงแรม",
    "home.search.hotels": "ค้นหาโรงแรม",
    "home.search.signature": "ค้นหา SKANDI Collection",
    "home.helpers.hotels": "โรงแรมแนะนำ",
    "home.helpers.transfers": "บริการรับส่งท้องถิ่น",
    "home.helpers.experiences": "ประสบการณ์พิเศษกับ SKANDI",
    "home.results.kicker": "ผลการค้นหา",
    "home.results.title": "การเดินทางที่พร้อมให้บริการ",
    "home.results.copy": "ผลลัพธ์จะแสดงที่นี่",
    "home.results.edit": "แก้ไขการค้นหา",
    "home.date.kicker": "เลือกวันที่เดินทาง",
    "home.date.clear": "ล้างข้อมูล",
    "home.date.apply": "ใช้ตัวเลือกวันที่",
    "home.sections.destinations.title": "จุดหมายปลายทางยอดนิยม",
    "home.sections.destinations.copy": "การ์ดจุดหมายปลายทางดึงข้อมูลมาจากคอนเทนต์ของ SKANDI และอาจแสดงราคาเริ่มต้นปัจจุบัน",
    "home.sections.offers.title": "ข้อเสนอที่ดีที่สุด",
    "home.sections.offers.copy": "โปรโมชัน Signature Collection และข้อเสนอตามฤดูกาลจะได้รับการจัดการผ่านระบบจัดการเนื้อหาของ SKANDI",
    "home.sections.hotels.title": "โรงแรมที่น่าสนใจ",
    "home.sections.hotels.copy": "โรงแรมที่ SKANDI คัดสรรพร้อมราคาปัจจุบันจาก Duffel Stays",
    "home.sections.inspiration.title": "แรงบันดาลใจในการเดินทาง",
    "home.sections.inspiration.copy": "เรื่องราว คู่มือ และไอเดียที่ SKANDI คัดสรร โดยจะแสดงเฉพาะเนื้อหาที่เผยแพร่แล้ว",
    "home.card.liveStay": "ราคา Duffel ปัจจุบัน",
    "home.card.sevenNights": "พัก 7 คืน",
    "home.card.checkLive": "ตรวจสอบราคาปัจจุบัน",
    "home.card.readMore": "อ่านเพิ่มเติม",
    "home.sections.tripTypes.title": "คุณกำลังมองหาการเดินทางแบบไหน?",
    "home.sections.tripTypes.copy": "ทางลัดด่วนสำหรับข้อเสนอนาทีสุดท้าย ทริปครอบครัว เที่ยวชมเมือง ทริปชายหาด และ Signature Collection",
    "home.sections.why": "ทำไมต้องเดินทางกับ SKANDI",
    "home.clubCta.title": "เข้าร่วม SKANDI Club เพื่อรับข้อเสนอพิเศษและแรงบันดาลใจ",
    "home.clubCta.copy": "รับข้อเสนอพิเศษสำหรับสมาชิก คำแนะนำจุดหมายปลายทาง และการแจ้งเตือนที่เกี่ยวข้องกับการเดินทางของคุณ",
    "home.clubCta.button": "เข้าร่วม SKANDI Club",
    "footer.news.title": "รับข้อเสนอพิเศษและแรงบันดาลใจในการท่องเที่ยวจาก SKANDI",
    "footer.news.desc": "รับคู่มือท่องเที่ยว อัปเดตล่าสุดจาก Signature Collection และข้อเสนอพิเศษสำหรับสมาชิก",
    "footer.news.btn": "ลงทะเบียน",
    "footer.col1.title": "จองและเดินทาง",
    "footer.col1.l1": "จัดการการจองของฉัน",
    "footer.col1.l2": "จองการเดินทาง",
    "footer.col1.l3": "Signature Collection",
    "footer.col1.l4": "จุดหมายปลายทาง",
    "footer.col1.l5": "โรงแรม",
    "footer.col1.l6": "เที่ยวบิน",
    "footer.col1.l7": "ทัวร์และกิจกรรม",
    "footer.col1.l8": "บริการเช่ารถ",
    "footer.col1.l9": "ข้อเสนอพิเศษ",
    "footer.col2.title": "ความช่วยเหลือและข้อมูลการเดินทาง",
    "footer.col2.l1": "ก่อนการเดินทาง",
    "footer.col2.l2": "พาสปอร์ตและวีซ่า",
    "footer.col2.l3": "สัมภาระ",
    "footer.col2.l4": "ประกันภัย",
    "footer.col2.l5": "ศูนย์ช่วยเหลือ",
    "footer.col2.l6": "ติดต่อเรา",
    "footer.col2.l7": "ความช่วยเหลือพิเศษ",
    "footer.col3.title": "SKANDI Club",
    "footer.col3.l1": "เข้าร่วม SKANDI Club",
    "footer.col3.l2": "สิทธิประโยชน์สำหรับสมาชิก",
    "footer.col3.l3": "สถานะสมาชิกของฉัน",
    "footer.col3.l4": "กระเป๋าเงินเดินทางและคูปอง",
    "footer.col4.title": "เกี่ยวกับเรา",
    "footer.col4.l1": "เกี่ยวกับ SKANDI Travels",
    "footer.col4.l2": "ห้องข่าวประชาสัมพันธ์",
    "footer.col4.l3": "ร่วมงานกับเรา",
    "footer.col4.l4": "เครือข่ายของเรา",
    "footer.bottom.terms": "วิธีการชำระเงิน ข้อกำหนดของผู้ให้บริการ และเงื่อนไขแพ็กเกจท่องเที่ยวอาจแตกต่างกันไปตามแต่ละผลิตภัณฑ์",
    "footer.bottom.l1": "ข้อมูลทางกฎหมาย",
    "footer.bottom.l8": "ข้อกำหนดการใช้งาน",
    "footer.bottom.l2": "การเข้าถึงที่เท่าเทียม",
    "footer.bottom.l3": "ข้อจำกัดความรับผิดชอบ",
    "footer.bottom.l4": "นโยบายความเป็นส่วนตัว",
    "footer.bottom.l5": "นโยบายคุกกี้",
    "footer.bottom.l6": "เงื่อนไขการจอง",
    "footer.bottom.l7": "เข้าสู่ระบบสำหรับพนักงาน",
    "nav.myProfile": "โปรไฟล์ของฉัน",
    "nav.myTrips": "การเดินทางและการจองของฉัน",
    "nav.clubRewards": "สิทธิประโยชน์และสถานะคลับ",
    "nav.travelWallet": "กระเป๋าเงินเดินทางและคูปอง",
    "nav.helpClub": "ความช่วยเหลือและฝ่ายสนับสนุนคลับ",
    "nav.helpCenter": "ศูนย์ช่วยเหลือ",
    "header.explore": "สำรวจ SKANDI Travels",
    "header.member": "สมาชิก",
    "header.points": "คะแนน",
    "header.yourClub": "SKANDI Club ของคุณ",
    "header.joinClub": "เข้าร่วม SKANDI Club",
    "header.hi": "สวัสดี {name}",
    "header.welcomeBack": "ยินดีต้อนรับกลับ",
    "header.signInMeta": "เข้าสู่ระบบเพื่อดูการเดินทาง คะแนน และเอกสารการเดินทางของคุณ",
    "header.saveFavourites": "บันทึกรายการโปรด",
    "header.saveFavouritesCopy": "เข้าสู่ระบบเพื่อบันทึกจุดหมายปลายทาง ข้อเสนอ และหน้าไว้ในโปรไฟล์ของคุณ",
    "header.email": "อีเมล",
    "header.password": "รหัสผ่าน",
    "header.logIn": "เข้าสู่ระบบ",
    "header.logout": "ออกจากระบบ",
    "home.option.economy": "ชั้นประหยัด",
    "home.option.premiumEconomy": "ชั้นประหยัดพรีเมียม",
    "home.option.business": "ชั้นธุรกิจ",
    "home.option.first": "ชั้นหนึ่ง",
    "home.option.anyStops": "ทุกจำนวนจุดแวะพัก",
    "home.option.nonstopOnly": "เที่ยวบินตรงเท่านั้น",
    "home.option.week1": "1 สัปดาห์",
    "home.option.nights10": "10 คืน",
    "home.option.weeks2": "2 สัปดาห์",
    "home.option.weeks3": "3 สัปดาห์",
    "home.option.nights7": "7 คืน",
    "home.option.nights14": "14 คืน",
    "home.loading.departureAirports": "กำลังโหลดสนามบินต้นทาง...",
    "home.loading.destinations": "กำลังโหลดจุดหมายปลายทาง...",
    "home.loading.airports": "กำลังโหลดสนามบิน...",
    "home.select.departureAirport": "เลือกสนามบินต้นทาง",
    "home.select.destination": "เลือกจุดหมายปลายทาง",
    "home.placeholders.hotelDestination": "เมือง ภูมิภาค หรือชื่อโรงแรม",
    "footer.news.placeholder": "อีเมล",
    "footer.bottom.rights": "สงวนลิขสิทธิ์",
    "home.age.childLabel": "อายุเด็กคนที่ {n}",
    "home.age.infantLabel": "อายุทารกคนที่ {n}",
    "home.age.underOne": "ต่ำกว่า 1 ปี",
    "home.date.oneWay": "เที่ยวเดียวหากเลือกตอนนี้",
    "home.status.selectDepartureDate": "เลือกวันที่ออกเดินทาง",
    "home.status.selectRoute": "เลือกทั้งต้นทางและจุดหมายปลายทางจากคำแนะนำ",
    "home.status.selectPackageRoute": "เลือกสนามบินต้นทางและจุดหมายปลายทาง",
    "home.status.enterHotelDestination": "กรอกจุดหมายปลายทางของโรงแรม",
    "home.status.searching": "กำลังค้นหาที่นั่งว่างแบบสดและแพ็กเกจ SKANDI...",
    "home.status.noResults": "ไม่พบผลลัพธ์ ลองเปลี่ยนวันที่หรือจุดหมายปลายทาง",
    "home.status.offerSaved": "บันทึกข้อเสนอแล้ว กำลังดำเนินการต่อ...",
    "home.status.searchFailed": "การค้นหาล้มเหลว",
    "home.status.foundOne": "พบ 1 ผลลัพธ์",
    "home.status.foundMany": "พบ {count} ผลลัพธ์",
    "home.result.livePrice": "ราคาปัจจุบัน",
    "home.result.travelOffer": "ข้อเสนอการเดินทาง",
    "home.result.summaryFallback": "ราคาสุดท้ายและที่ว่างจะได้รับการยืนยันก่อนชำระเงิน",
    "home.result.type": "ประเภท",
    "home.result.source": "แหล่งข้อมูล",
    "home.result.check": "การตรวจสอบ",
    "home.result.revalidated": "ตรวจสอบอีกครั้งก่อนชำระเงิน",
    "home.result.select": "เลือก",
    "home.result.travel": "การเดินทาง",
    "home.summary.adult": "ผู้ใหญ่",
    "home.summary.adults": "ผู้ใหญ่",
    "home.summary.child": "เด็ก",
    "home.summary.children": "เด็ก",
    "home.title.hotelsIn": "โรงแรมใน {destination}",
    "home.title.holidayPackages": "แพ็กเกจวันหยุด",
    "home.card.from": "เริ่มต้น",
    "home.card.offer": "ข้อเสนอ",
    "home.card.destination": "จุดหมายปลายทาง",
    "home.card.explore": "สำรวจตัวเลือกการเดินทางที่ SKANDI คัดสรร",
    "home.card.limited": "มีจำนวนจำกัด ราคาสุดท้ายจะยืนยันก่อนชำระเงิน",
    "home.card.lastMinute": "นาทีสุดท้าย",
    "home.card.lastMinuteText": "ค้นหาการเดินทางที่ออกเดินทางเร็ว ๆ นี้",
    "home.card.flightHotel": "เที่ยวบิน + โรงแรม",
    "home.card.flightHotelText": "รวมเที่ยวบินแบบสดกับโรงแรม",
    "home.card.onlyFlights": "เฉพาะเที่ยวบิน",
    "home.card.onlyFlightsText": "ค้นหาข้อเสนอเที่ยวบินแบบสด",
    "home.card.onlyHotels": "เฉพาะโรงแรม",
    "home.card.onlyHotelsText": "ดูที่พักโรงแรมและรายละเอียด",
    "home.card.signatureCollection": "Signature Collection",
    "home.card.signatureCollectionText": "แพ็กเกจ SKANDI ที่คัดสรร",
    "home.card.travelGuides": "คู่มือท่องเที่ยว",
    "home.card.travelGuidesText": "สำรวจจุดหมายปลายทางก่อนจอง",
    "home.why.curated": "การเดินทางที่คัดสรร",
    "home.why.curatedText": "SKANDI ผสานองค์ประกอบการเดินทางแบบสดกับจุดหมายปลายทาง โรงแรม และบริการท้องถิ่นที่คัดสรร",
    "home.why.secure": "การจองที่ปลอดภัย",
    "home.why.secureText": "ราคาและที่ว่างจะได้รับการตรวจสอบอีกครั้งก่อนชำระเงิน",
    "home.why.documents": "เอกสารในที่เดียว",
    "home.why.documentsText": "การเดินทาง คำสั่งซื้อ และเอกสารการเดินทางเชื่อมต่อกับโปรไฟล์ของฉัน",
    "home.why.support": "ดูแลตลอดการเดินทาง",
    "home.why.supportText": "ความช่วยเหลือก่อน ระหว่าง และหลังการเดินทาง",
    "home.trust.noSurprise": "ไม่มีค่าใช้จ่ายที่ไม่คาดคิด",
    "home.trust.noSurpriseText": "ยืนยันที่ว่างสุดท้ายก่อนชำระเงิน",
    "home.trust.packageClarity": "แพ็กเกจที่ชัดเจน",
    "home.trust.packageClarityText": "แสดงเที่ยวบิน โรงแรม และบริการท้องถิ่นไว้ด้วยกัน",
    "home.trust.myProfile": "โปรไฟล์ของฉัน",
    "home.trust.myProfileText": "การเดินทางและเอกสารยังคงเข้าถึงได้",
    "home.trust.club": "SKANDI Club",
    "home.trust.clubText": "คะแนนและข้อเสนอสำหรับสมาชิกเชื่อมต่อกัน",
    "toast.newsletterThanks": "ขอบคุณที่สมัครรับข่าวสาร",
    "toast.newsletterFailed": "การสมัครรับข่าวสารล้มเหลว"
  }
};


let SKANDI_USER_SETTINGS = { language:"EN", currency:"USD" };
const SKANDI_LANGUAGES = ["EN","SV","NO","DA","ES","FI","FR-FR","FR-CA","DE","TH"];
const SKANDI_CURRENCIES = ["USD","SEK","NOK","DKK","EUR"];
const SKANDI_LOCALES = {
  EN:"en-US", SV:"sv-SE", NO:"nb-NO", DA:"da-DK", ES:"es-ES",
  FI:"fi-FI", "FR-FR":"fr-FR", "FR-CA":"fr-CA", DE:"de-DE", TH:"th-TH"
};

function skandiTranslate(key, fallback="") {
  const language = SKANDI_USER_SETTINGS?.language || "EN";
  return I18N[language]?.[key] || I18N.EN?.[key] || fallback || key;
}

function skandiInterpolate(key, values = {}, fallback = "") {
  let output = skandiTranslate(key, fallback);
  Object.entries(values).forEach(([name, value]) => {
    output = output.replaceAll(`{${name}}`, String(value ?? ""));
  });
  return output;
}

function skandiLocale() {
  return SKANDI_LOCALES[SKANDI_USER_SETTINGS.language] || "en-US";
}

function setOptionText(selectId, value, key) {
  const select = document.getElementById(selectId);
  if (!select) return;
  const option = Array.from(select.options).find((entry) => String(entry.value) === String(value));
  if (option) option.textContent = skandiTranslate(key, option.textContent);
}

function applyControlTranslations() {
  setOptionText("travelClass", "ECONOMY", "home.option.economy");
  setOptionText("travelClass", "PREMIUM_ECONOMY", "home.option.premiumEconomy");
  setOptionText("travelClass", "BUSINESS", "home.option.business");
  setOptionText("travelClass", "FIRST", "home.option.first");
  setOptionText("stops", "false", "home.option.anyStops");
  setOptionText("stops", "true", "home.option.nonstopOnly");

  setOptionText("hol-nights", "7", "home.option.week1");
  setOptionText("hol-nights", "10", "home.option.nights10");
  setOptionText("hol-nights", "14", "home.option.weeks2");
  setOptionText("hol-nights", "21", "home.option.weeks3");
  setOptionText("sig-nights", "7", "home.option.nights7");
  setOptionText("sig-nights", "10", "home.option.nights10");
  setOptionText("sig-nights", "14", "home.option.nights14");

  const dateHeading = document.getElementById("dateRangeHeading");
  if (dateHeading) {
    dateHeading.innerHTML = `${skandiTranslate("home.fields.from")} <span></span> ${skandiTranslate("home.fields.to")}`;
  }
}

function applyTranslations() {
  const language = SKANDI_USER_SETTINGS?.language || "EN";
  document.documentElement.lang = {
    EN:"en",SV:"sv",NO:"no",DA:"da",ES:"es",FI:"fi",
    "FR-FR":"fr-FR","FR-CA":"fr-CA",DE:"de",TH:"th"
  }[language] || "en";

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.getAttribute("data-i18n");
    const value = skandiTranslate(key, element.textContent || "");
    if (value) element.innerHTML = value;
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    const key = element.getAttribute("data-i18n-placeholder");
    const value = skandiTranslate(key, element.getAttribute("placeholder") || "");
    if (value) element.setAttribute("placeholder", value);
  });

  document.querySelectorAll("[data-i18n-aria-label]").forEach((element) => {
    const key = element.getAttribute("data-i18n-aria-label");
    const value = skandiTranslate(key, element.getAttribute("aria-label") || "");
    if (value) element.setAttribute("aria-label", value);
  });

  applyControlTranslations();

  if (window.__SKANDI_HOME_BOOTED__) {
    if (state.usingFallback?.tripTypes) state.tripTypes = fallbackTripTypes();
    if (state.usingFallback?.why) state.why = fallbackWhy();
    if (state.usingFallback?.trust) state.trust = fallbackTrust();

    applyDateLabelsOnly();
    renderPax();
    renderSelectOptions();
    renderTrust();
    renderMixedFeed();
    renderDestinations();
    renderHotels();
    renderOffers();
    renderInspiration();
    renderTripTypes();
    renderWhy();
    renderLongHomeModules();

    if (state.lastResults?.length) {
      renderResults(state.lastResults);
    } else if (state.lastSearch) {
      $("selectorTitle").textContent = titleForSearch(state.lastSearch);
      $("selectorSummary").textContent = summaryForSearch(state.lastSearch);
    }
  }
}

function applyCurrencyPreference(currency) {
  const selected = SKANDI_CURRENCIES.includes(String(currency || "").toUpperCase())
    ? String(currency).toUpperCase()
    : "USD";

  ["currencyFlights","currencyHolidays","currencyHotels","currencySignature"].forEach((id) => {
    const select = document.getElementById(id);
    if (select && Array.from(select.options).some((option) => option.value === selected || option.text === selected)) {
      select.value = selected;
    }
  });
}

function updateSettingsControls() {
  const { language, currency } = SKANDI_USER_SETTINGS;

  ["langSelect","mobileLangSelect","welcomeLang"].forEach((id) => {
    const element = document.getElementById(id);
    if (element) element.value = language;
  });

  ["currSelect","mobileCurrSelect","welcomeCurr"].forEach((id) => {
    const element = document.getElementById(id);
    if (element) element.value = currency;
  });

  applyCurrencyPreference(currency);
}

function saveSkandiSettings(language, currency, notifyParent = true) {
  SKANDI_USER_SETTINGS = {
    language: SKANDI_LANGUAGES.includes(language) ? language : "EN",
    currency: SKANDI_CURRENCIES.includes(currency) ? currency : "USD"
  };

  try {
    localStorage.setItem("skandi_user_settings", JSON.stringify(SKANDI_USER_SETTINGS));
  } catch (_) {}

  updateSettingsControls();
  applyTranslations();

  window.dispatchEvent(new CustomEvent("skandi:settings-changed", {
    detail: { ...SKANDI_USER_SETTINGS }
  }));

  if (notifyParent) {
    postToParent({
      source:"SKANDI_CUSTOMER_HEADER_EXPANDBAR",
      type:"UPDATE_SETTINGS",
      payload:{ ...SKANDI_USER_SETTINGS }
    });
  }
}

let SKANDI_SETTINGS_INITIALIZED = false;

function initializeSkandiSettings() {
  if (SKANDI_SETTINGS_INITIALIZED) {
    updateSettingsControls();
    applyTranslations();
    return;
  }

  SKANDI_SETTINGS_INITIALIZED = true;
  let stored = null;

  try {
    stored = JSON.parse(localStorage.getItem("skandi_user_settings") || "null");
  } catch (_) {
    stored = null;
  }

  if (stored && SKANDI_LANGUAGES.includes(stored.language)) {
    SKANDI_USER_SETTINGS = {
      language: stored.language,
      currency: SKANDI_CURRENCIES.includes(stored.currency) ? stored.currency : "USD"
    };
  } else {
    SKANDI_USER_SETTINGS = { language:"EN", currency:"USD" };
    const welcomeModal = document.getElementById("welcomeSettingsModal");
    if (welcomeModal) welcomeModal.classList.add("active");
  }

  updateSettingsControls();
  applyTranslations();
}


const state = {
  airports: [],
  destinations: [],
  searchDestinations: [],
  hotels: [],
  offers: [],
  inspiration: [],
  mixedUsed: new Set(),
  priceSearch: null,
  sync: null,
  lastBootstrapAt: 0,
  tripTypes: [],
  why: [],
  trust: [],
  activeTab: "holidays",
  adults: 2,
  children: 0,
  infants: 0,
  childAges: [],
  infantAges: [],
  dateRanges: {
    flights:{from:"",to:""},
    holidays:{from:"",to:""},
    hotels:{from:"",to:""},
    signature:{from:"",to:""}
  },
  activeDateRange:"holidays",
  calendarMonth: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  lastSearch: null,
  lastResults: [],
  usingFallback: { destinations:true, offers:true, tripTypes:true, why:true, trust:true }
};

function $(id){ return document.getElementById(id); }
function send(type,payload={}){ postToParent({ source:SOURCE, type, payload, timestamp:new Date().toISOString() }); }
function esc(v=""){ return String(v ?? "").replace(/[&<>"']/g, s => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[s])); }
function escAttr(v=""){ return esc(v).replaceAll("`","&#096;"); }
function normalize(v=""){ return String(v || "").trim().toLowerCase(); }
function isoDate(date){ const y=date.getFullYear(); const m=String(date.getMonth()+1).padStart(2,"0"); const d=String(date.getDate()).padStart(2,"0"); return `${y}-${m}-${d}`; }
function todayPlus(days){ const d=new Date(); d.setDate(d.getDate()+days); return isoDate(d); }
function addDaysIso(dateString,days){ const d=new Date(dateString+"T00:00:00"); d.setDate(d.getDate()+Number(days||0)); return isoDate(d); }
function addMonths(date,amount){ return new Date(date.getFullYear(), date.getMonth()+amount, 1); }
function formatDate(dateString){
  if(!dateString)return "";
  const d=new Date(dateString+"T00:00:00");
  if(Number.isNaN(d.getTime()))return "";
  return d.toLocaleDateString(skandiLocale(),{month:"short",day:"numeric",year:"numeric"});
}
function formatCurrencyAmount(amount, currency = SKANDI_USER_SETTINGS.currency) {
  if (amount === "" || amount === null || amount === undefined) return "";
  const numeric = Number(String(amount).replace(/[^\d.-]/g, ""));
  if (!Number.isFinite(numeric)) return `${currency} ${amount}`;
  try {
    return new Intl.NumberFormat(skandiLocale(), {
      style:"currency",
      currency,
      maximumFractionDigits:0
    }).format(numeric);
  } catch (_) {
    return `${currency} ${numeric}`;
  }
}
function money(price={}) {
  if (!price) return "";
  if (typeof price === "string") return price;
  const amount = price.amount || price.total || price.grandTotal || price.fromPrice || "";
  const currency = price.currency || price.currencyCode || SKANDI_USER_SETTINGS.currency || "";
  return amount === "" ? "" : formatCurrencyAmount(amount, currency);
}
function localizedRecordValue(record, field, fallback = "") {
  const language = SKANDI_USER_SETTINGS.language;
  const translations = record?.translations || record?.i18n || {};
  const normalized = language.toLowerCase().replace("-", "_");
  return translations?.[language]?.[field] ||
    translations?.[normalized]?.[field] ||
    record?.[`${field}_${normalized}`] ||
    record?.[field] ||
    fallback;
}
function localizedRecordList(record, field) {
  const value = localizedRecordValue(record, field, []);
  return Array.isArray(value) ? value : [];
}
function recordPrice(record) {
  const currency = SKANDI_USER_SETTINGS.currency;
  const prices = record?.prices || record?.priceByCurrency || record?.fromPrices || {};
  const amount = prices?.[currency] ?? (
    String(record?.currency || "").toUpperCase() === currency
      ? record?.fromPrice
      : null
  );
  if (amount !== null && amount !== undefined && amount !== "") {
    return formatCurrencyAmount(amount, currency);
  }
  if (record?.fromPrice) {
    return formatCurrencyAmount(record.fromPrice, record.currency || currency);
  }
  return "";
}
function imageStyle(url){ return url ? `background-image:url('${String(url).replaceAll("'","\\'")}')` : ""; }

const DATE_RANGE_CONFIG = {
  flights:{button:"dateRangeButton",fromInput:"depart",toInput:"return",fromLabel:"dateFromLabel",toLabel:"dateToLabel"},
  holidays:{button:"holDateRangeButton",fromInput:"hol-departure-date",toInput:"hol-return-date",fromLabel:"holDateFromLabel",toLabel:"holDateToLabel"},
  hotels:{button:"hotelDateRangeButton",fromInput:"hotel-in",toInput:"hotel-out",fromLabel:"hotelDateFromLabel",toLabel:"hotelDateToLabel"},
  signature:{button:"sigDateRangeButton",fromInput:"sig-departure-date",toInput:"sig-return-date",fromLabel:"sigDateFromLabel",toLabel:"sigDateToLabel"}
};
function nightsBetween(from,to){
  if(!from||!to)return 0;
  const a=new Date(from+"T00:00:00"), b=new Date(to+"T00:00:00");
  return Math.max(0,Math.round((b-a)/86400000));
}
function activeRange(){ return state.dateRanges[state.activeDateRange] || state.dateRanges.holidays; }
function setInitialDates(){
  const dep=todayPlus(60), ret=todayPlus(67);
  Object.keys(state.dateRanges).forEach(key=>{ state.dateRanges[key]={from:dep,to:ret}; });
  applyDateLabelsOnly();
}
function applyDateLabelsOnly(){
  Object.entries(DATE_RANGE_CONFIG).forEach(([key,cfg])=>{
    const range=state.dateRanges[key]||{from:"",to:""};
    const fromInput=$(cfg.fromInput), toInput=$(cfg.toInput), fromLabel=$(cfg.fromLabel), toLabel=$(cfg.toLabel);
    if(fromInput)fromInput.value=range.from||"";
    if(toInput)toInput.value=range.to||"";
    if(fromLabel)fromLabel.textContent=range.from?formatDate(range.from):skandiTranslate("home.fields.from");
    if(toLabel)toLabel.textContent=range.to?formatDate(range.to):skandiTranslate("home.fields.to");
  });
}

function findAirportMatches(query){
  const q=normalizeSearchText(query);
  if(!q)return state.airports.slice(0,9);
  return state.airports
    .map(a=>{
      const codes=[a.iata,a.icao].map(v=>normalizeSearchText(v));
      const fields=[a.city,a.name,a.iata,a.icao,a.country].map(v=>normalizeSearchText(v));
      let score=-1;
      if(codes.includes(q))score=1200;
      else for(const value of fields){
        if(value===q)score=Math.max(score,1100);
        else if(value.startsWith(q))score=Math.max(score,900);
        else if(value.includes(q))score=Math.max(score,620);
      }
      return {...a,_score:score};
    })
    .filter(a=>a._score>=0)
    .sort((a,b)=>b._score-a._score || String(a.city||"").localeCompare(String(b.city||"")))
    .slice(0,9);
}
function setupAirportField(inputId, hiddenId, boxId){
  const input=$(inputId), hidden=$(hiddenId), box=$(boxId);
  if(!input||!hidden||!box)return;
  const render=()=>{
    const matches=findAirportMatches(input.value);
    if(!matches.length){box.classList.remove("active");box.innerHTML="";input.setAttribute("aria-expanded","false");return;}
    box.innerHTML=matches.map(a=>`
      <button type="button" class="airport-option" data-iata="${escAttr(a.iata)}" data-label="${escAttr(`${a.city} (${a.iata})`)}">
        <span class="airport-option-type">AIRPORT</span>
        <span class="airport-option-copy"><strong>${esc(a.city)} (${esc(a.iata)})</strong>
        <small>${esc(a.name)}${a.icao?` • ${esc(a.icao)}`:""}${a.country?` • ${esc(a.country)}`:""}</small></span>
      </button>`).join("");
    box.classList.add("active");input.setAttribute("aria-expanded","true");
  };
  input.addEventListener("focus",render);
  input.addEventListener("input",()=>{hidden.value="";render();});
  box.addEventListener("mousedown",e=>e.preventDefault());
  box.addEventListener("click",e=>{
    const opt=e.target.closest(".airport-option"); if(!opt)return;
    input.value=opt.dataset.label||""; hidden.value=opt.dataset.iata||"";
    box.classList.remove("active"); input.setAttribute("aria-expanded","false");
  });
  input.addEventListener("blur",()=>setTimeout(()=>{box.classList.remove("active");input.setAttribute("aria-expanded","false");},120));
}
function normalizeSearchText(v=""){
  return String(v||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g," ").trim();
}
function buildLocationOptions(kind="destination"){
  const isDestinationField=kind==="destination";
  const airports=(state.airports||[]).map(a=>({
    type:"AIRPORT",value:String(a.iata||"").toUpperCase(),canonicalValue:String(a.iata||"").toUpperCase(),
    iata:String(a.iata||"").toUpperCase(),icao:String(a.icao||"").toUpperCase(),
    title:a.city||a.name||a.iata||"",city:a.city||"",airportName:a.name||"",country:a.country||"",
    label:`${a.city||a.name||a.iata}${a.iata?` (${a.iata})`:""}`,
    subtitle:[a.name,a.icao,a.country].filter(Boolean).join(" • "),
    terms:[a.city,a.name,a.iata,a.icao,a.country].filter(Boolean)
  })).filter(x=>x.value);

  // The same canonical catalogue powers every location field. For flight/departure
  // fields a destination/city alias resolves to its airport IATA; package destination
  // fields retain the canonical destination code and separately store the IATA.
  const destinations=(state.searchDestinations?.length?state.searchDestinations:state.destinations||[]).map(d=>{
    const destinationCode=String(d.destinationCode||d.code||d.slug||d.id||"");
    const iata=String(d.iata||"").toUpperCase();
    const title=localizedRecordValue(d,"title",d.name||destinationCode||"");
    const country=localizedRecordValue(d,"country",d.country||"");
    const canonicalValue=isDestinationField ? destinationCode : (iata||destinationCode);
    return {
      type:String(d.entityType||"DESTINATION").toUpperCase()==="AREA"?"AREA":"DESTINATION",
      value:canonicalValue,canonicalValue:destinationCode,iata,icao:String(d.icao||"").toUpperCase(),
      title,city:d.airportCity||title||"",airportName:d.airportName||"",country,
      label:`${title}${country?` — ${country}`:""}`,
      subtitle:[destinationCode?`Code ${destinationCode}`:"",iata?`Airport ${iata}`:"",d.airportName||""].filter(Boolean).join(" • "),
      terms:[title,d.name,destinationCode,iata,d.icao,d.airportName,d.airportCity,country,...(Array.isArray(d.searchTerms)?d.searchTerms:[])].filter(Boolean)
    };
  }).filter(x=>x.value);

  const seen=new Set();
  return [...destinations,...airports].filter(item=>{
    const key=`${item.type}:${item.canonicalValue||item.value}:${item.iata||""}`;
    if(seen.has(key))return false;
    seen.add(key);return true;
  });
}
function scoreLocationOption(item,query){
  const q=normalizeSearchText(query);
  if(!q)return item.type==="DESTINATION"||item.type==="AREA"?600:400;
  const compact=q.replace(/\s+/g,"");
  if([item.value,item.iata,item.icao].map(v=>normalizeSearchText(v).replace(/\s+/g,"")).includes(compact))return 1200;
  let best=-1;
  for(const value of [item.value,item.iata,item.icao,item.title,item.city,item.airportName,item.country,...(item.terms||[])].filter(Boolean).map(normalizeSearchText)){
    if(value===q)best=Math.max(best,1100);
    else if(value.startsWith(q))best=Math.max(best,900);
    else if(value.split(" ").some(word=>word.startsWith(q)))best=Math.max(best,780);
    else if(value.includes(q))best=Math.max(best,620);
    else if(q.split(" ").filter(Boolean).length>1&&q.split(" ").filter(Boolean).every(term=>value.includes(term)))best=Math.max(best,560);
  }
  if(best>=0&&(item.type==="DESTINATION"||item.type==="AREA"))best+=25;
  return best;
}
function matchingLocationOptions(kind,query){
  return buildLocationOptions(kind).map(item=>({...item,_score:scoreLocationOption(item,query)}))
    .filter(item=>item._score>=0).sort((a,b)=>b._score-a._score||String(a.title||"").localeCompare(String(b.title||""))).slice(0,10);
}
function setupLocationSearch({inputId,valueId,boxId,kind="destination",iataId="",typeId="",valueMode="canonical"}){
  const input=$(inputId),hidden=$(valueId),box=$(boxId),iata=iataId?$(iataId):null,type=typeId?$(typeId):null;
  if(!input||!hidden||!box)return;
  let matches=[],activeIndex=-1;
  const close=()=>{box.classList.remove("active");input.setAttribute("aria-expanded","false");activeIndex=-1;};
  const render=()=>{
    matches=matchingLocationOptions(kind,input.value);
    const catalogueReady=(state.airports||[]).length>0||(state.searchDestinations||[]).length>0;
    box.innerHTML=matches.length?matches.map((item,index)=>`<button type="button" class="airport-option" role="option" data-index="${index}">
      <span class="airport-option-type">${esc(item.type==="AREA"?"RESORT":item.type)}</span>
      <span class="airport-option-copy"><strong>${esc(item.label||item.title||item.value)}</strong><small>${esc(item.subtitle||"")}</small></span>
    </button>`).join(""):`<div style="padding:13px 14px;color:#667482;font-size:12px">${catalogueReady?"No matching locations":"Loading destinations and airports…"}</div>`;
    box.classList.add("active");input.setAttribute("aria-expanded","true");
  };
  const choose=item=>{
    if(!item)return;
    input.value=item.label||item.title||item.value||"";hidden.value=valueMode==="iata"?(item.iata||item.value||""):(item.canonicalValue||item.value||"");
    if(iata)iata.value=item.iata||"";if(type)type.value=item.type||"";close();
  };
  const resolveExact=()=>{
    if(hidden.value)return true;
    const q=normalizeSearchText(input.value);if(!q)return false;
    const exact=buildLocationOptions(kind).find(item=>[item.value,item.iata,item.icao,item.title,item.label].map(normalizeSearchText).includes(q));
    if(exact){choose(exact);return true;}return false;
  };
  input.addEventListener("focus",()=>{
    if(!(state.searchDestinations||[]).length || !(state.airports||[]).length) send("HOME_LOCATIONS_REQUEST",{});
    render();
  });
  input.addEventListener("input",()=>{
    hidden.value="";if(iata)iata.value="";if(type)type.value="";
    if(!(state.searchDestinations||[]).length || !(state.airports||[]).length) send("HOME_LOCATIONS_REQUEST",{});
    render();
  });
  input.addEventListener("keydown",e=>{
    if(!box.classList.contains("active")&&["ArrowDown","ArrowUp"].includes(e.key)){render();e.preventDefault();return;}
    if(!matches.length)return;
    if(e.key==="ArrowDown"){activeIndex=Math.min(matches.length-1,activeIndex+1);e.preventDefault();}
    else if(e.key==="ArrowUp"){activeIndex=Math.max(0,activeIndex-1);e.preventDefault();}
    else if(e.key==="Enter"&&activeIndex>=0){choose(matches[activeIndex]);e.preventDefault();return;}
    else if(e.key==="Escape"){close();return;} else return;
    [...box.querySelectorAll(".airport-option")].forEach((el,i)=>el.style.background=i===activeIndex?"#eef7fb":"");
  });
  box.addEventListener("mousedown",e=>e.preventDefault());
  box.addEventListener("click",e=>{const opt=e.target.closest(".airport-option");if(opt)choose(matches[Number(opt.dataset.index||0)]);});
  input.addEventListener("blur",()=>setTimeout(()=>{resolveExact();close();},120));
  input.__resolveLocationSelection=resolveExact;
}
function ensureLocationSelection(inputId){
  const input=$(inputId);
  return input&&typeof input.__resolveLocationSelection==="function"?input.__resolveLocationSelection():false;
}
function setupTabs(){
  document.querySelectorAll(".tab-btn").forEach(btn=>{
    btn.addEventListener("click",()=>{
      document.querySelectorAll(".tab-btn").forEach(b=>b.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach(p=>p.classList.remove("active"));
      btn.classList.add("active");
      state.activeTab=btn.dataset.tab;
      $("panel-"+state.activeTab).classList.add("active");
    });
  });
}

function clampPax(type,value){
  let next=Number(value);
  if(type==="adults")next=Math.max(1,Math.min(9,next));
  if(type==="children")next=Math.max(0,Math.min(9,next));
  if(type==="infants")next=Math.max(0,Math.min(9,next));
  const draft={adults:state.adults,children:state.children,infants:state.infants,[type]:next};
  if(draft.infants>draft.adults)draft.infants=draft.adults;
  while(draft.adults+draft.children+draft.infants>9){
    if(type==="children"&&draft.children>0)draft.children--;
    else if(type==="infants"&&draft.infants>0)draft.infants--;
    else if(draft.children>0)draft.children--;
    else if(draft.infants>0)draft.infants--;
    else break;
  }
  state.adults=draft.adults; state.children=draft.children; state.infants=draft.infants;
  renderPax();
}
function renderPax(){
  ["adultsCount","holAdultsCount"].forEach(id=>{const e=$(id); if(e)e.textContent=state.adults;});
  ["childrenCount","holChildrenCount"].forEach(id=>{const e=$(id); if(e)e.textContent=state.children;});
  ["infantsCount","holInfantsCount"].forEach(id=>{const e=$(id); if(e)e.textContent=state.infants;});
  state.childAges=state.childAges.slice(0,state.children);
  state.infantAges=state.infantAges.slice(0,state.infants);
  while(state.childAges.length<state.children)state.childAges.push(2);
  while(state.infantAges.length<state.infants)state.infantAges.push(0);
  renderAgeFields("ageFields");
  renderAgeFields("holAgeFields");
}
function renderAgeFields(boxId){
  const box=$(boxId); if(!box)return;
  let html="";
  if(state.children>0){
    html+=`<div class="field-row">`;
    for(let i=0;i<state.children;i++){
      html+=`<div class="field"><label>${esc(skandiInterpolate("home.age.childLabel",{n:i+1}))}</label><select data-child-age="${i}">${Array.from({length:10},(_,x)=>x+2).map(age=>`<option value="${age}" ${state.childAges[i]===age?"selected":""}>${age}</option>`).join("")}</select></div>`;
    }
    html+=`</div>`;
  }
  if(state.infants>0){
    html+=`<div class="field-row">`;
    for(let i=0;i<state.infants;i++){
      html+=`<div class="field"><label>${esc(skandiInterpolate("home.age.infantLabel",{n:i+1}))}</label><select data-infant-age="${i}"><option value="0" ${state.infantAges[i]===0?"selected":""}>${esc(skandiTranslate("home.age.underOne"))}</option><option value="1" ${state.infantAges[i]===1?"selected":""}>1</option></select></div>`;
    }
    html+=`</div>`;
  }
  box.innerHTML=html;
  box.querySelectorAll("[data-child-age]").forEach(sel=>sel.onchange=()=>{state.childAges[Number(sel.dataset.childAge)]=Number(sel.value); renderPax();});
  box.querySelectorAll("[data-infant-age]").forEach(sel=>sel.onchange=()=>{state.infantAges[Number(sel.dataset.infantAge)]=Number(sel.value); renderPax();});
}

function renderCalendar(){
  const grid=$("calendarGrid"), title=$("calendarTitle"), range=activeRange();
  if(!grid||!title)return;
  
  const a=state.calendarMonth, b=addMonths(state.calendarMonth,1);
  const isMobile = window.innerWidth <= 720;
  const months = isMobile ? [a] : [a, b];
  
  // Smart Title: "October 2026" on mobile, "October – November 2026" on desktop
  if (isMobile) {
    title.textContent = a.toLocaleDateString(skandiLocale(), { month: "long", year: "numeric" });
  } else {
    const titleA = a.toLocaleDateString(skandiLocale(), { month: "long" });
    const titleB = b.toLocaleDateString(skandiLocale(), { month: "long", year: "numeric" });
    title.textContent = `${titleA} – ${titleB}`;
  }
  
  $("pickedFrom").textContent = range.from ? formatDate(range.from) : skandiTranslate("home.fields.from");
  $("pickedTo").textContent = range.to ? formatDate(range.to) : skandiTranslate("home.fields.to");
  
  grid.innerHTML = months.map(renderMonth).join("");
}
function renderMonth(monthDate){
  const range=activeRange();
  const year=monthDate.getFullYear(), month=monthDate.getMonth();
  const first=new Date(year,month,1), last=new Date(year,month+1,0);
  const today=new Date(); today.setHours(0,0,0,0);
  const weekdays=Array.from({length:7},(_,index)=>{
    const day=new Date(2026,0,4+index);
    return day.toLocaleDateString(skandiLocale(),{weekday:"narrow"});
  });
  let days="";
  for(let i=0;i<first.getDay();i++)days+=`<div></div>`;
  for(let day=1;day<=last.getDate();day++){
    const date=new Date(year,month,day), value=isoDate(date);
    const selectingTo=Boolean(range.from&&!range.to);
    const disabled=date<today||(selectingTo&&value<range.from);
    const selected=value===range.from||value===range.to;
    const inRange=range.from&&range.to&&value>range.from&&value<range.to;
    days+=`<button type="button" class="day-btn ${disabled?"disabled":""} ${selected?"selected":""} ${inRange?"in-range":""}" data-date="${value}" ${disabled?"disabled":""}>${day}</button>`;
  }
  return `<div class="month-box"><h4>${monthDate.toLocaleDateString(skandiLocale(),{month:"long",year:"numeric"})}</h4><div class="month-weekdays">${weekdays.map(day=>`<div>${esc(day)}</div>`).join("")}</div><div class="month-days">${days}</div></div>`;
}
function pickDate(value){
  const range=activeRange();
  if(!range.from||range.to){ range.from=value; range.to=""; renderCalendar(); return; }
  if(value<=range.from){ range.from=value; range.to=""; renderCalendar(); return; }
  range.to=value; renderCalendar();
}
function closeDatePicker(){
  const pop=$("datePickerOverlay");
  if(pop)pop.classList.remove("active");
  document.querySelectorAll("[data-date-range]").forEach(btn=>btn.setAttribute("aria-expanded","false"));
}
function applyDates(){
  const range=activeRange();
  if(!range.from){ showStatus(skandiTranslate("home.status.selectDepartureDate"),true); return; }
  if(!range.to){ showStatus(skandiTranslate("home.status.selectReturnDate","Select a To date."),true); return; }
  applyDateLabelsOnly();
  closeDatePicker();
}
function openDatePicker(mode,button){
  state.activeDateRange=mode;
  const range=activeRange();
  if(range.from){ const d=new Date(range.from+"T00:00:00"); state.calendarMonth=new Date(d.getFullYear(),d.getMonth(),1); }
  const pop=$("datePickerOverlay");
  const host=button.closest(".date-field");
  if(host&&pop&&pop.parentElement!==host)host.appendChild(pop);
  document.querySelectorAll("[data-date-range]").forEach(btn=>btn.setAttribute("aria-expanded",btn===button?"true":"false"));
  pop.classList.add("active");
  renderCalendar();
}
function setupDatePicker(){
  document.querySelectorAll("[data-date-range]").forEach(button=>{
    button.onclick=(event)=>{ event.stopPropagation(); openDatePicker(button.dataset.dateRange,button); };
  });
  $("closeDatePicker").onclick=closeDatePicker;
  $("prevMonth").onclick=()=>{state.calendarMonth=addMonths(state.calendarMonth,-1);renderCalendar();};
  $("nextMonth").onclick=()=>{state.calendarMonth=addMonths(state.calendarMonth,1);renderCalendar();};
  $("clearDates").onclick=()=>{ const range=activeRange(); range.from="";range.to="";renderCalendar();applyDateLabelsOnly(); };
  $("applyDates").onclick=applyDates;
  $("calendarGrid").addEventListener("click",e=>{const b=e.target.closest("[data-date]");if(b&&!b.disabled)pickDate(b.dataset.date);});
  document.addEventListener("click",e=>{
    const pop=$("datePickerOverlay");
    if(pop?.classList.contains("active")&&!pop.contains(e.target)&&!e.target.closest("[data-date-range]"))closeDatePicker();
  });
  document.addEventListener("keydown",e=>{if(e.key==="Escape")closeDatePicker();});
  window.addEventListener("resize",()=>{if($("datePickerOverlay")?.classList.contains("active"))renderCalendar();});
}

function renderLocationData(payload={}){
  const airports=Array.isArray(payload.airports)?payload.airports:[];
  const destinations=Array.isArray(payload.searchDestinations) && payload.searchDestinations.length
    ? payload.searchDestinations
    : (Array.isArray(payload.destinations)?payload.destinations:[]);
  if(airports.length) state.airports=airports;
  if(destinations.length) state.searchDestinations=destinations;
  state.locationSync=payload.sync||null;
  if(state.locationSync?.errors?.length) console.warn("[SKANDI Home] Location sync diagnostics:",state.locationSync.errors);
  renderSelectOptions();
  // Re-render an open suggestion list immediately after async data arrives.
  ["from","to","hol-destination-search","sig-destination-search","hol-from-search","sig-from-search"].forEach(id=>{
    const input=$(id); if(input===document.activeElement) input.dispatchEvent(new Event("input",{bubbles:true}));
  });
}

function renderBootstrap(payload={}){
  const content=payload.content||{};

  // Product/editorial blocks are canonical Supabase content only.
  // Prices for homepage destinations and exact hotels are hydrated live by the Wix page through Duffel Stays.
  if (Array.isArray(content.airports) && content.airports.length) state.airports = content.airports;
  state.destinations = Array.isArray(content.destinations) ? content.destinations : state.destinations;
  // Never let a secondary/late bootstrap erase a successfully received location catalogue.
  if (Array.isArray(content.searchDestinations) && content.searchDestinations.length) {
    state.searchDestinations = content.searchDestinations;
  } else if (!state.searchDestinations.length && state.destinations.length) {
    state.searchDestinations = state.destinations;
  }
  state.hotels = Array.isArray(content.hotels) ? content.hotels : [];
  state.offers = Array.isArray(content.offers) ? content.offers : [];
  state.inspiration = Array.isArray(content.inspiration) ? content.inspiration : [];
  state.priceSearch = content.priceSearch || null;
  state.sync = content.sync || payload.sync || null;
  state.lastBootstrapAt = Date.now();
  if(state.sync?.errors?.length) console.warn("[SKANDI Home] Content sync diagnostics:", state.sync.errors);

  state.usingFallback = {
    destinations: false,
    offers: false,
    tripTypes: !content.tripTypes?.length,
    why: !content.why?.length,
    trust: !content.trust?.length
  };

  state.tripTypes = state.usingFallback.tripTypes ? fallbackTripTypes() : content.tripTypes;
  state.why = state.usingFallback.why ? fallbackWhy() : content.why;
  state.trust = state.usingFallback.trust ? fallbackTrust() : content.trust;

  const destinationsSection = $("destinations-section");
  const hotelsSection = $("hotels-section");
  const offersSection = $("offers-section");
  const inspirationSection = $("inspiration-section");
  const mixedSection = $("mixed-section");
  if (destinationsSection) destinationsSection.hidden = state.destinations.length === 0;
  if (hotelsSection) hotelsSection.hidden = state.hotels.length === 0;
  if (offersSection) offersSection.hidden = state.offers.length === 0;
  if (inspirationSection) inspirationSection.hidden = state.inspiration.length === 0;
  if (mixedSection) mixedSection.hidden = false;

  renderSelectOptions();
  renderTrust();
  renderMixedFeed();
  renderDestinations();
  renderHotels();
  renderOffers();
  renderInspiration();
  renderTripTypes();
  renderWhy();
  renderLongHomeModules();

  const preferredCurrency =
    SKANDI_USER_SETTINGS?.currency ||
    payload.booking?.defaultCurrency ||
    "USD";

  applyCurrencyPreference(preferredCurrency);
}
function renderSelectOptions(){
  const airportValues=new Set(state.airports.map(a=>String(a.iata||"").toUpperCase()).filter(Boolean));
  ["hol","sig"].forEach(prefix=>{
    const hidden=$(prefix+"-from-iata"),input=$(prefix+"-from-search");
    if(hidden?.value&&!airportValues.has(String(hidden.value).toUpperCase())){hidden.value="";if(input)input.value="";}
  });
  const destinationValues=new Set(buildLocationOptions("destination").map(x=>String(x.value||"")).filter(Boolean));
  ["hol","hotel","sig"].forEach(prefix=>{
    const hidden=$(prefix+"-destination"),input=$(prefix+"-destination-search");
    if(hidden?.value&&!destinationValues.has(String(hidden.value))){
      hidden.value="";if(input)input.value="";
      const iata=$(prefix+"-destination-iata");if(iata)iata.value="";
      const type=$(prefix+"-destination-type");if(type)type.value="";
    }
  });
}
function mixedItemLabel(kind){
  if(kind==="offer") return skandiTranslate("home.card.offer","Offer");
  if(kind==="hotel") return skandiTranslate("home.sections.hotels.title","Hotel");
  if(kind==="inspiration") return skandiTranslate("home.sections.inspiration.title","Travel inspiration");
  if(kind==="club") return "SKANDI CLUB";
  return skandiTranslate("home.card.destination","Destination");
}
function mixedItemPrice(item,kind){
  if(kind==="destination" || kind==="hotel") {
    const value=money(item.fromPrice||item.price||0);
    return value ? `${skandiTranslate("home.card.from","From")} ${value}` : "";
  }
  if(kind==="offer") {
    const value=money(item.fromPrice||item.price||item.amount||0);
    return value ? `${skandiTranslate("home.card.from","From")} ${value}` : "";
  }
  return "";
}
function renderMixedFeed(){
  const grid=$("mixed-feed");
  const section=$("mixed-section");
  if(!grid || !section) return;

  const pool=[];
  const add=(kind,item)=>{ if(item && item.id) pool.push({kind,item}); };
  add("offer",state.offers[0]);
  add("destination",state.destinations[0]);
  add("hotel",state.hotels[0]);
  add("inspiration",state.inspiration[0]);
  add("destination",state.destinations[1]);
  add("offer",state.offers[1]);
  add("inspiration",state.inspiration[1]);

  const seen=new Set();
  const items=pool.filter(entry=>{
    const key=`${entry.kind}:${entry.item.id}`;
    if(seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0,5);

  state.mixedUsed = new Set(items.map(entry=>`${entry.kind}:${entry.item.id}`));

  if(!items.length){
    section.hidden=true;
    grid.innerHTML="";
    return;
  }
  section.hidden=false;
  const layouts=["lead","side","side","third","wide"];
  grid.innerHTML=items.map((entry,index)=>{
    const {kind,item}=entry;
    const title=localizedRecordValue(item,"title",item.name||mixedItemLabel(kind));
    const copy=localizedRecordValue(item,"description",localizedRecordValue(item,"summary",""));
    const kicker=item.kicker||item.badge||item.category||mixedItemLabel(kind);
    const price=mixedItemPrice(item,kind);
    const path=safeRouteValue(item.path, defaultContentPath(kind));
    const search=kind==="offer" ? JSON.stringify(item.search||{}) : "{}";
    return `<article class="mixed-card ${layouts[index]||"third"} ${escAttr(kind)}" data-kind="${escAttr(kind)}" data-path="${escAttr(path)}" data-search='${escAttr(search)}' style="${escAttr(imageStyle(item.imageUrl||item.image))}">
      <div class="mixed-card-copy">
        <div class="mixed-card-kicker">${esc(kicker)}</div>
        <h3>${esc(title)}</h3>
        ${copy?`<p>${esc(copy)}</p>`:""}
        <div class="mixed-card-meta">
          ${price?`<span class="mixed-card-price">${esc(price)}</span>`:""}
          <span class="mixed-card-cta">${esc(kind==="inspiration"?skandiTranslate("home.card.readMore","Read more"):"Explore")} →</span>
        </div>
      </div>
    </article>`;
  }).join("");

  grid.querySelectorAll(".mixed-card").forEach(card=>card.onclick=()=>{
    if(card.dataset.kind==="offer"){
      if(card.dataset.path) return send("HOME_NAVIGATE",{path:card.dataset.path});
      try{const search=JSON.parse(card.dataset.search||"{}"); if(Object.keys(search).length) return runSearch("offer",search);}catch(_){}
    }
    send("HOME_NAVIGATE",{path:safeRouteValue(card.dataset.path,defaultContentPath(card.dataset.kind))});
  });
}

function renderTrust(){
  $("trustGrid").innerHTML=state.trust.map(t=>`<div class="trust-box"><strong>${esc(localizedRecordValue(t,"title",""))}</strong><span>${esc(localizedRecordValue(t,"text",""))}</span></div>`).join("");
}
function livePriceMarkup(item){
  const price=recordPrice(item);
  const period=item.pricePeriod||state.priceSearch||{};
  if(!price) return `<div class="live-price-row"><div><small>${esc(skandiTranslate("home.card.sevenNights","7-night stay"))}</small><strong>${esc(skandiTranslate("home.card.checkLive","Check live price"))}</strong></div><span class="duffel-chip">DUFFEL STAYS</span></div>`;
  const dateCopy=period.checkInDate&&period.checkOutDate?`${formatDate(period.checkInDate)} – ${formatDate(period.checkOutDate)}`:"";
  return `<div class="live-price-row"><div><small>${esc(skandiTranslate("home.card.sevenNights","7-night stay"))}${dateCopy?` · ${esc(dateCopy)}`:""}</small><strong>${esc(skandiTranslate("home.card.from"))} ${esc(price)}</strong></div><span class="duffel-chip">${esc(skandiTranslate("home.card.liveStay","Live Duffel price"))}</span></div>`;
}
function renderDestinations(){
  const grid=$("destinations-grid"); if(!grid)return;
  const rows=state.destinations.filter(d=>!state.mixedUsed?.has(`destination:${d.id}`)).slice(0,8);
  const section=$("destinations-section");
  if(section) section.hidden=rows.length===0;
  grid.innerHTML=rows.map(d=>{
    const tags=(d.tags||d.badges||[]).slice(0,4);
    return `
    <article class="dest-card" data-path="${escAttr(safeRouteValue(d.path||d.url,destinationsRoute()))}">
      <div class="card-img" style="${escAttr(imageStyle(d.imageUrl||d.image))}"><div class="card-code">${esc(d.destinationCode||d.iata||d.badge||"SKANDI")}</div></div>
      <div class="card-body">
        <h3>${esc(localizedRecordValue(d,"title",d.name||skandiTranslate("home.card.destination")))}</h3>
        <p>${esc(localizedRecordValue(d,"description",localizedRecordValue(d,"summary",skandiTranslate("home.card.explore"))))}</p>
        <div class="dest-meta">${tags.map(t=>`<span class="dest-pill">${esc(t)}</span>`).join("")}</div>
        ${livePriceMarkup(d)}
      </div>
    </article>`;
  }).join("");
  grid.querySelectorAll(".dest-card").forEach(card=>card.onclick=()=>send("HOME_NAVIGATE",{path:safeRouteValue(card.dataset.path,destinationsRoute())}));
}
function renderHotels(){
  const grid=$("hotel-grid"); if(!grid)return;
  const rows=state.hotels.filter(h=>!state.mixedUsed?.has(`hotel:${h.id}`)).slice(0,6);
  const section=$("hotels-section");
  if(section) section.hidden=rows.length===0;
  grid.innerHTML=rows.map(h=>{
    const stars=h.rating?`${"★".repeat(Math.max(1,Math.min(5,Math.round(Number(h.rating)))))} · `:"";
    const tags=(h.tags||[]).slice(0,3);
    return `<article class="hotel-card" data-path="${escAttr(safeRouteValue(h.path,masterRoute("hotels")))}">
      <div class="hotel-img" style="${escAttr(imageStyle(h.imageUrl||h.image))}"><div class="hotel-badge">${esc(stars+String(h.city||h.country||"SKANDI HOTEL"))}</div></div>
      <div class="hotel-body">
        <div class="hotel-location">${esc([h.city,h.country].filter(Boolean).join(" · "))}</div>
        <h3>${esc(localizedRecordValue(h,"title",h.name||"Hotel"))}</h3>
        <p>${esc(localizedRecordValue(h,"description",localizedRecordValue(h,"summary","")))}</p>
        ${tags.length?`<div class="dest-meta">${tags.map(t=>`<span class="dest-pill">${esc(t)}</span>`).join("")}</div>`:""}
        ${livePriceMarkup(h)}
      </div>
    </article>`;
  }).join("");
  grid.querySelectorAll(".hotel-card").forEach(card=>card.onclick=()=>send("HOME_NAVIGATE",{path:safeRouteValue(card.dataset.path,masterRoute("hotels"))}));
}
function renderOffers(){
  const grid=$("offer-grid"); if(!grid)return;
  const rows=state.offers.filter(o=>!state.mixedUsed?.has(`offer:${o.id}`)).slice(0,8);
  const section=$("offers-section");
  if(section) section.hidden=rows.length===0;
  grid.innerHTML=rows.map(o=>{
    const price=money(o.fromPrice||o.price||o.amount||0);
    const tags=(o.tags||[]).slice(0,3);
    return `
    <article class="offer-card" data-search='${escAttr(JSON.stringify(o.search||{}))}' data-path="${escAttr(safeRouteValue(o.path,offersRoute()))}">
      <div class="offer-img" style="${escAttr(imageStyle(o.imageUrl||o.image))}"><div class="card-code">${esc(o.badge||o.destinationCode||skandiTranslate("home.card.offer"))}</div></div>
      <div class="offer-body">
        <h4>${esc(localizedRecordValue(o,"title","SKANDI Offer"))}</h4>
        <p>${esc(localizedRecordValue(o,"description",localizedRecordValue(o,"summary",skandiTranslate("home.card.limited"))))}</p>
        <div class="dest-meta">${tags.map(t=>`<span class="dest-pill">${esc(t)}</span>`).join("")}</div>
        ${price?`<div class="offer-price">${esc(skandiTranslate("home.card.from"))} ${esc(price)}</div>`:""}
      </div>
    </article>`;
  }).join("");
  grid.querySelectorAll(".offer-card").forEach(card=>card.onclick=()=>{
    send("HOME_NAVIGATE",{path:safeRouteValue(card.dataset.path,offersRoute())});
  });
}
function renderInspiration(){
  const grid=$("inspiration-grid"); if(!grid)return;
  const rows=state.inspiration.filter(i=>!state.mixedUsed?.has(`inspiration:${i.id}`)).slice(0,8);
  const section=$("inspiration-section");
  if(section) section.hidden=rows.length===0;
  grid.innerHTML=rows.map((item,index)=>`
    <article class="inspo-card ${index===0?"featured":""}" data-path="${escAttr(safeRouteValue(item.path,masterRoute("voy")))}" style="${escAttr(imageStyle(item.imageUrl||item.image))}">
      <div class="inspo-copy">
        <div class="inspo-kicker">${esc(item.kicker||item.category||skandiTranslate("home.sections.inspiration.title","Travel inspiration"))}</div>
        <h3>${esc(localizedRecordValue(item,"title","Travel inspiration"))}</h3>
        <p>${esc(localizedRecordValue(item,"description",localizedRecordValue(item,"summary","")))}</p>
        <span class="inspo-read">${esc(skandiTranslate("home.card.readMore","Read more"))} →</span>
      </div>
    </article>`).join("");
  grid.querySelectorAll(".inspo-card").forEach(card=>card.onclick=()=>send("HOME_NAVIGATE",{path:safeRouteValue(card.dataset.path,masterRoute("voy"))}));
}
function renderTripTypes(){
  $("trip-type-grid").innerHTML = state.tripTypes.map(t => `
    <article class="type-card" data-action="${escAttr(t.action||"")}" data-path="${escAttr(t.path||"")}" data-route-key="${escAttr(t.routeKey||"")}">
      <div class="type-icon">${t.icon && t.icon.startsWith("<svg") ? t.icon : esc(t.icon||"✈")}</div>
      <div class="type-body">
        <h3>${esc(localizedRecordValue(t,"title",""))}</h3>
        <p>${esc(localizedRecordValue(t,"text",""))}</p>
      </div>
    </article>
  `).join("");
  
  document.querySelectorAll(".type-card").forEach(card => card.onclick = () => {
    if(card.dataset.routeKey) return send("HOME_NAVIGATE", {path: routeByKey(card.dataset.routeKey)});
    if(card.dataset.path) return send("HOME_NAVIGATE", {path: safeRouteValue(card.dataset.path, destinationsRoute())});
    if(card.dataset.action){
      const tab = card.dataset.action;
      const btn = document.querySelector(`.tab-btn[data-tab="${tab}"]`);
      if(btn){ btn.click(); document.getElementById("hero-wrap").scrollIntoView({behavior:"smooth"}); }
    }
  });
}
function renderWhy(){
  $("why-grid").innerHTML=state.why.map(w=>`<article class="why-card"><h3>${esc(localizedRecordValue(w,"title",""))}</h3><p>${esc(localizedRecordValue(w,"text",""))}</p></article>`).join("");
}



/* ===== LONG-FORM HOME MODULES ===== */
function longCopy(key){
  const l=SKANDI_USER_SETTINGS?.language||"EN";
  const copy={
    EN:{
      value:"Value escape",smart:"Smart spend",comfort:"Comfort first",premium:"Premium trip",
      valueText:"Start with the best-priced published trips and flexible dates.",smartText:"Balance hotel quality, dates and total trip value.",comfortText:"Put the hotel and room experience first.",premiumText:"Start with Signature and higher-end stays.",browse:"Browse ideas",
      winter:"Winter sun",city:"City weekends",family:"Family time",shoulder:"Shoulder season",
      winterText:"Trade colder days for warmer destinations.",cityText:"Shorter breaks with more city time.",familyText:"Hotels and destinations that work for everyone.",shoulderText:"Travel between peak seasons and discover a different pace.",
      transfers:"Airport transfers",tours:"Tours & activities",cars:"Car rental",info:"Travel information",booking:"My Booking",
      transfersText:"Book SKANDI arrival and departure transport.",toursText:"Add local experiences before or during the trip.",carsText:"Keep the destination flexible with a rental car.",infoText:"Airports, airlines, baggage and destination guidance.",bookingText:"Keep confirmations, trip details and documents together.",
      guides:"Destination guides",airports:"Airport information",before:"Before you travel",guidesText:"Explore what to stay, do and know before choosing.",airportsText:"Plan terminals, lounges, transfers and airport time.",beforeText:"Passport, baggage, check-in and practical trip preparation.",open:"Open"
    },
    SV:{
      value:"Prisvärd resa",smart:"Smart budget",comfort:"Komfort först",premium:"Premiumresa",
      valueText:"Börja med de mest prisvärda publicerade resorna och flexibla datum.",smartText:"Balansera hotell, datum och resans totalvärde.",comfortText:"Låt hotellet och rumsupplevelsen styra valet.",premiumText:"Börja med Signature och mer exklusiva hotell.",browse:"Utforska",
      winter:"Vintersol",city:"Storstadsweekend",family:"Familjetid",shoulder:"Mellansäsong",
      winterText:"Byt kalla dagar mot varmare resmål.",cityText:"Kortare resor med mer tid i staden.",familyText:"Hotell och resmål som fungerar för hela familjen.",shoulderText:"Res mellan högsäsongerna och upplev ett lugnare tempo.",
      transfers:"Flygplatstransfer",tours:"Utflykter & aktiviteter",cars:"Hyrbil",info:"Reseinformation",booking:"Min bokning",
      transfersText:"Boka SKANDI-transfer vid ankomst och avresa.",toursText:"Lägg till lokala upplevelser före eller under resan.",carsText:"Upptäck resmålet friare med hyrbil.",infoText:"Flygplatser, flygbolag, bagage och resmålsinformation.",bookingText:"Samla bekräftelser, resedetaljer och dokument.",
      guides:"Resmålsguider",airports:"Flygplatsinformation",before:"Före resan",guidesText:"Se vad du kan bo, göra och veta innan du väljer.",airportsText:"Planera terminal, lounge, transfer och tid på flygplatsen.",beforeText:"Pass, bagage, incheckning och praktiska förberedelser.",open:"Öppna"
    },
    NO:{
      value:"Prisvennlig reise",smart:"Smart budsjett",comfort:"Komfort først",premium:"Premiumreise",
      valueText:"Start med de best prisede publiserte reisene og fleksible datoer.",smartText:"Balanser hotellkvalitet, datoer og totalverdi.",comfortText:"La hotell- og romopplevelsen styre valget.",premiumText:"Start med Signature og mer eksklusive opphold.",browse:"Utforsk",
      winter:"Vintersol",city:"Storbyhelger",family:"Familietid",shoulder:"Mellomsesong",
      winterText:"Bytt kalde dager mot varmere reisemål.",cityText:"Kortere turer med mer tid i byen.",familyText:"Hoteller og reisemål som fungerer for hele familien.",shoulderText:"Reis mellom høysesongene og opplev et roligere tempo.",
      transfers:"Flyplasstransfer",tours:"Turer og aktiviteter",cars:"Leiebil",info:"Reiseinformasjon",booking:"Min booking",
      transfersText:"Bestill SKANDI-transport ved ankomst og avreise.",toursText:"Legg til lokale opplevelser før eller under reisen.",carsText:"Utforsk reisemålet friere med leiebil.",infoText:"Flyplasser, flyselskaper, bagasje og reisemålsinfo.",bookingText:"Samle bekreftelser, reisedetaljer og dokumenter.",
      guides:"Reiseguider",airports:"Flyplassinformasjon",before:"Før du reiser",guidesText:"Se hva du kan bo, gjøre og vite før du velger.",airportsText:"Planlegg terminaler, lounger, transfer og flyplasstid.",beforeText:"Pass, bagasje, innsjekk og praktiske forberedelser.",open:"Åpne"
    },
    DA:{
      value:"Prisvenlig rejse",smart:"Smart budget",comfort:"Komfort først",premium:"Premiumrejse",
      valueText:"Start med de bedst prissatte publicerede rejser og fleksible datoer.",smartText:"Balancér hotel, datoer og rejsens samlede værdi.",comfortText:"Lad hotel- og værelsesoplevelsen styre valget.",premiumText:"Start med Signature og mere eksklusive ophold.",browse:"Udforsk",
      winter:"Vintersol",city:"Storbyweekender",family:"Familietid",shoulder:"Mellemsæson",
      winterText:"Byt kolde dage ud med varmere rejsemål.",cityText:"Kortere rejser med mere tid i byen.",familyText:"Hoteller og rejsemål der fungerer for hele familien.",shoulderText:"Rejs mellem højsæsonerne og oplev et roligere tempo.",
      transfers:"Lufthavnstransfer",tours:"Ture & aktiviteter",cars:"Billeje",info:"Rejseinformation",booking:"Min booking",
      transfersText:"Book SKANDI-transport ved ankomst og afrejse.",toursText:"Tilføj lokale oplevelser før eller under rejsen.",carsText:"Oplev rejsemålet mere frit med lejebil.",infoText:"Lufthavne, flyselskaber, bagage og rejsemålsinfo.",bookingText:"Saml bekræftelser, rejsedetaljer og dokumenter.",
      guides:"Rejseguider",airports:"Lufthavnsinformation",before:"Før du rejser",guidesText:"Se hvad du kan bo, gøre og vide før du vælger.",airportsText:"Planlæg terminaler, lounges, transfer og lufthavnstid.",beforeText:"Pas, bagage, check-in og praktiske forberedelser.",open:"Åbn"
    }
  };
  return (copy[l]||copy.EN)[key]||copy.EN[key]||key;
}
function editorialImages(){
  return [...state.destinations,...state.hotels,...state.inspiration,...state.offers]
    .map(x=>x.imageUrl||x.image).filter(Boolean);
}
function renderBudgetStrip(){
  const el=$("budget-strip"); if(!el)return;
  const cards=[
    ["value","valueText","offers"],
    ["smart","smartText","destinations"],
    ["comfort","comfortText","hotels"],
    ["premium","premiumText","skandiCollection"]
  ];
  el.innerHTML=cards.map(([title,text,key])=>`<article class="budget-card" data-route-key="${escAttr(key)}"><div><div class="budget-eyebrow">${esc(longCopy('browse'))}</div><strong>${esc(longCopy(title))}</strong><p>${esc(longCopy(text))}</p></div><span>${esc(longCopy('browse'))} →</span></article>`).join("");
  el.querySelectorAll('.budget-card').forEach(card=>card.onclick=()=>{
    const key=card.dataset.routeKey||"destinations";
    const path=routeByKey(key);
    send("HOME_NAVIGATE",{path});
  });
}
function renderSignaturePush(){
  const visual=$("signature-visual"); if(visual){const imgs=editorialImages();visual.setAttribute('style',imageStyle(imgs[1]||imgs[0]||''));}
  document.querySelectorAll('#signature-push [data-route-key="skandiCollection"]').forEach(btn=>btn.onclick=()=>send('HOME_NAVIGATE',{path:routeByKey('skandiCollection')}));
}
function routeIdeaDescriptor(item,index){
  const tags=(item.tags||[]).join(' ').toLowerCase();
  if(tags.includes('beach')||tags.includes('island')) return [longCopy('winter'),longCopy('winterText')];
  if(tags.includes('family')) return [longCopy('family'),longCopy('familyText')];
  if(index===0) return [longCopy('city'),longCopy('cityText')];
  return [longCopy('shoulder'),longCopy('shoulderText')];
}
function renderRouteIdeas(){
  const section=$("route-ideas-section"),grid=$("route-ideas-grid"); if(!section||!grid)return;
  const rows=state.destinations.slice(0,3); section.hidden=rows.length===0;
  if(!rows.length){grid.innerHTML='';return;}
  const card=(d,index,cls)=>{const [kicker,text]=routeIdeaDescriptor(d,index);const path=safeRouteValue(d.path,destinationsRoute());return `<article class="${cls}" data-path="${escAttr(path)}" style="${escAttr(imageStyle(d.imageUrl||d.image))}"><div class="route-copy"><small>${esc(kicker)}</small><h3>${esc(localizedRecordValue(d,'title',d.name||'Destination'))}</h3><p>${esc(localizedRecordValue(d,'summary',localizedRecordValue(d,'description',text)))}</p>${recordPrice(d)?`<span class="route-price">${esc(skandiTranslate('home.card.from'))} ${esc(recordPrice(d))}</span>`:''}</div></article>`};
  const first=card(rows[0],0,'route-feature');
  const side=rows.slice(1).map((d,i)=>card(d,i+1,'route-stack-card')).join('');
  grid.innerHTML=`${first}<div class="route-side">${side||card(rows[0],1,'route-stack-card')+card(rows[0],2,'route-stack-card')}</div>`;
  grid.querySelectorAll('[data-path]').forEach(c=>c.onclick=()=>send('HOME_NAVIGATE',{path:safeRouteValue(c.dataset.path,destinationsRoute())}));
}
function findRecentHotels(){
  const keys=['skandi_recent_hotels','skandi_recently_viewed_hotels','recentHotels'];
  for(const key of keys){
    try{
      const raw=JSON.parse(localStorage.getItem(key)||'null');
      if(!Array.isArray(raw)||!raw.length)continue;
      const out=[];
      raw.forEach(x=>{
        if(typeof x==='string'){
          const match=state.hotels.find(h=>h.id===x||h.path===x||h.slug===x||h.name===x); if(match)out.push(match);
        }else if(x&&typeof x==='object')out.push(x);
      });
      if(out.length)return out.slice(0,8);
    }catch(_){ }
  }
  return [];
}
function renderRecentlyViewed(){
  const section=$("recently-section"),rail=$("recently-rail"); if(!section||!rail)return;
  const rows=findRecentHotels(); section.hidden=rows.length===0;
  rail.innerHTML=rows.map(h=>`<article class="recent-card" data-path="${escAttr(safeRouteValue(h.path,masterRoute('hotels')))}"><div class="recent-img" style="${escAttr(imageStyle(h.imageUrl||h.image))}"></div><div class="recent-body"><small>${esc([h.city,h.country].filter(Boolean).join(' · ')||'SKANDI HOTEL')}</small><h3>${esc(localizedRecordValue(h,'title',h.name||'Hotel'))}</h3><p>${esc(recordPrice(h)?`${skandiTranslate('home.card.from')} ${recordPrice(h)}`:skandiTranslate('home.card.checkLive','Check live price'))}</p></div></article>`).join('');
  rail.querySelectorAll('.recent-card').forEach(c=>c.onclick=()=>send('HOME_NAVIGATE',{path:safeRouteValue(c.dataset.path,masterRoute('hotels'))}));
}
function renderServiceShop(){
  const el=$("service-shop-grid"); if(!el)return;
  const cards=[
    // 1. Airport Transfers (Clean Van/Shuttle)
    ['<svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 14v2c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>','transfers','transfersText','transfers'],
    
    // 2. Tours & Activities (Map with Folds)
    ['<svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>','tours','toursText','tours'],
    
    // 3. Car Rental (Clean Sedan)
    ['<svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a2 2 0 0 0-1.6-.8H9a2 2 0 0 0-2 2v2.4L3 12.5a2 2 0 0 0-1.2 1.8V17h3m10-1a2 2 0 1 0 4 0 2 2 0 0 0-4 0zm-12 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0z"/></svg>','cars','carsText','carRental'],
    
    // 4. Travel Information (Info Circle)
    ['<svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>','info','infoText','travelInfo'],
    
    // 5. My Booking (Luggage/Suitcase)
    ['<svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>','booking','bookingText','myTrip']
  ];
  
  el.innerHTML=cards.map(([icon,title,text,key],i)=>`
    <article class="service-push" data-route-key="${escAttr(key)}">
      <div class="service-icon">${icon}</div>
      <small>SKANDI ${i===0?'SERVICE':'TRAVEL'}</small>
      <h3>${esc(longCopy(title))}</h3>
      <p>${esc(longCopy(text))}</p>
      <div class="service-link">${esc(longCopy('open'))} →</div>
    </article>
  `).join('');
  
  el.querySelectorAll('.service-push').forEach(c=>c.onclick=()=>send('HOME_NAVIGATE',{path:routeByKey(c.dataset.routeKey)}));
}
function renderSeasonalRail(){
  const el=$("seasonal-rail");if(!el)return; const imgs=editorialImages();
  const cards=[['winter','winterText','destinations'],['city','cityText','destinations'],['family','familyText','destinations'],['shoulder','shoulderText','offers']];
  el.innerHTML=cards.map(([title,text,key],i)=>`<article class="season-card" data-route-key="${escAttr(key)}" style="${escAttr(imageStyle(imgs[i%Math.max(1,imgs.length)]||''))}"><div class="season-copy"><small>SKANDI TRAVEL IDEA</small><h3>${esc(longCopy(title))}</h3><p>${esc(longCopy(text))}</p></div></article>`).join('');
  el.querySelectorAll('.season-card').forEach(c=>c.onclick=()=>send('HOME_NAVIGATE',{path:routeByKey(c.dataset.routeKey)}));
}
function renderGuidePush(){
  const el=$("guide-grid");if(!el)return;
  const rows=[['01','guides','guidesText','destinations'],['02','airports','airportsText','travelInfo'],['03','before','beforeText','travelInfo']];
  el.innerHTML=rows.map(([n,title,text,key])=>`<article class="guide-card" data-route-key="${escAttr(key)}"><div class="guide-num">${esc(n)} / SKANDI GUIDE</div><h3>${esc(longCopy(title))}</h3><p>${esc(longCopy(text))}</p><span>${esc(longCopy('open'))} →</span></article>`).join('');
  el.querySelectorAll('.guide-card').forEach(c=>c.onclick=()=>send('HOME_NAVIGATE',{path:routeByKey(c.dataset.routeKey)}));
}
function renderLongHomeModules(){
  renderBudgetStrip();
  renderSignaturePush();
  renderRouteIdeas();
  renderRecentlyViewed();
  renderServiceShop();
  renderSeasonalRail();
  renderGuidePush();
}

function fallbackTripTypes(){
  return [
    {
      title: skandiTranslate("home.card.lastMinute"), 
      text: skandiTranslate("home.card.lastMinuteText"), 
      icon: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`, 
      routeKey:"offers"
    },
    {
      title: skandiTranslate("home.card.flightHotel"), 
      text: skandiTranslate("home.card.flightHotelText"), 
      // Combines exact same plane path as 'onlyFlights' with a hotel building
      icon: `<svg viewBox="0 0 24 24">
               <path d="M4 21h16M6 21v-7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v7M10 17h4v4h-4z"/>
               <g transform="scale(0.42) translate(10, -5)">
                 <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
               </g>
             </svg>`, 
      routeKey:"packages",
      action: "holidays"
    },
    {
      title: skandiTranslate("home.card.onlyFlights"), 
      text: skandiTranslate("home.card.onlyFlightsText"), 
      icon: `<svg viewBox="0 0 24 24"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>`, 
      routeKey:"flights", 
      action: "flights"
    },
    {
      title: skandiTranslate("home.card.onlyHotels"), 
      text: skandiTranslate("home.card.onlyHotelsText"), 
      // Remade Hotel Icon with clean architectural lines and windows
      icon: `<svg viewBox="0 0 24 24">
               <path d="M3 21h18M3 7h18M5 21V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v14"/>
               <path d="M9 11h2v2H9zm4 0h2v2h-2zm-4 4h2v2H9zm4 0h2v2h-2z"/>
             </svg>`, 
      routeKey:"hotels", 
      action: "hotels"
    },
    {
      title: skandiTranslate("home.card.signatureCollection"), 
      text: skandiTranslate("home.card.signatureCollectionText"), 
      icon: `<svg viewBox="0 0 24 24"><polygon points="12 2 15 8 21 9 16.5 14 18 20 12 17 6 20 7.5 14 3 9 9 8 12 2"/></svg>`, 
      routeKey:"skandiCollection"
    },
    {
      title: skandiTranslate("home.card.travelGuides"), 
      text: skandiTranslate("home.card.travelGuidesText"), 
      icon: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>`, 
      routeKey:"destinations"
    }
  ];
}
function fallbackWhy(){
  return [
    {title:skandiTranslate("home.why.curated"), text:skandiTranslate("home.why.curatedText")},
    {title:skandiTranslate("home.why.secure"), text:skandiTranslate("home.why.secureText")},
    {title:skandiTranslate("home.why.documents"), text:skandiTranslate("home.why.documentsText")},
    {title:skandiTranslate("home.why.support"), text:skandiTranslate("home.why.supportText")}
  ];
}
function fallbackTrust(){
  return [
    {title:skandiTranslate("home.trust.noSurprise"), text:skandiTranslate("home.trust.noSurpriseText")},
    {title:skandiTranslate("home.trust.packageClarity"), text:skandiTranslate("home.trust.packageClarityText")},
    {title:skandiTranslate("home.trust.myProfile"), text:skandiTranslate("home.trust.myProfileText")},
    {title:skandiTranslate("home.trust.club"), text:skandiTranslate("home.trust.clubText")}
  ];
}

function mapCabin(value){
  const normalized=String(value||"").toUpperCase();
  if(["ECONOMY","PREMIUM_ECONOMY","BUSINESS","FIRST"].includes(normalized)) return normalized;
  if(normalized.includes("PREMIUM"))return "PREMIUM_ECONOMY";
  if(normalized.includes("BUSINESS"))return "BUSINESS";
  if(normalized.includes("FIRST"))return "FIRST";
  return "ECONOMY";
}
function getFlightSearch(){
  return {
    tripType:"flightOnly",
    origin:$("fromIata").value || extractIata($("from").value),
    destination:$("toIata").value || extractIata($("to").value),
    departureDate:$("depart").value,
    returnDate:$("return").value,
    adults:state.adults,
    children:state.children,
    infants:state.infants,
    childAges:[...state.childAges],
    infantAges:[...state.infantAges],
    travelClass:mapCabin($("travelClass").value),
    nonStop:false,
    currency: SKANDI_USER_SETTINGS.currency || "USD"
  };
}

function getHolidaySearch(){
  ensureLocationSelection("hol-from-search");
  ensureLocationSelection("hol-destination-search");
  const dep=$("hol-departure-date").value, ret=$("hol-return-date").value;
  const nights=nightsBetween(dep,ret);
  const destinationCode=$("hol-destination").value;
  const destinationIata=$("hol-destination-iata").value;
  return {
    tripType:"package",
    origin:$("hol-from-iata").value,
    destination:destinationIata||destinationCode,
    destinationCode,
    destinationRegion:destinationCode,
    destinationIata,
    destinationType:$("hol-destination-type").value,
    destinationLabel:$("hol-destination-search").value.trim(),departureLabel:$("hol-from-search").value.trim(),
    departureDate:dep,returnDate:ret,nights,
    adults:state.adults,children:state.children,infants:state.infants,
    childAges:[...state.childAges],infantAges:[...state.infantAges],
    currency: SKANDI_USER_SETTINGS.currency || "USD"
  };
}

function getHotelSearch(){
  ensureLocationSelection("hotel-destination-search");
  const destinationCode=$("hotel-destination").value;
  const destinationIata=$("hotel-destination-iata").value;
  return {
    tripType:"hotelOnly",
    destination:destinationIata||destinationCode,
    destinationCode,
    destinationRegion:destinationCode,
    destinationIata,
    destinationType:$("hotel-destination-type").value,
    destinationLabel:$("hotel-destination-search").value.trim(),
    departureDate:$("hotel-in").value,
    returnDate:$("hotel-out").value,
    rooms:Number($("hotel-rooms").value||1),
    adults:state.adults,
    children:state.children,
    childAges:[...state.childAges],
    currency: SKANDI_USER_SETTINGS.currency || "USD"
  };
}

function getSignatureSearch(){
  ensureLocationSelection("sig-from-search");
  ensureLocationSelection("sig-destination-search");
  const dep=$("sig-departure-date").value, ret=$("sig-return-date").value;
  const nights=nightsBetween(dep,ret);
  const destinationCode=$("sig-destination").value;
  const destinationIata=$("sig-destination-iata").value;
  return {
    tripType:"signaturePackage",
    origin:$("sig-from-iata").value,
    destination:destinationIata||destinationCode,
    destinationCode,
    destinationRegion:destinationCode,
    destinationIata,
    destinationType:$("sig-destination-type").value,
    destinationLabel:$("sig-destination-search").value.trim(),departureLabel:$("sig-from-search").value.trim(),
    departureDate:dep,returnDate:ret,nights,
    adults:state.adults,children:state.children,infants:state.infants,
    childAges:[...state.childAges],infantAges:[...state.infantAges],
    currency: SKANDI_USER_SETTINGS.currency || "USD"
  };
}
function extractIata(label){
  const m=String(label||"").match(/\(([A-Z]{3})\)/);
  return m ? m[1] : String(label||"").trim().toUpperCase().slice(0,3);
}
function getHolidaySearch(){
  ensureLocationSelection("hol-from-search");
  ensureLocationSelection("hol-destination-search");
  const dep=$("hol-departure-date").value, ret=$("hol-return-date").value;
  const nights=nightsBetween(dep,ret);
  const destinationCode=$("hol-destination").value;
  const destinationIata=$("hol-destination-iata").value;
  return {
    tripType:"package",
    origin:$("hol-from-iata").value,
    destination:destinationIata||destinationCode,
    destinationCode,
    destinationRegion:destinationCode,
    destinationIata,
    destinationType:$("hol-destination-type").value,
    destinationLabel:$("hol-destination-search").value.trim(),departureLabel:$("hol-from-search").value.trim(),
    departureDate:dep,returnDate:ret,nights,
    adults:state.adults,children:state.children,infants:state.infants,
    childAges:[...state.childAges],infantAges:[...state.infantAges],currency:$("currencyHolidays").value
  };
}
function getHotelSearch(){
  ensureLocationSelection("hotel-destination-search");
  const destinationCode=$("hotel-destination").value;
  const destinationIata=$("hotel-destination-iata").value;
  return {
    tripType:"hotelOnly",
    destination:destinationIata||destinationCode,
    destinationCode,
    destinationRegion:destinationCode,
    destinationIata,
    destinationType:$("hotel-destination-type").value,
    destinationLabel:$("hotel-destination-search").value.trim(),
    departureDate:$("hotel-in").value,
    returnDate:$("hotel-out").value,
    rooms:Number($("hotel-rooms").value||1),
    adults:state.adults,
    children:state.children,
    childAges:[...state.childAges],
    currency:$("currencyHotels").value
  };
}
function getSignatureSearch(){
  ensureLocationSelection("sig-from-search");
  ensureLocationSelection("sig-destination-search");
  const dep=$("sig-departure-date").value, ret=$("sig-return-date").value;
  const nights=nightsBetween(dep,ret);
  const destinationCode=$("sig-destination").value;
  const destinationIata=$("sig-destination-iata").value;
  return {
    tripType:"signaturePackage",
    origin:$("sig-from-iata").value,
    destination:destinationIata||destinationCode,
    destinationCode,
    destinationRegion:destinationCode,
    destinationIata,
    destinationType:$("sig-destination-type").value,
    destinationLabel:$("sig-destination-search").value.trim(),departureLabel:$("sig-from-search").value.trim(),
    departureDate:dep,returnDate:ret,nights,
    adults:state.adults,children:state.children,infants:state.infants,
    childAges:[...state.childAges],infantAges:[...state.infantAges],currency:$("currencySignature").value
  };
}
function validateSearch(search){
  if(search.tripType==="flightOnly" && (!search.origin || !search.destination)) return skandiTranslate("home.status.selectRoute");
  if((search.tripType==="package"||search.tripType==="signaturePackage") && (!search.origin || !search.destination)) return skandiTranslate("home.status.selectPackageRoute");
  if(search.tripType==="hotelOnly" && !search.destination) return skandiTranslate("home.status.enterHotelDestination");
  if(!search.departureDate) return skandiTranslate("home.status.selectDepartureDate");
  if(!search.returnDate) return skandiTranslate("home.status.selectReturnDate","Select a To date.");
  if(search.returnDate<=search.departureDate) return skandiTranslate("home.status.invalidDateRange","To date must be after From date.");
  return "";
}
function runSearch(mode, overrideSearch=null){
  const search = overrideSearch || (mode==="flights"?getFlightSearch():mode==="holidays"?getHolidaySearch():mode==="hotels"?getHotelSearch():mode==="signature"?getSignatureSearch():getHolidaySearch());
  const warning=validateSearch(search);
  if(warning){ showInlineStatus(warning,true); return; }
  
  state.lastSearch=search;
  
  // Activate button loading state
  const btn = document.querySelector(`[data-search="${mode}"]`);
  if(btn) btn.classList.add("loading");
  
  showPageLoader(true);
  
  document.body.classList.add("search-mode");
  $("selectorTitle").textContent = titleForSearch(search);
  $("selectorSummary").textContent = summaryForSearch(search);
  $("flight-results-list").innerHTML = "";
  showStatus(skandiTranslate("home.status.searching"));
  setLoading(true);
  send("HOME_SEARCH",{search});
}
function titleForSearch(s){
  if(s.tripType==="flightOnly") return `${s.origin} → ${s.destination}`;
  if(s.tripType==="hotelOnly") return skandiInterpolate("home.title.hotelsIn",{destination:s.destination});
  if(s.tripType==="signaturePackage") return skandiTranslate("home.card.signatureCollection");
  return skandiTranslate("home.title.holidayPackages");
}
function summaryForSearch(s){
  const adultCount=Number(s.adults||1);
  const childCount=Number(s.children||0);
  const adultLabel=adultCount===1?skandiTranslate("home.summary.adult"):skandiTranslate("home.summary.adults");
  const childLabel=childCount===1?skandiTranslate("home.summary.child"):skandiTranslate("home.summary.children");
  return `${formatDate(s.departureDate)}${s.returnDate?" – "+formatDate(s.returnDate):""} • ${adultCount} ${adultLabel}${childCount?` • ${childCount} ${childLabel}`:""}`;
}
function setLoading(v){
  document.querySelectorAll("[data-search]").forEach(btn=>{
    if(!btn.dataset.originalText)btn.dataset.originalText=btn.textContent.trim();
    const key=btn.getAttribute("data-i18n")||"";
    btn.disabled=Boolean(v);
    btn.textContent=v
      ? skandiTranslate("home.status.searchingShort")
      : skandiTranslate(key,btn.dataset.originalText);
  });
}
function showStatus(msg,isError=false,ok=false){
  const status=$("flight-status");
  status.innerHTML=`<div class="status-card ${isError?"error":ok?"ok":""}">${esc(msg)}</div>`;
}
function showInlineStatus(msg,isError=false){
  const panel=document.querySelector(".tab-panel.active");
  let inline=panel.querySelector(".inline-status-card");
  if(!inline){ inline=document.createElement("div"); inline.className="inline-status-card"; inline.style.marginTop="14px"; panel.appendChild(inline); }
  inline.innerHTML=`<div class="status-card ${isError?"error":""}">${esc(msg)}</div>`;
}
function renderResults(items=[]){
  showPageLoader(false);
  document.querySelectorAll(".search-submit").forEach(b => b.classList.remove("loading"));
  state.lastResults=items;
  setLoading(false);
  if(!items.length){
    $("flight-results-list").innerHTML="";
    showStatus(skandiTranslate("home.status.noResults"),true);
    return;
  }
  showStatus(
    items.length===1
      ? skandiTranslate("home.status.foundOne")
      : skandiInterpolate("home.status.foundMany",{count:items.length}),
    false,
    true
  );
  $("flight-results-list").innerHTML=items.map((item,idx)=>`
    <article class="flight-card">
      <div class="flight-card-head">
        <div>
          <div class="flight-airline">${esc(item.sourceLabel||item.source||"SKANDI")}</div>
          <div class="flight-route">${esc(localizedRecordValue(item,"title",item.routeSummary||skandiTranslate("home.result.travelOffer")))}</div>
        </div>
        <div class="flight-price">${esc(money(item.price)||skandiTranslate("home.result.livePrice"))}</div>
      </div>
      <p style="color:#555;line-height:1.55">${esc(localizedRecordValue(item,"summary",localizedRecordValue(item,"description",item.termsSummary||skandiTranslate("home.result.summaryFallback"))))}</p>
      <div class="badge-row">${localizedRecordList(item,"badges").map(b=>`<span class="badge">${esc(b)}</span>`).join("")}</div>
      <div class="flight-meta">
        <div class="meta-box"><small>${esc(skandiTranslate("home.result.type"))}</small><strong>${esc(item.tripType||item.itemType||state.lastSearch?.tripType||skandiTranslate("home.result.travel"))}</strong></div>
        <div class="meta-box"><small>${esc(skandiTranslate("home.result.source"))}</small><strong>${esc(item.sourceLabel||item.source||"SKANDI")}</strong></div>
        <div class="meta-box"><small>${esc(skandiTranslate("home.result.check"))}</small><strong>${esc(skandiTranslate("home.result.revalidated"))}</strong></div>
      </div>
      <button type="button" class="select-flight-btn" data-index="${idx}">${esc(skandiTranslate("home.result.select"))}</button>
    </article>
  `).join("");
  document.querySelectorAll("[data-index]").forEach(btn=>btn.onclick=()=>send("HOME_SELECT_OFFER",{offer:state.lastResults[Number(btn.dataset.index)],search:state.lastSearch}));
}
function handleError(message){
  showPageLoader(false);
  document.querySelectorAll(".search-submit").forEach(b => b.classList.remove("loading"));
  setLoading(false);
  showStatus(message||skandiTranslate("home.status.searchFailed"),true);
}
function boot(){
  window.__SKANDI_HOME_BOOTED__ = true;
  initializeSkandiSettings();
  setupTabs();
  setupLocationSearch({inputId:"from",valueId:"fromIata",boxId:"fromSuggestions",kind:"flight",valueMode:"iata"});
  setupLocationSearch({inputId:"to",valueId:"toIata",boxId:"toSuggestions",kind:"flight",valueMode:"iata"});
  setupLocationSearch({inputId:"hol-from-search",valueId:"hol-from-iata",boxId:"hol-from-suggestions",kind:"departure",valueMode:"iata"});
  setupLocationSearch({inputId:"hol-destination-search",valueId:"hol-destination",boxId:"hol-destination-suggestions",kind:"destination",iataId:"hol-destination-iata",typeId:"hol-destination-type"});
  setupLocationSearch({inputId:"hotel-destination-search",valueId:"hotel-destination",boxId:"hotel-destination-suggestions",kind:"destination",iataId:"hotel-destination-iata",typeId:"hotel-destination-type"});
  setupLocationSearch({inputId:"sig-from-search",valueId:"sig-from-iata",boxId:"sig-from-suggestions",kind:"departure",valueMode:"iata"});
  setupLocationSearch({inputId:"sig-destination-search",valueId:"sig-destination",boxId:"sig-destination-suggestions",kind:"destination",iataId:"sig-destination-iata",typeId:"sig-destination-type"});
  setupDatePicker();
  setInitialDates();
  renderPax();
  // Add inside your boot() function
document.getElementById('swapAirports')?.addEventListener('click', () => {
  const fromInput = document.getElementById('from');
  const toInput = document.getElementById('to');
  const fromIata = document.getElementById('fromIata');
  const toIata = document.getElementById('toIata');
  
  // Swap values
  const tempVal = fromInput.value;
  fromInput.value = toInput.value;
  toInput.value = tempVal;
  
  const tempIata = fromIata.value;
  fromIata.value = toIata.value;
  toIata.value = tempIata;
});
  document.querySelectorAll("[data-counter]").forEach(btn=>btn.onclick=()=>clampPax(btn.dataset.counter, state[btn.dataset.counter]+Number(btn.dataset.step||0)));
  document.querySelectorAll("[data-search]").forEach(btn=>btn.onclick=()=>runSearch(btn.dataset.search));
  document.querySelectorAll("[data-nav]").forEach(btn=>btn.onclick=()=>navigateParent(btn.dataset.nav));
  document.querySelectorAll("button[data-route-key]").forEach(btn=>btn.onclick=()=>{
    const key=btn.dataset.routeKey;
    send("HOME_NAVIGATE",{path:routeByKey(key)});
  });
  $("editSearchButton").onclick=()=>{ document.body.classList.remove("search-mode"); window.scrollTo({top:0,behavior:"smooth"}); };
  $("flight-results-list").addEventListener("click",()=>{});
  renderBootstrap({});
  applyTranslations();
  send("MASTER_CONFIG_REQUEST",{context:"home"});
  send("MASTER_NAVIGATION_REQUEST",{context:"home"});
  send("HOME_READY",{settings:{...SKANDI_USER_SETTINGS},priceSearch:{checkInDate:state.dateRanges.holidays.from,checkOutDate:state.dateRanges.holidays.to,adults:state.adults,children:state.children,childAges:[...state.childAges],rooms:1}});
  send("HOME_LOCATIONS_REQUEST",{});
  document.addEventListener("visibilitychange",()=>{
    if(!document.hidden&&state.lastBootstrapAt&&Date.now()-state.lastBootstrapAt>300000){
      send("HOME_REFRESH",{priceSearch:{checkInDate:state.dateRanges.holidays.from,checkOutDate:state.dateRanges.holidays.to,adults:state.adults,children:state.children,childAges:[...state.childAges],rooms:Number($("hotel-rooms")?.value||1)}});
    }
  });
}
window.addEventListener("message",event=>{
  const msg=event.data||{};
  if(msg.source!==PARENT)return;
  if(msg.type==="SKANDI_MASTER_CONFIG" || msg.type==="SKANDI_MASTER_NAVIGATION"){
    const payload=msg.payload||{};
    MASTER_CONTEXT={
      ...MASTER_CONTEXT,
      ...payload,
      routes:{...ROUTE_DEFAULTS,...(MASTER_CONTEXT.routes||{}),...(payload.routes||{})},
      customer:payload.customer||MASTER_CONTEXT.customer||{}
    };
    // Content rendered before masterPage.js answers is re-rendered so every CTA uses the live route contract.
    renderLongHomeModules();
    renderTripTypes();
  }
  if(msg.type==="HOME_HOST_READY"){
    state.hostReady=msg.payload||{};
    console.info("[SKANDI Home] Wix bridge ready",state.hostReady);
    // Re-send the child handshake after the host explicitly confirms binding.
    send("HOME_READY",{settings:{...SKANDI_USER_SETTINGS},priceSearch:{checkInDate:state.dateRanges.holidays.from,checkOutDate:state.dateRanges.holidays.to,adults:state.adults,children:state.children,childAges:[...state.childAges],rooms:1}});
  }
  if(msg.type==="HOME_LOCATION_DATA")renderLocationData(msg.payload||{});
  if(msg.type==="HOME_BOOTSTRAP_RESULT")renderBootstrap(msg.payload||{});
  if(msg.type==="HOME_SEARCH_RESULT")renderResults(msg.payload?.items||[]);
  if(msg.type==="HOME_NAVIGATE_TO_OFFER")showStatus(skandiTranslate("home.status.offerSaved"),false,true);
  if(msg.type==="HOME_FOCUS_SEARCH"){
    document.body.classList.remove("search-mode");
    document.getElementById("hero-wrap")?.scrollIntoView({behavior:"smooth",block:"start"});
    window.setTimeout(()=>document.getElementById("from")?.focus(),350);
  }
  if(msg.type==="FOOTER_NEWSLETTER_RESULT"){
    const toast=document.getElementById("skandiToast");
    if(toast){
      const newsletterCode=String(msg.payload?.code||"");
      const newsletterMessage =
        newsletterCode==="EMAIL_REQUIRED"
          ? skandiTranslate("toast.newsletterEmailRequired")
          : newsletterCode==="ALREADY_ACTIVE"
            ? skandiTranslate("toast.newsletterAlreadyActive")
            : newsletterCode==="SUBSCRIBED"
              ? skandiTranslate("toast.newsletterThanks")
              : newsletterCode==="SIGNUP_FAILED"
                ? skandiTranslate("toast.newsletterFailed")
                : (msg.payload?.message || (msg.payload?.ok ? skandiTranslate("toast.newsletterThanks") : skandiTranslate("toast.newsletterFailed")));
      toast.textContent=newsletterMessage;
      toast.classList.toggle("error",!msg.payload?.ok);
      toast.classList.add("show");
      window.setTimeout(()=>toast.classList.remove("show"),3200);
    }
  }
  if(msg.type==="HOME_ERROR")handleError(msg.message || msg.payload?.message);
});
/* Typewriter Effect for Destination Inputs */
const destinations = ["Palma de Mallorca...", "Phuket, Thailand...", "New York (JFK)...", "a sunny beach...", "a city weekend..."];
let destIndex = 0;
let charIndex = 0;
let isDeleting = false;
const destInput = document.getElementById("hol-destination-search");

function typeWriter() {
  if (!destInput) return;
  const currentWord = destinations[destIndex];
  
  if (isDeleting) {
    destInput.setAttribute("placeholder", "Search " + currentWord.substring(0, charIndex - 1));
    charIndex--;
  } else {
    destInput.setAttribute("placeholder", "Search " + currentWord.substring(0, charIndex + 1));
    charIndex++;
  }

  let typeSpeed = isDeleting ? 40 : 80;

  if (!isDeleting && charIndex === currentWord.length) {
    typeSpeed = 2000; // Pause at the end of the word
    isDeleting = true;
  } else if (isDeleting && charIndex === 0) {
    isDeleting = false;
    destIndex = (destIndex + 1) % destinations.length;
    typeSpeed = 300; // Pause before typing next word
  }
  setTimeout(typeWriter, typeSpeed);
}
// Automatically report height changes to the Wix parent
const resizeObserver = new ResizeObserver(() => {
  // Adding a 40px buffer prevents scrollbar flickering
  send("RESIZE_IFRAME", { height: document.documentElement.scrollHeight + 40 });
});
resizeObserver.observe(document.body);
// Start it
setTimeout(typeWriter, 1000);
boot();


</script>
</body>
</html>
