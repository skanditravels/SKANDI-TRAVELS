# About

STATUS: NEEDS REVIEW
SLUG: /about
WIX PAGE: About.xcftf
AREA: SKANDI
LIVE HTML: YES
ELEMENT: #aboutEmbed
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
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"/>
<meta name="theme-color" content="#022e64"/>
<title>About SKANDI</title>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet"/>

<style>
/* ==========================================================================
   GLOBAL DESIGN SYSTEM & VARIABLES
   ========================================================================== */
:root {
  --sk-blue: #022e64;
  --sk-blue2: #0b3a7a;
  --sk-blue-soft: #1F6BA3;
  --sk-light:#d7e6ff;
  --sk-cyan: #5FC7CF;
  --sk-bg: #ffffff;
  --sk-bg-alt: #f6f8fb;
  --sk-text: #111827;
  --sk-body: #4d5f74;
  --sk-muted: #66758a;
  --sk-line: #dfe5ef;
  --sk-border-soft: #eef2f7;
  --sk-shadow: 0 16px 45px rgba(2, 46, 100, 0.08);
  --sk-shadow-hover: 0 24px 60px rgba(2, 46, 100, 0.15);
  --sk-radius: 24px;
  
  --header-h: 74px;
  --bar-height: 44px;
  --header-total: 118px;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

html, body {
  font-family: 'Montserrat', system-ui, -apple-system, "Segoe UI", sans-serif;
  background: var(--sk-bg);
  color: var(--sk-text);
  overflow-x: hidden;
  line-height: 1.6;
}

button, input, select { font: inherit; }
a { color: inherit; text-decoration: none; }
img { max-width: 100%; display: block; }

/* Accessibility Skip Link */
.skip-link {
  position: absolute; left: -999px; top: auto; width: 1px; height: 1px; overflow: hidden;
}
.skip-link:focus {
  left: 16px; top: 16px; width: auto; height: auto; background: #fff; color: var(--sk-blue);
  padding: 10px 14px; z-index: 9999; border-radius: 8px; font-weight: 700;
}

/* Premium Buttons */
.btn {
  position: relative;
  appearance: none;
  border: 1px solid transparent;
  background: var(--sk-blue);
  color: #fff;
  border-radius: 999px;
  padding: 14px 28px;
  font-size: 13px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 48px;
  overflow: hidden;
  transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.3s ease, background 0.3s ease;
}

.btn::before {
  content: ''; position: absolute; top: 0; left: -100%; width: 50%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transform: skewX(-25deg); transition: left 0.6s ease;
}
.btn:hover::before { left: 150%; }
.btn-secondary { background: #fff; color: var(--sk-blue); border-color: var(--sk-line); }
.btn-secondary::before { background: linear-gradient(90deg, transparent, rgba(2, 46, 100, 0.05), transparent); }
.btn-light { background: rgba(255, 255, 255, 0.1); color: #fff; border-color: rgba(255, 255, 255, 0.3); backdrop-filter: blur(8px); }
.btn:hover { transform: translateY(-3px); box-shadow: 0 12px 28px rgba(2, 46, 100, 0.2); }
.btn-secondary:hover { border-color: var(--sk-blue); }
.btn-light:hover { background: #fff; color: var(--sk-blue); border-color: #fff; }

/* ==========================================================================
   HEADER & FOOTER (INTEGRATED)
   ========================================================================== */
#skandi-site-header, #skandi-site-footer { width: 100%; display: block; }
#skandi-site-header .header-shell { position: relative; z-index: 100; height: var(--header-total); background: #fff; box-shadow: 0 4px 24px rgba(15,23,42,.08); }
#skandi-site-header .mainline { height: var(--header-h); background: #fff; border-bottom: 1px solid var(--sk-line); }
#skandi-site-header .inner { max-width: 1440px; margin: 0 auto; height: 100%; padding: 0 18px; display: flex; align-items: center; gap: 18px; }
#skandi-site-header .logo { border: 0; background: transparent; padding: 0; display: flex; align-items: center; flex: 0 0 auto; flex-shrink: 0; cursor:pointer;}
#skandi-site-header .logo img { height: 50px; width: auto; object-fit: contain; }
#skandi-site-header .nav { flex: 1; display: flex; align-items: center; gap: 4px; min-width: 0; }
#skandi-site-header .nav-btn { border: 0; background: transparent; color: var(--sk-blue); border-radius: 999px; padding: 10px 14px; font-size: 13px; font-weight: 800; white-space: nowrap; position: relative; overflow: visible; transition: color 0.3s; }
#skandi-site-header .nav-btn:hover { color: var(--sk-cyan); }
#skandi-site-header .nav-btn::after { content: ""; position: absolute; bottom: 0; left: 50%; width: 0; height: 3px; background-color: var(--sk-cyan); border-radius: 999px; transition: width 0.3s ease, left 0.3s ease; }
#skandi-site-header .nav-btn:hover::after, #skandi-site-header .nav-btn.active::after { width: 80%; left: 10%; }
#skandi-site-header .actions { display: flex; align-items: center; gap: 8px; flex: 0 0 auto; flex-shrink: 0; }
#skandi-site-header .action-btn, #skandi-site-header .mobile-btn { border: 0; background: #fff; color: var(--sk-blue); border-radius: 999px; min-height: 40px; padding: 0 16px; font-size: 12px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; cursor:pointer; transition: all 0.3s;}
#skandi-site-header .action-btn:hover { background: var(--sk-bg-alt); }
#skandi-site-header .action-btn.primary { background: var(--sk-blue); color: #fff; }
#skandi-site-header .action-btn.primary:hover { background: var(--sk-blue2); box-shadow: 0 8px 16px rgba(2,46,100,0.2); transform: translateY(-1px);}
#skandi-site-header .mobile-btn { display: none; width: auto; height: 40px; gap: 8px; white-space: nowrap; flex-shrink: 0; }
#skandi-site-header .expandbar { height: var(--bar-height); background: linear-gradient(90deg, var(--sk-blue), var(--sk-blue2)); color: #fff; position: relative; overflow: hidden; z-index: 80; }
#skandi-site-header .expand-inner { max-width: 1240px; margin: 0 auto; height: 100%; padding: 0 18px; position: relative; }
#skandi-site-header .default-bar { height: 100%; display: flex; align-items: center; justify-content: space-between; gap: 14px; color: rgba(255,255,255,.88); font-size: 11px; font-weight: 700; letter-spacing: .09em; font-style: italic; text-transform: uppercase; }
#skandi-site-header .default-bar span { font-weight: 900; font-style: normal; color: var(--sk-cyan); }
#skandi-site-header .expandbar-img { 
  height: clamp(38px, 4vw, 36px); 
  width: auto; 
  max-width: 100%;
  object-fit: contain; 
  display: block; 
}

/* Favorite Button Animation */
@keyframes favPop { 0% { transform: scale(1); } 40% { transform: scale(1.35); color: var(--sk-cyan); } 100% { transform: scale(1); } }
#favBtn { transition: color 0.2s ease, transform 0.2s; transform-origin: center; cursor: pointer; }
#favBtn.saved { animation: favPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }

/* Globe / Settings Dropdown */
.settings-wrap { position: relative; display: inline-block; }
#settingsBtn { padding: 0 10px; cursor: pointer; }
#settingsBtn svg { width: 22px; height: 22px; fill: currentColor; transition: transform 0.3s; }
#settingsBtn:hover svg { transform: rotate(15deg); }
.settings-menu { position: absolute; top: calc(100% + 14px); right: 0; background: rgba(255,255,255,0.95); backdrop-filter: blur(12px); border: 1px solid var(--sk-line); border-radius: 20px; box-shadow: 0 20px 50px rgba(2, 46, 100, 0.15); padding: 24px; width: 260px; z-index: 200; opacity: 0; visibility: hidden; transform: translateY(-10px) scale(0.95); transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1); transform-origin: top right; }
.settings-menu.open { opacity: 1; visibility: visible; transform: translateY(0) scale(1); }
.settings-group { margin-bottom: 16px; text-align: left; }
.settings-group label { display: block; font-size: 11px; font-weight: 800; color: var(--sk-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
.settings-group select { width: 100%; padding: 14px 16px; border: 1px solid var(--sk-border-soft); border-radius: 12px; font-size: 13px; color: var(--sk-blue); font-weight: 600; outline: none; background: #f9fafb; cursor: pointer; transition: all 0.2s; }
.settings-group select:focus, .settings-group select:hover { border-color: var(--sk-cyan); background: #fff; box-shadow: 0 4px 12px rgba(95,199,207,0.1); }
.mobile-settings-bar { display: flex; gap: 10px; padding: 16px; border-bottom: 1px solid var(--sk-border-soft); background: var(--sk-bg-alt); }
.mobile-settings-bar select { flex: 1; padding: 12px; border-radius: 10px; border: 1px solid var(--sk-line); font-size: 13px; font-weight: 600; color: var(--sk-blue); background: #fff; }

/* WELCOME SETTINGS MODAL */
.welcome-modal-layer { position: fixed; inset: 0; z-index: 99999; display: flex; align-items: center; justify-content: center; visibility: hidden; pointer-events: none; }
.welcome-modal-layer.active { visibility: visible; pointer-events: auto; }
.welcome-backdrop { position: absolute; inset: 0; background: rgba(2,18,39,0.7); backdrop-filter: blur(8px); opacity: 0; transition: opacity 0.4s ease; }
.welcome-modal-layer.active .welcome-backdrop { opacity: 1; }
.welcome-card { position: relative; background: #fff; width: min(440px, 90vw); border-radius: 32px; box-shadow: 0 32px 80px rgba(2,46,100,0.25); padding: 48px 40px; text-align: center; transform: translateY(20px) scale(0.95); opacity: 0; transition: all 0.5s cubic-bezier(0.22, 1, 0.36, 1); }
.welcome-modal-layer.active .welcome-card { transform: translateY(0) scale(1); opacity: 1; }
.welcome-card .globe-icon { color: var(--sk-cyan); margin-bottom: 20px; }
.welcome-card .globe-icon svg { width: 56px; height: 56px; fill: currentColor; margin: 0 auto; animation: pulseGlow 3s infinite alternate; }
.welcome-card h2 { color: var(--sk-blue); font-size: 28px; font-weight: 800; margin-bottom: 12px; letter-spacing:-0.03em;}
.welcome-card p { color: var(--sk-body); font-size: 15px; margin-bottom: 32px; line-height:1.6;}
@keyframes pulseGlow { 0% { filter: drop-shadow(0 0 4px rgba(95,199,207,0.3)); } 100% { filter: drop-shadow(0 0 16px rgba(95,199,207,0.8)); } }

/* Slide-out Panels & Mobile Menu */
#skandi-site-header .club-backdrop { position: fixed; inset: 0; background: rgba(2,18,39,0.5); backdrop-filter: blur(6px); z-index: 9998; opacity: 0; visibility: hidden; transition: all 0.4s ease; }
#skandi-site-header .club-backdrop.open { opacity: 1; visibility: visible; }
#skandi-site-header .club-panel { position: fixed; top: 0; right: 0; height: 100dvh; width: min(440px, 100vw); background: #fff; box-shadow: -20px 0 60px rgba(2,46,100,0.15); z-index: 9999; border-top-left-radius: 32px; border-bottom-left-radius: 32px; transform: translateX(100%); opacity: 0; pointer-events: none; transition: transform 0.55s cubic-bezier(0.22,1,0.36,1), opacity 0.55s ease; display: flex; flex-direction: column; }
#skandi-site-header .club-panel.open { transform: translateX(0); opacity: 1; pointer-events: auto; }
#skandi-site-header .club-head { height: 90px; background: linear-gradient(135deg, var(--sk-blue), var(--sk-blue2)); color: #fff; display: flex; align-items: center; justify-content: space-between; padding: 0 32px; }
#skandi-site-header .club-head strong { font-size: 18px; font-weight: 800; letter-spacing: -0.02em; }
#skandi-site-header .club-close { border: 1px solid rgba(255,255,255,0.28); background: rgba(255,255,255,0.12); color: #fff; width: 40px; height: 40px; border-radius: 999px; font-size: 24px; font-weight: 700; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.3s ease;}
#skandi-site-header .club-close:hover { background: rgba(255,255,255,0.25); transform: rotate(90deg); }
#skandi-site-header .club-body { padding: 40px 32px; flex: 1; overflow-y: auto; }
#skandi-site-header .login-form { display: flex; flex-direction: column; gap: 16px; }
#skandi-site-header .login-form input { padding: 18px 20px; border: 1px solid var(--sk-border-soft); border-radius: 14px; font-size: 15px; background: #f9fafb; transition: all 0.3s ease; }
#skandi-site-header .login-form input:focus { outline: none; border-color: var(--sk-cyan); background: #fff; box-shadow: 0 0 0 4px rgba(95,199,207,0.1); }

/* Custom Favorites Slide-out State */
@keyframes heartFloat { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-8px) scale(1.05); } }
@keyframes favPopIn { from { opacity: 0; transform: scale(0.5) translateY(30px); } to { opacity: 1; transform: scale(1) translateY(0); } }
.fav-hero-icon { display: block; font-size: 64px; color: var(--sk-cyan); text-align: center; margin-bottom: 16px; text-shadow: 0 16px 32px rgba(95, 199, 207, 0.4); animation: favPopIn 0.7s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards, heartFloat 3.5s ease-in-out infinite 0.7s; }
.fav-hero-title { display: block; font-size: 28px; font-weight: 800; color: var(--sk-blue); text-align: center; margin-bottom: 12px; letter-spacing: -0.03em; }
.fav-hero-text { display: block; font-size: 15px; color: var(--sk-body); text-align: center; line-height: 1.7; }

/* Mobile Navigation */
html.mobile-menu-open, body.mobile-menu-open { overflow: hidden; }
.mobile-menu-layer { position: fixed; inset: 0; z-index: 2000; visibility: hidden; pointer-events: none; transition: visibility 0s linear 0.3s; }
.mobile-menu-layer.open { visibility: visible; pointer-events: auto; transition-delay: 0s; }
.mobile-menu-backdrop { position: absolute; inset: 0; background: rgba(2,18,39,0.6); backdrop-filter: blur(6px); opacity: 0; border: 0; transition: opacity 0.4s ease; width: 100%; cursor: default; }
.mobile-menu-layer.open .mobile-menu-backdrop { opacity: 1; }
.mobile-drawer { position: absolute; top: 0; right: 0; width: min(86vw, 380px); height: 100dvh; background: #fff; transform: translateX(105%); transition: transform 0.4s cubic-bezier(0.22,0.8,0.2,1); display: flex; flex-direction: column; border-top-left-radius: 24px; border-bottom-left-radius: 24px; overflow: hidden;}
.mobile-menu-layer.open .mobile-drawer { transform: translateX(0); }
.mobile-drawer-head { padding: 20px 24px; background: linear-gradient(135deg, var(--sk-blue), var(--sk-blue2)); color: #fff; display: flex; align-items: center; justify-content: space-between; }
.mobile-drawer-head strong { font-size: 20px; font-weight: 800; line-height: 1.2; letter-spacing:-0.02em;}
.mobile-drawer-head span { display: block; font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.8); margin-top: 4px; }
#mobileMenuClose { width: 40px; height: 40px; border: 1px solid rgba(255,255,255,.32); border-radius: 999px; background: rgba(255,255,255,.12); color: #fff; font-size: 26px; cursor: pointer; transition: all 0.3s;}
#mobileMenuClose:hover { background: rgba(255,255,255,0.25); transform: rotate(90deg); }
.mobile-drawer-body { flex: 1; overflow-y: auto; padding: 0; }
.mobile-menu-link { width: 100%; min-height: 60px; border: 0; border-bottom: 1px solid var(--sk-border-soft); background: #fff; color: var(--sk-blue); padding: 16px 24px; text-align: left; font-size: 15px; font-weight: 700; display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: background 0.2s;}
.mobile-menu-link:hover { background: var(--sk-pale); }
.mobile-menu-link::after { content: "›"; color: var(--sk-cyan); font-size: 28px; font-weight: 500; transition: transform 0.2s; }
.mobile-menu-link:hover::after { transform: translateX(4px); }
.mobile-drawer-actions { padding: 20px 24px; border-top: 1px solid var(--sk-line); display: grid; grid-template-columns: 1fr 1fr; gap: 12px; background: #fff;}
.mobile-drawer-action { min-height: 48px; border: 1px solid var(--sk-line); border-radius: 999px; background: #fff; color: var(--sk-blue); font-size: 13px; font-weight: 800; cursor: pointer; transition: all 0.3s;}
.mobile-drawer-action.primary { background: var(--sk-blue); color: #fff; border-color: var(--sk-blue); }
.mobile-drawer-action:hover { transform: translateY(-2px); box-shadow: 0 8px 16px rgba(2,46,100,0.1); }

@media(max-width: 900px){
  #skandi-site-header .nav, #skandi-site-header .desktop-only { display: none; }
  #skandi-site-header .inner { justify-content: space-between; gap: 12px; }
  #skandi-site-header .actions { flex-shrink: 0; }
  #skandi-site-header .mobile-btn { display: inline-flex; white-space: nowrap; flex-shrink: 0; }
}

/* BULLETPROOF LOGO LOCKS */
#skandi-site-header button.logo { flex: 0 1 auto !important; min-width: 0 !important; height: auto !important; padding: 0 !important; background: transparent !important; border: none !important; }
#skandi-site-header button.logo img { height: clamp(34px, 10vw, 50px) !important; width: auto !important; max-width: 100% !important; object-fit: contain !important; object-position: left center !important; display: block !important; }
#skandi-site-footer .brand img.logo { width: 190px !important; max-width: 100% !important; height: auto !important; margin-bottom: 16px !important; object-fit: contain !important; display: block !important; }

/* ==========================================================================
   ABOUT PAGE CONTENT SECTIONS
   ========================================================================== */
.section { max-width: 1240px; margin: 0 auto; padding: 100px 24px 0; }
.section-head { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: end; margin-bottom: 56px; }
.section-head h2 { font-size: clamp(36px, 5vw, 52px); line-height: 1.05; color: var(--sk-blue); letter-spacing: -0.03em; }

.gradient-text { background: linear-gradient(135deg, var(--sk-blue), var(--sk-cyan)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; display: inline-block; }
.section-head .copy { font-size: 18px; color: var(--sk-body); max-width: 600px; line-height: 1.7; font-weight: 400; }
.eyebrow { display: inline-flex; align-items: center; gap: 12px; color: var(--sk-blue); text-transform: uppercase; letter-spacing: 0.2em; font-size: 12px; font-weight: 800; margin-bottom: 16px; }
.eyebrow:before { content: ""; width: 48px; height: 2px; background: var(--sk-cyan); border-radius: 2px; }
.eyebrow.light { color: #fff; }
.copy { line-height: 1.8; color: var(--sk-body); font-size: 16px; font-weight: 400;}

/* Elevated Hero Section */
@keyframes gradientMove { 
  /* Animerar bara det rörliga färgskimret, den statiska glowen ligger still */
  0% { background-position: center, 0% 50%; } 
  50% { background-position: center, 100% 50%; } 
  100% { background-position: center, 0% 50%; } 
}

/* 1. Själva bilden läggs på huvudcontainern (helt stilla) */
.hero { 
  position: relative; 
  min-height: 600px; 
  background: var(--hero-image, url('https://static.wixstatic.com/media/394052_c28e933557934c498c287c32cd5110b1~mv2.png')) center/cover no-repeat;
  display: flex; 
  align-items: center; 
  padding: 120px 24px; 
  overflow: hidden; 
}
.hero::before { 
  content: ''; 
  position: absolute; 
  inset: 0; 
  background: 
    /* Den turkosa runda "glowen" uppe i högra hörnet (stilla) */
    radial-gradient(circle at 85% 15%, rgba(95, 199, 207, 0.3) 0%, transparent 60%),
    /* Det mörkblå skimret med transparens som åker fram och tillbaka (rörligt) */
    linear-gradient(-45deg, rgba(2, 46, 100, 0.75), rgba(11, 58, 122, 0.85), rgba(31, 107, 163, 0.75), rgba(2, 46, 100, 0.85)); 
  
  background-size: 100% 100%, 400% 400%; 
  animation: gradientMove 15s ease infinite; 
  z-index: 0; 
  pointer-events: none; 
}
.hero::after { 
  content: ""; 
  position: absolute; 
  inset: auto 0 0; 
  height: 160px; 
  background: linear-gradient(0deg, #fff, transparent); 
  z-index: 1; 
}
.hero-inner { position: relative; z-index: 2; max-width: 1180px; margin: 0 auto; width: 100%; }
.hero-eyebrow { display: inline-flex; align-items: center; gap: 12px; color: rgba(255,255,255,0.9); text-transform: uppercase; letter-spacing: 0.25em; font-size: 12px; font-weight: 800; margin-bottom: 24px; }
.hero-eyebrow:before { content: ""; width: 48px; height: 2px; background: var(--sk-cyan); border-radius: 2px; }
.hero h1 { font-size: clamp(48px, 7vw, 84px); font-weight: 300; line-height: 1.05; color: #fff; max-width: 1000px; margin-bottom: 24px; letter-spacing: -0.03em; }
.hero h1 strong { font-weight: 800; }
.hero p { font-size: 20px; line-height: 1.6; max-width: 720px; color: rgba(255,255,255,0.85); margin-bottom: 40px; font-weight: 400;}
.hero-actions { display: flex; gap: 16px; flex-wrap: wrap; }

/* Elevated Tech Link Cards Grid */
.tech-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; }
.tech-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
.tech-link-card { position: relative; display: flex; flex-direction: column; justify-content: flex-end; min-height: 280px; background-image: var(--bg-img); background-size: cover; background-position: center; border: 1px solid rgba(2, 46, 100, 0.08); border-radius: var(--sk-radius); padding: 32px; overflow: hidden; box-shadow: 0 12px 32px rgba(2, 46, 100, 0.06); transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.5s ease, border-color 0.5s ease; }
.tech-card-overlay { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(2, 46, 100, 0.05) 0%, rgba(2, 46, 100, 0.9) 100%); z-index: 1; transition: opacity 0.4s ease; }
.tech-card-glow { position: absolute; inset: 0; background: radial-gradient(circle at 50% 100%, rgba(95, 199, 207, 0.3) 0%, transparent 70%); z-index: 2; opacity: 0; transition: opacity 0.5s ease; }
.tech-card-body { position: relative; z-index: 3; width: 100%; transform: translateY(20px); transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1); }
.tech-card-body .eyebrow { margin-bottom: 12px; }
.tech-card-body strong { display: block; color: #fff; font-size: 22px; font-weight: 800; margin-bottom: 10px; line-height: 1.2; letter-spacing: -0.01em;}
.tech-card-body span.desc { display: block; color: rgba(255,255,255,0.85); font-size: 14px; line-height: 1.6; margin-bottom: 20px; font-weight: 400;}
.tech-action { display: inline-flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: var(--sk-cyan); opacity: 0; transform: translateY(10px); transition: all 0.4s ease; }
.tech-link-card:hover { transform: translateY(-8px); box-shadow: var(--sk-shadow-hover); border-color: rgba(95, 199, 207, 0.5); }
.tech-link-card:hover .tech-card-overlay { opacity: 0.95; }
.tech-link-card:hover .tech-card-glow { opacity: 1; }
.tech-link-card:hover .tech-card-body { transform: translateY(0); }
.tech-link-card:hover .tech-action { opacity: 1; transform: translateY(0); }
.tech-link-card:hover .tech-action .arrow { transform: translateX(6px); }

/* ==========================================================================
   HIGH-TECH TIMELINE 
   ========================================================================== */
.story-wrapper { background: linear-gradient(135deg, var(--sk-blue), var(--sk-blue2)); border-radius: 40px; padding: 64px; display: grid; grid-template-columns: 1fr 380px; gap: 64px; color: #fff; margin-top: 40px; box-shadow: var(--sk-shadow-hover); overflow: hidden; position: relative;}
.story-wrapper::before { content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: radial-gradient(circle, rgba(95,199,207,0.05) 0%, transparent 60%); pointer-events: none;}
.story-content { position: relative; z-index: 2;}
.story-content h2 { font-size: clamp(32px, 4vw, 48px); color: #fff; margin-bottom: 24px; line-height: 1.1; letter-spacing: -0.02em;}
.story-content p { color: rgba(255,255,255,0.85); font-size: 16px; margin-bottom: 20px; line-height: 1.8; font-weight: 400;}

.timeline { position: relative; display: flex; flex-direction: column; gap: 40px; margin-top: 48px; padding-left: 40px; }

/* Solid Data Cable */
.timeline::before { content: ''; position: absolute; top: 32px; bottom: 80px; left: 6px; width: 2px; background: linear-gradient(to bottom, var(--sk-cyan) 80%, transparent 100%); z-index: 1; }

/* Moving Energy Pulse */
.timeline::after { content: ''; position: absolute; top: 32px; left: 5px; width: 4px; height: 60px; background: linear-gradient(to bottom, transparent, var(--sk-cyan), #fff); border-radius: 4px; z-index: 2; animation: dataFlow 3s cubic-bezier(0.4, 0, 0.2, 1) infinite; box-shadow: 0 0 15px var(--sk-cyan); }
@keyframes dataFlow { 0% { top: 20px; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { top: calc(100% - 80px); opacity: 0; } }

/* Milestone Panels */
.milestone { position: relative; display: flex; flex-direction: column; background: linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02)); border: 1px solid rgba(95, 199, 207, 0.2); border-left: 3px solid var(--sk-cyan); border-radius: 12px; padding: 32px; transition: all 0.4s ease; backdrop-filter: blur(16px); box-shadow: inset 0 0 20px rgba(0,0,0,0.1), 0 8px 32px rgba(0,0,0,0.2); overflow: hidden; }
.milestone:hover { background: linear-gradient(135deg, rgba(95, 199, 207, 0.15), rgba(255,255,255,0.02)); border-color: var(--sk-cyan); box-shadow: inset 0 0 30px rgba(95, 199, 207, 0.1), 0 12px 40px rgba(0,0,0,0.3); transform: translateX(8px); }

/* Scanning Laser inside card */
.milestone::after { content: ''; position: absolute; top: 0; left: -100%; width: 30%; height: 100%; background: linear-gradient(90deg, transparent, rgba(95, 199, 207, 0.2), transparent); transform: skewX(-25deg); animation: cardScan 4s infinite; pointer-events: none; }
@keyframes cardScan { 0%, 50% { left: -100%; } 100% { left: 200%; } }

/* The High-Tech Node Complex */
.milestone-node { position: absolute; top: 40px; left: -40px; width: 14px; height: 14px; z-index: 3; }
.milestone-node::before { content: ''; position: absolute; top: 6px; left: 14px; width: 26px; height: 2px; background: var(--sk-cyan); box-shadow: 0 0 8px var(--sk-cyan); }
.milestone-node .core { position: absolute; inset: 0; background: #fff; border-radius: 50%; box-shadow: 0 0 12px var(--sk-cyan), 0 0 24px var(--sk-cyan); z-index: 4; animation: corePulse 2s infinite alternate; }
.milestone-node .radar { position: absolute; top: -12px; left: -12px; width: 38px; height: 38px; border-radius: 50%; border: 1px dashed rgba(95, 199, 207, 0.8); border-top-color: transparent; border-bottom-color: transparent; animation: radarSpin 4s linear infinite; }

@keyframes corePulse { 0% { transform: scale(0.8); box-shadow: 0 0 8px var(--sk-cyan); } 100% { transform: scale(1.2); box-shadow: 0 0 20px var(--sk-cyan), 0 0 30px #fff; } }
@keyframes radarSpin { 0% { transform: rotate(0deg) scale(1); } 50% { transform: rotate(180deg) scale(1.1); } 100% { transform: rotate(360deg) scale(1); } }

/* Tech Typography */
.milestone .year { display: inline-block; background: rgba(95, 199, 207, 0.15); color: var(--sk-cyan); font-weight: 800; font-size: 11px; text-transform: uppercase; letter-spacing: 0.2em; padding: 6px 14px; border-radius: 999px; border: 1px solid rgba(95, 199, 207, 0.3); margin-bottom: 20px; box-shadow: inset 0 0 10px rgba(95, 199, 207, 0.1); }
.milestone h3 { font-size: 20px; color: #fff; margin-bottom: 12px; font-weight: 800; letter-spacing: 0.02em; text-transform: uppercase; text-shadow: 0 0 10px rgba(255,255,255,0.2);}
.milestone p { font-size: 15px; color: rgba(255,255,255,0.75); line-height: 1.7; margin: 0; font-weight: 400;}

/* Fact Stack */
.fact-stack { display: flex; flex-direction: column; gap: 20px; position: relative; z-index: 2;}
.fact { background: #fff; border: 1px solid var(--sk-border-soft); border-radius: 24px; padding: 32px; box-shadow: 0 12px 30px rgba(0,0,0,0.1); transition: transform 0.3s ease;}
.fact:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(0,0,0,0.15); }
.fact small { display: block; color: var(--sk-cyan); text-transform: uppercase; letter-spacing: 0.2em; font-size: 11px; font-weight: 800; margin-bottom: 12px; }
.fact strong { font-size: 32px; color: var(--sk-blue); display: block; margin-bottom: 12px; line-height: 1.1; font-weight: 900; letter-spacing: -0.02em; }
.fact p { font-size: 14px; color: var(--sk-body); line-height: 1.6; font-weight: 500;}

/* Collection Grid Elevated */
.collection-section { background: var(--sk-bg-alt); padding: 100px 40px; border-radius: 40px; margin-top: 80px; box-shadow: inset 0 4px 20px rgba(0,0,0,0.02); }
.collection-tabs { display: flex; gap: 40px; border-bottom: 2px solid var(--sk-border-soft); margin-bottom: 48px; overflow-x: auto; padding-bottom: 2px;}
.collection-tab { background: transparent; border: none; padding: 0 0 16px 0; font-size: 16px; font-weight: 700; color: var(--sk-muted); cursor: pointer; transition: all 0.3s; white-space: nowrap; margin-bottom: -2px; border-bottom: 3px solid transparent; }
.collection-tab.active { color: var(--sk-blue); border-bottom: 3px solid var(--sk-cyan); }
.collection-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; }
.collection-card { background: #fff; border: 1px solid var(--sk-border-soft); border-radius: var(--sk-radius); overflow: hidden; display: flex; flex-direction: column; transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.4s ease; box-shadow: 0 12px 32px rgba(2,46,100,0.05); }
.collection-card:hover { transform: translateY(-8px); box-shadow: var(--sk-shadow-hover); border-color: rgba(95,199,207,0.3); }
.collection-img-wrap { position: relative; height: 240px; width: 100%; background: transparent; overflow: hidden; }
.collection-main-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.8s ease;}
.collection-card:hover .collection-main-img { transform: scale(1.05); }
.collection-img-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(2,46,100,0.4), transparent); z-index: 1;}
.collection-ribbon { position: absolute; top: 0; left: 0; height: 100%; width: auto; filter: drop-shadow(0 8px 24px rgba(0,0,0,0.4)); z-index: 2; }
.collection-content { padding: 40px 32px 32px; display: flex; flex-direction: column; flex: 1; background: #fff; z-index: 3;}
.collection-title { font-size: 24px; font-weight: 800; color: var(--sk-blue); margin-bottom: 16px; letter-spacing: -0.01em;}
.collection-desc { font-size: 15px; color: var(--sk-body); line-height: 1.7; margin-bottom: 32px; flex: 1; font-weight: 400;}
.collection-desc strong { color: var(--sk-blue); display: block; margin: 24px 0 12px; font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 0.1em;}
.eyebrow-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 16px; }
.eyebrow-list li { display: flex; align-items: flex-start; gap: 16px; font-size: 13px; font-weight: 600; color: var(--sk-text); line-height: 1.6; }
.eyebrow-list li:before { content: ""; width: 20px; height: 2px; background: var(--sk-cyan); margin-top: 10px; flex-shrink: 0; border-radius: 2px; }

/* Partners Grid */
.partners { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px; }
.partner { border: 1px solid var(--sk-border-soft); border-radius: 20px; padding: 24px; background: #fff; text-align: center; transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(0,0,0,0.02);}
.partner:hover { transform: translateY(-4px); box-shadow: 0 12px 24px rgba(2,46,100,0.08); border-color: var(--sk-cyan);}
.partner b { display: block; color: var(--sk-blue); font-size: 15px; font-weight: 800; }
.partner span { display: block; color: var(--sk-muted); font-size: 11px; margin-top: 8px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 700; }
.notice { background: var(--sk-bg-alt); border-left: 4px solid var(--sk-cyan); border-radius: 16px; padding: 20px 24px; color: var(--sk-body); font-size: 15px; line-height: 1.7; font-weight: 500;}

/* Elevated Final CTA */
.cta { margin: 100px 24px; position: relative; background: linear-gradient(135deg, var(--sk-blue), var(--sk-blue2)); border-radius: 40px; box-shadow: var(--sk-shadow-hover); padding: 80px 40px; text-align: center; color: #fff; overflow: hidden;}
.cta::before { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: url('https://static.wixstatic.com/media/394052_6b4a3a60a3a9482d8a57e3f898cbb1f6~mv2.png') center/cover; opacity: 0.1; mix-blend-mode: overlay; pointer-events: none;}
.cta h2 { position: relative; color: #fff; font-size: clamp(36px, 5vw, 56px); margin-bottom: 24px; font-weight: 800; letter-spacing: -0.02em; z-index: 2;}
.cta p { position: relative; max-width: 640px; margin: 0 auto 40px; color: rgba(255,255,255,0.85); font-size: 18px; line-height: 1.7; font-weight: 400; z-index: 2;}
.cta .hero-actions { position: relative; justify-content: center; z-index: 2;}

/* Responsive Adjustments */
@media(max-width: 1080px){ 
  .story-wrapper { grid-template-columns: 1fr; padding: 48px; gap: 48px; } 
  .collection-grid { grid-template-columns: repeat(2, 1fr); } 
  .tech-grid-3, .tech-grid-4 { grid-template-columns: repeat(2, 1fr); } 
}
@media(max-width: 768px){ 
  .section { padding-top: 80px; } 
  .collection-grid { grid-template-columns: 1fr; } 
  .tech-grid-3, .tech-grid-4 { grid-template-columns: 1fr; } 
  .hero { min-height: 450px; padding: 100px 20px;} 
  .cta { margin: 80px 16px; padding: 60px 24px; } 
  .story-wrapper { padding: 32px; border-radius: 28px; } 
  .collection-section { padding: 48px 24px; border-radius: 28px; margin-top: 48px; } 
}

/* Footer specific overrides */
#skandi-site-footer .footer { background: var(--sk-blue); color: #fff; }
#skandi-site-footer .newsletter { background: linear-gradient(135deg, #d7e6ff, #f6faff); color: var(--sk-blue); padding: 40px 32px; border-top: 1px solid var(--sk-line); }
#skandi-site-footer .news-inner { max-width: 1240px; margin: 0 auto; display: grid; grid-template-columns: 1.2fr 1fr; gap: 32px; align-items: center; }
#skandi-site-footer .newsletter h2 { font-size: 28px; letter-spacing: -0.03em; margin-bottom: 8px; font-weight: 800;}
#skandi-site-footer .news-form { display: grid; grid-template-columns: 1fr auto; gap: 12px; }
#skandi-site-footer .news-form input { border: 1px solid var(--sk-border-soft); border-radius: 999px; padding: 16px 20px; font-size: 15px; outline: none; transition: border-color 0.3s;}
#skandi-site-footer .news-form input:focus { border-color: var(--sk-cyan); }
#skandi-site-footer .news-form button { background: var(--sk-blue); color: #fff; border: 0; border-radius: 999px; padding: 0 24px; font-weight: 800; cursor: pointer; transition: background 0.3s; text-transform: uppercase; letter-spacing: 0.05em; font-size: 13px;}
#skandi-site-footer .news-form button:hover { background: var(--sk-blue2); }
#skandi-site-footer .footer-main { max-width: 1240px; margin: 0 auto; padding: 64px 32px; display: grid; grid-template-columns: repeat(6, 1fr); gap: 32px; }
#skandi-site-footer .brand { grid-column: span 2; }
#skandi-site-footer .social-links { display: flex; gap: 12px; margin-top: 20px; }
#skandi-site-footer .social-btn { width: 44px; height: 44px; border: 1px solid rgba(255,255,255,0.2); border-radius: 50%; padding: 10px; display: flex; align-items: center; justify-content: center; background: transparent; transition: all 0.3s ease; cursor: pointer; }
#skandi-site-footer .social-btn img { width: 100%; height: 100%; object-fit: contain; display: block; }
#skandi-site-footer .social-btn:hover { transform: translateY(-3px); border-color: var(--sk-cyan); background: rgba(95,199,207,0.1);}
#skandi-site-footer .col h3 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.15em; font-weight: 800; color: #fff; margin-bottom: 20px; }
#skandi-site-footer .col button { display: block; background: transparent; border: 0; color: rgba(255,255,255,0.7); font-size: 14px; font-weight: 500; padding: 0; margin-bottom: 12px; cursor: pointer; text-align: left; transition: color 0.2s;}
#skandi-site-footer .col button:hover { color: #fff; text-decoration: none; }
#skandi-site-footer .footer-bottom { border-top: 1px solid rgba(255,255,255,0.1); padding: 24px 32px; }
#skandi-site-footer .bottom-inner { max-width: 1240px; margin: 0 auto; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 20px; font-size: 13px; color: rgba(255,255,255,0.6); }
#skandi-site-footer .bottom-links { display: flex; gap: 20px; flex-wrap: wrap; }
#skandi-site-footer .bottom-links button { background: transparent; border: 0; color: rgba(255,255,255,0.8); font-weight: 600; cursor: pointer; padding: 0; transition: color 0.2s;}
#skandi-site-footer .bottom-links button:hover { color: #fff; }
@media (max-width: 980px){ #skandi-site-footer .footer-main { grid-template-columns: repeat(3, 1fr); } #skandi-site-footer .brand { grid-column: span 3; } #skandi-site-footer .news-inner { grid-template-columns: 1fr; } }
@media (max-width: 600px){ #skandi-site-footer .footer-main { grid-template-columns: 1fr; } #skandi-site-footer .brand { grid-column: span 1; } }

/* LIVE INVENTORY-DRIVEN SKANDI COLLECTION */
.collection-live-state{margin-bottom:8px}
.collection-live-state.hidden{display:none}
.collection-card .live-count{display:inline-flex;align-items:center;gap:8px;color:var(--sk-blue);font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;margin-bottom:12px}
.collection-card .live-count:before{content:"";width:8px;height:8px;border-radius:50%;background:var(--sk-cyan);box-shadow:0 0 0 4px rgba(95,199,207,.15)}
.collection-card .live-examples{list-style:none;padding:0;margin:18px 0 24px;display:flex;flex-direction:column;gap:9px}
.collection-card .live-examples li{font-size:13px;color:var(--sk-text);font-weight:650;display:flex;gap:10px;align-items:flex-start}
.collection-card .live-examples li:before{content:"";width:14px;height:2px;background:var(--sk-cyan);margin-top:9px;flex:0 0 auto}
.collection-card .collection-img-placeholder{height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,var(--sk-blue),var(--sk-blue2));color:#fff;font-size:13px;font-weight:800;letter-spacing:.15em;text-transform:uppercase}
.collection-card .collection-source{font-size:11px;color:var(--sk-muted);font-weight:700;margin-top:14px}
.collection-empty{grid-column:1/-1}

</style>
</head>

<body>
<a class="skip-link" href="#main">Skip to main content</a>

<main id="main">
  <header class="hero" id="hero">
    <div class="hero-inner">
      <div class="hero-eyebrow" data-i18n="hero.kicker">About SKANDI TRAVELS</div>
      <h1 data-i18n="hero.title">Scandinavian care,<br> <strong>designed for the world.</strong></h1>
      <p id="heroCopy" data-i18n="hero.copy">SKANDI Travels is built for travelers who want a more personal, structured and carefully selected way to plan and book travel.</p>
    </div>
  </header>

  <section class="section">
    <div class="section-head">
      <div>
        <div class="eyebrow" data-i18n="sec1.kicker">Who we are</div>
        <h2 class="gradient-text" data-i18n="sec1.title">Bringing the Scandinavian way of travel to the world</h2>
      </div>
      <p class="copy" data-i18n="sec1.copy">SKANDI brings the convenience, guidance and culture of European charter travel into a new premium experience. We help Americans explore Europe and Asia the SKANDI way — and help Scandinavians and Europeans discover the United States with the same confidence, care and ease.</p>
    </div>
    
    <div class="tech-grid-3">
      <article class="tech-link-card" style="--bg-img: url('https://static.wixstatic.com/media/394052_54174b4e1cbd4812842427a79b9e224d~mv2.png')">
        <div class="tech-card-overlay"></div>
        <div class="tech-card-glow"></div>
        <div class="tech-card-body">
          <div class="eyebrow light"><strong data-i18n="sec1.card1.title">Charter Culture</strong></div>
          <span class="desc" data-i18n="sec1.card1.desc">Inspired by the Scandinavian way of traveling: selected, guided and cared for.</span>
          <span class="tech-action"><span data-i18n="sec1.card1.btn">Learn Personal Care</span> <span class="arrow">→</span></span>
        </div>
      </article>

      <article class="tech-link-card" style="--bg-img: url('https://static.wixstatic.com/media/394052_e53bee7ea3ca462ea35408185193bc95~mv2.png')">
        <div class="tech-card-overlay"></div>
        <div class="tech-card-glow"></div>
        <div class="tech-card-body">
          <div class="eyebrow light"><strong data-i18n="sec1.card2.title">Elevated</strong></div>
          <span class="desc" data-i18n="sec1.card2.desc">A premium, modern version of charter travel with stronger service, design and digital tools.</span>
          <span class="tech-action"><span data-i18n="sec1.card2.btn">Two-Way Travel</span> <span class="arrow">→</span></span>
        </div>
      </article>

      <article class="tech-link-card" style="--bg-img: url('https://static.wixstatic.com/media/394052_f42e27397fed462db4cc3abaab03215e~mv2.png')">
        <div class="tech-card-overlay"></div>
        <div class="tech-card-glow"></div>
        <div class="tech-card-body">
          <div class="eyebrow light"><strong data-i18n="sec1.card3.title">Global Connection</strong></div>
          <span class="desc" data-i18n="sec1.card3.desc">Helping Americans explore Europe — and Europeans explore the United States — the SKANDI way.</span>
          <span class="tech-action"><span data-i18n="sec1.card3.btn">Learn Personal Care</span> <span class="arrow">→</span></span>
        </div>
      </article>
    </div>
  </section>

  <section class="section">
    <div class="story-wrapper">
      <div class="story-content">
        <div class="eyebrow light" data-i18n="sec2.kicker">Our Story</div>
        <h2 data-i18n="sec2.title">How SKANDI started.</h2>
        <p id="storyText" data-i18n="sec2.copy">SKANDI started from a simple belief: travel should feel exciting, easy to understand and cared for.<br><br>For many Scandinavians, charter travel is more than a package trip. It is a culture. It is the way many of us first discovered the world — with selected hotels, airport transfers, destination staff, guided experiences and the confidence of knowing that someone was there to help.<br><br>That way of traveling is in our blood.<br><br>SKANDI was created to bring that feeling into a new era: more premium, more connected and more thoughtfully designed.</p>
        <div id="timeline" class="timeline"></div>
      </div>
      <aside class="fact-stack" id="facts"></aside>
    </div>
  </section>

  <section class="section collection-section" id="liveCollectionSection">
    <div class="eyebrow" data-i18n="coll.kicker">SKANDI COLLECTION</div>
    <h2 class="section-head gradient-text" style="margin-bottom: 20px;" data-i18n="coll.title">Our selected way to travel.</h2>

    <div class="collection-tabs" id="collectionTypeTabs"></div>
    <div class="collection-live-state notice" id="collectionLiveState">Loading live SKANDI Collection inventory…</div>
    <div class="collection-grid" id="collectionGrid" style="margin-top:24px"></div>
  </section>

  <section class="section">
    <div class="section-head">
      <div>
        <div class="eyebrow" data-i18n="focus.kicker">Selected focus</div>
        <h2 class="gradient-text" data-i18n="focus.title">Partners and places we are building around.</h2>
      </div>
      <p class="copy" data-i18n="focus.copy">Handpicked and .</p>
    </div>
    <div class="partners" id="partners"></div>
  </section>

  <section class="section">
    <div class="section-head">
      <div>
        <div class="eyebrow" data-i18n="links.kicker">Helpful links</div>
        <h2 class="gradient-text" data-i18n="links.title">Find what you need quickly.</h2>
      </div>
      <p class="copy" data-i18n="links.copy">Careers, press, legal policies and travel information are easy to access from one place.</p>
    </div>
    
    <div class="tech-grid-4">
      <a class="tech-link-card" href="/about/careers" target="_top" style="--bg-img: url('https://static.wixstatic.com/media/394052_74e4b78c6aa0448c81f738b393406079~mv2.png')">
        <div class="tech-card-overlay"></div>
        <div class="tech-card-glow"></div>
        <div class="tech-card-body">
          <div class="eyebrow light"><strong data-i18n="links.c1.title">Careers</strong></div>
          <span class="desc" data-i18n="links.c1.desc">Join SKANDI and help build a modern travel company.</span>
          <span class="tech-action"><span data-i18n="links.c1.btn">View Openings</span> <span class="arrow">→</span></span>
        </div>
      </a>

      <a class="tech-link-card" href="/about/news-room" target="_top" style="--bg-img: url('https://static.wixstatic.com/media/394052_490f53a1a68e4b1a89c4860c5cb9eb32~mv2.png')">
        <div class="tech-card-overlay"></div>
        <div class="tech-card-glow"></div>
        <div class="tech-card-body">
          <div class="eyebrow light"><strong data-i18n="links.c2.title">Press room</strong></div>
          <span class="desc" data-i18n="links.c2.desc">News, media assets and public announcements.</span>
          <span class="tech-action"><span data-i18n="links.c2.btn">Read News</span> <span class="arrow">→</span></span>
        </div>
      </a>

      <a class="tech-link-card" href="/about/legal" target="_top" style="--bg-img: url('https://static.wixstatic.com/media/394052_ecdb8871f3af497b8abf8497d0221daf~mv2.png')">
        <div class="tech-card-overlay"></div>
        <div class="tech-card-glow"></div>
        <div class="tech-card-body">
          <div class="eyebrow light"><strong data-i18n="links.c3.title">Legal policies</strong></div>
          <span class="desc" data-i18n="links.c3.desc">Privacy, cookies, accessibility, booking terms and notices.</span>
          <span class="tech-action"><span data-i18n="links.c3.btn">Read Terms</span> <span class="arrow">→</span></span>
        </div>
      </a>

      <a class="tech-link-card" href="/travel-info" target="_top" style="--bg-img: url('https://static.wixstatic.com/media/394052_82c7486635f343c0bff18322b745afdc~mv2.png')">
        <div class="tech-card-overlay"></div>
        <div class="tech-card-glow"></div>
        <div class="tech-card-body">
          <div class="eyebrow light"><strong data-i18n="links.c4.title">Travel info</strong></div>
          <span class="desc" data-i18n="links.c4.desc">Practical travel help, flight status and guidance.</span>
          <span class="tech-action"><span data-i18n="links.c4.btn">Explore Guides</span> <span class="arrow">→</span></span>
        </div>
      </a>
    </div>
  </section>

  <!-- Final CTA -->
  <section class="cta">
    <h2 data-i18n="cta.title">Explore travel the SKANDI way.</h2>
    <p data-i18n="cta.copy">Join SKANDI Club, browse the Signature Collection, or learn more about our policies, careers and press information.</p>
    <div class="hero-actions">
      <a class="btn" href="/skandi-collection" target="_top" data-i18n="cta.btn1">SKANDI Collection</a>
      <a class="btn btn-secondary" href="/skandi-club" target="_top" data-i18n="cta.btn2">SKANDI Club</a>
    </div>
  </section>
</main>

<div id="toast" class="toast"></div>
<script>
// ==========================================================================
// TRANSLATION DICTIONARY
// ==========================================================================
const I18N = {
  EN: {
    "nav.packages": "Packages",
    "nav.destinations": "Destinations",
    "nav.club": "Signature Club",
    "nav.info": "Travel Info",
    "nav.search": "Search",
    "nav.clubBtn": "SKANDI Club",
    "nav.menu": "MENU",
    "nav.signIn": "Sign in",
    "brand.sloganImg": "https://static.wixstatic.com/media/394052_6d5f53cf8c2d4abdac6578b12fe2758c~mv2.png",
    "settings.language": "Language",
    "settings.currency": "Currency",
    "settings.apply": "Apply Settings",
    "welcome.title": "Welcome to SKANDI",
    "welcome.copy": "Please confirm your preferred language and currency before continuing.",
    "welcome.btn": "Continue to Site",
    
    // Page Content
    "hero.kicker": "About SKANDI TRAVELS",
    "hero.title": "Scandinavian care, <strong>designed for the world.</strong>",
    "hero.copy": "SKANDI Travels is built for travelers who want a more personal, structured and carefully selected way to plan and book travel.",
    "hero.btnClub": "Join SKANDI Club",
    "hero.btnSig": "Explore Signature Collection",
    
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
    "cta.copy": "Join SKANDI Club, browse the Signature Collection, or learn more about our policies, careers and press information.",
    "cta.btn1": "Signature Collection",
    "cta.btn2": "SKANDI Club",

    // Footer
    "footer.news.title": "Get SKANDI offers and travel inspiration",
    "footer.news.desc": "Receive destination guides, Signature Collection updates and member offers.",
    "footer.news.btn": "Sign up",
    "footer.col1.title": "Book & Travel",
    "footer.col1.l1": "Manage your booking",
    "footer.col1.l2": "Book a trip",
    "footer.col1.l3": "Signature Collection",
    "footer.col1.l4": "Destinations",
    "footer.col1.l5": "Hotels",
    "footer.col1.l6": "Flights",
    "footer.col1.l7": "Tours & Activities",
    "footer.col1.l8": "Car Rental",
    "footer.col1.l9": "Offers",
    "footer.col2.title": "Help & Travel Info",
    "footer.col2.l1": "Before you travel",
    "footer.col2.l2": "Passport & visa",
    "footer.col2.l3": "Baggage",
    "footer.col2.l4": "Insurance",
    "footer.col2.l5": "Help Center",
    "footer.col2.l6": "Contact us",
    "footer.col2.l7": "Special assistance",
    "footer.col3.title": "SKANDI Club",
    "footer.col3.l1": "Join SKANDI Club",
    "footer.col3.l2": "Member benefits",
    "footer.col3.l3": "My Club Status",
    "footer.col3.l4": "Travel Wallet & Vouchers",
    "footer.col4.title": "About",
    "footer.col4.l1": "About SKANDI Travels",
    "footer.col4.l2": "Newsroom",
    "footer.col4.l3": "Careers",
    "footer.col4.l4": "Our Network",
    "footer.bottom.terms": "Payment methods, supplier terms and package travel conditions may vary by product.",
    "footer.bottom.l1": "Legal",
    "footer.bottom.l2": "Accessibility",
    "footer.bottom.l3": "Website disclaimer",
    "footer.bottom.l4": "Privacy",
    "footer.bottom.l5": "Cookies",
    "footer.bottom.l6": "Booking terms",
    "footer.bottom.l7": "Staff login"
  },
  SV: {
    "nav.packages": "Paketresor",
    "nav.destinations": "Destinationer",
    "nav.club": "SKANDI Club",
    "nav.info": "Reseinformation",
    "nav.search": "Sök",
    "nav.clubBtn": "SKANDI Club",
    "nav.menu": "MENY",
    "nav.signIn": "Logga in",
    "brand.sloganImg": "https://static.wixstatic.com/media/394052_370c093c663e45cb999378aaf642b7ef~mv2.png",
    "settings.language": "Språk",
    "settings.currency": "Valuta",
    "settings.apply": "Spara Inställningar",
    "welcome.title": "Välkommen till SKANDI",
    "welcome.copy": "Vänligen bekräfta ditt språk och valuta innan du fortsätter.",
    "welcome.btn": "Fortsätt",
    
    // Page Content
    "hero.kicker": "Om SKANDI",
    "hero.title": "Handplockade Upplevelser - <br> <strong>Resor med Skandinavisk omtanke.</strong>",
    "hero.copy": "SKANDI är skapat för dig som vill ha ett tryggt, bekvämt och noga utvalt sätt att upptäcka världen – med extra guldkant.",    
    "hero.btnClub": "Bli medlem",
    "hero.btnSig": "Utforska Signature Collection",
    
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
    "cta.copy": "Gå med i SKANDI Club, bläddra i Signature Collection eller lär dig mer om våra policyer, karriärer och pressinformation.",
    "cta.btn1": "Signature Collection",
    "cta.btn2": "SKANDI Club",

    // Footer
    "footer.news.title": "Få SKANDI-erbjudanden och reseinspiration",
    "footer.news.desc": "Få destinationsguider, uppdateringar om Signature Collection och medlemserbjudanden.",
    "footer.news.btn": "Prenumerera",
    "footer.col1.title": "Boka & Res",
    "footer.col1.l1": "Hantera din bokning",
    "footer.col1.l2": "Boka en resa",
    "footer.col1.l3": "Signature Collection",
    "footer.col1.l4": "Destinationer",
    "footer.col1.l5": "Hotell",
    "footer.col1.l6": "Flyg",
    "footer.col1.l7": "Utflykter & Aktiviteter",
    "footer.col1.l8": "Hyrbil",
    "footer.col1.l9": "Erbjudanden",
    "footer.col2.title": "Hjälp & Reseinfo",
    "footer.col2.l1": "Innan du reser",
    "footer.col2.l2": "Pass & visum",
    "footer.col2.l3": "Bagage",
    "footer.col2.l4": "Försäkring",
    "footer.col2.l5": "Hjälpcenter",
    "footer.col2.l6": "Kontakta oss",
    "footer.col2.l7": "Särskild assistans",
    "footer.col3.title": "SKANDI Club",
    "footer.col3.l1": "Gå med i SKANDI Club",
    "footer.col3.l2": "Medlemsförmåner",
    "footer.col3.l3": "MyClub-status",
    "footer.col3.l4": "Resekassa & Värdebevis",
    "footer.col4.title": "Om oss",
    "footer.col4.l1": "Om SKANDI Travels",
    "footer.col4.l2": "Nyhetsrum",
    "footer.col4.l3": "Karriär",
    "footer.col4.l4": "Vårt Nätverk",
    "footer.bottom.terms": "Betalningsmetoder, leverantörsvillkor och paketresevillkor kan variera per produkt.",
    "footer.bottom.l1": "Juridiskt",
    "footer.bottom.l2": "Tillgänglighet",
    "footer.bottom.l3": "Ansvarsfriskrivning",
    "footer.bottom.l4": "Integritetspolicy",
    "footer.bottom.l5": "Cookies",
    "footer.bottom.l6": "Bokningsvillkor",
    "footer.bottom.l7": "SKANDI STAFF"
  }
};

// ==========================================================================
// SHARED UTILITIES & NAVIGATION
// ==========================================================================
const PARENT_ORIGIN = (() => { try { return document.referrer ? new URL(document.referrer).origin : "*"; } catch (_) { return "*"; } })();
function postToParent(message) { window.parent.postMessage(message, PARENT_ORIGIN); }
function navigateParent(path) {
  const target = String(path || "").trim();
  if (!target) return;
  if (window.parent === window) { window.location.assign(target); return; }
  postToParent({ source: "SKANDI_ABOUT_PAGE", type: "HOME_NAVIGATE", path: target });
}

// ==========================================================================
// PAGE DATA LOGIC & APP INITIALIZATION
// ==========================================================================
(function(){
  const SOURCE = "SKANDI_ABOUT_PAGE", PARENT = "SKANDI_WIX_PARENT";
  const CONFIG = {
    nav: [
      { label:"Packages", i18n: "nav.packages", path:"/skandi-collection" },
      { label:"Destinations", i18n: "nav.destinations", path:"/destinations" },
      { label:"SKANDI Club", i18n: "nav.club", path:"/skandi-club" },
      { label:"Travel Info", i18n: "nav.info", path:"/travel-info" }
    ],
    desktopMember: [{ label:"My Profile", path:"/my-profile" }],
    mobileExtra: [{ label:"Help Center", path:"/help" }],
    mobileMember: [{ label:"My Profile", path:"/my-profile" }]
  };

  let session = { loggedIn:false, displayName:"", points:0 };
  let userSettings = null; 
  let mobileMenuOpen = false;
  let DATA = {settings:{}, facts:[], timeline:[], partners:[], collection:{items:[],tiers:{},counts:{}}};
  let collectionTypeFilter = "all";
  const $ = id => document.getElementById(id);
  
  function esc(v){ return String(v??"").replace(/[&<>'"]/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;","\"":"&quot;"}[c])) }

  function currentLang(){
    return userSettings?.language || "EN";
  }

  function tr(key, fallback=""){
    const dict = I18N[currentLang()] || I18N.EN;
    return dict[key] || fallback;
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

  function typeLabel(type){
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

  function renderCollection(){
    const liveState = $("collectionLiveState");
    const grid = $("collectionGrid");
    const tabs = $("collectionTypeTabs");
    if(!liveState || !grid || !tabs) return;

    const items = Array.isArray(DATA.collection?.items) ? DATA.collection.items : [];
    const availableTypes = [...new Set(items.map(x=>x.type).filter(Boolean))];

    const tabDefs = [
      {key:"all",label:"All"},
      ...availableTypes.map(key=>({key,label:typeLabel(key)}))
    ];

    tabs.innerHTML = tabDefs.map(t=>`
      <button class="collection-tab ${collectionTypeFilter===t.key?"active":""}" type="button" data-collection-type="${esc(t.key)}">${esc(t.label)}</button>
    `).join("");

    tabs.querySelectorAll("[data-collection-type]").forEach(btn=>{
      btn.addEventListener("click",()=>{
        collectionTypeFilter = btn.dataset.collectionType || "all";
        renderCollection();
      });
    });

    const visible = collectionTypeFilter==="all"
      ? items
      : items.filter(x=>x.type===collectionTypeFilter);

    if(!visible.length){
      liveState.classList.remove("hidden");
      liveState.textContent = items.length
        ? `No ${typeLabel(collectionTypeFilter).toLowerCase()} are currently assigned to Select, Signature or Excelsior in Inventory Control.`
        : "No published customer-visible Select, Signature or Excelsior records are currently assigned in Inventory Control.";
      grid.innerHTML = "";
      return;
    }

    liveState.classList.add("hidden");
    const tierOrder = ["SELECT","SIGNATURE","EXCELSIOR"];

    const cards = tierOrder.map(tier=>{
      const tierItems = visible.filter(x=>x.tier===tier);
      if(!tierItems.length) return "";
      const meta = COLLECTION_META[tier];
      const image = tierItems.find(x=>x.imageUrl)?.imageUrl || "";
      const typeSummary = [...new Set(tierItems.map(x=>typeLabel(x.type)))].join(" · ");
      const examples = tierItems.slice(0,4).map(x=>`<li>${esc(x.title)}</li>`).join("");

      return `<article class="collection-card" data-live-tier="${tier}">
        <div class="collection-img-wrap">
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
          <button class="btn btn-secondary" style="width:100%;" type="button" data-tier-link="${tier.toLowerCase()}">${tr(meta.buttonKey, `Explore ${tier}`)}</button>
        </div>
      </article>`;
    }).join("");

    grid.innerHTML = cards || `<div class="notice collection-empty">No tiered SKANDI Collection inventory is available for this filter.</div>`;

    grid.querySelectorAll("[data-tier-link]").forEach(btn=>{
      btn.addEventListener("click",()=>navTo(`/skandi-collection?tier=${encodeURIComponent(btn.dataset.tierLink || "")}`));
    });
  }

  // 1. TRANSLATION ENGINE
  function applyTranslations() {
    const lang = userSettings ? userSettings.language : 'EN';
    const dict = I18N[lang] || I18N['EN'];
    
    // Update text elements
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if(dict[key]) { el.innerHTML = dict[key]; }
    });

    // Update slogan image dynamically
    const sloganImg = document.getElementById("sloganImg");
    if (sloganImg && dict["brand.sloganImg"]) {
      sloganImg.src = dict["brand.sloganImg"];
    }
  }

  // 2. SETTINGS INITIALIZATION
  function initSettings() {
    try {
      const stored = localStorage.getItem('skandi_user_settings');
      if (stored) {
        userSettings = JSON.parse(stored);
        updateSettingsUI();
        applyTranslations();
      } else {
        userSettings = { language: 'EN', currency: 'USD' }; 
        if ($("welcomeSettingsModal")) $("welcomeSettingsModal").classList.add("active");
        applyTranslations();
      }
    } catch(e) {
      userSettings = { language: 'EN', currency: 'USD' };
      applyTranslations();
    }
  }

  function saveSettings(lang, curr) {
    userSettings = { language: lang, currency: curr };
    try { localStorage.setItem('skandi_user_settings', JSON.stringify(userSettings)); } catch(e){}
    updateSettingsUI();
    applyTranslations();
    postToParent({ source: SOURCE, type: "UPDATE_SETTINGS", payload: userSettings });
  }

  function updateSettingsUI() {
    if ($("langSelect")) $("langSelect").value = userSettings.language;
    if ($("currSelect")) $("currSelect").value = userSettings.currency;
    if ($("mobileLangSelect")) $("mobileLangSelect").value = userSettings.language;
    if ($("mobileCurrSelect")) $("mobileCurrSelect").value = userSettings.currency;
  }

  // 3. DYNAMIC CONTENT RENDERING (From Wix Database) & SCROLL OBSERVER
  function renderData(){
    const s = DATA.settings || {};
    if(s.heroImageUrl){ $("hero").style.setProperty("--hero-image",`url("${s.heroImageUrl}")`); }
    
    const facts = DATA.facts?.length ? DATA.facts : [
      {label:"Founded with", value:"Care", description: "Every trip is designed with human oversight."},
      {label:"Focus", value:"Selected travel", description: "Quality over quantity in our offerings."},
      {label:"Portal", value:"Connected", description: "Seamless transition from booking to traveling."}
    ];
    $("facts").innerHTML = facts.map(f=>`<div class="fact"><small>${esc(f.label)}</small><strong>${esc(f.value)}</strong><p>${esc(f.description||"")}</p></div>`).join("");
    
    const timeline = DATA.timeline?.length ? DATA.timeline : [
      {year:"Start", title:"A more personal travel idea", body:"SKANDI was created to make travel easier to understand and more carefully selected."},
      {year:"Now", title:"Connected customer and operations tools", body:"Public pages, customer profiles and internal travel operations are being connected into one SKANDI platform."}
    ];
    
    $("timeline").innerHTML = timeline.map(x=>`
      <article class="milestone">
        <div class="milestone-node">
          <div class="core"></div>
          <div class="radar"></div>
        </div>
        <div class="year">${esc(x.year)}</div>
        <div class="ms-content">
          <h3>${esc(x.title)}</h3>
          <p>${esc(x.body)}</p>
        </div>
      </article>
    `).join("");
    
    const partners = DATA.partners?.length ? DATA.partners : [];
    $("partners").innerHTML = partners.length
      ? partners.slice(0,12).map(p=>`<div class="partner"><b>${esc(p.title||p.name)}</b><span>${esc(p.tier ? `${p.tier} · ${p.typeLabel||p.type||"Selected"}` : p.collectionLabel||p.typeLabel||p.type||"Selected")}</span></div>`).join("")
      : `<div class="notice">Published SKANDI Collection / SKANDI Partner records marked in Inventory Control will appear here.</div>`;

    renderCollection();
  }

  // 4. HEADER & NAV RENDERING
  function renderDesktopNav() {
    const nav = $("nav");
    if (!nav) return;
    let items = session.loggedIn ? [...CONFIG.nav, ...CONFIG.desktopMember] : [...CONFIG.nav];
    nav.innerHTML = items.map(item => (`<button class="nav-btn" type="button" data-path="${esc(item.path)}" ${item.i18n ? `data-i18n="${item.i18n}"` : ''}>${esc(item.label)}</button>`)).join("");
    nav.querySelectorAll("[data-path]").forEach(btn => btn.addEventListener("click", () => navTo(btn.dataset.path)));
    applyTranslations(); 
  }

  function renderMobileNav() {
    const list = $("mobileList");
    if (!list) return;
    let items = session.loggedIn ? CONFIG.mobileMember : [...CONFIG.nav, ...CONFIG.mobileExtra];
    list.innerHTML = items.map(item => (`<button class="mobile-menu-link" type="button" data-path="${esc(item.path)}" ${item.i18n ? `data-i18n="${item.i18n}"` : ''}>${esc(item.label)}</button>`)).join("");
    list.querySelectorAll("[data-path]").forEach(btn => btn.addEventListener("click", () => navTo(btn.dataset.path)));
    applyTranslations();
  }

  function navTo(path) { if (!path) return; closeMobile(); closeClub(); navigateParent(path); }
  function openClub(context) { closeMobile(); renderClub(context); requestAnimationFrame(() => { if ($("clubPanel")) $("clubPanel").classList.add("open"); if ($("clubBackdrop")) $("clubBackdrop").classList.add("open"); }); document.documentElement.style.overflow = "hidden"; }
  function closeClub() { if ($("clubPanel")) $("clubPanel").classList.remove("open"); if ($("clubBackdrop")) $("clubBackdrop").classList.remove("open"); document.documentElement.style.overflow = ""; }
  function openMobile() { closeClub(); mobileMenuOpen = true; $("mobileMenuLayer").classList.add("open"); $("mobileMenuLayer").setAttribute("aria-hidden", "false"); $("mobileBtn").setAttribute("aria-expanded", "true"); document.documentElement.classList.add("mobile-menu-open"); }
  function closeMobile() { mobileMenuOpen = false; if($("mobileMenuLayer")) { $("mobileMenuLayer").classList.remove("open"); $("mobileMenuLayer").setAttribute("aria-hidden", "true"); } if($("mobileBtn")) $("mobileBtn").setAttribute("aria-expanded", "false"); document.documentElement.classList.remove("mobile-menu-open"); }

  function renderClub(context) {
    const loggedIn = Boolean(session.loggedIn);
    const clubBody = document.querySelector(".club-body");
    if (!clubBody || !$("clubActions")) return;
    if($("clubTitle")) $("clubTitle").textContent = loggedIn ? "Your SKANDI Club" : "Join SKANDI Club";
    
    if (loggedIn) {
      if($("clubName")) $("clubName").innerHTML = `Hi, ${session.displayName || "there"}`;
      if($("clubMeta")) $("clubMeta").innerHTML = `${Number(session.points || 0).toLocaleString()} points`;
      clubBody.style.gridTemplateColumns = "1fr auto";
      $("clubActions").style.gridColumn = "auto";
      $("clubActions").innerHTML = [{ label: "Logout", action: "logout" }].map(action => (`<button class="btn btn-secondary" style="width:100%; margin-bottom:12px;" data-action="${esc(action.action)}">${esc(action.label)}</button>`)).join("");
    } else {
      if (context === 'favorites') {
        if($("clubName")) $("clubName").innerHTML = `<span class="fav-hero-icon">♥</span><span class="fav-hero-title">Save your favourites</span>`;
        if($("clubMeta")) $("clubMeta").innerHTML = `<span class="fav-hero-text">To save your favourited destinations and pages requires you to be logged in.</span>`;
      } else {
        if($("clubName")) $("clubName").innerHTML = `Welcome Back`;
        if($("clubMeta")) $("clubMeta").innerHTML = `Sign in to access your trips and points.`;
      }
      clubBody.style.gridTemplateColumns = "1fr";
      $("clubActions").style.gridColumn = "1 / -1";
      $("clubActions").innerHTML = `
        <form id="inlineLoginForm" class="login-form">
          <input type="email" id="loginEmail" placeholder="Email address" required />
          <input type="password" id="loginPassword" placeholder="Password" required />
          <button type="submit" class="btn" style="width:100%;">Log In</button>
        </form>
      `;
    }
  }
document.addEventListener("submit", (event) => {
  if (event.target?.id !== "inlineLoginForm") return;

  event.preventDefault();
  closeClub();

  postToParent({
    source: SOURCE,
    type: "HEADER_LOGIN",
    payload: {}
  });
});

document.addEventListener("click", (event) => {
  const actionButton = event.target.closest("[data-action]");

  if (!actionButton) return;

  if (actionButton.dataset.action === "logout") {
    closeClub();

    postToParent({
      source: SOURCE,
      type: "HEADER_LOGOUT",
      payload: {}
    });
  }
});
  // 5. EVENT BINDING
  function bind() {
    if($("logoBtn")) $("logoBtn").onclick = () => navTo("/home");
    if($("favBtn")) $("favBtn").onclick = () => { session.loggedIn ? navTo("/my-profile?tab=favourites") : openClub('favorites'); };
    if($("clubBtn")) $("clubBtn").onclick = () => openClub();
    if($("clubClose")) $("clubClose").onclick = closeClub;
    if($("clubBackdrop")) $("clubBackdrop").onclick = closeClub;    
    if($("mobileBtn")) $("mobileBtn").onclick = () => mobileMenuOpen ? closeMobile() : openMobile();
    if($("mobileMenuBackdrop")) $("mobileMenuBackdrop").onclick = () => closeMobile();
    if($("mobileMenuClose")) $("mobileMenuClose").onclick = () => closeMobile();
    if($("searchBtn")) $("searchBtn").onclick = () => postToParent({ source: SOURCE, type: "HEADER_SEARCH" });
    if($("mobileSearchBtn")) $("mobileSearchBtn").onclick = () => { closeMobile(); postToParent({ source: SOURCE, type: "HEADER_SEARCH" }); };
    if($("mobileAccountBtn")) $("mobileAccountBtn").onclick = () => { closeMobile(); session.loggedIn ? navTo("/my-profile") : postToParent({ source: SOURCE, type: "HEADER_LOGIN" }); };
    
    if ($("welcomeSaveBtn")) {
      $("welcomeSaveBtn").onclick = () => {
        saveSettings($("welcomeLang").value, $("welcomeCurr").value);
        $("welcomeSettingsModal").classList.remove("active");
      };
    }

    if ($("settingsBtn")) {
      $("settingsBtn").onclick = (e) => {
        e.stopPropagation();
        $("settingsMenu").classList.toggle("open");
      };
    }
    document.addEventListener("click", (e) => {
      if ($("settingsMenu") && !$("settingsMenu").contains(e.target) && e.target !== $("settingsBtn")) {
        $("settingsMenu").classList.remove("open");
      }
    });

    if ($("saveSettingsBtn")) {
      $("saveSettingsBtn").onclick = () => {
        saveSettings($("langSelect").value, $("currSelect").value);
        $("settingsMenu").classList.remove("open");
      };
    }

    if ($("mobileLangSelect")) $("mobileLangSelect").onchange = (e) => saveSettings(e.target.value, userSettings.currency);
    if ($("mobileCurrSelect")) $("mobileCurrSelect").onchange = (e) => saveSettings(userSettings.language, e.target.value);

    window.addEventListener("resize", () => { if (window.innerWidth > 900) closeMobile(); });
  }

  // 6. MESSAGE LISTENER (Wix Communication)
  window.addEventListener("message", (event) => {
    let msg = event.data;
    if (typeof msg === "string") { try { msg = JSON.parse(msg); } catch(e){ return; } }
    if (!msg || typeof msg !== "object") return;
    
    if (msg.type === "CUSTOMER_HEADER_STATE") {
      session = { loggedIn:Boolean(msg.payload?.loggedIn), displayName:msg.payload?.displayName || "", points:Number(msg.payload?.points || 0), tierName:msg.payload?.tierName || "" };
      renderDesktopNav(); renderMobileNav(); renderClub();
    }
    if (msg.type === "CLOSE_CUSTOMER_HEADER_PANELS") { closeMobile(); closeClub(); }
    if (msg.type === "ABOUT_PAGE_LOADING"){
      const state=$("collectionLiveState");
      if(state){ state.classList.remove("hidden"); state.textContent="Loading live SKANDI Collection inventory…"; }
    }
    if (msg.type === "ABOUT_PAGE_DATA"){
      DATA = { ...DATA, ...(msg.payload||{}), collection:{ ...(DATA.collection||{}), ...(msg.payload?.collection||{}) } };
      renderData();
    }
    if (msg.type === "ABOUT_PAGE_ERROR"){
      const state=$("collectionLiveState");
      if(state){ state.classList.remove("hidden"); state.textContent=msg.payload?.message || "SKANDI Collection inventory is currently unavailable."; }
      if($("collectionGrid")) $("collectionGrid").innerHTML="";
    }
  });

  // 7. BOOTSTRAP
  initSettings();
  renderData();
  renderDesktopNav(); 
  renderMobileNav(); 
  bind(); 
  renderClub(); 
  updateSettingsUI();
  
  postToParent({ source: SOURCE, type: "HEADER_READY" });
  postToParent({ source: SOURCE, type: "ABOUT_PAGE_READY", payload: { language: currentLang() } });
})();

// ==========================================================================
// FOOTER INITIALIZATION
// ==========================================================================
(function(){
  const SOURCE = "SKANDI_CUSTOMER_FOOTER";
  const footerRoot = document.getElementById("skandi-site-footer");
  if (!footerRoot) return;
  if (footerRoot.querySelector("#year")) footerRoot.querySelector("#year").textContent = new Date().getFullYear();

  footerRoot.querySelectorAll("[data-path]").forEach(el => el.addEventListener("click", () => navigateParent(el.getAttribute("data-path"))));
  footerRoot.querySelectorAll(".social-btn[data-url]").forEach(btn => btn.addEventListener("click", () => { const url = btn.getAttribute("data-url"); if (url) window.open(url, "_blank", "noopener,noreferrer"); }));

  const newsletterBtn = footerRoot.querySelector("#newsletterBtn");
  const newsletterEmail = footerRoot.querySelector("#newsletterEmail");
  
  if (newsletterBtn) newsletterBtn.addEventListener("click", () => { postToParent({ source: SOURCE, type: "FOOTER_NEWSLETTER_SIGNUP", payload: { email: newsletterEmail.value.trim(), source: "Footer" } }); });
  if (newsletterEmail) newsletterEmail.addEventListener("keydown", (e) => { if (e.key === "Enter") postToParent({ source: SOURCE, type: "FOOTER_NEWSLETTER_SIGNUP", payload: { email: e.target.value.trim(), source: "Footer" } }); });

  postToParent({ source: SOURCE, type: "FOOTER_READY" });
})();
</script>
</body>
</html>
