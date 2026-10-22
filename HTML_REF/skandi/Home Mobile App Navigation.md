# INFO / LOG — SKANDI Home Mobile App Navigation

- SOURCE FILE: `/HTML_REF/skandi/Home Mobile App Navigation.md`
- DISPLAY/PAGE: Sitewide SKANDI customer mobile navigation (Home, Destinations, Travel Info, My Profile and additional public routes)
- SYSTEM: SKANDI
- ROUTE: all public SKANDI routes, excluding `/riaintra`, `/riaintra/*` and other internal paths
- WIX PAGE CONTROLLER: `/src/pages/masterPage.js` (navigation + visibility + geometry); `/src/pages/Home.n73w8.js` (Home-only focus and refresh)
- WIX HTML COMPONENT ID: `#skandiMobileAppNavEmbed` (sitewide master-layer); legacy Home-only `#homeMobileAppEmbed` must be removed from Wix after migration
- COMPONENT SOURCE: `SKANDI_HOME_MOBILE_APP`
- PARENT MESSAGE SOURCE: `SKANDI_WIX_PARENT`
- CANONICAL BACKEND (UNCHANGED): `backend/SKANDI_CORE/homeContent.web.js` → `homeContent.js` → existing Inventory/Supabase/provider ownership
- ALEXANDRA MOBILE: within `#skandiMobileAppNavEmbed` slide-out, using `SKANDI_SUPPORT_CHAT` → site `masterPage.js` → `public/alexandraGlobalBridge.js` → `backend/SKANDI_CORE/customerSupport.web.js` → `customerSupport.js` → `livekitServer.js` → existing LiveKit Agents worker `alexandra-prod`; Supabase cases via canonical customer support core.
- GLOBAL NAVIGATION OWNER (UNCHANGED): `/src/pages/masterPage.js`; `MASTER_NAVIGATE` and `MASTER_CONFIG_REQUEST` are pre-existing contracts.
- RELATION TO EXISTING HOME: Sitewide auxiliary Wix iframe; DOES NOT replace the `#htmlHome` HTML payload or `/HTML_REF/skandi/Home.md`.
- RELATION TO BOOKING: No `/booking` merge in this revision. V12 `/booking` remains canonical until Home Wix statebox/editor and controller migration.
- AUTHENTICATION / DATA AUTHORITY: No browser Supabase access, no new auth/provider APIs, no sensitive credential storage.
- STATUS: STATICALLY VERIFIED; REQUIRES LIVE TEST with Wix Studio global placement, mobile pinning, actual published navigation and Home live data.
- LAST VERIFIED: 2026-10-19, against current `skanditravels/SKANDI-TRAVELS` `main` Wix Home source and controller.

## CHANGE LOG
- 2026-10-22 — V12 mobile regular-header visibility repair: `src/pages/masterPage.js` now hides/collapses only the standard SKANDI customer header HTML component (`#skandiHeaderEmbed` / `#skandiCustomerHeaderEmbed`) on public mobile form-factor routes, while preserving the separate global `#skandiMobileTopCoverEmbed` (52px) and pinned `#skandiMobileAppNavEmbed` (88px closed; drawer resize unchanged). Desktop/tablet headers and existing RIAINTRA/ALTEA/global footer/cookie settings are unchanged. The entire intended mobile navigation HTML source below is preserved verbatim; NO live MobileNav embed replacement required. STATICALLY VERIFIED against exact GitHub `main` blob `a20302b633aee86effa2b2631f6c8095aede0add`. REQUIRES LIVE TEST after Wix publication and correct mobile-only breakpoint placement.

- 2026-10-19 — Initial new mobile Home app-nav embed. Branded bottom tab bar for Home, Book, Explore, My Trips and Account; Book relays focus to existing V12 Home HTML; refresh uses existing Home content gateway via V12 Home controller; inactive on desktop; no other system behavior altered.

- 2026-10-21 — V12.9 mobile bottom navigation: Home, Explore (`/destinations`), Travel Info (`/travel-info`), My Club (`/my-profile`) and Menu. Menu opens a left sliding customer-only drawer above the tab bar. Existing Book focus-search is retained in the drawer. Existing Home refresh, canonical routes, master navigation, mobile-only visibility and Home backend contracts are preserved. Home controller now owns authenticated iframe resize request/ack for `#homeMobileAppEmbed` (88px closed, mobile viewport-minus-16px expanded). No new backend or data models. Requires Wix Studio embed pinned to Page bottom at 100% width; Home-only scope, not global sitewide menu. STATICALLY VERIFIED; REQUIRES LIVE TEST in Wix Studio mobile preview and published site.

- 2026-10-21 — V12 sitewide migration: moved the approved five-tab mobile nav to global `#skandiMobileAppNavEmbed`; masterPage now owns all public-route visibility and drawer iframe resizing. Retained Home-only pull-to-refresh / search-focus via Home controller; automatic active-tab state for nested destination/travel info/My Profile routes. Existing HTML styling and drawer options preserved. Legacy Home-only component retired in Wix editor after migration.

- 2026-10-21 — V12 mobile Alexandra merge: Added animated 74px avatar entry and full functional AI chat, Customer Service follow-up form and support contacts inside the existing global navigation drawer. Reuses the same `SKANDI_SUPPORT_CHAT` message contract and canonical `alexandraGlobalBridge.js`/`customerSupport.web.js`/`alexandraWixAi.js` services as the desktop Alexandra, with shared per-browser-session transcript. No second mobile chat iframe, backend API, customer store or duplicated launcher. Existing five-tab mobile navigation, destinations, travel info, My Club, menu routes, Home refresh, slide-out and iPhone top cover are unchanged. Mobile Alexandra requires the full global nav iframe to open via existing `HOME_APP_DRAWER_RESIZE` flow; live Wix verification remains required.

- 2026-10-22 — V12 global mobile Menu opening diagnostic/repair: The parent now processes the sitewide mobile drawer resize request on public Studio responsive previews that do not report the `Mobile` runtime form factor (internal routes remain excluded). The iframe waits for an actually expanded layout before exposing the Alexandra/drawer interface and reports a real, actionable Wix pinned-host sizing failure rather than treating a Velo resize ACK as proof of visibility. Existing navigation, Alexandra/Customer Service contracts, desktop UI, default closed height (88px) and all prior HTML payload content preserved. An iframe confined in an 88px footer or clipped host **cannot render the full drawer**; Wix positioning must allow the full iframe to expand upwards. STATICALLY VERIFIED; REQUIRES LIVE TEST on published iPhone and Studio.

- 2026-10-22 — V12 mobile navigation status presentation repair: the bottom tab bar no longer displays loading, timeout, resize or error notices over its five buttons. The existing `aria-live` region remains visually hidden for accessibility, and the refresh control remains keyboard-inaccessible when hidden. A Wix-acknowledged resize that leaves the iframe at 88px now logs its actionable host-layout blocker to the browser console instead of overlaying the nav. This change deliberately does **not** claim to make a Wix-constrained 88px iframe expand: the `#skandiMobileAppNavEmbed` editor element must be pinned to **Page**, outside `#skandiFooter` and all height-limited or clipping ancestors, at 100% mobile width with scaling disabled. The actual Menu drawer, Alexandra AI chat, sitewide routing, Wix message contracts, desktop/footer code, and all prior repairs are retained. STATICALLY VERIFIED; REQUIRES LIVE TEST in Wix Studio and on a published phone.

- 2026-10-22 — V12 Alexandra LiveKit restoration: Reuses the approved `startAlexandraLiveKitSession` facade and canonical `customerSupport.js` → `livekitServer.js` explicit dispatch of `alexandra-prod`. Mobile inline chat now joins using a server-issued short-lived token; sends `lk.chat` text; receives agent output from `lk.transcription` (and compatible custom `lk.chat` streams), disconnects when the drawer closes, and preserves browser-tab transcript via the shared bridge. No changes to mobile navigation layout, menu geometry, Home refresh, routes or human support case creation. LiveKit worker deployment, cloud secrets, published Wix facade and iframe CDN loading REQUIRES LIVE TEST.

## COMPLETE INTENDED LIVE HTML SOURCE

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="color-scheme" content="light">
<meta name="theme-color" content="#ffffff">
<title>SKANDI Travels · Sitewide Mobile Navigation</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
:root{color-scheme:light;--navy:#022e64;--cyan:#5fc7cf;--ink:#122744;--muted:#60748a;--line:#dfe7f0;--base:#ffffff;--safe-bottom:env(safe-area-inset-bottom,0px)}
*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden;overscroll-behavior:none;background:transparent;font-family:Montserrat,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;-webkit-text-size-adjust:100%;touch-action:pan-x pan-y}
body{display:flex;justify-content:stretch;align-items:flex-end;color:var(--ink)}button{font-family:inherit}button,svg{-webkit-tap-highlight-color:transparent}
#app-nav{width:100%;position:relative;min-height:88px;padding:8px 6px max(10px,var(--safe-bottom));background:rgba(255,255,255,.975);border-top:1px solid var(--line);box-shadow:0 -8px 24px rgba(2,46,100,.09);display:grid;grid-template-columns:repeat(5,minmax(0,1fr));align-items:stretch;gap:1px;isolation:isolate}
.nav-item{appearance:none;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;min-height:63px;border:0;border-radius:12px;color:#58708e;background:transparent;cursor:pointer;font-weight:700;font-size:10px;letter-spacing:-.01em;white-space:nowrap;user-select:none}
.nav-item svg{width:23px;height:23px;flex:none;stroke:currentColor;stroke-width:1.85;stroke-linecap:round;stroke-linejoin:round;fill:none}
.nav-item.active{color:var(--navy);background:#edf4fa}
.nav-item.active .nav-label{font-weight:800}
.nav-item:active{transform:scale(.97)}.nav-item:focus-visible,#refresh:focus-visible{outline:2px solid var(--cyan);outline-offset:-2px}
/* Accessible announcements only. Never place loading/error messages above the five navigation buttons. */
#status,#status.show,#status.error,#status.busy{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;border:0!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;clip-path:inset(50%)!important;white-space:nowrap!important;pointer-events:none!important;box-shadow:none!important;opacity:1!important;visibility:visible!important;transform:none!important}
#status-spinner,#status.busy #status-spinner{display:none!important}
#refresh{display:none!important}
#pull-zone{position:absolute;top:0;left:0;right:0;height:18px;touch-action:pan-x;z-index:4}
#pull-zone:before{content:"";display:block;margin:3px auto;width:32px;height:3px;border-radius:6px;background:#dce4ed}
/* The drawer occupies only the space ABOVE the existing bottom tab bar. Wix Velo expands the pinned iframe on request. */
#drawer-layer{position:fixed;inset:0 0 88px;z-index:8;opacity:0;visibility:hidden;pointer-events:none;transition:opacity .22s ease,visibility .22s ease}
#drawer-layer.open{opacity:1;visibility:visible;pointer-events:auto}
#drawer-backdrop{position:absolute;inset:0;width:100%;border:0;background:rgba(1,17,34,.52);cursor:pointer}
#app-drawer{position:absolute;inset:0 auto 0 0;width:min(85%,350px);display:flex;flex-direction:column;background:#fff;box-shadow:8px 0 32px rgba(2,46,100,.18);transform:translateX(-105%);transition:transform .24s cubic-bezier(.2,.72,.22,1);outline:none}
#drawer-layer.open #app-drawer{transform:translateX(0)}
.drawer-head{padding:24px 18px 17px;display:flex;align-items:center;justify-content:space-between;gap:12px;border-bottom:1px solid var(--line);background:linear-gradient(145deg,#fff,#f3f8fa)}
.drawer-eyebrow{font-size:9px;font-weight:800;letter-spacing:.18em;color:#538895}
.drawer-head h2{margin:5px 0 0;font-size:19px;line-height:1.1;letter-spacing:-.04em;color:var(--navy)}
#drawer-close{flex:0 0 36px;width:36px;height:36px;border:1px solid #dde6ed;background:#fff;border-radius:10px;color:var(--navy);display:grid;place-items:center;cursor:pointer}
#drawer-close svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round}
.drawer-scroll{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;padding:8px 10px 22px}
.drawer-group-title{margin:17px 8px 6px;color:#647b90;font-size:10px;font-weight:800;letter-spacing:.10em;text-transform:uppercase}
.drawer-link{display:flex;align-items:center;justify-content:space-between;text-align:left;width:100%;min-height:46px;padding:10px 12px;border:0;border-radius:9px;background:transparent;color:var(--ink);font-family:inherit;font-size:13px;font-weight:650;cursor:pointer}
.drawer-link span{color:#7195ab;font-size:24px;font-weight:400;line-height:1}
.drawer-link:hover,.drawer-link:focus-visible{outline:none;background:#edf4fa;color:var(--navy)}
#drawer-close:focus-visible,.nav-item:focus-visible{outline:2px solid var(--cyan);outline-offset:-2px}
#app-nav{z-index:9;flex:0 0 auto}
/* Alexandra shares the sitewide iframe, drawer and canonical V12 LiveKit/Support bridge. */
.alexandra-entry{display:flex;align-items:center;gap:11px;width:100%;padding:12px 8px;border:1px solid #dce9ee;border-radius:12px;background:linear-gradient(125deg,#f5fcfd,#edf5f8);color:#022e64;text-align:left;min-height:92px}
.alexandra-avatar{position:relative;display:block;flex:0 0 74px;width:74px;height:74px;border:2px solid #9de0e5;border-radius:50%;background:linear-gradient(135deg,#074379,#022e64);overflow:hidden;box-shadow:0 8px 24px rgba(2,46,100,.16)}
.alexandra-avatar video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none}
.alexandra-entry-copy{display:flex;flex:1;min-width:0;flex-direction:column;gap:4px}.alexandra-entry-copy strong{font-size:13px;font-weight:800}.alexandra-entry-copy small{font-size:10px;color:#317182;font-weight:700}.alexandra-entry-copy span{font-size:10px;line-height:1.35;color:#647b90}
.alexandra-chevron{font-size:26px;color:#598ba2}
#app-drawer.chat-mode #drawer-menu-view{display:none}#alexandra-chat-view[hidden]{display:none!important}#app-drawer.chat-mode #alexandra-chat-view{display:flex}
#alexandra-chat-view{flex:1;min-height:0;overflow:hidden;flex-direction:column;background:#fbfaf6;color:#16283c}
.alexandra-chat-heading{display:flex;align-items:center;gap:9px;padding:11px 12px;border-bottom:1px solid #dde9ed;background:#f3f8f9;flex:none;flex-wrap:wrap}
.alexandra-chat-heading strong{font-size:15px;color:#022e64}.alexandra-chat-heading span{font-size:9px;color:#547485;margin-left:auto}
#alexandra-back{padding:6px 9px;border-radius:8px;background:#e5eff4;color:#022e64;font-size:11px;font-weight:800;min-height:34px}
.alexandra-disclaimer{flex:none;padding:7px 11px;border-bottom:1px solid #dde3e8;font-size:10px;line-height:1.35;color:#596c7d;background:#f0f7f7}
.alexandra-messages{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;display:flex;flex-direction:column;gap:9px;padding:12px}
.alexandra-bubble{align-self:flex-start;max-width:96%;border:1px solid #dbe4e7;border-radius:13px 13px 13px 3px;background:#fff;color:#273a4b;padding:9px 10px;font-size:12px;line-height:1.55;white-space:pre-wrap;overflow-wrap:anywhere}
.alexandra-bubble.customer{align-self:flex-end;border-radius:13px 13px 3px 13px;background:#022e64;border-color:#022e64;color:#fff}.alexandra-bubble small{display:block;margin-bottom:4px;font-size:9px;font-weight:800;opacity:.72}
.alexandra-status{min-height:18px;flex:none;padding:2px 11px;font-size:10px;color:#527584}.alexandra-status.error{color:#983c37}
.alexandra-compose{flex:none;display:flex;gap:6px;padding:8px 8px 4px;background:#fff;border-top:1px solid #dde3e8}
.alexandra-compose textarea{flex:1;min-width:0;min-height:42px;max-height:100px;padding:9px;border:1px solid #cbd7de;border-radius:10px;resize:vertical;background:#fbfaf6;font-size:16px;color:#17283a}
.alexandra-compose button,.alexandra-case-form button{padding:0 12px;min-height:42px;border-radius:10px;background:#022e64;color:#fff;font-size:11px;font-weight:800}.alexandra-compose button:disabled,.alexandra-case-form button:disabled{opacity:.55}
.alexandra-actions{flex:none;display:grid;grid-template-columns:1fr 1fr;gap:5px;padding:7px 9px max(9px,env(safe-area-inset-bottom,0px));border-bottom:1px solid #dde3e8;background:#fff}
.alexandra-actions button,.alexandra-actions a{min-height:33px;display:flex;align-items:center;justify-content:center;text-decoration:none;background:#eaf3f4;color:#022e64;border:1px solid #d2e0e4;border-radius:8px;font-size:10px;font-weight:800}
.alexandra-case-form[hidden]{display:none!important}.alexandra-case-form{flex:none;max-height:60%;overflow:auto;padding:10px;background:#f4f6f7}.alexandra-case-form strong{font-size:13px}.alexandra-case-form p{font-size:10px;line-height:1.4;color:#536c7b;margin:6px 0}.alexandra-case-form label{display:block;font-size:11px;font-weight:800;margin:7px 0}
.alexandra-case-form input,.alexandra-case-form textarea{display:block;margin-top:4px;width:100%;padding:9px;border:1px solid #cad8e2;border-radius:7px;font-size:16px;color:#17283a;background:#fff}.alexandra-case-form button{width:100%;margin-top:6px}
@media(max-height:520px){.alexandra-disclaimer{display:none}.alexandra-actions{padding-top:3px;padding-bottom:3px}.alexandra-actions button,.alexandra-actions a{min-height:28px}}
@media(prefers-reduced-motion:reduce){#app-drawer,#drawer-layer{transition:none!important}}
@keyframes spin{to{transform:rotate(360deg)}}
@media(max-width:350px){#app-nav{padding-left:3px;padding-right:3px}.nav-item{font-size:9px;gap:4px}}
@media(prefers-reduced-motion:reduce){*,*:before,*:after{animation:none!important;transition:none!important;scroll-behavior:auto!important}}
</style>
</head>
<body>
<div id="drawer-layer" aria-hidden="true">
  <button id="drawer-backdrop" type="button" tabindex="-1" aria-label="Close menu"></button>
  <aside id="app-drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title" tabindex="-1">
    <div class="drawer-head"><div><span class="drawer-eyebrow">SKANDI TRAVELS</span><h2 id="drawer-title">Explore SKANDI</h2></div><button id="drawer-close" type="button" aria-label="Close menu"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5 19 19M19 5 5 19"/></svg></button></div>
    <div class="drawer-scroll" id="drawer-menu-view">
      <div class="drawer-group-title">Alexandra · Digital Customer Service</div>
      <button type="button" id="alexandra-entry" class="alexandra-entry" aria-label="Chat with Alexandra">
        <span class="alexandra-avatar"><video autoplay muted loop playsinline aria-hidden="true"><source src="https://muvpffdnugzxjbnbpgac.supabase.co/storage/v1/object/public/skandi-public-assets/MP4/SKANDI_ALEXANDRA_AVATAR_LOOP_WHITE-BACKGROUND_01.mp4" type="video/mp4"></video></span>
        <span class="alexandra-entry-copy"><strong>Chat with Alexandra</strong><small>SKANDI AI Travel Assistant</small><span>Get travel help or contact Customer Service</span></span>
        <span class="alexandra-chevron" aria-hidden="true">›</span>
      </button>
      <div class="drawer-group-title">Book &amp; Travel</div>
      <button type="button" class="drawer-link" data-focus-search="true">Book a trip <span aria-hidden="true">›</span></button>
      <button type="button" class="drawer-link" data-route="flights">Flights <span aria-hidden="true">›</span></button>
      <button type="button" class="drawer-link" data-route="hotels">Hotels <span aria-hidden="true">›</span></button>
      <button type="button" class="drawer-link" data-route="packages">Flight + Hotel <span aria-hidden="true">›</span></button>
      <button type="button" class="drawer-link" data-route="cruises">Cruises <span aria-hidden="true">›</span></button>
      <button type="button" class="drawer-link" data-route="carRental">Car Rental <span aria-hidden="true">›</span></button>
      <button type="button" class="drawer-link" data-route="tours">Tours &amp; Activities <span aria-hidden="true">›</span></button>
      <div class="drawer-group-title">My SKANDI</div>
      <button type="button" class="drawer-link" data-route="myTrips">My Trips <span aria-hidden="true">›</span></button>
      <button type="button" class="drawer-link" data-route="myProfile">My Club <span aria-hidden="true">›</span></button>
      <div class="drawer-group-title">Information &amp; Support</div>
      <button type="button" class="drawer-link" data-route="offers">Offers <span aria-hidden="true">›</span></button>
      <button type="button" class="drawer-link" data-route="support">Customer Service <span aria-hidden="true">›</span></button>
    </div>
    <section id="alexandra-chat-view" aria-label="Alexandra chat" hidden>
      <div class="alexandra-chat-heading">
        <button type="button" id="alexandra-back" aria-label="Return to navigation">‹ Menu</button>
        <strong>Alexandra</strong><span>SKANDI AI Customer Service</span>
      </div>
      <div class="alexandra-disclaimer">General travel assistance. Do not share passwords, card details, passport information or other sensitive data.</div>
      <main id="alexandra-messages" class="alexandra-messages" role="log" aria-live="polite"></main>
      <div id="alexandra-status" class="alexandra-status" role="status" aria-live="polite"></div>
      <form id="alexandra-compose" class="alexandra-compose">
        <textarea id="alexandra-question" aria-label="Message Alexandra" placeholder="Ask Alexandra about travel..." rows="2" maxlength="1700" required></textarea>
        <button type="submit" id="alexandra-send">Send</button>
      </form>
      <div class="alexandra-actions">
        <button type="button" id="alexandra-support">My Support</button>
        <button type="button" id="alexandra-followup">Request follow-up</button>
        <a href="https://wa.me/17112160382" target="_blank" rel="noopener noreferrer">WhatsApp</a>
        <a href="tel:+19516207875">Call SKANDI</a>
      </div>
      <form id="alexandra-case-form" class="alexandra-case-form" hidden>
        <strong>Customer Service follow-up</strong>
        <p>We create a case only after receiving system confirmation. Do not send payment or identity documents.</p>
        <label>Name<input id="alexandra-case-name" maxlength="120" autocomplete="name" required></label>
        <label>Email<input id="alexandra-case-email" type="email" maxlength="254" autocomplete="email" required></label>
        <label>Subject<input id="alexandra-case-subject" maxlength="160" value="Travel assistance request" required></label>
        <label>Details<textarea id="alexandra-case-details" maxlength="2400" rows="3" required></textarea></label>
        <button type="submit" id="alexandra-case-submit">Submit support request</button>
      </form>
    </section>
  </aside>
</div>
<nav id="app-nav" aria-label="SKANDI mobile app navigation">
  <div id="pull-zone" role="presentation"></div>
  <button class="nav-item active" id="nav-home" type="button" data-action="home" aria-current="page">
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/></svg><span class="nav-label">Home</span>
  </button>
  <button class="nav-item" id="nav-explore" type="button" data-action="explore">
    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m15 9-2 6-4 1 1-4z"/></svg><span class="nav-label">Explore</span>
  </button>
  <button class="nav-item" id="nav-travel-info" type="button" data-action="travelInfo">
    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.6h.01"/></svg><span class="nav-label">Travel Info</span>
  </button>
  <button class="nav-item" id="nav-my-club" type="button" data-action="myProfile">
    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.5 3.5-7 8-7s8 2.5 8 7"/></svg><span class="nav-label">My Club</span>
  </button>
  <button class="nav-item" id="nav-menu" type="button" data-action="menu" aria-haspopup="dialog" aria-controls="app-drawer" aria-expanded="false" aria-label="Open menu">
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg><span class="nav-label">Menu</span>
  </button>
  <div id="status" role="status" aria-live="polite" aria-atomic="true"><span id="status-spinner" aria-hidden="true"></span><span id="status-copy"></span><button id="refresh" type="button" tabindex="-1" aria-hidden="true" aria-label="Refresh Home data" title="Refresh Home data"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11a8 8 0 1 0 1 3M20 4v7h-7"/></svg></button></div>
</nav>
<script src="https://cdn.jsdelivr.net/npm/livekit-client@2.23.0/dist/livekit-client.umd.min.js"></script>
<script>
(function(){
  "use strict";
  const SOURCE="SKANDI_HOME_MOBILE_APP",PARENT="SKANDI_WIX_PARENT";
  const $=id=>document.getElementById(id);
  const defaultRoutes=Object.freeze({home:"/",destinations:"/destinations",travelInfo:"/travel-info",myTrips:"/my-profile?tab=trips",myProfile:"/my-profile",flights:"/flights",hotels:"/hotels",packages:"/packages",cruises:"/cruises",carRental:"/car-rental",tours:"/tours",offers:"/offers",support:"/about/support"});
  const state={routes:{...defaultRoutes},busy:false,refreshId:"",ready:false,feedbackTimer:null,request:0,drawerOpen:false,drawerRequestId:"",drawerTimer:null,currentPath:"/"};
  const status=document.getElementById("status"),statusCopy=document.getElementById("status-copy");
  const nav=document.getElementById("app-nav"),refresh=document.getElementById("refresh");
  const drawerLayer=document.getElementById("drawer-layer"),drawer=document.getElementById("app-drawer"),menuButton=document.getElementById("nav-menu");
  const chat=$("alexandra-chat-view"),chatStatus=$("alexandra-status"),chatMessages=$("alexandra-messages"),chatQuestion=$("alexandra-question");
  const chatState={sessionId:"",messages:[],history:[],pending:false,casePending:false,requestId:"",responseTimer:null,caseTimer:null,loggedIn:false,connected:false,responseSeen:false};
  let liveRoom=null,liveEpoch=0,liveConnecting=null;
  function nextId(kind){state.request+=1;return kind+"-"+Date.now()+"-"+state.request;}
  function post(type,payload={},requestId=""){
    const message={source:SOURCE,type,payload,timestamp:new Date().toISOString()};
    if(requestId)message.requestId=requestId;
    window.parent.postMessage(message,"*");
  }
  function route(key){const value=String(state.routes[key]||defaultRoutes[key]||"");return value.startsWith("/")&&!value.startsWith("//")?value:"";}
  // Same wire contract and service ownership as Alexandra's existing desktop chat.
  function postChat(type,payload={}){
    window.parent.postMessage({source:"SKANDI_SUPPORT_CHAT",type,requestId:payload.requestId||"",payload},"*");
  }
  function chatNotice(message,bad=false){chatStatus.textContent=String(message||"");chatStatus.classList.toggle("error",bad);}
  function chatBusy(value){chatState.pending=value;$("alexandra-send").disabled=value||!chatState.connected;chatQuestion.disabled=value||!chatState.connected;}
  function chatSay(role,message,save=true){
    const content=String(message||"").slice(0,1900);if(!content)return;
    const bubble=document.createElement("div");bubble.className="alexandra-bubble"+(role==="user"?" customer":"");
    const from=document.createElement("small");from.textContent=role==="user"?"You":"Alexandra";
    const body=document.createElement("div");body.textContent=content;
    bubble.append(from,body);chatMessages.append(bubble);chatMessages.scrollTop=chatMessages.scrollHeight;
    if(save){chatState.messages.push({role,content});chatState.messages=chatState.messages.slice(-18);chatSnapshot();}
  }
  function chatSnapshot(){postChat("SUPPORT_CHAT_SNAPSHOT",{messages:chatState.messages.slice(-18),history:chatState.history.slice(-8)});}
  function liveDisconnect(){
    liveEpoch++;
    const old=liveRoom;liveRoom=null;liveConnecting=null;chatState.connected=false;
    clearTimeout(chatState.responseTimer);chatBusy(false);
    try{old?.disconnect();}catch(_){}
  }
  async function liveConnect(session){
    liveDisconnect();
    const epoch=liveEpoch, sdk=window.LivekitClient;
    if(!sdk?.Room||!session?.url||!session?.token||!session?.sessionId){chatNotice("Alexandra's LiveKit connection is unavailable.",true);return;}
    const room=new sdk.Room({adaptiveStream:true,dynacast:true});
    liveRoom=room;
    const receive=async(reader,participant)=>{
      if(epoch!==liveEpoch||!liveRoom)return;
      if(participant?.identity===room.localParticipant?.identity)return;
      try{
        const message=String(await reader.readAll()||"").trim().slice(0,1900);
        if(!message||epoch!==liveEpoch||liveRoom!==room)return;
        chatState.responseSeen=true;
        clearTimeout(chatState.responseTimer);chatBusy(false);
        chatSay("assistant",message);chatState.history.push({role:"assistant",content:message});chatState.history=chatState.history.slice(-8);
        chatSnapshot();chatNotice("");
      }catch(error){if(epoch===liveEpoch)chatNotice("Alexandra's reply could not be read. Please retry.",true);}
    };
    room.registerTextStreamHandler("lk.transcription",receive);
    // Also accept custom agent text on lk.chat, if the installed worker emits it.
    room.registerTextStreamHandler("lk.chat",receive);
    room.on(sdk.RoomEvent.Disconnected,()=>{
      if(epoch!==liveEpoch)return;
      chatState.connected=false;chatBusy(false);
      chatNotice("Alexandra disconnected. Return to Menu and reopen to reconnect.",true);
    });
    try{
      liveConnecting=room.connect(session.url,session.token);
      await liveConnecting;
      if(epoch!==liveEpoch){room.disconnect();return;}
      chatState.connected=true;chatBusy(false);chatNotice("");
    }catch(error){if(epoch===liveEpoch){chatState.connected=false;chatBusy(false);chatNotice("Could not connect to Alexandra's LiveKit room. Please reopen chat.",true);}}
    finally{if(epoch===liveEpoch)liveConnecting=null;}
  }
  function showChat(){
    if(!state.drawerOpen)return;
    drawer.classList.add("chat-mode");chat.hidden=false;$("drawer-title").textContent="SKANDI Support";
    chatState.connected=false;chatBusy(false);chatNotice("Connecting to Alexandra...");
    postChat("SUPPORT_CHAT_START_ALEXANDRA",{requestId:nextId("alexandra-open")});
  }
  function backToMenu(){
    liveDisconnect();postChat("SUPPORT_CHAT_PANEL_CLOSE");
    drawer.classList.remove("chat-mode");chat.hidden=true;$("drawer-title").textContent="Explore SKANDI";
    $("alexandra-case-form").hidden=true;$("alexandra-entry").focus({preventScroll:true});
  }
  function chatOpened(data={}){
    if(!state.drawerOpen||chat.hidden){postChat("SUPPORT_CHAT_PANEL_CLOSE");return;}
    const newSession=data?.alexandraSession;
    if(!newSession?.sessionId||!newSession?.token||!newSession?.url){chatNotice("LiveKit did not return a usable connection.",true);return;}
    const reset=chatState.sessionId!==newSession.sessionId;
    chatState.sessionId=String(newSession.sessionId);chatState.loggedIn=data.loggedIn===true;
    if(reset){
      chatState.messages=[];chatState.history=[];chatMessages.replaceChildren();
      if(Array.isArray(data.messages)&&data.messages.length){
        for(const m of data.messages.slice(-18))if(m&&["user","assistant"].includes(m.role))chatSay(m.role,m.content,false);
        chatState.messages=data.messages.slice(-18).filter(m=>m&&["user","assistant"].includes(m.role));
        chatState.history=Array.isArray(data.history)?data.history.slice(-8):[];
      }else chatSay("assistant","Welcome to SKANDI Travels. I'm Alexandra, your AI travel assistant. How can I help?");
    }
    chatSnapshot();void liveConnect(newSession);
  }
  $("alexandra-entry").addEventListener("click",showChat);
  $("alexandra-back").addEventListener("click",backToMenu);
  $("alexandra-compose").addEventListener("submit",async event=>{
    event.preventDefault();const message=chatQuestion.value.trim();
    if(!message||chatState.pending)return;
    if(!chatState.connected||!liveRoom){chatNotice("Alexandra is not connected. Reopen chat to try again.",true);return;}
    const requestId=nextId("alexandra-msg");chatState.requestId=requestId;
    chatState.responseSeen=false;chatBusy(true);chatNotice("Sending to Alexandra...");
    try{
      await liveRoom.localParticipant.sendText(message,{topic:"lk.chat"});
      if(chatState.requestId!==requestId)return;
      chatSay("user",message);chatQuestion.value="";
      chatState.history.push({role:"user",content:message});chatState.history=chatState.history.slice(-8);chatSnapshot();
      if(!chatState.responseSeen){
        chatNotice("Alexandra is preparing a response...");
        clearTimeout(chatState.responseTimer);
        chatState.responseTimer=setTimeout(()=>{if(chatState.pending&&chatState.requestId===requestId){chatBusy(false);chatNotice("Alexandra did not respond. You can try again.",true);}},35000);
      }
    }catch(error){if(chatState.requestId===requestId){chatBusy(false);chatNotice("Message not sent through LiveKit. Please retry.",true);}}
  });
  $("alexandra-support").addEventListener("click",()=>postChat("SUPPORT_CHAT_NAVIGATE",{path:chatState.loggedIn?"/my-profile?section=support&view=cases":"/about/support"}));
  $("alexandra-followup").addEventListener("click",()=>{$("alexandra-case-form").hidden=!$("alexandra-case-form").hidden;
    if(!$("alexandra-case-details").value)$("alexandra-case-details").value="I would like assistance from SKANDI Customer Service.";
  });
  $("alexandra-case-form").addEventListener("submit",event=>{
    event.preventDefault();if(chatState.casePending)return;
    chatState.casePending=true;$("alexandra-case-submit").disabled=true;chatNotice("Submitting your request...");
    clearTimeout(chatState.caseTimer);
    chatState.caseTimer=setTimeout(()=>{if(chatState.casePending){chatState.casePending=false;$("alexandra-case-submit").disabled=false;chatNotice("SKANDI did not confirm the request. Check My Support before retrying.",true)}},35000);
    const fullName=$("alexandra-case-name").value.trim(),names=fullName.split(/\s+/);
    postChat("SUPPORT_CHAT_SUBMIT_FORM",{requestId:nextId("alexandra-case"),input:{firstName:names[0]||"",lastName:names.slice(1).join(" "),fullName,email:$("alexandra-case-email").value.trim(),subject:$("alexandra-case-subject").value.trim(),message:$("alexandra-case-details").value.trim(),category:"general"}});
  });
  const avatarVideo=$("alexandra-entry").querySelector("video");
  if(avatarVideo){avatarVideo.playbackRate=.75;avatarVideo.addEventListener("ratechange",()=>{if(avatarVideo.playbackRate!==.75)avatarVideo.playbackRate=.75});}
  function handleChatParentMessage(data){
    const p=data.payload||{};
    switch(data.type){
      case "SUPPORT_CHAT_OPEN":chatOpened(p);return true;
      case "SUPPORT_CHAT_CASE_CREATED":
        clearTimeout(chatState.caseTimer);chatState.casePending=false;$("alexandra-case-submit").disabled=false;
        if(p.caseId||p.caseRef){$("alexandra-case-form").hidden=true;chatNotice("Case submitted: "+(p.caseRef||p.caseId));}
        else chatNotice("The server did not confirm the case.",true);return true;
      case "SUPPORT_CHAT_ERROR":
        clearTimeout(chatState.caseTimer);
        chatState.casePending=false;$("alexandra-case-submit").disabled=false;
        chatNotice(p.message||"Request failed.",true);return true;
      default:return false;
    }
  }
  function notice(text,opts={}){
    clearTimeout(state.feedbackTimer);
    statusCopy.textContent=String(text||"").slice(0,170);
    status.classList.toggle("busy",Boolean(opts.busy));
    status.classList.toggle("error",Boolean(opts.error));
    status.classList.toggle("show",Boolean(text));
    refresh.disabled=Boolean(opts.busy);
    if(text&&!opts.busy)state.feedbackTimer=setTimeout(()=>notice(""),opts.duration||3600);
  }
  function setActive(name){
    nav.querySelectorAll(".nav-item").forEach(button=>{
      const active=button.dataset.action===name;
      button.classList.toggle("active",active);
      if(active)button.setAttribute("aria-current","page");else button.removeAttribute("aria-current");
    });
  }
  function showBook(){
    if(state.busy)return;
    if(state.drawerOpen)closeDrawer();
    post("HOME_APP_FOCUS_SEARCH",{},nextId("focus"));
  }
  function openDrawer(){
    if(state.busy||state.drawerOpen||state.drawerRequestId)return;
    state.drawerRequestId=nextId("drawer-open");
    post("HOME_APP_DRAWER_RESIZE",{open:true},state.drawerRequestId);
    clearTimeout(state.drawerTimer);
    state.drawerTimer=setTimeout(()=>{
      if(!state.drawerRequestId)return;
      state.drawerRequestId="";
      notice("The menu could not open. Please try again.",{error:true});
    },4000);
  }
  function closeDrawer(){
    if(!state.drawerOpen&&!state.drawerRequestId)return;
    clearTimeout(state.drawerTimer);
    state.drawerRequestId="";
    const wasOpen=state.drawerOpen;
    if(!chat.hidden){liveDisconnect();postChat("SUPPORT_CHAT_PANEL_CLOSE");}
    state.drawerOpen=false;
    drawerLayer.classList.remove("open");
    drawerLayer.setAttribute("aria-hidden","true");
    drawer.classList.remove("chat-mode");chat.hidden=true;$("drawer-title").textContent="Explore SKANDI";
    menuButton.setAttribute("aria-expanded","false");
    menuButton.setAttribute("aria-label","Open menu");
    if(wasOpen){post("HOME_APP_DRAWER_RESIZE",{open:false},nextId("drawer-close"));menuButton.focus({preventScroll:true});}
  }
  function drawerReady(){
    clearTimeout(state.drawerTimer);
    const requestId=state.drawerRequestId;
    if(!requestId)return;
    let attempts=0;
    function verifyExpandedFrame(){
      if(state.drawerRequestId!==requestId)return;
      // An ACK confirms the requested Wix height, NOT the rendered iframe geometry.
      // In particular, an 88px footer/cell can clip the whole drawer.
      if(window.innerHeight >= 220){
        state.drawerRequestId="";
        state.drawerOpen=true;
        drawerLayer.classList.add("open");
        drawerLayer.setAttribute("aria-hidden","false");
        menuButton.setAttribute("aria-expanded","true");
        menuButton.setAttribute("aria-label","Close menu");
        document.getElementById("drawer-close").focus({preventScroll:true});
        return;
      }
      if(++attempts<14){setTimeout(verifyExpandedFrame,95);return;}
      state.drawerRequestId="";
      post("HOME_APP_DRAWER_RESIZE",{open:false},nextId("drawer-layout-reset"));
      console.warn("[SKANDI Mobile Nav] The iframe is still 88px after Wix acknowledged resize. Move #skandiMobileAppNavEmbed outside #skandiFooter, pin it to Page with bottom 0, disable proportional scaling, and remove any 88px parent/max-height constraint.");
    }
    requestAnimationFrame(verifyExpandedFrame);
  }
  function refreshHome(){
    if(state.busy||state.currentPath!=="/")return;
    state.busy=true;
    state.refreshId=nextId("refresh");
    notice("Updating Home content…",{busy:true});
    post("HOME_APP_REFRESH",{},state.refreshId);
  }
  function navigate(key,activeAction=""){
    if(state.busy)return;
    const path=route(key);
    if(!path){notice("This page is currently unavailable.",{error:true});return;}
    if(state.drawerOpen)closeDrawer();
    if(activeAction)setActive(activeAction);
    if(path===state.currentPath||key==="home"&&state.currentPath==="/"){state.busy=false;return;}
    state.busy=true;
    notice("Opening…",{busy:true});
    post("MASTER_NAVIGATE",{path},nextId("nav"));
    setTimeout(()=>{if(state.busy&&!state.refreshId){state.busy=false;notice("Navigation could not be confirmed. Try again.",{error:true});}},8500);
  }
  nav.addEventListener("click",event=>{
    const button=event.target.closest("button[data-action]");
    if(!button)return;
    const action=button.dataset.action;
    if(action==="menu"){if(state.drawerOpen)closeDrawer();else openDrawer();return;}
    if(action==="home")return navigate("home","home");
    if(action==="explore")return navigate("destinations","explore");
    if(action==="travelInfo")return navigate("travelInfo","travelInfo");
    if(action==="myProfile")return navigate("myProfile","myProfile");
  });
  document.getElementById("drawer-close").addEventListener("click",closeDrawer);
  document.getElementById("drawer-backdrop").addEventListener("click",closeDrawer);
  drawer.querySelectorAll(".drawer-link").forEach(button=>button.addEventListener("click",()=>{
    if(button.dataset.focusSearch==="true"){showBook();return;}
    const key=button.dataset.route;
    if(key)navigate(key);
  }));
  document.addEventListener("keydown",event=>{
    if(!state.drawerOpen)return;
    if(event.key==="Escape"){event.preventDefault();closeDrawer();return;}
    if(event.key!=="Tab")return;
    const focusables=[...drawer.querySelectorAll("button:not([disabled]):not([hidden]),a[href],textarea:not([disabled]),input:not([disabled])")].filter(el=>el.getClientRects().length);
    const first=focusables[0],last=focusables[focusables.length-1];
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  });
  refresh.addEventListener("click",refreshHome);
  let touchStart=null;
  document.getElementById("pull-zone").addEventListener("touchstart",event=>{
    if(event.touches.length!==1||state.busy)return;
    touchStart={x:event.touches[0].clientX,y:event.touches[0].clientY};
  },{passive:true});
  document.getElementById("pull-zone").addEventListener("touchend",event=>{
    if(!touchStart||!event.changedTouches.length)return;
    const dx=event.changedTouches[0].clientX-touchStart.x;
    const dy=event.changedTouches[0].clientY-touchStart.y;
    touchStart=null;
    if(state.currentPath==="/"&&dy>42&&Math.abs(dy)>Math.abs(dx)*1.2)refreshHome();
  },{passive:true});
  window.addEventListener("message",event=>{
    if(event.source!==window.parent)return;
    let data=event.data;
    if(typeof data==="string"){try{data=JSON.parse(data);}catch(_){return;}}
    if(!data||data.source!==PARENT)return;
    if(handleChatParentMessage(data))return;
    if(data.type==="SKANDI_MASTER_CONFIG"){
      const r=data.payload?.routes;
      if(r&&typeof r==="object")state.routes={...state.routes,...r};
      const path=data.payload?.currentPath;
      if(typeof path==="string"&&path.startsWith("/")){
        state.currentPath=path;
        setActive(path==="/"?"home":(path==="/destinations"||path.startsWith("/destinations/"))?"explore":(path==="/travel-info"||path.startsWith("/travel-info/"))?"travelInfo":(path==="/my-profile"||path.startsWith("/my-profile/"))?"myProfile":"");
      }
    }
    if(data.type==="HOME_APP_DRAWER_FORCE_CLOSE"){
      if(!chat.hidden){liveDisconnect();postChat("SUPPORT_CHAT_PANEL_CLOSE");}
      drawer.classList.remove("chat-mode");chat.hidden=true;$("drawer-title").textContent="Explore SKANDI";
      clearTimeout(state.drawerTimer);
      state.drawerRequestId="";
      state.drawerOpen=false;
      drawerLayer.classList.remove("open");
      drawerLayer.setAttribute("aria-hidden","true");
      menuButton.setAttribute("aria-expanded","false");
      menuButton.setAttribute("aria-label","Open menu");
      return;
    }
    if(data.type==="HOME_APP_DRAWER_RESIZE_ACK"){
      if(data.payload?.open===true&&data.requestId===state.drawerRequestId)drawerReady();
      return;
    }
    if(data.type==="HOME_APP_DRAWER_RESIZE_ERROR"){
      if(data.requestId===state.drawerRequestId){
        clearTimeout(state.drawerTimer);state.drawerRequestId="";
        notice(data.payload?.message||"The menu could not open.",{error:true});
      }
      return;
    }
    if(data.type==="HOME_APP_READY_ACK"){state.ready=true;return;}
    if(data.type==="HOME_APP_FOCUS_ACK"){notice("");return;}
    if(data.type==="HOME_APP_REFRESH_RESULT"&&data.requestId===state.refreshId){
      state.busy=false;state.refreshId="";
      notice(data.payload?.completed?"Home content and price checks updated.":"Home content updated. Live price checks continue.");
      return;
    }
    if(data.type==="HOME_APP_REFRESH_ERROR"&&data.requestId===state.refreshId){
      state.busy=false;state.refreshId="";
      notice(data.payload?.message||"Could not refresh Home.",{error:true});
    }
  });
  chatBusy(false);
  post("MASTER_CONFIG_REQUEST",{context:"home-mobile-nav"});
  post("HOME_APP_READY",{},nextId("ready"));
})();
</script>
</body>
</html>


```
