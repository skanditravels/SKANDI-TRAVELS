
(()=>{
  "use strict";

  const SOURCE = "SKANDI_ALTEA_HEADER";
  const PARENT = "SKANDI_WIX_PARENT";
  const GROUPTALK_PATH = "/riaintra/success-factors/altea/grouptalk";
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
    if (path === GROUPTALK_PATH) {
      const base = String(config?.baseUrl || "").trim();
      let target = path;
      if (base) {
        try {
          target = new URL(path.replace(/^\//, ""), base.replace(/\/+$/, "") + "/").href;
        } catch (_) {}
      }
      window.open(target, "_blank", "noopener,noreferrer");
      return;
    }
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
