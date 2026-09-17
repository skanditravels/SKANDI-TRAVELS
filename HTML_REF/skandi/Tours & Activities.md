# Home

STATUS: NEEDS REVIEW
SLUG: /tours
WIX PAGE: Tours & Activities.jxipw
AREA: SKANDI
LIVE HTML: YES
ELEMENT: #toursActivitiesHtml
LAST SYNCED: 2026-09-16

## HOW TO USE
***STATUS (OWNER): "TODO", "IN PROGRESS", "NEEDS REVIEW", "REVISIONS NEEDED", "READY", "LIVE", "ARCHIVED"
STATUS (AGENT): "TODO", "IN PROGRESS", "REVISIONS NEEDED", "READY".***

###  COMMENT SECTION (START ON A NEW ROW, LOG IF A CHANGE IS MADE THAT REQUIRES ATTENTION) 
1. 9/17 3:47PM "This page's pagecode is still using old paths and backends. Review. backend/destinationInventory.web , backend/FINAL/toursActivitiesService.web are wrong." / Samuel
2.
3.
...
***END*** 

#### LIVE HTML

```html
<!DOCTYPE html>

<html lang="en"><head><meta charset="utf-8"/><meta content="width=device-width,initial-scale=1,viewport-fit=cover" name="viewport"/><meta content="#022e64" name="theme-color"/><title>SKANDI Tours &amp; Activities</title><link href="https://fonts.googleapis.com" rel="preconnect"/><link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/><link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900&amp;family=Playfair+Display:wght@600;700;800&amp;display=swap" rel="stylesheet"/><style>
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

/* HERO + OLD-STYLE SEARCH */
#hero-wrap{
  transition: all 0.3s ease;    
  width:100%;
  min-height:520px;
  background: url("https://static.wixstatic.com/media/394052_9a01a12b7bbf4524a3b4ae7c2652477e~mv2.png") center/cover;
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

/* ----------------------------------------------------
   PREMIUM SLIDE-OUT PANEL & STAGGERED ANIMATIONS
------------------------------------------------------- */

/* 1. Backdrop */
#skandi-site-header .club-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(2, 18, 39, 0.5);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  z-index: 9998;
  opacity: 0;
  visibility: hidden;
  transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
}
#skandi-site-header .club-backdrop.open {
  opacity: 1;
  visibility: visible;
}

/* 2. Slide-In Panel */
#skandi-site-header .club-panel {
  position: fixed;
  top: 0;
  right: 0;
  height: 100dvh;
  width: min(440px, 100vw);
  background: #ffffff;
  box-shadow: -20px 0 60px rgba(2, 46, 100, 0.15);
  z-index: 9999;
  
  /* Premium curved corners on the left edge */
  border-top-left-radius: 28px;
  border-bottom-left-radius: 28px;
  overflow: hidden;
  
  /* Custom smooth deceleration curve */
  transform: translateX(100%);
  opacity: 0;
  pointer-events: none;
  transition: transform 0.55s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.55s ease;
  display: flex;
  flex-direction: column;
}

#skandi-site-header .club-panel.open {
  transform: translateX(0);
  opacity: 1;
  pointer-events: auto;
}

/* 3. Panel Header */
#skandi-site-header .club-head {
  height: 82px;
  background: linear-gradient(135deg, var(--sk-blue), var(--sk-blue2));
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 28px;
  position: relative;
  z-index: 2;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
}
#skandi-site-header .club-head strong {
  font-size: 16px;
  font-weight: 800;
  letter-spacing: -0.02em;
}
#skandi-site-header .club-close {
  border: 1px solid rgba(255, 255, 255, 0.28);
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  width: 38px;
  height: 38px;
  border-radius: 999px;
  font-size: 22px;
  line-height: 1;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}
#skandi-site-header .club-close:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: rotate(90deg) scale(1.05);
}

/* 4. Panel Body & Staggered Elements */
#skandi-site-header .club-body {
  padding: 36px 28px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  overflow-y: auto;
  position: relative;
}

/* Initial state for cascading animation */
#skandi-site-header .club-profile,
#skandi-site-header .login-form > * {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.4s ease, transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
}

/* Active state for cascading animation with delays */
#skandi-site-header .club-panel.open .club-profile {
  opacity: 1;
  transform: translateY(0);
  transition-delay: 0.1s;
}
#skandi-site-header .club-panel.open .login-form > *:nth-child(1) { /* Email */
  opacity: 1;
  transform: translateY(0);
  transition-delay: 0.18s;
}
#skandi-site-header .club-panel.open .login-form > *:nth-child(2) { /* Password */
  opacity: 1;
  transform: translateY(0);
  transition-delay: 0.26s;
}
#skandi-site-header .club-panel.open .login-form > *:nth-child(3) { /* Button */
  opacity: 1;
  transform: translateY(0);
  transition-delay: 0.34s;
}
#skandi-site-header .club-panel.open .login-form > *:nth-child(4) { /* Links */
  opacity: 1;
  transform: translateY(0);
  transition-delay: 0.42s;
}

/* Premium Form Styling */
#skandi-site-header .login-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
}
#skandi-site-header .login-form input {
  padding: 16px 18px;
  border: 1px solid #d1d8e0;
  border-radius: 12px;
  font-size: 14px;
  background: #f9fafb;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
  transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}
#skandi-site-header .login-form input:focus {
  outline: none;
  border-color: var(--sk-cyan);
  background: #fff;
  box-shadow: 0 0 0 4px rgba(95, 199, 207, 0.15);
  transform: translateY(-1px);
}
#skandi-site-header .login-form .submit-btn {
  background: linear-gradient(135deg, var(--sk-blue), var(--sk-blue2));
  color: #fff;
  border: none;
  padding: 16px;
  border-radius: 12px;
  font-weight: 800;
  font-size: 15px;
  cursor: pointer;
  margin-top: 8px;
  transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
  box-shadow: 0 8px 20px rgba(2, 46, 100, 0.2);
}
#skandi-site-header .login-form .submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(2, 46, 100, 0.3);
  background: linear-gradient(135deg, #033a7e, #0d4694);
}
#skandi-site-header .login-form .submit-btn:active {
  transform: translateY(0);
  box-shadow: 0 4px 12px rgba(2, 46, 100, 0.2);
}
#skandi-site-header .login-links {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 12px;
  text-align: center;
}
#skandi-site-header .login-links button {
  background: transparent;
  border: none;
  color: var(--sk-blue);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: color 0.2s ease;
}
#skandi-site-header .login-links button:hover {
  color: var(--sk-cyan);
}
/* ---------------------------------------------------- */


#hero-title{
  font-size:clamp(40px,5vw,64px);
  line-height:.95;
  letter-spacing:-.06em;
  font-weight:600;
  color:var(--sk-blue);
  margin-bottom:12px;
}
#hero-sub{
  font-size:16px;
  color:#475467;
  line-height:1.65;
  max-width:720px;
  margin-bottom:34px;
}
#search-tabs{
  background:#fff;
  border:1px solid rgba(219,227,239,.92);
  border-radius:18px;
  box-shadow:0 12px 38px rgba(0,0,0,.13);
  width:100%;
  max-width:980px;
  text-align:left;
  overflow:visible;
}
#tab-header{
  display:flex;
  overflow-x:auto;
  border-bottom:1px solid var(--sk-border-soft);
  scrollbar-width:thin;
}
.tab-btn{
  flex:1 0 auto;
  min-width:148px;
  padding:17px 12px;
  text-align:center;
  font-size:13px;
  font-weight:800;
  cursor:pointer;
  border:0;
  border-bottom:3px solid transparent;
  color:#475467;
  background:#fff;
  transition:.18s ease;
}
.tab-btn.active{
  color:var(--sk-blue);
  border-bottom-color:var(--sk-blue);
  background:var(--sk-bg);
}
#tab-content{padding:24px 26px 28px}
.tab-panel{display:none}
.tab-panel.active{display:block}
.field-row{
  display:flex;
  gap:14px;
  margin-bottom:14px;
}
.field{
  flex:1;
  display:flex;
  flex-direction:column;
  gap:6px;
  min-width:0;
}
.field label{
  font-size:11px;
  opacity:.82;
  font-weight:700;
  color:#475467;
}
.field input,.field select{
  padding:13px 12px;
  border-radius:10px;
  border:1px solid #d1d8e0;
  font-size:14px;
  width:100%;
  min-height:46px;
  background:#fff;
}
.field input:focus,.field select:focus{
  outline:0;
  border-color:var(--sk-blue);
  box-shadow:0 0 0 3px rgba(2,46,100,.08);
}
.search-submit{
  width:100%;
  margin-top:10px;
  padding:15px;
  border-radius:999px;
  background:var(--sk-blue);
  color:#fff;
  border:none;
  font-size:15px;
  font-weight:800;
  cursor:pointer;
  transition:.18s ease;
}
.search-submit:hover{
  background:#03438b;
  transform:translateY(-1px);
}
.search-submit:disabled{opacity:.6;cursor:not-allowed}
.airport-field{position:relative}
.airport-suggestions{
  display:none;
  position:absolute;
  z-index:60;
  top:100%;
  left:0;
  right:0;
  background:#fff;
  border:1px solid #d1d8e0;
  border-radius:12px;
  box-shadow:0 14px 34px rgba(0,0,0,.12);
  overflow:hidden;
  max-height:280px;
  overflow-y:auto;
}
.airport-suggestions.active{display:block}
.airport-option{
  width:100%;
  border:0;
  background:#fff;
  padding:12px 14px;
  text-align:left;
  cursor:pointer;
  border-bottom:1px solid #eef2f7;
}
.airport-option:hover{background:var(--sk-bg)}
.airport-option strong{color:var(--sk-blue)}
.airport-option small{display:block;margin-top:3px;color:#666;line-height:1.35}
.date-range-button{
  width:100%;
  padding:14px 16px;
  border:1px solid #d1d8e0;
  background:#fff;
  border-radius:10px;
  display:flex;
  align-items:center;
  gap:16px;
  cursor:pointer;
  font-size:14px;
  color:var(--sk-blue);
  min-height:46px;
}
.date-line{flex:1;height:1px;background:#aebbd0}
.pax-row small{color:#666;font-size:11px}
.counter{
  display:flex;
  align-items:center;
  justify-content:space-between;
  border:1px solid #d1d8e0;
  border-radius:10px;
  overflow:hidden;
  background:#fff;
  min-height:46px;
}
.counter button{
  width:44px;
  height:44px;
  border:0;
  background:var(--sk-bg);
  font-size:22px;
  color:var(--sk-blue);
  cursor:pointer;
}
.counter span{font-weight:800;color:var(--sk-blue)}
.helper-row{
  display:flex;
  gap:10px;
  flex-wrap:wrap;
  margin-top:12px;
}
.helper-pill{
  border:1px solid #dbe3ef;
  border-radius:999px;
  background:#fff;
  color:var(--sk-blue);
  padding:8px 11px;
  font-size:11px;
  font-weight:800;
}

/* SEARCH RESULTS MODE */
#flight-selector{display:none}
body.search-mode #flight-selector{display:block}
body.search-mode .content-section:not(#flight-selector),
body.search-mode #why,
body.search-mode #hero-wrap{
  display:none;
}
.content-section{
  padding:58px 32px;
  max-width:1180px;
  margin:0 auto;
}
.selector-topbar{
  display:flex;
  justify-content:space-between;
  align-items:flex-start;
  gap:20px;
  margin-bottom:22px;
}
.selector-kicker{
  font-size:12px;
  font-weight:800;
  text-transform:uppercase;
  letter-spacing:.12em;
  color:var(--sk-cyan);
  margin-bottom:6px;
}
#selectorTitle{
  color:var(--sk-blue);
  font-size:32px;
  font-weight:700;
  letter-spacing:-.04em;
  margin-bottom:6px;
}
#selectorSummary{
  color:#555;
  font-size:14px;
}
.edit-btn,.secondary-btn{
  border:1px solid var(--sk-blue);
  background:#fff;
  color:var(--sk-blue);
  padding:11px 16px;
  border-radius:999px;
  font-weight:800;
  cursor:pointer;
}
#flight-status{margin-bottom:16px}
.status-card{
  padding:16px;
  border:1px solid var(--sk-border);
  background:var(--sk-bg);
  border-radius:14px;
  color:#475467;
  line-height:1.55;
}
.status-card.error{
  border-color:#ffd2d2;
  background:#fff6f6;
  color:var(--sk-danger);
}
.status-card.ok{
  border-color:#abefc6;
  background:#ecfdf3;
  color:var(--sk-ok);
}
.flight-card{
  background:#fff;
  border:1px solid #e0e6f2;
  border-radius:18px;
  box-shadow:0 10px 28px rgba(0,0,0,.08);
  padding:20px;
  margin-bottom:18px;
}
.flight-card-head{
  display:flex;
  justify-content:space-between;
  gap:16px;
  align-items:flex-start;
  border-bottom:1px solid #eef2f7;
  padding-bottom:16px;
  margin-bottom:16px;
}
.flight-airline{
  font-size:18px;
  color:var(--sk-blue);
  font-weight:800;
}
.flight-route{
  font-size:24px;
  color:#111;
  font-weight:800;
  margin-top:4px;
  letter-spacing:-.035em;
}
.flight-price{
  text-align:right;
  color:var(--sk-blue);
  font-weight:800;
  font-size:25px;
}
.flight-meta{
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(150px,1fr));
  gap:12px;
  margin-bottom:16px;
}
.meta-box{
  background:var(--sk-bg);
  border-radius:12px;
  padding:12px;
}
.meta-box small{display:block;color:#666;margin-bottom:4px}
.meta-box strong{color:var(--sk-blue)}
.badge-row{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}
.badge{
  display:inline-flex;
  background:#eef4ff;
  border:1px solid #dbe8ff;
  color:var(--sk-blue);
  border-radius:999px;
  padding:7px 10px;
  font-size:11px;
  font-weight:800;
}
.select-flight-btn{
  width:100%;
  padding:13px;
  border:0;
  border-radius:999px;
  background:var(--sk-blue);
  color:#fff;
  font-weight:800;
  cursor:pointer;
}

/* DATE PICKER */
.date-overlay{
  display:none;
  position:fixed;
  inset:0;
  z-index:999;
  background:rgba(2,46,100,.32);
  align-items:center;
  justify-content:center;
  padding:18px;
}
.date-overlay.active{display:flex}
.date-modal{
  width:min(860px,100%);
  background:#fff;
  border-radius:22px;
  box-shadow:0 20px 60px rgba(0,0,0,.25);
  padding:24px;
  max-height:92vh;
  overflow:auto;
}
.date-modal-head{
  display:flex;
  justify-content:space-between;
  gap:20px;
  align-items:flex-start;
  margin-bottom:16px;
}
.date-modal-head h3{
  color:var(--sk-blue);
  font-size:26px;
}
.date-modal-head h3 span{
  display:inline-block;
  width:120px;
  height:1px;
  background:#aebbd0;
  vertical-align:middle;
  margin:0 10px;
}
#closeDatePicker{
  border:0;
  background:var(--sk-bg);
  color:var(--sk-blue);
  width:38px;
  height:38px;
  border-radius:50%;
  font-size:24px;
}
.date-picked-line{
  display:flex;
  align-items:center;
  gap:16px;
  border:1px solid #e0e6f2;
  border-radius:14px;
  padding:12px 14px;
  margin-bottom:16px;
  color:var(--sk-blue);
  font-weight:700;
}
.date-picked-line span:nth-child(2){flex:1;height:1px;background:#aebbd0}
.calendar-nav{
  display:flex;
  justify-content:space-between;
  align-items:center;
  margin-bottom:14px;
}
.calendar-nav button{
  width:38px;height:38px;border:0;background:var(--sk-bg);color:var(--sk-blue);border-radius:50%;font-size:24px;
}
.calendar-grid{
  display:grid;
  grid-template-columns:repeat(2,1fr);
  gap:24px;
}
.month-box h4{color:var(--sk-blue);margin-bottom:10px}
.month-days,.month-weekdays{
  display:grid;
  grid-template-columns:repeat(7,1fr);
  gap:6px;
}
.month-weekdays div{
  font-size:11px;color:#777;text-align:center;padding:4px 0;
}
.day-btn{
  border:0;background:var(--sk-bg);min-height:38px;border-radius:10px;color:#111;
}
.day-btn:hover{background:#e9f4ff}
.day-btn.disabled{opacity:.3;cursor:not-allowed}
.day-btn.selected{background:var(--sk-blue);color:#fff}
.day-btn.in-range{background:#dcefff}
.date-actions{
  display:flex;
  justify-content:flex-end;
  gap:12px;
  margin-top:18px;
}
.date-actions button{
  padding:12px 16px;
  border-radius:999px;
  cursor:pointer;
  font-weight:800;
}
#clearDates{border:1px solid #d1d8e0;background:#fff;color:var(--sk-blue)}
#applyDates{border:0;background:var(--sk-blue);color:#fff}

/* HOMEPAGE CONTENT */
.section-title{
  font-size:30px;
  font-weight:700;
  color:var(--sk-blue);
  margin-bottom:8px;
  letter-spacing:-.04em;
}
.section-subtitle{
  color:#555;
  font-size:14px;
  line-height:1.6;
  margin-bottom:24px;
  max-width:780px;
}
#trust-strip{
  max-width:1180px;
  margin:-24px auto 0;
  padding:0 32px;
  position:relative;
  z-index:2;
}
.trust-grid{
  background:#fff;
  border:1px solid #e0e6f2;
  border-radius:18px;
  box-shadow:0 10px 30px rgba(0,0,0,.08);
  padding:16px;
  display:grid;
  grid-template-columns:repeat(4,1fr);
  gap:12px;
}
.trust-box{
  background:#f7faff;
  border-radius:14px;
  padding:14px;
}
.trust-box strong{
  color:var(--sk-blue);
  display:block;
  margin-bottom:4px;
  font-size:14px;
}
.trust-box span{
  color:#667085;
  font-size:12px;
  line-height:1.4;
}
.card-grid{
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(250px,1fr));
  gap:26px;
}
.dest-card,.offer-card,.type-card,.why-card{
  background:#fff;
  border:1px solid #edf0f5;
  border-radius:16px;
  overflow:hidden;
  box-shadow:var(--sk-shadow);
  cursor:pointer;
  transition:.24s ease;
}
.dest-card:hover,.offer-card:hover,.type-card:hover{
  transform:translateY(-5px);
  box-shadow:var(--sk-shadow-strong);
}
.card-img,.offer-img{
  width:100%;
  height:190px;
  background:#dfe7f2 center/cover;
  position:relative;
}
.card-code{
  position:absolute;
  left:14px;
  bottom:14px;
  background:rgba(255,255,255,.94);
  color:var(--sk-blue);
  border-radius:999px;
  padding:7px 10px;
  font-size:11px;
  font-weight:800;
}
.card-body,.offer-body,.type-body{
  padding:18px 20px;
}
.card-body h3,.offer-body h4,.type-body h3,.why-card h3{
  font-size:18px;
  font-weight:700;
  color:var(--sk-blue);
  margin-bottom:6px;
}
.card-body p,.offer-body p,.type-body p,.why-card p{
  font-size:13px;
  color:#555;
  line-height:1.55;
}
.dest-meta{
  display:flex;
  flex-wrap:wrap;
  gap:7px;
  margin-top:12px;
}
.dest-pill{
  border-radius:999px;
  background:#eef4ff;
  color:var(--sk-blue);
  border:1px solid #dbe8ff;
  padding:6px 8px;
  font-size:10px;
  font-weight:800;
}
.dest-price,.offer-price{
  color:#0a4b95;
  font-size:15px;
  font-weight:800;
  margin-top:10px;
}
#offers-section{background:var(--sk-bg);max-width:none;padding-left:32px;padding-right:32px}
#offers-section .inner{max-width:1180px;margin:0 auto}
.trip-type-grid{
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(180px,1fr));
  gap:16px;
}
.type-card{padding:0}
.type-icon{
  height:76px;
  background:linear-gradient(135deg,var(--sk-light),var(--sk-pale));
  color:var(--sk-blue);
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:28px;
}
#why{
  background:var(--sk-bg);
  padding:60px 32px;
  border-top:1px solid #e0e6f2;
  border-bottom:1px solid #e0e6f2;
}
#why-title{
  text-align:center;
  font-size:30px;
  font-weight:700;
  color:var(--sk-blue);
  margin-bottom:24px;
  letter-spacing:-.04em;
}
#why-grid{
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(250px,1fr));
  gap:24px;
  max-width:1180px;
  margin:0 auto;
}
.why-card{
  cursor:default;
  padding:26px 22px;
}
.newsletter-cta{
  max-width:1180px;
  margin:0 auto;
  background:linear-gradient(135deg,var(--sk-blue),var(--sk-blue-soft));
  color:#fff;
  border-radius:18px;
  padding:28px;
  display:grid;
  grid-template-columns:1fr auto;
  align-items:center;
  gap:20px;
}
.newsletter-cta strong{
  display:block;
  font-size:22px;
  margin-bottom:6px;
}
.newsletter-cta p{color:rgba(255,255,255,.85);font-size:13px}
.newsletter-cta button{
  border:0;
  background:#fff;
  color:var(--sk-blue);
  border-radius:999px;
  padding:12px 18px;
  font-weight:800;
}

/* RESPONSIVE */
@media(max-width:860px){
  #hero-wrap{padding:54px 14px 38px;min-height:auto}
  #tab-content{padding:20px 16px 24px}
  .field-row{flex-direction:column}
  .calendar-grid{grid-template-columns:1fr}
  .selector-topbar,.flight-card-head,.newsletter-cta{grid-template-columns:1fr;display:grid}
  .flight-price{text-align:left}
  .trust-grid{grid-template-columns:1fr 1fr}
  #trust-strip{padding:0 14px;margin:14px auto 0}
  .content-section,#why,#offers-section{padding:42px 14px}
  #hero-title{font-size:40px}
}
@media(max-width:560px){
  #tab-header{display:grid;grid-template-columns:1fr 1fr}
  .tab-btn{min-width:0;font-size:12px}
  .trust-grid{grid-template-columns:1fr}
  .date-modal{padding:18px}
}

#skandi-site-header,#skandi-site-footer{width:100%;display:block}

/* INTEGRATED CUSTOMER HEADER */
#skandi-site-header{
  --sk-blue:#022e64;
  --sk-blue2:#0b3a7a;
  --sk-cyan:#5FC7CF;
  --sk-line:#e6e9ee;
  --sk-text:#111827;
  --sk-muted:#667085;
  --sk-bg:#fff;
  --shadow:0 18px 42px rgba(15,23,42,.14);
  --header-h:74px;
  --bar-height:44px;
  --header-total:118px;
}
#skandi-site-header,
#skandi-site-header *{box-sizing:border-box}
#skandi-site-header{
  margin:0;
  width:100%;
  font-family:Montserrat,system-ui,sans-serif;
  background:transparent;
  overflow:visible;
}
#skandi-site-header button{font:inherit; cursor:pointer;}
#skandi-site-header .header-shell{
  position:relative;
  z-index:100;
  height:var(--header-total);
  background:#fff;
  box-shadow:0 4px 18px rgba(15,23,42,.06);
}
#skandi-site-header .mainline{
  height:var(--header-h);
  background:#fff;
  border-bottom:1px solid var(--sk-line);
}
#skandi-site-header .inner{
  max-width:1240px;
  margin:0 auto;
  height:100%;
  padding:0 18px;
  display:flex;
  align-items:center;
  gap:18px;
}
#skandi-site-header .logo{
  border:0;
  background:transparent;
  padding:0;
  display:flex;
  align-items:center;
  flex:0 0 auto;
}
#skandi-site-header .logo img{height:50px; width:auto; display:block;}
#skandi-site-header .nav{
  flex:1;
  display:flex;
  align-items:center;
  gap:4px;
  min-width:0;
}
#skandi-site-header .nav-btn{
  border:0;
  background:transparent;
  color:var(--sk-blue);
  border-radius:999px;
  padding:10px 12px;
  font-size:13px;
  font-weight:800;
  white-space:nowrap;
  position: relative;
  overflow: visible;
}
#skandi-site-header .nav-btn::after{
  content: "";
  position: absolute;
  bottom: 0px;
  left: 50%;
  width: 0;
  height: 3px;
  background-color: var(--sk-cyan);
  border-radius: 999px;
  transition: width 0.3s ease, left 0.3s ease;
}
#skandi-site-header .nav-btn:hover::after,
#skandi-site-header .nav-btn.active::after{
  width: 80%;
  left: 10%;
}
#skandi-site-header .actions{
  display:flex;
  align-items:center;
  gap:8px;
  flex:0 0 auto;
}
#skandi-site-header .action-btn,
#skandi-site-header .mobile-btn{
  border:0px solid var(--sk-line);
  background:#fff;
  color:var(--sk-blue);
  border-radius:999px;
  min-height:38px;
  padding:0 14px;
  font-size:12px;
  font-weight:700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
#skandi-site-header .action-btn.primary{
  background:var(--sk-blue);
  border-color:var(--sk-blue);
  color:#fff;
}
#skandi-site-header .mobile-btn{
  display:none;
  width:auto;
  height:38px;
  padding:0 14px;
  gap:8px;
}
#skandi-site-header .expandbar{
  height:var(--bar-height);
  background:linear-gradient(90deg,var(--sk-blue),var(--sk-blue2));
  color:#fff;
  position:relative;
  overflow:hidden;
  z-index:80;
}
#skandi-site-header .expand-inner{
  max-width:1240px;
  margin:0 auto;
  height:100%;
  padding:0 18px;
  position:relative;
}
#skandi-site-header .default-bar{
  height:100%;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:14px;
  color:rgba(255,255,255,.88);
  font-size:11px;
  font-weight:700;
  letter-spacing:.09em;
  font-style: italic;
  text-transform:uppercase;
}
#skandi-site-header .default-bar span{
  font-weight:900;
  font-style:normal;
  color:var(--sk-cyan);
}
#skandi-site-header .menu-bar{
  position:absolute;
  inset:0 18px;
  height:100%;
  display:flex;
  align-items:center;
  gap:14px;
  opacity:0;
  transform:translateX(-105%);
  pointer-events:none;
  transition:transform .24s ease, opacity .18s ease;
}
#skandi-site-header .menu-links{
  display:flex;
  align-items:center;
  gap:8px;
  overflow-x:auto;
  white-space:nowrap;
  scrollbar-width:none;
  width:100%;
}
#skandi-site-header .menu-links::-webkit-scrollbar{display:none}
#skandi-site-header .expandbar.menu-open .default-bar{display:none;}
#skandi-site-header .expandbar.menu-open .menu-bar{
  opacity:1;
  transform:translateX(0);
  pointer-events:auto;
}
#skandi-site-header .menu-link{
  flex:0 0 auto;
  border: 0px solid rgba(255, 255, 255, .24);
  background: transparent;
  color: #fff;
  border-radius: 999px;
  min-height: 30px;
  padding: 0 12px;
  font-size: 11px;
  font-weight: 700;
  position: relative;
}
#skandi-site-header .menu-link::after{
  content: "";
  position: absolute;
  bottom: 0px;
  left: 50%;
  width: 0;
  height: 3px;
  background-color: var(--sk-cyan);
  border-radius: 999px;
  transition: width 0.3s ease, left 0.3s ease;
}
#skandi-site-header .menu-link:hover::after{
  width: 80%;
  left: 10%;
}

/* MOBILE OFF-CANVAS SIDE MENU */
html.mobile-menu-open,
body.mobile-menu-open{
  overflow:hidden;
  overscroll-behavior:none;
}

#mobileMenuLayer,
#mobileMenuLayer *{
  box-sizing:border-box;
}

#mobileMenuLayer{
  --drawer-blue:#022e64;
  --drawer-blue2:#0b3a7a;
  --drawer-cyan:#5fc7cf;
  --drawer-line:#e6e9ee;
  --drawer-muted:#667085;
  position:fixed;
  inset:0;
  z-index:2000;
  visibility:hidden;
  pointer-events:none;
  transition:visibility 0s linear .3s;
}

#mobileMenuLayer.open{
  visibility:visible;
  pointer-events:auto;
  transition-delay:0s;
}

#mobileMenuBackdrop{
  position:absolute;
  inset:0;
  border:0;
  padding:0;
  margin:0;
  background:rgba(2,18,39,.52);
  opacity:0;
  cursor:default;
  transition:opacity .28s ease;
  -webkit-tap-highlight-color:transparent;
}

#mobileMenuLayer.open #mobileMenuBackdrop{
  opacity:1;
}

#mobileDrawer{
  position:absolute;
  top:0;
  right:0;
  width:min(86vw,360px);
  height:100%;
  min-height:100dvh;
  background:#fff;
  color:#111827;
  box-shadow:-18px 0 48px rgba(15,23,42,.25);
  transform:translateX(105%);
  transition:transform .3s cubic-bezier(.22,.8,.2,1);
  display:flex;
  flex-direction:column;
  overflow:hidden;
  outline:none;
}

#mobileMenuLayer.open #mobileDrawer{
  transform:translateX(0);
}

#mobileDrawer .mobile-drawer-head{
  flex:0 0 auto;
  min-height:76px;
  padding:14px 16px;
  background:linear-gradient(135deg,var(--drawer-blue),var(--drawer-blue2));
  color:#fff;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:14px;
}

#mobileDrawer .mobile-drawer-brand{
  min-width:0;
}

#mobileDrawer .mobile-drawer-brand strong{
  display:block;
  font-size:18px;
  line-height:1.2;
  letter-spacing:-.02em;
}

#mobileDrawer .mobile-drawer-brand span{
  display:block;
  margin-top:4px;
  color:rgba(255,255,255,.76);
  font-size:11px;
  line-height:1.35;
  font-weight:600;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
}

#mobileMenuClose{
  flex:0 0 auto;
  width:38px;
  height:38px;
  border:1px solid rgba(255,255,255,.32);
  border-radius:999px;
  background:rgba(255,255,255,.12);
  color:#fff;
  font-size:24px;
  line-height:1;
  cursor:pointer;
}

#mobileMenuClose:hover,
#mobileMenuClose:focus-visible{
  background:rgba(255,255,255,.22);
}

#mobileDrawer .mobile-drawer-body{
  flex:1 1 auto;
  min-height:0;
  overflow-y:auto;
  overscroll-behavior:contain;
  padding:14px 12px calc(18px + env(safe-area-inset-bottom));
  -webkit-overflow-scrolling:touch;
}

#mobileDrawer .mobile-menu-list{
  display:flex;
  flex-direction:column;
  gap:4px;
}

#mobileDrawer .mobile-menu-link{
  width:100%;
  min-height:50px;
  border:0;
  border-bottom:1px solid #edf0f4;
  border-radius:12px;
  background:#fff;
  color:var(--drawer-blue);
  padding:12px 14px;
  text-align:left;
  font-family:Montserrat,system-ui,sans-serif;
  font-size:14px;
  line-height:1.35;
  font-weight:750;
  cursor:pointer;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:12px;
}

#mobileDrawer .mobile-menu-link::after{
  content:"›";
  flex:0 0 auto;
  color:var(--drawer-cyan);
  font-size:24px;
  font-weight:500;
  line-height:1;
}

#mobileDrawer .mobile-menu-link:hover,
#mobileDrawer .mobile-menu-link:focus-visible{
  background:#f4f8ff;
  outline:none;
}

#mobileDrawer .mobile-drawer-actions{
  flex:0 0 auto;
  padding:12px 14px calc(12px + env(safe-area-inset-bottom));
  border-top:1px solid var(--drawer-line);
  background:#fff;
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:8px;
}

#mobileDrawer .mobile-drawer-action{
  min-height:42px;
  border:1px solid #dbe3ee;
  border-radius:999px;
  background:#fff;
  color:var(--drawer-blue);
  font-family:Montserrat,system-ui,sans-serif;
  font-size:12px;
  font-weight:800;
  cursor:pointer;
}

#mobileDrawer .mobile-drawer-action.primary{
  border-color:var(--drawer-blue);
  background:var(--drawer-blue);
  color:#fff;
}

#mobileDrawer .mobile-drawer-action:hover,
#mobileDrawer .mobile-drawer-action:focus-visible{
  box-shadow:0 0 0 3px rgba(95,199,207,.22);
  outline:none;
}

@media (prefers-reduced-motion:reduce){
  #mobileMenuLayer,
  #mobileMenuBackdrop,
  #mobileDrawer{
    transition:none !important;
  }
}

@media (max-width:900px){
  #skandi-site-header .nav,
  #skandi-site-header .action-btn.desktop-only{display:none;}
  #skandi-site-header .mobile-btn{display:inline-flex;}
  #skandi-site-header .inner{justify-content:space-between;}
  #skandi-site-header .logo img{height:60px;}
}

/* INTEGRATED CUSTOMER FOOTER */
#skandi-site-footer{
  --sk-blue:#022e64;
  --sk-blue-soft:#285ca8;
  --sk-light:#d7e6ff;
  --sk-pale:#f6faff;
  --sk-border:#e6e9ee;
  --sk-muted:#98a2b3;
  --sk-text:#fff;
  --sk-cyan:#3ca6b7;
}
#skandi-site-footer,
#skandi-site-footer *{box-sizing:border-box}
#skandi-site-footer{
  margin:0;
  width:100%;
  font-family:Montserrat,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
  background:transparent
}
#skandi-site-footer button,
#skandi-site-footer input{font-family:inherit}
#skandi-site-footer .footer{background:var(--sk-blue);color:#fff;width:100%}
#skandi-site-footer .newsletter{background:linear-gradient(135deg,var(--sk-light),var(--sk-pale));color:var(--sk-blue);padding:28px 22px;border-top:1px solid var(--sk-border)}
#skandi-site-footer .news-inner{max-width:1180px;margin:0 auto;display:grid;grid-template-columns:1.2fr 1fr;gap:22px;align-items:center}
#skandi-site-footer .newsletter h2{margin:0 0 6px;font-size:26px;letter-spacing:-.04em}
#skandi-site-footer .newsletter p{margin:0;color:#49617e;line-height:1.5}
#skandi-site-footer .news-form{display:grid;grid-template-columns:1fr auto;gap:10px}
#skandi-site-footer .news-form input{border:1px solid var(--sk-border);border-radius:999px;min-height:46px;padding:12px 16px;font-size:14px}
#skandi-site-footer .news-form button{border:0;background:var(--sk-blue);color:#fff;border-radius:999px;padding:0 18px;font-weight:700;cursor:pointer}
#skandi-site-footer .footer-main{max-width:1180px;margin:0 auto;padding:40px 22px;display:grid;grid-template-columns:repeat(6,1fr);gap:26px}
#skandi-site-footer .brand{grid-column:span 2}
#skandi-site-footer .logo{max-width:190px;background:transparent;border-radius:14px;padding:10px;margin-bottom:0px}
#skandi-site-footer .brand p{color:#d8e6ff;line-height:1.6;font-size:13px;margin:0 0 14px}
#skandi-site-footer .social-links{display: flex; align-items: center; gap: 12px; margin-top: 14px;}
#skandi-site-footer .default-bar{
  display: flex;
  align-items: center;
  gap: 8px;
  color: #d8e6ff; 
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .05em;
  font-family: "Montserrat", sans-serif;
  font-style: italic;
  text-transform: uppercase; 
  margin: 4px 0 14px 0;
}
#skandi-site-footer .default-bar span{
  color: var(--sk-cyan);
  font-weight: 900;
  letter-spacing: .09em;
  margin-right: 4px;
  margin-bottom:16px;
  font-style: normal;
  text-transform: uppercase;
}
#skandi-site-footer .social-btn{
  width: 38px;
  height: 38px;
  border: 0px solid var(--sk-border);
  border-radius: 999px;
  background: transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 8px;
  transition: transform .15s ease, box-shadow .15s ease, border-color .15s ease;
}
#skandi-site-footer .social-btn:hover{
  transform: translateY(-1px);
  box-shadow: var(--sk-shadow);
  border: 1px solid var(--sk-cyan);
}
#skandi-site-footer .social-btn img{
  width: 20px;
  height: 20px;
  object-fit: contain;
  display: block;
}
#skandi-site-footer .col h3{font-size:12px;text-transform:uppercase;letter-spacing:.12em;margin:0 0 14px;color:#fff}
#skandi-site-footer .col button{display:block;background:transparent;border:0;color:#d8e6ff;font-size:13px;font-weight:700;margin:0 0 10px;padding:0;text-align:left;cursor:pointer;line-height:1.3}
#skandi-site-footer .col button:hover{color:#fff;text-decoration:underline}
#skandi-site-footer .footer-bottom{border-top:1px solid rgba(255,255,255,.16);padding:18px 22px}
#skandi-site-footer .bottom-inner{max-width:1180px;margin:0 auto;display:flex;justify-content:space-between;gap:16px;align-items:center;flex-wrap:wrap;color:#d8e6ff;font-size:12px}
#skandi-site-footer .bottom-links{display:flex;gap:14px;flex-wrap:wrap}
#skandi-site-footer .bottom-links button{background:transparent;border:0;color:#d8e6ff;font-size:12px;font-weight:800;cursor:pointer;padding:0}
#skandi-site-footer .staff{opacity:.8}
#skandi-site-footer .trust{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
@media (max-width:980px){
  #skandi-site-footer .footer-main{grid-template-columns:repeat(2,1fr)}
  #skandi-site-footer .brand{grid-column:span 2}
  #skandi-site-footer .news-inner{grid-template-columns:1fr}
}
@media (max-width:650px){
  #skandi-site-footer .footer-main{grid-template-columns:1fr;padding:30px 18px;gap:36px;}
  #skandi-site-footer .brand{grid-column:span 1;display:flex;flex-direction:column;align-items:center;text-align:center;}
  #skandi-site-footer .default-bar{justify-content:center;margin:8px 0 16px 0;}
  #skandi-site-footer .social-links{justify-content:center;}
  #skandi-site-footer .col{text-align:center;}
  #skandi-site-footer .col button{text-align:center;margin:0 auto 12px auto;}
  #skandi-site-footer .col h3{margin-bottom:8px;}
  #skandi-site-footer .news-inner{grid-template-columns:1fr;text-align:center}
  #skandi-site-footer .news-form{grid-template-columns:1fr;max-width:400px;margin: 0 auto; width:100%;}
  #skandi-site-footer .news-form button{min-height:46px;}
  #skandi-site-footer .bottom-inner{display:flex;flex-direction:column;text-align:center;gap:20px;}
  #skandi-site-footer .bottom-links{justify-content:center;gap:12px 16px;}
  #skandi-site-footer .footer-bottom{padding:24px 22px calc(24px + env(safe-area-inset-bottom)) 22px;}
}


/* ======================================================================
   LOCKED SKANDI CUSTOMER PAGE STANDARD
   Header, footer, language/currency controls and welcome modal
   ====================================================================== */
/* Premium Buttons */
.btn {
  position: relative;
  appearance: none;
  border: 1px solid transparent;
  background: var(--sk-blue);
  color: #fff;
  border-radius: 999px;
  padding: 14px 28px;
  font-size: 13px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 48px;
  overflow: hidden;
  transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.3s ease, background 0.3s ease;
}

.btn::before {
  content: ''; position: absolute; top: 0; left: -100%; width: 50%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transform: skewX(-25deg); transition: left 0.6s ease;
}
.btn:hover::before { left: 150%; }
.btn-secondary { background: #fff; color: var(--sk-blue); border-color: var(--sk-line); }
.btn-secondary::before { background: linear-gradient(90deg, transparent, rgba(2, 46, 100, 0.05), transparent); }
.btn-light { background: rgba(255, 255, 255, 0.1); color: #fff; border-color: rgba(255, 255, 255, 0.3); backdrop-filter: blur(8px); }
.btn:hover { transform: translateY(-3px); box-shadow: 0 12px 28px rgba(2, 46, 100, 0.2); }
.btn-secondary:hover { border-color: var(--sk-blue); }
.btn-light:hover { background: #fff; color: var(--sk-blue); border-color: #fff; }

/* ==========================================================================
   HEADER & FOOTER (INTEGRATED)
   ========================================================================== */
#skandi-site-header, #skandi-site-footer { width: 100%; display: block; }
#skandi-site-header .header-shell { position: relative; z-index: 100; height: var(--header-total); background: #fff; box-shadow: 0 4px 24px rgba(15,23,42,.08); }
#skandi-site-header .mainline { height: var(--header-h); background: #fff; border-bottom: 1px solid var(--sk-line); }
#skandi-site-header .inner { max-width: 1240px; margin: 0 auto; height: 100%; padding: 0 18px; display: flex; align-items: center; gap: 18px; }
#skandi-site-header .logo { border: 0; background: transparent; padding: 0; display: flex; align-items: center; flex: 0 0 auto; flex-shrink: 0; cursor:pointer;}
#skandi-site-header .logo img { height: 50px; width: auto; object-fit: contain; }
#skandi-site-header .nav { flex: 1; display: flex; align-items: center; gap: 4px; min-width: 0; }
#skandi-site-header .nav-btn { border: 0; background: transparent; color: var(--sk-blue); border-radius: 999px; padding: 10px 14px; font-size: 13px; font-weight: 800; white-space: nowrap; position: relative; overflow: visible; transition: color 0.3s; }
#skandi-site-header .nav-btn:hover { color: var(--sk-cyan); }
#skandi-site-header .nav-btn::after { content: ""; position: absolute; bottom: 0; left: 50%; width: 0; height: 3px; background-color: var(--sk-cyan); border-radius: 999px; transition: width 0.3s ease, left 0.3s ease; }
#skandi-site-header .nav-btn:hover::after, #skandi-site-header .nav-btn.active::after { width: 80%; left: 10%; }
#skandi-site-header .actions { display: flex; align-items: center; gap: 8px; flex: 0 0 auto; flex-shrink: 0; }
#skandi-site-header .action-btn, #skandi-site-header .mobile-btn { border: 0; background: #fff; color: var(--sk-blue); border-radius: 999px; min-height: 40px; padding: 0 16px; font-size: 12px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; cursor:pointer; transition: all 0.3s;}
#skandi-site-header .action-btn:hover { background: var(--sk-bg-alt); }
#skandi-site-header .action-btn.primary { background: var(--sk-blue); color: #fff; }
#skandi-site-header .action-btn.primary:hover { background: var(--sk-blue2); box-shadow: 0 8px 16px rgba(2,46,100,0.2); transform: translateY(-1px);}
#skandi-site-header .mobile-btn { display: none; width: auto; height: 40px; gap: 8px; white-space: nowrap; flex-shrink: 0; }
#skandi-site-header .expandbar { height: var(--bar-height); background: linear-gradient(90deg, var(--sk-blue), var(--sk-blue2)); color: #fff; position: relative; overflow: hidden; z-index: 80; }
#skandi-site-header .expand-inner { max-width: 1240px; margin: 0 auto; height: 100%; padding: 0 18px; position: relative; }
#skandi-site-header .default-bar { height: 100%; display: flex; align-items: center; justify-content: space-between; gap: 14px; color: rgba(255,255,255,.88); font-size: 11px; font-weight: 700; letter-spacing: .09em; font-style: italic; text-transform: uppercase; }
#skandi-site-header .default-bar span { font-weight: 900; font-style: normal; color: var(--sk-cyan); }
#skandi-site-header .expandbar-img { height: 58px; width: auto; object-fit: contain; display: block; }

/* Favorite Button Animation */
@keyframes favPop { 0% { transform: scale(1); } 40% { transform: scale(1.35); color: var(--sk-cyan); } 100% { transform: scale(1); } }
#favBtn { transition: color 0.2s ease, transform 0.2s; transform-origin: center; cursor: pointer; }
#favBtn.saved { animation: favPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }

/* Globe / Settings Dropdown */
.settings-wrap { position: relative; display: inline-block; }
#settingsBtn { padding: 0 10px; cursor: pointer; }
#settingsBtn svg { width: 22px; height: 22px; fill: currentColor; transition: transform 0.3s; }
#settingsBtn:hover svg { transform: rotate(15deg); }
.settings-menu { position: absolute; top: calc(100% + 14px); right: 0; background: rgba(255,255,255,0.95); backdrop-filter: blur(12px); border: 1px solid var(--sk-line); border-radius: 20px; box-shadow: 0 20px 50px rgba(2, 46, 100, 0.15); padding: 24px; width: 260px; z-index: 200; opacity: 0; visibility: hidden; transform: translateY(-10px) scale(0.95); transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1); transform-origin: top right; }
.settings-menu.open { opacity: 1; visibility: visible; transform: translateY(0) scale(1); }
.settings-group { margin-bottom: 16px; text-align: left; }
.settings-group label { display: block; font-size: 11px; font-weight: 800; color: var(--sk-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
.settings-group select { width: 100%; padding: 14px 16px; border: 1px solid var(--sk-border-soft); border-radius: 12px; font-size: 13px; color: var(--sk-blue); font-weight: 600; outline: none; background: #f9fafb; cursor: pointer; transition: all 0.2s; }
.settings-group select:focus, .settings-group select:hover { border-color: var(--sk-cyan); background: #fff; box-shadow: 0 4px 12px rgba(95,199,207,0.1); }
.mobile-settings-bar { display: flex; gap: 10px; padding: 16px; border-bottom: 1px solid var(--sk-border-soft); background: var(--sk-bg-alt); }
.mobile-settings-bar select { flex: 1; padding: 12px; border-radius: 10px; border: 1px solid var(--sk-line); font-size: 13px; font-weight: 600; color: var(--sk-blue); background: #fff; }

/* WELCOME SETTINGS MODAL */
.welcome-modal-layer { position: fixed; inset: 0; z-index: 99999; display: flex; align-items: center; justify-content: center; visibility: hidden; pointer-events: none; }
.welcome-modal-layer.active { visibility: visible; pointer-events: auto; }
.welcome-backdrop { position: absolute; inset: 0; background: rgba(2,18,39,0.7); backdrop-filter: blur(8px); opacity: 0; transition: opacity 0.4s ease; }
.welcome-modal-layer.active .welcome-backdrop { opacity: 1; }
.welcome-card { position: relative; background: #fff; width: min(440px, 90vw); border-radius: 32px; box-shadow: 0 32px 80px rgba(2,46,100,0.25); padding: 48px 40px; text-align: center; transform: translateY(20px) scale(0.95); opacity: 0; transition: all 0.5s cubic-bezier(0.22, 1, 0.36, 1); }
.welcome-modal-layer.active .welcome-card { transform: translateY(0) scale(1); opacity: 1; }
.welcome-card .globe-icon { color: var(--sk-cyan); margin-bottom: 20px; }
.welcome-card .globe-icon svg { width: 56px; height: 56px; fill: currentColor; margin: 0 auto; animation: pulseGlow 3s infinite alternate; }
.welcome-card h2 { color: var(--sk-blue); font-size: 28px; font-weight: 800; margin-bottom: 12px; letter-spacing:-0.03em;}
.welcome-card p { color: var(--sk-body); font-size: 15px; margin-bottom: 32px; line-height:1.6;}
@keyframes pulseGlow { 0% { filter: drop-shadow(0 0 4px rgba(95,199,207,0.3)); } 100% { filter: drop-shadow(0 0 16px rgba(95,199,207,0.8)); } }

/* Slide-out Panels & Mobile Menu */
#skandi-site-header .club-backdrop { position: fixed; inset: 0; background: rgba(2,18,39,0.5); backdrop-filter: blur(6px); z-index: 9998; opacity: 0; visibility: hidden; transition: all 0.4s ease; }
#skandi-site-header .club-backdrop.open { opacity: 1; visibility: visible; }
#skandi-site-header .club-panel { position: fixed; top: 0; right: 0; height: 100dvh; width: min(440px, 100vw); background: #fff; box-shadow: -20px 0 60px rgba(2,46,100,0.15); z-index: 9999; border-top-left-radius: 32px; border-bottom-left-radius: 32px; transform: translateX(100%); opacity: 0; pointer-events: none; transition: transform 0.55s cubic-bezier(0.22,1,0.36,1), opacity 0.55s ease; display: flex; flex-direction: column; }
#skandi-site-header .club-panel.open { transform: translateX(0); opacity: 1; pointer-events: auto; }
#skandi-site-header .club-head { height: 90px; background: linear-gradient(135deg, var(--sk-blue), var(--sk-blue2)); color: #fff; display: flex; align-items: center; justify-content: space-between; padding: 0 32px; }
#skandi-site-header .club-head strong { font-size: 18px; font-weight: 800; letter-spacing: -0.02em; }
#skandi-site-header .club-close { border: 1px solid rgba(255,255,255,0.28); background: rgba(255,255,255,0.12); color: #fff; width: 40px; height: 40px; border-radius: 999px; font-size: 24px; font-weight: 700; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.3s ease;}
#skandi-site-header .club-close:hover { background: rgba(255,255,255,0.25); transform: rotate(90deg); }
#skandi-site-header .club-body { padding: 40px 32px; flex: 1; overflow-y: auto; }
#skandi-site-header .login-form { display: flex; flex-direction: column; gap: 16px; }
#skandi-site-header .login-form input { padding: 18px 20px; border: 1px solid var(--sk-border-soft); border-radius: 14px; font-size: 15px; background: #f9fafb; transition: all 0.3s ease; }
#skandi-site-header .login-form input:focus { outline: none; border-color: var(--sk-cyan); background: #fff; box-shadow: 0 0 0 4px rgba(95,199,207,0.1); }

/* Custom Favorites Slide-out State */
@keyframes heartFloat { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-8px) scale(1.05); } }
@keyframes favPopIn { from { opacity: 0; transform: scale(0.5) translateY(30px); } to { opacity: 1; transform: scale(1) translateY(0); } }
.fav-hero-icon { display: block; font-size: 64px; color: var(--sk-cyan); text-align: center; margin-bottom: 16px; text-shadow: 0 16px 32px rgba(95, 199, 207, 0.4); animation: favPopIn 0.7s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards, heartFloat 3.5s ease-in-out infinite 0.7s; }
.fav-hero-title { display: block; font-size: 28px; font-weight: 800; color: var(--sk-blue); text-align: center; margin-bottom: 12px; letter-spacing: -0.03em; }
.fav-hero-text { display: block; font-size: 15px; color: var(--sk-body); text-align: center; line-height: 1.7; }

/* Mobile Navigation */
html.mobile-menu-open, body.mobile-menu-open { overflow: hidden; }
.mobile-menu-layer { position: fixed; inset: 0; z-index: 2000; visibility: hidden; pointer-events: none; transition: visibility 0s linear 0.3s; }
.mobile-menu-layer.open { visibility: visible; pointer-events: auto; transition-delay: 0s; }
.mobile-menu-backdrop { position: absolute; inset: 0; background: rgba(2,18,39,0.6); backdrop-filter: blur(6px); opacity: 0; border: 0; transition: opacity 0.4s ease; width: 100%; cursor: default; }
.mobile-menu-layer.open .mobile-menu-backdrop { opacity: 1; }
.mobile-drawer { position: absolute; top: 0; right: 0; width: min(86vw, 380px); height: 100dvh; background: #fff; transform: translateX(105%); transition: transform 0.4s cubic-bezier(0.22,0.8,0.2,1); display: flex; flex-direction: column; border-top-left-radius: 24px; border-bottom-left-radius: 24px; overflow: hidden;}
.mobile-menu-layer.open .mobile-drawer { transform: translateX(0); }
.mobile-drawer-head { padding: 20px 24px; background: linear-gradient(135deg, var(--sk-blue), var(--sk-blue2)); color: #fff; display: flex; align-items: center; justify-content: space-between; }
.mobile-drawer-head strong { font-size: 20px; font-weight: 800; line-height: 1.2; letter-spacing:-0.02em;}
.mobile-drawer-head span { display: block; font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.8); margin-top: 4px; }
#mobileMenuClose { width: 40px; height: 40px; border: 1px solid rgba(255,255,255,.32); border-radius: 999px; background: rgba(255,255,255,.12); color: #fff; font-size: 26px; cursor: pointer; transition: all 0.3s;}
#mobileMenuClose:hover { background: rgba(255,255,255,0.25); transform: rotate(90deg); }
.mobile-drawer-body { flex: 1; overflow-y: auto; padding: 0; }
.mobile-menu-link { width: 100%; min-height: 60px; border: 0; border-bottom: 1px solid var(--sk-border-soft); background: #fff; color: var(--sk-blue); padding: 16px 24px; text-align: left; font-size: 15px; font-weight: 700; display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: background 0.2s;}
.mobile-menu-link:hover { background: var(--sk-pale); }
.mobile-menu-link::after { content: "›"; color: var(--sk-cyan); font-size: 28px; font-weight: 500; transition: transform 0.2s; }
.mobile-menu-link:hover::after { transform: translateX(4px); }
.mobile-drawer-actions { padding: 20px 24px; border-top: 1px solid var(--sk-line); display: grid; grid-template-columns: 1fr 1fr; gap: 12px; background: #fff;}
.mobile-drawer-action { min-height: 48px; border: 1px solid var(--sk-line); border-radius: 999px; background: #fff; color: var(--sk-blue); font-size: 13px; font-weight: 800; cursor: pointer; transition: all 0.3s;}
.mobile-drawer-action.primary { background: var(--sk-blue); color: #fff; border-color: var(--sk-blue); }
.mobile-drawer-action:hover { transform: translateY(-2px); box-shadow: 0 8px 16px rgba(2,46,100,0.1); }

@media(max-width: 900px){
  #skandi-site-header .nav, #skandi-site-header .desktop-only { display: none; }
  #skandi-site-header .inner { justify-content: space-between; gap: 12px; }
  #skandi-site-header .actions { flex-shrink: 0; }
  #skandi-site-header .mobile-btn { display: inline-flex; white-space: nowrap; flex-shrink: 0; }
}

/* BULLETPROOF LOGO LOCKS */
#skandi-site-header button.logo { flex: 0 1 auto !important; min-width: 0 !important; height: auto !important; padding: 0 !important; background: transparent !important; border: none !important; }
#skandi-site-header button.logo img { height: clamp(34px, 10vw, 50px) !important; width: auto !important; max-width: 100% !important; object-fit: contain !important; object-position: left center !important; display: block !important; }
#skandi-site-footer .brand img.logo { width: 190px !important; max-width: 100% !important; height: auto !important; margin-bottom: 16px !important; object-fit: contain !important; display: block !important; }

/* Footer specific overrides */
#skandi-site-footer .footer { background: var(--sk-blue); color: #fff; }
#skandi-site-footer .newsletter { background: linear-gradient(135deg, #d7e6ff, #f6faff); color: var(--sk-blue); padding: 40px 32px; border-top: 1px solid var(--sk-line); }
#skandi-site-footer .news-inner { max-width: 1240px; margin: 0 auto; display: grid; grid-template-columns: 1.2fr 1fr; gap: 32px; align-items: center; }
#skandi-site-footer .newsletter h2 { font-size: 28px; letter-spacing: -0.03em; margin-bottom: 8px; font-weight: 800;}
#skandi-site-footer .news-form { display: grid; grid-template-columns: 1fr auto; gap: 12px; }
#skandi-site-footer .news-form input { border: 1px solid var(--sk-border-soft); border-radius: 999px; padding: 16px 20px; font-size: 15px; outline: none; transition: border-color 0.3s;}
#skandi-site-footer .news-form input:focus { border-color: var(--sk-cyan); }
#skandi-site-footer .news-form button { background: var(--sk-blue); color: #fff; border: 0; border-radius: 999px; padding: 0 24px; font-weight: 800; cursor: pointer; transition: background 0.3s; text-transform: uppercase; letter-spacing: 0.05em; font-size: 13px;}
#skandi-site-footer .news-form button:hover { background: var(--sk-blue2); }
#skandi-site-footer .footer-main { max-width: 1240px; margin: 0 auto; padding: 64px 32px; display: grid; grid-template-columns: repeat(6, 1fr); gap: 32px; }
#skandi-site-footer .brand { grid-column: span 2; }
#skandi-site-footer .social-links { display: flex; gap: 12px; margin-top: 20px; }
#skandi-site-footer .social-btn { width: 44px; height: 44px; border: 1px solid rgba(255,255,255,0.2); border-radius: 50%; padding: 10px; display: flex; align-items: center; justify-content: center; background: transparent; transition: all 0.3s ease; cursor: pointer; }
#skandi-site-footer .social-btn img { width: 100%; height: 100%; object-fit: contain; display: block; }
#skandi-site-footer .social-btn:hover { transform: translateY(-3px); border-color: var(--sk-cyan); background: rgba(95,199,207,0.1);}
#skandi-site-footer .col h3 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.15em; font-weight: 800; color: #fff; margin-bottom: 20px; }
#skandi-site-footer .col button { display: block; background: transparent; border: 0; color: rgba(255,255,255,0.7); font-size: 14px; font-weight: 500; padding: 0; margin-bottom: 12px; cursor: pointer; text-align: left; transition: color 0.2s;}
#skandi-site-footer .col button:hover { color: #fff; text-decoration: none; }
#skandi-site-footer .footer-bottom { border-top: 1px solid rgba(255,255,255,0.1); padding: 24px 32px; }
#skandi-site-footer .bottom-inner { max-width: 1240px; margin: 0 auto; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 20px; font-size: 13px; color: rgba(255,255,255,0.6); }
#skandi-site-footer .bottom-links { display: flex; gap: 20px; flex-wrap: wrap; }
#skandi-site-footer .bottom-links button { background: transparent; border: 0; color: rgba(255,255,255,0.8); font-weight: 600; cursor: pointer; padding: 0; transition: color 0.2s;}
#skandi-site-footer .bottom-links button:hover { color: #fff; }
@media (max-width: 980px){ #skandi-site-footer .footer-main { grid-template-columns: repeat(3, 1fr); } #skandi-site-footer .brand { grid-column: span 3; } #skandi-site-footer .news-inner { grid-template-columns: 1fr; } }
@media (max-width: 600px){ #skandi-site-footer .footer-main { grid-template-columns: 1fr; } #skandi-site-footer .brand { grid-column: span 1; } }

/* Shared notification used by the footer and page actions */
.skandi-toast{
  position:fixed;
  right:20px;
  bottom:20px;
  z-index:100000;
  max-width:min(380px,calc(100vw - 40px));
  display:none;
  padding:14px 18px;
  border-radius:14px;
  background:#022e64;
  color:#fff;
  box-shadow:0 18px 42px rgba(2,46,100,.25);
  font-size:13px;
  font-weight:700;
  line-height:1.5;
}
.skandi-toast.show{display:block}
.skandi-toast.error{background:#8a1f1f}



:root{--ta-blue:#022e64;--ta-blue2:#0b3a7a;--ta-cyan:#5FC7CF;--ta-ice:#eff8fb;--ta-soft:#f6f8fb;--ta-line:#dfe5ef;--ta-text:#111827;--ta-muted:#64748b;--ta-green:#087443;--ta-gold:#c6a15b;--header-total:118px}
.ta-page{background:#fff;color:var(--ta-text)}.ta-shell{width:min(1240px,calc(100% - 40px));margin:0 auto}.ta-view{display:none}.ta-view.active{display:block}.ta-hero{position:relative;min-height:590px;display:flex;align-items:center;overflow:hidden;background:linear-gradient(90deg,rgba(1,25,58,.95),rgba(2,46,100,.76) 54%,rgba(2,46,100,.28)),url('https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=2000&q=88') center/cover;color:#fff}.ta-hero:after{content:"";position:absolute;inset:auto 0 0;height:90px;background:linear-gradient(0deg,#fff,transparent)}.ta-hero-inner{position:relative;z-index:2;padding:74px 0 100px}.ta-kicker{display:flex;align-items:center;gap:12px;color:var(--ta-cyan);font-size:11px;font-weight:900;letter-spacing:.2em;text-transform:uppercase}.ta-kicker:before{content:"";width:42px;height:2px;background:var(--ta-cyan)}.ta-hero h1{max-width:820px;margin:18px 0 15px;font-family:'Playfair Display',serif;font-size:clamp(48px,7vw,86px);font-weight:700;line-height:.98;letter-spacing:-.045em}.ta-hero-copy{max-width:720px;color:rgba(255,255,255,.86);font-size:16px;line-height:1.7}.ta-search-card{margin-top:34px;width:min(1120px,100%);background:rgba(255,255,255,.98);color:var(--ta-text);border-radius:24px;padding:20px;box-shadow:0 25px 70px rgba(0,0,0,.25)}.ta-search-grid{display:grid;grid-template-columns:2fr 1fr 1fr .7fr auto;gap:10px}.ta-field{display:grid;gap:6px;position:relative}.ta-field label{font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:.08em;color:var(--ta-muted)}.ta-field input,.ta-field select{width:100%;height:48px;border:1px solid var(--ta-line);border-radius:12px;padding:0 13px;background:#fff;color:var(--ta-blue);font-size:12px;font-weight:700}.ta-primary,.ta-secondary{border:0;border-radius:12px;min-height:48px;padding:0 19px;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.07em}.ta-primary{background:var(--ta-blue);color:#fff}.ta-secondary{background:#fff;color:var(--ta-blue);border:1px solid var(--ta-line)}.ta-nearby-row{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-top:13px}.ta-nearby{border:0;background:transparent;color:var(--ta-blue);font-size:10px;font-weight:900;text-transform:uppercase}.ta-nearby-copy{font-size:10px;color:var(--ta-muted)}.ta-suggestions{position:absolute;left:0;right:0;top:100%;z-index:30;background:#fff;border:1px solid var(--ta-line);border-radius:12px;box-shadow:0 18px 45px rgba(2,46,100,.18);display:none;max-height:300px;overflow:auto}.ta-suggestions.open{display:block}.ta-suggestion{width:100%;border:0;border-bottom:1px solid #edf1f5;background:#fff;text-align:left;padding:12px}.ta-suggestion strong{display:block;color:var(--ta-blue);font-size:12px}.ta-suggestion span{display:block;margin-top:3px;color:var(--ta-muted);font-size:9px}.ta-categories{display:flex;gap:9px;overflow:auto;padding:26px 0 8px;scrollbar-width:none}.ta-category{flex:0 0 auto;border:1px solid var(--ta-line);background:#fff;color:var(--ta-blue);border-radius:999px;padding:11px 14px;font-size:10px;font-weight:900}.ta-category.active{background:var(--ta-blue);color:#fff}.ta-section{padding:64px 0}.ta-section.alt{background:var(--ta-soft)}.ta-section-head{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;margin-bottom:24px}.ta-section-head h2{margin:7px 0 5px;color:var(--ta-blue);font-family:'Playfair Display',serif;font-size:clamp(30px,4vw,46px);letter-spacing:-.03em}.ta-section-head p{margin:0;max-width:720px;color:#56677c;font-size:13px;line-height:1.7}.ta-link-button{border:0;background:transparent;color:var(--ta-blue);font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.08em;white-space:nowrap}.ta-collections{display:grid;grid-template-columns:1.25fr .75fr;gap:18px}.ta-collection{position:relative;min-height:330px;border-radius:24px;overflow:hidden;color:#fff;padding:32px;display:flex;align-items:flex-end;background-size:cover;background-position:center;box-shadow:0 18px 45px rgba(2,46,100,.12)}.ta-collection:before{content:"";position:absolute;inset:0;background:linear-gradient(0deg,rgba(1,20,45,.92),rgba(1,20,45,.12))}.ta-collection-content{position:relative;z-index:2;max-width:560px}.ta-collection h3{font-family:'Playfair Display',serif;font-size:32px;margin:0 0 10px}.ta-collection p{font-size:12px;line-height:1.65;color:rgba(255,255,255,.86)}.ta-collection button{margin-top:17px}.ta-member{display:grid;grid-template-columns:1fr auto;align-items:center;gap:22px;margin-top:18px;padding:26px 30px;border:1px solid #cce8eb;border-radius:20px;background:linear-gradient(135deg,#effafb,#fff)}.ta-member h3{color:var(--ta-blue);font-size:20px;margin:0 0 6px}.ta-member p{color:var(--ta-muted);font-size:12px;line-height:1.6;margin:0}.ta-dest-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}.ta-dest-card{position:relative;min-height:235px;border:0;border-radius:20px;overflow:hidden;background:#dbe5ed;text-align:left;color:#fff;box-shadow:0 12px 32px rgba(2,46,100,.12)}.ta-dest-card img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.ta-dest-card:after{content:"";position:absolute;inset:0;background:linear-gradient(0deg,rgba(1,23,53,.88),transparent 70%)}.ta-dest-card div{position:absolute;z-index:2;left:18px;right:18px;bottom:17px}.ta-dest-card strong{display:block;font-size:14px}.ta-dest-card span{display:block;margin-top:5px;font-size:9px;color:rgba(255,255,255,.8)}.ta-exp-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:17px}.ta-exp-card{background:#fff;border:1px solid var(--ta-line);border-radius:20px;overflow:hidden;box-shadow:0 10px 28px rgba(2,46,100,.07);display:flex;flex-direction:column;transition:.22s}.ta-exp-card:hover{transform:translateY(-3px);box-shadow:0 20px 48px rgba(2,46,100,.14)}.ta-exp-img{position:relative;height:205px;background:#dce6ee}.ta-exp-img img{width:100%;height:100%;object-fit:cover}.ta-exp-badges{position:absolute;left:12px;top:12px;display:flex;gap:6px;flex-wrap:wrap}.ta-badge{border-radius:999px;background:rgba(255,255,255,.95);color:var(--ta-blue);padding:7px 9px;font-size:8px;font-weight:900;text-transform:uppercase}.ta-heart{position:absolute;right:12px;top:12px;width:36px;height:36px;border:0;border-radius:50%;background:rgba(255,255,255,.95);color:var(--ta-blue);font-size:18px}.ta-exp-body{padding:18px;display:flex;flex-direction:column;flex:1}.ta-exp-category{color:var(--ta-cyan);font-size:8px;font-weight:900;text-transform:uppercase;letter-spacing:.08em}.ta-exp-card h3{color:var(--ta-blue);font-size:15px;line-height:1.42;margin:8px 0}.ta-exp-card p{color:#5d6d80;font-size:10px;line-height:1.6;margin:0}.ta-exp-meta{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0;color:#5a6a7d;font-size:9px}.ta-exp-rating{font-size:9px;font-weight:900;color:var(--ta-blue)}.ta-exp-price{margin-top:auto;padding-top:14px;display:flex;align-items:flex-end;justify-content:space-between;gap:10px}.ta-exp-price strong{color:var(--ta-blue);font-size:18px}.ta-exp-price span{display:block;color:var(--ta-muted);font-size:8px}.ta-exp-open{border:0;background:var(--ta-blue);color:#fff;border-radius:10px;padding:10px 12px;font-size:8px;font-weight:900;text-transform:uppercase}.ta-trust{background:linear-gradient(135deg,var(--ta-blue),var(--ta-blue2));color:#fff;border-radius:26px;padding:35px;display:grid;grid-template-columns:1fr auto;align-items:center;gap:20px}.ta-trust h2{font-family:'Playfair Display',serif;font-size:32px;margin:0 0 8px}.ta-trust p{margin:0;color:rgba(255,255,255,.8);font-size:12px;line-height:1.65;max-width:760px}.ta-shield{font-size:58px}.ta-benefits{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}.ta-benefit{border:1px solid var(--ta-line);border-radius:20px;padding:24px;background:#fff}.ta-benefit-icon{width:52px;height:52px;border-radius:15px;background:var(--ta-ice);display:grid;place-items:center;color:var(--ta-blue);font-size:23px}.ta-benefit h3{color:var(--ta-blue);font-size:16px;margin:15px 0 8px}.ta-benefit p{color:var(--ta-muted);font-size:11px;line-height:1.65;margin:0}.ta-directory-tabs{display:flex;gap:8px;overflow:auto;margin-bottom:18px}.ta-country-tab{border:1px solid var(--ta-line);background:#fff;color:var(--ta-blue);border-radius:999px;padding:10px 14px;font-size:9px;font-weight:900}.ta-country-tab.active{background:var(--ta-blue);color:#fff}.ta-directory-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.ta-directory-item{border:1px solid var(--ta-line);background:#fff;border-radius:14px;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;text-align:left}.ta-directory-item strong{color:var(--ta-blue);font-size:11px}.ta-directory-item span{color:var(--ta-muted);font-size:9px}.ta-results-hero{background:linear-gradient(135deg,#e8f3ff,#f7fbff);padding:42px 0}.ta-breadcrumb-btn{border:0;background:transparent;color:var(--ta-blue);font-size:9px;font-weight:900;text-transform:uppercase}.ta-results-hero h1{color:var(--ta-blue);font-family:'Playfair Display',serif;font-size:44px;margin:13px 0 7px}.ta-results-hero p{color:var(--ta-muted);font-size:12px}.ta-results-layout{display:grid;grid-template-columns:280px 1fr;gap:22px;padding:28px 0 70px}.ta-filter-panel{position:sticky;top:20px;align-self:start;border:1px solid var(--ta-line);border-radius:18px;background:#fff;overflow:hidden}.ta-filter-head{display:flex;align-items:center;justify-content:space-between;padding:17px;border-bottom:1px solid var(--ta-line)}.ta-filter-head h2{font-size:14px;color:var(--ta-blue);margin:0}.ta-filter-clear{border:0;background:transparent;color:var(--ta-blue);font-size:8px;font-weight:900}.ta-filter-group{padding:16px;border-bottom:1px solid var(--ta-line)}.ta-filter-group h3{margin:0 0 11px;color:var(--ta-blue);font-size:10px;text-transform:uppercase;letter-spacing:.06em}.ta-check{display:flex;gap:9px;align-items:center;margin:8px 0;color:#5d6d80;font-size:10px}.ta-check input{accent-color:var(--ta-blue)}.ta-filter-group select,.ta-filter-group input[type=number]{width:100%;height:40px;border:1px solid var(--ta-line);border-radius:9px;padding:0 9px}.ta-results-toolbar{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:15px}.ta-results-toolbar strong{color:var(--ta-blue);font-size:13px}.ta-sort{height:40px;border:1px solid var(--ta-line);border-radius:10px;padding:0 10px;background:#fff;color:var(--ta-blue);font-size:10px}.ta-results-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:15px}.ta-load-more{text-align:center;margin-top:22px}.ta-empty{border:1px solid var(--ta-line);border-radius:18px;padding:45px;text-align:center;color:var(--ta-muted);background:#fff}.ta-detail-hero{padding:22px 0 0}.ta-detail-gallery{display:grid;grid-template-columns:2fr 1fr 1fr;grid-template-rows:250px 250px;gap:8px;border-radius:22px;overflow:hidden}.ta-detail-gallery img{width:100%;height:100%;object-fit:cover}.ta-detail-gallery img:first-child{grid-row:1/3}.ta-detail-head{padding:26px 0;display:grid;grid-template-columns:1fr auto;gap:20px}.ta-detail-head h1{font-family:'Playfair Display',serif;color:var(--ta-blue);font-size:44px;margin:8px 0 10px}.ta-detail-sub{color:var(--ta-muted);font-size:12px;line-height:1.6}.ta-detail-actions{display:flex;gap:8px;align-items:start}.ta-detail-layout{display:grid;grid-template-columns:1fr 360px;gap:28px;padding-bottom:70px}.ta-detail-content{display:grid;gap:16px}.ta-detail-card{border:1px solid var(--ta-line);border-radius:18px;padding:24px;background:#fff}.ta-detail-card h2{color:var(--ta-blue);font-size:19px;margin:0 0 12px}.ta-detail-card p,.ta-detail-card li{color:#56677b;font-size:11px;line-height:1.72}.ta-detail-card ul{padding-left:20px;margin:0}.ta-book-card{position:sticky;top:20px;align-self:start;border:1px solid var(--ta-line);border-radius:20px;padding:22px;background:#fff;box-shadow:0 18px 48px rgba(2,46,100,.12)}.ta-book-price{color:var(--ta-blue);font-size:29px;font-weight:900}.ta-book-price small{font-size:10px;font-weight:600;color:var(--ta-muted)}.ta-book-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:18px 0}.ta-book-field{display:grid;gap:5px}.ta-book-field.full{grid-column:1/-1}.ta-book-field label{font-size:8px;font-weight:900;color:var(--ta-muted);text-transform:uppercase}.ta-book-field input,.ta-book-field select{height:42px;border:1px solid var(--ta-line);border-radius:9px;padding:0 10px}.ta-book-total{display:flex;justify-content:space-between;padding:14px 0;border-top:1px solid var(--ta-line);color:var(--ta-blue);font-size:12px;font-weight:900}.ta-book-card .ta-primary{width:100%}.ta-live-note{font-size:9px;color:var(--ta-muted);line-height:1.5;margin-top:10px}.ta-toast{position:fixed;right:18px;bottom:18px;z-index:15000;background:var(--ta-blue);color:#fff;border-radius:12px;padding:13px 16px;font-size:10px;font-weight:700;opacity:0;transform:translateY(10px);transition:.22s;pointer-events:none}.ta-toast.show{opacity:1;transform:none}.ta-toast.error{background:#a12622}@media(max-width:1050px){.ta-search-grid{grid-template-columns:2fr 1fr 1fr}.ta-search-grid .ta-primary{grid-column:1/-1}.ta-exp-grid{grid-template-columns:repeat(3,1fr)}.ta-dest-grid{grid-template-columns:repeat(2,1fr)}.ta-results-grid{grid-template-columns:repeat(2,1fr)}.ta-detail-layout{grid-template-columns:1fr 320px}}@media(max-width:760px){.ta-shell{width:min(100% - 26px,1240px)}.ta-hero{min-height:680px}.ta-hero-inner{padding:55px 0 85px}.ta-hero h1{font-size:51px}.ta-search-grid{grid-template-columns:1fr 1fr}.ta-search-grid .ta-field:first-child{grid-column:1/-1}.ta-search-grid .ta-primary{grid-column:1/-1}.ta-nearby-row{align-items:flex-start;flex-direction:column}.ta-collections{grid-template-columns:1fr}.ta-collection{min-height:300px}.ta-member{grid-template-columns:1fr}.ta-dest-grid,.ta-exp-grid,.ta-benefits,.ta-directory-grid{grid-template-columns:1fr}.ta-results-layout{grid-template-columns:1fr}.ta-filter-panel{position:static}.ta-results-grid{grid-template-columns:1fr}.ta-detail-gallery{grid-template-columns:1fr 1fr;grid-template-rows:280px 150px}.ta-detail-gallery img:first-child{grid-column:1/3;grid-row:auto}.ta-detail-gallery img:nth-child(n+4){display:none}.ta-detail-head,.ta-detail-layout{grid-template-columns:1fr}.ta-detail-head h1{font-size:36px}.ta-book-card{position:static}}
</style><style>
/* Dynamic page is embedded below the site-level Wix header and above the site-level footer. */
:root{--header-total:0px!important;--header-h:0px!important;--bar-height:0px!important}
.country-page,.destination-page,.area-page,.hotel-page{padding-top:0!important}
.country-subnav,.destination-subnav,.area-subnav,.hotel-nav-wrap{top:0!important}
.signature,.destination-signature,.area-signature{top:80px!important}
</style></head><body>
<!-- Welcome/First Visit Settings Modal -->
<div class="welcome-modal-layer" id="welcomeSettingsModal">
<div class="welcome-backdrop" id="welcomeBackdrop"></div>
<div class="welcome-card">
<div class="globe-icon">
<svg viewbox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"></path></svg>
</div>
<h2 data-i18n="welcome.title">Welcome to SKANDI</h2>
<p data-i18n="welcome.copy">Please confirm your preferred language and currency before continuing.</p>
<div class="settings-group">
<select id="welcomeLang">
<option value="EN">United States - English</option>
<option value="SV">Sweden - Svenska</option>
<option value="NO">Norway - Norsk</option>
<option value="DA">Denmark - Dansk</option>
</select>
</div>
<div class="settings-group">
<select id="welcomeCurr">
<option value="USD">USD ($)</option>
<option value="SEK">SEK (kr)</option>
<option value="NOK">NOK (kr)</option>
<option value="DKK">DKK (kr)</option>
<option value="EUR">EUR (€)</option>
</select>
</div>
<button class="btn" data-i18n="welcome.btn" id="welcomeSaveBtn" style="width:100%; margin-top: 12px;">Continue to Site</button>
</div>
</div>
<!-- Mobile Menu Layer -->

<main class="ta-page" id="taMain">
<section class="ta-view active" id="taHomeView">
<section class="ta-hero">
<div class="ta-shell ta-hero-inner">
<div class="ta-kicker" data-i18n="ta.hero.kicker">SKANDI EXPERIENCES</div>
<h1 data-i18n="ta.hero.title">Find something worth remembering.</h1>
<p class="ta-hero-copy" data-i18n="ta.hero.copy">Book excursions, attractions, day trips, transfers and local experiences for your next destination.</p>
<form class="ta-search-card" id="taSearchForm">
<div class="ta-search-grid">
<div class="ta-field">
<label data-i18n="ta.search.destination">Where do you want to go?</label>
<input autocomplete="off" data-i18n-placeholder="ta.search.destinationPh" id="taDestinationInput" placeholder="City, island, resort or attraction"/>
<div class="ta-suggestions" id="taSuggestions"></div>
</div>
<div class="ta-field"><label data-i18n="ta.search.from">From</label><input id="taFromDate" type="date"/></div>
<div class="ta-field"><label data-i18n="ta.search.to">To</label><input id="taToDate" type="date"/></div>
<div class="ta-field"><label data-i18n="ta.search.travelers">Travellers</label><select id="taTravelers"><option value="1">1</option><option selected="" value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option><option value="6">6</option><option value="7">7</option><option value="8">8</option><option value="9">9</option></select></div>
<button class="ta-primary" data-i18n="ta.search.button" type="submit">Search experiences</button>
</div>
<div class="ta-nearby-row"><button class="ta-nearby" id="taNearbyBtn" type="button">⌖ <span data-i18n="ta.search.nearby">Find experiences near me</span></button><span class="ta-nearby-copy" data-i18n="ta.search.nearbyCopy">Use your location to discover what is close by.</span></div>
</form>
</div>
</section>
<div class="ta-shell"><div class="ta-categories" id="taCategoryChips"></div></div>
<section class="ta-section"><div class="ta-shell"><div class="ta-collections" id="taCollections"></div><div class="ta-member"><div><h3 data-i18n="ta.member.title">Keep every ticket in one place</h3><p data-i18n="ta.member.copy">Sign in to save favourites, access vouchers and keep experiences connected to your SKANDI trip.</p></div><button class="ta-primary" data-i18n="ta.member.button" id="taMemberBtn" type="button">Open SKANDI Club</button></div></div></section>
<section class="ta-section alt"><div class="ta-shell"><div class="ta-section-head"><div><div class="ta-kicker" data-i18n="ta.popular.eyebrow">Explore by destination</div><h2 data-i18n="ta.popular.title">Popular destinations</h2><p data-i18n="ta.popular.copy">Start with places that offer a wide mix of day trips, attractions and local activities.</p></div></div><div class="ta-dest-grid" id="taPopularDestinations"></div></div></section>
<section class="ta-section"><div class="ta-shell"><div class="ta-section-head"><div><div class="ta-kicker" data-i18n="ta.recommended.eyebrow">Selected for you</div><h2 data-i18n="ta.recommended.title">Recommended experiences</h2><p data-i18n="ta.recommended.copy">Original SKANDI preview content. Live inventory and prices appear when a provider is connected.</p></div><button class="ta-link-button" data-i18n="ta.viewAll" id="taViewAllBtn" type="button">View all experiences</button></div><div class="ta-exp-grid" id="taRecommendedGrid"></div></div></section>
<section class="ta-section alt"><div class="ta-shell"><div class="ta-trust"><div><h2 data-i18n="ta.trust.title">Travel with clear information</h2><p data-i18n="ta.trust.copy">See meeting points, duration, language, accessibility, cancellation terms and what is included before you book.</p></div><div class="ta-shield">◇</div></div></div></section>
<section class="ta-section"><div class="ta-shell"><div class="ta-section-head"><div><h2 data-i18n="ta.benefits.title">Why book an experience with SKANDI</h2></div></div><div class="ta-benefits"><article class="ta-benefit"><div class="ta-benefit-icon">◎</div><h3 data-i18n="ta.benefit.world">Experiences around the world</h3><p data-i18n="ta.benefit.worldCopy">Discover activities in beach resorts, cities and countryside destinations.</p></article><article class="ta-benefit"><div class="ta-benefit-icon">⌖</div><h3 data-i18n="ta.benefit.local">Selected with local knowledge</h3><p data-i18n="ta.benefit.localCopy">Find cultural highlights, hidden corners and practical options for your trip.</p></article><article class="ta-benefit"><div class="ta-benefit-icon">✓</div><h3 data-i18n="ta.benefit.easy">Simple from search to voucher</h3><p data-i18n="ta.benefit.easyCopy">Keep booking details, tickets and pickup information connected to your trip.</p></article></div></div></section>
<section class="ta-section alt"><div class="ta-shell"><div class="ta-section-head"><div><div class="ta-kicker" data-i18n="ta.directory.eyebrow">Destination directory</div><h2 data-i18n="ta.directory.title">Find your destination</h2><p data-i18n="ta.directory.copy">Browse available locations by country and open a filtered experience search.</p></div></div><div class="ta-directory-tabs" id="taCountryTabs"></div><div class="ta-directory-grid" id="taDirectoryGrid"></div></div></section>
</section>
<section class="ta-view" id="taResultsView">
<div class="ta-results-hero"><div class="ta-shell"><button class="ta-breadcrumb-btn" data-i18n="ta.results.back" id="taBackHomeBtn">Back to inspiration</button><h1 id="taResultsTitle">Experiences</h1><p id="taResultsSubtitle"></p></div></div>
<div class="ta-shell ta-results-layout">
<aside class="ta-filter-panel"><div class="ta-filter-head"><h2 data-i18n="ta.filters.title">Filter experiences</h2><button class="ta-filter-clear" data-i18n="ta.filters.clear" id="taClearFilters">Clear all</button></div><div id="taFilterContent"></div></aside>
<section><div class="ta-results-toolbar"><strong id="taResultCount"></strong><select class="ta-sort" id="taSort"><option data-i18n="ta.results.popular" value="recommended">Recommended</option><option data-i18n="ta.results.price" value="price">Lowest price</option><option data-i18n="ta.results.rating" value="rating">Highest rating</option></select></div><div class="ta-results-grid" id="taResultsGrid"></div><div class="ta-load-more"><button class="ta-secondary" data-i18n="ta.loadMore" id="taLoadMoreBtn">Show more experiences</button></div></section>
</div>
</section>
<section class="ta-view" id="taDetailView"><div class="ta-shell ta-detail-hero"><button class="ta-breadcrumb-btn" data-i18n="ta.detail.back" id="taBackResultsBtn">Back to results</button><div class="ta-detail-gallery" id="taDetailGallery"></div><div class="ta-detail-head"><div><div class="ta-kicker" id="taDetailCategory"></div><h1 id="taDetailTitle"></h1><div class="ta-detail-sub" id="taDetailMeta"></div></div><div class="ta-detail-actions"><button class="ta-secondary" data-i18n="ta.detail.share" id="taShareBtn">Share</button><button class="ta-secondary" data-i18n="ta.detail.favorite" id="taFavoriteBtn">Save</button></div></div><div class="ta-detail-layout"><div class="ta-detail-content" id="taDetailContent"></div><aside class="ta-book-card"><div class="ta-book-price" id="taBookPrice"></div><div class="ta-book-grid"><div class="ta-book-field full"><label data-i18n="ta.detail.date">Date</label><input id="taBookDate" type="date"/></div><div class="ta-book-field full"><label data-i18n="ta.detail.time">Time</label><select id="taBookTime"><option>09:00</option><option>13:30</option><option>17:30</option></select></div><div class="ta-book-field"><label data-i18n="ta.detail.adults">Adults</label><select id="taBookAdults"><option>1</option><option selected="">2</option><option>3</option><option>4</option><option>5</option><option>6</option></select></div><div class="ta-book-field"><label data-i18n="ta.detail.children">Children</label><select id="taBookChildren"><option selected="">0</option><option>1</option><option>2</option><option>3</option><option>4</option></select></div></div><div class="ta-book-total"><span data-i18n="ta.detail.total">Estimated total</span><strong id="taBookTotal"></strong></div><button class="ta-primary" data-i18n="ta.detail.book" id="taBookBtn">Continue to booking</button><div class="ta-live-note" data-i18n="ta.detail.liveRequired">Search live availability to confirm the final time and price.</div></aside></div></div></section>
</main>
<div class="ta-toast" id="taToast"></div>

<div aria-live="polite" class="skandi-toast" id="skandiToast" role="status"></div>
<script>
(() => {
'use strict';
const APP_SOURCE='SKANDI_TOURS_ACTIVITIES';
const HEADER_SOURCE='SKANDI_CUSTOMER_HEADER_EXPANDBAR';
const FOOTER_SOURCE='SKANDI_CUSTOMER_FOOTER';
const PARENT_SOURCE='SKANDI_WIX_PARENT';
const SETTINGS_KEY='skandi_user_settings';
const I18N={"EN":{"nav.packages":"Packages","nav.destinations":"Destinations","nav.club":"Signature Club","nav.info":"Travel Info","nav.search":"Search","nav.clubBtn":"SKANDI Club","nav.menu":"MENU","nav.signIn":"Sign in","settings.language":"Language","settings.currency":"Currency","settings.apply":"Apply Settings","welcome.title":"Welcome to SKANDI","welcome.copy":"Please confirm your preferred language and currency before continuing.","welcome.btn":"Continue to Site","footer.news.title":"Get SKANDI offers and travel inspiration","footer.news.desc":"Receive destination guides, Signature Collection updates and member offers.","footer.news.btn":"Sign up","footer.col1.title":"Book & Travel","footer.col1.l1":"Manage your booking","footer.col1.l2":"Book a trip","footer.col1.l3":"Signature Collection","footer.col1.l4":"Destinations","footer.col1.l5":"Hotels","footer.col1.l6":"Flights","footer.col1.l7":"Tours & Activities","footer.col1.l8":"Car Rental","footer.col1.l9":"Offers","footer.col2.title":"Help & Travel Info","footer.col2.l1":"Before you travel","footer.col2.l2":"Passport & visa","footer.col2.l3":"Baggage","footer.col2.l4":"Insurance","footer.col2.l5":"Help Center","footer.col2.l6":"Contact us","footer.col2.l7":"Special assistance","footer.col3.title":"SKANDI Club","footer.col3.l1":"Join SKANDI Club","footer.col3.l2":"Member benefits","footer.col3.l3":"My Club Status","footer.col3.l4":"Travel Wallet & Vouchers","footer.col4.title":"About","footer.col4.l1":"About SKANDI Travels","footer.col4.l2":"Newsroom","footer.col4.l3":"Careers","footer.col4.l4":"Our Network","footer.bottom.terms":"Payment methods, supplier terms and package travel conditions may vary by product.","footer.bottom.l1":"Legal","footer.bottom.l8":"Terms of Use","footer.bottom.l2":"Accessibility","footer.bottom.l3":"Website disclaimer","footer.bottom.l4":"Privacy Policy","footer.bottom.l5":"Cookies Policy","footer.bottom.l6":"Booking Terms","footer.bottom.l7":"Staff login","ta.pageTitle":"Tours & Activities | SKANDI Travels","ta.hero.kicker":"SKANDI EXPERIENCES","ta.hero.title":"Find something worth remembering.","ta.hero.copy":"Book excursions, attractions, day trips, transfers and local experiences for your next destination.","ta.search.destination":"Where do you want to go?","ta.search.destinationPh":"City, island, resort or attraction","ta.search.from":"From","ta.search.to":"To","ta.search.travelers":"Travellers","ta.search.button":"Search experiences","ta.search.nearby":"Find experiences near me","ta.search.nearbyCopy":"Use your location to discover what is close by.","ta.category.all":"All experiences","ta.category.daytrips":"Excursions & day trips","ta.category.activities":"Activities","ta.category.attractions":"Attractions & guided tours","ta.category.food":"Food & drink","ta.category.water":"Boat & water","ta.category.transfers":"Transfers","ta.collection.signature":"SKANDI Signature Experiences","ta.collection.signatureCopy":"Distinctive small-group experiences, selected for quality, local character and strong guest feedback.","ta.collection.responsible":"Responsible Choice","ta.collection.responsibleCopy":"Experiences designed to support local communities, nature and lower-impact travel.","ta.collection.explore":"Explore collection","ta.member.title":"Keep every ticket in one place","ta.member.copy":"Sign in to save favourites, access vouchers and keep experiences connected to your SKANDI trip.","ta.member.button":"Open SKANDI Club","ta.popular.eyebrow":"Explore by destination","ta.popular.title":"Popular destinations","ta.popular.copy":"Start with places that offer a wide mix of day trips, attractions and local activities.","ta.recommended.eyebrow":"Selected for you","ta.recommended.title":"Recommended experiences","ta.recommended.copy":"Original SKANDI preview content. Live inventory and prices appear when a provider is connected.","ta.viewAll":"View all experiences","ta.freeCancellation":"Free cancellation","ta.pickup":"Hotel pickup available","ta.instant":"Instant confirmation","ta.languages":"Languages","ta.fromPrice":"From","ta.perPerson":"per person","ta.rating":"Guest rating","ta.reviews":"reviews","ta.trust.title":"Travel with clear information","ta.trust.copy":"See meeting points, duration, language, accessibility, cancellation terms and what is included before you book.","ta.benefits.title":"Why book an experience with SKANDI","ta.benefit.world":"Experiences around the world","ta.benefit.worldCopy":"Discover activities in beach resorts, cities and countryside destinations.","ta.benefit.local":"Selected with local knowledge","ta.benefit.localCopy":"Find cultural highlights, hidden corners and practical options for your trip.","ta.benefit.easy":"Simple from search to voucher","ta.benefit.easyCopy":"Keep booking details, tickets and pickup information connected to your trip.","ta.directory.eyebrow":"Destination directory","ta.directory.title":"Find your destination","ta.directory.copy":"Browse available locations by country and open a filtered experience search.","ta.results.back":"Back to inspiration","ta.results.title":"Experiences in {destination}","ta.results.count":"{count} experiences","ta.results.sort":"Sort by","ta.results.popular":"Recommended","ta.results.price":"Lowest price","ta.results.rating":"Highest rating","ta.filters.title":"Filter experiences","ta.filters.clear":"Clear all","ta.filters.category":"Category","ta.filters.price":"Maximum price","ta.filters.duration":"Duration","ta.filters.language":"Language","ta.filters.features":"Booking features","ta.filters.rating":"Minimum rating","ta.filters.any":"Any","ta.filters.short":"Up to 3 hours","ta.filters.half":"Half day","ta.filters.full":"Full day","ta.filters.multi":"Multiple days","ta.filters.english":"English","ta.filters.swedish":"Swedish","ta.filters.norwegian":"Norwegian","ta.filters.danish":"Danish","ta.filters.accessible":"Accessibility information","ta.filters.freeCancel":"Free cancellation","ta.filters.pickup":"Hotel pickup","ta.filters.instant":"Instant confirmation","ta.noResults":"No experiences match the current filters.","ta.loadMore":"Show more experiences","ta.detail.back":"Back to results","ta.detail.highlights":"Experience highlights","ta.detail.about":"About this experience","ta.detail.itinerary":"What you will do","ta.detail.included":"Included","ta.detail.notIncluded":"Not included","ta.detail.important":"Important information","ta.detail.meeting":"Meeting point & pickup","ta.detail.accessibility":"Accessibility","ta.detail.cancellation":"Cancellation policy","ta.detail.choose":"Choose date and guests","ta.detail.date":"Date","ta.detail.time":"Time","ta.detail.adults":"Adults","ta.detail.children":"Children","ta.detail.total":"Estimated total","ta.detail.book":"Continue to booking","ta.detail.liveRequired":"Search live availability to confirm the final time and price.","ta.detail.preview":"Preview experience","ta.detail.provider":"Provided by","ta.detail.duration":"Duration","ta.detail.mobileTicket":"Mobile voucher accepted","ta.detail.share":"Share","ta.detail.favorite":"Save","ta.detail.saved":"Saved","ta.error.load":"Experiences are temporarily unavailable.","ta.error.search":"The experience search could not be completed.","ta.error.location":"Your location could not be used. Search by destination instead.","ta.toast.preview":"This is preview content. Connect an experience provider for live availability and checkout.","ta.toast.newsletter":"Thank you for subscribing.","shell.club.your":"Your SKANDI Club","shell.club.join":"Join SKANDI Club","shell.club.hi":"Hi, {name}","shell.club.welcome":"Welcome Back","shell.club.signinCopy":"Sign in to access your trips, rewards and travel documents.","shell.club.points":"{count} points","shell.profile":"My Profile","shell.logout":"Logout","shell.email":"Email address","shell.password":"Password","shell.login":"Log In","shell.explore":"Explore SKANDI Travels","ta.detail.step1":"Meet the local host and review the day.","ta.detail.step2":"Travel through the main highlights with scheduled stops.","ta.detail.step3":"Enjoy free time for photos, food or swimming where applicable.","ta.detail.step4":"Return to the agreed meeting or pickup point.","ta.detail.included1":"Local host or guide","ta.detail.included2":"Activities described in the itinerary","ta.detail.included3":"Digital voucher and booking support","ta.detail.not1":"Personal purchases","ta.detail.not2":"Optional gratuities","ta.detail.not3":"Items not listed as included","ta.detail.meetingFallback":"The exact meeting point is confirmed on the voucher.","ta.detail.accessibilityFallback":"Contact SKANDI before booking to confirm individual accessibility needs.","ta.detail.cancellationFallback":"Supplier cancellation terms are shown before payment.","ta.linkCopied":"Link copied"},"SV":{"nav.packages":"Paketresor","nav.destinations":"Destinationer","nav.club":"Signature Club","nav.info":"Reseinfo","nav.search":"Sök","nav.clubBtn":"SKANDI Club","nav.menu":"MENY","nav.signIn":"Logga in","settings.language":"Språk","settings.currency":"Valuta","settings.apply":"Spara inställningar","welcome.title":"Välkommen till SKANDI","welcome.copy":"Välj språk och valuta innan du fortsätter.","welcome.btn":"Fortsätt till webbplatsen","footer.news.title":"Få SKANDI-erbjudanden och reseinspiration","footer.news.desc":"Få destinationsguider, nyheter från Signature Collection och medlemserbjudanden.","footer.news.btn":"Registrera","footer.col1.title":"Boka & res","footer.col1.l1":"Hantera din bokning","footer.col1.l2":"Boka en resa","footer.col1.l3":"Signature Collection","footer.col1.l4":"Destinationer","footer.col1.l5":"Hotell","footer.col1.l6":"Flyg","footer.col1.l7":"Turer & aktiviteter","footer.col1.l8":"Hyrbil","footer.col1.l9":"Erbjudanden","footer.col2.title":"Hjälp & reseinfo","footer.col2.l1":"Innan du reser","footer.col2.l2":"Pass & visum","footer.col2.l3":"Bagage","footer.col2.l4":"Försäkring","footer.col2.l5":"Hjälpcenter","footer.col2.l6":"Kontakta oss","footer.col2.l7":"Särskild assistans","footer.col3.title":"SKANDI Club","footer.col3.l1":"Gå med i SKANDI Club","footer.col3.l2":"Medlemsförmåner","footer.col3.l3":"Min klubbstatus","footer.col3.l4":"Reseplånbok & värdebevis","footer.col4.title":"Om","footer.col4.l1":"Om SKANDI Travels","footer.col4.l2":"Nyhetsrum","footer.col4.l3":"Karriär","footer.col4.l4":"Vårt nätverk","footer.bottom.terms":"Betalningsmetoder, leverantörsvillkor och paketreseregler kan variera beroende på produkt.","footer.bottom.l1":"Juridiskt","footer.bottom.l8":"Användarvillkor","footer.bottom.l2":"Tillgänglighet","footer.bottom.l3":"Ansvarsfriskrivning","footer.bottom.l4":"Integritetspolicy","footer.bottom.l5":"Cookiepolicy","footer.bottom.l6":"Bokningsvillkor","footer.bottom.l7":"Personallogin","ta.pageTitle":"Turer & aktiviteter | SKANDI Travels","ta.hero.kicker":"SKANDI-UPPLEVELSER","ta.hero.title":"Hitta något värt att minnas.","ta.hero.copy":"Boka utflykter, sevärdheter, dagsturer, transfer och lokala upplevelser på ditt nästa resmål.","ta.search.destination":"Vart vill du resa?","ta.search.destinationPh":"Stad, ö, semesterort eller sevärdhet","ta.search.from":"Från","ta.search.to":"Till","ta.search.travelers":"Resenärer","ta.search.button":"Sök upplevelser","ta.search.nearby":"Hitta upplevelser nära mig","ta.search.nearbyCopy":"Använd din plats för att se vad som finns i närheten.","ta.category.all":"Alla upplevelser","ta.category.daytrips":"Utflykter & dagsturer","ta.category.activities":"Aktiviteter","ta.category.attractions":"Sevärdheter & guidade turer","ta.category.food":"Mat & dryck","ta.category.water":"Båt & vatten","ta.category.transfers":"Transfer","ta.collection.signature":"SKANDI Signature Experiences","ta.collection.signatureCopy":"Särpräglade upplevelser i mindre grupper, utvalda för kvalitet, lokal karaktär och starka gästomdömen.","ta.collection.responsible":"Responsible Choice","ta.collection.responsibleCopy":"Upplevelser som stödjer lokalsamhällen, natur och resor med mindre påverkan.","ta.collection.explore":"Utforska kollektionen","ta.member.title":"Ha alla biljetter på samma plats","ta.member.copy":"Logga in för att spara favoriter, se värdebevis och koppla upplevelser till din SKANDI-resa.","ta.member.button":"Öppna SKANDI Club","ta.popular.eyebrow":"Utforska efter resmål","ta.popular.title":"Populära resmål","ta.popular.copy":"Börja med platser som erbjuder ett stort urval av dagsturer, sevärdheter och lokala aktiviteter.","ta.recommended.eyebrow":"Utvalt för dig","ta.recommended.title":"Rekommenderade upplevelser","ta.recommended.copy":"Originalinnehåll för SKANDI-förhandsvisning. Aktuellt utbud och priser visas när en leverantör är ansluten.","ta.viewAll":"Visa alla upplevelser","ta.freeCancellation":"Fri avbokning","ta.pickup":"Hotellhämtning finns","ta.instant":"Direktbekräftelse","ta.languages":"Språk","ta.fromPrice":"Från","ta.perPerson":"per person","ta.rating":"Gästbetyg","ta.reviews":"omdömen","ta.trust.title":"Res med tydlig information","ta.trust.copy":"Se mötesplats, längd, språk, tillgänglighet, avbokningsvillkor och vad som ingår innan du bokar.","ta.benefits.title":"Varför boka en upplevelse med SKANDI","ta.benefit.world":"Upplevelser i hela världen","ta.benefit.worldCopy":"Upptäck aktiviteter på badorter, i städer och på landsbygden.","ta.benefit.local":"Utvalt med lokal kunskap","ta.benefit.localCopy":"Hitta kulturella höjdpunkter, dolda pärlor och praktiska alternativ för din resa.","ta.benefit.easy":"Enkelt från sökning till värdebevis","ta.benefit.easyCopy":"Håll bokningsdetaljer, biljetter och hämtningsinformation kopplade till resan.","ta.directory.eyebrow":"Resmålsregister","ta.directory.title":"Hitta ditt resmål","ta.directory.copy":"Bläddra bland platser efter land och öppna en filtrerad sökning.","ta.results.back":"Tillbaka till inspiration","ta.results.title":"Upplevelser i {destination}","ta.results.count":"{count} upplevelser","ta.results.sort":"Sortera efter","ta.results.popular":"Rekommenderade","ta.results.price":"Lägsta pris","ta.results.rating":"Högsta betyg","ta.filters.title":"Filtrera upplevelser","ta.filters.clear":"Rensa alla","ta.filters.category":"Kategori","ta.filters.price":"Högsta pris","ta.filters.duration":"Längd","ta.filters.language":"Språk","ta.filters.features":"Bokningsfunktioner","ta.filters.rating":"Lägsta betyg","ta.filters.any":"Alla","ta.filters.short":"Upp till 3 timmar","ta.filters.half":"Halvdag","ta.filters.full":"Heldag","ta.filters.multi":"Flera dagar","ta.filters.english":"Engelska","ta.filters.swedish":"Svenska","ta.filters.norwegian":"Norska","ta.filters.danish":"Danska","ta.filters.accessible":"Tillgänglighetsinformation","ta.filters.freeCancel":"Fri avbokning","ta.filters.pickup":"Hotellhämtning","ta.filters.instant":"Direktbekräftelse","ta.noResults":"Inga upplevelser matchar filtren.","ta.loadMore":"Visa fler upplevelser","ta.detail.back":"Tillbaka till resultaten","ta.detail.highlights":"Upplevelsens höjdpunkter","ta.detail.about":"Om upplevelsen","ta.detail.itinerary":"Det här får du göra","ta.detail.included":"Ingår","ta.detail.notIncluded":"Ingår inte","ta.detail.important":"Viktig information","ta.detail.meeting":"Mötesplats & hämtning","ta.detail.accessibility":"Tillgänglighet","ta.detail.cancellation":"Avbokningsvillkor","ta.detail.choose":"Välj datum och resenärer","ta.detail.date":"Datum","ta.detail.time":"Tid","ta.detail.adults":"Vuxna","ta.detail.children":"Barn","ta.detail.total":"Beräknat totalpris","ta.detail.book":"Fortsätt till bokning","ta.detail.liveRequired":"Sök aktuell tillgänglighet för att bekräfta slutlig tid och pris.","ta.detail.preview":"Förhandsvisning","ta.detail.provider":"Arrangeras av","ta.detail.duration":"Längd","ta.detail.mobileTicket":"Mobil värdehandling accepteras","ta.detail.share":"Dela","ta.detail.favorite":"Spara","ta.detail.saved":"Sparad","ta.error.load":"Upplevelserna är tillfälligt otillgängliga.","ta.error.search":"Sökningen kunde inte genomföras.","ta.error.location":"Din plats kunde inte användas. Sök efter ett resmål i stället.","ta.toast.preview":"Detta är förhandsvisningsinnehåll. Anslut en upplevelseleverantör för aktuellt utbud och betalning.","ta.toast.newsletter":"Tack för din registrering.","shell.club.your":"Din SKANDI Club","shell.club.join":"Gå med i SKANDI Club","shell.club.hi":"Hej, {name}","shell.club.welcome":"Välkommen tillbaka","shell.club.signinCopy":"Logga in för att se resor, belöningar och resedokument.","shell.club.points":"{count} poäng","shell.profile":"Min profil","shell.logout":"Logga ut","shell.email":"E-postadress","shell.password":"Lösenord","shell.login":"Logga in","shell.explore":"Utforska SKANDI Travels","ta.detail.step1":"Möt den lokala värden och gå igenom dagen.","ta.detail.step2":"Besök de viktigaste höjdpunkterna med planerade stopp.","ta.detail.step3":"Få egen tid för foton, mat eller bad när det passar.","ta.detail.step4":"Återvänd till avtalad mötesplats eller hämtningsplats.","ta.detail.included1":"Lokal värd eller guide","ta.detail.included2":"Aktiviteterna som beskrivs i programmet","ta.detail.included3":"Digitalt värdebevis och bokningssupport","ta.detail.not1":"Personliga inköp","ta.detail.not2":"Valfri dricks","ta.detail.not3":"Sådant som inte anges som inkluderat","ta.detail.meetingFallback":"Exakt mötesplats bekräftas på värdebeviset.","ta.detail.accessibilityFallback":"Kontakta SKANDI före bokning för att bekräfta individuella tillgänglighetsbehov.","ta.detail.cancellationFallback":"Leverantörens avbokningsvillkor visas före betalning.","ta.linkCopied":"Länken har kopierats"},"NO":{"nav.packages":"Pakkereiser","nav.destinations":"Reisemål","nav.club":"Signature Club","nav.info":"Reiseinfo","nav.search":"Søk","nav.clubBtn":"SKANDI Club","nav.menu":"MENY","nav.signIn":"Logg inn","settings.language":"Språk","settings.currency":"Valuta","settings.apply":"Lagre innstillinger","welcome.title":"Velkommen til SKANDI","welcome.copy":"Bekreft språk og valuta før du fortsetter.","welcome.btn":"Fortsett til nettstedet","footer.news.title":"Få SKANDI-tilbud og reiseinspirasjon","footer.news.desc":"Motta reisemålsguider, Signature Collection-nyheter og medlemstilbud.","footer.news.btn":"Registrer","footer.col1.title":"Bestill & reis","footer.col1.l1":"Administrer bestillingen","footer.col1.l2":"Bestill en reise","footer.col1.l3":"Signature Collection","footer.col1.l4":"Reisemål","footer.col1.l5":"Hoteller","footer.col1.l6":"Fly","footer.col1.l7":"Turer & aktiviteter","footer.col1.l8":"Leiebil","footer.col1.l9":"Tilbud","footer.col2.title":"Hjelp & reiseinfo","footer.col2.l1":"Før du reiser","footer.col2.l2":"Pass & visum","footer.col2.l3":"Bagasje","footer.col2.l4":"Forsikring","footer.col2.l5":"Hjelpesenter","footer.col2.l6":"Kontakt oss","footer.col2.l7":"Spesiell assistanse","footer.col3.title":"SKANDI Club","footer.col3.l1":"Bli med i SKANDI Club","footer.col3.l2":"Medlemsfordeler","footer.col3.l3":"Min klubbstatus","footer.col3.l4":"Reiselommebok & verdikuponger","footer.col4.title":"Om","footer.col4.l1":"Om SKANDI Travels","footer.col4.l2":"Nyhetsrom","footer.col4.l3":"Karriere","footer.col4.l4":"Vårt nettverk","footer.bottom.terms":"Betalingsmetoder, leverandørvilkår og pakkereisebetingelser kan variere etter produkt.","footer.bottom.l1":"Juridisk","footer.bottom.l8":"Bruksvilkår","footer.bottom.l2":"Tilgjengelighet","footer.bottom.l3":"Ansvarsfraskrivelse","footer.bottom.l4":"Personvern","footer.bottom.l5":"Informasjonskapsler","footer.bottom.l6":"Bestillingsvilkår","footer.bottom.l7":"Ansattinnlogging","ta.pageTitle":"Turer & aktiviteter | SKANDI Travels","ta.hero.kicker":"SKANDI-OPPLEVELSER","ta.hero.title":"Finn noe som er verdt å huske.","ta.hero.copy":"Bestill utflukter, attraksjoner, dagsturer, transport og lokale opplevelser på ditt neste reisemål.","ta.search.destination":"Hvor vil du reise?","ta.search.destinationPh":"By, øy, feriested eller attraksjon","ta.search.from":"Fra","ta.search.to":"Til","ta.search.travelers":"Reisende","ta.search.button":"Søk opplevelser","ta.search.nearby":"Finn opplevelser nær meg","ta.search.nearbyCopy":"Bruk posisjonen din for å se hva som finnes i nærheten.","ta.category.all":"Alle opplevelser","ta.category.daytrips":"Utflukter & dagsturer","ta.category.activities":"Aktiviteter","ta.category.attractions":"Attraksjoner & guidede turer","ta.category.food":"Mat & drikke","ta.category.water":"Båt & vann","ta.category.transfers":"Transport","ta.collection.signature":"SKANDI Signature Experiences","ta.collection.signatureCopy":"Særpregede smågruppeopplevelser valgt for kvalitet, lokal karakter og gode gjesteomtaler.","ta.collection.responsible":"Responsible Choice","ta.collection.responsibleCopy":"Opplevelser som støtter lokalsamfunn, natur og reiser med mindre påvirkning.","ta.collection.explore":"Utforsk kolleksjonen","ta.member.title":"Ha alle billettene på ett sted","ta.member.copy":"Logg inn for å lagre favoritter, se verdikuponger og koble opplevelser til SKANDI-reisen.","ta.member.button":"Åpne SKANDI Club","ta.popular.eyebrow":"Utforsk etter reisemål","ta.popular.title":"Populære reisemål","ta.popular.copy":"Start med steder som tilbyr et bredt utvalg av dagsturer, attraksjoner og lokale aktiviteter.","ta.recommended.eyebrow":"Valgt for deg","ta.recommended.title":"Anbefalte opplevelser","ta.recommended.copy":"Originalt SKANDI-forhåndsinnhold. Aktuelt utvalg og priser vises når en leverandør er koblet til.","ta.viewAll":"Se alle opplevelser","ta.freeCancellation":"Gratis avbestilling","ta.pickup":"Hotellhenting tilgjengelig","ta.instant":"Umiddelbar bekreftelse","ta.languages":"Språk","ta.fromPrice":"Fra","ta.perPerson":"per person","ta.rating":"Gjestevurdering","ta.reviews":"omtaler","ta.trust.title":"Reis med tydelig informasjon","ta.trust.copy":"Se møtested, varighet, språk, tilgjengelighet, avbestillingsvilkår og hva som er inkludert før bestilling.","ta.benefits.title":"Hvorfor bestille en opplevelse med SKANDI","ta.benefit.world":"Opplevelser over hele verden","ta.benefit.worldCopy":"Oppdag aktiviteter på badesteder, i byer og på landsbygda.","ta.benefit.local":"Valgt med lokal kunnskap","ta.benefit.localCopy":"Finn kulturelle høydepunkter, skjulte steder og praktiske valg for reisen.","ta.benefit.easy":"Enkelt fra søk til verdikupong","ta.benefit.easyCopy":"Hold bestillingsdetaljer, billetter og henteinformasjon koblet til reisen.","ta.directory.eyebrow":"Reisemålsoversikt","ta.directory.title":"Finn reisemålet ditt","ta.directory.copy":"Bla etter land og åpne et filtrert opplevelsessøk.","ta.results.back":"Tilbake til inspirasjon","ta.results.title":"Opplevelser i {destination}","ta.results.count":"{count} opplevelser","ta.results.sort":"Sorter etter","ta.results.popular":"Anbefalt","ta.results.price":"Laveste pris","ta.results.rating":"Høyeste vurdering","ta.filters.title":"Filtrer opplevelser","ta.filters.clear":"Fjern alle","ta.filters.category":"Kategori","ta.filters.price":"Makspris","ta.filters.duration":"Varighet","ta.filters.language":"Språk","ta.filters.features":"Bestillingsfunksjoner","ta.filters.rating":"Minste vurdering","ta.filters.any":"Alle","ta.filters.short":"Opptil 3 timer","ta.filters.half":"Halv dag","ta.filters.full":"Hel dag","ta.filters.multi":"Flere dager","ta.filters.english":"Engelsk","ta.filters.swedish":"Svensk","ta.filters.norwegian":"Norsk","ta.filters.danish":"Dansk","ta.filters.accessible":"Tilgjengelighetsinformasjon","ta.filters.freeCancel":"Gratis avbestilling","ta.filters.pickup":"Hotellhenting","ta.filters.instant":"Umiddelbar bekreftelse","ta.noResults":"Ingen opplevelser passer filtrene.","ta.loadMore":"Vis flere opplevelser","ta.detail.back":"Tilbake til resultatene","ta.detail.highlights":"Høydepunkter","ta.detail.about":"Om opplevelsen","ta.detail.itinerary":"Dette skal du gjøre","ta.detail.included":"Inkludert","ta.detail.notIncluded":"Ikke inkludert","ta.detail.important":"Viktig informasjon","ta.detail.meeting":"Møtested & henting","ta.detail.accessibility":"Tilgjengelighet","ta.detail.cancellation":"Avbestillingsvilkår","ta.detail.choose":"Velg dato og reisende","ta.detail.date":"Dato","ta.detail.time":"Tid","ta.detail.adults":"Voksne","ta.detail.children":"Barn","ta.detail.total":"Beregnet totalpris","ta.detail.book":"Fortsett til bestilling","ta.detail.liveRequired":"Søk aktuell tilgjengelighet for å bekrefte endelig tid og pris.","ta.detail.preview":"Forhåndsvisning","ta.detail.provider":"Leveres av","ta.detail.duration":"Varighet","ta.detail.mobileTicket":"Mobil verdikupong godtas","ta.detail.share":"Del","ta.detail.favorite":"Lagre","ta.detail.saved":"Lagret","ta.error.load":"Opplevelsene er midlertidig utilgjengelige.","ta.error.search":"Søket kunne ikke fullføres.","ta.error.location":"Posisjonen din kunne ikke brukes. Søk etter et reisemål i stedet.","ta.toast.preview":"Dette er forhåndsinnhold. Koble til en opplevelsesleverandør for aktuelt utvalg og betaling.","ta.toast.newsletter":"Takk for registreringen.","shell.club.your":"Din SKANDI Club","shell.club.join":"Bli med i SKANDI Club","shell.club.hi":"Hei, {name}","shell.club.welcome":"Velkommen tilbake","shell.club.signinCopy":"Logg inn for å se reiser, belønninger og reisedokumenter.","shell.club.points":"{count} poeng","shell.profile":"Min profil","shell.logout":"Logg ut","shell.email":"E-postadresse","shell.password":"Passord","shell.login":"Logg inn","shell.explore":"Utforsk SKANDI Travels","ta.detail.step1":"Møt den lokale verten og gå gjennom dagen.","ta.detail.step2":"Besøk hovedhøydepunktene med planlagte stopp.","ta.detail.step3":"Få tid på egen hånd til bilder, mat eller bading der det passer.","ta.detail.step4":"Dra tilbake til avtalt møte- eller hentested.","ta.detail.included1":"Lokal vert eller guide","ta.detail.included2":"Aktivitetene som er beskrevet i programmet","ta.detail.included3":"Digital verdikupong og bestillingsstøtte","ta.detail.not1":"Personlige kjøp","ta.detail.not2":"Valgfri driks","ta.detail.not3":"Elementer som ikke er oppført som inkludert","ta.detail.meetingFallback":"Nøyaktig møtested bekreftes på verdikupongen.","ta.detail.accessibilityFallback":"Kontakt SKANDI før bestilling for å bekrefte individuelle tilgjengelighetsbehov.","ta.detail.cancellationFallback":"Leverandørens avbestillingsvilkår vises før betaling.","ta.linkCopied":"Lenken er kopiert"},"DA":{"nav.packages":"Pakkerejser","nav.destinations":"Destinationer","nav.club":"Signature Club","nav.info":"Rejseinfo","nav.search":"Søg","nav.clubBtn":"SKANDI Club","nav.menu":"MENU","nav.signIn":"Log ind","settings.language":"Sprog","settings.currency":"Valuta","settings.apply":"Gem indstillinger","welcome.title":"Velkommen til SKANDI","welcome.copy":"Bekræft sprog og valuta, før du fortsætter.","welcome.btn":"Fortsæt til hjemmesiden","footer.news.title":"Få SKANDI-tilbud og rejseinspiration","footer.news.desc":"Modtag destinationsguider, Signature Collection-opdateringer og medlemstilbud.","footer.news.btn":"Tilmeld","footer.col1.title":"Book & rejs","footer.col1.l1":"Administrer din booking","footer.col1.l2":"Book en rejse","footer.col1.l3":"Signature Collection","footer.col1.l4":"Destinationer","footer.col1.l5":"Hoteller","footer.col1.l6":"Fly","footer.col1.l7":"Ture & aktiviteter","footer.col1.l8":"Biludlejning","footer.col1.l9":"Tilbud","footer.col2.title":"Hjælp & rejseinfo","footer.col2.l1":"Før du rejser","footer.col2.l2":"Pas & visum","footer.col2.l3":"Bagage","footer.col2.l4":"Forsikring","footer.col2.l5":"Hjælpecenter","footer.col2.l6":"Kontakt os","footer.col2.l7":"Særlig assistance","footer.col3.title":"SKANDI Club","footer.col3.l1":"Bliv medlem af SKANDI Club","footer.col3.l2":"Medlemsfordele","footer.col3.l3":"Min klubstatus","footer.col3.l4":"Rejsetegnebog & værdibeviser","footer.col4.title":"Om","footer.col4.l1":"Om SKANDI Travels","footer.col4.l2":"Nyhedsrum","footer.col4.l3":"Karriere","footer.col4.l4":"Vores netværk","footer.bottom.terms":"Betalingsmetoder, leverandørvilkår og pakkerejsebetingelser kan variere efter produkt.","footer.bottom.l1":"Juridisk","footer.bottom.l8":"Brugsvilkår","footer.bottom.l2":"Tilgængelighed","footer.bottom.l3":"Ansvarsfraskrivelse","footer.bottom.l4":"Privatlivspolitik","footer.bottom.l5":"Cookiepolitik","footer.bottom.l6":"Bookingvilkår","footer.bottom.l7":"Medarbejderlogin","ta.pageTitle":"Ture & aktiviteter | SKANDI Travels","ta.hero.kicker":"SKANDI-OPLEVELSER","ta.hero.title":"Find noget, der er værd at huske.","ta.hero.copy":"Book udflugter, attraktioner, dagsture, transfer og lokale oplevelser på din næste destination.","ta.search.destination":"Hvor vil du hen?","ta.search.destinationPh":"By, ø, ferieområde eller attraktion","ta.search.from":"Fra","ta.search.to":"Til","ta.search.travelers":"Rejsende","ta.search.button":"Søg oplevelser","ta.search.nearby":"Find oplevelser nær mig","ta.search.nearbyCopy":"Brug din placering til at se, hvad der findes i nærheden.","ta.category.all":"Alle oplevelser","ta.category.daytrips":"Udflugter & dagsture","ta.category.activities":"Aktiviteter","ta.category.attractions":"Attraktioner & guidede ture","ta.category.food":"Mad & drikke","ta.category.water":"Båd & vand","ta.category.transfers":"Transfer","ta.collection.signature":"SKANDI Signature Experiences","ta.collection.signatureCopy":"Særprægede oplevelser i små grupper, udvalgt for kvalitet, lokal karakter og gode gæsteanmeldelser.","ta.collection.responsible":"Responsible Choice","ta.collection.responsibleCopy":"Oplevelser, der støtter lokalsamfund, natur og rejser med mindre påvirkning.","ta.collection.explore":"Udforsk kollektionen","ta.member.title":"Saml alle billetter ét sted","ta.member.copy":"Log ind for at gemme favoritter, se værdibeviser og forbinde oplevelser med din SKANDI-rejse.","ta.member.button":"Åbn SKANDI Club","ta.popular.eyebrow":"Udforsk efter destination","ta.popular.title":"Populære destinationer","ta.popular.copy":"Start med steder, der tilbyder et bredt udvalg af dagsture, attraktioner og lokale aktiviteter.","ta.recommended.eyebrow":"Udvalgt til dig","ta.recommended.title":"Anbefalede oplevelser","ta.recommended.copy":"Originalt SKANDI-forhåndsindhold. Aktuelt udvalg og priser vises, når en leverandør er tilsluttet.","ta.viewAll":"Se alle oplevelser","ta.freeCancellation":"Gratis afbestilling","ta.pickup":"Hotelafhentning mulig","ta.instant":"Øjeblikkelig bekræftelse","ta.languages":"Sprog","ta.fromPrice":"Fra","ta.perPerson":"pr. person","ta.rating":"Gæstebedømmelse","ta.reviews":"anmeldelser","ta.trust.title":"Rejs med tydelig information","ta.trust.copy":"Se mødested, varighed, sprog, tilgængelighed, afbestillingsvilkår og hvad der er inkluderet før booking.","ta.benefits.title":"Hvorfor booke en oplevelse med SKANDI","ta.benefit.world":"Oplevelser i hele verden","ta.benefit.worldCopy":"Oplev aktiviteter ved badesteder, i byer og på landet.","ta.benefit.local":"Udvalgt med lokalkendskab","ta.benefit.localCopy":"Find kulturelle højdepunkter, skjulte steder og praktiske muligheder til rejsen.","ta.benefit.easy":"Nemt fra søgning til værdibevis","ta.benefit.easyCopy":"Hold bookingoplysninger, billetter og afhentningsinformation samlet med rejsen.","ta.directory.eyebrow":"Destinationsoversigt","ta.directory.title":"Find din destination","ta.directory.copy":"Se steder efter land og åbn en filtreret oplevelsessøgning.","ta.results.back":"Tilbage til inspiration","ta.results.title":"Oplevelser i {destination}","ta.results.count":"{count} oplevelser","ta.results.sort":"Sortér efter","ta.results.popular":"Anbefalet","ta.results.price":"Laveste pris","ta.results.rating":"Højeste bedømmelse","ta.filters.title":"Filtrér oplevelser","ta.filters.clear":"Ryd alle","ta.filters.category":"Kategori","ta.filters.price":"Maksimumpris","ta.filters.duration":"Varighed","ta.filters.language":"Sprog","ta.filters.features":"Bookingfunktioner","ta.filters.rating":"Minimumsbedømmelse","ta.filters.any":"Alle","ta.filters.short":"Op til 3 timer","ta.filters.half":"Halv dag","ta.filters.full":"Hel dag","ta.filters.multi":"Flere dage","ta.filters.english":"Engelsk","ta.filters.swedish":"Svensk","ta.filters.norwegian":"Norsk","ta.filters.danish":"Dansk","ta.filters.accessible":"Tilgængelighedsinformation","ta.filters.freeCancel":"Gratis afbestilling","ta.filters.pickup":"Hotelafhentning","ta.filters.instant":"Øjeblikkelig bekræftelse","ta.noResults":"Ingen oplevelser matcher filtrene.","ta.loadMore":"Vis flere oplevelser","ta.detail.back":"Tilbage til resultater","ta.detail.highlights":"Oplevelsens højdepunkter","ta.detail.about":"Om oplevelsen","ta.detail.itinerary":"Det skal du opleve","ta.detail.included":"Inkluderet","ta.detail.notIncluded":"Ikke inkluderet","ta.detail.important":"Vigtig information","ta.detail.meeting":"Mødested & afhentning","ta.detail.accessibility":"Tilgængelighed","ta.detail.cancellation":"Afbestillingsvilkår","ta.detail.choose":"Vælg dato og rejsende","ta.detail.date":"Dato","ta.detail.time":"Tid","ta.detail.adults":"Voksne","ta.detail.children":"Børn","ta.detail.total":"Anslået totalpris","ta.detail.book":"Fortsæt til booking","ta.detail.liveRequired":"Søg aktuel tilgængelighed for at bekræfte endelig tid og pris.","ta.detail.preview":"Forhåndsvisning","ta.detail.provider":"Leveres af","ta.detail.duration":"Varighed","ta.detail.mobileTicket":"Mobil værdikupon accepteres","ta.detail.share":"Del","ta.detail.favorite":"Gem","ta.detail.saved":"Gemt","ta.error.load":"Oplevelserne er midlertidigt utilgængelige.","ta.error.search":"Søgningen kunne ikke gennemføres.","ta.error.location":"Din placering kunne ikke bruges. Søg efter en destination i stedet.","ta.toast.preview":"Dette er forhåndsindhold. Tilslut en oplevelsesleverandør for aktuelt udvalg og betaling.","ta.toast.newsletter":"Tak for din tilmelding.","shell.club.your":"Din SKANDI Club","shell.club.join":"Bliv medlem af SKANDI Club","shell.club.hi":"Hej, {name}","shell.club.welcome":"Velkommen tilbage","shell.club.signinCopy":"Log ind for at se rejser, belønninger og rejsedokumenter.","shell.club.points":"{count} point","shell.profile":"Min profil","shell.logout":"Log ud","shell.email":"E-mailadresse","shell.password":"Adgangskode","shell.login":"Log ind","shell.explore":"Udforsk SKANDI Travels","ta.detail.step1":"Mød den lokale vært og gennemgå dagen.","ta.detail.step2":"Besøg de vigtigste højdepunkter med planlagte stop.","ta.detail.step3":"Få tid på egen hånd til billeder, mad eller badning, hvor det er relevant.","ta.detail.step4":"Vend tilbage til det aftalte møde- eller afhentningssted.","ta.detail.included1":"Lokal vært eller guide","ta.detail.included2":"Aktiviteterne beskrevet i programmet","ta.detail.included3":"Digital værdikupon og bookingsupport","ta.detail.not1":"Personlige køb","ta.detail.not2":"Valgfri drikkepenge","ta.detail.not3":"Elementer, der ikke er angivet som inkluderet","ta.detail.meetingFallback":"Det præcise mødested bekræftes på værdikuponen.","ta.detail.accessibilityFallback":"Kontakt SKANDI før booking for at bekræfte individuelle tilgængelighedsbehov.","ta.detail.cancellationFallback":"Leverandørens afbestillingsvilkår vises før betaling.","ta.linkCopied":"Linket er kopieret"}};
const FALLBACK_DESTINATIONS=[{"id":"phuket","country":"thailand","name":{"EN":"Phuket, Thailand","SV":"Phuket, Thailand","NO":"Phuket, Thailand","DA":"Phuket, Thailand"},"count":48,"image":"https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?auto=format&fit=crop&w=1200&q=82"},{"id":"crete","country":"greece","name":{"EN":"Crete, Greece","SV":"Kreta, Grekland","NO":"Kreta, Hellas","DA":"Kreta, Grækenland"},"count":64,"image":"https://images.unsplash.com/photo-1555993539-1732b0258235?auto=format&fit=crop&w=1200&q=82"},{"id":"mallorca","country":"spain","name":{"EN":"Mallorca, Spain","SV":"Mallorca, Spanien","NO":"Mallorca, Spania","DA":"Mallorca, Spanien"},"count":73,"image":"https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=82"},{"id":"rome","country":"italy","name":{"EN":"Rome, Italy","SV":"Rom, Italien","NO":"Roma, Italia","DA":"Rom, Italien"},"count":112,"image":"https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1200&q=82"},{"id":"new-york","country":"united-states","name":{"EN":"New York, United States","SV":"New York, USA","NO":"New York, USA","DA":"New York, USA"},"count":96,"image":"https://images.unsplash.com/photo-1522083165195-3424ed129620?auto=format&fit=crop&w=1200&q=82"},{"id":"barcelona","country":"spain","name":{"EN":"Barcelona, Spain","SV":"Barcelona, Spanien","NO":"Barcelona, Spania","DA":"Barcelona, Spanien"},"count":88,"image":"https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&w=1200&q=82"},{"id":"stockholm","country":"sweden","name":{"EN":"Stockholm, Sweden","SV":"Stockholm, Sverige","NO":"Stockholm, Sverige","DA":"Stockholm, Sverige"},"count":36,"image":"https://images.unsplash.com/photo-1509356843151-3e7d96241e11?auto=format&fit=crop&w=1200&q=82"},{"id":"bangkok","country":"thailand","name":{"EN":"Bangkok, Thailand","SV":"Bangkok, Thailand","NO":"Bangkok, Thailand","DA":"Bangkok, Thailand"},"count":81,"image":"https://images.unsplash.com/photo-1563492065599-3520f775eeed?auto=format&fit=crop&w=1200&q=82"}];
const FALLBACK_EXPERIENCES=[{"id":"phuket-islands-sunrise","destination":"phuket","category":"water","title":{"EN":"Phi Phi islands sunrise cruise","SV":"Soluppgångskryssning till Phi Phi-öarna","NO":"Soloppgangscruise til Phi Phi-øyene","DA":"Solopgangskrydstogt til Phi Phi-øerne"},"description":{"EN":"Leave early for calmer water, island viewpoints, snorkelling stops and a relaxed lunch by the sea.","SV":"Res tidigt för lugnare vatten, utsiktsplatser, snorklingsstopp och en avslappnad lunch vid havet.","NO":"Reis tidlig for roligere vann, utsiktspunkter, snorklestopp og en avslappet lunsj ved sjøen.","DA":"Tag tidligt af sted til roligere vand, udsigtspunkter, snorkelstop og en afslappet frokost ved havet."},"image":"https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=1400&q=84","rating":4.8,"reviews":842,"duration":"8 h","durationCode":"full","price":129,"currency":"USD","languages":["EN","SV"],"freeCancellation":true,"pickup":true,"instant":true,"accessible":false,"collection":"signature"},{"id":"phuket-old-town-food","destination":"phuket","category":"food","title":{"EN":"Phuket Old Town evening food walk","SV":"Kvällstur med mat i Phuket Old Town","NO":"Kveldstur med mat i Phuket Old Town","DA":"Aftentur med mad i Phuket Old Town"},"description":{"EN":"Taste regional dishes, visit family-run stalls and hear the stories behind the old town’s Sino-Portuguese streets.","SV":"Smaka regionala rätter, besök familjedrivna stånd och hör historierna bakom gamla stans sino-portugisiska gator.","NO":"Smak regionale retter, besøk familiedrevne boder og hør historiene bak gamlebyens sino-portugisiske gater.","DA":"Smag regionale retter, besøg familiedrevne boder og hør historierne bag den gamle bydels sino-portugisiske gader."},"image":"https://images.unsplash.com/photo-1559314809-0d155014e29e?auto=format&fit=crop&w=1400&q=84","rating":4.7,"reviews":264,"duration":"3 h","durationCode":"short","price":58,"currency":"USD","languages":["EN"],"freeCancellation":true,"pickup":false,"instant":true,"accessible":true,"collection":"responsible"},{"id":"crete-wine-olive","destination":"crete","category":"daytrips","title":{"EN":"Western Crete wine and olive estate day","SV":"Vingård och olivgård på västra Kreta","NO":"Vin- og olivgårder på vestlige Kreta","DA":"Vin- og olivgårde på det vestlige Kreta"},"description":{"EN":"Meet local producers, sample island flavours and continue to a coastal village for an unhurried lunch.","SV":"Möt lokala producenter, prova öns smaker och fortsätt till en kustby för en lugn lunch.","NO":"Møt lokale produsenter, smak øyas råvarer og fortsett til en kystlandsby for en rolig lunsj.","DA":"Mød lokale producenter, smag øens råvarer og fortsæt til en kystby for en rolig frokost."},"image":"https://images.unsplash.com/photo-1473973266408-ed4e27abdd47?auto=format&fit=crop&w=1400&q=84","rating":4.9,"reviews":396,"duration":"7 h","durationCode":"full","price":104,"currency":"USD","languages":["EN","SV"],"freeCancellation":true,"pickup":true,"instant":false,"accessible":false,"collection":"responsible"},{"id":"crete-chania-snorkel","destination":"crete","category":"water","title":{"EN":"Chania coast snorkelling boat","SV":"Snorklingsbåt längs Chanias kust","NO":"Snorklebåt langs Chania-kysten","DA":"Snorkelbåd langs Chanias kyst"},"description":{"EN":"Cruise to clear-water coves, stop for guided snorkelling and enjoy time to swim from the boat.","SV":"Kryssa till vikar med klart vatten, snorkla med guide och få tid att bada från båten.","NO":"Dra til bukter med klart vann, snorkle med guide og få tid til å bade fra båten.","DA":"Sejl til bugter med klart vand, snorkl med guide og få tid til at bade fra båden."},"image":"https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1400&q=84","rating":4.5,"reviews":188,"duration":"4 h","durationCode":"half","price":76,"currency":"USD","languages":["EN"],"freeCancellation":true,"pickup":false,"instant":true,"accessible":false,"collection":""},{"id":"mallorca-catamaran","destination":"mallorca","category":"water","title":{"EN":"Mallorca sunset catamaran","SV":"Solnedgångstur med katamaran på Mallorca","NO":"Solnedgangstur med katamaran på Mallorca","DA":"Solnedgangstur med katamaran på Mallorca"},"description":{"EN":"Sail beyond Palma Bay with swimming, a light dinner and an open view of the evening sky.","SV":"Segla utanför Palmabukten med bad, lätt middag och fri utsikt över kvällshimlen.","NO":"Seil utenfor Palma-bukten med bading, lett middag og åpen utsikt mot kveldshimmelen.","DA":"Sejl ud fra Palma-bugten med badning, let middag og frit udsyn til aftenhimlen."},"image":"https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=84","rating":4.6,"reviews":721,"duration":"4 h","durationCode":"half","price":92,"currency":"USD","languages":["EN","DE","ES"],"freeCancellation":true,"pickup":false,"instant":true,"accessible":true,"collection":"signature"},{"id":"rome-after-hours","destination":"rome","category":"attractions","title":{"EN":"Rome after-hours ancient city walk","SV":"Kvällsvandring genom antikens Rom","NO":"Kveldsvandring gjennom antikkens Roma","DA":"Aftenvandring gennem antikkens Rom"},"description":{"EN":"Walk from the forums to the Colosseum with a historian and quieter evening access to key viewpoints.","SV":"Gå från forumen till Colosseum med en historiker och upplev lugnare kvällsvyer.","NO":"Gå fra forumene til Colosseum med en historiker og roligere tilgang til utsiktspunktene om kvelden.","DA":"Gå fra fora til Colosseum med en historiker og oplev roligere aftenadgang til udsigtspunkterne."},"image":"https://images.unsplash.com/photo-1552432552-06c0b0a94dda?auto=format&fit=crop&w=1400&q=84","rating":4.8,"reviews":1304,"duration":"3 h","durationCode":"short","price":86,"currency":"USD","languages":["EN","IT"],"freeCancellation":true,"pickup":false,"instant":true,"accessible":false,"collection":"signature"},{"id":"nyc-harbor-architecture","destination":"new-york","category":"activities","title":{"EN":"New York harbor architecture cruise","SV":"Arkitekturkryssning i New Yorks hamn","NO":"Arkitekturcruise i New York havn","DA":"Arkitekturkrydstogt i New Yorks havn"},"description":{"EN":"See the skyline from the water while an architecture guide explains the city’s evolving waterfront.","SV":"Se stadssiluetten från vattnet medan en arkitekturguide berättar om den föränderliga strandlinjen.","NO":"Se skylinen fra vannet mens en arkitekturguide forteller om byens havnefront.","DA":"Se skylinen fra vandet, mens en arkitekturguide fortæller om byens havnefront."},"image":"https://images.unsplash.com/photo-1522083165195-3424ed129620?auto=format&fit=crop&w=1400&q=84","rating":4.7,"reviews":946,"duration":"2.5 h","durationCode":"short","price":64,"currency":"USD","languages":["EN"],"freeCancellation":true,"pickup":false,"instant":true,"accessible":true,"collection":""},{"id":"stockholm-archipelago-kayak","destination":"stockholm","category":"activities","title":{"EN":"Stockholm archipelago kayak and island lunch","SV":"Kajak i Stockholms skärgård med ölunch","NO":"Kajakk i Stockholms skjærgård med øylunsj","DA":"Kajak i Stockholms skærgård med øfrokost"},"description":{"EN":"Paddle sheltered channels with a local guide and stop on an island for a simple seasonal lunch.","SV":"Paddla i skyddade sund med lokal guide och stanna på en ö för en enkel säsongslunch.","NO":"Padle i skjermede sund med lokal guide og stopp på en øy for en enkel sesonglunsj.","DA":"Padl i beskyttede sund med lokal guide og stop på en ø til en enkel sæsonfrokost."},"image":"https://images.unsplash.com/photo-1530789253388-582c481c54b0?auto=format&fit=crop&w=1400&q=84","rating":4.9,"reviews":173,"duration":"6 h","durationCode":"full","price":145,"currency":"USD","languages":["EN","SV"],"freeCancellation":true,"pickup":true,"instant":false,"accessible":false,"collection":"responsible"}];
const $=id=>document.getElementById(id);const $$=s=>Array.from(document.querySelectorAll(s));
const PARENT_ORIGIN=(()=>{try{return document.referrer?new URL(document.referrer).origin:'*'}catch(_){return'*'}})();
let settings={language:'EN',currency:'USD'};let session={loggedIn:false,displayName:'',points:0,tierName:''};
let data={destinations:FALLBACK_DESTINATIONS,experiences:FALLBACK_EXPERIENCES,collections:[]};
let state={view:'home',selectedDestination:'',selectedCategory:'all',searchResults:[],visibleResults:[],selectedExperience:null,shown:9,sort:'recommended',filters:{categories:new Set(),maxPrice:0,duration:'',language:'',minRating:0,freeCancellation:false,pickup:false,instant:false,accessible:false},country:'all'};
const tr=(key,fallback='')=>I18N[settings.language]?.[key]||I18N.EN[key]||fallback||key;
const loc=(value,fallback='')=>value&&typeof value==='object'?(value[settings.language]||value.EN||Object.values(value)[0]||fallback):(value??fallback);
const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const tokens=(text,values={})=>Object.entries(values).reduce((out,[k,v])=>out.replaceAll(`{${k}}`,String(v)),String(text||''));
const locale=()=>({EN:'en-US',SV:'sv-SE',NO:'nb-NO',DA:'da-DK'})[settings.language]||'en-US';
function money(amount,currency=settings.currency){try{return new Intl.NumberFormat(locale(),{style:'currency',currency,maximumFractionDigits:0}).format(Number(amount||0))}catch(_){return `${amount} ${currency}`}}
function emit(source,type,payload={}){window.parent.postMessage({source,type,payload,timestamp:new Date().toISOString()},PARENT_ORIGIN)}
const post=(type,payload={})=>emit(APP_SOURCE,type,payload);const headerPost=(type,payload={})=>emit(HEADER_SOURCE,type,payload);const footerPost=(type,payload={})=>emit(FOOTER_SOURCE,type,payload);
function toast(message,error=false){const el=$('taToast');el.textContent=message;el.classList.toggle('error',error);el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),3000)}
function setView(view){state.view=view;['home','results','detail'].forEach(name=>$(name==='home'?'taHomeView':name==='results'?'taResultsView':'taDetailView').classList.toggle('active',name===view));window.scrollTo({top:0,behavior:'smooth'})}
function applyTranslations(){document.documentElement.lang=({EN:'en',SV:'sv',NO:'no',DA:'da'})[settings.language]||'en';document.title=tr('ta.pageTitle');$$('[data-i18n]').forEach(el=>{el.textContent=tr(el.dataset.i18n,el.textContent)});$$('[data-i18n-placeholder]').forEach(el=>el.placeholder=tr(el.dataset.i18nPlaceholder,el.placeholder));renderHome();if(state.view==='results')applyFilters();if(state.view==='detail'&&state.selectedExperience)renderDetail(state.selectedExperience)}
function saveSettings(language,currency){settings={language:['EN','SV','NO','DA'].includes(language)?language:'EN',currency:['USD','SEK','NOK','DKK','EUR'].includes(currency)?currency:'USD'};try{localStorage.setItem(SETTINGS_KEY,JSON.stringify(settings))}catch(_){}syncSettings();applyTranslations();post('UPDATE_SETTINGS',settings)}
function loadSettings(){try{const stored=JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}');settings={...settings,...stored}}catch(_){}syncSettings()}
function syncSettings(){['langSelect','welcomeLang','mobileLangSelect'].forEach(id=>{if($(id))$(id).value=settings.language});['currSelect','welcomeCurr','mobileCurrSelect'].forEach(id=>{if($(id))$(id).value=settings.currency})}
const navConfig=[{key:'nav.packages',path:'/signature-collection'},{key:'nav.destinations',path:'/destinations'},{key:'nav.club',path:'/skandi-club'},{key:'nav.info',path:'/travel-info'}];
const mobileExtra=[{label:'Manage your booking',path:'/my-profile?tab=trips'},{label:'Signature Collection',path:'/signature-collection'},{label:'SKANDI Club',path:'/skandi-club'},{label:'My Profile',path:'/my-profile'},{label:'Help Center',path:'/help'},{label:'Contact us',path:'/contact'}];
function navigate(path){post('TOURS_NAVIGATE',{path})}
function renderHeader(){if($('nav'))$('nav').innerHTML=navConfig.map(i=>`<button class="nav-btn" type="button" data-shell-path="${esc(i.path)}">${esc(tr(i.key))}</button>`).join('');const mobile=session.loggedIn?[{label:'My Profile',path:'/my-profile'},{label:'My Trips & Bookings',path:'/my-profile?tab=trips'},{label:'Club Rewards & Status',path:'/my-profile?tab=club-rewards'},{label:'Travel Wallet & Vouchers',path:'/my-profile?tab=wallet'},{label:'Help & Club Support',path:'/help'}]:[...navConfig.map(i=>({label:tr(i.key),path:i.path})),...mobileExtra];if($('mobileList'))$('mobileList').innerHTML=mobile.map(i=>`<button class="mobile-menu-link" type="button" data-shell-path="${esc(i.path)}">${esc(i.label)}</button>`).join('');if($('accountMini'))$('accountMini').textContent=session.loggedIn?`${session.displayName} · ${Number(session.points||0).toLocaleString()} pts`:'';if($('mobileAccount'))$('mobileAccount').textContent=session.loggedIn?`${session.displayName} · ${Number(session.points||0).toLocaleString()} pts`:tr('shell.explore');if($('mobileAccountBtn'))$('mobileAccountBtn').textContent=session.loggedIn?tr('shell.profile'):tr('nav.signIn');renderClub()}
function renderClub(){if(!$('clubActions'))return;$('clubTitle').textContent=session.loggedIn?tr('shell.club.your'):tr('shell.club.join');$('clubName').textContent=session.loggedIn?tokens(tr('shell.club.hi'),{name:session.displayName||''}):tr('shell.club.welcome');$('clubMeta').textContent=session.loggedIn?tokens(tr('shell.club.points'),{count:Number(session.points||0).toLocaleString()}):tr('shell.club.signinCopy');$('clubActions').innerHTML=session.loggedIn?`<button class="btn" data-shell-path="/my-profile" style="width:100%;margin-top:20px">${esc(tr('shell.profile'))}</button><button class="btn btn-secondary" data-shell-action="logout" style="width:100%;margin-top:10px">${esc(tr('shell.logout'))}</button>`:`<form id="inlineLoginForm" class="login-form"><input type="email" placeholder="${esc(tr('shell.email'))}"><input type="password" placeholder="${esc(tr('shell.password'))}"><button class="submit-btn" type="submit">${esc(tr('shell.login'))}</button></form>`}
function openClub(){$('clubPanel')?.classList.add('open');$('clubBackdrop')?.classList.add('open');document.body.style.overflow='hidden'}function closeClub(){$('clubPanel')?.classList.remove('open');$('clubBackdrop')?.classList.remove('open');document.body.style.overflow=''}
function openMobile(){$('mobileMenuLayer')?.classList.add('open');$('mobileMenuLayer')?.setAttribute('aria-hidden','false');$('mobileBtn')?.setAttribute('aria-expanded','true');document.body.style.overflow='hidden'}function closeMobile(){$('mobileMenuLayer')?.classList.remove('open');$('mobileMenuLayer')?.setAttribute('aria-hidden','true');$('mobileBtn')?.setAttribute('aria-expanded','false');document.body.style.overflow=''}
function categoryKey(code){return {'all':'ta.category.all','daytrips':'ta.category.daytrips','activities':'ta.category.activities','attractions':'ta.category.attractions','food':'ta.category.food','water':'ta.category.water','transfers':'ta.category.transfers'}[code]||'ta.category.activities'}
function getDestination(id){return data.destinations.find(d=>d.id===id)}function destinationName(id){const d=getDestination(id);return d?loc(d.name,d.id):id}
function filteredBySearch(destination=state.selectedDestination,category=state.selectedCategory){return data.experiences.filter(e=>(!destination||e.destination===destination)&&(category==='all'||!category||e.category===category))}
function renderHome(){renderCategories();renderCollections();renderDestinations();renderExperiences($('taRecommendedGrid'),data.experiences.slice(0,8));renderDirectory()}
function renderCategories(){const codes=['all','daytrips','activities','attractions','food','water','transfers'];$('taCategoryChips').innerHTML=codes.map(code=>`<button class="ta-category ${state.selectedCategory===code?'active':''}" type="button" data-category="${code}">${esc(tr(categoryKey(code)))}</button>`).join('')}
function renderCollections(){$('taCollections').innerHTML=`<article class="ta-collection" style="background-image:url('https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=1500&q=84')"><div class="ta-collection-content"><h3>${esc(tr('ta.collection.signature'))}</h3><p>${esc(tr('ta.collection.signatureCopy'))}</p><button class="ta-secondary" data-collection="signature">${esc(tr('ta.collection.explore'))}</button></div></article><article class="ta-collection" style="background-image:url('https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1300&q=84')"><div class="ta-collection-content"><h3>${esc(tr('ta.collection.responsible'))}</h3><p>${esc(tr('ta.collection.responsibleCopy'))}</p><button class="ta-secondary" data-collection="responsible">${esc(tr('ta.collection.explore'))}</button></div></article>`}
function renderDestinations(){$('taPopularDestinations').innerHTML=data.destinations.slice(0,8).map(d=>`<button class="ta-dest-card" data-destination="${esc(d.id)}"><img src="${esc(d.image)}" alt="${esc(loc(d.name))}"><div><strong>${esc(loc(d.name))}</strong><span>${d.count} ${esc(tr('ta.results.count').replace('{count}',''))}</span></div></button>`).join('')}
function experienceCard(e){const dest=destinationName(e.destination);return `<article class="ta-exp-card"><div class="ta-exp-img"><img src="${esc(e.image)}" alt="${esc(loc(e.title))}"><div class="ta-exp-badges">${e.freeCancellation?`<span class="ta-badge">${esc(tr('ta.freeCancellation'))}</span>`:''}</div><button class="ta-heart" data-favorite="${esc(e.id)}">♡</button></div><div class="ta-exp-body"><div class="ta-exp-category">${esc(tr(categoryKey(e.category)))} · ${esc(dest)}</div><h3>${esc(loc(e.title))}</h3><p>${esc(loc(e.description))}</p><div class="ta-exp-meta"><span>${esc(e.duration)}</span>${e.pickup?`<span>${esc(tr('ta.pickup'))}</span>`:''}<span>${esc(e.languages.join(', '))}</span></div><div class="ta-exp-rating">★ ${e.rating.toFixed(1)} · ${e.reviews} ${esc(tr('ta.reviews'))}</div><div class="ta-exp-price"><div><span>${esc(tr('ta.fromPrice'))}</span><strong>${esc(money(e.price,e.currency))}</strong><span>${esc(tr('ta.perPerson'))}</span></div><button class="ta-exp-open" data-experience="${esc(e.id)}">${esc(tr('ta.detail.preview'))}</button></div></div></article>`}
function renderExperiences(target,items){target.innerHTML=items.map(experienceCard).join('')}
function renderDirectory(){const countries=[...new Set(data.destinations.map(d=>d.country))];$('taCountryTabs').innerHTML=[`<button class="ta-country-tab ${state.country==='all'?'active':''}" data-country="all">${esc(tr('ta.filters.any'))}</button>`,...countries.map(c=>`<button class="ta-country-tab ${state.country===c?'active':''}" data-country="${esc(c)}">${esc(c.replaceAll('-',' ').replace(/\b\w/g,m=>m.toUpperCase()))}</button>`)].join('');const list=data.destinations.filter(d=>state.country==='all'||d.country===state.country);$('taDirectoryGrid').innerHTML=list.map(d=>`<button class="ta-directory-item" data-destination="${esc(d.id)}"><strong>${esc(loc(d.name))}</strong><span>${d.count}</span></button>`).join('')}
function runSearch(destination=state.selectedDestination,category=state.selectedCategory){state.selectedDestination=destination||'';state.selectedCategory=category||'all';state.searchResults=filteredBySearch();state.shown=9;state.filters={categories:new Set(),maxPrice:0,duration:'',language:'',minRating:0,freeCancellation:false,pickup:false,instant:false,accessible:false};renderFilters();applyFilters();setView('results');post('TOURS_SEARCH',{search:{destinationId:state.selectedDestination,category:state.selectedCategory,fromDate:$('taFromDate').value,toDate:$('taToDate').value,travelers:Number($('taTravelers').value||2),language:settings.language,currency:settings.currency}})}
function renderFilters(){const categories=['daytrips','activities','attractions','food','water','transfers'];$('taFilterContent').innerHTML=`<div class="ta-filter-group"><h3>${esc(tr('ta.filters.category'))}</h3>${categories.map(c=>`<label class="ta-check"><input type="checkbox" data-filter-category="${c}" ${state.filters.categories.has(c)?'checked':''}>${esc(tr(categoryKey(c)))}</label>`).join('')}</div><div class="ta-filter-group"><h3>${esc(tr('ta.filters.price'))}</h3><input id="taMaxPrice" type="number" min="0" step="10" placeholder="${esc(settings.currency)}" value="${state.filters.maxPrice||''}"></div><div class="ta-filter-group"><h3>${esc(tr('ta.filters.duration'))}</h3><select id="taDurationFilter"><option value="">${esc(tr('ta.filters.any'))}</option><option value="short">${esc(tr('ta.filters.short'))}</option><option value="half">${esc(tr('ta.filters.half'))}</option><option value="full">${esc(tr('ta.filters.full'))}</option><option value="multi">${esc(tr('ta.filters.multi'))}</option></select></div><div class="ta-filter-group"><h3>${esc(tr('ta.filters.language'))}</h3><select id="taLanguageFilter"><option value="">${esc(tr('ta.filters.any'))}</option><option value="EN">${esc(tr('ta.filters.english'))}</option><option value="SV">${esc(tr('ta.filters.swedish'))}</option><option value="NO">${esc(tr('ta.filters.norwegian'))}</option><option value="DA">${esc(tr('ta.filters.danish'))}</option></select></div><div class="ta-filter-group"><h3>${esc(tr('ta.filters.rating'))}</h3><select id="taRatingFilter"><option value="0">${esc(tr('ta.filters.any'))}</option><option value="4">4.0+</option><option value="4.5">4.5+</option><option value="4.8">4.8+</option></select></div><div class="ta-filter-group"><h3>${esc(tr('ta.filters.features'))}</h3><label class="ta-check"><input type="checkbox" id="taFreeCancel">${esc(tr('ta.filters.freeCancel'))}</label><label class="ta-check"><input type="checkbox" id="taPickupFilter">${esc(tr('ta.filters.pickup'))}</label><label class="ta-check"><input type="checkbox" id="taInstantFilter">${esc(tr('ta.filters.instant'))}</label><label class="ta-check"><input type="checkbox" id="taAccessibleFilter">${esc(tr('ta.filters.accessible'))}</label></div>`}
function readFilters(){state.filters.categories=new Set($$('[data-filter-category]:checked').map(i=>i.dataset.filterCategory));state.filters.maxPrice=Number($('taMaxPrice')?.value||0);state.filters.duration=$('taDurationFilter')?.value||'';state.filters.language=$('taLanguageFilter')?.value||'';state.filters.minRating=Number($('taRatingFilter')?.value||0);state.filters.freeCancellation=Boolean($('taFreeCancel')?.checked);state.filters.pickup=Boolean($('taPickupFilter')?.checked);state.filters.instant=Boolean($('taInstantFilter')?.checked);state.filters.accessible=Boolean($('taAccessibleFilter')?.checked)}
function applyFilters(){readFilters();let rows=[...state.searchResults];const f=state.filters;if(f.categories.size)rows=rows.filter(e=>f.categories.has(e.category));if(f.maxPrice)rows=rows.filter(e=>e.price<=f.maxPrice);if(f.duration)rows=rows.filter(e=>e.durationCode===f.duration);if(f.language)rows=rows.filter(e=>e.languages.includes(f.language));if(f.minRating)rows=rows.filter(e=>e.rating>=f.minRating);if(f.freeCancellation)rows=rows.filter(e=>e.freeCancellation);if(f.pickup)rows=rows.filter(e=>e.pickup);if(f.instant)rows=rows.filter(e=>e.instant);if(f.accessible)rows=rows.filter(e=>e.accessible);if(state.sort==='price')rows.sort((a,b)=>a.price-b.price);else if(state.sort==='rating')rows.sort((a,b)=>b.rating-a.rating);else rows.sort((a,b)=>(b.rating*b.reviews)-(a.rating*a.reviews));state.visibleResults=rows;const dest=state.selectedDestination?destinationName(state.selectedDestination):tr('ta.category.all');$('taResultsTitle').textContent=tokens(tr('ta.results.title'),{destination:dest});$('taResultsSubtitle').textContent=tokens(tr('ta.results.count'),{count:rows.length});$('taResultCount').textContent=tokens(tr('ta.results.count'),{count:rows.length});if(!rows.length)$('taResultsGrid').innerHTML=`<div class="ta-empty">${esc(tr('ta.noResults'))}</div>`;else renderExperiences($('taResultsGrid'),rows.slice(0,state.shown));$('taLoadMoreBtn').style.display=rows.length>state.shown?'inline-flex':'none'}
function clearFilters(){state.filters={categories:new Set(),maxPrice:0,duration:'',language:'',minRating:0,freeCancellation:false,pickup:false,instant:false,accessible:false};renderFilters();applyFilters()}
function openExperience(id,requestBackend=true){const exp=data.experiences.find(e=>e.id===id)||state.searchResults.find(e=>e.id===id);if(!exp)return;state.selectedExperience=exp;renderDetail(exp);setView('detail');if(requestBackend)post('TOURS_ACTIVITY_OPEN',{activityId:id,language:settings.language,currency:settings.currency})}
function renderDetail(e){const images=[e.image,'https://images.unsplash.com/photo-1530789253388-582c481c54b0?auto=format&fit=crop&w=1000&q=82','https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1000&q=82','https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=1000&q=82','https://images.unsplash.com/photo-1544550285-f813152fb2fd?auto=format&fit=crop&w=1000&q=82'];$('taDetailGallery').innerHTML=images.map((img,i)=>`<img src="${esc(img)}" alt="${esc(loc(e.title))} ${i+1}">`).join('');$('taDetailCategory').textContent=`${tr(categoryKey(e.category))} · ${destinationName(e.destination)}`;$('taDetailTitle').textContent=loc(e.title);$('taDetailMeta').textContent=`★ ${e.rating.toFixed(1)} (${e.reviews} ${tr('ta.reviews')}) · ${tr('ta.detail.duration')}: ${e.duration} · ${tr('ta.languages')}: ${e.languages.join(', ')}`;$('taBookPrice').innerHTML=`${esc(money(e.price,e.currency))} <small>${esc(tr('ta.perPerson'))}</small>`;$('taDetailContent').innerHTML=`<article class="ta-detail-card"><h2>${esc(tr('ta.detail.highlights'))}</h2><ul><li>${esc(tr('ta.freeCancellation'))}</li><li>${esc(e.pickup?tr('ta.pickup'):tr('ta.detail.mobileTicket'))}</li><li>${esc(tr('ta.instant'))}</li></ul></article><article class="ta-detail-card"><h2>${esc(tr('ta.detail.about'))}</h2><p>${esc(loc(e.description))}</p><p>${esc(loc(e.description))}</p></article><article class="ta-detail-card"><h2>${esc(tr('ta.detail.itinerary'))}</h2><ul><li>${esc(tr('ta.detail.step1'))}</li><li>${esc(tr('ta.detail.step2'))}</li><li>${esc(tr('ta.detail.step3'))}</li><li>${esc(tr('ta.detail.step4'))}</li></ul></article><article class="ta-detail-card"><h2>${esc(tr('ta.detail.included'))}</h2><ul><li>${esc(tr('ta.detail.included1'))}</li><li>${esc(tr('ta.detail.included2'))}</li><li>${esc(tr('ta.detail.included3'))}</li></ul></article><article class="ta-detail-card"><h2>${esc(tr('ta.detail.notIncluded'))}</h2><ul><li>${esc(tr('ta.detail.not1'))}</li><li>${esc(tr('ta.detail.not2'))}</li><li>${esc(tr('ta.detail.not3'))}</li></ul></article><article class="ta-detail-card"><h2>${esc(tr('ta.detail.meeting'))}</h2><p>${esc(e.pickup?tr('ta.pickup'):tr('ta.detail.meetingFallback'))}</p></article><article class="ta-detail-card"><h2>${esc(tr('ta.detail.accessibility'))}</h2><p>${esc(e.accessible?tr('ta.filters.accessible'):tr('ta.detail.accessibilityFallback'))}</p></article><article class="ta-detail-card"><h2>${esc(tr('ta.detail.cancellation'))}</h2><p>${esc(e.freeCancellation?tr('ta.freeCancellation'):tr('ta.detail.cancellationFallback'))}</p></article>`;updateTotal()}
function updateTotal(){const e=state.selectedExperience;if(!e)return;const adults=Number($('taBookAdults').value||2),children=Number($('taBookChildren').value||0);$('taBookTotal').textContent=money(e.price*adults+e.price*.65*children,e.currency)}
function book(){const e=state.selectedExperience;if(!e)return;post('TOURS_BOOK_ACTIVITY',{activity:e,selection:{date:$('taBookDate').value,time:$('taBookTime').value,adults:Number($('taBookAdults').value),children:Number($('taBookChildren').value),language:settings.language,currency:settings.currency}});if(!e.live)toast(tr('ta.toast.preview'))}
function suggestions(term){const q=term.toLowerCase().trim();const rows=data.destinations.filter(d=>!q||loc(d.name).toLowerCase().includes(q));$('taSuggestions').innerHTML=rows.map(d=>`<button class="ta-suggestion" type="button" data-suggestion="${esc(d.id)}"><strong>${esc(loc(d.name))}</strong><span>${d.count} ${esc(tr('ta.results.count').replace('{count}',''))}</span></button>`).join('');$('taSuggestions').classList.toggle('open',rows.length>0)}

document.addEventListener('click',event=>{const path=event.target.closest('[data-shell-path]');if(path){navigate(path.dataset.shellPath);closeMobile();closeClub();return}const action=event.target.closest('[data-shell-action]');if(action?.dataset.shellAction==='logout'){headerPost('HEADER_LOGOUT');return}const category=event.target.closest('[data-category]');if(category){state.selectedCategory=category.dataset.category;renderCategories();runSearch(state.selectedDestination,state.selectedCategory);return}const destination=event.target.closest('[data-destination]');if(destination){state.selectedDestination=destination.dataset.destination;$('taDestinationInput').value=destinationName(state.selectedDestination);runSearch(state.selectedDestination,state.selectedCategory);return}const experience=event.target.closest('[data-experience]');if(experience){openExperience(experience.dataset.experience);return}const favorite=event.target.closest('[data-favorite]');if(favorite){event.stopPropagation();if(!session.loggedIn){openClub();return}post('TOURS_FAVORITE',{activityId:favorite.dataset.favorite});favorite.textContent='♥';return}const collection=event.target.closest('[data-collection]');if(collection){state.searchResults=data.experiences.filter(e=>e.collection===collection.dataset.collection);state.selectedDestination='';state.selectedCategory='all';renderFilters();applyFilters();setView('results');return}const country=event.target.closest('[data-country]');if(country){state.country=country.dataset.country;renderDirectory();return}if(!event.target.closest('.ta-field'))$('taSuggestions').classList.remove('open')});
document.addEventListener('change',event=>{if(event.target.matches('[data-filter-category],#taDurationFilter,#taLanguageFilter,#taRatingFilter,#taFreeCancel,#taPickupFilter,#taInstantFilter,#taAccessibleFilter'))applyFilters();if(event.target.matches('#taBookAdults,#taBookChildren'))updateTotal()});
document.addEventListener('input',event=>{if(event.target.id==='taMaxPrice')applyFilters()});
$('taSearchForm').addEventListener('submit',event=>{event.preventDefault();const typed=$('taDestinationInput').value.trim().toLowerCase();const found=data.destinations.find(d=>loc(d.name).toLowerCase().includes(typed));runSearch(found?.id||state.selectedDestination,state.selectedCategory)});
$('taDestinationInput').addEventListener('input',event=>suggestions(event.target.value));$('taDestinationInput').addEventListener('focus',event=>suggestions(event.target.value));$('taSuggestions').addEventListener('click',event=>{const btn=event.target.closest('[data-suggestion]');if(!btn)return;state.selectedDestination=btn.dataset.suggestion;$('taDestinationInput').value=destinationName(state.selectedDestination);$('taSuggestions').classList.remove('open')});
$('taNearbyBtn').addEventListener('click',()=>{if(!navigator.geolocation){toast(tr('ta.error.location'),true);return}navigator.geolocation.getCurrentPosition(pos=>post('TOURS_NEARBY_SEARCH',{latitude:pos.coords.latitude,longitude:pos.coords.longitude,language:settings.language,currency:settings.currency}),()=>toast(tr('ta.error.location'),true),{enableHighAccuracy:false,timeout:7000})});
$('taViewAllBtn').addEventListener('click',()=>runSearch('','all'));$('taMemberBtn').addEventListener('click',openClub);$('taBackHomeBtn').addEventListener('click',()=>setView('home'));$('taBackResultsBtn').addEventListener('click',()=>setView('results'));$('taClearFilters').addEventListener('click',clearFilters);$('taSort').addEventListener('change',event=>{state.sort=event.target.value;applyFilters()});$('taLoadMoreBtn').addEventListener('click',()=>{state.shown+=9;applyFilters()});$('taBookBtn').addEventListener('click',book);$('taBookAdults').addEventListener('change',updateTotal);$('taBookChildren').addEventListener('change',updateTotal);$('taFavoriteBtn').addEventListener('click',()=>{if(!session.loggedIn){openClub();return}$('taFavoriteBtn').textContent=tr('ta.detail.saved');post('TOURS_FAVORITE',{activityId:state.selectedExperience?.id})});$('taShareBtn').addEventListener('click',async()=>{const url=location.href;try{await navigator.share({title:loc(state.selectedExperience?.title),url})}catch(_){try{await navigator.clipboard.writeText(url);toast(tr('ta.linkCopied'))}catch(__){}}});
$('logoBtn')?.addEventListener('click',()=>navigate('/home'));$('searchBtn')?.addEventListener('click',()=>{$('taHomeView').classList.add('active');setView('home');$('taDestinationInput').focus()});$('favBtn')?.addEventListener('click',()=>session.loggedIn?navigate('/my-profile?tab=favourites'):openClub());$('clubBtn')?.addEventListener('click',openClub);$('clubClose')?.addEventListener('click',closeClub);$('clubBackdrop')?.addEventListener('click',closeClub);$('mobileBtn')?.addEventListener('click',openMobile);$('mobileMenuBackdrop')?.addEventListener('click',closeMobile);$('mobileMenuClose')?.addEventListener('click',closeMobile);$('mobileSearchBtn')?.addEventListener('click',()=>{closeMobile();setView('home');$('taDestinationInput').focus()});$('mobileAccountBtn')?.addEventListener('click',()=>session.loggedIn?navigate('/my-profile'):headerPost('HEADER_LOGIN'));
$('settingsBtn')?.addEventListener('click',event=>{event.stopPropagation();$('settingsMenu')?.classList.toggle('open')});$('saveSettingsBtn')?.addEventListener('click',()=>{saveSettings($('langSelect').value,$('currSelect').value);$('settingsMenu')?.classList.remove('open')});$('welcomeSaveBtn')?.addEventListener('click',()=>{saveSettings($('welcomeLang').value,$('welcomeCurr').value);$('welcomeSettingsModal')?.classList.remove('active')});$('welcomeBackdrop')?.addEventListener('click',()=>{$('welcomeSettingsModal')?.classList.remove('active')});$('mobileLangSelect')?.addEventListener('change',e=>saveSettings(e.target.value,settings.currency));$('mobileCurrSelect')?.addEventListener('change',e=>saveSettings(settings.language,e.target.value));
$('year').textContent=new Date().getFullYear();$$('#skandi-site-footer [data-path]').forEach(el=>el.addEventListener('click',()=>footerPost('FOOTER_NAVIGATE',{path:el.dataset.path})));$$('#skandi-site-footer .social-btn[data-url]').forEach(btn=>btn.addEventListener('click',()=>window.open(btn.dataset.url,'_blank','noopener,noreferrer')));function subscribe(){footerPost('FOOTER_NEWSLETTER_SIGNUP',{email:$('newsletterEmail').value.trim(),source:'Tours & Activities Footer'})}$('newsletterBtn').addEventListener('click',subscribe);$('newsletterEmail').addEventListener('keydown',e=>{if(e.key==='Enter')subscribe()});document.addEventListener('submit',e=>{if(e.target.id==='inlineLoginForm'){e.preventDefault();closeClub();headerPost('HEADER_LOGIN')}});
window.addEventListener('message',event=>{let m=event.data;if(typeof m==='string'){try{m=JSON.parse(m)}catch(_){return}}if(!m||typeof m!=='object'||(m.source&&m.source!==PARENT_SOURCE))return;const p=m.payload||{};if(m.type==='CUSTOMER_HEADER_STATE'){session={loggedIn:Boolean(p.loggedIn),displayName:p.displayName||'',points:Number(p.points||0),tierName:p.tierName||''};undefined}if(m.type==='CLOSE_CUSTOMER_HEADER_PANELS'){closeMobile();closeClub()}if(m.type==='TOURS_BOOTSTRAP_RESULT'){data={destinations:Array.isArray(p.destinations)?p.destinations:[],experiences:Array.isArray(p.experiences)?p.experiences:[],collections:p.collections||[]};renderHome();if(p.initialActivity)openExperience(p.initialActivity.id,false);else if(p.initialDestination)runSearch(p.initialDestination,p.initialCategory||'all')}if(m.type==='TOURS_SEARCH_RESULT'){if(Array.isArray(p.items)&&p.items.length){state.searchResults=p.items;state.shown=9;renderFilters();applyFilters();setView('results')}}if(m.type==='TOURS_ACTIVITY_RESULT'){if(p.activity){const idx=data.experiences.findIndex(e=>e.id===p.activity.id);if(idx>=0)data.experiences[idx]=p.activity;else data.experiences.push(p.activity);openExperience(p.activity.id,false)}}if(m.type==='TOURS_NEARBY_RESULT'){if(Array.isArray(p.items)){state.searchResults=p.items;state.selectedDestination=p.locationName||'';renderFilters();applyFilters();setView('results')}}if(m.type==='TOURS_BOOK_RESULT'){if(p.checkoutPath)navigate(p.checkoutPath);else toast(p.message||tr('ta.toast.preview'))}if(m.type==='TOURS_ERROR')toast(p.message||tr('ta.error.load'),true);if(m.type==='FOOTER_NEWSLETTER_RESULT')toast(p.message||tr('ta.toast.newsletter'),!p.ok)});
loadSettings();applyTranslations();post('TOURS_READY',{settings});
try{if(!localStorage.getItem(SETTINGS_KEY))$('welcomeSettingsModal')?.classList.add('active')}catch(_){}
})();
</script>
</body></html>
