# **GLOBAL** SKANDI TRAVELS HEADER

## INFO
- **Display/page name:** Global Customer Header
- **System area:** SKANDI
- **Wix page filename:** `masterPage.js`
- **Wix route/slug:** Global customer chrome on public SKANDI routes
- **Wix HTML element ID:** `#skandiHeaderEmbed` / `#skandiCustomerHeaderEmbed`
- **Current status:** ACTIVE / CANONICAL INTENDED SOURCE
- **Source-of-truth status:** HTML_REF canonical readable mirror of `/embed/SKANDI-Global-Header.html`
- **Current generation:** B-011.18.4
- **Package:** PKG-BBASE-045
- **Linked page controller:** `/src/pages/masterPage.js`
- **Canonical backend facades:** `backend/SKANDI_CORE/customerSession.web.js`; `backend/SKANDI_CORE/staffAuth.web.js` indirectly through global master state where applicable
- **Canonical backend core:** `backend/SKANDI_CORE/customerSession.js`; `backend/SKANDI_CORE/staffAuth.js`
- **Relevant shared code:** `/src/public/siteMap.js` `GLOBAL_CHROME.customerHeader`
- **Relevant data/provider dependencies:** Wix Members; Wix Loyalty through canonical customerSession backend; no direct database/provider access from the embed
- **Authentication boundary:** customer auth is owned by Wix Members/masterPage; header only emits login/navigation/settings intents
- **Primary message contracts:** `SKANDI_CUSTOMER_HEADER_EXPANDBAR`, `MASTER_CONFIG_REQUEST`, `HEADER_READY`, `HEADER_NAVIGATE`, `HEADER_LOGIN_SUBMIT`, `HEADER_FORGOT_PASSWORD`, `CUSTOMER_SETTINGS_REQUEST`, `UPDATE_SETTINGS`, `SKANDI_EMBED_RESIZE`, `CLOSE_CUSTOMER_HEADER_PANELS`
- **Fixed geometry authority:** 118px total at desktop/tablet/mobile (`74px` mainline + `44px` utility bar). The HTML root, header shell, settings surface, SKANDI Club sign-in and mobile menu are all hard-contained within 118px. The Wix parent also hard-clamps the customer header element to 118px and ignores larger resize requests.
- **Architectural notes:** B-011.18.4 preserves the B-011.18.2 matched architecture and B-011.18.3 interaction layer while redesigning the SKANDI Club authentication surface to match the dark premium My Profile/Club visual system. The login surface uses the same ink/navy depth, aqua/champagne detailing, ivory controls, member-card motif and restrained interaction treatment as My Profile while retaining the existing authentication message contract, element IDs and fixed 118px geometry.
- **Open issues:** Wix live-runtime acceptance remains required after install. No database/provider migration is required. The B-011.18.4 install package includes the matched `masterPage.js` and `siteMap.js` because they enforce the 118px parent-side invariant and the B-011.31 My Profile `section` + `view` account routes. No customer-session backend change is required for this visual generation.
- **Last verified:** 2026-09-18

### Change log
- **2026-09-16 — B-011.18:** Global SKANDI customer header registered at 118px desktop/tablet/mobile. Settings flyout still requested temporary expansion to 190px and `GLOBAL_CHROME.customerHeader.maxHeight` remained 1200px.
- **2026-09-18 — B-011.18.1:** Intended 118px invariant introduced in the HTML_REF/header source. Subsequent cross-layer audit found the available `siteMap.js` and `masterPage.js` still allowed the customer-header Wix component to grow beyond 118px, so the invariant was not yet guaranteed end-to-end.
- **2026-09-18 — B-011.18.2:** Premium global-header convergence. Rebuilt the presentation with porcelain/ivory upper chrome, ink/navy utility chrome, restrained aqua/champagne accents and no decorative entry/shimmer motion; kept search/settings/Club/mobile panels inside the fixed envelope; synchronized customer account routes to My Profile B-011.31; set `GLOBAL_CHROME.customerHeader.maxHeight` to 118; and added an explicit 118px parent clamp in `masterPage.js`.
- **2026-09-18 — B-011.18.3:** Premium interaction refinement. Added pointer-reactive glass illumination, active-nav dot/underline motion, hover-only accent sweeps, richer search/settings focus depth, contained Club-panel reveal and mobile-drawer reveal effects. All effects are interaction-triggered, reduced-motion aware and remain entirely inside the fixed 118px envelope.
- **2026-09-18 — B-011.18.4:** SKANDI Club login convergence. Reworked the fixed-height authentication surface to match the dark premium My Profile visual language: compact member-card introduction, ink/navy atlas background, champagne/aqua detailing, ivory floating-label credential controls, premium sign-in action, secure-access status treatment and mobile parity. Existing IDs, login/forgot-password/join intents, parent messaging and the 118px geometry invariant remain unchanged.
- **2026-09-18 — B-011.18.4 packaging sync:** Normalized the install set to the same flat manifest format used by My Profile. Included only the current header HTML, complete HTML_REF mirror, `masterPage.js` and `siteMap.js`; customer-session backend files are intentionally omitted because this generation does not change their contract.

---

---

## COMPLETE INTENDED LIVE HTML SOURCE

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"/>
<meta name="theme-color" content="#022e64"/>
<title>SKANDI Customer Header · B-011.18.4</title>
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
  --header-h:74px;
  --bar-height:44px;
  --header-total:118px;
}
*{box-sizing:border-box;margin:0;padding:0}
html,body{
  width:100%;
  height:var(--header-total)!important;
  min-height:var(--header-total)!important;
  max-height:var(--header-total)!important;
  overflow:hidden!important;
  background:transparent;
  color:var(--sk-graphite);
  font-family:"Montserrat",system-ui,-apple-system,"Segoe UI",sans-serif;
  line-height:1.4;
}
body{position:relative}
#skandi-site-header,
.header-shell{
  position:relative;
  width:100%;
  height:var(--header-total)!important;
  min-height:var(--header-total)!important;
  max-height:var(--header-total)!important;
  overflow:hidden!important;
  contain:layout paint size;
}
button,input,select{font:inherit}
button{cursor:pointer}
button:focus-visible,input:focus-visible,select:focus-visible{outline:2px solid var(--sk-aqua);outline-offset:2px}
img{display:block;max-width:100%}

.header-shell{
  z-index:1000;
  background:rgba(251,250,246,.97);
  border-bottom:1px solid rgba(3,17,31,.18);
  box-shadow:0 6px 30px rgba(3,17,31,.08);
  backdrop-filter:blur(18px) saturate(125%);
  -webkit-backdrop-filter:blur(18px) saturate(125%);
}
.mainline{
  position:relative;
  z-index:100;
  height:var(--header-h);
  min-height:var(--header-h);
  max-height:var(--header-h);
  overflow:visible;
  background:linear-gradient(180deg,rgba(251,250,246,.99),rgba(245,241,234,.96));
  border-bottom:1px solid rgba(2,46,100,.09);
}
.inner{
  position:relative;
  width:min(100%,1480px);
  height:100%;
  margin:0 auto;
  padding:0 clamp(14px,2.2vw,32px);
  display:flex;
  align-items:center;
  flex-wrap:nowrap;
  gap:clamp(12px,1.7vw,25px);
  overflow:visible;
}
.logo{
  flex:0 0 auto;
  width:clamp(134px,13vw,184px);
  height:48px;
  display:flex;
  align-items:center;
  border:0;
  background:transparent;
  padding:0;
}
.logo img{
  width:100%;
  max-width:184px;
  max-height:45px;
  object-fit:contain;
  object-position:left center;
}
.nav{
  flex:1 1 auto;
  min-width:0;
  height:100%;
  display:flex;
  align-items:center;
  justify-content:flex-start;
  gap:clamp(2px,.35vw,7px);
  overflow:hidden;
}
.nav-btn{
  position:relative;
  flex:0 0 auto;
  height:44px;
  padding:0 clamp(8px,.85vw,14px);
  border:0;
  background:transparent;
  color:#233b55;
  font-size:clamp(10px,.82vw,12px);
  line-height:1;
  font-weight:650;
  letter-spacing:.005em;
  white-space:nowrap;
  transition:color .18s ease,background .18s ease;
}
.nav-btn::after{
  content:"";
  position:absolute;
  left:clamp(8px,.85vw,14px);
  right:clamp(8px,.85vw,14px);
  bottom:5px;
  height:1px;
  background:transparent;
}
.nav-btn:hover{color:var(--sk-navy);background:rgba(255,255,255,.46)}
.nav-btn:hover::after{background:rgba(95,199,207,.62)}
.nav-btn.active{color:var(--sk-navy);font-weight:800}
.nav-btn.active::after{height:2px;background:linear-gradient(90deg,var(--sk-aqua),var(--sk-champagne))}
.actions{
  position:static;
  z-index:10;
  flex:0 0 auto;
  min-width:0;
  display:flex;
  align-items:center;
  gap:6px;
  white-space:nowrap;
}
.action-btn,.mobile-btn{
  height:38px;
  min-height:38px;
  padding:0 12px;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  gap:7px;
  border:1px solid transparent;
  border-radius:999px;
  background:transparent;
  color:var(--sk-navy);
  font-size:10px;
  font-weight:750;
  letter-spacing:.02em;
  white-space:nowrap;
  transition:background .18s ease,border-color .18s ease,color .18s ease;
}
.action-btn:hover,.mobile-btn:hover{background:rgba(255,255,255,.72);border-color:rgba(2,46,100,.10)}
.action-btn.primary{
  padding:0 17px;
  background:linear-gradient(135deg,var(--sk-navy),var(--sk-ink-soft));
  border-color:rgba(3,17,31,.16);
  color:#fff;
  box-shadow:0 8px 24px rgba(2,46,100,.14);
}
.action-btn.primary:hover{background:var(--sk-ink);border-color:rgba(95,199,207,.22);color:#fff}
.mobile-btn{display:none}
#favBtn{width:38px;min-width:38px;padding:0;font-size:19px;font-weight:500}
.settings-wrap{position:static;display:inline-flex;align-items:center}
#settingsBtn{min-width:79px;padding:0 10px}
#settingsBtn svg{width:16px;height:16px;fill:currentColor;flex:0 0 auto}
#settingsSummary{font-size:9px;font-weight:800;letter-spacing:.035em}

/* Settings occupies the existing 44px utility strip. It never adds height. */
.settings-menu{
  position:absolute;
  z-index:320;
  top:var(--header-h);
  right:clamp(14px,2.2vw,32px);
  width:min(354px,calc(100% - 28px));
  height:var(--bar-height);
  padding:6px 0 6px 12px;
  display:grid;
  grid-template-columns:minmax(82px,1fr) minmax(82px,1fr) 34px;
  align-items:center;
  gap:6px;
  visibility:hidden;
  opacity:0;
  pointer-events:none;
  background:linear-gradient(90deg,rgba(6,26,48,.04),rgba(6,26,48,.96) 16%);
  transition:opacity .16s ease,visibility .16s ease;
}
.settings-menu.open{visibility:visible;opacity:1;pointer-events:auto}
.settings-group{min-width:0}
.settings-group label{
  position:absolute!important;
  width:1px!important;height:1px!important;
  padding:0!important;margin:-1px!important;
  overflow:hidden!important;clip:rect(0,0,0,0)!important;
  white-space:nowrap!important;border:0!important;
}
.settings-group select{
  width:100%;
  height:32px;
  padding:0 25px 0 9px;
  border:1px solid rgba(255,255,255,.18);
  border-radius:7px;
  background:rgba(251,250,246,.98);
  color:var(--sk-navy);
  outline:0;
  font-size:9px;
  font-weight:800;
}
.settings-apply{
  width:34px;height:32px;min-width:34px;min-height:32px;
  border:1px solid rgba(255,255,255,.18);
  border-radius:7px;
  background:var(--sk-aqua);
  color:var(--sk-ink);
  font-size:14px;
  font-weight:900;
}
.header-shell.settings-open .default-bar{opacity:.28;pointer-events:none}

.search-wrap{position:relative;display:flex;align-items:center;gap:4px;min-width:0}
.search-field-shell{width:0;opacity:0;overflow:hidden;pointer-events:none;transition:width .18s ease,opacity .14s ease}
.search-wrap.open .search-field-shell{width:clamp(150px,19vw,270px);opacity:1;pointer-events:auto}
.search-field-inner{
  height:38px;
  display:flex;
  align-items:center;
  overflow:hidden;
  border:1px solid rgba(2,46,100,.14);
  border-radius:999px;
  background:rgba(255,255,255,.82);
}
.search-field-inner:focus-within{border-color:rgba(95,199,207,.9);background:#fff;box-shadow:0 0 0 3px rgba(95,199,207,.10)}
#headerSearchInput{width:100%;min-width:0;border:0;outline:0;background:transparent;padding:0 4px 0 13px;color:var(--sk-ink);font-size:11px;font-weight:650}
#headerSearchInput::placeholder{color:#8994a1}
.search-go{width:32px;height:32px;flex:0 0 32px;border:0;border-radius:50%;background:transparent;color:var(--sk-navy);font-size:16px}
.search-go:hover{background:rgba(95,199,207,.12)}

.expandbar{
  position:relative;
  z-index:80;
  height:var(--bar-height);
  min-height:var(--bar-height);
  max-height:var(--bar-height);
  overflow:hidden;
  color:#fff;
  background:
    radial-gradient(circle at 18% -40%,rgba(95,199,207,.18),transparent 38%),
    linear-gradient(100deg,var(--sk-ink) 0%,var(--sk-navy) 54%,var(--sk-blue) 100%);
  border-top:1px solid rgba(209,188,152,.16);
}
.expandbar::after{
  content:"";
  position:absolute;
  left:0;right:0;top:0;
  height:1px;
  background:linear-gradient(90deg,transparent 0%,rgba(209,188,152,.55) 34%,rgba(95,199,207,.42) 72%,transparent 100%);
  pointer-events:none;
}
.expand-inner{width:min(100%,1480px);height:100%;margin:0 auto;padding:0 clamp(14px,2.2vw,32px)}
.default-bar{height:100%;display:flex;align-items:center;justify-content:space-between;gap:18px;min-width:0;transition:opacity .16s ease}
.master-slogan{
  min-width:0;
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
  color:rgba(255,255,255,.73);
  font-size:9px;
  font-weight:650;
  letter-spacing:.14em;
  text-transform:uppercase;
}
.master-slogan:empty{visibility:hidden}
#accountMini{margin-left:auto;min-width:0;max-width:60%}
.account-mini-details{display:flex;align-items:center;justify-content:flex-end;gap:8px;min-width:0;overflow:hidden;white-space:nowrap;font-size:9px;letter-spacing:.015em}
.account-mini-name{max-width:140px;overflow:hidden;text-overflow:ellipsis;color:#fff;font-weight:800}
.account-mini-email{max-width:190px;overflow:hidden;text-overflow:ellipsis;color:rgba(255,255,255,.52);font-weight:550}
.account-mini-tier{color:var(--sk-champagne);font-weight:800}
.account-mini-points{color:var(--sk-aqua-soft);font-weight:850}
.account-mini-separator{color:rgba(255,255,255,.26)}

/* Club authentication uses the same dark private-member language as My Profile and remains exactly 118px. */
.club-panel{
  position:absolute;
  inset:0 0 auto auto;
  z-index:420;
  width:min(1160px,100%);
  height:var(--header-total);
  min-height:var(--header-total);
  max-height:var(--header-total);
  overflow:hidden;
  visibility:hidden;
  opacity:0;
  pointer-events:none;
  color:#fff;
  background:
    radial-gradient(circle at 88% 8%,rgba(95,199,207,.12),transparent 27%),
    radial-gradient(circle at 8% 112%,rgba(209,188,152,.08),transparent 32%),
    linear-gradient(150deg,#0b2946 0%,#061a30 56%,#03111f 100%);
  border-left:1px solid rgba(209,188,152,.20);
  box-shadow:-28px 0 78px rgba(3,17,31,.32);
  transition:none;
}
.club-panel.open{visibility:visible;opacity:1;pointer-events:auto}
.club-panel::before{
  content:"";
  position:absolute;
  left:0;
  top:0;
  bottom:0;
  width:3px;
  background:linear-gradient(180deg,var(--sk-aqua),rgba(95,199,207,.36) 52%,var(--sk-champagne));
}
.club-login-strip{
  position:relative;
  z-index:2;
  height:100%;
  padding:10px 14px 8px 18px;
  display:grid;
  grid-template-columns:236px minmax(180px,1.08fr) minmax(165px,1fr) 116px 32px;
  grid-template-rows:58px 24px;
  grid-template-areas:"intro email password submit close" "intro status links links close";
  gap:6px 10px;
  align-content:center;
}
.club-intro{
  grid-area:intro;
  position:relative;
  min-width:0;
  align-self:stretch;
  display:flex;
  flex-direction:column;
  justify-content:center;
  overflow:hidden;
  padding:11px 15px;
  border:1px solid rgba(209,188,152,.23);
  border-radius:16px;
  background:
    radial-gradient(circle at 88% 8%,rgba(95,199,207,.11),transparent 30%),
    linear-gradient(150deg,rgba(13,40,65,.98),rgba(5,25,44,.98) 66%,rgba(3,17,31,.99));
  box-shadow:0 14px 34px rgba(0,0,0,.20);
}
.club-intro::before{
  content:"";
  position:absolute;
  inset:6px;
  border:1px solid rgba(255,255,255,.055);
  border-radius:11px;
  pointer-events:none;
}
.club-intro::after{
  content:"SKANDI";
  position:absolute;
  right:-4px;
  bottom:-8px;
  color:rgba(255,255,255,.035);
  font:700 29px/1 "Montserrat",sans-serif;
  letter-spacing:-.06em;
  pointer-events:none;
}
.club-eyebrow{position:relative;z-index:1;color:var(--sk-aqua-soft);font-size:7px;font-weight:800;letter-spacing:.19em;text-transform:uppercase}
.club-intro strong{position:relative;z-index:1;margin-top:3px;color:#fff;font-size:17px;line-height:1.02;font-weight:650;letter-spacing:-.035em}
.club-intro span{position:relative;z-index:1;margin-top:6px;color:rgba(255,255,255,.54);font-size:7.5px;line-height:1.35;font-weight:550;letter-spacing:.01em}
.club-field{
  min-width:0;
  height:58px;
  position:relative;
  overflow:hidden;
  border:1px solid rgba(216,210,200,.88);
  border-radius:12px;
  background:var(--sk-ivory);
  box-shadow:0 10px 24px rgba(0,0,0,.11),inset 0 1px 0 rgba(255,255,255,.82);
}
.club-field.email{grid-area:email}.club-field.password{grid-area:password}
.club-field label{
  position:absolute;
  z-index:2;
  top:7px;
  left:13px;
  color:#74808d;
  font-size:6.5px;
  font-weight:800;
  letter-spacing:.13em;
  text-transform:uppercase;
  pointer-events:none;
}
.club-field input{
  width:100%;
  height:100%;
  padding:20px 13px 5px;
  border:0;
  border-radius:inherit;
  background:transparent;
  color:var(--sk-ink);
  outline:0;
  font-size:10.5px;
  font-weight:650;
}
.club-field input::placeholder{color:#929ba6;font-weight:550}
.club-field:focus-within{border-color:var(--sk-aqua);box-shadow:0 10px 26px rgba(0,0,0,.12),0 0 0 3px rgba(95,199,207,.10),inset 0 1px 0 rgba(255,255,255,.88)}
.club-submit{
  grid-area:submit;
  position:relative;
  height:58px;
  overflow:hidden;
  border:1px solid rgba(209,188,152,.50);
  border-radius:12px;
  background:var(--sk-ivory);
  color:var(--sk-ink);
  box-shadow:0 10px 25px rgba(0,0,0,.14),inset 0 1px 0 rgba(255,255,255,.90);
  font-size:8.5px;
  font-weight:900;
  letter-spacing:.10em;
  text-transform:uppercase;
}
.club-submit::before{
  content:"";
  position:absolute;
  left:12px;
  right:12px;
  top:0;
  height:2px;
  background:linear-gradient(90deg,transparent,var(--sk-aqua),var(--sk-champagne),transparent);
  opacity:.9;
}
.club-submit:disabled{opacity:.55;cursor:wait}
.club-login-status{
  grid-area:status;
  min-width:0;
  display:flex;
  align-items:center;
  gap:7px;
  padding-left:4px;
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
  color:rgba(255,255,255,.52);
  font-size:7px;
  font-weight:650;
  letter-spacing:.02em;
}
.club-login-status:not(:empty)::before{content:"";flex:0 0 auto;width:5px;height:5px;border-radius:50%;background:var(--sk-aqua);box-shadow:0 0 0 3px rgba(95,199,207,.08)}
.club-login-status.error{color:#ffc8c3;font-weight:700}.club-login-status.error::before{background:#f6a59d;box-shadow:none}
.club-links{grid-area:links;display:flex;align-items:center;justify-content:flex-end;gap:17px;min-width:0}
.club-link{border:0;background:transparent;color:rgba(255,255,255,.70);font-size:7px;font-weight:750;letter-spacing:.01em;white-space:nowrap}.club-link:hover{color:var(--sk-aqua-soft)}
.club-close{grid-area:close;align-self:center;justify-self:end;width:29px;height:29px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.055);color:#fff;border-radius:50%;font-size:17px;display:flex;align-items:center;justify-content:center}

html.mobile-menu-open,body.mobile-menu-open{overflow:hidden!important}
.mobile-menu-layer{
  position:fixed;
  inset:0 0 auto 0;
  z-index:2400;
  width:100%;
  height:var(--header-total)!important;
  min-height:var(--header-total)!important;
  max-height:var(--header-total)!important;
  overflow:hidden!important;
  visibility:hidden;
  pointer-events:none;
  background:transparent;
}
.mobile-menu-layer.open{visibility:visible;pointer-events:auto}
.mobile-menu-backdrop{display:none}
.mobile-drawer{
  position:absolute;
  inset:0;
  width:100%;
  height:var(--header-total)!important;
  display:grid;
  grid-template-rows:var(--header-h) var(--bar-height);
  overflow:hidden;
  background:var(--sk-ivory);
}
.mobile-menu-top{height:var(--header-h);display:flex;align-items:center;gap:8px;min-width:0;padding:0 10px 0 14px;border-bottom:1px solid rgba(2,46,100,.10);background:linear-gradient(180deg,var(--sk-ivory),var(--sk-porcelain))}
.mobile-drawer-brand{flex:0 0 auto;min-width:70px;padding-right:9px;border-right:1px solid rgba(2,46,100,.12)}
.mobile-drawer-brand strong{display:block;color:var(--sk-navy);font-size:12px;font-weight:800;line-height:1;letter-spacing:.07em;text-transform:uppercase}
.mobile-drawer-brand span{display:block;max-width:96px;margin-top:5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--sk-muted);font-size:8px;font-weight:600}
.mobile-menu-list{flex:1 1 auto;min-width:0;height:100%;display:flex;align-items:center;gap:2px;padding:0 2px;overflow-x:auto;overflow-y:hidden;scrollbar-width:none}.mobile-menu-list::-webkit-scrollbar{display:none}
.mobile-menu-link{flex:0 0 auto;height:36px;padding:0 9px;border:0;border-bottom:2px solid transparent;background:transparent;color:#334b63;font-size:10px;font-weight:700;white-space:nowrap}.mobile-menu-link.active{color:var(--sk-navy);border-bottom-color:var(--sk-aqua)}
#mobileMenuClose{flex:0 0 auto;width:30px;height:30px;border:1px solid rgba(2,46,100,.12);border-radius:50%;background:rgba(255,255,255,.55);color:var(--sk-navy);font-size:18px}
.mobile-menu-bottom{height:var(--bar-height);display:flex;align-items:center;gap:5px;min-width:0;padding:0 9px;background:linear-gradient(100deg,var(--sk-ink),var(--sk-navy));color:#fff}
.mobile-settings-bar{flex:0 1 auto;display:flex;align-items:center;gap:4px;min-width:0}
.mobile-settings-bar select{width:55px;height:28px;padding:0 5px;border:1px solid rgba(255,255,255,.16);border-radius:6px;background:rgba(255,255,255,.08);color:#fff;outline:0;font-size:9px;font-weight:750}.mobile-settings-bar select option{color:var(--sk-navy);background:#fff}
.mobile-menu-spacer{flex:1 1 auto;min-width:2px}
.mobile-search-wrap{display:flex;align-items:center;gap:3px;min-width:0}
#mobileSearchInput{width:0;height:28px;opacity:0;pointer-events:none;border:1px solid rgba(255,255,255,.18);border-radius:6px;background:rgba(255,255,255,.08);color:#fff;outline:0;padding:0;font-size:9px;font-weight:650;transition:width .16s ease,opacity .12s ease,padding .16s ease}
.mobile-search-wrap.open #mobileSearchInput{width:104px;opacity:1;pointer-events:auto;padding:0 8px}
.mobile-drawer-action{flex:0 0 auto;height:28px;min-height:28px;border:1px solid rgba(255,255,255,.15);border-radius:6px;background:transparent;color:#fff;padding:0 8px;font-size:9px;font-weight:800;white-space:nowrap}.mobile-drawer-action.primary{background:var(--sk-ivory);color:var(--sk-navy);border-color:var(--sk-ivory)}

@media(max-width:1260px) and (min-width:1021px){
  .inner{gap:10px;padding:0 14px}.logo{width:132px}.nav{gap:0}.nav-btn{padding:0 7px;font-size:9.5px}.nav-btn::after{left:7px;right:7px}.actions{gap:2px}.action-btn{padding:0 8px;font-size:9px}#settingsBtn{min-width:68px;padding:0 7px}#settingsSummary{font-size:8px}.action-btn.primary{padding:0 11px}.search-wrap.open .search-field-shell{width:145px}
}
@media(max-width:1020px){
  .nav,.desktop-only{display:none!important}
  .inner{justify-content:space-between;gap:10px;padding:0 14px}.logo{width:clamp(126px,35vw,176px)}.mobile-btn{display:inline-flex;height:36px;min-height:36px;border-color:rgba(2,46,100,.10);background:rgba(255,255,255,.45);font-size:9px;letter-spacing:.06em}.master-slogan{font-size:8px;letter-spacing:.10em}#accountMini{max-width:62%}.account-mini-details{font-size:8px;gap:6px}.account-mini-email{display:none}
}
@media(max-width:760px){
  .club-panel{width:100%}.club-login-strip{padding:9px 8px 7px 10px;grid-template-columns:minmax(0,1fr) minmax(0,1fr) 70px 27px;grid-template-rows:56px 26px;grid-template-areas:"email password submit close" "status links links close";gap:5px 6px}.club-intro{display:none}.club-field{height:56px;border-radius:10px}.club-field label{top:6px;left:9px;font-size:6px}.club-field input{height:100%;padding:19px 9px 4px;font-size:8.5px}.club-submit{height:56px;font-size:7.5px;letter-spacing:.025em;border-radius:10px}.club-submit::before{left:8px;right:8px}.club-links{gap:8px}.club-link,.club-login-status{font-size:6.5px}.club-login-status{gap:5px;padding-left:2px}.club-close{width:27px;height:27px;font-size:17px}
}
@media(max-width:520px){
  .inner,.expand-inner{padding-left:10px;padding-right:10px}.logo{width:126px}#favBtn{display:none}.master-slogan{max-width:46%}.account-mini-name{max-width:92px}.account-mini-tier{display:none}.mobile-drawer-brand{min-width:52px;padding-right:6px}.mobile-drawer-brand span{display:none}.mobile-menu-top{gap:4px;padding:0 6px}.mobile-menu-link{font-size:9px;padding:0 7px}#mobileMenuClose{width:28px;height:28px}.mobile-menu-bottom{gap:3px;padding:0 6px}.mobile-settings-bar{gap:2px}.mobile-settings-bar select{width:47px;padding:0 3px;font-size:8px}.mobile-drawer-action{padding:0 6px;font-size:8px}.mobile-search-wrap.open #mobileSearchInput{width:78px}
}
@media(max-width:360px){
  .logo{width:112px}.mobile-btn{padding:0 8px}.master-slogan{display:none}#accountMini{max-width:100%;width:100%}.account-mini-details{justify-content:flex-start}.mobile-drawer-brand{display:none}.mobile-menu-top{padding-left:5px}.mobile-settings-bar select{width:43px}.mobile-drawer-action{padding:0 5px}.mobile-search-wrap.open #mobileSearchInput{width:64px}
}
@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important;transition:none!important;animation:none!important}}


/* B-011.18.4 PREMIUM INTERACTION LAYER
   B-011.18.3 interaction effects retained; SKANDI Club access surface converged to My Profile styling. */
.header-shell{
  --fx-x:50%;
  --fx-y:26%;
  isolation:isolate;
}
.header-shell::before{
  content:"";
  position:absolute;
  inset:0;
  z-index:0;
  pointer-events:none;
  background:
    radial-gradient(circle at var(--fx-x) var(--fx-y),rgba(95,199,207,.12),transparent 22%),
    linear-gradient(112deg,transparent 0 38%,rgba(255,255,255,.32) 50%,transparent 62%);
  opacity:.72;
  mix-blend-mode:screen;
  transition:opacity .24s ease;
}
.header-shell:hover::before{opacity:1}
.mainline,.expandbar,.club-panel{isolation:isolate}
.mainline::after{
  content:"";
  position:absolute;
  left:0;right:0;bottom:0;
  height:1px;
  pointer-events:none;
  background:linear-gradient(90deg,transparent,rgba(95,199,207,.52) 34%,rgba(209,188,152,.50) 64%,transparent);
  opacity:.58;
}
.inner,.expand-inner{position:relative;z-index:2}

.logo{
  position:relative;
  border-radius:12px;
  transition:transform .22s cubic-bezier(.22,1,.36,1),filter .22s ease,background .22s ease;
}
.logo::after{
  content:"";
  position:absolute;
  inset:5px -7px;
  border-radius:13px;
  background:radial-gradient(circle at 28% 50%,rgba(95,199,207,.13),transparent 63%);
  opacity:0;
  pointer-events:none;
  transition:opacity .22s ease;
}
.logo:hover{transform:translateY(-1px);filter:drop-shadow(0 8px 16px rgba(2,46,100,.12))}
.logo:hover::after{opacity:1}
.logo:active{transform:translateY(0) scale(.99)}

.nav-btn{
  isolation:isolate;
  transition:color .2s ease,background .2s ease,transform .2s cubic-bezier(.22,1,.36,1);
}
.nav-btn::before{
  content:"";
  position:absolute;
  left:50%;
  bottom:4px;
  width:4px;
  height:4px;
  border-radius:50%;
  background:var(--sk-aqua);
  box-shadow:0 0 0 4px rgba(95,199,207,.10);
  opacity:0;
  transform:translate(-50%,4px) scale(.55);
  transition:opacity .18s ease,transform .2s cubic-bezier(.22,1,.36,1);
}
.nav-btn::after{
  transform:scaleX(0);
  transform-origin:center;
  transition:transform .24s cubic-bezier(.22,1,.36,1),background .18s ease,height .18s ease;
}
.nav-btn:hover{transform:translateY(-1px)}
.nav-btn:hover::after,.nav-btn.active::after{transform:scaleX(1)}
.nav-btn.active::before{opacity:1;transform:translate(-50%,0) scale(1)}
.nav-btn:active{transform:translateY(0) scale(.985)}

.action-btn,.mobile-btn,.search-go,.settings-apply,.club-submit,.club-close,#mobileMenuClose,.mobile-drawer-action{
  position:relative;
  overflow:hidden;
  transform:translateZ(0);
  transition:
    background .2s ease,
    border-color .2s ease,
    color .2s ease,
    box-shadow .22s ease,
    transform .2s cubic-bezier(.22,1,.36,1),
    filter .2s ease;
}
.action-btn::after,.mobile-btn::after,.settings-apply::after,.club-submit::after,.mobile-drawer-action::after{
  content:"";
  position:absolute;
  top:-45%;
  left:-55%;
  width:40%;
  height:190%;
  pointer-events:none;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,.30),transparent);
  transform:skewX(-20deg);
  opacity:0;
}
.action-btn:hover,.mobile-btn:hover{transform:translateY(-1px);box-shadow:0 8px 20px rgba(3,17,31,.08)}
.action-btn.primary:hover{transform:translateY(-1px);box-shadow:0 10px 25px rgba(3,17,31,.22),inset 0 0 0 1px rgba(95,199,207,.12)}
.action-btn:hover::after,.mobile-btn:hover::after,.settings-apply:hover::after,.club-submit:hover::after,.mobile-drawer-action:hover::after{
  opacity:1;
  animation:skandiHeaderSweep .58s ease both;
}
.action-btn:active,.mobile-btn:active,.settings-apply:active,.club-submit:active,.club-close:active,#mobileMenuClose:active,.mobile-drawer-action:active{transform:translateY(0) scale(.97)}
@keyframes skandiHeaderSweep{from{left:-55%}to{left:125%}}

#favBtn{
  transition:transform .22s cubic-bezier(.22,1,.36,1),color .2s ease,background .2s ease,box-shadow .2s ease;
}
#favBtn:hover{color:var(--sk-aqua);transform:translateY(-1px) scale(1.06);box-shadow:0 7px 18px rgba(2,46,100,.08)}
#favBtn:active{transform:scale(.96)}

.search-field-shell{
  transform-origin:right center;
  transform:scaleX(.92);
  transition:width .26s cubic-bezier(.22,1,.36,1),opacity .16s ease,transform .26s cubic-bezier(.22,1,.36,1);
}
.search-wrap.open .search-field-shell{transform:scaleX(1)}
.search-field-inner{
  position:relative;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.75);
  transition:border-color .2s ease,background .2s ease,box-shadow .2s ease,transform .2s ease;
}
.search-field-inner:focus-within{transform:translateY(-1px);box-shadow:0 8px 22px rgba(2,46,100,.08),0 0 0 3px rgba(95,199,207,.10),inset 0 1px 0 rgba(255,255,255,.8)}
.search-go:hover{transform:rotate(-4deg) scale(1.05)}

.settings-menu{
  transform:translateX(12px) scale(.985);
  transform-origin:right center;
  transition:opacity .2s ease,visibility .2s ease,transform .28s cubic-bezier(.22,1,.36,1),filter .2s ease;
  filter:blur(1px);
}
.settings-menu.open{transform:translateX(0) scale(1);filter:blur(0)}
.settings-group select{transition:border-color .18s ease,box-shadow .18s ease,transform .18s ease}
.settings-group select:hover{transform:translateY(-1px);border-color:rgba(95,199,207,.45)}
.settings-apply:hover{transform:translateY(-1px);box-shadow:0 6px 16px rgba(95,199,207,.22)}

.expandbar::before{
  content:"";
  position:absolute;
  inset:0;
  pointer-events:none;
  background:
    radial-gradient(circle at var(--fx-x) 120%,rgba(95,199,207,.14),transparent 27%),
    linear-gradient(90deg,transparent,rgba(255,255,255,.028),transparent);
  opacity:.9;
}
.master-slogan,.account-mini-details{position:relative;z-index:2}
.account-mini-name,.account-mini-tier,.account-mini-points{transition:color .18s ease,text-shadow .18s ease}
.account-mini-details:hover .account-mini-name{text-shadow:0 0 16px rgba(255,255,255,.15)}
.account-mini-details:hover .account-mini-tier{color:#e1cca9;text-shadow:0 0 15px rgba(209,188,152,.16)}
.account-mini-details:hover .account-mini-points{color:#c8f2f5;text-shadow:0 0 16px rgba(95,199,207,.18)}

.club-panel{
  clip-path:inset(0 0 0 10% round 0);
  transform:translateX(14px);
  filter:blur(2px);
  transition:
    opacity .22s ease,
    visibility .22s ease,
    transform .32s cubic-bezier(.22,1,.36,1),
    clip-path .34s cubic-bezier(.22,1,.36,1),
    filter .24s ease;
}
.club-panel.open{clip-path:inset(0 0 0 0 round 0);transform:translateX(0);filter:blur(0)}
.club-panel::after{
  content:"";
  position:absolute;
  inset:0;
  pointer-events:none;
  opacity:.32;
  background-image:
    radial-gradient(circle at 78% 0,rgba(95,199,207,.16),transparent 27%),
    radial-gradient(rgba(255,255,255,.22) .45px,transparent .55px);
  background-size:auto,18px 18px;
  -webkit-mask-image:linear-gradient(90deg,transparent 4%,#000 35%,#000 100%);
  mask-image:linear-gradient(90deg,transparent 4%,#000 35%,#000 100%);
}
.club-login-strip{z-index:2}
.club-intro{transition:border-color .2s ease,box-shadow .22s ease,transform .22s cubic-bezier(.22,1,.36,1)}
.club-intro:hover{transform:translateY(-1px);border-color:rgba(209,188,152,.34);box-shadow:0 17px 38px rgba(0,0,0,.24)}
.club-field{transition:border-color .18s ease,box-shadow .18s ease,transform .18s ease,background .18s ease}
.club-field:hover{transform:translateY(-1px);background:#fff}
.club-field input{transition:color .18s ease}
.club-submit:hover{transform:translateY(-1px);background:#fff;border-color:rgba(157,224,229,.58);box-shadow:0 12px 27px rgba(0,0,0,.18),0 0 0 1px rgba(95,199,207,.10)}
.club-close:hover{transform:rotate(4deg);background:rgba(255,255,255,.10);border-color:rgba(209,188,152,.38)}
.club-link{position:relative;transition:color .18s ease}
.club-link::after{content:"";position:absolute;left:0;right:100%;bottom:-3px;height:1px;background:linear-gradient(90deg,var(--sk-aqua),var(--sk-champagne));transition:right .2s ease}
.club-link:hover::after{right:0}

.mobile-menu-layer{opacity:0;transition:opacity .18s ease,visibility .18s ease}
.mobile-menu-layer.open{opacity:1}
.mobile-drawer{
  transform:translateX(10px);
  opacity:.98;
  filter:blur(1px);
  transition:transform .28s cubic-bezier(.22,1,.36,1),opacity .18s ease,filter .2s ease;
}
.mobile-menu-layer.open .mobile-drawer{transform:translateX(0);opacity:1;filter:blur(0)}
.mobile-menu-link{position:relative;transition:color .18s ease,background .18s ease,transform .18s ease,border-color .18s ease}
.mobile-menu-link:hover{transform:translateY(-1px);background:rgba(95,199,207,.08)}
.mobile-menu-link.active{background:rgba(95,199,207,.07)}
.mobile-search-wrap #mobileSearchInput{transform:scaleX(.92);transform-origin:right center}
.mobile-search-wrap.open #mobileSearchInput{transform:scaleX(1)}

@media(prefers-reduced-motion:reduce){
  .header-shell::before,.expandbar::before{transition:none!important}
  .action-btn:hover::after,.mobile-btn:hover::after,.settings-apply:hover::after,.club-submit:hover::after,.mobile-drawer-action:hover::after{animation:none!important;opacity:0!important}
  .club-panel,.mobile-drawer,.settings-menu,.search-field-shell{transform:none!important;filter:none!important}
}

</style>
</head>

<body>
<div id="skandi-site-header">
<header class="header-shell" id="header" data-component="customer-header">
  <section class="mainline">
    <div class="inner">
      <button class="logo" id="logoBtn" type="button" aria-label="SKANDI home">
        <img id="headerLogo" alt="SKANDI Travels">
      </button>

      <nav class="nav" id="nav" aria-label="Main navigation"></nav>

      <div class="actions">
        <div class="settings-wrap">
          <button class="action-btn desktop-only" id="settingsBtn" type="button"
            aria-haspopup="true" aria-expanded="false" aria-label="Language and currency">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
            </svg>
            <span id="settingsSummary">EN · USD</span>
          </button>

          <div class="settings-menu" id="settingsMenu">
            <div class="settings-group">
              <label for="langSelect" data-i18n="settings.language">Language</label>
              <select id="langSelect">
                <option value="EN">EN</option>
                <option value="SV">SV</option>
                <option value="NO">NO</option>
                <option value="DA">DA</option>
              </select>
            </div>

            <div class="settings-group">
              <label for="currSelect" data-i18n="settings.currency">Currency</label>
              <select id="currSelect">
                <option value="USD">USD</option>
                <option value="SEK">SEK</option>
                <option value="NOK">NOK</option>
                <option value="DKK">DKK</option>
                <option value="EUR">EUR</option>
              </select>
            </div>

            <button class="settings-apply" id="saveSettingsBtn" type="button" aria-label="Apply settings">✓</button>
          </div>
        </div>

        <div class="search-wrap desktop-only" id="searchWrap">
          <div class="search-field-shell">
            <div class="search-field-inner">
              <input id="headerSearchInput" type="search" placeholder="Search SKANDI"
                autocomplete="off" aria-label="Search SKANDI website">
              <button class="search-go" id="headerSearchGo" type="button" aria-label="Run search">→</button>
            </div>
          </div>
          <button class="action-btn" id="searchBtn" type="button" data-i18n="nav.search">Search</button>
        </div>

        <button class="action-btn" id="favBtn" type="button" aria-label="Favorites">♡</button>
        <button class="action-btn primary desktop-only" id="clubBtn" type="button" data-i18n="nav.clubBtn">SKANDI Club</button>

        <button class="mobile-btn" id="mobileBtn" type="button"
          aria-label="Open menu" aria-expanded="false" aria-controls="mobileDrawer">
          <span data-i18n="nav.menu">MENU</span><span>☰</span>
        </button>
      </div>
    </div>
  </section>

  <section class="expandbar" id="expandbar">
    <div class="expand-inner">
      <div class="default-bar">
        <div class="master-slogan" id="masterSlogan"></div>
        <div id="accountMini"></div>
      </div>
    </div>
  </section>

  <aside class="club-panel" id="clubPanel" aria-label="SKANDI Club sign in">
    <form id="inlineLoginForm" class="club-login-strip">
      <div class="club-intro" aria-hidden="true">
        <div class="club-eyebrow">SKANDI CLUB</div>
        <strong>Member access</strong>
        <span>Trips · Points · Profile</span>
      </div>

      <div class="club-field email">
        <label for="loginEmail">Email</label>
        <input type="email" id="loginEmail" placeholder="name@example.com"
          autocomplete="email" aria-label="Email address" required>
      </div>

      <div class="club-field password">
        <label for="loginPassword">Password</label>
        <input type="password" id="loginPassword" placeholder="Enter password"
          autocomplete="current-password" aria-label="Password" required>
      </div>

      <button type="submit" class="club-submit" id="clubLoginSubmit">Sign in</button>
      <div class="club-login-status" id="clubLoginStatus" aria-live="polite">Secure member access</div>

      <div class="club-links">
        <button type="button" class="club-link" data-action="forgot-password">Forgot password?</button>
        <button type="button" class="club-link" data-action="join-club">Join SKANDI Club</button>
      </div>

      <button class="club-close" id="clubClose" type="button" aria-label="Close SKANDI Club login">×</button>
    </form>
  </aside>
</header>
</div>

<div class="mobile-menu-layer" id="mobileMenuLayer" aria-hidden="true">
  <button class="mobile-menu-backdrop" id="mobileMenuBackdrop" type="button"
    tabindex="-1" aria-label="Close mobile menu"></button>

  <aside class="mobile-drawer" id="mobileDrawer" role="dialog"
    aria-modal="true" aria-labelledby="mobileMenuTitle" tabindex="-1">

    <div class="mobile-menu-top">
      <div class="mobile-drawer-brand">
        <strong id="mobileMenuTitle" data-i18n="nav.menu">Menu</strong>
        <span id="mobileAccount">Explore SKANDI Travels</span>
      </div>

      <nav class="mobile-menu-list" id="mobileList" aria-label="Mobile navigation"></nav>
      <button id="mobileMenuClose" type="button" aria-label="Close menu">×</button>
    </div>

    <div class="mobile-menu-bottom">
      <div class="mobile-settings-bar">
        <select id="mobileLangSelect" aria-label="Language">
          <option value="EN">EN</option>
          <option value="SV">SV</option>
          <option value="NO">NO</option>
          <option value="DA">DA</option>
        </select>

        <select id="mobileCurrSelect" aria-label="Currency">
          <option value="USD">USD</option>
          <option value="SEK">SEK</option>
          <option value="NOK">NOK</option>
          <option value="DKK">DKK</option>
          <option value="EUR">EUR</option>
        </select>
      </div>

      <div class="mobile-menu-spacer"></div>

      <div class="mobile-search-wrap" id="mobileSearchWrap">
        <input id="mobileSearchInput" type="search" placeholder="Search"
          autocomplete="off" aria-label="Search SKANDI website">
        <button class="mobile-drawer-action" id="mobileSearchBtn"
          type="button" data-i18n="nav.search">Search</button>
      </div>

      <button class="mobile-drawer-action primary" id="mobileAccountBtn"
        type="button" data-i18n="nav.signIn">Sign in</button>
    </div>
  </aside>
</div>

<script>
"use strict";

(() => {
  const SOURCE = "SKANDI_CUSTOMER_HEADER_EXPANDBAR";
  const PARENT = "SKANDI_WIX_PARENT";


  function updateHeaderFx(event) {
    const header = $("header");
    if (!header || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = header.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100));
    header.style.setProperty("--fx-x", `${x.toFixed(1)}%`);
    header.style.setProperty("--fx-y", `${y.toFixed(1)}%`);
  }

  function resetHeaderFx() {
    const header = $("header");
    if (!header) return;
    header.style.setProperty("--fx-x", "50%");
    header.style.setProperty("--fx-y", "26%");
  }

  const LANGUAGES = new Set(["EN","SV","NO","DA"]);
  const CURRENCIES = new Set(["USD","SEK","NOK","DKK","EUR"]);

  const HEADER_I18N = {
    EN:{
      "nav.search":"Search",
      "nav.clubBtn":"SKANDI Club",
      "nav.menu":"MENU",
      "nav.signIn":"Sign in",
      "settings.language":"Language",
      "settings.currency":"Currency"
    },
    SV:{
      "nav.search":"Sök",
      "nav.clubBtn":"SKANDI Club",
      "nav.menu":"MENY",
      "nav.signIn":"Logga in",
      "settings.language":"Språk",
      "settings.currency":"Valuta"
    },
    NO:{
      "nav.search":"Søk",
      "nav.clubBtn":"SKANDI Club",
      "nav.menu":"MENY",
      "nav.signIn":"Logg inn",
      "settings.language":"Språk",
      "settings.currency":"Valuta"
    },
    DA:{
      "nav.search":"Søg",
      "nav.clubBtn":"SKANDI Club",
      "nav.menu":"MENU",
      "nav.signIn":"Log ind",
      "settings.language":"Sprog",
      "settings.currency":"Valuta"
    }
  };

  let master = null;
  let session = {
    loggedIn:false,
    displayName:"",
    email:"",
    points:0,
    tierName:"",
    menu:[]
  };
  let userSettings = { language:"EN", currency:"USD" };
  let mobileMenuOpen = false;

  const $ = id => document.getElementById(id);

  function esc(value) {
    return String(value ?? "").replace(/[&<>'"]/g, character => ({
      "&":"&amp;",
      "<":"&lt;",
      ">":"&gt;",
      "'":"&#39;",
      '"':"&quot;"
    }[character]));
  }

  function post(type, payload = {}) {
    window.parent.postMessage({
      source:SOURCE,
      type,
      payload,
      timestamp:new Date().toISOString()
    }, "*");
  }

  function normalizeSettings(value = {}) {
    const source =
      value?.settings && typeof value.settings === "object"
        ? value.settings
        : value;

    const language = String(source?.language || "").trim().toUpperCase();
    const currency = String(source?.currency || "").trim().toUpperCase();

    return {
      language:LANGUAGES.has(language) ? language : "EN",
      currency:CURRENCIES.has(currency) ? currency : "USD"
    };
  }

  function currentLanguage() {
    return userSettings.language || "EN";
  }

  function translation(key, fallback = "") {
    const lang = currentLanguage();

    return (
      HEADER_I18N[lang]?.[key] ??
      HEADER_I18N.EN?.[key] ??
      fallback
    );
  }

  function applyTranslations() {
    document.querySelectorAll("[data-i18n]").forEach(element => {
      const value = translation(
        element.getAttribute("data-i18n"),
        ""
      );

      if (value) {
        element.textContent = value;
      }
    });

    document.documentElement.lang =
      ({EN:"en",SV:"sv",NO:"no",DA:"da"})[currentLanguage()] || "en";
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

  function applyBrandAssets() {
    const headerLogo =
      getAsset(
        "customerHeader",
        "skandiTravels",
        "skandiPrimary"
      );

    if (headerLogo && $("headerLogo")) {
      $("headerLogo").src = headerLogo;
    }
  }

  function renderMasterSlogan() {
    const target = $("masterSlogan");
    if (!target) return;

    const slogans = master?.brand?.slogans || {};
    const languageKey = currentLanguage().toLowerCase();

    // The slogan is intentionally NOT hard-coded in this header.
    // masterPage.js / MASTER_CONFIG.brand.slogans is the single source of truth.
    const slogan =
      String(
        slogans[languageKey] ??
        slogans.en ??
        ""
      ).trim();

    target.textContent = slogan;
    target.title = slogan;
  }

  function cacheSettings() {
    try {
      localStorage.setItem(
        "skandi_user_settings",
        JSON.stringify(userSettings)
      );
    } catch (_) {}
  }

  function readCache() {
    try {
      const cached =
        JSON.parse(
          localStorage.getItem("skandi_user_settings") || "null"
        );

      if (cached) {
        userSettings = normalizeSettings(cached);
      }
    } catch (_) {}
  }

  function updateSettingsUI() {
    if ($("langSelect")) {
      $("langSelect").value = userSettings.language;
    }

    if ($("currSelect")) {
      $("currSelect").value = userSettings.currency;
    }

    if ($("mobileLangSelect")) {
      $("mobileLangSelect").value = userSettings.language;
    }

    if ($("mobileCurrSelect")) {
      $("mobileCurrSelect").value = userSettings.currency;
    }

    if ($("settingsSummary")) {
      $("settingsSummary").textContent =
        `${userSettings.language} · ${userSettings.currency}`;
    }

    applyTranslations();
    renderMasterSlogan();
  }

  function applyParentSettings(value = {}) {
    userSettings = normalizeSettings(value);
    cacheSettings();
    updateSettingsUI();
  }

  function setSettingsOpen(open) {
    const menu = $("settingsMenu");
    const header = $("header");
    const button = $("settingsBtn");
    if (!menu || !header || !button) return;

    const next = Boolean(open);
    menu.classList.toggle("open", next);
    header.classList.toggle("settings-open", next);
    button.setAttribute("aria-expanded", String(next));
  }

  function closeSettings() {
    setSettingsOpen(false);
  }

  function saveSettings(language, currency) {
    userSettings = normalizeSettings({
      language,
      currency
    });

    cacheSettings();
    updateSettingsUI();

    post(
      "UPDATE_SETTINGS",
      { ...userSettings }
    );
  }

  function navItems() {
    return Array.isArray(master?.customer?.header?.primaryNav)
      ? master.customer.header.primaryNav
      : [];
  }

  function secondaryItems() {
    return Array.isArray(master?.customer?.header?.secondaryNav)
      ? master.customer.header.secondaryNav
      : [];
  }

  function accountItems() {
    return Array.isArray(master?.customer?.header?.accountNav)
      ? master.customer.header.accountNav
      : [];
  }

  function currentPath() {
    return String(master?.currentPath || "");
  }

  function isActivePath(path) {
    const value = String(path || "").split("?")[0];
    const current = currentPath().split("?")[0];

    return Boolean(
      value &&
      (
        current === value ||
        current.startsWith(value + "/")
      )
    );
  }

  function navTo(path) {
    const value = String(path || "").trim();
    if (!value) return;

    closeDesktopSearch();
    closeMobile();
    closeClub();
    closeSettings();

    post(
      "HEADER_NAVIGATE",
      { path:value }
    );
  }

  function renderDesktopNav() {
    const nav = $("nav");
    if (!nav) return;

    const items = [
      ...navItems(),
      ...(session.loggedIn
        ? accountItems().filter(item =>
            String(item.id || "").toLowerCase().includes("profile") ||
            String(item.label || "").toLowerCase().includes("profile")
          )
        : [])
    ];

    nav.innerHTML = items.map(item => `
      <button
        class="nav-btn${isActivePath(item.path) ? " active" : ""}"
        type="button"
        data-path="${esc(item.path || "")}">
        ${esc(item.label || "")}
      </button>
    `).join("");

    nav.querySelectorAll("[data-path]").forEach(button => {
      button.addEventListener(
        "click",
        () => navTo(button.dataset.path)
      );
    });
  }

  function renderMobileNav() {
    const list = $("mobileList");
    if (!list) return;

    const items = [
      ...navItems(),
      ...secondaryItems(),
      ...(session.loggedIn
        ? accountItems()
        : [])
    ];

    list.innerHTML = items.map(item => `
      <button
        class="mobile-menu-link${isActivePath(item.path) ? " active" : ""}"
        type="button"
        data-path="${esc(item.path || "")}">
        ${esc(item.label || "")}
      </button>
    `).join("");

    list.querySelectorAll("[data-path]").forEach(button => {
      button.addEventListener(
        "click",
        () => navTo(button.dataset.path)
      );
    });

    if ($("mobileAccount")) {
      $("mobileAccount").textContent =
        session.loggedIn
          ? (
              session.displayName ||
              master?.brand?.travelName ||
              ""
            )
          : (
              master?.brand?.travelName ||
              "SKANDI Travels"
            );
    }

    if ($("mobileAccountBtn")) {
      $("mobileAccountBtn").textContent =
        session.loggedIn
          ? (
              accountItems().find(item =>
                String(item.label || "").toLowerCase().includes("trip")
              )?.label ||
              "My Trips"
            )
          : translation("nav.signIn","Sign in");
    }
  }

  function renderAccountMini() {
    const target = $("accountMini");
    if (!target) return;

    if (!session.loggedIn) {
      target.innerHTML = "";
      return;
    }

    const name =
      session.displayName ||
      "Member";

    const email =
      String(session.email || "").trim();

    const points =
      Number(session.points || 0);

    const tier = String(session.tierName || "").trim();

    target.innerHTML = `
      <div class="account-mini-details">
        <span class="account-mini-name">${esc(name)}</span>
        ${tier ? `
          <span class="account-mini-separator">·</span>
          <span class="account-mini-tier">${esc(tier)}</span>
        ` : ""}
        ${email ? `
          <span class="account-mini-separator">·</span>
          <span class="account-mini-email">${esc(email)}</span>
        ` : ""}
        <span class="account-mini-separator">·</span>
        <span class="account-mini-points">${points.toLocaleString()} pts</span>
      </div>
    `;
  }

  function setClubBusy(busy) {
    if ($("clubLoginSubmit")) {
      $("clubLoginSubmit").disabled = Boolean(busy);
    }
  }

  function setClubMessage(message = "", kind = "") {
    const target = $("clubLoginStatus");
    if (!target) return;

    target.textContent = String(message || "");
    target.classList.toggle("error", kind === "error");
  }

  function openClub(context = "") {
    closeDesktopSearch();
    closeMobile();

    closeSettings();

    if ($("clubPanel")) {
      $("clubPanel").classList.add("open");
    }

    if (context === "favorites") {
      setClubMessage(
        "Sign in to open your saved favorites."
      );
    }

    requestAnimationFrame(
      () => $("loginEmail")?.focus()
    );
  }

  function closeClub() {
    $("clubPanel")?.classList.remove("open");
    setClubBusy(false);
  }

  function renderClub() {
    if (session.loggedIn) {
      setClubBusy(false);
      setClubMessage("");
      closeClub();
    }
  }

  function openMobile() {
    closeClub();
    closeDesktopSearch();

    mobileMenuOpen = true;

    $("mobileMenuLayer")?.classList.add("open");
    $("mobileMenuLayer")?.setAttribute("aria-hidden","false");
    $("mobileBtn")?.setAttribute("aria-expanded","true");

    document.documentElement.classList.add("mobile-menu-open");
    document.body.classList.add("mobile-menu-open");
  }

  function closeMobile() {
    mobileMenuOpen = false;

    $("mobileMenuLayer")?.classList.remove("open");
    $("mobileMenuLayer")?.setAttribute("aria-hidden","true");
    $("mobileBtn")?.setAttribute("aria-expanded","false");

    document.documentElement.classList.remove("mobile-menu-open");
    document.body.classList.remove("mobile-menu-open");

    closeMobileSearch();
  }

  function searchPath(query) {
    const q =
      String(query || "")
        .trim()
        .replace(/\s+/g," ")
        .slice(0,100);

    if (!q) return "";

    const base =
      String(master?.routes?.search || "/search")
        .split("?")[0];

    return `${base}?q=${encodeURIComponent(q)}`;
  }

  function submitSearch(inputId) {
    const input = $(inputId);
    const path = searchPath(input?.value || "");

    if (!path) {
      input?.focus();
      return;
    }

    navTo(path);
  }

  function openDesktopSearch() {
    closeClub();
    closeMobile();

    closeSettings();

    $("searchWrap")?.classList.add("open");

    requestAnimationFrame(
      () => $("headerSearchInput")?.focus()
    );
  }

  function closeDesktopSearch() {
    $("searchWrap")?.classList.remove("open");
  }

  function openMobileSearch() {
    $("mobileSearchWrap")?.classList.add("open");

    requestAnimationFrame(
      () => $("mobileSearchInput")?.focus()
    );
  }

  function closeMobileSearch() {
    $("mobileSearchWrap")?.classList.remove("open");
  }

  function renderAll() {
    applyBrandAssets();
    renderDesktopNav();
    renderMobileNav();
    renderClub();
    renderAccountMini();
    applyTranslations();
    renderMasterSlogan();
    updateSettingsUI();

    if ($("clubBtn")) {
      $("clubBtn").textContent = session.loggedIn ? "My Club" : translation("nav.clubBtn","SKANDI Club");
      $("clubBtn").setAttribute("aria-label", session.loggedIn ? "Open My Club" : "Open SKANDI Club");
    }
  }

  function bind() {
    $("header")?.addEventListener("pointermove", updateHeaderFx, { passive:true });
    $("header")?.addEventListener("pointerleave", resetHeaderFx, { passive:true });
    $("logoBtn")?.addEventListener("click", () => {
      navTo(master?.routes?.home || "/");
    });

    $("favBtn")?.addEventListener("click", () => {
      if (session.loggedIn) {
        navTo(
          master?.routes?.mySaved ||
          "/my-profile?section=profile&view=saved"
        );
      } else {
        openClub("favorites");
      }
    });

    $("clubBtn")?.addEventListener("click", () => {
      if (session.loggedIn) {
        navTo(
          master?.routes?.myClub ||
          accountItems().find(item =>
            String(item.id || "").toLowerCase().includes("club")
          )?.path ||
          "/my-profile?section=club&view=overview"
        );
      } else {
        openClub();
      }
    });

    $("clubClose")?.addEventListener(
      "click",
      closeClub
    );

    $("inlineLoginForm")?.addEventListener("submit", event => {
      event.preventDefault();

      const email =
        $("loginEmail")?.value?.trim() || "";

      const password =
        $("loginPassword")?.value || "";

      if (!email || !password) {
        setClubMessage(
          "Enter your email and password.",
          "error"
        );
        return;
      }

      setClubBusy(true);
      setClubMessage("Signing in…");

      post(
        "HEADER_LOGIN_SUBMIT",
        { email, password }
      );
    });

    document.addEventListener("click", event => {
      const action =
        event.target.closest("[data-action]");

      if (action?.dataset.action === "forgot-password") {
        setClubMessage("");
        post("HEADER_FORGOT_PASSWORD");
        return;
      }

      if (action?.dataset.action === "join-club") {
        navTo(
          master?.routes?.club ||
          "/skandi-club"
        );
      }
    });

    $("mobileBtn")?.addEventListener("click", () => {
      mobileMenuOpen
        ? closeMobile()
        : openMobile();
    });

    $("mobileMenuBackdrop")?.addEventListener(
      "click",
      closeMobile
    );

    $("mobileMenuClose")?.addEventListener(
      "click",
      closeMobile
    );

    $("searchBtn")?.addEventListener("click", () => {
      if (!$("searchWrap")?.classList.contains("open")) {
        openDesktopSearch();
        return;
      }

      submitSearch("headerSearchInput");
    });

    $("headerSearchGo")?.addEventListener(
      "click",
      () => submitSearch("headerSearchInput")
    );

    $("headerSearchInput")?.addEventListener("keydown", event => {
      if (event.key === "Enter") {
        event.preventDefault();
        submitSearch("headerSearchInput");
      }

      if (event.key === "Escape") {
        closeDesktopSearch();
        $("searchBtn")?.focus();
      }
    });

    $("mobileSearchBtn")?.addEventListener("click", () => {
      if (!$("mobileSearchWrap")?.classList.contains("open")) {
        openMobileSearch();
        return;
      }

      submitSearch("mobileSearchInput");
    });

    $("mobileSearchInput")?.addEventListener("keydown", event => {
      if (event.key === "Enter") {
        event.preventDefault();
        submitSearch("mobileSearchInput");
      }

      if (event.key === "Escape") {
        closeMobileSearch();
      }
    });

    $("mobileAccountBtn")?.addEventListener("click", () => {
      closeMobile();

      if (session.loggedIn) {
        const path =
          accountItems().find(item =>
            String(item.label || "")
              .toLowerCase()
              .includes("trip")
          )?.path ||
          accountItems()[0]?.path ||
          master?.routes?.myTrips ||
          "/my-profile?section=trips&view=upcoming";

        navTo(path);
      } else {
        openClub();
      }
    });

    $("settingsBtn")?.addEventListener("click", event => {
      event.stopPropagation();

      const menu = $("settingsMenu");
      if (!menu) return;

      const opening = !menu.classList.contains("open");
      closeDesktopSearch();
      setSettingsOpen(opening);
    });

    document.addEventListener("click", event => {
      if (
        $("settingsMenu") &&
        !$("settingsMenu").contains(event.target) &&
        !$("settingsBtn")?.contains(event.target)
      ) {
        closeSettings();
      }

      if (
        $("searchWrap")?.classList.contains("open") &&
        !$("searchWrap").contains(event.target)
      ) {
        closeDesktopSearch();
      }
    });

    $("saveSettingsBtn")?.addEventListener("click", () => {
      saveSettings(
        $("langSelect")?.value,
        $("currSelect")?.value
      );

      closeSettings();
    });

    $("mobileLangSelect")?.addEventListener("change", event => {
      saveSettings(
        event.target.value,
        userSettings.currency
      );
    });

    $("mobileCurrSelect")?.addEventListener("change", event => {
      saveSettings(
        userSettings.language,
        event.target.value
      );
    });

    document.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        closeDesktopSearch();
        closeMobile();
        closeClub();
        closeSettings();
      }
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 900) {
        closeMobile();
      }
    });
  }

  window.addEventListener("message", event => {
    let msg = event.data;

    if (typeof msg === "string") {
      try {
        msg = JSON.parse(msg);
      } catch (_) {
        return;
      }
    }

    if (
      !msg ||
      typeof msg !== "object" ||
      msg.source !== PARENT
    ) {
      return;
    }

    if (msg.type === "SKANDI_MASTER_CONFIG") {
      master = msg.payload || {};

      if (master?.settings) {
        applyParentSettings(
          master.settings
        );
      }

      renderAll();
      return;
    }

    if (
      msg.type === "CUSTOMER_SETTINGS_STATE" ||
      msg.type === "SKANDI_SETTINGS_STATE"
    ) {
      applyParentSettings(
        msg.payload || {}
      );

      renderAll();
      return;
    }

    if (msg.type === "CUSTOMER_SETTINGS_SAVED") {
      if (msg.payload?.ok) {
        applyParentSettings(
          msg.payload?.state ||
          msg.payload
        );
      }

      return;
    }

    if (msg.type === "CUSTOMER_HEADER_STATE") {
      session = {
        loggedIn:Boolean(msg.payload?.loggedIn),
        displayName:msg.payload?.displayName || "",
        email:msg.payload?.email || "",
        points:Number(msg.payload?.points || 0),
        tierName:msg.payload?.tierName || "",
        menu:Array.isArray(msg.payload?.menu)
          ? msg.payload.menu
          : []
      };

      if (session.loggedIn) {
        setClubBusy(false);
        setClubMessage("");
        closeClub();
      }

      renderAll();
      return;
    }

    if (msg.type === "HOME_ERROR") {
      setClubBusy(false);

      setClubMessage(
        msg.payload?.message ||
        "Invalid email or password. Please try again.",
        "error"
      );

      return;
    }

    if (msg.type === "CLOSE_CUSTOMER_HEADER_PANELS") {
      closeDesktopSearch();
      closeMobile();
      closeClub();
      closeSettings();
    }
  });

  readCache();
  bind();
  renderAll();

  post(
    "MASTER_CONFIG_REQUEST",
    { context:"customer-header" }
  );

  post(
    "CUSTOMER_SETTINGS_REQUEST"
  );

  post(
    "SKANDI_EMBED_RESIZE",
    { height:118 }
  );

  post(
    "HEADER_READY"
  );
})();
</script>
</body>
</html>
