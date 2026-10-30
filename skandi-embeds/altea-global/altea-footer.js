
(()=>{
  "use strict";

  const SOURCE = "SKANDI_ALTEA_FOOTER";
  const PARENT = "SKANDI_WIX_PARENT";
  const LEGAL_PATH = "/riaintra/success-factors/legal-internal";
  let legalPath = LEGAL_PATH;
  const $ = id => document.getElementById(id);

  function post(type, payload = {}) {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({
        source:SOURCE,
        type,
        payload,
        timestamp:new Date().toISOString()
      }, "*");
    }
  }

  function setSystemMessage(text, type = "info") {
    const target = $("sysMessage");
    if (!target) return;
    target.textContent = String(text || "READY");
    target.className = "sys-text";
    if (type === "error") target.classList.add("error");
    if (type === "success") target.classList.add("success");
  }

  function renderState(state = {}) {
    if (state.connected !== undefined && $("networkDot")) {
      $("networkDot").className = state.connected ? "network-dot" : "network-dot offline";
      if (!state.connected && !state.systemMessage) setSystemMessage("HOST DISCONNECTED", "error");
    }
    if (state.systemMessage) setSystemMessage(state.systemMessage.text, state.systemMessage.type);
    if (state.context !== undefined && $("activeContext")) {
      $("activeContext").textContent = state.context ? String(state.context) : "ALTEA DASHBOARD";
    }
    if (state.env && $("envState")) $("envState").textContent = String(state.env).toUpperCase();
    if (state.lmcMode !== undefined && $("lmcBadge")) {
      $("lmcBadge").classList.toggle("active", Boolean(state.lmcMode));
    }
  }

  let clockUsesUtc = false;
  function updateClock() {
    const now = new Date();
    const opts = {
      hour:"2-digit", minute:"2-digit", second:"2-digit", hour12:false,
      ...(clockUsesUtc ? { timeZone:"UTC" } : {})
    };
    if ($("clockTime")) $("clockTime").textContent = new Intl.DateTimeFormat(undefined, opts).format(now);
    if ($("clockDate")) {
      $("clockDate").textContent = clockUsesUtc
        ? `${now.toISOString().slice(0, 10)} UTC`
        : new Intl.DateTimeFormat(undefined, { weekday:"short", day:"2-digit", month:"short" }).format(now).toUpperCase();
    }
  }

  $("sysClock")?.addEventListener("click", () => {
    clockUsesUtc = !clockUsesUtc;
    updateClock();
  });

  $("legalPoliciesBtn")?.addEventListener("click", () => {
    post("RIAINTRA_NAVIGATE", { path:legalPath });
  });

  setInterval(updateClock, 1000);
  updateClock();

  window.addEventListener("message", event => {
    let message = event.data;
    if (typeof message === "string") {
      try { message = JSON.parse(message); } catch (_) { return; }
    }
    if (!message || typeof message !== "object" || message.source !== PARENT) return;

    if (message.type === "ALTEA_FOOTER_STATE") {
      renderState(message.payload || {});
      return;
    }

    if (message.type === "SKANDI_MASTER_CONFIG") {
      const payload = message.payload || {};
      const logo = String(payload?.brand?.assets?.logos?.alteaFooter || "");
      const logoElement = $("alteaFooterLogo");
      if (logoElement && logo) { logoElement.src = logo; logoElement.hidden = false; }
      legalPath = String(payload?.routes?.legalInternal || LEGAL_PATH);
      renderState({
        env:payload?.altea?.env || payload?.env || "PRD",
        context:payload?.altea?.systemContext || payload?.altea?.pageName || payload?.altea?.systemName || "ALTEA DASHBOARD",
        lmcMode:Boolean(payload?.altea?.lmcMode)
      });
    }
  });

  post("MASTER_CONFIG_REQUEST", { context:"altea-footer" });
  post("ALTEA_FOOTER_READY", {});
  post("SKANDI_EMBED_RESIZE", { height:30 });
})();
