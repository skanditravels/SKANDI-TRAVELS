# INFO / LOG — OPS CONTROL

- Source file: `/HTML_REF/altea/OPS Control.md`.
- Display name/system: OPS Control / ALTEA.
- System area: `ALTEA`.
- Wix page: `/src/pages/OPS Control.uposx.js`.
- Route: `/riaintra/success-factors/altea/ops`, owned by `public/siteMap.SITE_MAP.opsControl`.
- Wix HTML element: current controller retains the established candidates `#opsControlEmbed`, `#occEmbed`, `#htmlOpsControl`; exact published element ID requires live Wix verification.
- Page mode: `APP_VIEWPORT_ALTEA` — ALTEA 48px global header/footer family only, main app region `calc(100vh - 48px)`, HTML component 100% W/H, app owns workspace scrolling.
- Canonical backend facade: `/src/backend/SKANDI_CORE/opsControl.web.js`.
- Canonical backend core: `/src/backend/SKANDI_CORE/opsControl.js`.
- Canonical transport: `/src/backend/SKANDI_CORE/supabaseServer.js`.
- Authentication/authorization: Wix Members → `staffAuth.web` / `staffAuth`; OPS access requires established operations/OCC/manager/system-admin authorization. Write actions require management/OCC/system-admin authority and are rechecked server-side.
- Supabase resources verified 2026-10-14: `agent_users`, `roster_shifts`, `roster_clock_events`, `roster_time_ledger`, `schedule_change_requests`, `time_off_balances`, `vacation_sick_leave_ledger`, `crew_assignments`, `driver_assignments`, `tour_assignments`, `airport_duty_assignments`, `vehicle_assignments`, `hr_base_jurisdictions`, `altea_sync_events`.
- External provider dependencies: none directly from the embed. OPS consumes normalized canonical operational data already stored through SKANDI systems.
- Message contract: HTML → page `OPS_READY`, `OPS_BOOTSTRAP_REQUEST`, `OPS_REFRESH`, `OPS_ACTION`, `OPS_LOGOUT`; page → HTML `OPS_BOOTSTRAP`, `OPS_ACTION_RESULT`, `OPS_ERROR`.
- Operational ownership: OPS is the unified workforce/operations control surface. It does not create a second staff, roster, assignment, leave, compliance, communications or ALTEA data model. GroupTalk remains the owner of operational messaging. Mail remains the owner of internal company mail.
- Status: **STATICALLY VERIFIED — REQUIRES LIVE TEST**.
- Source-of-truth provenance: no current OPS Control HTML_REF file was present in GitHub `main`; the user-supplied `Pasted text(20261014-174931).txt` is the authoritative HTML input for this V12 convergence.
- Last verified date: 2026-10-14.

## Change log

- 2026-10-14 — Established the complete OPS Control HTML_REF from the supplied embed and current GitHub route/controller evidence.
- 2026-10-14 — Replaced the incorrect `opsControl.web.js` content (which contained the customer-profile facade) with the canonical OPS web-method boundary.
- 2026-10-14 — Repaired `opsControl.js` bootstrap so every referenced workforce/roster/assignment/compliance source is actually loaded before projection; preserved existing action names and server-side write authorization.
- 2026-10-14 — Added read-only ALTEA synchronization audit projection and operational logistics projection from existing assignment tables. GroupTalk messaging remains independently permissioned and is not bulk-exposed through OPS.
- 2026-10-14 — Converged the embed to `APP_VIEWPORT_ALTEA`: removed content-height mutation, restored pinch zoom, added 16px mobile form-control protection, and added a one-minute visible-page bootstrap refresh.
- 2026-10-14 — Added OPS Control to the global V12 page settings register at the confirmed `/riaintra/success-factors/altea/ops` route.

## COMPLETE HTML / SOURCE IMPLEMENTATION

```html
<!DOCTYPE html>
<!--
  SKANDI OPS — Wix Component Viewport Configuration

  - Component Type: Custom Element or HTML/IFrame Embed.
  - Initial Height Setting: Set to at least 900px to accommodate the dashboard layout on load without clipping.
  - Scrolling Property: Set to Disabled / No Scrolling, allowing the dynamic iframe resize script to handle bounds naturally.
  - Container Styling: Ensure the parent section/strip in Wix is set to Auto-fit content or a flexible height layout so it expands downward when side drawers or the open time tray are toggled.

  Data contract: the embed contains no operational sample data. Wix supplies the
  canonical OPS_BOOTSTRAP payload and persists every OPS_ACTION mutation.
-->
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>SKANDI OPS Control | Global Workforce</title>
  
  <style>
    :root {
      /* Base Dark Theme (Classic Jeppesen) */
      --j-bg: #15181f;
      --j-surface: #1f242d;
      --j-surface-hover: #292f3d;
      --j-header: #191c24;
      --j-border: #313846;
      --j-border-light: #454f63;
      --j-text-main: #d4d8e2;
      --j-text-muted: #828b9c;
      --j-accent: #2e75b6;
      --j-accent-hover: #468cd1;
      
      --bar-flight: #8e44ad;     /* Purple */
      --bar-duty: #27ae60;       /* Green */
      --bar-sby: #f39c12;        /* Yellow */
      --bar-rest: #7f8c8d;       /* Gray */
      --bar-vacation: #16a085;   /* Teal / Vacation */
      --bar-disruption: #c0392b; /* Red */

      --topbar-bg: #0d0f14;
      --sidebar-bg: #12151c;
      
      --font-stack: "Inter", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      --hour-px: 7.5px;
    }

    /* High Contrast / Lufthansa NetLine Day Mode */
    body.theme-high-contrast {
      --j-bg: #e2e8f0;             
      --j-surface: #ffffff;        
      --j-surface-hover: #f1f5f9;  
      --j-header: #f8fafc;         
      --j-border: #cbd5e1;         
      --j-border-light: #e2e8f0;   
      --j-text-main: #0f172a;      
      --j-text-muted: #475569;     
      --j-accent: #0284c7;         
      --j-accent-hover: #0369a1;   

      --bar-flight: #2563eb;       /* Blue for Flights/Tours */
      --bar-duty: #94a3b8;         /* Gray for Duties/Transfers */
      --bar-sby: #84cc16;          /* Green for Standby */
      --bar-rest: #eab308;         /* Yellow for Rest */
      --bar-vacation: #10b981;     /* Emerald for Vacation */
      --bar-disruption: #dc2626;   /* Red for Disruption */

      --topbar-bg: #1e293b;        
      --sidebar-bg: #334155;       
    }

    * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
    
    html, body { width: 100%; height: 100%; min-height: 0; overflow: hidden; }

    body {
      font-family: var(--font-stack);
      background-color: var(--j-bg);
      color: var(--j-text-main);
      font-size: 11px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      min-height: 0;
      height: 100%;
      transition: background-color 0.3s, color 0.3s;
    }

    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ::-webkit-scrollbar-track { background: var(--j-bg); }
    ::-webkit-scrollbar-thumb { background: #4a5568; border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: #718096; }

    .topbar {
      display: flex; align-items: center; justify-content: space-between;
      height: 52px; background-color: var(--topbar-bg); border-bottom: 1px solid #000;
      padding: 0 16px; flex-shrink: 0; z-index: 100; box-shadow: 0 2px 6px rgba(0,0,0,0.6);
      transition: background-color 0.3s;
    }
    .brand { display: flex; align-items: center; gap: 12px; }
    .brand-logo { color: #f59e0b; font-weight: 900; font-size: 16px; font-style: italic; letter-spacing: -0.5px; }
    .brand-text { font-size: 13px; font-weight: 600; color: #fff; }
    .brand-sub { color: #94a3b8; font-weight: 400; font-size: 11px; border-left: 1px solid #475569; padding-left: 10px; }
    
    .top-actions { display: flex; align-items: center; gap: 8px; margin-left: auto; }
    .icon-btn {
      background: transparent; border: 1px solid transparent; color: #cbd5e1;
      font-size: 16px; cursor: pointer; width: 34px; height: 34px; border-radius: 4px;
      transition: 0.2s; display: grid; place-items: center; position: relative;
    }
    .icon-btn:hover { background: rgba(255,255,255,0.1); color: #fff; }
    .badge-dot {
      position: absolute; top: 6px; right: 6px; width: 6px; height: 6px;
      background: #ef4444; border-radius: 50%;
    }

    .app-layout { display: flex; flex: 1; overflow: hidden; position: relative; }
    
    .icon-sidebar {
      width: 52px; background-color: var(--sidebar-bg); border-right: 1px solid var(--j-border);
      display: flex; flex-direction: column; align-items: center; padding-top: 12px; gap: 8px; flex-shrink: 0; z-index: 50;
      transition: background-color 0.3s;
    }
    .nav-icon {
      font-size: 18px; color: #94a3b8; cursor: pointer; padding: 10px;
      border-radius: 6px; transition: 0.2s; display: flex; justify-content: center; align-items: center; width: 40px; height: 40px;
    }
    .nav-icon:hover { background-color: rgba(255,255,255,0.1); color: #fff; }
    .nav-icon.active { background-color: rgba(2, 132, 199, 0.2); color: #38bdf8; border-left: 3px solid #38bdf8; border-radius: 0 6px 6px 0; }
    .nav-icon.bottom { margin-top: auto; margin-bottom: 16px; }

    .view-container { flex: 1; display: none; flex-direction: column; min-width: 0; position: relative; }
    .view-container.active { display: flex; }

    .view-toolbar {
      display: flex; align-items: center; justify-content: space-between; padding: 12px 16px;
      background-color: var(--j-surface); border-bottom: 1px solid var(--j-border);
      flex-wrap: wrap; gap: 10px; z-index: 20; transition: 0.3s;
    }
    .view-title { font-size: 16px; font-weight: 600; color: var(--j-text-main); display: flex; align-items: center; gap: 8px; }
    
    .toolbar-actions { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
    .btn {
      background: var(--j-header); border: 1px solid var(--j-border-light); color: var(--j-text-main);
      padding: 6px 12px; border-radius: 4px; font-size: 11px; font-weight: 600; cursor: pointer; transition: 0.2s;
      display: flex; align-items: center; gap: 6px;
    }
    .btn:hover { background: var(--j-surface-hover); color: var(--j-accent); border-color: var(--j-text-muted); }
    .btn.primary { background: var(--j-accent); border-color: var(--j-accent); color: #fff; }
    .btn.primary:hover { background: var(--j-accent-hover); color: #fff; }
    .btn:disabled { opacity: .45; cursor: not-allowed; filter: grayscale(.35); }
    .btn.danger { background: rgba(220, 38, 38, 0.1); border-color: var(--bar-disruption); color: var(--bar-disruption); }
    .btn.danger:hover { background: var(--bar-disruption); color: #fff; }
    .btn.active-toggle { background: rgba(2, 132, 199, 0.2); border-color: var(--j-accent); color: var(--j-accent); }

    .zoom-controls, .date-nav-controls { display: flex; border: 1px solid var(--j-border-light); border-radius: 4px; overflow: hidden; align-items: center;}
    .zoom-controls button, .date-nav-controls button { background: var(--j-header); border: none; color: var(--j-text-main); padding: 4px 10px; font-weight: bold; cursor: pointer; transition: 0.2s; border-right: 1px solid var(--j-border-light); }
    .zoom-controls button:last-child, .date-nav-controls button:last-child { border-right: none; }
    .zoom-controls button:hover, .date-nav-controls button:hover { background: var(--j-surface-hover); color: var(--j-accent); }
    .date-span { padding: 0 10px; background: var(--j-header); color: var(--j-text-main); font-size: 10px; font-weight: 600; border-right: 1px solid var(--j-border-light); height: 100%; display: flex; align-items: center;}

    .sub-toolbar {
      display: flex; align-items: center; justify-content: space-between; padding: 8px 16px;
      background-color: var(--j-header); border-bottom: 1px solid var(--j-border);
      flex-wrap: wrap; gap: 10px; z-index: 20; transition: 0.3s;
    }
    .search-box { position: relative; width: 100%; max-width: 240px; }
    .search-box input {
      width: 100%; background: var(--j-bg); border: 1px solid var(--j-border); color: var(--j-text-main);
      padding: 6px 8px 6px 28px; border-radius: 4px; font-size: 11px; outline: none; transition: 0.3s;
    }
    .search-box input:focus { border-color: var(--j-accent); }
    .search-box::before { content: '🔍'; position: absolute; left: 10px; top: 50%; transform: translateY(-50%); font-size: 11px; color: var(--j-text-muted); }

    .tracking-workspace { display: flex; flex: 1; overflow: hidden; position: relative; }
    
    .roster-pane { 
      width: 380px; display: flex; flex-direction: column; border-right: 1px solid var(--j-border); 
      background-color: var(--j-surface); flex-shrink: 0; z-index: 10; 
      transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.3s;
      position: relative; overflow: hidden;
    }
    .roster-pane.collapsed { width: 220px; }
    
    .roster-header { 
      display: flex; padding: 10px 8px; background: var(--j-header); border-bottom: 1px solid var(--j-border); 
      font-weight: 600; color: var(--j-text-muted); font-size: 10px; text-transform: uppercase; 
      white-space: nowrap; transition: 0.3s;
    }
    .roster-body { overflow-y: auto; flex: 1; padding-bottom: 40px; }
    .roster-row { 
      display: flex; padding: 6px 8px; align-items: center; border-bottom: 1px solid var(--j-border); 
      min-height: 38px; transition: 0.1s; cursor: default; white-space: nowrap;
    }
    
    .col-icon { width: 24px; flex-shrink: 0; text-align: center; }
    .col-ci { width: 24px; flex-shrink: 0; text-align: center; }
    .col-name { width: 140px; flex-shrink: 0; color: var(--j-text-main); font-weight: 600; overflow: hidden; text-overflow: ellipsis; }
    .col-flight { width: 60px; flex-shrink: 0; }
    .col-role { width: 60px; flex-shrink: 0; }
    .col-cost { width: 50px; flex-shrink: 0; text-align: right; }

    .roster-row:nth-child(even) { background-color: rgba(128,128,128,0.05); }
    .roster-row:hover, .roster-row.selected { background-color: var(--j-surface-hover); }

    .crew-icon { font-size: 12px; color: var(--j-text-muted); }
    .checkin-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
    .checkin-dot.green { background-color: #10b981; box-shadow: 0 0 5px #10b981; }
    .checkin-dot.red { background-color: #ef4444; box-shadow: 0 0 5px #ef4444; }
    .checkin-dot.gray { background-color: var(--j-border-light); }

    .flight-tag { display: inline-block; padding: 2px 5px; border-radius: 3px; font-weight: 600; font-size: 9px; color: #fff; background: #64748b; }
    .flight-tag.orange { background-color: #d97706; }
    .flight-tag.purple { background-color: var(--bar-flight); }
    .flight-tag.green { background-color: var(--bar-duty); color: #000; }
    
    body.theme-high-contrast .flight-tag.green { color: #fff; }

    .alert-icon { color: #ef4444; font-size: 11px; animation: pulse 2s infinite; margin-left: 4px; }
    .alert-warn { color: #f59e0b; }
    @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.4; } 100% { opacity: 1; } }

    .pane-handle {
      position: absolute; top: 50%; transform: translateY(-50%); width: 14px; height: 40px;
      background: var(--j-header); border: 1px solid var(--j-border); cursor: pointer;
      display: flex; align-items: center; justify-content: center; z-index: 100;
      color: var(--j-text-muted); transition: 0.2s;
    }
    .pane-handle:hover { background: var(--j-accent); color: #fff; border-color: var(--j-accent); }
    .handle-left { right: -14px; border-radius: 0 4px 4px 0; border-left: none; }
    .handle-right { left: -14px; border-radius: 4px 0 0 4px; border-right: none; }

    .gantt-pane { flex: 1; display: flex; flex-direction: column; overflow-x: auto; overflow-y: hidden; background-color: var(--j-bg); position: relative; transition: 0.3s; }
    .gantt-header-container { display: flex; background: var(--j-header); border-bottom: 1px solid var(--j-border); position: sticky; top: 0; z-index: 5; min-width: max-content; transition: 0.3s; }
    .gantt-day-col { width: calc(var(--hour-px) * 24); padding: 10px 0; text-align: center; border-right: 1px solid var(--j-border); color: var(--j-text-muted); font-weight: 600; font-size: 10px; transition: width 0.2s; }
    .gantt-body-scroll { flex: 1; overflow-y: auto; overflow-x: hidden; min-width: max-content; position: relative; padding-bottom: 40px; }
    
    .gantt-bg-grid-days { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-image: linear-gradient(to right, var(--j-border) 1px, transparent 1px); background-size: calc(var(--hour-px) * 24) 100%; pointer-events: none; z-index: 1; transition: background-size 0.2s; }
    .now-line { position: absolute; top: 0; bottom: 0; width: 2px; background-color: #ef4444; z-index: 6; left: calc(var(--hour-px) * 108); transition: left 0.2s; }
    .now-tag { position: absolute; top: 8px; left: calc(var(--hour-px) * 108); background: #ef4444; color: #fff; font-size: 9px; font-weight: bold; padding: 2px 6px; border-radius: 0 4px 4px 0; z-index: 7; transition: left 0.2s; }

    .gantt-row { height: 38px; border-bottom: 1px solid transparent; position: relative; z-index: 2; width: calc(var(--hour-px) * 192); transition: width 0.2s; }
    .gantt-row:nth-child(even) { background-color: rgba(128,128,128,0.05); }
    .gantt-row:hover, .gantt-row.selected { background-color: rgba(128,128,128,0.1); }

    .activity-bar {
      position: absolute; top: 7px; height: 24px; border-radius: 3px; display: flex; align-items: center; justify-content: flex-start;
      font-size: 9px; font-weight: 600; color: #fff; cursor: pointer; box-shadow: inset 0 0 0 1px rgba(0,0,0,0.3);
      overflow: hidden; white-space: nowrap; text-overflow: ellipsis; padding: 0 6px; transition: filter 0.1s, left 0.2s, width 0.2s;
    }
    .activity-bar:hover { filter: brightness(1.2); z-index: 10; outline: 1px solid #fff; box-shadow: 0 4px 8px rgba(0,0,0,0.3); }
    body.edit-mode .activity-bar { outline: 1px dashed rgba(255,255,255,0.5); cursor: crosshair; }
    body.edit-mode .activity-bar:hover { outline: 2px dashed #fff; }
    
    .activity-bar.standby-pulse { animation: sbyPulse 1.5s infinite; outline: 1px solid var(--bar-sby); }
    @keyframes sbyPulse { 0% { box-shadow: 0 0 0 0 rgba(132, 204, 22, 0.7); } 70% { box-shadow: 0 0 0 6px rgba(132, 204, 22, 0); } 100% { box-shadow: 0 0 0 0 rgba(132, 204, 22, 0); } }

    .bg-flight { background-color: var(--bar-flight); }
    .bg-duty { background-color: var(--bar-duty); color: #000; }
    .bg-sby { background-color: var(--bar-sby); color: #000; }
    .bg-rest { background-color: var(--bar-rest); color: #fff;}
    .bg-vacation { background-color: var(--bar-vacation); color: #fff; }
    .bg-disrupted { background-color: var(--bar-disruption); }

    body.theme-high-contrast .bg-flight { color: #fff; }
    body.theme-high-contrast .bg-duty { color: #000; }
    body.theme-high-contrast .bg-sby { color: #000; }
    body.theme-high-contrast .bg-rest { color: #000; }

    .filter-sidebar-wrapper { position: relative; height: 100%; display: flex; z-index: 30; }
    .filter-sidebar {
      width: 250px; background-color: var(--j-surface); border-left: 1px solid var(--j-border);
      display: flex; flex-direction: column; flex-shrink: 0; overflow-y: auto; 
      transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.3s;
    }
    .filter-sidebar.collapsed { width: 0; border: none; }
    
    .filter-header { padding: 14px 16px; font-weight: 600; color: var(--j-text-main); border-bottom: 1px solid var(--j-border); display: flex; justify-content: space-between; align-items: center; white-space: nowrap; }
    .filter-section { padding: 12px 16px; border-bottom: 1px solid var(--j-border); white-space: nowrap; }
    .filter-title { font-weight: 600; color: var(--j-text-muted); margin-bottom: 10px; font-size: 11px; display: flex; justify-content: space-between; cursor: pointer; }
    .checkbox-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; cursor: pointer; color: var(--j-text-main); font-size: 11px; }
    .checkbox-row input[type="checkbox"] { appearance: none; width: 14px; height: 14px; border: 1px solid var(--j-text-muted); border-radius: 3px; background: var(--j-bg); cursor: pointer; display: grid; place-items: center; transition: 0.2s; }
    .checkbox-row input[type="checkbox"]:checked { background: var(--j-accent); border-color: var(--j-accent); }
    .checkbox-row input[type="checkbox"]:checked::before { content: "✓"; color: #fff; font-size: 10px; font-weight: bold; }
    .legend-dot { width: 10px; height: 10px; border-radius: 2px; display: inline-block; }

    .open-time-tray {
      position: absolute; bottom: 0; left: 0; right: 0; height: 160px; background: var(--j-surface);
      border-top: 1px solid var(--j-border); z-index: 40; transform: translateY(100%);
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); display: flex; flex-direction: column;
      box-shadow: 0 -5px 15px rgba(0,0,0,0.5);
    }
    .open-time-tray.open { transform: translateY(0); }
    .tray-header { padding: 8px 16px; background: var(--j-header); border-bottom: 1px solid var(--j-border); display: flex; justify-content: space-between; align-items: center; font-weight: 600; color: var(--j-text-main); }
    .tray-body { flex: 1; overflow-x: auto; padding: 10px; display: flex; gap: 10px; align-items: center; }
    .open-flight-card { background: var(--j-bg); border: 1px dashed var(--j-border-light); padding: 10px; border-radius: 4px; min-width: 140px; cursor: grab; }
    .open-flight-card:hover { border-color: var(--j-accent); background: rgba(46, 117, 182, 0.1); }
    .of-flight { font-weight: bold; color: var(--j-accent); margin-bottom: 4px; }
    .of-route { font-size: 10px; color: var(--j-text-muted); }

    .context-menu {
      position: absolute; background: #1a1e27; border: 1px solid var(--j-border); border-radius: 6px;
      width: 200px; box-shadow: 0 10px 25px rgba(0,0,0,0.7); z-index: 300; display: none;
      flex-direction: column; padding: 4px 0; overflow: hidden; transition: background 0.3s;
    }
    body.theme-high-contrast .context-menu { background: #fff; }
    .context-menu.visible { display: flex; }
    .context-menu-item { padding: 8px 16px; font-size: 11px; color: var(--j-text-main); cursor: pointer; display: flex; align-items: center; gap: 8px; }
    .context-menu-item:hover { background: var(--j-accent); color: #fff; }
    .context-menu-divider { height: 1px; background: var(--j-border); margin: 4px 0; }

    .details-popover {
      position: absolute; background: #1a1e27; border: 1px solid var(--j-border); border-radius: 6px;
      padding: 12px; width: 240px; box-shadow: 0 10px 25px rgba(0,0,0,0.7); z-index: 200;
      display: none; transition: opacity 0.1s, background 0.3s; pointer-events: none;
    }
    body.theme-high-contrast .details-popover { background: #fff; }
    .details-popover.visible { display: block; }
    .pop-title { font-weight: 600; color: #fff; margin-bottom: 6px; font-size: 12px; border-bottom: 1px solid var(--j-border); padding-bottom: 6px; display: flex; justify-content: space-between;}
    body.theme-high-contrast .pop-title { color: #0f172a; }
    .pop-row { display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 11px; }
    .pop-row span:first-child { color: var(--j-text-muted); }
    .pop-row span:last-child { font-weight: 600; color: #fff; }
    body.theme-high-contrast .pop-row span:last-child { color: #0f172a; }

    .data-table-container { padding: 16px; overflow-y: auto; flex: 1; }
    .j-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 11px; }
    .j-table th { background: var(--j-header); color: var(--j-text-muted); padding: 10px 12px; font-weight: 600; text-transform: uppercase; border-bottom: 1px solid var(--j-border); position: sticky; top: 0; }
    .j-table td { padding: 10px 12px; border-bottom: 1px solid var(--j-border); background: var(--j-surface); color: var(--j-text-main); }
    .j-table tr:hover td { background: var(--j-surface-hover); }
    .j-badge { display: inline-flex; padding: 3px 6px; border-radius: 4px; font-size: 9px; font-weight: 700; text-transform: uppercase; }
    .j-badge.green { background: rgba(16, 185, 129, 0.2); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.4); }
    .j-badge.yellow { background: rgba(245, 158, 11, 0.2); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.4); }
    .j-badge.red { background: rgba(239, 68, 68, 0.2); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.4); }
    
    .ftl-progress-bg { width: 100%; height: 6px; background: var(--j-bg); border-radius: 3px; overflow: hidden; margin-top: 4px; }
    .ftl-progress-fg { height: 100%; border-radius: 3px; transition: width 0.3s; }

    .alerts-drawer {
      position: absolute; top: 0; right: 0; bottom: 0; width: 340px; background: var(--j-surface);
      border-left: 1px solid var(--j-border); box-shadow: -5px 0 20px rgba(0,0,0,0.6); z-index: 90;
      transform: translateX(100%); transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); display: flex; flex-direction: column;
    }
    .alerts-drawer.open { transform: translateX(0); }
    .drawer-header { padding: 16px; border-bottom: 1px solid var(--j-border); display: flex; justify-content: space-between; align-items: center; background: var(--j-header); }
    .drawer-title { color: var(--j-text-main); font-weight: 600; font-size: 14px; }
    .close-btn { background: none; border: none; color: var(--j-text-muted); cursor: pointer; font-size: 18px; }
    .close-btn:hover { color: var(--j-text-main); }
    .alert-list { flex: 1; overflow-y: auto; padding: 12px; }
    .alert-card {
      background: var(--j-bg); border-left: 4px solid var(--bar-disruption); padding: 12px;
      border-radius: 4px; margin-bottom: 10px; cursor: pointer; transition: 0.2s; border: 1px solid var(--j-border); border-left-width: 4px;
    }
    .alert-card:hover { background: var(--j-surface-hover); }
    .alert-card.warning { border-left-color: var(--bar-sby); }
    .alert-title { font-weight: 600; color: var(--j-text-main); margin-bottom: 4px; }
    .alert-desc { color: var(--j-text-muted); font-size: 11px; margin-bottom: 6px; }

    .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.75); z-index: 1000; display: none; place-items: center; backdrop-filter: blur(2px); }
    .overlay.visible { display: grid; }
    .modal { background: var(--j-surface); width: 440px; border-radius: 6px; border: 1px solid var(--j-border); box-shadow: 0 20px 40px rgba(0,0,0,0.6); overflow: hidden; transform: scale(0.95); opacity: 0; transition: all 0.2s; }
    .overlay.visible .modal { transform: scale(1); opacity: 1; }
    .modal-header { padding: 16px; background: var(--j-header); border-bottom: 1px solid var(--j-border); display: flex; justify-content: space-between; align-items: center; color: var(--j-text-main); font-weight: 600; font-size: 14px; }
    .modal-body { padding: 20px; display: flex; flex-direction: column; gap: 16px; }
    .modal-footer { padding: 16px; border-top: 1px solid var(--j-border); display: flex; justify-content: flex-end; gap: 10px; background: var(--j-header); }

    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-group label { color: var(--j-text-muted); font-size: 10px; text-transform: uppercase; font-weight: 600; }
    .form-group select, .form-group input, .form-group textarea { background: var(--j-bg); border: 1px solid var(--j-border); color: var(--j-text-main); padding: 8px 10px; border-radius: 4px; outline: none; font-family: var(--font-stack); font-size: 12px; }
    .form-group select:focus, .form-group input:focus, .form-group textarea:focus { border-color: var(--j-accent); }

    .console-box { background: #0b0d12; border: 1px solid var(--j-border); border-radius: 4px; padding: 12px; height: 160px; overflow-y: auto; font-family: monospace; font-size: 11px; color: #68d391; }
    body.theme-high-contrast .console-box { background: #f1f5f9; color: #047857; }
    .console-line { margin-bottom: 5px; }
    .console-line.error { color: #ef4444; }
    body.theme-high-contrast .console-line.error { color: #dc2626; }
    .console-line.warn { color: #f59e0b; }
    body.theme-high-contrast .console-line.warn { color: #d97706; }
    .console-line.info { color: #38bdf8; }
    body.theme-high-contrast .console-line.info { color: #0284c7; }

    .toast-container { position: fixed; bottom: 20px; right: 20px; display: flex; flex-direction: column; gap: 10px; z-index: 2000; pointer-events: none; }
    .toast { background: var(--j-surface); border-left: 4px solid var(--j-accent); color: var(--j-text-main); padding: 12px 16px; border-radius: 4px; font-weight: 500; box-shadow: 0 4px 16px rgba(0,0,0,0.6); animation: slideIn 0.3s ease forwards; display: flex; align-items: center; justify-content: space-between; min-width: 260px; font-size: 12px; pointer-events: auto; }
    .toast.error { border-left-color: var(--bar-disruption); }
    .toast.success { border-left-color: var(--bar-duty); }
    .toast button { background: none; border: none; color: var(--j-text-muted); cursor: pointer; font-weight: bold; font-size: 14px; }
    .toast button:hover { color: var(--j-text-main); }
    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

    .profile-card { background: var(--j-surface); border: 1px solid var(--j-border); border-radius: 6px; padding: 20px; flex: 1; }
    .profile-card h3 { color: var(--j-text-main); font-size: 14px; margin-bottom: 16px; border-bottom: 1px solid var(--j-border); padding-bottom: 10px; }
    .settings-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .empty-state { color: var(--j-text-muted); padding: 24px 12px; text-align: center; font-size: 11px; }
    .sync-state { display: inline-flex; align-items: center; gap: 6px; color: #94a3b8; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; }
    .sync-state::before { content: ''; width: 7px; height: 7px; border-radius: 50%; background: #f59e0b; }
    .sync-state.ready::before { background: #10b981; }
    .sync-state.error::before { background: #ef4444; }

    @media (max-width: 900px) {
      input, select, textarea { font-size: 16px !important; }
      .roster-pane { width: 220px; }
      .brand-sub { display: none; }
      .filter-sidebar-wrapper { position: absolute; right: 0; height: 100%; z-index: 40; transform: translateX(100%); transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
      .filter-sidebar-wrapper.open { transform: translateX(0); box-shadow: -5px 0 20px rgba(0,0,0,0.6); }
      #btnFilterMobile { display: flex !important; }
      .pane-handle { display: none; }
      .settings-grid { grid-template-columns: 1fr; }
      .data-table-container.split-view { flex-direction: column; }
    }
  </style>
</head>
<body>

  <header class="topbar">
    <div class="brand">
      <div class="brand-logo">JEPPESEN</div>
      <div class="brand-text">Operations Tracking <span class="brand-sub">| GLOBAL WORKFORCE</span></div>
    </div>
    
    <div class="top-actions">
      <!-- Profile/Settings entry point -->
      <button class="icon-btn" onclick="switchView('view-settings', document.getElementById('navSettings'))" title="Settings"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="1.5em" height="1.5em">
  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
</svg></button>
      <button class="icon-btn" id="btnAlerts" onclick="toggleAlerts()" title="Alerts">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="1.3em" height="1.3em">
  <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
</svg><span class="badge-dot" id="alertBadge"></span>
      </button>
    </div>
  </header>

  <div class="app-layout">
    <aside class="icon-sidebar">
      <div class="nav-icon active" id="navTracking" data-target="view-tracking" title="Live Tracking" onclick="switchView('view-tracking', this)"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em">
  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
</svg></div>
      <div class="nav-icon" id="navVacation" data-target="view-vacation" title="Vacation Planning" onclick="switchView('view-vacation', this)"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em">
  <path d="M12 2C6.48 2 2 6.48 2 12h8v5c0 1.1.9 2 2 2s2-.9 2-2v-5h8c0-5.52-4.48-10-10-10z"/>
</svg></div>
      <div class="nav-icon" id="navFtl" data-target="view-ftl" title="Labor Laws & Compliance" onclick="switchView('view-ftl', this)"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em">
  <path d="M15 1H9v2h6V1zm-4 13h2V8h-2v6zm8.03-6.61l1.42-1.42c-.43-.51-.9-.99-1.41-1.41l-1.42 1.42A8.962 8.962 0 0012 4c-4.97 0-9 4.03-9 9s4.02 9 9 9a8.994 8.994 0 007.03-14.61zM12 20c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>
</svg></div>
      <div class="nav-icon" id="navTriptrade" data-target="view-triptrade" title="TripTrade Control" onclick="switchView('view-triptrade', this)"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em">
  <path d="M22 8l-4-4v3H3v2h15v3l4-4zM2 16l4 4v-3h15v-2H6v-3l-4 4z"/>
</svg></div>
      <div class="nav-icon" id="navLogistics" data-target="view-logistics" title="Accommodations & Logistics" onclick="switchView('view-logistics', this)"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em">
  <path d="M7 13c1.66 0 3-1.34 3-3S8.66 7 7 7s-3 1.34-3 3 1.34 3 3 3zm12-6h-8v7H3V5H1v15h2v-3h18v3h2v-9c0-2.21-1.79-4-4-4z"/>
</svg></div>
      <div class="nav-icon" id="navMessages" data-target="view-messages" title="Operational Messages" onclick="switchView('view-messages', this)">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em">
    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
  </svg>
</div>
      <div class="nav-icon" id="navAudit" data-target="view-audit" title="Reports & Audit Log" onclick="switchView('view-audit', this)">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em">
    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
  </svg>
</div>
      <div class="nav-icon bottom" title="System Settings" onclick="showToast('Global Configuration')">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em">
    <path d="M19.43 12.98c.04-.32.07-.64.07-.98 0-.34-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98 0 .33.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"/>
  </svg>
</div>
    </aside>

    <main class="view-container active" id="view-tracking">
      <div class="view-toolbar">
        <h1 class="view-title">
          Operations Tracking - Live View 
          <span class="edit-badge" id="editBadge" style="display:none; background:var(--bar-disruption); color:#fff; font-size:9px; padding:2px 6px; border-radius:3px; margin-left:8px;">EDIT MODE</span>
        </h1>
        <div class="toolbar-actions">
          <div class="date-nav-controls">
            <button onclick="shiftDate(-1)" title="Previous Day">◀</button>
            <span class="date-span" id="dateWindowSpan">Loading…</span>
            <button onclick="shiftDate(1)" title="Next Day">▶</button>
          </div>
          <div class="zoom-controls">
            <button onclick="zoomGantt('out')" title="Zoom Out">-</button>
            <button onclick="zoomGantt('in')" title="Zoom In">+</button>
          </div>
          <button class="btn" id="btnEditMode" onclick="toggleEditMode()"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="1.2em" height="1.2em" style="margin-right: 4px;">
  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
</svg>️ Edit virtual boarded</button>
          <button class="btn" id="btnMarkTitles" onclick="toggleMarkTitles()"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="1.2em" height="1.2em" style="margin-right: 4px;">
  <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/>
</svg> Mark titles</button>
          <button class="btn primary" onclick="openOptimizerModal()"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="1.2em" height="1.2em" style="margin-right: 4px;">
  <path d="M7.5 5.6L5 7l1.4-2.5L5 2l2.5 1.4L10 2 8.6 4.5 10 7 7.5 5.6zm12 9.8L17 14l1.4 2.5L17 19l2.5-1.4L22 19l-1.4-2.5L22 14l-2.5 1.4zM22 2l-2.5 1.4L17 2l1.4 2.5L17 7l2.5-1.4L22 7l-1.4-2.5L22 2zm-7.63 5.29c-.39-.39-1.02-.39-1.41 0L1.29 18.96c-.39.39-.39 1.02 0 1.41l2.34 2.34c.39.39 1.02.39 1.41 0L16.71 11.04c.39-.39.39-1.02 0-1.41l-2.34-2.34z"/>
</svg> Travchant / Optimize</button>
          <button class="btn" onclick="toggleFiltersMobile()" style="display: none;" id="btnFilterMobile"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="1.2em" height="1.2em" style="margin-right: 4px;">
  <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.06-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.73,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.06,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.43-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.49-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
</svg> Filters</button>
          <button class="btn" onclick="toggleOpenTime()"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="1.2em" height="1.2em" style="margin-right: 4px;">
  <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
</svg> Open Time</button>
        </div>
      </div>

      <div class="sub-toolbar">
        <div class="search-box">
          <input type="text" id="searchInput" placeholder="Search by name, role, base..." oninput="handleFilterChange()">
        </div>
        <div style="color: var(--j-text-muted); font-weight: 600;" id="jurisdictionSubtitle">
          Global Network View (Multi-Jurisdictional)
        </div>
      </div>

      <div class="tracking-workspace">
        <div class="roster-pane" id="rosterPane">
          <div class="pane-handle handle-left" onclick="togglePane('roster')">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="1.2em" height="1.2em"><path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6z"/></svg>
</div>
          <div class="roster-header">
            <div class="col-icon"></div>
            <div class="col-ci" title="Check-in Status">CI</div>
            <div class="col-name">Staff Name</div>
            <div class="col-flight">Assigned</div>
            <div class="col-role">Role</div>
            <div class="col-cost">Base</div>
          </div>
          <div class="roster-body" id="rosterBody" onscroll="syncScroll(this, 'vertical')"></div>
        </div>

        <div class="gantt-pane" id="ganttPane">
          <div class="gantt-header-container" id="ganttHeader"></div>
          <div class="gantt-body-scroll" id="ganttBody" onscroll="syncScroll(this, 'both')">
            <div class="gantt-bg-grid-days"></div>
            <div class="now-line" id="nowLine"></div>
            <div class="now-tag" id="nowTag">Current Time</div>
            <div id="ganttRowsContainer"></div>
            
            <div class="details-popover" id="popover">
              <div class="pop-title" id="popTitle"><span>Details</span><span class="j-badge green" style="font-size:8px" id="popStatusTag">ON-TIME</span></div>
              <div class="pop-row"><span>Status:</span><span id="popStatus"></span></div>
              <div class="pop-row"><span>Staff:</span><span id="popCrew"></span></div>
              <div class="pop-row"><span>Type:</span><span id="popType"></span></div>
              <div class="pop-row"><span>Duration:</span><span id="popDur"></span></div>
              <div style="margin-top: 8px; font-size: 9px; color: var(--j-text-muted); border-top: 1px solid var(--j-border); padding-top: 6px;">Click to interact</div>
            </div>
          </div>
          
          <div class="open-time-tray" id="openTimeTray">
            <div class="tray-header">
              <span>Unassigned Operations (Open Time)</span>
              <button class="icon-btn" style="width:24px;height:24px;font-size:12px;color:#fff" onclick="toggleOpenTime()">✕</button>
            </div>
            <div class="tray-body" id="openTimeTrayBody"></div>
          </div>
        </div>

        <div class="pane-handle handle-right" onclick="togglePane('filters')">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="1.2em" height="1.2em" style="margin-right: 4px;">
  <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.06-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.73,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.06,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.43-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.49-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
</svg>
</div>
          <aside class="filter-sidebar" id="filterSidebar">
            <div class="filter-header">
              <span>Filters & Scope</span>
              <button class="icon-btn" onclick="toggleFiltersMobile()" style="display:none;" id="btnCloseFilterMobile">✕</button>
            </div>
            
            <div class="filter-section">
              <div class="filter-title" onclick="toggleSection(this)">Base / Region <span>▼</span></div>
              <div class="filter-content" id="baseFilterContent"></div>
            </div>

            <div class="filter-section">
              <div class="filter-title" onclick="toggleSection(this)">Role <span>▼</span></div>
              <div class="filter-content" id="roleFilterContent"></div>
            </div>

            <div class="filter-section">
              <div class="filter-title" onclick="toggleSection(this)">Compliance Status <span>▼</span></div>
              <div class="filter-content">
                <label class="checkbox-row"><input type="checkbox" value="Legal" class="filter-comp" checked onchange="handleFilterChange()"> <span>Legal</span></label>
                <label class="checkbox-row"><input type="checkbox" value="Warning" class="filter-comp" checked onchange="handleFilterChange()"> <span>Warning</span></label>
                <label class="checkbox-row"><input type="checkbox" value="Violation" class="filter-comp" checked onchange="handleFilterChange()"> <span>Violation</span></label>
              </div>
            </div>

            <div class="filter-section">
              <div class="filter-title" onclick="toggleSection(this)">Legend <span>▼</span></div>
              <div class="filter-content">
                <label class="checkbox-row"><input type="checkbox" value="flight" class="filter-act" checked onchange="handleFilterChange()"> <span class="legend-dot bg-flight"></span> <span>Tour / Excursion</span></label>
                <label class="checkbox-row"><input type="checkbox" value="duty" class="filter-act" checked onchange="handleFilterChange()"> <span class="legend-dot bg-duty"></span> <span>Transfer Duty</span></label>
                <label class="checkbox-row"><input type="checkbox" value="rest" class="filter-act" checked onchange="handleFilterChange()"> <span class="legend-dot bg-rest"></span> <span>Rest / Off</span></label>
                <label class="checkbox-row"><input type="checkbox" value="sby" class="filter-act" checked onchange="handleFilterChange()"> <span class="legend-dot bg-sby"></span> <span>Standby</span></label>
                <label class="checkbox-row"><input type="checkbox" value="vacation" class="filter-act" checked onchange="handleFilterChange()"> <span class="legend-dot bg-vacation"></span> <span>Vacation</span></label>
                <label class="checkbox-row"><input type="checkbox" value="disrupted" class="filter-act" checked onchange="handleFilterChange()"> <span class="legend-dot bg-disrupted"></span> <span>Disrupted</span></label>
              </div>
            </div>
            <div style="padding: 16px;">
              <button class="btn" style="width: 100%; justify-content: center;" onclick="resetFilters()">Reset Filters</button>
            </div>
          </aside>
        </div>
      <div class="context-menu" id="contextMenu"></div>
    </main>
    <main class="view-container" id="view-vacation">
      <div class="view-toolbar">
        <h1 class="view-title">Vacation Planning & Bidding</h1>
        <div class="toolbar-actions">
          <button class="btn primary" onclick="openVacationModal()">+ Request Vacation Block</button>
        </div>
      </div>
      <div class="sub-toolbar"><div style="color: var(--j-text-muted);">Entitlements automatically calculated based on employee base jurisdiction.</div></div>
      <div class="data-table-container">
        <h3 style="color: var(--j-text-main); margin-bottom: 12px; font-size: 13px;">Submitted Vacation Requests & Awards</h3>
        <table class="j-table">
          <thead><tr><th>Request ID</th><th>Staff Member</th><th>Base</th><th>Period</th><th>Duration</th><th>Jurisdiction Rule</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody id="vacationTableBody"></tbody>
        </table>
      </div>
    </main>

    <main class="view-container" id="view-ftl">
      <div class="view-toolbar"><h1 class="view-title">Labor Laws & Compliance Monitor</h1></div>
      <div class="sub-toolbar"><div style="color: var(--j-text-muted);" id="ftlSubtext">Dynamic limits continuously enforced based on each employee's base region.</div></div>
      <div class="data-table-container">
        <table class="j-table">
          <thead><tr><th>Staff Name</th><th>Base / Region</th><th>Role</th><th>7-Day Work Limit</th><th>28-Day Work Limit</th><th>Annual Work Limit</th><th>Active Jurisdiction Rule</th><th>Status</th></tr></thead>
          <tbody id="ftlTableBody"></tbody>
        </table>
      </div>
    </main>

    <main class="view-container" id="view-triptrade">
      <div class="view-toolbar"><h1 class="view-title">TripTrade Control Queue</h1></div>
      <div class="sub-toolbar"><div style="color: var(--j-text-muted);">Pending crew-to-crew exchange requests requiring OCC approval.</div></div>
      <div class="data-table-container">
        <table class="j-table">
          <thead><tr><th>Request ID</th><th>Staff A</th><th>Staff B</th><th>Exchange Details</th><th>Jurisdiction Check</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody id="tradeTableBody"></tbody>
        </table>
      </div>
    </main>

    <main class="view-container" id="view-logistics">
      <div class="view-toolbar"><h1 class="view-title">Accommodations & Logistics</h1></div>
      <div class="sub-toolbar"><div style="color: var(--j-text-muted);">Manage layover hotels and ground transportation suppliers.</div></div>
      <div class="data-table-container">
        <table class="j-table">
          <thead><tr><th>Ref ID</th><th>Staff Name</th><th>Location</th><th>Supplier</th><th>Service Dates</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody id="logisticsTableBody"></tbody>
        </table>
      </div>
    </main>

    <main class="view-container" id="view-messages">
      <div class="view-toolbar">
        <h1 class="view-title">Operational Message Queue</h1>
        <div class="toolbar-actions"><button class="btn primary" disabled title="Operational messaging is managed in GroupTalk">New Message</button></div>
      </div>
      <div class="sub-toolbar"><div style="color: var(--j-text-muted);">Track push notifications, SMS, and in-app communications.</div></div>
      <div class="data-table-container">
        <table class="j-table">
          <thead><tr><th>Time (ZULU)</th><th>Recipient</th><th>Channel</th><th>Message Subject</th><th>Delivery Status</th><th>Read Receipt</th><th>Actions</th></tr></thead>
          <tbody id="messagesTableBody"></tbody>
        </table>
      </div>
    </main>

    <main class="view-container" id="view-audit">
      <div class="view-toolbar"><h1 class="view-title">System Reports & Audit Log</h1></div>
      <div class="sub-toolbar"><div style="color: var(--j-text-muted);">Immutable record of all operational modifications and approvals.</div></div>
      <div class="data-table-container">
        <table class="j-table">
          <thead><tr><th>Timestamp (ZULU)</th><th>Action</th><th>Details</th><th>Status</th></tr></thead>
          <tbody id="auditTableBody"></tbody>
        </table>
      </div>
    </main>

    <main class="view-container" id="view-settings">
      <div class="view-toolbar">
        <h1 class="view-title">System Settings & Profile Configuration</h1>
        <div class="toolbar-actions">
          <button class="btn primary" onclick="saveSettings()">Apply Display Settings</button>
        </div>
      </div>
      <div class="sub-toolbar"><div style="color: var(--j-text-muted);">Manage global platform defaults and your personal user profile.</div></div>
      
      <div class="data-table-container split-view" style="display: flex; gap: 20px;">
        <div class="profile-card">
          <h3>User Profile Identity</h3>
          <div class="form-group"><label>Agent ID</label><input id="profileAgentId" type="text" value="" disabled style="opacity: 0.7;"></div>
          <div class="form-group"><label>Full Name</label><input id="profileFullName" type="text" value="" disabled style="opacity: 0.7;"></div>
          <div class="form-group"><label>Operational Role</label><input id="profileRole" type="text" value="" disabled style="opacity: 0.7;"></div>
          <div class="form-group"><label>Contact Email</label><input id="profileEmail" type="email" value="" disabled style="opacity: 0.7;"></div>
        </div>
        
        <div class="profile-card" style="flex: 2;">
          <h3>Global System Configuration</h3>
          <div class="settings-grid">
            <div class="form-group">
              <label>Default Timeline Zoom (Gantt)</label>
              <select id="settingZoom" onchange="zoomGanttFromSettings(this.value)">
                <option value="5">Compact (5px/hr)</option>
                <option value="7.5" selected>Standard (7.5px/hr)</option>
                <option value="15">Detailed (15px/hr)</option>
              </select>
            </div>
            <div class="form-group">
              <label>System Theme Profile</label>
              <select id="settingTheme">
                <option value="dark" selected>Classic Jeppesen (Dark Mode)</option>
                <option value="light">Lufthansa NetLine (High Contrast Day Mode)</option>
              </select>
            </div>
            <div class="form-group">
              <label>Time Mode</label>
              <select><option>UTC / ZULU</option><option>Local Station Time</option></select>
            </div>
            <div class="form-group">
              <label>Audio Alerts</label>
              <select><option>Critical Only</option><option>All Alerts</option><option>Muted</option></select>
            </div>
          </div>
        </div>
      </div>
    </main>

    <div class="alerts-drawer" id="alertsDrawer">
      <div class="drawer-header">
        <span class="drawer-title">Alert Monitor</span>
        <button class="close-btn" onclick="toggleAlerts()">✕</button>
      </div>
      <div class="alert-list" id="alertList"></div>
    </div>
  </div>

  <div class="overlay" id="modalOverlay" onclick="closeModalOnBgClick(event)">
    <div class="modal" id="editModal">
      <div class="modal-header">
        <span>Edit Operation</span>
        <button class="icon-btn" style="width: 24px; height: 24px; font-size: 14px;" onclick="closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-group"><label>Identifier</label><input type="text" id="editLabel"></div>
        <div class="form-group">
          <label>Classification</label>
          <select id="editType">
            <option value="flight">Tour / Excursion</option>
            <option value="duty">Transfer</option>
            <option value="sby">Standby</option>
            <option value="rest">Rest / Leave</option>
            <option value="vacation">Vacation</option>
            <option value="disrupted">Disrupted / Violation</option>
          </select>
        </div>
        <div class="form-group">
          <label>Status</label>
          <select id="editStatus">
            <option value="ON-TIME">ON-TIME</option>
            <option value="DELAYED">DELAYED</option>
            <option value="CANCELED">CANCELED</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="REST VIOLATION">REST VIOLATION</option>
            <option value="STANDBY">STANDBY</option>
          </select>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn" onclick="closeModal()">Cancel</button>
        <button class="btn primary" onclick="saveAssignment()">Apply Changes</button>
      </div>
    </div>

    <div class="modal" id="standbyModal">
      <div class="modal-header">
        <span>Activate Standby / Call Out</span>
        <button class="icon-btn" style="width: 24px; height: 24px; font-size: 14px;" onclick="closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <div style="font-size: 12px; color: var(--j-text-muted);">Assign an open operation to this reserve staff member under their base labor limits.</div>
        <div class="form-group"><label>New Reference (e.g. TRF-JFK)</label><input type="text" id="sbyFlightNum" placeholder="e.g. TRF-01"></div>
        <div class="form-group">
          <label>Activity Type</label>
          <select id="sbyType"><option value="flight">Tour / Excursion</option><option value="duty">Transfer Duty</option></select>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn" onclick="closeModal()">Cancel</button>
        <button class="btn primary" onclick="executeStandbyCallout()">Activate & Assign</button>
      </div>
    </div>

    <div class="modal" id="vacationModal">
      <div class="modal-header">
        <span>Request Vacation Block</span>
        <button class="icon-btn" style="width: 24px; height: 24px; font-size: 14px;" onclick="closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <div style="font-size: 12px; color: var(--j-text-muted);">Submit dates for annual leave. Entitlements mapped to employee's base jurisdiction.</div>
        <div class="form-group"><label>Staff Member</label>
          <select id="vacStaffSelect"></select>
        </div>
        <div class="form-group"><label>Start Date</label><input type="date" id="vacStart"></div>
        <div class="form-group"><label>End Date</label><input type="date" id="vacEnd"></div>
      </div>
      <div class="modal-footer">
        <button class="btn" onclick="closeModal()">Cancel</button>
        <button class="btn primary" onclick="submitVacationRequest()">Submit Request</button>
      </div>
    </div>

    <div class="modal" id="messageModal">
      <div class="modal-header">
        <span>Compose Operational Message</span>
        <button class="icon-btn" style="width: 24px; height: 24px; font-size: 14px;" onclick="closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-group"><label>Recipient</label><select id="msgRecipientSelect"></select></div>
        <div class="form-group"><label>Subject</label><input type="text" id="msgSubject" placeholder="e.g. Duty Update"></div>
        <div class="form-group"><label>Message Content</label><textarea id="msgBody" rows="4" placeholder="Enter message details..."></textarea></div>
      </div>
      <div class="modal-footer">
        <button class="btn" onclick="closeModal()">Cancel</button>
        <button class="btn primary" onclick="sendMessage()">Dispatch Message</button>
      </div>
    </div>

    <div class="modal" id="optimizerModal">
      <div class="modal-header"><span>Travchant Optimizer Engine</span></div>
      <div class="modal-body">
        <div style="font-size: 12px; color: var(--j-text-muted); margin-bottom: 10px;" id="optJurisdictionNote">Resolving network disruptions using Multi-Jurisdictional legality matrices...</div>
        <div class="console-box" id="optConsole"><div class="console-line info">> Initializing optimization core...</div></div>
      </div>
      <div class="modal-footer" style="justify-content: space-between;">
        <span id="optProgressText" style="font-weight: 600; color: var(--j-text-main); font-size: 12px;">0%</span>
        <button class="btn primary" id="btnOptClose" style="display: none;" onclick="closeModal()">Close & Apply</button>
      </div>
    </div>
  </div>

  <div class="toast-container" id="toastContainer"></div>

  <script>
    const STATE = {
      zoomLevel: 7.5,
      currentDateOffset: 0, // days from start
      rosterCollapsed: false,
      filtersCollapsed: false,
      editMode: false,
      markTitles: false,
      selectedCrewId: null,
      selectedActId: null,
      initialized: false,
      loading: true,
      bootstrapRequestAt: 0,
      lastSyncAt: null,
      windowStart: new Date().toISOString(),
      currentUser: {},
      bases: [],
      roles: [],
      openTime: [],
      pendingActions: new Map(),
      filters: { 
        search: '', 
        base: [],
        role: [], 
        compliance: ['Legal', 'Warning', 'Violation'],
        activities: ['flight', 'duty', 'sby', 'rest', 'vacation', 'disrupted'] 
      },
      
      auditLog: [],

      crewData: [],

      vacations: [],
      trades: [],
      logistics: [],
      messages: [],
      jurisdictions: {}
    };

    const OPS_SOURCE = 'SKANDI_OPS_CONTROL';
    const OPS_PARENT = 'SKANDI_WIX_PARENT';

    const asArray = value => Array.isArray(value) ? value : [];
    const asObject = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    const idOf = value => String(value ?? '').trim();
    const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[char]));

    function postToWix(type, payload = {}) {
      window.parent.postMessage({ source: OPS_SOURCE, type, payload }, '*');
    }

    function setSyncState(label, status = '') {
      const element = document.getElementById('syncState');
      if (!element) return;
      element.textContent = label;
      element.className = `sync-state ${status}`.trim();
    }

    function requestBootstrap(reason = 'INITIAL_LOAD') {
      STATE.loading = true;
      const requestedAt = Date.now();
      STATE.bootstrapRequestAt = requestedAt;
      setSyncState('Syncing');
      postToWix('OPS_BOOTSTRAP_REQUEST', {
        reason,
        windowStart: STATE.windowStart,
        dateOffset: STATE.currentDateOffset
      });
      window.setTimeout(() => {
        if (!STATE.loading || STATE.bootstrapRequestAt !== requestedAt) return;
        setSyncState('Offline', 'error');
        showToast('OPS data did not arrive from the Wix page bridge.', 'error');
      }, 15000);
    }

    function dispatchAction(action, payload = {}, successMessage = '') {
      const requestId = `OPS-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      STATE.pendingActions.set(requestId, { action, successMessage });
      setSyncState('Saving');
      postToWix('OPS_ACTION', { requestId, action, payload });
      window.setTimeout(() => {
        if (!STATE.pendingActions.has(requestId)) return;
        STATE.pendingActions.delete(requestId);
        setSyncState('Error', 'error');
        showToast('OPS did not confirm the change. Refresh before retrying.', 'error');
      }, 20000);
      return requestId;
    }

    function hoursFromWindow(value) {
      if (Number.isFinite(Number(value))) return Number(value);
      const timestamp = Date.parse(value);
      const windowStart = Date.parse(STATE.windowStart);
      return Number.isFinite(timestamp) && Number.isFinite(windowStart) ? (timestamp - windowStart) / 3600000 : 0;
    }

    function normalizeActivity(row) {
      const startH = hoursFromWindow(row.startH ?? row.start_h ?? row.startAt ?? row.start_at);
      const explicitDuration = Number(row.durH ?? row.durationHours ?? row.duration_hours);
      const endH = hoursFromWindow(row.endAt ?? row.end_at);
      return {
        id: idOf(row.id ?? row.assignmentId ?? row.assignment_id),
        sourceId: idOf(row.sourceId ?? row.source_id ?? row.id ?? row.assignmentId ?? row.assignment_id),
        sourceTable: String(row.sourceTable ?? row.source_table ?? ''),
        type: String(row.type ?? row.activityType ?? row.activity_type ?? 'duty').toLowerCase(),
        label: String(row.label ?? row.reference ?? row.title ?? ''),
        startH,
        durH: Number.isFinite(explicitDuration) ? explicitDuration : Math.max(0.25, endH - startH),
        status: String(row.status ?? 'PENDING').toUpperCase(),
        isCalloutCandidate: Boolean(row.isCalloutCandidate ?? row.is_callout_candidate)
      };
    }

    function normalizeCrew(row, assignments) {
      const agentId = idOf(row.agentId ?? row.agent_id ?? row.skId ?? row.sk_id ?? row.id);
      const staffAssignments = assignments.filter(item =>
        idOf(item.agentId ?? item.agent_id ?? item.skId ?? item.sk_id ?? item.staffId ?? item.staff_id) === agentId
      );
      const activities = asArray(row.acts ?? row.activities ?? row.assignments).concat(staffAssignments).map(normalizeActivity);
      const primaryActivity = activities.find(item => !['COMPLETED', 'CANCELED'].includes(item.status)) ?? activities[0];
      return {
        id: agentId,
        agentId,
        name: String(row.name ?? row.fullName ?? row.full_name ?? [row.firstName ?? row.first_name, row.lastName ?? row.last_name].filter(Boolean).join(' ') ?? ''),
        assigned: String(row.assigned ?? row.currentAssignment ?? row.current_assignment ?? primaryActivity?.label ?? '—'),
        base: String(row.baseCode ?? row.base_code ?? row.base ?? row.seeuor ?? '—'),
        badge: String(row.badge ?? 'gray'),
        role: String(row.roleName ?? row.role_name ?? row.role ?? '—'),
        alert: String(row.alert ?? ''),
        checkin: String(row.checkin ?? row.checkInStatus ?? row.check_in_status ?? 'gray'),
        acts: activities,
        ftl: {
          d7: Number(row.ftl?.d7 ?? row.hours7Days ?? row.hours_7_days ?? 0),
          f28: Number(row.ftl?.f28 ?? row.hours28Days ?? row.hours_28_days ?? 0),
          f365: Number(row.ftl?.f365 ?? row.hours365Days ?? row.hours_365_days ?? 0)
        }
      };
    }

    function normalizeVacation(row) {
      const start = row.startDate ?? row.start_date ?? '';
      const end = row.endDate ?? row.end_date ?? '';
      const startMs = Date.parse(start);
      const endMs = Date.parse(end);
      const calculatedDays = Number.isFinite(startMs) && Number.isFinite(endMs)
        ? Math.floor((endMs - startMs) / 86400000) + 1
        : 0;
      return {
        id: idOf(row.id ?? row.requestId ?? row.request_id),
        sourceId: idOf(row.sourceId ?? row.source_id ?? row.id),
        staffId: idOf(row.agentId ?? row.agent_id ?? row.staffId ?? row.staff_id),
        name: String(row.name ?? row.staffName ?? row.staff_name ?? ''),
        base: String(row.baseCode ?? row.base_code ?? row.base ?? ''),
        period: String(row.period ?? [start, end].filter(Boolean).join(' to ')),
        days: Number(row.days ?? row.durationDays ?? row.duration_days ?? calculatedDays),
        status: String(row.status ?? 'PENDING REVIEW').toUpperCase().replaceAll('_', ' ')
      };
    }

    function normalizeTrade(row) {
      return {
        id: idOf(row.id ?? row.tradeId ?? row.trade_id),
        sourceId: idOf(row.sourceId ?? row.source_id ?? row.id),
        crewA: String(row.crewA ?? row.staffAName ?? row.staff_a_name ?? row.requesterName ?? row.requester_name ?? ''),
        crewB: String(row.crewB ?? row.staffBName ?? row.staff_b_name ?? row.counterpartyName ?? row.counterparty_name ?? ''),
        details: String(row.details ?? row.exchangeDetails ?? row.exchange_details ?? ''),
        status: String(row.status ?? 'PENDING').toUpperCase()
      };
    }

    function normalizeLogistics(row) {
      return {
        id: idOf(row.id ?? row.logisticsId ?? row.logistics_id ?? row.reference),
        name: String(row.name ?? row.staffName ?? row.staff_name ?? ''),
        loc: String(row.loc ?? row.location ?? ''),
        supplier: String(row.supplier ?? row.supplierName ?? row.supplier_name ?? ''),
        dates: String(row.dates ?? row.serviceDates ?? row.service_dates ?? ''),
        status: String(row.status ?? 'PENDING').toUpperCase()
      };
    }

    function normalizeMessage(row) {
      return {
        id: idOf(row.id ?? row.messageId ?? row.message_id),
        time: String(row.time ?? row.sentAt ?? row.sent_at ?? ''),
        recipient: String(row.recipient ?? row.recipientName ?? row.recipient_name ?? ''),
        channel: String(row.channel ?? ''),
        subject: String(row.subject ?? ''),
        status: String(row.status ?? row.deliveryStatus ?? row.delivery_status ?? 'PENDING').toUpperCase(),
        read: String(row.read ?? row.readStatus ?? row.read_status ?? 'UNREAD').toUpperCase()
      };
    }

    function normalizeAudit(row) {
      return {
        id: idOf(row.id ?? row.auditId ?? row.audit_id),
        time: String(row.time ?? row.createdAt ?? row.created_at ?? ''),
        action: String(row.action ?? row.eventType ?? row.event_type ?? ''),
        details: String(row.details ?? row.description ?? ''),
        status: String(row.status ?? 'SUCCESS').toUpperCase()
      };
    }

    function normalizeJurisdictions(value) {
      if (!Array.isArray(value)) return asObject(value);
      return value.reduce((result, row) => {
        const code = idOf(row.baseCode ?? row.base_code ?? row.code ?? row.id);
        if (!code) return result;
        result[code] = {
          name: String(row.name ?? row.title ?? code),
          maxDuty7: Number(row.maxDuty7 ?? row.max_duty_7 ?? row.maxHours7Days ?? row.max_hours_7_days ?? 0),
          maxFlight28: Number(row.maxFlight28 ?? row.max_flight_28 ?? row.maxHours28Days ?? row.max_hours_28_days ?? 0),
          maxFlight365: Number(row.maxFlight365 ?? row.max_flight_365 ?? row.maxHours365Days ?? row.max_hours_365_days ?? 0),
          minRest: Number(row.minRest ?? row.min_rest ?? row.minimumRestHours ?? row.minimum_rest_hours ?? 0),
          annualVacation: Number(row.annualVacation ?? row.annual_vacation ?? row.annualVacationDays ?? row.annual_vacation_days ?? 0)
        };
        return result;
      }, {});
    }

    function applyBootstrap(rawPayload) {
      const payload = asObject(rawPayload?.bootstrap ?? rawPayload?.data ?? rawPayload);
      const assignments = asArray(payload.assignments);
      const staff = asArray(payload.staff ?? payload.crewData ?? payload.employees);
      STATE.windowStart = payload.windowStart ?? payload.window_start ?? payload.window?.startAt ?? STATE.windowStart;
      STATE.crewData = staff.map(row => normalizeCrew(asObject(row), assignments));
      STATE.vacations = asArray(payload.vacations ?? payload.vacationRequests).map(row => normalizeVacation(asObject(row)));
      STATE.trades = asArray(payload.tripTrades ?? payload.trades).map(row => normalizeTrade(asObject(row)));
      STATE.logistics = asArray(payload.logistics).map(row => normalizeLogistics(asObject(row)));
      STATE.messages = asArray(payload.messages).map(row => normalizeMessage(asObject(row)));
      STATE.auditLog = asArray(payload.auditLog ?? payload.audit).map(row => normalizeAudit(asObject(row)));
      STATE.openTime = asArray(payload.openTime ?? payload.open_time);
      STATE.currentUser = asObject(payload.currentUser ?? payload.user ?? payload.profile);
      STATE.jurisdiction = String(payload.jurisdiction ?? STATE.jurisdiction ?? '');
      STATE.bases = asArray(payload.bases);
      STATE.roles = asArray(payload.roles);
      STATE.jurisdictions = normalizeJurisdictions(payload.jurisdictions);
      STATE.lastSyncAt = payload.syncedAt ?? payload.synced_at ?? new Date().toISOString();
      STATE.loading = false;
      STATE.initialized = true;
      hydrateFilters();
      hydrateProfile();
      renderApp();
      setSyncState('Live', 'ready');
      sendHeight();
    }

    function hydrateFilters() {
      const baseCodes = STATE.bases.length
        ? STATE.bases.map(base => idOf(base.code ?? base.baseCode ?? base.base_code ?? base.id)).filter(Boolean)
        : [...new Set(STATE.crewData.map(crew => crew.base).filter(Boolean))];
      const roles = STATE.roles.length
        ? STATE.roles.map(role => String(role.name ?? role.roleName ?? role.role_name ?? role.code ?? role.id ?? '')).filter(Boolean)
        : [...new Set(STATE.crewData.map(crew => crew.role).filter(Boolean))];
      STATE.filters.base = baseCodes;
      STATE.filters.role = roles;
      const baseContainer = document.getElementById('baseFilterContent');
      const roleContainer = document.getElementById('roleFilterContent');
      if (baseContainer) baseContainer.innerHTML = baseCodes.length
        ? baseCodes.map(code => `<label class="checkbox-row"><input type="checkbox" value="${escapeHtml(code)}" class="filter-base" checked onchange="handleFilterChange()"> <span>${escapeHtml(code)}</span></label>`).join('')
        : '<div class="empty-state">No bases available</div>';
      if (roleContainer) roleContainer.innerHTML = roles.length
        ? roles.map(role => `<label class="checkbox-row"><input type="checkbox" value="${escapeHtml(role)}" class="filter-role" checked onchange="handleFilterChange()"> <span>${escapeHtml(role)}</span></label>`).join('')
        : '<div class="empty-state">No roles available</div>';
    }

    function hydrateProfile() {
      const user = STATE.currentUser;
      const setValue = (id, value) => { const element = document.getElementById(id); if (element) element.value = value ?? ''; };
      setValue('profileAgentId', user.agentId ?? user.agent_id ?? user.skId ?? user.sk_id);
      setValue('profileFullName', user.fullName ?? user.full_name ?? user.name);
      setValue('profileRole', user.roleName ?? user.role_name ?? user.role);
      setValue('profileEmail', user.email);
      const settings = asObject(user.settings ?? STATE.settings);
      if (settings.theme === 'light') document.body.classList.add('theme-high-contrast');
      else document.body.classList.remove('theme-high-contrast');
    }

    window.addEventListener('message', event => {
      if (event.source !== window.parent) return;
      const message = asObject(event.data);
      if (message.source && message.source !== OPS_PARENT) return;
      if (message.type === 'OPS_BOOTSTRAP' || message.type === 'OPS_STATE') {
        applyBootstrap(message.payload);
        return;
      }
      if (message.type === 'OPS_REFRESH') {
        requestBootstrap('HOST_REFRESH');
        return;
      }
      if (message.type === 'OPS_ACTION_RESULT') {
        const payload = asObject(message.payload);
        const pending = STATE.pendingActions.get(payload.requestId);
        STATE.pendingActions.delete(payload.requestId);
        if (payload.ok === false) {
          setSyncState('Error', 'error');
          showToast(payload.error?.message ?? payload.message ?? 'Operation failed.', 'error');
          return;
        }
        closeModal(false);
        if (pending?.successMessage) showToast(pending.successMessage, 'success');
        if (payload.bootstrap || payload.data || payload.staff) applyBootstrap(payload.bootstrap ?? payload.data ?? payload);
        else requestBootstrap('ACTION_COMPLETE');
        return;
      }
      if (message.type === 'OPS_ERROR') {
        const requestId = message.payload?.requestId;
        if (requestId) STATE.pendingActions.delete(requestId);
        STATE.loading = false;
        setSyncState('Error', 'error');
        showToast(message.payload?.message ?? 'OPS synchronization failed.', 'error');
      }
    });

    document.documentElement.style.setProperty('--hour-px', `${STATE.zoomLevel}px`);

    function renderApp() {
      const rosterBody = document.getElementById('rosterBody');
      const ganttRowsContainer = document.getElementById('ganttRowsContainer');
      const ganttHeader = document.getElementById('ganttHeader');
      const alertBadge = document.getElementById('alertBadge');
      
      if(rosterBody) rosterBody.innerHTML = ''; 
      if(ganttRowsContainer) ganttRowsContainer.innerHTML = '';
      hidePopover();
      hideContextMenu();

      if(ganttHeader) {
        const start = new Date(STATE.windowStart);
        start.setUTCDate(start.getUTCDate() + STATE.currentDateOffset);
        const formatter = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
        ganttHeader.innerHTML = Array.from({ length: 8 }, (_, index) => {
          const day = new Date(start);
          day.setUTCDate(day.getUTCDate() + index);
          return `<div class="gantt-day-col">${escapeHtml(formatter.format(day))}</div>`;
        }).join('');
      }

      const filteredData = STATE.crewData.filter(crew => {
        const matchSearch = crew.name.toLowerCase().includes(STATE.filters.search) || crew.role.toLowerCase().includes(STATE.filters.search) || crew.base.toLowerCase().includes(STATE.filters.search);
        const matchRole = STATE.filters.role.length === 0 || STATE.filters.role.includes(crew.role);
        const matchBase = STATE.filters.base.length === 0 || STATE.filters.base.includes(crew.base);

        const jRules = STATE.jurisdictions[crew.base] || {};
        const p7 = jRules.maxDuty7 ? (crew.ftl.d7 / jRules.maxDuty7) * 100 : 0;
        const p28 = jRules.maxFlight28 ? (crew.ftl.f28 / jRules.maxFlight28) * 100 : 0;
        const p365 = jRules.maxFlight365 ? (crew.ftl.f365 / jRules.maxFlight365) * 100 : 0;

        let compStatus = 'Legal';
        if (p7 > 100 || p28 > 100 || p365 > 100 || crew.acts.some(a => a.type === 'disrupted')) compStatus = 'Violation';
        else if (p7 > 90 || p28 > 90 || p365 > 90 || crew.alert === 'warn') compStatus = 'Warning';

        const matchComp = STATE.filters.compliance.includes(compStatus);
        return matchSearch && matchRole && matchBase && matchComp;
      });

      filteredData.forEach(crew => {
        if(!rosterBody || !ganttRowsContainer) return;
        const rRow = document.createElement('div');
        rRow.className = 'roster-row';
        rRow.dataset.crewId = crew.id;
        
        let alertIcon = '';
        if (crew.alert === 'danger') alertIcon = '<span class="alert-icon">▲</span>';
        if (crew.alert === 'warn') alertIcon = '<span class="alert-icon alert-warn">▲</span>';
        let nameTitle = STATE.markTitles && crew.role === 'Driver' ? `[DRV] ${crew.name}` : crew.name;

        rRow.innerHTML = `
          <div class="col-icon"><div class="crew-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="1.2em" height="1.2em">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
            </svg>
          </div></div>
          <div class="col-ci"><div class="checkin-dot ${crew.checkin}"></div></div>
          <div class="col-name" title="${escapeHtml(nameTitle)}">${escapeHtml(nameTitle)} ${alertIcon}</div>
          <div class="col-flight"><span class="flight-tag ${escapeHtml(crew.badge)}">${escapeHtml(crew.assigned)}</span></div>
          <div class="col-role">${escapeHtml(crew.role)}</div>
          <div class="col-cost">${escapeHtml(crew.base)}</div>
        `;
        rosterBody.appendChild(rRow);

        const gRow = document.createElement('div');
        gRow.className = 'gantt-row';
        gRow.dataset.crewId = crew.id;

        crew.acts.forEach(act => {
          if (!STATE.filters.activities.includes(act.type)) return;

          const bar = document.createElement('div');
          bar.className = `activity-bar bg-${act.type}`;
          if (act.type === 'sby' && act.isCalloutCandidate) bar.classList.add('standby-pulse');
          
          bar.style.left = `calc(var(--hour-px) * ${act.startH})`;
          bar.style.width = `calc(var(--hour-px) * ${act.durH})`;
          bar.textContent = act.label;

          bar.addEventListener('click', (e) => handleBarClick(e, crew, act));
          
          gRow.appendChild(bar);
        });

        [rRow, gRow].forEach(el => {
          el.addEventListener('mouseenter', () => highlightRow(crew.id, true));
          el.addEventListener('mouseleave', () => highlightRow(crew.id, false));
        });

        ganttRowsContainer.appendChild(gRow);
      });

      const hasAlerts = STATE.crewData.some(c => c.acts.some(a => a.type === 'disrupted') || c.alert === 'danger');
      if(alertBadge) alertBadge.style.display = hasAlerts ? 'block' : 'none';

      if (STATE.initialized && filteredData.length === 0 && rosterBody) {
        rosterBody.innerHTML = '<div class="empty-state">No staff or assignments match the current scope.</div>';
      }
      
      updateNowLine();
      renderAlertsDrawer();
      renderFTL();
      renderVacation();
      renderTripTrades();
      renderLogistics();
      renderMessages();
      renderAudit();
      renderOpenTime();
      
      const windowStart = new Date(STATE.windowStart);
      windowStart.setUTCDate(windowStart.getUTCDate() + STATE.currentDateOffset);
      const windowEnd = new Date(windowStart);
      windowEnd.setUTCDate(windowEnd.getUTCDate() + 7);
      const formatter = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' });
      document.getElementById('dateWindowSpan').textContent = `${formatter.format(windowStart)} - ${formatter.format(windowEnd)}`;
    }

    function zoomGantt(direction) {
      if (direction === 'in') STATE.zoomLevel = Math.min(STATE.zoomLevel * 1.5, 30);
      if (direction === 'out') STATE.zoomLevel = Math.max(STATE.zoomLevel / 1.5, 3);
      document.documentElement.style.setProperty('--hour-px', `${STATE.zoomLevel}px`);
    }
    
    function zoomGanttFromSettings(val) {
      STATE.zoomLevel = parseFloat(val);
      document.documentElement.style.setProperty('--hour-px', `${STATE.zoomLevel}px`);
      showToast(`Timeline zoom updated to ${val}px/hr`);
    }
    
    function shiftDate(dir) {
      const start = new Date(STATE.windowStart);
      start.setUTCDate(start.getUTCDate() + dir);
      STATE.windowStart = start.toISOString();
      STATE.currentDateOffset = 0;
      requestBootstrap('DATE_WINDOW_CHANGED');
    }

    function saveSettings() {
      const themeVal = document.getElementById('settingTheme').value;
      if (themeVal === 'light') document.body.classList.add('theme-high-contrast');
      else document.body.classList.remove('theme-high-contrast');
      zoomGanttFromSettings(document.getElementById('settingZoom').value);
      showToast('Display settings applied for this session.', 'success');
    }

   function togglePane(pane) {
      // Define the SVGs as variables so we can swap them easily
      const svgLeft = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="1.2em" height="1.2em"><path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6z"/></svg>`;
      const svgRight = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="1.2em" height="1.2em"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/></svg>`;

      if (pane === 'roster') {
        STATE.rosterCollapsed = !STATE.rosterCollapsed;
        const p = document.getElementById('rosterPane');
        const h = p.querySelector('.pane-handle');
        if (STATE.rosterCollapsed) { p.classList.add('collapsed'); h.innerHTML = svgRight; } 
        else { p.classList.remove('collapsed'); h.innerHTML = svgLeft; }
      } else if (pane === 'filters') {
        STATE.filtersCollapsed = !STATE.filtersCollapsed;
        const p = document.getElementById('filterSidebar');
        const w = document.getElementById('filterSidebarWrapper');
        const h = w.querySelector('.pane-handle');
        if (STATE.filtersCollapsed) { p.classList.add('collapsed'); h.innerHTML = svgLeft; } 
        else { p.classList.remove('collapsed'); h.innerHTML = svgRight; }
      }
      setTimeout(() => syncScroll(document.getElementById('ganttBody'), 'horizontal'), 350);
    }

    function toggleOpenTime() {
      document.getElementById('openTimeTray').classList.toggle('open');
      requestAnimationFrame(sendHeight);
    }

    function switchView(viewId, navElement) {
      document.querySelectorAll('.nav-icon').forEach(n => n.classList.remove('active'));
      if(navElement) navElement.classList.add('active');
      else {
        const match = document.getElementById(`nav${viewId.split('-')[1].charAt(0).toUpperCase() + viewId.split('-')[1].slice(1)}`);
        if(match) match.classList.add('active');
      }
      
      document.querySelectorAll('.view-container').forEach(v => v.classList.remove('active'));
      document.getElementById(viewId).classList.add('active');
      hidePopover(); hideContextMenu();
      requestAnimationFrame(sendHeight);
    }

    function highlightRow(id, active) {
      const r = document.querySelector(`.roster-row[data-crew-id="${id}"]`);
      const g = document.querySelector(`.gantt-row[data-crew-id="${id}"]`);
      if(r) active ? r.classList.add('selected') : r.classList.remove('selected');
      if(g) active ? g.classList.add('selected') : g.classList.remove('selected');
    }

    let isSyncingLeft = false, isSyncingRight = false;
    function syncScroll(source, mode) {
      hidePopover(); hideContextMenu();
      const roster = document.getElementById('rosterBody');
      const gantt = document.getElementById('ganttBody');
      if (!roster || !gantt) return;
      if (mode === 'vertical' || mode === 'both') {
        if (source === roster && !isSyncingLeft) { isSyncingRight = true; gantt.scrollTop = roster.scrollTop; }
        else if (source === gantt && !isSyncingRight) { isSyncingLeft = true; roster.scrollTop = gantt.scrollTop; }
        isSyncingLeft = isSyncingRight = false;
      }
    }

    function updateNowLine() {
      const now = new Date();
      const start = new Date(STATE.windowStart);
      start.setUTCDate(start.getUTCDate() + STATE.currentDateOffset);
      const offsetHours = (now.getTime() - start.getTime()) / 3600000;
      const nLine = document.getElementById('nowLine');
      const nTag = document.getElementById('nowTag');
      if(nLine && nTag) {
        const visible = offsetHours >= 0 && offsetHours <= 192;
        nLine.style.display = visible ? 'block' : 'none';
        nTag.style.display = visible ? 'block' : 'none';
        nLine.style.left = `calc(var(--hour-px) * ${offsetHours})`;
        nTag.style.left = `calc(var(--hour-px) * ${offsetHours})`;
      }
    }

    function showPopover(e, crew, act) {
      if (document.getElementById('contextMenu').classList.contains('visible')) return; 
      
      document.getElementById('popTitle').innerHTML = `<span>${act.label || act.type.toUpperCase()}</span><span class="j-badge ${act.status==='ON-TIME'?'green':act.status==='STANDBY'?'yellow':'red'}" style="font-size:8px">${act.status}</span>`;
      document.getElementById('popStatus').textContent = act.status;
      document.getElementById('popCrew').textContent = crew.name;
      document.getElementById('popType').textContent = act.type.toUpperCase();
      document.getElementById('popDur').textContent = `${act.durH} Hours`;

      const rect = e.target.getBoundingClientRect();
      const ganttRect = document.getElementById('ganttBody').getBoundingClientRect();
      let top = rect.bottom - ganttRect.top + document.getElementById('ganttBody').scrollTop + 5;
      let left = rect.left - ganttRect.left + document.getElementById('ganttBody').scrollLeft;

      if (left + 240 > document.getElementById('ganttBody').scrollWidth) left = left - 240 + rect.width;
      
      const popover = document.getElementById('popover');
      popover.style.top = `${top}px`;
      popover.style.left = `${left}px`;
      popover.classList.add('visible');
    }

    function hidePopover() { document.getElementById('popover').classList.remove('visible'); }

    function handleBarClick(e, crew, act) {
      e.stopPropagation();
      hidePopover();
      
      if (STATE.editMode) {
        openEditModal(crew.id, act.id);
        return;
      }

      const menu = document.getElementById('contextMenu');
      menu.innerHTML = '';
      
      const addMenuItem = (text, icon, action) => {
        const div = document.createElement('div');
        div.className = 'context-menu-item';
        div.innerHTML = `<span>${icon}</span> <span>${text}</span>`;
        div.onclick = (ev) => { ev.stopPropagation(); hideContextMenu(); action(); };
        menu.appendChild(div);
      };

      addMenuItem('Edit Assignment', '✏️', () => openEditModal(crew.id, act.id));
      if (act.type === 'sby') addMenuItem('Activate Standby', '📞', () => openStandbyModal(crew.id, act.id));
      
      menu.appendChild(document.createElement('div')).className = 'context-menu-divider';
      addMenuItem('Acknowledge Alert', '✅', () => dispatchAction('ACKNOWLEDGE_ALERT', {
        sourceId: act.sourceId,
        sourceTable: act.sourceTable,
        jurisdiction: STATE.jurisdiction
      }, 'Alert acknowledged.'));

      const rect = e.target.getBoundingClientRect();
      const ganttRect = document.getElementById('ganttBody').getBoundingClientRect();
      let top = rect.bottom - ganttRect.top + document.getElementById('ganttBody').scrollTop;
      let left = rect.left - ganttRect.left + document.getElementById('ganttBody').scrollLeft;
      
      if (left + 200 > document.getElementById('ganttBody').scrollWidth) left = left - 200 + rect.width;
      
      menu.style.top = `${top}px`;
      menu.style.left = `${left}px`;
      menu.classList.add('visible');
    }

    function hideContextMenu() { document.getElementById('contextMenu').classList.remove('visible'); }
    
    document.addEventListener('click', (e) => {
      if(!e.target.classList.contains('activity-bar')) {
        hidePopover(); hideContextMenu();
      }
    });

    function toggleEditMode() {
      STATE.editMode = !STATE.editMode;
      const btn = document.getElementById('btnEditMode');
      const badge = document.getElementById('editBadge');
      if (STATE.editMode) {
        btn.classList.add('active-toggle'); badge.style.display = 'inline-block';
        document.body.classList.add('edit-mode');
        showToast('Operation Edit Mode Enabled', 'success');
      } else {
        btn.classList.remove('active-toggle'); badge.style.display = 'none';
        document.body.classList.remove('edit-mode');
        showToast('Edit Mode Disabled');
      }
    }

    function toggleMarkTitles() {
      STATE.markTitles = !STATE.markTitles;
      const btn = document.getElementById('btnMarkTitles');
      STATE.markTitles ? btn.classList.add('active-toggle') : btn.classList.remove('active-toggle');
      renderApp();
    }

    function openEditModal(crewId, actId) {
      const crew = STATE.crewData.find(c => c.id === crewId);
      const act = crew.acts.find(a => a.id === actId);
      if (!act) return;
      STATE.selectedCrewId = crewId; STATE.selectedActId = actId;
      document.getElementById('editLabel').value = act.label;
      document.getElementById('editType').value = act.type;
      document.getElementById('editStatus').value = act.status;
      showModal('editModal');
    }

    function saveAssignment() {
      const crew = STATE.crewData.find(c => c.id === STATE.selectedCrewId);
      const act = crew?.acts.find(a => a.id === STATE.selectedActId);
      if (!crew || !act) return showToast('Assignment is no longer available.', 'error');
      dispatchAction('UPDATE_ASSIGNMENT', {
        sourceId: act.sourceId,
        sourceTable: act.sourceTable,
        label: document.getElementById('editLabel').value.trim(),
        type: document.getElementById('editType').value,
        status: document.getElementById('editStatus').value,
        jurisdiction: STATE.jurisdiction
      }, 'Assignment updated.');
    }

    function openStandbyModal(crewId, actId) {
      STATE.selectedCrewId = crewId; STATE.selectedActId = actId;
      document.getElementById('sbyFlightNum').value = '';
      showModal('standbyModal');
    }

    function executeStandbyCallout() {
      const flightNum = document.getElementById('sbyFlightNum').value.trim();
      const type = document.getElementById('sbyType').value;
      const crew = STATE.crewData.find(c => c.id === STATE.selectedCrewId);
      const act = crew?.acts.find(a => a.id === STATE.selectedActId);
      if (!crew || !act || !flightNum) return showToast('Enter an operation reference.', 'error');
      dispatchAction('ACTIVATE_STANDBY', {
        sourceId: act.sourceId,
        sourceTable: act.sourceTable,
        label: flightNum,
        activityType: type,
        jurisdiction: STATE.jurisdiction
      }, `${crew.name} assigned to ${flightNum}.`);
    }
    
    function openMessageModal() {
        if (STATE.crewData.length === 0) return showToast('No staff are available.', 'error');
        const select = document.getElementById('msgRecipientSelect');
        if(select) {
            select.innerHTML = STATE.crewData.map(c => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.name)} (${escapeHtml(c.role)})</option>`).join('');
        }
        document.getElementById('msgSubject').value = '';
        document.getElementById('msgBody').value = '';
        showModal('messageModal');
    }
    
    function sendMessage() {
        showToast('Operational messaging is managed in GroupTalk.', 'error');
    }

    function openOptimizerModal() {
      const disruptions = STATE.crewData.flatMap(c => c.acts.filter(a => a.type === 'disrupted'));
      if (disruptions.length === 0) return showToast('System is stable. No conflicts to resolve.', 'success');
      
      showModal('optimizerModal');
      const consoleBox = document.getElementById('optConsole');
      const progressText = document.getElementById('optProgressText');
      const closeBtn = document.getElementById('btnOptClose');
      
      consoleBox.innerHTML = '<div class="console-line info">&gt; Optimization request sent to OPS backend…</div>';
      progressText.textContent = 'RUNNING';
      closeBtn.style.display = 'none';
      dispatchAction('OPTIMIZE', {
        windowStart: STATE.windowStart,
        dateOffset: STATE.currentDateOffset,
        jurisdiction: STATE.jurisdiction
      }, 'Optimization completed.');
    }

    function handleFilterChange() {
      STATE.filters.search = document.getElementById('searchInput').value.toLowerCase();
      STATE.filters.base = Array.from(document.querySelectorAll('.filter-base:checked')).map(c => c.value);
      STATE.filters.role = Array.from(document.querySelectorAll('.filter-role:checked')).map(c => c.value);
      STATE.filters.compliance = Array.from(document.querySelectorAll('.filter-comp:checked')).map(c => c.value);
      STATE.filters.activities = Array.from(document.querySelectorAll('.filter-act:checked')).map(c => c.value);
      renderApp();
    }

    function toggleSection(headerEl) {
      const content = headerEl.nextElementSibling;
      const icon = headerEl.querySelector('span:last-child');
      if (content.style.display === 'none') { content.style.display = 'block'; icon.textContent = '▼'; } 
      else { content.style.display = 'none'; icon.textContent = '▶'; }
    }

    function resetFilters() {
      document.getElementById('searchInput').value = '';
      document.querySelectorAll('.filter-sidebar input[type="checkbox"]').forEach(c => c.checked = true);
      handleFilterChange(); showToast('Filters Reset');
    }

    function renderFTL() {
      const tbody = document.getElementById('ftlTableBody');
      if(!tbody) return;
      if (STATE.crewData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No compliance records available.</td></tr>';
        return;
      }
      tbody.innerHTML = STATE.crewData.map(c => {
        const jRules = STATE.jurisdictions[c.base] || {};
        const rawP7 = jRules.maxDuty7 ? (c.ftl.d7 / jRules.maxDuty7) * 100 : 0;
        const rawP28 = jRules.maxFlight28 ? (c.ftl.f28 / jRules.maxFlight28) * 100 : 0;
        const rawP365 = jRules.maxFlight365 ? (c.ftl.f365 / jRules.maxFlight365) * 100 : 0;
        const p7 = Math.min(100, rawP7);
        const p28 = Math.min(100, rawP28);
        const p365 = Math.min(100, rawP365);
        
        let status = '<span class="j-badge green">LEGAL</span>';
        if (rawP7 > 100 || rawP28 > 100 || rawP365 > 100 || c.acts.some(a => a.type === 'disrupted')) {
            status = '<span class="j-badge red">VIOLATION</span>';
        } else if (p7 > 90 || p28 > 90 || p365 > 90 || c.alert === 'warn') {
            status = '<span class="j-badge yellow">WARNING</span>';
        }

        return `<tr><td><b>${escapeHtml(c.name)}</b></td><td>${escapeHtml(c.base)}</td><td>${escapeHtml(c.role)}</td>
          <td>${c.ftl.d7}h <div class="ftl-progress-bg"><div class="ftl-progress-fg" style="width:${p7}%; background: ${p7>90?'var(--bar-disruption)':'var(--j-accent)'}"></div></div></td>
          <td>${c.ftl.f28}h <div class="ftl-progress-bg"><div class="ftl-progress-fg" style="width:${p28}%; background: ${p28>90?'var(--bar-disruption)':'var(--j-accent)'}"></div></div></td>
          <td>${c.ftl.f365}h <div class="ftl-progress-bg"><div class="ftl-progress-fg" style="width:${p365}%; background: ${p365>90?'var(--bar-disruption)':'var(--j-accent)'}"></div></div></td>
          <td>${escapeHtml(jRules.name ?? 'Not configured')}</td><td>${status}</td></tr>`;
      }).join('');
    }

    function renderVacation() {
      const tbody = document.getElementById('vacationTableBody');
      if(!tbody) return;
      
      window.approveVac = function(id) {
          const v = STATE.vacations.find(x => x.id === id);
          if (!v) return showToast('Vacation request is no longer available.', 'error');
          dispatchAction('APPROVE_VACATION', {
            sourceId: v.sourceId,
            requestId: v.id,
            jurisdiction: STATE.jurisdiction
          }, `Vacation ${id} approved.`);
      };

      if (STATE.vacations.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No vacation requests available.</td></tr>';
      } else {
      tbody.innerHTML = STATE.vacations.map(v => {
        const jRules = STATE.jurisdictions[v.base] || {};
        return `<tr><td><b>${escapeHtml(v.id)}</b></td><td>${escapeHtml(v.name)}</td><td>${escapeHtml(v.base)}</td><td>${escapeHtml(v.period)}</td><td>${escapeHtml(v.days)} Days</td><td>${escapeHtml(jRules.name ?? 'Not configured')}</td><td><span class="j-badge ${v.status==='APPROVED'?'green':'yellow'}">${escapeHtml(v.status)}</span></td><td>${v.status === 'PENDING REVIEW' ? `<button class="btn primary" onclick="approveVac('${escapeHtml(v.id)}')">Approve</button>` : '<span style="color:var(--j-text-muted)">Locked</span>'}</td></tr>`;
      }).join('');
      }

      const staffSelect = document.getElementById('vacStaffSelect');
      if(staffSelect) {
          staffSelect.innerHTML = STATE.crewData.map(c => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.name)} (${escapeHtml(c.base)})</option>`).join('');
      }
    }

    function renderTripTrades() {
      const tbody = document.getElementById('tradeTableBody');
      if(!tbody) return;

      window.approveTrade = function(id) {
          const t = STATE.trades.find(x => x.id === id);
          if (!t) return showToast('TripTrade request is no longer available.', 'error');
          dispatchAction('APPROVE_TRIP_TRADE', {
            sourceId: t.sourceId,
            requestId: t.id,
            jurisdiction: STATE.jurisdiction
          }, `Trade ${id} approved.`);
      };

      if (STATE.trades.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No TripTrade requests available.</td></tr>';
        return;
      }
      tbody.innerHTML = STATE.trades.map(t => {
        const crewAObj = STATE.crewData.find(c => c.name === t.crewA);
        const jRules = crewAObj ? (STATE.jurisdictions[crewAObj.base]?.name ?? 'Not configured') : 'Checked';
        return `<tr><td><b>${escapeHtml(t.id)}</b></td><td>${escapeHtml(t.crewA)}</td><td>${escapeHtml(t.crewB)}</td><td>${escapeHtml(t.details)}</td><td><span class="j-badge green">${escapeHtml(jRules)} OK</span></td><td>${escapeHtml(String(t.status ?? '').replace('_', ' '))}</td><td>${t.status === 'AWAITING_OCC' ? `<button class="btn primary" onclick="approveTrade('${escapeHtml(t.id)}')">Approve</button>` : '<span style="color:var(--j-text-muted)">Processed</span>'}</td></tr>`;
      }).join('');
    }

    function renderLogistics() {
      const tbody = document.getElementById('logisticsTableBody');
      if(!tbody) return;
      
      window.toggleLogistic = function(id) {
          showToast('Logistics updates are read-only in this OPS backend.', 'error');
      }
      if (STATE.logistics.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No logistics records available.</td></tr>';
        return;
      }
      tbody.innerHTML = STATE.logistics.map(l => `<tr><td><b>${escapeHtml(l.id)}</b></td><td>${escapeHtml(l.name)}</td><td>${escapeHtml(l.loc)}</td><td>${escapeHtml(l.supplier)}</td><td>${escapeHtml(l.dates)}</td><td><span class="j-badge ${l.status==='CONFIRMED'?'green':'yellow'}">${escapeHtml(l.status)}</span></td><td><span style="color:var(--j-text-muted)">Read only</span></td></tr>`).join('');
    }

    function renderMessages() {
      const tbody = document.getElementById('messagesTableBody');
      if(!tbody) return;
      
      window.readMsg = function(id) {
          showToast('Message receipts are managed in GroupTalk.', 'error');
      }
      if (STATE.messages.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No operational messages available.</td></tr>';
        return;
      }
      tbody.innerHTML = STATE.messages.map(m => `<tr><td>${escapeHtml(m.time)}</td><td><b>${escapeHtml(m.recipient)}</b></td><td>${escapeHtml(m.channel)}</td><td>${escapeHtml(m.subject)}</td><td><span class="j-badge green">${escapeHtml(m.status)}</span></td><td><span class="j-badge ${m.read==='READ'?'green':'red'}">${escapeHtml(m.read)}</span></td><td><span style="color:var(--j-text-muted)">Read only</span></td></tr>`).join('');
    }

    function renderBidding() {
      const tbody = document.getElementById('biddingTableBody');
      if(!tbody) return;
      tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Bidding data is supplied by OPS.</td></tr>';
    }

    function renderAudit() {
      const tbody = document.getElementById('auditTableBody');
      if(!tbody) return;
      if (STATE.auditLog.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="empty-state">No audit records available.</td></tr>';
        return;
      }
      tbody.innerHTML = STATE.auditLog.map(log => `<tr><td>${escapeHtml(log.time)}</td><td><b>${escapeHtml(log.action)}</b></td><td>${escapeHtml(log.details)}</td><td><span class="j-badge green">${escapeHtml(log.status)}</span></td></tr>`).join('');
    }

    function openVacationModal() {
      if (STATE.crewData.length === 0) return showToast('No staff are available.', 'error');
      showModal('vacationModal');
    }
    function submitVacationRequest() {
      const staffSelect = document.getElementById('vacStaffSelect');
      const staffId = staffSelect.value;
      const staff = STATE.crewData.find(c => c.id === staffId);
      const startDate = document.getElementById('vacStart').value;
      const endDate = document.getElementById('vacEnd').value;
      if (!staff || !startDate || !endDate || Date.parse(endDate) < Date.parse(startDate)) {
        return showToast('Select a staff member and a valid date range.', 'error');
      }
      dispatchAction('CREATE_VACATION_REQUEST', {
        agentId: staff.agentId,
        startDate,
        endDate
      }, `Vacation requested for ${staff.name}.`);
    }

    let alertsOpen = false;
    function toggleAlerts() {
      alertsOpen = !alertsOpen;
      const drawer = document.getElementById('alertsDrawer');
      const btn = document.getElementById('btnAlerts');
      if (alertsOpen) { drawer.classList.add('open'); btn.classList.add('active'); } 
      else { drawer.classList.remove('open'); btn.classList.remove('active'); }
    }

    function renderAlertsDrawer() {
      const list = document.getElementById('alertList');
      if(!list) return;
      list.innerHTML = ''; let hasAlert = false;
      STATE.crewData.forEach(crew => {
        crew.acts.forEach(act => {
          if (act.type === 'disrupted' || (act.type === 'sby' && act.isCalloutCandidate)) {
            hasAlert = true; const isCallout = act.type === 'sby';
            const card = document.createElement('div');
            card.className = `alert-card ${isCallout ? 'warning' : ''}`;
            card.innerHTML = `<div class="alert-title">${isCallout ? 'STANDBY CALLOUT REQUIRED' : (act.label || 'Violation')}</div><div class="alert-desc">Staff: ${crew.name}<br>Status: ${act.status}</div><div style="font-size:10px; color:var(--j-accent);">CLICK TO RESOLVE</div>`;
            card.onclick = () => { if (window.innerWidth <= 900) toggleAlerts(); switchView('view-tracking', document.getElementById('navTracking')); document.getElementById('searchInput').value = crew.name; handleFilterChange(); if (isCallout) openStandbyModal(crew.id, act.id); };
            list.appendChild(card);
          }
        });
      });
      if (!hasAlert) list.innerHTML = '<div style="color:var(--j-text-muted); text-align:center; padding: 20px;">No active alerts. System nominal.</div>';
    }

    function toggleFiltersMobile() { document.getElementById('filterSidebarWrapper').classList.toggle('open'); }

    function showModal(id) { document.querySelectorAll('.modal').forEach(m => m.style.display = 'none'); document.getElementById('modalOverlay').classList.add('visible'); document.getElementById(id).style.display = 'block'; requestAnimationFrame(sendHeight); }
    function closeModal(shouldRender = true) { document.getElementById('modalOverlay').classList.remove('visible'); if (shouldRender) renderApp(); requestAnimationFrame(sendHeight); }
    function closeModalOnBgClick(e) { if (e.target.id === 'modalOverlay') closeModal(); }

    function showToast(message, type = 'normal') {
      const container = document.getElementById('toastContainer');
      if(!container) return;
      const toast = document.createElement('div'); toast.className = `toast ${type}`;
      toast.innerHTML = `<span>${message}</span><button onclick="this.parentElement.remove()">✕</button>`;
      container.appendChild(toast);
      setTimeout(() => { if (toast.parentElement) { toast.style.opacity = '0'; toast.style.transform = 'translateX(100%)'; setTimeout(() => toast.remove(), 300); } }, 3000);
    }

    function renderOpenTime() {
      const container = document.getElementById('openTimeTrayBody');
      if (!container) return;
      if (STATE.openTime.length === 0) {
        container.innerHTML = '<div class="empty-state">No unassigned operations.</div>';
        return;
      }
      container.innerHTML = STATE.openTime.map(item => {
        const id = idOf(item.id ?? item.operationId ?? item.operation_id);
        const reference = item.reference ?? item.label ?? item.title ?? id;
        const route = item.route ?? item.location ?? item.description ?? '';
        const time = item.startAt ?? item.start_at ?? item.time ?? '';
        return `<div class="open-flight-card" onclick="selectOpenTime('${escapeHtml(id)}')"><div class="of-flight">${escapeHtml(reference)}</div><div class="of-route">${escapeHtml([route, time].filter(Boolean).join(' • '))}</div></div>`;
      }).join('');
    }

    function selectOpenTime(operationId) {
      const item = STATE.openTime.find(row => idOf(row.id ?? row.operationId ?? row.operation_id) === operationId);
      showToast(item ? `Selected ${item.label ?? item.reference ?? operationId}` : 'Open operation selected.');
    }

    window.onload = () => {
      renderApp();
      postToWix('OPS_READY', {
        version: 'V12-OPS-CONTROL-2026.10.14',
        contractVersion: 2,
        canonicalStaffId: 'agentId'
      });
      requestBootstrap('INITIAL_LOAD');
      setInterval(updateNowLine, 60000); // update now line every minute
      setInterval(() => { if (!STATE.loading && STATE.pendingActions.size === 0 && document.visibilityState === 'visible') requestBootstrap('PERIODIC_SYNC'); }, 60000);
    };
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible' || !STATE.lastSyncAt) return;
      if (Date.now() - Date.parse(STATE.lastSyncAt) > 60000) requestBootstrap('VISIBILITY_RESUME');
    });
  // V12 APP_VIEWPORT_ALTEA: Wix owns the fixed app region; no iframe height mutation.
  function sendHeight() {}
  </script>
</body>
</html>
```
