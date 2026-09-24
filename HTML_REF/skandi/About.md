# About

## INFO / LOG

- **Status:** READY
- **System:** SKANDI
- **Route:** `/about`
- **Wix page:** `About.xcftf`
- **HTML component:** `#aboutEmbed`
- **HTML source:** `/HTML_REF/skandi/About.md`
- **Page source:** `SKANDI_ABOUT_PAGE`
- **Parent source:** `SKANDI_WIX_PARENT`
- **Public data facade:** `backend/SKANDI_CORE/publicContent.web`
- **Public data method:** `getPublicAboutPayload`
- **Public data core:** `backend/SKANDI_CORE/publicContent`
- **Global chrome/settings/routes:** `masterPage.js`
- **Version:** `B-011.4`
- **Last verified:** `2026-09-24`

### Architecture

`About HTML`
→ `postMessage`
→ `/src/pages/About.xcftf.js`
→ `backend/SKANDI_CORE/publicContent.web`
→ `backend/SKANDI_CORE/publicContent`
→ canonical Supabase public-content / Inventory projections

Global customer header/footer, customer settings, shared routes and session behavior remain owned by `masterPage.js`.

### B-011.4 visual convergence

B-011.4 is a presentation-only refinement of the already-converged B-011.3 About architecture.

The page now intentionally matches the current Home design language while retaining its own About-specific layout:

- Home-aligned navy `#022e64`, cyan `#5FC7CF`, white and pale-blue surfaces.
- Compact light editorial hero instead of the former dark animated cinematic hero.
- Navy H1/H2 typography with restrained cyan accents.
- Reduced radii and shadow intensity to match Home.
- Removed high-tech/glow/radar/scan visual effects from the story timeline.
- Converted Our Story to a lighter editorial timeline.
- Converted Collection to a pale Home-style content rail.
- Kept Who We Are as image-led cards, but with restrained gradients and motion.
- Helpful Links remains a different 2×2 editorial mosaic so About does not simply copy Home's layout.
- Final CTA is the one intentional dark navy feature block.
- Existing content, translations, live Inventory collection/partner data and B-011 message contracts are unchanged.
- Existing Presentation Registry hooks are preserved.
- No masterPage, backend, database, RPC or provider change is required.

---

## COMPLETE INTENDED LIVE HTML SOURCE

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"/>
<meta name="theme-color" content="#022e64"/>
<title>About SKANDI · B-011.4</title>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet"/>

<style>
:root{
  --sk-blue:#022e64;
  --sk-blue-soft:#285ca8;
  --sk-blue2:#0b3a7a;
  --sk-light:#d7e6ff;
  --sk-pale:#f6faff;
  --sk-bg:#f7faff;
  --sk-border:#dbe3ef;
  --sk-border-soft:#eef2f7;
  --sk-text:#111;
  --sk-body:#555f70;
  --sk-muted:#667085;
  --sk-cyan:#5FC7CF;
  --sk-ok:#087443;
  --sk-danger:#8a1f1f;
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

button,input,select{font-family:inherit}
button{cursor:pointer}
a{color:inherit;text-decoration:none}
img{display:block;max-width:100%}

.skip-link{
  position:absolute;
  left:-999px;
  top:auto;
  width:1px;
  height:1px;
  overflow:hidden;
}
.skip-link:focus{
  left:16px;
  top:16px;
  width:auto;
  height:auto;
  z-index:9999;
  padding:10px 14px;
  border-radius:10px;
  background:#fff;
  color:var(--sk-blue);
  box-shadow:var(--sk-shadow);
  font-weight:800;
}

/* =========================================================
   SHARED B-011 TYPOGRAPHY / BUTTONS
   Mirrors Home's lighter travel-site language.
   ========================================================= */
.eyebrow,
.hero-eyebrow{
  display:flex;
  align-items:center;
  gap:9px;
  color:var(--sk-cyan);
  font-size:10px;
  line-height:1.2;
  font-weight:900;
  letter-spacing:.16em;
  text-transform:uppercase;
}

.eyebrow::before,
.hero-eyebrow::before{
  content:"";
  width:26px;
  height:2px;
  flex:0 0 26px;
  border-radius:999px;
  background:var(--sk-cyan);
}

.eyebrow.light{
  color:#d8fbfb;
}
.eyebrow.light::before{
  background:#d8fbfb;
}

.gradient-text{
  background:none;
  -webkit-background-clip:initial;
  -webkit-text-fill-color:initial;
  color:var(--sk-blue);
}

.copy{
  color:var(--sk-body);
  font-size:14px;
  line-height:1.75;
}

.btn{
  min-height:44px;
  padding:0 19px;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  gap:8px;
  border:1px solid transparent;
  border-radius:10px;
  background:linear-gradient(135deg,var(--sk-blue),var(--sk-blue-soft));
  color:#fff;
  box-shadow:0 6px 20px rgba(2,46,100,.18);
  font-size:11px;
  font-weight:800;
  letter-spacing:.03em;
  transition:
    transform .2s cubic-bezier(.16,1,.3,1),
    box-shadow .2s ease,
    border-color .2s ease,
    background .2s ease;
}
.btn::before{display:none}
.btn:hover{
  transform:translateY(-1px);
  box-shadow:0 10px 26px rgba(2,46,100,.26);
}
.btn-secondary{
  background:#fff;
  color:var(--sk-blue);
  border-color:var(--sk-border);
  box-shadow:0 4px 14px rgba(2,46,100,.06);
}
.btn-secondary:hover{
  border-color:var(--sk-cyan);
  background:var(--sk-pale);
}
.btn:focus-visible,
.collection-tab:focus-visible,
.tech-link-card:focus-visible{
  outline:3px solid rgba(95,199,207,.45);
  outline-offset:3px;
}

/* =========================================================
   HERO — LIGHT, EDITORIAL, HOME-ALIGNED
   ========================================================= */
.hero{
  position:relative;
  width:100%;
  min-height:500px;
  display:flex;
  align-items:center;
  overflow:hidden;
  padding:68px 24px;
  background:
    linear-gradient(90deg,
      rgba(255,255,255,.98) 0%,
      rgba(255,255,255,.96) 34%,
      rgba(255,255,255,.80) 53%,
      rgba(255,255,255,.14) 78%,
      rgba(255,255,255,0) 100%),
    var(--hero-image,url('https://static.wixstatic.com/media/394052_c28e933557934c498c287c32cd5110b1~mv2.png'))
    center/cover no-repeat;
  border-radius:0 0 28px 28px;
}

.hero::before{
  content:"";
  position:absolute;
  inset:0;
  pointer-events:none;
  background:
    radial-gradient(circle at 15% 12%,rgba(95,199,207,.12),transparent 28%),
    linear-gradient(180deg,rgba(2,46,100,0),rgba(2,46,100,.025));
}

.hero::after{
  content:"";
  position:absolute;
  left:0;
  right:0;
  bottom:0;
  height:1px;
  background:linear-gradient(90deg,transparent,rgba(95,199,207,.55),transparent);
}

.hero-inner{
  position:relative;
  z-index:2;
  width:min(100%,var(--sk-max));
  margin:0 auto;
}

.hero-eyebrow{
  margin-bottom:8px;
}

.hero h1{
  max-width:650px;
  margin:0;
  color:var(--sk-blue);
  font-size:clamp(38px,5vw,58px);
  line-height:.98;
  letter-spacing:-.045em;
  font-weight:700;
}

.hero h1 strong{
  color:var(--sk-blue);
  font-weight:800;
}

.hero p{
  max-width:610px;
  margin-top:16px;
  color:#475467;
  font-size:14px;
  line-height:1.72;
}

/* =========================================================
   SECTIONS / HEADINGS
   ========================================================= */
.section{
  width:min(100%,var(--sk-max));
  margin:0 auto;
  padding:72px 24px 0;
}

.section-head{
  display:grid;
  grid-template-columns:minmax(0,1fr) minmax(320px,.82fr);
  gap:42px;
  align-items:end;
  margin-bottom:30px;
}

.section-head h2,
.collection-section > h2{
  margin:5px 0 0;
  color:var(--sk-blue);
  font-size:clamp(28px,3.8vw,42px);
  line-height:1.06;
  letter-spacing:-.04em;
  font-weight:750;
}

.section-head .copy{
  max-width:580px;
}

/* =========================================================
   WHO WE ARE — IMAGE CARDS, RESTRAINED
   ========================================================= */
.tech-grid-3{
  display:grid;
  grid-template-columns:1.15fr .9fr .95fr;
  gap:14px;
}
.tech-grid-4{
  display:grid;
  grid-template-columns:repeat(2,minmax(0,1fr));
  gap:14px;
}

.tech-link-card{
  position:relative;
  min-height:300px;
  display:flex;
  flex-direction:column;
  justify-content:flex-end;
  overflow:hidden;
  border:1px solid var(--sk-border);
  border-radius:18px;
  padding:24px;
  background-image:var(--bg-img);
  background-size:cover;
  background-position:center;
  box-shadow:0 8px 24px rgba(2,46,100,.07);
  transition:
    transform .25s cubic-bezier(.16,1,.3,1),
    box-shadow .25s ease,
    border-color .2s ease;
}

.tech-grid-3 .tech-link-card:first-child{
  min-height:342px;
}

.tech-link-card:hover{
  transform:translateY(-4px);
  box-shadow:0 16px 34px rgba(2,46,100,.12);
  border-color:rgba(95,199,207,.55);
}

.tech-card-overlay{
  position:absolute;
  inset:0;
  background:
    linear-gradient(180deg,
      rgba(2,46,100,.02) 16%,
      rgba(2,46,100,.18) 48%,
      rgba(2,46,100,.88) 100%);
}
.tech-card-glow{display:none}

.tech-card-body{
  position:relative;
  z-index:2;
  max-width:440px;
  transform:none;
}

.tech-card-body .eyebrow{
  margin-bottom:7px;
}

.tech-card-body .eyebrow strong{
  color:#fff;
  font-size:15px;
  line-height:1.25;
  letter-spacing:0;
  text-transform:none;
}

.tech-card-body .desc{
  display:block;
  max-width:390px;
  color:rgba(255,255,255,.82);
  font-size:11px;
  line-height:1.6;
}

.tech-action{
  display:inline-flex;
  align-items:center;
  gap:8px;
  margin-top:12px;
  color:#fff;
  opacity:.86;
  transform:none;
  font-size:9px;
  font-weight:850;
  letter-spacing:.05em;
  text-transform:uppercase;
}

.tech-action .arrow{
  transition:transform .2s ease;
}
.tech-link-card:hover .tech-action .arrow{
  transform:translateX(3px);
}

/* =========================================================
   STORY — LIGHT EDITORIAL TIMELINE
   ========================================================= */
.story-wrapper{
  position:relative;
  display:grid;
  grid-template-columns:minmax(0,1.35fr) minmax(250px,.65fr);
  gap:28px;
  margin-top:2px;
  padding:30px;
  overflow:hidden;
  border:1px solid var(--sk-border);
  border-radius:22px;
  background:
    radial-gradient(circle at 96% 4%,rgba(95,199,207,.10),transparent 26%),
    linear-gradient(180deg,#fff,var(--sk-pale));
  color:var(--sk-text);
  box-shadow:0 10px 30px rgba(2,46,100,.06);
}

.story-wrapper::before{display:none}

.story-content{
  min-width:0;
}

.story-content > .eyebrow{
  color:var(--sk-cyan);
}
.story-content > .eyebrow::before{
  background:var(--sk-cyan);
}

.story-content h2{
  margin:7px 0 12px;
  color:var(--sk-blue);
  font-size:clamp(28px,3.6vw,40px);
  line-height:1.06;
  letter-spacing:-.04em;
}

.story-content > p{
  max-width:760px;
  margin:0;
  color:var(--sk-body);
  font-size:13px;
  line-height:1.72;
}

.timeline{
  position:relative;
  display:grid;
  gap:11px;
  margin-top:24px;
  padding-left:22px;
}

.timeline::before{
  content:"";
  position:absolute;
  left:5px;
  top:12px;
  bottom:12px;
  width:2px;
  border-radius:999px;
  background:linear-gradient(var(--sk-cyan),rgba(95,199,207,.16));
}
.timeline::after{display:none}

.milestone{
  position:relative;
  overflow:visible;
  padding:15px 17px;
  border:1px solid var(--sk-border-soft);
  border-radius:13px;
  background:#fff;
  box-shadow:0 4px 14px rgba(2,46,100,.04);
  transition:
    transform .2s ease,
    box-shadow .2s ease,
    border-color .2s ease;
}
.milestone::after{display:none}
.milestone:hover{
  transform:translateY(-2px);
  border-color:rgba(95,199,207,.46);
  box-shadow:0 9px 22px rgba(2,46,100,.08);
}

.milestone-node{
  position:absolute;
  left:-22px;
  top:21px;
  width:10px;
  height:10px;
}
.milestone-node::before{display:none}
.milestone-node .core{
  position:absolute;
  inset:0;
  border:2px solid #fff;
  border-radius:50%;
  background:var(--sk-cyan);
  box-shadow:0 0 0 3px rgba(95,199,207,.16);
  animation:none;
}
.milestone-node .radar{display:none}

.milestone .year{
  display:inline-block;
  margin:0 0 5px;
  padding:0;
  border:0;
  border-radius:0;
  background:transparent;
  box-shadow:none;
  color:var(--sk-cyan);
  font-size:9px;
  font-weight:900;
  letter-spacing:.12em;
  text-transform:uppercase;
}

.milestone h3{
  margin:0 0 4px;
  color:var(--sk-blue);
  font-size:13px;
  line-height:1.3;
  font-weight:800;
  letter-spacing:0;
  text-transform:none;
  text-shadow:none;
}
.milestone p{
  margin:0;
  color:var(--sk-body);
  font-size:10px;
  line-height:1.55;
}

.fact-stack{
  display:grid;
  align-content:start;
  gap:10px;
}

.fact{
  padding:18px;
  border:1px solid var(--sk-border-soft);
  border-radius:14px;
  background:#fff;
  box-shadow:0 5px 16px rgba(2,46,100,.04);
  transition:transform .2s ease,box-shadow .2s ease;
}
.fact:hover{
  transform:translateY(-2px);
  box-shadow:0 10px 24px rgba(2,46,100,.07);
}
.fact small{
  display:block;
  margin-bottom:6px;
  color:var(--sk-cyan);
  font-size:8px;
  font-weight:900;
  letter-spacing:.13em;
  text-transform:uppercase;
}
.fact strong{
  display:block;
  margin-bottom:5px;
  color:var(--sk-blue);
  font-size:22px;
  line-height:1.1;
  font-weight:800;
  letter-spacing:-.03em;
}
.fact p{
  color:var(--sk-body);
  font-size:10px;
  line-height:1.55;
}

/* =========================================================
   COLLECTION — PALE HOME-STYLE CONTENT RAIL
   ========================================================= */
.collection-section{
  margin-top:72px;
  padding:32px 30px 34px;
  border:1px solid var(--sk-border);
  border-radius:22px;
  background:var(--sk-pale);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.85);
}

.collection-section > .eyebrow{
  margin-bottom:2px;
}

.collection-section > h2.section-head{
  display:block;
  margin:6px 0 18px!important;
  padding:0;
}

.collection-tabs{
  display:flex;
  gap:5px;
  margin:0 0 16px;
  padding:4px;
  overflow-x:auto;
  border:1px solid var(--sk-border-soft);
  border-radius:12px;
  background:rgba(2,46,100,.045);
}

.collection-tab{
  flex:0 0 auto;
  min-height:34px;
  padding:0 13px;
  border:0;
  border-radius:8px;
  background:transparent;
  color:#667482;
  font-size:10px;
  font-weight:800;
  white-space:nowrap;
  transition:background .18s ease,color .18s ease,box-shadow .18s ease;
}
.collection-tab.active{
  background:#fff;
  color:var(--sk-blue);
  box-shadow:0 2px 8px rgba(0,0,0,.07);
}

.collection-grid{
  display:grid;
  grid-template-columns:repeat(3,minmax(0,1fr));
  gap:13px;
}

.collection-card{
  min-width:0;
  overflow:hidden;
  display:flex;
  flex-direction:column;
  border:1px solid var(--sk-border-soft);
  border-radius:17px;
  background:#fff;
  box-shadow:0 5px 18px rgba(2,46,100,.05);
  transition:
    transform .24s cubic-bezier(.16,1,.3,1),
    box-shadow .24s ease,
    border-color .2s ease;
}
.collection-card:hover{
  transform:translateY(-3px);
  border-color:rgba(95,199,207,.42);
  box-shadow:0 14px 28px rgba(2,46,100,.10);
}

.collection-img-wrap{
  position:relative;
  height:190px;
  overflow:hidden;
  background:#edf3f8;
}
.collection-main-img{
  width:100%;
  height:100%;
  object-fit:cover;
  transition:transform .35s ease;
}
.collection-card:hover .collection-main-img{
  transform:scale(1.025);
}
.collection-img-overlay{
  position:absolute;
  inset:0;
  z-index:1;
  background:linear-gradient(to top,rgba(2,46,100,.20),transparent 62%);
}
.collection-ribbon{
  position:absolute;
  top:0;
  left:0;
  z-index:2;
  height:100%;
  width:auto;
  filter:drop-shadow(0 6px 14px rgba(0,0,0,.14));
}
.collection-img-placeholder{
  width:100%;
  height:100%;
  display:grid;
  place-items:center;
  color:var(--sk-blue);
  font-size:12px;
  font-weight:850;
}

.collection-content{
  flex:1;
  display:flex;
  flex-direction:column;
  padding:17px;
  background:#fff;
}

.live-count{
  color:var(--sk-cyan);
  font-size:8px;
  font-weight:900;
  letter-spacing:.10em;
  text-transform:uppercase;
}
.collection-title{
  margin:5px 0 7px;
  color:var(--sk-blue);
  font-size:17px;
  line-height:1.2;
  font-weight:800;
  letter-spacing:-.025em;
}
.collection-desc{
  flex:1;
  margin:0 0 10px;
  color:var(--sk-body);
  font-size:10px;
  line-height:1.55;
}
.collection-source{
  margin-bottom:8px;
  color:var(--sk-muted);
  font-size:8px;
  font-weight:700;
}
.live-examples{
  display:grid;
  gap:4px;
  margin:0 0 12px;
  padding:0;
  list-style:none;
}
.live-examples li{
  position:relative;
  padding-left:12px;
  color:var(--sk-blue);
  font-size:9px;
  line-height:1.45;
  font-weight:650;
}
.live-examples li::before{
  content:"";
  position:absolute;
  left:0;
  top:.55em;
  width:5px;
  height:2px;
  border-radius:999px;
  background:var(--sk-cyan);
}

.notice{
  padding:13px 14px;
  border:1px solid #e2e8f0;
  border-left:3px solid var(--sk-cyan);
  border-radius:11px;
  background:#fff;
  color:var(--sk-body);
  font-size:10px;
  line-height:1.55;
}
.collection-live-state{
  margin-bottom:13px;
}
.collection-live-state.hidden{
  display:none;
}

/* =========================================================
   SELECTED FOCUS
   ========================================================= */
.partners{
  display:grid;
  grid-template-columns:repeat(4,minmax(0,1fr));
  gap:10px;
}
.partner{
  min-width:0;
  padding:16px;
  border:1px solid var(--sk-border-soft);
  border-radius:13px;
  background:#fff;
  box-shadow:0 4px 13px rgba(2,46,100,.035);
  text-align:left;
  transition:transform .2s ease,border-color .2s ease,box-shadow .2s ease;
}
.partner:hover{
  transform:translateY(-2px);
  border-color:rgba(95,199,207,.45);
  box-shadow:0 9px 22px rgba(2,46,100,.07);
}
.partner b{
  display:block;
  color:var(--sk-blue);
  font-size:11px;
  line-height:1.35;
  font-weight:800;
}
.partner span{
  display:block;
  margin-top:5px;
  color:var(--sk-muted);
  font-size:8px;
  line-height:1.4;
  font-weight:750;
  letter-spacing:.04em;
  text-transform:uppercase;
}

/* =========================================================
   HELPFUL LINKS — DISTINCT 2x2 EDITORIAL MOSAIC
   ========================================================= */
[data-section-id="about-links"] .tech-grid-4{
  grid-template-columns:1.15fr .85fr;
}
[data-section-id="about-links"] .tech-link-card{
  min-height:220px;
}
[data-section-id="about-links"] .tech-link-card:nth-child(1),
[data-section-id="about-links"] .tech-link-card:nth-child(4){
  min-height:260px;
}

/* =========================================================
   FINAL CTA — ONE RESTRAINED DARK FEATURE
   ========================================================= */
.cta{
  position:relative;
  width:min(calc(100% - 48px),var(--sk-max));
  margin:72px auto 80px;
  overflow:hidden;
  padding:44px 32px;
  border-radius:20px;
  background:
    radial-gradient(circle at 88% 16%,rgba(95,199,207,.16),transparent 30%),
    linear-gradient(135deg,var(--sk-blue),var(--sk-blue2));
  box-shadow:0 12px 30px rgba(2,46,100,.16);
  text-align:center;
  color:#fff;
}
.cta::before{
  content:"";
  position:absolute;
  inset:0;
  opacity:.06;
  background:
    linear-gradient(90deg,rgba(255,255,255,.4) 1px,transparent 1px),
    linear-gradient(rgba(255,255,255,.4) 1px,transparent 1px);
  background-size:34px 34px;
}
.cta h2,
.cta p,
.cta .hero-actions{
  position:relative;
  z-index:2;
}
.cta h2{
  max-width:760px;
  margin:0 auto;
  color:#fff;
  font-size:clamp(28px,4vw,42px);
  line-height:1.05;
  letter-spacing:-.04em;
  font-weight:750;
}
.cta p{
  max-width:650px;
  margin:12px auto 22px;
  color:rgba(255,255,255,.78);
  font-size:12px;
  line-height:1.65;
}
.hero-actions{
  display:flex;
  justify-content:center;
  gap:9px;
  flex-wrap:wrap;
}

/* =========================================================
   SMALL STATUS / ACCESSIBILITY
   ========================================================= */
.page-status{
  width:min(100%,var(--sk-max));
  margin:18px auto 0;
  padding:0 24px;
}
.page-status .notice{margin:0}

#toast{
  position:fixed;
  right:16px;
  bottom:16px;
  z-index:1000;
  display:none;
  max-width:360px;
  padding:12px 14px;
  border-radius:10px;
  background:var(--sk-blue);
  color:#fff;
  box-shadow:var(--sk-shadow-strong);
  font-size:10px;
}
#toast.show{display:block}

/* =========================================================
   RESPONSIVE
   ========================================================= */
@media(max-width:980px){
  .hero{
    min-height:470px;
    background:
      linear-gradient(90deg,
        rgba(255,255,255,.98) 0%,
        rgba(255,255,255,.94) 52%,
        rgba(255,255,255,.44) 78%,
        rgba(255,255,255,.12) 100%),
      var(--hero-image,url('https://static.wixstatic.com/media/394052_c28e933557934c498c287c32cd5110b1~mv2.png'))
      center/cover no-repeat;
  }
  .section-head{
    grid-template-columns:1fr;
    gap:14px;
  }
  .tech-grid-3{
    grid-template-columns:1fr 1fr;
  }
  .tech-grid-3 .tech-link-card:first-child{
    grid-column:1/-1;
    min-height:300px;
  }
  .story-wrapper{
    grid-template-columns:1fr;
  }
  .fact-stack{
    grid-template-columns:repeat(3,minmax(0,1fr));
  }
  .collection-grid{
    grid-template-columns:repeat(2,minmax(0,1fr));
  }
  .partners{
    grid-template-columns:repeat(3,minmax(0,1fr));
  }
}

@media(max-width:680px){
  .hero{
    min-height:480px;
    align-items:flex-end;
    padding:52px 20px 46px;
    background:
      linear-gradient(180deg,
        rgba(255,255,255,.24) 0%,
        rgba(255,255,255,.64) 36%,
        rgba(255,255,255,.95) 68%,
        #fff 100%),
      var(--hero-image,url('https://static.wixstatic.com/media/394052_c28e933557934c498c287c32cd5110b1~mv2.png'))
      center top/cover no-repeat;
    border-radius:0 0 20px 20px;
  }
  .hero h1{
    font-size:40px;
  }
  .hero p{
    font-size:12px;
  }
  .section{
    padding:54px 16px 0;
  }
  .section-head h2,
  .collection-section > h2{
    font-size:30px;
  }
  .tech-grid-3,
  .tech-grid-4,
  [data-section-id="about-links"] .tech-grid-4{
    grid-template-columns:1fr;
  }
  .tech-grid-3 .tech-link-card:first-child{
    grid-column:auto;
  }
  .tech-link-card,
  .tech-grid-3 .tech-link-card:first-child,
  [data-section-id="about-links"] .tech-link-card,
  [data-section-id="about-links"] .tech-link-card:nth-child(1),
  [data-section-id="about-links"] .tech-link-card:nth-child(4){
    min-height:230px;
  }
  .story-wrapper{
    padding:20px;
    border-radius:17px;
  }
  .fact-stack{
    grid-template-columns:1fr;
  }
  .collection-section{
    margin-top:54px;
    padding:24px 16px 26px;
    border-radius:17px;
  }
  .collection-grid{
    grid-template-columns:1fr;
  }
  .collection-img-wrap{
    height:180px;
  }
  .partners{
    grid-template-columns:repeat(2,minmax(0,1fr));
  }
  .cta{
    width:calc(100% - 32px);
    margin:54px auto 64px;
    padding:34px 20px;
    border-radius:17px;
  }
  .cta .btn{
    width:100%;
  }
}

@media(max-width:430px){
  .partners{
    grid-template-columns:1fr;
  }
}

@media(prefers-reduced-motion:reduce){
  html{scroll-behavior:auto}
  *,*::before,*::after{
    animation:none!important;
    transition-duration:.01ms!important;
  }
}
</style>
<body>
<a class="skip-link" href="#main">Skip to main content</a>

<main id="main">
  <header class="hero" id="hero" data-section-id="about-hero" data-media-id="about-hero-media">
    <div class="hero-inner">
      <div class="hero-eyebrow" data-i18n="hero.kicker" data-content-id="about-hero-eyebrow">About SKANDI TRAVELS</div>
      <h1 data-i18n="hero.title" data-content-id="about-hero-h1">Scandinavian care,<br> <strong>designed for the world.</strong></h1>
      <p id="heroCopy" data-i18n="hero.copy" data-content-id="about-hero-copy">SKANDI Travels is built for travelers who want a more personal, structured and carefully selected way to plan and book travel.</p>
    </div>
  </header>

  <section class="section" data-section-id="about-who">
    <div class="section-head">
      <div>
        <div class="eyebrow" data-i18n="sec1.kicker" data-content-id="about-who-eyebrow">Who we are</div>
        <h2 class="gradient-text" data-i18n="sec1.title" data-content-id="about-who-h2">Bringing the Scandinavian way of travel to the world</h2>
      </div>
      <p class="copy" data-i18n="sec1.copy" data-content-id="about-who-copy">SKANDI brings the convenience, guidance and culture of European charter travel into a new premium experience. We help Americans explore Europe and Asia the SKANDI way — and help Scandinavians and Europeans discover the United States with the same confidence, care and ease.</p>
    </div>
    
    <div class="tech-grid-3">
      <article class="tech-link-card" data-media-id="about-who-charter-media" style="--bg-img: url('https://static.wixstatic.com/media/394052_54174b4e1cbd4812842427a79b9e224d~mv2.png')">
        <div class="tech-card-overlay"></div>
        <div class="tech-card-glow"></div>
        <div class="tech-card-body">
          <div class="eyebrow light"><strong data-i18n="sec1.card1.title" data-content-id="about-who-charter-title">Charter Culture</strong></div>
          <span class="desc" data-i18n="sec1.card1.desc" data-content-id="about-who-charter-copy">Inspired by the Scandinavian way of traveling: selected, guided and cared for.</span>
          <span class="tech-action"><span data-i18n="sec1.card1.btn" data-content-id="about-who-charter-action">Learn Personal Care</span> <span class="arrow">→</span></span>
        </div>
      </article>

      <article class="tech-link-card" data-media-id="about-who-elevated-media" style="--bg-img: url('https://static.wixstatic.com/media/394052_e53bee7ea3ca462ea35408185193bc95~mv2.png')">
        <div class="tech-card-overlay"></div>
        <div class="tech-card-glow"></div>
        <div class="tech-card-body">
          <div class="eyebrow light"><strong data-i18n="sec1.card2.title" data-content-id="about-who-elevated-title">Elevated</strong></div>
          <span class="desc" data-i18n="sec1.card2.desc" data-content-id="about-who-elevated-copy">A premium, modern version of charter travel with stronger service, design and digital tools.</span>
          <span class="tech-action"><span data-i18n="sec1.card2.btn" data-content-id="about-who-elevated-action">Two-Way Travel</span> <span class="arrow">→</span></span>
        </div>
      </article>

      <article class="tech-link-card" data-media-id="about-who-global-media" style="--bg-img: url('https://static.wixstatic.com/media/394052_f42e27397fed462db4cc3abaab03215e~mv2.png')">
        <div class="tech-card-overlay"></div>
        <div class="tech-card-glow"></div>
        <div class="tech-card-body">
          <div class="eyebrow light"><strong data-i18n="sec1.card3.title" data-content-id="about-who-global-title">Global Connection</strong></div>
          <span class="desc" data-i18n="sec1.card3.desc" data-content-id="about-who-global-copy">Helping Americans explore Europe — and Europeans explore the United States — the SKANDI way.</span>
          <span class="tech-action"><span data-i18n="sec1.card3.btn" data-content-id="about-who-global-action">Learn Personal Care</span> <span class="arrow">→</span></span>
        </div>
      </article>
    </div>
  </section>

  <section class="section" data-section-id="about-story">
    <div class="story-wrapper">
      <div class="story-content">
        <div class="eyebrow light" data-i18n="sec2.kicker" data-content-id="about-story-eyebrow">Our Story</div>
        <h2 data-i18n="sec2.title" data-content-id="about-story-h2">How SKANDI started.</h2>
        <p id="storyText" data-i18n="sec2.copy" data-content-id="about-story-copy">SKANDI started from a simple belief: travel should feel exciting, easy to understand and cared for.<br><br>For many Scandinavians, charter travel is more than a package trip. It is a culture. It is the way many of us first discovered the world — with selected hotels, airport transfers, destination staff, guided experiences and the confidence of knowing that someone was there to help.<br><br>That way of traveling is in our blood.<br><br>SKANDI was created to bring that feeling into a new era: more premium, more connected and more thoughtfully designed.</p>
        <div id="timeline" class="timeline"></div>
      </div>
      <aside class="fact-stack" id="facts"></aside>
    </div>
  </section>

  <section class="section collection-section" id="liveCollectionSection" data-section-id="about-collection">
    <div class="eyebrow" data-i18n="coll.kicker" data-content-id="about-collection-eyebrow">SKANDI COLLECTION</div>
    <h2 class="section-head gradient-text" style="margin-bottom: 20px;" data-i18n="coll.title" data-content-id="about-collection-h2">Our selected way to travel.</h2>

    <div class="collection-tabs" id="collectionTypeTabs"></div>
    <div class="collection-live-state notice" id="collectionLiveState">Loading live SKANDI Collection inventory…</div>
    <div class="collection-grid" id="collectionGrid" style="margin-top:24px"></div>
  </section>

  <section class="section" data-section-id="about-focus">
    <div class="section-head">
      <div>
        <div class="eyebrow" data-i18n="focus.kicker" data-content-id="about-focus-eyebrow">Selected focus</div>
        <h2 class="gradient-text" data-i18n="focus.title" data-content-id="about-focus-h2">Partners and places we are building around.</h2>
      </div>
      <p class="copy" data-i18n="focus.copy" data-content-id="about-focus-copy">These are public-safe selected records from the SKANDI content library.</p>
    </div>
    <div class="partners" id="partners"></div>
  </section>

  <section class="section" data-section-id="about-links">
    <div class="section-head">
      <div>
        <div class="eyebrow" data-i18n="links.kicker" data-content-id="about-links-eyebrow">Helpful links</div>
        <h2 class="gradient-text" data-i18n="links.title" data-content-id="about-links-h2">Find what you need quickly.</h2>
      </div>
      <p class="copy" data-i18n="links.copy" data-content-id="about-links-copy">Careers, press, legal policies and travel information are easy to access from one place.</p>
    </div>
    
    <div class="tech-grid-4">
      <a class="tech-link-card" href="/about/careers" data-route-key="careers" data-fallback-path="/about/careers" style="--bg-img: url('https://static.wixstatic.com/media/394052_74e4b78c6aa0448c81f738b393406079~mv2.png')">
        <div class="tech-card-overlay"></div>
        <div class="tech-card-glow"></div>
        <div class="tech-card-body">
          <div class="eyebrow light"><strong data-i18n="links.c1.title" data-content-id="about-links-careers-title">Careers</strong></div>
          <span class="desc" data-i18n="links.c1.desc" data-content-id="about-links-careers-copy">Join SKANDI and help build a modern travel company.</span>
          <span class="tech-action"><span data-i18n="links.c1.btn" data-content-id="about-links-careers-action">View Openings</span> <span class="arrow">→</span></span>
        </div>
      </a>

      <a class="tech-link-card" href="/about/news-room" data-route-key="newsroom" data-fallback-path="/about/news-room" style="--bg-img: url('https://static.wixstatic.com/media/394052_490f53a1a68e4b1a89c4860c5cb9eb32~mv2.png')">
        <div class="tech-card-overlay"></div>
        <div class="tech-card-glow"></div>
        <div class="tech-card-body">
          <div class="eyebrow light"><strong data-i18n="links.c2.title" data-content-id="about-links-newsroom-title">Press room</strong></div>
          <span class="desc" data-i18n="links.c2.desc" data-content-id="about-links-newsroom-copy">News, media assets and public announcements.</span>
          <span class="tech-action"><span data-i18n="links.c2.btn" data-content-id="about-links-newsroom-action">Read News</span> <span class="arrow">→</span></span>
        </div>
      </a>

      <a class="tech-link-card" href="/about/legal" data-route-key="legal" data-fallback-path="/about/legal" style="--bg-img: url('https://static.wixstatic.com/media/394052_ecdb8871f3af497b8abf8497d0221daf~mv2.png')">
        <div class="tech-card-overlay"></div>
        <div class="tech-card-glow"></div>
        <div class="tech-card-body">
          <div class="eyebrow light"><strong data-i18n="links.c3.title" data-content-id="about-links-legal-title">Legal policies</strong></div>
          <span class="desc" data-i18n="links.c3.desc" data-content-id="about-links-legal-copy">Privacy, cookies, accessibility, booking terms and notices.</span>
          <span class="tech-action"><span data-i18n="links.c3.btn" data-content-id="about-links-legal-action">Read Terms</span> <span class="arrow">→</span></span>
        </div>
      </a>

      <a class="tech-link-card" href="/travel-info" data-route-key="travelInfo" data-fallback-path="/travel-info" style="--bg-img: url('https://static.wixstatic.com/media/394052_82c7486635f343c0bff18322b745afdc~mv2.png')">
        <div class="tech-card-overlay"></div>
        <div class="tech-card-glow"></div>
        <div class="tech-card-body">
          <div class="eyebrow light"><strong data-i18n="links.c4.title" data-content-id="about-links-travel-info-title">Travel info</strong></div>
          <span class="desc" data-i18n="links.c4.desc" data-content-id="about-links-travel-info-copy">Practical travel help, flight status and guidance.</span>
          <span class="tech-action"><span data-i18n="links.c4.btn" data-content-id="about-links-travel-info-action">Explore Guides</span> <span class="arrow">→</span></span>
        </div>
      </a>
    </div>
  </section>

  <!-- Final CTA -->
  <section class="cta" data-section-id="about-cta" data-media-id="about-cta-media">
    <h2 data-i18n="cta.title" data-content-id="about-cta-h2">Explore travel the SKANDI way.</h2>
    <p data-i18n="cta.copy" data-content-id="about-cta-copy">Join SKANDI Club, browse the SKANDI Collection, or learn more about our policies, careers and press information.</p>
    <div class="hero-actions">
      <a class="btn" href="/skandi-collection" data-route-key="skandiCollection" data-fallback-path="/skandi-collection" data-i18n="cta.btn1" data-content-id="about-cta-collection-button">SKANDI Collection</a>
      <a class="btn btn-secondary" href="/skandi-club" data-route-key="club" data-fallback-path="/skandi-club" data-i18n="cta.btn2" data-content-id="about-cta-club-button">SKANDI Club</a>
    </div>
  </section>
</main>

<div id="toast" class="toast"></div>
<script>
const I18N = {
  EN: {
    
    // Page Content
    "hero.kicker": "About SKANDI TRAVELS",
    "hero.title": "Scandinavian care, <strong>designed for the world.</strong>",
    "hero.copy": "SKANDI Travels is built for travelers who want a more personal, structured and carefully selected way to plan and book travel.",
    "hero.btnClub": "Join SKANDI Club",
    "hero.btnSig": "Explore SKANDI Collection",
    
    "sec1.kicker": "Who we are",
    "sec1.title": "Bringing the Scandinavian way of travel to the world",
    "sec1.copy": "SKANDI brings the convenience, guidance and culture of European charter travel into a new premium experience. We help Americans explore Europe and Asia the SKANDI way — and help Scandinavians and Europeans discover the United States with the same confidence, care and ease.",
    "sec1.card1.title": "Charter Culture",
    "sec1.card1.desc": "Inspired by the Scandinavian way of traveling: selected, guided and cared for.",
    "sec1.card1.btn": "Learn Personal Care",
    "sec1.card2.title": "Elevated",
    "sec1.card2.desc": "A premium, modern version of charter travel with stronger service, design and digital tools.",
    "sec1.card2.btn": "Two-Way Travel",
    "sec1.card3.title": "Global Connection",
    "sec1.card3.desc": "Helping Americans explore Europe — and Europeans explore the United States — the SKANDI way.",
    "sec1.card3.btn": "Learn Personal Care",
    
    "sec2.kicker": "Our Story",
    "sec2.title": "How SKANDI started.",
    "sec2.copy": "SKANDI started from a simple belief: travel should feel exciting, easy to understand and cared for.<br><br>For many Scandinavians, charter travel is more than a package trip. It is a culture. It is the way many of us first discovered the world — with selected hotels, airport transfers, destination staff, guided experiences and the confidence of knowing that someone was there to help.<br><br>That way of traveling is in our blood.<br><br>SKANDI was created to bring that feeling into a new era: more premium, more connected and more thoughtfully designed.",

    "coll.kicker": "SKANDI COLLECTION",
    "coll.title": "Our selected way to travel.",
    "coll.tab1": "Destinations",
    "coll.tab2": "Airlines",
    "coll.tab3": "Airports",
    "coll.c1.title": "Select Destinations",
    "coll.c1.desc1": "A beautifully curated list of accessible, inspiring cities offering outstanding value and an easy, thoughtful travel experience.",
    "coll.c1.desc2": "These destinations focus on independence and variety.",
    "coll.c1.bold": "They are characterized by:",
    "coll.c1.l1": "An expanded range of online services.",
    "coll.c1.l2": "A wider offering of activities, sights, and things to explore on your own.",
    "coll.c1.btn": "Explore Select",
    "coll.c2.title": "Signature Destinations",
    "coll.c2.desc1": "Our core recommendations. Exceptional places worldwide that perfectly match the SKANDI philosophy of thoughtful, memorable travel.",
    "coll.c2.desc2": "These represent the traditional 'Scandinavian way' charter experience with full on-the-ground support.",
    "coll.c2.bold": "They have:",
    "coll.c2.l1": "A dedicated destination team that meets guests directly at the airport.",
    "coll.c2.l2": "Option to add SKANDI Transfer straight to the hotel via SKANDI's own charter coaches.",
    "coll.c2.l3": "In-person hotel visits from SKANDI staff.",
    "coll.c2.btn": "Explore Signature",
    "coll.c3.title": "Excelsior Destination",
    "coll.c3.desc1": "The ultimate premium tier.",
    "coll.c3.desc2": "Unparalleled luxury, exclusive access, and world-class experiences designed for the most demanding traveler.",
    "coll.c3.desc3": "This is the top-tier, luxury offering featuring 5-star, one-of-a-kind experiences.",
    "coll.c3.bold": "They include highly personalized, end-to-end service:",
    "coll.c3.l1": "A designated Personal Excelsior Coordinator assigned from the moment of booking.",
    "coll.c3.l2": "Premium logistics, including a private car pick-up from home to the departure terminal.",
    "coll.c3.l3": "Included fast track and lounge access at the airport.",
    "coll.c3.btn": "Explore Excelsior",

    "focus.kicker": "Selected focus",
    "focus.title": "Partners and places we are building around.",
    "focus.copy": "These are public-safe selected records from the SKANDI content library.",

    "links.kicker": "Helpful links",
    "links.title": "Find what you need quickly.",
    "links.copy": "Careers, press, legal policies and travel information are easy to access from one place.",
    "links.c1.title": "Careers",
    "links.c1.desc": "Join SKANDI and help build a modern travel company.",
    "links.c1.btn": "View Openings",
    "links.c2.title": "Press room",
    "links.c2.desc": "News, media assets and public announcements.",
    "links.c2.btn": "Read News",
    "links.c3.title": "Legal policies",
    "links.c3.desc": "Privacy, cookies, accessibility, booking terms and notices.",
    "links.c3.btn": "Read Terms",
    "links.c4.title": "Travel info",
    "links.c4.desc": "Practical travel help, flight status and guidance.",
    "links.c4.btn": "Explore Guides",

    "cta.title": "Explore travel the SKANDI way.",
    "cta.copy": "Join SKANDI Club, browse the SKANDI Collection, or learn more about our policies, careers and press information.",
    "cta.btn1": "SKANDI Collection",
    "cta.btn2": "SKANDI Club",

    // Footer
  },
  SV: {
    
    // Page Content
    "hero.kicker": "Om SKANDI",
    "hero.title": "Handplockade Upplevelser - <br> <strong>Resor med Skandinavisk omtanke.</strong>",
    "hero.copy": "SKANDI är skapat för dig som vill ha ett tryggt, bekvämt och noga utvalt sätt att upptäcka världen – med extra guldkant.",    
    "hero.btnClub": "Bli medlem",
    "hero.btnSig": "Utforska SKANDI Collection",
    
    "sec1.kicker": "Vilka vi är",
    "sec1.title": "Nästa generations charterresor",
    "sec1.copy": "Du vet redan hur en bra charterresa känns – tryggt, bekvämt och okomplicerat. SKANDI tar den klassiska svenska charterupplevelsen och lyfter den till en helt ny premiumnivå. Vi kombinerar handplockade hotell och hög personlig service med smarta digitala verktyg. Upptäck världen, och framförallt USA och Asien, med skandinavisk omsorg från bokning till hemresa.",    
    "sec1.card1.title": "Klassisk trygghet",
    "sec1.card1.desc": "Samma trygga charterkänsla du är van vid – men med handplockade destinationer och mer flexibilitet.",
    "sec1.card1.btn": "Vårt koncept",
    "sec1.card2.title": "Premium &amp Förfinat",
    "sec1.card2.desc": "En modern reseupplevelse med högre servicenivå, noga utvalda hotell och smidiga digitala lösningar.",
    "sec1.card2.btn": "Läs mer",
    "sec1.card3.title": "Fokus på hela världen",
    "sec1.card3.desc": "Vi gör det lika enkelt och tryggt att resa till New York eller Phuket som till Medelhavet.",
    "sec1.card3.btn": "Våra destinationer",
    
    "sec2.kicker": "Vår Berättelse",
    "sec2.title": "Charter i vårt DNA",
    "sec2.copy": "SKANDI startade utifrån en enkel tanke: vi svenskar älskar charter, men ibland vill vi ha något mer.<br><br>För oss är charter mer än en paketresa – det är en kultur av trygghet, bekvämlighet och total avkoppling. Det är vetskapen om att transfern väntar, att hotellet håller måttet och att någon alltid finns där om det behövs.<br><br>Vi skapade SKANDI för att ta exakt den känslan in i en ny era. Mindre massproduktion och mer omsorg. Vi erbjuder premiumresor till spännande destinationer över hela världen, paketerade med samma trygghet som du alltid har uppskattat.",
    "coll.kicker": "SKANDI COLLECTION",
    "coll.title": "Ett utvalt sätt att resa.",
    "coll.tab1": "Destinationer",
    "coll.tab2": "Flygbolag",
    "coll.tab3": "Flygplatser",
    "coll.c1.title": "Select Destinationer",
    "coll.c1.desc1": "Noga utvalda och inspirerande städer som erbjuder mycket för pengarna och en smidig, självständig reseupplevelse.",    
    "coll.c1.desc2": "För dig som vill ha frihet att utforska på egen hand, men med vår trygghet i ryggen.",    
    "coll.c1.bold": "Detta ingår:",
    "coll.c1.l1": "Ett brett utbud av digitala guider och tjänster.",    
    "coll.c1.l2": "Handplockade tips på aktiviteter, sevärdheter och restauranger.",    
    "coll.c1.btn": "Utforska <strong>Select</strong>",
    "coll.c2.title": "Signature Destinationer",
    "coll.c2.desc1": "Kärnan i SKANDI. Handplockade pärlor över hela världen som perfekt matchar vår filosofi om trygga och minnesvärda resor.",    
    "coll.c2.desc2": "Här får du den klassiska charterupplevelsen med full service på plats.",    
    "coll.c2.bold": "Detta ingår:",
    "coll.c2.l1": "Ett dedikerat team som möter dig på flygplatsen.",    
    "coll.c2.l2": "Möjlighet till bekväm direkttransfer till hotellet med SKANDI:s egna bussar.",    "coll.c2.l3": "Kvalitetssäkrade hotell med regelbundna besök av vår personal.",
    "coll.c2.btn": "Utforska Signature",
    
    "coll.c3.title": "Excelsior Destinationer",
    "coll.c3.desc1": "Den ultimata premiumnivån.",
    "coll.c3.desc2": "Oöverträffad lyx och exklusiva upplevelser i världsklass, designade för dig som ställer högsta krav.",
    "coll.c3.desc3": "Vårt allra bästa urval av 5-stjärniga, unika upplevelser.",
    "coll.c3.bold": "Personlig VIP-service hela vägen:",
    "coll.c3.l1": "En personlig Excelsior-koordinator från bokning till hemkomst.",
    "coll.c3.l2": "Premiumlogistik, inklusive privat transfer från dörr till dörr.",
    "coll.c3.l3": "Inkluderad Fast Track och lounge-tillgång på flygplatsen.",
    "coll.c3.btn": "Utforska Excelsior",

    "focus.kicker": "Noga utvalt",
    "focus.title": "Våra närmaste partners",
    "focus.copy": "Handplockade favoriter och hotell från SKANDI:s utbud.",

    "links.kicker": "Genvägar",
    "links.title": "Hitta snabbt det du söker.",
    "links.copy": "Allt från reseinformation till lediga tjänster och våra villkor, samlat på ett och samma ställe.",
    "links.c1.title": "Karriär",
    "links.c1.desc": "Bli en del av SKANDI och hjälp oss forma framtidens resor.",
    "links.c1.btn": "Lediga tjänster",
    "links.c2.title": "Pressrum",
    "links.c2.desc": "Senaste nytt, pressmeddelanden, mediamaterial.",
    "links.c2.btn": "Läs Nyheter",
    "links.c3.title": "Vilkor &amp Policies",
    "links.c3.desc": "Allt om integritet, bokningsvillkor och dina rättigheter som resenär.",
    "links.c3.btn": "Läs Villkor",
    "links.c4.title": "Reseinfo",
    "links.c4.desc": "Praktiska tips, flygstatus och guidning inför resan.",
    "links.c4.btn": "Se mer",

    "cta.title": "Upptäck världen på SKANDI-sättet.",
    "cta.copy": "Gå med i SKANDI Club, bläddra i SKANDI Collection eller lär dig mer om våra policyer, karriärer och pressinformation.",
    "cta.btn1": "SKANDI Collection",
    "cta.btn2": "SKANDI Club",

    // Footer
  }
};


// ==========================================================================
// B-011.3 ABOUT PAGE RUNTIME
// Global chrome/settings/routes are owned by masterPage.js.
// ==========================================================================
const SOURCE = "SKANDI_ABOUT_PAGE";
const PARENT = "SKANDI_WIX_PARENT";
const PARENT_ORIGIN = (() => {
  try { return document.referrer ? new URL(document.referrer).origin : "*"; }
  catch (_) { return "*"; }
})();

let MASTER = { settings:{ language:"EN", currency:"USD" }, routes:{} };
let DATA = { settings:{}, facts:[], timeline:[], partners:[], collection:{items:[],tiers:{},counts:{}} };
let collectionTypeFilter = "all";
let lastRequestedLanguage = "";

const $ = id => document.getElementById(id);
const esc = value => String(value ?? "").replace(/[&<>'"]/g, c => ({
  "&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"
}[c]));

function post(type, payload = {}) {
  window.parent.postMessage({
    source: SOURCE,
    type,
    payload,
    timestamp: new Date().toISOString()
  }, PARENT_ORIGIN);
}

function currentLang() {
  const lang = String(MASTER?.settings?.language || "EN").trim().toUpperCase();
  return ["EN","SV","NO","DA"].includes(lang) ? lang : "EN";
}

function tr(key, fallback = "") {
  const dict = I18N[currentLang()] || I18N.EN || {};
  return dict[key] ?? I18N.EN?.[key] ?? fallback;
}

function masterRoute(key, fallback = "/") {
  const value = String(MASTER?.routes?.[key] || "").trim();
  return value.startsWith("/") ? value : fallback;
}

function navTo(path) {
  const target = String(path || "").trim();
  if (!target) return;
  post("ABOUT_NAVIGATE", { path: target });
}

function requestAbout(force = false) {
  const language = currentLang();
  if (!force && language === lastRequestedLanguage) return;
  lastRequestedLanguage = language;
  post("ABOUT_PAGE_REFRESH", { language });
}

const COLLECTION_META = {
  SELECT: {
    titleKey:"coll.c1.title",
    descKey:"coll.c1.desc1",
    ribbon:"https://static.wixstatic.com/media/394052_fcc4eff0abf64dd88cdead7a4ceae0bc~mv2.png",
    buttonKey:"coll.c1.btn"
  },
  SIGNATURE: {
    titleKey:"coll.c2.title",
    descKey:"coll.c2.desc1",
    ribbon:"https://static.wixstatic.com/media/394052_f6c11efe799b4b02b8e6d9a0efa623a1~mv2.png",
    buttonKey:"coll.c2.btn"
  },
  EXCELSIOR: {
    titleKey:"coll.c3.title",
    descKey:"coll.c3.desc2",
    ribbon:"https://static.wixstatic.com/media/394052_d74d296ebed8436e9f08ff9c0bc2c2a3~mv2.png",
    buttonKey:"coll.c3.btn"
  }
};

function typeLabel(type) {
  return ({
    destinations:"Destinations",
    hotels:"Hotels",
    tours:"Tours & Activities",
    airlines:"Airlines",
    airports:"Airports",
    packages:"Packages",
    transfers:"Transfers",
    "car-rental":"Car Rental"
  })[type] || type || "Selected";
}

function applyTranslations() {
  const dict = I18N[currentLang()] || I18N.EN || {};
  document.documentElement.lang = currentLang().toLowerCase();
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    const value = dict[key] ?? I18N.EN?.[key];
    if (value !== undefined) el.innerHTML = value;
  });
}

function renderCollection() {
  const liveState = $("collectionLiveState");
  const grid = $("collectionGrid");
  const tabs = $("collectionTypeTabs");
  if (!liveState || !grid || !tabs) return;

  const items = Array.isArray(DATA.collection?.items) ? DATA.collection.items : [];
  const availableTypes = [...new Set(items.map(x => x.type).filter(Boolean))];
  const tabDefs = [
    {key:"all",label:"All"},
    ...availableTypes.map(key => ({key,label:typeLabel(key)}))
  ];

  tabs.innerHTML = tabDefs.map(t => `
    <button class="collection-tab ${collectionTypeFilter===t.key?"active":""}"
      type="button" data-collection-type="${esc(t.key)}">${esc(t.label)}</button>
  `).join("");

  tabs.querySelectorAll("[data-collection-type]").forEach(btn => {
    btn.addEventListener("click", () => {
      collectionTypeFilter = btn.dataset.collectionType || "all";
      renderCollection();
    });
  });

  const visible = collectionTypeFilter === "all"
    ? items
    : items.filter(x => x.type === collectionTypeFilter);

  if (!visible.length) {
    liveState.classList.remove("hidden");
    liveState.textContent = items.length
      ? `No ${typeLabel(collectionTypeFilter).toLowerCase()} are currently assigned to Select, Signature or Excelsior in Inventory Control.`
      : "No published customer-visible Select, Signature or Excelsior records are currently assigned in Inventory Control.";
    grid.innerHTML = "";
    return;
  }

  liveState.classList.add("hidden");
  const tierOrder = ["SELECT","SIGNATURE","EXCELSIOR"];

  grid.innerHTML = tierOrder.map(tier => {
    const tierItems = visible.filter(x => x.tier === tier);
    if (!tierItems.length) return "";
    const meta = COLLECTION_META[tier];
    const image = tierItems.find(x => x.imageUrl)?.imageUrl || "";
    const typeSummary = [...new Set(tierItems.map(x => typeLabel(x.type)))].join(" · ");
    const examples = tierItems.slice(0,4).map(x => `<li>${esc(x.title)}</li>`).join("");
    return `<article class="collection-card" data-live-tier="${tier}">
      <div class="collection-img-wrap" data-media-id="about-collection-${tier.toLowerCase()}-media">
        ${image
          ? `<img class="collection-main-img" src="${esc(image)}" alt="${esc(tierItems[0]?.title || tier)}">`
          : `<div class="collection-img-placeholder">${esc(tier)}</div>`}
        <div class="collection-img-overlay"></div>
        <img class="collection-ribbon" src="${esc(meta.ribbon)}" alt="${esc(tier)}">
      </div>
      <div class="collection-content">
        <div class="live-count">${tierItems.length} live ${tierItems.length===1?"selection":"selections"}</div>
        <h3 class="collection-title">${tr(meta.titleKey, tier)}</h3>
        <div class="collection-desc">${tr(meta.descKey, "")}</div>
        <div class="collection-source">${esc(typeSummary)}</div>
        <ul class="live-examples">${examples}</ul>
        <button class="btn btn-secondary" style="width:100%;" type="button"
          data-tier-link="${tier.toLowerCase()}">${tr(meta.buttonKey, `Explore ${tier}`)}</button>
      </div>
    </article>`;
  }).join("") || `<div class="notice collection-empty">No tiered SKANDI Collection inventory is available for this filter.</div>`;

  grid.querySelectorAll("[data-tier-link]").forEach(btn => {
    btn.addEventListener("click", () => {
      const base = masterRoute("skandiCollection", "/skandi-collection");
      navTo(`${base}?tier=${encodeURIComponent(btn.dataset.tierLink || "")}`);
    });
  });
}

function renderData() {
  const s = DATA.settings || {};
  if (s.heroImageUrl && $("hero")) {
    $("hero").style.setProperty("--hero-image", `url("${String(s.heroImageUrl).replace(/"/g,"%22")}")`);
  }

  const facts = DATA.facts?.length ? DATA.facts : [
    {label:"Founded with", value:"Care", description:"Every trip is designed with human oversight."},
    {label:"Focus", value:"Selected travel", description:"Quality over quantity in our offerings."},
    {label:"Portal", value:"Connected", description:"Seamless transition from booking to traveling."}
  ];
  if ($("facts")) {
    $("facts").innerHTML = facts.map((f,index) => `
      <div class="fact" data-content-id="about-story-fact-${index+1}">
        <small>${esc(f.label)}</small><strong>${esc(f.value)}</strong><p>${esc(f.description||"")}</p>
      </div>`).join("");
  }

  const timeline = DATA.timeline?.length ? DATA.timeline : [
    {year:"Start", title:"A more personal travel idea", body:"SKANDI was created to make travel easier to understand and more carefully selected."},
    {year:"Now", title:"Connected customer and operations tools", body:"Public pages, customer profiles and internal travel operations are being connected into one SKANDI platform."}
  ];
  if ($("timeline")) {
    $("timeline").innerHTML = timeline.map((x,index) => `
      <article class="milestone" data-content-id="about-story-milestone-${index+1}">
        <div class="milestone-node"><div class="core"></div><div class="radar"></div></div>
        <div class="year">${esc(x.year)}</div>
        <div class="ms-content"><h3>${esc(x.title)}</h3><p>${esc(x.body)}</p></div>
      </article>`).join("");
  }

  const partners = DATA.partners?.length ? DATA.partners : [];
  if ($("partners")) {
    $("partners").innerHTML = partners.length
      ? partners.slice(0,12).map((p,index) => `
          <div class="partner" data-content-id="about-focus-partner-${index+1}">
            <b>${esc(p.title||p.name)}</b>
            <span>${esc(p.tier ? `${p.tier} · ${p.typeLabel||p.type||"Selected"}` : p.collectionLabel||p.typeLabel||p.type||"Selected")}</span>
          </div>`).join("")
      : `<div class="notice">Published SKANDI Collection / SKANDI Partner records marked in Inventory Control will appear here.</div>`;
  }

  renderCollection();
}

function bindNavigation() {
  document.querySelectorAll("a[data-route-key]").forEach(link => {
    link.addEventListener("click", event => {
      event.preventDefault();
      const key = link.dataset.routeKey || "";
      const fallback = link.dataset.fallbackPath || link.getAttribute("href") || "/";
      navTo(masterRoute(key, fallback));
    });
  });
}

window.addEventListener("message", event => {
  let msg = event.data;
  if (typeof msg === "string") {
    try { msg = JSON.parse(msg); } catch (_) { return; }
  }
  if (!msg || typeof msg !== "object") return;
  if (msg.source && msg.source !== PARENT) return;

  if (msg.type === "SKANDI_MASTER_CONFIG") {
    const previous = currentLang();
    MASTER = {
      ...MASTER,
      ...(msg.payload || {}),
      settings:{ ...(MASTER.settings||{}), ...(msg.payload?.settings||{}) },
      routes:{ ...(MASTER.routes||{}), ...(msg.payload?.routes||{}) }
    };
    applyTranslations();
    bindNavigation();
    if (currentLang() !== previous || !lastRequestedLanguage) requestAbout(true);
    return;
  }

  if (msg.type === "ABOUT_PAGE_LOADING") {
    const state = $("collectionLiveState");
    if (state) {
      state.classList.remove("hidden");
      state.textContent = "Loading live SKANDI Collection inventory…";
    }
    return;
  }

  if (msg.type === "ABOUT_PAGE_DATA") {
    DATA = {
      ...DATA,
      ...(msg.payload || {}),
      collection:{ ...(DATA.collection||{}), ...(msg.payload?.collection||{}) }
    };
    renderData();
    return;
  }

  if (msg.type === "ABOUT_PAGE_ERROR") {
    const state = $("collectionLiveState");
    if (state) {
      state.classList.remove("hidden");
      state.textContent = msg.payload?.message || "SKANDI Collection inventory is currently unavailable.";
    }
    if ($("collectionGrid")) $("collectionGrid").innerHTML = "";
  }
});

applyTranslations();
renderData();
bindNavigation();
post("MASTER_CONFIG_REQUEST", {});
post("ABOUT_PAGE_READY", { language: currentLang() });

</script>
</body>
</html>
```
