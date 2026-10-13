# SKANDI INFO / LOG — FORGOT PASSWORD

STATUS: NEW V12 PAGE PREPARED — REQUIRES WIX PAGE CREATION + LIVE TEST
DISPLAY / PAGE NAME: Forgot Password
ROUTE: `/forgot-password`
WIX HTML ELEMENT: `#forgotPasswordHtml`
PAGE CODE DELIVERY: `/WIX_PAGE_CODE/Forgot Password.js` (paste into the new page code after Wix creates the page)
MESSAGE SOURCE: `SKANDI_FORGOT_PASSWORD`
LAST SYNCED: 2026-10-13

## INFO
- Branded SKANDI Club page; no credentials or passwords are collected by the HTML embed.
- The page code invokes `authentication.promptForgotPassword()` from `wix-members-frontend`, keeping Wix Members as the password/reset authority.
- `Back to Login` routes to `/skandi-club?login=1`, already supported by the current SKANDI Club login page controller.
- `src/public/siteMap.js` registers `/forgot-password` as `SITE_MAP.forgotPassword`.
- No generated Wix page-code filename is invented: Wix assigns the page ID when the page is created, so page code is delivered in `WIX_PAGE_CODE` for installation into that actual page.
- STATICALLY VERIFIED; REQUIRES LIVE TEST after creating the Wix Studio page and publishing.

## CHANGE LOG
- 2026-10-13 — Dedicated V12 Forgot Password page prepared using the existing Wix Members reset flow.

## COMPLETE INTENDED LIVE HTML SOURCE

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#022e64">
<title>Forgot Password | SKANDI Club</title>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
:root{
  --navy:#022e64;
  --ink:#03111f;
  --ink-soft:#061a30;
  --aqua:#5fc7cf;
  --aqua-soft:#9de0e5;
  --ivory:#fbfaf6;
  --porcelain:#f5f1ea;
  --champagne:#d1bc98;
  --muted:#66758a;
}
*{box-sizing:border-box}
html,body{margin:0;min-width:320px;background:transparent;color:var(--ink);font-family:"Montserrat",system-ui,-apple-system,"Segoe UI",sans-serif}
main{
  min-height:620px;
  display:grid;
  place-items:center;
  padding:64px 22px;
  background:
    radial-gradient(circle at 88% 8%,rgba(95,199,207,.14),transparent 28%),
    radial-gradient(circle at 8% 96%,rgba(209,188,152,.12),transparent 31%),
    linear-gradient(145deg,var(--ivory),var(--porcelain));
}
.card{
  width:min(100%,620px);
  overflow:hidden;
  border:1px solid rgba(2,46,100,.12);
  border-radius:22px;
  background:rgba(255,255,255,.88);
  box-shadow:0 28px 80px rgba(3,17,31,.13);
}
.hero{
  position:relative;
  padding:36px 38px 32px;
  color:#fff;
  background:
    radial-gradient(circle at 88% 8%,rgba(95,199,207,.16),transparent 28%),
    linear-gradient(150deg,#0b2946 0%,var(--ink-soft) 56%,var(--ink) 100%);
}
.hero::before{content:"";position:absolute;left:0;top:0;bottom:0;width:3px;background:linear-gradient(180deg,var(--aqua),var(--champagne))}
.eyebrow{color:var(--aqua-soft);font-size:9px;font-weight:800;letter-spacing:.18em;text-transform:uppercase}
h1{margin:9px 0 0;font-size:clamp(30px,5vw,46px);line-height:1;letter-spacing:-.045em;font-weight:650}
.hero p{margin:15px 0 0;max-width:490px;color:rgba(255,255,255,.70);font-size:12px;line-height:1.65}
.content{padding:32px 38px 38px}
.content p{margin:0;color:#526273;font-size:12px;line-height:1.75}
.actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:24px}
button{
  min-height:44px;
  padding:0 18px;
  border-radius:10px;
  font:inherit;
  font-size:10px;
  font-weight:800;
  letter-spacing:.06em;
  text-transform:uppercase;
  cursor:pointer;
}
.primary{border:1px solid rgba(3,17,31,.14);background:linear-gradient(135deg,var(--navy),var(--ink-soft));color:#fff}
.primary:hover{background:var(--ink)}
.secondary{border:1px solid rgba(2,46,100,.14);background:#fff;color:var(--navy)}
.secondary:hover{border-color:rgba(95,199,207,.65);background:#f9ffff}
.status{min-height:20px;margin-top:16px;color:#526273;font-size:10px;line-height:1.5;font-weight:650}
.status.error{color:#9a3028}
.note{margin-top:24px;padding-top:20px;border-top:1px solid rgba(2,46,100,.09);color:#778392;font-size:9px;line-height:1.6}
@media(max-width:560px){main{padding:34px 14px}.hero,.content{padding-left:24px;padding-right:24px}.actions{flex-direction:column}button{width:100%}}
</style>
</head>
<body>
<main>
  <section class="card" aria-labelledby="pageTitle">
    <div class="hero">
      <div class="eyebrow">SKANDI CLUB · SECURE MEMBER ACCESS</div>
      <h1 id="pageTitle">Forgot your password?</h1>
      <p>Use SKANDI Club’s secure Wix Members password-reset flow. Your membership and sign-in remain managed by Wix Members.</p>
    </div>
    <div class="content">
      <p>Select <strong>Reset password</strong> to open the secure reset flow. Follow the on-screen steps and the instructions sent to your member email address.</p>
      <div class="actions">
        <button class="primary" id="resetBtn" type="button">Reset password</button>
        <button class="secondary" id="loginBtn" type="button">Back to Login</button>
      </div>
      <div class="status" id="status" aria-live="polite"></div>
      <div class="note">For your security, SKANDI does not receive or store your Wix Members password.</div>
    </div>
  </section>
</main>
<script>
(()=>{
  "use strict";
  const SOURCE="SKANDI_FORGOT_PASSWORD";
  const PARENT="SKANDI_WIX_PARENT";
  const $=id=>document.getElementById(id);
  const post=(type,payload={})=>{
    if(window.parent&&window.parent!==window){
      window.parent.postMessage({source:SOURCE,type,payload,timestamp:new Date().toISOString()},"*");
    }
  };
  const setStatus=(text="",error=false)=>{
    const target=$("status");
    if(!target)return;
    target.textContent=String(text||"");
    target.classList.toggle("error",Boolean(error));
  };
  $("resetBtn")?.addEventListener("click",()=>{
    setStatus("Opening secure password reset…");
    post("FORGOT_PASSWORD_OPEN_RESET",{});
  });
  $("loginBtn")?.addEventListener("click",()=>{
    post("FORGOT_PASSWORD_OPEN_LOGIN",{});
  });
  window.addEventListener("message",event=>{
    const message=event.data||{};
    if(message.source!==PARENT)return;
    if(message.type==="FORGOT_PASSWORD_RESULT"){
      const payload=message.payload||{};
      setStatus(payload.message||"",payload.ok===false);
    }
  });
  post("FORGOT_PASSWORD_READY",{});
  post("SKANDI_EMBED_RESIZE",{height:620});
})();
</script>
</body>
</html>
```

## COMPLETE PAGE CODE

```js
import wixLocationFrontend from "wix-location-frontend";
import { authentication } from "wix-members-frontend";
import { SITE_MAP } from "public/siteMap";

const HTML_ID = "#forgotPasswordHtml";
const CHILD_SOURCE = "SKANDI_FORGOT_PASSWORD";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";

function send(html, type, payload = {}) {
  html.postMessage({
    source: PARENT_SOURCE,
    type,
    payload,
    timestamp: new Date().toISOString()
  });
}

function isCancellation(error) {
  const value = String(error?.message || error || "").toLowerCase();
  return value.includes("cancel") || value.includes("closed") || value.includes("abort");
}

$w.onReady(function () {
  const html = $w(HTML_ID);

  html.onMessage(async (event) => {
    const message = event.data || {};
    if (message.source !== CHILD_SOURCE) return;

    if (message.type === "FORGOT_PASSWORD_READY") {
      send(html, "FORGOT_PASSWORD_RESULT", {
        ok: true,
        message: "Ready to start a secure Wix Members password reset."
      });
      return;
    }

    if (message.type === "FORGOT_PASSWORD_OPEN_RESET") {
      try {
        await authentication.promptForgotPassword();
        send(html, "FORGOT_PASSWORD_RESULT", {
          ok: true,
          message: "Password reset completed or reset instructions were requested through Wix Members."
        });
      } catch (error) {
        if (isCancellation(error)) {
          send(html, "FORGOT_PASSWORD_RESULT", {
            ok: true,
            message: "Password reset was closed. You can reopen it whenever you are ready."
          });
          return;
        }

        send(html, "FORGOT_PASSWORD_RESULT", {
          ok: false,
          message: "Password reset is temporarily unavailable. Please try again."
        });
      }
      return;
    }

    if (message.type === "FORGOT_PASSWORD_OPEN_LOGIN") {
      wixLocationFrontend.to(`${SITE_MAP.club}?login=1`);
    }
  });
});
```
