# RIAINTRA GLOBAL HEADER

STATUS: V12 SYNC PREPARED — REQUIRES LIVE TEST
ROUTE SCOPE: `/riaintra/` excluding the RIAINTRA login page by existing Wix/masterPage visibility rules
WIX PARENT: `/src/pages/masterPage.js`
ELEMENTS: `#riaintraHeaderEmbed`, `#riaintraHeader`, legacy `#staffInternalChromeEmbed`
MESSAGE SOURCE: `SKANDI_RIAINTRA_HEADER`
LAST SYNCED: 2026-10-30

## INFO
- Staff data authority remains Wix parent → `backend/SKANDI_CORE/staffAuth.web.js` → canonical staffAuth core → Supabase `agent_users`; the HTML never queries Supabase directly.
- Right-side staff identity renders `display_name`, then bold `sk_id • base_code`, then `corporate_email`, with `badge_photo_url` in the right column. Canonical camelCase projection aliases are accepted.
- `Logout` is left of the clock and emits existing `RIAINTRA_LOGOUT`; current masterPage handles that through Wix Members logout.
- `Return to Dashboard` derives the Success Factors route from `MASTER_CONFIG.routes.successFactors` with `/riaintra/success-factors` fallback and is hidden only when already on the dashboard.
- Existing branding, nav, mobile drawer, clock and resize contracts are retained.
- STATICALLY VERIFIED; REQUIRES LIVE TEST with authenticated staff data.

## CHANGE LOG
- 2026-10-30 — RIAINTRA header logo and slogan now use riaHeader and the shared master language payload.
- 2026-10-13 — V12 staff-chrome sync: Wix Members logout and dashboard-return controls added; identity layout synchronized to canonical `agent_users` fields without adding direct database access.

## COMPLETE INTENDED LIVE HTML SOURCE

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1.0,viewport-fit=cover" />
<meta name="color-scheme" content="light dark" />
<title>RIAINTRA Global Header</title>
<style>
:root {
  --shell-h: 52px;
  --shell: #354a5f;
  --shell-hover: rgba(255, 255, 255, 0.14);
  --blue: #106ebe;
  --canvas: #ffffff;
  --text: #323130;
  --border: #edebe9;
  --font: "Segoe UI", system-ui, -apple-system, Arial, sans-serif;
}

* { box-sizing: border-box; }
html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  font-family: var(--font);
  color: var(--text);
  background: transparent;
  font-size: 14px;
  user-select: none;
}
button { font: inherit; border: 0; background: transparent; color: inherit; cursor: pointer; }

/* Desktop Shellbar */
.shellbar {
  position: fixed;
  inset: 0 0 auto;
  height: var(--shell-h);
  background: var(--shell);
  color: #fff;
  z-index: 1000;
  box-shadow: 0 1px 2px rgba(34, 54, 73, 0.12);
}
.shellbar-inner {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  gap: 12px;
}
.shell-left, .shell-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
}

/* Branding */
.product {
  display: flex;
  align-items: center;
  gap: 10px;
}
.product img {
  height: 30px;
  width: auto;
  object-fit: contain;
  border-radius: 3px;
  display: none;
}
.product img[src] {
  display: block;
}
.product-text strong {
  display: block;
  font-size: 13px;
}
.product-text small {
  display: block;
  color: rgba(255, 255, 255, 0.7);
  font-size: 10px;
  margin-top: 2px;
}

/* Desktop Navigation */
.shell-nav {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1 1 auto;
  justify-content: flex-start;
  padding-left: 24px;
}
.shell-nav button {
  color: rgba(255, 255, 255, 0.82);
  font-size: 13px;
  font-weight: 600;
  padding: 8px 10px;
  border-radius: 4px;
  transition: all 0.15s ease;
  white-space: nowrap;
}
.shell-nav button:hover, .shell-nav button.active {
  color: #fff;
  background: var(--shell-hover);
}

/* Session / Dashboard Actions */
.utility-action {
  min-height: 32px;
  padding: 0 10px;
  border: 1px solid rgba(255,255,255,.20);
  border-radius: 4px;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  white-space: nowrap;
}
.utility-action:hover { background: var(--shell-hover); }
.utility-action[hidden] { display: none !important; }

/* Clock */
.clock {
  min-width: 110px;
  text-align: right;
  border-inline: 1px solid rgba(255, 255, 255, 0.18);
  padding: 4px 10px;
  cursor: pointer;
}
.clock strong {
  display: block;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}
.clock small {
  display: block;
  color: rgba(255, 255, 255, 0.7);
  font-size: 9px;
  margin-top: 3px;
  text-transform: uppercase;
}

/* User Profile */
.profile {
  display: none;
  grid-template-columns: minmax(150px, 230px) 38px;
  grid-template-rows: repeat(3, auto);
  column-gap: 9px;
  row-gap: 1px;
  align-items: center;
  min-width: 0;
}
.profile-name,
.profile-meta,
.profile-email {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: right;
}
.profile-name {
  grid-column: 1;
  grid-row: 1;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
}
.profile-meta {
  grid-column: 1;
  grid-row: 2;
  color: #fff;
  font-size: 10px;
  font-weight: 800;
}
.profile-email {
  grid-column: 1;
  grid-row: 3;
  color: rgba(255,255,255,.70);
  font-size: 9px;
}
.profile-avatar {
  grid-column: 2;
  grid-row: 1 / span 3;
  width: 38px;
  height: 38px;
  border-radius: 4px;
  display: grid;
  place-items: center;
  background: #d1e8ff;
  color: #073b69;
  font-size: 11px;
  font-weight: 800;
  overflow: hidden;
}
.profile-avatar img,
img.profile-avatar {
  width: 38px;
  height: 38px;
  object-fit: cover;
}

/* Mobile Burger Icon */

.burger {
  display: none;
  width: 36px;
  height: 36px;
  color: #fff;
  border-radius: 4px;
}
.burger:hover {
  background: var(--shell-hover);
}

/* Mobile Drawer (Horizontal Slider) */
.mobile-drawer {
  position: fixed;
  top: 0;
  right: 0;
  z-index: 1100;
  width: 100%;
  height: var(--shell-h);
  background: var(--shell);
  color: #fff;
  box-shadow: -20px 0 45px rgba(13, 31, 48, 0.25);
  transform: translateX(102%);
  opacity: 0.98;
  transition: transform 0.44s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.25s ease;
  display: flex;
  align-items: center;
}
.mobile-drawer.open {
  transform: translateX(0);
  opacity: 1;
}

/* Mobile Drawer Title Area */
.mobile-head {
  height: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 12px 0 18px;
  border-right: 1px solid rgba(255, 255, 255, 0.18);
  flex: 0 0 auto;
}
.mobile-head strong { font-size: 13px; }
.mobile-head .close {
  width: 28px;
  height: 28px;
  font-size: 22px;
  display: grid;
  place-items: center;
}

/* Mobile Drawer Nav List */
.mobile-nav {
  height: 100%;
  display: flex;
  align-items: center;
  overflow-x: auto;
  scrollbar-width: none;
  flex: 1;
  padding: 0 12px;
  gap: 4px;
}
.mobile-nav::-webkit-scrollbar { display: none; }
.mobile-nav button {
  display: block;
  width: auto;
  white-space: nowrap;
  padding: 8px 12px;
  font-weight: 600;
  border-radius: 4px;
}
.mobile-nav button:hover, .mobile-nav button.active {
  background: var(--shell-hover);
}

/* Mobile Overlay */
.overlay {
  position: fixed;
  inset: var(--shell-h) 0 0 0;
  background: rgba(7, 27, 68, 0.46);
  z-index: 1090;
  display: none;
}
.overlay.show { display: block; }

body[data-theme="dark"] {
  --canvas: #1f1f1f;
  --border: #3a3a3a;
  --text: #f3f2f1;
}

@media(max-width: 950px) {
  .shell-nav { display: none; }
  .burger { display: grid; place-items: center; }
  .profile-email { display: none; }
}
@media(max-width: 700px) {
  .profile { display: none !important; }
  .clock { display: none; }
  .utility-action { padding: 0 8px; font-size: 9px; }
}
</style>
</head>
<body>

<!-- MAIN HEADER -->
<header class="shellbar">
  <div class="shellbar-inner">
    
    <div class="shell-left">
      <button id="burger" class="burger" type="button" aria-label="Open menu">☰</button>
      <div class="product">
        <img id="logo" data-master-logo="riaHeader" alt="RIAINTRA">
        <div class="product-text">
          <strong id="productName">RIAINTRA</strong>
          <small id="productContext">Enterprise Workforce Suite</small>
        </div>
      </div>
    </div>
    
    <!-- Desktop Navigation -->
    <nav id="desktopNav" class="shell-nav" aria-label="Internal navigation"></nav>
    
    <div class="shell-right">
      <button id="returnDashboardBtn" class="utility-action" type="button" hidden>Return to Dashboard</button>
      <button id="logoutBtn" class="utility-action" type="button">Logout</button>

      <!-- Clock -->
      <div id="sfClock" class="clock" title="Toggle local / UTC">
        <strong id="sfClockTime">--:--:--</strong>
        <small id="sfClockDate">LOCAL</small>
      </div>
      
      <!-- Profile -->
      <div class="profile" id="userProfile">
        <div class="profile-name" id="userName">--</div>
        <div class="profile-meta" id="userMeta">--</div>
        <div class="profile-email" id="userEmail">--</div>
        <img id="badge_photo_url" class="profile-avatar" alt="Staff badge photo" style="display:none">
        <div id="avatarFallback" class="profile-avatar">--</div>
      </div>
    </div>

  </div>
</header>

<!-- MOBILE DRAWER -->
<div id="mobileDrawer" class="mobile-drawer">
  <div class="mobile-head">
    <strong>RIAINTRA</strong>
    <button id="drawerClose" class="close" type="button" aria-label="Close menu">×</button>
  </div>
  <nav id="mobileNav" class="mobile-nav"></nav>
</div>
<div id="drawerOverlay" class="overlay"></div>

<script>
(()=>{
  "use strict";
  
  const SOURCE = "SKANDI_RIAINTRA_HEADER";
  const PARENT = "SKANDI_WIX_PARENT";

  let config = null;
  let staff = {};

  const $ = id => document.getElementById(id);
  const esc = v => String(v ?? "").replace(/[&<>"']/g, s => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"
  }[s]));

  function post(type, payload = {}) {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({
        source: SOURCE,
        type,
        payload,
        timestamp: new Date().toISOString()
      }, "*");
    }
  }

  // Mobile Menu Logic
  function closeMenu() {
    $("mobileDrawer")?.classList.remove("open");
    $("drawerOverlay")?.classList.remove("show");
    post("SKANDI_EMBED_RESIZE", { height: 52 });
  }

  $("burger")?.addEventListener("click", (e) => {
    e.stopPropagation();
    const menu = $("mobileDrawer");
    const overlay = $("drawerOverlay");
    
    menu.classList.toggle("open");
    overlay.classList.toggle("show");
    
    if (menu.classList.contains("open")) {
      // Command Wix to expand iframe slightly so the dark overlay shows
      post("SKANDI_EMBED_RESIZE", { height: 450 }); 
    } else {
      post("SKANDI_EMBED_RESIZE", { height: 52 });
    }
  });

  $("drawerClose")?.addEventListener("click", closeMenu);
  $("drawerOverlay")?.addEventListener("click", closeMenu);

  // Render Data
  function render() {
    // 1. Branding
    const header = config?.internal?.header || {};
    const logo = config?.brand?.assets?.logos?.riaHeader || "";
    
    if (logo && $("logo")) $("logo").src = logo;
    if (header.productName && $("productName")) $("productName").textContent = header.productName;
    const language = String(config?.settings?.language || "EN").trim().toLowerCase();
    const slogans = config?.brand?.slogans?.riaintra || {};
    if ($("productContext")) $("productContext").textContent = slogans[language] || slogans.en || header.productContext || "";

    // 2. Navigation
    const current = config?.currentPath || "";
    const items = header.primaryNav || config?.nav || [];
    
    if (Array.isArray(items) && items.length > 0) {
      const markup = items.map(i => {
        const active = current === i.path || (i.path && current.startsWith(i.path + "/"));
        return `<button type="button" class="${active ? "active" : ""}" data-path="${esc(i.path)}">${esc(i.label)}</button>`;
      }).join("");
      
      if ($("desktopNav")) $("desktopNav").innerHTML = markup;
      if ($("mobileNav")) $("mobileNav").innerHTML = markup;
    }

    // 3. Canonical staff profile from Wix parent -> SKANDI_CORE/staffAuth -> Supabase agent_users.
    const p = staff.profile || config?.staff?.profile || {};
    const full =
      p.displayName || p.display_name || p.fullName || p.name ||
      [p.firstName || p.first_name, p.lastName || p.last_name].filter(Boolean).join(" ") ||
      "Employee";
    const skId = String(p.skId || p.skID || p.sk_id || p.employeeId || p.employee_id || "").trim().toUpperCase();
    const baseCode = String(p.baseCode || p.base_code || p.base || p.station || "").trim().toUpperCase();
    const corporateEmail = String(
      p.corporateEmail || p.corporate_email || p.corporateEmailAddress ||
      p.corporate_email_address || p.workEmail || p.email || ""
    ).trim();
    const photo = String(
      p.badgePhotoUrl || p.badge_photo_url || p.photoUrl ||
      p.profilePhotoUrl || p.photo || ""
    ).trim();
    const hasData = Boolean(skId || full !== "Employee" || corporateEmail || photo);

    if ($("userProfile")) $("userProfile").style.display = hasData ? "grid" : "none";

    if (hasData) {
      const initials = [p.firstName || p.first_name, p.lastName || p.last_name]
        .filter(Boolean).map(v => String(v)[0]).join("").slice(0, 2).toUpperCase() ||
        full.slice(0, 2).toUpperCase();

      if ($("userName")) $("userName").textContent = full;
      if ($("userMeta")) $("userMeta").textContent = [skId, baseCode].filter(Boolean).join(" • ") || "RIAINTRA";
      if ($("userEmail")) $("userEmail").textContent = corporateEmail || "—";

      if (photo) {
        $("badge_photo_url").src = photo;
        $("badge_photo_url").style.display = "block";
        $("avatarFallback").style.display = "none";
      } else {
        $("badge_photo_url").style.display = "none";
        $("avatarFallback").style.display = "grid";
        $("avatarFallback").textContent = initials;
      }
    }

    // Return to Dashboard is hidden only on the Success Factors dashboard itself.
    const normalizedCurrent = String(current || "").split("?")[0].replace(/\/$/, "") || "/";
    if ($("returnDashboardBtn")) {
      $("returnDashboardBtn").hidden = normalizedCurrent === "/riaintra/success-factors";
    }
  }

  // Navigation Logic
  document.addEventListener("click", e => {
    const btn = e.target.closest("[data-path]");
    if (!btn) return;
    
    const path = btn.dataset.path;
    
    // Update local active state visually
    document.querySelectorAll("[data-path]").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(`[data-path="${path}"]`).forEach(b => b.classList.add("active"));
    
    if (config) config.currentPath = path;

    closeMenu();
    post("RIAINTRA_NAVIGATE", { path });
  });

  $("returnDashboardBtn")?.addEventListener("click", () => {
    post("RIAINTRA_NAVIGATE", {
      path:config?.routes?.successFactors || "/riaintra/success-factors"
    });
  });

  $("logoutBtn")?.addEventListener("click", () => {
    post("RIAINTRA_LOGOUT", {});
  });

  // Clock Logic
  let clockUsesUtc = false;
  function updateClock() {
    const now = new Date();
    const opts = {
      hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
      ...(clockUsesUtc ? { timeZone: "UTC" } : {})
    };
    if ($("sfClockTime")) $("sfClockTime").textContent = new Intl.DateTimeFormat(undefined, opts).format(now);
    if ($("sfClockDate")) $("sfClockDate").textContent = clockUsesUtc 
      ? `${now.toISOString().slice(0, 10)} UTC` 
      : new Intl.DateTimeFormat(undefined, { weekday: "short", day: "2-digit", month: "short" }).format(now).toUpperCase();
  }

  $("sfClock")?.addEventListener("click", () => {
    clockUsesUtc = !clockUsesUtc;
    updateClock();
  });
  
  setInterval(updateClock, 1000);
  updateClock();

  // Listen for Wix Parent Messages
  window.addEventListener("message", e => {
    const m = e.data || {};
    if (m.source !== PARENT) return;

    if (m.type === "SKANDI_MASTER_CONFIG") {
      config = m.payload || {};
      render();
    }

    if ([
      "RIAINTRA_HEADER_STATE",
      "UPDATE_PROFILE",
      "INTERNAL_CHROME_BOOTSTRAP",
      "GLOBAL_HEADER_BOOTSTRAP"
    ].includes(m.type)) {
      const payloadProfile =
        m.payload?.profile ||
        m.payload?.session?.profile ||
        m.payload?.session ||
        m.payload ||
        {};
      staff.profile = { ...staff.profile, ...payloadProfile };
      render();
    }
  });

  // Signal Wix parent window that embed is ready
  post("MASTER_CONFIG_REQUEST", { context: "riaintra-header" });
  post("RIAINTRA_HEADER_READY", {});
  post("SKANDI_EMBED_RESIZE", { height: 52 });

})();
</script>
</body>
</html>
```
