const SOURCE = "SKANDI_STAFF_LOGIN";
  const PARENT_SOURCE = "SKANDI_WIX_PARENT";

  const cardWrap = document.getElementById("login-card-wrap");
  const loginForm = document.getElementById("login-form");
  const loginError = document.getElementById("login-error");
  const loginNotice = document.getElementById("login-notice");
  const usernameInput = document.getElementById("login-username");
  const passwordInput = document.getElementById("login-password");
  const loginBtn = document.getElementById("login-submit");
  const forgotBtn = document.getElementById("forgot-password");
  const passwordVisibilityBtn = document.getElementById("password-visibility");
  const passwordFieldGroup = passwordInput.closest(".field-group");
  const passwordLabel = passwordFieldGroup?.querySelector('label[for="login-password"]');
  const formSubtitle = cardWrap?.querySelector(".login-intro");

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
  let authStep = "CREDENTIALS"; // "CREDENTIALS" | "OTP"
  let verifiedSkId = "";

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
    if (requestId) message.requestId = requestId;
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

  function setAuthStep(step, maskedEmail = "") {
    authStep = step;
    setError("");

    if (step === "CREDENTIALS") {
      verifiedSkId = "";
      usernameInput.disabled = false;

      if (passwordFieldGroup) passwordFieldGroup.style.display = "";
      if (passwordLabel) passwordLabel.textContent = "Password";
      if (passwordVisibilityBtn) {
        passwordVisibilityBtn.style.display = "";
        passwordVisibilityBtn.textContent = "Show";
        passwordVisibilityBtn.setAttribute("aria-pressed", "false");
      }

      passwordInput.type = "password";
      passwordInput.inputMode = "text";
      passwordInput.autocomplete = "current-password";
      passwordInput.maxLength = 256;
      passwordInput.placeholder = "Enter your password";
      passwordInput.value = "";

      if (formSubtitle) {
        formSubtitle.textContent = "Sign in with your SK-ID and password to access RIAINTRA.";
      }
      loginBtn.textContent = "Sign in to RIAINTRA";

      if (forgotBtn) {
        forgotBtn.style.display = "";
        forgotBtn.textContent = "Forgot your password?";
      }
      setNotice("");
    } else if (step === "OTP") {
      usernameInput.disabled = true;

      if (passwordFieldGroup) passwordFieldGroup.style.display = "";
      if (passwordLabel) passwordLabel.textContent = "Verification Code";
      if (passwordVisibilityBtn) passwordVisibilityBtn.style.display = "none";

      passwordInput.type = "text";
      passwordInput.inputMode = "numeric";
      passwordInput.autocomplete = "one-time-code";
      passwordInput.maxLength = 6;
      passwordInput.placeholder = "Enter 6-digit code";
      passwordInput.value = "";

      if (formSubtitle) {
        formSubtitle.textContent = "New or expired device detected. Verify your identity to trust this device for 30 days.";
      }
      loginBtn.textContent = "Verify & Trust Device";

      if (forgotBtn) {
        forgotBtn.style.display = "";
        forgotBtn.textContent = "Use a different SK-ID";
      }

      setNotice(
        maskedEmail
          ? `A verification code was requested for ${maskedEmail}. Check your inbox. This device can be remembered for 30 days.`
          : "A verification code was requested for your registered email. Check your inbox. This device can be remembered for 30 days."
      );
      if (!mobileView.matches) setTimeout(() => passwordInput.focus(), 60);
    }
  }

  function setBusy(isBusy, text) {
    const busy = Boolean(isBusy);
    loginBtn.disabled = busy;
    loginBtn.style.opacity = busy ? ".6" : "1";
    loginBtn.textContent = busy
      ? (text || "Checking...")
      : (authStep === "OTP" ? "Verify & Trust Device" : "Sign in to RIAINTRA");
    loginBtn.setAttribute("aria-busy", String(busy));

    usernameInput.disabled = busy || authStep === "OTP";
    passwordInput.disabled = busy;
    if (forgotBtn) forgotBtn.disabled = busy;
    if (passwordVisibilityBtn) passwordVisibilityBtn.disabled = busy;
  }

  function showLoginCard() {
    cardWrap.style.display = "flex";
    if (!mobileView.matches) {
      setTimeout(() => (authStep === "OTP" ? passwordInput : usernameInput).focus(), 80);
    }
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

  const brandLogos = Array.from(document.querySelectorAll("[data-master-logo]"));
  function setBrandLogoVisible(logo, visible) {
    logo.hidden = !visible;
    const fallback = document.querySelector('[data-logo-fallback="' + logo.dataset.masterLogo + '"]');
    if (fallback) fallback.hidden = visible;
  }
  for (const logo of brandLogos) {
    logo.addEventListener("load", () => setBrandLogoVisible(logo, true));
    logo.addEventListener("error", () => setBrandLogoVisible(logo, false));
    setBrandLogoVisible(logo, false);
  }
  function applyMasterLogos(brand) {
    const logos = brand?.assets?.logos || {};
    for (const logo of brandLogos) {
      const url = typeof logos[logo.dataset.masterLogo] === "string" ? logos[logo.dataset.masterLogo].trim() : "";
      if (!url) {
        logo.removeAttribute("src");
        setBrandLogoVisible(logo, false);
        continue;
      }
      if (logo.getAttribute("src") !== url || (logo.complete && logo.naturalWidth === 0)) {
        setBrandLogoVisible(logo, false);
        logo.src = url;
      }
      if (logo.complete && logo.naturalWidth > 0) setBrandLogoVisible(logo, true);
    }
  }

  if (passwordVisibilityBtn) {
    passwordVisibilityBtn.addEventListener("click", function() {
      if (authStep !== "CREDENTIALS") return;
      const visible = passwordInput.type === "text";
      passwordInput.type = visible ? "password" : "text";
      passwordVisibilityBtn.textContent = visible ? "Show" : "Hide";
      passwordVisibilityBtn.setAttribute("aria-pressed", String(!visible));
      passwordInput.focus({ preventScroll: true });
    });
  }

  usernameInput.addEventListener("input", function(event) {
    event.target.value = cleanSkId(event.target.value);
  });

  passwordInput.addEventListener("input", function(event) {
    if (authStep === "OTP") {
      event.target.value = String(event.target.value || "").replace(/\D/g, "").slice(0, 6);
    }
  });

  if (forgotBtn) {
    forgotBtn.addEventListener("click", function(event) {
      event.preventDefault();
      finishRefresh();
      setError("");

      // In Step 2 (OTP), reset back to SK-ID + Password screen
      if (authStep === "OTP") {
        activeRequestId = "";
        setAuthStep("CREDENTIALS");
        if (!mobileView.matches) usernameInput.focus();
        return;
      }

      // In Step 1 (Credentials), trigger Wix password reset
      setNotice("Opening password reset...");
      setBusy(true, "Please wait...");
      activeRequestId = createRequestId("reset");
      post("STAFF_FORGOT_PASSWORD", {}, activeRequestId);
    });
  }

  loginForm.addEventListener("submit", function(event) {
    event.preventDefault();
    finishRefresh();
    setError("");

    if (authStep === "CREDENTIALS") {
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
      setNotice("Validating SK-ID and device trust...");
      activeRequestId = createRequestId("login");
      post("STAFF_LOGIN_REQUEST", { skId, password }, activeRequestId);
      return;
    }

    if (authStep === "OTP") {
      const code = String(passwordInput.value || "").replace(/\D/g, "").slice(0, 6);
      if (code.length !== 6) {
        setError("Enter the 6-digit verification code sent to your email.");
        showLoginCard();
        passwordInput.focus();
        return;
      }

      setBusy(true, "Verifying...");
      setNotice("Verifying security code...");
      activeRequestId = createRequestId("otp_verify");
      post("STAFF_OTP_VERIFY", { skId: verifiedSkId, code }, activeRequestId);
    }
  });

  window.addEventListener("message", function(event) {
    let data = event.data;
    if (typeof data === "string") {
      try { data = JSON.parse(data); } catch (_) { return; }
    }
    if (!data || event.source !== window.parent) return;
    if (data.source !== PARENT_SOURCE) return;

    const payload = data.payload || {};

    if (data.type === "SKANDI_MASTER_CONFIG") {
      applyMasterLogos(payload.brand);
      return;
    }

    if (data.requestId && data.requestId !== activeRequestId && data.requestId !== refreshRequestId) return;
    if (!data.requestId && activeRequestId) return;

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

    if (data.type === "STAFF_OTP_REQUIRED") {
      if (authStep !== "CREDENTIALS" || !activeRequestId || data.requestId !== activeRequestId || !activeRequestId.startsWith("login-")) return;
      const submittedSkId = cleanSkId(usernameInput.value);
      if (!isValidSkId(submittedSkId) || (payload.skId && cleanSkId(payload.skId) !== submittedSkId)) return;
      showLoginCard();
      setBusy(false);
      activeRequestId = "";
      verifiedSkId = submittedSkId;
      setAuthStep("OTP", payload.maskedEmail || "");
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
      const message = payload.message || "";
      const initialNotice = "Enter your SK-ID and password to sign in. Your session ends after 30 minutes of inactivity.";
      setNotice(message === "Secure staff login ready." || message === initialNotice ? "" : message);
      setBusy(false);
      activeRequestId = "";
      return;
    }
  });

  updateClock();
  setInterval(updateClock, 1000);

  setAuthStep("CREDENTIALS");
  setBusy(false);
  syncMobileViewport();
  post("MASTER_CONFIG_REQUEST", { context:"riaintra-login" });
  post("STAFF_LOGIN_READY", {});
