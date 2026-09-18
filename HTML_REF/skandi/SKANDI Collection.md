# SKANDI Collection

STATUS: IN PROGRESS
SLUG: /skandi-collection
WIX PAGE: SKANDI Collection.lo9p5
AREA: SKANDI
LIVE HTML: YES
ELEMENT: #skandiCollectionEmbed
LAST SYNCED: 2026-09-16

## HOW TO USE
***STATUS (OWNER): "TODO", "IN PROGRESS", "NEEDS REVIEW", "REVISIONS NEEDED", "READY", "LIVE", "ARCHIVED"
STATUS (AGENT): "TODO", "IN PROGRESS", "REVISIONS NEEDED", "READY".***

###  COMMENT SECTION (START ON A NEW ROW, LOG IF A CHANGE IS MADE THAT REQUIRES ATTENTION) 
1. 9/17 1:13PM "Page is almost styled from my end, page not syncing correctly yet" /Samuel
2. 9/18 3:10AM "Page is designed. Needs to be synced" /Samuel
3.
...
***END*** 

#### LIVE HTML

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta content="width=device-width,initial-scale=1,viewport-fit=cover" name="viewport"/>
<meta content="#022e64" name="theme-color"/>
<title>SKANDI Collection</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800&display=swap" rel="stylesheet"/>
<style>
:root{
  --sk-navy:#022e64;
  --sk-navy2:#0b5c85;
  --sk-blue:#285ca8;
  --sk-aqua:#5FC7CF;
  --sk-aqua-soft:#d9f1f1;
  --sk-white:#ffffff;
  --sk-sand:#f2e9dc;
  --sk-ice:#e9eef8;
  --sk-section:#f3f6f8;
  --sk-porcelain:#fbfaf6;
  --sk-champagne:#d1bc98;
  --sk-deep-teal:#173747;
  --sk-graphite:#111827;
  --sk-muted:#667085;
  --sk-body:#526274;
  --sk-line:#dbe3ef;
  --sk-line-soft:#eef2f7;
  --sk-shadow:0 18px 46px rgba(2,46,100,.10);
  --sk-shadow-strong:0 30px 70px rgba(2,46,100,.17);
  --ease:cubic-bezier(.16,1,.3,1);
  --content:1240px;
}
*{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth;background:var(--sk-navy)}
body{
  margin:0;min-width:0;min-height:100%;overflow-x:hidden;background:#fff;color:var(--sk-graphite);
  font-family:Montserrat,system-ui,-apple-system,"Segoe UI",sans-serif;
  -webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;
}
button,input,select{font:inherit}button{cursor:pointer}button:disabled{cursor:not-allowed;opacity:.56}
a{color:inherit}.hidden{display:none!important}
.wrap{width:min(var(--content),calc(100% - 64px));margin-inline:auto}
.visually-hidden{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important}
button:focus-visible,input:focus-visible,select:focus-visible,a:focus-visible{outline:3px solid rgba(95,199,207,.42);outline-offset:3px}
.btn{
  appearance:none;border:1px solid transparent;border-radius:999px;min-height:48px;padding:0 20px;
  display:inline-flex;align-items:center;justify-content:center;gap:9px;background:var(--sk-navy);color:#fff;text-decoration:none;
  font-size:10px;font-weight:800;letter-spacing:.13em;text-transform:uppercase;
  transition:transform .22s var(--ease),background .22s ease,border-color .22s ease,box-shadow .22s ease
}
.btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 12px 26px rgba(2,46,100,.18)}
.btn.secondary{background:#fff;color:var(--sk-navy);border-color:rgba(2,46,100,.13)}
.btn.secondary:hover{border-color:var(--sk-aqua)}
.btn.dark{background:linear-gradient(135deg,#022e64,#0b5c85)}
.btn.aqua{background:var(--sk-aqua-soft);color:var(--sk-navy)}
.eyebrow{display:inline-flex;align-items:center;gap:11px;color:var(--sk-blue);font-size:10px;font-weight:800;letter-spacing:.19em;text-transform:uppercase}
.eyebrow:before{content:"";width:34px;height:1px;background:currentColor;opacity:.72}
.eyebrow.light{color:#d8f0f1}.eyebrow.gold{color:var(--sk-champagne)}
.copy{font-size:13px;color:var(--sk-body);line-height:1.78}
.icon-arrow{font-size:15px;line-height:1}

/* HERO / LUXURY EDITORIAL COVER */
.hero{
  position:relative;
  isolation:isolate;
  overflow:hidden;
  min-height:clamp(760px,88svh,980px);
  color:#fff;
  background:#03111f;
}
.hero-media{
  position:absolute;
  inset:-3%;
  z-index:-4;
  background-image:var(--hero-image,linear-gradient(135deg,#173747,#022e64 58%,#0b5c85));
  background-size:cover;
  background-position:center;
  transform:scale(1.035);
  filter:saturate(.90) contrast(1.02);
  animation:collectionCinema 18s ease-in-out infinite alternate;
}
@keyframes collectionCinema{
  from{transform:scale(1.035) translate3d(0,0,0)}
  to{transform:scale(1.085) translate3d(-.7%,.5%,0)}
}
.hero-veil{
  position:absolute;
  inset:0;
  z-index:-3;
  pointer-events:none;
  background:
    linear-gradient(90deg,
      rgba(2,16,34,.94) 0%,
      rgba(2,28,58,.83) 36%,
      rgba(2,46,100,.47) 62%,
      rgba(2,46,100,.17) 100%),
    linear-gradient(180deg,rgba(3,17,31,.06) 0%,rgba(3,17,31,.18) 56%,rgba(3,17,31,.78) 100%);
}
.hero-veil::before{
  content:"";
  position:absolute;
  inset:0;
  background:
    radial-gradient(circle at 77% 20%,rgba(209,188,152,.17),transparent 19%),
    radial-gradient(circle at 68% 72%,rgba(95,199,207,.12),transparent 24%);
}
.hero-grain{
  position:absolute;
  inset:0;
  z-index:-2;
  pointer-events:none;
  opacity:.11;
  background-image:
    radial-gradient(circle at 15% 20%,rgba(255,255,255,.85) 0 .55px,transparent .7px),
    radial-gradient(circle at 70% 60%,rgba(255,255,255,.45) 0 .5px,transparent .7px);
  background-size:7px 7px,11px 11px;
  mix-blend-mode:soft-light;
}
.hero-rule{
  position:absolute;
  left:0;
  right:0;
  top:0;
  height:1px;
  z-index:4;
  background:linear-gradient(90deg,transparent,rgba(209,188,152,.78),rgba(95,199,207,.48),transparent);
  animation:heroRuleGlow 5.8s ease-in-out infinite alternate;
}
@keyframes heroRuleGlow{to{opacity:.48;filter:blur(.2px)}}
.hero::after{
  content:"";
  position:absolute;
  left:0;
  right:0;
  bottom:-1px;
  height:260px;
  z-index:1;
  pointer-events:none;
  background:linear-gradient(180deg,transparent 0%,rgba(243,246,248,.06) 18%,rgba(243,246,248,.58) 70%,#f3f6f8 100%);
}
.hero-inner{
  position:relative;
  z-index:3;
  min-height:inherit;
  padding:clamp(68px,8vh,104px) 0 190px;
  display:grid;
  grid-template-columns:minmax(0,1.12fr) minmax(320px,.58fr);
  gap:clamp(42px,6vw,94px);
  align-items:end;
}
.hero-copy{
  max-width:820px;
  align-self:center;
}
.collection-brand{
  display:flex;
  align-items:center;
  min-height:78px;
  margin-bottom:34px;
}
.collection-brand img{
  width:auto;
  max-width:min(380px,70vw);
  max-height:80px;
  object-fit:contain;
  filter:drop-shadow(0 12px 28px rgba(0,0,0,.20));
}
.collection-wordmark{
  display:flex;
  align-items:center;
  gap:15px;
  color:#fff;
  font-size:12px;
  font-weight:700;
  letter-spacing:.24em;
  text-transform:uppercase;
}
.collection-wordmark:before{
  content:"◆";
  color:var(--sk-champagne);
  font-size:14px;
  filter:drop-shadow(0 0 12px rgba(209,188,152,.38));
}
.collection-wordmark span{color:#d9e7f4}
.hero-kicker{
  display:flex;
  align-items:center;
  gap:12px;
  margin-bottom:18px;
  color:#e6d6bb;
  font-size:9px;
  font-weight:800;
  letter-spacing:.22em;
  text-transform:uppercase;
}
.hero-kicker::before{
  content:"";
  width:42px;
  height:1px;
  background:linear-gradient(90deg,var(--sk-champagne),transparent);
}
.hero h1{
  max-width:900px;
  margin:0;
  font-size:clamp(58px,7.2vw,104px);
  font-weight:300;
  line-height:.90;
  letter-spacing:-.072em;
  text-wrap:balance;
}
.hero h1 em{
  display:block;
  margin-top:.09em;
  color:#fff;
  font-style:normal;
  font-weight:650;
}
.hero-lede{
  max-width:690px;
  margin-top:26px;
  color:#d9e7f4;
  font-size:clamp(15px,1.35vw,18px);
  font-weight:450;
  line-height:1.76;
}
.hero-actions{
  display:flex;
  gap:10px;
  flex-wrap:wrap;
  margin-top:31px;
}
.hero-actions .btn.aqua{
  background:#f2e9dc;
  color:#3c2f20;
}
.hero-actions .btn.aqua:hover{
  background:#fff;
}
.hero-actions .btn.secondary{
  color:#fff;
  background:rgba(255,255,255,.07);
  border-color:rgba(255,255,255,.25);
  backdrop-filter:blur(12px);
}
.hero-actions .btn.secondary:hover{
  background:rgba(255,255,255,.13);
  border-color:rgba(209,188,152,.58);
}
.hero-aside{
  position:relative;
  align-self:end;
  min-height:420px;
  padding:28px 28px 26px;
  overflow:hidden;
  border:1px solid rgba(255,255,255,.17);
  border-radius:30px;
  background:
    linear-gradient(180deg,rgba(255,255,255,.10),rgba(255,255,255,.055)),
    rgba(3,17,31,.28);
  backdrop-filter:blur(22px) saturate(1.10);
  box-shadow:0 30px 90px rgba(0,0,0,.22);
}
.hero-aside::before{
  content:"";
  position:absolute;
  width:230px;
  height:230px;
  top:-120px;
  right:-110px;
  border:1px solid rgba(209,188,152,.22);
  border-radius:50%;
}
.hero-aside::after{
  content:"";
  position:absolute;
  inset:0;
  pointer-events:none;
  background:linear-gradient(115deg,transparent 0 38%,rgba(255,255,255,.08) 50%,transparent 62%);
  background-size:220% 100%;
  animation:asideSweep 9s ease-in-out infinite;
}
@keyframes asideSweep{
  0%,28%{background-position:-140% 0}
  74%,100%{background-position:170% 0}
}
.hero-aside-label{
  position:relative;
  z-index:1;
  color:var(--sk-champagne);
  font-size:9px;
  font-weight:800;
  letter-spacing:.18em;
  text-transform:uppercase;
  margin-bottom:42px;
}
.hero-aside h2{
  position:relative;
  z-index:1;
  max-width:310px;
  font-size:33px;
  font-weight:450;
  letter-spacing:-.052em;
  line-height:1.02;
  margin-bottom:17px;
}
.hero-aside p{
  position:relative;
  z-index:1;
  color:#c9d8e8;
  font-size:11px;
  line-height:1.76;
}
.hero-values{
  position:relative;
  z-index:1;
  display:grid;
  gap:0;
  margin-top:29px;
  border-top:1px solid rgba(255,255,255,.14);
}
.hero-value{
  display:grid;
  grid-template-columns:34px 1fr;
  gap:12px;
  align-items:start;
  padding:14px 0;
  border-bottom:1px solid rgba(255,255,255,.12);
}
.hero-value span{
  color:var(--sk-champagne);
  font-size:9px;
  font-weight:700;
  letter-spacing:.08em;
}
.hero-value strong{
  color:#fff;
  font-size:10px;
  font-weight:600;
  line-height:1.45;
}
.hero-metrics{
  position:absolute;
  z-index:4;
  left:50%;
  bottom:58px;
  width:min(var(--content),calc(100% - 64px));
  transform:translateX(-50%);
  display:grid;
  grid-template-columns:repeat(4,1fr);
  border-top:1px solid rgba(255,255,255,.20);
  border-bottom:1px solid rgba(255,255,255,.12);
  background:rgba(3,17,31,.18);
  backdrop-filter:blur(12px);
}
.hero-metric{
  min-height:74px;
  padding:16px 20px;
  border-right:1px solid rgba(255,255,255,.12);
}
.hero-metric:last-child{border-right:0}
.hero-metric strong{
  display:block;
  color:#fff;
  font-size:22px;
  font-weight:550;
  letter-spacing:-.045em;
}
.hero-metric span{
  display:block;
  margin-top:3px;
  color:#adc5d9;
  font-size:8px;
  font-weight:700;
  letter-spacing:.11em;
  text-transform:uppercase;
}
.hero-scroll{
  position:absolute;
  z-index:4;
  right:max(32px,calc((100% - var(--content))/2));
  bottom:153px;
  color:#dce9f4;
  font-size:8px;
  font-weight:800;
  letter-spacing:.16em;
  text-transform:uppercase;
  display:flex;
  align-items:center;
  gap:10px;
  opacity:.72;
  writing-mode:vertical-rl;
}
.hero-scroll::after{
  content:"";
  width:1px;
  height:48px;
  background:linear-gradient(180deg,var(--sk-champagne),transparent);
}

/* SEARCH */
.search{position:relative;z-index:8;margin-top:-72px}
.search-card{position:relative;overflow:hidden;background:rgba(255,255,255,.96);border:1px solid rgba(219,227,239,.94);border-radius:30px;padding:28px;box-shadow:0 30px 78px rgba(2,46,100,.16);backdrop-filter:blur(18px)}
.search-card::before{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(115deg,transparent 0 38%,rgba(95,199,207,.08) 50%,transparent 62%);background-size:220% 100%;animation:searchSweep 9s ease-in-out infinite}
@keyframes searchSweep{0%,30%{background-position:-140% 0}70%,100%{background-position:180% 0}}
.search-head{position:relative;display:flex;align-items:flex-end;justify-content:space-between;gap:28px;margin-bottom:22px}
.search-head h2{font-size:clamp(28px,3.4vw,42px);line-height:1;letter-spacing:-.052em;color:var(--sk-navy);font-weight:600;margin-top:7px}
.search-head p{max-width:520px;font-size:11px;line-height:1.7;color:var(--sk-muted)}
.grid{position:relative;display:grid;grid-template-columns:repeat(12,1fr);gap:12px}
.field{display:flex;flex-direction:column;gap:7px}.field label{font-size:8px;text-transform:uppercase;letter-spacing:.13em;font-weight:800;color:var(--sk-muted)}
.field input,.field select{width:100%;min-height:48px;border:1px solid var(--sk-line);border-radius:13px;background:#fff;padding:10px 12px;color:var(--sk-graphite);outline:none;transition:border-color .2s ease,box-shadow .2s ease,transform .2s ease}
.field input:focus,.field select:focus{border-color:var(--sk-aqua);box-shadow:0 0 0 4px rgba(95,199,207,.12),0 10px 24px rgba(2,46,100,.06);transform:translateY(-1px)}
.col2{grid-column:span 2}.col3{grid-column:span 3}.col4{grid-column:span 4}.col6{grid-column:span 6}.col12{grid-column:span 12}
.hint{position:relative;font-size:10px;color:var(--sk-muted);line-height:1.65;margin-top:14px}.hint strong{color:var(--sk-navy)}
.package-status{position:relative;margin-top:15px;border-radius:16px;padding:13px 15px;background:var(--sk-section);border:1px solid var(--sk-line-soft);color:#526274;font-size:10px;line-height:1.55}

/* PAGE */
main{position:relative;z-index:1;background:radial-gradient(circle at 8% 10%,rgba(95,199,207,.07),transparent 18%),radial-gradient(circle at 94% 42%,rgba(40,92,168,.06),transparent 18%),#fff}
main::before{content:"";position:absolute;inset:0;z-index:-1;pointer-events:none;opacity:.34;background-image:linear-gradient(rgba(2,46,100,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(2,46,100,.03) 1px,transparent 1px);background-size:58px 58px;mask-image:linear-gradient(180deg,transparent,#000 12%,#000 84%,transparent)}
.section{padding:92px 0}.section.soft{background:var(--sk-section)}.section.dark{background:linear-gradient(135deg,#03111f,#022e64 58%,#0b5c85);color:#fff}
.section-head{display:grid;grid-template-columns:minmax(0,1fr) minmax(320px,.54fr);gap:42px;align-items:end;margin-bottom:34px}
.section-head h2{max-width:780px;margin-top:8px;color:var(--sk-navy);font-size:clamp(36px,5.4vw,66px);font-weight:500;line-height:.96;letter-spacing:-.062em}
.section.dark .section-head h2{color:#fff}.section.dark .copy{color:#bfcede}

/* TIER STORY */
.philosophy-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.philosophy-card{position:relative;overflow:hidden;min-height:310px;border-radius:28px;padding:28px;border:1px solid rgba(2,46,100,.08);box-shadow:0 14px 34px rgba(2,46,100,.08);display:flex;flex-direction:column;justify-content:space-between;transition:transform .32s var(--ease),box-shadow .32s ease,border-color .2s ease}
.philosophy-card:nth-child(1){background:#d9f1f1;color:#022e64}.philosophy-card:nth-child(2){background:linear-gradient(135deg,#022e64,#0b5c85);color:#fff}.philosophy-card:nth-child(3){background:#f2e9dc;color:#3c2f20}
.philosophy-card::before{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle at var(--fx-x,82%) var(--fx-y,12%),rgba(255,255,255,.36),transparent 28%);opacity:.56}
.philosophy-card::after{content:"";position:absolute;width:220px;height:220px;border-radius:50%;right:-88px;top:-104px;border:1px solid currentColor;opacity:.09;transition:transform .5s var(--ease)}
.philosophy-card:hover{transform:translateY(-7px);box-shadow:0 25px 54px rgba(2,46,100,.15);border-color:rgba(95,199,207,.38)}
.philosophy-card:hover::after{transform:scale(1.14) translate(-8px,8px)}
.philosophy-no{position:relative;font-size:9px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;opacity:.64}
.philosophy-card h3{position:relative;font-size:32px;font-weight:550;letter-spacing:-.05em;margin-bottom:10px}
.philosophy-card p{position:relative;font-size:11px;line-height:1.7;max-width:380px;opacity:.75}
.philosophy-line{position:relative;width:38px;height:1px;background:currentColor;opacity:.45;margin-bottom:16px}

/* SPOTLIGHT */
.spotlight-grid{display:grid;grid-template-columns:1.2fr .8fr;grid-template-rows:repeat(2,minmax(250px,1fr));gap:14px}
.spotlight-card{position:relative;overflow:hidden;min-height:250px;border-radius:28px;color:#fff;background:#022e64;box-shadow:0 18px 46px rgba(2,46,100,.14);border:1px solid rgba(255,255,255,.08);cursor:pointer;isolation:isolate;transition:transform .32s var(--ease),box-shadow .32s ease}
.spotlight-card:first-child{grid-row:span 2;min-height:514px}.spotlight-card:hover{transform:translateY(-5px);box-shadow:0 28px 66px rgba(2,46,100,.22)}
.spotlight-image{position:absolute;inset:0;background:linear-gradient(145deg,#022e64,#0b5c85) center/cover no-repeat;transition:transform .8s var(--ease)}
.spotlight-card:hover .spotlight-image{transform:scale(1.045)}
.spotlight-card::after{content:"";position:absolute;inset:0;z-index:1;background:linear-gradient(180deg,rgba(2,20,42,.04) 10%,rgba(2,20,42,.20) 46%,rgba(2,20,42,.90) 100%)}
.spotlight-copy{position:absolute;z-index:2;left:25px;right:25px;bottom:24px}.spotlight-kicker{font-size:8px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:#d9f1f1}
.spotlight-copy h3{margin:8px 0 7px;font-size:clamp(24px,3vw,42px);font-weight:550;letter-spacing:-.05em;line-height:1}
.spotlight-card:not(:first-child) .spotlight-copy h3{font-size:25px}.spotlight-copy p{max-width:620px;color:#c8d8e8;font-size:10px;line-height:1.62}
.spotlight-empty{grid-column:1/-1;padding:34px;border:1px dashed rgba(2,46,100,.18);border-radius:24px;background:#fff;color:var(--sk-muted)}

/* FILTERS */
.filters-shell{position:sticky;top:0;z-index:20;margin-bottom:24px;padding:10px 0;background:linear-gradient(180deg,rgba(243,246,248,.98),rgba(243,246,248,.93));backdrop-filter:blur(16px)}
.filters-line{display:flex;align-items:center;justify-content:space-between;gap:18px;flex-wrap:wrap}.tabs{display:flex;gap:7px;flex-wrap:wrap}
.tab{border:1px solid rgba(2,46,100,.10);background:#fff;color:var(--sk-navy);border-radius:999px;min-height:38px;padding:0 13px;font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:.09em;cursor:pointer;transition:transform .18s ease,background .18s ease,color .18s ease,border-color .18s ease,box-shadow .18s ease}
.tab:hover{transform:translateY(-1px);border-color:var(--sk-aqua)}.tab.active{background:linear-gradient(135deg,#022e64,#0b5c85);border-color:#022e64;color:#fff;box-shadow:0 7px 18px rgba(2,46,100,.18)}
.filter-select{min-width:230px}.filter-select select{width:100%;min-height:40px;border:1px solid rgba(2,46,100,.11);border-radius:999px;background:#fff;color:var(--sk-navy);padding:0 36px 0 14px}

/* COLLECTION CARDS */
.inventory-summary{font-size:10px;color:var(--sk-muted);font-weight:700;margin-bottom:18px}
.cards{display:grid;grid-template-columns:repeat(12,1fr);gap:14px}
.card{
  --card-surface:#fff;--card-title:#022e64;--card-copy:#667085;--card-meta:#667085;
  grid-column:span 4;position:relative;overflow:hidden;border-radius:28px;background:#fff;border:1px solid rgba(2,46,100,.08);
  box-shadow:0 13px 34px rgba(2,46,100,.08);isolation:isolate;transition:transform .34s var(--ease),box-shadow .34s ease,border-color .2s ease
}
.card:nth-child(6n+1){grid-column:span 8}
.card:nth-child(5n+1){--card-surface:linear-gradient(135deg,#022e64,#0b5c85);--card-title:#fff;--card-copy:rgba(255,255,255,.74);--card-meta:rgba(255,255,255,.68)}
.card:nth-child(5n+2){--card-surface:#fff}.card:nth-child(5n+3){--card-surface:#d9f1f1}
.card:nth-child(5n+4){--card-surface:#f2e9dc;--card-title:#3c2f20;--card-copy:#6d6254;--card-meta:#6d6254}.card:nth-child(5n+5){--card-surface:#e9eef8}
.card:hover{transform:translateY(-7px);border-color:rgba(95,199,207,.42);box-shadow:0 26px 56px rgba(2,46,100,.16)}
.thumb{position:relative;height:260px;background:linear-gradient(145deg,#e9eef8,#d9f1f1) center/cover no-repeat;overflow:hidden}
.card:nth-child(6n+1) .thumb{height:360px}
.thumb::after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,rgba(2,46,100,.01),rgba(2,46,100,.09))}
.thumb-fallback{height:100%;display:grid;place-items:center;color:#022e64;text-align:center;padding:20px;background:radial-gradient(circle at 82% 10%,rgba(95,199,207,.20),transparent 30%),linear-gradient(145deg,#f3f6f8,#e9eef8)}
.thumb-fallback span{font-size:30px;font-weight:600;letter-spacing:.08em;opacity:.45}
.card-body{position:relative;padding:23px;background:var(--card-surface);min-height:225px;display:flex;flex-direction:column}
.card-body::before{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle at var(--fx-x,85%) var(--fx-y,10%),rgba(255,255,255,.30),transparent 28%);opacity:.5}
.tier-line{position:relative;display:flex;gap:7px;flex-wrap:wrap;margin-bottom:14px}
.tier-tag,.tag{display:inline-flex;border-radius:999px;padding:6px 9px;font-size:8px;font-weight:800;letter-spacing:.10em;text-transform:uppercase}
.tier-tag{background:#022e64;color:#fff}.tier-tag.select{background:#d9f1f1;color:#022e64;border:1px solid rgba(2,46,100,.08)}
.tier-tag.signature{background:#022e64;color:#fff}.tier-tag.excelsior{background:#111827;color:#fff}.tier-tag.partner{background:#5FC7CF;color:#022e64}
.tag{background:rgba(2,46,100,.065);color:var(--card-title)}.card:nth-child(5n+1) .tag{background:rgba(255,255,255,.12);color:#fff}
.card h3{position:relative;color:var(--card-title);font-size:22px;line-height:1.05;letter-spacing:-.045em;font-weight:600;margin-bottom:10px}
.card p{position:relative;color:var(--card-copy);font-size:10.5px;line-height:1.7}
.meta{position:relative;color:var(--card-meta);font-size:9px;line-height:1.55;margin-top:14px}
.live-dot{display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--sk-aqua);margin-right:7px;box-shadow:0 0 0 4px rgba(95,199,207,.12)}
.card-actions{position:relative;margin-top:auto;padding-top:18px;display:flex;gap:8px;flex-wrap:wrap}.card-actions .btn{min-height:39px;padding:0 13px;font-size:8px}
.card:nth-child(5n+1) .card-actions .btn.secondary{background:rgba(255,255,255,.10);color:#fff;border-color:rgba(255,255,255,.22)}
.card:nth-child(5n+1) .card-actions .btn.secondary:hover{border-color:var(--sk-aqua)}

/* STATUS / OFFERS */
.notice{border:1px solid rgba(2,46,100,.08);border-radius:18px;padding:15px 17px;background:#fff;color:#526274;font-size:10.5px;line-height:1.65;box-shadow:0 7px 20px rgba(2,46,100,.04)}
.notice.accent{background:#d9f1f1;color:#173747}
.results{display:grid;gap:12px;margin-top:18px}
.offer{position:relative;overflow:hidden;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:20px;align-items:center;border:1px solid rgba(2,46,100,.08);border-radius:22px;background:#fff;padding:20px;box-shadow:0 10px 28px rgba(2,46,100,.065);transition:transform .25s var(--ease),box-shadow .25s ease,border-color .2s ease}
.offer:nth-child(4n+2){background:#d9f1f1}.offer:nth-child(4n+3){background:#f2e9dc}.offer:nth-child(4n+4){background:#e9eef8}
.offer:hover{transform:translateY(-3px);box-shadow:0 17px 36px rgba(2,46,100,.12);border-color:rgba(95,199,207,.40)}
.offer h3{font-size:17px;color:var(--sk-navy);margin-bottom:6px}.offer .copy{font-size:10px}
.price{font-size:25px;font-weight:700;color:var(--sk-navy);text-align:right;letter-spacing:-.04em}

/* CLOSING */
.promise-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.promise-card{position:relative;overflow:hidden;min-height:330px;border-radius:28px;padding:30px;border:1px solid rgba(255,255,255,.12)}
.promise-card:first-child{background:rgba(255,255,255,.08);backdrop-filter:blur(14px)}
.promise-card:last-child{background:#f2e9dc;color:#3c2f20;border-color:rgba(255,255,255,.10)}
.promise-card h3{font-size:32px;line-height:1;letter-spacing:-.05em;font-weight:550;margin:90px 0 12px}
.promise-card p{font-size:11px;line-height:1.75;opacity:.74;max-width:520px}
.promise-mark{font-size:9px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:var(--sk-champagne)}
.promise-card:last-child .promise-mark{color:#8d7557}

.toast{position:fixed;right:18px;bottom:18px;z-index:50;display:none;max-width:min(380px,calc(100vw - 36px));border-radius:14px;padding:12px 15px;background:rgba(2,46,100,.96);color:#fff;box-shadow:0 18px 46px rgba(2,46,100,.25);backdrop-filter:blur(12px);font-size:10px;line-height:1.45}
.reveal{opacity:0;transform:translateY(24px) scale(.988)}.reveal.visible{opacity:1;transform:none;transition:opacity .72s var(--ease),transform .72s var(--ease)}
.fx-card{--fx-x:50%;--fx-y:50%;will-change:transform;transform-style:preserve-3d}

@media(max-width:1080px){
  .wrap{width:min(var(--content),calc(100% - 40px))}
  .hero-inner{grid-template-columns:1fr;gap:34px;padding-bottom:175px}.hero-aside{max-width:650px}
  .section-head{grid-template-columns:1fr;gap:14px}.philosophy-grid{grid-template-columns:1fr 1fr}.philosophy-card:last-child{grid-column:1/-1}
  .card{grid-column:span 6}.card:nth-child(6n+1){grid-column:span 6}.card:nth-child(6n+1) .thumb{height:280px}
}
@media(max-width:760px){
  .wrap{width:calc(100% - 24px)}
  .hero{min-height:760px}.hero-inner{padding:58px 0 170px;align-items:start}.hero h1{font-size:clamp(50px,15vw,76px)}
  .hero-aside{padding:21px;border-radius:23px}.hero-scroll{bottom:54px}
  .search{margin-top:-54px}.search-card{padding:19px;border-radius:23px}.search-head{display:block}.search-head p{margin-top:10px}
  .grid{grid-template-columns:1fr 1fr}.col2,.col3,.col4,.col6,.col12{grid-column:auto}.field.col3,.field.col6{grid-column:1/-1}
  .section{padding:64px 0}.section-head h2{font-size:42px}
  .philosophy-grid{grid-template-columns:1fr}.philosophy-card:last-child{grid-column:auto}
  .spotlight-grid{grid-template-columns:1fr;grid-template-rows:auto}.spotlight-card,.spotlight-card:first-child{grid-row:auto;min-height:390px}
  .filters-line{display:block}.filter-select{margin-top:10px;min-width:0}
  .tabs{flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none;padding-bottom:3px}.tabs::-webkit-scrollbar{display:none}.tab{white-space:nowrap}
  .cards{grid-template-columns:1fr}.card,.card:nth-child(6n+1){grid-column:auto}.card:nth-child(6n+1) .thumb,.thumb{height:250px}
  .offer{grid-template-columns:1fr}.price{text-align:left;margin-top:3px}
  .promise-grid{grid-template-columns:1fr}.promise-card{min-height:280px}.promise-card h3{margin-top:70px}
}
@media(max-width:480px){.grid{grid-template-columns:1fr}.field.col3,.field.col6{grid-column:auto}.hero-metrics{grid-template-columns:1fr 1fr}.collection-brand{margin-bottom:24px}}


/* =========================================================
   B-011.24 LUXURY EDITORIAL EXTENSION
   ========================================================= */
.luxury-progress{
  position:fixed;left:0;top:0;z-index:9999;width:100%;height:2px;pointer-events:none;
  background:rgba(255,255,255,.10)
}
.luxury-progress span{
  display:block;width:0;height:100%;background:linear-gradient(90deg,var(--sk-aqua),var(--sk-champagne));
  box-shadow:0 0 14px rgba(95,199,207,.45);transform-origin:left center
}
.collection-marquee{
  position:relative;z-index:3;overflow:hidden;background:#03111f;color:#dce9f4;border-top:1px solid rgba(255,255,255,.08);border-bottom:1px solid rgba(255,255,255,.08)
}
.marquee-track{
  width:max-content;display:flex;align-items:center;gap:30px;padding:15px 0;
  animation:collectionMarquee 34s linear infinite
}
.marquee-track span{font-size:8px;font-weight:800;letter-spacing:.22em;text-transform:uppercase;white-space:nowrap}
.marquee-track b{font-size:9px;color:var(--sk-champagne);font-weight:500}
@keyframes collectionMarquee{to{transform:translateX(-50%)}}

.manifesto-section{
  position:relative;overflow:hidden;padding:118px 0 104px;background:
    radial-gradient(circle at 92% 20%,rgba(95,199,207,.16),transparent 26%),
    linear-gradient(135deg,#fbfaf6 0%,#f3f6f8 54%,#e9eef8 100%)
}
.manifesto-section::before{
  content:"";position:absolute;width:540px;height:540px;right:-220px;bottom:-270px;border-radius:50%;
  border:1px solid rgba(2,46,100,.10);box-shadow:0 0 0 75px rgba(2,46,100,.018),0 0 0 150px rgba(2,46,100,.012)
}
.manifesto-grid{position:relative;display:grid;grid-template-columns:minmax(0,1.2fr) minmax(330px,.65fr);gap:84px;align-items:end}
.manifesto-copy h2{
  max-width:900px;margin:14px 0 28px;color:var(--sk-navy);font-size:clamp(48px,7vw,88px);font-weight:400;line-height:.93;letter-spacing:-.072em;text-wrap:balance
}
.manifesto-copy h2 strong{font-weight:650;color:var(--sk-deep-teal)}
.manifesto-copy p{max-width:720px;color:#526274;font-size:14px;line-height:1.9}
.manifesto-note{
  position:relative;padding:34px 32px 32px;border:1px solid rgba(2,46,100,.10);border-radius:28px;background:rgba(255,255,255,.72);
  box-shadow:0 24px 60px rgba(2,46,100,.10);backdrop-filter:blur(18px)
}
.manifesto-note::before{content:"“";position:absolute;right:24px;top:4px;color:rgba(209,188,152,.48);font-size:96px;font-weight:300;line-height:1}
.manifesto-note strong{display:block;max-width:340px;color:var(--sk-navy);font-size:24px;font-weight:560;line-height:1.22;letter-spacing:-.04em}
.manifesto-note p{margin-top:16px;color:var(--sk-muted);font-size:10.5px;line-height:1.75}
.manifesto-signature{display:flex;align-items:center;gap:12px;margin-top:24px;color:var(--sk-blue);font-size:8px;font-weight:800;letter-spacing:.15em;text-transform:uppercase}
.manifesto-signature:before{content:"";width:34px;height:1px;background:var(--sk-champagne)}

.value-section{background:#fff}
.value-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
.value-card{
  position:relative;overflow:hidden;min-height:340px;padding:27px 24px;border-radius:26px;border:1px solid rgba(2,46,100,.08);
  display:flex;flex-direction:column;justify-content:space-between;box-shadow:0 13px 34px rgba(2,46,100,.06);transition:transform .34s var(--ease),box-shadow .34s ease
}
.value-card:nth-child(1){background:#fff}
.value-card:nth-child(2){background:#d9f1f1}
.value-card:nth-child(3){background:#f2e9dc}
.value-card:nth-child(4){background:linear-gradient(145deg,#022e64,#0b5c85);color:#fff}
.value-card:hover{transform:translateY(-7px);box-shadow:0 27px 56px rgba(2,46,100,.14)}
.value-card::after{content:"";position:absolute;width:180px;height:180px;right:-90px;top:-95px;border-radius:50%;border:1px solid currentColor;opacity:.08}
.value-index{font-size:8px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;opacity:.56}
.value-symbol{font-size:28px;font-weight:300;line-height:1;color:var(--sk-champagne)}
.value-card h3{font-size:25px;font-weight:560;letter-spacing:-.048em;line-height:1.04;color:var(--sk-navy);margin:15px 0 10px}
.value-card:nth-child(4) h3{color:#fff}
.value-card p{font-size:10.5px;line-height:1.75;color:#647386}
.value-card:nth-child(4) p{color:#c5d7e5}

.collection-quote{
  position:relative;overflow:hidden;padding:84px 0;background:linear-gradient(110deg,#173747,#022e64 62%,#0b5c85);color:#fff
}
.collection-quote::before{
  content:"";position:absolute;inset:0;pointer-events:none;background:
    radial-gradient(circle at 84% 10%,rgba(95,199,207,.22),transparent 28%),
    linear-gradient(90deg,transparent 0 49.8%,rgba(255,255,255,.04) 50%,transparent 50.2%)
}
.quote-inner{position:relative;display:grid;grid-template-columns:.38fr 1fr;gap:54px;align-items:start}
.quote-mark{font-size:11px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:var(--sk-champagne)}
.quote-copy{max-width:940px;font-size:clamp(34px,5.7vw,70px);font-weight:400;line-height:.98;letter-spacing:-.064em;text-wrap:balance}
.quote-copy em{font-style:normal;color:#bfe8ea}
.quote-sub{max-width:600px;margin-top:24px;color:#c5d5e4;font-size:11px;line-height:1.8}

.story-section{background:#071a2f;color:#fff;overflow:hidden}
.story-section .section-head h2{color:#fff}.story-section .copy{color:#b8cad9}.story-section .eyebrow{color:#bfe8ea}
.story-rail{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(300px,36vw);gap:14px;overflow-x:auto;padding:2px 2px 20px;scroll-snap-type:x mandatory;scrollbar-width:none}
.story-rail::-webkit-scrollbar{display:none}
.story-card{
  position:relative;min-height:520px;border-radius:28px;overflow:hidden;scroll-snap-align:start;background:linear-gradient(145deg,#0b3a7a,#173747);
  border:1px solid rgba(255,255,255,.10);box-shadow:0 22px 56px rgba(0,0,0,.22);cursor:pointer;isolation:isolate
}
.story-image{position:absolute;inset:0;background:linear-gradient(145deg,#0b3a7a,#173747) center/cover no-repeat;transition:transform .85s var(--ease)}
.story-card:hover .story-image{transform:scale(1.045)}
.story-card::after{content:"";position:absolute;inset:0;z-index:1;background:linear-gradient(180deg,rgba(3,17,31,.03) 12%,rgba(3,17,31,.18) 44%,rgba(3,17,31,.92) 100%)}
.story-content{position:absolute;left:25px;right:25px;bottom:25px;z-index:2}
.story-label{font-size:8px;font-weight:800;letter-spacing:.15em;text-transform:uppercase;color:#c6e8ea}
.story-card h3{margin:8px 0 10px;font-size:32px;line-height:1;letter-spacing:-.052em;font-weight:560}
.story-card p{max-width:480px;font-size:10px;line-height:1.68;color:#c9d8e6}
.story-arrow{display:inline-flex;align-items:center;gap:8px;margin-top:15px;color:#fff;font-size:8px;font-weight:800;letter-spacing:.11em;text-transform:uppercase}
.story-arrow:after{content:"→";font-size:14px;color:var(--sk-aqua)}
.story-empty{grid-column:1/-1;padding:36px;border:1px dashed rgba(255,255,255,.18);border-radius:24px;color:#b8cad9;background:rgba(255,255,255,.04)}
.story-nav{display:flex;justify-content:flex-end;gap:8px;margin-top:8px}
.story-nav button{width:42px;height:42px;border-radius:50%;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);color:#fff;backdrop-filter:blur(12px);transition:background .2s ease,transform .2s ease}
.story-nav button:hover{background:rgba(95,199,207,.16);transform:translateY(-2px)}

.experience-section{background:linear-gradient(180deg,#fff,#f8fafc)}
.experience-shell{display:grid;grid-template-columns:minmax(0,.78fr) minmax(0,1.22fr);gap:16px}
.experience-intro{
  min-height:520px;border-radius:30px;padding:34px;background:linear-gradient(145deg,#f2e9dc,#fbfaf6);border:1px solid rgba(2,46,100,.08);
  display:flex;flex-direction:column;justify-content:space-between;position:relative;overflow:hidden
}
.experience-intro::before{content:"";position:absolute;width:380px;height:380px;right:-210px;top:-180px;border-radius:50%;border:1px solid rgba(2,46,100,.10);box-shadow:0 0 0 54px rgba(2,46,100,.02),0 0 0 108px rgba(2,46,100,.015)}
.experience-intro h3{position:relative;max-width:460px;font-size:clamp(34px,4vw,52px);font-weight:500;line-height:.98;letter-spacing:-.06em;color:#3c2f20}
.experience-intro p{position:relative;max-width:480px;font-size:11px;line-height:1.8;color:#6d6254}
.experience-list{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.experience-item{min-height:254px;border-radius:26px;padding:24px;border:1px solid rgba(2,46,100,.08);background:#fff;display:flex;flex-direction:column;justify-content:space-between;box-shadow:0 12px 30px rgba(2,46,100,.05)}
.experience-item:nth-child(2){background:#e9eef8}.experience-item:nth-child(3){background:#d9f1f1}.experience-item:nth-child(4){background:linear-gradient(145deg,#022e64,#0b5c85);color:#fff}
.experience-icon{width:44px;height:44px;border-radius:50%;display:grid;place-items:center;border:1px solid rgba(2,46,100,.12);font-size:16px;color:var(--sk-blue);background:rgba(255,255,255,.4)}
.experience-item:nth-child(4) .experience-icon{border-color:rgba(255,255,255,.2);color:var(--sk-aqua);background:rgba(255,255,255,.07)}
.experience-item h4{font-size:20px;font-weight:560;letter-spacing:-.04em;color:var(--sk-navy);margin:18px 0 8px}.experience-item:nth-child(4) h4{color:#fff}
.experience-item p{font-size:10px;line-height:1.7;color:#647386}.experience-item:nth-child(4) p{color:#c7d7e5}

.journey-section{background:#fbfaf6}
.journey-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;border:1px solid rgba(2,46,100,.10);border-radius:28px;overflow:hidden;background:rgba(2,46,100,.10)}
.journey-step{position:relative;min-height:330px;background:#fff;padding:30px;display:flex;flex-direction:column;justify-content:space-between}
.journey-step:nth-child(2){background:#f3f6f8}.journey-step:nth-child(3){background:#e9eef8}
.journey-no{font-size:9px;font-weight:800;letter-spacing:.13em;text-transform:uppercase;color:var(--sk-blue)}
.journey-step h3{font-size:29px;font-weight:550;line-height:1;letter-spacing:-.05em;color:var(--sk-navy);margin:60px 0 10px}
.journey-step p{font-size:10.5px;line-height:1.75;color:#647386}
.journey-cta{display:flex;justify-content:center;margin-top:28px}

.closing-signature{
  position:relative;margin-top:34px;padding:42px;border:1px solid rgba(255,255,255,.12);border-radius:30px;background:rgba(255,255,255,.055);overflow:hidden
}
.closing-signature::before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 86% 10%,rgba(95,199,207,.16),transparent 34%);pointer-events:none}
.closing-signature-inner{position:relative;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:32px;align-items:end}
.closing-signature h3{max-width:760px;font-size:clamp(36px,5vw,62px);font-weight:450;line-height:.98;letter-spacing:-.064em}
.closing-signature p{max-width:640px;margin-top:16px;color:#c5d5e4;font-size:11px;line-height:1.75}
.closing-signature .btn{min-width:220px;background:#d9f1f1;color:#022e64}


@media(max-width:1080px){
  .hero-inner{grid-template-columns:1fr;align-items:center;padding-bottom:185px}
  .hero-aside{max-width:650px;min-height:auto}
  .hero-scroll{display:none}
  .hero-metrics{width:calc(100% - 40px)}
}
@media(max-width:760px){
  .hero{min-height:860px}
  .hero-inner{padding:52px 0 210px;gap:30px}
  .collection-brand{min-height:60px;margin-bottom:24px}
  .collection-brand img{max-height:62px}
  .hero h1{font-size:clamp(52px,15vw,76px)}
  .hero-lede{font-size:14px;line-height:1.7}
  .hero-aside{padding:22px;border-radius:22px}
  .hero-aside-label{margin-bottom:24px}
  .hero-aside h2{font-size:28px}
  .hero-metrics{
    bottom:30px;
    width:calc(100% - 24px);
    grid-template-columns:repeat(2,1fr);
  }
  .hero-metric:nth-child(2){border-right:0}
  .hero-metric:nth-child(-n+2){border-bottom:1px solid rgba(255,255,255,.12)}
  .hero-metric{min-height:64px;padding:12px 14px}
  .hero-metric strong{font-size:19px}
}
@media(prefers-reduced-motion:reduce){
  .hero-media,.hero-aside::after{animation:none!important}
}

@media(max-width:1080px){
  .manifesto-grid,.experience-shell{grid-template-columns:1fr}.manifesto-grid{gap:38px}.manifesto-note{max-width:680px}
  .value-grid{grid-template-columns:1fr 1fr}.story-rail{grid-auto-columns:minmax(310px,52vw)}
  .closing-signature-inner{grid-template-columns:1fr;align-items:start}
}
@media(max-width:760px){
  .manifesto-section{padding:82px 0 72px}.manifesto-copy h2{font-size:48px}.manifesto-grid{gap:30px}
  .value-grid{grid-template-columns:1fr}.value-card{min-height:270px}
  .quote-inner{grid-template-columns:1fr;gap:20px}.quote-copy{font-size:42px}
  .story-rail{grid-auto-columns:86vw}.story-card{min-height:470px}.story-nav{justify-content:flex-start}
  .experience-list{grid-template-columns:1fr}.experience-intro{min-height:420px}.experience-item{min-height:220px}
  .journey-grid{grid-template-columns:1fr}.journey-step{min-height:250px}.journey-step h3{margin-top:44px}
  .closing-signature{padding:28px 22px}.closing-signature .btn{width:100%}
}

@media(prefers-reduced-motion:reduce){
  *,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important;scroll-behavior:auto!important}
  .hero-route{display:none}.reveal{opacity:1!important;transform:none!important}
}
</style>
</head>
<body>
<div class="luxury-progress" aria-hidden="true"><span id="luxuryProgressBar"></span></div>

<div id="collectionLive" class="visually-hidden" aria-live="polite"></div>
<header class="hero" id="hero">
  <div class="hero-media" aria-hidden="true"></div>
  <div class="hero-veil" aria-hidden="true"></div>
  <div class="hero-grain" aria-hidden="true"></div>
  <div class="hero-rule" aria-hidden="true"></div>

  <div class="wrap hero-inner">
    <div class="hero-copy">
      <div class="collection-brand">
        <img id="collectionLogo" alt="SKANDI Collection" hidden>
        <div id="collectionLogoFallback" class="collection-wordmark">SKANDI <span>Collection</span></div>
      </div>

      <div class="hero-kicker">The places we would choose ourselves</div>
      <h1>Stay somewhere <em>worth remembering.</em></h1>
      <p class="hero-lede">A handpicked edit of hotels, destinations and experiences with character, atmosphere and a genuine sense of place. The Collection is where SKANDI puts forward the choices we believe are worth making.</p>

      <div class="hero-actions">
        <button class="btn aqua" type="button" id="heroExploreBtn">Enter the Collection <span class="icon-arrow">→</span></button>
        <button class="btn secondary" type="button" id="heroSearchBtn">Plan with SKANDI</button>
      </div>
    </div>

    <aside class="hero-aside">
      <div class="hero-aside-label">The Collection Edit</div>
      <h2>Not simply somewhere to stay.</h2>
      <p>We look for the details that change how a place feels: identity, setting, design and the moments that stay with you long after the journey.</p>

      <div class="hero-values">
        <div class="hero-value"><span>01</span><strong>Places with a point of view</strong></div>
        <div class="hero-value"><span>02</span><strong>Hotels with atmosphere and identity</strong></div>
        <div class="hero-value"><span>03</span><strong>Journeys chosen to be remembered</strong></div>
      </div>
    </aside>
  </div>

  <div id="heroMetrics" class="hero-metrics">
    <div class="hero-metric"><strong>—</strong><span>Selections</span></div>
    <div class="hero-metric"><strong>—</strong><span>Destinations</span></div>
    <div class="hero-metric"><strong>—</strong><span>Hotels</span></div>
    <div class="hero-metric"><strong>—</strong><span>Experiences</span></div>
  </div>

  <div class="hero-scroll">Discover</div>
</header>

<section class="search" id="collectionSearch">
  <div class="wrap">
    <div class="search-card">
      <div class="search-head">
        <div><div class="eyebrow">Collection concierge</div><h2>Make it your journey.</h2></div>
        <p>Start with your route and dates. We will search the live SKANDI booking service for Collection journey options.</p>
      </div>
      <div class="grid">
        <div class="field col2"><label for="origin">From</label><input id="origin" maxlength="3" placeholder="CPH" autocomplete="off"/></div>
        <div class="field col2"><label for="destination">To</label><input id="destination" maxlength="3" placeholder="PMI" autocomplete="off"/></div>
        <div class="field col2"><label for="departureDate">Depart</label><input id="departureDate" type="date"/></div>
        <div class="field col2"><label for="returnDate">Return</label><input id="returnDate" type="date"/></div>
        <div class="field col2"><label for="adults">Adults</label><select id="adults"><option>1</option><option selected>2</option><option>3</option><option>4</option><option>5</option><option>6</option></select></div>
        <div class="field col2"><label for="currency">Currency</label><select id="currency"><option>USD</option><option>EUR</option><option>SEK</option><option>NOK</option><option>DKK</option><option>GBP</option></select></div>
        <div class="field col3"><label>&nbsp;</label><button class="btn dark" id="searchBtn" type="button">Find Collection journeys</button></div>
        <div class="field col3"><label>&nbsp;</label><button class="btn secondary" id="clearBtn" type="button">Clear results</button></div>
        <div class="field col6"><label for="collectionFilter">Browse by</label><select id="collectionFilter"><option value="all">All Collection items</option><option value="destinations">Destinations</option><option value="hotels">Hotels</option><option value="tours">Tours &amp; Activities</option><option value="airlines">Airlines</option><option value="airports">Airports</option><option value="partners">SKANDI Partners</option></select></div>
      </div>
      <div class="hint"><strong>Collection journeys.</strong> Search uses the existing SKANDI booking flow. Availability and prices are checked live when you search.</div>
      <div class="package-status" id="searchStatus">Enter route and dates when you are ready to plan a Collection journey.</div>
      <div class="results" id="offers"></div>
    </div>
  </div>
</section>

<div class="collection-marquee" aria-hidden="true">
  <div class="marquee-track">
    <span>SKANDI COLLECTION</span><b>◆</b><span>HANDPICKED HOTELS</span><b>◆</b><span>DISTINCTIVE DESTINATIONS</span><b>◆</b><span>CONSIDERED EXPERIENCES</span><b>◆</b><span>SIGNATURE TRAVELS, UNFORGETTABLE MOMENTS</span><b>◆</b>
    <span>SKANDI COLLECTION</span><b>◆</b><span>HANDPICKED HOTELS</span><b>◆</b><span>DISTINCTIVE DESTINATIONS</span><b>◆</b><span>CONSIDERED EXPERIENCES</span><b>◆</b><span>SIGNATURE TRAVELS, UNFORGETTABLE MOMENTS</span><b>◆</b>
  </div>
</div>

<main>
  <section class="manifesto-section">
    <div class="wrap manifesto-grid">
      <div class="manifesto-copy reveal">
        <div class="eyebrow gold">Why the Collection exists</div>
        <h2>The luxury is not <strong>more choice.</strong> It is knowing what is worth choosing.</h2>
        <p>SKANDI Collection brings together the hotels, destinations and experiences we want to put forward with confidence. It is a more considered way to discover a trip: fewer distractions, a stronger point of view and places selected because they can become part of the memory, not simply somewhere to stay.</p>
      </div>
      <aside class="manifesto-note reveal">
        <strong>Some places are more than a stop on the itinerary. They become the reason you remember the journey.</strong>
        <p>That is the idea behind the Collection: to make the search feel more inspiring, more focused and more special from the first click.</p>
        <div class="manifesto-signature">The SKANDI point of view</div>
      </aside>
    </div>
  </section>

  <section class="section value-section">
    <div class="wrap">
      <div class="section-head reveal">
        <div><div class="eyebrow">A better kind of choice</div><h2>What makes a Collection journey feel different.</h2></div>
        <p class="copy">Collection is not a separate trip type. It is SKANDI's curated layer across the travel experience, designed to help the most distinctive choices stand out.</p>
      </div>
      <div class="value-grid">
        <article class="value-card fx-card reveal"><div><div class="value-index">01 / Curated</div><div class="value-symbol">◇</div></div><div><h3>Chosen, not crowded.</h3><p>A focused selection helps you spend less time sorting through sameness and more time discovering places with genuine character.</p></div></article>
        <article class="value-card fx-card reveal"><div><div class="value-index">02 / Place</div><div class="value-symbol">⌖</div></div><div><h3>A stronger sense of place.</h3><p>The best stays do more than give you a room. They can shape how a city, coast or destination feels from the moment you arrive.</p></div></article>
        <article class="value-card fx-card reveal"><div><div class="value-index">03 / Character</div><div class="value-symbol">✦</div></div><div><h3>Worth remembering.</h3><p>Design, atmosphere, setting and personality matter. Collection is where those qualities are given room to lead the journey.</p></div></article>
        <article class="value-card fx-card reveal"><div><div class="value-index">04 / Journey</div><div class="value-symbol">→</div></div><div><h3>Part of the whole trip.</h3><p>Hotels, destinations and experiences can sit together in one curated view, making it easier to imagine the journey as a complete story.</p></div></article>
      </div>
    </div>
  </section>

  <section class="collection-quote">
    <div class="wrap quote-inner reveal">
      <div class="quote-mark">SKANDI Collection</div>
      <div>
        <div class="quote-copy">Travel can be comfortable. It can be beautiful. Or it can feel <em>chosen for a reason.</em></div>
        <p class="quote-sub">Collection is our way of highlighting the places and experiences that deserve a little more attention when you are deciding where to go next.</p>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="wrap">
      <div class="section-head reveal">
        <div><div class="eyebrow gold">The Collection standard</div><h2>Three ways to discover something special.</h2></div>
        <p class="copy">The Collection is organized into Select, Signature and Excelsior so you can move from beautifully considered choices to our most elevated travel experiences.</p>
      </div>
      <div class="philosophy-grid">
        <article class="philosophy-card fx-card reveal"><div class="philosophy-no">01 / Select</div><div><div class="philosophy-line"></div><h3>Select</h3><p>Thoughtful places and experiences chosen for travelers who value design, setting and a journey that feels considered from the start.</p></div></article>
        <article class="philosophy-card fx-card reveal"><div class="philosophy-no">02 / Signature</div><div><div class="philosophy-line"></div><h3>Signature</h3><p>Distinctive stays and destinations that express the SKANDI point of view most clearly, with character, atmosphere and a memorable sense of place.</p></div></article>
        <article class="philosophy-card fx-card reveal"><div class="philosophy-no">03 / Excelsior</div><div><div class="philosophy-line"></div><h3>Excelsior</h3><p>Our most elevated Collection tier for exceptional journeys where the stay, setting and experience are intended to feel genuinely special.</p></div></article>
      </div>
    </div>
  </section>

  <section class="section soft" id="collectionSpotlight">
    <div class="wrap">
      <div class="section-head reveal">
        <div><div class="eyebrow">Featured from the Collection</div><h2>Places that set the tone for the trip.</h2></div>
        <p class="copy">A live edit of Collection selections. As new customer-visible hotels, destinations and experiences are published, they can appear here automatically.</p>
      </div>
      <div id="spotlightGrid" class="spotlight-grid"><div class="spotlight-empty">Loading the Collection edit…</div></div>
    </div>
  </section>

  <section class="section story-section" id="collectionStories">
    <div class="wrap">
      <div class="section-head reveal">
        <div><div class="eyebrow">The Collection Edit</div><h2>Stay a little longer in the inspiration.</h2></div>
        <p class="copy">A wider look at published Collection selections, presented as an editorial rail so the journey starts with atmosphere rather than a list.</p>
      </div>
      <div id="storyRail" class="story-rail"><div class="story-empty">Loading more from the Collection…</div></div>
      <div class="story-nav" aria-label="Collection stories">
        <button type="button" id="storyPrev" aria-label="Previous Collection stories">←</button>
        <button type="button" id="storyNext" aria-label="Next Collection stories">→</button>
      </div>
    </div>
  </section>

  <section class="section experience-section">
    <div class="wrap">
      <div class="section-head reveal">
        <div><div class="eyebrow gold">Why choose Collection</div><h2>For trips where the details matter more.</h2></div>
        <p class="copy">Collection works best when you want the hotel, destination or experience to contribute something to the journey, not simply fill a space in the itinerary.</p>
      </div>
      <div class="experience-shell">
        <article class="experience-intro fx-card reveal">
          <div class="eyebrow gold">A more considered escape</div>
          <div><h3>Choose it when you want the stay to feel like part of the destination.</h3><p>Whether the trip is short or long, Collection helps bring distinctive choices forward so the experience can begin before you arrive.</p></div>
        </article>
        <div class="experience-list">
          <article class="experience-item fx-card reveal"><div class="experience-icon">01</div><div><h4>When atmosphere matters.</h4><p>For journeys where design, setting and mood are part of what you are traveling for.</p></div></article>
          <article class="experience-item fx-card reveal"><div class="experience-icon">02</div><div><h4>When the hotel is part of the plan.</h4><p>For stays you want to enjoy, return to and remember, rather than simply use as a base.</p></div></article>
          <article class="experience-item fx-card reveal"><div class="experience-icon">03</div><div><h4>When you want a clearer edit.</h4><p>For moments when a strong shortlist feels better than scrolling through an endless catalogue.</p></div></article>
          <article class="experience-item fx-card reveal"><div class="experience-icon">04</div><div><h4>When the trip should feel special.</h4><p>For the journeys you want to look forward to, talk about and remember long after you return.</p></div></article>
        </div>
      </div>
    </div>
  </section>

  <section class="section soft" id="collectionDirectory">
    <div class="wrap">
      <div class="section-head reveal">
        <div><div class="eyebrow gold">Explore the portfolio</div><h2>Find your Collection.</h2></div>
        <p class="copy">Browse the current published Collection by tier or travel type. Every item below comes from the customer-facing Collection catalogue.</p>
      </div>
      <div class="filters-shell">
        <div class="filters-line">
          <div><div class="tabs" id="tierTabs"></div><div class="tabs" id="tabs"></div></div>
          <div class="filter-select">
            <label class="visually-hidden" for="collectionFilterMirror">Collection type</label>
            <select id="collectionFilterMirror" aria-label="Collection type">
              <option value="all">All Collection items</option><option value="destinations">Destinations</option><option value="hotels">Hotels</option><option value="tours">Tours &amp; Activities</option><option value="airlines">Airlines</option><option value="airports">Airports</option><option value="partners">SKANDI Partners</option>
            </select>
          </div>
        </div>
      </div>
      <div class="notice accent" id="collectionStatus">Loading the SKANDI Collection…</div>
      <div class="cards" id="cards" style="margin-top:18px"></div>
    </div>
  </section>

  <section class="section journey-section">
    <div class="wrap">
      <div class="section-head reveal">
        <div><div class="eyebrow">From inspiration to itinerary</div><h2>Discover first. Decide with confidence.</h2></div>
        <p class="copy">The Collection is designed to make discovery feel editorial while keeping the path into the existing SKANDI booking journey straightforward.</p>
      </div>
      <div class="journey-grid">
        <article class="journey-step reveal"><div class="journey-no">01 / Discover</div><div><h3>Start with what draws you in.</h3><p>Explore Collection hotels, destinations and experiences as a curated edit rather than a conventional search result.</p></div></article>
        <article class="journey-step reveal"><div class="journey-no">02 / Shape</div><div><h3>Turn inspiration into a journey.</h3><p>Use your route, dates and party details to search live travel options around the Collection choice that inspired you.</p></div></article>
        <article class="journey-step reveal"><div class="journey-no">03 / Book</div><div><h3>Continue with SKANDI.</h3><p>Availability, pricing and checkout remain in the established SKANDI booking flow, so the editorial experience connects directly with the real trip.</p></div></article>
      </div>
      <div class="journey-cta"><button class="btn dark" id="journeySearchBtn" type="button">Plan a Collection journey <span class="icon-arrow">→</span></button></div>
    </div>
  </section>

  <section class="section dark">
    <div class="wrap">
      <div class="section-head reveal">
        <div><div class="eyebrow light">Selected, not simply listed</div><h2>The trip should feel as considered as the destination.</h2></div>
        <p class="copy">The SKANDI Collection is our curated layer across the wider travel portfolio, bringing the choices we want to place front and center into one signature experience.</p>
      </div>
      <div class="promise-grid">
        <article class="promise-card reveal"><div class="promise-mark">SKANDI Collection</div><h3>Curated around the experience.</h3><p>Hotels, destinations and experiences sit together so the inspiration and the journey can feel connected rather than fragmented.</p></article>
        <article class="promise-card reveal"><div class="promise-mark">Your journey</div><h3>Discover first. Plan when it feels right.</h3><p>Explore the Collection, then use the concierge search above when you are ready to turn a place or idea into a live itinerary.</p></article>
      </div>
      <div class="closing-signature reveal">
        <div class="closing-signature-inner">
          <div>
            <div class="eyebrow gold">Signature Travels, Unforgettable Moments.</div>
            <h3>Choose the place you will still be thinking about after you come home.</h3>
            <p>The SKANDI Collection is there for the trips where choosing well matters. Explore the current edit, find the place that feels right, then build the real journey around it.</p>
          </div>
          <button class="btn" type="button" id="finalSearchBtn">Start your Collection journey <span class="icon-arrow">→</span></button>
        </div>
      </div>
    </div>
  </section>
</main>
<div class="toast" id="toast"></div>

<script>
(function(){
  const SOURCE="SKANDI_SIGNATURE_COLLECTION";
  const PARENT="SKANDI_WIX_PARENT";
  const $=id=>document.getElementById(id);

  let DATA={items:[],collectionItems:[],partners:[],tiers:{},counts:{},settings:{}};
  let loaded=false;
  let activeTier="all";
  let activeType="all";
  let MASTER={brand:{},assets:{},routes:{}};

  function post(type,payload={}){
    window.parent.postMessage({source:SOURCE,type,payload,timestamp:new Date().toISOString()},"*");
  }
  function esc(v){
    return String(v??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;","\"":"&quot;"}[c]));
  }
  function toast(m){
    const t=$("toast");
    t.textContent=m;
    t.style.display="block";
    setTimeout(()=>t.style.display="none",2600);
  }
  function todayPlus(days){
    const d=new Date();
    d.setDate(d.getDate()+days);
    return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10);
  }
  function cleanIata(v){
    return String(v||"").trim().toUpperCase().replace(/[^A-Z]/g,"").slice(0,3);
  }
  function currentLanguage(){ return "EN"; }
  function safeAssetUrl(value){
    try{const u=new URL(String(value||"").trim());return u.protocol==="https:"?u.href:""}catch(_){return""}
  }
  function applyCollectionLogo(value){
    const logo=$("collectionLogo"),fallback=$("collectionLogoFallback"),url=safeAssetUrl(value);
    if(!logo||!fallback)return;
    if(!url){logo.hidden=true;fallback.hidden=false;return}
    logo.onload=()=>{logo.hidden=false;fallback.hidden=true};
    logo.onerror=()=>{logo.hidden=true;fallback.hidden=false};
    logo.src=url;
  }
  function applyMasterPayload(payload={}){
    MASTER={...MASTER,...payload,brand:payload.brand||MASTER.brand||{},routes:{...(MASTER.routes||{}),...(payload.routes||{})}};
    const logos=payload?.brand?.assets?.logos||payload?.assets?.logos||{};
    applyCollectionLogo(logos.signatureCollection);
  }
  function bindPathActions(root=document){
    root.querySelectorAll?.("[data-path]").forEach(btn=>{
      if(btn.dataset.boundPath==="1")return;
      btn.dataset.boundPath="1";
      btn.addEventListener("click",()=>post("COLLECTION_NAVIGATE",{path:btn.dataset.path}));
    });
  }
  function itemLocation(item){return [item?.city,item?.country].filter(Boolean).join(", ")}
  function itemImage(item){return safeAssetUrl(item?.imageUrl||item?.heroImageUrl||item?.image||"")}
  function countType(type){return (DATA.items||[]).filter(item=>item.type===type).length}
  function renderHeroMetrics(){
    const host=$("heroMetrics");if(!host)return;
    const experienceCount=["tours","activities","tickets","transfers"].reduce((n,type)=>n+countType(type),0);
    const metrics=[[(DATA.items||[]).length,"Selections"],[countType("destinations"),"Destinations"],[countType("hotels"),"Hotels"],[experienceCount,"Experiences"]];
    host.innerHTML=metrics.map(([value,label])=>`<div class="hero-metric"><strong>${esc(value||"—")}</strong><span>${esc(label)}</span></div>`).join("");
  }
  function spotlightItems(){
    const priority={hotels:1,destinations:2,tours:3,activities:4,transfers:5,airlines:6,airports:7,partners:8};
    return (DATA.items||[]).slice().sort((a,b)=>(priority[a.type]||99)-(priority[b.type]||99)).filter(item=>item.title).slice(0,4);
  }
  function renderSpotlight(){
    const host=$("spotlightGrid");if(!host)return;
    const items=spotlightItems();
    if(!loaded){host.innerHTML=`<div class="spotlight-empty">Loading the Collection edit…</div>`;return}
    if(!items.length){host.innerHTML=`<div class="spotlight-empty">The Collection edit is being refreshed. Browse the portfolio below for currently published selections.</div>`;return}
    host.innerHTML=items.map(item=>{
      const image=itemImage(item),location=itemLocation(item),path=item.path?`data-path="${esc(item.path)}"`:"",tier=tierLabel(itemTier(item));
      return `<article class="spotlight-card fx-card reveal" ${path} tabindex="${item.path?"0":"-1"}">
        <div class="spotlight-image"${image?` style="background-image:url('${esc(image)}')"`:""}></div>
        <div class="spotlight-copy"><div class="spotlight-kicker">${esc([tier,item.typeLabel||typeLabel(item.type)].filter(Boolean).join(" · "))}</div><h3>${esc(item.title)}</h3><p>${esc(item.summary||location||"Selected by SKANDI.")}</p></div>
      </article>`;
    }).join("");
    host.querySelectorAll("[data-path]").forEach(card=>{
      card.addEventListener("click",()=>post("COLLECTION_NAVIGATE",{path:card.dataset.path}));
      card.addEventListener("keydown",event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();post("COLLECTION_NAVIGATE",{path:card.dataset.path})}});
    });
    enhanceDynamic(host);
  }
  function storyItems(){
    const all=(DATA.items||[]).filter(item=>item&&item.title);
    const featured=new Set(spotlightItems().map(item=>String(item.id||item.code||item.path||item.title)));
    const rest=all.filter(item=>!featured.has(String(item.id||item.code||item.path||item.title)));
    return (rest.length?rest:all).slice(0,8);
  }
  function renderStories(){
    const host=$("storyRail");
    if(!host)return;
    if(!loaded){host.innerHTML=`<div class="story-empty">Loading more from the Collection…</div>`;return}
    const items=storyItems();
    if(!items.length){host.innerHTML=`<div class="story-empty">More Collection stories will appear here as new selections are published.</div>`;return}
    host.innerHTML=items.map(item=>{
      const image=itemImage(item),location=itemLocation(item),tier=tierLabel(itemTier(item));
      const path=item.path?`data-path="${esc(item.path)}"`:"";
      return `<article class="story-card fx-card reveal" ${path} tabindex="${item.path?"0":"-1"}">
        <div class="story-image"${image?` style="background-image:url('${esc(image)}')"`:""}></div>
        <div class="story-content">
          <div class="story-label">${esc([tier,item.typeLabel||typeLabel(item.type),location].filter(Boolean).join(" · "))}</div>
          <h3>${esc(item.title)}</h3>
          <p>${esc(item.summary||"Part of the current SKANDI Collection edit.")}</p>
          ${item.path?`<span class="story-arrow">Explore the selection</span>`:""}
        </div>
      </article>`;
    }).join("");
    host.querySelectorAll("[data-path]").forEach(card=>{
      card.addEventListener("click",()=>post("COLLECTION_NAVIGATE",{path:card.dataset.path}));
      card.addEventListener("keydown",event=>{
        if(event.key==="Enter"||event.key===" "){event.preventDefault();post("COLLECTION_NAVIGATE",{path:card.dataset.path})}
      });
    });
    enhanceDynamic(host);
  }
  function initialTier(){
    try{
      const tier=new URLSearchParams(location.search).get("tier");
      const normalized=String(tier||"").toUpperCase();
      return ["SELECT","SIGNATURE","EXCELSIOR","PARTNER"].includes(normalized)?normalized.toLowerCase():"all";
    }catch(_){return"all"}
  }
  function typeLabel(type){
    return ({
      all:"All",
      destinations:"Destinations",
      hotels:"Hotels",
      tours:"Tours & Activities",
      airlines:"Airlines",
      airports:"Airports",
      packages:"Packages",
      transfers:"Transfers",
      "car-rental":"Car Rental",
      partners:"SKANDI Partners"
    })[type]||type||"Selected";
  }
  function tierLabel(tier){
    return ({
      SELECT:"Select",
      SIGNATURE:"Signature",
      EXCELSIOR:"Excelsior",
      PARTNER:"SKANDI Partners"
    })[tier]||tier||"Collection";
  }
  function itemTier(item){
    if(item.catalogType==="SKANDI_PARTNER" && !item.tier) return "PARTNER";
    return String(item.tier||"").toUpperCase();
  }
  function visibleItems(){
    return (DATA.items||[]).filter(item=>{
      const tier=itemTier(item);
      const tierOk=activeTier==="all" || tier===activeTier.toUpperCase();
      const typeOk=activeType==="all" ||
        (activeType==="partners" ? item.catalogType==="SKANDI_PARTNER" : item.type===activeType);
      return tierOk && typeOk;
    });
  }
  function renderTierTabs(){
    const items=DATA.items||[];
    const present=new Set(items.map(item=>itemTier(item)).filter(Boolean));
    const defs=[{key:"all",label:"All"}];
    ["SELECT","SIGNATURE","EXCELSIOR","PARTNER"].forEach(tier=>{
      if(present.has(tier)) defs.push({key:tier.toLowerCase(),label:tierLabel(tier)});
    });

    $("tierTabs").innerHTML=defs.map(x=>`<button class="tab ${activeTier===x.key?"active":""}" type="button" data-tier="${x.key}">${esc(x.label)}</button>`).join("");
  }
  function renderTypeTabs(){
    const items=DATA.items||[];
    const present=[...new Set(items.map(x=>x.type).filter(Boolean))];
    if(items.some(x=>x.catalogType==="SKANDI_PARTNER")) present.push("partners");
    const defs=[{key:"all",label:"All types"},...present.filter((x,i,a)=>a.indexOf(x)===i).map(key=>({key,label:typeLabel(key)}))];
    $("tabs").innerHTML=defs.map(x=>`<button class="tab ${activeType===x.key?"active":""}" type="button" data-type="${esc(x.key)}">${esc(x.label)}</button>`).join("");
  }
  function card(item){
    const tier=itemTier(item),tierClass=tier.toLowerCase(),image=itemImage(item),title=String(item.title||"SKANDI Collection").trim();
    const initials=title.split(/\s+/).slice(0,2).map(x=>x[0]||"").join("").toUpperCase();
    const visual=image?`<div class="thumb" style="background-image:url('${esc(image)}')"></div>`:`<div class="thumb"><div class="thumb-fallback"><span>${esc(initials||"SK")}</span></div></div>`;
    const location=itemLocation(item),meta=[location,item.code,item.collectionLabel].filter(Boolean).join(" · ");
    const action=item.path?`<div class="card-actions"><button class="btn secondary" type="button" data-path="${esc(item.path)}">Explore ${esc(item.typeLabel||"selection")} <span class="icon-arrow">→</span></button></div>`:"";
    return `<article class="card fx-card reveal">${visual}<div class="card-body"><div class="tier-line"><span class="tier-tag ${esc(tierClass)}">${esc(tierLabel(tier))}</span><span class="tag">${esc(item.typeLabel||item.type||"Selected")}</span></div><h3>${esc(title)}</h3><p>${esc(item.summary||"Selected by SKANDI.")}</p><div class="meta"><span class="live-dot"></span>${esc(meta||"Part of the SKANDI Collection")}</div>${action}</div></article>`;
  }
  function renderCards(){
    const status=$("collectionStatus");
    if(!loaded){
      status.classList.remove("hidden");
      status.textContent="Loading the SKANDI Collection…";
      $("cards").innerHTML="";
      return;
    }

    const items=visibleItems();
    if(!items.length){
      status.classList.remove("hidden");
      status.textContent=(DATA.items||[]).length
        ?"No Collection selections match these filters."
        :"The Collection is being refreshed. Please check again shortly.";
      $("cards").innerHTML="";
      return;
    }

    status.classList.add("hidden");
    $("cards").innerHTML=items.map(card).join("");
    bindPathActions($("cards"));
    enhanceDynamic($("cards"));
  }
  function render(){
    if(DATA.settings?.heroImageUrl){
      $("hero").style.setProperty("--hero-image",`url("${DATA.settings.heroImageUrl}")`);
    }
    renderTierTabs();
    renderTypeTabs();
    renderCards();
    renderHeroMetrics();
    renderSpotlight();
    renderStories();
    syncFilterControls();
  }
  function values(){
    return{
      origin:cleanIata($("origin").value),
      destination:cleanIata($("destination").value),
      departureDate:$("departureDate").value,
      returnDate:$("returnDate").value,
      adults:Number($("adults").value||2),
      currency:$("currency").value
    };
  }
  function validate(v){
    if(!v.origin||!v.destination)return"Enter origin and destination airport codes.";
    if(!v.departureDate)return"Select departure date.";
    if(v.returnDate&&v.returnDate<v.departureDate)return"Return date must be after departure date.";
    return"";
  }
  function search(){
    const v=values();
    const err=validate(v);
    if(err){toast(err);return}
    $("searchStatus").textContent="Searching Collection journey options…";
    $("offers").innerHTML="";
    post("SIGNATURE_PACKAGE_SEARCH",v);
  }
  function renderOffers(items,meta){
    $("searchStatus").textContent=meta?.message||`${items.length} offers loaded`;
    if(!items.length){
      $("offers").innerHTML=`<div class="notice">No Collection journey options matched this search. Try different dates or airports.</div>`;
      return;
    }
    $("offers").innerHTML=items.map(o=>`<article class="offer">
      <div>
        <h3>${esc(o.title||"SKANDI Collection option")}</h3>
        <p class="copy">${esc(o.route||"")} ${o.carriers?`· ${esc(o.carriers)}`:""} ${o.duration?`· ${esc(o.duration)}`:""}</p>
        <div class="meta">${esc(o.segmentsLabel||"")}</div>
      </div>
      <div class="price">${esc(o.currency||"")} ${esc(o.total||"")}</div>
    </article>`).join("");
  }

  function syncFilterControls(){
    const mirror=$("collectionFilterMirror"),main=$("collectionFilter");
    if(mirror&&main){
      const value=[...mirror.options].some(o=>o.value===activeType)?activeType:"all";
      mirror.value=value;main.value=value;
    }
  }
  const MOTION_REDUCED=window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches===true;
  const FINE_POINTER=window.matchMedia?.("(pointer:fine)")?.matches===true;
  let revealObserver=null;
  if(!MOTION_REDUCED&&"IntersectionObserver" in window){
    revealObserver=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{if(!entry.isIntersecting)return;entry.target.classList.add("visible");revealObserver.unobserve(entry.target)})
    },{threshold:.10,rootMargin:"0px 0px -6% 0px"});
  }
  function enhanceDynamic(root=document){
    const nodes=[];
    if(root?.nodeType===1&&root.matches?.(".reveal"))nodes.push(root);
    root.querySelectorAll?.(".reveal").forEach(node=>nodes.push(node));
    nodes.forEach(node=>{
      if(node.dataset.revealBound==="1")return;
      node.dataset.revealBound="1";
      if(revealObserver)revealObserver.observe(node);else node.classList.add("visible");
    });
  }
  enhanceDynamic(document);
  const dynamicObserver=new MutationObserver(records=>records.forEach(record=>record.addedNodes.forEach(node=>{if(node.nodeType===1)enhanceDynamic(node)})));
  dynamicObserver.observe(document.body,{childList:true,subtree:true});
  const progressBar=$("luxuryProgressBar");
  function updateLuxuryProgress(){
    if(!progressBar)return;
    const max=Math.max(1,document.documentElement.scrollHeight-window.innerHeight);
    const value=Math.min(1,Math.max(0,window.scrollY/max));
    progressBar.style.width=`${(value*100).toFixed(2)}%`;
  }
  updateLuxuryProgress();
  window.addEventListener("scroll",updateLuxuryProgress,{passive:true});
  window.addEventListener("resize",updateLuxuryProgress,{passive:true});
  if(!MOTION_REDUCED&&FINE_POINTER){
let activeCard=null;
    document.addEventListener("pointermove",event=>{
      const card=event.target.closest?.(".fx-card");
      if(activeCard&&activeCard!==card){activeCard.style.transform="";activeCard.style.removeProperty("--fx-x");activeCard.style.removeProperty("--fx-y")}
      activeCard=card||null;if(!card)return;
      const rect=card.getBoundingClientRect();if(!rect.width||!rect.height)return;
      const x=((event.clientX-rect.left)/rect.width)*100,y=((event.clientY-rect.top)/rect.height)*100,ry=(x-50)*.024,rx=(50-y)*.020;
      card.style.setProperty("--fx-x",`${x.toFixed(1)}%`);card.style.setProperty("--fx-y",`${y.toFixed(1)}%`);
      card.style.transform=`perspective(1050px) translateY(-5px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
    },{passive:true});
    document.addEventListener("pointerout",event=>{
      const card=event.target.closest?.(".fx-card");if(!card||card.contains(event.relatedTarget))return;
      card.style.transform="";card.style.removeProperty("--fx-x");card.style.removeProperty("--fx-y");if(activeCard===card)activeCard=null;
    },{passive:true});
  }

  document.addEventListener("click",e=>{
    const tier=e.target.closest("[data-tier]");
    if(tier){
      activeTier=tier.dataset.tier||"all";
      renderTierTabs();
      renderCards();
      return;
    }
    const type=e.target.closest("[data-type]");
    if(type){
      activeType=type.dataset.type||"all";
      $("collectionFilter").value=[...$("collectionFilter").options].some(o=>o.value===activeType)?activeType:"all";
      renderTypeTabs();
      renderCards();
      syncFilterControls();
    }
  });

  $("collectionFilter").onchange=e=>{
    activeType=e.target.value||"all";
    renderTypeTabs();renderCards();syncFilterControls();
  };
  $("collectionFilterMirror").onchange=e=>{
    activeType=e.target.value||"all";
    renderTypeTabs();renderCards();syncFilterControls();
    $("collectionDirectory").scrollIntoView({behavior:MOTION_REDUCED?"auto":"smooth",block:"start"});
  };
  $("heroExploreBtn").onclick=()=>$("collectionSpotlight").scrollIntoView({behavior:MOTION_REDUCED?"auto":"smooth",block:"start"});
  $("heroSearchBtn").onclick=()=>$("collectionSearch").scrollIntoView({behavior:MOTION_REDUCED?"auto":"smooth",block:"start"});
  $("journeySearchBtn").onclick=()=>$("collectionSearch").scrollIntoView({behavior:MOTION_REDUCED?"auto":"smooth",block:"start"});
  $("finalSearchBtn").onclick=()=>$("collectionSearch").scrollIntoView({behavior:MOTION_REDUCED?"auto":"smooth",block:"start"});
  $("storyPrev").onclick=()=>$("storyRail").scrollBy({left:-Math.max(320,$("storyRail").clientWidth*.72),behavior:MOTION_REDUCED?"auto":"smooth"});
  $("storyNext").onclick=()=>$("storyRail").scrollBy({left:Math.max(320,$("storyRail").clientWidth*.72),behavior:MOTION_REDUCED?"auto":"smooth"});
  $("searchBtn").onclick=search;
  $("clearBtn").onclick=()=>{
    $("offers").innerHTML="";
    $("searchStatus").textContent="Enter route and dates when you are ready to plan a Collection journey.";
  };

  window.addEventListener("message",e=>{
    let m=e.data;
    if(typeof m==="string"){try{m=JSON.parse(m)}catch(_){return}}
    if(!m||typeof m!=="object")return;
    if(m.source&&m.source!==PARENT)return;
    const p=m.payload||{};

    if(m.type==="SKANDI_MASTER_CONFIG"){
      applyMasterPayload(p);
      return;
    }
    if(m.type==="SKANDI_MASTER_ASSETS"){
      applyMasterPayload({assets:p});
      return;
    }

    if(m.type==="SIGNATURE_COLLECTION_LOADING"){
      loaded=false;renderCards();renderSpotlight();renderStories();return;
    }
    if(m.type==="SIGNATURE_COLLECTION_DATA"){
      DATA={...DATA,...p,items:Array.isArray(p.items)?p.items:[]};
      loaded=true;
      render();
      return;
    }
    if(m.type==="SIGNATURE_PACKAGE_RESULTS"){
      renderOffers(p.items||[],p.meta||{});
      return;
    }
    if(m.type==="SIGNATURE_COLLECTION_ERROR"){
      loaded=true;
      DATA={...DATA,items:[]};
      const status=$("collectionStatus");
      status.classList.remove("hidden");
      status.textContent=p.message||"The SKANDI Collection is temporarily unavailable.";
      $("cards").innerHTML="";
      renderHeroMetrics();renderSpotlight();renderStories();
      toast(p.message||"The SKANDI Collection is temporarily unavailable.");
    }
  });

  activeTier=initialTier();
  $("departureDate").value=todayPlus(30);
  $("returnDate").value=todayPlus(37);
  render();
  syncFilterControls();
  post("MASTER_CONFIG_REQUEST",{context:"skandi-collection"});
  post("MASTER_ASSETS_REQUEST",{context:"skandi-collection"});
  post("SIGNATURE_COLLECTION_READY",{language:currentLanguage()});
  window.addEventListener("pagehide",()=>{dynamicObserver.disconnect();revealObserver?.disconnect?.();window.removeEventListener("scroll",updateLuxuryProgress);window.removeEventListener("resize",updateLuxuryProgress)},{once:true});
})();
</script>
</body>
</html>
