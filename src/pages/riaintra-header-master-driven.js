/* Use in the single #riaintraHeader master-page HTML component. */
const SOURCE = "SKANDI_RIAINTRA_HEADER";
const PARENT = "SKANDI_WIX_PARENT";
let config = null;
const $ = id => document.getElementById(id);

function esc(value = "") {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function post(type, payload = {}) {
  window.parent.postMessage({ source: SOURCE, type, payload, timestamp: new Date().toISOString() }, "*");
}

function initials(profile = {}) {
  return [profile.firstName, profile.lastName].filter(Boolean).map(part => String(part).charAt(0)).join("").slice(0, 2).toUpperCase() || "--";
}

function applyLogo() {
  const logo = $("riaMasterLogo");
  if (!logo) return;
  const url = config?.brand?.assets?.logos?.skandiPrimary || "";
  if (url) logo.src = url;
}

function renderNavigation() {
  const desktop = $("riaMasterDesktopNav");
  const mobile = $("riaMasterMobileNav");
  const items = config?.internal?.header?.primaryNav || [];
  const currentPath = config?.currentPath || "";
  const markup = items.map(item => {
    const active = currentPath === item.path || currentPath.startsWith(item.path + "/");
    return `<button class="nav-item-amadeus ${active ? "active" : ""}" type="button" data-master-path="${esc(item.path)}">${esc(item.label)}</button>`;
  }).join("");
  if (desktop) desktop.innerHTML = markup;
  if (mobile) mobile.innerHTML = markup;
}

function renderProfile(staff = {}) {
  const profile = staff.profile || {};
  const fullName = profile.displayName || profile.fullName || [profile.firstName, profile.lastName].filter(Boolean).join(" ") || "Employee";
  const skId = profile.skId || profile.skID || profile.employeeId || "";
  const role = profile.jobTitle || profile.position || profile.role || "RIAINTRA";
  if ($("amadeusUserName")) $("amadeusUserName").textContent = fullName;
  if ($("amadeusUserSkid")) $("amadeusUserSkid").textContent = skId || "SIGNED IN";
  if ($("amadeusUserRole")) $("amadeusUserRole").textContent = role;

  const photo = profile.photoUrl || profile.profilePhotoUrl || profile.photo || profile.avatarUrl || "";
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

document.addEventListener("click", event => {
  const target = event.target.closest("[data-master-path]");
  if (!target) return;
  const path = target.getAttribute("data-master-path");
  if (path) post("RIAINTRA_NAVIGATE", { path });
});

window.addEventListener("message", event => {
  const message = event.data || {};
  if (message.source !== PARENT) return;
  if (message.type === "SKANDI_MASTER_CONFIG") {
    config = message.payload || {};
    applyLogo();
    renderNavigation();
    if (config.staff) renderProfile(config.staff);
  }
  if (message.type === "RIAINTRA_HEADER_STATE") renderProfile(message.payload || {});
});

post("RIAINTRA_HEADER_READY");
post("MASTER_CONFIG_REQUEST", { context: "riaintra-header" });
