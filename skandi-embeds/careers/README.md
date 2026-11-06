# Careers — INFO / LOG

- Route: `/about/careers`; component: `#careersEmbed`.
- 2026-11-05 — Imported the user-supplied careers application, preserving the applicant portal, upload, documents and bridge. Refined typography and phone layout for readability. The applicant email field was renamed to avoid collision with the global header. Backend and Wix runtime require verification.

## COMPLETE INTENDED HTML

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="color-scheme" content="light">
<meta name="theme-color" content="#03111f">
<title>Careers at SKANDI · B-011.1</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Montserrat:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
:root{
  --navy:#022e64;--navy2:#0b3a7a;--blue:#285ca8;--aqua:#5FC7CF;--aqua-soft:#d9f1f1;
  --light:#d7e6ff;--pale:#f6faff;--ink:#03111f;--ink2:#061a30;--text:#111827;--body:#526274;
  --muted:#667085;--line:#dbe3ef;--soft:#eef2f7;--ivory:#fbfaf6;--champagne:#d1bc98;
  --ok:#087443;--bad:#9e3b31;--warn:#9a6700;--shadow:0 18px 48px rgba(2,46,100,.09);
  --dark-shadow:0 32px 86px rgba(0,0,0,.28);--max:1240px;--ease:cubic-bezier(.16,1,.3,1)
}
*{box-sizing:border-box}
html{scroll-behavior:smooth;background:#fff}
html,body{width:100%;min-height:100%;margin:0;background:#fff;color:var(--text);font-family:Inter,system-ui,sans-serif;-webkit-font-smoothing:antialiased}
body{overflow-x:hidden}button,input,select,textarea{font:inherit}button{cursor:pointer}button:disabled{cursor:not-allowed;opacity:.5}
a{color:inherit}.hidden{display:none!important}.wrap{width:min(var(--max),calc(100% - 52px));margin-inline:auto}
:focus-visible{outline:3px solid rgba(95,199,207,.5);outline-offset:3px}
.eyebrow{display:flex;align-items:center;gap:10px;color:var(--aqua);font:800 9px/1.2 Montserrat,sans-serif;letter-spacing:.18em;text-transform:uppercase}
.eyebrow:before{content:"";width:30px;height:1px;background:currentColor}.eyebrow.dark{color:var(--blue)}.eyebrow.gold{color:var(--champagne)}
.btn{min-height:44px;padding:0 17px;display:inline-flex;align-items:center;justify-content:center;gap:8px;border:1px solid var(--navy);border-radius:999px;background:var(--navy);color:#fff;font:800 9px/1 Montserrat,sans-serif;letter-spacing:.08em;text-transform:uppercase;transition:.18s}
.btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 12px 28px rgba(2,46,100,.16)}.btn.secondary{background:#fff;color:var(--navy);border-color:var(--line)}.btn.secondary:hover{border-color:var(--aqua)}.btn.aqua{background:var(--aqua);border-color:var(--aqua);color:var(--ink)}.btn.light{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.22);backdrop-filter:blur(10px)}.btn.light:hover{background:#fff;color:var(--navy)}.btn.small{min-height:34px;padding:0 12px;font-size:7.5px}
.card{border:1px solid var(--line);border-radius:18px;background:#fff;box-shadow:0 10px 32px rgba(2,46,100,.055)}.card-head{padding:18px 20px 14px;border-bottom:1px solid var(--soft)}.card-head h3{margin:0;color:var(--navy);font:700 17px/1.2 Montserrat,sans-serif;letter-spacing:-.025em}.card-head p{margin:6px 0 0;color:var(--muted);font-size:8.5px;line-height:1.55}.card-body{padding:20px}
.field{display:grid;gap:6px;min-width:0}.field label,.field-label{color:var(--muted);font-size:7px;font-weight:800;letter-spacing:.11em;text-transform:uppercase}
.input,select,textarea{width:100%;min-height:44px;border:1px solid #d7dee8;border-radius:10px;background:#fff;padding:0 11px;color:var(--text);font-size:10px;outline:0}
textarea.input{min-height:100px;padding:11px;resize:vertical}.input:focus,select:focus,textarea:focus{border-color:var(--aqua);box-shadow:0 0 0 3px rgba(95,199,207,.13)}
.grid2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.grid3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.meta{color:var(--muted);font-size:8.5px;line-height:1.55}
.status{margin-top:12px;padding:11px 12px;border:1px solid var(--line);border-radius:10px;background:var(--pale);color:var(--body);font-size:9px;line-height:1.55}.status.ok{background:#eef9f3;border-color:#bee5cf;color:var(--ok)}.status.error{background:#fff4f2;border-color:#f1c2ba;color:var(--bad)}.status.warning{background:#fff9e8;border-color:#ead8a2;color:var(--warn)}

/* Premium careers hero */
.hero{position:relative;isolation:isolate;overflow:hidden;min-height:650px;color:#fff;background:radial-gradient(circle at 75% 12%,rgba(95,199,207,.14),transparent 25%),radial-gradient(circle at 12% 90%,rgba(209,188,152,.08),transparent 31%),linear-gradient(145deg,#03111f 0%,#061a30 47%,#022e64 100%)}
.hero:before{content:"";position:absolute;inset:0;z-index:-2;opacity:.15;background-image:linear-gradient(rgba(255,255,255,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.06) 1px,transparent 1px);background-size:76px 76px;mask-image:linear-gradient(90deg,#000,rgba(0,0,0,.5),transparent 86%)}
.hero:after{content:"";position:absolute;z-index:-1;right:-130px;bottom:-160px;width:610px;height:610px;border:1px solid rgba(255,255,255,.07);border-radius:50%;box-shadow:0 0 0 55px rgba(255,255,255,.014),0 0 0 110px rgba(255,255,255,.01)}
.hero-inner{min-height:650px;display:grid;grid-template-columns:minmax(0,1.08fr) minmax(360px,.65fr);gap:65px;align-items:center;padding:75px 0 108px}
.hero-copy h1{max-width:780px;margin:16px 0 19px;font:600 clamp(50px,6.5vw,84px)/.94 Montserrat,sans-serif;letter-spacing:-.055em}.hero-copy h1 strong{font-weight:800}.hero-copy p{max-width:700px;margin:0;color:rgba(255,255,255,.70);font-size:14px;line-height:1.76}
.hero-actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:27px}.hero-notes{display:flex;flex-wrap:wrap;gap:16px 24px;margin-top:26px;padding-top:18px;border-top:1px solid rgba(255,255,255,.11)}.hero-note{max-width:200px;color:rgba(255,255,255,.52);font-size:8.5px;line-height:1.5}.hero-note strong{display:block;margin-bottom:3px;color:rgba(255,255,255,.84);font-size:8px;letter-spacing:.09em;text-transform:uppercase}
.career-pass{position:relative;min-height:360px;overflow:hidden;padding:29px;border:1px solid rgba(209,188,152,.24);border-radius:24px;background:radial-gradient(circle at 85% 10%,rgba(95,199,207,.12),transparent 28%),linear-gradient(150deg,rgba(11,46,77,.98),rgba(5,25,44,.98) 63%,rgba(3,17,31,.98));box-shadow:var(--dark-shadow)}
.career-pass:before{content:"";position:absolute;inset:18px;border:1px solid rgba(255,255,255,.055);border-radius:16px}.career-pass:after{content:"CAREERS";position:absolute;right:-8px;bottom:-13px;color:rgba(255,255,255,.028);font:700 66px/1 Montserrat,sans-serif;letter-spacing:-.055em}.pass-top,.pass-copy,.pass-stats{position:relative;z-index:1}.pass-top{display:flex;align-items:center;justify-content:space-between;gap:15px}.pass-brand{font:800 11px/1 Montserrat,sans-serif;letter-spacing:.17em}.pass-status{padding-left:12px;border-left:1px solid rgba(209,188,152,.45);color:var(--aqua);font-size:8px;font-weight:800;letter-spacing:.11em;text-transform:uppercase}
.pass-copy{margin-top:80px}.pass-copy strong{display:block;max-width:380px;font:600 29px/1.05 Montserrat,sans-serif;letter-spacing:-.04em}.pass-copy span{display:block;max-width:380px;margin-top:9px;color:rgba(255,255,255,.52);font-size:10px;line-height:1.6}
.pass-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:13px;margin-top:28px;padding-top:18px;border-top:1px solid rgba(255,255,255,.10)}.pass-stat strong{display:block;font:600 25px/1 Montserrat,sans-serif;letter-spacing:-.04em}.pass-stat span{display:block;margin-top:5px;color:rgba(255,255,255,.43);font-size:7px;font-weight:800;letter-spacing:.1em;text-transform:uppercase}

/* One hub switcher */
.switcher-shell{position:relative;z-index:10;margin-top:-38px}.hub-switcher{display:grid;grid-template-columns:repeat(3,1fr);overflow:hidden;border:1px solid var(--line);border-radius:18px;background:#fff;box-shadow:var(--shadow)}
.hub-switch{min-height:74px;display:flex;align-items:center;justify-content:center;gap:10px;border:0;background:#fff;color:var(--muted);font-size:9px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.hub-switch+.hub-switch{border-left:1px solid var(--line)}.hub-switch span{width:24px;height:24px;display:grid;place-items:center;border-radius:50%;background:var(--pale);color:var(--navy);font-size:8px}.hub-switch.active{background:var(--pale);color:var(--navy)}.hub-switch.active span{background:var(--navy);color:#fff}

.page-main{padding:52px 0 92px;background:#fff}.hub-view{display:none}.hub-view.active{display:block}.section{margin-top:68px}.section:first-child{margin-top:0}.section-head{display:grid;grid-template-columns:minmax(0,1fr) minmax(300px,480px);gap:40px;align-items:end;margin-bottom:24px;padding-bottom:20px;border-bottom:1px solid var(--line)}.section-head h2{margin:7px 0 0;color:var(--navy);font:600 clamp(32px,4.5vw,52px)/.98 Montserrat,sans-serif;letter-spacing:-.05em}.section-head p{margin:0;color:var(--body);font-size:10.5px;line-height:1.72}

/* Opportunities */
.jobs-shell{display:grid;grid-template-columns:minmax(0,1fr) 310px;gap:22px;align-items:start}.job-search{padding:22px;border:1px solid var(--line);border-radius:18px;background:linear-gradient(145deg,#fff,var(--pale))}.job-search-top{display:grid;grid-template-columns:1.4fr .8fr;gap:10px}.job-filter-row{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:10px}.job-search-foot{display:flex;justify-content:space-between;gap:14px;align-items:center;margin-top:13px}.job-list{display:grid;gap:10px;margin-top:15px}
.job{width:100%;display:grid;grid-template-columns:minmax(0,1fr) 155px 34px;gap:16px;align-items:center;padding:17px;border:1px solid var(--line);border-radius:15px;background:#fff;color:inherit;text-align:left;transition:.18s}.job:hover{transform:translateY(-2px);border-color:rgba(95,199,207,.60);box-shadow:var(--shadow)}.job h3{margin:0;color:var(--navy);font:700 16px/1.2 Montserrat,sans-serif;letter-spacing:-.025em}.job-meta{display:block;margin-top:4px;color:var(--muted);font-size:8.5px;line-height:1.5}.pill-row{display:flex;flex-wrap:wrap;gap:5px;margin-top:9px}.pill{display:inline-flex;align-items:center;min-height:25px;padding:0 8px;border-radius:999px;background:var(--pale);color:var(--navy);font-size:7px;font-weight:800}.job-side{color:var(--body);font-size:8px;line-height:1.55}.job-arrow{width:31px;height:31px;display:grid;place-items:center;border-radius:50%;background:var(--pale);color:var(--navy);font-size:14px}.job:hover .job-arrow{background:var(--navy);color:#fff}
.jobs-aside{display:grid;gap:12px}.aside-card{padding:20px;border:1px solid var(--line);border-radius:17px;background:#fff}.aside-card.dark{border-color:rgba(255,255,255,.08);background:radial-gradient(circle at 90% 10%,rgba(95,199,207,.11),transparent 28%),linear-gradient(145deg,#061a30,#03111f);color:#fff;box-shadow:var(--dark-shadow)}.aside-card .label{color:var(--blue);font-size:7px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}.aside-card.dark .label{color:var(--aqua)}.aside-card h3{margin:8px 0 7px;color:var(--navy);font:700 18px/1.14 Montserrat,sans-serif}.aside-card.dark h3{color:#fff}.aside-card p{margin:0;color:var(--muted);font-size:9px;line-height:1.65}.aside-card.dark p{color:rgba(255,255,255,.57)}.aside-card .btn{margin-top:14px}
.culture-grid{display:grid;grid-template-columns:1.2fr .8fr .8fr;gap:12px}.culture-panel{min-height:250px;padding:25px;border:1px solid #e6e0d7;border-radius:18px;background:var(--ivory)}.culture-panel:first-child{background:radial-gradient(circle at 85% 10%,rgba(95,199,207,.12),transparent 27%),linear-gradient(145deg,#03111f,#061a30 62%,#022e64);color:#fff;border-color:rgba(255,255,255,.08)}.culture-panel h3{margin:10px 0 8px;color:var(--navy);font:700 23px/1.05 Montserrat,sans-serif;letter-spacing:-.035em}.culture-panel:first-child h3{color:#fff;font-size:30px}.culture-panel p{margin:0;color:var(--muted);font-size:9px;line-height:1.7}.culture-panel:first-child p{color:rgba(255,255,255,.58)}

/* Portal */
.portal-login{display:grid;grid-template-columns:minmax(0,1fr) 360px;gap:22px;align-items:stretch}.portal-intro{min-height:370px;padding:34px;border-radius:22px;color:#fff;background:radial-gradient(circle at 85% 15%,rgba(95,199,207,.14),transparent 29%),linear-gradient(145deg,#03111f,#061a30 58%,#022e64);box-shadow:var(--dark-shadow)}.portal-intro h2{margin:12px 0;font:600 39px/1 Montserrat,sans-serif;letter-spacing:-.045em}.portal-intro p{max-width:560px;margin:0;color:rgba(255,255,255,.62);font-size:10px;line-height:1.7}.portal-points{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:48px}.portal-point{padding-top:13px;border-top:1px solid rgba(255,255,255,.12)}.portal-point strong{display:block;color:#fff;font-size:9px}.portal-point span{display:block;margin-top:4px;color:rgba(255,255,255,.45);font-size:7.5px;line-height:1.5}.login-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:15px}
.portal-header{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;padding-bottom:20px;border-bottom:1px solid var(--line)}.portal-header h2{margin:7px 0 0;color:var(--navy);font:600 36px/1 Montserrat,sans-serif;letter-spacing:-.045em}.portal-tabs{display:flex;gap:7px;flex-wrap:wrap;margin:18px 0}.portal-tab{min-height:38px;padding:0 13px;border:1px solid var(--line);border-radius:999px;background:#fff;color:var(--navy);font-size:8px;font-weight:800}.portal-tab.active{background:var(--navy);border-color:var(--navy);color:#fff}.portal-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.portal-item{padding:17px;border:1px solid var(--line);border-radius:15px;background:#fff}.portal-item h3{margin:0;color:var(--navy);font-size:14px;line-height:1.2}.portal-item .meta{margin-top:6px}.portal-item .pill{margin-top:10px}.message-item{padding:16px 0;border-bottom:1px solid var(--soft)}.message-item:last-child{border-bottom:0}.message-item strong{display:block;color:var(--navy);font-size:11px}.message-item p{margin:6px 0 0;color:var(--body);font-size:9px;line-height:1.65}.profile-list{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.profile-cell{padding:15px;border:1px solid var(--line);border-radius:13px;background:var(--pale)}.profile-cell span{display:block;color:var(--muted);font-size:7px;text-transform:uppercase;letter-spacing:.1em;font-weight:800}.profile-cell strong{display:block;margin-top:5px;color:var(--navy);font-size:10px}

/* Documents */
.documents-entry{display:grid;grid-template-columns:minmax(0,1fr) 350px;gap:22px;align-items:start}.document-note{padding:24px;border-radius:18px;background:radial-gradient(circle at 90% 10%,rgba(95,199,207,.11),transparent 30%),linear-gradient(145deg,#061a30,#03111f);color:#fff}.document-note h3{margin:9px 0 8px;font:700 24px/1.05 Montserrat,sans-serif;letter-spacing:-.035em}.document-note p{margin:0;color:rgba(255,255,255,.58);font-size:9px;line-height:1.7}.document-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}
.forms-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:13px}.form-card{padding:16px;border:1px solid var(--line);border-radius:14px;background:#fff}.form-code{color:var(--blue);font-size:7px;font-weight:800;letter-spacing:.1em;text-transform:uppercase}.form-card h3{margin:7px 0 5px;color:var(--navy);font-size:13px}.form-card p{margin:0;color:var(--muted);font-size:8.5px;line-height:1.55}.form-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:11px}
.doc-workspace{margin-top:22px}.doc-grid{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:18px;align-items:start}.viewer{overflow:hidden;border:1px solid var(--line);border-radius:16px;background:#eef2f7}.viewer-bar{min-height:54px;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:0 15px;border-bottom:1px solid var(--line);background:#fff}.viewer-bar strong{color:var(--navy);font-size:10px}.viewer iframe{width:100%;height:560px;border:0;background:#dfe4ec;display:block}.doc-body{min-height:420px;padding:24px;background:#fff;color:#34465a;font-size:10px;line-height:1.75}.doc-side{display:grid;gap:12px}.doc-chooser{display:flex;gap:6px;flex-wrap:wrap;margin-top:11px}
.choice-group{display:grid;grid-template-columns:1fr 1fr;gap:8px}.choice input{position:absolute;opacity:0}.choice span{min-height:48px;display:grid;place-items:center;padding:8px;border:1px solid var(--line);border-radius:11px;background:#fff;color:var(--navy);font-size:7.5px;font-weight:800;text-transform:uppercase;letter-spacing:.07em;text-align:center}.choice input:checked+span{border-color:var(--aqua);background:var(--pale)}
.legal-box{max-height:150px;overflow:auto;padding:13px;border:1px solid var(--line);border-radius:11px;background:#f8fafc;color:var(--body);font-size:8px;line-height:1.65}.consent-row{display:flex;gap:9px;align-items:flex-start;margin-top:12px;color:var(--body);font-size:8.5px;line-height:1.55}.consent-row input{margin-top:2px;accent-color:var(--navy)}.sig-pad{width:100%;height:170px;border:1px solid var(--line);border-radius:13px;background:repeating-linear-gradient(0deg,#fff 0 33px,#f7f8fa 33px 34px);touch-action:none;cursor:crosshair}.sig-pad.invalid{border-color:var(--bad);background:#fff4f2}.doc-submit-row{display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-top:14px}

/* Drawer + application modal */
.overlay{position:fixed;inset:0;z-index:200;display:none;justify-content:flex-end;background:rgba(3,17,31,.56);backdrop-filter:blur(4px)}.overlay.active{display:flex}.drawer{width:min(620px,100%);height:100%;display:flex;flex-direction:column;background:#fff;box-shadow:-24px 0 70px rgba(0,0,0,.28)}.drawer-head{padding:20px;display:flex;justify-content:space-between;gap:18px;border-bottom:1px solid var(--line)}.drawer-head h3{margin:0;color:var(--navy);font:700 23px/1.08 Montserrat,sans-serif;letter-spacing:-.035em}.icon-btn{width:38px;height:38px;flex:0 0 auto;display:grid;place-items:center;border:1px solid var(--line);border-radius:50%;background:#fff;color:var(--navy);font-size:18px}.drawer-body{padding:20px;overflow:auto}.drawer-body h4{margin:21px 0 7px;color:var(--navy);font-size:11px}.drawer-body p,.drawer-body li{color:var(--body);font-size:9.5px;line-height:1.7}.drawer-body ul{padding-left:18px}.drawer-foot{margin-top:auto;padding:15px 20px;display:flex;align-items:center;justify-content:space-between;gap:12px;border-top:1px solid var(--line)}
.modal{position:fixed;inset:0;z-index:250;display:none;place-items:center;padding:18px;background:rgba(3,17,31,.63);backdrop-filter:blur(5px)}.modal.active{display:grid}.modal-inner{width:min(760px,100%);max-height:92vh;overflow:hidden;display:flex;flex-direction:column;border-radius:21px;background:#fff;box-shadow:0 35px 100px rgba(0,0,0,.34)}.modal-head{padding:18px 20px;display:flex;justify-content:space-between;gap:18px;border-bottom:1px solid var(--line)}.modal-head h3{margin:0;color:var(--navy);font-size:18px}.modal-body{padding:20px;overflow:auto}.progress-label{color:var(--muted);font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:.1em}.steps{display:flex;gap:5px;margin:9px 0 18px}.step-pill{flex:1;height:4px;border-radius:999px;background:#e2e8f0}.step-pill.active{background:var(--navy)}.apply-step{display:none}.apply-step.active{display:block}.apply-error{display:none;margin-bottom:12px;padding:10px;border:1px solid #efc0ba;border-radius:10px;background:#fff4f2;color:var(--bad);font-size:8.5px}.modal-foot{padding:13px 20px;display:flex;justify-content:space-between;align-items:center;gap:12px;border-top:1px solid var(--line)}.modal-actions{display:flex;gap:8px}

/* Loading */
.loading{position:fixed;inset:0;z-index:500;display:none;place-items:center;background:rgba(3,17,31,.68);backdrop-filter:blur(5px)}.loading.show{display:grid}.loading-card{width:min(360px,calc(100% - 30px));padding:27px;border-radius:18px;background:#fff;text-align:center;box-shadow:var(--dark-shadow)}.spinner{width:38px;height:38px;margin:0 auto 13px;border:3px solid #e2e8f0;border-top-color:var(--navy);border-radius:50%;animation:spin .8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}.loading-card strong{color:var(--navy);font-size:11px}.loading-card p{margin:7px 0 0;color:var(--muted);font-size:8.5px;line-height:1.5}.toast{position:fixed;right:18px;bottom:18px;z-index:600;display:none;max-width:390px;padding:12px 15px;border:1px solid rgba(255,255,255,.12);border-radius:11px;background:var(--ink2);color:#fff;box-shadow:0 18px 44px rgba(0,0,0,.25);font-size:8.5px;line-height:1.55}.toast.show{display:block}.toast.error{background:#6f251f}

@media(max-width:980px){.hero-inner{grid-template-columns:1fr;gap:38px}.career-pass{max-width:620px}.jobs-shell,.portal-login,.documents-entry,.doc-grid{grid-template-columns:1fr}.jobs-aside{grid-template-columns:repeat(2,1fr)}.culture-grid{grid-template-columns:1fr 1fr}.culture-panel:first-child{grid-column:1/-1}.section-head{grid-template-columns:1fr;gap:13px}}
@media(max-width:700px){.wrap{width:min(var(--max),calc(100% - 24px))}.hero{min-height:auto}.hero-inner{min-height:auto;padding:48px 0 92px}.hero-copy h1{font-size:44px}.career-pass{min-height:310px;padding:23px}.pass-copy{margin-top:55px}.pass-stats{grid-template-columns:1fr 1fr}.hub-switcher{grid-template-columns:1fr}.hub-switch+.hub-switch{border-left:0;border-top:1px solid var(--line)}.hub-switch{min-height:54px}.switcher-shell{margin-top:-27px}.page-main{padding-top:36px}.job-search-top,.job-filter-row,.grid2,.grid3,.portal-grid,.profile-list,.forms-grid,.choice-group{grid-template-columns:1fr}.job-search-foot{align-items:flex-start;flex-direction:column}.job{grid-template-columns:1fr 30px}.job-side{grid-column:1}.job-arrow{grid-column:2;grid-row:1/3}.jobs-aside,.culture-grid{grid-template-columns:1fr}.culture-panel:first-child{grid-column:auto}.portal-points{grid-template-columns:1fr}.portal-header{align-items:flex-start;flex-direction:column}.viewer iframe{height:430px}.modal-foot{align-items:flex-start;flex-direction:column}.modal-actions{width:100%}.modal-actions .btn{flex:1}}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}*,*:before,*:after{animation:none!important;transition-duration:.01ms!important}}

/* SKANDI Careers presentation refinement: clear, readable application controls. */
.hero { min-height:580px; background:radial-gradient(circle at 78% 20%,rgba(95,199,207,.17),transparent 28%),linear-gradient(135deg,#031b38 0%,#022e64 68%,#0a4976 100%); }
.hero-inner { min-height:580px; }
.hero-copy p { font-size:clamp(15px,1.3vw,17px); }
.hero-note,.meta,.card-head p,.status { font-size:13px; }
.hero-note strong,.field label,.field-label { font-size:11px; }
.btn { font-size:11px; letter-spacing:.045em; }
.btn.small { font-size:11px; }
.input,select,textarea { font-size:16px; }
@media (max-width:760px) { .hero,.hero-inner { min-height:0; } .hero-inner { padding:64px 0 90px; } .hero-copy h1 { font-size:clamp(38px,11vw,60px); } }
</style>
</head>
<body>

<header class="hero" data-section-id="careers-hero">
  <div class="wrap hero-inner">
    <div class="hero-copy">
      <div class="eyebrow" data-content-id="careers-hero-eyebrow">CAREERS AT SKANDI</div>
      <h1 data-content-id="careers-hero-h1">Build the journeys<br><strong>people remember.</strong></h1>
      <p data-content-id="careers-hero-copy">Join teams working across destinations, airports, guest service, operations and digital travel. Search current opportunities, apply securely, then return to the same Careers hub to follow your application and complete requested documents.</p>
      <div class="hero-actions">
        <button class="btn aqua" type="button" data-open-view="jobs">Explore opportunities</button>
        <button class="btn light" type="button" data-open-view="portal">Applicant portal</button>
      </div>
      <div class="hero-notes">
        <div class="hero-note"><strong>One careers hub</strong>Jobs, applications and applicant documents in one public experience.</div>
        <div class="hero-note"><strong>Separate identity</strong>Applicant access does not create customer, Club or staff access.</div>
        <div class="hero-note"><strong>Connected recruiting</strong>Applications use the same recruiting domain as SKANDI SuccessFactors.</div>
      </div>
    </div>
    <aside class="career-pass" aria-label="SKANDI Careers summary">
      <div class="pass-top"><span class="pass-brand">SKANDI CAREERS</span><span class="pass-status">Recruiting hub</span></div>
      <div class="pass-copy"><strong>Operational, international and human.</strong><span>From destination teams and airport operations to customer care and digital systems.</span></div>
      <div class="pass-stats">
        <div class="pass-stat"><strong id="statOpen">0</strong><span>Open roles</span></div>
        <div class="pass-stat"><strong id="statBases">0</strong><span>Bases</span></div>
        <div class="pass-stat"><strong id="statAreas">0</strong><span>Areas</span></div>
      </div>
    </aside>
  </div>
</header>

<div class="wrap switcher-shell">
  <nav class="hub-switcher" aria-label="Careers hub">
    <button class="hub-switch active" type="button" data-open-view="jobs"><span>01</span>Opportunities</button>
    <button class="hub-switch" type="button" data-open-view="portal"><span>02</span>Applicant portal</button>
    <button class="hub-switch" type="button" data-open-view="documents"><span>03</span>Documents</button>
  </nav>
</div>

<main class="page-main">
<div class="wrap">

<section class="hub-view active" id="jobsView" data-hub-view="jobs">
  <section class="section" data-section-id="careers-jobs">
    <div class="section-head">
      <div><div class="eyebrow dark">OPEN OPPORTUNITIES</div><h2>Find your place at SKANDI.</h2></div>
      <p>Search the positions currently published by SKANDI Recruiting. Open a role for the complete responsibilities, requirements and application flow.</p>
    </div>
    <div class="jobs-shell">
      <div>
        <div class="job-search" id="jobsAnchor">
          <div class="job-search-top">
            <div class="field"><label for="keyword">Keyword</label><input id="keyword" class="input" placeholder="Role, area, base or keyword"></div>
            <div class="field"><label for="locationFilter">Location / base</label><select id="locationFilter"></select></div>
          </div>
          <div class="job-filter-row">
            <div class="field"><label for="categoryFilter">Area</label><select id="categoryFilter"></select></div>
            <div class="field"><label for="typeFilter">Contract</label><select id="typeFilter"></select></div>
            <div class="field"><label for="levelFilter">Level</label><select id="levelFilter"></select></div>
          </div>
          <div class="job-search-foot"><span class="meta" id="searchMeta">Loading current positions…</span><button class="btn" id="searchBtn" type="button">Search jobs</button></div>
        </div>
        <div class="job-list" id="jobList"></div>
      </div>
      <aside class="jobs-aside">
        <section class="aside-card dark"><div class="label">Already applied?</div><h3>Continue in Applicant Portal.</h3><p>See application status, applicant-facing messages and document requests without creating a customer account.</p><button class="btn light" type="button" data-open-view="portal">Open portal</button></section>
        <section class="aside-card"><div class="label">Talent pool</div><h3>Future destination teams.</h3><p>When a role is not yet open for your preferred base, published talent-pool opportunities appear alongside current positions.</p></section>
      </aside>
    </div>
  </section>

  <section class="section" data-section-id="careers-life">
    <div class="section-head">
      <div><div class="eyebrow dark">LIFE AT SKANDI</div><h2>Travel needs calm people behind it.</h2></div>
      <p>We value practical service, clear responsibility and teams that stay composed when the operation changes.</p>
    </div>
    <div class="culture-grid">
      <article class="culture-panel"><div class="eyebrow">THE OPERATION</div><h3>Work close to the journey.</h3><p>Roles can sit at airports, destinations, customer-service desks, operational control or the digital systems connecting those teams.</p></article>
      <article class="culture-panel"><div class="eyebrow dark">THE STANDARD</div><h3>Service without theatre.</h3><p>Good service is clear information, thoughtful judgement and doing the practical thing well.</p></article>
      <article class="culture-panel"><div class="eyebrow dark">THE TEAM</div><h3>International by default.</h3><p>SKANDI works across markets and destinations, with local knowledge connected to one operating standard.</p></article>
    </div>
  </section>
</section>

<section class="hub-view" id="portalView" data-hub-view="portal">
  <section id="portalLoginState">
    <div class="portal-login">
      <div class="portal-intro">
        <div class="eyebrow">APPLICANT ACCESS</div>
        <h2>Your application,<br>in one place.</h2>
        <p>Use the email from your application and a SKANDI Careers access code. Applicant access is independent from SKANDI Club, customer accounts and staff systems.</p>
        <div class="portal-points">
          <div class="portal-point"><strong>Applications</strong><span>See the current stage for applications linked to your verified applicant email.</span></div>
          <div class="portal-point"><strong>Messages</strong><span>Applicant-visible recruiting messages appear here when explicitly published by Careers.</span></div>
          <div class="portal-point"><strong>Documents</strong><span>Open assigned applicant documents without leaving the Careers hub.</span></div>
        </div>
      </div>
      <section class="card">
        <div class="card-head"><h3>Applicant portal sign-in</h3><p>Enter the email used in your application and the six-digit access code provided by SKANDI Careers.</p></div>
        <div class="card-body">
          <div class="field"><label for="careerApplicantLoginEmail">Applicant email</label><input id="careerApplicantLoginEmail" class="input" type="email" autocomplete="email"></div>
          <div class="field" style="margin-top:12px"><label for="loginCode">Access code</label><input id="loginCode" class="input" inputmode="numeric" maxlength="6" autocomplete="one-time-code"></div>
          <div class="login-actions"><button class="btn" id="loginBtn" type="button">Open portal</button><button class="btn secondary" id="requestCodeBtn" type="button">Request code</button></div>
          <div id="portalLoginStatus" class="status hidden" role="status" aria-live="polite"></div>
        </div>
      </section>
    </div>
  </section>

  <section id="portalDashboard" class="hidden">
    <div class="portal-header">
      <div><div class="eyebrow dark">APPLICANT PORTAL</div><h2 id="welcome">Welcome</h2><div class="meta" style="margin-top:7px">Your SKANDI Careers application workspace</div></div>
      <button class="btn secondary" id="logoutBtn" type="button">Sign out</button>
    </div>
    <div class="portal-tabs">
      <button class="portal-tab active" type="button" data-portal-tab="applications">Applications</button>
      <button class="portal-tab" type="button" data-portal-tab="messages">Messages</button>
      <button class="portal-tab" type="button" data-portal-tab="documents">Documents</button>
      <button class="portal-tab" type="button" data-portal-tab="profile">Profile</button>
    </div>
    <div id="applicationsPortalView"></div>
    <div id="messagesPortalView" class="hidden"></div>
    <div id="documentsPortalView" class="hidden"></div>
    <div id="profilePortalView" class="hidden"></div>
  </section>
</section>

<section class="hub-view" id="documentsView" data-hub-view="documents">
  <section class="section" data-section-id="careers-documents">
    <div class="section-head">
      <div><div class="eyebrow dark">APPLICANT DOCUMENTS</div><h2>Review. Acknowledge. Continue.</h2></div>
      <p>Applicant document requests can be opened from Applicant Portal or directly with the email and access token provided for the request.</p>
    </div>

    <div class="documents-entry">
      <section class="card">
        <div class="card-head"><h3>Direct document access</h3><p>If SKANDI Careers sent a document-specific link or token, enter those details below.</p></div>
        <div class="card-body">
          <div class="grid2">
            <div class="field"><label for="inviteEmail">Email</label><input id="inviteEmail" class="input" type="email" autocomplete="email"></div>
            <div class="field"><label for="inviteToken">Document access token</label><input id="inviteToken" class="input" autocomplete="off"></div>
          </div>
          <div class="document-actions"><button class="btn" id="loadDocumentBtn" type="button">Load documents</button><button class="btn secondary" id="documentSupportBtn" type="button">Careers support</button></div>
          <div id="documentAccessStatus" class="status hidden"></div>
        </div>
      </section>
      <aside class="document-note"><div class="eyebrow">SECURE WORKFLOW</div><h3>Applicant documents stay separate.</h3><p>These documents belong to the recruiting process. Completing them does not create SKANDI Club membership or internal staff access.</p></aside>
    </div>

    <section class="section" style="margin-top:30px" data-section-id="careers-public-forms">
      <div class="section-head" style="margin-bottom:16px">
        <div><div class="eyebrow dark">FORMS & DOWNLOADS</div><h2 style="font-size:32px">Published Careers forms.</h2></div>
        <p>Only document templates explicitly marked for Careers / Recruiting public use are shown here.</p>
      </div>
      <div id="publicFormsGrid" class="forms-grid"><div class="status">Loading published Careers forms…</div></div>
    </section>

    <section id="documentWorkspace" class="doc-workspace hidden">
      <div class="doc-grid">
        <div>
          <div class="card" style="margin-bottom:12px">
            <div class="card-head"><h3 id="documentPacketTitle">Applicant document review</h3><p id="documentPacketInstructions">Review the assigned document before completing the acknowledgement.</p></div>
            <div class="card-body"><div id="docChooser" class="doc-chooser"></div></div>
          </div>
          <div class="viewer">
            <div class="viewer-bar"><strong id="viewerTitle">Document</strong><span class="meta" id="viewerStatus">Review before signing</span></div>
            <iframe id="pdfViewer" title="Applicant document viewer" src="about:blank"></iframe>
            <div id="bodyViewer" class="doc-body hidden"></div>
          </div>
        </div>

        <aside class="doc-side">
          <section class="card">
            <div class="card-head"><h3>Identity</h3><p>Confirm the person completing this applicant document.</p></div>
            <div class="card-body">
              <div class="field"><label for="relationship">Relationship</label><select id="relationship"><option>Applicant</option><option>Parent / Guardian</option><option>Authorized representative</option><option>Other</option></select></div>
              <div class="grid2" style="margin-top:11px">
                <div class="field"><label for="docFirstName">Legal first name</label><input id="docFirstName" class="input"></div>
                <div class="field"><label for="docLastName">Legal last name</label><input id="docLastName" class="input"></div>
              </div>
              <div class="field" style="margin-top:11px"><label for="docEmail">Email</label><input id="docEmail" class="input" type="email"></div>
              <div class="field" style="margin-top:11px"><label for="docPhone">Phone</label><input id="docPhone" class="input"></div>
            </div>
          </section>

          <section class="card">
            <div class="card-head"><h3>Decision & sign-off</h3><p>Complete this only after reviewing the selected document.</p></div>
            <div class="card-body">
              <div class="choice-group">
                <label class="choice"><input type="radio" name="decision" value="approved" checked><span>Acknowledge / approve</span></label>
                <label class="choice"><input type="radio" name="decision" value="notApproved"><span>Do not approve</span></label>
              </div>
              <div class="field" style="margin-top:11px"><label for="comment">Comment if not approving</label><textarea id="comment" class="input"></textarea></div>
              <div class="legal-box" style="margin-top:11px">By submitting, I confirm that I have been given access to the selected applicant document and had the opportunity to review it. I agree that my typed name, server timestamp, electronic consent and drawn signature may be recorded as evidence of my acknowledgement or decision.</div>
              <label class="consent-row"><input id="documentConsent" type="checkbox"><span>I consent to complete this applicant document transaction electronically.</span></label>
              <div class="field" style="margin-top:11px"><label for="signatureName">Typed legal signature</label><input id="signatureName" class="input"></div>
              <div class="field" style="margin-top:11px"><label>Draw signature</label><canvas id="signaturePad" class="sig-pad" width="1000" height="320"></canvas></div>
              <div class="doc-submit-row"><button class="btn secondary small" id="clearSignatureBtn" type="button">Clear signature</button><button class="btn" id="submitDocumentBtn" type="button">Submit document</button></div>
              <div id="documentSubmitStatus" class="status hidden"></div>
            </div>
          </section>
        </aside>
      </div>
    </section>
  </section>
</section>

</div>
</main>

<div class="overlay" id="jobDrawer" aria-hidden="true">
  <aside class="drawer" role="dialog" aria-modal="true" aria-labelledby="detailTitle">
    <div class="drawer-head"><div><h3 id="detailTitle">Position</h3><div id="detailMeta" class="meta" style="margin-top:6px"></div></div><button class="icon-btn" type="button" data-close-drawer aria-label="Close">&times;</button></div>
    <div class="drawer-body"><p id="detailIntro"></p><h4>What you’ll do</h4><ul id="detailResp"></ul><h4>What you bring</h4><ul id="detailReq"></ul><h4>Why SKANDI</h4><ul id="detailBenefits"></ul></div>
    <div class="drawer-foot"><span id="detailDeadline" class="meta"></span><button class="btn" id="detailApply" type="button">Apply for this role</button></div>
  </aside>
</div>

<div class="modal" id="applyModal" aria-hidden="true">
  <section class="modal-inner" role="dialog" aria-modal="true" aria-labelledby="applyTitle">
    <div class="modal-head"><div><h3 id="applyTitle">Apply</h3><div id="applyMeta" class="meta" style="margin-top:5px"></div></div><button class="icon-btn" type="button" data-close-apply aria-label="Close">&times;</button></div>
    <div class="modal-body">
      <div id="stepLabel" class="progress-label">Step 1 of 3</div>
      <div class="steps"><div class="step-pill"></div><div class="step-pill"></div><div class="step-pill"></div></div>
      <div id="applyError" class="apply-error"></div>

      <div class="apply-step active" data-apply-step="1">
        <div class="grid2">
          <div class="field"><label for="firstName">First name *</label><input id="firstName" class="input" autocomplete="given-name"></div>
          <div class="field"><label for="lastName">Last name *</label><input id="lastName" class="input" autocomplete="family-name"></div>
          <div class="field"><label for="email">Email *</label><input id="email" class="input" type="email" autocomplete="email"></div>
          <div class="field"><label for="phone">Phone *</label><input id="phone" class="input" type="tel" autocomplete="tel"></div>
          <div class="field"><label for="preferredBase">Preferred base</label><input id="preferredBase" class="input"></div>
          <div class="field"><label for="startDate">Earliest start date</label><input id="startDate" class="input" type="date"></div>
        </div>
      </div>

      <div class="apply-step" data-apply-step="2">
        <div class="grid2">
          <div class="field"><label for="cvFile">Resume / CV *</label><input id="cvFile" class="input" type="file" accept=".pdf,.doc,.docx"></div>
          <div class="field"><label for="coverFile">Cover letter / extra document</label><input id="coverFile" class="input" type="file" accept=".pdf,.doc,.docx"></div>
        </div>
        <div class="field" style="margin-top:12px"><label for="motivation">Why SKANDI and this role?</label><textarea id="motivation" class="input"></textarea></div>
        <div class="field" style="margin-top:12px"><label for="source">How did you hear about this opportunity?</label><select id="source"><option value=""></option><option>SKANDI website</option><option>Employee referral</option><option>LinkedIn</option><option>Job board</option><option>Social media</option><option>Other</option></select></div>
      </div>

      <div class="apply-step" data-apply-step="3">
        <section class="card" style="box-shadow:none"><div class="card-head"><h3>Application summary</h3></div><div class="card-body"><p id="applicationSummary" class="meta"></p></div></section>
        <label class="consent-row"><input id="applicationConsent" type="checkbox"><span>I consent to SKANDI processing my application data and uploaded documents for recruitment purposes.</span></label>
        <div class="status" style="margin-top:14px">Applicant Portal is separate from SKANDI Club, customer accounts and internal staff systems.</div>
      </div>
    </div>
    <div class="modal-foot"><span class="meta">Fields marked * are required.</span><div class="modal-actions"><button class="btn secondary" id="applyBackBtn" type="button">Back</button><button class="btn" id="applyNextBtn" type="button">Next</button></div></div>
  </section>
</div>

<div class="loading" id="loading" aria-hidden="true">
  <div class="loading-card"><div class="spinner"></div><strong id="loadingTitle">Working</strong><p id="loadingCopy">Please wait.</p></div>
</div>
<div class="toast" id="toast" role="status" aria-live="polite"></div>

<script>
(()=>{
"use strict";

const VERSION="B-011.1";
const SOURCE="SKANDI_CAREERS_HUB";
const PARENT="SKANDI_WIX_PARENT";
const $=id=>document.getElementById(id);

const state={
  jobs:[],
  settings:{},
  selectedJob:null,
  applyStep:1,
  hubView:"jobs",
  portalTab:"applications",
  sessionToken:"",
  portalData:null,
  packet:null,
  docs:[],
  currentDoc:null,
  publicForms:[],
  hasSignature:false,
  signatureContext:null,
  pendingUploadRequest:"",
  uploadFiles:new Map()
};

function post(type,payload={}){
  window.parent.postMessage({
    source:SOURCE,
    type,
    payload,
    timestamp:new Date().toISOString()
  },"*");
}
function esc(value){
  return String(value??"").replace(/[&<>'"]/g,c=>({
    "&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"
  }[c]));
}
function arr(value){
  return Array.isArray(value)
    ?value
    :(value?String(value).split(",").map(item=>item.trim()).filter(Boolean):[]);
}
function unique(values){
  return [...new Set(values.filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b)));
}
function safeUrl(value){
  const raw=String(value||"").trim();
  if(!raw)return"";
  try{
    const url=new URL(raw);
    return["https:","http:"].includes(url.protocol)?url.href:"";
  }catch(_){return""}
}
function safeInternalPath(value){
  const path=String(value||"").trim();
  return path.startsWith("/")&&!path.startsWith("//")&&!/[\\\x00-\x1F\x7F]/.test(path)?path:"";
}
function sanitizeHtml(value){
  const template=document.createElement("template");
  template.innerHTML=String(value||"");
  template.content.querySelectorAll("script,style,iframe,object,embed,form,link,meta").forEach(node=>node.remove());
  template.content.querySelectorAll("*").forEach(node=>{
    [...node.attributes].forEach(attribute=>{
      const name=attribute.name.toLowerCase();
      const val=attribute.value.trim();
      if(name.startsWith("on")||["style","srcdoc"].includes(name)){
        node.removeAttribute(attribute.name);
        return;
      }
      if(["href","src","action"].includes(name)){
        const okay=val.startsWith("/")||/^https?:\/\//i.test(val)||/^mailto:/i.test(val)||/^tel:/i.test(val)||val.startsWith("#");
        if(!okay)node.removeAttribute(attribute.name);
      }
    });
  });
  return template.innerHTML;
}
function showLoading(on,title="Working",copy="Please wait."){
  $("loading").classList.toggle("show",Boolean(on));
  $("loading").setAttribute("aria-hidden",on?"false":"true");
  $("loadingTitle").textContent=title;
  $("loadingCopy").textContent=copy;
}
function toast(message,error=false){
  const node=$("toast");
  node.textContent=String(message||"");
  node.classList.toggle("error",Boolean(error));
  node.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer=setTimeout(()=>node.classList.remove("show"),3600);
}
function setStatus(id,message,tone=""){
  const node=$(id);
  node.textContent=String(message||"");
  node.className=`status ${tone}`.trim();
  node.classList.toggle("hidden",!message);
}
function requestHeight(){
  clearTimeout(requestHeight.timer);
  requestHeight.timer=setTimeout(()=>{
    post("CAREERS_HEIGHT",{height:Math.ceil(document.documentElement.scrollHeight+12)});
  },70);
}

function setHubView(view,{scroll=true}={}){
  const next=["jobs","portal","documents"].includes(view)?view:"jobs";
  state.hubView=next;
  document.querySelectorAll("[data-hub-view]").forEach(section=>{
    section.classList.toggle("active",section.dataset.hubView===next);
  });
  document.querySelectorAll(".hub-switch").forEach(button=>{
    button.classList.toggle("active",button.dataset.openView===next);
  });
  if(scroll){
    document.querySelector(".switcher-shell")?.scrollIntoView({behavior:"smooth",block:"start"});
  }
  requestHeight();
}

/* ---------- opportunities ---------- */
function options(element,values,allLabel){
  element.innerHTML=`<option value="">${esc(allLabel)}</option>`+
    values.map(value=>`<option value="${esc(value)}">${esc(value)}</option>`).join("");
}
function filteredJobs(){
  const q=String($("keyword").value||"").toLowerCase().trim();
  const loc=$("locationFilter").value,cat=$("categoryFilter").value,typ=$("typeFilter").value,lev=$("levelFilter").value;
  return state.jobs.filter(job=>{
    const hay=[job.title,job.location,job.category,job.summary,job.description,job.level,job.workModel,...arr(job.tags)].join(" ").toLowerCase();
    return(!q||hay.includes(q))&&(!loc||job.location===loc)&&(!cat||job.category===cat)&&(!typ||job.contractType===typ)&&(!lev||job.level===lev);
  });
}
function renderJobFilters(){
  options($("locationFilter"),unique(state.jobs.map(j=>j.location)),"All locations");
  options($("categoryFilter"),unique(state.jobs.map(j=>j.category)),"All areas");
  options($("typeFilter"),unique(state.jobs.map(j=>j.contractType)),"All contract types");
  options($("levelFilter"),unique(state.jobs.map(j=>j.level)),"All levels");
}
function renderJobs(){
  const rows=filteredJobs();
  $("statOpen").textContent=state.jobs.length;
  $("statBases").textContent=unique(state.jobs.map(j=>j.location)).length;
  $("statAreas").textContent=unique(state.jobs.map(j=>j.category)).length;
  $("searchMeta").textContent=rows.length===state.jobs.length
    ?`${rows.length} current role${rows.length===1?"":"s"}`
    :`${rows.length} matching role${rows.length===1?"":"s"}`;

  $("jobList").innerHTML=rows.length?rows.map(job=>`
    <button class="job" type="button" data-job="${esc(job.positionId)}">
      <span>
        <h3>${esc(job.title||"SKANDI opportunity")}</h3>
        <span class="job-meta">${esc([job.location,job.category,job.contractType].filter(Boolean).join(" · "))}</span>
        <span class="pill-row">${arr(job.tags).slice(0,4).map(tag=>`<span class="pill">${esc(tag)}</span>`).join("")}</span>
      </span>
      <span class="job-side">
        ${job.level?`<strong>${esc(job.level)}</strong><br>`:""}
        ${job.workModel?`${esc(job.workModel)}<br>`:""}
        ${job.deadline?`Apply by ${esc(job.deadline)}`:""}
      </span>
      <span class="job-arrow" aria-hidden="true">→</span>
    </button>
  `).join(""):`<div class="status">No published positions match the current filters.</div>`;
  requestHeight();
}
function openJob(positionId){
  state.selectedJob=state.jobs.find(job=>job.positionId===positionId)||null;
  const job=state.selectedJob;
  if(!job)return;
  $("detailTitle").textContent=job.title||"SKANDI opportunity";
  $("detailMeta").textContent=[job.location,job.category,job.contractType,job.level].filter(Boolean).join(" · ");
  $("detailIntro").textContent=job.summary||job.description||"";
  const responsibilities=arr(job.responsibilities),requirements=arr(job.requirements),benefits=arr(job.benefits);
  $("detailResp").innerHTML=(responsibilities.length?responsibilities:["Responsibilities are described in the published position details."]).map(x=>`<li>${esc(x)}</li>`).join("");
  $("detailReq").innerHTML=(requirements.length?requirements:["Requirements are described in the published position details."]).map(x=>`<li>${esc(x)}</li>`).join("");
  $("detailBenefits").innerHTML=(benefits.length?benefits:["Role-specific employment information is confirmed during the recruiting process."]).map(x=>`<li>${esc(x)}</li>`).join("");
  $("detailDeadline").textContent=job.deadline?`Apply by ${job.deadline}`:"";
  $("jobDrawer").classList.add("active");
  $("jobDrawer").setAttribute("aria-hidden","false");
}
function closeJob(){
  $("jobDrawer").classList.remove("active");
  $("jobDrawer").setAttribute("aria-hidden","true");
}
function openApply(){
  if(!state.selectedJob)return;
  closeJob();
  state.applyStep=1;
  $("applyTitle").textContent=`Apply: ${state.selectedJob.title}`;
  $("applyMeta").textContent=[state.selectedJob.location,state.selectedJob.category,state.selectedJob.contractType].filter(Boolean).join(" · ");
  $("applyModal").classList.add("active");
  $("applyModal").setAttribute("aria-hidden","false");
  renderApplyStep();
}
function closeApply(){
  $("applyModal").classList.remove("active");
  $("applyModal").setAttribute("aria-hidden","true");
  $("applyError").style.display="none";
}
function renderApplyStep(){
  document.querySelectorAll("[data-apply-step]").forEach(section=>{
    section.classList.toggle("active",Number(section.dataset.applyStep)===state.applyStep);
  });
  document.querySelectorAll(".step-pill").forEach((pill,index)=>pill.classList.toggle("active",index<state.applyStep));
  $("stepLabel").textContent=`Step ${state.applyStep} of 3`;
  $("applyBackBtn").style.visibility=state.applyStep===1?"hidden":"visible";
  $("applyNextBtn").textContent=state.applyStep===3?"Submit application":"Next";
  if(state.applyStep===3){
    $("applicationSummary").textContent=[
      [$("firstName").value,$("lastName").value].filter(Boolean).join(" "),
      $("email").value,
      state.selectedJob?.title
    ].filter(Boolean).join(" · ");
  }
}
function fileInfo(input,kind){
  const file=input.files&&input.files[0];
  return file?{kind,fileName:file.name,mimeType:file.type,sizeBytes:file.size}:null;
}
function validateApplyStep(){
  const node=$("applyError");
  node.style.display="none";
  node.textContent="";
  if(state.applyStep===1&&(!$("firstName").value.trim()||!$("lastName").value.trim()||!$("email").value.trim()||!$("phone").value.trim())){
    node.textContent="First name, last name, email and phone are required.";node.style.display="block";return false;
  }
  if(state.applyStep===2&&!fileInfo($("cvFile"),"CV")){
    node.textContent="Resume / CV is required.";node.style.display="block";return false;
  }
  if(state.applyStep===3&&!$("applicationConsent").checked){
    node.textContent="Recruitment data consent is required.";node.style.display="block";return false;
  }
  return true;
}
function prepareApplicationUpload(){
  const files=[fileInfo($("cvFile"),"CV"),fileInfo($("coverFile"),"COVER")].filter(Boolean);
  const requestId=`CAREERS-UP-${Date.now()}`;
  state.pendingUploadRequest=requestId;
  state.uploadFiles.clear();
  files.forEach(info=>{
    state.uploadFiles.set(info.kind,info.kind==="CV"?$("cvFile").files[0]:$("coverFile").files[0]);
  });
  showLoading(true,"Preparing application","Creating secure private upload links for your application documents.");
  post("CAREERS_UPLOAD_PREPARE",{
    requestId,
    email:$("email").value.trim(),
    positionId:state.selectedJob?.positionId||"",
    files
  });
}
async function uploadPreparedFiles(payload){
  if(payload.requestId!==state.pendingUploadRequest)return;
  const uploads=Array.isArray(payload.uploads)?payload.uploads:[];
  try{
    for(const upload of uploads){
      const file=state.uploadFiles.get(upload.kind);
      if(!file)throw new Error(`Missing local ${upload.kind} file.`);
      const response=await fetch(upload.signedUrl,{
        method:upload.method||"PUT",
        headers:{"Content-Type":upload.contentType||file.type||"application/octet-stream"},
        body:file
      });
      if(!response.ok)throw new Error(`Secure upload failed (${response.status}).`);
    }
    $("loadingTitle").textContent="Submitting application";
    $("loadingCopy").textContent="Saving your application to SKANDI Recruiting.";
    post("CAREERS_APPLY",{application:{
      positionId:state.selectedJob?.positionId||"",
      positionTitle:state.selectedJob?.title||"",
      firstName:$("firstName").value.trim(),
      lastName:$("lastName").value.trim(),
      email:$("email").value.trim(),
      phone:$("phone").value.trim(),
      preferredBase:$("preferredBase").value.trim(),
      startDate:$("startDate").value,
      motivation:$("motivation").value.trim(),
      source:$("source").value,
      consent:$("applicationConsent").checked===true,
      uploads:uploads.map(upload=>({uploadId:upload.uploadId,kind:upload.kind}))
    }});
  }catch(error){
    showLoading(false);
    toast(error?.message||"Application document upload failed.",true);
  }
}

/* ---------- applicant portal ---------- */
function setPortalTab(tab){
  const next=["applications","messages","documents","profile"].includes(tab)?tab:"applications";
  state.portalTab=next;
  document.querySelectorAll("[data-portal-tab]").forEach(button=>button.classList.toggle("active",button.dataset.portalTab===next));
  ["applications","messages","documents","profile"].forEach(name=>{
    $(`${name}PortalView`).classList.toggle("hidden",name!==next);
  });
  requestHeight();
}
function renderPortal(){
  const data=state.portalData||{},applicant=data.applicant||{};
  $("portalLoginState").classList.add("hidden");
  $("portalDashboard").classList.remove("hidden");
  $("welcome").textContent=`Welcome${applicant.firstName?" "+applicant.firstName:""}`;

  const applications=Array.isArray(data.applications)?data.applications:[];
  $("applicationsPortalView").innerHTML=applications.length
    ?`<div class="portal-grid">${applications.map(item=>`
      <article class="portal-item">
        <h3>${esc(item.positionTitle||"SKANDI opportunity")}</h3>
        <div class="meta">${esc([item.location,item.createdAt].filter(Boolean).join(" · "))}</div>
        <span class="pill">${esc(item.stage||item.status||"Application received")}</span>
      </article>`).join("")}</div>`
    :`<div class="status">No applications were found for this applicant session.</div>`;

  const messages=Array.isArray(data.messages)?data.messages:[];
  $("messagesPortalView").innerHTML=messages.length
    ?`<section class="card"><div class="card-body">${messages.map(message=>`
      <article class="message-item"><strong>${esc(message.subject||"Careers message")}</strong>
      <div class="meta" style="margin-top:4px">${esc(message.createdAt||"")}</div><p>${esc(message.body||"")}</p></article>`).join("")}</div></section>`
    :`<div class="status">No applicant-visible messages are currently published.</div>`;

  const documents=Array.isArray(data.documentRequests)?data.documentRequests:[];
  $("documentsPortalView").innerHTML=documents.length
    ?`<div class="portal-grid">${documents.map(item=>`
      <article class="portal-item"><h3>${esc(item.title||"Applicant documents")}</h3>
      <div class="meta">${esc(item.status||"Pending")}${item.dueAt?` · Due ${esc(item.dueAt)}`:""}${item.documentCount?` · ${esc(item.documentCount)} document${Number(item.documentCount)===1?"":"s"}`:""}</div>
      <span class="pill">${esc(item.packetType||"Document request")}</span>
      <div style="margin-top:12px"><button class="btn small" type="button" data-open-packet="${esc(item.packetId)}">Open documents</button></div></article>`).join("")}</div>`
    :`<div class="status">No applicant document requests are currently assigned.</div>`;

  $("profilePortalView").innerHTML=`
    <div class="profile-list">
      <div class="profile-cell"><span>Name</span><strong>${esc([applicant.firstName,applicant.lastName].filter(Boolean).join(" ")||"—")}</strong></div>
      <div class="profile-cell"><span>Email</span><strong>${esc(applicant.email||"—")}</strong></div>
      <div class="profile-cell"><span>Phone</span><strong>${esc(applicant.phone||"—")}</strong></div>
      <div class="profile-cell"><span>Preferred base</span><strong>${esc(applicant.preferredBase||"—")}</strong></div>
    </div>
    <div class="status" style="margin-top:12px">If your personal details need to be corrected, contact SKANDI Careers so the recruiting record remains controlled.</div>`;
  setPortalTab(state.portalTab);
}
function portalLoggedOut(){
  state.sessionToken="";
  state.portalData=null;
  $("portalDashboard").classList.add("hidden");
  $("portalLoginState").classList.remove("hidden");
  $("loginCode").value="";
  setStatus("portalLoginStatus","","");
  requestHeight();
}

/* ---------- forms & documents ---------- */
function renderPublicForms(){
  const forms=state.publicForms||[];
  $("publicFormsGrid").innerHTML=forms.length?forms.map(form=>`
    <article class="form-card">
      <div class="form-code">${esc(form.code||"FORM")} · ${esc(form.category||"Careers")}</div>
      <h3>${esc(form.title||"Career form")}</h3>
      <p>${esc(form.summary||"Published SKANDI Careers form.")}</p>
      <div class="form-actions">
        ${form.allowBlankFill&&safeInternalPath(form.onlinePath)?`<button class="btn small" type="button" data-form-path="${esc(form.onlinePath)}">Fill online</button>`:""}
        ${form.allowBlankDownload&&safeUrl(form.fileUrl)?`<button class="btn secondary small" type="button" data-form-url="${esc(form.fileUrl)}">Open form</button>`:""}
        ${safeUrl(form.officialSourceUrl)?`<button class="btn secondary small" type="button" data-form-url="${esc(form.officialSourceUrl)}">Official source</button>`:""}
      </div>
    </article>`).join(""):`<div class="status">No public Careers forms are currently published.</div>`;
  requestHeight();
}
function openPacketFromPortal(packetId){
  if(!state.sessionToken){
    toast("Sign in to Applicant Portal again.",true);
    setHubView("portal");
    return;
  }
  showLoading(true,"Loading applicant documents","Retrieving the assigned document packet.");
  post("APPLICANT_OPEN_DOCUMENT",{sessionToken:state.sessionToken,packetId});
}
function loadDirectPacket(){
  const email=$("inviteEmail").value.trim(),token=$("inviteToken").value.trim();
  if(!email||!token){
    setStatus("documentAccessStatus","Enter the document email and access token.","error");
    return;
  }
  showLoading(true,"Loading applicant documents","Checking the document request and access token.");
  post("DOCUMENT_PACKET_LOAD_REQUEST",{email,token});
}
function renderDocumentPacket(payload){
  const packet=payload.packet||{},identity=payload.identity||{};
  state.packet=packet;
  state.docs=Array.isArray(packet.documents)?packet.documents:[];
  state.currentDoc=state.docs[0]||null;
  $("documentPacketTitle").textContent=packet.title||"Applicant document review";
  $("documentPacketInstructions").textContent=packet.instructions||"Review the assigned document before completing the acknowledgement.";
  $("docFirstName").value=identity.firstName||"";
  $("docLastName").value=identity.lastName||"";
  $("docEmail").value=identity.email||$("inviteEmail").value||"";
  $("docPhone").value=identity.phone||"";
  $("docChooser").innerHTML=state.docs.map((doc,index)=>`<button class="btn secondary small" type="button" data-doc-index="${index}">${esc(doc.title||`Document ${index+1}`)}</button>`).join("");
  $("documentWorkspace").classList.remove("hidden");
  if(state.docs.length)openDocument(0);
  setHubView("documents",{scroll:false});
  showLoading(false);
  setStatus("documentAccessStatus",state.docs.length?"Document request loaded.":"The packet has no assigned documents.","ok");
  $("documentWorkspace").scrollIntoView({behavior:"smooth",block:"start"});
}
function openDocument(index){
  state.currentDoc=state.docs[index]||null;
  const doc=state.currentDoc;
  if(!doc)return;
  $("viewerTitle").textContent=doc.title||"Applicant document";
  $("viewerStatus").textContent=doc.documentType||doc.status||"Review before signing";
  const url=safeUrl(doc.fileUrl);
  if(url){
    $("pdfViewer").classList.remove("hidden");
    $("bodyViewer").classList.add("hidden");
    $("pdfViewer").src=url;
  }else{
    $("pdfViewer").src="about:blank";
    $("pdfViewer").classList.add("hidden");
    $("bodyViewer").classList.remove("hidden");
    $("bodyViewer").innerHTML=sanitizeHtml(doc.bodyHtml||"<p>No document body was provided.</p>");
  }
  resetSignature();
  requestHeight();
}
function collectDocumentExecution(){
  return{
    sessionToken:state.sessionToken||"",
    packetId:state.packet?.packetId||"",
    email:$("docEmail").value.trim()||$("inviteEmail").value.trim(),
    token:$("inviteToken").value.trim(),
    relationship:$("relationship").value,
    firstName:$("docFirstName").value.trim(),
    lastName:$("docLastName").value.trim(),
    phone:$("docPhone").value.trim(),
    documentId:state.currentDoc?.documentId||"",
    decision:document.querySelector("input[name='decision']:checked")?.value||"approved",
    comment:$("comment").value.trim(),
    electronicConsent:$("documentConsent").checked===true,
    signatureName:$("signatureName").value.trim(),
    hasSignature:state.hasSignature,
    signatureImageData:state.hasSignature?$("signaturePad").toDataURL("image/png"):""
  };
}
function submitDocument(){
  const payload=collectDocumentExecution();
  if(!state.currentDoc){setStatus("documentSubmitStatus","Select an assigned document first.","error");return}
  if(!payload.firstName||!payload.lastName||!payload.email){setStatus("documentSubmitStatus","Complete the identity fields.","error");return}
  if(!payload.electronicConsent){setStatus("documentSubmitStatus","Electronic consent is required.","error");return}
  if(!payload.signatureName){setStatus("documentSubmitStatus","Typed legal signature is required.","error");return}
  if(!state.hasSignature){
    $("signaturePad").classList.add("invalid");
    setStatus("documentSubmitStatus","Drawn signature is required.","error");
    return;
  }
  showLoading(true,"Recording document decision","Saving the acknowledgement and signature securely.");
  post("DOCUMENT_EXEC_SUBMIT",payload);
}
function setupSignaturePad(){
  const canvas=$("signaturePad"),ctx=canvas.getContext("2d");
  ctx.lineWidth=3;ctx.lineCap="round";ctx.strokeStyle="#022e64";
  state.signatureContext=ctx;
  let drawing=false;
  function point(event){
    const rect=canvas.getBoundingClientRect(),source=event.touches?event.touches[0]:event;
    return{x:(source.clientX-rect.left)*(canvas.width/rect.width),y:(source.clientY-rect.top)*(canvas.height/rect.height)};
  }
  function start(event){event.preventDefault();drawing=true;const p=point(event);ctx.beginPath();ctx.moveTo(p.x,p.y)}
  function move(event){if(!drawing)return;event.preventDefault();const p=point(event);ctx.lineTo(p.x,p.y);ctx.stroke();state.hasSignature=true;canvas.classList.remove("invalid")}
  function end(){drawing=false}
  ["mousedown","touchstart"].forEach(type=>canvas.addEventListener(type,start,{passive:false}));
  ["mousemove","touchmove"].forEach(type=>canvas.addEventListener(type,move,{passive:false}));
  ["mouseup","mouseleave","touchend"].forEach(type=>canvas.addEventListener(type,end));
}
function resetSignature(){
  const canvas=$("signaturePad");
  state.signatureContext?.clearRect(0,0,canvas.width,canvas.height);
  state.hasSignature=false;
  canvas.classList.remove("invalid");
  $("documentConsent").checked=false;
  $("signatureName").value="";
  $("comment").value="";
  setStatus("documentSubmitStatus","","");
}

/* ---------- controls ---------- */
document.addEventListener("click",event=>{
  const viewButton=event.target.closest("[data-open-view]");
  if(viewButton){setHubView(viewButton.dataset.openView);return}

  const job=event.target.closest("[data-job]");
  if(job){openJob(job.dataset.job);return}

  if(event.target.closest("[data-close-drawer]")){closeJob();return}
  if(event.target.closest("[data-close-apply]")){closeApply();return}

  const portalTab=event.target.closest("[data-portal-tab]");
  if(portalTab){setPortalTab(portalTab.dataset.portalTab);return}

  const packet=event.target.closest("[data-open-packet]");
  if(packet){openPacketFromPortal(packet.dataset.openPacket);return}

  const doc=event.target.closest("[data-doc-index]");
  if(doc){openDocument(Number(doc.dataset.docIndex));return}

  const internalForm=event.target.closest("[data-form-path]");
  if(internalForm){
    const path=safeInternalPath(internalForm.dataset.formPath);
    if(path)post("CAREERS_NAVIGATE",{path});
    return;
  }

  const externalForm=event.target.closest("[data-form-url]");
  if(externalForm){
    const url=safeUrl(externalForm.dataset.formUrl);
    if(url)window.open(url,"_blank","noopener,noreferrer");
  }
});

["keyword","locationFilter","categoryFilter","typeFilter","levelFilter"].forEach(id=>$(id).addEventListener("input",renderJobs));
$("searchBtn").onclick=renderJobs;
$("detailApply").onclick=openApply;
$("applyBackBtn").onclick=()=>{if(state.applyStep>1){state.applyStep--;renderApplyStep()}};
$("applyNextBtn").onclick=()=>{
  if(!validateApplyStep())return;
  if(state.applyStep<3){state.applyStep++;renderApplyStep();return}
  prepareApplicationUpload();
};

$("requestCodeBtn").onclick=()=>{
  const email=$("careerApplicantLoginEmail").value.trim();
  if(!email){setStatus("portalLoginStatus","Enter the email used in your application.","error");return}
  showLoading(true,"Requesting access","Checking the Careers applicant record.");
  post("APPLICANT_PORTAL_REQUEST_CODE",{email});
};
$("loginBtn").onclick=()=>{
  const email=$("careerApplicantLoginEmail").value.trim(),code=$("loginCode").value.trim();
  if(!email||!code){setStatus("portalLoginStatus","Enter your applicant email and access code.","error");return}
  showLoading(true,"Opening applicant portal","Verifying the applicant access code.");
  post("APPLICANT_PORTAL_LOGIN",{email,code});
};
$("logoutBtn").onclick=()=>{
  if(state.sessionToken)post("APPLICANT_PORTAL_LOGOUT",{sessionToken:state.sessionToken});
  else portalLoggedOut();
};

$("loadDocumentBtn").onclick=loadDirectPacket;
$("documentSupportBtn").onclick=()=>post("DOCUMENT_SUPPORT_REQUEST",{email:$("inviteEmail").value.trim()});
$("clearSignatureBtn").onclick=resetSignature;
$("submitDocumentBtn").onclick=submitDocument;

/* ---------- parent responses ---------- */
window.addEventListener("message",event=>{
  if(event.source!==window.parent)return;
  let message=event.data;
  if(typeof message==="string"){try{message=JSON.parse(message)}catch(_){return}}
  if(!message||typeof message!=="object"||message.source!==PARENT)return;
  const payload=message.payload||{};

  if(message.type==="CAREERS_HOST_READY"){
    if(payload.email)$("inviteEmail").value=payload.email;
    if(payload.token)$("inviteToken").value=payload.token;
    if(payload.view)setHubView(payload.view,{scroll:false});
    if(payload.view==="documents"&&payload.email&&payload.token)setTimeout(loadDirectPacket,120);
    return;
  }

  if(message.type==="CAREERS_DATA"){
    state.jobs=Array.isArray(payload.positions)?payload.positions:[];
    state.settings=payload.settings||{};
    renderJobFilters();
    renderJobs();
    return;
  }

  if(message.type==="CAREERS_UPLOAD_READY"){
    uploadPreparedFiles(payload);
    return;
  }

  if(message.type==="CAREERS_APPLICATION_RESULT"){
    showLoading(false);
    closeApply();
    toast(payload.message||"Application received.");
    if($("email").value)$("careerApplicantLoginEmail").value=$("email").value;
    setHubView("portal");
    setStatus("portalLoginStatus","Application submitted. Request an applicant access code when you want to return to your application.","ok");
    return;
  }

  if(message.type==="APPLICANT_PORTAL_CODE_RESULT"){
    showLoading(false);
    setStatus("portalLoginStatus",payload.message||"Access code request received.",payload.ok===false?"error":"ok");
    return;
  }

  if(message.type==="APPLICANT_PORTAL_LOGIN_RESULT"){
    showLoading(false);
    if(!payload.ok){
      setStatus("portalLoginStatus",payload.error||payload.message||"Could not sign in.","error");
      return;
    }
    state.sessionToken=payload.sessionToken||"";
    state.portalData=payload;
    renderPortal();
    return;
  }

  if(message.type==="APPLICANT_PORTAL_DATA"){
    state.portalData=payload;
    if(payload.sessionToken)state.sessionToken=payload.sessionToken;
    renderPortal();
    return;
  }

  if(message.type==="APPLICANT_PORTAL_LOGOUT_RESULT"){
    portalLoggedOut();
    toast("Signed out of Applicant Portal.");
    return;
  }

  if(message.type==="CAREERS_PUBLIC_FORMS_DATA"){
    state.publicForms=Array.isArray(payload.documents)?payload.documents:[];
    renderPublicForms();
    return;
  }

  if(message.type==="DOCUMENT_PACKET_DATA"){
    renderDocumentPacket(payload);
    return;
  }

  if(message.type==="DOCUMENT_EXECUTION_RESULT"){
    showLoading(false);
    setStatus("documentSubmitStatus",payload.message||"Document decision recorded.",payload.ok===false?"error":"ok");
    toast(payload.message||"Document decision recorded.",payload.ok===false);
    if(payload.ok!==false&&state.sessionToken)post("APPLICANT_PORTAL_REFRESH",{sessionToken:state.sessionToken});
    return;
  }

  if(message.type==="CAREERS_ERROR"){
    showLoading(false);
    const text=payload.message||"Careers is temporarily unavailable.";
    toast(text,true);
    if(state.hubView==="portal")setStatus("portalLoginStatus",text,"error");
    if(state.hubView==="documents"){
      setStatus("documentAccessStatus",text,"error");
      setStatus("documentSubmitStatus",text,"error");
    }
  }
});

if("ResizeObserver"in window)new ResizeObserver(requestHeight).observe(document.body);
else window.addEventListener("resize",requestHeight);

setupSignaturePad();
post("CAREERS_READY",{version:VERSION});
requestHeight();

})();
</script>
</body>
</html>
```
