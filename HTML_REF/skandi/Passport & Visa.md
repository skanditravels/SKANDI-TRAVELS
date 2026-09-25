# Passport & Visa

## INFO / LOG

- **Status:** READY — B-011.3 design/style convergence
- **System:** SKANDI customer website
- **Route:** `/travel-info/passport-visa`
- **Wix page:** `Passport & Visa.zohjw`
- **HTML component:** `#passportVisaEmbed`
- **HTML child source:** `SKANDI_PASSPORT_VISA_PAGE`
- **Page controller:** `/src/pages/Passport & Visa.zohjw.js`
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

`#passportVisaEmbed`
→ `Passport & Visa.zohjw.js`
→ `getPublicPassportVisaPayload` / `searchPublicTravelRequirements`
→ `backend/SKANDI_CORE/publicContent`
→ Travel Info / Inventory public projections / approved travel-requirements provider adapter.

No backend change is included in B-011.3.

---

## COMPLETE INTENDED LIVE HTML SOURCE

```html
<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>SKANDI • Passport & Visa · B-011.3</title><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet"><style>
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
  --sk-warning-bg:#fffbeb;
  --sk-warning-border:#fde68a;
  --sk-warning-text:#92400e;
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
  background: linear-gradient(rgba(2, 46, 100, 0.6), rgba(2, 46, 100, 0.8)), url("https://images.unsplash.com/photo-1544253303-34e8fcfd1976?auto=format&fit=crop&w=1920&q=80") center/cover;
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

/* INFO CARDS */
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
}
.info-card {
  background: #fff;
  border: 1px solid var(--sk-border);
  border-radius: 16px;
  padding: 32px;
  box-shadow: var(--sk-shadow);
  display: flex;
  flex-direction: column;
}
.info-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--sk-border-soft);
}
.info-icon {
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
.info-header h3 {
  font-size: 20px;
  color: var(--sk-blue);
  line-height: 1.3;
}
.info-card p {
  color: var(--sk-body);
  font-size: 14px;
  line-height: 1.6;
  flex-grow: 1;
}

/* WARNING / ALERT BOX */
.alert-box {
  background: var(--sk-warning-bg);
  border: 1px solid var(--sk-warning-border);
  border-radius: 12px;
  padding: 24px;
  display: flex;
  gap: 20px;
  margin-bottom: 40px;
  box-shadow: var(--sk-shadow);
}
.alert-icon {
  font-size: 32px;
}
.alert-content h4 {
  color: var(--sk-warning-text);
  font-size: 18px;
  margin-bottom: 8px;
}
.alert-content p {
  color: #78350f;
  font-size: 14px;
  line-height: 1.6;
}

/* VISA / ESTA SECTION */
.visa-banner {
  background: var(--sk-bg);
  border: 1px solid var(--sk-border);
  border-radius: 16px;
  padding: 40px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  align-items: center;
}
.visa-content h3 {
  font-size: 24px;
  color: var(--sk-blue);
  margin-bottom: 12px;
}
.visa-content p {
  font-size: 14px;
  color: var(--sk-body);
  line-height: 1.6;
  margin-bottom: 20px;
}
.btn-primary {
  display: inline-block;
  background: var(--sk-blue);
  color: #fff;
  padding: 12px 24px;
  border-radius: 999px;
  text-decoration: none;
  font-size: 13px;
  font-weight: 800;
  transition: background 0.2s;
}
.btn-primary:hover {
  background: var(--sk-blue2);
}
.visa-links {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.visa-link-card {
  background: #fff;
  border: 1px solid var(--sk-border);
  padding: 16px 20px;
  border-radius: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--sk-blue);
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
  transition: transform 0.2s, box-shadow 0.2s;
}
.visa-link-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--sk-shadow);
  border-color: var(--sk-cyan);
}
.visa-link-card span {
  color: var(--sk-muted);
  font-weight: 400;
  font-size: 12px;
  display: block;
  margin-top: 4px;
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
  .visa-banner { grid-template-columns: 1fr; padding: 24px; }
  .alert-box { flex-direction: column; gap: 12px; }
}

/* LIVE ALTEA-SHARED TRAVEL REQUIREMENTS SEARCH */
.requirements-search{background:#fff;border:1px solid var(--sk-border);border-radius:18px;padding:30px;box-shadow:var(--sk-shadow);margin-bottom:34px}.search-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}.field label{display:block;font-size:11px;font-weight:800;color:var(--sk-muted);text-transform:uppercase;letter-spacing:.07em;margin-bottom:7px}.field input,.field select{width:100%;min-height:48px;border:1px solid var(--sk-border);border-radius:12px;padding:0 14px;background:#fff;color:var(--sk-blue);font:600 14px Montserrat;outline:none}.field input:focus,.field select:focus{border-color:var(--sk-cyan);box-shadow:0 0 0 4px rgba(95,199,207,.12)}.search-actions{display:flex;justify-content:flex-end;margin-top:16px}.search-actions .btn-primary{border:0;cursor:pointer;min-width:190px}.lookup-status{margin-top:18px;background:var(--sk-pale);border-left:4px solid var(--sk-cyan);border-radius:12px;padding:16px;color:var(--sk-body);font-size:13px;line-height:1.6}.lookup-status.warning{background:var(--sk-warning-bg);border-left-color:#d59a24;color:var(--sk-warning-text)}
.lookup-result{margin-top:18px;display:grid;gap:12px}.result-card{border:1px solid var(--sk-border);border-radius:14px;padding:20px;background:#fff}.result-card h4{font-size:17px;color:var(--sk-blue);margin-bottom:8px}.result-card p{font-size:13px;color:var(--sk-body);line-height:1.65}.result-meta{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:var(--sk-cyan);margin-bottom:7px}.result-list{list-style:none;margin-top:10px}.result-list li{font-size:13px;color:var(--sk-body);line-height:1.55;margin-top:8px;padding-left:16px;position:relative}.result-list li:before{content:"";position:absolute;left:0;top:.65em;width:7px;height:2px;background:var(--sk-cyan)}.destination-results{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:14px;margin-top:20px}.hidden{display:none!important}
@media(max-width:860px){.search-grid{grid-template-columns:1fr}.search-actions .btn-primary{width:100%}}
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
<section id="hero-wrap" data-section-id="passport-hero">
  <div class="hero-kicker" data-content-id="passport-hero-kicker">SKANDI TRAVEL INFO</div>
  <div id="hero-title" data-content-id="passport-hero-title">Passport & Visa Requirements</div>
  <div id="hero-sub" data-content-id="passport-hero-copy">A smooth journey starts with the right documents. Search the same travel-requirements source used by ALTEA, then verify the final rules with the relevant official authorities.</div>
</section>

<section class="content-section">
  <div class="section-title">Check your travel requirements</div>
  <div class="section-subtitle">Enter your nationality and destination. This lookup uses the same approved provider adapter and SKANDI fallback records that ALTEA uses internally.</div>
  <div class="requirements-search">
    <div class="search-grid">
      <div class="field"><label for="nationality">Nationality</label><input id="nationality" maxlength="3" placeholder="SE / SWE" autocomplete="off"></div>
      <div class="field"><label for="residenceCountry">Country of residence <span style="font-weight:500;text-transform:none">(optional)</span></label><input id="residenceCountry" maxlength="3" placeholder="SE / SWE" autocomplete="off"></div>
      <div class="field"><label for="origin">Origin <span style="font-weight:500;text-transform:none">(optional)</span></label><input id="origin" maxlength="12" placeholder="ARN / JFK" autocomplete="off"></div>
      <div class="field"><label for="destination">Destination</label><input id="destination" list="destinationOptions" maxlength="80" placeholder="USA, JFK, Thailand…" autocomplete="off"><datalist id="destinationOptions"></datalist></div>
      <div class="field"><label for="departureDate">Departure date <span style="font-weight:500;text-transform:none">(optional)</span></label><input id="departureDate" type="date"></div>
      <div class="field"><label for="returnDate">Return date <span style="font-weight:500;text-transform:none">(optional)</span></label><input id="returnDate" type="date"></div>
    </div>
    <div class="search-actions"><button id="requirementsSearch" class="btn-primary" type="button">Check Requirements</button></div>
    <div id="lookupStatus" class="lookup-status">Enter your nationality and destination to check the current connected source.</div>
    <div id="lookupResult" class="lookup-result"></div>
  </div>

  <div class="section-title">Essential passport guidance</div>
  <div class="section-subtitle">Rules vary by nationality, destination, transit point and document type. These general reminders do not replace a route-specific document check.</div>
  <div class="alert-box"><div class="alert-icon">⚠️</div><div class="alert-content"><h4>Damaged or Temporary Passports</h4><p>A damaged passport can be refused by an airline or border authority. Acceptance of emergency, temporary or provisional passports varies by country, so verify the exact document type before travel.</p></div></div>
  <div class="info-grid">
    <article class="info-card"><div class="info-header"><div class="info-icon">📅</div><h3>Passport Validity</h3></div><p>There is no universal six-month rule. Some destinations require validity beyond the planned stay, while others use different rules. Use the search above for your route and nationality.</p></article>
    <article class="info-card"><div class="info-header"><div class="info-icon">👶</div><h3>Children & Infants</h3></div><p>Children need travel documents accepted for their nationality and destination. Consent or custody documents can also be required when a minor travels with one parent or another adult.</p></article>
    <article class="info-card"><div class="info-header"><div class="info-icon">🛂</div><h3>Transit Requirements</h3></div><p>A transit point can introduce separate visa or authorization requirements, even if you do not leave the airport. Include transit details whenever your itinerary requires them.</p></article>
  </div>
</section>

<section class="content-section" style="padding-top:0">
  <div class="visa-banner">
    <div class="visa-content"><h3>Visas and Electronic Authorizations</h3><p>Depending on your nationality and itinerary, you may need a visa, visa waiver or electronic travel authorization before departure. SKANDI can show guidance from the connected requirements source, but the traveler remains responsible for valid entry documents.</p><button id="officialHelp" class="btn-primary" type="button" style="border:0;cursor:pointer">Travel Info Help</button></div>
    <div class="visa-links">
      <div class="visa-link-card"><div>Use official government sources<span>Always verify the latest entry and transit rules with the destination and transit authorities.</span></div><div>✓</div></div>
      <div class="visa-link-card"><div>Match the booking name<span>Your booking details should match the travel document you intend to present.</span></div><div>✓</div></div>
      <div class="visa-link-card"><div>Recheck close to departure<span>Requirements can change after booking. Review them again before check-in.</span></div><div>✓</div></div>
    </div>
  </div>
</section>

<section class="content-section">
  <div class="section-title">Published SKANDI destination guidance</div>
  <div class="section-subtitle">Destination summaries below come from the same SKANDI content database used across Travel Info and ALTEA guidance fallback.</div>
  <div id="destinationResults" class="destination-results"></div>
</section>

<section class="content-section">
  <div class="section-title">Frequently Asked Questions</div>
  <div class="faq-grid">
    <details><summary>Do transit countries have separate requirements?</summary><div class="faq-content">Yes, they can. Transit rules depend on nationality, airport, document type and whether you pass border control. Always check every country in the itinerary.</div></details>
    <details><summary>I have dual citizenship. Which passport should I use?</summary><div class="faq-content">Use the passport that satisfies the route's entry requirements and make sure the booking information matches the document you will present. Some countries require their citizens to enter or leave on that country's passport.</div></details>
    <details><summary>What if my documents do not meet the requirements?</summary><div class="faq-content">The operating airline or border authority can refuse travel. Document-related refusal and any resulting cost are governed by your booking terms and the applicable supplier or authority rules.</div></details>
  </div>
</section>
<script>
(()=>{"use strict";
const SOURCE="SKANDI_PASSPORT_VISA_PAGE",PARENT="SKANDI_WIX_PARENT",VERSION="BACKEND-BASE-1.0-B011.3";
const $=id=>document.getElementById(id),esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let DATA={requirements:[],guidance:[],destinations:[]};
function post(type,payload={}){window.parent.postMessage({source:SOURCE,type,payload,timestamp:new Date().toISOString()},"*")}
function destinationCode(value){const raw=String(value||"").trim();if(!raw)return"";const exact=(DATA.destinations||[]).find(x=>String(x.title||"").toLowerCase()===raw.toLowerCase()||String(x.code||"").toLowerCase()===raw.toLowerCase());return String(exact?.code||raw).trim().toUpperCase().slice(0,12)}
function renderDatalist(){const seen=new Set();$("destinationOptions").innerHTML=(DATA.destinations||[]).filter(x=>{const k=`${x.title}|${x.code}`;if(seen.has(k))return false;seen.add(k);return true}).slice(0,500).map(x=>`<option value="${esc(x.title||x.code||"")}">${x.code?esc(x.code):""}</option>`).join("")}
function renderDestinations(){const rows=(DATA.destinations||[]).slice(0,80);$("destinationResults").innerHTML=rows.length?rows.map(x=>`<article class="info-card"><div class="result-meta">${esc(x.type||"Destination")}${x.code?` · ${esc(x.code)}`:""}</div><div class="info-header" style="margin-bottom:12px"><div class="info-icon">🌍</div><h3>${esc(x.title||x.code||"Destination")}</h3></div>${x.passportSummary?`<p><strong>Passport:</strong> ${esc(x.passportSummary)}</p>`:""}${x.visaSummary?`<p style="margin-top:10px"><strong>Visa:</strong> ${esc(x.visaSummary)}</p>`:""}${x.importantInformation?`<p style="margin-top:10px"><strong>Important:</strong> ${esc(x.importantInformation)}</p>`:""}</article>`).join(""):`<div class="lookup-status">No destination-specific passport or visa summaries are currently published in Inventory Control.</div>`}
function search(){const nationality=String($("nationality").value||"").trim().toUpperCase();const destination=destinationCode($("destination").value);if(!nationality||!destination){$("lookupStatus").className="lookup-status warning";$("lookupStatus").textContent="Nationality and destination are required.";return}$("lookupStatus").className="lookup-status";$("lookupStatus").textContent="Checking the same travel-requirements source used by ALTEA…";$("lookupResult").innerHTML="";post("PASSPORT_VISA_SEARCH",{language:"EN",nationality,residenceCountry:String($("residenceCountry").value||"").trim().toUpperCase(),origin:String($("origin").value||"").trim().toUpperCase(),destination,departureDate:$("departureDate").value||"",returnDate:$("returnDate").value||"",documentType:"PASSPORT"})}
function renderLookup(result={}){$("lookupStatus").className=`lookup-status${result.connected?"":" warning"}`;$("lookupStatus").textContent=result.summary||"Travel requirements checked.";const fields=(result.fields||[]).filter(x=>x.label||x.value),guidance=(result.guidance||[]),notices=(result.notices||[]);let html="";if(fields.length)html+=fields.map(x=>`<article class="result-card"><div class="result-meta">${esc(x.category||x.status||"Requirement")}</div><h4>${esc(x.label||x.key||"Requirement")}</h4><p>${esc(x.value||"")}</p></article>`).join("");if(guidance.length)html+=guidance.map(x=>`<article class="result-card"><div class="result-meta">SKANDI guidance</div><h4>${esc(x.title||"Travel requirement")}</h4><p>${esc(x.body||"")}</p></article>`).join("");if(notices.length)html+=`<article class="result-card"><div class="result-meta">Important</div><ul class="result-list">${notices.map(n=>`<li>${esc(n)}</li>`).join("")}</ul></article>`;if(result.officialSourcesRequired)html+=`<article class="result-card"><div class="result-meta">Final authority</div><p>Use official government, border-control and visa-authority sources for the final decision. The operating airline may also perform its own document validation before boarding.</p></article>`;$("lookupResult").innerHTML=html||`<article class="result-card"><p>No detailed requirement fields were returned. Verify the route with official authorities before travel.</p></article>`}
$("requirementsSearch").onclick=search;["nationality","destination"].forEach(id=>$(id).addEventListener("keydown",e=>{if(e.key==="Enter")search()}));$("officialHelp").onclick=()=>post("PASSPORT_VISA_NAVIGATE",{path:"/travel-info"});
window.addEventListener("message",e=>{let m=e.data;if(typeof m==="string"){try{m=JSON.parse(m)}catch(_){return}}if(!m||m.source!==PARENT)return;if(m.type==="PASSPORT_VISA_HOST_READY")post("PASSPORT_VISA_READY",{language:"EN",version:VERSION});else if(m.type==="PASSPORT_VISA_LOADING")$("lookupStatus").textContent="Loading SKANDI destination guidance…";else if(m.type==="PASSPORT_VISA_DATA"){DATA=m.payload||DATA;renderDatalist();renderDestinations();$("lookupStatus").className="lookup-status";$("lookupStatus").textContent="Enter your nationality and destination to check the current connected source."}else if(m.type==="PASSPORT_VISA_SEARCHING"){$("lookupStatus").className="lookup-status";$("lookupStatus").textContent="Checking the same travel-requirements source used by ALTEA…"}else if(m.type==="PASSPORT_VISA_SEARCH_RESULT")renderLookup(m.payload||{});else if(m.type==="PASSPORT_VISA_SEARCH_ERROR"){$("lookupStatus").className="lookup-status warning";$("lookupStatus").textContent=m.payload?.message||"Travel requirements search is unavailable."}else if(m.type==="PASSPORT_VISA_ERROR"){$("lookupStatus").className="lookup-status warning";$("lookupStatus").textContent=m.payload?.message||"Passport and visa guidance is unavailable."}});
post("PASSPORT_VISA_READY",{language:"EN",version:VERSION});
})();
</script>
<script id="skandi-b011-back-bridge">
(()=>{
  const back=document.getElementById("backToTravelInfo");
  if(!back)return;
  back.addEventListener("click",()=>{
    window.parent.postMessage({
      source:"SKANDI_PASSPORT_VISA_PAGE",
      type:"PASSPORT_VISA_NAVIGATE",
      payload:{path:"/travel-info"},
      timestamp:new Date().toISOString()
    },"*");
  });
})();
</script>

</body></html>
```
