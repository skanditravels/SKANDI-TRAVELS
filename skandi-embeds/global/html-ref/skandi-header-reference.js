
"use strict";

(() => {
  const SOURCE = "SKANDI_CUSTOMER_HEADER_EXPANDBAR";
  const PARENT = "SKANDI_WIX_PARENT";


  function updateHeaderFx(event) {
    const header = $("header");
    if (!header || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = header.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100));
    header.style.setProperty("--fx-x", `${x.toFixed(1)}%`);
    header.style.setProperty("--fx-y", `${y.toFixed(1)}%`);
  }

  function resetHeaderFx() {
    const header = $("header");
    if (!header) return;
    header.style.setProperty("--fx-x", "50%");
    header.style.setProperty("--fx-y", "26%");
  }

  const LANGUAGES = new Set(["EN","SV","NO","DA"]);
  const CURRENCIES = new Set(["USD","SEK","NOK","DKK","EUR"]);

  const HEADER_I18N = {
    EN:{
      "nav.search":"Search",
      "nav.clubBtn":"Login",
      "nav.menu":"MENU",
      "nav.signIn":"Sign in",
      "settings.language":"Language",
      "settings.currency":"Currency"
    },
    SV:{
      "nav.search":"Sök",
      "nav.clubBtn":"Login",
      "nav.menu":"MENY",
      "nav.signIn":"Logga in",
      "settings.language":"Språk",
      "settings.currency":"Valuta"
    },
    NO:{
      "nav.search":"Søk",
      "nav.clubBtn":"Login",
      "nav.menu":"MENY",
      "nav.signIn":"Logg inn",
      "settings.language":"Språk",
      "settings.currency":"Valuta"
    },
    DA:{
      "nav.search":"Søg",
      "nav.clubBtn":"Login",
      "nav.menu":"MENU",
      "nav.signIn":"Log ind",
      "settings.language":"Sprog",
      "settings.currency":"Valuta"
    }
  };

  let master = null;
  let session = {
    loggedIn:false,
    displayName:"",
    email:"",
    points:0,
    tierName:"",
    menu:[]
  };
  let userSettings = { language:"EN", currency:"USD" };
  let mobileMenuOpen = false;

  const $ = id => document.getElementById(id);

  function esc(value) {
    return String(value ?? "").replace(/[&<>'"]/g, character => ({
      "&":"&amp;",
      "<":"&lt;",
      ">":"&gt;",
      "'":"&#39;",
      '"':"&quot;"
    }[character]));
  }

  function post(type, payload = {}) {
    window.parent.postMessage({
      source:SOURCE,
      type,
      payload,
      timestamp:new Date().toISOString()
    }, "*");
  }

  function normalizeSettings(value = {}) {
    const source =
      value?.settings && typeof value.settings === "object"
        ? value.settings
        : value;

    const language = String(source?.language || "").trim().toUpperCase();
    const currency = String(source?.currency || "").trim().toUpperCase();

    return {
      language:LANGUAGES.has(language) ? language : "EN",
      currency:CURRENCIES.has(currency) ? currency : "USD"
    };
  }

  function currentLanguage() {
    return userSettings.language || "EN";
  }

  function translation(key, fallback = "") {
    const lang = currentLanguage();

    return (
      HEADER_I18N[lang]?.[key] ??
      HEADER_I18N.EN?.[key] ??
      fallback
    );
  }

  function applyTranslations() {
    document.querySelectorAll("[data-i18n]").forEach(element => {
      const value = translation(
        element.getAttribute("data-i18n"),
        ""
      );

      if (value) {
        element.textContent = value;
      }
    });

    document.documentElement.lang =
      ({EN:"en",SV:"sv",NO:"no",DA:"da"})[currentLanguage()] || "en";
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

  function applyBrandAssets() {
    const headerLogo =
      getAsset(
        "customerHeader",
        "skandiTravels",
        "skandiPrimary"
      );

    if (headerLogo && $("headerLogo")) {
      $("headerLogo").src = headerLogo;
    }
  }

  function renderMasterSlogan() {
    const target = $("masterSlogan");
    if (!target) return;

    const slogans = master?.brand?.slogans || {};
    const languageKey = currentLanguage().toLowerCase();

    // The slogan is intentionally NOT hard-coded in this header.
    // masterPage.js / MASTER_CONFIG.brand.slogans is the single source of truth.
    const slogan =
      String(
        slogans[languageKey] ??
        slogans.en ??
        ""
      ).trim();

    target.textContent = slogan;
    target.title = slogan;
  }

  function cacheSettings() {
    try {
      localStorage.setItem(
        "skandi_user_settings",
        JSON.stringify(userSettings)
      );
    } catch (_) {}
  }

  function readCache() {
    try {
      const cached =
        JSON.parse(
          localStorage.getItem("skandi_user_settings") || "null"
        );

      if (cached) {
        userSettings = normalizeSettings(cached);
      }
    } catch (_) {}
  }

  function updateSettingsUI() {
    if ($("langSelect")) {
      $("langSelect").value = userSettings.language;
    }

    if ($("currSelect")) {
      $("currSelect").value = userSettings.currency;
    }

    if ($("mobileLangSelect")) {
      $("mobileLangSelect").value = userSettings.language;
    }

    if ($("mobileCurrSelect")) {
      $("mobileCurrSelect").value = userSettings.currency;
    }

    if ($("settingsSummary")) {
      $("settingsSummary").textContent =
        `${userSettings.language} · ${userSettings.currency}`;
    }

    applyTranslations();
    renderMasterSlogan();
  }

  function applyParentSettings(value = {}) {
    userSettings = normalizeSettings(value);
    cacheSettings();
    updateSettingsUI();
  }

  function setSettingsOpen(open) {
    const menu = $("settingsMenu");
    const header = $("header");
    const button = $("settingsBtn");
    if (!menu || !header || !button) return;

    const next = Boolean(open);
    menu.classList.toggle("open", next);
    header.classList.toggle("settings-open", next);
    button.setAttribute("aria-expanded", String(next));
  }

  function closeSettings() {
    setSettingsOpen(false);
  }

  function saveSettings(language, currency) {
    userSettings = normalizeSettings({
      language,
      currency
    });

    cacheSettings();
    updateSettingsUI();

    post(
      "UPDATE_SETTINGS",
      { ...userSettings }
    );
  }

  function navItems() {
    return Array.isArray(master?.customer?.header?.primaryNav)
      ? master.customer.header.primaryNav
      : [];
  }

  function secondaryItems() {
    return Array.isArray(master?.customer?.header?.secondaryNav)
      ? master.customer.header.secondaryNav
      : [];
  }

  function accountItems() {
    return Array.isArray(master?.customer?.header?.accountNav)
      ? master.customer.header.accountNav
      : [];
  }

  function currentPath() {
    return String(master?.currentPath || "");
  }

  function isActivePath(path) {
    const value = String(path || "").split("?")[0];
    const current = currentPath().split("?")[0];

    return Boolean(
      value &&
      (
        current === value ||
        current.startsWith(value + "/")
      )
    );
  }

  function navTo(path) {
    const value = String(path || "").trim();
    if (!value) return;

    closeDesktopSearch();
    closeMobile();
    closeClub();
    closeSettings();

    post(
      "HEADER_NAVIGATE",
      { path:value }
    );
  }

  function renderDesktopNav() {
    const nav = $("nav");
    if (!nav) return;

    const items = [
      ...navItems(),
      ...(session.loggedIn
        ? accountItems().filter(item =>
            String(item.id || "").toLowerCase().includes("profile") ||
            String(item.label || "").toLowerCase().includes("profile")
          )
        : [])
    ];

    nav.innerHTML = items.map(item => `
      <button
        class="nav-btn${isActivePath(item.path) ? " active" : ""}"
        type="button"
        data-path="${esc(item.path || "")}">
        ${esc(item.label || "")}
      </button>
    `).join("");

    nav.querySelectorAll("[data-path]").forEach(button => {
      button.addEventListener(
        "click",
        () => navTo(button.dataset.path)
      );
    });
  }

  function renderMobileNav() {
    const list = $("mobileList");
    if (!list) return;

    const items = [
      ...navItems(),
      ...secondaryItems(),
      ...(session.loggedIn
        ? accountItems()
        : [])
    ];

    list.innerHTML = items.map(item => `
      <button
        class="mobile-menu-link${isActivePath(item.path) ? " active" : ""}"
        type="button"
        data-path="${esc(item.path || "")}">
        ${esc(item.label || "")}
      </button>
    `).join("");

    list.querySelectorAll("[data-path]").forEach(button => {
      button.addEventListener(
        "click",
        () => navTo(button.dataset.path)
      );
    });

    if ($("mobileAccount")) {
      $("mobileAccount").textContent =
        session.loggedIn
          ? (
              session.displayName ||
              master?.brand?.travelName ||
              ""
            )
          : (
              master?.brand?.travelName ||
              "SKANDI Travels"
            );
    }

    if ($("mobileAccountBtn")) {
      $("mobileAccountBtn").textContent = session.loggedIn
          ? "My Club"
          : translation("nav.clubBtn","Login");
    }
    if ($("mobileLogoutBtn")) {
      $("mobileLogoutBtn").hidden = !session.loggedIn;
    }
  }

  function renderAccountMini() {
    const target = $("accountMini");
    if (!target) return;

    if (!session.loggedIn) {
      target.innerHTML = "";
      return;
    }

    const name =
      session.displayName ||
      "Member";

    const email =
      String(session.email || "").trim();

    const points =
      Number(session.points || 0);

    const tier = String(session.tierName || "").trim();

    target.innerHTML = `
      <div class="account-mini-details">
        <span class="account-mini-name">${esc(name)}</span>
        ${tier ? `
          <span class="account-mini-separator">·</span>
          <span class="account-mini-tier">${esc(tier)}</span>
        ` : ""}
        ${email ? `
          <span class="account-mini-separator">·</span>
          <span class="account-mini-email">${esc(email)}</span>
        ` : ""}
        <span class="account-mini-separator">·</span>
        <span class="account-mini-points">${points.toLocaleString()} pts</span>
      </div>
    `;
  }

  function setClubBusy(busy) {
    if ($("clubLoginSubmit")) {
      $("clubLoginSubmit").disabled = Boolean(busy);
    }
  }

  function setClubMessage(message = "", kind = "") {
    const target = $("clubLoginStatus");
    if (!target) return;

    target.textContent = String(message || "");
    target.classList.toggle("error", kind === "error");
  }

  function openClub(context = "") {
    closeDesktopSearch();
    closeMobile();

    closeSettings();

    if ($("clubPanel")) {
      $("clubPanel").classList.add("open");
    }

    if (context === "favorites") {
      setClubMessage(
        "Sign in to open your saved favorites."
      );
    }

    requestAnimationFrame(
      () => $("loginEmail")?.focus()
    );
  }

  function closeClub() {
    $("clubPanel")?.classList.remove("open");
    setClubBusy(false);
  }

  function renderClub() {
    if (session.loggedIn) {
      setClubBusy(false);
      setClubMessage("");
      closeClub();
    }
  }

  function openMobile() {
    closeClub();
    closeDesktopSearch();

    mobileMenuOpen = true;

    $("mobileMenuLayer")?.classList.add("open");
    $("mobileMenuLayer")?.setAttribute("aria-hidden","false");
    $("mobileBtn")?.setAttribute("aria-expanded","true");

    document.documentElement.classList.add("mobile-menu-open");
    document.body.classList.add("mobile-menu-open");
  }

  function closeMobile() {
    mobileMenuOpen = false;

    $("mobileMenuLayer")?.classList.remove("open");
    $("mobileMenuLayer")?.setAttribute("aria-hidden","true");
    $("mobileBtn")?.setAttribute("aria-expanded","false");

    document.documentElement.classList.remove("mobile-menu-open");
    document.body.classList.remove("mobile-menu-open");

    closeMobileSearch();
  }

  function searchPath(query) {
    const q =
      String(query || "")
        .trim()
        .replace(/\s+/g," ")
        .slice(0,100);

    if (!q) return "";

    const base =
      String(master?.routes?.search || "/search")
        .split("?")[0];

    return `${base}?q=${encodeURIComponent(q)}`;
  }

  function submitSearch(inputId) {
    const input = $(inputId);
    const path = searchPath(input?.value || "");

    if (!path) {
      input?.focus();
      return;
    }

    navTo(path);
  }

  function openDesktopSearch() {
    closeClub();
    closeMobile();

    closeSettings();

    $("searchWrap")?.classList.add("open");

    requestAnimationFrame(
      () => $("headerSearchInput")?.focus()
    );
  }

  function closeDesktopSearch() {
    $("searchWrap")?.classList.remove("open");
  }

  function openMobileSearch() {
    $("mobileSearchWrap")?.classList.add("open");

    requestAnimationFrame(
      () => $("mobileSearchInput")?.focus()
    );
  }

  function closeMobileSearch() {
    $("mobileSearchWrap")?.classList.remove("open");
  }

  function renderAll() {
    applyBrandAssets();
    renderDesktopNav();
    renderMobileNav();
    renderClub();
    renderAccountMini();
    applyTranslations();
    renderMasterSlogan();
    updateSettingsUI();

    if ($("clubBtn")) {
      $("clubBtn").textContent = session.loggedIn ? "My Club" : translation("nav.clubBtn","Login");
      $("clubBtn").setAttribute("aria-label", session.loggedIn ? "Open My Profile" : "Open Login");
    }
    if ($("customerLogoutBtn")) {
      $("customerLogoutBtn").hidden = !session.loggedIn;
    }
  }

  function bind() {
    $("header")?.addEventListener("pointermove", updateHeaderFx, { passive:true });
    $("header")?.addEventListener("pointerleave", resetHeaderFx, { passive:true });
    $("logoBtn")?.addEventListener("click", () => {
      navTo(master?.routes?.home || "/");
    });

    $("favBtn")?.addEventListener("click", () => {
      if (session.loggedIn) {
        navTo(
          master?.routes?.mySaved ||
          "/my-profile?section=profile&view=saved"
        );
      } else {
        openClub("favorites");
      }
    });

    $("clubBtn")?.addEventListener("click", () => {
      if (session.loggedIn) {
        navTo(
          master?.routes?.myProfile ||
          "/my-profile"
        );
      } else {
        openClub();
      }
    });

    $("customerLogoutBtn")?.addEventListener("click", () => {
      post("HEADER_LOGOUT");
    });

    $("clubClose")?.addEventListener(
      "click",
      closeClub
    );

    $("inlineLoginForm")?.addEventListener("submit", event => {
      event.preventDefault();

      const email =
        $("loginEmail")?.value?.trim() || "";

      const password =
        $("loginPassword")?.value || "";

      if (!email || !password) {
        setClubMessage(
          "Enter your email and password.",
          "error"
        );
        return;
      }

      setClubBusy(true);
      setClubMessage("Signing in…");

      post(
        "HEADER_LOGIN_SUBMIT",
        { email, password }
      );
    });

    document.addEventListener("click", event => {
      const action =
        event.target.closest("[data-action]");

      if (action?.dataset.action === "forgot-password") {
        setClubMessage("");
        navTo(master?.routes?.forgotPassword || "/forgot-password");
        return;
      }

      if (action?.dataset.action === "join-club") {
        navTo(
          master?.routes?.club ||
          "/skandi-club"
        );
      }
    });

    $("mobileBtn")?.addEventListener("click", () => {
      mobileMenuOpen
        ? closeMobile()
        : openMobile();
    });

    $("mobileMenuBackdrop")?.addEventListener(
      "click",
      closeMobile
    );

    $("mobileMenuClose")?.addEventListener(
      "click",
      closeMobile
    );

    $("searchBtn")?.addEventListener("click", () => {
      if (!$("searchWrap")?.classList.contains("open")) {
        openDesktopSearch();
        return;
      }

      submitSearch("headerSearchInput");
    });

    $("headerSearchGo")?.addEventListener(
      "click",
      () => submitSearch("headerSearchInput")
    );

    $("headerSearchInput")?.addEventListener("keydown", event => {
      if (event.key === "Enter") {
        event.preventDefault();
        submitSearch("headerSearchInput");
      }

      if (event.key === "Escape") {
        closeDesktopSearch();
        $("searchBtn")?.focus();
      }
    });

    $("mobileSearchBtn")?.addEventListener("click", () => {
      if (!$("mobileSearchWrap")?.classList.contains("open")) {
        openMobileSearch();
        return;
      }

      submitSearch("mobileSearchInput");
    });

    $("mobileSearchInput")?.addEventListener("keydown", event => {
      if (event.key === "Enter") {
        event.preventDefault();
        submitSearch("mobileSearchInput");
      }

      if (event.key === "Escape") {
        closeMobileSearch();
      }
    });

    $("mobileAccountBtn")?.addEventListener("click", () => {
      closeMobile();

      if (session.loggedIn) {
        navTo(master?.routes?.myProfile || "/my-profile");
      } else {
        openClub();
      }
    });

    $("mobileLogoutBtn")?.addEventListener("click", () => {
      closeMobile();
      post("HEADER_LOGOUT");
    });

    $("settingsBtn")?.addEventListener("click", event => {
      event.stopPropagation();

      const menu = $("settingsMenu");
      if (!menu) return;

      const opening = !menu.classList.contains("open");
      closeDesktopSearch();
      setSettingsOpen(opening);
    });

    document.addEventListener("click", event => {
      if (
        $("settingsMenu") &&
        !$("settingsMenu").contains(event.target) &&
        !$("settingsBtn")?.contains(event.target)
      ) {
        closeSettings();
      }

      if (
        $("searchWrap")?.classList.contains("open") &&
        !$("searchWrap").contains(event.target)
      ) {
        closeDesktopSearch();
      }
    });

    $("saveSettingsBtn")?.addEventListener("click", () => {
      saveSettings(
        $("langSelect")?.value,
        $("currSelect")?.value
      );

      closeSettings();
    });

    $("mobileLangSelect")?.addEventListener("change", event => {
      saveSettings(
        event.target.value,
        userSettings.currency
      );
    });

    $("mobileCurrSelect")?.addEventListener("change", event => {
      saveSettings(
        userSettings.language,
        event.target.value
      );
    });

    document.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        closeDesktopSearch();
        closeMobile();
        closeClub();
        closeSettings();
      }
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 900) {
        closeMobile();
      }
    });
  }

  window.addEventListener("message", event => {
    let msg = event.data;

    if (typeof msg === "string") {
      try {
        msg = JSON.parse(msg);
      } catch (_) {
        return;
      }
    }

    if (
      !msg ||
      typeof msg !== "object" ||
      msg.source !== PARENT
    ) {
      return;
    }

    if (msg.type === "SKANDI_MASTER_CONFIG") {
      master = msg.payload || {};

      if (master?.settings) {
        applyParentSettings(
          master.settings
        );
      }

      renderAll();
      return;
    }

    if (
      msg.type === "CUSTOMER_SETTINGS_STATE" ||
      msg.type === "SKANDI_SETTINGS_STATE"
    ) {
      applyParentSettings(
        msg.payload || {}
      );

      renderAll();
      return;
    }

    if (msg.type === "CUSTOMER_SETTINGS_SAVED") {
      if (msg.payload?.ok) {
        applyParentSettings(
          msg.payload?.state ||
          msg.payload
        );
      }

      return;
    }

    if (msg.type === "CUSTOMER_HEADER_STATE") {
      session = {
        loggedIn:Boolean(msg.payload?.loggedIn),
        displayName:msg.payload?.displayName || "",
        email:msg.payload?.email || "",
        points:Number(msg.payload?.points || 0),
        tierName:msg.payload?.tierName || "",
        menu:Array.isArray(msg.payload?.menu)
          ? msg.payload.menu
          : []
      };

      if (session.loggedIn) {
        setClubBusy(false);
        setClubMessage("");
        closeClub();
      }

      renderAll();
      return;
    }

    if (msg.type === "HOME_ERROR") {
      setClubBusy(false);

      setClubMessage(
        msg.payload?.message ||
        "Invalid email or password. Please try again.",
        "error"
      );

      return;
    }

    if (msg.type === "CLOSE_CUSTOMER_HEADER_PANELS") {
      closeDesktopSearch();
      closeMobile();
      closeClub();
      closeSettings();
    }
  });

  readCache();
  bind();
  renderAll();

  post(
    "MASTER_CONFIG_REQUEST",
    { context:"customer-header" }
  );

  post(
    "CUSTOMER_SETTINGS_REQUEST"
  );

  post(
    "SKANDI_EMBED_RESIZE",
    { height:118 }
  );

  post(
    "HEADER_READY"
  );
})();
