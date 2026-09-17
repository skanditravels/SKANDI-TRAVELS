# Our Network

STATUS: IN_PROGRESS
SLUG: /about/our-network
WIX PAGE: Our Network.wfe5g
AREA: SKANDI
LIVE HTML: YES
ELEMENT: #htmlSkandiMap
LAST SYNCED: 2026-09-16

## HOW TO USE
***STATUS (OWNER): "TODO", "IN PROGRESS", "NEEDS REVIEW", "REVISIONS NEEDED", "READY", "LIVE", "ARCHIVED"
STATUS (AGENT): "TODO", "IN PROGRESS", "REVISIONS NEEDED", "READY".***

###  COMMENT SECTION (START ON A NEW ROW, LOG IF A CHANGE IS MADE THAT REQUIRES ATTENTION) 
1. 9/17 3:02PM "Page might be restyled, but keeping same payloads, page not syncing correctly yet" / Samuel
2. 9/17 4:00PM "I'm re-working it" / Samuel
3.
...
***END*** 

#### LIVE HTML

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
<meta name="theme-color" content="#061a30" />
<title>Our Network | SKANDI Travels</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap" />
<link rel="stylesheet" href="https://unpkg.com/maplibre-gl@5.24.0/dist/maplibre-gl.css" />
<script defer src="https://unpkg.com/maplibre-gl@5.24.0/dist/maplibre-gl.js"></script>
<style>
/* =========================================================
   TOKENS
   ========================================================= */
:root{
  --sk-navy:#022e64;
  --sk-navy-deep:#061a30;
  --sk-navy-black:#03111f;
  --sk-blue:#0b3a7a;
  --sk-blue-soft:#1f6ba3;
  --sk-aqua:#5fc7cf;
  --sk-aqua-soft:#9de0e5;
  --sk-ivory:#fbfaf6;
  --sk-porcelain:#f5f1ea;
  --sk-champagne:#d1bc98;
  --sk-limestone:#d8d2c8;
  --sk-graphite:#1a1a1a;
  --sk-muted:#66758a;
  --sk-line:rgba(255,255,255,.14);
  --sk-line-dark:rgba(2,46,100,.14);
  --sk-shadow:0 26px 80px rgba(1,13,28,.30);
  --sk-panel-shadow:0 24px 64px rgba(1,13,28,.24);
  --sk-radius:18px;
  --sk-radius-lg:26px;
  --ease:cubic-bezier(.22,1,.36,1);
  --fast:180ms;
  --panel:340ms;
  --map-height:clamp(620px,calc(100dvh - 118px),920px);
  --z-map:1;
  --z-atmosphere:2;
  --z-overlay:10;
  --z-tooltip:20;
  --z-panel:30;
  --z-search:40;
  --z-sheet:50;
}
*{box-sizing:border-box}
html{scroll-behavior:smooth;background:var(--sk-ivory)}
body{
  margin:0;
  min-width:320px;
  background:var(--sk-ivory);
  color:var(--sk-graphite);
  font-family:"Montserrat",system-ui,-apple-system,"Segoe UI",sans-serif;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
  overflow-x:hidden;
}
button,input{font:inherit}
button{cursor:pointer}
a{color:inherit}
[hidden]{display:none!important}
:focus-visible{outline:3px solid rgba(95,199,207,.8);outline-offset:3px}
.sr-only{
  position:absolute!important;
  width:1px!important;height:1px!important;
  padding:0!important;margin:-1px!important;
  overflow:hidden!important;clip:rect(0,0,0,0)!important;
  white-space:nowrap!important;border:0!important;
}

/* =========================================================
   MAP HERO SHELL
   ========================================================= */
.network-app{position:relative;background:var(--sk-navy-deep)}
.network-hero{
  position:relative;
  min-height:var(--map-height);
  overflow:hidden;
  isolation:isolate;
  background:
    radial-gradient(circle at 18% 18%,rgba(95,199,207,.12),transparent 28%),
    radial-gradient(circle at 78% 22%,rgba(31,107,163,.18),transparent 34%),
    linear-gradient(145deg,#071c32 0%,#06172b 52%,#03101d 100%);
}
#networkMap{position:absolute;inset:0;z-index:var(--z-map);background:#06172b}
#networkMap canvas{filter:saturate(.82) contrast(1.04)}
.map-atmosphere{
  position:absolute;
  inset:0;
  z-index:var(--z-atmosphere);
  pointer-events:none;
  background:
    linear-gradient(180deg,rgba(1,12,25,.22) 0%,transparent 24%,transparent 62%,rgba(1,12,25,.38) 100%),
    radial-gradient(ellipse at center,transparent 48%,rgba(1,12,25,.34) 100%);
}
.map-atmosphere::after{
  content:"";
  position:absolute;
  inset:0;
  opacity:.18;
  mix-blend-mode:soft-light;
  background-image:radial-gradient(rgba(255,255,255,.22) .55px,transparent .65px);
  background-size:18px 18px;
  mask-image:linear-gradient(180deg,#000,transparent 70%);
}
.map-loading{
  position:absolute;
  inset:0;
  z-index:8;
  pointer-events:none;
  background:
    radial-gradient(circle at 26% 45%,rgba(95,199,207,.13),transparent 24%),
    radial-gradient(circle at 66% 30%,rgba(209,188,152,.08),transparent 22%),
    linear-gradient(110deg,#06182d 0%,#0a213b 42%,#06182d 70%);
  background-size:140% 100%;
  animation:atlasResolve 1.8s ease-in-out infinite alternate;
  transition:opacity .55s ease,visibility .55s ease;
}
.network-hero.map-ready .map-loading{opacity:0;visibility:hidden}
@keyframes atlasResolve{to{background-position:100% 0}}

.hero-copy{
  position:absolute;
  z-index:var(--z-overlay);
  top:clamp(26px,4.5vw,64px);
  left:clamp(20px,5vw,76px);
  width:min(560px,calc(100% - 40px));
  color:#fff;
  pointer-events:none;
  text-shadow:0 8px 28px rgba(1,10,22,.42);
}
.hero-eyebrow{
  display:flex;align-items:center;gap:12px;
  margin-bottom:12px;
  color:var(--sk-aqua-soft);
  font-size:11px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;
}
.hero-eyebrow::before{content:"";width:34px;height:1px;background:var(--sk-aqua)}
.hero-copy h1{
  margin:0;
  font-size:clamp(38px,5vw,68px);
  line-height:.94;
  letter-spacing:-.055em;
  font-weight:600;
}
.hero-copy p{
  margin:16px 0 0;
  max-width:520px;
  color:rgba(255,255,255,.78);
  font-size:clamp(13px,1.25vw,16px);
  line-height:1.68;
  font-weight:500;
}
.network-meta{
  display:flex;align-items:center;flex-wrap:wrap;gap:8px 14px;
  margin-top:18px;
  color:rgba(255,255,255,.7);
  font-size:10px;font-weight:700;letter-spacing:.02em;
}
.network-meta span+span::before{content:"·";margin-right:14px;color:rgba(255,255,255,.34)}
.network-hero.map-ready .hero-copy{animation:heroSettle .8s var(--ease) both}
@keyframes heroSettle{from{opacity:.25;transform:translateY(16px)}to{opacity:1;transform:none}}

/* =========================================================
   FLOATING CONTROLS
   ========================================================= */
.map-toolbar{
  position:absolute;
  z-index:var(--z-overlay);
  top:clamp(190px,31vh,290px);
  left:clamp(20px,5vw,76px);
  display:flex;align-items:center;gap:8px;
  max-width:calc(100% - 40px);
  pointer-events:auto;
}
.mode-rail{
  display:flex;align-items:center;gap:4px;
  padding:5px;
  border:1px solid rgba(255,255,255,.16);
  border-radius:999px;
  background:rgba(4,21,39,.72);
  backdrop-filter:blur(18px) saturate(1.2);
  box-shadow:0 16px 44px rgba(0,0,0,.22);
}
.mode-btn,.icon-btn,.region-btn{
  appearance:none;
  border:0;
  color:rgba(255,255,255,.72);
  background:transparent;
  transition:background var(--fast) ease,color var(--fast) ease,transform var(--fast) ease;
}
.mode-btn{
  min-height:38px;
  padding:0 14px;
  border-radius:999px;
  font-size:10px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;
}
.mode-btn:hover{color:#fff;background:rgba(255,255,255,.08)}
.mode-btn.active{color:#07192c;background:var(--sk-ivory);box-shadow:0 6px 18px rgba(0,0,0,.18)}
.icon-btn{
  width:46px;height:46px;border-radius:50%;
  display:grid;place-items:center;
  border:1px solid rgba(255,255,255,.16);
  background:rgba(4,21,39,.72);
  backdrop-filter:blur(18px);
  color:#fff;
  box-shadow:0 12px 30px rgba(0,0,0,.18);
}
.icon-btn:hover{background:rgba(8,46,78,.86);transform:translateY(-1px)}
.icon-btn svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.region-strip{
  position:absolute;
  z-index:var(--z-overlay);
  left:clamp(20px,5vw,76px);
  top:calc(clamp(190px,31vh,290px) + 58px);
  display:flex;gap:6px;
  max-width:min(720px,calc(100% - 40px));
  overflow:auto;
  scrollbar-width:none;
  pointer-events:auto;
}
.region-strip::-webkit-scrollbar{display:none}
.region-btn{
  flex:0 0 auto;
  min-height:32px;
  padding:0 11px;
  border-radius:999px;
  border:1px solid rgba(255,255,255,.13);
  background:rgba(4,21,39,.54);
  backdrop-filter:blur(12px);
  color:rgba(255,255,255,.64);
  font-size:9px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;
}
.region-btn:hover,.region-btn.active{color:#fff;border-color:rgba(95,199,207,.5);background:rgba(15,65,96,.64)}
.map-utilities{
  position:absolute;
  z-index:var(--z-overlay);
  right:clamp(18px,2.6vw,36px);
  bottom:clamp(26px,4vw,42px);
  display:flex;flex-direction:column;gap:8px;
}
.utility-stack{display:flex;flex-direction:column;overflow:hidden;border-radius:16px;border:1px solid rgba(255,255,255,.16);background:rgba(4,21,39,.7);backdrop-filter:blur(16px)}
.utility-stack button{width:44px;height:42px;border:0;background:transparent;color:#fff;font-size:20px}
.utility-stack button+button{border-top:1px solid rgba(255,255,255,.1)}
.utility-stack button:hover{background:rgba(255,255,255,.08)}

/* =========================================================
   SEARCH
   ========================================================= */
.search-layer{
  position:absolute;inset:0;z-index:var(--z-search);
  display:grid;place-items:start center;
  padding:clamp(34px,8vh,86px) 20px 20px;
  background:rgba(1,12,25,.56);
  backdrop-filter:blur(16px);
  opacity:0;visibility:hidden;pointer-events:none;
  transition:opacity .24s ease,visibility .24s ease;
}
.search-layer.open{opacity:1;visibility:visible;pointer-events:auto}
.search-panel{
  width:min(700px,100%);
  max-height:min(76dvh,720px);
  overflow:hidden;
  border:1px solid rgba(255,255,255,.16);
  border-radius:24px;
  background:rgba(251,250,246,.97);
  box-shadow:0 36px 100px rgba(0,0,0,.42);
  transform:translateY(-12px) scale(.98);
  transition:transform .34s var(--ease);
}
.search-layer.open .search-panel{transform:none}
.search-head{display:flex;align-items:center;gap:12px;padding:16px 16px 14px;border-bottom:1px solid rgba(2,46,100,.09)}
.search-symbol{width:40px;height:40px;display:grid;place-items:center;color:var(--sk-navy);flex:0 0 auto}
.search-symbol svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:1.8}
.search-input{
  flex:1;min-width:0;height:46px;border:0;outline:0;background:transparent;
  color:var(--sk-graphite);font-size:16px;font-weight:650;
}
.search-input::placeholder{color:#8591a0}
.search-close{width:38px;height:38px;border:0;border-radius:50%;background:#edf1f5;color:var(--sk-navy);font-size:22px}
.search-body{max-height:calc(min(76dvh,720px) - 78px);overflow:auto;padding:10px 10px 18px}
.search-empty{padding:30px 18px;color:#7a8796;font-size:13px;line-height:1.6;text-align:center}
.search-group{padding:8px 0}
.search-group-label{padding:8px 12px 5px;color:#8a8278;font-size:9px;font-weight:800;letter-spacing:.13em;text-transform:uppercase}
.search-result{
  width:100%;min-height:60px;border:0;border-radius:14px;background:transparent;
  display:grid;grid-template-columns:38px 1fr auto;align-items:center;gap:12px;
  padding:8px 10px;text-align:left;color:var(--sk-graphite);
}
.search-result:hover,.search-result.active{background:#eef5f7}
.result-icon{width:34px;height:34px;border-radius:12px;display:grid;place-items:center;background:#e7edf4;color:var(--sk-navy);font-size:10px;font-weight:800}
.result-icon.collection{background:#f1eadf;color:#755f3d;transform:rotate(45deg);border-radius:9px}
.result-icon.collection span{transform:rotate(-45deg)}
.result-copy strong{display:block;font-size:13px;line-height:1.3}
.result-copy span{display:block;margin-top:3px;color:#778493;font-size:11px;line-height:1.3}
.result-type{color:#9aa3ae;font-size:9px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}

/* =========================================================
   TOOLTIP + PANELS
   ========================================================= */
.map-tooltip{
  position:absolute;z-index:var(--z-tooltip);pointer-events:none;
  min-width:160px;max-width:250px;
  padding:10px 12px;
  border:1px solid rgba(255,255,255,.14);
  border-radius:14px;
  background:rgba(4,21,39,.9);
  backdrop-filter:blur(14px);
  color:#fff;
  box-shadow:0 12px 34px rgba(0,0,0,.24);
  opacity:0;transform:translate(-50%,-110%) translateY(-5px);
  transition:opacity .14s ease,transform .14s ease;
}
.map-tooltip.visible{opacity:1;transform:translate(-50%,-110%)}
.map-tooltip strong{display:block;font-size:12px}
.map-tooltip span{display:block;margin-top:3px;color:rgba(255,255,255,.64);font-size:10px;line-height:1.35}
.detail-panel{
  position:absolute;
  z-index:var(--z-panel);
  top:clamp(20px,3vw,34px);
  right:clamp(18px,2.6vw,36px);
  width:min(430px,calc(100% - 36px));
  max-height:calc(var(--map-height) - 72px);
  overflow:auto;
  border:1px solid rgba(255,255,255,.18);
  border-radius:26px;
  background:rgba(251,250,246,.94);
  backdrop-filter:blur(22px) saturate(1.15);
  box-shadow:var(--sk-panel-shadow);
  color:var(--sk-graphite);
  transform:translateX(calc(100% + 56px));
  opacity:0;pointer-events:none;
  transition:transform var(--panel) var(--ease),opacity .22s ease;
}
.detail-panel.open{transform:none;opacity:1;pointer-events:auto}
.panel-media{
  position:relative;height:220px;overflow:hidden;border-radius:25px 25px 0 0;
  background:linear-gradient(135deg,#0d3255,#071a30 55%,#123f58);
}
.panel-media img{width:100%;height:100%;object-fit:cover;display:block;opacity:0;transition:opacity .38s ease,transform .7s var(--ease);transform:scale(1.02)}
.panel-media img.loaded{opacity:1;transform:scale(1)}
.panel-media::after{content:"";position:absolute;inset:30% 0 0;background:linear-gradient(180deg,transparent,rgba(3,17,31,.48));pointer-events:none}
.panel-fallback{position:absolute;inset:0;display:grid;place-items:center;color:rgba(255,255,255,.45);font-size:10px;font-weight:800;letter-spacing:.15em;text-transform:uppercase}
.panel-close{position:absolute;z-index:2;right:14px;top:14px;width:38px;height:38px;border:1px solid rgba(255,255,255,.2);border-radius:50%;background:rgba(4,21,39,.58);color:#fff;font-size:22px;backdrop-filter:blur(10px)}
.panel-body{padding:22px 22px 24px}
.panel-eyebrow{color:#7f735f;font-size:9px;font-weight:800;letter-spacing:.13em;text-transform:uppercase}
.panel-title{margin:7px 0 0;color:var(--sk-navy);font-size:clamp(26px,2.5vw,38px);line-height:1;letter-spacing:-.045em;font-weight:650}
.panel-meta{margin-top:8px;color:#667486;font-size:11px;font-weight:700}
.panel-copy{margin:16px 0 0;color:#405064;font-size:12px;line-height:1.72}
.tag-list{display:flex;flex-wrap:wrap;gap:6px;margin-top:16px}
.tag{display:inline-flex;align-items:center;min-height:27px;padding:0 9px;border:1px solid rgba(2,46,100,.12);border-radius:999px;background:rgba(255,255,255,.6);color:#405064;font-size:9px;font-weight:750}
.panel-facts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:18px}
.fact{padding:11px 12px;border-radius:13px;background:#f1f4f5;border:1px solid rgba(2,46,100,.07)}
.fact small{display:block;color:#8b96a2;font-size:8px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
.fact strong{display:block;margin-top:4px;color:var(--sk-navy);font-size:12px;line-height:1.35}
.panel-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:20px}
.panel-action{
  min-height:44px;border-radius:999px;border:1px solid var(--sk-navy);padding:0 14px;
  display:inline-flex;align-items:center;justify-content:center;text-align:center;text-decoration:none;
  font-size:9px;font-weight:850;letter-spacing:.06em;text-transform:uppercase;
  transition:transform var(--fast) ease,box-shadow var(--fast) ease,background var(--fast) ease;
}
.panel-action.primary{background:var(--sk-navy);color:#fff}
.panel-action.secondary{background:transparent;color:var(--sk-navy)}
.panel-action:hover{transform:translateY(-1px);box-shadow:0 9px 18px rgba(2,46,100,.16)}
.related-list{display:grid;gap:6px;margin-top:17px}
.related-title{margin:0 0 3px;color:#8b96a2;font-size:8px;font-weight:850;letter-spacing:.12em;text-transform:uppercase}
.related-item{width:100%;border:0;border-radius:12px;background:#fff;padding:10px 11px;text-align:left;display:flex;align-items:center;justify-content:space-between;gap:10px;color:var(--sk-navy)}
.related-item:hover{background:#edf5f6}
.related-item strong{font-size:10px;line-height:1.25}.related-item span{color:#7a8794;font-size:9px}

/* =========================================================
   STATUS / ERROR
   ========================================================= */
.map-status{
  position:absolute;z-index:var(--z-overlay);left:50%;bottom:30px;transform:translateX(-50%);
  min-width:min(430px,calc(100% - 40px));
  padding:12px 14px;border:1px solid rgba(255,255,255,.16);border-radius:16px;
  background:rgba(4,21,39,.86);backdrop-filter:blur(14px);color:#fff;
  box-shadow:0 16px 40px rgba(0,0,0,.24);
  display:flex;align-items:center;justify-content:space-between;gap:14px;
  font-size:11px;line-height:1.4;
}
.map-status button{border:0;border-radius:999px;background:#fff;color:var(--sk-navy);padding:8px 11px;font-size:9px;font-weight:850;text-transform:uppercase;letter-spacing:.06em}
.map-status[data-tone="info"]{background:rgba(4,21,39,.78)}
.map-status[data-tone="error"]{background:rgba(58,22,27,.88)}

/* =========================================================
   MOBILE SHEET
   ========================================================= */
.mobile-sheet{display:none}
.sheet-handle{width:44px;height:5px;border-radius:999px;background:#c5c8cb;margin:10px auto}
.sheet-snap{position:absolute;right:16px;top:11px;border:0;border-radius:999px;background:#edf0f2;color:var(--sk-navy);padding:7px 10px;font-size:9px;font-weight:800;text-transform:uppercase}

/* =========================================================
   EDITORIAL CHAPTERS
   ========================================================= */
.editorial{
  position:relative;
  z-index:2;
  margin-top:-1px;
  background:var(--sk-ivory);
  color:var(--sk-graphite);
}
.editorial::before{
  content:"";
  position:absolute;left:0;right:0;top:-120px;height:122px;
  pointer-events:none;
  background:linear-gradient(180deg,rgba(6,26,48,0),var(--sk-ivory));
}
.chapter{max-width:1320px;margin:0 auto;padding:clamp(70px,9vw,118px) clamp(20px,5vw,68px)}
.chapter-head{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(280px,.8fr);gap:40px;align-items:end;margin-bottom:36px}
.chapter-kicker{color:#7f735f;font-size:10px;font-weight:850;letter-spacing:.16em;text-transform:uppercase}
.chapter h2{margin:8px 0 0;color:var(--sk-navy);font-size:clamp(34px,4vw,58px);line-height:.98;letter-spacing:-.05em;font-weight:600}
.chapter-intro{color:#5e6b7a;font-size:13px;line-height:1.75}
.feature-grid{display:grid;grid-template-columns:1.35fr .65fr;grid-template-rows:repeat(2,minmax(220px,1fr));gap:14px}
.feature-card{
  position:relative;overflow:hidden;min-height:220px;border:0;border-radius:22px;background:#0d2a47;color:#fff;text-align:left;padding:0;
  box-shadow:0 18px 44px rgba(2,46,100,.12);
}
.feature-card:first-child{grid-row:1/3;min-height:460px}
.feature-card img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:transform .75s var(--ease),opacity .35s ease}
.feature-card:hover img{transform:scale(1.035)}
.feature-card::after{content:"";position:absolute;inset:22% 0 0;background:linear-gradient(180deg,transparent,rgba(3,14,26,.86))}
.feature-card-copy{position:absolute;z-index:2;left:24px;right:24px;bottom:22px}
.feature-card small{color:var(--sk-aqua-soft);font-size:9px;font-weight:850;letter-spacing:.13em;text-transform:uppercase}
.feature-card strong{display:block;margin-top:6px;font-size:clamp(22px,2vw,34px);line-height:1.05;letter-spacing:-.035em}
.feature-card span{display:block;margin-top:7px;color:rgba(255,255,255,.68);font-size:11px;line-height:1.5}
.collection-rail{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(290px,34%);gap:14px;overflow-x:auto;padding:4px 0 16px;scroll-snap-type:x proximity;scrollbar-width:thin}
.collection-card{scroll-snap-align:start;border:0;border-radius:22px;background:#fff;overflow:hidden;text-align:left;box-shadow:0 14px 36px rgba(2,46,100,.10)}
.collection-card-media{position:relative;height:260px;background:linear-gradient(140deg,#12314c,#0b2137)}
.collection-card-media img{width:100%;height:100%;object-fit:cover}
.collection-badge{position:absolute;left:14px;top:14px;padding:8px 10px;border-radius:999px;background:rgba(245,241,234,.92);color:#6f5937;font-size:8px;font-weight:850;letter-spacing:.08em;text-transform:uppercase;backdrop-filter:blur(10px)}
.collection-copy{padding:16px 17px 18px}.collection-copy small{color:#8a8278;font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:.12em}.collection-copy strong{display:block;margin-top:5px;color:var(--sk-navy);font-size:17px;line-height:1.2}.collection-copy p{margin:8px 0 0;color:#6b7682;font-size:11px;line-height:1.55}
.airline-rail{display:flex;flex-wrap:wrap;gap:9px}
.airline-chip{min-height:52px;border:1px solid rgba(2,46,100,.12);border-radius:15px;background:#fff;padding:8px 13px;display:flex;align-items:center;gap:10px;color:var(--sk-navy);box-shadow:0 8px 22px rgba(2,46,100,.06)}
.airline-chip img{width:38px;height:26px;object-fit:contain}.airline-chip strong{font-size:11px}.airline-chip small{display:block;margin-top:2px;color:#8a95a1;font-size:8px}
.plan-band{margin-top:22px;border-radius:26px;padding:clamp(30px,5vw,64px);background:linear-gradient(135deg,var(--sk-navy) 0%,#0b4165 100%);color:#fff;display:grid;grid-template-columns:1fr auto;align-items:center;gap:30px;overflow:hidden;position:relative}
.plan-band::after{content:"";position:absolute;width:360px;height:360px;border-radius:50%;right:-130px;top:-190px;border:1px solid rgba(95,199,207,.35);box-shadow:0 0 0 42px rgba(95,199,207,.035),0 0 0 86px rgba(95,199,207,.025)}
.plan-band h3{position:relative;z-index:1;margin:0;font-size:clamp(26px,3vw,42px);line-height:1.05;letter-spacing:-.04em;font-weight:600}.plan-band p{position:relative;z-index:1;margin:10px 0 0;color:rgba(255,255,255,.68);font-size:12px;line-height:1.6;max-width:650px}.plan-band button{position:relative;z-index:1;min-height:46px;border:0;border-radius:999px;background:#fff;color:var(--sk-navy);padding:0 18px;font-size:9px;font-weight:850;letter-spacing:.07em;text-transform:uppercase}

/* =========================================================
   ACCESSIBLE DIRECTORY
   ========================================================= */
.directory{border-top:1px solid rgba(2,46,100,.09);background:#f0eee9}
.directory-inner{max-width:1320px;margin:0 auto;padding:48px clamp(20px,5vw,68px) 70px}
.directory-head{display:flex;justify-content:space-between;gap:24px;align-items:end;margin-bottom:24px}.directory-head h2{margin:0;color:var(--sk-navy);font-size:25px;letter-spacing:-.035em}.directory-head p{margin:0;color:#75808c;font-size:11px}
.directory-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:26px}.directory-group h3{margin:0 0 11px;color:#817766;font-size:9px;font-weight:850;letter-spacing:.13em;text-transform:uppercase}.directory-list{display:grid;gap:3px}.directory-link{border:0;background:transparent;padding:6px 0;text-align:left;color:#435266;font-size:10px;line-height:1.4}.directory-link:hover{color:var(--sk-navy);text-decoration:underline;text-underline-offset:3px}

/* MapLibre control styling */
.maplibregl-ctrl-bottom-right{right:12px!important;bottom:10px!important}.maplibregl-ctrl-attrib{background:rgba(4,21,39,.56)!important;color:rgba(255,255,255,.52)!important;border-radius:10px!important;backdrop-filter:blur(8px);font-size:9px!important}.maplibregl-ctrl-attrib a{color:rgba(255,255,255,.68)!important}.maplibregl-ctrl-logo{opacity:.5;transform:scale(.72);transform-origin:bottom left}

/* =========================================================
   RESPONSIVE
   ========================================================= */
@media (max-width:1100px){
  :root{--map-height:clamp(640px,calc(100dvh - 110px),880px)}
  .hero-copy{width:min(500px,calc(100% - 40px))}
  .detail-panel{width:min(390px,calc(100% - 36px))}
}
@media (max-width:820px){
  :root{--map-height:min(820px,calc(100dvh - 92px))}
  .network-hero{min-height:max(650px,var(--map-height))}
  .hero-copy{top:24px;left:20px;width:calc(100% - 40px)}
  .hero-copy h1{font-size:40px}.hero-copy p{font-size:12px;max-width:440px}.network-meta{font-size:9px;margin-top:13px}
  .map-toolbar{left:16px;right:16px;top:auto;bottom:18px;max-width:none;justify-content:center;z-index:24}
  .mode-rail{max-width:calc(100% - 54px);overflow:auto;scrollbar-width:none}.mode-rail::-webkit-scrollbar{display:none}.mode-btn{min-height:40px;padding:0 12px}
  .map-toolbar>.icon-btn{flex:0 0 44px}
  .region-strip{left:16px;right:16px;top:auto;bottom:72px;max-width:none}
  .map-utilities{right:14px;top:172px;bottom:auto}.utility-stack button{width:40px;height:38px}
  .detail-panel{display:none}
  .mobile-sheet{
    display:block;position:absolute;z-index:var(--z-sheet);left:8px;right:8px;bottom:8px;height:76%;
    border-radius:24px 24px 18px 18px;background:rgba(251,250,246,.98);box-shadow:0 -18px 60px rgba(0,0,0,.28);overflow:hidden;
    transform:translateY(calc(100% - 118px));transition:transform .34s var(--ease);pointer-events:none;
  }
  .mobile-sheet.open{pointer-events:auto}.mobile-sheet[data-snap="peek"]{transform:translateY(calc(100% - 118px))}.mobile-sheet[data-snap="medium"]{transform:translateY(42%)}.mobile-sheet[data-snap="full"]{transform:translateY(0)}
  .mobile-sheet-content{height:calc(100% - 28px);overflow:auto;padding:0 17px 24px}.mobile-sheet .panel-media{height:188px;margin:0 -17px;border-radius:0}.mobile-sheet .panel-body{padding:18px 0 20px}.mobile-sheet .panel-actions{grid-template-columns:1fr}.mobile-sheet .panel-title{font-size:30px}
  .map-status{bottom:126px}
  .chapter-head{grid-template-columns:1fr;gap:16px}.feature-grid{grid-template-columns:1fr;grid-template-rows:auto}.feature-card:first-child{grid-row:auto;min-height:390px}.feature-card{min-height:260px}.collection-rail{grid-auto-columns:minmax(280px,78%)}.directory-grid{grid-template-columns:repeat(2,1fr)}
}
@media (max-width:560px){
  :root{--map-height:calc(100svh - 76px)}
  .network-hero{min-height:max(620px,var(--map-height))}
  .hero-eyebrow{font-size:9px;margin-bottom:8px}.hero-copy h1{font-size:35px}.hero-copy p{max-width:320px;line-height:1.55}.network-meta{max-width:330px;gap:5px 9px}.network-meta span+span::before{margin-right:9px}
  .mode-btn{font-size:9px;padding:0 10px}.mode-btn[data-mode="destinations"]{display:none}
  .region-strip{bottom:70px}.map-utilities{top:150px}.map-tooltip{display:none}
  .search-layer{padding:10px}.search-panel{width:100%;max-height:calc(100dvh - 20px);border-radius:20px}.search-body{max-height:calc(100dvh - 96px)}
  .chapter{padding:70px 20px}.chapter h2{font-size:38px}.feature-card:first-child{min-height:360px}.feature-card{border-radius:18px}.collection-rail{grid-auto-columns:86%}.collection-card{border-radius:18px}.plan-band{grid-template-columns:1fr;padding:34px 24px;border-radius:20px}.plan-band button{justify-self:start}.directory-inner{padding:42px 20px 60px}.directory-grid{grid-template-columns:1fr 1fr;gap:24px 16px}.directory-head{align-items:start;flex-direction:column}
  .maplibregl-ctrl-attrib{max-width:180px!important;font-size:8px!important}
}
@media (prefers-reduced-motion:reduce){
  html{scroll-behavior:auto}.map-loading{animation:none}.network-hero.map-ready .hero-copy{animation:none}.feature-card img,.panel-media img,.detail-panel,.mobile-sheet,.search-panel{transition-duration:.01ms!important}.map-atmosphere::after{display:none}
}
</style>
</head>
<body>
<div class="network-app" id="networkApp">
  <section class="network-hero" id="networkHero" aria-labelledby="networkTitle">
    <div id="networkMap" role="application" aria-label="Interactive SKANDI network map"></div>
    <div class="map-loading" id="mapLoading" aria-hidden="true"></div>
    <div class="map-atmosphere" aria-hidden="true"></div>

    <header class="hero-copy">
      <div class="hero-eyebrow">SKANDI Travels</div>
      <h1 id="networkTitle">Our Network</h1>
      <p>Where the SKANDI world comes together. Explore destinations, handpicked Collection stays and trusted airline connections.</p>
      <div class="network-meta" id="networkMeta" aria-live="polite"></div>
    </header>

    <div class="map-toolbar" aria-label="Network map modes">
      <div class="mode-rail" id="modeRail">
        <button class="mode-btn active" type="button" data-mode="explore" aria-pressed="true">Explore</button>
        <button class="mode-btn" type="button" data-mode="destinations" aria-pressed="false">Destinations</button>
        <button class="mode-btn" type="button" data-mode="collection" aria-pressed="false">Collection</button>
        <button class="mode-btn" type="button" data-mode="airlines" aria-pressed="false">Airlines</button>
      </div>
      <button class="icon-btn" id="searchOpen" type="button" aria-label="Search the SKANDI network">
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.8-3.8"></path></svg>
      </button>
    </div>

    <div class="region-strip" id="regionStrip" aria-label="Filter network by region"></div>

    <div class="map-utilities" aria-label="Map controls">
      <div class="utility-stack">
        <button id="zoomIn" type="button" aria-label="Zoom in">+</button>
        <button id="zoomOut" type="button" aria-label="Zoom out">−</button>
      </div>
      <button class="icon-btn" id="resetMap" type="button" aria-label="Reset network view">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2.3 5.7"></path><path d="M20 4v7h-7"></path></svg>
      </button>
    </div>

    <div class="map-tooltip" id="mapTooltip" role="tooltip"><strong></strong><span></span></div>

    <aside class="detail-panel" id="detailPanel" aria-label="Selected network detail" aria-hidden="true">
      <div class="panel-media">
        <div class="panel-fallback">SKANDI Network</div>
        <img id="panelImage" alt="" loading="lazy" />
        <button class="panel-close" id="panelClose" type="button" aria-label="Close detail panel">×</button>
      </div>
      <div class="panel-body" id="panelBody"></div>
    </aside>

    <section class="mobile-sheet" id="mobileSheet" data-snap="peek" aria-label="Selected network detail">
      <div class="sheet-handle" aria-hidden="true"></div>
      <button class="sheet-snap" id="sheetSnap" type="button" aria-label="Expand details">Expand</button>
      <div class="mobile-sheet-content" id="mobileSheetContent"></div>
    </section>

    <div class="search-layer" id="searchLayer" aria-hidden="true">
      <section class="search-panel" role="dialog" aria-modal="true" aria-labelledby="searchLabel">
        <div class="search-head">
          <div class="search-symbol" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.8-3.8"></path></svg></div>
          <label class="sr-only" id="searchLabel" for="networkSearch">Search the SKANDI network</label>
          <input class="search-input" id="networkSearch" autocomplete="off" placeholder="Search the SKANDI network" />
          <button class="search-close" id="searchClose" type="button" aria-label="Close search">×</button>
        </div>
        <div class="search-body" id="searchResults"></div>
      </section>
    </div>

    <div class="map-status" id="mapStatus" data-tone="info" hidden>
      <span id="mapStatusText"></span>
      <button id="mapRetry" type="button" hidden>Try again</button>
    </div>

    <div class="sr-only" id="selectionLive" aria-live="polite"></div>
  </section>
</div>

<main class="editorial" id="editorialContent">
  <section class="chapter" aria-labelledby="discoverHeading">
    <div class="chapter-head">
      <div>
        <div class="chapter-kicker">From the Nordics, outward</div>
        <h2 id="discoverHeading">Travel the network, not just the map.</h2>
      </div>
      <p class="chapter-intro">A curated view of the places, stays and airline relationships published across the SKANDI network. Select any story below to return directly to its geography.</p>
    </div>
    <div class="feature-grid" id="featuredDestinations"></div>
  </section>

  <section class="chapter" id="collectionChapter" aria-labelledby="collectionHeading">
    <div class="chapter-head">
      <div>
        <div class="chapter-kicker">Handpicked by SKANDI</div>
        <h2 id="collectionHeading">SKANDI Collection</h2>
      </div>
      <p class="chapter-intro">Selected properties with a distinct sense of place. Availability and live pricing are requested only when you enter the booking journey.</p>
    </div>
    <div class="collection-rail" id="collectionRail"></div>
  </section>

  <section class="chapter" id="airlineChapter" aria-labelledby="airlineHeading">
    <div class="chapter-head">
      <div>
        <div class="chapter-kicker">Trusted connections</div>
        <h2 id="airlineHeading">Partner airlines</h2>
      </div>
      <p class="chapter-intro">Explore the airline relationships attached to published SKANDI network connections. Airline operation remains clearly attributed to the operating carrier.</p>
    </div>
    <div class="airline-rail" id="airlineRail"></div>
    <div class="plan-band">
      <div>
        <h3>Seen somewhere you want to go?</h3>
        <p>Move from discovery into the existing SKANDI booking journey without losing the network context you selected.</p>
      </div>
      <button type="button" id="planJourney">Plan your journey</button>
    </div>
  </section>
</main>

<section class="directory" aria-labelledby="directoryHeading">
  <div class="directory-inner">
    <div class="directory-head">
      <div><h2 id="directoryHeading">Network directory</h2></div>
      <p>Accessible links to the same published network shown on the map.</p>
    </div>
    <div class="directory-grid" id="directoryGrid"></div>
  </div>
</section>

<script>
/* =========================================================
   CONFIG / CONTRACT
   ========================================================= */
const HTML_SOURCE = "SKANDI_PUBLIC_NETWORK_MAP";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";
const MAP_STYLE_URL = "https://tiles.openfreemap.org/styles/dark";
const BOOKING_ROUTE = "/booking";
const HOTEL_SEARCH_ROUTE = "/hotels";
const SAFE_PROTOCOLS = new Set(["http:","https:"]);
const REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const SAVE_DATA = Boolean(navigator.connection && navigator.connection.saveData);
const IS_MOBILE = () => window.matchMedia("(max-width: 820px)").matches;

/* =========================================================
   STATE
   ========================================================= */
const state = {
  mode:"explore",
  selectionType:null,
  selectionId:null,
  selectedAirlineId:null,
  selectedRegion:null,
  searchOpen:false,
  panelOpen:false,
  mobileSheetState:"peek",
  mapReady:false,
  dataState:"idle",
  dataReceived:false,
  retryCount:0,
  hover:{type:null,id:null},
  payload:null,
  model:{destinations:[],hotels:[],airports:[],airlines:[],routes:[],regions:[],stats:{}},
  map:null,
  mapInitialized:false,
  pendingPayload:null,
  routeAnimationFrame:0,
  resizeObserver:null
};

const el = {};
function cacheElements(){
  ["networkHero","networkMap","networkMeta","modeRail","regionStrip","searchOpen","searchLayer","searchClose","networkSearch","searchResults","mapTooltip","detailPanel","panelClose","panelImage","panelBody","mobileSheet","mobileSheetContent","sheetSnap","zoomIn","zoomOut","resetMap","mapStatus","mapStatusText","mapRetry","selectionLive","featuredDestinations","collectionChapter","collectionRail","airlineChapter","airlineRail","planJourney","directoryGrid"].forEach(id=>{el[id]=document.getElementById(id)});
}

/* =========================================================
   UTILITIES / VALIDATION
   ========================================================= */
function firstDefined(...values){return values.find(v=>v!==undefined&&v!==null&&v!=="") ?? ""}
function cleanString(value,max=500){return String(value??"").trim().slice(0,max)}
function cleanId(value){return cleanString(value,160)}
function toNumber(value){
  if(typeof value==="number"&&Number.isFinite(value))return value;
  if(typeof value==="string"){
    const n=Number(value.trim().replace(",","."));
    return Number.isFinite(n)?n:null;
  }
  return null;
}
function validCoordinate(lat,lng){return Number.isFinite(lat)&&Number.isFinite(lng)&&lat>=-90&&lat<=90&&lng>=-180&&lng<=180}
function toArray(value){
  if(Array.isArray(value))return value.map(v=>cleanString(typeof v==="object"?firstDefined(v.code,v.id,v.name,v.label):v,120)).filter(Boolean);
  if(typeof value==="string")return value.split(",").map(v=>v.trim()).filter(Boolean);
  return [];
}
function unique(values){return [...new Set((values||[]).map(v=>cleanString(v,180)).filter(Boolean))]}
function slugify(value){return cleanString(value,120).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}
function safeUrl(value){
  const raw=cleanString(value,1500);
  if(!raw)return "";
  if(raw.startsWith("/"))return raw;
  if(raw.startsWith("?"))return raw;
  if(/^[a-z0-9][a-z0-9/_-]*(\?.*)?$/i.test(raw))return "/"+raw.replace(/^\/+/,"");
  try{
    const url=new URL(raw,window.location.origin);
    if(!SAFE_PROTOCOLS.has(url.protocol))return "";
    return url.href;
  }catch{return ""}
}
function getLocation(item={}){
  const nested=item.location||item.geoLocation||item.coordinates||item.addressLocation||item.mapLocation||{};
  const lat=toNumber(firstDefined(item.lat,item.latitude,item.Latitude,nested.lat,nested.latitude,Array.isArray(item.coordinates)?item.coordinates[1]:""));
  const lng=toNumber(firstDefined(item.lng,item.lon,item.long,item.longitude,item.Longitude,nested.lng,nested.lon,nested.long,nested.longitude,Array.isArray(item.coordinates)?item.coordinates[0]:""));
  return {lat,lng,valid:validCoordinate(lat,lng)};
}
function imageUrl(item={}){return safeUrl(firstDefined(item.heroImage,item.image,item.mainImage,item.coverImage,item.imageUrl,item.media?.hero?.url,item.asset?.publicUrl))}
function pageUrl(item={}){
  const direct=safeUrl(firstDefined(item.pageUrl,item.url,item.link,item.pageLink,item.href));
  if(direct)return direct;
  if(Array.isArray(item.linked)){
    for(const linked of item.linked){const candidate=safeUrl(linked&&firstDefined(linked.url,linked.pageUrl,linked.href));if(candidate)return candidate}
  }
  return "";
}
function mapDataMessagePayload(data){
  if(typeof data==="string"){try{data=JSON.parse(data)}catch{return null}}
  if(!data||typeof data!=="object")return null;
  if(data.source&&data.source!==PARENT_SOURCE)return null;
  const type=cleanString(data.type).toUpperCase();
  if(type&&type!=="SKANDI_MAP_DATA"&&type!=="SKANDI-MAP-DATA")return null;
  const payload=data.payload||data.data||data;
  if(!payload||typeof payload!=="object")return null;
  if(!["destinations","routes","hotels","airports","airlines"].some(k=>Array.isArray(payload[k])))return null;
  return payload;
}
function logger(event,detail={}){console.info("[SKANDI NETWORK]",event,detail)}
function analytics(event,detail={}){
  try{window.parent?.postMessage({source:HTML_SOURCE,type:"SKANDI_MAP_ANALYTICS",event,detail},"*")}catch{}
}

/* =========================================================
   NORMALIZATION
   ========================================================= */
function normalizeDestination(item={},derived=false){
  const loc=getLocation(item);
  const id=cleanId(firstDefined(item.publicId,item.id,item.code,item.Code,item.slug,item._id,item.iata,item.IATA));
  const iata=cleanString(firstDefined(item.iata,item.IATA,item.airportCode),8).toUpperCase();
  return {
    id:id||slugify(firstDefined(item.name,item.title,item.city)),
    slug:cleanString(firstDefined(item.slug,item.urlSlug,slugify(firstDefined(item.name,item.title,item.city))),160),
    name:cleanString(firstDefined(item.name,item.title,item.destinationName,item.city,item.label,item.code),180),
    country:cleanString(firstDefined(item.country,item.Country,item.locationCountry),120),
    region:cleanString(firstDefined(item.region,item.Region,item.subRegion,item.continent,item.country),120),
    iata,
    lat:loc.lat,lng:loc.lng,mappable:loc.valid,
    summary:cleanString(firstDefined(item.summary,item.description,item.shortDescription,item.excerpt,item.editorial),900),
    tags:unique(toArray(firstDefined(item.tags,item.Tags,item.categories,item.goodFor))),
    pageUrl:pageUrl(item),
    heroImage:imageUrl(item),
    airportIds:unique(toArray(firstDefined(item.airportIds,item.airports))),
    hotelIds:unique(toArray(firstDefined(item.hotelIds,item.hotels))),
    routeIds:unique(toArray(firstDefined(item.routeIds,item.routes))),
    airlineIds:unique(toArray(firstDefined(item.airlineIds,item.airlines))),
    featured:Boolean(firstDefined(item.featured,item.homepageFeatured,item.homepage_featured,false)),
    priority:Number(firstDefined(item.displayPriority,item.sortPriority,item.sort_priority,item.searchPriority,9999))||9999,
    derived
  };
}
function looksAirportLike(item={}){
  const iata=cleanString(firstDefined(item.iata,item.IATA,item.airportCode,item.code),8);
  const text=[item.summary,item.description,item.title,item.name].map(v=>cleanString(v).toLowerCase()).join(" ");
  return Boolean(iata&&iata.length===3&&(text.includes("airport")||item.icao||item.ICAO||item.airportCode));
}
function normalizeAirport(item={}){
  const loc=getLocation(item);
  const iata=cleanString(firstDefined(item.iata,item.IATA,item.code,item.airportCode,item.id),8).toUpperCase();
  return {
    id:cleanId(firstDefined(item.id,item.publicId,iata,item._id))||iata,
    iata,
    icao:cleanString(firstDefined(item.icao,item.ICAO),8).toUpperCase(),
    name:cleanString(firstDefined(item.airportName,item.title,item.name,iata),180),
    city:cleanString(firstDefined(item.city,item.locationCity,item.destination,item.name),140),
    country:cleanString(firstDefined(item.country,item.Country,item.locationCountry),120),
    region:cleanString(firstDefined(item.region,item.Region,item.country),120),
    lat:loc.lat,lng:loc.lng,mappable:loc.valid,
    summary:cleanString(firstDefined(item.summary,item.description,item.information),700),
    destinationIds:unique(toArray(firstDefined(item.destinationIds,item.destinations,item.destinationId))),
    airlineIds:unique(toArray(firstDefined(item.airlineIds,item.airlines))),
    pageUrl:pageUrl(item),heroImage:imageUrl(item)
  };
}
function normalizeHotel(item={}){
  const loc=getLocation(item);
  const explicitCollection=firstDefined(item.collectionStatus,item.isCollection,item.skandiCollection,item.collection,item.collectionApproved,item.selected,undefined);
  const isCollection=explicitCollection===undefined?false:Boolean(explicitCollection)&&String(explicitCollection).toLowerCase()!=="false";
  return {
    id:cleanId(firstDefined(item.publicId,item.id,item.hotelId,item.code,item._id)),
    slug:cleanString(firstDefined(item.slug,item.urlSlug,slugify(firstDefined(item.name,item.title,item.hotelName))),160),
    name:cleanString(firstDefined(item.name,item.title,item.hotelName),180),
    destinationId:cleanId(firstDefined(item.destinationId,item.destinationCode,item.destCode,item.destination?.id,item.city)),
    area:cleanString(firstDefined(item.area,item.neighborhood,item.region,item.destination),140),
    city:cleanString(firstDefined(item.city,item.destination),140),
    country:cleanString(firstDefined(item.country),120),
    region:cleanString(firstDefined(item.region,item.country),120),
    lat:loc.lat,lng:loc.lng,mappable:loc.valid,
    summary:cleanString(firstDefined(item.summary,item.description,item.shortDescription,item.publicDescription),800),
    tags:unique(toArray(firstDefined(item.tags,item.publicTags,item.amenities,item.highlights))),
    pageUrl:pageUrl(item),image:imageUrl(item),
    starRating:cleanString(firstDefined(item.starRating,item.stars),20),
    tier:cleanString(firstDefined(item.collectionTier,item.tier,item.category),80),
    isCollection
  };
}
function normalizeAirline(item={}){
  const iata=cleanString(firstDefined(item.iata,item.IATA,item.code,item.airlineCode),8).toUpperCase();
  return {
    id:cleanId(firstDefined(item.id,item.publicId,item.recordId,iata,item.icao,item.name))||iata||slugify(item.name),
    iata,
    icao:cleanString(firstDefined(item.icao,item.ICAO),8).toUpperCase(),
    name:cleanString(firstDefined(item.name,item.title,item.shortName,iata),160),
    logo:safeUrl(firstDefined(item.logo,item.logoUrl,item.logoFile,item.logoIcon,item.logoIconUrl)),
    pageUrl:pageUrl(item),
    partnerStatus:Boolean(firstDefined(item.partnerStatus,item.partner,item.isPartner,item.selected,true))
  };
}
function normalizeRoute(item={}){
  const fromId=cleanId(firstDefined(item.fromId,item.fromCode,item.originId,item.originCode,item.from,item.origin,item.originIata)).toUpperCase();
  const toId=cleanId(firstDefined(item.toId,item.toCode,item.destinationId,item.destinationCode,item.to,item.destination,item.destinationIata)).toUpperCase();
  return {
    id:cleanId(firstDefined(item.publicId,item.id,item.code,item.routeCode,item._id,`${fromId}-${toId}`)),
    fromId,toId,
    via:unique(toArray(firstDefined(item.via,item.viaCodes,item.viaIds,item.stops,item.stopCodes))),
    label:cleanString(firstDefined(item.label,item.name,item.title),140),
    airlineIds:unique(toArray(firstDefined(item.airlineIds,item.airlines,item.carriers,item.airline))).map(v=>v.toUpperCase()),
    tags:unique(toArray(firstDefined(item.tags,item.Tags))),
    pageUrl:pageUrl(item),
    direct:firstDefined(item.direct,item.isDirect,item.nonstop,undefined),
    seasonal:firstDefined(item.seasonal,item.isSeasonal,undefined),
    priority:Number(firstDefined(item.displayPriority,item.priority,item.sortPriority,9999))||9999,
    featured:Boolean(firstDefined(item.featured,item.selected,false))
  };
}
function derivedDestinationsFromAirports(airports,hotels){
  const groups=new Map();
  airports.forEach(a=>{
    const key=[a.city||a.name,a.country].join("|").toLowerCase();
    if(!key.replace("|","").trim())return;
    if(!groups.has(key))groups.set(key,[]);
    groups.get(key).push(a);
  });
  return [...groups.values()].map(group=>{
    const primary=group.find(a=>a.mappable)||group[0];
    const relatedHotels=hotels.filter(h=>[h.city,h.destinationId].some(v=>cleanString(v).toLowerCase()===cleanString(primary.city||primary.name).toLowerCase()||cleanString(v).toUpperCase()===primary.iata));
    return normalizeDestination({
      id:`city:${slugify(primary.city||primary.name)}:${slugify(primary.country)}`,
      slug:slugify(primary.city||primary.name),
      name:primary.city||primary.name,
      country:primary.country,
      region:primary.region||primary.country,
      lat:primary.lat,lng:primary.lng,
      summary:relatedHotels[0]?.summary||"",
      airportIds:group.map(a=>a.iata||a.id),
      hotelIds:relatedHotels.map(h=>h.id),
      heroImage:relatedHotels[0]?.image||primary.heroImage||""
    },true);
  });
}
function groupRoutes(routes){
  const grouped=new Map();
  routes.forEach(route=>{
    if(!route.fromId||!route.toId)return;
    const pair=[route.fromId,route.toId].sort();
    const key=pair.join("↔");
    const current=grouped.get(key);
    if(!current){grouped.set(key,{...route,id:key,fromId:pair[0],toId:pair[1],airlineIds:[...route.airlineIds],sourceRouteIds:[route.id],directions:new Set([`${route.fromId}>${route.toId}`])})}
    else{
      current.airlineIds=unique([...current.airlineIds,...route.airlineIds]);
      current.tags=unique([...current.tags,...route.tags]);
      current.sourceRouteIds.push(route.id);
      current.directions.add(`${route.fromId}>${route.toId}`);
      current.featured=current.featured||route.featured;
      current.priority=Math.min(current.priority,route.priority);
      if(!current.label&&route.label)current.label=route.label;
    }
  });
  return [...grouped.values()].map(r=>({...r,directions:[...r.directions]}));
}
function normalizePayload(payload={}){
  const rawDestinations=Array.isArray(payload.destinations)?payload.destinations:[];
  const rawAirports=Array.isArray(payload.airports)?payload.airports:[];
  const rawHotels=Array.isArray(payload.hotels)?payload.hotels:[];
  const rawAirlines=Array.isArray(payload.airlines)?payload.airlines:[];
  const rawRoutes=Array.isArray(payload.routes)?payload.routes:[];

  const hotels=rawHotels.map(normalizeHotel).filter(h=>h.id&&h.name&&h.isCollection);
  const explicitAirports=rawAirports.map(normalizeAirport).filter(a=>a.id&&a.iata);
  const legacyAirports=rawDestinations.filter(looksAirportLike).map(normalizeAirport).filter(a=>a.id&&a.iata);
  const airports=dedupeById(explicitAirports.length?explicitAirports:legacyAirports);
  let destinations=rawDestinations.filter(item=>!looksAirportLike(item)||rawAirports.length>0).map(item=>normalizeDestination(item,false)).filter(d=>d.id&&d.name);
  if(!destinations.length&&airports.length)destinations=derivedDestinationsFromAirports(airports,hotels);

  hotels.forEach(h=>{
    const destination=resolveDestinationForHotel(h,destinations,airports);
    if(destination){h.destinationId=destination.id;destination.hotelIds=unique([...destination.hotelIds,h.id])}
  });
  airports.forEach(a=>{
    const destination=destinations.find(d=>d.airportIds.some(id=>id.toUpperCase()===(a.iata||a.id).toUpperCase()))||destinations.find(d=>cleanString(d.name).toLowerCase()===cleanString(a.city).toLowerCase());
    if(destination){a.destinationIds=unique([...a.destinationIds,destination.id]);destination.airportIds=unique([...destination.airportIds,a.iata||a.id])}
  });

  const routes=groupRoutes(rawRoutes.map(normalizeRoute).filter(r=>r.fromId&&r.toId));
  const derivedAirlineCodes=unique(routes.flatMap(r=>r.airlineIds));
  const airlines=dedupeById([
    ...rawAirlines.map(normalizeAirline).filter(a=>a.id&&a.name&&a.partnerStatus),
    ...derivedAirlineCodes.map(code=>normalizeAirline({id:code,iata:code,name:code,partnerStatus:true}))
  ]);

  routes.forEach(r=>{
    const from=resolveNetworkNode(r.fromId,destinations,airports);
    const to=resolveNetworkNode(r.toId,destinations,airports);
    r.fromNode=from||null;r.toNode=to||null;r.mappable=Boolean(from?.mappable&&to?.mappable);
    destinations.forEach(d=>{
      const ids=new Set([d.id.toUpperCase(),d.iata.toUpperCase(),...d.airportIds.map(v=>v.toUpperCase())]);
      if(ids.has(r.fromId)||ids.has(r.toId)){d.routeIds=unique([...d.routeIds,r.id]);d.airlineIds=unique([...d.airlineIds,...r.airlineIds])}
    });
    airports.forEach(a=>{if([a.iata,a.id].map(v=>cleanString(v).toUpperCase()).includes(r.fromId)||[a.iata,a.id].map(v=>cleanString(v).toUpperCase()).includes(r.toId))a.airlineIds=unique([...a.airlineIds,...r.airlineIds])});
  });

  const regions=unique((Array.isArray(payload.regions)?payload.regions.map(v=>typeof v==="object"?firstDefined(v.name,v.label,v.id):v):[]).concat(destinations.map(d=>d.region||d.country))).sort((a,b)=>a.localeCompare(b));
  const stats={destinations:destinations.length,routes:routes.length,hotels:hotels.length,airlines:airlines.length,airports:airports.length};
  return {destinations,hotels,airports,airlines,routes,regions,stats,publicNote:cleanString(payload.publicNote,500),generatedAt:payload.generatedAt||""};
}
function dedupeById(items){const seen=new Set();return items.filter(item=>{const key=cleanString(item.id||item.iata||item.name).toLowerCase();if(!key||seen.has(key))return false;seen.add(key);return true})}
function resolveDestinationForHotel(h,destinations,airports){
  const keys=[h.destinationId,h.city,h.area,h.region].map(v=>cleanString(v).toLowerCase()).filter(Boolean);
  return destinations.find(d=>[d.id,d.slug,d.name,d.iata,...d.airportIds].map(v=>cleanString(v).toLowerCase()).some(v=>keys.includes(v)))||destinations.find(d=>cleanString(d.country).toLowerCase()===cleanString(h.country).toLowerCase()&&cleanString(d.name).toLowerCase()===cleanString(h.city).toLowerCase())||null;
}
function resolveNetworkNode(id,destinations=state.model.destinations,airports=state.model.airports){
  const key=cleanString(id).toUpperCase();
  return airports.find(a=>[a.id,a.iata,a.icao].map(v=>cleanString(v).toUpperCase()).includes(key))||destinations.find(d=>[d.id,d.iata,d.slug,...d.airportIds].map(v=>cleanString(v).toUpperCase()).includes(key))||null;
}

/* =========================================================
   GEO HELPERS
   ========================================================= */
function toRad(v){return v*Math.PI/180}function toDeg(v){return v*180/Math.PI}
function greatCircleGeometry(a,b,steps=96){
  if(!a?.mappable||!b?.mappable)return null;
  const φ1=toRad(a.lat),λ1=toRad(a.lng),φ2=toRad(b.lat),λ2=toRad(b.lng);
  const cosΔ=Math.sin(φ1)*Math.sin(φ2)+Math.cos(φ1)*Math.cos(φ2)*Math.cos(λ2-λ1);
  const Δ=Math.acos(Math.min(1,Math.max(-1,cosΔ)));
  if(!Number.isFinite(Δ)||Δ===0)return {type:"LineString",coordinates:[[a.lng,a.lat],[b.lng,b.lat]]};
  const points=[];
  for(let i=0;i<=steps;i++){
    const t=i/steps;
    const A=Math.sin((1-t)*Δ)/Math.sin(Δ),B=Math.sin(t*Δ)/Math.sin(Δ);
    const x=A*Math.cos(φ1)*Math.cos(λ1)+B*Math.cos(φ2)*Math.cos(λ2);
    const y=A*Math.cos(φ1)*Math.sin(λ1)+B*Math.cos(φ2)*Math.sin(λ2);
    const z=A*Math.sin(φ1)+B*Math.sin(φ2);
    const φ=Math.atan2(z,Math.sqrt(x*x+y*y));
    const λ=Math.atan2(y,x);
    points.push([toDeg(λ),toDeg(φ)]);
  }
  const lines=[[]];
  for(let i=0;i<points.length;i++){
    if(i&&Math.abs(points[i][0]-points[i-1][0])>180)lines.push([]);
    lines[lines.length-1].push(points[i]);
  }
  const validLines=lines.filter(line=>line.length>1);
  return validLines.length===1?{type:"LineString",coordinates:validLines[0]}:{type:"MultiLineString",coordinates:validLines};
}
function boundsForFeatures(items){
  if(!window.maplibregl)return null;
  const bounds=new maplibregl.LngLatBounds();let count=0;
  items.forEach(item=>{if(item?.mappable){bounds.extend([item.lng,item.lat]);count++}});
  return count?bounds:null;
}
function pointFeature(item,type,props={}){return {type:"Feature",id:item.id,geometry:{type:"Point",coordinates:[item.lng,item.lat]},properties:{id:item.id,type,name:item.name||item.city||item.iata||"",...props}}}
function emptyFC(){return {type:"FeatureCollection",features:[]}}

/* =========================================================
   MAP INITIALIZATION / STYLE
   ========================================================= */
function initMap(){
  if(state.mapInitialized)return;
  if(!window.maplibregl){showMapFailure("The interactive atlas could not start in this browser.");return}
  state.mapInitialized=true;
  try{
    state.map=new maplibregl.Map({
      container:"networkMap",
      style:MAP_STYLE_URL,
      center:[14,48],
      zoom:2.15,
      minZoom:1.25,
      maxZoom:13,
      attributionControl:false,
      logoPosition:"bottom-left",
      renderWorldCopies:false,
      cooperativeGestures:false,
      dragRotate:false,
      pitchWithRotate:false,
      maxPitch:48,
      fadeDuration:REDUCED_MOTION?0:220
    });
    state.map.addControl(new maplibregl.AttributionControl({compact:true}),"bottom-right");
    state.map.on("load",onMapLoad);
    state.map.on("error",event=>logger("map_error",{message:event?.error?.message||"unknown"}));
    state.resizeObserver=new ResizeObserver(()=>state.map?.resize());
    state.resizeObserver.observe(el.networkHero);
  }catch(error){logger("map_init_failed",{message:error.message});showMapFailure("The interactive atlas could not start in this browser.")}
}
function onMapLoad(){
  state.mapReady=true;
  el.networkHero.classList.add("map-ready");
  rethemeBaseMap();
  if(!IS_MOBILE()&&typeof state.map.setProjection==="function"){
    try{state.map.setProjection({type:"globe"})}catch(error){logger("globe_unavailable",{message:error.message})}
  }
  installNetworkSourcesAndLayers();
  installMapInteractions();
  if(state.pendingPayload){const payload=state.pendingPayload;state.pendingPayload=null;applyPayload(payload)}else{renderModel()}
  logger("map_ready");
}
function rethemeBaseMap(){
  const map=state.map;if(!map)return;
  const layers=map.getStyle()?.layers||[];
  layers.forEach(layer=>{
    const id=layer.id.toLowerCase();
    try{
      if(id.includes("poi")||id.includes("transit")||id.includes("road")||id.includes("building")||id.includes("housenumber")){map.setLayoutProperty(layer.id,"visibility","none");return}
      if(layer.type==="background")map.setPaintProperty(layer.id,"background-color","#06172b");
      if(layer.type==="fill"){
        if(id.includes("water")){map.setPaintProperty(layer.id,"fill-color","#04111f");map.setPaintProperty(layer.id,"fill-opacity",1)}
        else if(id.includes("land")||id.includes("landcover")||id.includes("park")||id.includes("earth")){map.setPaintProperty(layer.id,"fill-color",id.includes("park")?"#0b2636":"#0b2238");map.setPaintProperty(layer.id,"fill-opacity",.94)}
      }
      if(layer.type==="line"){
        if(id.includes("boundary")||id.includes("admin")){map.setPaintProperty(layer.id,"line-color","rgba(158,197,213,.22)");map.setPaintProperty(layer.id,"line-width",.55)}
        else if(id.includes("water")){map.setPaintProperty(layer.id,"line-color","rgba(95,199,207,.12)")}
      }
      if(layer.type==="symbol"){
        if(id.includes("country")||id.includes("place")||id.includes("city")||id.includes("settlement")){
          map.setPaintProperty(layer.id,"text-color",id.includes("country")?"rgba(212,224,231,.46)":"rgba(208,220,228,.36)");
          map.setPaintProperty(layer.id,"text-halo-color","rgba(6,23,43,.92)");map.setPaintProperty(layer.id,"text-halo-width",1.2);
        }else map.setLayoutProperty(layer.id,"visibility","none");
      }
    }catch{}
  });
  try{map.setFog?.({color:"rgba(6,23,43,.92)","high-color":"#0b3550","space-color":"#020b14","horizon-blend":.16,"star-intensity":0})}catch{}
}
function addGeoSource(id,options={}){if(!state.map.getSource(id))state.map.addSource(id,{type:"geojson",data:emptyFC(),...options})}
function installNetworkSourcesAndLayers(){
  const map=state.map;
  addGeoSource("sk-destinations");
  addGeoSource("sk-airports");
  addGeoSource("sk-hotels",{cluster:true,clusterMaxZoom:9,clusterRadius:48});
  addGeoSource("sk-routes",{lineMetrics:true});
  addGeoSource("sk-route-pulse");

  map.addLayer({id:"sk-routes-base",type:"line",source:"sk-routes",paint:{"line-color":"#5fc7cf","line-width":["interpolate",["linear"],["zoom"],1,1,6,1.8],"line-opacity":["case",["boolean",["feature-state","dimmed"],false],.06,["boolean",["feature-state","selected"],false],.92,["boolean",["feature-state","hover"],false],.68,.22]}});
  map.addLayer({id:"sk-routes-hit",type:"line",source:"sk-routes",paint:{"line-color":"rgba(0,0,0,0)","line-width":16,"line-opacity":0}});
  map.addLayer({id:"sk-route-pulse",type:"circle",source:"sk-route-pulse",paint:{"circle-radius":4.5,"circle-color":"#f6fbff","circle-opacity":.9,"circle-blur":.45}});

  map.addLayer({id:"sk-hotel-clusters",type:"circle",source:"sk-hotels",filter:["has","point_count"],paint:{"circle-color":"#d1bc98","circle-radius":["step",["get","point_count"],18,5,21,12,25],"circle-stroke-color":"rgba(251,250,246,.85)","circle-stroke-width":1.4,"circle-opacity":.94}});
  map.addLayer({id:"sk-hotel-cluster-count",type:"symbol",source:"sk-hotels",filter:["has","point_count"],layout:{"text-field":"{point_count_abbreviated}","text-size":10,"text-font":["Noto Sans Bold"]},paint:{"text-color":"#3b301f"}});
  map.addLayer({id:"sk-hotels",type:"symbol",source:"sk-hotels",filter:["!",["has","point_count"]],layout:{"icon-image":"","icon-size":1,"text-field":"◆","text-size":["interpolate",["linear"],["zoom"],2,8,8,14],"text-allow-overlap":true},paint:{"text-color":"#d1bc98","text-halo-color":"rgba(4,17,31,.85)","text-halo-width":1.2,"text-opacity":["case",["boolean",["feature-state","dimmed"],false],.13,["boolean",["feature-state","selected"],false],1,.88]}});

  map.addLayer({id:"sk-airports",type:"circle",source:"sk-airports",paint:{"circle-radius":["interpolate",["linear"],["zoom"],2,2.6,8,5.6],"circle-color":"#06172b","circle-stroke-color":"#dce8ee","circle-stroke-width":1.15,"circle-opacity":["case",["boolean",["feature-state","dimmed"],false],.13,["boolean",["feature-state","selected"],false],1,.72]}});
  map.addLayer({id:"sk-airport-labels",type:"symbol",source:"sk-airports",minzoom:3.3,layout:{"text-field":["get","iata"],"text-size":9,"text-offset":[0,-1.5],"text-allow-overlap":false},paint:{"text-color":"rgba(225,236,241,.78)","text-halo-color":"rgba(4,17,31,.92)","text-halo-width":1.1}});

  map.addLayer({id:"sk-destination-halo",type:"circle",source:"sk-destinations",paint:{"circle-radius":["case",["boolean",["feature-state","selected"],false],18,["boolean",["feature-state","hover"],false],13,9],"circle-color":"rgba(95,199,207,0)","circle-stroke-color":"rgba(95,199,207,.46)","circle-stroke-width":["case",["boolean",["feature-state","selected"],false],2,1],"circle-opacity":["case",["boolean",["feature-state","dimmed"],false],.08,.72]}});
  map.addLayer({id:"sk-destinations",type:"circle",source:"sk-destinations",paint:{"circle-radius":["case",["boolean",["feature-state","selected"],false],6,["boolean",["feature-state","hover"],false],5,4],"circle-color":"#fbfaf6","circle-stroke-color":"#5fc7cf","circle-stroke-width":1.6,"circle-opacity":["case",["boolean",["feature-state","dimmed"],false],.22,1]}});
  map.addLayer({id:"sk-destination-labels",type:"symbol",source:"sk-destinations",layout:{"text-field":["get","name"],"text-size":["interpolate",["linear"],["zoom"],2,9,5,11,9,12],"text-offset":[0,-1.55],"text-anchor":"bottom","text-optional":true,"text-max-width":12},paint:{"text-color":"rgba(244,248,250,.88)","text-halo-color":"rgba(4,17,31,.94)","text-halo-width":1.35,"text-opacity":["case",["boolean",["feature-state","dimmed"],false],.17,1]}});
}

/* =========================================================
   MAP DATA SOURCES
   ========================================================= */
function renderModel(){
  renderMeta();renderRegions();renderModes();renderEditorial();renderDirectory();
  if(!state.mapReady)return;
  updateMapSources();applyMode();fitDefaultBounds(false);
}
function updateMapSources(){
  const {destinations,hotels,airports,routes}=state.model;
  const destFeatures=destinations.filter(d=>d.mappable).map(d=>pointFeature(d,"destination",{name:d.name,country:d.country,region:d.region,derived:d.derived?1:0}));
  const hotelFeatures=hotels.filter(h=>h.mappable).map(h=>pointFeature(h,"hotel",{name:h.name,destinationId:h.destinationId,area:h.area,country:h.country}));
  const airportFeatures=airports.filter(a=>a.mappable).map(a=>pointFeature(a,"airport",{name:a.name,iata:a.iata,city:a.city,country:a.country}));
  const routeFeatures=routes.filter(r=>r.mappable).map(r=>{
    const geometry=greatCircleGeometry(r.fromNode,r.toNode);
    return geometry?{type:"Feature",id:r.id,geometry,properties:{id:r.id,fromId:r.fromId,toId:r.toId,airlineIds:r.airlineIds.join("|"),featured:r.featured?1:0}}:null;
  }).filter(Boolean);
  state.map.getSource("sk-destinations")?.setData({type:"FeatureCollection",features:destFeatures});
  state.map.getSource("sk-hotels")?.setData({type:"FeatureCollection",features:hotelFeatures});
  state.map.getSource("sk-airports")?.setData({type:"FeatureCollection",features:airportFeatures});
  state.map.getSource("sk-routes")?.setData({type:"FeatureCollection",features:routeFeatures});
  logger("payload_counts",state.model.stats);
}
function applyMode(){
  if(!state.mapReady)return;
  const map=state.map;
  const hasHotels=state.model.hotels.some(h=>h.mappable);const hasAirlines=state.model.airlines.length>0&&state.model.routes.some(r=>r.airlineIds.length);
  const collectionOpacity=state.mode==="collection"?1:state.mode==="explore"?.78:.42;
  const routeOpacity=state.mode==="airlines"?.36:state.mode==="collection"?.08:state.mode==="destinations"?.13:.22;
  try{
    map.setPaintProperty("sk-hotels","text-opacity",collectionOpacity);
    map.setPaintProperty("sk-hotel-clusters","circle-opacity",collectionOpacity);
    map.setPaintProperty("sk-hotel-cluster-count","text-opacity",collectionOpacity);
    map.setPaintProperty("sk-routes-base","line-opacity",routeOpacity);
    map.setLayoutProperty("sk-hotels","visibility",hasHotels?"visible":"none");
    map.setLayoutProperty("sk-hotel-clusters","visibility",hasHotels?"visible":"none");
    map.setLayoutProperty("sk-hotel-cluster-count","visibility",hasHotels?"visible":"none");
    map.setLayoutProperty("sk-airports","visibility",state.mode==="airlines"||state.selectionType?"visible":"none");
    map.setLayoutProperty("sk-airport-labels","visibility",state.mode==="airlines"||state.selectionType?"visible":"none");
    if(state.mode==="airlines"&&!hasAirlines)setMode("explore",false);
  }catch{}
  applyFeatureStates();
}
function renderMeta(){
  const s=state.model.stats;el.networkMeta.replaceChildren();
  const values=[];
  if(s.destinations)values.push(`${s.destinations} ${s.destinations===1?"destination":"destinations"}`);
  if(s.hotels)values.push(`${s.hotels} Collection ${s.hotels===1?"stay":"stays"}`);
  if(s.airlines)values.push(`${s.airlines} ${s.airlines===1?"airline partner":"airline partners"}`);
  if(s.routes)values.push(`${s.routes} ${s.routes===1?"connection":"connections"}`);
  if(!values.length)values.push("Network content is being updated");
  values.forEach(text=>{const span=document.createElement("span");span.textContent=text;el.networkMeta.append(span)});
}
function renderRegions(){
  el.regionStrip.replaceChildren();
  if(state.model.regions.length<2){el.regionStrip.hidden=true;return}
  el.regionStrip.hidden=false;
  const all=createRegionButton("All",null);el.regionStrip.append(all);
  state.model.regions.forEach(region=>el.regionStrip.append(createRegionButton(region,region)));
}
function createRegionButton(label,value){const b=document.createElement("button");b.type="button";b.className="region-btn"+(state.selectedRegion===value?" active":"");b.textContent=label;b.addEventListener("click",()=>setRegion(value));return b}
function renderModes(){
  const hasHotels=state.model.hotels.length>0;const hasAirlines=state.model.airlines.length>0&&state.model.routes.some(r=>r.airlineIds.length);
  el.modeRail.querySelector('[data-mode="collection"]').hidden=!hasHotels;
  el.modeRail.querySelector('[data-mode="airlines"]').hidden=!hasAirlines;
}

/* =========================================================
   MAP INTERACTIONS
   ========================================================= */
function installMapInteractions(){
  const map=state.map;
  const layers=[
    {layer:"sk-destinations",type:"destination"},
    {layer:"sk-hotels",type:"hotel"},
    {layer:"sk-airports",type:"airport"},
    {layer:"sk-routes-hit",type:"route"}
  ];
  layers.forEach(({layer,type})=>{
    map.on("mousemove",layer,event=>handleHover(type,event));
    map.on("mouseleave",layer,()=>clearHover());
    map.on("click",layer,event=>handleMapClick(type,event));
  });
  map.on("click","sk-hotel-clusters",event=>{
    const feature=event.features?.[0];if(!feature)return;
    const clusterId=feature.properties.cluster_id;
    state.map.getSource("sk-hotels").getClusterExpansionZoom(clusterId,(err,zoom)=>{if(err)return;state.map.easeTo({center:feature.geometry.coordinates,zoom:Math.min(zoom,11),duration:cameraDuration(650)})});
  });
}
function handleHover(type,event){
  const feature=event.features?.[0];if(!feature)return;
  const id=cleanId(feature.properties?.id||feature.id);if(!id)return;
  if(state.hover.id!==id||state.hover.type!==type){clearHover();state.hover={type,id};setFeatureState(type,id,{hover:true})}
  state.map.getCanvas().style.cursor="pointer";
  showTooltip(type,id,event.point);
}
function clearHover(){
  if(state.hover.id)setFeatureState(state.hover.type,state.hover.id,{hover:false});
  state.hover={type:null,id:null};if(state.map)state.map.getCanvas().style.cursor="";hideTooltip();
}
function handleMapClick(type,event){const feature=event.features?.[0];const id=cleanId(feature?.properties?.id||feature?.id);if(id)selectObject(type,id,{camera:true,history:true})}
function setFeatureState(type,id,value){
  const source={destination:"sk-destinations",hotel:"sk-hotels",airport:"sk-airports",route:"sk-routes"}[type];if(!source||!state.map?.getSource(source))return;
  try{state.map.setFeatureState({source,id},value)}catch{}
}
function showTooltip(type,id,point){
  if(IS_MOBILE())return;
  const obj=getObject(type,id);if(!obj)return;
  el.mapTooltip.querySelector("strong").textContent=obj.name||routeTitle(obj)||obj.iata||"Network";
  el.mapTooltip.querySelector("span").textContent=tooltipSecondary(type,obj);
  el.mapTooltip.style.left=`${point.x}px`;el.mapTooltip.style.top=`${point.y}px`;el.mapTooltip.classList.add("visible");
}
function hideTooltip(){el.mapTooltip.classList.remove("visible")}
function tooltipSecondary(type,obj){
  if(type==="destination")return [obj.country,countsForDestination(obj)].filter(Boolean).join(" · ");
  if(type==="hotel")return ["SKANDI Collection",obj.area||obj.city].filter(Boolean).join(" · ");
  if(type==="airport")return [obj.iata,obj.city,obj.country].filter(Boolean).join(" · ");
  if(type==="route")return [obj.fromId+" → "+obj.toId,airlineNames(obj.airlineIds).join(", ")].filter(Boolean).join(" · ");
  return "";
}
function countsForDestination(dest){
  const hotelCount=state.model.hotels.filter(h=>h.destinationId===dest.id).length;
  const routeCount=state.model.routes.filter(r=>destinationTouchesRoute(dest,r)).length;
  return [hotelCount?`${hotelCount} Collection ${hotelCount===1?"stay":"stays"}`:"",routeCount?`${routeCount} ${routeCount===1?"connection":"connections"}`:""].filter(Boolean).join(" · ");
}

/* =========================================================
   SELECTION / CAMERA / FILTER STATES
   ========================================================= */
function getObject(type,id){
  const list={destination:state.model.destinations,hotel:state.model.hotels,airport:state.model.airports,airline:state.model.airlines,route:state.model.routes}[type]||[];
  const key=cleanId(id).toLowerCase();return list.find(x=>cleanId(x.id).toLowerCase()===key||cleanId(x.iata).toLowerCase()===key||cleanId(x.slug).toLowerCase()===key)||null;
}
function selectObject(type,id,options={}){
  const obj=getObject(type,id);if(!obj)return;
  stopRouteAnimation();
  state.selectionType=type;state.selectionId=obj.id;state.panelOpen=true;
  if(type==="airline"){state.selectedAirlineId=obj.id;state.mode="airlines"}
  else if(state.mode==="airlines"&&type!=="route")state.selectedAirlineId=null;
  applyFeatureStates();renderSelection(obj,type);syncModeButtons();
  if(options.camera!==false)focusSelection(type,obj);
  if(options.history!==false)writeDeepLink(type,obj);
  analytics(`network_${type==="hotel"?"collection":type}_open`,{id:publicSelectionId(type,obj)});
  if(type==="route")startRouteAnimation(obj);
}
function clearSelection({camera=false,history=true}={}){
  stopRouteAnimation();state.selectionType=null;state.selectionId=null;state.panelOpen=false;state.selectedAirlineId=state.mode==="airlines"?state.selectedAirlineId:null;
  el.detailPanel.classList.remove("open");el.detailPanel.setAttribute("aria-hidden","true");el.mobileSheet.classList.remove("open");
  applyFeatureStates();if(camera)fitDefaultBounds(true);if(history)clearDeepLink();
}
function applyFeatureStates(){
  if(!state.mapReady)return;
  const {destinations,hotels,airports,routes}=state.model;
  const selectedType=state.selectionType,selected=getObject(selectedType,state.selectionId);
  const selectedAirline=state.selectedAirlineId;
  const region=state.selectedRegion;
  const activeDestIds=new Set();const activeAirportIds=new Set();const activeHotelIds=new Set();const activeRouteIds=new Set();

  if(selectedType==="destination"&&selected){activeDestIds.add(selected.id);hotels.filter(h=>h.destinationId===selected.id).forEach(h=>activeHotelIds.add(h.id));airports.filter(a=>a.destinationIds.includes(selected.id)||selected.airportIds.includes(a.iata||a.id)).forEach(a=>activeAirportIds.add(a.id));routes.filter(r=>destinationTouchesRoute(selected,r)).forEach(r=>activeRouteIds.add(r.id))}
  if(selectedType==="hotel"&&selected){activeHotelIds.add(selected.id);if(selected.destinationId)activeDestIds.add(selected.destinationId)}
  if(selectedType==="airport"&&selected){activeAirportIds.add(selected.id);selected.destinationIds.forEach(id=>activeDestIds.add(id));routes.filter(r=>routeTouchesNode(r,selected)).forEach(r=>activeRouteIds.add(r.id))}
  if(selectedType==="route"&&selected){activeRouteIds.add(selected.id);[selected.fromNode,selected.toNode].forEach(node=>{if(!node)return;if(state.model.airports.includes(node))activeAirportIds.add(node.id);else activeDestIds.add(node.id)});const toDest=findDestinationForNode(selected.toNode);if(toDest)activeDestIds.add(toDest.id)}
  if(selectedAirline){routes.filter(r=>routeHasAirline(r,selectedAirline)).forEach(r=>{activeRouteIds.add(r.id);[r.fromNode,r.toNode].forEach(node=>{if(node&&state.model.airports.includes(node))activeAirportIds.add(node.id);const dest=findDestinationForNode(node);if(dest)activeDestIds.add(dest.id)})})}

  destinations.forEach(d=>setFeatureState("destination",d.id,{selected:selectedType==="destination"&&selected?.id===d.id,dimmed:shouldDimDestination(d,activeDestIds,region,selectedAirline)}));
  hotels.forEach(h=>setFeatureState("hotel",h.id,{selected:selectedType==="hotel"&&selected?.id===h.id,dimmed:shouldDimGeneric(h.id,activeHotelIds,region&&h.region!==region,Boolean(selectedType||selectedAirline))}));
  airports.forEach(a=>setFeatureState("airport",a.id,{selected:selectedType==="airport"&&selected?.id===a.id,dimmed:shouldDimGeneric(a.id,activeAirportIds,region&&a.region!==region,Boolean(selectedType||selectedAirline))}));
  routes.forEach(r=>setFeatureState("route",r.id,{selected:selectedType==="route"&&selected?.id===r.id,dimmed:shouldDimRoute(r,activeRouteIds,region,selectedAirline)}));

  try{
    const showAirports=Boolean(selectedType||selectedAirline||state.mode==="airlines");
    state.map.setLayoutProperty("sk-airports","visibility",showAirports?"visible":"none");state.map.setLayoutProperty("sk-airport-labels","visibility",showAirports?"visible":"none");
  }catch{}
}
function shouldDimDestination(d,active,region,airline){if(region&&d.region!==region&&d.country!==region)return true;if((state.selectionType||airline)&&active.size)return !active.has(d.id);return false}
function shouldDimGeneric(id,active,regionMismatch,selectionPresent){if(regionMismatch)return true;if(selectionPresent&&active.size)return !active.has(id);return false}
function shouldDimRoute(r,active,region,airline){if(airline&&!routeHasAirline(r,airline))return true;if(state.selectionType&&active.size&&!active.has(r.id))return true;if(region){const a=findDestinationForNode(r.fromNode),b=findDestinationForNode(r.toNode);if(![a,b].some(d=>d&&(d.region===region||d.country===region)))return true}return false}
function destinationTouchesRoute(dest,route){const ids=new Set([dest.id.toUpperCase(),dest.iata.toUpperCase(),...dest.airportIds.map(v=>v.toUpperCase())]);return ids.has(route.fromId)||ids.has(route.toId)}
function routeTouchesNode(route,node){const ids=[node.id,node.iata,node.icao].map(v=>cleanString(v).toUpperCase());return ids.includes(route.fromId)||ids.includes(route.toId)}
function routeHasAirline(route,airlineId){const airline=getObject("airline",airlineId);const keys=new Set([airlineId,airline?.id,airline?.iata,airline?.icao].map(v=>cleanString(v).toUpperCase()));return route.airlineIds.some(id=>keys.has(id.toUpperCase()))}
function findDestinationForNode(node){if(!node)return null;if(state.model.destinations.includes(node))return node;return state.model.destinations.find(d=>d.airportIds.map(v=>v.toUpperCase()).includes(cleanString(node.iata||node.id).toUpperCase())||cleanString(d.name).toLowerCase()===cleanString(node.city).toLowerCase())||null}
function setMode(mode,track=true){
  if(!["explore","destinations","collection","airlines"].includes(mode))return;
  if(mode==="collection"&&!state.model.hotels.length)return;
  if(mode==="airlines"&&!(state.model.airlines.length&&state.model.routes.some(r=>r.airlineIds.length)))return;
  state.mode=mode;if(mode!=="airlines")state.selectedAirlineId=null;syncModeButtons();applyMode();if(track)analytics("network_mode_change",{mode});
  if(mode==="collection")fitBoundsFor(state.model.hotels,true);else if(mode==="destinations")fitBoundsFor(state.model.destinations,true);
  if(mode==="airlines")openAirlineSearch();
}
function syncModeButtons(){el.modeRail.querySelectorAll("[data-mode]").forEach(b=>{const active=b.dataset.mode===state.mode;b.classList.toggle("active",active);b.setAttribute("aria-pressed",String(active))})}
function setRegion(region){state.selectedRegion=region;renderRegions();applyFeatureStates();const items=region?state.model.destinations.filter(d=>d.region===region||d.country===region):state.model.destinations;fitBoundsFor(items,true);analytics("network_region_change",{region:region||"all"})}
function focusSelection(type,obj){
  if(!state.mapReady)return;
  const duration=cameraDuration(type==="route"?950:720);
  if(type==="route"){const nodes=[obj.fromNode,obj.toNode].filter(Boolean);fitBoundsFor(nodes,true,{duration,padding:panelPadding()});return}
  if(type==="airline"){const routes=state.model.routes.filter(r=>routeHasAirline(r,obj.id));fitBoundsFor(routes.flatMap(r=>[r.fromNode,r.toNode]).filter(Boolean),true,{duration,padding:panelPadding()});return}
  if(obj.mappable){state.map.easeTo({center:[obj.lng,obj.lat],zoom:type==="hotel"?9:type==="airport"?7:5.4,duration,padding:panelPadding(),essential:true})}
}
function cameraDuration(ms){return REDUCED_MOTION?60:ms}
function panelPadding(){return IS_MOBILE()?{top:170,bottom:190,left:36,right:36}:{top:90,bottom:90,left:80,right:470}}
function fitBoundsFor(items,animate=false,options={}){const bounds=boundsForFeatures(items);if(!bounds||bounds.isEmpty?.())return;state.map.fitBounds(bounds,{padding:options.padding||panelPadding(),maxZoom:6.3,duration:animate?cameraDuration(options.duration||800):0,essential:true})}
function fitDefaultBounds(animate=true){
  const items=[...state.model.destinations.filter(d=>d.mappable),...state.model.airports.filter(a=>a.mappable&&state.model.routes.some(r=>routeTouchesNode(r,a))),...state.model.hotels.filter(h=>h.mappable)];
  if(items.length)fitBoundsFor(items,animate,{padding:IS_MOBILE()?{top:150,bottom:110,left:35,right:35}:{top:150,bottom:90,left:90,right:90}});else state.map?.easeTo({center:[12,45],zoom:2,duration:animate?cameraDuration(700):0});
}

/* =========================================================
   SELECTION PANELS
   ========================================================= */
function renderSelection(obj,type){
  const fragment=buildPanelFragment(obj,type);
  el.panelBody.replaceChildren(fragment.cloneNode(true));
  renderPanelImage(obj,type);
  el.detailPanel.classList.add("open");el.detailPanel.setAttribute("aria-hidden","false");

  el.mobileSheetContent.replaceChildren();
  const mobileMedia=document.createElement("div");mobileMedia.className="panel-media";
  const fallback=document.createElement("div");fallback.className="panel-fallback";fallback.textContent="SKANDI Network";mobileMedia.append(fallback);
  const image=document.createElement("img");image.alt="";image.loading="lazy";mobileMedia.append(image);
  const body=document.createElement("div");body.className="panel-body";body.append(buildPanelFragment(obj,type));
  el.mobileSheetContent.append(mobileMedia,body);
  loadImage(image,selectionImage(obj,type));
  el.mobileSheet.classList.add("open");setSheetSnap("peek");
  const announcement=selectionAnnouncement(obj,type);el.selectionLive.textContent=announcement;
}
function buildPanelFragment(obj,type){
  const frag=document.createDocumentFragment();
  const eyebrow=document.createElement("div");eyebrow.className="panel-eyebrow";eyebrow.textContent=panelEyebrow(type,obj);frag.append(eyebrow);
  const title=document.createElement("h2");title.className="panel-title";title.textContent=panelTitle(type,obj);frag.append(title);
  const metaText=panelMeta(type,obj);if(metaText){const meta=document.createElement("div");meta.className="panel-meta";meta.textContent=metaText;frag.append(meta)}
  const copyText=panelCopy(type,obj);if(copyText){const copy=document.createElement("p");copy.className="panel-copy";copy.textContent=copyText;frag.append(copy)}
  const tags=panelTags(type,obj);if(tags.length){const list=document.createElement("div");list.className="tag-list";tags.slice(0,6).forEach(text=>{const tag=document.createElement("span");tag.className="tag";tag.textContent=text;list.append(tag)});frag.append(list)}
  const facts=panelFacts(type,obj);if(facts.length){const grid=document.createElement("div");grid.className="panel-facts";facts.slice(0,4).forEach(([label,value])=>{const f=document.createElement("div");f.className="fact";const small=document.createElement("small");small.textContent=label;const strong=document.createElement("strong");strong.textContent=value;f.append(small,strong);grid.append(f)});frag.append(grid)}
  const related=panelRelated(type,obj);if(related.length){const wrap=document.createElement("div");wrap.className="related-list";const heading=document.createElement("p");heading.className="related-title";heading.textContent=relatedTitle(type);wrap.append(heading);related.slice(0,6).forEach(item=>{const b=document.createElement("button");b.type="button";b.className="related-item";const strong=document.createElement("strong");strong.textContent=item.label;const span=document.createElement("span");span.textContent=item.meta||"View";b.append(strong,span);b.addEventListener("click",()=>selectObject(item.type,item.id,{camera:true,history:true}));wrap.append(b)});frag.append(wrap)}
  const actions=panelActions(type,obj);if(actions.length){const wrap=document.createElement("div");wrap.className="panel-actions";actions.forEach((action,index)=>{const b=document.createElement("button");b.type="button";b.className=`panel-action ${index===0?"primary":"secondary"}`;b.textContent=action.label;b.addEventListener("click",action.onClick);wrap.append(b)});frag.append(wrap)}
  return frag;
}
function panelEyebrow(type,obj){return {destination:[obj.country,obj.region].filter(Boolean).join(" / ")||"Destination",hotel:"SKANDI Collection",airport:"Airport",airline:"Partner airline",route:"Journey"}[type]||"SKANDI Network"}
function panelTitle(type,obj){return type==="route"?routeTitle(obj):obj.name||obj.iata||"Network"}
function panelMeta(type,obj){if(type==="destination")return countsForDestination(obj);if(type==="hotel")return [obj.area||obj.city,obj.country].filter(Boolean).join(" · ");if(type==="airport")return [obj.iata,obj.icao,obj.city,obj.country].filter(Boolean).join(" · ");if(type==="airline")return [obj.iata,obj.icao].filter(Boolean).join(" · ");if(type==="route")return airlineNames(obj.airlineIds).join(" · ");return ""}
function panelCopy(type,obj){if(type==="route"){const d=findDestinationForNode(obj.toNode);return d?.summary||"A published SKANDI network connection. Select the journey action to continue into the existing booking flow."}return obj.summary||({destination:"Explore this published SKANDI destination and the Collection stays and connections linked to it.",hotel:"A handpicked SKANDI Collection stay in this destination.",airport:"An airport serving the published SKANDI network.",airline:"Explore this partner airline’s published SKANDI network relationships."}[type]||"")}
function panelTags(type,obj){if(type==="route")return unique([...(obj.tags||[]),...airlineNames(obj.airlineIds)]);return unique(obj.tags||[])}
function panelFacts(type,obj){
  if(type==="destination")return [["Collection",String(state.model.hotels.filter(h=>h.destinationId===obj.id).length)],["Airports",String(airportsForDestination(obj).length)],["Connections",String(state.model.routes.filter(r=>destinationTouchesRoute(obj,r)).length)],["Region",obj.region||obj.country||"Published network"]];
  if(type==="hotel")return [["Destination",getObject("destination",obj.destinationId)?.name||obj.city||"Published destination"],["Category",obj.tier||"SKANDI Collection"],["Rating",obj.starRating?`${obj.starRating} stars`:"Not published"],["Live price","On request"]];
  if(type==="airport")return [["IATA",obj.iata||"—"],["City",obj.city||"—"],["Connections",String(state.model.routes.filter(r=>routeTouchesNode(r,obj)).length)],["Partners",String(unique(state.model.routes.filter(r=>routeTouchesNode(r,obj)).flatMap(r=>r.airlineIds)).length)]];
  if(type==="airline"){const routes=state.model.routes.filter(r=>routeHasAirline(r,obj.id));return [["IATA",obj.iata||"—"],["Connections",String(routes.length)],["Destinations",String(unique(routes.flatMap(r=>[findDestinationForNode(r.fromNode)?.id,findDestinationForNode(r.toNode)?.id])).length)],["Role","Partner airline"]]}
  if(type==="route")return [["From",obj.fromId],["To",obj.toId],["Partners",String(obj.airlineIds.length)],["Collection",String(collectionAtRouteDestination(obj).length)]];
  return [];
}
function panelRelated(type,obj){
  if(type==="destination")return [...airportsForDestination(obj).map(a=>({type:"airport",id:a.id,label:`${a.iata} · ${a.city||a.name}`,meta:"Airport"})),...state.model.hotels.filter(h=>h.destinationId===obj.id).map(h=>({type:"hotel",id:h.id,label:h.name,meta:"Collection"})),...state.model.routes.filter(r=>destinationTouchesRoute(obj,r)).map(r=>({type:"route",id:r.id,label:routeTitle(r),meta:airlineNames(r.airlineIds).slice(0,2).join(", ")||"Connection"}))];
  if(type==="airport")return state.model.routes.filter(r=>routeTouchesNode(r,obj)).map(r=>({type:"route",id:r.id,label:routeTitle(r),meta:airlineNames(r.airlineIds).slice(0,2).join(", ")||"Connection"}));
  if(type==="airline")return state.model.routes.filter(r=>routeHasAirline(r,obj.id)).map(r=>({type:"route",id:r.id,label:routeTitle(r),meta:"Connection"}));
  if(type==="route")return collectionAtRouteDestination(obj).map(h=>({type:"hotel",id:h.id,label:h.name,meta:"Collection"}));
  return [];
}
function relatedTitle(type){return {destination:"In this destination",airport:"Published connections",airline:"Airline network",route:"Collection at destination"}[type]||"Related"}
function panelActions(type,obj){
  const actions=[];
  if(type==="destination"){
    if(obj.pageUrl)actions.push({label:`Explore ${obj.name}`,onClick:()=>navigate(obj.pageUrl,{type:"destination",id:publicSelectionId(type,obj)})});
    actions.push({label:"Plan a trip",onClick:()=>bookDestination(obj)});
  }
  if(type==="hotel"){
    if(obj.pageUrl)actions.push({label:"View hotel",onClick:()=>navigate(obj.pageUrl,{type:"hotel",id:publicSelectionId(type,obj)})});
    actions.push({label:"Check availability",onClick:()=>bookHotel(obj)});
  }
  if(type==="airport"){
    if(obj.pageUrl)actions.push({label:"View airport guide",onClick:()=>navigate(obj.pageUrl,{type:"airport",id:obj.iata})});
    actions.push({label:`Search from ${obj.iata||"airport"}`,onClick:()=>bookFromAirport(obj)});
  }
  if(type==="airline"){
    if(obj.pageUrl)actions.push({label:"View airline guide",onClick:()=>navigate(obj.pageUrl,{type:"airline",id:obj.iata||obj.id})});
    actions.push({label:"Show network",onClick:()=>{state.selectedAirlineId=obj.id;applyFeatureStates();focusSelection("airline",obj)}});
  }
  if(type==="route"){
    const destination=findDestinationForNode(obj.toNode);if(destination?.pageUrl)actions.push({label:"Explore destination",onClick:()=>navigate(destination.pageUrl,{type:"destination",id:publicSelectionId("destination",destination)})});
    actions.push({label:"Search this route",onClick:()=>bookRoute(obj)});
  }
  return actions;
}
function renderPanelImage(obj,type){loadImage(el.panelImage,selectionImage(obj,type))}
function selectionImage(obj,type){if(type==="route")return findDestinationForNode(obj.toNode)?.heroImage||"";if(type==="airline")return obj.logo||"";return obj.heroImage||obj.image||""}
function loadImage(img,url){img.classList.remove("loaded");img.removeAttribute("src");if(!url||SAVE_DATA)return;img.onload=()=>img.classList.add("loaded");img.onerror=()=>{img.classList.remove("loaded");img.removeAttribute("src")};img.src=url}
function selectionAnnouncement(obj,type){if(type==="destination")return `${obj.name} selected. ${countsForDestination(obj)||"Destination details available."}`;if(type==="hotel")return `${obj.name} selected. SKANDI Collection stay.`;if(type==="airport")return `${obj.iata||obj.name} selected. Airport details available.`;if(type==="airline")return `${obj.name} selected. Partner airline network highlighted.`;if(type==="route")return `${routeTitle(obj)} selected. Journey details available.`;return "Selection updated."}
function routeTitle(route){const from=route.fromNode?.city||route.fromNode?.name||route.fromId;const to=route.toNode?.city||route.toNode?.name||route.toId;return `${from} to ${to}`}
function airlineNames(ids){return unique(ids.map(id=>getObject("airline",id)?.name||getObject("airline",id)?.iata||id))}
function airportsForDestination(dest){return state.model.airports.filter(a=>a.destinationIds.includes(dest.id)||dest.airportIds.map(v=>v.toUpperCase()).includes((a.iata||a.id).toUpperCase())||cleanString(a.city).toLowerCase()===cleanString(dest.name).toLowerCase())}
function collectionAtRouteDestination(route){const d=findDestinationForNode(route.toNode);return d?state.model.hotels.filter(h=>h.destinationId===d.id):[]}

/* =========================================================
   SELECTED ROUTE MOTION
   ========================================================= */
function startRouteAnimation(route){
  if(REDUCED_MOTION||!state.mapReady||!route.mappable)return;
  const geometry=greatCircleGeometry(route.fromNode,route.toNode,160);if(!geometry)return;
  const points=geometry.type==="LineString"?geometry.coordinates:geometry.coordinates.flat();if(points.length<2)return;
  let start=performance.now();
  const tick=now=>{
    if(state.selectionType!=="route"||state.selectionId!==route.id)return;
    const duration=Math.max(4200,Math.min(9000,points.length*42));const t=((now-start)%duration)/duration;const idx=Math.min(points.length-1,Math.floor(t*(points.length-1)));
    state.map.getSource("sk-route-pulse")?.setData({type:"FeatureCollection",features:[{type:"Feature",geometry:{type:"Point",coordinates:points[idx]},properties:{}}]});
    state.routeAnimationFrame=requestAnimationFrame(tick);
  };
  state.routeAnimationFrame=requestAnimationFrame(tick);
}
function stopRouteAnimation(){if(state.routeAnimationFrame)cancelAnimationFrame(state.routeAnimationFrame);state.routeAnimationFrame=0;state.map?.getSource("sk-route-pulse")?.setData(emptyFC())}

/* =========================================================
   SEARCH
   ========================================================= */
function openSearch(query=""){
  state.searchOpen=true;el.searchLayer.classList.add("open");el.searchLayer.setAttribute("aria-hidden","false");el.networkSearch.value=query;renderSearchResults(query);setTimeout(()=>el.networkSearch.focus(),30);analytics("network_search",{open:true})
}
function closeSearch(){state.searchOpen=false;el.searchLayer.classList.remove("open");el.searchLayer.setAttribute("aria-hidden","true");el.searchOpen.focus()}
function openAirlineSearch(){openSearch("");el.networkSearch.placeholder="Search partner airlines";renderSearchResults("",["airline"])}
function renderSearchResults(query="",restrictTypes=null){
  const q=cleanString(query,120).toLowerCase();const groups=[];
  const defs=[
    ["destination","Destinations",state.model.destinations,d=>[d.name,d.country,d.region,d.iata,d.slug]],
    ["hotel","Collection",state.model.hotels,h=>[h.name,h.city,h.country,h.area]],
    ["airport","Airports",state.model.airports,a=>[a.iata,a.icao,a.name,a.city,a.country]],
    ["airline","Airlines",state.model.airlines,a=>[a.iata,a.icao,a.name]],
    ["route","Connections",state.model.routes,r=>[r.fromId,r.toId,routeTitle(r),...r.airlineIds]]
  ];
  defs.forEach(([type,label,list,haystack])=>{
    if(restrictTypes&&!restrictTypes.includes(type))return;
    const matched=list.filter(item=>!q||haystack(item).join(" ").toLowerCase().includes(q)).slice(0,8);if(matched.length)groups.push({type,label,items:matched})
  });
  el.searchResults.replaceChildren();
  if(!groups.length){const empty=document.createElement("div");empty.className="search-empty";empty.textContent=q?"No published network result matches that search.":"Start typing to search destinations, Collection stays, airports and partner airlines.";el.searchResults.append(empty);return}
  groups.forEach(group=>{
    const section=document.createElement("section");section.className="search-group";
    const label=document.createElement("div");label.className="search-group-label";label.textContent=group.label;section.append(label);
    group.items.forEach(item=>section.append(buildSearchResult(group.type,item)));
    el.searchResults.append(section);
  });
}
function buildSearchResult(type,item){
  const b=document.createElement("button");b.type="button";b.className="search-result";b.dataset.type=type;b.dataset.id=item.id;
  const icon=document.createElement("div");icon.className="result-icon"+(type==="hotel"?" collection":"");const iconText=document.createElement("span");iconText.textContent=type==="destination"?"DST":type==="hotel"?"S":type==="airport"?(item.iata||"APT"):type==="airline"?(item.iata||"AIR"):"↔";icon.append(iconText);
  const copy=document.createElement("div");copy.className="result-copy";const strong=document.createElement("strong");strong.textContent=type==="route"?routeTitle(item):item.name||item.iata;const sub=document.createElement("span");sub.textContent=searchSecondary(type,item);copy.append(strong,sub);
  const kind=document.createElement("span");kind.className="result-type";kind.textContent=type==="hotel"?"Collection":type;
  b.append(icon,copy,kind);b.addEventListener("click",()=>{closeSearch();selectObject(type,item.id,{camera:true,history:true})});return b;
}
function searchSecondary(type,item){if(type==="destination")return [item.country,item.region].filter(Boolean).join(" · ");if(type==="hotel")return [item.area||item.city,item.country].filter(Boolean).join(" · ");if(type==="airport")return [item.name,item.city,item.country].filter(Boolean).join(" · ");if(type==="airline")return "Partner airline";if(type==="route")return airlineNames(item.airlineIds).join(" · ")||`${item.fromId} → ${item.toId}`;return ""}

/* =========================================================
   EDITORIAL / DIRECTORY
   ========================================================= */
function renderEditorial(){renderFeatured();renderCollection();renderAirlines()}
function renderFeatured(){
  el.featuredDestinations.replaceChildren();
  const items=[...state.model.destinations].sort((a,b)=>(Number(b.featured)-Number(a.featured))||a.priority-b.priority||a.name.localeCompare(b.name)).slice(0,3);
  if(!items.length){const p=document.createElement("p");p.className="chapter-intro";p.textContent="Published destination stories will appear here as the network is updated.";el.featuredDestinations.append(p);return}
  items.forEach(d=>{
    const b=document.createElement("button");b.type="button";b.className="feature-card";
    if(d.heroImage&&!SAVE_DATA){const img=document.createElement("img");img.alt="";img.loading="lazy";img.src=d.heroImage;img.onerror=()=>img.remove();b.append(img)}
    const copy=document.createElement("div");copy.className="feature-card-copy";const small=document.createElement("small");small.textContent=[d.country,d.region].filter(Boolean)[0]||"Destination";const strong=document.createElement("strong");strong.textContent=d.name;const span=document.createElement("span");span.textContent=d.summary||countsForDestination(d)||"Explore this published SKANDI destination.";copy.append(small,strong,span);b.append(copy);b.addEventListener("click",()=>{scrollToMap();selectObject("destination",d.id,{camera:true,history:true})});el.featuredDestinations.append(b)
  });
}
function renderCollection(){
  el.collectionRail.replaceChildren();el.collectionChapter.hidden=!state.model.hotels.length;
  state.model.hotels.slice(0,12).forEach(h=>{
    const b=document.createElement("button");b.type="button";b.className="collection-card";
    const media=document.createElement("div");media.className="collection-card-media";if(h.image&&!SAVE_DATA){const img=document.createElement("img");img.alt="";img.loading="lazy";img.src=h.image;img.onerror=()=>img.remove();media.append(img)}const badge=document.createElement("span");badge.className="collection-badge";badge.textContent="SKANDI Collection";media.append(badge);
    const copy=document.createElement("div");copy.className="collection-copy";const small=document.createElement("small");small.textContent=[h.area||h.city,h.country].filter(Boolean).join(" · ");const strong=document.createElement("strong");strong.textContent=h.name;const p=document.createElement("p");p.textContent=h.summary||"Handpicked by SKANDI.";copy.append(small,strong,p);b.append(media,copy);b.addEventListener("click",()=>{scrollToMap();selectObject("hotel",h.id,{camera:true,history:true})});el.collectionRail.append(b)
  });
}
function renderAirlines(){
  el.airlineRail.replaceChildren();el.airlineChapter.hidden=!state.model.airlines.length;
  state.model.airlines.forEach(a=>{
    const b=document.createElement("button");b.type="button";b.className="airline-chip";if(a.logo&&!SAVE_DATA){const img=document.createElement("img");img.alt="";img.loading="lazy";img.src=a.logo;img.onerror=()=>img.remove();b.append(img)}const copy=document.createElement("div");const strong=document.createElement("strong");strong.textContent=a.name;const small=document.createElement("small");const count=state.model.routes.filter(r=>routeHasAirline(r,a.id)).length;small.textContent=[a.iata,count?`${count} ${count===1?"connection":"connections"}`:"Partner airline"].filter(Boolean).join(" · ");copy.append(strong,small);b.append(copy);b.addEventListener("click",()=>{scrollToMap();setMode("airlines",true);selectObject("airline",a.id,{camera:true,history:true})});el.airlineRail.append(b)
  });
}
function renderDirectory(){
  el.directoryGrid.replaceChildren();
  const groups=[
    ["Destinations","destination",state.model.destinations],
    ["SKANDI Collection","hotel",state.model.hotels],
    ["Partner airlines","airline",state.model.airlines],
    ["Airports","airport",state.model.airports]
  ].filter(([, ,items])=>items.length);
  groups.forEach(([title,type,items])=>{
    const group=document.createElement("section");group.className="directory-group";const h=document.createElement("h3");h.textContent=title;const list=document.createElement("div");list.className="directory-list";
    items.slice(0,30).forEach(item=>{const b=document.createElement("button");b.type="button";b.className="directory-link";b.textContent=type==="airport"?`${item.iata} · ${item.city||item.name}`:item.name||item.iata;b.addEventListener("click",()=>{scrollToMap();selectObject(type,item.id,{camera:true,history:true})});list.append(b)});group.append(h,list);el.directoryGrid.append(group)
  });
}
function scrollToMap(){document.getElementById("networkApp").scrollIntoView({behavior:REDUCED_MOTION?"auto":"smooth",block:"start"})}

/* =========================================================
   NAVIGATION / BOOKING / DEEP LINKS
   ========================================================= */
function navigate(url,context={}){
  const safe=safeUrl(url);if(!safe)return;
  analytics("network_navigation",context);
  try{window.parent?.postMessage({source:HTML_SOURCE,type:"SKANDI_MAP_NAVIGATE",url:safe,context},"*")}catch{}
  try{window.open(safe,"_top")}catch{}
}
function bookingUrl(params={}){const url=new URL(BOOKING_ROUTE,window.location.origin);Object.entries(params).forEach(([k,v])=>{if(v!==undefined&&v!==null&&String(v)!=="")url.searchParams.set(k,String(v))});return url.pathname+url.search}
function bookRoute(route){analytics("network_booking_click",{kind:"route",origin:route.fromId,destination:route.toId});navigate(bookingUrl({origin:route.fromId,destination:route.toId}),{kind:"route",origin:route.fromId,destination:route.toId})}
function bookDestination(dest){const airport=airportsForDestination(dest)[0];const destination=airport?.iata||dest.iata||dest.slug||dest.name;analytics("network_booking_click",{kind:"destination",destination});navigate(bookingUrl({destination}),{kind:"destination",destination})}
function bookHotel(hotel){const dest=getObject("destination",hotel.destinationId);const destination=dest?.slug||dest?.name||hotel.city||hotel.destinationId;const url=new URL(HOTEL_SEARCH_ROUTE,window.location.origin);if(destination)url.searchParams.set("destination",destination);if(hotel.slug)url.searchParams.set("hotel",hotel.slug);analytics("network_booking_click",{kind:"hotel",hotel:hotel.slug||hotel.id,destination});navigate(url.pathname+url.search,{kind:"hotel",hotel:hotel.slug||hotel.id,destination})}
function bookFromAirport(airport){analytics("network_booking_click",{kind:"airport",origin:airport.iata});navigate(bookingUrl({origin:airport.iata}),{kind:"airport",origin:airport.iata})}
function publicSelectionId(type,obj){return type==="airport"?obj.iata:type==="airline"?(obj.iata||obj.id):type==="destination"?(obj.slug||obj.id):type==="hotel"?(obj.slug||obj.id):type==="route"?`${obj.fromId}-${obj.toId}`:obj.id}
function writeDeepLink(type,obj){
  const params=new URLSearchParams();params.set(type,publicSelectionId(type,obj));if(state.selectedRegion)params.set("region",state.selectedRegion);
  const next=`${location.pathname}?${params.toString()}`;try{history.replaceState({type,id:publicSelectionId(type,obj)},"",next)}catch{}
  try{window.parent?.postMessage({source:HTML_SOURCE,type:"SKANDI_MAP_STATE",state:{type,id:publicSelectionId(type,obj),region:state.selectedRegion||""}},"*")}catch{}
}
function clearDeepLink(){try{history.replaceState({},"",location.pathname)}catch{};try{window.parent?.postMessage({source:HTML_SOURCE,type:"SKANDI_MAP_STATE",state:{}},"*")}catch{}}
function applyDeepLink(){
  const p=new URLSearchParams(location.search);const types=["destination","hotel","airport","airline","route"];for(const type of types){const value=p.get(type);if(!value)continue;if(type==="route"){const key=value.replace("-","↔");const route=state.model.routes.find(r=>r.id===key||`${r.fromId}-${r.toId}`===value||`${r.toId}-${r.fromId}`===value);if(route){selectObject("route",route.id,{camera:true,history:false});return}}
    const obj=getObject(type,value);if(obj){selectObject(type,obj.id,{camera:true,history:false});return}
  }
}

/* =========================================================
   MOBILE SHEET
   ========================================================= */
function setSheetSnap(snap){state.mobileSheetState=snap;el.mobileSheet.dataset.snap=snap;el.sheetSnap.textContent=snap==="peek"?"Expand":snap==="medium"?"Full":"Collapse";el.sheetSnap.setAttribute("aria-label",snap==="full"?"Collapse details":"Expand details")}
function cycleSheet(){setSheetSnap(state.mobileSheetState==="peek"?"medium":state.mobileSheetState==="medium"?"full":"peek")}
function installSheetGestures(){
  let startY=0,active=false;
  el.mobileSheet.addEventListener("pointerdown",e=>{if(e.target.closest("button,a")||el.mobileSheetContent.scrollTop>0)return;active=true;startY=e.clientY;el.mobileSheet.setPointerCapture?.(e.pointerId)});
  el.mobileSheet.addEventListener("pointerup",e=>{if(!active)return;active=false;const dy=e.clientY-startY;if(Math.abs(dy)<36)return;if(dy<0)setSheetSnap(state.mobileSheetState==="peek"?"medium":"full");else setSheetSnap(state.mobileSheetState==="full"?"medium":"peek")});
}

/* =========================================================
   STATUS / ERROR / BRIDGE
   ========================================================= */
function setStatus(message,{tone="info",retry=false}={}){el.mapStatusText.textContent=message||"";el.mapStatus.dataset.tone=tone;el.mapRetry.hidden=!retry;el.mapStatus.hidden=!message}
function showMapFailure(message){state.dataState="error";el.networkHero.classList.add("map-ready");setStatus(message,{tone:"error",retry:true});renderDirectory()}
function requestRefresh(){try{window.parent?.postMessage({source:HTML_SOURCE,type:"SKANDI_MAP_REFRESH"},"*");setStatus("Refreshing the published network…",{tone:"info"})}catch{}}
function notifyReady(){try{window.parent?.postMessage({source:HTML_SOURCE,type:"SKANDI_MAP_READY"},"*")}catch{}}
function applyPayload(payload){
  try{
    const previousSelection={type:state.selectionType,id:state.selectionId};state.payload=payload;state.model=normalizePayload(payload);state.dataReceived=true;state.dataState="ready";
    if(state.mapReady)renderModel();else state.pendingPayload=payload;
    setStatus("");
    if(previousSelection.id&&getObject(previousSelection.type,previousSelection.id))selectObject(previousSelection.type,previousSelection.id,{camera:false,history:false});else if(previousSelection.id)clearSelection({camera:false,history:false});
    else applyDeepLink();
    analytics("network_view",state.model.stats);
  }catch(error){logger("payload_render_failed",{message:error.message});setStatus("We couldn't load the network right now.",{tone:"error",retry:true})}
}
window.loadMapData=applyPayload;

/* Listener-first bridge: attached before READY is ever sent. */
window.addEventListener("message",event=>{
  let data=event.data;if(typeof data==="string"){try{data=JSON.parse(data)}catch{return}}
  if(!data||typeof data!=="object")return;
  if(data.source&&data.source!==PARENT_SOURCE)return;
  const type=cleanString(data.type).toUpperCase();
  if(type==="SKANDI_MAP_ERROR"){
    logger("parent_error",{message:cleanString(data.message||data.payload?.message)});
    if(state.retryCount<1){state.retryCount++;setTimeout(requestRefresh,900);return}
    setStatus("We couldn't load the network right now.",{tone:"error",retry:true});return;
  }
  const payload=mapDataMessagePayload(data);if(payload)applyPayload(payload);
});

/* =========================================================
   BOOTSTRAP / EVENTS
   ========================================================= */
document.addEventListener("DOMContentLoaded",()=>{
  cacheElements();
  el.modeRail.addEventListener("click",e=>{const b=e.target.closest("[data-mode]");if(b)setMode(b.dataset.mode,true)});
  el.searchOpen.addEventListener("click",()=>{el.networkSearch.placeholder="Search the SKANDI network";openSearch()});
  el.searchClose.addEventListener("click",closeSearch);
  el.searchLayer.addEventListener("click",e=>{if(e.target===el.searchLayer)closeSearch()});
  el.networkSearch.addEventListener("input",e=>renderSearchResults(e.target.value,state.mode==="airlines"?["airline"]:null));
  el.networkSearch.addEventListener("keydown",e=>{if(e.key==="Escape")closeSearch();if(e.key==="ArrowDown"){e.preventDefault();el.searchResults.querySelector(".search-result")?.focus()}});
  el.searchResults.addEventListener("keydown",e=>{const buttons=[...el.searchResults.querySelectorAll(".search-result")];const i=buttons.indexOf(document.activeElement);if(e.key==="ArrowDown"){e.preventDefault();buttons[Math.min(buttons.length-1,i+1)]?.focus()}if(e.key==="ArrowUp"){e.preventDefault();if(i<=0)el.networkSearch.focus();else buttons[i-1]?.focus()}if(e.key==="Escape")closeSearch()});
  el.panelClose.addEventListener("click",()=>clearSelection({camera:false,history:true}));
  el.sheetSnap.addEventListener("click",cycleSheet);installSheetGestures();
  el.zoomIn.addEventListener("click",()=>state.map?.zoomIn({duration:cameraDuration(250)}));el.zoomOut.addEventListener("click",()=>state.map?.zoomOut({duration:cameraDuration(250)}));el.resetMap.addEventListener("click",()=>{clearSelection({camera:false,history:true});state.selectedRegion=null;state.selectedAirlineId=null;state.mode="explore";syncModeButtons();renderRegions();applyMode();fitDefaultBounds(true)});
  el.mapRetry.addEventListener("click",requestRefresh);
  el.planJourney.addEventListener("click",()=>{const selected=getObject(state.selectionType,state.selectionId);if(state.selectionType==="route")bookRoute(selected);else if(state.selectionType==="destination")bookDestination(selected);else navigate(BOOKING_ROUTE,{kind:"general"})});
  document.addEventListener("keydown",e=>{if(e.key==="Escape"){if(state.searchOpen)closeSearch();else if(state.panelOpen)clearSelection({camera:false,history:true})}if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k"){e.preventDefault();openSearch()}});

  initMap();
  notifyReady();
  state.dataState="loading";
  setStatus("Loading the published SKANDI network…",{tone:"info"});
  setTimeout(()=>{if(!state.dataReceived&&state.retryCount<1){state.retryCount++;requestRefresh()}},4500);
});

window.addEventListener("beforeunload",()=>{stopRouteAnimation();state.resizeObserver?.disconnect();try{state.map?.remove()}catch{}});
</script>
</body>
</html>
