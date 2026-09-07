/*
 * Renderer for the single internal master-page header HTML component.
 * All navigation/profile/config decisions come from src/pages/masterPage.js.
 */
const RIA_SOURCE = "SKANDI_RIAINTRA_HEADER";
const ALTEA_SOURCE = "SKANDI_ALTEA_HEADER";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";

let config = null;
let staffState = null;
let activeSource = RIA_SOURCE;

const $ = (id) => document.getElementById(id);

function esc(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function post(type, payload = {}) {
  window.parent.postMessage({
    source: activeSource,
    type,
    payload,
    timestamp: new Date().toISOString()
  }, "*");
}

function initials(profile = {}) {
  const first = profile.firstName || profile.first_name || profile.preferredName || "";
  const last = profile.lastName || profile.last_name || "";
  const fromName = String(profile.displayName || profile.name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return [first || fromName[0], last || fromName[fromName.length - 1]]
    .filter(Boolean)
    .map((part) => String(part).charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase() || "--";
}

function headerConfig() {
  return config?.internal?.header || {};
}

function profileFromState(state = staffState || {}) {
  return state?.profile || state?.staff || state?.agent || state || {};
}

function applyContext() {
  const header = headerConfig();
  const isAltea = header.context === "altea" || config?.isAltea === true;
  activeSource = isAltea ? ALTEA_SOURCE : RIA_SOURCE;

  const product = $("riaMasterProductName") || $("amadeusProductName") || $("internalProductName");
  if (product) product.textContent = header.productName || (isAltea ? "ALTEA" : "RIAINTRA");

  document.documentElement.dataset.internalContext = isAltea ? "altea" : "riaintra";
}

function applyLogo() {
  const logo = $("riaMasterLogo");
  if (!logo) return;
  const logos = config?.brand?.assets?.logos || {};
  const key = headerConfig().logoKey || "riaintraLight";
  const url = logos[key] || logos.riaintraLight || logos.skandiPrimary || "";
  if (url) logo.src = url;
}

function navItems() {
  const configured = Array.isArray(headerConfig().primaryNav)
    ? headerConfig().primaryNav
    : [];
  return configured.filter((item) => item && item.path && item.label);
}

function renderNavigation() {
  const desktop = $("riaMasterDesktopNav");
  const mobile = $("riaMasterMobileNav");
  const currentPath = String(config?.currentPath || "");
  const markup = navItems().map((item) => {
    const path = String(item.path || "");
    const active = currentPath === path || currentPath.startsWith(`${path}/`);
    return `<button class="nav-item-amadeus ${active ? "active" : ""}" type="button" data-master-path="${esc(path)}">${esc(item.label)}</button>`;
  }).join("");
  if (desktop) desktop.innerHTML = markup;
  if (mobile) mobile.innerHTML = markup;
}

function renderProfile(state = staffState || {}) {
  staffState = state || {};
  const profile = profileFromState(staffState);
  const fullName = profile.displayName || profile.fullName || profile.name || [profile.firstName, profile.lastName].filter(Boolean).join(" ") || "Employee";
  const skId = profile.skId || profile.skID || profile.employeeId || profile.sk_id || "";
  const role = profile.jobTitle || profile.position || profile.role || profile.job_title || "RIAINTRA";

  if ($("amadeusUserName")) $("amadeusUserName").textContent = fullName;
  if ($("amadeusUserSkid")) $("amadeusUserSkid").textContent = skId || "SIGNED IN";
  if ($("amadeusUserRole")) $("amadeusUserRole").textContent = role;

  const photo = profile.photoUrl || profile.profilePhotoUrl || profile.photo || profile.avatarUrl || profile.badgePhotoUrl || profile.badge_photo_url || "";
  const image = $("amadeusUserAvatarImg");
  const fallback = $("amadeusUserAvatarInitials");

  if (image && fallback) {
    if (photo) {
      image.src = photo;
      image.style.display = "block";
      fallback.style.display = "none";
    } else {
      image.removeAttribute("src");
      image.style.display = "none";
      fallback.style.display = "grid";
      fallback.textContent = initials(profile);
    }
  }
}

function renderAll() {
  applyContext();
  applyLogo();
  renderNavigation();
  if (staffState) renderProfile(staffState);
}

document.addEventListener("click", (event) => {
  const nav = event.target.closest("[data-master-path]");
  if (nav) {
    const path = nav.getAttribute("data-master-path");
    if (path) post(activeSource === ALTEA_SOURCE ? "ALTEA_NAVIGATE" : "RIAINTRA_NAVIGATE", { path });
    return;
  }

  const logout = event.target.closest("[data-internal-logout],#amadeusLogout,#riaMasterLogout");
  if (logout) post(activeSource === ALTEA_SOURCE ? "ALTEA_LOGOUT" : "RIAINTRA_LOGOUT");
});

window.addEventListener("message", (event) => {
  const message = event.data || {};
  if (message.source !== PARENT_SOURCE) return;

  if (message.type === "SKANDI_MASTER_CONFIG") {
    config = message.payload || {};
    if (config.staff) staffState = config.staff;
    renderAll();
    return;
  }

  if (["RIAINTRA_HEADER_STATE", "ALTEA_HEADER_STATE", "INTERNAL_HEADER_STATE"].includes(message.type)) {
    staffState = message.payload || {};
    renderProfile(staffState);
  }
});

/*
 * Start as RIAINTRA so masterPage.js can hear the first handshake.
 * masterPage.js will immediately return the current context and the renderer
 * switches to ALTEA when the page path is inside ALTEA.
 */
post("RIAINTRA_HEADER_READY");
post("MASTER_CONFIG_REQUEST", { context: "internal-header" });

setTimeout(() => post("MASTER_CONFIG_REQUEST", { context: "internal-header-retry" }), 600);
setTimeout(() => post("MASTER_CONFIG_REQUEST", { context: "internal-header-retry" }), 1500);
