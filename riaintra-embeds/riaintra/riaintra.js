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
