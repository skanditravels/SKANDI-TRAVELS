# RIAINTRA Staff Login — INFO / LOG

- 2026-10-30 — RIAINTRA login uses riaHeader; its unassigned Group endorsement mark remains [LEAVE_PLACEHOLDER].

## CHANGE LOG (append-only)

- 2026-10-28 UTC — Updated `riaintra-embeds/riaintra/riaintra.receiver.html` to follow the current shared receiver pattern with page-specific startup, progress and failure messages for **RIAINTRA Staff Login** (`/riaintra`). The expected route matches `src/public/siteMap.js`; master-page handshake, staff authorization, manifest/SHA-256 checks and nested-iframe rejection remain intact.


## INFO
- **System area:** RIAINTRA (SKANDI GROUP employee intranet)
- **Page:** RIAINTRA staff login
- **Wix route:** `/riaintra`
- **Wix HTML component:** `#staffLoginEmbed`
- **Wix page controller:** `src/pages/RIAINTRA.rc14z.js`
- **Sitewide route/logout guard:** `src/pages/masterPage.js`
- **Canonical web facade:** `src/backend/SKANDI_CORE/staffAuth.web.js` (unchanged)
- **Canonical auth core:** `src/backend/SKANDI_CORE/staffAuth.js` (unchanged)
- **Ownership:** login/session handled by Wix Members and canonical SKANDI staff-auth core; no provider/database logic in HTML
- **Page identity:** `SKANDI_STAFF_LOGIN`; **parent identity:** `SKANDI_WIX_PARENT`
- **Inbound parent messages:** `STAFF_LOGIN_PROGRESS`, `STAFF_LOGIN_OK`, `STAFF_LOGIN_ERROR`, `STAFF_LOGIN_NOTICE`
- **Outbound messages:** `STAFF_LOGIN_READY`, `STAFF_LOGIN_REQUEST` with `{ skId, password }` and `requestId`, `STAFF_FORGOT_PASSWORD` with `requestId`
- **Contract IDs retained:** `login-view`, `login-left`, `login-right`, `login-card-wrap`, `login-drop-btn`, `login-card`, `login-form`, `login-username`, `login-password`, `login-submit`, `forgot-password`, `login-error`, `login-notice`, `clock`, `SK-logo`
- **Status:** STATICALLY VERIFIED for local HTML and message contract; REQUIRES LIVE TEST for Wix iOS/Android container behavior and authentication
- **Source of truth for this prepared replacement:** complete user-supplied staff-login HTML on 2026-10-19, preserved authentication bridge script with presentation-only updates
- **Source-registry limitation:** no pre-existing login-page HTML_REF located on GitHub `main` using name/content searches or candidate canonical paths. This is a **new reference mirror**, not an overwrite of an inspected prior INFO / LOG history. Reconcile before adding if a separate unsynced canonical record exists.
- **Wix publication:** replace contents of existing HTML component `#staffLoginEmbed` (not controller/backend); publish Wix site, test real sign-in and reset flows. GitHub/Drive/Wix not modified by package preparation.

## LOG (chronological)
- **2026-10-19 — Split-screen redesign prepared:** corporate SKANDI navy left panel and white right-hand login. Existing SK-ID validation, `requestId` correlation, message identities, Wix-authentication ownership and password-reset bridge preserved. Credentials remain transmitted only through the existing parent message contract. Login form is immediately visible, without a separate reveal step. Added client-side password visibility toggle, public support and policy links from verified site-map routes. No backend or permission change.

- **2026-10-19 — Mobile app-like viewport and pull-to-refresh:** Full-height bounded mobile iframe document (inner content-only scrolling), native-style branded header/sheet layout, iOS 16px input sizing (no focus-induced zoom), responsive visualViewport keyboard fit, in-app pull-down refresh plus accessible Refresh action. Refresh reissues the existing `STAFF_LOGIN_READY` session check with a correlated `requestId` and honors the Wix parent response; no new message types, fake data, application caches, permission changes or backend functions. Retained native pinch zoom accessibility; parent Wix page scroll, iframe geometry and iOS browser chrome remain outside embed control.

- **2026-10-26 — Typed-login and exit-session guard:** `STAFF_LOGIN_READY` now logs out any existing Wix member session and always leaves the user at the credential form. RIAINTRA no longer redirects based on an existing staff session. A Wix memory-storage marker is written only after typed SK-ID/password login completes the existing authorized-session check; it supports in-site route changes and clears when the page reloads or closes. The site master logs out and clears the marker when leaving `/riaintra`, and directs direct/reloaded RIAINTRA subroutes to `/riaintra` so credentials must be typed again. On `pagehide`, it starts logout and stores a non-sensitive pending-logout flag so the next SKANDI page retries logout if the browser cancels that request. The login HTML, staff-auth facade, core, permissions, and database are unchanged.

- **2026-10-29 — Wix deployment lint repair:** The site master registers the existing RIAINTRA `pagehide` and `pageshow` lifecycle listeners on the browser `window` object instead of `globalThis`, which is not recognized by the Wix page-code lint environment. Logout and typed-login behavior is unchanged. STATICALLY VERIFIED; REQUIRES LIVE TEST in Wix.

## COMPLETE WIX HTML EMBED

~~~html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="color-scheme" content="light">
  <title>RIAINTRA | Staff Sign In</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --sk-blue: #022e64;
      --sk-blue-deep: #01244e;
      --sk-blue-soft: #1f6ba3;
      --sk-accent: #5fc7cf;
      --sk-light: #f4f6fb;
      --sk-border: #d9e2ed;
      --sk-text-main: #14243d;
      --sk-text-muted: #65748a;
      --sk-danger: #9b1c1c;
    }

    *, *::before, *::after { box-sizing: border-box; }
    html { min-width: 320px; height: 100%; }
    body {
      margin: 0;
      min-height: 100%;
      color: var(--sk-text-main);
      background: #fff;
      font-family: "Montserrat", system-ui, -apple-system, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    button, input { font: inherit; }
    button { cursor: pointer; }
    a { color: inherit; }
    button:focus-visible, a:focus-visible, input:focus-visible {
      outline: 3px solid var(--sk-accent);
      outline-offset: 3px;
    }

    #app-shell { width: 100%; min-height: 100vh; min-height: 100svh; }
    #app-main { min-height: inherit; }
    #login-view {
      display: grid;
      grid-template-columns: minmax(0, 46%) minmax(0, 54%);
      min-height: 100vh;
      min-height: 100svh;
    }

    #login-left {
      position: relative;
      isolation: isolate;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 60px;
      padding: clamp(38px, 4vw, 76px) clamp(38px, 5.1vw, 94px) 40px;
      color: #fff;
      background: linear-gradient(145deg, #013b76 0%, var(--sk-blue) 44%, #011e41 100%);
    }
    #login-left::before {
      content: "";
      position: absolute;
      inset: 0;
      z-index: -1;
      pointer-events: none;
      opacity: .4;
      background:
        linear-gradient(90deg, transparent calc(100% - 1px), rgba(255,255,255,.07) calc(100% - 1px)) 0 0 / 88px 88px,
        linear-gradient(0deg, transparent calc(100% - 1px), rgba(255,255,255,.07) calc(100% - 1px)) 0 0 / 88px 88px;
      mask-image: linear-gradient(90deg, transparent 0%, black 70%);
    }
    #login-left::after {
      content: "";
      position: absolute;
      width: min(70vw, 700px);
      height: min(70vw, 700px);
      top: 15%;
      right: -65%;
      z-index: -1;
      pointer-events: none;
      border: 1px solid rgba(255,255,255,.10);
      border-radius: 50%;
      box-shadow: 0 0 0 90px rgba(255,255,255,.015), 0 0 0 180px rgba(255,255,255,.012);
    }

    #app-header { display: flex; justify-content: space-between; align-items: center; }
    #SK-logo { display: flex; align-items: center; gap: 17px; min-width: 0; }
    #SK-logo img { display: block; width: auto; max-width: 150px; height: 53px; object-fit: contain; }
    #SK-logo-text { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
    #SK-logo-text strong {
      font-size: 13px;
      font-weight: 800;
      line-height: 1.15;
      letter-spacing: .12em;
      text-transform: uppercase;
    }
    #SK-logo-text span {
      color: rgba(255,255,255,.69);
      font-size: 10px;
      font-weight: 600;
      letter-spacing: .19em;
      text-transform: uppercase;
    }
    .brand-center { max-width: 545px; padding-block: 15px; }
    .brand-rule {
      width: 48px;
      height: 3px;
      margin-bottom: 33px;
      border-radius: 999px;
      background: var(--sk-accent);
    }
    .brand-eyebrow {
      margin: 0 0 22px;
      color: #abd9e7;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: .26em;
      line-height: 1.8;
      text-transform: uppercase;
    }
    #login-tagline {
      margin: 0;
      max-width: 570px;
      font-size: clamp(37px, 3.5vw, 63px);
      line-height: 1.14;
      letter-spacing: -.05em;
      font-weight: 700;
    }
    #login-tagline em { color: #79d2db; font-style: normal; }
    #login-sub {
      max-width: 490px;
      margin: 24px 0 0;
      color: #d3e5f5;
      font-size: 13px;
      font-weight: 400;
      line-height: 1.95;
    }
    #login-drop-btn {
      display: inline-flex;
      align-items: center;
      gap: 13px;
      margin-top: 36px;
      padding: 0;
      color: #fff;
      background: transparent;
      border: 0;
      border-bottom: 1px solid rgba(255,255,255,.55);
      border-radius: 0;
      padding-bottom: 12px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: .1em;
      text-transform: uppercase;
    }
    #login-drop-btn:hover { color: #9be6eb; border-bottom-color: #9be6eb; }
    #login-drop-btn:disabled { cursor: not-allowed; opacity: .55; }
    #login-drop-btn .arrow { font-size: 17px; line-height: 1; }
    .brand-bottom {
      display: flex;
      align-items: end;
      justify-content: space-between;
      gap: 25px;
      padding-top: 22px;
      border-top: 1px solid rgba(255,255,255,.22);
    }
    .brand-bottom-copy {
      color: rgba(255,255,255,.68);
      font-size: 10px;
      line-height: 1.85;
      letter-spacing: .1em;
      text-transform: uppercase;
    }
    #header-meta-text { margin-bottom: 8px; color: rgba(255,255,255,.9); font-weight: 700; }
    #header-meta-text strong { color: #8ddce0; }
    #header-meta { font-size: 10px; color: rgba(255,255,255,.62); white-space: nowrap; }

    #login-card-wrap { display: flex; min-width: 0; background: #fff; }
    #login-right {
      display: flex;
      flex: 1;
      flex-direction: column;
      justify-content: space-between;
      min-width: 0;
      padding: 45px clamp(38px, 5.7vw, 100px) 31px;
    }
    .right-upper {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 8px;
      color: #7c879a;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: .16em;
      text-transform: uppercase;
    }
    .right-upper::before { content: ""; width: 18px; height: 2px; background: var(--sk-accent); }
    .login-middle { display: flex; justify-content: center; align-items: center; padding: 36px 0 52px; flex: 1; }
    #login-card { width: 100%; max-width: 424px; }
    .login-overline {
      color: var(--sk-blue-soft);
      font-size: 10px;
      font-weight: 800;
      letter-spacing: .19em;
      text-transform: uppercase;
    }
    #login-card h2 {
      margin: 16px 0 12px;
      color: #102d50;
      font-size: clamp(31px, 3vw, 43px);
      font-weight: 700;
      letter-spacing: -.045em;
      line-height: 1.18;
    }
    .login-intro { margin: 0 0 42px; color: var(--sk-text-muted); font-size: 12px; line-height: 1.9; }
    .field-group { margin: 0 0 24px; }
    .field-label-row { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin-bottom: 10px; }
    .field-label-row label {
      color: #193454;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: .045em;
    }
    .field-helper { color: #818da1; font-size: 10px; line-height: 1.4; }
    #login-username, #login-password {
      width: 100%;
      height: 54px;
      padding: 0 17px;
      border: 1px solid #cfdae6;
      border-radius: 8px;
      background: #fbfcfe;
      color: #162b49;
      font-size: 15px;
      font-weight: 600;
      line-height: 54px;
      outline: none;
      transition: border-color .15s ease, box-shadow .15s ease;
    }
    #login-username { letter-spacing: .08em; text-transform: uppercase; }
    #login-username::placeholder { letter-spacing: .08em; }
    #login-username::placeholder, #login-password::placeholder { color: #a2acbc; font-weight: 500; }
    #login-username:focus, #login-password:focus {
      border-color: var(--sk-blue-soft);
      box-shadow: 0 0 0 3px rgba(31,107,163,.12);
    }
    #login-username:disabled, #login-password:disabled { background: #f1f5f9; opacity: .7; }
    .password-wrap { position: relative; }
    #login-password { padding-right: 84px; }
    #password-visibility {
      position: absolute;
      top: 4px;
      right: 5px;
      height: 46px;
      min-width: 70px;
      border: 0;
      border-radius: 6px;
      background: transparent;
      color: var(--sk-blue);
      font-size: 11px;
      font-weight: 700;
    }
    #password-visibility:hover { background: #ecf3f9; }
    #login-submit {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      min-height: 55px;
      margin-top: 33px;
      border: 1px solid var(--sk-blue);
      border-radius: 8px;
      background: var(--sk-blue);
      color: #fff;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: .02em;
      transition: background .17s ease, transform .17s ease;
    }
    #login-submit:hover:not(:disabled) { background: #064281; transform: translateY(-1px); }
    #login-submit:disabled { cursor: not-allowed; }
    .login-actions { display: flex; justify-content: center; margin-top: 23px; }
    .link-button {
      padding: 3px;
      border: 0;
      background: transparent;
      color: #0d4f87;
      font-size: 11px;
      font-weight: 700;
      text-decoration: underline;
      text-decoration-color: transparent;
      text-underline-offset: 4px;
    }
    .link-button:hover { text-decoration-color: currentColor; }
    .link-button:disabled { opacity: .55; cursor: not-allowed; }
    #login-error, #login-notice {
      display: none;
      margin: 0 0 24px;
      padding: 14px 15px;
      border-radius: 7px;
      font-size: 12px;
      line-height: 1.7;
    }
    #login-error { border: 1px solid #f2c3c3; border-left: 3px solid #b52626; background: #fff5f5; color: #8e1f1f; }
    #login-notice { border: 1px solid #cfdee9; border-left: 3px solid #1f6ba3; background: #f3f8fc; color: #244a6b; }
    .login-help {
      margin-top: 36px;
      padding-top: 23px;
      border-top: 1px solid #e5eaf1;
      color: #778399;
      font-size: 11px;
      line-height: 1.8;
      text-align: center;
    }
    .login-help a { display: inline-block; margin-left: 4px; color: #0d4f87; font-weight: 700; text-decoration: none; }
    .login-help a:hover { text-decoration: underline; text-underline-offset: 3px; }
    .right-footer {
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
      align-items: center;
      gap: 14px 24px;
      width: 100%;
      padding-top: 22px;
      border-top: 1px solid #ebeff4;
    }
    .right-footer p { margin: 0; color: #98a2af; font-size: 10px; }
    .right-links { display: flex; flex-wrap: wrap; align-items: center; gap: 15px 24px; }
    .right-links a { color: #596c83; font-size: 10px; font-weight: 600; text-decoration: none; }
    .right-links a:hover { color: var(--sk-blue); text-decoration: underline; text-underline-offset: 4px; }

    @media (max-width: 1060px) {
      #login-view { grid-template-columns: minmax(0, 43%) minmax(0, 57%); }
      #login-left { padding: 35px 36px; }
      #login-right { padding: 35px 40px 30px; }
      #login-tagline { font-size: clamp(35px, 4vw, 51px); }
      .brand-bottom { flex-direction: column; align-items: flex-start; }
    }
    #pull-refresh { display: none; }
    #refresh-session { display: none; }

    @media (max-width: 760px) {
      html, body {
        width: 100%;
        height: 100%;
        min-height: 0;
        overflow: hidden;
        overscroll-behavior: none;
        background: var(--sk-blue);
      }
      body { position: fixed; inset: 0; }
      #app-shell {
        position: fixed;
        inset: 0;
        width: 100%;
        height: 100dvh;
        height: var(--app-mobile-height, 100dvh);
        min-height: 0;
        overflow: hidden;
      }
      #app-main {
        position: relative;
        height: 100%;
        min-height: 0;
        overflow-y: auto;
        overflow-x: hidden;
        overscroll-behavior-y: contain;
        overscroll-behavior-x: none;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
      }
      #app-main::-webkit-scrollbar { display: none; }
      #login-view {
        display: flex;
        flex-direction: column;
        width: 100%;
        min-height: 100%;
        height: auto;
      }
      #login-left {
        flex: 0 0 auto;
        min-height: 0;
        gap: 22px;
        padding: calc(23px + env(safe-area-inset-top, 0px)) 25px 39px;
      }
      #login-left::after { width: 420px; height: 420px; right: -295px; top: -105px; }
      #SK-logo { gap: 12px; }
      #SK-logo img { height: 41px; max-width: 125px; }
      #SK-logo-text strong { font-size: 12px; }
      #SK-logo-text span { font-size: 9px; }
      .brand-center { max-width: none; padding: 0; }
      .brand-rule { width: 28px; height: 2px; margin-bottom: 14px; }
      .brand-eyebrow { margin: 0 0 9px; font-size: 9px; letter-spacing: .19em; }
      #login-tagline { max-width: 450px; font-size: clamp(28px, 6.7vw, 37px); line-height: 1.14; }
      #login-sub { max-width: 450px; margin: 11px 0 0; font-size: 11px; line-height: 1.65; }
      #login-drop-btn, .brand-bottom { display: none; }
      #login-card-wrap {
        display: flex;
        flex: 1 0 auto;
        position: relative;
        z-index: 1;
        min-width: 0;
        margin-top: -17px;
        border-radius: 20px 20px 0 0;
        overflow: hidden;
        background: #fff;
      }
      #login-right {
        width: 100%;
        min-height: 100%;
        padding: 29px 25px calc(22px + env(safe-area-inset-bottom, 0px));
      }
      .right-upper { display: none; }
      .login-middle { flex: 1 0 auto; align-items: flex-start; padding: 0 0 28px; }
      #login-card { max-width: 440px; }
      #login-card h2 { margin-top: 11px; margin-bottom: 8px; font-size: 29px; }
      .login-intro { margin-bottom: 24px; font-size: 11px; line-height: 1.65; }
      .field-group { margin-bottom: 19px; }
      .field-label-row { margin-bottom: 8px; }
      #login-username, #login-password {
        height: 52px;
        min-height: 52px;
        font-size: 16px;
        line-height: normal;
      }
      #login-submit { min-height: 52px; margin-top: 24px; }
      .login-actions { margin-top: 17px; }
      .login-help { margin-top: 27px; padding-top: 19px; }
      .right-footer { gap: 12px 18px; padding-top: 18px; }
      .right-footer p, .right-links a { font-size: 10px; }
      .right-links { gap: 12px 20px; }
      #refresh-session {
        display: inline-flex;
        align-items: center;
        min-height: 35px;
        margin: -4px 0 -4px -8px;
        padding: 6px 8px;
        border: 0;
        border-radius: 6px;
        background: transparent;
        color: var(--sk-blue);
        font-size: 11px;
        font-weight: 700;
      }
      #refresh-session:disabled { cursor: not-allowed; opacity: .5; }
      #pull-refresh {
        display: flex;
        position: fixed;
        top: calc(11px + env(safe-area-inset-top, 0px));
        left: 50%;
        z-index: 20;
        align-items: center;
        justify-content: center;
        gap: 8px;
        width: max-content;
        max-width: calc(100% - 32px);
        min-height: 38px;
        padding: 7px 13px;
        border: 1px solid #d9e5ef;
        border-radius: 999px;
        background: #fff;
        box-shadow: 0 6px 20px rgba(1,36,78,.19);
        color: var(--sk-blue);
        font-size: 11px;
        font-weight: 700;
        opacity: 0;
        pointer-events: none;
        transform: translate(-50%, -65px);
        transition: transform .18s ease, opacity .18s ease;
      }
      #pull-refresh.is-pulling {
        opacity: 1;
        transform: translate(-50%, calc(-65px + var(--pull-offset, 0px)));
        transition: none;
      }
      #pull-refresh.is-refreshing {
        opacity: 1;
        transform: translate(-50%, 0);
      }
      .pull-icon { display: inline-block; font-size: 18px; line-height: 1; }
      #pull-refresh.is-refreshing .pull-icon { animation: riaintra-spin .8s linear infinite; }
      @keyframes riaintra-spin { to { transform: rotate(360deg); } }
    }
    @media (max-width: 390px) {
      #login-left { padding-right: 21px; padding-left: 21px; }
      #login-right { padding-right: 21px; padding-left: 21px; }
      #login-tagline { font-size: 28px; }
      #login-sub { font-size: 10.5px; }
      .right-links { gap: 10px 15px; }
      .right-footer { align-items: flex-start; }
    }
    @media (max-width: 360px) and (max-height: 640px) {
      #login-left { gap: 13px; padding-top: calc(15px + env(safe-area-inset-top, 0px)); padding-bottom: 31px; }
      #SK-logo img { height: 36px; }
      .brand-rule { margin-bottom: 9px; }
      #login-sub { margin-top: 7px; }
      #login-right { padding-top: 24px; }
    }
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after { scroll-behavior: auto !important; transition-duration: 0s !important; }
    }
  </style>
</head>
<body>
  <div id="app-shell">
    <main id="app-main">
      <div id="pull-refresh" role="status" aria-live="polite" aria-hidden="true">
        <span class="pull-icon" aria-hidden="true">↻</span><span id="pull-refresh-label">Pull to refresh</span>
      </div>
      <section id="login-view" aria-label="RIAINTRA staff login">
        <div id="login-left">
          <header id="app-header">
            <div id="SK-logo">
              <img data-master-logo="riaHeader" alt="RIAINTRA logo">
              <div id="SK-logo-text">
                <span>SKANDI STAFF PORTAL</span>
              </div>
            </div>
          </header>
          <div class="brand-center">
            <div class="brand-rule" aria-hidden="true"></div>
            <p class="brand-eyebrow">The SKANDI internal network</p>
            <h1 id="login-tagline">One team.<br>One connected <em>workspace.</em></h1>
            <p id="login-sub">Your gateway to the tools, people and operations that keep SKANDI moving—across every team and destination.</p>
            <button type="button" id="login-drop-btn">Go to staff sign in <span class="arrow" aria-hidden="true">→</span></button>
          </div>
          <div class="brand-bottom">
            <div class="brand-bottom-copy">
              <div id="SK-logo">
                <img data-master-logo="[LEAVE_PLACEHOLDER]" alt="A SKANDI GROUP MEMBER"><div id="SK-logo-text">· INTERNAL SYSTEMS</div></div>
              <div>For authorized staff use only.</div>
            </div>
            <div id="header-meta"><span id="clock">LOCAL TIME</span></div>
          </div>
        </div>

        <div id="login-card-wrap">
          <div id="login-right">
            <div class="right-upper">Employee access</div>
            <div class="login-middle">
              <div id="login-card">
                <div class="login-overline">RIAINTRA / EMPLOYEE PORTAL</div>
                <h2>Welcome back.</h2>
                <p class="login-intro">Enter your SK-ID and password to access your staff workspace.</p>

                <div id="login-error" role="alert" aria-live="assertive"></div>
                <div id="login-notice" role="status" aria-live="polite"></div>

                <form id="login-form" novalidate>
                  <div class="field-group">
                    <div class="field-label-row">
                      <label for="login-username">SK-ID</label>
                      <span class="field-helper">Two letters + four digits</span>
                    </div>
                    <input type="text" id="login-username" name="skid" maxlength="6"
                      pattern="[A-Za-z]{2}[0-9]{4}" placeholder="AA0000"
                      autocomplete="username" autocapitalize="characters" spellcheck="false"
                      aria-describedby="login-error" required>
                  </div>

                  <div class="field-group">
                    <div class="field-label-row">
                      <label for="login-password">Password</label>
                    </div>
                    <div class="password-wrap">
                      <input type="password" id="login-password" name="password"
                        placeholder="Enter your password" autocomplete="current-password"
                        maxlength="256" aria-describedby="login-error" required>
                      <button type="button" id="password-visibility" aria-label="Show or hide password" aria-pressed="false">Show</button>
                    </div>
                  </div>

                  <button type="submit" id="login-submit">Sign in to RIAINTRA</button>
                  <div class="login-actions">
                    <button type="button" id="forgot-password" class="link-button">Forgot your password?</button>
                  </div>
                </form>

                <div class="login-help">
                  Need assistance with your account?
                  <a href="https://www.skanditravels.com/about/support" target="_blank" rel="noopener noreferrer">Contact support →</a>
                </div>
              </div>
            </div>
            <footer class="right-footer">
              <p>© 2026 SKANDI GROUP</p>
              <nav class="right-links" aria-label="External links">
                <a href="https://www.skanditravels.com/" target="_blank" rel="noopener noreferrer">SKANDI TRAVELS</a>
                <a href="https://www.skanditravels.com/about/legal" target="_blank" rel="noopener noreferrer">Legal</a>
              </nav>
              <button type="button" id="refresh-session" aria-label="Refresh staff session">Refresh</button>
            </footer>
          </div>
        </div>
      </section>
    </main>
  </div>

<script>
(function(){
  "use strict";

  const SOURCE = "SKANDI_STAFF_LOGIN";
  const PARENT_SOURCE = "SKANDI_WIX_PARENT";

  const cardWrap = document.getElementById("login-card-wrap");
  const dropBtn = document.getElementById("login-drop-btn");
  const loginForm = document.getElementById("login-form");
  const loginError = document.getElementById("login-error");
  const loginNotice = document.getElementById("login-notice");
  const usernameInput = document.getElementById("login-username");
  const passwordInput = document.getElementById("login-password");
  const loginBtn = document.getElementById("login-submit");
  const forgotBtn = document.getElementById("forgot-password");
  const clock = document.getElementById("clock");
  const appMain = document.getElementById("app-main");
  const pullIndicator = document.getElementById("pull-refresh");
  const pullLabel = document.getElementById("pull-refresh-label");
  const refreshButton = document.getElementById("refresh-session");
  const mobileView = window.matchMedia("(max-width: 760px)");
  let refreshing = false;
  let refreshRequestId = "";
  let refreshTimer = null;
  let touchStartX = 0;
  let touchStartY = 0;
  let pullDistance = 0;
  let pullEligible = false;
  let isPulling = false;
  let activeRequestId = "";
  let requestSequence = 0;

  function createRequestId(action) {
    requestSequence += 1;
    return action + "-" + Date.now() + "-" + requestSequence;
  }

  function post(type, payload = {}, requestId = "") {
    const message = {
      source: SOURCE,
      type,
      payload,
      timestamp: new Date().toISOString()
    };

    if (requestId) {
      message.requestId = requestId;
    }

    window.parent.postMessage(message, "*");
  }

  function cleanSkId(value) {
    return String(value || "")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 6);
  }

  function isValidSkId(value) {
    return /^[A-Z]{2}[0-9]{4}$/.test(value);
  }

  function setError(message) {
    loginError.style.display = message ? "block" : "none";
    loginError.textContent = message || "";
  }

  function setNotice(message) {
    loginNotice.style.display = message ? "block" : "none";
    loginNotice.textContent = message || "";
  }

  function setBusy(isBusy, text) {
    const busy = Boolean(isBusy);
    loginBtn.disabled = busy;
    loginBtn.style.opacity = busy ? ".6" : "1";
    loginBtn.textContent = busy ? (text || "Checking...") : "Sign in to RIAINTRA";
    loginBtn.setAttribute("aria-busy", String(busy));

    usernameInput.disabled = busy;
    passwordInput.disabled = busy;
    forgotBtn.disabled = busy;
    dropBtn.disabled = busy;
  }

  function showLoginCard() {
    cardWrap.style.display = "flex";
    // A parent response must not open the mobile keyboard and resize the app unprompted.
    if (!mobileView.matches) setTimeout(() => usernameInput.focus(), 80);
  }

  function toggleLoginCard() {
    cardWrap.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "nearest"
    });
    setTimeout(() => usernameInput.focus(), 80);
  }

  function updateClock() {
    const now = new Date();
    clock.textContent = "LOCAL TIME · " + now.toLocaleDateString() + " · " + now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function ensureFocusedInputVisible() {
    if (!mobileView.matches) return;
    const focused = document.activeElement;
    if (focused !== usernameInput && focused !== passwordInput) return;
    const viewport = appMain.getBoundingClientRect();
    const field = focused.getBoundingClientRect();
    const bottomLimit = viewport.bottom - 20;
    const topLimit = viewport.top + 14;
    if (field.bottom > bottomLimit) appMain.scrollTop += field.bottom - bottomLimit;
    else if (field.top < topLimit) appMain.scrollTop -= topLimit - field.top;
  }

  function syncMobileViewport() {
    if (!mobileView.matches) {
      document.documentElement.style.removeProperty("--app-mobile-height");
      return;
    }
    const height = Math.round(window.visualViewport?.height || window.innerHeight);
    if (Number.isFinite(height) && height > 200) {
      document.documentElement.style.setProperty("--app-mobile-height", height + "px");
    }
    window.requestAnimationFrame(ensureFocusedInputVisible);
  }

  function resetPull() {
    isPulling = false;
    pullEligible = false;
    pullDistance = 0;
    pullIndicator.style.removeProperty("--pull-offset");
    if (!refreshing) {
      pullIndicator.classList.remove("is-pulling", "is-refreshing");
      pullIndicator.setAttribute("aria-hidden", "true");
    }
  }

  function finishRefresh() {
    if (!refreshing) return;
    refreshing = false;
    refreshRequestId = "";
    window.clearTimeout(refreshTimer);
    refreshTimer = null;
    refreshButton.disabled = false;
    pullIndicator.classList.remove("is-refreshing", "is-pulling");
    pullIndicator.setAttribute("aria-hidden", "true");
    pullLabel.textContent = "Pull to refresh";
  }

  function refreshSession() {
    if (!mobileView.matches || refreshing || loginBtn.disabled || activeRequestId) return;
    resetPull();
    refreshing = true;
    refreshButton.disabled = true;
    refreshRequestId = createRequestId("refresh");
    pullIndicator.classList.add("is-refreshing");
    pullIndicator.setAttribute("aria-hidden", "false");
    pullLabel.textContent = "Refreshing session...";
    // Re-read authoritative Wix session via the existing V12 page-controller contract.
    // Do not reload the Wix iframe or bypass authentication.
    post("STAFF_LOGIN_READY", {}, refreshRequestId);
    refreshTimer = window.setTimeout(function() {
      if (!refreshing) return;
      finishRefresh();
      setNotice("Unable to refresh the session. Try again.");
    }, 12000);
  }

  function touchIsOnControl(target) {
    return !!(target && target.closest && target.closest("input, textarea, select, button, a"));
  }

  appMain.addEventListener("touchstart", function(event) {
    if (!mobileView.matches || event.touches.length !== 1) return;
    resetPull();
    const point = event.touches[0];
    touchStartX = point.clientX;
    touchStartY = point.clientY;
    pullEligible = appMain.scrollTop <= 1 && !refreshing && !loginBtn.disabled &&
      !activeRequestId && !touchIsOnControl(event.target) &&
      document.activeElement !== usernameInput && document.activeElement !== passwordInput;
  }, { passive: true });

  appMain.addEventListener("touchmove", function(event) {
    if (!mobileView.matches || event.touches.length !== 1) return;
    const point = event.touches[0];
    const dy = point.clientY - touchStartY;
    const dx = Math.abs(point.clientX - touchStartX);
    if (pullEligible && dy > 9 && dy > dx * 1.2) {
      isPulling = true;
      pullDistance = Math.min(96, Math.round(dy * .68));
      pullIndicator.style.setProperty("--pull-offset", pullDistance + "px");
      pullIndicator.classList.add("is-pulling");
      pullIndicator.setAttribute("aria-hidden", "false");
      pullLabel.textContent = pullDistance >= 65 ? "Release to refresh" : "Pull to refresh";
      if (event.cancelable) event.preventDefault();
      return;
    }
    if (isPulling) {
      if (event.cancelable) event.preventDefault();
      return;
    }
    // Safari fallback for constrained iframe scrolling at the edges.
    const atTop = appMain.scrollTop <= 0 && dy > 0;
    const atBottom = appMain.scrollTop + appMain.clientHeight >= appMain.scrollHeight - 1 && dy < 0;
    if ((atTop || atBottom) && dy > dx * 1.2 && event.cancelable) event.preventDefault();
    if (atBottom && -dy > dx * 1.2 && event.cancelable) event.preventDefault();
  }, { passive: false });

  appMain.addEventListener("touchend", function() {
    const shouldRefresh = isPulling && pullDistance >= 65;
    resetPull();
    if (shouldRefresh) refreshSession();
  }, { passive: true });
  appMain.addEventListener("touchcancel", resetPull, { passive: true });

  refreshButton.addEventListener("click", refreshSession);
  window.addEventListener("resize", syncMobileViewport, { passive: true });
  if (window.visualViewport) window.visualViewport.addEventListener("resize", syncMobileViewport, { passive: true });
  if (mobileView.addEventListener) mobileView.addEventListener("change", syncMobileViewport);
  for (const field of [usernameInput, passwordInput]) {
    field.addEventListener("focus", function() {
      window.setTimeout(ensureFocusedInputVisible, 250);
    });
  }

  dropBtn.addEventListener("click", toggleLoginCard);

  const passwordVisibilityBtn = document.getElementById("password-visibility");
  const brandLogo = document.querySelector("#SK-logo img");
  if (brandLogo) {
    const hideMissingBrandLogo = () => { brandLogo.style.display = "none"; };
    brandLogo.addEventListener("error", hideMissingBrandLogo);
    if (brandLogo.complete && !brandLogo.naturalWidth) hideMissingBrandLogo();
  }
  passwordVisibilityBtn.addEventListener("click", function() {
    const visible = passwordInput.type === "text";
    passwordInput.type = visible ? "password" : "text";
    passwordVisibilityBtn.textContent = visible ? "Show" : "Hide";
    passwordVisibilityBtn.setAttribute("aria-pressed", String(!visible));
    passwordInput.focus({ preventScroll: true });
  });

  usernameInput.addEventListener("input", function(event) {
    event.target.value = cleanSkId(event.target.value);
  });

  loginForm.addEventListener("submit", function(event) {
    event.preventDefault();
    finishRefresh();

    setError("");
    setNotice("");

    const skId = cleanSkId(usernameInput.value);
    const password = String(passwordInput.value || "");

    usernameInput.value = skId;

    if (!isValidSkId(skId)) {
      setError("Enter a valid SK-ID in the AA0000 format.");
      showLoginCard();
      usernameInput.focus();
      return;
    }

    if (!password.trim()) {
      setError("Enter your password.");
      showLoginCard();
      passwordInput.focus();
      return;
    }

    setBusy(true, "Validating...");
    setNotice("Validating SK-ID...");
    activeRequestId = createRequestId("login");

    post("STAFF_LOGIN_REQUEST", {
      skId,
      password
    }, activeRequestId);
  });

  forgotBtn.addEventListener("click", function() {
    finishRefresh();
    setError("");
    setNotice("Opening password reset...");
    setBusy(true, "Please wait...");
    activeRequestId = createRequestId("reset");
    post("STAFF_FORGOT_PASSWORD", {}, activeRequestId);
  });

  window.addEventListener("message", function(event) {
    const data = event.data || {};
    const payload = data.payload || {};

    if (event.source !== window.parent) return;
    if (data.source !== PARENT_SOURCE) return;
    if (data.type === "SKANDI_MASTER_CONFIG") {
      const logo = document.querySelector('[data-master-logo="riaHeader"]');
      const logoUrl = String(payload?.brand?.assets?.logos?.riaHeader || "").trim();
      if (logo && logoUrl) logo.src = logoUrl;
      return;
    }
    if (data.requestId && activeRequestId && data.requestId !== activeRequestId) return;
    if (refreshing && data.requestId === refreshRequestId &&
        (data.type === "STAFF_LOGIN_OK" || data.type === "STAFF_LOGIN_ERROR" || data.type === "STAFF_LOGIN_NOTICE")) {
      finishRefresh();
    }

    if (data.type === "STAFF_LOGIN_PROGRESS") {
      showLoginCard();
      setError("");
      setNotice(payload.message || "Working...");
      setBusy(true, "Please wait...");
      return;
    }

    if (data.type === "STAFF_LOGIN_OK") {
      showLoginCard();
      setError("");
      passwordInput.value = "";
      setNotice(payload.message || "Signed in. Opening RIAINTRA...");
      setBusy(true, "Opening RIAINTRA...");
      return;
    }

    if (data.type === "STAFF_LOGIN_ERROR") {
      showLoginCard();
      setNotice("");
      setError(payload.message || "Login failed.");
      setBusy(false);
      activeRequestId = "";
      if (!mobileView.matches) passwordInput.focus();
      return;
    }

    if (data.type === "STAFF_LOGIN_NOTICE") {
      showLoginCard();
      setError("");
      setNotice(payload.message === "Secure staff login ready." ? "" : (payload.message || ""));
      setBusy(false);
      activeRequestId = "";
      return;
    }
  });

  updateClock();
  setInterval(updateClock, 1000);

  setBusy(false);
  syncMobileViewport();
  dropBtn.setAttribute("aria-controls", "login-card-wrap");
  post("MASTER_CONFIG_REQUEST", { context:"riaintra-login" });
  post("STAFF_LOGIN_READY", {});
})();
</script>
</body>
</html>
~~~
