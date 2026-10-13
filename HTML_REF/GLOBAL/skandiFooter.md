# GLOBAL SKANDI TRAVELS FOOTER

STATUS: V12 SYNC PREPARED — REQUIRES LIVE TEST
SLUG: GLOBAL SECTION
WIX PAGE: `masterPage.js`
AREA: SKANDI
LIVE HTML: YES
ELEMENT: `#skandiFooterEmbed` / `#skandiCustomerFooterEmbed`
LAST SYNCED: 2026-10-13

## INFO
- Complete user-supplied customer footer retained; newsletter, social, branding, columns, assets and parent messages remain intact.
- Bottom utility row is pinned to the requested legal slugs while deriving the Legal/Policies base paths from canonical `MASTER_CONFIG.routes` when available.
- `Staff Login` is a separate action to the right of the legal links and derives its path from `MASTER_CONFIG.routes.staffLogin`/`riaintra` with `/riaintra` fallback.
- Website Disclaimer uses `/about/legal/policies?slug=disclaimer`; the duplicated accessibility route in the request is not used for Disclaimer.
- Navigation continues through the existing `FOOTER_NAVIGATE` → parent contract.
- STATICALLY VERIFIED; REQUIRES LIVE TEST after replacing the Wix global footer HTML.

## CHANGE LOG
- 2026-10-13 — V12 legal/footer sync: canonical legal utility links installed and Staff Login separated to the right; all other footer features retained.

## COMPLETE INTENDED LIVE HTML SOURCE

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"/>
<meta name="theme-color" content="#022e64"/>
<title>SKANDI Customer Footer</title>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet"/>

<style>
:root {
  --sk-navy: #022e64;
  --sk-blue: #0b3a7a;
  --sk-blue-soft: #1f6ba3;
  --sk-ink: #03111f;
  --sk-ink-soft: #061a30;
  --sk-aqua: #5fc7cf;
  --sk-aqua-soft: #9de0e5;
  --sk-ivory: #fbfaf6;
  --sk-porcelain: #f5f1ea;
  --sk-champagne: #d1bc98;
  --sk-limestone: #d8d2c8;
  --sk-graphite: #1a1a1a;
  --sk-muted: #66758a;
  --sk-line: rgba(2,46,100,.12);
  --sk-line-light: rgba(255,255,255,.14);
  --sk-footer-max: 1320px;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

html, body {
  width: 100%;
  min-width: 320px;
  background: transparent;
  color: var(--sk-ivory);
  font-family: "Montserrat", system-ui, -apple-system, "Segoe UI", sans-serif;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
  overflow-x: hidden;
}

button, input { font: inherit; }
button { cursor: pointer; }
img { display: block; max-width: 100%; }

button:focus-visible,
input:focus-visible {
  outline: 2px solid var(--sk-aqua);
  outline-offset: 3px;
}

#skandi-site-footer {
  width: 100%;
  display: block;
  position: relative;
  isolation: isolate;
}

#skandi-site-footer .footer {
  position: relative;
  width: 100%;
  overflow: hidden;
  color: var(--sk-ivory);
  background:
    radial-gradient(circle at 8% 8%, rgba(95,199,207,.12), transparent 27%),
    radial-gradient(circle at 86% 24%, rgba(209,188,152,.08), transparent 29%),
    linear-gradient(150deg, var(--sk-ink) 0%, var(--sk-ink-soft) 34%, var(--sk-navy) 72%, var(--sk-blue) 100%);
}

#skandi-site-footer .footer::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: .42;
  background:
    linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px),
    linear-gradient(rgba(255,255,255,.02) 1px, transparent 1px);
  background-size: 54px 54px;
  mask-image: linear-gradient(180deg, rgba(0,0,0,.20), rgba(0,0,0,.55) 46%, rgba(0,0,0,.12));
}

#skandi-site-footer .footer::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 1px;
  z-index: 4;
  pointer-events: none;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(95,199,207,.72) 28%,
    rgba(209,188,152,.72) 70%,
    transparent 100%
  );
}

/* =========================================================
   NEWSLETTER
   ========================================================= */
#skandi-site-footer .newsletter {
  position: relative;
  z-index: 3;
  overflow: hidden;
  color: var(--sk-navy);
  background:
    radial-gradient(circle at 86% 0%, rgba(95,199,207,.12), transparent 25%),
    linear-gradient(180deg, rgba(251,250,246,.995), rgba(245,241,234,.985));
  border-bottom: 1px solid rgba(3,17,31,.14);
  box-shadow: 0 18px 54px rgba(3,17,31,.08);
}

#skandi-site-footer .newsletter::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: linear-gradient(180deg, var(--sk-aqua), var(--sk-champagne));
}

#skandi-site-footer .news-inner {
  position: relative;
  width: min(100%, var(--sk-footer-max));
  margin: 0 auto;
  padding: 38px clamp(22px, 4vw, 52px);
  display: grid;
  grid-template-columns: minmax(0, 1.18fr) minmax(360px, .82fr);
  gap: clamp(28px, 5vw, 72px);
  align-items: center;
}

#skandi-site-footer .newsletter h2 {
  position: relative;
  margin: 0;
  max-width: 720px;
  color: var(--sk-navy);
  font-size: clamp(25px, 2.5vw, 36px);
  line-height: 1.05;
  letter-spacing: -.045em;
  font-weight: 600;
}

#skandi-site-footer .newsletter h2::before {
  content: "SKANDI TRAVELS · JOURNAL";
  display: block;
  margin-bottom: 10px;
  color: #397f89;
  font-size: 9px;
  line-height: 1;
  letter-spacing: .17em;
  font-weight: 850;
  text-transform: uppercase;
}

#skandi-site-footer .newsletter p {
  max-width: 690px;
  margin: 11px 0 0;
  color: #5d6f82;
  font-size: 12px;
  line-height: 1.7;
  font-weight: 520;
}

#skandi-site-footer #newsletterStatus {
  min-height: 18px;
  margin-top: 8px;
  color: #4a6773;
  font-size: 10px;
  line-height: 1.4;
  font-weight: 700;
}

#skandi-site-footer .news-form {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
  padding: 6px;
  border: 1px solid rgba(2,46,100,.12);
  border-radius: 16px;
  background: rgba(255,255,255,.74);
  box-shadow:
    0 18px 42px rgba(2,46,100,.08),
    inset 0 1px 0 rgba(255,255,255,.88);
  backdrop-filter: blur(18px) saturate(120%);
  -webkit-backdrop-filter: blur(18px) saturate(120%);
}

#skandi-site-footer .news-form:focus-within {
  border-color: rgba(95,199,207,.72);
  box-shadow:
    0 18px 42px rgba(2,46,100,.10),
    0 0 0 3px rgba(95,199,207,.09),
    inset 0 1px 0 rgba(255,255,255,.92);
}

#skandi-site-footer .news-form input {
  min-width: 0;
  height: 44px;
  padding: 0 13px;
  border: 0;
  outline: 0;
  border-radius: 10px;
  background: transparent;
  color: var(--sk-ink);
  font-size: 11px;
  font-weight: 650;
}

#skandi-site-footer .news-form input::placeholder {
  color: #87929f;
  font-weight: 550;
}

#skandi-site-footer .news-form button {
  position: relative;
  min-width: 116px;
  height: 44px;
  overflow: hidden;
  border: 1px solid rgba(3,17,31,.14);
  border-radius: 10px;
  background: linear-gradient(135deg, var(--sk-navy), var(--sk-ink-soft));
  color: #fff;
  box-shadow: 0 8px 22px rgba(2,46,100,.16);
  padding: 0 17px;
  font-size: 9px;
  font-weight: 850;
  letter-spacing: .09em;
  text-transform: uppercase;
  transition: all .2s cubic-bezier(.16,1,.3,1);
}

#skandi-site-footer .news-form button::before {
  content: "";
  position: absolute;
  left: 12px;
  right: 12px;
  top: 0;
  height: 2px;
  opacity: .9;
  background: linear-gradient(90deg, transparent, var(--sk-aqua), var(--sk-champagne), transparent);
}

#skandi-site-footer .news-form button:hover {
  transform: translateY(-1px);
  border-color: rgba(95,199,207,.34);
  background: var(--sk-ink);
  box-shadow: 0 12px 28px rgba(2,46,100,.20);
}

/* =========================================================
   MAIN FOOTER
   ========================================================= */
#skandi-site-footer .footer-main {
  position: relative;
  z-index: 2;
  width: min(100%, var(--sk-footer-max));
  margin: 0 auto;
  padding: 64px clamp(22px, 4vw, 52px) 54px;
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: clamp(48px, 8vw, 140px);
  align-items: flex-start;
}

#skandi-site-footer .brand {
  /* Increased from 280px to 380px to give the much larger logo room */
  flex: 0 1 380px; 
  min-width: 280px;
}

#skandi-site-footer .logo {
  width: 100%;
  /* Significantly increased both max-width and max-height */
  max-width: 360px; 
  max-height: 110px; 
  object-fit: contain;
  object-position: left center;
  margin: 0 0 32px 0;
  background: transparent;
}

#skandi-site-footer .brand p {
  margin: 0 0 24px;
  color: rgba(229,237,242,.7);
  font-size: 11px;
  line-height: 1.7;
}

#skandi-site-footer .social-links {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

#skandi-site-footer .social-btn {
  width: 38px;
  height: 38px;
  flex: 0 0 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 1px solid rgba(255,255,255,.15);
  border-radius: 50%;
  background: rgba(255,255,255,.04);
  color: #fff;
  transition: all .2s cubic-bezier(.16,1,.3,1);
}

#skandi-site-footer .social-btn img {
  width: 18px;
  height: 18px;
  object-fit: contain;
}

#skandi-site-footer .social-btn:hover {
  transform: translateY(-2px);
  border-color: rgba(95,199,207,.6);
  background: rgba(95,199,207,.12);
  box-shadow: 0 8px 20px rgba(0,0,0,.2);
}

#skandi-site-footer #footerColumns {
  flex: 1 1 auto;
  display: grid;
  grid-template-columns: repeat(4, minmax(130px, 1fr));
  gap: clamp(20px, 3vw, 42px);
  max-width: 820px;
}

#skandi-site-footer .col {
  min-width: 0;
}

#skandi-site-footer .col h3 {
  position: relative;
  display: block;
  margin: 0 0 22px;
  padding: 0 0 10px;
  color: var(--sk-champagne);
  font-size: 10px;
  line-height: 1.25;
  font-weight: 850;
  letter-spacing: .15em;
  text-transform: uppercase;
}

#skandi-site-footer .col h3::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: 0;
  width: 24px;
  height: 2px;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--sk-aqua), var(--sk-champagne));
  transition: width .25s ease;
}

#skandi-site-footer .col:hover h3::after { width: 42px; }

#skandi-site-footer .col button {
  position: relative;
  display: block;
  width: max-content;
  max-width: 100%;
  margin: 0 0 12px;
  padding: 2px 0;
  border: 0;
  background: transparent;
  color: rgba(225,234,240,.67);
  text-align: left;
  font-size: 11px;
  line-height: 1.45;
  font-weight: 500;
  transition: color .2s ease, transform .2s cubic-bezier(.16,1,.3,1);
}

#skandi-site-footer .col button::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: 0;
  width: 0;
  height: 1px;
  background: var(--sk-aqua);
  transition: width .22s ease;
}

#skandi-site-footer .col button:hover {
  color: var(--sk-ivory);
  transform: translateX(3px);
}

#skandi-site-footer .col button:hover::after { width: 100%; }

/* =========================================================
   LEGAL / UTILITY STRIP
   ========================================================= */
#skandi-site-footer .footer-bottom {
  position: relative;
  z-index: 2;
  border-top: 1px solid rgba(255,255,255,.08);
  background: rgba(3,17,31,.6);
}

#skandi-site-footer .footer-bottom::before {
  content: "";
  position: absolute;
  left: clamp(22px, 4vw, 52px);
  right: clamp(22px, 4vw, 52px);
  top: -1px;
  height: 1px;
  opacity: .48;
  background: linear-gradient(90deg, transparent, var(--sk-champagne), var(--sk-aqua), transparent);
}

#skandi-site-footer .bottom-row {
  width: min(100%, var(--sk-footer-max));
  margin: 0 auto;
  padding: 24px clamp(22px, 4vw, 52px);
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
}

#skandi-site-footer .bottom-row.copy-row {
  padding-top: 0;
}

#skandi-site-footer .legal-text-container {
  flex: 1 1 min(540px, 100%);
}

#skandi-site-footer #footerTerms {
  margin: 0;
  color: rgba(225,234,240,.55);
  font-size: 9px;
  line-height: 1.6;
}

#skandi-site-footer .bottom-links {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

#skandi-site-footer .bottom-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

#skandi-site-footer .staff-login-btn {
  min-height: 32px;
  padding: 0 15px;
  border: 1px solid rgba(95,199,207,.40);
  border-radius: 8px;
  background: rgba(95,199,207,.09);
  color: #fff;
  font-size: 8px;
  line-height: 1;
  font-weight: 800;
  letter-spacing: .06em;
  text-transform: uppercase;
  transition: all .2s ease;
}

#skandi-site-footer .staff-login-btn:hover {
  transform: translateY(-1px);
  border-color: rgba(95,199,207,.72);
  background: rgba(95,199,207,.16);
}

#skandi-site-footer .bottom-links button {
  min-height: 30px;
  padding: 0 12px;
  border: 1px solid rgba(255,255,255,.12);
  border-radius: 999px;
  background: rgba(255,255,255,.04);
  color: rgba(235,241,245,.75);
  font-size: 8px;
  line-height: 1;
  font-weight: 700;
  letter-spacing: .05em;
  text-transform: uppercase;
  transition: all .2s ease;
}

#skandi-site-footer .bottom-links button:hover {
  transform: translateY(-1px);
  color: #fff;
  border-color: rgba(95,199,207,.45);
  background: rgba(95,199,207,.10);
}

#skandi-site-footer .copyright-text {
  color: rgba(215, 227, 235, .55);
  font-size: 9px;
}

#skandi-site-footer .wordmark-logo {
  max-width: 110px;
  max-height: 20px;
  object-fit: contain;
  opacity: 0.7;
}

/* =========================================================
   RESPONSIVE
   ========================================================= */
@media(max-width: 1024px) {
  #skandi-site-footer .footer-main {
    gap: 48px;
  }
  #skandi-site-footer #footerColumns {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    max-width: none;
  }
}

@media(max-width: 860px) {
  #skandi-site-footer .news-inner {
    grid-template-columns: 1fr;
    gap: 22px;
  }
  #skandi-site-footer .footer-main {
    padding-top: 48px;
    flex-direction: column;
  }
  #skandi-site-footer .brand {
    max-width: 100%;
    margin-bottom: 24px;
  }
}

@media(max-width: 640px) {
  #skandi-site-footer .news-inner { padding: 31px 20px; }
  #skandi-site-footer .newsletter h2 { font-size: 29px; }
  #skandi-site-footer .news-form {
    grid-template-columns: 1fr;
    border-radius: 15px;
  }
  #skandi-site-footer .news-form button { width: 100%; }

  #skandi-site-footer .footer-main {
    padding: 42px 20px 36px;
    gap: 32px;
  }
  
  #skandi-site-footer #footerColumns {
    grid-template-columns: 1fr;
    gap: 24px;
  }

  #skandi-site-footer .logo { margin-bottom: 24px; }

  #skandi-site-footer .bottom-row {
    flex-direction: column;
    align-items: flex-start;
    padding: 24px 20px;
    gap: 20px;
  }
  #skandi-site-footer .bottom-row.copy-row {
    padding-top: 0;
    flex-direction: column-reverse;
    gap: 16px;
  }

  #skandi-site-footer .bottom-actions {
    width: 100%;
    margin-left: 0;
    justify-content: flex-start;
  }
}

@media(prefers-reduced-motion: reduce) {
  #skandi-site-footer *,
  #skandi-site-footer *::before,
  #skandi-site-footer *::after {
    scroll-behavior: auto !important;
    animation: none !important;
    transition-duration: .01ms !important;
  }
}
</style>
</head>
<body>

<div id="skandi-site-footer">
<footer class="footer" data-component="customer-footer">

  <section class="newsletter">
    <div class="news-inner">
      <div>
        <h2 id="newsletterTitle">Get SKANDI offers and travel inspiration</h2>
        <p id="newsletterDescription">
          Receive destination guides, SKANDI Collections updates and member offers.
        </p>
        <div id="newsletterStatus" aria-live="polite"></div>
      </div>

      <div class="news-form">
        <input id="newsletterEmail" type="email" placeholder="Email address" autocomplete="email"/>
        <button id="newsletterBtn" type="button">Sign up</button>
      </div>
    </div>
  </section>

  <section class="footer-main">
    <div class="brand">
      <img id="footerLogo" class="logo" alt="SKANDI Travels">
      <div class="social-links" id="socialLinks" aria-label="Social media links"></div>
    </div>
    
    <!-- Removed display:contents to force the 4 columns to stay right -->
    <div id="footerColumns"></div>
  </section>

  <section class="footer-bottom">
    <div class="bottom-row">
      <div class="legal-text-container">
        <p id="footerTerms"> 
          Payment methods, supplier terms, and package travel conditions vary by product.<br>
          SKANDI TRAVELS acts as a direct operator for select proprietary services and as an agent for independent third-party suppliers.
        </p>
      </div>
      <div class="bottom-actions">
        <div class="bottom-links" id="bottomLinks"></div>
        <button class="staff-login-btn" id="staffLoginBtn" type="button" data-path="/riaintra">Staff Login</button>
      </div>
    </div>

    <div class="bottom-row copy-row">
      <div class="copyright-text">
        © <span id="year"></span> SKANDI GROUP Inc. (United States) &amp; SKANDI GROUP Aktiebolag (Sweden). All rights reserved. SKANDI TRAVELS™ is a trademark of the SKANDI GROUP.
      </div>
      <img id="wordmarkLogo" class="wordmark-logo" alt="SKANDI GROUP" style="display:none;">
    </div>
  </section>

</footer>
</div>

<script>
"use strict";

(() => {
  const SOURCE = "SKANDI_CUSTOMER_FOOTER";
  const PARENT = "SKANDI_WIX_PARENT";

  let master = null;

  const $ = (id) => document.getElementById(id);

  function esc(v) {
    return String(v ?? "").replace(/[&<>'"]/g, (c) => ({
      "&":"&amp;",
      "<":"&lt;",
      ">":"&gt;",
      "'":"&#39;",
      '"':"&quot;"
    }[c]));
  }

  function post(type, payload = {}) {
    window.parent.postMessage({
      source: SOURCE,
      type,
      payload,
      timestamp: new Date().toISOString()
    }, "*");
  }

  function getAsset(...keys) {
    const logos = master?.brand?.assets?.logos || {};
    const root = master?.brand?.assets || {};

    for (const key of keys) {
      if (logos[key]) return logos[key];
      if (root[key]) return root[key];
    }

    return "";
  }

  function renderAssets() {
    const footerLogo = getAsset("skandiWhite");
    if (footerLogo && $("footerLogo")) {
      $("footerLogo").src = footerLogo;
    }
    const wordmark = getAsset("skandiGroupWhite");
    if (wordmark && $("wordmarkLogo")) {
      $("wordmarkLogo").src = wordmark;
      $("wordmarkLogo").style.display = "block";
    }
  }

  function renderNewsletter() {
    const newsletter = master?.customer?.footer?.newsletter || {};

    $("newsletterTitle").textContent = newsletter.title || "Get SKANDI offers and travel inspiration";
    $("newsletterDescription").textContent = newsletter.description || "Receive destination guides, Signature Collection updates and member offers.";
    $("newsletterBtn").textContent = newsletter.buttonLabel || "Sign up";
    $("newsletterEmail").placeholder = newsletter.placeholder || "Email address";
  }

  function renderSocials() {
    const socialLinks = Array.isArray(master?.customer?.footer?.socialLinks) 
      ? master.customer.footer.socialLinks 
      : [];

    $("socialLinks").innerHTML = socialLinks.map((item) => {
      const icon = item.iconAssetKey ? getAsset(item.iconAssetKey) : (item.iconUrl || "");
      return `
        <button class="social-btn" type="button" data-external-url="${esc(item.url || "")}" aria-label="${esc(item.label || "")}">
          ${icon ? `<img src="${esc(icon)}" alt="${esc(item.label || "")}">` : `<span style="font-size:10px;color:#fff;font-weight:800;">${esc(item.label || "")}</span>`}
        </button>
      `;
    }).join("");
  }

  function renderColumns() {
    const columns = Array.isArray(master?.customer?.footer?.columns) 
      ? master.customer.footer.columns 
      : [];

    $("footerColumns").innerHTML = columns.map((column) => `
      <div class="col">
        <h3>${esc(column.title || "")}</h3>
        ${(Array.isArray(column.links) ? column.links : []).map((item) => `
          <button type="button" data-path="${esc(item.path || "")}">
            ${esc(item.label || "")}
          </button>
        `).join("")}
      </div>
    `).join("");
  }

  function renderBottom() {
    const footer = master?.customer?.footer || {};

    $("footerTerms").innerHTML = footer.termsText || "Payment methods, supplier terms, and package travel conditions vary by product.<br>SKANDI TRAVELS acts as a direct operator for select proprietary services and as an agent for independent third-party suppliers.";

    const policiesPath = String(master?.routes?.policies || "/about/legal/policies").split("?")[0];
    const legalPath = String(master?.routes?.legal || "/about/legal");
    const staffPath = String(master?.routes?.staffLogin || master?.routes?.riaintra || "/riaintra");

    const links = [
      { label:"Cookies", path:`${policiesPath}?slug=skandi-travels-cookies-policy` },
      { label:"Privacy Policy", path:`${policiesPath}?slug=privacy-policy` },
      { label:"Accessibility Statement", path:`${policiesPath}?slug=accessibility` },
      { label:"Booking Terms", path:`${policiesPath}?slug=booking-terms` },
      { label:"Website Disclaimer", path:`${policiesPath}?slug=disclaimer` },
      { label:"Legal", path:legalPath }
    ];

    if ($("staffLoginBtn")) $("staffLoginBtn").setAttribute("data-path", staffPath);

    $("bottomLinks").innerHTML = links.map((item) => `
      <button type="button" data-path="${esc(item.path || "")}">
        ${esc(item.label || "")}
      </button>
    `).join("");
  }

  function renderAll() {
    renderAssets();
    renderNewsletter();
    renderSocials();
    renderColumns();
    renderBottom();
  }

  document.addEventListener("click", (event) => {
    const path = event.target.closest("[data-path]")?.getAttribute("data-path");
    if (path) {
      post("FOOTER_NAVIGATE", { path });
      return;
    }

    const externalUrl = event.target.closest("[data-external-url]")?.getAttribute("data-external-url");
    if (externalUrl) {
      window.open(externalUrl, "_blank", "noopener,noreferrer");
    }
  });

  function subscribe() {
    const email = $("newsletterEmail")?.value?.trim() || "";
    post("FOOTER_NEWSLETTER_SIGNUP", { email, source: "Footer" });
  }

  $("newsletterBtn")?.addEventListener("click", subscribe);
  $("newsletterEmail")?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      subscribe();
    }
  });

  window.addEventListener("message", (event) => {
    let msg = event.data;
    if (typeof msg === "string") {
      try { msg = JSON.parse(msg); } catch (_) { return; }
    }
    if (!msg || typeof msg !== "object") return;
    if (msg.source !== PARENT) return;

    if (msg.type === "SKANDI_MASTER_CONFIG") {
      master = msg.payload || {};
      renderAll();
      return;
    }

    if (msg.type === "CUSTOMER_FOOTER_STATE") {
      renderAll();
      return;
    }

    if (msg.type === "FOOTER_NEWSLETTER_RESULT") {
      const result = msg.payload || {};
      $("newsletterStatus").textContent = result.message || result.error || (result.ok ? "Thank you. You are subscribed." : "Newsletter signup could not be completed.");
    }
  });

  $("year").textContent = new Date().getFullYear();

  post("MASTER_CONFIG_REQUEST", { context: "customer-footer" });
  post("FOOTER_READY");
})();
</script>
</body>
</html>
```
