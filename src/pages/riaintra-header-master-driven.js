/*
 * RIAINTRA / ALTEA internal header renderer.
 *
 * This file contains NO staff database logic.
 * masterPage.js is the controller and sends the current agent_users-derived state.
 * The same header changes between RIAINTRA and ALTEA from the current route.
 */

const SOURCE = "SKANDI_INTERNAL_HEADER";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";

let config = null;
let staffState = null;

function firstElement(...selectors) {
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) return element;
  }
  return null;
}

function esc(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function post(type, payload = {}) {
  window.parent.postMessage(
    {
      source: SOURCE,
      type,
      payload,
      timestamp: new Date().toISOString()
    },
    "*"
  );
}

function headerConfig() {
  return config?.internal?.header || {};
}

function profile() {
  return staffState?.profile || {};
}

function initials(agent = {}) {
  const full = String(agent.displayName || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const first = agent.firstName || full[0] || "";
  const last = agent.lastName || full[full.length - 1] || "";

  return [first, last]
    .filter(Boolean)
    .map((value) => String(value).charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase() || "--";
}

function applyContext() {
  const header = headerConfig();
  const context = header.context === "altea" ? "altea" : "riaintra";

  document.documentElement.dataset.internalContext = context;

  const product = firstElement(
    "#internalProductName",
    "[data-internal-product]"
  );

  if (product) {
    product.textContent = header.productName || (context === "altea" ? "ALTEA" : "RIAINTRA");
  }
}

function applyLogo() {
  const logo = firstElement(
    "#internalMasterLogo",
    "[data-internal-logo]"
  );

  if (!logo) return;

  const logos = config?.brand?.assets?.logos || {};
  const key = headerConfig().logoKey || "riaintraLight";
  const url = logos[key] || logos.riaintraLight || logos.skandiPrimary || "";

  if (url) {
    logo.src = url;
  }
}

function renderNavigation() {
  const desktop = firstElement(
    "#internalDesktopNav",
    "[data-internal-nav-desktop]"
  );

  const mobile = firstElement(
    "#internalMobileNav",
    "[data-internal-nav-mobile]"
  );

  const items = Array.isArray(headerConfig().primaryNav)
    ? headerConfig().primaryNav
    : [];

  const currentPath = String(config?.currentPath || "").replace(/\/$/, "");

  const markup = items
    .filter((item) => item && item.path && item.label)
    .map((item) => {
      const path = String(item.path).replace(/\/$/, "");
      const active = currentPath === path || currentPath.startsWith(`${path}/`);

      return `<button class="internal-nav-item${active ? " active" : ""}" type="button" data-internal-path="${esc(path)}">${esc(item.label)}</button>`;
    })
    .join("");

  if (desktop) desktop.innerHTML = markup;
  if (mobile) mobile.innerHTML = markup;
}

function renderProfile() {
  const agent = profile();

  const name = firstElement(
    "#internalUserName",
    "[data-agent-name]"
  );

  const skId = firstElement(
    "#internalUserSkid",
    "[data-agent-skid]"
  );

  const role = firstElement(
    "#internalUserRole",
    "[data-agent-role]"
  );

  const station = firstElement(
    "#internalUserStation",
    "[data-agent-station]"
  );

  if (name) {
    name.textContent = agent.displayName || "Employee";
  }

  if (skId) {
    skId.textContent = agent.skId || "SIGNED IN";
  }

  if (role) {
    role.textContent = agent.jobTitle || "RIAINTRA";
  }

  if (station) {
    station.textContent = agent.station || agent.base || "";
  }

  const image = firstElement(
    "#internalUserAvatarImg",
    "[data-agent-avatar-image]"
  );

  const fallback = firstElement(
    "#internalUserAvatarInitials",
    "[data-agent-avatar-initials]"
  );

  if (!image || !fallback) return;

  const photo = String(agent.badgePhotoUrl || "").trim();

  if (photo) {
    image.src = photo;
    image.style.display = "block";
    fallback.style.display = "none";
  } else {
    image.removeAttribute("src");
    image.style.display = "none";
    fallback.style.display = "grid";
    fallback.textContent = initials(agent);
  }
}

function renderAuthorization() {
  const root = firstElement(
    "#internalHeaderRoot",
    "[data-internal-header-root]"
  );

  if (!root) return;

  const authorized = staffState?.authorized === true;
  root.dataset.authorized = authorized ? "true" : "false";
}

function renderAll() {
  applyContext();
  applyLogo();
  renderNavigation();
  renderProfile();
  renderAuthorization();
}

document.addEventListener("click", (event) => {
  const nav = event.target.closest("[data-internal-path]");

  if (nav) {
    const path = nav.getAttribute("data-internal-path");
    if (path) {
      post("INTERNAL_NAVIGATE", { path });
    }
    return;
  }

  const logout = event.target.closest(
    "#internalLogout,[data-internal-logout]"
  );

  if (logout) {
    post("INTERNAL_LOGOUT");
  }
});

window.addEventListener("message", (event) => {
  const message = event.data || {};

  if (message.source !== PARENT_SOURCE) return;

  if (message.type === "SKANDI_MASTER_CONFIG") {
    config = message.payload || {};
    renderAll();
    return;
  }

  if (message.type === "INTERNAL_HEADER_STATE") {
    staffState = message.payload || {};
    renderAll();
    return;
  }

  if (message.type === "INTERNAL_HEADER_ERROR") {
    document.documentElement.dataset.internalHeaderError =
      String(message.payload?.code || "UNKNOWN");
  }
});

post("INTERNAL_HEADER_READY");
post("MASTER_CONFIG_REQUEST", { context: "internal-header" });

setTimeout(() => {
  post("MASTER_CONFIG_REQUEST", { context: "internal-header-retry" });
}, 600);

setTimeout(() => {
  post("MASTER_CONFIG_REQUEST", { context: "internal-header-retry" });
}, 1500);
