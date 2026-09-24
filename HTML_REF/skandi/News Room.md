# News Room

## INFO / LOG

- **Status:** READY
- **System:** SKANDI
- **Route:** `/about/news-room`
- **Wix page:** `News Room.vn46g`
- **HTML component:** `#newsroomEmbed`
- **HTML source:** `/HTML_REF/skandi/News Room.md`
- **HTML child source:** `SKANDI_PUBLIC_NEWSROOM`
- **Parent source:** `SKANDI_WIX_PARENT`
- **Public editorial facade:** `backend/SKANDI_CORE/publicContent.web`
- **Public editorial method:** `getPublicNewsroomData`
- **Public editorial core:** `backend/SKANDI_CORE/publicContent`
- **Newsletter facade:** `backend/SKANDI_CORE/customerSession.web`
- **Newsletter method:** `subscribeCustomerNewsletter`
- **Internal authoring/control surface:** `/src/pages/MEDIA Control.chm91.js`
- **Media Control editorial facade:** `backend/SKANDI_CORE/publicContent.web`
- **Physical asset facade:** `backend/SKANDI_CORE/assets.web`
- **Version:** `B-011.2`
- **Last verified:** `2026-09-24`

### Canonical ownership

Newsroom editorial data is controlled through **Media Control**.

`Media Control`
→ `backend/SKANDI_CORE/publicContent.web`
→ `backend/SKANDI_CORE/publicContent`
→ `public.newsroom_categories`
→ `public.newsroom_articles`
→ `public.newsroom_media_assets`
→ `public.newsroom_press_contacts`

The customer-facing Newsroom reads the same canonical records through the public-safe `getPublicNewsroomData` projection. It does not contain hard-coded posts, contacts or media-library entries.

Physical media files used by Media Control remain owned by `backend/SKANDI_CORE/assets.web` / the Asset Library. The public Newsroom consumes only URLs and public editorial metadata that Media Control writes into the newsroom editorial records.

Newsletter signup is not newsroom editorial content. It remains owned by the existing customer-session newsletter service (`NewsletterSubscribers`) through `subscribeCustomerNewsletter`.

### Cross-layer messages

HTML → page:
- `NEWSROOM_READY`
- `NEWSROOM_REFRESH`
- `NEWSROOM_SUBSCRIBE`

Page → HTML:
- `NEWSROOM_HOST_READY`
- `NEWSROOM_DATA`
- `NEWSROOM_SUBSCRIBE_RESULT`
- `NEWSROOM_ERROR`

### B-011.2 changes

- Preserved the B-011.1 Media Control ownership and public-content architecture unchanged.
- Normalized the entire customer-facing Newsroom to the exact shared Home palette:
  - `#022e64` primary navy
  - `#0b3a7a` secondary navy
  - `#285ca8` soft blue
  - `#d7e6ff` light blue
  - `#f6faff` pale surface
  - `#f7faff` page background
  - `#dbe3ef` border
  - `#eef2f7` soft border
  - `#111` primary text
  - `#555` body text
  - `#667085` muted text
  - `#5FC7CF` cyan
  - Home shadow values `0 8px 26px rgba(0,0,0,.08)` and `0 14px 34px rgba(0,0,0,.12)`.
- Added the exact premium global-chrome support colors used by the customer header/footer family:
  - `#03111f` ink
  - `#061a30` ink-soft
  - `#9de0e5` aqua-soft
  - `#fbfaf6` ivory
  - `#f5f1ea` porcelain
  - `#d1bc98` champagne.
- Removed close-but-noncanonical Newsroom-only color substitutes such as `#52657b`, `#dfe5ed`, `#edf1f5`, `#3d8890`, `#e8f1f8`, `#f9fbfc`, `#eaf2f8`, and `#edf3f8`.
- Kept Newsroom's own editorial layout; this is palette convergence, not a Home layout copy.
- Added one restrained aqua→champagne accent line to the dark subscription CTA so the page transitions cleanly into the premium global footer treatment.
- Global header/footer remain owned by `masterPage.js`; Newsroom does not duplicate or recolor them.
- No editorial content, Media Control contract, public-data contract, newsletter behavior, Supabase resource, or database data changed.

### Current live-data note

At verification time, the four existing Newsroom tables were present but contained zero records. The page therefore intentionally shows empty states until content is created/published from Media Control. No sample production data was inserted.

---

## COMPLETE INTENDED LIVE HTML SOURCE

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#022e64">
<title>SKANDI Newsroom · B-011.2</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
:root{
  /* Shared SKANDI customer B-011 palette — Home + global chrome */
  --sk-navy:#022e64;
  --sk-blue:#0b3a7a;
  --sk-blue-soft:#285ca8;
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

  /* Shared premium global-header/footer family */
  --sk-ink:#03111f;
  --sk-ink-soft:#061a30;
  --sk-aqua-soft:#9de0e5;
  --sk-ivory:#fbfaf6;
  --sk-porcelain:#f5f1ea;
  --sk-champagne:#d1bc98;

  --sk-white:#fff;
  --sk-shadow:0 8px 26px rgba(0,0,0,.08);
  --sk-shadow-strong:0 14px 34px rgba(0,0,0,.12);
  --sk-radius:18px;
  --sk-max:1180px;
}
*{box-sizing:border-box}
html,body{
  margin:0;
  min-height:100%;
  background:#fff;
  color:var(--sk-text);
  font-family:"Montserrat",system-ui,-apple-system,"Segoe UI",sans-serif;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
body{overflow-x:hidden}
button,input,select{font:inherit}
button{cursor:pointer}
img,video{display:block;max-width:100%}
a{color:inherit}
.hidden{display:none!important}
button:focus-visible,input:focus-visible,select:focus-visible,a:focus-visible{
  outline:3px solid rgba(95,199,207,.45);
  outline-offset:3px;
}

.newsroom{
  width:100%;
  padding:0 0 78px;
  background:
    radial-gradient(circle at 8% 8%,rgba(95,199,207,.07),transparent 22%),
    linear-gradient(180deg,#fff 0%,#fff 42%,var(--sk-pale) 100%);
}
.container{
  width:min(100%,var(--sk-max));
  margin:0 auto;
  padding:0 24px;
}

/* Intro */
.intro{
  padding:64px 0 26px;
  display:grid;
  grid-template-columns:minmax(0,1fr) minmax(340px,.78fr);
  gap:54px;
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
  border-radius:99px;
  background:var(--sk-cyan);
}
.intro h1{
  margin:8px 0 0;
  max-width:720px;
  color:var(--sk-navy);
  font-size:clamp(38px,5.6vw,60px);
  line-height:.98;
  letter-spacing:-.052em;
  font-weight:750;
}
.intro-copy{
  margin:0;
  color:var(--sk-body);
  font-size:13px;
  line-height:1.75;
}
.search-panel{
  margin:22px 0 0;
  padding:8px;
  display:grid;
  grid-template-columns:minmax(0,1fr) auto;
  gap:8px;
  border:1px solid var(--sk-border);
  border-radius:15px;
  background:#fff;
  box-shadow:0 7px 22px rgba(2,46,100,.05);
}
.search{
  min-width:0;
  height:44px;
  border:0;
  outline:0;
  border-radius:10px;
  padding:0 12px;
  background:var(--sk-pale);
  color:var(--sk-ink);
  font-size:11px;
  font-weight:600;
}
.select{
  height:44px;
  min-width:150px;
  border:1px solid var(--sk-border);
  outline:0;
  border-radius:10px;
  padding:0 12px;
  background:#fff;
  color:var(--sk-navy);
  font-size:10px;
  font-weight:750;
}

/* Categories */
.tabs{
  display:flex;
  gap:5px;
  overflow-x:auto;
  margin:18px 0 24px;
  padding:4px;
  border:1px solid var(--sk-border-soft);
  border-radius:12px;
  background:rgba(2,46,100,.035);
}
.tab{
  flex:0 0 auto;
  min-height:34px;
  padding:0 13px;
  border:0;
  border-radius:8px;
  background:transparent;
  color:var(--sk-muted);
  font-size:9px;
  font-weight:850;
  white-space:nowrap;
  transition:background .18s ease,color .18s ease,box-shadow .18s ease;
}
.tab:hover{color:var(--sk-navy)}
.tab.active{
  background:#fff;
  color:var(--sk-navy);
  box-shadow:0 2px 8px rgba(0,0,0,.07);
}

/* Featured story */
.feature{
  position:relative;
  min-height:410px;
  display:grid;
  grid-template-columns:minmax(0,1.28fr) minmax(300px,.72fr);
  overflow:hidden;
  margin:0 0 54px;
  border:1px solid var(--sk-border);
  border-radius:22px;
  background:#fff;
  box-shadow:var(--sk-shadow);
}
.feature-media{
  position:relative;
  min-height:410px;
  overflow:hidden;
  background:
    radial-gradient(circle at 78% 18%,rgba(95,199,207,.22),transparent 26%),
    linear-gradient(145deg,var(--sk-light),var(--sk-pale));
}
.feature-media img,.feature-media video{
  width:100%;
  height:100%;
  min-height:410px;
  object-fit:cover;
}
.feature-placeholder{
  min-height:410px;
  height:100%;
  display:grid;
  place-items:center;
  color:var(--sk-navy);
  font-size:11px;
  font-weight:850;
  letter-spacing:.10em;
  text-transform:uppercase;
}
.feature-copy{
  position:relative;
  padding:36px 34px 34px;
  display:flex;
  flex-direction:column;
  justify-content:center;
  background:
    radial-gradient(circle at 100% 0%,rgba(95,199,207,.09),transparent 30%),
    #fff;
}
.kicker{
  color:var(--sk-cyan);
  font-size:8px;
  font-weight:900;
  letter-spacing:.13em;
  text-transform:uppercase;
}
.feature h2{
  margin:8px 0 10px;
  color:var(--sk-navy);
  font-size:clamp(26px,3vw,38px);
  line-height:1.05;
  letter-spacing:-.04em;
}
.feature p{
  margin:0 0 20px;
  color:var(--sk-body);
  font-size:11px;
  line-height:1.65;
}

/* Buttons */
.btn{
  min-height:42px;
  padding:0 16px;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  gap:7px;
  width:max-content;
  max-width:100%;
  border:1px solid transparent;
  border-radius:10px;
  background:linear-gradient(135deg,var(--sk-navy),var(--sk-ink-soft));
  color:#fff;
  text-decoration:none;
  font-size:9px;
  font-weight:850;
  letter-spacing:.05em;
  transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease;
}
.btn:hover{
  transform:translateY(-1px);
  box-shadow:0 9px 24px rgba(2,46,100,.20);
}
.btn.secondary{
  background:#fff;
  color:var(--sk-navy);
  border-color:var(--sk-border);
  box-shadow:none;
}

/* News cards */
.grid{
  display:grid;
  grid-template-columns:repeat(3,minmax(0,1fr));
  gap:15px;
}
.card{
  min-width:0;
  overflow:hidden;
  display:flex;
  flex-direction:column;
  border:1px solid var(--sk-border-soft);
  border-radius:17px;
  background:#fff;
  box-shadow:0 5px 18px rgba(2,46,100,.05);
  cursor:pointer;
  transition:transform .22s cubic-bezier(.16,1,.3,1),box-shadow .22s ease,border-color .18s ease;
}
.card:hover{
  transform:translateY(-3px);
  border-color:rgba(95,199,207,.48);
  box-shadow:0 14px 30px rgba(2,46,100,.10);
}
.card-media{
  height:190px;
  overflow:hidden;
  background:linear-gradient(145deg,var(--sk-light),var(--sk-pale));
}
.card-media img{
  width:100%;
  height:100%;
  object-fit:cover;
  transition:transform .32s ease;
}
.card:hover .card-media img{transform:scale(1.025)}
.card-placeholder{
  height:100%;
  display:grid;
  place-items:center;
  color:var(--sk-navy);
  font-size:9px;
  font-weight:850;
  letter-spacing:.08em;
  text-transform:uppercase;
}
.card-body{
  flex:1;
  display:flex;
  flex-direction:column;
  gap:7px;
  padding:17px;
}
.card h3{
  margin:0;
  color:var(--sk-navy);
  font-size:16px;
  line-height:1.25;
  letter-spacing:-.025em;
}
.card p{
  flex:1;
  margin:0;
  color:var(--sk-body);
  font-size:10px;
  line-height:1.58;
}
.meta{
  margin-top:auto;
  color:var(--sk-muted);
  font-size:8px;
  line-height:1.45;
  font-weight:650;
}

/* Detail */
.detail{
  display:none;
  overflow:hidden;
  max-width:920px;
  margin:34px auto 52px;
  border:1px solid var(--sk-border);
  border-radius:20px;
  background:#fff;
  box-shadow:var(--sk-shadow-strong);
}
.detail.active{display:block}
.detail-hero{
  min-height:300px;
  max-height:440px;
  overflow:hidden;
  background:var(--sk-bg);
}
.detail-hero img{
  width:100%;
  height:100%;
  min-height:300px;
  max-height:440px;
  object-fit:cover;
}
.detail-body{padding:28px}
.detail-body h2{
  margin:18px 0 8px;
  color:var(--sk-navy);
  font-size:clamp(25px,3.5vw,36px);
  line-height:1.08;
  letter-spacing:-.04em;
}
.detail-meta{
  margin-bottom:20px;
  color:var(--sk-muted);
  font-size:9px;
  font-weight:650;
}
.detail-content{
  color:var(--sk-body);
  font-size:13px;
  line-height:1.78;
}
.detail-content h2,.detail-content h3,.detail-content h4{color:var(--sk-navy)}
.detail-content a{color:var(--sk-blue);font-weight:700}

/* Shared section heads */
.section-head{
  display:grid;
  grid-template-columns:minmax(0,1fr) auto;
  gap:24px;
  align-items:end;
  margin:62px 0 18px;
}
.section-head h2{
  margin:5px 0 0;
  color:var(--sk-navy);
  font-size:clamp(25px,3.2vw,34px);
  line-height:1.08;
  letter-spacing:-.035em;
}
.section-head p{
  max-width:650px;
  margin:7px 0 0;
  color:var(--sk-body);
  font-size:10px;
  line-height:1.6;
}

/* Media library */
.media-section{
  margin-top:62px;
  padding:30px;
  border:1px solid var(--sk-border);
  border-radius:22px;
  background:var(--sk-pale);
}
.media-section .section-head{margin:0 0 18px}
.media-grid{
  display:grid;
  grid-template-columns:repeat(3,minmax(0,1fr));
  gap:13px;
}
.media-card{
  min-width:0;
  padding:15px;
  border:1px solid var(--sk-border-soft);
  border-radius:15px;
  background:#fff;
  box-shadow:0 4px 14px rgba(2,46,100,.04);
}
.media-thumb{
  height:130px;
  overflow:hidden;
  display:grid;
  place-items:center;
  margin-bottom:12px;
  border-radius:11px;
  background:var(--sk-bg);
  color:var(--sk-navy);
  font-size:9px;
  font-weight:800;
}
.media-thumb img{width:100%;height:100%;object-fit:cover}
.media-card h3{
  margin:0 0 5px;
  color:var(--sk-navy);
  font-size:13px;
}
.media-card p{
  margin:0 0 12px;
  color:var(--sk-body);
  font-size:9px;
  line-height:1.55;
}
.rights{
  margin-top:11px;
  padding-top:10px;
  border-top:1px solid var(--sk-border-soft);
  color:var(--sk-muted);
  font-size:8px;
  line-height:1.55;
}

/* Contacts */
.contact-grid{
  display:grid;
  grid-template-columns:repeat(3,minmax(0,1fr));
  gap:12px;
}
.contact-card{
  min-width:0;
  padding:18px;
  border:1px solid var(--sk-border-soft);
  border-radius:14px;
  background:#fff;
  box-shadow:0 4px 13px rgba(2,46,100,.035);
}
.contact-card h3{
  margin:0;
  color:var(--sk-navy);
  font-size:13px;
}
.contact-card p,.contact-card a{
  margin:7px 0 0;
  color:var(--sk-body);
  font-size:9px;
  line-height:1.55;
}
.contact-card a{color:var(--sk-blue);font-weight:700}

/* Subscription */
.subscribe{
  position:relative;
  overflow:hidden;
  margin:62px 0 0;
  padding:34px;
  display:grid;
  grid-template-columns:minmax(0,1fr) auto;
  gap:24px;
  align-items:center;
  border-radius:20px;
  background:
    radial-gradient(circle at 88% 14%,rgba(95,199,207,.18),transparent 28%),
    linear-gradient(135deg,var(--sk-navy),var(--sk-blue));
  color:#fff;
  box-shadow:0 12px 30px rgba(2,46,100,.15);
}
.subscribe::after{
  content:"";
  position:absolute;
  left:34px;
  right:34px;
  bottom:0;
  height:2px;
  background:linear-gradient(90deg,transparent,var(--sk-cyan),var(--sk-champagne),transparent);
  opacity:.78;
}
.subscribe h2{
  margin:6px 0 7px;
  color:#fff;
  font-size:26px;
  letter-spacing:-.03em;
}
.subscribe p{
  margin:0;
  color:rgba(255,255,255,.75);
  font-size:10px;
  line-height:1.6;
}
.subscribe-form{
  display:flex;
  gap:7px;
  padding:6px;
  border:1px solid rgba(255,255,255,.15);
  border-radius:13px;
  background:rgba(255,255,255,.08);
}
.subscribe input{
  min-width:260px;
  height:42px;
  border:0;
  outline:0;
  border-radius:9px;
  padding:0 12px;
  background:#fff;
  color:var(--sk-ink);
  font-size:10px;
}

.empty{
  grid-column:1/-1;
  padding:28px;
  text-align:center;
  border:1px solid var(--sk-border);
  border-radius:14px;
  background:#fff;
  color:var(--sk-muted);
  font-size:10px;
  line-height:1.6;
}
.toast{
  position:fixed;
  right:16px;
  bottom:16px;
  z-index:1000;
  display:none;
  max-width:360px;
  padding:12px 14px;
  border-radius:10px;
  background:var(--sk-navy);
  color:#fff;
  box-shadow:var(--sk-shadow-strong);
  font-size:10px;
  line-height:1.5;
}

@media(max-width:940px){
  .intro{grid-template-columns:1fr;gap:16px}
  .feature{grid-template-columns:1fr}
  .feature-media,.feature-media img,.feature-media video,.feature-placeholder{min-height:300px}
  .grid,.media-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
  .contact-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
}
@media(max-width:680px){
  .container{padding:0 16px}
  .intro{padding:46px 0 18px}
  .intro h1{font-size:40px}
  .search-panel{grid-template-columns:1fr}
  .select{width:100%}
  .feature{margin-bottom:42px;border-radius:17px}
  .feature-copy{padding:25px 20px}
  .feature-media,.feature-media img,.feature-media video,.feature-placeholder{min-height:240px}
  .grid,.media-grid,.contact-grid{grid-template-columns:1fr}
  .card-media{height:180px}
  .section-head{grid-template-columns:1fr;gap:12px;margin-top:48px}
  .media-section{margin-top:48px;padding:22px 15px;border-radius:17px}
  .subscribe{
    grid-template-columns:1fr;
    margin-top:48px;
    padding:26px 20px;
    border-radius:17px;
  }
  .subscribe-form{flex-direction:column}
  .subscribe input{width:100%;min-width:0}
  .subscribe .btn{width:100%}
  .detail-body{padding:22px 18px}
}
@media(prefers-reduced-motion:reduce){
  *,*::before,*::after{animation:none!important;transition-duration:.01ms!important;scroll-behavior:auto!important}
}
</style>
</head>
<body>
<main class="newsroom" id="sk-newsroom">
  <div class="container">
    <header class="intro" data-section-id="newsroom-intro">
      <div>
        <div class="eyebrow" data-content-id="newsroom-eyebrow">SKANDI NEWSROOM</div>
        <h1 data-content-id="newsroom-h1">Newsroom</h1>
      </div>
      <p class="intro-copy" data-content-id="newsroom-copy">
        Official press releases, company updates and approved media resources from SKANDI.
      </p>
    </header>

    <div class="search-panel" data-section-id="newsroom-search">
      <input id="search" class="search" aria-label="Search newsroom" placeholder="Search newsroom, press releases or media…">
      <select id="typeFilter" class="select" aria-label="Filter newsroom by content type">
        <option value="all">All content</option>
      </select>
    </div>

    <nav class="tabs" id="tabs" aria-label="Newsroom categories"></nav>

    <section class="feature" id="hero" data-section-id="newsroom-featured"></section>
    <section class="grid" id="grid" data-section-id="newsroom-posts"></section>
    <article class="detail" id="detail" aria-live="polite"></article>

    <section class="media-section" data-section-id="newsroom-media-library">
      <div class="section-head">
        <div>
          <div class="eyebrow" data-content-id="newsroom-media-eyebrow">PRESS RESOURCES</div>
          <h2 data-content-id="newsroom-media-h2">Media Library</h2>
          <p data-content-id="newsroom-media-copy">
            Approved SKANDI media resources for editorial and press use. Usage rights and credit information are shown with every asset.
          </p>
        </div>
        <button class="btn secondary" id="mediaToggle" type="button">View media</button>
      </div>
      <div class="media-grid hidden" id="mediaGrid"></div>
    </section>

    <section data-section-id="newsroom-contacts">
      <div class="section-head">
        <div>
          <div class="eyebrow" data-content-id="newsroom-contacts-eyebrow">MEDIA RELATIONS</div>
          <h2 data-content-id="newsroom-contacts-h2">Media Contacts</h2>
          <p data-content-id="newsroom-contacts-copy">
            For press enquiries, contact the appropriate SKANDI communications representative.
          </p>
        </div>
      </div>
      <div class="contact-grid" id="contacts"></div>
    </section>

    <section class="subscribe" data-section-id="newsroom-subscribe">
      <div>
        <div class="eyebrow" style="color:var(--sk-aqua-soft)" data-content-id="newsroom-subscribe-eyebrow">SKANDI UPDATES</div>
        <h2 data-content-id="newsroom-subscribe-h2">Get SKANDI updates</h2>
        <p data-content-id="newsroom-subscribe-copy">Subscribe to public newsroom updates and press releases.</p>
      </div>
      <div class="subscribe-form">
        <input id="subEmail" type="email" autocomplete="email" aria-label="Email address" placeholder="Email address">
        <button class="btn" id="subBtn" type="button">Subscribe</button>
      </div>
    </section>
  </div>
</main>

<div class="toast" id="toast" role="status" aria-live="polite"></div>

<script>
(()=>{
const SOURCE="SKANDI_PUBLIC_NEWSROOM";
const PARENT="SKANDI_WIX_PARENT";
const PARENT_ORIGIN=(()=>{
  try{return document.referrer?new URL(document.referrer).origin:"*"}catch(_){return"*"}
})();

let categories=[];
let posts=[];
let media=[];
let contacts=[];
let settings={};
let activeCat="all";
let selected=null;

const $=id=>document.getElementById(id);
const esc=value=>String(value??"").replace(/[&<>'"]/g,c=>({
  "&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"
}[c]));

function post(type,payload={}){
  window.parent.postMessage({
    source:SOURCE,
    type,
    payload,
    timestamp:new Date().toISOString()
  },PARENT_ORIGIN);
}

function fmt(value){
  if(!value)return"";
  const d=new Date(value);
  return Number.isNaN(d.getTime())
    ? String(value)
    : d.toLocaleDateString(undefined,{year:"numeric",month:"short",day:"2-digit"});
}

function toast(message){
  const el=$("toast");
  el.textContent=String(message||"");
  el.style.display="block";
  clearTimeout(toast.timer);
  toast.timer=setTimeout(()=>el.style.display="none",2800);
}

function safeUrl(value){
  const raw=String(value||"").trim();
  if(!raw)return"";
  try{
    const url=new URL(raw,window.location.origin);
    if(["https:","http:"].includes(url.protocol))return url.href;
  }catch(_){}
  return"";
}

function sanitizeRichHtml(value){
  const template=document.createElement("template");
  template.innerHTML=String(value||"");

  template.content.querySelectorAll("script,style,iframe,object,embed,form,link,meta").forEach(node=>node.remove());

  template.content.querySelectorAll("*").forEach(node=>{
    [...node.attributes].forEach(attr=>{
      const name=attr.name.toLowerCase();
      if(name.startsWith("on")||name==="style"||name==="srcdoc"){
        node.removeAttribute(attr.name);
        return;
      }
      if((name==="href"||name==="src")){
        const val=String(attr.value||"").trim();
        if(/^javascript:/i.test(val)||/^data:text\/html/i.test(val))node.removeAttribute(attr.name);
      }
    });

    if(node.tagName==="A"){
      const href=String(node.getAttribute("href")||"").trim();
      if(href && !/^(https?:|mailto:|\/)/i.test(href))node.removeAttribute("href");
      node.setAttribute("rel","noopener noreferrer");
    }
  });

  return template.innerHTML;
}

function categoryTitle(id){
  return categories.find(c=>c.categoryId===id)?.title||id||"News";
}

function filtered(){
  const query=($("search").value||"").toLowerCase().trim();
  const type=$("typeFilter").value;
  return posts.filter(item=>{
    if(activeCat!=="all"&&item.categoryId!==activeCat)return false;
    if(type!=="all"&&String(item.contentType||"")!==type)return false;
    if(!query)return true;
    return[
      item.title,
      item.summary,
      item.bodyPlainText,
      Array.isArray(item.tags)?item.tags.join(" "):item.tags,
      item.location,
      item.contentType,
      categoryTitle(item.categoryId)
    ].join(" ").toLowerCase().includes(query);
  });
}

function renderTabs(){
  const all=[{categoryId:"all",title:"All"},...categories];
  $("tabs").innerHTML=all.map(c=>`
    <button class="tab ${activeCat===c.categoryId?"active":""}" type="button"
      data-cat="${esc(c.categoryId)}">${esc(c.title)}</button>
  `).join("");
}

function renderTypes(){
  const current=$("typeFilter").value||"all";
  const types=[...new Set(posts.map(p=>String(p.contentType||"").trim()).filter(Boolean))].sort();
  $("typeFilter").innerHTML=`<option value="all">All content</option>`+
    types.map(type=>`<option value="${esc(type)}">${esc(type)}</option>`).join("");
  if(types.includes(current))$("typeFilter").value=current;
}

function mediaMarkup(item,className){
  const video=safeUrl(item.heroVideoUrl);
  const image=safeUrl(item.heroImage||item.thumbnailImage||item.imageUrl);
  if(video){
    return `<video class="${className}" autoplay muted loop playsinline ${image?`poster="${esc(image)}"`:""}>
      <source src="${esc(video)}" type="video/mp4">
    </video>`;
  }
  if(image)return `<img class="${className}" src="${esc(image)}" alt="${esc(item.title||"Newsroom")}">`;
  return `<div class="feature-placeholder">SKANDI Newsroom</div>`;
}

function renderHero(){
  const rows=filtered();
  const item=
    (selected&&rows.some(row=>row.postId===selected.postId)?selected:null) ||
    rows.find(row=>row.featured===true) ||
    rows[0];

  if(!item){
    selected=null;
    $("hero").innerHTML=`<div class="empty" style="align-self:stretch;display:grid;place-items:center">No published newsroom posts yet.</div>`;
    return;
  }

  selected=item;
  $("hero").innerHTML=`
    <div class="feature-media" data-media-role="newsroom-featured-media">${mediaMarkup(item,"")}</div>
    <div class="feature-copy">
      <div class="kicker">${esc(item.kicker||categoryTitle(item.categoryId))}</div>
      <h2>${esc(item.title)}</h2>
      <p>${esc(item.summary||"")}</p>
      <div class="meta" style="margin-bottom:16px">${esc(fmt(item.publishDate))}${item.location?" · "+esc(item.location):""}</div>
      <button class="btn" type="button" data-open="${esc(item.postId)}">Read article</button>
    </div>`;
}

function renderGrid(){
  const rows=filtered();
  $("grid").innerHTML=rows.map(item=>{
    const image=safeUrl(item.thumbnailImage||item.heroImage||item.imageUrl);
    return `<article class="card" data-open="${esc(item.postId)}" tabindex="0" role="button" aria-label="Open ${esc(item.title)}">
      <div class="card-media">
        ${image
          ? `<img src="${esc(image)}" alt="${esc(item.title)}">`
          : `<div class="card-placeholder">SKANDI Newsroom</div>`}
      </div>
      <div class="card-body">
        <div class="kicker">${esc(categoryTitle(item.categoryId))}</div>
        <h3>${esc(item.title)}</h3>
        <p>${esc(item.summary||"")}</p>
        <div class="meta">${esc(fmt(item.publishDate))}${item.location?" · "+esc(item.location):""}</div>
      </div>
    </article>`;
  }).join("")||`<div class="empty">No matching newsroom posts found.</div>`;
}

function renderDetail(item){
  if(!item){
    $("detail").classList.remove("active");
    return;
  }

  const image=safeUrl(item.heroImage||item.thumbnailImage||item.imageUrl);
  const content=item.bodyHtml
    ? sanitizeRichHtml(item.bodyHtml)
    : `<p>${esc(item.bodyPlainText||item.summary||"")}</p>`;

  $("detail").classList.add("active");
  $("detail").innerHTML=`
    ${image?`<div class="detail-hero"><img src="${esc(image)}" alt="${esc(item.title)}"></div>`:""}
    <div class="detail-body">
      <button class="btn secondary" type="button" data-close-detail>← Back to newsroom</button>
      <h2>${esc(item.title)}</h2>
      <div class="detail-meta">${esc(categoryTitle(item.categoryId))} · ${esc(fmt(item.publishDate))}${item.location?" · "+esc(item.location):""}</div>
      <div class="detail-content">${content}</div>
    </div>`;

  setTimeout(()=>$("detail").scrollIntoView({behavior:"smooth",block:"start"}),50);
}

function renderMedia(){
  $("mediaGrid").innerHTML=media.map(asset=>{
    const fileUrl=safeUrl(asset.fileUrl||asset.url);
    const preview=safeUrl(asset.previewImage||asset.imageUrl);
    return `<article class="media-card">
      <div class="media-thumb">${preview?`<img src="${esc(preview)}" alt="${esc(asset.title||"Media asset")}">`:"Media asset"}</div>
      <h3>${esc(asset.title||"Media asset")}</h3>
      <p>${esc(asset.description||"")}</p>
      ${fileUrl?`<a class="btn" href="${esc(fileUrl)}" target="_blank" rel="noopener noreferrer" ${asset.downloadName?`download="${esc(asset.downloadName)}"`:""}>Open asset</a>`:""}
      <div class="rights">
        <strong>${esc(asset.licenseType||"Press Use")}</strong><br>
        ${esc(asset.creditLine||"© SKANDI Group")}<br>
        ${esc(asset.usageRights||"Use only according to the listed rights.")}
      </div>
    </article>`;
  }).join("")||`<div class="empty">No public media assets are available yet.</div>`;
}

function renderContacts(){
  $("contacts").innerHTML=contacts.map(contact=>`
    <article class="contact-card">
      <h3>${esc(contact.name||"SKANDI Media Relations")}</h3>
      <p><strong>${esc(contact.roleTitle||"Press contact")}</strong>${contact.region?`<br>${esc(contact.region)}`:""}</p>
      ${contact.email?`<p><a href="mailto:${esc(contact.email)}">${esc(contact.email)}</a></p>`:""}
      ${contact.phone?`<p>${esc(contact.phone)}</p>`:""}
      ${contact.availabilityText?`<p>${esc(contact.availabilityText)}</p>`:""}
    </article>
  `).join("")||`<div class="empty">Media contacts will be added through Media Control.</div>`;
}

function render(){
  renderTabs();
  renderTypes();
  renderHero();
  renderGrid();
  renderMedia();
  renderContacts();
}

window.addEventListener("message",event=>{
  let message=event.data;
  if(typeof message==="string"){
    try{message=JSON.parse(message)}catch(_){return}
  }
  if(!message||typeof message!=="object")return;
  if(message.source&&message.source!==PARENT)return;

  const payload=message.payload||{};

  if(message.type==="NEWSROOM_DATA"){
    categories=Array.isArray(payload.categories)?payload.categories:[];
    posts=Array.isArray(payload.posts)?payload.posts:[];
    media=Array.isArray(payload.mediaAssets)?payload.mediaAssets:[];
    contacts=Array.isArray(payload.pressContacts)?payload.pressContacts:[];
    settings=payload.settings&&typeof payload.settings==="object"?payload.settings:{};
    selected=null;
    render();
    return;
  }

  if(message.type==="NEWSROOM_SUBSCRIBE_RESULT"){
    toast(payload.message||payload.error||"Subscription updated.");
    if(payload.ok!==false)$("subEmail").value="";
    return;
  }

  if(message.type==="NEWSROOM_ERROR"){
    toast(payload.message||"Newsroom unavailable.");
  }
});

document.addEventListener("click",event=>{
  const tab=event.target.closest("[data-cat]");
  if(tab){
    activeCat=tab.dataset.cat||"all";
    selected=null;
    renderTabs();
    renderHero();
    renderGrid();
    return;
  }

  const open=event.target.closest("[data-open]");
  if(open){
    const item=posts.find(post=>String(post.postId)===String(open.dataset.open));
    if(item){
      selected=item;
      renderHero();
      renderDetail(item);
    }
    return;
  }

  if(event.target.closest("[data-close-detail]")){
    $("detail").classList.remove("active");
    document.querySelector("[data-section-id='newsroom-posts']")?.scrollIntoView({behavior:"smooth",block:"start"});
  }
});

document.addEventListener("keydown",event=>{
  const card=event.target.closest(".card[data-open]");
  if(card&&(event.key==="Enter"||event.key===" ")){
    event.preventDefault();
    card.click();
  }
});

$("search").addEventListener("input",()=>{
  selected=null;
  renderHero();
  renderGrid();
});
$("typeFilter").addEventListener("change",()=>{
  selected=null;
  renderHero();
  renderGrid();
});
$("mediaToggle").addEventListener("click",()=>{
  const grid=$("mediaGrid");
  const hidden=grid.classList.toggle("hidden");
  $("mediaToggle").textContent=hidden?"View media":"Hide media";
});
$("subBtn").addEventListener("click",()=>{
  const email=$("subEmail").value.trim();
  if(!email||!email.includes("@")){
    toast("Enter a valid email address.");
    return;
  }
  post("NEWSROOM_SUBSCRIBE",{email,interests:[activeCat]});
});

post("NEWSROOM_READY",{});
})();
</script>
</body>
</html>
```
