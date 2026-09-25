# Travel Insurance

## INFO / LOG

- **Status:** READY — B-011.3 design/style convergence
- **System:** SKANDI customer website
- **Route:** `/travel-info/insurance`
- **Wix page:** `Insurance.ojo62`
- **HTML component:** `#travelInsuranceEmbed`
- **HTML child source:** `SKANDI_INSURANCE_PAGE`
- **Page controller:** `/src/pages/Insurance.ojo62.js`
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

`#travelInsuranceEmbed`
→ `Insurance.ojo62.js`
→ `getPublicInsurancePayload`
→ `backend/SKANDI_CORE/publicContent`
→ published Travel Info insurance guidance + public ANCILLARY inventory projection.

No backend change is included in B-011.3.

---

## COMPLETE INTENDED LIVE HTML SOURCE

```html
<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>SKANDI • Travel Insurance · B-011.3</title><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet"><style>
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
  background: linear-gradient(rgba(2, 46, 100, 0.4), rgba(2, 46, 100, 0.7)), url("https://images.unsplash.com/photo-1516483638261-f40af5ed32c5?auto=format&fit=crop&w=1920&q=80") center/cover;
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

/* INSURANCE CARDS */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;
}
.ins-card {
  background: #fff;
  border: 1px solid var(--sk-border);
  border-radius: 16px;
  padding: 32px;
  box-shadow: var(--sk-shadow);
  display: flex;
  flex-direction: column;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.ins-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--sk-shadow-strong);
  border-color: var(--sk-cyan);
}
.ins-icon {
  width: 56px;
  height: 56px;
  background: var(--sk-pale);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: var(--sk-blue);
  margin-bottom: 20px;
}
.ins-card h3 {
  font-size: 22px;
  color: var(--sk-blue);
  margin-bottom: 12px;
}
.ins-card p {
  color: var(--sk-body);
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 24px;
  flex-grow: 1;
}
.ins-features {
  list-style: none;
  margin-bottom: 24px;
}
.ins-features li {
  font-size: 13px;
  color: var(--sk-text);
  margin-bottom: 10px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-weight: 500;
}
.ins-features li::before {
  content: "✓";
  color: var(--sk-cyan);
  font-weight: 900;
}
.ins-price {
  font-size: 18px;
  font-weight: 800;
  color: var(--sk-blue);
  margin-bottom: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--sk-border-soft);
}
.btn-primary {
  display: block;
  width: 100%;
  padding: 14px;
  border-radius: 999px;
  background: var(--sk-blue);
  color: #fff;
  border: none;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  transition: .18s ease;
  text-align: center;
  margin-bottom: 12px;
}
.btn-primary:hover {
  background: #03438b;
}

/* LEGAL MINI (Card Footer) */
.legal-mini {
  text-align: center;
  font-size: 11px;
  color: var(--sk-muted);
  line-height: 1.4;
}
.legal-mini a {
  color: var(--sk-blue);
  text-decoration: underline;
}

/* COMPARISON TABLE */
.table-wrapper {
  overflow-x: auto;
  margin-top: 40px;
  background: #fff;
  border-radius: 16px;
  border: 1px solid var(--sk-border);
  box-shadow: var(--sk-shadow);
}
table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}
th, td {
  padding: 18px 24px;
  border-bottom: 1px solid var(--sk-border-soft);
  font-size: 14px;
}
th {
  background: var(--sk-pale);
  color: var(--sk-blue);
  font-weight: 700;
  white-space: nowrap;
}
td:not(:first-child), th:not(:first-child) {
  text-align: center;
}
tr:last-child td {
  border-bottom: none;
}
.check {
  color: var(--sk-ok);
  font-weight: bold;
  font-size: 18px;
}
.cross {
  color: var(--sk-danger);
  font-weight: bold;
  font-size: 18px;
}

/* FAQ SECTION */
#faq-section {
  background: var(--sk-bg);
}
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

/* LEGAL DISCLAIMER SECTION */
.legal-section {
  border-top: 1px solid var(--sk-border);
}
.legal-section h4 {
  font-size: 14px;
  color: var(--sk-blue);
  margin-bottom: 16px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.legal-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}
.legal-box {
  background: var(--sk-bg);
  padding: 20px;
  border-radius: 12px;
  font-size: 12px;
  color: var(--sk-muted);
  line-height: 1.5;
}
.legal-box strong {
  display: block;
  color: var(--sk-text);
  margin-bottom: 6px;
}

/* RESPONSIVE */
@media(max-width:860px){
  #hero-wrap { padding: 54px 14px 38px; min-height: 320px; }
  #hero-title { font-size: 32px; }
  .content-section { padding: 42px 14px; }
  th, td { padding: 14px 12px; font-size: 13px; }
}

/* LIVE INSURANCE CONTENT SEARCH */
.ins-search{background:#fff;border:1px solid var(--sk-border);border-radius:18px;padding:28px;box-shadow:var(--sk-shadow);margin-bottom:30px}.ins-search-row{display:grid;grid-template-columns:1fr auto;gap:12px}.ins-search input{width:100%;min-height:50px;border:1px solid var(--sk-border);border-radius:14px;padding:0 16px;font:600 14px Montserrat;color:var(--sk-blue);outline:none}.ins-search input:focus{border-color:var(--sk-cyan);box-shadow:0 0 0 4px rgba(95,199,207,.12)}.ins-search button{min-height:50px;border:0;border-radius:999px;background:var(--sk-blue);color:#fff;padding:0 24px;font-weight:800;cursor:pointer}.live-status{margin-top:16px;border-left:4px solid var(--sk-cyan);background:var(--sk-pale);border-radius:12px;padding:16px;color:var(--sk-body);font-size:13px;line-height:1.6}.live-results{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px;margin-top:18px}.live-product{border:1px solid var(--sk-border);border-radius:14px;padding:20px;background:#fff}.live-product h4{font-size:17px;color:var(--sk-blue);margin-bottom:8px}.live-product p{font-size:13px;color:var(--sk-body);line-height:1.6}.live-meta{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:var(--sk-cyan);margin-bottom:7px}.live-links{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.live-links a{font-size:11px;font-weight:800;color:var(--sk-blue);text-decoration:underline}.neutral{color:var(--sk-muted);font-size:12px;line-height:1.6}.compare-text{font-weight:700;color:var(--sk-blue)}
@media(max-width:860px){.ins-search-row{grid-template-columns:1fr}.ins-search button{width:100%}}
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
<section id="hero-wrap" data-section-id="insurance-hero">
  <div class="hero-kicker" data-content-id="insurance-hero-kicker">SKANDI INSURANCE</div>
  <div id="hero-title" data-content-id="insurance-hero-title">Travel with Greater Peace of Mind</div>
  <div id="hero-sub" data-content-id="insurance-hero-copy">Insurance can help protect against unexpected costs before and during a trip. Exact coverage, insurer, price, eligibility and exclusions depend on the product offered for your booking.</div>
</section>

<section class="content-section">
  <div class="section-title">Search published insurance information</div>
  <div class="section-subtitle">Search the insurance products and guidance currently published through SKANDI's shared content and Inventory Control data.</div>
  <div class="ins-search"><div class="ins-search-row"><input id="insuranceSearch" type="search" placeholder="Search insurance, cancellation, market or provider…"><button id="insuranceSearchButton" type="button">Search</button></div><div id="liveStatus" class="live-status">Loading published insurance information…</div><div id="liveResults" class="live-results"></div></div>

  <div class="section-title">Choose the type of protection you need</div>
  <div class="section-subtitle">These are common travel-insurance categories, not a promise that a specific product or benefit is currently available for your booking.</div>
  <div class="card-grid">
    <article class="ins-card"><div class="ins-icon">🛡️</div><h3>Cancellation Protection</h3><p>Cancellation protection can reimburse eligible prepaid travel costs when a covered event prevents travel. Covered reasons, evidence requirements, limits and exclusions are defined by the specific policy.</p><ul class="ins-features"><li>May cover specified illness or other insured events</li><li>Eligibility and purchase deadlines vary</li><li>Always review the policy documents before purchase</li></ul><div class="ins-price">Price shown with the offered product</div><button class="btn-primary" type="button" data-action="searchTrips">Check Your Trip</button><div class="legal-mini">Insurer and policy documents are displayed only when a product is actually offered.</div></article>
    <article class="ins-card"><div class="ins-icon">✈️</div><h3>Travel Insurance</h3><p>Travel insurance may provide protection during the trip for medical, baggage, interruption or assistance events. Benefits and limits vary widely between products and markets.</p><ul class="ins-features"><li>Compare against existing home, card or employer cover</li><li>Check deductibles, exclusions and assistance rules</li><li>Keep the insurer's emergency contact details while traveling</li></ul><div class="ins-price">Coverage shown with the offered product</div><button class="btn-primary" type="button" data-action="searchTrips">Check Your Trip</button><div class="legal-mini">Only the exact policy wording for the offered product is authoritative.</div></article>
  </div>
</section>

<section class="content-section" style="padding-top:0">
  <div class="section-title">Compare what to check</div>
  <div class="section-subtitle">Instead of assuming every policy works the same way, compare the following points before buying.</div>
  <div class="table-wrapper"><table><thead><tr><th>Feature</th><th>Existing Cover</th><th>Cancellation Protection</th><th>Travel Insurance</th></tr></thead><tbody>
    <tr><td>Cancellation before departure</td><td class="compare-text">Check policy</td><td class="compare-text">Product specific</td><td class="compare-text">Product specific</td></tr>
    <tr><td>Medical expenses abroad</td><td class="compare-text">Check policy</td><td class="cross">Usually not its purpose</td><td class="compare-text">Product specific</td></tr>
    <tr><td>Lost or delayed baggage</td><td class="compare-text">Check policy</td><td class="cross">Usually not its purpose</td><td class="compare-text">Product specific</td></tr>
    <tr><td>Deductible / excess</td><td class="compare-text">Check policy</td><td class="compare-text">Product specific</td><td class="compare-text">Product specific</td></tr>
    <tr><td>Emergency assistance</td><td class="compare-text">Check policy</td><td class="compare-text">Product specific</td><td class="compare-text">Product specific</td></tr>
  </tbody></table></div>
</section>

<section id="faq-section" class="content-section">
  <div class="section-title">Frequently Asked Questions</div>
  <div class="faq-grid">
    <details><summary>Do I need travel insurance if I already have home insurance?</summary><div class="faq-content">Maybe not. Home, credit-card or employer cover can overlap with travel insurance. Compare the actual limits, exclusions, deductibles and assistance services before buying additional cover.</div></details>
    <details><summary>When can I add cancellation protection?</summary><div class="faq-content">Purchase deadlines are product specific. Some products must be purchased at booking or within a defined time after the initial trip payment. Use the terms shown with the offered product.</div></details>
    <details><summary>How do I make a claim?</summary><div class="faq-content">Claims are handled under the insurer's policy terms. Keep receipts and supporting documents and follow the claim instructions shown in the policy or insurer portal.</div></details>
  </div>
</section>

<section class="content-section legal-section">
  <h4>Important Regulatory Information</h4>
  <div class="legal-grid"><div class="legal-box"><strong>Product-specific information</strong><span>SKANDI only displays insurer, intermediary status, policy documents, price and coverage details when they exist in the published product record for your market or booking.</span></div><div class="legal-box"><strong>Your existing insurance</strong><span>SKANDI cannot determine whether another policy you already hold is sufficient for your personal needs. Review your existing cover and the offered product documents before purchase.</span></div></div>
</section>
<script>
(()=>{"use strict";
const SOURCE="SKANDI_INSURANCE_PAGE",PARENT="SKANDI_WIX_PARENT",VERSION="BACKEND-BASE-1.0-B011.3";
const $=id=>document.getElementById(id),esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let DATA={configured:false,products:[],guidance:[],disclaimer:""};
function post(type,payload={}){window.parent.postMessage({source:SOURCE,type,payload,timestamp:new Date().toISOString()},"*")}
function combined(){return [...(DATA.products||[]).map(x=>({...x,_kind:"Product"})),...(DATA.guidance||[]).map(x=>({...x,_kind:"Guidance"}))]}
function renderSearch(){const q=String($("insuranceSearch").value||"").trim().toLowerCase();const all=combined(),rows=q?all.filter(x=>JSON.stringify(x).toLowerCase().includes(q)):all;$("liveResults").innerHTML=rows.length?rows.slice(0,40).map(x=>`<article class="live-product"><div class="live-meta">${esc(x._kind)}${x.market?` · ${esc(x.market)}`:""}</div><h4>${esc(x.title||"Travel insurance")}</h4><p>${esc(x.summary||x.excerpt||x.body||"")}</p>${x.provider?`<p class="neutral" style="margin-top:8px"><strong>Provider:</strong> ${esc(x.provider)}</p>`:""}${x.priceLabel?`<p class="neutral"><strong>Price:</strong> ${esc(x.priceLabel)}</p>`:""}<div class="live-links">${x.ipidUrl?`<a href="${esc(x.ipidUrl)}" target="_blank" rel="noopener">Product information</a>`:""}${x.termsUrl?`<a href="${esc(x.termsUrl)}" target="_blank" rel="noopener">Terms</a>`:""}</div></article>`).join(""):`<div class="live-status">No published insurance record matches this search.</div>`;const total=all.length;$("liveStatus").textContent=total?`${total} published insurance ${total===1?"record":"records"} available. Exact terms remain product specific.`:(DATA.disclaimer||"No canonical insurance product is currently published. Exact insurer, price and coverage are intentionally not invented.")}
$("insuranceSearch").addEventListener("input",renderSearch);$("insuranceSearch").addEventListener("keydown",e=>{if(e.key==="Enter")renderSearch()});$("insuranceSearchButton").onclick=renderSearch;document.querySelectorAll('[data-action="searchTrips"]').forEach(btn=>btn.onclick=()=>post("INSURANCE_SEARCH_TRIPS",{}));
window.addEventListener("message",e=>{let m=e.data;if(typeof m==="string"){try{m=JSON.parse(m)}catch(_){return}}if(!m||m.source!==PARENT)return;if(m.type==="INSURANCE_HOST_READY")post("INSURANCE_READY",{language:"EN",version:VERSION});else if(m.type==="INSURANCE_LOADING")$("liveStatus").textContent="Loading published insurance information…";else if(m.type==="INSURANCE_DATA"){DATA=m.payload||DATA;renderSearch()}else if(m.type==="INSURANCE_ERROR")$("liveStatus").textContent=m.payload?.message||"Travel insurance information is unavailable."});
post("INSURANCE_READY",{language:"EN",version:VERSION});
})();
</script>
<script id="skandi-b011-back-bridge">
(()=>{
  const back=document.getElementById("backToTravelInfo");
  if(!back)return;
  back.addEventListener("click",()=>{
    window.parent.postMessage({
      source:"SKANDI_INSURANCE_PAGE",
      type:"INSURANCE_NAVIGATE",
      payload:{path:"/travel-info"},
      timestamp:new Date().toISOString()
    },"*");
  });
})();
</script>

</body></html>
```
