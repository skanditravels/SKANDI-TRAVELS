# SKANDI ALEXANDRA — V12.7 SITEWIDE ALEXANDRA GLOBAL LAUNCHER

## INFO / LOG
- Wix site: SKANDI TRAVELS, Wix Studio.
- System: customer-facing SKANDI only. Exclude staff/ALTEA/RIA INTRA pages.
- Wix site-master HTML Component: `#skandiAlexandraLauncherEmbed` (NEW, add in Wix Studio site elements; pin to page bottom left).
- Runtime source: `WIX_HTML/Alexandra Launcher.html` (complete, identical to HTML source below).
- Required site Velo host: current `src/pages/masterPage.js` invoking `src/public/alexandraGlobalBridge.js` (binding NOT installed by this package; live master page must be compared and updated without discarding newer changes).
- Purpose: Site-wide bottom-left launcher, separate small component so closed panel cannot block page interactions.
- Message source: `SKANDI_SUPPORT_CHAT` for panel; `SKANDI_ALEXANDRA_LAUNCHER` for launcher; parent replies source `SKANDI_WIX_PARENT`.
- Canonical backend: `backend/SKANDI_CORE/customerSupport.web.js` → `alexandraWixAi.js` + `alexandraKnowledge.js` for AI answers; customerSupport.js for authorized case creation; no duplicate database or model.
- Canonical support cases: existing customer_support_cases / customer_support_messages.
- Persistence: Wix frontend `session` browser-tab scope via public bridge; signed session TTL 30 min, messages scoped to same visitor identity. Reset on member change or token expiry. No persistence across devices or expired sessions.
- Security: never pass customer bookings/private notes into AI context; members' support cases remain under auth/ownership checks.
- Staff routes, payment credentials and internal content must never be sent to AI.
- Verification: HTML/CSS and JS syntax only; Wix Studio sitewide master Velo and live provider integration REQUIRES LIVE TEST.

## CHANGE LOG
- 2026-10-21 V12.7: new public sitewide global component prepared; dark-navy SKANDI branding, fixed bottom-left pin location by Wix Studio setup, minimization, browser-tab conversation state, canonical Customer Service case creation, WhatsApp +1 711-216-0382 and call +1 951-620-7875. WhatsApp number not externally verified.

## COMPLETE HTML SOURCE
```html
<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>Alexandra · SKANDI</title><style>*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;background:transparent;overflow:hidden;font-family:Arial,sans-serif}button{display:grid;place-items:center;width:64px;height:64px;padding:0;border:2px solid #9de0e5;border-radius:50%;background:linear-gradient(135deg,#074379,#022e64);color:white;box-shadow:0 8px 24px rgba(2,46,100,.3);cursor:pointer}button:focus-visible{outline:3px solid #5fc7cf;outline-offset:-4px}.mark{font:bold 27px Georgia,serif;line-height:1;color:#fff}.label{display:block;margin-top:-12px;color:#9de0e5;font-size:7px;font-weight:bold;letter-spacing:.09em;text-transform:uppercase}</style></head><body><button id="launch" type="button" aria-label="Open Alexandra SKANDI customer service chat"><span class="mark">A</span><span class="label">Alexandra</span></button><script>(()=>{'use strict';const source='SKANDI_ALEXANDRA_LAUNCHER';const send=type=>window.parent.postMessage({source,type},'*');document.getElementById('launch').addEventListener('click',()=>send('SUPPORT_LAUNCHER_CLICK'));window.addEventListener('message',e=>{if(e.source!==window.parent)return;if(e.data?.source==='SKANDI_WIX_PARENT'&&e.data?.type==='SUPPORT_LAUNCHER_ERROR')document.getElementById('launch').title=e.data?.payload?.message||'Alexandra unavailable'});send('SUPPORT_LAUNCHER_READY');setTimeout(()=>send('SUPPORT_LAUNCHER_READY'),900);})();</script></body></html>
```
