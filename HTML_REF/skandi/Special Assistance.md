# Special Assistance

## INFO / LOG

- **Status:** READY — B-011.3 design/style convergence
- **System:** SKANDI customer website
- **Route:** `/travel-info/special-assistance`
- **Wix page:** `Existing Wix Special Assistance page`
- **HTML component:** `Existing page HTML component — canonical ID not present in current repo/source registry`
- **HTML child source:** `SKANDI_ASSISTANCE_PAGE`
- **Page controller:** `No page-specific controller committed in current main; static content page`
- **Backend/data owner:** `None required for current static content`
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

### Current static page scope

The supplied Special Assistance page is a static informational page with EN/SV copy and no canonical page-specific backend in current GitHub main. B-011.3 therefore changes presentation only and does not invent a new data service.

The current repository/source registry does not expose a canonical Wix HTML-component ID or committed page-controller filename for this route. The package intentionally does not invent one. Install the HTML into the existing Special Assistance page's current HTML component.

---

## COMPLETE INTENDED LIVE HTML SOURCE

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>SKANDI • Special Assistance · B-011.3</title>
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
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
  background: linear-gradient(rgba(2, 46, 100, 0.6), rgba(2, 46, 100, 0.8)), url("https://images.unsplash.com/photo-1573497620053-ea5300f94f21?auto=format&fit=crop&w=1920&q=80") center/cover;
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

/* ACTION BANNER */
.action-banner {
  background: var(--sk-bg);
  border: 1px solid var(--sk-border);
  border-radius: 16px;
  padding: 40px;
  text-align: center;
  margin-bottom: 40px;
}
.action-banner h3 {
  font-size: 24px;
  color: var(--sk-blue);
  margin-bottom: 12px;
}
.action-banner p {
  font-size: 15px;
  color: var(--sk-body);
  margin-bottom: 24px;
  max-width: 600px;
  margin-inline: auto;
}
.btn-primary {
  display: inline-block;
  background: var(--sk-blue);
  color: #fff;
  padding: 14px 28px;
  border-radius: 999px;
  text-decoration: none;
  font-size: 14px;
  font-weight: 800;
  transition: background 0.2s;
  cursor: pointer;
  border: none;
}
.btn-primary:hover {
  background: var(--sk-blue2);
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
  .alert-box { flex-direction: column; gap: 12px; }
}
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


<style id="skandi-b011-special-link-fix">
a.btn-primary{display:inline-flex;align-items:center;justify-content:center;text-decoration:none}
</style>

</head>
<body>

<section id="hero-wrap" data-section-id="special-hero">
  <div class="hero-kicker" data-content-id="special-hero-kicker" data-i18n="sa.hero.kicker">SKANDI ACCESSIBILITY</div>
  <div id="hero-title" data-content-id="special-hero-title" data-i18n="sa.hero.title">Special Assistance</div>
  <div id="hero-sub" data-content-id="special-hero-copy" data-i18n="sa.hero.copy">We are committed to making travel accessible for everyone. Whether you require mobility assistance, travel with a service animal, or carry medical equipment, we are here to support your journey.</div>
</section>

<section class="content-section">
  <div class="section-title" data-i18n="sa.services.title">How We Can Help</div>
  <div class="section-subtitle" data-i18n="sa.services.copy">Review the categories below to understand what assistance is available and how to request it for your upcoming trip.</div>
  
  <div class="alert-box">
    <div class="alert-icon">⏱️</div>
    <div class="alert-content">
      <h4 data-i18n="sa.alert.title">The 48-Hour Notice Rule</h4>
      <p data-i18n="sa.alert.desc">To ensure we can accommodate your needs, you <strong>must request assistance at least 48 hours before your scheduled departure</strong>. If you notify us closer to departure, we will make every reasonable effort, but the requested services cannot be guaranteed.</p>
    </div>
  </div>

  <div class="info-grid">
    <!-- Wheelchair / Mobility -->
    <article class="info-card">
      <div class="info-header">
        <div class="info-icon">♿</div>
        <h3 data-i18n="sa.card1.title">Wheelchair & Mobility</h3>
      </div>
      <p data-i18n="sa.card1.desc">Assistance is available for navigating the airport, boarding the aircraft, and transferring to your seat. If you are traveling with your own manual or electric wheelchair, you must provide its dimensions, weight, and battery type (lithium-ion or dry cell) during booking so we can safely store it in the hold.</p>
    </article>

    <!-- Medical Equipment -->
    <article class="info-card">
      <div class="info-header">
        <div class="info-icon">⚕️</div>
        <h3 data-i18n="sa.card2.title">Medical Equipment & Oxygen</h3>
      </div>
      <p data-i18n="sa.card2.desc">You may bring necessary medical equipment (like CPAP machines) free of charge in addition to your hand luggage. If you require medical oxygen during the flight, you must pre-book this service. Use of personal portable oxygen concentrators (POCs) requires advance medical clearance.</p>
    </article>

    <!-- Service Animals -->
    <article class="info-card">
      <div class="info-header">
        <div class="info-icon">🦮</div>
        <h3 data-i18n="sa.card3.title">Service Dogs (SVAN)</h3>
      </div>
      <p data-i18n="sa.card3.desc">Fully trained service dogs travel free of charge in the cabin. <strong>Note:</strong> In compliance with updated international regulations, Emotional Support Animals (ESAs) are not recognized as service animals and must travel as regular pets. For US flights, DOT Service Animal forms must be submitted in advance.</p>
    </article>

    <!-- Hidden Disabilities -->
    <article class="info-card">
      <div class="info-header">
        <div class="info-icon">🌻</div>
        <h3 data-i18n="sa.card4.title">Hidden Disabilities</h3>
      </div>
      <p data-i18n="sa.card4.desc">We recognize the Sunflower Lanyard scheme. If you or someone you are traveling with has a hidden disability (such as autism, dementia, or severe anxiety), wearing the lanyard discreetly lets our airport and cabin crew know you may need more time, understanding, or assistance.</p>
    </article>
  </div>
</section>

<section class="content-section" style="padding-top: 0;">
  <div class="action-banner">
    <h3 data-i18n="sa.action.title">Ready to Request Assistance?</h3>
    <p data-i18n="sa.action.desc">The fastest way to arrange assistance is to add it directly to your booking via My Profile, or by contacting our dedicated Special Assistance desk.</p>
    <a class="btn-primary" data-i18n="sa.action.btn" href="https://www.skanditravels.com/my-profile?tab=trips" target="_top" rel="noopener">Manage My Booking</a>
  </div>
</section>

<section class="content-section">
  <div class="section-title" data-i18n="sa.faq.title">Frequently Asked Questions</div>
  
  <div class="faq-grid">
    <details>
      <summary data-i18n="sa.faq.q1">Is there a charge for booking special assistance?</summary>
      <div class="faq-content" data-i18n="sa.faq.a1">No. All special assistance services, including wheelchair support at the airport, traveling with a recognized service dog, and transporting essential medical equipment, are provided completely free of charge.</div>
    </details>
    <details>
      <summary data-i18n="sa.faq.q2">Can I sit in an emergency exit row if I request assistance?</summary>
      <div class="faq-content" data-i18n="sa.faq.a2">For safety reasons mandated by aviation authorities (FAA/EASA), passengers with reduced mobility, visual/hearing impairments, or those traveling with service animals or infants are strictly prohibited from sitting in emergency exit rows.</div>
    </details>
    <details>
      <summary data-i18n="sa.faq.q3">Can I take my medication in my hand luggage?</summary>
      <div class="faq-content" data-i18n="sa.faq.a3">Yes, you should always pack essential medication in your hand luggage. Liquid medication over 100ml is permitted but must be accompanied by a doctor's prescription or a pharmacy label clearly showing your name.</div>
    </details>
  </div>
</section>

<!-- REGULATORY AND LEGAL FOOTER -->
<section class="content-section legal-section">
  <h4 data-i18n="sa.legal.title">Regulatory Compliance & Rights</h4>
  <div class="legal-grid">
    <div class="legal-box">
      <strong data-i18n="sa.legal.euTitle">EU / EEA & UK Regulations</strong>
      <span data-i18n="sa.legal.euCopy">In accordance with Regulation (EC) No 1107/2006, disabled persons and persons with reduced mobility have the right to travel by air without discrimination. Assistance at airports and on board aircraft must be provided free of charge, provided that the operating carrier is notified at least 48 hours before the published departure time.</span>
    </div>
    <div class="legal-box">
      <strong data-i18n="sa.legal.usTitle">US Air Carrier Access Act (ACAA)</strong>
      <span data-i18n="sa.legal.usCopy">In accordance with 14 CFR Part 382, air carriers may not discriminate against passengers on the basis of disability. SKANDI Travels is committed to these standards. For flights arriving or departing from the United States, a Complaint Resolution Official (CRO) is available at the airport to handle any disability-related concerns.</span>
    </div>
  </div>
</section>

<script>
const SOURCE = "SKANDI_ASSISTANCE_PAGE";

const I18N = {
  "EN": {
    "sa.hero.kicker": "SKANDI ACCESSIBILITY",
    "sa.hero.title": "Special Assistance",
    "sa.hero.copy": "We are committed to making travel accessible for everyone. Whether you require mobility assistance, travel with a service animal, or carry medical equipment, we are here to support your journey.",
    "sa.services.title": "How We Can Help",
    "sa.services.copy": "Review the categories below to understand what assistance is available and how to request it for your upcoming trip.",
    "sa.alert.title": "The 48-Hour Notice Rule",
    "sa.alert.desc": "To ensure we can accommodate your needs, you must request assistance at least 48 hours before your scheduled departure. If you notify us closer to departure, we will make every reasonable effort, but the requested services cannot be guaranteed.",
    "sa.card1.title": "Wheelchair & Mobility",
    "sa.card1.desc": "Assistance is available for navigating the airport, boarding the aircraft, and transferring to your seat. If you are traveling with your own manual or electric wheelchair, you must provide its dimensions, weight, and battery type (lithium-ion or dry cell) during booking.",
    "sa.card2.title": "Medical Equipment & Oxygen",
    "sa.card2.desc": "You may bring necessary medical equipment (like CPAP machines) free of charge in addition to your hand luggage. If you require medical oxygen during the flight, you must pre-book this service. Use of personal portable oxygen concentrators (POCs) requires advance medical clearance.",
    "sa.card3.title": "Service Dogs (SVAN)",
    "sa.card3.desc": "Fully trained service dogs travel free of charge in the cabin. Note: In compliance with updated international regulations, Emotional Support Animals (ESAs) are not recognized as service animals and must travel as regular pets. For US flights, DOT Service Animal forms must be submitted in advance.",
    "sa.card4.title": "Hidden Disabilities",
    "sa.card4.desc": "We recognize the Sunflower Lanyard scheme. If you or someone you are traveling with has a hidden disability (such as autism, dementia, or severe anxiety), wearing the lanyard discreetly lets our airport and cabin crew know you may need more time, understanding, or assistance.",
    "sa.action.title": "Ready to Request Assistance?",
    "sa.action.desc": "The fastest way to arrange assistance is to add it directly to your booking via My Profile, or by contacting our dedicated Special Assistance desk.",
    "sa.action.btn": "Manage My Booking",
    "sa.faq.title": "Frequently Asked Questions",
    "sa.faq.q1": "Is there a charge for booking special assistance?",
    "sa.faq.a1": "No. All special assistance services, including wheelchair support at the airport, traveling with a recognized service dog, and transporting essential medical equipment, are provided completely free of charge.",
    "sa.faq.q2": "Can I sit in an emergency exit row if I request assistance?",
    "sa.faq.a2": "For safety reasons mandated by aviation authorities (FAA/EASA), passengers with reduced mobility, visual/hearing impairments, or those traveling with service animals or infants are strictly prohibited from sitting in emergency exit rows.",
    "sa.faq.q3": "Can I take my medication in my hand luggage?",
    "sa.faq.a3": "Yes, you should always pack essential medication in your hand luggage. Liquid medication over 100ml is permitted but must be accompanied by a doctor's prescription or a pharmacy label clearly showing your name.",
    "sa.legal.title": "Regulatory Compliance & Rights",
    "sa.legal.euTitle": "EU / EEA & UK Regulations",
    "sa.legal.euCopy": "In accordance with Regulation (EC) No 1107/2006, disabled persons and persons with reduced mobility have the right to travel by air without discrimination. Assistance at airports and on board aircraft must be provided free of charge, provided that the operating carrier is notified at least 48 hours before the published departure time.",
    "sa.legal.usTitle": "US Air Carrier Access Act (ACAA)",
    "sa.legal.usCopy": "In accordance with 14 CFR Part 382, air carriers may not discriminate against passengers on the basis of disability. SKANDI Travels is committed to these standards. For flights arriving or departing from the United States, a Complaint Resolution Official (CRO) is available at the airport to handle any disability-related concerns."
  },
  "SV": {
    "sa.hero.kicker": "SKANDI TILLGÄNGLIGHET",
    "sa.hero.title": "Särskild Assistans",
    "sa.hero.copy": "Vi är engagerade i att göra resandet tillgängligt för alla. Oavsett om du behöver mobilitetsassistans, reser med en ledarhund eller har medicinsk utrustning med dig, är vi här för att stödja din resa.",
    "sa.services.title": "Hur vi kan hjälpa",
    "sa.services.copy": "Läs igenom kategorierna nedan för att förstå vilken assistans som finns tillgänglig och hur du bokar den för din kommande resa.",
    "sa.alert.title": "48-timmarsregeln",
    "sa.alert.desc": "För att säkerställa att vi kan tillgodose dina behov måste du boka assistans senast 48 timmar före planerad avgång. Om du meddelar oss senare kommer vi att göra allt vi rimligen kan, men de begärda tjänsterna kan inte garanteras.",
    "sa.card1.title": "Rullstol & Mobilitet",
    "sa.card1.desc": "Assistans finns tillgänglig för att ta sig runt på flygplatsen, ombordstigning och förflyttning till din plats. Om du reser med egen manuell eller elektrisk rullstol måste du ange dess mått, vikt och batterityp (litiumjon eller torrcell) vid bokningen.",
    "sa.card2.title": "Medicinsk Utrustning & Syrgas",
    "sa.card2.desc": "Du får ta med nödvändig medicinsk utrustning (som CPAP) gratis utöver ditt handbagage. Behöver du medicinsk syrgas under flygningen måste detta förbokas. Användning av personlig syrgaskoncentrator (POC) kräver medicinskt förhandsgodkännande.",
    "sa.card3.title": "Assistanshundar (SVAN)",
    "sa.card3.desc": "Fullt utbildade assistanshundar reser gratis i kabinen. Observera: Enligt uppdaterade internationella regler erkänns inte Emotional Support Animals (ESA) som assistanshundar och måste resa som vanliga husdjur. För flyg till/från USA krävs särskilda DOT-formulär.",
    "sa.card4.title": "Dolda Funktionsnedsättningar",
    "sa.card4.desc": "Vi stödjer Solrosbandet (Sunflower Lanyard). Om du eller någon du reser med har en dold funktionsnedsättning (t.ex. autism, demens eller svår ångest) signalerar bandet diskret till vår personal att ni kan behöva mer tid, förståelse eller hjälp.",
    "sa.action.title": "Redo att boka assistans?",
    "sa.action.desc": "Det snabbaste sättet att ordna assistans är att lägga till det direkt i din bokning via Min Profil, eller genom att kontakta vår dedikerade kundtjänst för särskild assistans.",
    "sa.action.btn": "Hantera min bokning",
    "sa.faq.title": "Vanliga Frågor",
    "sa.faq.q1": "Kostar det något att boka särskild assistans?",
    "sa.faq.a1": "Nej. Alla särskilda assistanstjänster, inklusive rullstolshjälp på flygplatsen, resa med godkänd assistanshund och transport av livsviktig medicinsk utrustning, erbjuds helt utan extra kostnad.",
    "sa.faq.q2": "Kan jag sitta vid en nödutgång om jag har bokat assistans?",
    "sa.faq.a2": "Av säkerhetsskäl fastställda av flygmyndigheter (FAA/EASA) är passagerare med nedsatt rörlighet, syn/hörselnedsättning, eller de som reser med assistanshund eller spädbarn strängt förbjudna att sitta vid nödutgångar.",
    "sa.faq.q3": "Får jag ta med min medicin i handbagaget?",
    "sa.faq.a3": "Ja, du bör alltid packa livsviktig medicin i ditt handbagage. Flytande medicin över 100 ml är tillåten men måste åtföljas av ett läkarintyg eller apoteksetikett som tydligt visar ditt namn.",
    "sa.legal.title": "Regelverk & Rättigheter",
    "sa.legal.euTitle": "Regler inom EU / EES & UK",
    "sa.legal.euCopy": "I enlighet med förordning (EG) nr 1107/2006 har personer med funktionshinder och nedsatt rörlighet rätt att resa med flyg utan diskriminering. Assistans på flygplatser och ombord måste tillhandahållas kostnadsfritt, förutsatt att flygbolaget meddelas minst 48 timmar före den angivna avgångstiden.",
    "sa.legal.usTitle": "US Air Carrier Access Act (ACAA)",
    "sa.legal.usCopy": "I enlighet med 14 CFR Part 382 får flygbolag inte diskriminera passagerare på grund av funktionshinder. SKANDI Travels åtar sig att följa dessa standarder. För flygningar till eller från USA finns ett klagomålsombud (Complaint Resolution Official, CRO) tillgängligt på flygplatsen för att hantera frågor relaterade till funktionshinder."
  }
};

let SKANDI_USER_SETTINGS = { language: "EN" };

function skandiTranslate(key, fallback="") {
  const language = SKANDI_USER_SETTINGS?.language || "EN";
  return I18N[language]?.[key] || I18N.EN?.[key] || fallback || key;
}

function applyTranslations() {
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.getAttribute("data-i18n");
    const value = skandiTranslate(key, element.textContent || "");
    if (value) element.innerHTML = value;
  });
}

function initializeSettings() {
  try {
    const stored = JSON.parse(localStorage.getItem("skandi_user_settings"));
    if (stored && stored.language) {
      SKANDI_USER_SETTINGS.language = stored.language;
    }
  } catch (e) {}
  
  applyTranslations();
}

initializeSettings();

</script>
</body>
</html>
```
