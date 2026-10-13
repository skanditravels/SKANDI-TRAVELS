# ALTEA GLOBAL HEADER

STATUS: V12 SYNC PREPARED — REQUIRES LIVE TEST
ROUTE SCOPE: `/riaintra/success-factors/altea/` including the ALTEA Launchpad
WIX PARENT: `/src/pages/masterPage.js`
ELEMENTS: `#alteaHeaderEmbed`, `#alteaHeader`
MESSAGE SOURCE: `SKANDI_ALTEA_HEADER`
LAST SYNCED: 2026-10-13

## INFO
- `Logout` is placed left of the clock and emits existing `RIAINTRA_LOGOUT`, preserving Wix Members as the session authority.
- `Return to Dashboard` derives the Success Factors route from `MASTER_CONFIG.routes.successFactors` with `/riaintra/success-factors` fallback.
- The Area A–F selector and `>_` control were removed. Repository inspection confirmed their current parent handlers only mutate `alteaRuntimeContext` and push UI state; no operational reservation/DCS/terminal consumer was found.
- Editable/fabricated Office switching was removed. Office now displays canonical `officeId`/`office_id` when supplied by parent data, otherwise `baseCode`/`base_code`/base/station; no synthetic office ID is generated.
- Existing ALTEA branding, environment, navigation, staff credentials and clock contracts remain intact.
- STATICALLY VERIFIED; REQUIRES LIVE TEST on ALTEA launchpad and child routes.

## CHANGE LOG
- 2026-10-13 — V12 ALTEA chrome sync: Wix Members logout and Return to Dashboard added; non-functional Area/Cryptic UI removed; Office made read-only and sourced from canonical staff/runtime data.

## COMPLETE INTENDED LIVE HTML SOURCE

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>ALTEA Global Header - Modern</title>
<style>
:root {
  --altea-blue: #005eb8; /* Modern Amadeus Blue */
  --altea-cyan: #5fc7cf; /* Modern Accent Cyan */
  --text-main: #ffffff;
  --text-muted: rgba(255, 255, 255, 0.75);
  --border-color: rgba(255, 255, 255, 0.2);
  --font-main: Arial, "Segoe UI", sans-serif;
  --font-mono: "Consolas", "Courier New", monospace;
}

* { box-sizing: border-box; }
html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: transparent;
  font-family: var(--font-main);
  user-select: none;
}

/* Toolbar container */
.altea-toolbar {
  height: 48px;
  background: var(--altea-blue);
  color: var(--text-main);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  border-bottom: 1px solid var(--border-color);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

/* Left: Branding & Environment */
.toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 0 0 auto;
}
.logo {
  height: 26px;
  width: auto;
  object-fit: contain;
  display: none;
}
.logo[src] {
  display: block;
}
.brand-title {
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--border-color);
  padding-right: 12px;
}
.brand-title strong {
  font-size: 13px;
  letter-spacing: 0.03em;
  line-height: 1.1;
}
.brand-title span {
  font-size: 9px;
  color: var(--text-muted);
  text-transform: uppercase;
  margin-top: 1px;
}
.env-badge {
  background: #0e703e; /* Flatter modern green */
  color: white;
  font-size: 10px;
  font-weight: bold;
  padding: 3px 6px;
  border-radius: 3px;
  letter-spacing: 0.03em;
  cursor: default;
}

/* Center: Dynamic Navigation */
.toolbar-nav {
  display: flex;
  gap: 4px;
  flex: 1 1 auto;
  padding-left: 16px;
  overflow-x: auto;
  scrollbar-width: none;
}
.toolbar-nav::-webkit-scrollbar {
  display: none;
}
.toolbar-nav button {
  border: 0;
  background: transparent;
  color: var(--text-main);
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  transition: background 0.15s ease;
}
.toolbar-nav button:hover {
  background: rgba(255, 255, 255, 0.1);
}
.toolbar-nav button.active {
  background: rgba(255, 255, 255, 0.2);
}

/* Right: System & Credentials */
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 0 0 auto;
}

.utility-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.utility-action {
  height: 30px;
  padding: 0 10px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: rgba(255,255,255,.06);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;
}
.utility-action:hover { background: rgba(255,255,255,.14); }
.utility-action[hidden] { display: none !important; }

/* Credentials */

.credentials {
  display: none;
  grid-template-columns: auto auto;
  column-gap: 8px;
  row-gap: 2px;
  font-size: 10px;
  font-family: var(--font-mono);
}
.cred-lbl {
  color: var(--text-muted);
  text-align: right;
}
.cred-val {
  font-weight: bold;
  color: #fff;
}
.cred-val.link {
  color: var(--altea-cyan);
  text-decoration: underline;
  cursor: pointer;
}
.cred-val.link:hover {
  color: #fff;
}

/* Clock */
.sys-clock {
  text-align: right;
  cursor: pointer;
  border-left: 1px solid var(--border-color);
  padding-left: 16px;
}
.clock-time {
  display: block;
  font-size: 13px;
  font-weight: bold;
}
.clock-lbl {
  display: block;
  font-size: 9px;
  color: var(--text-muted);
  font-weight: bold;
  margin-top: 1px;
}

@media(max-width: 950px) {
}
@media(max-width: 750px) {
  .credentials, .sys-clock { display: none; }
  .toolbar-nav button { font-size: 11px; padding: 8px; }
  .env-badge { display: none; }
  .utility-action { padding: 0 8px; font-size: 9px; }
}
</style>
</head>
<body>

<header class="altea-toolbar">
  <div class="toolbar-left">
    <img id="logo" class="logo" alt="ALTEA">
    <div class="brand-title">
      <strong id="productName">Loading...</strong>
      <span id="productContext">SKANDI SYSTEMS</span>
    </div>
    <div class="env-badge" id="envBadge" title="Environment">PRD</div>
  </div>

  <nav class="toolbar-nav" id="navLinks" aria-label="Navigation"></nav>

  <div class="toolbar-right">
    <div class="utility-actions">
      <button class="utility-action" id="returnDashboardBtn" type="button">Return to Dashboard</button>
      <button class="utility-action" id="logoutBtn" type="button">Logout</button>
    </div>

    <div class="credentials" id="userProfile">
      <span class="cred-lbl">User:</span>
      <span class="cred-val" id="userName">--</span>
      <span class="cred-lbl">Office:</span>
      <span class="cred-val link" id="officeId">--</span>
    </div>

    <div class="sys-clock" id="sysClock" title="Click to toggle UTC / Local">
      <span class="clock-time" id="clockTime">--:--:--</span>
      <span class="clock-lbl" id="clockDate">LOCAL</span>
    </div>
  </div>
</header>

<script>
(()=>{
  "use strict";

  const SOURCE = "SKANDI_ALTEA_HEADER";
  const PARENT = "SKANDI_WIX_PARENT";
  let config = null;
  let staff = {};
  let runtime = { officeId:"" };

  const $ = id => document.getElementById(id);
  const esc = v => String(v ?? "").replace(/[&<>"']/g, s => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  }[s]));

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

  function profile() {
    return staff.profile || config?.staff?.profile || runtime.profile || {};
  }

  function headerConfig() {
    return config?.altea?.header || config?.internal?.header || {};
  }

  function applyRuntime(value = {}) {
    const next = value && typeof value === "object" ? value : {};
    runtime = { ...runtime, ...next };
    if (next.profile && typeof next.profile === "object") {
      staff.profile = { ...staff.profile, ...next.profile };
    }
  }

  function render() {
    const header = headerConfig();
    const altea = config?.altea || {};
    const p = profile();
    const logo = config?.brand?.assets?.logos?.altea ||
                 config?.brand?.assets?.logos?.riaintra ||
                 config?.brand?.assets?.logos?.skandiPrimary || "";

    if (logo && $("logo")) $("logo").src = logo;
    if ($("productName")) $("productName").textContent = header.productName || altea.systemName || "ALTEA";
    if ($("productContext")) $("productContext").textContent = header.productContext || altea.systemContext || "SKANDI SYSTEMS";

    const env = runtime.env || altea.env || config?.env || "PRD";
    if ($("envBadge")) $("envBadge").textContent = String(env).trim().toUpperCase() || "PRD";

    const current = config?.currentPath || "";
    const items = Array.isArray(header.primaryNav) ? header.primaryNav : [];
    if ($("navLinks")) {
      $("navLinks").innerHTML = items.map(item => {
        const path = String(item?.path || "");
        const active = current === path || (path && current.startsWith(path + "/"));
        return `<button type="button" class="${active ? "active" : ""}" data-route="${esc(path)}">${esc(item?.label || "")}</button>`;
      }).join("");
    }

    const hasData = Boolean(
      p.skId || p.skID || p.sk_id || p.employeeId || p.employee_id ||
      p.displayName || p.display_name || p.firstName || p.first_name
    );
    if ($("userProfile")) $("userProfile").style.display = hasData ? "grid" : "none";
    if (hasData) {
      const userId = String(
        p.skId || p.skID || p.sk_id || p.employeeId || p.employee_id ||
        p.displayName || p.display_name || "USER"
      ).trim();
      const office = String(
        runtime.officeId || altea.officeId || p.officeId || p.office_id ||
        p.baseCode || p.base_code || p.base || p.station || ""
      ).trim().toUpperCase();
      if ($("userName")) $("userName").textContent = userId;
      if ($("officeId")) $("officeId").textContent = office || "—";
    }

    const normalizedCurrent = String(current || "").split("?")[0].replace(/\/$/, "") || "/";
    if ($("returnDashboardBtn")) {
      $("returnDashboardBtn").hidden = normalizedCurrent === "/riaintra/success-factors";
    }
  }

  document.addEventListener("click", event => {
    const btn = event.target.closest("[data-route]");
    if (!btn) return;
    const path = btn.dataset.route;
    document.querySelectorAll("#navLinks button").forEach(item => item.classList.remove("active"));
    btn.classList.add("active");
    if (config) config.currentPath = path;
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
  setInterval(updateClock, 1000);
  updateClock();

  window.addEventListener("message", event => {
    let message = event.data;
    if (typeof message === "string") {
      try { message = JSON.parse(message); } catch (_) { return; }
    }
    if (!message || typeof message !== "object" || message.source !== PARENT) return;

    if (message.type === "SKANDI_MASTER_CONFIG") {
      config = message.payload || {};
      applyRuntime(config?.altea || {});
      render();
      return;
    }

    if (message.type === "ALTEA_HEADER_STATE" || message.type === "ALTEA_HEADER_CONTEXT") {
      applyRuntime(message.payload || {});
      render();
      return;
    }

    if (["RIAINTRA_HEADER_STATE", "UPDATE_PROFILE", "INTERNAL_CHROME_BOOTSTRAP", "GLOBAL_HEADER_BOOTSTRAP"].includes(message.type)) {
      const payloadProfile =
        message.payload?.profile ||
        message.payload?.session?.profile ||
        message.payload?.session ||
        message.payload ||
        {};
      staff.profile = { ...staff.profile, ...payloadProfile };
      render();
    }
  });

  post("MASTER_CONFIG_REQUEST", { context:"altea-header" });
  post("ALTEA_HEADER_READY", {});
  post("SKANDI_EMBED_RESIZE", { height:48 });
})();
</script>
</body>
</html>
```
