# INFO / LOG — SKANDI GroupTalk

- WIX PAGE: `GroupTalk.wi4iw`
- HTML COMPONENT: `#htmlGroupTalk`
- CHILD SOURCE: `GROUPTALK_HTML`
- CANONICAL BACKEND: `/src/backend/SKANDI_CORE/groupTalk.web.js` → `/src/backend/SKANDI_CORE/groupTalk.js`
- VOICE: LiveKit room audio with server-issued short-lived room tokens
- PRESENCE / ACTIVITY: established Supabase Realtime GroupTalk subsystem
- RECEIVER: page-specific receiver generated beside the GroupTalk source after a successful build
- REQUIRED WIX SECRET: `SUPABASE_JWT_SECRET` (active Supabase HS256 signing secret)
- SUPABASE MIGRATION: `20261027200056_grouptalk_private_realtime_and_db_broadcasts.sql`
- STATUS: PRIVATE REALTIME SYNC STATICALLY VERIFIED — REQUIRES LIVE TEST

## CHANGE LOG
- 2026-10-12 — Hardened the existing genuine LiveKit push-to-talk path as a walkie-talkie: single-flight room connection prevents duplicate concurrent connects/token requests; group changes and offline/page exit now explicitly mute/disconnect and remove attached remote audio; remote track unsubscribe cleans its audio element; connection establishes in listen-only mode with microphone forced off; browser blur/visibility loss releases PTT to prevent a stuck open microphone; obsolete legacy VOICE_* bridge handlers referencing undeclared state were removed. Existing `PTT_EVENT`, LiveKit token, Supabase Realtime, group permission and audit contracts remain unchanged. STATICALLY VERIFIED; REQUIRES LIVE TEST with at least two devices/users and microphone permission.
- 2026-10-27 — Added short-lived staff-scoped private Supabase Realtime tokens and database-change invalidation broadcasts for GroupTalk data; retained Wix backend authorization for reads and writes. The successful build now generates and publishes the GroupTalk page receiver beside its source triplet. The receiver remains dependent on the active Wix controller and `SUPABASE_JWT_SECRET`. STATICALLY VERIFIED; REQUIRES LIVE TEST with two authorized staff sessions and voice permissions.


- 2026-10-28 UTC — Updated `skandi-embeds/group-talk/skandi-group-talk.receiver.html` to follow the current shared receiver pattern with page-specific startup, progress and failure messages for **ALTEA GroupTalk** (`/riaintra/success-factors/altea/grouptalk`). The expected route matches `src/public/siteMap.js`; master-page handshake, staff authorization, manifest/SHA-256 checks and nested-iframe rejection remain intact.

## COMPLETE INTENDED HTML

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,interactive-widget=resizes-content" />
<meta name="theme-color" content="#022e64" />
<title>SKANDI GroupTalk</title>
<!-- B-011.25 mobile viewport/touch + lightweight sync recovery -->
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
<link href="https://unpkg.com/maplibre-gl@5/dist/maplibre-gl.css" rel="stylesheet" />
<script src="https://unpkg.com/maplibre-gl@5/dist/maplibre-gl.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="https://cdn.jsdelivr.net/npm/livekit-client@2.22.0/dist/livekit-client.umd.min.js"></script>
<style>

/* =========================================
   AMADEUS GLOBAL HEADER VARIABLES
   ========================================= */
:root {
  --amadeus-blue: #005eb8;
  --bg-shell: #354a5f;
  --text-inverse: #ffffff;
  --shadow-sm: 0 1px 2px rgba(34, 54, 73, 0.12);
  --radius-sm: 0.375rem;
  --amadeus-shell-height: 52px;

  /* GROUPTALK VARIABLES */
  --blue:#022e64;
  --blue2:#0b3a7a;
  --cyan:#5FC7CF;
  --accent:#ffb300;
  --green:#25a45c;
  --red:#b3262e;

  --altea-bg:#f3f5f8;
  --altea-panel:#ffffff;
  --altea-border:#d1d5db;
  --altea-text:#111827;
  --altea-dim:#6b7280;

  --gt-bg:#24272f;
  --gt-bg-2:#2e3139;
  --gt-panel:#3a3e48;
  --gt-panel-2:#32353f;
  --gt-tile:#3b3f46;
  --gt-soft:#30343b;
  --gt-line:#4b4f59;
  --gt-dark:#05060a;
  --gt-text:#f5f5f7;
  --gt-dim:#b2b5bd;

  --chromeH:92px;
  --font:"Montserrat","Segoe UI",system-ui,-apple-system,BlinkMacSystemFont,sans-serif;
  --mono:Consolas,"Courier New",monospace;
}

*{box-sizing:border-box}
html,body{height:100%;margin:0;overflow:hidden}
body{
  font-family:var(--font);
  background:var(--altea-bg);
  color:var(--altea-text);
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
button,input,select,textarea{font:inherit}
button{cursor:pointer;touch-action:manipulation}
button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible{
  outline:2px solid var(--cyan);
  outline-offset:2px;
}
.hidden{display:none!important}

/* =========================================
   AMADEUS HEADER STYLES
   ========================================= */
.shellbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: var(--amadeus-shell-height);
  background: var(--bg-shell);
  color: var(--text-inverse);
  box-shadow: var(--shadow-sm);
  z-index: 9990;
}
.shellbar-inner { display: flex; height: 100%; align-items: center; justify-content: space-between; gap: 0.75rem; padding: 0 0.75rem; }
.shellbar-left, .shellbar-right { display: flex; align-items: center; gap: 0.375rem; }
.icon-button { display: inline-grid; width: 2.25rem; height: 2.25rem; place-items: center; border: 0; border-radius: var(--radius-sm); background: transparent; color: inherit; cursor: pointer; transition: background 120ms ease; font: inherit; font-size: 0.75rem; }
.icon-button:hover { background: rgba(255, 255, 255, 0.13); }
.product-title { display: flex; align-items: center; gap: 0.625rem; padding-inline: 0.375rem; }
.product-logo { height: 40px; width: auto; object-fit: contain; border-radius: 3px; }
.product-name { margin: 0; color: white; font-size: 0.875rem; font-weight: 700; line-height: 1.1; font-family: "72", "Inter", sans-serif; }
.product-context { margin: 0; color: rgba(255, 255, 255, 0.7); font-size: 0.6875rem; line-height: 1.1; font-family: "72", "Inter", sans-serif; }

.shell-nav { display: flex; gap: 0.5rem; align-items: center; font-family: "72", "Inter", sans-serif;}
.nav-item-amadeus { color: rgba(255, 255, 255, 0.8); font-size: 0.875rem; font-weight: 600; padding: 0.4rem 0.75rem; text-decoration: none; cursor: pointer; transition: all 0.2s; background: transparent; border: none; font-family: inherit;}
.nav-item-amadeus:hover { color: white; background: rgba(255, 255, 255, 0.15); border-radius: var(--radius-sm); }

.sf-clock { display: grid; grid-template-rows: 1fr 1fr; justify-content: end; align-content: center; min-width: 6.7rem; height: 2.25rem; padding: 0.15rem 0.55rem; border-left: 1px solid rgba(255,255,255,0.18); border-right: 1px solid rgba(255,255,255,0.18); color: #ffffff; line-height: 1; cursor: pointer; font-family: "72", "Inter", sans-serif;}
.sf-clock-time { font-size: 0.8rem; font-weight: 800; font-variant-numeric: tabular-nums; letter-spacing: 0.02em; text-align: right; }
.sf-clock-date { margin-top: 0.15rem; color: rgba(255,255,255,0.68); font-size: 0.62rem; font-weight: 700; text-align: right; text-transform: uppercase; letter-spacing: 0.04em; }
.user-profile-wrap { display: flex; align-items: center; gap: 0.45rem; padding: 0.2rem 0.25rem 0.2rem 0.45rem; border-radius: var(--radius-sm); cursor: default; font-family: "72", "Inter", sans-serif;}
.user-profile-wrap:hover { background: rgba(255,255,255,0.1); }
.user-profile-text { text-align: right; line-height: 1.12; max-width: 15rem; }
.user-profile-name { font-size: 0.75rem; font-weight: 800; color: #ffffff; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.user-profile-id { font-size: 0.62rem; font-weight: 700; color: #91c8ff; margin: 0.08rem 0 0; letter-spacing: 0.05em; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.user-profile-role { font-size: 0.6rem; font-weight: 600; color: rgba(255,255,255,0.7); margin: 0.08rem 0 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.user-avatar { display: grid; width: 2rem; height: 2rem; place-items: center; border-radius: 999px; background: #d1e8ff; color: #073b69; font-size: 0.75rem; font-weight: 800; object-fit: cover; border: 1px solid rgba(255,255,255,0.38); }
.mobile-burger { display: none; }

.mobile-slideout { position: fixed; top: 0; left: -300px; width: 280px; height: 100vh; background-color: #ffffff; z-index: 10000; transition: left 0.3s ease; box-shadow: 2px 0 12px rgba(0,0,0,0.15); display: flex; flex-direction: column; font-family: "72", "Inter", sans-serif;}
.mobile-slideout.open { left: 0; }
.mobile-menu-header { display: flex; justify-content: space-between; align-items: center; padding: 20px; border-bottom: 1px solid #e6e9ee; }
.close-btn { background: none; border: none; font-size: 28px; cursor: pointer; color: #071b44; padding: 0; }
.mobile-nav-links { display: flex; flex-direction: column; }
.mobile-nav-links .nav-item-amadeus { text-align: left; padding: 16px 20px; background: none; border: none; border-bottom: 1px solid #edf0f3; color: #071b44; font-weight: 600; font-size: 14px; cursor: pointer; }
.menu-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(7, 27, 68, 0.46); z-index: 9998; display: none; opacity: 0; transition: opacity 0.3s ease; }
.menu-overlay.show { display: block; opacity: 1; }

/* GroupTalk runs without a page/global header. */
body.mode-desktop .app {
  padding-top: 0;
}

/* =========================================================
   SKANDI INTERNAL CLASSIC CHROME
   ========================================================= */
:root{
  --chromeTopH:76px;
  --chromeMenuH:32px;
  --chromeH:calc(var(--chromeTopH) + var(--chromeMenuH));
}
.use-global-chrome{
  height:var(--chromeH);
  position:relative;
  z-index:10000;
  background:#d8d8d8;
}
.sk-chrome{
  height:var(--chromeH);
  display:grid;
  grid-template-rows:var(--chromeTopH) var(--chromeMenuH);
  border-bottom:1px solid #777;
  box-shadow:0 2px 6px rgba(15,23,42,.2);
}
.sk-chrome-top{
  min-width:0;
  background:linear-gradient(90deg,#022e64 0%,#073775 62%,#0b3a7a 100%);
  color:#fff;
  display:grid;
  grid-template-columns:minmax(230px,1fr) auto minmax(210px,300px) auto;
  align-items:center;
  gap:14px;
  padding:8px 12px;
}
.sk-chrome-brand{
  min-width:0;
  display:flex;
  align-items:center;
  gap:12px;
}
.sk-chrome-logo-left{
  height:44px;
  width:auto;
  object-fit:contain;
  flex:0 0 auto;
}
.sk-chrome-page{
  min-width:0;
}
.sk-chrome-title{
  font-weight:800;
  letter-spacing:.12em;
  text-transform:uppercase;
  font-size:14px;
  line-height:1.1;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
}
.sk-chrome-subtitle{
  margin-top:3px;
  font-size:11px;
  opacity:.86;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
}
.sk-chrome-altea-wrap{
  display:grid;
  place-items:center;
  min-width:86px;
}
.sk-chrome-logo-altea{
  height:36px;
  width:auto;
  object-fit:contain;
}
.sk-chrome-user{
  justify-self:end;
  min-width:0;
  width:100%;
  max-width:300px;
  font-family:var(--mono);
  font-size:10px;
  line-height:1.22;
  text-align:left;
}
.sk-chrome-user>b{
  display:block;
  font-family:var(--font);
  font-size:12px;
  font-weight:800;
  text-align:right;
  margin-bottom:3px;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
}
.sk-chrome-user-grid{
  display:grid;
  grid-template-columns:auto minmax(0,1fr);
  gap:1px 8px;
  align-items:center;
}
.sk-chrome-user-grid span:nth-child(odd){
  color:rgba(255,255,255,.68);
  text-transform:uppercase;
  letter-spacing:.08em;
  font-size:9px;
}
.sk-chrome-user-grid span:nth-child(even){
  text-align:right;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
}
.sk-chrome-clock{
  justify-self:end;
  border:1px solid rgba(255,255,255,.28);
  border-radius:4px;
  background:rgba(0,0,0,.16);
  color:#fff;
  padding:6px 9px;
  min-width:82px;
  height:52px;
}
.sk-chrome-clock:hover{
  background:rgba(0,0,0,.26);
}
.sk-chrome-clock-time{
  font-family:var(--mono);
  font-size:14px;
  font-weight:800;
  line-height:1.1;
}
.sk-chrome-clock-date{
  margin-top:4px;
  font-size:9px;
  letter-spacing:.12em;
  opacity:.8;
}
.sk-menu-bar{
  height:var(--chromeMenuH);
  display:flex;
  align-items:stretch;
  background:#d7d7d7;
  border-top:1px solid rgba(255,255,255,.95);
  box-shadow:inset 0 -1px #8b8b8b;
  overflow:visible;
}
.sk-menu{
  position:relative;
  height:100%;
  flex:0 0 auto;
}
.sk-help-menu{
  margin-left:auto;
}
.sk-menu-button{
  height:100%;
  border:0;
  border-right:1px solid #a1a1a1;
  background:transparent;
  color:#111827;
  padding:0 13px;
  font-size:12px;
  font-weight:600;
  letter-spacing:.02em;
}
.sk-help-menu .sk-menu-button{
  border-left:1px solid #b5b5b5;
}
.sk-menu:hover .sk-menu-button,
.sk-menu-button:focus-visible{
  background:#c7ccd4;
}
.sk-menu-dropdown{
  display:none;
  position:absolute;
  top:100%;
  left:0;
  z-index:99999;
  min-width:210px;
  background:#eeeeee;
  border:1px solid #555;
  box-shadow:3px 3px 0 rgba(0,0,0,.25);
  padding:2px 0;
}
.sk-menu:hover .sk-menu-dropdown,
.sk-menu:focus-within .sk-menu-dropdown{
  display:block;
}
.sk-menu-item{
  width:100%;
  min-height:28px;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:18px;
  border:0;
  background:transparent;
  color:#111827;
  text-align:left;
  padding:6px 10px;
  font-size:12px;
}
.sk-menu-item:hover,
.sk-menu-item:focus-visible{
  background:#022e64;
  color:#fff;
  outline:0;
}
.sk-menu-shortcut{
  margin-left:auto;
  color:#6b7280;
  font-family:var(--mono);
  font-size:10px;
}
.sk-menu-item:hover .sk-menu-shortcut,
.sk-menu-item:focus-visible .sk-menu-shortcut{
  color:#dbeafe;
}
.sk-menu-sep{
  height:1px;
  margin:3px 0;
  background:#c4c4c4;
}
.sk-search-wrap{
  width:310px;
  padding:8px;
}
.sk-search-input{
  width:100%;
  height:30px;
  border:1px solid #9ca3af;
  border-radius:2px;
  background:#fff;
  color:#111827;
  padding:4px 7px;
  font-size:12px;
}
.sk-search-results{
  margin-top:6px;
  max-height:220px;
  overflow:auto;
  font-size:12px;
  color:#374151;
}

/* =========================================================
   APP SHELL - chrome/menu, then GroupTalk immediately
   ========================================================= */
.app{
  height:100dvh;
  min-height:0;
  background:var(--altea-bg);
  overflow:hidden;
}
.mobileApp,.desktopApp{display:none;height:100%;overflow:hidden}
body.mode-mobile .mobileApp{display:flex}
body.mode-desktop .desktopApp{display:grid}

/* =========================================================
   MOBILE GROUPTALK
   ========================================================= */
.mobileApp{
  max-width:430px;
  margin:0 auto;
  width:100%;
  flex-direction:column;
  padding:8px 8px calc(10px + env(safe-area-inset-bottom));
  background:radial-gradient(circle at top,#151823 0,#05060a 66%);
  color:var(--gt-text);
}
.mTop{
  display:flex;
  justify-content:space-between;
  align-items:center;
  margin-bottom:6px;
  min-height:32px;
}
.logoText{
  font-size:15px;
  font-weight:800;
  letter-spacing:-.03em;
}
.logoText span:first-child{color:#f5f5f7}
.logoText span:last-child{color:var(--accent)}
.dot{
  display:inline-block;
  width:8px;
  height:8px;
  border-radius:50%;
  background:#6b7280;
  margin-right:6px;
  vertical-align:middle;
}
.dot.on{background:#22c55e;box-shadow:0 0 12px #22c55e}
#mStatus{font-size:12px;color:var(--gt-dim)}

.groupBar{
  background:#1a1d24;
  border:1px solid #31353f;
  border-radius:8px;
  padding:7px 10px;
  margin:6px 0 10px;
}
.groupName{font-size:15px;font-weight:700;color:#fff}
.groupSub,.small{font-size:11px;color:var(--gt-dim)}
.groupSub{margin-top:2px}

.grid{
  display:grid;
  grid-template-columns:repeat(3,minmax(0,1fr));
  gap:6px;
  margin-bottom:10px;
}
.tile{
  min-height:84px;
  border:1px solid var(--gt-line);
  border-radius:10px;
  background:var(--gt-tile);
  color:#f9fafb;
  padding:8px 8px 6px;
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:space-between;
  gap:5px;
  text-align:center;
  box-shadow:0 10px 16px rgba(0,0,0,.65);
  transition:transform .12s ease,background .12s ease,border-color .12s ease;
}
.tile:active{transform:translateY(1px)}
.tile:hover{background:#444954;border-color:#5a606d}
.tile .ico{font-size:22px;line-height:1.1}
.tile .main{font-size:12px;font-weight:600}
.tile .sub{font-size:10px;color:var(--gt-dim);line-height:1.2}
.tile.red{
  background:linear-gradient(135deg,#86161f,#b3262e);
  border-color:#f87171;
}

.mobilePanel{
  margin-top:auto;
  background:#151822;
  border:1px solid #232633;
  border-radius:10px;
  padding:8px 8px 10px;
  box-shadow:0 -8px 18px rgba(0,0,0,.8);
}
.bottomRow{
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:8px;
}
#mActiveGroup{font-weight:700;font-size:13px;color:#fff}
#mActiveUser{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pttWrap{
  display:flex;
  justify-content:center;
  margin-top:8px;
}
.ptt{
  width:100%;
  max-width:280px;
  border:0;
  border-radius:999px;
  padding:12px 10px;
  background:radial-gradient(circle at top,#2563eb,#1d4ed8);
  color:#f9fafb;
  font-size:15px;
  font-weight:800;
  letter-spacing:.14em;
  text-transform:uppercase;
  box-shadow:0 16px 32px rgba(37,99,235,.75);
}
.ptt{
  --ptt-level:0%;
}
.ptt.pressed{
  background:#138a44;
  box-shadow:0 12px 26px rgba(34,197,94,.36);
}
.ptt.speaking{
  background:
    linear-gradient(
      90deg,
      #58dc76 0,
      #35c65c var(--ptt-level),
      #138a44 var(--ptt-level),
      #0d6d35 100%
    );
  box-shadow:
    0 0 0 1px rgba(94,234,123,.34),
    0 12px 28px rgba(22,163,74,.34);
}
.vu{
  height:8px;
  border-radius:999px;
  background:#111827;
  border:1px solid #4b5563;
  overflow:hidden;
  margin-top:8px;
  display:none;
}
.vu.active{display:block}
.vu>div{
  height:100%;
  width:10%;
  background:linear-gradient(90deg,#22c55e,#facc15,#f97316,#ef4444);
  transition:width .12s ease-out;
}

/* =========================================================
   MOBILE SHEETS / FORMS
   ========================================================= */
.sheet{
  position:fixed;
  left:0;
  right:0;
  bottom:0;
  height:min(82%,calc(var(--gt-app-height) - 52px));
  max-height:calc(var(--gt-app-height) - 52px);
  background:#24272d;
  color:#f9fafb;
  border-radius:16px 16px 0 0;
  border-top:1px solid #000;
  z-index:9000;
  padding:16px 16px calc(16px + env(safe-area-inset-bottom));
  transform:translate3d(0,105%,0);
  transition:transform .22s ease,visibility 0s linear .22s;
  visibility:hidden;
  pointer-events:none;
  display:flex;
  flex-direction:column;
  box-shadow:0 -14px 30px rgba(0,0,0,.8);
  will-change:transform;
}
.sheet.active{
  transform:translate3d(0,0,0);
  visibility:visible;
  pointer-events:auto;
  transition:transform .22s ease,visibility 0s;
}
.sheetHead{
  display:flex;
  align-items:center;
  justify-content:space-between;
  font-size:14px;
  font-weight:700;
  margin-bottom:10px;
}
.sheetBody{flex:1;overflow:auto}
.phoneRow,.ticketRow{
  display:flex;
  justify-content:space-between;
  gap:8px;
  align-items:center;
  border-bottom:1px solid #3b3f45;
  padding:9px 0;
  font-size:13px;
}
.mini{
  border:1px solid #4b5563;
  background:#111827;
  color:#f9fafb;
  border-radius:999px;
  padding:6px 10px;
  font-size:11px;
  white-space:nowrap;
}
.form{display:grid;gap:8px}
.darkInput{
  width:100%;
  border:1px solid #4b5563;
  background:#111827;
  color:#fff;
  border-radius:8px;
  min-height:38px;
  padding:8px;
  font-size:16px;
}
textarea.darkInput{min-height:92px;resize:vertical}
.primary{
  border:0;
  border-radius:9px;
  background:#1d4ed8;
  color:white;
  font-weight:800;
  padding:10px;
  box-shadow:0 10px 20px rgba(29,78,216,.28);
}
.danger{
  position:fixed;
  inset:0;
  background:rgba(220,38,38,.32);
  display:none;
  align-items:center;
  justify-content:center;
  z-index:9500;
}
.danger.active{display:flex}
.dangerBox{
  background:#7f1d1d;
  color:#fee2e2;
  padding:22px 28px;
  border-radius:14px;
  font-size:20px;
  font-weight:800;
  text-align:center;
  white-space:pre-wrap;
  box-shadow:0 22px 40px rgba(0,0,0,.85);
}

/* =========================================================
   DESKTOP DISPATCH - flattened, gray GroupTalk workspace
   ========================================================= */
.desktopApp{
  grid-template-rows:minmax(0,1fr);
  background:var(--altea-bg);
  color:var(--altea-text);
}
.dTop{
  display:none!important;
}
.dMain{
  min-height:0;
  height:100%;
  padding:8px;
  display:grid;
  grid-template-columns:320px minmax(0,1fr) 420px;
  gap:8px;
  background:var(--gt-bg-2);
  border-top:1px solid #cbd5e1;
}
.panel{
  border:1px solid var(--gt-line);
  background:var(--gt-panel);
  color:var(--gt-text);
  border-radius:6px;
  min-height:0;
  display:flex;
  flex-direction:column;
  overflow:hidden;
  box-shadow:0 8px 20px rgba(0,0,0,.18);
}
.panelHead{
  height:30px;
  background:var(--gt-panel-2);
  border-bottom:1px solid var(--gt-line);
  display:flex;
  align-items:center;
  justify-content:space-between;
  padding:0 8px;
  font-size:11px;
  font-weight:700;
  text-transform:uppercase;
  letter-spacing:.08em;
  color:#e5e7eb;
}
.panelBody{
  flex:1;
  min-height:0;
  overflow:auto;
  padding:8px;
}
.badge{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  border:1px solid var(--gt-line);
  border-radius:999px;
  padding:2px 8px;
  min-height:18px;
  font-size:10px;
  background:#111827;
  color:#e5e7eb;
  text-transform:none;
  letter-spacing:0;
}
.groupItem{
  border:1px solid #4b4f59;
  border-radius:6px;
  padding:8px;
  margin-bottom:6px;
  cursor:pointer;
  background:#30343b;
  color:#f3f4f6;
}
.groupItem:hover{background:#373c46}
.groupItem.active{
  border-color:var(--accent);
  background:#1f2937;
  box-shadow:inset 3px 0 0 var(--accent);
}
.groupItem b{font-size:12px}
.groupItem .small{color:#b2b5bd;margin:3px 0 6px}

.dispatch{
  display:grid;
  grid-template-rows:1.1fr .9fr auto;
  gap:8px;
  min-height:0;
}
.mapWrap{
  height:100%;
  min-height:240px;
  background:radial-gradient(circle at top,#1f2937 0,#020617 90%);
  border-radius:6px;
  border:1px solid var(--gt-line);
  overflow:hidden;
  position:relative;
}
#map{position:absolute;inset:0}
.mapMissing{
  position:absolute;
  inset:0;
  display:grid;
  place-items:center;
  color:#9ca3af;
  text-align:center;
  padding:18px;
  font-size:12px;
}
.tables{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:8px;
  min-height:0;
}
table{
  width:100%;
  border-collapse:collapse;
  font-size:11px;
  color:#f3f4f6;
}
th,td{
  padding:5px 4px;
  border-bottom:1px solid #4b4f59;
  text-align:left;
  vertical-align:top;
}
th{
  color:#d1d5db;
  font-weight:700;
  font-size:10px;
  text-transform:uppercase;
  letter-spacing:.06em;
}
tr.click{cursor:pointer}
tr.click:hover{background:#30343b}
td .small{font-size:10px;color:#b2b5bd}

.dPtt{
  min-height:64px;
  background:#272a33;
  color:#f3f4f6;
  border:1px solid var(--gt-line);
  border-radius:6px;
  display:flex;
  align-items:center;
  justify-content:space-between;
  padding:8px 12px;
  gap:12px;
}
.dPtt b{
  font-size:13px;
  color:#fff;
}
.dPtt .ptt{
  max-width:260px;
  padding:11px 24px;
  font-size:13px;
}
.dPtt .vu{
  width:140px;
  margin-top:0;
  flex:0 0 140px;
}
.detail{
  white-space:pre-wrap;
  font-size:12px;
  line-height:1.5;
  color:#f3f4f6;
}
.reply{
  display:grid;
  gap:7px;
  margin-top:8px;
}
.lightInput{
  width:100%;
  border:1px solid #4b4f59;
  border-radius:6px;
  padding:7px;
  font-size:12px;
  min-height:34px;
  background:#111827;
  color:#f9fafb;
}
.lightInput::placeholder,.darkInput::placeholder{color:#8b95a5}
textarea.lightInput{min-height:82px;resize:vertical}

.adminOnly{display:none}
body.can-manage .adminOnly{display:block}
.panelBody.adminOnly{
  border-top:1px solid #4b4f59!important;
  background:#32353f;
}
.panelBody.adminOnly b{color:#fff}

.toast{
  position:fixed;
  right:12px;
  bottom:calc(12px + env(safe-area-inset-bottom));
  background:#020617;
  color:#fff;
  border:1px solid #30343b;
  border-radius:8px;
  padding:10px 12px;
  font-size:12px;
  display:none;
  z-index:9800;
  box-shadow:0 18px 40px rgba(0,0,0,.35);
}

/* Desktop workflow additions: phonebook, ticket category control, and cases */
.desktopStack{
  min-height:0;
  display:flex;
  flex-direction:column;
  gap:8px;
  overflow:hidden;
}
.leftStack,.rightStack{min-width:0}
.groupPanel{flex:1 1 38%}
.phonePanel{flex:1 1 26%}
.categoryPanel{flex:1 1 30%}
.detailPanel{flex:1 1 50%}
.casePanel{flex:1 1 50%}
.compactAdmin{
  border-top:1px solid #4b4f59!important;
  flex:0 0 auto;
  background:#32353f;
}
.headMini{
  border:1px solid #4b4f59;
  border-radius:999px;
  background:#111827;
  color:#f9fafb;
  font-size:10px;
  line-height:1;
  padding:4px 8px;
}
.headMini:hover{border-color:var(--accent);color:#fff}
.desktopPhoneList,.caseEmployeeList,.categoryList{
  display:grid;
  gap:6px;
}
.desktopPhoneList.empty,.caseEmployeeList.empty,.categoryList.empty{
  color:#b2b5bd;
  font-size:12px;
}
.phoneCard,.caseEmployee,.categoryRow{
  border:1px solid #4b4f59;
  background:#30343b;
  border-radius:6px;
  padding:7px;
  color:#f3f4f6;
}
.phoneCard{
  display:grid;
  grid-template-columns:minmax(0,1fr) auto;
  gap:8px;
  align-items:center;
}
.phoneCard b,.caseEmployee b,.categoryRow b{
  display:block;
  font-size:12px;
  color:#fff;
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
}
.phoneActions,.inlineActions{
  display:flex;
  gap:6px;
  align-items:center;
  flex-wrap:wrap;
}
.caseHint{margin-bottom:6px}
.caseEmployee{
  display:flex;
  align-items:flex-start;
  gap:8px;
  cursor:pointer;
}
.caseEmployee input{
  margin-top:2px;
  accent-color:var(--accent);
}
.caseEmployee.selected{
  border-color:var(--accent);
  background:#1f2937;
}
.categoryRow{
  display:grid;
  grid-template-columns:minmax(0,1fr) auto;
  align-items:center;
  gap:8px;
}
.categoryRow.hiddenCat{opacity:.55}
.categoryMeta{
  font-size:10px;
  color:#b2b5bd;
  margin-top:3px;
}
.categoryEditor{
  border-top:1px solid #4b4f59;
  margin-top:8px;
  padding-top:8px;
}

/* =========================================================
   RESPONSIVE
   ========================================================= */
@media(max-width:1180px){
  .dMain{grid-template-columns:280px minmax(0,1fr) 360px}
}
@media(max-width:980px){
  .dMain{grid-template-columns:240px minmax(0,1fr)}
  .rightStack{display:none}
}
@media(max-width:767px){
  :root{
    --chromeTopH:64px;
    --chromeMenuH:32px;
    --chromeH:calc(var(--chromeTopH) + var(--chromeMenuH));
  }
  .sk-chrome-top{
    grid-template-columns:minmax(0,1fr) auto;
    gap:8px;
    padding:6px 8px;
  }
  .sk-chrome-logo-left{height:32px}
  .sk-chrome-logo-altea{height:28px}
  .sk-chrome-altea-wrap{display:none}
  .sk-chrome-title{font-size:11px}
  .sk-chrome-subtitle{display:none}
  .sk-chrome-user{display:none}
  .sk-chrome-clock{
    min-width:72px;
    height:44px;
    padding:5px 7px;
  }
  .sk-chrome-clock-time{font-size:12px}
  .sk-menu-button{padding:0 10px;font-size:11px}
  .sk-search-wrap{width:260px}
  .app{background:#05060a}
}
@media(max-width:430px){
  .sk-menu-button{padding:0 8px}
  .sk-help-menu{display:none}
  .tile{min-height:82px;padding:7px 4px}
  .tile .sub{display:none}
}


/* =========================================================
   NATIVE-LIKE MOBILE VIEWPORT + PTT TOUCH SAFETY
   ========================================================= */
:root{
  --gt-app-height:100dvh;
  --gt-app-width:100vw;
}
html,
body{
  width:100%;
  height:100%;
  min-height:100%;
  margin:0;
  overflow:hidden;
  overscroll-behavior:none;
  -webkit-overflow-scrolling:touch;
}
body{
  position:fixed;
  inset:0;
  width:100vw;
  height:var(--gt-app-height);
  min-height:var(--gt-app-height);
  touch-action:manipulation;
}
.app{
  position:fixed;
  inset:0;
  width:var(--gt-app-width);
  height:var(--gt-app-height);
  min-height:var(--gt-app-height);
  max-height:var(--gt-app-height);
  overflow:hidden;
}
body.mode-mobile .mobileApp{
  width:100%;
  max-width:none;
  height:100%;
  min-height:100%;
  margin:0;
  padding:
    calc(8px + env(safe-area-inset-top))
    calc(8px + env(safe-area-inset-right))
    calc(10px + env(safe-area-inset-bottom))
    calc(8px + env(safe-area-inset-left));
}
button,
.tile,
.ptt,
#btnEmergency{
  -webkit-user-select:none;
  user-select:none;
  -webkit-touch-callout:none;
  -webkit-tap-highlight-color:transparent;
}
.ptt,
#btnEmergency{
  touch-action:none;
  cursor:pointer;
}
body.ptt-lock,
body.ptt-lock *{
  -webkit-user-select:none !important;
  user-select:none !important;
  -webkit-touch-callout:none !important;
}
.bottomRow{
  justify-content:flex-start;
}

/* =========================================================
   LOCKED MOBILE REFERENCE — GROUPTALK RADIO APP
   Based on supplied GroupTalk mobile screenshot.
   Desktop UI is intentionally unaffected.
   ========================================================= */
@media (max-width: 899px){
  body.mode-mobile{
    position:relative;
    inset:auto;
    width:100%;
    height:100%;
    min-height:0;
    background:#0a0b0e;
  }

  body.mode-mobile .app{
    position:relative;
    inset:auto;
    width:100%;
    height:100%;
    min-height:0;
    max-height:none;
  }

  body.mode-mobile .mobileApp{
    box-sizing:border-box;
    display:flex;
    flex-direction:column;
    width:100%;
    max-width:none;
    height:var(--gt-app-height);
    min-height:var(--gt-app-height);
    margin:0;
    padding:
      calc(14px + env(safe-area-inset-top))
      calc(7px + env(safe-area-inset-right))
      calc(8px + env(safe-area-inset-bottom))
      calc(7px + env(safe-area-inset-left));
    overflow:hidden;
    background:#0b0c10;
    color:#f2f2f2;
    font-family:Arial,Helvetica,sans-serif;
  }

  .gtMobileTop{
    flex:0 0 auto;
    min-height:30px;
    display:flex;
    align-items:stretch;
    justify-content:space-between;
    gap:5px;
    margin:0 0 3px;
  }

  .gtMobileTools{
    display:flex;
    align-items:stretch;
    gap:2px;
  }

  .gtTopButton{
    position:relative;
    width:29px;
    height:29px;
    min-width:29px;
    border:1px solid #252937;
    border-radius:3px;
    background:linear-gradient(#191b24,#101117);
    color:#d7d9de;
    padding:5px;
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,.04),
      0 1px 2px rgba(0,0,0,.75);
    display:flex;
    align-items:center;
    justify-content:center;
    -webkit-user-select:none;
    user-select:none;
    -webkit-touch-callout:none;
    touch-action:manipulation;
  }

  .gtTopButton svg{
    width:14px;
    height:14px;
    fill:currentColor;
  }

  .gtUserButton{
    padding-top:3px;
    padding-bottom:9px;
  }

  .gtUserButton svg{
    width:12px;
    height:12px;
  }

  #mOnlineCount{
    position:absolute;
    left:0;
    right:0;
    bottom:2px;
    text-align:center;
    font-size:7px;
    line-height:1;
    color:#fff;
    font-weight:700;
  }

  .gtReferenceLogo{
    height:29px;
    display:flex;
    align-items:center;
    justify-content:flex-end;
    padding:0 2px 0 6px;
    font-size:13px;
    letter-spacing:-.55px;
    line-height:1;
    white-space:nowrap;
  }

  .gtReferenceLogo span{
    color:#9997ae;
    font-weight:700;
  }

  .gtReferenceLogo strong{
    color:#ff9d00;
    font-weight:800;
  }

  .gtShortcutBar{
    position:relative;
    flex:0 0 auto;
    height:28px;
    padding:3px 5px 2px;
    margin:0 0 3px;
    border:1px solid #252837;
    border-radius:1px;
    background:#505060;
    box-shadow:inset 0 1px 0 rgba(255,255,255,.05);
    overflow:hidden;
  }

  .gtShortcutTitle{
    color:#fff;
    font-size:9px;
    font-weight:700;
    line-height:11px;
    white-space:nowrap;
    overflow:hidden;
    text-overflow:ellipsis;
  }

  .gtShortcutSub{
    color:#d9d8df;
    font-size:7px;
    line-height:9px;
  }

  .gtA11yStatus,
  .gtA11yDot{
    position:absolute;
    width:1px;
    height:1px;
    overflow:hidden;
    clip:rect(0 0 0 0);
    clip-path:inset(50%);
    white-space:nowrap;
  }

  .gtReferenceGrid{
    flex:0 0 auto;
    display:grid;
    grid-template-columns:repeat(2,minmax(0,1fr));
    grid-auto-rows:48px;
    gap:2px;
    margin:0 0 3px;
  }

  .gtReferenceTile{
    min-width:0;
    min-height:0;
    border:1px solid #020204;
    border-radius:3px;
    padding:4px 3px 3px;
    background:#484848;
    color:#ededed;
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,.05),
      0 1px 1px rgba(0,0,0,.7);
    display:flex;
    flex-direction:column;
    align-items:center;
    justify-content:center;
    gap:2px;
    font:inherit;
    -webkit-user-select:none;
    user-select:none;
    -webkit-touch-callout:none;
    -webkit-tap-highlight-color:transparent;
    touch-action:manipulation;
  }

  .gtReferenceTile:active{
    background:#5a5a5a;
    transform:none;
  }

  .gtRefIcon{
    width:22px;
    height:22px;
    display:flex;
    align-items:center;
    justify-content:center;
    color:#e3e3e3;
  }

  .gtRefIcon svg{
    width:21px;
    height:21px;
    fill:currentColor;
  }

  .gtRefLabel{
    font-size:8px;
    line-height:9px;
    color:#fff;
    text-align:center;
    white-space:nowrap;
  }

  .gtEmergencyTile{
    background:linear-gradient(135deg,#8d383e,#a44149);
    border-color:#50171c;
  }

  .gtEmergencyTile:active{
    background:#b64b55;
  }

  .gtReferencePtt{
    position:relative;
    flex:0 0 69px;
    width:100%;
    min-height:69px;
    margin:0;
    padding:8px 10px;
    border:1px solid #747789;
    border-radius:4px;
    background:#515261;
    color:#fff;
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,.09),
      0 1px 2px rgba(0,0,0,.75);
    display:flex;
    align-items:center;
    justify-content:flex-start;
    gap:9px;
    text-align:left;
    font:inherit;
    overflow:hidden;
    -webkit-user-select:none !important;
    user-select:none !important;
    -webkit-touch-callout:none !important;
    -webkit-tap-highlight-color:transparent;
    touch-action:none !important;
  }

  .gtReferencePtt{
    --ptt-level:0%;
  }

  .gtReferencePtt.pressed{
    background:#168244;
    border-color:#45ba68;
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,.12),
      0 0 0 1px rgba(77,209,111,.45),
      0 2px 8px rgba(0,0,0,.65);
  }

  .gtReferencePtt.speaking{
    background:
      linear-gradient(
        90deg,
        #6be081 0,
        #3dcc64 var(--ptt-level),
        #168244 var(--ptt-level),
        #0f6335 100%
      );
    border-color:#65dd81;
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,.14),
      0 0 0 1px rgba(101,221,129,.48),
      0 2px 9px rgba(0,0,0,.68);
  }

  .gtPttMic{
    position:relative;
    z-index:2;
    flex:0 0 31px;
    width:31px;
    height:40px;
    display:flex;
    align-items:center;
    justify-content:center;
    color:#fff;
  }

  .gtPttMic svg{
    width:29px;
    height:36px;
    fill:currentColor;
  }

  .gtPttText{
    position:relative;
    z-index:2;
    min-width:0;
    display:flex;
    flex-direction:column;
    justify-content:center;
    gap:3px;
  }

  .gtPttText strong{
    color:#fff;
    font-size:10px;
    line-height:12px;
    font-weight:700;
    white-space:nowrap;
    overflow:hidden;
    text-overflow:ellipsis;
  }

  .gtPttText span{
    color:#9b9ca6;
    font-size:8px;
    line-height:10px;
    white-space:nowrap;
    overflow:hidden;
    text-overflow:ellipsis;
  }

  .gtPttPulse{
    position:absolute;
    width:13px;
    height:13px;
    left:27px;
    top:28px;
    border-radius:50%;
    border:1px solid rgba(255,255,255,.18);
    opacity:.4;
    pointer-events:none;
  }

  .gtReferencePtt.pressed .gtPttPulse{
    animation:gtRefPttPulse .8s infinite ease-out;
  }

  @keyframes gtRefPttPulse{
    from{transform:scale(.6);opacity:.65}
    to{transform:scale(2.3);opacity:0}
  }

  .gtMobileVu{
    flex:0 0 2px;
    height:2px;
    min-height:2px;
    margin:2px 0 0;
    border:0;
    border-radius:0;
    background:#18191e;
    overflow:hidden;
  }

  .gtMobileVu > div{
    height:100%;
  }

  /*
   * Scale the compact radio layout gently on taller modern phones while
   * retaining the same proportions as the supplied 169×321 reference.
   */
  @media (min-height:500px){
    .gtReferenceGrid{grid-auto-rows:clamp(52px,10.8dvh,64px)}
    .gtReferencePtt{flex-basis:clamp(72px,15.5dvh,92px)}
    .gtRefIcon{width:25px;height:25px}
    .gtRefIcon svg{width:24px;height:24px}
    .gtRefLabel{font-size:9px;line-height:10px}
    .gtPttText strong{font-size:11px}
    .gtPttText span{font-size:9px}
  }
}


/* PTT IS THE LIVE HORIZONTAL LEVEL METER */
body.mode-mobile .gtMobileVu{
  display:none !important;
}
body.mode-desktop .dPtt .vu{
  display:none !important;
  width:0 !important;
  flex:0 0 0 !important;
  margin:0 !important;
}
body.mode-desktop .dPtt .ptt{
  max-width:360px;
  min-width:260px;
}

/* DESKTOP RUNTIME FIX */
@media (min-width:900px){
  body.mode-desktop{position:fixed;inset:0;width:100%;height:100dvh;overflow:hidden}
  body.mode-desktop .app{position:fixed;inset:0;width:100%;height:100dvh;max-height:none;overflow:hidden}
  body.mode-desktop .desktopApp{display:block;width:100%;height:100%;min-height:0;overflow:auto;overscroll-behavior:contain}
  body.mode-desktop .dMain{width:100%;min-width:1120px;height:auto;min-height:max(100%,720px);align-items:stretch}
  body.mode-desktop .dispatch{min-height:704px}
  body.mode-desktop .dPtt{position:sticky;bottom:0;z-index:80;box-shadow:0 -8px 18px rgba(0,0,0,.22)}
}

</style>
</head>
<body>



<div class="app">
<section class="mobileApp">
  <div class="gtMobileTop">
    <div class="gtMobileTools">
      <button id="btnMobileMenu" class="gtTopButton" type="button" aria-label="Shortcuts"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h5v5H5V5Zm9 0h5v5h-5V5ZM5 14h5v5H5v-5Zm9 0h5v5h-5v-5Z"/></svg></button>
      <button id="btnMobileUsers" class="gtTopButton gtUserButton" type="button" aria-label="Online users">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm6.4-.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4ZM2.5 20c.2-4.3 2.7-7 6.5-7s6.3 2.7 6.5 7H2.5Zm12.8 0c-.1-2.1-.8-3.9-2-5.3.7-.5 1.6-.7 2.6-.7 3.1 0 5.2 2.2 5.6 6h-6.2Z"/></svg>
        <span id="mOnlineCount">0</span>
      </button>
      <button id="btnMobileMessages" class="gtTopButton" type="button" aria-label="My tickets"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v11H8l-4 3V5Zm3 4h10V7H7v2Zm0 4h7v-2H7v2Z"/></svg></button>
    </div>
    <div class="gtReferenceLogo" aria-label="GroupTalk"><span>group</span><strong>talk</strong></div>
  </div>

  <div class="gtShortcutBar">
    <div id="mGroup" class="gtShortcutTitle">—</div>
    <div id="mSub" class="gtShortcutSub">Shortcuts</div>
    <span id="mStatus" class="gtA11yStatus">Connecting</span>
    <span id="mDot" class="gtA11yDot"></span>
  </div>

  <div class="gtReferenceGrid">
    <button class="gtReferenceTile" id="btnPhone" type="button">
      <span class="gtRefIcon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.2 3.4 4.5 5.3c-.8.6-.9 1.7-.4 2.6 3 5.4 6.7 9.1 12.1 12.1.9.5 2 .4 2.6-.4l1.9-2.7c.5-.7.3-1.7-.4-2.2l-3.6-2.2c-.7-.4-1.5-.3-2 .3l-1.4 1.7a15.7 15.7 0 0 1-3.8-3.8l1.7-1.4c.6-.5.7-1.3.3-2L9.4 3.8a1.6 1.6 0 0 0-2.2-.4Z"/></svg></span>
      <span class="gtRefLabel">Phone Book</span>
    </button>

    <button class="gtReferenceTile" id="btnGroups" type="button">
      <span class="gtRefIcon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.3 12a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2Zm7.8-1a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2 20c.2-4 2.5-6.4 6.3-6.4s6.1 2.4 6.3 6.4H2Zm12.5 0c0-2-.6-3.8-1.8-5.1.8-.7 1.9-1 3.2-1 3.2 0 5.4 2.2 5.8 6.1h-7.2Z"/></svg></span>
      <span class="gtRefLabel">Select Group</span>
    </button>

    <button class="gtReferenceTile" id="btnScanGroups" type="button">
      <span class="gtRefIcon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.2 4A6.2 6.2 0 0 0 1 10.2V16h3v-5.8a3.2 3.2 0 0 1 6.4 0V16h3v-5.8A6.2 6.2 0 0 0 7.2 4Zm8.6 3a5.6 5.6 0 0 1 2.2 4.5V16h3v-4.5A8.5 8.5 0 0 0 17.5 5l-1.7 2ZM4 17h4v3H4v-3Zm10 0h4v3h-4v-3Z"/></svg></span>
      <span class="gtRefLabel">Scan Groups</span>
    </button>

    <button class="gtReferenceTile" id="btnSettings" type="button">
      <span class="gtRefIcon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m13.3 2 .6 2.1c.5.2 1 .4 1.5.7l2-.9 2.7 2.7-.9 2c.3.5.5 1 .7 1.5l2.1.6v3.8l-2.1.6c-.2.5-.4 1-.7 1.5l.9 2-2.7 2.7-2-.9c-.5.3-1 .5-1.5.7l-.6 2.1H9.5l-.6-2.1c-.5-.2-1-.4-1.5-.7l-2 .9-2.7-2.7.9-2c-.3-.5-.5-1-.7-1.5l-2.1-.6v-3.8l2.1-.6c.2-.5.4-1 .7-1.5l-.9-2 2.7-2.7 2 .9c.5-.3 1-.5 1.5-.7L9.5 2h3.8ZM11.4 8.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6Z"/></svg></span>
      <span class="gtRefLabel">Settings</span>
    </button>

    <button class="gtReferenceTile" id="btnGoOffline" type="button">
      <span class="gtRefIcon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4.2 2.8 17 17-1.4 1.4-17-17 1.4-1.4ZM18 5.4 13.4 10l-1.7-1.7 4.6-4.6L18 5.4Zm-7 7-4.8 4.8L4.5 15.5l4.8-4.8 1.7 1.7Zm5.7 2.1 2.8 2.8-1.7 1.7-2.8-2.8 1.7-1.7ZM7.5 5l2.8 2.8-1.7 1.7-2.8-2.8L7.5 5Z"/></svg></span>
      <span class="gtRefLabel">Go Offline</span>
    </button>

    <button class="gtReferenceTile gtEmergencyTile" id="btnEmergency" type="button">
      <span class="gtRefIcon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3h6l1 10H8L9 3Zm-3 11h12l2 6H4l2-6Zm5-13h2v2h-2V1ZM4.2 5.4l1.4-1.4 1.8 1.8L6 7.2 4.2 5.4Zm14.2-1.4 1.4 1.4L18 7.2l-1.4-1.4L18.4 4Z"/></svg></span>
      <span class="gtRefLabel">Emergency</span>
    </button>
  </div>

  <button id="mPtt" class="gtReferencePtt" type="button" aria-label="Press and hold to talk">
    <span class="gtPttMic"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15a4 4 0 0 0 4-4V6a4 4 0 1 0-8 0v5a4 4 0 0 0 4 4Zm-6-4h2a4 4 0 0 0 8 0h2a6 6 0 0 1-5 5.9V20h3v2H8v-2h3v-3.1A6 6 0 0 1 6 11Z"/></svg></span>
    <span class="gtPttText">
      <strong id="mActiveGroup">—</strong>
      <span id="mActiveUser">—</span>
    </span>
    <span class="gtPttPulse" aria-hidden="true"></span>
  </button>

  <div class="vu gtMobileVu" id="mVu" aria-hidden="true"><div id="mVuInner"></div></div>
</section>
<section class="desktopApp"><div class="dTop"><div><div class="dTitle">GroupTalk Dispatch Console</div><div style="font-size:11px;opacity:.88">Live voice · locations · destination helpdesk</div></div><div class="dMeta"><div id="dUser">—</div><div id="dMeta">—</div></div></div><div class="dMain"><aside class="desktopStack leftStack"><section class="panel groupPanel"><div class="panelHead"><span>Groups</span><span id="realtimeState" class="badge">offline</span></div><div class="panelBody" id="groupList"></div><div class="panelBody adminOnly compactAdmin"><b style="font-size:12px">Admin group config</b><div class="reply"><input id="adminGroupTitle" class="lightInput" placeholder="Group name"><input id="adminGroupBase" class="lightInput" placeholder="Base, e.g. JFK.OPS"><button id="btnSaveGroup" class="primary">Save Group</button></div></div></section><section class="panel phonePanel"><div class="panelHead"><span>Phonebook</span><button id="btnDesktopPhonebook" class="headMini" type="button">Open</button></div><div class="panelBody"><div id="desktopPhoneList" class="desktopPhoneList">Loading…</div></div></section><section class="panel adminOnly categoryPanel"><div class="panelHead"><span>Ticket Categories</span><button id="btnNewCategory" class="headMini" type="button">New</button></div><div class="panelBody"><div id="categoryList" class="categoryList"></div><div class="reply categoryEditor"><input id="catId" type="hidden"><input id="catTitle" class="lightInput" placeholder="Category name"><input id="catSort" class="lightInput" type="number" min="1" placeholder="Sort order"><select id="catActive" class="lightInput"><option value="true">Active</option><option value="false">Hidden</option></select><div class="inlineActions"><button id="btnSaveCategory" class="primary" type="button">Save Category</button><button id="btnDeleteCategory" class="mini" type="button">Delete</button></div></div></div></section></aside><main class="dispatch"><div class="mapWrap"><div id="map"></div><div id="mapMissing" class="mapMissing">Loading live operations map…</div></div><div class="tables"><section class="panel"><div class="panelHead"><span>Online / Active</span><span id="onlineCount" class="badge">0</span></div><div class="panelBody"><table><thead><tr><th>User</th><th>State</th></tr></thead><tbody id="onlineTable"></tbody></table></div></section><section class="panel"><div class="panelHead"><span>Tickets</span><span id="ticketCount" class="badge">0</span></div><div class="panelBody"><table><thead><tr><th>Priority</th><th>Subject</th><th>Status</th></tr></thead><tbody id="ticketTable"></tbody></table></div></section></div><div class="dPtt"><div><b id="dActiveGroup">—</b><div class="small" id="dActiveSub">—</div></div><div class="vu" id="dVu"><div id="dVuInner"></div></div><button id="dPtt" class="ptt">🎙 PRESS & HOLD</button></div></main><aside class="desktopStack rightStack"><section class="panel detailPanel"><div class="panelHead"><span>Ticket detail</span><span id="detailStatus" class="badge">—</span></div><div class="panelBody"><div id="ticketDetail" class="detail">Select a ticket.</div><div class="reply adminOnly"><textarea id="replyBody" class="lightInput" placeholder="Reply to staff…"></textarea><textarea id="manifestText" class="lightInput" placeholder="Paste bus manifest or route list here…"></textarea><select id="replyDelivery" class="lightInput"><option>Internal Chat</option><option>Email</option><option>Manual</option></select><input id="replyEmail" class="lightInput" placeholder="Email recipient if needed"><button id="btnReply" class="primary">Send Reply</button><button id="btnResolve" class="mini" style="color:#111;background:#ecfdf5;border-color:#86efac">Mark Resolved</button></div></div></section><section class="panel casePanel"><div class="panelHead"><span>Start Case</span><span id="caseTargetCount" class="badge">0 selected</span></div><div class="panelBody"><div class="small caseHint">Select one or more employees, then start a helpdesk case tied to them.</div><div id="caseEmployeeList" class="caseEmployeeList"></div><div class="reply"><select id="caseCategory" class="lightInput"></select><select id="casePriority" class="lightInput"><option>Normal</option><option>High</option><option>Urgent</option><option>Critical</option><option>Low</option></select><input id="caseRoute" class="lightInput" placeholder="Route/ref or case reference"><input id="caseSubject" class="lightInput" placeholder="Case subject"><textarea id="caseMessage" class="lightInput" placeholder="Case notes / request details"></textarea><div class="inlineActions"><button id="btnStartCase" class="primary" type="button">Start Case</button><button id="btnClearCaseTargets" class="mini" type="button">Clear Employees</button></div></div></div></section></aside></div></section>
</div>
<div id="phoneSheet" class="sheet"><div class="sheetHead"><button class="mini" data-close="phoneSheet">← Back</button><span>Phone Book</span><span></span></div><div class="sheetBody" id="phoneList">Loading…</div></div>
<div id="groupSheet" class="sheet"><div class="sheetHead"><button class="mini" data-close="groupSheet">← Back</button><span>Select Group</span><span></span></div><div class="sheetBody" id="mobileGroupList"></div></div>
<div id="ticketSheet" class="sheet"><div class="sheetHead"><button class="mini" data-close="ticketSheet">← Back</button><span>Destination Helpdesk</span><span></span></div><div class="sheetBody"><div class="form"><select id="ticketCategory" class="darkInput"><option>Bus Manifest</option><option>Guest Issue</option><option>Hotel Issue</option><option>Transfer Issue</option><option>Flight Disruption</option><option>Emergency Support</option><option>Documents</option><option>Schedule Change</option><option>Lost Item</option><option>Operations Question</option><option>Other</option></select><select id="ticketPriority" class="darkInput"><option>Normal</option><option>High</option><option>Urgent</option><option>Critical</option><option>Low</option></select><input id="ticketRoute" class="darkInput" placeholder="Route/ref, e.g. #1298 JFK-NYC-MAN"><input id="ticketSubject" class="darkInput" placeholder="Subject"><textarea id="ticketMessage" class="darkInput" placeholder="Write request, e.g. Requesting Bus list for route #1298 JFK-NYC-MAN"></textarea><button id="btnCreateTicket" class="primary">Create ticket</button></div></div></div>
<div id="myTicketsSheet" class="sheet"><div class="sheetHead"><button class="mini" data-close="myTicketsSheet">← Back</button><span>My Tickets</span><span></span></div><div class="sheetBody" id="myTicketsList"></div></div>
<div id="emergencyOverlay" class="danger"><div class="dangerBox" id="emergencyText">EMERGENCY SENT</div></div><div id="toast" class="toast"></div>





<div class="sheet" id="mobileSettingsSheet">
  <div class="sheetCard">
    <div class="sheetHead"><b>Settings</b><button class="mini" data-close="mobileSettingsSheet" type="button">Close</button></div>
    <div class="sheetBody">
<button class="tile" id="btnSettingsLocation" style="width:100%;margin-bottom:8px" type="button">
        <span class="main">Share Live Location</span><span class="sub">Update the operations map</span>
      </button>
      <button class="tile" id="btnSettingsHelpdesk" style="width:100%;margin-bottom:8px" type="button">
        <span class="main">Helpdesk</span><span class="sub">Create an operations ticket</span>
      </button>
      <button class="tile" id="btnSettingsTickets" style="width:100%" type="button">
        <span class="main">My Tickets</span><span class="sub">View replies and status</span>
      </button>
    </div>
  </div>
</div>

<div class="sheet" id="mobileOnlineSheet">
  <div class="sheetHead"><b>Online / Active</b><button class="mini" data-close="mobileOnlineSheet" type="button">Close</button></div>
  <div class="sheetBody"><div id="mobileOnlineList" class="phoneList"></div></div>
</div>

<script>
/* =========================================
   SKANDI GROUPTALK JS
   ========================================= */
const SOURCE="GROUPTALK_HTML",PARENT="SKANDI_WIX_PARENT";
const state={
  mode:"mobile",profile:{},canManage:false,groups:[],activeGroup:null,config:{},
  lkCbs:new Map(),realtimeCbs:new Map(),room:null,voiceConnectPromise:null,voiceConnectTarget:"",voiceRoomName:"",
  supabaseClient:null,supabaseUrl:"",supabaseKey:"",realtimeChannel:null,realtimeConfig:null,realtimeConnecting:false,
  realtimeHeartbeat:null,realtimePresenceRefresh:null,realtimeAuthRefresh:null,databaseRefreshTimer:null,syncTimer:null,
  members:new Map(),phonebook:[],tickets:[],ticketCategories:[],caseTargets:new Set(),selectedTicket:null,
  outputDeviceId:"",map:null,mapLoaded:false,mapResizeObserver:null,mapRefreshTimer:null,
  mapFitPending:true,markers:new Map(),watch:null,speaking:false,pttHeld:false,pttSequence:0
};
function $(id){return document.getElementById(id)}function post(type,payload={}){parent.postMessage({source:SOURCE,type,payload,timestamp:new Date().toISOString()},"*")}function req(p="REQ"){return p+"-"+Date.now()+"-"+Math.random().toString(36).slice(2,8)}function text(id,v){const e=$(id);if(e)e.textContent=v}function toast(m){const t=$("toast");t.textContent=m;t.style.display="block";setTimeout(()=>t.style.display="none",2500)}function gid(){return state.activeGroup?.groupId||""}function mobile(){return innerWidth<=767}
let chromeClockUtc=false;
function updateChromeClock(){
  const now=new Date();
  const opts={hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false};
  if(chromeClockUtc)opts.timeZone="UTC";
  text("skChromeClockTime",now.toLocaleTimeString("en-GB",opts));
  text("skChromeClockDate",chromeClockUtc?"UTC":"LOCAL");
}
setInterval(updateChromeClock,1000);
updateChromeClock();
function decide(){state.mode=mobile()?"mobile":"desktop";document.body.classList.toggle("mode-mobile",state.mode==="mobile");document.body.classList.toggle("mode-desktop",state.mode==="desktop");document.body.classList.toggle("can-manage",!!state.canManage);if(state.mode==="desktop"){initMap();scheduleMapResize();startMapRefresh()}else{stopMapRefresh()}}addEventListener("resize",decide,{passive:true});
function render(){const p=state.profile,g=state.activeGroup||{};text("skChromeUserName",p.name||"—");text("skChromeSkid",p.skId||"—");text("skChromePosition",p.role||"—");text("skChromeBase",p.base||"—");text("mGroup",g.title||"—");text("mActiveGroup",g.title||"—");text("dActiveGroup",g.title||"—");text("mSub","Shortcuts");text("mActiveUser",p.name?`${p.name}${p.role?` (${p.role})`:""}`:[p.base,p.role].filter(Boolean).join(" • "));text("dUser",p.name||"—");text("dMeta",[p.skId,p.role,p.base].filter(Boolean).join(" · "));text("dActiveSub",`${g.base||p.base||""} • ${g.category||"Operations"}`);groups();phonebook();tickets();members();renderTicketCategories()}
function groups(){const a=$("groupList"),m=$("mobileGroupList");if(a)a.innerHTML="";if(m)m.innerHTML="";state.groups.forEach(g=>{const active=state.activeGroup&&g.groupId===state.activeGroup.groupId;const d=document.createElement("div");d.className="groupItem"+(active?" active":"");d.innerHTML=`<b>${g.title}</b><div class="small">${g.base||""} · ${g.category||""}</div><span class="badge">${g.capabilities?.canTalk?"Talk":"Listen"}</span> <span class="badge">${g.capabilities?.canCreateTickets?"Tickets":"No tickets"}</span>`;d.onclick=()=>switchGroup(g.groupId);a?.appendChild(d);const b=document.createElement("button");b.className="tile";b.style.width="100%";b.style.marginBottom="8px";b.innerHTML=`<span class="ico">🌐</span><span class="main">${g.title}</span><span class="sub">${g.base||""}</span>`;b.onclick=()=>{switchGroup(g.groupId);close("groupSheet")};m?.appendChild(b)})}
function phonebook(){mobilePhonebook();desktopPhonebook();renderCaseTargets()}
function mobilePhonebook(){const b=$("phoneList");if(!b)return;b.innerHTML="";if(!state.phonebook.length){b.textContent="No contacts in phone book.";return}state.phonebook.forEach(c=>{const r=document.createElement("div");r.className="phoneRow";r.innerHTML=`<div><b>${c.name||"Unnamed"}</b><div class="small">${[c.role,c.base,c.status].filter(Boolean).join(" • ")}</div></div>`;const btn=document.createElement("button");btn.className="mini";btn.textContent=c.phone||"Call";btn.onclick=()=>sendPtt("PHONE_BOOK_CALL",{targetSkId:c.skId,targetName:c.name,targetPhone:c.phone});r.appendChild(btn);b.appendChild(r)})}
function desktopPhonebook(){const d=$("desktopPhoneList");if(!d)return;d.innerHTML="";if(!state.phonebook.length){d.className="desktopPhoneList empty";d.textContent="No contacts loaded. Use Open to request the phonebook.";return}d.className="desktopPhoneList";state.phonebook.forEach(c=>{const row=document.createElement("div");row.className="phoneCard";const label=document.createElement("div");label.innerHTML=`<b>${c.name||"Unnamed"}</b><div class="small">${[c.skId,c.role,c.base,c.status].filter(Boolean).join(" • ")}</div>`;const actions=document.createElement("div");actions.className="phoneActions";const add=document.createElement("button");add.className="mini";add.type="button";add.textContent=state.caseTargets.has(c.skId)?"Selected":"Add Case";add.onclick=()=>toggleCaseTarget(c.skId);const call=document.createElement("button");call.className="mini";call.type="button";call.textContent=c.phone?"Call":"Ping";call.onclick=()=>sendPtt("PHONE_BOOK_CALL",{targetSkId:c.skId,targetName:c.name,targetPhone:c.phone});actions.appendChild(add);actions.appendChild(call);row.appendChild(label);row.appendChild(actions);d.appendChild(row)})}
function tickets(){const tb=$("ticketTable"),mine=$("myTicketsList");if(tb)tb.innerHTML="";if(mine)mine.innerHTML="";text("ticketCount",String(state.tickets.length));state.tickets.forEach(t=>{const tr=document.createElement("tr");tr.className="click";tr.innerHTML=`<td>${t.priority||"Normal"}</td><td>${t.subject||t.title||t.ticketId}</td><td>${t.status||"OPEN"}</td>`;tr.onclick=()=>openTicket(t.ticketId);tb?.appendChild(tr);const r=document.createElement("div");r.className="ticketRow";r.innerHTML=`<div><b>${t.subject||t.title||t.ticketId}</b><div class="small">${t.category} · ${t.status}</div></div><button class="mini">Open</button>`;r.querySelector("button").onclick=()=>openTicket(t.ticketId);mine?.appendChild(r)})}
function members(){
  const arr=[...state.members.values()];
  text("mOnlineCount",String(arr.length));
  text("onlineCount",String(arr.length));

  const mobile=$("mobileOnlineList");
  if(mobile){
    mobile.innerHTML="";
    if(!arr.length){
      mobile.innerHTML='<div class="small" style="padding:12px 0">No active colleagues.</div>'
    }else{
      arr.forEach(m=>{
        const row=document.createElement("div");
        row.className="phoneRow";
        row.innerHTML=`<div><b>${m.name||m.id||"Staff"}</b><div class="small">${[m.role,m.base].filter(Boolean).join(" • ")}</div></div><span class="badge">${m.state||"online"}</span>`;
        mobile.appendChild(row)
      })
    }
  }

  const tb=$("onlineTable");
  if(tb){
    tb.innerHTML="";
    arr.forEach(m=>{
      const tr=document.createElement("tr");
      tr.innerHTML=`<td>${m.name||m.id||"Staff"}<div class="small">${[m.role,m.base].filter(Boolean).join(" • ")}</div></td><td><span class="badge">${m.state||"online"}</span></td>`;
      tb.appendChild(tr)
    })
  }

  caseEmployees()
}
function switchGroup(id){
  const g=state.groups.find(x=>(x.groupId||x.id)===id);if(!g)return;
  const previous=gid();
  if(previous&&previous!==id){
    if(state.watch){try{navigator.geolocation.clearWatch(state.watch)}catch(_){ } state.watch=null}
    disconnectSupabaseRealtime(true);
    disconnectVoiceRoom().catch(()=>{});
  }
  state.activeGroup=g;
  if(previous!==gid())clearMapMarkers();
  render();
  connectSupabaseRealtime().catch(e=>{setRealtimeStatus("error","Connection error");console.error("Supabase Realtime connect failed:",e)});
  connectLiveKit(false).catch(e=>console.warn("LiveKit preconnect failed:",e));
  post("PHONEBOOK_REQUEST",{groupId:gid()});
  post("TICKET_LIST_REQUEST",{groupId:gid()});
  requestLiveLocations(true);
  sendPtt("GROUP_CHANGED",{groupId:gid()})
}
function open(id){$(id)?.classList.add("active")}
function close(id){$(id)?.classList.remove("active")}
document.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>close(b.dataset.close));
document.addEventListener("click",e=>{const b=e.target?.closest?.("[data-close]");if(b?.dataset?.close)close(b.dataset.close)});


function syncAppViewport(){
  const apply=()=>{
    const layoutH=document.documentElement.clientHeight||window.innerHeight||320;
    const layoutW=document.documentElement.clientWidth||window.innerWidth||280;
    const visualH=window.visualViewport?.height||layoutH;
    const visualW=window.visualViewport?.width||layoutW;
    const h=Math.min(layoutH,visualH);
    const w=Math.min(layoutW,visualW);
    document.documentElement.style.setProperty("--gt-app-height",`${Math.max(320,Math.round(h))}px`);
    document.documentElement.style.setProperty("--gt-app-width",`${Math.max(280,Math.round(w))}px`);
    decide();
    scheduleMapResize();
  };
  apply();
  window.visualViewport?.addEventListener("resize",apply,{passive:true});
  window.addEventListener("resize",apply,{passive:true});
  window.addEventListener("orientationchange",()=>setTimeout(apply,120),{passive:true});
}

function clearMapMarkers(){
  state.markers.forEach(m=>{try{m.remove()}catch(_){ }});
  state.markers.clear();
  state.mapFitPending=true;
}

function normalizeLocation(d){
  if(!d)return null;
  const latitude=Number(d.latitude ?? d.lat);
  const longitude=Number(d.longitude ?? d.lng ?? d.lon);
  if(!Number.isFinite(latitude)||!Number.isFinite(longitude))return null;
  return {
    key:String(d.skId||d.agentUserId||d.id||`${latitude}:${longitude}`),
    skId:d.skId||"",
    name:d.name||d.displayName||d.skId||"Staff",
    role:d.role||d.position||"",
    base:d.base||d.station||"",
    groupId:d.groupId||d.groupKey||d.group_key||"",
    latitude,longitude
  }
}

function initMap(){
  if(state.map||state.mode!=="desktop")return;
  if(!window.maplibregl){text("mapMissing","Map library failed to load.");return}
  state.map=new maplibregl.Map({
    container:"map",
    style:"https://tiles.openfreemap.org/styles/liberty",
    center:[-73.7781,40.6413],
    zoom:10.5
  });
  state.map.addControl(new maplibregl.NavigationControl(),"top-right");
  state.map.on("load",()=>{
    state.mapLoaded=true;
    const mm=$("mapMissing");if(mm)mm.style.display="none";
    scheduleMapResize();
    requestLiveLocations(true)
  });
  state.map.on("error",e=>{
    console.error("MapLibre error:",e);
    text("mapMissing","Map failed to load.")
  })
}

function scheduleMapResize(){
  if(!state.map)return;
  requestAnimationFrame(()=>{try{state.map.resize()}catch(_){ }})
}

function requestLiveLocations(fit=false){
  if(!gid())return;
  if(fit)state.mapFitPending=true;
  post("LIVE_LOCATIONS_REQUEST",{requestId:req("LOC"),groupId:gid()})
}

function syncLiveLocations(items=[],fit=false){
  const valid=(Array.isArray(items)?items:[]).map(normalizeLocation).filter(Boolean);
  valid.forEach(marker);
  if((fit||state.mapFitPending)&&state.map&&state.mapLoaded&&valid.length){
    try{
      if(valid.length===1){
        state.map.easeTo({center:[valid[0].longitude,valid[0].latitude],zoom:13,duration:350})
      }else{
        const b=new maplibregl.LngLatBounds();
        valid.forEach(l=>b.extend([l.longitude,l.latitude]));
        state.map.fitBounds(b,{padding:55,maxZoom:14,duration:350})
      }
      state.mapFitPending=false
    }catch(_){}
  }
}

function startMapRefresh(){
  if(state.mapRefreshTimer)return;
  state.mapRefreshTimer=setInterval(()=>requestLiveLocations(false),30000)
}
function stopMapRefresh(){
  if(state.mapRefreshTimer){clearInterval(state.mapRefreshTimer);state.mapRefreshTimer=null}
}

function cleanupRemoteAudio(){
  document.querySelectorAll("audio[data-grouptalk-audio='1']").forEach(el=>{try{el.pause()}catch(_){};try{el.remove()}catch(_){}})
}
async function disconnectVoiceRoom(){
  try{await setMic(false)}catch(_){}
  const room=state.room;
  state.room=null;state.voiceRoomName="";
  if(room){try{await room.disconnect()}catch(_){}}
  cleanupRemoteAudio();
}
function resumeVoicePlayback(){
  try{state.room?.startAudio?.().catch?.(()=>{})}catch(_){}
  document.querySelectorAll("audio[data-grouptalk-audio='1']").forEach(el=>{try{el.play?.().catch?.(()=>{})}catch(_){}})
}
async function connectLiveKit(mic=false){
  if(!state.activeGroup)throw new Error("Select a GroupTalk group first.");
  if(!window.LivekitClient)throw new Error("LiveKit client failed to load.");
  const roomName=state.activeGroup.livekitRoomName||state.activeGroup.livekit_room||state.activeGroup.channelName;
  if(state.room&&state.room.name===roomName){
    if(mic)await setMic(true);
    return state.room
  }
  if(state.voiceConnectPromise&&state.voiceConnectTarget===roomName){
    const room=await state.voiceConnectPromise;
    if(mic)await setMic(true);
    return room
  }
  state.voiceConnectTarget=roomName;
  state.voiceConnectPromise=(async()=>{
    const requestId=req("LK");
    const response=await new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>{state.lkCbs.delete(requestId);reject(new Error("LiveKit token timed out."))},12000);
      state.lkCbs.set(requestId,{resolve:v=>{clearTimeout(timer);resolve(v)},reject:e=>{clearTimeout(timer);reject(e)}});
      post("LIVEKIT_TOKEN_REQUEST",{requestId,groupId:gid()})
    });
    await disconnectVoiceRoom();
    state.voiceRoomName=roomName;
    const LK=window.LivekitClient;
    const room=new LK.Room({adaptiveStream:true,dynacast:true});
    room.on(LK.RoomEvent.TrackSubscribed,track=>{
      if(track.kind==="audio"){
        const el=track.attach();
        el.autoplay=true;el.playsInline=true;el.dataset.grouptalkAudio="1";
        document.body.appendChild(el);
        el.play?.().catch(()=>{})
      }
    });
    room.on(LK.RoomEvent.TrackUnsubscribed,track=>{try{track.detach().forEach(el=>el.remove())}catch(_){}});
    room.on(LK.RoomEvent.Disconnected,()=>{if(state.room===room){state.room=null;state.voiceRoomName=""}cleanupRemoteAudio()});
    await room.connect(response.livekitUrl,response.token);
    state.room=room;
    await setMic(false);
    sendPtt("LIVEKIT_JOIN",{groupId:gid(),room:roomName});
    return room
  })();
  try{
    const room=await state.voiceConnectPromise;
    if(mic)await setMic(true);
    return room
  }finally{
    state.voiceConnectPromise=null;
    state.voiceConnectTarget=""
  }
}
async function ensureVoiceConnected(){return connectLiveKit(false)}
async function connectVoice(mic=false){return connectLiveKit(mic)}

async function setMic(on){
  if(!state.room)return;
  const lp=state.room.localParticipant;
  if(lp&&typeof lp.setMicrophoneEnabled==="function")await lp.setMicrophoneEnabled(!!on)
}

function micLevelStart(){
  // visual PTT level without exposing raw audio; LiveKit owns the actual track.
  let n=0;
  clearInterval(state._pttMeter);
  state._pttMeter=setInterval(()=>{
    if(!state.speaking){clearInterval(state._pttMeter);state._pttMeter=null;setPttLevel(0);return}
    n=(n+17)%100;setPttLevel(35+Math.abs(50-Math.abs(n-50)))
  },120)
}
function micLevelStop(){if(state._pttMeter){clearInterval(state._pttMeter);state._pttMeter=null}setPttLevel(0)}

async function startPtt(){
  if(state.speaking||state.pttHeld)return;
  const canTalk=state.activeGroup?.capabilities?.canTalk!==false;
  if(!canTalk){toast("You do not have talk permission in this group.");return}
  state.pttHeld=true;state.speaking=true;
  document.body.classList.add("ptt-lock");
  $("mPtt")?.classList.add("pressed");$("dPtt")?.classList.add("pressed");
  try{
    await connectLiveKit(true);
    await setMic(true);
    micLevelStart();
    sendPtt(state.mode==="desktop"?"PTT_DOWN_DESKTOP":"PTT_DOWN",{groupId:gid()})
  }catch(e){
    state.speaking=false;state.pttHeld=false;
    $("mPtt")?.classList.remove("pressed");$("dPtt")?.classList.remove("pressed");
    document.body.classList.remove("ptt-lock");
    micLevelStop();
    toast(e.message||"Voice failed")
  }
}
async function stopPtt(){
  if(!state.speaking&&!state.pttHeld)return;
  state.speaking=false;state.pttHeld=false;
  document.body.classList.remove("ptt-lock");
  $("mPtt")?.classList.remove("pressed");$("dPtt")?.classList.remove("pressed");
  micLevelStop();
  try{await setMic(false)}catch(_){}
  sendPtt(state.mode==="desktop"?"PTT_UP_DESKTOP":"PTT_UP",{groupId:gid()})
}
function sendPtt(type,extra={}){
  post("PTT_EVENT",{requestId:req("PTT"),type,groupId:gid(),extra})
}

function startLocation(){
  if(!navigator.geolocation){toast("Location not supported");return}
  if(state.watch){
    navigator.geolocation.clearWatch(state.watch);state.watch=null;
    toast("Live location stopped");return
  }
  let last=0;
  state.watch=navigator.geolocation.watchPosition(pos=>{
    const now=Date.now();if(now-last<8000)return;last=now;
    const c=pos.coords;
    post("LOCATION_PING",{requestId:req("GPS"),groupId:gid(),latitude:c.latitude,longitude:c.longitude,accuracy:c.accuracy,heading:c.heading,speed:c.speed})
  },err=>toast(err.message||"Location denied"),{enableHighAccuracy:true,maximumAge:10000,timeout:15000});
  toast("Live location started")
}


function caseEmployees(){renderCaseTargets()}

function stopLightweightSync(){
  if(state.syncTimer){clearInterval(state.syncTimer);state.syncTimer=null}
}
function runLightweightSync(){
  if(!gid())return;
  post("PHONEBOOK_REQUEST",{requestId:req("PHONE"),groupId:gid()});
  post("TICKET_LIST_REQUEST",{requestId:req("TICK"),groupId:gid()});
  post("TICKET_CATEGORY_LIST_REQUEST",{requestId:req("CAT"),groupId:gid()});
  post("PRESENCE_REQUEST",{requestId:req("PRES"),groupId:gid()})
}
function startLightweightSync(){
  stopLightweightSync();
  state.syncTimer=setInterval(runLightweightSync,45000)
}

function setRealtimeStatus(status,label){
  text("realtimeState",status||"offline");$("mDot")?.classList.toggle("on",status==="online");
  text("mStatus",label||(status==="online"?"Connected":status==="connecting"?"Connecting…":status==="error"?"Connection error":"Offline"))
}
function clearRealtimeTimers(){
  if(state.realtimeHeartbeat){clearInterval(state.realtimeHeartbeat);state.realtimeHeartbeat=null}
  if(state.realtimePresenceRefresh){clearInterval(state.realtimePresenceRefresh);state.realtimePresenceRefresh=null}
  if(state.realtimeAuthRefresh){clearInterval(state.realtimeAuthRefresh);state.realtimeAuthRefresh=null}
}
function requestPresence(){if(gid())post("PRESENCE_REQUEST",{requestId:req("PRES"),groupId:gid()})}
function startPresenceTimers(){
  clearRealtimeTimers();
  state.realtimeHeartbeat=setInterval(()=>{const c=state.realtimeConfig;if(c?.sessionKey&&gid())post("PRESENCE_UPDATE",{requestId:req("HB"),groupId:gid(),sessionKey:c.sessionKey,status:"online",heartbeat:true})},20000);
  state.realtimePresenceRefresh=setInterval(requestPresence,30000)
}
function requestRealtimeAuthRefresh(){
  const id=req("RTA");return new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>{state.realtimeCbs.delete(id);reject(new Error("Supabase Realtime authorization refresh timed out."))},12000);
    state.realtimeCbs.set(id,{resolve:v=>{clearTimeout(timer);resolve(v)},reject:e=>{clearTimeout(timer);reject(e)}});
    post("REALTIME_AUTH_REFRESH_REQUEST",{requestId:id,groupId:gid()})
  })
}
function startRealtimeAuthRefresh(){
  if(state.realtimeAuthRefresh)clearInterval(state.realtimeAuthRefresh);
  state.realtimeAuthRefresh=setInterval(async()=>{
    if(!state.supabaseClient||!state.realtimeChannel||!gid())return;
    try{
      const auth=await requestRealtimeAuthRefresh();
      if(!auth?.realtimeToken)throw new Error("Realtime authorization token was not returned.");
      await state.supabaseClient.realtime.setAuth(auth.realtimeToken)
    }catch(error){
      console.error("Supabase Realtime authorization refresh failed:",error);
      setRealtimeStatus("error","Reconnecting…");
      disconnectSupabaseRealtime(true);
      connectSupabaseRealtime().catch(e=>{setRealtimeStatus("error","Connection error");console.error("Supabase Realtime reconnect failed:",e)})
    }
  },120000)
}
function disconnectSupabaseRealtime(markOffline=false){
  clearRealtimeTimers();const c=state.realtimeConfig;
  if(markOffline&&c?.sessionKey&&c?.groupId)post("PRESENCE_UPDATE",{requestId:req("OFF"),groupId:c.groupId,sessionKey:c.sessionKey,status:"offline",heartbeat:false});
  if(state.realtimeChannel&&state.supabaseClient){try{state.supabaseClient.removeChannel(state.realtimeChannel)}catch(e){}}
  state.realtimeChannel=null;state.realtimeConfig=null;state.realtimeConnecting=false;state.members.clear();members();setRealtimeStatus("offline","Offline")
}
function requestRealtimeConfig(){
  const id=req("RT");return new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>{state.realtimeCbs.delete(id);reject(new Error("Supabase Realtime configuration timed out."))},12000);
    state.realtimeCbs.set(id,{resolve:v=>{clearTimeout(timer);resolve(v)},reject:e=>{clearTimeout(timer);reject(e)}});
    post("REALTIME_CONFIG_REQUEST",{requestId:id,groupId:gid()})
  })
}
function ticketKey(t){return t?.ticketId||t?.id||t?.ticketNumber||""}
function upsertTicket(ticket,front=false){
  if(!ticket)return;const key=ticketKey(ticket);if(!key)return;const i=state.tickets.findIndex(t=>ticketKey(t)===key);
  if(i>=0)state.tickets[i]=ticket;else if(front)state.tickets.unshift(ticket);else state.tickets.push(ticket);tickets()
}
function applyPresenceMember(member){
  if(!member)return;const key=member.id||member.agentUserId||member.skId;if(!key)return;const status=String(member.state||member.status||"online").toLowerCase();
  if(status==="offline")state.members.delete(key);else state.members.set(key,{id:key,skId:member.skId||"",name:member.name||member.displayName||member.skId||"Staff",role:member.role||"",base:member.base||"",state:"online"});members()
}
function handleSupabaseRealtime(message){
  const event=message?.event||message?.type||"",data=message?.payload??message?.data??message??{};
  if(message?.groupId&&gid()&&message.groupId!==gid())return;
  if(event==="database-changed"){
    if(state.databaseRefreshTimer)clearTimeout(state.databaseRefreshTimer);
    state.databaseRefreshTimer=setTimeout(()=>{
      state.databaseRefreshTimer=null;
      const table=data.table||"";
      if(table==="grouptalk_groups"||table==="grouptalk_group_members"){post("GT_REFRESH",{reason:"supabase-database-change"});return}
      if(table==="grouptalk_locations"){requestLiveLocations(false);return}
      if(table==="grouptalk_realtime_sessions"){requestPresence();post("PHONEBOOK_REQUEST",{groupId:gid()});return}
      if(table==="grouptalk_phonebook"){post("PHONEBOOK_REQUEST",{groupId:gid()});return}
      if(table==="grouptalk_ticket_categories"){post("TICKET_CATEGORY_LIST_REQUEST",{groupId:gid()});return}
      if(table==="grouptalk_tickets"||table==="grouptalk_ticket_replies"){
        post("TICKET_LIST_REQUEST",{groupId:gid()});
        if(state.selectedTicket)openTicket(ticketKey(state.selectedTicket));
      }
    },180);
    return
  }
  if(event==="presence-updated"){applyPresenceMember(data.member||data);return}
  if(event==="ptt-started"){if(data.skId!==state.profile.skId){text("mActiveUser",`${data.name||data.skId} speaking`);text("dActiveSub",`${data.name||data.skId} speaking`);vu(true)}return}
  if(event==="ptt-ended"){if(data.skId!==state.profile.skId){text("mActiveUser",[state.profile.base,state.profile.role].filter(Boolean).join(" • "));text("dActiveSub",`${state.activeGroup?.base||state.profile.base||""} • ${state.activeGroup?.category||"Operations"}`);vu(false)}return}
  if(event==="emergency-alert"){text("emergencyText",`EMERGENCY\n${data.name||data.skId}\n${data.group||""}`);$("emergencyOverlay")?.classList.add("active");if(navigator.vibrate)navigator.vibrate([80,40,80,40,80]);setTimeout(()=>$("emergencyOverlay")?.classList.remove("active"),4000);return}
  if(event==="location-updated"){if(state.mode==="desktop")marker(data);return}
  if(event==="ticket-created"){upsertTicket(data.ticket,true);if(data.ticket?.requesterSkId!==state.profile.skId)toast("New helpdesk ticket");return}
  if(event==="ticket-updated"){upsertTicket(data.ticket,true);if(state.selectedTicket&&ticketKey(state.selectedTicket)===ticketKey(data.ticket))openTicket(ticketKey(data.ticket));toast("Ticket updated");return}
  if(event==="group-updated"||event==="membership-updated"){post("GT_REFRESH",{reason:event});return}
  if(event==="ticket-categories-updated"||event==="categories-updated"){post("TICKET_CATEGORY_LIST_REQUEST",{groupId:gid()});return}
}
async function connectSupabaseRealtime(){
  if(!state.activeGroup||state.realtimeConnecting)return;
  if(!window.supabase?.createClient){setRealtimeStatus("error","Supabase library failed");return}
  state.realtimeConnecting=true;setRealtimeStatus("connecting","Connecting…");
  try{
    if(state.realtimeChannel)disconnectSupabaseRealtime(true);
    const config=await requestRealtimeConfig();if(!config?.ok)throw new Error(config?.message||"Supabase Realtime is unavailable.");
    if(!state.supabaseClient||state.supabaseUrl!==config.supabaseUrl||state.supabaseKey!==config.publishableKey){
      state.supabaseClient=window.supabase.createClient(config.supabaseUrl,config.publishableKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},realtime:{params:{eventsPerSecond:20}}});state.supabaseUrl=config.supabaseUrl;state.supabaseKey=config.publishableKey
    }
    if(!config.realtimeToken)throw new Error("Supabase Realtime authorization token is missing.");
    await state.supabaseClient.realtime.setAuth(config.realtimeToken);
    state.realtimeConfig=config;
    const channel=state.supabaseClient.channel(config.topic,{config:{private:true,broadcast:{self:false}}}).on("broadcast",{event:config.broadcastEvent||"grouptalk"},({payload})=>handleSupabaseRealtime(payload));
    state.realtimeChannel=channel;
    channel.subscribe(status=>{
      if(state.realtimeChannel!==channel)return;
      if(status==="SUBSCRIBED"){setRealtimeStatus("online","Connected");requestPresence();startPresenceTimers();startRealtimeAuthRefresh()}
      else if(status==="CHANNEL_ERROR"||status==="TIMED_OUT")setRealtimeStatus("error","Connection error");
      else if(status==="CLOSED")setRealtimeStatus("offline","Offline")
    })
  }finally{state.realtimeConnecting=false}
}
function setPttLevel(value){
  const numeric=Math.max(0,Math.min(100,Number(value)||0));
  const display=numeric<2?0:Math.max(8,numeric);
  ["mPtt","dPtt"].forEach(id=>{
    const el=$(id);
    if(el)el.style.setProperty("--ptt-level",`${display}%`)
  })
}
function vu(on){
  ["mPtt","dPtt"].forEach(id=>$(id)?.classList.toggle("speaking",on));
  if(!on)setPttLevel(0)
}
function marker(d){
  if(!state.map||!state.mapLoaded)return;
  const l=normalizeLocation(d);if(!l)return;if(l.groupId&&gid()&&l.groupId!==gid())return;
  let m=state.markers.get(l.key);
  if(!m){const el=document.createElement("div");el.style.cssText="width:18px;height:18px;background:#022e64;border:3px solid #5FC7CF;border-radius:50%;box-shadow:0 0 0 3px rgba(2,46,100,.2)";m=new maplibregl.Marker({element:el}).setLngLat([l.longitude,l.latitude]).setPopup(new maplibregl.Popup({offset:16}).setText([l.name||l.skId||"Staff",l.role,l.base].filter(Boolean).join(" · "))).addTo(state.map);state.markers.set(l.key,m)}else{m.setLngLat([l.longitude,l.latitude])}
}

const DEFAULT_TICKET_CATEGORIES=["Bus Manifest","Guest Issue","Hotel Issue","Transfer Issue","Flight Disruption","Emergency Support","Documents","Schedule Change","Lost Item","Operations Question","Other"];
function slug(s){return String(s||"").trim().toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||"category"}
function normalizedCategories(raw){const arr=Array.isArray(raw)?raw:[];const src=arr.length?arr:DEFAULT_TICKET_CATEGORIES;return src.map((c,i)=>{if(typeof c==="string")return{categoryId:slug(c),title:c,active:true,sort:i+1};return{categoryId:c.categoryId||c.id||slug(c.title||c.name||c.label||("Category "+(i+1))),title:c.title||c.name||c.label||("Category "+(i+1)),active:c.active!==false,sort:Number(c.sort||c.order||i+1)}})}
function ensureCategories(){if(!state.ticketCategories||!state.ticketCategories.length)state.ticketCategories=normalizedCategories()}
function catTitle(c){return typeof c==="string"?c:(c.title||c.name||c.label||c.categoryId||"Category")}
function catId(c){return typeof c==="string"?slug(c):(c.categoryId||c.id||slug(catTitle(c)))}
function sortedCats(){ensureCategories();return state.ticketCategories.slice().sort((a,b)=>(Number(a.sort||0)-Number(b.sort||0))||catTitle(a).localeCompare(catTitle(b)))}
function fillCategorySelect(id){const el=$(id);if(!el)return;const prev=el.value;el.innerHTML="";sortedCats().filter(c=>c.active!==false).forEach(c=>{const o=document.createElement("option");o.value=catTitle(c);o.textContent=catTitle(c);el.appendChild(o)});if([...el.options].some(o=>o.value===prev))el.value=prev}
function renderTicketCategories(){fillCategorySelect("ticketCategory");fillCategorySelect("caseCategory");renderCategoryAdmin()}
function renderCategoryAdmin(){const list=$("categoryList");if(!list)return;list.innerHTML="";const cats=sortedCats();if(!cats.length){list.className="categoryList empty";list.textContent="No categories yet.";return}list.className="categoryList";cats.forEach(c=>{const row=document.createElement("div");row.className="categoryRow"+(c.active===false?" hiddenCat":"");const info=document.createElement("div");info.innerHTML=`<b>${catTitle(c)}</b><div class="categoryMeta">${c.active===false?"Hidden":"Active"} · sort ${c.sort||""}</div>`;const edit=document.createElement("button");edit.className="mini";edit.type="button";edit.textContent="Edit";edit.onclick=()=>editCategory(catId(c));row.appendChild(info);row.appendChild(edit);list.appendChild(row)})}
function resetCategoryForm(){if($("catId"))$("catId").value="";if($("catTitle"))$("catTitle").value="";if($("catSort"))$("catSort").value=String((state.ticketCategories||[]).length+1);if($("catActive"))$("catActive").value="true"}
function editCategory(id){const c=sortedCats().find(x=>catId(x)===id);if(!c)return;if($("catId"))$("catId").value=catId(c);if($("catTitle"))$("catTitle").value=catTitle(c);if($("catSort"))$("catSort").value=c.sort||"";if($("catActive"))$("catActive").value=String(c.active!==false)}
function saveCategory(){const title=($("catTitle")?.value||"").trim();if(!title){toast("Enter category name");return}const id=$("catId")?.value||slug(title);const category={categoryId:id,title,active:($("catActive")?.value||"true")==="true",sort:Number($("catSort")?.value||state.ticketCategories.length+1)};const i=state.ticketCategories.findIndex(c=>catId(c)===id);if(i>=0)state.ticketCategories[i]=category;else state.ticketCategories.push(category);renderTicketCategories();post("TICKET_CATEGORY_SAVE",{requestId:req("CAT"),groupId:gid(),category});toast("Category saved")}
function deleteCategory(){const id=$("catId")?.value;if(!id){toast("Select a category first");return}const c=state.ticketCategories.find(x=>catId(x)===id);if(!c)return;if(!confirm(`Delete category "${catTitle(c)}"?`))return;state.ticketCategories=state.ticketCategories.filter(x=>catId(x)!==id);resetCategoryForm();renderTicketCategories();post("TICKET_CATEGORY_DELETE",{requestId:req("CAT"),groupId:gid(),categoryId:id});toast("Category deleted")}
function toggleCaseTarget(skId){if(!skId){toast("Employee has no SK-ID");return}state.caseTargets.has(skId)?state.caseTargets.delete(skId):state.caseTargets.add(skId);desktopPhonebook();renderCaseTargets()}
function clearCaseTargets(){state.caseTargets.clear();desktopPhonebook();renderCaseTargets()}
function renderCaseTargets(){const box=$("caseEmployeeList");if(!box)return;text("caseTargetCount",`${state.caseTargets.size} selected`);box.innerHTML="";if(!state.phonebook.length){box.className="caseEmployeeList empty";box.textContent="Phonebook not loaded.";return}box.className="caseEmployeeList";state.phonebook.forEach(c=>{const id=c.skId||"";const row=document.createElement("label");row.className="caseEmployee"+(state.caseTargets.has(id)?" selected":"");const cb=document.createElement("input");cb.type="checkbox";cb.checked=state.caseTargets.has(id);cb.onchange=()=>toggleCaseTarget(id);const info=document.createElement("div");info.innerHTML=`<b>${c.name||"Unnamed"}</b><div class="small">${[c.skId,c.role,c.base].filter(Boolean).join(" • ")}</div>`;row.appendChild(cb);row.appendChild(info);box.appendChild(row)})}
function startCase(){const targetSkIds=[...state.caseTargets];if(!targetSkIds.length){toast("Select one or more employees");return}const employees=state.phonebook.filter(c=>targetSkIds.includes(c.skId)).map(c=>({skId:c.skId,name:c.name,role:c.role,base:c.base,phone:c.phone}));const subject=($("caseSubject")?.value||"").trim();const message=($("caseMessage")?.value||"").trim();if(!subject){toast("Enter case subject");return}post("TICKET_CREATE",{requestId:req("CASE"),caseMode:true,createdFrom:"DESKTOP_CASE",groupId:gid(),targetSkIds,employees,category:$("caseCategory")?.value||"",priority:$("casePriority")?.value||"Normal",routeRef:$("caseRoute")?.value||"",subject,message});toast("Case started")}
function openTicket(ticketId){post("TICKET_LIST_REQUEST",{ticketId})}
function detail(t,msgs=[]){state.selectedTicket=t;text("detailStatus",t.status||"—");$("ticketDetail").innerHTML=`<b>${t.subject||t.title||t.ticketId}</b>\n${t.category||""} · ${t.priority||""} · ${t.status||""}\nRequester: ${t.requesterSkId||""}\nRoute/ref: ${t.routeRef||""}\n\n${t.message||""}\n\n--- Messages ---\n${msgs.map(m=>`[${m.senderRole||""}] ${m.senderSkId||""}: ${m.body||""}`).join("\n\n")}`}
function createTicket(){post("TICKET_CREATE",{groupId:gid(),category:$("ticketCategory").value,priority:$("ticketPriority").value,subject:$("ticketSubject").value,message:$("ticketMessage").value,routeRef:$("ticketRoute").value})}
function reply(status){if(!state.selectedTicket){toast("Select ticket");return}post("TICKET_REPLY",{ticketId:state.selectedTicket.ticketId,body:$("replyBody").value||(status==="RESOLVED"?"Resolved.":""),manifestText:$("manifestText").value,delivery:$("replyDelivery").value,emailTo:$("replyEmail").value,status})}
addEventListener("message",e=>{
  const msg=e.data||{},p=msg.payload||{};if(msg.source!==PARENT)return;
  if(msg.type==="GT_BOOTSTRAP"){
    state.profile=p.profile||{};state.groups=p.groups||[];state.config=p.config||{};state.canManage=!!p.canManage||!!state.profile.canManage;
    state.phonebook=p.phonebook||[];state.tickets=p.tickets||[];state.ticketCategories=normalizedCategories(p.ticketCategories||p.categories||state.config.ticketCategories||state.ticketCategories);
    state.activeGroup=state.groups.find(g=>(g.groupId||g.id)===(p.activeGroupId||p.active_group_id))||state.groups[0]||null;decide();render();
    if(state.activeGroup){
      startLightweightSync();
      connectSupabaseRealtime().catch(e=>{setRealtimeStatus("error","Connection error");console.error("Supabase Realtime connect failed:",e)});
      ensureVoiceConnected().catch(e=>console.warn("Voice preconnect failed:",e));
      post("PHONEBOOK_REQUEST",{groupId:gid()});
      post("TICKET_LIST_REQUEST",{groupId:gid()});
      requestLiveLocations(true)
    }
    else{stopLightweightSync();setRealtimeStatus("offline","No group selected")}
    post("TICKET_CATEGORY_LIST_REQUEST",{groupId:gid()});return
  }
  if(msg.type==="LIVEKIT_TOKEN_RESPONSE"){
    const cb=state.lkCbs.get(p.requestId);
    if(cb){state.lkCbs.delete(p.requestId);p.ok!==false?cb.resolve(p):cb.reject(new Error(p.message||"LiveKit token failed"))}
    return
  }
  if(msg.type==="PTT_EVENT_RESULT"){return}
  if(msg.type==="REALTIME_CONFIG_RESPONSE"){
    const cb=state.realtimeCbs.get(p.requestId);if(cb){state.realtimeCbs.delete(p.requestId);p.ok!==false?cb.resolve(p):cb.reject(new Error(p.message||"Supabase Realtime configuration failed"))}return
  }
  if(msg.type==="REALTIME_AUTH_REFRESH_RESPONSE"){
    const cb=state.realtimeCbs.get(p.requestId);if(cb){state.realtimeCbs.delete(p.requestId);p.ok!==false?cb.resolve(p):cb.reject(new Error(p.message||"Supabase Realtime authorization refresh failed"))}return
  }
  if(msg.type==="PRESENCE_RESPONSE"){state.members.clear();(p.members||[]).forEach(applyPresenceMember);members();return}
  if(msg.type==="LOCATION_SHARING_STATE"){
    state.watch=p.active===true;
    if(p.error)toast(p.message||"Location unavailable");
    else if(p.active)toast("Live location started");
    return
  }
  if(msg.type==="GT_DIAGNOSTICS"){
    if(p.ok===false)console.warn("GroupTalk diagnostics:",p);
    else console.info("GroupTalk diagnostics:",p);
    return
  }
  if(msg.type==="PHONEBOOK_RESPONSE"){state.phonebook=p.contacts||[];phonebook();return}
  if(msg.type==="TICKET_LIST_RESPONSE"){if(p.ticket)detail(p.ticket,p.messages||[]);if(p.tickets){state.tickets=p.tickets;tickets()}return}
  if(msg.type==="TICKET_CREATE_RESPONSE"){if(p.ticket){upsertTicket(p.ticket,true);toast("Ticket created");close("ticketSheet")}return}
  if(msg.type==="TICKET_REPLY_RESPONSE"){if(p.ticket){upsertTicket(p.ticket,true);detail(p.ticket,p.messages||[])}toast("Reply sent");return}
  if(msg.type==="LOCATION_PING_RESULT"){if(p.location)marker(p.location);requestLiveLocations(false);return}
  if(msg.type==="LIVE_LOCATIONS_RESPONSE"){syncLiveLocations(p.locations||p.items||[],state.mapFitPending);return}
  if(msg.type==="TICKET_CATEGORY_LIST_RESPONSE"){state.ticketCategories=normalizedCategories(p.categories||p.ticketCategories);renderTicketCategories();return}
  if(msg.type==="TICKET_CATEGORY_SAVE_RESPONSE"){if(p.categories||p.ticketCategories)state.ticketCategories=normalizedCategories(p.categories||p.ticketCategories);renderTicketCategories();toast(p.message||"Category saved");return}
  if(msg.type==="TICKET_CATEGORY_DELETE_RESPONSE"){if(p.categories||p.ticketCategories)state.ticketCategories=normalizedCategories(p.categories||p.ticketCategories);renderTicketCategories();toast(p.message||"Category deleted");return}
  if(msg.type==="GT_ERROR"){toast(p.message||"GroupTalk error");return}
});

$("btnPhone").onclick=()=>{open("phoneSheet");post("PHONEBOOK_REQUEST",{groupId:gid()})};
$("btnGroups").onclick=()=>open("groupSheet");
$("btnScanGroups")?.addEventListener("click",()=>{
  post("GT_REFRESH",{reason:"scan-groups"});
  toast("Scanning groups…");
  setTimeout(()=>open("groupSheet"),250)
});
$("btnSettings")?.addEventListener("click",()=>open("mobileSettingsSheet"));
$("btnMobileMenu")?.addEventListener("click",()=>open("mobileSettingsSheet"));
$("btnMobileUsers")?.addEventListener("click",()=>{open("mobileOnlineSheet");members()});
$("btnMobileMessages")?.addEventListener("click",()=>{open("myTicketsSheet");post("TICKET_LIST_REQUEST",{mineOnly:true})});
$("btnSettingsLocation")?.addEventListener("click",()=>{close("mobileSettingsSheet");startLocation()});
$("btnSettingsHelpdesk")?.addEventListener("click",()=>{close("mobileSettingsSheet");open("ticketSheet")});
$("btnSettingsTickets")?.addEventListener("click",()=>{close("mobileSettingsSheet");open("myTicketsSheet");post("TICKET_LIST_REQUEST",{mineOnly:true})});
$("btnGoOffline")?.addEventListener("click",()=>{
  if(state.watch){try{navigator.geolocation.clearWatch(state.watch)}catch(_){ }state.watch=null}
  disconnectSupabaseRealtime(true);
  disconnectVoiceRoom().catch(()=>{});
  state.members.clear();members();setRealtimeStatus("offline","Offline");
  sendPtt("GO_OFFLINE",{groupId:gid()});
  toast("Offline")
});
$("btnCreateTicket").onclick=createTicket;$("btnReply").onclick=()=>reply();$("btnResolve").onclick=()=>reply("RESOLVED");$("btnSaveGroup").onclick=()=>post("ADMIN_SAVE_GROUP",{title:$("adminGroupTitle").value,base:$("adminGroupBase").value,allowAllStaff:true,canStaffTalk:true,canStaffCreateTickets:true});if($("btnDesktopPhonebook"))$("btnDesktopPhonebook").onclick=()=>{open("phoneSheet");post("PHONEBOOK_REQUEST",{groupId:gid()})};if($("btnNewCategory"))$("btnNewCategory").onclick=resetCategoryForm;if($("btnSaveCategory"))$("btnSaveCategory").onclick=saveCategory;if($("btnDeleteCategory"))$("btnDeleteCategory").onclick=deleteCategory;if($("btnStartCase"))$("btnStartCase").onclick=startCase;if($("btnClearCaseTargets"))$("btnClearCaseTargets").onclick=clearCaseTargets;
["mPtt","dPtt"].forEach(id=>{
  const b=$(id);
  if(!b)return;

  const down=e=>{
    e.preventDefault();
    e.stopPropagation();
    window.getSelection?.()?.removeAllRanges?.();
    startPtt()
  };
  const up=e=>{
    e?.preventDefault?.();
    e?.stopPropagation?.();
    stopPtt()
  };

  ["contextmenu","selectstart","dragstart"].forEach(ev=>b.addEventListener(ev,e=>e.preventDefault()));
  b.setAttribute("draggable","false");

  b.addEventListener("touchstart",down,{passive:false});
  b.addEventListener("touchend",up,{passive:false});
  b.addEventListener("touchcancel",up,{passive:false});

  if(window.PointerEvent){
    b.addEventListener("pointerdown",e=>{
      if(e.pointerType==="touch")return;
      try{b.setPointerCapture?.(e.pointerId)}catch(_){}
      down(e)
    });
    b.addEventListener("pointerup",e=>{if(e.pointerType!=="touch")up(e)});
    b.addEventListener("pointercancel",e=>{if(e.pointerType!=="touch")up(e)});
    b.addEventListener("lostpointercapture",()=>{if(state.pttHeld)stopPtt()})
  }else{
    b.addEventListener("mousedown",down);
    addEventListener("mouseup",up)
  }
});

document.addEventListener("pointerdown",resumeVoicePlayback,{passive:true});
document.addEventListener("touchstart",resumeVoicePlayback,{passive:true});
document.addEventListener("selectionchange",()=>{
  if(state.pttHeld)window.getSelection?.()?.removeAllRanges?.()
});

let emergencyTimer=null;{
  const emergency=$("btnEmergency");
  const beginEmergency=e=>{
    e?.preventDefault?.();
    clearTimeout(emergencyTimer);
    emergencyTimer=setTimeout(()=>{
      sendPtt("EMERGENCY",{priority:"critical"});
      $("emergencyOverlay")?.classList.add("active");
      if(navigator.vibrate)navigator.vibrate([80,40,80])
    },3000)
  };
  const endEmergency=()=>{
    clearTimeout(emergencyTimer);
    setTimeout(()=>$("emergencyOverlay")?.classList.remove("active"),1800)
  };
  if(emergency){
    ["contextmenu","selectstart","dragstart"].forEach(ev=>emergency.addEventListener(ev,e=>e.preventDefault()));
    if(window.PointerEvent){
      emergency.addEventListener("pointerdown",beginEmergency);
      emergency.addEventListener("pointerup",endEmergency);
      emergency.addEventListener("pointercancel",endEmergency)
    }else{
      emergency.addEventListener("touchstart",beginEmergency,{passive:false});
      emergency.addEventListener("mousedown",beginEmergency);
      ["touchend","mouseup"].forEach(ev=>addEventListener(ev,endEmergency))
    }
  }
}
addEventListener("blur",()=>{if(state.pttHeld||state.speaking)stopPtt()});
document.addEventListener("visibilitychange",()=>{if(document.hidden&&(state.pttHeld||state.speaking))stopPtt()});
addEventListener("pagehide",()=>{
  stopLightweightSync();
  if(state.watch){try{navigator.geolocation.clearWatch(state.watch)}catch(_){ }}
  disconnectSupabaseRealtime(true);
  disconnectVoiceRoom().catch(()=>{});
});
function init(){ensureCategories();renderTicketCategories();decide();setRealtimeStatus("offline","Offline");syncAppViewport();post("GT_READY",{wantsInit:true,realtimeProvider:"SUPABASE_REALTIME",voiceProvider:"LIVEKIT",audioAlwaysOn:true})}init();
</script>
</body>
</html>
```
