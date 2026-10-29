# SKANDI TRAVEL ASSISTANT — V12 INTEGRATION

## INFO
- System: SKANDI — customer-facing booking support.
- OWNER-CONFIRMED ROUTE: `/my-profile/travel-assistance`.
- Wix HTML element: `#htmlDuffelAssistant` (full-width/full-height embed).
- Wix page controller: `/src/pages/Travel Assistance.elfkf.js` (actual Wix-assigned code filename, per owner).
- Web facade: `/src/backend/SKANDI_CORE/duffelAssistant.web.js`.
- Core: `/src/backend/SKANDI_CORE/duffelAssistant.js`.
- Reused canonical cores: `customerProfile.js`, `duffelGround.js`, `duffelClient.js`, `customerSupport.js`, `supabaseServer.js`.
- Required restoration on inspected Git main: `/src/backend/SKANDI_CORE/duffelIdentity.js` is imported by `customerProfile.js` but was absent from main on 2026-10-18. Do not overwrite an independently approved Wix-hosted implementation without comparing it.
- Supabase: existing `customer_profiles`, `altea_bookings`, `customer_profiles_booking_links`, `customer_support_cases`, and `customer_support_messages`; no new tables or schema migrations. Existing customerSupport creates/owns customer cases, and a bounded provider-event projection appends clearly identified system activity to the canonical Support tables.
- Provider: Duffel Customer Users, Component Client Keys, Flight Orders and Stays Bookings; existing `DUFFEL_ACCESS_TOKEN` remains server side.
- Authentication: Wix SiteMember via `currentMember`; booking scope is verified through `getCustomerBookingDetailCore`.
- Bridge: `SKANDI_DUFFEL_ASSISTANT` → `SKANDI_WIX_PARENT`; `DUFFEL_ASSISTANT_READY`, `DUFFEL_ASSISTANT_LIST`, `DUFFEL_ASSISTANT_KEY_REQUEST`, `DUFFEL_ASSISTANT_SIGN_IN` and corresponding host responses.
- Mode: Duffel Assistant test integration. LIVE MODE REQUIRES DUFFEL COMMERCIAL ACTIVATION AND PRODUCTION VALIDATION.
- Status: STATICALLY VERIFIED for source syntax, contracts and current Supabase column names; REQUIRES LIVE TEST for Wix editor/embed, authenticated membership, Duffel connection, signed webhook, staff visibility and supplier-to-SKANDI booking servicing reconciliation.
- Source of truth: this file contains the complete new embed code below. It does not replace or modify the existing My Profile HTML_REF or its established visual design.

## CHANGE LOG
- 2026-10-18: Introduced a standalone authenticated Duffel Assistant route, scoped provider keys generated on demand, optional per-booking context after canonical ownership verification, ability to link existing owned Duffel flight/stay resources without replacing other permitted customer users, explicit support issue types and customer-friendly error states. No original SKANDI profile, checkout, ALTEA or master-page HTML changed.

- 2026-10-18 · V12.2: Restyled the standalone Assistant embed to match the approved SKANDI B-011.31 My Profile dark masthead, ivory cards, Inter/Montserrat typography, aqua/champagne accents, side navigation and responsive layout. Preserved booking selector, issue selection, Wix handshake, secure Duffel script launch, sign-in and trip refreshing. The standalone UI does not replace or alter My Profile.
- 2026-10-18 · V12.2 Customer Service convergence: Duffel Assistant sessions now create or reuse customer-owned cases through canonical `customerSupport.js`, distinguished by `source=duffel-assistant` and `sourceChannel=DUFFEL_ASSISTANT`. Browser events (handoff requested, new-message notice, minimised, launch failed) and signed Duffel `assistant.conversation.updated` webhook events append truthful provider-activity notes to `customer_support_messages`, visible to the existing Customer Service Desk without duplicating case tables. The canonical staff list/search already accepts the new case source. The staff HTML and controller are unchanged. Client messages are marked client-reported and signed webhooks are marked verified. No Duffel conversation transcript or final supplier servicing outcome is falsely represented.
- 2026-10-18 · V12.2 Wix HTTP registration: Added `src/backend/http-functions.js` as the canonical endpoint file preserving Alexandra gateway exports found in the Git file `src/backend/https-functions.js`, plus `post_duffelAssistantWebhook`. Git main lacked the required singular `http-functions.js` filename when inspected. Check deployed Wix for a newer approved version before installing this restoration. No existing `https-functions.js` file is deleted or changed by this ZIP.

- 2026-10-29 — Deployment parser repair: Removed the malformed, noncanonical `src/backend/https-functions.js`, which contained a duplicated nested copy of the HTTP endpoint module and caused a top-level import/export parse error. The complete supported endpoint set remains in `src/backend/http-functions.js`; it retains the Alexandra gateway, Travel Info, Duffel Assistant, and WhatsApp handlers. This supersedes the 2026-10-18 statement that the noncanonical file was not deleted. Wix registers HTTP functions from the singular canonical filename. STATICALLY VERIFIED; REQUIRES LIVE TEST after Wix build/publication.


- 2026-10-18 — V12.3: Existing Customer Service Desk private agent note `DUFFEL HANDOFF` (Issue/ Summary) can supply a supplier-facing summary via Duffel's documented `openDuffelAssistant({ context: { issueType, summary } })` on the next authenticated customer launch. Customer-owned case deep links `?caseId=...&bookingId=...&issueType=...` reuse an existing SKANDI case without impersonating travelers or replacing its origin. Added on-demand provider state verification and handling for signed `air.order.changed`, `order_cancellation.confirmed`, and `stays.booking.cancelled` webhooks, with durable Support-side discrepancy evidence. No unsupported Duffel chat transcript API or automatic financial settlement is assumed. REQUIRES LIVE TEST.

- 2026-10-19 — V12.4: The existing Customer Service Desk receives verified Duffel/ALTEA context, can initiate supplier verification, can route the SAME support case to a Booking Team queue with a persistent private note, and can prepare a customer-completed Duffel handoff with the supported issue type and agent summary. The Assistant standalone runtime/embed is unchanged from V12.3. Staff cannot impersonate travelers, read private Duffel transcripts, or automatically settle supplier/financial changes. REQUIRES LIVE TEST.

- 2026-10-19 — V12.5: Owner confirms the customer page display name **Travel Assistant**, Wix page-code filename `Travel Assistance.elfkf.js`, and route `/my-profile/travel-assistance`. All My Support case entry points, provider-owned case `sourcePage`, and customer handoff links use this route; all `DUFFEL_ASSISTANT_*` bridge message names, original HTML element `htmlDuffelAssistant`, and provider custom element remain unchanged. Consolidated reference under the Git-existing `HTML_REF/skandi/SKANDI TRAVEL ASSISTANT.md` instead of creating a second conflicting `SKANDI DUFFEL ASSISTANT.md` implementation.
- 2026-10-19 — V12.5 Alexandra support: The canonical LiveKit server core now uses `AgentDispatchClient` from pinned `livekit-server-sdk@2.15.5`, preserving `alexandra-prod`, `lk.chat`, `lk.transcription`, the authorized support gateway, and the shared Supabase Support case authority. The intended `/about/support` page still depends on separately hosted `#skandiSupportChatEmbed`; its complete live source is not in Git HTML_REF, and its runtime must be checked before declaring the chat fixed. REQUIRES LIVE TEST.

- 2026-10-20 — V12.6 native mobile Duffel mode: Phone widths (≤620px) hide the desktop SKANDI booking workspace and launch the official `<duffel-assistant>` component through the existing authenticated Wix → Duffel client-key flow. The mobile SKANDI-branded opening chrome and retry/sign-in/customer-service actions are host-controlled; Duffel's supplier chat and trip UI remain Duffel-operated and cannot be restyled internally without a documented Duffel capability. Automatic opening is attempted once after valid profile bootstrap, with an explicit tap-to-open fallback for mobile-browser restrictions. This change also fixes the invalid vendor custom-element closing tag introduced in the prior reference. `#htmlDuffelAssistant`, all existing bridge messages, scoped access verification, case audit, and desktop design stay unchanged. Requires real iOS/Android iframe height and CSP verification.

## DEPLOYMENT / REVIEW
- Keep the existing Wix page `/my-profile/travel-assistance` and controller `Travel Assistance.elfkf.js`. On mobile, set the existing `#htmlDuffelAssistant` Wix Studio HTML component to at least **100dvh / device viewport height** with no clipping container, so the official Duffel dialog can fit. Do not create a second page or fake the provider UI. Desktop keeps the present full-height embed.
- Create and publish the new Wix page and bind the page controller to its actual Wix page code file. Install the full HTML below in the HTML component with ID `htmlDuffelAssistant`; set the embed to fill the page viewport.
- Verify existing `customerProfile.js` provider sync and any newer deployed version of `duffelIdentity.js` before installing its restoration.
- The Assistant displays trips that Duffel knows are associated with the customer user; existing bookings are associated when the customer opens a specific verified booking from this page. Generic "All Duffel trips" cannot discover unknown/unlinked supplier orders.
- Existing SKANDI customer-cancellation/payment/ALTEA flows remain unchanged. A Duffel Assistant servicing outcome is external to those flows and must be reconciled into canonical SKANDI records before live launch.
- Duffel Assistant browser resources may require site/iframe CSP allowance as documented at https://duffel.com/docs/guides/integrating-the-duffel-assistant .

- Customer Service Desk: `/riaintra/success-factors/service-desk` uses existing canonical Support case listing, details, messages and search. Duffel-origin cases flow into its normal queue as `DUFFEL_ASSISTANT`; no separate Support case store or staff embed replacement is introduced.
- Signed notification endpoint: `POST /_functions/duffelAssistantWebhook` from Wix `src/backend/http-functions.js`. Subscribe the **existing** Duffel webhook for each mode to `assistant.conversation.updated` (Duffel permits one webhook per mode). Save its one-time signing secret in Wix Secrets as `DUFFEL_ASSISTANT_WEBHOOK_SECRET_TEST` or `DUFFEL_ASSISTANT_WEBHOOK_SECRET_LIVE`. The handler validates HMAC-SHA256 over the raw bytes and a 10-minute timestamp window. No live webhook/Duffel account changes have been made.
- No webhook payload includes the Duffel message body. Only message-update event metadata and explicitly labeled browser events can appear in SKANDI Customer Service. Full conversation history remains with Duffel; supplier changes require canonical booking reconciliation.
- Installation order: restore/reconcile missing `duffelIdentity.js` from the earlier V12 package if actually absent at the Wix target; install assistant core and web method, then `http-functions.js` only after confirming deployed HTTP exports, then page controller, then full HTML from this file. Publish, configure/verify secrets and existing Duffel webhook, and perform live end-to-end tests.
- Provider guide: https://duffel.com/docs/guides/integrating-the-duffel-assistant . Assistant is available in TEST mode; LIVE mode requires Duffel commercial activation. Wix HTTP function docs: https://dev.wix.com/docs/develop-websites/articles/coding-with-velo/integrations/exposing-services/write-an-http-function .

## COMPLETE HTML EMBED
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
  <meta name="theme-color" content="#03111f" />
  <title>SKANDI · Travel Assistant</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Montserrat:wght@500;600;700;800&display=swap" rel="stylesheet" />
  <style>
    :root {
      --sk-navy:#022e64;--sk-navy-deep:#061a30;--sk-navy-black:#03111f;
      --sk-blue:#0b3a7a;--sk-blue-soft:#1f6ba3;--sk-aqua:#5fc7cf;
      --sk-aqua-soft:#9de0e5;--sk-ivory:#fbfaf6;--sk-porcelain:#f5f1ea;
      --sk-champagne:#d1bc98;--sk-limestone:#d8d2c8;--sk-graphite:#1a1a1a;
      --sk-muted:#66758a;--sk-dark-muted:#93a4b7;--sk-line:rgba(255,255,255,.13);
      --sk-line-dark:rgba(2,46,100,.13);--sk-danger:#9e3b31;
      --shadow-dark:0 28px 86px rgba(0,0,0,.30);
      --shadow-light:0 18px 46px rgba(3,17,31,.11);
      --max:1240px;
      --hero-bg-img:url('https://static.wixstatic.com/media/394052_a1c96fea7d944811bfb9602e4f9e16e5~mv2.png');
    }
    *{box-sizing:border-box} html{background:var(--sk-navy-black)}
    body{margin:0;min-width:320px;background:var(--sk-navy-black);color:var(--sk-graphite);font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;-webkit-font-smoothing:antialiased;overflow-x:hidden}
    button,select{font:inherit}button{cursor:pointer}button:disabled{opacity:.52;cursor:not-allowed}
    :focus-visible{outline:3px solid rgba(95,199,207,.8);outline-offset:3px}
    .hidden{display:none!important}.wrap{width:min(var(--max),calc(100% - 48px));margin-inline:auto}
    .hero{position:relative;min-height:340px;padding:76px 0 56px;isolation:isolate;overflow:hidden;color:#fff;background:linear-gradient(180deg,rgba(3,17,31,.42) 0%,#03111f 94%),var(--hero-bg-img),linear-gradient(145deg,#071c32,#03101d);background-size:cover;background-position:center}
    .hero:before{content:'';position:absolute;z-index:-1;inset:0;pointer-events:none;background:linear-gradient(90deg,rgba(2,12,24,.67),transparent 72%),linear-gradient(0deg,rgba(3,17,31,.60),transparent 53%)}
    .hero-grid{display:grid;grid-template-columns:minmax(0,1fr) 360px;gap:50px;align-items:end}
    .eyebrow,.kicker{display:flex;align-items:center;gap:12px;color:var(--sk-aqua-soft);font-family:Montserrat,sans-serif;font-size:10px;font-weight:800;letter-spacing:.17em;text-transform:uppercase}
    .eyebrow:before,.kicker:before{content:'';height:1px;width:30px;background:var(--sk-aqua)}
    h1,h2,h3{font-family:Montserrat,sans-serif}h1{margin:16px 0 18px;color:#fff;font-size:clamp(42px,5.4vw,70px);font-weight:500;line-height:.99;letter-spacing:-.055em}
    .hero p{margin:0;max-width:640px;color:rgba(255,255,255,.68);font-size:13px;line-height:1.78}
    .hero-facts{display:grid;grid-template-columns:1fr 1fr;border-top:1px solid rgba(255,255,255,.16);border-bottom:1px solid rgba(255,255,255,.16)}
    .fact{padding:19px 18px 18px 0}.fact+.fact{border-left:1px solid rgba(255,255,255,.11);padding-left:21px}.fact-label{display:block;color:rgba(255,255,255,.45);font-size:9px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}
    .fact strong{display:block;overflow:hidden;text-overflow:ellipsis;margin-top:9px;color:#fff;font:600 20px/1.3 Montserrat,sans-serif;letter-spacing:-.035em}.fact small{display:block;margin-top:5px;color:var(--sk-aqua-soft);font-size:9px}
    .stage{position:relative;min-height:600px;padding:52px 0 100px;background:radial-gradient(circle at 12% 10%,rgba(31,107,163,.12),transparent 22%),radial-gradient(circle at 88% 32%,rgba(95,199,207,.055),transparent 28%),linear-gradient(180deg,#071827 0%,#041321 55%,#03111f 100%)}
    .stage:before{content:'';position:absolute;inset:0;pointer-events:none;opacity:.10;background-image:linear-gradient(30deg,rgba(255,255,255,.06) 12%,transparent 12.5%,transparent 87%,rgba(255,255,255,.06) 87.5%),linear-gradient(150deg,rgba(255,255,255,.04) 12%,transparent 12.5%,transparent 87%,rgba(255,255,255,.04) 87.5%);background-size:108px 188px;mask-image:linear-gradient(90deg,transparent,#000 22%,#000 78%,transparent)}
    .layout{position:relative;z-index:1;display:grid;grid-template-columns:248px minmax(0,1fr);gap:48px;align-items:start}
    .side-menu{position:sticky;top:24px;padding:4px 0 24px;color:#fff}
    .side-menu-title{padding-bottom:18px;color:rgba(255,255,255,.35);font:800 9px Montserrat,sans-serif;letter-spacing:.18em;text-transform:uppercase}
    .side-category{border-top:1px solid rgba(255,255,255,.12)}.side-category:last-of-type{border-bottom:1px solid rgba(255,255,255,.12)}
    .side-category-head{display:flex;justify-content:space-between;align-items:center;width:100%;padding:18px 0;border:0;background:transparent;color:#fff;text-align:left;font:700 13px Montserrat,sans-serif}
    .side-category-head:after{content:'+';color:rgba(255,255,255,.42);font:400 18px Inter,sans-serif}.side-category.open .side-category-head:after{content:'−';color:var(--sk-aqua-soft)}
    .side-options{display:none;padding:0 0 15px}.side-category.open .side-options{display:block}
    .side-link{position:relative;display:block;width:100%;padding:10px 8px 10px 17px;border:0;background:transparent;color:rgba(255,255,255,.59);text-align:left;font-size:11px;font-weight:600}
    .side-link:before{content:'';position:absolute;left:0;top:8px;bottom:8px;width:2px;background:transparent}.side-link:hover,.side-link.active{color:#fff}.side-link.active:before{background:var(--sk-aqua)}
    .side-menu-footer{padding-top:22px;color:rgba(255,255,255,.45);font-size:10px;line-height:1.7}.side-menu-footer button{padding:0;border:0;background:none;color:var(--sk-aqua-soft);font-weight:800}
    .workspace{min-width:0}.page-intro{display:grid;grid-template-columns:minmax(0,1fr) minmax(230px,.65fr);gap:35px;align-items:end;margin-bottom:25px}.page-intro h2{margin:9px 0 0;color:#fff;font-size:clamp(34px,4.3vw,52px);font-weight:500;letter-spacing:-.05em;line-height:1}
    .page-intro p{margin:0;color:rgba(255,255,255,.53);font-size:12px;line-height:1.75}
    .card{border:1px solid rgba(216,210,200,.83);border-radius:19px;background:var(--sk-ivory);box-shadow:var(--shadow-light)}.card.pad{padding:27px}
    .card h3{margin:0 0 9px;color:var(--sk-navy-deep);font-size:19px;letter-spacing:-.03em}.card p{margin:0;color:var(--sk-muted);font-size:12px;line-height:1.65}
    .selection{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:17px;margin-top:22px}.field label{display:block;margin-bottom:8px;color:#647080;font-size:9px;font-weight:800;letter-spacing:.1em;text-transform:uppercase}
    .control{width:100%;min-height:48px;padding:0 12px;border:1px solid #cad4dd;border-radius:10px;background:#fff;color:#172638;font-size:12px}.control:focus{border-color:var(--sk-aqua);outline:0;box-shadow:0 0 0 3px rgba(95,199,207,.13)}
    .button-row{display:flex;flex-wrap:wrap;gap:8px;margin-top:21px}.btn{min-height:43px;padding:0 18px;border:1px solid var(--sk-navy);border-radius:999px;background:#fff;color:var(--sk-navy);font-size:11px;font-weight:800}.btn:hover:not(:disabled){box-shadow:0 0 0 3px rgba(95,199,207,.13)}.btn.primary{border-color:var(--sk-navy-deep);background:var(--sk-navy-deep);color:#fff}.btn.primary:hover:not(:disabled){background:#092844}.btn.soft{border-color:#d8dee1;background:#f3f4f2}.btn.minor{min-height:34px;padding:0 13px;font-size:10px}
    .service-note{margin-top:20px;padding:15px 17px;border:1px solid rgba(2,46,100,.12);border-radius:12px;background:#eef4f4;color:#476274;font-size:11px;line-height:1.65}
    .status{margin-top:16px;color:#546474;font-size:11px;line-height:1.6}.status.error{color:#962e2c}
    .section-heading{display:flex;justify-content:space-between;align-items:end;gap:15px;margin:31px 0 14px;padding-bottom:15px;border-bottom:1px solid rgba(255,255,255,.11)}.section-heading h3{margin:0;color:#fff;font-size:21px;font-weight:600;letter-spacing:-.025em}.section-heading span{color:rgba(255,255,255,.48);font-size:10px}
    .history{overflow:hidden;border:1px solid rgba(216,210,200,.82);border-radius:18px;background:var(--sk-ivory);box-shadow:var(--shadow-light)}
    .history-entry{display:grid;grid-template-columns:136px minmax(0,1fr);gap:17px;padding:16px 21px;border-bottom:1px solid rgba(2,46,100,.11)}.history-entry:last-child{border-bottom:0}
    .history-entry time{color:#8b97a2;font-size:10px}.history-entry strong{display:block;margin-bottom:5px;color:var(--sk-navy-deep);font-size:11px}.history-entry p{margin:0;color:var(--sk-muted);font-size:11px;line-height:1.65}
    .history-empty{padding:24px;color:var(--sk-muted);font-size:11px;line-height:1.6}.service-pair{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:18px}.service-mini{padding:19px;border:1px solid rgba(255,255,255,.13);border-radius:16px;background:rgba(255,255,255,.04)}.service-mini strong{display:block;margin-bottom:6px;color:#fff;font:600 13px Montserrat,sans-serif}.service-mini p{margin:0;color:rgba(255,255,255,.52);font-size:11px;line-height:1.55}
    .audit-context{margin-top:12px;color:rgba(255,255,255,.47);font-size:10px;line-height:1.7}.audit-context strong{color:var(--sk-aqua-soft)}
    .mobile-brief{display:none}.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}
    @media(max-width:1040px){.hero-grid{grid-template-columns:1fr}.hero-facts{max-width:660px}.layout{grid-template-columns:200px minmax(0,1fr);gap:28px}.page-intro{grid-template-columns:1fr;gap:14px}}
    @media(max-width:820px){.wrap{width:min(var(--max),calc(100% - 32px))}.hero{padding:52px 0 46px}.layout{display:block}.side-menu{position:relative;top:auto;margin:0 0 28px;padding:0;border:1px solid rgba(255,255,255,.12);border-radius:18px;background:rgba(4,21,39,.6);overflow:hidden}.side-menu-title{padding:16px}.side-category{padding:0 16px}.side-menu-footer{padding:15px}.stage{padding-top:30px}.service-pair{grid-template-columns:1fr}}
    @media(max-width:620px){.wrap{width:min(var(--max),calc(100% - 28px))}.hero h1{font-size:43px}.hero-facts{grid-template-columns:1fr}.fact+.fact{border-left:0;border-top:1px solid rgba(255,255,255,.10);padding-left:0}.selection{grid-template-columns:1fr}.card.pad{padding:20px}.button-row{flex-direction:column}.button-row button{width:100%}.history-entry{grid-template-columns:1fr;gap:7px}.page-intro h2{font-size:37px}.stage{padding-bottom:72px}}
    @media(prefers-reduced-motion:reduce){*,*:before,*:after{scroll-behavior:auto!important;transition:none!important;animation:none!important}}

    /* Small screens use the Duffel-operated Assistant UI, not a second SKANDI trip-management UI.
       CSS styles only SKANDI-owned launcher/chrome; Duffel iframe stays provider-controlled. */
    .mobile-launch{display:none}
    @media(max-width:620px), (max-width:950px) and (pointer:coarse){
      html,body{width:100%;min-height:100dvh;overflow-x:hidden;background:#03111f}
      .shell{display:none!important}
      .mobile-launch{display:flex;flex-direction:column;justify-content:center;align-items:stretch;min-height:100dvh;min-height:100svh;padding:max(22px,env(safe-area-inset-top)) 22px max(22px,env(safe-area-inset-bottom));background:radial-gradient(circle at 80% 15%,rgba(95,199,207,.10),transparent 35%),linear-gradient(160deg,#061c34,#03111f);color:#fff}
      .mobile-brand{font:800 11px Montserrat,sans-serif;letter-spacing:.21em;color:var(--sk-aqua-soft);text-transform:uppercase}
      .mobile-launch h1{margin:16px 0 12px;font:600 clamp(32px,10vw,48px)/1.06 Montserrat,sans-serif;letter-spacing:-.045em;color:#fff}
      .mobile-launch p{margin:0 0 26px;color:rgba(255,255,255,.7);font:400 13px/1.75 Inter,sans-serif}
      .mobile-launch button{width:100%;min-height:52px;margin:0 0 10px;border:1px solid rgba(157,224,229,.7);border-radius:13px;background:var(--sk-aqua);color:#041523;font:800 12px Inter,sans-serif}
      .mobile-launch button.secondary{border-color:rgba(255,255,255,.20);background:rgba(255,255,255,.05);color:#fff}
      .mobile-launch button:disabled{opacity:.53}
      .mobile-launch .mobile-copy{margin:8px 0 0;color:rgba(255,255,255,.52);font-size:10px;line-height:1.6}
      duffel-assistant{display:block;width:100%}
    }
  </style>
</head>
<body>
  <div class="shell">
    <section class="hero">
      <div class="wrap hero-grid">
        <div>
          <div class="eyebrow">SKANDI Travels · Booking Service</div>
          <h1>Travel Assistant</h1>
          <p>Manage eligible Duffel flight and hotel bookings, reach Duffel's travel specialists when a booking needs personal support, and keep a connected service-activity record with SKANDI Customer Service.</p>
        </div>
        <div class="hero-facts" aria-label="Travel support information">
          <div class="fact"><span class="fact-label">Linked bookings</span><strong id="heroTrips">—</strong><small>SKANDI account</small></div>
          <div class="fact"><span class="fact-label">Service reference</span><strong id="heroCase">—</strong><small>Customer Service</small></div>
        </div>
      </div>
    </section>
    <section class="stage">
      <div class="wrap layout">
        <aside class="side-menu" aria-label="Travel Assistant navigation">
          <div class="side-menu-title">Travel Assistant</div>
          <div class="side-category open">
            <button class="side-category-head" data-category-toggle aria-expanded="true">My Travel</button>
            <div class="side-options"><button class="side-link active" data-scroll-to="manage">Manage a booking</button><button class="side-link" data-scroll-to="activity">Service activity</button></div>
          </div>
          <div class="side-category open">
            <button class="side-category-head" data-category-toggle aria-expanded="true">Service & Support</button>
            <div class="side-options"><button class="side-link" id="supportNav">Customer Service</button><button class="side-link" id="refreshNav">Refresh bookings</button></div>
          </div>
          <div class="side-menu-footer">For bookings not serviced by Duffel,<br><button id="supportAside" type="button">contact SKANDI Support</button>.</div>
        </aside>
        <main class="workspace">
          <div class="page-intro" id="manage"><div><div class="kicker">My Travel · Booking Service</div><h2>How can we help?</h2></div><p>Select a linked booking to pass the correct trip details to Duffel, or open Assistant for your Duffel customer account.</p></div>
          <section class="card pad" aria-labelledby="assistantTitle">
            <h3 id="assistantTitle">Your travel, one place.</h3>
            <p>Duffel handles eligible supplier-side support. SKANDI retains your booking record and a separate service-activity history for Customer Service.</p>
            <div class="selection">
              <div class="field"><label for="trip">Booking</label><select class="control" id="trip" aria-describedby="supportStatus"><option value="">All linked Duffel trips</option></select></div>
              <div class="field"><label for="issue">Support reason</label><select class="control" id="issue"><option value="">Choose inside Assistant</option><option value="change">Change a booking</option><option value="cancellation">Cancel a booking</option><option value="other">Other travel support</option></select></div>
            </div>
            <div class="button-row">
              <button class="btn primary" id="open" type="button" disabled>Open Duffel Assistant</button>
              <button class="btn soft" id="refresh" type="button">Refresh bookings</button>
              <button class="btn soft" id="verify" type="button" disabled>Verify supplier booking</button>
              <button class="btn hidden" id="signIn" type="button">Sign in to SKANDI</button>
            </div>
            <div id="supportStatus" class="status" role="status" aria-live="polite">Connecting to your SKANDI account…</div>
            <div id="handoffNote" class="service-note hidden" role="status" aria-live="polite"></div>
            <div class="service-note">The Assistant may complete supplier servicing independently. A session launch or conversation notification is not proof that a booking was changed, cancelled, refunded or synchronized into SKANDI. Check your trip confirmation and SKANDI booking record for final status.</div>
          </section>
          <div class="section-heading" id="activity"><h3>Customer Service activity</h3><span id="activityCaption">Shared support history</span></div>
          <div id="activityHistory" class="history" aria-live="polite"><div class="history-empty">Open the Assistant for a selected booking to link an activity record with SKANDI Customer Service.</div></div>
          <div class="service-pair">
            <div class="service-mini"><strong>Duffel travel specialists</strong><p>Supplier questions, eligible flight and stay management, and conversations maintained by Duffel.</p></div>
            <div class="service-mini"><strong>SKANDI Customer Service</strong><p>Your SKANDI case, service events, booking follow-up and travel support outside Duffel's scope.</p></div>
          </div>
          <div class="audit-context">Support activity records only verified server-side events and clearly labeled interface notifications. <strong>Private Duffel chat messages are not replicated.</strong></div>
        </main>
      </div>
    </section>
  </div>
  <!-- Mobile: original Duffel Assistant widget, opened from SKANDI-branded launch chrome.
       The provider UI itself is not copied, redrawn or restyled. -->
  <div class="mobile-launch" id="mobileLaunch">
    <div class="mobile-brand">SKANDI TRAVELS · CUSTOMER SERVICE</div>
    <h1>Travel Assistant</h1>
    <p>Manage eligible trips and contact Duffel travel specialists through Duffel Assistant.</p>
    <button id="mobileOpen" type="button" disabled>Opening travel assistant…</button>
    <button id="mobileSupport" type="button" class="secondary">SKANDI Customer Service</button>
    <button id="mobileSignIn" type="button" class="secondary hidden">Sign in to SKANDI</button>
    <div class="mobile-copy" id="mobileStatus" role="status" aria-live="polite">Connecting to your SKANDI account…</div>
  </div>
  <duffel-assistant></duffel-assistant>
  <script>
  (() => {
    'use strict';
    const SOURCE='SKANDI_DUFFEL_ASSISTANT', PARENT='SKANDI_WIX_PARENT';
    const el=id=>document.getElementById(id), choices=[];
    let usable=false,pending=false,loadingScript=null,requestId='',keyTimer=null,currentCaseId='',notificationCount=0,staffCaseId='',prefillBooking='',prefillIssue='',activeBookingId='',activeResourceType='',mobileAutoOpenAttempted=false;
    const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
    function post(type,payload={}){window.parent.postMessage({source:SOURCE,type,payload,timestamp:new Date().toISOString()},'*')}
    function status(message,isError=false){el('supportStatus').textContent=String(message||'');el('supportStatus').classList.toggle('error',isError);el('mobileStatus').textContent=String(message||'');el('mobileStatus').style.color=isError?'#ffbcb7':''}
    function pendingState(value){pending=!!value;el('open').disabled=pending||!usable;el('open').textContent=pending?'Preparing Assistant…':'Open Duffel Assistant';el('mobileOpen').disabled=pending||!usable;el('mobileOpen').textContent=pending?'Preparing secure session…':'Open Duffel Assistant'}
    function loadScript(){
      if(typeof window.openDuffelAssistant==='function')return Promise.resolve();
      if(loadingScript)return loadingScript;
      loadingScript=new Promise((resolve,reject)=>{
        const script=document.createElement('script');script.src='https://assets.duffel.com/assistant/custom-element.js';script.async=true;
        script.onload=()=>typeof window.openDuffelAssistant==='function'?resolve():reject(new Error('Duffel Assistant did not initialize.'));
        script.onerror=()=>reject(new Error('Duffel Assistant resources were blocked or unavailable. Check the Wix embed permissions.'));
        document.head.appendChild(script);
      }).catch(error=>{loadingScript=null;throw error});
      return loadingScript;
    }
    function renderTrips(trips){
      choices.length=0;const select=el('trip');select.replaceChildren(new Option('All linked Duffel trips',''));
      for(const trip of Array.isArray(trips)?trips:[]){
        if(!trip?.bookingId||!['air','stay'].includes(trip.resourceType))continue;
        const optionIndex=String(choices.length);
        const label=[trip.kind,trip.label,trip.route,trip.departureDate].filter(Boolean).join(' · ').slice(0,245);
        choices.push({bookingId:trip.bookingId,resourceType:trip.resourceType});select.add(new Option(label,optionIndex));
      }
      el('heroTrips').textContent=String(choices.length);
      if(prefillBooking){
        const index=choices.findIndex(x=>x.bookingId===prefillBooking);
        if(index>=0)select.value=String(index);
      }
      el('verify').disabled=!usable||!currentCaseId||select.value===''||choices[Number(select.value)]?.bookingId!==activeBookingId||choices[Number(select.value)]?.resourceType!==activeResourceType;
    }
    function renderActivity(data){
      if(!data?.supportCaseId)return;
      currentCaseId=String(data.supportCaseId);
      el('heroCase').textContent=String(data.supportCaseRef||'Assigned');
      const events=Array.isArray(data.events)?data.events:[];
      const skandi=Array.isArray(data.skandiMessages)?data.skandiMessages:[];
      const timeline=[...events.map(x=>({...x,sender:'Duffel Assistant activity'})),...skandi.map(x=>({...x,sender:x.sender||'SKANDI Customer Service'}))];
      timeline.sort((a,b)=>new Date(b.at||0)-new Date(a.at||0));
      el('activityCaption').textContent=`${events.length} recorded events · ${skandi.length} SKANDI messages`;
      el('activityHistory').innerHTML=timeline.length?timeline.slice(0,60).map(event=>{
        const date=event.at?new Date(event.at).toLocaleString():'';
        const message=String(event.text||'');
        return `<div class="history-entry"><time>${esc(date)}</time><div><strong>${esc(event.sender)}</strong><p>${esc(message)}</p></div></div>`;
      }).join(''):'<div class="history-empty">Your SKANDI Customer Service case is linked. Assistant activity and SKANDI customer-visible messages will appear here.</div>';
    }
    function eventLog(eventType){if(currentCaseId)post('DUFFEL_ASSISTANT_EVENT',{supportCaseId:currentCaseId,eventType})}
    function openAssistant(){
      if(pending||!usable)return;
      const index=el('trip').value,choice=index===''?null:choices[Number(index)];
      if(index!==''&&!choice){status('Your booking list changed. Refresh and try again.',true);return}
      pendingState(true);status('Preparing secure Duffel travel support and linking Customer Service…');
      requestId=`das_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,9)}`;
      post('DUFFEL_ASSISTANT_KEY_REQUEST',{requestId,bookingId:choice?.bookingId||'',resourceType:choice?.resourceType||'',issueType:el('issue').value,supportCaseId:staffCaseId});
      clearTimeout(keyTimer);
      keyTimer=setTimeout(()=>{if(!pending)return;pendingState(false);requestId='';status('The Assistant could not be prepared in time. Try again or contact SKANDI Support.',true)},45000);
    }
    el('open').addEventListener('click',openAssistant);
    el('mobileOpen').addEventListener('click',openAssistant);
    el('mobileSupport').addEventListener('click',()=>post('DUFFEL_ASSISTANT_SUPPORT'));
    el('mobileSignIn').addEventListener('click',()=>post('DUFFEL_ASSISTANT_SIGN_IN'));
    el('trip').addEventListener('change',()=>{
      const chosen=choices[Number(el('trip').value)];
      el('verify').disabled=!usable||el('trip').value===''||!currentCaseId||chosen?.bookingId!==activeBookingId||chosen?.resourceType!==activeResourceType;
    });
    el('verify').addEventListener('click',()=>{
      if(!currentCaseId||el('trip').value===''){
        status('Open Assistant for the selected booking before verifying supplier status.',true);return;
      }
      status('Checking live Duffel booking information against the linked SKANDI support record…');
      const chosen=choices[Number(el('trip').value)];
      post('DUFFEL_ASSISTANT_VERIFY',{supportCaseId:currentCaseId,bookingId:chosen?.bookingId||'',resourceType:chosen?.resourceType||''});
    });
    el('refresh').addEventListener('click',()=>{status('Refreshing your SKANDI trips…');post('DUFFEL_ASSISTANT_LIST')});
    el('refreshNav').addEventListener('click',()=>el('refresh').click());
    el('signIn').addEventListener('click',()=>post('DUFFEL_ASSISTANT_SIGN_IN'));
    ['supportAside','supportNav'].forEach(id=>el(id)?.addEventListener('click',()=>post('DUFFEL_ASSISTANT_SUPPORT')));
    document.querySelectorAll('[data-category-toggle]').forEach(button=>button.addEventListener('click',()=>{const item=button.closest('.side-category');const open=!item.classList.contains('open');item.classList.toggle('open',open);button.setAttribute('aria-expanded',String(open))}));
    document.querySelectorAll('[data-scroll-to]').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('[data-scroll-to]').forEach(x=>x.classList.remove('active'));button.classList.add('active');el(button.dataset.scrollTo)?.scrollIntoView({behavior:'smooth',block:'start'})}));
    window.addEventListener('message',async event=>{
      const data=event.data;
      if(event.origin==='https://assets.duffel.com'&&data&&typeof data==='object'){
        if(data.type==='duffel-assistant-minimise'){status('Assistant minimised. Open it again to continue.');eventLog('MINIMISED')}
        if(data.type==='duffel-assistant-new-message'){notificationCount++;status(`Duffel has sent ${notificationCount} new message notification${notificationCount===1?'':'s'}. Open Assistant to view messages.`);eventLog('NEW_MESSAGE_NOTICE')}
        return;
      }
      if(event.source!==window.parent)return;
      let message=data;if(typeof message==='string'){try{message=JSON.parse(message)}catch{return}}
      if(!message||message.source!==PARENT)return;
      const payload=message.payload||{};
      switch(message.type){
        case 'DUFFEL_ASSISTANT_HOST_READY':
          staffCaseId=String(payload.prefill?.supportCaseId||'');
          prefillBooking=String(payload.prefill?.bookingId||'');
          prefillIssue=String(payload.prefill?.issueType||'');
          if(['change','cancellation','other'].includes(prefillIssue))el('issue').value=prefillIssue;
          post('DUFFEL_ASSISTANT_READY');break;
        case 'DUFFEL_ASSISTANT_TRIPS':
          usable=true;renderTrips(payload.trips);pendingState(false);el('signIn').classList.add('hidden');el('mobileSignIn').classList.add('hidden');
          status(choices.length?'Choose a flight or hotel booking, or open Assistant for all linked Duffel trips.':'No eligible bookings are listed yet. You can still open Assistant for your Duffel account.');
          // Try the provider's native mobile UI automatically once. If iOS Safari requires a
          // click gesture, the accessible Open Duffel Assistant button remains available.
          if(window.matchMedia('(max-width:620px), (max-width:950px) and (pointer:coarse)').matches&&!mobileAutoOpenAttempted){mobileAutoOpenAttempted=true;openAssistant();}
          break;
        case 'DUFFEL_ASSISTANT_OPEN':
          if(payload.requestId!==requestId||!pending)return;
          clearTimeout(keyTimer);requestId='';currentCaseId=String(payload.supportCaseId||'');
          el('heroCase').textContent=String(payload.supportCaseRef||'Assigned');
          activeBookingId=String(payload.activeSessionBookingId||'');activeResourceType=String(payload.activeSessionResourceType||'');
          el('trip').dispatchEvent(new Event('change'));
          if(!payload.clientKey){pendingState(false);status('Duffel did not issue a secure client key.',true);return}
          try{
            await loadScript();
            const config={clientKey:payload.clientKey,showMinimiseButton:true};
            if(['cancellation','change','other'].includes(payload.issueType))config.context={issueType:payload.issueType};
            if(payload.handoffSummary){
              config.context={...config.context,summary:String(payload.handoffSummary).slice(0,1800),issueType:payload.issueType||'other'};
              el('handoffNote').classList.remove('hidden');
              el('handoffNote').textContent='A SKANDI Customer Service agent prepared context for Duffel travel support. The summary will be passed when you open Assistant.';
            }else{
              el('handoffNote').classList.add('hidden');
            }
            window.openDuffelAssistant(config);
            eventLog('UI_HANDOFF_REQUESTED');
            if(payload.handoffSummary)eventLog('STAFF_CONTEXT_SUBMITTED');
            status('Duffel Assistant opened. Service activity is recorded under your SKANDI Customer Service reference.');
          }catch(err){eventLog('LAUNCH_FAILED');status(err?.message||'The Assistant could not open.',true)}
          finally{pendingState(false)}
          break;
        case 'DUFFEL_ASSISTANT_ACTIVITY':renderActivity(payload);break;
        case 'DUFFEL_ASSISTANT_VERIFICATION':
          if(payload.checked){status(payload.discrepancy?'Duffel confirms a supplier-state discrepancy. SKANDI Customer Service must reconcile booking, documents and any customer refund.':payload.reviewRequired?'Duffel booking state verified; Customer Service review is required.':'Live Duffel booking status checked; no confirmed servicing discrepancy was identified.');}
          else status('Provider verification was not available for this booking. Contact SKANDI Customer Service.',true);
          break;
        case 'DUFFEL_ASSISTANT_VERIFICATION_ERROR':status(payload.message||'Supplier verification could not be completed.',true);break;
        case 'DUFFEL_ASSISTANT_ACTIVITY_ERROR':status(payload.message||'The Customer Service activity could not be loaded.',true);break;
        case 'DUFFEL_ASSISTANT_ERROR':
          if(payload.requestId&&requestId&&payload.requestId!==requestId)return;
          clearTimeout(keyTimer);requestId='';pendingState(false);status(payload.message||'Duffel Assistant is unavailable.',true);
          if(payload.code==='LOGIN_REQUIRED'){el('signIn').classList.remove('hidden');el('mobileSignIn').classList.remove('hidden');}
          break;
        default:break;
      }
    });
    post('DUFFEL_ASSISTANT_READY');[350,1000,2400].forEach(delay=>setTimeout(()=>{if(!usable)post('DUFFEL_ASSISTANT_READY')},delay));
  })();
  </script>
</body>
</html>
```
