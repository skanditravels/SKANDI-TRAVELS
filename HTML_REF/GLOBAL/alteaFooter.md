# ALTEA GLOBAL FOOTER

STATUS: V12 SYNC PREPARED — REQUIRES LIVE TEST
ROUTE SCOPE: `/riaintra/success-factors/altea/`
WIX PARENT: `/src/pages/masterPage.js`
ELEMENTS: `#alteaFooterEmbed`, `#alteaFooter`
MESSAGE SOURCE: `SKANDI_ALTEA_FOOTER`
LAST SYNCED: 2026-10-30

## INFO
- User-supplied ALTEA status bar is retained.
- Added `Legal & Policies`; route derives from `MASTER_CONFIG.routes.legalInternal`, falling back to `/riaintra/success-factors/legal-internal`, using existing `RIAINTRA_NAVIGATE`.
- Existing connection state, context, environment, LMC indicator, local/UTC clock and 30px resize contract are retained.
- STATICALLY VERIFIED; REQUIRES LIVE TEST after replacing the ALTEA footer HTML.

## CHANGE LOG
- 2026-10-30 — Added the master-controlled alteaFooter logo slot.
- 2026-10-13 — V12 internal legal link sync prepared from the supplied ALTEA footer source.

## COMPLETE INTENDED LIVE HTML SOURCE

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>ALTEA Status Bar - Modern Blue</title>
<style>
:root {
  --altea-blue: #005eb8;
  --text-main: #ffffff;
  --text-muted: rgba(255, 255, 255, 0.75);
  --status-ok: #5fc7cf;
  --status-err: #ff6b6b;
  --status-warn: #ffb900;
  --border-color: rgba(255, 255, 255, 0.2);
  --font-main: Arial, sans-serif;
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

.altea-footer-logo{height:16px;max-width:90px;object-fit:contain}
.status-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 30px;
  background: var(--altea-blue);
  color: var(--text-main);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  font-size: 11px;
  letter-spacing: 0.03em;
  border-top: 1px solid var(--border-color);
}
.section {
  display: flex;
  align-items: center;
  gap: 16px;
  white-space: nowrap;
}
.divider {
  width: 1px;
  height: 14px;
  background: var(--border-color);
}
.sys-message {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: bold;
}
.network-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--status-ok);
}
.network-dot.offline { background: var(--status-err); }
.sys-text {
  text-transform: uppercase;
  font-size: 10px;
}
.sys-text.error { color: var(--status-err); }
.sys-text.success { color: var(--status-ok); }
.context-area {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-weight: bold;
  color: var(--text-main);
  font-size: 11px;
}
.mode-badge {
  display: none;
  background: var(--status-warn);
  color: #000;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 9px;
  font-weight: 900;
  margin-left: 8px;
}
.mode-badge.active { display: inline-block; }
.indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--text-muted);
  font-weight: bold;
  font-size: 10px;
}
.val { color: #fff; }
.footer-link {
  border: 0;
  background: transparent;
  color: rgba(255,255,255,.82);
  padding: 2px 0;
  font: inherit;
  font-size: 10px;
  font-weight: 700;
  cursor: pointer;
}
.footer-link:hover { color: #fff; text-decoration: underline; }
.clock-group {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-weight: bold;
}
.clock-time { font-size: 12px; }
.clock-lbl {
  font-size: 9px;
  color: var(--text-muted);
}

@media(max-width: 700px) {
  .context-area { display: none; }
  .indicator { display: none; }
  .section { gap: 10px; }
}
</style>
</head>
<body>

<footer class="status-bar">
  <div class="section left-section">
    <div class="sys-message" title="Host Connection Status">
      <div class="network-dot" id="networkDot"></div>
      <span class="sys-text" id="sysMessage">READY</span>
    </div>
    <img id="alteaFooterLogo" class="altea-footer-logo" data-master-logo="alteaFooter" alt="ALTEA" hidden>
  </div>

  <div class="context-area">
    <span id="activeContext">ALTEA DASHBOARD</span>
    <span id="lmcBadge" class="mode-badge">LMC</span>
  </div>

  <div class="section right-section">
    <button class="footer-link" id="legalPoliciesBtn" type="button">Legal &amp; Policies</button>
    <div class="divider"></div>
    <div class="indicator">ENV: <span class="val" id="envState">PRD</span></div>
    <div class="divider"></div>
    <div class="clock-group" id="sysClock" title="Click to toggle UTC / Local">
      <span class="clock-time" id="clockTime">--:--:--</span>
      <span class="clock-lbl" id="clockDate">LOCAL</span>
    </div>
  </div>
</footer>

<script>
(()=>{
  "use strict";

  const SOURCE = "SKANDI_ALTEA_FOOTER";
  const PARENT = "SKANDI_WIX_PARENT";
  const LEGAL_PATH = "/riaintra/success-factors/legal-internal";
  let legalPath = LEGAL_PATH;
  const $ = id => document.getElementById(id);

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

  function setSystemMessage(text, type = "info") {
    const target = $("sysMessage");
    if (!target) return;
    target.textContent = String(text || "READY");
    target.className = "sys-text";
    if (type === "error") target.classList.add("error");
    if (type === "success") target.classList.add("success");
  }

  function renderState(state = {}) {
    if (state.connected !== undefined && $("networkDot")) {
      $("networkDot").className = state.connected ? "network-dot" : "network-dot offline";
      if (!state.connected && !state.systemMessage) setSystemMessage("HOST DISCONNECTED", "error");
    }
    if (state.systemMessage) setSystemMessage(state.systemMessage.text, state.systemMessage.type);
    if (state.context !== undefined && $("activeContext")) {
      $("activeContext").textContent = state.context ? String(state.context) : "ALTEA DASHBOARD";
    }
    if (state.env && $("envState")) $("envState").textContent = String(state.env).toUpperCase();
    if (state.lmcMode !== undefined && $("lmcBadge")) {
      $("lmcBadge").classList.toggle("active", Boolean(state.lmcMode));
    }
  }

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

  $("legalPoliciesBtn")?.addEventListener("click", () => {
    post("RIAINTRA_NAVIGATE", { path:legalPath });
  });

  setInterval(updateClock, 1000);
  updateClock();

  window.addEventListener("message", event => {
    let message = event.data;
    if (typeof message === "string") {
      try { message = JSON.parse(message); } catch (_) { return; }
    }
    if (!message || typeof message !== "object" || message.source !== PARENT) return;

    if (message.type === "ALTEA_FOOTER_STATE") {
      renderState(message.payload || {});
      return;
    }

    if (message.type === "SKANDI_MASTER_CONFIG") {
      const payload = message.payload || {};
      const logo = String(payload?.brand?.assets?.logos?.alteaFooter || "");
      const logoElement = $("alteaFooterLogo");
      if (logoElement && logo) { logoElement.src = logo; logoElement.hidden = false; }
      legalPath = String(payload?.routes?.legalInternal || LEGAL_PATH);
      renderState({
        env:payload?.altea?.env || payload?.env || "PRD",
        context:payload?.altea?.systemContext || payload?.altea?.pageName || payload?.altea?.systemName || "ALTEA DASHBOARD",
        lmcMode:Boolean(payload?.altea?.lmcMode)
      });
    }
  });

  post("MASTER_CONFIG_REQUEST", { context:"altea-footer" });
  post("ALTEA_FOOTER_READY", {});
  post("SKANDI_EMBED_RESIZE", { height:30 });
})();
</script>
</body>
</html>
```
