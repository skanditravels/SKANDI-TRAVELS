# INFO

| Field | Value |
| --- | --- |
| Code identity | SKANDI Success Factors v12 |
| System | RIAINTRA / Success Factors |
| Route | `/riaintra/success-factors` |
| Wix page | `src/pages/Success Factors.sh6tw.js` |
| Wix HTML component | `#staffHrEmbed` |
| Complete embed | `embeds/Success-Factors.html`; identical HTML is reproduced below |
| Backend facade | `backend/SKANDI_CORE/orgStructure.web` |
| Canonical core | `backend/SKANDI_CORE/orgStructure` |
| Shared dependencies | `staffAuth`, `supabaseServer`, `platformValidation`, `platformErrors`, `platformAudit`, `platformCache`, `public/siteMap` |
| Source pin | `skanditravels/SKANDI-TRAVELS` at `907c2a9e1fc17852844d7e6e0cd292997d3bcdc1`, latest supplied B-011.32 embed and preserved release-01 repairs |
| Data ownership | Existing `agent_users`, organization/HR and recruiting records. Dashboard news: `intranet_news`. Assigned tasks: `career_onboarding_tasks`. Preferences: additive `agent_users.payload.successFactors.portal`. Payroll and roster remain outside this core. |
| Authentication | Existing Wix member session and canonical staff authorization. Employee mutations bind to the authenticated staff ID; management writes retain HR-manage checks. Read-only staff projections exclude private HR fields. |
| Parent message source | `SKANDI_WIX_PARENT` |
| Accepted child sources | `SKANDI_HR_STAFF`, `SKANDI_SUCCESSFACTORS` |
| Dashboard actions | `INTRANET_TASK_COMPLETE`, `INTRANET_TASK_DISMISS`, `INTRANET_FAVORITES_UPDATE`, `INTRANET_NOTIFICATIONS_READ` |
| Responses | Existing `INTRANET_BOOTSTRAP`, with additive `partial`, `action` and `requestId` for saves; existing `INTRANET_ERROR` carries correlated failures. Other existing HR and navigation contracts are retained. |
| Latest web-method source inspection | Git `102e6077d900eb9ef7ac29b13caa8b622cbcf6bd`; published revision 1158 has an empty HR proxy. Intended repair: direct `Permissions.SiteMember` on all 37 methods; live rebuild pending. |
| Verification | 31 controlled checks passed on 2026-10-05. Live Wix, database-write and browser verification remain required. |

# LOG

1. Inherited baseline: canonical B-011.30 HR service contracts and the user's complete B-011.32 embed. Earlier release dates are not asserted here.
2. 2026-10-05 — v12 connection repair: canonical dashboard bootstrap, persisted actions, acknowledged/rollback-safe UI, confirmed Wix sign-out and directory-safe HR read access. Preserved the supplied CSS and existing functions/exports. Preserved prior release-01 shared transport allowlist and internal-chrome height repairs.
3. 2026-10-05 — source and controlled integration verification: 19 backend/page/source checks plus 12 full-embed-script checks passed. Read-only schema inspection completed. No production deployment, live database writes or real-browser validation performed.

4. 2026-10-05 — v12 staff-auth cache repair: inspected Git commit `8a3e5dd90d455e9ca6039e492272bf2dbf3d619e` stores the audit module in `src/backend/SKANDI_CORE/platformCache.js`, omitting `TtlCache` and preventing `staffAuth.web.js` from loading. Restore the existing cache implementation from Git blob `38e8b712cecdae09ed16e347d2a3e4f0e750d826` at commit `907c2a9e1fc17852844d7e6e0cd292997d3bcdc1`. Only this runtime file changes; the HTML and authentication contracts stay intact. Eight controlled checks pass, including reproducing the failure and loading the repaired dependency chain with Wix services stubbed. REQUIRES LIVE TEST for Wix deployment and authenticated sessions. No deployed or database changes were performed.

5. 2026-10-05 — v12 Success Factors web-method repair: published revision 1158 bundles the `orgStructure.web` import as an empty module; the actual published page reproduces `getOrgStructureBootstrap is not a function` before any backend request. Current Git commit `102e6077d900eb9ef7ac29b13caa8b622cbcf6bd` already declares the 37 methods and includes the previous cache fix. Replace the local `MEMBER` permission alias with direct `Permissions.SiteMember` arguments on all 37 exports, following Wix’s documented shape and the working staff-auth facade. All existing names, core mappings, permissions and HTML are retained. Eight checks pass, including published-bundle failure reproduction and controlled delegation tests. The alias is a suspected compiler-recognition trigger; its causality and the repaired proxy require a live Wix rebuild. No deployment or database change performed.

# COMPLETE HTML

This reference is documentation, not a runtime import. Install the HTML below into the existing `#staffHrEmbed` component.


```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#ffffff">
  <title>SAP SuccessFactors · SKANDI · v12</title>
  <style>
    /* =========================================================
       SUCCESSFACTORS V9 LOCAL APPLICATION VARIABLES & STYLES
       ========================================================= */
    :root {
      --bg-shell: #354a5f;
      --text-inverse: #ffffff;
      --shadow-sm: 0 1px 2px rgba(34, 54, 73, 0.12);
      --radius-sm: 0.375rem;
      --amadeus-shell-height: 0px;

      /* SAP Fiori Morning Horizon-inspired design tokens */
      --sap-blue: #0070f2;
      --sap-blue-hover: #0057d2;
      --sap-blue-pressed: #0040b0;
      --sap-blue-soft: #eaf3fc;
      --sap-shell: #ffffff;
      --sap-canvas: #f3f4f5;
      --sap-card: #ffffff;
      --sap-text: #1d2d3e;
      --sap-text-soft: #556b82;
      --sap-text-muted: #6a7d8f;
      --sap-border: #d5dadd;
      --sap-border-soft: #e8eaed;
      --sap-success: #188918;
      --sap-success-bg: #f1fdf1;
      --sap-warning: #e76500;
      --sap-warning-bg: #fff8d6;
      --sap-error: #b00;
      --sap-error-bg: #ffeaf4;
      --sap-info: #0057d2;
      --sap-info-bg: #eaf3fc;
      --sap-shadow-1: 0 1px 3px rgba(34, 53, 72, 0.12);
      --sap-shadow-2: 0 6px 16px rgba(34, 53, 72, 0.16);
      --sap-shadow-3: 0 12px 32px rgba(34, 53, 72, 0.22);
      --radius-sm-sap: 6px;
      --radius-md: 10px;
      --radius-lg: 16px;
      --radius-xl: 22px;
      --shell-height: 0px;
      --nav-height: 46px;
      --page-width: 1440px;
      --font-sans: "72", "72full", Inter, Arial, Helvetica, sans-serif;
    }

    * {
      box-sizing: border-box;
    }

    html {
      scroll-behavior: smooth;
      background: var(--sap-canvas);
    }

    body {
      margin: 0;
      min-width: 320px;
      color: var(--sap-text);
      background: var(--sap-canvas);
      font-family: var(--font-sans);
      font-size: 14px;
      line-height: 1.45;
      -webkit-font-smoothing: antialiased;
      text-rendering: optimizeLegibility;
      padding-top: 0;
    }

    /* =========================================================
       SAP SUCCESSFACTORS STYLES
       ========================================================= */
    body.modal-open {
      overflow: hidden;
    }

    button,
    input,
    select,
    textarea {
      font: inherit;
    }

    button {
      color: inherit;
    }

    button,
    [role="button"] {
      -webkit-tap-highlight-color: transparent;
    }

    a {
      color: var(--sap-blue-hover);
    }

    svg {
      display: block;
      flex: 0 0 auto;
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

    :focus-visible {
      outline: 2px solid var(--sap-blue);
      outline-offset: 2px;
    }

    .icon-button {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      padding: 0;
      color: #354a5f;
      background: transparent;
      border: 0;
      border-radius: 50%;
      cursor: pointer;
      transition: background-color 150ms ease, color 150ms ease, transform 150ms ease;
    }

    .icon-button:hover {
      color: var(--sap-blue-hover);
      background: #eef0f2;
    }

    .icon-button:active {
      transform: scale(0.95);
    }

    .primary-button,
    .secondary-button,
    .ghost-button,
    .semantic-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 36px;
      gap: 7px;
      padding: 0 15px;
      border-radius: 8px;
      font-weight: 700;
      cursor: pointer;
      transition: background-color 150ms ease, border-color 150ms ease, color 150ms ease, transform 150ms ease;
    }

    .primary-button {
      color: #fff;
      background: var(--sap-blue);
      border: 1px solid var(--sap-blue);
    }

    .primary-button:hover {
      background: var(--sap-blue-hover);
      border-color: var(--sap-blue-hover);
    }

    .primary-button:active,
    .secondary-button:active,
    .ghost-button:active,
    .semantic-button:active {
      transform: translateY(1px);
    }

    .secondary-button {
      color: var(--sap-blue-hover);
      background: #fff;
      border: 1px solid var(--sap-blue-hover);
    }

    .secondary-button:hover {
      background: var(--sap-blue-soft);
    }

    .ghost-button {
      color: var(--sap-blue-hover);
      background: transparent;
      border: 1px solid transparent;
    }

    .ghost-button:hover {
      background: var(--sap-blue-soft);
    }

    .semantic-button.success {
      color: #fff;
      background: var(--sap-success);
      border: 1px solid var(--sap-success);
    }

    .semantic-button.danger {
      color: var(--sap-error);
      background: #fff;
      border: 1px solid var(--sap-error);
    }

    /* =========================================================
       SuccessFactors local navigation (global RIAINTRA chrome is masterPage-owned)
       ========================================================= */
    .shell-bar {
      position: sticky;
      z-index: 100;
      top: var(--amadeus-shell-height); /* Sits right beneath Amadeus Header */
      display: flex;
      align-items: center;
      height: var(--shell-height);
      padding: 0 14px 0 12px;
      background: var(--sap-shell);
      border-bottom: 1px solid #cbd2d8;
      box-shadow: 0 1px 4px rgba(34, 53, 72, 0.10);
    }

    .shell-left,
    .shell-right {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .shell-left {
      min-width: 255px;
    }

    .shell-center {
      display: flex;
      justify-content: center;
      flex: 1;
      min-width: 100px;
      padding: 0 18px;
    }

    .shell-right {
      justify-content: flex-end;
      min-width: 255px;
    }

    .sap-logo {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 47px;
      height: 25px;
      margin-right: 8px;
      overflow: hidden;
      color: #fff;
      background: linear-gradient(135deg, #0a8ae8, #0070c0);
      clip-path: polygon(0 0, 100% 0, 78% 100%, 0 100%);
      font-size: 13px;
      font-weight: 900;
      font-style: italic;
      letter-spacing: -0.8px;
    }

    .shell-title {
      max-width: 190px;
      overflow: hidden;
      color: #223548;
      font-size: 16px;
      font-weight: 700;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .shell-product {
      margin-left: 5px;
      color: var(--sap-text-muted);
      font-size: 12px;
      white-space: nowrap;
    }

    .global-search {
      position: relative;
      width: min(560px, 100%);
    }

    .global-search > svg {
      position: absolute;
      z-index: 2;
      top: 50%;
      left: 13px;
      color: #556b82;
      transform: translateY(-50%);
      pointer-events: none;
    }

    .global-search input {
      width: 100%;
      height: 34px;
      padding: 0 42px 0 40px;
      color: var(--sap-text);
      background: #f5f6f7;
      border: 1px solid #8996a5;
      border-radius: 18px;
      outline: none;
      transition: background 150ms ease, border-color 150ms ease, box-shadow 150ms ease;
    }

    .global-search input::placeholder {
      color: #5b738b;
    }

    .global-search input:focus {
      background: #fff;
      border-color: var(--sap-blue);
      box-shadow: 0 0 0 1px var(--sap-blue);
    }

    .search-shortcut {
      position: absolute;
      top: 50%;
      right: 10px;
      padding: 1px 5px;
      color: #647789;
      background: #fff;
      border: 1px solid #c5cbd0;
      border-radius: 4px;
      font-size: 10px;
      transform: translateY(-50%);
      pointer-events: none;
    }

    .mobile-search-trigger {
      display: none;
    }

    .notification-dot {
      position: absolute;
      top: 4px;
      right: 4px;
      width: 9px;
      height: 9px;
      background: #d20a0a;
      border: 2px solid #fff;
      border-radius: 50%;
    }

    .avatar-button {
      display: inline-flex;
      align-items: center;
      min-width: 38px;
      height: 38px;
      gap: 7px;
      padding: 2px 5px 2px 2px;
      background: transparent;
      border: 0;
      border-radius: 20px;
      cursor: pointer;
    }

    .avatar-button:hover {
      background: #eef0f2;
    }

    .avatar {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      width: 32px;
      height: 32px;
      color: #fff;
      background: linear-gradient(135deg, #046c7a, #034c58);
      border-radius: 50%;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.3px;
    }

    .avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      border-radius: inherit;
    }

    .avatar-copy {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      max-width: 120px;
      line-height: 1.1;
    }

    .avatar-copy strong,
    .avatar-copy span {
      overflow: hidden;
      max-width: 100%;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .avatar-copy strong {
      color: #223548;
      font-size: 12px;
    }

    .avatar-copy span {
      margin-top: 2px;
      color: #5b738b;
      font-size: 10px;
    }

    .shell-popover {
      position: fixed;
      z-index: 300;
      top: calc(44px + var(--amadeus-shell-height));
      right: 14px;
      width: min(380px, calc(100vw - 24px));
      overflow: hidden;
      background: #fff;
      border: 1px solid var(--sap-border);
      border-radius: 12px;
      box-shadow: var(--sap-shadow-3);
      transform-origin: top right;
      animation: popIn 150ms ease;
    }

    .popover-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      min-height: 53px;
      padding: 0 15px;
      border-bottom: 1px solid var(--sap-border-soft);
    }

    .popover-head h3 {
      margin: 0;
      font-size: 16px;
    }

    .notification-list {
      max-height: 390px;
      overflow: auto;
    }

    .notification-item {
      display: grid;
      grid-template-columns: 36px 1fr auto;
      gap: 11px;
      padding: 13px 15px;
      background: #fff;
      border-bottom: 1px solid var(--sap-border-soft);
    }

    .notification-item.unread {
      background: #f5f9fd;
    }

    .notification-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 34px;
      height: 34px;
      color: var(--sap-blue-hover);
      background: var(--sap-blue-soft);
      border-radius: 50%;
    }

    .notification-copy strong {
      display: block;
      margin-bottom: 3px;
      font-size: 13px;
    }

    .notification-copy p,
    .notification-copy span {
      margin: 0;
      color: var(--sap-text-soft);
      font-size: 12px;
    }

    .notification-time {
      color: var(--sap-text-muted);
      font-size: 10px;
      white-space: nowrap;
    }

    .profile-popover {
      width: min(320px, calc(100vw - 24px));
    }

    .profile-card {
      display: grid;
      grid-template-columns: 54px 1fr;
      gap: 13px;
      padding: 18px;
      background: linear-gradient(135deg, #f4f9ff, #fff);
      border-bottom: 1px solid var(--sap-border-soft);
    }

    .profile-card .avatar {
      width: 52px;
      height: 52px;
      font-size: 16px;
    }

    .profile-card h3 {
      margin: 2px 0 2px;
      font-size: 15px;
    }

    .profile-card p {
      margin: 0;
      color: var(--sap-text-soft);
      font-size: 12px;
    }

    .profile-menu-button {
      display: flex;
      align-items: center;
      width: 100%;
      min-height: 44px;
      gap: 11px;
      padding: 0 16px;
      color: #223548;
      background: #fff;
      border: 0;
      border-bottom: 1px solid var(--sap-border-soft);
      cursor: pointer;
    }

    .profile-menu-button:hover {
      color: var(--sap-blue-hover);
      background: #f5f9fd;
    }

    .top-nav {
      position: sticky;
      z-index: 90;
      top: calc(var(--shell-height) + var(--amadeus-shell-height));
      height: var(--nav-height);
      background: #fff;
      border-bottom: 1px solid var(--sap-border);
    }

    .top-nav-inner {
      display: flex;
      align-items: stretch;
      width: min(var(--page-width), 100%);
      height: 100%;
      margin: 0 auto;
      padding: 0 24px;
      overflow-x: auto;
      scrollbar-width: none;
    }

    .top-nav-inner::-webkit-scrollbar {
      display: none;
    }

    .nav-button {
      position: relative;
      display: inline-flex;
      align-items: center;
      min-width: max-content;
      gap: 7px;
      padding: 0 17px;
      color: #354a5f;
      background: transparent;
      border: 0;
      cursor: pointer;
      font-weight: 600;
    }

    .nav-button::after {
      position: absolute;
      right: 12px;
      bottom: 0;
      left: 12px;
      height: 3px;
      content: "";
      background: transparent;
      border-radius: 2px 2px 0 0;
    }

    .nav-button:hover {
      color: var(--sap-blue-hover);
      background: #f5f9fd;
    }

    .nav-button.active {
      color: var(--sap-blue-hover);
      font-weight: 800;
    }

    .nav-button.active::after {
      background: var(--sap-blue);
    }

    /* =========================================================
       Page shell and shared sections
       ========================================================= */
    .page {
      width: min(var(--page-width), 100%);
      min-height: calc(100vh - var(--shell-height) - var(--nav-height) - var(--amadeus-shell-height));
      margin: 0 auto;
      padding: 24px 24px 94px;
      animation: pageIn 220ms ease;
    }

    .page-header {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 18px;
      margin-bottom: 22px;
    }

    .page-header-copy {
      min-width: 0;
    }

    .eyebrow {
      display: flex;
      align-items: center;
      min-height: 18px;
      gap: 6px;
      margin: 0 0 5px;
      color: var(--sap-blue-hover);
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .page-title {
      margin: 0;
      color: #102a43;
      font-size: clamp(26px, 4vw, 36px);
      font-weight: 800;
      letter-spacing: -0.025em;
      line-height: 1.14;
    }

    .page-subtitle {
      max-width: 720px;
      margin: 7px 0 0;
      color: var(--sap-text-soft);
      font-size: 15px;
    }

    .page-actions {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
    }

    .role-pill {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      min-height: 32px;
      padding: 0 11px;
      color: #046c7a;
      background: #e2f4f6;
      border: 1px solid #b6e0e4;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 800;
    }

    .section {
      margin-top: 28px;
    }

    .section:first-child {
      margin-top: 0;
    }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      min-height: 42px;
      gap: 14px;
      margin-bottom: 10px;
    }

    .section-title-group h2 {
      margin: 0;
      color: #223548;
      font-size: 20px;
      letter-spacing: -0.01em;
    }

    .section-title-group p {
      margin: 3px 0 0;
      color: var(--sap-text-soft);
      font-size: 13px;
    }

    .section-controls {
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .text-button {
      display: inline-flex;
      align-items: center;
      min-height: 34px;
      gap: 5px;
      padding: 0 9px;
      color: var(--sap-blue-hover);
      background: transparent;
      border: 0;
      border-radius: 7px;
      cursor: pointer;
      font-weight: 700;
    }

    .text-button:hover {
      background: var(--sap-blue-soft);
    }

    .card {
      background: var(--sap-card);
      border: 1px solid var(--sap-border);
      border-radius: var(--radius-lg);
      box-shadow: var(--sap-shadow-1);
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      min-height: 23px;
      gap: 5px;
      padding: 0 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 800;
      white-space: nowrap;
    }

    .status-badge.info {
      color: var(--sap-info);
      background: var(--sap-info-bg);
    }

    .status-badge.success {
      color: var(--sap-success);
      background: var(--sap-success-bg);
    }

    .status-badge.warning {
      color: #8d2a00;
      background: var(--sap-warning-bg);
    }

    .status-badge.error {
      color: var(--sap-error);
      background: var(--sap-error-bg);
    }

    .status-badge.neutral {
      color: #475e75;
      background: #edf0f2;
    }

    /* =========================================================
       Home: hero / news carousel
       ========================================================= */
    .hero-card {
      position: relative;
      display: grid;
      grid-template-columns: minmax(0, 1.3fr) minmax(280px, 0.7fr);
      min-height: 320px;
      overflow: hidden;
      color: #fff;
      background: linear-gradient(118deg, #003b7a 0%, #0057d2 48%, #0a8be6 100%);
      border: 0;
      border-radius: var(--radius-xl);
      box-shadow: 0 12px 30px rgba(0, 61, 130, 0.22);
    }

    .hero-card.theme-teal {
      background: linear-gradient(118deg, #073f47 0%, #046c7a 54%, #0aa6a6 100%);
    }

    .hero-card.theme-indigo {
      background: linear-gradient(118deg, #2b2d75 0%, #4f46ad 54%, #8077d9 100%);
    }

    .hero-card.theme-amber {
      background: linear-gradient(118deg, #6b3500 0%, #b95c00 54%, #e28b16 100%);
    }

    .hero-card.theme-slate {
      background: linear-gradient(118deg, #1c3347 0%, #315a78 54%, #5689a8 100%);
    }

    .hero-copy {
      position: relative;
      z-index: 2;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      justify-content: center;
      max-width: 780px;
      padding: 38px 40px 52px;
    }

    .hero-label {
      display: inline-flex;
      align-items: center;
      min-height: 25px;
      gap: 6px;
      margin-bottom: 15px;
      padding: 0 9px;
      color: #fff;
      background: rgba(255, 255, 255, 0.17);
      border: 1px solid rgba(255, 255, 255, 0.28);
      border-radius: 13px;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      backdrop-filter: blur(8px);
    }

    .hero-copy h2 {
      max-width: 720px;
      margin: 0;
      color: #fff;
      font-size: clamp(28px, 4vw, 42px);
      font-weight: 800;
      letter-spacing: -0.03em;
      line-height: 1.08;
    }

    .hero-copy p {
      max-width: 640px;
      margin: 14px 0 20px;
      color: rgba(255, 255, 255, 0.92);
      font-size: 15px;
      line-height: 1.55;
    }

    .hero-meta {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px 15px;
      margin-bottom: 20px;
      color: rgba(255, 255, 255, 0.80);
      font-size: 12px;
    }

    .hero-meta span {
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }

    .hero-cta {
      display: inline-flex;
      align-items: center;
      min-height: 38px;
      gap: 7px;
      padding: 0 16px;
      color: #0b4f94;
      background: #fff;
      border: 1px solid #fff;
      border-radius: 8px;
      font-weight: 800;
      cursor: pointer;
      transition: transform 150ms ease, box-shadow 150ms ease;
    }

    .hero-cta:hover {
      box-shadow: 0 5px 14px rgba(0, 0, 0, 0.22);
      transform: translateY(-1px);
    }

    .hero-art {
      position: relative;
      min-height: 260px;
      overflow: hidden;
    }

    .hero-art::before,
    .hero-art::after {
      position: absolute;
      content: "";
      border: 1px solid rgba(255, 255, 255, 0.23);
      border-radius: 50%;
    }

    .hero-art::before {
      top: -80px;
      right: -75px;
      width: 330px;
      height: 330px;
      box-shadow: 0 0 0 42px rgba(255, 255, 255, 0.05), 0 0 0 84px rgba(255, 255, 255, 0.035);
    }

    .hero-art::after {
      right: 80px;
      bottom: -120px;
      width: 270px;
      height: 270px;
      background: rgba(255, 255, 255, 0.055);
    }

    .hero-art-icon {
      position: absolute;
      z-index: 2;
      top: 50%;
      left: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 156px;
      height: 156px;
      color: #fff;
      background: rgba(255, 255, 255, 0.14);
      border: 1px solid rgba(255, 255, 255, 0.28);
      border-radius: 36px;
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.15);
      transform: translate(-50%, -50%) rotate(-5deg);
      backdrop-filter: blur(10px);
    }

    .hero-art-icon svg {
      transform: rotate(5deg);
    }

    .hero-controls {
      position: absolute;
      z-index: 3;
      right: 20px;
      bottom: 15px;
      left: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
    }

    .hero-arrow {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      color: #fff;
      background: rgba(10, 33, 55, 0.28);
      border: 1px solid rgba(255, 255, 255, 0.28);
      border-radius: 50%;
      cursor: pointer;
      backdrop-filter: blur(6px);
    }

    .hero-arrow:hover {
      background: rgba(10, 33, 55, 0.50);
    }

    .hero-dots {
      display: flex;
      align-items: center;
      gap: 6px;
      margin: 0 8px;
    }

    .hero-dot {
      width: 8px;
      height: 8px;
      padding: 0;
      background: rgba(255, 255, 255, 0.48);
      border: 0;
      border-radius: 5px;
      cursor: pointer;
      transition: width 150ms ease, background 150ms ease;
    }

    .hero-dot.active {
      width: 22px;
      background: #fff;
    }

    /* =========================================================
       Home: quick actions, to-dos, launchpad tiles
       ========================================================= */
    .quick-actions-card {
      display: flex;
      align-items: stretch;
      gap: 2px;
      padding: 7px;
      overflow-x: auto;
      background: #fff;
      border: 1px solid var(--sap-border);
      border-radius: var(--radius-lg);
      box-shadow: var(--sap-shadow-1);
      scrollbar-width: thin;
    }

    .quick-action {
      display: flex;
      align-items: center;
      min-width: 190px;
      flex: 1 0 190px;
      gap: 11px;
      padding: 12px;
      text-align: left;
      background: transparent;
      border: 0;
      border-radius: 10px;
      cursor: pointer;
      transition: background 150ms ease;
    }

    .quick-action:hover {
      background: var(--sap-blue-soft);
    }

    .quick-action-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 38px;
      height: 38px;
      color: var(--sap-blue-hover);
      background: var(--sap-blue-soft);
      border-radius: 10px;
    }

    .quick-action strong,
    .quick-action span {
      display: block;
    }

    .quick-action strong {
      color: #223548;
      font-size: 13px;
    }

    .quick-action span {
      margin-top: 2px;
      color: var(--sap-text-soft);
      font-size: 11px;
    }

    .horizontal-scroller-wrap {
      position: relative;
    }

    .horizontal-scroller {
      display: grid;
      grid-auto-columns: minmax(290px, 340px);
      grid-auto-flow: column;
      gap: 12px;
      padding: 2px 2px 10px;
      overflow-x: auto;
      overscroll-behavior-inline: contain;
      scroll-snap-type: inline proximity;
      scrollbar-color: #a9b4be transparent;
      scrollbar-width: thin;
    }

    .todo-card {
      position: relative;
      display: flex;
      min-height: 176px;
      flex-direction: column;
      padding: 17px;
      overflow: hidden;
      text-align: left;
      background: #fff;
      border: 1px solid var(--sap-border);
      border-radius: var(--radius-lg);
      box-shadow: var(--sap-shadow-1);
      scroll-snap-align: start;
      transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease;
    }

    .todo-card::before {
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      width: 4px;
      content: "";
      background: var(--sap-blue);
    }

    .todo-card.priority-high::before {
      background: var(--sap-error);
    }

    .todo-card.priority-medium::before {
      background: var(--sap-warning);
    }

    .todo-card:hover {
      border-color: #a8b4c0;
      box-shadow: var(--sap-shadow-2);
      transform: translateY(-2px);
    }

    .todo-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 11px;
    }

    .todo-category {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: var(--sap-text-soft);
      font-size: 11px;
      font-weight: 700;
    }

    .todo-card h3 {
      margin: 0;
      color: #223548;
      font-size: 15px;
      line-height: 1.28;
    }

    .todo-card p {
      display: -webkit-box;
      margin: 7px 0 12px;
      overflow: hidden;
      color: var(--sap-text-soft);
      font-size: 12px;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
    }

    .todo-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-top: auto;
    }

    .todo-due {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      color: var(--sap-text-muted);
      font-size: 11px;
    }

    .todo-action {
      display: inline-flex;
      align-items: center;
      min-height: 31px;
      gap: 5px;
      padding: 0 10px;
      color: var(--sap-blue-hover);
      background: var(--sap-blue-soft);
      border: 0;
      border-radius: 7px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 800;
    }

    .todo-action:hover {
      color: #fff;
      background: var(--sap-blue);
    }

    .empty-card {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 160px;
      flex-direction: column;
      padding: 28px;
      color: var(--sap-text-soft);
      text-align: center;
      background: #fff;
      border: 1px dashed #b8c2cc;
      border-radius: var(--radius-lg);
    }

    .empty-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      margin-bottom: 10px;
      color: var(--sap-success);
      background: var(--sap-success-bg);
      border-radius: 50%;
    }

    .launchpad-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 13px;
    }

    .app-tile {
      position: relative;
      display: flex;
      min-height: 178px;
      flex-direction: column;
      padding: 17px;
      overflow: hidden;
      text-align: left;
      background: #fff;
      border: 1px solid var(--sap-border);
      border-radius: var(--radius-lg);
      box-shadow: var(--sap-shadow-1);
      cursor: pointer;
      transition: transform 170ms ease, box-shadow 170ms ease, border-color 170ms ease;
    }

    .app-tile.wide {
      grid-column: span 2;
    }

    .app-tile::after {
      position: absolute;
      right: -26px;
      bottom: -40px;
      width: 115px;
      height: 115px;
      content: "";
      background: var(--tile-soft, #eaf3fc);
      border-radius: 50%;
      opacity: 0.72;
    }

    .app-tile:hover {
      border-color: #a7b4c0;
      box-shadow: var(--sap-shadow-2);
      transform: translateY(-3px);
    }

    .app-tile:active {
      transform: translateY(-1px);
    }

    .tile-head {
      position: relative;
      z-index: 2;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 10px;
    }

    .tile-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 45px;
      height: 45px;
      color: var(--tile-color, var(--sap-blue-hover));
      background: var(--tile-soft, var(--sap-blue-soft));
      border-radius: 12px;
    }

    .favorite-button {
      position: relative;
      z-index: 4;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 30px;
      height: 30px;
      padding: 0;
      color: #647789;
      background: transparent;
      border: 0;
      border-radius: 50%;
      cursor: pointer;
    }

    .favorite-button:hover {
      color: #b25b00;
      background: #fff8d6;
    }

    .favorite-button.active {
      color: #b25b00;
    }

    .tile-copy {
      position: relative;
      z-index: 2;
      margin-top: 14px;
    }

    .tile-copy h3 {
      margin: 0;
      color: #223548;
      font-size: 16px;
      line-height: 1.2;
    }

    .tile-copy p {
      display: -webkit-box;
      margin: 5px 0 0;
      overflow: hidden;
      color: var(--sap-text-soft);
      font-size: 12px;
      line-height: 1.35;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
    }

    .tile-footer {
      position: relative;
      z-index: 2;
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 8px;
      margin-top: auto;
      padding-top: 12px;
    }

    .tile-metric {
      color: var(--tile-color, var(--sap-blue-hover));
      font-size: 21px;
      font-weight: 800;
      letter-spacing: -0.02em;
      line-height: 1;
    }

    .tile-metric small {
      display: block;
      margin-top: 4px;
      color: var(--sap-text-muted);
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0;
    }

    .tile-open {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      color: var(--sap-blue-hover);
      font-size: 11px;
      font-weight: 800;
    }

    /* =========================================================
       Inner pages: filters, lists, news and application view
       ========================================================= */
    .metric-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 12px;
      margin-bottom: 20px;
    }

    .metric-card {
      padding: 16px;
      background: #fff;
      border: 1px solid var(--sap-border);
      border-radius: 13px;
      box-shadow: var(--sap-shadow-1);
    }

    .metric-card-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      color: var(--sap-text-soft);
      font-size: 12px;
    }

    .metric-card strong {
      display: block;
      margin-top: 8px;
      color: #223548;
      font-size: 28px;
      letter-spacing: -0.03em;
    }

    .metric-trend {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      margin-top: 5px;
      color: var(--sap-success);
      font-size: 11px;
      font-weight: 700;
    }

    .toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 10px;
      margin-bottom: 12px;
      padding: 10px;
      background: #fff;
      border: 1px solid var(--sap-border);
      border-radius: 12px;
      box-shadow: var(--sap-shadow-1);
    }

    .filter-chips {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 6px;
    }

    .filter-chip {
      display: inline-flex;
      align-items: center;
      min-height: 32px;
      gap: 6px;
      padding: 0 11px;
      color: #354a5f;
      background: #fff;
      border: 1px solid #8996a5;
      border-radius: 17px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 700;
    }

    .filter-chip:hover {
      color: var(--sap-blue-hover);
      border-color: var(--sap-blue-hover);
    }

    .filter-chip.active {
      color: var(--sap-blue-hover);
      background: var(--sap-blue-soft);
      border-color: var(--sap-blue);
    }

    .inline-search {
      position: relative;
      width: min(320px, 100%);
    }

    .inline-search svg {
      position: absolute;
      top: 50%;
      left: 10px;
      color: var(--sap-text-muted);
      transform: translateY(-50%);
      pointer-events: none;
    }

    .inline-search input {
      width: 100%;
      height: 34px;
      padding: 0 11px 0 34px;
      color: var(--sap-text);
      background: #fff;
      border: 1px solid #8996a5;
      border-radius: 8px;
      outline: none;
    }

    .inline-search input:focus {
      border-color: var(--sap-blue);
      box-shadow: 0 0 0 1px var(--sap-blue);
    }

    .work-list {
      overflow: hidden;
      background: #fff;
      border: 1px solid var(--sap-border);
      border-radius: var(--radius-lg);
      box-shadow: var(--sap-shadow-1);
    }

    .work-row {
      display: grid;
      grid-template-columns: 44px minmax(0, 1.7fr) minmax(120px, 0.7fr) minmax(100px, 0.5fr) auto;
      align-items: center;
      gap: 14px;
      min-height: 76px;
      padding: 11px 15px;
      border-bottom: 1px solid var(--sap-border-soft);
    }

    .work-row:last-child {
      border-bottom: 0;
    }

    .work-row:hover {
      background: #f7f9fa;
    }

    .work-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 38px;
      height: 38px;
      color: var(--sap-blue-hover);
      background: var(--sap-blue-soft);
      border-radius: 10px;
    }

    .work-main strong,
    .work-main span {
      display: block;
    }

    .work-main strong {
      margin-bottom: 3px;
      color: #223548;
      font-size: 13px;
    }

    .work-main span,
    .work-meta {
      color: var(--sap-text-soft);
      font-size: 11px;
    }

    .work-row.completed .work-main strong {
      color: var(--sap-text-muted);
      text-decoration: line-through;
    }

    .work-actions {
      display: flex;
      justify-content: flex-end;
      gap: 6px;
    }

    .news-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 14px;
    }

    .news-card {
      display: flex;
      min-height: 285px;
      flex-direction: column;
      overflow: hidden;
      background: #fff;
      border: 1px solid var(--sap-border);
      border-radius: var(--radius-lg);
      box-shadow: var(--sap-shadow-1);
      transition: box-shadow 160ms ease, transform 160ms ease;
    }

    .news-card:hover {
      box-shadow: var(--sap-shadow-2);
      transform: translateY(-2px);
    }

    .news-visual {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 115px;
      color: #fff;
      background: linear-gradient(135deg, #0057d2, #0a8be6);
      overflow: hidden;
    }

    .news-visual.theme-teal {
      background: linear-gradient(135deg, #046c7a, #0aa6a6);
    }

    .news-visual.theme-indigo {
      background: linear-gradient(135deg, #4f46ad, #8077d9);
    }

    .news-visual.theme-amber {
      background: linear-gradient(135deg, #b95c00, #e28b16);
    }

    .news-visual.theme-slate {
      background: linear-gradient(135deg, #315a78, #5689a8);
    }

    .news-visual::after {
      position: absolute;
      top: -50px;
      right: -25px;
      width: 150px;
      height: 150px;
      content: "";
      border: 25px solid rgba(255, 255, 255, 0.08);
      border-radius: 50%;
    }

    .news-content {
      display: flex;
      flex: 1;
      flex-direction: column;
      padding: 16px;
    }

    .news-content h3 {
      margin: 8px 0 6px;
      color: #223548;
      font-size: 16px;
      line-height: 1.25;
    }

    .news-content p {
      display: -webkit-box;
      margin: 0 0 14px;
      overflow: hidden;
      color: var(--sap-text-soft);
      font-size: 12px;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 3;
    }

    .news-content .text-button {
      align-self: flex-start;
      margin-top: auto;
      margin-left: -9px;
    }

    .breadcrumb {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 5px;
      margin-bottom: 16px;
      color: var(--sap-text-soft);
      font-size: 12px;
    }

    .breadcrumb button {
      padding: 2px 3px;
      color: var(--sap-blue-hover);
      background: transparent;
      border: 0;
      border-radius: 4px;
      cursor: pointer;
    }

    .app-object-header {
      display: grid;
      grid-template-columns: 64px minmax(0, 1fr) auto;
      align-items: center;
      gap: 16px;
      margin-bottom: 18px;
      padding: 20px;
      background: #fff;
      border: 1px solid var(--sap-border);
      border-radius: var(--radius-lg);
      box-shadow: var(--sap-shadow-1);
    }

    .app-object-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 60px;
      height: 60px;
      color: var(--tile-color, var(--sap-blue-hover));
      background: var(--tile-soft, var(--sap-blue-soft));
      border-radius: 15px;
    }

    .app-object-copy h1 {
      margin: 0;
      color: #223548;
      font-size: 26px;
      letter-spacing: -0.02em;
    }

    .app-object-copy p {
      margin: 4px 0 0;
      color: var(--sap-text-soft);
    }

    .app-workspace {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 315px;
      gap: 14px;
    }

    .workspace-panel {
      overflow: hidden;
      background: #fff;
      border: 1px solid var(--sap-border);
      border-radius: var(--radius-lg);
      box-shadow: var(--sap-shadow-1);
    }

    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      min-height: 53px;
      gap: 10px;
      padding: 0 16px;
      border-bottom: 1px solid var(--sap-border-soft);
    }

    .panel-header h2 {
      margin: 0;
      font-size: 16px;
    }

    .data-table-wrap {
      overflow-x: auto;
    }

    .data-table {
      width: 100%;
      min-width: 680px;
      border-collapse: collapse;
    }

    .data-table th,
    .data-table td {
      padding: 12px 14px;
      text-align: left;
      border-bottom: 1px solid var(--sap-border-soft);
      white-space: nowrap;
    }

    .data-table th {
      color: #354a5f;
      background: #f7f9fa;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.02em;
    }

    .data-table td {
      color: #223548;
      font-size: 12px;
    }

    .data-table tbody tr:hover {
      background: #f5f9fd;
    }

    .side-list {
      padding: 7px;
    }

    .side-action {
      display: flex;
      align-items: center;
      width: 100%;
      min-height: 49px;
      gap: 10px;
      padding: 8px 10px;
      text-align: left;
      background: transparent;
      border: 0;
      border-radius: 9px;
      cursor: pointer;
    }

    .side-action:hover {
      color: var(--sap-blue-hover);
      background: var(--sap-blue-soft);
    }

    .side-action-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      color: var(--sap-blue-hover);
      background: var(--sap-blue-soft);
      border-radius: 8px;
    }

    .side-action strong,
    .side-action span {
      display: block;
    }

    .side-action strong {
      font-size: 12px;
    }

    .side-action span {
      margin-top: 2px;
      color: var(--sap-text-soft);
      font-size: 10px;
    }

    /* =========================================================
       Search results, dialog, toast and developer tools
       ========================================================= */
    .search-results {
      position: absolute;
      z-index: 350;
      top: 39px;
      right: 0;
      left: 0;
      max-height: 430px;
      overflow: auto;
      background: #fff;
      border: 1px solid var(--sap-border);
      border-radius: 12px;
      box-shadow: var(--sap-shadow-3);
      animation: popIn 150ms ease;
    }

    .search-results-head {
      padding: 10px 13px 7px;
      color: var(--sap-text-muted);
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .search-result {
      display: grid;
      grid-template-columns: 34px minmax(0, 1fr) auto;
      align-items: center;
      width: 100%;
      gap: 10px;
      padding: 10px 13px;
      text-align: left;
      background: #fff;
      border: 0;
      border-top: 1px solid var(--sap-border-soft);
      cursor: pointer;
    }

    .search-result:hover {
      background: #f5f9fd;
    }

    .search-result-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      color: var(--sap-blue-hover);
      background: var(--sap-blue-soft);
      border-radius: 8px;
    }

    .search-result strong,
    .search-result span {
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .search-result strong {
      font-size: 12px;
    }

    .search-result span,
    .search-result-type {
      color: var(--sap-text-soft);
      font-size: 10px;
    }

    .search-empty {
      padding: 22px;
      color: var(--sap-text-soft);
      text-align: center;
    }

    .modal-backdrop {
      position: fixed;
      z-index: 900;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      background: rgba(29, 45, 62, 0.55);
      backdrop-filter: blur(2px);
      animation: fadeIn 140ms ease;
    }

    .dialog {
      width: min(560px, 100%);
      max-height: min(720px, calc(100vh - 40px));
      overflow: auto;
      background: #fff;
      border: 1px solid var(--sap-border);
      border-radius: var(--radius-lg);
      box-shadow: var(--sap-shadow-3);
      animation: dialogIn 180ms ease;
    }

    .dialog-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
      padding: 18px 20px 14px;
      border-bottom: 1px solid var(--sap-border-soft);
    }

    .dialog-header h2 {
      margin: 0;
      color: #223548;
      font-size: 19px;
    }

    .dialog-header p {
      margin: 4px 0 0;
      color: var(--sap-text-soft);
      font-size: 12px;
    }

    .dialog-body {
      padding: 20px;
    }

    .dialog-summary {
      margin-bottom: 16px;
      padding: 13px;
      color: #223548;
      background: #f5f9fd;
      border-left: 4px solid var(--sap-blue);
      border-radius: 6px;
    }

    .detail-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
    }

    .detail-field {
      min-height: 64px;
      padding: 10px;
      background: #f7f9fa;
      border: 1px solid var(--sap-border-soft);
      border-radius: 8px;
    }

    .detail-field span,
    .detail-field strong {
      display: block;
    }

    .detail-field span {
      margin-bottom: 4px;
      color: var(--sap-text-muted);
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    .detail-field strong {
      font-size: 12px;
    }

    .dialog-footer {
      display: flex;
      justify-content: flex-end;
      flex-wrap: wrap;
      gap: 8px;
      padding: 13px 20px;
      background: #f7f9fa;
      border-top: 1px solid var(--sap-border-soft);
    }

    .toast-region {
      position: fixed;
      z-index: 1100;
      top: calc(58px + var(--amadeus-shell-height));
      left: 50%;
      display: flex;
      width: min(460px, calc(100vw - 24px));
      flex-direction: column;
      gap: 8px;
      transform: translateX(-50%);
      pointer-events: none;
    }

    .toast {
      display: grid;
      grid-template-columns: 26px minmax(0, 1fr) auto;
      align-items: center;
      gap: 9px;
      min-height: 50px;
      padding: 9px 10px 9px 13px;
      color: #223548;
      background: #fff;
      border: 1px solid var(--sap-border);
      border-left: 4px solid var(--sap-success);
      border-radius: 9px;
      box-shadow: var(--sap-shadow-3);
      animation: toastIn 220ms ease;
      pointer-events: auto;
    }

    .toast.info {
      border-left-color: var(--sap-blue);
    }

    .toast.warning {
      border-left-color: var(--sap-warning);
    }

    .toast-icon {
      color: var(--sap-success);
    }

    .toast.info .toast-icon {
      color: var(--sap-blue);
    }

    .toast.warning .toast-icon {
      color: var(--sap-warning);
    }

    .toast strong,
    .toast span {
      display: block;
    }

    .toast strong {
      font-size: 12px;
    }

    .toast span {
      margin-top: 1px;
      color: var(--sap-text-soft);
      font-size: 11px;
    }

    .toast .icon-button {
      width: 28px;
      height: 28px;
    }

    .dev-tools {
      position: fixed;
      z-index: 500;
      right: max(14px, env(safe-area-inset-right));
      bottom: max(14px, env(safe-area-inset-bottom));
      width: 292px;
      overflow: hidden;
      background: rgba(24, 39, 54, 0.97);
      border: 1px solid rgba(255, 255, 255, 0.18);
      border-radius: 14px;
      box-shadow: var(--sap-shadow-3);
      color: #fff;
      backdrop-filter: blur(12px);
      transition: width 180ms ease;
    }

    .dev-tools.collapsed {
      width: 54px;
      border-radius: 27px;
    }

    .dev-tools-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      min-height: 50px;
      gap: 8px;
      padding: 0 10px 0 14px;
    }

    .dev-tools-head strong {
      display: flex;
      align-items: center;
      gap: 7px;
      font-size: 12px;
      letter-spacing: 0.03em;
    }

    .dev-tools.collapsed .dev-tools-head {
      justify-content: center;
      padding: 0;
    }

    .dev-tools.collapsed .dev-tools-head strong,
    .dev-tools.collapsed .dev-tools-body {
      display: none;
    }

    .dev-toggle {
      color: #fff;
      background: rgba(255, 255, 255, 0.08);
    }

    .dev-toggle:hover {
      color: #fff;
      background: rgba(255, 255, 255, 0.17);
    }

    .dev-tools-body {
      padding: 0 10px 11px;
    }

    .dev-label {
      display: block;
      margin: 1px 3px 7px;
      color: #b9c9d8;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .role-switcher {
      display: grid;
      gap: 5px;
    }

    .role-option {
      display: flex;
      align-items: center;
      width: 100%;
      min-height: 38px;
      gap: 8px;
      padding: 0 10px;
      color: #eaf2f9;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid transparent;
      border-radius: 8px;
      cursor: pointer;
      font-size: 11px;
      font-weight: 700;
      text-align: left;
    }

    .role-option:hover {
      background: rgba(255, 255, 255, 0.11);
    }

    .role-option.active {
      color: #fff;
      background: rgba(0, 112, 242, 0.35);
      border-color: #54a9ff;
    }

    .role-check {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 18px;
      height: 18px;
      color: transparent;
      border: 1px solid #8296a8;
      border-radius: 50%;
    }

    .role-option.active .role-check {
      color: #fff;
      background: var(--sap-blue);
      border-color: #78b9ff;
    }

    .footer-note {
      margin-top: 34px;
      padding: 14px 0 8px;
      color: var(--sap-text-muted);
      border-top: 1px solid var(--sap-border);
      font-size: 11px;
      text-align: center;
    }


    /* =========================================================
       SKANDI intranet landing page
       ========================================================= */
    .intranet-home{padding-top:18px}
    .welcome-band{position:relative;overflow:hidden;display:grid;grid-template-columns:minmax(0,1.4fr) minmax(320px,.6fr);gap:22px;padding:28px 30px;color:#fff;background:linear-gradient(118deg,#022e64 0%,#075f9f 55%,#1497b0 100%);border-radius:20px;box-shadow:0 12px 30px rgba(2,46,100,.22)}
    .welcome-band:after{position:absolute;content:"";width:320px;height:320px;right:-90px;top:-150px;border-radius:50%;border:46px solid rgba(255,255,255,.08)}
    .welcome-kicker{display:flex;align-items:center;gap:7px;margin-bottom:8px;font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#d8f7fa}
    .welcome-band h1{margin:0;font-size:clamp(28px,4vw,43px);line-height:1.08;letter-spacing:-.035em}
    .welcome-band p{max-width:760px;margin:10px 0 0;color:rgba(255,255,255,.88);font-size:14px}
    .identity-chips{display:flex;flex-wrap:wrap;gap:7px;margin-top:18px}
    .identity-chip{display:inline-flex;align-items:center;gap:6px;min-height:30px;padding:0 10px;border:1px solid rgba(255,255,255,.25);border-radius:16px;background:rgba(255,255,255,.11);font-size:11px;font-weight:700;backdrop-filter:blur(8px)}
    .welcome-profile{position:relative;z-index:2;align-self:stretch;display:flex;flex-direction:column;justify-content:center;padding:16px 18px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);border-radius:14px;backdrop-filter:blur(10px)}
    .welcome-profile .profile-line{display:grid;grid-template-columns:112px 1fr;gap:10px;padding:7px 0;border-bottom:1px solid rgba(255,255,255,.12);font-size:11px}
    .welcome-profile .profile-line:last-child{border-bottom:0}
    .welcome-profile span{color:rgba(255,255,255,.67)}
    .welcome-profile strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .intranet-columns{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(315px,.72fr);gap:15px;align-items:start;margin-top:18px}
    .intranet-stack{display:grid;gap:15px}
    .intranet-panel{overflow:hidden;background:#fff;border:1px solid var(--sap-border);border-radius:15px;box-shadow:var(--sap-shadow-1)}
    .intranet-panel-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:15px 17px 12px;border-bottom:1px solid var(--sap-border-soft)}
    .intranet-panel-head h2{margin:0;color:#223548;font-size:17px}
    .intranet-panel-head p{margin:3px 0 0;color:var(--sap-text-soft);font-size:11px}
    .intranet-panel-body{padding:14px 16px}
    .focus-list{display:grid;gap:7px}
    .focus-item{display:grid;grid-template-columns:34px minmax(0,1fr) auto;align-items:center;gap:9px;padding:9px;border:1px solid var(--sap-border-soft);border-radius:9px;background:#fff}
    .focus-item:hover{background:#f7fafe}
    .focus-icon{display:grid;width:32px;height:32px;place-items:center;color:var(--sap-blue-hover);background:var(--sap-blue-soft);border-radius:8px}
    .focus-copy strong,.focus-copy span{display:block}
    .focus-copy strong{font-size:12px;color:#223548}
    .focus-copy span{margin-top:2px;font-size:10px;color:var(--sap-text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .mini-news-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
    .mini-news-card{position:relative;display:flex;min-height:150px;flex-direction:column;padding:15px;overflow:hidden;text-align:left;background:#fff;border:1px solid var(--sap-border);border-radius:12px;cursor:pointer}
    .mini-news-card:hover{border-color:#9fb3c7;box-shadow:var(--sap-shadow-2)}
    .mini-news-card:after{position:absolute;content:"";right:-35px;bottom:-55px;width:110px;height:110px;border-radius:50%;background:var(--scope-soft,#eaf3fc)}
    .mini-news-scope{position:relative;z-index:1;display:inline-flex;align-items:center;align-self:flex-start;gap:4px;padding:3px 7px;border-radius:10px;color:var(--scope-color,#0057d2);background:var(--scope-soft,#eaf3fc);font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.04em}
    .mini-news-card h3{position:relative;z-index:1;margin:9px 0 6px;font-size:14px;line-height:1.25;color:#223548}
    .mini-news-card p{position:relative;z-index:1;display:-webkit-box;margin:0;color:var(--sap-text-soft);font-size:11px;line-height:1.4;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden}
    .mini-news-meta{position:relative;z-index:1;margin-top:auto;padding-top:10px;color:var(--sap-text-muted);font-size:9px}
    .context-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
    .context-card{padding:14px;border:1px solid var(--sap-border);border-radius:12px;background:#fff}
    .context-card-head{display:flex;align-items:center;gap:10px;margin-bottom:10px}
    .context-card-icon{display:grid;width:38px;height:38px;place-items:center;color:#046c7a;background:#e2f4f6;border-radius:10px}
    .context-card h3{margin:0;font-size:13px;color:#223548}
    .context-card p{margin:2px 0 0;color:var(--sap-text-muted);font-size:10px}
    .context-facts{display:grid;gap:6px}
    .context-fact{display:flex;justify-content:space-between;gap:10px;padding-top:6px;border-top:1px solid var(--sap-border-soft);font-size:10px}
    .context-fact span{color:var(--sap-text-muted)}
    .context-fact strong{text-align:right;color:#223548}
    .team-strip{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px}
    .team-person{min-width:0;padding:12px;text-align:center;border:1px solid var(--sap-border);border-radius:11px;background:#fff}
    .team-person .avatar{width:40px;height:40px;margin:0 auto 7px}
    .team-person strong,.team-person span{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .team-person strong{font-size:11px;color:#223548}
    .team-person span{margin-top:2px;font-size:9px;color:var(--sap-text-muted)}
    .scope-pills{display:flex;align-items:center;flex-wrap:wrap;gap:5px}
    .scope-pill{display:inline-flex;align-items:center;gap:4px;padding:3px 7px;border-radius:10px;background:#edf4fb;color:#315a78;font-size:9px;font-weight:700}
    .tool-section .launchpad-grid{grid-template-columns:repeat(4,minmax(0,1fr))}
    .tool-section .app-tile{min-height:162px}
    .news-hero-image{position:absolute;inset:0;background-size:cover;background-position:center;opacity:.18;filter:saturate(.8) contrast(1.03)}
    .hero-card.has-image .hero-copy,.hero-card.has-image .hero-art,.hero-card.has-image .hero-controls{position:relative;z-index:2}
    .scope-access-note{margin-top:10px;padding:9px 11px;color:#475e75;background:#f5f7f9;border:1px solid var(--sap-border-soft);border-radius:8px;font-size:10px}
    @media(max-width:1050px){.welcome-band{grid-template-columns:1fr}.intranet-columns{grid-template-columns:1fr}.team-strip{grid-template-columns:repeat(2,minmax(0,1fr))}.tool-section .launchpad-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
    @media(max-width:680px){.intranet-home{padding-top:11px}.welcome-band{padding:22px 19px;border-radius:15px}.welcome-profile{padding:12px}.welcome-profile .profile-line{grid-template-columns:92px 1fr}.mini-news-grid,.context-grid{grid-template-columns:1fr}.team-strip{grid-template-columns:repeat(2,minmax(0,1fr))}.tool-section .launchpad-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
    @media(max-width:420px){.team-strip,.tool-section .launchpad-grid{grid-template-columns:1fr}}

    @keyframes popIn {
      from { opacity: 0; transform: translateY(-5px) scale(0.985); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    @keyframes pageIn {
      from { opacity: 0; transform: translateY(5px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes dialogIn {
      from { opacity: 0; transform: translateY(12px) scale(0.98); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    @keyframes toastIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @media (max-width: 1120px) {
      .launchpad-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      .news-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .metric-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .shell-left,
      .shell-right {
        min-width: 205px;
      }

      .shell-product,
      .avatar-copy {
        display: none;
      }
    }

    @media (max-width: 850px) {
      .shell-left {
        min-width: 160px;
      }

      .shell-right {
        min-width: auto;
      }

      .shell-center {
        padding: 0 8px;
      }

      .hero-card {
        grid-template-columns: 1fr;
      }

      .hero-copy {
        padding-right: 32px;
      }

      .hero-art {
        position: absolute;
        top: 0;
        right: 0;
        width: 38%;
        height: 100%;
        opacity: 0.56;
      }

      .hero-art-icon {
        width: 120px;
        height: 120px;
      }

      .app-workspace {
        grid-template-columns: 1fr;
      }

      .work-row {
        grid-template-columns: 42px minmax(0, 1fr) auto;
      }

      .work-row .work-meta:nth-of-type(2),
      .work-row .status-cell {
        display: none;
      }
    }

    @media (max-width: 680px) {
      :root {
        --shell-height: 0px;
        --nav-height: 44px;
      }

      .shell-bar {
        padding-right: 7px;
        padding-left: 8px;
      }

      .shell-left {
        min-width: auto;
      }

      .shell-title {
        max-width: 145px;
        font-size: 14px;
      }

      .sap-logo {
        width: 41px;
        height: 23px;
        margin-right: 5px;
        font-size: 12px;
      }

      .shell-center {
        justify-content: flex-end;
        min-width: 38px;
        padding: 0 3px;
      }

      .global-search {
        width: 36px;
      }

      .global-search input {
        position: absolute;
        top: -17px;
        right: -120px;
        width: 0;
        padding: 0;
        opacity: 0;
        pointer-events: none;
      }

      .global-search.mobile-open {
        position: fixed;
        z-index: 400;
        top: 7px;
        right: 8px;
        left: 8px;
        width: auto;
      }

      .global-search.mobile-open input {
        position: static;
        width: 100%;
        padding: 0 38px 0 40px;
        opacity: 1;
        pointer-events: auto;
      }

      .global-search > svg {
        left: 9px;
        display: none;
        pointer-events: auto;
      }

      .global-search.mobile-open > svg {
        left: 13px;
        display: block;
        pointer-events: none;
      }

      .global-search .mobile-search-trigger {
        display: inline-flex;
      }

      .global-search.mobile-open .mobile-search-trigger {
        display: none;
      }

      .search-shortcut {
        display: none;
      }

      .avatar-button {
        width: 36px;
        min-width: 36px;
        padding: 2px;
      }

      .shell-right {
        gap: 0;
      }

      .top-nav-inner {
        padding: 0 7px;
      }

      .nav-button {
        padding: 0 12px;
        font-size: 12px;
      }

      .page {
        padding: 17px 13px 105px;
      }

      .page-header {
        align-items: flex-start;
        flex-direction: column;
        margin-bottom: 16px;
      }

      .page-subtitle {
        font-size: 13px;
      }

      .page-actions {
        width: 100%;
      }

      .hero-card {
        min-height: 380px;
      }

      .hero-copy {
        justify-content: flex-start;
        padding: 27px 24px 60px;
      }

      .hero-copy h2 {
        font-size: 30px;
      }

      .hero-copy p {
        max-width: 88%;
        font-size: 13px;
      }

      .hero-art {
        top: auto;
        bottom: 18px;
        width: 42%;
        height: 45%;
      }

      .hero-art-icon {
        width: 90px;
        height: 90px;
        border-radius: 23px;
      }

      .hero-controls {
        justify-content: flex-start;
      }

      .section {
        margin-top: 23px;
      }

      .section-header {
        align-items: flex-start;
      }

      .section-title-group h2 {
        font-size: 18px;
      }

      .section-title-group p {
        display: none;
      }

      .horizontal-scroller {
        grid-auto-columns: minmax(270px, 88vw);
      }

      .launchpad-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 9px;
      }

      .app-tile,
      .app-tile.wide {
        grid-column: span 1;
        min-height: 168px;
        padding: 14px;
      }

      .tile-copy h3 {
        font-size: 14px;
      }

      .tile-copy p {
        -webkit-line-clamp: 2;
      }

      .tile-metric {
        font-size: 18px;
      }

      .news-grid,
      .metric-grid {
        grid-template-columns: 1fr;
      }

      .toolbar {
        align-items: stretch;
        flex-direction: column;
      }

      .inline-search {
        width: 100%;
      }

      .work-list {
        background: transparent;
        border: 0;
        box-shadow: none;
      }

      .work-row {
        grid-template-columns: 38px minmax(0, 1fr);
        margin-bottom: 8px;
        padding: 13px;
        background: #fff;
        border: 1px solid var(--sap-border);
        border-radius: 11px;
        box-shadow: var(--sap-shadow-1);
      }

      .work-actions {
        grid-column: 1 / -1;
        justify-content: flex-end;
      }

      .work-row .work-meta,
      .work-row .status-cell {
        display: none;
      }

      .app-object-header {
        grid-template-columns: 50px minmax(0, 1fr);
        padding: 15px;
      }

      .app-object-icon {
        width: 48px;
        height: 48px;
      }

      .app-object-copy h1 {
        font-size: 20px;
      }

      .app-object-actions {
        grid-column: 1 / -1;
        display: flex;
        justify-content: flex-end;
      }

      .detail-grid {
        grid-template-columns: 1fr;
      }

      .dev-tools {
        right: max(9px, env(safe-area-inset-right));
        bottom: max(9px, env(safe-area-inset-bottom));
        width: min(292px, calc(100vw - 18px));
      }
    }

    @media (max-width: 420px) {
      .shell-title {
        max-width: 116px;
      }

      .launchpad-grid {
        grid-template-columns: 1fr;
      }

      .app-tile {
        min-height: 154px;
      }

      .hero-copy p {
        max-width: 100%;
      }

      .hero-art {
        opacity: 0.36;
      }
    }

    /* =========================================================
       HR Administration workbench
       Uses the same Morning Horizon tokens as the portal shell.
       ========================================================= */
    .hr-admin-page {
      --font: var(--font-sans);
    }

    .hr-admin-header {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 18px;
      align-items: center;
      padding: 22px 24px;
      color: #fff;
      background:
        radial-gradient(circle at 86% 16%, rgba(255, 255, 255, 0.2), transparent 24%),
        linear-gradient(118deg, #003b7a 0%, #0057d2 52%, #0070f2 100%);
      border: 1px solid rgba(0, 64, 176, 0.72);
      border-radius: var(--radius-lg);
      box-shadow: var(--sap-shadow-2);
    }

    .hr-admin-header h1 {
      margin: 3px 0 4px;
      font-size: clamp(24px, 3vw, 34px);
      line-height: 1.15;
      letter-spacing: -0.025em;
    }

    .hr-admin-header p {
      max-width: 760px;
      margin: 0;
      color: rgba(255, 255, 255, 0.86);
    }

    .hr-admin-kicker {
      display: flex;
      align-items: center;
      gap: 7px;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    .hr-admin-header-actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: 8px;
    }

    .hr-admin-header .secondary-button {
      color: #fff;
      background: rgba(255, 255, 255, 0.13);
      border-color: rgba(255, 255, 255, 0.72);
    }

    .hr-admin-header .secondary-button:hover {
      background: rgba(255, 255, 255, 0.22);
    }

    .hr-module-nav {
      position: sticky;
      z-index: 40;
      top: calc(var(--shell-height) + var(--nav-height) + var(--amadeus-shell-height));
      display: flex;
      gap: 2px;
      margin-top: 14px;
      padding: 5px;
      overflow-x: auto;
      scrollbar-width: thin;
      background: rgba(255, 255, 255, 0.96);
      border: 1px solid var(--sap-border);
      border-radius: 12px;
      box-shadow: var(--sap-shadow-1);
      backdrop-filter: blur(16px);
    }

    .hr-module-tab {
      display: inline-flex;
      flex: 0 0 auto;
      align-items: center;
      min-height: 38px;
      gap: 7px;
      padding: 0 13px;
      color: #354a5f;
      background: transparent;
      border: 0;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
    }

    .hr-module-tab:hover {
      color: var(--sap-blue-hover);
      background: var(--sap-blue-soft);
    }

    .hr-module-tab.active {
      color: #fff;
      background: var(--sap-blue-hover);
    }

    .hr-module-body {
      margin-top: 14px;
    }

    .hr-kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 12px;
      margin-bottom: 14px;
    }

    .hr-kpi {
      min-width: 0;
      padding: 16px;
      background: #fff;
      border: 1px solid var(--sap-border);
      border-radius: 12px;
      box-shadow: var(--sap-shadow-1);
    }

    .hr-kpi span,
    .hr-kpi small {
      display: block;
      color: var(--sap-text-muted);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .hr-kpi span {
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .hr-kpi strong {
      display: block;
      margin: 5px 0 1px;
      color: var(--sap-text);
      font-size: 26px;
      line-height: 1;
    }

    .hr-workbench-grid {
      display: grid;
      grid-template-columns: minmax(0, 1.55fr) minmax(300px, 0.8fr);
      gap: 14px;
      align-items: start;
    }

    .hr-workbench-grid.equal {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .hr-workbench-grid.one {
      grid-template-columns: minmax(0, 1fr);
    }

    .hr-panel {
      min-width: 0;
      overflow: hidden;
      background: #fff;
      border: 1px solid var(--sap-border);
      border-radius: 12px;
      box-shadow: var(--sap-shadow-1);
    }

    .hr-panel-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      min-height: 56px;
      gap: 12px;
      padding: 13px 16px;
      background: #fff;
      border-bottom: 1px solid var(--sap-border-soft);
    }

    .hr-panel-header h2,
    .hr-panel-header h3 {
      margin: 0;
      color: var(--sap-text);
      font-size: 16px;
    }

    .hr-panel-header p,
    .hr-panel-header small {
      display: block;
      margin: 2px 0 0;
      color: var(--sap-text-muted);
      font-size: 12px;
    }

    .hr-panel-actions,
    .hr-action-row {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: 8px;
    }

    .hr-panel-body {
      min-width: 0;
      padding: 16px;
    }

    .hr-panel-body.flush {
      padding: 0;
    }

    .hr-subtabs {
      display: flex;
      gap: 4px;
      margin: 0 0 14px;
      padding-bottom: 8px;
      overflow-x: auto;
      border-bottom: 1px solid var(--sap-border-soft);
    }

    .hr-subtab {
      flex: 0 0 auto;
      min-height: 34px;
      padding: 0 12px;
      color: #354a5f;
      background: transparent;
      border: 0;
      border-radius: 7px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
    }

    .hr-subtab:hover {
      color: var(--sap-blue-hover);
      background: var(--sap-blue-soft);
    }

    .hr-subtab.active {
      color: var(--sap-blue-hover);
      background: var(--sap-blue-soft);
      box-shadow: inset 0 -2px var(--sap-blue);
    }

    .hr-search-row {
      display: flex;
      align-items: center;
      gap: 9px;
      padding: 12px 14px;
      background: #f7f8f9;
      border-bottom: 1px solid var(--sap-border-soft);
    }

    .hr-search-row .inline-search {
      flex: 1 1 320px;
      width: auto;
    }

    .hr-table-scroll {
      max-width: 100%;
      overflow: auto;
    }

    .hr-table-row {
      cursor: pointer;
    }

    .hr-table-row.selected td {
      background: var(--sap-blue-soft);
    }

    .hr-table-row:focus-visible {
      outline: 2px solid var(--sap-blue);
      outline-offset: -2px;
    }

    .hr-object-header {
      display: grid;
      grid-template-columns: 58px minmax(0, 1fr) auto;
      align-items: center;
      gap: 14px;
      margin-bottom: 14px;
      padding: 18px;
      background: #fff;
      border: 1px solid var(--sap-border);
      border-radius: 12px;
      box-shadow: var(--sap-shadow-1);
    }

    .hr-object-avatar {
      display: grid;
      width: 58px;
      height: 58px;
      place-items: center;
      overflow: hidden;
      color: #fff;
      background: linear-gradient(135deg, #0057d2, #1683f8);
      border-radius: 50%;
      font-size: 18px;
      font-weight: 800;
    }

    .hr-object-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .hr-object-copy {
      min-width: 0;
    }

    .hr-object-copy h2 {
      margin: 0;
      overflow: hidden;
      color: var(--sap-text);
      font-size: 21px;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .hr-object-copy p {
      margin: 2px 0 0;
      color: var(--sap-text-muted);
    }

    .hr-form-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 14px;
    }

    .hr-form-grid.three {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .hr-field {
      display: flex;
      min-width: 0;
      flex-direction: column;
      gap: 5px;
    }

    .hr-field.wide {
      grid-column: 1 / -1;
    }

    .hr-field > span,
    .hr-field > label {
      color: #354a5f;
      font-size: 12px;
      font-weight: 700;
    }

    .hr-input,
    .hr-select,
    .hr-textarea {
      width: 100%;
      min-height: 38px;
      padding: 7px 10px;
      color: var(--sap-text);
      background: #fff;
      border: 1px solid #8996a3;
      border-radius: 7px;
    }

    .hr-textarea {
      min-height: 92px;
      resize: vertical;
    }

    .hr-input:focus,
    .hr-select:focus,
    .hr-textarea:focus {
      border-color: var(--sap-blue);
      box-shadow: 0 0 0 1px var(--sap-blue);
      outline: 0;
    }

    .hr-input[readonly],
    .hr-textarea[readonly],
    .hr-select:disabled {
      color: var(--sap-text-soft);
      background: #f5f6f7;
      border-color: var(--sap-border);
    }

    .hr-empty {
      display: grid;
      min-height: 180px;
      place-items: center;
      padding: 32px;
      color: var(--sap-text-muted);
      text-align: center;
    }

    .hr-empty strong {
      display: block;
      margin-bottom: 3px;
      color: var(--sap-text);
      font-size: 15px;
    }

    .hr-note {
      padding: 11px 13px;
      color: #354a5f;
      background: #f7f8f9;
      border: 1px solid var(--sap-border-soft);
      border-radius: 8px;
      font-size: 12px;
    }

    .hr-note.warning {
      color: #7a3e00;
      background: var(--sap-warning-bg);
      border-color: #f0ab00;
    }

    .hr-pipeline {
      display: grid;
      grid-template-columns: repeat(6, minmax(190px, 1fr));
      gap: 10px;
      overflow-x: auto;
      padding-bottom: 5px;
    }

    .hr-pipeline-column {
      min-height: 250px;
      padding: 10px;
      background: #f5f6f7;
      border: 1px solid var(--sap-border-soft);
      border-radius: 10px;
    }

    .hr-pipeline-column h3 {
      display: flex;
      justify-content: space-between;
      margin: 0 0 9px;
      color: #354a5f;
      font-size: 12px;
      text-transform: uppercase;
    }

    .hr-pipeline-card {
      margin-bottom: 8px;
      padding: 10px;
      background: #fff;
      border: 1px solid var(--sap-border);
      border-radius: 8px;
      box-shadow: var(--sap-shadow-1);
      cursor: pointer;
    }

    .hr-pipeline-card strong,
    .hr-pipeline-card span {
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .hr-pipeline-card span {
      margin-top: 2px;
      color: var(--sap-text-muted);
      font-size: 11px;
    }

    .hr-permission-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 9px;
    }

    .hr-permission {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr);
      gap: 9px;
      align-items: start;
      padding: 11px;
      background: #f7f8f9;
      border: 1px solid var(--sap-border-soft);
      border-radius: 8px;
    }

    .hr-permission input {
      margin-top: 3px;
      accent-color: var(--sap-blue);
    }

    .hr-permission strong,
    .hr-permission small {
      display: block;
    }

    .hr-permission small {
      margin-top: 2px;
      color: var(--sap-text-muted);
    }

    .staff-id-workspace {
      display: grid;
      grid-template-columns: minmax(310px, 0.8fr) minmax(330px, 1.2fr);
      gap: 14px;
      align-items: start;
    }

    .staff-id-preview-panel {
      display: flex;
      min-height: 526px;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
    }

    .staff-id-preview-box {
      display: flex;
      justify-content: center;
      margin-top: 2px;
      padding: 18px;
      background: #eef1f4;
      border: 1px solid var(--sap-border);
      border-radius: 12px;
    }

    .staff-id-button-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 13px;
    }

    .staff-id-manual-form {
      display: none;
      margin-top: 14px;
      padding-top: 14px;
      border-top: 1px solid var(--sap-border-soft);
    }

    .staff-id-manual-form.visible {
      display: block;
    }

    .staff-id-form-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
    }

    .staff-id-form-row-full {
      grid-column: 1 / -1;
    }

    .badge-source-row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 8px;
      align-items: end;
    }

    /* Badge card */
    .staff-id-card{width:260px;height:410px;border-radius:20px;background:#f9fafb;position:relative;overflow:hidden;box-shadow:0 12px 30px rgba(15,23,42,.6);font-family:"Montserrat",var(--font);color:#111827}
    .staff-id-inner{width:100%;height:100%;position:relative}
    .staff-id-face{position:absolute;inset:0}
    .staff-id-front{display:block}
    .staff-id-back{display:none}
    .staff-id-card.show-back .staff-id-front{display:none}
    .staff-id-card.show-back .staff-id-back{display:block}
    .staff-id-card-head{height:62px;background:linear-gradient(135deg,#022e64,#003399);padding:10px 14px 6px;display:flex;align-items:center;justify-content:space-between;color:#e5f0ff}
    .staff-id-logo-wrap{display:flex;align-items:center;gap:8px}
    .staff-id-logo-box{width:92px;height:58px;border-radius:8px;background:transparent;display:flex;align-items:center;justify-content:center;overflow:hidden}
    .staff-id-logo-text{font-size:13px;font-weight:700;letter-spacing:.16em;text-transform:uppercase}
    .staff-id-logo-img{max-width:92px;max-height:38px;display:block}
    .staff-id-card-head-text{text-align:right}
    .staff-id-topline{font-size:8px;text-transform:uppercase;letter-spacing:.18em;opacity:.9}
    .staff-id-head-role{font-size:11px;font-weight:600;letter-spacing:.10em;text-transform:uppercase}
    .staff-id-body{padding:10px 14px 12px;display:grid;grid-template-rows:auto auto 1fr auto;row-gap:8px}
    .staff-id-photo-row{display:flex;justify-content:center;margin-top:-26px}
    .staff-id-photo-frame{width:88px;height:112px;border-radius:14px;background:#e5e7eb;overflow:hidden;box-shadow:0 8px 16px rgba(15,23,42,.4);border:2px solid #fff}
    .staff-id-photo{width:100%;height:100%;object-fit:cover;display:none}
    .staff-id-photo-placeholder{width:100%;height:100%;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:3px;color:#9ca3af;font-size:10px}
    .staff-id-photo-circle{width:34px;height:34px;border-radius:999px;border:2px solid #9ca3af;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:600}
    .staff-id-name-block{text-align:center;margin-top:4px}
    .staff-id-name{font-size:15px;font-weight:700;text-transform:uppercase;letter-spacing:.16em}
    .staff-id-dept{font-size:9px;text-transform:uppercase;letter-spacing:.16em;color:#6b7280;margin-top:2px}
    .staff-id-meta-grid{margin-top:8px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px 10px;font-size:9px}
    .staff-id-meta-label{font-size:7px;text-transform:uppercase;letter-spacing:.16em;color:#9ca3af}
    .staff-id-meta-value{font-size:10px;font-weight:600;color:#111827;overflow-wrap:anywhere}
    .staff-id-meta-wide{grid-column:1 / -1}
    .staff-id-card-footer{margin-top:8px}
    .staff-id-barcode{height:36px;border-radius:6px;background:repeating-linear-gradient(to right,#0f172a 0,#0f172a 2px,transparent 2px,transparent 4px);position:relative;overflow:hidden}
    .staff-id-barcode-inner{position:absolute;inset:4px 6px;border-radius:4px;background:repeating-linear-gradient(to right,#020617 0,#020617 2px,transparent 2px,transparent 4px)}
    .staff-id-barcode-text{position:absolute;inset:auto 6px 3px;font-family:Menlo,Monaco,Consolas,"Courier New",monospace;font-size:7px;letter-spacing:.18em;color:#e5e7eb;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .staff-id-footer-row{margin-top:3px;display:flex;justify-content:space-between;align-items:center}
    .staff-id-footer-left{font-size:7px;text-transform:uppercase;letter-spacing:.16em;color:#9ca3af}
    .staff-id-footer-right{font-size:7px;color:#9ca3af}
    .staff-id-footer-right span{font-weight:600;color:#111827}

    /* Badge back */
    .staff-id-back-inner{padding:14px 14px 10px;display:flex;flex-direction:column;height:100%;background:#f9fafb}
    .staff-id-mag-strip{height:46px;border-radius:6px;background:repeating-linear-gradient(to right,rgba(15,23,42,.94) 0,rgba(15,23,42,.94) 3px,rgba(15,23,42,.75) 3px,rgba(15,23,42,.75) 6px);margin-bottom:12px;box-shadow:0 2px 4px rgba(15,23,42,.5) inset}
    .staff-id-back-section{font-size:8px;color:#4b5563;margin-bottom:7px}
    .staff-id-back-title{text-transform:uppercase;letter-spacing:.14em;font-weight:600;color:#6b7280;margin-bottom:2px}
    .staff-id-back-body{line-height:1.4}
    .staff-id-back-body strong{font-weight:600}
    .staff-id-back-grid{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);gap:6px 8px;margin-top:4px}
    .staff-id-back-label{font-size:7px;text-transform:uppercase;letter-spacing:.16em;color:#9ca3af}
    .staff-id-back-value{font-size:9px;color:#111827;font-weight:600;overflow-wrap:anywhere}
    .staff-id-chip-area{margin-top:8px;border-radius:6px;border:1px dashed #e5e7eb;padding:6px 7px;display:flex;justify-content:space-between;align-items:center;font-size:7px;color:#6b7280}
    .staff-id-chip-left{max-width:55%}
    .staff-id-chip-right{text-align:right}
    .staff-id-mini-barcode{margin-top:8px;height:26px;border-radius:5px;background:repeating-linear-gradient(to right,#111827 0,#111827 2px,transparent 2px,transparent 4px);position:relative;overflow:hidden}
    .staff-id-mini-barcode-inner{position:absolute;inset:3px 5px;border-radius:4px;background:repeating-linear-gradient(to right,#020617 0,#020617 1.6px,transparent 1.6px,transparent 3.4px)}
    .staff-id-mini-code{position:absolute;inset:auto 5px 2px;font-family:Menlo,Monaco,Consolas,"Courier New",monospace;font-size:6px;letter-spacing:.16em;color:#e5e7eb;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .staff-id-barcode.has-jsbarcode,.staff-id-mini-barcode.has-jsbarcode{background:#fff;border:1px solid #e5e7eb;display:flex;align-items:center;justify-content:center;padding:2px 4px}
    .staff-id-barcode.has-jsbarcode{height:40px}
    .staff-id-mini-barcode.has-jsbarcode{height:30px}
    .staff-id-barcode.has-jsbarcode .staff-id-barcode-inner,
    .staff-id-mini-barcode.has-jsbarcode .staff-id-mini-barcode-inner,
    .staff-id-barcode.has-jsbarcode .staff-id-barcode-text,
    .staff-id-mini-barcode.has-jsbarcode .staff-id-mini-code{display:none}
    .staff-id-jsbarcode{position:relative;z-index:2;width:100%;height:33px;background:#fff;display:block}
    .staff-id-jsbarcode-mini{position:relative;z-index:2;width:100%;height:22px;background:#fff;display:block}
    .staff-id-back-footer{margin-top:auto;font-size:7px;color:#9ca3af;display:flex;justify-content:space-between;align-items:flex-end}
    .staff-id-back-footer span{font-weight:600;color:#111827}

    @media (max-width: 1040px) {
      .hr-kpi-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .hr-workbench-grid,
      .hr-workbench-grid.equal,
      .staff-id-workspace {
        grid-template-columns: minmax(0, 1fr);
      }

      .hr-form-grid.three {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (max-width: 680px) {
      .hr-admin-header {
        grid-template-columns: 1fr;
        padding: 18px;
      }

      .hr-admin-header-actions {
        justify-content: flex-start;
      }

      .hr-module-nav {
        top: calc(var(--shell-height) + var(--amadeus-shell-height));
        margin-right: -6px;
        margin-left: -6px;
        border-radius: 9px;
      }

      .hr-kpi-grid,
      .hr-form-grid,
      .hr-form-grid.three,
      .hr-permission-grid,
      .staff-id-form-grid {
        grid-template-columns: 1fr;
      }

      .hr-field.wide,
      .staff-id-form-row-full {
        grid-column: auto;
      }

      .hr-object-header {
        grid-template-columns: 48px minmax(0, 1fr);
      }

      .hr-object-avatar {
        width: 48px;
        height: 48px;
      }

      .hr-object-actions {
        grid-column: 1 / -1;
      }

      .hr-search-row {
        align-items: stretch;
        flex-direction: column;
      }

      .hr-search-row .inline-search {
        flex-basis: auto;
        width: 100%;
      }
    }


    /* SKANDI organization assignment controls */
    .org-provision-card{margin:0 0 16px;padding:14px;border:1px solid #9ec8f5;border-left:4px solid var(--sap-blue);border-radius:10px;background:#f5f9fd}
    .org-provision-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:12px}
    .org-provision-head h3{margin:0;color:#223548;font-size:15px}.org-provision-head p{margin:3px 0 0;color:var(--sap-text-soft);font-size:11px}
    .org-provision-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
    .org-derived{padding:9px 10px;border:1px solid var(--sap-border-soft);border-radius:8px;background:#fff;min-height:58px}.org-derived span,.org-derived strong{display:block}.org-derived span{font-size:9px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--sap-text-muted)}.org-derived strong{margin-top:4px;font-size:11px;color:#223548}
    .org-permission-chips{display:flex;flex-wrap:wrap;gap:5px;margin-top:7px}.org-permission-chip{display:inline-flex;padding:3px 7px;border-radius:11px;background:#eaf3fc;color:#0057d2;font-size:9px;font-weight:800}
    .org-system-field{background:#f5f6f7!important;color:#475e75!important}
    .org-warning{margin-top:9px;padding:8px 10px;border:1px solid #f0ab00;border-radius:7px;background:#fff8d6;color:#7a3e00;font-size:10px}
    .org-table-note{padding:10px 12px;border-bottom:1px solid var(--sap-border-soft);background:#f7f9fa;color:var(--sap-text-soft);font-size:11px}
    @media(max-width:900px){.org-provision-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
    @media(max-width:680px){.org-provision-grid{grid-template-columns:1fr}}

    @media print{
      #view-badge .staff-id-controls,
      #view-badge .staff-id-preview-title,
      #view-badge .staff-id-preview-note,
      #view-badge .record-top-actions{display:none!important}
      #view-badge .staff-id-layout,
      #view-badge .staff-id-preview-panel{display:block!important}
      #view-badge .staff-id-preview-box{border:0!important;background:#fff!important;padding:0!important;margin:0!important}
      #view-badge .staff-id-card{box-shadow:none!important;margin:0 auto!important}
    }

    @media (prefers-reduced-motion: reduce) {
      *,
      *::before,
      *::after {
        scroll-behavior: auto !important;
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    }

    @media print {
      .shell-bar,
      .top-nav,
      .dev-tools,
      .page-actions,
      .section-controls,
      .toast-region {
        display: none !important;
      }

      .page {
        max-width: none;
        padding: 0;
      }

      body {
        background: #fff;
      }
    }
  </style>
</head>
<body>
  
  <!-- =========================================
       SAP SUCCESSFACTORS APP
       ========================================= -->
  <div id="portal"></div>
  <div id="modalRoot"></div>
  <div id="toastRegion" class="toast-region" aria-live="polite" aria-atomic="true"></div>

  <noscript>
    <div style="padding:24px;font-family:Arial,sans-serif">
      JavaScript is required to run this SuccessFactors employee portal.
    </div>
  </noscript>

  <script>
    "use strict";

    // SKANDI SuccessFactors v12: preserved B-011.32 presentation, ordered bootstrap and confirmed persistence.
    // SuccessFactors owns Employee/HR, Organization, Recruiting, Performance/Learning, Badge and Access.
    // Payroll data and MyRoster/scheduling remain separate applications; their profile fields are read-only here.

    /* =========================================================
       Centralized application state
       currentUserRole is the RBAC source of truth.
       ========================================================= */
    let currentUserRole = null;
    let currentView = "home";
    let currentAppId = null;
    let currentNewsIndex = 0;
    let taskFilter = "open";
    let appGroupFilter = "All";
    let notificationsOpen = false;
    let profileOpen = false;
    let devToolsCollapsed = false;
    let mobileSearchOpen = false;
    let activeDialogId = null;
    let currentProfileTab = "personal";
    let directoryQuery = "";
    let currentHrView = "workforce";
    let currentHrEmployeeTab = "personal";
    let currentRecruitingView = "dashboard";
    let currentPerformanceView = "reports";
    let hrWorkforceScope = "active";
    let hrSearchQuery = "";
    let hrSelectedEmployeeId = "";
    let hrSelectedCandidateId = "";
    let hrSelectedJobId = "";
    let hrEmployeeDraftMode = false;
    let badgeSelectedId = "";
    let badgeManualOpen = false;
    let badgeShowBack = false;
    let badgeOverride = {};
    const $ = id => document.getElementById(id);

    const completedTasks = new Set();
    const dismissedTasks = new Set();
    const favoriteApps = new Set();
    const readNotifications = new Set();

    const portalMutationTypes = new Set(["INTRANET_TASK_COMPLETE", "INTRANET_TASK_DISMISS", "INTRANET_FAVORITES_UPDATE", "INTRANET_NOTIFICATIONS_READ"]);
    const pendingPortalMutations = new Map();
    const selectionKeys = ["completedTaskIds", "dismissedTaskIds", "favoriteApps", "readNotificationIds"];
    let confirmedPortalSelections = Object.fromEntries(selectionKeys.map(key => [key, []]));
    let portalMutationSequence = 0;

    function restorePortalSelections() {
      const sets = { completedTaskIds: completedTasks, dismissedTaskIds: dismissedTasks, favoriteApps, readNotificationIds: readNotifications };
      selectionKeys.forEach(key => {
        sets[key].clear();
        (confirmedPortalSelections[key] || []).forEach(id => sets[key].add(String(id)));
      });
      pendingPortalMutations.forEach(({ type, payload }) => {
        if (type === "INTRANET_TASK_COMPLETE") completedTasks.add(String(payload.id));
        if (type === "INTRANET_TASK_DISMISS") dismissedTasks.add(String(payload.id));
        if (type === "INTRANET_NOTIFICATIONS_READ") payload.ids.forEach(id => readNotifications.add(String(id)));
        if (type === "INTRANET_FAVORITES_UPDATE") {
          favoriteApps.clear();
          payload.ids.forEach(id => favoriteApps.add(String(id)));
        }
      });
    }

    function settlePortalMutation(requestId) {
      const pending = pendingPortalMutations.get(requestId);
      if (pending) window.clearTimeout(pending.timeout);
      pendingPortalMutations.delete(requestId);
      return pending;
    }

    function requestPortalMutation(type, payload) {
      if (!portalState.connected) return;
      const requestId = `sf-${Date.now()}-${++portalMutationSequence}`;
      const timeout = window.setTimeout(() => {
        if (!pendingPortalMutations.has(requestId)) return;
        settlePortalMutation(requestId);
        restorePortalSelections();
        renderPortal();
        showToast("Update not confirmed", "Refreshing your saved data. The connection did not confirm this update in time.", "warning");
        post("INTRANET_REFRESH");
      }, 30000);
      pendingPortalMutations.set(requestId, { type, payload, timeout });
      restorePortalSelections();
      post(type, { ...payload, requestId });
    }

    function confirmPortalSelections(payload) {
      const pending = settlePortalMutation(payload.requestId);
      selectionKeys.forEach(key => {
        if (Array.isArray(payload[key])) confirmedPortalSelections[key] = payload[key].map(String);
      });
      restorePortalSelections();
      renderPortal();
      if (pending?.type === "INTRANET_TASK_COMPLETE") showToast("Task completed", "The backend confirmed the update.");
      if (pending?.type === "INTRANET_TASK_DISMISS") showToast("Task dismissed", "Your saved dashboard was updated.", "info");
    }

    function canManageHrRecords() {
      return getProfile()?.successFactorsAccess?.manage === true && portalState.hr.authorized !== false;
    }

    function applyHrReadOnlyControls() {
      if (canManageHrRecords()) return;
      document.querySelectorAll('#hrEmployeeForm input, #hrEmployeeForm select, #hrEmployeeForm textarea, button[form="hrEmployeeForm"], [data-action="hr-new-employee"], [data-action="hr-generate-skid"], [data-action="hr-archive-employee"], [data-action="hr-confirm-archive"]').forEach(element => {
        element.disabled = true;
        element.setAttribute("aria-disabled", "true");
        element.title = "Your current permission allows viewing this information.";
      });
    }



    const roles = {
      Driver: {
        key: "Driver",
        label: "Blue-Collar / Driver",
        shortLabel: "Driver",
        greeting: "Your roster, tasks, and employee services in one place."
      },
      "HR Admin": {
        key: "HR Admin",
        label: "HR Admin",
        shortLabel: "HR Admin",
        greeting: "Manage people data, recruiting, credentials, and workforce documents."
      },
      Manager: {
        key: "Manager",
        label: "Operations Manager",
        shortLabel: "Manager",
        greeting: "Keep teams, fleet coverage, and approvals moving."
      }
    };


    /* =========================================================
       SKANDI canonical organization context
       Generated from SKANDI Organization & Role Codebook 2026-09-08.
       IMPORTANT: catalog mappings personalize presentation only. They never
       grant permissions; authorization must still come from the backend.
       ========================================================= */
    const SKANDI_COMPANY_CODE = "SK01";

    const HR_MODULES = Object.freeze([
      ["workforce", "Workforce", "directory"],
      ["employee", "Employee Central", "profile"],
      ["organization", "Organization", "apps"],
      ["recruiting", "Recruiting", "task"],
      ["performance", "Performance & Learning", "news"],
      ["badge", "Badge Control", "profile"],
      ["access", "Access & Portal", "lock"]
    ]);

    const HR_PERMISSIONS = Object.freeze([
      ["altea", "ALTEA", "Operations cockpit"],
      ["mail", "Mail", "Internal staff mail"],
      ["grouptalk", "GroupTalk", "Internal groups"],
      ["uniform", "Uniform", "Uniform orders"],
      ["myroster", "MyRoster", "Shifts and duties"],
      ["payroll", "Payroll", "Compensation and paystubs"],
      ["inventory-control", "Inventory", "Inventory control"],
      ["hr", "HR", "Staff management"],
      ["policies", "Policies", "Internal policies"],
      ["badge-generator", "Badge", "Print staff badges"],
      ["help-data", "Help Data", "Help Center records"]
    ]);

    const RECRUITING_STAGES = Object.freeze([
      ["applied", "Applied"],
      ["screening", "Screening"],
      ["interview", "Interview"],
      ["sra", "SRA"],
      ["dgr", "DGR"],
      ["hired", "Hired"]
    ]);

    const EMPTY_COLLECTIONS = Object.freeze({
      newsItems: Object.freeze([]),
      toDoTasks: Object.freeze([]),
      applicationTiles: Object.freeze([]),
      quickActions: Object.freeze([]),
      notifications: Object.freeze([])
    });

    /* =========================================================
       Parent/backend bridge adapted from the supplied RIAINTRA
       implementation. The SAP Fiori presentation remains local;
       data, persistence, directory search, and navigation are
       delegated to the trusted parent application with postMessage.
       ========================================================= */
    const SOURCE = "SKANDI_HR_STAFF";
    const PARENT_SOURCE = "SKANDI_WIX_PARENT";
    const ALL_ROLES = Object.keys(roles);
    const EMBED_CONFIG = Object.freeze({
      devTools: Boolean(window.SKANDI_SUCCESSFACTORS_CONFIG?.devTools) || new URLSearchParams(window.location.search).get("devtools") === "1",
      parentOrigin: window.SKANDI_SUCCESSFACTORS_CONFIG?.parentOrigin || ""
    });
    let parentOrigin = "*"; // Wix Preview/Live parent origins can differ.
    let masterConfig = { routes: {}, internal: {}, brand: {} };
    let masterNavigation = { routes: {}, internal: {} };
    // Wix can deliver the shared portal and HR responses in either order because
    // the page bridge receives INTRANET_READY and HR_READY concurrently. Keep
    // module responses until the authenticated portal profile is available.
    const preconnectMessageTypes = new Set([
      "HR_SESSION",
      "HR_BOOTSTRAP",
      "HR_DATA",
      "INTRANET_HR_DATA",
      "HR_STAFF_LIST",
      "HR_ORG_CATALOG",
      "HR_REPORTS",
      "HR_ERROR",
      "CAREERS_BOOTSTRAP",
      "CAREERS_DATA",
      "CAREERS_REFRESH_RESULT",
      "CAREERS_ERROR"
    ]);
    const pendingPreconnectMessages = [];

    function queuePreconnectMessage(data, payload, origin) {
      // Keep the queue bounded while preserving the first-in/first-out contract.
      if (pendingPreconnectMessages.length >= 24) pendingPreconnectMessages.shift();
      pendingPreconnectMessages.push({
        type: String(data.type || ""),
        payload: payload || {},
        origin: origin || ""
      });
    }

    function replayPreconnectMessages() {
      if (!portalState.connected || !pendingPreconnectMessages.length) return;
      const queued = pendingPreconnectMessages.splice(0, pendingPreconnectMessages.length);
      queued.forEach((item) => {
        onParentMessage({
          source: window.parent,
          origin: item.origin,
          data: { source: PARENT_SOURCE, type: item.type, payload: item.payload }
        });
      });
    }

    function masterRoutes() {
      return { ...(masterConfig?.routes || {}), ...(masterNavigation?.routes || {}) };
    }

    function requestMasterNavigation(path) {
      const value = String(path || "").trim();
      if (!isSafeNavigationPath(value)) return;
      post("MASTER_NAVIGATE", { path: value });
    }

    const portalState = {
      status: "waiting",
      error: null,
      connected: false,
      importedRole: null,
      profile: null,
      apps: null,
      news: null,
      tasks: null,
      quickActions: null,
      notifications: null,
      usefulLinks: [],
      appWorkspaces: {},
      stats: {},
      colleagues: [],
      colleaguesLoaded: false,
      selectedColleague: null,
      payroll: normalizePayroll({}),
      payrollTab: "paystubs",
      hr: normalizeHrData({}),
      lastOutbound: null,
      lastInboundAt: null
    };

    function normalizeOrigin(value) {
      if (!value) return "";
      try {
        const url = new URL(value, window.location.href);
        return /^https?:$/.test(url.protocol) ? url.origin : "";
      } catch {
        return "";
      }
    }

    function resolveInitialParentOrigin() {
      const configured = normalizeOrigin(EMBED_CONFIG.parentOrigin);
      if (configured) return configured;
      const referrerOrigin = normalizeOrigin(document.referrer);
      return referrerOrigin || "*";
    }

    function isSafeNavigationPath(value) {
      const path = String(value || "").trim();
      if (!path || /^(javascript|data|vbscript):/i.test(path)) return false;
      if (path.startsWith("/") && !path.startsWith("//")) return true;
      try {
        const url = new URL(path);
        return url.protocol === "https:";
      } catch {
        return false;
      }
    }

    function safeImageSource(value) {
      const source = String(value || "").trim();
      if (!source) return "";
      if (/^data:image\/(?:png|jpe?g|gif|webp);base64,[a-z0-9+/=\s]+$/i.test(source)) return source;
      try {
        const url = new URL(source, window.location.href);
        return /^https?:$/.test(url.protocol) ? url.href : "";
      } catch {
        return "";
      }
    }

    function slugify(value, fallback) {
      const slug = String(value || "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      return slug || fallback;
    }

    function mapRoleName(value) {
      const normalized = String(value || "").trim().toLowerCase();
      const words = normalized.replace(/_/g, " ");
      if (!normalized) return null;
      if (words === "manager" || words.includes("operations manager") || words.includes("supervisor")) return "Manager";
      if (["hr admin", "hr manager", "payroll admin"].includes(words) || words.includes("human resources") || words.includes("hr administrator")) return "HR Admin";
      if (words === "driver" || words.includes("blue-collar") || words.includes("blue collar") || words.includes("coach driver")) return "Driver";
      return roles[value] ? value : null;
    }

    function inferRole(profile = {}) {
      if (profile.isHr || profile.isHR || profile.isAdmin || profile.isPayrollAdmin) return "HR Admin";
      if (profile.canManage || profile.isManager || profile.manager === true) return "Manager";
      const mapped = mapRoleName(profile.role || profile.systemRole || profile.position || profile.jobTitle);
      if (mapped) return mapped;
      return Object.keys(profile).length ? "Driver" : null;
    }

    function profileAccessTokens(profile = {}) {
      const sources = [
        profile.permissions,
        profile.permissionGroups,
        profile.allowedApps,
        profile.entitlements,
        profile.accessGroups,
        profile.roles,
        profile.role,
        profile.systemRole,
        profile.hrisSystemUserRole,
        profile.accessLevel
      ];
      const values = [];
      sources.forEach(source => {
        if (Array.isArray(source)) {
          source.forEach(value => values.push(value));
        } else if (source && typeof source === "object") {
          Object.entries(source).forEach(([key, enabled]) => {
            if (enabled === true || enabled === "true" || enabled === 1) values.push(key);
          });
        } else if (source !== undefined && source !== null) {
          values.push(...String(source).split(/[;,|]/));
        }
      });
      return values.map(value => String(value).trim().toLowerCase()).filter(Boolean);
    }

    function successFactorsAccess(profile = getProfile()) {
      const explicit = profile?.successFactorsAccess && typeof profile.successFactorsAccess === "object"
        ? profile.successFactorsAccess
        : {};
      const tokens = new Set(profileAccessTokens(profile).map(token => token.replace(/\s+/g, " ").trim()));
      const roleText = String(
        profile.role || profile.position || profile.jobTitle || profile.systemRole || profile.hrisSystemUserRole || ""
      ).trim().toLowerCase();

      const hasToken = (...values) => values.some(value => {
        const wanted = String(value || "").toLowerCase();
        return tokens.has(wanted) || tokens.has(wanted.replace(/ /g, "_")) || tokens.has(wanted.replace(/ /g, "-"));
      });

      const recruitingRole = /(recruit|talent acquisition|talent partner|candidate experience|staffing)/i.test(roleText);
      const badgeRole = /(badge|credential|identity admin)/i.test(roleText);
      const fullHrRole = /(human resources|people operations|people & culture|hr administrator|hr admin|hr director|head of hr|chief people|people director)/i.test(roleText);
      const executiveAdmin = /(super admin|administrator|founder|chief executive|\bceo\b|\bowner\b)/i.test(roleText);

      const explicitKeys = Object.keys(explicit);
      const explicitMode = explicitKeys.length > 0;
      const fullHr = explicitMode && Object.prototype.hasOwnProperty.call(explicit, "fullHr")
        ? explicit.fullHr === true
        : (fullHrRole || executiveAdmin || hasToken("hr", "hr_admin", "human resources", "people operations", "all"));

      const recruiting = Object.prototype.hasOwnProperty.call(explicit, "recruiting")
        ? explicit.recruiting === true
        : (fullHr || recruitingRole || hasToken("recruiting", "recruiter", "recruiting_admin", "talent acquisition", "careers_control", "careers-control", "all"));


      const badge = Object.prototype.hasOwnProperty.call(explicit, "badge")
        ? explicit.badge === true
        : (fullHr || badgeRole || hasToken("badge", "badge_generator", "badge-generator", "badge_control", "badge-control", "all"));

      const workforce = Object.prototype.hasOwnProperty.call(explicit, "workforce")
        ? explicit.workforce === true
        : fullHr;
      const employee = Object.prototype.hasOwnProperty.call(explicit, "employee")
        ? explicit.employee === true
        : fullHr;
      const organization = Object.prototype.hasOwnProperty.call(explicit, "organization")
        ? explicit.organization === true
        : fullHr;
      const performance = Object.prototype.hasOwnProperty.call(explicit, "performance")
        ? explicit.performance === true
        : fullHr;
      const access = Object.prototype.hasOwnProperty.call(explicit, "access")
        ? explicit.access === true
        : fullHr;

      return {
        fullHr,
        workforce,
        employee,
        organization,
        recruiting,
        performance,
        badge,
        access
      };
    }

    function canAccessHrModule(moduleId, profile = getProfile()) {
      const access = successFactorsAccess(profile);
      return access[moduleId] === true;
    }

    function allowedHrModules(profile = getProfile()) {
      return HR_MODULES.filter(([id]) => canAccessHrModule(id, profile));
    }

    function hasRecruitingAccess(profile = getProfile()) {
      return canAccessHrModule("recruiting", profile);
    }

    function hasHrAccess(profile = getProfile()) {
      if (!profile || typeof profile !== "object") return false;
      return allowedHrModules(profile).length > 0;
    }

    function normalizeAllowedRoles(item = {}, fallbackRole = currentUserRole) {
      const raw = item.allowedRoles || item.roles || item.allowedRole || item.roleKeys;
      const values = Array.isArray(raw) ? raw : raw ? [raw] : [];
      const mapped = values.map(mapRoleName).filter(Boolean);
      return mapped.length ? [...new Set(mapped)] : (fallbackRole ? [fallbackRole] : []);
    }

    function normalizeList(value) {
      if (Array.isArray(value)) return value.map(item => String(item ?? "").trim()).filter(Boolean);
      if (value === undefined || value === null || value === "") return [];
      if (typeof value === "object") return Object.entries(value).filter(([, enabled]) => enabled === true || enabled === "true" || enabled === 1).map(([key]) => key);
      return String(value).split(/[;,|]/).map(item => item.trim()).filter(Boolean);
    }

    function normalizeAudience(item = {}) {
      const scope = item.audience && typeof item.audience === "object" ? item.audience
        : item.scope && typeof item.scope === "object" ? item.scope
        : item.targeting && typeof item.targeting === "object" ? item.targeting
        : {};
      const pick = (...keys) => {
        for (const key of keys) {
          if (scope[key] !== undefined) return normalizeList(scope[key]);
          if (item[key] !== undefined) return normalizeList(item[key]);
        }
        return [];
      };
      return {
        allowedRoleIds: pick("allowedRoleIds", "roleIds", "jobRoleIds", "rolesCanonical"),
        allowedDepartmentIds: pick("allowedDepartmentIds", "departmentIds", "departments"),
        allowedDepartmentCodes: pick("allowedDepartmentCodes", "departmentCodes"),
        allowedBaseCodes: pick("allowedBaseCodes", "baseCodes", "bases", "markets"),
        allowedDestinationCodes: pick("allowedDestinationCodes", "destinationCodes", "destinations"),
        allowedAccessRoles: pick("allowedAccessRoles", "accessRoles", "alteaAccessRoles"),
        allowedCountries: pick("allowedCountries", "countryCodes", "countries"),
        permissionAny: pick("permissionAny", "permissionsAny", "anyPermissions"),
        permissionAll: pick("permissionAll", "permissionsAll", "allPermissions")
      };
    }

    function formatDateValue(value) {
      if (!value) return "";
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return String(value).slice(0, 24);
      return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
    }

    function normalizeNewsItem(item = {}, index = 0, fallbackRole = currentUserRole) {
      const themes = ["", "theme-teal", "theme-indigo", "theme-amber", "theme-slate"];
      const title = String(item.title || item.headline || "").trim();
      if (!title) return null;
      return {
        ...item,
        id: String(item.id || item._id || slugify(title, "news-" + index)),
        title,
        eyebrow: item.eyebrow || item.label || "",
        summary: item.summary || item.description || item.excerpt || "",
        date: item.dateLabel || formatDateValue(item.publishDate || item.createdAt || item.date) || "",
        category: item.category || item.type || "",
        icon: item.icon || (item.auto ? "settings" : "megaphone"),
        theme: item.theme !== undefined ? item.theme : themes[index % themes.length],
        imageUrl: safeImageSource(item.imageUrl || item.heroImageUrl || item.image || item.media?.url || ""),
        cta: item.cta || item.actionLabel || "Read",
        details: item.details || item.body || item.content || item.summary || item.description || "",
        allowedRoles: normalizeAllowedRoles(item, fallbackRole),
        ...normalizeAudience(item)
      };
    }

    function normalizeTaskItem(item = {}, index = 0, fallbackRole = currentUserRole) {
      const title = String(item.title || item.label || "").trim();
      if (!title) return null;
      return {
        ...item,
        id: String(item.id || item._id || slugify(title, "task-" + index)),
        title,
        description: item.description || item.summary || item.body || "",
        due: item.due || item.dueLabel || formatDateValue(item.dueDate) || "",
        priority: ["high", "medium", "normal"].includes(String(item.priority).toLowerCase()) ? String(item.priority).toLowerCase() : "normal",
        category: item.category || item.workflow || "",
        action: item.action || item.actionLabel || "Open",
        owner: item.owner || item.requestedBy || "",
        reference: item.reference || item.referenceId || item.id || "",
        icon: item.icon || "task",
        allowedRoles: normalizeAllowedRoles(item, fallbackRole),
        ...normalizeAudience(item)
      };
    }

    function normalizeAppItem(item = {}, index = 0, fallbackRole = currentUserRole) {
      const palette = [
        ["#0057d2", "#eaf3fc"],
        ["#046c7a", "#e2f4f6"],
        ["#5c4cc4", "#f0edff"],
        ["#a93e00", "#fff3e8"]
      ][index % 4];
      const title = String(item.title || item.name || item.label || "").trim();
      if (!title) return null;
      return {
        ...item,
        id: String(item.id || item._id || slugify(title, "app-" + index)),
        title,
        subtitle: item.subtitle || item.description || item.summary || "",
        icon: item.icon || "apps",
        color: item.color || palette[0],
        soft: item.soft || item.backgroundColor || palette[1],
        group: item.group || item.category || item.permissionGroup || "",
        metric: item.metric !== undefined ? String(item.metric) : (item.badge !== undefined ? String(item.badge) : ""),
        metricLabel: item.metricLabel || item.statusLabel || "",
        tag: item.tag || item.system || "",
        path: item.path || item.href || item.route || item.url || "",
        wide: Boolean(item.wide),
        allowedRoles: normalizeAllowedRoles(item, fallbackRole),
        ...normalizeAudience(item)
      };
    }

    function normalizeQuickAction(item = {}, index = 0, fallbackRole = currentUserRole) {
      const title = String(item.title || item.label || "").trim();
      const target = String(item.target || item.appId || item.id || "").trim();
      const path = String(item.path || item.href || item.route || "").trim();
      if (!title || (!target && !isSafeNavigationPath(path)) || (path && !isSafeNavigationPath(path))) return null;
      return {
        ...item,
        id: String(item.id || item._id || "quick-" + index),
        title,
        subtitle: item.subtitle || item.description || "",
        icon: item.icon || "apps",
        target,
        path,
        allowedRoles: normalizeAllowedRoles(item, fallbackRole),
        ...normalizeAudience(item)
      };
    }

    function normalizeNotification(item = {}, index = 0, fallbackRole = currentUserRole) {
      const title = String(item.title || item.label || "").trim();
      if (!title) return null;
      return {
        ...item,
        id: String(item.id || item._id || "notification-" + index),
        title,
        body: item.body || item.summary || item.description || "",
        time: item.time || item.timeLabel || formatDateValue(item.createdAt) || "",
        icon: item.icon || "bell",
        allowedRoles: normalizeAllowedRoles(item, fallbackRole),
        ...normalizeAudience(item)
      };
    }

    function sanitizeColleague(item = {}) {
      const displayName = String(item.displayName || item.fullName || item.name || [item.firstName, item.lastName].filter(Boolean).join(" ")).trim();
      if (!displayName) return null;
      return {
        displayName,
        firstName: item.firstName || "",
        lastName: item.lastName || "",
        jobTitle: item.jobTitle || item.position || item.role || "",
        roleId: item.roleId || item.jobRoleId || item.hrRoleId || "",
        departmentId: item.departmentId || item.assignedDepartmentId || item.hrDepartmentId || "",
        department: item.department || item.assignedDepartment || "",
        baseCode: item.baseCode || item.baseId || item.assignedBaseId || item.baseMarketCode || "",
        station: item.station || item.base || item.assignedBase || item.baseAirportIata || "",
        corporateEmailAddress: item.corporateEmailAddress || item.workEmail || item.companyEmail || item.email || "",
        workPhone: item.workPhone || item.phoneWork || item.officePhone || "",
        skId: item.skId || item.skID || item.employeeId || ""
      };
    }

    function normalizeUsefulLink(item = {}, index = 0, fallbackRole = currentUserRole) {
      const source = Array.isArray(item)
        ? { title: item[0], subtitle: item[1], path: item[2], icon: item[3] }
        : item;
      const title = String(source.title || source.label || "").trim();
      const path = String(source.path || source.href || source.route || "").trim();
      if (!title || !isSafeNavigationPath(path)) return null;
      return {
        id: String(source.id || source._id || "service-" + index),
        title,
        subtitle: source.subtitle || source.description || "",
        path,
        icon: source.icon || "apps",
        allowedRoles: normalizeAllowedRoles(source, fallbackRole),
        ...normalizeAudience(source)
      };
    }

    function normalizeWorkspace(item = {}) {
      return {
        heading: String(item.heading || item.title || "Application Data"),
        metrics: Array.isArray(item.metrics)
          ? item.metrics.filter(Array.isArray).map(metric => metric.slice(0, 3).map(displayPortalValue))
          : [],
        columns: Array.isArray(item.columns) ? item.columns.map(displayPortalValue) : [],
        rows: Array.isArray(item.rows)
          ? item.rows.filter(Array.isArray).map(row => row.map(displayPortalValue))
          : []
      };
    }

    function normalizePayroll(payload = {}) {
      const root = payload.payroll || payload || {};
      return {
        paystubs: Array.isArray(root.paystubs) ? root.paystubs : [],
        taxDocuments: Array.isArray(root.taxDocuments) ? root.taxDocuments : (Array.isArray(root.taxDocs) ? root.taxDocs : []),
        payrollProfile: root.payrollProfile || payload.payrollProfile || {},
        paymentPreference: root.paymentPreference || payload.paymentPreference || {},
        helpRequests: Array.isArray(root.helpRequests) ? root.helpRequests : [],
        profile: root.profile || payload.profile || {}
      };
    }

    function objectValue(value) {
      return value && typeof value === "object" && !Array.isArray(value) ? value : {};
    }

    function arrayValue(...values) {
      const value = values.find(Array.isArray);
      return value ? value.filter(item => item !== undefined && item !== null) : [];
    }

    function normalizeRecruiting(payload = {}) {
      const root = objectValue(payload);
      return {
        profile: objectValue(root.profile),
        settings: objectValue(root.settings),
        candidates: arrayValue(root.candidates, root.applicants, root.items),
        historySegments: arrayValue(root.historySegments, root.employmentHistory),
        historyGaps: arrayValue(root.historyGaps, root.gaps),
        documents: arrayValue(root.documents),
        jobPostings: arrayValue(root.jobPostings, root.jobs),
        interviews: arrayValue(root.interviews, root.tests),
        vettingCases: arrayValue(root.vettingCases, root.securityChecks),
        trainingRecords: arrayValue(root.trainingRecords, root.training),
        onboardingTasks: arrayValue(root.onboardingTasks, root.onboarding),
        auditEvents: arrayValue(root.auditEvents, root.audit),
        integrationSnapshots: arrayValue(root.integrationSnapshots, root.integrations),
        documentRequirements: arrayValue(root.documentRequirements),
        documentTemplates: arrayValue(root.documentTemplates),
        documentPackets: arrayValue(root.documentPackets),
        documentPacketItems: arrayValue(root.documentPacketItems),
        outboundMessages: arrayValue(root.outboundMessages, root.outbox),
        emailIdentities: arrayValue(root.emailIdentities),
        mailboxThreads: arrayValue(root.mailboxThreads, root.careerMailboxThreads),
        mailboxMessages: arrayValue(root.mailboxMessages, root.careerMailboxMessages),
        viewState: objectValue(root.viewState)
      };
    }


    function normalizeHrData(payload = {}) {
      const container = objectValue(payload.hr) && Object.keys(objectValue(payload.hr)).length
        ? objectValue(payload.hr)
        : objectValue(payload.hrData) && Object.keys(objectValue(payload.hrData)).length
          ? objectValue(payload.hrData)
          : objectValue(payload.humanResources) && Object.keys(objectValue(payload.humanResources)).length
            ? objectValue(payload.humanResources)
            : objectValue(payload);
      const recruitingSource = objectValue(container.recruiting);
      const careersSource = Object.keys(recruitingSource).length ? recruitingSource : objectValue(container.careers);
      const reports = objectValue(container.reports);
      const access = objectValue(container.access);
      const hrItems = Array.isArray(container.items) && container.items.some(item =>
        item && typeof item === "object" && (item.skId || item.employeeId || item.employeeNumber || item.employmentStatus || item.jobTitle)
      ) ? container.items : [];
      const recruitingPayload = Object.keys(careersSource).length
        ? careersSource
        : hasOwnAny(container, ["candidates", "applicants", "jobPostings", "jobs", "historySegments", "vettingCases", "onboardingTasks"])
          ? container
          : {};
      return {
        authorized: container.authorized !== false,
        staff: arrayValue(container.staff, container.employees, hrItems, payload.hrStaff),
        archive: arrayValue(container.archive, container.archivedStaff, container.archivedEmployees),
        organization: (() => {
          const direct = arrayValue(container.organization, container.orgChart, container.reportingLines);
          if (direct.length) return direct;
          const summary = objectValue(container.organization);
          const departments = arrayValue(summary.departments).map(item => ({
            type: "Department",
            name: item.name || item.department || "",
            employees: item.count ?? item.employees ?? 0,
            active: item.active ?? 0,
            inactive: item.inactive ?? 0
          }));
          const stations = arrayValue(summary.stations).map(item => ({
            type: "Station",
            name: item.name || item.station || "",
            employees: item.count ?? item.employees ?? 0
          }));
          return [...departments, ...stations];
        })(),
        reports: {
          ...reports,
          goals: arrayValue(reports.goals, container.goals),
          qualifications: arrayValue(reports.qualifications, container.qualifications),
          expiries: arrayValue(reports.expiries, reports.expiring, container.expiries),
          training: arrayValue(reports.training, container.trainingReports),
          compliance: arrayValue(reports.compliance, container.complianceReports)
        },
        notes: arrayValue(container.notes, container.auditNotes, container.learningNotes),
        recruiting: normalizeRecruiting(recruitingPayload),
        access: {
          ...access,
          roles: arrayValue(access.roles, container.roles),
          permissionCatalog: arrayValue(access.permissionCatalog),
          portalResults: arrayValue(access.portalResults, container.portalResults)
        },
        selectedId: String(container.selectedId || container.selectedEmployeeId || ""),
        lastUpdatedAt: container.lastUpdatedAt || container.updatedAt || ""
      };
    }

    function mergeArrayField(current, incoming) {
      return Array.isArray(incoming) ? incoming : (Array.isArray(current) ? current : []);
    }

    function hasOwnAny(object, keys) {
      return keys.some(key => Object.prototype.hasOwnProperty.call(object, key));
    }

    function mergeNormalizedSection(current, next, raw, aliases, objectKeys = [], stringKeys = []) {
      const merged = { ...current };
      Object.entries(aliases).forEach(([normalizedKey, sourceKeys]) => {
        if (hasOwnAny(raw, sourceKeys)) merged[normalizedKey] = next[normalizedKey];
      });
      objectKeys.forEach(key => {
        if (Object.prototype.hasOwnProperty.call(raw, key)) merged[key] = next[key];
      });
      stringKeys.forEach(key => {
        if (Object.prototype.hasOwnProperty.call(raw, key)) merged[key] = next[key];
      });
      return merged;
    }

    function mergeHrData(current = normalizeHrData({}), incoming = {}) {
      const next = normalizeHrData(incoming);
      const source = objectValue(incoming.hr) && Object.keys(objectValue(incoming.hr)).length
        ? objectValue(incoming.hr)
        : objectValue(incoming.hrData) && Object.keys(objectValue(incoming.hrData)).length
          ? objectValue(incoming.hrData)
          : objectValue(incoming);
      const recruitingSource = objectValue(source.recruiting);
      const careersSource = Object.keys(recruitingSource).length ? recruitingSource : objectValue(source.careers);
      const mergedRecruiting = Object.keys(careersSource).length ? mergeNormalizedSection(
        current.recruiting,
        next.recruiting,
        careersSource,
        {
          candidates: ["candidates", "applicants", "items"],
          historySegments: ["historySegments", "employmentHistory"],
          historyGaps: ["historyGaps", "gaps"],
          documents: ["documents"],
          jobPostings: ["jobPostings", "jobs"],
          interviews: ["interviews", "tests"],
          vettingCases: ["vettingCases", "securityChecks"],
          trainingRecords: ["trainingRecords", "training"],
          onboardingTasks: ["onboardingTasks", "onboarding"],
          auditEvents: ["auditEvents", "audit"],
          integrationSnapshots: ["integrationSnapshots", "integrations"],
          documentRequirements: ["documentRequirements"],
          documentTemplates: ["documentTemplates"],
          documentPackets: ["documentPackets"],
          documentPacketItems: ["documentPacketItems"],
          outboundMessages: ["outboundMessages", "outbox"],
          emailIdentities: ["emailIdentities"],
          mailboxThreads: ["mailboxThreads", "careerMailboxThreads"],
          mailboxMessages: ["mailboxMessages", "careerMailboxMessages"]
        },
        ["profile", "settings", "viewState"]
      ) : current.recruiting;
      return {
        ...current,
        ...next,
        authorized: Object.prototype.hasOwnProperty.call(source, "authorized") ? next.authorized : current.authorized,
        staff: mergeArrayField(current.staff, Array.isArray(source.staff) ? source.staff : (Array.isArray(source.employees) ? source.employees : (Array.isArray(source.items) ? source.items : undefined))),
        archive: mergeArrayField(current.archive, Array.isArray(source.archive) ? source.archive : (Array.isArray(source.archivedStaff) ? source.archivedStaff : undefined)),
        organization: mergeArrayField(current.organization, Array.isArray(source.organization) ? source.organization : (Array.isArray(source.orgChart) ? source.orgChart : undefined)),
        notes: mergeArrayField(current.notes, Array.isArray(source.notes) ? source.notes : (Array.isArray(source.auditNotes) ? source.auditNotes : undefined)),
        reports: Object.keys(objectValue(source.reports)).length ? next.reports : current.reports,
        recruiting: mergedRecruiting,
        access: Object.keys(objectValue(source.access)).length ? { ...current.access, ...next.access } : current.access,
        selectedId: hasOwnAny(source, ["selectedId", "selectedEmployeeId"]) ? next.selectedId : current.selectedId,
        lastUpdatedAt: hasOwnAny(source, ["lastUpdatedAt", "updatedAt"]) ? next.lastUpdatedAt : current.lastUpdatedAt
      };
    }

    function getProfile() {
      return portalState.profile || {};
    }

    function collectionItems(collection) {
      const stateKeys = {
        newsItems: "news",
        toDoTasks: "tasks",
        applicationTiles: "apps",
        quickActions: "quickActions",
        notifications: "notifications"
      };
      const stateKey = stateKeys[collection];
      const imported = stateKey ? portalState[stateKey] : null;
      return Array.isArray(imported) ? imported : (EMPTY_COLLECTIONS[collection] || []);
    }

    function clearPortalData(status = "waiting", error = null) {
      currentUserRole = null;
      currentView = "home";
      currentAppId = null;
      currentNewsIndex = 0;
      directoryQuery = "";
      currentHrView = "workforce";
      currentHrEmployeeTab = "personal";
      currentRecruitingView = "dashboard";
      currentPerformanceView = "reports";
      hrWorkforceScope = "active";
      hrSearchQuery = "";
      hrSelectedEmployeeId = "";
      hrSelectedCandidateId = "";
      hrSelectedJobId = "";
      hrEmployeeDraftMode = false;
      badgeSelectedId = "";
      badgeManualOpen = false;
      badgeShowBack = false;
      badgeOverride = {};
      portalState.status = status;
      portalState.error = error;
      portalState.connected = false;
      pendingPreconnectMessages.splice(0, pendingPreconnectMessages.length);
      pendingPortalMutations.forEach(item => window.clearTimeout(item.timeout));
      pendingPortalMutations.clear();
      confirmedPortalSelections = Object.fromEntries(selectionKeys.map(key => [key, []]));
      portalState.importedRole = null;
      portalState.profile = null;
      portalState.apps = [];
      portalState.news = [];
      portalState.tasks = [];
      portalState.quickActions = [];
      portalState.notifications = [];
      portalState.usefulLinks = [];
      portalState.appWorkspaces = {};
      portalState.stats = {};
      portalState.colleagues = [];
      portalState.colleaguesLoaded = false;
      portalState.selectedColleague = null;
      portalState.payroll = normalizePayroll({});
      portalState.hr = normalizeHrData({});
      portalState.lastOutbound = null;
      completedTasks.clear();
      dismissedTasks.clear();
      favoriteApps.clear();
      readNotifications.clear();
      closeShellPopovers();
      if (document.getElementById("modalRoot")) closeDialog();
    }

    function importBootstrap(payload = {}, origin = "") {
      const profile = payload.profile && typeof payload.profile === "object" ? payload.profile : null;
      const importedRole = mapRoleName(payload.currentUserRole || payload.role) || inferRole(profile || {});
      portalState.lastInboundAt = new Date().toISOString();

      if (!profile || !importedRole) {
        clearPortalData("error", "The bootstrap response did not include an authenticated employee profile and supported role.");
        return portalState;
      }

      currentUserRole = importedRole;
      portalState.status = "ready";
      portalState.error = null;
      portalState.connected = true;
      portalState.importedRole = importedRole;
      portalState.profile = profile;
      const rawApps = Array.isArray(payload.apps) ? payload.apps : Array.isArray(payload.applications) ? payload.applications : [];
      portalState.apps = rawApps.map((item, index) => normalizeAppItem(item, index, importedRole)).filter(Boolean);
      const rawNews = [
        ...(Array.isArray(payload.news) ? payload.news : []),
        ...(Array.isArray(payload.companyNews) ? payload.companyNews : []),
        ...(Array.isArray(payload.announcements) ? payload.announcements : []),
        ...(Array.isArray(payload.departmentNews) ? payload.departmentNews : []),
        ...(Array.isArray(payload.baseNews) ? payload.baseNews : [])
      ];
      portalState.news = [...new Map(
        rawNews
          .map((item, index) => normalizeNewsItem(item, index, importedRole))
          .filter(Boolean)
          .map(item => [item.id, item])
      ).values()];
      const rawTasks = Array.isArray(payload.toDoTasks)
        ? payload.toDoTasks
        : Array.isArray(payload.tasks)
          ? payload.tasks
          : Array.isArray(payload.approvals)
            ? payload.approvals
            : null;
      portalState.tasks = rawTasks
        ? rawTasks.map((item, index) => normalizeTaskItem(item, index, importedRole)).filter(Boolean)
        : [];
      portalState.quickActions = Array.isArray(payload.quickActions)
        ? payload.quickActions.map((item, index) => normalizeQuickAction(item, index, importedRole)).filter(Boolean)
        : [];
      portalState.notifications = Array.isArray(payload.notifications)
        ? payload.notifications.map((item, index) => normalizeNotification(item, index, importedRole)).filter(Boolean)
        : [];
      const rawLinks = Array.isArray(payload.usefulLinks)
        ? payload.usefulLinks
        : Array.isArray(payload.links)
          ? payload.links
          : [];
      portalState.usefulLinks = rawLinks.map((item, index) => normalizeUsefulLink(item, index, importedRole)).filter(Boolean);
      const rawWorkspaces = payload.appWorkspaces && typeof payload.appWorkspaces === "object"
        ? payload.appWorkspaces
        : payload.applicationData && typeof payload.applicationData === "object"
          ? payload.applicationData
          : {};
      portalState.appWorkspaces = Object.fromEntries(
        Object.entries(rawWorkspaces).map(([id, workspace]) => [String(id), normalizeWorkspace(workspace)])
      );
      portalState.stats = payload.stats || {};
      portalState.payroll = normalizePayroll(payload);
      portalState.hr = hasHrAccess(profile) ? normalizeHrData(payload) : normalizeHrData({});
      if (!hasHrAccess(profile) && currentView === "hr") {
        currentView = "home";
        currentAppId = null;
        history.replaceState(null, "", routeHash("home"));
      }
      portalState.colleagues = Array.isArray(payload.colleagues)
        ? payload.colleagues.map(sanitizeColleague).filter(Boolean)
        : [];
      portalState.colleaguesLoaded = Array.isArray(payload.colleagues);
      if (origin && origin !== "null") parentOrigin = origin;
      completedTasks.clear();
      dismissedTasks.clear();
      readNotifications.clear();
      if (Array.isArray(payload.completedTaskIds)) {
        payload.completedTaskIds.forEach(id => completedTasks.add(String(id)));
      }
      if (Array.isArray(payload.dismissedTaskIds)) {
        payload.dismissedTaskIds.forEach(id => dismissedTasks.add(String(id)));
      }
      if (Array.isArray(payload.readNotificationIds)) {
        payload.readNotificationIds.forEach(id => readNotifications.add(String(id)));
      }
      favoriteApps.clear();
      if (Array.isArray(payload.favoriteApps)) {
        payload.favoriteApps.forEach(id => favoriteApps.add(String(id)));
      }
      selectionKeys.forEach(key => {
        confirmedPortalSelections[key] = Array.isArray(payload[key]) ? payload[key].map(String) : [];
      });
      restorePortalSelections();
      currentNewsIndex = 0;
      taskFilter = "open";
      appGroupFilter = "All";
      currentHrView = "workforce";
      currentHrEmployeeTab = "personal";
      currentRecruitingView = "dashboard";
      currentPerformanceView = "reports";
      hrWorkforceScope = "active";
      hrSearchQuery = "";
      hrEmployeeDraftMode = false;
      const importedEmployeeId = portalState.hr.selectedId;
      hrSelectedEmployeeId = importedEmployeeId || "";
      badgeSelectedId = "";
      badgeOverride = {};
      badgeShowBack = false;
      return portalState;
    }

    function post(type, payload = {}) {
      if (["HR_STAFF_SAVE", "HR_GENERATE_SKID", "HR_STAFF_ARCHIVE", "HR_PRINT_BADGE", "HR_ORG_ASSIGN", "HR_WIX_MEMBER_PROVISION", "HR_BADGE_CONTROL_SAVE"].includes(type) && !canManageHrRecords()) {
        showToast("Read-only access", "Your current permission does not allow this change.", "warning");
        return null;
      }
      const message = {
        source: SOURCE,
        type,
        payload,
        timestamp: new Date().toISOString()
      };
      portalState.lastOutbound = message;
      window.parent.postMessage(message, "*");
      window.dispatchEvent(new CustomEvent("skandi:outbound", { detail: message }));
      return message;
    }

    function postPayroll(type, payload = {}) {
      return post(type, payload);
    }

    function onParentMessage(event) {
      const data = event.data || {};
      if (window.parent !== window && event.source !== window.parent) return;
      if (data.source !== PARENT_SOURCE) return;
      const incomingOrigin = normalizeOrigin(event.origin);
      const configuredOrigin = normalizeOrigin(EMBED_CONFIG.parentOrigin);

      // Wix Preview and Live can host the parent on different origins.
      // If an explicit origin is configured, enforce it. Otherwise event.source
      // must be window.parent and data.source must be SKANDI_WIX_PARENT.
      if (configuredOrigin && incomingOrigin !== configuredOrigin) return;
      if (incomingOrigin) parentOrigin = incomingOrigin;

      const payload = data.payload || {};

      if (data.type === "SKANDI_MASTER_CONFIG") {
        masterConfig = payload && typeof payload === "object" ? payload : { routes: {}, internal: {}, brand: {} };
        renderPortal();
        return;
      }

      if (data.type === "SKANDI_MASTER_NAVIGATION") {
        masterNavigation = payload && typeof payload === "object" ? payload : { routes: {}, internal: {} };
        return;
      }

      if (data.type === "RIAINTRA_HEADER_STATE") {
        return;
      }

      if (data.type === "SUCCESSFACTORS_HOST_READY") {
        post("SKANDI_MASTER_CONFIG_REQUEST", { requestedAt: new Date().toISOString(), component: "SUCCESSFACTORS" });
        post("MASTER_NAVIGATION_REQUEST", { requestedAt: new Date().toISOString(), component: "SUCCESSFACTORS" });
        post("INTRANET_READY", { requestedAt: new Date().toISOString(), reason: "HOST_READY" });
        post("HR_READY", { requestedAt: new Date().toISOString(), reason: "HOST_READY" });
        return;
      }

      if (data.type === "INTRANET_BOOTSTRAP") {
        if (payload.partial === true) {
          if (portalState.connected) confirmPortalSelections(payload);
          return;
        }
        importBootstrap(payload, incomingOrigin);
        parseRoute();
        renderPortal();
        if (portalState.connected) {
          // HR_READY and INTRANET_READY share one backend request. The HR
          // responses may have arrived first; apply them now that profile and
          // permissions are known instead of silently dropping them.
          replayPreconnectMessages();
          if (hasRecruitingAccess()) {
            post("CAREERS_READY", {
              embeddedIn: "SKANDI_SUCCESSFACTORS",
              requestedAt: new Date().toISOString()
            });
          }
          showToast("Employee data loaded", "RIAINTRA content and role permissions are current.", "info");
        }
        return;
      }

      if (data.type === "INTRANET_SESSION_EXPIRED" || data.type === "INTRANET_SIGNED_OUT") {
        clearPortalData("error", payload.message || "The authenticated employee session has ended.");
        history.replaceState(null, "", routeHash("home"));
        renderPortal();
        const routes = masterRoutes();
        requestMasterNavigation(
          payload.redirectPath && isSafeNavigationPath(payload.redirectPath)
            ? payload.redirectPath
            : (routes.staffLogin || routes.riaintra || "/riaintra")
        );
        return;
      }

      // A portal/bootstrap failure is fatal. Module-level failures are not:
      // a recruiter error must never take the rest of SuccessFactors offline.
      if (data.type === "INTRANET_ERROR") {
        if (portalState.connected && payload.action && !["INTRANET_READY", "INTRANET_REFRESH"].includes(payload.action)) {
          if (portalMutationTypes.has(payload.action)) {
            settlePortalMutation(payload.requestId);
            restorePortalSelections();
          }
          renderPortal();
          showToast("Update failed", payload.message || "The backend did not confirm this action.", "warning");
          return;
        }
        clearPortalData(
          "error",
          payload.message || "SuccessFactors could not load the employee profile."
        );
        renderPortal();
        return;
      }

      if (!portalState.connected) {
        if (preconnectMessageTypes.has(data.type)) {
          queuePreconnectMessage(data, payload, incomingOrigin);
        }
        return;
      }

      if (data.type === "CAREERS_ERROR") {
        if (hasRecruitingAccess()) {
          showToast("Recruiting action failed", payload.message || "The recruiting backend rejected the request.", "warning");
        }
        return;
      }


      if (data.type === "HR_ERROR") {
        if (hasHrAccess()) showToast("HR action failed", payload.message || "HR Administration rejected the request.", "warning");
        return;
      }

      if (data.type === "HR_SESSION") {
        if (!hasHrAccess()) return;
        portalState.hr = { ...portalState.hr, authorized: payload.authorized !== false };
        if (payload.authorized === false) {
          portalState.hr = normalizeHrData({ authorized: false });
          if (currentView === "hr") {
            history.replaceState(null, "", routeHash("home"));
            currentView = "home";
          }
          showToast("HR access unavailable", payload.message || "Your current permission set does not authorize HR Administration.", "warning");
        }
        renderPortal();
        return;
      }

      if (["HR_BOOTSTRAP", "HR_DATA", "INTRANET_HR_DATA", "HR_STAFF_LIST"].includes(data.type)) {
        if (!hasHrAccess()) return;
        portalState.hr = mergeHrData(portalState.hr, payload);
        if (!hrSelectedEmployeeId && portalState.hr.selectedId) hrSelectedEmployeeId = portalState.hr.selectedId;
        renderPortal();
        return;
      }

      if (data.type === "HR_ORG_CATALOG") {
        if (!hasHrAccess()) return;
        portalState.hr = { ...portalState.hr, orgCatalog: payload || {} };
        renderPortal();
        return;
      }

      if (data.type === "HR_REPORTS") {
        if (!hasHrAccess()) return;
        portalState.hr = {
          ...portalState.hr,
          reports: normalizeHrData({ reports: payload }).reports
        };
        renderPortal();
        return;
      }

      if (["CAREERS_BOOTSTRAP", "CAREERS_DATA", "CAREERS_REFRESH_RESULT"].includes(data.type)) {
        if (!hasRecruitingAccess()) return;
        portalState.hr = mergeHrData(portalState.hr, { careers: payload });
        renderPortal();
        return;
      }


      if (["HR_STAFF_SAVED", "HR_ORGANIZATION_SAVED", "HR_WIX_RESULT", "HR_BADGE_PRINTED", "HR_BADGE_CONTROL_SAVED", "CAREERS_SAVED", "CAREERS_ACTION_OK"].includes(data.type)) {
        if (data.type.startsWith("CAREERS_") && !hasRecruitingAccess()) return;
        if (data.type.startsWith("HR_") && !hasHrAccess()) return;
        if (payload.item && data.type.startsWith("HR_")) {
          const savedId = hrRecordId(payload.item);
          if (savedId) {
            const remaining = portalState.hr.staff.filter(item => hrRecordId(item) !== savedId);
            portalState.hr = { ...portalState.hr, staff: [payload.item, ...remaining] };
            hrSelectedEmployeeId = savedId;
          }
          hrEmployeeDraftMode = false;
        }
        showToast("HR action completed", payload.message || "The backend confirmed the update.");
        post(data.type.startsWith("CAREERS_") ? "CAREERS_REFRESH" : "HR_REFRESH", {
          selectedId: hrSelectedEmployeeId || ""
        });
        renderPortal();
        return;
      }

      if (data.type === "HR_SKID_GENERATED") {
        if (!hasHrAccess()) return;
        if (hrSelectedEmployeeId && payload.skId) {
          portalState.hr = {
            ...portalState.hr,
            staff: portalState.hr.staff.map(item => hrRecordId(item) === hrSelectedEmployeeId ? { ...item, skId: payload.skId } : item)
          };
        }
        const input = document.querySelector("[name='skId']");
        if (input) input.value = payload.skId || "";
        showToast("Employee ID generated", payload.skId || "The generated identifier is ready.", "info");
        return;
      }

      if (data.type === "INTRANET_COLLEAGUES") {
        const colleagues = Array.isArray(payload.items)
          ? payload.items
          : Array.isArray(payload.colleagues)
            ? payload.colleagues
            : [];
        portalState.colleagues = colleagues.map(sanitizeColleague).filter(Boolean);
        portalState.colleaguesLoaded = true;
        portalState.selectedColleague = null;
        currentView = "directory";
        currentAppId = null;
        history.replaceState(null, "", routeHash("directory"));
        renderPortal();
        return;
      }

      if (data.type === "INTRANET_PROFILE_SAVED") {
        if (payload.profile) portalState.profile = { ...(portalState.profile || {}), ...payload.profile };
        if (!hasHrAccess()) {
          portalState.hr = normalizeHrData({});
          if (currentView === "hr") {
            currentView = "home";
            history.replaceState(null, "", routeHash("home"));
          }
        }
        showToast("Profile saved", "Your self-service details were saved successfully.");
        post("INTRANET_REFRESH");
        renderPortal();
        return;
      }

      if (data.type === "PAYROLL_PAYMENT_SAVED" || data.type === "PAYROLL_PAYMENT_PREF_SAVED") {
        const saved = payload.item || payload.paymentPreference || {};
        portalState.payroll.paymentPreference = { ...portalState.payroll.paymentPreference, ...saved };
        showToast("Payment preference saved", "Payroll routing details were updated.");
        renderPortal();
        return;
      }


    }

    const defaultWorkspaceData = Object.freeze({
      heading: "Application Data",
      metrics: Object.freeze([]),
      rows: Object.freeze([]),
      columns: Object.freeze([])
    });

    const profileTabs = [
      ["personal", "Personal Information"],
      ["employment", "Employment Information"],
      ["time", "Time Off"],
      ["license", "License & Certs"],
      ["talent", "Talent Profile"],
      ["scorecard", "Scorecard"],
      ["notes", "Notes"],
      ["compensation", "Compensation Statement"]
    ];

    const profileFieldGroups = [
      {
        id: "national",
        tab: "personal",
        title: "National ID Information",
        control: "HR controlled",
        fields: [
          ["National ID Country", ["nationalIdCountry", "nationalIdCountryCode"]],
          ["National ID Type", ["nationalIdType"]],
          ["National ID / Last 4", ["nationalIdLast4", "nationalIdNumberLast4", "nationalId"]],
          ["Passport Country", ["passportCountry", "passportIssuingCountry"]],
          ["Passport Number / Last 4", ["passportNumberLast4", "passportLast4", "passportNumber"]],
          ["Passport Issue Date", ["passportIssueDate"]],
          ["Passport Expiry Date", ["passportExpiryDate", "passportExpirationDate"]],
          ["Work Permit Type", ["workPermitType", "visaType"]],
          ["Work Permit / Visa Number", ["workPermitNumberLast4", "workPermitLast4", "workPermitNumber", "visaNumber"]],
          ["Work Permit Issue Date", ["workPermitIssueDate"]],
          ["Work Permit Expiry Date", ["workPermitExpiryDate", "visaExpiryDate"]],
          ["Work Eligibility Status", ["workEligibilityStatus", "visaStatus"]]
        ]
      },
      {
        id: "address",
        tab: "personal",
        title: "Address & Contact Information",
        control: "Employee self-service + HR controlled",
        fields: [
          ["Effective As Of", ["addressEffectiveDate", "homeAddressEffectiveDate", "effectiveDate"]],
          ["Address Type", ["addressType"]],
          ["Residential Street", ["homeAddressStreet", "street", "addressLine1", "mailingAddressLine1"]],
          ["Address Line 2", ["homeAddressLine2", "addressLine2", "mailingAddressLine2"]],
          ["City", ["homeAddressCity", "city", "mailingCity"]],
          ["State / Province", ["homeAddressState", "state", "province", "mailingState"]],
          ["Postal / ZIP", ["homeAddressPostalCode", "postalCode", "zip", "mailingPostalCode"]],
          ["Country", ["homeAddressCountry", "country", "mailingCountry"]],
          ["Personal Mobile", ["phone", "personalMobile", "mobilePhone", "personalPhone"]],
          ["Primary Contact Email", ["primaryContactEmail", "personalEmail", "email", "wixMemberEmail"]],
          ["Corporate Email", ["corporateEmailAddress", "workEmail", "companyEmail"]],
          ["Wix Member ID", ["wixMemberId", "memberId"]]
        ]
      },
      {
        id: "personal",
        tab: "personal",
        title: "Personal & Emergency Information",
        control: "Employee self-service + HR controlled",
        fields: [
          ["First Name", ["firstName"]],
          ["Middle Name", ["middleName"]],
          ["Last Name", ["lastName"]],
          ["Full Name", ["fullName", "displayName", "name"]],
          ["Preferred Name", ["preferredName"]],
          ["Formal Name", ["formalName"]],
          ["Emergency Contact Name", ["emergencyContactName"]],
          ["Emergency Relationship", ["emergencyContactRelationship"]],
          ["Emergency Priority Phone", ["emergencyContactPhone"]],
          ["Second Emergency Contact", ["emergencyContact2Name", "emergencyContact2Relationship", "emergencyContact2Phone"]]
        ]
      },
      {
        id: "employment",
        tab: "employment",
        title: "Employment Information",
        control: "HR controlled",
        fields: [
          ["SK-ID", ["skId", "skID", "staffId"]],
          ["Employee ID", ["employeeId", "employeeNumber", "_id"]],
          ["Agent ID", ["agentId", "cmsAgentId"]],
          ["Role", ["role", "position", "systemRole"]],
          ["Job Title", ["jobTitle", "positionTitle", "title"]],
          ["Job Code", ["jobCode", "roleId"]],
          ["Assigned Department", ["assignedDepartment", "department", "departmentName"]],
          ["Department Code", ["departmentCode", "departmentId"]],
          ["Assigned Base", ["assignedBase", "station", "base", "baseAirportIata"]],
          ["Base Code", ["baseCode", "assignedBaseId"]],
          ["Base Airport IATA", ["baseAirportIata", "stationIata"]],
          ["Current Base Seniority Date", ["currentBaseSeniorityDate", "baseSeniorityDate", "hireDate"]],
          ["Date of Hire", ["hireDate", "startDate", "employmentStartDate"]],
          ["Employment Status", ["employmentStatus", "status", "activeStatus"]],
          ["Classification Status", ["classificationStatus", "employmentType", "contractType", "workerType"]],
          ["Manager Name", ["managerName", "reportsToName"]],
          ["Manager SK-ID", ["managerSkId", "managerEmployeeId"]],
          ["Manager Email", ["managerEmail", "reportsTo"]],
          ["Access Role", ["accessRole", "alteaAccessRole"]],
          ["Permission Preset", ["permissionPreset", "accessPreset"]],
          ["Company / Legal Entity", ["company", "legalEntity", "businessUnit"]],
          ["Cost Center", ["costCenter", "costCentre"]],
          ["Employment Country", ["employmentCountry", "countryOfEmployment"]],
          ["Tax Country", ["taxCountry"]],
          ["Tax Region", ["taxRegion"]],
          ["Standard Weekly Hours", ["standardWeeklyHours", "weeklyHours", "contractedHours", "hoursPerWeek"]],
          ["Contracted Monthly Hours", ["contractedMonthlyHours", "monthlyContractHours"]],
          ["FTE Percent", ["ftePercent", "fte", "fullTimeEquivalent"]],
          ["Roster Group", ["rosterGroup", "scheduleGroup"]]
        ]
      },
      {
        id: "attendance",
        tab: "time",
        title: "Time & Attendance Ledger",
        control: "My Roster controlled",
        fields: [
          ["This Month Clocked Hours", ["monthlyClockedHours", "currentMonthHours", "rosterMonthlyHours", "clockedHoursMonth"]],
          ["Approved Hours", ["approvedHours", "monthlyApprovedHours"]],
          ["Scheduled Hours", ["scheduledHours", "monthlyScheduledHours"]],
          ["Accumulated Overtime", ["accumulatedOvertime", "overtimeHours", "monthlyOvertimeHours", "totalOvertimeHours"]],
          ["Night-Shift Premium Hours", ["nightShiftPremiumHours", "nightPremiumHours", "monthlyNightHours"]],
          ["Holiday Hours", ["holidayHours", "monthlyHolidayHours"]],
          ["Holiday Pay Multiplier", ["holidayPayMultiplier", "holidayMultiplier", "holidayPayRate"]],
          ["Absence Hours", ["absenceHours", "monthlyAbsenceHours"]],
          ["Late Minutes", ["lateMinutes", "monthlyLateMinutes"]],
          ["Missed Punch Count", ["missedPunchCount", "monthlyMissedPunches"]],
          ["Manager Correction Required", ["managerCorrectionRequired", "timeCorrectionRequired"]],
          ["Exact Clocked Time Stamps", ["clockedTimeStamps", "lastClockEvents", "timeClockLogs", "myRosterLogs"]],
          ["Last Roster Sync", ["lastRosterSyncAt", "lastSyncedAt"]]
        ]
      },
      {
        id: "time-off",
        tab: "time",
        title: "Time Off Balances",
        control: "My Roster controlled",
        fields: [
          ["Annual Leave Hours", ["annualLeaveHours", "vacationBalanceHours"]],
          ["Personal Leave Hours", ["personalLeaveHours"]],
          ["Sick Leave Hours", ["sickLeaveHours"]],
          ["Holiday Balance Hours", ["holidayBalanceHours"]],
          ["Unpaid Leave Hours", ["unpaidLeaveHours"]],
          ["Balance As Of", ["timeOffAsOfDate", "asOfDate"]]
        ]
      },
      {
        id: "license",
        tab: "license",
        title: "Licenses, Badges & Clearances",
        control: "HR / airport authority controlled",
        fields: [
          ["Airport Badge Required", ["airportBadgeRequired"]],
          ["Airport Security Badge Status", ["airportBadgeStatus", "airportSecurityBadgeStatus", "securityBadgeStatus", "badgeStatus"]],
          ["Airport Badge Authority", ["airportBadgeAuthority", "airportAuthority", "badgeAuthority", "authority"]],
          ["Airport Badge Number / Last 4", ["airportBadgeNumberLast4", "airportSecurityBadgeNumber", "badgeNumber", "badgeId"]],
          ["Airport Badge Issue Date", ["airportBadgeIssueDate", "airportSecurityBadgeIssue"]],
          ["Airport Badge Expiry Date", ["airportBadgeExpiryDate", "airportSecurityBadgeExpiry", "badgeExpiry"]],
          ["Avinor Badge Status", ["avinorBadgeStatus"]],
          ["Avinor Badge Expiry", ["avinorBadgeExpiry", "avinorBadgeExpiryDate"]],
          ["Swedavia Badge Status", ["swedaviaBadgeStatus"]],
          ["Swedavia Badge Expiry", ["swedaviaBadgeExpiry", "swedaviaBadgeExpiryDate"]],
          ["Airport Duty Certification", ["airportDutyCertified", "airportDutyCertification", "airportDutyCert"]],
          ["Airport Duty Cert Expiry", ["airportDutyCertExpiry"]],
          ["Tours Certification", ["tourGuideCertified", "tourCertification", "toursCertification"]],
          ["Tours Cert Country", ["tourGuideCertCountry", "tourCertCountry"]],
          ["Tours Cert Expiry", ["tourGuideCertExpiry", "tourCertExpiry"]],
          ["First Aid Certified", ["firstAidCertified"]],
          ["First Aid Expiry", ["firstAidExpiry"]],
          ["Driver License Required", ["driverLicenseRequired"]],
          ["Driver License Class", ["driverLicenseClass", "drivingLicenseClass"]],
          ["Driver License Expiry", ["driverLicenseExpiry", "drivingLicenseExpiry"]],
          ["Background Check Status", ["backgroundCheckStatus", "securityVettingStatus"]],
          ["Background Check Date", ["backgroundCheckDate", "securityVettingDate"]],
          ["Background Check Expiry", ["backgroundCheckExpiryDate", "backgroundCheckExpiry"]],
          ["Criminal Record Clearance Status", ["criminalRecordClearanceStatus", "criminalRecordClearance", "backgroundClearanceCertificate"]],
          ["Criminal Record Clearance Expiry", ["criminalRecordClearanceExpiryDate"]]
        ]
      },
      {
        id: "talent",
        tab: "talent",
        title: "Talent Profile",
        control: "HR controlled",
        fields: [
          ["Skills", ["skills", "skillTags"]],
          ["Languages", ["languages"]],
          ["Training Status", ["trainingStatus", "trainingCompleted"]],
          ["Certifications", ["certifications", "licenses", "licenseCerts"]],
          ["Career Level", ["careerLevel", "grade", "payGrade"]],
          ["Talent Tags", ["talentTags"]],
          ["Mobility Preference", ["mobilityPreference"]],
          ["Development Plan", ["developmentPlan"]],
          ["Training Notes", ["trainingNotes"]]
        ]
      },
      {
        id: "scorecard",
        tab: "scorecard",
        title: "Scorecard & Reviews",
        control: "Manager controlled",
        fields: [
          ["Scorecard", ["scorecard", "scorecardStatus"]],
          ["Last Review", ["lastReviewDate", "performanceReviewDate"]],
          ["Next Review", ["nextReviewDate"]],
          ["Performance Rating", ["performanceRating", "rating"]],
          ["Goals", ["goals", "currentGoals", "okr"]],
          ["Manager Feedback", ["managerFeedback", "reviewNotes"]],
          ["Safety Score", ["safetyScore"]],
          ["Attendance Score", ["attendanceScore"]],
          ["Customer Service Score", ["customerServiceScore"]]
        ]
      },
      {
        id: "notes",
        tab: "notes",
        title: "Supervisor Notes & Official Records",
        control: "HR and supervisor controlled",
        fields: [
          ["Supervisor Notes", ["supervisorNotes"]],
          ["HR Notes", ["hrNotes", "notes", "internalNotes"]],
          ["Operational Audit Notes", ["operationalAuditNotes", "auditNotes"]],
          ["Safety Compliance Checks", ["safetyComplianceChecks", "safetyComplianceNotes"]],
          ["Disciplinary Records", ["disciplinaryRecords", "disciplinaryNotes"]],
          ["Official Manager Correction Notes", ["managerCorrectionNotes"]],
          ["Last Profile Review Date", ["lastProfileReviewDate"]],
          ["Last Updated By", ["lastUpdatedBy"]],
          ["Last Updated At", ["lastUpdatedAt"]]
        ]
      },
      {
        id: "access",
        tab: "notes",
        title: "Access & Permissions",
        control: "System controlled",
        fields: [
          ["Active", ["active"]],
          ["Can Manage", ["canManage", "isManager", "manager"]],
          ["Is Admin", ["isAdmin"]],
          ["Is HR", ["isHr", "isHR"]],
          ["Is Payroll Admin", ["isPayrollAdmin"]],
          ["Can Use Payroll", ["canUsePayroll"]],
          ["Can Use My Roster", ["canUseMyRoster"]],
          ["Can Use GroupTalk", ["canUseGroupTalk"]],
          ["Can Use Inventory", ["canUseInventory"]],
          ["Can Use Policies", ["canUsePolicies"]],
          ["Allowed Apps", ["allowedApps", "apps", "appAccess"]],
          ["Permission Groups", ["permissionGroups", "groups"]],
          ["Permissions", ["permissions", "permissionKeys", "accessRights"]],
          ["Access Level", ["accessLevel"]],
          ["GroupTalk Groups", ["groupTalkGroups", "pttGroups"]]
        ]
      },
      {
        id: "compensation",
        tab: "compensation",
        title: "Compensation Statement",
        control: "Payroll controlled · read-only in SuccessFactors",
        fields: [
          ["Annual Salary", ["salaryAnnual", "salary", "annualSalary", "baseSalary"]],
          ["Hourly Base Rate", ["hourlyBaseRate", "hourlyRate", "ratePerHour"]],
          ["Hourly Base Wage Tier", ["hourlyBaseWageTier", "wageTier"]],
          ["Currency", ["currency", "payCurrency"]],
          ["Pay Frequency", ["payFrequency", "paySchedule"]],
          ["Pay Grade", ["payGrade", "grade"]],
          ["Overtime Eligible", ["overtimeEligible"]],
          ["Night Shift Eligible", ["nightShiftEligible"]],
          ["Holiday Pay Eligible", ["holidayPayEligible"]],
          ["Tax Withholding Profile", ["taxWithholdingProfileStatus", "taxWithholdingStatus", "taxProfileStatus"]],
          ["SKANDI Club Perk Balance", ["skandiClubBalance", "skandiClubPerkBalance", "clubPerkBalance"]],
          ["Uniform Allowance Balance", ["uniformAllowanceBalance", "uniformBalance"]],
          ["Payroll Provider", ["payrollProvider"]],
          ["Payroll Provider Employee ID", ["payrollProviderEmployeeId", "payrollId", "payrollNumber"]],
          ["Payment Setup Status", ["paymentSetupStatus", "directDepositStatus", "usDirectDepositStatus", "sePayrollRoutingStatus"]],
          ["Payment Method", ["paymentMethod"]],
          ["Bank Name", ["bankName", "usBankName", "seBankName"]],
          ["Account Type", ["accountType", "usAccountType"]],
          ["SE Clearing Number", ["seClearingNumber", "bankClearingNumber", "clearingNumber"]],
          ["SE Account Number / Last 4", ["seAccountNumberLast4", "bankAccountNumberLast4", "accountNumberLast4"]],
          ["US Routing Number / Last 4", ["usRoutingNumberLast4", "routingLast4", "routingNumberLast4"]],
          ["US Account Number / Last 4", ["usAccountNumberLast4", "accountLast4", "accountNumberLast4"]],
          ["Last Payroll Sync", ["lastPayrollSyncAt"]]
        ]
      }
    ];

    const editableProfileFields = [
      { key: "preferredName", label: "Preferred name", autocomplete: "nickname" },
      { key: "phone", label: "Mobile phone", autocomplete: "tel" },
      { key: "homeAddressStreet", label: "Home address street", autocomplete: "street-address" },
      { key: "homeAddressCity", label: "City", autocomplete: "address-level2" },
      { key: "homeAddressState", label: "State / Province", autocomplete: "address-level1" },
      { key: "homeAddressPostalCode", label: "Postal / ZIP", autocomplete: "postal-code" },
      { key: "homeAddressCountry", label: "Country", autocomplete: "country-name" },
      { key: "emergencyContactName", label: "Emergency contact name", autocomplete: "off" },
      { key: "emergencyContactRelationship", label: "Emergency relationship", autocomplete: "off" },
      { key: "emergencyContactPhone", label: "Emergency phone", autocomplete: "off" }
    ];

    /* =========================================================
       Icon utility (self-contained line icons)
       ========================================================= */
    const iconPaths = {
      home: '<path d="M3 10.8 12 3l9 7.8"/><path d="M5.5 9.5V21h13V9.5"/><path d="M9.5 21v-7h5v7"/>',
      task: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="m8 8 1.5 1.5L12 7"/><path d="M14 9h3"/><path d="m8 14 1.5 1.5L12 13"/><path d="M14 15h3"/>',
      apps: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
      news: '<path d="M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a3 3 0 0 1-3-3V5"/><path d="M3 5v12a1 1 0 0 0 2 0V6a2 2 0 0 1 2-2"/><path d="M9 8h8"/><path d="M9 12h8"/><path d="M9 16h5"/>',
      search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
      bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
      chevronDown: '<path d="m7 10 5 5 5-5"/>',
      arrowRight: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
      arrowLeft: '<path d="M19 12H5"/><path d="m11 18-6-6 6-6"/>',
      close: '<path d="m6 6 12 12"/><path d="m18 6-12 12"/>',
      check: '<path d="m5 12 4 4L19 6"/>',
      clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v6l4 2"/>',
      calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4"/><path d="M8 3v4"/><path d="M3 10h18"/><path d="M8 14h3"/><path d="M13 14h3"/>',
      document: '<path d="M6 2h8l4 4v16H6z"/><path d="M14 2v5h5"/><path d="M9 12h6"/><path d="M9 16h6"/>',
      bus: '<rect x="4" y="3" width="16" height="17" rx="3"/><path d="M7 7h10v6H7z"/><path d="M4 13h16"/><path d="M7 20v2"/><path d="M17 20v2"/><circle cx="8" cy="17" r="1"/><circle cx="16" cy="17" r="1"/>',
      money: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 9h.01"/><path d="M17 15h.01"/><circle cx="12" cy="12" r="3"/>',
      vacation: '<path d="M4 11h16"/><path d="M6 11 8 5h8l2 6"/><path d="M5 11v8"/><path d="M19 11v8"/><path d="M3 19h18"/><path d="M9 15h6"/>',
      users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
      dashboard: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 10h18"/><path d="M10 21V10"/><path d="m14 16 2-2 2 2"/>',
      chart: '<path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M22 20H2"/>',
      settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.09A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3v-4h.09A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.09A1.7 1.7 0 0 0 15.4 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.18.36.54.75 1 .9.18.06.36.1.6.1h.09v4H21a1.7 1.7 0 0 0-1.6 1z"/>',
      shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-5"/>',
      payroll: '<path d="M6 2h12v20H6z"/><path d="M9 6h6"/><path d="M9 10h2"/><path d="M13 10h2"/><path d="M9 14h2"/><path d="M13 14h2"/><path d="M9 18h6"/>',
      learning: '<path d="m3 10 9-5 9 5-9 5z"/><path d="M7 13v4c3 2 7 2 10 0v-4"/><path d="M21 10v6"/>',
      profile: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
      directory: '<path d="M4 4h16v16H4z"/><path d="M8 8h8"/><path d="M8 12h8"/><path d="M8 16h5"/>',
      heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8z"/>',
      star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9z"/>',
      warning: '<path d="M10.3 3.7 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
      info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6"/><path d="M12 7h.01"/>',
      help: '<circle cx="12" cy="12" r="9"/><path d="M9.7 9a2.5 2.5 0 1 1 3.8 2.1c-1 .6-1.5 1.1-1.5 2.4"/><path d="M12 17h.01"/>',
      megaphone: '<path d="m3 11 14-6v14L3 13z"/><path d="M11 16v4H7l-2-7"/><path d="M20 9v6"/>',
      filter: '<path d="M4 5h16"/><path d="M7 12h10"/><path d="M10 19h4"/>',
      more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
      lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
      code: '<path d="m8 9-4 3 4 3"/><path d="m16 9 4 3-4 3"/><path d="m14 5-4 14"/>',
      logout: '<path d="M10 17l5-5-5-5"/><path d="M15 12H3"/><path d="M21 3v18h-7"/>',
      download: '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>',
      plus: '<path d="M12 5v14"/><path d="M5 12h14"/>'
    };

    function icon(name, size = 20, extraClass = "") {
      const path = iconPaths[name] || iconPaths.apps;
      const filled = name === "star" && extraClass.includes("filled");
      return '<svg class="' + extraClass + '" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="' + (filled ? "currentColor" : "none") + '" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + path + "</svg>";
    }

    function escapeHtml(value) {
      return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }

    function catalogRoleByTitle(title = "") {
      const normalized = String(title || "").trim().toLowerCase();
      if (!normalized) return null;
      return orgCatalog().roles.find(role => String(role.title || "").trim().toLowerCase() === normalized) || null;
    }

    function canonicalOrgContext(profile = getProfile()) {
      const catalog = orgCatalog();
      const explicitRoleId = String(profile.roleId || profile.jobRoleId || profile.hrRoleId || profile.canonicalRoleId || "").trim().toUpperCase();
      const title = profile.jobTitle || profile.positionTitle || profile.position || profile.role || "";
      const roleMeta = catalog.roles.find(role => [role.role_id, role.job_code].map(value => String(value || "").toUpperCase()).includes(explicitRoleId)) || catalogRoleByTitle(title) || null;

      let departmentId = String(profile.departmentId || profile.assignedDepartmentId || profile.hrDepartmentId || roleMeta?.department_id || "").trim().toUpperCase();
      let departmentCode = String(profile.departmentCode || profile.assignedDepartmentCode || roleMeta?.department_code || "").trim().toUpperCase();
      const departmentText = String(profile.assignedDepartment || profile.department || profile.departmentName || "").trim();
      let departmentMeta = catalog.departments.find(d => String(d.id || "").toUpperCase() === departmentId) || null;
      if (!departmentMeta && departmentCode) departmentMeta = catalog.departments.find(d => String(d.code || "").toUpperCase() === departmentCode) || null;
      if (!departmentMeta && departmentText) departmentMeta = catalog.departments.find(d => String(d.name || "").toLowerCase() === departmentText.toLowerCase()) || null;
      if (departmentMeta) { departmentId = departmentMeta.id || departmentId; departmentCode = departmentMeta.code || departmentCode; }

      let baseCode = String(profile.baseCode || profile.baseMarketCode || profile.baseId || profile.assignedBaseId || "").trim().toUpperCase();
      const baseText = String(profile.assignedBase || profile.station || profile.base || profile.location || "").trim();
      let baseMeta = catalog.bases.find(b => String(b.code || "").toUpperCase() === baseCode) || null;
      if (!baseMeta && baseText) {
        const needle = baseText.toLowerCase();
        baseMeta = catalog.bases.find(b => [b.name,b.city,b.airport_iata,b.destination_code,b.code].some(v => String(v || "").toLowerCase() === needle)) || null;
      }
      if (baseMeta) baseCode = String(baseMeta.code || baseCode).toUpperCase();

      const accessRole = String(profile.alteaAccessRole || profile.accessRole || profile.systemAccessRole || profile.operationalAccessRole || roleMeta?.default_access_role || "").trim().toUpperCase();
      const explicitPreset = String(profile.permissionPreset || profile.accessPreset || roleMeta?.permission_preset_id || "").trim();
      const accessMeta = catalog.accessRoles.find(item => String(item.access_role_code || item.code || "").toUpperCase() === accessRole) || null;
      const tokens = profileAccessTokens(profile);

      return {
        companyCode: String(profile.companyCode || catalog.companyCode || SKANDI_COMPANY_CODE).trim().toUpperCase(),
        roleId: explicitRoleId || roleMeta?.role_id || roleMeta?.job_code || "",
        roleMeta,
        jobTitle: title || roleMeta?.title || "Employee",
        jobLevel: profile.jobLevel || roleMeta?.level || "",
        departmentId,
        departmentCode,
        departmentName: departmentMeta?.name || departmentText || "",
        departmentMeta,
        division: profile.orgDivision || departmentMeta?.division || "",
        baseCode,
        baseName: baseMeta?.name || baseText || "",
        baseMeta,
        destinationCode: String(profile.destinationCode || profile.assignedDestinationCode || baseMeta?.destination_code || "").trim().toUpperCase(),
        countryCode: String(profile.countryCode || profile.employmentCountryCode || baseMeta?.country_code || "").trim().toUpperCase(),
        accessRole,
        accessMeta,
        permissionPreset: explicitPreset,
        suggestedAccessRole: roleMeta?.default_access_role || "",
        suggestedPermissionPreset: roleMeta?.permission_preset_id || "",
        permissions: tokens,
        managerName: profile.managerName || profile.reportsToName || ""
      };
    }

    function normalizedSet(values = []) {
      return new Set(normalizeList(values).map(value => String(value).trim().toLowerCase()).filter(Boolean));
    }

    function audienceIntersects(required = [], actual = []) {
      if (!required?.length) return true;
      const have = normalizedSet(actual);
      return required.some(value => have.has(String(value).trim().toLowerCase()));
    }

    function scopeAllows(item) {
      if (!currentUserRole || !portalState.connected) return false;
      const profile = getProfile();
      const ctx = canonicalOrgContext(profile);
      const allowedPersonas = Array.isArray(item?.allowedRoles) ? item.allowedRoles : [];
      if (allowedPersonas.length && !allowedPersonas.includes(currentUserRole)) return false;

      if (!audienceIntersects(item.allowedRoleIds, [ctx.roleId])) return false;
      if (!audienceIntersects(item.allowedDepartmentIds, [ctx.departmentId])) return false;
      if (!audienceIntersects(item.allowedDepartmentCodes, [ctx.departmentCode])) return false;
      if (!audienceIntersects(item.allowedBaseCodes, [ctx.baseCode, ctx.baseName, ctx.baseMeta?.city, ctx.baseMeta?.iata])) return false;
      if (!audienceIntersects(item.allowedDestinationCodes, [ctx.destinationCode])) return false;
      if (!audienceIntersects(item.allowedCountries, [ctx.countryCode])) return false;
      // Access roles must be explicit in the authenticated profile. The codebook's
      // suggested access role is NEVER treated as an entitlement.
      if (!audienceIntersects(item.allowedAccessRoles, [ctx.accessRole])) return false;
      if (item.permissionAny?.length && !item.permissionAny.some(permission => ctx.permissions.includes(String(permission).trim().toLowerCase()))) return false;
      if (item.permissionAll?.length && !item.permissionAll.every(permission => ctx.permissions.includes(String(permission).trim().toLowerCase()))) return false;
      return true;
    }

    function roleAllows(item) {
      return scopeAllows(item);
    }

    function roleItems(collection) {
      return collectionItems(collection).filter(scopeAllows);
    }

    function getRole() {
      const base = roles[currentUserRole] || {
        key: "",
        label: "Employee",
        shortLabel: "Employee",
        greeting: "Your SKANDI workday, people, tools, and company updates in one place."
      };
      const profile = getProfile();
      const ctx = canonicalOrgContext(profile);
      const fullName = profile.fullName || profile.displayName || [profile.firstName, profile.lastName].filter(Boolean).join(" ") || "Employee";
      const firstName = profile.preferredName || profile.firstName || "";
      const initials = [profile.firstName, profile.lastName]
        .filter(Boolean)
        .map(value => String(value).charAt(0))
        .join("")
        .slice(0, 2)
        .toUpperCase() || (portalState.connected ? fullName.slice(0, 2).toUpperCase() : "—");
      return {
        ...base,
        userName: fullName,
        firstName,
        initials,
        photoUrl: recordPhoto(profile),
        title: ctx.jobTitle || "Employee",
        employeeId: profile.employeeId || profile.employeeNumber || profile.skId || "—",
        location: ctx.baseName || profile.assignedBase || profile.station || profile.base || "—",
        org: ctx
      };
    }

    function newsAudienceLabel(item = {}) {
      const ctx = canonicalOrgContext();
      if (item.allowedRoleIds?.length) return "Your role";
      if (item.allowedDepartmentIds?.length || item.allowedDepartmentCodes?.length) return ctx.departmentCode ? `${ctx.departmentCode} Department` : "Department";
      if (item.allowedBaseCodes?.length) return ctx.baseCode ? ctx.baseCode : "Local update";
      if (item.allowedDestinationCodes?.length) return ctx.destinationCode ? ctx.destinationCode : "Destination";
      if (item.allowedAccessRoles?.length) return "Operations";
      return "Company";
    }

    function appRelevanceScore(app, ctx = canonicalOrgContext()) {
      let score = favoriteApps.has(app.id) ? 100 : 0;
      const text = `${app.title} ${app.subtitle} ${app.group} ${app.tag}`.toLowerCase();
      const deptKeywords = {
        EXE:["management","strategy","people","finance","operations"], STR:["project","strategy","document","expense"], WPS:["workplace","badge","service","mail"],
        COM:["sales","reservation","booking","pnr","crm"], PRD:["inventory","hotel","tour","product","supplier"], REV:["inventory","pricing","revenue"],
        RSV:["reservation","booking","pnr","sales"], TKT:["ticket","gds","document","pnr"], OCC:["altea","operations","flight","irrop","dispatch"],
        CEX:["support","guest","claim","mail"], LOY:["club","crm","loyalty"], MKT:["media","voy","news","brand"],
        TEC:["system","service","technology","admin"], SEC:["security","privacy","policy","audit"], FIN:["finance","payroll","payment"],
        LGL:["legal","policy","docunet","risk"], SAF:["safety","operations","policy","incident"], HR:["hr","people","payroll","roster","training","uniform"],
        RET:["uniform","inventory","store"], RDO:["destination","altea","operations","grouptalk"], GSO:["destination","guest","altea","grouptalk"],
        APO:["departure","airport","dcs","flight","altea"], GTR:["transfer","coach","fleet","dispatch","altea"], HTO:["hotel","tour","activity","destination","altea"]
      };
      (deptKeywords[ctx.departmentCode] || []).forEach(keyword => { if (text.includes(keyword)) score += 8; });
      const accessKeywords = {
        SALES_AGENT:["sales","reservation","booking","pnr"], OCC_CONTROLLER:["operations","flight","irrop","altea"], DESTINATION_CONTROLLER:["destination","hotel","tour","transfer","altea"],
        DCS_AGENT:["airport","departure","dcs","flight"], DISPATCHER:["dispatch","fleet","transfer"], GUIDE:["my day","destination","grouptalk"], FIELD_STAFF:["my day","roster","grouptalk"],
        HR_ADMIN:["hr","people","payroll"], HR_MANAGER:["hr","people","performance"], INVENTORY_ADMIN:["inventory","product"], UNIFORM_MANAGER:["uniform"]
      };
      (accessKeywords[ctx.accessRole] || []).forEach(keyword => { if (text.includes(keyword)) score += 10; });
      if (app.allowedRoleIds?.length) score += 20;
      if (app.allowedDepartmentIds?.length || app.allowedDepartmentCodes?.length) score += 15;
      if (app.allowedBaseCodes?.length) score += 12;
      return score;
    }

    function recommendedApps(limit = 8) {
      const apps = roleItems("applicationTiles").slice();
      return apps.sort((a,b) => appRelevanceScore(b) - appRelevanceScore(a) || a.title.localeCompare(b.title)).slice(0, limit);
    }

    function priorityBadge(priority) {
      if (priority === "high") return '<span class="status-badge error">High priority</span>';
      if (priority === "medium") return '<span class="status-badge warning">Due soon</span>';
      return '<span class="status-badge info">Assigned</span>';
    }

    function statusBadge(value) {
      const normalized = String(value).toLowerCase();
      let type = "neutral";
      if (/complete|ready|available|approved|assigned|on time|filed|sent|current|passed/.test(normalized)) type = "success";
      if (/attention|exception|review|open|validation|pending|acknowledgment|needs action/.test(normalized)) type = "warning";
      if (/critical|failed|overdue/.test(normalized)) type = "error";
      return '<span class="status-badge ' + type + '">' + escapeHtml(value) + "</span>";
    }

    function navItems() {
      const items = [
        { id: "home", label: "Home", icon: "home" }
      ];
      if (!portalState.connected) return items;
      const connectedItems = [
        ...items,
        { id: "tasks", label: "My Work", icon: "task" },
        { id: "apps", label: "Applications", icon: "apps" },
        { id: "news", label: "Company News", icon: "news" },
        { id: "profile", label: "My Profile", icon: "profile" },
        { id: "directory", label: "Colleagues", icon: "directory" }
      ];
      if (hasHrAccess() && portalState.hr.authorized !== false) {
        connectedItems.push({ id: "hr", label: "HR Administration", icon: "lock" });
      }
      return connectedItems;
    }

    function routeHash(view, appId = null) {
      if (view === "app" && appId) return "#/app/" + encodeURIComponent(appId);
      if (view === "hr") {
        const moduleId = currentHrView || allowedHrModules()[0]?.[0] || "workforce";
        return "#/hr/" + encodeURIComponent(moduleId);
      }
      return "#/" + view;
    }

    function setRoute(view, appId = null, replace = false) {
      if (!portalState.connected && view !== "home") {
        view = "home";
        appId = null;
      }
      if (view === "hr") {
        const modules = allowedHrModules();
        if (!modules.length || portalState.hr.authorized === false) {
          view = "home";
          appId = null;
        } else if (!canAccessHrModule(currentHrView)) {
          currentHrView = modules[0][0];
        }
      }
      currentView = view;
      currentAppId = appId;
      const nextHash = routeHash(view, appId);
      if (window.location.hash !== nextHash) {
        if (replace) {
          history.replaceState(null, "", nextHash);
        } else {
          history.pushState(null, "", nextHash);
        }
      }
      closeShellPopovers();
      renderPortal();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function parseRoute() {
      if (!portalState.connected) {
        currentView = "home";
        currentAppId = null;
        return;
      }
      const raw = window.location.hash.replace(/^#\/?/, "");
      const parts = raw.split("/").filter(Boolean);
      const validViews = ["home", "tasks", "apps", "news", "profile", "directory"];
      const modules = allowedHrModules();
      if (modules.length && portalState.hr.authorized !== false) validViews.push("hr");

      if (parts[0] === "app" && parts[1]) {
        const candidate = decodeURIComponent(parts[1]);
        const app = roleItems("applicationTiles").find(item => item.id === candidate);
        if (app) {
          currentView = "app";
          currentAppId = candidate;
          return;
        }
      }

      if (parts[0] === "hr" && validViews.includes("hr")) {
        const requestedModule = decodeURIComponent(parts[1] || "");
        currentHrView = canAccessHrModule(requestedModule)
          ? requestedModule
          : (modules[0]?.[0] || "workforce");
        currentView = "hr";
        currentAppId = null;
        return;
      }

      currentView = validViews.includes(parts[0]) ? parts[0] : "home";
      currentAppId = null;
    }

    function closeShellPopovers() {
      notificationsOpen = false;
      profileOpen = false;
      mobileSearchOpen = false;
    }

    /* =========================================================
       Rendering: shell, home, lists and app workspaces
       ========================================================= */
    function renderShell() {
      const activeNav = currentView === "app" ? "apps" : currentView;
      return `
        <nav class="top-nav successfactors-local-nav" aria-label="SuccessFactors navigation">
          <div class="top-nav-inner">
            ${navItems().map(item => `
              <button class="nav-button ${activeNav === item.id ? "active" : ""}" type="button" data-route="${item.id}" aria-current="${activeNav === item.id ? "page" : "false"}">
                ${icon(item.icon, 17)}
                <span>${item.label}</span>
              </button>
            `).join("")}
          </div>
        </nav>
      `;
    }

    function renderNotifications() {
      const items = roleItems("notifications");
      return `
        <section class="shell-popover" aria-label="Notifications">
          <div class="popover-head">
            <h3>Notifications</h3>
            <button class="text-button" type="button" data-action="mark-all-read">Mark all as read</button>
          </div>
          <div class="notification-list">
            ${items.length ? items.map(item => `
              <article class="notification-item ${readNotifications.has(item.id) ? "" : "unread"}">
                <span class="notification-icon">${icon(item.icon, 18)}</span>
                <div class="notification-copy">
                  <strong>${escapeHtml(item.title)}</strong>
                  <p>${escapeHtml(item.body)}</p>
                </div>
                <span class="notification-time">${escapeHtml(item.time)}</span>
              </article>
            `).join("") : '<div class="search-empty">No notifications were returned by the backend.</div>'}
          </div>
        </section>
      `;
    }

    function renderProfileMenu() {
      const role = getRole();
      return `
        <section class="shell-popover profile-popover" aria-label="User profile menu">
          <div class="profile-card">
            <span class="avatar">${role.photoUrl ? `<img src="${escapeHtml(role.photoUrl)}" alt="">` : escapeHtml(role.initials)}</span>
            <div>
              <h3>${escapeHtml(role.userName)}</h3>
              <p>${escapeHtml(role.title)}</p>
              <p>${escapeHtml(role.employeeId)}</p>
            </div>
          </div>
          <button class="profile-menu-button" type="button" data-action="profile-detail">${icon("profile", 18)} My Employee Profile</button>
          <button class="profile-menu-button" type="button" data-action="profile-settings">${icon("settings", 18)} Settings & Preferences</button>
          <button class="profile-menu-button" type="button" data-action="show-rbac">${icon("lock", 18)} View My Permissions</button>
          <button class="profile-menu-button" type="button" data-action="sign-out">${icon("logout", 18)} Sign Out</button>
        </section>
      `;
    }

    function renderConnectionState() {
      const failed = portalState.status === "error";
      return `
        <main class="page" id="mainContent">
          <div class="page-header">
            <div class="page-header-copy">
              <p class="eyebrow">${icon(failed ? "warning" : "lock", 14)} Secure Employee Portal</p>
              <h1 class="page-title">${failed ? "Employee portal unavailable" : "Connecting to RIAINTRA"}</h1>
              <p class="page-subtitle">${failed ? escapeHtml(portalState.error || "The employee session could not be verified.") : "Waiting for authenticated profile, permissions, applications, announcements, and workflow data."}</p>
            </div>
            <div class="page-actions">
              <span class="role-pill">${icon(failed ? "warning" : "clock", 14)} ${failed ? "Authentication required" : "Waiting for data"}</span>
            </div>
          </div>

          <div class="empty-card">
            <span class="empty-icon">${icon(failed ? "warning" : "shield", 24)}</span>
            <strong>${failed ? "A valid employee profile and role are required" : "No local or sample data is stored in this portal"}</strong>
            <span>${failed ? "Return to the authenticated RIAINTRA session and try again." : "Content will render only after the parent application sends an authorized bootstrap response."}</span>
            <button class="primary-button" type="button" data-action="request-bootstrap">${icon("clock", 16)} Request data again</button>
          </div>

          
        </main>
      `;
    }

    function greetingForNow() {
      const hour = new Date().getHours();
      if (hour < 12) return "Good morning";
      if (hour < 17) return "Good afternoon";
      return "Good evening";
    }

    function orgContextPills(ctx) {
      return [
        ctx.roleId && `${ctx.roleId} · ${ctx.jobTitle}`,
        ctx.departmentCode && `${ctx.departmentCode} · ${ctx.departmentName}`,
        ctx.baseCode && `${ctx.baseCode} · ${ctx.baseName}`,
        ctx.accessRole && `${ctx.accessRole} access`
      ].filter(Boolean);
    }

    function renderFocusPanel(tasks, notifications) {
      const focus = [
        ...tasks.slice(0,4).map(item => ({kind:"task", id:item.id, title:item.title, meta:[item.category,item.due].filter(Boolean).join(" · "), icon:item.icon||"task", action:"open-task"})),
        ...notifications.slice(0,2).map(item => ({kind:"notification", id:item.id, title:item.title, meta:item.body||item.time, icon:item.icon||"bell", action:"toggle-notifications"}))
      ].slice(0,5);
      return `
        <section class="intranet-panel">
          <div class="intranet-panel-head"><div><h2>Your day</h2><p>Tasks, approvals and notices that need your attention.</p></div><button class="text-button" type="button" data-route="tasks">My Work ${icon("arrowRight",13)}</button></div>
          <div class="intranet-panel-body">
            ${focus.length ? `<div class="focus-list">${focus.map(item=>`
              <button class="focus-item" type="button" data-action="${item.action}" data-id="${escapeHtml(item.id||"")}">
                <span class="focus-icon">${icon(item.icon,16)}</span>
                <span class="focus-copy"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.meta||"")}</span></span>
                ${icon("arrowRight",14)}
              </button>`).join("")}</div>` : `<div class="empty-card" style="min-height:145px;border:0"><span class="empty-icon">${icon("check",22)}</span><strong>You're all caught up</strong><span>No open work or priority notices are waiting for you.</span></div>`}
          </div>
        </section>`;
    }

    function renderContextCards(ctx) {
      const dept = ctx.departmentMeta;
      const base = ctx.baseMeta;
      return `<div class="context-grid">
        <article class="context-card">
          <div class="context-card-head"><span class="context-card-icon">${icon("users",20)}</span><div><h3>${escapeHtml(ctx.departmentName||"Your department")}</h3><p>${escapeHtml(ctx.division||"SKANDI organization")}</p></div></div>
          <div class="context-facts">
            <div class="context-fact"><span>Department</span><strong>${escapeHtml(ctx.departmentId||ctx.departmentCode||"—")}</strong></div>
            <div class="context-fact"><span>Executive owner</span><strong>${escapeHtml(dept?.executiveOwner||"—")}</strong></div>
            <div class="context-fact"><span>Manager</span><strong>${escapeHtml(ctx.managerName||"—")}</strong></div>
          </div>
        </article>
        <article class="context-card">
          <div class="context-card-head"><span class="context-card-icon">${icon("home",20)}</span><div><h3>${escapeHtml(ctx.baseName||"Your work location")}</h3><p>${escapeHtml(base?.type||"Assigned base / market")}</p></div></div>
          <div class="context-facts">
            <div class="context-fact"><span>Base / market</span><strong>${escapeHtml(ctx.baseCode||"—")}</strong></div>
            <div class="context-fact"><span>Airport / destination</span><strong>${escapeHtml([base?.iata,ctx.destinationCode].filter(Boolean).join(" · ")||"—")}</strong></div>
            <div class="context-fact"><span>Timezone</span><strong>${escapeHtml(base?.timezone||"—")}</strong></div>
          </div>
        </article>
      </div>`;
    }

    function renderMiniNews(items) {
      if (!items.length) return `<div class="empty-card"><span class="empty-icon">${icon("news",22)}</span><strong>No additional announcements</strong><span>There are no other company, department or local updates for your current scope.</span></div>`;
      return `<div class="mini-news-grid">${items.map(item=>`
        <button class="mini-news-card" type="button" data-action="open-news" data-id="${escapeHtml(item.id)}">
          <span class="mini-news-scope">${icon("news",11)} ${escapeHtml(newsAudienceLabel(item))}</span>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.summary)}</p>
          <span class="mini-news-meta">${escapeHtml([item.date,item.category].filter(Boolean).join(" · "))}</span>
        </button>`).join("")}</div>`;
    }

    function sameTeamColleagues(ctx) {
      return portalState.colleagues
        .filter(person => {
          const deptMatch = ctx.departmentId && String(person.departmentId||"").toUpperCase() === ctx.departmentId;
          const deptNameMatch = ctx.departmentName && String(person.department||"").toLowerCase() === ctx.departmentName.toLowerCase();
          const baseMatch = ctx.baseCode && String(person.baseCode||"").toUpperCase() === ctx.baseCode;
          const stationMatch = ctx.baseName && String(person.station||"").toLowerCase() === ctx.baseName.toLowerCase();
          return deptMatch || deptNameMatch || baseMatch || stationMatch;
        })
        .slice(0,4);
    }

    function renderTeamStrip(ctx) {
      const people = sameTeamColleagues(ctx);
      if (!portalState.colleaguesLoaded) return `<div class="empty-card" style="min-height:150px"><span class="empty-icon">${icon("directory",22)}</span><strong>Find your colleagues</strong><span>Load the employee directory to see teammates from ${escapeHtml(ctx.departmentCode||ctx.baseCode||"your organization")}.</span><button class="primary-button" type="button" data-action="refresh-directory">${icon("directory",15)} Load directory</button></div>`;
      if (!people.length) return `<div class="empty-card" style="min-height:150px"><span class="empty-icon">${icon("users",22)}</span><strong>Your organization is connected</strong><span>No additional colleagues matched your current department/base scope in the returned directory data.</span></div>`;
      return `<div class="team-strip">${people.map(person=>`<button class="team-person" type="button" data-action="open-colleague" data-id="${escapeHtml(String(person.skId||person.corporateEmailAddress||person.displayName))}"><span class="avatar">${escapeHtml(recordInitials(person))}</span><strong>${escapeHtml(recordName(person))}</strong><span>${escapeHtml(person.jobTitle||person.department||"")}</span><span>${escapeHtml(person.station||"")}</span></button>`).join("")}</div>`;
    }

    function renderHome() {
      if (!portalState.connected) return renderConnectionState();
      const role = getRole();
      const ctx = role.org;
      const tasks = roleItems("toDoTasks").filter(item => !completedTasks.has(item.id) && !dismissedTasks.has(item.id));
      const notifications = roleItems("notifications").filter(item => !readNotifications.has(item.id));
      const news = roleItems("newsItems");
      const apps = recommendedApps(8);
      const quickActions = roleItems("quickActions").slice(0,6);
      const secondaryNews = news.filter((_,index)=>index!==currentNewsIndex).slice(0,4);
      const links = portalState.usefulLinks.filter(scopeAllows).slice(0,6);
      const today = new Intl.DateTimeFormat(undefined,{weekday:"long",month:"long",day:"numeric"}).format(new Date());
      const chips = orgContextPills(ctx);

      return `
        <main class="page intranet-home" id="mainContent">
          <section class="welcome-band">
            <div>
              <div class="welcome-kicker">${icon("home",15)} RIA INTRA · SKANDI Employee Intranet</div>
              <h1>${escapeHtml(greetingForNow())}${role.firstName ? ", " + escapeHtml(role.firstName) : ""}</h1>
              <p>${escapeHtml(today)} · Welcome to your personalized SKANDI workspace. News, tools and operational information below are filtered to the profile and access scope returned for you.</p>
              <div class="identity-chips">${chips.map(value=>`<span class="identity-chip">${icon("check",12)} ${escapeHtml(value)}</span>`).join("")}</div>
            </div>
            <aside class="welcome-profile" aria-label="Your organization context">
              <div class="profile-line"><span>Job title</span><strong>${escapeHtml(ctx.jobTitle||role.title)}</strong></div>
              <div class="profile-line"><span>Department</span><strong>${escapeHtml(ctx.departmentName||"—")}</strong></div>
              <div class="profile-line"><span>Base / market</span><strong>${escapeHtml(ctx.baseName||"—")}</strong></div>
              <div class="profile-line"><span>SK-ID</span><strong>${escapeHtml(role.employeeId)}</strong></div>
              <div class="profile-line"><span>Access profile</span><strong>${escapeHtml(ctx.accessRole||"Backend entitlements")}</strong></div>
            </aside>
          </section>

          <div class="intranet-columns">
            <div class="intranet-stack">
              ${news.length ? `<section aria-labelledby="companyNewsHeading"><div class="section-header"><div class="section-title-group"><h2 id="companyNewsHeading">Company News</h2><p>Corporate, department and local announcements relevant to you.</p></div><button class="text-button" type="button" data-route="news">All news ${icon("arrowRight",14)}</button></div>${renderHero()}</section>` : `<section class="intranet-panel"><div class="intranet-panel-head"><div><h2>Company News</h2><p>Corporate, department and local announcements.</p></div></div><div class="intranet-panel-body">${renderMiniNews([])}</div></section>`}

              <section class="section tool-section" aria-labelledby="workspaceHeading">
                <div class="section-header"><div class="section-title-group"><h2 id="workspaceHeading">Your workspace</h2><p>Applications you already have access to, prioritized for ${escapeHtml(ctx.departmentCode||ctx.jobTitle||"your role")}.</p></div><button class="text-button" type="button" data-route="apps">Application library ${icon("arrowRight",14)}</button></div>
                ${quickActions.length ? `<div class="quick-actions-card" style="margin-bottom:11px">${quickActions.map(action=>`<button class="quick-action" type="button" data-action="${action.path?"navigate-parent":"open-app"}" data-id="${escapeHtml(action.target)}" data-path="${escapeHtml(action.path||"")}"><span class="quick-action-icon">${icon(action.icon,20)}</span><span><strong>${escapeHtml(action.title)}</strong><span>${escapeHtml(action.subtitle)}</span></span></button>`).join("")}</div>` : ""}
                ${apps.length ? `<div class="launchpad-grid">${apps.map(renderAppTile).join("")}</div>` : `<div class="empty-card"><span class="empty-icon">${icon("apps",24)}</span><strong>No applications assigned</strong><span>Your application access is determined by the authenticated backend permission set.</span></div>`}
                <div class="scope-access-note">${icon("lock",12)} The role catalog is used to personalize this page, not to grant permissions. Restricted roles such as OWNER/SUPER_ADMIN are never derived from job seniority.</div>
              </section>

              <section class="section" aria-labelledby="aroundHeading"><div class="section-header"><div class="section-title-group"><h2 id="aroundHeading">Around SKANDI</h2><p>More updates across the company and your organization.</p></div></div>${renderMiniNews(secondaryNews)}</section>

              <section class="section" aria-labelledby="teamHeading"><div class="section-header"><div class="section-title-group"><h2 id="teamHeading">People & Organization</h2><p>Colleagues connected to your department or work location.</p></div><button class="text-button" type="button" data-route="directory">Directory ${icon("arrowRight",14)}</button></div>${renderTeamStrip(ctx)}</section>
            </div>

            <aside class="intranet-stack">
              ${renderFocusPanel(tasks,notifications)}
              <section class="intranet-panel"><div class="intranet-panel-head"><div><h2>Your SKANDI context</h2><p>Canonical organization and base information.</p></div></div><div class="intranet-panel-body">${renderContextCards(ctx)}</div></section>
              <section class="intranet-panel"><div class="intranet-panel-head"><div><h2>Useful links</h2><p>Services available within your returned access scope.</p></div></div><div class="side-list">${links.length?links.map(link=>`<button class="side-action" type="button" data-action="navigate-parent" data-path="${escapeHtml(link.path)}"><span class="side-action-icon">${icon(link.icon,18)}</span><span><strong>${escapeHtml(link.title)}</strong><span>${escapeHtml(link.subtitle)}</span></span></button>`).join(""):`<div class="search-empty">No additional links were returned for this profile.</div>`}</div></section>
              <section class="intranet-panel"><div class="intranet-panel-head"><div><h2>My profile</h2><p>Employment and organization details.</p></div><button class="text-button" type="button" data-route="profile">Open ${icon("arrowRight",13)}</button></div><div class="intranet-panel-body"><div class="scope-pills">${chips.map(value=>`<span class="scope-pill">${icon("check",10)} ${escapeHtml(value)}</span>`).join("")||'<span class="scope-pill">Authenticated employee</span>'}</div></div></section>
            </aside>
          </div>
        </main>`;
    }

    function renderHero() {
      const news = roleItems("newsItems");
      if (!news.length) return "";
      currentNewsIndex = ((currentNewsIndex % news.length) + news.length) % news.length;
      const item = news[currentNewsIndex];
      return `
        <section class="hero-card ${item.theme} ${item.imageUrl ? "has-image" : ""}" aria-roledescription="carousel" aria-label="Company news" aria-live="polite">
          ${item.imageUrl ? `<div class="news-hero-image" style="background-image:url('${escapeHtml(item.imageUrl)}')"></div>` : ""}
          <div class="hero-copy">
            <span class="hero-label">${icon("megaphone",14)} ${escapeHtml(newsAudienceLabel(item))}${item.eyebrow ? " · " + escapeHtml(item.eyebrow) : ""}</span>
            <h2>${escapeHtml(item.title)}</h2>
            <p>${escapeHtml(item.summary)}</p>
            <div class="hero-meta">
              ${item.date ? `<span>${icon("calendar",14)} ${escapeHtml(item.date)}</span>` : ""}
              ${item.category ? `<span>${icon("news",14)} ${escapeHtml(item.category)}</span>` : ""}
            </div>
            <button class="hero-cta" type="button" data-action="open-news" data-id="${escapeHtml(item.id)}">${escapeHtml(item.cta)} ${icon("arrowRight",16)}</button>
          </div>
          <div class="hero-art" aria-hidden="true"><span class="hero-art-icon">${icon(item.icon,76)}</span></div>
          ${news.length > 1 ? `<div class="hero-controls"><button class="hero-arrow" type="button" data-action="hero-prev" aria-label="Previous announcement">${icon("arrowLeft",16)}</button><div class="hero-dots" role="tablist" aria-label="Choose announcement">${news.map((newsItem,index)=>`<button class="hero-dot ${index===currentNewsIndex?"active":""}" type="button" role="tab" aria-selected="${index===currentNewsIndex}" aria-label="Announcement ${index+1}: ${escapeHtml(newsItem.title)}" data-action="hero-dot" data-index="${index}"></button>`).join("")}</div><button class="hero-arrow" type="button" data-action="hero-next" aria-label="Next announcement">${icon("arrowRight",16)}</button></div>` : ""}
        </section>`;
    }

    function renderTodoCard(task) {
      return `
        <article class="todo-card priority-${task.priority}">
          <div class="todo-top">
            <span class="todo-category">${icon(task.icon, 16)} ${escapeHtml(task.category)}</span>
            ${priorityBadge(task.priority)}
          </div>
          <h3>${escapeHtml(task.title)}</h3>
          <p>${escapeHtml(task.description)}</p>
          <div class="todo-footer">
            <span class="todo-due">${icon("clock", 14)} ${escapeHtml(task.due)}</span>
            <button class="todo-action" type="button" data-action="open-task" data-id="${task.id}">
              ${escapeHtml(task.action)} ${icon("arrowRight", 13)}
            </button>
          </div>
        </article>
      `;
    }

    function renderAppTile(tile) {
      const favorite = favoriteApps.has(tile.id);
      return `
        <article class="app-tile ${tile.wide ? "wide" : ""}" role="button" tabindex="0" data-action="open-app" data-id="${tile.id}" style="--tile-color:${tile.color};--tile-soft:${tile.soft}" aria-label="Open ${escapeHtml(tile.title)}">
          <div class="tile-head">
            <span class="tile-icon">${icon(tile.icon, 24)}</span>
            <button class="favorite-button ${favorite ? "active" : ""}" type="button" data-action="toggle-favorite" data-id="${tile.id}" aria-label="${favorite ? "Remove" : "Add"} ${escapeHtml(tile.title)} ${favorite ? "from" : "to"} favorites" aria-pressed="${favorite}">
              ${icon("star", 17, favorite ? "filled" : "")}
            </button>
          </div>
          <div class="tile-copy">
            <h3>${escapeHtml(tile.title)}</h3>
            <p>${escapeHtml(tile.subtitle)}</p>
          </div>
          <div class="tile-footer">
            <div class="tile-metric">${escapeHtml(tile.metric)}<small>${escapeHtml(tile.metricLabel)}</small></div>
            <span class="tile-open">${escapeHtml(tile.tag)} ${icon("arrowRight", 13)}</span>
          </div>
        </article>
      `;
    }

    function renderTasksPage() {
      const allTasks = roleItems("toDoTasks").filter(item => !dismissedTasks.has(item.id));
      let tasks = allTasks;
      if (taskFilter === "open") tasks = allTasks.filter(item => !completedTasks.has(item.id));
      if (taskFilter === "urgent") tasks = allTasks.filter(item => !completedTasks.has(item.id) && item.priority === "high");
      if (taskFilter === "completed") tasks = allTasks.filter(item => completedTasks.has(item.id));

      const open = allTasks.filter(item => !completedTasks.has(item.id)).length;
      const urgent = allTasks.filter(item => !completedTasks.has(item.id) && item.priority === "high").length;
      const completed = allTasks.filter(item => completedTasks.has(item.id)).length;

      return `
        <main class="page" id="mainContent">
          <div class="page-header">
            <div class="page-header-copy">
              <p class="eyebrow">${icon("task", 14)} To-Do / Approvals</p>
              <h1 class="page-title">My Work</h1>
              <p class="page-subtitle">Review tasks and approval workflows assigned to ${escapeHtml(getRole().label)}.</p>
            </div>
            <div class="page-actions">
              <button class="secondary-button" type="button" data-action="export-work">${icon("download", 16)} Export list</button>
            </div>
          </div>

          <div class="metric-grid">
            ${renderMetricCard("Open items", open, "Assigned to you", "task")}
            ${renderMetricCard("High priority", urgent, urgent ? "Action recommended today" : "No urgent work", "warning")}
            ${renderMetricCard("Completed", completed, "This session", "check")}
            ${renderMetricCard("Role scope", getRole().shortLabel, "RBAC-filtered", "lock")}
          </div>

          <div class="toolbar">
            <div class="filter-chips" role="group" aria-label="Filter work items">
              ${[
                ["open", "Open", open],
                ["urgent", "High priority", urgent],
                ["completed", "Completed", completed],
                ["all", "All", allTasks.length]
              ].map(filter => `
                <button class="filter-chip ${taskFilter === filter[0] ? "active" : ""}" type="button" data-action="task-filter" data-filter="${filter[0]}" aria-pressed="${taskFilter === filter[0]}">
                  ${filter[1]} <span>${filter[2]}</span>
                </button>
              `).join("")}
            </div>
          </div>

          ${tasks.length ? `
            <section class="work-list" aria-label="Work items">
              ${tasks.map(task => renderWorkRow(task)).join("")}
            </section>
          ` : `
            <div class="empty-card">
              <span class="empty-icon">${icon("check", 24)}</span>
              <strong>No items in this view</strong>
              <span>Choose another filter to see more work.</span>
            </div>
          `}

          
        </main>
      `;
    }

    function renderMetricCard(label, value, trend, iconName) {
      return `
        <article class="metric-card">
          <div class="metric-card-top"><span>${escapeHtml(label)}</span>${icon(iconName, 18)}</div>
          <strong>${escapeHtml(value)}</strong>
          <span class="metric-trend">${icon("info", 12)} ${escapeHtml(trend)}</span>
        </article>
      `;
    }

    function renderWorkRow(task) {
      const done = completedTasks.has(task.id);
      return `
        <article class="work-row ${done ? "completed" : ""}">
          <span class="work-icon">${icon(done ? "check" : task.icon, 18)}</span>
          <div class="work-main">
            <strong>${escapeHtml(task.title)}</strong>
            <span>${escapeHtml(task.description)}</span>
          </div>
          <span class="work-meta">${escapeHtml(task.category)}</span>
          <span class="status-cell">${done ? '<span class="status-badge success">Completed</span>' : priorityBadge(task.priority)}</span>
          <div class="work-actions">
            <button class="ghost-button" type="button" data-action="open-task" data-id="${task.id}">${done ? "View" : task.action}</button>
            ${!done ? `<button class="icon-button" type="button" data-action="quick-complete-task" data-id="${task.id}" aria-label="Mark ${escapeHtml(task.title)} complete">${icon("check", 17)}</button>` : ""}
          </div>
        </article>
      `;
    }

    function renderAppsPage() {
      const allApps = roleItems("applicationTiles");
      const groups = ["All", ...new Set(allApps.map(item => item.group).filter(Boolean))];
      const apps = appGroupFilter === "All" ? allApps : allApps.filter(item => item.group === appGroupFilter);

      return `
        <main class="page" id="mainContent">
          <div class="page-header">
            <div class="page-header-copy">
              <p class="eyebrow">${icon("apps", 14)} Fiori Launchpad</p>
              <h1 class="page-title">Application Library</h1>
              <p class="page-subtitle">${allApps.length} enterprise applications are assigned to your ${escapeHtml(getRole().label)} role.</p>
            </div>
            <div class="page-actions">
              <span class="role-pill">${icon("lock", 14)} RBAC active</span>
            </div>
          </div>

          <div class="toolbar">
            <div class="filter-chips" role="group" aria-label="Filter applications by group">
              ${groups.map(group => `
                <button class="filter-chip ${appGroupFilter === group ? "active" : ""}" type="button" data-action="app-group-filter" data-filter="${escapeHtml(group)}" aria-pressed="${appGroupFilter === group}">
                  ${escapeHtml(group)}
                </button>
              `).join("")}
            </div>
            <label class="inline-search">
              <span class="sr-only">Filter applications</span>
              ${icon("search", 16)}
              <input id="appSearch" type="search" placeholder="Filter applications">
            </label>
          </div>

          <div class="launchpad-grid" id="applicationGrid">
            ${apps.length ? apps.map(renderAppTile).join("") : `
              <div class="empty-card" style="grid-column:1/-1">
                <span class="empty-icon">${icon("apps", 24)}</span>
                <strong>No applications returned</strong>
                <span>Application access is supplied by the RIAINTRA backend.</span>
              </div>
            `}
          </div>

          
        </main>
      `;
    }

    function renderNewsPage() {
      const news = roleItems("newsItems");
      return `
        <main class="page" id="mainContent">
          <div class="page-header">
            <div class="page-header-copy">
              <p class="eyebrow">${icon("news", 14)} Company News</p>
              <h1 class="page-title">News & Announcements</h1>
              <p class="page-subtitle">Updates published for your company, canonical role, department, base/market, destination and permission scope.</p>
            </div>
            <div class="page-actions">
              <span class="role-pill">${icon("lock", 14)} ${news.length} available</span>
            </div>
          </div>

          ${news.length ? `
            <section class="news-grid" aria-label="Company news">
              ${news.map(item => `
                <article class="news-card">
                  <div class="news-visual ${escapeHtml(item.theme || "")}">
                    ${icon(item.icon || "news", 42)}
                  </div>
                  <div class="news-content">
                    <span class="hero-label">${escapeHtml(item.eyebrow || item.category || "Update")}</span>
                    <h3>${escapeHtml(item.title)}</h3>
                    <p>${escapeHtml(item.summary)}</p>
                    <div class="hero-meta">
                      ${item.date ? `<span>${icon("calendar", 13)} ${escapeHtml(item.date)}</span>` : ""}
                      ${item.category ? `<span>${icon("news", 13)} ${escapeHtml(item.category)}</span>` : ""}
                    </div>
                    <button class="text-button" type="button" data-action="open-news" data-id="${escapeHtml(item.id)}">
                      ${escapeHtml(item.cta || "Read")} ${icon("arrowRight", 14)}
                    </button>
                  </div>
                </article>
              `).join("")}
            </section>
          ` : `
            <div class="empty-card">
              <span class="empty-icon">${icon("news", 24)}</span>
              <strong>No announcements available</strong>
              <span>The backend did not return any news for your role.</span>
            </div>
          `}

          
        </main>
      `;
    }

    /* =========================================================
       Shared data helpers
       ========================================================= */
    function displayPortalValue(value) {
      if (value === undefined || value === null || value === "") return "—";
      if (typeof value === "boolean") return value ? "Yes" : "No";
      if (Array.isArray(value)) {
        const items = value.map(displayPortalValue).filter(item => item !== "—");
        return items.length ? items.join(", ") : "—";
      }
      if (typeof value === "object") {
        const preferred = value.label || value.name || value.title || value.displayName || value.value;
        if (preferred !== undefined) return displayPortalValue(preferred);
        try {
          return JSON.stringify(value);
        } catch {
          return "—";
        }
      }
      return String(value);
    }

    function firstRecordValue(record = {}, keys = [], fallback = "") {
      for (const key of keys) {
        if (!Object.prototype.hasOwnProperty.call(record, key)) continue;
        const value = record[key];
        if (value !== undefined && value !== null && value !== "") return value;
      }
      return fallback;
    }

    function hrRecordId(record = {}) {
      return String(firstRecordValue(record, ["id", "_id", "employeeId", "employeeNumber", "skId", "skID", "staffId"], ""));
    }

    function recordName(record = {}) {
      return String(firstRecordValue(
        record,
        ["displayName", "fullName", "name", "formalName"],
        [record.firstName, record.lastName].filter(Boolean).join(" ")
      ) || "Unnamed employee");
    }

    function recordInitials(record = {}) {
      const parts = [record.firstName, record.lastName].filter(Boolean);
      if (parts.length) return parts.map(value => String(value).charAt(0)).join("").slice(0, 2).toUpperCase();
      return recordName(record).split(/\s+/).filter(Boolean).slice(0, 2).map(value => value.charAt(0)).join("").toUpperCase() || "—";
    }

    function recordPhoto(record = {}) {
      return safeImageSource(firstRecordValue(record, [
        "badge_photo_url",
        "badgePhotoUrl",
        "badgePhoto",
        "photoUrl",
        "profilePhotoUrl",
        "avatarUrl",
        "imageUrl",
        "photo"
      ], ""));
    }

    function recordStatus(record = {}) {
      return displayPortalValue(firstRecordValue(record, ["employmentStatus", "status", "activeStatus"], record.active === false ? "Inactive" : "Active"));
    }

    function recordSearchText(record = {}) {
      return [
        recordName(record),
        firstRecordValue(record, ["skId", "skID", "employeeId", "employeeNumber"]),
        firstRecordValue(record, ["jobTitle", "positionTitle", "position", "role"]),
        firstRecordValue(record, ["assignedDepartment", "department", "departmentName"]),
        firstRecordValue(record, ["assignedBase", "station", "base", "baseAirportIata"]),
        firstRecordValue(record, ["corporateEmailAddress", "workEmail", "companyEmail", "email"])
      ].map(displayPortalValue).join(" ").toLowerCase();
    }

    function employeeById(id) {
      const target = String(id || "");
      return [...portalState.hr.staff, ...portalState.hr.archive].find(item => hrRecordId(item) === target) || null;
    }

    function selectedHrEmployee() {
      return employeeById(hrSelectedEmployeeId);
    }

    function renderObjectAvatar(record = {}, className = "hr-object-avatar") {
      const photo = recordPhoto(record);
      return `<span class="${className}">${photo ? `<img src="${escapeHtml(photo)}" alt="">` : escapeHtml(recordInitials(record))}</span>`;
    }

    function renderEmptyState(title, message, iconName = "info", action = "") {
      return `
        <div class="hr-empty">
          <div>
            <span class="empty-icon">${icon(iconName, 23)}</span>
            <strong>${escapeHtml(title)}</strong>
            <span>${escapeHtml(message)}</span>
            ${action}
          </div>
        </div>
      `;
    }

    function renderRecordTable(records, columns, options = {}) {
      const items = Array.isArray(records) ? records : [];
      if (!items.length) {
        return renderEmptyState(
          options.emptyTitle || "No records available",
          options.emptyMessage || "The backend did not return records for this section.",
          options.emptyIcon || "document"
        );
      }
      return `
        <div class="hr-table-scroll">
          <table class="data-table">
            <thead>
              <tr>${columns.map(column => `<th>${escapeHtml(column[0])}</th>`).join("")}</tr>
            </thead>
            <tbody>
              ${items.map((record, index) => {
                const id = options.id ? options.id(record, index) : hrRecordId(record) || String(index);
                const selected = options.selectedId && String(options.selectedId) === String(id);
                const attributes = options.action
                  ? `class="hr-table-row ${selected ? "selected" : ""}" tabindex="0" data-action="${escapeHtml(options.action)}" data-id="${escapeHtml(id)}"`
                  : "";
                return `
                  <tr ${attributes}>
                    ${columns.map(column => {
                      const value = typeof column[1] === "function"
                        ? column[1](record, index)
                        : firstRecordValue(record, Array.isArray(column[1]) ? column[1] : [column[1]]);
                      const rendered = column[2] === "status"
                        ? statusBadge(displayPortalValue(value))
                        : escapeHtml(displayPortalValue(value));
                      return `<td>${rendered}</td>`;
                    }).join("")}
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
        </div>
      `;
    }

    function genericColumns(records) {
      const blocked = /password|secret|token|credential|nationalid|passportnumber|accountnumber|routingnumber|iban/i;
      const preferred = [
        "name", "title", "status", "type", "category", "employeeId", "skId",
        "period", "date", "createdAt", "updatedAt", "amount", "currency", "owner"
      ];
      const keys = [];
      preferred.forEach(key => {
        if (records.some(record => record && Object.prototype.hasOwnProperty.call(record, key)) && !blocked.test(key)) keys.push(key);
      });
      records.slice(0, 5).forEach(record => {
        if (!record || typeof record !== "object") return;
        Object.keys(record).forEach(key => {
          if (keys.length >= 7 || keys.includes(key) || blocked.test(key)) return;
          const value = record[key];
          if (value === null || ["string", "number", "boolean"].includes(typeof value)) keys.push(key);
        });
      });
      return keys.slice(0, 7).map(key => [
        key.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").replace(/\b\w/g, char => char.toUpperCase()),
        [key],
        /status|state/i.test(key) ? "status" : ""
      ]);
    }

    /* =========================================================
       Employee profile, directory and application workspaces
       ========================================================= */
    function renderProfilePage() {
      const profile = { ...portalState.payroll.profile, ...getProfile() };
      const role = getRole();
      const groups = profileFieldGroups.filter(group => group.tab === currentProfileTab);
      return `
        <main class="page" id="mainContent">
          <div class="page-header">
            <div class="page-header-copy">
              <p class="eyebrow">${icon("profile", 14)} Employee Central</p>
              <h1 class="page-title">My Employee Profile</h1>
              <p class="page-subtitle">Your current personal, employment, time, qualification, and compensation records.</p>
            </div>
            <div class="page-actions">
              <button class="secondary-button" type="button" data-action="edit-profile">${icon("settings", 16)} Edit self-service details</button>
            </div>
          </div>

          <section class="hr-object-header">
            ${renderObjectAvatar(profile)}
            <div class="hr-object-copy">
              <h2>${escapeHtml(role.userName)}</h2>
              <p>${escapeHtml(role.title)} · ${escapeHtml(role.location)} · ${escapeHtml(role.employeeId)}</p>
            </div>
            <div class="hr-object-actions">${statusBadge(recordStatus(profile))}</div>
          </section>

          <div class="hr-panel">
            <div class="hr-panel-body">
              <div class="hr-subtabs" role="tablist" aria-label="Employee profile sections">
                ${profileTabs.map(([id, label]) => `
                  <button class="hr-subtab ${currentProfileTab === id ? "active" : ""}" type="button" data-action="profile-tab" data-view="${id}" role="tab" aria-selected="${currentProfileTab === id}">
                    ${escapeHtml(label)}
                  </button>
                `).join("")}
              </div>

              ${groups.length ? groups.map(group => renderProfileGroup(group, profile)).join("") : renderEmptyState(
                "No profile fields",
                "No fields are configured for this profile section.",
                "profile"
              )}
            </div>
          </div>

          
        </main>
      `;
    }

    function renderProfileGroup(group, record) {
      return `
        <section class="section" aria-labelledby="profile-${escapeHtml(group.id)}">
          <div class="section-header">
            <div class="section-title-group">
              <h2 id="profile-${escapeHtml(group.id)}">${escapeHtml(group.title)}</h2>
              <p>${escapeHtml(group.control)}</p>
            </div>
          </div>
          <div class="detail-grid">
            ${group.fields.map(([label, keys]) => `
              <div class="detail-field">
                <span>${escapeHtml(label)}</span>
                <strong>${escapeHtml(displayPortalValue(firstRecordValue(record, keys)))}</strong>
              </div>
            `).join("")}
          </div>
        </section>
      `;
    }

    function openProfileEditor() {
      const profile = getProfile();
      openDialog({
        id: "profile-editor",
        title: "Edit self-service details",
        subtitle: "Only fields approved for employee self-service are submitted.",
        body: `
          <form id="profileSelfServiceForm">
            <div class="hr-form-grid">
              ${editableProfileFields.map(field => {
                const value = field.sensitive ? "" : displayPortalValue(profile[field.key] === undefined ? "" : profile[field.key]);
                if (field.type === "select") {
                  return `
                    <label class="hr-field">
                      <span>${escapeHtml(field.label)}</span>
                      <select class="hr-select" name="${escapeHtml(field.key)}">
                        ${field.options.map(option => `<option value="${escapeHtml(option)}" ${String(profile[field.key] || "") === option ? "selected" : ""}>${escapeHtml(option || "Choose")}</option>`).join("")}
                      </select>
                    </label>
                  `;
                }
                return `
                  <label class="hr-field">
                    <span>${escapeHtml(field.label)}</span>
                    <input class="hr-input" name="${escapeHtml(field.key)}" value="${value === "—" ? "" : escapeHtml(value)}" autocomplete="${escapeHtml(field.autocomplete || "off")}" ${field.sensitive ? 'placeholder="Leave blank to keep current value"' : ""}>
                  </label>
                `;
              }).join("")}
            </div>
          </form>
        `,
        footer: `
          <button class="ghost-button" type="button" data-action="close-dialog">Cancel</button>
          <button class="primary-button" type="submit" form="profileSelfServiceForm">${icon("check", 16)} Save changes</button>
        `
      });
    }

    function renderDirectoryPage() {
      const query = directoryQuery.trim().toLowerCase();
      const colleagues = portalState.colleagues.filter(item => !query || recordSearchText(item).includes(query));
      return `
        <main class="page" id="mainContent">
          <div class="page-header">
            <div class="page-header-copy">
              <p class="eyebrow">${icon("directory", 14)} People Directory</p>
              <h1 class="page-title">Colleagues</h1>
              <p class="page-subtitle">Search authenticated employee directory records.</p>
            </div>
            <div class="page-actions">
              <button class="secondary-button" type="button" data-action="refresh-directory">${icon("clock", 16)} Refresh directory</button>
            </div>
          </div>

          <div class="toolbar">
            <label class="inline-search">
              ${icon("search", 16)}
              <span class="sr-only">Search colleagues</span>
              <input id="directorySearch" type="search" value="${escapeHtml(directoryQuery)}" placeholder="Name, SK-ID, role, department or base">
            </label>
            <span class="role-pill">${icon("users", 14)} ${colleagues.length} result${colleagues.length === 1 ? "" : "s"}</span>
          </div>

          <section class="hr-panel">
            <div class="hr-panel-body flush">
              ${!portalState.colleaguesLoaded ? renderEmptyState(
                "Directory not loaded",
                "Request directory data from the authenticated parent application.",
                "directory",
                `<button class="primary-button" type="button" data-action="refresh-directory">${icon("directory", 16)} Load directory</button>`
              ) : renderRecordTable(colleagues, [
                ["Name", recordName],
                ["Job title", ["jobTitle", "position", "role"]],
                ["Department", ["department", "assignedDepartment"]],
                ["Base", ["station", "assignedBase", "base"]],
                ["SK-ID", ["skId", "employeeId"]],
                ["Email", ["corporateEmailAddress", "workEmail", "email"]]
              ], {
                action: "open-colleague",
                id: record => record.skId || record.corporateEmailAddress || record.displayName,
                emptyTitle: "No colleagues found",
                emptyMessage: "Try a different search or refresh the directory.",
                emptyIcon: "search"
              })}
            </div>
          </section>

          
        </main>
      `;
    }

    function openColleagueDialog(id) {
      const colleague = portalState.colleagues.find(item => String(item.skId || item.corporateEmailAddress || item.displayName) === String(id));
      if (!colleague) return;
      portalState.selectedColleague = colleague;
      openDialog({
        id: "colleague-detail",
        title: recordName(colleague),
        subtitle: displayPortalValue(firstRecordValue(colleague, ["jobTitle", "position", "role"])),
        body: `
          <div class="detail-grid">
            ${[
              ["SK-ID", ["skId", "employeeId"]],
              ["Department", ["department", "assignedDepartment"]],
              ["Base", ["station", "assignedBase", "base"]],
              ["Email", ["corporateEmailAddress", "workEmail", "email"]],
              ["Work phone", ["workPhone", "phoneWork", "officePhone"]]
            ].map(([label, keys]) => `
              <div class="detail-field">
                <span>${escapeHtml(label)}</span>
                <strong>${escapeHtml(displayPortalValue(firstRecordValue(colleague, keys)))}</strong>
              </div>
            `).join("")}
          </div>
        `,
        footer: '<button class="primary-button" type="button" data-action="close-dialog">Close</button>'
      });
    }

    function renderAppWorkspacePage() {
      const app = roleItems("applicationTiles").find(item => item.id === currentAppId);
      if (!app) return renderAppsPage();
      const workspace = portalState.appWorkspaces[app.id] || defaultWorkspaceData;
      const metrics = Array.isArray(workspace.metrics) ? workspace.metrics : [];
      const rows = Array.isArray(workspace.rows) ? workspace.rows : [];
      const columns = Array.isArray(workspace.columns) ? workspace.columns : [];
      const links = portalState.usefulLinks.filter(roleAllows);
      return `
        <main class="page" id="mainContent">
          <div class="breadcrumb">
            <button type="button" data-route="apps">Applications</button>
            ${icon("arrowRight", 13)}
            <span>${escapeHtml(app.title)}</span>
          </div>

          <section class="app-object-header" style="--tile-color:${escapeHtml(app.color)};--tile-soft:${escapeHtml(app.soft)}">
            <span class="app-object-icon">${icon(app.icon, 30)}</span>
            <div class="app-object-copy">
              <h1>${escapeHtml(app.title)}</h1>
              <p>${escapeHtml(app.subtitle)}</p>
            </div>
            <div class="app-object-actions">
              ${app.path ? `<button class="primary-button" type="button" data-action="navigate-parent" data-path="${escapeHtml(app.path)}">${icon("arrowRight", 16)} Open system</button>` : ""}
            </div>
          </section>

          ${metrics.length ? `
            <section class="metric-grid">
              ${metrics.map(metric => renderMetricCard(metric[0], metric[1], metric[2] || "", app.icon)).join("")}
            </section>
          ` : ""}

          <div class="app-workspace">
            <section class="workspace-panel">
              <div class="panel-header">
                <h2>${escapeHtml(workspace.heading || "Application Data")}</h2>
                <span class="status-badge info">Live backend data</span>
              </div>
              <div class="data-table-wrap">
                ${rows.length && columns.length ? `
                  <table class="data-table">
                    <thead><tr>${columns.map(column => `<th>${escapeHtml(column)}</th>`).join("")}</tr></thead>
                    <tbody>
                      ${rows.map(row => `<tr>${columns.map((column, index) => `<td>${escapeHtml(displayPortalValue(row[index]))}</td>`).join("")}</tr>`).join("")}
                    </tbody>
                  </table>
                ` : renderEmptyState(
                  "No workspace records",
                  "This application can still be opened through its assigned route.",
                  app.icon
                )}
              </div>
            </section>

            <aside class="workspace-panel">
              <div class="panel-header"><h2>Related services</h2></div>
              <div class="side-list">
                ${links.length ? links.map(link => `
                  <button class="side-action" type="button" data-action="navigate-parent" data-path="${escapeHtml(link.path)}">
                    <span class="side-action-icon">${icon(link.icon, 18)}</span>
                    <span><strong>${escapeHtml(link.title)}</strong><span>${escapeHtml(link.subtitle)}</span></span>
                  </button>
                `).join("") : '<div class="search-empty">No related services were returned.</div>'}
              </div>
            </aside>
          </div>

          
        </main>
      `;
    }

    /* =========================================================
       HR Administration
       ========================================================= */
    function renderHrAdminPage() {
      const modules = allowedHrModules();
      if (!modules.length || portalState.hr.authorized === false) return renderHome();
      if (!canAccessHrModule(currentHrView)) currentHrView = modules[0][0];

      const bodyRenderers = {
        workforce: renderHrWorkforce,
        employee: renderHrEmployee,
        organization: renderHrOrganization,
        recruiting: renderHrRecruiting,
        performance: renderHrPerformance,
        badge: renderHrBadge,
        access: renderHrAccess
      };
      const renderBody = bodyRenderers[currentHrView] || bodyRenderers[modules[0][0]] || renderHrWorkforce;
      const canManageEmployees = canManageHrRecords();
      return `
        <main class="page hr-admin-page" id="mainContent">
          <section class="hr-admin-header">
            <div>
              <span class="hr-admin-kicker">${icon("lock", 14)} Role protected workspace</span>
              <h1>HR Administration</h1>
              <p>SuccessFactors modules are exposed from the authenticated employee's role and explicit access grants.</p>
            </div>
            <div class="hr-admin-header-actions">
              <button class="secondary-button" type="button" data-action="hr-refresh">${icon("clock", 16)} Refresh</button>
              ${canManageEmployees ? `<button class="secondary-button" type="button" data-action="hr-new-employee">${icon("plus", 16)} Add employee</button>` : ""}
            </div>
          </section>

          <nav class="hr-module-nav" aria-label="HR modules">
            ${modules.map(([id, label, iconName]) => `
              <button class="hr-module-tab ${currentHrView === id ? "active" : ""}" type="button" data-action="hr-module" data-view="${id}" aria-current="${currentHrView === id ? "page" : "false"}">
                ${icon(iconName, 15)} ${escapeHtml(label)}
              </button>
            `).join("")}
          </nav>

          <div class="hr-module-body">${renderBody()}</div>
        </main>
      `;
    }

    function renderHrKpis(items) {
      return `
        <div class="hr-kpi-grid">
          ${items.map(([label, value, note]) => `
            <article class="hr-kpi">
              <span>${escapeHtml(label)}</span>
              <strong>${escapeHtml(displayPortalValue(value))}</strong>
              <small>${escapeHtml(note || "")}</small>
            </article>
          `).join("")}
        </div>
      `;
    }

    function isActiveEmployee(record) {
      if (record.active === false) return false;
      return !/inactive|terminated|archived|former|offboard/i.test(recordStatus(record));
    }

    function renderHrWorkforce() {
      const allStaff = [...portalState.hr.staff, ...portalState.hr.archive];
      let scoped = allStaff;
      if (hrWorkforceScope === "active") scoped = allStaff.filter(isActiveEmployee);
      if (hrWorkforceScope === "archive") scoped = allStaff.filter(record => !isActiveEmployee(record));
      const query = hrSearchQuery.trim().toLowerCase();
      if (query) scoped = scoped.filter(record => recordSearchText(record).includes(query));
      const selected = selectedHrEmployee();
      const departments = new Set(portalState.hr.staff.map(item => displayPortalValue(firstRecordValue(item, ["assignedDepartment", "department"]))).filter(value => value !== "—"));
      return `
        ${renderHrKpis([
          ["Active workforce", portalState.hr.staff.filter(isActiveEmployee).length, "Current employee records"],
          ["Archived", portalState.hr.archive.length, "Former or archived staff"],
          ["Departments", departments.size, "Represented in current data"],
          ["Compliance alerts", portalState.hr.reports.expiries.length, "Expiring credentials"]
        ])}

        <div class="hr-workbench-grid">
          <section class="hr-panel">
            <div class="hr-panel-header">
              <div><h2>Workforce Directory</h2><p>Employee Central master records</p></div>
              <div class="hr-panel-actions">
                <button class="primary-button" type="button" data-action="hr-new-employee">${icon("plus", 15)} New employee</button>
              </div>
            </div>
            <div class="hr-search-row">
              <label class="inline-search">
                ${icon("search", 16)}
                <span class="sr-only">Search workforce</span>
                <input id="hrWorkforceSearch" type="search" value="${escapeHtml(hrSearchQuery)}" placeholder="Name, SK-ID, role, department or base">
              </label>
              <div class="filter-chips">
                ${[
                  ["active", "Active"],
                  ["archive", "Archived"],
                  ["all", "All"]
                ].map(([id, label]) => `
                  <button class="filter-chip ${hrWorkforceScope === id ? "active" : ""}" type="button" data-action="hr-workforce-scope" data-view="${id}">${label}</button>
                `).join("")}
              </div>
            </div>
            <div class="hr-panel-body flush">
              ${renderRecordTable(scoped, [
                ["Employee", recordName],
                ["SK-ID", ["skId", "skID", "employeeId"]],
                ["Job title", ["jobTitle", "positionTitle", "position", "role"]],
                ["Department", ["assignedDepartment", "department"]],
                ["Base", ["assignedBase", "station", "base"]],
                ["Status", recordStatus, "status"]
              ], {
                action: "hr-select-employee",
                id: hrRecordId,
                selectedId: hrSelectedEmployeeId,
                emptyTitle: "No employee records",
                emptyMessage: "No records match the selected workforce scope.",
                emptyIcon: "users"
              })}
            </div>
          </section>

          <aside class="hr-panel">
            <div class="hr-panel-header"><div><h2>Selected Employee</h2><p>Quick record summary</p></div></div>
            <div class="hr-panel-body">
              ${selected ? `
                <div class="hr-object-header" style="grid-template-columns:48px minmax(0,1fr);box-shadow:none;margin:0 0 14px;padding:12px">
                  ${renderObjectAvatar(selected)}
                  <div class="hr-object-copy">
                    <h2>${escapeHtml(recordName(selected))}</h2>
                    <p>${escapeHtml(displayPortalValue(firstRecordValue(selected, ["jobTitle", "position", "role"])))}</p>
                  </div>
                </div>
                <div class="detail-grid">
                  ${[
                    ["SK-ID", ["skId", "employeeId"]],
                    ["Department", ["assignedDepartment", "department"]],
                    ["Base", ["assignedBase", "station", "base"]],
                    ["Manager", ["managerName", "reportsToName"]],
                    ["Hire date", ["hireDate", "startDate"]],
                    ["Status", ["employmentStatus", "status"]]
                  ].map(([label, keys]) => `
                    <div class="detail-field"><span>${label}</span><strong>${escapeHtml(displayPortalValue(firstRecordValue(selected, keys)))}</strong></div>
                  `).join("")}
                </div>
                <div class="hr-action-row" style="margin-top:14px">
                  <button class="primary-button" type="button" data-action="hr-open-selected">${icon("profile", 15)} Open full record</button>
                  <button class="ghost-button" type="button" data-action="hr-use-badge">${icon("profile", 15)} Badge</button>
                </div>
              ` : renderEmptyState("No employee selected", "Choose a workforce row to inspect the record.", "profile")}
            </div>
          </aside>
        </div>
      `;
    }


    function orgCatalog() {
      const live = portalState.hr?.orgCatalog;
      const valid = live && typeof live === "object" && live.ok === true;
      return {
        ok: valid,
        companyCode: String(live?.companyCode || SKANDI_COMPANY_CODE),
        departments: valid && Array.isArray(live.departments) ? live.departments : [],
        bases: valid && Array.isArray(live.bases) ? live.bases : [],
        roles: valid && Array.isArray(live.roles) ? live.roles : [],
        accessRoles: valid && Array.isArray(live.accessRoles) ? live.accessRoles : [],
        permissionPresets: valid && Array.isArray(live.permissionPresets) ? live.permissionPresets : [],
        roleBaseRules: valid && Array.isArray(live.roleBaseRules) ? live.roleBaseRules : [],
        countries: valid && Array.isArray(live.countries) ? live.countries : [],
        countryRules: valid && Array.isArray(live.countryRules) ? live.countryRules : [],
        baseJurisdictions: valid && Array.isArray(live.baseJurisdictions) ? live.baseJurisdictions : [],
        roleRequirements: valid && Array.isArray(live.roleRequirements) ? live.roleRequirements : [],
        audit: valid && Array.isArray(live.audit) ? live.audit : [],
        smartLogicVersion: valid ? String(live.smartLogicVersion || "") : ""
      };
    }

    function orgCatalogReady() {
      const c = orgCatalog();
      return c.ok && c.departments.length > 0 && c.bases.length > 0 && c.roles.length > 0 && c.permissionPresets.length > 0;
    }

    function orgRecordRoleId(record={}) {
      const c=orgCatalog();
      const explicit=String(firstRecordValue(record,["roleId","role_id","jobCode","job_code"],"")||"").trim().toUpperCase();
      if(explicit) return c.roles.find(r=>String(r.role_id||r.job_code).toUpperCase()===explicit)?.role_id||explicit;
      const title=String(firstRecordValue(record,["jobTitle","positionTitle","title"],"")||"").trim().toLowerCase();
      return c.roles.find(r=>String(r.title||"").trim().toLowerCase()===title)?.role_id||"";
    }
    function orgRecordDepartmentId(record={}) {
      const c=orgCatalog(), role=c.roles.find(r=>r.role_id===orgRecordRoleId(record));
      const explicit=String(firstRecordValue(record,["departmentId","department_id","departmentCode","department_code"],"")||"").trim().toUpperCase();
      if(explicit) return c.departments.find(d=>String(d.id).toUpperCase()===explicit||String(d.code).toUpperCase()===explicit)?.id||explicit;
      if(role?.department_id)return role.department_id;
      const text=String(firstRecordValue(record,["assignedDepartment","department","departmentName"],"")||"").trim().toLowerCase();
      return c.departments.find(d=>String(d.name||"").toLowerCase()===text)?.id||"";
    }
    function orgRecordBaseCode(record={}) {
      const c=orgCatalog();
      const explicit=String(firstRecordValue(record,["baseCode","base_code","assignedBaseId"],"")||"").trim().toUpperCase();
      if(explicit&&c.bases.some(b=>String(b.code).toUpperCase()===explicit))return explicit;
      const text=String(firstRecordValue(record,["assignedBase","base","station","baseAirportIata"],"")||"").trim().toLowerCase();
      return c.bases.find(b=>[b.code,b.name,b.city,b.airport_iata,b.destination_code].some(v=>String(v||"").toLowerCase()===text))?.code||"";
    }
    function orgRecordCountryCode(record={}) {
      const c=orgCatalog(),base=c.bases.find(b=>String(b.code)===String(orgRecordBaseCode(record)));
      const explicit=String(firstRecordValue(record,["employmentCountry","countryOfEmployment","countryCode","country_code","taxCountry"],"")||"").trim().toUpperCase();
      if(/^[A-Z]{2}$/.test(explicit)) return explicit;
      const byName=c.countryRules.find(rule=>String(rule.country_name||"").trim().toLowerCase()===explicit.toLowerCase());
      return byName?.country_code||String(base?.country_code||"").toUpperCase();
    }
    function orgCountryRule(code) {
      const target=String(code||"").toUpperCase();
      return orgCatalog().countryRules.find(r=>String(r.country_code||"").toUpperCase()===target)||null;
    }
    function orgBaseJurisdiction(code) {
      return orgCatalog().baseJurisdictions.find(r=>String(r.base_code||"").toUpperCase()===String(code||"").toUpperCase())||null;
    }
    function orgRoleRequirement(roleId) {
      return orgCatalog().roleRequirements.find(r=>String(r.role_id||"")===String(roleId||""))||null;
    }
    function orgPreset(id){return orgCatalog().permissionPresets.find(p=>String(p.preset_id||p.id)===String(id))||null}
    function orgOption(label,value,selected,disabled=false){return `<option value="${escapeHtml(value)}" ${String(value)===String(selected)?"selected":""} ${disabled?"disabled":""}>${escapeHtml(label)}</option>`}

    function orgEmploymentCountries(record={}) {
      const c=orgCatalog();
      const activePhysicalCountries=new Set(c.bases.filter(b=>b.active!==false&&String(b.country_code||"")).map(b=>String(b.country_code).toUpperCase()));
      let rows=c.countryRules.filter(r=>r.active!==false&&r.employment_enabled!==false&&activePhysicalCountries.has(String(r.country_code||"").toUpperCase()));
      const current=orgRecordCountryCode(record);
      if(current&&!rows.some(r=>String(r.country_code).toUpperCase()===current)){
        const currentRule=c.countryRules.find(r=>String(r.country_code||"").toUpperCase()===current);
        if(currentRule) rows=[currentRule,...rows];
      }
      return rows.sort((a,b)=>String(a.country_name||a.country_code).localeCompare(String(b.country_name||b.country_code)));
    }
    function orgBasesForCountry(countryCode, role=null) {
      const c=orgCatalog(),country=String(countryCode||"").toUpperCase();
      if(!country)return[];
      const virtual=new Set(["GLOBAL","REMOTE","EXTERNAL"]);
      let bases=c.bases.filter(b=>b.active!==false&&(String(b.country_code||"").toUpperCase()===country||virtual.has(String(b.code||"").toUpperCase())));
      if(role){
        const allowed=new Set(c.roleBaseRules.filter(x=>String(x.role_id)===String(role.role_id)&&x.active!==false).map(x=>String(x.base_code)));
        if(allowed.size) bases=bases.filter(b=>allowed.has(String(b.code)));
      }
      return bases;
    }
    function orgRolesForBase(baseCode,countryCode) {
      const c=orgCatalog(),base=String(baseCode||"");
      if(!base)return[];
      const roleIds=new Set(c.roleBaseRules.filter(x=>String(x.base_code)===base&&x.active!==false).map(x=>String(x.role_id)));
      const rows=roleIds.size?c.roles.filter(r=>r.active!==false&&roleIds.has(String(r.role_id))):[];
      return rows.sort((a,b)=>String(a.title||"").localeCompare(String(b.title||"")));
    }
    function orgManagerCandidates(role,baseCode,record={}){
      if(!role?.reports_to_role_id)return[];
      const currentId=hrRecordId(record);
      const candidates=portalState.hr.staff.filter(item=>{
        if(hrRecordId(item)===currentId)return false;
        return orgRecordRoleId(item)===role.reports_to_role_id && firstRecordValue(item,["active"],true)!==false;
      });
      const same=candidates.filter(item=>orgRecordBaseCode(item)===baseCode);
      return same.length?same:candidates;
    }
    function orgManagerOptionLabel(item){
      return `${recordName(item)}${firstRecordValue(item,["skId","employeeId"],"")?` · ${firstRecordValue(item,["skId","employeeId"],"")}`:""}${orgRecordBaseCode(item)?` · ${orgRecordBaseCode(item)}`:""}`;
    }

    function smartFieldLabel(key="") {
      const labels={
        firstName:"First Name",lastName:"Last Name",corporateEmailAddress:"Corporate Email",employmentCountry:"Employment Country",
        employmentType:"Employment Type",hireDate:"Hire Date",homeAddressStreet:"Residential Street",homeAddressCity:"City",
        homeAddressState:"State",homeAddressProvince:"Province",homeAddressPostalCode:"Postal / ZIP",workEligibilityStatus:"Work Eligibility",
        contractStatus:"Employment Contract",personalIdentityStatus:"Personal Identity",nationalIdentityStatus:"National Identity / D-number",
        taxCardStatus:"Tax Card",taxWithholdingStatus:"Tax Withholding",taxIdentityStatus:"Tax Identity",socialSecurityRegistrationStatus:"Social Security Registration",
        erganiRegistrationStatus:"ERGANI Registration",i9Status:"I-9",classificationStatus:"Worker Classification",standardWeeklyHours:"Standard Weekly Hours",
        provinceOfEmployment:"Province of Employment",td1FederalStatus:"Federal TD1",td1ProvincialStatus:"Provincial TD1",sinStatus:"SIN Status",
        dpaeStatus:"DPAE",airportBadgeStatus:"Airport Badge",airportBadgeAuthority:"Airport Badge Authority",airportDutyCertified:"Airport Duty Certification",
        managerTrainingStatus:"Manager Training",currency:"Payroll Currency",compensationType:"Compensation Type",payFrequency:"Pay Frequency",
        taxRegion:"Payroll / Tax Region",bankStatus:"Bank Setup Status"
      };
      return labels[key]||String(key).replace(/([a-z0-9])([A-Z])/g,"$1 $2").replace(/^./,c=>c.toUpperCase());
    }
    function allProfileFieldKeys() {
      const set=new Set();
      profileFieldGroups.forEach(group=>group.fields.forEach(([,keys])=>(Array.isArray(keys)?keys:[]).forEach(key=>set.add(key))));
      return set;
    }
    function smartRequirementValue(record,key) {
      return firstRecordValue(record,[key], "");
    }
    function smartFieldRule(countryRule,key) {
      return (countryRule?.field_rules&&countryRule.field_rules[key])||{};
    }
    function smartFallbackOptions(key) {
      const map={
        airportBadgeStatus:["Not required","Pending","Requested","Issued","Expired"],
        airportDutyCertified:["No","Pending","Certified"],
        managerTrainingStatus:["Not required","Pending","Complete"],
        contractStatus:["Draft","Issued","Signed","Updated"],
        bankStatus:["not_verified","pending","verified"],
        compensationType:["Hourly","Salary"],
        workEligibilityStatus:["Pending","Verified","Reverification required","Not applicable"]
      };
      return map[key]||[];
    }
    function renderSmartDynamicField(record,key,countryRule,required=true) {
      const rule=smartFieldRule(countryRule,key), options=Array.isArray(rule.options)&&rule.options.length?rule.options:smartFallbackOptions(key);
      const value=String(smartRequirementValue(record,key)||"");
      const label=smartFieldLabel(key);
      if(options.length){
        return `<label class="hr-field"><span>${escapeHtml(label)}${required?" *":""}</span><select class="hr-select" name="${escapeHtml(key)}" ${required?"required":""}><option value="">Select</option>${options.map(x=>orgOption(x,x,value)).join("")}</select></label>`;
      }
      const type=/Date$|At$/.test(key)?"date":/Hours|Percent|Rate/.test(key)?"number":"text";
      return `<label class="hr-field"><span>${escapeHtml(label)}${required?" *":""}</span><input class="hr-input" type="${type}" name="${escapeHtml(key)}" value="${escapeHtml(value)}" ${required?"required":""}></label>`;
    }
    function smartRequirements(record={},countryCode="",roleId="",baseCode="") {
      const country=orgCountryRule(countryCode),roleReq=orgRoleRequirement(roleId),jurisdiction=orgBaseJurisdiction(baseCode);
      const hr=[...new Set([...(country?.required_hr_fields||[]),...(roleReq?.required_hr_fields||[])])];
      const payroll=[...new Set([...(country?.required_payroll_fields||[]),...(roleReq?.required_payroll_fields||[])])];
      const docs=[...new Set(roleReq?.required_documents||[])];
      return {country,roleReq,jurisdiction,hr,payroll,docs};
    }
    function renderSmartRequirements(record={},countryCode="",roleId="",baseCode="") {
      const req=smartRequirements(record,countryCode,roleId,baseCode);
      if(!req.country) return `<div class="org-warning">Select Country of Employment first. The HR requirements will then be loaded from the System. Payroll setup remains in the separate Payroll application.</div>`;
      const known=allProfileFieldKeys(),dynamic=req.hr.filter(key=>!known.has(key));
      const missing=req.hr.filter(key=>!String(smartRequirementValue(record,key)||"").trim());
      return `
        <div class="org-smart-requirements" id="orgSmartRequirements">
          <div class="org-provision-grid" style="margin-top:10px">
            <div class="org-derived"><span>Payroll Reference Currency</span><strong>${escapeHtml(req.country.currency_code||"—")}</strong></div>
            <div class="org-derived"><span>Bank Scheme</span><strong>${escapeHtml(req.country.bank_scheme||"—")}</strong></div>
            <div class="org-derived"><span>Payroll Reference Region</span><strong>${escapeHtml(req.jurisdiction?.payroll_region||"—")}</strong></div>
            <div class="org-derived"><span>Legal Work Location</span><strong>${escapeHtml(req.jurisdiction?.legal_work_location||"—")}</strong></div>
          </div>
          <div class="hr-note ${missing.length?"warning":""}" style="margin-top:10px">
            <strong>${missing.length?`${missing.length} required HR field${missing.length===1?"":"s"} still incomplete`:"Country/role HR requirements complete"}</strong>
            <div style="margin-top:6px">${req.hr.map(key=>`<span class="org-permission-chip">${escapeHtml(smartFieldLabel(key))}</span>`).join("")}</div>
          </div>
          ${dynamic.length?`<div class="section" style="margin-top:10px"><div class="section-header"><div class="section-title-group"><h2>Country & Role Requirements</h2><p>Shown because of the selected country/base/position.</p></div></div><div class="hr-form-grid">${dynamic.map(key=>renderSmartDynamicField(record,key,req.country,true)).join("")}</div></div>`:""}
          ${req.docs.length?`<div class="hr-note" style="margin-top:10px"><strong>Required documents</strong><div style="margin-top:6px">${req.docs.map(x=>`<span class="org-permission-chip">${escapeHtml(String(x).replace(/_/g," "))}</span>`).join("")}</div></div>`:""}
        </div>`;
    }

    function renderOrgProvisionCard(record={}){
      if (!orgCatalogReady()) {
        return `<div class="org-provision-card" id="orgProvisionCard"><div class="org-provision-head"><div><h3>Smart Employment Assignment</h3><p>The live organization catalog is not available. No fallback codebook is used in V9.</p></div><span class="status-badge warning">Live data required</span></div><div class="org-warning">Departments, bases, positions, access roles and payroll rules must load from the System before an assignment can be changed.</div><div style="margin-top:10px"><button class="secondary-button" type="button" data-action="hr-org-refresh">Reload organization data</button></div></div>`;
      }
      const c=orgCatalog(),countryCode=orgRecordCountryCode(record),baseCode=orgRecordBaseCode(record),roleId=orgRecordRoleId(record);
      const countries=orgEmploymentCountries(record),baseChoices=orgBasesForCountry(countryCode),roleChoices=orgRolesForBase(baseCode,countryCode);
      const role=roleChoices.find(r=>r.role_id===roleId)||c.roles.find(r=>r.role_id===roleId)||null;
      const departmentId=role?.department_id||orgRecordDepartmentId(record),dept=c.departments.find(d=>d.id===departmentId);
      const managers=orgManagerCandidates(role,baseCode,record),preset=orgPreset(role?.permission_preset_id),permissions=Array.isArray(preset?.permission_keys)?preset.permission_keys:[];
      const currentManager=String(firstRecordValue(record,["managerAgentUserId","manager_agent_user_id"],"")||"");
      const base=c.bases.find(b=>String(b.code)===String(baseCode));
      return `<div class="org-provision-card" id="orgProvisionCard">
        <div class="org-provision-head"><div><h3>Smart Employment Assignment</h3><p>Start with Country of Employment. SuccessFactors then limits bases, positions, department, manager, compliance requirements and payroll reference context to valid System records. Payroll itself remains separate.</p></div><span class="status-badge info">System controlled</span></div>
        <div class="org-provision-grid">
          <label class="hr-field"><span>1. Country of Employment</span><select class="hr-select" id="orgCountrySelect" name="employmentCountry" required><option value="">Select country first</option>${countries.map(r=>orgOption(`${r.country_code} · ${r.country_name}`,r.country_code,countryCode,r.employment_enabled===false)).join("")}</select></label>
          <label class="hr-field"><span>2. Base / Work Location</span><select class="hr-select" id="orgBaseSelect" name="baseCode" ${countryCode?"":"disabled"} required><option value="">${countryCode?"Select eligible base":"Select country first"}</option>${baseChoices.map(b=>orgOption(`${b.code} · ${b.name}`,b.code,baseCode)).join("")}</select></label>
          <label class="hr-field"><span>3. Position / Job Title</span><select class="hr-select" id="orgRoleSelect" name="roleId" ${baseCode?"":"disabled"} required><option value="">${baseCode?"Select eligible position":"Select base first"}</option>${roleChoices.map(r=>orgOption(r.title,r.role_id,roleId)).join("")}</select></label>
          <label class="hr-field"><span>4. Manager</span><select class="hr-select" id="orgManagerSelect" name="managerAgentUserId" ${role?.reports_to_role_id?"":"disabled"}><option value="">${role?.reports_to_role_id?(managers.length?"Auto / select valid manager":`No active ${escapeHtml(role.reports_to_title||role.reports_to_role_id)} found`):"No manager required"}</option>${managers.map(m=>orgOption(orgManagerOptionLabel(m),hrRecordId(m),currentManager)).join("")}</select></label>
          <label class="hr-field"><span>Effective From</span><input class="hr-input" type="date" name="effectiveFrom" value="${escapeHtml(String(firstRecordValue(record,["orgEffectiveFrom","effectiveFrom"],new Date().toISOString().slice(0,10))).slice(0,10))}" required></label>
          <label class="hr-field"><span>Job Code</span><input class="hr-input org-system-field" id="orgJobCodeDisplay" value="${escapeHtml(role?.job_code||role?.role_id||"")}" readonly></label>
        </div>
        <input type="hidden" name="companyCode" value="${escapeHtml(c.companyCode||"SK01")}">
        <input type="hidden" id="orgJobCodeValue" name="jobCode" value="${escapeHtml(role?.job_code||role?.role_id||"")}">
        <input type="hidden" id="orgJobTitleValue" name="jobTitle" value="${escapeHtml(role?.title||firstRecordValue(record,["jobTitle"],""))}">
        <input type="hidden" id="orgDepartmentIdValue" name="departmentId" value="${escapeHtml(departmentId||"")}">
        <input type="hidden" id="orgDepartmentNameValue" name="assignedDepartment" value="${escapeHtml(dept?.name||firstRecordValue(record,["assignedDepartment","department"],""))}">
        <input type="hidden" id="orgDepartmentCodeValue" name="departmentCode" value="${escapeHtml(dept?.code||"")}">
        <input type="hidden" id="orgAssignedBaseValue" name="assignedBase" value="${escapeHtml(baseCode)}">
        <input type="hidden" id="orgStationValue" name="station" value="${escapeHtml(base?.airport_iata||base?.destination_code||base?.code||"")}">
        <input type="hidden" id="orgCountryCodeValue" name="countryCode" value="${escapeHtml(countryCode)}">
        <input type="hidden" id="orgTaxCountryValue" name="taxCountry" value="${escapeHtml(countryCode)}">
        <input type="hidden" id="orgManagerNameValue" name="managerName" value="${escapeHtml(firstRecordValue(record,["managerName"],""))}">
        <input type="hidden" id="orgManagerSkIdValue" name="managerSkId" value="${escapeHtml(firstRecordValue(record,["managerSkId"],""))}">
        <input type="hidden" id="orgManagerEmailValue" name="managerEmail" value="${escapeHtml(firstRecordValue(record,["managerEmail"],""))}">
        <input type="hidden" id="orgAccessRoleValue" name="accessRole" value="${escapeHtml(role?.default_access_role||firstRecordValue(record,["accessRole"],""))}">
        <input type="hidden" id="orgPermissionPresetValue" name="permissionPreset" value="${escapeHtml(role?.permission_preset_id||firstRecordValue(record,["permissionPreset"],""))}">
        <input type="hidden" id="orgCurrencyValue" name="currency" value="${escapeHtml(orgCountryRule(countryCode)?.currency_code||"")}">
        <input type="hidden" id="orgTaxRegionValue" name="taxRegion" value="${escapeHtml(orgBaseJurisdiction(baseCode)?.payroll_region||"")}">
        <div class="org-provision-grid" style="margin-top:10px">
          <div class="org-derived"><span>Department</span><strong id="orgDerivedDepartment">${escapeHtml(dept?.name||"—")}</strong></div>
          <div class="org-derived"><span>Reports To Role</span><strong id="orgDerivedReportsTo">${escapeHtml(role?.reports_to_title||"—")}</strong></div>
          <div class="org-derived"><span>Access Role</span><strong id="orgDerivedAccessRole">${escapeHtml(role?.default_access_role||"—")}</strong></div>
          <div class="org-derived"><span>Permission Preset</span><strong id="orgDerivedPreset">${escapeHtml(role?.permission_preset_id||"—")}</strong></div>
          <div class="org-derived" style="grid-column:span 2"><span>Permission Preview</span><div class="org-permission-chips" id="orgPermissionPreview">${permissions.length?permissions.map(x=>`<span class="org-permission-chip">${escapeHtml(x)}</span>`).join(""):'<strong>—</strong>'}</div></div>
        </div>
        <div id="orgSmartRequirementsHost">${renderSmartRequirements(record,countryCode,role?.role_id||"",baseCode)}</div>
        ${role?.reports_to_role_id&&!managers.length?`<div class="org-warning">This position reports to <b>${escapeHtml(role.reports_to_title||role.reports_to_role_id)}</b>, but no active employee currently holds that reporting role. The backend will never guess a manager.</div>`:""}
      </div>`;
    }

    function renderOrgManagedField(label,name,record){
      const derived={
        "Role":()=>orgCatalog().roles.find(x=>x.role_id===orgRecordRoleId(record))?.default_access_role||firstRecordValue(record,["role"],""),
        "Job Title":()=>orgCatalog().roles.find(x=>x.role_id===orgRecordRoleId(record))?.title||firstRecordValue(record,["jobTitle"],""),
        "Job Code":()=>orgCatalog().roles.find(x=>x.role_id===orgRecordRoleId(record))?.job_code||orgRecordRoleId(record),
        "Assigned Department":()=>orgCatalog().departments.find(x=>x.id===orgRecordDepartmentId(record))?.name||firstRecordValue(record,["assignedDepartment","department"],""),
        "Department Code":()=>orgCatalog().departments.find(x=>x.id===orgRecordDepartmentId(record))?.code||firstRecordValue(record,["departmentCode"],""),
        "Assigned Base":()=>orgCatalog().bases.find(x=>x.code===orgRecordBaseCode(record))?.name||firstRecordValue(record,["assignedBase","base"],""),
        "Base Code":()=>orgRecordBaseCode(record),
        "Base Airport IATA":()=>orgCatalog().bases.find(x=>x.code===orgRecordBaseCode(record))?.airport_iata||firstRecordValue(record,["baseAirportIata","station"],""),
        "Manager Name":()=>firstRecordValue(record,["managerName"],""),"Manager SK-ID":()=>firstRecordValue(record,["managerSkId"],""),"Manager Email":()=>firstRecordValue(record,["managerEmail"],""),
        "Access Role":()=>orgCatalog().roles.find(x=>x.role_id===orgRecordRoleId(record))?.default_access_role||firstRecordValue(record,["accessRole"],""),
        "Permission Preset":()=>orgCatalog().roles.find(x=>x.role_id===orgRecordRoleId(record))?.permission_preset_id||firstRecordValue(record,["permissionPreset"],""),
        "Employment Country":()=>orgRecordCountryCode(record),
        "Tax Country":()=>orgRecordCountryCode(record),
        "Tax Region":()=>orgBaseJurisdiction(orgRecordBaseCode(record))?.payroll_region||firstRecordValue(record,["taxRegion"],"")
      };
      if(!derived[label])return"";
      const value=displayPortalValue(derived[label]());
      return `<label class="hr-field"><span>${escapeHtml(label)}</span><input class="hr-input org-system-field" value="${escapeHtml(value==='—'?'':value)}" readonly><small style="color:var(--sap-text-muted)">Controlled by Smart Employment Assignment above.</small></label>`;
    }

    function syncOrgProvisionForm(changed=""){
      const card=document.getElementById("orgProvisionCard");if(!card)return;
      const c=orgCatalog(),countrySel=document.getElementById("orgCountrySelect"),baseSel=document.getElementById("orgBaseSelect"),roleSel=document.getElementById("orgRoleSelect"),managerSel=document.getElementById("orgManagerSelect");
      if(changed==="country"){if(baseSel)baseSel.value="";if(roleSel)roleSel.value="";if(managerSel)managerSel.value=""}
      if(changed==="base"){if(roleSel)roleSel.value="";if(managerSel)managerSel.value=""}
      const countryCode=String(countrySel?.value||"").toUpperCase();
      const baseChoices=orgBasesForCountry(countryCode);
      let baseCode=baseSel?.value||"";
      if(baseSel){
        baseSel.disabled=!countryCode;
        baseSel.innerHTML=`<option value="">${countryCode?"Select eligible base":"Select country first"}</option>`+baseChoices.map(b=>orgOption(`${b.code} · ${b.name}`,b.code,baseCode)).join("");
        if(!baseChoices.some(b=>String(b.code)===String(baseCode)))baseCode="";
        baseSel.value=baseCode;
      }
      const roleChoices=orgRolesForBase(baseCode,countryCode);
      let roleId=roleSel?.value||"",role=roleChoices.find(r=>String(r.role_id)===String(roleId))||null;
      if(roleSel){
        roleSel.disabled=!baseCode;
        roleSel.innerHTML=`<option value="">${baseCode?"Select eligible position":"Select base first"}</option>`+roleChoices.map(r=>orgOption(r.title,r.role_id,roleId)).join("");
        if(!role)roleId="";
        roleSel.value=roleId;
      }
      const dept=c.departments.find(d=>String(d.id)===String(role?.department_id)),base=c.bases.find(b=>String(b.code)===String(baseCode));
      const managers=orgManagerCandidates(role,baseCode,selectedHrEmployee()||{}),managerCurrent=managerSel?.value||"";
      if(managerSel){
        managerSel.disabled=!role?.reports_to_role_id;
        managerSel.innerHTML=`<option value="">${role?.reports_to_role_id?(managers.length?"Auto / select valid manager":`No active ${role.reports_to_title||role.reports_to_role_id} found`):"No manager required"}</option>`+managers.map(m=>orgOption(orgManagerOptionLabel(m),hrRecordId(m),managerCurrent)).join("");
        if(managers.length===1)managerSel.value=hrRecordId(managers[0]);
      }
      const manager=managers.find(m=>hrRecordId(m)===managerSel?.value)||null,preset=orgPreset(role?.permission_preset_id),permissions=Array.isArray(preset?.permission_keys)?preset.permission_keys:[],countryRule=orgCountryRule(countryCode),jurisdiction=orgBaseJurisdiction(baseCode);
      const val=(id,v)=>{const el=document.getElementById(id);if(el)el.value=v||""};
      val("orgJobCodeDisplay",role?.job_code||role?.role_id);val("orgJobCodeValue",role?.job_code||role?.role_id);val("orgJobTitleValue",role?.title);val("orgDepartmentIdValue",dept?.id);val("orgDepartmentNameValue",dept?.name);val("orgDepartmentCodeValue",dept?.code);val("orgAssignedBaseValue",base?.code);val("orgStationValue",base?.airport_iata||base?.destination_code||base?.code);val("orgCountryCodeValue",countryCode);val("orgTaxCountryValue",countryCode);val("orgCurrencyValue",countryRule?.currency_code);val("orgTaxRegionValue",jurisdiction?.payroll_region);val("orgManagerNameValue",manager?recordName(manager):"");val("orgManagerSkIdValue",manager?firstRecordValue(manager,["skId","employeeId"],""):"");val("orgManagerEmailValue",manager?firstRecordValue(manager,["corporateEmailAddress","email"],""):"");val("orgAccessRoleValue",role?.default_access_role);val("orgPermissionPresetValue",role?.permission_preset_id);
      const txt=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v||"—"};
      txt("orgDerivedDepartment",dept?.name);txt("orgDerivedReportsTo",role?.reports_to_title);txt("orgDerivedAccessRole",role?.default_access_role);txt("orgDerivedPreset",role?.permission_preset_id);
      const pp=document.getElementById("orgPermissionPreview");if(pp)pp.innerHTML=permissions.length?permissions.map(x=>`<span class="org-permission-chip">${escapeHtml(x)}</span>`).join(""):"<strong>—</strong>";
      const host=document.getElementById("orgSmartRequirementsHost");if(host)host.innerHTML=renderSmartRequirements(selectedHrEmployee()||{},countryCode,role?.role_id||"",baseCode);
    }

    function renderHrEmployee() {
      const record = hrEmployeeDraftMode ? {} : selectedHrEmployee();
      if (!record && !hrEmployeeDraftMode) {
        return `
          <section class="hr-panel">
            ${renderEmptyState(
              "Select an employee",
              "Choose a record from Workforce or start a new employee record.",
              "profile",
              `<button class="primary-button" type="button" data-action="hr-new-employee">${icon("plus", 16)} Add employee</button>`
            )}
          </section>
        `;
      }
      const groups = profileFieldGroups.filter(group => group.tab === currentHrEmployeeTab);
      const title = hrEmployeeDraftMode ? "New Employee" : recordName(record);
      return `
        <section class="hr-object-header">
          ${renderObjectAvatar(record)}
          <div class="hr-object-copy">
            <h2>${escapeHtml(title)}</h2>
            <p>${hrEmployeeDraftMode ? "Create an Employee Central record" : `${escapeHtml(displayPortalValue(firstRecordValue(record, ["jobTitle", "position", "role"])))} · ${escapeHtml(displayPortalValue(firstRecordValue(record, ["skId", "employeeId"])))}`}</p>
          </div>
          <div class="hr-object-actions hr-action-row">
            <button class="secondary-button" type="button" data-action="hr-generate-skid">${icon("settings", 15)} Generate SK-ID</button>
            ${!hrEmployeeDraftMode ? `<button class="semantic-button danger" type="button" data-action="hr-archive-employee">${icon("warning", 15)} Archive</button>` : ""}
            <button class="primary-button" type="submit" form="hrEmployeeForm">${icon("check", 15)} Save employee</button>
          </div>
        </section>

        <section class="hr-panel">
          <div class="hr-panel-body">
            <div class="hr-subtabs" role="tablist" aria-label="Employee record sections">
              ${profileTabs.map(([id, label]) => `
                <button class="hr-subtab ${currentHrEmployeeTab === id ? "active" : ""}" type="button" data-action="hr-employee-tab" data-view="${id}" role="tab" aria-selected="${currentHrEmployeeTab === id}">
                  ${escapeHtml(label)}
                </button>
              `).join("")}
            </div>

            <form id="hrEmployeeForm">
              <input type="hidden" name="recordId" value="${escapeHtml(hrRecordId(record))}">
              <div class="hr-note" style="margin-bottom:14px">Changes are submitted to the parent application. This embed does not store employee records locally.</div>
              ${currentHrEmployeeTab === "employment" ? renderOrgProvisionCard(record || {}) : ""}
              ${groups.map(group => `
                <section class="section">
                  <div class="section-header">
                    <div class="section-title-group"><h2>${escapeHtml(group.title)}</h2><p>${escapeHtml(group.control)}</p></div>
                  </div>
                  <div class="hr-form-grid">
                    ${group.fields.map(([label, keys]) => renderHrField(label, keys, record)).join("")}
                  </div>
                </section>
              `).join("")}
            </form>
          </div>
        </section>
      `;
    }

    function renderHrField(label, keys, record) {
      const name = keys[0];
      const orgManaged = ["Role","Job Title","Job Code","Assigned Department","Department Code","Assigned Base","Base Code","Base Airport IATA","Manager Name","Manager SK-ID","Manager Email","Access Role","Permission Preset"].includes(label);
      if (currentHrEmployeeTab === "employment" && orgManaged) return renderOrgManagedField(label,name,record);
      const raw = firstRecordValue(record, keys, "");
      const value = raw === undefined || raw === null ? "" : displayPortalValue(raw);
      const multiline = /notes|goals|records|checks|timestamps|skills|languages|certifications|plan|feedback|permissions|groups|apps/i.test(name) || value.length > 90;
      const externalSystemOwned = currentHrEmployeeTab === "time" || currentHrEmployeeTab === "compensation" || label === "Roster Group";
      return `
        <label class="hr-field ${multiline ? "wide" : ""}">
          <span>${escapeHtml(label)}</span>
          ${multiline
            ? `<textarea class="hr-textarea" ${externalSystemOwned ? "readonly" : `name="${escapeHtml(name)}"`}>${escapeHtml(value === "—" ? "" : value)}</textarea>`
            : `<input class="hr-input" ${externalSystemOwned ? "readonly" : `name="${escapeHtml(name)}"`} value="${escapeHtml(value === "—" ? "" : value)}">`
          }
          ${externalSystemOwned ? `<small style="color:var(--sap-text-muted)">${currentHrEmployeeTab === "compensation" ? "Controlled by Payroll." : "Controlled by MyRoster / scheduling."}</small>` : ""}
        </label>
      `;
    }

    function renderHrOrganization() {
      const c=orgCatalog(),audit=c.audit||[];
      const unassigned=portalState.hr.staff.filter(item=>!orgRecordRoleId(item)).length;
      return `
        ${renderHrKpis([
          ["Departments", c.departments.length, "Canonical company units"],
          ["Bases", c.bases.length, "HQ, market and field bases"],
          ["Job roles", c.roles.length, "Job codes with reporting lines"],
          ["Unassigned", unassigned, "Employees needing canonical mapping"]
        ])}
        <div class="hr-workbench-grid one">
          <section class="hr-panel">
            <div class="hr-panel-header"><div><h2>Company Structure</h2><p>Live organization catalog used by Employee Central dropdowns and automatic access provisioning.</p></div><div class="hr-panel-actions"><button class="secondary-button" type="button" data-action="hr-org-refresh">Refresh structure</button></div></div>
            <div class="org-table-note">Job Title and Job Code are the same canonical role record. A role fixes its department, reporting role and default permission preset. Base choices are constrained by role/base rules.</div>
            <div class="hr-panel-body flush">${renderRecordTable(c.departments,[["Code",["code"]],["Department",["name"]],["Division",["division"]],["Footprint",["footprint"]]],{emptyTitle:"No departments",emptyMessage:"Apply the organization seed migration.",emptyIcon:"apps"})}</div>
          </section>
          <div class="hr-workbench-grid equal">
            <section class="hr-panel"><div class="hr-panel-header"><div><h2>Bases</h2><p>Selectable work locations</p></div></div><div class="hr-panel-body flush">${renderRecordTable(c.bases,[["Code",["code"]],["Base",["name"]],["Country",["country_code"]],["IATA",["airport_iata"]],["Type",["base_type"]]],{emptyTitle:"No bases",emptyMessage:"No canonical bases loaded.",emptyIcon:"apps"})}</div></section>
            <section class="hr-panel"><div class="hr-panel-header"><div><h2>Permission Presets</h2><p>Backend-derived access bundles</p></div></div><div class="hr-panel-body flush">${renderRecordTable(c.permissionPresets,[["Preset",["preset_id"]],["Name",["name"]],["Permissions",r=>displayPortalValue(r.permission_keys)],["Manage",r=>r.can_manage?"Yes":"No"]],{emptyTitle:"No presets",emptyMessage:"No permission presets loaded.",emptyIcon:"lock"})}</div></section>
          </div>
          <section class="hr-panel"><div class="hr-panel-header"><div><h2>Job Codes & Reporting Lines</h2><p>${c.roles.length} canonical roles</p></div></div><div class="hr-panel-body flush">${renderRecordTable(c.roles,[["Job Code",["job_code"]],["Job Title",["title"]],["Department",["department_code"]],["Level",["level"]],["Reports To",["reports_to_title"]],["Access Role",["default_access_role"]],["Preset",["permission_preset_id"]]],{emptyTitle:"No job roles",emptyMessage:"No company codebook roles loaded.",emptyIcon:"users"})}</div></section>
          <section class="hr-panel"><div class="hr-panel-header"><div><h2>Assignment Audit</h2><p>Latest organization changes</p></div></div><div class="hr-panel-body flush">${renderRecordTable(audit,[["Time",["created_at"]],["Action",["action"]],["Employee",["agent_user_id"]],["Reason",["reason"]]],{emptyTitle:"No assignment changes",emptyMessage:"Audit entries appear after canonical assignments are saved.",emptyIcon:"task"})}</div></section>
        </div>
      `;
    }

    function recruitingCandidateId(candidate = {}) {
      return String(candidate.id || candidate._id || candidate.candidateId || candidate.applicantId || candidate.email || "");
    }

    function recruitingJobId(job = {}) {
      return String(job.id || job._id || job.jobPostingId || job.positionId || job.requisitionId || "");
    }

    function selectedRecruitingCandidate() {
      const rows = portalState.hr.recruiting.candidates || [];
      return rows.find(candidate => recruitingCandidateId(candidate) === String(hrSelectedCandidateId || "")) || rows[0] || null;
    }

    function selectedRecruitingJob() {
      const rows = portalState.hr.recruiting.jobPostings || [];
      return rows.find(job => recruitingJobId(job) === String(hrSelectedJobId || "")) || rows[0] || null;
    }

    function careerRowsForCandidate(rows = [], candidate = selectedRecruitingCandidate()) {
      const id = recruitingCandidateId(candidate || {});
      const applicantId = String(candidate?.applicantId || candidate?.candidateId || candidate?.id || "");
      if (!id && !applicantId) return rows;
      return rows.filter(row => {
        const value = String(row.candidateId || row.candidate_id || row.applicantId || row.applicant_id || "");
        return !value || value === id || value === applicantId;
      });
    }

    function renderHrRecruiting() {
      if (!hasRecruitingAccess()) {
        return `
          <section class="hr-panel">
            <div class="hr-empty">
              <div>
                <strong>Recruiting access required</strong>
                <span>Your current SuccessFactors role does not include the Recruiting module.</span>
              </div>
            </div>
          </section>
        `;
      }

      const recruiting = portalState.hr.recruiting;
      const tabs = [
        ["dashboard", "Dashboard"],
        ["pipeline", "Pipeline"],
        ["candidates", "Applicants"],
        ["candidate", "Candidate Profile"],
        ["history", "5-Year History"],
        ["documents", "Documents"],
        ["jobs", "Job Postings"],
        ["posting", "Posting Studio"],
        ["interviews", "Interviews & Tests"],
        ["vetting", "SRA Vetting"],
        ["training", "DGR & Training"],
        ["onboarding", "Onboarding"],
        ["integrations", "Integrations"],
        ["mailbox", "Mailbox & Codes"],
        ["settings", "Settings"],
        ["audit", "Audit Trail"]
      ];

      let content = "";
      if (currentRecruitingView === "pipeline") content = renderRecruitingPipeline(recruiting);
      else if (currentRecruitingView === "candidates") content = renderRecruitingCandidates(recruiting);
      else if (currentRecruitingView === "candidate") content = renderRecruitingCandidateProfile(recruiting);
      else if (currentRecruitingView === "history") content = renderRecruitingHistory(recruiting);
      else if (currentRecruitingView === "documents") content = renderRecruitingDocuments(recruiting);
      else if (currentRecruitingView === "jobs") content = renderRecruitingJobs(recruiting);
      else if (currentRecruitingView === "posting") content = renderRecruitingPostingStudio(recruiting);
      else if (currentRecruitingView === "interviews") content = renderRecruitingInterviews(recruiting);
      else if (currentRecruitingView === "vetting") content = renderRecruitingVetting(recruiting);
      else if (currentRecruitingView === "training") content = renderRecruitingTraining(recruiting);
      else if (currentRecruitingView === "onboarding") content = renderRecruitingOnboarding(recruiting);
      else if (currentRecruitingView === "integrations") content = renderRecruitingIntegrations(recruiting);
      else if (currentRecruitingView === "mailbox") content = renderRecruitingMailbox(recruiting);
      else if (currentRecruitingView === "settings") content = renderRecruitingSettings(recruiting);
      else if (currentRecruitingView === "audit") content = renderRecruitingAudit(recruiting);
      else content = renderRecruitingDashboard(recruiting);

      return `
        <section class="hr-panel">
          <div class="hr-panel-header">
            <div>
              <h2>Recruiting & Onboarding</h2>
              <p>ATS, candidate history, SRA vetting, documents, interviews, training, onboarding, mailbox, integrations, and audit.</p>
            </div>
            <div class="hr-panel-actions">
              <span class="status-badge success">${icon("lock", 13)} Role controlled</span>
              <button class="secondary-button" type="button" data-action="careers-refresh">${icon("clock", 15)} Refresh</button>
              <button class="primary-button" type="button" data-action="careers-new-candidate">${icon("plus", 15)} Add candidate</button>
            </div>
          </div>
          <div class="hr-panel-body">
            <div class="hr-subtabs">
              ${tabs.map(([id, label]) => `<button class="hr-subtab ${currentRecruitingView === id ? "active" : ""}" type="button" data-action="recruiting-tab" data-view="${id}">${escapeHtml(label)}</button>`).join("")}
            </div>
            ${content}
          </div>
        </section>
      `;
    }

    function renderRecruitingDashboard(recruiting) {
      const openJobs = recruiting.jobPostings.filter(item => !/closed|filled|archived/i.test(displayPortalValue(firstRecordValue(item, ["status", "state"])))).length;
      const pendingVetting = recruiting.vettingCases.filter(item => /pending|review|open|started/i.test(displayPortalValue(firstRecordValue(item, ["status", "state"])))).length;
      const openGaps = recruiting.historyGaps.filter(item => !/resolved|closed/i.test(displayPortalValue(firstRecordValue(item, ["status", "state"])))).length;
      const queued = recruiting.outboundMessages.filter(item => /queued|pending/i.test(displayPortalValue(firstRecordValue(item, ["status", "state"])))).length;
      return `
        ${renderHrKpis([
          ["Candidates", recruiting.candidates.length, "All candidate records"],
          ["Open jobs", openJobs, "Published or active vacancies"],
          ["History gaps", openGaps, "Open 5-year history checks"],
          ["Pending vetting", pendingVetting, "Security review workload"]
        ])}
        <div class="hr-workbench-grid equal">
          ${renderRecruitingPanel("Recent Candidates", recruiting.candidates.slice(0, 10), "careers-open-candidate")}
          ${renderRecruitingPanel("Job Postings", recruiting.jobPostings.slice(0, 10), "careers-open-job")}
        </div>
        <div class="hr-workbench-grid equal" style="margin-top:14px">
          ${renderRecruitingPanel("Onboarding Tasks", recruiting.onboardingTasks.slice(0, 10))}
          ${renderRecruitingPanel("Outbound Queue", recruiting.outboundMessages.slice(0, 10))}
        </div>
        ${queued ? `<div class="hr-note warning" style="margin-top:14px">${queued} recruiting message${queued === 1 ? "" : "s"} currently queued for dispatch.</div>` : ""}
      `;
    }

    function renderRecruitingPipeline(recruiting) {
      return `
        <div class="hr-pipeline">
          ${RECRUITING_STAGES.map(([stage, label]) => {
            const candidates = recruiting.candidates.filter(candidate => {
              const value = String(firstRecordValue(candidate, ["stage", "status", "candidateStage"], "applied")).toLowerCase();
              return value === stage || slugify(value, "") === stage;
            });
            return `
              <section class="hr-pipeline-column">
                <h3><span>${escapeHtml(label)}</span><span>${candidates.length}</span></h3>
                ${candidates.map(candidate => `
                  <article class="hr-pipeline-card" tabindex="0" data-action="careers-open-candidate" data-id="${escapeHtml(recruitingCandidateId(candidate))}">
                    <strong>${escapeHtml(recordName(candidate))}</strong>
                    <span>${escapeHtml(displayPortalValue(firstRecordValue(candidate, ["jobTitle", "positionApplied", "jobName", "vacancy"])))}</span>
                    <span>${escapeHtml(displayPortalValue(firstRecordValue(candidate, ["location", "base", "station"])))}</span>
                  </article>
                `).join("") || '<div class="search-empty">No candidates</div>'}
              </section>
            `;
          }).join("")}
        </div>
      `;
    }

    function renderRecruitingCandidates(recruiting) {
      return renderRecordTable(recruiting.candidates, [
        ["Candidate", recordName],
        ["Applied for", ["positionApplied", "jobTitle", "jobName", "positionId"]],
        ["Stage", ["stage", "status"], "status"],
        ["Email", ["email"]],
        ["Phone", ["phone"]],
        ["Updated", ["updatedAt", "updated_at", "createdAt"]]
      ], {
        action: "careers-open-candidate",
        id: recruitingCandidateId,
        emptyTitle: "No candidates",
        emptyMessage: "No recruiting candidate records were returned.",
        emptyIcon: "profile"
      });
    }

    function renderRecruitingCandidateProfile(recruiting) {
      const candidate = selectedRecruitingCandidate();
      if (!candidate) {
        return `<div class="hr-empty"><div><strong>No candidate selected</strong><span>Select an applicant or create a new candidate.</span><div style="margin-top:12px"><button class="primary-button" type="button" data-action="careers-new-candidate">Add candidate</button></div></div></div>`;
      }
      const id = recruitingCandidateId(candidate);
      const stage = String(firstRecordValue(candidate, ["stage", "status"], "applied")).toLowerCase();
      const nextIndex = Math.min(Math.max(RECRUITING_STAGES.findIndex(([value]) => value === slugify(stage, stage)), 0) + 1, RECRUITING_STAGES.length - 1);
      const nextStage = RECRUITING_STAGES[nextIndex]?.[0] || "screening";
      const fields = Object.entries(candidate)
        .filter(([key, value]) => !/password|secret|token|credential/i.test(key) && (value === null || typeof value !== "object"))
        .slice(0, 24);
      return `
        <div class="hr-object-header">
          <div class="hr-object-avatar">${escapeHtml((recordName(candidate).match(/\b\w/g) || ["C"]).slice(0,2).join("").toUpperCase())}</div>
          <div class="hr-object-copy">
            <h2>${escapeHtml(recordName(candidate))}</h2>
            <p>${escapeHtml(displayPortalValue(firstRecordValue(candidate, ["positionApplied", "jobTitle", "positionId"])))} · ${escapeHtml(displayPortalValue(firstRecordValue(candidate, ["stage", "status"])))}</p>
          </div>
          <div class="hr-object-actions hr-action-row">
            <button class="secondary-button" type="button" data-action="careers-history" data-id="${escapeHtml(id)}">5-Year History</button>
            <button class="secondary-button" type="button" data-action="careers-documents" data-id="${escapeHtml(id)}">Documents</button>
            <button class="secondary-button" type="button" data-action="careers-start-sra" data-id="${escapeHtml(id)}">Start SRA</button>
            <button class="primary-button" type="button" data-action="careers-move-stage" data-id="${escapeHtml(id)}" data-stage="${escapeHtml(nextStage)}">Move to ${escapeHtml(RECRUITING_STAGES[nextIndex]?.[1] || "next stage")}</button>
          </div>
        </div>
        <section class="hr-panel" style="box-shadow:none">
          <div class="hr-panel-header"><div><h3>Candidate Record</h3><p>Backend candidate master data</p></div></div>
          <div class="hr-panel-body">
            <div class="detail-grid">
              ${fields.map(([key, value]) => `
                <div class="detail-field">
                  <span>${escapeHtml(key.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/\b\w/g, char => char.toUpperCase()))}</span>
                  <strong>${escapeHtml(displayPortalValue(value))}</strong>
                </div>
              `).join("")}
            </div>
          </div>
        </section>
      `;
    }

    function renderRecruitingHistory(recruiting) {
      const candidate = selectedRecruitingCandidate();
      const history = careerRowsForCandidate(recruiting.historySegments, candidate);
      const gaps = careerRowsForCandidate(recruiting.historyGaps, candidate);
      const candidateId = recruitingCandidateId(candidate || {});
      return `
        <div class="hr-workbench-grid equal">
          <section class="hr-panel" style="box-shadow:none">
            <div class="hr-panel-header">
              <div><h3>5-Year History</h3><p>${candidate ? escapeHtml(recordName(candidate)) : "Select a candidate"}</p></div>
              <div class="hr-panel-actions">
                <button class="secondary-button" type="button" data-action="careers-new-history" ${candidateId ? "" : "disabled"}>Add segment</button>
                <button class="primary-button" type="button" data-action="careers-detect-gaps" data-id="${escapeHtml(candidateId)}" ${candidateId ? "" : "disabled"}>Detect gaps</button>
              </div>
            </div>
            <div class="hr-panel-body flush">
              ${renderRecordTable(history, [
                ["Employer / Activity", ["employer", "organization", "title"]],
                ["Role", ["role", "position", "reason"]],
                ["Start", ["startDate", "start_date"]],
                ["End", ["endDate", "end_date"]],
                ["Verification", ["verificationStatus", "status"], "status"]
              ], {
                action: "careers-verify-history",
                id: record => String(record.historySegmentId || record.segmentId || record.id || record._id || ""),
                emptyTitle: "No history segments",
                emptyMessage: "No 5-year history segments were returned.",
                emptyIcon: "clock"
              })}
            </div>
          </section>
          <section class="hr-panel" style="box-shadow:none">
            <div class="hr-panel-header"><div><h3>Detected Gaps</h3><p>${gaps.length} record${gaps.length === 1 ? "" : "s"}</p></div></div>
            <div class="hr-panel-body">
              ${gaps.length ? gaps.map(gap => `
                <div class="hr-note ${/open|pending/i.test(String(gap.status || "open")) ? "warning" : ""}" style="margin-bottom:8px">
                  <strong>${escapeHtml(displayPortalValue(gap.startDate || gap.start_date))} → ${escapeHtml(displayPortalValue(gap.endDate || gap.end_date))}</strong><br>
                  ${escapeHtml(displayPortalValue(gap.gapDays || gap.gap_days))} days · ${escapeHtml(displayPortalValue(gap.status || "OPEN"))}
                  <div style="margin-top:8px"><button class="secondary-button" type="button" data-action="careers-resolve-gap" data-id="${escapeHtml(String(gap.gapId || gap.id || gap._id || ""))}">Resolve gap</button></div>
                </div>
              `).join("") : `<div class="hr-empty"><div><strong>No open gaps</strong><span>Run gap detection for the selected candidate.</span></div></div>`}
            </div>
          </section>
        </div>
      `;
    }

    function renderRecruitingDocuments(recruiting) {
      const candidate = selectedRecruitingCandidate();
      const candidateId = recruitingCandidateId(candidate || {});
      const documents = careerRowsForCandidate(recruiting.documents, candidate);
      const packets = careerRowsForCandidate(recruiting.documentPackets, candidate);
      return `
        <div class="hr-workbench-grid equal">
          <section class="hr-panel" style="box-shadow:none">
            <div class="hr-panel-header">
              <div><h3>Document Registry</h3><p>${candidate ? escapeHtml(recordName(candidate)) : "Select a candidate"}</p></div>
              <div class="hr-panel-actions">
                <button class="secondary-button" type="button" data-action="careers-request-document" data-id="${escapeHtml(candidateId)}" ${candidateId ? "" : "disabled"}>Request document</button>
                <button class="primary-button" type="button" data-action="careers-create-packet" data-id="${escapeHtml(candidateId)}" ${candidateId ? "" : "disabled"}>Create packet</button>
              </div>
            </div>
            <div class="hr-panel-body flush">
              ${renderRecordTable(documents, [
                ["Document", ["title", "documentType", "document_type"]],
                ["ID", ["documentId", "id"]],
                ["Status", ["verificationStatus", "status"], "status"],
                ["File", record => record.fileUrl || record.url ? "Available" : "—"]
              ], {
                action: "careers-verify-document",
                id: record => String(record.documentId || record.id || record._id || ""),
                emptyTitle: "No documents",
                emptyMessage: "No candidate documents were returned.",
                emptyIcon: "document"
              })}
            </div>
          </section>
          <section class="hr-panel" style="box-shadow:none">
            <div class="hr-panel-header"><div><h3>Document Packets</h3><p>${packets.length} packet${packets.length === 1 ? "" : "s"}</p></div></div>
            <div class="hr-panel-body">
              ${packets.length ? packets.map(packet => {
                const packetId = String(packet.packetId || packet.id || packet._id || "");
                return `
                  <div class="hr-note" style="margin-bottom:8px">
                    <strong>${escapeHtml(recordName(packet) || "Document packet")}</strong><br>
                    ${escapeHtml(displayPortalValue(packet.email))} · ${escapeHtml(displayPortalValue(packet.status))}
                    <div class="hr-action-row" style="justify-content:flex-start;margin-top:8px">
                      <button class="secondary-button" type="button" data-action="careers-resend-packet" data-id="${escapeHtml(packetId)}">Resend</button>
                      <button class="secondary-button" type="button" data-action="careers-open-execution" data-id="${escapeHtml(packetId)}">Secure link</button>
                    </div>
                  </div>
                `;
              }).join("") : `<div class="hr-empty"><div><strong>No packets</strong><span>No document packets were returned.</span></div></div>`}
            </div>
          </section>
        </div>
      `;
    }

    function renderRecruitingJobs(recruiting) {
      return `
        <div class="hr-action-row" style="margin-bottom:12px">
          <button class="primary-button" type="button" data-action="careers-new-job">${icon("plus", 15)} New job posting</button>
        </div>
        ${renderRecordTable(recruiting.jobPostings, [
          ["Job", ["title", "jobTitle", "name"]],
          ["Reference", ["positionId", "jobPostingId", "requisitionId", "id"]],
          ["Location", ["location", "station", "base"]],
          ["Department", ["department", "businessUnit"]],
          ["Status", ["status", "state"], "status"],
          ["Closing date", ["closingDate", "closeDate", "expiresAt"]]
        ], {
          action: "careers-open-job",
          id: recruitingJobId,
          emptyTitle: "No job postings",
          emptyMessage: "No vacancy records were returned.",
          emptyIcon: "task"
        })}
      `;
    }

    function renderRecruitingPostingStudio(recruiting) {
      const job = selectedRecruitingJob() || {};
      return `
        <section class="hr-panel" style="box-shadow:none">
          <div class="hr-panel-header">
            <div><h3>Posting Studio</h3><p>Create, edit, publish, and duplicate vacancy records</p></div>
          </div>
          <div class="hr-panel-body">
            <form id="careerJobForm">
              <input type="hidden" name="id" value="${escapeHtml(recruitingJobId(job))}">
              <div class="hr-form-grid three">
                <label class="hr-field"><span>Job title</span><input class="hr-input" name="title" required value="${escapeHtml(String(job.title || job.jobTitle || ""))}"></label>
                <label class="hr-field"><span>Department</span><input class="hr-input" name="department" value="${escapeHtml(String(job.department || ""))}"></label>
                <label class="hr-field"><span>Location / Base</span><input class="hr-input" name="location" value="${escapeHtml(String(job.location || job.base || ""))}"></label>
                <label class="hr-field"><span>Employment type</span><input class="hr-input" name="employmentType" value="${escapeHtml(String(job.employmentType || ""))}"></label>
                <label class="hr-field"><span>Salary range</span><input class="hr-input" name="salaryRange" value="${escapeHtml(String(job.salaryRange || ""))}"></label>
                <label class="hr-field"><span>Status</span><input class="hr-input" name="status" value="${escapeHtml(String(job.status || (job.active ? "PUBLISHED" : "DRAFT")))}"></label>
                <label class="hr-field wide"><span>Description</span><textarea class="hr-textarea" name="description">${escapeHtml(String(job.description || ""))}</textarea></label>
              </div>
            </form>
            <div class="hr-action-row" style="justify-content:flex-start;margin-top:12px">
              <button class="primary-button" type="submit" form="careerJobForm">Save posting</button>
              <button class="secondary-button" type="button" data-action="careers-publish-job" ${recruitingJobId(job) ? "" : "disabled"}>Publish</button>
              <button class="secondary-button" type="button" data-action="careers-duplicate-job" ${recruitingJobId(job) ? "" : "disabled"}>Duplicate</button>
            </div>
          </div>
        </section>
      `;
    }

    function renderRecruitingInterviews(recruiting) {
      return `
        <div class="hr-action-row" style="margin-bottom:12px">
          <button class="primary-button" type="button" data-action="careers-new-interview" ${selectedRecruitingCandidate() ? "" : "disabled"}>Schedule interview / test</button>
        </div>
        ${renderRecruitingRecords("Interviews & Tests", recruiting.interviews, "task")}
      `;
    }

    function renderRecruitingVetting(recruiting) {
      const candidate = selectedRecruitingCandidate();
      const candidateId = recruitingCandidateId(candidate || {});
      return `
        <div class="hr-action-row" style="margin-bottom:12px">
          <button class="primary-button" type="button" data-action="careers-start-sra" data-id="${escapeHtml(candidateId)}" ${candidateId ? "" : "disabled"}>Start SRA vetting for selected candidate</button>
        </div>
        ${renderRecruitingRecords("SRA Vetting Cases", recruiting.vettingCases, "lock")}
      `;
    }

    function renderRecruitingTraining(recruiting) {
      return `
        <div class="hr-action-row" style="margin-bottom:12px">
          <button class="primary-button" type="button" data-action="careers-new-training" ${selectedRecruitingCandidate() ? "" : "disabled"}>Add training record</button>
        </div>
        ${renderRecruitingRecords("DGR & Training", recruiting.trainingRecords, "learning")}
      `;
    }

    function renderRecruitingOnboarding(recruiting) {
      return `
        <div class="hr-action-row" style="margin-bottom:12px">
          <button class="primary-button" type="button" data-action="careers-new-onboarding" ${selectedRecruitingCandidate() ? "" : "disabled"}>Add onboarding task</button>
        </div>
        ${renderRecruitingRecords("Onboarding Tasks", recruiting.onboardingTasks, "task")}
      `;
    }

    function renderRecruitingIntegrations(recruiting) {
      return `
        <div class="hr-action-row" style="margin-bottom:12px">
          <button class="primary-button" type="button" data-action="careers-test-integrations">Test integrations</button>
          <button class="secondary-button" type="button" data-action="careers-schedule-maintenance">Schedule maintenance</button>
        </div>
        ${renderRecruitingRecords("Integration Snapshots", recruiting.integrationSnapshots, "apps")}
      `;
    }

    function renderRecruitingMailbox(recruiting) {
      return `
        <div class="hr-action-row" style="margin-bottom:12px">
          <button class="primary-button" type="button" data-action="careers-dispatch-mail">Dispatch queued emails</button>
          <button class="secondary-button" type="button" data-action="careers-sync-mail">Sync mailbox replies</button>
        </div>
        <div class="hr-workbench-grid equal">
          ${renderRecruitingPanel("Outbound Queue", recruiting.outboundMessages)}
          ${renderRecruitingPanel("Mailbox Threads", recruiting.mailboxThreads.length ? recruiting.mailboxThreads : recruiting.mailboxMessages)}
        </div>
      `;
    }

    function renderRecruitingSettings(recruiting) {
      const settings = recruiting.settings || {};
      return `
        <div class="hr-workbench-grid equal">
          <section class="hr-panel" style="box-shadow:none">
            <div class="hr-panel-header"><div><h3>Recruiting Settings</h3><p>Backend-controlled careers configuration</p></div></div>
            <div class="hr-panel-body">
              <form id="careerSettingsForm">
                <div class="hr-form-grid">
                  <label class="hr-field"><span>Default hub</span><input class="hr-input" name="defaultHub" value="${escapeHtml(String(settings.defaultHub || settings.default_hub || ""))}"></label>
                  <label class="hr-field"><span>Career site path</span><input class="hr-input" name="careerSitePath" value="${escapeHtml(String(settings.careerSitePath || settings.career_site_path || "/careers"))}"></label>
                  <label class="hr-field"><span>Document path</span><input class="hr-input" name="documentPath" value="${escapeHtml(String(settings.documentPath || settings.document_path || "/careers/documents"))}"></label>
                  <label class="hr-field"><span>Mailbox mode</span><input class="hr-input" name="mailboxMode" value="${escapeHtml(String(settings.mailboxMode || settings.mailbox_mode || "google"))}"></label>
                  <label class="hr-field wide"><span>Admin notes</span><textarea class="hr-textarea" name="notes">${escapeHtml(String(settings.notes || ""))}</textarea></label>
                </div>
              </form>
              <div class="hr-action-row" style="justify-content:flex-start;margin-top:12px">
                <button class="primary-button" type="submit" form="careerSettingsForm">Save settings</button>
                <button class="secondary-button" type="button" data-action="careers-test-integrations">Test integrations</button>
              </div>
            </div>
          </section>
          ${renderRecruitingPanel("Integration Snapshots", recruiting.integrationSnapshots)}
        </div>
      `;
    }

    function renderRecruitingAudit(recruiting) {
      return `
        <div class="hr-action-row" style="margin-bottom:12px">
          <button class="primary-button" type="button" data-action="careers-export-audit">Export audit package</button>
        </div>
        ${renderRecruitingRecords("Recruiting Audit Trail", recruiting.auditEvents, "lock")}
      `;
    }

    function renderRecruitingRecords(title, records, iconName) {
      return `
        <section class="hr-panel" style="box-shadow:none">
          <div class="hr-panel-header"><div><h3>${escapeHtml(title)}</h3><p>${records.length} records</p></div></div>
          <div class="hr-panel-body flush">${renderRecordTable(records, genericColumns(records), { emptyTitle: `No ${title.toLowerCase()}`, emptyMessage: "No records were returned.", emptyIcon: iconName })}</div>
        </section>
      `;
    }

    function renderRecruitingPanel(title, records, action = "") {
      const columns = records.length ? genericColumns(records) : [];
      return `
        <section class="hr-panel" style="box-shadow:none">
          <div class="hr-panel-header"><div><h3>${escapeHtml(title)}</h3><p>${records.length} records</p></div></div>
          <div class="hr-panel-body flush">
            ${renderRecordTable(records, columns, {
              action,
              id: record => String(record.id || record._id || record.candidateId || record.applicantId || record.email || recordName(record)),
              emptyTitle: `No ${title.toLowerCase()}`,
              emptyMessage: "No records were returned.",
              emptyIcon: "document"
            })}
          </div>
        </section>
      `;
    }

    function openCandidateDialog(id) {
      const recruiting = portalState.hr.recruiting;
      const candidate = recruiting.candidates.find(item => recruitingCandidateId(item) === String(id));
      if (!candidate) return;
      hrSelectedCandidateId = String(id);
      const fields = Object.entries(candidate)
        .filter(([key, value]) => !/password|secret|token|credential/i.test(key) && (value === null || typeof value !== "object"))
        .slice(0, 18);
      const currentStage = slugify(String(firstRecordValue(candidate, ["stage", "status"], "applied")), "applied");
      const index = Math.max(0, RECRUITING_STAGES.findIndex(([stage]) => stage === currentStage));
      const next = RECRUITING_STAGES[Math.min(index + 1, RECRUITING_STAGES.length - 1)]?.[0] || "screening";
      openDialog({
        id: "candidate-detail",
        title: recordName(candidate),
        subtitle: displayPortalValue(firstRecordValue(candidate, ["stage", "status", "positionApplied", "jobTitle"])),
        body: `
          <div class="detail-grid">
            ${fields.map(([key, value]) => `
              <div class="detail-field">
                <span>${escapeHtml(key.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/\b\w/g, char => char.toUpperCase()))}</span>
                <strong>${escapeHtml(displayPortalValue(value))}</strong>
              </div>
            `).join("")}
          </div>
        `,
        footer: `
          <button class="ghost-button" type="button" data-action="close-dialog">Close</button>
          <button class="secondary-button" type="button" data-action="careers-open-profile" data-id="${escapeHtml(String(id))}">Full profile</button>
          <button class="primary-button" type="button" data-action="careers-move-stage" data-id="${escapeHtml(String(id))}" data-stage="${escapeHtml(next)}">${icon("arrowRight", 15)} Advance stage</button>
        `
      });
    }

    function openNewCandidateDialog() {
      openDialog({
        id: "candidate-new",
        title: "Add candidate",
        subtitle: "Create a recruiting record in SuccessFactors.",
        body: `
          <form id="candidateForm">
            <div class="hr-form-grid">
              ${[
                ["firstName", "First name"],
                ["lastName", "Last name"],
                ["email", "Email"],
                ["phone", "Phone"],
                ["positionApplied", "Position applied"],
                ["location", "Location / base"]
              ].map(([name, label]) => `<label class="hr-field"><span>${label}</span><input class="hr-input" name="${name}" ${["firstName", "lastName", "email"].includes(name) ? "required" : ""}></label>`).join("")}
              <label class="hr-field">
                <span>Stage</span>
                <select class="hr-select" name="stage">${RECRUITING_STAGES.map(([id, label]) => `<option value="${id}">${label}</option>`).join("")}</select>
              </label>
            </div>
          </form>
        `,
        footer: `
          <button class="ghost-button" type="button" data-action="close-dialog">Cancel</button>
          <button class="primary-button" type="submit" form="candidateForm">${icon("check", 15)} Save candidate</button>
        `
      });
    }

    function openNewHistoryDialog() {
      const candidate = selectedRecruitingCandidate();
      if (!candidate) return;
      openDialog({
        id: "history-new",
        title: "Add 5-year history segment",
        subtitle: recordName(candidate),
        body: `
          <form id="careerHistoryForm">
            <input type="hidden" name="candidateId" value="${escapeHtml(recruitingCandidateId(candidate))}">
            <div class="hr-form-grid">
              <label class="hr-field"><span>Employer / Activity</span><input class="hr-input" name="employer" required></label>
              <label class="hr-field"><span>Role / Reason</span><input class="hr-input" name="role"></label>
              <label class="hr-field"><span>Start date</span><input class="hr-input" type="date" name="startDate" required></label>
              <label class="hr-field"><span>End date</span><input class="hr-input" type="date" name="endDate"></label>
              <label class="hr-field wide"><span>Description</span><textarea class="hr-textarea" name="description"></textarea></label>
            </div>
          </form>
        `,
        footer: `<button class="ghost-button" type="button" data-action="close-dialog">Cancel</button><button class="primary-button" type="submit" form="careerHistoryForm">Save segment</button>`
      });
    }

    function openRecruitingRecordDialog(kind) {
      const candidate = selectedRecruitingCandidate();
      if (!candidate) return;
      const candidateId = recruitingCandidateId(candidate);
      const config = {
        interview: {
          id: "careerInterviewForm", title: "Schedule interview / test",
          fields: [
            ["interviewType", "Type", "text"], ["scheduledAt", "Scheduled at", "datetime-local"],
            ["status", "Status", "text"], ["notes", "Notes", "textarea"]
          ]
        },
        training: {
          id: "careerTrainingForm", title: "Add DGR / training record",
          fields: [
            ["course", "Course / Qualification", "text"], ["status", "Status", "text"],
            ["completedAt", "Completed at", "date"], ["validUntil", "Valid until", "date"]
          ]
        },
        onboarding: {
          id: "careerOnboardingForm", title: "Add onboarding task",
          fields: [
            ["taskName", "Task", "text"], ["dueAt", "Due at", "datetime-local"],
            ["status", "Status", "text"], ["notes", "Notes", "textarea"]
          ]
        }
      }[kind];
      if (!config) return;
      openDialog({
        id: `${kind}-new`,
        title: config.title,
        subtitle: recordName(candidate),
        body: `
          <form id="${config.id}">
            <input type="hidden" name="candidateId" value="${escapeHtml(candidateId)}">
            <div class="hr-form-grid">
              ${config.fields.map(([name, label, type]) => type === "textarea"
                ? `<label class="hr-field wide"><span>${label}</span><textarea class="hr-textarea" name="${name}"></textarea></label>`
                : `<label class="hr-field"><span>${label}</span><input class="hr-input" type="${type}" name="${name}"></label>`
              ).join("")}
            </div>
          </form>
        `,
        footer: `<button class="ghost-button" type="button" data-action="close-dialog">Cancel</button><button class="primary-button" type="submit" form="${config.id}">Save</button>`
      });
    }

    function renderHrPerformance() {
      const reports = portalState.hr.reports;
      const tabs = [
        ["reports", "Overview"],
        ["goals", "Goals"],
        ["qualifications", "Qualifications"],
        ["training", "Training"],
        ["compliance", "Compliance"]
      ];
      const collections = {
        goals: reports.goals,
        qualifications: reports.qualifications,
        training: reports.training,
        compliance: reports.compliance
      };
      let content;
      if (currentPerformanceView === "reports") {
        content = `
          ${renderHrKpis([
            ["Goals", reports.goals.length, "Performance goals"],
            ["Qualifications", reports.qualifications.length, "Recorded qualifications"],
            ["Expiring", reports.expiries.length, "Credential alerts"],
            ["Training", reports.training.length, "Learning records"]
          ])}
          <div class="hr-workbench-grid equal">
            ${renderRecruitingPanel("Expiring Credentials", reports.expiries)}
            ${renderRecruitingPanel("Compliance Reports", reports.compliance)}
          </div>
        `;
      } else {
        const records = collections[currentPerformanceView] || [];
        content = renderRecordTable(records, genericColumns(records), {
          emptyTitle: `No ${currentPerformanceView} records`,
          emptyMessage: "No records were returned for this report.",
          emptyIcon: "learning"
        });
      }
      return `
        <section class="hr-panel">
          <div class="hr-panel-header">
            <div><h2>Performance & Learning</h2><p>Goals, qualifications, training and compliance</p></div>
            <button class="secondary-button" type="button" data-action="hr-refresh">${icon("clock", 15)} Refresh reports</button>
          </div>
          <div class="hr-panel-body">
            <div class="hr-subtabs">
              ${tabs.map(([id, label]) => `<button class="hr-subtab ${currentPerformanceView === id ? "active" : ""}" type="button" data-action="performance-tab" data-view="${id}">${label}</button>`).join("")}
            </div>
            ${content}
          </div>
        </section>
      `;
    }

    function badgeRecord() {
      const selected = employeeById(badgeSelectedId) || selectedHrEmployee() || portalState.hr.staff[0] || getProfile();
      return { ...selected, ...badgeOverride };
    }

    function renderHrBadge() {
      const record = badgeRecord();
      const employees = portalState.hr.staff;
      return `
        <div id="view-badge">
          <div class="staff-id-layout staff-id-workspace">
            <section class="hr-panel staff-id-controls">
              <div class="hr-panel-header">
                <div><h2>Staff Badge Control</h2><p>Use an employee record or enter a controlled override</p></div>
              </div>
              <div class="hr-panel-body">
                <label class="hr-field">
                  <span>Employee source</span>
                  <select class="hr-select" id="badgeEmployeeSelect">
                    <option value="">Choose employee</option>
                    ${employees.map(employee => {
                      const id = hrRecordId(employee);
                      return `<option value="${escapeHtml(id)}" ${id && id === badgeSelectedId ? "selected" : ""}>${escapeHtml(recordName(employee))} · ${escapeHtml(displayPortalValue(firstRecordValue(employee, ["skId", "employeeId"])))}</option>`;
                    }).join("")}
                  </select>
                </label>
                <div class="staff-id-button-row record-top-actions">
                  <button class="secondary-button" type="button" data-action="badge-flip">${icon("profile", 15)} Flip card</button>
                  <button class="secondary-button" type="button" data-action="badge-manual-toggle">${icon("settings", 15)} Manual override</button>
                  <button class="primary-button" type="button" data-action="badge-print">${icon("download", 15)} Print badge</button>
                </div>
                <form id="badgeManualForm" class="staff-id-manual-form ${badgeManualOpen ? "visible" : ""}">
                  <div class="hr-note warning" style="margin-bottom:10px">Manual values are temporary until the parent service confirms a badge action.</div>
                  <div class="staff-id-form-grid">
                    ${[
                      ["fullName", "Printed name"],
                      ["jobTitle", "Role / title"],
                      ["assignedDepartment", "Department"],
                      ["assignedBase", "Base"],
                      ["skId", "SK-ID"],
                      ["employeeId", "Employee ID"],
                      ["badgeExpiryDate", "Badge expiry"],
                      ["corporateEmailAddress", "Corporate email"],
                      ["emergencyContactPhone", "Emergency phone"],
                      ["photoUrl", "Photo URL"]
                    ].map(([name, label]) => `
                      <label class="hr-field ${name === "photoUrl" ? "staff-id-form-row-full" : ""}">
                        <span>${label}</span>
                        <input class="hr-input" name="${name}" value="${escapeHtml(String(badgeOverride[name] || ""))}">
                      </label>
                    `).join("")}
                  </div>
                  <div class="staff-id-button-row">
                    <button class="primary-button" type="submit">${icon("check", 15)} Apply preview</button>
                    <button class="ghost-button" type="button" data-action="badge-clear-override">Clear override</button>
                  </div>
                </form>
              </div>
            </section>

            <section class="hr-panel staff-id-preview-panel">
              <div class="hr-panel-header" style="width:100%">
                <div><h2 class="staff-id-preview-title">Badge Preview</h2><p class="staff-id-preview-note">Front and back remain available through the flip control.</p></div>
                ${statusBadge(displayPortalValue(firstRecordValue(record, ["badgeStatus", "airportBadgeStatus"], "Preview")))}
              </div>
              <div class="hr-panel-body">
                <div class="staff-id-preview-box">${renderBadgeCard(record)}</div>
              </div>
            </section>
          </div>
        </div>
      `;
    }

    function renderBadgeCard(record = {}) {
      const photo = recordPhoto(record);
      const name = recordName(record);
      const title = displayPortalValue(firstRecordValue(record, ["jobTitle", "positionTitle", "position", "role"], "STAFF"));
      const department = displayPortalValue(firstRecordValue(record, ["assignedDepartment", "department"], "SKANDI TRAVELS"));
      const base = displayPortalValue(firstRecordValue(record, ["assignedBase", "station", "base", "baseAirportIata"]));
      const skId = displayPortalValue(firstRecordValue(record, ["skId", "skID", "employeeId"], "PENDING"));
      const employeeId = displayPortalValue(firstRecordValue(record, ["employeeId", "employeeNumber"], skId));
      const issued = displayPortalValue(firstRecordValue(record, ["badgeIssueDate", "airportBadgeIssueDate", "hireDate"]));
      const expires = displayPortalValue(firstRecordValue(record, ["badgeExpiryDate", "airportBadgeExpiryDate", "airportSecurityBadgeExpiry"]));
      const email = displayPortalValue(firstRecordValue(record, ["corporateEmailAddress", "workEmail", "companyEmail"]));
      const phone = displayPortalValue(firstRecordValue(record, ["emergencyContactPhone", "workPhone", "phone"]));
      const manager = displayPortalValue(firstRecordValue(record, ["managerName", "reportsToName"]));
      const barcode = `${skId}|${employeeId}|${base}`.replace(/[^\w|.-]/g, "").slice(0, 48);
      return `
        <article class="staff-id-card ${badgeShowBack ? "show-back" : ""}" aria-label="SKANDI staff badge for ${escapeHtml(name)}">
          <div class="staff-id-inner">
            <section class="staff-id-face staff-id-front">
              <div class="staff-id-card-head">
                <div class="staff-id-logo-wrap">
                  <span class="staff-id-logo-box">
                    <img class="staff-id-logo-img" src="https://static.wixstatic.com/media/394052_69299cae98564a63b4a9bb7a8d037a33~mv2.png" alt="SKANDI">
                  </span>
                </div>
                <div class="staff-id-card-head-text">
                  <div class="staff-id-topline">RIAINTRA</div>
                  <div class="staff-id-head-role">${escapeHtml(title)}</div>
                </div>
              </div>
              <div class="staff-id-body">
                <div class="staff-id-photo-row">
                  <div class="staff-id-photo-frame">
                    ${photo ? `<img class="staff-id-photo" src="${escapeHtml(photo)}" alt="${escapeHtml(name)}" style="display:block">` : `
                      <div class="staff-id-photo-placeholder">
                        <span class="staff-id-photo-circle">${escapeHtml(recordInitials(record))}</span>
                        <span>STAFF PHOTO</span>
                      </div>
                    `}
                  </div>
                </div>
                <div class="staff-id-name-block">
                  <div class="staff-id-name">${escapeHtml(name)}</div>
                  <div class="staff-id-dept">${escapeHtml(department)}</div>
                </div>
                <div class="staff-id-meta-grid">
                  <div><div class="staff-id-meta-label">SK-ID</div><div class="staff-id-meta-value">${escapeHtml(skId)}</div></div>
                  <div><div class="staff-id-meta-label">Base</div><div class="staff-id-meta-value">${escapeHtml(base)}</div></div>
                  <div><div class="staff-id-meta-label">Issued</div><div class="staff-id-meta-value">${escapeHtml(issued)}</div></div>
                  <div><div class="staff-id-meta-label">Expires</div><div class="staff-id-meta-value">${escapeHtml(expires)}</div></div>
                  <div class="staff-id-meta-wide"><div class="staff-id-meta-label">Employee ID</div><div class="staff-id-meta-value">${escapeHtml(employeeId)}</div></div>
                </div>
                <div class="staff-id-card-footer">
                  <div class="staff-id-barcode">
                    <div class="staff-id-barcode-inner"></div>
                    <div class="staff-id-barcode-text">${escapeHtml(barcode)}</div>
                  </div>
                  <div class="staff-id-footer-row">
                    <span class="staff-id-footer-left">Property of SKANDI Travels</span>
                    <span class="staff-id-footer-right">ID <span>${escapeHtml(skId)}</span></span>
                  </div>
                </div>
              </div>
            </section>

            <section class="staff-id-face staff-id-back">
              <div class="staff-id-back-inner">
                <div class="staff-id-mag-strip"></div>
                <div class="staff-id-back-section">
                  <div class="staff-id-back-title">Identification</div>
                  <div class="staff-id-back-body">This badge is issued to <strong>${escapeHtml(name)}</strong>. It remains the property of SKANDI Travels.</div>
                </div>
                <div class="staff-id-back-grid">
                  <div><div class="staff-id-back-label">SK-ID</div><div class="staff-id-back-value">${escapeHtml(skId)}</div></div>
                  <div><div class="staff-id-back-label">Base</div><div class="staff-id-back-value">${escapeHtml(base)}</div></div>
                  <div><div class="staff-id-back-label">Manager</div><div class="staff-id-back-value">${escapeHtml(manager)}</div></div>
                  <div><div class="staff-id-back-label">Expires</div><div class="staff-id-back-value">${escapeHtml(expires)}</div></div>
                  <div style="grid-column:1/-1"><div class="staff-id-back-label">Corporate email</div><div class="staff-id-back-value">${escapeHtml(email)}</div></div>
                  <div style="grid-column:1/-1"><div class="staff-id-back-label">Emergency contact</div><div class="staff-id-back-value">${escapeHtml(phone)}</div></div>
                </div>
                <div class="staff-id-chip-area">
                  <span class="staff-id-chip-left">Report a lost badge immediately to RIAINTRA ServiceDesk.</span>
                  <span class="staff-id-chip-right">Access is role controlled.</span>
                </div>
                <div class="staff-id-mini-barcode">
                  <div class="staff-id-mini-barcode-inner"></div>
                  <div class="staff-id-mini-code">${escapeHtml(barcode)}</div>
                </div>
                <div class="staff-id-back-footer">
                  <span>SKANDI TRAVELS</span>
                  <span>${escapeHtml(employeeId)}</span>
                </div>
              </div>
            </section>
          </div>
        </article>
      `;
    }


    function renderHrAccess() {
      const employees = portalState.hr.staff;
      const record = selectedHrEmployee() || employees[0] || null;
      if (record && !hrSelectedEmployeeId) hrSelectedEmployeeId = hrRecordId(record);
      const tokens = record ? profileAccessTokens(record) : [];
      const portalResults = portalState.hr.access.portalResults;
      return `
        <div class="hr-workbench-grid">
          <section class="hr-panel">
            <div class="hr-panel-header">
              <div><h2>Access & Portal Permissions</h2><p>Effective permissions from the employee's canonical access role and permission preset</p></div>
            </div>
            <div class="hr-panel-body">
              <label class="hr-field" style="margin-bottom:14px">
                <span>Employee</span>
                <select class="hr-select" id="accessEmployeeSelect">
                  <option value="">Choose employee</option>
                  ${employees.map(employee => {
                    const id = hrRecordId(employee);
                    return `<option value="${escapeHtml(id)}" ${id === hrSelectedEmployeeId ? "selected" : ""}>${escapeHtml(recordName(employee))} · ${escapeHtml(displayPortalValue(firstRecordValue(employee, ["skId", "employeeId"])))}</option>`;
                  }).join("")}
                </select>
              </label>
              ${record ? `
                <div class="hr-note" style="margin-bottom:12px">Access is assigned by the canonical Organization role/access-role/permission-preset mapping. Change the employee's assignment in <b>Employee Central → Employment Information</b>; this screen does not create ad-hoc permission overrides.</div>
                <div class="hr-permission-grid">
                  ${HR_PERMISSIONS.map(([key, label, description]) => {
                    const enabled = tokens.includes(key.toLowerCase()) || record.permissions?.[key] === true || record.access?.[key] === true;
                    return `
                      <div class="hr-permission">
                        <input type="checkbox" ${enabled ? "checked" : ""} disabled aria-label="${escapeHtml(label)}">
                        <span><strong>${escapeHtml(label)}</strong><small>${escapeHtml(description)}</small></span>
                      </div>
                    `;
                  }).join("")}
                </div>
              ` : renderEmptyState("No employee selected", "Choose an employee to review access.", "lock")}
            </div>
          </section>
          <aside class="hr-panel">
            <div class="hr-panel-header"><div><h2>Portal Diagnostics</h2><p>Current backend access checks</p></div></div>
            <div class="hr-panel-body flush">
              ${portalResults.length
                ? renderRecordTable(portalResults, genericColumns(portalResults), { emptyIcon: "lock" })
                : renderEmptyState("No diagnostics returned", "Portal access results will appear after an HR refresh.", "lock")}
            </div>
          </aside>
        </div>
      `;
    }

    /* =========================================================
       Dialogs, search, portal rendering and interaction
       ========================================================= */
    function openDialog({ id = "dialog", title = "", subtitle = "", body = "", footer = "" } = {}) {
      activeDialogId = id;
      document.body.classList.add("modal-open");
      const root = $("modalRoot");
      if (!root) return;
      root.innerHTML = `
        <div class="modal-backdrop" data-action="close-dialog" role="presentation">
          <section class="dialog" role="dialog" aria-modal="true" aria-labelledby="${escapeHtml(id)}-title" data-dialog-panel>
            <header class="dialog-header">
              <div>
                <h2 id="${escapeHtml(id)}-title">${escapeHtml(title)}</h2>
                ${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ""}
              </div>
              <button class="icon-button" type="button" data-action="close-dialog" aria-label="Close dialog">${icon("close", 19)}</button>
            </header>
            <div class="dialog-body">${body}</div>
            ${footer ? `<footer class="dialog-footer">${footer}</footer>` : ""}
          </section>
        </div>
      `;
      requestAnimationFrame(() => {
        const focusTarget = root.querySelector("input, select, textarea, button");
        if (focusTarget) focusTarget.focus({ preventScroll: true });
      });
    }

    function closeDialog() {
      activeDialogId = null;
      document.body.classList.remove("modal-open");
      const root = $("modalRoot");
      if (root) root.innerHTML = "";
    }

    function showToast(title, message, type = "info") {
      const region = $("toastRegion");
      if (!region) return;
      const toast = document.createElement("div");
      toast.className = `toast ${type === "warning" ? "warning" : "info"}`;
      toast.innerHTML = `
        <span class="toast-icon">${icon(type === "warning" ? "warning" : "check", 18)}</span>
        <span><strong>${escapeHtml(title)}</strong><span>${escapeHtml(message)}</span></span>
        <button class="icon-button" type="button" data-action="dismiss-toast" aria-label="Dismiss">${icon("close", 15)}</button>
      `;
      region.appendChild(toast);
      window.setTimeout(() => toast.remove(), 5000);
    }

    function renderDevTools() {
      if (!EMBED_CONFIG.devTools) return "";
      return `
        <aside class="dev-tools ${devToolsCollapsed ? "collapsed" : ""}">
          <div class="dev-tools-head">
            <strong>Embed diagnostics</strong>
            <button class="dev-toggle" type="button" data-action="toggle-dev-tools">${devToolsCollapsed ? "+" : "−"}</button>
          </div>
          <div class="dev-tools-body">
            <span class="dev-label">Status: ${escapeHtml(portalState.status)}</span>
            <span class="dev-label">Role: ${escapeHtml(currentUserRole || "none")}</span>
            <span class="dev-label">Parent origin: ${escapeHtml(parentOrigin)}</span>
            <button class="ghost-button" type="button" data-action="request-bootstrap">Request bootstrap</button>
          </div>
        </aside>
      `;
    }

    function renderPortal() {
      const portal = $("portal");
      if (!portal) return;
      let page;
      if (!portalState.connected) {
        page = renderConnectionState();
      } else {
        const renderers = {
          home: renderHome,
          tasks: renderTasksPage,
          apps: renderAppsPage,
          news: renderNewsPage,
          profile: renderProfilePage,
          directory: renderDirectoryPage,
          app: renderAppWorkspacePage,
          hr: renderHrAdminPage
        };
        page = (renderers[currentView] || renderHome)();
      }
      portal.innerHTML = renderShell() + page + renderDevTools();
      applyHrReadOnlyControls();

    }

    function globalSearchItems(query) {
      const normalized = String(query || "").trim().toLowerCase();
      if (!normalized) return [];
      const results = [];
      roleItems("applicationTiles").forEach(item => {
        if (`${item.title} ${item.subtitle} ${item.group}`.toLowerCase().includes(normalized)) {
          results.push({ type: "app", id: item.id, title: item.title, subtitle: item.subtitle, icon: item.icon });
        }
      });
      roleItems("toDoTasks").forEach(item => {
        if (`${item.title} ${item.description} ${item.category}`.toLowerCase().includes(normalized)) {
          results.push({ type: "task", id: item.id, title: item.title, subtitle: item.description, icon: item.icon });
        }
      });
      roleItems("newsItems").forEach(item => {
        if (`${item.title} ${item.summary} ${item.category}`.toLowerCase().includes(normalized)) {
          results.push({ type: "news", id: item.id, title: item.title, subtitle: item.summary, icon: item.icon });
        }
      });
      portalState.colleagues.forEach(item => {
        if (recordSearchText(item).includes(normalized)) {
          results.push({ type: "colleague", id: item.skId || item.corporateEmailAddress || item.displayName, title: recordName(item), subtitle: item.jobTitle || item.department, icon: "profile" });
        }
      });
      return results.slice(0, 12);
    }

    function updateGlobalSearch(query) {
      const input = $("globalSearch");
      const host = $("searchResults");
      if (!input || !host) return;
      const results = globalSearchItems(query);
      input.setAttribute("aria-expanded", String(Boolean(query)));
      if (!query) {
        host.innerHTML = "";
        host.className = "";
        return;
      }
      host.className = "search-results";
      host.innerHTML = `
        <div class="search-results-head"><strong>Search results</strong><span>${results.length}</span></div>
        ${results.length ? results.map(result => `
          <button class="search-result" type="button" data-action="search-open" data-type="${escapeHtml(result.type)}" data-id="${escapeHtml(String(result.id))}">
            <span class="search-result-icon">${icon(result.icon || "search", 17)}</span>
            <span><strong>${escapeHtml(result.title)}</strong><span>${escapeHtml(displayPortalValue(result.subtitle))}</span></span>
            <span class="search-result-type">${escapeHtml(result.type)}</span>
          </button>
        `).join("") : '<div class="search-empty">No matching people, apps, tasks, or news.</div>'}
      `;
    }

    function openNewsDialog(id) {
      const item = roleItems("newsItems").find(news => news.id === String(id));
      if (!item) return;
      openDialog({
        id: "news-detail",
        title: item.title,
        subtitle: [item.category, item.date].filter(Boolean).join(" · "),
        body: `<div class="dialog-summary">${escapeHtml(item.details || item.summary).replace(/\n/g, "<br>")}</div>`,
        footer: '<button class="primary-button" type="button" data-action="close-dialog">Close</button>'
      });
    }

    function openTaskDialog(id) {
      const task = roleItems("toDoTasks").find(item => item.id === String(id));
      if (!task) return;
      const done = completedTasks.has(task.id);
      openDialog({
        id: "task-detail",
        title: task.title,
        subtitle: [task.category, task.due].filter(Boolean).join(" · "),
        body: `
          <div class="dialog-summary">${escapeHtml(task.description)}</div>
          <div class="detail-grid">
            <div class="detail-field"><span>Priority</span><strong>${escapeHtml(task.priority)}</strong></div>
            <div class="detail-field"><span>Owner</span><strong>${escapeHtml(displayPortalValue(task.owner))}</strong></div>
            <div class="detail-field"><span>Reference</span><strong>${escapeHtml(displayPortalValue(task.reference))}</strong></div>
            <div class="detail-field"><span>Status</span><strong>${done ? "Completed" : "Open"}</strong></div>
          </div>
        `,
        footer: `
          <button class="ghost-button" type="button" data-action="dismiss-task" data-id="${escapeHtml(task.id)}">Dismiss</button>
          ${done ? "" : `<button class="primary-button" type="button" data-action="complete-task" data-id="${escapeHtml(task.id)}">${icon("check", 15)} Mark complete</button>`}
        `
      });
    }

    function openHelpDialog() {
      openDialog({
        id: "portal-help",
        title: "SuccessFactors Portal Help",
        subtitle: "RIAINTRA employee and HR support",
        body: `
          <div class="dialog-summary">This interface receives authenticated employee data from the Wix parent page. If content does not load, confirm the staff session first and then request the bootstrap again.</div>
          <div class="detail-grid">
            <div class="detail-field"><span>Connection</span><strong>${escapeHtml(portalState.status)}</strong></div>
            <div class="detail-field"><span>Role</span><strong>${escapeHtml(currentUserRole || "Not loaded")}</strong></div>
            <div class="detail-field"><span>Employee</span><strong>${escapeHtml(getRole().userName)}</strong></div>
            <div class="detail-field"><span>SK-ID</span><strong>${escapeHtml(getRole().employeeId)}</strong></div>
          </div>
        `,
        footer: `
          <button class="ghost-button" type="button" data-action="navigate-parent" data-path="/riaintra/success-factors/helpdesk">Open ServiceDesk</button>
          <button class="primary-button" type="button" data-action="close-dialog">Close</button>
        `
      });
    }

    function openRbacDialog() {
      const profile = getProfile();
      const ctx = canonicalOrgContext(profile);
      const tokens = profileAccessTokens(profile);
      const accessPurpose = ctx.accessMeta?.purpose || "No explicit ALTEA access-role code returned";
      openDialog({
        id: "rbac-detail",
        title: "My Access & Organization Scope",
        subtitle: "Authenticated profile + SKANDI canonical organization context",
        body: `
          <div class="detail-grid">
            <div class="detail-field"><span>Canonical job role</span><strong>${escapeHtml([ctx.roleId,ctx.jobTitle].filter(Boolean).join(" · ")||"Not returned")}</strong></div>
            <div class="detail-field"><span>Department</span><strong>${escapeHtml([ctx.departmentId,ctx.departmentName].filter(Boolean).join(" · ")||"Not returned")}</strong></div>
            <div class="detail-field"><span>Base / market</span><strong>${escapeHtml([ctx.baseCode,ctx.baseName].filter(Boolean).join(" · ")||"Not returned")}</strong></div>
            <div class="detail-field"><span>ALTEA access role</span><strong>${escapeHtml(ctx.accessRole||"Not explicitly returned")}</strong></div>
            <div class="detail-field"><span>Access purpose</span><strong>${escapeHtml(accessPurpose)}</strong></div>
            <div class="detail-field"><span>Suggested catalog mapping</span><strong>${escapeHtml(ctx.suggestedAccessRole||"—")} · ${escapeHtml(ctx.suggestedPermissionPreset||"—")}</strong></div>
          </div>
          <div class="scope-access-note">Catalog suggestions do not grant access. Application authorization must be confirmed by the authenticated backend and explicit permission/entitlement data.</div>
          ${tokens.length ? `<div class="filter-chips" style="margin-top:12px">${tokens.map(token=>`<span class="role-pill">${icon("lock",12)} ${escapeHtml(token)}</span>`).join("")}</div>` : '<div class="dialog-summary" style="margin-top:12px">No explicit permission tokens were returned.</div>'}
        `,
        footer: '<button class="primary-button" type="button" data-action="close-dialog">Close</button>'
      });
    }

    function completeTask(id) {
      const taskId = String(id || "");
      if (!taskId) return;
      requestPortalMutation("INTRANET_TASK_COMPLETE", { id: taskId });
      closeDialog();
      renderPortal();
      showToast("Saving task", "Waiting for backend confirmation.");
    }

    function dismissTask(id) {
      const taskId = String(id || "");
      if (!taskId) return;
      requestPortalMutation("INTRANET_TASK_DISMISS", { id: taskId });
      closeDialog();
      renderPortal();
      showToast("Saving dismissal", "Waiting for backend confirmation.", "info");
    }

    function openApp(id) {
      const app = roleItems("applicationTiles").find(item => item.id === String(id));
      if (!app) return;
      if (app.path && isSafeNavigationPath(app.path)) {
        requestMasterNavigation(app.path);
        return;
      }
      setRoute("app", app.id);
    }

    function downloadCsv(filename, rows) {
      const csv = rows.map(row => row.map(value => `"${String(value ?? "").replaceAll('"', '""')}"`).join(",")).join("\r\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    }

    function serializeForm(form) {
      const payload = {};
      const data = new FormData(form);
      for (const [key, value] of data.entries()) {
        if (Object.prototype.hasOwnProperty.call(payload, key)) {
          payload[key] = Array.isArray(payload[key]) ? [...payload[key], value] : [payload[key], value];
        } else {
          payload[key] = value;
        }
      }
      return payload;
    }

    function requestPortalBootstrap() {
      portalState.status = "waiting";
      portalState.error = null;
      post("INTRANET_READY", {
        requestedAt: new Date().toISOString(),
        capabilities: ["employee-profile", "directory", "hr-admin", "recruiting", "badge-control", "company-news", "department-news", "base-news", "canonical-role-scope", "department-scope", "base-market-scope", "destination-scope", "permission-scope"]
      });
      post("HR_READY", { requestedAt: new Date().toISOString() });
      renderPortal();
    }

    function refreshHrData() {
      if (canAccessHrModule("workforce") || canAccessHrModule("employee") || canAccessHrModule("organization") || canAccessHrModule("performance") || canAccessHrModule("access") || canAccessHrModule("badge")) {
        post("HR_REFRESH", { selectedId: hrSelectedEmployeeId || "" });
      }
      if (hasRecruitingAccess()) {
        post("CAREERS_REFRESH", { embeddedIn: "SKANDI_SUCCESSFACTORS" });
      }
      showToast("Refresh requested", "Only the SuccessFactors modules authorized for your role were refreshed.");
    }

    function openArchiveConfirmation() {
      const record = selectedHrEmployee();
      if (!record) return;
      openDialog({
        id: "archive-employee",
        title: "Archive employee record",
        subtitle: recordName(record),
        body: '<div class="dialog-summary">This requests an archive operation from the parent backend. The embed will not remove the employee until the backend confirms the change.</div>',
        footer: `
          <button class="ghost-button" type="button" data-action="close-dialog">Cancel</button>
          <button class="semantic-button danger" type="button" data-action="hr-confirm-archive" data-id="${escapeHtml(hrRecordId(record))}">${icon("warning", 15)} Archive employee</button>
        `
      });
    }

    function handleAction(action, element, event) {
      const id = element.dataset.id || "";
      if (action === "close-dialog") {
        if (event.target.closest("[data-dialog-panel]") && element.classList.contains("modal-backdrop")) return;
        closeDialog();
      } else if (action === "dismiss-toast") {
        element.closest(".toast")?.remove();
      } else if (action === "toggle-notifications") {
        notificationsOpen = !notificationsOpen;
        profileOpen = false;
        renderPortal();
      } else if (action === "toggle-profile") {
        profileOpen = !profileOpen;
        notificationsOpen = false;
        renderPortal();
      } else if (action === "toggle-mobile-search") {
        mobileSearchOpen = !mobileSearchOpen;
        renderPortal();
        if (mobileSearchOpen) requestAnimationFrame(() => $("globalSearch")?.focus());
      } else if (action === "mark-all-read") {
        roleItems("notifications").forEach(item => readNotifications.add(item.id));
        requestPortalMutation("INTRANET_NOTIFICATIONS_READ", { ids: [...readNotifications] });
        notificationsOpen = false;
        renderPortal();
      } else if (action === "open-help") {
        openHelpDialog();
      } else if (action === "profile-detail") {
        setRoute("profile");
      } else if (action === "profile-settings" || action === "edit-profile") {
        closeShellPopovers();
        openProfileEditor();
      } else if (action === "show-rbac") {
        openRbacDialog();
      } else if (action === "sign-out") {
        post("INTRANET_SIGN_OUT");
      } else if (action === "request-bootstrap") {
        requestPortalBootstrap();
      } else if (action === "refresh-portal") {
        post("INTRANET_REFRESH");
        showToast("Refresh requested", "The parent application is refreshing employee data.");
      } else if (action === "navigate-parent") {
        const path = element.dataset.path || "";
        if (isSafeNavigationPath(path)) {
          closeDialog();
          requestMasterNavigation(path);
        }
      } else if (action === "scroll-tasks") {
        $("todoScroller")?.scrollBy({ left: Number(element.dataset.direction || 1) * 340, behavior: "smooth" });
      } else if (action === "hero-prev" || action === "hero-next") {
        currentNewsIndex += action === "hero-next" ? 1 : -1;
        renderPortal();
      } else if (action === "hero-dot") {
        currentNewsIndex = Number(element.dataset.index || 0);
        renderPortal();
      } else if (action === "open-news") {
        openNewsDialog(id);
      } else if (action === "open-task") {
        openTaskDialog(id);
      } else if (action === "quick-complete-task" || action === "complete-task") {
        completeTask(id);
      } else if (action === "dismiss-task") {
        dismissTask(id);
      } else if (action === "open-app") {
        openApp(id);
      } else if (action === "toggle-favorite") {
        event.stopPropagation();
        favoriteApps.has(id) ? favoriteApps.delete(id) : favoriteApps.add(id);
        requestPortalMutation("INTRANET_FAVORITES_UPDATE", { ids: [...favoriteApps] });
        renderPortal();
      } else if (action === "task-filter") {
        taskFilter = element.dataset.filter || "open";
        renderPortal();
      } else if (action === "app-group-filter") {
        appGroupFilter = element.dataset.filter || "All";
        renderPortal();
      } else if (action === "export-work") {
        const tasks = roleItems("toDoTasks");
        downloadCsv("successfactors-my-work.csv", [
          ["Title", "Category", "Priority", "Due", "Status"],
          ...tasks.map(task => [task.title, task.category, task.priority, task.due, completedTasks.has(task.id) ? "Completed" : "Open"])
        ]);
      } else if (action === "open-colleague") {
        openColleagueDialog(id);
      } else if (action === "refresh-directory") {
        post("INTRANET_COLLEAGUES_REQUEST", { query: directoryQuery });
        showToast("Directory requested", "Waiting for the authenticated directory response.");
      } else if (action === "profile-tab") {
        currentProfileTab = element.dataset.view || "personal";
        renderPortal();
      } else if (action === "search-open") {
        const type = element.dataset.type;
        if (type === "app") openApp(id);
        if (type === "task") openTaskDialog(id);
        if (type === "news") openNewsDialog(id);
        if (type === "colleague") openColleagueDialog(id);
      } else if (action === "hr-module") {
        const requested = element.dataset.view || "workforce";
        if (!canAccessHrModule(requested)) {
          showToast("Access restricted", "Your SuccessFactors role does not include this HR module.", "warning");
          return;
        }
        currentHrView = requested;
        currentView = "hr";
        const nextHash = routeHash("hr");
        if (window.location.hash !== nextHash) history.pushState(null, "", nextHash);
        if (requested === "recruiting") post("CAREERS_REFRESH", { embeddedIn: "SKANDI_SUCCESSFACTORS" });
        renderPortal();
      } else if (action === "hr-org-refresh") {
        post("HR_ORG_REFRESH", {});
        showToast("Organization refresh requested", "Reloading departments, bases, job codes and permission presets.");
      } else if (action === "hr-refresh") {
        refreshHrData();
      } else if (action === "hr-workforce-scope") {
        hrWorkforceScope = element.dataset.view || "active";
        renderPortal();
      } else if (action === "hr-select-employee") {
        hrSelectedEmployeeId = id;
        hrEmployeeDraftMode = false;
        renderPortal();
      } else if (action === "hr-open-selected") {
        if (!selectedHrEmployee()) return;
        currentHrView = "employee";
        hrEmployeeDraftMode = false;
        renderPortal();
      } else if (action === "hr-new-employee") {
        hrEmployeeDraftMode = true;
        hrSelectedEmployeeId = "";
        currentHrView = "employee";
        currentHrEmployeeTab = "personal";
        renderPortal();
      } else if (action === "hr-employee-tab") {
        currentHrEmployeeTab = element.dataset.view || "personal";
        renderPortal();
      } else if (action === "hr-generate-skid") {
        const form = $("hrEmployeeForm");
        const item = form ? serializeForm(form) : {};
        post("HR_GENERATE_SKID", { firstName: item.firstName || "", lastName: item.lastName || "", recordId: item.recordId || hrSelectedEmployeeId });
      } else if (action === "hr-archive-employee") {
        openArchiveConfirmation();
      } else if (action === "hr-confirm-archive") {
        post("HR_STAFF_ARCHIVE", { id });
        closeDialog();
        showToast("Archive requested", "Waiting for backend confirmation.", "warning");
      } else if (action === "hr-use-badge") {
        badgeSelectedId = hrSelectedEmployeeId;
        currentHrView = "badge";
        renderPortal();
      } else if (action === "recruiting-tab") {
        if (!hasRecruitingAccess()) return;
        currentRecruitingView = element.dataset.view || "dashboard";
        currentHrView = "recruiting";
        const nextHash = routeHash("hr");
        if (window.location.hash !== nextHash) history.replaceState(null, "", nextHash);
        renderPortal();
      } else if (action === "careers-refresh") {
        if (!hasRecruitingAccess()) return;
        post("CAREERS_REFRESH", { embeddedIn: "SKANDI_SUCCESSFACTORS" });
      } else if (action === "careers-new-candidate") {
        if (!hasRecruitingAccess()) return;
        openNewCandidateDialog();
      } else if (action === "careers-open-candidate") {
        if (!hasRecruitingAccess()) return;
        openCandidateDialog(id);
      } else if (action === "careers-open-profile") {
        if (!hasRecruitingAccess()) return;
        hrSelectedCandidateId = id;
        currentRecruitingView = "candidate";
        closeDialog();
        renderPortal();
      } else if (action === "careers-history") {
        if (!hasRecruitingAccess()) return;
        hrSelectedCandidateId = id || hrSelectedCandidateId;
        currentRecruitingView = "history";
        renderPortal();
      } else if (action === "careers-documents") {
        if (!hasRecruitingAccess()) return;
        hrSelectedCandidateId = id || hrSelectedCandidateId;
        currentRecruitingView = "documents";
        renderPortal();
      } else if (action === "careers-move-stage") {
        if (!hasRecruitingAccess()) return;
        post("CAREERS_MOVE_CANDIDATE_STAGE", {
          candidateId: id || hrSelectedCandidateId,
          targetStage: element.dataset.stage || "screening"
        });
        closeDialog();
      } else if (action === "careers-detect-gaps") {
        if (!hasRecruitingAccess()) return;
        post("CAREERS_DETECT_HISTORY_GAPS", { candidateId: id || hrSelectedCandidateId });
      } else if (action === "careers-new-history") {
        if (!hasRecruitingAccess()) return;
        openNewHistoryDialog();
      } else if (action === "careers-verify-history") {
        if (!hasRecruitingAccess()) return;
        post("CAREERS_VERIFY_HISTORY_SEGMENT", { historySegmentId: id, candidateId: hrSelectedCandidateId });
      } else if (action === "careers-resolve-gap") {
        if (!hasRecruitingAccess()) return;
        post("CAREERS_RESOLVE_GAP_REQUEST", { gapId: id, candidateId: hrSelectedCandidateId });
      } else if (action === "careers-request-document") {
        if (!hasRecruitingAccess()) return;
        post("CAREERS_DOCUMENT_UPLOAD_REQUEST", { candidateId: id || hrSelectedCandidateId });
      } else if (action === "careers-verify-document") {
        if (!hasRecruitingAccess()) return;
        post("CAREERS_VERIFY_DOCUMENT", { documentId: id, candidateId: hrSelectedCandidateId });
      } else if (action === "careers-create-packet") {
        if (!hasRecruitingAccess()) return;
        const candidate = selectedRecruitingCandidate();
        post("CAREERS_CREATE_DOCUMENT_PACKET", {
          candidateId: id || recruitingCandidateId(candidate || {}),
          email: candidate?.email || ""
        });
      } else if (action === "careers-resend-packet") {
        if (!hasRecruitingAccess()) return;
        post("CAREERS_RESEND_DOCUMENT_PACKET", { packetId: id });
      } else if (action === "careers-open-execution") {
        if (!hasRecruitingAccess()) return;
        post("CAREERS_OPEN_DOCUMENT_EXECUTION", { packetId: id });
      } else if (action === "careers-open-job") {
        if (!hasRecruitingAccess()) return;
        hrSelectedJobId = id;
        currentRecruitingView = "posting";
        renderPortal();
      } else if (action === "careers-new-job") {
        if (!hasRecruitingAccess()) return;
        hrSelectedJobId = "";
        currentRecruitingView = "posting";
        renderPortal();
      } else if (action === "careers-publish-job") {
        if (!hasRecruitingAccess()) return;
        const form = $("careerJobForm");
        post("CAREERS_PUBLISH_JOB_POSTING", { item: form ? serializeForm(form) : selectedRecruitingJob() || {} });
      } else if (action === "careers-duplicate-job") {
        if (!hasRecruitingAccess()) return;
        post("CAREERS_DUPLICATE_JOB_POSTING", { jobPostingId: recruitingJobId(selectedRecruitingJob() || {}) });
      } else if (action === "careers-start-sra") {
        if (!hasRecruitingAccess()) return;
        post("CAREERS_START_SRA_VETTING", { candidateId: id || recruitingCandidateId(selectedRecruitingCandidate() || {}) });
      } else if (action === "careers-new-interview") {
        if (!hasRecruitingAccess()) return;
        openRecruitingRecordDialog("interview");
      } else if (action === "careers-new-training") {
        if (!hasRecruitingAccess()) return;
        openRecruitingRecordDialog("training");
      } else if (action === "careers-new-onboarding") {
        if (!hasRecruitingAccess()) return;
        openRecruitingRecordDialog("onboarding");
      } else if (action === "careers-test-integrations") {
        if (!hasRecruitingAccess()) return;
        post("CAREERS_TEST_INTEGRATIONS", { source: "SuccessFactors" });
      } else if (action === "careers-schedule-maintenance") {
        if (!hasRecruitingAccess()) return;
        post("CAREERS_SCHEDULE_MAINTENANCE", { settings: portalState.hr.recruiting.settings || {}, source: "SuccessFactors" });
      } else if (action === "careers-dispatch-mail") {
        if (!hasRecruitingAccess()) return;
        post("CAREERS_DISPATCH_QUEUED_EMAILS", { limit: 25, source: "SuccessFactors" });
      } else if (action === "careers-sync-mail") {
        if (!hasRecruitingAccess()) return;
        post("CAREERS_SYNC_MAILBOX_REPLIES", { limit: 50, source: "SuccessFactors" });
      } else if (action === "careers-export-audit") {
        if (!hasRecruitingAccess()) return;
        post("CAREERS_EXPORT_AUDIT", { source: "SuccessFactors", requestedAt: new Date().toISOString() });
      } else if (action === "performance-tab") {
        currentPerformanceView = element.dataset.view || "reports";
        renderPortal();
      } else if (action === "badge-flip") {
        badgeShowBack = !badgeShowBack;
        renderPortal();
      } else if (action === "badge-manual-toggle") {
        badgeManualOpen = !badgeManualOpen;
        renderPortal();
      } else if (action === "badge-clear-override") {
        badgeOverride = {};
        renderPortal();
      } else if (action === "badge-print") {
        const record = badgeRecord();
        post("HR_PRINT_BADGE", { employeeId: hrRecordId(record), badge: record });
        window.print();
      } else if (action === "toggle-dev-tools") {
        devToolsCollapsed = !devToolsCollapsed;
        renderPortal();
      }
    }

    function onDocumentClick(event) {
      const routeTarget = event.target.closest("[data-route]");
      if (routeTarget) {
        const route = routeTarget.dataset.route;
        setRoute(route);
        if (route === "hr") refreshHrData();
        return;
      }
      const pathTarget = event.target.closest(".nav-item-amadeus[data-path]");
      if (pathTarget) {
        const path = pathTarget.dataset.path;
        closeMobileMenu();
        if (isSafeNavigationPath(path)) requestMasterNavigation(path);
        return;
      }
      const actionTarget = event.target.closest("[data-action]");
      if (actionTarget) handleAction(actionTarget.dataset.action, actionTarget, event);
    }

    function onDocumentInput(event) {
      if (event.target.id === "globalSearch") {
        updateGlobalSearch(event.target.value);
      } else if (event.target.id === "appSearch") {
        const query = event.target.value.trim().toLowerCase();
        document.querySelectorAll("#applicationGrid .app-tile").forEach(tile => {
          tile.hidden = Boolean(query) && !tile.textContent.toLowerCase().includes(query);
        });
      } else if (event.target.id === "directorySearch") {
        directoryQuery = event.target.value;
        const query = directoryQuery.trim().toLowerCase();
        document.querySelectorAll(".data-table .hr-table-row").forEach(row => {
          row.hidden = Boolean(query) && !row.textContent.toLowerCase().includes(query);
        });
      } else if (event.target.id === "hrWorkforceSearch") {
        hrSearchQuery = event.target.value;
        const query = hrSearchQuery.trim().toLowerCase();
        document.querySelectorAll(".data-table .hr-table-row").forEach(row => {
          row.hidden = Boolean(query) && !row.textContent.toLowerCase().includes(query);
        });
      }
    }

    function onDocumentChange(event) {
      if (event.target.id === "badgeEmployeeSelect") {
        badgeSelectedId = event.target.value;
        hrSelectedEmployeeId = event.target.value || hrSelectedEmployeeId;
        badgeOverride = {};
        badgeShowBack = false;
        renderPortal();
      } else if (event.target.id === "accessEmployeeSelect") {
        hrSelectedEmployeeId = event.target.value;
        renderPortal();
      } else if (event.target.id === "orgCountrySelect") {
        syncOrgProvisionForm("country");
      } else if (event.target.id === "orgBaseSelect") {
        syncOrgProvisionForm("base");
      } else if (event.target.id === "orgRoleSelect") {
        syncOrgProvisionForm("role");
      } else if (event.target.id === "orgManagerSelect") {
        syncOrgProvisionForm("manager");
      }
    }

    function onDocumentSubmit(event) {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;
      event.preventDefault();
      if (form.id === "profileSelfServiceForm") {
        const payload = serializeForm(form);
        editableProfileFields.filter(field => field.sensitive && !payload[field.key]).forEach(field => delete payload[field.key]);
        post("INTRANET_PROFILE_SAVE", { profile: payload });
        closeDialog();
        showToast("Saving profile", "Your changes were sent for validation.");
      } else if (form.id === "hrEmployeeForm") {
        if (!canManageHrRecords()) return;
        const item = serializeForm(form);
        const recordId = item.recordId || hrSelectedEmployeeId || "";
        delete item.recordId;
        post("HR_STAFF_SAVE", { item: { ...item, ...(recordId ? { id: recordId } : {}) }, isNew: hrEmployeeDraftMode });
        showToast("Saving employee", "The employee record was sent to the HR backend.");
      } else if (form.id === "candidateForm") {
        if (!hasRecruitingAccess()) return;
        post("CAREERS_SAVE_CANDIDATE", { item: serializeForm(form) });
        closeDialog();
        showToast("Saving candidate", "The candidate record was sent to the recruiting backend.");
      } else if (form.id === "careerJobForm") {
        if (!hasRecruitingAccess()) return;
        const item = serializeForm(form);
        if (!item.id) delete item.id;
        post("CAREERS_SAVE_JOB_POSTING", { item });
        showToast("Saving posting", "The vacancy record was sent to the recruiting backend.");
      } else if (form.id === "careerHistoryForm") {
        if (!hasRecruitingAccess()) return;
        post("CAREERS_SAVE_HISTORY_SEGMENT", { item: serializeForm(form) });
        closeDialog();
        showToast("Saving history", "The 5-year history segment was sent for validation.");
      } else if (form.id === "careerInterviewForm") {
        if (!hasRecruitingAccess()) return;
        post("CAREERS_SAVE_INTERVIEW", { item: serializeForm(form) });
        closeDialog();
      } else if (form.id === "careerTrainingForm") {
        if (!hasRecruitingAccess()) return;
        post("CAREERS_SAVE_TRAINING_RECORD", { item: serializeForm(form) });
        closeDialog();
      } else if (form.id === "careerOnboardingForm") {
        if (!hasRecruitingAccess()) return;
        post("CAREERS_SAVE_ONBOARDING_TASK", { item: serializeForm(form) });
        closeDialog();
      } else if (form.id === "careerSettingsForm") {
        if (!hasRecruitingAccess()) return;
        post("CAREERS_SAVE_SETTINGS", { item: serializeForm(form) });
        showToast("Saving settings", "Recruiting settings were sent to the backend.");
      } else if (form.id === "badgeManualForm") {
        badgeOverride = serializeForm(form);
        renderPortal();
        showToast("Preview updated", "Manual badge values are active for this preview.");
      }
    }

    function onDocumentKeydown(event) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (!portalState.connected) return;
        mobileSearchOpen = true;
        renderPortal();
        requestAnimationFrame(() => $("globalSearch")?.focus());
        return;
      }
      if (event.key === "Escape") {
        if (activeDialogId) {
          closeDialog();
          return;
        }
        if (notificationsOpen || profileOpen || mobileSearchOpen) {
          closeShellPopovers();
          renderPortal();
        }
        closeMobileMenu();
      }
      const actionable = event.target.closest?.('[role="button"][data-action], .hr-table-row[data-action], .hr-pipeline-card[data-action]');
      if (actionable && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        actionable.click();
      }
    }

    /* =========================================================
       SuccessFactors embed startup
       RIAINTRA header/footer are owned by the outer Wix/master page.
       ========================================================= */
    function initializePortal() {
      window.addEventListener("message", onParentMessage);

      window.addEventListener("hashchange", () => {
        parseRoute();
        renderPortal();
      });

      document.addEventListener("click", onDocumentClick);
      document.addEventListener("input", onDocumentInput);
      document.addEventListener("change", onDocumentChange);
      document.addEventListener("submit", onDocumentSubmit);
      document.addEventListener("keydown", onDocumentKeydown);

      parseRoute();
      renderPortal();

      post("SKANDI_MASTER_CONFIG_REQUEST", { requestedAt: new Date().toISOString(), component: "SUCCESSFACTORS" });
      post("MASTER_NAVIGATION_REQUEST", { requestedAt: new Date().toISOString(), component: "SUCCESSFACTORS" });

      post("INTRANET_READY", {
        requestedAt: new Date().toISOString(),
        capabilities: [
          "employee-profile",
          "directory",
          "hr-admin",
          "recruiting",
          "badge-control",
          "organization-auto-provision"
        ]
      });

      // Compatibility with the full SuccessFactors HR page-code contract.
      post("HR_READY", {
        requestedAt: new Date().toISOString()
      });
    }

    initializePortal();
  </script>
</body>
</html>
```

