(() => {
  "use strict";

  const SOURCE = "SKANDI_ACCESS_RESTRICTED";
  const PARENT = "SKANDI_WIX_PARENT";
  const PAGE_PATH = "/auth/access-restricted";
  const root = document.querySelector(".restricted-access");
  if (!root) return;
  const status = root.querySelector(".restricted-access__status");
  const destinations = new Set(["home", "support"]);
  let navigationTimer;

  function post(type, payload = {}) {
    if (!window.parent || window.parent === window) return false;
    window.parent.postMessage({ source:SOURCE, type, payload, timestamp:new Date().toISOString() }, "*");
    return true;
  }

  function showNavigationError() {
    status.textContent = "We couldn’t open that page. Please try again.";
  }

  root.addEventListener("click", event => {
    const button = event.target.closest("[data-destination]");
    if (!button || !root.contains(button) || !destinations.has(button.dataset.destination)) return;
    clearTimeout(navigationTimer);
    if (!post("ACCESS_RESTRICTED_NAVIGATE", { destination:button.dataset.destination })) {
      showNavigationError();
      return;
    }
    status.textContent = "Opening page…";
    navigationTimer = setTimeout(showNavigationError, 6000);
  });

  window.addEventListener("message", event => {
    if (event.source !== window.parent) return;
    let message = event.data;
    if (typeof message === "string") {
      try { message = JSON.parse(message); } catch (_) { return; }
    }
    if (!message || message.source !== PARENT) return;
    if (message.type === "ACCESS_RESTRICTED_NAVIGATION_ERROR") {
      clearTimeout(navigationTimer);
      showNavigationError();
    }
    if (message.type !== "SKANDI_PRESENTATION_DATA") return;
    const payload = message.payload || {};
    if (payload.path && payload.path !== PAGE_PATH) return;
    for (const block of Array.isArray(payload.contentBlocks) ? payload.contentBlocks : []) {
      const id = String(block.contentId || "");
      if (!/^access-restricted-[a-z-]+$/.test(id) || block.value === undefined) continue;
      root.querySelectorAll("[data-content-id]").forEach(node => {
        if (node.getAttribute("data-content-id") === id) node.textContent = String(block.value ?? "");
      });
    }
  });

  window.addEventListener("pagehide", () => clearTimeout(navigationTimer), { once:true });
  post("SKANDI_PRESENTATION_READY", { pageKey:"accessRestricted", path:PAGE_PATH });
})();
