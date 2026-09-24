# Policies

## INFO / LOG

- **Current status:** `B-011.2 — STATICALLY VERIFIED / LIVE WIX TEST REQUIRED`
- **System:** SKANDI customer website
- **Route:** `/about/legal/policies`
- **Wix page:** `Policies.sgcey`
- **HTML component:** `#legalPolicyEmbed`
- **HTML child source:** `SKANDI_LEGAL_DOCUMENT`
- **Parent source:** `SKANDI_WIX_PARENT`
- **Linked page controller:** `/src/pages/Policies.sgcey.js`
- **Canonical public facade:** `/src/backend/SKANDI_CORE/legalPolicy.web.js`
- **Canonical backend core:** `/src/backend/SKANDI_CORE/legalPolicy.js`
- **Canonical Supabase transport:** `/src/backend/SKANDI_CORE/supabaseServer.js`
- **Canonical database source:** Supabase `public.legal_policies`
- **Legal hub route:** `/about/legal`
- **Global customer header/footer:** `masterPage.js`; this embed does not own global chrome.
- **Last verified:** `2026-09-24`

### Pre-B-011 mismatch

The supplied Policy HTML used a direct browser request to:

`https://www.skanditravels.com/_functions/legalDocument`

while the current `/src/pages/Policies.sgcey.js` only sent the query context into the HTML embed.

That disagreed with the required B-011 chain and duplicated Legal data access outside `backend/SKANDI_CORE`.

The legacy `/src/pages/Policy Documents.bd8ok.js` is separately classified as compatibility-only and is not used by this package.

### Canonical B-011.2 chain

`#legalPolicyEmbed`
→ `postMessage`
→ `/src/pages/Policies.sgcey.js`
→ `backend/SKANDI_CORE/legalPolicy.web`
→ `backend/SKANDI_CORE/legalPolicy`
→ `backend/SKANDI_CORE/supabaseServer`
→ Supabase `public.legal_policies`

### Public-document security boundary

A document is returned only when all of the following are true:

- `scope = external`
- `status = Published`
- `active = true`
- `deleted_at IS NULL`

The customer payload contains published legal content and public document metadata only.

It does **not** expose:

- `approved_by_sk_id`
- revision history/snapshots
- internal review workflow state
- deleted records
- unpublished/internal documents.

### B-011.2 page upgrade

- Converted the document page to the exact shared Home/customer B-011 palette.
- Added a sticky left navigation rail on desktop.
- Added **Back to Legal** using `LEGAL_DOCUMENT_NAVIGATE` and the canonical `SITE_MAP.legal` route.
- Moved the generated **Table of contents** into the side rail.
- Added TOC active-section highlighting using `IntersectionObserver`.
- Added **Suggested documents** from the same canonical `legal_policies` public projection.
- Suggested documents prefer related category/public type and exclude the current policy.
- Added published PDF access when `pdf_file_url` exists.
- Preserved structured legal sections, nested subsections, introduction HTML, document control, tables, blockquotes and print behavior.
- Internal links embedded inside published policy content now navigate through the Wix page bridge rather than escaping the iframe.
- External links remain safe external links.
- Removed browser-side `/_functions/legalDocument` access.
- Added stable Presentation Registry hooks to the static side-rail headings/document header only; policy body content remains Policy Control-owned.
- On tablet/mobile, the side rail becomes normal flow above the policy document while retaining Back, TOC and suggested documents.

### Shared legal backend

This package is cumulative over Legal Hub B-011.1.

`legalPolicy.js` / `legalPolicy.web.js` continue to export:

- `getPublicLegalHub`

and now also export:

- `getPublicLegalDocument`

The previously delivered Legal Hub therefore remains on the same canonical domain backend.

### Live-data verification

The canonical `legal_policies` table currently contains published external documents with structured `sections` arrays. Published PDF URLs are also present for the current public documents.

No Supabase schema or data mutation is performed by this package.

### Message contracts

HTML → page:
- `LEGAL_DOCUMENT_READY`
- `LEGAL_DOCUMENT_REFRESH`
- `LEGAL_DOCUMENT_HEIGHT`
- `LEGAL_DOCUMENT_NAVIGATE`

Page → HTML:
- `LEGAL_DOCUMENT_CONTEXT` — preserved from the pre-B-011 page contract
- `LEGAL_DOCUMENT_DATA`
- `LEGAL_DOCUMENT_ERROR`

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
<title>SKANDI Legal Document · B-011.2</title>
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

*{box-sizing:border-box}
html{scroll-behavior:smooth}
html,body{
  width:100%;
  min-height:100%;
  margin:0;
  background:var(--sk-bg);
  color:var(--sk-text);
  font-family:"Montserrat",system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
button,a{font:inherit}
button{cursor:pointer}
a{color:var(--sk-blue2)}
button:focus-visible,a:focus-visible{
  outline:3px solid rgba(95,199,207,.42);
  outline-offset:3px;
}

.skip{
  position:absolute;
  left:-9999px;
}
.skip:focus{
  left:16px;
  top:16px;
  z-index:100;
  padding:10px 12px;
  border-radius:9px;
  background:#fff;
  color:var(--sk-blue);
  box-shadow:var(--sk-shadow);
  font-size:10px;
  font-weight:800;
}

/* =========================================================
   OUTER PAGE
   ========================================================= */
.shell{
  width:min(100%,var(--sk-max));
  margin:0 auto;
  padding:34px 24px 76px;
}
.layout{
  display:grid;
  grid-template-columns:270px minmax(0,1fr);
  gap:24px;
  align-items:start;
}

/* =========================================================
   SIDE RAIL
   ========================================================= */
.rail{
  position:sticky;
  top:18px;
  max-height:calc(100vh - 36px);
  overflow:auto;
  display:grid;
  gap:12px;
  scrollbar-width:thin;
}
.rail-card{
  border:1px solid var(--sk-border);
  border-radius:16px;
  background:#fff;
  box-shadow:0 5px 18px rgba(2,46,100,.05);
}
.back-btn{
  width:100%;
  min-height:44px;
  padding:10px 13px;
  display:flex;
  align-items:center;
  gap:9px;
  border:1px solid var(--sk-border);
  border-radius:12px;
  background:#fff;
  color:var(--sk-blue);
  font-size:10px;
  line-height:1.3;
  font-weight:850;
  text-align:left;
  transition:transform .18s ease,border-color .18s ease,box-shadow .18s ease;
}
.back-btn:hover{
  transform:translateY(-1px);
  border-color:rgba(95,199,207,.5);
  box-shadow:0 7px 18px rgba(2,46,100,.07);
}
.back-btn span:first-child{
  color:var(--sk-cyan);
  font-size:14px;
}

.rail-section{padding:16px}
.rail-eyebrow{
  display:flex;
  align-items:center;
  gap:7px;
  margin-bottom:10px;
  color:var(--sk-cyan);
  font-size:8px;
  font-weight:900;
  letter-spacing:.14em;
  text-transform:uppercase;
}
.rail-eyebrow::before{
  content:"";
  width:19px;
  height:2px;
  border-radius:999px;
  background:var(--sk-cyan);
}
.rail h2{
  margin:0 0 11px;
  color:var(--sk-blue);
  font-size:13px;
  line-height:1.3;
}

.toc-list{
  list-style:none;
  margin:0;
  padding:0;
  display:grid;
  gap:2px;
}
.toc-item{margin:0}
.toc-item.depth-1{padding-left:10px}
.toc-item.depth-2{padding-left:20px}
.toc-item.depth-3{padding-left:30px}
.toc-link{
  width:100%;
  display:grid;
  grid-template-columns:auto minmax(0,1fr);
  gap:7px;
  align-items:start;
  padding:7px 8px;
  border-radius:8px;
  color:var(--sk-muted);
  text-decoration:none;
  font-size:8px;
  line-height:1.45;
  transition:background .16s ease,color .16s ease;
}
.toc-link:hover{
  background:var(--sk-pale);
  color:var(--sk-blue);
}
.toc-link.active{
  background:var(--sk-pale);
  color:var(--sk-blue);
  font-weight:750;
}
.toc-number{
  color:var(--sk-cyan);
  font-weight:900;
}
.toc-empty{
  color:var(--sk-muted);
  font-size:9px;
  line-height:1.5;
}

.suggestions{
  display:grid;
  gap:7px;
}
.suggested{
  width:100%;
  display:block;
  padding:10px 11px;
  border:1px solid var(--sk-border-soft);
  border-radius:10px;
  background:var(--sk-bg);
  text-align:left;
  color:var(--sk-text);
  transition:transform .16s ease,border-color .16s ease,background .16s ease;
}
.suggested:hover{
  transform:translateY(-1px);
  border-color:rgba(95,199,207,.45);
  background:var(--sk-pale);
}
.suggested strong{
  display:block;
  color:var(--sk-blue);
  font-size:9px;
  line-height:1.4;
}
.suggested span{
  display:block;
  margin-top:4px;
  color:var(--sk-muted);
  font-size:7px;
  line-height:1.4;
}

/* =========================================================
   DOCUMENT
   ========================================================= */
.document{
  min-width:0;
  overflow:hidden;
  border:1px solid var(--sk-border);
  border-radius:20px;
  background:#fff;
  box-shadow:var(--sk-shadow);
}
.document-head{
  position:relative;
  overflow:hidden;
  padding:34px 38px 30px;
  border-bottom:1px solid var(--sk-border);
  background:
    radial-gradient(circle at 94% 2%,rgba(95,199,207,.12),transparent 28%),
    linear-gradient(180deg,#fff,var(--sk-pale));
}
.document-head::after{
  content:"";
  position:absolute;
  left:38px;
  right:38px;
  bottom:0;
  height:1px;
  background:linear-gradient(90deg,var(--sk-cyan),var(--sk-champagne),transparent);
  opacity:.75;
}
.eyebrow{
  display:flex;
  align-items:center;
  gap:8px;
  color:var(--sk-cyan);
  font-size:8px;
  font-weight:900;
  letter-spacing:.15em;
  text-transform:uppercase;
}
.eyebrow::before{
  content:"";
  width:23px;
  height:2px;
  border-radius:99px;
  background:var(--sk-cyan);
}
.document h1{
  max-width:850px;
  margin:8px 0 13px;
  color:var(--sk-blue);
  font-size:clamp(29px,4vw,44px);
  line-height:1.05;
  letter-spacing:-.045em;
  font-weight:760;
}
.summary{
  max-width:830px;
  margin:0;
  color:var(--sk-body);
  font-size:11px;
  line-height:1.7;
}
.meta-row{
  display:flex;
  gap:7px;
  flex-wrap:wrap;
  margin-top:17px;
}
.meta-pill{
  padding:7px 9px;
  border:1px solid var(--sk-border);
  border-radius:999px;
  background:#fff;
  color:var(--sk-muted);
  font-size:7px;
  line-height:1;
  font-weight:750;
}
.meta-pill strong{color:var(--sk-blue)}
.head-actions{
  display:flex;
  gap:8px;
  flex-wrap:wrap;
  margin-top:18px;
}
.action-btn{
  min-height:40px;
  padding:0 14px;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  gap:7px;
  border:1px solid transparent;
  border-radius:10px;
  background:linear-gradient(135deg,var(--sk-blue),var(--sk-blue-soft));
  color:#fff;
  text-decoration:none;
  font-size:8px;
  font-weight:850;
}
.action-btn.secondary{
  border-color:var(--sk-border);
  background:#fff;
  color:var(--sk-blue);
}

.document-body{
  padding:34px 38px 42px;
}
.introduction{
  margin:0 0 27px;
  padding:18px 20px;
  border:1px solid var(--sk-border-soft);
  border-left:3px solid var(--sk-cyan);
  border-radius:12px;
  background:var(--sk-pale);
  color:var(--sk-body);
}
.introduction p{
  margin:0 0 11px;
  font-size:10px;
  line-height:1.72;
}
.introduction p:last-child{margin-bottom:0}

.policy-body{
  color:#333;
}
.policy-body section{
  scroll-margin-top:18px;
}
.policy-body h2,
.policy-body h3,
.policy-body h4,
.policy-body h5{
  color:var(--sk-blue);
  line-height:1.25;
  letter-spacing:-.025em;
}
.policy-body h2{
  margin:32px 0 12px;
  padding-top:8px;
  font-size:20px;
}
.policy-body h3{
  margin:27px 0 10px;
  font-size:17px;
}
.policy-body h4{
  margin:23px 0 9px;
  font-size:14px;
}
.policy-body h5{
  margin:20px 0 8px;
  font-size:12px;
}
.section-number{
  margin-right:4px;
  color:var(--sk-cyan);
  font-weight:900;
}
.policy-body p{
  margin:0 0 14px;
  color:#404040;
  font-size:10px;
  line-height:1.78;
}
.policy-body ul,
.policy-body ol{
  margin:0 0 17px 22px;
  padding:0;
}
.policy-body li{
  margin:5px 0;
  color:#404040;
  font-size:10px;
  line-height:1.7;
}
.policy-body a,
.introduction a{
  color:var(--sk-blue2);
  font-weight:650;
  text-decoration:underline;
  text-decoration-color:rgba(95,199,207,.65);
  text-underline-offset:2px;
}
.policy-body blockquote{
  margin:17px 0;
  padding:13px 15px;
  border-left:3px solid var(--sk-cyan);
  border-radius:0 10px 10px 0;
  background:var(--sk-pale);
}
.policy-body table{
  width:100%;
  border-collapse:collapse;
  margin:18px 0;
  font-size:8px;
}
.policy-body th,
.policy-body td{
  padding:9px 10px;
  border:1px solid var(--sk-border);
  text-align:left;
  vertical-align:top;
}
.policy-body th{
  background:var(--sk-pale);
  color:var(--sk-blue);
  font-weight:800;
}

.document-control{
  margin-top:40px;
  padding-top:24px;
  border-top:1px solid var(--sk-border);
}
.document-control h2{
  margin:0 0 15px;
  color:var(--sk-blue);
  font-size:16px;
}
.control-table{
  width:min(620px,100%);
  border-collapse:separate;
  border-spacing:0;
  overflow:hidden;
  border:1px solid var(--sk-border);
  border-radius:11px;
  font-size:8px;
}
.control-table th,
.control-table td{
  padding:10px 11px;
  border-bottom:1px solid var(--sk-border-soft);
  text-align:left;
  vertical-align:top;
}
.control-table tr:last-child th,
.control-table tr:last-child td{
  border-bottom:0;
}
.control-table th{
  width:36%;
  background:var(--sk-pale);
  color:var(--sk-muted);
  font-weight:750;
}
.control-table td{
  background:#fff;
  color:var(--sk-text);
  font-weight:650;
}

/* =========================================================
   STATES
   ========================================================= */
.loading,
.error{
  padding:32px;
  border:1px solid var(--sk-border);
  border-radius:18px;
  background:#fff;
  box-shadow:var(--sk-shadow);
  color:var(--sk-muted);
  font-size:10px;
  line-height:1.6;
}
.error{
  border-color:#f2b8b5;
  background:#fff8f7;
  color:var(--sk-danger);
}

@media(max-width:900px){
  .layout{
    grid-template-columns:1fr;
  }
  .rail{
    position:static;
    max-height:none;
    overflow:visible;
    grid-template-columns:1fr 1fr;
  }
  .rail > .back-btn{
    grid-column:1/-1;
  }
  .rail-card{
    min-width:0;
  }
}
@media(max-width:650px){
  .shell{
    padding:16px 12px 50px;
  }
  .rail{
    grid-template-columns:1fr;
  }
  .rail > .back-btn{
    grid-column:auto;
  }
  .document{
    border-radius:16px;
  }
  .document-head{
    padding:26px 20px 24px;
  }
  .document-head::after{
    left:20px;
    right:20px;
  }
  .document h1{
    font-size:31px;
  }
  .document-body{
    padding:25px 20px 32px;
  }
  .policy-body p,
  .policy-body li,
  .introduction p{
    font-size:10px;
  }
}
@media print{
  @page{size:Letter;margin:.58in .65in}
  html,body{background:#fff}
  .shell{width:auto;padding:0;margin:0}
  .layout{display:block}
  .rail{display:none!important}
  .document{
    border:0;
    border-radius:0;
    box-shadow:none;
  }
  .document-head{
    padding:0 0 22px;
    background:#fff;
  }
  .document-head::after{display:none}
  .document-body{padding:24px 0 0}
  .head-actions{display:none}
  .policy-body h2,
  .policy-body h3,
  .policy-body h4{break-after:avoid}
  .document-control{break-inside:avoid}
}
@media(prefers-reduced-motion:reduce){
  html{scroll-behavior:auto}
  *,*::before,*::after{
    animation:none!important;
    transition-duration:.01ms!important;
  }
}
</style>
</head>
<body>
<a class="skip" href="#policyContent">Skip to policy content</a>

<div class="shell">
  <div class="layout">
    <aside class="rail" id="sideRail" aria-label="Legal document navigation">
      <button class="back-btn" id="backToLegal" type="button">
        <span>←</span><span>Back to Legal</span>
      </button>

      <section class="rail-card rail-section" data-section-id="policy-toc">
        <div class="rail-eyebrow" data-content-id="policy-toc-eyebrow">ON THIS PAGE</div>
        <h2 data-content-id="policy-toc-h2">Table of contents</h2>
        <nav id="toc" aria-label="Table of contents">
          <div class="toc-empty">Loading document sections…</div>
        </nav>
      </section>

      <section class="rail-card rail-section" data-section-id="policy-suggested">
        <div class="rail-eyebrow" data-content-id="policy-suggested-eyebrow">RELATED LEGAL</div>
        <h2 data-content-id="policy-suggested-h2">Suggested documents</h2>
        <div class="suggestions" id="suggestions">
          <div class="toc-empty">Loading suggestions…</div>
        </div>
      </section>
    </aside>

    <main id="documentHost" aria-live="polite">
      <div class="loading">Loading legal document…</div>
    </main>
  </div>
</div>

<script>
(()=>{
"use strict";

const SOURCE="SKANDI_LEGAL_DOCUMENT";
const PARENT="SKANDI_WIX_PARENT";
const PARENT_ORIGIN=(()=>{
  try{return document.referrer?new URL(document.referrer).origin:"*"}
  catch(_){return"*"}
})();

const $=id=>document.getElementById(id);

let current=null;
let suggested=[];
let backPath="/about/legal";
let policyPath="/about/legal/policies";
let requestContext=null;
let tocObserver=null;
let heightTimer=0;

function post(type,payload={}){
  window.parent.postMessage({
    source:SOURCE,
    type,
    payload,
    timestamp:new Date().toISOString()
  },PARENT_ORIGIN);
}

function parseMessage(value){
  if(typeof value==="string"){
    try{return JSON.parse(value)}catch(_){return null}
  }
  return value&&typeof value==="object"?value:null;
}

function esc(value){
  return String(value??"").replace(/[&<>'"]/g,c=>({
    "&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"
  }[c]));
}

function safeUrl(value){
  const raw=String(value||"").trim();
  if(!raw)return"";
  if(raw.startsWith("/")&&!raw.startsWith("//"))return raw;
  try{
    const url=new URL(raw,location.origin);
    return["https:","http:","mailto:","tel:"].includes(url.protocol)?url.href:"";
  }catch(_){
    return"";
  }
}

function safeInternalPath(value){
  const path=String(value||"").trim();
  return path.startsWith("/")&&!path.startsWith("//")?path:"";
}

function cleanHtml(value){
  const doc=new DOMParser().parseFromString(`<div>${String(value||"")}</div>`,"text/html");
  const root=doc.body.firstElementChild;
  if(!root)return"";

  root.querySelectorAll(
    "script,style,iframe,object,embed,form,input,button,textarea,select,meta,link,base"
  ).forEach(node=>node.remove());

  root.querySelectorAll("*").forEach(node=>{
    [...node.attributes].forEach(attr=>{
      const name=attr.name.toLowerCase();
      const raw=String(attr.value||"");

      if(name.startsWith("on")||name==="style"||name==="srcdoc"||name==="id"){
        node.removeAttribute(attr.name);
        return;
      }

      if(name==="href"||name==="src"){
        const safe=safeUrl(raw);
        if(safe)node.setAttribute(attr.name,safe);
        else node.removeAttribute(attr.name);
        return;
      }

      if(![
        "class","title","colspan","rowspan","scope","rel","target","aria-label"
      ].includes(name)&&!name.startsWith("data-")){
        node.removeAttribute(attr.name);
      }
    });

    if(node.tagName==="A"&&node.getAttribute("href")){
      const href=node.getAttribute("href")||"";
      node.setAttribute("rel","noopener noreferrer");
      if(href.startsWith("/")){
        node.removeAttribute("target");
      }else if(/^https?:/i.test(href)){
        node.setAttribute("target","_blank");
      }
    }
  });

  return root.innerHTML;
}

function formatDate(value){
  if(!value)return"Not set";
  const date=new Date(`${String(value).slice(0,10)}T12:00:00Z`);
  return Number.isNaN(date.getTime())
    ?"Not set"
    :date.toLocaleDateString("en-US",{
      month:"long",
      day:"numeric",
      year:"numeric",
      timeZone:"UTC"
    });
}

function flatten(items,prefix=[]){
  const out=[];
  (Array.isArray(items)?items:[]).forEach((item,index)=>{
    const path=[...prefix,index+1];
    const number=path.join(".");
    const anchor=`section-${number.replace(/\./g,"-")}`;

    out.push({
      ...item,
      number,
      label:path.length===1?`${number}.`:number,
      depth:path.length-1,
      anchor
    });

    out.push(...flatten(item.children||[],path));
  });
  return out;
}

function normalizeDocument(payload={}){
  const value=payload.document||payload.policy||payload||{};
  return{
    policyId:value.policyId||value.policy_id||"",
    documentId:value.documentId||value.document_id||"",
    title:value.title||"Legal Document",
    slug:value.slug||"",
    scope:String(value.scope||"external").toLowerCase(),
    brand:value.brand||"SKANDI TRAVELS",
    publicType:value.publicType||value.public_type||"",
    category:value.category||"Legal",
    summary:value.summary||"",
    introductionHtml:value.introductionHtml||value.introduction_html||"",
    sections:Array.isArray(value.sections)?value.sections:[],
    bodyHtml:value.bodyHtml||value.body_html||"",
    bodyPlainText:value.bodyPlainText||value.body_plain_text||"",
    effectiveDate:value.effectiveDate||value.effective_date||"",
    reviewDate:value.reviewDate||value.review_date||"",
    owner:value.owner||"Legal / Compliance",
    approvedByName:value.approvedByName||value.approved_by_name||"",
    version:value.version||"1.0",
    updatedAt:value.updatedAt||value.updated_at||value.publishedAt||value.published_at||"",
    pdfUrl:safeUrl(value.pdfUrl||value.pdf_file_url||""),
    pdfFileName:value.pdfFileName||value.pdf_file_name||""
  };
}

function documentRoute(item={}){
  const route=safeInternalPath(item.route||"");
  if(route)return route;

  if(item.slug){
    return `${policyPath}?slug=${encodeURIComponent(item.slug)}`;
  }
  if(item.policyId){
    return `${policyPath}?policyId=${encodeURIComponent(item.policyId)}`;
  }
  if(item.documentId){
    return `${policyPath}?documentId=${encodeURIComponent(item.documentId)}`;
  }
  return policyPath;
}

function sectionHtml(item){
  const level=Math.min(5,2+item.depth);
  return `<section id="${esc(item.anchor)}" data-policy-section="${esc(item.anchor)}">
    <h${level}><span class="section-number">${esc(item.label)}</span>${esc(item.title||"Untitled Section")}</h${level}>
    ${cleanHtml(item.bodyHtml||"")}
  </section>`;
}

function renderToc(flat){
  const host=$("toc");
  if(!flat.length){
    host.innerHTML='<div class="toc-empty">This document does not contain a structured table of contents.</div>';
    return;
  }

  host.innerHTML=`<ol class="toc-list">${
    flat.map(item=>`
      <li class="toc-item depth-${Math.min(item.depth,3)}">
        <a class="toc-link" data-toc-anchor="${esc(item.anchor)}" href="#${esc(item.anchor)}">
          <span class="toc-number">${esc(item.label)}</span>
          <span>${esc(item.title||"Untitled Section")}</span>
        </a>
      </li>
    `).join("")
  }</ol>`;
}

function renderSuggestions(){
  const host=$("suggestions");
  if(!suggested.length){
    host.innerHTML='<div class="toc-empty">No additional public legal documents are currently available.</div>';
    return;
  }

  host.innerHTML=suggested.map((item,index)=>`
    <button class="suggested" type="button" data-suggested-index="${index}">
      <strong>${esc(item.title||"Legal document")}</strong>
      <span>${esc([
        item.category||"Legal",
        item.version?`Version ${item.version}`:""
      ].filter(Boolean).join(" · "))}</span>
    </button>
  `).join("");
}

function setupTocObserver(flat){
  if(tocObserver){
    tocObserver.disconnect();
    tocObserver=null;
  }

  const links=[...document.querySelectorAll("[data-toc-anchor]")];
  const sections=flat.map(item=>document.getElementById(item.anchor)).filter(Boolean);
  if(!links.length||!sections.length||!("IntersectionObserver"in window))return;

  const setActive=anchor=>{
    links.forEach(link=>{
      link.classList.toggle("active",link.dataset.tocAnchor===anchor);
    });
  };

  tocObserver=new IntersectionObserver(entries=>{
    const visible=entries
      .filter(entry=>entry.isIntersecting)
      .sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top);

    if(visible[0])setActive(visible[0].target.id);
  },{
    root:null,
    rootMargin:"-8% 0px -72% 0px",
    threshold:[0,.1,.5]
  });

  sections.forEach(section=>tocObserver.observe(section));
  if(sections[0])setActive(sections[0].id);
}

function render(){
  if(!current)return;

  const flat=flatten(current.sections);
  const approved=current.approvedByName||"SKANDI Legal / Compliance";
  const body=flat.length
    ?flat.map(sectionHtml).join("")
    :current.bodyHtml
      ?cleanHtml(current.bodyHtml)
      :current.bodyPlainText
        ?`<p>${esc(current.bodyPlainText)}</p>`
        :'<div class="error">The published document does not contain any content.</div>';

  $("documentHost").innerHTML=`
    <article class="document" id="policyContent">
      <header class="document-head" data-section-id="policy-document-head">
        <div class="eyebrow" data-content-id="policy-document-eyebrow">SKANDI LEGAL DOCUMENT</div>
        <h1>${esc(current.title)}</h1>
        ${current.summary?`<p class="summary">${esc(current.summary)}</p>`:""}

        <div class="meta-row">
          <span class="meta-pill"><strong>Effective</strong> ${esc(formatDate(current.effectiveDate))}</span>
          <span class="meta-pill"><strong>Version</strong> ${esc(current.version)}</span>
          <span class="meta-pill"><strong>Document</strong> ${esc(current.documentId||"Public policy")}</span>
        </div>

        ${current.pdfUrl?`
          <div class="head-actions">
            <a class="action-btn secondary" href="${esc(current.pdfUrl)}" target="_blank" rel="noopener noreferrer">
              Open published PDF
            </a>
          </div>
        `:""}
      </header>

      <div class="document-body">
        ${current.introductionHtml
          ?`<div class="introduction">${cleanHtml(current.introductionHtml)}</div>`
          :""}

        <div class="policy-body" id="policyBody">
          ${body}
        </div>

        <section class="document-control" data-section-id="policy-document-control">
          <h2>Document Control</h2>
          <table class="control-table">
            <tr><th>Document ID</th><td>${esc(current.documentId||"Not set")}</td></tr>
            <tr><th>Version</th><td>${esc(current.version)}</td></tr>
            <tr><th>Effective Date</th><td>${esc(formatDate(current.effectiveDate))}</td></tr>
            <tr><th>Last Updated</th><td>${esc(formatDate(current.updatedAt))}</td></tr>
            <tr><th>Approved By</th><td>${esc(approved)}</td></tr>
            <tr><th>Owner</th><td>${esc(current.owner)}</td></tr>
            <tr><th>Classification</th><td>External Publication</td></tr>
          </table>
        </section>
      </div>
    </article>`;

  renderToc(flat);
  renderSuggestions();
  setupTocObserver(flat);

  document.title=`${current.title} | ${current.brand}`;
  requestHeight();
}

function showError(message){
  $("documentHost").innerHTML=`
    <div class="error">
      <strong>Document unavailable</strong><br>
      ${esc(message||"The document could not be loaded.")}
    </div>`;
  $("toc").innerHTML='<div class="toc-empty">No table of contents is available.</div>';
  $("suggestions").innerHTML='<div class="toc-empty">Suggested documents are unavailable.</div>';
  requestHeight();
}

function navigate(path){
  const target=safeInternalPath(path);
  if(target)post("LEGAL_DOCUMENT_NAVIGATE",{path:target});
}

$("backToLegal").addEventListener("click",()=>navigate(backPath));

$("suggestions").addEventListener("click",event=>{
  const button=event.target.closest("[data-suggested-index]");
  if(!button)return;
  const item=suggested[Number(button.dataset.suggestedIndex)];
  if(item)navigate(documentRoute(item));
});

document.addEventListener("click",event=>{
  const anchor=event.target.closest(".policy-body a,.introduction a");
  if(!anchor)return;

  const href=String(anchor.getAttribute("href")||"").trim();
  if(href.startsWith("/")&&!href.startsWith("//")){
    event.preventDefault();
    navigate(href);
  }
});

let heightTimerId=0;
function requestHeight(){
  clearTimeout(heightTimerId);
  heightTimerId=setTimeout(()=>{
    post("LEGAL_DOCUMENT_HEIGHT",{
      height:Math.ceil(document.documentElement.scrollHeight)
    });
  },50);
}

window.addEventListener("message",event=>{
  const message=parseMessage(event.data);
  if(!message||message.source!==PARENT)return;

  const payload=message.payload||{};

  if(message.type==="LEGAL_DOCUMENT_CONTEXT"){
    requestContext={
      type:payload.type||"",
      slug:payload.slug||"",
      documentId:payload.documentId||"",
      policyId:payload.policyId||""
    };
    backPath=safeInternalPath(payload.backPath)||backPath;
    policyPath=safeInternalPath(payload.policyPath)||policyPath;
    return;
  }

  if(message.type==="LEGAL_DOCUMENT_DATA"){
    current=normalizeDocument(payload);
    suggested=Array.isArray(payload.suggestedDocuments)
      ?payload.suggestedDocuments
      :[];
    backPath=safeInternalPath(payload.backPath)||backPath;
    policyPath=safeInternalPath(payload.policyPath)||policyPath;
    render();
    return;
  }

  if(message.type==="LEGAL_DOCUMENT_ERROR"){
    current=null;
    suggested=[];
    showError(payload.message);
  }
});

if("ResizeObserver"in window){
  new ResizeObserver(requestHeight).observe(document.body);
}else{
  window.addEventListener("resize",requestHeight);
}

post("LEGAL_DOCUMENT_READY",{path:"/about/legal/policies"});
requestHeight();
})();
</script>
</body>
</html>
```
