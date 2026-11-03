# SKANDI GLOBAL OPS CONTROL & IFRAME AUTO-RESIZE — INFO / LOG

- **Authority:** Wix Dashboard → Settings → Custom Code
- **Name:** Global SKANDI Ops Control & Iframe Auto-Resize
- **Area:** SKANDI site-wide, public + internal pages
- **Scope:** All pages, Body – End
- **Code Type:** Essential — no analytics or marketing behavior
- **Target repo:** `skanditravels/SKANDI-TRAVELS`, `main`
- **System baseline:** V12
- **Site page controllers:** `src/pages/masterPage.js`,
  `src/pages/Home.n73w8.js`, existing per-page controllers
- **Public module:** `src/public/destinationFlowBridge.js`
- **Related global registry:** `src/public/siteMap.js`
- **HTML element IDs:** Existing Wix IDs unchanged; no new page element
- **Database/backend:** None; no Supabase, provider or backend calls
- **Authentication:** No authentication or authorization operations
- **Messages:** Receives legacy `RESIZE_IFRAME` only, and defers all
  V12-owned resize events to their current page controllers
- **Live publication status:** Not published by this package
- **Static verification:** JavaScript syntax and test harness
- **Live verification:** Required for browser, Wix published pages, breakpoints

## CHANGE LOG

- 2026-10-17 — Site owner supplied active Dashboard custom code:
  general `RESIZE_IFRAME` listener directly resized every iframe and its parent.
  The same code tried to broadcast from inside an iframe, even though it was
  installed as top-level Wix Dashboard custom code.
- 2026-10-17 — V12-safe replacement prepared. Existing masterPage, Home and
  destination bridge resize owners preserved. Legacy height fallback now
  validates sender/window and height, avoids V12-owned sources and
  fixed/pinned global chrome, and never rewrites page sections.
  No polling or mobile zoom suppression. Source only; requires live test.

## COMPLETE INTENDED CUSTOM CODE

```html
<script>
(function () {
  "use strict";

  /*
   * SKANDI GLOBAL OPS CONTROL — V12 SAFE LEGACY RESIZE FALLBACK
   *
   * This code runs in the Wix page. Existing V12 page/master controllers
   * remain the owners of their own HTML embed dimensions.
   *
   * Only legacy, unowned RESIZE_IFRAME messages receive a DOM fallback.
   * Width, viewport scale, touch gestures, and embed CSS are never changed.
   */

  var INSTALL_KEY = "__SKANDI_OPS_CONTROL_V12_LEGACY_RESIZE__";
  if (window[INSTALL_KEY]) return;
  window[INSTALL_KEY] = true;

  var V12_OWNED_SOURCES = {
    SKANDI_HOME: true,
    SKANDI_HOME_LONG_DISCOVERY_V2: true,
    SKANDI_HOME_OLD_STYLE: true,
    SKANDI_DYNAMIC_COUNTRY_PAGE: true,
    SKANDI_DESTINATION_FLOW: true,
    SKANDI_DESTINATIONS_INDEX: true,
    SKANDI_DYNAMIC_DESTINATION_PAGE: true,
    SKANDI_DYNAMIC_DESTINATION_AREA: true,
    SKANDI_AREA_HOTEL_SEARCH: true,
    SKANDI_HOTEL_DETAIL: true,
    SKANDI_HOTEL_SEARCH: true
  };

  var MIN_HEIGHT = 64;
  var MAX_HEIGHT = 30000;
  var PIXEL_TOLERANCE = 8;
  var stateByFrame = new WeakMap();

  function isFiniteHeight(value) {
    return typeof value === "number" && isFinite(value) &&
      value >= MIN_HEIGHT && value <= MAX_HEIGHT;
  }

  function findSendingIframe(sender) {
    if (!sender) return null;
    var frames = document.querySelectorAll("iframe");
    for (var i = 0; i < frames.length; i += 1) {
      try {
        if (frames[i].contentWindow === sender) return frames[i];
      } catch (_) {
        // The sender is not an accessible iframe window.
      }
    }
    return null;
  }

  function isPinnedOrFixed(element) {
    var node = element;
    for (var depth = 0; node && depth < 8; depth += 1, node = node.parentElement) {
      try {
        var position = window.getComputedStyle(node).position;
        if (position === "fixed" || position === "sticky") return true;
      } catch (_) {
        return true;
      }
    }
    return false;
  }

  function belongsToExcludedChrome(frame, source) {
    if (
      /COOKIE|CONSENT|HEADER|FOOTER/i.test(source) ||
      isPinnedOrFixed(frame)
    ) return true;

    var node = frame;
    for (var depth = 0; node && depth < 8; depth += 1, node = node.parentElement) {
      var identity = String((node.id || "") + " " + (node.getAttribute("data-testid") || ""));
      if (/cookie|consent|skandiHeader|skandiFooter|riaintraHeader|alteaHeader/i.test(identity)) {
        return true;
      }
    }
    return false;
  }

  function directSingleChildWrapper(frame) {
    var wrapper = frame.parentElement;
    if (!wrapper || wrapper.children.length !== 1 || wrapper.firstElementChild !== frame) {
      return null;
    }
    if (isPinnedOrFixed(wrapper)) return null;
    return wrapper;
  }

  function applyLegacyHeight(frame, requested) {
    if (!document.documentElement.contains(frame)) return;

    var existing = stateByFrame.get(frame);
    if (existing && Math.abs(existing.lastHeight - requested) <= PIXEL_TOLERANCE) {
      return;
    }

    var wrapper = directSingleChildWrapper(frame);

    /*
     * Only a wrapper consisting of this iframe alone may be resized.
     * Never climb and overwrite Wix sections, grids, page layout, or
     * the pinned consent layer.
     */
    frame.style.height = String(requested) + "px";
    if (wrapper) wrapper.style.height = String(requested) + "px";

    stateByFrame.set(frame, { lastHeight: requested, pending: false });
  }

  function onMessage(event) {
    var data = event && event.data;
    if (!data || typeof data !== "object" || data.type !== "RESIZE_IFRAME") {
      return;
    }

    var source = typeof data.source === "string" ? data.source : "";
    if (V12_OWNED_SOURCES[source]) return;

    var payload = data.payload && typeof data.payload === "object"
      ? data.payload : data;
    var requested = payload.height;

    /*
     * Reject malformed and unbounded inputs rather than silently expanding
     * the page. Explicitly require a numeric height (not an arbitrary string).
     */
    if (!isFiniteHeight(requested)) return;

    var frame = findSendingIframe(event.source);
    if (!frame || belongsToExcludedChrome(frame, source)) return;

    var height = Math.round(requested);
    var state = stateByFrame.get(frame);
    if (state && state.pending) {
      state.nextHeight = height;
      return;
    }

    state = { lastHeight: state ? state.lastHeight : 0,
      nextHeight: height, pending: true };
    stateByFrame.set(frame, state);

    window.requestAnimationFrame(function () {
      var latest = stateByFrame.get(frame);
      if (!latest) return;
      var nextHeight = latest.nextHeight;
      latest.pending = false;
      if (isFiniteHeight(nextHeight) && !belongsToExcludedChrome(frame, source)) {
        applyLegacyHeight(frame, nextHeight);
      }
    });
  }

  window.addEventListener("message", onMessage, false);
})();
</script>
```
