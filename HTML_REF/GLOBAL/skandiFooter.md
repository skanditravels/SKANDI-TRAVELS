# GLOBAL SKANDI TRAVELS FOOTER

STATUS: V12 VISUAL UPGRADE PREPARED — REQUIRES LIVE TEST
SLUG: GLOBAL SECTION
WIX PAGE: `masterPage.js`
AREA: SKANDI
LIVE HTML: INTENDED EMBED REPLACEMENT ONLY; NOT DEPLOYED BY THIS PACKAGE
ELEMENT: `#skandiFooterEmbed` / `#skandiCustomerFooterEmbed`
LAST SOURCE REVIEW: 2026-10-30

## INFO
- Source basis: `skanditravels/SKANDI-TRAVELS`, `main`, `HTML_REF/GLOBAL/skandiFooter.md`, canonical reference as reviewed on 2026-10-22.
- The 2026-10-13 legal/footer architecture has been reconciled from the current reference, including six canonical utility links and separate Staff Login.
- Preserves logo / wordmark assets, dynamic footer columns, social links, newsletter subscription, incoming master config, legal routes, and all `FOOTER_*` / master messages.
- Footer legal routes continue to derive from the canonical MASTER_CONFIG routes. No page/backend integrations changed.
- Visual theme: Nordic Horizon — deep SKANDI navy #022e64, glacier cyan #5FC7CF, polar white #FFFFFF, glacier ice #F6FAFF.
- Mobile text-entry controls maintain the 16px minimum focus rule without disabling zoom.
- Static verification only. Responsive footer height and live newsletter/legal navigation require Wix smoke tests.

## CHANGE LOG
- 2026-10-30 — Active Git footer: enlarged the customerFooter mark and placed the master-config skandiWave mark left-aligned directly beneath the social links. Social icon rendering remains master-config driven. The masterPage controller remains the asset authority; no page-controller change is included here.
- 2026-10-30 — Shared master branding: customerFooter and groupFooter are resolved from masterPage.js, and footer slogans follow currentBranch and settings.language.
- 2026-10-13 — Legal/footer V12 sync: canonical legal utility links, separate Staff Login, brand/legal copy, and masterPage navigation unchanged.
- 2026-10-13 — Mobile focus guard added to newsletter text-entry field.
- 2026-10-22 — Nordic Horizon visual redesign of newsletter, dark-blue main footer, four-column layout, cyan headings, social controls, legal and copyright bands. Previous behavior and routing preserved.

## COMPLETE INTENDED LIVE HTML SOURCE

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"/>
<meta name="theme-color" content="#022e64"/>
<title>SKANDI Customer Footer</title>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet"/>

<style>
:root{
  --sk-navy:#022e64;
  --sk-blue:#0b3a7a;
  --sk-blue-soft:#1f6ba3;
  --sk-ink:#03111f;
  --sk-ink-soft:#061a30;
  --sk-aqua:#5fc7cf;
  --sk-aqua-soft:#9de0e5;
  --sk-ivory:#fbfaf6;
  --sk-porcelain:#f5f1ea;
  --sk-champagne:#d1bc98;
  --sk-limestone:#d8d2c8;
  --sk-graphite:#1a1a1a;
  --sk-muted:#66758a;
  --sk-line:rgba(2,46,100,.12);
  --sk-line-light:rgba(255,255,255,.14);
  --sk-footer-max:1320px;
}

*{box-sizing:border-box;margin:0;padding:0}

html,body{
  width:100%;
  min-width:320px;
  background:transparent;
  color:var(--sk-ivory);
  font-family:"Montserrat",system-ui,-apple-system,"Segoe UI",sans-serif;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
  overflow-x:hidden;
}

button,input{font:inherit}
button{cursor:pointer}
img{display:block;max-width:100%}

button:focus-visible,
input:focus-visible{
  outline:2px solid var(--sk-aqua);
  outline-offset:3px;
}

#skandi-site-footer{
  width:100%;
  display:block;
  position:relative;
  isolation:isolate;
}

#skandi-site-footer .footer{
  position:relative;
  width:100%;
  overflow:hidden;
  color:var(--sk-ivory);
  background:
    radial-gradient(circle at 8% 8%,rgba(95,199,207,.12),transparent 27%),
    radial-gradient(circle at 86% 24%,rgba(209,188,152,.08),transparent 29%),
    linear-gradient(150deg,var(--sk-ink) 0%,var(--sk-ink-soft) 34%,var(--sk-navy) 72%,var(--sk-blue) 100%);
}

#skandi-site-footer .footer::before{
  content:"";
  position:absolute;
  inset:0;
  pointer-events:none;
  opacity:.42;
  background:
    linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px),
    linear-gradient(rgba(255,255,255,.02) 1px,transparent 1px);
  background-size:54px 54px;
  mask-image:linear-gradient(180deg,rgba(0,0,0,.20),rgba(0,0,0,.55) 46%,rgba(0,0,0,.12));
}

#skandi-site-footer .footer::after{
  content:"";
  position:absolute;
  left:0;
  right:0;
  top:0;
  height:1px;
  z-index:4;
  pointer-events:none;
  background:linear-gradient(
    90deg,
    transparent 0%,
    rgba(95,199,207,.72) 28%,
    rgba(209,188,152,.72) 70%,
    transparent 100%
  );
}

/* =========================================================
   NEWSLETTER
   Mirrors the porcelain / ivory upper chrome used by B-011.
   ========================================================= */

#skandi-site-footer .newsletter{
  position:relative;
  z-index:3;
  overflow:hidden;
  color:var(--sk-navy);
  background:
    radial-gradient(circle at 86% 0%,rgba(95,199,207,.12),transparent 25%),
    linear-gradient(180deg,rgba(251,250,246,.995),rgba(245,241,234,.985));
  border-bottom:1px solid rgba(3,17,31,.14);
  box-shadow:0 18px 54px rgba(3,17,31,.08);
}

#skandi-site-footer .newsletter::before{
  content:"";
  position:absolute;
  left:0;
  top:0;
  bottom:0;
  width:3px;
  background:linear-gradient(180deg,var(--sk-aqua),var(--sk-champagne));
}

#skandi-site-footer .news-inner{
  position:relative;
  width:min(100%,var(--sk-footer-max));
  margin:0 auto;
  padding:38px clamp(22px,4vw,52px);
  display:grid;
  grid-template-columns:minmax(0,1.18fr) minmax(360px,.82fr);
  gap:clamp(28px,5vw,72px);
  align-items:center;
}

#skandi-site-footer .newsletter h2{
  position:relative;
  margin:0;
  max-width:720px;
  color:var(--sk-navy);
  font-size:clamp(25px,2.5vw,36px);
  line-height:1.05;
  letter-spacing:-.045em;
  font-weight:600;
}

#skandi-site-footer .newsletter h2::before{
  content:"SKANDI TRAVELS · JOURNAL";
  display:block;
  margin-bottom:10px;
  color:#397f89;
  font-size:9px;
  line-height:1;
  letter-spacing:.17em;
  font-weight:850;
  text-transform:uppercase;
}

#skandi-site-footer .newsletter p{
  max-width:690px;
  margin:11px 0 0;
  color:#5d6f82;
  font-size:12px;
  line-height:1.7;
  font-weight:520;
}

#skandi-site-footer #newsletterStatus{
  min-height:18px;
  margin-top:8px;
  color:#4a6773;
  font-size:10px;
  line-height:1.4;
  font-weight:700;
}

#skandi-site-footer .news-form{
  position:relative;
  display:grid;
  grid-template-columns:minmax(0,1fr) auto;
  gap:8px;
  padding:6px;
  border:1px solid rgba(2,46,100,.12);
  border-radius:16px;
  background:rgba(255,255,255,.74);
  box-shadow:
    0 18px 42px rgba(2,46,100,.08),
    inset 0 1px 0 rgba(255,255,255,.88);
  backdrop-filter:blur(18px) saturate(120%);
  -webkit-backdrop-filter:blur(18px) saturate(120%);
}

#skandi-site-footer .news-form:focus-within{
  border-color:rgba(95,199,207,.72);
  box-shadow:
    0 18px 42px rgba(2,46,100,.10),
    0 0 0 3px rgba(95,199,207,.09),
    inset 0 1px 0 rgba(255,255,255,.92);
}

#skandi-site-footer .news-form input{
  min-width:0;
  height:44px;
  padding:0 13px;
  border:0;
  outline:0;
  border-radius:10px;
  background:transparent;
  color:var(--sk-ink);
  font-size:11px;
  font-weight:650;
}

#skandi-site-footer .news-form input::placeholder{
  color:#87929f;
  font-weight:550;
}

#skandi-site-footer .news-form button{
  position:relative;
  min-width:116px;
  height:44px;
  overflow:hidden;
  border:1px solid rgba(3,17,31,.14);
  border-radius:10px;
  background:linear-gradient(135deg,var(--sk-navy),var(--sk-ink-soft));
  color:#fff;
  box-shadow:0 8px 22px rgba(2,46,100,.16);
  padding:0 17px;
  font-size:9px;
  font-weight:850;
  letter-spacing:.09em;
  text-transform:uppercase;
  transition:
    transform .2s cubic-bezier(.16,1,.3,1),
    box-shadow .2s ease,
    border-color .2s ease,
    background .2s ease;
}

#skandi-site-footer .news-form button::before{
  content:"";
  position:absolute;
  left:12px;
  right:12px;
  top:0;
  height:2px;
  opacity:.9;
  background:linear-gradient(90deg,transparent,var(--sk-aqua),var(--sk-champagne),transparent);
}

#skandi-site-footer .news-form button:hover{
  transform:translateY(-1px);
  border-color:rgba(95,199,207,.34);
  background:var(--sk-ink);
  box-shadow:0 12px 28px rgba(2,46,100,.20);
}

/* =========================================================
   MAIN FOOTER
   ========================================================= */

#skandi-site-footer .footer-main{
  position:relative;
  z-index:2;
  width:min(100%,var(--sk-footer-max));
  margin:0 auto;
  padding:54px clamp(22px,4vw,52px) 46px;
  display:grid;
  grid-template-columns:minmax(230px,1.28fr) repeat(4,minmax(0,1fr));
  gap:clamp(18px,2.8vw,38px);
  align-items:start;
}

#skandi-site-footer .brand{
  position:relative;
  min-width:0;
  padding:18px;
  border:1px solid rgba(255,255,255,.11);
  border-radius:20px;
  background:
    radial-gradient(circle at 92% 4%,rgba(95,199,207,.10),transparent 31%),
    rgba(255,255,255,.045);
  box-shadow:0 18px 42px rgba(0,0,0,.10);
  backdrop-filter:blur(14px);
  -webkit-backdrop-filter:blur(14px);
}

#skandi-site-footer .brand::after{
  content:"";
  position:absolute;
  left:18px;
  right:18px;
  bottom:0;
  height:1px;
  opacity:.42;
  background:linear-gradient(90deg,var(--sk-aqua),var(--sk-champagne),transparent);
}

#skandi-site-footer .logo{
  width:min(190px,100%);
  max-height:62px;
  object-fit:contain;
  object-position:left center;
  margin:0 0 18px;
  padding:10px 13px;
  border:1px solid rgba(216,210,200,.86);
  border-radius:14px;
  background:rgba(251,250,246,.97);
  box-shadow:
    0 12px 28px rgba(0,0,0,.14),
    inset 0 1px 0 rgba(255,255,255,.92);
}

#skandi-site-footer .brand p{
  margin:0 0 14px;
  color:rgba(229,237,242,.64);
  font-size:11px;
  line-height:1.65;
}

#skandi-site-footer .default-bar{
  display:flex;
  align-items:center;
  gap:8px;
  margin:2px 0 14px;
  color:rgba(229,237,242,.62);
  font-size:8px;
  line-height:1.4;
  font-weight:700;
  letter-spacing:.10em;
  text-transform:uppercase;
}

#skandi-site-footer .default-bar span{
  color:var(--sk-aqua-soft);
  font-weight:850;
  letter-spacing:.13em;
}

#skandi-site-footer .social-links{
  display:flex;
  align-items:center;
  flex-wrap:wrap;
  gap:8px;
  margin-top:4px;
}

#skandi-site-footer .social-btn{
  width:36px;
  height:36px;
  flex:0 0 36px;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  padding:8px;
  border:1px solid rgba(255,255,255,.12);
  border-radius:50%;
  background:rgba(255,255,255,.055);
  color:#fff;
  transition:
    transform .22s cubic-bezier(.16,1,.3,1),
    background .18s ease,
    border-color .18s ease,
    box-shadow .18s ease;
}

#skandi-site-footer .social-btn img{
  width:18px;
  height:18px;
  object-fit:contain;
}

#skandi-site-footer .social-btn:hover{
  transform:translateY(-2px);
  border-color:rgba(95,199,207,.58);
  background:rgba(95,199,207,.10);
  box-shadow:0 10px 24px rgba(0,0,0,.16);
}

#skandi-site-footer .col{
  min-width:0;
  padding:17px 14px 18px;
  border:1px solid transparent;
  border-radius:16px;
  transition:
    background .18s ease,
    border-color .18s ease,
    transform .22s cubic-bezier(.16,1,.3,1);
}

#skandi-site-footer .col:hover{
  transform:translateY(-2px);
  border-color:rgba(255,255,255,.10);
  background:rgba(255,255,255,.035);
}

#skandi-site-footer .col h3{
  position:relative;
  display:block;
  margin:0 0 17px;
  padding:0 0 10px;
  color:var(--sk-champagne);
  font-size:8px;
  line-height:1.25;
  font-weight:850;
  letter-spacing:.15em;
  text-transform:uppercase;
}

#skandi-site-footer .col h3::after{
  content:"";
  position:absolute;
  left:0;
  bottom:0;
  width:32px;
  height:2px;
  border-radius:999px;
  background:linear-gradient(90deg,var(--sk-aqua),var(--sk-champagne));
  transition:width .22s ease;
}

#skandi-site-footer .col:hover h3::after{width:48px}

#skandi-site-footer .col button{
  position:relative;
  display:block;
  width:max-content;
  max-width:100%;
  margin:0 0 9px;
  padding:2px 0;
  border:0;
  background:transparent;
  color:rgba(225,234,240,.67);
  text-align:left;
  font-size:10px;
  line-height:1.45;
  font-weight:620;
  transition:
    color .18s ease,
    transform .2s cubic-bezier(.16,1,.3,1);
}

#skandi-site-footer .col button::after{
  content:"";
  position:absolute;
  left:0;
  bottom:0;
  width:0;
  height:1px;
  background:var(--sk-aqua);
  transition:width .22s ease;
}

#skandi-site-footer .col button:hover{
  color:var(--sk-ivory);
  transform:translateX(3px);
}

#skandi-site-footer .col button:hover::after{width:100%}

/* =========================================================
   LEGAL / UTILITY STRIP
   ========================================================= */

#skandi-site-footer .footer-bottom{
  position:relative;
  z-index:2;
  border-top:1px solid rgba(255,255,255,.10);
  background:rgba(3,17,31,.46);
}

#skandi-site-footer .footer-bottom::before{
  content:"";
  position:absolute;
  left:clamp(22px,4vw,52px);
  right:clamp(22px,4vw,52px);
  top:-1px;
  height:1px;
  opacity:.48;
  background:linear-gradient(90deg,transparent,var(--sk-champagne),var(--sk-aqua),transparent);
}

#skandi-site-footer .bottom-inner{
  width:min(100%,var(--sk-footer-max));
  margin:0 auto;
  padding:22px clamp(22px,4vw,52px) 25px;
  display:grid;
  grid-template-columns:minmax(260px,1.25fr) minmax(240px,.95fr) auto;
  gap:18px 28px;
  align-items:center;
  color:rgba(215,227,235,.58);
  font-size:9px;
  line-height:1.65;
}

#skandi-site-footer #footerTerms{
  margin:0!important;
  color:rgba(225,234,240,.66);
  font-style:normal!important;
  white-space:pre-line;
}

#skandi-site-footer .bottom-links{
  display:flex;
  justify-content:flex-end;
  align-items:center;
  flex-wrap:wrap;
  gap:7px;
}

#skandi-site-footer .bottom-links button{
  min-height:30px;
  padding:0 10px;
  border:1px solid rgba(255,255,255,.10);
  border-radius:999px;
  background:rgba(255,255,255,.04);
  color:rgba(235,241,245,.70);
  font-size:8px;
  line-height:1;
  font-weight:800;
  letter-spacing:.04em;
  transition:
    color .18s ease,
    border-color .18s ease,
    background .18s ease,
    transform .18s ease;
}

#skandi-site-footer .bottom-links button:hover{
  transform:translateY(-1px);
  color:#fff;
  border-color:rgba(95,199,207,.42);
  background:rgba(95,199,207,.08);
}

#skandi-site-footer .member-logo{
  max-width:116px;
  max-height:34px;
  object-fit:contain;
  padding:5px 8px;
  border:1px solid rgba(255,255,255,.10);
  border-radius:9px;
  background:rgba(251,250,246,.92);
}

/* =========================================================
   RESPONSIVE
   ========================================================= */

@media(max-width:1120px){
  #skandi-site-footer .footer-main{
    grid-template-columns:repeat(2,minmax(0,1fr));
  }

  #skandi-site-footer .brand{
    grid-column:1 / -1;
    display:grid;
    grid-template-columns:minmax(180px,240px) 1fr;
    gap:22px;
    align-items:center;
  }

  #skandi-site-footer .brand .social-links{
    margin-top:0;
    justify-content:flex-start;
  }

  #skandi-site-footer .bottom-inner{
    grid-template-columns:1fr 1fr;
  }

  #skandi-site-footer .bottom-links{
    grid-column:1 / -1;
    justify-content:flex-start;
  }
}

@media(max-width:860px){
  #skandi-site-footer .news-inner{
    grid-template-columns:1fr;
    gap:22px;
  }

  #skandi-site-footer .footer-main{
    padding-top:42px;
  }
}

@media(max-width:640px){
  #skandi-site-footer .news-inner{
    padding:31px 20px;
  }

  #skandi-site-footer .newsletter h2{
    font-size:29px;
  }

  #skandi-site-footer .news-form{
    grid-template-columns:1fr;
    border-radius:15px;
  }

  #skandi-site-footer .news-form button{
    width:100%;
  }

  #skandi-site-footer .footer-main{
    grid-template-columns:1fr;
    gap:8px;
    padding:34px 20px 30px;
  }

  #skandi-site-footer .brand{
    grid-column:auto;
    display:block;
    margin-bottom:14px;
  }

  #skandi-site-footer .brand .social-links{
    margin-top:4px;
  }

  #skandi-site-footer .col{
    padding:16px 12px;
  }

  #skandi-site-footer .bottom-inner{
    grid-template-columns:1fr;
    padding:21px 20px 24px;
  }

  #skandi-site-footer .bottom-links{
    grid-column:auto;
    justify-content:flex-start;
  }
}

@media(prefers-reduced-motion:reduce){
  #skandi-site-footer *,
  #skandi-site-footer *::before,
  #skandi-site-footer *::after{
    scroll-behavior:auto!important;
    animation:none!important;
    transition-duration:.01ms!important;
  }
}
/* Mobile input size invariant / preserve user zoom. */
@media (max-width:767px){
  input[type="text"],input[type="search"],input[type="email"],input[type="password"],
  input[type="tel"],input[type="url"],input[type="number"],input[type="date"],
  input[type="time"],input[type="datetime-local"],input[type="month"],input[type="week"],
  input:not([type]),select,textarea{font-size:16px!important}
}

/* ======================================================================
   SKANDI CUSTOMER CHROME / NORDIC HORIZON DESIGN — 2026-10-22
   Presentation-only. The canonical masterPage owns content, routes, account
   state, all newsletter/social actions and regional language/currency settings.
   ====================================================================== */
:root{
  --sk-navy:#022e64;
  --sk-blue:#104b80;
  --sk-blue-soft:#286a98;
  --sk-ink:#041b35;
  --sk-ink-soft:#07264b;
  --sk-aqua:#5fc7cf;
  --sk-aqua-soft:#a6e9ec;
  --sk-ivory:#f6faff;
  --sk-porcelain:#ffffff;
  --sk-champagne:#a6e9ec;
  --sk-limestone:#d9e7f0;
  --sk-graphite:#0b2946;
  --sk-muted:#7f9db5;
  --sk-line:rgba(2,46,100,.13);
  --sk-line-light:rgba(255,255,255,.15);
  --sk-footer-max:1400px;
}
#skandi-site-footer .footer{
  color:#f5faff;
  background:radial-gradient(ellipse at 90% 9%,rgba(95,199,207,.15),transparent 35%),
    radial-gradient(ellipse at 4% 94%,rgba(95,199,207,.11),transparent 40%),
    linear-gradient(118deg,#041a34 0%,#022e64 72%,#063b6d 100%);
}
#skandi-site-footer .footer::before{
  opacity:.23;
  background:linear-gradient(90deg,rgba(255,255,255,.024) 1px,transparent 1px),
    linear-gradient(rgba(255,255,255,.024) 1px,transparent 1px);
  background-size:72px 72px;
}
#skandi-site-footer .footer::after{
  height:2px;
  background:linear-gradient(90deg,#022e64 4%,#5fc7cf 43%,#b8eaf0 64%,#022e64 97%);
}
#skandi-site-footer .newsletter{
  color:#022e64;
  background:radial-gradient(circle at 92% 3%,rgba(95,199,207,.15),transparent 27%),
    linear-gradient(108deg,#fff 0%,#f6faff 68%,#eef9fc 100%);
  border-bottom:1px solid rgba(2,46,100,.1);
  box-shadow:0 16px 34px rgba(2,30,60,.10);
}
#skandi-site-footer .newsletter::before{
  width:4px;
  background:linear-gradient(180deg,#5fc7cf,#022e64);
}
#skandi-site-footer .news-inner{padding-top:42px;padding-bottom:42px}
#skandi-site-footer .newsletter h2{
  color:#022e64;
  font-weight:680;
  letter-spacing:-.04em;
  line-height:1.14;
}
#skandi-site-footer .newsletter h2::before{
  color:#237e88;
  letter-spacing:.20em;
}
#skandi-site-footer .newsletter p{color:#4f6880;font-size:12px}
#skandi-site-footer .news-form{
  background:#fff;
  border:1px solid rgba(2,46,100,.18);
  box-shadow:0 14px 36px rgba(2,46,100,.08);
}
#skandi-site-footer .news-form:focus-within{
  border-color:#5fc7cf;
  box-shadow:0 0 0 3px rgba(95,199,207,.16),0 14px 36px rgba(2,46,100,.08);
}
#skandi-site-footer .news-form button{
  background:linear-gradient(116deg,#022e64,#0b4d78);
  color:#fff;
  border-color:#022e64;
  letter-spacing:.08em;
}
#skandi-site-footer .news-form button:hover{
  border-color:#5fc7cf;
  background:linear-gradient(116deg,#0b4d78,#022e64);
}
/* Four data-driven columns in a single stable grid (no display:contents). */
#skandi-site-footer .footer-main{
  display:grid;
  grid-template-columns:minmax(190px,1fr) minmax(0,2.8fr);
  gap:clamp(32px,4.2vw,66px);
  padding:59px clamp(22px,4vw,52px) 55px;
  align-items:start;
}
#skandi-site-footer .brand{
  min-width:0;
  border-radius:14px;
  padding:0;
  background:none;
  border:none;
  box-shadow:none;
  backdrop-filter:none;
}
#skandi-site-footer .logo{
  display:block;
  width:min(230px,100%);
  max-height:94px;
  object-fit:contain;
  object-position:left center;
  margin:0 0 24px;
  padding:0;
  border:0;
  border-radius:0;
  background:transparent;
  box-shadow:none;
}
#skandi-site-footer .social-links{display:flex;gap:10px;flex-wrap:wrap}
#skandi-site-footer .social-btn{
  border:1px solid rgba(95,199,207,.29);
  background:rgba(255,255,255,.045);
  box-shadow:none;
  border-radius:10px;
}
#skandi-site-footer .social-btn:hover{
  border-color:#5fc7cf;
  background:rgba(95,199,207,.13);
}
#skandi-site-footer #footerColumns{
  width:100%;
  min-width:0;
  display:grid;
  grid-template-columns:repeat(4,minmax(0,1fr));
  gap:clamp(18px,2vw,35px);
}
#skandi-site-footer .col{min-width:0}
#skandi-site-footer .col h3{
  color:#a6e9ec;
  font-size:10px;
  letter-spacing:.13em;
  font-weight:850;
}
#skandi-site-footer .col h3::after{
  width:28px;height:2px;
  background:#5fc7cf;
}
#skandi-site-footer .col button{
  color:#dcebf3;
  font-size:11px;
  line-height:1.65;
  transition:color .18s ease,transform .18s ease;
}
#skandi-site-footer .col button:hover{color:#fff}
#skandi-site-footer .footer-bottom{
  background:rgba(2,20,42,.60);
  border-top:1px solid rgba(95,199,207,.20);
}
#skandi-site-footer .bottom-row{
  width:min(100%,var(--sk-footer-max));
  margin:0 auto;
  padding:22px clamp(22px,4vw,52px);
  display:flex;
  justify-content:space-between;
  align-items:flex-start;
  flex-wrap:wrap;
  gap:18px 30px;
}
#skandi-site-footer .legal-text-container{
  flex:1 1 370px;
  min-width:0;
}
#skandi-site-footer #footerTerms{
  margin:0;
  font-size:10px;
  line-height:1.75;
  color:rgba(222,236,246,.75);
}
#skandi-site-footer .bottom-actions{
  flex:1 1 500px;
  min-width:0;
  display:flex;
  align-items:flex-start;
  justify-content:flex-end;
  flex-wrap:wrap;
  gap:12px;
}
#skandi-site-footer .bottom-links{
  display:flex;
  justify-content:flex-end;
  align-items:center;
  flex-wrap:wrap;
  gap:7px 14px;
}
#skandi-site-footer .bottom-links button{
  border:0;
  padding:4px 0;
  background:transparent;
  color:#d8e6f0;
  font-size:10px;
  border-bottom:1px solid transparent;
}
#skandi-site-footer .bottom-links button:hover{
  color:#a6e9ec;
  border-bottom-color:#5fc7cf;
}
#skandi-site-footer .staff-login-btn{
  flex:0 0 auto;
  min-height:33px;
  padding:0 13px;
  border:1px solid rgba(95,199,207,.32);
  border-radius:8px;
  background:rgba(95,199,207,.08);
  color:#d9f8fa;
  font-size:10px;
  font-weight:750;
  cursor:pointer;
}
#skandi-site-footer .staff-login-btn:hover{
  border-color:#5fc7cf;
  background:rgba(95,199,207,.18);
}
#skandi-site-footer .bottom-row.copy-row{
  border-top:1px solid rgba(255,255,255,.09);
  align-items:center;
  padding-top:14px;
  padding-bottom:18px;
}
#skandi-site-footer .copyright-text{
  color:rgba(220,235,245,.63);
  font-size:9px;
  line-height:1.75;
  max-width:950px;
}
#skandi-site-footer .wordmark-logo{
  max-width:130px;
  max-height:32px;
  object-fit:contain;
}
@media(max-width:1100px){
  #skandi-site-footer .footer-main{grid-template-columns:minmax(170px,.8fr) minmax(0,3.2fr);gap:28px}
  #skandi-site-footer #footerColumns{grid-template-columns:repeat(2,minmax(0,1fr));gap:26px}
}
@media(max-width:860px){
  #skandi-site-footer .footer-main{grid-template-columns:1fr;gap:30px}
  #skandi-site-footer .brand{display:flex;justify-content:space-between;align-items:center;gap:25px;flex-wrap:wrap}
  #skandi-site-footer .logo{margin:0}
  #skandi-site-footer .bottom-actions{justify-content:flex-start}
  #skandi-site-footer .bottom-links{justify-content:flex-start}
}
@media(max-width:640px){
  #skandi-site-footer .news-inner{padding:33px 20px}
  #skandi-site-footer .footer-main{padding:39px 20px 40px;gap:29px}
  #skandi-site-footer #footerColumns{grid-template-columns:repeat(2,minmax(0,1fr));gap:29px 22px}
  #skandi-site-footer .bottom-row{padding:22px 20px}
  #skandi-site-footer .bottom-row.copy-row{padding:17px 20px 20px}
  #skandi-site-footer .bottom-actions{width:100%;flex-basis:100%}
  #skandi-site-footer .staff-login-btn{margin:5px 0 0}
}
@media(max-width:380px){
  #skandi-site-footer #footerColumns{column-gap:14px}
  #skandi-site-footer .col button{font-size:10px}
}
@media(prefers-reduced-motion:reduce){
  #skandi-site-footer .col button,#skandi-site-footer .social-btn{
    transition:none!important;
  }
}

</style>
</head>
<body>

<div id="skandi-site-footer">
<footer class="footer" data-component="customer-footer">

  <section class="newsletter">
    <div class="news-inner">
      <div>
        <h2 id="newsletterTitle">Get SKANDI offers and travel inspiration</h2>
        <p id="newsletterDescription">
          Receive destination guides, SKANDI Collections updates and member offers.
        </p>
        <div id="newsletterStatus" aria-live="polite"></div>
      </div>

      <div class="news-form">
        <input
          id="newsletterEmail"
          type="email"
          placeholder="Email address"
          autocomplete="email"/>

        <button id="newsletterBtn" type="button">
          Sign up
        </button>
      </div>
    </div>
  </section>

  <section class="footer-main">
    <div class="brand">
      <img id="footerLogo" class="logo" data-master-logo="customerFooter" alt="SKANDI Travels">
      <p id="footerSlogan"></p>
      <div class="social-links" id="socialLinks" aria-label="Social media links"></div>
    </div>
    <div id="footerColumns"></div>
  </section>

  <section class="footer-bottom">
    <div class="bottom-row">
      <div class="legal-text-container">
        <p id="footerTerms">Payment methods, supplier terms, and package travel conditions vary by product.<br>
          SKANDI TRAVELS acts as a direct operator for select proprietary services and as an agent for independent third-party suppliers.</p>
      </div>
      <div class="bottom-actions">
        <div class="bottom-links" id="bottomLinks"></div>
        <button class="staff-login-btn" id="staffLoginBtn" type="button" data-path="/riaintra">Staff Login</button>
      </div>
    </div>
    <div class="bottom-row copy-row">
      <div class="copyright-text">
        © <span id="year"></span> SKANDI GROUP Inc. (United States) &amp; SKANDI GROUP Aktiebolag (Sweden). All rights reserved. SKANDI TRAVELS™ is a trademark of the SKANDI GROUP.
      </div>
      <img id="wordmarkLogo" class="wordmark-logo" data-master-logo="groupFooter" alt="SKANDI GROUP" style="display:none;">
    </div>
  </section>
</footer>
</div>

<script>
"use strict";

(() => {
  const SOURCE = "SKANDI_CUSTOMER_FOOTER";
  const PARENT = "SKANDI_WIX_PARENT";

  let master = null;

  const $ = (id) => document.getElementById(id);

  function esc(v) {
    return String(v ?? "").replace(/[&<>'"]/g, (c) => ({
      "&":"&amp;",
      "<":"&lt;",
      ">":"&gt;",
      "'":"&#39;",
      '"':"&quot;"
    }[c]));
  }

  function post(type, payload = {}) {
    window.parent.postMessage({
      source: SOURCE,
      type,
      payload,
      timestamp: new Date().toISOString()
    }, "*");
  }

  function getAsset(...keys) {
    const logos = master?.brand?.assets?.logos || {};
    const root = master?.brand?.assets || {};

    for (const key of keys) {
      if (logos[key]) return logos[key];
      if (root[key]) return root[key];
    }

    return "";
  }

  function renderAssets() {
    const footerLogo = getAsset("customerFooter");
    if (footerLogo && $("footerLogo")) $("footerLogo").src = footerLogo;
    const wordmark = getAsset("groupFooter");
    if (wordmark && $("wordmarkLogo")) {
      $("wordmarkLogo").src = wordmark;
      $("wordmarkLogo").style.display = "block";
    }
    const branch = String(master?.brand?.currentBranch || "travels");
    const slogans = master?.brand?.slogans?.[branch] || {};
    const language = String(master?.settings?.language || "EN").toLowerCase();
    if ($("footerSlogan")) $("footerSlogan").textContent = slogans[language] || slogans.en || "";
  }

  function renderNewsletter() {
    const newsletter =
      master?.customer?.footer?.newsletter ||
      {};

    $("newsletterTitle").textContent =
      newsletter.title ||
      "Get SKANDI offers and travel inspiration";

    $("newsletterDescription").textContent =
      newsletter.description ||
      "Receive destination guides, Signature Collection updates and member offers.";

    $("newsletterBtn").textContent =
      newsletter.buttonLabel ||
      "Sign up";

    $("newsletterEmail").placeholder =
      newsletter.placeholder ||
      "Email address";
  }

  function renderSocials() {
    const socialLinks =
      Array.isArray(master?.customer?.footer?.socialLinks)
        ? master.customer.footer.socialLinks
        : [];

    $("socialLinks").innerHTML = socialLinks.map((item) => {
      const icon =
        item.iconAssetKey
          ? getAsset(item.iconAssetKey)
          : (item.iconUrl || "");

      return `
        <button
          class="social-btn"
          type="button"
          data-external-url="${esc(item.url || "")}"
          aria-label="${esc(item.label || "")}">
          ${icon
            ? `<img src="${esc(icon)}" alt="${esc(item.label || "")}">`
            : `<span style="font-size:10px;color:#fff;font-weight:800;">${esc(item.label || "")}</span>`
          }
        </button>
      `;
    }).join("");
  }

  function renderColumns() {
    const columns =
      Array.isArray(master?.customer?.footer?.columns)
        ? master.customer.footer.columns
        : [];

    $("footerColumns").innerHTML = columns.map((column) => `
      <div class="col">
        <h3>${esc(column.title || "")}</h3>

        ${(Array.isArray(column.links) ? column.links : [])
          .map((item) => `
            <button
              type="button"
              data-path="${esc(item.path || "")}">
              ${esc(item.label || "")}
            </button>
          `)
          .join("")}
      </div>
    `).join("");
  }

  function renderBottom() {
    const footer = master?.customer?.footer || {};

    // The dynamic terms copy is owned by the canonical master config.
    // Default is the approved V12 operator/agency language.
    const fallbackTerms = "Payment methods, supplier terms, and package travel conditions vary by product.<br>SKANDI TRAVELS acts as a direct operator for select proprietary services and as an agent for independent third-party suppliers.";
    $("footerTerms").innerHTML = footer.termsText || fallbackTerms;

    const policiesPath = String(master?.routes?.policies || "/about/legal/policies").split("?")[0];
    const legalPath = String(master?.routes?.legal || "/about/legal");
    const staffPath = String(master?.routes?.staffLogin || master?.routes?.riaintra || "/riaintra");
    const links = [
      { label:"Cookies", path:`${policiesPath}?slug=skandi-travels-cookies-policy` },
      { label:"Privacy Policy", path:`${policiesPath}?slug=privacy-policy` },
      { label:"Accessibility Statement", path:`${policiesPath}?slug=accessibility` },
      { label:"Booking Terms", path:`${policiesPath}?slug=booking-terms` },
      { label:"Website Disclaimer", path:`${policiesPath}?slug=disclaimer` },
      { label:"Legal", path:legalPath }
    ];
    if ($("staffLoginBtn")) $("staffLoginBtn").setAttribute("data-path", staffPath);
    $("bottomLinks").innerHTML = links.map(item => `
      <button type="button" data-path="${esc(item.path || "")}">
        ${esc(item.label || "")}
      </button>
    `).join("");
  }

  function renderAll() {
    renderAssets();
    renderNewsletter();
    renderSocials();
    renderColumns();
    renderBottom();
  }

  document.addEventListener("click", (event) => {
    const path =
      event.target.closest("[data-path]")?.getAttribute("data-path");

    if (path) {
      post("FOOTER_NAVIGATE", { path });
      return;
    }

    const externalUrl =
      event.target.closest("[data-external-url]")?.getAttribute("data-external-url");

    if (externalUrl) {
      window.open(
        externalUrl,
        "_blank",
        "noopener,noreferrer"
      );
    }
  });

  function subscribe() {
    const email =
      $("newsletterEmail")?.value?.trim() ||
      "";

    post("FOOTER_NEWSLETTER_SIGNUP", {
      email,
      source: "Footer"
    });
  }

  $("newsletterBtn")?.addEventListener("click", subscribe);

  $("newsletterEmail")?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      subscribe();
    }
  });

  window.addEventListener("message", (event) => {
    let msg = event.data;

    if (typeof msg === "string") {
      try {
        msg = JSON.parse(msg);
      } catch (_) {
        return;
      }
    }

    if (!msg || typeof msg !== "object") return;
    if (msg.source !== PARENT) return;

    if (msg.type === "SKANDI_MASTER_CONFIG") {
      master = msg.payload || {};
      renderAll();
      return;
    }

    if (msg.type === "CUSTOMER_FOOTER_STATE") {
      renderAll();
      return;
    }

    if (msg.type === "FOOTER_NEWSLETTER_RESULT") {
      const result = msg.payload || {};

      $("newsletterStatus").textContent =
        result.message ||
        result.error ||
        (result.ok
          ? "Thank you. You are subscribed."
          : "Newsletter signup could not be completed.");
    }
  });

  $("year").textContent = new Date().getFullYear();

  post("MASTER_CONFIG_REQUEST", {
    context: "customer-footer"
  });

  post("FOOTER_READY");
})();
</script>
</body>
</html>
```
