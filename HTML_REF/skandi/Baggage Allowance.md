# Baggage Allowance

## INFO / LOG

- **Status:** READY — B-011.3 design/style convergence
- **System:** SKANDI customer website
- **Route:** `/travel-info/baggage-allowence`
- **Wix page:** `Baggage Allowance.tf8xc`
- **HTML component:** `#baggageInfoEmbed`
- **HTML child source:** `SKANDI_BAGGAGE_PAGE`
- **Page controller:** `/src/pages/Baggage Allowance.tf8xc.js`
- **Backend/data owner:** `backend/SKANDI_CORE/publicContent.web → publicContent`
- **Global header/footer:** `masterPage.js`
- **Version:** `B-011.3`
- **Last verified:** `2026-09-25`

### B-011.3 changes

- Kept this as a **separate Travel Info page**. No merged topic-switching page is used.
- Applied the shared B-011 customer palette used by Home and global chrome.
- Added a restrained Travel Info return rail rather than an internal four-topic switcher.
- Restyled the photographic hero into the common Travel Info B-011 treatment.
- Standardized section widths to 1180px, typography scale, card radii, borders, shadows, search panels, CTAs, FAQs and responsive behavior.
- Preserved the supplied page content and functional IDs.
- Preserved existing data/message contracts where this page already has a Wix page bridge.
- Added stable section/content hooks to the hero for the later Presentation Registry pass.
- Did not add page-owned global header/footer.
- Did not add a new database table, RPC, backend service or provider.

### Live data chain

`#baggageInfoEmbed`
→ `Baggage Allowance.tf8xc.js`
→ `getPublicBaggagePayload`
→ `backend/SKANDI_CORE/publicContent`
→ `travel_info_airlines` and published Travel Info guidance.

No backend change is included in B-011.3.

---

## COMPLETE INTENDED LIVE HTML SOURCE

```html
<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>SKANDI • Baggage Information · B-011.3</title><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet"><style>
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
</style>
<style id="skandi-b011-separate-page-style">
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
  --sk-ivory:#fbfaf6;
  --sk-porcelain:#f5f1ea;
  --sk-champagne:#d1bc98;
  --sk-ink:#03111f;
  --sk-ink-soft:#061a30;
  --sk-shadow:0 8px 26px rgba(0,0,0,.08);
  --sk-shadow-strong:0 14px 34px rgba(0,0,0,.12);
  --sk-max:1180px;
}

html,body{
  background:#fff;
  color:var(--sk-text);
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}

.travel-info-rail{
  position:sticky;
  top:0;
  z-index:30;
  border-bottom:1px solid var(--sk-border);
  background:rgba(255,255,255,.95);
  backdrop-filter:blur(18px);
  -webkit-backdrop-filter:blur(18px);
}
.travel-info-rail-inner{
  width:min(var(--sk-max),calc(100% - 48px));
  min-height:62px;
  margin:0 auto;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:18px;
}
.travel-info-back{
  min-height:38px;
  padding:0 13px;
  display:inline-flex;
  align-items:center;
  gap:8px;
  border:1px solid var(--sk-border);
  border-radius:999px;
  background:#fff;
  color:var(--sk-blue);
  text-decoration:none;
  font-size:9px;
  line-height:1;
  font-weight:800;
  cursor:pointer;
}
.travel-info-back:hover{
  border-color:rgba(95,199,207,.55);
  background:var(--sk-pale);
}
.travel-info-context{
  color:var(--sk-muted);
  font-size:8px;
  font-weight:800;
  letter-spacing:.12em;
  text-transform:uppercase;
}

/* B-011 Travel Info hero */
#hero-wrap{
  position:relative;
  isolation:isolate;
  min-height:390px!important;
  padding:72px 24px 46px!important;
  align-items:center!important;
  justify-content:flex-end!important;
  text-align:left!important;
  overflow:hidden;
  box-shadow:inset 0 -1px rgba(255,255,255,.08);
}
#hero-wrap::after{
  content:"";
  position:absolute;
  inset:0;
  z-index:-1;
  pointer-events:none;
  background:
    radial-gradient(circle at 84% 9%,rgba(95,199,207,.13),transparent 26%),
    linear-gradient(90deg,rgba(2,46,100,.27),transparent 58%);
}
#hero-wrap>.hero-kicker,
#hero-wrap>#hero-title,
#hero-wrap>#hero-sub{
  width:min(var(--sk-max),calc(100% - 0px));
  margin-left:auto;
  margin-right:auto;
  text-align:left;
}
.hero-kicker{
  margin-bottom:9px!important;
  color:var(--sk-cyan)!important;
  font-size:9px!important;
  font-weight:850!important;
  letter-spacing:.17em!important;
}
#hero-title{
  margin-bottom:12px!important;
  color:#fff!important;
  font-size:clamp(38px,5vw,58px)!important;
  line-height:.99!important;
  letter-spacing:-.05em!important;
  font-weight:700!important;
}
#hero-sub{
  max-width:var(--sk-max)!important;
  padding-right:min(360px,25vw);
  color:rgba(255,255,255,.86)!important;
  font-size:13px!important;
  line-height:1.72!important;
}

/* B-011 content rhythm */
.content-section{
  max-width:var(--sk-max)!important;
  padding:54px 24px!important;
  margin:0 auto!important;
}
.content-section[style*="background"]{
  max-width:none!important;
  padding-left:max(24px,calc((100vw - var(--sk-max))/2 + 24px))!important;
  padding-right:max(24px,calc((100vw - var(--sk-max))/2 + 24px))!important;
}
.section-title{
  margin:0 0 8px!important;
  color:var(--sk-blue)!important;
  font-size:clamp(26px,3.3vw,36px)!important;
  line-height:1.08!important;
  letter-spacing:-.04em!important;
  text-align:left!important;
}
.section-subtitle{
  max-width:780px!important;
  margin:0 0 26px!important;
  color:var(--sk-body)!important;
  font-size:10.5px!important;
  line-height:1.68!important;
  text-align:left!important;
}

/* Cards */
.info-grid,.bag-grid,.card-grid,.rules-grid,.guide-grid{
  gap:14px!important;
}
.info-card,.bag-card,.ins-card,.rule-card,.result-card,.live-product{
  border:1px solid var(--sk-border-soft)!important;
  border-radius:17px!important;
  background:#fff!important;
  box-shadow:0 5px 18px rgba(2,46,100,.05)!important;
}
.info-card,.bag-card,.ins-card{
  padding:24px!important;
}
.rule-card,.result-card,.live-product{
  padding:18px!important;
}
.info-card:hover,.bag-card:hover,.ins-card:hover,.rule-card:hover,.live-product:hover{
  border-color:rgba(95,199,207,.46)!important;
  box-shadow:0 13px 28px rgba(2,46,100,.09)!important;
}
.info-header,.bag-header{
  gap:13px!important;
  margin-bottom:16px!important;
  padding-bottom:15px!important;
}
.info-icon,.bag-icon,.ins-icon{
  width:46px!important;
  height:46px!important;
  flex:0 0 46px!important;
  border:1px solid rgba(95,199,207,.26)!important;
  border-radius:12px!important;
  background:var(--sk-pale)!important;
  color:var(--sk-blue)!important;
  font-size:21px!important;
}
.info-header h3,.bag-header h3,.ins-card h3{
  color:var(--sk-blue)!important;
  font-size:16px!important;
  line-height:1.3!important;
  letter-spacing:-.02em!important;
}
.info-card p,.bag-card p,.ins-card p,.rule-card p{
  color:var(--sk-body)!important;
  font-size:10px!important;
  line-height:1.7!important;
}

/* Search / live data surfaces */
.airline-search-shell,.requirements-search,.ins-search{
  padding:22px!important;
  border:1px solid var(--sk-border)!important;
  border-radius:17px!important;
  background:#fff!important;
  box-shadow:var(--sk-shadow)!important;
}
.search-field input,.field input,.field select,.ins-search input{
  min-height:44px!important;
  border:1px solid var(--sk-border)!important;
  border-radius:10px!important;
  background:#fff!important;
  color:var(--sk-blue)!important;
  font-size:10px!important;
}
.search-button,.btn-primary,.btn-secondary{
  min-height:42px!important;
  padding:0 16px!important;
  border-radius:10px!important;
  font-size:9px!important;
  font-weight:850!important;
  letter-spacing:.02em!important;
}
.search-button,.btn-primary{
  border:0!important;
  background:linear-gradient(135deg,var(--sk-blue),var(--sk-blue2))!important;
  color:#fff!important;
}
.btn-secondary{
  border:1px solid var(--sk-border)!important;
  background:#fff!important;
  color:var(--sk-blue)!important;
}
.live-card,.lookup-result,.live-results{
  border-radius:15px!important;
  box-shadow:none!important;
}
.live-notice,.lookup-status,.live-status{
  border-radius:10px!important;
  font-size:9px!important;
  line-height:1.6!important;
}

/* Alerts and CTA */
.alert-box{
  padding:18px!important;
  gap:13px!important;
  border-radius:13px!important;
  box-shadow:none!important;
}
.alert-icon{font-size:23px!important}
.alert-content h4{
  font-size:12px!important;
  line-height:1.35!important;
}
.alert-content p{
  font-size:9.5px!important;
  line-height:1.65!important;
}
.action-banner,.visa-banner{
  padding:28px!important;
  border-radius:18px!important;
  background:
    radial-gradient(circle at 94% 0%,rgba(95,199,207,.12),transparent 28%),
    linear-gradient(135deg,var(--sk-blue),var(--sk-ink-soft))!important;
  box-shadow:0 12px 30px rgba(2,46,100,.14)!important;
}
.action-banner h3,.visa-banner h3{
  font-size:21px!important;
  letter-spacing:-.025em!important;
}
.action-banner p,.visa-banner p{
  font-size:10px!important;
  line-height:1.65!important;
}

/* FAQ */
.faq-grid{
  max-width:900px!important;
  margin:0!important;
}
details{
  margin-bottom:8px!important;
  border:1px solid var(--sk-border)!important;
  border-radius:12px!important;
  box-shadow:none!important;
}
summary{
  min-height:50px!important;
  padding:14px 16px!important;
  color:var(--sk-blue)!important;
  font-size:10px!important;
}
.faq-content{
  padding:0 16px 16px!important;
  color:var(--sk-body)!important;
  font-size:9.5px!important;
  line-height:1.7!important;
}

/* Legal/regulatory */
.legal-section{
  max-width:none!important;
  border-top:1px solid var(--sk-border)!important;
  background:var(--sk-pale)!important;
  padding-left:max(24px,calc((100vw - var(--sk-max))/2 + 24px))!important;
  padding-right:max(24px,calc((100vw - var(--sk-max))/2 + 24px))!important;
}
.legal-grid{gap:10px!important}
.legal-box,.legal-mini{
  border:1px solid var(--sk-border-soft)!important;
  border-radius:12px!important;
  background:#fff!important;
  color:var(--sk-muted)!important;
  font-size:9px!important;
  line-height:1.6!important;
}
.legal-box{padding:17px!important}

/* Comparison tables and supporting content */
.table-wrapper{
  border:1px solid var(--sk-border)!important;
  border-radius:14px!important;
  box-shadow:none!important;
}
table{font-size:9px!important}
th{background:var(--sk-pale)!important;color:var(--sk-blue)!important}
th,td{padding:12px!important;border-color:var(--sk-border-soft)!important}

@media(max-width:860px){
  .travel-info-rail-inner{width:min(var(--sk-max),calc(100% - 28px));min-height:56px}
  .travel-info-context{display:none}
  #hero-wrap{min-height:330px!important;padding:58px 14px 36px!important}
  #hero-wrap>.hero-kicker,
  #hero-wrap>#hero-title,
  #hero-wrap>#hero-sub{width:min(var(--sk-max),calc(100% - 0px))}
  #hero-title{font-size:38px!important}
  #hero-sub{padding-right:0!important;font-size:12px!important}
  .content-section{padding:44px 14px!important}
  .content-section[style*="background"],.legal-section{
    padding-left:14px!important;
    padding-right:14px!important;
  }
}
</style>

</head><body>
<section id="hero-wrap" data-section-id="baggage-hero">
  <div class="hero-kicker" data-content-id="baggage-hero-kicker">SKANDI BAGGAGE</div>
  <div id="hero-title" data-content-id="baggage-hero-title">Everything You Need to Pack</div>
  <div id="hero-sub" data-content-id="baggage-hero-copy">Baggage rules vary by airline, route, fare and passenger. Search your operating airline below for the published SKANDI guidance linked to that airline.</div>
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
const SOURCE="SKANDI_BAGGAGE_PAGE",PARENT="SKANDI_WIX_PARENT",VERSION="BACKEND-BASE-1.0-B011.3";
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
</script>
<script id="skandi-b011-back-bridge">
(()=>{
  const back=document.getElementById("backToTravelInfo");
  if(!back)return;
  back.addEventListener("click",()=>{
    window.parent.postMessage({
      source:"SKANDI_BAGGAGE_PAGE",
      type:"BAGGAGE_NAVIGATE",
      payload:{path:"/travel-info"},
      timestamp:new Date().toISOString()
    },"*");
  });
})();
</script>

</body></html>
```
