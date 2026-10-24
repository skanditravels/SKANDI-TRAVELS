
    (() => {
      "use strict";

      const SOURCE = "SKANDI_ALTEA_LAUNCHPAD";
      const PARENT_SOURCE = "SKANDI_WIX_PARENT";
      const VERSION = "V12-ALTEA-LAUNCHPAD-2026.10.06";
      const REQUEST_TIMEOUT_MS = 30000;
      const READY_RETRY_MS = 1500;

      const icons = {
        plane: `
          <svg viewBox="0 0 32 32" aria-hidden="true">
            <path d="m3.5 17.8 10.2 1.6-3.1 6.2 2.5.6 5.4-6.1 7.3 1.2c1.6.3 2.7-.5 2.7-1.7s-1-2-2.7-2.2l-7.3-1.2-5.4-6.1-2.5.6 3.1 6.2-10.2-1.6z"></path>
            <path d="M21.8 12.5 24.2 9"></path>
          </svg>`,
        inventory: `
          <svg viewBox="0 0 32 32" aria-hidden="true">
            <rect x="4.5" y="5" width="23" height="22" rx="2"></rect>
            <path d="M4.5 11.5h23M11.8 11.5V27M20.2 11.5V27"></path>
            <path d="M8 8.2h.1M11 8.2h.1M14 8.2h.1M14.4 16h3.2M14.4 20h3.2"></path>
          </svg>`,
        barcode: `
          <svg viewBox="0 0 32 32" aria-hidden="true">
            <path d="M5 7v18M8 7v18M11.5 7v18M14 7v18M18 7v18M20.5 7v18M24 7v18M27 7v18"></path>
            <path d="M4 4.5h6M4 4.5v4M28 4.5h-6M28 4.5v4M4 27.5h6M4 27.5v-4M28 27.5h-6M28 27.5v-4"></path>
          </svg>`,
        passenger: `
          <svg viewBox="0 0 32 32" aria-hidden="true">
            <circle cx="11" cy="9.5" r="3.5"></circle>
            <path d="M4.5 23.5c.5-5 2.7-7.5 6.5-7.5s6 2.5 6.5 7.5"></path>
            <path d="M19 8.5h8.5v15H19M21.5 12h3.5M21.5 15.5h3.5M21.5 19h3.5"></path>
          </svg>`,
        passport: `
          <svg viewBox="0 0 32 32" aria-hidden="true">
            <rect x="6" y="3.5" width="20" height="25" rx="2"></rect>
            <circle cx="16" cy="15" r="5"></circle>
            <path d="M11 15h10M16 10c1.5 1.4 2.2 3.1 2.2 5s-.7 3.6-2.2 5c-1.5-1.4-2.2-3.1-2.2-5s.7-3.6 2.2-5zM11 24h10"></path>
          </svg>`,
        communication: `
          <svg viewBox="0 0 32 32" aria-hidden="true">
            <path d="M6 7.5h20v13H14l-6 4v-4H6z"></path>
            <path d="M10 12h12M10 16h8"></path>
          </svg>`,
        arrow: `
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 12h13M14 7l5 5-5 5"></path>
          </svg>`,
        check: `
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m5 12.5 4.2 4.2L19 7"></path>
          </svg>`,
        search: `
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="10.5" cy="10.5" r="6.5"></circle>
            <path d="m15.5 15.5 5 5"></path>
          </svg>`
      };

      const state = {
        applications: [],
        profile: null,
        phase: "loading",
        bootstrap: null,
        launch: null,
        requestSequence: 0,
        returnFocus: null
      };

      const elements = {
        root: document.getElementById("applicationRoot"),
        appGrid: document.getElementById("appGrid"),
        appSearch: document.getElementById("appSearch"),
        clearSearch: document.getElementById("clearSearch"),
        refresh: document.getElementById("refreshApps"),
        applicationCount: document.getElementById("applicationCount"),
        loadingOverlay: document.getElementById("loadingOverlay"),
        loadingAppName: document.getElementById("loadingAppName"),
        dialogLayer: document.getElementById("dialogLayer"),
        dialogTitle: document.getElementById("dialogTitle"),
        dialogBody: document.getElementById("dialogBody"),
        dialogActions: document.getElementById("dialogActions"),
        dialogClose: document.getElementById("dialogClose"),
        toastRegion: document.getElementById("toastRegion")
      };

      // The browser's referrer identifies the immediate Wix parent when available.
      // Source-window validation remains mandatory even without a referrer.
      const parentOrigin = (() => {
        try {
          const url = new URL(document.referrer);
          return /^https?:$/.test(url.protocol) ? url.origin : "";
        } catch (_) { return ""; }
      })();

      function esc(value) {
        return String(value ?? "").replace(/[&<>"']/g, char => ({
          "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
        })[char]);
      }

      function isRecord(value) {
        return value !== null && typeof value === "object" && !Array.isArray(value);
      }

      function cleanApp(raw) {
        if (!isRecord(raw)) return null;
        const id = String(raw.id || "").trim().slice(0, 80);
        const path = String(raw.path || "").trim().slice(0, 240);
        if (!id || !path.startsWith("/riaintra/")) return null;
        try {
          const decoded = decodeURIComponent(path);
          if (decoded.includes("//") || decoded.includes("..") || /[\\\x00-\x1f\x7f]/.test(decoded)) return null;
        } catch (_) { return null; }
        return {
          id,
          title: String(raw.title || id).trim().slice(0, 160),
          description: String(raw.description || "").trim().slice(0, 600),
          icon: String(raw.icon || "arrow").trim().slice(0, 40),
          code: String(raw.code || id).trim().slice(0, 80),
          accent: /^#[0-9a-f]{6}$/i.test(String(raw.accent || "")) ? raw.accent : "#005eb8",
          available: raw.available !== false,
          unavailableReason: raw.available === false ? String(raw.unavailableReason || "Application unavailable").trim().slice(0, 240) : "",
          path
        };
      }

      function nextRequestId(type) {
        state.requestSequence += 1;
        return type + "-" + Date.now() + "-" + state.requestSequence;
      }

      function post(type, payload, requestId) {
        window.parent.postMessage({
          source: SOURCE, type, requestId, payload,
          timestamp: new Date().toISOString()
        }, parentOrigin || "*");
      }

      function setLayerVisibility(element, visible) {
        element.classList.toggle("visible", visible);
        element.setAttribute("aria-hidden", String(!visible));
        const blocked = elements.loadingOverlay.classList.contains("visible") ||
          elements.dialogLayer.classList.contains("visible");
        document.body.classList.toggle("modal-open", blocked);
        elements.root.inert = blocked;
      }

      function updateControls() {
        elements.refresh.disabled = Boolean(state.bootstrap || state.launch);
        elements.appSearch.disabled = state.phase !== "ready";
        elements.clearSearch.disabled = state.phase !== "ready";
      }

      function stopBootstrap() {
        if (state.bootstrap) {
          clearTimeout(state.bootstrap.timer);
          clearInterval(state.bootstrap.retry);
        }
        state.bootstrap = null;
        updateControls();
      }

      function stopLaunch() {
        if (state.launch) clearTimeout(state.launch.timer);
        state.launch = null;
        setLayerVisibility(elements.loadingOverlay, false);
        updateControls();
      }

      function sendBootstrap() {
        const pending = state.bootstrap;
        if (!pending) return;
        try {
          post(pending.type, { version: VERSION }, pending.requestId);
        } catch (_) {
          showError("The Launchpad could not connect to its page. Select Retry to reconnect.", "ALTEA_BRIDGE_UNAVAILABLE");
        }
      }

      function beginBootstrap(type = "ALTEA_LAUNCHPAD_REFRESH") {
        stopBootstrap();
        stopLaunch();
        closeDialog();
        state.applications = [];
        state.profile = null;
        state.phase = "loading";
        state.bootstrap = {
          type,
          requestId: nextRequestId(type),
          timer: setTimeout(() => {
            showError("The Launchpad did not receive a response. Select Retry to reconnect.", "ALTEA_BOOTSTRAP_TIMEOUT");
          }, REQUEST_TIMEOUT_MS),
          retry: setInterval(sendBootstrap, READY_RETRY_MS)
        };
        renderApplications();
        updateControls();
        sendBootstrap();
      }

      function renderApplications() {
        const query = elements.appSearch.value.trim().toLocaleLowerCase();
        const filtered = state.applications.filter(app =>
          (app.title + " " + app.description + " " + app.code).toLocaleLowerCase().includes(query)
        );
        elements.appGrid.replaceChildren();
        elements.appGrid.setAttribute("aria-busy", String(state.phase === "loading"));
        if (state.phase !== "ready") {
          const empty = document.createElement("div");
          empty.className = "empty-state visible";
          empty.textContent = state.phase === "loading"
            ? "Checking your staff session and authorized applications…"
            : "Applications are unavailable. Select Refresh to reconnect.";
          elements.appGrid.append(empty);
          elements.applicationCount.textContent = state.phase === "loading"
            ? "Loading authorized applications…" : "Authorization unavailable";
          return;
        }
        filtered.forEach(app => {
          const tile = document.createElement("button");
          tile.type = "button";
          tile.className = "app-tile";
          tile.disabled = !app.available;
          tile.dataset.appId = app.id;
          tile.style.setProperty("--tile-accent", app.accent);
          tile.setAttribute("aria-label", (app.available ? "Open " : "Unavailable: ") + app.title);
          tile.innerHTML =
            '<span class="tile-visual"><span class="tile-icon">' + (icons[app.icon] || icons.arrow) + '</span>' +
            '<span class="tile-code">' + esc(app.code) + '</span></span>' +
            '<span class="tile-content"><h3>' + esc(app.title) + '</h3><p>' + esc(app.description) + '</p>' +
            '<span class="tile-launch"><span>' + (app.available ? "Open Application" : esc(app.unavailableReason)) + '</span>' + (app.available ? icons.arrow : "") + '</span></span>';
          tile.addEventListener("click", () => requestLaunch(app));
          elements.appGrid.append(tile);
        });
        if (!filtered.length) {
          const empty = document.createElement("div");
          empty.className = "empty-state visible";
          const title = state.applications.length ? "No matching applications" : "No authorized applications";
          const message = state.applications.length
            ? "Try a different application name or module."
            : "No ALTEA applications are assigned to your current staff access profile.";
          empty.innerHTML = "<div>" + icons.search + "<strong>" + title + "</strong><span>" + message + "</span></div>";
          elements.appGrid.append(empty);
        }
        elements.applicationCount.textContent = filtered.length + (query ? " matching" : " authorized") +
          " application" + (filtered.length === 1 ? "" : "s");
      }

      function requestLaunch(app) {
        if (state.launch || state.bootstrap || state.phase !== "ready" || !app || !app.available) return;
        state.returnFocus = document.activeElement;
        const requestId = nextRequestId("ALTEA_LAUNCHPAD_NAVIGATE");
        state.launch = {
          requestId, app,
          timer: setTimeout(() => {
            showError("The application did not respond. Select Retry to refresh your authorization.", "ALTEA_LAUNCH_TIMEOUT");
          }, REQUEST_TIMEOUT_MS)
        };
        elements.loadingAppName.textContent = "Checking access and opening " + app.title;
        setLayerVisibility(elements.loadingOverlay, true);
        updateControls();
        try {
          // Navigation is sent once. Only read-only authorization requests retry.
          post("ALTEA_LAUNCHPAD_NAVIGATE", { appId: app.id, path: app.path }, requestId);
        } catch (_) {
          showError("The application could not be opened. Select Retry to reconnect.", "ALTEA_BRIDGE_UNAVAILABLE");
        }
      }

      function applyBootstrap(payload, duringLaunch = false) {
        if (!isRecord(payload) || !Array.isArray(payload.apps)) return false;
        const apps = payload.apps.map(cleanApp);
        if (apps.some(app => !app) || new Set(apps.map(app => app.id)).size !== apps.length) return false;
        if (!duringLaunch) stopBootstrap();
        state.applications = apps;
        state.profile = isRecord(payload.profile) ? payload.profile : null;
        state.phase = "ready";
        renderApplications();
        updateControls();
        if (!duringLaunch) {
          closeDialog();
          const name = String(state.profile?.preferredName || state.profile?.displayName || state.profile?.firstName || "").trim();
          const role = String(payload.accessRole || state.profile?.accessRole || "").trim();
          if (name || role) showToast("Secure ALTEA session", [name, role].filter(Boolean).join(" · "));
        }
        return true;
      }

      function showToast(title, message = "") {
        const toast = document.createElement("div");
        toast.className = "toast";
        toast.setAttribute("role", "status");
        toast.innerHTML = icons.check + "<p><strong>" + esc(title) + "</strong>" + esc(message) + "</p>";
        elements.toastRegion.append(toast);
        setTimeout(() => toast.remove(), 4200);
      }

      function showError(message, code = "ALTEA_UNAVAILABLE", retainApps = false) {
        if (!elements.dialogLayer.classList.contains("visible") && !elements.loadingOverlay.classList.contains("visible")) {
          state.returnFocus = document.activeElement;
        }
        stopBootstrap();
        stopLaunch();
        if (!retainApps) {
          state.phase = "error";
          state.applications = [];
          state.profile = null;
          renderApplications();
        }
        updateControls();
        elements.dialogTitle.textContent = "ALTEA access unavailable";
        elements.dialogBody.innerHTML = '<p class="modal-message" role="alert">' + esc(message || "The ALTEA launchpad could not be loaded.") + "</p>" +
          (/^[A-Z][A-Z0-9_]{0,99}$/.test(code) ? '<p class="modal-message"><small>' + esc(code) + "</small></p>" : "");
        elements.dialogActions.innerHTML =
          '<button class="button button-secondary" type="button" data-action="close">Close</button>' +
          '<button class="button button-primary" type="button" data-action="retry">Retry</button>';
        elements.dialogActions.querySelector('[data-action="close"]').addEventListener("click", closeDialog);
        elements.dialogActions.querySelector('[data-action="retry"]').addEventListener("click", () => beginBootstrap());
        setLayerVisibility(elements.dialogLayer, true);
        elements.dialogActions.querySelector('[data-action="retry"]').focus();
      }

      function closeDialog() {
        const wasOpen = elements.dialogLayer.classList.contains("visible");
        setLayerVisibility(elements.dialogLayer, false);
        if (wasOpen) {
          const target = state.returnFocus?.isConnected && !state.returnFocus.disabled ? state.returnFocus : elements.refresh;
          target.focus();
        }
      }

      elements.refresh.addEventListener("click", () => beginBootstrap());
      elements.appSearch.addEventListener("input", () => {
        elements.clearSearch.classList.toggle("visible", Boolean(elements.appSearch.value));
        renderApplications();
      });
      elements.clearSearch.addEventListener("click", () => {
        elements.appSearch.value = "";
        elements.clearSearch.classList.remove("visible");
        renderApplications();
        elements.appSearch.focus();
      });
      elements.dialogClose.addEventListener("click", closeDialog);
      elements.dialogLayer.addEventListener("mousedown", event => {
        if (event.target === elements.dialogLayer) closeDialog();
      });
      document.addEventListener("keydown", event => {
        if (!elements.dialogLayer.classList.contains("visible")) return;
        if (event.key === "Escape") {
          event.preventDefault();
          closeDialog();
        } else if (event.key === "Tab") {
          const controls = [...elements.dialogLayer.querySelectorAll("button:not(:disabled)")];
          const first = controls[0], last = controls[controls.length - 1];
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        }
      });

      window.addEventListener("message", event => {
        if (event.source !== window.parent || (parentOrigin && event.origin !== parentOrigin)) return;
        let data = event.data;
        if (typeof data === "string") {
          try { data = JSON.parse(data); } catch (_) { return; }
        }
        if (!isRecord(data) || data.source !== PARENT_SOURCE) return;
        if (data.type === "ALTEA_LAUNCHPAD_HOST_READY") {
          sendBootstrap();
          return;
        }
        const bootstrapMatch = Boolean(state.bootstrap && data.requestId === state.bootstrap.requestId);
        const launchMatch = Boolean(state.launch && data.requestId === state.launch.requestId);
        if (!bootstrapMatch && !launchMatch) return;
        if (data.type === "ALTEA_LAUNCHPAD_BOOTSTRAP") {
          if (!applyBootstrap(data.payload, launchMatch)) {
            showError("The authorization service returned an invalid application list.", "ALTEA_RESPONSE_INVALID");
          }
        } else if (data.type === "ALTEA_LAUNCHPAD_ERROR") {
          const code = String(data.payload?.code || "ALTEA_UNAVAILABLE");
          showError(data.payload?.message, code, launchMatch && ["ALTEA_APP_ACCESS_CHANGED", "ALTEA_REQUEST_BUSY", "ALTEA_APP_UNAVAILABLE"].includes(code));
        } else if (data.type === "ALTEA_LAUNCHPAD_NAVIGATING" && launchMatch) {
          if (data.payload?.appId !== state.launch.app.id || data.payload?.path !== state.launch.app.path) {
            showError("The application launch response was invalid.", "ALTEA_RESPONSE_INVALID");
            return;
          }
          stopLaunch();
        }
      });

      window.addEventListener("pagehide", () => {
        stopBootstrap();
        stopLaunch();
      });
      window.addEventListener("pageshow", event => {
        if (event.persisted) beginBootstrap();
      });
      beginBootstrap("ALTEA_LAUNCHPAD_READY");
    })();
  