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
2. 9/17 5:00PM new design, must review sync / Samuel
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
<meta name="theme-color" content="#061a30">
<title>Travel Info | SKANDI Travels</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
:root{
  --ti-navy:#022e64;
  --ti-navy-deep:#061a30;
  --ti-navy-black:#03111f;
  --ti-blue:#0b3a7a;
  --ti-blue-soft:#1f6ba3;
  --ti-aqua:#5fc7cf;
  --ti-aqua-soft:#9de0e5;
  --ti-ivory:#fbfaf6;
  --ti-porcelain:#f5f1ea;
  --ti-champagne:#d1bc98;
  --ti-limestone:#d8d2c8;
  --ti-graphite:#1a1a1a;
  --ti-text:#102033;
  --ti-body:#4d5f74;
  --ti-muted:#66758a;
  --ti-line:rgba(255,255,255,.14);
  --ti-line-dark:rgba(2,46,100,.14);
  --ti-line-soft:rgba(2,46,100,.08);
  --ti-danger:#9f2f2f;
  --ti-success:#0a7051;
  --ti-warning:#8a6619;
  --ti-shadow:0 26px 80px rgba(1,13,28,.30);
  --ti-panel-shadow:0 24px 64px rgba(1,13,28,.24);
  --ti-soft-shadow:0 16px 46px rgba(2,46,100,.10);
  --ti-ease:cubic-bezier(.22,1,.36,1);
  --ti-fast:180ms;
  --ti-panel:340ms;
  --ti-content:1320px;
  /* Canonical Home service-card palette */
  --ti-home-primary:linear-gradient(135deg,#022e64,#0b5c85);
  --ti-home-white:#ffffff;
  --ti-home-aqua:#d9f1f1;
  --ti-home-sand:#f2e9dc;
  --ti-home-ice:#e9eef8;
  --ti-home-section:#f3f6f8;
  --ti-home-brown:#3c2f20;
  --ti-home-blue:#0b5c85;
}
*{box-sizing:border-box}
html{scroll-behavior:smooth;background:var(--ti-ivory)}
html.ti-lock,html.ti-lock body{overflow:hidden;overscroll-behavior:none}
body{
  margin:0;
  min-width:0;
  min-height:100%;
  overflow-x:hidden;
  background:var(--ti-ivory);
  color:var(--ti-text);
  font-family:"Montserrat",Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
button,input,select,textarea{font:inherit}
button{cursor:pointer}
button:disabled{cursor:not-allowed;opacity:.55}
a{color:inherit}
img,video{display:block;max-width:100%}
button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible,a:focus-visible{
  outline:3px solid rgba(95,199,207,.42);
  outline-offset:3px;
}
.ti-visually-hidden{
  position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;
  overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important
}
.ti-hidden{display:none!important}
.ti-wrap{width:min(var(--ti-content),calc(100% - 64px));margin-inline:auto}
.ti-icon{width:20px;height:20px;display:block;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.ti-icon.ti-icon-sm{width:16px;height:16px}
.ti-icon.ti-icon-lg{width:26px;height:26px}
.ti-kicker{
  display:inline-flex;align-items:center;gap:10px;color:var(--ti-aqua-soft);font-size:11px;font-weight:800;
  letter-spacing:.18em;text-transform:uppercase
}
.ti-kicker:before{content:"";width:34px;height:1px;background:currentColor;opacity:.8}
.ti-kicker.ti-kicker-dark{color:var(--ti-blue-soft)}
.ti-btn{
  min-height:46px;border:0;border-radius:999px;padding:0 18px;display:inline-flex;align-items:center;justify-content:center;
  gap:9px;font-size:12px;font-weight:800;letter-spacing:.01em;transition:transform var(--ti-fast) var(--ti-ease),
  background var(--ti-fast),border-color var(--ti-fast),color var(--ti-fast),box-shadow var(--ti-fast)
}
.ti-btn:hover:not(:disabled){transform:translateY(-1px)}
.ti-btn-primary{background:var(--ti-navy);color:#fff;box-shadow:0 12px 28px rgba(2,46,100,.18)}
.ti-btn-primary:hover:not(:disabled){background:#093d78}
.ti-btn-aqua{background:var(--ti-aqua);color:#04233f;box-shadow:0 12px 28px rgba(95,199,207,.18)}
.ti-btn-ghost{background:transparent;color:inherit;border:1px solid currentColor}
.ti-btn-light{background:#fff;color:var(--ti-navy);border:1px solid rgba(2,46,100,.12)}
.ti-btn-champagne{background:var(--ti-champagne);color:#30291f}
.ti-round-btn{
  width:44px;height:44px;border-radius:50%;border:1px solid rgba(2,46,100,.13);background:#fff;color:var(--ti-navy);
  display:grid;place-items:center;transition:transform var(--ti-fast),background var(--ti-fast)
}
.ti-round-btn:hover{transform:translateY(-1px);background:#f7fbff}

/* immersive opening */
.ti-atlas{
  position:relative;isolation:isolate;min-height:clamp(610px,78svh,850px);overflow:hidden;color:#fff;
  background:
    radial-gradient(circle at 78% 20%,rgba(95,199,207,.18),transparent 26%),
    radial-gradient(circle at 10% 90%,rgba(31,107,163,.28),transparent 30%),
    linear-gradient(145deg,var(--ti-navy-black) 0%,var(--ti-navy-deep) 43%,#08294d 100%);
}
.ti-atlas:before{
  content:"";position:absolute;inset:-12%;z-index:-2;opacity:.42;
  background-image:
    radial-gradient(circle at 26% 35%,rgba(255,255,255,.16) 0 1px,transparent 1.5px),
    radial-gradient(circle at 70% 58%,rgba(95,199,207,.22) 0 1px,transparent 1.5px),
    radial-gradient(circle at 48% 76%,rgba(255,255,255,.12) 0 1px,transparent 1.5px);
  background-size:78px 78px,112px 112px,156px 156px;
  mask-image:linear-gradient(to bottom,black 0 68%,transparent 100%);
}
.ti-atlas:after{
  content:"";position:absolute;inset:auto 0 0;height:180px;z-index:0;pointer-events:none;
  background:linear-gradient(to bottom,transparent,var(--ti-ivory));
}
.ti-orbit{
  position:absolute;z-index:-1;border:1px solid rgba(95,199,207,.16);border-radius:50%;pointer-events:none
}
.ti-orbit-a{width:760px;height:760px;right:-250px;top:-360px;transform:rotate(-12deg)}
.ti-orbit-b{width:520px;height:240px;right:8%;bottom:18%;transform:rotate(-8deg);border-color:rgba(209,188,152,.14)}
.ti-route-art{position:absolute;inset:0;z-index:-1;opacity:.5;pointer-events:none}
.ti-route-art path{fill:none;stroke:url(#tiRouteGradient);stroke-width:1.1;stroke-dasharray:3 7;animation:tiRouteDrift 18s linear infinite}
.ti-route-art circle{fill:var(--ti-aqua);filter:drop-shadow(0 0 8px rgba(95,199,207,.7))}
@keyframes tiRouteDrift{to{stroke-dashoffset:-180}}
.ti-atlas-inner{position:relative;z-index:2;min-height:inherit;padding:clamp(64px,9vh,108px) 0 132px;display:flex;align-items:center}
.ti-atlas-copy{max-width:940px}
.ti-atlas h1{
  margin:17px 0 20px;max-width:930px;font-size:clamp(52px,8.6vw,112px);font-weight:500;line-height:.88;
  letter-spacing:-.072em;text-wrap:balance
}
.ti-atlas-lede{max-width:720px;margin:0 0 34px;color:#c8d8ea;font-size:clamp(15px,1.5vw,19px);line-height:1.75;font-weight:500}
.ti-network-meta{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin:0 0 28px;color:#a9bfd5;font-size:11px;font-weight:700}
.ti-network-meta span{display:inline-flex;align-items:center;gap:7px}
.ti-network-meta i{width:4px;height:4px;background:var(--ti-aqua);border-radius:50%;box-shadow:0 0 12px rgba(95,199,207,.7)}
.ti-command{
  width:min(820px,100%);position:relative;display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:10px;
  padding:10px 10px 10px 18px;border:1px solid rgba(255,255,255,.18);border-radius:22px;background:rgba(255,255,255,.10);
  box-shadow:0 24px 70px rgba(0,0,0,.2);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)
}
.ti-command input{width:100%;min-width:0;border:0;outline:0;background:transparent;color:#fff;font-size:15px;padding:10px 4px}
.ti-command input::placeholder{color:#aebfd1}
.ti-command-key{color:#aebfd1;font-size:10px;font-weight:800;border:1px solid rgba(255,255,255,.18);padding:7px 9px;border-radius:9px}
.ti-action-rail{display:flex;gap:8px;flex-wrap:wrap;margin-top:18px}
.ti-action-chip{
  min-height:39px;padding:0 13px;border-radius:999px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.055);
  color:#e8f3ff;display:inline-flex;align-items:center;gap:8px;font-size:10px;font-weight:750;transition:background var(--ti-fast),transform var(--ti-fast)
}
.ti-action-chip:hover{background:rgba(255,255,255,.11);transform:translateY(-1px)}
.ti-atlas-status{margin-top:18px;max-width:820px;min-height:0;color:#c1d4e6;font-size:11px;line-height:1.5}
.ti-atlas-status[hidden]{display:none}
.ti-atlas-codes{position:absolute;right:clamp(32px,5vw,80px);top:26%;display:grid;gap:11px;opacity:.62;pointer-events:none}
.ti-code-chip{display:flex;align-items:center;gap:10px;color:#9fc4db;font-size:10px;font-weight:800;letter-spacing:.12em}
.ti-code-chip strong{font-size:20px;color:#eef7ff;letter-spacing:.06em;font-weight:600}
.ti-code-chip:before{content:"";width:32px;height:1px;background:linear-gradient(90deg,transparent,var(--ti-aqua))}

/* home editorial */
.ti-home{position:relative;background:var(--ti-ivory)}
.ti-section{padding:74px 0}
.ti-section.ti-section-tight{padding:48px 0}
.ti-section-tint{background:linear-gradient(180deg,#fff 0%,#f7f5ef 100%)}
.ti-heading-row{display:flex;align-items:flex-end;justify-content:space-between;gap:30px;margin-bottom:30px}
.ti-heading-row h2{margin:8px 0 0;color:var(--ti-navy);font-size:clamp(30px,4vw,52px);font-weight:600;line-height:1;letter-spacing:-.055em}
.ti-heading-row p{max-width:610px;margin:0;color:var(--ti-body);font-size:13px;line-height:1.75}

/* journey rail */
.ti-journey-shell{position:relative}
.ti-journey-track{
  display:grid;grid-auto-flow:column;grid-auto-columns:minmax(250px,1fr);overflow-x:auto;overscroll-behavior-inline:contain;
  scroll-snap-type:x proximity;scrollbar-width:none;border-top:1px solid var(--ti-line-dark);border-bottom:1px solid var(--ti-line-dark)
}
.ti-journey-track::-webkit-scrollbar{display:none}
.ti-stage-btn{
  position:relative;scroll-snap-align:start;min-height:210px;border:0;border-right:1px solid var(--ti-line-dark);background:transparent;
  padding:26px 24px 25px;text-align:left;color:var(--ti-navy);overflow:hidden;transition:background var(--ti-panel),color var(--ti-panel)
}
.ti-stage-btn:last-child{border-right:0}
.ti-stage-btn:after{content:"";position:absolute;left:24px;right:24px;bottom:0;height:2px;background:var(--ti-aqua);transform:scaleX(0);transform-origin:left;transition:transform var(--ti-panel) var(--ti-ease)}
.ti-stage-btn:hover,.ti-stage-btn[aria-pressed="true"]{background:#fff}
.ti-stage-btn:hover:after,.ti-stage-btn[aria-pressed="true"]:after{transform:scaleX(1)}
.ti-stage-no{font-size:10px;color:var(--ti-blue-soft);font-weight:800;letter-spacing:.12em}
.ti-stage-btn h3{margin:48px 0 9px;font-size:18px;line-height:1.12;letter-spacing:-.03em;font-weight:650}
.ti-stage-btn p{margin:0;color:var(--ti-muted);font-size:11px;line-height:1.65}
.ti-stage-arrow{position:absolute;top:24px;right:20px;color:var(--ti-aqua);transform:translateX(-4px);opacity:.65;transition:transform var(--ti-fast),opacity var(--ti-fast)}
.ti-stage-btn:hover .ti-stage-arrow{transform:translateX(0);opacity:1}

/* featured help */
.ti-featured-layout{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(320px,.65fr);gap:18px}
.ti-featured-main{
  position:relative;min-height:430px;border-radius:30px;overflow:hidden;color:#fff;background:linear-gradient(145deg,#092c53,#061a30);padding:40px;
  display:flex;flex-direction:column;justify-content:flex-end;box-shadow:var(--ti-soft-shadow)
}
.ti-featured-main:before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 90% 5%,rgba(95,199,207,.25),transparent 34%),linear-gradient(to top,rgba(3,17,31,.9),transparent 65%);pointer-events:none}
.ti-featured-main>*{position:relative;z-index:1}
.ti-featured-main h3{max-width:720px;margin:12px 0 11px;font-size:clamp(27px,3.6vw,49px);line-height:1.02;letter-spacing:-.055em;font-weight:550}
.ti-featured-main p{max-width:690px;margin:0;color:#c5d8eb;font-size:13px;line-height:1.72}
.ti-featured-main button{align-self:flex-start;margin-top:22px}
.ti-featured-list{display:grid;border-top:1px solid var(--ti-line-dark)}
.ti-question-btn{
  min-height:104px;display:grid;grid-template-columns:34px minmax(0,1fr) 20px;gap:12px;align-items:center;width:100%;border:0;
  border-bottom:1px solid var(--ti-line-dark);background:transparent;text-align:left;padding:15px 4px;color:var(--ti-navy)
}
.ti-question-btn:hover{background:rgba(255,255,255,.65)}
.ti-question-index{color:var(--ti-aqua);font-size:10px;font-weight:800}
.ti-question-copy strong{display:block;font-size:13px;line-height:1.35}
.ti-question-copy span{display:block;margin-top:5px;color:var(--ti-muted);font-size:10px;line-height:1.5}

/* library gateways */
.ti-gateway-grid{display:grid;grid-template-columns:repeat(12,1fr);gap:14px}
.ti-gateway{
  position:relative;overflow:hidden;min-height:230px;border:0;border-radius:26px;text-align:left;padding:25px;color:#fff;
  box-shadow:var(--ti-soft-shadow);transition:transform var(--ti-panel) var(--ti-ease),box-shadow var(--ti-panel)
}
.ti-gateway:hover{transform:translateY(-4px);box-shadow:0 24px 64px rgba(2,46,100,.16)}
.ti-gateway:before{content:"";position:absolute;inset:0;background:linear-gradient(to top,rgba(2,20,42,.9),rgba(2,20,42,.15));pointer-events:none}
.ti-gateway:after{content:"";position:absolute;width:190px;height:190px;right:-65px;top:-75px;border:1px solid rgba(255,255,255,.18);border-radius:50%;pointer-events:none}
.ti-gateway>*{position:relative;z-index:1}
.ti-gateway-a{grid-column:span 5;background:linear-gradient(145deg,#04254a,#0b477e)}
.ti-gateway-b{grid-column:span 4;background:linear-gradient(145deg,#0b3c5b,#126d78)}
.ti-gateway-c{grid-column:span 3;background:linear-gradient(145deg,#6b5d48,#ad9270)}
.ti-gateway-d{grid-column:span 3;background:linear-gradient(145deg,#142d4f,#496b8f)}
.ti-gateway-e{grid-column:span 3;background:linear-gradient(145deg,#183d3b,#3b736c)}
.ti-gateway-f{grid-column:span 3;background:linear-gradient(145deg,#28374b,#6b7280)}
.ti-gateway-g{grid-column:span 3;background:linear-gradient(145deg,#4f4639,#8d7557)}
.ti-gateway-icon{width:46px;height:46px;border-radius:16px;display:grid;place-items:center;background:rgba(255,255,255,.11);border:1px solid rgba(255,255,255,.17);margin-bottom:50px}
.ti-gateway h3{margin:0 0 8px;font-size:20px;letter-spacing:-.035em;font-weight:650}
.ti-gateway p{margin:0;color:rgba(255,255,255,.72);font-size:10.5px;line-height:1.55;max-width:420px}
.ti-gateway-count{display:inline-flex;margin-top:14px;padding:6px 9px;border-radius:999px;border:1px solid rgba(255,255,255,.17);font-size:9px;font-weight:800;color:#eaf5ff}

/* directory */
.ti-directory-shell{border-top:1px solid var(--ti-line-dark);padding-top:28px}
.ti-filter-row{display:flex;align-items:center;justify-content:space-between;gap:18px;margin-bottom:22px;flex-wrap:wrap}
.ti-filter-tabs{display:flex;gap:7px;overflow-x:auto;scrollbar-width:none;max-width:100%}
.ti-filter-tabs::-webkit-scrollbar{display:none}
.ti-filter-btn{white-space:nowrap;min-height:37px;padding:0 12px;border-radius:999px;border:1px solid var(--ti-line-dark);background:#fff;color:var(--ti-navy);font-size:9px;font-weight:800}
.ti-filter-btn[aria-pressed="true"]{background:var(--ti-navy);border-color:var(--ti-navy);color:#fff}
.ti-result-count{font-size:10px;color:var(--ti-muted);font-weight:700}
.ti-directory-list{display:grid;gap:12px}
.ti-entity{
  position:relative;width:100%;border:1px solid var(--ti-line-dark);border-radius:22px;background:#fff;color:var(--ti-text);
  display:grid;grid-template-columns:180px minmax(0,1fr) 42px;min-height:150px;overflow:hidden;text-align:left;
  transition:transform var(--ti-fast),box-shadow var(--ti-fast),border-color var(--ti-fast)
}
.ti-entity:hover{transform:translateY(-2px);border-color:rgba(31,107,163,.32);box-shadow:var(--ti-soft-shadow)}
.ti-entity-media{position:relative;min-height:150px;background:linear-gradient(145deg,#eaf1f7,#f9fbfc);overflow:hidden;display:grid;place-items:center;color:var(--ti-navy)}
.ti-entity-media img{width:100%;height:100%;object-fit:cover}
.ti-entity-media.ti-logo-media img{width:72%;height:72%;object-fit:contain;padding:18px}
.ti-fallback-mark{font-size:34px;font-weight:650;letter-spacing:.06em;opacity:.55}
.ti-entity-copy{padding:23px 24px;min-width:0;display:flex;flex-direction:column;justify-content:center}
.ti-entity-type{font-size:9px;color:var(--ti-blue-soft);font-weight:800;letter-spacing:.13em;text-transform:uppercase}
.ti-entity-copy h3{margin:7px 0 7px;font-size:20px;line-height:1.16;color:var(--ti-navy);letter-spacing:-.035em;font-weight:650}
.ti-entity-copy p{margin:0;max-width:850px;color:var(--ti-muted);font-size:11px;line-height:1.62;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.ti-entity-tags{display:flex;gap:6px;flex-wrap:wrap;margin-top:12px}
.ti-mini-tag{display:inline-flex;padding:5px 8px;border-radius:999px;background:#f5f8fb;color:#617287;font-size:8.5px;font-weight:750}
.ti-entity-chevron{display:grid;place-items:center;color:var(--ti-aqua);padding-right:8px}
.ti-load-more{display:flex;justify-content:center;margin-top:24px}
.ti-empty-state{padding:46px 24px;text-align:center;border:1px dashed rgba(2,46,100,.2);border-radius:22px;color:var(--ti-muted);background:rgba(255,255,255,.5)}
.ti-empty-state strong{display:block;color:var(--ti-navy);font-size:16px;margin-bottom:7px}

/* contextual support chapter */
.ti-support-chapter{position:relative;overflow:hidden;background:var(--ti-navy-deep);color:#fff;padding:74px 0 84px}
.ti-support-chapter:after{content:"";position:absolute;width:500px;height:500px;border-radius:50%;right:-180px;top:-250px;border:1px solid rgba(95,199,207,.16)}
.ti-support-grid{position:relative;z-index:1;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:40px;align-items:center}
.ti-support-grid h2{margin:10px 0 13px;font-size:clamp(34px,5vw,62px);line-height:.96;letter-spacing:-.06em;font-weight:550}
.ti-support-grid p{max-width:670px;margin:0;color:#b8cce0;font-size:13px;line-height:1.75}
.ti-support-actions{display:flex;gap:9px;flex-wrap:wrap;justify-content:flex-end}

/* detail */
.ti-detail-view{display:none;background:var(--ti-ivory);min-height:100vh}
.ti-detail-view[data-active="true"]{display:block}
.ti-backbar{padding:22px 0;position:relative;z-index:4}
.ti-back-btn{border:0;background:transparent;color:var(--ti-navy);display:inline-flex;align-items:center;gap:8px;font-size:11px;font-weight:800;padding:8px 0}
.ti-profile-hero{
  position:relative;min-height:470px;overflow:hidden;border-radius:32px;color:#fff;background:linear-gradient(145deg,#061a30,#0b3d70);
  display:grid;grid-template-columns:minmax(0,1.15fr) minmax(360px,.85fr);box-shadow:var(--ti-soft-shadow)
}
.ti-profile-hero:before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 80% 12%,rgba(95,199,207,.18),transparent 30%),linear-gradient(90deg,rgba(3,17,31,.94) 0%,rgba(3,17,31,.76) 52%,rgba(3,17,31,.22) 100%);z-index:1;pointer-events:none}
.ti-profile-copy{position:relative;z-index:2;padding:clamp(34px,5vw,66px);display:flex;flex-direction:column;justify-content:flex-end;min-width:0}
.ti-profile-logo{width:86px;height:60px;border-radius:15px;background:#fff;display:grid;place-items:center;padding:10px;margin-bottom:34px;box-shadow:0 12px 30px rgba(0,0,0,.16)}
.ti-profile-logo img{width:100%;height:100%;object-fit:contain}
.ti-profile-code{font-size:clamp(42px,7vw,86px);font-weight:500;line-height:.9;letter-spacing:-.055em;margin-bottom:10px;color:#fff}
.ti-profile-copy h1{margin:7px 0 13px;font-size:clamp(38px,5vw,70px);font-weight:550;line-height:.95;letter-spacing:-.062em}
.ti-profile-copy p{max-width:720px;margin:0;color:#c7d7e7;font-size:13px;line-height:1.75}
.ti-profile-meta{display:flex;gap:7px;flex-wrap:wrap;margin-top:19px}
.ti-profile-meta span{padding:7px 10px;border-radius:999px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.07);font-size:9px;font-weight:750;color:#e6f2ff}
.ti-profile-image{position:relative;min-height:470px;background:linear-gradient(145deg,#0c315a,#124b78);overflow:hidden}
.ti-profile-image img{width:100%;height:100%;object-fit:cover}
.ti-profile-image:after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(6,26,48,.72),transparent 55%)}
.ti-profile-fallback{height:100%;min-height:470px;display:grid;place-items:center;position:relative;overflow:hidden}
.ti-profile-fallback:before{content:"";width:340px;height:340px;border-radius:50%;border:1px solid rgba(255,255,255,.16);position:absolute}
.ti-profile-fallback strong{font-size:78px;letter-spacing:.1em;color:rgba(255,255,255,.65);font-weight:500}
.ti-section-nav-wrap{position:sticky;top:0;z-index:20;background:rgba(251,250,246,.9);backdrop-filter:blur(16px);border-bottom:1px solid var(--ti-line-dark);margin-top:24px}
.ti-section-nav{display:flex;gap:4px;overflow-x:auto;scrollbar-width:none;padding:10px 0}
.ti-section-nav::-webkit-scrollbar{display:none}
.ti-section-link{white-space:nowrap;border:0;background:transparent;border-radius:999px;padding:10px 12px;color:var(--ti-muted);font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.06em}
.ti-section-link:hover,.ti-section-link[aria-current="true"]{background:#fff;color:var(--ti-navy);box-shadow:0 4px 14px rgba(2,46,100,.06)}
.ti-detail-body{padding:24px 0 80px;display:grid;grid-template-columns:minmax(0,1fr) 310px;gap:32px;align-items:start}
.ti-story-stack{display:grid;gap:16px;min-width:0}
.ti-story-section{scroll-margin-top:80px;border-top:1px solid var(--ti-line-dark);padding:32px 0 10px}
.ti-story-section:first-child{border-top:0;padding-top:10px}
.ti-story-eyebrow{font-size:9px;color:var(--ti-blue-soft);font-weight:800;letter-spacing:.14em;text-transform:uppercase;margin-bottom:9px}
.ti-story-section h2{margin:0 0 14px;color:var(--ti-navy);font-size:clamp(25px,3vw,38px);font-weight:600;letter-spacing:-.05em;line-height:1.03}
.ti-story-section p,.ti-rich-text{margin:0;color:var(--ti-body);font-size:12px;line-height:1.78;white-space:pre-line}
.ti-bullet-list{display:grid;gap:8px;margin-top:14px;padding:0;list-style:none}
.ti-bullet-list li{position:relative;padding-left:18px;color:var(--ti-body);font-size:11px;line-height:1.65}
.ti-bullet-list li:before{content:"";position:absolute;left:0;top:.7em;width:6px;height:6px;border-radius:50%;background:var(--ti-aqua)}
.ti-fact-strip{display:flex;gap:8px;flex-wrap:wrap;margin-top:16px}
.ti-fact{min-width:110px;padding:11px 12px;border-radius:14px;background:#fff;border:1px solid var(--ti-line-dark)}
.ti-fact b{display:block;color:var(--ti-navy);font-size:12px;margin-bottom:3px}.ti-fact span{font-size:8.5px;color:var(--ti-muted);text-transform:uppercase;letter-spacing:.06em;font-weight:700}
.ti-detail-aside{position:sticky;top:70px;display:grid;gap:12px}
.ti-aside-card{border:1px solid var(--ti-line-dark);border-radius:22px;background:#fff;padding:20px;box-shadow:0 8px 28px rgba(2,46,100,.05)}
.ti-aside-card h3{margin:0 0 11px;color:var(--ti-navy);font-size:14px}
.ti-aside-card p{margin:0;color:var(--ti-muted);font-size:10.5px;line-height:1.6}
.ti-aside-actions{display:grid;gap:7px;margin-top:14px}
.ti-key-list{display:grid;gap:0}
.ti-key-row{display:grid;grid-template-columns:100px minmax(0,1fr);gap:10px;padding:9px 0;border-bottom:1px solid var(--ti-line-soft);font-size:9.5px;line-height:1.5}
.ti-key-row:last-child{border-bottom:0}.ti-key-row b{color:var(--ti-muted)}.ti-key-row span{color:var(--ti-text);overflow-wrap:anywhere}
.ti-weather-inline{display:none;margin-top:14px;border-top:1px solid var(--ti-line-soft);padding-top:14px}
.ti-weather-inline[data-visible="true"]{display:block}
.ti-weather-inline strong{display:block;color:var(--ti-navy);font-size:20px;margin-bottom:4px}.ti-weather-inline span{font-size:9.5px;color:var(--ti-muted)}

/* baggage detail composition */
.ti-baggage-cabins{display:grid;gap:12px;margin-top:18px}
.ti-baggage-block{border:1px solid var(--ti-line-dark);border-radius:20px;background:#fff;overflow:hidden}
.ti-baggage-head{padding:16px 18px;background:#f8fafc;display:flex;justify-content:space-between;gap:14px;align-items:center}
.ti-baggage-head strong{color:var(--ti-navy);font-size:13px}.ti-baggage-head span{font-size:9px;color:var(--ti-muted)}
.ti-fare-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:1px;background:var(--ti-line-soft)}
.ti-fare{background:#fff;padding:17px}.ti-fare h4{margin:0 0 9px;color:var(--ti-navy);font-size:11px}.ti-fare p{font-size:9.5px!important;line-height:1.55!important;margin-bottom:10px!important}
.ti-bag-fact{display:flex;justify-content:space-between;gap:8px;padding:7px 0;border-top:1px solid var(--ti-line-soft);font-size:8.5px}.ti-bag-fact b{color:var(--ti-muted)}.ti-bag-fact span{color:var(--ti-text);text-align:right}

/* overlays and command palette */
.ti-overlay,.ti-search-layer{position:fixed;inset:0;z-index:9500;visibility:hidden;pointer-events:none}
.ti-overlay[data-open="true"],.ti-search-layer[data-open="true"]{visibility:visible;pointer-events:auto}
.ti-scrim{position:absolute;inset:0;background:rgba(3,17,31,.56);backdrop-filter:blur(6px);opacity:0;transition:opacity var(--ti-panel)}
.ti-overlay[data-open="true"] .ti-scrim,.ti-search-layer[data-open="true"] .ti-scrim{opacity:1}
.ti-sheet{
  position:absolute;right:0;top:0;bottom:0;width:min(540px,92vw);background:var(--ti-ivory);box-shadow:-24px 0 70px rgba(0,0,0,.22);
  transform:translateX(104%);transition:transform var(--ti-panel) var(--ti-ease);display:flex;flex-direction:column;overflow:hidden
}
.ti-overlay[data-open="true"] .ti-sheet{transform:translateX(0)}
.ti-sheet-head{padding:22px 24px;border-bottom:1px solid var(--ti-line-dark);display:flex;align-items:flex-start;justify-content:space-between;gap:18px;background:#fff}
.ti-sheet-head h2{margin:6px 0 4px;color:var(--ti-navy);font-size:25px;letter-spacing:-.04em}.ti-sheet-head p{margin:0;color:var(--ti-muted);font-size:10.5px;line-height:1.55}
.ti-sheet-body{padding:22px 24px 34px;overflow:auto;overscroll-behavior:contain;flex:1}
.ti-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.ti-field{display:grid;gap:6px}.ti-field.ti-full{grid-column:1/-1}
.ti-field label{font-size:8.5px;color:var(--ti-muted);font-weight:800;text-transform:uppercase;letter-spacing:.08em}
.ti-field input,.ti-field select,.ti-field textarea{
  width:100%;border:1px solid rgba(2,46,100,.18);border-radius:13px;background:#fff;color:var(--ti-text);padding:12px 13px;outline:0
}
.ti-field textarea{min-height:135px;resize:vertical}
.ti-sheet-actions{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;margin-top:17px}
.ti-message-box{margin-top:16px;border-radius:14px;background:#fff;border:1px solid var(--ti-line-dark);padding:15px;color:var(--ti-body);font-size:10.5px;line-height:1.65}
.ti-message-box[data-tone="error"]{border-color:rgba(159,47,47,.25);background:#fff8f8;color:#7b2b2b}
.ti-message-box[data-tone="success"]{border-color:rgba(10,112,81,.22);background:#f6fffb;color:#245d4b}
.ti-message-box[hidden]{display:none}
.ti-airline-option{display:grid;grid-template-columns:46px minmax(0,1fr);gap:12px;align-items:center;padding:10px;border:1px solid var(--ti-line-dark);border-radius:14px;background:#fff;margin-top:10px}
.ti-airline-option img{width:42px;height:28px;object-fit:contain}.ti-airline-option strong{display:block;color:var(--ti-navy);font-size:11px}.ti-airline-option span{font-size:9px;color:var(--ti-muted)}
.ti-requirement-group{padding:16px 0;border-bottom:1px solid var(--ti-line-soft)}.ti-requirement-group:last-child{border-bottom:0}.ti-requirement-group h4{margin:0 0 8px;color:var(--ti-navy);font-size:12px}.ti-requirement-group p{margin:0;color:var(--ti-body);font-size:10px;line-height:1.6;white-space:pre-line}
.ti-requirement-field{padding:10px 0;border-bottom:1px solid var(--ti-line-soft)}.ti-requirement-field:last-child{border-bottom:0}.ti-requirement-field b{display:block;color:var(--ti-muted);font-size:8.5px;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px}.ti-requirement-field span{font-size:10.5px;color:var(--ti-text);line-height:1.55}

.ti-search-shell{
  position:absolute;left:50%;top:8vh;transform:translate(-50%,-14px);width:min(860px,calc(100% - 36px));max-height:84vh;
  background:#fff;border-radius:26px;box-shadow:0 30px 90px rgba(0,0,0,.28);overflow:hidden;opacity:0;transition:opacity var(--ti-panel),transform var(--ti-panel) var(--ti-ease)
}
.ti-search-layer[data-open="true"] .ti-search-shell{opacity:1;transform:translate(-50%,0)}
.ti-search-head{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:12px;align-items:center;padding:14px 16px;border-bottom:1px solid var(--ti-line-dark)}
.ti-search-head input{border:0;outline:0;width:100%;font-size:16px;color:var(--ti-text);padding:12px 0;background:transparent}
.ti-search-esc{font-size:9px;color:var(--ti-muted);padding:6px 8px;border-radius:8px;border:1px solid var(--ti-line-dark)}
.ti-search-results{max-height:calc(84vh - 74px);overflow:auto;padding:10px;overscroll-behavior:contain}
.ti-search-group{padding:8px 6px 14px}.ti-search-group-title{font-size:8.5px;color:var(--ti-muted);font-weight:800;letter-spacing:.12em;text-transform:uppercase;padding:5px 8px 7px}
.ti-search-item{width:100%;border:0;border-radius:14px;background:transparent;display:grid;grid-template-columns:42px minmax(0,1fr) auto;gap:11px;align-items:center;padding:10px;text-align:left;color:var(--ti-text)}
.ti-search-item:hover,.ti-search-item[data-active="true"]{background:#f4f8fb}
.ti-search-icon{width:42px;height:42px;border-radius:13px;background:#edf6fa;color:var(--ti-navy);display:grid;place-items:center;overflow:hidden}.ti-search-icon img{width:100%;height:100%;object-fit:cover}.ti-search-icon.ti-search-logo img{object-fit:contain;padding:7px;background:#fff}
.ti-search-copy strong{display:block;color:var(--ti-navy);font-size:11px}.ti-search-copy span{display:block;color:var(--ti-muted);font-size:9px;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ti-search-type{font-size:8px;color:var(--ti-blue-soft);font-weight:800;text-transform:uppercase;letter-spacing:.05em}
.ti-search-empty{padding:42px 24px;text-align:center;color:var(--ti-muted);font-size:11px}

/* compact Alexandra launcher */
.ti-alexandra-launcher{position:fixed;right:18px;bottom:18px;z-index:7000;display:flex;align-items:center;gap:9px;border:1px solid rgba(2,46,100,.12);background:rgba(255,255,255,.94);backdrop-filter:blur(12px);border-radius:999px;padding:6px 12px 6px 6px;box-shadow:0 15px 42px rgba(2,46,100,.18);color:var(--ti-navy)}
.ti-alexandra-launcher:hover{transform:translateY(-1px)}
.ti-alexandra-avatar{width:40px;height:40px;border-radius:50%;overflow:hidden;background:var(--ti-navy)}.ti-alexandra-avatar video{width:100%;height:100%;object-fit:cover}
.ti-alexandra-launcher strong{font-size:9.5px}.ti-alexandra-launcher span{display:block;font-size:8px;color:var(--ti-muted);margin-top:2px}

/* React mount / fallback */
.ti-aircraft-host{margin-top:16px;min-height:180px}
.ti-aircraft-skeleton{border-radius:28px;overflow:hidden;background:linear-gradient(145deg,#0a2747,#0e3b65);min-height:300px;display:grid;place-items:center;color:#c4d7e9;border:1px solid rgba(95,199,207,.16)}
.ti-skeleton-lines{width:min(420px,76%);display:grid;gap:11px}.ti-skeleton-lines i{height:9px;border-radius:999px;background:linear-gradient(90deg,rgba(255,255,255,.05),rgba(255,255,255,.14),rgba(255,255,255,.05));background-size:200% 100%;animation:tiShimmer 1.4s linear infinite}.ti-skeleton-lines i:nth-child(2){width:72%}.ti-skeleton-lines i:nth-child(3){width:54%}
@keyframes tiShimmer{to{background-position:-200% 0}}
.ti-fleet-fallback{border-radius:26px;border:1px solid var(--ti-line-dark);background:#fff;padding:22px}
.ti-fleet-fallback h3{margin:0 0 7px;color:var(--ti-navy);font-size:18px}.ti-fleet-fallback>p{margin:0;color:var(--ti-muted);font-size:10.5px;line-height:1.6}
.ti-fallback-aircraft-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;margin-top:18px}.ti-fallback-aircraft{border:1px solid var(--ti-line-dark);border-radius:18px;padding:15px}.ti-fallback-aircraft strong{display:block;color:var(--ti-navy);font-size:12px}.ti-fallback-aircraft span{display:block;color:var(--ti-muted);font-size:9px;margin-top:4px}.ti-fallback-cabins{display:flex;gap:5px;flex-wrap:wrap;margin-top:10px}.ti-fallback-cabins i{font-style:normal;font-size:8px;background:#f5f8fb;padding:5px 7px;border-radius:999px;color:#51647a}

/* Responsive */
@media(max-width:1080px){
  .ti-wrap{width:min(var(--ti-content),calc(100% - 40px))}
  .ti-atlas-codes{display:none}
  .ti-featured-layout{grid-template-columns:1fr}
  .ti-featured-list{grid-template-columns:1fr 1fr;gap:0 18px}
  .ti-gateway-a,.ti-gateway-b{grid-column:span 6}.ti-gateway-c,.ti-gateway-d,.ti-gateway-e,.ti-gateway-f,.ti-gateway-g{grid-column:span 4}
  .ti-profile-hero{grid-template-columns:1fr}.ti-profile-image{position:absolute;inset:0;z-index:0}.ti-profile-copy{min-height:470px}.ti-profile-hero:before{z-index:1;background:linear-gradient(90deg,rgba(3,17,31,.96),rgba(3,17,31,.76) 60%,rgba(3,17,31,.46))}
  .ti-detail-body{grid-template-columns:1fr}.ti-detail-aside{position:static;grid-template-columns:1fr 1fr}
}
@media(max-width:760px){
  .ti-wrap{width:calc(100% - 24px)}
  .ti-atlas{min-height:660px}.ti-atlas-inner{padding:58px 0 118px;align-items:flex-start}.ti-atlas h1{font-size:clamp(49px,15vw,76px);margin-top:14px}.ti-atlas-lede{font-size:14px;margin-bottom:26px}
  .ti-command{grid-template-columns:auto minmax(0,1fr) auto;border-radius:19px}.ti-command-key{display:none}.ti-command .ti-btn{width:44px;padding:0;font-size:0}.ti-command .ti-btn .ti-icon{width:18px;height:18px}
  .ti-action-rail{flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none;margin-right:-12px;padding-right:12px}.ti-action-rail::-webkit-scrollbar{display:none}.ti-action-chip{white-space:nowrap}
  .ti-section{padding:54px 0}.ti-section.ti-section-tight{padding:38px 0}.ti-heading-row{display:block}.ti-heading-row p{margin-top:13px}.ti-heading-row h2{font-size:36px}
  .ti-journey-track{grid-auto-columns:82vw}.ti-stage-btn{min-height:185px}
  .ti-featured-main{min-height:390px;padding:26px}.ti-featured-list{grid-template-columns:1fr}.ti-question-btn{min-height:88px}
  .ti-gateway-grid{grid-template-columns:1fr}.ti-gateway-a,.ti-gateway-b,.ti-gateway-c,.ti-gateway-d,.ti-gateway-e,.ti-gateway-f,.ti-gateway-g{grid-column:auto;min-height:200px}.ti-gateway-icon{margin-bottom:36px}
  .ti-entity{grid-template-columns:98px minmax(0,1fr);min-height:132px}.ti-entity-media{min-height:132px}.ti-entity-chevron{display:none}.ti-entity-copy{padding:16px}.ti-entity-copy h3{font-size:16px}.ti-entity-copy p{-webkit-line-clamp:3;font-size:9.5px}.ti-entity-tags{margin-top:8px}
  .ti-support-grid{grid-template-columns:1fr}.ti-support-actions{justify-content:flex-start}
  .ti-backbar{padding:15px 0}.ti-profile-hero{border-radius:24px;min-height:430px}.ti-profile-copy{padding:28px 22px;min-height:430px}.ti-profile-copy h1{font-size:42px}.ti-profile-logo{margin-bottom:25px}.ti-profile-image,.ti-profile-fallback{min-height:430px}.ti-profile-code{font-size:54px}
  .ti-section-nav-wrap{margin-left:-12px;margin-right:-12px;padding:0 12px}.ti-detail-body{padding-top:16px;gap:16px}.ti-detail-aside{grid-template-columns:1fr}.ti-story-section{padding-top:25px}
  .ti-sheet{top:auto;left:0;right:0;bottom:0;width:100%;max-height:min(88svh,780px);border-radius:25px 25px 0 0;transform:translateY(104%)}.ti-overlay[data-open="true"] .ti-sheet{transform:translateY(0)}.ti-sheet-body{padding-bottom:calc(28px + env(safe-area-inset-bottom))}
  .ti-form-grid{grid-template-columns:1fr}.ti-field.ti-full{grid-column:auto}
  .ti-search-shell{inset:0;width:100%;height:100dvh;max-height:none;border-radius:0;transform:translateY(12px);left:0;top:0}.ti-search-layer[data-open="true"] .ti-search-shell{transform:none}.ti-search-results{max-height:calc(100dvh - 75px);padding-bottom:calc(20px + env(safe-area-inset-bottom))}.ti-search-esc{font-size:0;border:0;padding:8px}.ti-search-esc:before{content:"Close";font-size:9px}
  .ti-alexandra-launcher{right:10px;bottom:calc(10px + env(safe-area-inset-bottom));padding-right:8px}.ti-alexandra-launcher .ti-alexandra-label{display:none}
}
@media(max-width:460px){
  .ti-entity{grid-template-columns:82px minmax(0,1fr)}.ti-entity-copy{padding:13px}.ti-entity-tags .ti-mini-tag:nth-child(n+3){display:none}
  .ti-featured-main{min-height:360px}.ti-profile-meta span:nth-child(n+5){display:none}
}
@media(prefers-reduced-motion:reduce){
  *,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;scroll-behavior:auto!important;transition-duration:.01ms!important}
  .ti-route-art{display:none}
}

/* =========================================================
   B-011.22 VISUAL UPGRADE
   Exact Home service-card palette + richer SKANDI motion.
   Presentation only. Existing Travel Info contracts remain unchanged.
   ========================================================= */
body{
  background:#fff;
}
.ti-home{
  background:#fff;
}
.ti-home main{
  position:relative;
  isolation:isolate;
  background:
    radial-gradient(circle at 8% 12%,rgba(95,199,207,.08),transparent 18%),
    radial-gradient(circle at 92% 46%,rgba(40,92,168,.06),transparent 18%),
    #fff;
}
.ti-home main::before{
  content:"";
  position:absolute;
  inset:0;
  z-index:-1;
  pointer-events:none;
  opacity:.36;
  background-image:
    linear-gradient(rgba(2,46,100,.032) 1px,transparent 1px),
    linear-gradient(90deg,rgba(2,46,100,.032) 1px,transparent 1px);
  background-size:52px 52px;
  mask-image:linear-gradient(180deg,transparent 0,#000 10%,#000 78%,transparent 100%);
}
.ti-section{
  position:relative;
}
.ti-section-tint{
  background:var(--ti-home-section);
}

/* Hero becomes a richer digital travel atlas while staying SKANDI. */
.ti-atlas{
  --hero-x:72%;
  --hero-y:24%;
  min-height:clamp(640px,80svh,900px);
  background:
    radial-gradient(circle at var(--hero-x) var(--hero-y),rgba(95,199,207,.24),transparent 22%),
    radial-gradient(circle at 12% 78%,rgba(40,92,168,.34),transparent 28%),
    radial-gradient(circle at 88% 88%,rgba(11,92,133,.26),transparent 26%),
    linear-gradient(135deg,#03111f 0%,#022e64 52%,#0b5c85 100%);
  box-shadow:inset 0 -1px rgba(255,255,255,.08);
}
.ti-atlas:before{
  inset:-8%;
  opacity:.62;
  background-image:
    linear-gradient(rgba(255,255,255,.045) 1px,transparent 1px),
    linear-gradient(90deg,rgba(255,255,255,.045) 1px,transparent 1px),
    radial-gradient(circle at 26% 35%,rgba(255,255,255,.22) 0 1px,transparent 1.7px),
    radial-gradient(circle at 70% 58%,rgba(95,199,207,.30) 0 1px,transparent 1.7px),
    radial-gradient(circle at 48% 76%,rgba(255,255,255,.16) 0 1px,transparent 1.7px);
  background-size:44px 44px,44px 44px,78px 78px,112px 112px,156px 156px;
  animation:tiAtlasGrid 26s linear infinite;
  mask-image:linear-gradient(to bottom,black 0 72%,transparent 100%);
}
.ti-atlas:after{
  height:250px;
  background:
    linear-gradient(to bottom,
      transparent 0%,
      rgba(243,246,248,.08) 24%,
      rgba(243,246,248,.60) 72%,
      #fff 100%);
}
@keyframes tiAtlasGrid{
  from{background-position:0 0,0 0,0 0,0 0,0 0}
  to{background-position:88px 44px,44px 88px,78px 0,-112px 0,156px 0}
}
.ti-orbit{
  box-shadow:0 0 40px rgba(95,199,207,.04);
  animation:tiOrbitFloat 10s ease-in-out infinite alternate;
}
.ti-orbit-b{animation-delay:-3s}
@keyframes tiOrbitFloat{
  from{translate:0 0;opacity:.56}
  to{translate:-14px 9px;opacity:.96}
}
.ti-route-art{
  opacity:.72;
  filter:drop-shadow(0 0 10px rgba(95,199,207,.14));
}
.ti-route-art path{
  stroke-width:1.25;
  animation-duration:14s;
}
.ti-route-art circle{
  animation:tiRoutePulse 2.8s ease-in-out infinite;
}
@keyframes tiRoutePulse{
  50%{r:5px;opacity:.55}
}
.ti-atlas-copy{
  animation:tiHeroEnter .9s cubic-bezier(.16,1,.3,1) both;
}
.ti-atlas h1{
  text-shadow:0 16px 44px rgba(0,0,0,.20);
}
.ti-atlas-lede{
  color:#d4e1ee;
}
@keyframes tiHeroEnter{
  from{opacity:0;transform:translateY(24px)}
  to{opacity:1;transform:none}
}
.ti-command{
  border-color:rgba(255,255,255,.24);
  background:rgba(255,255,255,.12);
  box-shadow:0 26px 72px rgba(1,13,28,.28);
  backdrop-filter:blur(22px) saturate(1.16);
  -webkit-backdrop-filter:blur(22px) saturate(1.16);
  transition:transform .32s var(--ti-ease),background .28s ease,border-color .28s ease,box-shadow .28s ease;
}
.ti-command::before{
  content:"";
  position:absolute;
  inset:0;
  border-radius:inherit;
  pointer-events:none;
  background:linear-gradient(115deg,transparent 0 34%,rgba(255,255,255,.15) 48%,transparent 62%);
  background-size:220% 100%;
  background-position:-140% 0;
  transition:background-position .7s var(--ti-ease);
}
.ti-command:focus-within{
  transform:translateY(-3px);
  background:rgba(255,255,255,.16);
  border-color:rgba(95,199,207,.52);
  box-shadow:0 32px 82px rgba(1,13,28,.34),0 0 0 4px rgba(95,199,207,.08);
}
.ti-command:focus-within::before{background-position:160% 0}
.ti-action-chip{
  position:relative;
  overflow:hidden;
  background:rgba(255,255,255,.07);
  backdrop-filter:blur(12px);
  transition:transform .22s var(--ti-ease),background .22s ease,border-color .22s ease;
}
.ti-action-chip:hover{
  transform:translateY(-2px);
  background:rgba(217,241,241,.16);
  border-color:rgba(95,199,207,.42);
}
.ti-code-chip{
  padding:7px 10px;
  border-radius:12px;
  background:rgba(255,255,255,.045);
  backdrop-filter:blur(10px);
}

/* Headings */
.ti-heading-row h2{
  color:#022e64;
  letter-spacing:-.058em;
}
.ti-heading-row p{
  color:#5d6878;
}
.ti-kicker.ti-kicker-dark{
  color:#285ca8;
}

/* Journey rail becomes a modern Home-palette card rail. */
.ti-journey-track{
  gap:12px;
  padding:5px 2px 18px;
  border:0;
}
.ti-stage-btn{
  --stage-bg:#fff;
  --stage-fg:#022e64;
  --stage-copy:#667085;
  min-height:218px;
  border:1px solid rgba(2,46,100,.08);
  border-radius:22px;
  background:var(--stage-bg);
  color:var(--stage-fg);
  box-shadow:0 10px 28px rgba(2,46,100,.07);
  transition:transform .3s var(--ti-ease),box-shadow .3s ease,border-color .2s ease,background .2s ease;
}
.ti-stage-btn:nth-child(5n+1){
  --stage-bg:linear-gradient(135deg,#022e64,#0b5c85);
  --stage-fg:#fff;
  --stage-copy:rgba(255,255,255,.74);
}
.ti-stage-btn:nth-child(5n+2){--stage-bg:#fff}
.ti-stage-btn:nth-child(5n+3){--stage-bg:#d9f1f1}
.ti-stage-btn:nth-child(5n+4){
  --stage-bg:#f2e9dc;
  --stage-fg:#3c2f20;
  --stage-copy:#6d6254;
}
.ti-stage-btn:nth-child(5n+5){--stage-bg:#e9eef8}
.ti-stage-btn:last-child{border-right:1px solid rgba(2,46,100,.08)}
.ti-stage-btn:hover,.ti-stage-btn[aria-pressed="true"]{
  background:var(--stage-bg);
  transform:translateY(-5px);
  border-color:rgba(95,199,207,.42);
  box-shadow:0 20px 42px rgba(2,46,100,.14);
}
.ti-stage-btn h3{color:var(--stage-fg)}
.ti-stage-btn p{color:var(--stage-copy)}
.ti-stage-no{color:inherit;opacity:.64}
.ti-stage-arrow{color:inherit}
.ti-stage-btn:after{
  left:18px;right:18px;height:3px;
  background:#5fc7cf;
}

/* Popular help follows the same palette and no longer reads as a plain list. */
.ti-featured-main{
  background:linear-gradient(135deg,#022e64,#0b5c85);
  box-shadow:0 18px 46px rgba(2,46,100,.18);
  border:1px solid rgba(255,255,255,.12);
  transition:transform .32s var(--ti-ease),box-shadow .32s ease;
}
.ti-featured-main:before{
  background:
    radial-gradient(circle at 88% 8%,rgba(95,199,207,.30),transparent 30%),
    linear-gradient(120deg,transparent 0 34%,rgba(255,255,255,.08) 48%,transparent 62%),
    linear-gradient(to top,rgba(2,46,100,.72),transparent 68%);
  background-size:auto,220% 100%,auto;
  animation:tiFeaturedSweep 8s ease-in-out infinite;
}
@keyframes tiFeaturedSweep{
  0%,20%{background-position:center,-120% 0,center}
  72%,100%{background-position:center,170% 0,center}
}
.ti-featured-main:hover{
  transform:translateY(-5px);
  box-shadow:0 28px 62px rgba(2,46,100,.24);
}
.ti-featured-list{
  display:grid;
  gap:10px;
  border:0;
}
.ti-question-btn{
  --q-bg:#fff;
  --q-fg:#022e64;
  --q-copy:#667085;
  min-height:0;
  padding:18px;
  border:1px solid rgba(2,46,100,.08);
  border-radius:18px;
  background:var(--q-bg);
  color:var(--q-fg);
  box-shadow:0 8px 22px rgba(2,46,100,.055);
  transition:transform .24s var(--ti-ease),box-shadow .24s ease,border-color .2s ease;
}
.ti-question-btn:nth-child(4n+1){--q-bg:#fff}
.ti-question-btn:nth-child(4n+2){--q-bg:#d9f1f1}
.ti-question-btn:nth-child(4n+3){
  --q-bg:#f2e9dc;
  --q-fg:#3c2f20;
  --q-copy:#6d6254;
}
.ti-question-btn:nth-child(4n+4){--q-bg:#e9eef8}
.ti-question-btn:hover{
  background:var(--q-bg);
  transform:translateX(5px);
  border-color:rgba(95,199,207,.44);
  box-shadow:0 14px 30px rgba(2,46,100,.10);
}
.ti-question-copy strong{color:var(--q-fg)}
.ti-question-copy span{color:var(--q-copy)}
.ti-question-index{color:#285ca8}

/* Library gateway cards now use the exact Home service-card surfaces. */
.ti-gateway{
  border:1px solid rgba(2,46,100,.08);
  box-shadow:0 12px 30px rgba(2,46,100,.08);
  transform-style:preserve-3d;
  transition:transform .34s cubic-bezier(.16,1,.3,1),box-shadow .34s ease,border-color .2s ease;
}
.ti-gateway-a,.ti-gateway-f{
  background:linear-gradient(135deg,#022e64,#0b5c85);
  color:#fff;
}
.ti-gateway-b,.ti-gateway-g{
  background:#fff;
  color:#022e64;
}
.ti-gateway-c{
  background:#d9f1f1;
  color:#022e64;
}
.ti-gateway-d{
  background:#f2e9dc;
  color:#3c2f20;
}
.ti-gateway-e{
  background:#e9eef8;
  color:#022e64;
}
.ti-gateway:before{
  background:
    radial-gradient(circle at var(--fx-x,82%) var(--fx-y,12%),rgba(255,255,255,.30),transparent 26%),
    linear-gradient(120deg,rgba(255,255,255,.09),transparent 36%);
  opacity:.66;
}
.ti-gateway-a:before,.ti-gateway-f:before{
  background:
    radial-gradient(circle at var(--fx-x,82%) var(--fx-y,12%),rgba(95,199,207,.27),transparent 32%),
    linear-gradient(120deg,rgba(255,255,255,.11),transparent 38%);
}
.ti-gateway:after{
  border-color:currentColor;
  opacity:.13;
  transition:transform .55s var(--ti-ease),opacity .3s ease;
}
.ti-gateway:hover{
  transform:translateY(-7px);
  border-color:rgba(95,199,207,.42);
  box-shadow:0 24px 54px rgba(2,46,100,.16);
}
.ti-gateway:hover:after{
  transform:scale(1.14) translate(-7px,7px);
  opacity:.22;
}
.ti-gateway-icon{
  color:inherit;
  background:rgba(255,255,255,.15);
  border-color:rgba(255,255,255,.24);
  box-shadow:inset 0 1px rgba(255,255,255,.28);
}
.ti-gateway-b .ti-gateway-icon,.ti-gateway-c .ti-gateway-icon,.ti-gateway-d .ti-gateway-icon,.ti-gateway-e .ti-gateway-icon,.ti-gateway-g .ti-gateway-icon{
  background:rgba(2,46,100,.055);
  border-color:rgba(2,46,100,.08);
}
.ti-gateway h3{color:inherit}
.ti-gateway p{color:inherit;opacity:.72}
.ti-gateway-count{
  color:inherit;
  border-color:currentColor;
  opacity:.76;
}

/* Directory cards use the same Home five-card cycle. */
.ti-directory-list{gap:14px}
.ti-entity{
  --entity-bg:#fff;
  --entity-fg:#102033;
  --entity-title:#022e64;
  --entity-muted:#667085;
  --entity-tag-bg:#f5f8fb;
  --entity-tag-fg:#617287;
  background:var(--entity-bg);
  color:var(--entity-fg);
  border-color:rgba(2,46,100,.08);
  box-shadow:0 8px 24px rgba(2,46,100,.055);
  transition:transform .28s var(--ti-ease),box-shadow .28s ease,border-color .2s ease;
}
.ti-entity:nth-child(5n+1){
  --entity-bg:linear-gradient(135deg,#022e64,#0b5c85);
  --entity-fg:#fff;
  --entity-title:#fff;
  --entity-muted:rgba(255,255,255,.73);
  --entity-tag-bg:rgba(255,255,255,.12);
  --entity-tag-fg:#fff;
}
.ti-entity:nth-child(5n+2){--entity-bg:#fff}
.ti-entity:nth-child(5n+3){--entity-bg:#d9f1f1}
.ti-entity:nth-child(5n+4){
  --entity-bg:#f2e9dc;
  --entity-fg:#3c2f20;
  --entity-title:#3c2f20;
  --entity-muted:#6d6254;
  --entity-tag-bg:rgba(60,47,32,.07);
  --entity-tag-fg:#5c4d3c;
}
.ti-entity:nth-child(5n+5){--entity-bg:#e9eef8}
.ti-entity:hover{
  transform:translateY(-4px);
  border-color:rgba(95,199,207,.48);
  box-shadow:0 18px 38px rgba(2,46,100,.13);
}
.ti-entity-type{color:var(--entity-muted)}
.ti-entity-copy h3{color:var(--entity-title)}
.ti-entity-copy p{color:var(--entity-muted)}
.ti-mini-tag{
  background:var(--entity-tag-bg);
  color:var(--entity-tag-fg);
}
.ti-entity-chevron{color:var(--entity-title)}
.ti-entity-media{
  background:linear-gradient(145deg,#f3f6f8,#e9eef8);
}
.ti-entity-media::after{
  content:"";
  position:absolute;
  inset:0;
  pointer-events:none;
  background:linear-gradient(125deg,rgba(255,255,255,.20),transparent 36%);
}

/* Support chapter uses the Home hero-card gradient. */
.ti-support-chapter{
  background:linear-gradient(135deg,#022e64,#0b5c85);
  box-shadow:inset 0 1px rgba(255,255,255,.08);
}
.ti-support-chapter:before{
  content:"";
  position:absolute;
  inset:0;
  pointer-events:none;
  background:
    radial-gradient(circle at 10% 0%,rgba(95,199,207,.20),transparent 30%),
    radial-gradient(circle at 92% 80%,rgba(255,255,255,.08),transparent 26%),
    linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),
    linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px);
  background-size:auto,auto,46px 46px,46px 46px;
}
.ti-support-chapter:after{
  border-color:rgba(95,199,207,.26);
  animation:tiSupportOrbit 11s ease-in-out infinite alternate;
}
@keyframes tiSupportOrbit{
  to{transform:translate(-18px,20px) scale(1.08)}
}

/* Search and overlay glass treatment. */
.ti-search-shell{
  border:1px solid rgba(219,227,239,.92);
  box-shadow:0 34px 92px rgba(1,25,55,.28);
}
.ti-search-head{
  background:#fff;
}
.ti-search-item{
  transition:transform .18s ease,background .18s ease;
}
.ti-search-item:hover,.ti-search-item[data-active="true"]{
  background:#f3f6f8;
  transform:translateX(3px);
}
.ti-sheet{
  background:#f3f6f8;
}
.ti-sheet-head{
  background:rgba(255,255,255,.94);
  backdrop-filter:blur(18px);
}
.ti-field input,.ti-field select,.ti-field textarea{
  box-shadow:0 4px 14px rgba(2,46,100,.035);
  transition:border-color .2s ease,box-shadow .2s ease,transform .2s ease;
}
.ti-field input:focus,.ti-field select:focus,.ti-field textarea:focus{
  border-color:#5fc7cf;
  box-shadow:0 0 0 4px rgba(95,199,207,.12),0 10px 24px rgba(2,46,100,.08);
  transform:translateY(-1px);
}

/* Detail experience */
.ti-detail-view{
  background:
    radial-gradient(circle at 90% 8%,rgba(95,199,207,.09),transparent 20%),
    linear-gradient(180deg,#f3f6f8 0%,#fff 24%,#f7faff 100%);
}
.ti-profile-hero{
  background:linear-gradient(135deg,#022e64,#0b5c85);
  box-shadow:0 24px 64px rgba(2,46,100,.18);
}
.ti-profile-hero:before{
  background:
    radial-gradient(circle at 80% 12%,rgba(95,199,207,.24),transparent 30%),
    linear-gradient(90deg,rgba(2,46,100,.96) 0%,rgba(2,46,100,.80) 52%,rgba(2,46,100,.22) 100%);
}
.ti-profile-hero:after{
  content:"";
  position:absolute;
  inset:0;
  z-index:1;
  pointer-events:none;
  opacity:.42;
  background:
    linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),
    linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px);
  background-size:42px 42px;
  mask-image:linear-gradient(90deg,#000,rgba(0,0,0,.4),transparent);
}
.ti-profile-copy{z-index:3}
.ti-profile-image{z-index:0}
.ti-section-nav-wrap{
  background:rgba(255,255,255,.90);
  border-color:rgba(2,46,100,.08);
  box-shadow:0 10px 28px rgba(2,46,100,.055);
}
.ti-section-link:hover,.ti-section-link[aria-current="true"]{
  background:#e9eef8;
  color:#022e64;
}
.ti-story-stack{
  gap:14px;
}
.ti-story-section{
  --story-bg:#fff;
  --story-fg:#102033;
  --story-title:#022e64;
  --story-muted:#4d5f74;
  scroll-margin-top:94px;
  border:1px solid rgba(2,46,100,.07);
  border-radius:22px;
  padding:28px;
  background:var(--story-bg);
  box-shadow:0 9px 28px rgba(2,46,100,.055);
}
.ti-story-section:first-child{border-top:1px solid rgba(2,46,100,.07);padding-top:28px}
.ti-story-section:nth-child(4n+2){--story-bg:#e9eef8}
.ti-story-section:nth-child(4n+3){--story-bg:#d9f1f1}
.ti-story-section:nth-child(4n+4){
  --story-bg:#f2e9dc;
  --story-fg:#3c2f20;
  --story-title:#3c2f20;
  --story-muted:#6d6254;
}
.ti-story-section h2{color:var(--story-title)}
.ti-story-section p,.ti-rich-text,.ti-bullet-list li{color:var(--story-muted)}
.ti-story-eyebrow{color:#285ca8}
.ti-aside-card{
  border-color:rgba(2,46,100,.07);
  box-shadow:0 9px 28px rgba(2,46,100,.055);
}
.ti-detail-aside .ti-aside-card:nth-child(1){background:#e9eef8}
.ti-detail-aside .ti-aside-card:nth-child(2){background:#fff}
.ti-fact:nth-child(4n+1){background:#fff}
.ti-fact:nth-child(4n+2){background:#d9f1f1}
.ti-fact:nth-child(4n+3){background:#f2e9dc}
.ti-fact:nth-child(4n+4){background:#e9eef8}
.ti-fact{
  border-color:rgba(2,46,100,.07);
  box-shadow:0 5px 14px rgba(2,46,100,.035);
}

/* Alexandra */
.ti-alexandra-launcher{
  border-color:rgba(2,46,100,.09);
  background:rgba(255,255,255,.96);
  box-shadow:0 16px 44px rgba(2,46,100,.18);
  transition:transform .22s var(--ti-ease),box-shadow .22s ease;
}
.ti-alexandra-launcher::before{
  content:"";
  position:absolute;
  left:7px;
  top:7px;
  width:38px;
  height:38px;
  border-radius:50%;
  border:1px solid rgba(95,199,207,.42);
  animation:tiAlexPulse 2.4s ease-out infinite;
  pointer-events:none;
}
@keyframes tiAlexPulse{
  0%{transform:scale(.86);opacity:.72}
  80%,100%{transform:scale(1.55);opacity:0}
}
.ti-alexandra-launcher:hover{
  transform:translateY(-3px);
  box-shadow:0 22px 52px rgba(2,46,100,.24);
}

/* Scroll reveal + pointer-reactive surfaces */
.ti-motion-reveal{
  opacity:0;
  transform:translateY(24px) scale(.988);
}
.ti-motion-reveal.ti-motion-visible{
  opacity:1;
  transform:none;
  transition:
    opacity .72s cubic-bezier(.16,1,.3,1),
    transform .72s cubic-bezier(.16,1,.3,1);
}
.ti-reactive-card{
  --fx-x:50%;
  --fx-y:50%;
  will-change:transform;
}
.ti-reactive-card::selection{background:rgba(95,199,207,.24)}

@media(max-width:760px){
  .ti-atlas{min-height:680px}
  .ti-stage-btn{min-height:196px}
  .ti-question-btn:hover{transform:none}
  .ti-story-section{padding:22px;border-radius:18px}
  .ti-story-section:first-child{padding-top:22px}
}
@media(prefers-reduced-motion:reduce){
  .ti-atlas:before,.ti-orbit,.ti-route-art circle,.ti-featured-main:before,.ti-support-chapter:after,.ti-alexandra-launcher::before{
    animation:none!important;
  }
  .ti-motion-reveal{opacity:1!important;transform:none!important}
}

</style>
</head>
<body>
<div id="tiLive" class="ti-visually-hidden" aria-live="polite"></div>

<section id="tiHome" class="ti-home" aria-label="SKANDI Travel Info">
  <header class="ti-atlas">
    <div class="ti-orbit ti-orbit-a"></div>
    <div class="ti-orbit ti-orbit-b"></div>
    <svg class="ti-route-art" viewBox="0 0 1440 760" preserveAspectRatio="none" aria-hidden="true">
      <defs><linearGradient id="tiRouteGradient" x1="0" x2="1"><stop offset="0" stop-color="#5fc7cf" stop-opacity=".05"/><stop offset=".5" stop-color="#9de0e5" stop-opacity=".8"/><stop offset="1" stop-color="#d1bc98" stop-opacity=".18"/></linearGradient></defs>
      <path d="M-80,620 C270,300 525,285 810,430 C1060,558 1250,420 1510,140"/>
      <path d="M50,180 C350,360 650,125 940,250 C1180,352 1280,310 1470,215"/>
      <circle cx="810" cy="430" r="3"/><circle cx="940" cy="250" r="3"/><circle cx="1260" cy="410" r="2.5"/>
    </svg>
    <div class="ti-wrap ti-atlas-inner">
      <div class="ti-atlas-copy">
        <div class="ti-kicker">SKANDI Travel Companion</div>
        <h1>Travel info,<br>made effortless.</h1>
        <p class="ti-atlas-lede">Airline and airport guidance, baggage, travel requirements and destination support, brought together for every stage of your journey.</p>
        <div id="tiNetworkMeta" class="ti-network-meta" aria-label="Published Travel Info summary"></div>
        <form id="tiHeroSearchForm" class="ti-command" role="search" autocomplete="off">
          <span id="tiHeroSearchIcon" aria-hidden="true"></span>
          <label class="ti-visually-hidden" for="tiHeroSearch">Search Travel Info</label>
          <input id="tiHeroSearch" type="search" placeholder="What do you need to know?" enterkeyhint="search" autocomplete="off">
          <button class="ti-btn ti-btn-aqua" type="submit"><span>Search</span><span id="tiSearchArrow" aria-hidden="true"></span></button>
        </form>
        <div class="ti-action-rail" aria-label="Travel Info quick actions">
          <button class="ti-action-chip" type="button" data-action="baggage"><span data-icon="bag"></span>Baggage</button>
          <button class="ti-action-chip" type="button" data-action="requirements"><span data-icon="passport"></span>Travel requirements</button>
          <button class="ti-action-chip" type="button" data-action="airports"><span data-icon="pin"></span>Airports</button>
          <button class="ti-action-chip" type="button" data-action="airlines"><span data-icon="aircraft"></span>Airlines</button>
          <button class="ti-action-chip" type="button" data-action="support"><span data-icon="help"></span>Support</button>
        </div>
        <div id="tiStatus" class="ti-atlas-status" hidden></div>
      </div>
    </div>
    <div id="tiAtlasCodes" class="ti-atlas-codes" aria-hidden="true"></div>
  </header>

  <main>
    <section class="ti-section ti-section-tight" aria-labelledby="tiJourneyHeading">
      <div class="ti-wrap">
        <div class="ti-heading-row">
          <div><div class="ti-kicker ti-kicker-dark">Your journey</div><h2 id="tiJourneyHeading">Know what matters, when it matters.</h2></div>
          <p>Move through your trip from planning to return. Each stage opens the guidance currently published for that part of the journey.</p>
        </div>
        <div class="ti-journey-shell"><div id="tiJourneyTrack" class="ti-journey-track"></div></div>
      </div>
    </section>

    <section class="ti-section ti-section-tint" aria-labelledby="tiPopularHeading">
      <div class="ti-wrap">
        <div class="ti-heading-row">
          <div><div class="ti-kicker ti-kicker-dark">Popular help</div><h2 id="tiPopularHeading">Answers travelers open first.</h2></div>
        </div>
        <div id="tiFeaturedHelp" class="ti-featured-layout"></div>
      </div>
    </section>

    <section class="ti-section" aria-labelledby="tiLibrariesHeading">
      <div class="ti-wrap">
        <div class="ti-heading-row">
          <div><div class="ti-kicker ti-kicker-dark">Explore Travel Info</div><h2 id="tiLibrariesHeading">A guide for every part of the trip.</h2></div>
          <p>Browse the live SKANDI information library. New published airlines, airports and travel products appear here automatically.</p>
        </div>
        <div id="tiGatewayGrid" class="ti-gateway-grid"></div>
      </div>
    </section>

    <section id="tiDirectory" class="ti-section ti-section-tint" aria-labelledby="tiDirectoryHeading">
      <div class="ti-wrap">
        <div class="ti-heading-row">
          <div><div class="ti-kicker ti-kicker-dark">Travel library</div><h2 id="tiDirectoryHeading">Browse Travel Info.</h2></div>
          <p id="tiDirectoryLead">Airlines, airports, stays, transfers and experiences, plus help articles for the questions that come up along the way.</p>
        </div>
        <div class="ti-directory-shell">
          <div class="ti-filter-row">
            <div id="tiFilterTabs" class="ti-filter-tabs" role="toolbar" aria-label="Travel Info filters"></div>
            <div id="tiResultCount" class="ti-result-count"></div>
          </div>
          <div id="tiDirectoryList" class="ti-directory-list"></div>
          <div id="tiLoadMoreWrap" class="ti-load-more" hidden><button id="tiLoadMore" class="ti-btn ti-btn-light" type="button">Show more</button></div>
        </div>
      </div>
    </section>

    <section class="ti-support-chapter" aria-labelledby="tiSupportHeading">
      <div class="ti-wrap ti-support-grid">
        <div>
          <div class="ti-kicker">SKANDI Support</div>
          <h2 id="tiSupportHeading">Need something more specific?</h2>
          <p>Alexandra can take you into the shared SKANDI support experience, or you can send a travel-information request directly to our support team.</p>
        </div>
        <div class="ti-support-actions">
          <button class="ti-btn ti-btn-ghost" type="button" data-action="alexandra"><span data-icon="spark"></span>Ask Alexandra</button>
          <button class="ti-btn ti-btn-aqua" type="button" data-action="support"><span data-icon="message"></span>Contact support</button>
        </div>
      </div>
    </section>
  </main>
</section>

<section id="tiDetail" class="ti-detail-view" data-active="false" aria-label="Travel Info detail">
  <div class="ti-wrap">
    <div class="ti-backbar"><button id="tiBack" class="ti-back-btn" type="button"><span data-icon="back"></span>Back to Travel Info</button></div>
    <div id="tiDetailMount"></div>
  </div>
</section>

<div id="tiSearchLayer" class="ti-search-layer" data-open="false" aria-hidden="true">
  <button class="ti-scrim" type="button" data-close-search aria-label="Close search"></button>
  <section class="ti-search-shell" role="dialog" aria-modal="true" aria-labelledby="tiSearchDialogTitle">
    <h2 id="tiSearchDialogTitle" class="ti-visually-hidden">Search Travel Info</h2>
    <div class="ti-search-head">
      <span id="tiSearchDialogIcon" aria-hidden="true"></span>
      <label class="ti-visually-hidden" for="tiSearchInput">Search the SKANDI Travel Info library</label>
      <input id="tiSearchInput" type="search" placeholder="Search airline, airport, baggage, passport..." autocomplete="off">
      <button class="ti-search-esc" type="button" data-close-search>Esc</button>
    </div>
    <div id="tiSearchResults" class="ti-search-results"></div>
  </section>
</div>

<div id="tiOverlay" class="ti-overlay" data-open="false" aria-hidden="true">
  <button class="ti-scrim" type="button" data-close-overlay aria-label="Close panel"></button>
  <section id="tiSheet" class="ti-sheet" role="dialog" aria-modal="true" aria-labelledby="tiSheetTitle">
    <header class="ti-sheet-head">
      <div><div id="tiSheetKicker" class="ti-kicker ti-kicker-dark">Travel Info</div><h2 id="tiSheetTitle">Travel Info</h2><p id="tiSheetSubtitle"></p></div>
      <button id="tiSheetClose" class="ti-round-btn" type="button" data-close-overlay aria-label="Close panel"><span data-icon="close"></span></button>
    </header>
    <div id="tiSheetBody" class="ti-sheet-body"></div>
  </section>
</div>

<button id="tiAlexandraLauncher" class="ti-alexandra-launcher" type="button" aria-label="Ask Alexandra">
  <span class="ti-alexandra-avatar"><video src="https://video.wixstatic.com/video/394052_b44198f20fc44baa90b3fc03d87602ea/1080p/mp4/file.mp4" autoplay loop muted playsinline preload="metadata"></video></span>
  <span class="ti-alexandra-label"><strong>Ask Alexandra</strong><span>SKANDI Digital Support</span></span>
</button>

<script>
(()=>{
"use strict";

/* CONTRACT */
const SOURCE="SKANDI_PUBLIC_TRAVEL_INFO";
const PARENT="SKANDI_WIX_PARENT";
const VERSION="BACKEND-BASE-1.0-B011.2";
const PAGE_SIZE=24;
const REDUCED=window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches===true;

/* SERVER STATE */
let DATA={
  airlines:[],airports:[],hotels:[],transfers:[],tours:[],activities:[],tickets:[],
  helpCenter:{groups:[],topics:[]},articles:[],travelRequirements:[]
};

/* UI STATE */
const STATE={
  dataState:"idle",
  activeLibrary:"all",
  activeJourneyGroup:"",
  activeDetail:null,
  searchIndex:[],
  searchOpen:false,
  searchQuery:"",
  searchCursor:0,
  visibleCount:PAGE_SIZE,
  directoryOverride:null,
  homeScrollY:0,
  overlayMode:"",
  overlayReturnFocus:null,
  requirementsPending:false,
  supportPending:false,
  aircraftBundles:new Map(),
  aircraftPending:new Set(),
  weatherCache:new Map(),
  weatherPending:new Set()
};

const $=id=>document.getElementById(id);
const arr=v=>Array.isArray(v)?v:[];
const obj=v=>v&&typeof v==="object"&&!Array.isArray(v)?v:{};
const text=v=>String(v??"").trim();
const lower=v=>text(v).toLowerCase();
const num=v=>Number.isFinite(Number(v))?Number(v):null;
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const human=v=>text(v).replace(/[_-]+/g," ").replace(/\b\w/g,c=>c.toUpperCase());
const uniq=a=>[...new Set(arr(a).map(text).filter(Boolean))];
const safeInternal=p=>/^\/(?!\/)[^\s]*$/.test(text(p));
const safeExternal=u=>{try{const x=new URL(text(u));return x.protocol==="https:"?x.href:""}catch(_){return""}};
const movement=()=>REDUCED?"auto":"smooth";

const ICONS={
  search:'<svg class="ti-icon" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.7-3.7"></path></svg>',
  arrow:'<svg class="ti-icon ti-icon-sm" viewBox="0 0 24 24"><path d="M5 12h14"></path><path d="m13 6 6 6-6 6"></path></svg>',
  back:'<svg class="ti-icon ti-icon-sm" viewBox="0 0 24 24"><path d="M19 12H5"></path><path d="m11 18-6-6 6-6"></path></svg>',
  close:'<svg class="ti-icon" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"></path></svg>',
  bag:'<svg class="ti-icon ti-icon-sm" viewBox="0 0 24 24"><rect x="5" y="7" width="14" height="13" rx="2"></rect><path d="M9 7V5a3 3 0 0 1 6 0v2M9 11v5M15 11v5"></path></svg>',
  passport:'<svg class="ti-icon ti-icon-sm" viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="18" rx="2"></rect><circle cx="12" cy="11" r="3"></circle><path d="M9 17h6M12 8v6M9 11h6"></path></svg>',
  pin:'<svg class="ti-icon ti-icon-sm" viewBox="0 0 24 24"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"></path><circle cx="12" cy="10" r="2.5"></circle></svg>',
  aircraft:'<svg class="ti-icon ti-icon-sm" viewBox="0 0 24 24"><path d="M3 11.5 10 9V4.5c0-1.2.9-2.5 2-2.5s2 1.3 2 2.5V9l7 2.5v2L14 13v5l2.5 1.5V21L12 20l-4.5 1v-1.5L10 18v-5l-7 .5Z"></path></svg>',
  help:'<svg class="ti-icon ti-icon-sm" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"></circle><path d="M9.8 9a2.4 2.4 0 1 1 3.7 2c-1 .6-1.5 1.1-1.5 2.2"></path><path d="M12 17h.01"></path></svg>',
  message:'<svg class="ti-icon ti-icon-sm" viewBox="0 0 24 24"><path d="M5 18 3 21l5-1h9a4 4 0 0 0 4-4V7a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v7a4 4 0 0 0 2 4Z"></path></svg>',
  spark:'<svg class="ti-icon ti-icon-sm" viewBox="0 0 24 24"><path d="m12 3 1.4 4.1L17.5 8.5l-4.1 1.4L12 14l-1.4-4.1-4.1-1.4 4.1-1.4L12 3Z"></path><path d="m18 14 .8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8L18 14Z"></path></svg>',
  hotel:'<svg class="ti-icon ti-icon-lg" viewBox="0 0 24 24"><path d="M3 20V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v14M17 10h2a2 2 0 0 1 2 2v8M7 8h2M12 8h2M7 12h2M12 12h2M7 16h2M12 16h2M2 20h20"></path></svg>',
  transfer:'<svg class="ti-icon ti-icon-lg" viewBox="0 0 24 24"><path d="M4 7h13l3 4v6H4Z"></path><path d="M7 7V4h7v3M6 17v2M18 17v2"></path><circle cx="7" cy="17" r="2"></circle><circle cx="17" cy="17" r="2"></circle></svg>',
  tour:'<svg class="ti-icon ti-icon-lg" viewBox="0 0 24 24"><path d="M4 20V6l5-2 6 2 5-2v14l-5 2-6-2-5 2Z"></path><path d="M9 4v14M15 6v14"></path></svg>',
  ticket:'<svg class="ti-icon ti-icon-lg" viewBox="0 0 24 24"><path d="M4 7h16v4a2 2 0 0 0 0 4v4H4v-4a2 2 0 0 0 0-4Z"></path><path d="M12 7v12"></path></svg>',
  activity:'<svg class="ti-icon ti-icon-lg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"></circle><path d="m12 7 1.6 3.4L17 12l-3.4 1.6L12 17l-1.6-3.4L7 12l3.4-1.6L12 7Z"></path></svg>',
  chevron:'<svg class="ti-icon ti-icon-sm" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"></path></svg>',
  external:'<svg class="ti-icon ti-icon-sm" viewBox="0 0 24 24"><path d="M14 5h5v5M12 12l7-7"></path><path d="M19 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"></path></svg>',
  refresh:'<svg class="ti-icon ti-icon-sm" viewBox="0 0 24 24"><path d="M20 7v5h-5"></path><path d="M18.5 16a8 8 0 1 1 .8-8.4L20 12"></path></svg>',
  weather:'<svg class="ti-icon ti-icon-sm" viewBox="0 0 24 24"><path d="M7 17h10a4 4 0 0 0 .6-8 6 6 0 0 0-11.4 1.8A3.2 3.2 0 0 0 7 17Z"></path></svg>'
};
function icon(name,cls=""){const raw=ICONS[name]||ICONS.help;return cls?raw.replace('class="ti-icon','class="ti-icon '+cls):raw}
function hydrateStaticIcons(root=document){root.querySelectorAll?.("[data-icon]").forEach(el=>{el.innerHTML=icon(el.dataset.icon)})}

function post(type,payload={}){
  try{window.parent.postMessage({source:SOURCE,type,payload,timestamp:new Date().toISOString()},"*")}catch(_){ }
}
function announce(message){$("tiLive").textContent=text(message)}
function setStatus(message,retry=false){
  const el=$("tiStatus");el.replaceChildren();const msg=text(message);el.hidden=!msg;if(!msg)return;
  const span=document.createElement("span");span.textContent=msg;el.append(span);
  if(retry){const button=document.createElement("button");button.type="button";button.className="ti-action-chip";button.style.marginLeft="10px";button.innerHTML=`${icon("refresh")} Try again`;button.addEventListener("click",retryData,{once:true});el.append(button)}
}
function transition(fn){if(!REDUCED&&document.startViewTransition){try{return document.startViewTransition(fn)}catch(_){}}return fn()}

function libraryDefs(){return[
  {key:"airlines",title:"Airline Information",short:"Airlines",icon:"aircraft",className:"ti-gateway-a",sub:"Baggage, check-in, onboard service and aircraft cabins."},
  {key:"airports",title:"Airport Information",short:"Airports",icon:"pin",className:"ti-gateway-b",sub:"Airport facts, transport, terminals and traveler guidance."},
  {key:"hotels",title:"Hotel Information",short:"Hotels",icon:"hotel",className:"ti-gateway-c",sub:"Published stay information and practical hotel guidance."},
  {key:"transfers",title:"Transfer Information",short:"Transfers",icon:"transfer",className:"ti-gateway-d",sub:"Meeting points, routes, luggage and transfer instructions."},
  {key:"tours",title:"Tours",short:"Tours",icon:"tour",className:"ti-gateway-e",sub:"Tour details, meeting information and published itineraries."},
  {key:"activities",title:"Activities & Excursions",short:"Activities",icon:"activity",className:"ti-gateway-f",sub:"Experience information, entry guidance and local details."},
  {key:"tickets",title:"Tickets & Vouchers",short:"Tickets",icon:"ticket",className:"ti-gateway-g",sub:"How to use published tickets, vouchers and timed-entry documents."}
]}
function libraryDef(key){return libraryDefs().find(x=>x.key===key)}
function itemsFor(key){return key==="faq"?arr(DATA.helpCenter?.topics):key==="articles"?arr(DATA.articles):arr(DATA[key])}
function itemTitle(x){return text(x?.name||x?.title||x?.shortName||x?.code||x?.iataCode||x?.iata||"Untitled")}
function itemSummary(x){return text(x?.summary||x?.subtitle||x?.description||x?.excerpt||x?.body||x?.information||x?.city||x?.country||"")}
function itemImage(x){return text(x?.heroImage||x?.image||x?.logo||x?.logoIcon||x?.image_url||x?.imageUrl||"")}
function itemCode(x){return text(x?.iataCode||x?.iata||x?.code||x?.icaoCode||x?.icao||"")}
function displayImageUrl(x){return safeExternal(itemImage(x))}
function libraryLabel(key){return key==="faq"||key==="articles"?"Travel Help":libraryDef(key)?.title||"Travel Info"}
function contentSearchText(x){
  return lower([itemTitle(x),itemCode(x),x?.icaoCode,x?.icao,x?.city,x?.country,x?.summary,x?.subtitle,x?.description,x?.excerpt,x?.body,x?.category,x?.destination,x?.aircraftFamilies,x?.loyaltyProgram,x?.baggageAllowance].flat().join(" "))
}
function normalizeContentItem(item,library){return {...item,_library:library,_label:libraryLabel(library),_search:contentSearchText(item)}}

function buildSearchIndex(){
  const index=[];
  libraryDefs().forEach(def=>itemsFor(def.key).forEach(x=>{const typeTerms=def.key==="airlines"?"airline baggage check-in boarding cabin seat food wifi fleet":def.key==="airports"?"airport terminal transfer check-in security lounge transport":def.key==="hotels"?"hotel stay arrival facilities":def.key==="transfers"?"transfer meeting point luggage route":def.key==="tours"?"tour itinerary meeting pickup":def.key==="activities"?"activity excursion attraction entry":def.key==="tickets"?"ticket voucher qr entry":"";index.push({kind:"content",group:def.short,item:normalizeContentItem(x,def.key),search:`${contentSearchText(x)} ${typeTerms}`})}));
  arr(DATA.helpCenter?.topics).forEach(x=>index.push({kind:"content",group:"Travel Help",item:normalizeContentItem(x,"faq"),search:contentSearchText(x)}));
  arr(DATA.articles).forEach(x=>index.push({kind:"content",group:"Travel Help",item:normalizeContentItem(x,"articles"),search:contentSearchText(x)}));
  const utilities=[
    {id:"baggage",title:"Baggage allowance",sub:"Find published baggage guidance by airline.",keywords:"baggage bag carry on checked luggage allowance weight suitcase",icon:"bag"},
    {id:"requirements",title:"Travel requirements",sub:"Check passport and entry guidance for your journey.",keywords:"passport visa entry requirements nationality transit document immigration",icon:"passport"},
    {id:"support",title:"Travel Support",sub:"Send a question to SKANDI Travel Support.",keywords:"support help contact booking question assistance",icon:"message"}
  ];
  utilities.forEach(u=>index.push({kind:"utility",group:"Quick actions",utility:u,search:lower(`${u.title} ${u.sub} ${u.keywords}`)}));
  STATE.searchIndex=index;
}

function networkCounts(){return{
  airlines:arr(DATA.airlines).length,
  airports:arr(DATA.airports).length,
  help:arr(DATA.helpCenter?.topics).length+arr(DATA.articles).length
}}
function renderNetworkMeta(){
  const c=networkCounts();const parts=[];
  if(c.airlines)parts.push(`${c.airlines} airline guide${c.airlines===1?"":"s"}`);
  if(c.airports)parts.push(`${c.airports} airport${c.airports===1?"":"s"}`);
  if(c.help)parts.push(`${c.help} help item${c.help===1?"":"s"}`);
  $("tiNetworkMeta").innerHTML=parts.length?parts.map((v,i)=>`<span>${i?"<i></i>":""}${esc(v)}</span>`).join(""):`<span>Travel guidance updates automatically when new information is published.</span>`;
}
function renderAtlasCodes(){
  const airports=arr(DATA.airports).filter(a=>itemCode(a)).slice(0,4);
  $("tiAtlasCodes").innerHTML=airports.map(a=>`<div class="ti-code-chip"><strong>${esc(itemCode(a).slice(0,4))}</strong><span>${esc(text(a.city||a.country||""))}</span></div>`).join("")
}

function fallbackJourneyGroups(){return[
  {id:"before",title:"Before you travel",subtitle:"Requirements, documents, baggage and planning."},
  {id:"day",title:"Day of travel",subtitle:"Airport, check-in, baggage and disruption guidance."},
  {id:"flight",title:"The flight",subtitle:"Airline, cabin, seating and onboard information."},
  {id:"hotel",title:"The hotel",subtitle:"Arrival, stay information and local guidance."},
  {id:"destination",title:"At your destination",subtitle:"Transfers, tours, activities and local support."},
  {id:"return",title:"Coming home",subtitle:"Return travel, airport and baggage guidance."}
]}
function journeyGroups(){const live=arr(DATA.helpCenter?.groups).slice().sort((a,b)=>(Number(a.sortOrder)||0)-(Number(b.sortOrder)||0));return live.length?live:fallbackJourneyGroups()}
function renderJourney(){
  const groups=journeyGroups();
  $("tiJourneyTrack").innerHTML=groups.map((g,i)=>`<button class="ti-stage-btn" type="button" data-group="${esc(text(g.id||g.groupId||g.group_id||`stage-${i}`))}" aria-pressed="${STATE.activeJourneyGroup===text(g.id||g.groupId||g.group_id)?"true":"false"}"><span class="ti-stage-no">${String(i+1).padStart(2,"0")}</span><span class="ti-stage-arrow">${icon("arrow")}</span><h3>${esc(g.title||"Travel help")}</h3><p>${esc(g.subtitle||g.body||"Browse guidance for this part of your journey.")}</p></button>`).join("");
  $("tiJourneyTrack").querySelectorAll("[data-group]").forEach(btn=>btn.addEventListener("click",()=>selectJourney(btn.dataset.group,btn.querySelector("h3")?.textContent||"Travel help")))
}
function selectJourney(id,title){
  STATE.activeJourneyGroup=id;STATE.activeLibrary="faq";STATE.visibleCount=PAGE_SIZE;
  const topics=arr(DATA.helpCenter?.topics).filter(t=>text(t.groupId||t.group_id)===text(id)).map(x=>normalizeContentItem(x,"faq"));
  STATE.directoryOverride=topics;
  renderJourney();renderFilters();renderDirectory();
  $("tiDirectoryHeading").textContent=title;$("tiDirectoryLead").textContent=topics.length?"Published guidance for this stage of your journey.":"No published topics are currently assigned to this stage.";
  $("tiDirectory").scrollIntoView({behavior:movement(),block:"start"});
}

function featuredTopics(){let list=arr(DATA.helpCenter?.topics).filter(t=>t.featured===true);if(!list.length)list=arr(DATA.helpCenter?.topics).slice(0,6);return list.slice(0,6)}
function renderFeaturedHelp(){
  const topics=featuredTopics();const host=$("tiFeaturedHelp");
  if(!topics.length){host.innerHTML=`<div class="ti-empty-state" style="grid-column:1/-1"><strong>Travel answers are being updated.</strong><span>Published help topics will appear here automatically.</span></div>`;return}
  const lead=topics[0];const rest=topics.slice(1);
  host.innerHTML=`<article class="ti-featured-main"><div class="ti-kicker">Featured guidance</div><h3>${esc(lead.title||"Travel information")}</h3><p>${esc(text(lead.subtitle||lead.excerpt||lead.body).slice(0,260))}</p><button class="ti-btn ti-btn-aqua" type="button" data-featured-open="0">Read guidance ${icon("arrow")}</button></article><div class="ti-featured-list">${rest.map((q,i)=>`<button class="ti-question-btn" type="button" data-featured-open="${i+1}"><span class="ti-question-index">${String(i+2).padStart(2,"0")}</span><span class="ti-question-copy"><strong>${esc(q.title||"Travel question")}</strong><span>${esc(text(q.subtitle||q.excerpt||q.body).slice(0,120))}</span></span>${icon("chevron")}</button>`).join("")}</div>`;
  host.querySelectorAll("[data-featured-open]").forEach(btn=>btn.addEventListener("click",()=>openDetail(normalizeContentItem(topics[Number(btn.dataset.featuredOpen)],"faq"))))
}

function renderGateways(){
  $("tiGatewayGrid").innerHTML=libraryDefs().map(def=>`<button class="ti-gateway ${def.className}" type="button" data-library-gateway="${def.key}"><span class="ti-gateway-icon">${icon(def.icon)}</span><h3>${esc(def.title)}</h3><p>${esc(def.sub)}</p><span class="ti-gateway-count">${itemsFor(def.key).length} published</span></button>`).join("");
  $("tiGatewayGrid").querySelectorAll("[data-library-gateway]").forEach(btn=>btn.addEventListener("click",()=>setLibrary(btn.dataset.libraryGateway,true)))
}
function filterDefinitions(){return[{key:"all",title:"All"},...libraryDefs().map(d=>({key:d.key,title:d.short})),{key:"faq",title:"Travel Help"}]}
function setLibrary(key,scroll=false){
  STATE.activeLibrary=key;STATE.activeJourneyGroup="";STATE.directoryOverride=null;STATE.visibleCount=PAGE_SIZE;
  const def=libraryDef(key);$("tiDirectoryHeading").textContent=key==="all"?"Browse Travel Info.":key==="faq"?"Travel help.":def?.title||"Travel Info";
  $("tiDirectoryLead").textContent=key==="all"?"Airlines, airports, stays, transfers and experiences, plus help articles for the questions that come up along the way.":key==="faq"?"Published help topics and articles for every stage of the journey.":def?.sub||"Published Travel Info.";
  renderJourney();renderFilters();renderDirectory();
  if(scroll)$("tiDirectory").scrollIntoView({behavior:movement(),block:"start"})
}
function renderFilters(){
  $("tiFilterTabs").innerHTML=filterDefinitions().map(d=>`<button class="ti-filter-btn" type="button" data-filter="${d.key}" aria-pressed="${STATE.activeLibrary===d.key?"true":"false"}">${esc(d.title)}</button>`).join("");
  $("tiFilterTabs").querySelectorAll("[data-filter]").forEach(btn=>btn.addEventListener("click",()=>setLibrary(btn.dataset.filter,false)))
}
function directoryRows(){
  if(STATE.directoryOverride)return STATE.directoryOverride;
  const rows=[];
  const add=(key,list)=>arr(list).forEach(x=>rows.push(normalizeContentItem(x,key)));
  if(STATE.activeLibrary==="all"){
    libraryDefs().forEach(d=>add(d.key,DATA[d.key]));add("faq",DATA.helpCenter?.topics);add("articles",DATA.articles)
  }else if(STATE.activeLibrary==="faq"){
    add("faq",DATA.helpCenter?.topics);add("articles",DATA.articles)
  }else add(STATE.activeLibrary,DATA[STATE.activeLibrary]);
  return rows.sort((a,b)=>(Number(a.sortOrder)||9999)-(Number(b.sortOrder)||9999)||itemTitle(a).localeCompare(itemTitle(b)))
}
function renderEntityMedia(x){
  const url=displayImageUrl(x),code=itemCode(x)||itemTitle(x).slice(0,2).toUpperCase(),logo=x._library==="airlines"&&url;
  return `<div class="ti-entity-media${logo?" ti-logo-media":""}">${url?`<img src="${esc(url)}" alt="" loading="lazy" referrerpolicy="no-referrer">`:`<span class="ti-fallback-mark">${esc(code.slice(0,4))}</span>`}</div>`
}
function entityTags(x){const tags=[];const c=itemCode(x);if(c)tags.push(c);if(x.city)tags.push(x.city);if(x.country)tags.push(x.country);if(x.category)tags.push(x.category);return uniq(tags).slice(0,4)}
function renderDirectory(){
  const rows=directoryRows();const visible=rows.slice(0,STATE.visibleCount);$("tiResultCount").textContent=`${rows.length} published ${rows.length===1?"item":"items"}`;
  if(!rows.length){$("tiDirectoryList").innerHTML=`<div class="ti-empty-state"><strong>No published information here yet.</strong><span>Try another library or search the full Travel Info collection.</span></div>`;$("tiLoadMoreWrap").hidden=true;return}
  $("tiDirectoryList").innerHTML=visible.map((x,i)=>`<button class="ti-entity" type="button" data-directory-index="${i}" aria-label="Open ${esc(itemTitle(x))}">${renderEntityMedia(x)}<span class="ti-entity-copy"><span class="ti-entity-type">${esc(x._label||libraryLabel(x._library))}</span><h3>${esc(itemTitle(x))}</h3><p>${esc(itemSummary(x).slice(0,250))}</p><span class="ti-entity-tags">${entityTags(x).map(t=>`<span class="ti-mini-tag">${esc(t)}</span>`).join("")}</span></span><span class="ti-entity-chevron">${icon("chevron")}</span></button>`).join("");
  $("tiDirectoryList").querySelectorAll("[data-directory-index]").forEach(btn=>btn.addEventListener("click",()=>openDetail(visible[Number(btn.dataset.directoryIndex)])));
  $("tiLoadMoreWrap").hidden=visible.length>=rows.length;$("tiLoadMore").textContent=`Show ${Math.min(PAGE_SIZE,rows.length-visible.length)} more`;
}

function buildSearchResults(q){
  const term=lower(q);if(!term)return STATE.searchIndex.slice(0,14);
  return STATE.searchIndex.map(entry=>{
    let score=entry.search.includes(term)?40:0;const title=lower(entry.kind==="utility"?entry.utility.title:itemTitle(entry.item));
    if(title===term)score+=100;else if(title.startsWith(term))score+=65;
    if(entry.kind==="utility"&&entry.utility.id==="requirements"&&/(passport|visa|entry|requirement)/.test(term))score+=75;
    if(entry.kind==="utility"&&entry.utility.id==="baggage"&&/(baggage|bag|luggage|carry)/.test(term))score+=75;
    if(entry.kind==="content"&&entry.item._library==="airlines"&&lower(itemCode(entry.item))===term)score+=85;
    if(entry.kind==="content"&&entry.item._library==="airports"&&lower(itemCode(entry.item))===term)score+=90;
    return{...entry,score}
  }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,28)
}
function searchIconMarkup(entry){
  if(entry.kind==="utility")return icon(entry.utility.icon);
  const x=entry.item,url=displayImageUrl(x),isLogo=x._library==="airlines"&&url;
  return url?`<span class="ti-search-icon${isLogo?" ti-search-logo":""}"><img src="${esc(url)}" alt="" loading="lazy"></span>`:`<span class="ti-search-icon">${icon(x._library==="airports"?"pin":x._library==="airlines"?"aircraft":x._library==="hotels"?"hotel":"help")}</span>`
}
function renderSearchResults(){
  const list=buildSearchResults(STATE.searchQuery);STATE.searchCursor=Math.max(0,Math.min(STATE.searchCursor,list.length-1));
  if(!list.length){$("tiSearchResults").innerHTML=`<div class="ti-search-empty">No published Travel Info matches this search.</div>`;return}
  const groups=[];list.forEach((entry,index)=>{const name=entry.group||"Travel Info";let g=groups.find(x=>x.name===name);if(!g){g={name,items:[]};groups.push(g)}g.items.push({entry,index})});
  $("tiSearchResults").innerHTML=groups.map(g=>`<div class="ti-search-group"><div class="ti-search-group-title">${esc(g.name)}</div>${g.items.map(({entry,index})=>{const title=entry.kind==="utility"?entry.utility.title:itemTitle(entry.item);const sub=entry.kind==="utility"?entry.utility.sub:[itemCode(entry.item),entry.item.city,entry.item.country,itemSummary(entry.item)].filter(Boolean).join(" · ").slice(0,150);return`<button class="ti-search-item" type="button" data-search-index="${index}" data-active="${index===STATE.searchCursor?"true":"false"}">${searchIconMarkup(entry)}<span class="ti-search-copy"><strong>${esc(title)}</strong><span>${esc(sub)}</span></span><span class="ti-search-type">${esc(entry.kind==="utility"?"Tool":entry.item._label||"Info")}</span></button>`}).join("")}</div>`).join("");
  $("tiSearchResults").querySelectorAll("[data-search-index]").forEach(btn=>btn.addEventListener("click",()=>activateSearchResult(list[Number(btn.dataset.searchIndex)])));
  $("tiSearchResults").querySelector('[data-active="true"]')?.scrollIntoView({block:"nearest"})
}
function openSearch(query=""){
  STATE.searchOpen=true;STATE.searchQuery=text(query);STATE.searchCursor=0;$("tiSearchLayer").dataset.open="true";$("tiSearchLayer").setAttribute("aria-hidden","false");document.documentElement.classList.add("ti-lock");
  $("tiSearchInput").value=STATE.searchQuery;renderSearchResults();requestAnimationFrame(()=>$("tiSearchInput").focus())
}
function closeSearch(){STATE.searchOpen=false;$("tiSearchLayer").dataset.open="false";$("tiSearchLayer").setAttribute("aria-hidden","true");document.documentElement.classList.remove("ti-lock");$("tiHeroSearch").focus({preventScroll:true})}
function activateSearchResult(entry){
  if(!entry)return;closeSearch();if(entry.kind==="utility"){openAction(entry.utility.id);return}openDetail(entry.item)
}

function saveHomeContext(){STATE.homeScrollY=window.scrollY}
function openDetail(x){
  if(!x)return;saveHomeContext();STATE.activeDetail=x;transition(()=>{$("tiHome").style.display="none";$("tiDetail").dataset.active="true";renderDetail(x)});window.scrollTo({top:0,behavior:movement()});announce(`${itemTitle(x)} opened`)
}
function closeDetail(){
  transition(()=>{$("tiDetail").dataset.active="false";$("tiHome").style.display="block";$("tiDetailMount").innerHTML="";STATE.activeDetail=null});requestAnimationFrame(()=>window.scrollTo({top:STATE.homeScrollY,behavior:"auto"}))
}
function detailFacts(x){
  const rows=[];const add=(k,v)=>{if(text(v))rows.push([k,text(v)])};add("IATA",x.iataCode||x.iata);add("ICAO",x.icaoCode||x.icao);add("City",x.city);add("Country",x.country);add("Timezone",x.timezone);if(x.distanceToCityCenterKm!==null&&x.distanceToCityCenterKm!==undefined&&x.distanceToCityCenterKm!=="")add("City centre",`${x.distanceToCityCenterKm} km`);add("Loyalty",x.loyaltyProgram);add("Check-in",x.checkInDeadline);add("Duration",x.durationText);add("Meeting point",x.meetingPoint);add("From",x.fromLocation);add("To",x.toLocation);if(x.starRating)add("Rating",`${x.starRating} stars`);return rows
}
function sectionData(title,body,bullets=[],id=""){return text(body)||arr(bullets).length?{title,body:text(body),bullets:arr(bullets).map(v=>text(typeof v==="string"?v:(v?.label||v?.title||v?.body||v?.description||""))).filter(Boolean),id:id||lower(title).replace(/[^a-z0-9]+/g,"-")}:null}
function airlineSections(x){
  const s=obj(x.sections),b=x.baggage||{};const result=[];
  result.push(sectionData("Overview",formatTextValue(x.description||x.information||x.body||x.summary),[],"overview"));
  result.push(sectionData(s.checkin?.title||"Check-in",formatTextValue(s.checkin?.body||x.checkInDeadline),arr(s.checkin?.bullets),"check-in"));
  result.push({title:s.baggage?.title||"Baggage",body:formatTextValue(s.baggage?.body||(b.mode==="narrative"?b.text:"")),bullets:arr(s.baggage?.bullets),id:"baggage",baggage:b});
  result.push(sectionData(s.boarding?.title||"Boarding",formatTextValue(s.boarding?.body||x.boarding),arr(s.boarding?.bullets),"boarding"));
  result.push(sectionData(s.cabins?.title||"Cabins & onboard",formatTextValue(s.cabins?.body||x.cabins),arr(s.cabins?.bullets),"cabins"));
  result.push(sectionData("Lounges",formatTextValue(x.lounges),[],"lounges"));
  result.push(sectionData(s.food?.title||"Food & drink",formatTextValue(s.food?.body||x.mealInfo),arr(s.food?.bullets),"food"));
  result.push(sectionData(s.wifi?.title||"Wi-Fi & connectivity",formatTextValue(s.wifi?.body||x.wifiInfo),arr(s.wifi?.bullets),"wifi"));
  result.push(sectionData("Children & infants",formatTextValue(x.childrenInfants),[],"children"));
  result.push(sectionData("Ticket information",formatTextValue(x.ticketTypes),[],"tickets"));
  result.push(sectionData("Hubs",formatTextValue(x.hubs),[],"hubs"));
  result.push(sectionData("Fleet summary",formatTextValue(x.fleetSummary),[],"fleet"));
  result.push(sectionData(s.assistance?.title||"Special assistance",formatTextValue(s.assistance?.body||x.specialAssistance),arr(s.assistance?.bullets),"assistance"));
  return result.filter(sec=>sec&&(sec.id==="baggage"?(text(sec.body)||arr(sec.bullets).length||b.mode==="structured"):true))
}
function airportSections(x){
  const s=obj(x.sections),result=[];result.push(sectionData("Overview",x.description||x.information||x.body||x.summary,[],"overview"));
  const candidates=[
    ["Arrival",s.arrival?.body||x.arrival,s.arrival?.bullets,"arrival"],["Departure",s.departure?.body||x.departure,s.departure?.bullets,"departure"],
    ["Check-in",s.checkin?.body||x.checkIn,s.checkin?.bullets,"check-in"],["Security",s.security?.body||x.security,s.security?.bullets,"security"],
    ["Transfer",s.transfer?.body||x.transfer,s.transfer?.bullets,"transfer"],["Terminals",x.terminals,[],"terminals"],["Transport",x.transport,[],"transport"],
    ["Lounges",x.lounges,[],"lounges"],["Food & drink",x.foodDrinks,[],"food"],["Airport hotels",x.airportHotels,[],"hotels"],["Destinations served",x.destinationsServing,[],"destinations"],["Lost & found",x.lostFound,[],"lost-found"],
    ["Wi-Fi",s.wifi?.body||x.wifi,s.wifi?.bullets,"wifi"],["Accessibility",s.accessibility?.body||x.accessibility,s.accessibility?.bullets,"accessibility"]
  ];candidates.forEach(([t,b,bul,id])=>result.push(sectionData(t,formatTextValue(b),arr(bul),id)));return result.filter(Boolean)
}
function genericSections(x){const s=obj(x.sections),out=[sectionData("Overview",formatTextValue(x.description||x.information||x.body||x.summary),arr(x.bullets),"overview")];Object.entries(s).forEach(([k,v])=>{const o=obj(v);const sec=sectionData(o.title||human(k),formatTextValue(o.body||o.description||v),arr(o.bullets),lower(k));if(sec)out.push(sec)});return out.filter(Boolean)}
function formatTextValue(v){
  if(v===null||v===undefined||v==="")return"";
  if(typeof v==="string"||typeof v==="number")return text(v);
  if(typeof v==="boolean")return v?"Yes":"No";
  if(Array.isArray(v))return v.map(item=>formatTextValue(item)).filter(Boolean).join("\n");
  if(typeof v==="object"){
    const preferred=text(v.description||v.summary||v.body||v.text||v.label||v.name||v.title||v.value);if(preferred)return preferred;
    return Object.entries(v).flatMap(([k,value])=>{
      if(value===null||value===undefined||value===""||value===false)return[];
      if(typeof value==="string"||typeof value==="number"||typeof value==="boolean")return[`${human(k)}: ${value===true?"Yes":value}`];
      if(Array.isArray(value)&&value.every(item=>["string","number","boolean"].includes(typeof item)))return[`${human(k)}: ${value.join(", ")}`];
      return[]
    }).join("\n")
  }
  return""
}
function baggageStructuredHtml(bag){
  const data=obj(bag.data);const cabins=arr(bag.cabins).length?arr(bag.cabins):arr(data.cabins);if(!cabins.length)return"";
  return `<div class="ti-baggage-cabins">${cabins.map(c=>{const fares=arr(c.fares);return`<div class="ti-baggage-block"><div class="ti-baggage-head"><strong>${esc(c.cabinType||c.cabin||c.name||"Cabin")}</strong><span>${esc(c.travelClass||c.class||"")}</span></div>${fares.length?`<div class="ti-fare-grid">${fares.map(f=>`<div class="ti-fare"><h4>${esc(f.name||"Fare")}</h4>${text(f.description)?`<p>${esc(f.description)}</p>`:""}${[["Under-seat bag",f.underSeatBag],["Cabin bag",f.overheadCarryOn],["Checked bag",f.checkedBag]].filter(([,v])=>text(v)).map(([k,v])=>`<div class="ti-bag-fact"><b>${esc(k)}</b><span>${esc(formatTextValue(v)||text(v))}</span></div>`).join("")}</div>`).join("")}</div>`:""}</div>`}).join("")}</div>`
}
function storySectionHtml(sec){
  const bag=sec.baggage&&sec.baggage.mode==="structured"?baggageStructuredHtml(sec.baggage):"";
  return `<section id="tiSec-${esc(sec.id)}" class="ti-story-section" data-detail-section="${esc(sec.id)}"><div class="ti-story-eyebrow">Travel information</div><h2>${esc(sec.title)}</h2>${sec.body?`<p class="ti-rich-text">${esc(sec.body)}</p>`:""}${sec.bullets?.length?`<ul class="ti-bullet-list">${sec.bullets.map(b=>`<li>${esc(b)}</li>`).join("")}</ul>`:""}${bag}</section>`
}
function renderDetail(x){
  const kind=x._library||"",isAirline=kind==="airlines",isAirport=kind==="airports",sections=isAirline?airlineSections(x):isAirport?airportSections(x):genericSections(x);
  const image=displayImageUrl(x),logo=isAirline?safeExternal(text(x.logo||x.logoIcon||"")):"",code=itemCode(x),facts=detailFacts(x),website=safeExternal(x.website),contactUrl=safeExternal(x.contactUrl),loyaltyUrl=safeExternal(x.loyaltyProgramUrl),internalPath=[x.path,x.actionTarget,x.pageUrl].map(text).find(safeInternal)||"",meta=[x.city,x.country,x.alliance,x.loyaltyProgram].filter(Boolean);
  const aircraftSlot=isAirline?`<section id="tiSec-aircraft" class="ti-story-section" data-detail-section="aircraft"><div class="ti-story-eyebrow">Onboard experience</div><h2>Aircraft & cabin explorer</h2><p>Explore the published aircraft, cabin views and walkthroughs available for this airline. Live seat availability is shown when you book.</p><div id="onboardReactRoot" class="ti-aircraft-host"><div class="ti-aircraft-skeleton"><div class="ti-skeleton-lines"><i></i><i></i><i></i></div></div></div></section>`:"";
  const nav=[...sections.map(s=>({id:s.id,label:s.title})),...(isAirline?[{id:"aircraft",label:"Aircraft & cabins"}]:[])];
  $("tiDetailMount").innerHTML=`
    <article class="ti-profile-hero">
      <div class="ti-profile-copy">
        ${logo?`<div class="ti-profile-logo"><img src="${esc(logo)}" alt="${esc(itemTitle(x))} logo"></div>`:""}
        <div class="ti-kicker">${esc(x._label||libraryLabel(kind))}</div>
        ${isAirport&&code?`<div class="ti-profile-code">${esc(code)}</div>`:""}
        <h1>${esc(itemTitle(x))}</h1>
        <p>${esc(itemSummary(x)||"Published travel information for your journey.")}</p>
        <div class="ti-profile-meta">${[code?`${isAirport?"Airport":"Code"} ${code}`:"",...meta].filter(Boolean).map(m=>`<span>${esc(m)}</span>`).join("")}</div>
      </div>
      <div class="ti-profile-image">${image?`<img src="${esc(image)}" alt="${esc(itemTitle(x))}" referrerpolicy="no-referrer">`:`<div class="ti-profile-fallback"><strong>${esc((code||itemTitle(x).slice(0,3)).toUpperCase())}</strong></div>`}</div>
    </article>
    ${nav.length?`<div class="ti-section-nav-wrap"><nav class="ti-section-nav" aria-label="${esc(itemTitle(x))} sections">${nav.map((n,i)=>`<button class="ti-section-link" type="button" data-section-link="${esc(n.id)}" aria-current="${i===0?"true":"false"}">${esc(n.label)}</button>`).join("")}</nav></div>`:""}
    <div class="ti-detail-body">
      <div class="ti-story-stack">${sections.map(storySectionHtml).join("")}${aircraftSlot}</div>
      <aside class="ti-detail-aside">
        ${facts.length?`<section class="ti-aside-card"><h3>At a glance</h3><div class="ti-key-list">${facts.map(([k,v])=>`<div class="ti-key-row"><b>${esc(k)}</b><span>${esc(v)}</span></div>`).join("")}</div>${isAirport?`<div id="tiWeatherInline" class="ti-weather-inline"><strong id="tiWeatherValue"></strong><span id="tiWeatherDescription"></span></div>`:""}</section>`:""}
        <section class="ti-aside-card"><h3>Continue your journey</h3><p>Use the published guide here, then move into the relevant SKANDI service when you are ready.</p><div class="ti-aside-actions">${internalPath?`<button class="ti-btn ti-btn-light" type="button" data-detail-path="${esc(internalPath)}">Open full guide ${icon("arrow")}</button>`:""}${website?`<a class="ti-btn ti-btn-light" href="${esc(website)}" target="_blank" rel="noopener noreferrer">Official website ${icon("external")}</a>`:""}${contactUrl&&contactUrl!==website?`<a class="ti-btn ti-btn-light" href="${esc(contactUrl)}" target="_blank" rel="noopener noreferrer">Contact information ${icon("external")}</a>`:""}${loyaltyUrl?`<a class="ti-btn ti-btn-light" href="${esc(loyaltyUrl)}" target="_blank" rel="noopener noreferrer">Loyalty program ${icon("external")}</a>`:""}${isAirport?`<button class="ti-btn ti-btn-light" type="button" data-detail-action="baggage">Baggage information ${icon("bag")}</button>`:""}<button class="ti-btn ti-btn-light" type="button" data-detail-action="alexandra">Ask Alexandra ${icon("spark")}</button><button class="ti-btn ti-btn-primary" type="button" data-detail-action="support">Contact support ${icon("message")}</button></div></section>
      </aside>
    </div>`;
  bindDetailInteractions(x,nav);if(isAirline)requestAircraft(x);if((isAirport||kind==="hotels")&&num(x.latitude)!==null&&num(x.longitude)!==null)requestWeather(x)
}
function bindDetailInteractions(x,nav){
  $("tiDetailMount").querySelectorAll("[data-section-link]").forEach(btn=>btn.addEventListener("click",()=>{$("tiDetailMount").querySelector(`#tiSec-${CSS.escape(btn.dataset.sectionLink)}`)?.scrollIntoView({behavior:movement(),block:"start"});$("tiDetailMount").querySelectorAll("[data-section-link]").forEach(b=>b.setAttribute("aria-current",b===btn?"true":"false"))}));
  $("tiDetailMount").querySelectorAll("[data-detail-action]").forEach(btn=>btn.addEventListener("click",()=>{const action=btn.dataset.detailAction;if(action==="alexandra")post("TRAVEL_INFO_OPEN_ALEXANDRA",{context:{title:itemTitle(x),library:x._library||""}});else openAction(action)}));
  $("tiDetailMount").querySelectorAll("[data-detail-path]").forEach(btn=>btn.addEventListener("click",()=>{if(safeInternal(btn.dataset.detailPath))post("TRAVEL_INFO_NAVIGATE",{path:btn.dataset.detailPath})}))
}

function openOverlay(mode,title,subtitle,bodyHtml,focusSelector=""){STATE.overlayMode=mode;STATE.overlayReturnFocus=document.activeElement;$("tiSheetKicker").textContent="Travel Info";$("tiSheetTitle").textContent=title;$("tiSheetSubtitle").textContent=subtitle||"";$("tiSheetBody").innerHTML=bodyHtml;hydrateStaticIcons($("tiSheetBody"));$("tiOverlay").dataset.open="true";$("tiOverlay").setAttribute("aria-hidden","false");document.documentElement.classList.add("ti-lock");bindOverlay(mode);requestAnimationFrame(()=>{const target=focusSelector?$("tiSheetBody").querySelector(focusSelector):$("tiSheetBody").querySelector("input,select,textarea,button");target?.focus()})}
function closeOverlay(){$("tiOverlay").dataset.open="false";$("tiOverlay").setAttribute("aria-hidden","true");document.documentElement.classList.remove("ti-lock");const target=STATE.overlayReturnFocus;if(target&&target.isConnected)target.focus({preventScroll:true});STATE.overlayMode=""}
function baggagePanelHtml(){
  const airlines=arr(DATA.airlines);return `<div class="ti-field"><label for="tiBaggageAirline">Airline</label><select id="tiBaggageAirline">${airlines.length?airlines.map(a=>`<option value="${esc(text(a.id||a.iataCode))}">${esc(itemTitle(a))}${itemCode(a)?` · ${esc(itemCode(a))}`:""}</option>`).join(""):`<option value="">No airline guides available</option>`}</select></div><div id="tiBaggageResult" class="ti-message-box" aria-live="polite"></div><div class="ti-sheet-actions"><button id="tiFullBaggageGuide" class="ti-btn ti-btn-light" type="button">Open baggage guide ${icon("arrow")}</button></div>`
}
function baggageHumanHtml(a){
  if(!a)return"No airline baggage information is currently published.";const b=obj(a.baggage);
  if(b.mode==="narrative"&&text(b.text))return`<strong>${esc(itemTitle(a))}</strong><div style="margin-top:9px;white-space:pre-line">${esc(b.text)}</div>`;
  if(b.mode==="structured"){const rich=baggageStructuredHtml(b);return rich||`Detailed baggage information is not currently published for ${esc(itemTitle(a))}. Check with the operating airline before travel.`}
  return`Detailed baggage information is not currently published for ${esc(itemTitle(a))}. Check with the operating airline before travel.`
}
function requirementsPanelHtml(){return`<div class="ti-form-grid"><div class="ti-field"><label for="tiPassportCountry">Passport nationality</label><input id="tiPassportCountry" autocomplete="country-name" placeholder="Country"></div><div class="ti-field"><label for="tiFromCountry">From</label><input id="tiFromCountry" autocomplete="off" placeholder="Country"></div><div class="ti-field"><label for="tiTransitCountry">Transit</label><input id="tiTransitCountry" autocomplete="off" placeholder="Optional"></div><div class="ti-field"><label for="tiToCountry">To</label><input id="tiToCountry" autocomplete="off" placeholder="Country"></div></div><div class="ti-sheet-actions"><button id="tiRequirementSubmit" class="ti-btn ti-btn-primary" type="button">Check requirements ${icon("arrow")}</button></div><div id="tiRequirementResult" class="ti-message-box" aria-live="polite">Enter your passport nationality and destination to check the current travel-requirements information. Always verify final entry rules with official authorities.</div><div class="ti-sheet-actions"><button id="tiPassportGuide" class="ti-btn ti-btn-light" type="button">Passport & visa guide ${icon("arrow")}</button></div>`}
function supportPanelHtml(){return`<div class="ti-form-grid"><div class="ti-field"><label for="tiSupportName">Name</label><input id="tiSupportName" autocomplete="name"></div><div class="ti-field"><label for="tiSupportEmail">Email</label><input id="tiSupportEmail" type="email" autocomplete="email"></div><div class="ti-field"><label for="tiSupportRef">Booking reference</label><input id="tiSupportRef" autocomplete="off"></div><div class="ti-field"><label for="tiSupportCategory">Category</label><select id="tiSupportCategory"><option>General</option><option>Before travel</option><option>Baggage</option><option>Airport</option><option>Airline</option><option>Hotel</option><option>Transfer</option><option>Tour / Activity</option><option>Ticket / Voucher</option><option>Booking</option></select></div><div class="ti-field ti-full"><label for="tiSupportMessage">Message</label><textarea id="tiSupportMessage"></textarea></div></div><div class="ti-sheet-actions"><button id="tiSupportSend" class="ti-btn ti-btn-primary" type="button">Send request ${icon("message")}</button></div><div id="tiSupportResult" class="ti-message-box" hidden aria-live="polite"></div>`}
function openAction(action){
  if(action==="baggage")openOverlay("baggage","Baggage allowance","Select an airline to view the guidance currently published by SKANDI.",baggagePanelHtml(),"#tiBaggageAirline");
  else if(action==="requirements")openOverlay("requirements","Travel requirements","Check passport and entry guidance before departure.",requirementsPanelHtml(),"#tiPassportCountry");
  else if(action==="support")openOverlay("support","Contact Travel Support","Send an itinerary or travel-information question to SKANDI.",supportPanelHtml(),"#tiSupportName");
  else if(action==="airlines"||action==="airports")setLibrary(action,true);
  else if(action==="alexandra")post("TRAVEL_INFO_OPEN_ALEXANDRA",STATE.activeDetail?{context:{title:itemTitle(STATE.activeDetail),library:STATE.activeDetail._library||""}}:{});
}
function bindOverlay(mode){
  if(mode==="baggage"){const select=$("tiBaggageAirline");const render=()=>{const a=arr(DATA.airlines).find(x=>text(x.id||x.iataCode)===select.value)||arr(DATA.airlines)[0];$("tiBaggageResult").innerHTML=baggageHumanHtml(a)};select?.addEventListener("change",render);render();$("tiFullBaggageGuide")?.addEventListener("click",()=>post("TRAVEL_INFO_OPEN_BAGGAGE",{}))}
  if(mode==="requirements"){$("tiRequirementSubmit")?.addEventListener("click",submitRequirements);$("tiPassportGuide")?.addEventListener("click",()=>post("TRAVEL_INFO_OPEN_PASSPORT_VISA",{}))}
  if(mode==="support")$("tiSupportSend")?.addEventListener("click",submitSupport)
}
function submitRequirements(){
  if(STATE.requirementsPending)return;const nationality=text($("tiPassportCountry")?.value),origin=text($("tiFromCountry")?.value),transit=text($("tiTransitCountry")?.value),destination=text($("tiToCountry")?.value),out=$("tiRequirementResult"),btn=$("tiRequirementSubmit");
  if(!nationality||!destination){out.dataset.tone="error";out.textContent="Enter at least passport nationality and destination.";return}
  STATE.requirementsPending=true;btn.disabled=true;out.dataset.tone="";out.textContent="Checking current travel requirements…";
  post("TRAVEL_INFO_REQUIREMENTS_SEARCH",{nationality,origin,transit,destination,documentType:"PASSPORT",language:"EN"})
}
function renderRequirementResult(payload){
  const host=$("tiRequirementResult");if(!host)return;const p=obj(payload),fields=Array.isArray(p.fields)?p.fields:Object.entries(obj(p.fields)).map(([key,value])=>({key,label:human(key),value})),guidance=arr(p.guidance),notices=arr(p.notices);const chunks=[];
  if(text(p.summary))chunks.push(`<div class="ti-requirement-group"><h4>Travel requirements</h4><p>${esc(p.summary)}</p></div>`);
  if(fields.length)chunks.push(`<div class="ti-requirement-group"><h4>Entry information</h4>${fields.map(f=>`<div class="ti-requirement-field"><b>${esc(f.label||human(f.key||"Requirement"))}</b><span>${esc(formatTextValue(f.value)||text(f.value))}</span></div>`).join("")}</div>`);
  guidance.forEach(g=>chunks.push(`<div class="ti-requirement-group"><h4>${esc(g.title||g.country||g.category||"Guidance")}</h4><p>${esc(g.body||g.description||g.summary||"")}</p></div>`));
  if(notices.length)chunks.push(`<div class="ti-requirement-group"><h4>Important information</h4>${notices.map(n=>`<p style="margin-bottom:7px">${esc(typeof n==="string"?n:(n.message||n.title||n.body||""))}</p>`).join("")}</div>`);
  chunks.push(`<div class="ti-requirement-group"><h4>Before you travel</h4><p>Entry and transit rules can change. Confirm the final requirements with the relevant official authorities before departure.</p></div>`);
  host.dataset.tone="";host.innerHTML=chunks.join("")
}
function submitSupport(){
  if(STATE.supportPending)return;const name=text($("tiSupportName")?.value),email=text($("tiSupportEmail")?.value),message=text($("tiSupportMessage")?.value),out=$("tiSupportResult"),btn=$("tiSupportSend");out.hidden=false;
  if(!name||!email||!message){out.dataset.tone="error";out.textContent="Enter your name, email and message before sending.";return}
  STATE.supportPending=true;btn.disabled=true;out.dataset.tone="";out.textContent="Sending your request…";post("TRAVEL_SUPPORT_REQUEST",{name,email,bookingReference:text($("tiSupportRef")?.value),category:text($("tiSupportCategory")?.value),message})
}

function requestAircraft(x){
  const key=text(x.id||x.iataCode||x.code);if(STATE.aircraftBundles.has(key)){renderFleet(STATE.aircraftBundles.get(key));return}if(STATE.aircraftPending.has(key))return;STATE.aircraftPending.add(key);STATE.lastAircraftRequestKey=key;post("TRAVEL_INFO_REQUEST_AIRCRAFT",{airlineId:x.id,airlineCode:x.iataCode})
}
function renderFleetFallback(bundle,host){
  const aircraft=arr(bundle.aircraft),cabins=arr(bundle.cabins);if(!aircraft.length){host.innerHTML=`<div class="ti-fleet-fallback"><h3>Aircraft information</h3><p>No published aircraft information is currently available for this airline.</p></div>`;return}
  host.innerHTML=`<div class="ti-fleet-fallback"><h3>Aircraft & cabin information</h3><p>The interactive cabin explorer is temporarily unavailable, but the published aircraft information is still available below.</p><div class="ti-fallback-aircraft-list">${aircraft.map(a=>{const id=text(a.id),cs=cabins.filter(c=>text(c.aircraft_id||c.aircraftId)===id);return`<article class="ti-fallback-aircraft"><strong>${esc(a.display_title||a.displayTitle||a.aircraft_name||a.aircraftName||a.aircraft_code||a.aircraftCode||"Aircraft")}</strong><span>${esc([a.aircraft_code||a.aircraftCode,a.manufacturer,a.family,a.total_seats||a.totalSeats?`${a.total_seats||a.totalSeats} seats`:""].filter(Boolean).join(" · "))}</span>${cs.length?`<div class="ti-fallback-cabins">${cs.map(c=>`<i>${esc(c.cabin_name||c.cabinName||c.cabin_code||c.cabinCode||"Cabin")}</i>`).join("")}</div>`:""}</article>`}).join("")}</div></div>`
}
function renderFleet(bundle){
  const host=$("onboardReactRoot");if(!host)return;window.__SKANDI_ONBOARD_PENDING__={elementId:host.id,bundle:bundle||{},airline:STATE.activeDetail||{}};
  if(window.SKANDIOnboardReact?.mount){window.SKANDIOnboardReact.mount(host,bundle||{},STATE.activeDetail||{});return}
  host.innerHTML=`<div class="ti-aircraft-skeleton"><div class="ti-skeleton-lines"><i></i><i></i><i></i></div></div>`;
  setTimeout(()=>{if(host.isConnected&&!window.SKANDIOnboardReact?.mount)renderFleetFallback(bundle||{},host)},5000)
}
window.addEventListener("SKANDI_ONBOARD_REACT_READY",()=>{const p=window.__SKANDI_ONBOARD_PENDING__;if(!p)return;const host=$(p.elementId||"onboardReactRoot");if(host&&window.SKANDIOnboardReact?.mount)window.SKANDIOnboardReact.mount(host,p.bundle,p.airline)});

function weatherKey(x){return text(x.id||x.code||x.iata||itemTitle(x))}
function requestWeather(x){const key=weatherKey(x);if(STATE.weatherCache.has(key)){renderWeatherForDetail(STATE.weatherCache.get(key));return}if(STATE.weatherPending.has(key))return;STATE.weatherPending.add(key);post("TRAVEL_INFO_WEATHER_REQUEST",{locations:[{id:x.id||x.code||x.iata,title:itemTitle(x),latitude:Number(x.latitude),longitude:Number(x.longitude)}]})}
function renderWeatherForDetail(w){
  const host=$("tiWeatherInline");if(!host)return;if(!w||w.ok!==true){host.dataset.visible="false";return}const temp=num(w.tempC);$("tiWeatherValue").textContent=temp!==null?`${Math.round(temp)}°C`:text(w.temperature||"Current weather");$("tiWeatherDescription").textContent=text(w.description||w.condition||"");host.dataset.visible="true"
}

function renderAll(){buildSearchIndex();renderNetworkMeta();renderAtlasCodes();renderJourney();renderFeaturedHelp();renderGateways();renderFilters();renderDirectory();hydrateStaticIcons()}
function findUpdatedDetail(current){
  if(!current)return null;const lib=current._library;if(lib==="faq")return arr(DATA.helpCenter?.topics).map(x=>normalizeContentItem(x,"faq")).find(x=>text(x.id||x.topicId)===text(current.id||current.topicId))||null;if(lib==="articles")return arr(DATA.articles).map(x=>normalizeContentItem(x,"articles")).find(x=>text(x.id||x.slug)===text(current.id||current.slug))||null;return arr(DATA[lib]).map(x=>normalizeContentItem(x,lib)).find(x=>text(x.id||x.code||x.iataCode)===text(current.id||current.code||current.iataCode))||null
}
function loadData(payload){
  DATA={...DATA,...obj(payload),helpCenter:{...DATA.helpCenter,...obj(payload?.helpCenter)}};STATE.dataState="ready";setStatus("");renderAll();
  if(STATE.activeDetail){const updated=findUpdatedDetail(STATE.activeDetail);if(updated){STATE.activeDetail=updated;renderDetail(updated)}else closeDetail()}
}
function retryData(){STATE.dataState="loading";setStatus("Refreshing Travel Info…");post("TRAVEL_INFO_REFRESH",{settings:{language:"EN"}})}

function parseMessage(value){if(typeof value==="string"){try{return JSON.parse(value)}catch(_){return null}}return value&&typeof value==="object"?value:null}
window.addEventListener("message",event=>{
  const m=parseMessage(event.data);if(!m||m.source!==PARENT)return;const p=obj(m.payload);
  switch(m.type){
    case "TRAVEL_INFO_HOST_READY":post("TRAVEL_INFO_READY",{settings:{language:"EN"},protocolVersion:VERSION});break;
    case "TRAVEL_INFO_PROGRESS":STATE.dataState="loading";setStatus(p.message||"Loading SKANDI Travel Info…");break;
    case "TRAVEL_INFO_DATA":loadData(p);break;
    case "TRAVEL_INFO_AIRCRAFT_DATA":{
      const first=arr(p.aircraft)[0];const responseKeys=[text(first?.airlineId),text(first?.airlineCode),text(STATE.lastAircraftRequestKey)].filter(Boolean);responseKeys.forEach(key=>{STATE.aircraftPending.delete(key);STATE.aircraftBundles.set(key,p)});const currentKey=STATE.activeDetail?text(STATE.activeDetail.id||STATE.activeDetail.iataCode||STATE.activeDetail.code):"";if(!responseKeys.length||responseKeys.includes(currentKey)||currentKey===text(STATE.lastAircraftRequestKey))renderFleet(p);break
    }
    case "TRAVEL_INFO_REQUIREMENTS_SEARCHING":{const h=$("tiRequirementResult");if(h)h.textContent=p.message||"Checking current travel requirements…";break}
    case "TRAVEL_INFO_REQUIREMENTS_RESULT":STATE.requirementsPending=false;if($("tiRequirementSubmit"))$("tiRequirementSubmit").disabled=false;renderRequirementResult(p);break;
    case "TRAVEL_INFO_REQUIREMENTS_ERROR":STATE.requirementsPending=false;if($("tiRequirementSubmit"))$("tiRequirementSubmit").disabled=false;{const h=$("tiRequirementResult");if(h){h.dataset.tone="error";h.textContent=p.message||"Travel requirements are temporarily unavailable. Please verify with official authorities before departure."}}break;
    case "TRAVEL_SUPPORT_RESULT":
    case "TRAVEL_INFO_SUPPORT_RESULT":STATE.supportPending=false;if($("tiSupportSend"))$("tiSupportSend").disabled=false;{const h=$("tiSupportResult");if(h){h.hidden=false;h.dataset.tone=p.ok===false||p.error?"error":"success";h.textContent=p.message||p.error||"Your request has been received."}}break;
    case "TRAVEL_INFO_WEATHER":{
      const locations=arr(p.locations);locations.forEach(w=>{const key=text(w.id||w.locationId||w.title);if(key){STATE.weatherPending.delete(key);STATE.weatherCache.set(key,w)}});
      if(STATE.activeDetail){const key=weatherKey(STATE.activeDetail);if(!locations.length)STATE.weatherPending.delete(key);renderWeatherForDetail(STATE.weatherCache.get(key)||locations[0]||null)}break
    }
    case "TRAVEL_INFO_ERROR":STATE.dataState="error";STATE.requirementsPending=false;STATE.supportPending=false;STATE.aircraftPending.clear();if($("tiRequirementSubmit"))$("tiRequirementSubmit").disabled=false;if($("tiSupportSend"))$("tiSupportSend").disabled=false;setStatus(p.message||"Travel information is temporarily unavailable.",true);{const target=STATE.overlayMode==="support"?$("tiSupportResult"):STATE.overlayMode==="requirements"?$("tiRequirementResult"):null;if(target){target.hidden=false;target.dataset.tone="error";target.textContent=p.message||"This service is temporarily unavailable. Please try again."}}break;
  }
});

function focusables(container){return [...container.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')].filter(el=>el.offsetParent!==null)}
function trap(container,e){if(e.key!=="Tab")return;const f=focusables(container);if(!f.length)return;const first=f[0],last=f[f.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}

document.addEventListener("keydown",e=>{
  if(STATE.searchOpen){if(e.key==="Escape"){e.preventDefault();closeSearch();return}if(e.key==="ArrowDown"||e.key==="ArrowUp"){const list=buildSearchResults(STATE.searchQuery);if(list.length){e.preventDefault();STATE.searchCursor=(STATE.searchCursor+(e.key==="ArrowDown"?1:-1)+list.length)%list.length;renderSearchResults()}return}if(e.key==="Enter"&&document.activeElement===$("tiSearchInput")){const list=buildSearchResults(STATE.searchQuery);if(list[STATE.searchCursor]){e.preventDefault();activateSearchResult(list[STATE.searchCursor])}return}trap($("tiSearchLayer"),e);return}
  if($("tiOverlay").dataset.open==="true"){if(e.key==="Escape"){e.preventDefault();closeOverlay();return}trap($("tiSheet"),e);return}
  if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k"){e.preventDefault();openSearch()}
});

$("tiHeroSearchForm").addEventListener("submit",e=>{e.preventDefault();openSearch($("tiHeroSearch").value)});
$("tiHeroSearch").addEventListener("click",()=>openSearch($("tiHeroSearch").value));
$("tiSearchInput").addEventListener("input",e=>{STATE.searchQuery=e.target.value;STATE.searchCursor=0;renderSearchResults()});
document.querySelectorAll("[data-close-search]").forEach(b=>b.addEventListener("click",closeSearch));
document.querySelectorAll("[data-close-overlay]").forEach(b=>b.addEventListener("click",closeOverlay));
$("tiBack").addEventListener("click",closeDetail);
$("tiLoadMore").addEventListener("click",()=>{STATE.visibleCount+=PAGE_SIZE;renderDirectory()});
document.addEventListener("click",e=>{const action=e.target.closest("[data-action]");if(action)openAction(action.dataset.action)});
$("tiAlexandraLauncher").addEventListener("click",()=>openAction("alexandra"));

hydrateStaticIcons();STATE.dataState="loading";renderAll();setStatus("Loading SKANDI Travel Info…");
post("TRAVEL_INFO_READY",{settings:{language:"EN"},protocolVersion:VERSION});

window.SKANDITravelInfo={
  refresh:retryData,
  navigate:path=>{if(safeInternal(path))post("TRAVEL_INFO_NAVIGATE",{path})},
  openInsurance:()=>post("TRAVEL_INFO_OPEN_INSURANCE",{}),
  version:"B-011.21"
};
})();
</script>


<script>
(()=>{
"use strict";
const REDUCED=window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches===true;
const FINE=window.matchMedia?.("(pointer:fine)")?.matches===true;
const REVEAL_SELECTOR=[
  ".ti-heading-row",
  ".ti-stage-btn",
  ".ti-featured-main",
  ".ti-question-btn",
  ".ti-gateway",
  ".ti-entity",
  ".ti-support-grid",
  ".ti-profile-hero",
  ".ti-story-section",
  ".ti-aside-card"
].join(",");
const REACTIVE_SELECTOR=[
  ".ti-stage-btn",
  ".ti-featured-main",
  ".ti-gateway",
  ".ti-entity"
].join(",");
const seen=new WeakSet();
let observer=null;

if(!REDUCED&&"IntersectionObserver" in window){
  observer=new IntersectionObserver(entries=>{
    for(const entry of entries){
      if(!entry.isIntersecting)continue;
      entry.target.classList.add("ti-motion-visible");
      observer.unobserve(entry.target);
    }
  },{threshold:.10,rootMargin:"0px 0px -6% 0px"});
}

function enhanceNode(root=document){
  const nodes=[];
  if(root.nodeType===1&&root.matches?.(REVEAL_SELECTOR))nodes.push(root);
  root.querySelectorAll?.(REVEAL_SELECTOR).forEach(node=>nodes.push(node));
  nodes.forEach(node=>{
    if(seen.has(node))return;
    seen.add(node);
    node.classList.add("ti-motion-reveal");
    if(node.matches(REACTIVE_SELECTOR))node.classList.add("ti-reactive-card");
    if(observer)observer.observe(node);
    else node.classList.add("ti-motion-visible");
  });
}

enhanceNode(document);

const mutationObserver=new MutationObserver(records=>{
  records.forEach(record=>{
    record.addedNodes.forEach(node=>{
      if(node.nodeType===1)enhanceNode(node);
    });
  });
});
mutationObserver.observe(document.body,{childList:true,subtree:true});

const hero=document.querySelector(".ti-atlas");
if(hero&&!REDUCED&&FINE){
  hero.addEventListener("pointermove",event=>{
    const rect=hero.getBoundingClientRect();
    if(!rect.width||!rect.height)return;
    const x=((event.clientX-rect.left)/rect.width)*100;
    const y=((event.clientY-rect.top)/rect.height)*100;
    hero.style.setProperty("--hero-x",`${x.toFixed(1)}%`);
    hero.style.setProperty("--hero-y",`${y.toFixed(1)}%`);
  },{passive:true});
  hero.addEventListener("pointerleave",()=>{
    hero.style.setProperty("--hero-x","72%");
    hero.style.setProperty("--hero-y","24%");
  },{passive:true});
}

if(!REDUCED&&FINE){
  let active=null;
  document.addEventListener("pointermove",event=>{
    const card=event.target.closest?.(REACTIVE_SELECTOR);
    if(active&&active!==card){
      active.style.transform="";
      active.style.removeProperty("--fx-x");
      active.style.removeProperty("--fx-y");
    }
    active=card||null;
    if(!card)return;
    const rect=card.getBoundingClientRect();
    if(!rect.width||!rect.height)return;
    const x=((event.clientX-rect.left)/rect.width)*100;
    const y=((event.clientY-rect.top)/rect.height)*100;
    const rotateY=(x-50)*0.025;
    const rotateX=(50-y)*0.020;
    card.style.setProperty("--fx-x",`${x.toFixed(1)}%`);
    card.style.setProperty("--fx-y",`${y.toFixed(1)}%`);
    card.style.transform=`perspective(1000px) translateY(-4px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`;
  },{passive:true});
  document.addEventListener("pointerout",event=>{
    const card=event.target.closest?.(REACTIVE_SELECTOR);
    if(!card||card.contains(event.relatedTarget))return;
    card.style.transform="";
    card.style.removeProperty("--fx-x");
    card.style.removeProperty("--fx-y");
    if(active===card)active=null;
  },{passive:true});
}

window.addEventListener("pagehide",()=>{
  mutationObserver.disconnect();
  observer?.disconnect();
},{once:true});
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
const raw=(o,...keys)=>{for(const k of keys){if(o&&o[k]!==undefined&&o[k]!==null&&o[k]!=="")return o[k]}return""};
const human=v=>T(v).replace(/[_-]+/g," ").replace(/\b\w/g,c=>c.toUpperCase());
const canonical=(code,name="")=>{const v=T(code||name).toUpperCase().replace(/[_-]+/g," ");if(["F","J","W","Y"].includes(v))return v;if(/FIRST|LA PREMI/.test(v))return"F";if(/BUSINESS|SIGNATURE CLASS|DELTA ONE|POLARIS|CLUB WORLD|ROYAL SILK/.test(v))return"J";if(/PREMIUM|PLUS|COMFORT/.test(v)&&!/BUSINESS/.test(v))return"W";return"Y"};
const rank=c=>({F:4,J:3,W:2,Y:1})[c]||0;
const cabinLabel=c=>({F:"First",J:"Business",W:"Premium",Y:"Economy"})[c]||c;
const emit=(type,payload={})=>window.parent.postMessage({source:"SKANDI_PUBLIC_TRAVEL_INFO",type,payload,timestamp:new Date().toISOString()},"*");
const navigate=path=>emit("MASTER_NAVIGATE",{path});
function transition(fn){if(!matchMedia("(prefers-reduced-motion: reduce)").matches&&document.startViewTransition){try{return document.startViewTransition(fn)}catch(_){}}return fn()}
function normalizeAircraft(a){return{...a,_id:T(raw(a,"id")),_code:T(raw(a,"aircraft_code","aircraftCode")),_name:T(raw(a,"display_title","displayTitle","aircraft_name","aircraftName"))||T(raw(a,"aircraft_code","aircraftCode"))||"Aircraft",_aircraftName:T(raw(a,"aircraft_name","aircraftName")),_manufacturer:T(raw(a,"manufacturer")),_family:T(raw(a,"family")),_variant:T(raw(a,"variant")),_seats:N(raw(a,"total_seats","totalSeats")),_hero:T(raw(a,"hero_image_url","heroImageUrl","exterior_image_url","exteriorImageUrl")),_seatmap:T(raw(a,"seatmap_image_url","seatmapImageUrl")),_configuration:O(raw(a,"configuration"))}}
function normalizeCabins(bundle,aircraftId){
  const source=A(bundle?.cabins).filter(c=>T(raw(c,"aircraft_id","aircraftId"))===T(aircraftId)&&raw(c,"active")!==false);const map=new Map();
  source.forEach(c=>{const code=canonical(raw(c,"cabin_code","cabinCode"),raw(c,"cabin_name","cabinName"));const name=T(raw(c,"cabin_name","cabinName"))||cabinLabel(code);const seats=N(raw(c,"seat_count","seatCount"));const key=`${code}|${name.toLowerCase()}|${seats}`;const canonicalCode=["F","J","W","Y"].includes(T(raw(c,"cabin_code","cabinCode")).toUpperCase());const old=map.get(key);if(!old||canonicalCode)map.set(key,{...c,_id:T(raw(c,"id")),_code:code,_name:name,_seats:seats,_rank:rank(code)})});
  return[...map.values()].sort((a,b)=>b._rank-a._rank||N(raw(a,"sort_order","sortOrder"))-N(raw(b,"sort_order","sortOrder")))
}
function legacyData(airline){const s=O(airline?.sections);return O(s.inflightExperience?.data||s.inflightExperience||airline?.inflightExperience||{})}
function legacyClassFor(legacy,cabin){const classes=A(legacy.classes);if(!classes.length)return null;const code=cabin?cabin._code:"Y";return classes.find(c=>canonical(c.id,c.label)===code)||classes.find(c=>T(c.label).toLowerCase().includes(cabinLabel(code).toLowerCase()))||classes[0]}
function amenityItems(cabin,legacyClass){
  const out=[];const add=(label,value="")=>{label=T(label);value=T(value);if(label&&!out.some(x=>x.label.toLowerCase()===label.toLowerCase()))out.push({label,value})};const am=raw(cabin,"amenities");
  if(Array.isArray(am))am.forEach(v=>typeof v==="string"?add(v):add(v?.label||v?.title,v?.value||v?.description));
  else Object.entries(O(am)).forEach(([k,v])=>{if(v===false||v===null||v==="")return;if(typeof v==="object")add(human(k),v.value||v.description||v.label||v.title||"");else add(human(k),v===true?"":String(v))});
  A(legacyClass?.amenities).forEach(v=>typeof v==="string"?add(v):add(v?.label||v?.title,v?.value||v?.description));return out.slice(0,16)
}
function configuredSeatLayout(cabin){const ds=O(raw(cabin,"display_settings","displaySettings"));const layout=raw(ds,"seatLayout","layout","seat_layout");if(Array.isArray(layout))return layout.map(g=>Array.isArray(g)?g.map(T).filter(Boolean):[]).filter(g=>g.length);if(typeof layout==="string"&&/^\d(?:-\d)+$/.test(layout)){let letter=0;return layout.split("-").map(count=>Array.from({length:N(count)},()=>String.fromCharCode(65+letter++)))}return[]}
function viewsFor(bundle,aircraft,cabin,legacyClass){
  const canonicalViews=A(bundle.views).filter(v=>T(raw(v,"aircraft_id","aircraftId"))===aircraft._id&&(T(raw(v,"cabin_id","cabinId"))===cabin?._id||!T(raw(v,"cabin_id","cabinId"))));
  if(canonicalViews.length)return canonicalViews.map(v=>({...v,_id:T(raw(v,"id")),_label:T(raw(v,"label","view_code","viewCode","view_type","viewType"))||"Cabin view",_image:T(raw(v,"image_url","imageUrl","mobile_image_url","mobileImageUrl"))}));
  return A(legacyClass?.views).map((v,i)=>({...v,_id:T(v.id)||`legacy-view-${i}`,_label:T(v.label||v.title)||"Cabin view",_image:T(v.image||v.imageUrl),_legacyHotspots:A(v.hotspots)}))
}
function hotspotsFor(bundle,view){return view?A(bundle.hotspots).filter(h=>T(raw(h,"view_id","viewId"))===T(view._id)).map((h,i)=>({...h,_id:T(raw(h,"id","hotspot_code","hotspotCode"))||`hot-${i}`})):[]}
function scenesFor(bundle,aircraft){return A(bundle.walkScenes||bundle.scenes).filter(s=>T(raw(s,"aircraft_id","aircraftId"))===aircraft._id).sort((a,b)=>N(raw(a,"sort_order","sortOrder"))-N(raw(b,"sort_order","sortOrder"))).map(s=>({...s,_code:T(raw(s,"scene_code","sceneCode"))}))}
function sceneHotspotsFor(bundle,scene){return scene?A(bundle.sceneHotspots).filter(h=>T(raw(h,"scene_id","sceneId"))===T(scene.id)).map((h,i)=>({...h,_id:T(raw(h,"id","hotspot_code","hotspotCode"))||`scene-hot-${i}`})):[]}
function useMobile(){const [m,setM]=useState(matchMedia("(max-width:760px)").matches);useEffect(()=>{const q=matchMedia("(max-width:760px)");const f=()=>setM(q.matches);q.addEventListener?.("change",f);return()=>q.removeEventListener?.("change",f)},[]);return m}

const css=`
.cab-root{--cab-navy:#061a30;--cab-blue:#0b3a7a;--cab-aqua:#5fc7cf;--cab-ivory:#fbfaf6;--cab-champ:#d1bc98;--cab-text:#102033;--cab-muted:#65758a;--cab-line:rgba(2,46,100,.12);font-family:Montserrat,Inter,system-ui,sans-serif;color:var(--cab-text)}
.cab-shell{border:1px solid var(--cab-line);border-radius:30px;overflow:hidden;background:var(--cab-ivory);box-shadow:0 22px 60px rgba(2,46,100,.1)}
.cab-top{position:relative;overflow:hidden;background:linear-gradient(145deg,#05192e,#0a3159);color:#fff;padding:28px 28px 22px}.cab-top:after{content:"";position:absolute;width:320px;height:320px;border-radius:50%;right:-120px;top:-190px;border:1px solid rgba(95,199,207,.18)}.cab-kicker{position:relative;z-index:1;color:#91dce2;font-size:9px;font-weight:850;text-transform:uppercase;letter-spacing:.16em}.cab-top h3{position:relative;z-index:1;margin:8px 0 7px;font-size:clamp(24px,3.5vw,38px);font-weight:550;line-height:1;letter-spacing:-.05em}.cab-top p{position:relative;z-index:1;margin:0;max-width:760px;color:#b9cee1;font-size:10.5px;line-height:1.65}
.cab-selectors{border-bottom:1px solid var(--cab-line);background:#fff}.cab-aircraft-strip,.cab-mode-strip,.cab-cabin-strip,.cab-view-strip{display:flex;gap:7px;overflow-x:auto;scrollbar-width:none;padding:10px 15px}.cab-aircraft-strip::-webkit-scrollbar,.cab-mode-strip::-webkit-scrollbar,.cab-cabin-strip::-webkit-scrollbar,.cab-view-strip::-webkit-scrollbar{display:none}.cab-aircraft-strip{border-bottom:1px solid var(--cab-line)}.cab-pill{white-space:nowrap;border:1px solid var(--cab-line);border-radius:999px;background:#fff;color:#52677e;padding:9px 12px;font-size:8.5px;font-weight:800}.cab-pill[data-active="true"]{background:var(--cab-navy);border-color:var(--cab-navy);color:#fff}.cab-pill.cab-cabin[data-active="true"]{background:var(--cab-aqua);border-color:var(--cab-aqua);color:#06263c}
.cab-body{padding:18px}.cab-grid{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(250px,.55fr);gap:14px}.cab-card{border:1px solid var(--cab-line);border-radius:22px;background:#fff;overflow:hidden}.cab-pad{padding:20px}.cab-title{margin:0 0 7px;color:#022e64;font-size:15px;font-weight:700}.cab-copy{margin:0;color:var(--cab-muted);font-size:10px;line-height:1.65;white-space:pre-line}.cab-facts{display:flex;gap:7px;flex-wrap:wrap;margin-top:14px}.cab-fact{padding:8px 10px;border:1px solid var(--cab-line);border-radius:12px;background:#f8fafc}.cab-fact b{display:block;font-size:11px;color:#022e64}.cab-fact span{display:block;margin-top:2px;font-size:7.5px;color:#728196;text-transform:uppercase;letter-spacing:.06em}
.cab-aircraft-visual{position:relative;min-height:330px;background:linear-gradient(145deg,#e8f0f5,#f9faf7);overflow:hidden;display:grid;place-items:center}.cab-aircraft-visual img{width:100%;height:330px;object-fit:cover}.cab-visual-fallback{display:grid;place-items:center;text-align:center;color:#31516e;padding:28px}.cab-plane-svg{width:min(390px,80%);height:auto;opacity:.78}.cab-visual-fallback strong{display:block;margin-top:12px;color:#022e64;font-size:13px}.cab-visual-fallback span{display:block;margin-top:6px;color:#6d7f91;font-size:9px;line-height:1.5}.cab-cabin-list{display:grid;gap:8px;margin-top:15px}.cab-cabin-card{width:100%;border:1px solid var(--cab-line);border-radius:15px;background:#fff;padding:13px;text-align:left;color:#102033}.cab-cabin-card:hover,.cab-cabin-card[data-active="true"]{border-color:rgba(95,199,207,.75);box-shadow:0 7px 20px rgba(2,46,100,.06)}.cab-cabin-card strong{display:block;color:#022e64;font-size:10.5px}.cab-cabin-card span{display:block;margin-top:3px;color:#6b7c8e;font-size:8.5px}
.cab-media{position:relative;min-height:420px;background:linear-gradient(145deg,#0a2848,#0c355c);overflow:hidden}.cab-media img{width:100%;height:420px;object-fit:cover;transition:opacity .28s ease}.cab-media-fallback{height:420px;display:grid;place-items:center;text-align:center;padding:32px;color:#c3d5e5}.cab-media-fallback strong{display:block;font-size:22px;font-weight:550}.cab-media-fallback span{display:block;margin:8px auto 0;max-width:420px;font-size:9.5px;line-height:1.6;color:#9eb6cb}.cab-hotspot{position:absolute;transform:translate(-50%,-50%);width:26px;height:26px;border-radius:50%;border:1px solid rgba(255,255,255,.8);background:rgba(95,199,207,.94);color:#06263c;font-size:8px;font-weight:900;box-shadow:0 0 0 5px rgba(95,199,207,.12);display:grid;place-items:center}.cab-hotspot:hover,.cab-hotspot[data-active="true"]{box-shadow:0 0 0 9px rgba(95,199,207,.15)}.cab-hotspot-label{position:absolute;left:16px;right:16px;bottom:16px;max-width:420px;padding:13px 14px;border-radius:15px;background:rgba(3,17,31,.8);backdrop-filter:blur(12px);color:#fff;border:1px solid rgba(255,255,255,.15)}.cab-hotspot-label strong{display:block;font-size:10px}.cab-hotspot-label span{display:block;margin-top:4px;color:#c0d1df;font-size:8.5px;line-height:1.5}.cab-amenities{display:flex;gap:6px;flex-wrap:wrap;margin-top:14px}.cab-amenity{padding:6px 8px;border-radius:999px;background:#f3f7f9;border:1px solid var(--cab-line);font-size:8px;color:#486076}.cab-amenity b{color:#223f58}
.cab-empty{border:1px dashed rgba(2,46,100,.2);border-radius:18px;padding:28px;text-align:center;color:#6c7d8f;background:#fbfcfc}.cab-empty strong{display:block;color:#022e64;font-size:13px;margin-bottom:6px}.cab-empty span{font-size:9.5px;line-height:1.55}
.cab-layout{padding:18px}.cab-layout-note{padding:10px 12px;border-radius:12px;background:#f6f8fa;color:#647689;font-size:8.5px;line-height:1.55;margin-bottom:13px}.cab-seatrows{display:grid;gap:7px;justify-content:center;overflow:auto;padding:8px 0}.cab-row{display:flex;align-items:center;gap:6px}.cab-rowno{width:20px;text-align:right;color:#8290a0;font-size:7.5px}.cab-seatgroup{display:flex;gap:4px}.cab-aisle{width:16px}.cab-seat{width:32px;height:34px;border:1px solid rgba(2,46,100,.18);border-radius:10px 10px 7px 7px;background:#eef3f6;color:#37536c;font-size:8px;font-weight:800}.cab-seat:hover,.cab-seat[data-active="true"]{border-color:#5fc7cf;background:#e2f6f7;color:#022e64}.cab-seatinfo{margin-top:14px;border-top:1px solid var(--cab-line);padding-top:14px}.cab-seatinfo strong{display:block;color:#022e64;font-size:12px}.cab-seatinfo span{display:block;margin-top:4px;color:#6b7c8e;font-size:9px;line-height:1.5}
.cab-scenes{display:grid;grid-template-columns:190px minmax(0,1fr);gap:12px}.cab-scene-list{display:grid;gap:6px;align-content:start;max-height:480px;overflow:auto}.cab-scene-btn{border:1px solid var(--cab-line);border-radius:13px;background:#fff;color:#51647a;padding:11px;text-align:left;font-size:8.5px}.cab-scene-btn[data-active="true"]{border-color:#5fc7cf;background:#edfafa;color:#022e64}.cab-scene-btn strong{display:block;font-size:9.5px}.cab-scene-btn span{display:block;margin-top:3px;color:#7c8a99}.cab-scene-nav{display:flex;gap:8px;justify-content:space-between;margin-top:9px}.cab-action{min-height:39px;border:1px solid var(--cab-line);border-radius:999px;background:#fff;color:#022e64;padding:0 13px;font-size:8.5px;font-weight:800}.cab-action:disabled{opacity:.4}.cab-action-primary{background:#022e64;color:#fff;border-color:#022e64}
.cab-map-card{padding:22px}.cab-map-svg{width:100%;height:auto;display:block;max-height:520px}.cab-zone{cursor:pointer;transition:opacity .15s,filter .15s}.cab-zone:hover,.cab-zone[data-active="true"]{filter:brightness(1.08)}.cab-zone-label{font-size:9px;font-weight:700;fill:#123a5d;text-anchor:middle;pointer-events:none}.cab-map-note{margin-top:12px;color:#6f8092;font-size:8.5px;line-height:1.55}.cab-footer{padding:13px 18px;border-top:1px solid var(--cab-line);background:#fff;display:flex;align-items:center;justify-content:space-between;gap:12px}.cab-footer span{color:#708195;font-size:8.5px;line-height:1.45}.cab-footer button{border:0;border-radius:999px;background:#022e64;color:#fff;padding:9px 12px;font-size:8.5px;font-weight:800}
@media(max-width:900px){.cab-grid{grid-template-columns:1fr}.cab-scenes{grid-template-columns:1fr}.cab-scene-list{display:flex;overflow-x:auto;max-height:none}.cab-scene-btn{min-width:150px}.cab-media,.cab-media img,.cab-media-fallback{height:360px;min-height:360px}}
@media(max-width:560px){.cab-shell{border-radius:22px}.cab-top{padding:22px 18px 18px}.cab-body{padding:10px}.cab-media,.cab-media img,.cab-media-fallback{height:300px;min-height:300px}.cab-pad{padding:16px}.cab-aircraft-visual,.cab-aircraft-visual img{min-height:260px;height:260px}.cab-footer{display:block}.cab-footer button{margin-top:8px;width:100%}.cab-aircraft-strip,.cab-mode-strip,.cab-cabin-strip,.cab-view-strip{padding-left:10px;padding-right:10px}.cab-seat{width:28px;height:31px}.cab-aisle{width:10px}}
@media(prefers-reduced-motion:reduce){.cab-root *{transition:none!important;animation:none!important}}

/* B-011.22 cabin visual alignment */
.cab-root{
  --cab-home-primary:linear-gradient(135deg,#022e64,#0b5c85);
  --cab-home-white:#fff;
  --cab-home-aqua:#d9f1f1;
  --cab-home-sand:#f2e9dc;
  --cab-home-ice:#e9eef8;
  --cab-home-section:#f3f6f8;
  --cab-home-brown:#3c2f20;
}
.cab-shell{
  background:var(--cab-home-section);
  border-color:rgba(2,46,100,.08);
  box-shadow:0 24px 64px rgba(2,46,100,.13);
}
.cab-top{
  background:var(--cab-home-primary);
  isolation:isolate;
}
.cab-top:before{
  content:"";
  position:absolute;
  inset:0;
  z-index:0;
  pointer-events:none;
  opacity:.48;
  background:
    radial-gradient(circle at 82% 10%,rgba(95,199,207,.28),transparent 28%),
    linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),
    linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px);
  background-size:auto,38px 38px,38px 38px;
  animation:cabGridDrift 18s linear infinite;
}
.cab-top>*{position:relative;z-index:1}
@keyframes cabGridDrift{to{background-position:center,76px 38px,38px 76px}}
.cab-selectors{
  background:rgba(255,255,255,.96);
  backdrop-filter:blur(16px);
}
.cab-pill{
  transition:transform .18s ease,background .18s ease,border-color .18s ease,box-shadow .18s ease;
}
.cab-pill:hover{
  transform:translateY(-1px);
  border-color:#5fc7cf;
  box-shadow:0 5px 14px rgba(2,46,100,.07);
}
.cab-pill[data-active="true"]{
  background:linear-gradient(135deg,#022e64,#0b5c85);
  border-color:#022e64;
}
.cab-pill.cab-cabin[data-active="true"]{
  background:#d9f1f1;
  border-color:#5fc7cf;
  color:#022e64;
}
.cab-body{
  background:
    radial-gradient(circle at 90% 4%,rgba(95,199,207,.08),transparent 20%),
    var(--cab-home-section);
}
.cab-card{
  border-color:rgba(2,46,100,.08);
  box-shadow:0 8px 24px rgba(2,46,100,.055);
  transition:transform .26s cubic-bezier(.16,1,.3,1),box-shadow .26s ease,border-color .18s ease;
}
.cab-card:hover{
  border-color:rgba(95,199,207,.34);
  box-shadow:0 16px 34px rgba(2,46,100,.10);
}
.cab-grid>.cab-card:nth-child(2){
  background:#e9eef8;
}
.cab-aircraft-visual{
  background:linear-gradient(145deg,#d9f1f1,#e9eef8);
}
.cab-media{
  background:linear-gradient(135deg,#022e64,#0b5c85);
}
.cab-media:after{
  content:"";
  position:absolute;
  inset:0;
  pointer-events:none;
  background:
    radial-gradient(circle at 84% 12%,rgba(95,199,207,.16),transparent 28%),
    linear-gradient(120deg,rgba(255,255,255,.08),transparent 38%);
}
.cab-hotspot{
  z-index:3;
  animation:cabHotPulse 2.2s ease-out infinite;
}
@keyframes cabHotPulse{
  0%,100%{box-shadow:0 0 0 5px rgba(95,199,207,.12)}
  50%{box-shadow:0 0 0 11px rgba(95,199,207,.04)}
}
.cab-hotspot-label{z-index:4}
.cab-cabin-card{
  transition:transform .2s ease,border-color .2s ease,box-shadow .2s ease;
}
.cab-cabin-card:hover{
  transform:translateY(-2px);
}
.cab-fact:nth-child(4n+1){background:#fff}
.cab-fact:nth-child(4n+2){background:#d9f1f1}
.cab-fact:nth-child(4n+3){background:#f2e9dc}
.cab-fact:nth-child(4n+4){background:#e9eef8}
.cab-amenity:nth-child(4n+1){background:#fff}
.cab-amenity:nth-child(4n+2){background:#d9f1f1}
.cab-amenity:nth-child(4n+3){background:#f2e9dc}
.cab-amenity:nth-child(4n+4){background:#e9eef8}
.cab-seat{
  transition:transform .15s ease,background .15s ease,border-color .15s ease,box-shadow .15s ease;
}
.cab-seat:hover{
  transform:translateY(-2px);
  box-shadow:0 5px 12px rgba(2,46,100,.10);
}
.cab-action-primary,.cab-footer button{
  background:linear-gradient(135deg,#022e64,#0b5c85);
}
@media(prefers-reduced-motion:reduce){
  .cab-top:before,.cab-hotspot{animation:none!important}
}

`;

function PlaneSilhouette(){return html`<svg className="cab-plane-svg" viewBox="0 0 520 180" aria-hidden="true"><path d="M260 12c-9 0-15 15-17 34l-7 43-155 37c-12 3-18 10-16 17 2 7 11 9 21 7l145-21-5 34-45 16c-8 3-11 8-9 13 2 5 8 6 15 4l73-13 73 13c7 2 13 1 15-4 2-5-1-10-9-13l-45-16-5-34 145 21c10 2 19 0 21-7 2-7-4-14-16-17l-155-37-7-43c-2-19-8-34-17-34Z" fill="#8fb1c8" opacity=".82"/></svg>`}
function AircraftVisual({aircraft}){return html`<div className="cab-aircraft-visual">${aircraft._hero?html`<img src=${aircraft._hero} alt=${`${aircraft._name} aircraft`}/>`:html`<div className="cab-visual-fallback"><div><${PlaneSilhouette}/><strong>${aircraft._name}</strong><span>Illustrative aircraft orientation. Published configuration details are shown alongside it.</span></div></div>`}</div>`}
function Facts({aircraft,cabins}){const f=[["Aircraft code",aircraft._code],["Manufacturer",aircraft._manufacturer],["Family",aircraft._family],["Variant",aircraft._variant],["Total seats",aircraft._seats||""]].filter(([,v])=>T(v));return html`<div className="cab-facts">${f.map(([k,v])=>html`<span className="cab-fact"><b>${v}</b><span>${k}</span></span>`)}${cabins.length?html`<span className="cab-fact"><b>${cabins.length}</b><span>Published cabins</span></span>`:null}</div>`}
function Overview({aircraft,cabins,cabinId,setCabin}){return html`<div className="cab-grid"><div className="cab-card"><${AircraftVisual} aircraft=${aircraft}/><div className="cab-pad"><h4 className="cab-title">${aircraft._name}</h4><p className="cab-copy">${T(raw(aircraft,"display_summary","displaySummary"))||"Explore the published aircraft configuration and cabin products."}</p><${Facts} aircraft=${aircraft} cabins=${cabins}/></div></div><aside className="cab-card cab-pad"><h4 className="cab-title">Cabins on this aircraft</h4><p className="cab-copy">Select a cabin to keep it active as you move through the explorer.</p><div className="cab-cabin-list">${cabins.length?cabins.map(c=>html`<button className="cab-cabin-card" data-active=${c._id===cabinId?"true":"false"} onClick=${()=>setCabin(c._id)}><strong>${c._name}</strong><span>${[c._code,c._seats?`${c._seats} seats`:""].filter(Boolean).join(" · ")}</span></button>`):html`<div className="cab-empty"><strong>No cabin records published.</strong><span>Aircraft information remains available above.</span></div>`}</div></aside></div>`}
function MediaStage({image,alt,hotspots,active,setActive,fallbackTitle,fallbackCopy}){const chosen=hotspots.find(h=>h._id===active)||hotspots[0];return html`<div className="cab-card"><div className="cab-media">${image?html`<img src=${image} alt=${alt}/>`:html`<div className="cab-media-fallback"><div><strong>${fallbackTitle}</strong><span>${fallbackCopy}</span></div></div>`}${hotspots.map((h,i)=>html`<button className="cab-hotspot" data-active=${h._id===active?"true":"false"} style=${{left:`${N(raw(h,"x","xPercent"),50)}%`,top:`${N(raw(h,"y","yPercent"),50)}%`}} aria-label=${T(h.label||h.title||`Feature ${i+1}`)} onClick=${()=>setActive(h._id)}>${i+1}</button>`)}${chosen?html`<div className="cab-hotspot-label"><strong>${T(chosen.title||chosen.label||"Cabin feature")}</strong><span>${T(chosen.description||chosen.summary||"")}</span></div>`:null}</div></div>`}
function CabinExplorer({bundle,aircraft,cabin,legacyClass}){
  const views=useMemo(()=>viewsFor(bundle,aircraft,cabin,legacyClass),[bundle,aircraft._id,cabin?._id]);const defaultView=views.find(v=>raw(v,"is_default","isDefault")===true)||views[0];const[viewId,setViewId]=useState(defaultView?._id||"");useEffect(()=>setViewId((views.find(v=>raw(v,"is_default","isDefault")===true)||views[0])?._id||""),[aircraft._id,cabin?._id]);const view=views.find(v=>v._id===viewId)||views[0];const canonicalHot=hotspotsFor(bundle,view);const hotspots=canonicalHot.length?canonicalHot:A(view?._legacyHotspots).map((h,i)=>({...h,_id:T(h.id||h.hotspotId)||`legacy-${i}`}));const[hot,setHot]=useState(hotspots[0]?._id||"");useEffect(()=>setHot(hotspots[0]?._id||""),[viewId]);const amenities=amenityItems(cabin,legacyClass);const desc=T(raw(cabin,"description","summary"))||T(raw(legacyClass,"summary"));
  return html`<div>${views.length?html`<div className="cab-view-strip">${views.map(v=>html`<button className="cab-pill" data-active=${v._id===view?._id?"true":"false"} onClick=${()=>transition(()=>setViewId(v._id))}>${v._label}</button>`)}</div>`:null}<div className="cab-grid"><${MediaStage} image=${view?._image||""} alt=${`${cabin?._name||"Cabin"} cabin view`} hotspots=${hotspots} active=${hot} setActive=${setHot} fallbackTitle=${cabin?._name||"Cabin explorer"} fallbackCopy=${views.length?"The selected view does not currently include an image.":"No cabin imagery is currently published for this configuration."}/><aside className="cab-card cab-pad"><h4 className="cab-title">${cabin?._name||"Cabin"}</h4><p className="cab-copy">${desc||"Published cabin details will appear here when available."}</p>${amenities.length?html`<div className="cab-amenities">${amenities.map(a=>html`<span className="cab-amenity"><b>${a.label}</b>${a.value?` · ${a.value}`:""}</span>`)}</div>`:html`<div className="cab-empty" style=${{marginTop:"14px"}}><strong>Amenities not published.</strong><span>We do not infer cabin features that are not in the airline information.</span></div>`}<div className="cab-layout-note" style=${{marginTop:"14px"}}>${views.length?`${views.length} published view${views.length===1?"":"s"} for this aircraft/cabin context.`:"Cabin views are not currently published."}</div></aside></div></div>`
}
function SeatExperience({aircraft,cabin,legacyClass}){const layout=configuredSeatLayout(cabin);const amenities=amenityItems(cabin,legacyClass);const[selected,setSelected]=useState("");if(!layout.length)return html`<div className="cab-grid"><div className="cab-card cab-pad"><div className="cab-empty"><strong>Cabin layout preview is not published.</strong><span>Seat positions, pitch, width and recline are not inferred. Live seat availability is shown during booking.</span></div></div><aside className="cab-card cab-pad"><h4 className="cab-title">${cabin?._name||"Seat experience"}</h4><p className="cab-copy">${T(raw(cabin,"description","summary"))||"Published cabin information appears here when available."}</p>${amenities.length?html`<div className="cab-amenities">${amenities.map(a=>html`<span className="cab-amenity"><b>${a.label}</b>${a.value?` · ${a.value}`:""}</span>`)}</div>`:null}</aside></div>`;
  const rows=[1,2,3];return html`<div className="cab-grid"><div className="cab-card cab-layout"><div className="cab-layout-note"><strong>Cabin layout preview.</strong> This is an informational representation based on the published cabin layout setting, not a live seat map.</div><div className="cab-seatrows">${rows.map(r=>html`<div className="cab-row"><span className="cab-rowno">${r}</span>${layout.map((group,gi)=>html`<${React.Fragment} key=${gi}><span className="cab-seatgroup">${group.map(letter=>{const id=`${r}${letter}`;return html`<button className="cab-seat" data-active=${selected===id?"true":"false"} onClick=${()=>setSelected(id)}>${id}</button>`})}</span>${gi<layout.length-1?html`<span className="cab-aisle"></span>`:null}</${React.Fragment}>`)}</div>`)}</div><div className="cab-seatinfo"><strong>${selected||"Select a representative seat"}</strong><span>${selected?`${cabin?._name||"Cabin"} · live restrictions, occupancy and pricing are shown only during booking.`:"Choose a seat in the preview to see its cabin context."}</span></div></div><aside className="cab-card cab-pad"><h4 className="cab-title">Published seat & cabin features</h4>${amenities.length?html`<div className="cab-amenities">${amenities.map(a=>html`<span className="cab-amenity"><b>${a.label}</b>${a.value?` · ${a.value}`:""}</span>`)}</div>`:html`<div className="cab-empty"><strong>No seat features published.</strong><span>We do not add configuration details that are not in the published information.</span></div>`}</aside></div>`
}
function Walkthrough({bundle,aircraft}){const scenes=useMemo(()=>scenesFor(bundle,aircraft),[bundle,aircraft._id]);const start=T(raw(aircraft,"walkthrough_start_scene_code","walkthroughStartSceneCode"));const[code,setCode]=useState(start||scenes[0]?._code||"");useEffect(()=>setCode(start||scenes[0]?._code||""),[aircraft._id]);if(!scenes.length)return html`<div className="cab-empty"><strong>No walkthrough is currently published for this aircraft.</strong><span>Use Cabin Explorer for any available cabin views.</span></div>`;const scene=scenes.find(s=>s._code===code)||scenes[0];const hotspots=sceneHotspotsFor(bundle,scene);const[hot,setHot]=useState(hotspots[0]?._id||"");useEffect(()=>setHot(hotspots[0]?._id||""),[scene?._code]);const next=T(raw(scene,"forward_scene_code","forwardSceneCode")),back=T(raw(scene,"back_scene_code","backSceneCode"));return html`<div className="cab-scenes"><div className="cab-scene-list">${scenes.map(s=>html`<button className="cab-scene-btn" data-active=${s._code===scene._code?"true":"false"} onClick=${()=>transition(()=>setCode(s._code))}><strong>${T(s.short_title||s.shortTitle||s.title)||s._code}</strong><span>${s._code}</span></button>`)}</div><div><${MediaStage} image=${T(raw(scene,"image_url","imageUrl","mobile_image_url","mobileImageUrl"))} alt=${T(scene.title)||"Cabin walkthrough scene"} hotspots=${hotspots} active=${hot} setActive=${setHot} fallbackTitle=${T(scene.title)||"Walkthrough scene"} fallbackCopy=${T(scene.summary)||"This walkthrough scene does not currently include an image."}/><div className="cab-scene-nav"><button className="cab-action" disabled=${!back} onClick=${()=>back&&transition(()=>setCode(back))}>${T(scene.back_label||scene.backLabel)||"Previous"}</button><button className="cab-action cab-action-primary" disabled=${!next} onClick=${()=>next&&transition(()=>setCode(next))}>${T(scene.forward_label||scene.forwardLabel)||"Next"}</button></div></div></div>`}
function AircraftMap({aircraft,cabins,cabinId,setCabin}){const total=Math.max(1,cabins.reduce((n,c)=>n+Math.max(1,c._seats),0));let y=95;const zones=cabins.map(c=>{const h=Math.max(38,(Math.max(1,c._seats)/total)*245);const z={c,y,h};y+=h;return z});return html`<div className="cab-grid"><div className="cab-card cab-map-card"><h4 className="cab-title">Cabin layout overview</h4><p className="cab-copy">Illustrative nose-to-tail orientation generated from the published cabin records. It is not an engineering diagram.</p><svg className="cab-map-svg" viewBox="0 0 360 470" role="img" aria-label="Illustrative aircraft cabin orientation"><path d="M180 18c-31 0-53 56-58 126l-7 183c-2 58 26 112 65 125 39-13 67-67 65-125l-7-183C233 74 211 18 180 18Z" fill="#e7eef2" stroke="#9db4c5" stroke-width="2"/><path d="M121 218 30 282l8 22 84-28M239 218l91 64-8 22-84-28" fill="#d9e5eb" stroke="#9db4c5" stroke-width="2"/>${zones.map(({c,y,h})=>html`<g className="cab-zone" data-active=${c._id===cabinId?"true":"false"} onClick=${()=>setCabin(c._id)} onKeyDown=${e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();setCabin(c._id)}}} role="button" tabIndex="0" aria-label=${`Select ${c._name}`}><rect x="137" y=${y} width="86" height=${h-3} rx="14" fill=${c._id===cabinId?"#9de0e5":"#f9fbfc"} stroke=${c._id===cabinId?"#5fc7cf":"#bfd0dc"}/><text className="cab-zone-label" x="180" y=${y+h/2}>${c._name}</text></g>`)}</svg><div className="cab-map-note">Cabin-zone length is proportional to published seat counts only. Door, galley, lavatory and wing relationships are not asserted unless configured elsewhere in the published experience.</div></div><aside className="cab-card cab-pad"><h4 className="cab-title">Published cabins</h4><div className="cab-cabin-list">${cabins.map(c=>html`<button className="cab-cabin-card" data-active=${c._id===cabinId?"true":"false"} onClick=${()=>setCabin(c._id)}><strong>${c._name}</strong><span>${[c._code,c._seats?`${c._seats} seats`:""].filter(Boolean).join(" · ")}</span></button>`)}</div></aside></div>`}
function App({bundle,airline}){
  useMobile();const aircrafts=useMemo(()=>A(bundle?.aircraft).map(normalizeAircraft),[bundle]);const[aircraftId,setAircraftId]=useState(aircrafts[0]?._id||"");const aircraft=aircrafts.find(a=>a._id===aircraftId)||aircrafts[0];const cabins=useMemo(()=>aircraft?normalizeCabins(bundle,aircraft._id):[],[bundle,aircraft?._id]);const[cabinId,setCabinId]=useState(cabins[0]?._id||"");useEffect(()=>setCabinId(cabins[0]?._id||""),[aircraft?._id]);const cabin=cabins.find(c=>c._id===cabinId)||cabins[0];const[mode,setMode]=useState("overview");const legacy=legacyData(airline),legacyClass=legacyClassFor(legacy,cabin);if(!aircraft)return html`<div className="cab-root"><style>${css}</style><div className="cab-shell"><div className="cab-empty" style=${{margin:"18px"}}><strong>No aircraft information is currently published.</strong><span>The airline guide remains available above.</span></div></div></div>`;const modes=[["overview","Overview"],["cabin","Cabin Explorer"],["seat","Seat Experience"],["walk","Walkthrough"],["map","Aircraft Map"]];return html`<div className="cab-root"><style>${css}</style><section className="cab-shell"><header className="cab-top"><div className="cab-kicker">SKANDI · Aircraft & Cabin Explorer</div><h3>${T(airline?.name||airline?.title||aircraft.airline_code||"Airline")} · ${aircraft._name}</h3><p>Explore the published aircraft and cabin experience. Aircraft substitutions can occur, and live seat availability is shown during booking.</p></header><div className="cab-selectors"><div className="cab-aircraft-strip">${aircrafts.map(a=>html`<button className="cab-pill" data-active=${a._id===aircraft._id?"true":"false"} onClick=${()=>transition(()=>setAircraftId(a._id))}>${a._code||"Aircraft"} · ${a._name}</button>`)}</div><div className="cab-mode-strip">${modes.map(([id,label])=>html`<button className="cab-pill" data-active=${mode===id?"true":"false"} onClick=${()=>transition(()=>setMode(id))}>${label}</button>`)}</div>${cabins.length?html`<div className="cab-cabin-strip">${cabins.map(c=>html`<button className="cab-pill cab-cabin" data-active=${c._id===cabin?._id?"true":"false"} onClick=${()=>transition(()=>setCabinId(c._id))}>${c._name}${c._code?` · ${c._code}`:""}</button>`)}</div>`:null}</div><div className="cab-body">${mode==="overview"?html`<${Overview} aircraft=${aircraft} cabins=${cabins} cabinId=${cabinId} setCabin=${setCabinId}/>`:mode==="cabin"?html`<${CabinExplorer} bundle=${bundle} aircraft=${aircraft} cabin=${cabin} legacyClass=${legacyClass}/>`:mode==="seat"?html`<${SeatExperience} aircraft=${aircraft} cabin=${cabin} legacyClass=${legacyClass}/>`:mode==="walk"?html`<${Walkthrough} bundle=${bundle} aircraft=${aircraft}/>`:html`<${AircraftMap} aircraft=${aircraft} cabins=${cabins} cabinId=${cabinId} setCabin=${setCabinId}/>`}</div><footer className="cab-footer"><span>Aircraft and cabin information is provided for travel planning. The operating airline may change aircraft or configuration.</span><button type="button" onClick=${()=>navigate("/flights")}>Explore flights</button></footer></section></div>`
}
function mount(element,bundle,airline){if(!element)return;let root=roots.get(element);if(!root){root=createRoot(element);roots.set(element,root)}root.render(html`<${App} bundle=${bundle||{}} airline=${airline||{}}/>`)}
window.SKANDIOnboardReact={mount,version:"React 19.3 / SKANDI B-011.21"};
window.dispatchEvent(new Event("SKANDI_ONBOARD_REACT_READY"));
const pending=window.__SKANDI_ONBOARD_PENDING__;if(pending){const el=document.getElementById(pending.elementId||"onboardReactRoot");if(el)mount(el,pending.bundle,pending.airline)}
</script>
</body>
</html>
