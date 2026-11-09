(() => {
  "use strict";
  const SOURCE = "SKANDI_EXPIRED_RESET_LINK";
  const PARENT = "SKANDI_WIX_PARENT";
  const PAGE_PATH = "/auth/expired-reset-link";
  const root = document.querySelector(".expired-reset");
  if (!root) return;
  const status = root.querySelector(".expired-reset__status");
  const buttons = [...root.querySelectorAll("[data-action]")];
  let pending = null;
  let timer;
  let backTimer;
  let sequence = 0;

  function post(type, payload = {}, requestId = "") {
    if (!window.parent || window.parent === window) return false;
    try {
      window.parent.postMessage({ source:SOURCE, type, payload, requestId, timestamp:new Date().toISOString() }, "*");
      return true;
    } catch (_) { return false; }
  }
  function unlock() {
    clearTimeout(timer);
    pending = null;
    buttons.forEach(button => { button.disabled = false; });
  }
  function start(action) {
    if (pending) return;
    const requestId = `expired-reset-${Date.now()}-${++sequence}`;
    pending = { action, requestId };
    buttons.forEach(button => { button.disabled = true; });
    status.textContent = action === "reset" ? "Opening password recovery…" : "Opening login…";
    if (!post("EXPIRED_RESET_AUTH", { action }, requestId)) {
      unlock();
      status.textContent = "We couldn’t open that window. Please try again.";
      return;
    }
    timer = setTimeout(() => {
      unlock();
      status.textContent = "We couldn’t open that window. Please try again.";
    }, 8000);
  }
  function goBack() {
    clearTimeout(backTimer);
    if (window.history.length > 1) {
      try {
        window.history.back();
        backTimer = setTimeout(() => post("EXPIRED_RESET_BACK"), 1500);
        return;
      } catch (_) { /* Use the recovery page when history is unavailable. */ }
    }
    if (!post("EXPIRED_RESET_BACK")) status.textContent = "We couldn’t go back. Please try again.";
  }
  root.addEventListener("click", event => {
    const button = event.target.closest("[data-action]");
    if (!button || !root.contains(button) || button.disabled) return;
    if (button.dataset.action === "back") goBack();
    else if (button.dataset.action === "reset" || button.dataset.action === "login") start(button.dataset.action);
  });
  window.addEventListener("message", event => {
    if (event.source !== window.parent) return;
    let message = event.data;
    if (typeof message === "string") {
      try { message = JSON.parse(message); } catch (_) { return; }
    }
    if (!message || message.source !== PARENT) return;
    if (message.type === "EXPIRED_RESET_BACK_ERROR") {
      status.textContent = "We couldn’t go back. Please try again.";
      return;
    }
    if (message.type === "SKANDI_PRESENTATION_DATA") {
      const payload = message.payload || {};
      if (payload.path && payload.path !== PAGE_PATH) return;
      for (const block of Array.isArray(payload.contentBlocks) ? payload.contentBlocks : []) {
        const id = String(block.contentId || "");
        if (!/^expired-reset-link-[a-z-]+$/.test(id) || block.value === undefined) continue;
        root.querySelectorAll("[data-content-id]").forEach(node => {
          if (node.getAttribute("data-content-id") === id) node.textContent = String(block.value ?? "");
        });
      }
      return;
    }
    if (!pending || message.requestId !== pending.requestId) return;
    if (message.type === "EXPIRED_RESET_AUTH_OPENING") {
      clearTimeout(timer);
      status.textContent = pending.action === "reset" ? "Complete or close the password recovery window to continue." : "Complete or close the login window to continue.";
    } else if (message.type === "EXPIRED_RESET_AUTH_RESULT") {
      const result = message.payload || {};
      unlock();
      status.textContent = String(result.message || "Please try again.");
    }
  });
  window.addEventListener("pagehide", () => { clearTimeout(timer); clearTimeout(backTimer); }, { once:true });
  post("SKANDI_PRESENTATION_READY", { pageKey:"expiredResetLink", path:PAGE_PATH });
})();
