# How can we help?

## INFO / LOG

- **Current status:** `B-011.1 — STATICALLY VERIFIED / LIVE WIX TEST REQUIRED`
- **System:** SKANDI customer website
- **Route:** `/about/support`
- **Wix page:** `How can we help_.k0iqp`
- **Primary HTML component:** `#skandiHelpCenterEmbed`
- **Support chat HTML component:** `#skandiSupportChatEmbed`
- **Primary child source:** `SKANDI_SUPPORT_PUBLIC`
- **Chat child source:** `SKANDI_SUPPORT_CHAT`
- **Parent source:** `SKANDI_WIX_PARENT`
- **Linked page controller:** `/src/pages/How can we help_.k0iqp.js`
- **Canonical backend facade:** `/src/backend/SKANDI_CORE/customerSupport.web.js`
- **Canonical backend core:** `/src/backend/SKANDI_CORE/customerSupport.js`
- **Persistent support authority:** Supabase `customer_support_cases`, `customer_support_messages`, `alexandra_chat_sessions`, `agent_users`
- **Support workflow/article configuration:** existing Wix collections `SupportCategories`, `SupportHelpArticles`, `SupportInboxRouting`
- **Live support provider:** LiveKit / LiveKit Agents
- **Global customer chrome:** `masterPage.js`; this embed does not own the site header/footer.
- **Last verified:** `2026-09-24`

### Canonical runtime chain

`#skandiHelpCenterEmbed`
→ `postMessage`
→ `/src/pages/How can we help_.k0iqp.js`
→ `backend/SKANDI_CORE/customerSupport.web`
→ `backend/SKANDI_CORE/customerSupport`
→ Supabase support case/message persistence + existing Support configuration collections + LiveKit

The separate `#skandiSupportChatEmbed` continues to use the same page controller/backend authority for Alexandra and human handoff.

### B-011.1 convergence

- Restyled the supplied Help Center into the exact shared customer B-011 palette used by Home and global chrome.
- Kept the page visually distinct from Home while using the same navy/cyan/pale/ivory design system, restrained shadows and 18px-class radii.
- Preserved all existing public support form fields and message contracts.
- Replaced hard-coded category/topic ownership with `PUBLIC_SUPPORT_BOOTSTRAP.workflows`, which already comes from the canonical `customerSupport` core.
- Kept complete local workflow fallbacks so the form remains usable if bootstrap content is temporarily unavailable.
- Connected Popular Help Topics and hero search to `PUBLIC_SUPPORT_BOOTSTRAP.articles`, which are already sourced from the existing `SupportHelpArticles` configuration collection.
- Added workflow-based category/topic prefill support from the current page controller query contract.
- Preserved member-profile prefill and read-only linking behavior.
- Preserved Alexandra launch, signed-in human handoff, My Support Cases navigation and SKANDI Club login.
- Corrected stale `Signature Club` wording to `SKANDI Club`.
- Added a functional Help Center search UI and category fallback search without adding a second backend.
- Added file drag/drop UI validation for the existing filename-only support payload contract; no new upload backend was invented.
- Added stable future Presentation Registry hooks (`data-content-id`, `data-section-id`) only for static page presentation. Dynamic workflows/articles remain Support-owned.
- Privacy Policy navigation now uses the page bridge rather than navigating the HTML iframe.
- No new backend, Supabase schema, RPC, table, provider or parallel support architecture was introduced.

### Existing controller/backend verification

The current repository already has the correct canonical bridge and backend ownership:
- `/src/pages/How can we help_.k0iqp.js`
- `/src/backend/SKANDI_CORE/customerSupport.web.js`
- `/src/backend/SKANDI_CORE/customerSupport.js`

No replacement of those files is required for this B-011.1 HTML/UI convergence.

### Important message contracts

HTML → page:
- `PUBLIC_SUPPORT_READY`
- `PUBLIC_SUPPORT_REQUEST_BOOTSTRAP`
- `PUBLIC_SUPPORT_LOGIN`
- `PUBLIC_SUPPORT_CREATE_CASE`
- `PUBLIC_SUPPORT_OPEN_ALEXANDRA`
- `PUBLIC_SUPPORT_REQUEST_HUMAN`
- `PUBLIC_SUPPORT_OPEN_FORM`
- `PUBLIC_SUPPORT_NAVIGATE`

Page → HTML:
- `PUBLIC_SUPPORT_BOOTSTRAP`
- `PUBLIC_SUPPORT_CASE_CREATED`
- `PUBLIC_SUPPORT_ERROR`

### File-attachment scope

The supplied implementation sends `attachedFileNames` only. B-011.1 keeps that contract and improves client-side selection/validation only. It does **not** claim that file bytes are uploaded or stored. A real attachment pipeline would require an explicit backend/storage contract and is outside this style/sync package.

---

## COMPLETE INTENDED LIVE HTML SOURCE

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#022e64">
<title>SKANDI Help Center · B-011.1</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
:root{
  /* Exact shared SKANDI customer B-011 palette */
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

  /* Premium global chrome support palette */
  --sk-ink:#03111f;
  --sk-ink-soft:#061a30;
  --sk-aqua-soft:#9de0e5;
  --sk-ivory:#fbfaf6;
  --sk-porcelain:#f5f1ea;
  --sk-champagne:#d1bc98;

  --sk-warning:#8a5a00;
  --sk-warning-bg:#fffaf0;
  --sk-white:#fff;
  --sk-shadow:0 8px 26px rgba(0,0,0,.08);
  --sk-shadow-strong:0 14px 34px rgba(0,0,0,.12);
  --sk-radius:18px;
  --sk-max:1180px;
}

*{box-sizing:border-box;margin:0;padding:0}
html,body{
  width:100%;
  min-height:100%;
  font-family:"Montserrat",system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
  background:#fff;
  color:var(--sk-text);
  overflow-x:hidden;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
button,input,select,textarea{font:inherit}
button{cursor:pointer}
button,input,select,textarea,a{outline:none}
a{color:var(--sk-blue2);text-decoration:none}
a:hover{text-decoration:none}
button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible,a:focus-visible{
  outline:3px solid rgba(95,199,207,.42);
  outline-offset:3px;
}
.hidden{display:none!important}

/* =========================================================
   HERO — Home-aligned B-011, page-specific composition
   ========================================================= */
.hero{
  position:relative;
  overflow:hidden;
  padding:62px 24px 42px;
  border-bottom:1px solid var(--sk-border);
  background:
    radial-gradient(circle at 88% 8%,rgba(95,199,207,.13),transparent 25%),
    linear-gradient(180deg,#fff 0%,var(--sk-pale) 100%);
}
.hero::after{
  content:"";
  position:absolute;
  left:0;
  right:0;
  bottom:0;
  height:1px;
  background:linear-gradient(90deg,transparent,var(--sk-cyan),var(--sk-champagne),transparent);
  opacity:.5;
}
.hero-inner{
  position:relative;
  z-index:1;
  width:min(100%,var(--sk-max));
  margin:0 auto;
  display:grid;
  grid-template-columns:minmax(0,1fr) minmax(380px,.82fr);
  gap:46px;
  align-items:end;
}
.eyebrow{
  display:flex;
  align-items:center;
  gap:9px;
  color:var(--sk-cyan);
  font-size:9px;
  line-height:1.2;
  font-weight:900;
  letter-spacing:.17em;
  text-transform:uppercase;
}
.eyebrow::before{
  content:"";
  width:26px;
  height:2px;
  flex:0 0 26px;
  border-radius:999px;
  background:var(--sk-cyan);
}
.hero h1{
  margin:8px 0 0;
  color:var(--sk-blue);
  font-size:clamp(38px,5.4vw,58px);
  line-height:.98;
  letter-spacing:-.05em;
  font-weight:750;
}
.hero p{
  max-width:650px;
  margin:14px 0 0;
  color:var(--sk-body);
  font-size:13px;
  line-height:1.72;
}
.search-shell{
  padding:8px;
  display:grid;
  grid-template-columns:minmax(0,1fr) auto;
  gap:8px;
  border:1px solid var(--sk-border);
  border-radius:15px;
  background:#fff;
  box-shadow:0 8px 24px rgba(2,46,100,.06);
}
.search-input{
  min-width:0;
  height:46px;
  border:0;
  border-radius:10px;
  padding:0 13px;
  background:var(--sk-bg);
  color:var(--sk-text);
  font-size:11px;
  font-weight:600;
}
.search-btn{
  min-width:92px;
  height:46px;
  border:0;
  border-radius:10px;
  padding:0 18px;
  background:linear-gradient(135deg,var(--sk-blue),var(--sk-blue-soft));
  color:#fff;
  font-size:10px;
  font-weight:850;
  letter-spacing:.04em;
}
.search-results{
  width:min(100%,var(--sk-max));
  margin:14px auto 0;
  padding:0 24px;
}
.search-results-card{
  overflow:hidden;
  border:1px solid var(--sk-border);
  border-radius:15px;
  background:#fff;
  box-shadow:var(--sk-shadow);
}
.search-result{
  width:100%;
  display:block;
  padding:14px 16px;
  border:0;
  border-bottom:1px solid var(--sk-border-soft);
  background:#fff;
  text-align:left;
  color:var(--sk-text);
}
.search-result:last-child{border-bottom:0}
.search-result:hover{background:var(--sk-pale)}
.search-result strong{
  display:block;
  color:var(--sk-blue);
  font-size:11px;
  line-height:1.35;
}
.search-result span{
  display:block;
  margin-top:4px;
  color:var(--sk-muted);
  font-size:9px;
  line-height:1.55;
}

/* =========================================================
   PAGE LAYOUT
   ========================================================= */
.page{
  width:min(100%,var(--sk-max));
  margin:0 auto;
  padding:52px 24px 80px;
  display:grid;
  grid-template-columns:315px minmax(0,1fr);
  gap:28px;
  align-items:start;
}
.sidebar{
  position:sticky;
  top:18px;
  display:grid;
  gap:14px;
}
.card{
  border:1px solid var(--sk-border);
  border-radius:var(--sk-radius);
  background:#fff;
  box-shadow:0 5px 18px rgba(2,46,100,.05);
}
.sidebar-card{padding:20px}
.sidebar-card h3{
  margin:0 0 13px;
  color:var(--sk-blue);
  font-size:15px;
  line-height:1.25;
  letter-spacing:-.02em;
}
.sidebar-copy{
  margin:0 0 13px;
  color:var(--sk-body);
  font-size:9px;
  line-height:1.6;
}

/* Dynamic help topics */
.faq-list{
  list-style:none;
  display:grid;
  gap:6px;
}
.faq-link{
  width:100%;
  border:1px solid transparent;
  border-radius:10px;
  padding:10px 11px;
  background:var(--sk-bg);
  text-align:left;
  color:var(--sk-text);
  font-size:10px;
  line-height:1.45;
  font-weight:650;
  transition:background .18s ease,border-color .18s ease,color .18s ease,transform .18s ease;
}
.faq-link:hover{
  transform:translateY(-1px);
  border-color:rgba(95,199,207,.42);
  background:var(--sk-pale);
  color:var(--sk-blue);
}

/* Contact/support channel actions */
.channel-stack{display:grid;gap:8px}
.channel-btn{
  width:100%;
  min-height:44px;
  padding:10px 12px;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:10px;
  border:1px solid var(--sk-border);
  border-radius:11px;
  background:#fff;
  color:var(--sk-blue);
  text-align:left;
  font-size:10px;
  line-height:1.35;
  font-weight:800;
  transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease,background .18s ease;
}
.channel-btn::after{
  content:"→";
  flex:0 0 auto;
  color:var(--sk-cyan);
}
.channel-btn:hover{
  transform:translateY(-1px);
  border-color:rgba(95,199,207,.45);
  box-shadow:0 7px 18px rgba(2,46,100,.07);
}
.channel-btn.primary{
  border-color:transparent;
  background:linear-gradient(135deg,var(--sk-blue),var(--sk-blue-soft));
  color:#fff;
}
.channel-btn.primary::after{color:var(--sk-aqua-soft)}
.channel-btn.soft{background:var(--sk-pale)}
.channel-hint{
  margin-top:9px;
  color:var(--sk-muted);
  font-size:8px;
  line-height:1.55;
}

/* Club panel */
.club-card{
  position:relative;
  overflow:hidden;
  padding:21px;
  border:0;
  background:
    radial-gradient(circle at 100% 0%,rgba(95,199,207,.18),transparent 35%),
    linear-gradient(135deg,var(--sk-ink),var(--sk-blue));
  color:#fff;
}
.club-card::after{
  content:"";
  position:absolute;
  left:20px;
  right:20px;
  bottom:0;
  height:2px;
  background:linear-gradient(90deg,var(--sk-cyan),var(--sk-champagne));
  opacity:.85;
}
.club-card h3{color:#fff}
.club-card p{
  margin:0 0 14px;
  color:rgba(255,255,255,.76);
  font-size:9px;
  line-height:1.65;
}
.club-card .channel-btn{
  border-color:var(--sk-ivory);
  background:var(--sk-ivory);
  color:var(--sk-blue);
}
.club-card .channel-btn::after{color:var(--sk-blue)}

/* =========================================================
   FORM
   ========================================================= */
.form-card{
  padding:30px;
  border:1px solid var(--sk-border);
  border-radius:20px;
  background:#fff;
  box-shadow:var(--sk-shadow);
}
.form-intro{
  display:grid;
  grid-template-columns:minmax(0,1fr) auto;
  gap:22px;
  align-items:end;
  margin-bottom:22px;
  padding-bottom:20px;
  border-bottom:1px solid var(--sk-border-soft);
}
.form-intro h2{
  margin:6px 0 0;
  color:var(--sk-blue);
  font-size:clamp(25px,3vw,34px);
  line-height:1.07;
  letter-spacing:-.035em;
}
.form-intro p{
  max-width:580px;
  margin:7px 0 0;
  color:var(--sk-body);
  font-size:10px;
  line-height:1.6;
}
.queue-pill{
  min-width:160px;
  padding:10px 12px;
  border:1px solid #ead9ac;
  border-radius:11px;
  background:var(--sk-warning-bg);
  color:var(--sk-warning);
  text-align:center;
}
.queue-pill strong{
  display:block;
  color:var(--sk-warning);
  font-size:11px;
}
.queue-pill span{
  display:block;
  margin-top:2px;
  font-size:8px;
  font-weight:700;
}

.status{
  display:none;
  margin-bottom:14px;
  padding:12px 14px;
  border:1px solid var(--sk-border);
  border-radius:11px;
  background:var(--sk-bg);
  color:var(--sk-body);
  font-size:9px;
  line-height:1.55;
}
.status.show{display:block}
.status.ok{
  border-color:#abefc6;
  background:#ecfdf3;
  color:var(--sk-ok);
}
.status.error{
  border-color:#ffd5d2;
  background:#fff1f0;
  color:#b42318;
}

.form-section{
  margin-top:28px;
  padding-top:26px;
  border-top:1px solid var(--sk-border-soft);
}
.form-section:first-of-type{
  margin-top:0;
  padding-top:0;
  border-top:0;
}
.form-section-head{
  display:flex;
  align-items:center;
  gap:11px;
  margin-bottom:17px;
}
.step{
  width:28px;
  height:28px;
  flex:0 0 28px;
  display:grid;
  place-items:center;
  border-radius:9px;
  background:var(--sk-pale);
  color:var(--sk-blue);
  font-size:9px;
  font-weight:900;
}
.form-section-head h3{
  color:var(--sk-blue);
  font-size:14px;
  line-height:1.2;
}
.section-note{
  margin:-8px 0 16px 39px;
  color:var(--sk-muted);
  font-size:9px;
  line-height:1.55;
}

.grid-2{
  display:grid;
  grid-template-columns:repeat(2,minmax(0,1fr));
  gap:14px;
}
.field{margin-bottom:14px}
.field label{
  display:block;
  margin-bottom:6px;
  color:var(--sk-muted);
  font-size:8px;
  line-height:1.3;
  font-weight:850;
  letter-spacing:.09em;
  text-transform:uppercase;
}
.field input,
.field select,
.field textarea{
  width:100%;
  min-height:44px;
  border:1px solid var(--sk-border);
  border-radius:10px;
  padding:11px 12px;
  background:var(--sk-bg);
  color:var(--sk-text);
  font-size:10px;
  transition:border-color .18s ease,box-shadow .18s ease,background .18s ease;
}
.field textarea{min-height:140px;resize:vertical;line-height:1.55}
.field input:focus,
.field select:focus,
.field textarea:focus{
  border-color:var(--sk-cyan);
  background:#fff;
  box-shadow:0 0 0 3px rgba(95,199,207,.11);
}
.field input[readonly]{
  background:#f1f4f7;
  color:#667085;
}
.required{color:var(--sk-danger)}

.detail-module{
  display:none;
  margin:3px 0 16px;
  padding:18px;
  border:1px solid var(--sk-border);
  border-radius:13px;
  background:var(--sk-pale);
}
.detail-module.active{display:block}
.detail-module.flight{
  border-left:3px solid var(--sk-cyan);
}
.detail-module.baggage{
  border-left:3px solid var(--sk-blue-soft);
}
.module-title{
  margin:0 0 14px;
  color:var(--sk-blue);
  font-size:10px;
  font-weight:900;
  letter-spacing:.07em;
  text-transform:uppercase;
}

/* File area */
.file-drop{
  position:relative;
  padding:26px 18px;
  border:1px dashed #bfc9d6;
  border-radius:12px;
  background:var(--sk-bg);
  text-align:center;
  transition:border-color .18s ease,background .18s ease,box-shadow .18s ease;
}
.file-drop.dragover{
  border-color:var(--sk-cyan);
  background:var(--sk-pale);
  box-shadow:0 0 0 3px rgba(95,199,207,.10);
}
.file-drop button{
  border:0;
  background:transparent;
  color:var(--sk-blue);
  font-size:10px;
  font-weight:850;
}
.file-drop p{
  margin-top:6px;
  color:var(--sk-muted);
  font-size:9px;
  line-height:1.55;
}
.file-summary{
  display:block;
  margin-top:7px;
  color:var(--sk-muted);
  font-size:8px;
  line-height:1.5;
}

.checkbox-row{
  display:flex;
  align-items:flex-start;
  gap:10px;
  margin-top:13px;
}
.checkbox-row input{
  width:17px;
  height:17px;
  flex:0 0 17px;
  margin-top:1px;
  accent-color:var(--sk-blue);
}
.checkbox-row label{
  color:var(--sk-muted);
  font-size:9px;
  line-height:1.55;
}

.btn-submit{
  width:100%;
  min-height:48px;
  margin-top:22px;
  border:0;
  border-radius:11px;
  background:linear-gradient(135deg,var(--sk-blue),var(--sk-blue-soft));
  color:#fff;
  font-size:10px;
  font-weight:900;
  letter-spacing:.07em;
  text-transform:uppercase;
  box-shadow:0 7px 20px rgba(2,46,100,.17);
  transition:transform .18s ease,box-shadow .18s ease,opacity .18s ease;
}
.btn-submit:hover{
  transform:translateY(-1px);
  box-shadow:0 11px 26px rgba(2,46,100,.23);
}
.btn-submit:disabled{
  opacity:.55;
  cursor:not-allowed;
  transform:none;
  box-shadow:none;
}

@media(max-width:940px){
  .hero-inner{grid-template-columns:1fr;gap:22px}
  .page{grid-template-columns:1fr}
  .sidebar{position:static;grid-template-columns:repeat(2,minmax(0,1fr))}
  .sidebar-card:first-child{grid-column:1/-1}
}
@media(max-width:680px){
  .hero{padding:45px 16px 30px}
  .hero h1{font-size:40px}
  .hero p{font-size:12px}
  .search-shell{grid-template-columns:1fr}
  .search-btn{width:100%}
  .search-results{padding:0 16px}
  .page{padding:36px 16px 62px}
  .sidebar{grid-template-columns:1fr}
  .sidebar-card:first-child{grid-column:auto}
  .form-card{padding:21px 16px;border-radius:17px}
  .form-intro{grid-template-columns:1fr}
  .queue-pill{text-align:left}
  .grid-2{grid-template-columns:1fr;gap:0}
  .section-note{margin-left:0}
}
@media(prefers-reduced-motion:reduce){
  *,*::before,*::after{
    animation:none!important;
    transition-duration:.01ms!important;
    scroll-behavior:auto!important;
  }
}
</style>
</head>
<body>
<header class="hero" data-section-id="support-hero">
  <div class="hero-inner">
    <div>
      <div class="eyebrow" data-content-id="support-hero-eyebrow">SKANDI HELP CENTER</div>
      <h1 data-content-id="support-hero-h1">How can we help?</h1>
      <p data-content-id="support-hero-copy">
        Search SKANDI help articles or send a detailed request to Customer Service. Booking-related enquiries can be linked to an existing SKANDI booking.
      </p>
    </div>

    <div>
      <div class="search-shell" role="search">
        <input id="helpSearch" type="search" class="search-input" placeholder="Search booking, payment, baggage, refunds…" aria-label="Search SKANDI Help Center">
        <button id="helpSearchBtn" class="search-btn" type="button">Search</button>
      </div>
    </div>
  </div>

  <div id="helpSearchResults" class="search-results hidden" aria-live="polite"></div>
</header>

<main class="page">
  <aside class="sidebar" aria-label="Support shortcuts">
    <section class="card sidebar-card" data-section-id="support-popular-topics">
      <div class="eyebrow" style="margin-bottom:9px" data-content-id="support-popular-eyebrow">QUICK HELP</div>
      <h3 data-content-id="support-popular-h3">Popular Help Topics</h3>
      <p class="sidebar-copy" data-content-id="support-popular-copy">
        Helpful articles and common support topics are loaded from SKANDI Support.
      </p>
      <ul id="faqList" class="faq-list"></ul>
    </section>

    <section class="card sidebar-card" id="supportChannelsCard" data-section-id="support-channels">
      <div class="eyebrow" style="margin-bottom:9px" data-content-id="support-channels-eyebrow">CONTACT SKANDI</div>
      <h3 data-content-id="support-channels-h3">Choose how to get help</h3>
      <div class="channel-stack">
        <button id="alexandraChatBtn" class="channel-btn primary" type="button">Chat with Alexandra</button>
        <button id="humanSupportBtn" class="channel-btn soft" type="button">Chat with a Human SKANDI Customer Service Agent</button>
        <button id="mySupportCasesBtn" class="channel-btn" type="button">My Support Cases</button>
      </div>
      <p id="humanSupportHint" class="channel-hint">Sign in to use live human chat.</p>
    </section>

    <section class="card club-card" data-section-id="support-club">
      <div class="eyebrow" style="color:var(--sk-aqua-soft);margin-bottom:9px" data-content-id="support-club-eyebrow">SKANDI CLUB</div>
      <h3 data-content-id="support-club-h3">Member support</h3>
      <p data-content-id="support-club-copy">
        Club Members receive priority routing, dedicated Alexandra assistant access, and faster resolution times.
      </p>
      <button id="clubLoginBtn" class="channel-btn" type="button">Log In to SKANDI Club</button>
    </section>
  </aside>

  <section class="form-card" data-section-id="support-form">
    <div class="form-intro">
      <div>
        <div class="eyebrow" data-content-id="support-form-eyebrow">CUSTOMER SERVICE</div>
        <h2 data-content-id="support-form-h2">Send a support request</h2>
        <p data-content-id="support-form-copy">
          Provide the details below so the request can be routed to the correct SKANDI support workflow.
        </p>
      </div>
      <div class="queue-pill">
        <strong>Standard queue</strong>
        <span>Expected initial response: 48–72 hours</span>
      </div>
    </div>

    <div id="status" class="status"></div>
    <div id="memberLinkedNotice" class="status ok" style="display:none"></div>

    <form id="publicSupportForm">
      <section class="form-section">
        <div class="form-section-head">
          <div class="step">1</div>
          <h3>Traveler Information</h3>
        </div>

        <div class="grid-2">
          <div class="field">
            <label for="firstName">First Name <span class="required">*</span></label>
            <input id="firstName" type="text" required autocomplete="given-name" placeholder="Legal first name">
          </div>
          <div class="field">
            <label for="lastName">Last Name <span class="required">*</span></label>
            <input id="lastName" type="text" required autocomplete="family-name" placeholder="Legal last name">
          </div>
        </div>

        <div class="grid-2">
          <div class="field">
            <label for="email">Email Address <span class="required">*</span></label>
            <input id="email" type="email" required autocomplete="email" placeholder="name@example.com">
          </div>
          <div class="field">
            <label for="phone">Phone Number <span class="required">*</span></label>
            <div style="display:grid;grid-template-columns:90px minmax(0,1fr);gap:8px">
              <select id="phonePrefix" aria-label="Phone prefix">
                <option>+1</option><option>+44</option><option>+46</option><option>+47</option><option>+45</option>
              </select>
              <input id="phone" type="tel" required autocomplete="tel" placeholder="Phone number">
            </div>
          </div>
        </div>

        <div class="grid-2">
          <div class="field">
            <label for="nationality">Nationality</label>
            <input id="nationality" type="text" autocomplete="country-name" placeholder="e.g. Swedish">
          </div>
          <div class="field">
            <label for="countryOfResidence">Country of Residence <span class="required">*</span></label>
            <input id="countryOfResidence" type="text" required placeholder="Where do you currently live?">
          </div>
        </div>
      </section>

      <section class="form-section">
        <div class="form-section-head">
          <div class="step">2</div>
          <h3>Trip Details</h3>
        </div>

        <div class="field">
          <label for="hasBooking">Does this request relate to an existing booking? <span class="required">*</span></label>
          <select id="hasBooking" required>
            <option value="">Select an option</option>
            <option value="yes">Yes, I have a booking</option>
            <option value="no">No, general inquiry</option>
          </select>
        </div>

        <div id="bookingFields" class="detail-module">
          <div class="grid-2">
            <div class="field">
              <label for="pnrField">Booking Reference / PNR <span class="required">*</span></label>
              <input id="pnrField" type="text" placeholder="6–8 alphanumeric characters">
            </div>
            <div class="field">
              <label for="supplierField">Operating Airline / Supplier</label>
              <input id="supplierField" type="text" placeholder="e.g. SAS, Lufthansa, Hilton">
            </div>
          </div>
          <div class="grid-2">
            <div class="field">
              <label for="dateField">Date of Travel <span class="required">*</span></label>
              <input id="dateField" type="date">
            </div>
            <div class="field">
              <label for="destDropdown">Destination <span class="required">*</span></label>
              <input id="destDropdown" type="text" placeholder="Destination">
            </div>
          </div>
        </div>
      </section>

      <section class="form-section" id="requestDetailsSection">
        <div class="form-section-head">
          <div class="step">3</div>
          <h3>Request Details</h3>
        </div>
        <p class="section-note">Categories and topics are synchronized from the canonical SKANDI Support workflow.</p>

        <div class="grid-2">
          <div class="field">
            <label for="caseCategory">Category <span class="required">*</span></label>
            <select id="caseCategory" required>
              <option value="">Select Category</option>
            </select>
          </div>
          <div class="field">
            <label for="caseSubCategory">Specific Topic <span class="required">*</span></label>
            <select id="caseSubCategory" required>
              <option value="">Select Category First</option>
            </select>
          </div>
        </div>

        <div id="flightDetailsModule" class="detail-module flight">
          <div class="module-title">Flight itinerary details</div>
          <div class="grid-2">
            <div class="field">
              <label for="flightAirline">Operating Airline <span class="required">*</span></label>
              <input id="flightAirline" type="text" placeholder="Airline">
            </div>
            <div class="field">
              <label for="flightNumber">Flight Number <span class="required">*</span></label>
              <input id="flightNumber" type="text" pattern="^[A-Z0-9]{2}\s?\d{1,4}[A-Za-z]?$" placeholder="e.g. SK 903">
            </div>
          </div>
          <div class="grid-2">
            <div class="field">
              <label for="depAirport">Departure Airport <span class="required">*</span></label>
              <input id="depAirport" type="text" placeholder="Departure airport">
            </div>
            <div class="field">
              <label for="arrAirport">Arrival Airport <span class="required">*</span></label>
              <input id="arrAirport" type="text" placeholder="Arrival airport">
            </div>
          </div>
        </div>

        <div id="baggageDetailsModule" class="detail-module baggage">
          <div class="module-title">Baggage tracing details</div>
          <div class="field">
            <label for="hasPir">Have you already filed a Property Irregularity Report (PIR)? <span class="required">*</span></label>
            <select id="hasPir">
              <option value="">Select an option</option>
              <option value="yes">Yes, I already have a PIR</option>
              <option value="no">No, I do not have a PIR yet</option>
            </select>
          </div>

          <div id="pirGuidance" class="status"></div>

          <div class="grid-2">
            <div class="field" id="pirNumberWrap" style="display:none">
              <label for="pirNumber">PIR Number <span class="required">*</span></label>
              <input id="pirNumber" type="text" placeholder="e.g. ARNFI12345">
            </div>
            <div class="field">
              <label for="bagTag">Baggage Tag Number</label>
              <input id="bagTag" type="text" placeholder="e.g. SK123456">
            </div>
          </div>

          <div class="grid-2">
            <div class="field">
              <label for="bagType">Baggage Type <span class="required">*</span></label>
              <select id="bagType">
                <option value="">Select Type</option>
                <option>Hard Shell Spinner</option>
                <option>Soft Shell Upright</option>
                <option>Duffle Bag</option>
                <option>Backpack</option>
                <option>Box / Odd Size</option>
              </select>
            </div>
            <div class="field">
              <label for="bagColor">Dominant Color <span class="required">*</span></label>
              <select id="bagColor">
                <option value="">Select Color</option>
                <option>Black</option>
                <option>Blue / Navy</option>
                <option>Grey / Silver</option>
                <option>Red / Burgundy</option>
                <option>Other</option>
              </select>
            </div>
          </div>

          <div class="field">
            <label for="bagBrand">Brand & Distinguishing Features <span class="required">*</span></label>
            <input id="bagBrand" type="text" placeholder="e.g. Samsonite, red ribbon on handle">
          </div>
          <div class="field">
            <label for="bagAddress">Temporary Delivery Address</label>
            <textarea id="bagAddress" placeholder="Full delivery address."></textarea>
          </div>
        </div>

        <div class="field">
          <label for="caseSubject">Subject Line <span class="required">*</span></label>
          <input id="caseSubject" type="text" required placeholder="Briefly summarize your request">
        </div>
        <div class="field">
          <label for="caseDescription">Detailed Description <span class="required">*</span></label>
          <textarea id="caseDescription" required placeholder="Please provide a thorough explanation."></textarea>
        </div>
      </section>

      <section class="form-section">
        <div class="form-section-head">
          <div class="step">4</div>
          <h3>Supporting Documents</h3>
        </div>
        <p class="section-note">Providing receipts, PIR reports or screenshots can help Customer Service understand the request.</p>

        <div id="fileDrop" class="file-drop">
          <button id="fileBrowseBtn" type="button">Choose supporting files</button>
          <p>PDF, JPG or PNG. Maximum 3 files and 10 MB total.</p>
          <span id="fileSummary" class="file-summary">No files selected.</span>
          <input type="file" id="fileInput" class="hidden" multiple accept=".pdf,.jpg,.png,.jpeg">
        </div>

        <div class="checkbox-row">
          <input type="checkbox" required id="consentPrivacy">
          <label for="consentPrivacy">
            I confirm that the information provided is accurate, and I consent to the processing of my personal data in accordance with SKANDI's
            <a href="/legal/privacy-policy" data-support-nav="/legal/privacy-policy">Privacy Policy</a>.
            <span class="required">*</span>
          </label>
        </div>
        <div class="checkbox-row">
          <input type="checkbox" required id="consentSla">
          <label for="consentSla">
            I acknowledge that standard support requests may take up to 72 hours for an initial response.
            <span class="required">*</span>
          </label>
        </div>

        <button id="submitBtn" type="submit" class="btn-submit">Submit Request</button>
      </section>
    </form>
  </section>
</main>

<script>
(()=>{
"use strict";

const SOURCE="SKANDI_SUPPORT_PUBLIC";
const PARENT="SKANDI_WIX_PARENT";
const PARENT_ORIGIN=(()=>{
  try{return document.referrer?new URL(document.referrer).origin:"*"}
  catch(_){return"*"}
})();

const FALLBACK_WORKFLOWS=[
  {key:"general",title:"General Support",summary:"General questions that do not fit another category.",topics:[
    {key:"general-question",title:"General Question"},{key:"feedback",title:"Feedback"},{key:"other",title:"Other"}
  ],requiredFields:["subject","message"]},
  {key:"booking",title:"Booking Help",summary:"Existing SKANDI bookings, changes and booking questions.",topics:[
    {key:"manage-booking",title:"Manage My Booking"},{key:"booking-document",title:"Booking Document"},{key:"booking-other",title:"Other Booking Question"}
  ],requiredFields:["subject","message"]},
  {key:"flight",title:"Flights",summary:"Flight changes, disruptions, connections and airline issues.",topics:[
    {key:"schedule-change",title:"Schedule Change / Cancellation"},{key:"name-correction",title:"Name Correction"},{key:"missed-connection",title:"Missed Connection"},{key:"upgrade-inquiry",title:"Upgrade Inquiry"}
  ],requiredFields:["flightAirline","flightNumber","depAirport","arrAirport","subject","message"]},
  {key:"baggage",title:"Baggage",summary:"Delayed, damaged or missing baggage and property.",topics:[
    {key:"delayed-baggage",title:"Delayed Baggage"},{key:"damaged-baggage",title:"Damaged Baggage"},{key:"lost-items-on-board",title:"Lost Items on Board"}
  ],requiredFields:["bagType","bagColor","bagBrand","subject","message"]},
  {key:"hotel",title:"Hotel & Destination",summary:"Hotel, room, destination and in-resort support.",topics:[
    {key:"room-modification",title:"Room Modification"},{key:"check-in-issue",title:"Check-in Issue"},{key:"quality-complaint",title:"Quality Complaint"}
  ],requiredFields:["subject","message"]},
  {key:"refund",title:"Refunds & Compensation",summary:"Refund, compensation and duplicate-charge requests.",topics:[
    {key:"flight-delay-compensation",title:"Flight Delay / Compensation"},{key:"cancelled-trip-refund",title:"Cancelled Trip Refund"},{key:"duplicate-charge",title:"Duplicate Charge"}
  ],requiredFields:["subject","message"]},
  {key:"documents",title:"Travel Documents",summary:"Booking confirmations, tickets, vouchers and travel documents.",topics:[
    {key:"missing-document",title:"Missing Travel Document"},{key:"incorrect-document",title:"Incorrect Travel Document"},{key:"document-question",title:"Document Question"}
  ],requiredFields:["subject","message"]},
  {key:"payment",title:"Payment",summary:"Payment, receipts and billing questions.",topics:[
    {key:"payment-failed",title:"Payment Failed"},{key:"receipt-invoice",title:"Receipt / Invoice"},{key:"payment-other",title:"Other Payment Question"}
  ],requiredFields:["subject","message"]},
  {key:"club",title:"SKANDI Club",summary:"Membership, points, tier and account questions.",topics:[
    {key:"points",title:"Points"},{key:"tier",title:"Membership Tier"},{key:"club-account",title:"Club Account"}
  ],requiredFields:["subject","message"]},
  {key:"tech",title:"Technical & Account",summary:"Website, app, account and sign-in issues.",topics:[
    {key:"account-access",title:"Cannot access account"},{key:"booking-error",title:"Error during booking"},{key:"other-website-issue",title:"Other website issue"}
  ],requiredFields:["subject","message"]}
];

const FIELD_MAP={
  subject:"caseSubject",
  message:"caseDescription",
  flightAirline:"flightAirline",
  flightNumber:"flightNumber",
  depAirport:"depAirport",
  arrAirport:"arrAirport",
  bagTag:"bagTag",
  bagType:"bagType",
  bagColor:"bagColor",
  bagBrand:"bagBrand",
  hasPir:"hasPir",
  pirNumber:"pirNumber"
};

let bootstrap={};
let workflows=FALLBACK_WORKFLOWS;
let articles=[];
let supportLoggedIn=false;
let selectedFiles=[];

const $=id=>document.getElementById(id);
const val=id=>($(id)?.value||"").trim();
const esc=value=>String(value??"").replace(/[&<>'"]/g,c=>({
  "&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"
}[c]));

function requestId(){
  if(window.crypto?.randomUUID)return window.crypto.randomUUID();
  return `req-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
}

function post(type,payload={}){
  window.parent.postMessage({
    source:SOURCE,
    type,
    requestId:requestId(),
    payload,
    timestamp:new Date().toISOString()
  },PARENT_ORIGIN);
}

function setStatus(message,mode=""){
  const node=$("status");
  if(!node)return;
  node.textContent=message||"";
  node.className=message?`status show ${mode}`:"status";
}

function setRequired(ids,required){
  ids.forEach(id=>{
    const el=$(id);
    if(!el)return;
    if(required)el.setAttribute("required","true");
    else el.removeAttribute("required");
  });
}

function currentWorkflow(){
  return workflows.find(item=>String(item.key)===val("caseCategory"))||null;
}

function renderWorkflowOptions(){
  const select=$("caseCategory");
  const previous=select.value;
  select.innerHTML='<option value="">Select Category</option>';
  workflows.forEach(item=>{
    const option=document.createElement("option");
    option.value=String(item.key||"");
    option.textContent=String(item.title||item.key||"Support");
    select.appendChild(option);
  });
  if(workflows.some(item=>String(item.key)===previous))select.value=previous;
}

function renderTopicOptions(preferred=""){
  const select=$("caseSubCategory");
  const workflow=currentWorkflow();
  select.innerHTML='<option value="">Select Specific Topic</option>';
  (Array.isArray(workflow?.topics)?workflow.topics:[]).forEach(topic=>{
    const option=document.createElement("option");
    option.value=String(topic.key||topic.value||topic.title||"");
    option.textContent=String(topic.title||topic.label||topic.key||"Topic");
    select.appendChild(option);
  });
  if(preferred && [...select.options].some(o=>o.value===preferred))select.value=preferred;
}

function applyWorkflowRequirements(){
  Object.values(FIELD_MAP).forEach(id=>setRequired([id],false));
  setRequired(["caseSubject","caseDescription"],true);

  const workflow=currentWorkflow();
  const required=Array.isArray(workflow?.requiredFields)?workflow.requiredFields:[];
  required.forEach(field=>{
    const id=FIELD_MAP[field];
    if(id)setRequired([id],true);
  });

  const isFlight=val("caseCategory")==="flight";
  const isBaggage=val("caseCategory")==="baggage";

  $("flightDetailsModule").classList.toggle("active",isFlight);
  $("baggageDetailsModule").classList.toggle("active",isBaggage);

  if(!isFlight)setRequired(["flightAirline","flightNumber","depAirport","arrAirport"],false);
  if(!isBaggage)setRequired(["hasPir","pirNumber","bagTag","bagType","bagColor","bagBrand"],false);

  if(isBaggage){
    setRequired(["hasPir"],true);
    updatePirRequirement();
  }else{
    $("pirNumberWrap").style.display="none";
    $("pirGuidance").className="status";
    $("pirGuidance").textContent="";
  }
}

function toggleBookingFields(){
  const show=val("hasBooking")==="yes";
  $("bookingFields").classList.toggle("active",show);
  setRequired(["pnrField","dateField","destDropdown"],show);
}

function updatePirRequirement(){
  const baggage=val("caseCategory")==="baggage";
  const selection=val("hasPir");
  const show=baggage&&selection==="yes";
  $("pirNumberWrap").style.display=show?"block":"none";
  setRequired(["pirNumber"],show);

  const guidance=$("pirGuidance");
  if(baggage&&selection==="no"){
    const workflow=currentWorkflow();
    const message=
      workflow?.guidance?.noPir ||
      "A SKANDI support case does not replace the formal baggage report/PIR required by the operating airline or airport baggage service. Please report delayed or damaged checked baggage to the operating carrier or baggage service as soon as possible.";
    guidance.textContent=message;
    guidance.className="status show";
  }else{
    guidance.textContent="";
    guidance.className="status";
  }
}

function handleCategoryChange(preferredTopic=""){
  renderTopicOptions(preferredTopic);
  applyWorkflowRequirements();
}

function articlePath(article={}){
  const path=String(article.path||article.url||"").trim();
  return path.startsWith("/")&&!path.startsWith("//")?path:"";
}

function articleHaystack(article={}){
  return[
    article.title,article.summary,article.excerpt,article.category,article.keywords
  ].join(" ").toLowerCase();
}

function openHelpItem(item={}){
  const path=articlePath(item);
  if(path){
    post("PUBLIC_SUPPORT_NAVIGATE",{path});
    return;
  }

  const category=String(item.category||"").trim().toLowerCase();
  if(category&&workflows.some(w=>String(w.key).toLowerCase()===category)){
    $("caseCategory").value=category;
    handleCategoryChange();
  }
  document.getElementById("requestDetailsSection")?.scrollIntoView({behavior:"smooth",block:"start"});
}

function renderPopularTopics(){
  const list=$("faqList");
  const popular=(articles||[]).slice(0,5);

  if(popular.length){
    list.innerHTML=popular.map((item,index)=>`
      <li><button class="faq-link" type="button" data-article-index="${index}">
        ${esc(item.title||"Help article")}
      </button></li>
    `).join("");
    return;
  }

  const fallback=workflows.slice(0,5);
  list.innerHTML=fallback.map(item=>`
    <li><button class="faq-link" type="button" data-workflow-key="${esc(item.key)}">
      ${esc(item.title)}
    </button></li>
  `).join("");
}

function runSearch(){
  const query=val("helpSearch").toLowerCase();
  const wrap=$("helpSearchResults");

  if(!query){
    wrap.classList.add("hidden");
    wrap.innerHTML="";
    return;
  }

  const matches=(articles||[])
    .filter(item=>articleHaystack(item).includes(query))
    .slice(0,8);

  if(!matches.length){
    const workflowMatches=workflows
      .filter(item=>`${item.title} ${item.summary} ${(item.topics||[]).map(t=>t.title).join(" ")}`.toLowerCase().includes(query))
      .slice(0,6);

    wrap.innerHTML=`<div class="search-results-card">${
      workflowMatches.length
        ? workflowMatches.map(item=>`
            <button class="search-result" type="button" data-search-workflow="${esc(item.key)}">
              <strong>${esc(item.title)}</strong>
              <span>${esc(item.summary||"Open the support form with this category selected.")}</span>
            </button>`).join("")
        : `<div class="search-result" style="cursor:default"><strong>No matching help article</strong><span>You can still submit a request below.</span></div>`
    }</div>`;
  }else{
    wrap.innerHTML=`<div class="search-results-card">${
      matches.map((item,index)=>`
        <button class="search-result" type="button" data-search-article="${index}">
          <strong>${esc(item.title||"Help article")}</strong>
          <span>${esc(item.summary||item.excerpt||item.category||"")}</span>
        </button>
      `).join("")
    }</div>`;
    wrap.dataset.searchIds=JSON.stringify(matches.map(item=>articles.indexOf(item)));
  }

  wrap.classList.remove("hidden");
}

function applyProfile(payload={}){
  const profile=payload.profile||null;
  const notice=$("memberLinkedNotice");
  const linked=Boolean(profile&&profile.loggedIn!==false&&(profile.memberId||profile.email));

  if(!linked){
    if(notice)notice.style.display="none";
    ["firstName","lastName","email"].forEach(id=>{
      const field=$(id);
      if(!field)return;
      field.readOnly=false;
      field.removeAttribute("aria-readonly");
      field.title="";
    });
    return;
  }

  const firstName=profile.firstName||profile.first_name||"";
  const lastName=profile.lastName||profile.last_name||"";
  const email=profile.email||"";
  const phone=profile.phone||"";

  if($("firstName"))$("firstName").value=firstName;
  if($("lastName"))$("lastName").value=lastName;
  if($("email"))$("email").value=email;
  if($("phone")&&phone)$("phone").value=phone.replace(/^\+\d+\s*/,"");

  ["firstName","lastName","email"].forEach(id=>{
    const field=$(id);
    if(!field)return;
    field.readOnly=true;
    field.setAttribute("aria-readonly","true");
    field.title="Linked to your signed-in SKANDI profile";
  });

  if(notice){
    notice.textContent=`Signed in as ${[firstName,lastName].filter(Boolean).join(" ")||email}. This request will be linked to your SKANDI profile and appear in SKANDI Support Center.`;
    notice.style.display="block";
  }
}

function updateSupportChannels(payload={}){
  const loggedIn=Boolean(payload.loggedIn||payload.profile?.loggedIn||payload.profile?.memberId);
  supportLoggedIn=loggedIn;
  const human=$("humanSupportBtn");
  const hint=$("humanSupportHint");
  if(human){
    human.dataset.loggedIn=loggedIn?"true":"false";
    human.textContent=loggedIn
      ?"Chat with a Human SKANDI Customer Service Agent"
      :"Sign in for live human chat";
  }
  if(hint){
    const status=String(payload.humanSupport?.status||"");
    hint.textContent=!loggedIn
      ?"Sign in to use live human chat."
      :status==="online"
        ?"Human Customer Service is currently available."
        :"You can still request a human. If no agent is immediately available, your case will remain in the Support queue.";
  }
}

function applyPrefill(prefill={}){
  const category=String(prefill.category||"").trim();
  const topic=String(prefill.subCategory||"").trim();
  if(category&&workflows.some(item=>String(item.key)===category)){
    $("caseCategory").value=category;
    handleCategoryChange(topic);
  }
}

function applyBootstrap(payload={}){
  bootstrap=payload&&typeof payload==="object"?payload:{};

  const supplied=Array.isArray(bootstrap.workflows)?bootstrap.workflows.filter(Boolean):[];
  workflows=supplied.length?supplied:FALLBACK_WORKFLOWS;
  articles=Array.isArray(bootstrap.articles)?bootstrap.articles.filter(Boolean):[];

  renderWorkflowOptions();
  renderPopularTopics();
  applyProfile(bootstrap);
  updateSupportChannels(bootstrap);
  applyPrefill(bootstrap.prefill||{});
}

function selectedFileSummary(){
  if(!selectedFiles.length)return"No files selected.";
  return selectedFiles.map(file=>file.name).join(", ");
}

function validateFiles(files){
  const selected=Array.from(files||[]).slice(0,3);
  const total=selected.reduce((sum,file)=>sum+Number(file.size||0),0);
  const allowed=selected.every(file=>
    ["application/pdf","image/jpeg","image/png"].includes(String(file.type||"").toLowerCase()) ||
    /\.(pdf|jpe?g|png)$/i.test(file.name||"")
  );
  if(!allowed){
    setStatus("Only PDF, JPG and PNG files are accepted.","error");
    return null;
  }
  if(total>10*1024*1024){
    setStatus("Supporting files must be 10 MB or less in total.","error");
    return null;
  }
  if((files||[]).length>3){
    setStatus("Only the first 3 supporting files will be included.","");
  }
  return selected;
}

function updateFiles(files){
  const valid=validateFiles(files);
  if(!valid)return;
  selectedFiles=valid;
  $("fileSummary").textContent=selectedFileSummary();
}

$("hasBooking").addEventListener("change",toggleBookingFields);
$("caseCategory").addEventListener("change",()=>handleCategoryChange());
$("hasPir").addEventListener("change",updatePirRequirement);

$("helpSearchBtn").addEventListener("click",runSearch);
$("helpSearch").addEventListener("keydown",event=>{
  if(event.key==="Enter"){
    event.preventDefault();
    runSearch();
  }
});

$("faqList").addEventListener("click",event=>{
  const articleButton=event.target.closest("[data-article-index]");
  if(articleButton){
    openHelpItem(articles[Number(articleButton.dataset.articleIndex)]||{});
    return;
  }
  const workflowButton=event.target.closest("[data-workflow-key]");
  if(workflowButton){
    $("caseCategory").value=workflowButton.dataset.workflowKey||"";
    handleCategoryChange();
    document.getElementById("requestDetailsSection")?.scrollIntoView({behavior:"smooth",block:"start"});
  }
});

$("helpSearchResults").addEventListener("click",event=>{
  const articleButton=event.target.closest("[data-search-article]");
  if(articleButton){
    let ids=[];
    try{ids=JSON.parse($("helpSearchResults").dataset.searchIds||"[]")}catch(_){}
    const sourceIndex=ids[Number(articleButton.dataset.searchArticle)];
    openHelpItem(articles[sourceIndex]||{});
    return;
  }
  const workflowButton=event.target.closest("[data-search-workflow]");
  if(workflowButton){
    $("caseCategory").value=workflowButton.dataset.searchWorkflow||"";
    handleCategoryChange();
    $("helpSearchResults").classList.add("hidden");
    document.getElementById("requestDetailsSection")?.scrollIntoView({behavior:"smooth",block:"start"});
  }
});

document.querySelectorAll("[data-support-nav]").forEach(link=>{
  link.addEventListener("click",event=>{
    event.preventDefault();
    post("PUBLIC_SUPPORT_NAVIGATE",{path:link.dataset.supportNav||link.getAttribute("href")||""});
  });
});

$("alexandraChatBtn").addEventListener("click",()=>post("PUBLIC_SUPPORT_OPEN_ALEXANDRA",{}));
$("humanSupportBtn").addEventListener("click",()=>{
  if($("humanSupportBtn").dataset.loggedIn!=="true"){
    post("PUBLIC_SUPPORT_LOGIN",{reason:"HUMAN_SUPPORT"});
    return;
  }
  post("PUBLIC_SUPPORT_REQUEST_HUMAN",{
    reason:"Customer requested a Human SKANDI Customer Service Agent from the Help Center."
  });
});
$("mySupportCasesBtn").addEventListener("click",()=>{
  if(!supportLoggedIn){
    post("PUBLIC_SUPPORT_LOGIN",{reason:"MY_SUPPORT_CASES"});
    return;
  }
  post("PUBLIC_SUPPORT_NAVIGATE",{path:"/my-profile/support"});
});
$("clubLoginBtn").addEventListener("click",()=>post("PUBLIC_SUPPORT_LOGIN",{reason:"SKANDI_CLUB_SUPPORT"}));

$("fileBrowseBtn").addEventListener("click",()=>$("fileInput").click());
$("fileInput").addEventListener("change",()=>updateFiles($("fileInput").files));

const drop=$("fileDrop");
["dragenter","dragover"].forEach(type=>drop.addEventListener(type,event=>{
  event.preventDefault();
  drop.classList.add("dragover");
}));
["dragleave","drop"].forEach(type=>drop.addEventListener(type,event=>{
  event.preventDefault();
  drop.classList.remove("dragover");
}));
drop.addEventListener("drop",event=>{
  const files=event.dataTransfer?.files;
  if(files)updateFiles(files);
});

$("publicSupportForm").addEventListener("submit",event=>{
  event.preventDefault();

  if(!$("publicSupportForm").checkValidity()){
    $("publicSupportForm").reportValidity();
    return;
  }

  $("submitBtn").disabled=true;
  setStatus("Submitting your request…");

  const firstName=val("firstName");
  const lastName=val("lastName");

  post("PUBLIC_SUPPORT_CREATE_CASE",{
    firstName,
    lastName,
    fullName:`${firstName} ${lastName}`.trim(),
    email:val("email"),
    phone:`${val("phonePrefix")} ${val("phone")}`.trim(),
    nationality:val("nationality"),
    countryOfResidence:val("countryOfResidence"),
    hasBooking:val("hasBooking"),
    bookingRef:val("pnrField"),
    supplier:val("supplierField"),
    travelDate:val("dateField"),
    destination:val("destDropdown"),
    category:val("caseCategory"),
    subCategory:val("caseSubCategory"),
    subject:val("caseSubject"),
    message:val("caseDescription"),
    flightAirline:val("flightAirline"),
    flightNumber:val("flightNumber"),
    depAirport:val("depAirport"),
    arrAirport:val("arrAirport"),
    hasPir:val("hasPir"),
    pirNumber:val("pirNumber"),
    bagTag:val("bagTag"),
    bagType:val("bagType"),
    bagColor:val("bagColor"),
    bagBrand:val("bagBrand"),
    bagAddress:val("bagAddress"),
    attachedFileNames:selectedFiles.map(file=>file.name),
    source:"public-contact",
    sourcePage:"/about/support"
  });
});

window.addEventListener("message",event=>{
  let msg=event.data;
  if(typeof msg==="string"){
    try{msg=JSON.parse(msg)}catch(_){return}
  }
  if(!msg||typeof msg!=="object")return;
  if(msg.source!==PARENT)return;

  if(msg.type==="PUBLIC_SUPPORT_BOOTSTRAP"){
    applyBootstrap(msg.payload||{});
    return;
  }

  if(msg.type==="PUBLIC_SUPPORT_CASE_CREATED"){
    const ref=msg.payload?.caseRef||msg.payload?.caseId||"";
    setStatus(
      ref
        ?`Your request has been submitted. Reference: ${ref}. SKANDI Support will follow up by email.`
        :"Your request has been submitted. SKANDI Support will follow up by email.",
      "ok"
    );
    $("publicSupportForm").reset();
    selectedFiles=[];
    $("fileSummary").textContent="No files selected.";
    $("submitBtn").disabled=false;
    toggleBookingFields();
    renderWorkflowOptions();
    handleCategoryChange();
    applyProfile(bootstrap);
    return;
  }

  if(msg.type==="PUBLIC_SUPPORT_ERROR"){
    setStatus(msg.payload?.message||"Support request failed.","error");
    $("submitBtn").disabled=false;
  }
});

renderWorkflowOptions();
renderPopularTopics();
toggleBookingFields();
handleCategoryChange();
updatePirRequirement();
post("PUBLIC_SUPPORT_READY",{page:"/about/support"});
})();
</script>
</body>
</html>
```
