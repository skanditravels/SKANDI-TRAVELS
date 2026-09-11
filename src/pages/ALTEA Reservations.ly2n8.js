<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
  <meta name="color-scheme" content="light">
  <title>SKANDI ALTEA Unified Reservations R-006.7</title>
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

    #app {
      height: 100%;
      display: grid;
      grid-template-columns: var(--sidebar) 1fr;
      grid-template-rows: var(--tabs) 1fr;
      grid-template-areas: "side tabs" "side main";
      transition: grid-template-columns .18s ease;
    }
    #app.sidebar-collapsed { --sidebar: 48px; }
    
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
      padding: 7px 0;
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
      height: 34px;
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
    .nav-icon { width: 19px; flex: 0 0 19px; text-align: center; font-size: 14px; }
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
      .sticky { position: static; }
      .search-form { grid-template-columns: repeat(4, minmax(0, 1fr)); }
      .search-options { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (max-width: 720px) {
      html, body { overflow: auto; }
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
      .span-2 { grid-column: auto; }
      .offer-summary { grid-template-columns: 1fr; }
      .offer-price, .offer-action { border: 0; border-bottom: 1px solid #e0e5e8; text-align: left; }
      .segment { grid-template-columns: 1fr 1fr; }
      .segment > div:nth-child(2) { border-right: 0; }
    }
  </style>
</head>
<body>
  <div id="app">
    <aside class="sidebar">
      <div class="sidebar-toggle">
        <button id="sidebarToggle" type="button" class="ghost" aria-label="Collapse navigation">☰</button>
      </div>
      <nav class="nav" aria-label="ALTEA unified workspace">
        <div class="nav-section">Search &amp; Sell</div>
        <button type="button" class="nav-item active" data-view="dashboard"><span class="nav-icon">▦</span><span class="nav-label">Dashboard</span></button>
        <button type="button" class="nav-item" data-view="search"><span class="nav-icon">✈</span><span class="nav-label">Flight Search</span></button>
        <button type="button" class="nav-item" data-view="hotels"><span class="nav-icon">⌂</span><span class="nav-label">Hotel Search</span></button>
        <button type="button" class="nav-item" data-view="cars"><span class="nav-icon">▱</span><span class="nav-label">Car Rental</span></button>
        <button type="button" class="nav-item" data-view="services"><span class="nav-icon">⊞</span><span class="nav-label">Trip Components</span></button>
        <button type="button" class="nav-item" data-view="packagebuilder"><span class="nav-icon">◈</span><span class="nav-label">Package Builder</span></button>
        <button type="button" class="nav-item" data-view="offer"><span class="nav-icon">▤</span><span class="nav-label">Offer Review</span></button>
        <button type="button" class="nav-item" data-view="workspace"><span class="nav-icon">◫</span><span class="nav-label">Create Air Booking</span></button>
        <button type="button" class="nav-item" data-view="orders"><span class="nav-icon">▧</span><span class="nav-label">Bookings &amp; Orders</span></button>

        <div class="nav-section">Booking File</div>
        <button type="button" class="nav-item" data-view="booking"><span class="nav-icon">▣</span><span class="nav-label">Booking File</span></button>
        <button type="button" class="nav-item" data-view="passengers"><span class="nav-icon">♙</span><span class="nav-label">Passengers / APIS</span></button>
        <button type="button" class="nav-item" data-view="club"><span class="nav-icon">★</span><span class="nav-label">SKANDI Club</span></button>
        <button type="button" class="nav-item" data-view="ticketing"><span class="nav-icon">▥</span><span class="nav-label">Ticketing &amp; Documents</span></button>
        <button type="button" class="nav-item" data-view="requirements"><span class="nav-icon">✓</span><span class="nav-label">Travel Requirements</span></button>
        <button type="button" class="nav-item" data-view="actions"><span class="nav-icon">↻</span><span class="nav-label">Changes / Refunds</span></button>

        <div class="nav-section">Departure &amp; Operations</div>
        <button type="button" class="nav-item" data-view="departure"><span class="nav-icon">▶</span><span class="nav-label">Departure Control</span></button>
        <button type="button" class="nav-item" data-view="baggage"><span class="nav-icon">▰</span><span class="nav-label">Baggage &amp; Boarding</span></button>
        <button type="button" class="nav-item" data-view="manifests"><span class="nav-icon">☷</span><span class="nav-label">Operations &amp; Manifests</span></button>
        <button type="button" class="nav-item" data-view="history"><span class="nav-icon">≡</span><span class="nav-label">History &amp; Audit</span></button>
        <button type="button" class="nav-item" data-view="reports"><span class="nav-icon">◩</span><span class="nav-label">Sales Reports</span></button>
        <button type="button" class="nav-item" data-view="preferences"><span class="nav-icon">⚙</span><span class="nav-label">Preferences</span></button>
      </nav>
    </aside>

    <div class="workspace-tabs">
      <div class="ws-tab"><span>▦</span><span id="workspaceTabTitle">Agent Dashboard</span></div>
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
      stripePaymentElement: null
    };

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

    function setBusy(delta) {
      state.busyCount = Math.max(0, state.busyCount + delta);
      $("#busyBar").classList.toggle("hidden", state.busyCount === 0);
    }

    function navigate(view) {
      if (!VIEW_TITLES[view]) return;
      state.activeView = view;
      $$(".nav-item").forEach((item) => item.classList.toggle("active", item.dataset.view === view));
      $("#workspaceTabTitle").textContent = VIEW_TITLES[view];
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
        ${pageHead("ALTEA Dashboard", "One booking workspace for live Duffel air/stays/cars, Inventory Control capacity, SKANDI Club, documents and transfer operations.",
          '<button class="secondary" data-action="refresh-all">Refresh</button><button class="primary" data-view="search">New booking</button>')}
        ${!state.bridgeConnected ? alertBox("info", "Connecting", "Waiting for the secure system bridge.") : (!state.connected ? alertBox("info", "Bridge connected", "Secure Wix bridge is online. Initializing Duffel and ALTEA services…") : "")}
        <div class="grid grid-4">
          ${statCard("Supplier orders", state.orders.length, "Loaded Duffel orders")}
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
                <button class="quick-action" data-view="search"><b>Search flights</b><span class="muted">Create a live Duffel offer request.</span></button>
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
        ${pageHead("Flight Search", "Search live airline content through Duffel offer requests.")}
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
              <button class="secondary" type="button" data-action="swap-airports" aria-label="Swap airports">⇄</button>
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
                </select>
              </div>
              <div class="field">
                <label for="currency">Display currency</label>
                <input id="currency" maxlength="3" value="${escapeAttr(state.preferences.currency)}">
              </div>
            </div>
          </form>
        </section>
        <div style="margin-top:10px">
          ${state.offers.length ? renderOfferResults() : emptyState("✈", "No live offers loaded", "Run a search to load current Duffel offers.")}
        </div>`;
    }

    function renderOfferResults() {
      return `<div class="offer-layout">
        <section>
          <div class="panel-head"><span>${state.offers.length} live offer${state.offers.length === 1 ? "" : "s"}</span><span class="muted">Prices and availability can change until refreshed</span></div>
          <div style="margin-top:8px">${state.offers.map(offerCard).join("")}</div>
        </section>
        <aside class="panel sticky">
          <div class="panel-head">Booking sequence</div>
          <div class="panel-body">
            ${stepLine(true, "1", "Search returned live offers")}
            ${stepLine(false, "2", "Refresh selected offer")}
            ${stepLine(false, "3", "Add traveler details and services")}
            ${stepLine(false, "4", "Secure payment")}
            ${stepLine(false, "5", "Create Duffel order")}
          </div>
        </aside>
      </div>`;
    }

    function offerCard(offer) {
      const carrierNames = unique(
        offer.slices.flatMap((slice) => slice.segments.map((segment) => segment.operatingCarrier?.name).filter(Boolean))
      );
      const slices = offer.slices.map((slice) => {
        const first = slice.segments[0];
        const last = slice.segments[slice.segments.length - 1];
        return `<div class="offer-slice">
          <strong>${escapeHTML(slice.origin?.iataCode || first?.origin?.iataCode || "—")} → ${escapeHTML(slice.destination?.iataCode || last?.destination?.iataCode || "—")}</strong>
          <span class="muted"> · ${formatDateTime(first?.departingAt)} – ${formatDateTime(last?.arrivingAt)} · ${slice.segments.length - 1} stop${slice.segments.length - 1 === 1 ? "" : "s"}</span>
        </div>`;
      }).join("");
      return `<article class="offer-row">
        <div class="offer-summary">
          <div class="offer-price">
            <strong>${money(offer.totalAmount, offer.totalCurrency)}</strong>
            <span class="muted">Total offer</span>
          </div>
          <div class="offer-route">${slices}</div>
          <div class="offer-action">
            <span class="badge ${expiryClass(offer.expiresAt)}">${expiryLabel(offer.expiresAt)}</span>
            <button class="primary" data-action="select-offer" data-offer-id="${escapeAttr(offer.id)}">Review &amp; refresh</button>
          </div>
        </div>
        <div class="carrier-disclosure"><strong>Operated by:</strong> ${escapeHTML(carrierNames.join(", ") || "Operating carrier pending")}</div>
      </article>`;
    }

    function renderOffer() {
      const offer = state.selectedOffer;
      if (!offer) {
        return `${pageHead("Offer Review", "A selected offer is refreshed here before checkout.")}
          ${emptyState("▤", "No offer selected", "Search for flights and choose an offer to review.")}`;
      }
      return `
        ${pageHead("Offer Review", "This price was refreshed from Duffel before traveler details or payment.",
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
            <div class="panel-foot"><button class="primary" type="submit" ${offer.isExpired ? "disabled" : ""}>Create Duffel order</button></div>
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
        ${pageHead("Bookings & Orders", "Search the SKANDI ALTEA booking ledger, create a local SKANDI file, or open a live Duffel supplier order.",
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
          <div class="panel-head">Live supplier orders · Duffel</div>
          <div class="toolbar">
            <label class="sr-only" for="ordersFilter">Filter supplier orders</label>
            <input id="ordersFilter" style="height:28px;min-width:260px" placeholder="Filter loaded Duffel orders">
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
      if (!orders.length) return emptyState("▧", "No live orders loaded", "Refresh orders or retrieve a specific Duffel order.");
      return `<table class="data-table">
        <thead><tr><th>Booking reference</th><th>Duffel order</th><th>Route</th><th>Travelers</th><th>Total</th><th>Status</th><th>Created</th></tr></thead>
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
        return `${pageHead("Changes / Refunds", "Supplier servicing is available only when the airline reports the action through Duffel.")}
          ${emptyState("↻", "No supplier order selected", "Open a Duffel-backed booking from Bookings & Orders.")}`;
      }
      const actions = order.availableActions || [];
      const canCancel = actions.includes("cancel") || actions.includes("cancel_order");
      const canChange = actions.includes("change");
      const changeAmount = Number(state.pendingChange?.changeTotalAmount || 0);
      return `
        ${pageHead("Changes / Refunds", `Order ${order.bookingReference || order.id}`,
          '<button class="secondary" data-action="refresh-current-order">Refresh order</button>')}
        ${state.customerRefundRequired ? alertBox("warning", "Customer refund reconciliation required", "The airline has returned value to SKANDI/Duffel. Reconcile the customer Stripe payment separately according to SKANDI policy.") : ""}
        <div class="workspace-layout">
          <div>
            ${orderConfirmationMarkup(order)}
            <section class="panel" style="margin-top:10px">
              <div class="panel-head"><span>Flight change / reissue</span><span class="badge ${canChange?"success":"neutral"}">${canChange?"AVAILABLE":"UNAVAILABLE"}</span></div>
              <div class="panel-body">
                ${!canChange ? alertBox("warning", "Change unavailable", "Duffel does not currently report the change action for this airline order.") : changeSearchMarkup(order)}
                ${canChange && state.changeOffers.length ? changeOffersMarkup(state.changeOffers) : ""}
                ${state.pendingChange ? pendingChangeMarkup(state.pendingChange) : ""}
              </div>
            </section>
            <section class="panel" style="margin-top:10px">
              <div class="panel-head">Cancellation / refund quote</div>
              <div class="panel-body">
                ${!canCancel ? alertBox("warning", "Cancellation unavailable", "Duffel does not currently report a cancel action for this order.") : ""}
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
              ? actions.map((action) => `<div class="money-line"><span>${escapeHTML(humanize(action))}</span><span class="badge info">DUFFEL</span></div>`).join("")
              : '<span class="muted">No servicing actions returned by the airline.</span>'}
              <div class="alert info" style="margin:10px 0 0"><span>ℹ</span><div><strong>No simulated ATC</strong>ALTEA only executes changes, cancellations and refunds when the live supplier exposes them.</div></div>
            </div>
          </aside>
        </div>`;
    }

    function changeSearchMarkup(order){
      const slices=order.slices||[];
      const first=slices[0]||{};
      return `<div class="alert info"><span>↻</span><div><strong>Live airline repricing</strong>Choose the existing flight slice to replace. Duffel sends the request back to the original airline and returns real change offers, penalties and fare differences.</div></div>
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
        ${alertBox(amount<0?"warning":"info", amount<0?"Airline refund due":"Airline change ready", amount<0?"Confirming this change returns value through the supplier flow. SKANDI must separately reconcile the customer payment.":"Duffel requires the final current amount shown below before the flight is changed.")}
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
      return `${alertBox("warning", "Review before confirmation", "Confirming this quote cancels the Duffel order. This cannot be undone from this screen.")}
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
            <div><span class="muted">Duffel order ID</span><div class="strong mono" style="margin-top:6px">${escapeHTML(order.id)}</div></div>
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
      if(!w?.booking) return `${pageHead("Booking File","Unified SKANDI booking file backed by the internal ALTEA ledger.")}${emptyState("▣","No booking selected","Open a booking from Bookings & Orders or create a new Duffel order.")}`;
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
      return `${pageHead("Seats & Services","Duffel controls airline seats/baggage, live hotel stays and car rentals; SKANDI Inventory Control supplies transfers, tours, activities, partner tickets, packages and local ancillaries.",
        !w?.booking?'<button class="primary" data-action="new-local-booking">New SKANDI booking</button>':'')}
        <div class="alert info"><span>ℹ</span><div><strong>One booking file</strong>Air services remain supplier-controlled. SKANDI products are attached to the same internal booking file as separate components so staff can manage the whole journey without inventing airline records.</div></div>
        ${w?.booking?`<section class="panel"><div class="panel-head"><span>Selected SKANDI booking components</span><span>${components.length} active</span></div><div class="panel-body" style="padding:0">${componentTable(components)}</div></section>`:''}
        <section class="panel" style="margin-top:10px"><div class="panel-head"><span>SKANDI Inventory Control catalog</span><span class="muted">Published · staff visible</span></div><div class="panel-body" style="padding:0">${inventoryCatalogMarkup()}</div></section>
        ${state.selectedOffer?`<section class="panel" style="margin-top:10px"><div class="panel-head">Current Duffel airline services</div><div class="panel-body" style="padding:0">${serviceListMarkup(state.selectedOffer.availableServices||[])}</div></section>
          <section class="panel" style="margin-top:10px"><div class="panel-head"><span>Live seat maps</span><button class="link" data-action="load-seat-maps">Refresh</button></div><div class="panel-body">${seatMapMarkup()}</div></section>`:''}
        ${!state.selectedOffer&&order?`<section class="panel" style="margin-top:10px"><div class="panel-head">Airline services</div><div class="panel-body"><p class="muted">The confirmed Duffel order is attached to this booking. New paid seat/baggage services are only shown when the supplier exposes a supported servicing path.</p></div></section>`:''}
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
          <section class="panel"><div class="panel-head">Duffel / airline documents</div><div class="panel-body" style="padding:0">${documentTable(supplierDocs)}</div></section>
          <section class="panel"><div class="panel-head">ALTEA document register</div><div class="panel-body" style="padding:0">${internalDocumentTable(internalDocs)}</div></section>
        </div>
        <section class="panel" style="margin-top:10px"><div class="panel-head">SKANDI controlled forms</div><div class="panel-body"><p class="muted">Booking-linked forms, waivers and customer document packets continue through DocuNet and appear in the Orders view when assigned.</p><button class="secondary" data-view="orders">Open booking documents</button></div></section>`;
    }

    function internalDocumentTable(docs){
      if(!docs.length) return '<div class="empty">No internal booking documents recorded.</div>';
      return `<table class="data-table"><thead><tr><th>Provider</th><th>Type</th><th>Number</th><th>Status</th></tr></thead><tbody>${docs.map(d=>`<tr><td>${escapeHTML(d.provider||"SKANDI")}</td><td>${escapeHTML(d.documentType||"DOCUMENT")}</td><td class="mono">${escapeHTML(d.documentNumber||"—")}</td><td><select class="doc-status-select" data-document-id="${escapeAttr(d.id)}"><option ${d.status==="ACTIVE"?"selected":""}>ACTIVE</option><option ${d.status==="VOID"?"selected":""}>VOID</option><option ${d.status==="REFUNDED"?"selected":""}>REFUNDED</option><option ${d.status==="SUPERSEDED"?"selected":""}>SUPERSEDED</option></select></td></tr>`).join("")}</tbody></table>`;
    }

    function renderBaggageBoarding(){
      const w=activeWorkspace();
      return `${pageHead("Baggage & Boarding","SKANDI operational assistance around airline-controlled baggage and boarding processes.")}
        <div class="alert warning"><span>⚠</span><div><strong>Operating carrier controls DCS</strong>SKANDI can record baggage/seat/document readiness and produce internal assistance paperwork. A real airline bag tag or boarding pass must come from an authorized airline/DCS source.</div></div>
        ${w?.passengers?.length?`<section class="panel"><div class="panel-head">Passenger operational status</div><div class="panel-body" style="padding:0">${passengerTable(w.passengers)}</div></section>`:emptyState("▰","No booking selected","Open a booking to work with its passenger operational status.")}
        <div class="grid grid-2" style="margin-top:10px"><section class="panel"><div class="panel-head">Baggage</div><div class="panel-body"><p class="muted">Paid baggage is selected from Duffel available services during offer/booking. Recorded service IDs stay linked to the ALTEA booking file.</p><button class="secondary" data-view="services">Open seats & services</button></div></section><section class="panel"><div class="panel-head">Boarding documents</div><div class="panel-body"><p class="muted">Use airline-issued boarding documents where supplied. SKANDI sample layouts are not valid travel documents and are not automatically issued from this workspace.</p></div></section></div>`;
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
        ${pageHead("Sales Reports", "A live summary of the currently loaded Duffel order result set.",
          '<button class="secondary" data-action="export-orders">Export loaded CSV</button>')}
        <div class="grid grid-3">
          ${Object.entries(currencies).map(([currency, amount]) => statCard(`Gross ${currency}`, money(amount, currency), "Loaded Duffel orders")).join("") || statCard("Gross sales", "—", "Load orders to calculate")}
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
              <div class="money-line"><span>Air provider</span><strong>Duffel Flights</strong></div>
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
      if(String(booking.supplier||"").toUpperCase()!=="SKANDI")return toast("Supplier-controlled passenger list","Passengers cannot be added internally to a confirmed Duffel airline order.","warning");
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
      if (adults + childAges.length + infantAges.length > 9) return toast("Too many travelers", "Duffel orders support up to nine travelers.", "warning");
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
        { label: "Create Duffel order", className: "primary", onClick: () => {
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
      if (!cards.length) return "No Duffel traveler records were returned for this offer.";
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
      if (!query) return toast("Order reference required", "Enter a Duffel order ID or booking reference.", "warning");
      post("DUFFEL_GET_ORDER", { orderIdOrReference: query });
    }

    function quoteCancellation() {
      if (!state.selectedOrder?.id) return;
      post("DUFFEL_CREATE_CANCELLATION", { orderId: state.selectedOrder.id });
    }

    function confirmCancellation() {
      if (!state.cancellation?.id) return;
      openModal("Confirm cancellation", `
        ${alertBox("danger", "This action is irreversible", `The Duffel order will be cancelled. Quoted airline refund: ${money(state.cancellation.refundAmount, state.cancellation.refundCurrency)}.`)}
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
      if (!state.orders.length) return toast("Nothing to export", "Load Duffel orders first.", "warning");
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
        post("DUFFEL_APP_READY", { version: "R-005.2-unified", retry: true }, { busy: false });
        post("ALTEA_UNIFIED_BOOTSTRAP", { version: "R-005.2-unified", retry: true }, { busy: false });
        post("INVENTORY_SEARCH_SELLABLE", { query: "" }, { busy: false });
        post("ALTEA_ENTERPRISE_MODULE_READY", {
          version: "R-005.2-unified",
          capabilities: ["master_booking","skandi_club","package_charter","documents_vouchers","travel_requirements_adapter","transfer_departure_control","manifests"]
        }, { busy: false });
        return;
      }

      if (message.type === "DUFFEL_BOOTSTRAP_RESULT") {
        state.bridgeConnected = true;
        state.connected = true;
        state.environment = payload.environment || "Duffel";
        state.preferences.currency = payload.defaultCurrency || state.preferences.currency;
        setConnection("online", "Duffel ready");
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
            ? "Duffel confirmed cancellation. The customer payment now requires refund reconciliation."
            : "Duffel confirmed the cancellation.",
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
        toast("Airline change confirmed",payload.customerRefundRequired?`Customer refund reconciliation required: ${money(payload.customerRefundAmount,payload.customerRefundCurrency)}.`:"Duffel confirmed the new flight itinerary.",payload.customerRefundRequired?"warning":"success");
        return;
      }
      if (message.type === "ALTEA_UNIFIED_BOOTSTRAP_RESULT") {
        state.bridgeConnected = true;
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
      if (message.type === "ALTEA_ERROR") {
        if(message.requestId)generatedPrintRequests.delete(message.requestId);
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
      return `<div class="panel empty"><div class="big">${escapeHTML(icon)}</div><strong>${escapeHTML(title)}</strong><br><span>${escapeHTML(message)}</span></div>`;
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
        post("DUFFEL_APP_READY", { version: "R-005.2-unified", attempt: attempts }, { busy: false });
        post("ALTEA_UNIFIED_BOOTSTRAP", { version: "R-005.2-unified", attempt: attempts }, { busy: false });
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
    return `${pageHead("Hotel Search","Live accommodation search through Duffel Stays. Inventory Control supplies SKANDI content, not room availability.")}
      <section class="panel"><div class="panel-head">Search live stays</div><div class="panel-body">
        <div class="form-grid">
          <div class="field"><label>Destination / IATA</label><input id="stayDest" class="input" placeholder="STO or Stockholm"></div>
          <div class="field"><label>Check-in</label><input id="stayIn" class="input" type="date"></div>
          <div class="field"><label>Check-out</label><input id="stayOut" class="input" type="date"></div>
          <div class="field"><label>Rooms</label><input id="stayRooms" class="input" type="number" min="1" max="9" value="1"></div>
          <div class="field"><label>Adults</label><input id="stayAdults" class="input" type="number" min="1" max="9" value="2"></div>
        </div>
      </div><div class="panel-foot"><button class="primary" id="staySearchBtn">Search Duffel Stays</button></div></section>
      <section class="panel" style="margin-top:10px"><div class="panel-head"><span>Live results</span><span class="muted">${state.stayResults.length} accommodations</span></div><div class="panel-body">${stayResultsMarkup()}</div></section>
      ${stayRatePanel()}`;
  }

  function stayResultsMarkup(){
    if(!state.stayResults.length)return emptyState("⌂","No stay results loaded","Run a live Duffel Stays search.");
    return `<table class="data-table"><thead><tr><th>Accommodation</th><th>City</th><th>Total from</th><th></th></tr></thead><tbody>${state.stayResults.map(r=>`<tr><td><strong>${escapeHTML(r.title||"Accommodation")}</strong></td><td>${escapeHTML(r.address?.city||"")}</td><td>${money(r.cheapestRateTotalAmount||r.total,r.cheapestRateTotalCurrency||r.currency)}</td><td><button class="link" data-stay-result="${escapeAttr(r.id)}">Rooms & rates</button></td></tr>`).join("")}</tbody></table>`;
  }
  function stayRatePanel(){
    if(!state.selectedStayResult&&!state.stayRates.length)return "";
    return `<section class="panel" style="margin-top:10px"><div class="panel-head">Rooms & rates</div><div class="panel-body">${state.stayRates.length?`<table class="data-table"><thead><tr><th>Room</th><th>Board</th><th>Total</th><th></th></tr></thead><tbody>${state.stayRates.map(r=>`<tr><td>${escapeHTML(r.roomName||"Room")}</td><td>${escapeHTML(r.boardType||"—")}</td><td>${money(r.totalAmount,r.totalCurrency)}</td><td><button class="link" data-stay-rate="${escapeAttr(r.rateId)}">Quote</button></td></tr>`).join("")}</tbody></table>`:emptyState("▤","Loading rates","Select an accommodation to retrieve current room rates.")}</div>${state.stayQuote?`<div class="panel-foot"><span class="muted">Quoted ${money(state.stayQuote.totalAmount,state.stayQuote.totalCurrency)}</span><button class="primary" id="bookStayBtn">Book into open ALTEA file</button></div>`:""}</section>`;
  }

  function renderCars(){
    return `${pageHead("Car Rental","Live vehicle search, quotes and bookings through Duffel Cars.")}
      <section class="panel"><div class="panel-head">Search live cars</div><div class="panel-body">
        <div class="form-grid">
          <div class="field"><label>Pickup</label><input id="carPickup" class="input" placeholder="ARN or Stockholm"></div>
          <div class="field"><label>Drop-off</label><input id="carDropoff" class="input" placeholder="ARN or Stockholm"></div>
          <div class="field"><label>Pickup date</label><input id="carPickupDate" class="input" type="date"></div>
          <div class="field"><label>Pickup time</label><input id="carPickupTime" class="input" type="time" value="10:00"></div>
          <div class="field"><label>Drop-off date</label><input id="carDropoffDate" class="input" type="date"></div>
          <div class="field"><label>Drop-off time</label><input id="carDropoffTime" class="input" type="time" value="10:00"></div>
          <div class="field"><label>Driver age</label><input id="carAge" class="input" type="number" min="18" max="99" value="30"></div>
          <div class="field"><label>Residence country</label><input id="carResidence" class="input mono" maxlength="2" value="US"></div>
        </div>
      </div><div class="panel-foot"><button class="primary" id="carSearchBtn">Search Duffel Cars</button></div></section>
      <section class="panel" style="margin-top:10px"><div class="panel-head"><span>Live rates</span><span class="muted">${state.carResults.length} rates</span></div><div class="panel-body">${carResultsMarkup()}</div></section>
      ${carQuotePanel()}`;
  }
  function carResultsMarkup(){
    if(!state.carResults.length)return emptyState("▱","No car rates loaded","Run a live Duffel Cars search.");
    return `<table class="data-table"><thead><tr><th>Vehicle</th><th>Supplier</th><th>Transmission</th><th>Payment</th><th>Total</th><th></th></tr></thead><tbody>${state.carResults.map(r=>`<tr><td><strong>${escapeHTML(r.car?.name||"Vehicle")}</strong><div class="muted">${escapeHTML(r.car?.category||"")}</div></td><td>${escapeHTML(r.supplier?.name||"")}</td><td>${escapeHTML(r.car?.transmission||"")}</td><td>${escapeHTML(r.paymentType||"")}</td><td>${money(r.totalAmount,r.totalCurrency)}</td><td><button class="link" data-car-rate="${escapeAttr(r.rateId)}">Quote</button></td></tr>`).join("")}</tbody></table>`;
  }
  function carQuotePanel(){
    const q=state.carQuote;if(!q)return "";
    const direct=q.paymentType==="postpaid";
    return `<section class="panel" style="margin-top:10px"><div class="panel-head"><span>Confirmed car quote</span><span class="badge info">${escapeHTML(q.paymentType||"payment")}</span></div><div class="panel-body">
      <div class="grid grid-3"><div><span class="muted">Vehicle</span><div class="strong">${escapeHTML(q.car?.name||"Vehicle")}</div></div><div><span class="muted">Supplier</span><div class="strong">${escapeHTML(q.supplier?.name||"")}</div></div><div><span class="muted">Total</span><div class="price-total">${money(q.totalAmount,q.totalCurrency)}</div></div></div>
      ${direct?alertBox("info","Pay at supplier","Duffel reports this rate as postpaid. No customer card data is collected by ALTEA."):alertBox("warning","Secure supplier payment","This rate requires Duffel Card Form + 3-D Secure. Raw card details never enter ALTEA or SKANDI systems. For telephone/offline card entry ALTEA authenticates with cardholderPresent=false.")}
      <div class="form-grid" style="margin-top:10px"><div class="field"><label>Driver first name</label><input id="carFirst" class="input"></div><div class="field"><label>Driver last name</label><input id="carLast" class="input"></div><div class="field"><label>Date of birth</label><input id="carDob" class="input" type="date"></div><div class="field"><label>Email</label><input id="carEmail" class="input" type="email"></div><div class="field"><label>Phone (E.164)</label><input id="carPhone" class="input" placeholder="+12125550123"></div></div>
      ${direct?"":`<div style="margin-top:12px;padding:12px;border:1px solid var(--line);background:#fff"><div class="strong" style="margin-bottom:7px">Duffel secure card form</div>${state.carClientKey?`<duffel-card-form id="alteaCarCardForm"></duffel-card-form><div class="muted" style="margin-top:7px">${state.carThreeDSecureSessionId?"3-D Secure authenticated and ready for booking.":"Complete the secure card form, then authenticate."}</div>`:`<div class="muted">Prepare the secure component to enter the customer's card directly with Duffel.</div>`}</div>`}
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
      openModal("Book Duffel Stay",`<div class="field"><label>Lead guest first name</label><input id="stayGuestFirst" class="input"></div><div class="field" style="margin-top:8px"><label>Lead guest last name</label><input id="stayGuestLast" class="input"></div><div class="field" style="margin-top:8px"><label>Email</label><input id="stayGuestEmail" class="input" type="email"></div><div class="field" style="margin-top:8px"><label>Phone (E.164)</label><input id="stayGuestPhone" class="input" placeholder="+12125550123"></div>`,[{label:"Back",className:"secondary",close:true},{label:"Book stay",className:"primary",onClick:()=>{const payload={quoteId:q.id,guests:[{givenName:val("stayGuestFirst"),familyName:val("stayGuestLast")}],email:val("stayGuestEmail"),phoneNumber:val("stayGuestPhone"),alteaBookingId:currentAlteaBookingId()};closeModal();post("DUFFEL_CREATE_STAY_BOOKING",payload);}}]);
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
      el.addEventListener("onCreateCardForTemporaryUseFailure",event=>toast("Secure card failed",event.detail?.error?.message||"Duffel could not tokenize the card.","danger"));
      el.addEventListener("onCreateCardForTemporaryUseSuccess",async event=>{
        try{
          const cardId=event.detail?.data?.id;if(!cardId)throw new Error("Duffel did not return a temporary card ID.");
          const session=await window.createThreeDSecureSession(state.carClientKey,cardId,q.id,[],false);
          if(!session||session.status!=="ready_for_payment")throw new Error("The 3-D Secure session is not ready for payment.");
          state.carThreeDSecureSessionId=session.id;toast("Card authenticated","The supplier payment can now be confirmed.","success");render();
        }catch(error){toast("3-D Secure failed",error?.message||"Authentication could not be completed.","danger")}
      });
    }catch(error){toast("Secure card unavailable",error?.message||"Duffel Card Form could not be rendered.","danger")}
  }

  window.addEventListener("message",event=>{
    if(event.source!==window.parent)return;
    const m=event.data||{};if(m.source!==PARENT_SOURCE)return;const p=m.payload||{};
    if(m.type==="DUFFEL_STAYS_RESULT"){state.stayResults=p.items||[];state.stayRates=[];state.stayQuote=null;navigate("hotels");toast("Live stays loaded",`${state.stayResults.length} accommodation${state.stayResults.length===1?"":"s"} returned.`,"success");}
    if(m.type==="DUFFEL_STAY_RATES_RESULT"){state.stayRates=p.rates||[];state.stayQuote=null;render();}
    if(m.type==="DUFFEL_STAY_QUOTE_RESULT"){state.stayQuote=p.quote||null;render();}
    if(m.type==="DUFFEL_STAY_BOOKING_RESULT"){toast("Stay booked",`Duffel reference ${p.booking?.reference||p.booking?.id||"confirmed"}.`,"success");if(currentAlteaBookingId())post("ALTEA_GET_BOOKING",{bookingId:currentAlteaBookingId()});}
    if(m.type==="DUFFEL_CARS_RESULT"){state.carResults=p.items||[];state.carQuote=null;navigate("cars");toast("Live cars loaded",`${state.carResults.length} rate${state.carResults.length===1?"":"s"} returned.`,"success");}
    if(m.type==="DUFFEL_CAR_QUOTE_RESULT"){state.carQuote=p.quote||null;render();}
    if(m.type==="DUFFEL_CAR_CARD_READY"){state.carClientKey=p.componentClientKey||"";state.carCardValid=false;state.carThreeDSecureSessionId="";toast("Secure card component ready","Duffel Card Form is ready. ALTEA never receives raw card data.","info");render();}
    if(m.type==="DUFFEL_CAR_BOOKING_RESULT"){toast("Car booked",`Duffel reference ${p.booking?.reference||p.booking?.id||"confirmed"}.`,"success");if(currentAlteaBookingId())post("ALTEA_GET_BOOKING",{bookingId:currentAlteaBookingId()});}
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

  const ENTERPRISE_VERSION = "R-006.7-doc-bridge";

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
      <div class="alert info"><span>▣</span><div><strong>One SKANDI booking reference</strong>The SKANDI reference is the customer-facing master reference. Duffel and all other supplier locators remain attached underneath it for servicing.</div></div>
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
    const w=workspace();if(!w?.booking)return `${pageHead("Booking File","Unified SKANDI master booking with supplier references underneath it.")}${emptyState("▣","No booking selected","Open a booking from Bookings & Orders or create a new master booking.")}`;
    const b=w.booking;const comps=components();
    return `${pageHead("Booking File",`${masterReference()} · ${humanize(bookingType())}`,'<button class="secondary" data-action="refresh-booking-file">Refresh</button><button class="primary" data-view="packagebuilder">Package Builder</button>')}
      <div class="grid grid-4">${statCard("SKANDI Reference",masterReference(),"Customer-facing master booking")}${statCard("Trip type",humanize(bookingType()),transferComponents().length?"SKANDI transfer operations linked":"Air supply remains supplier controlled")}${statCard("Passengers",passengers().length,"Travelers in master record")}${statCard("Components",comps.length,`${w.documents?.length||0} internal document(s)`)}</div>
      <div class="workspace-layout" style="margin-top:10px"><div>
        <section class="panel"><div class="panel-head"><span>Master booking</span><span class="master-ref">${escapeHTML(masterReference())}</span></div><div class="panel-body"><div class="grid grid-3">
          <div><span class="muted">Customer</span><div class="strong">${escapeHTML(b.customerName||"—")}</div></div><div><span class="muted">Email</span><div>${escapeHTML(b.customerEmail||"—")}</div></div><div><span class="muted">Recorded total</span><div class="strong">${money(packageTotal(),b.currency||state.preferences.currency)}</div></div>
          <div><span class="muted">Duffel / supplier order</span><div class="mono strong">${escapeHTML(b.supplierOrderId||state.selectedOrder?.id||"—")}</div></div><div><span class="muted">Supplier locator</span><div class="mono strong">${escapeHTML(b.supplierBookingReference||state.selectedOrder?.bookingReference||"—")}</div></div><div><span class="muted">Transfer control</span><div><span class="badge ${transferComponents().length?"success":"neutral"}">${transferComponents().length?"SKANDI":"NO TRANSFER"}</span></div></div>
        </div></div></section>
        <section class="panel" style="margin-top:10px"><div class="panel-head">Passengers</div><div class="panel-body" style="padding:0">${passengerTable(passengers())}</div></section>
        <section class="panel" style="margin-top:10px"><div class="panel-head"><span>Trip components</span><span>${comps.length}</span></div><div class="panel-body" style="padding:0">${componentTable(comps)}</div></section>
      </div><aside class="panel sticky"><div class="panel-head">Booking workflow</div><div class="panel-body action-stack">
        <button class="secondary" data-view="passengers">Passengers / APIS</button><button class="secondary" data-view="club">SKANDI Club</button><button class="secondary" data-view="services">Trip Components</button><button class="secondary" data-view="packagebuilder">Package Builder</button><button class="secondary" data-view="ticketing">Ticketing & Documents</button><button class="secondary" data-view="requirements">Travel Requirements</button><button class="secondary" data-view="departure">Departure Control</button><button class="secondary" data-view="manifests">Operations & Manifests</button><button class="secondary" data-view="actions">Changes / Refunds</button>
      </div></aside></div>`;
  };

  passengerTable=function(list){
    if(!list.length)return '<div class="empty">No passenger records are linked to this booking yet.</div>';
    return `<table class="data-table"><thead><tr><th>Passenger</th><th>SKANDI Club</th><th>APIS</th><th>Requirements</th><th>Seat</th><th>Check-in</th><th>Boarding</th></tr></thead><tbody>${list.map(p=>{const club=clubFor(p);const req=p.travelRequirementStatus||p.payload?.travelRequirementStatus||"not checked";return `<tr><td><button class="link" data-action="select-passenger" data-passenger-id="${escapeAttr(p.id)}">${escapeHTML(paxName(p))}</button><br><small class="mono muted">${escapeHTML(p.supplierPassengerId||p.passengerRef||"")}</small></td><td>${club?`<span class="badge info">${escapeHTML(club.tier||"MEMBER")}</span><br><small class="mono">${escapeHTML(club.memberNumber||club.id||"")}</small>`:'<span class="muted">Not linked</span>'}</td><td><span class="badge ${statusClass(p.apisStatus)}">${escapeHTML(p.apisStatus||"not started")}</span></td><td><span class="badge ${statusClass(req)}">${escapeHTML(req)}</span></td><td class="mono">${escapeHTML(p.seatNumber||"—")}</td><td>${escapeHTML(p.checkinStatus||"not checked in")}</td><td>${escapeHTML(p.boardingStatus||p.payload?.boardingStatus||"not boarded")}</td></tr>`}).join("")}</tbody></table>`;
  };

  const originalPassengerEditor=passengerEditor;
  passengerEditor=function(p){const club=clubFor(p);return `${originalPassengerEditor(p)}<hr style="border:0;border-top:1px solid var(--line);margin:12px 0"><div class="strong">SKANDI Club</div><div style="margin-top:7px">${club?`<div class="money-line"><span>Member</span><strong class="mono">${escapeHTML(club.memberNumber||club.id||"—")}</strong></div><div class="money-line"><span>Tier</span><strong>${escapeHTML(club.tier||"MEMBER")}</strong></div><div class="money-line"><span>Points</span><strong>${escapeHTML(String(club.pointsBalance??club.points??"—"))}</strong></div>`:`<span class="muted">No SKANDI Club profile linked.</span>`}</div><button type="button" class="secondary" style="margin-top:8px" data-view="club">Open SKANDI Club</button>`};

  componentTable=function(items){
    if(!items.length)return '<div class="empty">No trip components selected.</div>';
    return `<table class="data-table"><thead><tr><th>Type</th><th>Service</th><th>Supplier / Ref</th><th>Travel</th><th>Qty</th><th>Amount</th><th>Status</th><th>Actions</th></tr></thead><tbody>${items.map(c=>`<tr><td>${escapeHTML(humanize(c.componentType||c.entityType))}</td><td><strong>${escapeHTML(serviceLabel(c))}</strong></td><td>${escapeHTML(c.supplier||"SKANDI")}<br><small class="mono muted">${escapeHTML(c.supplierReference||c.reference||"")}</small></td><td>${escapeHTML(c.serviceDate||c.startDate||c.payload?.serviceDate||c.city||"—")}</td><td>${escapeHTML(String(c.quantity||1))}</td><td>${money(c.totalAmount,c.currency||booking()?.currency)}</td><td><select class="component-status-select" data-component-id="${escapeAttr(c.id)}"><option ${c.status==="SELECTED"?"selected":""}>SELECTED</option><option ${c.status==="REQUESTED"?"selected":""}>REQUESTED</option><option ${c.status==="CONFIRMED"?"selected":""}>CONFIRMED</option><option ${c.status==="CANCELLED"?"selected":""}>CANCELLED</option></select></td><td class="nowrap"><button class="link" data-action="edit-component" data-component-id="${escapeAttr(c.id)}">Edit</button> · <button class="link" data-action="print-component-voucher" data-component-id="${escapeAttr(c.id)}">Voucher</button> · <button class="link" data-action="remove-component" data-component-id="${escapeAttr(c.id)}">Remove</button></td></tr>`).join("")}</tbody></table>`;
  };

  renderServices=function(){
    const w=workspace();const comps=components();const transferTourInventory=(state.inventory||[]).filter(i=>["TRANSFER","TOUR","ACTIVITY","EXCURSION","HOTEL","PACKAGE","ANCILLARY"].some(x=>normalizedType(i.entityType).includes(x)));
    return `${pageHead("Trip Components","Sell and service SKANDI-owned products together with Duffel flight, stay and car supply.",!w?.booking?'<button class="primary" data-action="new-local-booking">New SKANDI booking</button>':'<button class="primary" data-view="packagebuilder">Package Builder</button>')}
      <div class="alert info"><span>ℹ</span><div><strong>One master booking</strong>Every service is linked to ${escapeHTML(masterReference())}. Supplier references remain separate underneath the SKANDI master reference.</div></div>
      ${w?.booking?`<section class="panel"><div class="panel-head"><span>Booked / selected components</span><span>${comps.length}</span></div><div class="panel-body" style="padding:0">${componentTable(comps)}</div></section>`:""}
      <section class="panel" style="margin-top:10px"><div class="panel-head"><span>SKANDI Inventory Control catalog</span><span class="muted">Transfers · tours · hotels · packages · ancillaries</span></div><div class="panel-body"><div class="field"><label>Filter catalog</label><input id="inventoryFilter" placeholder="Transfer, Rhodes, tour, hotel..."></div><div id="enterpriseInventoryTable" style="margin:0 -10px -10px">${enterpriseInventoryMarkup(transferTourInventory)}</div></div></section>
      ${state.selectedOffer?`<section class="panel" style="margin-top:10px"><div class="panel-head">Current Duffel airline services</div><div class="panel-body" style="padding:0">${serviceListMarkup(state.selectedOffer.availableServices||[])}</div></section><section class="panel" style="margin-top:10px"><div class="panel-head"><span>Live seat maps</span><button class="link" data-action="load-seat-maps">Refresh</button></div><div class="panel-body">${seatMapMarkup()}</div></section>`:""}`;
  };

  function enterpriseInventoryMarkup(items){if(!items.length)return '<div class="empty">No matching published inventory.</div>';return `<table class="data-table"><thead><tr><th>Type</th><th>Product</th><th>Destination</th><th>Price</th><th></th></tr></thead><tbody>${items.map(i=>`<tr><td>${escapeHTML(humanize(i.entityType))}</td><td><strong>${escapeHTML(i.name)}</strong><br><small class="mono muted">${escapeHTML(i.publicId||i.code||"")}</small></td><td>${escapeHTML(i.city||i.destination||i.category||"—")}</td><td>${i.publicPrice?money(i.publicPrice,i.currency||booking()?.currency):'<span class="muted">Quote / rules apply</span>'}</td><td><button class="primary" data-action="add-inventory-component" data-entity-id="${escapeAttr(i.id)}" ${booking()?"":"disabled"}>Add</button></td></tr>`).join("")}</tbody></table>`}

  function renderPackageBuilder(){
    const w=workspace();if(!w?.booking)return `${pageHead("Package Builder","Combine flights, hotels, cars, transfers, tours and SKANDI products under one master reference.",'<button class="primary" data-action="new-local-booking">New SKANDI booking</button>')}
      ${alertBox("info","No booking open","The Package Builder workspace is available. Create or open a master booking to begin adding flight, hotel, car, transfer and tour components.")}
      <div class="grid grid-3">${statCard("Master reference","—","Created when a booking is opened")}${statCard("Trip type","—","Dynamic package / land only")}${statCard("Components","0","No booking selected")}</div>
      <section class="panel" style="margin-top:10px"><div class="panel-head">Package workspace</div><div class="panel-body"><div class="component-cards"><div class="component-card"><strong>Flight</strong><button class="secondary" data-view="search">Search</button><div class="meta">Duffel live airline supply.</div></div><div class="component-card"><strong>Hotel</strong><button class="secondary" data-view="hotels">Search</button><div class="meta">Duffel Stays or SKANDI inventory.</div></div><div class="component-card"><strong>Car</strong><button class="secondary" data-view="cars">Search</button><div class="meta">Duffel Cars.</div></div><div class="component-card"><strong>Transfers & Tours</strong><button class="secondary" data-view="services">Open products</button><div class="meta">SKANDI-owned inventory and package components.</div></div></div></div></section>`;
    const b=w.booking;const comps=components();
    return `${pageHead("Package Builder",`${masterReference()} · ${humanize(bookingType())}`,'<button class="secondary" data-view="services">Add components</button><button class="primary" data-action="print-booking-confirmation">Booking confirmation</button>')}
      <div class="grid grid-4">${statCard("Master reference",masterReference(),"Shown to customer")}${statCard("Trip type",humanize(bookingType()),transferComponents().length?"SKANDI transfer control":"Airline operations supplier controlled")}${statCard("Components",comps.length,"Air + land products")}${statCard("Recorded total",money(packageTotal(),b.currency||state.preferences.currency),"Master booking + component totals")}</div>
      <div class="workspace-layout" style="margin-top:10px"><div>
        <section class="panel"><div class="panel-head">Package classification</div><div class="panel-body"><div class="grid grid-3"><div class="field"><label>Booking type</label><select id="packageBookingType">${["FLIGHT_ONLY","LAND_ONLY","DYNAMIC_PACKAGE","SKANDI_PACKAGE","GROUP_BOOKING"].map(v=>option(v,humanize(v),bookingType())).join("")}</select></div><div class="field"><label>Trip / package title</label><input id="packageTitle" value="${escapeAttr(b.tripTitle||b.payload?.tripTitle||"")}"></div><div class="field"><label>Transfer operations</label><select id="packageTransferControl"><option value="SKANDI" ${String(b.transferControl||"SKANDI")==="SKANDI"?"selected":""}>SKANDI Transfer Control</option><option value="SUPPLIER" ${String(b.transferControl||"")==="SUPPLIER"?"selected":""}>External transfer supplier</option></select></div></div><div class="grid grid-3"><div class="field"><label>Start date</label><input id="packageStart" type="date" value="${escapeAttr(b.departureDate||b.startDate||"")}"></div><div class="field"><label>End date</label><input id="packageEnd" type="date" value="${escapeAttr(b.returnDate||b.endDate||"")}"></div><div class="field"><label>Package status</label><select id="packageStatus">${["DRAFT","OPTION","CONFIRMED","CANCELLED"].map(v=>option(v,humanize(v),normalizedType(b.packageStatus||b.status||"DRAFT"))).join("")}</select></div></div><button class="primary" data-action="save-package">Save package setup</button></div></section>
        <section class="panel" style="margin-top:10px"><div class="panel-head"><span>Package contents</span><span>${comps.length} component(s)</span></div><div class="panel-body"><div class="component-cards">${airComponentCard()}${comps.map(componentCard).join("")||'<div class="muted">No land components selected yet.</div>'}</div></div></section>
      </div><aside class="panel sticky"><div class="panel-head">Customer package</div><div class="panel-body"><div class="master-ref">${escapeHTML(masterReference())}</div><div class="money-line"><span>Passengers</span><strong>${passengers().length}</strong></div><div class="money-line"><span>Air / booking</span><strong>${money(Number(b.totalAmount)||0,b.currency)}</strong></div><div class="money-line"><span>Land components</span><strong>${money(totalComponents(),b.currency)}</strong></div><div class="money-line"><span>Recorded total</span><strong class="price-total">${money(packageTotal(),b.currency)}</strong></div><div class="action-stack" style="margin-top:10px"><button class="secondary" data-action="generate-booking-document" data-doc-type="BOOKING_CONFIRMATION">Generate confirmation</button><button class="secondary" data-action="send-booking-document" data-doc-type="BOOKING_CONFIRMATION">Email confirmation</button><button class="secondary" data-view="manifests">Operational manifests</button></div></div></aside></div>`;
  }

  function airComponentCard(){const b=booking();if(!(state.selectedOrder||b?.supplierOrderId||b?.origin))return "";return `<div class="component-card"><div><strong>Flight</strong><br>${escapeHTML([b.origin,b.destination].filter(Boolean).join(" → ")||state.selectedOrder?.route||"Supplier itinerary")}</div><span class="badge info">AIR</span><div class="meta">Supplier locator ${escapeHTML(b.supplierBookingReference||state.selectedOrder?.bookingReference||"—")} · ${money(Number(b.totalAmount)||0,b.currency)}</div></div>`}
  function componentCard(c){return `<div class="component-card"><div><strong>${escapeHTML(serviceLabel(c))}</strong><br>${escapeHTML(humanize(c.componentType||c.entityType))}</div><span class="badge ${statusClass(c.status)}">${escapeHTML(c.status||"SELECTED")}</span><div class="meta">${escapeHTML(c.supplier||"SKANDI")} ${escapeHTML(c.supplierReference||"")} · ${money(c.totalAmount,c.currency||booking()?.currency)}</div></div>`}

  function renderClub(){
    const w=workspace();if(!w?.booking)return `${pageHead("SKANDI Club","Link passenger loyalty profiles directly to the master booking.")}${emptyState("★","No booking selected","Open a booking first.")}`;
    const list=passengers();const p=list.find(x=>x.id===state.selectedPassengerId)||list[0]||null;if(p)state.selectedPassengerId=p.id;const club=clubFor(p);
    return `${pageHead("SKANDI Club",`${masterReference()} · passenger loyalty and benefits`)}<div class="workspace-layout"><div><section class="panel"><div class="panel-head">Passengers</div><div class="panel-body" style="padding:0">${passengerTable(list)}</div></section><section class="panel" style="margin-top:10px"><div class="panel-head">Find member</div><div class="panel-body"><div class="grid grid-3"><div class="field"><label>Membership / email / name</label><input id="clubSearch" value="${escapeAttr(p?.email||paxName(p)||"")}"></div><div class="field"><label>Passenger</label><select id="clubPassenger">${list.map(x=>option(x.id,paxName(x),p?.id)).join("")}</select></div><div class="field" style="justify-content:end"><button class="primary" data-action="search-club">Search SKANDI Club</button></div></div><div id="clubResults">${clubResultsMarkup()}</div></div></section></div><aside class="sticky">${clubProfileMarkup(p,club)}</aside></div>`;
  }
  function clubResultsMarkup(){if(!state.clubSearchResults.length)return '<div class="muted">Search the SKANDI Club member database to link an existing profile.</div>';return `<table class="data-table"><thead><tr><th>Member</th><th>Tier</th><th>Points</th><th></th></tr></thead><tbody>${state.clubSearchResults.map(m=>`<tr><td><strong>${escapeHTML(m.name||[m.firstName,m.lastName].filter(Boolean).join(" ")||"Member")}</strong><br><small class="mono">${escapeHTML(m.memberNumber||m.id||"")}</small></td><td>${escapeHTML(m.tier||"MEMBER")}</td><td>${escapeHTML(String(m.pointsBalance??m.points??0))}</td><td><button class="primary" data-action="link-club" data-member-id="${escapeAttr(m.id||m.memberId||m.memberNumber)}">Link</button></td></tr>`).join("")}</tbody></table>`}
  function clubProfileMarkup(p,club){if(!p)return `<section class="panel"><div class="panel-head">Member profile</div><div class="panel-body muted">No passenger selected.</div></section>`;if(!club)return `<section class="panel"><div class="panel-head">${escapeHTML(paxName(p))}</div><div class="panel-body">${emptyState("★","No Club profile linked","Search for an existing member and link it to this passenger.")}</div></section>`;return `<div class="club-card"><div><div class="tier">SKANDI CLUB · ${escapeHTML(club.tier||"MEMBER")}</div><div style="margin-top:6px">${escapeHTML(club.name||paxName(p))}</div></div><div><div class="member">${escapeHTML(club.memberNumber||club.id||"—")}</div><div>${escapeHTML(String(club.pointsBalance??club.points??0))} points</div></div></div><section class="panel" style="margin-top:8px"><div class="panel-head">Benefits & control</div><div class="panel-body"><div class="money-line"><span>Tier</span><strong>${escapeHTML(club.tier||"MEMBER")}</strong></div><div class="money-line"><span>Points</span><strong>${escapeHTML(String(club.pointsBalance??club.points??0))}</strong></div><div class="money-line"><span>Status credits</span><strong>${escapeHTML(String(club.statusCredits??"—"))}</strong></div><div class="field" style="margin-top:8px"><label>Points adjustment</label><input id="clubPointsDelta" type="number" step="1" placeholder="e.g. 500 or -500"></div><div class="field"><label>Reason</label><input id="clubPointsReason" placeholder="Service recovery / manual correction"></div><button class="secondary" data-action="adjust-club" data-member-id="${escapeAttr(club.id||club.memberId||club.memberNumber)}">Post adjustment</button></div></section>`}

  renderRequirements=function(){
    const w=workspace();const list=passengers();const p=list.find(x=>x.id===state.selectedPassengerId)||list[0]||null;const decision=state.travelDecision;const provider=state.travelRequirementsProvider||"Provider not connected";
    return `${pageHead("Travel Requirements",`${provider} · passenger document and itinerary check`,'<button class="secondary" data-action="open-timatic-desk">Open Timatic Desk</button>')}${!provider||provider==="Provider not connected"?alertBox("warning","Live regulatory provider not confirmed","SKANDI guidance can still be shown, but no result is represented as a live Timatic decision until the parent bridge identifies an authorized provider."):alertBox("info","Live provider adapter",`Current provider: ${provider}. Results are stored against the passenger and booking for audit.`)}
      ${w?.booking?`<section class="panel"><div class="panel-head">Passenger enquiry</div><div class="panel-body"><div class="grid grid-4"><div class="field"><label>Passenger</label><select id="reqPassenger">${list.map(x=>option(x.id,paxName(x),p?.id)).join("")}</select></div><div class="field"><label>Nationality</label><input id="reqNationality" maxlength="3" value="${escapeAttr(p?.nationality||"")}"></div><div class="field"><label>Residence country</label><input id="reqResidence" maxlength="3" value="${escapeAttr(p?.residenceCountry||p?.payload?.residenceCountry||"")}"></div><div class="field"><label>Date of birth</label><input id="reqDob" type="date" value="${escapeAttr(p?.dateOfBirth||"")}"></div></div><div class="grid grid-4"><div class="field"><label>Origin</label><input id="reqOrigin" maxlength="3" value="${escapeAttr(w.booking.origin||"")}"></div><div class="field"><label>Destination</label><input id="reqDestination" maxlength="3" value="${escapeAttr(w.booking.destination||"")}"></div><div class="field"><label>Passport issuing country</label><input id="reqIssue" maxlength="3" value="${escapeAttr(p?.passportCountry||p?.payload?.passportCountry||"")}"></div><div class="field"><label>Passport expiry</label><input id="reqExpiry" type="date" value="${escapeAttr(p?.passportExpiry||p?.payload?.passportExpiry||"")}"></div></div><div class="field"><label>Transit points (IATA, comma-separated)</label><input id="reqTransit" placeholder="LHR, DOH"></div><button class="primary" data-action="check-requirements">Check requirements</button></div></section>`:emptyState("✓","No booking selected","Open a booking before checking a passenger.")}
      ${decision?travelDecisionMarkup(decision):""}<section class="panel" style="margin-top:10px"><div class="panel-head">Published SKANDI guidance</div><div class="panel-body"><div class="grid grid-2">${(state.requirements||[]).map(r=>`<section class="panel"><div class="panel-head"><span>${escapeHTML(r.title||"Requirement")}</span><span class="badge info">${escapeHTML(r.category||"GUIDANCE")}</span></div><div class="panel-body">${escapeHTML(r.body||"").replace(/\n/g,"<br>")}</div></section>`).join("")||'<span class="muted">No internal guidance records published.</span>'}</div></div></section>`;
  };
  function travelDecisionMarkup(d){const status=normalizedType(d.status||d.decision||"REVIEW");const tone=status.includes("CLEAR")||status.includes("OK")?"go":status.includes("STOP")||status.includes("DENIED")?"stop":"review";return `<section class="decision ${tone}" style="margin-top:10px"><div class="muted">${escapeHTML(d.provider||state.travelRequirementsProvider||"Requirements provider")} · ${escapeHTML(d.reference||"")}</div><h2>${escapeHTML(humanize(status))}</h2><div>${escapeHTML(d.summary||d.message||"No summary returned.")}</div>${Array.isArray(d.sections)?`<div style="margin-top:10px">${d.sections.map(s=>`<div class="money-line"><span>${escapeHTML(s.title||s.category||"Requirement")}</span><strong>${escapeHTML(s.status||"")}</strong></div>`).join("")}</div>`:""}</section>`}

  renderTicketing=function(){
    const w=workspace(),order=state.selectedOrder;if(!w?.booking&&!order)return `${pageHead("Ticketing & Documents","Supplier-issued air documents plus SKANDI customer documents and vouchers.")}${emptyState("▥","No booking selected","Open a booking first.")}`;
    const supplierDocs=order?.documents||[];const internalDocs=w?.documents||[];const comps=components();
    return `${pageHead("Ticketing & Documents",`${masterReference()} · document center`,'<button class="primary" data-action="print-booking-confirmation">Print confirmation</button>')}
      <div class="alert info"><span>ℹ</span><div><strong>Document authority</strong>Airline ticket/EMD identifiers are only displayed from Duffel or the operating supplier. SKANDI-generated documents are booking confirmations, vouchers, manifests and transfer boarding cards, luggage tags and manifests for SKANDI-controlled transfers.</div></div>
      <div class="grid grid-2"><section class="panel"><div class="panel-head"><span>Supplier air documents</span><span>${supplierDocs.length}</span></div><div class="panel-body" style="padding:0">${documentTable(supplierDocs)}</div></section><section class="panel"><div class="panel-head"><span>SKANDI document register</span><span>${internalDocs.length}</span></div><div class="panel-body" style="padding:0">${internalDocumentTable(internalDocs)}</div></section></div>
      <section class="panel" style="margin-top:10px"><div class="panel-head">Generate / send customer documents</div><div class="panel-body"><div class="document-actions"><button class="secondary" data-action="generate-booking-document" data-doc-type="BOOKING_CONFIRMATION">Booking confirmation</button><button class="secondary" data-action="generate-booking-document" data-doc-type="INVOICE">Invoice / receipt</button><button class="secondary" data-action="send-booking-document" data-doc-type="BOOKING_CONFIRMATION">Email confirmation</button><button class="secondary" data-action="print-passenger-manifest">Passenger list</button></div></div></section>
      <section class="panel" style="margin-top:10px"><div class="panel-head">Component vouchers</div><div class="panel-body" style="padding:0">${comps.length?`<table class="data-table"><thead><tr><th>Service</th><th>Supplier</th><th>Status</th><th>Voucher</th></tr></thead><tbody>${comps.map(c=>`<tr><td>${escapeHTML(serviceLabel(c))}</td><td>${escapeHTML(c.supplier||"SKANDI")}</td><td>${escapeHTML(c.status||"")}</td><td><button class="link" data-action="print-component-voucher" data-component-id="${escapeAttr(c.id)}">Print</button> · <button class="link" data-action="send-component-voucher" data-component-id="${escapeAttr(c.id)}">Send</button></td></tr>`).join("")}</tbody></table>`:'<div class="empty">No package components require vouchers.</div>'}</div></section>
      ${order?`<section class="panel" style="margin-top:10px"><div class="panel-head">Air servicing</div><div class="panel-body"><div class="document-actions"><button class="secondary" data-view="actions">Change / reissue flight</button><button class="secondary" data-view="actions">Void / refund / cancel</button><button class="secondary" data-action="open-advanced-ticketing">Advanced Ticketing</button></div></div></section>`:""}`;
  };

  renderBaggageBoarding=function(){return renderDepartureControl()};

  function transferComponents(){return components().filter(c=>normalizedType(c.componentType||c.entityType).includes("TRANSFER"))}
  function normalizeTransferDeparture(raw,index=0){
    const p=raw?.payload||{};const b=booking();
    let status=normalizedType(raw?.transferStatus||raw?.operationalStatus||p.transferStatus||p.operationalStatus||raw?.status||"OPEN");
    if(["CONFIRMED","BOOKED","ACTIVE","PUBLISHED"].includes(status))status="OPEN";
    const ref=raw?.serviceNumber||raw?.transferNumber||p.serviceNumber||p.transferNumber||raw?.supplierReference||p.reference||`TRF-${String(masterReference()).replace(/[^A-Z0-9]/gi,"").slice(-5).toUpperCase()||"SK"}-${String(index+1).padStart(2,"0")}`;
    const origin=raw?.pickupLocation||raw?.origin||p.pickupLocation||p.pickupPoint||p.from||p.origin||b?.origin||"Airport / pickup";
    const destination=raw?.dropoffLocation||raw?.destination||p.dropoffLocation||p.dropoffPoint||p.hotelName||p.to||p.destination||b?.destination||"Hotel / destination";
    const date=raw?.serviceDate||raw?.startDate||p.serviceDate||p.pickupDate||b?.departureDate||b?.startDate||"";
    const scheduled=raw?.serviceTime||raw?.pickupTime||p.pickupTime||p.serviceTime||p.scheduledDeparture||"—";
    const localState=state.transferDcsDepartureState[raw?.id||ref]||{};
    return {id:String(raw?.id||raw?.componentId||ref),componentId:raw?.componentId||raw?.id||"",bookingId:raw?.bookingId||b?.id||"",serviceNumber:String(ref),origin:String(origin),destination:String(destination),date:String(date),scheduled:String(scheduled),estimated:String(localState.estimated||raw?.estimatedDeparture||p.estimatedDeparture||scheduled),bay:String(localState.bay||raw?.bay||p.bay||p.meetingPoint||p.pickupMeetingPoint||"—"),vehicle:String(localState.vehicle||raw?.vehicleName||raw?.vehicleType||p.vehicleName||p.vehicleType||p.coachType||"Coach"),vehicleRegistration:String(localState.vehicleRegistration||raw?.vehicleRegistration||p.vehicleRegistration||""),capacity:Number(localState.capacity||raw?.capacity||p.capacity||p.vehicleCapacity||50)||50,booked:Number(raw?.passengerCount||p.passengerCount||passengers().length||0),driver:String(localState.driver||raw?.driverName||p.driverName||"—"),guide:String(localState.guide||raw?.guideName||p.guideName||p.hostName||"—"),terminal:String(raw?.terminal||p.terminal||p.airportTerminal||""),associatedFlight:String(raw?.associatedFlight||p.associatedFlight||p.flightNumber||b?.flightNumber||""),status:String(localState.status||status||"OPEN"),raw};
  }
  function transferDepartures(){
    const live=Array.isArray(state.transferDcsDepartures)?state.transferDcsDepartures:[];const local=transferComponents();const all=[...live,...local];const seen=new Set();return all.map(normalizeTransferDeparture).filter(d=>{const k=d.id||d.serviceNumber;if(seen.has(k))return false;seen.add(k);return true});
  }
  function selectedTransferDeparture(){const list=transferDepartures();let dep=list.find(d=>d.id===state.transferDcsSelectedDepartureId)||list[0]||null;if(dep&&!state.transferDcsSelectedDepartureId)state.transferDcsSelectedDepartureId=dep.id;return dep}
  function transferPassengers(dep){if(!dep)return[];const raw=dep.raw||{};if(Array.isArray(raw.passengers)&&raw.passengers.length)return raw.passengers;if(Array.isArray(raw.payload?.passengers)&&raw.payload.passengers.length)return raw.payload.passengers;if(!workspace()?.booking)return[];return passengers()}
  function transferPaxState(dep,p){
    if(!dep||!p)return{acceptance:"BOOKED",boarding:"NOT_BOARDED",seat:"",bags:0,weight:0,boardedAt:""};const depId=dep.id,pid=p.id||p.passengerId||p.passengerRef||paxName(p);const saved=state.transferDcsPassengerState[depId]?.[pid]||{};const source=p.transferDcs?.[depId]||p.payload?.transferDcs?.[depId]||{};
    return {acceptance:normalizedType(saved.acceptance||source.acceptance||source.status||"BOOKED"),boarding:normalizedType(saved.boarding||source.boarding||"NOT_BOARDED"),seat:String(saved.seat||source.seat||""),bags:Number(saved.bags??source.bags??p.baggageCount??p.payload?.baggageCount??0)||0,weight:Number(saved.weight??source.weight??p.baggageWeight??p.payload?.baggageWeight??0)||0,boardedAt:String(saved.boardedAt||source.boardedAt||""),voucherVerified:Boolean(saved.voucherVerified??source.voucherVerified??false),remarks:String(saved.remarks||source.remarks||"")};
  }
  function transferPaxId(p){return String(p?.id||p?.passengerId||p?.passengerRef||paxName(p))}
  function transferSelectedPax(dep){const list=transferPassengers(dep);const id=state.transferDcsSelectedPassengerId;return list.find(p=>transferPaxId(p)===id)||list[0]||null}
  function transferStats(dep){const list=transferPassengers(dep);const states=list.map(p=>transferPaxState(dep,p));return{booked:list.length||dep?.booked||0,accepted:states.filter(x=>["ACCEPTED","BOARDED"].includes(x.acceptance)||x.boarding==="BOARDED").length,boarded:states.filter(x=>x.boarding==="BOARDED").length,waitlist:states.filter(x=>x.acceptance==="WAITLIST").length,noshow:states.filter(x=>x.acceptance==="NO_SHOW").length,bags:states.reduce((a,x)=>a+x.bags,0)}}
  function transferStatusBadge(status){status=normalizedType(status||"OPEN");const cls=["OPEN","BOARDING","READY"].includes(status)?"success":["DELAYED","WAITLIST","HOLD"].includes(status)?"warning":["CLOSED","CANCELLED"].includes(status)?"danger":"neutral";return `<span class="badge ${cls}">${escapeHTML(humanize(status))}</span>`}
  function transferDcsTabs(){const tabs=[["departures","▦","Transfer Departures"],["acceptance","▤","Customer Acceptance"],["seats","▦","Seat / Space Control"],["boarding","▶","Coach Boarding"],["activity","≡","Operational Activity"]];return `<div class="transfer-dcs-tabs">${tabs.map(([id,icon,label])=>`<button class="transfer-dcs-tab ${state.transferDcsTab===id?"active":""}" data-transfer-dcs-tab="${id}">${icon} ${label}</button>`).join("")}</div>`}
  function renderDepartureControl(){
    const dep=selectedTransferDeparture();const stats=dep?transferStats(dep):{booked:0,accepted:0,boarded:0,bags:0};
    return `${pageHead("Departure Control",dep?`${dep.serviceNumber} · ${dep.origin} → ${dep.destination}`:"SKANDI airport and hotel transfer operations",'<button class="secondary" data-action="refresh-transfer-dcs">Refresh departures</button>')}
      ${alertBox("info","Transfer Departure Control","SKANDI does not operate airline DCS. This workspace applies the same departure-control workflow to SKANDI bus and coach transfers: departure board, customer acceptance, seat/space control, luggage, boarding, no-show/offload and dispatch close.")}
      ${transferDcsTabs()}
      <div class="dcs-summary">${statCard("Transfer departures",transferDepartures().length,"Loaded services")}${statCard("Booked",stats.booked,"Selected departure")}${statCard("Accepted",stats.accepted,"At meeting point / accepted")}${statCard("Boarded",stats.boarded,`${stats.bags} luggage piece(s)`)}</div>
      ${renderTransferDcsTab(dep)}`;
  }
  function renderTransferDcsTab(dep){if(state.transferDcsTab==="departures")return renderTransferDepartures();if(!dep)return `<section class="panel"><div class="panel-head">${escapeHTML(humanize(state.transferDcsTab))}</div><div class="panel-body">${emptyState("▰","No transfer departure selected","Open a booking with a transfer component or load today's transfer departures from the ALTEA transfer operations backend.")}</div></section>`;if(state.transferDcsTab==="acceptance")return renderTransferAcceptance(dep);if(state.transferDcsTab==="seats")return renderTransferSeatControl(dep);if(state.transferDcsTab==="boarding")return renderTransferBoarding(dep);return renderTransferActivity(dep)}
  function renderTransferDepartures(){const list=transferDepartures();if(!list.length)return `<section class="panel"><div class="panel-head">Transfer Departure Board</div><div class="panel-body">${emptyState("▰","No transfer departures loaded","The module remains available without a booking. Confirmed SKANDI transfer components appear here automatically; the live operations backend can also provide all departures for the station/day.")}</div></section>`;return `<section class="panel"><div class="panel-head"><span>Transfer Departure Board</span><span class="muted">Airport ↔ hotel / resort coach services</span></div><div class="panel-body" style="padding:0"><table class="data-table"><thead><tr><th>Service</th><th>Route</th><th>Date</th><th>STD</th><th>ETD</th><th>Bay / meeting point</th><th>Vehicle</th><th>Load</th><th>Driver / host</th><th>Status</th><th></th></tr></thead><tbody>${list.map(dep=>{const st=transferStats(dep),pct=Math.min(100,Math.round((st.booked/Math.max(1,dep.capacity))*100));return `<tr class="${dep.id===state.transferDcsSelectedDepartureId?"selected":""}"><td><strong class="mono">${escapeHTML(dep.serviceNumber)}</strong>${dep.associatedFlight?`<div class="transfer-flight-ref">Flight ${escapeHTML(dep.associatedFlight)}${dep.terminal?` · T${escapeHTML(dep.terminal)}`:""}</div>`:""}</td><td><div class="transfer-route">${escapeHTML(dep.origin)} → ${escapeHTML(dep.destination)}</div><div class="transfer-sub">${escapeHTML(dep.guide!=="—"?`Host ${dep.guide}`:"")}</div></td><td>${escapeHTML(dep.date||"—")}</td><td class="mono strong">${escapeHTML(dep.scheduled)}</td><td class="mono ${dep.estimated!==dep.scheduled?"strong":""}">${escapeHTML(dep.estimated)}</td><td>${escapeHTML(dep.bay)}</td><td>${escapeHTML(dep.vehicle)}${dep.vehicleRegistration?`<br><small class="mono">${escapeHTML(dep.vehicleRegistration)}</small>`:""}</td><td><div class="transfer-load"><strong>${st.booked}/${dep.capacity}</strong> · ${st.accepted} accepted · ${st.boarded} boarded<div class="transfer-load-track"><div class="transfer-load-fill" style="width:${pct}%"></div></div></div></td><td>${escapeHTML(dep.driver)}${dep.guide!=="—"?`<br><small>${escapeHTML(dep.guide)}</small>`:""}</td><td>${transferStatusBadge(dep.status)}</td><td><button class="link" data-action="select-transfer-departure" data-departure-id="${escapeAttr(dep.id)}">Open</button></td></tr>`}).join("")}</tbody></table></div></section>`}
  function renderTransferAcceptance(dep){const list=transferPassengers(dep);const p=transferSelectedPax(dep);return `<div class="workspace-layout"><section class="panel"><div class="panel-head"><span>Customer Acceptance · ${escapeHTML(dep.serviceNumber)}</span><span>${list.length} customers</span></div><div class="toolbar"><div class="field" style="margin:0;min-width:180px"><label>Status</label><select id="transferAcceptanceFilter"><option value="ALL">All customers</option><option value="BOOKED">Booked / not arrived</option><option value="ACCEPTED">Accepted</option><option value="WAITLIST">Waitlist / overflow</option><option value="NO_SHOW">No show</option></select></div><span class="muted">Meeting point: <strong>${escapeHTML(dep.bay)}</strong> · Vehicle ${escapeHTML(dep.vehicle)}</span></div><div class="panel-body" style="padding:0">${transferAcceptanceTable(dep,list)}</div></section><aside class="panel sticky"><div class="panel-head">Selected customer</div><div class="panel-body">${p?transferCustomerPanel(dep,p):'<span class="muted">No customer selected.</span>'}</div></aside></div>`}
  function transferAcceptanceTable(dep,list){if(!list.length)return '<div class="empty">No customers assigned to this transfer departure.</div>';return `<table class="data-table"><thead><tr><th>SEQ</th><th>Customer</th><th>Booking</th><th>Hotel / drop-off</th><th>Seat</th><th>Acceptance</th><th>Luggage</th><th>Boarding</th><th></th></tr></thead><tbody>${list.map((p,i)=>{const st=transferPaxState(dep,p);const ref=p.bookingReference||p.pnrLocator||masterReference();return `<tr data-transfer-status="${escapeAttr(st.acceptance)}"><td class="mono">${String(i+1).padStart(3,"0")}</td><td><strong>${escapeHTML(paxName(p))}</strong>${clubFor(p)?`<br><small>${escapeHTML(clubFor(p).tier||clubFor(p).memberNumber||"")}</small>`:""}</td><td class="mono">${escapeHTML(ref)}</td><td>${escapeHTML(p.hotelName||p.payload?.hotelName||dep.destination)}</td><td class="mono">${escapeHTML(st.seat||"—")}</td><td>${transferStatusBadge(st.acceptance)}</td><td>${st.bags} pc${st.weight?` · ${st.weight} kg`:""}</td><td>${transferStatusBadge(st.boarding)}</td><td><button class="link" data-action="select-transfer-passenger" data-passenger-id="${escapeAttr(transferPaxId(p))}">Open</button></td></tr>`}).join("")}</tbody></table>`}
  function transferCustomerPanel(dep,p){const st=transferPaxState(dep,p);const ref=p.bookingReference||p.pnrLocator||masterReference();return `<div class="transfer-profile"><div class="transfer-profile-head"><div class="transfer-profile-name">${escapeHTML(paxName(p))}</div><div class="transfer-profile-ref">${escapeHTML(ref)} · ${escapeHTML(dep.serviceNumber)}</div></div><div class="money-line"><span>Hotel / drop-off</span><strong>${escapeHTML(p.hotelName||p.payload?.hotelName||dep.destination)}</strong></div><div class="money-line"><span>Seat</span><strong>${escapeHTML(st.seat||"Unassigned")}</strong></div><div class="money-line"><span>Acceptance</span><strong>${escapeHTML(humanize(st.acceptance))}</strong></div><div class="money-line"><span>Boarding</span><strong>${escapeHTML(humanize(st.boarding))}</strong></div><div class="money-line"><span>Luggage</span><strong>${st.bags} pc${st.weight?` · ${st.weight} kg`:""}</strong></div><div class="money-line"><span>Transfer voucher</span><strong>${st.voucherVerified?"Verified":"Not verified"}</strong></div><div class="dcs-toolbar"><button class="primary" data-action="transfer-accept">Accept customer</button><button class="secondary" data-action="transfer-voucher-verify">Verify voucher</button><button class="secondary" data-action="transfer-bag">Luggage</button><button class="secondary" data-action="transfer-seat">Seat</button><button class="secondary" data-action="transfer-card">Transfer card</button><button class="secondary" data-action="transfer-luggage-tag">Luggage tag</button><button class="warning-btn secondary" data-action="transfer-waitlist">Waitlist / overflow</button><button class="danger-btn" data-action="transfer-noshow">No show</button></div></div>`}
  function renderTransferSeatControl(dep){const list=transferPassengers(dep),selected=transferSelectedPax(dep),rows=Math.ceil(Math.max(4,dep.capacity)/4);const occupied=new Map();list.forEach(p=>{const st=transferPaxState(dep,p);if(st.seat&&st.acceptance!=="NO_SHOW")occupied.set(st.seat,p)});return `<div class="workspace-layout"><section class="panel"><div class="panel-head"><span>Seat / Space Control · ${escapeHTML(dep.vehicle)}</span><span>${occupied.size}/${dep.capacity} assigned</span></div><div class="panel-body"><div class="coach-shell"><div class="coach-front">DRIVER / FRONT · ${escapeHTML(dep.serviceNumber)}</div>${Array.from({length:rows},(_,i)=>{const row=i+1;return `<div class="coach-row"><div class="coach-row-num">${row}</div>${["A","B"].map(l=>transferSeatButton(dep,`${row}${l}`,occupied)).join("")}<div class="coach-aisle">AISLE</div>${["C","D"].map(l=>transferSeatButton(dep,`${row}${l}`,occupied)).join("")}</div>`}).join("")}</div></div></section><aside class="panel sticky"><div class="panel-head">Selected customer</div><div class="panel-body">${selected?`${transferCustomerPanel(dep,selected)}<button class="primary" style="margin-top:8px" data-action="transfer-auto-seat">Auto-assign next seat</button>`:'<span class="muted">Select a customer in Customer Acceptance.</span>'}</div></aside></div>`}
  function transferSeatButton(dep,seat,occupied){const p=occupied.get(seat);const selected=p&&transferPaxId(p)===state.transferDcsSelectedPassengerId;const n=parseInt(seat,10);const blocked=n*4>dep.capacity;return `<button class="coach-seat ${p?"occupied":""} ${selected?"selected":""} ${blocked?"blocked":""}" data-action="transfer-seat-click" data-seat="${escapeAttr(seat)}" ${blocked?"disabled":""} title="${escapeAttr(p?paxName(p):seat)}">${escapeHTML(seat.slice(-1))}</button>`}
  function renderTransferBoarding(dep){const list=transferPassengers(dep);const st=transferStats(dep);const depState=state.transferDcsDepartureState[dep.id]||{};const boardingStarted=Boolean(depState.boardingStarted)||dep.status==="BOARDING";const closed=dep.status==="CLOSED"||Boolean(depState.closed);return `<div class="board-kpis" style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin-bottom:8px">${statCard("To board",st.accepted,"Accepted customers")}${statCard("Boarded",st.boarded,"On coach")}${statCard("Remaining",Math.max(0,st.accepted-st.boarded),"Accepted, not boarded")}${statCard("Waitlist",st.waitlist,"Overflow / next coach")}</div><div class="workspace-layout"><div><div class="transfer-scanner"><div class="strong">Coach boarding scanner / manual entry</div><div class="transfer-scanner-line"><input id="transferScannerInput" placeholder="BOOKING REF, SEQ, SEAT OR SURNAME" autocomplete="off" ${boardingStarted&&!closed?"":"disabled"}><button class="primary" data-action="transfer-scan" ${boardingStarted&&!closed?"":"disabled"}>BOARD</button></div><div class="transfer-sub" style="color:#9fc1d7">Service ${escapeHTML(dep.serviceNumber)} · ${escapeHTML(dep.origin)} → ${escapeHTML(dep.destination)} · Bay ${escapeHTML(dep.bay)}</div><div class="transfer-scan-result" id="transferScanResult"><strong>${closed?"Departure closed":boardingStarted?"Scanner ready":"Boarding not started"}</strong><div>${closed?"No further boarding transactions are permitted.":boardingStarted?"Waiting for customer input.":"Start boarding to activate the scanner."}</div></div></div><section class="panel" style="margin-top:8px"><div class="panel-head">Boarding Customer List</div><div class="panel-body" style="padding:0">${transferBoardingTable(dep,list)}</div></section></div><aside class="panel sticky"><div class="panel-head">Dispatch Control</div><div class="panel-body"><div class="money-line"><span>Status</span><strong>${escapeHTML(humanize(dep.status))}</strong></div><div class="money-line"><span>Vehicle</span><strong>${escapeHTML(dep.vehicle)}</strong></div><div class="money-line"><span>Driver</span><strong>${escapeHTML(dep.driver)}</strong></div><div class="money-line"><span>Host / guide</span><strong>${escapeHTML(dep.guide)}</strong></div><div class="money-line"><span>Bay / point</span><strong>${escapeHTML(dep.bay)}</strong></div><div class="action-stack" style="margin-top:10px"><button class="primary" data-action="transfer-start-boarding" ${closed?"disabled":""}>${boardingStarted?"Boarding active":"Start boarding"}</button><button class="secondary" data-action="print-transfer-manifest">Print transfer manifest</button><button class="danger-btn" data-action="transfer-close" ${closed?"disabled":""}>Close & dispatch coach</button></div></div></aside></div>`}
  function transferBoardingTable(dep,list){if(!list.length)return '<div class="empty">No customers assigned.</div>';return `<table class="data-table"><thead><tr><th>SEQ</th><th>Customer</th><th>Seat</th><th>Acceptance</th><th>Boarding</th><th>Time</th><th>Luggage</th><th></th></tr></thead><tbody>${list.map((p,i)=>{const st=transferPaxState(dep,p);return `<tr><td class="mono">${String(i+1).padStart(3,"0")}</td><td><strong>${escapeHTML(paxName(p))}</strong></td><td>${escapeHTML(st.seat||"—")}</td><td>${transferStatusBadge(st.acceptance)}</td><td>${transferStatusBadge(st.boarding)}</td><td class="mono">${escapeHTML(st.boardedAt||"—")}</td><td>${st.bags} pc</td><td><button class="link" data-action="select-transfer-passenger" data-passenger-id="${escapeAttr(transferPaxId(p))}">Open</button>${st.boarding==="BOARDED"?' · <button class="link" data-action="transfer-offload" data-passenger-id="'+escapeAttr(transferPaxId(p))+'">Offload</button>':""}</td></tr>`}).join("")}</tbody></table>`}
  function renderTransferActivity(dep){const rows=state.transferDcsActivity.filter(a=>!dep||a.departureId===dep.id);return `<div class="grid grid-2"><section class="panel"><div class="panel-head"><span>Operational Activity · ${escapeHTML(dep?.serviceNumber||"Transfers")}</span><button class="link" data-action="transfer-clear-activity">Clear local log</button></div><div class="panel-body" style="padding:0"><div class="transfer-activity">${rows.length?rows.map(a=>`<div class="transfer-activity-row"><time>${escapeHTML(a.time)}</time><div>${escapeHTML(a.text)}</div></div>`).join(""):'<div class="empty">No transfer operations recorded in this session.</div>'}</div></div></section><section class="panel"><div class="panel-head">Operational reference</div><div class="panel-body"><div class="money-line"><span>Service</span><strong class="mono">${escapeHTML(dep?.serviceNumber||"—")}</strong></div><div class="money-line"><span>Route</span><strong>${escapeHTML(dep?`${dep.origin} → ${dep.destination}`:"—")}</strong></div><div class="money-line"><span>Scheduled</span><strong>${escapeHTML(dep?`${dep.date} ${dep.scheduled}`:"—")}</strong></div><div class="money-line"><span>Associated flight</span><strong>${escapeHTML(dep?.associatedFlight||"—")}</strong></div><div class="money-line"><span>Vehicle</span><strong>${escapeHTML(dep?.vehicle||"—")}</strong></div><div class="money-line"><span>Driver</span><strong>${escapeHTML(dep?.driver||"—")}</strong></div><div class="transfer-operation-note" style="margin-top:10px">Transfer Departure Control is SKANDI operational control. It does not create airline check-in status, airline boarding passes or airline baggage tags.</div></div></section></div>`}
  function transferLog(dep,text){state.transferDcsActivity.unshift({departureId:dep?.id||"",time:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),text});state.transferDcsActivity=state.transferDcsActivity.slice(0,250)}
  function transferSavePassenger(dep,p,patch,message){if(!dep||!p)return;const depId=dep.id,pid=transferPaxId(p);state.transferDcsPassengerState[depId]=state.transferDcsPassengerState[depId]||{};state.transferDcsPassengerState[depId][pid]={...transferPaxState(dep,p),...patch};transferLog(dep,`${paxName(p)} · ${message}`);if(state.transferDcsPersistence)post("ALTEA_TRANSFER_DCS_UPDATE_PASSENGER",{departureId:dep.id,componentId:dep.componentId,bookingId:dep.bookingId||booking()?.id,passengerId:p.id||pid,patch:state.transferDcsPassengerState[depId][pid]},{busy:false});toast("Transfer Departure Control",message,"success");render()}
  function transferSaveDeparture(dep,patch,message){if(!dep)return;state.transferDcsDepartureState[dep.id]={...(state.transferDcsDepartureState[dep.id]||{}),...patch};transferLog(dep,message);if(state.transferDcsPersistence)post("ALTEA_TRANSFER_DCS_UPDATE_DEPARTURE",{departureId:dep.id,componentId:dep.componentId,bookingId:dep.bookingId||booking()?.id,patch},{busy:false});toast("Transfer Departure Control",message,"success");render()}
  function openTransferBagModal(){const dep=selectedTransferDeparture(),p=transferSelectedPax(dep);if(!dep||!p)return;const st=transferPaxState(dep,p);openModal("Transfer luggage",`<div class="grid grid-2"><div class="field"><label>Pieces</label><input id="transferBagPieces" type="number" min="0" value="${escapeAttr(String(st.bags))}"></div><div class="field"><label>Total weight kg</label><input id="transferBagWeight" type="number" min="0" step="0.1" value="${escapeAttr(String(st.weight))}"></div></div><div class="field"><label>Luggage / mobility notes</label><textarea id="transferBagNotes">${escapeHTML(st.remarks||"")}</textarea></div>`,[{label:"Cancel",className:"secondary",close:true},{label:"Save luggage",className:"primary",onClick:()=>{const bags=Math.max(0,Number($("#transferBagPieces")?.value||0)),weight=Math.max(0,Number($("#transferBagWeight")?.value||0)),remarks=$("#transferBagNotes")?.value||"";closeModal();transferSavePassenger(dep,p,{bags,weight,remarks},`Luggage updated: ${bags} pc${weight?`, ${weight} kg`:""}`)}}])}
  function assignTransferSeat(seat){const dep=selectedTransferDeparture(),p=transferSelectedPax(dep);if(!dep||!p)return;const occupied=transferPassengers(dep).find(x=>x!==p&&transferPaxState(dep,x).seat===seat&&transferPaxState(dep,x).acceptance!=="NO_SHOW");if(occupied)return toast("Seat occupied",`${seat} is assigned to ${paxName(occupied)}.`,"warning");transferSavePassenger(dep,p,{seat},`Seat ${seat} assigned`)}
  function autoTransferSeat(){const dep=selectedTransferDeparture(),p=transferSelectedPax(dep);if(!dep||!p)return;const used=new Set(transferPassengers(dep).filter(x=>transferPaxId(x)!==transferPaxId(p)).map(x=>transferPaxState(dep,x).seat).filter(Boolean));const rows=Math.ceil(dep.capacity/4);for(let r=1;r<=rows;r++)for(const l of ["A","D","B","C"]){const seat=`${r}${l}`;const position=(r-1)*4+["A","B","C","D"].indexOf(l)+1;if(position<=dep.capacity&&!used.has(seat))return assignTransferSeat(seat)}toast("Coach full","No unassigned seats remain on this coach.","warning")}
  function transferScan(){const dep=selectedTransferDeparture();if(!dep)return;const input=$("#transferScannerInput");const val=String(input?.value||"").trim().toUpperCase();if(!val)return;const depState=state.transferDcsDepartureState[dep.id]||{};if(!depState.boardingStarted&&dep.status!=="BOARDING")return transferScanResult(false,"Boarding not started","Start boarding before processing customers.");if(dep.status==="CLOSED"||depState.closed)return transferScanResult(false,"Departure closed","No further boarding transactions are permitted.");const list=transferPassengers(dep);const p=list.find((x,i)=>{const st=transferPaxState(dep,x),ref=String(x.bookingReference||x.pnrLocator||masterReference()).toUpperCase();return String(i+1).padStart(3,"0")===val||String(st.seat).toUpperCase()===val||ref===val||String(x.lastName||x.last||"").toUpperCase()===val||paxName(x).toUpperCase()===val});if(!p)return transferScanResult(false,"Customer not found",`No customer matches ${val}.`);const st=transferPaxState(dep,p);if(st.boarding==="BOARDED")return transferScanResult(false,"Duplicate board",`${paxName(p)} is already boarded.`);if(!["ACCEPTED","BOARDED"].includes(st.acceptance))return transferScanResult(false,"Customer not accepted",`${paxName(p)} must be accepted at the transfer meeting point first.`);state.transferDcsSelectedPassengerId=transferPaxId(p);transferSavePassenger(dep,p,{boarding:"BOARDED",acceptance:"BOARDED",boardedAt:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})},`Boarded coach ${dep.serviceNumber}`);setTimeout(()=>transferScanResult(true,"Boarding accepted",`${paxName(p)} · seat ${transferPaxState(dep,p).seat||"unassigned"}`),0)}
  function transferScanResult(ok,title,message){const el=$("#transferScanResult");if(!el){toast(title,message,ok?"success":"danger");return}el.className=`transfer-scan-result ${ok?"success":"error"}`;el.innerHTML=`<strong>${escapeHTML(title)}</strong><div>${escapeHTML(message)}</div>`;if(ok){const i=$("#transferScannerInput");if(i){i.value="";i.focus()}}}
  function printTransferCard(){const dep=selectedTransferDeparture(),p=transferSelectedPax(dep);if(!dep||!p)return;const st=transferPaxState(dep,p);const no=`TC-${dep.serviceNumber}-${String(transferPassengers(dep).indexOf(p)+1).padStart(3,"0")}`;printHtml(`Transfer Card ${paxName(p)}`,transferCardHtml(dep,p,st,no))}
  function printTransferLuggageTag(){const dep=selectedTransferDeparture(),p=transferSelectedPax(dep);if(!dep||!p)return;const tag=`TRF-${String(masterReference()).replace(/[^A-Z0-9]/gi,"").slice(-6).toUpperCase()}-${String(transferPassengers(dep).indexOf(p)+1).padStart(3,"0")}`;printHtml(`Transfer Luggage Tag ${tag}`,transferLuggageTagHtml(dep,p,tag));if(state.transferDcsPersistence)post("ALTEA_TRANSFER_DCS_RECORD_DOCUMENT",{departureId:dep.id,bookingId:dep.bookingId||booking()?.id,passengerId:p.id||transferPaxId(p),documentType:"TRANSFER_LUGGAGE_TAG",documentNumber:tag},{busy:false})}
  function transferCardHtml(dep,p,st,no){return `<div style="border:2px solid #111;padding:18px"><div class="head"><div><div class="brand">SKANDI TRAVELS</div><div>TRANSFER BOARDING CARD</div></div><div class="ref">${escapeHTML(dep.serviceNumber)}</div></div><div style="font-size:24px;font-weight:800;margin:18px 0">${escapeHTML(paxName(p))}</div><div class="grid"><div class="box"><div class="label">From / meeting point</div><div class="value">${escapeHTML(dep.origin)}</div></div><div class="box"><div class="label">To</div><div class="value">${escapeHTML(dep.destination)}</div></div><div class="box"><div class="label">Pickup</div><div class="value">${escapeHTML(`${dep.date||""} ${dep.scheduled||""}`.trim())}</div></div><div class="box"><div class="label">Bay / point</div><div class="value">${escapeHTML(dep.bay)}</div></div><div class="box"><div class="label">Coach seat</div><div class="value" style="font-size:22px">${escapeHTML(st.seat||"OPEN")}</div></div><div class="box"><div class="label">Booking ref</div><div class="value">${escapeHTML(p.bookingReference||p.pnrLocator||masterReference())}</div></div></div><div class="barcode" style="margin-top:18px"></div><div class="muted" style="margin-top:5px">${escapeHTML(no)} · SKANDI transfer document, not an airline boarding pass.</div></div>`}
  function transferLuggageTagHtml(dep,p,tag){return `<div style="border:2px solid #111;padding:15px;width:680px;max-width:100%"><div style="display:flex;justify-content:space-between"><div><div class="brand">SKANDI TRAVELS</div><div class="muted">TRANSFER LUGGAGE TAG</div></div><div class="ref">${escapeHTML(tag)}</div></div><div style="font-size:34px;font-weight:900;margin:15px 0">${escapeHTML(dep.destination)}</div><div class="grid"><div class="box"><div class="label">Passenger</div><div class="value">${escapeHTML(paxName(p))}</div></div><div class="box"><div class="label">Transfer</div><div class="value">${escapeHTML(dep.serviceNumber)}</div></div><div class="box"><div class="label">Booking reference</div><div class="value">${escapeHTML(p.bookingReference||p.pnrLocator||masterReference())}</div></div></div><div class="barcode" style="margin-top:14px"></div><div class="ref" style="text-align:center;margin-top:5px">${escapeHTML(tag)}</div><div class="muted" style="margin-top:6px">Internal SKANDI transfer luggage identification. Not an IATA airline baggage tag.</div></div>`}
  function transferManifestHtml(dep){const list=transferPassengers(dep);return `<div class="head"><div><div class="brand">SKANDI TRAVELS</div><div>TRANSFER PASSENGER MANIFEST</div></div><div><div class="label">Transfer</div><div class="ref">${escapeHTML(dep.serviceNumber)}</div></div></div><div class="grid"><div class="box"><div class="label">Route</div><div class="value">${escapeHTML(dep.origin)} → ${escapeHTML(dep.destination)}</div></div><div class="box"><div class="label">Pickup</div><div class="value">${escapeHTML(`${dep.date||""} ${dep.scheduled||""}`.trim())}</div></div><div class="box"><div class="label">Vehicle / driver</div><div class="value">${escapeHTML(dep.vehicle)} · ${escapeHTML(dep.driver)}</div></div></div><table><thead><tr><th>SEQ</th><th>Customer</th><th>Booking</th><th>Hotel / drop-off</th><th>Seat</th><th>Acceptance</th><th>Boarding</th><th>Luggage</th></tr></thead><tbody>${list.map((p,i)=>{const st=transferPaxState(dep,p);return `<tr><td>${String(i+1).padStart(3,"0")}</td><td>${escapeHTML(paxName(p))}</td><td>${escapeHTML(p.bookingReference||p.pnrLocator||masterReference())}</td><td>${escapeHTML(p.hotelName||p.payload?.hotelName||dep.destination)}</td><td>${escapeHTML(st.seat||"—")}</td><td>${escapeHTML(humanize(st.acceptance))}</td><td>${escapeHTML(humanize(st.boarding))}</td><td>${st.bags} pc</td></tr>`}).join("")}</tbody></table>`}

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
      if(a==="link-club")linkClub(element.dataset.memberId);
      if(a==="adjust-club")adjustClub(element.dataset.memberId);
      if(a==="check-requirements")checkRequirements();
      if(a==="select-dcs-passenger"){state.dcsSelectedPassengerId=element.dataset.passengerId||"";state.selectedPassengerId=state.dcsSelectedPassengerId;render();}
      if(a==="dcs-checkin")dcsPatch({checkinStatus:"checked_in",boardingStatus:"not_boarded"},"Passenger checked in");
      if(a==="dcs-board")dcsPatch({checkinStatus:"boarded",boardingStatus:"boarded"},"Passenger boarded");
      if(a==="dcs-offload")dcsPatch({checkinStatus:"checked_in",boardingStatus:"offloaded"},"Passenger offloaded");
      if(a==="dcs-noshow")dcsPatch({checkinStatus:"no_show",boardingStatus:"not_boarded"},"Passenger marked no-show");
      if(a==="dcs-bag")openBagModal();
      if(a==="dcs-seat")openSeatModal();
      if(a==="dcs-boarding-pass")printBoardingPass();
      if(a==="dcs-bagtag")printBagTag();
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
      if(a==="transfer-luggage-tag")printTransferLuggageTag();
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
    });
  };

  function bindEnterpriseEvents(){
    if(["packagebuilder","club","departure","manifests"].includes(state.activeView)){
      document.querySelectorAll('[data-view]',main).forEach(b=>{if(b.dataset.enterpriseBound)return;b.dataset.enterpriseBound="1";b.addEventListener("click",()=>navigate(b.dataset.view));});
    }
    document.querySelectorAll('[data-action]',main).forEach(b=>bindAction(b));
    document.querySelectorAll('[data-manifest-mode]',main).forEach(b=>b.addEventListener("click",()=>{state.manifestMode=b.dataset.manifestMode;render()}));
    document.querySelectorAll('[data-transfer-dcs-tab]',main).forEach(b=>b.addEventListener("click",()=>{state.transferDcsTab=b.dataset.transferDcsTab||"departures";render()}));
    const transferScanner=document.getElementById("transferScannerInput");if(transferScanner)transferScanner.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();transferScan();}});
    const acceptanceFilter=document.getElementById("transferAcceptanceFilter");if(acceptanceFilter)acceptanceFilter.addEventListener("change",()=>{const v=acceptanceFilter.value;document.querySelectorAll('tr[data-transfer-status]',main).forEach(r=>r.classList.toggle('hidden',v!=="ALL"&&r.dataset.transferStatus!==v));});
    const inv=document.getElementById("inventoryFilter");if(inv)inv.addEventListener("input",()=>{const q=inv.value.toLowerCase();const items=(state.inventory||[]).filter(i=>JSON.stringify(i).toLowerCase().includes(q));const table=document.getElementById("enterpriseInventoryTable");if(table){table.innerHTML=enterpriseInventoryMarkup(items);table.querySelectorAll('[data-action]').forEach(bindAction)}});
    document.getElementById("clubPassenger")?.addEventListener("change",e=>{state.selectedPassengerId=e.target.value;state.clubSearchResults=[];render()});
    document.getElementById("reqPassenger")?.addEventListener("change",e=>{state.selectedPassengerId=e.target.value;state.travelDecision=null;render()});
  }

  function savePackage(){const b=booking();if(!b?.id)return;const type=$("#packageBookingType")?.value||bookingType();const transferControl=$("#packageTransferControl")?.value||"SKANDI";post("ALTEA_UPDATE_BOOKING",{bookingId:b.id,patch:{bookingType:type,tripTitle:$("#packageTitle")?.value||"",transferControl,startDate:$("#packageStart")?.value||"",endDate:$("#packageEnd")?.value||"",packageStatus:$("#packageStatus")?.value||"DRAFT"}})}
  function searchClub(){const p=selectedPax()||passengers().find(x=>x.id===state.selectedPassengerId);post("ALTEA_CLUB_SEARCH",{query:$("#clubSearch")?.value||"",passengerId:$("#clubPassenger")?.value||p?.id||"",bookingId:booking()?.id})}
  function linkClub(memberId){const passengerId=$("#clubPassenger")?.value||state.selectedPassengerId;if(!passengerId||!memberId)return;post("ALTEA_CLUB_LINK_MEMBER",{bookingId:booking()?.id,passengerId,memberId})}
  function adjustClub(memberId){const delta=Number($("#clubPointsDelta")?.value);const reason=$("#clubPointsReason")?.value.trim();if(!Number.isFinite(delta)||!delta)return toast("Points amount required","Enter a non-zero whole-number adjustment.","warning");if(!reason)return toast("Reason required","Enter an audit reason for the points adjustment.","warning");post("ALTEA_CLUB_ADJUST_POINTS",{memberId,passengerId:state.selectedPassengerId,bookingId:booking()?.id,delta:Math.trunc(delta),reason})}
  function checkRequirements(){const passengerId=$("#reqPassenger")?.value||state.selectedPassengerId;state.travelDecision=null;post("ALTEA_TRAVEL_REQUIREMENTS_CHECK",{bookingId:booking()?.id,passengerId,nationality:$("#reqNationality")?.value||"",residenceCountry:$("#reqResidence")?.value||"",dateOfBirth:$("#reqDob")?.value||"",origin:$("#reqOrigin")?.value||"",destination:$("#reqDestination")?.value||"",documentType:"PASSPORT",documentIssuingCountry:$("#reqIssue")?.value||"",documentExpiry:$("#reqExpiry")?.value||"",transitPoints:String($("#reqTransit")?.value||"").split(",").map(x=>x.trim().toUpperCase()).filter(Boolean)})}

  function openComponentEditor(id){const c=components().find(x=>x.id===id);if(!c)return;openModal("Edit trip component",`<div class="field"><label>Service</label><input value="${escapeAttr(serviceLabel(c))}" readonly></div><div class="grid grid-3"><div class="field"><label>Service date</label><input id="compDate" type="date" value="${escapeAttr(c.serviceDate||c.startDate||c.payload?.serviceDate||"")}"></div><div class="field"><label>Time / pickup</label><input id="compTime" value="${escapeAttr(c.serviceTime||c.payload?.pickupTime||"")}"></div><div class="field"><label>Passengers</label><input id="compPax" type="number" min="1" value="${escapeAttr(String(c.passengerCount||c.payload?.passengerCount||passengers().length||1))}"></div></div><div class="grid grid-2"><div class="field"><label>Supplier reference</label><input id="compRef" value="${escapeAttr(c.supplierReference||"")}"></div><div class="field"><label>Total amount</label><input id="compAmount" type="number" step="0.01" value="${escapeAttr(String(c.totalAmount||0))}"></div></div><div class="field"><label>Operational notes / pickup instructions</label><textarea id="compNotes">${escapeHTML(c.operationalNotes||c.payload?.operationalNotes||"")}</textarea></div>`,[{label:"Cancel",className:"secondary",close:true},{label:"Save component",className:"primary",onClick:()=>{closeModal();post("ALTEA_UPDATE_COMPONENT",{componentId:id,patch:{serviceDate:$("#compDate")?.value||"",serviceTime:$("#compTime")?.value||"",passengerCount:Number($("#compPax")?.value||1),supplierReference:$("#compRef")?.value||"",totalAmount:Number($("#compAmount")?.value||0),operationalNotes:$("#compNotes")?.value||""}})}}])}

  function dcsPatch(patch,message){const p=selectedPax();if(!p||!isSkandiDcs())return;post("ALTEA_DCS_UPDATE_PASSENGER",{bookingId:booking()?.id,passengerId:p.id,patch});toast("Departure Control",message,"success")}
  function openBagModal(){const p=selectedPax();if(!p||!isSkandiDcs())return;openModal("Record baggage",`<div class="grid grid-2"><div class="field"><label>Pieces</label><input id="bagPieces" type="number" min="0" value="${escapeAttr(String(p.baggageCount||p.payload?.baggageCount||0))}"></div><div class="field"><label>Total weight kg</label><input id="bagWeight" type="number" min="0" step="0.1" value="${escapeAttr(String(p.baggageWeight||p.payload?.baggageWeight||0))}"></div></div>`,[{label:"Cancel",className:"secondary",close:true},{label:"Save baggage",className:"primary",onClick:()=>{const pieces=Number($("#bagPieces")?.value||0),weight=Number($("#bagWeight")?.value||0);closeModal();dcsPatch({baggageCount:pieces,baggageWeight:weight},"Baggage updated")}}])}
  function openSeatModal(){const p=selectedPax();if(!p||!isSkandiDcs())return;openModal("Assign seat",`<div class="field"><label>Seat</label><input id="dcsSeat" maxlength="5" value="${escapeAttr(p.seatNumber||"")}" placeholder="12A"></div>`,[{label:"Cancel",className:"secondary",close:true},{label:"Assign",className:"primary",onClick:()=>{const seat=String($("#dcsSeat")?.value||"").toUpperCase().trim();if(!seat)return;closeModal();dcsPatch({seatNumber:seat},`Seat ${seat} assigned`)}}])}

  const generatedPrintRequests=new Map();

  function generatedDocumentTitle(type,component=null,passenger=null){
    const t=String(type||"").toUpperCase();
    if(t==="BOOKING_CONFIRMATION")return `Booking Confirmation ${masterReference()}`;
    if(t==="INVOICE")return `Invoice ${masterReference()}`;
    if(t==="BOARDING_PASS"||t==="BOARDING_CARD")return `Boarding Pass ${passenger?paxName(passenger):masterReference()}`;
    if(t==="BAG_TAG"||t==="BAGGAGE_TAG")return `Baggage Tag ${passenger?paxName(passenger):masterReference()}`;
    if(t.includes("TRANSFER"))return `Transfer Ticket ${masterReference()}`;
    if(t.includes("TOUR")||t.includes("ACTIVITY")||t.includes("EXCURSION"))return `Tour Ticket ${masterReference()}`;
    return `${component?serviceLabel(component):"SKANDI Document"} ${masterReference()}`;
  }

  function requestGeneratedPrint(action,payload,title){
    const requestId=post(action,payload);
    if(requestId)generatedPrintRequests.set(requestId,{title:title||"SKANDI Travel Document",createdAt:Date.now()});
    return requestId;
  }

  function printGeneratedHtml(title,html){
    const source=String(html||"");
    if(!source.trim()){
      toast("Document unavailable","The canonical document renderer returned no printable HTML.","danger");
      return;
    }
    const frame=document.createElement("iframe");
    frame.style.position="fixed";
    frame.style.right="0";
    frame.style.bottom="0";
    frame.style.width="1px";
    frame.style.height="1px";
    frame.style.border="0";
    frame.style.opacity="0";
    frame.setAttribute("aria-hidden","true");
    document.body.appendChild(frame);
    const doc=frame.contentDocument;
    doc.open();
    doc.write(source);
    doc.close();
    const trigger=()=>{
      try{
        if(frame.contentDocument?.title===undefined)return;
        if(title&&!frame.contentDocument.title)frame.contentDocument.title=title;
        frame.contentWindow.focus();
        frame.contentWindow.print();
      }finally{
        setTimeout(()=>frame.remove(),1800);
      }
    };
    setTimeout(trigger,350);
  }

  function printCanonicalGeneratedDocument(message,payload={}){
    const requestId=message?.requestId||"";
    const pending=requestId?generatedPrintRequests.get(requestId):null;
    if(requestId)generatedPrintRequests.delete(requestId);
    if(!pending)return;
    const html=payload.assetUpload?.content||payload.renderedHtml||payload.html||"";
    if(!html){
      toast("Document generated","The document was created, but no printable payload was returned to the ALTEA screen.","warning");
      return;
    }
    printGeneratedHtml(pending.title,html);
  }

  function generateBookingDocument(type){
    const b=booking();
    if(!b?.id)return;
    const t=String(type||"").toUpperCase();
    if(t==="ITINERARY"){
      toast("Trip itinerary","Use Booking Confirmation for the approved combined itinerary document. A separate itinerary renderer is not configured.","info");
      return;
    }
    requestGeneratedPrint("ALTEA_GENERATE_DOCUMENT",{bookingId:b.id,documentType:t,bookingReference:masterReference()},generatedDocumentTitle(t));
  }
  function sendBookingDocument(type){if(!booking()?.id)return;post("ALTEA_SEND_DOCUMENT",{bookingId:booking().id,documentType:type,bookingReference:masterReference(),recipient:booking().customerEmail||""})}
  function sendComponentVoucher(id){const c=components().find(x=>x.id===id);if(!c)return;post("ALTEA_SEND_DOCUMENT",{bookingId:booking()?.id,componentId:id,documentType:"VOUCHER",bookingReference:masterReference(),recipient:booking()?.customerEmail||""})}

  function printBookingConfirmation(){generateBookingDocument("BOOKING_CONFIRMATION")}
  function printComponentVoucher(id){
    const c=components().find(x=>x.id===id);
    if(!c||!booking()?.id)return;
    const ct=String(c.componentType||c.entityType||c.component_type||"").toUpperCase();
    const docType=ct.includes("TRANSFER")?"TRANSFER_TICKET":(ct.includes("TOUR")||ct.includes("ACTIVITY")||ct.includes("EXCURSION")||ct.includes("GUIDED"))?"TOUR_TICKET":"VOUCHER";
    requestGeneratedPrint("ALTEA_GENERATE_DOCUMENT",{bookingId:booking().id,componentId:id,documentType:docType,bookingReference:masterReference()},generatedDocumentTitle(docType,c));
  }
  function printPassengerManifest(){printHtml(`Passenger Manifest ${masterReference()}`,passengerManifestHtml())}

  function findFlightSegment(){
    const segs=workspace()?.segments||[];
    return segs.find(s=>String(s.segmentType||s.segment_type||s.type||"").toUpperCase().includes("FLIGHT"))||segs[0]||null;
  }
  function existingBcbpPayload(passenger,segment){
    const pp=passenger?.payload||{},sp=segment?.payload||{},bp=booking()?.payload||{};
    return String(pp.bcbpPayload||pp.bcbp_payload||sp.bcbpPayload||sp.bcbp_payload||sp.bcbp||bp.bcbpPayload||bp.bcbp_payload||"").trim();
  }
  function issueBoardingPassWithPayload(p,bcbpPayload){
    const segment=findFlightSegment();
    const docNo=`BP-${masterReference()}-${p.sequenceNumber||passengers().indexOf(p)+1}`;
    requestGeneratedPrint("ALTEA_DCS_RECORD_DOCUMENT",{bookingId:booking()?.id,passengerId:p.id,segmentId:segment?.id||"",documentType:"BOARDING_PASS",documentNumber:docNo,bcbpPayload:String(bcbpPayload||"").trim()},generatedDocumentTitle("BOARDING_PASS",null,p));
  }
  function printBoardingPass(){
    const p=selectedPax();
    if(!p||!isSkandiDcs())return;
    const existing=existingBcbpPayload(p,findFlightSegment());
    if(existing){issueBoardingPassWithPayload(p,existing);return;}
    openModal("Authoritative BCBP payload",`<div class="alert info"><div><strong>IATA BCBP required</strong>Paste the Format-M payload produced by the SKANDI DCS for this checked-in passenger. ALTEA will not fabricate airline boarding data.</div></div><div class="field"><label>BCBP Format-M payload</label><textarea id="dcsBcbpPayload" rows="6" class="mono" placeholder="M1..."></textarea></div>`,[{label:"Cancel",className:"secondary",close:true},{label:"Issue boarding pass",className:"primary",onClick:()=>{const value=String($("#dcsBcbpPayload")?.value||"").trim();if(!/^M[1-4]/.test(value))return toast("BCBP required","Enter an authoritative IATA Format-M payload beginning M1, M2, M3 or M4.","warning");closeModal();issueBoardingPassWithPayload(p,value)}}]);
  }

  function issueBagTag(p,licensePlate,pieceNumber=1,pieceCount=1,weightKg=0){
    const docNo=`BAG-${licensePlate}-${String(pieceNumber).padStart(2,"0")}`;
    requestGeneratedPrint("ALTEA_DCS_RECORD_DOCUMENT",{bookingId:booking()?.id,passengerId:p.id,segmentId:findFlightSegment()?.id||"",documentType:"BAG_TAG",documentNumber:docNo,licensePlate,weightKg:Number(weightKg||0),pieceNumber:Number(pieceNumber||1),pieceCount:Number(pieceCount||1)},generatedDocumentTitle("BAG_TAG",null,p));
  }
  function printBagTag(){
    const p=selectedPax();
    if(!p||!isSkandiDcs())return;
    const pp=p.payload||{};
    const existing=String(pp.baggageLicensePlate||pp.baggageTagLicensePlate||"").replace(/\D/g,"");
    const defaultPieces=Math.max(1,Number(p.baggageCount||pp.baggageCount||1));
    const defaultWeight=Math.max(0,Number(p.baggageWeight||pp.baggageWeight||0));
    if(/^\d{10}$/.test(existing)){issueBagTag(p,existing,1,defaultPieces,defaultWeight);return;}
    openModal("Issue IATA baggage tag",`<div class="alert info"><div><strong>Operational baggage licence plate required</strong>Enter the real 10-digit baggage licence plate assigned by DCS. SKANDI will not invent an operational tag number.</div></div><div class="grid grid-3"><div class="field span-2"><label>10-digit licence plate</label><input id="bagLicensePlate" inputmode="numeric" maxlength="10" placeholder="0016111111"></div><div class="field"><label>Piece</label><input id="bagPieceNumber" type="number" min="1" value="1"></div><div class="field"><label>Total pieces</label><input id="bagPieceCount" type="number" min="1" value="${escapeAttr(String(defaultPieces))}"></div><div class="field"><label>Weight kg</label><input id="bagIssueWeight" type="number" min="0" step="0.1" value="${escapeAttr(String(defaultWeight))}"></div></div>`,[{label:"Cancel",className:"secondary",close:true},{label:"Issue bag tag",className:"primary",onClick:()=>{const plate=String($("#bagLicensePlate")?.value||"").replace(/\D/g,"");if(!/^\d{10}$/.test(plate))return toast("10 digits required","Enter the actual 10-digit baggage licence plate assigned by DCS.","warning");const piece=Math.max(1,Number($("#bagPieceNumber")?.value||1));const count=Math.max(piece,Number($("#bagPieceCount")?.value||1));const weight=Math.max(0,Number($("#bagIssueWeight")?.value||0));closeModal();issueBagTag(p,plate,piece,count,weight)}}]);
  }

  function basePrintStyles(){return `body{font-family:Arial,sans-serif;color:#111;margin:28px;font-size:12px}.head{display:flex;justify-content:space-between;border-bottom:3px solid #022e64;padding-bottom:12px;margin-bottom:18px}.brand{font-size:24px;font-weight:800;color:#022e64}.ref{font:800 22px Consolas,monospace;letter-spacing:.08em}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.box{border:1px solid #bbb;padding:9px}.label{font-size:9px;text-transform:uppercase;color:#666}.value{font-weight:700;margin-top:3px}table{width:100%;border-collapse:collapse;margin-top:14px}th,td{border:1px solid #bbb;padding:7px;text-align:left}th{background:#eef1f4}.section{font-size:15px;font-weight:800;color:#022e64;margin-top:18px}.muted{color:#666}.barcode{height:48px;background:repeating-linear-gradient(90deg,#000 0,#000 2px,#fff 2px,#fff 4px,#000 4px,#000 5px,#fff 5px,#fff 8px)}@page{margin:12mm}`}
  function bookingConfirmationHtml(){const b=booking(),comps=components();return `<div class="head"><div><div class="brand">SKANDI TRAVELS</div><div>Booking confirmation</div></div><div><div class="label">Booking reference</div><div class="ref">${escapeHTML(masterReference())}</div></div></div><div class="grid"><div class="box"><div class="label">Lead customer</div><div class="value">${escapeHTML(b?.customerName||"—")}</div></div><div class="box"><div class="label">Trip type</div><div class="value">${escapeHTML(humanize(bookingType()))}</div></div><div class="box"><div class="label">Total</div><div class="value">${money(packageTotal(),b?.currency)}</div></div></div><div class="section">Travelers</div><table><thead><tr><th>#</th><th>Name</th><th>Type</th><th>SKANDI Club</th></tr></thead><tbody>${passengers().map((p,i)=>`<tr><td>${i+1}</td><td>${escapeHTML(paxName(p))}</td><td>${escapeHTML(p.paxType||"ADT")}</td><td>${escapeHTML(clubFor(p)?.memberNumber||"—")}</td></tr>`).join("")}</tbody></table><div class="section">Trip components</div><table><thead><tr><th>Type</th><th>Service</th><th>Supplier</th><th>Reference</th><th>Status</th></tr></thead><tbody>${airPrintRow()}${comps.map(c=>`<tr><td>${escapeHTML(humanize(c.componentType||c.entityType))}</td><td>${escapeHTML(serviceLabel(c))}</td><td>${escapeHTML(c.supplier||"SKANDI")}</td><td>${escapeHTML(c.supplierReference||"—")}</td><td>${escapeHTML(c.status||"")}</td></tr>`).join("")}</tbody></table><p class="muted">Supplier references remain part of the booking for servicing even when the customer uses the SKANDI master reference above.</p>`}
  function airPrintRow(){const b=booking();if(!(state.selectedOrder||b?.supplierOrderId||b?.origin))return "";return `<tr><td>Flight</td><td>${escapeHTML([b.origin,b.destination].filter(Boolean).join(" → ")||state.selectedOrder?.route||"Air itinerary")}</td><td>${escapeHTML(b.supplier||"Duffel / airline")}</td><td>${escapeHTML(b.supplierBookingReference||state.selectedOrder?.bookingReference||"—")}</td><td>${escapeHTML(b.status||state.selectedOrder?.status||"")}</td></tr>`}
  function componentVoucherHtml(c){return `<div class="head"><div><div class="brand">SKANDI TRAVELS</div><div>${escapeHTML(humanize(c.componentType||c.entityType))} voucher</div></div><div><div class="label">Booking reference</div><div class="ref">${escapeHTML(masterReference())}</div></div></div><div class="section">${escapeHTML(serviceLabel(c))}</div><div class="grid"><div class="box"><div class="label">Supplier</div><div class="value">${escapeHTML(c.supplier||"SKANDI")}</div></div><div class="box"><div class="label">Supplier reference</div><div class="value">${escapeHTML(c.supplierReference||"—")}</div></div><div class="box"><div class="label">Status</div><div class="value">${escapeHTML(c.status||"")}</div></div><div class="box"><div class="label">Date / time</div><div class="value">${escapeHTML(c.serviceDate||c.startDate||c.payload?.pickupTime||"—")}</div></div><div class="box"><div class="label">Passengers</div><div class="value">${escapeHTML(String(c.passengerCount||c.payload?.passengerCount||passengers().length))}</div></div><div class="box"><div class="label">Amount</div><div class="value">${money(c.totalAmount,c.currency||booking()?.currency)}</div></div></div><div class="section">Travelers</div><p>${passengers().map(p=>escapeHTML(paxName(p))).join(" · ")}</p><div class="section">Instructions</div><p>${escapeHTML(c.operationalNotes||c.payload?.operationalNotes||c.description||"Present this voucher together with the booking reference where requested.")}</p>`}
  function passengerManifestHtml(){return `<div class="head"><div><div class="brand">SKANDI TRAVELS</div><div>Passenger manifest</div></div><div><div class="label">Booking reference</div><div class="ref">${escapeHTML(masterReference())}</div></div></div><table><thead><tr><th>SEQ</th><th>Passenger</th><th>Type</th><th>Seat</th><th>APIS</th><th>Check-in</th><th>Boarding</th><th>Bags</th></tr></thead><tbody>${passengers().map((p,i)=>`<tr><td>${escapeHTML(p.sequenceNumber||String(i+1).padStart(3,"0"))}</td><td>${escapeHTML(paxName(p))}</td><td>${escapeHTML(p.paxType||"ADT")}</td><td>${escapeHTML(p.seatNumber||"—")}</td><td>${escapeHTML(p.apisStatus||"—")}</td><td>${escapeHTML(p.checkinStatus||"—")}</td><td>${escapeHTML(p.boardingStatus||p.payload?.boardingStatus||"—")}</td><td>${escapeHTML(String(p.baggageCount||p.payload?.baggageCount||0))}</td></tr>`).join("")}</tbody></table>`}
  function boardingPassHtml(p,docNo){const b=booking();return `<div style="border:2px solid #111;padding:18px"><div class="head"><div><div class="brand">SKANDI TRAVELS</div><div>BOARDING PASS · SKANDI CHARTER</div></div><div class="ref">${escapeHTML(masterReference())}</div></div><div style="font-size:24px;font-weight:800;margin:18px 0">${escapeHTML(paxName(p))}</div><div class="grid"><div class="box"><div class="label">From</div><div class="value" style="font-size:22px">${escapeHTML(b?.origin||"—")}</div></div><div class="box"><div class="label">To</div><div class="value" style="font-size:22px">${escapeHTML(b?.destination||"—")}</div></div><div class="box"><div class="label">Seat</div><div class="value" style="font-size:22px">${escapeHTML(p.seatNumber||"—")}</div></div><div class="box"><div class="label">Flight</div><div class="value">${escapeHTML(b?.flightNumber||b?.payload?.flightNumber||"SKANDI")}</div></div><div class="box"><div class="label">Date</div><div class="value">${escapeHTML(b?.departureDate||b?.startDate||"—")}</div></div><div class="box"><div class="label">Sequence</div><div class="value">${escapeHTML(p.sequenceNumber||String(passengers().indexOf(p)+1).padStart(3,"0"))}</div></div></div><div class="barcode" style="margin-top:18px"></div><div class="muted" style="margin-top:5px">${escapeHTML(docNo)} · Valid only for a SKANDI-controlled charter departure recorded in ALTEA.</div></div>`}
  function bagTagHtml(p,tag){const b=booking();return `<div style="border:2px solid #111;padding:15px;width:680px;max-width:100%"><div style="display:flex;justify-content:space-between;align-items:start"><div><div class="brand">SKANDI</div><div class="muted">BAGGAGE TAG · CHARTER DCS</div></div><div class="ref">${escapeHTML(tag)}</div></div><div style="font-size:46px;font-weight:900;letter-spacing:.08em;margin:14px 0">${escapeHTML(b?.destination||"—")}</div><div class="grid"><div class="box"><div class="label">Passenger</div><div class="value">${escapeHTML(paxName(p))}</div></div><div class="box"><div class="label">From</div><div class="value">${escapeHTML(b?.origin||"—")}</div></div><div class="box"><div class="label">Flight / Date</div><div class="value">${escapeHTML(b?.flightNumber||b?.payload?.flightNumber||"SKANDI")} · ${escapeHTML(b?.departureDate||"—")}</div></div></div><div class="barcode" style="margin-top:14px"></div><div class="ref" style="text-align:center;margin-top:5px">${escapeHTML(tag)}</div></div>`}
  function printHtml(title,body){const frame=document.createElement("iframe");frame.style.position="fixed";frame.style.right="0";frame.style.bottom="0";frame.style.width="1px";frame.style.height="1px";frame.style.border="0";frame.style.opacity="0";document.body.appendChild(frame);const doc=frame.contentDocument;doc.open();doc.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHTML(title)}</title><style>${basePrintStyles()}</style></head><body>${body}</body></html>`);doc.close();setTimeout(()=>{try{frame.contentWindow.focus();frame.contentWindow.print()}finally{setTimeout(()=>frame.remove(),1200)}},120)}

  async function persistGeneratedAsset(payload={}){
    const assetUpload=payload.assetUpload;
    if(!assetUpload?.requestId||!assetUpload?.upload?.signedUrl)return;
    try{
      toast("Saving document","Storing the generated file in the private SKANDI Asset Library…","info");
      const response=await fetch(assetUpload.upload.signedUrl,{
        method:"PUT",
        headers:{
          "content-type":assetUpload.mimeType||"text/html",
          "cache-control":`max-age=${assetUpload.upload.cacheControl||3600}`,
          "x-upsert":"false"
        },
        body:assetUpload.content||""
      });
      if(!response.ok)throw new Error(`Asset Library upload failed (${response.status}).`);
      post("ALTEA_FINALIZE_GENERATED_ASSET",{
        requestId:assetUpload.requestId,
        documentId:assetUpload.documentId||payload.document?.id||"",
        manifestId:assetUpload.manifestId||payload.manifest?.id||"",
        bookingId:payload.workspace?.booking?.id||booking()?.id||""
      });
    }catch(error){
      toast("Document storage failed",error.message||"The generated file could not be stored in Asset Library.","danger");
    }
  }

  window.addEventListener("message",event=>{
    if(event.source!==window.parent)return;const m=event.data||{};if(m.source!==PARENT_SOURCE)return;const p=m.payload||{};
    if(m.type==="ALTEA_UNIFIED_BOOTSTRAP_RESULT"){state.travelRequirementsProvider=p.travelRequirementsProvider||p.timaticProvider||state.travelRequirementsProvider||null;if(Array.isArray(p.transferDepartures))state.transferDcsDepartures=p.transferDepartures;state.transferDcsPersistence=Boolean(p.transferDcsPersistence||p.capabilities?.transferDcsPersistence||p.capabilities?.transferDcs);}
    if(m.type==="ALTEA_TRANSFER_DCS_BOOTSTRAP_RESULT"){state.transferDcsDepartures=Array.isArray(p.departures)?p.departures:[];state.transferDcsPersistence=Boolean(p.persistenceAvailable??true);if(state.activeView==="departure"||state.activeView==="baggage")render();}
    if(m.type==="ALTEA_TRANSFER_DCS_PASSENGER_UPDATED"||m.type==="ALTEA_TRANSFER_DCS_DEPARTURE_UPDATED"){if(p.workspace)state.alteaWorkspace=p.workspace;if(Array.isArray(p.departures))state.transferDcsDepartures=p.departures;if(state.activeView==="departure"||state.activeView==="baggage")render();}
    if(m.type==="ALTEA_BOOKING_RESULT"||m.type==="ALTEA_LOCAL_BOOKING_CREATED"||m.type==="ALTEA_BOOKING_UPDATED"||m.type==="ALTEA_DCS_PASSENGER_UPDATED"){if(p.workspace){state.alteaWorkspace=p.workspace;if(p.workspace.booking)upsertAlteaBooking(p.workspace.booking)}if(["booking","packagebuilder","departure","manifests"].includes(state.activeView))render();}
    if(m.type==="ALTEA_CLUB_SEARCH_RESULT"){state.clubSearchResults=p.members||p.items||[];if(state.activeView==="club")render();}
    if(m.type==="ALTEA_CLUB_MEMBER_LINKED"||m.type==="ALTEA_CLUB_MEMBER_UPDATED"){const passengerId=p.passengerId||state.selectedPassengerId;if(passengerId&&p.member)state.clubProfiles[passengerId]=p.member;if(p.workspace)state.alteaWorkspace=p.workspace;state.clubSearchResults=[];if(state.activeView==="club"||state.activeView==="passengers")render();toast("SKANDI Club updated",p.message||"Passenger loyalty profile updated.","success")}
    if(m.type==="ALTEA_TRAVEL_REQUIREMENTS_RESULT"){state.travelDecision=p.decision||p.result||p;state.travelRequirementsProvider=p.provider||state.travelRequirementsProvider;if(p.workspace)state.alteaWorkspace=p.workspace;if(state.activeView==="requirements")render();}
    if(m.type==="ALTEA_DOCUMENT_GENERATED"){if(p.document)state.generatedDocuments.unshift(p.document);if(p.workspace)state.alteaWorkspace=p.workspace;if(state.activeView==="ticketing")render();toast("Document generated",p.document?.documentType||"SKANDI document created.","success");printCanonicalGeneratedDocument(m,p);persistGeneratedAsset(p)}
    if(m.type==="ALTEA_DOCUMENT_SENT"){toast("Delivery",p.message||"The document workflow was recorded in booking history.","success")}
    if(m.type==="ALTEA_MANIFEST_SENT"){toast("Manifest generated",p.message||"The manifest was generated and recorded.","success");persistGeneratedAsset(p)}
    if(m.type==="ALTEA_DCS_DOCUMENT_RECORDED"){if(p.workspace)state.alteaWorkspace=p.workspace;printCanonicalGeneratedDocument(m,p);persistGeneratedAsset(p)}
    if(m.type==="ALTEA_GENERATED_ASSET_FINALIZED"){if(p.workspace)state.alteaWorkspace=p.workspace;if(state.activeView==="ticketing"||state.activeView==="manifests")render();toast("Asset Library","Generated file stored in the private SKANDI Asset Library.","success")}
  });

  post("ALTEA_ENTERPRISE_MODULE_READY",{version:ENTERPRISE_VERSION,capabilities:["master_booking","skandi_club","package_charter","documents_vouchers","travel_requirements_adapter","transfer_departure_control","manifests"]},{busy:false});
})();
</script>

</body>
</html>
