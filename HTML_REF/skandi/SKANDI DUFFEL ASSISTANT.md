# SKANDI DUFFEL ASSISTANT — V12 NEW INTEGRATION

## INFO
- System: SKANDI — customer-facing booking support.
- Route to create in Wix: `/duffel-assistant`.
- Wix HTML element: `#htmlDuffelAssistant` (full-width/full-height embed).
- Wix page controller: `/src/pages/Duffel Assistant.js` (bind to the Wix-created page; Wix may assign a generated page-code suffix).
- Web facade: `/src/backend/SKANDI_CORE/duffelAssistant.web.js`.
- Core: `/src/backend/SKANDI_CORE/duffelAssistant.js`.
- Reused canonical cores: `customerProfile.js`, `duffelGround.js`, `duffelClient.js`.
- Required restoration on inspected Git main: `/src/backend/SKANDI_CORE/duffelIdentity.js` is imported by `customerProfile.js` but was absent from main on 2026-10-18. Do not overwrite an independently approved Wix-hosted implementation without comparing it.
- Supabase: existing `customer_profiles`, `altea_bookings`, `customer_profiles_booking_links` and related profile booking reads via canonical customerProfile only.
- Provider: Duffel Customer Users, Component Client Keys, Flight Orders and Stays Bookings; existing `DUFFEL_ACCESS_TOKEN` remains server side.
- Authentication: Wix SiteMember via `currentMember`; booking scope is verified through `getCustomerBookingDetailCore`.
- Bridge: `SKANDI_DUFFEL_ASSISTANT` → `SKANDI_WIX_PARENT`; `DUFFEL_ASSISTANT_READY`, `DUFFEL_ASSISTANT_LIST`, `DUFFEL_ASSISTANT_KEY_REQUEST`, `DUFFEL_ASSISTANT_SIGN_IN` and corresponding host responses.
- Mode: Duffel Assistant test integration. LIVE MODE REQUIRES DUFFEL COMMERCIAL ACTIVATION AND PRODUCTION VALIDATION.
- Status: STATICALLY VERIFIED for standalone bundle; REQUIRES LIVE TEST for Wix editor/embed, Duffel connection, identity linkage and servicing reconciliation.
- Source of truth: this file contains the complete new embed code below. It does not replace or modify the existing My Profile HTML_REF or its established visual design.

## CHANGE LOG
- 2026-10-18: Introduced a standalone authenticated Duffel Assistant route, scoped provider keys generated on demand, optional per-booking context after canonical ownership verification, ability to link existing owned Duffel flight/stay resources without replacing other permitted customer users, explicit support issue types and customer-friendly error states. No original SKANDI profile, checkout, ALTEA or master-page HTML changed.

## DEPLOYMENT / REVIEW
- Create and publish the new Wix page and bind the page controller to its actual Wix page code file. Install the full HTML below in the HTML component with ID `htmlDuffelAssistant`; set the embed to fill the page viewport.
- Verify existing `customerProfile.js` provider sync and any newer deployed version of `duffelIdentity.js` before installing its restoration.
- The Assistant displays trips that Duffel knows are associated with the customer user; existing bookings are associated when the customer opens a specific verified booking from this page. Generic "All Duffel trips" cannot discover unknown/unlinked supplier orders.
- Existing SKANDI customer-cancellation/payment/ALTEA flows remain unchanged. A Duffel Assistant servicing outcome is external to those flows and must be reconciled into canonical SKANDI records before live launch.
- Duffel Assistant browser resources may require site/iframe CSP allowance as documented at https://duffel.com/docs/guides/integrating-the-duffel-assistant .

## COMPLETE HTML EMBED
```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="color-scheme" content="light" />
  <title>SKANDI | Manage Duffel Trips</title>
  <style>
    :root {
      --navy: #022e64;
      --deep: #061a30;
      --ink: #14273c;
      --muted: #536477;
      --aqua: #2da9b6;
      --border: #d8e2ec;
      --surface: #fff;
      --background: #f5f7f9;
      --focus: #0988ac;
    }
    * { box-sizing: border-box; }
    html, body { margin: 0; min-height: 100%; width: 100%; }
    body { font: 15px/1.55 -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif; background: var(--background); color: var(--ink); }
    button, select { font: inherit; }
    button:focus-visible, select:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
    .page { max-width: 1100px; padding: clamp(20px, 5vw, 56px) 20px 80px; margin: 0 auto; }
    .eyebrow { font-size: 12px; letter-spacing: .16em; font-weight: 800; color: var(--aqua); margin: 0 0 8px; }
    h1 { font-size: clamp(30px, 4.4vw, 48px); letter-spacing: -.045em; line-height: 1.12; margin: 0; color: var(--deep); }
    .lead { max-width: 690px; margin: 16px 0 24px; color: var(--muted); font-size: 16px; }
    .panel { background: var(--surface); border: 1px solid var(--border); border-radius: 11px; padding: clamp(22px, 3.8vw, 36px); box-shadow: 0 12px 36px rgba(6,26,48,.06); }
    .panel h2 { font-size: 21px; letter-spacing: -.02em; margin: 0 0 6px; }
    .panel p { margin: 0 0 24px; color: var(--muted); }
    .fields { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr); gap: 18px; }
    label { display: block; font-size: 13px; font-weight: 700; color: var(--deep); margin-bottom: 7px; }
    select { appearance: auto; background: #fff; color: var(--ink); border: 1px solid #a7b6c5; border-radius: 5px; width: 100%; min-height: 51px; padding: 11px 14px; }
    select:disabled { background: #f3f5f7; }
    .actions { display: flex; align-items: center; gap: 12px; margin-top: 26px; flex-wrap: wrap; }
    .primary { border: 1px solid var(--navy); background: var(--navy); color: #fff; padding: 13px 24px; border-radius: 5px; font-weight: 700; min-height: 50px; cursor: pointer; }
    .primary:hover:not(:disabled) { background: #01407b; }
    .primary:disabled { opacity: .65; cursor: wait; }
    .secondary { border: 1px solid var(--navy); background: transparent; color: var(--navy); padding: 13px 18px; border-radius: 5px; font-weight: 700; min-height: 50px; cursor: pointer; }
    .status { margin-top: 18px; min-height: 20px; color: var(--muted); font-size: 14px; }
    .status.error { color: #9d2323; }
    .fine { color: var(--muted); font-size: 13px; margin-top: 25px; max-width: 800px; }
    .hidden { display: none !important; }
    @media(max-width: 660px) {
      .fields { grid-template-columns: 1fr; }
      .page { padding: 25px 16px 90px; }
      .panel { padding: 23px 18px; }
      .actions { align-items: stretch; flex-direction: column; }
      .actions button { width: 100%; }
    }
    @media(prefers-reduced-motion: reduce) { * { scroll-behavior: auto !important; } }
  </style>
</head>
<body>
  <main class="page">
    <p class="eyebrow">SKANDI TRAVELS · BOOKING SUPPORT</p>
    <h1>Manage your Duffel trip</h1>
    <p class="lead">View eligible flight and hotel reservations or get help from Duffel's travel support team. SKANDI remains your travel retailer.</p>
    <section class="panel" aria-labelledby="supportHeading">
      <h2 id="supportHeading">How can we help?</h2>
      <p>Choose your trip for booking-specific support, or open the Assistant to see trips linked to your Duffel customer identity.</p>
      <div class="fields">
        <div>
          <label for="trip">Trip</label>
          <select id="trip" aria-describedby="status"><option value="">All linked Duffel trips</option></select>
        </div>
        <div>
          <label for="issue">Reason for contacting support</label>
          <select id="issue">
            <option value="">Choose inside the Assistant</option>
            <option value="change">Change a booking</option>
            <option value="cancellation">Cancel a booking</option>
            <option value="other">Other support</option>
          </select>
        </div>
      </div>
      <div class="actions">
        <button class="primary" id="open" type="button" disabled>Open Duffel Assistant</button>
        <button class="secondary hidden" id="signIn" type="button">Sign in to SKANDI</button>
        <button class="secondary" id="refresh" type="button">Refresh trips</button>
      </div>
      <div id="status" class="status" role="status" aria-live="polite">Connecting to your SKANDI account…</div>
    </section>
    <p class="fine">Duffel Assistant only covers bookings that Duffel can identify and service. SKANDI customer support remains available for other bookings, package services and issues outside Duffel's scope.</p>
  </main>
  <duffel-assistant></duffel-assistant>
  <script>
  (() => {
    "use strict";
    const SOURCE = "SKANDI_DUFFEL_ASSISTANT";
    const PARENT = "SKANDI_WIX_PARENT";
    const el = id => document.getElementById(id);
    const choices = [];
    let pending = false;
    let loadingScript = null;
    let requestId = "";
    let keyTimer = null;
    let usable = false;
    const post = (type, payload = {}) => window.parent.postMessage({ source: SOURCE, type, payload }, "*");
    const status = (message, isError = false) => {
      el("status").textContent = String(message || "");
      el("status").classList.toggle("error", isError);
    };
    function setPending(value) {
      pending = value;
      el("open").disabled = value || !usable;
      el("open").textContent = value ? "Preparing Assistant…" : "Open Duffel Assistant";
    }
    function loadScript() {
      if (typeof window.openDuffelAssistant === "function") return Promise.resolve();
      if (loadingScript) return loadingScript;
      loadingScript = new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = "https://assets.duffel.com/assistant/custom-element.js";
        s.async = true;
        const timer = setTimeout(() => reject(new Error("Duffel Assistant resources did not load in time. Check the Wix embed security policy.")), 20000);
        s.onload = () => {
          clearTimeout(timer);
          if (typeof window.openDuffelAssistant === "function") resolve();
          else reject(new Error("Duffel Assistant could not initialize in this page."));
        };
        s.onerror = () => {
          clearTimeout(timer);
          reject(new Error("Duffel Assistant resources could not load. Check the Wix embed content security policy."));
        };
        document.head.appendChild(s);
      }).catch(e => { loadingScript = null; throw e; });
      return loadingScript;
    }
    function renderTrips(trips) {
      choices.length = 0;
      const select = el("trip");
      select.replaceChildren(new Option("All linked Duffel trips", ""));
      for (const trip of Array.isArray(trips) ? trips : []) {
        if (!trip?.bookingId || !["air", "stay"].includes(trip.resourceType)) continue;
        const label = [trip.kind, trip.label, trip.route, trip.departureDate].filter(Boolean).join(" · ").slice(0, 240);
        const index = String(choices.length);
        choices.push({ bookingId: trip.bookingId, resourceType: trip.resourceType });
        select.add(new Option(label, index));
      }
    }
    el("open").addEventListener("click", () => {
      if (pending || !usable) return;
      const idx = el("trip").value;
      const selected = idx === "" ? null : choices[Number(idx)];
      if (idx !== "" && !selected) { status("Refresh your trip list and try again.", true); return; }
      setPending(true);
      status("Preparing a secure Duffel support session…");
      requestId = `das_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
      post("DUFFEL_ASSISTANT_KEY_REQUEST", {
        requestId,
        bookingId: selected?.bookingId || "",
        resourceType: selected?.resourceType || "",
        issueType: el("issue").value
      });
      clearTimeout(keyTimer);
      keyTimer = setTimeout(() => {
        if (!pending) return;
        setPending(false);
        status("Duffel did not respond in time. Try again, or contact SKANDI Support.", true);
      }, 45000);
    });
    el("refresh").addEventListener("click", () => {
      status("Refreshing your linked trips…");
      post("DUFFEL_ASSISTANT_LIST");
    });
    el("signIn").addEventListener("click", () => post("DUFFEL_ASSISTANT_SIGN_IN"));
    window.addEventListener("message", async event => {
      const data = event.data;
      if (data && typeof data === "object" &&
          (data.type === "duffel-assistant-minimise" || data.type === "duffel-assistant-new-message")) {
        if (data.type === "duffel-assistant-minimise") status("Assistant minimized. Select Open Duffel Assistant to return to support.");
        else status("You have a new message from Duffel support.");
        return;
      }
      if (event.source !== window.parent) return;
      let msg = data;
      if (typeof msg === "string") { try { msg = JSON.parse(msg); } catch (_) { return; } }
      if (!msg || msg.source !== PARENT) return;
      const payload = msg.payload || {};
      switch (msg.type) {
        case "DUFFEL_ASSISTANT_HOST_READY":
          break;
        case "DUFFEL_ASSISTANT_TRIPS":
          usable = true;
          renderTrips(payload.trips);
          setPending(false);
          el("signIn").classList.add("hidden");
          status(choices.length ? "Choose a booking, or open all linked Duffel trips." : "No linked Duffel bookings are listed yet. You can still open the Assistant for general account support.");
          break;
        case "DUFFEL_ASSISTANT_OPEN":
          if (payload.requestId !== requestId || !pending) return;
          clearTimeout(keyTimer);
          requestId = "";
          if (!payload.clientKey) { setPending(false); status("Duffel did not issue a valid session key.", true); return; }
          try {
            await loadScript();
            const config = { clientKey: payload.clientKey, showMinimiseButton: true };
            if (["cancellation", "change", "other"].includes(payload.issueType)) {
              config.context = { issueType: payload.issueType };
            }
            window.openDuffelAssistant(config);
            status("Duffel Assistant opened.");
          } catch (e) {
            status(e?.message || "Could not open Duffel Assistant.", true);
          } finally { setPending(false); }
          break;
        case "DUFFEL_ASSISTANT_ERROR":
          if (payload.requestId && requestId && payload.requestId !== requestId) return;
          clearTimeout(keyTimer);
          requestId = "";
          setPending(false);
          status(payload.message || "The Assistant is unavailable.", true);
          if (payload.code === "LOGIN_REQUIRED") el("signIn").classList.remove("hidden");
          break;
        default:
          break;
      }
    });
    post("DUFFEL_ASSISTANT_READY");
    for (const ms of [350, 950, 2200]) setTimeout(() => { if (!usable) post("DUFFEL_ASSISTANT_READY"); }, ms);
  })();
  </script>
</body>
</html>
```
