VOY Magazine
INFO / LOG
Status: V12 repair prepared — STATICALLY VERIFIED / REQUIRES LIVE TEST
System: SKANDI
Route: /voy-magazine
Wix page: VOYÉ Atelier.gecp7
HTML component: #voyMagazineEmbed
Child source: SKANDI_VOY_MAGAZINE
Repository baseline: skanditravels/SKANDI-TRAVELS main 4163618a81fed71d7114ac55d3fa003421f145b0
Prepared: 2026-10-13
V12 repair
Upgraded the public reader toward a premium editorial reading experience with stronger issue identity, larger reading canvas, restrained controls, issue archive and responsive single-page behavior. The page bridge now uses canonical SKANDI_CORE VOY services rather than backend/FINAL.
Verification boundary
Source contracts and syntax are checked locally. Wix publication, Supabase/RLS, staff/member session state and provider behavior require live testing after replacement and publication.

- 2026-10-30 — VOY slogan uses brand.slogans.voy and the shared master language setting; its reader mark remains [LEAVE_PLACEHOLDER], while the receiver uses voyBySkWhite.

COMPLETE INTENDED LIVE HTML SOURCE
```
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>VOY Magazine | SKANDI Travels</title>
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Inter:wght@400;500;600&family=Montserrat:wght@400;500;600;700;800;900&family=Playfair+Display:wght@600;700;800;900&display=swap" rel="stylesheet">
<style>

:root{
  --skandi-night:#07162c;
  --skandi-navy:#061a3e;
  --skandi-blue:#022e64;
  --skandi-panel:#0b2751;
  --skandi-teal:#5fc7cf;
  --skandi-teal-deep:#3faeb9;
  --skandi-gold:#d4af37;
  --skandi-gold-soft:#f1d47d;
  --skandi-porcelain:#fbfaf6;
  --skandi-ivory:#f5f1ea;
  --skandi-paper:#fff;
  --skandi-ink:#172033;
  --skandi-muted:#697386;
  --skandi-line:#e4ded4;
  --skandi-shadow:0 18px 55px rgba(7,22,44,.12);
  --skandi-shadow-deep:0 30px 90px rgba(0,0,0,.34);
}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
html,body{margin:0;width:100%;min-height:100%;overflow-x:hidden}
body{font-family:Inter,Arial,sans-serif;background:var(--skandi-porcelain);color:var(--skandi-ink)}
button,input,select{font:inherit}
button{cursor:pointer}
button:focus-visible,input:focus-visible,select:focus-visible{outline:3px solid rgba(95,199,207,.38);outline-offset:2px}
img{max-width:100%}

.skandi-shell{min-height:100vh;background:linear-gradient(180deg,var(--skandi-night) 0 318px,var(--skandi-porcelain) 318px 100%)}
.site-header{height:72px;background:rgba(7,22,44,.96);border-bottom:1px solid rgba(255,255,255,.10);color:#fff;position:sticky;top:0;z-index:300;backdrop-filter:blur(18px)}
.site-header-inner{max-width:1500px;height:100%;margin:0 auto;padding:0 24px;display:flex;align-items:center;justify-content:space-between;gap:24px}
.skandi-brand{display:flex;align-items:center;gap:16px;min-width:0}
.skandi-brand img{display:block;width:auto;height:34px;object-fit:contain}
.brand-divider{width:1px;height:28px;background:rgba(255,255,255,.22)}
.brand-section{font-family:Montserrat,sans-serif;font-size:12px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:var(--skandi-gold-soft);white-space:nowrap}
.site-nav{display:flex;align-items:center;gap:6px}
.nav-link{border:0;background:transparent;color:rgba(255,255,255,.80);padding:10px 12px;border-radius:999px;font-family:Montserrat,sans-serif;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}
.nav-link:hover{background:rgba(255,255,255,.08);color:#fff}
.nav-link.primary{background:var(--skandi-teal);color:var(--skandi-night);padding-inline:16px}
.nav-link.primary:hover{background:#7ad5dc}
.mobile-brand{display:none}

.content-shell{max-width:1500px;margin:0 auto;padding:22px 24px 76px}
.masthead{min-height:224px;position:relative;overflow:hidden;border:1px solid rgba(255,255,255,.10);border-radius:26px;background:
  radial-gradient(circle at 86% 12%,rgba(212,175,55,.22),transparent 28%),
  radial-gradient(circle at 70% 115%,rgba(95,199,207,.18),transparent 35%),
  linear-gradient(125deg,#07162c 0%,#0b2751 58%,#123c68 100%);
  box-shadow:var(--skandi-shadow-deep);color:#fff;display:grid;grid-template-columns:minmax(0,1.3fr) minmax(300px,.7fr);gap:28px;align-items:center;padding:30px 34px;margin-bottom:18px}
.masthead:before{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(90deg,rgba(0,0,0,.18),transparent 52%)}
.masthead-copy,.masthead-logo{position:relative;z-index:1}
.eyebrow{font-family:Montserrat,sans-serif;font-size:10px;font-weight:800;letter-spacing:.22em;text-transform:uppercase;color:var(--skandi-gold-soft);margin-bottom:12px}
.masthead h1{font-family:Montserrat,sans-serif;font-size:clamp(30px,4vw,58px);line-height:1;margin:0 0 12px;letter-spacing:-.045em;font-weight:800}
.masthead p{max-width:760px;margin:0;color:rgba(255,255,255,.78);font-size:14px;line-height:1.72}
.masthead-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:20px}
.masthead-meta{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}
.meta-chip{display:inline-flex;align-items:center;gap:8px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.06);border-radius:999px;padding:7px 10px;color:rgba(255,255,255,.76);font-size:11px;font-weight:600}
.meta-chip:before{content:"";width:6px;height:6px;border-radius:50%;background:var(--skandi-teal)}
.masthead-logo{justify-self:end;width:min(380px,100%);background:rgba(255,255,255,.97);border:1px solid rgba(212,175,55,.34);border-radius:20px;padding:16px 18px;box-shadow:0 20px 60px rgba(0,0,0,.30)}
.masthead-logo img{display:block;width:100%;height:auto}

.btn{min-height:42px;border:0;border-radius:999px;padding:0 16px;display:inline-flex;align-items:center;justify-content:center;gap:8px;font-family:Montserrat,sans-serif;font-size:10px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;transition:transform .16s ease,background .16s ease,border-color .16s ease,color .16s ease}
.btn:hover{transform:translateY(-1px)}
.btn.gold{background:var(--skandi-gold);color:var(--skandi-night)}
.btn.teal{background:var(--skandi-teal);color:var(--skandi-night)}
.btn.navy{background:var(--skandi-blue);color:#fff}
.btn.light{background:#fff;color:var(--skandi-blue);border:1px solid var(--skandi-line)}
.btn.ghost{background:transparent;color:#fff;border:1px solid rgba(255,255,255,.28)}
.btn.icon-only{width:42px;padding:0;font-size:16px;letter-spacing:0}

.status{display:none;border:1px solid var(--skandi-line);background:#fff;border-radius:14px;padding:12px 14px;color:var(--skandi-muted);font-size:12px;line-height:1.55;margin-bottom:14px;white-space:pre-line;box-shadow:0 10px 30px rgba(7,22,44,.06)}
.status.show{display:block}.status.ok{background:#effbf6;border-color:#b7ead0;color:#087443}.status.warn{background:#fff8e8;border-color:#efd58e;color:#855b00}.status.error{background:#fff2f0;border-color:#ffc7c2;color:#a5261e}

.search-shell{background:rgba(255,255,255,.98);border:1px solid var(--skandi-line);border-radius:20px;box-shadow:var(--skandi-shadow);padding:12px;margin-bottom:16px}
.search-topline{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:2px 4px 10px}
.search-label{font-family:Montserrat,sans-serif;font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--skandi-blue)}
.search-help{font-size:11px;color:var(--skandi-muted)}
.mag-toolbar{display:grid;grid-template-columns:minmax(220px,1.45fr) repeat(4,minmax(130px,.62fr)) auto;gap:9px;align-items:center}
.mag-toolbar input,.mag-toolbar select{height:43px;width:100%;min-width:0;border:1px solid var(--skandi-line);border-radius:12px;background:#fff;padding:0 12px;color:var(--skandi-ink);font-size:12px}
.mag-toolbar input:focus,.mag-toolbar select:focus{border-color:var(--skandi-teal-deep);box-shadow:0 0 0 3px rgba(95,199,207,.14);outline:0}

.reader-layout{display:grid;grid-template-columns:minmax(0,1fr) 330px;gap:16px;align-items:start}
.reader-panel{background:#fff;border:1px solid var(--skandi-line);border-radius:24px;box-shadow:var(--skandi-shadow);overflow:hidden;min-width:0}
.reader-head{background:#fff;border-bottom:1px solid var(--skandi-line);padding:13px 14px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center}
.reader-title-block{min-width:0;display:flex;align-items:center;gap:12px}
.reader-mark{width:38px;height:38px;flex:0 0 auto;border-radius:11px;background:var(--skandi-night);display:grid;place-items:center;color:var(--skandi-gold);font-family:Montserrat,sans-serif;font-size:11px;font-weight:900;letter-spacing:.08em}
.reader-head strong{display:block;color:var(--skandi-blue);font-family:Montserrat,sans-serif;font-size:17px;font-weight:800;letter-spacing:-.025em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.reader-head span{display:block;color:var(--skandi-muted);font-size:11px;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.reader-actions{display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end}
.reader-actions .btn{min-height:38px;padding-inline:12px}

.flip-stage{background:
  radial-gradient(circle at 50% 20%,rgba(255,255,255,.10),transparent 24%),
  radial-gradient(circle at 50% 58%,#1b3456 0%,#0a1930 58%,#050d1b 100%);
  padding:22px;min-height:690px;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden}
.flip-stage:before{content:"";position:absolute;left:0;right:0;bottom:0;height:40%;background:linear-gradient(180deg,transparent,rgba(0,0,0,.24));pointer-events:none}
.stage-watermark{position:absolute;top:16px;left:18px;display:flex;align-items:center;gap:8px;color:rgba(255,255,255,.53);font-family:Montserrat,sans-serif;font-size:9px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;z-index:2}
.stage-watermark:before{content:"";width:19px;height:1px;background:var(--skandi-gold)}
.stage-hint{position:absolute;right:16px;bottom:14px;color:rgba(255,255,255,.58);font-size:10px;z-index:2}
#flipBook{width:min(1080px,100%);height:640px;display:none;touch-action:pan-y;position:relative;z-index:1}
.page{position:relative;isolation:isolate;user-select:none;-webkit-user-select:none;background:#fff;box-shadow:0 12px 42px rgba(0,0,0,.38);overflow:hidden}
.page img,.page canvas{width:100%;height:100%;object-fit:contain;display:block;background:#fff;pointer-events:none}
.reader-fallback{display:none;width:100%;height:640px;border:0;background:#fff;border-radius:14px;position:relative;z-index:1}
.reader-placeholder{position:relative;z-index:1;width:min(520px,100%);text-align:center;color:#fff;padding:28px}
.placeholder-monogram{width:74px;height:74px;border:1px solid rgba(212,175,55,.60);border-radius:50%;display:grid;place-items:center;margin:0 auto 18px;color:var(--skandi-gold);font-family:Montserrat,sans-serif;font-size:20px;font-weight:900;letter-spacing:.10em}
.reader-placeholder strong{display:block;font-family:Montserrat,sans-serif;font-size:29px;font-weight:800;margin-bottom:8px;letter-spacing:-.03em}
.reader-placeholder p{color:rgba(255,255,255,.70);line-height:1.65;font-size:13px;margin:0}

.interactive-layer{position:absolute;inset:0;z-index:30;pointer-events:none;overflow:hidden}
.mag-hotspot{position:absolute;pointer-events:auto;border:0;padding:0;font:inherit;color:inherit;background:transparent;display:flex;align-items:center;justify-content:center;touch-action:manipulation}
.mag-hotspot:focus-visible{outline:3px solid var(--skandi-gold-soft);outline-offset:2px}
.mag-hotspot.is-region{border:1.5px solid rgba(95,199,207,.78);background:rgba(95,199,207,.08);border-radius:7px;transition:background .18s ease,border-color .18s ease,box-shadow .18s ease}
.mag-hotspot.is-region:hover,.mag-hotspot.is-region:focus-visible{background:rgba(95,199,207,.17);border-color:#9ae1e5;box-shadow:0 0 0 4px rgba(95,199,207,.14)}
.mag-hotspot.is-region:after{content:attr(data-icon);position:absolute;top:4px;right:4px;width:22px;height:22px;border-radius:50%;display:grid;place-items:center;background:var(--skandi-gold);color:var(--skandi-night);font-size:11px;font-weight:900;box-shadow:0 4px 12px rgba(7,22,44,.28)}
.mag-hotspot.is-button{min-width:72px;min-height:30px;border-radius:999px;padding:7px 11px;background:var(--skandi-teal);color:var(--skandi-night);font-family:Montserrat,sans-serif;font-size:9px;font-weight:900;letter-spacing:.07em;text-transform:uppercase;box-shadow:0 7px 20px rgba(7,22,44,.24);text-align:center;line-height:1.15}
.mag-hotspot.is-button:hover,.mag-hotspot.is-button:focus-visible{background:#83dbe0;transform:translateY(-1px)}
.mag-hotspot.is-invisible{background:transparent;border:0}
.mag-hotspot.is-invisible:after{content:attr(data-icon);position:absolute;top:3px;right:3px;width:20px;height:20px;border-radius:50%;display:grid;place-items:center;background:rgba(7,22,44,.88);color:#fff;font-size:10px;font-weight:900;opacity:.88}
.hide-interactive-hints .mag-hotspot.is-region{border-color:transparent;background:transparent;box-shadow:none}
.hide-interactive-hints .mag-hotspot.is-region:after,.hide-interactive-hints .mag-hotspot.is-invisible:after{opacity:0}
.hotspot-tooltip{position:absolute;left:50%;bottom:calc(100% + 8px);transform:translateX(-50%);width:max-content;max-width:190px;padding:7px 9px;border-radius:8px;background:var(--skandi-night);color:#fff;font-size:9px;font-weight:700;line-height:1.35;opacity:0;pointer-events:none;transition:opacity .15s ease;box-shadow:0 6px 18px rgba(0,0,0,.28)}
.mag-hotspot:hover .hotspot-tooltip,.mag-hotspot:focus-visible .hotspot-tooltip{opacity:1}

.reader-footer{background:#fff;border-top:1px solid var(--skandi-line)}
.page-nav{padding:10px 13px;display:grid;grid-template-columns:auto minmax(170px,1fr) auto;gap:13px;align-items:center}
.page-nav span{color:var(--skandi-muted);font-size:10px;font-weight:700}
.page-status-group{display:flex;align-items:center;gap:12px;min-width:0}
.page-count{font-family:Montserrat,sans-serif;color:var(--skandi-blue)!important;font-size:11px!important;font-weight:800!important;white-space:nowrap}
.interactive-count{display:inline-flex!important;align-items:center;gap:6px;white-space:nowrap}
.interactive-count:before{content:"";width:7px;height:7px;border-radius:50%;background:var(--skandi-teal);box-shadow:0 0 0 4px rgba(95,199,207,.15)}
.page-scrubber{display:flex;align-items:center;gap:10px;min-width:0}
.page-scrubber input[type="range"]{width:100%;accent-color:var(--skandi-teal)}
.page-jump{display:flex;align-items:center;gap:6px}
.page-jump input{width:58px;height:34px;border:1px solid var(--skandi-line);border-radius:9px;text-align:center;color:var(--skandi-blue);font-size:11px;font-weight:700}
.page-jump button{height:34px;border:1px solid var(--skandi-line);background:#fff;border-radius:9px;color:var(--skandi-blue);font-family:Montserrat,sans-serif;font-size:9px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;padding:0 10px}
.thumbnail-shell{border-top:1px solid var(--skandi-line);background:var(--skandi-ivory);padding:9px 10px}
.thumbnail-rail{display:flex;gap:8px;overflow-x:auto;scrollbar-width:thin;padding:1px 1px 4px}
.page-thumb{flex:0 0 58px;border:1px solid #d7d0c5;border-radius:8px;background:#fff;padding:3px;position:relative;transition:border-color .16s ease,transform .16s ease,box-shadow .16s ease}
.page-thumb:hover{transform:translateY(-1px)}
.page-thumb.active{border-color:var(--skandi-teal-deep);box-shadow:0 0 0 2px rgba(95,199,207,.19)}
.page-thumb img{display:block;width:100%;aspect-ratio:3/4;object-fit:cover;border-radius:5px;background:#fff}
.page-thumb span{position:absolute;right:4px;bottom:4px;min-width:17px;height:17px;border-radius:999px;background:rgba(7,22,44,.88);color:#fff;display:grid;place-items:center;font-size:8px;font-weight:800}

.reader-sidebar{display:grid;gap:13px;position:sticky;top:88px}
.side-card,.journey-card{background:#fff;border:1px solid var(--skandi-line);border-radius:20px;box-shadow:0 14px 38px rgba(7,22,44,.08);overflow:hidden}
.side-card-head{padding:15px 15px 10px;border-bottom:1px solid #eee8de}
.side-kicker{font-family:Montserrat,sans-serif;font-size:9px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:var(--skandi-teal-deep);margin-bottom:6px}
.side-card h2,.journey-card h2{font-family:Montserrat,sans-serif;color:var(--skandi-blue);font-size:18px;line-height:1.18;letter-spacing:-.025em;margin:0}
.reading-now{padding:15px}
.reading-edition{font-size:10px;color:var(--skandi-gold);font-weight:700;text-transform:uppercase;letter-spacing:.09em;margin-bottom:8px}
.reading-now strong{display:block;color:var(--skandi-blue);font-family:Montserrat,sans-serif;font-size:17px;line-height:1.25;margin-bottom:7px}
.reading-now p{margin:0;color:var(--skandi-muted);font-size:11px;line-height:1.6}
.reading-actions{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:13px}
.reading-actions .btn{min-height:37px;padding-inline:8px;font-size:9px}
.reading-tags{display:flex;gap:6px;flex-wrap:wrap;margin-top:12px}
.search-results{display:grid;gap:7px;padding:11px;max-height:350px;overflow:auto}
.result{border:1px solid #e8e1d6;background:#fff;border-radius:12px;padding:10px;text-align:left;width:100%;transition:background .16s ease,border-color .16s ease}
.result:hover{background:var(--skandi-ivory);border-color:#d6cdbf}
.result strong{display:block;color:var(--skandi-blue);font-family:Montserrat,sans-serif;font-size:11px;margin-bottom:4px}.result span{display:block;color:var(--skandi-muted);font-size:10px;line-height:1.5}
.journey-card{padding:16px;background:linear-gradient(145deg,#07162c,#0b2751);color:#fff;border-color:rgba(212,175,55,.24)}
.journey-card .side-kicker{color:var(--skandi-gold-soft)}
.journey-card h2{color:#fff;font-size:17px}
.journey-card span{display:block;color:rgba(255,255,255,.68);font-size:11px;line-height:1.55;margin-top:7px}
.journey-card .btn{margin-top:13px}

.below-reader{margin-top:28px}
.section-heading{display:flex;align-items:end;justify-content:space-between;gap:18px;margin-bottom:12px}
.section-heading h2{font-family:Montserrat,sans-serif;font-size:26px;letter-spacing:-.045em;color:var(--skandi-blue);margin:0}
.section-heading p{margin:0;color:var(--skandi-muted);font-size:11px}
.wide-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:13px}
.issue,.travel-card{border:1px solid var(--skandi-line);background:#fff;border-radius:18px;padding:0;text-align:left;width:100%;overflow:hidden;box-shadow:0 11px 30px rgba(7,22,44,.06);transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease}
.issue:hover,.travel-card:hover{transform:translateY(-3px);box-shadow:0 20px 45px rgba(7,22,44,.10);border-color:#d4cabd}
.issue-cover,.travel-img{height:150px;background:linear-gradient(145deg,#0b2751,#07162c);background-position:center;background-size:cover;position:relative}
.issue-cover:after{content:"VOY";position:absolute;left:14px;bottom:12px;color:#fff;font-family:Montserrat,sans-serif;font-size:24px;font-weight:900;letter-spacing:.06em}
.issue-body,.travel-body{padding:13px}
.issue strong,.travel-card strong{display:block;color:var(--skandi-blue);font-family:Montserrat,sans-serif;font-size:13px;line-height:1.35;margin-bottom:5px}.issue span,.travel-card span{display:block;color:var(--skandi-muted);font-size:10px;line-height:1.5}
.pill-row{display:flex;gap:5px;flex-wrap:wrap;margin-top:9px}.pill{display:inline-flex;border:1px solid #d7ebed;background:#effafb;color:#176d75;border-radius:999px;padding:4px 7px;font-size:8px;font-family:Montserrat,sans-serif;font-weight:800;letter-spacing:.04em;text-transform:uppercase}

.reader-modal{position:fixed;inset:0;z-index:9999;display:none;align-items:center;justify-content:center;padding:18px;background:rgba(3,10,24,.82);backdrop-filter:blur(10px)}
.reader-modal.show{display:flex}
.reader-modal-card{width:min(860px,100%);max-height:min(88vh,760px);overflow:auto;background:#fff;border:1px solid rgba(212,175,55,.45);border-radius:22px;box-shadow:0 28px 80px rgba(0,0,0,.46)}
.reader-modal-head{position:sticky;top:0;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:14px;padding:13px 15px;background:rgba(255,255,255,.97);border-bottom:1px solid var(--skandi-line);backdrop-filter:blur(8px)}
.reader-modal-head strong{color:var(--skandi-blue);font-family:Montserrat,sans-serif;font-size:15px}.reader-modal-close{width:36px;height:36px;border:1px solid var(--skandi-line);border-radius:50%;background:#fff;color:var(--skandi-blue);font-size:20px;line-height:1}
.reader-modal-body{padding:17px;color:var(--skandi-ink);line-height:1.65}.reader-modal-body p{white-space:pre-wrap}.reader-modal-body img{display:block;width:100%;height:auto;border-radius:15px;margin-bottom:14px}.reader-video{position:relative;width:100%;aspect-ratio:16/9;border-radius:15px;overflow:hidden;background:var(--skandi-night)}.reader-video iframe{position:absolute;inset:0;width:100%;height:100%;border:0}

.flip-stage:fullscreen{padding:24px;background:radial-gradient(circle at center,#1b3456 0%,#050a14 75%)}
.flip-stage:fullscreen #flipBook{width:min(1540px,96vw);height:92vh}
body.focus-reader .site-header,body.focus-reader .masthead,body.focus-reader .search-shell,body.focus-reader .reader-sidebar,body.focus-reader .below-reader,body.focus-reader #status{display:none!important}
body.focus-reader .skandi-shell{background:var(--skandi-night)}
body.focus-reader .content-shell{max-width:none;padding:0}
body.focus-reader .reader-layout{display:block}
body.focus-reader .reader-panel{border:0;border-radius:0;min-height:100vh}
body.focus-reader .flip-stage{min-height:calc(100vh - 170px)}
body.focus-reader .thumbnail-shell{display:none}

@media(max-width:1150px){
  .site-nav .nav-link:not(.primary){display:none}
  .masthead{grid-template-columns:1fr 290px}
  .reader-layout{grid-template-columns:1fr}
  .reader-sidebar{position:static;grid-template-columns:repeat(3,1fr)}
  .reader-sidebar .side-card:nth-child(2){grid-column:span 2}
}
@media(max-width:860px){
  .site-header-inner{padding:0 16px}.brand-divider,.brand-section{display:none}.mobile-brand{display:block;font-family:Montserrat,sans-serif;font-size:11px;font-weight:800;letter-spacing:.14em}
  .content-shell{padding:16px 14px 58px}
  .masthead{grid-template-columns:1fr;min-height:auto;padding:24px;border-radius:21px}.masthead-logo{justify-self:start;width:min(290px,82%)}
  .mag-toolbar{grid-template-columns:1fr 1fr}.mag-toolbar #query{grid-column:1/-1}.mag-toolbar .btn{grid-column:1/-1}
  .reader-head{grid-template-columns:1fr}.reader-actions{justify-content:flex-start}
  .flip-stage{min-height:590px;padding:12px}#flipBook,.reader-fallback{height:550px}
  .reader-sidebar{grid-template-columns:1fr 1fr}.reader-sidebar .side-card:nth-child(2){grid-column:1/-1}
  .page-nav{grid-template-columns:1fr}.page-status-group{justify-content:space-between}.page-jump{justify-content:flex-end}
}
@media(max-width:600px){
  .site-header{height:60px}.site-header-inner{padding:0 12px}.skandi-brand img{height:27px}.site-nav .nav-link.primary{padding-inline:12px;font-size:9px}.mobile-brand{display:none}
  .content-shell{padding:10px 8px 44px}.masthead{padding:20px 18px;border-radius:18px;margin-bottom:10px}.masthead h1{font-size:31px}.masthead p{font-size:12px}.masthead-logo{width:230px;padding:10px 12px}.masthead-meta{display:none}
  .search-shell{border-radius:16px;padding:9px}.search-topline{display:none}.mag-toolbar{grid-template-columns:1fr}.mag-toolbar #query{grid-column:auto}.mag-toolbar .btn{grid-column:auto}
  .reader-panel{border-radius:16px}.reader-head{padding:10px}.reader-title-block{align-items:flex-start}.reader-mark{width:34px;height:34px}.reader-head strong{font-size:14px}.reader-actions{display:grid;grid-template-columns:repeat(3,1fr);width:100%}.reader-actions .btn{font-size:0;min-height:38px;padding:0}.reader-actions .btn:before{font-size:15px;letter-spacing:0}.reader-actions #prevBtn:before{content:"←"}.reader-actions #nextBtn:before{content:"→"}.reader-actions #interactiveToggleBtn:before{content:"◎"}.reader-actions #focusModeBtn:before{content:"◱"}.reader-actions #shareBtn:before{content:"↗"}.reader-actions #fullscreenBtn:before{content:"⛶"}
  .flip-stage{min-height:510px;padding:6px}#flipBook,.reader-fallback{height:490px}.stage-watermark{top:10px;left:10px}.stage-hint{display:none}
  .thumbnail-shell{display:none}.page-nav{padding:9px}.page-scrubber{order:3}.page-status-group{gap:7px;flex-wrap:wrap}.interactive-count{white-space:normal}
  .reader-sidebar{grid-template-columns:1fr}.reader-sidebar .side-card:nth-child(2){grid-column:auto}
  .section-heading{align-items:start;flex-direction:column;gap:4px}.wide-grid{grid-template-columns:1fr 1fr}.issue-cover,.travel-img{height:120px}.issue-body,.travel-body{padding:10px}
}
@media(max-width:420px){.wide-grid{grid-template-columns:1fr}.reading-actions{grid-template-columns:1fr 1fr}}



/* ==========================================================================\n   SKANDI embedded magazine presentation\n   The parent SKANDI site owns global navigation; this module starts with content.\n   ========================================================================== */
:root{
  --skandi-navy:#022e64;
  --skandi-navy-soft:#0a417f;
  --skandi-aqua:#5fc7cf;
  --skandi-cream:#fffbea;
  --skandi-bg:#f7f9fc;
  --skandi-text:#102033;
  --skandi-muted:#5b6b7e;
  --skandi-line:rgba(2,46,100,.14);
  --skandi-shadow:0 18px 48px rgba(2,46,100,.13);
}
html,body{background:var(--skandi-bg);color:var(--skandi-text);font-family:"Montserrat",system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif}
body{min-height:100vh}
.skandi-shell{min-height:100vh;background:var(--skandi-bg)}
.content-shell{max-width:1320px;margin:0 auto;padding:0 30px 80px}

.voy-intro{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:32px;align-items:end;padding:54px 0 30px}
.voy-intro-copy{max-width:800px}
.voy-master-slogan{display:block;margin-top:10px;color:var(--skandi-navy);font-size:12px;font-weight:700;letter-spacing:.06em}.voy-eyebrow{display:inline-flex;align-items:center;gap:10px;margin-bottom:13px;color:var(--skandi-navy);font-size:11px;font-weight:800;letter-spacing:.18em;text-transform:uppercase}
.voy-eyebrow:before{content:"";width:38px;height:1px;background:var(--skandi-aqua)}
.voy-intro h1{margin:0 0 13px;color:var(--skandi-navy);font-size:clamp(32px,4.2vw,48px);line-height:1.07;letter-spacing:-.035em;font-weight:800}
.voy-intro p{max-width:760px;margin:0;color:#34465a;font-size:15px;line-height:1.7}
.voy-intro-actions{display:flex;align-items:center;justify-content:flex-end;gap:9px;flex-wrap:wrap}

.btn{min-height:42px;border-radius:12px;padding:0 16px;font-size:10px;letter-spacing:.07em;box-shadow:none}
.btn:hover{transform:none;filter:brightness(.98)}
.btn.navy{background:linear-gradient(180deg,var(--skandi-navy-soft),var(--skandi-navy));color:#fff}
.btn.teal{background:var(--skandi-aqua);color:var(--skandi-navy)}
.btn.gold{background:var(--skandi-cream);border:1px solid var(--skandi-line);color:var(--skandi-navy)}
.btn.light,.btn.outline{background:#fff;color:var(--skandi-navy);border:1px solid var(--skandi-line)}
.btn.ghost{background:#fff;color:var(--skandi-navy);border:1px solid var(--skandi-line)}

.status{border-color:var(--skandi-line);border-radius:16px;box-shadow:none;margin-bottom:14px}
.search-shell{background:#fff;border:1px solid var(--skandi-line);border-radius:20px;box-shadow:0 10px 28px rgba(2,46,100,.08);padding:15px;margin-bottom:18px}
.search-topline{padding:1px 2px 12px}
.search-label{color:var(--skandi-navy);font-size:11px}
.search-help{color:var(--skandi-muted)}
.mag-toolbar{grid-template-columns:minmax(230px,1.55fr) repeat(4,minmax(125px,.65fr)) auto;gap:9px}
.mag-toolbar input,.mag-toolbar select{height:44px;border:1px solid var(--skandi-line);border-radius:12px;background:#fff;color:var(--skandi-text);font-family:inherit}
.mag-toolbar input:focus,.mag-toolbar select:focus{border-color:var(--skandi-aqua);box-shadow:0 0 0 3px rgba(95,199,207,.16)}

.reader-layout{grid-template-columns:minmax(0,1fr) 305px;gap:18px}
.reader-panel,.side-card,.journey-card{border:1px solid var(--skandi-line);box-shadow:var(--skandi-shadow)}
.reader-panel{border-radius:22px;background:#fff}
.reader-head{padding:14px 15px;background:#fff;border-bottom:1px solid var(--skandi-line)}
.reader-mark{width:40px;height:40px;border-radius:12px;background:#eaf8fa;color:var(--skandi-navy);border:1px solid rgba(95,199,207,.38)}
.reader-head strong{color:var(--skandi-navy);font-size:17px}
.reader-head span{color:var(--skandi-muted)}
.reader-actions .btn{min-height:37px;border-radius:10px;text-transform:none;letter-spacing:0;font-size:10px;font-weight:700;padding-inline:11px}
.reader-actions .btn.navy{background:var(--skandi-navy)}

.flip-stage{min-height:690px;padding:24px;background:radial-gradient(circle at 50% 35%,#ffffff 0%,#f4f8fb 42%,#e6eef4 100%)}
.flip-stage:before{display:none}
#flipBook{height:640px}
.page{box-shadow:0 15px 42px rgba(2,46,100,.24)}
.stage-watermark{top:17px;left:19px;color:rgba(2,46,100,.55);font-size:9px}
.stage-watermark:before{background:var(--skandi-aqua)}
.stage-hint{right:15px;bottom:14px;padding:7px 10px;border:1px solid rgba(2,46,100,.10);border-radius:999px;background:rgba(255,255,255,.88);color:var(--skandi-muted);box-shadow:0 8px 20px rgba(2,46,100,.08)}
.reader-placeholder{color:var(--skandi-navy)}
.placeholder-monogram{background:#fff;border-color:rgba(2,46,100,.20);color:var(--skandi-navy);box-shadow:0 12px 30px rgba(2,46,100,.10)}
.reader-placeholder p{color:var(--skandi-muted)}

.reader-footer{border-top:1px solid var(--skandi-line)}
.page-count{color:var(--skandi-navy)!important}
.interactive-count:before{background:var(--skandi-aqua)}
.page-scrubber input[type="range"]{accent-color:var(--skandi-navy)}
.thumbnail-shell{background:#f7f9fc;border-top:1px solid var(--skandi-line)}
.page-thumb{border-color:var(--skandi-line);border-radius:8px}
.page-thumb.active{border-color:var(--skandi-aqua);box-shadow:0 0 0 2px rgba(95,199,207,.20)}

.reader-sidebar{top:20px;gap:14px}
.side-card,.journey-card{border-radius:20px;background:#fff;overflow:hidden}
.side-card-head{border-bottom:1px solid var(--skandi-line);padding:16px 16px 11px}
.side-kicker{color:var(--skandi-navy-soft);font-size:9px}
.side-card h2,.journey-card h2{color:var(--skandi-navy);font-size:18px}
.reading-now{padding:16px}
.reading-edition{color:var(--skandi-navy-soft)}
.reading-now strong{color:var(--skandi-navy)}
.reading-now p,.journey-card span{color:var(--skandi-muted)}
.result{border-color:var(--skandi-line);border-radius:14px}
.result:hover{background:#f7fbff;border-color:rgba(95,199,207,.55)}
.result strong{color:var(--skandi-navy)}
.journey-card{padding:17px;color:var(--skandi-text);border-color:var(--skandi-line)}
.journey-card:nth-of-type(3){background:#eef9fa}
.journey-card:nth-of-type(4){background:var(--skandi-cream)}
.journey-card .side-kicker{color:var(--skandi-navy-soft)}
.journey-card h2{color:var(--skandi-navy)}
.journey-card .btn{margin-top:14px}

.below-reader{margin-top:36px}
.section-heading{align-items:end;margin-bottom:14px}
.section-heading h2{color:var(--skandi-navy);font-size:27px}
.section-heading p{color:var(--skandi-muted);font-size:11px}
.eyebrow{color:var(--skandi-navy-soft)!important}
.wide-grid{gap:16px}
.issue,.travel-card{border-color:var(--skandi-line);border-radius:19px;box-shadow:0 9px 24px rgba(2,46,100,.07)}
.issue:hover,.travel-card:hover{transform:translateY(-2px);box-shadow:0 16px 34px rgba(2,46,100,.12);border-color:rgba(95,199,207,.55)}
.issue-cover,.travel-img{height:165px;background:linear-gradient(135deg,#e8f1ff,#f7fbff)}
.issue-cover:after{color:var(--skandi-navy)}
.issue strong,.travel-card strong{color:var(--skandi-navy);font-size:14px}
.pill{background:var(--skandi-cream);border-color:rgba(2,46,100,.10);color:var(--skandi-navy)}

.reader-modal{background:rgba(2,20,45,.68)}
.reader-modal-card{border-color:var(--skandi-line);border-radius:20px}
.flip-stage:fullscreen{background:radial-gradient(circle at center,#fff 0%,#e8eff5 100%)}
body.focus-reader .voy-intro,body.focus-reader .search-shell,body.focus-reader .reader-sidebar,body.focus-reader .below-reader,body.focus-reader #status{display:none!important}
body.focus-reader .skandi-shell{background:#e8eff5}

@media(max-width:1100px){
  .voy-intro{grid-template-columns:1fr;gap:20px;padding-top:42px}
  .voy-intro-actions{justify-content:flex-start}
  .reader-layout{grid-template-columns:1fr}
  .reader-sidebar{position:static;grid-template-columns:repeat(3,1fr)}
  .reader-sidebar .side-card:nth-child(2){grid-column:span 2}
}
@media(max-width:860px){
  .content-shell{padding:0 18px 58px}
  .voy-intro{padding:38px 0 24px}
  .voy-intro h1{font-size:36px}
  .mag-toolbar{grid-template-columns:1fr 1fr}
  .mag-toolbar #query{grid-column:1/-1}
  .mag-toolbar .btn{grid-column:1/-1}
  .flip-stage{min-height:590px;padding:13px}
  #flipBook,.reader-fallback{height:550px}
}
@media(max-width:600px){
  .content-shell{padding:0 10px 46px}
  .voy-intro{padding:29px 6px 20px}
  .voy-intro h1{font-size:30px}
  .voy-intro p{font-size:13px}
  .voy-intro-actions{display:grid;grid-template-columns:1fr 1fr;width:100%}
  .voy-intro-actions .btn{width:100%}
  .search-shell{border-radius:16px;padding:10px}
  .search-topline{display:none}
  .mag-toolbar{grid-template-columns:1fr}
  .mag-toolbar #query,.mag-toolbar .btn{grid-column:auto}
  .reader-panel{border-radius:17px}
  .reader-head{padding:11px}
  .reader-title-block{align-items:flex-start}
  .reader-mark{width:36px;height:36px}
  .reader-actions{display:grid;grid-template-columns:repeat(3,1fr);width:100%}
  .reader-actions .btn{width:100%;padding-inline:5px;font-size:9px}
  .flip-stage{min-height:500px;padding:8px}
  #flipBook,.reader-fallback{height:475px}
  .stage-watermark{top:9px;left:11px}
  .stage-hint{display:none}
  .reader-sidebar{grid-template-columns:1fr}
  .reader-sidebar .side-card:nth-child(2){grid-column:auto}
  .page-nav{padding:9px}
  .thumbnail-shell{padding-inline:7px}
}

/* Structured pages published by Magazine Manager. */
.structured-page .voyp{position:relative;width:100%;height:100%;overflow:hidden;background:var(--p-bg,#fff);color:var(--p-text,#103154);font-family:var(--p-body,Inter),Arial,sans-serif;background-size:cover;background-position:center;pointer-events:auto}
.voyp h1,.voyp h2,.voyp h3{font-family:var(--p-heading,Montserrat),Georgia,serif}.voyp p{margin:0;line-height:1.5}.voyp small{display:block;color:var(--p-accent,#4dcad6);font-size:9px;font-weight:800;letter-spacing:.18em;text-transform:uppercase}.voyp h1{margin:7px 0 11px;font-size:42px;line-height:.94;letter-spacing:-.045em}.voyp h3{margin:5px 0;font-size:15px;line-height:1.1}.voyp-credit{position:absolute;right:15px;bottom:10px;z-index:5;color:rgba(255,255,255,.78);font-size:7px;text-transform:uppercase}.voyp-footer{position:absolute;right:0;bottom:0;left:0;display:flex;justify-content:space-between;padding:9px 22px;border-top:1px solid rgba(16,49,84,.18);background:var(--p-bg,#fff);color:rgba(16,49,84,.64);font-size:8px;letter-spacing:.08em;text-transform:uppercase}.voyp-heading{padding:34px 34px 14px}.voyp-heading h1{max-width:390px}.voyp-heading p{max-width:370px;color:color-mix(in srgb,var(--p-text,#103154) 74%,transparent);font-size:11px}.voyp-paper{padding-bottom:42px}
.voyp-cover:before,.voyp-opener:before,.voyp-night:before,.voyp-back:before{position:absolute;inset:0;background:linear-gradient(180deg,rgba(2,19,43,.08),rgba(2,19,43,.88));content:""}.voyp-cover>*,.voyp-opener>*,.voyp-night>*,.voyp-back>*{position:relative}.voyp-cover-top{display:flex;align-items:flex-end;justify-content:space-between;padding:28px 31px;color:#fff}.voyp-cover-top b{font-size:58px;line-height:.8;letter-spacing:-.08em}.voyp-cover-top span{font-size:9px;font-weight:900;letter-spacing:.24em}.voyp-cover-copy{position:absolute;right:31px;bottom:35px;left:31px;color:#fff}.voyp-cover-copy h1{max-width:390px;font-size:49px}.voyp-cover-copy p{max-width:350px;font-size:12px}.voyp-cover-lines{display:flex;gap:8px;flex-wrap:wrap;margin:18px 0 14px}.voyp-cover-lines span{padding:5px 8px;border:1px solid rgba(255,255,255,.42);font-size:8px;text-transform:uppercase}.voyp-cover-copy em{font-size:9px;letter-spacing:.12em;text-transform:uppercase}
.voyp-contents{display:grid;grid-template-columns:1fr 1fr;gap:1px;margin:5px 34px 20px;background:rgba(16,49,84,.16)}.voyp-contents>div{display:flex;gap:10px;min-height:61px;padding:11px;background:var(--p-bg,#fff)}.voyp-contents>div>b{color:var(--p-accent);font-size:21px}.voyp-contents span{display:flex;flex-direction:column}.voyp-contents strong{font-family:var(--p-heading);font-size:14px}.voyp-contents em{margin-top:3px;color:rgba(16,49,84,.58);font-size:8px}.voyp-note{margin:0 34px;padding:16px;border-left:3px solid var(--p-accent);background:color-mix(in srgb,var(--p-accent) 10%,var(--p-bg));font-family:var(--p-heading);font-size:14px;line-height:1.45}
.voyp-split{display:grid;grid-template-columns:.85fr 1.15fr}.voyp-split-img,.voyp-feature-img{background:#dbe5ef center/cover no-repeat}.voyp-split-copy{padding:47px 31px}.voyp-split-copy h1{font-size:43px}.voyp-lead{margin-bottom:16px!important;font-family:var(--p-heading);font-size:14px;font-weight:700}.voyp-columns{column-count:2;column-gap:16px;font-size:9px;line-height:1.62}.voyp-rule{display:block;width:68px;height:3px;margin-top:20px;background:var(--p-accent)}
.voyp-card-grid,.voyp-destination-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:5px 34px}.voyp-card{min-height:130px;padding:14px;border:1px solid rgba(16,49,84,.16);background:color-mix(in srgb,var(--p-bg) 94%,#fff)}.voyp-card-img{height:74px;margin:-14px -14px 10px;background:#dbe5ef center/cover}.voyp-card p{color:color-mix(in srgb,var(--p-text) 65%,transparent);font-size:9px}.voyp-price{display:block;margin-top:11px;color:var(--p-accent);font-size:15px}.voyp-cta{display:inline-block;margin-top:8px;padding:5px 8px;border:0;background:var(--p-text);color:var(--p-bg);font-size:8px;text-transform:uppercase}.voyp-offers .voyp-card{min-height:175px}.voyp-smallprint,.voyp-wide-copy{margin:16px 34px!important;color:color-mix(in srgb,var(--p-text) 70%,transparent);font-size:9px;line-height:1.55}
.voyp-opener{display:flex;align-items:flex-end;padding:41px;color:#fff}.voyp-opener>div{max-width:380px}.voyp-opener h1{font-size:55px}.voyp-opener p{font-size:14px}.voyp-opener span{display:inline-block;margin-top:17px;padding-top:8px;border-top:2px solid var(--p-accent);font-size:9px;text-transform:uppercase}.voyp-feature{display:grid;grid-template-rows:260px 1fr}.voyp-feature article{padding:27px 34px}.voyp-feature h1{font-size:38px}.voyp-destination-grid .voyp-card{min-height:170px;background:linear-gradient(160deg,color-mix(in srgb,var(--p-accent) 12%,var(--p-bg)),var(--p-bg))}
.voyp-night{padding:34px;color:#fff}.voyp-night-card{position:absolute;right:28px;bottom:47px;left:28px;padding:25px;border:1px solid rgba(255,255,255,.35);background:rgba(3,14,31,.76)}.voyp-night-card h1{font-size:46px}.voyp-night-card p{font-size:12px}.voyp-night-card>div{margin-top:14px;column-count:2;column-gap:18px;font-size:9px;line-height:1.55}.voyp-night .voyp-footer{background:rgba(3,14,31,.86);color:#fff;border-color:rgba(255,255,255,.25)}
.voyp-experience-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:6px 34px}.voyp-experience-grid .voyp-card{min-height:212px}.voyp-experience-grid .voyp-card:nth-child(2){margin-top:20px}.voyp-tips{padding-bottom:42px}.voyp-tip-list{width:56%;padding:5px 0 0 34px}.voyp-tip-list article{display:flex;gap:11px;padding:12px 0;border-bottom:1px solid rgba(16,49,84,.18)}.voyp-tip-list article>b{color:var(--p-accent);font-size:23px}.voyp-tip-list h3{margin:0 0 3px}.voyp-tip-list p{font-size:9px}.voyp-tips>aside{position:absolute;right:0;bottom:42px;width:38%;height:371px;background:#dbe5ef center/cover}
.voyp-guide-list{margin:5px 34px;border-top:1px solid rgba(16,49,84,.18)}.voyp-guide-list article{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:15px 0;border-bottom:1px solid rgba(16,49,84,.18)}.voyp-guide-list article p{font-size:9px}.voyp-guide-list article>span{flex:0 0 auto;padding:6px 9px;background:var(--p-accent);color:#fff;font-size:8px;text-transform:uppercase}.voyp-onboard{display:grid;grid-template-rows:253px 1fr;padding-bottom:42px}.voyp-onboard>article{padding:24px 34px}.voyp-onboard h1{font-size:36px}.voyp-service-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:14px}.voyp-service-grid .voyp-card{min-height:126px;padding:10px}.voyp-service-grid .voyp-card h3{font-size:11px}
.voyp-map{padding-bottom:42px}.voyp-map-art{position:relative;height:292px;margin:0 34px;border:1px solid rgba(16,49,84,.18);background:radial-gradient(circle at 20% 35%,color-mix(in srgb,var(--p-accent) 18%,transparent),transparent 20%),linear-gradient(145deg,#eaf2f7,#f9fbfd)}.voyp-map .dot{position:absolute;z-index:3;display:grid;width:42px;height:42px;place-items:center;border:3px solid #fff;border-radius:50%;background:var(--p-text);color:#fff;font-size:8px;font-weight:900}.voyp-map .nyc{left:12%;top:38%}.voyp-map .cph{left:48%;top:18%}.voyp-map .ath{left:66%;top:50%}.voyp-map .isl{right:7%;bottom:12%;width:53px;height:53px;background:var(--p-accent)}.voyp-map .route{position:absolute;height:2px;transform-origin:left;background:var(--p-accent)}.voyp-map .r1{left:19%;top:45%;width:169px;transform:rotate(-19deg)}.voyp-map .r2{left:54%;top:28%;width:101px;transform:rotate(32deg)}.voyp-map .r3{left:71%;top:59%;width:79px;transform:rotate(19deg)}.voyp-route-list{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:11px 34px}.voyp-route-list div{display:flex;flex-direction:column;padding:8px;border-left:2px solid var(--p-accent);background:color-mix(in srgb,var(--p-accent) 8%,var(--p-bg));font-size:8px}.voyp-route-list span{margin-top:2px;color:rgba(16,49,84,.64)}
.voyp-signature{padding-bottom:42px}.voyp-signature-hero{position:relative;height:371px;padding:32px;color:#fff;background:#173747 center/cover}.voyp-signature-hero:before{position:absolute;inset:0;background:linear-gradient(180deg,rgba(2,19,43,.16),rgba(2,19,43,.72));content:""}.voyp-signature-hero>*{position:relative}.voyp-signature-hero h1{max-width:370px;font-size:43px}.voyp-signature-hero p{max-width:340px;font-size:11px}.voyp-signature-cards{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:14px 34px}.voyp-signature-cards .voyp-card{min-height:135px}.voyp-back{display:grid;place-items:center;padding:45px;text-align:center;color:#fff}.voyp-back>div{z-index:2;max-width:370px}.voyp-back h1{font-size:52px}.voyp-back p{font-size:14px}.voyp-back-cta{display:inline-block;margin:20px 0 12px;padding:9px 17px;border:0;background:var(--p-accent);color:#07162c;font-size:9px;font-weight:900;text-transform:uppercase}.voyp-back em{display:block;font-size:9px;letter-spacing:.12em}
.structured-page-thumb{height:82px}.structured-thumb-view{display:flex;height:100%;flex-direction:column;justify-content:flex-end;padding:5px;background:linear-gradient(145deg,#eaf3f9,#fff);overflow:hidden;text-align:left}.structured-thumb-view small{color:var(--skandi-teal-deep);font-size:6px;font-weight:900;text-transform:uppercase}.structured-thumb-view strong{margin-top:2px;color:var(--skandi-blue);font-family:Montserrat,sans-serif;font-size:7px;line-height:1.05}.structured-static{display:flex!important;gap:16px;overflow-x:auto}.structured-static>.page{flex:0 0 min(460px,90vw);height:650px}


/* V12 VOY READER 2026.10.13 — immersive travel-magazine reader */
:root{--voy-ink:#07162c;--voy-navy:#022e64;--voy-aqua:#5fc7cf;--voy-gold:#c6a56a;--voy-paper:#fffdf8;--voy-sand:#f2ede5;--voy-line:#ddd7cc}
.skandi-shell{background:linear-gradient(180deg,#07162c 0 390px,#f5f2ed 390px 100%)}
.site-header{display:none!important}.content-shell{max-width:1440px;padding:24px 28px 90px}.masthead{min-height:310px;border-radius:12px;padding:46px 50px;margin-bottom:24px;grid-template-columns:minmax(0,1.35fr) minmax(260px,.55fr);background:radial-gradient(circle at 80% 18%,rgba(198,165,106,.20),transparent 28%),linear-gradient(120deg,#07162c 0%,#0a2c55 65%,#0f4772 100%)}.masthead h1{font-family:"Cormorant Garamond",Georgia,serif;font-size:clamp(56px,7vw,94px);font-weight:600;letter-spacing:-.035em}.masthead p{font-size:15px;max-width:720px}.masthead-logo{background:rgba(255,253,248,.96);border-radius:6px;border-color:rgba(198,165,106,.42)}.masthead-meta{display:none}
.search-shell{border-radius:7px;padding:10px 12px;box-shadow:0 12px 36px rgba(7,22,44,.07)}.search-topline{padding-bottom:8px}.mag-toolbar{grid-template-columns:minmax(260px,1.5fr) repeat(3,minmax(125px,.55fr)) auto}.mag-toolbar select:nth-of-type(4){display:none}
.reader-layout{grid-template-columns:minmax(0,1fr) 290px;gap:18px}.reader-panel{border-radius:8px;border-color:var(--voy-line);box-shadow:0 20px 56px rgba(7,22,44,.10)}.reader-head{padding:12px 14px}.reader-mark{border-radius:50%;background:#07162c;color:var(--voy-gold)}.reader-head strong{font-family:"Cormorant Garamond",Georgia,serif;font-size:22px;font-weight:700}.reader-actions .btn{border-radius:4px;letter-spacing:.07em}.flip-stage{min-height:760px;padding:30px;background:radial-gradient(circle at 50% 36%,#fff 0%,#f7f4ee 48%,#e9e4dc 100%)}#flipBook{height:700px;max-width:1180px}.reader-fallback{height:700px}.stage-watermark{color:#42566d}.stage-watermark:before{background:var(--voy-gold)}.stage-hint{color:#596b7d}
.reader-footer{border-color:var(--voy-line)}.thumbnail-shell{background:#f5f0e8}.page-thumb{border-radius:3px}.reader-sidebar{top:24px;gap:12px}.side-card,.journey-card{border-radius:7px;box-shadow:0 12px 34px rgba(7,22,44,.06)}.side-card h2,.journey-card h2{font-family:"Cormorant Garamond",Georgia,serif;font-size:23px}.journey-card{background:linear-gradient(145deg,#07162c,#0a3766);border-color:rgba(198,165,106,.30)}
.section-heading{margin-bottom:18px;border-top:1px solid #d9d1c5;padding-top:24px}.section-heading h2{font-family:"Cormorant Garamond",Georgia,serif;font-size:36px}.wide-grid{grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}.issue,.travel-card{border-radius:5px;box-shadow:none}.issue-cover,.travel-img{height:185px}.issue strong,.travel-card strong{font-family:"Cormorant Garamond",Georgia,serif;font-size:19px}.pill{border-radius:3px;background:#edf7f7}
body.focus-reader .flip-stage{min-height:calc(100vh - 126px)}body.focus-reader #flipBook{height:calc(100vh - 145px)}
@media(max-width:1100px){.reader-layout{grid-template-columns:1fr}.reader-sidebar{display:grid;grid-template-columns:repeat(3,1fr);position:static}.wide-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:760px){.content-shell{padding:12px 10px 54px}.masthead{grid-template-columns:1fr;padding:28px 24px;min-height:auto}.masthead h1{font-size:54px}.masthead-logo{width:230px}.mag-toolbar{grid-template-columns:1fr 1fr}.mag-toolbar #query{grid-column:1/-1}.reader-head{grid-template-columns:1fr}.flip-stage{min-height:610px;padding:8px}#flipBook,.reader-fallback{height:590px}.reader-sidebar{grid-template-columns:1fr}.wide-grid{grid-template-columns:1fr 1fr}}
@media(max-width:480px){.masthead{padding:24px 18px}.masthead h1{font-size:46px}.mag-toolbar{grid-template-columns:1fr}.mag-toolbar #query{grid-column:auto}.flip-stage{min-height:520px}#flipBook,.reader-fallback{height:500px}.wide-grid{grid-template-columns:1fr}.reader-actions{grid-template-columns:repeat(3,1fr)}}

</style>

<style id="voy-structured-expanded-templates">
.voyp-partner-logos{height:46px;display:flex;align-items:center;justify-content:flex-start;gap:10px;margin-bottom:8px;overflow:hidden}
.voyp-partner-logos img{display:block;max-width:78%;max-height:100%;width:auto;height:auto;object-fit:contain;object-position:left center}
.voyp-partner-logos.dual img{max-width:44%;max-height:86%}
.voyp-partner-logo-fallback{min-height:40px;display:flex;align-items:center;color:var(--p-text);font-size:12px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}
.voyp-airline-directory-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;padding:2px 34px 44px}
.voyp-airline-directory-card{min-height:112px;border:1px solid rgba(16,49,84,.16);padding:10px;background:#fff;overflow:hidden}
.voyp-airline-directory-card h3{font-size:12px;margin:2px 0 4px;color:var(--p-text)}
.voyp-airline-directory-card p{font-size:8px;color:rgba(16,49,84,.68)}
.voyp-airline-profile-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px;padding:2px 34px 44px}
.voyp-airline-profile-card{display:flex;flex-direction:column;min-height:440px;border:1px solid rgba(16,49,84,.16);background:#fff;overflow:hidden}
.voyp-airline-profile-card>header{padding:13px;border-bottom:1px solid rgba(16,49,84,.14)}
.voyp-airline-profile-card>header h3{font-size:19px;color:var(--p-text)}
.voyp-airline-profile-card>header p{font-size:8px;color:rgba(16,49,84,.67)}
.voyp-airline-facts{display:grid;grid-template-columns:1fr 1fr}
.voyp-airline-facts>div{min-height:55px;padding:8px;border-right:1px solid rgba(16,49,84,.12);border-bottom:1px solid rgba(16,49,84,.12)}
.voyp-airline-facts>div:nth-child(2n){border-right:0}
.voyp-airline-facts b,.voyp-profile-tip b,.voyp-profile-booking b{display:block;margin-bottom:3px;color:var(--p-text);font-size:7px;text-transform:uppercase;letter-spacing:.08em}
.voyp-airline-facts span,.voyp-profile-tip span,.voyp-profile-booking span{font-size:7.5px;line-height:1.35;color:rgba(16,49,84,.67)}
.voyp-profile-tip{margin-top:auto;padding:9px 11px;background:var(--p-text)}
.voyp-profile-tip b{color:var(--p-accent)}.voyp-profile-tip span{color:#fff}
.voyp-profile-booking{padding:8px 11px;background:#f4f7fa}
.voyp-airport-grid{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:repeat(3,1fr);gap:8px;padding:2px 34px 44px}
.voyp-airport-card{display:grid;grid-template-columns:58px 1fr;gap:10px;min-height:122px;padding:9px;border:1px solid rgba(16,49,84,.16);background:#fff}
.voyp-airport-code{display:flex;flex-direction:column;align-items:center;justify-content:center;background:var(--p-text);color:#fff}
.voyp-airport-code strong{font-size:18px}.voyp-airport-code span{margin-top:4px;color:var(--p-accent);font-size:6px;text-transform:uppercase;text-align:center}
.voyp-airport-content .voyp-partner-logos{height:29px;margin:0 0 4px}.voyp-airport-content h3{font-size:11px;margin:2px 0}.voyp-airport-content>small{font-size:6.5px}
.voyp-airport-content dl{margin:6px 0 0;display:grid;gap:3px}.voyp-airport-content dl div{display:grid;grid-template-columns:43px 1fr;gap:4px}.voyp-airport-content dt{font-size:6px;font-weight:900;text-transform:uppercase;color:var(--p-text)}.voyp-airport-content dd{margin:0;font-size:6.5px;line-height:1.25;color:rgba(16,49,84,.67)}
.voyp-transfer-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px;padding:4px 34px}.voyp-transfer-grid article{display:grid;grid-template-columns:36px 1fr;gap:10px;min-height:105px;padding:12px;border:1px solid rgba(16,49,84,.16);background:#fff}.voyp-transfer-grid article>b{font-size:24px;color:var(--p-accent)}.voyp-transfer-grid h3{font-size:15px}.voyp-transfer-grid p{font-size:8px;color:rgba(16,49,84,.67)}
.voyp-destination-card{min-height:190px}.voyp-destination-facts{display:grid;grid-template-columns:1fr 1fr;gap:5px 8px;margin:8px 0 0}.voyp-destination-facts div{min-width:0}.voyp-destination-facts dt{color:var(--p-accent);font-size:6px;font-weight:900;text-transform:uppercase;letter-spacing:.08em}.voyp-destination-facts dd{margin:2px 0 0;color:rgba(16,49,84,.68);font-size:6.5px;line-height:1.3}
</style>
</head>

<body>
<div class="skandi-shell">
<div class="content-shell">

    <section class="voy-intro" aria-labelledby="voyPageTitle">
      <div class="voy-intro-copy">
        <div class="voy-eyebrow">VOY Magazine</div>
        <div class="voy-master-slogan" id="voyMasterSlogan"></div>
        <h1 id="voyPageTitle">Travel stories, guides and ideas.</h1>
        <p>Turn the pages of VOY for destination inspiration, selected hotels, local experiences and practical travel advice from SKANDI.</p>
      </div>
      <div class="voy-intro-actions" aria-label="Magazine actions">
        <button class="btn navy" id="openLatestBtn" type="button">Read latest issue</button>
        <button class="btn outline" id="scrollIssuesBtn" type="button">View all issues</button>
      </div>
    </section>

<div id="status" class="status show">Loading VOY magazine...</div>

    <section class="search-shell" aria-label="Search VOY magazine">
      <div class="search-topline"><span class="search-label">Search the magazine</span><span class="search-help">Find destinations, hotels, articles and words inside each issue</span></div>
      <div class="mag-toolbar">
        <input id="query" aria-label="Search VOY" placeholder="Search VOY...">
        <select id="category" aria-label="Category"><option value="">All categories</option></select>
        <select id="destination" aria-label="Destination"><option value="">All destinations</option></select>
        <select id="issueSelect" aria-label="Issue"><option value="">Select issue</option></select>
        <select id="sort" aria-label="Sort"><option value="latest">Latest first</option><option value="title">Title A–Z</option></select>
        <button class="btn navy" id="searchBtn" type="button">Search VOY</button>
      </div>
    </section>

    <section class="reader-layout">
      <main class="reader-panel">
        <div class="reader-head">
          <div class="reader-title-block">
            <div class="reader-mark" data-master-logo="[LEAVE_PLACEHOLDER]" aria-hidden="true">[LEAVE_PLACEHOLDER]</div>
            <div><strong id="issueTitle">VOY Atelier</strong><span id="issueMeta">Select an issue to begin reading.</span></div>
          </div>
          <div class="reader-actions" aria-label="Reader controls">
            <button class="btn light" id="prevBtn" type="button">Previous</button>
            <button class="btn light" id="nextBtn" type="button">Next</button>
            <button class="btn light" id="interactiveToggleBtn" type="button" aria-pressed="true">Links visible</button>
            <button class="btn light" id="focusModeBtn" type="button" aria-pressed="false">Focus mode</button>
            <button class="btn light" id="shareBtn" type="button">Share</button>
            <button class="btn navy" id="fullscreenBtn" type="button">Full screen</button>
          </div>
        </div>

        <div class="flip-stage">
          <div class="stage-watermark">VOY Magazine · SKANDI Travels</div>
          <div id="flipBook"></div>
          <iframe id="fallbackFrame" class="reader-fallback" title="VOY PDF fallback reader"></iframe>
          <div id="placeholder" class="reader-placeholder">
            <div class="placeholder-monogram">VOY</div>
            <strong>Choose an issue</strong>
            <p>The magazine opens here with cover-to-cover page turning. Drag a page corner, swipe, or use the reader controls.</p>
          </div>
          <div class="stage-hint">Drag, swipe or use the arrows</div>
        </div>

        <div class="reader-footer">
          <div class="page-nav">
            <div class="page-status-group">
              <span id="pageInfo" class="page-count">Page —</span>
              <span id="interactiveInfo" class="interactive-count">No interactive items</span>
            </div>
            <div class="page-scrubber"><input id="pageRange" type="range" min="1" max="1" value="1" aria-label="Magazine page"><span id="indexInfo">PDF index not loaded</span></div>
            <div class="page-jump"><input id="pageJumpInput" type="number" min="1" value="1" aria-label="Go to page"><button id="pageJumpBtn" type="button">Go</button></div>
          </div>
          <div class="thumbnail-shell"><div id="thumbnailRail" class="thumbnail-rail" aria-label="Page thumbnails"></div></div>
        </div>
      </main>

      <aside class="reader-sidebar">
        <section class="side-card">
          <div class="side-card-head"><div class="side-kicker">Reading now</div><h2>Inside this issue</h2></div>
          <div class="reading-now">
            <div id="activeIssueEdition" class="reading-edition">VOY Atelier</div>
            <strong id="activeIssueTitle">Select an issue</strong>
            <p id="activeIssueSummary">Destination stories, hotels and curated journeys will appear here.</p>
            <div id="activeIssueTags" class="reading-tags"></div>
            <div class="reading-actions">
              <button class="btn navy" id="saveIssueBtn" type="button">Save issue</button>
              <button class="btn light" id="openPdfBtn" type="button">Open PDF</button>
            </div>
          </div>
        </section>

        <section class="side-card">
          <div class="side-card-head"><div class="side-kicker">Search results</div><h2>Stories & pages</h2></div>
          <div id="searchResults" class="search-results"><div class="result"><strong>Search VOY</strong><span>Results from issues and PDF text will appear here.</span></div></div>
        </section>

        <section class="journey-card" id="adTop"><div class="side-kicker">Featured by SKANDI</div><h2>Turn inspiration into a journey</h2><span>Open destinations, hotels, activities and curated packages featured in VOY.</span><button class="btn teal" data-banner="/destinations" type="button">Explore destinations</button></section>
        <section class="journey-card" id="adSide"><div class="side-kicker">SKANDI Signature</div><h2>Travel, elevated</h2><span>Discover premium journeys created around memorable moments.</span><button class="btn gold" data-banner="/signature-collection" type="button">View Signature</button></section>
      </aside>
    </section>

    <div class="below-reader">
      <section id="issuesBlock">
        <div class="section-heading"><div><div class="eyebrow" style="color:var(--skandi-teal-deep);margin-bottom:7px">VOY archive</div><h2>Latest issues</h2></div><p>Choose an edition and continue reading in the page-turn reader.</p></div>
        <div id="issueList" class="wide-grid"></div>
      </section>

      <section style="margin-top:28px">
        <div class="section-heading"><div><div class="eyebrow" style="color:var(--skandi-teal-deep);margin-bottom:7px">From story to journey</div><h2>Travel with SKANDI</h2></div><p>Continue from editorial inspiration to planning and booking.</p></div>
        <div id="travelCards" class="wide-grid"></div>
      </section>
    </div>
  </div>
</div>

<div id="readerModal" class="reader-modal" role="dialog" aria-modal="true" aria-labelledby="readerModalTitle">
  <div class="reader-modal-card">
    <div class="reader-modal-head"><strong id="readerModalTitle">VOY interactive content</strong><button id="readerModalClose" class="reader-modal-close" type="button" aria-label="Close">×</button></div>
    <div id="readerModalBody" class="reader-modal-body"></div>
  </div>
</div>


<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/page-flip@2.0.7/dist/js/page-flip.browser.min.js"></script>
<script>
const SOURCE="SKANDI_VOY_MAGAZINE";
const PARENT="SKANDI_WIX_PARENT";
let MASTER_CONFIG_STATE=null;
function renderMasterBranding(payload){
  MASTER_CONFIG_STATE=payload||MASTER_CONFIG_STATE||{};
  const language=String(MASTER_CONFIG_STATE.settings?.language||"EN").toLowerCase();
  const slogans=MASTER_CONFIG_STATE.brand?.slogans?.voy||{};
  const target=document.getElementById("voyMasterSlogan");
  if(target)target.textContent=slogans[language]||slogans.en||"";
  document.documentElement.lang=({en:"en",sv:"sv",no:"no",da:"da",fi:"fi"})[language]||"en";
}
let state={issues:[],structuredPages:[],categories:[],banners:[],travelCards:[],globalInteractions:[],activeInteractions:[],activeIssue:null,pdf:null,pages:[],totalPages:0,textIndex:[],flip:null,currentPage:0,pageInteractionCounts:{},showInteractiveHints:true};

const $=id=>document.getElementById(id);
function post(type,payload={}){window.parent.postMessage({source:SOURCE,type,...payload},"*")}
function esc(v=""){return String(v??"").replace(/[&<>"']/g,s=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[s]))}
function status(msg,mode=""){const e=$("status");e.textContent=msg||"";e.className=msg?`status show ${mode}`:"status"}
function arr(v){return Array.isArray(v)?v:String(v||"").split(",").map(x=>x.trim()).filter(Boolean)}
function fmt(v){if(!v)return "";try{return new Date(v).toLocaleDateString(undefined,{month:"short",year:"numeric"})}catch(e){return String(v)}}
function imageStyle(url){return url?`background-image:url('${String(url).replaceAll("'","\\'")}')`:""}

function parseList(v){
  if(Array.isArray(v))return v;
  if(!v)return [];
  if(typeof v==="string"){
    try{const parsed=JSON.parse(v);return Array.isArray(parsed)?parsed:[]}catch(e){return []}
  }
  return [];
}
function clamp(v,min,max){return Math.min(max,Math.max(min,v))}
function pct(v,fallback=0){
  if(v===undefined||v===null||v==="")return fallback;
  const raw=String(v).trim();
  let n=Number(raw.replace("%",""));
  if(!Number.isFinite(n))return fallback;
  if(!raw.includes("%")&&Math.abs(n)<=1)n*=100;
  return clamp(n,0,100);
}
function issueKey(issue=state.activeIssue){return String(issue?.issueId||issue?._id||"")}
function normalizeInteraction(raw,index=0){
  const type=String(raw.type||raw.actionType||raw.kind||"link").toLowerCase().replace(/[ _]+/g,"-");
  return {
    ...raw,
    id:String(raw.id||raw.interactionId||raw._id||`interaction-${index+1}`),
    page:Number(raw.page||raw.pageNumber||raw.pdfPage||1),
    type,
    x:pct(raw.x??raw.left,0),
    y:pct(raw.y??raw.top,0),
    width:pct(raw.width??raw.w,12),
    height:pct(raw.height??raw.h,6),
    label:String(raw.label||raw.buttonLabel||raw.title||""),
    tooltip:String(raw.tooltip||raw.accessibilityLabel||raw.ariaLabel||raw.label||raw.title||"Open interactive content"),
    display:String(raw.display||raw.style||raw.appearance||(raw.label?"button":"region")).toLowerCase(),
    url:raw.url||raw.href||raw.externalUrl||raw.videoUrl||raw.downloadUrl||"",
    path:raw.path||raw.internalPath||raw.wixPath||"",
    targetPage:Number(raw.targetPage||raw.jumpToPage||raw.destinationPage||0),
    eventType:raw.eventType||raw.messageType||"VOY_INTERACTIVE_ACTION"
  };
}
function getIssueInteractions(issue){
  const own=[
    ...parseList(issue?.interactions),
    ...parseList(issue?.hotspots),
    ...parseList(issue?.interactiveElements),
    ...parseList(issue?.interactiveButtons)
  ];
  const key=issueKey(issue);
  const global=state.globalInteractions.filter(x=>!x.issueId&&!x.issue_id||String(x.issueId||x.issue_id)===key);
  const seen=new Set();
  return [...own,...global].map(normalizeInteraction).filter(i=>{
    const k=`${i.id}:${i.page}`;
    if(seen.has(k))return false;
    seen.add(k);return true;
  });
}
function interactionIcon(type){
  if(type.includes("video"))return "▶";
  if(type.includes("page")||type.includes("jump")||type==="pdf-destination")return "↪";
  if(type.includes("product")||type.includes("shop")||type.includes("booking")||type.includes("offer"))return "+";
  if(type.includes("email"))return "@";
  if(type.includes("phone"))return "☎";
  if(type.includes("download"))return "↓";
  if(type.includes("popup")||type.includes("info"))return "i";
  return "↗";
}
function safeOpenUrl(url,newTab=true){
  const value=String(url||"").trim();
  if(!value)return false;
  if(!/^(https?:|mailto:|tel:)/i.test(value))return false;
  if(newTab&&/^https?:/i.test(value))window.open(value,"_blank","noopener,noreferrer");
  else window.location.href=value;
  return true;
}
function videoEmbedUrl(url){
  const value=String(url||"").trim();
  let m=value.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{6,})/i);
  if(m)return `https://www.youtube-nocookie.com/embed/${m[1]}?rel=0`;
  m=value.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if(m)return `https://player.vimeo.com/video/${m[1]}`;
  if(/^https?:\/\//i.test(value))return value;
  return "";
}
function closeReaderModal(){
  $("readerModal").classList.remove("show");
  $("readerModalBody").replaceChildren();
}
function openReaderModal(interaction){
  const modal=$("readerModal"),body=$("readerModalBody"),title=$("readerModalTitle");
  title.textContent=interaction.title||interaction.label||"VOY interactive content";
  body.replaceChildren();
  const image=interaction.imageUrl||interaction.image;
  if(image&&/^https?:\/\//i.test(image)){
    const img=document.createElement("img");img.src=image;img.alt=interaction.imageAlt||interaction.title||"VOY interactive image";body.appendChild(img);
  }
  if(interaction.type.includes("video")){
    const src=videoEmbedUrl(interaction.videoUrl||interaction.url);
    if(src){const box=document.createElement("div");box.className="reader-video";const frame=document.createElement("iframe");frame.src=src;frame.title=interaction.title||"VOY video";frame.allow="autoplay; encrypted-media; picture-in-picture";frame.allowFullscreen=true;box.appendChild(frame);body.appendChild(box)}
  }
  const copy=interaction.body||interaction.description||interaction.summary;
  if(copy){const p=document.createElement("p");p.textContent=String(copy);body.appendChild(p)}
  const ctaUrl=interaction.ctaUrl||interaction.linkUrl;
  const ctaPath=interaction.ctaPath;
  if(ctaUrl||ctaPath){const b=document.createElement("button");b.type="button";b.className="btn navy";b.textContent=interaction.ctaLabel||"Continue";b.addEventListener("click",()=>{if(ctaPath)post("VOY_NAVIGATE",{path:ctaPath,issueId:issueKey(),page:interaction.page});else safeOpenUrl(ctaUrl,true)});body.appendChild(b)}
  modal.classList.add("show");
}
async function goToPdfDestination(dest){
  try{
    const resolved=typeof dest==="string"?await state.pdf.getDestination(dest):dest;
    if(!resolved||!resolved[0])return;
    const ref=resolved[0];
    const index=typeof ref==="number"?ref:await state.pdf.getPageIndex(ref);
    goToPage(index+1);
  }catch(e){status("That internal PDF destination could not be opened.","warn")}
}
function postInteraction(interaction){
  post("VOY_INTERACTION_CLICKED",{
    issueId:issueKey(),interactionId:interaction.id,page:interaction.page,type:interaction.type,label:interaction.label||interaction.title||""
  });
}
async function activateInteraction(interaction){
  postInteraction(interaction);
  const type=interaction.type;
  if(type==="pdf-destination"){await goToPdfDestination(interaction.dest);return}
  if(type==="pdf-action"){
    const map={NextPage:state.currentPage+2,PrevPage:Math.max(1,state.currentPage),FirstPage:1,LastPage:state.pdf?.numPages||1};
    if(map[interaction.namedAction])goToPage(map[interaction.namedAction]);return;
  }
  if(type.includes("page")||type.includes("jump")){goToPage(interaction.targetPage||interaction.page);return}
  if(type.includes("video")||type.includes("popup")||type.includes("info")){openReaderModal(interaction);return}
  if(type.includes("email")){safeOpenUrl(interaction.url||`mailto:${interaction.email||""}`,false);return}
  if(type.includes("phone")){safeOpenUrl(interaction.url||`tel:${interaction.phone||""}`,false);return}
  if(interaction.path){post("VOY_NAVIGATE",{path:interaction.path,issueId:issueKey(),page:interaction.page,interactionId:interaction.id});return}
  if(interaction.url&&safeOpenUrl(interaction.url,interaction.openInNewTab!==false))return;
  post(interaction.eventType||"VOY_INTERACTIVE_ACTION",{issueId:issueKey(),page:interaction.page,interaction});
}
function interactionForPage(pageNumber){return state.activeInteractions.filter(i=>Number(i.page)===Number(pageNumber)||i.allPages===true)}
function renderInteractionLayer(pageElement,pageNumber,interactions){
  const layer=document.createElement("div");layer.className="interactive-layer";layer.dataset.page=pageNumber;
  interactions.forEach((interaction,index)=>{
    const i=normalizeInteraction(interaction,index);
    const b=document.createElement("button");b.type="button";
    const appearance=i.display.includes("button")?"is-button":i.display.includes("invisible")?"is-invisible":"is-region";
    b.className=`mag-hotspot ${appearance}`;
    b.style.left=`${i.x}%`;b.style.top=`${i.y}%`;b.style.width=`${Math.max(i.width,.8)}%`;b.style.height=`${Math.max(i.height,.8)}%`;
    b.dataset.icon=interactionIcon(i.type);b.setAttribute("aria-label",i.tooltip);b.title=i.tooltip;
    if(appearance==="is-button")b.textContent=i.label||"Open";
    else{const tip=document.createElement("span");tip.className="hotspot-tooltip";tip.textContent=i.tooltip;b.appendChild(tip)}
    ["pointerdown","mousedown","touchstart"].forEach(evt=>b.addEventListener(evt,e=>e.stopPropagation(),{passive:true}));
    b.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();activateInteraction(i)});
    layer.appendChild(b);
  });
  pageElement.appendChild(layer);
}
async function pdfAnnotationInteractions(page,viewport,pageNumber){
  try{
    const annotations=await page.getAnnotations({intent:"display"});
    return annotations.filter(a=>a.subtype==="Link"&&a.rect).map((a,index)=>{
      const r=viewport.convertToViewportRectangle(a.rect);
      const left=Math.min(r[0],r[2]),top=Math.min(r[1],r[3]);
      return normalizeInteraction({
        id:`pdf-link-${pageNumber}-${index+1}`,page:pageNumber,
        type:a.url?"link":a.dest?"pdf-destination":a.action?"pdf-action":"link",
        url:a.url||"",dest:a.dest,namedAction:a.action,
        x:left/viewport.width,y:top/viewport.height,
        width:Math.abs(r[2]-r[0])/viewport.width,height:Math.abs(r[3]-r[1])/viewport.height,
        tooltip:a.title||a.contents||"Open link",display:"region",source:"pdf-annotation"
      },index);
    });
  }catch(e){return []}
}
function updateInteractiveInfo(){
  const page=(state.flip&&state.flip.getCurrentPageIndex?state.flip.getCurrentPageIndex():state.currentPage)+1;
  const count=state.pageInteractionCounts[page]||0;
  $("interactiveInfo").textContent=count?`${count} interactive feature${count===1?"":"s"}`:"No interactive features";
}

function renderBootstrap(payload){
  state.issues=payload.issues||[];
  state.structuredPages=payload.pages||payload.voyPages||[];
  state.categories=payload.categories||[];
  state.banners=payload.banners||[];
  state.travelCards=payload.travelCards||[];
  state.globalInteractions=parseList(payload.interactions||payload.hotspots||payload.interactiveElements);
  renderFilters();
  renderIssues();
  renderTravelCards();
  renderBanners();
  if($("issueCount"))$("issueCount").textContent=`${state.issues.length} issue${state.issues.length===1?"":"s"} in VOY`;
  status("");
  const requested=payload.requestedIssue||"";
  const latest=state.issues.find(i=>String(i.issueId||i._id)===String(requested)||String(i.slug||"")===String(requested))||state.issues.find(i=>i.featured)||state.issues[0];
  if(latest) selectIssue(latest.issueId||latest._id);
}
function renderFilters(){
  const cats=state.categories.length?state.categories:["Destinations","Hotels","Food & Culture","Family Travel","Signature Collection","City Breaks","Beach","Cruise","Travel Tips"];
  $("category").innerHTML=`<option value="">All categories</option>`+cats.map(c=>`<option>${esc(c.title||c)}</option>`).join("");
  const dests=[...new Set(state.issues.flatMap(i=>arr(i.destinations||i.destinationTags)))].filter(Boolean).sort();
  $("destination").innerHTML=`<option value="">All destinations</option>`+dests.map(d=>`<option>${esc(d)}</option>`).join("");
  $("issueSelect").innerHTML=`<option value="">Select issue</option>`+state.issues.map(i=>`<option value="${esc(i.issueId||i._id)}">${esc(i.title)}</option>`).join("");
}
function renderIssues(){
  $("issueList").innerHTML=state.issues.map(i=>`
    <button class="issue" data-issue="${esc(i.issueId||i._id)}">
      <div class="issue-cover" style="${esc(imageStyle(i.coverImageUrl||i.coverImage||i.imageUrl||i.image))}"></div>
      <div class="issue-body">
        <strong>${esc(i.title)}</strong>
        <span>${esc(i.subtitle||i.summary||"")}</span>
        <div class="pill-row">${arr(i.categories).slice(0,4).map(c=>`<span class="pill">${esc(c)}</span>`).join("")}</div>
      </div>
    </button>`).join("") || `<div class="issue"><div class="issue-body"><strong>No issues published yet</strong><span>Upload a PDF in VOY Control.</span></div></div>`;
  document.querySelectorAll("[data-issue]").forEach(b=>b.onclick=()=>selectIssue(b.dataset.issue));
}
function renderTravelCards(){
  $("travelCards").innerHTML=(state.travelCards||[]).map(c=>`
    <button class="travel-card" data-path="${esc(c.path||"")}">
      <div class="travel-img" style="${esc(imageStyle(c.imageUrl||c.image))}"></div>
      <div class="travel-body">
        <strong>${esc(c.title)}</strong>
        <span>${esc(c.summary||c.description||"")}</span>
        <div class="pill-row">${arr(c.tags).slice(0,3).map(t=>`<span class="pill">${esc(t)}</span>`).join("")}</div>
      </div>
    </button>`).join("") || fallbackTravelCards();
  document.querySelectorAll(".travel-card[data-path]").forEach(b=>b.onclick=()=>{if(b.dataset.path)post("VOY_NAVIGATE",{path:b.dataset.path})});
}
function fallbackTravelCards(){
  return [
    {title:"Signature Collection",summary:"Curated SKANDI journeys and premium escapes.",path:"/signature-collection"},
    {title:"Our destinations",summary:"Explore places featured in VOY Atelier.",path:"/destinations"},
    {title:"Hotels",summary:"Handpicked stays and destination hotels.",path:"/hotels"},
    {title:"Tours & Activities",summary:"Local experiences and excursions.",path:"/tours"}
  ].map(c=>`<button class="travel-card" data-path="${c.path}"><div class="travel-img"></div><div class="travel-body"><strong>${c.title}</strong><span>${c.summary}</span></div></button>`).join("");
}
function renderBanners(){
  const top=state.banners.find(b=>b.slot==="top")||state.banners[0];
  const side=state.banners.find(b=>b.slot==="side")||state.banners[1];
  if(top)$("adTop").innerHTML=`<div class="side-kicker">Featured by SKANDI</div><h2>${esc(top.title)}</h2><span>${esc(top.summary||top.description||"")}</span>${top.path?`<button class="btn teal" data-banner="${esc(top.path)}" type="button">Explore journey</button>`:""}`;
  if(side)$("adSide").innerHTML=`<div class="side-kicker">SKANDI recommendation</div><h2>${esc(side.title)}</h2><span>${esc(side.summary||side.description||"")}</span>${side.path?`<button class="btn gold" data-banner="${esc(side.path)}" type="button">View details</button>`:""}`;
  document.querySelectorAll("[data-banner]").forEach(b=>b.onclick=()=>post("VOY_NAVIGATE",{path:b.dataset.banner}));
}
async function selectIssue(issueId){
  const issue=state.issues.find(i=>String(i.issueId||i._id)===String(issueId));
  if(!issue)return;
  state.activeIssue=issue;
  state.activeInteractions=getIssueInteractions(issue);
  $("issueSelect").value=issue.issueId||issue._id;
  $("issueTitle").textContent=issue.title||"VOY Atelier";
  $("issueMeta").textContent=[issue.edition,fmt(issue.publishDate),arr(issue.categories).join(", ")].filter(Boolean).join(" · ");
  if($("activeIssueTitle"))$("activeIssueTitle").textContent=issue.title||"VOY Atelier";
  if($("activeIssueEdition"))$("activeIssueEdition").textContent=[issue.edition,fmt(issue.publishDate)].filter(Boolean).join(" · ")||"VOY Atelier";
  if($("activeIssueSummary"))$("activeIssueSummary").textContent=issue.summary||issue.subtitle||"Destination stories, hotels and curated journeys from SKANDI.";
  if($("activeIssueTags"))$("activeIssueTags").innerHTML=arr(issue.categories).slice(0,4).map(c=>`<span class="pill">${esc(c)}</span>`).join("");
  $("placeholder").style.display="none";
  status("Preparing the VOY page-turn reader...");
  post("VOY_ISSUE_OPENED",{issueId:issue.issueId||issue._id});
  const pages=state.structuredPages.filter(page=>String(page.issueId||page.issue_id||"")===String(issue.issueId||issue._id)).sort((a,b)=>Number(a.pageNo||a.page_no||0)-Number(b.pageNo||b.page_no||0));
  if(pages.length)await renderStructuredFlipPages(pages);
  else await loadPdf(issue.pdfUrl||issue.fileUrl||issue.latestFileUrl);
}
const structuredDefaults={
  contents:[{title:"Welcome aboard",meta:"03"},{title:"The blue issue",meta:"06"},{title:"Greece, four ways",meta:"07"},{title:"Worth the detour",meta:"09"},{title:"Travel well",meta:"10"},{title:"Airline & airport guide",meta:"11"}],
  offers:[{title:"Athens city break",subtitle:"3 nights · selected hotel",price:"From $899"},{title:"Santorini escape",subtitle:"5 nights · breakfast",price:"From $1,249"},{title:"Crete family week",subtitle:"7 nights · transfers",price:"From $1,499"},{title:"Rhodes adults escape",subtitle:"7 nights · selected resort",price:"From $1,329"}],
  destinations:[{title:"Athens",subtitle:"Culture and city energy"},{title:"Santorini",subtitle:"Clifftop views and slow evenings"},{title:"Crete",subtitle:"Beaches, villages and food"},{title:"Rhodes",subtitle:"History and clear water"}],
  experiences:[{title:"Cook with a local",subtitle:"A market-to-table afternoon"},{title:"Sail into sunset",subtitle:"Small-group Aegean cruise"},{title:"Walk ancient paths",subtitle:"History beyond the guidebook"}],
  tips:[{title:"Before you fly",body:"Check documents, baggage and transfer details."},{title:"Pack lighter",body:"Choose pieces that work from beach to dinner."},{title:"Arrive ready",body:"Save key numbers and the SKANDI support line."}],
  airlines:[{title:"SKANDI partner airline",subtitle:"New York · Copenhagen · Athens",meta:"Economy · Premium · Business"},{title:"Regional connection",subtitle:"Athens · Crete · Rhodes",meta:"Cabin baggage included"}],
  airports:[{title:"JFK · New York",subtitle:"Departure terminal and check-in details"},{title:"CPH · Copenhagen",subtitle:"Easy Nordic connection"},{title:"ATH · Athens",subtitle:"Gateway to the islands"}],
  signature:[{title:"The Aegean House",subtitle:"Santorini",meta:"SKANDI Signature Collection"},{title:"Cretan Coast Retreat",subtitle:"Crete",meta:"SKANDI Signature Collection"}]
};
function structuredBlocks(page,fallback){const blocks=parseList(page.blocks);return blocks.length?blocks:fallback}
function safeImageFit(value){return ["cover","contain","fill","scale-down","none"].includes(String(value||""))?String(value):"cover"}
function safeImagePosition(value){const raw=String(value||"center center").trim();return /^[a-z0-9.% -]{1,60}$/i.test(raw)?raw:"center center"}
function structuredImage(url,fit="cover",position="center center"){
  const value=String(url||"").trim().replace(/["'()\\]/g,"");
  return value?`style="background-image:url(${value});background-size:${safeImageFit(fit)};background-position:${safeImagePosition(position)}"`:""
}
function structuredVars(page,imageUrl=""){
  const hex=(value,fallback)=>/^#[0-9a-f]{6}$/i.test(String(value||""))?value:fallback;
  const allowed=["Montserrat","Inter","Playfair Display","Cormorant Garamond","Georgia","Arial"];
  const heading=allowed.includes(page.headingFont)?page.headingFont:"Montserrat";
  const body=allowed.includes(page.bodyFont)?page.bodyFont:"Inter";
  const bg=String(imageUrl||"").trim().replace(/["'()\\]/g,"");
  const fit=safeImageFit(page.imageFit);
  const pos=safeImagePosition(page.imagePosition);
  return `style="--p-bg:${hex(page.backgroundColor,"#ffffff")};--p-text:${hex(page.textColor,"#103154")};--p-accent:${hex(page.accentColor,"#4dcad6")};--p-heading:'${heading}';--p-body:'${body}';${bg?`background-image:url(${bg});background-size:${fit};background-position:${pos};`:""}"`;
}
function voyLogoMarkup(x){
  const logos=[x.logoUrl,x.secondaryLogoUrl].filter(Boolean);
  return logos.length?`<div class="voyp-partner-logos ${logos.length>1?"dual":""}">${logos.map((url,index)=>`<img src="${esc(url)}" alt="${esc(index===0?(x.title||"Partner logo"):"")}" loading="eager">`).join("")}</div>`:`<div class="voyp-partner-logo-fallback">${esc(x.code||x.title||"VOY")}</div>`;
}

function structuredPageHtml(page,issue){
  const tpl=page.template||"feature";const title=esc(page.title||"Untitled VOY Page");const kicker=esc(page.kicker||"VOY by SKANDI");const deck=esc(page.deck||"");const body=esc(page.body||"").replace(/\n/g,"<br>");const cta=esc(page.ctaLabel||"Explore more");const vars=structuredVars(page);const hero=structuredImage(page.imageUrl,page.imageFit,page.imagePosition);const second=structuredImage(page.secondaryImageUrl||page.imageUrl,page.imageFit,page.imagePosition);
  const credit=page.imageCredit?`<div class="voyp-credit">Image: ${esc(page.imageCredit)}</div>`:"";const footer=`<footer class="voyp-footer"><span>${esc(page.footerText||"VOY by SKANDI · skanditravels.com")}</span><b>${esc(page.pageNo||"")}</b></footer>`;
  const items=fallback=>structuredBlocks(page,fallback);
  const cards=(rows,cls="")=>rows.map(x=>`<article class="voyp-card ${cls}">${x.imageUrl?`<div class="voyp-card-img" ${structuredImage(x.imageUrl)}></div>`:""}<small>${esc(x.meta||x.kicker||"")}</small><h3>${esc(x.title||"Untitled")}</h3><p>${esc(x.subtitle||x.body||"")}</p>${x.price?`<b class="voyp-price">${esc(x.price)}</b>`:""}${x.cta?`<button class="voyp-cta" type="button" ${x.href?`data-structured-url="${esc(x.href)}"`:`data-structured-path="${esc(x.path||page.ctaPath||"")}"`}>${esc(x.cta)}</button>`:""}</article>`).join("");
  if(tpl==="cover")return `<section class="voyp voyp-cover" ${structuredVars(page,page.imageUrl)}><div class="voyp-cover-top"><b>VOY</b><span>BY SKANDI</span></div><div class="voyp-cover-copy"><small>${kicker}</small><h1>${title}</h1><p>${deck}</p><div class="voyp-cover-lines">${items(structuredDefaults.contents).slice(0,3).map(x=>`<span>${esc(x.title)}</span>`).join("")}</div><em>${esc(issue.edition||"Special Edition")}</em></div>${credit}</section>`;
  if(tpl==="contents")return `<section class="voyp voyp-paper" ${vars}><header class="voyp-heading"><small>${kicker}</small><h1>${title}</h1><p>${deck}</p></header><div class="voyp-contents">${items(structuredDefaults.contents).map((x,i)=>`<div><b>${esc(x.meta||String(i+1).padStart(2,"0"))}</b><span><strong>${esc(x.title)}</strong><em>${esc(x.subtitle||"")}</em></span></div>`).join("")}</div><aside class="voyp-note">${body}</aside>${footer}</section>`;
  if(tpl==="brand-feature")return `<section class="voyp voyp-split" ${vars}><div class="voyp-split-img" ${hero}></div><div class="voyp-split-copy"><small>${kicker}</small><h1>${title}</h1><p class="voyp-lead">${deck}</p><div class="voyp-columns">${body}</div><span class="voyp-rule"></span></div>${credit}${footer}</section>`;
  if(tpl==="offers")return `<section class="voyp voyp-paper" ${vars}><header class="voyp-heading"><small>${kicker}</small><h1>${title}</h1><p>${deck}</p></header><div class="voyp-card-grid voyp-offers">${cards(items(structuredDefaults.offers),"offer")}</div><p class="voyp-smallprint">${body}</p>${footer}</section>`;
  if(tpl==="section-opener")return `<section class="voyp voyp-opener" ${structuredVars(page,page.imageUrl)}><div><small>${kicker}</small><h1>${title}</h1><p>${deck}</p><span>${esc(page.destination||"Explore with SKANDI")}</span></div>${credit}</section>`;
  if(tpl==="feature")return `<section class="voyp voyp-feature" ${vars}><div class="voyp-feature-img" ${hero}></div><article><small>${kicker}</small><h1>${title}</h1><p class="voyp-lead">${deck}</p><div class="voyp-columns">${body}</div></article>${credit}${footer}</section>`;
  if(tpl==="destination-grid")return `<section class="voyp voyp-paper" ${vars}><header class="voyp-heading"><small>${kicker}</small><h1>${title}</h1><p>${deck}</p></header><div class="voyp-destination-grid">${items(structuredDefaults.destinations).map(x=>`<article class="voyp-card voyp-destination-card">${x.imageUrl?`<div class="voyp-card-img" ${structuredImage(x.imageUrl)}></div>`:""}<small>${esc(x.meta||"")}</small><h3>${esc(x.title||"Destination")}</h3><p>${esc(x.subtitle||"")}</p><dl class="voyp-destination-facts">${x.stay?`<div><dt>Stay</dt><dd>${esc(x.stay)}</dd></div>`:""}${x.do?`<div><dt>Do</dt><dd>${esc(x.do)}</dd></div>`:""}${x.eat?`<div><dt>Eat</dt><dd>${esc(x.eat)}</dd></div>`:""}${x.gettingThere?`<div><dt>Getting there</dt><dd>${esc(x.gettingThere)}</dd></div>`:""}</dl></article>`).join("")}</div>${footer}</section>`;
  if(tpl==="nightlife")return `<section class="voyp voyp-night" ${structuredVars(page,page.imageUrl)}><div class="voyp-night-card"><small>${kicker}</small><h1>${title}</h1><p>${deck}</p><div>${body}</div></div>${credit}${footer}</section>`;
  if(tpl==="experiences")return `<section class="voyp voyp-paper" ${vars}><header class="voyp-heading"><small>${kicker}</small><h1>${title}</h1><p>${deck}</p></header><div class="voyp-experience-grid">${cards(items(structuredDefaults.experiences))}</div><div class="voyp-wide-copy">${body}</div>${footer}</section>`;
  if(tpl==="travel-well")return `<section class="voyp voyp-tips" ${vars}><header class="voyp-heading"><small>${kicker}</small><h1>${title}</h1><p>${deck}</p></header><div class="voyp-tip-list">${items(structuredDefaults.tips).map((x,i)=>`<article><b>${String(i+1).padStart(2,"0")}</b><div><h3>${esc(x.title)}</h3><p>${esc(x.body||x.subtitle||"")}</p></div></article>`).join("")}</div><aside ${second}></aside>${footer}</section>`;
  if(tpl==="airline-guide")return `<section class="voyp voyp-paper" ${vars}><header class="voyp-heading"><small>${kicker}</small><h1>${title}</h1><p>${deck}</p></header><div class="voyp-airline-directory-grid">${items(structuredDefaults.airlines).map((x,i)=>`<article class="voyp-airline-directory-card">${voyLogoMarkup(x)}<div><small>${esc(x.meta||`PROFILE ${String(i+1).padStart(2,"0")}`)}</small><h3>${esc(x.title||"Airline")}</h3><p>${esc(x.subtitle||x.body||"")}</p></div></article>`).join("")}</div><div class="voyp-wide-copy">${body}</div>${footer}</section>`;
  if(tpl==="airline-profile")return `<section class="voyp voyp-paper" ${vars}><header class="voyp-heading"><small>${kicker}</small><h1>${title}</h1><p>${deck}</p></header><div class="voyp-airline-profile-grid">${items(structuredDefaults.airlines).map(x=>`<article class="voyp-airline-profile-card"><header>${voyLogoMarkup(x)}<small>${esc(x.subtitle||"Airline profile")}</small><h3>${esc(x.title||"Airline")}</h3><p>${esc(x.body||"")}</p></header><div class="voyp-airline-facts"><div><b>Cabins</b><span>${esc(x.meta||"Confirm for your route")}</span></div><div><b>Seat & comfort</b><span>${esc(x.seat||"Aircraft dependent")}</span></div><div><b>Baggage</b><span>${esc(x.baggage||"Fare dependent")}</span></div><div><b>Food & drink</b><span>${esc(x.food||"Route and cabin dependent")}</span></div><div><b>Wi-Fi & power</b><span>${esc(x.wifi||"Aircraft dependent")}</span></div><div><b>Airport benefits</b><span>${esc(x.airport||"Fare, cabin or status dependent")}</span></div><div><b>Loyalty</b><span>${esc(x.loyalty||"Check current program benefits")}</span></div></div><aside class="voyp-profile-tip"><b>VOY tip</b><span>${esc(x.tip||"")}</span></aside><aside class="voyp-profile-booking"><b>Know before you book</b><span>${esc(x.booking||"")}</span></aside></article>`).join("")}</div>${footer}</section>`;
  if(tpl==="onboard-guide")return `<section class="voyp voyp-onboard" ${vars}><div class="voyp-feature-img" ${hero}></div><article><small>${kicker}</small><h1>${title}</h1><p class="voyp-lead">${deck}</p><div class="voyp-service-grid">${cards(items(structuredDefaults.tips))}</div></article>${footer}</section>`;
  if(tpl==="airport-guide")return `<section class="voyp voyp-paper" ${vars}><header class="voyp-heading"><small>${kicker}</small><h1>${title}</h1><p>${deck}</p></header><div class="voyp-airport-grid">${items(structuredDefaults.airports).map(x=>`<article class="voyp-airport-card"><div class="voyp-airport-code"><strong>${esc(x.code||"")}</strong><span>${esc(x.meta||"Airport")}</span></div><div class="voyp-airport-content">${voyLogoMarkup(x)}<h3>${esc(x.title||"Airport")}</h3><small>${esc(x.location||x.subtitle||"")}</small><dl><div><dt>Role</dt><dd>${esc(x.role||x.body||"")}</dd></div><div><dt>Plan for</dt><dd>${esc(x.plan||"")}</dd></div><div><dt>VOY note</dt><dd>${esc(x.note||"")}</dd></div></dl></div></article>`).join("")}</div><div class="voyp-wide-copy">${body}</div>${footer}</section>`;
  if(tpl==="route-map")return `<section class="voyp voyp-map" ${vars}><header class="voyp-heading"><small>${kicker}</small><h1>${title}</h1><p>${deck}</p></header><div class="voyp-map-art"><span class="dot nyc">NYC</span><span class="dot cph">CPH</span><span class="dot ath">ATH</span><span class="dot isl">ISLANDS</span><i class="route r1"></i><i class="route r2"></i><i class="route r3"></i></div><div class="voyp-route-list">${items(structuredDefaults.airlines).map(x=>`<div><b>${esc(x.title)}</b><span>${esc(x.subtitle||x.body||"")}</span></div>`).join("")}</div>${footer}</section>`;
  if(tpl==="transfer-promise")return `<section class="voyp voyp-paper voyp-transfer" ${vars}><header class="voyp-heading"><small>${kicker}</small><h1>${title}</h1><p>${deck}</p></header><div class="voyp-transfer-grid">${items(structuredDefaults.tips).map((x,i)=>`<article><b>${String(i+1).padStart(2,"0")}</b><div><small>${esc(x.subtitle||x.meta||"SKANDI standard")}</small><h3>${esc(x.title||"Transfer standard")}</h3><p>${esc(x.body||"")}</p></div></article>`).join("")}</div><div class="voyp-wide-copy">${body}</div>${footer}</section>`;
  if(tpl==="signature-collection")return `<section class="voyp voyp-signature" ${vars}><div class="voyp-signature-hero" ${hero}><small>${kicker}</small><h1>${title}</h1><p>${deck}</p></div><div class="voyp-signature-cards">${cards(items(structuredDefaults.signature))}</div>${footer}</section>`;
  return `<section class="voyp voyp-back" ${structuredVars(page,page.imageUrl)}><div><small>${kicker}</small><h1>${title}</h1><p>${deck}</p><button class="voyp-back-cta" type="button" data-structured-path="${esc(page.ctaPath||"")}">${cta}</button><em>${esc(page.ctaPath||"skanditravels.com")}</em></div>${credit}</section>`;
}
async function renderStructuredFlipPages(rows){
  const container=$("flipBook"),thumbnails=$("thumbnailRail");
  if(state.flip&&state.flip.destroy){try{state.flip.destroy()}catch(e){}}
  state.flip=null;state.pdf=null;state.pages=[];state.totalPages=rows.length;state.textIndex=[];state.currentPage=0;state.pageInteractionCounts={};
  container.innerHTML="";container.classList.remove("structured-static");if(thumbnails)thumbnails.innerHTML="";container.style.display="block";$("fallbackFrame").style.display="none";$("openPdfBtn").style.display="none";
  rows.forEach((page,index)=>{
    const pageNumber=index+1;const div=document.createElement("div");div.className="page structured-page";if(index===0||index===rows.length-1)div.dataset.density="hard";div.dataset.pageNumber=pageNumber;div.innerHTML=structuredPageHtml(page,state.activeIssue||{});
    const interactions=interactionForPage(pageNumber);state.pageInteractionCounts[pageNumber]=interactions.length;renderInteractionLayer(div,pageNumber,interactions);container.appendChild(div);state.pages.push({pageNumber,interactionCount:interactions.length,pageId:page.pageId});
    state.textIndex.push({page:pageNumber,text:[page.kicker,page.title,page.deck,page.body,page.destination,JSON.stringify(page.blocks||[])].filter(Boolean).join(" ")});
    if(thumbnails){const thumb=document.createElement("button");thumb.type="button";thumb.className="page-thumb structured-page-thumb";thumb.dataset.page=pageNumber;thumb.innerHTML=`<div class="structured-thumb-view"><small>${esc(page.kicker||"VOY")}</small><strong>${esc(page.title||`Page ${pageNumber}`)}</strong></div><span>${pageNumber}</span>`;thumb.addEventListener("click",()=>goToPage(pageNumber));thumbnails.appendChild(thumb)}
    div.querySelectorAll("[data-structured-path]").forEach(button=>button.addEventListener("click",event=>{event.stopPropagation();const path=button.getAttribute("data-structured-path");if(path)post("VOY_NAVIGATE",{path,issueId:issueKey(),page:pageNumber})}));
    div.querySelectorAll("[data-structured-url]").forEach(button=>button.addEventListener("click",event=>{event.stopPropagation();safeOpenUrl(button.getAttribute("data-structured-url"),true)}));
  });
  $("indexInfo").textContent=`Search index ready · ${rows.length} structured pages`;if($("pageRange")){ $("pageRange").max=rows.length;$("pageRange").value=1 }if($("pageJumpInput")){ $("pageJumpInput").max=rows.length;$("pageJumpInput").value=1 }
  if(window.St&&window.St.PageFlip){state.flip=new St.PageFlip(container,{width:460,height:650,size:"stretch",minWidth:270,maxWidth:620,minHeight:382,maxHeight:900,drawShadow:true,flippingTime:980,usePortrait:true,startZIndex:1,autoSize:true,maxShadowOpacity:.48,showCover:true,mobileScrollSupport:false,swipeDistance:18,clickEventForward:true,useMouseEvents:true,disableFlipByClick:false});state.flip.loadFromHTML(container.querySelectorAll(":scope > .page"));state.flip.on("flip",e=>{state.currentPage=e.data;updatePageInfo();updateInteractiveInfo()});state.flip.on("changeOrientation",()=>{updatePageInfo();updateInteractiveInfo()});updatePageInfo();updateInteractiveInfo();status("")}else{container.classList.add("structured-static");status("Page flip library did not load. Showing the digital pages without animation.","warn")}
}
async function loadPdf(url){
  if(!url){status("This issue does not have a PDF URL yet.","warn");return;}
  try{
    if(window.pdfjsLib){pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";}
    state.pdf=await pdfjsLib.getDocument(url).promise;
    state.pages=[];state.totalPages=Math.min(state.pdf.numPages,120);state.textIndex=[];state.currentPage=0;state.pageInteractionCounts={};
    $("openPdfBtn").style.display="inline-flex";
    $("indexInfo").textContent=`Reading ${state.pdf.numPages} PDF pages...`;
    await renderFlipPages();
    extractTextIndex();
    status("");
  }catch(error){
    $("fallbackFrame").src=url;
    $("fallbackFrame").style.display="block";
    $("flipBook").style.display="none";
    status("Animated reader could not load this PDF. Showing the standard PDF reader instead. Check PDF URL/CORS settings for animated mode.","warn");
  }
}
async function renderFlipPages(){
  const container=$("flipBook");
  const thumbnails=$("thumbnailRail");
  container.innerHTML="";container.classList.remove("structured-static");
  if(thumbnails)thumbnails.innerHTML="";
  container.style.display="block";
  $("fallbackFrame").style.display="none";
  const maxPages=Math.min(state.pdf.numPages,120);
  let bookRatio=600/420;
  for(let p=1;p<=maxPages;p++){
    const page=await state.pdf.getPage(p);
    const viewport=page.getViewport({scale:1.55});
    if(p===1)bookRatio=viewport.height/viewport.width;
    const canvas=document.createElement("canvas");
    canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
    await page.render({canvasContext:canvas.getContext("2d",{alpha:false}),viewport,background:"#ffffff"}).promise;
    const div=document.createElement("div");
    div.className="page";if(p===1||p===maxPages)div.dataset.density="hard";div.dataset.pageNumber=p;
    const img=document.createElement("img");
    img.src=canvas.toDataURL("image/jpeg",0.92);
    img.alt=`VOY page ${p}`;
    div.appendChild(img);
    if(thumbnails){
      const thumb=document.createElement("button");thumb.type="button";thumb.className="page-thumb";thumb.dataset.page=p;thumb.setAttribute("aria-label",`Go to page ${p}`);
      const thumbImg=document.createElement("img");thumbImg.src=img.src;thumbImg.alt="";
      const thumbNo=document.createElement("span");thumbNo.textContent=p;
      thumb.append(thumbImg,thumbNo);thumb.addEventListener("click",()=>goToPage(p));thumbnails.appendChild(thumb);
    }
    const nativeLinks=await pdfAnnotationInteractions(page,viewport,p);
    const interactions=[...nativeLinks,...interactionForPage(p)];
    state.pageInteractionCounts[p]=interactions.length;
    renderInteractionLayer(div,p,interactions);
    container.appendChild(div);
    state.pages.push({pageNumber:p,interactionCount:interactions.length});
    if(p%4===0||p===maxPages)$("indexInfo").textContent=`Prepared ${p} / ${maxPages} pages`;
  }
  if($("pageRange")){ $("pageRange").max=maxPages; $("pageRange").value=1; }
  if($("pageJumpInput")){ $("pageJumpInput").max=maxPages; $("pageJumpInput").value=1; }
  if(state.flip&&state.flip.destroy){try{state.flip.destroy()}catch(e){}}
  if(window.St&&window.St.PageFlip){
    const baseWidth=460;
    const baseHeight=Math.round(baseWidth*bookRatio);
    state.flip=new St.PageFlip(container,{
      width:baseWidth,height:baseHeight,size:"stretch",
      minWidth:270,maxWidth:620,minHeight:380,maxHeight:900,
      drawShadow:true,flippingTime:980,usePortrait:true,startZIndex:1,
      autoSize:true,maxShadowOpacity:.58,showCover:true,mobileScrollSupport:false,
      swipeDistance:18,clickEventForward:true,useMouseEvents:true,disableFlipByClick:false
    });
    state.flip.loadFromHTML(container.querySelectorAll(":scope > .page"));
    state.flip.on("flip",e=>{state.currentPage=e.data;updatePageInfo();updateInteractiveInfo()});
    state.flip.on("changeOrientation",()=>{updatePageInfo();updateInteractiveInfo()});
    updatePageInfo();updateInteractiveInfo();
  }else{
    status("Page flip library did not load. Showing rendered pages without flip animation.","warn");
  }
}

async function extractTextIndex(){
  const issue=state.activeIssue||{};
  const cmsText=[issue.searchText,issue.summary,arr(issue.categories).join(" "),arr(issue.destinations||issue.destinationTags).join(" ")].filter(Boolean).join(" ");
  state.textIndex=[];
  for(let p=1;p<=state.pdf.numPages;p++){
    try{
      const page=await state.pdf.getPage(p);
      const tc=await page.getTextContent();
      const text=tc.items.map(x=>x.str).join(" ").replace(/\s+/g," ").trim();
      state.textIndex.push({page:p,text});
      if(p%5===0)$("indexInfo").textContent=`Indexed ${p} / ${state.pdf.numPages} pages`;
    }catch(e){state.textIndex.push({page:p,text:""})}
  }
  if(cmsText)state.textIndex.push({page:1,text:cmsText,cms:true});
  $("indexInfo").textContent=`Search index ready · ${state.textIndex.length} entries`;
}
function updatePageInfo(){
  const n=(state.flip&&state.flip.getCurrentPageIndex)?state.flip.getCurrentPageIndex()+1:state.currentPage+1;
  const total=state.totalPages|| (state.pdf?Math.min(state.pdf.numPages,120):"—");
  $("pageInfo").textContent=`Page ${n} / ${total}`;
  if($("pageRange")){ $("pageRange").max=total==="—"?1:total; $("pageRange").value=Math.min(n,Number($("pageRange").max)); }
  if($("pageJumpInput"))$("pageJumpInput").value=n;
  document.querySelectorAll(".page-thumb").forEach(t=>t.classList.toggle("active",Number(t.dataset.page)===n));
  const active=document.querySelector(`.page-thumb[data-page="${n}"]`);if(active)active.scrollIntoView({behavior:"smooth",block:"nearest",inline:"center"});
  updateInteractiveInfo();
}
function doSearch(){
  const q=$("query").value.trim().toLowerCase();
  const cat=$("category").value;
  const dest=$("destination").value;
  const results=[];
  for(const issue of state.issues){
    const meta=[issue.title,issue.subtitle,issue.summary,arr(issue.categories).join(" "),arr(issue.destinations||issue.destinationTags).join(" "),issue.searchText].join(" ").toLowerCase();
    if(cat && !arr(issue.categories).includes(cat))continue;
    if(dest && !arr(issue.destinations||issue.destinationTags).includes(dest))continue;
    if(!q || meta.includes(q))results.push({type:"issue",issueId:issue.issueId||issue._id,title:issue.title,summary:issue.summary||issue.subtitle||"Open issue"});
  }
  if(q && state.textIndex.length){
    state.textIndex.forEach(hit=>{
      const idx=hit.text.toLowerCase().indexOf(q);
      if(idx>=0){
        results.push({type:"page",issueId:state.activeIssue?.issueId||state.activeIssue?._id,title:`Page ${hit.page}`,summary:hit.text.slice(Math.max(0,idx-60),idx+140),page:hit.page});
      }
    });
  }
  renderSearchResults(results.slice(0,30));
}
function renderSearchResults(results){
  $("searchResults").innerHTML=results.length?results.map(r=>`
    <button class="result" data-type="${esc(r.type)}" data-issue="${esc(r.issueId||"")}" data-page="${esc(r.page||"")}">
      <strong>${esc(r.title)}</strong><span>${esc(r.summary||"")}</span>
    </button>`).join(""):`<div class="result"><strong>No matches yet</strong><span>Try a destination, hotel, topic or phrase from the PDF.</span></div>`;
  document.querySelectorAll(".result").forEach(b=>b.onclick=async()=>{
    if(b.dataset.issue && (!state.activeIssue || String(state.activeIssue.issueId||state.activeIssue._id)!==String(b.dataset.issue)))await selectIssue(b.dataset.issue);
    if(b.dataset.page)goToPage(Number(b.dataset.page));
  });
}
function goToPage(page){
  if(!page)return;
  const index=Math.max(0,page-1);
  if(state.flip && state.flip.turnToPage)state.flip.turnToPage(index);
  state.currentPage=index;updatePageInfo();
}
$("searchBtn").onclick=doSearch;
$("query").addEventListener("keydown",e=>{if(e.key==="Enter")doSearch()});
["category","destination","sort"].forEach(id=>$(id).onchange=doSearch);
$("issueSelect").onchange=e=>selectIssue(e.target.value);
$("openLatestBtn").onclick=()=>{const latest=state.issues.find(i=>i.featured)||state.issues[0];if(latest)selectIssue(latest.issueId||latest._id)};
$("scrollIssuesBtn").onclick=()=>$("issuesBlock").scrollIntoView({behavior:"smooth"});
$("prevBtn").onclick=()=>state.flip&&state.flip.flipPrev?state.flip.flipPrev():goToPage(Math.max(1,state.currentPage));
$("nextBtn").onclick=()=>state.flip&&state.flip.flipNext?state.flip.flipNext():goToPage(state.currentPage+2);
$("interactiveToggleBtn").onclick=()=>{
  state.showInteractiveHints=!state.showInteractiveHints;
  document.body.classList.toggle("hide-interactive-hints",!state.showInteractiveHints);
  $("interactiveToggleBtn").textContent=state.showInteractiveHints?"Links visible":"Links hidden";
  $("interactiveToggleBtn").setAttribute("aria-pressed",String(state.showInteractiveHints));
};
$("fullscreenBtn").onclick=async()=>{
  const stage=document.querySelector(".flip-stage");
  try{
    if(!document.fullscreenElement&&stage.requestFullscreen)await stage.requestFullscreen();
    else if(document.fullscreenElement&&document.exitFullscreen)await document.exitFullscreen();
    else post("VOY_REQUEST_FULLSCREEN",{issueId:issueKey()});
  }catch(e){post("VOY_REQUEST_FULLSCREEN",{issueId:issueKey()})}
};
$("pageRange").addEventListener("input",e=>goToPage(Number(e.target.value)));
$("pageJumpBtn").onclick=()=>goToPage(Number($("pageJumpInput").value));
$("pageJumpInput").addEventListener("keydown",e=>{if(e.key==="Enter")goToPage(Number(e.target.value))});
$("focusModeBtn").onclick=()=>{
  const active=document.body.classList.toggle("focus-reader");
  $("focusModeBtn").textContent=active?"Exit focus":"Focus mode";
  $("focusModeBtn").setAttribute("aria-pressed",String(active));
  setTimeout(()=>state.flip&&state.flip.update?state.flip.update():null,120);
};
$("shareBtn").onclick=async()=>{
  const issue=state.activeIssue||{};
  const shareData={title:issue.title||"VOY by SKANDI",text:issue.summary||"Read VOY, the travel magazine from SKANDI.",url:issue.shareUrl||issue.publicUrl||window.location.href};
  post("VOY_SHARE_ISSUE",{issueId:issueKey(),shareData});
  try{if(navigator.share)await navigator.share(shareData);else status("Share request sent to SKANDI.","ok")}catch(e){}
};
$("saveIssueBtn").onclick=()=>{post("VOY_SAVE_ISSUE",{issueId:issueKey(),issue:state.activeIssue});status("Saving this issue to your SKANDI profile...")};
$("openPdfBtn").onclick=()=>{const u=state.activeIssue?.pdfUrl||state.activeIssue?.fileUrl||state.activeIssue?.latestFileUrl;if(u)window.open(u,"_blank","noopener,noreferrer")};
const navMap={destinationsBtn:"/destinations",signatureBtn:"/signature-collection",myTripBtn:"/my-trip",planTripBtn:"/plan-your-trip",mastheadPlanBtn:"/destinations"};
Object.entries(navMap).forEach(([id,path])=>$(id)?.addEventListener("click",()=>post("VOY_NAVIGATE",{path})));
$("readerModalClose").onclick=closeReaderModal;
$("readerModal").addEventListener("click",e=>{if(e.target===$("readerModal"))closeReaderModal()});
document.addEventListener("keydown",e=>{
  if(e.key==="Escape"&&$("readerModal").classList.contains("show")){closeReaderModal();return}
  if(e.target&&/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;
  if(e.key==="ArrowLeft"||e.key==="PageUp")$("prevBtn").click();
  if(e.key==="ArrowRight"||e.key==="PageDown"||e.key===" "){e.preventDefault();$("nextBtn").click()}
  if(e.key==="Home")goToPage(1);
  if(e.key==="End"&&state.totalPages)goToPage(state.totalPages);
});
document.addEventListener("fullscreenchange",()=>{$("fullscreenBtn").textContent=document.fullscreenElement?"Exit full screen":"Full screen"});
window.addEventListener("message",e=>{
  const m=e.data||{};if(m.source!==PARENT)return;
  if(m.type==="SKANDI_MASTER_CONFIG"){renderMasterBranding(m.payload||{});return}
  if(m.type==="VOY_BOOTSTRAP_RESULT")renderBootstrap(m.payload||{});
  if(m.type==="VOY_INTERACTIONS_UPDATE"){state.globalInteractions=parseList(m.payload?.interactions||m.interactions);if(state.activeIssue){state.activeInteractions=getIssueInteractions(state.activeIssue);selectIssue(issueKey())}}
  if(m.type==="VOY_GO_TO_PAGE")goToPage(Number(m.page||m.payload?.page));
  if(m.type==="VOY_ISSUE_SAVED")status("Issue saved to your SKANDI profile.","ok");
  if(m.type==="VOY_ERROR")status(m.message||m.payload?.message||"VOY magazine error.","error");
});
post("MASTER_CONFIG_REQUEST",{context:"voy"});
post("VOY_READY");
</script>

<script>
/* SKANDI V12 Presentation Runtime — Magazine Manager controlled presentation only. */
(function(){
  "use strict";
  const PARENT="SKANDI_WIX_PARENT";
  function safeUrl(v){try{const u=new URL(String(v||""),location.href);return u.protocol==="https:"?u.href:""}catch(_){return""}}
  function apply(payload){
    const blocks=Array.isArray(payload?.contentBlocks)?payload.contentBlocks:[];
    const media=Array.isArray(payload?.mediaSlots)?payload.mediaSlots:[];
    blocks.forEach(item=>{const id=String(item.contentId||"");if(!id)return;document.querySelectorAll(`[data-content-id="${CSS.escape(id)}"]`).forEach(el=>{if(item.value!==undefined)el.textContent=String(item.value??"")})});
    media.forEach(item=>{const slot=String(item.slotId||"");if(!slot||String(item.ownership||"").toUpperCase()==="INVENTORY")return;const url=safeUrl(item.assetUrl||item.imageUrl);if(!url)return;document.querySelectorAll(`[data-media-slot="${CSS.escape(slot)}"]`).forEach(el=>{if(el.tagName==="IMG"){el.src=url;if(item.alt)el.alt=String(item.alt)}else{el.style.backgroundImage=`url("${url.replace(/"/g,"%22")}")`}})});
  }
  window.addEventListener("message",e=>{const m=e.data||{};if(m.source===PARENT&&m.type==="SKANDI_PRESENTATION_DATA")apply(m.payload||{})});
  window.parent.postMessage({source:"SKANDI_PRESENTATION_RUNTIME",type:"SKANDI_PRESENTATION_READY",payload:{path:location.pathname}},"*");
})();
</script>

</body>
</html>
```
