
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
    const logo = config?.brand?.assets?.logos?.riaintra || config?.brand?.assets?.logos?.skandiPrimary || "";
    
    if (logo && $("logo")) $("logo").src = logo;
    if (header.productName && $("productName")) $("productName").textContent = header.productName;
    if (header.productContext && $("productContext")) $("productContext").textContent = header.productContext;

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
