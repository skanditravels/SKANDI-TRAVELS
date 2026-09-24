# Legal

## INFO / LOG

- **Current status:** `B-011.1 — STATICALLY VERIFIED / LIVE WIX TEST REQUIRED`
- **System:** SKANDI customer website
- **Route:** `/about/legal`
- **Wix page:** `Legal.nvnld`
- **HTML component:** `#legalHubEmbed`
- **HTML child source:** `SKANDI_LEGAL_HUB`
- **Parent source:** `SKANDI_WIX_PARENT`
- **Linked page controller:** `/src/pages/Legal.nvnld.js`
- **Canonical public facade:** `/src/backend/SKANDI_CORE/legalPolicy.web.js`
- **Canonical backend core:** `/src/backend/SKANDI_CORE/legalPolicy.js`
- **Canonical database transport:** `/src/backend/SKANDI_CORE/supabaseServer.js`
- **Operational data authority:** Supabase `public.legal_policies`
- **Editorial/control owner:** Policy Control (same `legal_policies` records)
- **Public policy detail route:** `/about/legal/policies`
- **Global customer header/footer:** `masterPage.js`; this embed does not own global chrome.
- **Last verified:** `2026-09-24`

### Source-of-truth mismatch found and resolved for this page

The supplied Legal HTML performed a browser-side `fetch()` directly to:

`https://www.skanditravels.com/_functions/legalHub`

while the current `Legal.nvnld.js` page controller only handled embed height.

That does not match the B-011 architecture. The current repository also contains a separate legacy `Policy Documents.bd8ok.js` implementation importing `backend/LEGAL/legalPolicyService.web`, but that legacy backend namespace is absent from the current repository and is marked for domain convergence.

B-011.1 resolves the **public `/about/legal` page** by introducing the proper canonical chain below rather than retaining either browser HTTP-function access or a legacy backend namespace.

### Canonical B-011.1 chain

`#legalHubEmbed`
→ `postMessage`
→ `/src/pages/Legal.nvnld.js`
→ `backend/SKANDI_CORE/legalPolicy.web`
→ `backend/SKANDI_CORE/legalPolicy`
→ `backend/SKANDI_CORE/supabaseServer`
→ Supabase `public.legal_policies`

### Policy visibility rules

Only records matching all of the following are exposed:

- `scope = external`
- `status = Published`
- `active = true`
- `deleted_at IS NULL`

The public payload does not expose policy body HTML, approval identity, revision snapshots, internal review fields or deleted records.

### Live database verification

At build verification time, `public.legal_policies` contained **7** records and `public.legal_policy_revisions` contained **26** records.

The published public set included Accessibility, Cookies, Payment Terms, Privacy Policy, Travel Booking Terms, Website Disclaimer, and a Swedish package-travel consumer-rights document.

No database record was created, edited or deleted by this package.

### B-011.1 presentation changes

- Exact Home/customer B-011 palette:
  - `#022e64` navy
  - `#0b3a7a` secondary navy
  - `#285ca8` soft blue
  - `#d7e6ff` light blue
  - `#f6faff` pale
  - `#f7faff` page background
  - `#dbe3ef` border
  - `#eef2f7` soft border
  - `#111` primary text
  - `#555` body text
  - `#667085` muted text
  - `#5FC7CF` cyan.
- Premium global-chrome support colors retained for continuity with header/footer: ink, ink-soft, aqua-soft, ivory, porcelain and champagne.
- Replaced the older centered gradient banner with the lighter editorial Home-aligned hero.
- Rebuilt frequently requested documents as restrained B-011 cards.
- Rebuilt the complete public-policy library as a pale content rail with compact document rows.
- Search remains client-side over the public-safe payload.
- All internal policy navigation now goes through `LEGAL_NAVIGATE` and the Wix page controller; iframe `_top` navigation was removed.
- Removed direct browser call to `/_functions/legalHub`.
- Added stable Presentation Registry hooks for static Legal headings/sections only.
- Dynamic legal documents remain Policy Control / `legal_policies` owned.

### Important architectural scope

This package converges the **customer-facing Legal Hub**.

The existing repository page `/src/pages/Policy Control.ec9p4.js` still imports the legacy/missing `backend/FINAL/policyControl.web` namespace. Policy Control itself therefore remains a separate domain-convergence task. This package does not silently invent its mutation API.

The customer Legal page is nevertheless now reading the canonical `legal_policies` source that Policy Control is intended to manage.

### Message contracts

HTML → page:
- `LEGAL_HUB_READY`
- `LEGAL_HUB_REFRESH`
- `LEGAL_HUB_HEIGHT`
- `LEGAL_NAVIGATE`

Page → HTML:
- `LEGAL_HUB_PARENT_READY`
- `LEGAL_HUB_DATA`
- `LEGAL_HUB_ERROR`

---

## COMPLETE INTENDED LIVE HTML SOURCE

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="color-scheme" content="light">
<meta name="theme-color" content="#022e64">
<title>SKANDI Legal Information · B-011.1</title>
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
button,input{font:inherit}
button{cursor:pointer}
button,input{outline:none}
button:focus-visible,input:focus-visible{
  outline:3px solid rgba(95,199,207,.42);
  outline-offset:3px;
}
.hidden{display:none!important}

/* =========================================================
   HERO — B-011 Home-aligned editorial treatment
   ========================================================= */
.hero{
  position:relative;
  overflow:hidden;
  padding:64px 24px 44px;
  border-bottom:1px solid var(--sk-border);
  background:
    radial-gradient(circle at 88% 10%,rgba(95,199,207,.13),transparent 25%),
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
  opacity:.55;
}
.hero-inner{
  position:relative;
  z-index:1;
  width:min(100%,var(--sk-max));
  margin:0 auto;
  display:grid;
  grid-template-columns:minmax(0,1fr) minmax(380px,.78fr);
  gap:48px;
  align-items:end;
}
.eyebrow{
  display:flex;
  align-items:center;
  gap:9px;
  color:var(--sk-cyan);
  font-size:9px;
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
  font-size:clamp(38px,5.5vw,58px);
  line-height:.98;
  letter-spacing:-.05em;
  font-weight:750;
}
.hero p{
  max-width:700px;
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
.search-shell input{
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
.btn{
  min-height:42px;
  padding:0 16px;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  gap:7px;
  border:1px solid transparent;
  border-radius:10px;
  background:linear-gradient(135deg,var(--sk-blue),var(--sk-blue-soft));
  color:#fff;
  font-size:9px;
  font-weight:850;
  letter-spacing:.04em;
  transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease,background .18s ease;
}
.btn:hover{
  transform:translateY(-1px);
  box-shadow:0 9px 24px rgba(2,46,100,.19);
}
.btn.secondary{
  background:#fff;
  color:var(--sk-blue);
  border-color:var(--sk-border);
  box-shadow:none;
}
.btn.secondary:hover{
  border-color:rgba(95,199,207,.55);
  background:var(--sk-pale);
}

/* =========================================================
   CONTENT SECTIONS
   ========================================================= */
.section{
  width:min(100%,var(--sk-max));
  margin:0 auto;
  padding:58px 24px 0;
}
.section:last-of-type{padding-bottom:78px}
.section-head{
  display:grid;
  grid-template-columns:minmax(0,1fr) auto;
  gap:24px;
  align-items:end;
  margin-bottom:20px;
}
.section h2{
  margin:6px 0 0;
  color:var(--sk-blue);
  font-size:clamp(26px,3.4vw,36px);
  line-height:1.06;
  letter-spacing:-.04em;
  font-weight:750;
}
.copy{
  max-width:700px;
  margin-top:7px;
  color:var(--sk-body);
  font-size:10px;
  line-height:1.65;
}
.meta{
  color:var(--sk-muted);
  font-size:8px;
  line-height:1.5;
  font-weight:650;
}

/* =========================================================
   FEATURED / FREQUENTLY REQUESTED
   ========================================================= */
.grid{
  display:grid;
  grid-template-columns:repeat(3,minmax(0,1fr));
  gap:14px;
}
.card{
  min-width:0;
  min-height:198px;
  display:flex;
  flex-direction:column;
  gap:10px;
  padding:20px;
  border:1px solid var(--sk-border-soft);
  border-radius:17px;
  background:#fff;
  color:var(--sk-text);
  box-shadow:0 5px 18px rgba(2,46,100,.05);
  text-align:left;
  transition:transform .22s cubic-bezier(.16,1,.3,1),box-shadow .22s ease,border-color .18s ease;
}
.card:hover{
  transform:translateY(-3px);
  border-color:rgba(95,199,207,.48);
  box-shadow:0 14px 30px rgba(2,46,100,.10);
}
.icon{
  width:44px;
  height:44px;
  display:grid;
  place-items:center;
  border:1px solid rgba(95,199,207,.30);
  border-radius:12px;
  background:linear-gradient(145deg,var(--sk-pale),#fff);
  color:var(--sk-blue);
}
.icon svg{
  width:21px;
  height:21px;
  stroke:currentColor;
  fill:none;
  stroke-width:1.8;
  stroke-linecap:round;
  stroke-linejoin:round;
}
.card h3{
  margin:2px 0 0;
  color:var(--sk-blue);
  font-size:15px;
  line-height:1.27;
  letter-spacing:-.02em;
}
.card p{
  flex:1;
  color:var(--sk-body);
  font-size:9px;
  line-height:1.58;
}
.card-action{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:12px;
  margin-top:auto;
  padding-top:9px;
  border-top:1px solid var(--sk-border-soft);
  color:var(--sk-blue);
  font-size:8px;
  font-weight:850;
}
.card-action span:last-child{color:var(--sk-cyan)}

/* =========================================================
   POLICY LIBRARY
   ========================================================= */
.library-shell{
  padding:22px;
  border:1px solid var(--sk-border);
  border-radius:20px;
  background:var(--sk-pale);
}
.list{
  display:grid;
  gap:8px;
}
.row{
  display:grid;
  grid-template-columns:minmax(0,1fr) auto;
  gap:18px;
  align-items:center;
  padding:15px 16px;
  border:1px solid var(--sk-border-soft);
  border-radius:13px;
  background:#fff;
  box-shadow:0 3px 12px rgba(2,46,100,.035);
}
.row-main{min-width:0}
.row h3{
  margin:0;
  color:var(--sk-blue);
  font-size:12px;
  line-height:1.35;
}
.row .copy{
  max-width:none;
  margin-top:4px;
  font-size:9px;
}
.row .meta{
  margin-top:6px;
}
.row-actions{
  display:flex;
  align-items:center;
  gap:7px;
}

/* =========================================================
   STATES
   ========================================================= */
.empty{
  grid-column:1/-1;
  padding:24px;
  border:1px solid var(--sk-border);
  border-radius:14px;
  background:#fff;
  color:var(--sk-muted);
  font-size:10px;
  line-height:1.6;
}
.empty.error{
  border-color:#f2b8b5;
  background:#fff8f7;
  color:var(--sk-danger);
}
.status-note{
  margin-top:14px;
  color:var(--sk-muted);
  font-size:8px;
  line-height:1.5;
}
.sr-only{
  position:absolute;
  width:1px;
  height:1px;
  padding:0;
  margin:-1px;
  overflow:hidden;
  clip:rect(0,0,0,0);
  white-space:nowrap;
  border:0;
}

@media(max-width:940px){
  .hero-inner{grid-template-columns:1fr;gap:22px}
  .grid{grid-template-columns:repeat(2,minmax(0,1fr))}
}
@media(max-width:680px){
  .hero{padding:46px 16px 32px}
  .hero h1{font-size:40px}
  .hero p{font-size:12px}
  .search-shell{grid-template-columns:1fr}
  .search-shell .btn{width:100%}
  .section{padding:46px 16px 0}
  .section:last-of-type{padding-bottom:62px}
  .section-head{grid-template-columns:1fr;gap:10px}
  .grid{grid-template-columns:1fr}
  .library-shell{padding:15px}
  .row{grid-template-columns:1fr}
  .row-actions .btn{width:100%}
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
<main>
  <section class="hero" data-section-id="legal-hero">
    <div class="hero-inner">
      <div>
        <div class="eyebrow" data-content-id="legal-hero-eyebrow">SKANDI LEGAL</div>
        <h1 id="heroTitle" data-content-id="legal-hero-h1">Legal Information</h1>
        <p id="heroSubtitle" data-content-id="legal-hero-copy">
          Find SKANDI Travels public policies, terms, statements and legal notices.
        </p>
      </div>

      <div class="search-shell" role="search">
        <label class="sr-only" for="search">Search legal documents</label>
        <input id="search" type="search" autocomplete="off" placeholder="Search policies, terms, privacy, cookies…">
        <button class="btn" id="searchBtn" type="button">Search</button>
      </div>
    </div>
  </section>

  <section class="section" data-section-id="legal-featured">
    <div class="section-head">
      <div>
        <div class="eyebrow" data-content-id="legal-featured-eyebrow">FREQUENTLY REQUESTED</div>
        <h2 data-content-id="legal-featured-h2">Key legal documents</h2>
        <p class="copy" data-content-id="legal-featured-copy">
          Direct access to SKANDI’s most frequently requested public policies and terms.
        </p>
      </div>
    </div>
    <div class="grid" id="directGrid">
      <div class="empty">Loading published legal documents…</div>
    </div>
  </section>

  <section class="section" data-section-id="legal-library">
    <div class="section-head">
      <div>
        <div class="eyebrow" data-content-id="legal-library-eyebrow">PUBLIC POLICIES</div>
        <h2 data-content-id="legal-library-h2">Policy library</h2>
        <p class="copy" data-content-id="legal-library-copy">
          Current published external policies maintained in SKANDI Policy Control.
        </p>
      </div>
      <span class="meta" id="count"></span>
    </div>

    <div class="library-shell">
      <div class="list" id="policyList">
        <div class="empty">Loading published policies…</div>
      </div>
      <div class="status-note" id="statusNote"></div>
    </div>
  </section>
</main>

<script>
(()=>{
"use strict";

const SOURCE="SKANDI_LEGAL_HUB";
const PARENT="SKANDI_WIX_PARENT";
const PARENT_ORIGIN=(()=>{
  try{return document.referrer?new URL(document.referrer).origin:"*"}
  catch(_){return"*"}
})();

const $=id=>document.getElementById(id);

let data={
  directPages:[],
  policies:[],
  settings:{}
};
let loaded=false;

function post(type,payload={}){
  window.parent.postMessage({
    source:SOURCE,
    type,
    payload,
    timestamp:new Date().toISOString()
  },PARENT_ORIGIN);
}

function esc(value){
  return String(value??"").replace(/[&<>'"]/g,c=>({
    "&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"
  }[c]));
}

function safePath(value){
  const path=String(value||"").trim();
  return path.startsWith("/")&&!path.startsWith("//")?path:"";
}

function formatDate(value){
  if(!value)return"";
  const raw=String(value).slice(0,10);
  const date=new Date(`${raw}T12:00:00Z`);
  return Number.isNaN(date.getTime())
    ?""
    :date.toLocaleDateString(undefined,{
      year:"numeric",
      month:"short",
      day:"numeric",
      timeZone:"UTC"
    });
}

function isPublishedExternal(policy={}){
  return String(policy.scope||"external").toLowerCase()==="external" &&
    String(policy.status||"Published").toLowerCase()==="published" &&
    policy.active!==false;
}

function searchableText(policy={}){
  return[
    policy.title,
    policy.documentId,
    policy.category,
    policy.summary,
    policy.version,
    policy.slug,
    policy.publicType
  ].join(" ").toLowerCase();
}

function visiblePolicies(){
  const query=($("search").value||"").toLowerCase().trim();
  return(data.policies||[])
    .filter(isPublishedExternal)
    .filter(policy=>!query||searchableText(policy).includes(query));
}

function visibleDirectPages(){
  return(data.directPages||[]).filter(isPublishedExternal);
}

function iconMarkup(type){
  const key=String(type||"").toLowerCase();
  if(key==="privacy"){
    return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10V8a5 5 0 0 1 10 0v2"/><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M12 14v2"/></svg>`;
  }
  if(key==="cookies"){
    return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 13.5A7.5 7.5 0 1 1 10.5 4a4 4 0 0 0 5 5 4 4 0 0 0 4.5 4.5Z"/><path d="M8 12h.01M11 16h.01M15 13h.01"/></svg>`;
  }
  if(key==="accessibility"){
    return `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="4.5" r="2"/><path d="M5 8.5c4-1.2 10-1.2 14 0M12 8.5v11M8.5 12l3.5 2 3.5-2M8 20l4-6 4 6"/></svg>`;
  }
  if(key==="bookingterms"){
    return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 13h18M7 9l5-5 5 5M8 13v6M16 13v6M5 20h14"/></svg>`;
  }
  if(key==="terms"){
    return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h8l3 3v15H7z"/><path d="M15 3v4h4M10 11h5M10 15h5"/></svg>`;
  }
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h9l3 3v15H6z"/><path d="M9 11h6M9 15h6"/></svg>`;
}

function routeFor(policy={}){
  return safePath(policy.route||policy.url) ||
    (policy.slug?`/about/legal/policies?slug=${encodeURIComponent(policy.slug)}`:"/about/legal/policies");
}

function navigatePolicy(policy={}){
  const path=routeFor(policy);
  if(path)post("LEGAL_NAVIGATE",{path});
}

function cardMarkup(policy,index){
  const version=policy.version?`Version ${esc(policy.version)}`:"";
  const effective=policy.effectiveDate?`Effective ${esc(formatDate(policy.effectiveDate))}`:"";
  const meta=[version,effective].filter(Boolean).join(" · ");

  return `<button class="card" type="button" data-direct-index="${index}">
    <div class="icon">${iconMarkup(policy.publicType)}</div>
    <h3>${esc(policy.title||"Legal document")}</h3>
    <p>${esc(policy.summary||"Read the current published SKANDI legal document.")}</p>
    <div class="card-action">
      <span>${esc(meta||policy.category||"Legal")}</span>
      <span>Open →</span>
    </div>
  </button>`;
}

function rowMarkup(policy,index){
  const meta=[
    policy.category||"Legal",
    policy.version?`Version ${policy.version}`:"",
    policy.effectiveDate?`Effective ${formatDate(policy.effectiveDate)}`:""
  ].filter(Boolean).join(" · ");

  return `<article class="row">
    <div class="row-main">
      <h3>${esc(policy.title||"Legal document")}</h3>
      ${policy.summary?`<p class="copy">${esc(policy.summary)}</p>`:""}
      <div class="meta">${esc(meta)}</div>
    </div>
    <div class="row-actions">
      <button class="btn secondary" type="button" data-policy-index="${index}">Open</button>
    </div>
  </article>`;
}

function render(){
  const settings=data.settings||{};
  if(settings.title)$("heroTitle").textContent=settings.title;
  if(settings.subtitle)$("heroSubtitle").textContent=settings.subtitle;

  if(!loaded){
    requestHeight();
    return;
  }

  const direct=visibleDirectPages();
  $("directGrid").innerHTML=direct.length
    ?direct.map(cardMarkup).join("")
    :`<div class="empty">No featured legal documents are currently available.</div>`;

  const rows=visiblePolicies();
  $("count").textContent=`${rows.length} document${rows.length===1?"":"s"}`;

  $("policyList").innerHTML=rows.length
    ?rows.map(rowMarkup).join("")
    :`<div class="empty">No matching public policies found.</div>`;

  $("statusNote").textContent=data.generatedAt
    ?`Published legal library loaded from SKANDI Policy Control.`
    :"";

  $("directGrid").dataset.visibleIds=JSON.stringify(direct.map(item=>item.policyId||item.slug||item.documentId||""));
  $("policyList").dataset.visibleIds=JSON.stringify(rows.map(item=>item.policyId||item.slug||item.documentId||""));

  requestHeight();
}

function policyByVisibleId(kind,index){
  const host=kind==="direct"?$("directGrid"):$("policyList");
  let ids=[];
  try{ids=JSON.parse(host.dataset.visibleIds||"[]")}catch(_){}
  const id=ids[index];
  const pool=kind==="direct"?visibleDirectPages():visiblePolicies();
  return pool.find(item=>(item.policyId||item.slug||item.documentId||"")===id)||pool[index]||null;
}

function showLoadError(message){
  loaded=true;
  $("directGrid").innerHTML=`<div class="empty error">${esc(message||"Legal information is temporarily unavailable.")}</div>`;
  $("policyList").innerHTML=`<div class="empty error">Published Policy Control data could not be loaded.</div>`;
  $("count").textContent="";
  $("statusNote").textContent="";
  requestHeight();
}

let heightTimer=0;
function requestHeight(){
  clearTimeout(heightTimer);
  heightTimer=setTimeout(()=>{
    post("LEGAL_HUB_HEIGHT",{
      height:Math.ceil(document.documentElement.scrollHeight)
    });
  },50);
}

$("search").addEventListener("input",render);
$("searchBtn").addEventListener("click",render);
$("search").addEventListener("keydown",event=>{
  if(event.key==="Enter"){
    event.preventDefault();
    render();
  }
});

$("directGrid").addEventListener("click",event=>{
  const button=event.target.closest("[data-direct-index]");
  if(!button)return;
  const policy=policyByVisibleId("direct",Number(button.dataset.directIndex));
  if(policy)navigatePolicy(policy);
});

$("policyList").addEventListener("click",event=>{
  const button=event.target.closest("[data-policy-index]");
  if(!button)return;
  const policy=policyByVisibleId("policy",Number(button.dataset.policyIndex));
  if(policy)navigatePolicy(policy);
});

window.addEventListener("message",event=>{
  let message=event.data;
  if(typeof message==="string"){
    try{message=JSON.parse(message)}catch(_){return}
  }
  if(!message||typeof message!=="object")return;
  if(message.source&&message.source!==PARENT)return;

  if(message.type==="LEGAL_HUB_DATA"){
    const payload=message.payload||{};
    data={
      directPages:Array.isArray(payload.directPages)?payload.directPages:[],
      policies:Array.isArray(payload.policies)?payload.policies:[],
      settings:payload.settings&&typeof payload.settings==="object"?payload.settings:{},
      generatedAt:payload.generatedAt||""
    };
    loaded=true;
    render();
    return;
  }

  if(message.type==="LEGAL_HUB_ERROR"||message.type==="LEGAL_ERROR"){
    showLoadError(message.payload?.message);
  }
});

if("ResizeObserver"in window){
  new ResizeObserver(requestHeight).observe(document.body);
}else{
  window.addEventListener("resize",requestHeight);
}

post("LEGAL_HUB_READY",{});
requestHeight();
})();
</script>
</body>
</html>
```
