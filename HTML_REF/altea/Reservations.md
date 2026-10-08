# INFO / LOG — ALTEA Reservations

- SOURCE FILE: `/HTML_REF/altea/Reservations.md`
- DISPLAY / PAGE NAME: ALTEA Reservations
- SYSTEM AREA: ALTEA
- WIX PAGE FILE: `/src/pages/Reservations.ly2n8.js`
- WIX ROUTE / SLUG: `/riaintra/success-factors/altea/reservations`
- WIX HTML ELEMENT: `#alteaReservationsEmbed`
- CURRENT STATUS: V12 ONE-TRUE-SOURCE REPAIR PREPARED — REQUIRES LIVE TEST
- SOURCE-OF-TRUTH STATUS: AUTHORITATIVE intended V12 embed payload supplied for this repair.
- CANONICAL WEB FACADE: `/src/backend/SKANDI_CORE/reservations.web.js`
- CANONICAL CORE: `/src/backend/SKANDI_CORE/reservations.js`
- SHARED DATABASE TRANSPORT: `/src/backend/SKANDI_CORE/supabaseServer.js`
- DATA AUTHORITY: Duffel provider facts -> Inventory Control / Supabase canonical record -> downstream page/core consumers. No embed is permitted to maintain an independent editable copy of shared airline, airport, hotel or destination reference facts.
- CANONICAL DETAIL STORAGE: `travel_info_airlines.inventory_details`, `travel_info_airports.inventory_details`, and `inventory_master_entities.details`; identity/lifecycle/query fields remain normal table columns. Legacy Travel Info columns are compatibility projections only after the supplied migration.
- CANONICAL MASTER LIBRARIES: HOTEL, TRANSFER, GUIDED_TOUR, ACTIVITY and PARTNER_TICKET downstream Travel Info content is projected from `inventory_public_entities_v`; legacy `travel_info_hotels/transfers/tours/activities/tickets` are not downstream authorities after this repair.
- PROVIDER SNAPSHOT: the provider evidence remains under `payload.duffel` (`normalized` + `raw`). The migration promotes the normalized provider-owned subset into the canonical Inventory detail object and retains a read-only `inventory_details.duffel` / `details.duffel` copy for audit/context; SKANDI enrichment remains editable only in Inventory Control.
- AUTHORIZATION: unchanged from current V12 page/facade/core boundaries. No frontend role or provider secret becomes authoritative.
- MESSAGE CONTRACTS / ELEMENT IDS: unchanged.
- LAST VERIFIED: 2026-10-08 — current repo `skanditravels/SKANDI-TRAVELS`, branch `main`, commit `86deedb4705fae292851256726cd81e13669aa98`; live Supabase schema/data inspected read-only.

## CHANGE LOG
- 2026-10-08 — One-true-source enforcement finalized: Duffel-linked provider identity/facts are read-only in Inventory Control and refresh through the provider workspace; provider technical snapshots are hidden from generic editable fields; compatibility columns are database-derived. Current GitHub `main` at `86deedb4705fae292851256726cd81e13669aa98` was inspected and preserved.
- 2026-10-08 — V12 one-true-source convergence prepared. Shared reference/master facts now have one editable Inventory/Supabase authority after provider import. Legacy Travel Info fields are derived compatibility projections, provider-key uniqueness is database-enforced, and current Duffel snapshots refresh provider-owned canonical facts without creating alternate data stores. The HTML design, IDs, message names, routes and permission boundaries are unchanged. STATICALLY VERIFIED; REQUIRES LIVE TEST after SQL/Wix publication.

## COMPLETE INTENDED HTML

```html
<!DOCTYPE html>
<!-- V12 DATA AUTHORITY: Reservations consumes Duffel live booking resources plus canonical SKANDI Inventory/Supabase records; it does not maintain duplicate reference masters. -->
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
  <meta name="color-scheme" content="light">
  <title>SKANDI ALTEA Unified Reservations B-007.5</title>
  <script src="https://js.stripe.com/v3/"></script>
  <script src="https://assets.duffel.com/components/3.17.0/duffel-card-form.js"></script>
  <script src="https://assets.duffel.com/components/3.17.0/createThreeDSecureSession.js"></script>
  <style>
    :root {
      --brand: #005eb8;
      --brand-dark: #003b73;
      --brand-mid: #0b75cf;
      --brand-pale: #eaf4fc;
      --bg: #eef1f4;
      --panel: #fff;
      --line: #cbd3da;
      --line-dark: #9ca9b4;
      --text: #1d2a34;
      --muted: #62717d;
      --success: #14804a;
      --success-bg: #e5f6ec;
      --warning: #8a5200;
      --warning-bg: #fff3d6;
      --danger: #b42318;
      --danger-bg: #fdebea;
      --info: #0969a8;
      --shadow: 0 8px 24px rgba(20, 48, 74, .14);
      --sidebar: 224px;
      --tabs: 38px;
      --radius: 3px;
    }


    * { box-sizing: border-box; }
    html, body {
      height: 100%;
      margin: 0;
      overflow: hidden;
      background: var(--bg);
      color: var(--text);
      font: 12px/1.35 Tahoma, "Segoe UI", Arial, sans-serif;
    }
    button, input, select, textarea { font: inherit; }
    button { cursor: pointer; }
    button:disabled { cursor: not-allowed; opacity: .55; }
    .hidden { display: none !important; }
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
    .app-loader-overlay {
      position: fixed;
      inset: 0;
      z-index: 9999;
      background: rgba(0, 0, 0, 0.65);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 14px;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.1s ease;
      font-family: Arial, Tahoma, "Segoe UI", sans-serif;
    }
    .app-loader-overlay.active {
      opacity: 1;
      pointer-events: auto;
    }
    .altea-loader-box {
      background: linear-gradient(#f2f2f2, #dedede);
      border: 2px solid #7f7f7f;
      border-top-color: #555;
      border-left-color: #555;
      padding: 18px 24px;
      box-shadow: 0 12px 36px rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      gap: 16px;
      min-width: 320px;
    }
    .altea-spinner {
      width: 24px;
      height: 24px;
      border: 3px solid #ccc;
      border-top-color: #1976ad; /* Amadeus Blue */
      border-right-color: #f3bd00; /* Amadeus Yellow */
      border-radius: 50%;
      animation: altea-spin 0.6s linear infinite;
    }
    .altea-loader-content {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .app-loader-text {
      color: #222;
      font-weight: 700;
      font-size: 11px;
      letter-spacing: 0.03em;
      text-transform: uppercase;
    }
    .altea-subtext {
      color: #555;
      font-size: 9px;
      font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
    }
    @keyframes altea-spin {
      to { transform: rotate(360deg); }
    }
    #app {
      height: 100%;
      display: grid;
      grid-template-columns: var(--sidebar) 1fr;
      grid-template-rows: var(--tabs) 1fr;
      grid-template-areas: "side tabs" "side main";
      transition: grid-template-columns .18s ease;
    }
    #app.sidebar-collapsed { --sidebar: 48px; }
    /* -- NEW TAB STYLES -- */
    .workspace-tabs {
      gap: 3px;
    }
    .ws-tab {
      cursor: pointer;
      color: #647581;
      background: #eef1f4;
      border-radius: 4px 4px 0 0;
      transition: background 0.15s ease;
    }
    .ws-tab:hover {
      background: #e0e6eb;
    }
    .ws-tab.active {
      color: #14384f;
      background: #fff;
      border-bottom: 1px solid #fff;
      margin-bottom: -1px;
    }
    .ws-tab-close {
      margin-left: auto;
      border: none;
      background: none;
      color: #a7b2bb;
      cursor: pointer;
      font-size: 15px;
      line-height: 1;
      padding: 0 4px;
      border-radius: 2px;
    }
    .ws-tab-close:hover {
      color: #b42318;
      background: #fdebea;
    }
    .ws-tab-add {
      height: 28px;
      width: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 0px dashed #a7b2bb;
      background: transparent;
      cursor: pointer;
      margin-left: 4px;
      color: #647581;
      border-radius: 4px;
      font-size: 18px;
    }
    .ws-tab-add:hover {
      background: #e0e6eb;
      color: #14384f;
    }
    .sidebar {
      grid-area: side;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      color: #dce6ed;
      border-right: 1px solid #162430;
      background: #263746;
    }
    .sidebar-toggle {
      height: 35px;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding: 0 10px;
      border-bottom: 1px solid rgba(255, 255, 255, .08);
    }
    .ghost {
      padding: 4px 7px;
      color: inherit;
      border: 0;
      border-radius: 2px;
      background: transparent;
    }
    .ghost:hover { background: rgba(0, 0, 0, .12); }
    .nav {
      flex: 1;
      padding: 4px 0;
      overflow: auto hidden;
    }
    .nav-section {
      padding: 10px 13px 5px;
      color: #8398a8;
      font-size: 9px;
      letter-spacing: .09em;
      text-transform: uppercase;
      white-space: nowrap;
    }
    .nav-item {
      width: 100%;
      height: 30px;
      display: flex;
      align-items: center;
      gap: 11px;
      padding: 0 13px;
      color: #dbe6ed;
      text-align: left;
      white-space: nowrap;
      border: 0;
      border-left: 3px solid transparent;
      background: transparent;
    }
    .nav-item:hover { background: #324a5d; }
    .nav-item.active {
      color: #fff;
      border-left-color: #55b4ff;
      background: #173c5a;
    }
    .nav-icon { width: 19px; flex: 0 0 19px; margin-top:3px; text-align: center; font-size: 14px; }
    .nav-label { overflow: hidden; }
    
    #app.sidebar-collapsed .nav-label,
    #app.sidebar-collapsed .nav-section { display: none; }
    #app.sidebar-collapsed .nav-item { padding: 0 12px; }
    #app.sidebar-collapsed .sidebar-toggle { justify-content: center; }


    .workspace-tabs {
      grid-area: tabs;
      display: flex;
      align-items: flex-end;
      overflow-x: auto;
      padding-left: 4px;
      border-bottom: 1px solid #a9b4bd;
      background: #dce2e7;
    }
    .ws-tab {
      height: 35px;
      min-width: 150px;
      max-width: 220px;
      display: flex;
      align-items: center;
      gap: 7px;
      padding: 0 10px;
      color: #14384f;
      font-weight: 650;
      border: 1px solid #a7b2bb;
      border-bottom: 0;
      background: #fff;
    }
    .main {
      grid-area: main;
      position: relative;
      overflow: hidden;
      background: var(--bg);
    }
    .view {
      height: 100%;
      overflow: auto;
      padding: 12px;
      animation: fade .14s ease;
    }
    @keyframes fade {
      from { opacity: .55; transform: translateY(2px); }
      to { opacity: 1; transform: none; }
    }


    .page-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 10px;
    }
    .page-head h1 { margin: 0; color: #1c3243; font-size: 17px; }
    .page-head p { margin: 3px 0 0; color: var(--muted); }
    .head-actions { display: flex; align-items: center; gap: 6px; }
    .panel {
      border: 1px solid var(--line);
      border-radius: var(--radius);
      background: var(--panel);
      box-shadow: 0 1px 1px rgba(0, 0, 0, .03);
    }
    .panel-head {
      min-height: 34px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 7px 10px;
      color: #2b4454;
      font-weight: 700;
      border-bottom: 1px solid var(--line);
      background: linear-gradient(#fbfcfd, #edf1f4);
    }
    .panel-body { padding: 10px; }
    .panel-foot {
      display: flex;
      justify-content: flex-end;
      gap: 7px;
      padding: 8px 10px;
      border-top: 1px solid var(--line);
      background: #f6f8f9;
    }
    .grid { display: grid; gap: 10px; }
    .grid-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .grid-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .grid-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    .span-2 { grid-column: span 2; }
    .stat {
      min-height: 89px;
      position: relative;
      overflow: hidden;
      padding: 12px;
      border: 1px solid var(--line);
      background: #fff;
    }
    .stat::before {
      content: "";
      position: absolute;
      inset: 0 auto 0 0;
      width: 3px;
      background: var(--brand);
    }
    .stat-label {
      color: #647581;
      font-size: 10px;
      letter-spacing: .06em;
      text-transform: uppercase;
    }
    .stat-value { margin-top: 6px; color: #173f5c; font-size: 24px; font-weight: 700; }
    .stat-meta { margin-top: 4px; color: #798891; font-size: 10px; }
    .badge {
      min-height: 19px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0 6px;
      border-radius: 10px;
      font-size: 10px;
      font-weight: 700;
      line-height: 1;
    }
    .badge.success { color: var(--success); background: var(--success-bg); }
    .badge.warning { color: var(--warning); background: var(--warning-bg); }
    .badge.danger { color: var(--danger); background: var(--danger-bg); }
    .badge.info { color: var(--info); background: #e5f2fb; }
    .badge.neutral { color: #53636d; background: #e9edf0; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th {
      position: sticky;
      top: 0;
      z-index: 1;
      padding: 7px;
      color: #425663;
      font-size: 10px;
      letter-spacing: .04em;
      text-align: left;
      text-transform: uppercase;
      border: 1px solid var(--line);
      background: #edf1f4;
    }
    .data-table td {
      padding: 7px;
      vertical-align: middle;
      border: 1px solid #d8dee3;
      background: #fff;
    }
    .data-table tbody tr:hover td { background: #f1f7fc; }
    .link {
      padding: 0;
      color: #005ea8;
      font-weight: 650;
      border: 0;
      background: transparent;
    }
    .link:hover { text-decoration: underline; }
    .alert {
      display: flex;
      gap: 9px;
      padding: 9px 10px;
      margin-bottom: 8px;
      border: 1px solid;
      border-radius: 2px;
    }
    .alert.info { color: #19577f; border-color: #9ecbea; background: #eaf5fd; }
    .alert.warning { color: #74510c; border-color: #e3c36f; background: var(--warning-bg); }
    .alert.danger { color: #85231d; border-color: #e8a6a2; background: var(--danger-bg); }
    .alert.success { color: #14633d; border-color: #9cd4b6; background: var(--success-bg); }
    .alert strong { display: block; margin-bottom: 2px; }
    .field {
      display: flex;
      flex-direction: column;
      gap: 5px;
      margin-bottom: 10px;
    }
    .field label { color: #33434f; font-weight: 650; }
    .field input,
    .field select,
    .field textarea {
      width: 100%;
      min-height: 32px;
      padding: 0 9px;
      color: #1c2b35;
      outline: none;
      border: 1px solid #aeb9c2;
      border-radius: 2px;
      background: #fff;
    }
    .field textarea { min-height: 70px; padding: 8px; resize: vertical; }
    .field input:focus,
    .field select:focus,
    .field textarea:focus {
      border-color: var(--brand);
      box-shadow: 0 0 0 2px rgba(0, 94, 184, .13);
    }
    .check { display: flex; align-items: center; gap: 7px; color: #596974; }
    .check input { width: 14px; height: 14px; }
    .primary,
    .secondary,
    .danger-btn {
      min-height: 31px;
      padding: 0 12px;
      font-weight: 650;
      border-radius: 2px;
    }
    .primary {
      color: #fff;
      border: 1px solid var(--brand-dark);
      background: var(--brand);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, .18);
    }
    .primary:hover { background: #004f9d; }
    .secondary { color: #263742; border: 1px solid #9eabb5; background: #fff; }
    .secondary:hover { background: #f3f6f8; }
    .danger-btn { color: #a71910; border: 1px solid #cf6e67; background: #fff; }
    .muted { color: var(--muted); }
    .strong { font-weight: 700; }
    .mono { font-family: ui-monospace, SFMono-Regular, Consolas, monospace; }
    .right { text-align: right; }
    .nowrap { white-space: nowrap; }
    .empty { padding: 30px; color: #71808a; text-align: center; }
    .empty .big { margin-bottom: 8px; font-size: 30px; opacity: .55; }


    .form-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 8px;
      align-items: end;
    }
    .subtle { color: var(--muted); }
    .club-cm-grid {
      display: grid;
      grid-template-columns: minmax(0, 1.45fr) minmax(310px, .75fr);
      gap: 8px;
      min-height: 520px;
    }
    .club-manifest-panel {
      display: flex;
      flex-direction: column;
      min-height: 0;
    }
    .club-searchbar {
      display: flex;
      gap: 5px;
      align-items: center;
      padding: 6px;
      background: #edf1f4;
      border-bottom: 1px solid var(--line);
      flex-wrap: wrap;
    }
    .club-searchbar input { flex: 1; min-width: 180px; }
    .club-searchbar select { min-width: 120px; }
    .club-table-wrap {
      flex: 1;
      overflow: auto;
      min-height: 280px;
    }
    .club-table tr.selected td {
      background: #cfe8fa !important;
      outline-top: 1px solid #55a8df;
      outline-bottom: 1px solid #55a8df;
    }
    .club-footer {
      min-height: 30px;
      border-top: 1px solid var(--line);
      display: flex;
      align-items: center;
      padding: 4px 7px;
      background: #edf1f4;
      gap: 12px;
      font-size: 10px;
    }
    .club-footer .spacer { flex: 1; }
    .club-profile { padding: 0; }
    .club-profile-banner {
      background: #eaf3fb;
      border-bottom: 1px solid #a9c5da;
      padding: 9px;
      display: flex;
      align-items: flex-start;
      gap: 9px;
    }
    .club-avatar {
      width: 40px;
      height: 40px;
      border-radius: 2px;
      background: #174d76;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      font-size: 15px;
      flex: 0 0 40px;
    }
    .club-profile-title { min-width: 0; }
    .club-profile-title h2 { font-size: 17px; margin: 0 0 3px; }
    .club-profile-title .sub { font-size: 10px; color: #506473; overflow-wrap: anywhere; }
    .club-status-box {
      margin-left: auto;
      text-align: center;
      border: 1px solid #86a5bc;
      background: #fff;
      min-width: 78px;
      padding: 4px;
    }
    .club-status-box span {
      display: block;
      font-size: 9px;
      text-transform: uppercase;
      color: #60707b;
    }
    .club-status-box strong { font-size: 12px; }
    .club-detail-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0;
      border-bottom: 1px solid var(--line);
    }
    .club-detail {
      padding: 6px 8px;
      border-right: 1px solid #d8dfe4;
      border-bottom: 1px solid #d8dfe4;
      min-height: 45px;
    }
    .club-detail:nth-child(even) { border-right: 0; }
    .club-detail b { display: block; margin-top: 2px; overflow-wrap: anywhere; }
    .club-chips { display: flex; gap: 4px; flex-wrap: wrap; margin-top: 4px; }
    .club-chip {
      padding: 2px 5px;
      border-radius: 2px;
      background: #edf1f4;
      border: 1px solid #bdc7ce;
      font-size: 9px;
      font-weight: 800;
    }
    .club-chip.tier { background: #1d2c42; color: #fff; border-color: #1d2c42; }
    .club-chip.customer { background: #eaf3fb; color: #00539b; border-color: #9ec9ea; }
    .club-profile-actions {
      display: flex;
      gap: 5px;
      padding: 8px;
      flex-wrap: wrap;
    }


    .toolbar {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
      padding: 7px;
      border-bottom: 1px solid var(--line);
      background: #f5f7f8;
    }


    .dashboard-layout {
      display: grid;
      grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr);
      gap: 10px;
    }
    .quick-actions { display: grid; grid-template-columns: repeat(2, 1fr); gap: 7px; }
    .quick-action {
      padding: 10px;
      text-align: left;
      border: 1px solid var(--line);
      border-radius: 2px;
      background: #fff;
    }
    .quick-action:hover { border-color: #75a9d0; background: #f1f8fd; }
    .quick-action b { display: block; margin-bottom: 3px; color: #0c568f; }


    .search-form {
      display: grid;
      grid-template-columns: .8fr 1fr 38px 1fr .78fr .78fr .72fr;
      gap: 8px;
      align-items: end;
    }
    .search-form .field { margin: 0; }
    .search-form .primary { min-height: 32px; }
    .search-options {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr 1fr;
      gap: 8px;
      margin-top: 10px;
    }
    .offer-layout {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 315px;
      gap: 10px;
      align-items: start;
    }
    .offer-row {
      margin-bottom: 8px;
      border: 1px solid var(--line);
      background: #fff;
    }
    .offer-row:hover { box-shadow: inset 3px 0 var(--brand); }
    .offer-summary {
      display: grid;
      grid-template-columns: 130px minmax(0, 1fr) 145px;
      align-items: stretch;
    }
    .offer-price,
    .offer-route,
    .offer-action { padding: 10px; }
    .offer-price { border-right: 1px solid #e0e5e8; }
    .offer-price strong { display: block; color: #173f5c; font-size: 18px; }
    .offer-route { display: grid; gap: 7px; }
    .offer-slice { padding-bottom: 7px; border-bottom: 1px dotted #c6d0d7; }
    .offer-slice:last-child { padding-bottom: 0; border-bottom: 0; }
    .offer-action {
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 7px;
      text-align: right;
      border-left: 1px solid #e0e5e8;
    }
    .carrier-disclosure {
      padding: 7px 10px;
      color: #405661;
      font-size: 10px;
      border-top: 1px solid #e0e5e8;
      background: #f7f9fa;
    }
    .workspace-layout {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 315px;
      gap: 10px;
      align-items: start;
    }
    .sticky { position: sticky; top: 0; }
    .slice-card { margin-bottom: 8px; border: 1px solid #c6d0d7; background: #fff; }
    .slice-head {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      padding: 7px 9px;
      color: #26485e;
      font-weight: 700;
      border-bottom: 1px solid #b7c7d3;
      background: #dde8f1;
    }
    .segment {
      display: grid;
      grid-template-columns: 115px 120px minmax(170px, 1fr) 110px;
      align-items: center;
      border-bottom: 1px solid #e0e5e8;
    }
    .segment:last-child { border-bottom: 0; }
    .segment > div { min-height: 60px; padding: 8px; border-right: 1px solid #e0e5e8; }
    .segment > div:last-child { border-right: 0; }
    .segment .time { font-size: 14px; font-weight: 700; }
    .money-line {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      padding: 5px 0;
      border-bottom: 1px dotted #c9d1d7;
    }
    .money-line:last-child { border-bottom: 0; }
    .price-total { color: #123e5d; font-size: 20px; font-weight: 800; }
    .service-row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 120px 100px;
      align-items: center;
      gap: 8px;
      padding: 8px;
      border-bottom: 1px solid #e1e6e9;
    }
    .service-row:last-child { border-bottom: 0; }
    .seat-grid { display: flex; flex-wrap: wrap; gap: 5px; }
    .seat {
      min-width: 42px;
      min-height: 31px;
      padding: 3px 5px;
      color: #27404e;
      border: 1px solid #aebcc6;
      border-radius: 2px;
      background: #eef3f6;
    }
    .seat:hover { border-color: #5d9cc8; background: #ddecf7; }
    .seat.selected { color: #fff; border-color: #004887; background: var(--brand); }
    .passenger-card { margin-bottom: 9px; border: 1px solid var(--line); background: #fff; }
    .passenger-card .panel-body { padding-bottom: 0; }
    .payment-shell { min-height: 120px; padding: 10px; border: 1px solid #b7c4cc; background: #fff; }


    .modal-root:empty { display: none; }
    .modal-backdrop {
      position: fixed;
      inset: 0;
      z-index: 500;
      display: grid;
      place-items: center;
      padding: 16px;
      background: rgba(9, 25, 37, .58);
    }
    .modal {
      width: min(600px, 100%);
      max-height: calc(100vh - 32px);
      overflow: auto;
      border: 1px solid #7e8f9c;
      border-radius: 3px;
      background: #fff;
      box-shadow: 0 24px 70px rgba(0, 0, 0, .35);
    }
    .modal.lg { width: min(900px, 100%); }
    .modal-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 9px 11px;
      color: #fff;
      font-weight: 700;
      background: linear-gradient(#0870ca, #005aa9);
    }
    .modal-head button { color: #fff; border: 0; background: transparent; font-size: 18px; }
    .modal-body { padding: 12px; }
    .modal-foot {
      display: flex;
      justify-content: flex-end;
      gap: 7px;
      padding: 9px 11px;
      border-top: 1px solid var(--line);
      background: #f4f6f8;
    }
    .toast-stack {
      position: fixed;
      right: 14px;
      bottom: 14px;
      z-index: 800;
      width: min(340px, calc(100vw - 28px));
    }
    .toast {
      margin-top: 7px;
      padding: 10px;
      border: 1px solid #9ecbea;
      border-radius: 3px;
      background: #fff;
      box-shadow: var(--shadow);
      transition: .18s ease;
    }
    .toast.success { border-left: 4px solid var(--success); }
    .toast.warning { border-left: 4px solid #d08a16; }
    .toast.danger { border-left: 4px solid var(--danger); }
    .busy-bar {
      position: fixed;
      top: 47px;
      left: 0;
      right: 0;
      z-index: 900;
      height: 3px;
      overflow: hidden;
      background: rgba(255, 255, 255, .2);
    }
    .busy-bar::after {
      content: "";
      display: block;
      width: 35%;
      height: 100%;
      background: #72c8ff;
      animation: progress 1s linear infinite;
    }
    @keyframes progress {
      from { transform: translateX(-100%); }
      to { transform: translateX(385%); }
    }


    /* R-005 embed standard:
       Wix HTML component scrolling = NO
       Wix containing section overflow = SHOW
       This ALTEA application retains bounded workspace/table/modal scrolling only. */
    .main, .view { overscroll-behavior: contain; }
    .grid-body, .table-scroll, .modal-body, .drawer-body { overscroll-behavior: contain; }


    @media (max-width: 1050px) {
      :root { --sidebar: 48px; }
      .nav-label, .nav-section { display: none; }
      .nav-item { padding: 0 12px; }
      .offer-layout, .workspace-layout, .dashboard-layout { grid-template-columns: 1fr; }
      .club-cm-grid { grid-template-columns: 1fr; }
      .form-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .sticky { position: static; }
      .search-form { grid-template-columns: repeat(4, minmax(0, 1fr)); }
      .search-options { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (max-width: 720px) {
      html, body { overflow: hidden; }
      #app {
        min-height: 100vh;
        height: auto;
        grid-template-columns: 1fr;
        grid-template-rows: auto auto 1fr;
        grid-template-areas: "side" "tabs" "main";
      }
      .brand { min-width: 100%; border-right: 0; }
      .sidebar { display: block; border-right: 0; }
      .sidebar-toggle, .nav-section { display: none; }
      .nav { display: flex; overflow-x: auto; padding: 4px; }
      .nav-item { width: auto; min-width: 45px; padding: 0 10px; border-left: 0; border-bottom: 3px solid transparent; }
      .nav-item.active { border-left: 0; border-bottom-color: #55b4ff; }
      .view { height: auto; overflow: visible; }
      .search-form, .search-options, .grid-2, .grid-3, .grid-4 { grid-template-columns: 1fr; }
      .form-grid, .club-detail-grid { grid-template-columns: 1fr; }
      .club-detail { border-right: 0; }
      .span-2 { grid-column: auto; }
      .offer-summary { grid-template-columns: 1fr; }
      .offer-price, .offer-action { border: 0; border-bottom: 1px solid #e0e5e8; text-align: left; }
      .segment { grid-template-columns: 1fr 1fr; }
      .segment > div:nth-child(2) { border-right: 0; }
    }
  </style>


  <style id="b0075-amadeus-shell">
    :root{
      --am-yellow:#f3bd00;--am-yellow-dark:#d99c00;--am-blue:#1976ad;--am-blue-dark:#0b5f93;
      --am-grey-0:#fff;--am-grey-1:#f6f6f6;--am-grey-2:#e5e5e5;--am-grey-3:#d0d0d0;--am-grey-4:#b7b7b7;
      --am-text:#222;--sidebar:196px;--tabs:30px;--radius:0px;
    }
    html,body{font-family:Arial,Tahoma,"Segoe UI",sans-serif;background:#fff;color:var(--am-text);font-size:11px}
    #app{grid-template-columns:var(--sidebar) 1fr;grid-template-rows:26px var(--tabs) 1fr;grid-template-areas:"title title" "side tabs" "side main";transition:none;background:#fff}
    #app.sidebar-collapsed{--sidebar:196px}
    .amadeus-titlebar{grid-area:title;height:26px;display:flex;align-items:center;justify-content:space-between;padding:0 3px 0 4px;background:linear-gradient(#e9e9e9,#cfcfcf);border-bottom:1px solid #aaa;color:#5a5a5a;font-size:13px;line-height:1;box-shadow:inset 0 1px #f8f8f8}
    .amadeus-title-left{display:flex;align-items:center;gap:6px}.amadeus-a{width:15px;height:15px;border-radius:50%;display:grid;place-items:center;background:#1678b2;color:#fff;font-weight:900;font:italic 700 13px Georgia,serif}.amadeus-title-context{font-size:10px;color:#777;margin-left:6px;font-weight:400}
    .amadeus-window-controls{display:flex;gap:2px}.amadeus-window-controls span{width:15px;height:15px;display:grid;place-items:center;background:#ff9f00;color:#fff;border:1px solid #e98e00;font-weight:900;font-size:10px}
    .sidebar{grid-area:side;color:#222;background:#f2f2f2;border-right:1px solid #b8b8b8;overflow:auto}
    .sidebar-toggle{display:none}
    .nav{padding:0;overflow:auto}
    .nav-section{padding:4px 5px 3px;color:#555;background:linear-gradient(#ededed,#d6d6d6);font-size:10px;font-weight:700;letter-spacing:0;text-transform:none;border-top:1px solid #fff;border-bottom:1px solid #bdbdbd}
    .nav-item{height:27px;gap:5px;padding:0 5px;color:#222;border:0;border-bottom:1px solid #d5d5d5;background:linear-gradient(#fafafa,#e8e8e8);font-size:11px;font-weight:700}
    .nav-item:hover{background:#fff0ad}.nav-item.active{color:#111;border:0;background:linear-gradient(#f6c600,#e8aa00);box-shadow:inset 0 1px #ffe77e}
    .nav-icon{width:14px;flex:0 0 14px;color:#4b4b4b;font-size:10px}.nav-label{overflow:hidden;text-overflow:ellipsis}
    .workspace-tabs{grid-area:tabs;height:30px;align-items:center;padding:0 5px;background:linear-gradient(#efefef,#d7d7d7);border-bottom:1px solid #b8b8b8}
    .ws-tab{height:23px;min-width:190px;max-width:320px;padding:0 8px;color:#222;border:1px solid #aaa;background:#f7f7f7;font-size:11px;font-weight:700}
    .main{grid-area:main;background:#fff}.view{padding:6px;background:#fff}
    .page-head{margin:0 0 6px;padding:3px 5px;background:linear-gradient(#e7e7e7,#d4d4d4);border:1px solid #bebebe;align-items:center}.page-head h1{font-size:13px;color:#333}.page-head p{font-size:10px;color:#555;margin:1px 0 0}
    .panel{border:1px solid #bcbcbc;background:#fff;box-shadow:none}.panel-head{min-height:24px;padding:3px 6px;border-bottom:1px solid #bcbcbc;background:linear-gradient(#ececec,#d8d8d8);color:#333;font-size:11px}.panel-body{padding:6px}.panel-foot{padding:5px 6px;background:#ededed;border-top:1px solid #bbb}
    button.primary,button.secondary,.btn,.quick-preview{min-height:25px;border-radius:0!important;border:1px solid #7f7f7f!important;font-weight:700!important;box-shadow:inset 0 1px rgba(255,255,255,.8);font-size:10px!important}
    button.primary{background:linear-gradient(#42a2d4,#177cad)!important;color:#fff!important;border-color:#176d99!important}button.primary:hover{background:linear-gradient(#55afd9,#2388b9)!important}
    button.secondary,.quick-preview{background:linear-gradient(#fafafa,#d9d9d9)!important;color:#333!important}.field label{font-size:10px;font-weight:700;color:#444}.field input,.field select,.field textarea,input,select,textarea{border-radius:0!important;border:1px solid #a9a9a9!important;min-height:23px;background:#fff;font-size:10px}
    .table,.data-table,table{font-size:10px}.table th,.data-table th,table th{background:#d9d9d9!important;color:#333!important;border-color:#bcbcbc!important}.table td,.data-table td,table td{border-color:#d0d0d0!important}
    .badge{border-radius:0!important;font-size:9px!important}.stat{min-height:54px;border-radius:0!important;border:1px solid #c5c5c5!important;box-shadow:none!important;background:#fafafa!important}.stat-label{font-size:9px!important}.stat-value{font-size:17px!important}
    .modal-card,.modal{border-radius:0!important;border:1px solid #8c8c8c!important;box-shadow:0 8px 24px rgba(0,0,0,.28)!important}.modal-head{background:linear-gradient(#e8e8e8,#d0d0d0)!important;border-bottom:1px solid #aaa!important;color:#333!important}
    /* Seats & Services Catalogue: match the supplied Amadeus reference */
    .svc-catalog{grid-template-columns:196px minmax(0,1fr);border:1px solid #aaa;min-height:585px;background:#fff}
    .svc-nav{background:#f0f0f0;border-right:1px solid #bcbcbc}.svc-nav h4{display:none}.svc-nav button{height:26px;padding:3px 5px;border-bottom:1px solid #cfcfcf;background:linear-gradient(#fafafa,#e7e7e7);font-size:11px;font-weight:700;color:#333}.svc-nav button:hover{background:#fff0a4}.svc-nav button.active{background:linear-gradient(#f6c600,#e5aa00);color:#111}.svc-nav .sub{height:19px;padding:2px 7px 2px 23px;font-size:10px;font-weight:400;background:#fff}.svc-nav .sub.active{background:#fff0a4;border-left:0;color:#111;font-weight:700}.svc-nav button.disabled{color:#b7b7b7;background:linear-gradient(#f5f5f5,#e7e7e7);font-weight:700}
    .svc-main{background:#fff}.svc-top{grid-template-columns:minmax(270px,.9fr) minmax(360px,1.35fr);gap:48px;padding:7px 18px;background:#fff;border-bottom:0}.svc-box{border:1px solid #bcbcbc;min-height:69px}.svc-box-title{padding:4px 7px;background:#d0d0d0;font-size:10px}.svc-box-row{padding:3px 7px;border-top:0;font-size:10px}.svc-box-row.active{background:#fff4bf}.svc-toolbar{padding:6px 10px;background:#ececec;border-top:1px solid #c8c8c8;border-bottom:1px solid #c0c0c0}.svc-body{grid-template-columns:315px minmax(0,1fr);min-height:425px}.seat-legend{padding:8px 16px;background:#fff;border-right:1px solid #c9c9c9;font-size:10px}.seat-legend h4{font-size:10px;margin:2px 0 5px}.legend-row{margin:3px 0}.legend-swatch{width:16px;height:16px}.aircraft-canvas{padding:8px 18px;background:#fff}.cabin-block{min-width:430px;max-width:650px}.seat-row{grid-template-columns:25px minmax(0,1fr) 25px;gap:1px;margin:1px 0}.seat-row-inner{gap:2px}.seat-section{gap:1px;margin:0 6px}.seat-cell{width:20px;height:18px;border:1px solid #67aee0;border-radius:2px;font-size:7px;color:#1b5a80;padding:0}.seat-cell.facility{background:#287fb4;border-color:#287fb4;color:#fff}.seat-cell.blocked{background:#dedede;border-color:#aaa;color:#777}.seat-cell.chargeable{border:2px solid #1976ad}.seat-cell.selected{background:#f6bd20;border-color:#ca8a00;color:#111}.seat-pax-badge{right:-3px;top:-4px;min-width:11px;height:11px;border-radius:0;background:#f6bd20;color:#111;border:1px solid #ca8a00;font-size:7px}.seat-price{display:none}.svc-footer{padding:6px 18px;background:#eee;border-top:1px solid #bbb}
    .seat-feature-filter label{margin:4px 0}.hotel-card,.transfer-builder,.crm-detail-grid{border-color:#bcbcbc}.hotel-head{padding:5px}.hotel-matrix{border-top-color:#bbb}.basket{border:1px solid #aaa;background:#fff}.basket .panel-head{background:linear-gradient(#f0f0f0,#d9d9d9)}
    @media(max-width:850px){#app{grid-template-columns:1fr;grid-template-rows:26px 30px auto 1fr;grid-template-areas:"title" "tabs" "side" "main"}.sidebar{max-height:150px;border-right:0;border-bottom:1px solid #aaa}.nav{display:flex;overflow:auto}.nav-section{display:none}.nav-item{min-width:145px;border-right:1px solid #ccc}.svc-catalog,.svc-body{grid-template-columns:1fr}.svc-nav{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));border-right:0}.svc-nav .sub{padding-left:14px}.svc-top{grid-template-columns:1fr;gap:6px}.seat-legend{border-right:0;border-bottom:1px solid #ccc}}
  </style>


</head>
<body>
    <!-- Altéa Terminal Loading Overlay -->
  <div id="appLoader" class="app-loader-overlay">
    <div class="altea-loader-box">
      <div class="altea-spinner"></div>
      <div class="altea-loader-content">
        <div id="appLoaderText" class="app-loader-text">COMMUNICATING WITH HOST SYSTEM...</div>
        <div class="altea-subtext">PROCESSING COMMAND / PLEASE WAIT</div>
      </div>
    </div>
  </div>
  <div id="app">
    <header class="amadeus-titlebar">
      <div class="amadeus-title-left"><span class="amadeus-a">a</span><strong>SKANDI ALTEA Reservations</strong><span class="amadeus-title-context" id="amadeusTitleContext">Selling Platform Connect</span></div>
    </header>
    <aside class="sidebar">
      <div class="sidebar-toggle">
        <button id="sidebarToggle" type="button" class="ghost" aria-label="Collapse navigation">☰</button>
      </div>
      <nav class="nav" aria-label="ALTEA unified workspace">
        <div class="nav-section">Search &amp; Sell</div>
        <button type="button" class="nav-item active" data-view="dashboard"><span class="nav-icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg></span><span class="nav-label">Dashboard</span></button>
        <button type="button" class="nav-item" data-view="search"><span class="nav-icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.2-1.1.6L3 8l6 5-3.2 3.2-3.1-1-1.4 1.4 3.7 2.4 2.4 3.7 1.4-1.4-1-3.1 3.2-3.2 5 6l1.2-.7c.4-.2.7-.6.6-1.1z"></path></svg></span><span class="nav-label">Flight Search</span></button>
        <button type="button" class="nav-item" data-view="hotels"><span class="nav-icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><path d="M9 22v-4h6v4"></path><path d="M8 6h.01"></path><path d="M16 6h.01"></path><path d="M8 10h.01"></path><path d="M16 10h.01"></path><path d="M8 14h.01"></path><path d="M16 14h.01"></path></svg></span><span class="nav-label">Hotel Search</span></button>
        <button type="button" class="nav-item" data-view="cars"><span class="nav-icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"></path><circle cx="7" cy="17" r="2"></circle><path d="M9 17h6"></path><circle cx="17" cy="17" r="2"></circle></svg></span><span class="nav-label">Car Rental</span></button>
        <button type="button" class="nav-item" data-view="services"><span class="nav-icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><path d="M12 8v8"></path><path d="M8 12h8"></path></svg></span><span class="nav-label">Trip Components</span></button>
        <button type="button" class="nav-item" data-view="packagebuilder"><span class="nav-icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"></path><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path><path d="m3.3 7 8.7 5 8.7-5"></path><path d="M12 22V12"></path></svg></span><span class="nav-label">Package Builder</span></button>
        <button type="button" class="nav-item" data-view="offer"><span class="nav-icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><line x1="10" y1="9" x2="8" y2="9"></line></svg></span><span class="nav-label">Offer Review</span></button>
        <button type="button" class="nav-item" data-view="workspace"><span class="nav-icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"></path><path d="M13 5v2"></path><path d="M13 17v2"></path><path d="M13 11v2"></path></svg></span><span class="nav-label">Create Air Booking</span></button>
        <button type="button" class="nav-item" data-view="orders"><span class="nav-icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg></span><span class="nav-label">Bookings &amp; Orders</span></button>


        <div class="nav-section">Booking File</div>
        <button type="button" class="nav-item" data-view="booking"><span class="nav-icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path></svg></span><span class="nav-label">Booking File</span></button>
        <button type="button" class="nav-item" data-view="passengers"><span class="nav-icon">
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
  </span>
  <span class="nav-label">Passengers / APIS</span>
</button>

<button type="button" class="nav-item" data-view="club">
  <span class="nav-icon">
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
    </svg>
  </span>
  <span class="nav-label">SKANDI Club</span>
</button>

<button type="button" class="nav-item" data-view="ticketing">
  <span class="nav-icon">
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"></path>
      <path d="M16 8h-8"></path>
      <path d="M16 12h-8"></path>
      <path d="M16 16h-8"></path>
    </svg>
  </span>
  <span class="nav-label">Ticketing &amp; Documents</span>
</button>

<button type="button" class="nav-item" data-view="requirements">
  <span class="nav-icon">
    <!-- Inline SVG for Travel Requirements (Check Circle) -->
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
  </span>
  <span class="nav-label">Travel Requirements</span>
</button>

<button type="button" class="nav-item" data-view="actions">
  <span class="nav-icon">
    <!-- Inline SVG for Changes / Refunds (Refresh/Rotate CCW) -->
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
      <path d="M3 3v5h5"></path>
    </svg>
  </span>
  <span class="nav-label">Changes / Refunds</span>
</button>

        <div class="nav-section">Departure &amp; Operations</div>

<button type="button" class="nav-item" data-view="departure">
  <span class="nav-icon">
    <!-- Inline SVG for Departure Control (Navigation / Arrow) -->
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
    </svg>
  </span>
  <span class="nav-label">Departure Control</span>
</button>

<button type="button" class="nav-item" data-view="baggage">
  <span class="nav-icon">
    <!-- Inline SVG for Baggage & Boarding (Briefcase / Luggage) -->
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
    </svg>
  </span>
  <span class="nav-label">Baggage &amp; Boarding</span>
</button>

<button type="button" class="nav-item" data-view="manifests">
  <span class="nav-icon">
    <!-- Inline SVG for Operations & Manifests (List / Tasks) -->
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="8" y1="6" x2="21" y2="6"></line>
      <line x1="8" y1="12" x2="21" y2="12"></line>
      <line x1="8" y1="18" x2="21" y2="18"></line>
      <line x1="3" y1="6" x2="3.01" y2="6"></line>
      <line x1="3" y1="12" x2="3.01" y2="12"></line>
      <line x1="3" y1="18" x2="3.01" y2="18"></line>
    </svg>
  </span>
  <span class="nav-label">Operations &amp; Manifests</span>
</button>

<button type="button" class="nav-item" data-view="history">
  <span class="nav-icon">
    <!-- Inline SVG for History & Audit (Clock) -->
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
  </span>
  <span class="nav-label">History &amp; Audit</span>
</button>

<button type="button" class="nav-item" data-view="reports">
  <span class="nav-icon">
    <!-- Inline SVG for Sales Reports (Pie Chart) -->
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
      <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
    </svg>
  </span>
  <span class="nav-label">Sales Reports</span>
</button>

<button type="button" class="nav-item" data-view="preferences">
  <span class="nav-icon">
    <!-- Inline SVG for Preferences (Gear / Settings) -->
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="3"></circle>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
    </svg>
  </span>
  <span class="nav-label">Preferences</span>
</button>
      </nav>
    </aside>


    <div class="workspace-tabs">
      <div class="ws-tab"><span><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg></span><span id="workspaceTabTitle">Agent Dashboard</span></div>
    </div>


    <main id="main" class="main" aria-live="polite"></main>
  </div>
  <div id="busyBar" class="busy-bar hidden" aria-hidden="true"></div>
  <div id="modalRoot" class="modal-root"></div>
  <div id="toastStack" class="toast-stack" aria-live="polite"></div>


  <script>
    "use strict";


    const CHILD_SOURCE = "SKANDI_DUFFEL_RESERVATIONS";
    const PARENT_SOURCE = "SKANDI_WIX_PARENT";
    const EXCLUSIVE_ACTIONS = new Set([
      "DUFFEL_PREPARE_PAYMENT",
      "DUFFEL_CREATE_ORDER",
      "DUFFEL_CREATE_CANCELLATION",
      "DUFFEL_CONFIRM_CANCELLATION",
      "DUFFEL_CREATE_ORDER_CHANGE",
      "DUFFEL_CONFIRM_ORDER_CHANGE",
      "ALTEA_CREATE_LOCAL_BOOKING"
    ]);


    const VIEW_TITLES = {
      dashboard: "Dashboard",
      search: "Flight Search",
      hotels: "Hotel Search",
      cars: "Car Rental",
      services: "Trip Components",
      packagebuilder: "Package Builder",
      offer: "Offer Review",
      workspace: "Create Air Booking",
      orders: "Bookings & Orders",
      booking: "Booking File",
      passengers: "Passengers / APIS",
      club: "SKANDI Club",
      ticketing: "Ticketing & Documents",
      requirements: "Travel Requirements",
      actions: "Changes / Refunds",
      departure: "Departure Control",
      baggage: "Baggage & Boarding",
      manifests: "Operations & Manifests",
      history: "History & Audit",
      reports: "Sales Reports",
      preferences: "Preferences"
    };


    const state = {
      activeView: "dashboard",
      connected: false,
      bridgeConnected: false,
      environment: null,
      busyCount: 0,
      pending: new Map(),
      offers: [],
      selectedOffer: null,
      seatMaps: [],
      selectedServices: new Map(),
      orders: [],
      alteaBookings: [],
      alteaWorkspace: null,
      inventory: [],
      requirements: [],
      changeRequestId: "",
      changeOffers: [],
      pendingChange: null,
      paymentPurpose: null,
      selectedPassengerId: "",
      bookingDocuments: [],
      documentCatalog: [],
      selectedOrder: null,
      cancellation: null,
      customerRefundRequired: false,
      search: null,
      preferences: {
        compact: true,
        currency: "USD",
        supplierTimeout: 15000
      },
      payment: null,
      stripe: null,
      stripeElements: null,
      stripePaymentElement: null,
      clubSelectedCustomerId: "",
      clubSearchLoaded: false,
      clubSearchType: "all",
      clubMembershipFilter: "all"
    };
    // --- ALTÉA FLIGHT & FARE SYNCHRONIZER ---
function syncFlightDataToBooking(targetBooking, flightSource) {
  if (!targetBooking || !flightSource) return targetBooking;

  const slices = flightSource.slices || [];
  const segments = slices.flatMap(s => s.segments || []);
  const firstSeg = segments[0] || {};
  const lastSeg = segments[segments.length - 1] || firstSeg;

  // Extract Fare Breakdown
  const baseAmount = flightSource.baseAmount != null ? Number(flightSource.baseAmount) : null;
  const taxAmount = flightSource.taxAmount != null ? Number(flightSource.taxAmount) : null;
  const totalAmount = Number(flightSource.totalAmount || targetBooking.totalAmount || 0);
  const currency = flightSource.totalCurrency || targetBooking.currency || "USD";

  // Build Comprehensive Segments Matrix
  const enrichedSegments = [];
  slices.forEach((slice, sliceIdx) => {
    (slice.segments || []).forEach((seg, segIdx) => {
      const paxDetails = (seg.passengers || []).map(p => ({
        passengerId: p.passenger_id || p.id,
        fareBasisCode: p.fare_basis_code || p.fareBasisCode || slice.fare_basis_code || slice.fareBasisCode || "—",
        cabinClass: p.cabin_class || p.cabinClass || "economy",
        cabinBrand: slice.fare_brand_name || slice.fareBrandName || humanize(p.cabin_class || "Economy"),
        baggage: Array.isArray(p.baggages) && p.baggages.length > 0 
          ? p.baggages.map(b => `${b.quantity || 1}PC (${b.type || "checked"})`).join(", ") 
          : "0PC (No checked bag)"
      }));

      enrichedSegments.push({
        segId: `${sliceIdx + 1}.${segIdx + 1}`,
        flightNumber: `${seg.marketingCarrier?.iataCode || seg.marketing_carrier?.iata_code || ""}${seg.marketingFlightNumber || seg.marketing_flight_number || ""}`,
        operatingCarrier: seg.operatingCarrier?.name || seg.operating_carrier?.name || "Operating carrier",
        origin: seg.origin?.iataCode || seg.origin?.iata_code || "",
        originTerminal: seg.originTerminal || seg.origin_terminal || "—",
        destination: seg.destination?.iataCode || seg.destination?.iata_code || "",
        destinationTerminal: seg.destinationTerminal || seg.destination_terminal || "—",
        departingAt: seg.departingAt || seg.departing_at,
        arrivingAt: seg.arrivingAt || seg.arriving_at,
        aircraft: seg.aircraft?.name || seg.aircraft?.iataCode || "Aircraft",
        duration: seg.duration || "—",
        rbd: seg.booking_class || seg.rbd || "Y",
        passengers: paxDetails
      });
    });
  });

  // Extract Conditions / Fare Rules
  const cond = flightSource.conditions || {};
  const refundRule = cond.refund_before_departure || cond.refundBeforeDeparture;
  const changeRule = cond.change_before_departure || cond.changeBeforeDeparture;

  // Embed into Booking Record
  targetBooking.origin = targetBooking.origin || firstSeg.origin?.iataCode || firstSeg.origin?.iata_code || "";
  targetBooking.destination = targetBooking.destination || lastSeg.destination?.iataCode || lastSeg.destination?.iata_code || "";
  targetBooking.departureDate = targetBooking.departureDate || (firstSeg.departingAt || "").slice(0, 10);
  
  targetBooking.flightDetails = {
    slicesCount: slices.length,
    segments: enrichedSegments,
    pricingRecord: {
      baseAmount: baseAmount != null ? baseAmount : Math.max(0, totalAmount - (taxAmount || 0)),
      taxAmount: taxAmount != null ? taxAmount : 0,
      totalAmount: totalAmount,
      currency: currency,
      fareBrand: slices[0]?.fare_brand_name || slices[0]?.fareBrandName || "Standard",
      validatingCarrier: flightSource.owner?.iataCode || flightSource.owner?.iata_code || firstSeg.marketingCarrier?.iataCode || "SK",
      paymentDeadline: flightSource.paymentRequiredBy || flightSource.expiresAt || null
    },
    miniRules: {
      refundable: refundRule?.allowed === true,
      refundPenalty: refundRule?.penalty_amount || refundRule?.penaltyAmount || null,
      changeable: changeRule?.allowed === true,
      changePenalty: changeRule?.penalty_amount || changeRule?.penaltyAmount || null
    }
  };

  return targetBooking;
}
    // --- SESSION MANAGEMENT FOR MULTIPLE TABS ---
    const SESSION_STATE_KEYS = [
      "activeView", "search", "offers", "selectedOffer", "seatMaps", "selectedServices",
      "alteaWorkspace", "selectedPassengerId", "selectedOrder", "cancellation", "customerRefundRequired",
      "changeRequestId", "changeOffers", "pendingChange", "paymentPurpose", "payment",
      "clubSelectedCustomerId", "clubSearchLoaded", "clubSearchType", "clubMembershipFilter",
      "stayResults", "stayRates", "selectedStayResult", "selectedStayRate", "stayQuote",
      "carResults", "carQuote", "selectedCarRate", "carClientKey", "carCardValid", "carThreeDSecureSessionId",
      "seatWorkbench", "hotelChildAges", "hotelAmenities", "hotelSearchDraft", "customerProfileDetail",
      "packageTransferEntityId", "_pendingTransferDetails", "carSearchDraft" // <--- ADDED HERE
    ];

    state.sessions = { "session_1": {} };
    state.activeSessionId = "session_1";

    // Initialize first session with current defaults
    SESSION_STATE_KEYS.forEach(key => state.sessions["session_1"][key] = state[key]);

    function saveCurrentSession() {
      const session = {};
      SESSION_STATE_KEYS.forEach(key => {
        if (state[key] instanceof Map) {
          session[key] = new Map(state[key]); // Clone map
        } else if (Array.isArray(state[key])) {
          session[key] = [...state[key]]; // Clone array
        } else if (state[key] !== null && typeof state[key] === 'object') {
           session[key] = { ...state[key] }; // Shallow clone objects
        } else {
          session[key] = state[key]; // Primitives
        }
      });
      state.sessions[state.activeSessionId] = session;
    }

    function loadSession(sessionId) {
      if (!state.sessions[sessionId]) return;
      saveCurrentSession(); // Save outgoing state
      state.activeSessionId = sessionId;
      const session = state.sessions[sessionId];
      
      // Load incoming state
      SESSION_STATE_KEYS.forEach(key => {
        if (session[key] !== undefined) state[key] = session[key];
      });
      
      // 1. Ensure the active view is explicitly synced
      const targetView = session.activeView || "dashboard";
      state.activeView = targetView;

      // 2. Update sidebar active class
      $$(".nav-item").forEach((item) => {
        item.classList.toggle("active", item.dataset.view === targetView);
      });
      
      // 3. Update top title and redraw tabs/content
      const titleEl = $("#workspaceTabTitle");
      if (titleEl) titleEl.textContent = VIEW_TITLES[targetView] || "Dashboard";

      renderTabs();
      render();
    }

    function createNewSession() {
      saveCurrentSession();
      const newId = "session_" + Date.now();
      
      // Initialize a fresh clean slate for the new tab
      state.sessions[newId] = {
        activeView: "dashboard", search: null, offers: [], selectedOffer: null, seatMaps: [], selectedServices: new Map(),
        alteaWorkspace: null, selectedPassengerId: "", selectedOrder: null, cancellation: null, customerRefundRequired: false,
        changeRequestId: "", changeOffers: [], pendingChange: null, paymentPurpose: null, payment: null,
        clubSelectedCustomerId: "", clubSearchLoaded: false, clubSearchType: "all", clubMembershipFilter: "all",
        stayResults: [], stayRates: [], selectedStayResult: null, selectedStayRate: null, stayQuote: null,
        carResults: [], carQuote: null, selectedCarRate: null, carClientKey: "", carCardValid: false, carThreeDSecureSessionId: "",
        seatWorkbench: {category:"seats",activePassengerId:"",selectedPassengerIds:[],activeSegmentId:"",filters:{},requestCradle:false,deck:""},
        hotelChildAges: [], hotelAmenities: {}, hotelSearchDraft: {destination:"",checkInDate:"",checkOutDate:"",rooms:1,adults:2,chainCode:"",radiusKm:25},
        customerProfileDetail: null, packageTransferEntityId: "",
        // ... (inside state.sessions[newId] = { ... })
        hotelChildAges: [], hotelAmenities: {}, hotelSearchDraft: {destination:"",checkInDate:"",checkOutDate:"",rooms:1,adults:2,chainCode:"",radiusKm:25},
        carSearchDraft: {pickup:"", dropoff:"", pickupDate:"", pickupTime:"10:00", dropoffDate:"", dropoffTime:"10:00", age:30, residence:""}, // <--- ADDED HERE
        customerProfileDetail: null, packageTransferEntityId: "", _pendingTransferDetails: null, _pendingTransferDetails: null
      };
      
      loadSession(newId);
    }

    function closeSession(sessionId, event) {
      event.stopPropagation();
      const keys = Object.keys(state.sessions);
      if (keys.length <= 1) return toast("Action Denied", "You must keep at least one tab open.", "warning");
      
      delete state.sessions[sessionId];
      
      // If we closed the active tab, load the first available one
      if (state.activeSessionId === sessionId) {
        loadSession(Object.keys(state.sessions)[0]);
      } else {
        renderTabs(); // Otherwise just redraw the tab bar
      }
    }

    function getSessionTitle(sessionObj) {
      const workspace = sessionObj.alteaWorkspace;
      const order = sessionObj.selectedOrder;
      // Extract the PNR if it exists in the session
      const pnr = workspace?.booking?.bookingReference || workspace?.booking?.pnrLocator || order?.bookingReference || order?.id;
      
      if (pnr) return pnr;
      return VIEW_TITLES[sessionObj.activeView] || "New Booking";
    }

    function renderTabs() {
      const container = document.querySelector(".workspace-tabs");
      if (!container) return;
      saveCurrentSession();
      
      let html = "";
      for (const [id, session] of Object.entries(state.sessions)) {
        const isActive = id === state.activeSessionId;
        const title = getSessionTitle(session);
        html += `<div class="ws-tab ${isActive ? "active" : ""}" data-session-id="${id}" title="${escapeHTML(title)}">
                   <span><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg></span>
                   <span class="tab-title" style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex: 1;">${escapeHTML(title)}</span>
                   <button class="ws-tab-close" data-close-session="${id}">×</button>
                 </div>`;
      }
      html += `<button class="ws-tab-add" data-add-session title="New Workspace">+</button>`;
      
      container.innerHTML = html;
      
      // Bind Events to new elements
      container.querySelectorAll(".ws-tab").forEach(tab => {
        tab.addEventListener("click", (e) => {
          if (e.target.closest(".ws-tab-close")) return;
          loadSession(tab.dataset.sessionId);
        });
      });
      container.querySelectorAll(".ws-tab-close").forEach(btn => {
        btn.addEventListener("click", (e) => closeSession(btn.dataset.closeSession, e));
      });
      container.querySelector(".ws-tab-add").addEventListener("click", createNewSession);
    }
    // --- END SESSION MANAGEMENT ---

    const main = document.getElementById("main");
    const $ = (selector, root = document) => root.querySelector(selector);
    const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));


    function makeRequestId() {
      if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
      return `req_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    }


    function masterNavigate(path) {
      const safePath = String(path || "").trim();
      if (!safePath.startsWith("/")) return;
      window.parent.postMessage({source: CHILD_SOURCE, type: "MASTER_NAVIGATE", path: safePath, payload: {path: safePath}}, "*");
    }


    function post(type, payload = {}, options = {}) {
      if (EXCLUSIVE_ACTIONS.has(type) && Array.from(state.pending.values()).includes(type)) {
        toast("Action already running", "Wait for the current request to finish.", "warning");
        return null;
      }
      const requestId = makeRequestId();
      if (options.busy !== false) {
        state.pending.set(requestId, type);
        setBusy(1);
      }
      window.parent.postMessage({
        source: CHILD_SOURCE,
        type,
        requestId,
        payload
      }, "*");
      return requestId;
    }


    function settle(requestId) {
      if (!requestId || !state.pending.has(requestId)) return;
      state.pending.delete(requestId);
      setBusy(-1);
    }


    function setBusy(delta, customText = "COMMUNICATING WITH HOST SYSTEM...") {
      state.busyCount = Math.max(0, state.busyCount + delta);
      
      const busyBar = $("#busyBar");
      const loader = $("#appLoader");
      const loaderText = $("#appLoaderText");
      
      if (busyBar) busyBar.classList.toggle("hidden", state.busyCount === 0);
      
      if (loader) {
        loader.classList.toggle("active", state.busyCount > 0);
        if (state.busyCount > 0 && loaderText) {
          // Pull action names from pending requests if available, fallback to default text
          let activeAction = Array.from(state.pending.values())[0] || customText;
          if (activeAction.includes("SEARCH")) activeAction = "QUERYING AIR AVAILABILITY / SELLING PLATFORM CONNECT...";
          else if (activeAction.includes("PAYMENT")) activeAction = "ESTABLISHING SECURE PAYMENT SESSION (PCI-DSS)...";
          else if (activeAction.includes("ORDER")) activeAction = "COMMITTING PNR TO LIVE AIRLINE INVENTORY...";
          else if (activeAction.includes("STAY") || activeAction.includes("HOTEL")) activeAction = "RETRIEVING LIVE HOTEL INVENTORY...";
          
          loaderText.textContent = activeAction;
        }
      }
    }


    function navigate(view) {
      if (!VIEW_TITLES[view]) return;
      state.activeView = view;
      
      // Save view to current session
      if (state.sessions && state.activeSessionId) {
        state.sessions[state.activeSessionId].activeView = view;
      }

      $$(".nav-item").forEach((item) => item.classList.toggle("active", item.dataset.view === view));
      
      const titleEl = $("#workspaceTabTitle");
      if (titleEl) titleEl.textContent = VIEW_TITLES[view] || "Dashboard";

      renderTabs();
      render();
    }


    function render() {
      const renderers = {
        dashboard: renderDashboard,
        search: renderSearch,
        offer: renderOffer,
        workspace: renderWorkspace,
        orders: renderOrders,
        booking: renderBookingFile,
        passengers: renderPassengers,
        services: renderServices,
        ticketing: renderTicketing,
        actions: renderActions,
        baggage: renderBaggageBoarding,
        requirements: renderRequirements,
        history: renderHistory,
        reports: renderReports,
        preferences: renderPreferences
      };
      main.innerHTML = `<section class="view">${renderers[state.activeView]()}</section>`;
      bindViewEvents();
      renderTabs(); // <--- ADD THIS LINE
      bindViewEvents();
      // Booking-document functions are surfaced through the unified Ticketing/Documents module.
    }




    function pageHead(title, subtitle, actions = "") {
      return `<div class="page-head">
        <div><h1>${escapeHTML(title)}</h1><p>${escapeHTML(subtitle)}</p></div>
        <div class="head-actions">${actions}</div>
      </div>`;
    }


    function renderDashboard() {
      const confirmed = state.orders.filter((order) => order.status === "confirmed").length;
      const cancelled = state.orders.filter((order) => order.cancelledAt || order.status === "cancelled").length;
      const total = state.orders.reduce((sum, order) => {
        if (order.totalCurrency !== state.preferences.currency) return sum;
        return sum + Number(order.totalAmount || 0);
      }, 0);
      const latest = state.orders.slice(0, 8);


      return `
        ${pageHead("ALTEA Dashboard", "One booking workspace for live Flights. Hotels & Cars, Inventory Control capacity, SKANDI Club, documents and transfer operations.",
          '<button class="secondary" data-action="refresh-all">Refresh</button><button class="primary" data-view="search">New booking</button>')}
        ${!state.bridgeConnected ? alertBox("info", "Connecting", "Waiting for the secure system bridge.") : (!state.connected ? alertBox("info", "Bridge connected", "Secure Wix bridge is online. Initializing ALTEA services…") : "")}
        <div class="grid grid-4">
          ${statCard("Supplier orders", state.orders.length, "Loaded orders")}
          ${statCard("ALTEA bookings", state.alteaBookings.length, "Internal booking files")}
          ${statCard("Cancelled", cancelled, "Cancelled in loaded result set")}
          ${statCard(`Gross (${state.preferences.currency})`, money(total, state.preferences.currency), "Same-currency orders only")}
        </div>
        <div class="dashboard-layout" style="margin-top:10px">
          <section class="panel">
            <div class="panel-head"><span>Recent orders</span><button class="link" data-view="orders">Open all</button></div>
            <div class="panel-body" style="padding:0">${orderTable(latest)}</div>
          </section>
          <section class="panel">
            <div class="panel-head">Quick actions</div>
            <div class="panel-body">
              <div class="quick-actions">
                <button class="quick-action" data-view="search"><b>Search flights</b><span class="muted">Create a live offer request.</span></button>
                <button class="quick-action" data-view="orders"><b>Retrieve booking</b><span class="muted">Search SKANDI or supplier references.</span></button>
                <button class="quick-action" data-view="passengers"><b>Passenger management</b><span class="muted">APIS, documents, seat and operational status.</span></button>
                <button class="quick-action" data-view="ticketing"><b>Ticketing & documents</b><span class="muted">Supplier-issued air documents and SKANDI forms.</span></button>
              </div>
            </div>
          </section>
        </div>`;
    }


    function renderSearch() {
      const today = new Date();
      today.setDate(today.getDate() + 1);
      const returnDate = new Date(today);
      returnDate.setDate(returnDate.getDate() + 7);
      const saved = state.search || {};


      return `
        ${pageHead("Flight Search", "Search live airline offer requests.")}
        <section class="panel">
          <div class="panel-head">Air availability</div>
          <form id="flightSearchForm" class="panel-body">
            <div class="search-form">
              <div class="field">
                <label for="tripType">Trip</label>
                <select id="tripType">
                  <option value="round_trip" ${saved.tripType === "one_way" ? "" : "selected"}>Round trip</option>
                  <option value="one_way" ${saved.tripType === "one_way" ? "selected" : ""}>One way</option>
                </select>
              </div>
              <div class="field">
                <label for="origin">From (IATA)</label>
                <input id="origin" maxlength="3" autocomplete="off" placeholder="JFK" value="${escapeAttr(saved.origin || "")}" required>
              </div>
              <button class="secondary" type="button" data-action="swap-airports" aria-label="Swap airports"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m16 3 4 4-4 4"></path><path d="M20 7H4"></path><path d="m8 21-4-4 4-4"></path><path d="M4 17h16"></path></svg></button>
              <div class="field">
                <label for="destination">To (IATA)</label>
                <input id="destination" maxlength="3" autocomplete="off" placeholder="CPH" value="${escapeAttr(saved.destination || "")}" required>
              </div>
              <div class="field">
                <label for="departureDate">Depart</label>
                <input id="departureDate" type="date" min="${isoDate(new Date())}" value="${saved.departureDate || isoDate(today)}" required>
              </div>
              <div class="field" id="returnDateField">
                <label for="returnDate">Return</label>
                <input id="returnDate" type="date" min="${isoDate(today)}" value="${saved.returnDate || isoDate(returnDate)}">
              </div>
              <button class="primary" type="submit">Search flights</button>
            </div>
            <div class="search-options">
              <div class="field">
                <label for="adults">Adults</label>
                <select id="adults">${numberOptions(1, 9, Number(saved.adults || 1))}</select>
              </div>
              <div class="field">
                <label for="childAges">Child ages (2–17)</label>
                <input id="childAges" autocomplete="off" placeholder="8, 14" value="${escapeAttr((saved.childAges || []).join(", "))}">
              </div>
              <div class="field">
                <label for="infantAges">Infant ages (0–1)</label>
                <input id="infantAges" autocomplete="off" placeholder="0" value="${escapeAttr((saved.infantAges || []).join(", "))}">
              </div>
              <div class="field">
                <label for="cabinClass">Cabin</label>
                <select id="cabinClass">
                  ${option("economy", "Economy", saved.cabinClass || "economy")}
                  ${option("premium_economy", "Premium economy", saved.cabinClass)}
                  ${option("business", "Business", saved.cabinClass)}
                  ${option("first", "First", saved.cabinClass)}
                </select>
              </div>
              <div class="field">
                <label for="maxConnections">Connections per slice</label>
                <select id="maxConnections">
                  ${option("0", "Direct only", String(saved.maxConnections ?? 1))}
                  ${option("1", "Up to 1", String(saved.maxConnections ?? 1))}
                  ${option("2", "Up to 2", String(saved.maxConnections ?? 1))}
                  ${option("2", "Up to 3", String(saved.maxConnections ?? 1))}
                </select>
              </div>
              <div class="field">
              <label for="currency">Display currency</label><select id="currency" class="input">
              <option value="SEK" ${state.preferences.currency === 'SEK' ? 'selected' : ''}>SEK - Swedish Krona (Sweden)</option>
              <option value="USD" ${state.preferences.currency === 'USD' ? 'selected' : ''}>USD - US Dollar (United States)</option>
              <option value="EUR" ${state.preferences.currency === 'EUR' ? 'selected' : ''}>EUR - Euro (Eurozone)</option>
              <option value="DKK" ${state.preferences.currency === 'DKK' ? 'selected' : ''}>DKK - Danish Krone (Denmark)</option>
              <option value="NOK" ${state.preferences.currency === 'NOK' ? 'selected' : ''}>NOK - Norwegian Krone (Norway)</option>
              </select>
              </div>
            </div>
          </form>
        </section>
        <div style="margin-top:10px">
          ${state.offers.length ? renderOfferResults() : emptyState("✈", "No live offers loaded", "Run a search to load current offers.")}
        </div>`;
    }


    function renderOfferResults() {
      // Group offers by flight schedule (Origin -> Destination & Departure Time)
      const groupedOffers = {};
      state.offers.forEach(offer => {
        const firstSeg = offer.slices?.[0]?.segments?.[0];
        const key = `${firstSeg?.origin?.iataCode}-${firstSeg?.destination?.iataCode}-${firstSeg?.departingAt}`;
        if (!groupedOffers[key]) groupedOffers[key] = [];
        groupedOffers[key].push(offer);
      });

      const flightGroups = Object.values(groupedOffers);

      return `<div class="offer-layout">
        <section>
          <div class="panel-head">
            <span>${flightGroups.length} flight option(s) · ${state.offers.length} total fares</span>
            <span class="muted">Grouped by schedule</span>
          </div>
          <div style="margin-top:8px">
            ${flightGroups.map(group => renderNestedFlightGroup(group)).join("")}
          </div>
        </section>
        <aside class="panel sticky">
          <div class="panel-head">Booking sequence</div>
          <div class="panel-body">
            ${stepLine(true, "1", "Search returned live offers")}
            ${stepLine(false, "2", "Refresh selected offer")}
            ${stepLine(false, "3", "Add traveler details and services")}
            ${stepLine(false, "4", "Secure payment")}
            ${stepLine(false, "5", "Create order")}
          </div>
        </aside>
      </div>`;
    }

    function renderNestedFlightGroup(groupOffers) {
      const baseOffer = groupOffers[0];
      const carrierNames = unique(
        baseOffer.slices.flatMap((slice) =>
          slice.segments.map((segment) => segment.operatingCarrier?.name || segment.operating_carrier?.name).filter(Boolean)
        )
      );
      const aircraftNames = unique(
        baseOffer.slices.flatMap((slice) =>
          slice.segments.map((segment) => segment.aircraft?.name || segment.aircraft?.iata_code || segment.aircraft?.iataCode).filter(Boolean)
        )
      );

      const carrierCode = baseOffer.owner?.iata_code || baseOffer.owner?.iataCode || baseOffer.slices?.[0]?.segments?.[0]?.marketingCarrier?.iataCode || "";
      const logoUrl = baseOffer.owner?.logo_symbol_url || baseOffer.owner?.logo_lockup_url || (carrierCode ? `https://images.kiwi.com/airlines/64/${carrierCode}.png` : "");
      const logoMarkup = logoUrl ? `<img src="${escapeAttr(logoUrl)}" alt="" style="height: 20px; object-fit: contain; margin-bottom: 3px;">` : "";

      const slicesMarkup = baseOffer.slices.map((slice, idx) => {
        const first = slice.segments[0];
        const last = slice.segments[slice.segments.length - 1];
        return `<div class="offer-slice">
          <strong>Slice ${idx + 1}: ${escapeHTML(slice.origin?.iataCode || first?.origin?.iataCode || "—")} → ${escapeHTML(slice.destination?.iataCode || last?.destination?.iataCode || "—")}</strong>
          <span class="muted"> · ${formatDateTime(first?.departingAt)} – ${formatDateTime(last?.arrivingAt)} · ${slice.segments.length - 1} stop(s)</span>
        </div>`;
      }).join("");

      // Nested Fare / Brand Rows underneath the flight header
      const fareRows = groupOffers.map(offer => {
        const brand = offer.slices?.[0]?.fareBrandName || offer.slices?.[0]?.fare_brand_name || "Standard";
        const cabin = humanize(offer.slices?.[0]?.segments?.[0]?.passengers?.[0]?.cabinClassMarketingName || "Economy");
        return `<div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; border-bottom: 1px solid #e0e5e8; background: #fafbfc;">
          <div>
            <span class="badge info" style="margin-right: 8px;">${escapeHTML(cabin)}</span>
            <strong>${escapeHTML(brand)}</strong>
            <span class="muted" style="margin-left: 8px; font-size: 10px;">${expiryLabel(offer.expiresAt)}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 12px;">
            <strong style="color: #173f5c; font-size: 15px;">${money(offer.totalAmount, offer.totalCurrency)}</strong>
            <button class="primary" data-action="select-offer" data-offer-id="${escapeAttr(offer.id)}" style="min-height: 24px; font-size: 10px; padding: 0 10px;">Select Fare</button>
          </div>
        </div>`;
      }).join("");

      return `<article class="offer-row" style="margin-bottom: 12px;">
        <div style="padding: 10px; background: #f5f7f8; border-bottom: 1px solid var(--line); display: flex; align-items: center; gap: 10px;">
          ${logoMarkup}
          <div style="flex: 1;">${slicesMarkup}</div>
        </div>
        <div>${fareRows}</div>
        <div class="carrier-disclosure" style="font-size: 9px; padding: 5px 10px;">
          <strong>Operated by:</strong> ${escapeHTML(carrierNames.join(", ") || "Carrier pending")} — <strong>Aircraft:</strong> ${escapeHTML(aircraftNames.join(", ") || "Aircraft pending")}
        </div>
      </article>`;
    }

    function offerCard(offer) {
      // Extract unique operating carriers & carrier code
      const carrierCode = offer.owner?.iata_code || offer.owner?.iataCode || offer.slices?.[0]?.segments?.[0]?.marketingCarrier?.iataCode || "";
      const carrierNames = unique(
        offer.slices.flatMap((slice) =>
          slice.segments.map((segment) => segment.operatingCarrier?.name || segment.operating_carrier?.name).filter(Boolean)
        )
      );

      // Extract unique aircraft names/codes
      const aircraftNames = unique(
        offer.slices.flatMap((slice) =>
          slice.segments.map((segment) => segment.aircraft?.name || segment.aircraft?.iata_code || segment.aircraft?.iataCode).filter(Boolean)
        )
      );

      // Robust Multi-Source Logo URL (Duffel native -> Public IATA CDN fallback)
      const logoUrl = offer.owner?.logo_symbol_url || offer.owner?.logo_lockup_url || (carrierCode ? `https://images.kiwi.com/airlines/64/${carrierCode}.png` : "");
      const logoMarkup = logoUrl 
        ? `<img src="${escapeAttr(logoUrl)}" alt="${escapeAttr(offer.owner?.name || carrierCode || 'Airline')}" style="height: 24px; max-width: 60px; object-fit: contain; margin-bottom: 4px; display: block;" onerror="this.style.display='none'">` 
        : "";

      const slices = offer.slices.map((slice) => {
        const first = slice.segments[0];
        const last = slice.segments[slice.segments.length - 1];
        
        const fareBrand = slice.fareBrandName || slice.fare_brand_name;
        const cabinClassRaw = first?.passengers?.[0]?.cabinClassMarketingName || first?.passengers?.[0]?.cabinClass || first?.passengers?.[0]?.cabin_class;
        const cabinClass = cabinClassRaw ? humanize(cabinClassRaw) : "Economy";
        const fareDisplay = [cabinClass, fareBrand].filter(Boolean).join(" · ");

        return `<div class="offer-slice">
          <div style="margin-bottom: 3px; display: flex; align-items: center; gap: 8px;">
            <strong>${escapeHTML(slice.origin?.iataCode || first?.origin?.iataCode || "—")} → ${escapeHTML(slice.destination?.iataCode || last?.destination?.iataCode || "—")}</strong>
            <span class="badge info">${escapeHTML(fareDisplay)}</span>
          </div>
          <span class="muted">${formatDateTime(first?.departingAt)} – ${formatDateTime(last?.arrivingAt)} · ${slice.segments.length - 1} stop${slice.segments.length - 1 === 1 ? "" : "s"}</span>
        </div>`;
      }).join("");

      return `<article class="offer-row">
        <div class="offer-summary">
          <div class="offer-price">
            ${logoMarkup}
            <strong>${money(offer.totalAmount, offer.totalCurrency)}</strong>
            <span class="muted">Total offer</span>
          </div>
          <div class="offer-route">${slices}</div>
          <div class="offer-action">
            <span class="badge ${expiryClass(offer.expiresAt)}">${expiryLabel(offer.expiresAt)}</span>
            <button class="primary" data-action="select-offer" data-offer-id="${escapeAttr(offer.id)}">Review &amp; refresh</button>
          </div>
        </div>
        <div class="carrier-disclosure">
          <strong>Operated by:</strong> ${escapeHTML(carrierNames.join(", ") || "Operating carrier pending")}
          — <strong>Aircraft:</strong> ${escapeHTML(aircraftNames.join(", ") || "Aircraft pending")}
        </div>
      </article>`;
    }

    function renderOffer() {
      const offer = state.selectedOffer;
      if (!offer) {
        return `${pageHead("Offer Review", "A selected offer is refreshed here before checkout.")}
          ${emptyState("▤", "No offer selected", "Search for flights and choose an offer to review.")}`;
      }
      return `
        ${pageHead("Offer Review", "This price was refreshed before traveler details or payment.",
          '<button class="secondary" data-action="refresh-selected-offer">Refresh price</button><button class="primary" data-view="workspace">Continue to order</button>')}
        ${offer.isExpired ? alertBox("danger", "Offer expired", "Return to flight search and choose a current offer.") : ""}
        <div class="workspace-layout">
          <div>
            ${itineraryMarkup(offer)}
            <section class="panel" style="margin-top:10px">
              <div class="panel-head">Available baggage and services</div>
              <div class="panel-body" style="padding:0">${serviceListMarkup(offer.availableServices || [])}</div>
            </section>
            <section class="panel" style="margin-top:10px">
              <div class="panel-head"><span>Seat maps</span><button class="link" data-action="load-seat-maps">Refresh seat maps</button></div>
              <div class="panel-body">${seatMapMarkup()}</div>
            </section>
          </div>
          <aside class="panel sticky">
            <div class="panel-head">Current price</div>
            <div class="panel-body">
              <div class="money-line"><span>Offer</span><strong>${money(offer.totalAmount, offer.totalCurrency)}</strong></div>
              <div class="money-line"><span>Selected services</span><strong>${money(selectedServiceTotal(), offer.totalCurrency)}</strong></div>
              <div class="money-line"><span>Total due</span><strong class="price-total">${money(orderTotal(), offer.totalCurrency)}</strong></div>
              <div class="money-line"><span>Expires</span><strong>${formatDateTime(offer.expiresAt)}</strong></div>
              <div class="money-line"><span>Payment</span><strong>${offer.requiresInstantPayment ? "Instant required" : "Instant or hold"}</strong></div>
            </div>
            <div class="panel-foot"><button class="primary" data-view="workspace" ${offer.isExpired ? "disabled" : ""}>Continue</button></div>
          </aside>
        </div>`;
    }


    function itineraryMarkup(offer) {
      return (offer.slices || []).map((slice, index) => {
        const segments = (slice.segments || []).map((segment) => `
          <div class="segment">
            <div><strong>${escapeHTML(segment.marketingCarrier?.iataCode || "")} ${escapeHTML(segment.marketingFlightNumber || "")}</strong><br><span class="muted">Operated by ${escapeHTML(segment.operatingCarrier?.name || "carrier pending")}</span></div>
            <div><span class="time">${timeOnly(segment.departingAt)}</span><br>${escapeHTML(segment.origin?.iataCode || "—")}<br><span class="muted">${formatShortDate(segment.departingAt)}</span></div>
            <div><span class="time">${timeOnly(segment.arrivingAt)}</span><br>${escapeHTML(segment.destination?.iataCode || "—")}<br><span class="muted">${formatShortDate(segment.arrivingAt)}</span></div>
            <div><strong>${escapeHTML(segment.duration || slice.duration || "—")}</strong><br><span class="muted">${escapeHTML(segment.aircraft?.name || "")}</span></div>
          </div>`).join("");
        return `<section class="slice-card">
          <div class="slice-head"><span>Slice ${index + 1}: ${escapeHTML(slice.origin?.iataCode || "—")} → ${escapeHTML(slice.destination?.iataCode || "—")}</span><span>${escapeHTML(slice.duration || "")}</span></div>
          ${segments}
        </section>`;
      }).join("");
    }


    function serviceListMarkup(services) {
      if (!services.length) return emptyState("＋", "No extra services returned", "The airline did not return bookable baggage or other services for this offer.");
      return services.map((service) => {
        const selected = state.selectedServices.has(service.id);
        return `<div class="service-row">
          <div><strong>${escapeHTML(service.label || service.type || "Service")}</strong><br><span class="muted">${escapeHTML(service.passengerName || service.passengerId || "")}${service.segmentLabel ? ` · ${escapeHTML(service.segmentLabel)}` : ""}</span></div>
          <strong>${money(service.totalAmount, service.totalCurrency)}</strong>
          <button class="${selected ? "secondary" : "primary"}" data-action="toggle-service" data-service-id="${escapeAttr(service.id)}">${selected ? "Remove" : "Add"}</button>
        </div>`;
      }).join("");
    }


    function seatMapMarkup() {
      const seats = state.seatMaps.flatMap((map) => map.seats || []);
      if (!state.seatMaps.length) return `<div class="muted">Seat maps load after a refreshed offer is selected.</div>`;
      if (!seats.length) return emptyState("▦", "No paid seat services returned", "The airline did not expose selectable seats for this offer.");
      return `<div class="seat-grid">${seats.map((seat) => {
        const service = seat.availableServices?.[0];
        const selected = service && state.selectedServices.has(service.id);
        const label = `${seat.designator || "Seat"}${service ? ` · ${money(service.totalAmount, service.totalCurrency)}` : ""}`;
        return `<button class="seat ${selected ? "selected" : ""}" data-action="toggle-seat" data-service-id="${escapeAttr(service?.id || "")}" ${service ? "" : "disabled"} title="${escapeAttr(seat.cabinName || "")}">${escapeHTML(label)}</button>`;
      }).join("")}</div>`;
    }


    function renderWorkspace() {
      const offer = state.selectedOffer;
      if (!offer) {
        return `${pageHead("Order Workspace", "Traveler details, payment, and order creation.")}
          ${emptyState("◫", "No refreshed offer", "Select and refresh a live offer before creating an order.")}`;
      }
      const passengers = offer.passengers || [];
      return `
        ${pageHead("Order Workspace", "Complete traveler details exactly as shown on travel documents.")}
        ${offer.isExpired ? alertBox("danger", "Offer expired", "Do not collect payment. Return to search and refresh a current offer.") : ""}
        <form id="orderForm" class="workspace-layout">
          <div>
            ${passengers.map((passenger, index) => passengerForm(passenger, index)).join("")}
            <section class="panel">
              <div class="panel-head">Order type and payment</div>
              <div class="panel-body">
                <div class="grid grid-2">
                  <div class="field">
                    <label for="orderType">Order type</label>
                    <select id="orderType">
                      <option value="instant">Instant purchase</option>
                      <option value="hold" ${offer.requiresInstantPayment ? "disabled" : ""}>Hold (only when the offer permits)</option>
                    </select>
                  </div>
                  <div class="field">
                    <label for="orderRemarks">Internal reference (optional)</label>
                    <input id="orderRemarks" maxlength="100" autocomplete="off" placeholder="SKANDI booking reference">
                  </div>
                </div>
                <div id="paymentArea">
                  <div class="alert info">
                    <span>ℹ</span>
                    <div><strong>Secure payment</strong>Prepare payment to open Stripe's hosted Payment Element. Card data never enters the ALTEA workspace or SKANDI system bridge.</div>
                  </div>
                  <button type="button" class="secondary" data-action="prepare-payment" ${offer.isExpired ? "disabled" : ""}>Prepare secure payment</button>
                  <div id="paymentStatus" class="muted" style="margin-top:8px">${state.payment?.paymentIntentId ? `Payment reference: ${escapeHTML(state.payment.paymentIntentId)}` : "No payment prepared."}</div>
                </div>
              </div>
            </section>
          </div>
          <aside class="panel sticky">
            <div class="panel-head">Order summary</div>
            <div class="panel-body">
              <div class="money-line"><span>Offer</span><strong>${money(offer.totalAmount, offer.totalCurrency)}</strong></div>
              <div class="money-line"><span>Services</span><strong>${money(selectedServiceTotal(), offer.totalCurrency)}</strong></div>
              <div class="money-line"><span>Total</span><strong class="price-total">${money(orderTotal(), offer.totalCurrency)}</strong></div>
              <div class="money-line"><span>Travelers</span><strong>${passengers.length}</strong></div>
              <div class="money-line"><span>Offer expires</span><strong>${formatDateTime(offer.expiresAt)}</strong></div>
            </div>
            <div class="panel-foot"><button class="primary" type="submit" ${offer.isExpired ? "disabled" : ""}>Create order</button></div>
          </aside>
        </form>`;
    }


    function passengerForm(passenger, index) {
      const kind = passenger.type || (passenger.age != null ? `Age ${passenger.age}` : "Traveler");
      const identityFields = state.selectedOffer?.identityDocumentRequired ? `
        <div class="grid grid-3">
          <div class="field">
            <label>Passport number</label>
            <input data-field="passport_number" autocomplete="off" maxlength="50" required>
          </div>
          <div class="field">
            <label>Issuing country (ISO 2)</label>
            <input data-field="passport_country" autocomplete="off" maxlength="2" placeholder="US" required>
          </div>
          <div class="field">
            <label>Passport expiry</label>
            <input data-field="passport_expiry" type="date" min="${isoDate(new Date(Date.now() + 86400000))}" required>
          </div>
        </div>` : "";
      return `<section class="passenger-card" data-passenger-id="${escapeAttr(passenger.id)}">
        <div class="panel-head"><span>Traveler ${index + 1}</span><span class="badge info">${escapeHTML(kind)}</span></div>
        <div class="panel-body">
          <div class="grid grid-4">
            <div class="field">
              <label>Title</label>
              <select data-field="title" required>
                <option value="">Select</option><option>mr</option><option>ms</option><option>mrs</option><option>miss</option><option>dr</option>
              </select>
            </div>
            <div class="field">
              <label>Given name</label>
              <input data-field="given_name" autocomplete="given-name" maxlength="70" required>
            </div>
            <div class="field">
              <label>Family name</label>
              <input data-field="family_name" autocomplete="family-name" maxlength="70" required>
            </div>
            <div class="field">
              <label>Date of birth</label>
              <input data-field="born_on" type="date" max="${isoDate(new Date())}" required>
            </div>
            <div class="field">
              <label>Gender</label>
              <select data-field="gender" required><option value="">Select</option><option value="m">Male</option><option value="f">Female</option></select>
            </div>
            <div class="field">
              <label>Email</label>
              <input data-field="email" type="email" autocomplete="email" maxlength="254" required>
            </div>
            <div class="field span-2">
              <label>Phone number (E.164)</label>
              <input data-field="phone_number" type="tel" autocomplete="tel" placeholder="+12125550123" maxlength="20" required>
            </div>
          </div>
          ${identityFields}
        </div>
      </section>`;
    }


    function renderOrders() {
      return `
        ${pageHead("Bookings & Orders", "Search the SKANDI ALTEA booking ledger, create a SKANDI file, or open a live order.",
          '<button class="primary" data-action="new-local-booking">New SKANDI booking</button><button class="secondary" data-action="refresh-all">Refresh all</button>')}
        <section class="panel" style="margin-bottom:10px">
          <div class="panel-head">ALTEA booking search</div>
          <div class="toolbar">
            <input id="alteaBookingSearch" style="height:28px;min-width:300px;flex:1" placeholder="Booking reference, PNR, supplier order, passenger or route">
            <button class="primary" data-action="search-altea-bookings">Search</button>
          </div>
          <div id="alteaBookingsTable">${alteaBookingTable(state.alteaBookings)}</div>
        </section>
        <section class="panel">
          <div class="panel-head">Live orders</div>
          <div class="toolbar">
            <label class="sr-only" for="ordersFilter">Filter supplier orders</label>
            <input id="ordersFilter" style="height:28px;min-width:260px" placeholder="Filter loaded orders">
            <span class="muted">${state.orders.length} loaded</span>
          </div>
          <div id="ordersTable">${orderTable(state.orders)}</div>
        </section>`;
    }


    function alteaBookingTable(bookings) {
      if (!bookings.length) return emptyState("▧", "No ALTEA bookings loaded", "Create a booking or search the internal booking ledger.");
      return `<table class="data-table"><thead><tr><th>SKANDI / PNR</th><th>Supplier</th><th>Route</th><th>Travel</th><th>Total</th><th>Status</th><th>Ticketing</th></tr></thead><tbody>
        ${bookings.map(b=>`<tr>
          <td><button class="link mono" data-action="open-altea-booking" data-booking-id="${escapeAttr(b.id)}">${escapeHTML(b.bookingReference || b.pnrLocator || b.id)}</button><br><small class="muted">${escapeHTML(b.supplierBookingReference || "")}</small></td>
          <td>${escapeHTML(b.supplier || "SKANDI")}<br><small class="mono muted">${escapeHTML(shortId(b.supplierOrderId || ""))}</small></td>
          <td>${escapeHTML([b.origin,b.destination].filter(Boolean).join(" → ") || "—")}</td>
          <td>${escapeHTML(b.departureDate || "—")}${b.returnDate?`<br><small>${escapeHTML(b.returnDate)}</small>`:""}</td>
          <td>${money(b.totalAmount,b.currency)}</td>
          <td><span class="badge ${statusClass(b.status)}">${escapeHTML(b.status||"unknown")}</span></td>
          <td><span class="badge ${statusClass(b.ticketingStatus)}">${escapeHTML(b.ticketingStatus||"pending")}</span></td>
        </tr>`).join("")}
      </tbody></table>`;
    }


    function orderTable(orders) {
      if (!orders.length) return emptyState(`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>`, "No live orders loaded", "Refresh orders or retrieve a specific order-ID.");
      return `<table class="data-table">
        <thead><tr><th>Booking reference</th><th>Order-ID</th><th>Route</th><th>Travelers</th><th>Total</th><th>Status</th><th>Created</th></tr></thead>
        <tbody>${orders.map((order) => `<tr>
          <td><button class="link mono" data-action="open-order" data-order-id="${escapeAttr(order.id)}">${escapeHTML(order.bookingReference || "Pending")}</button></td>
          <td class="mono">${escapeHTML(shortId(order.id))}</td>
          <td>${escapeHTML(order.route || "—")}</td>
          <td>${Number(order.passengerCount || 0)}</td>
          <td class="nowrap">${money(order.totalAmount, order.totalCurrency)}</td>
          <td><span class="badge ${statusClass(order.status)}">${escapeHTML(order.status || "unknown")}</span></td>
          <td class="nowrap">${formatDateTime(order.createdAt)}</td>
        </tr>`).join("")}</tbody>
      </table>`;
    }


    function renderActions() {
      const order = state.selectedOrder;
      if (!order) {
        return `${pageHead("Changes / Refunds", "Supplier servicing is available depending on agreements.")}
          ${emptyState("↻", "No supplier order selected", "Open a booking from Bookings & Orders.")}`;
      }
      const actions = order.availableActions || [];
      const canCancel = actions.includes("cancel") || actions.includes("cancel_order");
      const canChange = actions.includes("change");
      const changeAmount = Number(state.pendingChange?.changeTotalAmount || 0);
      return `
        ${pageHead("Changes / Refunds", `Order ${order.bookingReference || order.id}`,
          '<button class="secondary" data-action="refresh-current-order">Refresh order</button>')}
        ${state.customerRefundRequired ? alertBox("warning", "Customer refund reconciliation required", "The airline has returned value to SKANDI. Reconcile the customer payment separately according to SKANDI policy.") : ""}
        <div class="workspace-layout">
          <div>
            ${orderConfirmationMarkup(order)}
            <section class="panel" style="margin-top:10px">
              <div class="panel-head"><span>Flight change / reissue</span><span class="badge ${canChange?"success":"neutral"}">${canChange?"AVAILABLE":"UNAVAILABLE"}</span></div>
              <div class="panel-body">
                ${!canChange ? alertBox("warning", "Change unavailable", "System does not currently report the change action for this airline order.") : changeSearchMarkup(order)}
                ${canChange && state.changeOffers.length ? changeOffersMarkup(state.changeOffers) : ""}
                ${state.pendingChange ? pendingChangeMarkup(state.pendingChange) : ""}
              </div>
            </section>
            <section class="panel" style="margin-top:10px">
              <div class="panel-head">Cancellation / refund quote</div>
              <div class="panel-body">
                ${!canCancel ? alertBox("warning", "Cancellation unavailable", "System does not currently report a cancel action for this order.") : ""}
                ${state.cancellation ? cancellationMarkup(state.cancellation) : '<p class="muted">Create a cancellation quote to inspect the airline refund before confirming.</p>'}
              </div>
              <div class="panel-foot">
                ${state.cancellation
                  ? `<button class="danger-btn" data-action="confirm-cancellation">Confirm cancellation</button>`
                  : `<button class="secondary" data-action="quote-cancellation" ${canCancel ? "" : "disabled"}>Quote cancellation</button>`}
              </div>
            </section>
          </div>
          <aside class="panel sticky">
            <div class="panel-head">Supplier-authorized actions</div>
            <div class="panel-body">${actions.length
              ? actions.map((action) => `<div class="money-line"><span>${escapeHTML(humanize(action))}</span><span class="badge info">ALTEA</span></div>`).join("")
              : '<span class="muted">No servicing actions returned by the airline.</span>'}
              <div class="alert info" style="margin:10px 0 0"><span>ℹ</span><div><strong>No simulated ATC</strong>ALTEA only executes changes, cancellations and refunds when the live supplier exposes them.</div></div>
            </div>
          </aside>
        </div>`;
    }


    function changeSearchMarkup(order){
      const slices=order.slices||[];
      const first=slices[0]||{};
      return `<div class="alert info"><span>↻</span><div><strong>Live airline repricing</strong>Choose the existing flight slice to replace. System sends the request back to the original airline and returns real change offers, penalties and fare differences.</div></div>
        <div class="grid grid-4">
          <div class="field"><label>Replace slice</label><select id="changeSlice">${slices.map((slice,index)=>`<option value="${escapeAttr(slice.id||"")}">${escapeHTML(changeSliceLabel(slice,index))}</option>`).join("")}</select></div>
          <div class="field"><label>New origin</label><input id="changeOrigin" maxlength="3" value="${escapeAttr(first.origin?.iataCode||"")}"></div>
          <div class="field"><label>New destination</label><input id="changeDestination" maxlength="3" value="${escapeAttr(first.destination?.iataCode||"")}"></div>
          <div class="field"><label>New departure date</label><input id="changeDate" type="date" min="${isoDate(new Date())}" value="${escapeAttr((first.segments?.[0]?.departingAt||"").slice(0,10))}"></div>
        </div>
        <div class="grid grid-2"><div class="field"><label>Cabin</label><select id="changeCabin"><option value="economy">Economy</option><option value="premium_economy">Premium Economy</option><option value="business">Business</option><option value="first">First</option></select></div><div style="display:flex;align-items:end;padding-bottom:10px"><button class="primary" data-action="search-order-changes">Search change options</button></div></div>`;
    }


    function changeSliceLabel(slice,index){
      return `Slice ${index+1} · ${slice.origin?.iataCode||"—"} → ${slice.destination?.iataCode||"—"} · ${(slice.segments?.[0]?.departingAt||"").slice(0,10)||"date"}`;
    }


    function changeOffersMarkup(offers){
      return `<div style="margin-top:12px"><div class="strong" style="margin-bottom:6px">Live change offers</div>${offers.map(offer=>{
        const added=offer.slices?.add?.[0];
        const carriers=unique((added?.segments||[]).map(s=>s.operatingCarrier?.name).filter(Boolean));
        const route=added?`${added.origin?.iataCode||added.segments?.[0]?.origin?.iataCode||"—"} → ${added.destination?.iataCode||added.segments?.[Math.max((added.segments?.length||1)-1,0)]?.destination?.iataCode||"—"}`:"Replacement flight";
        return `<div class="offer-row"><div class="offer-summary"><div class="offer-price"><span class="muted">Change total</span><strong>${money(offer.changeTotalAmount,offer.changeTotalCurrency)}</strong><small>Penalty ${money(offer.penaltyTotalAmount||0,offer.penaltyTotalCurrency||offer.changeTotalCurrency)}</small></div><div class="offer-route"><div class="strong">${escapeHTML(route)}</div><div>${escapeHTML(carriers.join(", ")||"Operating carrier returned by airline")}</div><small>${formatDateTime(added?.segments?.[0]?.departingAt||"")} · expires ${formatDateTime(offer.expiresAt)}</small></div><div class="offer-action"><button class="primary" data-action="select-change-offer" data-change-offer-id="${escapeAttr(offer.id)}">Select change</button></div></div></div>`;
      }).join("")}</div>`;
    }


    function pendingChangeMarkup(change){
      const amount=Number(change.changeTotalAmount||0);
      const paymentReady=state.paymentPurpose==="change" && state.payment?.paymentIntentId && state.payment?.status==="succeeded";
      return `<div class="panel" style="margin-top:12px;box-shadow:none"><div class="panel-head">Pending airline change · final review</div><div class="panel-body">
        ${alertBox(amount<0?"warning":"info", amount<0?"Airline refund due":"Airline change ready", amount<0?"Confirming this change returns value through the supplier flow. SKANDI must separately reconcile the customer payment.":"System requires the final current amount shown below before the flight is changed.")}
        <div class="money-line"><span>Change ID</span><strong class="mono">${escapeHTML(change.id||"")}</strong></div>
        <div class="money-line"><span>Fare difference / refund</span><strong>${money(change.changeTotalAmount,change.changeTotalCurrency)}</strong></div>
        <div class="money-line"><span>Airline penalty</span><strong>${money(change.penaltyTotalAmount||0,change.penaltyTotalCurrency||change.changeTotalCurrency)}</strong></div>
        <div class="money-line"><span>New order total</span><strong>${money(change.newTotalAmount||0,change.newTotalCurrency||change.changeTotalCurrency)}</strong></div>
        <div class="money-line"><span>Price expires</span><strong>${formatDateTime(change.expiresAt)}</strong></div>
      </div><div class="panel-foot">
        ${amount>0 && !paymentReady?`<button class="primary" data-action="prepare-change-payment">Pay ${escapeHTML(money(change.changeTotalAmount,change.changeTotalCurrency))}</button>`:""}
        ${amount<=0 || paymentReady?`<button class="${amount<0?"secondary":"primary"}" data-action="confirm-order-change">Confirm airline change</button>`:""}
      </div></div>`;
    }


    function cancellationMarkup(cancellation) {
      return `${alertBox("warning", "Review before confirmation", "Confirming this quote cancels the order. This cannot be undone from this screen.")}
        <div class="money-line"><span>Quote ID</span><strong class="mono">${escapeHTML(cancellation.id)}</strong></div>
        <div class="money-line"><span>Refund from airline</span><strong>${money(cancellation.refundAmount, cancellation.refundCurrency)}</strong></div>
        <div class="money-line"><span>Expires</span><strong>${formatDateTime(cancellation.expiresAt)}</strong></div>`;
    }


    function orderConfirmationMarkup(order) {
      const carrierNames = unique(order.slices?.flatMap((slice) => slice.segments?.map((segment) => segment.operatingCarrier?.name).filter(Boolean)) || []);
      return `<section class="panel">
        <div class="panel-head"><span>Order confirmation</span><span class="badge ${statusClass(order.status)}">${escapeHTML(order.status || "unknown")}</span></div>
        <div class="panel-body">
          <div class="grid grid-3">
            <div><span class="muted">Booking reference</span><div class="price-total mono">${escapeHTML(order.bookingReference || "Pending")}</div></div>
            <div><span class="muted">Order ID</span><div class="strong mono" style="margin-top:6px">${escapeHTML(order.id)}</div></div>
            <div><span class="muted">Total</span><div class="price-total">${money(order.totalAmount, order.totalCurrency)}</div></div>
          </div>
          <div class="alert info" style="margin-top:10px;margin-bottom:0"><span>✈</span><div><strong>Operating carriers</strong>${escapeHTML(carrierNames.join(", ") || "Carrier disclosure pending")}</div></div>
        </div>
      </section>
      <section class="panel" style="margin-top:10px">
        <div class="panel-head">Documents</div>
        <div class="panel-body" style="padding:0">${documentTable(order.documents || [])}</div>
      </section>`;
    }


    function documentTable(documents) {
      if (!documents.length) return emptyState("▧", "No documents returned", "Documents appear when the airline issues them.");
      return `<table class="data-table"><thead><tr><th>Type</th><th>Number</th><th>Status</th></tr></thead><tbody>
        ${documents.map((document) => `<tr><td>${escapeHTML(document.type || "document")}</td><td class="mono">${escapeHTML(document.uniqueIdentifier || document.id || "—")}</td><td><span class="badge success">ISSUED</span></td></tr>`).join("")}
      </tbody></table>`;
    }


    function activeWorkspace() {
      return state.alteaWorkspace;
    }


    function renderBookingFile() {
      const w=activeWorkspace();
      if(!w?.booking) return `${pageHead("Booking File","Unified SKANDI booking file backed by the internal ALTEA ledger.")}${emptyState("▣","No booking selected","Open a booking from Bookings & Orders or create a new order.")}`;
      const b=w.booking;
      return `${pageHead("Booking File",`${b.bookingReference||b.pnrLocator||b.id} · ${b.supplier||"SKANDI"}`,
        '<button class="secondary" data-action="refresh-booking-file">Refresh</button>')}
        <div class="grid grid-4">
          ${statCard("Booking",b.bookingReference||b.pnrLocator||"—","SKANDI / supplier reference")}
          ${statCard("Route",[b.origin,b.destination].filter(Boolean).join(" → ")||"—",b.departureDate||"Travel date pending")}
          ${statCard("Passengers",w.passengers?.length||0,"Linked ALTEA passenger records")}
          ${statCard("Ticketing",humanize(b.ticketingStatus||"pending"),`${w.documents?.length||0} document(s) stored`)}
        </div>
        <div class="workspace-layout" style="margin-top:10px">
          <div>
            <section class="panel"><div class="panel-head">Booking summary</div><div class="panel-body">
              <div class="grid grid-3">
                <div><span class="muted">Supplier</span><div class="strong">${escapeHTML(b.supplier||"SKANDI")}</div></div>
                <div><span class="muted">Supplier order</span><div class="mono strong">${escapeHTML(b.supplierOrderId||"—")}</div></div>
                <div><span class="muted">Supplier booking reference</span><div class="mono strong">${escapeHTML(b.supplierBookingReference||"—")}</div></div>
                <div><span class="muted">Status</span><div><span class="badge ${statusClass(b.status)}">${escapeHTML(b.status||"—")}</span></div></div>
                <div><span class="muted">Payment</span><div>${escapeHTML(b.paymentStatus||"—")}</div></div>
                <div><span class="muted">Fulfillment</span><div>${escapeHTML(b.fulfillmentStatus||"—")}</div></div>
                <div><span class="muted">Customer</span><div>${escapeHTML(b.customerName||"—")}</div></div>
                <div><span class="muted">Email</span><div>${escapeHTML(b.customerEmail||"—")}</div></div>
                <div><span class="muted">Total</span><div class="strong">${money(b.totalAmount,b.currency)}</div></div>
              </div>
            </div></section>
            <section class="panel" style="margin-top:10px"><div class="panel-head">Passengers</div><div class="panel-body" style="padding:0">${passengerTable(w.passengers||[])}</div></section>
          </div>
          <aside class="panel sticky"><div class="panel-head">Continue working</div><div class="panel-body action-stack">
           <button class="primary" data-action="checkout-skandi-balance">Checkout / Settle Balance</button>
            <button class="secondary" data-view="passengers">Passengers / APIS</button>
            <button class="secondary" data-view="services">Seats & Services</button>
            <button class="secondary" data-view="ticketing">Ticketing & Documents</button>
            <button class="secondary" data-view="actions">Changes / Refunds</button>
            <button class="secondary" data-view="history">History & Audit</button>
          </div></aside>
        </div>`;
    }


    function passengerTable(passengers){
      if(!passengers.length) return '<div class="empty">No passenger records are linked to this booking yet.</div>';
      return `<table class="data-table"><thead><tr><th>Passenger</th><th>Type</th><th>APIS</th><th>Document</th><th>Seat</th><th>Airline check-in</th></tr></thead><tbody>
        ${passengers.map(p=>`<tr><td><button class="link" data-action="select-passenger" data-passenger-id="${escapeAttr(p.id)}">${escapeHTML(p.displayName||[p.firstName,p.lastName].filter(Boolean).join(" ")||p.passengerRef||"Passenger")}</button><br><small class="mono muted">${escapeHTML(p.supplierPassengerId||p.passengerRef||"")}</small></td><td>${escapeHTML(p.paxType||"ADT")}</td><td><span class="badge ${statusClass(p.apisStatus)}">${escapeHTML(p.apisStatus||"not started")}</span></td><td><span class="badge ${statusClass(p.documentStatus)}">${escapeHTML(p.documentStatus||"not checked")}</span></td><td class="mono">${escapeHTML(p.seatNumber||"—")}</td><td>${escapeHTML(p.checkinStatus||"not checked in")}</td></tr>`).join("")}
      </tbody></table>`;
    }


    function renderPassengers(){
      const w=activeWorkspace();
      if(!w?.booking) return `${pageHead("Passengers / APIS","Manage SKANDI passenger records without pretending to be the operating airline DCS.")}${emptyState("♙","No booking selected","Select a booking first.")}`;
      const passengers=w.passengers||[];
      const selected=passengers.find(p=>p.id===state.selectedPassengerId)||passengers[0]||null;
      if(selected) state.selectedPassengerId=selected.id;
      const canAddLocal=String(w.booking.supplier||"SKANDI").toUpperCase()==="SKANDI";
      return `${pageHead("Passengers / APIS",`${w.booking.bookingReference||w.booking.pnrLocator} · ${passengers.length} passenger(s)`,canAddLocal?'<button class="primary" data-action="add-local-passenger">Add passenger</button>':'')}
        <div class="alert info"><span>ℹ</span><div><strong>Agency passenger management</strong>APIS/document readiness is managed in SKANDI. Airline check-in remains controlled by the operating carrier unless an authorized DCS integration supplies that status.</div></div>
        <div class="workspace-layout"><section class="panel"><div class="panel-head">Passenger list</div><div class="panel-body" style="padding:0">${passengerTable(passengers)}</div></section>
        <aside class="panel sticky"><div class="panel-head">Selected passenger</div><div class="panel-body">${selected?passengerEditor(selected):'<span class="muted">No passenger selected.</span>'}</div></aside></div>`;
    }


    function passengerEditor(p){
      return `<form id="passengerOpsForm" data-passenger-id="${escapeAttr(p.id)}">
        <div class="grid grid-2"><div class="field"><label>First name</label><input id="paxFirst" value="${escapeAttr(p.firstName||"")}"></div><div class="field"><label>Last name</label><input id="paxLast" value="${escapeAttr(p.lastName||"")}"></div></div>
        <div class="grid grid-2"><div class="field"><label>Nationality</label><input id="paxNationality" maxlength="3" value="${escapeAttr(p.nationality||"")}"></div><div class="field"><label>Passport</label><input readonly value="${p.passportLast4?`•••• ${escapeAttr(p.passportLast4)}`:"Not stored/displayed"}"></div></div>
        <div class="field"><label>APIS status</label><select id="paxApis">${["not_started","captured","complete","needs_review"].map(v=>option(v,humanize(v),p.apisStatus)).join("")}</select></div>
        <div class="field"><label>Document status</label><select id="paxDoc">${["not_checked","pending_check","verified","needs_review","rejected"].map(v=>option(v,humanize(v),p.documentStatus)).join("")}</select></div>
        <div class="grid grid-2"><div class="field"><label>Seat</label><input id="paxSeat" maxlength="10" value="${escapeAttr(p.seatNumber||"")}"></div><div class="field"><label>Sequence</label><input id="paxSeq" maxlength="20" value="${escapeAttr(p.sequenceNumber||"")}"></div></div>
        <div class="field"><label>Airline check-in status</label><select id="paxCheckin">${["not_checked_in","carrier_managed","checked_in","boarded","no_show"].map(v=>option(v,humanize(v),p.checkinStatus)).join("")}</select></div>
        <div class="field"><label>Operational note</label><textarea id="paxNote">${escapeHTML(p.payload?.operationalNote||"")}</textarea></div>
        <button class="primary" type="submit">Save passenger</button>
      </form>`;
    }


    function renderServices(){
      const order=state.selectedOrder,w=activeWorkspace();
      const components=(w?.components||[]).filter(c=>c.status!=="REMOVED");
      return `${pageHead("Seats & Services","System controls airline seats/baggage, live hotel stays and car rentals; SKANDI Inventory Control supplies transfers, tours, activities, partner tickets, packages and local ancillaries.",
        !w?.booking?'<button class="primary" data-action="new-local-booking">New SKANDI booking</button>':'')}
        <div class="alert info"><span>ℹ</span><div><strong>One booking file</strong>Air services remain supplier-controlled. SKANDI products are attached to the same internal booking file as separate components so staff can manage the whole journey without inventing airline records.</div></div>
        ${w?.booking?`<section class="panel"><div class="panel-head"><span>Selected SKANDI booking components</span><span>${components.length} active</span></div><div class="panel-body" style="padding:0">${componentTable(components)}</div></section>`:''}
        <section class="panel" style="margin-top:10px"><div class="panel-head"><span>SKANDI Inventory Control catalog</span><span class="muted">Published · staff visible</span></div><div class="panel-body" style="padding:0">${inventoryCatalogMarkup()}</div></section>
        ${state.selectedOffer?`<section class="panel" style="margin-top:10px"><div class="panel-head">Current airline services</div><div class="panel-body" style="padding:0">${serviceListMarkup(state.selectedOffer.availableServices||[])}</div></section>
          <section class="panel" style="margin-top:10px"><div class="panel-head"><span>Live seat maps</span><button class="link" data-action="load-seat-maps">Refresh</button></div><div class="panel-body">${seatMapMarkup()}</div></section>`:''}
        ${!state.selectedOffer&&order?`<section class="panel" style="margin-top:10px"><div class="panel-head">Airline services</div><div class="panel-body"><p class="muted">The confirmed order is attached to this booking. New paid seat/baggage services are only shown when the supplier exposes a supported servicing path.</p></div></section>`:''}
        ${w?.passengers?.length?`<section class="panel" style="margin-top:10px"><div class="panel-head">Recorded passenger seating</div><div class="panel-body" style="padding:0">${passengerTable(w.passengers)}</div></section>`:''}`;
    }


    function componentTable(items){
      if(!items.length)return '<div class="empty">No SKANDI journey components selected.</div>';
      return `<table class="data-table"><thead><tr><th>Type</th><th>Service</th><th>Supplier</th><th>Qty</th><th>Amount</th><th>Status</th><th></th></tr></thead><tbody>${items.map(c=>`<tr><td>${escapeHTML(humanize(c.componentType))}</td><td><strong>${escapeHTML(c.title)}</strong><br><small class="mono muted">${escapeHTML(c.supplierReference||"")}</small></td><td>${escapeHTML(c.supplier||"SKANDI")}</td><td>${c.quantity}</td><td>${money(c.totalAmount,c.currency)}</td><td><select class="component-status-select" data-component-id="${escapeAttr(c.id)}"><option ${c.status==="SELECTED"?"selected":""}>SELECTED</option><option ${c.status==="REQUESTED"?"selected":""}>REQUESTED</option><option ${c.status==="CONFIRMED"?"selected":""}>CONFIRMED</option><option ${c.status==="CANCELLED"?"selected":""}>CANCELLED</option></select></td><td><button class="link" data-action="remove-component" data-component-id="${escapeAttr(c.id)}">Remove</button></td></tr>`).join("")}</tbody></table>`;
    }


    function inventoryCatalogMarkup(){
      const items=state.inventory||[];
      if(!items.length)return '<div class="empty">No published SKANDI hotel, transfer, tour, car, package or ancillary inventory is currently available.</div>';
      return `<table class="data-table"><thead><tr><th>Type</th><th>Product</th><th>Destination</th><th>Price</th><th></th></tr></thead><tbody>${items.map(i=>`<tr><td>${escapeHTML(humanize(i.entityType))}</td><td><strong>${escapeHTML(i.name)}</strong><br><small class="mono muted">${escapeHTML(i.publicId||i.code||"")}</small></td><td>${escapeHTML(i.city||i.category||"—")}</td><td>${i.publicPrice?money(i.publicPrice,i.currency):'<span class="muted">Price / request rules apply</span>'}</td><td><button class="primary" data-action="add-inventory-component" data-entity-id="${escapeAttr(i.id)}" ${activeWorkspace()?.booking?"":"disabled"}>Add to booking</button></td></tr>`).join("")}</tbody></table>`;
    }


    function renderTicketing(){
      const w=activeWorkspace(),order=state.selectedOrder;
      if(!w?.booking&&!order) return `${pageHead("Ticketing & Documents","Supplier-issued air documents and SKANDI-controlled booking documents in one place.")}${emptyState("▥","No booking selected","Open a booking or supplier order first.")}`;
      const supplierDocs=order?.documents||[];
      const internalDocs=w?.documents||[];
      return `${pageHead("Ticketing & Documents",w?.booking?.bookingReference||order?.bookingReference||"Current order")}
        <div class="alert info"><span>ℹ</span><div><strong>Document authority</strong>Electronic ticket/airline document identifiers shown here come from the supplier. ALTEA does not generate fake airline ticket or EMD numbers.</div></div>
        <div class="grid grid-2">
          <section class="panel"><div class="panel-head">Airline documents</div><div class="panel-body" style="padding:0">${documentTable(supplierDocs)}</div></section>
          <section class="panel"><div class="panel-head">ALTEA document register</div><div class="panel-body" style="padding:0">${internalDocumentTable(internalDocs)}</div></section>
        </div>
        <section class="panel" style="margin-top:10px"><div class="panel-head">SKANDI controlled forms</div><div class="panel-body"><p class="muted">Booking-linked forms, waivers and customer document packets continue through DocuNet and appear in the Orders view when assigned.</p><button class="secondary" data-view="orders">Open booking documents</button></div></section>`;
    }


    function internalDocumentTable(docs){
      if(!docs.length) return '<div class="empty">No internal booking documents recorded.</div>';
      return `<table class="data-table"><thead><tr><th>Provider</th><th>Type</th><th>Number</th><th>Status</th><th></th></tr></thead><tbody>${docs.map(d=>`<tr><td>${escapeHTML(d.provider||"SKANDI")}</td><td>${escapeHTML(d.documentType||"DOCUMENT")}</td><td class="mono">${escapeHTML(d.documentNumber||"—")}</td><td><span class="badge ${statusClass(d.status)}">${escapeHTML(d.status||"—")}</span></td><td><button class="link" data-action="view-generated-document" data-document-id="${escapeAttr(d.id)}">View / Print</button></td></tr>`).join("")}</tbody></table>`;
    }


    function renderBaggageBoarding(){
      const w=activeWorkspace();
      return `${pageHead("Baggage & Boarding","SKANDI operational assistance around airline-controlled baggage and boarding processes.")}
        <div class="alert warning"><span>⚠</span><div><strong>Operating carrier controls DCS</strong>SKANDI can record baggage/seat/document readiness and produce internal assistance paperwork. A real airline bag tag or boarding pass must come from an authorized airline/DCS source.</div></div>
        ${w?.passengers?.length?`<section class="panel"><div class="panel-head">Passenger operational status</div><div class="panel-body" style="padding:0">${passengerTable(w.passengers)}</div></section>`:emptyState("▰","No booking selected","Open a booking to work with its passenger operational status.")}
        <div class="grid grid-2" style="margin-top:10px"><section class="panel"><div class="panel-head">Baggage</div><div class="panel-body"><p class="muted">Paid baggage is selected from available services during offer/booking. Recorded service IDs stay linked to the ALTEA booking file.</p><button class="secondary" data-view="services">Open seats & services</button></div></section><section class="panel"><div class="panel-head">Boarding documents</div><div class="panel-body"><p class="muted">Use airline-issued boarding documents where supplied. SKANDI sample layouts are not valid travel documents and are not automatically issued from this workspace.</p></div></section></div>`;
    }


    function renderRequirements(){
      return `${pageHead("Travel Requirements","Internal SKANDI requirements guidance. Live Timatic is not connected to this workspace.")}
        <div class="alert warning"><span>⚠</span><div><strong>Not a live Timatic decision</strong>The uploaded Timatic interface was a training simulator. These records are SKANDI content only and must not be represented as a live IATA/Timatic boarding decision.</div></div>
        <div class="grid grid-2">${(state.requirements||[]).map(r=>`<section class="panel"><div class="panel-head"><span>${escapeHTML(r.title||"Travel requirement")}</span><span class="badge info">${escapeHTML(r.category||"GUIDANCE")}</span></div><div class="panel-body">${escapeHTML(r.body||"").replace(/\n/g,"<br>")}</div></section>`).join("")||emptyState("✓","No active requirements","No active SKANDI travel requirement records are currently published internally.")}</div>`;
    }


    function renderHistory(){
      const w=activeWorkspace(),items=w?.history||[];
      return `${pageHead("History & Audit",w?.booking?`Booking ${w.booking.bookingReference||w.booking.id}`:"Select a booking to view its operational history.")}
        ${w?.booking?`<section class="panel" style="margin-bottom:10px"><div class="panel-head">Add agent note</div><form id="historyNoteForm" class="panel-body"><div class="field"><label>Operational note</label><textarea id="historyNote" required></textarea></div><button class="primary" type="submit">Add history note</button></form></section>`:''}
        <section class="panel"><div class="panel-head">Booking history</div><div class="panel-body" style="padding:0">${historyTable(items)}</div></section>`;
    }


    function historyTable(items){
      if(!items.length) return '<div class="empty">No history entries for the selected booking.</div>';
      return `<table class="data-table"><thead><tr><th>Time</th><th>Event</th><th>Supplier</th><th>Command</th><th>Detail</th></tr></thead><tbody>${items.map(h=>`<tr><td class="nowrap">${formatDateTime(h.createdAt)}</td><td><strong>${escapeHTML(h.eventType||"EVENT")}</strong></td><td>${escapeHTML(h.supplier||"—")}</td><td class="mono">${escapeHTML(h.command||"—")}</td><td>${escapeHTML(h.payload?.note||h.payload?.orderStatus||h.payload?.status||"")}</td></tr>`).join("")}</tbody></table>`;
    }


    function renderProfiles() {
      return `
        ${pageHead("Traveler Profiles", "Traveler details are deliberately not stored in the browser.")}
        <div class="alert info">
          <span>ℹ</span>
          <div><strong>Production privacy control</strong>Names, birth dates, contact details, and identity data are collected only inside the active order workspace and sent through the authenticated system bridge. Enable reusable profiles only through the controlled customer-profile service.</div>
        </div>
        <section class="panel">
          <div class="panel-head">Profile status</div>
          <div class="empty"><div class="big">♙</div><strong>No browser-stored profiles</strong><br><span>Reusable profiles stay disabled until a consented server-side profile store is connected.</span></div>
        </section>`;
    }


    function renderReports() {
      const currencies = {};
      state.orders.forEach((order) => {
        const currency = order.totalCurrency || "UNKNOWN";
        currencies[currency] = (currencies[currency] || 0) + Number(order.totalAmount || 0);
      });
      return `
        ${pageHead("Sales Reports", "A live summary of the currently loaded order result set.",
          '<button class="secondary" data-action="export-orders">Export loaded CSV</button>')}
        <div class="grid grid-3">
          ${Object.entries(currencies).map(([currency, amount]) => statCard(`Gross ${currency}`, money(amount, currency), "Loaded orders")).join("") || statCard("Gross sales", "—", "Load orders to calculate")}
          ${statCard("Order count", state.orders.length, "Loaded result set")}
          ${statCard("Passengers", state.orders.reduce((sum, order) => sum + Number(order.passengerCount || 0), 0), "Across loaded orders")}
        </div>
        <section class="panel" style="margin-top:10px"><div class="panel-head">Order detail</div><div class="panel-body" style="padding:0">${orderTable(state.orders)}</div></section>`;
    }


    function renderPreferences() {
      return `
        ${pageHead("Preferences", "Interface preferences apply to this open session only.")}
        <div class="grid grid-2">
          <section class="panel">
            <div class="panel-head">Display</div>
            <div class="panel-body">
              <label class="check" style="margin-bottom:10px"><input id="prefCompact" type="checkbox" ${state.preferences.compact ? "checked" : ""}> Use compact data tables</label>
              <div class="field"><label for="prefCurrency">Default currency</label><input id="prefCurrency" maxlength="3" value="${escapeAttr(state.preferences.currency)}"></div>
              <button class="primary" data-action="save-preferences">Save for this session</button>
            </div>
          </section>
          <section class="panel">
            <div class="panel-head">Integration</div>
            <div class="panel-body">
              <div class="money-line"><span>Air provider</span><strong>Flights</strong></div>
              <div class="money-line"><span>Internal ledger</span><strong>ALTEA operational ledger</strong></div>
              <div class="money-line"><span>Environment</span><strong>${escapeHTML(state.environment || "Pending handshake")}</strong></div>
              <div class="money-line"><span>Authentication</span><strong>RIA INTRA staff session</strong></div>
              <div class="money-line"><span>Browser credentials</span><strong>None</strong></div>
            </div>
          </section>
        </div>`;
    }


    function bindViewEvents() {
      $$("[data-view]", main).forEach((button) => button.addEventListener("click", () => navigate(button.dataset.view)));
      $$("[data-action]", main).forEach(bindAction);


      const searchForm = $("#flightSearchForm");
      if (searchForm) {
        searchForm.addEventListener("submit", submitSearch);
        $("#tripType").addEventListener("change", updateTripType);
        ["#origin", "#destination", "#currency"].forEach((selector) => {
          $(selector).addEventListener("input", (event) => { event.target.value = event.target.value.toUpperCase().replace(/[^A-Z]/g, ""); });
        });
        updateTripType();
      }


      const orderForm = $("#orderForm");
      if (orderForm) {
        orderForm.addEventListener("submit", submitOrder);
        $("#orderType").addEventListener("change", updatePaymentVisibility);
        updatePaymentVisibility();
      }


      const ordersFilter = $("#ordersFilter");
      if (ordersFilter) {
        ordersFilter.addEventListener("input", () => {
          const query = ordersFilter.value.trim().toLowerCase();
          const filtered = state.orders.filter((order) => JSON.stringify(order).toLowerCase().includes(query));
          $("#ordersTable").innerHTML = orderTable(filtered);
          $$("[data-action]", $("#ordersTable")).forEach(bindAction);
        });
      }
      const passengerOpsForm = $("#passengerOpsForm");
      if (passengerOpsForm) passengerOpsForm.addEventListener("submit", savePassengerOps);
      const historyNoteForm = $("#historyNoteForm");
      if (historyNoteForm) historyNoteForm.addEventListener("submit", addHistoryNote);
      $$(".doc-status-select", main).forEach(select=>select.addEventListener("change",()=>post("ALTEA_UPDATE_DOCUMENT_STATUS",{documentId:select.dataset.documentId,status:select.value})));
      $$(".component-status-select", main).forEach(select=>select.addEventListener("change",()=>post("ALTEA_UPDATE_COMPONENT",{componentId:select.dataset.componentId,status:select.value})));
      const changeSlice=$("#changeSlice");
      if(changeSlice)changeSlice.addEventListener("change",()=>fillChangeRouteFromSlice(changeSlice.value));
    }


    function bindAction(element) {
      element.addEventListener("click", async () => {
        const action = element.dataset.action;
        if (action === "refresh-orders") loadOrders();
        if (action === "refresh-all") { loadOrders(); post("ALTEA_UNIFIED_BOOTSTRAP",{}, {busy:false}); }
        if (action === "search-altea-bookings") post("ALTEA_SEARCH_BOOKINGS",{query:$("#alteaBookingSearch")?.value||"",limit:100});
        if (action === "open-altea-booking") post("ALTEA_GET_BOOKING",{bookingId:element.dataset.bookingId});
        if (action === "refresh-booking-file" && state.alteaWorkspace?.booking?.id) post("ALTEA_GET_BOOKING",{bookingId:state.alteaWorkspace.booking.id});
        if (action === "select-passenger") { state.selectedPassengerId=element.dataset.passengerId||""; navigate("passengers"); }
        
        // Ensure element exists before calling focus
        if (action === "focus-order-search") {
          const searchBox = $("#globalOrderSearch");
          if (searchBox) searchBox.focus();
        }
        
        if (action === "swap-airports") swapAirports();
        if (action === "select-offer") selectOffer(element.dataset.offerId);
        if (action === "refresh-selected-offer") refreshSelectedOffer();
        if (action === "load-seat-maps") loadSeatMaps();
        if (action === "toggle-service") toggleService(element.dataset.serviceId);
        if (action === "toggle-seat") toggleSeat(element.dataset.serviceId);
        if (action === "prepare-payment") preparePayment();
        if (action === "open-order") retrieveOrder(element.dataset.orderId);
        if (action === "refresh-current-order") retrieveOrder(state.selectedOrder?.id);
        if (action === "quote-cancellation") quoteCancellation();
        if (action === "confirm-cancellation") confirmCancellation();
        if (action === "new-local-booking") openLocalBookingModal();
        if (action === "add-local-passenger") openLocalPassengerModal();
        if (action === "add-inventory-component") addInventoryComponent(element.dataset.entityId);
        if (action === "remove-component") post("ALTEA_UPDATE_COMPONENT",{componentId:element.dataset.componentId,status:"REMOVED"});
        if (action === "search-order-changes") searchOrderChanges();
        if (action === "select-change-offer") selectChangeOffer(element.dataset.changeOfferId);
        if (action === "prepare-change-payment") prepareChangePayment();
        if (action === "confirm-order-change") confirmOrderChange();
        if (action === "export-orders") exportOrders();
        if (action === "save-preferences") savePreferences();
        if (action === "view-generated-document") post("ALTEA_GET_DOCUMENT",{bookingId:booking()?.id||state.alteaWorkspace?.booking?.id||"",documentId:element.dataset.documentId});
        if (action === "open-advanced-ticketing") masterNavigate("/riaintra/success-factors/altea/ticketing");
        if (action === "open-timatic-desk") masterNavigate("/riaintra/success-factors/altea/timatic");
      });
    }


    function savePassengerOps(event){
      event.preventDefault();
      const form=event.currentTarget;
      post("ALTEA_UPDATE_PASSENGER",{
        passengerId:form.dataset.passengerId,
        patch:{
          firstName:$("#paxFirst")?.value||"",lastName:$("#paxLast")?.value||"",nationality:$("#paxNationality")?.value||"",
          apisStatus:$("#paxApis")?.value||"",documentStatus:$("#paxDoc")?.value||"",checkinStatus:$("#paxCheckin")?.value||"",
          seatNumber:$("#paxSeat")?.value||"",sequenceNumber:$("#paxSeq")?.value||"",operationalNote:$("#paxNote")?.value||""
        }
      });
    }
    function addHistoryNote(event){
      event.preventDefault();
      if(!state.alteaWorkspace?.booking?.id)return;
      post("ALTEA_ADD_HISTORY_NOTE",{bookingId:state.alteaWorkspace.booking.id,note:$("#historyNote")?.value||"",eventType:"AGENT_NOTE"});
    }


    function openLocalPassengerModal(){
      const booking=activeWorkspace()?.booking;
      if(!booking?.id)return toast("Booking file required","Create or open a SKANDI booking file first.","warning");
      if(String(booking.supplier||"").toUpperCase()!=="SKANDI")return toast("Supplier-controlled passenger list","Passengers cannot be added internally to a confirmed airline order.","warning");
      openModal("Add passenger",`
        <div class="grid grid-2"><div class="field"><label>First name</label><input id="newPaxFirst" maxlength="100" required></div><div class="field"><label>Last name</label><input id="newPaxLast" maxlength="100" required></div></div>
        <div class="grid grid-3"><div class="field"><label>Type</label><select id="newPaxType"><option>ADT</option><option>CHD</option><option>INF</option><option>YTH</option><option>SEN</option></select></div><div class="field"><label>Date of birth</label><input id="newPaxDob" type="date"></div><div class="field"><label>Nationality</label><input id="newPaxNationality" maxlength="3"></div></div>
        <div class="grid grid-2"><div class="field"><label>Email</label><input id="newPaxEmail" type="email" maxlength="254"></div><div class="field"><label>Phone</label><input id="newPaxPhone" maxlength="30"></div></div>
        <div class="field"><label>Gender</label><select id="newPaxGender"><option value="">Not specified</option><option value="M">Male</option><option value="F">Female</option><option value="X">X / unspecified</option></select></div>
        <div class="alert info"><span>ℹ</span><div><strong>Travel documents</strong>This form deliberately does not put passport numbers into general booking JSON. Secure travel-document capture remains a separate protected workflow.</div></div>`,[
          {label:"Cancel",className:"secondary",close:true},
          {label:"Add passenger",className:"primary",onClick:()=>{
            const firstName=$("#newPaxFirst")?.value.trim()||"",lastName=$("#newPaxLast")?.value.trim()||"";
            if(!firstName||!lastName)return toast("Name required","Enter the passenger first and last name.","warning");
            closeModal();
            post("ALTEA_CREATE_PASSENGER",{bookingId:booking.id,firstName,lastName,paxType:$("#newPaxType")?.value||"ADT",dateOfBirth:$("#newPaxDob")?.value||"",nationality:$("#newPaxNationality")?.value||"",email:$("#newPaxEmail")?.value||"",phone:$("#newPaxPhone")?.value||"",gender:$("#newPaxGender")?.value||""});
          }}
        ]);
    }


    function openLocalBookingModal(){
      openModal("New SKANDI booking file",`
        <div class="alert info"><span>▣</span><div><strong>Local / package booking</strong>Create the internal booking file first, then add published SKANDI inventory components. Supplier confirmations remain separate until actually confirmed.</div></div>
        <div class="field"><label>Customer name</label><input id="localCustomerName" maxlength="200"></div>
        <div class="field"><label>Customer email</label><input id="localCustomerEmail" type="email" maxlength="254"></div>
        <div class="grid grid-2"><div class="field"><label>Currency</label><input id="localCurrency" maxlength="3" value="${escapeAttr(state.preferences.currency||"USD")}"></div><div></div></div>
        <div class="field"><label>Internal notes</label><textarea id="localBookingNotes"></textarea></div>`,[
          {label:"Cancel",className:"secondary",close:true},
          {label:"Create booking file",className:"primary",onClick:()=>{
            const currency=String($("#localCurrency")?.value||"USD").toUpperCase();
            if(!/^[A-Z]{3}$/.test(currency))return toast("Invalid currency","Use a three-letter currency code.","warning");
            closeModal();
            post("ALTEA_CREATE_LOCAL_BOOKING",{customerName:$("#localCustomerName")?.value||"",customerEmail:$("#localCustomerEmail")?.value||"",currency,notes:$("#localBookingNotes")?.value||""});
          }}
        ]);
    }


    function addInventoryComponent(entityId){
      const bookingId=activeWorkspace()?.booking?.id;
      if(!bookingId)return toast("Booking file required","Create or open a SKANDI booking file first.","warning");
      const item=(state.inventory||[]).find(x=>String(x.id)===String(entityId));
      const allDated=item?.dated||[];
      const dated=allDated.filter(d=>!d.stopSale&&!d.blackout&&Number(d.available??0)>0&&["OPEN","AVAILABLE"].includes(String(d.status||"OPEN").toUpperCase()));
      if(allDated.length&&!dated.length)return toast("No sellable dated inventory","Every dated line for this product is closed, sold out, blackout or stop-sale.","warning");
      if(!allDated.length){
        post("ALTEA_ADD_INVENTORY_COMPONENT",{bookingId,entityId,quantity:1});
        return;
      }
      openModal("Add SKANDI inventory",`
        <div class="alert info"><span>▣</span><div><strong>${escapeHTML(item?.name||"Inventory product")}</strong>Select the dated inventory line so ALTEA reserves the same capacity controlled by Inventory Control.</div></div>
        <div class="field"><label>Service / variant</label><select id="invDatedLine">${dated.map(d=>`<option value="${escapeAttr(d.id||d.datedInventoryId)}">${escapeHTML(d.serviceDate||d.service_date||"")} · ${escapeHTML(d.variantName||d.variant_name||d.variantCode||d.variant_code||"Standard")} · ${escapeHTML(String(d.available??0))} available${Number(d.publicPrice||d.public_price||d.adult_price||0)>0?` · ${money(Number(d.publicPrice||d.public_price||d.adult_price||0),d.currency||item?.currency||booking()?.currency)}`:""}</option>`).join("")}</select></div>
        <div class="field"><label>Quantity</label><input id="invQty" type="number" min="1" max="99" value="1"></div>`,[
          {label:"Cancel",className:"secondary",close:true},
          {label:"Reserve & add",className:"primary",onClick:()=>{const datedInventoryId=$("#invDatedLine")?.value||"";const quantity=Math.max(1,Math.min(99,Number($("#invQty")?.value||1)));closeModal();post("ALTEA_ADD_INVENTORY_COMPONENT",{bookingId,entityId,datedInventoryId,quantity});}}
        ]);
    }


    function fillChangeRouteFromSlice(sliceId){
      const slice=state.selectedOrder?.slices?.find(s=>s.id===sliceId);
      if(!slice)return;
      if($("#changeOrigin"))$("#changeOrigin").value=slice.origin?.iataCode||"";
      if($("#changeDestination"))$("#changeDestination").value=slice.destination?.iataCode||"";
      if($("#changeDate"))$("#changeDate").value=(slice.segments?.[0]?.departingAt||"").slice(0,10);
    }


    function searchOrderChanges(){
      const order=state.selectedOrder;
      if(!order?.id)return;
      const removeSliceId=$("#changeSlice")?.value||"";
      const origin=iata($("#changeOrigin")?.value||"");
      const destination=iata($("#changeDestination")?.value||"");
      const departureDate=$("#changeDate")?.value||"";
      const cabinClass=$("#changeCabin")?.value||"economy";
      if(!removeSliceId||!origin||!destination||!departureDate)return toast("Change details required","Complete the replacement route and date.","warning");
      state.changeOffers=[];state.pendingChange=null;
      if(state.paymentPurpose==="change")invalidatePayment();
      post("DUFFEL_SEARCH_ORDER_CHANGES",{orderId:order.id,removeSliceId,addSlice:{origin,destination,departureDate,cabinClass}});
    }


    function selectChangeOffer(id){
      if(!id)return;
      state.pendingChange=null;
      if(state.paymentPurpose==="change")invalidatePayment();
      post("DUFFEL_CREATE_ORDER_CHANGE",{orderChangeOfferId:id});
    }


    function prepareChangePayment(){
      if(!state.pendingChange?.id)return;
      state.paymentPurpose="change";
      post("DUFFEL_PREPARE_CHANGE_PAYMENT",{orderChangeId:state.pendingChange.id});
    }


    function confirmOrderChange(){
      const change=state.pendingChange;
      if(!change?.id)return;
      const amount=Number(change.changeTotalAmount||0);
      const paymentIntentId=amount>0 && state.paymentPurpose==="change"?state.payment?.paymentIntentId:null;
      if(amount>0 && (!paymentIntentId||state.payment?.status!=="succeeded"))return toast("Payment required","Complete the secure change payment first.","warning");
      openModal("Confirm airline change",`${alertBox("warning","Final supplier action","This updates the live airline booking. Review the final fare difference, penalty and routing before confirming.")}<div class="money-line"><span>Change amount</span><strong>${money(change.changeTotalAmount,change.changeTotalCurrency)}</strong></div><div class="money-line"><span>Penalty</span><strong>${money(change.penaltyTotalAmount||0,change.penaltyTotalCurrency||change.changeTotalCurrency)}</strong></div>`,[
        {label:"Back",className:"secondary",close:true},
        {label:"Confirm change",className:"primary",onClick:()=>{closeModal();post("DUFFEL_CONFIRM_ORDER_CHANGE",{orderChangeId:change.id,paymentIntentId});}}
      ]);
    }


    function submitSearch(event) {
      event.preventDefault();
      if (paymentIsCommitted()) {
        return toast("Payment already completed", "Create the pending order or reconcile the completed payment before starting another search.", "warning");
      }
      const tripType = $("#tripType").value;
      const origin = iata($("#origin").value);
      const destination = iata($("#destination").value);
      const departureDate = $("#departureDate").value;
      const returnDate = $("#returnDate").value;
      const childAges = parseAges($("#childAges").value, 2, 17, "Child");
      const infantAges = parseAges($("#infantAges").value, 0, 1, "Infant");
      const adults = Number($("#adults").value);
      const currency = $("#currency").value.toUpperCase();


      if (!origin || !destination) return toast("Invalid airport", "Use valid three-letter IATA airport codes.", "warning");
      if (origin === destination) return toast("Invalid route", "Origin and destination must be different.", "warning");
      if (!departureDate || departureDate < isoDate(new Date())) return toast("Invalid departure date", "Choose today or a future date.", "warning");
      if (tripType === "round_trip" && (!returnDate || returnDate < departureDate)) return toast("Invalid return date", "Return must be on or after departure.", "warning");
      if (childAges === null || infantAges === null) return;
      if (adults + childAges.length + infantAges.length > 9) return toast("Too many travelers", "System support up to nine travelers.", "warning");
      if (infantAges.length > adults) return toast("Infant assignment required", "Use no more lap infants than adults.", "warning");
      if (!/^[A-Z]{3}$/.test(currency)) return toast("Invalid currency", "Use a three-letter ISO currency code.", "warning");


      state.preferences.currency = currency;
      state.search = {
        tripType, origin, destination, departureDate, returnDate, adults, childAges, infantAges,
        cabinClass: $("#cabinClass").value,
        maxConnections: Number($("#maxConnections").value)
      };
      state.offers = [];
      state.selectedOffer = null;
      state.seatMaps = [];
      state.selectedServices.clear();
      state.payment = null;


      const slices = [{ origin, destination, departureDate }];
      if (tripType === "round_trip") slices.push({ origin: destination, destination: origin, departureDate: returnDate });
      const passengers = [
        ...Array.from({ length: adults }, () => ({ type: "adult" })),
        ...childAges.map((age) => ({ age })),
        ...infantAges.map((age) => ({ age }))
      ];


      post("DUFFEL_SEARCH_OFFERS", {
        slices,
        passengers,
        cabinClass: state.search.cabinClass,
        maxConnections: state.search.maxConnections,
        supplierTimeout: state.preferences.supplierTimeout
      });
    }


    function updateTripType() {
      const oneWay = $("#tripType")?.value === "one_way";
      $("#returnDateField")?.classList.toggle("hidden", oneWay);
      if ($("#returnDate")) $("#returnDate").required = !oneWay;
    }


    function swapAirports() {
      const origin = $("#origin");
      const destination = $("#destination");
      [origin.value, destination.value] = [destination.value, origin.value];
    }


    function selectOffer(offerId) {
      post("DUFFEL_REFRESH_OFFER", { offerId });
    }


    function refreshSelectedOffer() {
      if (!state.selectedOffer?.id) return;
      if (paymentIsCommitted()) {
        return toast("Payment already completed", "Create the order or reconcile the completed payment before changing the offer.", "warning");
      }
      state.payment = null;
      destroyStripe();
      post("DUFFEL_REFRESH_OFFER", { offerId: state.selectedOffer.id });
    }


    function loadSeatMaps() {
      if (!state.selectedOffer?.id) return;
      post("DUFFEL_GET_SEAT_MAPS", { offerId: state.selectedOffer.id });
    }


    function toggleService(serviceId) {
      if (paymentIsCommitted()) {
        return toast("Payment already completed", "Create the order or reconcile the completed payment before changing services.", "warning");
      }
      const service = state.selectedOffer?.availableServices?.find((item) => item.id === serviceId);
      if (!service) return;
      if (state.selectedServices.has(serviceId)) state.selectedServices.delete(serviceId);
      else state.selectedServices.set(serviceId, { ...service, quantity: 1 });
      invalidatePayment();
      render();
    }


    function toggleSeat(serviceId) {
      if (paymentIsCommitted()) {
        return toast("Payment already completed", "Create the order or reconcile the completed payment before changing seats.", "warning");
      }
      if (!serviceId) return;
      const services = state.seatMaps.flatMap((map) => map.seats || []).flatMap((seat) => seat.availableServices || []);
      const service = services.find((item) => item.id === serviceId);
      if (!service) return;


      for (const [id, selected] of state.selectedServices) {
        if (selected.type === "seat" && selected.passengerId === service.passengerId && selected.segmentId === service.segmentId) {
          state.selectedServices.delete(id);
        }
      }
      if (!state.selectedServices.has(serviceId)) state.selectedServices.set(serviceId, { ...service, quantity: 1 });
      invalidatePayment();
      render();
    }


    async function preparePayment() {
      if (!state.selectedOffer) return;
      const orderType = $("#orderType")?.value || "instant";
      if (orderType === "hold") return toast("Payment not required", "A hold order is created without payment or paid services.", "info");
      const passengerError = validatePassengerForms(false);
      if (passengerError) return toast("Traveler details incomplete", passengerError, "warning");
      post("DUFFEL_PREPARE_PAYMENT", {
        offerId: state.selectedOffer.id,
        services: selectedServicePayload()
      });
    }


    async function mountStripePayment(payment) {
      if (!globalThis.Stripe) {
        return toast("Payment unavailable", "Stripe's secure payment library could not load.", "danger");
      }
      destroyStripe();
      state.payment = payment;
      state.stripe = Stripe(payment.publishableKey);
      state.stripeElements = state.stripe.elements({ clientSecret: payment.clientSecret });
      state.stripePaymentElement = state.stripeElements.create("payment", { layout: "tabs" });


      openModal("Secure payment", `
        <div class="alert info"><span>🔒</span><div><strong>Stripe secure payment</strong>SKANDI does not receive or store raw card details.</div></div>
        <div class="money-line"><span>Amount</span><strong class="price-total">${money(payment.amount, payment.currency)}</strong></div>
        <div id="stripePaymentElement" class="payment-shell" style="margin-top:10px"></div>
        <div id="stripePaymentError" class="alert danger hidden" style="margin-top:10px"></div>
      `, [
        { label: "Cancel", className: "secondary", close: true },
        { label: "Confirm payment", className: "primary", onClick: confirmStripePayment }
      ], { size: "lg", onMount: () => state.stripePaymentElement.mount("#stripePaymentElement") });
    }


    async function confirmStripePayment() {
      const button = $("[data-modal-index='1']");
      if (button) button.disabled = true;
      const result = await state.stripe.confirmPayment({
        elements: state.stripeElements,
        redirect: "if_required"
      });
      if (result.error) {
        const errorBox = $("#stripePaymentError");
        errorBox.textContent = result.error.message || "Payment could not be confirmed.";
        errorBox.classList.remove("hidden");
        if (button) button.disabled = false;
        return;
      }
      state.payment.status = result.paymentIntent?.status || "processing";
      closeModal();
      const status = $("#paymentStatus");
      if (status) status.textContent = `Payment ${state.payment.status}: ${state.payment.paymentIntentId}`;
      toast("Payment submitted", state.paymentPurpose==="change"?`Status: ${state.payment.status}. Return to Changes / Refunds to confirm the airline change.`:`Status: ${state.payment.status}. The secure booking service will verify it before booking.`, "success");
      if(state.paymentPurpose==="change" && state.activeView==="actions")render();
    }


    function submitOrder(event) {
      event.preventDefault();
      if (!state.selectedOffer || state.selectedOffer.isExpired) return toast("Offer unavailable", "Refresh or select a current offer.", "warning");
      const error = validatePassengerForms(true);
      if (error) return toast("Traveler details incomplete", error, "warning");


      const orderType = $("#orderType").value;
      if (orderType === "hold" && state.selectedServices.size) {
        return toast("Services unavailable on hold", "Remove paid seats and baggage before creating a hold order.", "warning");
      }
      if (orderType === "instant" && !state.payment?.paymentIntentId) {
        return toast("Payment required", "Prepare and confirm secure payment before creating the order.", "warning");
      }


      const passengers = $$(".passenger-card").map((card) => ({
        id: card.dataset.passengerId,
        title: value(card, "title"),
        givenName: value(card, "given_name"),
        familyName: value(card, "family_name"),
        bornOn: value(card, "born_on"),
        gender: value(card, "gender"),
        email: value(card, "email"),
        phoneNumber: value(card, "phone_number"),
        identityDocuments: value(card, "passport_number") ? [{
          type: "passport",
          uniqueIdentifier: value(card, "passport_number"),
          issuingCountryCode: value(card, "passport_country").toUpperCase(),
          expiresOn: value(card, "passport_expiry")
        }] : []
      }));


      openModal("Confirm order creation", `
        ${alertBox("warning", "Final booking action", orderType === "instant"
          ? "The secure booking service will verify payment, refresh the offer again, and create the airline order."
          : "This creates a hold order without payment. The airline's payment deadline will apply.")}
        <div class="money-line"><span>Order type</span><strong>${escapeHTML(orderType)}</strong></div>
        <div class="money-line"><span>Travelers</span><strong>${passengers.length}</strong></div>
        <div class="money-line"><span>Total</span><strong>${money(orderTotal(), state.selectedOffer.totalCurrency)}</strong></div>
      `, [
        { label: "Back", className: "secondary", close: true },
        { label: "Create order", className: "primary", onClick: () => {
          closeModal();
          post("DUFFEL_CREATE_ORDER", {
            offerId: state.selectedOffer.id,
            orderType,
            passengers,
            services: orderType === "instant" ? selectedServicePayload() : [],
            paymentIntentId: orderType === "instant" ? state.payment.paymentIntentId : null,
            internalReference: $("#orderRemarks").value.trim()
          });
        }}
      ]);
    }


    function validatePassengerForms(showNative) {
      const cards = $$(".passenger-card");
      if (!cards.length) return "No traveler records were returned for this offer.";
      for (let index = 0; index < cards.length; index += 1) {
        const card = cards[index];
        const required = $$("[required]", card);
        const invalid = required.find((input) => !input.checkValidity());
        if (invalid) {
          if (showNative) invalid.reportValidity();
          return `Complete ${invalid.closest(".field")?.querySelector("label")?.textContent || "the required field"} for traveler ${index + 1}.`;
        }
        const phone = value(card, "phone_number");
        if (!/^\+[1-9]\d{7,14}$/.test(phone)) return `Use an E.164 phone number for traveler ${index + 1}, for example +12125550123.`;
      }
      return "";
    }


    function value(card, field) {
      return card.querySelector(`[data-field="${field}"]`)?.value.trim() || "";
    }


    function updatePaymentVisibility() {
      const hold = $("#orderType")?.value === "hold";
      $("#paymentArea")?.classList.toggle("hidden", hold);
    }


    function loadOrders() {
      post("DUFFEL_LIST_ORDERS", { limit: 50 });
    }


    function retrieveOrder(orderIdOrReference) {
      const query = String(orderIdOrReference || "").trim();
      if (!query) return toast("Order reference required", "Enter order ID or booking reference.", "warning");
      post("DUFFEL_GET_ORDER", { orderIdOrReference: query });
    }


    function quoteCancellation() {
      if (!state.selectedOrder?.id) return;
      post("DUFFEL_CREATE_CANCELLATION", { orderId: state.selectedOrder.id });
    }


    function confirmCancellation() {
      if (!state.cancellation?.id) return;
      openModal("Confirm cancellation", `
        ${alertBox("danger", "This action is irreversible", `The booking order will be cancelled. Quoted airline refund: ${money(state.cancellation.refundAmount, state.cancellation.refundCurrency)}.`)}
        <label class="check"><input id="cancelAck" type="checkbox"> I reviewed the refund and want to cancel this order.</label>
      `, [
        { label: "Back", className: "secondary", close: true },
        { label: "Cancel order", className: "danger-btn", onClick: () => {
          if (!$("#cancelAck").checked) return toast("Confirmation required", "Select the confirmation checkbox.", "warning");
          closeModal();
          post("DUFFEL_CONFIRM_CANCELLATION", { cancellationId: state.cancellation.id });
        }}
      ]);
    }


    function savePreferences() {
      const currency = $("#prefCurrency").value.toUpperCase();
      if (!/^[A-Z]{3}$/.test(currency)) return toast("Invalid currency", "Use a three-letter ISO currency code.", "warning");
      state.preferences.compact = $("#prefCompact").checked;
      state.preferences.currency = currency;
      render();
      toast("Preferences saved", "Preferences apply to this open browser session.", "success");
    }


    function exportOrders() {
      if (!state.orders.length) return toast("Nothing to export", "Load orders first.", "warning");
      const columns = ["bookingReference", "id", "route", "passengerCount", "totalAmount", "totalCurrency", "status", "createdAt"];
      const rows = [columns, ...state.orders.map((order) => columns.map((column) => order[column] ?? ""))];
      const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `skandi-duffel-orders-${isoDate(new Date())}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    }


    function handleParentMessage(event) {
      if (event.source !== window.parent) return;
      const message = event.data || {};
      if (message.source !== PARENT_SOURCE) return;
      state.bridgeConnected = true;
      settle(message.requestId);
      const payload = message.payload || {};


      // Wix page code sends this after attaching html.onMessage().
      // Re-send the child startup events so iframe/page-code load order cannot lose the handshake.
      if (message.type === "DUFFEL_PARENT_READY") {
        setConnection("online", "Bridge connected");
        if (state.activeView === "dashboard") render();
        post("DUFFEL_APP_READY", { version: "R-006.3-unified", retry: true }, { busy: false });
        post("ALTEA_UNIFIED_BOOTSTRAP", { version: "R-006.3-unified", retry: true }, { busy: false });
        post("INVENTORY_SEARCH_SELLABLE", { query: "" }, { busy: false });
        post("ALTEA_ENTERPRISE_MODULE_READY", {
          version: "R-006.3-unified",
          capabilities: ["master_booking","skandi_club","package_charter","documents_vouchers","travel_requirements_adapter","transfer_departure_control","manifests"]
        }, { busy: false });
        return;
      }
        if (message.type === "DUFFEL_ORDER_CREATED" || message.type === "DUFFEL_ORDER_RESULT") {
        state.selectedOrder = payload.order;
        state.cancellation = null;
        state.customerRefundRequired = false;
        upsertOrder(payload.order);
        
        // Sync rich flight & fare data into ALTEA booking
        if (payload.alteaWorkspace?.booking) {
          state.alteaWorkspace = payload.alteaWorkspace;
          syncFlightDataToBooking(state.alteaWorkspace.booking, payload.order);
          state.selectedPassengerId = state.alteaWorkspace.passengers?.[0]?.id || "";
          upsertAlteaBooking(state.alteaWorkspace.booking);
        } else if (booking74()) {
          syncFlightDataToBooking(booking74(), payload.order);
        }
        
        navigate(payload.alteaWorkspace ? "booking" : "actions");
        return;
      }

      if (message.type === "ALTEA_BOOKING_RESULT") {
        state.alteaWorkspace = payload.workspace || null;
        state.selectedPassengerId = state.alteaWorkspace?.passengers?.[0]?.id || "";
        
        // If order context exists, enrich booking file
        if (state.alteaWorkspace?.booking && state.selectedOrder) {
          syncFlightDataToBooking(state.alteaWorkspace.booking, state.selectedOrder);
        }
        
        if (state.alteaWorkspace?.booking) upsertAlteaBooking(state.alteaWorkspace.booking);
        navigate("booking");
        return;
      }

      if (message.type === "DUFFEL_BOOTSTRAP_RESULT") {
        state.bridgeConnected = true;
        state.connected = true;
        state.environment = payload.environment || "Duffel";
        state.preferences.currency = payload.defaultCurrency || state.preferences.currency;
        setConnection("online", "System ready");
        if (Array.isArray(payload.orders)) state.orders = payload.orders;
        render();
        return;
      }
      if (message.type === "DUFFEL_OFFERS_RESULT") {
        state.offers = payload.offers || [];
        navigate("search");
        toast("Live offers loaded", `${state.offers.length} offer${state.offers.length === 1 ? "" : "s"} returned.`, "success");
        return;
      }
      if (message.type === "DUFFEL_OFFER_RESULT") {
        state.selectedOffer = payload.offer;
        state.selectedServices.clear();
        state.seatMaps = [];
        invalidatePayment();
        navigate("offer");
        if (state.selectedOffer?.id) loadSeatMaps();
        return;
      }
      if (message.type === "DUFFEL_SEAT_MAPS_RESULT") {
        state.seatMaps = payload.seatMaps || [];
        if (state.activeView === "offer") render();
        return;
      }
      if (message.type === "DUFFEL_PAYMENT_RESULT") {
        state.paymentPurpose="order";
        mountStripePayment(payload.payment);
        return;
      }
      if (message.type === "DUFFEL_ORDER_CREATED") {
        state.selectedOrder = payload.order;
        state.cancellation = null;
        state.customerRefundRequired = false;
        state.payment = null;
        state.paymentPurpose = null;
        destroyStripe();
        upsertOrder(payload.order);
        if(payload.alteaWorkspace){ state.alteaWorkspace=payload.alteaWorkspace; state.selectedPassengerId=payload.alteaWorkspace.passengers?.[0]?.id||""; upsertAlteaBooking(payload.alteaWorkspace.booking); }
        navigate(payload.alteaWorkspace?"booking":"actions");
        toast("Order created", `Booking reference ${payload.order.bookingReference || payload.order.id}.`, "success");
        return;
      }
      if (message.type === "DUFFEL_ORDERS_RESULT") {
        state.orders = payload.orders || [];
        if (state.activeView === "dashboard" || state.activeView === "orders" || state.activeView === "reports") render();
        toast("Orders refreshed", `${state.orders.length} live order${state.orders.length === 1 ? "" : "s"} loaded.`, "success");
        return;
      }
      if (message.type === "DUFFEL_ORDER_RESULT") {
        state.selectedOrder = payload.order;
        state.cancellation = null;
        state.customerRefundRequired = false;
        upsertOrder(payload.order);
        if(payload.alteaWorkspace){ state.alteaWorkspace=payload.alteaWorkspace; state.selectedPassengerId=payload.alteaWorkspace.passengers?.[0]?.id||""; upsertAlteaBooking(payload.alteaWorkspace.booking); }
        navigate(payload.alteaWorkspace?"booking":"actions");
        return;
      }
      if (message.type === "DUFFEL_CANCELLATION_QUOTED") {
        state.cancellation = payload.cancellation;
        render();
        return;
      }
      if (message.type === "DUFFEL_CANCELLATION_CONFIRMED") {
        state.cancellation = null;
        state.selectedOrder = payload.order || { ...state.selectedOrder, status: "cancelled" };
        state.customerRefundRequired = Boolean(payload.customerRefundRequired);
        upsertOrder(state.selectedOrder);
        if(payload.alteaWorkspace){ state.alteaWorkspace=payload.alteaWorkspace; upsertAlteaBooking(payload.alteaWorkspace.booking); }
        render();
        toast(
          "Order cancelled",
          state.customerRefundRequired
            ? "System confirmed cancellation. The customer payment now requires refund reconciliation."
            : "System confirmed the cancellation.",
          state.customerRefundRequired ? "warning" : "success"
        );
        return;
      }
      if (message.type === "DUFFEL_ORDER_CHANGE_OFFERS") {
        state.changeRequestId=payload.changeRequestId||"";
        state.changeOffers=payload.offers||[];
        state.pendingChange=null;
        if(state.paymentPurpose==="change")invalidatePayment();
        navigate("actions");
        toast("Change options loaded",`${state.changeOffers.length} airline change option${state.changeOffers.length===1?"":"s"} returned.`,state.changeOffers.length?"success":"warning");
        return;
      }
      if (message.type === "DUFFEL_ORDER_CHANGE_PENDING") {
        state.pendingChange=payload.change||null;
        state.changeOffers=[];
        if(state.paymentPurpose==="change")invalidatePayment();
        navigate("actions");
        return;
      }
      if (message.type === "DUFFEL_CHANGE_PAYMENT_RESULT") {
        state.pendingChange=payload.change||state.pendingChange;
        if(payload.payment){state.paymentPurpose="change";mountStripePayment(payload.payment);}else{render();}
        return;
      }
      if (message.type === "DUFFEL_ORDER_CHANGE_CONFIRMED") {
        state.selectedOrder=payload.order||state.selectedOrder;
        state.changeOffers=[];state.pendingChange=null;state.changeRequestId="";
        state.customerRefundRequired=Boolean(payload.customerRefundRequired);
        if(state.paymentPurpose==="change")invalidatePayment();
        if(state.selectedOrder)upsertOrder(state.selectedOrder);
        if(payload.alteaWorkspace){state.alteaWorkspace=payload.alteaWorkspace;upsertAlteaBooking(payload.alteaWorkspace.booking);}
        navigate("actions");
        toast("Airline change confirmed",payload.customerRefundRequired?`Customer refund reconciliation required: ${money(payload.customerRefundAmount,payload.customerRefundCurrency)}.`:"System confirmed the new flight itinerary.",payload.customerRefundRequired?"warning":"success");
        return;
      }
      if (message.type === "ALTEA_UNIFIED_BOOTSTRAP_RESULT") {
        state.bridgeConnected = true;
        state.connected = true;
        state.alteaBookings=payload.bookings||[];
        state.inventory=payload.inventory||[];
        state.requirements=payload.requirements||[];
        if(["dashboard","orders","requirements","services"].includes(state.activeView))render();
        return;
      }
      if (message.type === "INVENTORY_SEARCH_RESULT") {
        state.inventory = payload.items || [];
        if (["services","packagebuilder","dashboard"].includes(state.activeView)) render();
        return;
      }
      if (message.type === "ALTEA_BOOKINGS_RESULT") {
        state.alteaBookings=payload.bookings||[];
        if(state.activeView==="orders")render();
        return;
      }
      if (message.type === "ALTEA_BOOKING_RESULT") {
        state.alteaWorkspace=payload.workspace||null;
        state.selectedPassengerId=state.alteaWorkspace?.passengers?.[0]?.id||"";
        if(state.alteaWorkspace?.booking)upsertAlteaBooking(state.alteaWorkspace.booking);
        navigate("booking");
        return;
      }
      if (message.type === "ALTEA_LOCAL_BOOKING_CREATED") {
        state.alteaWorkspace=payload.workspace||null;
        if(payload.workspace?.booking)upsertAlteaBooking(payload.workspace.booking);
        navigate("services");
        toast("SKANDI booking created",`Booking ${payload.workspace?.booking?.bookingReference||"file"} is ready for journey components.`,"success");
        return;
      }
      if (["ALTEA_PASSENGER_UPDATED","ALTEA_PASSENGER_CREATED","ALTEA_HISTORY_UPDATED","ALTEA_DOCUMENT_UPDATED","ALTEA_COMPONENT_UPDATED"].includes(message.type)) {
        if(payload.workspace){state.alteaWorkspace=payload.workspace;if(payload.workspace.booking)upsertAlteaBooking(payload.workspace.booking);}
        render();
        toast("ALTEA updated","The internal booking file was updated.","success");
        return;
      }
      if (message.type === "ALTEA_DOCUMENT_RESULT") {
        const documentRecord=payload.document||null;
        if(documentRecord?.htmlSnapshot){
          const printWindow=window.open("","_blank","noopener,noreferrer");
          if(printWindow){
            printWindow.document.open();
            printWindow.document.write(documentRecord.htmlSnapshot);
            printWindow.document.close();
          }else{
            toast("Document blocked","Allow pop-ups to view or print this generated document.","warning");
          }
        }else{
          toast("Document unavailable","No generated HTML is stored for this document.","warning");
        }
        return;
      }
      if (message.type === "ALTEA_ERROR") {
        toast("ALTEA action failed",payload.message||"The internal booking action could not be completed.","danger");
        return;
      }
      if (message.type === "DUFFEL_PROGRESS") {
        if (payload.message) toast("Processing", payload.message, "info");
        return;
      }
      if (message.type === "DUFFEL_ERROR") {
        setConnection(state.connected ? "online" : "error", state.connected ? "Duffel ready" : "Connection error");
        if (payload.code === "AUTH_REQUIRED") setConnection("error", "Access denied");
        toast("Action failed", payload.message || "The reservation action could not be completed.", "danger");
      }
    }


    function upsertAlteaBooking(booking){
      if(!booking?.id)return;
      state.alteaBookings=[booking,...state.alteaBookings.filter(item=>item.id!==booking.id)];
    }


    function upsertOrder(order) {
      if (!order?.id) return;
      state.orders = [order, ...state.orders.filter((item) => item.id !== order.id)];
    }


    function selectedServicePayload() {
      return Array.from(state.selectedServices.values()).map((service) => ({ id: service.id, quantity: Number(service.quantity || 1) }));
    }


    function selectedServiceTotal() {
      const currency = state.selectedOffer?.totalCurrency;
      return Array.from(state.selectedServices.values()).reduce((sum, service) => {
        if (service.totalCurrency !== currency) return sum;
        return sum + Number(service.totalAmount || 0) * Number(service.quantity || 1);
      }, 0);
    }


    function orderTotal() {
      if (state.paymentPurpose === "order" && state.payment?.amount && state.payment?.currency === state.selectedOffer?.totalCurrency) {
        return Number(state.payment.amount);
      }
      return Number(state.selectedOffer?.totalAmount || 0) + selectedServiceTotal();
    }


    function paymentIsCommitted() {
      return ["succeeded", "processing", "requires_capture"].includes(state.payment?.status);
    }


    function invalidatePayment() {
      state.payment = null;
      state.paymentPurpose = null;
      destroyStripe();
    }


    function destroyStripe() {
      try { state.stripePaymentElement?.destroy(); } catch (_) {}
      state.stripe = null;
      state.stripeElements = null;
      state.stripePaymentElement = null;
    }


    function openModal(title, body, buttons = [], options = {}) {
      $("#modalRoot").innerHTML = `<div class="modal-backdrop">
        <div class="modal ${options.size || ""}" role="dialog" aria-modal="true" aria-label="${escapeAttr(title)}">
          <div class="modal-head"><span>${escapeHTML(title)}</span><button data-close-modal aria-label="Close">×</button></div>
          <div class="modal-body">${body}</div>
          <div class="modal-foot">${buttons.map((button, index) => `<button class="${button.className || "secondary"}" data-modal-index="${index}">${escapeHTML(button.label)}</button>`).join("")}</div>
        </div>
      </div>`;
      $("[data-close-modal]").addEventListener("click", closeModal);
      $(".modal-backdrop").addEventListener("click", (event) => {
        if (event.target.classList.contains("modal-backdrop")) closeModal();
      });
      buttons.forEach((button, index) => {
        $(`[data-modal-index="${index}"]`).addEventListener("click", () => button.close ? closeModal() : button.onClick?.());
      });
      options.onMount?.();
    }


    function closeModal() {
      $("#modalRoot").innerHTML = "";
    }


    function toast(title, message, type = "info") {
      const element = document.createElement("div");
      element.className = `toast ${type}`;
      const strong = document.createElement("strong");
      strong.textContent = title;
      const content = document.createElement("div");
      content.className = "muted";
      content.style.marginTop = "3px";
      content.textContent = message;
      element.append(strong, content);
      $("#toastStack").appendChild(element);
      setTimeout(() => {
        element.style.opacity = "0";
        element.style.transform = "translateX(12px)";
        setTimeout(() => element.remove(), 180);
      }, 4500);
    }


    function alertBox(type, title, message) {
      return `<div class="alert ${type}"><span>${type === "danger" ? "!" : type === "warning" ? "⚠" : "ℹ"}</span><div><strong>${escapeHTML(title)}</strong>${escapeHTML(message)}</div></div>`;
    }


    function emptyState(icon, title, message) {
        return `<div class="panel empty"><div class="big">${icon}</div><strong>${escapeHTML(title)}</strong><br><span>${escapeHTML(message)}</span></div>`;
    }


    function statCard(label, value, meta) {
      return `<div class="stat"><div class="stat-label">${escapeHTML(label)}</div><div class="stat-value">${escapeHTML(String(value))}</div><div class="stat-meta">${escapeHTML(meta)}</div></div>`;
    }


    function stepLine(done, number, label) {
      return `<div class="money-line"><span><span class="badge ${done ? "success" : "neutral"}">${escapeHTML(number)}</span> ${escapeHTML(label)}</span><strong>${done ? "✓" : ""}</strong></div>`;
    }


    function numberOptions(min, max, selected) {
      return Array.from({ length: max - min + 1 }, (_, index) => {
        const value = min + index;
        return `<option value="${value}" ${value === selected ? "selected" : ""}>${value}</option>`;
      }).join("");
    }


    function option(value, label, selected) {
      return `<option value="${escapeAttr(value)}" ${value === selected ? "selected" : ""}>${escapeHTML(label)}</option>`;
    }


    function parseAges(raw, min, max, label) {
      if (!raw.trim()) return [];
      const ages = raw.split(",").map((value) => Number(value.trim()));
      if (ages.some((age) => !Number.isInteger(age) || age < min || age > max)) {
        toast(`Invalid ${label.toLowerCase()} ages`, `${label} ages must be whole numbers from ${min} to ${max}, separated by commas.`, "warning");
        return null;
      }
      return ages;
    }


    function iata(value) {
      const code = String(value || "").trim().toUpperCase();
      return /^[A-Z]{3}$/.test(code) ? code : "";
    }


    function money(amount, currency = "USD") {
      const value = Number(amount);
      if (!Number.isFinite(value)) return "—";
      try {
        return new Intl.NumberFormat("en-US", { style: "currency", currency: currency || "USD" }).format(value);
      } catch (_) {
        return `${currency || ""} ${value.toFixed(2)}`.trim();
      }
    }


    function isoDate(date) {
      return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    }


    function formatDateTime(value) {
      if (!value) return "—";
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return String(value);
      return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(date);
    }
    
    function formatPrinterDate(dateString) {
        if (!dateString) return "";
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString; 
        // Fallback if invalid
        const day = String(date.getDate()).padStart(2, '0');
        const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
        const month = months[date.getMonth()];
        return `${day}${month}`; // Example: "15NOV"
        }


    function formatShortDate(value) {
      if (!value) return "—";
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return String(value);
      return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
    }


    function timeOnly(value) {
      if (!value) return "—";
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return "—";
      return new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit" }).format(date);
    }
    function formatBoardingNumber(seqString) {
  if (!seqString) return "";
  const num = parseInt(seqString, 10);
  return isNaN(num) ? seqString : String(num);
}

    function expiryLabel(value) {
      if (!value) return "Expiry unknown";
      const diff = new Date(value).getTime() - Date.now();
      if (diff <= 0) return "Expired";
      return `Expires in ${Math.max(1, Math.floor(diff / 60000))}m`;
    }


    function expiryClass(value) {
      if (!value) return "warning";
      return new Date(value).getTime() <= Date.now() ? "danger" : "warning";
    }


    function statusClass(status) {
      const normalized = String(status || "").toLowerCase();
      if (normalized.includes("cancel") || normalized.includes("fail")) return "danger";
      if (normalized.includes("confirm") || normalized.includes("active")) return "success";
      if (normalized.includes("hold") || normalized.includes("pending")) return "warning";
      return "neutral";
    }


    function shortId(value) {
      const text = String(value || "");
      return text.length > 22 ? `${text.slice(0, 11)}…${text.slice(-7)}` : text;
    }


    function humanize(value) {
      return String(value || "").replace(/[_-]+/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
    }


    function unique(values) {
      return [...new Set(values)];
    }


    function csvCell(value) {
      const text = String(value ?? "");
      return `"${text.replace(/"/g, '""')}"`;
    }


    function escapeHTML(value) {
      return String(value ?? "").replace(/[&<>"']/g, (character) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
      })[character]);
    }


    function escapeAttr(value) {
      return escapeHTML(value).replace(/`/g, "&#096;");
    }


    function bindShellEvents() {
      const sidebar = document.querySelector(".sidebar");
      if (sidebar && !sidebar.dataset.navBound) {
        sidebar.dataset.navBound = "1";
        sidebar.addEventListener("click", (event) => {
          const button = event.target.closest("[data-view]");
          if (!button || !sidebar.contains(button)) return;
          event.preventDefault();
          navigate(button.dataset.view);
        });
      }
      
      const sidebarToggle = $("#sidebarToggle");
      if (sidebarToggle) {
        sidebarToggle.addEventListener("click", () => $("#app").classList.toggle("sidebar-collapsed"));
      }


      window.addEventListener("message", handleParentMessage);
    }


    function startBridgeHandshake() {
      let attempts = 0;
      const sendReady = () => {
        attempts += 1;
        post("DUFFEL_APP_READY", { version: "R-006.3-unified", attempt: attempts }, { busy: false });
        post("ALTEA_UNIFIED_BOOTSTRAP", { version: "R-006.3-unified", attempt: attempts }, { busy: false });
      };
      sendReady();
      const retryTimer = window.setInterval(() => {
        if (state.bridgeConnected || attempts >= 10) {
          window.clearInterval(retryTimer);
          return;
        }
        sendReady();
      }, 1200);
    }


    bindShellEvents();
    render();
    startBridgeHandshake();
  


</script>
<script>
/* SKANDI ALTEA ground-products extension: Duffel Stays + Duffel Cars. */
(function(){
  VIEW_TITLES.hotels = "Hotel Search";
  VIEW_TITLES.cars = "Car Rental";
  EXCLUSIVE_ACTIONS.add("DUFFEL_CREATE_STAY_BOOKING");
  EXCLUSIVE_ACTIONS.add("DUFFEL_CREATE_CAR_BOOKING");
  EXCLUSIVE_ACTIONS.add("DUFFEL_CANCEL_STAY_BOOKING");
  EXCLUSIVE_ACTIONS.add("DUFFEL_CANCEL_CAR_BOOKING");
  state.stayResults = [];
  state.stayRates = [];
  state.selectedStayResult = null;
  state.selectedStayRate = null;
  state.stayQuote = null;
  state.carResults = [];
  state.carQuote = null;
  state.selectedCarRate = null;
  state.carClientKey = "";
  state.carCardValid = false;
  state.carThreeDSecureSessionId = "";


  const flightButton = document.querySelector('.nav-item[data-view="search"]');
  if (flightButton && !document.querySelector('.nav-item[data-view="hotels"]')) {
    const hotel = document.createElement("button");
    hotel.type="button"; hotel.className="nav-item"; hotel.dataset.view="hotels";
    hotel.innerHTML='<span class="nav-icon">▤</span><span class="nav-label">Hotel Search</span>';
    flightButton.insertAdjacentElement("afterend",hotel);
    const car = document.createElement("button");
    car.type="button"; car.className="nav-item"; car.dataset.view="cars";
    car.innerHTML='<span class="nav-icon">▱</span><span class="nav-label">Car Rental</span>';
    hotel.insertAdjacentElement("afterend",car);
  }




  function val(id){return String(document.getElementById(id)?.value||"").trim()}
  function numVal(id,fallback){const n=Number(val(id));return Number.isFinite(n)?n:fallback}
  function currentAlteaBookingId(){return state.alteaWorkspace?.booking?.id||""}


  function renderHotels(){
    return `${pageHead("Hotel Search","Live accommodation search. Inventory Control supplies SKANDI content, not room availability.")}
      <section class="panel"><div class="panel-head">Search live stays</div><div class="panel-body">
        <div class="form-grid">
          <div class="field"><label>Destination / IATA</label><input id="stayDest" class="input" placeholder="STO or Stockholm"></div>
          <div class="field"><label>Check-in</label><input id="stayIn" class="input" type="date"></div>
          <div class="field"><label>Check-out</label><input id="stayOut" class="input" type="date"></div>
          <div class="field"><label>Rooms</label><input id="stayRooms" class="input" type="number" min="1" max="9" value="1"></div>
          <div class="field"><label>Adults</label><input id="stayAdults" class="input" type="number" min="1" max="9" value="2"></div>
        </div>
      </div><div class="panel-foot"><button class="primary" id="staySearchBtn">Search Hotels</button></div></section>
      <section class="panel" style="margin-top:10px"><div class="panel-head"><span>Live results</span><span class="muted">${state.stayResults.length} accommodations</span></div><div class="panel-body">${stayResultsMarkup()}</div></section>
      ${stayRatePanel()}`;
  }


  function stayResultsMarkup(){
    if(!state.stayResults.length)return emptyState("⌂","No stay results loaded","Run a live Hotel search.");
    return `<table class="data-table"><thead><tr><th>Accommodation</th><th>City</th><th>Total from</th><th></th></tr></thead><tbody>${state.stayResults.map(r=>`<tr><td><strong>${escapeHTML(r.title||"Accommodation")}</strong></td><td>${escapeHTML(r.address?.city||"")}</td><td>${money(r.cheapestRateTotalAmount||r.total,r.cheapestRateTotalCurrency||r.currency)}</td><td><button class="link" data-stay-result="${escapeAttr(r.id)}">Rooms & rates</button></td></tr>`).join("")}</tbody></table>`;
  }
  function stayRatePanel(){
    if(!state.selectedStayResult&&!state.stayRates.length)return "";
    return `<section class="panel" style="margin-top:10px"><div class="panel-head">Rooms & rates</div><div class="panel-body">${state.stayRates.length?`<table class="data-table"><thead><tr><th>Room</th><th>Board</th><th>Total</th><th></th></tr></thead><tbody>${state.stayRates.map(r=>`<tr><td>${escapeHTML(r.roomName||"Room")}</td><td>${escapeHTML(r.boardType||"—")}</td><td>${money(r.totalAmount,r.totalCurrency)}</td><td><button class="link" data-stay-rate="${escapeAttr(r.rateId)}">Quote</button></td></tr>`).join("")}</tbody></table>`:emptyState("▤","Loading rates","Select an accommodation to retrieve current room rates.")}</div>${state.stayQuote?`<div class="panel-foot"><span class="muted">Quoted ${money(state.stayQuote.totalAmount,state.stayQuote.totalCurrency)}</span><button class="primary" id="bookStayBtn">Book into open ALTEA file</button></div>`:""}</section>`;
  }


  function renderCars(){
    return `${pageHead("Car Rental","Live vehicle search, quotes and bookings through car rental system.")}
      <section class="panel"><div class="panel-head">Search live cars</div><div class="panel-body">
        <div class="form-grid">
          <div class="field"><label>Pickup</label><input id="carPickup" class="input" placeholder="ARN or Stockholm" value="${escapeAttr(state.carSearchDraft?.pickup || "")}"></div>
          <div class="field"><label>Drop-off</label><input id="carDropoff" class="input" placeholder="ARN or Stockholm" value="${escapeAttr(state.carSearchDraft?.dropoff || "")}"></div>
          <div class="field"><label>Pickup date</label><input id="carPickupDate" class="input" type="date" value="${escapeAttr(state.carSearchDraft?.pickupDate || "")}"></div>
          <div class="field"><label>Pickup time</label><input id="carPickupTime" class="input" type="time" value="${escapeAttr(state.carSearchDraft?.pickupTime || "10:00")}"></div>
          <div class="field"><label>Drop-off date</label><input id="carDropoffDate" class="input" type="date" value="${escapeAttr(state.carSearchDraft?.dropoffDate || "")}"></div>
          <div class="field"><label>Drop-off time</label><input id="carDropoffTime" class="input" type="time" value="${escapeAttr(state.carSearchDraft?.dropoffTime || "10:00")}"></div>
          <div class="field"><label>Driver age</label><input id="carAge" class="input" type="number" min="18" max="99" value="${escapeAttr(String(state.carSearchDraft?.age || 30))}"></div>
          <div class="field"><label>Residence country</label><input id="carResidence" class="input mono" maxlength="2" placeholder="US" value="${escapeAttr(state.carSearchDraft?.residence || "")}"></div>
        </div>
      </div><div class="panel-foot"><button class="primary" id="carSearchBtn">Search Cars</button></div></section>
      <section class="panel" style="margin-top:10px"><div class="panel-head"><span>Live rates</span><span class="muted">${state.carResults.length} rates</span></div><div class="panel-body">${carResultsMarkup()}</div></section>
      ${carQuotePanel()}`;
  }
  function carResultsMarkup(){
    if(!state.carResults.length)return emptyState("▱","No car rates loaded","Run a live search.");
    return `<table class="data-table"><thead><tr><th>Vehicle</th><th>Supplier</th><th>Transmission</th><th>Payment</th><th>Total</th><th></th></tr></thead><tbody>${state.carResults.map(r=>`<tr><td><strong>${escapeHTML(r.car?.name||"Vehicle")}</strong><div class="muted">${escapeHTML(r.car?.category||"")}</div></td><td>${escapeHTML(r.supplier?.name||"")}</td><td>${escapeHTML(r.car?.transmission||"")}</td><td>${escapeHTML(r.paymentType||"")}</td><td>${money(r.totalAmount,r.totalCurrency)}</td><td><button class="link" data-car-rate="${escapeAttr(r.rateId)}">Quote</button></td></tr>`).join("")}</tbody></table>`;
  }
  function carQuotePanel(){
    const q=state.carQuote;if(!q)return "";
    const direct=q.paymentType==="postpaid";
    return `<section class="panel" style="margin-top:10px"><div class="panel-head"><span>Confirmed car quote</span><span class="badge info">${escapeHTML(q.paymentType||"payment")}</span></div><div class="panel-body">
      <div class="grid grid-3"><div><span class="muted">Vehicle</span><div class="strong">${escapeHTML(q.car?.name||"Vehicle")}</div></div><div><span class="muted">Supplier</span><div class="strong">${escapeHTML(q.supplier?.name||"")}</div></div><div><span class="muted">Total</span><div class="price-total">${money(q.totalAmount,q.totalCurrency)}</div></div></div>
      ${direct?alertBox("info","Payment","System reports this rate as postpaid. No customer card data is collected by ALTEA."):alertBox("warning","Secure payment")}
      <div class="form-grid" style="margin-top:10px"><div class="field"><label>Driver first name</label><input id="carFirst" class="input"></div><div class="field"><label>Driver last name</label><input id="carLast" class="input"></div><div class="field"><label>Date of birth</label><input id="carDob" class="input" type="date"></div><div class="field"><label>Email</label><input id="carEmail" class="input" type="email"></div><div class="field"><label>Phone (E.164)</label><input id="carPhone" class="input" placeholder="+12125550123"></div></div>
      ${direct?"":`<div style="margin-top:12px;padding:12px;border:1px solid var(--line);background:#fff"><div class="strong" style="margin-bottom:7px">Card input form</div>${state.carClientKey?`<duffel-card-form id="alteaCarCardForm"></duffel-card-form><div class="muted" style="margin-top:7px">${state.carThreeDSecureSessionId?"3-D Secure authenticated and ready for booking.":"Complete the card input, then authenticate."}</div>`:`<div class="muted">Prepare to enter the customer's card.</div>`}</div>`}
    </div><div class="panel-foot">${direct?"":`<button class="secondary" id="prepareCarCardBtn">${state.carClientKey?"Refresh secure component":"Prepare secure card component"}</button>${state.carClientKey&&!state.carThreeDSecureSessionId?`<button class="secondary" id="authenticateCarCardBtn" ${state.carCardValid?"":"disabled"}>Authenticate card</button>`:""}`}<button class="primary" id="bookCarBtn" ${!direct&&!state.carThreeDSecureSessionId?"disabled":""}>Book car${currentAlteaBookingId()?" into open ALTEA file":""}</button></div></section>`;
  }


  const baseRender=render;
  render=function(){
    if(state.activeView==="hotels"||state.activeView==="cars"){
      main.innerHTML=`<section class="view">${state.activeView==="hotels"?renderHotels():renderCars()}</section>`;
      bindGroundEvents();
      return;
    }
    baseRender();
  };


  function bindGroundEvents(){
    document.getElementById("staySearchBtn")?.addEventListener("click",()=>post("DUFFEL_SEARCH_STAYS",{destination:val("stayDest"),checkInDate:val("stayIn"),checkOutDate:val("stayOut"),rooms:numVal("stayRooms",1),adults:numVal("stayAdults",2),instantPayment:true}));
    document.querySelectorAll("[data-stay-result]").forEach(b=>b.addEventListener("click",()=>{state.selectedStayResult=b.dataset.stayResult;state.stayRates=[];state.stayQuote=null;post("DUFFEL_FETCH_STAY_RATES",{searchResultId:b.dataset.stayResult});render();}));
    document.querySelectorAll("[data-stay-rate]").forEach(b=>b.addEventListener("click",()=>{state.selectedStayRate=b.dataset.stayRate;post("DUFFEL_QUOTE_STAY",{rateId:b.dataset.stayRate});}));
    document.getElementById("bookStayBtn")?.addEventListener("click",()=>{
      const q=state.stayQuote;if(!q)return;
      openModal("Book Hotel",`<div class="field"><label>Lead guest first name</label><input id="stayGuestFirst" class="input"></div><div class="field" style="margin-top:8px"><label>Lead guest last name</label><input id="stayGuestLast" class="input"></div><div class="field" style="margin-top:8px"><label>Email</label><input id="stayGuestEmail" class="input" type="email"></div><div class="field" style="margin-top:8px"><label>Phone (E.164)</label><input id="stayGuestPhone" class="input" placeholder="+12125550123"></div>`,[{label:"Back",className:"secondary",close:true},{label:"Book stay",className:"primary",onClick:()=>{const payload={quoteId:q.id,guests:[{givenName:val("stayGuestFirst"),familyName:val("stayGuestLast")}],email:val("stayGuestEmail"),phoneNumber:val("stayGuestPhone"),alteaBookingId:currentAlteaBookingId()};closeModal();post("DUFFEL_CREATE_STAY_BOOKING",payload);}}]);
    });
    document.getElementById("carSearchBtn")?.addEventListener("click",()=>post("DUFFEL_SEARCH_CARS",{pickupLocationText:val("carPickup"),dropoffLocationText:val("carDropoff")||val("carPickup"),sameLocation:!val("carDropoff")||val("carDropoff")===val("carPickup"),pickupDate:val("carPickupDate"),pickupTime:val("carPickupTime"),dropoffDate:val("carDropoffDate"),dropoffTime:val("carDropoffTime"),driverAge:numVal("carAge",30),residenceCountry:val("carResidence")}));
    document.querySelectorAll("[data-car-rate]").forEach(b=>b.addEventListener("click",()=>{state.selectedCarRate=b.dataset.carRate;post("DUFFEL_QUOTE_CAR",{rateId:b.dataset.carRate});}));
    document.getElementById("prepareCarCardBtn")?.addEventListener("click",()=>{state.carThreeDSecureSessionId="";post("DUFFEL_PREPARE_CAR_CARD",{});});
    document.getElementById("authenticateCarCardBtn")?.addEventListener("click",()=>{try{window.createCardForTemporaryUse()}catch(error){toast("Secure card error",error?.message||"Could not tokenize the card.","danger")}});
    document.getElementById("bookCarBtn")?.addEventListener("click",()=>{const q=state.carQuote;if(!q)return;post("DUFFEL_CREATE_CAR_BOOKING",{quoteId:q.id,paymentType:q.paymentType,threeDSecureSessionId:state.carThreeDSecureSessionId||"",alteaBookingId:currentAlteaBookingId(),driver:{givenName:val("carFirst"),familyName:val("carLast"),dateOfBirth:val("carDob"),email:val("carEmail"),phoneNumber:val("carPhone")}});});
    initAlteaCarCardForm();
  }


  function initAlteaCarCardForm(){
    const q=state.carQuote,el=document.getElementById("alteaCarCardForm");
    if(!q||!el||!state.carClientKey||typeof window.renderDuffelCardFormCustomElement!=="function")return;
    try{
      window.renderDuffelCardFormCustomElement({clientKey:state.carClientKey,intent:"to-create-card-for-temporary-use"});
      el.addEventListener("onValidateSuccess",()=>{state.carCardValid=true;document.getElementById("authenticateCarCardBtn")?.removeAttribute("disabled")});
      el.addEventListener("onValidateFailure",()=>{state.carCardValid=false;document.getElementById("authenticateCarCardBtn")?.setAttribute("disabled","disabled")});
      el.addEventListener("onCreateCardForTemporaryUseFailure",event=>toast("Secure card failed",event.detail?.error?.message||"System failure.","danger"));
      el.addEventListener("onCreateCardForTemporaryUseSuccess",async event=>{
        try{
          const cardId=event.detail?.data?.id;if(!cardId)throw new Error("System did not return a temporary card ID.");
          const session=await window.createThreeDSecureSession(state.carClientKey,cardId,q.id,[],false);
          if(!session||session.status!=="ready_for_payment")throw new Error("The 3-D Secure session is not ready for payment.");
          state.carThreeDSecureSessionId=session.id;toast("Card authenticated","The supplier payment can now be confirmed.","success");render();
        }catch(error){toast("3-D Secure failed",error?.message||"Authentication could not be completed.","danger")}
      });
    }catch(error){toast("Secure card unavailable",error?.message||"Card Form could not be rendered.","danger")}
  }


  window.addEventListener("message",event=>{
    if(event.source!==window.parent)return;
    const m=event.data||{};if(m.source!==PARENT_SOURCE)return;const p=m.payload||{};
    if(m.type==="DUFFEL_STAYS_RESULT"){state.stayResults=p.items||[];state.stayRates=[];state.stayQuote=null;navigate("hotels");toast("Live stays loaded",`${state.stayResults.length} accommodation${state.stayResults.length===1?"":"s"} returned.`,"success");}
    if(m.type==="DUFFEL_STAY_RATES_RESULT"){state.stayRates=p.rates||[];state.stayQuote=null;render();}
    if(m.type==="DUFFEL_STAY_QUOTE_RESULT"){state.stayQuote=p.quote||null;render();}
    if(m.type==="DUFFEL_STAY_BOOKING_RESULT"){toast("Hotel booked",`Booking reference ${p.booking?.reference||p.booking?.id||"confirmed"}.`,"success");if(currentAlteaBookingId())post("ALTEA_GET_BOOKING",{bookingId:currentAlteaBookingId()});}
    if(m.type==="DUFFEL_CARS_RESULT"){state.carResults=p.items||[];state.carQuote=null;navigate("cars");toast("Live cars loaded",`${state.carResults.length} rate${state.carResults.length===1?"":"s"} returned.`,"success");}
    if(m.type==="DUFFEL_CAR_QUOTE_RESULT"){state.carQuote=p.quote||null;render();}
    if(m.type==="DUFFEL_CAR_CARD_READY"){state.carClientKey=p.componentClientKey||"";state.carCardValid=false;state.carThreeDSecureSessionId="";toast("Secure card component ready","info");render();}
    if(m.type==="DUFFEL_CAR_BOOKING_RESULT"){toast("Car booked",`Booking reference ${p.booking?.reference||p.booking?.id||"confirmed"}.`,"success");if(currentAlteaBookingId())post("ALTEA_GET_BOOKING",{bookingId:currentAlteaBookingId()});}
  });
})();
</script>


<script>
/* ================================================================
   SKANDI ALTEA Unified Reservations v3.3 enterprise extension
   Master booking + SKANDI Club + Package/Charter + Documents +
   Travel Requirements provider adapter + DCS + Manifests.
   ================================================================ */
(function(){
  "use strict";


  const ENTERPRISE_VERSION = "R-006.3-unified";


  [
    "ALTEA_UPDATE_BOOKING",
    "ALTEA_CLUB_LINK_MEMBER",
    "ALTEA_CLUB_ADJUST_POINTS",
    "ALTEA_GENERATE_DOCUMENT",
    "ALTEA_SEND_DOCUMENT",
    "ALTEA_DCS_UPDATE_PASSENGER"
  ].forEach(type=>EXCLUSIVE_ACTIONS.add(type));


  Object.assign(VIEW_TITLES,{
    packagebuilder:"Package Builder",
    club:"SKANDI Club",
    manifests:"Operations & Manifests",
    departure:"Departure Control · Transfers"
  });


  state.clubSearchResults = [];
  state.clubProfiles = state.clubProfiles || {};
  state.travelDecision = null;
  state.travelRequirementsProvider = null;
  state.generatedDocuments = state.generatedDocuments || [];
  state.dcsSelectedPassengerId = state.dcsSelectedPassengerId || "";
  state.manifestMode = "passengers";
  state.transferDcsTab = state.transferDcsTab || "departures";
  state.transferDcsDepartures = state.transferDcsDepartures || [];
  state.transferDcsSelectedDepartureId = state.transferDcsSelectedDepartureId || "";
  state.transferDcsSelectedPassengerId = state.transferDcsSelectedPassengerId || "";
  state.transferDcsPassengerState = state.transferDcsPassengerState || {};
  state.transferDcsDepartureState = state.transferDcsDepartureState || {};
  state.transferDcsActivity = state.transferDcsActivity || [];
  state.transferDcsPersistence = Boolean(state.transferDcsPersistence);


  const enterpriseStyle=document.createElement("style");
  enterpriseStyle.textContent=`
    .action-stack{display:grid;gap:6px}
    .subtabs{display:flex;flex-wrap:wrap;gap:0;border:1px solid var(--line);background:#e8edf1;margin-bottom:10px}
    .subtab{min-height:31px;padding:0 11px;border:0;border-right:1px solid var(--line);background:transparent;color:#365066;font-weight:700}
    .subtab.active{background:#fff;color:#005ea8;box-shadow:inset 0 3px var(--brand)}
    .master-ref{font-size:22px;font-weight:800;letter-spacing:.08em;color:#123e5d;font-family:ui-monospace,SFMono-Regular,Consolas,monospace}
    .component-cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
    .component-card{border:1px solid var(--line);background:#fff;padding:9px;display:grid;grid-template-columns:1fr auto;gap:6px}
    .component-card .meta{grid-column:1/-1;color:var(--muted);font-size:10px}
    .document-actions{display:flex;gap:5px;flex-wrap:wrap}
    .decision{padding:14px;border:1px solid var(--line);background:#fff}
    .decision.go{border-left:5px solid var(--success);background:var(--success-bg)}
    .decision.stop{border-left:5px solid var(--danger);background:var(--danger-bg)}
    .decision.review{border-left:5px solid #d08a16;background:var(--warning-bg)}
    .decision h2{margin:0 0 5px;font-size:18px}
    .dcs-toolbar{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
    .dcs-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin-bottom:10px}
    .doc-preview{border:1px dashed #9fb0bc;background:#fff;padding:16px;min-height:150px}
    .manifest-filters{display:flex;gap:5px;flex-wrap:wrap}
    .club-card{border:1px solid #173f5c;background:linear-gradient(135deg,#0b3157,#022e64);color:white;padding:15px;min-height:150px;display:flex;flex-direction:column;justify-content:space-between}
    .club-card .tier{font-size:18px;font-weight:800;letter-spacing:.06em}.club-card .member{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;letter-spacing:.08em}
    .transfer-dcs-tabs{display:flex;flex-wrap:wrap;border:1px solid var(--line);background:#dfe5ea;margin-bottom:10px}
    .transfer-dcs-tab{min-height:34px;border:0;border-right:1px solid var(--line);background:transparent;padding:0 12px;font-weight:750;color:#405867}
    .transfer-dcs-tab.active{background:#fff;color:#005ea8;box-shadow:inset 0 3px var(--brand)}
    .transfer-flight-ref{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;color:#395669}
    .transfer-route{font-weight:800;color:#173f5c}.transfer-sub{font-size:10px;color:var(--muted);margin-top:2px}
    .transfer-load{min-width:150px}.transfer-load-track{height:8px;border:1px solid #aab6bf;background:#dfe5ea;margin-top:4px}.transfer-load-fill{height:100%;background:#167ec4}
    .transfer-profile{display:grid;gap:7px}.transfer-profile-head{padding:10px;background:#eaf3fb;border:1px solid #b8cedf}
    .transfer-profile-name{font-size:17px;font-weight:800;color:#173f5c}.transfer-profile-ref{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;color:#5f7280}
    .coach-shell{max-width:520px;margin:0 auto;padding:16px 24px 28px;border:2px solid #91a1ac;border-radius:60px 60px 18px 18px;background:linear-gradient(90deg,#e4eaee,#fff 15%,#fff 85%,#e4eaee)}
    .coach-front{text-align:center;font-size:10px;font-weight:800;color:#607482;margin-bottom:10px}.coach-row{display:grid;grid-template-columns:30px 42px 42px 34px 42px 42px;gap:6px;align-items:center;justify-content:center;margin:5px 0}.coach-row-num{text-align:right;font-weight:800;color:#61727e}.coach-aisle{text-align:center;font-size:8px;color:#84939c}.coach-seat{height:34px;border:1px solid #7391a4;border-radius:5px;background:#e8f2f8;font-weight:800;color:#173f5c}.coach-seat.occupied{background:#3d6581;color:white;border-color:#28465b}.coach-seat.selected{background:#005eb8;color:white;box-shadow:0 0 0 2px #79c8ff}.coach-seat.blocked{background:repeating-linear-gradient(45deg,#c9cfd3,#c9cfd3 4px,#aab3ba 4px,#aab3ba 8px);color:#49545c}.coach-seat:hover:not(:disabled){outline:2px solid #2f97d6}
    .transfer-scanner{background:#0f2436;border:1px solid #071722;padding:14px;color:white}.transfer-scanner-line{display:flex;gap:7px;margin-top:6px}.transfer-scanner input{height:48px;flex:1;background:#061520;border:2px solid #4186b5;color:#fff;font-size:20px;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;padding:5px 10px}.transfer-scan-result{margin-top:8px;padding:9px;border:1px solid #35536b;background:#172f42}.transfer-scan-result.success{background:#0b5d2a;border-color:#32b05d}.transfer-scan-result.error{background:#741e1e;border-color:#dc5a5a}.transfer-operation-note{padding:9px;border:1px solid #d3ae53;background:#fff6dc;color:#654b12}
    .transfer-activity{display:grid;gap:0}.transfer-activity-row{display:grid;grid-template-columns:70px 1fr;gap:8px;padding:7px;border-bottom:1px solid #dde3e7}.transfer-activity-row time{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;color:#005ea8;font-weight:750}
    @media(max-width:820px){.component-cards,.dcs-summary{grid-template-columns:1fr}.master-ref{font-size:18px}}
  `;
  document.head.appendChild(enterpriseStyle);


  function addNavButton(afterSelector,view,icon,label){
    if(document.querySelector(`.nav-item[data-view="${view}"]`))return;
    const anchor=document.querySelector(afterSelector); if(!anchor)return;
    const b=document.createElement("button");
    b.type="button";b.className="nav-item";b.dataset.view=view;
    b.innerHTML=`<span class="nav-icon">${icon}</span><span class="nav-label">${label}</span>`;
    anchor.insertAdjacentElement("afterend",b);
  }
  addNavButton('.nav-item[data-view="cars"]','packagebuilder','◈','Package Builder');
  addNavButton('.nav-item[data-view="passengers"]','club','★','SKANDI Club');
  addNavButton('.nav-item[data-view="baggage"]','departure','▶','Departure Control');
  addNavButton('.nav-item[data-view="departure"]','manifests','☷','Operations & Manifests');




  const priorRender=render;
  render=function(){
    if(["packagebuilder","club","departure","manifests"].includes(state.activeView)){
      const fn={packagebuilder:renderPackageBuilder,club:renderClub,departure:renderDepartureControl,manifests:renderManifests}[state.activeView];
      main.innerHTML=`<section class="view">${fn()}</section>`;
      bindEnterpriseEvents();
      return;
    }
    priorRender();
  };


  const priorBindViewEvents=bindViewEvents;
  bindViewEvents=function(){priorBindViewEvents();bindEnterpriseEvents();};


  function workspace(){return state.alteaWorkspace||null}
  function booking(){return workspace()?.booking||null}
  function passengers(){return workspace()?.passengers||[]}
  function components(){return (workspace()?.components||[]).filter(c=>c.status!=="REMOVED")}
  function masterReference(){const b=booking();return b?.bookingReference||b?.pnrLocator||b?.id||state.selectedOrder?.bookingReference||"—"}
  function normalizedType(v){return String(v||"").toUpperCase().replace(/[\s-]+/g,"_")}
  function bookingType(){const b=booking();return normalizedType(b?.bookingType||b?.tripType||b?.payload?.bookingType||inferBookingType())}
  function isSkandiDcs(){const b=booking();const t=bookingType();return Boolean(b&&(b.dcsAuthority==="SKANDI"||b.operatingControl==="SKANDI"||b.isCharter===true||t.includes("CHARTER")))}
  function selectedPax(){const list=passengers();return list.find(p=>p.id===(state.dcsSelectedPassengerId||state.selectedPassengerId))||list[0]||null}
  function componentTypes(){return components().map(c=>normalizedType(c.componentType||c.entityType))}
  function inferBookingType(){
    const types=componentTypes();const hasAir=Boolean(state.selectedOrder||booking()?.supplierOrderId||booking()?.origin||types.some(t=>t.includes("FLIGHT")));
    const hasHotel=types.some(t=>t.includes("HOTEL")||t.includes("STAY"));const other=types.some(t=>["TRANSFER","TOUR","ACTIVITY","CAR","EXCURSION"].some(x=>t.includes(x)));
    if(hasAir&&(hasHotel||other))return "DYNAMIC_PACKAGE";
    if(hasHotel||other)return "LAND_ONLY";
    return hasAir?"FLIGHT_ONLY":"BOOKING";
  }
  function isSkandiDcsSafe(){const b=booking();const explicit=normalizedType(b?.bookingType||b?.tripType||b?.payload?.bookingType);return Boolean(b&&(b.dcsAuthority==="SKANDI"||b.operatingControl==="SKANDI"||b.isCharter===true||explicit.includes("CHARTER")))}
  function totalComponents(){return components().reduce((sum,c)=>sum+(Number(c.totalAmount)||0),0)}
  function packageTotal(){return (Number(booking()?.totalAmount)||0)+totalComponents()}
  function serviceLabel(c){return c.title||c.name||c.productName||humanize(c.componentType||c.entityType||"Service")}
  function paxName(p){return p?.displayName||[p?.firstName,p?.lastName].filter(Boolean).join(" ")||p?.passengerRef||"Passenger"}
  function clubFor(p){return state.clubProfiles[p?.id]||p?.clubProfile||p?.payload?.clubProfile||null}


  const originalOpenLocalBookingModal=openLocalBookingModal;
  openLocalBookingModal=function(){
    openModal("New SKANDI master booking",`
      <div class="alert info"><span>▣</span><div><strong>One SKANDI booking reference</strong>The SKANDI reference is the customer-facing master reference. All other supplier locators remain attached underneath it for servicing.</div></div>
      <div class="grid grid-2"><div class="field"><label>Booking type</label><select id="localBookingType">
        <option value="LAND_ONLY">Land only</option><option value="DYNAMIC_PACKAGE">Dynamic package</option><option value="SKANDI_PACKAGE">SKANDI package</option><option value="GROUP_BOOKING">Group booking</option>
      </select></div><div class="field"><label>Currency</label><input id="localCurrency" maxlength="3" value="${escapeAttr(state.preferences.currency||"USD")}"></div></div>
      <div class="field"><label>Customer name</label><input id="localCustomerName" maxlength="200"></div>
      <div class="field"><label>Customer email</label><input id="localCustomerEmail" type="email" maxlength="254"></div>
      <div class="grid grid-2"><div class="field"><label>Package / trip title</label><input id="localTripTitle" maxlength="180" placeholder="Rhodes 7 nights"></div><div class="field"><label>Transfer operations</label><select id="localTransferControl"><option value="SKANDI">SKANDI Transfer Control</option><option value="SUPPLIER">External transfer supplier</option></select></div></div>
      <div class="field"><label>Internal notes</label><textarea id="localBookingNotes"></textarea></div>`,[
        {label:"Cancel",className:"secondary",close:true},
        {label:"Create master booking",className:"primary",onClick:()=>{
          const currency=String($("#localCurrency")?.value||"USD").toUpperCase();if(!/^[A-Z]{3}$/.test(currency))return toast("Invalid currency","Use a three-letter currency code.","warning");
          const type=$("#localBookingType")?.value||"LAND_ONLY";const transferControl=$("#localTransferControl")?.value||"SKANDI";
          closeModal();post("ALTEA_CREATE_LOCAL_BOOKING",{customerName:$("#localCustomerName")?.value||"",customerEmail:$("#localCustomerEmail")?.value||"",currency,notes:$("#localBookingNotes")?.value||"",bookingType:type,tripTitle:$("#localTripTitle")?.value||"",transferControl});
        }}
      ]);
  };


  renderBookingFile=function(){
    renderBookingFile = function() {
    const w = workspace();
    if (!w?.booking) {
      return `${pageHead("Booking File", "Unified SKANDI master booking with supplier references.")}
        ${emptyState("▣", "No booking selected", "Open a booking from Bookings & Orders or create a new booking.")}`;
    }

    const b = w.booking;
    const comps = components();
    const flight = b.flightDetails || (state.selectedOrder ? syncFlightDataToBooking(b, state.selectedOrder).flightDetails : null);
    const pqr = flight?.pricingRecord;
    const rules = flight?.miniRules;

    return `
      ${pageHead("Booking File", `${masterReference()} · ${humanize(bookingType())}`, 
        '<button class="secondary" data-action="refresh-booking-file">Refresh</button><button class="primary" data-view="packagebuilder">Package Builder</button>')}
      
      <!-- Top Stat Bar -->
      <div class="grid grid-4">
        ${statCard("Master Reference", masterReference(), "Customer-facing PNR")}
        ${statCard("Route", [b.origin, b.destination].filter(Boolean).join(" → ") || "—", b.departureDate || "Travel date pending")}
        ${statCard("Validating Carrier", pqr?.validatingCarrier || b.supplier || "SKANDI", "Ticketing carrier")}
        ${statCard("Grand Total", money(pqr?.totalAmount || b.totalAmount, pqr?.currency || b.currency), "Air + Components")}
      </div>

      <div class="workspace-layout" style="margin-top:10px">
        <div>
          
          <!-- 1. Master PNR Header -->
          <section class="panel">
            <div class="panel-head">
              <span>Master Booking Record</span>
              <span class="master-ref">${escapeHTML(masterReference())}</span>
            </div>
            <div class="panel-body">
              <div class="grid grid-3">
                <div><span class="muted">Customer</span><div class="strong">${escapeHTML(b.customerName || "—")}</div></div>
                <div><span class="muted">Email</span><div>${escapeHTML(b.customerEmail || "—")}</div></div>
                <div><span class="muted">Booking Status</span><div><span class="badge ${statusClass(b.status)}">${escapeHTML(b.status || "CONFIRMED")}</span></div></div>
                <div><span class="muted">Supplier Locator</span><div class="mono strong">${escapeHTML(b.supplierBookingReference || state.selectedOrder?.bookingReference || "—")}</div></div>
                <div><span class="muted">Order ID</span><div class="mono strong">${escapeHTML(b.supplierOrderId || state.selectedOrder?.id || "—")}</div></div>
                <div><span class="muted">Payment Status</span><div>${escapeHTML(b.paymentStatus || "PAID")}</div></div>
              </div>
            </div>
          </section>

          <!-- 2. ALTÉA AIR ITINERARY (Segments Matrix) -->
          <section class="panel" style="margin-top:10px">
            <div class="panel-head">
              <span>Air Itinerary · Confirmed Segments</span>
              <span class="badge info">${flight?.segments?.length || 0} Segment(s)</span>
            </div>
            <div class="panel-body" style="padding:0">
              ${flight?.segments?.length ? `
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Seg</th>
                      <th>Flight</th>
                      <th>RBD</th>
                      <th>Depart</th>
                      <th>Arrive</th>
                      <th>Terminal</th>
                      <th>Aircraft</th>
                      <th>Duration</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${flight.segments.map(s => `
                      <tr>
                        <td class="mono strong">${s.segId}</td>
                        <td>
                          <strong>${escapeHTML(s.flightNumber)}</strong>
                          <div class="muted" style="font-size:9px;">Op: ${escapeHTML(s.operatingCarrier)}</div>
                        </td>
                        <td class="mono strong">${s.rbd}</td>
                        <td>
                          <strong>${escapeHTML(s.origin)}</strong> ${timeOnly(s.departingAt)}
                          <div class="muted" style="font-size:9px;">${formatShortDate(s.departingAt)}</div>
                        </td>
                        <td>
                          <strong>${escapeHTML(s.destination)}</strong> ${timeOnly(s.arrivingAt)}
                          <div class="muted" style="font-size:9px;">${formatShortDate(s.arrivingAt)}</div>
                        </td>
                        <td>${escapeHTML(s.originTerminal)} / ${escapeHTML(s.destinationTerminal)}</td>
                        <td>${escapeHTML(s.aircraft)}</td>
                        <td>${escapeHTML(s.duration)}</td>
                        <td><span class="badge success">HK1</span></td>
                      </tr>
                    `).join("")}
                  </tbody>
                </table>
              ` : emptyState("✈", "No Air Segments Found", "Flight segments will appear once an airline order is attached.")}
            </div>
          </section>

          <!-- 3. ALTÉA TST / PRICING RECORD & FARE BASIS -->
          <section class="panel" style="margin-top:10px">
            <div class="panel-head">
              <span>Pricing Record (TST / PQR) & Fare Calculation</span>
              <span class="mono">${pqr?.fareBrand || "PUBLISHED FARE"}</span>
            </div>
            <div class="panel-body">
              
              <!-- Fare Breakdown Ladder -->
              <div class="grid grid-4" style="margin-bottom:12px;">
                <div><span class="muted">Base Fare</span><div class="strong">${pqr ? money(pqr.baseAmount, pqr.currency) : "—"}</div></div>
                <div><span class="muted">Taxes & Surcharges</span><div class="strong">${pqr ? money(pqr.taxAmount, pqr.currency) : "—"}</div></div>
                <div><span class="muted">Total Airfare</span><div class="price-total">${pqr ? money(pqr.totalAmount, pqr.currency) : "—"}</div></div>
                <div><span class="muted">Validating Carrier</span><div class="strong">${pqr?.validatingCarrier || "—"}</div></div>
              </div>

              <!-- Segment Fare Basis & Baggage Allowance Table -->
              <div class="automation-section" style="margin-top:0;">
                <div class="automation-head">
                  <span>Fare Basis Codes & Baggage Allowance</span>
                  <span class="mono">FWR/TQQ</span>
                </div>
                <div class="automation-body" style="padding:0;">
                  <table class="mini-table">
                    <thead>
                      <tr>
                        <th>Seg</th>
                        <th>Flight</th>
                        <th>Fare Family</th>
                        <th>Fare Basis Code</th>
                        <th>Included Baggage</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${flight?.segments?.flatMap(s => s.passengers.map(p => `
                        <tr>
                          <td class="mono">${s.segId}</td>
                          <td><strong>${escapeHTML(s.flightNumber)}</strong></td>
                          <td>${escapeHTML(p.cabinBrand)}</td>
                          <td class="mono strong" style="color:#005eb8;">${escapeHTML(p.fareBasisCode)}</td>
                          <td>${escapeHTML(p.baggage)}</td>
                        </tr>
                      `)).join("") || '<tr><td colspan="5" class="empty">No fare basis codes recorded.</td></tr>'}
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Mini Rules / Penalties -->
              <div class="rule-cards" style="margin-top:10px;">
                <div class="rule-card">
                  <div class="label">Refundability</div>
                  <strong>${rules?.refundable ? "PERMITTED" : "NON-REFUNDABLE"}</strong>
                  <div class="muted">${rules?.refundPenalty ? `Penalty: ${money(rules.refundPenalty, pqr?.currency)}` : "Standard carrier terms apply"}</div>
                </div>
                <div class="rule-card">
                  <div class="label">Ticket Changes</div>
                  <strong>${rules?.changeable ? "PERMITTED" : "CHANGES NOT ALLOWED"}</strong>
                  <div class="muted">${rules?.changePenalty ? `Penalty: ${money(rules.changePenalty, pqr?.currency)}` : "Fare difference may apply"}</div>
                </div>
              </div>

            </div>
          </section>

          <!-- 4. Passengers Table -->
          <section class="panel" style="margin-top:10px">
            <div class="panel-head">Passengers / Travelers</div>
            <div class="panel-body" style="padding:0">
              ${passengerTable(passengers())}
            </div>
          </section>

          <!-- 5. Other Trip Components -->
          <section class="panel" style="margin-top:10px">
            <div class="panel-head"><span>Other Journey Components</span><span>${comps.length}</span></div>
            <div class="panel-body" style="padding:0">
              ${componentTable(comps)}
            </div>
          </section>

        </div>

        <!-- Sidebar Actions -->
        <aside class="panel sticky">
          <div class="panel-head">Operational Actions</div>
          <div class="panel-body action-stack">
            <button class="secondary" data-view="passengers">Passengers / APIS</button>
            <button class="secondary" data-view="services">Seats & Services</button>
            <button class="secondary" data-view="ticketing">Ticketing & Documents</button>
            <button class="secondary" data-view="actions">Changes / Refunds</button>
            <button class="secondary" data-view="history">History & Audit</button>
          </div>
        </aside>
      </div>
    `;
  };

  passengerTable=function(list){
    if(!list.length)return '<div class="empty">No passenger records are linked to this booking yet.</div>';
    return `<table class="data-table"><thead><tr><th>Passenger</th><th>SKANDI Club</th><th>APIS</th><th>Requirements</th><th>Seat</th><th>Check-in</th><th>Boarding</th></tr></thead><tbody>${list.map(p=>{const club=clubFor(p);const req=p.travelRequirementStatus||p.payload?.travelRequirementStatus||"not checked";return `<tr><td><button class="link" data-action="select-passenger" data-passenger-id="${escapeAttr(p.id)}">${escapeHTML(paxName(p))}</button><br><small class="mono muted">${escapeHTML(p.supplierPassengerId||p.passengerRef||"")}</small></td><td>${customerFor(p)?(club?`<span class="badge info">${escapeHTML(club.tier||"MEMBER")}</span><br><small class="mono">${escapeHTML(club.memberNumber||club.memberId||"")}</small>`:`<span class="badge neutral">CUSTOMER LINKED</span>`):'<span class="muted">Not linked</span>'}</td><td><span class="badge ${statusClass(p.apisStatus)}">${escapeHTML(p.apisStatus||"not started")}</span></td><td><span class="badge ${statusClass(req)}">${escapeHTML(req)}</span></td><td class="mono">${escapeHTML(p.seatNumber||"—")}</td><td>${escapeHTML(p.checkinStatus||"not checked in")}</td><td>${escapeHTML(p.boardingStatus||p.payload?.boardingStatus||"not boarded")}</td></tr>`}).join("")}</tbody></table>`;
  };


  const originalPassengerEditor=passengerEditor;
  passengerEditor=function(p){const club=clubFor(p);return `${originalPassengerEditor(p)}<hr style="border:0;border-top:1px solid var(--line);margin:12px 0"><div class="strong">SKANDI Club</div><div style="margin-top:7px">${club?`<div class="money-line"><span>Member</span><strong class="mono">${escapeHTML(club.memberNumber||club.id||"—")}</strong></div><div class="money-line"><span>Tier</span><strong>${escapeHTML(club.tier||"MEMBER")}</strong></div><div class="money-line"><span>Points</span><strong>${escapeHTML(String(club.pointsBalance??club.points??"—"))}</strong></div>`:`<span class="muted">No SKANDI Club profile linked.</span>`}</div><button type="button" class="secondary" style="margin-top:8px" data-view="club">Open SKANDI Club</button>`};


  componentTable=function(items){
    if(!items.length)return '<div class="empty">No trip components selected.</div>';
    return `<table class="data-table"><thead><tr><th>Type</th><th>Service</th><th>Supplier / Ref</th><th>Travel</th><th>Qty</th><th>Amount</th><th>Status</th><th>Actions</th></tr></thead><tbody>${items.map(c=>`<tr><td>${escapeHTML(humanize(c.componentType||c.entityType))}</td><td><strong>${escapeHTML(serviceLabel(c))}</strong></td><td>${escapeHTML(c.supplier||"SKANDI")}<br><small class="mono muted">${escapeHTML(c.supplierReference||c.reference||"")}</small></td><td>${escapeHTML(c.serviceDate||c.startDate||c.payload?.serviceDate||c.city||"—")}</td><td>${escapeHTML(String(c.quantity||1))}</td><td>${money(c.totalAmount,c.currency||booking()?.currency)}</td><td><select class="component-status-select" data-component-id="${escapeAttr(c.id)}"><option ${c.status==="SELECTED"?"selected":""}>SELECTED</option><option ${c.status==="REQUESTED"?"selected":""}>REQUESTED</option><option ${c.status==="CONFIRMED"?"selected":""}>CONFIRMED</option><option ${c.status==="CANCELLED"?"selected":""}>CANCELLED</option></select></td><td class="nowrap"><button class="link" data-action="edit-component" data-component-id="${escapeAttr(c.id)}">Edit</button> · <button class="link" data-action="print-component-voucher" data-component-id="${escapeAttr(c.id)}">Voucher</button> · <button class="link" data-action="remove-component" data-component-id="${escapeAttr(c.id)}">Remove</button></td></tr>`).join("")}</tbody></table>`;
  };


  renderServices=function(){
    const w=workspace();const comps=components();const transferTourInventory=(state.inventory||[]).filter(i=>["TRANSFER","TOUR","ACTIVITY","EXCURSION","HOTEL","PACKAGE","ANCILLARY"].some(x=>normalizedType(i.entityType).includes(x)));
    return `${pageHead("Trip Components","Sell and service SKANDI-owned products together with partner flight, stay and car supply.",!w?.booking?'<button class="primary" data-action="new-local-booking">New SKANDI booking</button>':'<button class="primary" data-view="packagebuilder">Package Builder</button>')}
      <div class="alert info"><span>ℹ</span><div><strong>One master booking</strong>Every service is linked to ${escapeHTML(masterReference())}. Supplier references remain separate underneath the SKANDI master reference.</div></div>
      ${w?.booking?`<section class="panel"><div class="panel-head"><span>Booked / selected components</span><span>${comps.length}</span></div><div class="panel-body" style="padding:0">${componentTable(comps)}</div></section>`:""}
      <section class="panel" style="margin-top:10px"><div class="panel-head"><span>SKANDI Inventory Control catalog</span><span class="muted">Transfers · tours · hotels · packages · ancillaries</span></div><div class="panel-body"><div class="field"><label>Filter catalog</label><input id="inventoryFilter" placeholder="Transfer, Rhodes, tour, hotel..."></div><div id="enterpriseInventoryTable" style="margin:0 -10px -10px">${enterpriseInventoryMarkup(transferTourInventory)}</div></div></section>
      ${state.selectedOffer?`<section class="panel" style="margin-top:10px"><div class="panel-head">Current airline services</div><div class="panel-body" style="padding:0">${serviceListMarkup(state.selectedOffer.availableServices||[])}</div></section><section class="panel" style="margin-top:10px"><div class="panel-head"><span>Live seat maps</span><button class="link" data-action="load-seat-maps">Refresh</button></div><div class="panel-body">${seatMapMarkup()}</div></section>`:""}`;
  };


  function enterpriseInventoryMarkup(items){if(!items.length)return '<div class="empty">No matching published inventory.</div>';return `<table class="data-table"><thead><tr><th>Type</th><th>Product</th><th>Destination</th><th>Price</th><th></th></tr></thead><tbody>${items.map(i=>`<tr><td>${escapeHTML(humanize(i.entityType))}</td><td><strong>${escapeHTML(i.name)}</strong><br><small class="mono muted">${escapeHTML(i.publicId||i.code||"")}</small></td><td>${escapeHTML(i.city||i.destination||i.category||"—")}</td><td>${i.publicPrice?money(i.publicPrice,i.currency||booking()?.currency):'<span class="muted">Quote / rules apply</span>'}</td><td><button class="primary" data-action="add-inventory-component" data-entity-id="${escapeAttr(i.id)}" ${booking()?"":"disabled"}>Add</button></td></tr>`).join("")}</tbody></table>`}

function openSkandiCheckout() {
    const b = booking74();
    if (!b) return;
    
    // Find components that are not yet marked as PAID
    const comps = components74();
    const unpaidComps = comps.filter(c => c.paymentStatus !== "PAID" && c.status !== "CONFIRMED");
    const totalDue = unpaidComps.reduce((sum, c) => sum + Number(c.totalAmount || 0), 0);
    
    if (totalDue <= 0) return toast("Balance is zero", "No pending SKANDI component balances to settle.", "info");

    openModal("SKANDI Checkout & Settlement", `
      <div class="alert info">
        <span>💳</span>
        <div><strong>Secure Agency Collection</strong>Process payment for self-owned inventory (Transfers, Tours, Hotels). Airfares are settled separately with the airline.</div>
      </div>
      
      <table class="data-table" style="margin: 10px 0;">
        <thead><tr><th>Item</th><th>Amount</th></tr></thead>
        <tbody>
          ${unpaidComps.map(c => `<tr><td>${escapeHTML(serviceLabel(c))}</td><td>${money(c.totalAmount, c.currency || b.currency)}</td></tr>`).join("")}
          <tr style="background:#fbfcfd;">
            <td class="right strong">Total Due:</td>
            <td class="strong price-total" style="color:#14804a;">${money(totalDue, b.currency || state.preferences.currency)}</td>
          </tr>
        </tbody>
      </table>

      <div class="field" style="margin-top:15px;">
        <label>Form of Payment</label>
        <select id="checkoutFop">
          <option value="CARD_MOTO">Credit/Debit Card (Manual Entry)</option>
          <option value="PAY_LINK">Send Secure Payment Link</option>
          <option value="CASH">Cash / Bank Transfer</option>
        </select>
      </div>

      <!-- Simulated Stripe Card Input Frame -->
      <div id="motoCardFrame" style="padding:12px; border:1px solid #cbd3da; border-radius:3px; background:#f4f6f8; margin-bottom:10px;">
         <label style="font-size:10px; font-weight:700; color:#425663; display:block; margin-bottom:6px;">CARD DETAILS</label>
         <div style="display:flex; gap:8px;">
            <input placeholder="Card number" style="flex:1; height:32px; padding:0 8px; border:1px solid #aeb9c2;" maxlength="19">
            <input placeholder="MM/YY" style="width:70px; height:32px; padding:0 8px; border:1px solid #aeb9c2;" maxlength="5">
            <input placeholder="CVC" style="width:60px; height:32px; padding:0 8px; border:1px solid #aeb9c2;" maxlength="4">
         </div>
      </div>
    `, [
      { label: "Cancel", className: "secondary", close: true },
      { label: "Charge & Confirm", className: "primary", onClick: () => {
         const fop = document.getElementById("checkoutFop").value;
         closeModal();
         
         // 1. Update all unpaid components to PAID and CONFIRMED
         unpaidComps.forEach(c => {
           post("ALTEA_UPDATE_COMPONENT", { 
             componentId: c.id, 
             patch: { paymentStatus: "PAID", status: "CONFIRMED" } 
           }, { busy: false });
         });

         // 2. Mark master booking as PAID
         post("ALTEA_UPDATE_BOOKING", { bookingId: b.id, patch: { paymentStatus: "PAID" }});
         
         // 3. Log the payment to the history audit trail
         post("ALTEA_ADD_HISTORY_NOTE", { 
           bookingId: b.id, 
           eventType: "AGENCY_PAYMENT_COLLECTED", 
           note: `Collected ${money(totalDue, b.currency)} via ${fop}. Associated components marked as CONFIRMED.` 
         });

         toast("Payment Successful", `Balance settled via ${fop}. Components are now confirmed for boarding.`, "success");
      }}
    ]);

    // Simple toggle logic for the fake card frame
    document.getElementById("checkoutFop").addEventListener("change", (e) => {
      document.getElementById("motoCardFrame").style.display = e.target.value === "CARD_MOTO" ? "block" : "none";
    });
  }
  function renderPackageBuilder(){
    const w=workspace();if(!w?.booking)return `${pageHead("Package Builder","Combine flights, hotels, cars, transfers, tours and SKANDI products under one master reference.",'<button class="primary" data-action="new-local-booking">New SKANDI booking</button>')}
      ${alertBox("info","No booking open","The Package Builder workspace is available. Create or open a master booking to begin adding flight, hotel, car, transfer and tour components.")}
      <div class="grid grid-3">${statCard("Master reference","—","Created when a booking is opened")}${statCard("Trip type","—","Dynamic package / land only")}${statCard("Components","0","No booking selected")}</div>
      <section class="panel" style="margin-top:10px"><div class="panel-head">Package workspace</div><div class="panel-body"><div class="component-cards"><div class="component-card"><strong>Flight</strong><button class="secondary" data-view="search">Search</button><div class="meta">Airline supply.</div></div><div class="component-card"><strong>Hotel</strong><button class="secondary" data-view="hotels">Search</button><div class="meta">Hotel inventory.</div></div><div class="component-card"><strong>Car</strong><button class="secondary" data-view="cars">Search</button><div class="meta">Car Rental.</div></div><div class="component-card"><strong>Transfers & Tours</strong><button class="secondary" data-view="services">Open products</button><div class="meta">SKANDI-owned inventory and package components.</div></div></div></div></section>`;
    const b=w.booking;const comps=components();
    return `${pageHead("Package Builder",`${masterReference()} · ${humanize(bookingType())}`,'<button class="secondary" data-view="services">Add components</button><button class="primary" data-action="print-booking-confirmation">Booking confirmation</button>')}
      <div class="grid grid-4">${statCard("Master reference",masterReference(),"Shown to customer")}${statCard("Trip type",humanize(bookingType()),transferComponents().length?"SKANDI transfer control":"Airline operations supplier controlled")}${statCard("Components",comps.length,"Air + land products")}${statCard("Recorded total",money(packageTotal(),b.currency||state.preferences.currency),"Master booking + component totals")}</div>
      <div class="workspace-layout" style="margin-top:10px"><div>
        <section class="panel"><div class="panel-head">Package classification</div><div class="panel-body"><div class="grid grid-3"><div class="field"><label>Booking type</label><select id="packageBookingType">${["FLIGHT_ONLY","LAND_ONLY","DYNAMIC_PACKAGE","SKANDI_PACKAGE","GROUP_BOOKING"].map(v=>option(v,humanize(v),bookingType())).join("")}</select></div><div class="field"><label>Trip / package title</label><input id="packageTitle" value="${escapeAttr(b.tripTitle||b.payload?.tripTitle||"")}"></div><div class="field"><label>Transfer operations</label><select id="packageTransferControl"><option value="SKANDI" ${String(b.transferControl||"SKANDI")==="SKANDI"?"selected":""}>SKANDI Transfer Control</option><option value="SUPPLIER" ${String(b.transferControl||"")==="SUPPLIER"?"selected":""}>External transfer supplier</option></select></div></div><div class="grid grid-3"><div class="field"><label>Start date</label><input id="packageStart" type="date" value="${escapeAttr(b.departureDate||b.startDate||"")}"></div><div class="field"><label>End date</label><input id="packageEnd" type="date" value="${escapeAttr(b.returnDate||b.endDate||"")}"></div><div class="field"><label>Package status</label><select id="packageStatus">${["DRAFT","OPTION","CONFIRMED","CANCELLED"].map(v=>option(v,humanize(v),normalizedType(b.packageStatus||b.status||"DRAFT"))).join("")}</select></div></div><button class="primary" data-action="save-package">Save package setup</button></div></section>
        <section class="panel" style="margin-top:10px"><div class="panel-head"><span>Package contents</span><span>${comps.length} component(s)</span></div><div class="panel-body"><div class="component-cards">${airComponentCard()}${comps.map(componentCard).join("")||'<div class="muted">No land components selected yet.</div>'}</div></div></section>
      </div><aside class="panel sticky"><div class="panel-head">Customer package</div><div class="panel-body"><div class="master-ref">${escapeHTML(masterReference())}</div><div class="money-line"><span>Passengers</span><strong>${passengers().length}</strong></div><div class="money-line"><span>Air / booking</span><strong>${money(Number(b.totalAmount)||0,b.currency)}</strong></div><div class="money-line"><span>Land components</span><strong>${money(totalComponents(),b.currency)}</strong></div><div class="money-line"><span>Recorded total</span><strong class="price-total">${money(packageTotal(),b.currency)}</strong></div><div class="action-stack" style="margin-top:10px"><button class="primary" data-action="checkout-skandi-balance">Checkout / Settle Balance</button><button class="secondary" data-action="generate-booking-document" data-doc-type="BOOKING_CONFIRMATION">Generate confirmation</button><button class="secondary" data-action="send-booking-document" data-doc-type="BOOKING_CONFIRMATION">Email confirmation</button><button class="secondary" data-view="manifests">Operational manifests</button></div></div></aside></div>`;
  }


  function airComponentCard(){const b=booking();if(!(state.selectedOrder||b?.supplierOrderId||b?.origin))return "";return `<div class="component-card"><div><strong>Flight</strong><br>${escapeHTML([b.origin,b.destination].filter(Boolean).join(" → ")||state.selectedOrder?.route||"Supplier itinerary")}</div><span class="badge info">AIR</span><div class="meta">Supplier locator ${escapeHTML(b.supplierBookingReference||state.selectedOrder?.bookingReference||"—")} · ${money(Number(b.totalAmount)||0,b.currency)}</div></div>`}
  function componentCard(c){return `<div class="component-card"><div><strong>${escapeHTML(serviceLabel(c))}</strong><br>${escapeHTML(humanize(c.componentType||c.entityType))}</div><span class="badge ${statusClass(c.status)}">${escapeHTML(c.status||"SELECTED")}</span><div class="meta">${escapeHTML(c.supplier||"SKANDI")} ${escapeHTML(c.supplierReference||"")} · ${money(c.totalAmount,c.currency||booking()?.currency)}</div></div>`}


  function customerFor(p){
    return p?.payload?.customerProfile||p?.payload?.clubProfile||state.clubProfiles[p?.id]||null;
  }
  function clubFor(p){
    const profile=customerFor(p);
    return profile?.isLoyaltyMember?profile:null;
  }
  function clubSearchRows(){
    const type=state.clubSearchType||"all";
    const membership=state.clubMembershipFilter||"all";
    const q=String($("#clubSearch")?.value||"").trim().toUpperCase();
    return (state.clubSearchResults||[]).filter(m=>{
      if(membership==="members"&&!m.isLoyaltyMember)return false;
      if(membership==="not_enrolled"&&m.isLoyaltyMember)return false;
      if(!q)return true;
      const fields={
        name:`${m.firstName||""} ${m.lastName||""} ${m.name||""}`,
        email:m.email||"",
        club:`${m.memberNumber||""} ${m.tier||""}`,
        member:`${m.memberId||""} ${m.customerProfileId||m.id||""}`,
        all:`${m.firstName||""} ${m.lastName||""} ${m.name||""} ${m.email||""} ${m.memberNumber||""} ${m.memberId||""} ${m.customerProfileId||m.id||""} ${m.tier||""}`
      };
      return String(fields[type]||fields.all).toUpperCase().includes(q);
    });
  }
  function selectedClubCustomer(){
    const rows=state.clubSearchResults||[];
    return rows.find(m=>String(m.customerProfileId||m.id)===String(state.clubSelectedCustomerId))||rows[0]||null;
  }
  function customerInitials(m){
    const first=String(m?.firstName||m?.name||"").trim();
    const last=String(m?.lastName||"").trim();
    return `${first.charAt(0)}${last.charAt(0)||first.charAt(1)||""}`.toUpperCase()||"CU";
  }


  function renderClub(){
    const w=workspace();
    if(!w?.booking)return `${pageHead("SKANDI Club","Connect the booking passenger to the canonical SKANDI customer profile and loyalty record.")}${emptyState("★","No booking selected","Open a booking first.")}`;


    const list=passengers();
    const p=list.find(x=>x.id===state.selectedPassengerId)||list[0]||null;
    if(p)state.selectedPassengerId=p.id;


    const linked=customerFor(p);
    const rows=clubSearchRows();
    const selected=selectedClubCustomer();


    return `${pageHead("SKANDI Club",`${masterReference()} · Customer Management member connect`)}
      <div class="alert info"><span>ℹ</span><div><strong>Customer Management connection</strong>Select a passenger, search the canonical customer database, select a customer row, then connect it to the passenger and booking. Club tier is shown only when that customer is enrolled.</div></div>
      <div class="field" style="max-width:420px">
        <label>Passenger in this booking</label>
        <select id="clubPassenger">${list.map(x=>option(x.id,paxName(x),p?.id)).join("")}</select>
      </div>
      <div class="club-cm-grid">
        <section class="panel club-manifest-panel">
          <div class="panel-head"><span>Customer / SKANDI Club Search</span><span class="muted">${rows.length} result${rows.length===1?"":"s"}</span></div>
          <div class="club-searchbar">
            <select id="clubSearchType">
              ${option("all","All fields",state.clubSearchType)}
              ${option("name","Customer name",state.clubSearchType)}
              ${option("email","Email",state.clubSearchType)}
              ${option("club","Club number / tier",state.clubSearchType)}
              ${option("member","Member / profile ID",state.clubSearchType)}
            </select>
            <input id="clubSearch" placeholder="Search customer, email, member ID or Club number…" autocomplete="off">
            <select id="clubMembershipFilter">
              ${option("all","All customers",state.clubMembershipFilter)}
              ${option("members","Club members",state.clubMembershipFilter)}
              ${option("not_enrolled","Not enrolled",state.clubMembershipFilter)}
            </select>
            <button class="primary" data-action="search-club">Search</button>
            <button class="secondary" data-action="clear-club-search" title="Clear">×</button>
          </div>
          <div class="club-table-wrap">
            ${clubCustomerTable(rows,selected?.customerProfileId||selected?.id||"")}
          </div>
          <div class="club-footer">
            <span>${rows.length} customer${rows.length===1?"":"s"}</span>
            <span>Click row to select · Double-click to connect</span>
            <span class="spacer"></span>
            <span class="mono">${linked?`CONNECTED ${escapeHTML(linked.memberNumber||linked.memberId||"PROFILE")}`:"NOT CONNECTED"}</span>
          </div>
        </section>
        <aside class="panel" id="clubProfilePanel">
          ${clubCustomerProfileMarkup(p,selected,linked)}
        </aside>
      </div>`;
  }


  function clubCustomerTable(rows,selectedId){
    if(!rows.length)return `<div class="empty"><div class="big">★</div><strong>No customer profiles match</strong><br><span>Change the search or membership filter.</span></div>`;
    return `<table class="data-table club-table"><thead><tr><th>Customer</th><th>Email</th><th>Club</th><th>Tier</th><th>Status</th></tr></thead><tbody>
      ${rows.map(m=>{
        const id=m.customerProfileId||m.id;
        return `<tr data-club-customer="${escapeAttr(id)}" class="${String(id)===String(selectedId)?"selected":""}">
          <td><strong>${escapeHTML(m.name||[m.firstName,m.lastName].filter(Boolean).join(" ")||"Customer")}</strong><br><small class="mono muted">${escapeHTML(m.memberId||id)}</small></td>
          <td>${escapeHTML(m.email||"—")}</td>
          <td>${m.isLoyaltyMember?`<span class="club-chip customer">${escapeHTML(m.memberNumber||"MEMBER")}</span>`:'<span class="muted">Not enrolled</span>'}</td>
          <td>${m.isLoyaltyMember?`<span class="club-chip tier">${escapeHTML(m.tier||"Member")}</span>`:"—"}</td>
          <td><span class="badge ${statusClass(m.status)}">${escapeHTML(m.status||"Active")}</span></td>
        </tr>`;
      }).join("")}
    </tbody></table>`;
  }


  function clubCustomerProfileMarkup(p,profile,linked){
    if(!p)return `<div class="panel-head">Customer Profile</div><div class="panel-body subtle">Select a passenger first.</div>`;
    if(!profile){
      return `<div class="panel-head">Customer Profile</div><div class="panel-body">${emptyState("♙","Select a customer","Search or select a customer row to view the profile and connect it to ${paxName(p)}.")}</div>`;
    }
    const isConnected=String(linked?.customerProfileId||linked?.id||"")===String(profile.customerProfileId||profile.id||"");
    const membership=profile.isLoyaltyMember
      ? `<span class="club-chip tier">${escapeHTML(profile.tier||"Member")}</span>`
      : `<span class="club-chip">NOT ENROLLED</span>`;
    return `<div class="panel-head">Customer Profile <span class="spacer"></span>${isConnected?'<span class="badge success">CONNECTED</span>':'<span class="badge neutral">AVAILABLE</span>'}</div>
      <div class="club-profile">
        <div class="club-profile-banner">
          <div class="club-avatar">${escapeHTML(customerInitials(profile))}</div>
          <div class="club-profile-title">
            <h2>${escapeHTML(profile.name||"Customer")}</h2>
            <div class="sub">${escapeHTML(profile.email||profile.memberId||profile.customerProfileId||"")}</div>
            <div class="club-chips">${membership}${profile.customerType?`<span class="club-chip customer">${escapeHTML(profile.customerType)}</span>`:""}</div>
          </div>
          <div class="club-status-box"><span>Customer</span><strong>${escapeHTML(profile.status||"Active")}</strong></div>
        </div>
        <div class="club-detail-grid">
          <div class="club-detail"><span class="muted">Customer profile ID</span><b class="mono">${escapeHTML(profile.customerProfileId||profile.id||"—")}</b></div>
          <div class="club-detail"><span class="muted">Member ID</span><b class="mono">${escapeHTML(profile.memberId||"—")}</b></div>
          <div class="club-detail"><span class="muted">SKANDI Club number</span><b>${escapeHTML(profile.memberNumber||"Not enrolled")}</b></div>
          <div class="club-detail"><span class="muted">Tier</span><b>${escapeHTML(profile.isLoyaltyMember?profile.tier||"Member":"Not enrolled")}</b></div>
          <div class="club-detail"><span class="muted">Email</span><b>${escapeHTML(profile.email||"—")}</b></div>
          <div class="club-detail"><span class="muted">Passenger</span><b>${escapeHTML(paxName(p))}</b></div>
        </div>
        <div class="club-profile-actions">
          <button class="primary" data-action="link-club" data-customer-profile-id="${escapeAttr(profile.customerProfileId||profile.id||"")}" ${isConnected?"disabled":""}>${isConnected?"Connected":"Connect to passenger"}</button>
          <button class="secondary" data-action="search-club">Refresh customer search</button>
        </div>
        ${profile.isLoyaltyMember?`<div class="panel-body" style="border-top:1px solid var(--line)"><div class="money-line"><span>Club tier</span><strong>${escapeHTML(profile.tier||"Member")}</strong></div><div class="money-line"><span>Recorded points</span><strong>${escapeHTML(String(profile.pointsBalance??0))}</strong></div></div>`:""}
      </div>`;
  }




  renderRequirements=function(){
    const w=workspace();const list=passengers();const p=list.find(x=>x.id===state.selectedPassengerId)||list[0]||null;const decision=state.travelDecision;const provider=state.travelRequirementsProvider||"Provider not connected";
    return `${pageHead("Travel Requirements",`${provider} · passenger document and itinerary check`,'<button class="secondary" data-action="open-timatic-desk">Open Timatic Desk</button>')}${!provider||provider==="Provider not connected"?alertBox("warning","Live regulatory provider not confirmed","SKANDI guidance can still be shown, but no result is represented as a live Timatic decision until the parent bridge identifies an authorized provider."):alertBox("info","Live provider adapter",`Current provider: ${provider}. Results are stored against the passenger and booking for audit.`)}
      ${w?.booking?`<section class="panel"><div class="panel-head">Passenger enquiry</div><div class="panel-body"><div class="grid grid-4"><div class="field"><label>Passenger</label><select id="reqPassenger">${list.map(x=>option(x.id,paxName(x),p?.id)).join("")}</select></div><div class="field"><label>Nationality</label><input id="reqNationality" maxlength="3" value="${escapeAttr(p?.nationality||"")}"></div><div class="field"><label>Residence country</label><input id="reqResidence" maxlength="3" value="${escapeAttr(p?.residenceCountry||p?.payload?.residenceCountry||"")}"></div><div class="field"><label>Date of birth</label><input id="reqDob" type="date" value="${escapeAttr(p?.dateOfBirth||"")}"></div></div><div class="grid grid-4"><div class="field"><label>Origin</label><input id="reqOrigin" maxlength="3" value="${escapeAttr(w.booking.origin||"")}"></div><div class="field"><label>Destination</label><input id="reqDestination" maxlength="3" value="${escapeAttr(w.booking.destination||"")}"></div><div class="field"><label>Passport issuing country</label><input id="reqIssue" maxlength="3" value="${escapeAttr(p?.passportCountry||p?.payload?.passportCountry||"")}"></div><div class="field"><label>Passport expiry</label><input id="reqExpiry" type="date" value="${escapeAttr(p?.passportExpiry||p?.payload?.passportExpiry||"")}"></div></div><div class="field"><label>Transit points (IATA, comma-separated)</label><input id="reqTransit" placeholder="LHR, DOH"></div><button class="primary" data-action="check-requirements">Check requirements</button></div></section>`:emptyState("✓","No booking selected","Open a booking before checking a passenger.")}
      ${decision?travelDecisionMarkup(decision):""}<section class="panel" style="margin-top:10px"><div class="panel-head">Published SKANDI guidance</div><div class="panel-body"><div class="grid grid-2">${(state.requirements||[]).map(r=>`<section class="panel"><div class="panel-head"><span>${escapeHTML(r.title||"Requirement")}</span><span class="badge info">${escapeHTML(r.category||"GUIDANCE")}</span></div><div class="panel-body">${escapeHTML(r.body||"").replace(/\n/g,"<br>")}</div></section>`).join("")||'<span class="muted">No internal guidance records published.</span>'}</div></div></section>`;
  };
  function travelDecisionMarkup(d){const status=normalizedType(d.status||d.decision||"REVIEW");const tone=status.includes("CLEAR")||status.includes("OK")?"go":status.includes("STOP")||status.includes("DENIED")?"stop":"review";return `<section class="decision ${tone}" style="margin-top:10px"><div class="muted">${escapeHTML(d.provider||state.travelRequirementsProvider||"Requirements provider")} · ${escapeHTML(d.reference||"")}</div><h2>${escapeHTML(humanize(status))}</h2><div>${escapeHTML(d.summary||d.message||"No summary returned.")}</div>${Array.isArray(d.sections)?`<div style="margin-top:10px">${d.sections.map(s=>`<div class="money-line"><span>${escapeHTML(s.title||s.category||"Requirement")}</span><strong>${escapeHTML(s.status||"")}</strong></div>`).join("")}</div>`:""}</section>`}


  renderTicketing = function() {
    const w = activeWorkspace(), order = state.selectedOrder;
    if (!w?.booking && !order) {
      return `${pageHead("Ticketing & Documents", "Supplier-issued air documents plus SKANDI customer documents and vouchers.")}
              ${emptyState("▥", "No booking selected", "Open a booking first.")}`;
    }
    
    const supplierDocs = order?.documents || [];
    const internalDocs = w?.documents || [];
    const comps = components();

    return `${pageHead("Ticketing & Documents", `${masterReference()} · document center`, '<button class="primary" data-action="print-booking-confirmation">Print confirmation</button>')}
      <div class="alert info"><span>ℹ</span><div><strong>Document authority</strong>Airline ticket/EMD identifiers are displayed from the operating supplier. SKANDI generates booking confirmations, vouchers, and transfer boarding cards.</div></div>
      
      <!-- NEW: Electronic Ticket Record (ETR) / Coupons -->
      <section class="panel" style="margin-top:10px">
        <div class="panel-head">
          <span>Electronic Ticket Record (ETR) · Coupons</span>
          <span class="mono">TWD/HK</span>
        </div>
        <div class="panel-body" style="padding:0">
          ${ticketCouponTable(w, order)}
        </div>
      </section>

      <div class="grid grid-2" style="margin-top:10px">
        <section class="panel">
          <div class="panel-head"><span>Supplier air documents</span><span>${supplierDocs.length}</span></div>
          <div class="panel-body" style="padding:0">${documentTable(supplierDocs)}</div>
        </section>
        <section class="panel">
          <div class="panel-head"><span>SKANDI document register</span><span>${internalDocs.length}</span></div>
          <div class="panel-body" style="padding:0">${internalDocumentTable(internalDocs)}</div>
        </section>
      </div>

      <section class="panel" style="margin-top:10px">
        <div class="panel-head">Generate / send customer documents</div>
        <div class="panel-body">
          <div class="document-actions">
            <button class="secondary" data-action="generate-booking-document" data-doc-type="BOOKING_CONFIRMATION">Booking confirmation</button>
            <button class="secondary" data-action="generate-booking-document" data-doc-type="ITINERARY">Trip itinerary</button>
            <button class="secondary" data-action="generate-booking-document" data-doc-type="INVOICE">Invoice / receipt</button>
            <button class="secondary" data-action="send-booking-document" data-doc-type="BOOKING_CONFIRMATION">Email confirmation</button>
            <button class="secondary" data-action="print-passenger-manifest">Passenger list</button>
          </div>
        </div>
      </section>

      <section class="panel" style="margin-top:10px">
        <div class="panel-head">Component vouchers</div>
        <div class="panel-body" style="padding:0">
          ${comps.length ? `<table class="data-table"><thead><tr><th>Service</th><th>Supplier</th><th>Status</th><th>Voucher</th></tr></thead><tbody>${comps.map(c=>`<tr><td>${escapeHTML(serviceLabel(c))}</td><td>${escapeHTML(c.supplier||"SKANDI")}</td><td>${escapeHTML(c.status||"")}</td><td><button class="link" data-action="print-component-voucher" data-component-id="${escapeAttr(c.id)}">Print</button> · <button class="link" data-action="send-component-voucher" data-component-id="${escapeAttr(c.id)}">Send</button></td></tr>`).join("")}</tbody></table>` : '<div class="empty">No package components require vouchers.</div>'}
        </div>
      </section>
    `;
  };

  function ticketCouponTable(w, order) {
    const flights = w?.booking?.flightDetails?.segments || (order ? syncFlightDataToBooking(w?.booking || {}, order).flightDetails?.segments : []);
    const pax = w?.passengers || order?.passengers || [];
    const docs = order?.documents || [];

    if (!flights?.length || !pax.length) return '<div class="empty">No e-ticket coupons found. Airline order required.</div>';

    const rows = [];
    pax.forEach((p, pIdx) => {
      // Find the document associated with this passenger, fallback to PENDING
      const doc = docs.find(d => d.passengerIds?.includes(p.id)) || docs[pIdx] || { uniqueIdentifier: "PENDING ISSUE" };
      
      flights.forEach((seg, sIdx) => {
        // Simple mock to check if flight has departed to set coupon to FLOWN
        const isFlown = new Date(seg.departingAt) < new Date();
        const status = isFlown ? "FLOWN" : "OPEN FOR USE";
        const badgeColor = isFlown ? "neutral" : "success";

        rows.push(`
          <tr>
            <td><strong>${escapeHTML(paxName(p))}</strong></td>
            <td class="mono" style="color:#005eb8; font-weight:bold;">${escapeHTML(doc.uniqueIdentifier)}</td>
            <td class="mono">CPN ${sIdx + 1}</td>
            <td><strong>${escapeHTML(seg.flightNumber)}</strong></td>
            <td>${escapeHTML(seg.origin)} → ${escapeHTML(seg.destination)}</td>
            <td>${escapeHTML(formatShortDate(seg.departingAt))}</td>
            <td><span class="badge ${badgeColor}">${status}</span></td>
          </tr>
        `);
      });
    });

    return `<table class="data-table">
      <thead><tr><th>Passenger</th><th>Ticket Number</th><th>Coupon</th><th>Flight</th><th>Route</th><th>Date</th><th>Coupon Status</th></tr></thead>
      <tbody>${rows.join("")}</tbody>
    </table>`;
  }


  renderBaggageBoarding=function(){return renderDepartureControl()};


  /* --------------------------- Charter Transfer DCS --------------------------- */
  state.transferDcsDirection = state.transferDcsDirection || "INBOUND";

  /* --------------------------- Charter Transfer DCS --------------------------- */
  state.transferDcsDirection = state.transferDcsDirection || "INBOUND";

  function transferComponents(){return components().filter(c=>normalizedType(c.componentType||c.entityType).includes("TRANSFER"))}
  
  function normalizeTransferDeparture(raw, index = 0) {
    const p = raw?.payload || {}; 
    const b = booking();
    
    let status = normalizedType(raw?.transferStatus || raw?.operationalStatus || p.transferStatus || p.operationalStatus || raw?.status || "OPEN");
    if (["CONFIRMED","BOOKED","ACTIVE","PUBLISHED"].includes(status)) status = "OPEN";
    
    const ref = raw?.serviceNumber || raw?.transferNumber || p.serviceNumber || p.transferNumber || raw?.supplierReference || p.reference || `TRF-${String(masterReference()).replace(/[^A-Z0-9]/gi,"").slice(-5).toUpperCase()||"SK"}-${String(index+1).padStart(2,"0")}`;
    const origin = String(raw?.pickupLocation || raw?.origin || p.pickupLocation || p.pickupPoint || p.from || p.origin || b?.origin || "Airport / Point A");
    const destination = String(raw?.dropoffLocation || raw?.destination || p.dropoffLocation || p.dropoffPoint || p.hotelName || p.to || p.destination || b?.destination || "Hotel / Point B");
    const date = raw?.serviceDate || raw?.startDate || p.serviceDate || p.pickupDate || b?.departureDate || b?.startDate || "";
    const scheduled = raw?.serviceTime || raw?.pickupTime || p.pickupTime || p.serviceTime || p.scheduledDeparture || "10:00";
    
    // Charter Logic: Determine Direction INBOUND (Airport -> Resort) vs OUTBOUND (Resort -> Airport)
    let direction = p.direction || raw?.direction || "";
    if (!direction) {
      if (/^[A-Z]{3}$/i.test(origin) || origin.toLowerCase().includes("airport") || origin.toLowerCase().includes("apt")) direction = "INBOUND";
      else direction = "OUTBOUND";
    }

    const localState = state.transferDcsDepartureState[raw?.id || ref] || {};
    
    return {
      id: String(raw?.id || raw?.componentId || ref),
      componentId: raw?.componentId || raw?.id || "",
      bookingId: raw?.bookingId || b?.id || "",
      serviceNumber: String(ref),
      direction: direction.toUpperCase(),
      origin: origin,
      destination: destination,
      date: String(date),
      scheduled: String(scheduled),
      estimated: String(localState.estimated || raw?.estimatedDeparture || p.estimatedDeparture || scheduled),
      bay: String(localState.bay || raw?.bay || p.bay || p.meetingPoint || p.pickupMeetingPoint || (direction === "INBOUND" ? "Arrivals Hall" : "Hotel Lobby")),
      vehicle: String(localState.vehicle || raw?.vehicleName || raw?.vehicleType || p.vehicleName || p.vehicleType || p.coachType || "Standard Coach"),
      vehicleRegistration: String(localState.vehicleRegistration || raw?.vehicleRegistration || p.vehicleRegistration || ""),
      capacity: Number(localState.capacity || raw?.capacity || p.capacity || p.vehicleCapacity || 55) || 55,
      booked: Number(raw?.passengerCount || p.passengerCount || passengers().length || 0),
      driver: String(localState.driver || raw?.driverName || p.driverName || "Pending"),
      guide: String(localState.guide || raw?.guideName || p.guideName || p.hostName || "Pending"),
      associatedFlight: String(raw?.associatedFlight || p.associatedFlight || p.arrivalFlightNumber || p.departureFlightNumber || p.flightNumber || b?.flightNumber || "SK" + Math.floor(100+Math.random()*800)),
      status: String(localState.status || status || "OPEN"),
      raw
    };
  }

  function transferDepartures() {
    const live = Array.isArray(state.transferDcsDepartures) ? state.transferDcsDepartures : [];
    const local = transferComponents();
    const all = [...live, ...local];
    const seen = new Set();
    return all.map(normalizeTransferDeparture).filter(d => {
      const k = d.id || d.serviceNumber;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }

  function selectedTransferDeparture() {
    const list = transferDepartures();
    let dep = list.find(d => d.id === state.transferDcsSelectedDepartureId) || list.find(d => d.direction === state.transferDcsDirection) || list[0] || null;
    if (dep && !state.transferDcsSelectedDepartureId) state.transferDcsSelectedDepartureId = dep.id;
    return dep;
  }

  function transferPassengers(dep) {
    if (!dep) return [];
    const raw = dep.raw || {};
    if (Array.isArray(raw.passengers) && raw.passengers.length) return raw.passengers;
    if (Array.isArray(raw.payload?.passengers) && raw.payload.passengers.length) return raw.payload.passengers;
    if (!workspace()?.booking) return [];
    return passengers();
  }

  function transferPaxState(dep, p) {
    if (!dep || !p) return { acceptance: "BOOKED", boarding: "NOT_BOARDED", seat: "", bags: 0, weight: 0, boardedAt: "" };
    const depId = dep.id, pid = p.id || p.passengerId || p.passengerRef || paxName(p);
    const saved = state.transferDcsPassengerState[depId]?.[pid] || {};
    const source = p.transferDcs?.[depId] || p.payload?.transferDcs?.[depId] || {};
    return {
      acceptance: normalizedType(saved.acceptance || source.acceptance || source.status || "BOOKED"),
      boarding: normalizedType(saved.boarding || source.boarding || "NOT_BOARDED"),
      seat: String(saved.seat || source.seat || ""),
      bags: Number(saved.bags ?? source.bags ?? p.baggageCount ?? p.payload?.baggageCount ?? 0) || 0,
      weight: Number(saved.weight ?? source.weight ?? p.baggageWeight ?? p.payload?.baggageWeight ?? 0) || 0,
      boardedAt: String(saved.boardedAt || source.boardedAt || ""),
      voucherVerified: Boolean(saved.voucherVerified ?? source.voucherVerified ?? false),
      remarks: String(saved.remarks || source.remarks || "")
    };
  }

  function transferPaxId(p) { return String(p?.id || p?.passengerId || p?.passengerRef || paxName(p)); }
  function transferSelectedPax(dep) {
    const list = transferPassengers(dep);
    const id = state.transferDcsSelectedPassengerId;
    return list.find(p => transferPaxId(p) === id) || list[0] || null;
  }

  function transferStats(dep) {
    const list = transferPassengers(dep);
    const states = list.map(p => transferPaxState(dep, p));
    return {
      booked: list.length || dep?.booked || 0,
      accepted: states.filter(x => ["ACCEPTED", "BOARDED"].includes(x.acceptance) || x.boarding === "BOARDED").length,
      boarded: states.filter(x => x.boarding === "BOARDED").length,
      waitlist: states.filter(x => x.acceptance === "WAITLIST").length,
      noshow: states.filter(x => x.acceptance === "NO_SHOW").length,
      bags: states.reduce((a, x) => a + x.bags, 0)
    };
  }

  function transferStatusBadge(status) {
    status = normalizedType(status || "OPEN");
    const cls = ["OPEN", "BOARDING", "READY"].includes(status) ? "success" : ["DELAYED", "WAITLIST", "HOLD"].includes(status) ? "warning" : ["CLOSED", "CANCELLED"].includes(status) ? "danger" : "neutral";
    return `<span class="badge ${cls}">${escapeHTML(humanize(status))}</span>`;
  }

  function transferDcsTabs() {
    const tabs = [
      ["departures", "▦", "Airport Day Dashboard"],
      ["acceptance", "▤", "Customer Check-off"],
      ["boarding", "▶", "Coach Boarding / Scanner"],
      ["seats", "▦", "Coach Seat Map"],
      ["activity", "≡", "Operations Log"]
    ];
    return `<div class="transfer-dcs-tabs">${tabs.map(([id, icon, label]) => `<button class="transfer-dcs-tab ${state.transferDcsTab === id ? "active" : ""}" data-transfer-dcs-tab="${id}">${icon} ${label}</button>`).join("")}</div>`;
  }

  function renderDepartureControl() {
    const dep = selectedTransferDeparture();
    const stats = dep ? transferStats(dep) : { booked: 0, accepted: 0, boarded: 0, bags: 0 };
    return `${pageHead("Departure Control", dep ? `${dep.serviceNumber} · ${dep.direction} · ${dep.origin} → ${dep.destination}` : "Charter Transfer Operations Dashboard", '<button class="secondary" data-action="refresh-transfer-dcs">Refresh schedule</button>')}
      ${alertBox("info", "Tour Operator Transfer Control", "Handle massive airport days with inbound (arrival) and outbound (departure) filters. Link passengers arriving on flights directly to their assigned resort coaches.")}
      ${transferDcsTabs()}
      ${state.transferDcsTab !== "departures" ? `<div class="dcs-summary">${statCard("Direction", dep?.direction || "—", "Operations flow")}${statCard("Booked", stats.booked, "Manifest total")}${statCard("Checked Off", stats.accepted, "At meeting point")}${statCard("Boarded", stats.boarded, `${stats.bags} luggage piece(s)`)}</div>` : ""}
      ${renderTransferDcsTab(dep)}`;
  }

  function renderTransferDcsTab(dep) {
    if (state.transferDcsTab === "departures") return renderTransferDepartures();
    if (!dep) return `<section class="panel"><div class="panel-head">${escapeHTML(humanize(state.transferDcsTab))}</div><div class="panel-body">${emptyState("▰", "No transfer departure selected", "Load today's transfer departures from the Airport Day Dashboard.")}</div></section>`;
    if (state.transferDcsTab === "acceptance") return renderTransferAcceptance(dep);
    if (state.transferDcsTab === "seats") return renderTransferSeatControl(dep);
    if (state.transferDcsTab === "boarding") return renderTransferBoarding(dep);
    return renderTransferActivity(dep);
  }

  function renderTransferDepartures() {
    const list = transferDepartures();
    const dir = state.transferDcsDirection;
    const filtered = list.filter(d => d.direction === dir);
    
    return `<section class="panel">
      <div class="panel-head">Airport Day Operations</div>
      <div class="panel-body" style="padding:10px 10px 0 10px;">
        <div class="transfer-dashboard-filter">
          <button class="${dir === "INBOUND" ? "active inbound" : ""}" data-action="set-transfer-direction" data-dir="INBOUND">
            ▼ INBOUND: Flights Arriving ➔ Coaches to Resort
          </button>
          <button class="${dir === "OUTBOUND" ? "active outbound" : ""}" data-action="set-transfer-direction" data-dir="OUTBOUND">
            ▲ OUTBOUND: Coaches from Resort ➔ Flights Departing
          </button>
        </div>
      </div>
      <div class="panel-body" style="padding:0">
        ${filtered.length ? `
        <table class="data-table">
          <thead>
            <tr>
              <th>Coach / Service</th>
              <th>Flight Link</th>
              <th>Routing / Stops</th>
              <th>Time</th>
              <th>Load</th>
              <th>Driver / Host</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map(dep => {
              const st = transferStats(dep);
              const pct = Math.min(100, Math.round((st.booked / Math.max(1, dep.capacity)) * 100));
              const badgeClass = dep.direction === "INBOUND" ? "inbound" : "outbound";
              return `<tr class="${dep.id === state.transferDcsSelectedDepartureId ? "selected" : ""}">
                <td>
                  <strong class="mono" style="font-size:13px;">${escapeHTML(dep.serviceNumber)}</strong><br>
                  <span class="dir-badge ${badgeClass}">${dep.direction}</span>
                </td>
                <td>
                  <div class="transfer-flight-ref">Flight ${escapeHTML(dep.associatedFlight)}</div>
                  <small class="muted">${dep.direction === "INBOUND" ? "Arriving Pax" : "Departing Pax"}</small>
                </td>
                <td>
                  <div class="route-timeline">
                    <div class="route-stop">${escapeHTML(dep.origin)}</div>
                    <div class="route-line"></div>
                    <div class="route-stop">${escapeHTML(dep.destination)}</div>
                  </div>
                  <div class="transfer-sub">Meeting point: ${escapeHTML(dep.bay)}</div>
                </td>
                <td>
                  <div class="mono strong">${escapeHTML(dep.scheduled)}</div>
                  <small class="muted">Date: ${escapeHTML(dep.date || "Today")}</small>
                </td>
                <td>
                  <div class="transfer-load">
                    <strong>${st.booked}/${dep.capacity}</strong> · ${st.accepted} accepted
                    <div class="transfer-load-track"><div class="transfer-load-fill" style="width:${pct}%"></div></div>
                  </div>
                </td>
                <td>${escapeHTML(dep.driver)}<br><small>${escapeHTML(dep.guide)}</small></td>
                <td>${transferStatusBadge(dep.status)}</td>
                <td><button class="primary" data-action="select-transfer-departure" data-departure-id="${escapeAttr(dep.id)}">Open Coach</button></td>
              </tr>`;
            }).join("")}
          </tbody>
        </table>` : emptyState("🚌", `No ${dir} coaches found`, "No transfer operations match this direction for the selected date/booking.")}
      </div>
    </section>`;
  }

  function renderTransferAcceptance(dep) {
    const list = transferPassengers(dep);
    const p = transferSelectedPax(dep);
    return `<div class="workspace-layout">
      <section class="panel">
        <div class="panel-head">
          <span>Customer Check-off · Coach ${escapeHTML(dep.serviceNumber)}</span>
          <span>${list.length} pax</span>
        </div>
        <div class="toolbar">
          <div class="field" style="margin:0;min-width:180px">
            <label>Filter Status</label>
            <select id="transferAcceptanceFilter">
              <option value="ALL">All customers</option>
              <option value="BOOKED">Expected / Not arrived</option>
              <option value="ACCEPTED">Checked off</option>
              <option value="WAITLIST">Waitlist / Overflow</option>
              <option value="NO_SHOW">No show</option>
            </select>
          </div>
          <span class="muted">Rep Meeting Point: <strong>${escapeHTML(dep.bay)}</strong> · Flight: <strong>${escapeHTML(dep.associatedFlight)}</strong></span>
        </div>
        <div class="panel-body" style="padding:0">${transferAcceptanceTable(dep, list)}</div>
      </section>
      <aside class="panel sticky">
        <div class="panel-head">Selected Customer</div>
        <div class="panel-body">${p ? transferCustomerPanel(dep, p) : '<span class="muted">Select a customer.</span>'}</div>
      </aside>
    </div>`;
  }

  function transferAcceptanceTable(dep, list) {
    if (!list.length) return '<div class="empty">No customers assigned to this transfer departure.</div>';
    return `<table class="data-table">
      <thead><tr><th>SEQ</th><th>Customer</th><th>Booking</th><th>Hotel / Stop</th><th>Seat</th><th>Check-off</th><th>Luggage</th><th>Boarding</th><th></th></tr></thead>
      <tbody>
        ${list.map((p, i) => {
          const st = transferPaxState(dep, p);
          const ref = p.bookingReference || p.pnrLocator || masterReference();
          const hotel = p.hotelName || p.payload?.hotelName || (dep.direction === "INBOUND" ? dep.destination : dep.origin);
          return `<tr data-transfer-status="${escapeAttr(st.acceptance)}">
            <td class="mono">${String(i+1).padStart(3,"0")}</td>
            <td><strong>${escapeHTML(paxName(p))}</strong></td>
            <td class="mono">${escapeHTML(ref)}</td>
            <td>${escapeHTML(hotel)}</td>
            <td class="mono">${escapeHTML(st.seat || "—")}</td>
            <td>${transferStatusBadge(st.acceptance)}</td>
            <td>${st.bags} pc</td>
            <td>${transferStatusBadge(st.boarding)}</td>
            <td><button class="link" data-action="select-transfer-passenger" data-passenger-id="${escapeAttr(transferPaxId(p))}">Manage</button></td>
          </tr>`;
        }).join("")}
      </tbody>
    </table>`;
  }

  function transferCustomerPanel(dep, p) {
    const st = transferPaxState(dep, p);
    const ref = p.bookingReference || p.pnrLocator || masterReference();
    const hotel = p.hotelName || p.payload?.hotelName || (dep.direction === "INBOUND" ? dep.destination : dep.origin);
    return `<div class="transfer-profile">
      <div class="transfer-profile-head">
        <div class="transfer-profile-name">${escapeHTML(paxName(p))}</div>
        <div class="transfer-profile-ref">${escapeHTML(ref)} · ${escapeHTML(dep.serviceNumber)}</div>
      </div>
      <div class="money-line"><span>Flight</span><strong>${escapeHTML(dep.associatedFlight)}</strong></div>
      <div class="money-line"><span>Hotel / Stop</span><strong>${escapeHTML(hotel)}</strong></div>
      <div class="money-line"><span>Coach Seat</span><strong>${escapeHTML(st.seat || "Unassigned")}</strong></div>
      <div class="money-line"><span>Check-off</span><strong>${escapeHTML(humanize(st.acceptance))}</strong></div>
      <div class="money-line"><span>Luggage</span><strong>${st.bags} pc${st.weight ? ` · ${st.weight} kg` : ""}</strong></div>
      <div class="dcs-toolbar">
        <button class="primary" data-action="transfer-accept">Check-off Pax</button>
        <button class="secondary" data-action="transfer-bag">Luggage</button>
        <button class="secondary" data-action="transfer-seat">Assign Seat</button>
        <button class="secondary" data-action="transfer-card">Boarding Card</button>
        <button class="warning-btn secondary" data-action="transfer-waitlist">Overflow Bus</button>
        <button class="danger-btn" data-action="transfer-noshow">No Show</button>
      </div>
    </div>`;
  }

  function renderTransferSeatControl(dep) {
    const list = transferPassengers(dep);
    const selected = transferSelectedPax(dep);
    const rows = Math.ceil(Math.max(4, dep.capacity) / 4);
    const occupied = new Map();
    list.forEach(p => {
      const st = transferPaxState(dep, p);
      if (st.seat && st.acceptance !== "NO_SHOW") occupied.set(st.seat, p);
    });

    return `<div class="workspace-layout">
      <section class="panel">
        <div class="panel-head">
          <span>Coach Space Control · ${escapeHTML(dep.vehicle)}</span>
          <span>${occupied.size}/${dep.capacity} assigned</span>
        </div>
        <div class="panel-body" style="padding:0">
          <div class="svc-body" style="display: block; min-height: auto;">
            <div class="seat-legend" style="display: flex; flex-wrap: wrap; align-items: center; gap: 15px; border-right: none; border-bottom: 1px solid #d2d8de; background: #fafafa;">
              <div style="font-weight: 800; color: #173f5c; margin-right: 5px;">LEGEND:</div>
              <div class="legend-row" style="margin:0;"><span class="legend-swatch selected">P1</span>Selected Customer</div>
              <div class="legend-row" style="margin:0;"><span class="legend-swatch" style="background:#3d6581; color:#fff; border-color:#28465b">P2</span>Occupied</div>
              <div class="legend-row" style="margin:0;"><span class="legend-swatch"></span>Available</div>
              <div class="legend-row" style="margin:0;"><span class="legend-swatch blocked">X</span>Capacity Blocked</div>
            </div>
            <div class="aircraft-canvas" style="padding: 20px; overflow-x: auto;">
              <div class="cabin-title" style="text-align: left; margin-bottom: 10px; font-weight: bold; color: #173f5c;">
                CABIN SEATING · ${escapeHTML(dep.serviceNumber)} (${escapeHTML(dep.vehicle)})
              </div>
              <div style="display: inline-flex; flex-direction: row; gap: 6px; align-items: flex-start; background: #f4f7f9; padding: 15px 25px 15px 15px; border-radius: 40px 10px 10px 40px; border: 2px solid #cbd3da;">
                <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; margin-right: 10px; padding-top: 30px;">
                   <span style="writing-mode: vertical-rl; transform: rotate(180deg); color: #798891; font-weight: 800; font-size: 11px; letter-spacing: 4px;">FRONT</span>
                </div>
                ${Array.from({ length: rows }, (_, i) => {
                  const row = i + 1;
                  return `<div style="display: flex; flex-direction: column; gap: 4px; align-items: center;">
                      <span class="row-number" style="margin-bottom: 3px;">${row}</span>
                      ${transferSeatButton(dep, `${row}A`, occupied, list)}
                      ${transferSeatButton(dep, `${row}B`, occupied, list)}
                      <div style="height: 16px;"></div>
                      ${transferSeatButton(dep, `${row}C`, occupied, list)}
                      ${transferSeatButton(dep, `${row}D`, occupied, list)}
                      <span class="row-number" style="margin-top: 3px;">${row}</span>
                    </div>`;
                }).join("")}
              </div>
            </div>
          </div>
        </div>
      </section>
      <aside class="panel sticky">
        <div class="panel-head">Selected Customer</div>
        <div class="panel-body">
          ${selected ? `${transferCustomerPanel(dep, selected)}<button class="primary" style="margin-top:8px; width:100%" data-action="transfer-auto-seat">Auto-assign Next Seat</button>` : '<span class="muted">Select a customer in Customer Check-off.</span>'}
        </div>
      </aside>
    </div>`;
  }

  function transferSeatButton(dep, seat, occupied, list) {
    const p = occupied.get(seat);
    const currentPaxId = state.transferDcsSelectedPassengerId || state.selectedPassengerId;
    const isCurrentPax = p && transferPaxId(p) === currentPaxId;
    const n = parseInt(seat, 10);
    const blocked = n * 4 > dep.capacity;
    let badge = "";
    if (p) {
      const idx = Array.isArray(list) ? list.indexOf(p) : -1;
      badge = `<span class="seat-pax-badge">${idx >= 0 ? `P${idx + 1}` : "✓"}</span>`;
    }
    return `<button type="button" 
      class="seat-cell ${p ? "occupied" : ""} ${isCurrentPax ? "selected" : ""} ${blocked ? "blocked" : ""}" 
      data-action="transfer-seat-click" data-seat="${escapeAttr(seat)}" ${blocked ? "disabled" : ""} 
      title="${escapeAttr(p ? `${seat}: ${paxName(p)}` : `${seat}: Available`)}">
      <span>${escapeHTML(seat)}</span>${badge}
    </button>`;
  }

  function renderTransferBoarding(dep) {
    const list = transferPassengers(dep);
    const st = transferStats(dep);
    const depState = state.transferDcsDepartureState[dep.id] || {};
    const boardingStarted = Boolean(depState.boardingStarted) || dep.status === "BOARDING";
    const closed = dep.status === "CLOSED" || Boolean(depState.closed);
    return `<div class="board-kpis" style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin-bottom:8px">${statCard("Expected", st.booked, "Total manifest")}${statCard("Checked Off", st.accepted, "Ready to board")}${statCard("Boarded", st.boarded, "On coach")}${statCard("Remaining", Math.max(0, st.accepted - st.boarded), "Missing pax")}</div>
    <div class="workspace-layout">
      <div>
        <div class="transfer-scanner">
          <div class="strong">Coach Boarding Scanner / Manual Entry</div>
          <div class="transfer-scanner-line">
            <input id="transferScannerInput" placeholder="SCAN VOUCHER OR ENTER SURNAME / SEAT" autocomplete="off" ${boardingStarted && !closed ? "" : "disabled"}>
            <button class="primary" data-action="transfer-scan" ${boardingStarted && !closed ? "" : "disabled"}>BOARD</button>
          </div>
          <div class="transfer-sub" style="color:#9fc1d7">Coach ${escapeHTML(dep.serviceNumber)} · ${escapeHTML(dep.origin)} → ${escapeHTML(dep.destination)}</div>
          <div class="transfer-scan-result" id="transferScanResult">
            <strong>${closed ? "Departure closed" : boardingStarted ? "Scanner ready" : "Boarding not started"}</strong>
            <div>${closed ? "No further boarding transactions are permitted." : boardingStarted ? "Waiting for customer scan." : "Start boarding to activate."}</div>
          </div>
        </div>
        <section class="panel" style="margin-top:8px">
          <div class="panel-head">Boarding Manifest</div>
          <div class="panel-body" style="padding:0">${transferBoardingTable(dep, list)}</div>
        </section>
      </div>
      <aside class="panel sticky">
        <div class="panel-head">Dispatch Control</div>
        <div class="panel-body">
          <div class="money-line"><span>Direction</span><strong>${escapeHTML(dep.direction)}</strong></div>
          <div class="money-line"><span>Vehicle</span><strong>${escapeHTML(dep.vehicle)}</strong></div>
          <div class="money-line"><span>Driver</span><strong>${escapeHTML(dep.driver)}</strong></div>
          <div class="action-stack" style="margin-top:10px">
            <button class="primary" data-action="transfer-start-boarding" ${closed ? "disabled" : ""}>${boardingStarted ? "Boarding active" : "Start boarding"}</button>
            <button class="secondary" data-action="print-transfer-manifest">Print driver manifest</button>
            <button class="danger-btn" data-action="transfer-close" ${closed ? "disabled" : ""}>Close & dispatch coach</button>
          </div>
        </div>
      </aside>
    </div>`;
  }

  function transferBoardingTable(dep, list) {
    if (!list.length) return '<div class="empty">No customers assigned.</div>';
    return `<table class="data-table"><thead><tr><th>SEQ</th><th>Customer</th><th>Seat</th><th>Check-off</th><th>Boarding</th><th>Time</th><th>Luggage</th><th></th></tr></thead><tbody>
      ${list.map((p, i) => {
        const st = transferPaxState(dep, p);
        return `<tr><td class="mono">${String(i+1).padStart(3,"0")}</td><td><strong>${escapeHTML(paxName(p))}</strong></td><td>${escapeHTML(st.seat||"—")}</td><td>${transferStatusBadge(st.acceptance)}</td><td>${transferStatusBadge(st.boarding)}</td><td class="mono">${escapeHTML(st.boardedAt||"—")}</td><td>${st.bags} pc</td><td><button class="link" data-action="select-transfer-passenger" data-passenger-id="${escapeAttr(transferPaxId(p))}">Manage</button>${st.boarding==="BOARDED" ? ` · <button class="link" data-action="transfer-offload" data-passenger-id="${escapeAttr(transferPaxId(p))}">Offload</button>` : ""}</td></tr>`;
      }).join("")}
    </tbody></table>`;
  }

  function renderTransferActivity(dep) {
    const rows = state.transferDcsActivity.filter(a => !dep || a.departureId === dep.id);
    return `<div class="grid grid-2"><section class="panel"><div class="panel-head"><span>Operations Log · Coach ${escapeHTML(dep?.serviceNumber||"")}</span><button class="link" data-action="transfer-clear-activity">Clear local log</button></div><div class="panel-body" style="padding:0"><div class="transfer-activity">${rows.length ? rows.map(a => `<div class="transfer-activity-row"><time>${escapeHTML(a.time)}</time><div>${escapeHTML(a.text)}</div></div>`).join("") : '<div class="empty">No transfer operations recorded.</div>'}</div></div></section><section class="panel"><div class="panel-head">Operational Reference</div><div class="panel-body"><div class="money-line"><span>Coach</span><strong class="mono">${escapeHTML(dep?.serviceNumber||"—")}</strong></div><div class="money-line"><span>Route</span><strong>${escapeHTML(dep ? `${dep.origin} → ${dep.destination}` : "—")}</strong></div><div class="money-line"><span>Scheduled</span><strong>${escapeHTML(dep ? `${dep.date} ${dep.scheduled}` : "—")}</strong></div><div class="transfer-operation-note" style="margin-top:10px">This log tracks real-time rep actions (check-offs, bag assignments, dispatch) locally during the airport day.</div></div></section></div>`;
  }
  
  function transferLog(dep, text) {
    state.transferDcsActivity.unshift({ departureId: dep?.id || "", time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), text });
    state.transferDcsActivity = state.transferDcsActivity.slice(0, 250);
  }
  function transferSavePassenger(dep, p, patch, message) {
    if (!dep || !p) return;
    const depId = dep.id, pid = transferPaxId(p);
    state.transferDcsPassengerState[depId] = state.transferDcsPassengerState[depId] || {};
    state.transferDcsPassengerState[depId][pid] = { ...transferPaxState(dep, p), ...patch };
    transferLog(dep, `${paxName(p)} · ${message}`);
    if (state.transferDcsPersistence) post("ALTEA_TRANSFER_DCS_UPDATE_PASSENGER", { departureId: dep.id, componentId: dep.componentId, bookingId: dep.bookingId || booking()?.id, passengerId: p.id || pid, patch: state.transferDcsPassengerState[depId][pid] }, { busy: false });
    toast("Transfer Control", message, "success");
    render();
  }
  function transferSaveDeparture(dep, patch, message) {
    if (!dep) return;
    state.transferDcsDepartureState[dep.id] = { ...(state.transferDcsDepartureState[dep.id] || {}), ...patch };
    transferLog(dep, message);
    if (state.transferDcsPersistence) post("ALTEA_TRANSFER_DCS_UPDATE_DEPARTURE", { departureId: dep.id, componentId: dep.componentId, bookingId: dep.bookingId || booking()?.id, patch }, { busy: false });
    toast("Transfer Control", message, "success");
    render();
  }
  
  // (Helper modal functions for bags/seats/scanning are kept identical but styled via CSS above)
  function openTransferBagModal(){const dep=selectedTransferDeparture(),p=transferSelectedPax(dep);if(!dep||!p)return;const st=transferPaxState(dep,p);openModal("Coach Luggage",`<div class="grid grid-2"><div class="field"><label>Pieces</label><input id="transferBagPieces" type="number" min="0" value="${escapeAttr(String(st.bags))}"></div><div class="field"><label>Total weight kg</label><input id="transferBagWeight" type="number" min="0" step="0.1" value="${escapeAttr(String(st.weight))}"></div></div><div class="field"><label>Notes (e.g. Golf bag, Stroller)</label><textarea id="transferBagNotes">${escapeHTML(st.remarks||"")}</textarea></div>`,[{label:"Cancel",className:"secondary",close:true},{label:"Save luggage",className:"primary",onClick:()=>{const bags=Math.max(0,Number($("#transferBagPieces")?.value||0)),weight=Math.max(0,Number($("#transferBagWeight")?.value||0)),remarks=$("#transferBagNotes")?.value||"";closeModal();transferSavePassenger(dep,p,{bags,weight,remarks},`Luggage updated: ${bags} pc${weight?`, ${weight} kg`:""}`)}}])}
  function assignTransferSeat(seat){const dep=selectedTransferDeparture(),p=transferSelectedPax(dep);if(!dep||!p)return;const occupied=transferPassengers(dep).find(x=>x!==p&&transferPaxState(dep,x).seat===seat&&transferPaxState(dep,x).acceptance!=="NO_SHOW");if(occupied)return toast("Seat occupied",`${seat} is assigned to ${paxName(occupied)}.`,"warning");transferSavePassenger(dep,p,{seat},`Seat ${seat} assigned`)}
  function autoTransferSeat(){const dep=selectedTransferDeparture(),p=transferSelectedPax(dep);if(!dep||!p)return;const used=new Set(transferPassengers(dep).filter(x=>transferPaxId(x)!==transferPaxId(p)).map(x=>transferPaxState(dep,x).seat).filter(Boolean));const rows=Math.ceil(dep.capacity/4);for(let r=1;r<=rows;r++)for(const l of ["A","D","B","C"]){const seat=`${r}${l}`;const position=(r-1)*4+["A","B","C","D"].indexOf(l)+1;if(position<=dep.capacity&&!used.has(seat))return assignTransferSeat(seat)}toast("Coach full","No unassigned seats remain.","warning")}
  function transferScan(){const dep=selectedTransferDeparture();if(!dep)return;const input=$("#transferScannerInput");const val=String(input?.value||"").trim().toUpperCase();if(!val)return;const depState=state.transferDcsDepartureState[dep.id]||{};if(!depState.boardingStarted&&dep.status!=="BOARDING")return transferScanResult(false,"Boarding not started","Start boarding before scanning vouchers.");if(dep.status==="CLOSED"||depState.closed)return transferScanResult(false,"Departure closed","Coach has been dispatched.");const list=transferPassengers(dep);const p=list.find((x,i)=>{const st=transferPaxState(dep,x),ref=String(x.bookingReference||x.pnrLocator||masterReference()).toUpperCase();return String(i+1).padStart(3,"0")===val||String(st.seat).toUpperCase()===val||ref===val||String(x.lastName||x.last||"").toUpperCase()===val||paxName(x).toUpperCase()===val});if(!p)return transferScanResult(false,"Customer not found",`No match for ${val} on this coach.`);const st=transferPaxState(dep,p);if(st.boarding==="BOARDED")return transferScanResult(false,"Already boarded",`${paxName(p)} is already on the coach.`);if(!["ACCEPTED","BOARDED"].includes(st.acceptance))return transferScanResult(false,"Not checked off",`${paxName(p)} must check-in with the rep first.`);state.transferDcsSelectedPassengerId=transferPaxId(p);transferSavePassenger(dep,p,{boarding:"BOARDED",acceptance:"BOARDED",boardedAt:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})},`Boarded coach`);setTimeout(()=>transferScanResult(true,"Boarding OK",`${paxName(p)} · Seat ${transferPaxState(dep,p).seat||"unassigned"}`),0)}
  function transferScanResult(ok,title,message){const el=$("#transferScanResult");if(!el){toast(title,message,ok?"success":"danger");return}el.className=`transfer-scan-result ${ok?"success":"error"}`;el.innerHTML=`<strong>${escapeHTML(title)}</strong><div>${escapeHTML(message)}</div>`;if(ok){const i=$("#transferScannerInput");if(i){i.value="";i.focus()}}}
  
  function printTransferCard(){const dep=selectedTransferDeparture(),p=transferSelectedPax(dep);if(!dep||!p)return;const st=transferPaxState(dep,p);const no=`TC-${dep.serviceNumber}-${String(transferPassengers(dep).indexOf(p)+1).padStart(3,"0")}`;printHtml(`Transfer Card ${paxName(p)}`,transferCardHtml(dep,p,st,no))}
  function printTransferLuggageTag(){const dep=selectedTransferDeparture(),p=transferSelectedPax(dep);if(!dep||!p)return;const tag=`TRF-${String(masterReference()).replace(/[^A-Z0-9]/gi,"").slice(-6).toUpperCase()}-${String(transferPassengers(dep).indexOf(p)+1).padStart(3,"0")}`;printHtml(`Transfer Luggage Tag ${tag}`,transferLuggageTagHtml(dep,p,tag));if(state.transferDcsPersistence)post("ALTEA_TRANSFER_DCS_RECORD_DOCUMENT",{departureId:dep.id,bookingId:dep.bookingId||booking()?.id,passengerId:p.id||transferPaxId(p),documentType:"TRANSFER_LUGGAGE_TAG",documentNumber:tag},{busy:false})}
  
  function transferCardHtml(dep,p,st,no){return `<div style="border:2px solid #111;padding:18px"><div class="head"><div><div class="brand">SKANDI TRAVELS</div><div>TRANSFER BOARDING CARD</div></div><div class="ref">${escapeHTML(dep.serviceNumber)}</div></div><div style="font-size:24px;font-weight:800;margin:18px 0">${escapeHTML(paxName(p))}</div><div class="grid"><div class="box"><div class="label">Direction</div><div class="value">${escapeHTML(dep.direction)}</div></div><div class="box"><div class="label">From</div><div class="value">${escapeHTML(dep.origin)}</div></div><div class="box"><div class="label">To</div><div class="value">${escapeHTML(dep.destination)}</div></div><div class="box"><div class="label">Flight</div><div class="value">${escapeHTML(dep.associatedFlight)}</div></div><div class="box"><div class="label">Coach seat</div><div class="value" style="font-size:22px">${escapeHTML(st.seat||"OPEN")}</div></div><div class="box"><div class="label">Booking ref</div><div class="value">${escapeHTML(p.bookingReference||p.pnrLocator||masterReference())}</div></div></div><div class="barcode" style="margin-top:18px"></div><div class="muted" style="margin-top:5px">${escapeHTML(no)} · Hand to driver when boarding.</div></div>`}
  function transferLuggageTagHtml(dep,p,tag){return `<div style="border:2px solid #111;padding:15px;width:680px;max-width:100%"><div style="display:flex;justify-content:space-between"><div><div class="brand">SKANDI TRAVELS</div><div class="muted">COACH LUGGAGE TAG</div></div><div class="ref">${escapeHTML(tag)}</div></div><div style="font-size:34px;font-weight:900;margin:15px 0">${escapeHTML(dep.destination)}</div><div class="grid"><div class="box"><div class="label">Passenger</div><div class="value">${escapeHTML(paxName(p))}</div></div><div class="box"><div class="label">Coach</div><div class="value">${escapeHTML(dep.serviceNumber)}</div></div><div class="box"><div class="label">Booking reference</div><div class="value">${escapeHTML(p.bookingReference||p.pnrLocator||masterReference())}</div></div></div><div class="barcode" style="margin-top:14px"></div><div class="ref" style="text-align:center;margin-top:5px">${escapeHTML(tag)}</div></div>`}
  function transferManifestHtml(dep){const list=transferPassengers(dep);return `<div class="head"><div><div class="brand">SKANDI TRAVELS</div><div>DRIVER MANIFEST · ${escapeHTML(dep.direction)}</div></div><div><div class="label">Coach</div><div class="ref">${escapeHTML(dep.serviceNumber)}</div></div></div><div class="grid"><div class="box"><div class="label">Route</div><div class="value">${escapeHTML(dep.origin)} → ${escapeHTML(dep.destination)}</div></div><div class="box"><div class="label">Time</div><div class="value">${escapeHTML(`${dep.date||""} ${dep.scheduled||""}`.trim())}</div></div><div class="box"><div class="label">Vehicle</div><div class="value">${escapeHTML(dep.vehicle)}</div></div></div><table><thead><tr><th>SEQ</th><th>Customer</th><th>Booking</th><th>Hotel / Stop</th><th>Seat</th><th>Luggage</th><th>Boarded</th></tr></thead><tbody>${list.map((p,i)=>{const st=transferPaxState(dep,p);return `<tr><td>${String(i+1).padStart(3,"0")}</td><td>${escapeHTML(paxName(p))}</td><td>${escapeHTML(p.bookingReference||p.pnrLocator||masterReference())}</td><td>${escapeHTML(p.hotelName||p.payload?.hotelName||(dep.direction==="INBOUND"?dep.destination:dep.origin))}</td><td>${escapeHTML(st.seat||"—")}</td><td>${st.bags} pc</td><td>[ &nbsp;&nbsp; ]</td></tr>`}).join("")}</tbody></table>`}

  function renderManifests(){
    const w=workspace();if(!w?.booking)return `${pageHead("Operations & Manifests","Passenger lists, rooming lists, transfer manifests and tour manifests.")}
      <div class="manifest-filters"><button class="secondary" data-manifest-mode="passengers">Passenger list</button><button class="secondary" data-manifest-mode="hotel">Rooming list</button><button class="secondary" data-manifest-mode="transfer">Transfer</button><button class="secondary" data-manifest-mode="tour">Tours</button></div>
      <section class="panel" style="margin-top:10px"><div class="panel-head"><span>Manifest workspace</span><span class="mono">NO BOOKING</span></div><div class="panel-body">${emptyState("☷","No operational list loaded","The manifest tabs remain available. Open a booking to populate passenger, rooming, transfer and tour manifests.")}</div></section>`;
    const comps=components();return `${pageHead("Operations & Manifests",`${masterReference()} · operational lists`,'<button class="secondary" data-action="print-passenger-manifest">Print passenger manifest</button><button class="primary" data-action="send-operations-manifest">Send operations manifest</button>')}
      <div class="manifest-filters"><button class="secondary" data-manifest-mode="passengers">Passenger list</button><button class="secondary" data-manifest-mode="hotel">Rooming list</button><button class="secondary" data-manifest-mode="transfer">Transfer</button><button class="secondary" data-manifest-mode="tour">Tours</button></div>
      <section class="panel" style="margin-top:10px"><div class="panel-head"><span>${escapeHTML(humanize(state.manifestMode))} manifest</span><span class="mono">${escapeHTML(masterReference())}</span></div><div class="panel-body" style="padding:0">${manifestMarkup(state.manifestMode,comps)}</div></section>`;
  }
  function manifestMarkup(mode,comps){if(mode==="passengers")return `<table class="data-table"><thead><tr><th>#</th><th>Passenger</th><th>Type</th><th>Club</th><th>APIS</th><th>Seat</th><th>Check-in</th></tr></thead><tbody>${passengers().map((p,i)=>`<tr><td>${i+1}</td><td>${escapeHTML(paxName(p))}</td><td>${escapeHTML(p.paxType||"ADT")}</td><td>${escapeHTML(clubFor(p)?.memberNumber||"—")}</td><td>${escapeHTML(p.apisStatus||"—")}</td><td>${escapeHTML(p.seatNumber||"—")}</td><td>${escapeHTML(p.checkinStatus||"—")}</td></tr>`).join("")}</tbody></table>`;const key=mode==="hotel"?["HOTEL","STAY"]:mode==="transfer"?["TRANSFER"]:["TOUR","ACTIVITY","EXCURSION"];const items=comps.filter(c=>key.some(x=>normalizedType(c.componentType||c.entityType).includes(x)));if(!items.length)return '<div class="empty">No matching components in this booking.</div>';return `<table class="data-table"><thead><tr><th>Service</th><th>Date / Time</th><th>Supplier</th><th>Ref</th><th>Passengers</th><th>Status</th></tr></thead><tbody>${items.map(c=>`<tr><td><strong>${escapeHTML(serviceLabel(c))}</strong></td><td>${escapeHTML(c.serviceDate||c.startDate||c.payload?.pickupTime||c.payload?.serviceDate||"—")}</td><td>${escapeHTML(c.supplier||"SKANDI")}</td><td class="mono">${escapeHTML(c.supplierReference||"—")}</td><td>${escapeHTML(String(c.passengerCount||c.payload?.passengerCount||passengers().length))}</td><td>${escapeHTML(c.status||"")}</td></tr>`).join("")}</tbody></table>`}


  const originalBindAction=bindAction;
  bindAction=function(element){
    if(element.dataset.enterpriseActionBound)return;
    element.dataset.enterpriseActionBound="1";
    originalBindAction(element);
    element.addEventListener("click",async()=>{
      const a=element.dataset.action;
      if(a==="edit-component")openComponentEditor(element.dataset.componentId);
      if(a==="print-component-voucher")printComponentVoucher(element.dataset.componentId);
      if(a==="send-component-voucher")sendComponentVoucher(element.dataset.componentId);
      if(a==="print-booking-confirmation")printBookingConfirmation();
      if(a==="generate-booking-document")generateBookingDocument(element.dataset.docType);
      if(a==="send-booking-document")sendBookingDocument(element.dataset.docType);
      if(a==="save-package")savePackage();
      if(a==="search-club")searchClub();
      if(a==="clear-club-search"){state.clubSelectedCustomerId="";state.clubSearchType="all";state.clubMembershipFilter="all";state.clubSearchResults=[];state.clubSearchLoaded=false;render();}
      if(a==="link-club")linkClub(element.dataset.customerProfileId||element.dataset.memberId);
      if(a==="adjust-club")adjustClub(element.dataset.customerProfileId||element.dataset.memberId);
      if(a==="check-requirements")checkRequirements();
      if(a==="select-dcs-passenger"){state.dcsSelectedPassengerId=element.dataset.passengerId||"";state.selectedPassengerId=state.dcsSelectedPassengerId;render();}
      if(a==="dcs-checkin")dcsPatch({checkinStatus:"checked_in",boardingStatus:"not_boarded"},"Passenger checked in");
      if(a==="dcs-board")dcsPatch({checkinStatus:"boarded",boardingStatus:"boarded"},"Passenger boarded");
      if(a==="dcs-offload")dcsPatch({checkinStatus:"checked_in",boardingStatus:"offloaded"},"Passenger offloaded");
      if(a==="dcs-noshow")dcsPatch({checkinStatus:"no_show",boardingStatus:"not_boarded"},"Passenger marked no-show");
      if(a==="dcs-bag")openBagModal();
      if(a==="dcs-seat")openSeatModal();
      if(a==="dcs-boarding-pass")printBoardingPass();
      if(a==="dcs-bagtag") printBagTag();
      if(a==="select-transfer-departure"){state.transferDcsSelectedDepartureId=element.dataset.departureId||"";state.transferDcsTab="acceptance";state.transferDcsSelectedPassengerId="";render();}
      if(a==="select-transfer-passenger"){state.transferDcsSelectedPassengerId=element.dataset.passengerId||"";render();}
      if(a==="refresh-transfer-dcs"){post("ALTEA_TRANSFER_DCS_BOOTSTRAP",{date:new Date().toISOString().slice(0,10),bookingId:booking()?.id||""},{busy:false});}
      if(a==="transfer-accept"){const dep=selectedTransferDeparture(),p=transferSelectedPax(dep);transferSavePassenger(dep,p,{acceptance:"ACCEPTED",boarding:"NOT_BOARDED"},"Customer accepted at transfer meeting point");}
      if(a==="transfer-voucher-verify"){const dep=selectedTransferDeparture(),p=transferSelectedPax(dep);transferSavePassenger(dep,p,{voucherVerified:true},"Transfer voucher verified");}
      if(a==="transfer-bag")openTransferBagModal();
      if(a==="transfer-seat"){state.transferDcsTab="seats";render();}
      if(a==="transfer-seat-click")assignTransferSeat(element.dataset.seat||"");
      if(a==="transfer-auto-seat")autoTransferSeat();
      if(a==="transfer-card")printTransferCard();
      // Wire the "Luggage tag" button directly to the Flight tag
      if(a==="transfer-luggage-tag") printTransferLuggageTag();
      if(a==="transfer-waitlist"){const dep=selectedTransferDeparture(),p=transferSelectedPax(dep);transferSavePassenger(dep,p,{acceptance:"WAITLIST",boarding:"NOT_BOARDED"},"Customer moved to waitlist / overflow");}
      if(a==="transfer-noshow"){const dep=selectedTransferDeparture(),p=transferSelectedPax(dep);transferSavePassenger(dep,p,{acceptance:"NO_SHOW",boarding:"NOT_BOARDED"},"Customer marked no-show");}
      if(a==="transfer-offload"){const dep=selectedTransferDeparture();const pid=element.dataset.passengerId||state.transferDcsSelectedPassengerId;const p=transferPassengers(dep).find(x=>transferPaxId(x)===pid)||transferSelectedPax(dep);state.transferDcsSelectedPassengerId=transferPaxId(p);transferSavePassenger(dep,p,{acceptance:"ACCEPTED",boarding:"OFFLOADED",boardedAt:""},"Customer offloaded from coach");}
      if(a==="transfer-start-boarding"){const dep=selectedTransferDeparture();transferSaveDeparture(dep,{boardingStarted:true,status:"BOARDING"},`Boarding started for ${dep?.serviceNumber||"transfer"}`);}
      if(a==="transfer-close"){const dep=selectedTransferDeparture(),st=transferStats(dep);const remaining=Math.max(0,st.accepted-st.boarded);if(remaining>0&&!confirm(`${remaining} accepted customer(s) remain unboarded. Close and dispatch anyway?`))return;transferSaveDeparture(dep,{closed:true,status:"CLOSED"},`Coach ${dep?.serviceNumber||""} closed and dispatched`);}
      if(a==="transfer-scan")transferScan();
      if(a==="transfer-clear-activity"){state.transferDcsActivity=[];render();}
      if(a==="print-transfer-manifest"){const dep=selectedTransferDeparture();if(dep)printHtml(`Transfer Manifest ${dep.serviceNumber}`,transferManifestHtml(dep));}
      if(a==="print-passenger-manifest")printPassengerManifest();
      if(a==="send-operations-manifest")post("ALTEA_SEND_MANIFEST",{bookingId:booking()?.id,bookingReference:masterReference(),manifestType:state.manifestMode});
      if(a==="view-generated-document")post("ALTEA_GET_DOCUMENT",{bookingId:booking()?.id||"",documentId:element.dataset.documentId});
    });
  };


  function bindEnterpriseEvents(){
    if(["packagebuilder","club","departure","manifests"].includes(state.activeView)){
      document.querySelectorAll('[data-view]',main).forEach(b=>{if(b.dataset.enterpriseBound)return;b.dataset.enterpriseBound="1";b.addEventListener("click",()=>navigate(b.dataset.view));});
        
    document.querySelectorAll('[data-dir]', main).forEach(b => {
      b.addEventListener("click", () => {
        state.transferDcsDirection = b.dataset.dir;
        state.transferDcsSelectedDepartureId = ""; // Reset selection so it picks the first one in the new direction
        render();
      });
    });
    document.querySelectorAll('[data-action]',main).forEach(b=>bindAction(b));
    document.querySelectorAll('[data-manifest-mode]',main).forEach(b=>b.addEventListener("click",()=>{state.manifestMode=b.dataset.manifestMode;render()}));
    document.querySelectorAll('[data-transfer-dcs-tab]',main).forEach(b=>b.addEventListener("click",()=>{state.transferDcsTab=b.dataset.transferDcsTab||"departures";render()}));
    const transferScanner=document.getElementById("transferScannerInput");if(transferScanner)transferScanner.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();transferScan();}});
    const acceptanceFilter=document.getElementById("transferAcceptanceFilter");if(acceptanceFilter)acceptanceFilter.addEventListener("change",()=>{const v=acceptanceFilter.value;document.querySelectorAll('tr[data-transfer-status]',main).forEach(r=>r.classList.toggle('hidden',v!=="ALL"&&r.dataset.transferStatus!==v));});
    const inv=document.getElementById("inventoryFilter");if(inv)inv.addEventListener("input",()=>{const q=inv.value.toLowerCase();const items=(state.inventory||[]).filter(i=>JSON.stringify(i).toLowerCase().includes(q));const table=document.getElementById("enterpriseInventoryTable");if(table){table.innerHTML=enterpriseInventoryMarkup(items);table.querySelectorAll('[data-action]').forEach(bindAction)}});
    document.getElementById("clubPassenger")?.addEventListener("change",e=>{state.selectedPassengerId=e.target.value;state.clubSelectedCustomerId="";render()});
    document.getElementById("clubSearchType")?.addEventListener("change",e=>{state.clubSearchType=e.target.value;render()});
    document.getElementById("clubMembershipFilter")?.addEventListener("change",e=>{state.clubMembershipFilter=e.target.value;render()});
    document.getElementById("clubSearch")?.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();searchClub();}});
    document.querySelectorAll("[data-club-customer]",main).forEach(row=>{
      row.addEventListener("click",()=>{state.clubSelectedCustomerId=row.dataset.clubCustomer||"";render();});
      row.addEventListener("dblclick",()=>{const id=row.dataset.clubCustomer||"";if(id)linkClub(id);});
    });
    document.getElementById("reqPassenger")?.addEventListener("change",e=>{state.selectedPassengerId=e.target.value;state.travelDecision=null;render()});
  }


  function savePackage(){const b=booking();if(!b?.id)return;const type=$("#packageBookingType")?.value||bookingType();const transferControl=$("#packageTransferControl")?.value||"SKANDI";post("ALTEA_UPDATE_BOOKING",{bookingId:b.id,patch:{bookingType:type,tripTitle:$("#packageTitle")?.value||"",transferControl,startDate:$("#packageStart")?.value||"",endDate:$("#packageEnd")?.value||"",packageStatus:$("#packageStatus")?.value||"DRAFT"}})}
  function searchClub(){
    const p=selectedPax()||passengers().find(x=>x.id===state.selectedPassengerId);
    state.clubSearchType=$("#clubSearchType")?.value||state.clubSearchType||"all";
    state.clubMembershipFilter=$("#clubMembershipFilter")?.value||state.clubMembershipFilter||"all";
    post("ALTEA_CLUB_SEARCH",{
      query:$("#clubSearch")?.value||"",
      searchType:state.clubSearchType,
      membershipFilter:state.clubMembershipFilter,
      passengerId:$("#clubPassenger")?.value||p?.id||"",
      bookingId:booking()?.id
    });
  }
  function linkClub(customerProfileId){
    const passengerId=$("#clubPassenger")?.value||state.selectedPassengerId;
    if(!passengerId||!customerProfileId)return;
    post("ALTEA_CLUB_LINK_MEMBER",{bookingId:booking()?.id,passengerId,customerProfileId});
  }
  function adjustClub(memberId){const delta=Number($("#clubPointsDelta")?.value);const reason=$("#clubPointsReason")?.value.trim();if(!Number.isFinite(delta)||!delta)return toast("Points amount required","Enter a non-zero whole-number adjustment.","warning");if(!reason)return toast("Reason required","Enter an audit reason for the points adjustment.","warning");post("ALTEA_CLUB_ADJUST_POINTS",{customerProfileId:memberId,passengerId:state.selectedPassengerId,bookingId:booking()?.id,bookingReference:masterReference(),delta:Math.trunc(delta),reason})}
  function checkRequirements(){const passengerId=$("#reqPassenger")?.value||state.selectedPassengerId;state.travelDecision=null;post("ALTEA_TRAVEL_REQUIREMENTS_CHECK",{bookingId:booking()?.id,passengerId,nationality:$("#reqNationality")?.value||"",residenceCountry:$("#reqResidence")?.value||"",dateOfBirth:$("#reqDob")?.value||"",origin:$("#reqOrigin")?.value||"",destination:$("#reqDestination")?.value||"",documentType:"PASSPORT",documentIssuingCountry:$("#reqIssue")?.value||"",documentExpiry:$("#reqExpiry")?.value||"",transitPoints:String($("#reqTransit")?.value||"").split(",").map(x=>x.trim().toUpperCase()).filter(Boolean)})}


  function openComponentEditor(id){const c=components().find(x=>x.id===id);if(!c)return;openModal("Edit trip component",`<div class="field"><label>Service</label><input value="${escapeAttr(serviceLabel(c))}" readonly></div><div class="grid grid-3"><div class="field"><label>Service date</label><input id="compDate" type="date" value="${escapeAttr(c.serviceDate||c.startDate||c.payload?.serviceDate||"")}"></div><div class="field"><label>Time / pickup</label><input id="compTime" value="${escapeAttr(c.serviceTime||c.payload?.pickupTime||"")}"></div><div class="field"><label>Passengers</label><input id="compPax" type="number" min="1" value="${escapeAttr(String(c.passengerCount||c.payload?.passengerCount||passengers().length||1))}"></div></div><div class="grid grid-2"><div class="field"><label>Supplier reference</label><input id="compRef" value="${escapeAttr(c.supplierReference||"")}"></div><div class="field"><label>Total amount</label><input id="compAmount" type="number" step="0.01" value="${escapeAttr(String(c.totalAmount||0))}"></div></div><div class="field"><label>Operational notes / pickup instructions</label><textarea id="compNotes">${escapeHTML(c.operationalNotes||c.payload?.operationalNotes||"")}</textarea></div>`,[{label:"Cancel",className:"secondary",close:true},{label:"Save component",className:"primary",onClick:()=>{closeModal();post("ALTEA_UPDATE_COMPONENT",{componentId:id,patch:{serviceDate:$("#compDate")?.value||"",serviceTime:$("#compTime")?.value||"",passengerCount:Number($("#compPax")?.value||1),supplierReference:$("#compRef")?.value||"",totalAmount:Number($("#compAmount")?.value||0),operationalNotes:$("#compNotes")?.value||""}})}}])}


  function dcsPatch(patch,message){const p=selectedPax();if(!p||!isSkandiDcs())return;post("ALTEA_DCS_UPDATE_PASSENGER",{bookingId:booking()?.id,passengerId:p.id,patch});toast("Departure Control",message,"success")}
  function openBagModal(){const p=selectedPax();if(!p||!isSkandiDcs())return;openModal("Record baggage",`<div class="grid grid-2"><div class="field"><label>Pieces</label><input id="bagPieces" type="number" min="0" value="${escapeAttr(String(p.baggageCount||p.payload?.baggageCount||0))}"></div><div class="field"><label>Total weight kg</label><input id="bagWeight" type="number" min="0" step="0.1" value="${escapeAttr(String(p.baggageWeight||p.payload?.baggageWeight||0))}"></div></div>`,[{label:"Cancel",className:"secondary",close:true},{label:"Save baggage",className:"primary",onClick:()=>{const pieces=Number($("#bagPieces")?.value||0),weight=Number($("#bagWeight")?.value||0);closeModal();dcsPatch({baggageCount:pieces,baggageWeight:weight},"Baggage updated")}}])}
  function openSeatModal(){const p=selectedPax();if(!p||!isSkandiDcs())return;openModal("Assign seat",`<div class="field"><label>Seat</label><input id="dcsSeat" maxlength="5" value="${escapeAttr(p.seatNumber||"")}" placeholder="12A"></div>`,[{label:"Cancel",className:"secondary",close:true},{label:"Assign",className:"primary",onClick:()=>{const seat=String($("#dcsSeat")?.value||"").toUpperCase().trim();if(!seat)return;closeModal();dcsPatch({seatNumber:seat},`Seat ${seat} assigned`)}}])}


  function generateBookingDocument(type){if(!booking()?.id)return;post("ALTEA_GENERATE_DOCUMENT",{bookingId:booking().id,documentType:type,bookingReference:masterReference()})}
  function sendBookingDocument(type){if(!booking()?.id)return;post("ALTEA_SEND_DOCUMENT",{bookingId:booking().id,documentType:type,bookingReference:masterReference(),recipient:booking().customerEmail||""})}
  function sendComponentVoucher(id){const c=components().find(x=>x.id===id);if(!c)return;post("ALTEA_SEND_DOCUMENT",{bookingId:booking()?.id,componentId:id,documentType:"VOUCHER",bookingReference:masterReference(),recipient:booking()?.customerEmail||""})}


  function printBookingConfirmation(){
    const id=booking()?.id;
    if(!id)return toast("Booking file required","Create or open a booking before previewing the customer confirmation.","warning");
    post("ALTEA_PREVIEW_BOOKING_CONFIRMATION",{bookingId:id});
  }
  function printComponentVoucher(id){const c=components().find(x=>x.id===id);if(!c)return;printHtml(`Voucher ${masterReference()}`,componentVoucherHtml(c))}
  function printPassengerManifest(){printHtml(`Passenger Manifest ${masterReference()}`,passengerManifestHtml())}
  function printBoardingPass(){const p=selectedPax();if(!p||!isSkandiDcs())return;const docNo=`BP-${masterReference()}-${p.sequenceNumber||passengers().indexOf(p)+1}`;post("ALTEA_DCS_RECORD_DOCUMENT",{bookingId:booking()?.id,passengerId:p.id,documentType:"BOARDING_PASS",documentNumber:docNo});printHtml(`Boarding Pass ${paxName(p)}`,boardingPassHtml(p,docNo))}
  async function printBagTag() {
  // Grab the passenger explicitly clicked in the Flight DCS list
  const pId = state.dcsSelectedPassengerId || state.selectedPassengerId;
  const p = passengers74().find(x => x.id === pId) || selectedPax();
  
  if (!p) return toast("No Passenger", "Select a passenger to print an airline baggage tag.", "warning");

  const b = booking74(); 
  const order = state.selectedOrder; 
  const segments = order?.slices?.[0]?.segments || []; 

  // Format the Sequence, BN, and Tag ID
  const seqRaw = p.sequenceNumber || passengers74().indexOf(p) + 1;
  const seq = String(seqRaw === 0 ? 1 : seqRaw).padStart(3, "0");
  const bn = formatBoardingNumber(seq); 
  const ref = b?.bookingReference || b?.pnrLocator || order?.bookingReference || "SKNDI";
  const tag = `SK${String(ref).replace(/[^A-Z0-9]/gi, "").slice(-6).toUpperCase()}${seq}`;

  // Generate 10-digit IATA License Plate
  const licensePlate = "0117" + String(Math.floor(100000 + Math.random() * 900000));

  // Determine Cabin Class safely
  let cabin = "Y";
  if (segments.length > 0 && segments[0].passengers) {
    const pInfo = segments[0].passengers[0];
    cabin = pInfo?.cabinClassMarketingName || pInfo?.cabin_class || pInfo?.cabinClass || "Y";
  }

  // Log to ALTEA
  post("ALTEA_DCS_RECORD_DOCUMENT", { bookingId: b?.id, passengerId: p.id, documentType: "BAG_TAG", documentNumber: tag });

  // 1. Build Payload for your Node.js Backend
  const payload = {
    booking: b || {},
    passenger: { 
      ...p, 
      bnNumber: bn,
      firstName: p.firstName || p.givenName || p.first_name || "",
      lastName: p.lastName || p.familyName || p.last_name || "PASSENGER",
      title: p.title || "",
      sequenceNumber: seq,
      bagIndex: 1, // Defaulting to bag 1
      cabinClass: cabin
    }, 
    segments: segments,
    documentNumber: tag,
    licensePlate: licensePlate,
    airlineName: order?.owner?.name || b?.supplier || "SKANDI"
  };

  try {
    // 2. Fetch the ZPL string from your Node.js endpoint
    const response = await fetch('/api/generate-baggage-tag', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error("Backend failed to generate ZPL code.");
    const zplText = await response.text();

    // 3. Render the returned ZPL to PNG using Labelary
    const formData = new URLSearchParams();
    formData.append("file", zplText);

    const labelaryRes = await fetch("http://api.labelary.com/v1/printers/8dpmm/labels/2.21x21/0/", {
      method: "POST",
      headers: { 
        "Accept": "image/png", 
        "Content-Type": "application/x-www-form-urlencoded" 
      },
      body: formData
    });

    if (!labelaryRes.ok) throw new Error("Failed to render ZPL to Image");
    const blob = await labelaryRes.blob();
    const imageUrl = URL.createObjectURL(blob);

    // 4. Open the print window
    const printWindow = window.open("", "_blank", "width=450,height=800");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head><title>Print Bag Tag - ${tag}</title></head>
          <body style="margin:0; display:flex; justify-content:center; align-items:center; background:#ccc; height:100vh;">
            <img src="${imageUrl}" style="background:#fff; box-shadow:0 0 10px rgba(0,0,0,0.5); max-height:90vh;" onload="window.print();" />
          </body>
        </html>
      `);
      printWindow.document.close();
    } else {
      toast("Popup Blocked", "Please allow pop-ups to print baggage tags.", "warning");
    }
  } catch (error) {
    toast("Print Error", error.message, "danger");
  }
}


  function basePrintStyles(){return `body{font-family:Arial,sans-serif;color:#111;margin:28px;font-size:12px}.head{display:flex;justify-content:space-between;border-bottom:3px solid #022e64;padding-bottom:12px;margin-bottom:18px}.brand{font-size:24px;font-weight:800;color:#022e64}.ref{font:800 22px Consolas,monospace;letter-spacing:.08em}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.box{border:1px solid #bbb;padding:9px}.label{font-size:9px;text-transform:uppercase;color:#666}.value{font-weight:700;margin-top:3px}table{width:100%;border-collapse:collapse;margin-top:14px}th,td{border:1px solid #bbb;padding:7px;text-align:left}th{background:#eef1f4}.section{font-size:15px;font-weight:800;color:#022e64;margin-top:18px}.muted{color:#666}.barcode{height:48px;background:repeating-linear-gradient(90deg,#000 0,#000 2px,#fff 2px,#fff 4px,#000 4px,#000 5px,#fff 5px,#fff 8px)}@page{margin:12mm}`}
  function componentVoucherHtml(c){return `<div class="head"><div><div class="brand">SKANDI TRAVELS</div><div>${escapeHTML(humanize(c.componentType||c.entityType))} voucher</div></div><div><div class="label">Booking reference</div><div class="ref">${escapeHTML(masterReference())}</div></div></div><div class="section">${escapeHTML(serviceLabel(c))}</div><div class="grid"><div class="box"><div class="label">Supplier</div><div class="value">${escapeHTML(c.supplier||"SKANDI")}</div></div><div class="box"><div class="label">Supplier reference</div><div class="value">${escapeHTML(c.supplierReference||"—")}</div></div><div class="box"><div class="label">Status</div><div class="value">${escapeHTML(c.status||"")}</div></div><div class="box"><div class="label">Date / time</div><div class="value">${escapeHTML(c.serviceDate||c.startDate||c.payload?.pickupTime||"—")}</div></div><div class="box"><div class="label">Passengers</div><div class="value">${escapeHTML(String(c.passengerCount||c.payload?.passengerCount||passengers().length))}</div></div><div class="box"><div class="label">Amount</div><div class="value">${money(c.totalAmount,c.currency||booking()?.currency)}</div></div></div><div class="section">Travelers</div><p>${passengers().map(p=>escapeHTML(paxName(p))).join(" · ")}</p><div class="section">Instructions</div><p>${escapeHTML(c.operationalNotes||c.payload?.operationalNotes||c.description||"Present this voucher together with the booking reference where requested.")}</p>`}
  function passengerManifestHtml(){return `<div class="head"><div><div class="brand">SKANDI TRAVELS</div><div>Passenger manifest</div></div><div><div class="label">Booking reference</div><div class="ref">${escapeHTML(masterReference())}</div></div></div><table><thead><tr><th>SEQ</th><th>Passenger</th><th>Type</th><th>Seat</th><th>APIS</th><th>Check-in</th><th>Boarding</th><th>Bags</th></tr></thead><tbody>${passengers().map((p,i)=>`<tr><td>${escapeHTML(p.sequenceNumber||String(i+1).padStart(3,"0"))}</td><td>${escapeHTML(paxName(p))}</td><td>${escapeHTML(p.paxType||"ADT")}</td><td>${escapeHTML(p.seatNumber||"—")}</td><td>${escapeHTML(p.apisStatus||"—")}</td><td>${escapeHTML(p.checkinStatus||"—")}</td><td>${escapeHTML(p.boardingStatus||p.payload?.boardingStatus||"—")}</td><td>${escapeHTML(String(p.baggageCount||p.payload?.baggageCount||0))}</td></tr>`).join("")}</tbody></table>`}
  function boardingPassHtml(p,docNo){const b=booking();return `<div style="border:2px solid #111;padding:18px"><div class="head"><div><div class="brand">SKANDI TRAVELS</div><div>BOARDING PASS · SKANDI CHARTER</div></div><div class="ref">${escapeHTML(masterReference())}</div></div><div style="font-size:24px;font-weight:800;margin:18px 0">${escapeHTML(paxName(p))}</div><div class="grid"><div class="box"><div class="label">From</div><div class="value" style="font-size:22px">${escapeHTML(b?.origin||"—")}</div></div><div class="box"><div class="label">To</div><div class="value" style="font-size:22px">${escapeHTML(b?.destination||"—")}</div></div><div class="box"><div class="label">Seat</div><div class="value" style="font-size:22px">${escapeHTML(p.seatNumber||"—")}</div></div><div class="box"><div class="label">Flight</div><div class="value">${escapeHTML(b?.flightNumber||b?.payload?.flightNumber||"SKANDI")}</div></div><div class="box"><div class="label">Date</div><div class="value">${escapeHTML(b?.departureDate||b?.startDate||"—")}</div></div><div class="box"><div class="label">Sequence</div><div class="value">${escapeHTML(p.sequenceNumber||String(passengers().indexOf(p)+1).padStart(3,"0"))}</div></div></div><div class="barcode" style="margin-top:18px"></div><div class="muted" style="margin-top:5px">${escapeHTML(docNo)} · Valid only for a SKANDI-controlled charter departure recorded in ALTEA.</div></div>`}
  function bagTagHtml(p,tag){const b=booking();return `<div style="border:2px solid #111;padding:15px;width:680px;max-width:100%"><div style="display:flex;justify-content:space-between;align-items:start"><div><div class="brand">SKANDI</div><div class="muted">BAGGAGE TAG · CHARTER DCS</div></div><div class="ref">${escapeHTML(tag)}</div></div><div style="font-size:46px;font-weight:900;letter-spacing:.08em;margin:14px 0">${escapeHTML(b?.destination||"—")}</div><div class="grid"><div class="box"><div class="label">Passenger</div><div class="value">${escapeHTML(paxName(p))}</div></div><div class="box"><div class="label">From</div><div class="value">${escapeHTML(b?.origin||"—")}</div></div><div class="box"><div class="label">Flight / Date</div><div class="value">${escapeHTML(b?.flightNumber||b?.payload?.flightNumber||"SKANDI")} · ${escapeHTML(b?.departureDate||"—")}</div></div></div><div class="barcode" style="margin-top:14px"></div><div class="ref" style="text-align:center;margin-top:5px">${escapeHTML(tag)}</div></div>`}
  function printHtml(title,body){const frame=document.createElement("iframe");frame.style.position="fixed";frame.style.right="0";frame.style.bottom="0";frame.style.width="1px";frame.style.height="1px";frame.style.border="0";frame.style.opacity="0";document.body.appendChild(frame);const doc=frame.contentDocument;doc.open();doc.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHTML(title)}</title><style>${basePrintStyles()}</style></head><body>${body}</body></html>`);doc.close();setTimeout(()=>{try{frame.contentWindow.focus();frame.contentWindow.print()}finally{setTimeout(()=>frame.remove(),1200)}},120)}


  // Generated Asset Library upload/finalize is owned by the Wix page bridge in R-006.3.




  window.addEventListener("message",event=>{
    if(event.source!==window.parent)return;const m=event.data||{};if(m.source!==PARENT_SOURCE)return;const p=m.payload||{};
    if(m.type==="ALTEA_UNIFIED_BOOTSTRAP_RESULT"){state.travelRequirementsProvider=p.travelRequirementsProvider||p.timaticProvider||state.travelRequirementsProvider||null;if(Array.isArray(p.transferDepartures))state.transferDcsDepartures=p.transferDepartures;state.transferDcsPersistence=Boolean(p.transferDcsPersistence||p.capabilities?.transferDcsPersistence||p.capabilities?.transferDcs);}
    if(m.type==="ALTEA_TRANSFER_DCS_BOOTSTRAP_RESULT"){state.transferDcsDepartures=Array.isArray(p.departures)?p.departures:[];state.transferDcsPersistence=Boolean(p.persistenceAvailable??true);if(state.activeView==="departure"||state.activeView==="baggage")render();}
    if(m.type==="ALTEA_TRANSFER_DCS_PASSENGER_UPDATED"||m.type==="ALTEA_TRANSFER_DCS_DEPARTURE_UPDATED"){if(p.workspace)state.alteaWorkspace=p.workspace;if(Array.isArray(p.departures))state.transferDcsDepartures=p.departures;if(state.activeView==="departure"||state.activeView==="baggage")render();}
    if(m.type==="ALTEA_BOOKING_RESULT"||m.type==="ALTEA_LOCAL_BOOKING_CREATED"||m.type==="ALTEA_BOOKING_UPDATED"||m.type==="ALTEA_DCS_PASSENGER_UPDATED"){if(p.workspace){state.alteaWorkspace=p.workspace;if(p.workspace.booking)upsertAlteaBooking(p.workspace.booking)}if(["booking","packagebuilder","departure","manifests"].includes(state.activeView))render();}
    if(m.type==="ALTEA_CLUB_SEARCH_RESULT"){state.clubSearchResults=p.members||p.items||[];state.clubSearchLoaded=true;if(!state.clubSelectedCustomerId&&state.clubSearchResults[0])state.clubSelectedCustomerId=state.clubSearchResults[0].customerProfileId||state.clubSearchResults[0].id||"";if(state.activeView==="club")render();}
    if(m.type==="ALTEA_CLUB_MEMBER_LINKED"||m.type==="ALTEA_CLUB_MEMBER_UPDATED"){const passengerId=p.passengerId||state.selectedPassengerId;if(passengerId&&(p.customerProfile||p.member))state.clubProfiles[passengerId]=p.customerProfile||p.member;if(p.workspace)state.alteaWorkspace=p.workspace;state.clubSelectedCustomerId=(p.customerProfile||p.member)?.customerProfileId||(p.customerProfile||p.member)?.id||state.clubSelectedCustomerId;if(state.activeView==="club"||state.activeView==="passengers")render();toast("Customer connection updated",p.message||"Passenger customer profile updated.","success")}
    if(m.type==="ALTEA_DOCUMENT_RESULT"){const d=p.document||null;if(d?.htmlSnapshot){const w=window.open("","_blank","noopener,noreferrer");if(w){w.document.open();w.document.write(d.htmlSnapshot);w.document.close()}else toast("Document blocked","Allow pop-ups to view or print this generated document.","warning")}else toast("Document unavailable","No generated HTML is stored for this document.","warning");}
    if(m.type==="ALTEA_TRAVEL_REQUIREMENTS_RESULT"){state.travelDecision=p.decision||p.result||p;state.travelRequirementsProvider=p.provider||state.travelRequirementsProvider;if(p.workspace)state.alteaWorkspace=p.workspace;if(state.activeView==="requirements")render();}
    if(m.type==="ALTEA_DOCUMENT_GENERATED"){if(p.document)state.generatedDocuments.unshift(p.document);if(p.workspace)state.alteaWorkspace=p.workspace;if(state.activeView==="ticketing")render();toast("Document generated",p.document?.documentType||"SKANDI document created.","success")}
    if(m.type==="ALTEA_DOCUMENT_SENT"){toast("Delivery",p.message||"The document workflow was recorded in booking history.","success")}
    if(m.type==="ALTEA_MANIFEST_SENT"){toast("Manifest generated",p.message||"The manifest was generated and recorded.","success")}
    if(m.type==="ALTEA_DCS_DOCUMENT_RECORDED"){if(p.workspace)state.alteaWorkspace=p.workspace}
    if(m.type==="ALTEA_GENERATED_ASSET_FINALIZED"){if(p.workspace)state.alteaWorkspace=p.workspace;if(state.activeView==="ticketing"||state.activeView==="manifests")render();toast("Asset Library","Generated file stored in the private SKANDI Asset Library.","success")}
  });


  post("ALTEA_ENTERPRISE_MODULE_READY",{version:ENTERPRISE_VERSION,capabilities:["master_booking","skandi_club","package_charter","documents_vouchers","travel_requirements_adapter","transfer_departure_control","manifests"]},{busy:false});
})();
</script>






<style id="b0073-altea-automation-style">
  .automation-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;align-items:end}
  .automation-grid.cols-3{grid-template-columns:repeat(3,minmax(0,1fr))}
  .automation-grid.cols-2{grid-template-columns:repeat(2,minmax(0,1fr))}
  .automation-section{margin-top:10px;border:1px solid #cfd7dd;background:#fbfcfd}
  .automation-section>.automation-head{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:7px 9px;border-bottom:1px solid #d9e0e5;background:#eef3f6;color:#29475a;font-weight:800}
  .automation-section>.automation-body{padding:9px}
  .automation-note{font-size:10px;color:#687783;margin-top:3px}
  .gds-preview{padding:8px;border:1px dashed #9daab4;background:#f7f9fa;font:11px/1.45 ui-monospace,SFMono-Regular,Consolas,monospace;overflow-wrap:anywhere}
  .pqr-grid{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(280px,.75fr);gap:10px;align-items:start}
  .rule-cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}
  .rule-card{border:1px solid #cfd7dd;background:#fff;padding:8px}
  .rule-card .label{color:#637581;font-size:9px;text-transform:uppercase;letter-spacing:.05em}
  .rule-card strong{display:block;margin-top:3px;color:#24465d}
  .fop-associations{max-height:132px;overflow:auto;border:1px solid #d4dce1;background:#fff;padding:7px}
  .fop-associations label{display:flex;gap:6px;align-items:center;margin:4px 0}
  .apis-sensitive{border-left:3px solid #d08a16;background:#fff7e6;padding:8px 9px;margin:8px 0;color:#62470d}
  .apis-sensitive strong{display:block;margin-bottom:2px}
  .upper-input{text-transform:uppercase}
  .mini-table{width:100%;border-collapse:collapse;font-size:10px}
  .mini-table th,.mini-table td{border:1px solid #d8dee3;padding:6px;text-align:left;vertical-align:top}
  .mini-table th{background:#eef2f5;color:#405662}
  .offer-status{display:inline-flex;align-items:center;gap:6px}
  .offer-status-code{min-width:26px;text-align:center;padding:2px 5px;border-radius:2px;font:800 10px/1.4 ui-monospace,SFMono-Regular,Consolas,monospace;background:#173c5a;color:#fff}
  .offer-status-code.un{background:#a71910}
  .fop-mask{font:700 11px ui-monospace,SFMono-Regular,Consolas,monospace;color:#1d4058}
  @media(max-width:920px){.automation-grid,.automation-grid.cols-3{grid-template-columns:repeat(2,minmax(0,1fr))}.pqr-grid{grid-template-columns:1fr}.rule-cards{grid-template-columns:1fr}}
  @media(max-width:620px){.automation-grid,.automation-grid.cols-3,.automation-grid.cols-2{grid-template-columns:1fr}}
</style>
<script id="b0073-altea-automation-script">
(() => {
  document.title = "SKANDI ALTEA Unified Reservations B-007.3";
  state.travelerDrafts = state.travelerDrafts || {};
  state.agentFop = state.agentFop || {
    paymentType:"CC",vendor:"",approvalCode:"",dbi:"",passengerIds:[],segmentIds:[]
  };
  state._apisOfferId = state._apisOfferId || "";


  const REST_DOC_TYPES = ["PASSPORT","IDENTITY_CARD","VISA","KNOWN_TRAVELER","REDRESS"];


  function onlyDigits(value,max=30){ return String(value||"").replace(/\D/g,"").slice(0,max); }
  function iso2(value){ return String(value||"").toUpperCase().replace(/[^A-Z]/g,"").slice(0,2); }
  function normalizedGender(value){
    const v=String(value||"").toUpperCase();
    return ["MALE","FEMALE","UNSPECIFIED"].includes(v)?v:"";
  }
  function duffelGender(value){ return value==="MALE"?"m":value==="FEMALE"?"f":""; }
  function sanitizeGdsName(value){
    return String(value||"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toUpperCase().replace(/[^A-Z0-9]/g,"");
  }
  function gdsDate(value){
    const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value||""));
    if(!m)return "";
    const months=["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
    return `${m[3]}${months[Number(m[2])-1]||""}${m[1].slice(-2)}`;
  }
  function passengerKind(passenger, index){
    const raw=String(passenger?.type||"").toLowerCase();
    if(raw.includes("infant") || Number(passenger?.age)<=1)return "INF";
    if(raw.includes("child") || (Number.isFinite(Number(passenger?.age)) && Number(passenger.age)>=2 && Number(passenger.age)<=11))return "CHD";
    if(Number.isFinite(Number(passenger?.age)) && Number(passenger.age)>=12 && Number(passenger.age)<18)return "YTH";
    return "ADT";
  }
  function defaultTravelerDraft(passenger,index){
    const paxType=passengerKind(passenger,index);
    return {
      id:passenger?.id||String(index+1),paxType,title:"",dateOfBirth:"",gender:"",
      name:{firstName:"",lastName:""},
      contact:{emailAddress:"",phones:[{deviceType:"MOBILE",countryCallingCode:"1",number:""}]},
      documents:[],infantResponsibleAdultId:""
    };
  }
  function travelerDraft(passenger,index){
    const id=String(passenger?.id||index+1);
    if(!state.travelerDrafts[id])state.travelerDrafts[id]=defaultTravelerDraft(passenger,index);
    return state.travelerDrafts[id];
  }
  function docByType(draft,type){ return (draft.documents||[]).find(d=>d.documentType===type)||null; }
  function primaryTravelDoc(draft){ return (draft.documents||[]).find(d=>["PASSPORT","IDENTITY_CARD","VISA"].includes(d.documentType))||null; }
  function upsertDoc(draft,type,doc){
    draft.documents = Array.isArray(draft.documents)?draft.documents:[];
    draft.documents = draft.documents.filter(d=>d.documentType!==type && !(type==="PRIMARY" && ["PASSPORT","IDENTITY_CARD","VISA"].includes(d.documentType)));
    if(doc && doc.documentType)draft.documents.push(doc);
  }
  function primaryDocumentFromCard(card){
    const documentType=value(card,"doc_type");
    if(!documentType)return null;
    return {
      documentType,
      birthPlace:value(card,"doc_birth_place"),
      issuanceLocation:value(card,"doc_issuance_location"),
      issuanceDate:value(card,"doc_issuance_date"),
      number:value(card,"doc_number").toUpperCase().replace(/\s+/g,""),
      expiryDate:value(card,"doc_expiry_date"),
      issuanceCountry:iso2(value(card,"doc_issuance_country")),
      validityCountry:iso2(value(card,"doc_validity_country")),
      nationality:iso2(value(card,"doc_nationality")),
      holder:Boolean(card.querySelector('[data-field="doc_holder"]')?.checked)
    };
  }
  function captureDraft(card){
    if(!card)return null;
    const id=String(card.dataset.passengerId||"");
    const passenger=(state.selectedOffer?.passengers||[]).find(p=>String(p.id)===id)||{id};
    const index=Math.max(0,(state.selectedOffer?.passengers||[]).findIndex(p=>String(p.id)===id));
    const draft=travelerDraft(passenger,index);
    draft.title=value(card,"title");
    draft.dateOfBirth=value(card,"date_of_birth");
    draft.gender=normalizedGender(value(card,"gender"));
    draft.name={firstName:value(card,"first_name"),lastName:value(card,"last_name")};
    draft.contact={
      emailAddress:value(card,"email_address"),
      phones:[{deviceType:value(card,"phone_device_type")||"MOBILE",countryCallingCode:onlyDigits(value(card,"phone_country_code"),4),number:onlyDigits(value(card,"phone_number"),20)}]
    };
    draft.infantResponsibleAdultId=value(card,"infant_responsible_adult");
    upsertDoc(draft,"PRIMARY",primaryDocumentFromCard(card));
    const ktn=value(card,"known_traveler").toUpperCase().replace(/\s+/g,"");
    upsertDoc(draft,"KNOWN_TRAVELER",ktn?{documentType:"KNOWN_TRAVELER",number:ktn,holder:true}:null);
    const redress=value(card,"redress").toUpperCase().replace(/\s+/g,"");
    upsertDoc(draft,"REDRESS",redress?{documentType:"REDRESS",number:redress,holder:true}:null);
    state.travelerDrafts[id]=draft;
    return draft;
  }
  function captureAllTravelerDrafts(){ $$(".passenger-card",main).forEach(captureDraft); }
  function travelerE164(draft){
    const phone=draft?.contact?.phones?.[0]||{};
    const c=onlyDigits(phone.countryCallingCode,4),n=onlyDigits(phone.number,20);
    return c&&n?`+${c}${n}`:"";
  }
  function soapPreview(draft,index){
    const doc=primaryTravelDoc(draft);
    if(!doc || doc.documentType!=="PASSPORT")return "SSR DOCS preview requires a passport and ISO-3 country mapping in the server automation layer.";
    const gender=draft.paxType==="INF"?(draft.gender==="MALE"?"MI":draft.gender==="FEMALE"?"FI":"U"):(draft.gender==="MALE"?"M":draft.gender==="FEMALE"?"F":"U");
    const issue=doc.issuanceCountry||"??",nat=doc.nationality||"??";
    return `SR DOCS YY HK1-P-${issue}[→ISO3]-${sanitizeGdsName(doc.number)}-${nat}[→ISO3]-${gdsDate(draft.dateOfBirth)}-${gender}-${gdsDate(doc.expiryDate)}-${sanitizeGdsName(draft.name.lastName)}-${sanitizeGdsName(draft.name.firstName)}/P${index+1}`;
  }
  function documentOptions(selected){
    return `<option value="">No primary document</option>${["PASSPORT","IDENTITY_CARD","VISA"].map(v=>`<option value="${v}" ${selected===v?"selected":""}>${humanize(v)}</option>`).join("")}`;
  }
  function adultOptions(currentPassengerId,selected){
    const passengers=state.selectedOffer?.passengers||[];
    const adults=passengers.filter((p,i)=>passengerKind(p,i)==="ADT" && String(p.id)!==String(currentPassengerId));
    return `<option value="">Select responsible adult</option>${adults.map((p,i)=>`<option value="${escapeAttr(p.id)}" ${String(selected)===String(p.id)?"selected":""}>Traveler ${passengers.indexOf(p)+1} · ${escapeHTML(p.id)}</option>`).join("")}`;
  }


  function offerBase(offer){
    if(offer?.baseAmount!=null)return Number(offer.baseAmount);
    const total=Number(offer?.totalAmount),tax=Number(offer?.taxAmount);
    return Number.isFinite(total)&&Number.isFinite(tax)?Math.max(0,total-tax):null;
  }
  function offerStatus(offer){return offer?.isExpired?{code:"UN",label:"Expired / unavailable",cls:"un"}:{code:"OO",label:"Active offer",cls:""};}
  function conditionCard(title,condition){
    if(!condition)return `<div class="rule-card"><div class="label">${escapeHTML(title)}</div><strong>Not supplied</strong><div class="muted">Carrier did not return a structured rule.</div></div>`;
    const allowed=condition.allowed===true;
    const penalty=condition.penalty_amount??condition.penaltyAmount;
    const currency=condition.penalty_currency??condition.penaltyCurrency??state.selectedOffer?.totalCurrency;
    return `<div class="rule-card"><div class="label">${escapeHTML(title)}</div><strong>${allowed?"YES":"NO"}</strong><div class="muted">${allowed?(penalty!=null?`Penalty ${money(penalty,currency)}`:"Penalty not supplied"):"Not permitted before departure"}</div></div>`;
  }
  function offerRulesMarkup(offer){
    const c=offer?.conditions||{};
    return `<div class="rule-cards">${conditionCard("Refundable",c.refund_before_departure||c.refundBeforeDeparture)}${conditionCard("Changeable",c.change_before_departure||c.changeBeforeDeparture)}</div>`;
  }
  function segmentFareRows(offer) {
    const rows = [];
    (offer?.slices || []).forEach((slice, si) => {
      (slice.segments || []).forEach((seg, gi) => {
        
        // 1. Try to read raw Duffel passenger data
        let pax = Array.isArray(seg.passengers) ? seg.passengers : [];
        
        // 2. If the backend stripped the array to save space, look for flattened data or create a safe fallback
        if (!pax.length) {
          pax = [{
            cabinClass: seg.cabinClassMarketingName || seg.cabin_class || "Economy",
            fareBasisCode: seg.fareBasisCode || seg.fare_basis_code || slice.fareBasisCode || slice.fare_basis_code || "—",
            baggages: seg.baggages || seg.included_baggage || null // null means the data was stripped
          }];
        }

        pax.forEach((p) => {
          // Format Fare & Cabin Display (e.g. "Economy · Flex")
          const cabRaw = p.cabinClassMarketingName || p.cabin_class_marketing_name || p.cabinClass || p.cabin_class || "Economy";
          const cab = humanize(cabRaw);
          const brand = slice.fareBrandName || slice.fare_brand_name;
          const fareDisplay = brand && brand.toLowerCase() !== cab.toLowerCase() 
            ? `${cab} · ${brand}` 
            : cab;
          
          // Format Fare Basis Code
          const fbc = p.fareBasisCode || p.fare_basis_code || "—";
          
          // Format Baggage cleanly
          let bagStr = "—";
          if (Array.isArray(p.baggages) && p.baggages.length > 0) {
            bagStr = p.baggages.map(b => `${b.quantity || 0}${String(b.type || "").startsWith("checked") ? "PC checked" : " " + humanize(b.type)}`).join(", ");
          } else if (!p.baggages) {
            // Replace the ugly system error with a clean, professional instruction
            bagStr = '<span class="muted" style="color: #8a5200;">See airline rules</span>';
          }

          rows.push(`<tr>
            <td>${si + 1}.${gi + 1}</td>
            <td>${escapeHTML(`${seg.marketingCarrier?.iataCode || ""}${seg.marketingFlightNumber || ""}`)}</td>
            <td>${escapeHTML(fareDisplay)}</td>
            <td class="mono">${fbc !== "—" ? escapeHTML(fbc) : '<span class="muted">—</span>'}</td>
            <td>${bagStr}</td>
          </tr>`);
        });
      });
    });
    return rows.join("");
  }
  function pqrMarkup(offer){
    const st=offerStatus(offer),base=offerBase(offer),tax=offer?.taxAmount;
    return `<div class="pqr-grid">
      <section class="panel"><div class="panel-head"><span>PQR / TST-style price record</span><span class="offer-status"><span class="offer-status-code ${st.cls}">${st.code}</span>${escapeHTML(st.label)}</span></div><div class="panel-body">
        <div class="grid grid-4">
          <div><span class="muted">Base fare</span><div class="strong">${base==null?"—":money(base,offer.baseCurrency||offer.totalCurrency)}</div></div>
          <div><span class="muted">Taxes</span><div class="strong">${tax==null?"—":money(tax,offer.taxCurrency||offer.totalCurrency)}</div></div>
          <div><span class="muted">Services</span><div class="strong">${money(selectedServiceTotal(),offer.totalCurrency)}</div></div>
          <div><span class="muted">Total due</span><div class="price-total">${money(orderTotal(),offer.totalCurrency)}</div></div>
        </div>
        <div class="automation-section"><div class="automation-head"><span>Fare / baggage detail</span><span class="mono">TQQ/O1</span></div><div class="automation-body" style="padding:0"><table class="mini-table"><thead><tr><th>SEG</th><th>Flight</th><th>Fare brand / cabin</th><th>Fare basis</th><th>Included baggage</th></tr></thead><tbody>${segmentFareRows(offer)}</tbody></table></div></div>
        <div class="automation-note">The system exposes offer-level tax total but the current SKANDI provider model does not invent airport/government tax-code lines when the supplier does not return them.</div>
      </div></section>
      <aside class="panel"><div class="panel-head"><span>Mini Rules</span><span class="mono">FWR/O1</span></div><div class="panel-body">${offerRulesMarkup(offer)}<div class="money-line" style="margin-top:8px"><span>Payment deadline</span><strong>${formatDateTime(offer.paymentRequiredBy||offer.priceGuaranteeExpiresAt||offer.expiresAt)}</strong></div><div class="money-line"><span>Offer expiry</span><strong>${formatDateTime(offer.expiresAt)}</strong></div></div></aside>
    </div>`;
  }


  renderOffer = function renderOfferB0073(){
    const offer=state.selectedOffer;
    if(!offer)return `${pageHead("Offer Review","A selected offer is refreshed here before checkout.")}${emptyState("▤","No offer selected","Search for flights and choose an offer to review.")}`;
    return `${pageHead("Offer Review","Refreshed live offer with agent review.",'<button class="secondary" data-action="refresh-selected-offer">Refresh price</button><button class="secondary" data-action="offer-notice">Offer Notice</button><button class="primary" data-view="workspace">Continue to order</button>')}
      ${offer.isExpired?alertBox("danger","Offer expired","Return to flight search and choose a current offer."):""}
      ${pqrMarkup(offer)}
      <div class="workspace-layout" style="margin-top:10px"><div>${itineraryMarkup(offer)}<section class="panel" style="margin-top:10px"><div class="panel-head">Available baggage and services</div><div class="panel-body" style="padding:0">${serviceListMarkup(offer.availableServices||[])}</div></section><section class="panel" style="margin-top:10px"><div class="panel-head"><span>Seat maps</span><button class="link" data-action="load-seat-maps">Refresh seat maps</button></div><div class="panel-body">${seatMapMarkup()}</div></section></div>
      <aside class="panel sticky"><div class="panel-head">Offer control</div><div class="panel-body"><div class="money-line"><span>Offer ID</span><strong class="mono">${escapeHTML(offer.id||"—")}</strong></div><div class="money-line"><span>Owner / validating carrier</span><strong>${escapeHTML(offer.owner?.iataCode||offer.owner?.name||"—")}</strong></div><div class="money-line"><span>Offer</span><strong>${money(offer.totalAmount,offer.totalCurrency)}</strong></div><div class="money-line"><span>Selected services</span><strong>${money(selectedServiceTotal(),offer.totalCurrency)}</strong></div><div class="money-line"><span>Total due</span><strong class="price-total">${money(orderTotal(),offer.totalCurrency)}</strong></div><div class="money-line"><span>Price guarantee</span><strong>${formatDateTime(offer.priceGuaranteeExpiresAt||offer.expiresAt)}</strong></div></div><div class="panel-foot"><button class="primary" data-view="workspace" ${offer.isExpired?"disabled":""}>Continue</button></div></aside></div>`;
  }


  passengerForm = function passengerFormB0073(passenger,index){
    const draft=travelerDraft(passenger,index),primary=primaryTravelDoc(draft)||{},ktn=docByType(draft,"KNOWN_TRAVELER"),redress=docByType(draft,"REDRESS");
    const kind=passengerKind(passenger,index),isInfant=kind==="INF";
    return `<section class="passenger-card" data-passenger-id="${escapeAttr(passenger.id)}">
      <div class="panel-head"><span>Traveler ${index+1}</span><span><span class="badge info">${escapeHTML(kind)}</span> <span class="mono muted">${escapeHTML(passenger.id||"")}</span></span></div>
      <div class="panel-body">
        <div class="automation-section" style="margin-top:0"><div class="automation-head"><span>Core identity</span><span>REST traveler</span></div><div class="automation-body"><div class="automation-grid">
          <div class="field"><label>Title</label><select data-field="title" required><option value="">Select</option>${["mr","ms","mrs","miss","dr"].map(v=>`<option value="${v}" ${draft.title===v?"selected":""}>${v}</option>`).join("")}</select></div>
          <div class="field"><label>First name</label><input class="upper-input" data-field="first_name" autocomplete="given-name" maxlength="70" value="${escapeAttr(draft.name.firstName||"")}" required></div>
          <div class="field"><label>Last name</label><input class="upper-input" data-field="last_name" autocomplete="family-name" maxlength="70" value="${escapeAttr(draft.name.lastName||"")}" required></div>
          <div class="field"><label>Date of birth</label><input data-field="date_of_birth" type="date" max="${isoDate(new Date())}" value="${escapeAttr(draft.dateOfBirth||"")}" required></div>
          <div class="field"><label>Gender</label><select data-field="gender" required>${["","MALE","FEMALE","UNSPECIFIED"].map(v=>`<option value="${v}" ${draft.gender===v?"selected":""}>${v?humanize(v):"Select"}</option>`).join("")}</select></div>
          ${isInfant?`<div class="field span-2"><label>Responsible adult / infant link</label><select data-field="infant_responsible_adult" required>${adultOptions(passenger.id,draft.infantResponsibleAdultId)}</select><div class="automation-note">Required for infant linking.</div></div>`:""}
        </div></div></div>
        <div class="automation-section"><div class="automation-head"><span>Contact</span><span>contact</span></div><div class="automation-body"><div class="automation-grid">
          <div class="field span-2"><label>Email address</label><input data-field="email_address" type="email" autocomplete="email" maxlength="254" value="${escapeAttr(draft.contact.emailAddress||"")}" required></div>
          <div class="field"><label>Phone type</label><select data-field="phone_device_type">${["MOBILE","LANDLINE","FAX"].map(v=>`<option ${draft.contact.phones?.[0]?.deviceType===v?"selected":""}>${v}</option>`).join("")}</select></div>
          <div class="field"><label>Country calling code</label><input data-field="phone_country_code" inputmode="numeric" maxlength="4" value="${escapeAttr(draft.contact.phones?.[0]?.countryCallingCode||"")}" placeholder="1" required></div>
          <div class="field span-2"><label>Phone number</label><input data-field="phone_number" inputmode="numeric" maxlength="20" value="${escapeAttr(draft.contact.phones?.[0]?.number||"")}" placeholder="2125550123" required><div class="automation-note">Digits only. ALTEA builds E.164 for the live supplier booking.</div></div>
        </div></div></div>
        <div class="automation-section"><div class="automation-head"><span>APIS / Secure Flight</span><span>documents[]</span></div><div class="automation-body">
          <div class="apis-sensitive"><strong>Secure document handling</strong>These fields are used for the live booking/SSR automation in this session. Full document numbers are not copied into the general ALTEA booking payload.</div>
          <div class="automation-grid">
            <div class="field"><label>Document type</label><select data-field="doc_type">${documentOptions(primary.documentType||"")}</select></div>
            <div class="field"><label>Document number</label><input data-field="doc_number" autocomplete="off" maxlength="50" value="${escapeAttr(primary.number||"")}"></div>
            <div class="field"><label>Issuance country (ISO 2)</label><input class="upper-input" data-field="doc_issuance_country" maxlength="2" value="${escapeAttr(primary.issuanceCountry||"")}" placeholder="US"></div>
            <div class="field"><label>Nationality (ISO 2)</label><input class="upper-input" data-field="doc_nationality" maxlength="2" value="${escapeAttr(primary.nationality||"")}" placeholder="US"></div>
            <div class="field"><label>Validity country (ISO 2)</label><input class="upper-input" data-field="doc_validity_country" maxlength="2" value="${escapeAttr(primary.validityCountry||"")}" placeholder="US"></div>
            <div class="field"><label>Birth place</label><input data-field="doc_birth_place" maxlength="120" value="${escapeAttr(primary.birthPlace||"")}"></div>
            <div class="field"><label>Issuance location</label><input data-field="doc_issuance_location" maxlength="120" value="${escapeAttr(primary.issuanceLocation||"")}"></div>
            <div class="field"><label>Issuance date</label><input data-field="doc_issuance_date" type="date" value="${escapeAttr(primary.issuanceDate||"")}"></div>
            <div class="field"><label>Expiry date</label><input data-field="doc_expiry_date" type="date" value="${escapeAttr(primary.expiryDate||"")}"></div>
            <label class="check" style="align-self:center"><input data-field="doc_holder" type="checkbox" ${primary.holder!==false&&!isInfant?"checked":""}> Primary document holder</label>
            <div class="field"><label>Known Traveler number</label><input data-field="known_traveler" maxlength="50" value="${escapeAttr(ktn?.number||"")}"></div>
            <div class="field"><label>Redress number</label><input data-field="redress" maxlength="50" value="${escapeAttr(redress?.number||"")}"></div>
          </div>
          <div class="automation-section"><div class="automation-head"><span>SOAP / cryptic preview</span><span class="mono">DOCS / DOCO / DOCA</span></div><div class="automation-body"><div class="gds-preview" data-gds-preview>${escapeHTML(soapPreview(draft,index))}</div><div class="automation-note">Server automation must convert ISO-2 country values to ISO-3 before generating an AIRIMP SSR. The UI deliberately does not fake that conversion.</div></div></div>
        </div></div>
      </div>
    </section>`;
  }


  function fopAssociations(offer){
    const pax=(offer?.passengers||[]).map((p,i)=>`<label><input type="checkbox" class="fop-pax" value="${escapeAttr(p.id)}" ${!state.agentFop.passengerIds.length||state.agentFop.passengerIds.includes(p.id)?"checked":""}> Traveler ${i+1} · ${escapeHTML(p.id)}</label>`).join("");
    const seg=[];(offer?.slices||[]).forEach((s,si)=>(s.segments||[]).forEach((g,gi)=>seg.push(`<label><input type="checkbox" class="fop-seg" value="${escapeAttr(g.id)}" ${!state.agentFop.segmentIds.length||state.agentFop.segmentIds.includes(g.id)?"checked":""}> ${escapeHTML(`${g.marketingCarrier?.iataCode||""}${g.marketingFlightNumber||""}`)} · ${escapeHTML(g.origin?.iataCode||"")}→${escapeHTML(g.destination?.iataCode||"")}</label>`)));
    return `<div class="automation-grid cols-2"><div><div class="strong" style="margin-bottom:5px">Passenger association</div><div class="fop-associations">${pax||'<span class="muted">No travelers</span>'}</div></div><div><div class="strong" style="margin-bottom:5px">Segment association</div><div class="fop-associations">${seg.join("")||'<span class="muted">No segments</span>'}</div></div></div>`;
  }
  function fopPanel(offer){
    const f=state.agentFop;
    return `<section class="panel"><div class="panel-head"><span>Form of Payment</span><span class="mono">FOP</span></div><div class="panel-body">
      <div class="automation-grid">
        <div class="field"><label>Payment type</label><select id="fopType"><option value="CC" ${f.paymentType==="CC"?"selected":""}>Credit Card (CC)</option><option value="CASH" ${f.paymentType==="CASH"?"selected":""}>Cash (CASH)</option><option value="INV" ${f.paymentType==="INV"?"selected":""}>Invoice (INV)</option><option value="CHECK" ${f.paymentType==="CHECK"?"selected":""}>Check (CHECK)</option><option value="NONREF" ${f.paymentType==="NONREF"?"selected":""}>Non-Refundable (NONREF)</option></select></div>
        <div class="field"><label>Vendor / card type</label><select id="fopVendor"><option value="">Secure element / auto</option>${[["VI","Visa"],["CA","Mastercard"],["AX","American Express"],["TP","UATP"]].map(([v,l])=>`<option value="${v}" ${f.vendor===v?"selected":""}>${v} · ${l}</option>`).join("")}</select></div>
        <div class="field"><label>Approval code</label><input id="fopApproval" maxlength="20" value="${escapeAttr(f.approvalCode||"")}" placeholder="External terminal only"></div>
        <div class="field"><label>DBI / cost center</label><input id="fopDbi" maxlength="100" value="${escapeAttr(f.dbi||"")}" placeholder="Cost center / employee ID"></div>
      </div>
      ${fopAssociations(offer)}
      <div id="paymentArea" style="margin-top:10px"><div class="alert info"><span>🔒</span><div><strong>PCI-DSS secure card capture</strong>For CC, card number and expiry are entered only inside Stripe's hosted Payment Element. ALTEA never receives the raw PAN and cannot reveal it again.</div></div><div class="money-line"><span>Validating carrier</span><strong>${escapeHTML(offer.owner?.iataCode||offer.owner?.name||"Provider determined")}</strong></div><div class="automation-note">Card-brand acceptance is validated by the secure payment path.</div><div class="money-line"><span>Stored card display</span><strong class="fop-mask">${state.payment?.paymentIntentId?`TOKEN ${escapeHTML(state.payment.paymentIntentId)}`:"CC••••••••••••••••"}</strong></div><button type="button" class="secondary" data-action="prepare-payment" ${offer.isExpired?"disabled":""}>Add / authorize Form of Payment</button><div id="paymentStatus" class="muted" style="margin-top:8px">${state.payment?.paymentIntentId?`Secure payment reference: ${escapeHTML(state.payment.paymentIntentId)}`:"No payment prepared."}</div></div>
      <div class="automation-note">The current instant-order settlement path is card; unsupported FOP types cannot be used to create an instant order.</div>
    </div></section>`;
  }


  renderWorkspace = function renderWorkspaceB0073(){
    const offer=state.selectedOffer;
    if(!offer)return `${pageHead("Order Workspace","Traveler details, payment, and order creation.")}${emptyState("◫","No refreshed offer","Select and refresh a live offer before creating an order.")}`;
    const passengers=offer.passengers||[];
    return `${pageHead("Create Flight Booking")}${offer.isExpired?alertBox("danger","Offer expired","Do not collect payment. Return to search and refresh a current offer."):""}<form id="orderForm"><div class="grid" style="gap:10px">${pqrMarkup(offer)}${passengers.map((p,i)=>passengerForm(p,i)).join("")}${fopPanel(offer)}<section class="panel"><div class="panel-head">Order control</div><div class="panel-body"><div class="automation-grid cols-2"><div class="field"><label for="orderType">Order type</label><select id="orderType"><option value="instant">Instant purchase</option><option value="hold" ${offer.requiresInstantPayment?"disabled":""}>Hold (when permitted)</option></select></div><div class="field"><label for="orderRemarks">Internal reference</label><input id="orderRemarks" maxlength="100" autocomplete="off" placeholder="SKANDI booking reference"></div></div></div><div class="panel-foot"><button class="secondary" type="button" data-action="offer-notice">Offer Notice</button><button class="primary" type="submit" ${offer.isExpired?"disabled":""}>Create order</button></div></section></div></form>`;
  }


  function captureFop(){
    state.agentFop={
      paymentType:$("#fopType")?.value||state.agentFop.paymentType||"CC",
      vendor:$("#fopVendor")?.value||"",
      approvalCode:$("#fopApproval")?.value.trim()||"",
      dbi:$("#fopDbi")?.value.trim()||"",
      passengerIds:$$(".fop-pax:checked",main).map(x=>x.value),
      segmentIds:$$(".fop-seg:checked",main).map(x=>x.value)
    };
    return state.agentFop;
  }


  validatePassengerForms = function validatePassengerFormsB0073(showNative){
    captureAllTravelerDrafts();
    const cards=$$(".passenger-card",main);
    if(!cards.length)return "No live traveler records were returned for this offer.";
    const adultUse=new Set();
    for(let index=0;index<cards.length;index++){
      const card=cards[index],draft=captureDraft(card);
      const required=$$("[required]",card),invalid=required.find(input=>!input.checkValidity());
      if(invalid){if(showNative)invalid.reportValidity();return `Complete ${invalid.closest(".field")?.querySelector("label")?.textContent||"the required field"} for traveler ${index+1}.`;}
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.contact.emailAddress||""))return `Enter a valid email address for traveler ${index+1}.`;
      if(!/^\d{1,4}$/.test(draft.contact.phones?.[0]?.countryCallingCode||"") || !/^\d{6,20}$/.test(draft.contact.phones?.[0]?.number||""))return `Enter country calling code and digits-only phone number for traveler ${index+1}.`;
      if(draft.gender==="UNSPECIFIED")return `Traveler ${index+1} uses UNSPECIFIED gender. The internal traveler model allows it, but order creation requires selected gender before supplier booking.`;
      const primary=primaryTravelDoc(draft);
      if(state.selectedOffer?.identityDocumentRequired && primary?.documentType!=="PASSPORT")return `Traveler ${index+1} requires a passport for this offer.`;
      if(primary){
        if(!primary.number || !primary.issuanceCountry || !primary.expiryDate)return `Complete document number, issuing country and expiry for traveler ${index+1}.`;
        if(!/^[A-Z]{2}$/.test(primary.issuanceCountry))return `Use a two-letter issuing country for traveler ${index+1}.`;
        if(primary.nationality && !/^[A-Z]{2}$/.test(primary.nationality))return `Use a two-letter nationality code for traveler ${index+1}.`;
      }
      if(draft.paxType==="INF"){
        if(!draft.infantResponsibleAdultId)return `Select the responsible adult for infant traveler ${index+1}.`;
        if(adultUse.has(draft.infantResponsibleAdultId))return "Each lap infant must be linked to a different responsible adult.";
        adultUse.add(draft.infantResponsibleAdultId);
      }
    }
    return "";
  }


  function buildAutomationTravelers(){captureAllTravelerDrafts();return (state.selectedOffer?.passengers||[]).map((p,i)=>travelerDraft(p,i));}
  function buildDuffelPassengers(automationTravelers){
    const out=automationTravelers.map(d=>{
      const primary=primaryTravelDoc(d);
      const identityDocuments=[];
      if(primary?.documentType==="PASSPORT")identityDocuments.push({type:"passport",uniqueIdentifier:primary.number,issuingCountryCode:primary.issuanceCountry,expiresOn:primary.expiryDate});
      const ktn=docByType(d,"KNOWN_TRAVELER");if(ktn?.number)identityDocuments.push({type:"known_traveler_number",uniqueIdentifier:ktn.number});
      const redress=docByType(d,"REDRESS");if(redress?.number)identityDocuments.push({type:"passenger_redress_number",uniqueIdentifier:redress.number});
      return {id:d.id,title:d.title,givenName:d.name.firstName,familyName:d.name.lastName,bornOn:d.dateOfBirth,gender:duffelGender(d.gender),email:d.contact.emailAddress,phoneNumber:travelerE164(d),identityDocuments};
    });
    automationTravelers.filter(d=>d.paxType==="INF"&&d.infantResponsibleAdultId).forEach(inf=>{const adult=out.find(x=>String(x.id)===String(inf.infantResponsibleAdultId));if(adult)adult.infantPassengerId=inf.id;});
    return out;
  }


  preparePayment = async function preparePaymentB0073(){
    if(!state.selectedOffer)return;
    captureFop();
    const orderType=$("#orderType")?.value||"instant";
    if(orderType==="hold")return toast("Payment not required","A hold order is created without payment or paid services.","info");
    if(state.agentFop.paymentType!=="CC")return toast("FOP not supported for supplier issue",`${state.agentFop.paymentType} is available in the agent UI, but this instant-order path currently settles by secure card/Stripe only. Use CC or a permitted hold order.`,"warning");
    const passengerError=validatePassengerForms(false);if(passengerError)return toast("Traveler details incomplete",passengerError,"warning");
    post("DUFFEL_PREPARE_PAYMENT",{offerId:state.selectedOffer.id,services:selectedServicePayload()});
  }


  submitOrder = function submitOrderB0073(event){
    event.preventDefault();
    const offer=state.selectedOffer;if(!offer||offer.isExpired)return toast("Offer unavailable","Refresh or select a current offer.","warning");
    const err=validatePassengerForms(true);if(err)return toast("Traveler details incomplete",err,"warning");
    captureFop();
    const orderType=$("#orderType")?.value||"instant";
    if(orderType==="hold"&&state.selectedServices.size)return toast("Services unavailable on hold","Remove paid seats and baggage before creating a hold order.","warning");
    if(orderType==="instant"&&state.agentFop.paymentType!=="CC")return toast("Unsupported FOP",`${state.agentFop.paymentType} is not a supported settlement method for this instant-order adapter.`,"warning");
    if(orderType==="instant"&&!state.payment?.paymentIntentId)return toast("Payment required","Add and confirm secure card payment before creating the order.","warning");
    const automationTravelers=buildAutomationTravelers();
    const passengers=buildDuffelPassengers(automationTravelers);
    const fopSummary={paymentType:state.agentFop.paymentType,vendor:state.agentFop.vendor,approvalCode:state.agentFop.approvalCode,dbi:state.agentFop.dbi,passengerIds:state.agentFop.passengerIds,segmentIds:state.agentFop.segmentIds};
    openModal("Confirm order creation",`${alertBox("warning","Final booking action",orderType==="instant"?"The secure booking service will verify payment, refresh the live offer again, and create the airline order.":"This creates a hold order without payment. The airline payment deadline will apply.")}<div class="money-line"><span>Order type</span><strong>${escapeHTML(orderType)}</strong></div><div class="money-line"><span>Travelers</span><strong>${passengers.length}</strong></div><div class="money-line"><span>FOP</span><strong>${escapeHTML(fopSummary.paymentType)}${fopSummary.vendor?` · ${escapeHTML(fopSummary.vendor)}`:""}</strong></div><div class="money-line"><span>Total</span><strong>${money(orderTotal(),offer.totalCurrency)}</strong></div>`,[
      {label:"Back",className:"secondary",close:true},
      {label:"Create order",className:"primary",onClick:()=>{closeModal();state._lastAutomationTravelers=automationTravelers;state._lastFopSummary=fopSummary;post("DUFFEL_CREATE_ORDER",{offerId:offer.id,orderType,passengers,services:orderType==="instant"?selectedServicePayload():[],paymentIntentId:orderType==="instant"?state.payment.paymentIntentId:null,internalReference:$("#orderRemarks")?.value.trim()||""});}}
    ]);
  }


  function offerNoticeText(offer){
    const st=offerStatus(offer),c=offer.conditions||{},base=offerBase(offer);
    const segs=(offer.slices||[]).flatMap(s=>(s.segments||[]).map(g=>`${g.marketingCarrier?.iataCode||""}${g.marketingFlightNumber||""} ${g.origin?.iataCode||""}-${g.destination?.iataCode||""} ${formatDateTime(g.departingAt)} / ${formatDateTime(g.arrivingAt)}`));
    const rule=(x)=>x?`${x.allowed===true?"YES":"NO"}${x.allowed===true&&x.penalty_amount!=null?` · penalty ${money(x.penalty_amount,x.penalty_currency||offer.totalCurrency)}`:""}`:"Not supplied";
    return [`SKANDI TRAVELS · OFFER NOTICE`,`Status: ${st.code} ${st.label}`,`Offer: ${offer.id||""}`,`Validating carrier: ${offer.owner?.iataCode||offer.owner?.name||""}`,`Base fare: ${base==null?"—":money(base,offer.baseCurrency||offer.totalCurrency)}`,`Taxes: ${offer.taxAmount==null?"—":money(offer.taxAmount,offer.taxCurrency||offer.totalCurrency)}`,`Services: ${money(selectedServiceTotal(),offer.totalCurrency)}`,`Total: ${money(orderTotal(),offer.totalCurrency)}`,`Expires: ${formatDateTime(offer.expiresAt)}`,`Refundable: ${rule(c.refund_before_departure)}`,`Changeable: ${rule(c.change_before_departure)}`,"",...segs].join("\n");
  }
  function openOfferNotice(){
    const offer=state.selectedOffer;if(!offer)return toast("No offer selected","Select and refresh an offer first.","warning");
    const text=offerNoticeText(offer),win=window.open("","_blank","noopener,noreferrer");
    if(!win)return toast("Popup blocked","Allow popups to print the Offer Notice.","warning");
    win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>SKANDI Offer Notice</title><style>body{font-family:Arial,sans-serif;color:#1d2a34;margin:36px}h1{color:#005eb8}table{width:100%;border-collapse:collapse;margin:16px 0}td,th{border:1px solid #ccd5dc;padding:8px;text-align:left}.muted{color:#687783}.total{font-size:20px;font-weight:800}.toolbar{margin-bottom:18px}@media print{.toolbar{display:none}}</style></head><body><div class="toolbar"><button onclick="print()">Print / Save PDF</button> <a href="mailto:?subject=${encodeURIComponent("SKANDI Offer Notice")}&body=${encodeURIComponent(text)}">Email summary</a></div><h1>SKANDI TRAVELS</h1><h2>Offer Notice</h2><pre style="white-space:pre-wrap;font:14px/1.55 Arial,sans-serif">${escapeHTML(text)}</pre><p class="muted">Generated from the current live supplier offer. Individual tax codes are shown only when returned by the provider; SKANDI does not invent tax components.</p></body></html>`);win.document.close();
  }


  passengerEditor = function passengerEditorB0073(p){
    const a=p.payload?.apisAutomationMeta||{};
    return `<form id="passengerOpsForm" data-passenger-id="${escapeAttr(p.id)}"><div class="grid grid-2"><div class="field"><label>First name</label><input id="paxFirst" value="${escapeAttr(p.firstName||"")}"></div><div class="field"><label>Last name</label><input id="paxLast" value="${escapeAttr(p.lastName||"")}"></div></div><div class="grid grid-2"><div class="field"><label>Nationality</label><input id="paxNationality" maxlength="3" value="${escapeAttr(p.nationality||"")}"></div><div class="field"><label>Passport</label><input readonly value="${p.passportLast4?`•••• ${escapeAttr(p.passportLast4)}`:"Full number not stored in general ALTEA payload"}"></div></div><div class="automation-section"><div class="automation-head">APIS automation status</div><div class="automation-body"><div class="money-line"><span>Captured document type</span><strong>${escapeHTML(a.documentType||"—")}</strong></div><div class="money-line"><span>Document expiry</span><strong>${escapeHTML(a.expiryDate||"—")}</strong></div><div class="money-line"><span>Issuing country</span><strong>${escapeHTML(a.issuanceCountry||"—")}</strong></div><div class="money-line"><span>Secure Flight / KTN</span><strong>${a.hasKnownTraveler?"Captured securely for booking session":"—"}</strong></div><div class="money-line"><span>Redress</span><strong>${a.hasRedress?"Captured securely for booking session":"—"}</strong></div></div></div><div class="field"><label>APIS status</label><select id="paxApis">${["not_started","captured","complete","needs_review"].map(v=>option(v,humanize(v),p.apisStatus)).join("")}</select></div><div class="field"><label>Document status</label><select id="paxDoc">${["not_checked","pending_check","verified","needs_review","rejected"].map(v=>option(v,humanize(v),p.documentStatus)).join("")}</select></div><div class="grid grid-2"><div class="field"><label>Seat</label><input id="paxSeat" maxlength="10" value="${escapeAttr(p.seatNumber||"")}"></div><div class="field"><label>Sequence</label><input id="paxSeq" maxlength="20" value="${escapeAttr(p.sequenceNumber||"")}"></div></div><div class="field"><label>Airline check-in status</label><select id="paxCheckin">${["not_checked_in","carrier_managed","checked_in","boarded","no_show"].map(v=>option(v,humanize(v),p.checkinStatus)).join("")}</select></div><div class="field"><label>Operational note</label><textarea id="paxNote">${escapeHTML(p.payload?.operationalNote||"")}</textarea></div><button class="primary" type="submit">Save passenger</button></form>`;
  }


  savePassengerOps = function savePassengerOpsB0073(event){
    event.preventDefault();const form=event.currentTarget;
    post("ALTEA_UPDATE_PASSENGER",{passengerId:form.dataset.passengerId,patch:{firstName:$("#paxFirst")?.value||"",lastName:$("#paxLast")?.value||"",nationality:$("#paxNationality")?.value||"",apisStatus:$("#paxApis")?.value||"",documentStatus:$("#paxDoc")?.value||"",checkinStatus:$("#paxCheckin")?.value||"",seatNumber:$("#paxSeat")?.value||"",sequenceNumber:$("#paxSeq")?.value||"",payload:{operationalNote:$("#paxNote")?.value||""}}});
  }


  function updateGdsPreview(card){
    const draft=captureDraft(card);if(!draft)return;const all=state.selectedOffer?.passengers||[],index=Math.max(0,all.findIndex(p=>String(p.id)===String(card.dataset.passengerId)));const box=card.querySelector("[data-gds-preview]");if(box)box.textContent=soapPreview(draft,index);
  }
  main.addEventListener("input",event=>{
    const e=event.target;if(!e?.id)return;
    const map={
      stayDest74:"destination", stayIn74:"checkInDate", stayOut74:"checkOutDate", stayRooms74:"rooms", stayAdults74:"adults", stayRadius74:"radiusKm",
      carPickup:"pickup", carDropoff:"dropoff", carPickupDate:"pickupDate", carPickupTime:"pickupTime", carDropoffDate:"dropoffDate", carDropoffTime:"dropoffTime", carAge:"age", carResidence:"residence"
    };
    const key=map[e.id];
    if(key) {
      if (e.id.startsWith("car")) {
         state.carSearchDraft = state.carSearchDraft || {};
         state.carSearchDraft[key] = key === "age" ? Number(e.value || 0) : e.value;
      } else {
         state.hotelSearchDraft[key] = ["rooms","adults","radiusKm"].includes(key) ? Number(e.value || 0) : e.value;
      }
    }
  });
  main.addEventListener("change",event=>{const card=event.target.closest?.(".passenger-card");if(card)updateGdsPreview(card);if(event.target.matches?.("#fopType,#fopVendor,.fop-pax,.fop-seg")){captureFop();if(event.target.id==="fopType")render();}});
  main.addEventListener("click",event=>{const el=event.target.closest?.("[data-action]");if(!el)return;if(el.dataset.action==="offer-notice"){event.preventDefault();openOfferNotice();}});


  if(["offer","workspace","passengers"].includes(state.activeView))render();


  window.addEventListener("message",event=>{
    const message=typeof event.data==="string"?(()=>{try{return JSON.parse(event.data)}catch(_){return null}})():event.data;
    if(!message||message.source!==PARENT_SOURCE)return;
    const payload=message.payload||{};
    if(message.type==="DUFFEL_OFFER_RESULT"){
      const id=payload.offer?.id||"";
      if(id && state._apisOfferId!==id){state.travelerDrafts={};state._apisOfferId=id;state.agentFop={paymentType:"CC",vendor:"",approvalCode:"",dbi:"",passengerIds:[],segmentIds:[]};}
    }
    if(message.type==="DUFFEL_ORDER_CREATED" && payload.alteaWorkspace?.booking?.id && Array.isArray(state._lastAutomationTravelers)){
      const workspace=payload.alteaWorkspace;
      const bySupplier=new Map((workspace.passengers||[]).map(p=>[String(p.supplierPassengerId||""),p]));
      state._lastAutomationTravelers.forEach(draft=>{
        const p=bySupplier.get(String(draft.id));if(!p)return;
        const primary=primaryTravelDoc(draft);
        post("ALTEA_UPDATE_PASSENGER",{bookingId:workspace.booking.id,passengerId:p.id,patch:{nationality:primary?.nationality||"",apisStatus:primary?"captured":"not_started",documentStatus:primary?"pending_check":"not_checked",payload:{apisAutomationMeta:{documentType:primary?.documentType||"",expiryDate:primary?.expiryDate||"",issuanceCountry:primary?.issuanceCountry||"",validityCountry:primary?.validityCountry||"",holder:primary?.holder===true,hasKnownTraveler:Boolean(docByType(draft,"KNOWN_TRAVELER")),hasRedress:Boolean(docByType(draft,"REDRESS")),capturedAt:new Date().toISOString()}}}},{busy:false});
      });
      if(state._lastFopSummary){
        const f=state._lastFopSummary;
        post("ALTEA_ADD_HISTORY_NOTE",{bookingId:workspace.booking.id,eventType:"FORM_OF_PAYMENT_RECORDED",note:`FOP ${f.paymentType}${f.vendor?`/${f.vendor}`:""}${f.approvalCode?` approval ${f.approvalCode}`:""}${f.dbi?` DBI ${f.dbi}`:""}; passengers=${f.passengerIds.join(",")||"ALL"}; segments=${f.segmentIds.join(",")||"ALL"}. Raw card data was handled by Stripe and not stored in ALTEA.`},{busy:false});
      }
    }
  });
})();
</script>




<style id="b0074-enterprise-workbenches">
/* --- CHARTER TRANSFER DCS STYLES --- */
.dir-badge { padding: 3px 6px; font-size: 9px; font-weight: 800; border-radius: 2px; }
  .dir-badge.inbound { background: #eaf4fc; color: #0b75cf; border: 1px solid #a9d4f9; }
  .dir-badge.outbound { background: #fff3d6; color: #8a5200; border: 1px solid #f9d88b; }
  
  .transfer-dashboard-filter {
    display: flex; gap: 0; border: 1px solid var(--line); border-radius: 3px; overflow: hidden; margin-bottom: 10px; background: #fff;
  }
  .transfer-dashboard-filter button {
    flex: 1; padding: 10px; font-size: 14px; font-weight: 800; border: 0; background: transparent; color: #647581; cursor: pointer; border-right: 1px solid var(--line);
  }
  .transfer-dashboard-filter button:last-child { border-right: 0; }
  .transfer-dashboard-filter button.active.inbound { background: #0b75cf; color: #fff; }
  .transfer-dashboard-filter button.active.outbound { background: #8a5200; color: #fff; }

  .route-timeline { display: flex; align-items: center; gap: 8px; font-size: 11px; margin-top: 4px; }
  .route-dot { width: 8px; height: 8px; border-radius: 50%; background: #9ca9b4; }
  .route-line { height: 2px; flex: 1; background: #cbd3da; min-width: 20px; }
  .route-stop { font-weight: 700; color: #173f5c; }
  .svc-catalog{display:grid;grid-template-columns:185px minmax(0,1fr);border:1px solid #aeb8c2;background:#fff;min-height:560px}.svc-nav{background:#eef0f2;border-right:1px solid #aeb8c2}.svc-nav h4{margin:0;padding:6px 8px;font-size:11px;background:#d8dde2;border-bottom:1px solid #b9c1c8}.svc-nav button{display:block;width:100%;padding:5px 7px;border:0;border-bottom:1px solid #d5dade;background:transparent;text-align:left;font-size:11px}.svc-nav button.active{background:#e5a93b;color:#111;font-weight:800}.svc-nav button.disabled{color:#a8adb1;background:#f5f5f5;cursor:not-allowed}.svc-nav .sub{padding-left:20px;font-size:10px}.svc-main{min-width:0}.svc-top{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:7px;border-bottom:1px solid #bfc7ce;background:#f5f6f7}.svc-box{border:1px solid #c8ced4;background:#fff;min-height:70px}.svc-box-title{padding:4px 6px;background:#d7dadd;font-weight:800;font-size:10px}.svc-box-row{padding:3px 6px;display:flex;gap:6px;align-items:center;font-size:10px;border-top:1px solid #eef0f2}.svc-box-row.active{background:#fff1c6}.svc-toolbar{display:flex;align-items:end;gap:10px;padding:7px;border-bottom:1px solid #cbd2d8;background:#f7f8f9}.svc-toolbar .field{margin:0;min-width:180px}.svc-body{display:grid;grid-template-columns:225px minmax(0,1fr);min-height:420px}.seat-legend{padding:8px;border-right:1px solid #d2d8de;background:#fafafa;font-size:10px}.seat-legend h4{margin:2px 0 6px}.legend-row{display:flex;gap:6px;align-items:center;margin:4px 0}.legend-swatch{width:18px;height:18px;border:1px solid #2281c3;background:#fff;display:grid;place-items:center;font-size:9px}.legend-swatch.selected{background:#f3a71a;border-color:#bd7700}.legend-swatch.blocked{background:#d2d5d8;border-color:#a9adb1}.legend-swatch.chargeable{border:2px solid #176fb2}.seat-feature-filter label{display:flex;gap:6px;align-items:flex-start;margin:5px 0}.aircraft-canvas{overflow:auto;padding:10px;background:#fff}.cabin-block{min-width:500px;margin:0 auto 12px}.cabin-title{text-align:center;font-size:10px;color:#53626e;margin-bottom:4px}.seat-row{display:grid;grid-template-columns:34px minmax(0,1fr) 34px;align-items:center;gap:5px;margin:2px 0}.row-number{font-size:9px;color:#5b6872;text-align:center}.seat-row-inner{display:flex;justify-content:center;gap:3px}.seat-section{display:flex;gap:2px;margin:0 5px}.seat-cell{position:relative;width:34px;height:30px;border:1px solid #2d8fd0;background:#fff;border-radius:2px;font-size:9px;padding:0;display:grid;place-items:center;color:#123b58}.seat-cell.empty{border-color:transparent;background:transparent;pointer-events:none}
  /* Altéa Cabin Seat State for Assigned Travelers */
  .seat-cell.occupied {background: #3d6581;color: #ffffff;border-color:#28465b; }.seat-cell.occupied:hover {outline: 2px solid #1976ad;
    }.seat-cell.facility{border-color:#276e9e;background:#2f83b8;color:#fff;font-size:8px}.seat-cell.blocked{background:#d2d5d8;border-color:#9ca3aa;color:#697078;cursor:not-allowed}.seat-cell.chargeable{border:2px solid #1d6da6}.seat-cell.selected{background:#f3a71a;border-color:#ae6d00;color:#111;font-weight:800}.seat-cell.highlight{outline:3px solid #ef4444;outline-offset:1px}.seat-pax-badge{position:absolute;right:-4px;top:-5px;min-width:14px;height:14px;border-radius:8px;background:#243b53;color:#fff;font-size:8px;display:grid;place-items:center;padding:0 3px}.seat-price{position:absolute;left:1px;bottom:0;font-size:7px;color:#15557f}.svc-footer{display:flex;justify-content:flex-end;align-items:center;gap:12px;padding:7px;border-top:1px solid #bfc7ce;background:#eef1f4}.hotel-workbench{display:grid;grid-template-columns:minmax(0,3fr) minmax(280px,1fr);gap:10px}.hotel-searchbar{position:sticky;top:0;z-index:4}.hotel-card{border:1px solid #cbd3da;margin-bottom:7px;background:#fff}.hotel-head{display:grid;grid-template-columns:54px minmax(0,1fr) 140px 110px;gap:8px;align-items:center;padding:7px}.hotel-thumb{width:48px;height:48px;object-fit:cover;background:#e8edf1}.hotel-matrix{border-top:1px solid #cbd3da}.hotel-status{font-size:9px;font-weight:800;padding:3px 6px;border:1px solid #b6c1ca;background:#eef4f8}.hotel-status.live{color:#0b5d88}.basket{position:sticky;top:0}.basket-block{border-left:3px solid #9eb5c7;padding:5px 0 5px 8px;margin:8px 0}.crm-workbench{display:grid;grid-template-columns:minmax(260px,.7fr) minmax(0,1.6fr);gap:10px}.crm-results{max-height:620px;overflow:auto}.crm-row{padding:7px;border-bottom:1px solid #d8dfe4;cursor:pointer}.crm-row.active{background:#dceeff}.crm-detail-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));border:1px solid #d5dce2}.crm-detail-grid>div{padding:7px;border-right:1px solid #d5dce2;border-bottom:1px solid #d5dce2}.crm-section{margin-top:10px}.quick-preview{margin-left:auto;align-self:center;height:30px;padding:0 10px;border:1px solid #7b8790;background:#fff;font-size:10px;font-weight:700}.quick-preview:disabled{opacity:.5}.preview-frame{width:100%;height:74vh;border:1px solid #cbd3da;background:#fff}.transfer-builder{border:1px solid #cbd3da;background:#fff;margin-top:10px}.transfer-builder .panel-body{padding:9px}@media(max-width:850px){.svc-catalog,.svc-body,.hotel-workbench,.crm-workbench{grid-template-columns:1fr}.svc-nav,.seat-legend{border-right:0;border-bottom:1px solid #d2d8de}.svc-top{grid-template-columns:1fr}.hotel-head{grid-template-columns:48px 1fr}.hotel-head>*:nth-child(n+3){grid-column:2}.crm-detail-grid{grid-template-columns:1fr 1fr}}
</style>
<script id="b0074-enterprise-workbenches-script">
(()=>{
  "use strict";
  const B0074="BACKEND-BASE-1.0-B007.5";


  state.seatWorkbench=state.seatWorkbench||{category:"seats",activePassengerId:"",selectedPassengerIds:[],activeSegmentId:"",filters:{},requestCradle:false,deck:""};
  state.hotelChildAges=state.hotelChildAges||[];
  state.hotelAmenities=state.hotelAmenities||{};
  state.hotelSearchDraft=state.hotelSearchDraft||{destination:"",checkInDate:"",checkOutDate:"",rooms:1,adults:2,chainCode:"",radiusKm:25};
  state.customerProfileDetail=state.customerProfileDetail||null;
  state.packageTransferEntityId=state.packageTransferEntityId||"";
  state._pendingTransferDetails=null;


  const ws=()=>state.alteaWorkspace||null;
  const booking74=()=>ws()?.booking||null;
  const passengers74=()=>ws()?.passengers||[];
  const components74=()=>((ws()?.components||[]).filter(c=>String(c.status||"").toUpperCase()!=="REMOVED"));
  const norm=v=>String(v||"").toUpperCase().replace(/[\s-]+/g,"_");
  const paxName74=p=>p?.displayName||[p?.firstName,p?.lastName].filter(Boolean).join(" ")||p?.passengerRef||"Passenger";
  const componentLabel74=c=>c?.title||c?.name||c?.productName||humanize(c?.componentType||c?.entityType||"Service");
  const masterRef74=()=>booking74()?.bookingReference||booking74()?.pnrLocator||booking74()?.id||state.selectedOrder?.bookingReference||"—";
  const componentTotal74=()=>components74().reduce((n,c)=>n+(Number(c.totalAmount)||0),0);
  const packageTotal74=()=>Number(booking74()?.totalAmount||0)+componentTotal74();
  const transferComponents74=()=>components74().filter(c=>norm(c.componentType||c.entityType).includes("TRANSFER"));
  const selectedBookingPax74=()=>passengers74().find(p=>p.id===state.selectedPassengerId)||passengers74()[0]||null;
  const selectedClubCustomer74=()=>{
    const id=String(state.clubSelectedCustomerId||"");
    return (state.clubSearchResults||[]).find(x=>String(x.customerProfileId||x.id)===id)||null;
  };


  /* --------------------------- Seats & Services --------------------------- */
  function seatPassengerLabel(p,index){
    const draft=state.travelerDrafts?.[p.id];
    const name=draft?[draft.name?.firstName,draft.name?.lastName].filter(Boolean).join(" "):"";
    const type=draft?.paxType||String(p.type||"").toUpperCase()||"ADT";
    return `P${index+1}: ${name||`Traveler ${index+1}`} (${type})`;
  }
  function allSeatSegments(){
    const ids=(state.seatMaps||[]).map(m=>m.segmentId).filter(Boolean);
    const all=(state.selectedOffer?.slices||[]).flatMap(s=>s.segments||[]);
    const matched=all.filter(s=>ids.includes(s.id));
    return matched.length?matched:all;
  }
  function activeSeatSegment(){
    const segs=allSeatSegments();
    if(!state.seatWorkbench.activeSegmentId&&segs[0])state.seatWorkbench.activeSegmentId=segs[0].id;
    return segs.find(s=>s.id===state.seatWorkbench.activeSegmentId)||segs[0]||null;
  }
  function activeSeatPassenger(){
    const pax=state.selectedOffer?.passengers||[];
    if(!state.seatWorkbench.activePassengerId&&pax[0])state.seatWorkbench.activePassengerId=pax[0].id;
    return pax.find(p=>p.id===state.seatWorkbench.activePassengerId)||pax[0]||null;
  }
  function selectedSeatPassengers(){
    const all=state.selectedOffer?.passengers||[];
    const ids=new Set(state.seatWorkbench.selectedPassengerIds||[]);
    if(!ids.size&&activeSeatPassenger())ids.add(activeSeatPassenger().id);
    return all.filter(p=>ids.has(p.id));
  }
  function activeSeatMap(){
    const seg=activeSeatSegment();
    return (state.seatMaps||[]).find(m=>!seg||m.segmentId===seg.id)||(state.seatMaps||[])[0]||null;
  }
  function cabinDecks(map){return [...new Set((map?.cabins||[]).map(c=>String(c.deck??"")).filter(Boolean))]}
  function visibleCabins(map){
    const decks=cabinDecks(map);
    if(decks.length&&!state.seatWorkbench.deck)state.seatWorkbench.deck=decks[0];
    return (map?.cabins||[]).filter(c=>!decks.length||String(c.deck??"")===String(state.seatWorkbench.deck));
  }
  function disclosureText(el){return [...(el.disclosures||[]),...(el.features||[]),el.name||""].join(" ").toLowerCase()}
  function seatFeature(el,key){
    const t=disclosureText(el);
    if(key==="chargeable")return (el.availableServices||[]).some(s=>Number(s.totalAmount||0)>0);
    if(key==="bassinet")return t.includes("bassinet");
    if(key==="overwing")return t.includes("overwing")||t.includes("wing");
    if(key==="child")return t.includes("not suitable for child")||t.includes("child_restricted")||t.includes("children");
    if(key==="restricted")return t.includes("restricted")||t.includes("special needs");
    if(key==="infant")return t.includes("infant");
    if(key==="exit")return t.includes("exit");
    return false;
  }
  function highlighted(el){return Object.entries(state.seatWorkbench.filters||{}).some(([k,v])=>v&&seatFeature(el,k))}
  function serviceForPassenger(el,passengerId){
    const list=el.availableServices||[];
    return list.find(s=>!s.passengerId||s.passengerId===passengerId)||list[0]||null;
  }
  function assignment(passengerId,segmentId){
    for(const [id,s] of state.selectedServices||[]){
      if(s?.type==="seat"&&s.passengerId===passengerId&&(s.segmentId===segmentId||!segmentId))return{id,...s};
    }
    return null;
  }
  function badgeForSeat(designator,segmentId){
    const pax=state.selectedOffer?.passengers||[];
    for(let i=0;i<pax.length;i++){
      const a=assignment(pax[i].id,segmentId);
      if(a?.designator===designator||String(a?.label||"").includes(designator))return `P${i+1}`;
    }
    return "";
  }
  function selectSeat(el,passengerId,map){
    const service=serviceForPassenger(el,passengerId);
    if(!service)return toast("Seat unavailable",`${el.designator||"This seat"} is not available for the selected passenger.`,"warning");
    if(seatFeature(el,"exit")&&!window.confirm("Agent Warning: Passenger must be 15+ and able-bodied. Confirm?"))return;
    for(const [id,s] of [...state.selectedServices]){
      if(s?.type==="seat"&&s.passengerId===passengerId&&(s.segmentId===map.segmentId||service.segmentId===s.segmentId))state.selectedServices.delete(id);
    }
    state.selectedServices.set(service.id,{...service,type:"seat",designator:el.designator,passengerId,segmentId:map.segmentId||service.segmentId,quantity:1});
  }
  function toggleSeat74(el,map){
    const pax=activeSeatPassenger();if(!pax)return;
    const current=assignment(pax.id,map.segmentId);
    if(current?.designator===el.designator){state.selectedServices.delete(current.id);render();return}
    selectSeat(el,pax.id,map);render();
  }
  function quickAssign(value){
    const map=activeSeatMap();if(!map)return;
    const designators=String(value||"").toUpperCase().split(/[\s,;]+/).filter(Boolean);
    const pax=selectedSeatPassengers();if(!designators.length||!pax.length)return;
    if(designators.length!==pax.length)return toast("Seat count mismatch",`Enter exactly ${pax.length} seat number${pax.length===1?"":"s"} for the selected passengers.`,"warning");
    for(let i=0;i<pax.length;i++){
      const el=(map.seats||[]).find(s=>String(s.designator).toUpperCase()===designators[i]);
      if(!el)return toast("Seat not found",`${designators[i]} is not present or not selectable on this segment.`,"warning");
      selectSeat(el,pax[i].id,map);
    }
    render();
  }
  function seatElement(el,map){
    const type=String(el.type||"empty").toLowerCase();
    if(type==="empty")return '<span class="seat-cell empty"></span>';
    if(type!=="seat"){
      const label=type==="lavatory"?"WC":type==="galley"?"GAL":type==="bassinet"?"BAS":type==="exit_row"?"EXIT":type.slice(0,4).toUpperCase();
      return `<span class="seat-cell facility" title="${escapeAttr(humanize(type))}">${escapeHTML(label)}</span>`;
    }
    const blocked=!(el.availableServices||[]).length;
    const service=serviceForPassenger(el,activeSeatPassenger()?.id);
    const chargeable=(el.availableServices||[]).some(s=>Number(s.totalAmount||0)>0);
    const badge=badgeForSeat(el.designator,map.segmentId),selected=Boolean(badge),hi=highlighted(el);
    const price=service&&Number(service.totalAmount||0)>0?money(service.totalAmount,service.totalCurrency):"";
    return `<button type="button" class="seat-cell ${blocked?"blocked":""} ${chargeable?"chargeable":""} ${selected?"selected":""} ${hi?"highlight":""}" data-b0074-seat="${escapeAttr(el.designator||"")}" ${blocked?"disabled":""} title="${escapeAttr([el.designator,...(el.disclosures||[])].filter(Boolean).join(" · "))}"><span>${escapeHTML(el.designator||"—")}</span>${badge?`<span class="seat-pax-badge">${badge}</span>`:""}${price?`<span class="seat-price">${escapeHTML(price.replace(/^[A-Z]{3}\s*/,""))}</span>`:""}</button>`;
  }
  function normalizedCabins(map){
    if(Array.isArray(map?.cabins)&&map.cabins.length)return visibleCabins(map);
    const rows=new Map();
    for(const seat of map?.seats||[]){const n=String(seat.designator||"").match(/^\d+/)?.[0]||"";if(!rows.has(n))rows.set(n,[]);rows.get(n).push({...seat,type:"seat"})}
    return [{cabinName:(map?.seats||[])[0]?.cabinName||"Cabin",rows:[...rows.entries()].sort((a,b)=>Number(a[0])-Number(b[0])).map(([rowNumber,elements])=>({rowNumber,sections:[{elements:elements.sort((a,b)=>String(a.designator).localeCompare(String(b.designator)))}]}))}];
  }
  function cabinGrid(map){
    return normalizedCabins(map).map(c=>`<div class="cabin-block"><div class="cabin-title">${escapeHTML(c.cabinName||c.cabinClass||"Cabin")}${c.deck!==null&&c.deck!==undefined?` · Deck ${escapeHTML(String(c.deck))}`:""}</div>${(c.rows||[]).map(r=>`<div class="seat-row"><span class="row-number">${escapeHTML(r.rowNumber||"")}</span><div class="seat-row-inner">${(r.sections||[]).map(sec=>`<span class="seat-section">${(sec.elements||[]).map(el=>seatElement(el,map)).join("")}</span>`).join("")}</div><span class="row-number">${escapeHTML(r.rowNumber||"")}</span></div>`).join("")}</div>`).join("");
  }
  function legend(){
    return `<div class="seat-legend"><h4>Explanation</h4><div class="legend-row"><span class="legend-swatch selected">1</span>Selected seat / passenger badge</div><div class="legend-row"><span class="legend-swatch"></span>Available</div><div class="legend-row"><span class="legend-swatch blocked">X</span>Occupied / airline blocked</div><div class="legend-row"><span class="legend-swatch chargeable"></span>Chargeable seat</div><div class="legend-row"><span class="legend-swatch">EXIT</span>Exit / facility row</div><div class="legend-row"><span class="legend-swatch">B</span>Bassinet</div><div class="legend-row"><span class="legend-swatch">GAL</span>Galley</div><div class="legend-row"><span class="legend-swatch">WC</span>Lavatory</div><h4 style="margin-top:12px">Features</h4><div class="seat-feature-filter">${[["bassinet","Seat with bassinet facility"],["chargeable","Chargeable seat"],["overwing","Overwing seat(s)"],["child","Seat not suitable for child"],["restricted","Restricted seat - General"],["infant","Seat suitable for adult with an infant"]].map(([k,l])=>`<label><input type="checkbox" data-seat-filter="${k}" ${state.seatWorkbench.filters?.[k]?"checked":""}> ${l}</label>`).join("")}</div></div>`;
  }
  function seatServiceView(){
    const category=state.seatWorkbench.category||"seats",pax=state.selectedOffer?.passengers||[];
    if(category==="seat_preference")return `<div class="panel-body"><table class="data-table"><thead><tr><th>Passenger</th><th>Preference</th></tr></thead><tbody>${pax.map((p,i)=>`<tr><td>${escapeHTML(seatPassengerLabel(p,i))}</td><td><select data-seat-pref-passenger="${escapeAttr(p.id)}"><option value="">No preference</option><option value="WINDOW">Window</option><option value="AISLE">Aisle</option><option value="MIDDLE">Middle</option></select></td></tr>`).join("")}</tbody></table><div class="alert info" style="margin:8px">Seat preference is not a confirmed seat. A seat is confirmed only when a seat service is selected.</div></div>`;
    if(category==="baggage")return `<div class="panel-body"><table class="data-table"><thead><tr><th>Passenger</th><th>Live baggage services</th></tr></thead><tbody>${pax.map((p,i)=>`<tr><td>${escapeHTML(seatPassengerLabel(p,i))}</td><td>${serviceListMarkup((state.selectedOffer?.availableServices||[]).filter(s=>s.type==="baggage"&&(!s.passengerId||s.passengerId===p.id)))}</td></tr>`).join("")}</tbody></table></div>`;
    if(category==="meals")return `<div class="panel-body"><table class="data-table"><thead><tr><th>Passenger</th><th>Meal request</th></tr></thead><tbody>${pax.map((p,i)=>`<tr><td>${escapeHTML(seatPassengerLabel(p,i))}</td><td><select data-meal-passenger="${escapeAttr(p.id)}"><option value="">No request</option>${["VGML","KSML","MOML","CHML","BBML"].map(v=>`<option>${v}</option>`).join("")}</select></td></tr>`).join("")}</tbody></table><div class="alert warning" style="margin:8px">Meal codes are agent requests unless the airline returns a bookable supplier service. No airline acceptance is implied.</div></div>`;
    if(category==="pets")return `<div class="panel-body"><div class="form-grid"><div class="field"><label>Passenger</label><select id="petPassenger">${pax.map((p,i)=>`<option value="${escapeAttr(p.id)}">${escapeHTML(seatPassengerLabel(p,i))}</option>`).join("")}</select></div><div class="field"><label>Service</label><select id="petCode"><option value="PETC">PETC · Pet in cabin</option><option value="AVIH">AVIH · Animal in hold</option></select></div><div class="field"><label>Animal / weight</label><input id="petDetails" placeholder="Dog · 7kg incl. carrier"></div><div class="field"><label>Status</label><input value="Request only · carrier confirmation required" readonly></div></div><button class="secondary" data-b0074-action="record-pet-request">Record agent request</button></div>`;
    if(category==="assistance")return `<div class="panel-body"><table class="data-table"><thead><tr><th>Passenger</th><th>SSR assistance</th></tr></thead><tbody>${pax.map((p,i)=>`<tr><td>${escapeHTML(seatPassengerLabel(p,i))}</td><td>${["WCHR","WCHS","WCHC","BLND","DEAF"].map(v=>`<label style="margin-right:9px"><input type="checkbox" data-assist-passenger="${escapeAttr(p.id)}" value="${v}"> ${v}</label>`).join("")}</td></tr>`).join("")}</tbody></table><div class="alert info" style="margin:8px">Assistance requests require carrier confirmation.</div></div>`;
    if(category==="other")return `<div class="panel-body"><div class="grid grid-2"><div class="field"><label>SSR / OSI type</label><select id="manualRemarkType"><option value="SSR">SSR</option><option value="OSI">OSI</option></select></div><div class="field"><label>Passenger</label><select id="manualRemarkPax"><option value="">Whole PNR</option>${pax.map((p,i)=>`<option value="${escapeAttr(p.id)}">${escapeHTML(seatPassengerLabel(p,i))}</option>`).join("")}</select></div></div><div class="field"><label>Remark</label><textarea id="manualRemarkText" placeholder="Agent operational remark"></textarea></div><button class="secondary" data-b0074-action="record-remark">Record in PNR history</button></div>`;
    if(category==="passenger")return `<div class="panel-body">${pax.map((p,i)=>passengerForm(p,i)).join("")}</div>`;
    if(category!=="seats")return `<div class="panel-body">${emptyState("▦",humanize(category),"No supplier catalogue items were returned for this category on the current offer.")}</div>`;
    const map=activeSeatMap();
    if(!map)return `<div class="panel-body">${emptyState("▦","No seat map loaded","Refresh seat maps after selecting a current live offer.")}</div>`;
    const decks=cabinDecks(map);
    const total=[...state.selectedServices.values()].filter(s=>s.type==="seat").reduce((n,s)=>n+Number(s.totalAmount||0)*Number(s.quantity||1),0);
    return `<div class="svc-toolbar"><div class="field"><label>Quick Assign / Seat number(s)</label><input id="seatQuickAssign" placeholder="22A, 22B"></div>${decks.length>1?`<div class="field"><label>Deck</label><select id="seatDeckSelect">${decks.map(d=>`<option value="${escapeAttr(d)}" ${String(state.seatWorkbench.deck)===d?"selected":""}>${Number(d)===0?"Lower":Number(d)===1?"Upper":`Deck ${escapeHTML(d)}`}</option>`).join("")}</select></div>`:""}<label class="check"><input id="seatRequestCradle" type="checkbox" ${state.seatWorkbench.requestCradle?"checked":""}> Request cradle / bassinet</label><button class="secondary" data-b0074-action="print-seat-catalog">Print and Save</button></div><div class="svc-body">${legend()}<div class="aircraft-canvas">${cabinGrid(map)}</div></div><div class="svc-footer"><span>Selected seat total <strong>${money(total,state.selectedOffer?.totalCurrency)}</strong></span><button class="primary" data-b0074-action="review-seat-catalog">Review & Submit</button></div>`;
  }


  seatMapMarkup=function seatMapMarkupB0074(){
    if(!state.seatMaps?.length)return `<div class="muted">Seat maps load after a refreshed offer is selected.</div>`;
    const pax=state.selectedOffer?.passengers||[],segs=allSeatSegments(),selected=new Set(state.seatWorkbench.selectedPassengerIds||[]);
    return `<div class="svc-catalog"><nav class="svc-nav"><h4>Seats and Services</h4><button class="${["seats","seat_preference"].includes(state.seatWorkbench.category)?"active":""}" data-seat-category="seats">Seats</button><button class="sub ${state.seatWorkbench.category==="seats"?"active":""}" data-seat-category="seats">Seat Map</button><button class="sub ${state.seatWorkbench.category==="seat_preference"?"active":""}" data-seat-category="seat_preference">Seat Preference</button>${[["baggage","Baggage"],["meals","Meals"],["pets","Pets"],["assistance","Passenger Assistance"],["other","Other"],["passenger","Passenger Information"]].map(([id,label])=>`<button class="${state.seatWorkbench.category===id?"active":""}" data-seat-category="${id}">${label}</button>`).join("")}<button class="disabled" disabled>Travel Services (0)</button><button class="disabled" disabled>Lounge (0)</button><button class="disabled" disabled>In-flight Entertainment (0)</button><button class="disabled" disabled>Ground Transportation (0)</button><button class="disabled" disabled>Carbon Offset (0)</button><button class="disabled" disabled>Store (0)</button><button class="disabled" disabled>Mileage Accrual (0)</button><button class="disabled" disabled>Standby (0)</button><button class="disabled" disabled>Packs (0)</button><button class="disabled" disabled>Upgrades (0)</button></nav><div class="svc-main"><div class="svc-top"><div class="svc-box"><div class="svc-box-title">Passengers</div>${pax.map((p,i)=>`<label class="svc-box-row ${state.seatWorkbench.activePassengerId===p.id?"active":""}"><input type="checkbox" data-seat-pax-check="${escapeAttr(p.id)}" ${selected.has(p.id)||(!selected.size&&i===0)?"checked":""}> <input type="radio" name="seatActivePax" data-seat-pax-radio="${escapeAttr(p.id)}" ${state.seatWorkbench.activePassengerId===p.id||(!state.seatWorkbench.activePassengerId&&i===0)?"checked":""}> ${escapeHTML(seatPassengerLabel(p,i))}</label>`).join("")}</div><div class="svc-box"><div class="svc-box-title">Flight segments</div>${segs.map((g,i)=>`<label class="svc-box-row ${activeSeatSegment()?.id===g.id?"active":""}"><input type="radio" name="seatSegment" data-seat-segment="${escapeAttr(g.id)}" ${activeSeatSegment()?.id===g.id?"checked":""}> S${i+1}: ${escapeHTML((g.marketingCarrier?.iataCode||"")+(g.marketingFlightNumber||""))} · ${escapeHTML(g.origin?.iataCode||"")}-${escapeHTML(g.destination?.iataCode||"")} · ${escapeHTML(timeOnly(g.departingAt))}-${escapeHTML(timeOnly(g.arrivingAt))}</label>`).join("")}</div></div>${seatServiceView()}</div></div>`;
  };


  /* --------------------------- Hotel workbench --------------------------- */
  function filteredStayResults(){
    const chain=String(state.hotelSearchDraft.chainCode||"").trim().toLowerCase();
    const filters=Object.entries(state.hotelAmenities||{}).filter(([,v])=>v).map(([k])=>k);
    return (state.stayResults||[]).filter(r=>{
      const a=r.accommodation||{};
      if(chain&&!JSON.stringify([a.chain,a.brand]).toLowerCase().includes(chain))return false;
      if(filters.length){const hay=JSON.stringify(a.amenities||[]).toLowerCase();if(filters.some(f=>!hay.includes(f)))return false}
      return true;
    });
  }
  function childAgeFields(){return state.hotelChildAges.map((age,i)=>`<div class="field"><label>Child ${i+1} age at check-out</label><select data-hotel-child-age="${i}">${Array.from({length:16},(_,n)=>`<option value="${n+2}" ${Number(age)===n+2?"selected":""}>${n+2}</option>`).join("")}</select></div>`).join("")}
  function hotelCancellation(rate){
    const t=rate.cancellationTimeline||[];
    if(!t.length)return "Supplier cancellation terms shown after final quote";
    return t.map(x=>`${x.refundable===false?"Non-refundable":"Refundable"}${x.before?` before ${x.before}`:""}${x.refund_amount?` · refund ${money(x.refund_amount,x.currency||rate.totalCurrency)}`:""}${x.penalty_amount?` · penalty ${money(x.penalty_amount,x.penalty_currency||rate.totalCurrency)}`:""}`).join("; ");
  }
  const liveBadge=()=>'<span class="hotel-status live">LIVE SUPPLIER</span>';
  function packageBasket(){
    const b=booking74()||{},hotel=state.stayQuote;
    return `<aside class="panel basket"><div class="panel-head">Trip Basket</div><div class="panel-body"><div class="money-line"><span>Booking Ref</span><strong>${escapeHTML(masterRef74())}</strong></div><div class="money-line"><span>Status</span><strong>${escapeHTML(humanize(b.packageStatus||b.status||"BUILDING"))}</strong></div><div class="basket-block"><strong>✈ Outbound Flight</strong><div class="muted">${escapeHTML((state.selectedOffer?.slices?.[0]?.segments?.[0]?.marketingCarrier?.iataCode||"")+(state.selectedOffer?.slices?.[0]?.segments?.[0]?.marketingFlightNumber||"")||"No flight selected")}</div></div><div class="basket-block"><strong>🏨 Accommodation</strong><div class="muted">${hotel?`${escapeHTML(hotel.accommodation?.name||"Selected hotel")} · ${escapeHTML(hotel.boardType||hotel.paymentType||"")}`:"No hotel selected"}</div></div><div class="basket-block"><strong>🚐 Transfers</strong><div class="muted">${transferComponents74().length?`${transferComponents74().length} transfer component(s)`:"Not selected - use Package Builder transfer panel"}</div></div><div class="money-line"><span>Recorded booking</span><strong>${money(Number(b.totalAmount||0),b.currency)}</strong></div><div class="money-line"><span>Hotel quote</span><strong>${hotel?money(hotel.totalAmount,hotel.totalCurrency):"—"}</strong></div><div class="money-line"><span>Package total</span><strong class="price-total">${money(packageTotal74()+(hotel?Number(hotel.totalAmount||0):0),b.currency||hotel?.totalCurrency||state.preferences.currency)}</strong></div><button class="primary" style="width:100%;margin-top:8px" data-b0074-action="preview-confirmation">Preview Booking Confirmation</button></div></aside>`;
  }
  function renderHotelWorkbench(){
    const d=state.hotelSearchDraft,visible=filteredStayResults();
    return `${pageHead("Tour Operator Hotel Workbench","Dense Hotels master-detail search with exact child ages and a package basket. Board basis, rate code, payment method and cancellation terms are live supplier data.")}<div class="hotel-workbench"><div><section class="panel hotel-searchbar"><div class="panel-head">Search Inventory</div><div class="panel-body"><div class="form-grid"><div class="field"><label>Destination / Resort</label><input id="stayDest74" value="${escapeAttr(d.destination||"")}" placeholder="Palma de Mallorca, Alcudia, PMI"></div><div class="field"><label>Check-in</label><input id="stayIn74" type="date" value="${escapeAttr(d.checkInDate||"")}"></div><div class="field"><label>Check-out</label><input id="stayOut74" type="date" value="${escapeAttr(d.checkOutDate||"")}"></div><div class="field"><label>Rooms</label><input id="stayRooms74" type="number" min="1" max="9" value="${escapeAttr(String(d.rooms||1))}"></div><div class="field"><label>Adults</label><input id="stayAdults74" type="number" min="1" max="9" value="${escapeAttr(String(d.adults||2))}"></div><div class="field"><label>Children</label><input id="stayChildren74" type="number" min="0" max="8" value="${state.hotelChildAges.length}"></div><div class="field"><label>Chain / Brand Filter</label><input id="stayChain74" maxlength="40" value="${escapeAttr(d.chainCode||"")}" placeholder="Marriott / Hyatt"></div><div class="field"><label>Radius KM</label><input id="stayRadius74" type="number" min="1" max="100" value="${escapeAttr(String(d.radiusKm||25))}"></div></div><div class="form-grid">${childAgeFields()}</div><div class="toolbar" style="padding-left:0"><label class="check"><input type="checkbox" data-hotel-amenity="pool" ${state.hotelAmenities.pool?"checked":""}> Pool</label><label class="check"><input type="checkbox" data-hotel-amenity="gym" ${state.hotelAmenities.gym?"checked":""}> Gym</label><label class="check"><input type="checkbox" data-hotel-amenity="wifi" ${state.hotelAmenities.wifi?"checked":""}> Free WiFi</label><label class="check"><input type="checkbox" data-hotel-amenity="pet" ${state.hotelAmenities.pet?"checked":""}> Pet Friendly</label></div></div><div class="panel-foot"><button class="primary" data-b0074-action="stay-search">Search Inventory</button></div></section><section style="margin-top:10px">${visible.length?visible.map(r=>{
      const a=r.accommodation||{},image=r.imageUrl||a.photos?.[0]||"",rates=state.selectedStayResult===r.id?state.stayRates:[];
      return `<article class="hotel-card"><div class="hotel-head">${image?`<img class="hotel-thumb" src="${escapeAttr(image)}" alt="">`:'<div class="hotel-thumb"></div>'}<div><strong>${escapeHTML(r.title||a.name||"Accommodation")}</strong><div class="muted">${escapeHTML(r.address?.city||a.address?.city||"")} · ${"★".repeat(Math.max(0,Math.min(5,Math.round(Number(r.rating||a.rating||0)))))} </div></div><div><span class="muted">Lead price</span><div class="strong">${money(r.cheapestRateTotalAmount||r.total,r.cheapestRateTotalCurrency||r.currency)}</div></div><div>${liveBadge()}<br><button class="link" data-b0074-action="stay-rates" data-search-result-id="${escapeAttr(r.id)}">${rates.length?"Refresh rates":"Rooms & rates"}</button></div></div>${rates.length?`<div class="hotel-matrix"><table class="data-table"><thead><tr><th>Room Type</th><th>Max Occupancy</th><th>Board Basis</th><th>Rate Code</th><th>Inventory</th><th>Price / Payment</th><th>Benefits</th><th>Cancellation Policy</th><th></th></tr></thead><tbody>${rates.map(rate=>`<tr><td><strong>${escapeHTML(rate.roomName||"Room")}</strong><br><small>${escapeHTML(rate.roomDescription||"")}</small></td><td>${escapeHTML(rate.maxOccupancy?String(rate.maxOccupancy):"Supplier rules")}</td><td><strong>${escapeHTML(rate.boardType||"Supplier rate")}</strong></td><td class="mono">${escapeHTML(rate.rateCode||"—")}</td><td>${liveBadge()}</td><td><strong>${money(rate.totalAmount,rate.totalCurrency)}</strong><br><small>${escapeHTML(rate.paymentType||"Live rate")}</small>${Number(rate.dueAtAccommodationAmount||0)>0?`<br><small>At hotel: ${money(rate.dueAtAccommodationAmount,rate.dueAtAccommodationCurrency||rate.totalCurrency)}</small>`:""}</td><td>${escapeHTML((rate.benefits||[]).map(x=>x.title||x.type).filter(Boolean).join(", ")||"—")}</td><td><strong>${escapeHTML(hotelCancellation(rate))}</strong></td><td><button class="primary" data-b0074-action="stay-quote" data-rate-id="${escapeAttr(rate.rateId)}">Quote / Add</button></td></tr>`).join("")}</tbody></table></div>`:""}</article>`;
    }).join(""):emptyState("⌂","No stay results loaded","Search Hotels using the destination/resort and exact child ages.")}</section>${state.stayQuote?renderStayQuote74():""}</div>${packageBasket()}</div>`;
  }
  function renderStayQuote74(){
    const q=state.stayQuote;if(!q)return "";
    return `<section class="panel" style="margin-top:10px"><div class="panel-head"><span>Final Stay Quote</span><span class="badge info">LIVE QUOTE</span></div><div class="panel-body"><div class="grid grid-4"><div><span class="muted">Hotel</span><div class="strong">${escapeHTML(q.accommodation?.name||"Accommodation")}</div></div><div><span class="muted">Board</span><div class="strong">${escapeHTML(q.boardType||"—")}</div></div><div><span class="muted">Rate code</span><div class="strong mono">${escapeHTML(q.rateCode||"—")}</div></div><div><span class="muted">Payment</span><div class="strong">${escapeHTML(q.paymentType||"—")}</div></div></div><div class="money-line"><span>Base</span><strong>${money(q.baseAmount,q.totalCurrency)}</strong></div><div class="money-line"><span>Taxes</span><strong>${money(q.taxAmount,q.taxCurrency||q.totalCurrency)}</strong></div><div class="money-line"><span>Total</span><strong class="price-total">${money(q.totalAmount,q.totalCurrency)}</strong></div><div class="alert warning" style="margin-top:8px"><span>!</span><div><strong>Cancellation</strong>${escapeHTML(hotelCancellation(q))}</div></div></div><div class="panel-foot"><button class="primary" data-b0074-action="stay-book">Book into open ALTEA file</button></div></section>`;
  }
  function openStayBooking74(){
    const q=state.stayQuote;if(!q)return;
    const p=selectedBookingPax74(),cp=p?.payload?.customerProfile||{};
    openModal("Book Hotel",`<div class="field"><label>Lead guest first name</label><input id="stayGuestFirst74" value="${escapeAttr(p?.firstName||cp.firstName||"")}"></div><div class="field"><label>Lead guest last name</label><input id="stayGuestLast74" value="${escapeAttr(p?.lastName||cp.lastName||"")}"></div><div class="field"><label>Email</label><input id="stayGuestEmail74" type="email" value="${escapeAttr(cp.email||booking74()?.customerEmail||"")}"></div><div class="field"><label>Phone (E.164)</label><input id="stayGuestPhone74" value="${escapeAttr(cp.phone||p?.payload?.contact?.phone||"")}" placeholder="+12125550123"></div>`,[{label:"Back",className:"secondary",close:true},{label:"Book stay",className:"primary",onClick:()=>{const payload={quoteId:q.id,guests:[{givenName:document.getElementById("stayGuestFirst74")?.value||"",familyName:document.getElementById("stayGuestLast74")?.value||""}],email:document.getElementById("stayGuestEmail74")?.value||"",phoneNumber:document.getElementById("stayGuestPhone74")?.value||"",alteaBookingId:booking74()?.id||""};closeModal();post("DUFFEL_CREATE_STAY_BOOKING",payload)}}]);
  }


  /* --------------------------- Package / Transfers --------------------------- */
  function sellableTransferCandidates(){return (state.inventory||[]).filter(x=>norm(x.entityType||x.type)==="TRANSFER").slice(0,100)}
  function selectedTransferProduct(){return sellableTransferCandidates().find(x=>String(x.id)===String(state.packageTransferEntityId))||null}
  function sellableDatedLines(product){return (product?.dated||[]).filter(d=>!d.stopSale&&!d.blackout&&Number(d.available??0)>0&&["OPEN","AVAILABLE"].includes(String(d.status||"OPEN").toUpperCase()))}
  function packageClassPanel(){
    const b=booking74()||{},p=b.payload||{};
    return `<section class="panel"><div class="panel-head">Charter / Tour Operator Classification</div><div class="panel-body"><div class="form-grid"><div class="field"><label>Booking type</label><select id="packageBookingType74">${["FLIGHT_ONLY","LAND_ONLY","DYNAMIC_PACKAGE","SKANDI_PACKAGE","GROUP_BOOKING"].map(v=>option(v,humanize(v),norm(b.bookingType||p.bookingType||"DYNAMIC_PACKAGE"))).join("")}</select></div><div class="field"><label>Tour Operator Code</label><select id="packageTourOperator74">${["SKANDI","TUI","VING","APOL"].map(v=>option(v,v,b.tourOperatorCode||p.tourOperatorCode||"SKANDI")).join("")}</select></div><div class="field"><label>Destination Resort / Zone</label><input id="packageResortZone74" value="${escapeAttr(b.destinationResortZone||p.destinationResortZone||"")}" placeholder="Alcudia / Magaluf / Playa de Muro"></div><div class="field"><label>Duration</label><select id="packageDuration74"><option value="7" ${Number(b.durationNights||p.durationNights)===7?"selected":""}>7 Nights</option><option value="14" ${Number(b.durationNights||p.durationNights)===14?"selected":""}>14 Nights</option><option value="0" ${![7,14].includes(Number(b.durationNights||p.durationNights))?"selected":""}>Flexible</option></select></div><div class="field"><label>Meal Board</label><select id="packageMealBoard74">${[["RO","Room Only"],["BB","Bed & Breakfast"],["HB","Half Board"],["AI","All Inclusive"]].map(([v,l])=>`<option value="${v}" ${String(b.mealBoard||p.mealBoard||"")===v?"selected":""}>${v} · ${l}</option>`).join("")}</select></div><div class="field span-2"><label>Room Type Code / Description</label><input id="packageRoomType74" value="${escapeAttr(b.roomTypeCode||p.roomTypeCode||"")}" placeholder="Double Room, Sea View, Balcony"></div><div class="field"><label>Start date</label><input id="packageStart74" type="date" value="${escapeAttr(b.departureDate||b.startDate||"")}"></div><div class="field"><label>End date</label><input id="packageEnd74" type="date" value="${escapeAttr(b.returnDate||b.endDate||"")}"></div></div><div class="alert info"><span>ℹ</span><div>Tour-operator fields classify the SKANDI package. Live hotel board/rate data remains authoritative; SKANDI does not calculate synthetic board supplements.</div></div><button class="primary" data-b0074-action="save-package">Save package setup</button></div></section>`;
  }
  function transferPanel(){
    const b=booking74()||{},flight=state.selectedOffer?.slices?.[0]?.segments?.[0]||{},hotel=components74().find(c=>norm(c.componentType||c.entityType).includes("HOTEL"))||{},candidates=sellableTransferCandidates(),product=selectedTransferProduct(),dated=sellableDatedLines(product),p=selectedBookingPax74(),phone=p?.payload?.customerProfile?.phone||p?.payload?.contact?.phone||"";
    return `<section class="transfer-builder"><div class="panel-head">Smart Transfer Ancillary</div><div class="panel-body"><div class="alert info"><span>ℹ</span><div><strong>Basket-aware routing</strong>Flight and hotel context is prefilled from the open booking. Transfer supply uses SKANDI Inventory; no transfer product is fabricated.</div></div><div class="form-grid"><div class="field"><label>Transfer product</label><select id="pkgTransferEntity74"><option value="">Select SKANDI transfer</option>${candidates.map(x=>`<option value="${escapeAttr(x.id)}" ${String(x.id)===String(state.packageTransferEntityId)?"selected":""}>${escapeHTML(x.name||x.title||"Transfer")}</option>`).join("")}</select></div>${product?.dated?.length?`<div class="field"><label>Service / capacity line</label><select id="pkgTransferDated74"><option value="">Select dated inventory</option>${dated.map(d=>`<option value="${escapeAttr(d.id||d.datedInventoryId)}">${escapeHTML(d.serviceDate||d.service_date||"")} · ${escapeHTML(d.variantName||d.variant_name||d.variantCode||"Standard")} · ${escapeHTML(String(d.available??0))} available</option>`).join("")}</select></div>`:""}<div class="field"><label>Transfer type</label><select id="pkgTransferType74"><option>Shared Shuttle</option><option>Private Standard Taxi</option><option>Private VIP</option><option>Minivan</option><option>Wheelchair Accessible</option></select></div><div class="field"><label>Direction</label><select id="pkgTransferDirection74"><option value="INBOUND">Inbound: Airport → Hotel</option><option value="OUTBOUND">Outbound: Hotel → Airport</option><option value="ROUNDTRIP">Roundtrip</option></select></div><div class="field"><label>Arrival flight</label><input id="pkgTransferFlight74" value="${escapeAttr((flight.marketingCarrier?.iataCode||"")+(flight.marketingFlightNumber||""))}"></div><div class="field"><label>Scheduled arrival</label><input id="pkgTransferArrival74" value="${escapeAttr(flight.arrivingAt||"")}"></div><div class="field"><label>Pick-up</label><input id="pkgTransferPickup74" value="${escapeAttr(flight.destination?.iataCode||b.destination||"")}"></div><div class="field"><label>Drop-off / Hotel</label><input id="pkgTransferDropoff74" value="${escapeAttr(hotel.title||hotel.payload?.hotelName||"")}"></div><div class="field"><label>Traveler mobile</label><input id="pkgTransferPhone74" value="${escapeAttr(phone)}" placeholder="+12125550123"></div><div class="field"><label>Standard suitcases</label><input id="pkgTransferBags74" type="number" min="0" max="20" value="2"></div><div class="field"><label>Child / infant seats</label><input id="pkgTransferChildSeats74" type="number" min="0" max="9" value="0"></div></div><div class="toolbar" style="padding-left:0"><label class="check"><input id="pkgGolf74" type="checkbox"> Golf bags</label><label class="check"><input id="pkgStroller74" type="checkbox"> Strollers</label><label class="check"><input id="pkgBike74" type="checkbox"> Bicycles</label><label class="check"><input id="pkgSkis74" type="checkbox"> Skis</label></div><button class="primary" data-b0074-action="add-transfer">Add Transfer to Booking</button></div></section>`;
  }
  function renderPackageWorkbench(){
    const b=booking74();
    if(!b)return `${pageHead("Package Builder","Open or create a booking file before assembling a package.")}<div class="grid grid-3">${emptyState("◈","No booking selected","Create/open a SKANDI booking file first.")}</div>`;
    const comps=components74();
    return `${pageHead("Package Builder",`${masterRef74()} · Air + hotel + transfer + tour package workspace`,'<button class="secondary" data-b0074-action="preview-confirmation">Preview Confirmation</button>')}<div class="grid grid-4"><div class="stat"><div class="stat-label">Master reference</div><div class="stat-value" style="font-size:18px">${escapeHTML(masterRef74())}</div></div><div class="stat"><div class="stat-label">Passengers</div><div class="stat-value">${passengers74().length}</div></div><div class="stat"><div class="stat-label">Components</div><div class="stat-value">${comps.length}</div></div><div class="stat"><div class="stat-label">Recorded total</div><div class="stat-value" style="font-size:18px">${money(packageTotal74(),b.currency||state.preferences.currency)}</div></div></div><div class="grid grid-2" style="margin-top:10px"><div>${packageClassPanel()}${transferPanel()}</div>${packageBasket()}</div>`;
  }
  function savePackage74(){
    const b=booking74();if(!b?.id)return;
    post("ALTEA_UPDATE_BOOKING",{bookingId:b.id,patch:{bookingType:document.getElementById("packageBookingType74")?.value||"DYNAMIC_PACKAGE",tourOperatorCode:document.getElementById("packageTourOperator74")?.value||"SKANDI",destinationResortZone:document.getElementById("packageResortZone74")?.value||"",durationNights:Number(document.getElementById("packageDuration74")?.value||0),mealBoard:document.getElementById("packageMealBoard74")?.value||"",roomTypeCode:document.getElementById("packageRoomType74")?.value||"",startDate:document.getElementById("packageStart74")?.value||"",endDate:document.getElementById("packageEnd74")?.value||"",packageStatus:b.packageStatus||b.status||"DRAFT",passengerAges:passengers74().map(p=>({passengerId:p.id,type:p.paxType||"",dateOfBirth:p.dateOfBirth||""}))}});
  }
  function addTransfer74(){
    const b=booking74(),entityId=document.getElementById("pkgTransferEntity74")?.value||"";if(!b?.id||!entityId)return toast("Transfer product required","Choose a SKANDI transfer product.","warning");
    const product=sellableTransferCandidates().find(x=>String(x.id)===String(entityId)),datedInventoryId=document.getElementById("pkgTransferDated74")?.value||"";
    if(product?.dated?.length&&!datedInventoryId)return toast("Dated inventory required","Choose the exact service/capacity line so Inventory Control sold/available stays synchronized.","warning");
    state._pendingTransferDetails={transferType:document.getElementById("pkgTransferType74")?.value||"",direction:document.getElementById("pkgTransferDirection74")?.value||"",arrivalFlightNumber:document.getElementById("pkgTransferFlight74")?.value||"",scheduledArrivalTime:document.getElementById("pkgTransferArrival74")?.value||"",pickupLocation:document.getElementById("pkgTransferPickup74")?.value||"",dropoffLocation:document.getElementById("pkgTransferDropoff74")?.value||"",travelerMobile:document.getElementById("pkgTransferPhone74")?.value||"",standardSuitcases:Number(document.getElementById("pkgTransferBags74")?.value||0),childSeats:Number(document.getElementById("pkgTransferChildSeats74")?.value||0),extras:[["Golf Bags",document.getElementById("pkgGolf74")?.checked],["Strollers",document.getElementById("pkgStroller74")?.checked],["Bicycles",document.getElementById("pkgBike74")?.checked],["Skis",document.getElementById("pkgSkis74")?.checked]].filter(x=>x[1]).map(x=>x[0])};
    post("ALTEA_ADD_INVENTORY_COMPONENT",{bookingId:b.id,entityId,datedInventoryId:datedInventoryId||undefined,quantity:1});
  }


  /* --------------------------- Customer Profiles / CRM --------------------------- */
  function crmRows(){
    const selected=String(state.clubSelectedCustomerId||"");
    return (state.clubSearchResults||[]).map(r=>`<div class="crm-row ${String(r.customerProfileId||r.id)===selected?"active":""}" data-b0074-action="crm-open" data-profile-id="${escapeAttr(r.customerProfileId||r.id)}"><strong>${escapeHTML(r.name||"Customer")}</strong><div class="muted">${escapeHTML(r.email||"")}</div><div>${r.isLoyaltyMember?`<span class="badge info">SKANDI CLUB · ${escapeHTML(r.tier||"MEMBER")}</span>`:'<span class="badge neutral">SKANDI MEMBER</span>'}</div></div>`).join("");
  }
  function crmDetail(){
    const p=state.customerProfileDetail||selectedClubCustomer74();
    if(!p)return emptyState("♙","Select a customer","Search by last name, email or member number, then open the profile.");
    return `<div class="panel-head"><span>${escapeHTML(p.name||"Customer Profile")}</span>${p.isLoyaltyMember?`<span class="badge info">${escapeHTML(p.tier||"SKANDI CLUB")}</span>`:'<span class="badge neutral">SKANDI MEMBER</span>'}</div><div class="panel-body"><div class="crm-detail-grid"><div><span class="muted">Member ID</span><strong>${escapeHTML(p.memberId||"—")}</strong></div><div><span class="muted">Club number</span><strong>${escapeHTML(p.memberNumber||"Not enrolled")}</strong></div><div><span class="muted">Points</span><strong>${escapeHTML(String(p.pointsBalance??0))}</strong></div><div><span class="muted">Email</span><strong>${escapeHTML(p.email||"—")}</strong></div><div><span class="muted">Phone</span><strong>${escapeHTML(p.phone||"—")}</strong></div><div><span class="muted">Seat preference</span><strong>${escapeHTML(p.preferences?.seat||"—")}</strong></div><div><span class="muted">Dietary / meals</span><strong>${escapeHTML([p.preferences?.dietary,...(p.preferences?.meals||[])].filter(Boolean).join(", ")||"—")}</strong></div><div><span class="muted">Accessibility</span><strong>${escapeHTML(p.accessibilityNeeds||"—")}</strong></div><div><span class="muted">Stored payment</span><strong>${escapeHTML((p.storedPaymentMethods||[]).map(x=>`${x.brand||"CARD"} •••• ${x.last4||""}`).join(", ")||"No masked method exposed")}</strong></div></div><div class="crm-section"><h4>Saved Travelers</h4>${p.travelers?.length?`<table class="data-table"><thead><tr><th>Name</th><th>DOB</th><th>Passport</th><th>Preferences</th><th></th></tr></thead><tbody>${p.travelers.map(t=>`<tr><td>${escapeHTML(t.name||"")}</td><td>${escapeHTML(t.dateOfBirth||"—")}</td><td>${t.passportLast4?`•••• ${escapeHTML(t.passportLast4)} · ${escapeHTML(t.passportExpiry||"")}`:"—"}</td><td>${escapeHTML([t.dietaryPrefs,t.accessibilityNeeds].filter(Boolean).join(" · ")||"—")}</td><td><button class="link" data-b0074-action="crm-transfer" data-profile-id="${escapeAttr(p.customerProfileId||p.id)}" data-traveler-id="${escapeAttr(t.id)}">Transfer to passenger / PNR</button></td></tr>`).join("")}</tbody></table>`:'<div class="muted">No saved travelers returned.</div>'}</div><div class="crm-section"><h4>Secure Documents</h4>${p.documents?.length?`<table class="data-table"><thead><tr><th>Type</th><th>Last 4</th><th>Issue</th><th>Expiry</th><th>Status</th></tr></thead><tbody>${p.documents.map(d=>`<tr><td>${escapeHTML(d.documentType||d.title||"")}</td><td>${escapeHTML(d.last4||"—")}</td><td>${escapeHTML(d.issueDate||"—")}</td><td>${escapeHTML(d.expiryDate||"—")}</td><td>${escapeHTML(d.status||"")}</td></tr>`).join("")}</tbody></table>`:'<div class="muted">No secure document metadata returned.</div>'}</div><div class="crm-section"><h4>Loyalty Accounts</h4><div class="muted">${escapeHTML([...(p.preferences?.frequentFlyer||[]),...(p.preferences?.hotelLoyalty||[]),...(p.preferences?.carLoyalty||[])].map(x=>typeof x==="string"?x:(x.label||x.accountNumber||x.number||"")).filter(Boolean).join(" · ")||"No loyalty accounts stored")}</div></div><div class="crm-section"><h4>Emergency Contacts</h4><div class="muted">${escapeHTML((p.emergencyContacts||[]).map(x=>typeof x==="string"?x:[x.name,x.phone,x.relationship].filter(Boolean).join(" · ")).join(" | ")||"No emergency contact stored")}</div></div><div class="club-profile-actions"><button class="primary" data-b0074-action="crm-transfer" data-profile-id="${escapeAttr(p.customerProfileId||p.id)}">Transfer Primary Profile to Passenger / PNR</button></div></div>`;
  }
  function renderCrmWorkbench(){
    const list=passengers74(),active=list.find(x=>x.id===state.selectedPassengerId)||list[0]||null;
    return `${pageHead("Customer Profiles & CRM","Canonical SKANDI customer_profiles search. Customer profile data is transferred into the active ALTEA passenger; System is not used as a CRM directory.",'<button class="secondary" disabled title="Create customer identities in the canonical Customer Management/account workflow.">+ Create New Profile</button>')}<div class="crm-workbench"><section class="panel"><div class="panel-head">Search & Results</div><div class="panel-body"><div class="field"><label>Passenger target</label><select id="crmPassenger74">${list.map(p=>option(p.id,paxName74(p),active?.id)).join("")}</select></div><div class="field"><label>Search</label><input id="crmSearch74" value="${escapeAttr(state.clubSearchText||"")}" placeholder="Last name, email, member number"></div><div class="grid grid-2"><div class="field"><label>Search by</label><select id="crmSearchType74">${["all","name","email","member"].map(v=>option(v,humanize(v),state.clubSearchType||"all")).join("")}</select></div><div class="field"><label>Membership</label><select id="crmMembership74">${["all","members","not_enrolled"].map(v=>option(v,humanize(v),state.clubMembershipFilter||"all")).join("")}</select></div></div><button class="primary" data-b0074-action="crm-search">Search Profiles</button></div><div class="crm-results">${crmRows()||'<div class="empty">No profile results loaded.</div>'}</div></section><section class="panel">${crmDetail()}</section></div>`;
  }


  /* --------------------------- Confirmation Preview --------------------------- */
  function ensurePreviewButton(){
    const tabs=document.querySelector(".workspace-tabs");if(!tabs||document.getElementById("bookingPreviewQuick"))return;
    const b=document.createElement("button");b.id="bookingPreviewQuick";b.className="quick-preview";b.type="button";b.textContent="Preview Confirmation";
    b.addEventListener("click",()=>previewConfirmation74());tabs.appendChild(b);
  }
  function previewConfirmation74(){
    const id=booking74()?.id;if(!id)return toast("Booking file required","Create or open a booking before previewing the customer confirmation.","warning");
    post("ALTEA_PREVIEW_BOOKING_CONFIRMATION",{bookingId:id});
  }


  /* --------------------------- Events --------------------------- */
  main.addEventListener("click",event=>{
    const seat=event.target.closest?.("[data-b0074-seat]");
    if(seat){event.preventDefault();const map=activeSeatMap(),el=(map?.seats||[]).find(x=>String(x.designator)===String(seat.dataset.b0074Seat));if(el)toggleSeat74(el,map);return}
    const category=event.target.closest?.("[data-seat-category]");if(category){state.seatWorkbench.category=category.dataset.seatCategory;render();return}
    const action=event.target.closest?.("[data-b0074-action]")?.dataset.b0074Action;
    if(!action)return;
    if(action==="review-seat-catalog"){state.activeView="workspace";render();toast("Seat selections ready",`${[...state.selectedServices.values()].filter(s=>s.type==="seat").length} seat selection(s) are included in the current order workspace.`,"success");return}
    if(action==="print-seat-catalog"){window.print();return}
    if(action==="record-pet-request"){
      const passengerId=document.getElementById("petPassenger")?.value||"",code=document.getElementById("petCode")?.value||"PETC",details=document.getElementById("petDetails")?.value||"";
      if(booking74()?.id)post("ALTEA_ADD_HISTORY_NOTE",{bookingId:booking74().id,eventType:"AGENT_SERVICE_REQUEST",note:`${code}${passengerId?` passenger ${passengerId}`:""}: ${details||"Pet request"}`});
      else toast("Booking file required","Open a booking before recording a pet request.","warning");return;
    }
    if(action==="record-remark"){
      const type=document.getElementById("manualRemarkType")?.value||"OSI",passengerId=document.getElementById("manualRemarkPax")?.value||"",text=document.getElementById("manualRemarkText")?.value.trim()||"";
      if(!booking74()?.id||!text)return toast("Remark required","Open a booking and enter the SSR/OSI remark.","warning");
      post("ALTEA_ADD_HISTORY_NOTE",{bookingId:booking74().id,eventType:`AGENT_${type}`,note:`${type}${passengerId?` PAX ${passengerId}`:""}: ${text}`});return;
    }
    if(action==="stay-search"){
      const d=state.hotelSearchDraft;post("DUFFEL_SEARCH_STAYS",{destination:d.destination,checkInDate:d.checkInDate,checkOutDate:d.checkOutDate,rooms:Number(d.rooms||1),adults:Number(d.adults||2),childAges:state.hotelChildAges,radiusKm:Number(d.radiusKm||25),instantPayment:true});return;
    }
    if(action==="stay-rates"){
      const id=event.target.closest("[data-search-result-id]")?.dataset.searchResultId||"";state.selectedStayResult=id;state.stayRates=[];state.stayQuote=null;post("DUFFEL_FETCH_STAY_RATES",{searchResultId:id});render();return;
    }
    if(action==="stay-quote"){
      const id=event.target.closest("[data-rate-id]")?.dataset.rateId||"";state.selectedStayRate=id;post("DUFFEL_QUOTE_STAY",{rateId:id});return;
    }
    if(action==="stay-book"){openStayBooking74();return}
    if(action==="save-package"){savePackage74();return}
    if(action==="add-transfer"){addTransfer74();return}
    if(action==="preview-confirmation"){previewConfirmation74();return}
    if(action==="crm-search"){
      const q=document.getElementById("crmSearch74")?.value||"";state.clubSearchText=q;state.clubSearchType=document.getElementById("crmSearchType74")?.value||"all";state.clubMembershipFilter=document.getElementById("crmMembership74")?.value||"all";
      post("ALTEA_CLUB_SEARCH",{query:q,searchType:state.clubSearchType,membershipFilter:state.clubMembershipFilter,passengerId:document.getElementById("crmPassenger74")?.value||state.selectedPassengerId||"",bookingId:booking74()?.id||""});return;
    }
    if(action==="crm-open"){
      state.clubSelectedCustomerId=event.target.closest("[data-profile-id]")?.dataset.profileId||"";state.customerProfileDetail=null;post("ALTEA_CUSTOMER_PROFILE_GET",{customerProfileId:state.clubSelectedCustomerId},{busy:false});render();return;
    }
    if(action==="crm-transfer"){
      const passengerId=document.getElementById("crmPassenger74")?.value||state.selectedPassengerId||"",el=event.target.closest("[data-profile-id]");const profileId=el?.dataset.profileId||state.clubSelectedCustomerId||"",travelerId=el?.dataset.travelerId||"";
      if(!passengerId||!profileId)return toast("Passenger and profile required","Select a target passenger and customer profile.","warning");
      post("ALTEA_CLUB_LINK_MEMBER",{bookingId:booking74()?.id||"",passengerId,customerProfileId:profileId,travelerId});return;
    }
  });


  main.addEventListener("change",event=>{
    const e=event.target;
    if(e.matches?.("[data-seat-pax-radio]")){state.seatWorkbench.activePassengerId=e.dataset.seatPaxRadio;render();return}
    if(e.matches?.("[data-seat-pax-check]")){const set=new Set(state.seatWorkbench.selectedPassengerIds||[]);e.checked?set.add(e.dataset.seatPaxCheck):set.delete(e.dataset.seatPaxCheck);state.seatWorkbench.selectedPassengerIds=[...set];render();return}
    if(e.matches?.("[data-seat-segment]")){state.seatWorkbench.activeSegmentId=e.dataset.seatSegment;state.seatWorkbench.deck="";render();return}
    if(e.matches?.("[data-seat-filter]")){state.seatWorkbench.filters[e.dataset.seatFilter]=e.checked;render();return}
    if(e.id==="seatRequestCradle"){state.seatWorkbench.requestCradle=e.checked;return}
    if(e.id==="seatDeckSelect"){state.seatWorkbench.deck=e.value;render();return}
    if(e.id==="stayChildren74"){const n=Math.max(0,Math.min(8,Number(e.value||0)));state.hotelChildAges=Array.from({length:n},(_,i)=>state.hotelChildAges[i]??7);render();return}
    if(e.matches?.("[data-hotel-child-age]")){state.hotelChildAges[Number(e.dataset.hotelChildAge)]=Number(e.value);return}
    if(e.matches?.("[data-hotel-amenity]")){state.hotelAmenities[e.dataset.hotelAmenity]=e.checked;render();return}
    if(e.id==="stayChain74"){state.hotelSearchDraft.chainCode=e.value;render();return}
    if(e.id==="pkgTransferEntity74"){state.packageTransferEntityId=e.value;render();return}
    if(e.id==="crmPassenger74"){state.selectedPassengerId=e.value;return}
  });
  main.addEventListener("input",event=>{
    const e=event.target;if(!e?.id)return;
    const map={stayDest74:"destination",stayIn74:"checkInDate",stayOut74:"checkOutDate",stayRooms74:"rooms",stayAdults74:"adults",stayRadius74:"radiusKm"};
    const key=map[e.id];if(key)state.hotelSearchDraft[key]=["rooms","adults","radiusKm"].includes(key)?Number(e.value||0):e.value;
  });
  main.addEventListener("keydown",event=>{if(event.target?.id==="seatQuickAssign"&&event.key==="Enter"){event.preventDefault();quickAssign(event.target.value)}});


  window.addEventListener("message",event=>{
    const m=typeof event.data==="string"?(()=>{try{return JSON.parse(event.data)}catch(_){return null}})():event.data;
    if(!m||m.source!==PARENT_SOURCE)return;const p=m.payload||{};
    if(m.type==="ALTEA_CUSTOMER_PROFILE_RESULT"){state.customerProfileDetail=p.profile||null;if(state.activeView==="club")render()}
    if(m.type==="ALTEA_COMPONENT_UPDATED"&&state._pendingTransferDetails&&p.component?.id){const details=state._pendingTransferDetails;state._pendingTransferDetails=null;post("ALTEA_UPDATE_COMPONENT",{bookingId:booking74()?.id||"",componentId:p.component.id,patch:{payload:details}},{busy:false})}
    if(m.type==="ALTEA_BOOKING_CONFIRMATION_PREVIEW"&&p.html){openModal("Booking Confirmation Preview",'<iframe class="preview-frame" id="bookingPreviewFrame"></iframe>',[{label:"Close",className:"secondary",close:true},{label:"Print",className:"primary",onClick:()=>document.getElementById("bookingPreviewFrame")?.contentWindow?.print()}],{size:"lg",onMount:()=>{const f=document.getElementById("bookingPreviewFrame");if(f)f.srcdoc=p.html}})}
  });


  const previousRender=render;
  render=function renderB0074(){
    previousRender();
    if(state.activeView==="hotels")main.innerHTML=`<section class="view">${renderHotelWorkbench()}</section>`;
    if(state.activeView==="packagebuilder")main.innerHTML=`<section class="view">${renderPackageWorkbench()}</section>`;
    if(state.activeView==="club")main.innerHTML=`<section class="view">${renderCrmWorkbench()}</section>`;
    ensurePreviewButton();const q=document.getElementById("bookingPreviewQuick");if(q)q.disabled=!booking74()?.id;
  };
// --- GLOBAL DATE SYNCHRONIZER ---
  // Listens to the whole document so it never breaks when tabs change
  document.addEventListener('input', (e) => {
    // Map the "Check-in" IDs to their matching "Check-out" IDs
    const syncPairs = {
      'departureDate': 'returnDate',       // Flights
      'stayIn': 'stayOut',                 // Hotels (Base)
      'stayIn74': 'stayOut74',             // Hotels (Enterprise)
      'packageStart74': 'packageEnd74'     // Package Builder
    };
    // --- GLOBAL DATE SYNCHRONIZER ---
  document.addEventListener('input', (e) => {
    const syncPairs = {
      'departureDate': 'returnDate',       // Flights
      'stayIn': 'stayOut',                 // Hotels (Base)
      'stayIn74': 'stayOut74',             // Hotels (Enterprise)
      'packageStart74': 'packageEnd74',    // Package Builder
      'carPickupDate': 'carDropoffDate'    // <--- Cars added here!
    };
    // ... [rest of the function remains the same]
    
    const targetOutId = syncPairs[e.target.id];
    
    if (targetOutId) {
      const outInput = document.getElementById(targetOutId);
      if (outInput && e.target.value) {
        // 1. Update the check-out date to match check-in
        outInput.value = e.target.value;
        
        // 2. Prevent user from picking a check-out date in the past
        outInput.min = e.target.value;
        
        // 3. Force the app's internal state to recognize the automatic change
        outInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
  });
  render();
})();


</script>
</body>
</html>
```
