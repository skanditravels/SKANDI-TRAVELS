
"use strict";
(() => {
  const SOURCE = "SKANDI_COOKIE_BANNER";
  const PARENT = "SKANDI_WIX_PARENT";
  const app = document.getElementById("app");
  const status = document.getElementById("status");
  const gpc = navigator.globalPrivacyControl === true;
  let busy = false;

  function post(type, payload = {}) {
    window.parent.postMessage({ source:SOURCE, type, payload, timestamp:new Date().toISOString() }, "*");
  }
  function resize(height) {
    post("SKANDI_EMBED_RESIZE", { height });
  }
  function showBanner() {
    app.hidden = false;
    document.getElementById("privacyTrigger").hidden = true;
    document.getElementById("bannerPanel").hidden = false;
    requestAnimationFrame(() => resize(Math.max(190, Math.ceil(document.documentElement.scrollHeight + 8))));
  }
  function hideBanner() {
    app.hidden = false;
    document.getElementById("bannerPanel").hidden = true;
    document.getElementById("privacyTrigger").hidden = false;
    resize(64);
  }
  function setBusy(next, message = "") {
    busy = next;
    document.querySelectorAll("button").forEach(btn => btn.disabled = next);
    status.textContent = message;
  }
  function submit(type) {
    if (busy) return;
    setBusy(true, "Saving your privacy choice…");
    post(type, { gpc });
  }

  if (gpc) document.getElementById("gpc").style.display = "block";
  document.getElementById("acceptAll").addEventListener("click", () => submit("SKANDI_CONSENT_ACCEPT_ALL"));
  document.getElementById("rejectAll").addEventListener("click", () => submit("SKANDI_CONSENT_REJECT_OPTIONAL"));
  document.getElementById("manage").addEventListener("click", () => post("SKANDI_CONSENT_NAVIGATE", { path:"/about/legal/cookie-preferences" }));
  document.getElementById("privacyTrigger").addEventListener("click", () => post("SKANDI_CONSENT_NAVIGATE", { path:"/about/legal/cookie-preferences" }));
  document.addEventListener("click", event => {
    const path = event.target.closest("[data-path]")?.getAttribute("data-path");
    if (path) post("SKANDI_CONSENT_NAVIGATE", { path });
  });

  window.addEventListener("message", event => {
    let msg = event.data;
    if (typeof msg === "string") { try { msg = JSON.parse(msg); } catch (_) { return; } }
    if (!msg || msg.source !== PARENT) return;
    if (msg.type === "SKANDI_MASTER_CONFIG") {
      const logo = msg.payload?.brand?.assets?.logos?.skandiPrimary || msg.payload?.brand?.assets?.logos?.skandiTravels;
      if (logo) document.getElementById("logo").src = logo;
      return;
    }
    if (msg.type === "SKANDI_CONSENT_STATE") {
      setBusy(false, "");
      if (msg.payload?.defaultPolicy === true) showBanner(); else hideBanner();
      return;
    }
    if (msg.type === "SKANDI_CONSENT_SAVED") {
      setBusy(false, msg.payload?.ok ? "Preferences saved." : (msg.payload?.message || "We could not save your preferences."));
      if (msg.payload?.ok) setTimeout(hideBanner, 350);
    }
  });

  post("MASTER_CONFIG_REQUEST", { context:"cookie-banner" });
  post("SKANDI_CONSENT_REQUEST", { gpc });
  setTimeout(() => post("SKANDI_CONSENT_REQUEST", { gpc }), 300);
})();
