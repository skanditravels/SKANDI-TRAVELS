# Travel Info

STATUS: NEEDS REVIEW
SLUG: /travel-info
WIX PAGE: Travel Info.m43d6
AREA: SKANDI
LIVE HTML: YES
ELEMENT: #travelInfoHtml
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
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#022e64">
<title>SKANDI Travel Info · B-011.1</title>
<style>
:root{
  --sk-blue:#022e64;
  --sk-blue-2:#0b417f;
  --sk-blue-3:#174f8d;
  --sk-cyan:#5FC7CF;
  --sk-cyan-soft:#e9f8fa;
  --sk-sky:#eef6ff;
  --sk-pale:#f7faff;
  --sk-white:#fff;
  --sk-text:#111827;
  --sk-body:#455468;
  --sk-muted:#6b7789;
  --sk-border:#dce5ef;
  --sk-border-soft:#edf2f7;
  --sk-success:#087443;
  --sk-danger:#b42318;
  --sk-warning:#9a6700;
  --sk-shadow:0 12px 34px rgba(2,46,100,.09);
  --sk-shadow-lg:0 22px 60px rgba(2,46,100,.15);
  --sk-radius:16px;
  --sk-radius-lg:26px;
}
*{box-sizing:border-box}
html,body{
  margin:0;
  width:100%;
  min-height:100%;
  background:#fff;
  color:var(--sk-text);
  font-family:Montserrat,Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
  -webkit-font-smoothing:antialiased;
}
body{overflow-x:hidden}
button,input,select,textarea{font:inherit}
button{cursor:pointer}
button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible{
  outline:3px solid rgba(95,199,207,.35);
  outline-offset:2px;
}
img{max-width:100%;display:block}
.hidden{display:none!important}
.shell{width:min(1180px,calc(100% - 40px));margin:0 auto}
.eyebrow{
  font-size:11px;
  text-transform:uppercase;
  letter-spacing:.16em;
  font-weight:900;
  color:var(--sk-cyan);
}
.section{padding:58px 0}
.section.compact{padding:34px 0}
.section-head{
  display:flex;
  align-items:flex-end;
  justify-content:space-between;
  gap:22px;
  margin-bottom:22px;
}
.section-head h2{
  margin:0 0 7px;
  color:var(--sk-blue);
  font-size:clamp(25px,3vw,36px);
  line-height:1.05;
  letter-spacing:-.045em;
}
.section-head p{
  margin:0;
  max-width:720px;
  color:var(--sk-muted);
  font-size:14px;
  line-height:1.7;
}
.link-btn{
  border:0;
  background:transparent;
  color:var(--sk-blue);
  font-weight:800;
  font-size:12px;
  padding:6px 0;
}
.primary{
  appearance:none;
  border:0;
  border-radius:999px;
  background:var(--sk-blue);
  color:#fff;
  font-weight:850;
  padding:13px 20px;
  font-size:12px;
  transition:.18s ease;
}
.primary:hover{background:#073b78;transform:translateY(-1px)}
.secondary{
  appearance:none;
  border:1px solid var(--sk-border);
  border-radius:999px;
  background:#fff;
  color:var(--sk-blue);
  font-weight:850;
  padding:12px 18px;
  font-size:12px;
}
.secondary:hover{border-color:#b9c8d8;background:#f9fbfd}
.icon-btn{
  width:42px;height:42px;border-radius:50%;
  border:1px solid var(--sk-border);
  background:#fff;color:var(--sk-blue);
  display:grid;place-items:center;
  font-weight:900;
}

/* HERO */
.hero{
  position:relative;
  overflow:hidden;
  background:
    radial-gradient(circle at 86% 8%, rgba(95,199,207,.26), transparent 25%),
    linear-gradient(140deg,#f0f7ff 0%,#f8fbff 44%,#ffffff 100%);
  border-bottom:1px solid var(--sk-border-soft);
}
.hero:after{
  content:"";
  position:absolute;
  width:520px;height:520px;
  border:1px solid rgba(2,46,100,.06);
  border-radius:50%;
  right:-180px;bottom:-330px;
}
.hero-inner{
  min-height:450px;
  padding:74px 0 62px;
  display:grid;
  grid-template-columns:minmax(0,1fr) 360px;
  gap:54px;
  align-items:center;
}
.hero h1{
  margin:10px 0 16px;
  font-size:clamp(42px,6vw,72px);
  line-height:.95;
  letter-spacing:-.065em;
  font-weight:650;
  color:var(--sk-blue);
}
.hero-copy{
  color:#475569;
  font-size:16px;
  line-height:1.75;
  max-width:700px;
  margin:0 0 30px;
}
.hero-search{
  max-width:760px;
  display:flex;
  align-items:center;
  gap:8px;
  padding:9px 9px 9px 18px;
  background:#fff;
  border:1px solid #d4dfeb;
  border-radius:18px;
  box-shadow:var(--sk-shadow);
}
.search-mark{
  color:var(--sk-blue);
  font-size:20px;
  line-height:1;
}
.hero-search input{
  min-width:0;
  flex:1;
  border:0;
  outline:0;
  padding:8px 6px;
  font-size:14px;
  color:var(--sk-text);
}
.hero-search button{min-width:106px}
.hero-side{
  position:relative;
  min-height:285px;
  border-radius:30px;
  background:linear-gradient(155deg,var(--sk-blue),#0a4d91);
  box-shadow:var(--sk-shadow-lg);
  color:#fff;
  padding:28px;
  overflow:hidden;
}
.hero-side:before,.hero-side:after{
  content:"";position:absolute;border-radius:50%;
  background:rgba(95,199,207,.14)
}
.hero-side:before{width:230px;height:230px;right:-90px;top:-70px}
.hero-side:after{width:170px;height:170px;left:-85px;bottom:-100px}
.hero-side-content{position:relative;z-index:1}
.hero-side .eyebrow{color:#8ee1e7}
.hero-side h3{
  font-size:26px;
  line-height:1.08;
  letter-spacing:-.04em;
  margin:11px 0 12px
}
.hero-side p{
  color:#dbeafe;
  line-height:1.65;
  font-size:13px;
}
.hero-quick{
  margin-top:24px;
  display:grid;
  grid-template-columns:repeat(2,1fr);
  gap:9px;
}
.hero-quick button{
  border:1px solid rgba(255,255,255,.2);
  background:rgba(255,255,255,.08);
  color:#fff;
  border-radius:13px;
  padding:12px;
  text-align:left;
  font-size:11px;
  font-weight:800;
}
.hero-quick button:hover{background:rgba(255,255,255,.14)}

/* STATUS */
.status{
  display:none;
  margin-top:18px;
  border:1px solid #cfe9ec;
  background:#eefbfc;
  color:#245d65;
  padding:11px 14px;
  border-radius:12px;
  font-size:12px;
}
.status.show{display:block}

/* QUICK TOOLS */
.tools-strip{margin-top:-32px;position:relative;z-index:3}
.tools-grid{
  display:grid;
  grid-template-columns:repeat(4,minmax(0,1fr));
  gap:14px;
}
.tool-card{
  border:1px solid var(--sk-border);
  background:#fff;
  border-radius:18px;
  padding:19px;
  box-shadow:0 10px 26px rgba(2,46,100,.07);
  text-align:left;
  min-height:130px;
  transition:.18s ease;
}
.tool-card:hover{transform:translateY(-3px);box-shadow:var(--sk-shadow)}
.tool-icon{
  width:40px;height:40px;
  border-radius:12px;
  display:grid;place-items:center;
  color:var(--sk-blue);
  background:var(--sk-cyan-soft);
  font-weight:900;
  margin-bottom:13px;
}
.tool-card b{display:block;color:var(--sk-blue);font-size:14px;margin-bottom:5px}
.tool-card span{font-size:11px;color:var(--sk-muted);line-height:1.45}

/* JOURNEY GROUPS */
.journey-grid{
  display:grid;
  grid-template-columns:repeat(3,minmax(0,1fr));
  gap:16px;
}
.journey-card{
  border:1px solid var(--sk-border);
  background:#fff;
  border-radius:18px;
  padding:22px;
  text-align:left;
  min-height:178px;
  transition:.18s ease;
}
.journey-card:hover{
  border-color:#bfd2e4;
  transform:translateY(-2px);
  box-shadow:0 10px 26px rgba(2,46,100,.07);
}
.journey-num{
  width:34px;height:34px;border-radius:50%;
  display:grid;place-items:center;
  color:var(--sk-blue);background:var(--sk-sky);
  font-size:11px;font-weight:900;margin-bottom:18px
}
.journey-card h3{
  margin:0 0 8px;
  color:var(--sk-blue);
  font-size:18px;
  letter-spacing:-.025em
}
.journey-card p{margin:0;color:var(--sk-muted);font-size:12px;line-height:1.6}

/* FEATURED FAQ */
.question-grid{
  display:grid;
  grid-template-columns:repeat(2,minmax(0,1fr));
  gap:12px;
}
.question{
  border:1px solid var(--sk-border);
  background:#fff;
  border-radius:14px;
  padding:18px 19px;
  display:flex;
  gap:14px;
  align-items:flex-start;
  text-align:left;
}
.question:hover{background:#fbfdff;border-color:#c7d5e4}
.question-mark{
  width:30px;height:30px;flex:0 0 30px;
  border-radius:50%;
  background:var(--sk-cyan-soft);
  color:var(--sk-blue);
  display:grid;place-items:center;
  font-weight:900
}
.question strong{display:block;color:var(--sk-blue);font-size:13px;margin-bottom:4px}
.question p{margin:0;color:var(--sk-muted);font-size:11px;line-height:1.55}

/* LIBRARIES */
.library-section{background:var(--sk-pale);border-top:1px solid var(--sk-border-soft);border-bottom:1px solid var(--sk-border-soft)}
.library-grid{
  display:grid;
  grid-template-columns:repeat(4,minmax(0,1fr));
  gap:15px;
}
.library-card{
  background:#fff;
  border:1px solid var(--sk-border);
  border-radius:18px;
  min-height:185px;
  padding:20px;
  text-align:left;
  transition:.18s ease;
}
.library-card:hover{
  transform:translateY(-3px);
  border-color:#bfd2e4;
  box-shadow:var(--sk-shadow)
}
.library-card .lib-icon{
  width:44px;height:44px;border-radius:14px;
  background:#eef6ff;color:var(--sk-blue);
  display:grid;place-items:center;
  font-weight:900;margin-bottom:18px
}
.library-card h3{margin:0 0 7px;color:var(--sk-blue);font-size:16px}
.library-card p{margin:0 0 14px;color:var(--sk-muted);font-size:11px;line-height:1.55}
.count{
  display:inline-flex;
  border-radius:999px;
  background:#f2f6fa;
  color:#536377;
  padding:6px 9px;
  font-size:10px;
  font-weight:800
}

/* DIRECTORY */
.directory-toolbar{
  display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin-bottom:18px
}
.chip{
  border:1px solid var(--sk-border);
  border-radius:999px;background:#fff;color:var(--sk-blue);
  padding:9px 13px;font-size:10px;font-weight:850
}
.chip.active{background:var(--sk-blue);border-color:var(--sk-blue);color:#fff}
.results-grid{
  display:grid;
  grid-template-columns:repeat(3,minmax(0,1fr));
  gap:14px;
}
.result-card{
  border:1px solid var(--sk-border);
  border-radius:16px;
  background:#fff;
  overflow:hidden;
  text-align:left;
  min-height:190px;
  display:flex;
  flex-direction:column
}
.result-image{
  height:110px;background:
    linear-gradient(135deg,#eaf4ff,#f5fbff);
  display:grid;place-items:center;
  color:var(--sk-blue);
  font-size:24px;font-weight:900;
  overflow:hidden
}
.result-image img{width:100%;height:100%;object-fit:cover}
.result-body{padding:15px;display:flex;flex-direction:column;flex:1}
.result-kicker{
  color:var(--sk-cyan);font-size:9px;font-weight:900;
  text-transform:uppercase;letter-spacing:.11em;margin-bottom:6px
}
.result-card h4{
  margin:0 0 5px;color:var(--sk-blue);font-size:15px;line-height:1.25
}
.result-card p{margin:0;color:var(--sk-muted);font-size:10px;line-height:1.55}
.result-meta{margin-top:auto;padding-top:12px;display:flex;gap:6px;flex-wrap:wrap}
.meta{
  background:#f3f7fb;border-radius:999px;padding:5px 7px;
  color:#586b80;font-size:9px;font-weight:750
}

/* WEATHER */
.weather-band{
  border-radius:24px;
  background:linear-gradient(135deg,var(--sk-blue),#0a4f95);
  color:#fff;
  padding:30px;
  display:grid;
  grid-template-columns:minmax(0,1fr) auto;
  gap:24px;
  align-items:center;
  box-shadow:var(--sk-shadow)
}
.weather-band .eyebrow{color:#8ee1e7}
.weather-band h3{font-size:25px;margin:8px 0 6px;letter-spacing:-.04em}
.weather-band p{margin:0;color:#dbeafe;font-size:12px;line-height:1.6}
.weather-stat{
  min-width:210px;
  border:1px solid rgba(255,255,255,.18);
  background:rgba(255,255,255,.08);
  border-radius:17px;
  padding:16px
}
.weather-stat strong{font-size:22px;display:block;margin-bottom:2px}
.weather-stat span{font-size:11px;color:#dbeafe}

/* DETAIL VIEW */
.page{display:none}
.page.active{display:block}
.back-row{padding-top:28px}
.detail-hero{
  margin-top:18px;
  border-radius:26px;
  min-height:310px;
  background:linear-gradient(135deg,#edf6ff,#f8fbff);
  border:1px solid var(--sk-border);
  display:grid;
  grid-template-columns:minmax(0,1.25fr) minmax(280px,.75fr);
  overflow:hidden;
}
.detail-copy{padding:38px}
.detail-copy h1{
  margin:9px 0 12px;color:var(--sk-blue);
  font-size:clamp(34px,4vw,54px);line-height:1;letter-spacing:-.06em
}
.detail-copy p{color:var(--sk-body);line-height:1.7;font-size:13px;max-width:680px}
.detail-image{
  min-height:310px;
  background:linear-gradient(145deg,#dcecff,#f3f9ff);
  display:grid;place-items:center;
  color:var(--sk-blue);font-weight:900;font-size:24px
}
.detail-image img{width:100%;height:100%;object-fit:cover}
.detail-meta{display:flex;gap:7px;flex-wrap:wrap;margin-top:18px}
.detail-meta .meta{font-size:10px;padding:7px 9px;background:#fff;border:1px solid #dbe6f0}
.detail-layout{
  display:grid;
  grid-template-columns:minmax(0,1.55fr) minmax(280px,.75fr);
  gap:18px;
  margin:18px 0 56px
}
.panel{
  border:1px solid var(--sk-border);
  background:#fff;
  border-radius:18px;
  padding:22px;
  margin-bottom:16px
}
.panel h3{margin:0 0 12px;color:var(--sk-blue);font-size:17px}
.panel p{color:var(--sk-body);line-height:1.7;font-size:12px;margin:0 0 12px}
.panel ul{margin:10px 0 0;padding-left:18px;color:var(--sk-body);font-size:12px;line-height:1.7}
.key-list{display:grid;gap:8px}
.key-row{
  display:grid;grid-template-columns:150px 1fr;gap:12px;
  border-bottom:1px solid var(--sk-border-soft);
  padding:9px 0;font-size:11px
}
.key-row:last-child{border-bottom:0}
.key-row b{color:#526477}
.key-row span{color:var(--sk-text)}
.fleet-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.aircraft-card{
  border:1px solid var(--sk-border);border-radius:15px;padding:15px
}
.aircraft-card h4{margin:0 0 5px;color:var(--sk-blue);font-size:14px}
.cabin-pill{
  margin-top:8px;border-radius:10px;background:#f4f8fc;
  padding:8px 9px;color:#526477;font-size:10px
}

/* MODALS */
.modal{
  position:fixed;inset:0;z-index:9999;
  display:none;align-items:center;justify-content:center;
  padding:20px;background:rgba(3,20,39,.52);
  backdrop-filter:blur(6px)
}
.modal.open{display:flex}
.modal-card{
  width:min(760px,100%);
  max-height:90vh;overflow:auto;
  border-radius:22px;background:#fff;
  box-shadow:0 24px 70px rgba(0,0,0,.26);
  padding:24px
}
.modal-head{
  display:flex;justify-content:space-between;align-items:flex-start;gap:16px;
  padding-bottom:15px;border-bottom:1px solid var(--sk-border-soft)
}
.modal-head h2{margin:0;color:var(--sk-blue);font-size:23px;letter-spacing:-.035em}
.modal-head p{margin:5px 0 0;color:var(--sk-muted);font-size:11px}
.form-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-top:18px}
.field{display:grid;gap:6px}
.field.full{grid-column:1/-1}
.field label{
  font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:.08em;color:#5c6b7c
}
.field input,.field select,.field textarea{
  width:100%;border:1px solid #cfd9e4;border-radius:10px;
  padding:11px 12px;color:var(--sk-text);background:#fff
}
.field textarea{min-height:120px;resize:vertical}
.modal-actions{display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap;margin-top:18px}
.modal-result{
  margin-top:14px;padding:12px;border-radius:10px;background:#f5f8fc;
  color:#526477;font-size:11px;line-height:1.6
}
.baggage-result{margin-top:16px}
.baggage-result pre{
  white-space:pre-wrap;font-family:inherit;
  color:var(--sk-body);line-height:1.65;font-size:12px
}

/* ALEXANDRA */
.alexandra{
  position:fixed;right:22px;bottom:22px;z-index:80;
  width:min(390px,calc(100% - 44px));
  border:1px solid #cddce9;
  border-radius:18px;background:#fff;
  box-shadow:var(--sk-shadow-lg);
  padding:15px;
  display:flex;gap:12px;align-items:flex-start
}
.alexandra-avatar {
  flex: 0 0 50px;
  width: 60px;
  height: 60px;
  overflow: hidden;
  border-radius: 50%;
  background: var(--sk-blue);
  position: relative;
}

.alexandra-avatar video {
  width: 100%;
  height: 100%;
  object-fit: cover; /* Ensures the video covers the circle without stretching */
  display: block;
}
.alexandra-copy{min-width:0;flex:1}
.alexandra-copy strong{display:block;color:var(--sk-blue);font-size:11px;margin-bottom:4px}
.alexandra-copy p{margin:0;color:var(--sk-muted);font-size:10px;line-height:1.45}
.alexandra-actions{margin-top:9px;display:flex;gap:7px}
.alexandra-actions button{font-size:9px;padding:7px 10px}

/* EMPTY */
.empty{
  grid-column:1/-1;
  border:1px dashed #cfd9e4;
  border-radius:15px;padding:26px;text-align:center;
  color:var(--sk-muted);font-size:12px;background:#fff
}

@media(max-width:980px){
  .hero-inner{grid-template-columns:1fr;min-height:unset}
  .hero-side{min-height:220px}
  .tools-grid,.library-grid{grid-template-columns:repeat(2,1fr)}
  .journey-grid,.results-grid{grid-template-columns:repeat(2,1fr)}
  .detail-hero,.detail-layout{grid-template-columns:1fr}
  .detail-image{min-height:240px;order:-1}
}
@media(max-width:640px){
  .shell{width:min(100% - 24px,1180px)}
  .hero-inner{padding:54px 0 50px}
  .hero h1{font-size:46px}
  .hero-search{flex-wrap:wrap;padding:11px}
  .hero-search input{width:calc(100% - 38px)}
  .hero-search button{width:100%}
  .tools-strip{margin-top:-18px}
  .tools-grid,.journey-grid,.library-grid,.question-grid,.results-grid,.fleet-grid{grid-template-columns:1fr}
  .section{padding:42px 0}
  .section-head{display:block}
  .section-head .link-btn{margin-top:10px}
  .weather-band{grid-template-columns:1fr}
  .weather-stat{min-width:0}
  .detail-copy{padding:25px 20px}
  .detail-image{min-height:200px}
  .detail-layout{margin-bottom:40px}
  .form-grid{grid-template-columns:1fr}
  .field.full{grid-column:auto}
  .key-row{grid-template-columns:1fr;gap:3px}
  .alexandra{right:12px;bottom:12px;width:calc(100% - 24px)}
}
</style>
</head>
<body>

<section class="hero">
  <div class="shell hero-inner">
    <div>
      <div class="eyebrow">Help & Travel Info</div>
      <h1>Travel with confidence.</h1>
      <p class="hero-copy">Everything you need before you leave, while you travel and when you arrive. Search SKANDI travel information, airline guides, airports, baggage, transfers and destination support.</p>
      <div class="hero-search">
        <span class="search-mark">⌕</span>
        <input id="homeSearch" type="search" placeholder="What can we help you with?" autocomplete="off">
        <button id="searchBtn" class="primary" type="button">Search</button>
      </div>
      <div id="status" class="status"></div>
    </div>
    <aside class="hero-side">
      <div class="hero-side-content">
        <div class="eyebrow">Plan ahead</div>
        <h3>Ready for your next trip?</h3>
        <p>Check the essentials now so your journey feels easy from airport to hotel.</p>
        <div class="hero-quick">
          <button data-quick="baggage" type="button">Baggage allowance</button>
          <button data-quick="requirements" type="button">Travel requirements</button>
          <button data-quick="airlines" type="button">Airline guide</button>
          <button data-quick="airports" type="button">Airport info</button>
        </div>
      </div>
    </aside>
  </div>
</section>

<div class="shell tools-strip">
  <div class="tools-grid">
    <button class="tool-card" data-tool="baggage" type="button">
      <div class="tool-icon">▣</div>
      <b>Baggage allowance</b>
      <span>Find baggage guidance by airline.</span>
    </button>
    <button class="tool-card" data-tool="requirements" type="button">
      <div class="tool-icon">✓</div>
      <b>Travel requirements</b>
      <span>Passport, visa and entry guidance.</span>
    </button>
    <button class="tool-card" data-tool="airports" type="button">
      <div class="tool-icon">⌖</div>
      <b>Airport information</b>
      <span>Terminals, transfers, lounges and practical airport guidance.</span>
    </button>
    <button class="tool-card" data-tool="support" type="button">
      <div class="tool-icon">?</div>
      <b>Need help?</b>
      <span>Contact SKANDI Travel Support for itinerary-specific assistance.</span>
    </button>
  </div>
</div>

<main id="homePage" class="page active">
  <section class="section">
    <div class="shell">
      <div class="section-head">
        <div>
          <div class="eyebrow">Your journey</div>
          <h2>What do you need help with?</h2>
          <p>Browse by stage of travel. The content below is synchronized with the current SKANDI Travel Info library.</p>
        </div>
      </div>
      <div id="journeyGrid" class="journey-grid"></div>
    </div>
  </section>

  <section class="section compact">
    <div class="shell">
      <div class="section-head">
        <div>
          <div class="eyebrow">Popular help</div>
          <h2>Top questions</h2>
        </div>
      </div>
      <div id="questionGrid" class="question-grid"></div>
    </div>
  </section>

  <section class="section library-section">
    <div class="shell">
      <div class="section-head">
        <div>
          <div class="eyebrow">Travel libraries</div>
          <h2>Explore detailed information</h2>
          <p>Airlines, airports, hotels, transfers, tours, activities and tickets are shown only when their customer content is published.</p>
        </div>
      </div>
      <div id="libraryGrid" class="library-grid"></div>
    </div>
  </section>

  <section id="directorySection" class="section">
    <div class="shell">
      <div class="section-head">
        <div>
          <div class="eyebrow">Directory</div>
          <h2 id="directoryTitle">Browse Travel Info</h2>
          <p id="directorySub">Search across published SKANDI travel information.</p>
        </div>
        <button id="clearFilterBtn" class="link-btn" type="button">Show everything</button>
      </div>
      <div id="directoryToolbar" class="directory-toolbar"></div>
      <div id="resultsGrid" class="results-grid"></div>
    </div>
  </section>

  <section class="section compact">
    <div class="shell">
      <div class="weather-band">
        <div>
          <div class="eyebrow">Weather</div>
          <h3>Weather at your destination</h3>
          <p>Open an airport or destination and use current location data when available.</p>
        </div>
        <div class="weather-stat">
          <strong id="weatherTitle">Destination weather</strong>
          <span id="weatherText">Choose an airport to load current weather.</span>
        </div>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="shell">
      <div class="section-head">
        <div>
          <div class="eyebrow">SKANDI support</div>
          <h2>Still need help?</h2>
          <p>Alexandra can search the Travel Info library, or you can send a request to the SKANDI Travel Support team.</p>
        </div>
        <div style="display:flex;gap:9px;flex-wrap:wrap">
          <button id="askBtn" class="secondary" type="button">Ask Alexandra</button>
          <button id="supportBtn" class="primary" type="button">Contact support</button>
        </div>
      </div>
    </div>
  </section>
</main>

<main id="detailPage" class="page">
  <div class="shell">
    <div class="back-row">
      <button id="backBtn" class="secondary" type="button">← Back to Travel Info</button>
    </div>
    <div id="detailContent"></div>
  </div>
</main>

<!-- BAGGAGE -->
<div id="baggageModal" class="modal" aria-hidden="true">
  <div class="modal-card">
    <div class="modal-head">
      <div>
        <h2>Baggage allowance</h2>
        <p>Select an airline to view the baggage guidance currently published by SKANDI.</p>
      </div>
      <button class="icon-btn" data-close="baggageModal" type="button">×</button>
    </div>
    <div class="form-grid">
      <div class="field full">
        <label>Airline</label>
        <select id="baggageAirline"></select>
      </div>
    </div>
    <div id="baggageResult" class="modal-result baggage-result">Choose an airline.</div>
  </div>
</div>

<!-- TRAVEL REQUIREMENTS -->
<div id="requirementsModal" class="modal" aria-hidden="true">
  <div class="modal-card">
    <div class="modal-head">
      <div>
        <h2>Travel requirements</h2>
        <p>Check the current SKANDI requirements library. Always confirm official government guidance before departure.</p>
      </div>
      <button class="icon-btn" data-close="requirementsModal" type="button">×</button>
    </div>
    <div class="form-grid">
      <div class="field">
        <label>Passport nationality</label>
        <input id="passportCountry" placeholder="Country">
      </div>
      <div class="field">
        <label>From</label>
        <input id="fromCountry" placeholder="Country">
      </div>
      <div class="field">
        <label>Transit</label>
        <input id="transitCountry" placeholder="Optional">
      </div>
      <div class="field">
        <label>To</label>
        <input id="toCountry" placeholder="Country">
      </div>
    </div>
    <div class="modal-actions">
      <button id="checkRequirements" class="primary" type="button">Check requirements</button>
    </div>
    <div id="requirementsResult" class="modal-result">Enter your route to search the current Travel Info requirements.</div>
  </div>
</div>

<!-- SUPPORT -->
<div id="supportModal" class="modal" aria-hidden="true">
  <div class="modal-card">
    <div class="modal-head">
      <div>
        <h2>Contact Travel Support</h2>
        <p>Send an itinerary or travel-information question to SKANDI.</p>
      </div>
      <button class="icon-btn" data-close="supportModal" type="button">×</button>
    </div>
    <div class="form-grid">
      <div class="field"><label>Name</label><input id="supportName"></div>
      <div class="field"><label>Email</label><input id="supportEmail" type="email"></div>
      <div class="field"><label>Booking reference</label><input id="supportRef"></div>
      <div class="field">
        <label>Category</label>
        <select id="supportCategory">
          <option>General</option>
          <option>Before travel</option>
          <option>Baggage</option>
          <option>Airport</option>
          <option>Airline</option>
          <option>Hotel</option>
          <option>Transfer</option>
          <option>Tour / Activity</option>
          <option>Ticket / Voucher</option>
          <option>Booking</option>
        </select>
      </div>
      <div class="field full"><label>Message</label><textarea id="supportMessage"></textarea></div>
    </div>
    <div class="modal-actions">
      <button class="secondary" data-close="supportModal" type="button">Cancel</button>
      <button id="sendSupport" class="primary" type="button">Send request</button>
    </div>
    <div id="supportResult" class="modal-result hidden"></div>
  </div>
</div>

<!-- Alexandra uses the shared SKANDI Support / LiveKit experience. -->
<div id="alexandraPrompt" class="alexandra">
  <div class="alexandra-avatar">
      <video src="https://video.wixstatic.com/video/394052_b44198f20fc44baa90b3fc03d87602ea/1080p/mp4/file.mp4" autoplay loop muted playsinline style="width:100%; height:100%; object-fit:cover; border-radius:50%"></video>
  </div>
  <div class="alexandra-copy">
    <strong>Alexandra · SKANDI Digital Customer Support</strong>
    <p>Did you find what you were looking for? I can search Travel Info for you.</p>
    <div class="alexandra-actions">
      <button id="alexandraHelpBtn" class="primary" type="button">Let Alexandra help</button>
      <button id="alexandraDismissBtn" class="secondary" type="button">Close</button>
    </div>
  </div>
</div>

<script>
(()=>{
"use strict";

const SOURCE="SKANDI_PUBLIC_TRAVEL_INFO";
const PARENT="SKANDI_WIX_PARENT";
const VERSION="BACKEND-BASE-1.0-B011.2";

let DATA={
  airlines:[],
  airports:[],
  hotels:[],
  transfers:[],
  tours:[],
  activities:[],
  tickets:[],
  helpCenter:{groups:[],topics:[]},
  articles:[],
  travelRequirements:[]
};
let activeLibrary="all";
let activeDetail=null;
let aircraftBundle=null;


const $=id=>document.getElementById(id);
const arr=v=>Array.isArray(v)?v:[];
const text=v=>String(v??"").trim();
const lower=v=>text(v).toLowerCase();
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const cleanArray=v=>Array.isArray(v)?v:[];

function post(type,payload={}){
  window.parent.postMessage({source:SOURCE,type,payload,timestamp:new Date().toISOString()},"*");
}
function master(type,payload={}){
  window.parent.postMessage({source:SOURCE,type,payload,path:payload.path||"",timestamp:new Date().toISOString()},"*");
}
function showStatus(message){
  const el=$("status");
  el.textContent=message||"";
  el.classList.toggle("show",!!message);
}
function openModal(id){
  const el=$(id);
  if(!el)return;
  el.classList.add("open");
  el.setAttribute("aria-hidden","false");
}
function closeModal(id){
  const el=$(id);
  if(!el)return;
  el.classList.remove("open");
  el.setAttribute("aria-hidden","true");
}
function libraryDefs(){
  return [
    {key:"airlines",title:"Airline Information",icon:"✈",sub:"Baggage, check-in, boarding, lounges, onboard service and aircraft."},
    {key:"airports",title:"Airport Information",icon:"⌖",sub:"Arrival, departure, terminals, transport, lounges and airport guidance."},
    {key:"hotels",title:"Hotel Information",icon:"H",sub:"Published SKANDI hotel information, facilities and local guidance."},
    {key:"transfers",title:"Transfer Information",icon:"⇄",sub:"Meeting points, routes, luggage and transfer guidance."},
    {key:"tours",title:"Tours",icon:"◇",sub:"Curated tour information, itineraries and pickup details."},
    {key:"activities",title:"Activities & Excursions",icon:"★",sub:"Things to do, attractions, entry information and restrictions."},
    {key:"tickets",title:"Tickets & Vouchers",icon:"▣",sub:"How to use tickets, vouchers, QR codes and timed entry."}
  ];
}
function itemsFor(key){
  return key==="faq"?arr(DATA.helpCenter?.topics):arr(DATA[key]);
}
function itemTitle(x){return text(x.name||x.title||x.shortName||x.code||x.iataCode||"Untitled")}
function itemSummary(x){return text(x.summary||x.subtitle||x.description||x.body||x.information||x.city||x.country||"")}
function itemImage(x){return text(x.heroImage||x.image||x.logo||x.logoIcon||x.image_url||"")}
function itemCode(x){return text(x.iataCode||x.iata||x.code||x.icaoCode||x.icao||"")}
function searchText(x){
  return lower([
    itemTitle(x),itemCode(x),x.icaoCode,x.icao,x.city,x.country,x.summary,x.subtitle,x.description,x.body,
    x.category,x.destination,x.aircraftFamilies
  ].flat().join(" "));
}
function resultKicker(key){
  return libraryDefs().find(x=>x.key===key)?.title||"Travel Info";
}
function getRows(){
  const q=lower($("homeSearch").value);
  const defs=activeLibrary==="all"?libraryDefs():libraryDefs().filter(d=>d.key===activeLibrary);
  const rows=[];
  defs.forEach(d=>{
    itemsFor(d.key).forEach(item=>{
      if(!q||searchText(item).includes(q)) rows.push({...item,_library:d.key,_label:d.title});
    });
  });
  if(activeLibrary==="faq"||activeLibrary==="all"){
    arr(DATA.helpCenter?.topics).forEach(item=>{
      if(!q||searchText(item).includes(q)) rows.push({...item,_library:"faq",_label:"Help Center"});
    });
  }
  return rows;
}
function renderJourney(){
  let groups=arr(DATA.helpCenter?.groups).slice().sort((a,b)=>(a.sortOrder||0)-(b.sortOrder||0));
  if(!groups.length){
    groups=[
      {id:"before",title:"Before you travel",subtitle:"Payments, travel requirements and check-in."},
      {id:"day",title:"Day of travel",subtitle:"Baggage, airport information, delays and support."},
      {id:"flight",title:"The flight",subtitle:"Airline information, cabins, seating and onboard experience."},
      {id:"hotel",title:"The hotel",subtitle:"Hotel arrival, facilities and destination guidance."},
      {id:"destination",title:"At your destination",subtitle:"Transfers, activities, tours and local assistance."},
      {id:"return",title:"Coming back home",subtitle:"Return travel, airport and baggage guidance."}
    ];
  }
  $("journeyGrid").innerHTML=groups.slice(0,9).map((g,i)=>`
    <button class="journey-card" data-group="${esc(g.id||g.groupId||"")}">
      <div class="journey-num">${String(i+1).padStart(2,"0")}</div>
      <h3>${esc(g.title||"Travel help")}</h3>
      <p>${esc(g.subtitle||g.body||"Browse guidance for this part of your journey.")}</p>
    </button>`).join("");
  document.querySelectorAll("[data-group]").forEach(btn=>{
    btn.onclick=()=>{
      const id=btn.dataset.group;
      const topics=arr(DATA.helpCenter?.topics).filter(t=>text(t.groupId||t.group_id)===id);
      activeLibrary="faq";
      renderToolbar();
      renderResults(topics.map(x=>({...x,_library:"faq",_label:"Help Center"})));
      $("directoryTitle").textContent=btn.querySelector("h3")?.textContent||"Travel Help";
      $("directorySection").scrollIntoView({behavior:"smooth",block:"start"});
    };
  });
}
function renderQuestions(){
  let topics=arr(DATA.helpCenter?.topics).filter(t=>t.featured===true);
  if(!topics.length) topics=arr(DATA.helpCenter?.topics).slice(0,6);
  $("questionGrid").innerHTML=topics.length?topics.slice(0,6).map((q,i)=>`
    <button class="question" data-faq="${i}">
      <div class="question-mark">?</div>
      <div>
        <strong>${esc(q.title||"Travel question")}</strong>
        <p>${esc(q.subtitle||q.body||"Open this answer.")}</p>
      </div>
    </button>`).join(""):`<div class="empty">Top questions will appear here when published.</div>`;
  document.querySelectorAll("[data-faq]").forEach(btn=>{
    btn.onclick=()=>openDetail({...topics[Number(btn.dataset.faq)],_library:"faq",_label:"Help Center"});
  });
}
function renderLibraries(){
  $("libraryGrid").innerHTML=libraryDefs().map(d=>`
    <button class="library-card" data-library="${d.key}">
      <div class="lib-icon">${d.icon}</div>
      <h3>${d.title}</h3>
      <p>${d.sub}</p>
      <span class="count">${itemsFor(d.key).length} published</span>
    </button>`).join("");
  document.querySelectorAll("[data-library]").forEach(btn=>{
    btn.onclick=()=>{
      activeLibrary=btn.dataset.library;
      $("directoryTitle").textContent=resultKicker(activeLibrary);
      $("directorySub").textContent=libraryDefs().find(x=>x.key===activeLibrary)?.sub||"";
      renderToolbar();
      renderResults();
      $("directorySection").scrollIntoView({behavior:"smooth",block:"start"});
    };
  });
}
function renderToolbar(){
  const defs=[{key:"all",title:"All"}].concat(libraryDefs());
  $("directoryToolbar").innerHTML=defs.map(d=>`<button class="chip ${activeLibrary===d.key?"active":""}" data-chip="${d.key}">${d.title}</button>`).join("");
  document.querySelectorAll("[data-chip]").forEach(btn=>{
    btn.onclick=()=>{
      activeLibrary=btn.dataset.chip;
      $("directoryTitle").textContent=activeLibrary==="all"?"Browse Travel Info":resultKicker(activeLibrary);
      $("directorySub").textContent=activeLibrary==="all"?"Search across published SKANDI travel information.":(libraryDefs().find(x=>x.key===activeLibrary)?.sub||"");
      renderToolbar();renderResults();
    };
  });
}
function renderResults(override=null){
  const rows=override||getRows();
  $("resultsGrid").innerHTML=rows.length?rows.slice(0,90).map((x,i)=>{
    const image=itemImage(x);
    const code=itemCode(x);
    return `<button class="result-card" data-result="${i}">
      <div class="result-image">${image?`<img src="${esc(image)}" alt="">`:`${esc((code||itemTitle(x).slice(0,2)).toUpperCase())}`}</div>
      <div class="result-body">
        <div class="result-kicker">${esc(x._label||resultKicker(x._library))}</div>
        <h4>${esc(itemTitle(x))}</h4>
        <p>${esc(itemSummary(x).slice(0,180))}</p>
        <div class="result-meta">
          ${code?`<span class="meta">${esc(code)}</span>`:""}
          ${x.city?`<span class="meta">${esc(x.city)}</span>`:""}
          ${x.country?`<span class="meta">${esc(x.country)}</span>`:""}
        </div>
      </div>
    </button>`;
  }).join(""):`<div class="empty">No published information matches this search.</div>`;
  document.querySelectorAll("[data-result]").forEach(btn=>{
    btn.onclick=()=>openDetail(rows[Number(btn.dataset.result)]);
  });
}
function sectionPanel(title,body,bullets=[]){
  if(!body&&!bullets.length)return"";
  return `<div class="panel"><h3>${esc(title)}</h3>${body?`<p>${esc(body)}</p>`:""}${bullets.length?`<ul>${bullets.map(b=>`<li>${esc(b)}</li>`).join("")}</ul>`:""}</div>`;
}
function detailFacts(x){
  const rows=[];
  const push=(k,v)=>{if(text(v))rows.push([k,v])};
  push("IATA",x.iataCode||x.iata);
  push("ICAO",x.icaoCode||x.icao);
  push("City",x.city);
  push("Country",x.country);
  push("Timezone",x.timezone);
  push("Website",x.website);
  push("Loyalty program",x.loyaltyProgram);
  push("Check-in",x.checkInDeadline);
  push("Duration",x.durationText);
  push("Meeting point",x.meetingPoint);
  push("From",x.fromLocation);
  push("To",x.toLocation);
  if(x.starRating)push("Rating",`${x.starRating} stars`);
  return rows;
}
function openDetail(x){
  activeDetail=x;
  aircraftBundle=null;
  $("homePage").classList.remove("active");
  $("detailPage").classList.add("active");
  window.scrollTo({top:0,behavior:"smooth"});

  const image=itemImage(x);
  const facts=detailFacts(x);
  const sections=x.sections&&typeof x.sections==="object"?x.sections:{};
  const quickFacts=Array.isArray(x.quickFacts)?x.quickFacts:[];
  const baggage=x.baggage||{};
  const heroMeta=[
    x.iataCode?`IATA ${x.iataCode}`:"",
    x.icaoCode?`ICAO ${x.icaoCode}`:"",
    x.city,x.country,
    x.aircraftCount?`${x.aircraftCount} aircraft`:""
  ].filter(Boolean);

  let body=`
    <div class="detail-hero">
      <div class="detail-copy">
        <div class="eyebrow">${esc(x._label||resultKicker(x._library))}</div>
        <h1>${esc(itemTitle(x))}</h1>
        <p>${esc(itemSummary(x)||"Published SKANDI travel information.")}</p>
        <div class="detail-meta">${heroMeta.map(m=>`<span class="meta">${esc(m)}</span>`).join("")}</div>
      </div>
      <div class="detail-image">${image?`<img src="${esc(image)}" alt="">`:esc((itemCode(x)||"SKANDI").toUpperCase())}</div>
    </div>
    <div class="detail-layout">
      <div>
        ${sectionPanel("Overview",x.description||x.information||x.body||x.summary)}
        ${sectionPanel(sections.baggage?.title||"Baggage",sections.baggage?.body||(baggage.mode==="narrative"?baggage.text:""),cleanArray(sections.baggage?.bullets))}
        ${sectionPanel(sections.checkin?.title||"Check-in",sections.checkin?.body,cleanArray(sections.checkin?.bullets))}
        ${sectionPanel(sections.boarding?.title||"Boarding",sections.boarding?.body||x.boarding,cleanArray(sections.boarding?.bullets))}
        ${sectionPanel(sections.cabins?.title||"Cabins",sections.cabins?.body,cleanArray(sections.cabins?.bullets))}
        ${sectionPanel(sections.food?.title||"Food & Drink",sections.food?.body,cleanArray(sections.food?.bullets))}
        ${sectionPanel(sections.wifi?.title||"Wi-Fi & Connectivity",sections.wifi?.body,cleanArray(sections.wifi?.bullets))}
        ${quickFacts.length?`<div class="panel"><h3>Quick facts</h3><div class="detail-meta">${quickFacts.map(v=>`<span class="meta">${esc(typeof v==="string"?v:(v.label||v.value||JSON.stringify(v)))}</span>`).join("")}</div></div>`:""}
        ${x._library==="airlines"?`<div style="margin-top:16px"><div id="onboardReactRoot"><div class="empty">Loading interactive onboard experience…</div></div></div>`:""}
      </div>
      <aside>
        ${facts.length?`<div class="panel"><h3>At a glance</h3><div class="key-list">${facts.map(([k,v])=>`<div class="key-row"><b>${esc(k)}</b><span>${esc(v)}</span></div>`).join("")}</div></div>`:""}
        <div class="panel">
          <h3>Need more help?</h3>
          <p>Ask Alexandra or contact SKANDI Travel Support for help related to your trip.</p>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="secondary" id="detailAsk" type="button">Ask Alexandra</button>
            <button class="primary" id="detailSupport" type="button">Contact support</button>
          </div>
        </div>
      </aside>
    </div>`;

  $("detailContent").innerHTML=body;
  $("detailAsk").onclick=()=>post("TRAVEL_INFO_OPEN_ALEXANDRA",{context:{title:itemTitle(x),library:x._library||""}});
  $("detailSupport").onclick=()=>openModal("supportModal");

  if(x._library==="airlines"){
    post("TRAVEL_INFO_REQUEST_AIRCRAFT",{airlineId:x.id,airlineCode:x.iataCode});
  }
  if((x._library==="airports"||x._library==="hotels")&&Number.isFinite(Number(x.latitude))&&Number.isFinite(Number(x.longitude))){
    requestWeather(x);
  }
}
function renderFleetFallback(bundle,host){
  const aircraft=arr(bundle.aircraft),cabins=arr(bundle.cabins);
  host.innerHTML=aircraft.length?`<div class="panel"><h3>Aircraft & cabin information</h3><div class="fleet-grid">${aircraft.map(a=>{const cs=cabins.filter(c=>text(c.aircraft_id||c.aircraftId)===text(a.id));const title=a.display_title||a.displayTitle||a.aircraft_name||a.aircraftName||a.aircraft_code||a.aircraftCode;return `<div class="aircraft-card"><h4>${esc(title)}</h4><div class="result-meta">${(a.aircraft_code||a.aircraftCode)?`<span class="meta">${esc(a.aircraft_code||a.aircraftCode)}</span>`:""}${(a.total_seats||a.totalSeats)?`<span class="meta">${Number(a.total_seats||a.totalSeats)} seats</span>`:""}</div>${cs.map(c=>`<div class="cabin-pill"><b>${esc(c.cabin_name||c.cabinName||c.cabin_code||c.cabinCode)}</b> · ${Number(c.seat_count||c.seatCount||0)} seats</div>`).join("")}</div>`}).join("")}</div><p style="font-size:10px;color:#6b7789;margin-top:12px">Interactive React experience could not be loaded. Aircraft data itself is connected.</p></div>`:`<div class="empty">No published aircraft are available for this airline.</div>`;
}
function renderFleet(bundle){
  aircraftBundle=bundle||{};
  const host=$("onboardReactRoot")||$("fleet");
  if(!host)return;
  const payload={elementId:host.id,bundle:aircraftBundle,airline:activeDetail||{}};
  window.__SKANDI_ONBOARD_PENDING__=payload;
  if(window.SKANDIOnboardReact?.mount){window.SKANDIOnboardReact.mount(host,aircraftBundle,activeDetail||{});return}
  host.innerHTML='<div class="empty">Initializing React onboard experience…</div>';
  setTimeout(()=>{if(host.isConnected&&!window.SKANDIOnboardReact?.mount)renderFleetFallback(aircraftBundle,host)},5500);
}
window.addEventListener("SKANDI_ONBOARD_REACT_READY",()=>{const p=window.__SKANDI_ONBOARD_PENDING__;if(!p)return;const host=$(p.elementId||"onboardReactRoot");if(host&&window.SKANDIOnboardReact?.mount)window.SKANDIOnboardReact.mount(host,p.bundle,p.airline)});

function populateBaggage(){
  const airlines=arr(DATA.airlines);
  $("baggageAirline").innerHTML=airlines.length?airlines.map(a=>`<option value="${esc(a.id||a.iataCode)}">${esc(a.name||a.title||a.shortName||a.iataCode)}</option>`).join(""):`<option value="">No airlines available</option>`;
  renderBaggage();
}
function renderBaggage(){
  const id=$("baggageAirline").value;
  const a=arr(DATA.airlines).find(x=>text(x.id||x.iataCode)===id)||arr(DATA.airlines)[0];
  if(!a){$("baggageResult").textContent="No airline baggage information is currently published.";return}
  const b=a.baggage||{};
  if(b.mode==="narrative"&&b.text){
    $("baggageResult").innerHTML=`<strong>${esc(a.name||a.title)}</strong><pre>${esc(b.text)}</pre>`;
    return;
  }
  if(b.mode==="structured"&&b.data){
    $("baggageResult").innerHTML=`<strong>${esc(a.name||a.title)}</strong><pre>${esc(JSON.stringify(b.data,null,2))}</pre>`;
    return;
  }
  $("baggageResult").textContent=`No baggage guidance is currently published for ${a.name||a.title||"this airline"}.`;
}
function checkRequirements(){
  const nationality=text($("passportCountry").value);
  const origin=text($("fromCountry").value);
  const transit=text($("transitCountry").value);
  const destination=text($("toCountry").value);
  if(!nationality||!destination){
    $("requirementsResult").textContent="Enter at least passport nationality and destination.";
    return;
  }
  $("requirementsResult").textContent="Checking current travel requirements…";
  post("TRAVEL_INFO_REQUIREMENTS_SEARCH",{
    nationality,
    origin,
    transit,
    destination,
    documentType:"PASSPORT",
    language:"EN"
  });
}
function renderRequirementSearchResult(p){
  const result=p&&typeof p==="object"?p:{};
  const fields=result.fields&&typeof result.fields==="object"?result.fields:{};
  const notices=arr(result.notices);
  const guidance=arr(result.guidance);
  const rows=[];
  if(result.summary) rows.push(`<div style="margin-bottom:12px"><b>Travel requirements</b><br>${esc(result.summary)}</div>`);
  Object.entries(fields).forEach(([k,v])=>{ if(text(v)) rows.push(`<div style="margin-bottom:10px"><b>${esc(k.replace(/[_-]+/g," "))}</b><br>${esc(typeof v==="string"?v:JSON.stringify(v))}</div>`); });
  guidance.slice(0,8).forEach(r=>rows.push(`<div style="margin-bottom:12px"><b>${esc(r.title||r.country||r.category||"Requirement")}</b><br>${esc(r.body||r.description||r.summary||"")}</div>`));
  notices.forEach(n=>rows.push(`<div style="margin-bottom:10px">${esc(typeof n==="string"?n:(n.message||n.title||JSON.stringify(n)))}</div>`));
  $("requirementsResult").innerHTML=rows.length?rows.join(""):"No matching requirement record was found. Please verify with official authorities before departure.";
}
function requestWeather(x){
  post("TRAVEL_INFO_WEATHER_REQUEST",{locations:[{
    id:x.id||x.code||x.iata,
    title:itemTitle(x),
    latitude:Number(x.latitude),
    longitude:Number(x.longitude)
  }]});
}
function renderAll(){
  renderJourney();
  renderQuestions();
  renderLibraries();
  renderToolbar();
  renderResults();
  populateBaggage();
}
function performSearch(){
  activeLibrary="all";
  $("directoryTitle").textContent="Search results";
  $("directorySub").textContent=$("homeSearch").value?`Results for “${$("homeSearch").value}”`:"Browse all published Travel Info.";
  renderToolbar();
  renderResults();
  $("directorySection").scrollIntoView({behavior:"smooth",block:"start"});
}
function openTool(tool){
  if(tool==="baggage")openModal("baggageModal");
  else if(tool==="requirements")openModal("requirementsModal");
  else if(tool==="support")openModal("supportModal");
  else if(tool==="airlines"||tool==="airports"){
    activeLibrary=tool;
    $("directoryTitle").textContent=resultKicker(tool);
    $("directorySub").textContent=libraryDefs().find(x=>x.key===tool)?.sub||"";
    renderToolbar();renderResults();
    $("directorySection").scrollIntoView({behavior:"smooth",block:"start"});
  }
}

window.addEventListener("message",event=>{
  let m=event.data;
  if(typeof m==="string"){try{m=JSON.parse(m)}catch(_){return}}
  if(!m||m.source!==PARENT)return;
  const p=m.payload||{};
  switch(m.type){
    case "TRAVEL_INFO_HOST_READY":
      post("TRAVEL_INFO_READY",{settings:{language:"EN"},protocolVersion:VERSION});
      break;
    case "TRAVEL_INFO_PROGRESS":
      showStatus(p.message||"Loading SKANDI Travel Info…");
      break;
    case "TRAVEL_INFO_DATA":
      DATA={...DATA,...p};
      showStatus("");
      renderAll();
      break;
    case "TRAVEL_INFO_AIRCRAFT_DATA":
      renderFleet(p);
      break;
    case "TRAVEL_INFO_REQUIREMENTS_SEARCHING":
      $("requirementsResult").textContent=p.message||"Checking current travel requirements…";
      break;
    case "TRAVEL_INFO_REQUIREMENTS_RESULT":
      renderRequirementSearchResult(p);
      break;
    case "TRAVEL_INFO_REQUIREMENTS_ERROR":
      $("requirementsResult").textContent=p.message||"Travel requirements are temporarily unavailable. Please verify with official authorities before departure.";
      break;
    case "TRAVEL_SUPPORT_RESULT":
    case "TRAVEL_INFO_SUPPORT_RESULT":
      $("supportResult").classList.remove("hidden");
      $("supportResult").textContent=p.message||p.error||"Your request has been received.";
      break;
    case "TRAVEL_INFO_WEATHER":{
      const w=arr(p.locations)[0];
      if(w?.ok){
        $("weatherTitle").textContent=w.title||"Destination weather";
        $("weatherText").textContent=`${Math.round(Number(w.tempC||0))}°C · ${w.description||w.condition||""}`;
      }else{
        $("weatherText").textContent="Current weather is unavailable.";
      }
      break;
    }
    case "TRAVEL_INFO_ERROR":
      showStatus(p.message||"Travel information is temporarily unavailable.");
      break;
  }
});

$("searchBtn").onclick=performSearch;
$("homeSearch").addEventListener("keydown",e=>{if(e.key==="Enter")performSearch()});
$("clearFilterBtn").onclick=()=>{
  activeLibrary="all";$("homeSearch").value="";
  $("directoryTitle").textContent="Browse Travel Info";
  $("directorySub").textContent="Search across published SKANDI travel information.";
  renderToolbar();renderResults();
};
document.querySelectorAll("[data-tool]").forEach(b=>b.onclick=()=>openTool(b.dataset.tool));
document.querySelectorAll("[data-quick]").forEach(b=>b.onclick=()=>openTool(b.dataset.quick));
document.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>closeModal(b.dataset.close));
document.querySelectorAll(".modal").forEach(m=>m.addEventListener("click",e=>{if(e.target===m)closeModal(m.id)}));
$("baggageAirline").onchange=renderBaggage;
$("checkRequirements").onclick=checkRequirements;
$("supportBtn").onclick=()=>openModal("supportModal");
$("askBtn").onclick=()=>post("TRAVEL_INFO_OPEN_ALEXANDRA",{});
$("backBtn").onclick=()=>{
  $("detailPage").classList.remove("active");
  $("homePage").classList.add("active");
  activeDetail=null;
  window.scrollTo({top:0,behavior:"smooth"});
};
$("sendSupport").onclick=()=>{
  $("supportResult").classList.remove("hidden");
  $("supportResult").textContent="Sending your request…";
  post("TRAVEL_SUPPORT_REQUEST",{
    name:$("supportName").value,
    email:$("supportEmail").value,
    bookingReference:$("supportRef").value,
    category:$("supportCategory").value,
    message:$("supportMessage").value
  });
};
$("alexandraHelpBtn").onclick=()=>post("TRAVEL_INFO_OPEN_ALEXANDRA",{});
$("alexandraDismissBtn").onclick=()=>$("alexandraPrompt").classList.add("hidden");

renderAll();
post("TRAVEL_INFO_READY",{settings:{language:"EN"},protocolVersion:VERSION});
})();
</script>

<script type="importmap">{"imports":{"react":"https://esm.sh/react@19.3.0","react-dom/client":"https://esm.sh/react-dom@19.3.0/client?external=react","htm":"https://esm.sh/htm@3.1.1"}}</script>
<script type="module">
import React,{useEffect,useMemo,useState} from "react";
import {createRoot} from "react-dom/client";
import htm from "htm";
const html=htm.bind(React.createElement);
const roots=new WeakMap();
const A=v=>Array.isArray(v)?v:[];
const O=v=>v&&typeof v==="object"&&!Array.isArray(v)?v:{};
const T=v=>String(v??"").trim();
const N=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;
const raw=(o,...keys)=>{for(const k of keys){if(o&&o[k]!==undefined&&o[k]!==null&&o[k]!=="")return o[k]}return ""};
const human=v=>T(v).replace(/[_-]+/g," ").replace(/\b\w/g,c=>c.toUpperCase());
const canonical=(code,name="")=>{const v=T(code||name).toUpperCase().replace(/[_-]+/g," ");if(["F","J","W","Y"].includes(v))return v;if(/FIRST|LA PREMI/.test(v))return"F";if(/BUSINESS|SIGNATURE CLASS|DELTA ONE|POLARIS|CLUB WORLD|ROYAL SILK/.test(v))return"J";if(/PREMIUM|PLUS|COMFORT/.test(v)&&!/BUSINESS/.test(v))return"W";return"Y"};
const rank=c=>({F:4,J:3,W:2,Y:1})[c]||0;
const cabinLabel=c=>({F:"First",J:"Business",W:"Premium",Y:"Economy"})[c]||c;
const emit=(type,payload={})=>window.parent.postMessage({source:"SKANDI_PUBLIC_TRAVEL_INFO",type,payload,timestamp:new Date().toISOString()},"*");
const navigate=path=>emit("MASTER_NAVIGATE",{path});
function transition(fn){if(document.startViewTransition){try{return document.startViewTransition(fn)}catch(_){}}fn()}
function normalizeCabins(bundle,aircraftId){
  const source=A(bundle?.cabins).filter(c=>T(raw(c,"aircraft_id","aircraftId"))===T(aircraftId)&&raw(c,"active")!==false);
  const map=new Map();
  source.forEach(c=>{const code=canonical(raw(c,"cabin_code","cabinCode"),raw(c,"cabin_name","cabinName"));const name=T(raw(c,"cabin_name","cabinName"))||cabinLabel(code);const seats=N(raw(c,"seat_count","seatCount"));const key=`${code}|${name.toLowerCase()}|${seats}`;const isCanonical=["F","J","W","Y"].includes(T(raw(c,"cabin_code","cabinCode")).toUpperCase());const old=map.get(key);if(!old||isCanonical)map.set(key,{...c,_code:code,_name:name,_seats:seats,_rank:rank(code),_id:T(raw(c,"id"))})});
  return [...map.values()].sort((a,b)=>b._rank-a._rank||N(raw(a,"sort_order","sortOrder"))-N(raw(b,"sort_order","sortOrder")));
}
function normalizeAircraft(a){return{...a,_id:T(raw(a,"id")),_code:T(raw(a,"aircraft_code","aircraftCode")),_name:T(raw(a,"display_title","displayTitle","aircraft_name","aircraftName")),_aircraftName:T(raw(a,"aircraft_name","aircraftName")),_seats:N(raw(a,"total_seats","totalSeats")),_family:T(raw(a,"family")),_manufacturer:T(raw(a,"manufacturer")),_hero:T(raw(a,"hero_image_url","heroImageUrl","exterior_image_url","exteriorImageUrl")),_configuration:O(raw(a,"configuration"))};}
function useMedia(){const [mobile,setMobile]=useState(matchMedia("(max-width:760px)").matches);useEffect(()=>{const m=matchMedia("(max-width:760px)");const f=()=>setMobile(m.matches);m.addEventListener?.("change",f);return()=>m.removeEventListener?.("change",f)},[]);return mobile}
function legacyData(airline){const s=O(airline?.sections);const rawLegacy=s.inflightExperience?.data||s.inflightExperience||airline?.inflightExperience||{};return O(rawLegacy)}
function classForCabin(legacy,cabin){const classes=A(legacy.classes);if(!classes.length)return null;const code=cabin?cabin._code:"Y";return classes.find(c=>canonical(c.id,c.label)===code)||classes.find(c=>T(c.label).toLowerCase().includes(cabinLabel(code).toLowerCase()))||classes[0]}
function amenityItems(cabin,legacyClass){
  const out=[];const am=raw(cabin,"amenities");
  if(Array.isArray(am))am.forEach(v=>out.push({label:typeof v==="string"?v:(v.label||v.title||"Amenity"),value:typeof v==="string"?"Available by configuration":(v.value||v.description||"")}));
  else Object.entries(O(am)).forEach(([k,v])=>{if(v!==false&&v!==null&&v!=="")out.push({label:human(k),value:typeof v==="object"?JSON.stringify(v):String(v===true?"Available":v)})});
  A(legacyClass?.amenities).forEach(v=>{const label=typeof v==="string"?v:(v.label||v.title);if(label&&!out.some(x=>x.label.toLowerCase()===String(label).toLowerCase()))out.push({label,value:"Published cabin feature"})});
  if(!out.length)["Seat & comfort","Entertainment","Wi-Fi","Power & USB","Meal service","Storage"].forEach(label=>out.push({label,value:"Check this aircraft configuration"}));
  return out.slice(0,12);
}
function layoutFor(cabin,aircraft){const ds=O(raw(cabin,"display_settings","displaySettings"));const configured=raw(ds,"seatLayout","layout");if(Array.isArray(configured))return configured;if(typeof configured==="string"&&configured.includes("-"))return configured.split("-").map((n,i)=>Array.from({length:N(n,1)},(_,j)=>String.fromCharCode(65+i*4+j)));if(cabin?._code==="F")return[["A"],["D"],["G"]];if(cabin?._code==="J")return[["A"],["D","G"],["K"]];if(cabin?._code==="W")return[["A","C"],["D","E","G"],["H","K"]];if(aircraft?._seats>330)return[["A","B","C"],["D","E","F","G"],["H","J","K"]];if(aircraft?._seats>220)return[["A","B","C"],["D","E","F"],["H","J","K"]];return[["A","B","C"],["D","E","F"]]}
function featureData(legacyClass,legacy){const f=A(legacy?.features);if(f.length)return f;const views=A(legacyClass?.views);if(views.length)return views.map(v=>({id:v.id,label:v.label||v.title,image:v.image||v.imageUrl,summary:v.summary||v.description,hotspots:A(v.hotspots)}));return[]}
const style=`
.sx-root{--n:#022e64;--n2:#061a38;--n3:#0a315f;--c:#5FC7CF;--txt:#edf7ff;--mut:#9fb6cd;--line:rgba(146,190,225,.18);font-family:Montserrat,Inter,system-ui,sans-serif;color:var(--txt)}
.sx-shell{position:relative;overflow:hidden;border-radius:24px;background:radial-gradient(circle at 78% 0%,rgba(95,199,207,.18),transparent 26%),linear-gradient(145deg,#031a36,#061f41 55%,#082d58);box-shadow:0 26px 70px rgba(2,46,100,.18);border:1px solid rgba(95,199,207,.18)}
.sx-shell:before{content:"";position:absolute;inset:0;background-image:linear-gradient(rgba(125,190,230,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(125,190,230,.035) 1px,transparent 1px);background-size:32px 32px;pointer-events:none}.sx-shell>*{position:relative;z-index:1}
.sx-head{padding:24px 24px 18px;display:flex;justify-content:space-between;gap:18px;align-items:flex-start;border-bottom:1px solid var(--line)}.sx-kicker{color:var(--c);font-size:10px;font-weight:900;letter-spacing:.17em;text-transform:uppercase}.sx-head h2{font-size:28px!important;color:white!important;margin:6px 0 7px!important;letter-spacing:-.045em}.sx-head p{margin:0;color:var(--mut);font-size:12px;line-height:1.6;max-width:720px}.sx-live{display:flex;align-items:center;gap:7px;padding:8px 11px;border:1px solid rgba(95,199,207,.28);border-radius:999px;color:#bff7fb;font-size:9px;font-weight:800;white-space:nowrap}.sx-live i{width:7px;height:7px;border-radius:50%;background:var(--c);box-shadow:0 0 14px var(--c);animation:sxpulse 1.7s infinite}@keyframes sxpulse{50%{opacity:.45;box-shadow:0 0 5px var(--c)}}
.sx-aircraft-strip,.sx-mode-strip,.sx-cabin-strip,.sx-view-strip{display:flex;gap:8px;overflow:auto;padding:12px 18px;scrollbar-width:thin}.sx-aircraft-strip{border-bottom:1px solid var(--line);background:rgba(255,255,255,.025)}.sx-mode-strip{padding-top:14px;padding-bottom:14px}.sx-pill{border:1px solid var(--line);background:rgba(255,255,255,.035);color:#c8d9eb;border-radius:999px;padding:9px 12px;font-size:9px;font-weight:850;white-space:nowrap}.sx-pill.active{background:linear-gradient(135deg,var(--c),#8ee7ec);border-color:transparent;color:#03243f;box-shadow:0 0 22px rgba(95,199,207,.18)}
.sx-body{padding:0 18px 20px}.sx-dashboard{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(270px,.65fr);gap:14px}.sx-panel{border:1px solid var(--line);background:rgba(255,255,255,.035);backdrop-filter:blur(10px);border-radius:17px;overflow:hidden}.sx-panel-pad{padding:17px}.sx-title{font-size:13px;font-weight:900;color:#fff;margin-bottom:6px}.sx-copy{color:var(--mut);font-size:10px;line-height:1.6}.sx-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.sx-stat{border:1px solid var(--line);border-radius:13px;padding:12px;background:rgba(255,255,255,.03)}.sx-stat b{display:block;color:#fff;font-size:19px}.sx-stat span{color:var(--mut);font-size:8px;text-transform:uppercase;letter-spacing:.08em}.sx-cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin-top:12px}.sx-card{border:1px solid var(--line);border-radius:14px;padding:13px;background:rgba(255,255,255,.035);color:inherit;text-align:left}.sx-card.active{border-color:rgba(95,199,207,.6);box-shadow:inset 0 0 0 1px rgba(95,199,207,.17)}.sx-card strong{display:block;font-size:11px}.sx-card small{color:var(--mut);font-size:9px}.sx-code{display:inline-grid;place-items:center;width:28px;height:28px;border-radius:9px;background:rgba(95,199,207,.12);color:var(--c);font-weight:900;font-size:10px;margin-bottom:8px}
.sx-stage{position:relative;min-height:390px;border-radius:17px;overflow:hidden;background:radial-gradient(circle at 50% 30%,#0d3c6d,#05152b 70%);border:1px solid var(--line)}.sx-stage:after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,transparent 0%,rgba(95,199,207,.035) 50%,transparent 51%);background-size:100% 7px;mix-blend-mode:screen;opacity:.55}.sx-stage img{width:100%;height:390px;object-fit:cover}.sx-stage-empty{min-height:390px;display:grid;place-items:center;padding:28px;text-align:center}.sx-digital-seat{position:relative;width:min(290px,75%);aspect-ratio:1/1.05}.sx-seatback{position:absolute;width:55%;height:66%;left:23%;top:4%;border-radius:28% 28% 14% 14%;background:linear-gradient(145deg,#1d5689,#0c2d53);border:1px solid rgba(151,213,240,.25);box-shadow:inset 0 0 40px rgba(95,199,207,.08),0 24px 60px rgba(0,0,0,.35)}.sx-headrest{position:absolute;left:31%;top:10%;width:38%;height:20%;border-radius:18px;background:linear-gradient(145deg,#28699f,#113d69)}.sx-screen{position:absolute;left:35%;top:34%;width:30%;height:19%;border-radius:8px;border:1px solid rgba(95,199,207,.45);background:radial-gradient(circle,#4ee0e6 0,#0d5573 18%,#051728 72%);box-shadow:0 0 28px rgba(95,199,207,.22)}.sx-cushion{position:absolute;left:18%;bottom:10%;width:64%;height:30%;border-radius:22px 22px 35px 35px;background:linear-gradient(145deg,#174b78,#092a4f);transform:perspective(300px) rotateX(56deg);box-shadow:0 18px 40px rgba(0,0,0,.32)}
.sx-hot{position:absolute;width:25px;height:25px;border-radius:50%;border:1px solid rgba(255,255,255,.75);background:rgba(95,199,207,.9);color:#03243f;display:grid;place-items:center;font-size:9px;font-weight:900;transform:translate(-50%,-50%);z-index:5;box-shadow:0 0 0 6px rgba(95,199,207,.13),0 0 24px rgba(95,199,207,.55);animation:sxhot 2s infinite}.sx-hot:hover,.sx-hot.active{transform:translate(-50%,-50%) scale(1.15)}@keyframes sxhot{50%{box-shadow:0 0 0 11px rgba(95,199,207,.03),0 0 30px rgba(95,199,207,.7)}}
.sx-info{padding:15px}.sx-info h4{margin:0 0 6px;font-size:14px}.sx-info p{margin:0;color:var(--mut);font-size:10px;line-height:1.6}.sx-amenities{display:flex;flex-wrap:wrap;gap:6px;margin-top:12px}.sx-amenity{border:1px solid var(--line);border-radius:999px;padding:7px 9px;color:#c8d9eb;font-size:8px}.sx-seatmap{padding:16px;display:grid;gap:7px;justify-content:center}.sx-row{display:flex;align-items:center;gap:5px}.sx-rownum{width:24px;text-align:right;color:#7191af;font-size:8px;margin-right:5px}.sx-group{display:flex;gap:4px}.sx-aisle{width:18px}.sx-seat{width:30px;height:32px;border-radius:10px 10px 7px 7px;border:1px solid rgba(132,177,214,.28);background:linear-gradient(180deg,#123c65,#0b2848);color:#bcd1e3;font-size:8px;font-weight:900}.sx-seat:hover,.sx-seat.active{border-color:var(--c);color:#fff;box-shadow:0 0 18px rgba(95,199,207,.24);transform:translateY(-2px)}
.sx-rail{display:flex;align-items:stretch;min-height:135px;margin-top:12px;border:1px solid var(--line);border-radius:60px 60px 18px 18px;padding:13px;background:linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,.015));overflow:hidden}.sx-segment{min-width:80px;border:0;border-right:1px solid var(--line);background:transparent;color:#dceaf7;padding:10px;text-align:center;position:relative}.sx-segment:last-child{border-right:0}.sx-segment.active{background:rgba(95,199,207,.10)}.sx-segment b{display:block;font-size:10px}.sx-segment small{font-size:8px;color:#88a6c2}.sx-wing{height:10px;background:linear-gradient(90deg,transparent,#375e80,transparent);margin:-2px 20% 14px;clip-path:polygon(0 50%,45% 0,55% 0,100% 50%,55% 100%,45% 100%)}
.sx-scenes{display:grid;grid-template-columns:190px minmax(0,1fr);gap:12px}.sx-scene-list{display:grid;gap:6px;align-content:start;max-height:420px;overflow:auto}.sx-scene-btn{border:1px solid var(--line);background:rgba(255,255,255,.03);color:#bed0e1;border-radius:11px;padding:10px;text-align:left;font-size:9px}.sx-scene-btn.active{border-color:var(--c);background:rgba(95,199,207,.09);color:white}.sx-scene-nav{display:flex;justify-content:space-between;gap:8px;margin-top:10px}.sx-action{border:1px solid rgba(95,199,207,.32);background:rgba(95,199,207,.08);color:#c7fbff;border-radius:999px;padding:9px 12px;font-size:9px;font-weight:850}.sx-action.primary{background:var(--c);color:#03243f;border-color:transparent}.sx-note{padding:10px 13px;border-radius:11px;background:rgba(255,255,255,.035);color:#8faac2;font-size:8px;line-height:1.55;margin-top:10px}.sx-feature-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:7px;margin-top:10px}.sx-feature{border:1px solid var(--line);background:rgba(255,255,255,.025);border-radius:12px;padding:11px;color:#d5e5f3;text-align:left}.sx-feature b{display:block;font-size:9px}.sx-feature span{display:block;color:#849fb8;font-size:8px;margin-top:3px}.sx-empty{padding:30px;text-align:center;color:#8ca6bf;font-size:10px}.sx-footer{padding:13px 18px;border-top:1px solid var(--line);display:flex;justify-content:space-between;gap:12px;align-items:center;color:#7897b3;font-size:8px}.sx-footer strong{color:#c9dceb}
@media(max-width:900px){.sx-dashboard{grid-template-columns:1fr}.sx-scenes{grid-template-columns:1fr}.sx-scene-list{display:flex;overflow:auto}.sx-scene-btn{min-width:150px}.sx-stats{grid-template-columns:repeat(2,1fr)}}@media(max-width:560px){.sx-head{display:block}.sx-live{margin-top:12px;width:max-content}.sx-body{padding:0 10px 12px}.sx-stage,.sx-stage img,.sx-stage-empty{min-height:300px;height:300px}.sx-cards,.sx-feature-grid{grid-template-columns:1fr}.sx-stats{grid-template-columns:repeat(2,1fr)}.sx-seat{width:26px;height:29px}.sx-aisle{width:11px}.sx-footer{display:block}.sx-footer .sx-action{margin-top:8px}}
`;
function HotspotStage({image,alt,hotspots=[],active,setActive,emptyTitle="Interactive seat digital twin",emptyText="Select feature points to explore the published onboard experience."}){
  const points=hotspots.length?hotspots:[
    {id:"screen",label:"Screen",title:"Entertainment",description:"Entertainment availability is configuration-specific.",x:50,y:39},
    {id:"power",label:"Power",title:"Power & USB",description:"Power and USB availability depends on this aircraft and cabin configuration.",x:66,y:67},
    {id:"tray",label:"Tray",title:"Tray & meal",description:"Explore the seat and meal-service area.",x:48,y:69},
    {id:"comfort",label:"Seat",title:"Seat comfort",description:"Explore seat comfort and row context.",x:35,y:56}
  ];
  const chosen=points.find(h=>T(h.id||h.hotspot_code||h.hotspotId)===T(active))||points[0];
  return html`<div className="sx-panel">
    <div className="sx-stage">
      ${image?html`<img src=${image} alt=${alt||"Cabin view"}/>`:html`<div className="sx-stage-empty"><div><div className="sx-digital-seat"><div className="sx-seatback"></div><div className="sx-headrest"></div><div className="sx-screen"></div><div className="sx-cushion"></div></div><div className="sx-title">${emptyTitle}</div><div className="sx-copy">${emptyText}</div></div></div>`}
      ${points.map((h,i)=>{const id=T(h.id||h.hotspot_code||h.hotspotId||`h-${i}`);return html`<button key=${id} className=${`sx-hot ${id===T(active)?"active":""}`} style=${{left:`${N(raw(h,"x","xPercent"),50)}%`,top:`${N(raw(h,"y","yPercent"),50)}%`}} onClick=${()=>setActive(id)} title=${T(h.label||h.title||"Feature")}>${i+1}</button>`})}
    </div>
    <div className="sx-info"><h4>${T(chosen.title||chosen.label||"Onboard feature")}</h4><p>${T(chosen.description||chosen.summary||"Explore this published aircraft feature.")}</p></div>
  </div>`;
}
function Overview({aircraft,cabins,setCabin}){const total=cabins.reduce((n,c)=>n+c._seats,0);return html`<div className="sx-dashboard"><div className="sx-panel sx-panel-pad"><div className="sx-title">Aircraft digital profile</div><div className="sx-copy">Customer-facing aircraft data is synchronized from Aircraft Display Control. Curated images, cabin content and walkthroughs remain aircraft-specific.</div><div className="sx-stats" style=${{marginTop:"14px"}}><div className="sx-stat"><b>${aircraft._seats||"—"}</b><span>Aircraft seats</span></div><div className="sx-stat"><b>${cabins.length}</b><span>Cabin products</span></div><div className="sx-stat"><b>${total||"—"}</b><span>Mapped seats</span></div><div className="sx-stat"><b>${aircraft._code||"—"}</b><span>Equipment code</span></div></div><div className="sx-cards">${cabins.map(c=>html`<button className="sx-card" key=${c._id||c._name} onClick=${()=>setCabin(c._id)}><span className="sx-code">${c._code}</span><strong>${c._name}</strong><small>${c._seats||"—"} seats · ${cabinLabel(c._code)}</small></button>`)}</div></div><div className="sx-panel sx-panel-pad"><div className="sx-title">Configuration</div><div className="sx-copy">${aircraft._manufacturer||"Aircraft"} ${aircraft._family||""}</div><div className="sx-feature-grid">${Object.entries(aircraft._configuration||{}).map(([k,v])=>html`<div className="sx-feature"><b>${k}</b><span>${v} seats</span></div>`)}</div><div className="sx-note">Cabin counts are informational. Seat assignment, live availability and seat fees are loaded from Duffel during booking.</div></div></div>`}
function CabinExplorer({bundle,aircraft,cabin,legacyClass}){
 const views=A(bundle.views).filter(v=>T(raw(v,"aircraft_id","aircraftId"))===aircraft._id && (T(raw(v,"cabin_id","cabinId"))===cabin?._id || !T(raw(v,"cabin_id","cabinId"))));
 const [viewId,setViewId]=useState(T(raw(views.find(v=>raw(v,"is_default","isDefault")===true)||views[0],"id")));
 useEffect(()=>setViewId(T(raw(views.find(v=>raw(v,"is_default","isDefault")===true)||views[0],"id"))),[aircraft._id,cabin?._id]);
 const view=views.find(v=>T(v.id)===viewId)||views[0];
 const hs=A(bundle.hotspots).filter(h=>T(raw(h,"view_id","viewId"))===T(view?.id));
 const [hot,setHot]=useState(T(raw(hs[0],"id","hotspot_code")));
 const image=T(raw(view,"image_url","imageUrl"))||T(raw(legacyClass,"heroImage","seatbackImage","rowImage"));
 return html`<div><div className="sx-view-strip">${views.map(v=>html`<button key=${v.id} className=${`sx-pill ${T(v.id)===T(view?.id)?"active":""}`} onClick=${()=>transition(()=>setViewId(T(v.id)))}>${T(v.label||v.view_code||v.viewCode||"View")}</button>`)}</div><div className="sx-dashboard"><${HotspotStage} image=${image} alt=${`${cabin?._name||"Cabin"} view`} hotspots=${hs} active=${hot} setActive=${setHot}/><div className="sx-panel sx-panel-pad"><div className="sx-title">${cabin?._name||"Cabin"}</div><div className="sx-copy">${T(raw(cabin,"description","summary"))||T(raw(legacyClass,"summary"))||"Explore the cabin product and published aircraft features."}</div><div className="sx-amenities">${amenityItems(cabin,legacyClass).map(x=>html`<span className="sx-amenity">${x.label}</span>`)}</div><div className="sx-note">${views.length?`${views.length} published aircraft view${views.length===1?"":"s"}`:"No curated cabin image is published yet; the digital twin remains available."}</div></div></div></div>`
}
function SeatLab({aircraft,cabin,legacyClass,legacy}){
 const groups=layoutFor(cabin,aircraft);const [seat,setSeat]=useState("");const features=featureData(legacyClass,legacy);const [featureId,setFeatureId]=useState(T(raw(features[0],"id")));const feature=features.find(f=>T(raw(f,"id"))===featureId)||features[0];const hotspots=A(raw(feature||{},"hotspots"));const [hot,setHot]=useState(T(raw(hotspots[0],"id","hotspotId")));
 const rows=[1,2,3];
 return html`<div className="sx-dashboard"><div><div className="sx-panel"><div className="sx-panel-pad"><div className="sx-title">Interactive row preview · ${cabin?._name||"Cabin"}</div><div className="sx-copy">Tap a seat to explore position and cabin context. This preview is informational; live seat availability is shown during booking.</div></div><div className="sx-seatmap">${rows.map(r=>html`<div className="sx-row"><span className="sx-rownum">${r}</span>${groups.map((g,gi)=>html`<${React.Fragment} key=${gi}><div className="sx-group">${g.map(letter=>{const id=`${r}${letter}`;return html`<button className=${`sx-seat ${seat===id?"active":""}`} onClick=${()=>setSeat(id)}>${id}</button>`})}</div>${gi<groups.length-1?html`<span className="sx-aisle"></span>`:null}</${React.Fragment}>`)}</div>`)}</div></div>${features.length?html`<div className="sx-panel" style=${{marginTop:"12px"}}><div className="sx-view-strip">${features.map(f=>html`<button className=${`sx-pill ${T(raw(f,"id"))===T(feature?.id)?"active":""}`} onClick=${()=>setFeatureId(T(raw(f,"id")))}>${T(f.label||f.title||"Feature")}</button>`)}</div><${HotspotStage} image=${T(raw(feature,"image","imageUrl","url"))} alt=${T(feature?.label||feature?.title)} hotspots=${hotspots} active=${hot} setActive=${setHot}/></div>`:null}</div><aside className="sx-panel sx-panel-pad"><div className="sx-title">${seat||"Select a seat"}</div><div className="sx-copy">${seat?`${seat.endsWith("A")||seat.endsWith("K")||seat.endsWith("F")?"Window/outer":"Aisle or center"} position · ${cabin?._name||"Cabin"}`:"Choose one of the representative seats to inspect the cabin context."}</div><div className="sx-feature-grid">${amenityItems(cabin,legacyClass).map(x=>html`<div className="sx-feature"><b>${x.label}</b><span>${x.value}</span></div>`)}</div><div className="sx-note">Live seat occupancy, restrictions, exit-row eligibility and pricing are never inferred here. Those come from the Duffel seat map in Booking.</div></aside></div>`
}
function Walkthrough({bundle,aircraft,cabins}){
 const scenes=A(bundle.scenes).filter(s=>T(raw(s,"aircraft_id","aircraftId"))===aircraft._id).sort((a,b)=>N(raw(a,"sort_order","sortOrder"))-N(raw(b,"sort_order","sortOrder")));
 const startCode=T(raw(aircraft,"walkthrough_start_scene_code","walkthroughStartSceneCode"));const [code,setCode]=useState(startCode||T(raw(scenes[0],"scene_code","sceneCode")));useEffect(()=>setCode(startCode||T(raw(scenes[0],"scene_code","sceneCode"))),[aircraft._id]);
 if(!scenes.length){return html`<div className="sx-panel sx-panel-pad"><div className="sx-title">Virtual cabin rail</div><div className="sx-copy">No photographic walkthrough scenes are published for this aircraft yet. The rail below is generated from the published cabin configuration.</div><${AircraftRail} aircraft=${aircraft} cabins=${cabins}/></div>`}
 const scene=scenes.find(s=>T(raw(s,"scene_code","sceneCode"))===code)||scenes[0];const hs=A(bundle.sceneHotspots).filter(h=>T(raw(h,"scene_id","sceneId"))===T(scene.id));const [hot,setHot]=useState(T(raw(hs[0],"id","hotspot_code")));const next=T(raw(scene,"forward_scene_code","forwardSceneCode"));const back=T(raw(scene,"back_scene_code","backSceneCode"));
 return html`<div className="sx-scenes"><div className="sx-scene-list">${scenes.map(s=>{const c=T(raw(s,"scene_code","sceneCode"));return html`<button className=${`sx-scene-btn ${c===T(raw(scene,"scene_code","sceneCode"))?"active":""}`} onClick=${()=>transition(()=>setCode(c))}><b>${T(s.short_title||s.shortTitle||s.title)}</b><div>${c}</div></button>`})}</div><div><${HotspotStage} image=${T(raw(scene,"image_url","imageUrl"))} alt=${T(scene.title)} hotspots=${hs} active=${hot} setActive=${setHot} emptyTitle=${T(scene.title)} emptyText=${T(scene.summary)}/><div className="sx-scene-nav"><button className="sx-action" disabled=${!back} onClick=${()=>back&&transition(()=>setCode(back))}>← ${T(scene.back_label||scene.backLabel)||"Move forward"}</button><button className="sx-action" disabled=${!next} onClick=${()=>next&&transition(()=>setCode(next))}>${T(scene.forward_label||scene.forwardLabel)||"Move back"} →</button></div></div></div>`
}
function AircraftRail({aircraft,cabins,selected,setSelected}){const total=Math.max(1,cabins.reduce((n,c)=>n+Math.max(1,c._seats),0));return html`<div><div className="sx-rail"><button className="sx-segment" style=${{flex:"0 0 70px"}}><b>Nose</b><small>Door 1 · Galley</small></button>${cabins.map(c=>html`<button className=${`sx-segment ${selected===c._id?"active":""}`} style=${{flex:`${Math.max(1,c._seats)/total} 1 90px`}} onClick=${()=>setSelected?.(c._id)}><b>${c._name}</b><small>${c._seats} seats · ${c._code}</small></button>`)}<button className="sx-segment" style=${{flex:"0 0 82px"}}><b>Aft</b><small>Lav · Rear galley</small></button></div><div className="sx-wing"></div><div className="sx-note">Aircraft rail is generated from published cabin records. Doors, galleys and lavatories become exact interactive zones when walkthrough scenes are configured in Aircraft Display Control.</div></div>`}
function AircraftMap({aircraft,cabins,setCabin}){return html`<div className="sx-dashboard"><div className="sx-panel sx-panel-pad"><div className="sx-title">Interactive aircraft map</div><div className="sx-copy">Move from nose to tail and select a cabin zone.</div><${AircraftRail} aircraft=${aircraft} cabins=${cabins} setSelected=${setCabin}/></div><aside className="sx-panel sx-panel-pad"><div className="sx-title">Aircraft systems view</div><div className="sx-feature-grid"><div className="sx-feature"><b>Cabin zones</b><span>${cabins.length} published</span></div><div className="sx-feature"><b>Equipment</b><span>${aircraft._code||"—"}</span></div><div className="sx-feature"><b>Capacity</b><span>${aircraft._seats||"—"} seats</span></div><div className="sx-feature"><b>Source</b><span>Aircraft Display Control</span></div></div></aside></div>`}
function App({bundle,airline}){
 const mobile=useMedia();const aircrafts=useMemo(()=>A(bundle?.aircraft).map(normalizeAircraft),[bundle]);const [aid,setAid]=useState(aircrafts[0]?._id||"");const aircraft=aircrafts.find(a=>a._id===aid)||aircrafts[0];const cabins=useMemo(()=>aircraft?normalizeCabins(bundle,aircraft._id):[],[bundle,aircraft?._id]);const [cid,setCid]=useState(cabins[0]?._id||"");useEffect(()=>setCid(cabins[0]?._id||""),[aircraft?._id]);const cabin=cabins.find(c=>c._id===cid)||cabins[0];const [mode,setMode]=useState("seat");const legacy=legacyData(airline);const legacyClass=classForCabin(legacy,cabin);
 if(!aircraft)return html`<div className="sx-root"><style>${style}</style><div className="sx-shell"><div className="sx-empty">No published aircraft are available for this airline yet.</div></div></div>`;
 const modes=[["overview","Overview"],["cabin","Cabin Explorer"],["seat","Seat Experience"],["walk","Walkthrough"],["map","Aircraft Map"]];
 return html`<div className="sx-root"><style>${style}</style><section className="sx-shell"><header className="sx-head"><div><div className="sx-kicker">SKANDI · Onboard Experience</div><h2>${T(airline?.name||airline?.title||aircraft.airline_code||"Aircraft")} · ${aircraft._name}</h2><p>Explore the cabin, your seat environment, interactive aircraft views and front-to-back walkthrough content.</p></div><div className="sx-live"><i></i> Synced from Aircraft Display Control</div></header><div className="sx-aircraft-strip">${aircrafts.map(a=>html`<button className=${`sx-pill ${a._id===aircraft._id?"active":""}`} onClick=${()=>transition(()=>setAid(a._id))}>${a._code||"Aircraft"} · ${a._name}</button>`)}</div><div className="sx-mode-strip">${modes.map(([id,label])=>html`<button className=${`sx-pill ${mode===id?"active":""}`} onClick=${()=>transition(()=>setMode(id))}>${label}</button>`)}</div>${cabins.length?html`<div className="sx-cabin-strip">${cabins.map(c=>html`<button className=${`sx-pill ${c._id===cabin?._id?"active":""}`} onClick=${()=>transition(()=>setCid(c._id))}>${c._code} · ${c._name}</button>`)}</div>`:null}<div className="sx-body">${mode==="overview"?html`<${Overview} aircraft=${aircraft} cabins=${cabins} setCabin=${setCid}/>`:mode==="cabin"?html`<${CabinExplorer} bundle=${bundle} aircraft=${aircraft} cabin=${cabin} legacyClass=${legacyClass}/>`:mode==="seat"?html`<${SeatLab} aircraft=${aircraft} cabin=${cabin} legacyClass=${legacyClass} legacy=${legacy}/>`:mode==="walk"?html`<${Walkthrough} bundle=${bundle} aircraft=${aircraft} cabins=${cabins}/>`:html`<${AircraftMap} aircraft=${aircraft} cabins=${cabins} setCabin=${setCid}/>`}</div><footer className="sx-footer"><span><strong>Information mode:</strong> aircraft and cabin presentation only. Duffel supplies live sellable seat inventory during Booking.</span><button className="sx-action primary" onClick=${()=>navigate("/flights")}>Explore flights</button></footer></section></div>`
}
function mount(element,bundle,airline){if(!element)return;let root=roots.get(element);if(!root){root=createRoot(element);roots.set(element,root)}root.render(html`<${App} bundle=${bundle||{}} airline=${airline||{}}/>`)}
window.SKANDIOnboardReact={mount,version:"React 19.3 / SKANDI V9.11"};
window.dispatchEvent(new Event("SKANDI_ONBOARD_REACT_READY"));
const pending=window.__SKANDI_ONBOARD_PENDING__;if(pending){const el=document.getElementById(pending.elementId||"onboardReactRoot");if(el)mount(el,pending.bundle,pending.airline)}

</script>
</body>
</html>
