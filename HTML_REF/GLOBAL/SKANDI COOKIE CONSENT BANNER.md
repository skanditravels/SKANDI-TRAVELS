# GLOBAL SKANDI COOKIE CONSENT BANNER

STATUS: V12 SYNC PREPARED — STATICALLY VERIFIED / REQUIRES LIVE TEST
SLUG: GLOBAL SECTION
WIX PAGE: `masterPage.js`
AREA: SKANDI
LIVE HTML: YES
ELEMENT: `#skandiCookieBannerEmbed`
MESSAGE SOURCE: `SKANDI_COOKIE_BANNER`
LAST SYNCED: 2026-10-17

## INFO
- New SKANDI-branded first-layer cookie consent UI.
- The HTML embed is presentation only. Visitor consent remains owned by Wix Consent Policy and the installed Wix/Usercentrics privacy layer through `masterPage.js`; the iframe never becomes the consent authority.
- Essential consent is always `true` and cannot be declined.
- Accept All, Reject Optional and Manage Preferences are equally available from the first layer.
- Global Privacy Control is detected in the browser; when present, third-party data sharing remains disabled.
- The banner requests and saves visitor policy only through the parent `postMessage` contract.
- The banner resizes through the existing `SKANDI_EMBED_RESIZE` master contract and becomes a compact persistent Privacy Choices trigger after an explicit preference exists.
- No cookies, consent ledger, Supabase table or parallel consent authority is created inside this HTML.

## CHANGE LOG
- 2026-10-30 — Removed the Wix logo URL and marked this unassigned logo position [LEAVE_PLACEHOLDER].
- 2026-10-17 — V12 initial implementation: branded first-layer consent banner connected to Wix visitor consent policy state.

## COMPLETE INTENDED LIVE HTML SOURCE

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
<meta name="theme-color" content="#022e64" />
<title>SKANDI Privacy Choices</title>
<style>
:root{
  --navy:#022e64;
  --navy-deep:#03111f;
  --aqua:#5fc7cf;
  --ivory:#fbfaf6;
  --porcelain:#f5f1ea;
  --line:#d7e6ff;
  --ink:#1a1a1a;
  --muted:#5e6875;
}
*{box-sizing:border-box}
html,body{margin:0;width:100%;min-width:320px;background:transparent;font-family:"Montserrat","Avenir Next",Arial,system-ui,-apple-system,"Segoe UI",sans-serif;color:var(--ink);-webkit-font-smoothing:antialiased}
button,a{font:inherit}
button{cursor:pointer}
button:focus-visible,a:focus-visible{outline:3px solid rgba(95,199,207,.55);outline-offset:3px}
#app{width:100%;padding:10px 12px 14px}
.trigger{margin-left:auto;margin-right:4px;display:flex;align-items:center;gap:8px;min-height:44px;padding:0 15px;border:1px solid rgba(2,46,100,.18);border-radius:10px;background:rgba(251,250,246,.98);color:var(--navy);box-shadow:0 10px 28px rgba(3,17,31,.16);font-size:9px;font-weight:800;letter-spacing:.07em;text-transform:uppercase}
.trigger::before{content:"";width:8px;height:8px;border-radius:50%;background:var(--aqua);box-shadow:0 0 0 3px rgba(95,199,207,.15)}
.banner{width:min(1180px,calc(100% - 8px));margin:0 auto;position:relative;overflow:hidden;border:1px solid rgba(2,46,100,.14);border-radius:18px;background:rgba(251,250,246,.985);box-shadow:0 22px 70px rgba(3,17,31,.20);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)}
.banner::before{content:"";position:absolute;left:0;right:0;top:0;height:3px;background:linear-gradient(90deg,var(--aqua),#d1bc98,var(--navy))}
.inner{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:28px;align-items:end;padding:26px 28px 25px}
.brand-row{display:flex;align-items:center;gap:14px;margin-bottom:14px}
.logo{width:138px;max-height:38px;object-fit:contain;object-position:left center}
.eyebrow{font-size:10px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:#397f89}
h1{margin:0;color:var(--navy);font-size:clamp(24px,3vw,34px);line-height:1.04;letter-spacing:-.035em;font-weight:700}
p{margin:10px 0 0;max-width:760px;color:var(--muted);font-size:12px;line-height:1.65;font-weight:500}
.legal-links{display:flex;flex-wrap:wrap;gap:16px;margin-top:14px}
.legal-links button{padding:0;border:0;background:none;color:var(--navy);font-size:10px;font-weight:700;text-decoration:underline;text-underline-offset:3px}
.actions{display:grid;grid-template-columns:repeat(3,minmax(132px,1fr));gap:8px;min-width:min(500px,45vw)}
.btn{min-height:46px;padding:0 16px;border-radius:10px;font-size:10px;font-weight:800;letter-spacing:.055em;text-transform:uppercase;transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease}
.btn:hover{transform:translateY(-1px)}
.btn-primary{border:1px solid var(--navy);background:var(--navy);color:#fff;box-shadow:0 9px 24px rgba(2,46,100,.16)}
.btn-secondary{border:1px solid rgba(2,46,100,.28);background:#fff;color:var(--navy)}
.btn-manage{border:1px solid rgba(95,199,207,.6);background:#eefafb;color:var(--navy)}
.gpc{display:none;margin-top:12px;padding:10px 12px;border-left:3px solid var(--aqua);background:#f1fbfc;color:#35515a;font-size:10px;line-height:1.5}
.status{min-height:16px;margin-top:9px;color:#49626d;font-size:10px;font-weight:700}
@media(max-width:860px){
  #app{padding:8px}
  .inner{grid-template-columns:1fr;gap:20px;padding:23px 20px 20px}
  .actions{min-width:0;width:100%;grid-template-columns:1fr}
  .btn{width:100%;min-height:48px}
  .logo{width:122px}
}
@media(max-width:767px){button{font-size:16px}.btn{font-size:10px}}
@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
</style>
</head>
<body>
<div id="app" hidden>
  <button id="privacyTrigger" class="trigger" type="button" hidden>Privacy choices</button>
  <section id="bannerPanel" class="banner" role="dialog" aria-modal="false" aria-labelledby="title" aria-describedby="copy">
    <div class="inner">
      <div>
        <div class="brand-row">
          <img id="logo" class="logo" data-master-logo="[LEAVE_PLACEHOLDER]" alt="SKANDI Travels" />
          <div class="eyebrow">Privacy choices</div>
        </div>
        <h1 id="title">Your privacy at SKANDI</h1>
        <p id="copy">We use essential technologies to keep SKANDI secure and working. With your permission, we also use functional, analytics and marketing technologies. You can accept all optional uses, reject them, or choose exactly what you allow.</p>
        <div id="gpc" class="gpc">Your browser is sending a Global Privacy Control signal. Third-party data sharing will remain disabled.</div>
        <div class="legal-links">
          <button type="button" data-path="/about/legal/policies?slug=skandi-travels-cookies-policy">Cookie Policy</button>
          <button type="button" data-path="/about/legal/policies?slug=privacy-policy">Privacy Policy</button>
        </div>
        <div id="status" class="status" aria-live="polite"></div>
      </div>
      <div class="actions" aria-label="Cookie choices">
        <button id="acceptAll" class="btn btn-primary" type="button">Accept all</button>
        <button id="rejectAll" class="btn btn-primary" type="button">Reject optional</button>
        <button id="manage" class="btn btn-manage" type="button">Manage preferences</button>
      </div>
    </div>
  </section>
</div>
<script>
"use strict";
(() => {
  const SOURCE = "SKANDI_COOKIE_BANNER";
  const PARENT = "SKANDI_WIX_PARENT";
  const app = document.getElementById("app");
  const status = document.getElementById("status");
  const gpc = navigator.globalPrivacyControl === true;
  let busy = false;

  function post(type, payload = {}) {
    window.parent.postMessage({ source:SOURCE, type, payload, timestamp:new Date().toISOString() }, "*");
  }
  function resize(height) {
    post("SKANDI_EMBED_RESIZE", { height });
  }
  function showBanner() {
    app.hidden = false;
    document.getElementById("privacyTrigger").hidden = true;
    document.getElementById("bannerPanel").hidden = false;
    requestAnimationFrame(() => resize(Math.max(190, Math.ceil(document.documentElement.scrollHeight + 8))));
  }
  function hideBanner() {
    app.hidden = false;
    document.getElementById("bannerPanel").hidden = true;
    document.getElementById("privacyTrigger").hidden = false;
    resize(64);
  }
  function setBusy(next, message = "") {
    busy = next;
    document.querySelectorAll("button").forEach(btn => btn.disabled = next);
    status.textContent = message;
  }
  function submit(type) {
    if (busy) return;
    setBusy(true, "Saving your privacy choice…");
    post(type, { gpc });
  }

  if (gpc) document.getElementById("gpc").style.display = "block";
  document.getElementById("acceptAll").addEventListener("click", () => submit("SKANDI_CONSENT_ACCEPT_ALL"));
  document.getElementById("rejectAll").addEventListener("click", () => submit("SKANDI_CONSENT_REJECT_OPTIONAL"));
  document.getElementById("manage").addEventListener("click", () => post("SKANDI_CONSENT_NAVIGATE", { path:"/about/legal/cookie-preferences" }));
  document.getElementById("privacyTrigger").addEventListener("click", () => post("SKANDI_CONSENT_NAVIGATE", { path:"/about/legal/cookie-preferences" }));
  document.addEventListener("click", event => {
    const path = event.target.closest("[data-path]")?.getAttribute("data-path");
    if (path) post("SKANDI_CONSENT_NAVIGATE", { path });
  });

  window.addEventListener("message", event => {
    let msg = event.data;
    if (typeof msg === "string") { try { msg = JSON.parse(msg); } catch (_) { return; } }
    if (!msg || msg.source !== PARENT) return;
    if (msg.type === "SKANDI_MASTER_CONFIG") {
      const key = document.getElementById("logo").dataset.masterLogo;
      const logo = msg.payload?.brand?.assets?.logos?.[key];
      if (logo) document.getElementById("logo").src = logo;
      return;
    }
    if (msg.type === "SKANDI_CONSENT_STATE") {
      setBusy(false, "");
      if (msg.payload?.defaultPolicy === true) showBanner(); else hideBanner();
      return;
    }
    if (msg.type === "SKANDI_CONSENT_SAVED") {
      setBusy(false, msg.payload?.ok ? "Preferences saved." : (msg.payload?.message || "We could not save your preferences."));
      if (msg.payload?.ok) setTimeout(hideBanner, 350);
    }
  });

  post("MASTER_CONFIG_REQUEST", { context:"cookie-banner" });
  post("SKANDI_CONSENT_REQUEST", { gpc });
  setTimeout(() => post("SKANDI_CONSENT_REQUEST", { gpc }), 300);
})();
</script>
</body>
</html>
```
