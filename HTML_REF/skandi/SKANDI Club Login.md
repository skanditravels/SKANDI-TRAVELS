# SKANDI Club Login

## INFO / LOG

- **Current status:** `SOURCE COMPLETE — WIX PAGE/ELEMENT INSTALLATION REQUIRED`
- **System:** SKANDI customer website
- **Route:** `/skandi-club/login`
- **Wix page:** `SKANDI Club Log in.noml8`
- **HTML component:** `#skandiClubLoginEmbed`
- **HTML child source:** `SKANDI_CLUB_LOGIN`
- **Wix popup authority:** `src/public/siteMap.js` → `CUSTOMER_AUTH_POPUPS`
- **Page controller:** `/src/pages/SKANDI Club Log in.noml8.js`
- **Canonical backend facade:** `src/backend/SKANDI_CORE/presentation.web.js` → `getPublicPagePresentation`
- **Canonical backend core:** `src/backend/SKANDI_CORE/presentation.js`
- **Supabase resources:** public Storage bucket `skandi-public-assets`; presentation content reads `organizations` and `voy_entities` through the canonical core.
- **Wix identity boundary:** Wix Site Members authentication through the configured Wix login, signup and reset-password lightboxes. The embed never accepts credentials.
- **Page assets:** `MASTER_CONFIG.brand.assets.images.clubLoginHero` in `/src/pages/masterPage.js`, served from the verified public Supabase asset map.
- **Media Control:** Hero copy, CTA labels and the `club-login-hero` media slot use the public presentation runtime. A configured Media Control image overrides the MasterPage default.
- **Message contracts:** `MASTER_ASSETS_REQUEST` / `SKANDI_MASTER_ASSETS`; `SKANDI_PRESENTATION_READY` / `SKANDI_PRESENTATION_DATA`; `SKANDI_CLUB_LOGIN_OPEN`, `SKANDI_CLUB_SIGNUP_OPEN`, `SKANDI_CLUB_RESET_OPEN`, `SKANDI_CLUB_LOGIN_NAVIGATE`, and `SKANDI_CLUB_LOGIN_HEIGHT`.
- **Version:** `CLUB-LOGIN-1.0`
- **Last verified:** `2026-10-27`

The page collects no credentials. Login, sign-up and password reset open the configured Wix member lightboxes through the page controller. The controller currently opens the named Wix lightbox `SKANDI Club Log In`; its live contents and Wix publication state still require verification. Page navigation is sent to Wix and allow-listed by the controller. The hero image is requested from the MasterPage Supabase asset map; a valid `club-login-hero` image set in Media Control takes priority.

### Change log

- `2026-10-27` — Replaced the Git-bundled Club Login hero image with the public Supabase lifestyle image exposed by MasterPage. Added MasterPage-first loading and retained the Media Control image override.

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#092f5d">
<title>SKANDI Club | Member sign in</title>
<style>
:root {
  --club-navy: #092f5d;
  --club-navy-deep: #061f3d;
  --club-blue: #285ca8;
  --club-aqua: #66c9cf;
  --club-sky: #e7f5f5;
  --club-cream: #f8f6f0;
  --club-paper: #fffefa;
  --club-ink: #172638;
  --club-muted: #677789;
  --club-border: #e2e8ef;
  --club-shadow: 0 24px 70px rgb(10 37 68 / 12%);
  color-scheme: light;
  font-family: "Montserrat", "Avenir Next", Avenir, Arial, sans-serif;
}

* { box-sizing: border-box; }
html, body { margin: 0; min-width: 320px; min-height: 100%; }
body { min-height: 100vh; color: var(--club-ink); background: var(--club-cream); }
button, a { font: inherit; }
button { color: inherit; }

.club-login {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.04fr) minmax(430px, .96fr);
  min-height: clamp(680px, calc(100vh - 90px), 900px);
  overflow: hidden;
  background: var(--club-paper);
}

.journey-panel {
  position: relative;
  display: flex;
  min-height: 680px;
  flex-direction: column;
  justify-content: space-between;
  isolation: isolate;
  overflow: hidden;
  padding: clamp(28px, 4.5vw, 68px);
  color: #fff;
  background: var(--club-navy-deep);
}
.journey-photo, .journey-shade { position: absolute; z-index: -1; inset: 0; width: 100%; height: 100%; }
.journey-photo { object-fit: cover; object-position: 50% 48%; }
.journey-shade { background: linear-gradient(180deg, rgb(3 25 52 / 42%) 0%, rgb(3 25 52 / 8%) 31%, rgb(3 25 52 / 36%) 58%, rgb(3 25 52 / 91%) 100%), linear-gradient(90deg, rgb(5 33 65 / 24%), transparent 78%); }

.brand-lockup, .mobile-brand { display: inline-flex; width: fit-content; align-items: center; gap: 12px; color: inherit; text-decoration: none; }
.brand-mark { display: grid; width: 42px; height: 42px; place-items: center; border: 1px solid rgb(255 255 255 / 65%); border-radius: 50%; }
.brand-mark svg { width: 30px; height: 30px; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.4; }
.brand-name { display: flex; flex-direction: column; gap: 2px; font-size: 19px; font-weight: 700; letter-spacing: .19em; line-height: 1.1; }
.brand-name span { font-size: 8px; font-weight: 600; letter-spacing: .38em; }

.journey-copy { width: min(100%, 590px); margin-top: auto; padding-top: 90px; }
.eyebrow { margin: 0 0 18px; color: var(--club-blue); font-size: 10px; font-weight: 700; letter-spacing: .2em; line-height: 1.5; text-transform: uppercase; }
.journey-copy .eyebrow { color: #c3f0ed; }
.journey-copy h1 { max-width: 570px; margin: 0; font-size: clamp(40px, 5.4vw, 76px); font-weight: 500; letter-spacing: -.055em; line-height: 1.04; text-wrap: balance; }
.journey-description { max-width: 470px; margin: 24px 0 0; color: rgb(255 255 255 / 90%); font-size: clamp(14px, 1.18vw, 17px); font-weight: 400; line-height: 1.8; }
.journey-benefits { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 38px; }
.journey-benefits span { display: inline-flex; align-items: center; gap: 8px; min-height: 38px; padding: 8px 13px; border: 1px solid rgb(255 255 255 / 35%); border-radius: 999px; background: rgb(4 28 56 / 23%); backdrop-filter: blur(9px); font-size: 11px; font-weight: 500; }
.journey-benefits i { display: grid; width: 17px; height: 17px; place-items: center; border-radius: 50%; color: var(--club-navy); background: #b7eeeb; font-size: 10px; font-style: normal; font-weight: 800; }
.photo-credit { align-self: flex-end; margin: 28px 0 0; color: rgb(255 255 255 / 72%); font-size: 10px; letter-spacing: .04em; }

.account-panel { display: grid; min-width: 0; place-items: center; padding: clamp(28px, 5vw, 72px) clamp(24px, 5vw, 80px); background: radial-gradient(circle at 92% 7%, rgb(102 201 207 / 18%), transparent 24%), var(--club-cream); }
.account-panel-inner { width: min(100%, 430px); }
.mobile-brand { display: none; color: var(--club-navy); }
.mobile-brand .brand-mark { border-color: var(--club-navy); }
.account-card { padding: clamp(27px, 3.2vw, 42px); border: 1px solid rgb(222 229 235 / 90%); border-radius: 20px; background: var(--club-paper); box-shadow: var(--club-shadow); }
.card-emblem { display: grid; width: 48px; height: 48px; place-items: center; margin-bottom: 25px; border-radius: 15px; color: var(--club-navy); background: var(--club-sky); }
.card-emblem svg { width: 27px; height: 27px; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.7; }
.card-eyebrow { margin-bottom: 9px; }
.account-card h2 { margin: 0; color: var(--club-navy-deep); font-size: clamp(25px, 2.7vw, 33px); font-weight: 600; letter-spacing: -.04em; line-height: 1.2; }
.card-copy { margin: 12px 0 25px; color: var(--club-muted); font-size: 13px; line-height: 1.75; }
.action-button { position: relative; display: flex; width: 100%; min-height: 54px; align-items: center; justify-content: center; gap: 12px; border: 1px solid transparent; border-radius: 9px; cursor: pointer; font-size: 13px; font-weight: 700; transition: transform .18s ease, box-shadow .18s ease, background .18s ease, border-color .18s ease; }
.action-button:hover { transform: translateY(-1px); }
.action-button:focus-visible, .text-action:focus-visible, .account-help a:focus-visible, .site-links a:focus-visible, .brand-lockup:focus-visible, .mobile-brand:focus-visible, .terms-note a:focus-visible { outline: 3px solid var(--club-aqua); outline-offset: 3px; }
.primary-action { color: #fff; background: var(--club-navy); box-shadow: 0 10px 20px rgb(9 47 93 / 16%); }
.primary-action:hover { background: #114479; box-shadow: 0 14px 26px rgb(9 47 93 / 22%); }
.primary-action svg { position: absolute; right: 19px; width: 19px; height: 19px; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.7; }
.secondary-action { border-color: #cad6e1; color: var(--club-navy); background: #fff; }
.secondary-action:hover { border-color: var(--club-blue); background: #f5f9fc; }
.choice-divider { display: flex; align-items: center; gap: 13px; margin: 19px 0; color: #8390a0; font-size: 10px; }
.choice-divider::before, .choice-divider::after { height: 1px; flex: 1; background: var(--club-border); content: ""; }
.text-action { display: block; margin: 17px auto 0; padding: 5px 10px; border: 0; color: var(--club-blue); background: transparent; cursor: pointer; font-size: 11px; font-weight: 600; }
.text-action:hover { color: var(--club-navy-deep); text-decoration: underline; text-underline-offset: 3px; }
.secure-note { display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 27px; padding-top: 18px; border-top: 1px solid var(--club-border); color: #788696; font-size: 10px; }
.secure-note svg { width: 16px; height: 16px; flex: 0 0 auto; fill: none; stroke: var(--club-blue); stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.5; }
.account-help { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 12px; margin-top: 25px; color: #9aa5b0; font-size: 11px; }
.account-help a, .terms-note a, .site-links a { color: var(--club-blue); text-decoration: none; }
.account-help a:hover, .terms-note a:hover, .site-links a:hover { color: var(--club-navy-deep); text-decoration: underline; text-underline-offset: 3px; }
.terms-note { max-width: 350px; margin: 22px auto 0; color: #8894a1; font-size: 10px; line-height: 1.7; text-align: center; }
.site-links { display: flex; flex-wrap: wrap; justify-content: center; gap: 18px; margin-top: 27px; padding-top: 19px; border-top: 1px solid rgb(205 214 222 / 70%); font-size: 10px; }
.live-message { position: fixed; z-index: 5; right: 20px; bottom: 18px; display: none; max-width: min(360px, calc(100vw - 40px)); padding: 13px 17px; border: 1px solid rgb(255 255 255 / 25%); border-radius: 10px; color: #fff; background: var(--club-navy-deep); box-shadow: 0 10px 30px rgb(3 25 52 / 25%); font-size: 12px; line-height: 1.55; }

@media (min-width: 1500px) {
  .journey-panel { padding-left: max(68px, calc((100vw - 1440px) / 2)); }
}
@media (max-width: 980px) {
  .club-login { grid-template-columns: minmax(0, 1fr) minmax(380px, .9fr); }
  .journey-panel { padding: 34px; }
  .journey-copy h1 { font-size: clamp(42px, 6vw, 58px); }
  .journey-benefits { gap: 7px; }
  .journey-benefits span { padding: 7px 10px; font-size: 10px; }
  .account-panel { padding: 38px 28px; }
}
@media (max-width: 760px) {
  .club-login { display: flex; min-height: 0; flex-direction: column; overflow: visible; }
  .journey-panel { min-height: 430px; padding: 28px 24px 24px; }
  .journey-copy { padding-top: 72px; }
  .journey-copy h1 { max-width: 480px; font-size: clamp(42px, 10.5vw, 62px); }
  .journey-description { max-width: 510px; margin-top: 16px; font-size: 13px; line-height: 1.65; }
  .journey-benefits { margin-top: 21px; }
  .journey-benefits span { min-height: 34px; }
  .photo-credit { display: none; }
  .account-panel { padding: 28px 20px 35px; }
  .account-panel-inner { width: min(100%, 480px); }
  .mobile-brand { display: inline-flex; margin: 0 0 23px 2px; }
  .account-card { padding: 28px 25px; }
  .card-emblem { margin-bottom: 19px; }
  .site-links { gap: 14px; }
}
@media (max-width: 420px) {
  .journey-panel { min-height: 410px; padding: 22px 19px; }
  .brand-mark { width: 38px; height: 38px; }
  .brand-name { font-size: 17px; }
  .journey-copy h1 { font-size: 41px; }
  .journey-benefits { gap: 6px; }
  .journey-benefits span { gap: 6px; padding: 6px 8px; font-size: 9px; }
  .account-panel { padding: 23px 14px 28px; }
  .account-card { padding: 26px 20px; }
  .account-help { gap: 8px; font-size: 10px; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { scroll-behavior: auto !important; transition-duration: .01ms !important; animation-duration: .01ms !important; animation-iteration-count: 1 !important; }
}
</style>
</head>
<body>
<main class="club-login" data-section-id="club-login-hero">
  <section class="journey-panel" aria-label="SKANDI Club travel">
    <img
      class="journey-photo"
      alt="SKANDI Club travel in Santorini, Greece"
      data-media-slot="club-login-hero"
      data-media-slot-id="club-login-hero"
      loading="eager"
      fetchpriority="high">
    <div class="journey-shade" aria-hidden="true"></div>

    <a class="brand-lockup" href="/" data-route="/" aria-label="SKANDI home">
      <span class="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 40 40" focusable="false"><circle cx="20" cy="20" r="17"/><path d="M24.8 14.7 22 22l-7.2 3.3 3.2-7.3 6.8-3.3Z"/><path d="M20 3v5M20 32v5M3 20h5M32 20h5"/></svg>
      </span>
      <span class="brand-name">SKANDI<span>TRAVELS</span></span>
    </a>

    <div class="journey-copy">
      <p class="eyebrow" data-content-id="club-login-hero-eyebrow">YOUR NEXT JOURNEY STARTS HERE</p>
      <h1 data-content-id="club-login-hero-title">Travel well.<br>Come back for more.</h1>
      <p class="journey-description" data-content-id="club-login-hero-copy">Your SKANDI Club account brings your membership, travel details and member offers together in one place.</p>
    </div>

    <div class="journey-benefits" aria-label="SKANDI Club account features">
      <span><i aria-hidden="true">✓</i> Your membership</span>
      <span><i aria-hidden="true">✓</i> Your trips</span>
      <span><i aria-hidden="true">✓</i> Member offers</span>
    </div>
    <p class="photo-credit">A little closer to somewhere wonderful.</p>
  </section>

  <section class="account-panel" aria-labelledby="login-title">
    <div class="account-panel-inner">
      <a class="mobile-brand" href="/" data-route="/" aria-label="SKANDI home">
        <span class="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 40 40" focusable="false"><circle cx="20" cy="20" r="17"/><path d="M24.8 14.7 22 22l-7.2 3.3 3.2-7.3 6.8-3.3Z"/><path d="M20 3v5M20 32v5M3 20h5M32 20h5"/></svg>
        </span>
        <span class="brand-name">SKANDI<span>TRAVELS</span></span>
      </a>

      <div class="account-card" data-section-id="club-login-card">
        <div class="card-emblem" aria-hidden="true">
          <svg viewBox="0 0 48 48" focusable="false"><path d="M24 5 39 11v11c0 10-6.4 16.4-15 21-8.6-4.6-15-11-15-21V11l15-6Z"/><path d="m17 24 5 5 10-11"/></svg>
        </div>
        <p class="eyebrow card-eyebrow">SKANDI CLUB</p>
        <h2 id="login-title" data-content-id="club-login-panel-title">Welcome back</h2>
        <p class="card-copy" data-content-id="club-login-panel-copy">Sign in to see your SKANDI Club membership and manage your journeys.</p>

        <button class="action-button primary-action" type="button" data-action="login">
          <span data-content-id="club-login-button-label">Log in</span>
          <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 10h13M10 4l6 6-6 6"/></svg>
        </button>
        <div class="choice-divider"><span>New to SKANDI Club?</span></div>
        <button class="action-button secondary-action" type="button" data-action="signup">
          <span data-content-id="club-login-join-label">Join SKANDI Club</span>
        </button>

        <button class="text-action" type="button" data-action="reset">Forgot your password?</button>

        <div class="secure-note">
          <svg viewBox="0 0 20 20" aria-hidden="true"><rect x="4" y="8" width="12" height="9" rx="2"/><path d="M6.5 8V6a3.5 3.5 0 1 1 7 0v2M10 11v3"/></svg>
          <span>Sign in securely with your SKANDI account.</span>
        </div>
      </div>

      <div class="account-help">
        <a href="/skandi-club" data-route="/skandi-club">Explore Club benefits</a>
        <span aria-hidden="true">·</span>
        <a href="/about/support" data-route="/about/support">Need help?</a>
      </div>
      <p class="terms-note"><span data-content-id="club-login-terms-copy">By continuing, you agree to SKANDI’s</span> <a href="/about/legal/policies" data-route="/about/legal/policies">terms and privacy policy</a>.</p>
      <div class="site-links">
        <a href="/" data-route="/">Home</a>
        <a href="/skandi-club" data-route="/skandi-club">SKANDI Club</a>
        <a href="/about/legal/policies" data-route="/about/legal/policies">Terms &amp; privacy</a>
      </div>
    </div>
  </section>
  <div class="live-message" id="liveMessage" role="status" aria-live="polite"></div>
</main>
<script>

(()=>{
  "use strict";

  const SOURCE="SKANDI_CLUB_LOGIN";
  const PARENT="SKANDI_WIX_PARENT";
  const $=selector=>document.querySelector(selector);
  const liveMessage=$("#liveMessage");
  let toastTimer=0;
  let mediaHeroOverride="";

  function post(type,payload={}){
    window.parent.postMessage({source:SOURCE,type,payload,timestamp:new Date().toISOString()},"*");
  }

  function toast(message){
    if(!liveMessage)return;
    liveMessage.textContent=String(message||"");
    liveMessage.style.display="block";
    clearTimeout(toastTimer);
    toastTimer=setTimeout(()=>{liveMessage.style.display="none"},3600);
  }

  function safeStorageUrl(value){
    const raw=String(value||"").trim();
    return /^https:\/\/[a-z0-9.-]+\.supabase\.co\/storage\/v1\/object\/public\/skandi-public-assets\//i.test(raw)?raw:"";
  }

  function applyPresentation(payload={}){
    const blocks=Array.isArray(payload.contentBlocks)?payload.contentBlocks:[];
    for(const item of blocks){
      const id=String(item.contentId||"");
      if(!id)continue;
      document.querySelectorAll(`[data-content-id="${CSS.escape(id)}"]`).forEach(node=>{
        if(item.value!==undefined)node.textContent=String(item.value??"");
      });
    }

    const media=Array.isArray(payload.mediaSlots)?payload.mediaSlots:[];
    for(const item of media){
      if(String(item.slotId||"")!=="club-login-hero")continue;
      const url=safeStorageUrl(item.assetUrl||item.imageUrl);
      if(!url)continue;
      mediaHeroOverride=url;
      applyHeroImage(url,item.alt);
    }
  }

  function applyHeroImage(url,alt=""){
    const image=document.querySelector('[data-media-slot="club-login-hero"]');
    if(!image||!url)return;
    image.src=url;
    if(alt)image.alt=String(alt);
  }

  function applyMasterAssets(assets={}){
    if(mediaHeroOverride)return;
    const url=safeStorageUrl(assets?.images?.clubLoginHero);
    if(url)applyHeroImage(url,"SKANDI Club travel in Santorini, Greece");
  }

  document.addEventListener("click",event=>{
    const action=event.target.closest(".club-login [data-action]");
    if(action){
      const type=action.dataset.action;
      if(type==="login")post("SKANDI_CLUB_LOGIN_OPEN");
      else if(type==="signup")post("SKANDI_CLUB_SIGNUP_OPEN");
      else if(type==="reset")post("SKANDI_CLUB_RESET_OPEN");
      return;
    }

    const route=event.target.closest(".club-login [data-route]");
    if(route){
      event.preventDefault();
      post("SKANDI_CLUB_LOGIN_NAVIGATE",{path:route.dataset.route||route.getAttribute("href")||""});
    }
  });

  window.addEventListener("message",event=>{
    let message=event.data;
    if(typeof message==="string"){
      try{message=JSON.parse(message)}catch(_){return}
    }
    if(!message||typeof message!=="object")return;
    if(message.source===PARENT&&message.type==="SKANDI_CLUB_LOGIN_PARENT_READY")return;
    if(message.source===PARENT&&message.type==="SKANDI_CLUB_LOGIN_ERROR"){
      toast(message.payload?.message||"We could not open the sign-in window. Please try again.");
      return;
    }
    if(message.source===PARENT&&message.type==="SKANDI_MASTER_ASSETS"){
      applyMasterAssets(message.payload||{});
      return;
    }
    if(message.source===PARENT&&message.type==="SKANDI_PRESENTATION_DATA")applyPresentation(message.payload||{});
  });

  function requestHeight(){
    const height=Math.ceil(Math.max(document.documentElement.scrollHeight,document.body.scrollHeight));
    post("SKANDI_CLUB_LOGIN_HEIGHT",{height});
  }
  if("ResizeObserver"in window)new ResizeObserver(requestHeight).observe(document.body);
  else window.addEventListener("resize",requestHeight);
  window.addEventListener("load",requestHeight,{once:true});
  post("SKANDI_CLUB_LOGIN_READY",{});
  post("MASTER_ASSETS_REQUEST",{context:"club-login"});
  post("SKANDI_PRESENTATION_READY",{pageKey:"clubLogin",path:"/skandi-club/login"});
  requestHeight();
})();
</script>
</body>
</html>
```
