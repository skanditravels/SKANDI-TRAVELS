# INFO / LOG — ALTEA LAUNCHPAD

- Source file: `/HTML_REF/altea/ALTEA Launchpad.md`.
- Display name/system: ALTEA Launchpad / ALTEA.
- Wix page: `/src/pages/ALTEA Launchpad.ajs4y.js`.
- Route: `/riaintra/success-factors/altea`, owned by `public/siteMap.SITE_MAP.alteaLaunchpad`.
- HTML element: the existing Wix HTML component that sends `source: SKANDI_ALTEA_LAUNCHPAD` with a valid `ALTEA_LAUNCHPAD_READY` or `ALTEA_LAUNCHPAD_REFRESH` request. V12.1 enumerates `$w("HtmlComponent")` using the existing master-page pattern, then pins the responding component. No hard-coded ID, fallback alias or element rename is required. The actual live element ID is not established by the public controller bundle.
- Canonical backend facade: `backend/SKANDI_CORE/staffAuth.web`.
- Canonical implementation: `backend/SKANDI_CORE/staffAuth`, using `supabaseServer`, `platformCache`, `platformErrors`, `platformValidation`, `platformAudit`, and `public/siteMap`.
- Authentication/authorization: Wix Members session; Supabase staff identity, effective assignment, active access role and permission preset; existing ALTEA app/group filters. Browser-supplied app IDs and paths never grant access.
- Supabase resources: `agent_users`, `org_employee_assignments`, `org_access_roles`, `org_permission_presets`; existing staff-auth audit dependency `staff_login_audit`. No new resources, queries, policies or permission grants.
- External dependencies: Wix Members, Wix web methods, Wix HTML components and Wix Location. Launchpad does not directly call Duffel, Amadeus, Timatic or other provider APIs; it opens existing authorized application routes.
- Status: V12.1 bridge correction, locally tested (31/31 checks). STATICALLY VERIFIED for syntax, transitive imports/exports, message contracts and unchanged schema dependencies. REQUIRES LIVE TEST for Wix publication, authenticated navigation and destination application behavior.
- Source-of-truth provenance: no existing Launchpad HTML_REF was found in the supplied project or matching Library title results. The complete user-supplied `Pasted text(20261006-064759).txt` is the authoritative HTML input for this repair.
- Last inspected: 2026-10-06.
- Change log: 2026-10-06 — Established this complete HTML_REF from the supplied Launchpad HTML and traced its existing B-002 page bridge to the V12 staff-auth core. The current core matches the earlier V12 delivery apart from a trailing newline; the canonical cache matches the prior cache repair. All four authorization tables and their selected fields were verified by read-only schema inspection, with RLS enabled. The uploaded HTML's message names match the existing page. Identified missing ready retry/bootstrap timeout, uncaught startup rejection, lost request correlation, stale response handling and late navigation locking.
- Change log: 2026-10-06 — Read-only inspection of the current published page bundle establishes `#alteaDasboardEmbed` as the controller's target and confirms both `getStaffPortalSession` and `getAlteaLaunchpadApps` have generated Wix backend proxies. Corrected the replacement controller's ID accordingly. The three historical local ID candidates are not retained as fallback aliases. The staff-auth facade already supports this contract and requires no change.
- Change log: 2026-10-06 — V12 bridge and HTML now use HOST_READY plus repeated, correlated read-only READY/REFRESH requests; navigation is sent once. Added bounded service/UI timeouts, explicit loading/error/empty states, persistent Refresh, stale-response rejection, safe coded errors, dialog focus handling and one navigation at a time. Existing staff identity and permission rules are unchanged; each launch revalidates the canonical backend app list. No added backend facade, duplicate app catalog, independent database client or provider call.
- Change log: 2026-10-06 — Inspected the published Wix route map: `uposx` (OPS Control) is `/riaintra/success-factors/altea/ops`. Corrected only `SITE_MAP.opsControl` from its obsolete `/occ` value. Ticketing and PSS/DCS have no matching static or dynamic published routes; their existing authorized catalog entries now carry `available:false` and a visible reason. They remain visible to authorized staff, but cannot launch. Their permission groups, IDs and intended future paths are retained. No destination pages were invented or redirected to unrelated tools.
- Change log: 2026-10-06 — 20/20 local checks pass using jsdom and the actual pinned `@wix/web-methods@1.0.12` SDK with Wix Members and Supabase operations stubbed. Nine transitive local dependency files pass import/export checks. The complete HTML remains in this document and is extracted verbatim for delivery. No GitHub, live Wix, Supabase data/schema or provider configuration was changed.
- Change log: 2026-10-06 — V12.1 correction after the user supplied repeated `[ALTEA Launchpad] No supported HTML embed was found.` console output. This proves the old controller exits before registering its message handler. The earlier decision to treat its `#alteaDasboardEmbed` target as an existing page component is superseded: the published code established a lookup target, not that element's presence. The previous test fixture repeated the assumed ID and did not detect this mismatch. A regression fixture with a different actual ID reproduces the exact old error.
- Change log: 2026-10-06 — Replaced only the page controller's fixed-ID lookup with bounded HTML-component discovery. Each discovered component gets one listener and a non-sensitive HOST_READY notice. The first valid Launchpad READY/REFRESH pins the channel before any asynchronous authorization; NAVIGATE cannot claim it. Other components cannot take over, receive the authorized profile/app list, or invoke navigation after binding. Discovery stops on connection or after 40 passes at 500 ms intervals; listeners already registered remain usable for a later HTML Retry. Added distinct missing-component and missing-handshake diagnostics plus the actual bound element ID in the console.
- Change log: 2026-10-06 — V12.1 passes 31/31 local checks, including old-error reproduction, differently named embeds, header/footer isolation, delayed mounting, single registration, bounded discovery, lost HOST_READY, channel pinning during an in-flight authorization, and a complete HTML/page/SDK/core fixture round trip. The executable HTML, page imports, staff-auth implementation/facade and shared route map are unchanged from V12. Nine transitive dependency files pass import/export checks. No live deployment, GitHub mutation, database operation or provider configuration change was performed for V12.1.

## V12 ownership and contracts

`HTML_REF/altea/ALTEA Launchpad.md` → existing HTML component identified by its Launchpad handshake → `src/pages/ALTEA Launchpad.ajs4y.js` → `staffAuth.web` → `staffAuth` → existing Wix Members / Supabase helpers.

The uploaded layout, colors, icons, responsive tiles and search remain. The HTML obtains all applications and availability from the backend; no staff roles or app catalog are maintained in the embed. The shared `SITE_MAP` remains the owner of the OPS route.

| Direction | Message | Behavior |
| --- | --- | --- |
| Page → HTML | `ALTEA_LAUNCHPAD_HOST_READY` | Non-sensitive discovery notice to each detected HTML component; the Launchpad resends its pending request with the same ID. No profile or app data is broadcast. |
| HTML → Page | `ALTEA_LAUNCHPAD_READY` | Loads the authorized app list. |
| HTML → Page | `ALTEA_LAUNCHPAD_REFRESH` | Rechecks session and app access; Retry and Refresh create a new ID. |
| Page → HTML | `ALTEA_LAUNCHPAD_BOOTSTRAP` | Returns sanitized apps/profile with the caller's request ID. Can also update the app list when a launch discovers changed access. |
| HTML → Page | `ALTEA_LAUNCHPAD_NAVIGATE` | Sends an app ID and displayed path once; the page checks its authorized snapshot and revalidates backend access before navigating. |
| Page → HTML | `ALTEA_LAUNCHPAD_NAVIGATING` | Acknowledges that Wix Location accepted the navigation call. Does not claim the destination finished loading. |
| Page → HTML | `ALTEA_LAUNCHPAD_ERROR` | Returns a safe message/code with the same request ID. |

- Release: `V12.1-ALTEA-LAUNCHPAD-2026.10.06` in the corrected page controller. The compatible, unchanged HTML retains `V12-ALTEA-LAUNCHPAD-2026.10.06`. This is a controller-only runtime repair, not a new HTML protocol.
- Discovery uses the Wix component type selector, not a guessed element name. It retries only listener discovery, never a navigation or mutation. Message source/type/request ID identify the Launchpad channel; they are not substitutes for backend staff authorization. Once pinned, responses and errors go only to that component. A missing HTML component cannot be created by this controller; the page must contain the existing Launchpad HTML.
- Backend app descriptors retain `id`, `title`, `description`, `icon`, `code`, `accent`, `path`, and add `available` plus `unavailableReason`. Availability is catalog metadata, independent of staff permission grants. A browser message cannot override the page's backend-supplied availability.
- Read-only handshakes repeat every 1.5 seconds with the same request ID. Concurrent bootstrap requests share a backend read; only the current request receives its result. The page bounds the authorization check at 20 seconds; HTML stops waiting at 30 seconds. Expired responses are ignored and navigation is never automatically replayed.
- The page uses the existing staff-auth endpoints. `getStaffPortalSession` retains `Permissions.Anyone`; `getAlteaLaunchpadApps` retains `Permissions.SiteMember` and backend staff authorization. The shared core's existing five-minute access-role/preset cache remains; a fresh endpoint call does not bypass that cache.
- HTML verifies the message's source window and, when available, the parent origin derived from the browser referrer. It accepts only matching request IDs. Service failures are not presented as a successful empty app list. Authorization and data access remain enforced by the destination backends as well.

## Published-route check — 2026-10-06

| Existing app ID | Canonical target | V12 launch state |
| --- | --- | --- |
| `ardw` | `/riaintra/success-factors/altea/reservations` | Route present; staff authorization required. |
| `inventory` | `/riaintra/success-factors/altea/inventory-control` | Route present; staff authorization required. |
| `uniform-control` | `/riaintra/success-factors/uniform/admin-control` | Route present; staff authorization required. |
| `ticketing` | `/riaintra/success-factors/altea/ticketing` | Visible when authorized; unavailable until the actual application is published. |
| `pss-dcs` | `/riaintra/success-factors/altea/departure-control` | Visible when authorized; unavailable until the actual application is published. |
| `timatic` | `/riaintra/success-factors/altea/timatic` | Published route retained. Existing site-map deprecation metadata is unchanged. |
| `grouptalk` | `/riaintra/success-factors/altea/grouptalk` | Route present; existing app/group/GroupTalk flag checks retained. |
| `occ` | `/riaintra/success-factors/altea/ops` | Corrected to the published OPS Control route; app ID and permission groups stay unchanged. |

Route presence verifies routing, not destination functionality. When Ticketing or PSS/DCS is actually published, verify its route and authorization before updating availability in this same `staffAuth.ALTEA_APPS` catalog. No additional registry is required.

## Verification and deployment

- The 31 local checks cover old-error reproduction, a different actual element ID, unrelated header/footer messages, pinned-channel isolation, delayed component mounting, selector return shapes, bounded retries, missing components, missing handshakes, lost HOST_READY, one listener per component, and unchanged V12 HTML/backend/routes/imports. Existing checks also cover anonymous/inactive access denial, preset/group filtering, GroupTalk gating, SDK permission metadata, concurrent bootstrap/refresh correlation, expired sessions, changed app access, forged paths, duplicate navigation, missing exports, safe failures, timeouts/late replies, escaped tile content, search, retry/empty states, unavailable tiles, dialog keyboard handling and a full late-mounted embed/page/SDK/core round trip with test fixtures.
- Live database metadata confirms the selected staff/assignment/role/preset columns exist and RLS is enabled on all four tables. No database query, policy or grant was changed by this repair.
- For this V12.1 correction, replace the complete `/src/pages/ALTEA Launchpad.ajs4y.js`, retain this updated HTML_REF, publish and reload the page while signed in. Keep the already installed V12 Launchpad HTML, `staffAuth.js`, `staffAuth.web.js`, `public/siteMap.js`, repaired `platformCache.js`, `supabaseServer.js`, other canonical helpers and `masterPage.js` unchanged. The original V12 package remains the full-install prerequisite; the V12.1 correction package contains full changed files, not diff fragments.
- Expected new console confirmation: `[ALTEA Launchpad] Bridge attached to #<actual element ID>.` If the original `No supported HTML embed was found.` still appears, the old page controller is still running. If the new diagnostic says no HTML component could be bound, verify that this page actually contains a Wix HTML component. If it says components were found but none sent the handshake, verify the full Launchpad HTML below is installed in the intended component rather than only in a header/footer. Do not rename elements to guess an ID.
- Live verification still required: sign in with a valid staff session, load/search/refresh the Launchpad, open an assigned application and OPS Control, and confirm revoked access remains blocked. Wix's permission enforcement, actual navigation, publication parity and destination services are not simulated by local tests.
- No SQL migration, new secret, npm dependency or Wix element rename is needed. The original uploaded file remains an input reference; this document owns the final complete HTML below.
- Official API references checked: https://dev.wix.com/docs/sdk/core-modules/web-methods/web-method ; https://dev.wix.com/docs/velo/velo-only-apis/%24w/html-component/post-message ; https://dev.wix.com/docs/velo/apis/wix-location-frontend/to . Public route/module evidence was read from https://www.skanditravels.com/riaintra/success-factors/altea .

## COMPLETE HTML / SOURCE IMPLEMENTATION

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="theme-color" content="#354a5f">
  <title>SKANDI ALTEA Launchpad · V12</title>
  <style>
    :root {
      /* Amadeus Colors */
      --amadeus-blue: #005eb8;
      --amadeus-blue-dark: #004783;
      --amadeus-blue-deep: #003b70;
      --amadeus-blue-soft: #e8f3fc;
      --blue-800:#004f99;
      --blue-700:#005eb8;
      --canvas: #f4f5f6;
      --surface: #ffffff;
      --surface-subtle: #f8fafb;
      --slate: #707070;
      --text: #1d2a35;
      --text-soft: #52616d;
      --border: #d8dee3;
      --border-strong: #bcc7d0;
      --success: #16804a;
      --success-soft: #e7f5ed;
      --warning: #b35b00;
      --danger: #b42318;
      --shadow-sm: 0 2px 7px rgba(24, 39, 53, 0.09);
      --shadow-md: 0 10px 26px rgba(24, 39, 53, 0.15);
      --radius: 6px;
      --transition: 180ms ease;
      --font-family: "72", "Inter", "Segoe UI", Roboto, Arial, sans-serif;
    }

    * {
      box-sizing: border-box;
    }

    html {
      min-height: 100%;
      background: var(--canvas);
    }

    body {
      min-width: 320px;
      min-height: 100vh;
      margin: 0;
      overflow-x: hidden;
      color: var(--text);
      background:
        linear-gradient(180deg, rgba(0, 94, 184, 0.055), transparent 230px),
        var(--canvas);
      font-family: var(--font-family);
      -webkit-font-smoothing: antialiased;
      text-rendering: optimizeLegibility;
    }

    button,
    select,
    input {
      font: inherit;
    }

    button,
    select {
      -webkit-tap-highlight-color: transparent;
    }

    button:focus-visible,
    select:focus-visible,
    input:focus-visible {
      outline: 3px solid rgba(0, 94, 184, 0.28);
      outline-offset: 2px;
    }

    /* =========================================
       PAGE CONTENT STYLES
       ========================================= */
    .page-shell {
      min-height: 100vh;
      padding-top: 20px; /* Adjusted since header is removed */
    }

    .main-workspace {
      width: min(1180px, calc(100% - 48px));
      margin: 0 auto;
      padding: 38px 0 62px;
    }

    .workspace-intro {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      margin-bottom: 24px;
      gap: 24px;
    }

    .workspace-intro h1 {
      margin: 0;
      color: #172531;
      font-size: clamp(26px, 3.1vw, 38px);
      font-weight: 650;
      letter-spacing: -0.025em;
      line-height: 1.14;
    }

    .workspace-intro p {
      max-width: 650px;
      margin: 9px 0 0;
      color: var(--text-soft);
      font-size: 14px;
      line-height: 1.55;
    }

    .launchpad-panel {
      overflow: hidden;
      background: rgba(255, 255, 255, 0.68);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      box-shadow: var(--shadow-sm);
    }

    .panel-toolbar {
      min-height: 60px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 18px;
      gap: 18px;
      background: #fff;
      border-bottom: 1px solid var(--border);
    }

    .panel-heading {
      min-width: 0;
    }

    .panel-heading h2 {
      margin: 0;
      font-size: 16px;
      font-weight: 700;
    }

    .panel-heading span {
      display: block;
      margin-top: 3px;
      color: var(--slate);
      font-size: 11px;
    }

    .app-search {
      position: relative;
      width: min(310px, 40vw);
      flex: 0 1 310px;
    }

    .panel-controls {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .button:disabled {
      opacity: .55;
      cursor: wait;
    }

    .app-search svg {
      position: absolute;
      top: 50%;
      left: 11px;
      width: 17px;
      height: 17px;
      fill: none;
      stroke: var(--slate);
      stroke-width: 1.9;
      transform: translateY(-50%);
      pointer-events: none;
    }

    .app-search input {
      width: 100%;
      height: 36px;
      padding: 0 34px 0 36px;
      color: var(--text);
      background: var(--surface-subtle);
      border: 1px solid var(--border-strong);
      border-radius: 3px;
      font-size: 13px;
      transition:
        background var(--transition),
        border-color var(--transition),
        box-shadow var(--transition);
    }

    .app-search input:focus {
      background: #fff;
      border-color: var(--amadeus-blue);
      box-shadow: inset 0 0 0 1px var(--amadeus-blue);
      outline: none;
    }

    .clear-search {
      position: absolute;
      top: 50%;
      right: 6px;
      width: 26px;
      height: 26px;
      display: none;
      place-items: center;
      padding: 0;
      color: var(--slate);
      background: transparent;
      border: 0;
      border-radius: 3px;
      font-size: 18px;
      line-height: 1;
      transform: translateY(-50%);
      cursor: pointer;
    }

    .clear-search.visible {
      display: grid;
    }

    .clear-search:hover {
      color: var(--text);
      background: #e9edf0;
    }

    .app-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      padding: 22px;
      gap: 18px;
    }

    .app-tile {
      position: relative;
      min-height: 250px;
      display: flex;
      flex-direction: column;
      align-items: stretch;
      padding: 0;
      overflow: hidden;
      color: var(--text);
      text-align: left;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 5px;
      box-shadow: 0 1px 3px rgba(24, 39, 53, 0.07);
      cursor: pointer;
      transition:
        transform var(--transition),
        border-color var(--transition),
        box-shadow var(--transition);
    }

    .app-tile::before {
      position: absolute;
      z-index: 1;
      inset: 0 auto 0 0;
      width: 4px;
      content: "";
      background: var(--tile-accent, var(--amadeus-blue));
      transform: scaleY(0);
      transform-origin: bottom;
      transition: transform var(--transition);
    }

    .app-tile:hover {
      border-color: #aebbc5;
      box-shadow: var(--shadow-md);
      transform: translateY(-4px);
    }

    .app-tile:hover::before,
    .app-tile:focus-visible::before {
      transform: scaleY(1);
    }

    .app-tile:disabled {
      cursor: not-allowed;
      opacity: .72;
      transform: none;
      box-shadow: none;
    }
    .app-tile:disabled::before { transform: scaleY(0); }

    .tile-visual {
      position: relative;
      height: 92px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 18px 19px;
      color: var(--tile-accent, var(--amadeus-blue));
      background:
        radial-gradient(circle at 92% 12%, rgba(0, 94, 184, 0.12), transparent 44%),
        #f4f8fb;
      border-bottom: 1px solid #e2e9ee;
    }

    .tile-icon {
      width: 52px;
      height: 52px;
      display: grid;
      place-items: center;
      color: var(--tile-accent, var(--amadeus-blue));
      background: #fff;
      border: 1px solid #cadce9;
      border-radius: 5px;
      box-shadow: 0 2px 5px rgba(0, 62, 119, 0.08);
    }

    .tile-icon svg {
      width: 30px;
      height: 30px;
      fill: none;
      stroke: currentColor;
      stroke-linecap: round;
      stroke-linejoin: round;
      stroke-width: 1.65;
    }

    .tile-code {
      color: #536a7b;
      font-size: 11px;
      font-weight: 750;
      letter-spacing: 0.085em;
      text-transform: uppercase;
    }

    .tile-content {
      display: flex;
      flex: 1;
      flex-direction: column;
      padding: 18px 19px 17px;
    }

    .tile-content h3 {
      margin: 0;
      color: #172531;
      font-size: 16px;
      font-weight: 700;
      line-height: 1.35;
    }

    .tile-content p {
      margin: 10px 0 18px;
      color: var(--text-soft);
      font-size: 12.5px;
      line-height: 1.52;
    }

    .tile-launch {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: auto;
      padding-top: 13px;
      color: var(--amadeus-blue-dark);
      border-top: 1px solid #e7ebee;
      font-size: 12px;
      font-weight: 750;
    }

    .tile-launch svg {
      width: 17px;
      height: 17px;
      fill: none;
      stroke: currentColor;
      stroke-linecap: round;
      stroke-linejoin: round;
      stroke-width: 2;
      transition: transform var(--transition);
    }

    .app-tile:hover .tile-launch svg {
      transform: translateX(3px);
    }

    .empty-state {
      grid-column: 1 / -1;
      min-height: 245px;
      display: none;
      place-items: center;
      padding: 30px;
      color: var(--text-soft);
      text-align: center;
      background: #fff;
      border: 1px dashed var(--border-strong);
      border-radius: 5px;
    }

    .empty-state.visible {
      display: grid;
    }

    .empty-state svg {
      width: 38px;
      height: 38px;
      margin-bottom: 12px;
      fill: none;
      stroke: var(--slate);
      stroke-width: 1.5;
    }

    .empty-state strong {
      display: block;
      margin-bottom: 5px;
      color: var(--text);
      font-size: 15px;
    }

    .loading-overlay,
    .modal-layer {
      position: fixed;
      z-index: 100;
      inset: 0;
      display: grid;
      place-items: center;
      padding: 22px;
      opacity: 0;
      visibility: hidden;
      transition:
        opacity 160ms ease,
        visibility 160ms ease;
    }

    .loading-overlay {
      color: #fff;
      background: rgba(0, 38, 74, 0.88);
      backdrop-filter: blur(4px);
    }

    .loading-overlay.visible,
    .modal-layer.visible {
      opacity: 1;
      visibility: visible;
    }

    .loading-card {
      width: min(410px, 100%);
      padding: 34px 30px 30px;
      text-align: center;
      background: rgba(0, 57, 109, 0.94);
      border: 1px solid rgba(255, 255, 255, 0.28);
      border-radius: 6px;
      box-shadow: 0 22px 50px rgba(0, 15, 28, 0.34);
    }

    .spinner {
      width: 46px;
      height: 46px;
      margin: 0 auto 22px;
      border: 4px solid rgba(255, 255, 255, 0.27);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 700ms linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .loading-card h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 650;
    }

    .loading-app-name {
      min-height: 38px;
      margin: 8px auto 15px;
      color: rgba(255, 255, 255, 0.84);
      font-size: 13px;
      line-height: 1.45;
    }

    .loading-progress {
      height: 3px;
      overflow: hidden;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 4px;
    }

    .loading-progress span {
      display: block;
      width: 35%;
      height: 100%;
      background: #fff;
    }

    .loading-overlay.visible .loading-progress span {
      animation: progress 1200ms ease-in-out infinite;
    }

    @keyframes progress {
      from { transform: translateX(-100%); }
      to { transform: translateX(290%); }
    }

    .modal-layer {
      z-index: 110;
      background: rgba(22, 37, 49, 0.53);
      backdrop-filter: blur(2px);
    }

    .modal-card {
      width: min(470px, 100%);
      overflow: hidden;
      background: #fff;
      border: 1px solid #acbac5;
      border-radius: 6px;
      box-shadow: 0 24px 56px rgba(20, 34, 45, 0.28);
      transform: translateY(8px) scale(0.985);
      transition: transform 180ms ease;
    }

    .modal-layer.visible .modal-card {
      transform: translateY(0) scale(1);
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 18px;
      background: var(--surface-subtle);
      border-bottom: 1px solid var(--border);
    }

    .modal-header h2 {
      margin: 0;
      font-size: 16px;
      font-weight: 700;
    }

    .modal-close {
      width: 30px;
      height: 30px;
      display: grid;
      place-items: center;
      padding: 0;
      color: var(--slate);
      background: transparent;
      border: 0;
      border-radius: 3px;
      font-size: 23px;
      line-height: 1;
      cursor: pointer;
    }

    .modal-close:hover {
      color: var(--text);
      background: #e6ebee;
    }

    .modal-body {
      padding: 22px 20px 20px;
    }

    .modal-status {
      display: flex;
      align-items: flex-start;
      gap: 13px;
    }

    .modal-status-icon {
      width: 39px;
      height: 39px;
      display: grid;
      flex: 0 0 auto;
      place-items: center;
      color: var(--success);
      background: var(--success-soft);
      border: 1px solid #b8dfc9;
      border-radius: 50%;
    }

    .modal-status-icon svg {
      width: 20px;
      height: 20px;
      fill: none;
      stroke: currentColor;
      stroke-linecap: round;
      stroke-linejoin: round;
      stroke-width: 2.2;
    }

    .modal-message {
      margin: 0;
      color: var(--text);
      font-size: 14px;
      line-height: 1.55;
    }

    .modal-message strong {
      display: block;
      margin-bottom: 3px;
      font-size: 15px;
    }

    .session-details {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      margin-top: 20px;
      padding: 13px;
      gap: 12px;
      background: var(--surface-subtle);
      border: 1px solid var(--border);
      border-radius: 4px;
    }

    .session-details span {
      display: block;
      color: var(--slate);
      font-size: 10px;
      font-weight: 650;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }

    .session-details strong {
      display: block;
      margin-top: 4px;
      color: var(--text);
      font-size: 12px;
      overflow-wrap: anywhere;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      padding: 13px 18px;
      gap: 9px;
      background: var(--surface-subtle);
      border-top: 1px solid var(--border);
    }

    .button {
      min-height: 35px;
      padding: 0 15px;
      border: 1px solid transparent;
      border-radius: 3px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      transition:
        color var(--transition),
        background var(--transition),
        border-color var(--transition);
    }

    .button-primary {
      color: #fff;
      background: var(--amadeus-blue);
      border-color: var(--amadeus-blue);
    }

    .button-primary:hover {
      background: var(--amadeus-blue-dark);
      border-color: var(--amadeus-blue-dark);
    }

    .button-secondary {
      color: var(--text);
      background: #fff;
      border-color: var(--border-strong);
    }

    .button-secondary:hover {
      background: #edf1f3;
    }

    .toast-region {
      position: fixed;
      z-index: 160;
      right: 22px;
      bottom: 22px;
      width: min(360px, calc(100% - 44px));
      display: grid;
      gap: 10px;
      pointer-events: none;
    }

    .toast {
      display: flex;
      align-items: flex-start;
      padding: 13px 14px;
      gap: 11px;
      color: #fff;
      background: #263844;
      border-left: 4px solid #69c594;
      border-radius: 4px;
      box-shadow: 0 13px 30px rgba(20, 34, 45, 0.25);
      opacity: 0;
      pointer-events: auto;
      transform: translateY(12px);
      animation: toast-in 220ms ease forwards;
    }

    @keyframes toast-in {
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .toast svg {
      width: 18px;
      height: 18px;
      flex: 0 0 auto;
      fill: none;
      stroke: #8ee0b2;
      stroke-width: 2;
    }

    .toast p {
      margin: 0;
      font-size: 12px;
      line-height: 1.45;
    }

    .toast strong {
      display: block;
      margin-bottom: 2px;
      font-size: 13px;
    }

    .sr-only {
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      padding: 0 !important;
      margin: -1px !important;
      overflow: hidden !important;
      clip: rect(0, 0, 0, 0) !important;
      white-space: nowrap !important;
      border: 0 !important;
    }

    body.modal-open {
      overflow: hidden;
    }

    @media (max-width: 1080px) {
      .app-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (max-width: 850px) {
      .main-workspace {
        width: min(100% - 30px, 760px);
        padding-top: 28px;
      }
    }

    @media (max-width: 680px) {
      .main-workspace {
        width: min(100% - 24px, 580px);
        padding: 24px 0 40px;
      }
      .workspace-intro {
        display: block;
      }
      .workspace-intro h1 {
        font-size: 27px;
      }
      .panel-toolbar {
        align-items: stretch;
        flex-direction: column;
        padding: 14px;
        gap: 12px;
      }
      .app-search {
        width: 100%;
        flex-basis: auto;
      }
      .panel-controls { width: 100%; }
      .panel-controls .app-search { flex: 1; min-width: 0; }
      .app-grid {
        grid-template-columns: 1fr;
        padding: 14px;
        gap: 13px;
      }
      .app-tile {
        min-height: 228px;
      }
    }

    @media (max-width: 440px) {
      .workspace-intro p {
        font-size: 13px;
      }
      .session-details {
        grid-template-columns: 1fr;
      }
      .modal-actions {
        flex-direction: column-reverse;
      }
      .modal-actions .button {
        width: 100%;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      *,
      *::before,
      *::after {
        scroll-behavior: auto !important;
        animation-duration: 1ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 1ms !important;
      }
    }
  </style>
</head>
<body>

  <!-- =========================================
       SKANDI ALTEA WORKSPACE PAGE CONTENT
       ========================================= -->
  <div class="page-shell" id="applicationRoot">
    <main class="main-workspace">
      <section class="workspace-intro" aria-labelledby="pageTitle">
        <div>
          <h1 id="pageTitle">Application Launchpad</h1>
          <p>
            Select an authorized SKANDI ALTEA application.
          </p>
        </div>
      </section>

      <section class="launchpad-panel" aria-labelledby="applicationsHeading">
        <div class="panel-toolbar">
          <div class="panel-heading">
            <h2 id="applicationsHeading">Authorized applications</h2>
            <span id="applicationCount">Loading authorized applications…</span>
          </div>
          <div class="panel-controls">
          <div class="app-search">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="10.5" cy="10.5" r="6.5"></circle>
              <path d="m15.5 15.5 5 5"></path>
            </svg>
            <label class="sr-only" for="appSearch">Find an application</label>
            <input
              id="appSearch"
              type="search"
              placeholder="Find an application"
              autocomplete="off"
              spellcheck="false"
            >
            <button class="clear-search" id="clearSearch" type="button" aria-label="Clear search">
              ×
            </button>
          </div>
          <button class="button button-secondary" id="refreshApps" type="button">Refresh</button>
          </div>
        </div>

        <div class="app-grid" id="appGrid" aria-live="polite"></div>
      </section>
    </main>
  </div>

  <div
    class="loading-overlay"
    id="loadingOverlay"
    role="status"
    aria-live="assertive"
    aria-hidden="true"
  >
    <div class="loading-card">
      <div class="spinner" aria-hidden="true"></div>
      <h2>Opening application…</h2>
      <p class="loading-app-name" id="loadingAppName">
        Establishing secure connection...
      </p>
      <div class="loading-progress" aria-hidden="true"><span></span></div>
    </div>
  </div>

  <div
    class="modal-layer"
    id="dialogLayer"
    role="dialog"
    aria-modal="true"
    aria-labelledby="dialogTitle"
    aria-hidden="true"
  >
    <div class="modal-card">
      <div class="modal-header">
        <h2 id="dialogTitle">Secure session ready</h2>
        <button class="modal-close" id="dialogClose" type="button" aria-label="Close dialog">×</button>
      </div>
      <div class="modal-body" id="dialogBody"></div>
      <div class="modal-actions" id="dialogActions"></div>
    </div>
  </div>

  <div class="toast-region" id="toastRegion" aria-live="polite"></div>

  <script>
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
  </script>
</body>
</html>
```
