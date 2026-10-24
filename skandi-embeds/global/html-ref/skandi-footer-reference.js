
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
    const footerLogo = getAsset("skandiWhite") || getAsset("customerFooter");
    if (footerLogo && $("footerLogo")) $("footerLogo").src = footerLogo;
    const wordmark = getAsset("skandiGroupWhite");
    if (wordmark && $("wordmarkLogo")) {
      $("wordmarkLogo").src = wordmark;
      $("wordmarkLogo").style.display = "block";
    }
  }

  function renderNewsletter() {
    const newsletter =
      master?.customer?.footer?.newsletter ||
      {};

    $("newsletterTitle").textContent =
      newsletter.title ||
      "Get SKANDI offers and travel inspiration";

    $("newsletterDescription").textContent =
      newsletter.description ||
      "Receive destination guides, Signature Collection updates and member offers.";

    $("newsletterBtn").textContent =
      newsletter.buttonLabel ||
      "Sign up";

    $("newsletterEmail").placeholder =
      newsletter.placeholder ||
      "Email address";
  }

  function renderSocials() {
    const socialLinks =
      Array.isArray(master?.customer?.footer?.socialLinks)
        ? master.customer.footer.socialLinks
        : [];

    $("socialLinks").innerHTML = socialLinks.map((item) => {
      const icon =
        item.iconAssetKey
          ? getAsset(item.iconAssetKey)
          : (item.iconUrl || "");

      return `
        <button
          class="social-btn"
          type="button"
          data-external-url="${esc(item.url || "")}"
          aria-label="${esc(item.label || "")}">
          ${icon
            ? `<img src="${esc(icon)}" alt="${esc(item.label || "")}">`
            : `<span style="font-size:10px;color:#fff;font-weight:800;">${esc(item.label || "")}</span>`
          }
        </button>
      `;
    }).join("");
  }

  function renderColumns() {
    const columns =
      Array.isArray(master?.customer?.footer?.columns)
        ? master.customer.footer.columns
        : [];

    $("footerColumns").innerHTML = columns.map((column) => `
      <div class="col">
        <h3>${esc(column.title || "")}</h3>

        ${(Array.isArray(column.links) ? column.links : [])
          .map((item) => `
            <button
              type="button"
              data-path="${esc(item.path || "")}">
              ${esc(item.label || "")}
            </button>
          `)
          .join("")}
      </div>
    `).join("");
  }

  function renderBottom() {
    const footer = master?.customer?.footer || {};

    // The dynamic terms copy is owned by the canonical master config.
    // Default is the approved V12 operator/agency language.
    const fallbackTerms = "Payment methods, supplier terms, and package travel conditions vary by product.<br>SKANDI TRAVELS acts as a direct operator for select proprietary services and as an agent for independent third-party suppliers.";
    $("footerTerms").innerHTML = footer.termsText || fallbackTerms;

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
    $("bottomLinks").innerHTML = links.map(item => `
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
    const path =
      event.target.closest("[data-path]")?.getAttribute("data-path");

    if (path) {
      post("FOOTER_NAVIGATE", { path });
      return;
    }

    const externalUrl =
      event.target.closest("[data-external-url]")?.getAttribute("data-external-url");

    if (externalUrl) {
      window.open(
        externalUrl,
        "_blank",
        "noopener,noreferrer"
      );
    }
  });

  function subscribe() {
    const email =
      $("newsletterEmail")?.value?.trim() ||
      "";

    post("FOOTER_NEWSLETTER_SIGNUP", {
      email,
      source: "Footer"
    });
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
      try {
        msg = JSON.parse(msg);
      } catch (_) {
        return;
      }
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

      $("newsletterStatus").textContent =
        result.message ||
        result.error ||
        (result.ok
          ? "Thank you. You are subscribed."
          : "Newsletter signup could not be completed.");
    }
  });

  $("year").textContent = new Date().getFullYear();

  post("MASTER_CONFIG_REQUEST", {
    context: "customer-footer"
  });

  post("FOOTER_READY");
})();
