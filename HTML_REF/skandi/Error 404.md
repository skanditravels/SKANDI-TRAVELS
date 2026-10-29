# SKANDI Travels Error 404 — INFO / LOG

## INFO

- **Source file:** `HTML_REF/skandi/Error 404.md`.
- **Page:** SKANDI Travels custom Page Not Found page.
- **System area:** SKANDI customer website.
- **Wix page-code file:** `src/pages/Error404.yt0r0.js` (the inspected file is a native-page placeholder with no page logic).
- **Wix route:** Wix-managed 404 behavior; there is no Error 404 route in `src/public/siteMap.js`.
- **Wix HTML element:** The supplied HTML is a full-page document. Its current Wix installation slot and component ID are not established by the repository; replace the existing custom 404 document in the same Wix location.
- **Status:** Complete replacement HTML prepared; requires installation into the existing Wix 404 page and publication.
- **Source of truth:** The complete current HTML payload appears below. It was remade from the user-supplied current Error404 HTML on 2026-10-29.
- **Page controller:** No controller behavior is required or changed. `src/pages/Error404.yt0r0.js` remains untouched.
- **Backend facade / core:** None.
- **Supabase resources:** No database access. The public logo and hero assets are supplied by the existing MasterPage asset map; no Supabase API/client is used in the HTML.
- **Asset owner:** `src/pages/masterPage.js` → `MASTER_CONFIG.brand.assets.logos.customerHeader` and `MASTER_CONFIG.brand.assets.images.clubLoginHero`.
- **Authentication:** Public page; no member or staff session is read or changed.
- **Message contracts:** Outbound `MASTER_ASSETS_REQUEST` (`source: SKANDI_ERROR_404`); inbound `SKANDI_MASTER_ASSETS` from `SKANDI_WIX_PARENT`. MasterPage exposes this existing asset request for HTML components.
- **Navigation paths:** `/`, `/destinations`, and `/about/support`, verified against `src/public/siteMap.js`.
- **External dependencies:** Google Fonts (Inter and Montserrat); page content and actions work without the font service.
- **Last verified:** 2026-10-29.
- **Open installation detail:** Confirm the existing Wix custom 404 HTML slot/component because its ID is not present in the supplied repository source.

## CHANGE LOG (append-only)

- **2026-10-29 — SKANDI visual redesign:** Replaced the generic navy-and-gold treatment with SKANDI navy, blue, aqua, and ice colors; added a responsive split layout, destination photography, accessible navigation actions, reduced-motion support, and a text fallback if the MasterPage logo cannot load. The page requests its current logo and hero image from MasterPage, with the same verified public assets as a fallback. Preserved the existing editable `SKANDI_404_*` settings and corrected them to be read through `window`; the old top-level constants were not available to the runtime script. Home, destinations, and support paths use the canonical site-map paths. No backend, page controller, route, authentication, or database changes.

## COMPLETE HTML SOURCE

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <meta name="theme-color" content="#022e64" />
  <title>Page not found | SKANDI Travels</title>
  <meta name="description" content="We couldn't find that page. Find your way back to SKANDI Travels." />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Montserrat:wght@500;600;700;800&display=swap" rel="stylesheet" />

  <!-- Customize these values only when a different 404 image, logo, size, or route is required. -->
  <script>
    window.SKANDI_404_HERO_IMAGE_URL = "";
    window.SKANDI_404_LOGO_URL = "";
    window.SKANDI_404_LOGO_WIDTH = "260px";
    window.SKANDI_404_LOGO_HEIGHT = "72px";
    window.SKANDI_404_LOGO_FIT = "contain";
    window.SKANDI_404_HOME_URL = "/";
    window.SKANDI_404_DESTINATIONS_URL = "/destinations";
    window.SKANDI_404_SUPPORT_URL = "/about/support";
  </script>

  <style>
    :root {
      color-scheme: light;
      --sk-navy: #022e64;
      --sk-navy-deep: #031d3d;
      --sk-blue: #1f6ba3;
      --sk-aqua: #5fc7cf;
      --sk-aqua-pale: #dff3f4;
      --sk-ice: #f5f7fb;
      --sk-porcelain: #fbfcfe;
      --sk-white: #fff;
      --sk-ink: #142d46;
      --sk-muted: #64748b;
      --sk-border: #dbe4ee;
      --sk-image-fallback: linear-gradient(145deg, #0b427b 2%, #1f6ba3 47%, #78c9ce 100%);
      --sk-hero-image: none;
      --sk-logo-width: 260px;
      --sk-logo-height: 72px;
      --sk-logo-fit: contain;
      font-family: Inter, "Avenir Next", Avenir, sans-serif;
    }

    *,
    *::before,
    *::after {
      box-sizing: border-box;
    }

    html {
      min-width: 320px;
      min-height: 100%;
      background: var(--sk-ice);
      scroll-behavior: smooth;
    }

    body {
      min-width: 320px;
      min-height: 100vh;
      min-height: 100svh;
      margin: 0;
      color: var(--sk-ink);
      background: var(--sk-ice);
      -webkit-font-smoothing: antialiased;
      text-rendering: optimizeLegibility;
    }

    a,
    button {
      font: inherit;
    }

    a {
      color: inherit;
    }

    button {
      cursor: pointer;
    }

    :focus-visible {
      outline: 3px solid var(--sk-aqua);
      outline-offset: 4px;
    }

    .site-shell {
      min-height: 100vh;
      min-height: 100svh;
      display: grid;
      grid-template-rows: auto 1fr auto;
      overflow: hidden;
      background:
        radial-gradient(ellipse at 0% 88%, rgba(95, 199, 207, 0.11), transparent 31%),
        linear-gradient(135deg, var(--sk-porcelain), var(--sk-ice));
    }

    .topbar,
    .main,
    .site-footer {
      width: min(1320px, calc(100% - 72px));
      margin-inline: auto;
    }

    .topbar {
      min-height: 94px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 24px;
      border-bottom: 1px solid rgba(2, 46, 100, 0.1);
    }

    .brand-link {
      min-width: 0;
      min-height: 52px;
      display: inline-flex;
      align-items: center;
      color: var(--sk-navy);
      text-decoration: none;
    }

    .brand-logo-frame {
      width: min(var(--sk-logo-width), 58vw);
      height: var(--sk-logo-height);
      display: grid;
      place-items: center start;
    }

    .brand-logo {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: var(--sk-logo-fit);
      object-position: left center;
    }

    .brand-logo.is-hidden {
      display: none;
    }

    .brand-fallback {
      display: none;
      align-items: center;
      gap: 11px;
      color: var(--sk-navy);
      font-family: Montserrat, Inter, sans-serif;
      font-size: 17px;
      font-weight: 800;
      letter-spacing: 0.08em;
      line-height: 1;
    }

    .brand-fallback.is-visible {
      display: inline-flex;
    }

    .brand-fallback svg {
      flex: 0 0 auto;
      width: 42px;
      height: 28px;
      color: var(--sk-blue);
    }

    .brand-fallback small {
      display: block;
      margin-top: 5px;
      color: var(--sk-blue);
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.2em;
    }

    .help-link {
      min-height: 42px;
      display: inline-flex;
      align-items: center;
      gap: 9px;
      color: var(--sk-navy);
      text-decoration: none;
      font-size: 13px;
      font-weight: 700;
      transition: color 180ms ease;
    }

    .help-link:hover {
      color: var(--sk-blue);
    }

    .help-link svg,
    .button svg,
    .destination-link svg {
      width: 17px;
      height: 17px;
      flex: 0 0 auto;
    }

    .main {
      display: grid;
      grid-template-columns: minmax(0, 1.03fr) minmax(390px, 0.97fr);
      align-items: center;
      gap: clamp(46px, 7vw, 110px);
      padding-block: clamp(46px, 7vh, 82px);
    }

    .message {
      max-width: 615px;
      padding-block: 12px;
      animation: rise-in 720ms cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    .eyebrow {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0 0 22px;
      color: var(--sk-blue);
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.16em;
      text-transform: uppercase;
    }

    .eyebrow::before {
      width: 36px;
      height: 2px;
      border-radius: 3px;
      background: var(--sk-aqua);
      content: "";
    }

    .error-code {
      margin: 0 0 13px -7px;
      color: var(--sk-navy);
      font-family: Montserrat, Inter, sans-serif;
      font-size: clamp(106px, 15.5vw, 190px);
      font-weight: 800;
      letter-spacing: -0.105em;
      line-height: 0.76;
      white-space: nowrap;
    }

    .error-code span {
      color: var(--sk-aqua);
    }

    h1 {
      max-width: 590px;
      margin: 24px 0 0;
      color: var(--sk-navy-deep);
      font-family: Montserrat, Inter, sans-serif;
      font-size: clamp(29px, 4.1vw, 51px);
      font-weight: 700;
      letter-spacing: -0.052em;
      line-height: 1.08;
    }

    .description {
      max-width: 520px;
      margin: 18px 0 0;
      color: var(--sk-muted);
      font-size: clamp(15px, 1.3vw, 17px);
      line-height: 1.75;
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 12px;
      margin-top: 29px;
    }

    .button {
      min-height: 52px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 0 20px;
      border: 1px solid var(--sk-border);
      border-radius: 9px;
      color: var(--sk-navy);
      background: rgba(255, 255, 255, 0.84);
      text-decoration: none;
      font-size: 13px;
      font-weight: 700;
      transition: transform 180ms ease, background 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
    }

    .button:hover {
      transform: translateY(-2px);
      border-color: rgba(2, 46, 100, 0.28);
      background: var(--sk-white);
      box-shadow: 0 11px 26px rgba(2, 46, 100, 0.1);
    }

    .button.primary {
      border-color: var(--sk-navy);
      color: var(--sk-white);
      background: var(--sk-navy);
      box-shadow: 0 11px 26px rgba(2, 46, 100, 0.17);
    }

    .button.primary:hover {
      border-color: var(--sk-blue);
      background: var(--sk-blue);
      box-shadow: 0 14px 30px rgba(2, 46, 100, 0.22);
    }

    .button.back {
      background: transparent;
    }

    .support-note {
      margin: 24px 0 0;
      color: var(--sk-muted);
      font-size: 13px;
      line-height: 1.6;
    }

    .support-note a {
      color: var(--sk-navy);
      font-weight: 700;
      text-decoration-color: var(--sk-aqua);
      text-decoration-thickness: 2px;
      text-underline-offset: 4px;
    }

    .support-note a:hover {
      color: var(--sk-blue);
    }

    .visual {
      position: relative;
      min-width: 0;
      animation: rise-in 850ms cubic-bezier(0.16, 1, 0.3, 1) 100ms both;
    }

    .destination-card {
      position: relative;
      min-height: min(610px, 68vh);
      min-height: min(610px, 68svh);
      margin: 0;
      overflow: hidden;
      border: 1px solid rgba(2, 46, 100, 0.11);
      border-radius: 24px;
      background: var(--sk-image-fallback);
      box-shadow: 0 34px 80px rgba(2, 46, 100, 0.16);
      isolation: isolate;
    }

    .destination-card::before {
      position: absolute;
      z-index: 1;
      inset: 0;
      background:
        linear-gradient(180deg, rgba(3, 29, 61, 0.02) 28%, rgba(3, 29, 61, 0.18) 49%, rgba(3, 29, 61, 0.88) 100%),
        linear-gradient(120deg, rgba(2, 46, 100, 0.08), transparent 58%);
      content: "";
      pointer-events: none;
    }

    .destination-photo {
      position: absolute;
      z-index: 0;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;
      transform: scale(1.015);
      transition: transform 900ms cubic-bezier(0.16, 1, 0.3, 1);
    }

    .destination-card:hover .destination-photo {
      transform: scale(1.045);
    }

    .route-art {
      position: absolute;
      z-index: 2;
      top: 18%;
      right: 8%;
      width: min(48%, 250px);
      height: auto;
      overflow: visible;
      color: var(--sk-white);
      opacity: 0.86;
      pointer-events: none;
    }

    .photo-caption {
      position: absolute;
      z-index: 3;
      right: clamp(22px, 4vw, 42px);
      bottom: clamp(24px, 5vw, 48px);
      left: clamp(22px, 4vw, 42px);
      color: var(--sk-white);
    }

    .photo-eyebrow {
      margin: 0 0 12px;
      color: rgba(255, 255, 255, 0.82);
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.2em;
      text-transform: uppercase;
    }

    .photo-caption h2 {
      max-width: 390px;
      margin: 0;
      font-family: Montserrat, Inter, sans-serif;
      font-size: clamp(28px, 3vw, 40px);
      font-weight: 600;
      letter-spacing: -0.045em;
      line-height: 1.12;
    }

    .destination-link {
      min-height: 45px;
      display: inline-flex;
      align-items: center;
      gap: 9px;
      margin-top: 20px;
      padding: 0 15px;
      border: 1px solid rgba(255, 255, 255, 0.64);
      border-radius: 7px;
      color: var(--sk-white);
      background: rgba(3, 29, 61, 0.2);
      text-decoration: none;
      font-size: 12px;
      font-weight: 700;
      backdrop-filter: blur(10px);
      transition: background 180ms ease, border-color 180ms ease;
    }

    .destination-link:hover {
      border-color: var(--sk-white);
      background: rgba(3, 29, 61, 0.42);
    }

    .site-footer {
      min-height: 58px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      border-top: 1px solid rgba(2, 46, 100, 0.1);
      color: #708096;
      font-size: 11px;
      letter-spacing: 0.04em;
    }

    .footer-brand {
      color: var(--sk-navy);
      font-weight: 700;
    }

    .footer-slogan {
      color: var(--sk-blue);
      font-weight: 600;
    }

    @keyframes rise-in {
      from {
        opacity: 0;
        transform: translateY(17px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @media (max-width: 940px) {
      .topbar,
      .main,
      .site-footer {
        width: min(100% - 48px, 720px);
      }

      .main {
        grid-template-columns: minmax(0, 1fr) minmax(280px, 0.85fr);
        gap: 36px;
      }

      .destination-card {
        min-height: 510px;
      }

      .error-code {
        font-size: clamp(104px, 14vw, 148px);
      }
    }

    @media (max-width: 700px) {
      .topbar,
      .main,
      .site-footer {
        width: calc(100% - 36px);
      }

      .topbar {
        min-height: 76px;
      }

      .brand-logo-frame {
        width: min(var(--sk-logo-width), 52vw);
        height: 52px;
      }

      .help-link {
        min-height: 40px;
        font-size: 12px;
      }

      .main {
        grid-template-columns: 1fr;
        gap: 33px;
        padding-block: 42px 34px;
      }

      .message {
        max-width: none;
      }

      .eyebrow {
        margin-bottom: 20px;
        font-size: 10px;
      }

      .error-code {
        margin-left: -4px;
        font-size: clamp(116px, 30vw, 170px);
      }

      h1 {
        max-width: 500px;
        margin-top: 21px;
        font-size: clamp(31px, 8.6vw, 42px);
      }

      .description {
        max-width: 560px;
        margin-top: 14px;
        font-size: 15px;
      }

      .actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        margin-top: 23px;
      }

      .button {
        padding-inline: 12px;
        font-size: 12px;
      }

      .button.primary {
        grid-column: 1 / -1;
      }

      .support-note {
        margin-top: 17px;
      }

      .destination-card {
        min-height: 380px;
        border-radius: 19px;
      }

      .photo-caption {
        right: 22px;
        bottom: 23px;
        left: 22px;
      }

      .photo-caption h2 {
        font-size: 30px;
      }

      .site-footer {
        min-height: 58px;
        font-size: 10px;
      }
    }

    @media (max-width: 390px) {
      .topbar,
      .main,
      .site-footer {
        width: calc(100% - 28px);
      }

      .help-link {
        gap: 6px;
        font-size: 11px;
      }

      .help-link svg {
        width: 15px;
        height: 15px;
      }

      .actions {
        gap: 8px;
      }

      .button {
        gap: 7px;
        min-height: 49px;
        padding-inline: 9px;
        font-size: 11px;
      }

      .site-footer {
        gap: 10px;
        letter-spacing: 0;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      *,
      *::before,
      *::after {
        scroll-behavior: auto !important;
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }

      .destination-photo {
        transform: none !important;
      }
    }
  </style>
</head>

<body>
  <div class="site-shell">
    <header class="topbar">
      <a class="brand-link" id="homeBrandLink" href="/" aria-label="SKANDI Travels home">
        <span class="brand-logo-frame">
          <img class="brand-logo" id="brandLogo" alt="SKANDI Travels" />
          <span class="brand-fallback" id="brandFallback" aria-label="SKANDI Travels">
            <svg viewBox="0 0 72 42" fill="none" aria-hidden="true">
              <path d="M3 24c12-12 22-12 34 0s22 12 32 0" stroke="currentColor" stroke-width="5" stroke-linecap="round" />
              <path d="M4 34c11-10 21-10 32 0s22 10 32 0" stroke="#5fc7cf" stroke-width="3" stroke-linecap="round" />
            </svg>
            <span>SKANDI<small>TRAVELS</small></span>
          </span>
        </span>
      </a>
      <a class="help-link" id="headerSupportLink" href="/about/support">
        <span>Help Center</span>
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg>
      </a>
    </header>

    <main class="main">
      <section class="message" aria-labelledby="page-title">
        <p class="eyebrow">Page not found</p>
        <p class="error-code" aria-label="Error 404">40<span>4</span></p>
        <h1 id="page-title">This page has taken another route.</h1>
        <p class="description">The address may have changed, or the link may be out of date. Let’s get you back to the journey you had in mind.</p>

        <nav class="actions" aria-label="Page not found actions">
          <a class="button primary" id="homeLink" href="/">
            <span>Return to homepage</span>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg>
          </a>
          <button class="button back" type="button" id="backButton">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M19 12H6m6 6-6-6 6-6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg>
            <span>Go back</span>
          </button>
        </nav>

        <p class="support-note">Need help finding something? <a id="supportLink" href="/about/support">Visit our Help Center</a>.</p>
      </section>

      <aside class="visual" aria-label="Explore SKANDI destinations">
        <figure class="destination-card">
          <img class="destination-photo" id="destinationPhoto" alt="Mediterranean scenery" />
          <svg class="route-art" viewBox="0 0 260 250" fill="none" aria-hidden="true">
            <path d="M224 28C170 32 171 82 119 91S45 117 55 157s76 40 108 62" stroke="rgba(255,255,255,.86)" stroke-width="1.6" stroke-dasharray="4 8" stroke-linecap="round" />
            <circle cx="224" cy="28" r="5" fill="#5fc7cf" stroke="white" stroke-width="2" />
            <circle cx="163" cy="205" r="5" fill="#5fc7cf" stroke="white" stroke-width="2" />
            <path d="m117 91 7-10 3 10 10 4-10 3-4 10-3-10-10-3 7-4Z" fill="white" opacity=".94" />
          </svg>
          <figcaption class="photo-caption">
            <p class="photo-eyebrow">Unforgettable holidays</p>
            <h2>Your next journey is still waiting.</h2>
            <a class="destination-link" id="destinationsLink" href="/destinations">
              <span>Explore destinations</span>
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg>
            </a>
          </figcaption>
        </figure>
      </aside>
    </main>

    <footer class="site-footer">
      <span class="footer-brand">SKANDI TRAVELS</span>
      <span class="footer-slogan">Unforgettable Holidays.</span>
    </footer>
  </div>

  <script>
    (function () {
      "use strict";

      const MASTER_PARENT_SOURCE = "SKANDI_WIX_PARENT";
      const MASTER_LOGO_FALLBACK = "https://muvpffdnugzxjbnbpgac.supabase.co/storage/v1/object/public/skandi-public-assets/logos/SKANDI_TRAVELS-NAVY-SIDE-WAVE.svg";
      const MASTER_HERO_FALLBACK = "https://muvpffdnugzxjbnbpgac.supabase.co/storage/v1/object/public/skandi-public-assets/branding/skandi_club/SKANDI_MARKETING_CUSTOMER-LIFESTYLE_GREECE_SANTORINI_PREMIUM-TRAVEL_01.png";

      function safeInternalPath(value, fallback) {
        const candidate = String(value || "").trim();
        if (!candidate) return fallback;
        try {
          const parsed = new URL(candidate, window.location.origin);
          if (parsed.origin !== window.location.origin || !/^https?:$/.test(parsed.protocol)) return fallback;
          return `${parsed.pathname}${parsed.search}${parsed.hash}`;
        } catch (_) {
          return fallback;
        }
      }

      function safeImageUrl(value, fallback) {
        const candidate = String(value || "").trim();
        if (!candidate) return fallback;
        try {
          const parsed = new URL(candidate, window.location.href);
          return /^https?:$/.test(parsed.protocol) ? parsed.href : fallback;
        } catch (_) {
          return fallback;
        }
      }

      function safeCssLength(value, fallback) {
        const candidate = String(value || "").trim();
        return /^(?:\d+(?:\.\d+)?)(?:px|rem|em|vw|vh|%)$/.test(candidate) ? candidate : fallback;
      }

      const homeUrl = safeInternalPath(window.SKANDI_404_HOME_URL, "/");
      const destinationsUrl = safeInternalPath(window.SKANDI_404_DESTINATIONS_URL, "/destinations");
      const supportUrl = safeInternalPath(window.SKANDI_404_SUPPORT_URL, "/about/support");
      const homeLink = document.getElementById("homeLink");
      const homeBrandLink = document.getElementById("homeBrandLink");
      const headerSupportLink = document.getElementById("headerSupportLink");
      const supportLink = document.getElementById("supportLink");
      const destinationsLink = document.getElementById("destinationsLink");
      const backButton = document.getElementById("backButton");
      const brandLogo = document.getElementById("brandLogo");
      const brandFallback = document.getElementById("brandFallback");
      const destinationPhoto = document.getElementById("destinationPhoto");

      [homeLink, homeBrandLink].forEach((link) => {
        if (link) link.href = homeUrl;
      });
      [headerSupportLink, supportLink].forEach((link) => {
        if (link) link.href = supportUrl;
      });
      if (destinationsLink) destinationsLink.href = destinationsUrl;

      function showLogo(url) {
        if (!brandLogo || !brandFallback) return;
        const safeUrl = safeImageUrl(url, "");
        if (!safeUrl) {
          brandLogo.classList.add("is-hidden");
          brandFallback.classList.add("is-visible");
          return;
        }
        brandLogo.onload = function () {
          brandLogo.classList.remove("is-hidden");
          brandFallback.classList.remove("is-visible");
        };
        brandLogo.onerror = function () {
          brandLogo.classList.add("is-hidden");
          brandFallback.classList.add("is-visible");
          brandLogo.removeAttribute("src");
        };
        brandLogo.src = safeUrl;
      }

      function showHero(url) {
        if (!destinationPhoto) return;
        const safeUrl = safeImageUrl(url, "");
        if (!safeUrl) {
          destinationPhoto.hidden = true;
          return;
        }
        destinationPhoto.onload = function () {
          destinationPhoto.hidden = false;
        };
        destinationPhoto.onerror = function () {
          destinationPhoto.hidden = true;
          destinationPhoto.removeAttribute("src");
        };
        destinationPhoto.src = safeUrl;
      }

      document.documentElement.style.setProperty("--sk-logo-width", safeCssLength(window.SKANDI_404_LOGO_WIDTH, "260px"));
      document.documentElement.style.setProperty("--sk-logo-height", safeCssLength(window.SKANDI_404_LOGO_HEIGHT, "72px"));
      document.documentElement.style.setProperty("--sk-logo-fit", window.SKANDI_404_LOGO_FIT === "cover" ? "cover" : "contain");

      const configuredLogo = String(window.SKANDI_404_LOGO_URL || "").trim();
      const configuredHero = String(window.SKANDI_404_HERO_IMAGE_URL || "").trim();
      showLogo(configuredLogo || MASTER_LOGO_FALLBACK);
      showHero(configuredHero || MASTER_HERO_FALLBACK);

      window.addEventListener("message", function (event) {
        if (event.source !== window.parent) return;
        const message = event.data;
        if (!message || message.source !== MASTER_PARENT_SOURCE || message.type !== "SKANDI_MASTER_ASSETS") return;
        const assets = message.payload && typeof message.payload === "object" ? message.payload : {};
        const masterLogo = assets.logos && assets.logos.customerHeader;
        const masterHero = assets.images && assets.images.clubLoginHero;
        if (!configuredLogo && masterLogo) showLogo(masterLogo);
        if (!configuredHero && masterHero) showHero(masterHero);
      });

      if (window.parent !== window) {
        window.parent.postMessage({
          source: "SKANDI_ERROR_404",
          type: "MASTER_ASSETS_REQUEST",
          payload: {}
        }, "*");
      }

      if (backButton) {
        backButton.addEventListener("click", function () {
          if (window.history.length > 1) window.history.back();
          else window.location.assign(homeUrl);
        });
      }
    })();
  </script>
</body>
</html>

```
