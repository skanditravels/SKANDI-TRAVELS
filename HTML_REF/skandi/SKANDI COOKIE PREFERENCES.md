# SKANDI COOKIE PREFERENCES

STATUS: V12 SYNC PREPARED — STATICALLY VERIFIED / REQUIRES LIVE TEST
SLUG: `/about/legal/cookie-preferences`
WIX PAGE: Cookie Preferences
AREA: SKANDI
LIVE HTML: YES
ELEMENT: `#cookiePreferencesEmbed`
MESSAGE SOURCE: `SKANDI_COOKIE_PREFERENCES`
WIX PARENT: `/src/pages/masterPage.js`
LAST SYNCED: 2026-10-17

## INFO
- New customer-facing privacy preference page using the existing V12 global customer header/footer.
- The page is `CONTENT_AUTO`; the HTML sends measured height through the existing parent resize contract.
- Current visitor consent is read from Wix Consent Policy Manager through `masterPage.js`.
- Saved choices are written back to the same Wix visitor consent state. No duplicate Supabase consent table is introduced.
- Essential is locked on. Functional, Analytics, Marketing and Third-party data sharing are independently controlled.
- Global Privacy Control locks Third-party data sharing off when the browser sends the signal.
- Cookie Policy and Privacy Policy continue to use the existing Policy Control routes.

## CHANGE LOG
- 2026-10-17 — V12 initial implementation: dedicated SKANDI privacy preference center added.


- 2026-10-28 UTC — Updated `skandi-embeds/cookie-preferences/skandi-cookie-preferences.receiver.html` to follow the current shared receiver pattern with page-specific startup, progress and failure messages for **Cookie Preferences** (`/about/legal/cookie-preferences`). The expected route matches `src/public/siteMap.js`; master-page handshake, staff authorization, manifest/SHA-256 checks and nested-iframe rejection remain intact.

## COMPLETE INTENDED LIVE HTML SOURCE

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
<meta name="theme-color" content="#ffffff" />
<title>Cookie Preferences | SKANDI</title>
<style>
:root{--navy:#022e64;--aqua:#5fc7cf;--ivory:#fbfaf6;--surface:#f6faff;--line:#d7e6ff;--ink:#1a1a1a;--muted:#66758a;--success:#216c59;--danger:#99463f}
*{box-sizing:border-box}
html,body{margin:0;width:100%;min-width:320px;background:#fff;color:var(--ink);font-family:"Montserrat","Avenir Next",Arial,system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased}
button{font:inherit;cursor:pointer}
button:focus-visible,input:focus-visible{outline:3px solid rgba(95,199,207,.55);outline-offset:3px}
main{width:min(100%,1160px);margin:0 auto;padding:64px clamp(20px,5vw,64px) 76px}
.eyebrow{margin-bottom:12px;color:#397f89;font-size:10px;font-weight:800;letter-spacing:.17em;text-transform:uppercase}
h1{margin:0;max-width:800px;color:var(--navy);font-size:clamp(34px,5vw,58px);line-height:1.02;letter-spacing:-.045em;font-weight:700}
.lead{max-width:820px;margin:18px 0 0;color:var(--muted);font-size:14px;line-height:1.75}
.summary{margin-top:28px;padding:18px 20px;border-left:3px solid var(--aqua);background:var(--surface);color:#44566a;font-size:12px;line-height:1.65}
.summary strong{color:var(--navy)}
.grid{display:grid;gap:12px;margin-top:34px}
.row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:26px;align-items:center;padding:22px 24px;border:1px solid var(--line);border-radius:14px;background:#fff;box-shadow:0 8px 30px rgba(2,46,100,.045)}
.row h2{margin:0;color:var(--navy);font-size:15px;line-height:1.25;font-weight:700}
.row p{margin:7px 0 0;max-width:760px;color:var(--muted);font-size:11px;line-height:1.65}
.state{margin-top:8px;color:#397f89;font-size:9px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
.toggle{position:relative;width:54px;height:30px;flex:0 0 auto}
.toggle input{position:absolute;opacity:0;width:1px;height:1px}
.track{position:absolute;inset:0;border:1px solid rgba(2,46,100,.22);border-radius:999px;background:#e8edf3;transition:.2s}
.track::after{content:"";position:absolute;top:3px;left:3px;width:22px;height:22px;border-radius:50%;background:#fff;box-shadow:0 2px 7px rgba(0,0,0,.18);transition:.2s}
.toggle input:checked + .track{background:var(--navy);border-color:var(--navy)}
.toggle input:checked + .track::after{transform:translateX(24px)}
.toggle input:disabled + .track{opacity:.6;cursor:not-allowed}
.actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:30px;padding-top:26px;border-top:1px solid var(--line)}
.btn{min-height:46px;padding:0 19px;border-radius:10px;font-size:10px;font-weight:800;letter-spacing:.06em;text-transform:uppercase}
.primary{border:1px solid var(--navy);background:var(--navy);color:#fff}
.secondary{border:1px solid rgba(2,46,100,.25);background:#fff;color:var(--navy)}
.tertiary{border:1px solid rgba(95,199,207,.7);background:#eefafb;color:var(--navy)}
.status{min-height:20px;margin-top:14px;font-size:11px;font-weight:700;color:var(--success)}
.links{display:flex;flex-wrap:wrap;gap:18px;margin-top:28px}
.links button{padding:0;border:0;background:none;color:var(--navy);font-size:10px;font-weight:700;text-decoration:underline;text-underline-offset:3px}
.note{margin-top:36px;color:#75808d;font-size:10px;line-height:1.65}
@media(max-width:720px){main{padding:42px 18px 58px}.row{grid-template-columns:1fr auto;padding:19px 18px;gap:16px}.actions{display:grid}.btn{width:100%;min-height:48px}}
@media(max-width:767px){button{font-size:16px}.btn{font-size:10px}}
@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
</style>
</head>
<body>
<main>
  <div class="eyebrow">SKANDI · Privacy</div>
  <h1>Cookie preferences</h1>
  <p class="lead">Choose which optional technologies SKANDI may use in this browser. Essential technologies are required for security, authentication, checkout and core site operation and cannot be switched off.</p>
  <div class="summary" id="summary" aria-live="polite"><strong>Loading your current preferences…</strong></div>

  <section class="grid" aria-label="Privacy preference categories">
    <article class="row">
      <div><h2>Essential</h2><p>Required for security, fraud prevention, authentication, session continuity, checkout and services you explicitly request.</p><div class="state">Always on</div></div>
      <label class="toggle" aria-label="Essential cookies always enabled"><input type="checkbox" checked disabled /><span class="track"></span></label>
    </article>
    <article class="row">
      <div><h2>Functional</h2><p>Allows optional functionality and remembered preferences that improve how the site behaves for you.</p></div>
      <label class="toggle" aria-label="Allow functional cookies"><input id="functional" type="checkbox" /><span class="track"></span></label>
    </article>
    <article class="row">
      <div><h2>Analytics</h2><p>Helps SKANDI understand performance and how visitors use the site so we can improve journeys, content and reliability.</p></div>
      <label class="toggle" aria-label="Allow analytics cookies"><input id="analytics" type="checkbox" /><span class="track"></span></label>
    </article>
    <article class="row">
      <div><h2>Marketing</h2><p>Allows advertising and campaign technologies, including approved pixels and attribution tools, where configured.</p></div>
      <label class="toggle" aria-label="Allow marketing cookies"><input id="advertising" type="checkbox" /><span class="track"></span></label>
    </article>
    <article class="row">
      <div><h2>Third-party data sharing</h2><p>Controls whether personal data may be transferred to third parties for optional services. Browser privacy signals are respected.</p><div class="state" id="gpcState"></div></div>
      <label class="toggle" aria-label="Allow third-party data sharing"><input id="dataToThirdParty" type="checkbox" /><span class="track"></span></label>
    </article>
  </section>

  <div class="actions">
    <button id="save" class="btn primary" type="button">Save preferences</button>
    <button id="reject" class="btn secondary" type="button">Reject optional</button>
    <button id="accept" class="btn secondary" type="button">Accept all</button>
  </div>
  <div id="status" class="status" aria-live="polite"></div>
  <div class="links">
    <button type="button" data-path="/about/legal/policies?slug=skandi-travels-cookies-policy">Cookie Policy</button>
    <button type="button" data-path="/about/legal/policies?slug=privacy-policy">Privacy Policy</button>
    <button type="button" data-path="/about/legal">Legal</button>
  </div>
  <p class="note">Changing your preferences affects future use of optional technologies in this browser. Wix applies a changed consent policy fully after the next page load. Technologies that are strictly necessary remain available. A preference change does not itself delete data already processed before the change; privacy rights and deletion requests are handled under the Privacy Policy.</p>
</main>
<script>
"use strict";
(() => {
  const SOURCE = "SKANDI_COOKIE_PREFERENCES";
  const PARENT = "SKANDI_WIX_PARENT";
  const gpc = navigator.globalPrivacyControl === true;
  const ids = ["functional","analytics","advertising","dataToThirdParty"];
  const byId = id => document.getElementById(id);
  let busy = false;

  function post(type, payload = {}) { window.parent.postMessage({ source:SOURCE, type, payload, timestamp:new Date().toISOString() }, "*"); }
  function measure() { post("SKANDI_CONTENT_RESIZE", { height:Math.ceil(document.documentElement.scrollHeight + 8) }); }
  function setBusy(value, text = "") {
    busy = value;
    ["save","reject","accept",...ids].forEach(id => { const el=byId(id); if (el) el.disabled = value || (id === "dataToThirdParty" && gpc); });
    byId("status").textContent = text;
  }
  function policyFromUi() {
    return {
      essential:true,
      functional:byId("functional").checked,
      analytics:byId("analytics").checked,
      advertising:byId("advertising").checked,
      dataToThirdParty:gpc ? false : byId("dataToThirdParty").checked
    };
  }
  function renderState(data = {}) {
    const p = data.policy || {};
    byId("functional").checked = p.functional === true;
    byId("analytics").checked = p.analytics === true;
    byId("advertising").checked = p.advertising === true;
    byId("dataToThirdParty").checked = gpc ? false : p.dataToThirdParty === true;
    byId("dataToThirdParty").disabled = gpc;
    byId("gpcState").textContent = gpc ? "Global Privacy Control detected — sharing locked off" : "Controlled separately";
    const created = data.createdDate ? new Date(data.createdDate) : null;
    const when = created && !Number.isNaN(created.getTime()) ? created.toLocaleString() : "";
    byId("summary").innerHTML = data.defaultPolicy === true
      ? "<strong>No explicit choice is stored yet.</strong> Review the categories below and save your preferences."
      : `<strong>Your current preference is active.</strong>${when ? ` Last changed ${when}.` : ""}`;
    setBusy(false, "");
    measure();
  }
  function submit(type, policy) {
    if (busy) return;
    setBusy(true, "Saving your privacy preferences…");
    post(type, { policy, gpc });
  }

  byId("save").addEventListener("click", () => submit("SKANDI_CONSENT_SAVE", policyFromUi()));
  byId("reject").addEventListener("click", () => submit("SKANDI_CONSENT_REJECT_OPTIONAL", null));
  byId("accept").addEventListener("click", () => submit("SKANDI_CONSENT_ACCEPT_ALL", null));
  document.addEventListener("click", event => { const path=event.target.closest("[data-path]")?.getAttribute("data-path"); if(path) post("SKANDI_CONSENT_NAVIGATE",{path}); });

  window.addEventListener("message", event => {
    let msg=event.data;
    if(typeof msg === "string"){try{msg=JSON.parse(msg)}catch(_){return}}
    if(!msg || msg.source !== PARENT) return;
    if(msg.type === "SKANDI_CONSENT_STATE") renderState(msg.payload || {});
    if(msg.type === "SKANDI_CONSENT_SAVED") {
      if(msg.payload?.ok){ byId("status").textContent="Preferences saved. They apply fully after the next page load."; post("SKANDI_CONSENT_REQUEST",{gpc}); }
      else setBusy(false,msg.payload?.message || "We could not save your preferences. Please try again.");
    }
  });

  if(gpc){byId("gpcState").textContent="Global Privacy Control detected — sharing locked off";byId("dataToThirdParty").disabled=true}
  new ResizeObserver(measure).observe(document.body);
  window.addEventListener("load",measure);
  post("MASTER_CONFIG_REQUEST",{context:"cookie-preferences"});
  post("SKANDI_CONSENT_REQUEST",{gpc});
  setTimeout(()=>post("SKANDI_CONSENT_REQUEST",{gpc}),300);
})();
</script>
</body>
</html>
```
