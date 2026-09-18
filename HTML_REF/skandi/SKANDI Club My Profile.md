# MY CLUB PROFILE

STATUS: NEEDS REVIEW
SLUG: `/my-profile`
WIX PAGE: My Profile.u4k31
AREA: SKANDI
LIVE HTML: YES
ELEMENT: #customerProfileEmbed
LAST SYNCED: 2026-09-18
VERSION: `B-011.31`

## HOW TO USE

***STATUS (OWNER): "TODO", "IN PROGRESS", "NEEDS REVIEW", "REVISIONS NEEDED", "READY", "LIVE", "ARCHIVED"
STATUS (AGENT): "TODO", "IN PROGRESS", "REVISIONS NEEDED", "READY".***

### INFO

- **Customer account core:** `/src/backend/SKANDI_CORE/customerProfile.js`
- **Authentication authority:** Wix Members / canonical SKANDI customer session
- **Customer/loyalty persistence:** canonical SKANDI customer, Club, booking, traveler, wallet, notification and points tables
- **Supplier servicing:** canonical SKANDI_CORE Duffel provider modules only; never direct from HTML

### Architectural rules

- Global SKANDI customer header/footer remain owned by `masterPage.js`; this embed does not duplicate them.
- Frontend HTML never calls Supabase, Duffel or Stripe directly.
- Main account navigation is page-addressable through `section` + `view`, with legacy `tab` compatibility retained.
- Only one account workspace is visible at a time. Main-category navigation is intended to route/reload through the Wix parent rather than stack content.
- SKANDI Club level names, points, thresholds, multiplier and enrollment date come from canonical customer/Club data. No tier benefits are fabricated.
- Travel Documents is not a standalone visible account destination. Customer-action requests and issued travel documents are attached to the relevant booking workspace.
- Duffel controls are capability-gated from live supplier payloads, including order `available_actions`, airline-initiated changes and post-booking baggage availability.
- Post-booking seat reassignment is not advertised because the current Duffel post-booking ancillary workflow used by SKANDI supports baggage, not seats.

### Change log

- **2026-09-18 · B-011.31:** Replaced the horizontal account menu with hierarchical side navigation. Added My Club → Overview, Points Activity and Program Information; page-addressable account workspaces; time-aware greeting; live points/status/member-since summary; booking-specific document/action center under My Upcoming Trips; legacy document message compatibility retained; no database schema mutation.
- **2026-09-18 · B-011.30:** Established the approved dark, premium, static My Profile visual direction inspired by SKANDI Our Network. Removed decorative motion and converted the account to dark architectural surfaces with ivory content planes.
- **2026-09-18 · B-011.29:** Experimental motion-rich visual pass; superseded by B-011.30.
- **2026-09-18 · B-011.28:** Initial My Profile + SKANDI Club convergence integrating customer account, loyalty, trips, travelers, documents, wallet, saved items, notifications and settings.

## LIVE HTML
```<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#03111f">
<title>SKANDI My Profile · B-011.31</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Montserrat:wght@500;600;700;800&display=swap" rel="stylesheet">
<script src="https://js.stripe.com/v3/"></script>
<style>
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
  --sk-dark-muted:#93a4b7;
  --sk-line:rgba(255,255,255,.13);
  --sk-line-soft:rgba(255,255,255,.08);
  --sk-line-dark:rgba(2,46,100,.13);
  --sk-ok:#146b4c;
  --sk-warn:#8a641d;
  --sk-danger:#9e3b31;
  --r-sm:10px;
  --r-md:18px;
  --r-lg:26px;  
  --shadow-dark:0 28px 86px rgba(0,0,0,.30);
  --shadow-panel:0 24px 58px rgba(0,0,0,.17);
  --shadow-light:0 18px 46px rgba(3,17,31,.11);
  --max:1240px;
  --hero-bg-img: url('https://static.wixstatic.com/media/394052_bdef1af6f42f4c6d849452a3341beec2~mv2.png'); /* Or 'none' if no image */
}

*{box-sizing:border-box}
html{background:var(--sk-navy)}
body{margin:0;min-width:320px;background:var(--sk-blue-soft);color:var(--sk-graphite);font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;overflow-x:hidden}
button,input,select,textarea{font:inherit}
button{cursor:pointer}
button:disabled{cursor:not-allowed;opacity:.46}
a{color:inherit}
.hidden{display:none!important}
:focus-visible{outline:3px solid rgba(95,199,207,.7);outline-offset:3px}
.shell{min-height:100vh;background:var(--sk-navy-black)}
.wrap{width:min(var(--max),calc(100% - 48px));margin-inline:auto}

/* Hero */
.hero{position:relative;isolation:isolate;min-height:520px;padding:76px 0 128px;color:#fff;overflow:hidden;background:
  radial-gradient(circle at 77% 16%,rgba(95,199,207,.12),transparent 27%),
  radial-gradient(circle at 18% 90%,rgba(209,188,152,.07),transparent 31%),
  linear-gradient(145deg,#071c32 0%,#06172b 50%,#03101d 100%)}
.hero::before{content:"";position:absolute;inset:0;z-index:-2;pointer-events:none;opacity:.18;background-image:radial-gradient(rgba(255,255,255,.25) .55px,transparent .65px);background-size:18px 18px;mask-image:linear-gradient(180deg,#000,transparent 82%)}
.hero::after{content:"";position:absolute;inset:0;z-index:-1;pointer-events:none;background:
  linear-gradient(180deg,rgba(1,12,25,.06),transparent 36%,rgba(1,12,25,.30) 100%),
  linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px);background-size:auto,84px 100%;mask-image:linear-gradient(90deg,#000,transparent 72%)}
.hero-grid{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(370px,.7fr);gap:70px;align-items:end}
.hero-copy-wrap{max-width:760px}
.eyebrow{display:flex;align-items:center;gap:12px;color:var(--sk-aqua-soft);font-family:Montserrat,sans-serif;font-size:11px;font-weight:800;letter-spacing:.18em;text-transform:uppercase}
.eyebrow::before{content:"";width:34px;height:1px;background:var(--sk-aqua)}
.hero h1{margin:17px 0 20px;max-width:760px;font-family:Montserrat,sans-serif;font-size:clamp(44px,6vw,76px);font-weight:600;line-height:.95;letter-spacing:-.055em}
.hero-copy{max-width:650px;margin:0;color:rgba(255,255,255,.74);font-size:15px;font-weight:500;line-height:1.75}
.hero-actions{display:flex;flex-wrap:wrap;gap:9px;margin-top:29px}
.hero-btn{min-height:44px;padding:0 18px;border:1px solid rgba(255,255,255,.18);border-radius:999px;background:rgba(3,17,31,.56);color:#fff;font-size:11px;font-weight:800;letter-spacing:.02em;backdrop-filter:blur(16px)}
.hero-btn:hover{border-color:rgba(157,224,229,.54);background:rgba(8,35,59,.78)}
.hero-btn.primary{border-color:var(--sk-ivory);background:var(--sk-ivory);color:#07192c}
.hero-btn.primary:hover{background:#fff;border-color:#fff}
.hero-mini-status{display:flex;flex-wrap:wrap;gap:7px 0;margin-top:24px;color:rgba(255,255,255,.58);font-size:10px;font-weight:700;letter-spacing:.02em}
.hero-mini-status span{display:flex;align-items:center}
.hero-mini-status span+span::before{content:"·";margin:0 11px;color:rgba(255,255,255,.25)}

/* Premium membership card */
.member-card{position:relative;min-height:330px;overflow:hidden;padding:28px;border:1px solid rgba(209,188,152,.24);border-radius:24px;color:#fff;background: 
  radial-gradient(circle at 88% 8%,rgba(95,199,207,.11),transparent 27%),
  linear-gradient(150deg,rgba(13,40,65,.96),rgba(5,25,44,.98) 62%,rgba(3,17,31,.98));box-shadow:0 34px 95px rgba(0,0,0,.34)}
.member-card::before{content:"";position:absolute;inset:18px;border:1px solid rgba(255,255,255,.055);border-radius:16px;pointer-events:none}
.member-card::after{content:"SKANDI";position:absolute;right:-6px;bottom:-11px;color:rgba(255,255,255,.028);font:700 66px/1 Montserrat,sans-serif;letter-spacing:-.06em;pointer-events:none}
.member-top,.member-name,.member-number,.member-stats{position:relative;z-index:1}
.member-top{display:flex;justify-content:space-between;gap:20px;align-items:center}
.club-word{font-family:Montserrat,sans-serif;font-size:12px;font-weight:800;letter-spacing:.18em}
.member-tier{padding-left:12px;border-left:1px solid rgba(209,188,152,.46);color:var(--sk-aqua-soft);font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase}
.member-name{margin-top:78px;max-width:86%;font-family:Montserrat,sans-serif;font-size:28px;font-weight:600;letter-spacing:-.035em}
.member-number{margin-top:7px;color:rgba(255,255,255,.53);font-size:11px;letter-spacing:.04em}
.member-stats{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:26px;padding-top:18px;border-top:1px solid rgba(255,255,255,.10)}
.member-stat strong{display:block;font-family:Montserrat,sans-serif;font-size:26px;font-weight:600;letter-spacing:-.04em}
.member-stat span{display:block;margin-top:4px;color:rgba(255,255,255,.46);font-size:9px;font-weight:700;letter-spacing:.13em;text-transform:uppercase}
.member-shine,.member-orbits,.member-orbit-core,.profile-sky,.profile-strip,.floating-profile-action{display:none!important}

/* Navigation */
.nav-wrap{position:relative;z-index:8;margin-top:-58px}
.account-nav{display:flex;gap:4px;overflow:auto;padding:5px;border:1px solid rgba(255,255,255,.14);border-radius:999px;background:rgba(4,21,39,.86);box-shadow:0 20px 60px rgba(0,0,0,.26);backdrop-filter:blur(18px) saturate(1.12);scrollbar-width:none}
.account-nav::-webkit-scrollbar{display:none}
.navbtn{flex:0 0 auto;min-height:40px;padding:0 14px;border:0;border-radius:999px;background:transparent;color:rgba(255,255,255,.62);font-size:10px;font-weight:800;letter-spacing:.045em;text-transform:uppercase;white-space:nowrap}
.navbtn:hover{background:rgba(255,255,255,.06);color:#fff}
.navbtn.active{background:var(--sk-ivory);color:#07192c;box-shadow:0 8px 22px rgba(0,0,0,.20)}

/* Main dark atlas surface */
.main{position:relative;padding:58px 0 110px;background:
  radial-gradient(circle at 14% 8%,rgba(31,107,163,.11),transparent 20%),
  radial-gradient(circle at 86% 24%,rgba(95,199,207,.055),transparent 22%),
  linear-gradient(180deg,#06192d 0%,#06172a 44%,#03111f 100%)}
.main::before{content:"";position:absolute;inset:0;pointer-events:none;opacity:.08;background-image:radial-gradient(rgba(255,255,255,.26) .55px,transparent .65px);background-size:20px 20px;mask-image:linear-gradient(180deg,#000,transparent 70%)}
.main>.wrap{position:relative;z-index:1}
.view{display:none}
.view.active{display:block}
.section-head{display:grid;grid-template-columns:minmax(0,1fr) minmax(280px,520px);gap:48px;align-items:end;margin:24px 0 28px;padding-bottom:22px;border-bottom:1px solid rgba(255,255,255,.10)}
.section-head h2{margin:6px 0 0;color:#fff;font-family:Montserrat,sans-serif;font-size:clamp(34px,4.3vw,54px);font-weight:600;line-height:.98;letter-spacing:-.05em}
.section-head p{max-width:520px;margin:0;color:rgba(255,255,255,.57);font-size:13px;line-height:1.7}
.kicker{display:flex;align-items:center;gap:9px;color:var(--sk-aqua-soft);font-size:10px;font-weight:800;letter-spacing:.16em;text-transform:uppercase}
.kicker::before{content:"";width:24px;height:1px;background:var(--sk-aqua)}
.subhead{margin:34px 0 14px;color:rgba(255,255,255,.78);font-family:Montserrat,sans-serif;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}

.grid{display:grid;gap:16px}
.grid2{grid-template-columns:repeat(2,minmax(0,1fr))}
.grid3{grid-template-columns:repeat(3,minmax(0,1fr))}
.grid4{grid-template-columns:repeat(4,minmax(0,1fr))}
.card{position:relative;overflow:hidden;border:1px solid rgba(216,210,200,.80);border-radius:var(--r-md);background:var(--sk-ivory);box-shadow:var(--shadow-light)}
.card.pad{padding:24px}
.card h3{margin:0 0 9px;color:var(--sk-navy-deep);font-family:Montserrat,sans-serif;font-size:18px;font-weight:700;letter-spacing:-.025em}
.card p{margin:0;color:var(--sk-muted);font-size:12px;line-height:1.65}
.card:hover{border-color:rgba(95,199,207,.52)}

/* Overview */
.overview-feature{display:grid;grid-template-columns:minmax(0,1.28fr) minmax(310px,.72fr);gap:16px}
.next-trip{position:relative;min-height:360px;overflow:hidden;padding:31px;border:1px solid rgba(95,199,207,.20);border-radius:var(--r-lg);color:#fff;background:
  radial-gradient(circle at 86% 16%,rgba(95,199,207,.17),transparent 26%),
  radial-gradient(circle at 18% 100%,rgba(209,188,152,.08),transparent 28%),
  linear-gradient(145deg,#082440,#05223b 58%,#04182b);box-shadow:var(--shadow-dark)}
.next-trip::before{content:"";position:absolute;left:31px;right:31px;top:94px;height:1px;background:linear-gradient(90deg,rgba(95,199,207,.08),rgba(95,199,207,.46),rgba(209,188,152,.24),transparent)}
.next-trip::after{content:"";position:absolute;right:30px;top:89px;width:9px;height:9px;border:1px solid var(--sk-champagne);border-radius:50%;background:#082440}
.trip-inner{position:relative;z-index:1;display:flex;flex-direction:column;height:100%}
.trip-status{display:inline-flex;align-items:center;gap:8px;color:var(--sk-aqua-soft);font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase}
.trip-status::before{content:"";width:6px;height:6px;border-radius:50%;background:var(--sk-aqua)}
.route{margin:52px 0 8px;font-family:Montserrat,sans-serif;font-size:clamp(34px,4.3vw,56px);font-weight:600;line-height:1;letter-spacing:-.055em}
.trip-date{color:rgba(255,255,255,.60);font-size:12px}
.trip-bottom{display:flex;justify-content:space-between;gap:18px;align-items:flex-end;margin-top:auto}
.trip-ref{color:rgba(255,255,255,.46);font-size:9px;font-weight:700;letter-spacing:.12em;text-transform:uppercase}
.action-list{display:grid;gap:0;margin-top:8px;border-top:1px solid var(--sk-line-dark)}
.action-item{position:relative;display:flex;gap:14px;align-items:flex-start;width:100%;padding:16px 0;border:0;border-bottom:1px solid var(--sk-line-dark);background:transparent;text-align:left}
.action-item:last-child{border-bottom:0}
.action-item:hover strong{color:var(--sk-blue-soft)}
.action-icon{display:grid;place-items:center;flex:0 0 auto;width:36px;height:36px;border:1px solid rgba(2,46,100,.11);border-radius:50%;background:#eef5f4;color:var(--sk-navy)}
.action-item strong{display:block;color:var(--sk-navy-deep);font-size:12px}
.action-item span span{display:block;margin-top:4px;color:var(--sk-muted);font-size:11px;line-height:1.5}
.overview-feature+.grid4{gap:0;margin-top:16px!important;overflow:hidden;border:1px solid rgba(255,255,255,.11);border-radius:var(--r-md);background:rgba(255,255,255,.035)}
.overview-feature+.grid4 .metric{min-height:132px;border:0;border-right:1px solid rgba(255,255,255,.09);border-radius:0;background:transparent;box-shadow:none}
.overview-feature+.grid4 .metric:last-child{border-right:0}
.metric{padding:22px}
.metric .num{color:#fff;font-family:Montserrat,sans-serif;font-size:31px;font-weight:600;letter-spacing:-.04em}
.metric .label{margin-top:5px;color:rgba(255,255,255,.48);font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}
.metric .micro{margin-top:14px;color:var(--sk-aqua-soft);font-size:10px;font-weight:700}

/* Buttons, chips and controls */
.btn{min-height:42px;padding:0 16px;border:1px solid var(--sk-navy);border-radius:999px;background:#fff;color:var(--sk-navy);font-size:11px;font-weight:800}
.btn:hover{border-color:var(--sk-blue-soft);box-shadow:0 0 0 3px rgba(95,199,207,.09)}
.btn.primary{border-color:var(--sk-navy-deep);background:var(--sk-navy-deep);color:#fff}
.btn.primary:hover{background:#092844}
.btn.cyan{border-color:var(--sk-aqua);background:var(--sk-aqua);color:#05223b}
.btn.soft{border-color:#d8dee1;background:#f3f4f2;color:var(--sk-navy)}
.btn.danger{border-color:#dcb9b4;background:#fff;color:var(--sk-danger)}
.btn.small{min-height:34px;padding:0 12px;font-size:10px}
.button-row{display:flex;flex-wrap:wrap;gap:7px}
.linkbtn{padding:0;border:0;background:transparent;color:var(--sk-blue-soft);font-size:11px;font-weight:800}
.chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:9px}
.chip{display:inline-flex;align-items:center;min-height:25px;padding:0 9px;border:1px solid rgba(2,46,100,.08);border-radius:999px;background:#eef1f2;color:#53606f;font-size:9px;font-weight:700}
.chip.ok{border-color:#d3e8dd;background:#e8f4ee;color:var(--sk-ok)}
.chip.warn{border-color:#eadbb9;background:#fff6e2;color:var(--sk-warn)}
.chip.blue{border-color:#d2e0ea;background:#eaf1f6;color:var(--sk-navy)}

/* Trips */
.trip-toolbar{display:inline-flex;gap:4px;margin-bottom:16px;padding:5px;border:1px solid rgba(255,255,255,.12);border-radius:999px;background:rgba(4,21,39,.72)}
.filterbtn{min-height:36px;padding:0 13px;border:0;border-radius:999px;background:transparent;color:rgba(255,255,255,.60);font-size:10px;font-weight:800;letter-spacing:.03em}
.filterbtn:hover{color:#fff;background:rgba(255,255,255,.06)}
.filterbtn.active{background:var(--sk-ivory);color:#07192c}
.trip-list{display:grid;gap:0;overflow:hidden;border:1px solid rgba(216,210,200,.82);border-radius:var(--r-lg);background:var(--sk-ivory);box-shadow:var(--shadow-panel)}
.trip-card{display:grid;grid-template-columns:120px 1fr auto;gap:20px;align-items:center;padding:20px 22px;border:0;border-bottom:1px solid rgba(2,46,100,.10);background:transparent}
.trip-card:last-child{border-bottom:0}
.trip-card:hover{background:#fff}
.trip-datebox{padding-right:19px;border-right:1px solid rgba(2,46,100,.10)}
.trip-datebox strong{display:block;color:var(--sk-navy-deep);font-family:Montserrat,sans-serif;font-size:22px;font-weight:700}
.trip-datebox span{color:#8894a0;font-size:10px}
.trip-card h3{margin:0 0 6px;color:var(--sk-navy-deep);font-family:Montserrat,sans-serif;font-size:18px;font-weight:700}
.trip-card p{margin:0;color:var(--sk-muted);font-size:11px}

/* Club */
.club-section{position:relative;overflow:hidden;padding:32px;border:1px solid rgba(209,188,152,.16);border-radius:var(--r-lg);background:
  radial-gradient(circle at 92% 0,rgba(95,199,207,.08),transparent 25%),
  linear-gradient(145deg,#0a2138,#061a30 58%,#041523);box-shadow:var(--shadow-dark)}
.club-section::after{content:"";position:absolute;right:-90px;top:-130px;width:280px;height:280px;border:1px solid rgba(209,188,152,.11);border-radius:50%;box-shadow:0 0 0 34px rgba(209,188,152,.025),0 0 0 72px rgba(95,199,207,.02);pointer-events:none}
.club-grid{position:relative;z-index:1;display:grid;grid-template-columns:minmax(300px,.76fr) minmax(0,1.24fr);gap:30px;align-items:stretch}
.club-digital{position:relative;display:flex;flex-direction:column;min-height:300px;padding:25px;border:1px solid rgba(209,188,152,.24);border-radius:22px;color:#fff;background:linear-gradient(150deg,#071a2d,#0a2a49 62%,#082239);box-shadow:0 24px 55px rgba(0,0,0,.23)}
.club-digital::after{content:"SKANDI";position:absolute;right:-10px;bottom:-14px;color:rgba(255,255,255,.027);font:700 58px/1 Montserrat,sans-serif;letter-spacing:-.055em}
.club-digital .brandline{display:flex;justify-content:space-between;gap:18px;font-family:Montserrat,sans-serif;font-size:10px;font-weight:800;letter-spacing:.16em}
.club-digital .club-tier{color:var(--sk-aqua-soft)}
.club-digital .member-name2{margin-top:auto;color:#fff;font-family:Montserrat,sans-serif;font-size:24px;font-weight:600;letter-spacing:-.035em}
.club-digital .member-no2{margin-top:5px;color:rgba(255,255,255,.48);font-size:10px}
.club-digital .points2{margin-top:18px;color:#fff;font-family:Montserrat,sans-serif;font-size:29px;font-weight:600}
.club-section .kicker{color:var(--sk-aqua-soft)}
.club-section h3,.club-section h3[style]{color:#fff!important;font-weight:600!important}
.club-section p,.club-section p[style]{color:rgba(255,255,255,.59)!important}
.progress{position:relative;height:7px;overflow:visible;border-radius:99px;background:rgba(255,255,255,.10)}
.progress span{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,var(--sk-blue-soft),var(--sk-aqua))}
.progress::after{content:"";position:absolute;left:var(--club-progress);top:50%;width:11px;height:11px;border:3px solid #071a2d;border-radius:50%;background:var(--sk-aqua);box-shadow:0 0 0 1px rgba(157,224,229,.40);transform:translate(-50%,-50%)}
.tier-line{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-top:18px}
.tier-pill{padding:11px 7px;border:1px solid rgba(255,255,255,.10);border-radius:12px;background:rgba(255,255,255,.035);color:rgba(255,255,255,.48);text-align:center;font-size:9px}
.tier-pill.current{border-color:rgba(157,224,229,.45);background:rgba(95,199,207,.10);color:#fff}
.tier-pill strong{display:block;margin-bottom:3px;color:inherit;font-size:10px}
.ledger{position:relative;z-index:1;margin-top:22px;border-top:1px solid rgba(255,255,255,.10)}
.club-section .subhead{color:rgba(255,255,255,.78)}
.ledger-row{display:grid;grid-template-columns:110px 1fr auto;gap:15px;align-items:center;padding:13px 0;border-bottom:1px solid rgba(255,255,255,.08)}
.ledger-row .date{color:rgba(255,255,255,.40);font-size:10px}
.ledger-row strong{color:#fff;font-size:12px}
.ledger-row .pts{color:var(--sk-aqua-soft);font-family:Montserrat,sans-serif;font-weight:700}
.ledger-row .pts.neg{color:#efb2ab}

/* Travelers */
.traveler-card{padding:22px}
.traveler-head{display:flex;align-items:center;gap:13px}
.avatar{display:grid;place-items:center;width:46px;height:46px;border:1px solid rgba(2,46,100,.10);border-radius:50%;background:#e9f2f3;color:var(--sk-navy);font-family:Montserrat,sans-serif;font-size:12px;font-weight:800}
.traveler-name{color:var(--sk-navy-deep);font-family:Montserrat,sans-serif;font-weight:700}
.traveler-meta{margin-top:3px;color:var(--sk-muted);font-size:10px}
.traveler-info{display:grid;grid-template-columns:repeat(2,1fr);gap:11px;margin-top:18px;padding-top:17px;border-top:1px solid rgba(2,46,100,.10)}
.info-pair span{display:block;color:#8a96a4;font-size:8px;font-weight:800;letter-spacing:.09em;text-transform:uppercase}
.info-pair strong{display:block;margin-top:4px;color:#344252;font-size:11px}
.traveler-actions{display:flex;gap:7px;margin-top:18px}

/* Documents */
.docmetrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:0;overflow:hidden;margin-bottom:18px;border:1px solid rgba(255,255,255,.11);border-radius:var(--r-md);background:rgba(255,255,255,.035)}
.docmetric{padding:18px 20px;border:0;border-right:1px solid rgba(255,255,255,.08);background:transparent}
.docmetric:last-child{border-right:0}
.docmetric .n{color:#fff;font-family:Montserrat,sans-serif;font-size:27px;font-weight:600}
.docmetric .l{margin-top:4px;color:rgba(255,255,255,.45);font-size:9px;font-weight:700;letter-spacing:.09em;text-transform:uppercase}
.sectiontitle{margin:24px 0 10px;color:rgba(255,255,255,.68);font-size:9px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}
.docitem{display:grid;grid-template-columns:44px 1fr auto;gap:14px;align-items:center;margin-bottom:8px;padding:14px;border:1px solid rgba(216,210,200,.80);border-radius:15px;background:var(--sk-ivory)}
.docitem:hover{border-color:rgba(95,199,207,.48)}
.docicon{display:grid;place-items:center;width:42px;height:42px;border:1px solid rgba(2,46,100,.08);border-radius:50%;background:#edf2f2;color:var(--sk-navy);font-size:9px;font-weight:800}
.docitem h3{margin:0 0 4px;color:var(--sk-navy-deep);font-family:Montserrat,sans-serif;font-size:13px}
.docitem p{margin:0;color:var(--sk-muted);font-size:10px}
.docactions{display:flex;gap:6px}
.status{display:inline-flex;align-items:center;min-height:24px;padding:0 8px;border-radius:999px;background:#eef1f2;color:#596674;font-size:8px;font-weight:800;letter-spacing:.06em;text-transform:uppercase}
.status.ok{background:#e8f4ee;color:var(--sk-ok)}
.status.warn{background:#fff6e2;color:var(--sk-warn)}
.status.bad{background:#fff0ef;color:var(--sk-danger)}

/* Empty */
.empty{padding:44px 20px;border:1px solid rgba(255,255,255,.11);border-radius:var(--r-md);background:rgba(255,255,255,.035);text-align:center}
.empty svg{width:36px;height:36px;margin-bottom:12px;color:var(--sk-aqua-soft)}
.empty strong{display:block;color:#fff;font-family:Montserrat,sans-serif;font-size:15px;font-weight:600}
.empty span{display:block;max-width:430px;margin:6px auto 0;color:rgba(255,255,255,.48);font-size:11px;line-height:1.6}
.trip-list .empty{border:0;border-radius:0;background:var(--sk-ivory)}
.trip-list .empty strong{color:var(--sk-navy-deep)}
.trip-list .empty span{color:var(--sk-muted)}
.trip-list .empty svg{color:var(--sk-blue-soft)}

/* Wallet / Saved / Notifications */
.wallet-card{min-height:190px;padding:20px;border-color:rgba(95,199,207,.14);background:
  radial-gradient(circle at 90% 10%,rgba(95,199,207,.12),transparent 28%),
  linear-gradient(145deg,#0a2743,#061a30);color:#fff;box-shadow:var(--shadow-panel)}
.card-chip{width:40px;height:27px;margin-bottom:29px;border:1px solid rgba(255,255,255,.20);border-radius:6px;background:linear-gradient(135deg,#bba172,#e1cfaa)}
.wallet-number{color:#fff;font-family:Montserrat,sans-serif;font-size:15px;letter-spacing:.10em}
.wallet-meta{display:flex;justify-content:space-between;margin-top:10px;color:rgba(255,255,255,.48);font-size:10px}
.saved-card{display:grid;grid-template-columns:88px 1fr auto;gap:15px;align-items:center;padding:12px}
.saved-img{width:88px;height:72px;border-radius:10px;object-fit:cover;background:linear-gradient(145deg,#c9e8e9,#d9dce4)}
.notif{display:grid;grid-template-columns:12px 1fr auto;gap:14px;align-items:start;padding:18px;border-bottom:1px solid rgba(2,46,100,.10)}
.notif:last-child{border-bottom:0}
.notif.unread{background:#f4f9f8}
.notif-dot{width:7px;height:7px;margin-top:5px;border-radius:50%;background:#c4ccd3}
.notif.unread .notif-dot{background:var(--sk-aqua)}
.notif strong{color:var(--sk-navy-deep);font-size:12px}
.notif p{margin:4px 0 0;color:var(--sk-muted);font-size:11px;line-height:1.55}

/* Profile form */
.profile-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:17px}
.field.full{grid-column:1/-1}
.field label{display:block;margin:0 0 7px;color:#637181;font-size:9px;font-weight:800;letter-spacing:.09em;text-transform:uppercase}
.control{width:100%;min-height:46px;padding:0 13px;border:1px solid #cbd5dd;border-radius:10px;outline:0;background:#fff;color:#152130}
.control:focus{border-color:var(--sk-aqua);box-shadow:0 0 0 3px rgba(95,199,207,.12)}
textarea.control{min-height:100px;padding:12px;resize:vertical}
.checkbox{display:flex;gap:10px;align-items:flex-start;color:var(--sk-muted);font-size:12px;line-height:1.5}
.checkbox input{margin-top:3px}
.provider-note{margin-top:16px;padding:13px 14px;border:1px solid #c5e1e3;border-radius:12px;background:#edf7f8;color:#31596a;font-size:10px;line-height:1.6}

/* Drawer */
.drawer-shade{position:fixed;inset:0;z-index:90;pointer-events:none;opacity:0;background:rgba(1,10,20,.68);backdrop-filter:blur(4px)}
.drawer-shade.open{pointer-events:auto;opacity:1}
.drawer{position:fixed;z-index:91;top:0;right:0;width:min(720px,100vw);height:100vh;overflow:auto;background:
  radial-gradient(circle at 100% 0,rgba(95,199,207,.08),transparent 22%),
  linear-gradient(180deg,#071c32,#041523);box-shadow:-32px 0 90px rgba(0,0,0,.38);transform:translateX(102%)}
.drawer.open{transform:none}
.drawer-head{position:sticky;top:0;z-index:2;display:flex;justify-content:space-between;align-items:center;padding:18px 22px;border-bottom:1px solid rgba(255,255,255,.10);background:rgba(4,21,35,.92);backdrop-filter:blur(14px)}
.drawer-head strong{color:#fff;font-family:Montserrat,sans-serif;font-size:13px}
.iconbtn{display:grid;place-items:center;width:38px;height:38px;border:1px solid rgba(255,255,255,.14);border-radius:50%;background:rgba(255,255,255,.05);color:#fff}
.iconbtn:hover{border-color:rgba(157,224,229,.44);background:rgba(255,255,255,.08)}
.drawer-body{padding:24px;color:#fff}
.booking-hero{padding:25px;border:1px solid rgba(95,199,207,.17);border-radius:22px;background:
  radial-gradient(circle at 82% 20%,rgba(209,188,152,.10),transparent 23%),
  linear-gradient(145deg,#0a2845,#061a30);color:#fff}
.booking-hero .route{margin:12px 0 5px;font-size:36px}
.booking-hero p{color:rgba(255,255,255,.56);font-size:11px}
.cap-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:9px;margin-top:17px}
.cap{padding:13px;border:1px solid rgba(255,255,255,.10);border-radius:12px;background:rgba(255,255,255,.04)}
.cap strong{display:block;color:#fff;font-size:11px}
.cap span{display:block;margin-top:3px;color:rgba(255,255,255,.48);font-size:9px;line-height:1.5}
.component{padding:14px 0;border-bottom:1px solid rgba(255,255,255,.09)}
.component strong{color:#fff;font-size:11px}
.component span{display:block;margin-top:3px;color:rgba(255,255,255,.48);font-size:10px}
.drawer .subhead{color:var(--sk-aqua-soft)}
.drawer .provider-note{background:rgba(95,199,207,.08);border-color:rgba(95,199,207,.18);color:#c7e8ea}
.drawer .btn.soft{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.15);color:#fff}
.drawer .btn.primary{border-color:var(--sk-ivory);background:var(--sk-ivory);color:#07192c}
.drawer .card{border-color:rgba(255,255,255,.10);background:rgba(255,255,255,.05);box-shadow:none}
.drawer .card h3{color:#fff}
.drawer .card p{color:rgba(255,255,255,.55)}

/* Modal */
.modal-shade{position:fixed;inset:0;z-index:110;display:none;align-items:center;justify-content:center;padding:20px;background:rgba(1,10,20,.76);backdrop-filter:blur(5px)}
.modal-shade.open{display:flex}
.modal{width:min(650px,100%);max-height:90vh;overflow:auto;border:1px solid rgba(255,255,255,.12);border-radius:22px;background:var(--sk-ivory);box-shadow:0 44px 120px rgba(0,0,0,.42)}
.modal-head{display:flex;justify-content:space-between;align-items:center;padding:19px 22px;border-bottom:1px solid var(--sk-line-dark);background:#f7f4ee}
.modal-head h3{margin:0;color:var(--sk-navy-deep);font-family:Montserrat,sans-serif;font-size:17px}
.modal .iconbtn{border-color:var(--sk-line-dark);background:#fff;color:var(--sk-navy)}
.modal-body{padding:22px}
.modal-foot{display:flex;justify-content:flex-end;gap:8px;padding:17px 22px;border-top:1px solid var(--sk-line-dark);background:#f7f4ee}
.choice{display:flex;gap:12px;margin-bottom:8px;padding:14px;border:1px solid var(--sk-line-dark);border-radius:13px;background:#fff}
.choice input{margin-top:4px}
.choice strong{display:block;color:var(--sk-navy-deep);font-size:11px}
.choice span{display:block;margin-top:3px;color:var(--sk-muted);font-size:10px}
.price{margin-left:auto;white-space:nowrap;color:var(--sk-navy);font-family:Montserrat,sans-serif;font-weight:700}
.stripe-box{margin-top:12px;padding:15px;border:1px solid var(--sk-line-dark);border-radius:13px;background:#fff}

/* Toast / loading */
.toast{position:fixed;z-index:200;left:50%;bottom:24px;pointer-events:none;opacity:0;padding:11px 17px;border:1px solid rgba(255,255,255,.10);border-radius:999px;background:#07192c;color:#fff;box-shadow:0 16px 45px rgba(0,0,0,.28);font-size:11px;font-weight:700;transform:translateX(-50%)}
.toast.show{opacity:1}
.toast.bad{background:#6f2824}
.loading{position:fixed;inset:0;z-index:300;display:none;place-items:center;background:rgba(3,17,31,.70);backdrop-filter:blur(7px)}
.loading.show{display:grid}
.spinner{width:46px;height:46px;border:2px solid rgba(255,255,255,.20);border-top-color:var(--sk-aqua);border-radius:50%}

@media(max-width:980px){
  .wrap{width:min(100% - 32px,var(--max))}
  .hero{min-height:0;padding:62px 0 114px}
  .hero-grid,.overview-feature,.club-grid{grid-template-columns:1fr}
  .hero-grid{gap:34px}
  .member-card{max-width:600px;min-height:300px}
  .member-name{margin-top:58px}
  .section-head{grid-template-columns:1fr;gap:14px;align-items:start}
  .grid4{grid-template-columns:repeat(2,1fr)}
  .grid3{grid-template-columns:repeat(2,1fr)}
  .overview-feature+.grid4 .metric:nth-child(2){border-right:0}
  .overview-feature+.grid4 .metric:nth-child(-n+2){border-bottom:1px solid rgba(255,255,255,.09)}
  .trip-card{grid-template-columns:100px 1fr}
  .trip-card>.button-row,.trip-card>div:last-child{grid-column:1/-1}
  .profile-form{grid-template-columns:1fr}
  .field.full{grid-column:auto}
}
@media(max-width:640px){
  .wrap{width:min(100% - 20px,var(--max))}
  .hero{padding:48px 0 96px}
  .hero h1{font-size:44px}
  .hero-copy{font-size:13px}
  .hero-mini-status{display:none}
  .hero-grid{gap:26px}
  .member-card{min-height:286px;padding:22px;border-radius:20px}
  .member-name{margin-top:48px;font-size:24px}
  .member-card::after{font-size:50px}
  .nav-wrap{margin-top:-43px}
  .account-nav{border-radius:16px;padding:5px}
  .navbtn{min-height:38px;padding:0 12px;font-size:9px}
  .main{padding:45px 0 80px}
  .section-head{margin-top:12px;padding-bottom:18px}
  .section-head h2{font-size:38px}
  .grid2,.grid3,.grid4,.docmetrics{grid-template-columns:1fr}
  .overview-feature+.grid4 .metric{border-right:0;border-bottom:1px solid rgba(255,255,255,.09)}
  .overview-feature+.grid4 .metric:last-child{border-bottom:0}
  .next-trip{min-height:310px;padding:23px}
  .next-trip::before{left:23px;right:23px;top:82px}
  .next-trip::after{right:22px;top:77px}
  .route{margin-top:44px}
  .trip-bottom{align-items:flex-start;flex-direction:column}
  .trip-card{grid-template-columns:1fr;padding:18px}
  .trip-datebox{padding:0 0 12px;border-right:0;border-bottom:1px solid rgba(2,46,100,.10)}
  .club-section{padding:18px}
  .club-digital{min-height:260px}
  .tier-line{grid-template-columns:repeat(2,1fr)}
  .ledger-row{grid-template-columns:1fr auto}
  .ledger-row .date{grid-column:1/-1}
  .traveler-info{grid-template-columns:1fr}
  .docmetric{border-right:0;border-bottom:1px solid rgba(255,255,255,.08)}
  .docmetric:last-child{border-bottom:0}
  .docitem{grid-template-columns:42px 1fr}
  .docactions{grid-column:1/-1;justify-content:flex-end}
  .saved-card{grid-template-columns:76px 1fr}
  .saved-img{width:76px;height:68px}
  .saved-card>.button-row{grid-column:1/-1}
  .notif{grid-template-columns:10px 1fr}
  .notif>.btn,.notif>button{grid-column:2}
  .drawer-body{padding:16px}
  .cap-grid{grid-template-columns:1fr}
  .modal-shade{padding:10px}
  .modal{border-radius:18px}
}
@media(prefers-reduced-motion:reduce){
  *,*::before,*::after{scroll-behavior:auto!important;transition:none!important;animation:none!important}
}


/* B-011.31 account shell -------------------------------------------------- */
.account-masthead {
  background:
    linear-gradient(180deg, rgba(3, 17, 31, 0.5) 0%, #03111f 90%),
    var(--hero-bg-img),
    linear-gradient(145deg, #071c32 90%, #06172b 52%, #03101d 10%);
  background-size: cover;
  background-position: center;
}
.account-masthead .wrap{position:relative;z-index:1}
.account-summary{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(560px,.9fr);gap:56px;align-items:end;padding-bottom:44px}
.account-greeting .eyebrow{margin-bottom:16px}
.account-greeting h1{margin:0;font-family:Montserrat,sans-serif;font-size:clamp(38px,4.8vw,62px);font-weight:500;line-height:1;letter-spacing:-.05em}
.account-greeting h1 span{font-weight:800}
.account-greeting p{max-width:650px;margin:17px 0 0;color:rgba(255,255,255,.62);font-size:13px;line-height:1.7}
.account-summary-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:0;border-top:1px solid rgba(255,255,255,.12);border-bottom:1px solid rgba(255,255,255,.12)}
.account-summary-item{min-height:100px;padding:22px 22px 20px;border-right:1px solid rgba(255,255,255,.10)}
.account-summary-item:last-child{border-right:0}
.account-summary-label{display:block;color:rgba(255,255,255,.46);font-size:9px;font-weight:800;letter-spacing:.13em;text-transform:uppercase}
.account-summary-value{display:block;margin-top:10px;color:#fff;font-family:Montserrat,sans-serif;font-size:23px;font-weight:600;letter-spacing:-.035em}
.account-summary-sub{display:block;margin-top:4px;color:var(--sk-aqua-soft);font-size:9px;font-weight:700}
.account-identity-strip{display:flex;justify-content:space-between;gap:24px;padding:14px 0;border-top:1px solid rgba(255,255,255,.09);color:rgba(255,255,255,.52);font-size:9px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}
.account-identity-strip strong{color:rgba(255,255,255,.82);font-weight:800}

.account-stage{position:relative;padding:52px 0 112px;background:
  radial-gradient(circle at 12% 10%,rgba(31,107,163,.12),transparent 22%),
  radial-gradient(circle at 88% 32%,rgba(95,199,207,.055),transparent 28%),
  linear-gradient(180deg,#071827 0%,#041321 55%,#03111f 100%)}
.account-stage::before{content:"";position:absolute;inset:0;pointer-events:none;opacity:.14;background-image:
  linear-gradient(30deg,rgba(255,255,255,.06) 12%,transparent 12.5%,transparent 87%,rgba(255,255,255,.06) 87.5%),
  linear-gradient(150deg,rgba(255,255,255,.04) 12%,transparent 12.5%,transparent 87%,rgba(255,255,255,.04) 87.5%);background-size:108px 188px;mask-image:linear-gradient(90deg,transparent,#000 22%,#000 78%,transparent)}
.account-layout{position:relative;z-index:1;display:grid;grid-template-columns:248px minmax(0,1fr);gap:48px;align-items:start}
.side-menu{position:sticky;top:24px;padding:4px 0 24px;color:#fff}
.side-menu-title{padding:0 0 18px;color:rgba(255,255,255,.35);font-family:Montserrat,sans-serif;font-size:9px;font-weight:800;letter-spacing:.18em;text-transform:uppercase}
.side-category{border-top:1px solid rgba(255,255,255,.12)}
.side-category:last-of-type{border-bottom:1px solid rgba(255,255,255,.12)}
.side-category-head{display:flex;align-items:center;justify-content:space-between;width:100%;padding:18px 0;border:0;background:transparent;color:#fff;text-align:left;font-family:Montserrat,sans-serif;font-size:13px;font-weight:700;letter-spacing:-.01em}
.side-category-head::after{content:"+";color:rgba(255,255,255,.38);font:400 18px/1 Inter,sans-serif}
.side-category.open>.side-category-head::after{content:"−";color:var(--sk-aqua-soft)}
.side-category.active>.side-category-head{color:var(--sk-aqua-soft)}
.side-options{display:none;padding:0 0 16px}
.side-category.open>.side-options{display:block}
.side-link{position:relative;display:block;width:100%;padding:9px 8px 9px 17px;border:0;background:transparent;color:rgba(255,255,255,.55);text-align:left;font-size:11px;font-weight:600;line-height:1.35}
.side-link::before{content:"";position:absolute;left:0;top:8px;bottom:8px;width:2px;background:transparent}
.side-link:hover{color:#fff}
.side-link.active{color:#fff;font-weight:750}
.side-link.active::before{background:var(--sk-aqua)}
.side-menu-footer{padding-top:22px;color:rgba(255,255,255,.42);font-size:10px;line-height:1.6}
.side-menu-footer button{padding:0;border:0;background:none;color:var(--sk-aqua-soft);font-weight:800}
.account-workspace{min-width:0}
.view{display:none}
.view.active{display:block}
.page-intro{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(280px,.7fr);gap:38px;align-items:end;margin:0 0 26px}
.page-intro .kicker{color:var(--sk-aqua-soft)}
.page-intro h2{margin:8px 0 0;color:#fff;font-family:Montserrat,sans-serif;font-size:clamp(34px,4.4vw,54px);font-weight:500;line-height:1;letter-spacing:-.05em}
.page-intro p{margin:0;color:rgba(255,255,255,.54);font-size:12px;line-height:1.75}

/* Club overview */
.club-overview-grid{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(280px,.65fr);gap:18px}
.club-status-panel{position:relative;overflow:hidden;min-height:430px;padding:32px;border:1px solid rgba(209,188,152,.17);border-radius:24px;background:
  radial-gradient(circle at 90% 6%,rgba(95,199,207,.09),transparent 28%),
  linear-gradient(145deg,#0a2138,#061a30 62%,#041523);box-shadow:var(--shadow-dark);color:#fff}
.club-status-panel::after{content:"";position:absolute;right:-110px;bottom:-155px;width:360px;height:360px;border:1px solid rgba(209,188,152,.10);border-radius:50%;box-shadow:0 0 0 42px rgba(209,188,152,.025),0 0 0 84px rgba(95,199,207,.018)}
.club-status-head{position:relative;z-index:1;display:flex;justify-content:space-between;gap:24px;align-items:flex-start}
.club-status-name{font-family:Montserrat,sans-serif;font-size:31px;font-weight:550;letter-spacing:-.045em}
.club-status-caption{margin-top:6px;color:rgba(255,255,255,.48);font-size:10px;letter-spacing:.08em;text-transform:uppercase}
.club-number-badge{padding:9px 12px;border:1px solid rgba(209,188,152,.22);border-radius:999px;color:var(--sk-aqua-soft);font-size:9px;font-weight:800;letter-spacing:.09em;text-transform:uppercase}
.club-status-body{position:relative;z-index:1;display:grid;grid-template-columns:210px 1fr;gap:28px;align-items:center;margin-top:35px}
.status-ring{--p:0;position:relative;width:188px;height:188px;border-radius:50%;background:conic-gradient(var(--sk-aqua) calc(var(--p)*1%),rgba(255,255,255,.10) 0);box-shadow:inset 0 0 0 1px rgba(255,255,255,.04)}
.status-ring::before{content:"";position:absolute;inset:12px;border-radius:50%;background:#071c30;box-shadow:inset 0 0 0 1px rgba(255,255,255,.08)}
.status-ring-content{position:absolute;inset:0;z-index:1;display:grid;place-content:center;text-align:center}
.status-ring-content strong{display:block;font-family:Montserrat,sans-serif;font-size:28px;font-weight:600;letter-spacing:-.04em}
.status-ring-content span{display:block;margin-top:5px;color:rgba(255,255,255,.45);font-size:9px;font-weight:700;letter-spacing:.10em;text-transform:uppercase}
.status-copy h3{margin:0;color:#fff;font-family:Montserrat,sans-serif;font-size:27px;font-weight:550;letter-spacing:-.035em}
.status-copy p{margin:10px 0 0;color:rgba(255,255,255,.57);font-size:12px;line-height:1.7}
.status-facts{display:grid;grid-template-columns:repeat(3,1fr);gap:0;margin-top:26px;border-top:1px solid rgba(255,255,255,.11)}
.status-fact{padding:18px 18px 0 0}
.status-fact strong{display:block;color:#fff;font-family:Montserrat,sans-serif;font-size:19px;font-weight:600}
.status-fact span{display:block;margin-top:5px;color:rgba(255,255,255,.40);font-size:9px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}
.club-points-card{display:flex;flex-direction:column;min-height:430px;padding:30px;border:1px solid rgba(216,210,200,.84);border-radius:24px;background:var(--sk-ivory);box-shadow:var(--shadow-light)}
.club-points-card .label{color:var(--sk-muted);font-size:9px;font-weight:800;letter-spacing:.11em;text-transform:uppercase}
.club-points-card .points{margin-top:12px;color:var(--sk-navy-deep);font-family:Montserrat,sans-serif;font-size:54px;font-weight:550;letter-spacing:-.055em}
.club-points-card p{margin:9px 0 0;color:var(--sk-muted);font-size:11px;line-height:1.65}
.club-points-card .member-since{margin-top:auto;padding-top:24px;border-top:1px solid var(--sk-line-dark)}
.club-points-card .member-since strong{display:block;color:var(--sk-navy-deep);font-size:14px}
.club-points-card .member-since span{display:block;margin-top:4px;color:var(--sk-muted);font-size:10px}
.quick-links-title{margin:34px 0 14px;color:#fff;font-family:Montserrat,sans-serif;font-size:21px;font-weight:550;letter-spacing:-.025em}
.quick-links{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
.quick-link{min-height:155px;padding:20px;border:1px solid rgba(216,210,200,.78);border-radius:16px;background:var(--sk-ivory);box-shadow:var(--shadow-light)}
.quick-link .quick-icon{display:grid;place-items:center;width:38px;height:38px;border:1px solid rgba(2,46,100,.10);border-radius:50%;background:#edf4f4;color:var(--sk-navy)}
.quick-link strong{display:block;margin-top:20px;color:var(--sk-navy-deep);font-family:Montserrat,sans-serif;font-size:14px}
.quick-link span{display:block;margin-top:5px;color:var(--sk-muted);font-size:10px;line-height:1.5}
.quick-link:hover{border-color:rgba(95,199,207,.55)}
.club-snapshot{margin-top:18px;overflow:hidden;border:1px solid rgba(255,255,255,.10);border-radius:18px;background:rgba(255,255,255,.035)}
.club-snapshot-head{display:flex;justify-content:space-between;gap:20px;align-items:center;padding:19px 22px;border-bottom:1px solid rgba(255,255,255,.08)}
.club-snapshot-head strong{color:#fff;font-family:Montserrat,sans-serif;font-size:15px}
.club-snapshot-head button{border:0;background:transparent;color:var(--sk-aqua-soft);font-size:10px;font-weight:800}
.club-activity-mini{display:grid;grid-template-columns:118px 1fr auto;gap:16px;align-items:center;padding:14px 22px;border-bottom:1px solid rgba(255,255,255,.07)}
.club-activity-mini:last-child{border-bottom:0}
.club-activity-mini .date{color:rgba(255,255,255,.38);font-size:9px}
.club-activity-mini strong{color:#fff;font-size:11px}
.club-activity-mini .pts{color:var(--sk-aqua-soft);font-family:Montserrat,sans-serif;font-size:12px;font-weight:700}

/* Separate club pages */
.activity-toolbar{display:flex;justify-content:space-between;gap:18px;align-items:center;margin-bottom:14px}
.activity-filters{display:flex;flex-wrap:wrap;gap:7px}
.activity-filter{min-height:34px;padding:0 12px;border:1px solid rgba(255,255,255,.12);border-radius:999px;background:transparent;color:rgba(255,255,255,.55);font-size:9px;font-weight:800}
.activity-filter.active{border-color:var(--sk-aqua);background:rgba(95,199,207,.10);color:#fff}
.activity-list{overflow:hidden;border:1px solid rgba(216,210,200,.82);border-radius:20px;background:var(--sk-ivory);box-shadow:var(--shadow-light)}
.activity-row{display:grid;grid-template-columns:132px 1fr 130px;gap:18px;align-items:center;padding:18px 22px;border-bottom:1px solid var(--sk-line-dark)}
.activity-row:last-child{border-bottom:0}
.activity-row .date{color:#8a96a3;font-size:10px}
.activity-row strong{display:block;color:var(--sk-navy-deep);font-size:12px}
.activity-row small{display:block;margin-top:4px;color:var(--sk-muted);font-size:9px}
.activity-row .amount{text-align:right;color:var(--sk-navy);font-family:Montserrat,sans-serif;font-size:15px;font-weight:700}
.activity-row .amount.neg{color:var(--sk-danger)}
.tier-table{overflow:hidden;border:1px solid rgba(216,210,200,.82);border-radius:20px;background:var(--sk-ivory);box-shadow:var(--shadow-light)}
.tier-row{display:grid;grid-template-columns:1.1fr 1fr 1fr 1fr;gap:14px;align-items:center;padding:17px 22px;border-bottom:1px solid var(--sk-line-dark)}
.tier-row:last-child{border-bottom:0}
.tier-row.header{background:#f0f2ef;color:#7b8793;font-size:9px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
.tier-row strong{color:var(--sk-navy-deep);font-family:Montserrat,sans-serif;font-size:13px}
.tier-row.current{background:#eef7f6}

/* My Trips pages */
.trip-page-toolbar{display:flex;justify-content:flex-end;gap:8px;margin:-4px 0 18px}
.trip-card{grid-template-columns:112px minmax(0,1fr) auto}
.trip-action-notice{display:flex;align-items:center;gap:8px;margin-top:11px;color:var(--sk-warn);font-size:10px;font-weight:800}
.trip-action-notice::before{content:"";width:7px;height:7px;border-radius:50%;background:#d0a146}
.trip-clear-note{margin-top:10px;color:#7d8b98;font-size:9px}
.trip-doc-task{display:grid;grid-template-columns:36px 1fr auto;gap:12px;align-items:center;padding:13px 0;border-bottom:1px solid var(--sk-line-dark)}
.trip-doc-task:last-child{border-bottom:0}
.trip-doc-task .docicon{width:34px;height:34px}
.trip-doc-task strong{display:block;color:var(--sk-navy-deep);font-size:11px}
.trip-doc-task span{display:block;margin-top:3px;color:var(--sk-muted);font-size:9px}
.trip-attention{margin:0 0 18px;padding:18px;border:1px solid #e8d5b5;border-radius:14px;background:#fff7e8;color:#644c20}
.trip-attention strong{display:block;color:#523b12;font-size:12px}
.trip-attention p{margin:5px 0 0;font-size:10px;line-height:1.55}
.provider-doc-list{display:grid;gap:8px}
.provider-doc{display:flex;justify-content:space-between;gap:16px;padding:12px 14px;border:1px solid var(--sk-line-dark);border-radius:12px;background:#fff}
.provider-doc strong{color:var(--sk-navy-deep);font-size:10px}
.provider-doc span{color:var(--sk-muted);font-size:9px}

/* Reuse existing settings surfaces inside new shell */
.account-workspace .section-head{margin-top:0}
.account-workspace .section-head h2{color:#fff}
.account-workspace .section-head p{color:rgba(255,255,255,.54)}
.account-workspace>.view>.card.pad,.account-workspace>.view>.card{box-shadow:var(--shadow-light)}
.legacy-doc-contract{display:none!important}

@media(max-width:1040px){
  .account-summary{grid-template-columns:1fr;gap:30px}
  .account-summary-grid{max-width:760px}
  .account-layout{grid-template-columns:210px minmax(0,1fr);gap:30px}
  .club-overview-grid{grid-template-columns:1fr}
  .club-points-card{min-height:280px}
}
@media(max-width:820px){
  .account-masthead{padding-top:42px}
  .account-summary-grid{grid-template-columns:1fr 1fr 1fr}
  .account-layout{display:block}
  .side-menu{position:relative;top:auto;margin-bottom:28px;padding:0;border:1px solid rgba(255,255,255,.12);border-radius:18px;background:rgba(4,21,39,.60);overflow:hidden}
  .side-menu-title{padding:15px 16px 12px}
  .side-category{padding:0 16px}
  .side-category:last-of-type{border-bottom:0}
  .side-menu-footer{padding:16px}
  .page-intro{grid-template-columns:1fr;gap:12px}
  .club-status-body{grid-template-columns:1fr;justify-items:start}
  .status-facts{grid-template-columns:1fr 1fr 1fr}
  .quick-links{grid-template-columns:1fr}
}
@media(max-width:620px){
  .wrap{width:min(var(--max),calc(100% - 28px))}
  .account-masthead{padding-top:36px}
  .account-greeting h1{font-size:38px}
  .account-summary{padding-bottom:28px}
  .account-summary-grid{grid-template-columns:1fr;border:1px solid rgba(255,255,255,.10);border-radius:14px;overflow:hidden}
  .account-summary-item{min-height:76px;padding:15px 17px;border-right:0;border-bottom:1px solid rgba(255,255,255,.08)}
  .account-summary-item:last-child{border-bottom:0}
  .account-summary-value{font-size:20px}
  .account-identity-strip{display:grid;grid-template-columns:1fr 1fr;gap:8px 20px}
  .account-stage{padding:28px 0 78px}
  .club-status-panel{padding:22px;min-height:0}
  .club-status-head{display:block}
  .club-number-badge{display:inline-block;margin-top:14px}
  .club-status-body{margin-top:26px}
  .status-ring{width:152px;height:152px}
  .status-facts{grid-template-columns:1fr;margin-top:20px}
  .status-fact{padding:12px 0;border-top:1px solid rgba(255,255,255,.08)}
  .club-points-card{min-height:250px;padding:24px}
  .club-points-card .points{font-size:46px}
  .club-activity-mini{grid-template-columns:1fr auto;gap:7px 12px}
  .club-activity-mini .date{grid-column:1/-1}
  .activity-row{grid-template-columns:1fr auto;gap:7px 12px}
  .activity-row .date{grid-column:1/-1}
  .tier-row{grid-template-columns:1.1fr .9fr .9fr}
  .tier-row>*:nth-child(3){display:none}
  .trip-card{grid-template-columns:1fr;gap:12px}
  .trip-datebox{padding:0 0 11px;border-right:0;border-bottom:1px solid var(--sk-line-dark)}
  .trip-page-toolbar{justify-content:flex-start}
}

</style>
</head>
<body>
<div class="shell">
<section class="hero account-masthead">
  <div class="wrap">
    <div class="account-summary">
      <div class="account-greeting">
        <div class="eyebrow">SKANDI Club · My Profile</div>
        <h1 id="greetingLine">Good morning, <span id="heroName">Member</span></h1>
        <p>Your private SKANDI account for Club status, upcoming journeys and the travel details connected to your bookings.</p>
      </div>
      <div class="account-summary-grid" aria-label="Club account summary">
        <div class="account-summary-item"><span class="account-summary-label">SKANDI Points available</span><strong class="account-summary-value" id="heroPoints">0</strong><span class="account-summary-sub">Available balance</span></div>
        <div class="account-summary-item"><span class="account-summary-label">Club Status</span><strong class="account-summary-value" id="heroTier">Member</strong><span class="account-summary-sub" id="heroStatusNote">Current level</span></div>
        <div class="account-summary-item"><span class="account-summary-label">Club Member since</span><strong class="account-summary-value" id="heroMemberSince">—</strong><span class="account-summary-sub">Enrollment date</span></div>
      </div>
    </div>
    <div class="account-identity-strip"><span>SKANDI Club <strong id="heroNumber">Account</strong></span><span><strong id="heroTrips">0</strong> upcoming trips</span></div>
  </div>
</section>
<section class="account-stage">
  <div class="wrap account-layout">
    <aside class="side-menu" id="sideMenu" aria-label="My Profile navigation">
      <div class="side-menu-title">My Profile</div>
      <div class="side-category open active" data-category="club">
        <button class="side-category-head" type="button" data-category-toggle="club" aria-expanded="true">My Club</button>
        <div class="side-options">
          <button class="side-link active" type="button" data-section="club" data-view="overview">Overview</button>
          <button class="side-link" type="button" data-section="club" data-view="activity">Points Activity</button>
          <button class="side-link" type="button" data-section="club" data-view="program">Program Information</button>
        </div>
      </div>
      <div class="side-category" data-category="trips">
        <button class="side-category-head" type="button" data-category-toggle="trips" aria-expanded="false">My Trips</button>
        <div class="side-options">
          <button class="side-link" type="button" data-section="trips" data-view="upcoming">My Upcoming Trips</button>
          <button class="side-link" type="button" data-section="trips" data-view="past">Past Trips</button>
          <button class="side-link" type="button" data-section="trips" data-view="drafts">Booking Drafts</button>
        </div>
      </div>
      <div class="side-category" data-category="profile">
        <button class="side-category-head" type="button" data-category-toggle="profile" aria-expanded="false">My Profile</button>
        <div class="side-options">
          <button class="side-link" type="button" data-section="profile" data-view="details">Personal Information</button>
          <button class="side-link" type="button" data-section="profile" data-view="travelers">Saved Travelers</button>
          <button class="side-link" type="button" data-section="profile" data-view="wallet">Wallet & Payments</button>
          <button class="side-link" type="button" data-section="profile" data-view="saved">Saved</button>
        </div>
      </div>
      <div class="side-category" data-category="account">
        <button class="side-category-head" type="button" data-category-toggle="account" aria-expanded="false">Account</button>
        <div class="side-options">
          <button class="side-link" type="button" data-section="account" data-view="notifications">Notifications</button>
          <button class="side-link" type="button" data-section="account" data-view="settings">Preferences</button>
        </div>
      </div>
      <div class="side-menu-footer">Need help with a booking or account?<br><button type="button" data-route="/my-profile/support">Contact SKANDI Support</button></div>
    </aside>
    <main class="account-workspace" id="accountWorkspace">
      <section class="view active" data-page="club-overview"><div id="clubView"></div></section>
      <section class="view" data-page="club-activity"><div id="clubActivityView"></div></section>
      <section class="view" data-page="club-program"><div id="clubProgramView"></div></section>

      <section class="view" data-page="trips-upcoming">
        <div class="page-intro"><div><div class="kicker">Booking management</div><h2>My Upcoming Trips</h2></div><div><p>Each upcoming booking is its own travel workspace. Required information and documents appear with the booking that needs them, while live supplier actions are checked when you open the trip.</p></div></div>
        <div class="trip-page-toolbar"><button class="btn small primary" id="linkBookingBtn">Link a booking</button></div>
        <div id="tripList" class="trip-list"></div>
      </section>
      <section class="view" data-page="trips-past"><div class="page-intro"><div><div class="kicker">Travel history</div><h2>Past Trips</h2></div><p>Completed, cancelled and previous bookings linked to your SKANDI account.</p></div><div id="tripHistoryList" class="trip-list"></div></section>
      <section class="view" data-page="trips-drafts"><div class="page-intro"><div><div class="kicker">Continue booking</div><h2>Booking Drafts</h2></div><p>Booking carts that have not yet been completed.</p></div><div id="tripDraftList" class="trip-list"></div></section>

      <section class="view" data-page="profile-details"><div class="page-intro"><div><div class="kicker">Personal information</div><h2>My Details</h2></div><p>Contact and traveler information used by SKANDI. Sign-in identity remains controlled by your Wix member account.</p></div><div class="card pad"><div id="profileSummary"></div></div></section>
      <section class="view" data-page="profile-travelers"><div class="section-head"><div><div class="kicker">Traveler profiles</div><h2>Saved Travelers</h2></div><div><button class="btn primary" id="addTraveler">Add traveler</button></div></div><div id="travelerGrid" class="grid grid3"></div></section>
      <section class="view" data-page="profile-wallet"><div class="section-head"><div><div class="kicker">Wallet</div><h2>Wallet & Payments</h2></div><p>Only masked payment metadata is displayed. Full card details are never returned to My Profile.</p></div><h3 class="subhead">Payment methods</h3><div id="paymentGrid" class="grid grid3"></div><h3 class="subhead">Wallet items</h3><div id="walletGrid" class="grid grid3"></div></section>
      <section class="view" data-page="profile-saved"><div class="section-head"><div><div class="kicker">Saved for later</div><h2>Saved</h2></div><p>Hotels, destinations and other items you saved while exploring SKANDI.</p></div><div id="favorites" class="grid grid2"></div></section>

      <section class="view" data-page="account-notifications"><div class="section-head"><div><div class="kicker">Account updates</div><h2>Notifications</h2></div></div><div class="card" id="notifications"></div></section>
      <section class="view" data-page="account-settings"><div class="section-head"><div><div class="kicker">Account preferences</div><h2>Preferences</h2></div><p>Travel preferences SKANDI may use to streamline future booking and service flows.</p></div><div class="card pad"><form id="profileForm" class="profile-form"><div class="field"><label>First name</label><input class="control" name="firstName" autocomplete="given-name"></div><div class="field"><label>Last name</label><input class="control" name="lastName" autocomplete="family-name"></div><div class="field"><label>Contact email</label><input class="control" name="email" type="email" autocomplete="email"></div><div class="field"><label>Phone</label><input class="control" name="phone" autocomplete="tel"></div><div class="field"><label>Country of residence</label><select class="control" name="countryOfResidenceId"></select></div><div class="field"><label>Preferred language</label><select class="control" name="preferredLanguageId"></select></div><div class="field"><label>Preferred currency</label><select class="control" name="preferredCurrency"><option value="">Select</option><option>USD</option><option>SEK</option><option>NOK</option><option>DKK</option><option>EUR</option></select></div><div class="field"><label>Home / departure airport</label><select class="control" name="preferredDepartureAirportId"></select></div><div class="field"><label>Seat preference</label><select class="control" name="seatPreference"><option value="">No preference</option><option value="window">Window</option><option value="aisle">Aisle</option></select></div><div class="field"><label>Dietary preferences</label><input class="control" name="dietaryPrefs"></div><div class="field full"><label>General accessibility needs</label><textarea class="control" name="accessibilityNeeds"></textarea></div><div class="field full"><label class="checkbox"><input type="checkbox" name="marketingConsent"><span>I want to receive SKANDI travel inspiration, Club updates and relevant offers. Transactional travel messages are managed separately.</span></label></div><div class="field full"><div class="button-row"><button class="btn primary" type="submit">Save preferences</button><button class="btn soft" type="button" data-route="/my-profile/support">Contact support</button><button class="btn danger" type="button" id="logoutBtn">Log out</button></div></div></form><div id="providerSyncNote" class="provider-note hidden"></div></div></section>
    </main>
  </div>
</section>
<div class="legacy-doc-contract hidden" aria-hidden="true"><button id="refreshBtn"></button><button id="closeBtn"></button><div id="mReady">0</div><div id="mAction">0</div><div id="mIssued">0</div><div id="mChanges">0</div><div id="documents"></div></div>
</div>
<div class="drawer-shade" id="drawerShade"></div><aside class="drawer" id="bookingDrawer" aria-label="Booking details"><div class="drawer-head"><strong>Trip details</strong><button class="iconbtn" id="closeDrawer" aria-label="Close">×</button></div><div class="drawer-body" id="bookingDetail"></div></aside>
<div class="modal-shade" id="modalShade"><div class="modal"><div class="modal-head"><h3 id="modalTitle">Manage trip</h3><button class="iconbtn" id="closeModal">×</button></div><div class="modal-body" id="modalBody"></div><div class="modal-foot" id="modalFoot"></div></div></div>
<div class="toast" id="toast"></div><div class="loading" id="loading"><div class="spinner"></div></div>
<script>
(() => {
"use strict";
// B-011.31 hierarchical account shell + Club overview + trip action center. Data ownership and provider contracts remain canonical.
const SOURCE="SKANDI_MY_PROFILE",DOC_SOURCE="SKANDI_CUSTOMER_DOCUMENT_CENTER",PARENT="SKANDI_WIX_PARENT",$=id=>document.getElementById(id);
const state={data:null,section:"club",view:"overview",ledgerFilter:"all",bookingDetail:null,pending:new Map(),stripe:null,elements:null,payment:null,legacyDocuments:null};
const icon=(name)=>{const paths={calendar:'<path d="M7 2v3M17 2v3M3.5 9h17M5 4.5h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2Z"/>',user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',doc:'<path d="M6 2h8l4 4v16H6z"/><path d="M14 2v5h5M9 12h6M9 16h6"/>',bell:'<path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/>',bag:'<path d="M6 7h12l1 14H5L6 7Z"/><path d="M9 7V5a3 3 0 0 1 6 0v2"/>',plane:'<path d="M22 2 9.5 14.5 3 12l-2 2 7 3 3 7 2-2-2.5-6.5L23 3z"/>',check:'<path d="m5 12 4 4L19 6"/>',wallet:'<path d="M3 6h17v14H3zM3 9h17M15 13h3v3h-3z"/>'};return `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.check}</svg>`};
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
const arr=v=>Array.isArray(v)?v:[]; const money=(a,c)=>a===null||a===undefined||a===""?"":new Intl.NumberFormat(undefined,{style:"currency",currency:c||"USD"}).format(Number(a)||0); const date=v=>{if(!v)return"";try{return new Intl.DateTimeFormat(undefined,{month:"short",day:"numeric",year:"numeric"}).format(new Date(String(v).length===10?`${v}T12:00:00`:v))}catch{return String(v)}}; const num=v=>new Intl.NumberFormat().format(Number(v)||0);
function post(type,payload={},source=SOURCE){window.parent.postMessage({source,type,payload,timestamp:new Date().toISOString()},"*")}
function reqId(){return `mpr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,9)}`}
function request(type,payload={}){const id=reqId();return new Promise((resolve,reject)=>{const t=setTimeout(()=>{state.pending.delete(id);reject(new Error("The request timed out. Please try again."))},140000);state.pending.set(id,{resolve,reject,t,type});post(type,{...payload,requestId:id})})}
function busy(on){$("loading").classList.toggle("show",!!on)}
let toastTimer;function toast(message,bad=false){clearTimeout(toastTimer);const el=$("toast");el.textContent=message;el.className=`toast show${bad?" bad":""}`;toastTimer=setTimeout(()=>el.className="toast",4200)}
function empty(title,body,ic="doc"){return `<div class="empty">${icon(ic)}<strong>${esc(title)}</strong><span>${esc(body)}</span></div>`}
function setTab(tab,push=false){
  const map={overview:["club","overview"],club:["club","overview"],trips:["trips","upcoming"],orders:["trips","drafts"],documents:["trips","upcoming"],travelers:["profile","travelers"],wallet:["profile","wallet"],saved:["profile","saved"],notifications:["account","notifications"],settings:["account","settings"]};
  const pair=map[String(tab||"")]||["club","overview"];
  setPage(pair[0],pair[1],push);
}

function pageKey(section,view){return `${section}-${view}`}
function pagePath(section,view){return `/my-profile?section=${encodeURIComponent(section)}&view=${encodeURIComponent(view)}`}
function setPage(section,view,push=false){
  if(push){busy(true);post("MY_PROFILE_NAVIGATE",{path:pagePath(section,view)});return}
  const key=pageKey(section,view), target=document.querySelector(`[data-page="${key}"]`);
  if(!target){section="club";view="overview"}
  state.section=section;state.view=view;
  document.querySelectorAll(".view").forEach(v=>v.classList.toggle("active",v.dataset.page===pageKey(section,view)));
  document.querySelectorAll(".side-link").forEach(link=>link.classList.toggle("active",link.dataset.section===section&&link.dataset.view===view));
  document.querySelectorAll(".side-category").forEach(cat=>{const active=cat.dataset.category===section;cat.classList.toggle("active",active);if(active)cat.classList.add("open");const h=cat.querySelector("[data-category-toggle]");if(h)h.setAttribute("aria-expanded",cat.classList.contains("open")?"true":"false")});
  window.scrollTo({top:Math.max(0,(document.querySelector(".account-stage")?.offsetTop||0)-6),behavior:"auto"});
}
function greetingForNow(){const h=new Date().getHours();return h<12?"Good morning":h<18?"Good afternoon":"Good evening"}
function monthYear(v){if(!v)return"—";try{return new Intl.DateTimeFormat(undefined,{month:"short",year:"numeric"}).format(new Date(v))}catch{return date(v)||"—"}}
const ACTION_DOC_STATUSES=new Set(["WAITING_FOR_DATA","WAITING_FOR_SIGNATURE","WAITING_FOR_APPROVAL","REQUIRED","PENDINGREVIEW"]);
function isActionDoc(doc){return ACTION_DOC_STATUSES.has(String(doc?.status||"").toUpperCase())}
function docsForBooking(id){const docs=state.legacyDocuments||arr(state.data?.documents);return docs.filter(d=>String(d.bookingId||"")===String(id||""))}
function actionDocsForBooking(id){return docsForBooking(id).filter(isActionDoc)}
function issuedDocsForBooking(id){return docsForBooking(id).filter(d=>["ISSUED","SENT","ACKNOWLEDGED","READY"].includes(String(d.status||"").toUpperCase()))}
function pageLink(section,view,label,ic="check"){return `<button class="quick-link" type="button" data-section="${esc(section)}" data-view="${esc(view)}"><span class="quick-icon">${icon(ic)}</span><strong>${esc(label)}</strong><span>Open this section of My Profile</span></button>`}
function currentPageFromData(){const d=state.data||{};return [d.requestedSection||state.section||"club",d.requestedView||state.view||"overview"]}

function statusClass(s){s=String(s||"").toUpperCase();if(["ISSUED","SENT","ACKNOWLEDGED","READY","CONFIRMED","POSTED"].includes(s))return"ok";if(["WAITING_FOR_DATA","WAITING_FOR_SIGNATURE","WAITING_FOR_APPROVAL","REQUIRED","PENDING","HELD"].includes(s))return"warn";if(["CANCELLED","REJECTED","FAILED"].includes(s))return"bad";return""}
function friendly(s){return String(s||"").replaceAll("_"," ").replace(/\b\w/g,c=>c.toUpperCase())}
function groupFor(doc){const s=String(doc.status||"").toUpperCase();if(["WAITING_FOR_DATA","WAITING_FOR_SIGNATURE","WAITING_FOR_APPROVAL","REQUIRED","PENDINGREVIEW"].includes(s))return"Action required";if(["ISSUED","SENT","ACKNOWLEDGED"].includes(s))return"Issued documents";if(String(doc.document_code||"").startsWith("F")||String(doc.document_code||"").startsWith("P10"))return"Travel changes";return"Upcoming / preparing"}
function nextTrip(){return arr(state.data?.trips?.upcoming)[0]||null}
function renderHero(){
  const d=state.data;if(!d)return;const p=d.profile||{},c=d.club||{},first=(p.firstName||p.displayName||"Member").split(" ")[0];
  $("heroName").textContent=first;
  $("greetingLine").firstChild.nodeValue=`${greetingForNow()}, `;
  $("heroTier").textContent=c.enrolled?(c.tier?.name||"Member"):"Not enrolled";
  $("heroStatusNote").textContent=c.enrolled?(c.nextTier?`${num(c.progress?.pointsToNext)} points to ${c.nextTier.name}`:"Highest configured level"):"SKANDI Club";
  $("heroNumber").textContent=c.enrolled&&p.clubNumber?`#${p.clubNumber}`:"Account";
  $("heroPoints").textContent=num(c.pointsBalance);
  $("heroTrips").textContent=num(arr(d.trips?.upcoming).length);
  $("heroMemberSince").textContent=c.enrolled?monthYear(c.memberSince||p.accountCreatedAt):"—";
  const progress=Math.max(0,Math.min(100,Number(c.progress?.percent||0)));document.documentElement.style.setProperty("--club-progress",`${progress}%`);
}
function renderOverview(){
  const d=state.data;if(!d)return;const p=d.profile||{},c=d.club||{},tiers=arr(c.tiers),progress=Math.max(0,Math.min(100,Number(c.progress?.percent||0))),first=(p.firstName||p.displayName||"Member").split(" ")[0];
  if(!c.enrolled){$("clubView").innerHTML=`<div class="page-intro"><div><div class="kicker">My Club · Overview</div><h2>${esc(greetingForNow())}, ${esc(first)}</h2></div><p>Your SKANDI account is active, but SKANDI Club enrollment is not currently linked to this customer profile.</p></div><div class="club-overview-grid"><div class="club-status-panel"><div class="club-status-head"><div><div class="club-status-name">SKANDI Club</div><div class="club-status-caption">Loyalty membership</div></div></div><div class="status-copy" style="margin-top:42px"><h3>Make every journey count.</h3><p>Club status, points and qualification information will appear here once enrollment is active on the canonical customer record.</p><div class="button-row" style="margin-top:22px"><button class="btn cyan" data-route="/skandi-club">Explore SKANDI Club</button><button class="btn" data-route="/my-profile/support">Enrollment help</button></div></div></div><div class="club-points-card"><span class="label">SKANDI Points available</span><div class="points">0</div><p>Points activity starts when Club enrollment and eligible transactions are posted.</p><div class="member-since"><strong>Not enrolled</strong><span>No Club enrollment date is stored for this profile.</span></div></div></div>`;return}
  const recent=arr(c.ledger).slice(0,5);
  $("clubView").innerHTML=`<div class="page-intro"><div><div class="kicker">My Club · Overview</div><h2>${esc(greetingForNow())}, ${esc(first)}</h2></div><p>A concise view of your SKANDI Club account, current status and the activity that moves you toward your next level.</p></div><div class="club-overview-grid"><section class="club-status-panel"><div class="club-status-head"><div><div class="club-status-name">${esc(c.tier?.name||"Member")}</div><div class="club-status-caption">Current Club Status</div></div><div class="club-number-badge">Club ${esc(p.clubNumber||p.memberId)}</div></div><div class="club-status-body"><div class="status-ring" style="--p:${progress}"><div class="status-ring-content"><strong>${progress.toFixed(0)}%</strong><span>${c.nextTier?`to ${esc(c.nextTier.name)}`:"top level"}</span></div></div><div class="status-copy"><h3>${c.nextTier?`${esc(c.tier?.name||"Member")} → ${esc(c.nextTier.name)}`:`${esc(c.tier?.name||"Member")} status`}</h3><p>${c.nextTier?`${num(c.progress?.pointsToNext)} more SKANDI Points are needed to reach ${esc(c.nextTier.name)} based on the current configured tier thresholds.`:"You are currently at the highest configured SKANDI Club level."}</p><div class="status-facts"><div class="status-fact"><strong>${Number(c.tier?.multiplier||1).toFixed(2).replace(/\.00$/,'')}×</strong><span>Earning multiplier</span></div><div class="status-fact"><strong>${num(c.tier?.minPoints||0)}</strong><span>Level threshold</span></div><div class="status-fact"><strong>${c.nextTier?num(c.nextTier.minPoints):"—"}</strong><span>Next threshold</span></div></div></div></div></section><aside class="club-points-card"><span class="label">SKANDI Points available</span><div class="points">${num(c.pointsBalance)}</div><p>Your available balance is calculated from the canonical SKANDI Points ledger, excluding reversed, void and cancelled entries.</p><div class="member-since"><strong>Club Member since ${esc(monthYear(c.memberSince||p.accountCreatedAt))}</strong><span>${p.clubNumber?`Membership #${esc(p.clubNumber)}`:"Membership linked to this account"}</span></div></aside></div><h3 class="quick-links-title">My Club</h3><div class="quick-links">${pageLink("club","activity","Points Activity","wallet")}${pageLink("club","program","Program Information","check")}${pageLink("profile","details","My Profile Information","user")}</div><div class="club-snapshot"><div class="club-snapshot-head"><strong>Recent Club activity</strong><button type="button" data-section="club" data-view="activity">View all activity</button></div>${recent.length?recent.map(x=>`<div class="club-activity-mini"><div class="date">${esc(date(x.date))}</div><strong>${esc(x.description||friendly(x.type)||"SKANDI Club activity")}</strong><div class="pts ${Number(x.amount)<0?"neg":""}">${Number(x.amount)>0?"+":""}${num(x.amount)}</div></div>`).join(""):`<div class="club-activity-mini"><div class="date">—</div><strong>No posted Club activity yet</strong><div class="pts">0</div></div>`}</div>`
}
function tripCard(b,past=false){
  const comps=arr(b.components),tasks=actionDocsForBooking(b.id),allDocs=docsForBooking(b.id);return `<article class="trip-card"><div class="trip-datebox"><strong>${esc(b.departureDate?new Date(`${b.departureDate}T12:00:00`).toLocaleDateString(undefined,{month:"short",day:"numeric"}):"Trip")}</strong><span>${esc(b.departureDate?new Date(`${b.departureDate}T12:00:00`).getFullYear():b.status||"")}</span></div><div><h3>${esc(b.origin||"SKANDI")} → ${esc(b.destination||b.productType||"Booking")}</h3><p>${esc(b.bookingReference?`Booking ${b.bookingReference}`:"SKANDI booking")}${b.totalAmount!==null?` · ${esc(money(b.totalAmount,b.currency))}`:""}</p><div class="chips"><span class="chip ${statusClass(b.status)}">${esc(friendly(b.status||"Booked"))}</span>${comps.slice(0,5).map(c=>`<span class="chip">${esc(friendly(c.type))}</span>`).join("")}</div>${!past&&tasks.length?`<div class="trip-action-notice">${tasks.length} travel item${tasks.length===1?"":"s"} require your action</div>`:!past&&allDocs.length?`<div class="trip-clear-note">No outstanding SKANDI information request is currently attached to this booking.</div>`:""}</div><div class="button-row"><button class="btn small primary" data-booking="${esc(b.id)}">${past?"View":"Manage trip"}</button></div></article>`
}
function renderTrips(){
  const d=state.data;if(!d)return;
  const upcoming=arr(d.trips?.upcoming),history=arr(d.trips?.history),carts=arr(d.trips?.carts);
  const up=$("tripList"),past=$("tripHistoryList"),draft=$("tripDraftList");
  if(up)up.innerHTML=upcoming.map(b=>tripCard(b,false)).join("")||empty("No upcoming trips","Bookings linked to this account will appear here.","plane");
  if(past)past.innerHTML=history.map(b=>tripCard(b,true)).join("")||empty("No past trips yet","Completed and cancelled SKANDI bookings will appear here.","plane");
  if(draft)draft.innerHTML=carts.map(c=>`<article class="trip-card"><div class="trip-datebox"><strong>${esc(friendly(c.status||"Draft"))}</strong><span>${esc(date(c.updatedAt||c.createdAt))}</span></div><div><h3>${esc(c.payload?.selectedOffer?.summary||c.payload?.productType||"Booking in progress")}</h3><p>${esc(c.cartId||"")}${c.total?` · ${esc(money(c.total,c.currency))}`:""}</p></div><div><button class="btn small primary" data-route="/booking?cartId=${encodeURIComponent(c.cartId||"")}">Continue</button></div></article>`).join("")||empty("No booking drafts","Unfinished SKANDI booking carts will appear here.","plane")
}
function renderClub(){
  const d=state.data,c=d?.club||{},tiers=arr(c.tiers),ledger=arr(c.ledger);
  const activityRoot=$("clubActivityView"),programRoot=$("clubProgramView");
  if(activityRoot){let rows=ledger;if(state.ledgerFilter==="earned")rows=rows.filter(x=>Number(x.amount)>0);else if(state.ledgerFilter==="used")rows=rows.filter(x=>Number(x.amount)<0);else if(state.ledgerFilter==="pending")rows=rows.filter(x=>String(x.status||"").toUpperCase()==="PENDING");activityRoot.innerHTML=`<div class="page-intro"><div><div class="kicker">My Club · Account Activity</div><h2>Points Activity</h2></div><p>Posted and pending entries from your canonical SKANDI Points ledger.</p></div><div class="activity-toolbar"><div class="activity-filters">${[["all","All"],["earned","Earned"],["used","Used"],["pending","Pending"]].map(([v,l])=>`<button class="activity-filter ${state.ledgerFilter===v?"active":""}" data-ledger-filter="${v}">${l}</button>`).join("")}</div><div style="color:rgba(255,255,255,.42);font-size:10px">${num(rows.length)} entries</div></div><div class="activity-list">${rows.length?rows.map(x=>`<div class="activity-row"><div class="date">${esc(date(x.date))}</div><div><strong>${esc(x.description||friendly(x.type)||"SKANDI Club activity")}</strong><small>${esc(x.bookingReference||friendly(x.status||"Posted"))}</small></div><div class="amount ${Number(x.amount)<0?"neg":""}">${Number(x.amount)>0?"+":""}${num(x.amount)} pts</div></div>`).join(""):empty("No matching activity","There are no Club ledger entries in this filter.","wallet")}</div>`}
  if(programRoot){programRoot.innerHTML=`<div class="page-intro"><div><div class="kicker">My Club · Program Information</div><h2>Club Levels</h2></div><p>The level names, point thresholds and earning multipliers below come directly from the active SKANDI Club configuration. Benefits are not invented here when they have not been configured.</p></div><div class="tier-table"><div class="tier-row header"><span>Club level</span><span>From</span><span>Through</span><span>Multiplier</span></div>${tiers.map(t=>`<div class="tier-row ${t.id===c.tier?.id?"current":""}"><strong>${esc(t.name)}</strong><span>${num(t.minPoints)} pts</span><span>${t.maxPoints===null||t.maxPoints===undefined?"No upper limit":`${num(t.maxPoints)} pts`}</span><span>${Number(t.multiplier||1).toFixed(2).replace(/\.00$/,'')}×</span></div>`).join("")}</div><div class="provider-note" style="margin-top:18px">SKANDI Club status is determined by the active Club configuration and your posted SKANDI Points balance. Program-specific benefits should only appear here once they are defined in the Club configuration.</div>`}
}
function initials(t){return [t.firstName,t.lastName].filter(Boolean).map(x=>x[0]).join("").slice(0,2).toUpperCase()||"TR"}
function renderTravelers(){const list=arr(state.data?.travelers);$("travelerGrid").innerHTML=list.length?list.map(t=>`<article class="card traveler-card"><div class="traveler-head"><div class="avatar">${esc(initials(t))}</div><div><div class="traveler-name">${esc(t.displayName||[t.firstName,t.lastName].join(" "))}</div><div class="traveler-meta">${t.isPrimary?"Primary traveler":esc(t.travelerType||"Companion")}</div></div></div><div class="traveler-info"><div class="info-pair"><span>Date of birth</span><strong>${esc(t.dateOfBirth?date(t.dateOfBirth):"Not saved")}</strong></div><div class="info-pair"><span>Passport</span><strong>${esc(t.passportLast4?`•••• ${t.passportLast4}`:"Not saved")}</strong></div><div class="info-pair"><span>Email</span><strong>${esc(t.email||"—")}</strong></div><div class="info-pair"><span>Accessibility</span><strong>${esc(t.accessibilityNeeds||"None saved")}</strong></div></div><div class="traveler-actions"><button class="btn small" data-edit-traveler="${esc(t.id)}">Edit</button>${!t.isPrimary?`<button class="btn small danger" data-remove-traveler="${esc(t.id)}">Remove</button>`:""}</div></article>`).join(""):empty("No saved travelers","Add frequent travel companions so their details are ready for future bookings.","user")}
function renderDocuments(){
  const docs=state.legacyDocuments||arr(state.data?.documents),groups={"Action required":[],"Upcoming / preparing":[],"Issued documents":[],"Travel changes":[]};docs.forEach(d=>(groups[groupFor(d)]||groups["Upcoming / preparing"]).push(d));
  if($("mAction"))$("mAction").textContent=groups["Action required"].length;if($("mReady"))$("mReady").textContent=groups["Upcoming / preparing"].length;if($("mIssued"))$("mIssued").textContent=groups["Issued documents"].length;if($("mChanges"))$("mChanges").textContent=groups["Travel changes"].length;if($("documents"))$("documents").innerHTML="";
}
function renderWallet(){const pays=arr(state.data?.paymentMethods),wallet=arr(state.data?.wallet);$("paymentGrid").innerHTML=pays.length?pays.map(p=>`<div class="card wallet-card"><div class="card-chip"></div><div class="wallet-number">•••• •••• •••• ${esc(p.last4||"••••")}</div><div class="wallet-meta"><span>${esc(p.brand||"Card")}</span><span>${p.expiryMonth&&p.expiryYear?`${String(p.expiryMonth).padStart(2,"0")}/${String(p.expiryYear).slice(-2)}`:""}</span></div></div>`).join(""):empty("No saved payment methods","Payment methods saved by secure checkout will appear here only as masked metadata.","wallet");$("walletGrid").innerHTML=wallet.length?wallet.map(w=>`<div class="card pad"><h3>${esc(w.title)}</h3><p>${esc(friendly(w.type))}${w.expiresAt?` · expires ${esc(date(w.expiresAt))}`:""}</p>${w.code?`<div class="chips"><span class="chip blue">${esc(w.code)}</span></div>`:""}</div>`).join(""):empty("Your wallet is empty","Eligible vouchers, passes and travel wallet items will appear here.","wallet")}
function renderSaved(){const items=arr(state.data?.favorites);$("favorites").innerHTML=items.length?items.map(x=>`<article class="card saved-card">${x.image?`<img class="saved-img" src="${esc(x.image)}" alt="">`:`<div class="saved-img"></div>`}<div><h3 style="margin:0 0 5px">${esc(x.title)}</h3><p>${esc(friendly(x.type))}</p></div><div class="button-row">${x.url?`<button class="btn small primary" data-route="${esc(x.url)}">View</button>`:""}<button class="btn small" data-remove-favorite="${esc(x.id)}">Remove</button></div></article>`).join(""):empty("Nothing saved yet","Save hotels, destinations and travel ideas while browsing SKANDI and they will appear here.","heart")}
function renderNotifications(){const items=arr(state.data?.notifications);$("notifications").innerHTML=items.length?items.map(n=>`<div class="notif ${n.read?"":"unread"}"><div class="notif-dot"></div><div><strong>${esc(n.title)}</strong><p>${esc(n.message)}</p><div style="font-size:10px;color:#98a3ad;margin-top:7px">${esc(date(n.createdAt))}</div></div><div class="button-row">${n.actionPath?`<button class="btn small" data-route="${esc(n.actionPath)}">Open</button>`:""}${!n.read?`<button class="btn small soft" data-read-notification="${esc(n.id)}">Mark read</button>`:""}</div></div>`).join(""):empty("You're all caught up","Booking, Club and account updates will appear here.","bell")}
function fillSelect(el,rows,value,labelFn){el.innerHTML=`<option value="">Select</option>`+rows.map(x=>`<option value="${esc(x.id)}" ${x.id===value?"selected":""}>${esc(labelFn(x))}</option>`).join("")}
function renderProfileSummary(){const p=state.data?.profile||{},root=$("profileSummary");if(!root)return;root.innerHTML=`<div class="grid grid2"><div><div class="info-pair"><span>Name</span><strong>${esc(p.displayName||[p.firstName,p.lastName].filter(Boolean).join(" ")||"Not saved")}</strong></div><div class="info-pair"><span>Email</span><strong>${esc(p.email||"Not saved")}</strong></div><div class="info-pair"><span>Phone</span><strong>${esc(p.phone||"Not saved")}</strong></div></div><div><div class="info-pair"><span>Preferred currency</span><strong>${esc(p.preferredCurrency||"Not selected")}</strong></div><div class="info-pair"><span>Passport</span><strong>${esc(p.passportLast4?`•••• ${p.passportLast4}`:"Not saved")}</strong></div><div class="info-pair"><span>Account status</span><strong>${esc(p.status||"Active")}</strong></div></div></div><div class="button-row" style="margin-top:22px"><button class="btn primary" data-section="account" data-view="settings">Edit preferences</button><button class="btn soft" data-section="profile" data-view="travelers">Saved travelers</button></div>`}
function renderSettings(){const d=state.data,p=d?.profile||{},f=$("profileForm");f.firstName.value=p.firstName||"";f.lastName.value=p.lastName||"";f.email.value=p.email||"";f.phone.value=p.phone||"";f.preferredCurrency.value=p.preferredCurrency||"";f.seatPreference.value=p.payload?.seatPreference||"";f.dietaryPrefs.value=p.dietaryPrefs||"";f.accessibilityNeeds.value=p.accessibilityNeeds||"";f.marketingConsent.checked=p.marketingConsent===true;fillSelect(f.countryOfResidenceId,arr(d.references?.countries),p.countryOfResidenceId,x=>`${x.name}${x.code?` · ${x.code}`:""}`);fillSelect(f.preferredLanguageId,arr(d.references?.languages),p.preferredLanguageId,x=>`${x.name}${x.code?` · ${x.code}`:""}`);fillSelect(f.preferredDepartureAirportId,arr(d.references?.airports),p.preferredDepartureAirportId,x=>`${x.iata} · ${x.city||x.name}`)}
function renderAll(){if(!state.data)return;renderHero();renderOverview();renderTrips();renderClub();renderTravelers();renderDocuments();renderWallet();renderSaved();renderNotifications();renderProfileSummary();renderSettings();const [section,view]=currentPageFromData();setPage(section,view,false)}
function openDrawer(){$("drawerShade").classList.add("open");$("bookingDrawer").classList.add("open");document.body.style.overflow="hidden"}function closeDrawer(){$("drawerShade").classList.remove("open");$("bookingDrawer").classList.remove("open");document.body.style.overflow=""}
async function loadBooking(id){busy(true);openDrawer();$("bookingDetail").innerHTML=empty("Loading trip","Checking the latest booking and supplier capabilities.","plane");try{const res=await request("MY_PROFILE_BOOKING_DETAIL",{bookingId:id});state.bookingDetail=res.result||res;renderBookingDetail()}catch(e){$("bookingDetail").innerHTML=empty("Trip unavailable",e.message,"plane")}finally{busy(false)}}
function renderBookingDetail(){
  const d=state.bookingDetail;if(!d)return;const b=d.booking||{},p=d.provider||{},cap=d.capabilities||{},air=p.air,stay=p.stay,car=p.car,localDocs=docsForBooking(b.id),tasks=localDocs.filter(isActionDoc),issued=issuedDocsForBooking(b.id),providerDocs=arr(air?.documents);
  const taskHtml=tasks.length?`<div class="trip-attention"><strong>${tasks.length} item${tasks.length===1?"":"s"} require your action before travel</strong><p>These requests belong to this booking and are kept with the trip rather than in a separate document center.</p></div><div class="card pad" style="margin-bottom:18px"><h3 style="margin-bottom:8px">Requested travel information</h3>${tasks.map(doc=>`<div class="trip-doc-task"><div class="docicon">${esc(String(doc.document_code||"DOC").slice(0,3))}</div><div><strong>${esc(doc.definition_name||doc.document_code||"Travel information")}</strong><span>${esc(friendly(doc.status||"Required"))}${doc.document_number?` · ${esc(doc.document_number)}`:""}</span></div><div class="button-row"><button class="btn small" data-open-doc="${esc(doc.id)}">Open</button><button class="btn small primary" data-complete-doc="${esc(doc.id)}">Complete</button></div></div>`).join("")}</div>`:"";
  const docsHtml=(issued.length||providerDocs.length)?`<h3 class="subhead">Trip documents</h3><div class="provider-doc-list">${issued.map(doc=>`<div class="provider-doc"><div><strong>${esc(doc.definition_name||doc.document_code||"SKANDI document")}</strong><span>${esc(doc.document_number||friendly(doc.status))}</span></div><button class="btn small" data-open-doc="${esc(doc.id)}">Open</button></div>`).join("")}${providerDocs.map(doc=>`<div class="provider-doc"><div><strong>${esc(friendly(doc.type||"Airline document"))}</strong><span>${esc(doc.uniqueIdentifier||doc.id||"Issued by airline")}</span></div><span>Airline issued</span></div>`).join("")}</div>`:"";
  $("bookingDetail").innerHTML=`<div class="booking-hero"><div class="kicker" style="color:var(--sk-aqua)">Booking ${esc(b.bookingReference||b.id)}</div><div class="route">${esc(b.origin||air?.slices?.[0]?.origin?.iataCode||"SKANDI")} → ${esc(b.destination||air?.slices?.[Math.max(0,arr(air?.slices).length-1)]?.destination?.iataCode||"Trip")}</div><p>${esc(date(b.departureDate))}${b.returnDate?` · ${esc(date(b.returnDate))}`:""} · ${esc(friendly(b.status||air?.status||"Booked"))}</p></div>${taskHtml}${arr(d.airlineChanges).length?`<div class="provider-note"><strong>Airline schedule update</strong><br>${arr(d.airlineChanges).length} airline-initiated change${arr(d.airlineChanges).length===1?"":"s"} need review. Available actions are determined by the airline payload.</div>`:""}<h3 class="subhead">Manage this trip</h3><div class="cap-grid">${air?`<div class="cap"><strong>Flight changes</strong><span>${cap.flightChange?"This order can be re-shopped through the airline API.":"The airline does not currently expose self-service changes for this order."}</span>${cap.flightChange?`<div style="margin-top:10px"><button class="btn small primary" data-manage="flight-change">Change flight</button></div>`:""}</div><div class="cap"><strong>Cancellation</strong><span>${cap.flightCancel?"A live cancellation quote can be requested before anything is cancelled.":"API cancellation is not available for this order."}</span>${cap.flightCancel?`<div style="margin-top:10px"><button class="btn small" data-manage="flight-cancel">Get cancellation quote</button></div>`:""}</div><div class="cap"><strong>Additional baggage</strong><span>${cap.postBookingBaggage?`${arr(d.baggage).length} baggage option${arr(d.baggage).length===1?"":"s"} currently available for the passenger/segment combinations returned by the airline.`:"No post-booking baggage offer is currently available from the airline."}</span>${cap.postBookingBaggage?`<div style="margin-top:10px"><button class="btn small" data-manage="baggage">Add baggage</button></div>`:""}</div><div class="cap"><strong>Seats</strong><span>SKANDI does not advertise post-booking seat reassignment here because the current Duffel post-booking service flow supports baggage, not seat reassignment.</span></div>`:""}${stay?`<div class="cap"><strong>Hotel booking</strong><span>${esc(stay.accommodation?.name||"Accommodation")} · ${esc(friendly(stay.status))}${stay.checkInDate?` · ${esc(date(stay.checkInDate))}`:""}</span>${cap.stayCancel?`<div style="margin-top:10px"><button class="btn small danger" data-manage="stay-cancel">Cancel stay</button></div>`:""}</div>`:""}${car?`<div class="cap"><strong>Car rental</strong><span>${esc(car.car?.name||"Rental car")} · ${esc(friendly(car.status))}</span>${cap.carCancel?`<div style="margin-top:10px"><button class="btn small danger" data-manage="car-cancel">Cancel rental</button></div>`:""}</div>`:""}</div>${docsHtml}<h3 class="subhead">Trip components</h3>${arr(b.components).length?arr(b.components).map(c=>`<div class="component"><strong>${esc(c.title||friendly(c.type))}</strong><span>${esc(friendly(c.type))} · ${esc(friendly(c.status||"Booked"))}${c.totalAmount!==null?` · ${esc(money(c.totalAmount,c.currency))}`:""}</span></div>`).join(""):"<div class='provider-note'>Detailed trip components are not published for this booking yet.</div>"}${arr(d.airlineChanges).length?`<h3 class="subhead">Airline-initiated changes</h3>${arr(d.airlineChanges).map(c=>`<div class="component"><strong>Schedule change · ${esc(date(c.updatedAt||c.createdAt))}</strong><span>Available actions: ${esc(arr(c.availableActions).join(", ")||"review")}</span>${arr(c.availableActions).includes("accept")?`<div style="margin-top:8px"><button class="btn small primary" data-accept-airline-change="${esc(c.id)}">Accept change</button></div>`:""}</div>`).join("")}`:""}<div class="provider-note">Self-service controls are shown only when the live supplier payload exposes that action. SKANDI keeps booking-specific information requests with the trip that needs them.</div>`
}
function openModal(title,body,foot=""){$("modalTitle").textContent=title;$("modalBody").innerHTML=body;$("modalFoot").innerHTML=foot;$("modalShade").classList.add("open")}function closeModal(){$("modalShade").classList.remove("open");state.payment=null;state.elements=null}
function linkBookingModal(){openModal("Link a booking",`<div class="provider-note">Use the booking reference and traveler surname exactly as shown on the confirmation. This verifies ownership before the booking is added to My Trips.</div><form id="linkBookingForm" class="profile-form" style="margin-top:16px"><div class="field"><label>Booking reference</label><input class="control" name="bookingReference" required maxlength="120" autocomplete="off" placeholder="Booking reference"></div><div class="field"><label>Traveler surname</label><input class="control" name="lastName" required maxlength="160" autocomplete="family-name" placeholder="Surname"></div></form>`,`<button class="btn soft" data-close-modal>Cancel</button><button class="btn primary" id="confirmLinkBooking">Link booking</button>`)}
function travelerModal(t={}){const refs=state.data?.references||{};openModal(t.id?"Edit traveler":"Add traveler",`<form id="travelerForm" class="profile-form"><input type="hidden" name="id" value="${esc(t.id||"")}"><div class="field"><label>First name</label><input class="control" name="firstName" required value="${esc(t.firstName||"")}"></div><div class="field"><label>Last name</label><input class="control" name="lastName" required value="${esc(t.lastName||"")}"></div><div class="field"><label>Date of birth</label><input class="control" type="date" name="dateOfBirth" value="${esc(t.dateOfBirth||"")}"></div><div class="field"><label>Gender</label><select class="control" name="gender"><option value="">Select</option><option value="female" ${lowerEq(t.gender,"female")}>Female</option><option value="male" ${lowerEq(t.gender,"male")}>Male</option><option value="unspecified" ${lowerEq(t.gender,"unspecified")}>Unspecified</option></select></div><div class="field"><label>Nationality</label><select class="control" name="nationalityId"><option value="">Select</option>${arr(refs.countries).map(x=>`<option value="${esc(x.id)}" ${x.id===t.nationalityId?"selected":""}>${esc(x.name)}</option>`).join("")}</select></div><div class="field"><label>Contact email</label><input class="control" type="email" name="email" value="${esc(t.email||"")}"></div><div class="field"><label>Phone</label><input class="control" name="phone" value="${esc(t.phone||"")}"></div><div class="field"><label>Passport expiry</label><input class="control" type="date" name="passportExpiry" value="${esc(t.passportExpiry||"")}"></div><div class="field full"><label>Dietary preferences</label><input class="control" name="dietaryPrefs" value="${esc(t.dietaryPrefs||"")}"></div><div class="field full"><label>Accessibility needs</label><textarea class="control" name="accessibilityNeeds">${esc(t.accessibilityNeeds||"")}</textarea></div><div class="field full"><label class="checkbox"><input type="checkbox" name="isPrimary" ${t.isPrimary?"checked":""}><span>Use as primary traveler profile.</span></label></div></form>`,`<button class="btn soft" data-close-modal>Cancel</button><button class="btn primary" id="saveTravelerModal">Save traveler</button>`)}function lowerEq(a,b){return String(a||"").toLowerCase()===b?"selected":""}
async function manage(kind){const d=state.bookingDetail,b=d?.booking;if(!b)return;if(kind==="flight-cancel"){busy(true);try{const r=await request("MY_PROFILE_FLIGHT_CANCEL_QUOTE",{bookingId:b.id});const q=r.result||r,canDirect=Number(q.cancellation?.refundAmount||0)<=0;openModal("Cancellation quote",`<div class="card pad"><h3>Airline cancellation quote</h3><p>Refund quoted by airline</p><div style="font-family:Montserrat;font-size:32px;font-weight:700;color:var(--navy);margin-top:10px">${esc(money(q.cancellation?.refundAmount,q.cancellation?.refundCurrency))}</div><p style="margin-top:12px">Quote expires ${esc(date(q.cancellation?.expiresAt))}. Nothing has been cancelled yet.</p></div>${!canDirect?`<div class="provider-note">This cancellation includes a customer refund. SKANDI will not cancel the supplier order here until the customer-refund workflow is completed. Continue through Support so the refund and cancellation remain one controlled transaction.</div>`:""}`,canDirect?`<button class="btn soft" data-close-modal>Keep booking</button><button class="btn danger" data-confirm-cancel="${esc(q.cancellation?.id||"")}">Confirm cancellation</button>`:`<button class="btn soft" data-close-modal>Keep booking</button><button class="btn primary" data-route="/my-profile/support">Continue with Support</button>`)}catch(e){toast(e.message,true)}finally{busy(false)}}else if(kind==="flight-change")flightChangeModal();else if(kind==="baggage")baggageModal();else if(kind==="stay-cancel")confirmSimple("Cancel hotel booking","This sends a live cancellation request to the accommodation supplier. Cancellation terms from your booking still apply.","MY_PROFILE_STAY_CANCEL");else if(kind==="car-cancel")confirmSimple("Cancel car rental","This sends a live cancellation request to the rental supplier. Supplier conditions still apply.","MY_PROFILE_CAR_CANCEL")}
function flightChangeModal(){const air=state.bookingDetail?.provider?.air,slices=arr(air?.slices);openModal("Change flight",`<form id="changeSearchForm" class="profile-form"><div class="field full"><label>Flight to change</label><select class="control" name="removeSliceId">${slices.map(s=>`<option value="${esc(s.id)}">${esc(s.origin?.iataCode||"")} → ${esc(s.destination?.iataCode||"")}</option>`).join("")}</select></div><div class="field"><label>Origin</label><input class="control" name="origin" maxlength="3" value="${esc(slices[0]?.origin?.iataCode||"")}"></div><div class="field"><label>Destination</label><input class="control" name="destination" maxlength="3" value="${esc(slices[0]?.destination?.iataCode||"")}"></div><div class="field"><label>New departure date</label><input class="control" type="date" name="departureDate" min="${new Date().toISOString().slice(0,10)}"></div><div class="field"><label>Cabin</label><select class="control" name="cabinClass"><option value="economy">Economy</option><option value="premium_economy">Premium Economy</option><option value="business">Business</option><option value="first">First</option></select></div></form><div id="changeOffers"></div>`,`<button class="btn soft" data-close-modal>Close</button><button class="btn primary" id="searchChangesBtn">Search changes</button>`)}
async function searchChanges(){const f=$("changeSearchForm"),b=state.bookingDetail.booking;busy(true);try{const r=await request("MY_PROFILE_FLIGHT_CHANGE_SEARCH",{bookingId:b.id,removeSliceId:f.removeSliceId.value,addSlice:{origin:f.origin.value.toUpperCase(),destination:f.destination.value.toUpperCase(),departureDate:f.departureDate.value,cabinClass:f.cabinClass.value}}),data=r.result||r,offers=arr(data.offers);$("changeOffers").innerHTML=offers.length?`<h3 class="subhead">Available alternatives</h3>${offers.map(o=>`<div class="choice"><div><strong>${esc(arr(o.slices?.add)[0]?.origin?.iataCode||"")} → ${esc(arr(o.slices?.add)[0]?.destination?.iataCode||"")}</strong><span>Change total ${esc(money(o.changeTotalAmount,o.changeTotalCurrency))}${o.penaltyTotalAmount?` · penalty ${esc(money(o.penaltyTotalAmount,o.penaltyTotalCurrency))}`:""}</span></div><div class="price">${esc(money(o.changeTotalAmount,o.changeTotalCurrency))}</div><button class="btn small primary" data-select-change="${esc(o.id)}" data-change-amount="${esc(o.changeTotalAmount||"0")}">Select</button></div>`).join("")}`:empty("No alternatives returned","The airline did not return a change offer for these details.","plane")}catch(e){toast(e.message,true)}finally{busy(false)}}
async function selectChange(offerId,amount){if(Number(amount)<0){openModal("Refund change requires support",`<div class="provider-note">This flight change would create a customer refund. The current SKANDI supplier flow can confirm the airline change, but customer refund settlement must remain part of the same controlled transaction. Continue through Support instead of confirming it here.</div>`,`<button class="btn soft" data-close-modal>Close</button><button class="btn primary" data-route="/my-profile/support">Continue with Support</button>`);return}busy(true);try{const b=state.bookingDetail.booking,r=await request("MY_PROFILE_FLIGHT_CHANGE_SELECT",{bookingId:b.id,orderChangeOfferId:offerId}),data=r.result||r,change=data.change;if(!change?.id)throw new Error("The airline did not return a pending change.");const prep=await request("MY_PROFILE_FLIGHT_CHANGE_PREPARE_PAYMENT",{bookingId:b.id,orderChangeId:change.id}),pd=prep.result||prep;if(pd.paymentRequired)await openPayment({kind:"change",bookingId:b.id,orderChangeId:change.id,prepared:pd});else{const done=await request("MY_PROFILE_FLIGHT_CHANGE_CONFIRM",{bookingId:b.id,orderChangeId:change.id});toast("Flight change confirmed.");closeModal();await refreshBooking()}}catch(e){toast(e.message,true)}finally{busy(false)}}
async function baggageModal(){const b=state.bookingDetail.booking;busy(true);try{const r=await request("MY_PROFILE_BAGGAGE_LIST",{bookingId:b.id}),data=r.result||r,services=arr(data.services);openModal("Add baggage",services.length?`<div id="bagChoices">${services.map(s=>`<label class="choice"><input type="checkbox" value="${esc(s.id)}" data-max="${Number(s.maximumQuantity||1)}"><div><strong>${esc(s.label||"Additional baggage")}</strong><span>${arr(s.passengerIds).length?`Passenger-specific · `:""}${arr(s.segmentIds).length?"Flight-specific":""}</span></div><div class="price">${esc(money(s.totalAmount,s.totalCurrency))}</div></label>`).join("")}</div>`:empty("No baggage offers","The airline is not currently offering post-booking baggage for this order.","bag"),services.length?`<button class="btn soft" data-close-modal>Close</button><button class="btn primary" id="prepareBagsBtn">Continue to payment</button>`:`<button class="btn soft" data-close-modal>Close</button>`)}catch(e){toast(e.message,true)}finally{busy(false)}}
async function prepareBags(){const services=[...document.querySelectorAll("#bagChoices input:checked")].map(x=>({id:x.value,quantity:1}));if(!services.length){toast("Choose at least one baggage option.",true);return}busy(true);try{const b=state.bookingDetail.booking,r=await request("MY_PROFILE_BAGGAGE_PREPARE_PAYMENT",{bookingId:b.id,services}),data=r.result||r;await openPayment({kind:"baggage",bookingId:b.id,services,prepared:data})}catch(e){toast(e.message,true)}finally{busy(false)}}
async function openPayment(flow){const p=flow.prepared?.payment;if(!p?.clientSecret||!p?.publishableKey)throw new Error("Secure payment could not be prepared.");state.payment=flow;openModal(flow.kind==="baggage"?"Secure baggage payment":"Secure change payment",`<div class="card pad"><h3>${esc(money(p.amount,p.currency))}</h3><p>The payment is authorized first and captured only after the supplier confirms the servicing action.</p></div><div class="stripe-box" id="paymentElement"></div><div id="paymentError" style="color:var(--danger);font-size:11px;margin-top:10px"></div>`,`<button class="btn soft" data-close-modal>Cancel</button><button class="btn primary" id="confirmPaymentBtn">Authorize & continue</button>`);if(!window.Stripe)throw new Error("Secure payment is temporarily unavailable.");state.stripe=Stripe(p.publishableKey);state.elements=state.stripe.elements({clientSecret:p.clientSecret,appearance:{theme:"stripe",variables:{colorPrimary:"#022e64",fontFamily:"Inter, sans-serif",borderRadius:"10px"}}});state.elements.create("payment").mount("#paymentElement")}
async function confirmPayment(){const flow=state.payment,p=flow?.prepared?.payment;if(!flow||!state.stripe||!state.elements)return;busy(true);try{const result=await state.stripe.confirmPayment({elements:state.elements,redirect:"if_required"});if(result.error)throw new Error(result.error.message||"Payment authorization failed.");const paymentIntentId=result.paymentIntent?.id||p.paymentIntentId;if(flow.kind==="baggage")await request("MY_PROFILE_BAGGAGE_CONFIRM",{bookingId:flow.bookingId,services:flow.services,paymentIntentId});else await request("MY_PROFILE_FLIGHT_CHANGE_CONFIRM",{bookingId:flow.bookingId,orderChangeId:flow.orderChangeId,paymentIntentId});toast(flow.kind==="baggage"?"Baggage added to your booking.":"Flight change confirmed.");closeModal();await refreshBooking()}catch(e){$("paymentError").textContent=e.message||"Payment could not be completed.";toast(e.message,true)}finally{busy(false)}}
function confirmSimple(title,body,type){openModal(title,`<div class="provider-note">${esc(body)}</div>`,`<button class="btn soft" data-close-modal>Keep booking</button><button class="btn danger" data-confirm-simple="${esc(type)}">Confirm cancellation</button>`)}
async function refreshBooking(){const id=state.bookingDetail?.booking?.id;if(!id)return;const r=await request("MY_PROFILE_BOOKING_DETAIL",{bookingId:id});state.bookingDetail=r.result||r;renderBookingDetail()}
function profilePayload(form){return {firstName:form.firstName.value.trim(),lastName:form.lastName.value.trim(),email:form.email.value.trim(),phone:form.phone.value.trim(),countryOfResidenceId:form.countryOfResidenceId.value,preferredLanguageId:form.preferredLanguageId.value,preferredCurrency:form.preferredCurrency.value,preferredDepartureAirportId:form.preferredDepartureAirportId.value,seatPreference:form.seatPreference.value,dietaryPrefs:form.dietaryPrefs.value.trim(),accessibilityNeeds:form.accessibilityNeeds.value.trim(),marketingConsent:form.marketingConsent.checked}}
async function refresh(){busy(true);try{const r=await request("MY_PROFILE_REFRESH",{section:state.section,view:state.view});if(r.result?.profile||r.profile){state.data=r.result||r;renderAll()}}catch(e){toast(e.message,true)}finally{busy(false)}}
document.addEventListener("click",async e=>{
  const cat=e.target.closest("[data-category-toggle]");if(cat){const wrap=cat.closest(".side-category");const willOpen=!wrap.classList.contains("open");wrap.classList.toggle("open",willOpen);cat.setAttribute("aria-expanded",willOpen?"true":"false");return}
  const page=e.target.closest("[data-section][data-view]");if(page){setPage(page.dataset.section,page.dataset.view,true);return}
  if(e.target.id==="linkBookingBtn"){linkBookingModal();return}
  if(e.target.id==="confirmLinkBooking"){const f=$("linkBookingForm");if(!f?.reportValidity())return;busy(true);try{const data=Object.fromEntries(new FormData(f).entries());await request("MY_PROFILE_LINK_BOOKING",data);toast("Booking linked to your profile.");closeModal();state.section="trips";state.view="upcoming";await refresh()}catch(x){toast(x.message,true)}finally{busy(false)}return}
  if(e.target.id==="refreshBtn"){post("CUSTOMER_DOCUMENT_REFRESH",{bookingId:state.bookingDetail?.booking?.id||""},DOC_SOURCE);await refresh();return}
  if(e.target.id==="closeBtn"){post("CUSTOMER_DOCUMENT_CLOSE",{},DOC_SOURCE);setPage("trips","upcoming",true);return}
  const legacy=e.target.closest("[data-tab]");if(legacy){setTab(legacy.dataset.tab,true);return}
  const route=e.target.closest("[data-route]");if(route){post("MY_PROFILE_NAVIGATE",{path:route.dataset.route});return}
  const booking=e.target.closest("[data-booking]");if(booking){loadBooking(booking.dataset.booking);return}
  const lf=e.target.closest("[data-ledger-filter]");if(lf){state.ledgerFilter=lf.dataset.ledgerFilter;renderClub();return}
  if(e.target.closest("[data-close-modal]")){closeModal();return}
  const manageBtn=e.target.closest("[data-manage]");if(manageBtn){manage(manageBtn.dataset.manage);return}
  const removeFav=e.target.closest("[data-remove-favorite]");if(removeFav){busy(true);try{await request("MY_PROFILE_REMOVE_FAVORITE",{favoriteId:removeFav.dataset.removeFavorite});await refresh()}catch(x){toast(x.message,true)}finally{busy(false)}return}
  const read=e.target.closest("[data-read-notification]");if(read){try{await request("MY_PROFILE_MARK_NOTIFICATION_READ",{notificationId:read.dataset.readNotification});await refresh()}catch(x){toast(x.message,true)}return}
  const edit=e.target.closest("[data-edit-traveler]");if(edit){travelerModal(arr(state.data?.travelers).find(x=>x.id===edit.dataset.editTraveler)||{});return}
  const rem=e.target.closest("[data-remove-traveler]");if(rem){if(confirm("Remove this saved traveler?")){try{await request("MY_PROFILE_REMOVE_TRAVELER",{travelerId:rem.dataset.removeTraveler});await refresh()}catch(x){toast(x.message,true)}}return}
  const openDoc=e.target.closest("[data-open-doc]");if(openDoc){post("CUSTOMER_DOCUMENT_OPEN",{documentId:openDoc.dataset.openDoc},DOC_SOURCE);return}
  const compDoc=e.target.closest("[data-complete-doc]");if(compDoc){post("CUSTOMER_DOCUMENT_COMPLETE",{documentId:compDoc.dataset.completeDoc},DOC_SOURCE);return}
  const acc=e.target.closest("[data-accept-airline-change]");if(acc){busy(true);try{await request("MY_PROFILE_AIRLINE_CHANGE_ACCEPT",{bookingId:state.bookingDetail.booking.id,changeId:acc.dataset.acceptAirlineChange});toast("Airline change accepted.");await refreshBooking()}catch(x){toast(x.message,true)}finally{busy(false)}return}
  const cancel=e.target.closest("[data-confirm-cancel]");if(cancel){busy(true);try{await request("MY_PROFILE_FLIGHT_CANCEL_CONFIRM",{bookingId:state.bookingDetail.booking.id,cancellationId:cancel.dataset.confirmCancel});toast("Booking cancelled.");closeModal();await refreshBooking()}catch(x){toast(x.message,true)}finally{busy(false)}return}
  const simple=e.target.closest("[data-confirm-simple]");if(simple){busy(true);try{await request(simple.dataset.confirmSimple,{bookingId:state.bookingDetail.booking.id});toast("Cancellation request completed.");closeModal();await refreshBooking()}catch(x){toast(x.message,true)}finally{busy(false)}return}
  const sel=e.target.closest("[data-select-change]");if(sel){selectChange(sel.dataset.selectChange,sel.dataset.changeAmount);return}
  if(e.target.id==="searchChangesBtn"){searchChanges();return}if(e.target.id==="prepareBagsBtn"){prepareBags();return}if(e.target.id==="confirmPaymentBtn"){confirmPayment();return}
  if(e.target.id==="saveTravelerModal"){const f=$("travelerForm"),data=Object.fromEntries(new FormData(f).entries());data.isPrimary=f.isPrimary.checked;busy(true);try{await request("MY_PROFILE_SAVE_TRAVELER",{traveler:data});toast("Traveler saved.");closeModal();await refresh()}catch(x){toast(x.message,true)}finally{busy(false)}return}
});
$("addTraveler")?.addEventListener("click",()=>travelerModal({}));$("closeDrawer")?.addEventListener("click",closeDrawer);$("drawerShade")?.addEventListener("click",closeDrawer);$("closeModal")?.addEventListener("click",closeModal);$("modalShade")?.addEventListener("click",e=>{if(e.target===$("modalShade"))closeModal()});$("logoutBtn")?.addEventListener("click",()=>post("MY_PROFILE_LOGOUT"));$("profileForm")?.addEventListener("submit",async e=>{e.preventDefault();busy(true);try{const r=await request("MY_PROFILE_SAVE_PROFILE",{profile:profilePayload(e.currentTarget)}),data=r.result||r;toast("Preferences saved.");if(data.providerSync){const note=$("providerSyncNote");note.classList.remove("hidden");note.textContent=data.providerSync.ok?"Travel supplier profile synchronized.":data.providerSync.skipped?data.providerSync.reason:`Profile saved. Supplier sync will retry later: ${data.providerSync.error?.message||"unavailable"}`}await refresh()}catch(x){toast(x.message,true)}finally{busy(false)}});
window.addEventListener("message",e=>{let m=e.data;if(typeof m==="string"){try{m=JSON.parse(m)}catch{return}}if(!m||typeof m!=="object")return;if(m.source&&m.source!==PARENT)return;const p=m.payload||{};if(m.type==="MY_PROFILE_DATA"){state.data=p;state.legacyDocuments=null;renderAll();return}if(m.type==="MY_PROFILE_RESULT"){const h=state.pending.get(p.requestId);if(h){clearTimeout(h.t);state.pending.delete(p.requestId);h.resolve(p)}return}if(m.type==="MY_PROFILE_ERROR"){const h=state.pending.get(p.requestId);if(h){clearTimeout(h.t);state.pending.delete(p.requestId);h.reject(new Error(p.message||"The request failed."))}else toast(p.message||"The request failed.",true);return}if(m.type==="MY_PROFILE_SET_PAGE"){setPage(p.section||"club",p.view||"overview");return}if(m.type==="MY_PROFILE_SET_TAB"){setTab(p.tab||"overview");return}if(m.type==="CUSTOMER_DOCUMENTS_LOAD"){state.legacyDocuments=arr(p.documents);renderDocuments();renderTrips();return}if(m.type==="CUSTOMER_DOCUMENT_RESULT"){const doc=p.document||{};if(doc.fileUrl){window.open(doc.fileUrl,"_blank","noopener")}else toast("This document has no downloadable file yet.")}if(m.type==="CUSTOMER_DOCUMENT_ACTION_REQUIRED"){const doc=p.document||{};if(doc.bookingId){setPage("trips","upcoming",false);toast("This booking needs your attention. Open the trip to continue.")}else{setPage("profile","travelers",false);toast("Complete the requested traveler information here.")}return}if(m.type==="CUSTOMER_DOCUMENT_ERROR")toast(p.message||"Document request failed.",true)});
const qs=new URLSearchParams(location.search);post("MY_PROFILE_READY",{section:qs.get("section")||"club",view:qs.get("view")||"overview",tab:qs.get("tab")||""});post("CUSTOMER_DOCUMENT_CENTER_READY",{},DOC_SOURCE);
})();
</script>
</body>
</html>
