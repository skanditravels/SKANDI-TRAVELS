# INFO / LOG — ALTEA MYROSTER

- Source file: `/HTML_REF/altea/MyRoster.md`.
- Display name/system: MyRoster / ALTEA.
- System area: `ALTEA`; operational owner: OPS.
- Wix route: `/riaintra/success-factors/altea/my-roster`, owned by `public/siteMap.APP_ROUTES.myRoster`.
- Wix page controller: `/src/pages/MyRoster.l8p5m.js`.
- Wix HTML element: `#myRosterEmbed`.
- Page chrome: `APP_VIEWPORT_ALTEA`; ALTEA header and footer are selected by `masterPage.js` from the canonical route family.
- Brand logo: the app reads `brand.assets.logos.altea` from the `SKANDI_MASTER_CONFIG` message sent by `masterPage.js`; no logo URL is embedded in the app.
- Canonical web-method facade: `/src/backend/SKANDI_CORE/myRoster.web.js`.
- Canonical backend core: `/src/backend/SKANDI_CORE/myRoster.js`.
- Authentication and authorization: Wix Site Member boundary plus `requireStaffPortalSessionCore`; the staff profile must have an eligible field/destination role and an assigned field base. Existing `org_job_roles` / `org_bases` rows are used when present; authenticated staff-profile fields provide the role/base when those directories have no row. The bootstrap and flight search do not require a personal flight/roster assignment.
- Mobile behavior: viewports below 768px do not start the MyRoster bootstrap or request staff data. MyRoster is a desktop-only app.
- OPS workflow: MyRoster time-off and schedule-change requests are stored in `schedule_change_requests` under the authenticated staff ID. OPS Control queues and reviews them. Approved time off also writes the established `vacation_sick_leave_ledger`; approving a schedule-change request records the OPS decision but does not alter or publish a roster assignment.
- Supabase resources used: `org_job_roles`, `org_bases`, `roster_shifts`, `driver_assignments`, `tour_assignments`, `airport_duty_assignments`, `vehicle_assignments`, `roster_clock_events`, `schedule_change_requests`, `time_off_balances`, `roster_time_ledger`, `altea_fids_flights`, and `inventory_schedule_lines`. These were inspected read-only on 2026-10-28. `org_job_roles`, `org_bases`, FIDS, and schedule tables currently report zero rows; profile fallback supports eligible staff who already have role/base values, and flight search returns no results until the existing ALTEA flight feed populates FIDS or schedule records.
- Flight search: server-side query over ALTEA FIDS and active published schedule rows, bounded to a maximum 14-day date range. Search is independent of the employee's assignments and returns a limited flight projection.
- CARI / printable briefing card: draws only from the selected returned flight or the authenticated user's own roster assignment. It does not synthesize other crew, passenger, or booking information. Browser Print / Save as PDF produces an A4 print view.
- Message contract: HTML → Wix `MYROSTER_READY`, `MYROSTER_REFRESH_REQUEST`, `MYROSTER_FLIGHT_SEARCH_REQUEST`, `MYROSTER_CLOCK_EVENT_REQUEST`, `MYROSTER_TIMEOFF_REQUEST`, `MYROSTER_SHIFT_CHANGE_REQUEST`, `MYROSTER_NAVIGATE`, and `MASTER_CONFIG_REQUEST`; Wix → HTML `MYROSTER_BOOTSTRAP`, `MYROSTER_FLIGHT_SEARCH_RESULTS`, `MYROSTER_ACTION_OK`, `MYROSTER_ERROR`, and `SKANDI_MASTER_CONFIG`.
- Data source: live SKANDI/Supabase records only; the embed has no roster, flight, or crew simulator.
- Status: **STATICALLY VERIFIED — REQUIRES LIVE TEST**.
- Source baseline: repository `skanditravels/SKANDI-TRAVELS` main at `42b11a4c58e8f97fc6cfea20f46101f96ee86b66`; current MyRoster page/controller/core and ALTEA schemas inspected before changes.
- Last verified date: 2026-10-28.

## Change log

- 2026-10-28 — Added ALTEA route/chrome, desktop-only bootstrap gate, MasterPage logo binding, ALTEA flight search independent of staff assignments, and printable CARI briefing view.
- 2026-10-28 — Routed MyRoster staff requests to the OPS Control review queue using existing request and leave-ledger tables. No Supabase schema change.
- 2026-10-28 — Added a profile-based role/base fallback for empty organization directories, narrowed server-side flight search by the requested flight or airport code, and added MyRoster to ALTEA chrome navigation. The printable CARI logo uses the `masterPage.js` brand payload.

## COMPLETE HTML / SOURCE IMPLEMENTATION

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <meta name="theme-color" content="#082f5f">
  <title>ALTEA MyRoster</title>
  <style>#myRosterRoot{--mr-navy:#082f5f;--mr-navy-2:#124d83;--mr-blue:#1f6ba5;--mr-aqua:#54c4c3;--mr-canvas:#f2f6f8;--mr-surface:#fff;--mr-ink:#172b3d;--mr-muted:#617384;--mr-faint:#8795a3;--mr-border:#dce5eb;--mr-border-2:#c6d4de;--mr-good:#237b58;--mr-good-bg:#e9f6ef;--mr-warn:#9b6a0c;--mr-warn-bg:#fff5dd;--mr-bad:#a63d41;--mr-bad-bg:#fff0ef;--mr-radius:12px;--mr-shadow:0 2px 8px rgba(8,47,95,.045),0 12px 28px rgba(8,47,95,.035);box-sizing:border-box;min-height:560px;background:var(--mr-canvas);color:var(--mr-ink);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:14px;line-height:1.45}#myRosterRoot *{box-sizing:border-box}#myRosterRoot button,#myRosterRoot input,#myRosterRoot select,#myRosterRoot textarea{font:inherit}#myRosterRoot button{cursor:pointer}#myRosterRoot button:disabled{cursor:wait;opacity:.55}#myRosterRoot [hidden]{display:none!important}.mr-shell{min-height:560px}.mr-topbar{height:66px;position:sticky;top:0;z-index:30;display:flex;align-items:center;justify-content:space-between;gap:18px;padding:0 24px;background:var(--mr-navy);color:#fff;border-bottom:1px solid rgba(255,255,255,.12)}.mr-brand{display:flex;align-items:center;gap:11px;min-width:0}.mr-brand-mark{width:35px;height:35px;display:grid;place-items:center;border-radius:9px;background:#fff;color:var(--mr-navy);font-weight:950;font-size:20px;letter-spacing:-.07em}.mr-brand-name{font-size:13px;font-weight:900;letter-spacing:.09em;line-height:1.1}.mr-brand-name span{font-weight:650;color:#c8d9e8}.mr-brand-subtitle{margin-top:5px;font-size:9px;color:#c1d2e2;font-weight:800;letter-spacing:.12em}.mr-topbar-right{display:flex;align-items:center;gap:18px;min-width:0}.mr-sync{display:flex;align-items:center;gap:7px;color:#d4e2ee;font-size:10px;font-weight:700;white-space:nowrap}.mr-sync-dot,.mr-live-dot{width:7px;height:7px;border-radius:50%;background:#65d99b;box-shadow:0 0 0 3px rgba(101,217,155,.14)}.mr-sync[data-state="loading"] .mr-sync-dot{background:#ffc85c;box-shadow:0 0 0 3px rgba(255,200,92,.15)}.mr-sync[data-state="error"] .mr-sync-dot{background:#ff8e8e;box-shadow:0 0 0 3px rgba(255,142,142,.15)}.mr-profile{display:flex;align-items:center;gap:9px;min-width:0}.mr-avatar{width:34px;height:34px;display:grid;place-items:center;flex:0 0 34px;border:1px solid rgba(255,255,255,.24);border-radius:50%;background:#e6f0f6;color:var(--mr-navy);font-size:11px;font-weight:900}.mr-profile-copy{display:flex;flex-direction:column;min-width:0;line-height:1.2}.mr-profile-copy strong{max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px;font-weight:800}.mr-profile-copy span{margin-top:4px;color:#c3d5e4;font-size:9px;white-space:nowrap}.mr-layout{display:grid;grid-template-columns:228px minmax(0,1fr);min-height:calc(100vh - 66px)}.mr-sidebar{position:sticky;top:66px;align-self:start;display:flex;flex-direction:column;min-height:calc(100vh - 66px);padding:18px 13px;background:#edf3f6;border-right:1px solid var(--mr-border)}.mr-base-card{padding:13px 13px 12px;margin-bottom:22px;border:1px solid #d4e1e8;border-radius:10px;background:#fff;box-shadow:0 2px 7px rgba(8,47,95,.035)}.mr-overline{display:block;color:#788897;font-size:8.5px;font-weight:850;letter-spacing:.115em}.mr-base-card strong{display:block;margin-top:7px;color:var(--mr-navy);font-size:17px;line-height:1.15;letter-spacing:.02em}.mr-base-card>span:last-child{display:block;margin-top:4px;color:var(--mr-muted);font-size:10px}.mr-nav-title{padding:0 9px 7px;color:#7e8e9a;font-size:8.5px;font-weight:900;letter-spacing:.12em}.mr-nav{display:flex;flex-direction:column;gap:3px}.mr-nav-item{width:100%;display:flex;align-items:center;gap:10px;padding:10px 10px;border:0;border-radius:8px;background:transparent;color:#435a6d;text-align:left;text-decoration:none;font-size:11px;font-weight:750;transition:background .15s,color .15s}.mr-nav-item:hover{background:#e1ebf0;color:var(--mr-navy)}.mr-nav-item.active{background:#d9e9f3;color:var(--mr-navy);box-shadow:inset 3px 0 0 var(--mr-blue)}.mr-nav-icon{width:18px;flex:0 0 18px;color:#5281a1;text-align:center;font-size:15px;line-height:1}.mr-link-arrow{margin-left:auto;color:#7390a4;font-size:12px}.mr-sidebar-note{display:flex;gap:8px;align-items:flex-start;margin-top:auto;padding:11px 9px;border-top:1px solid #d8e2e8;color:#748492;font-size:9px;line-height:1.45}.mr-note-icon{width:15px;height:15px;flex:0 0 15px;display:grid;place-items:center;border:1px solid #aab9c5;border-radius:50%;font-size:9px;font-weight:800}.mr-main{min-width:0;padding:22px 24px 30px}.mr-view{display:none;max-width:1420px;margin:0 auto}.mr-view.active{display:block}.mr-page-head{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;margin-bottom:17px}.mr-page-head h1{margin:3px 0 4px;color:#102f4b;font-size:25px;line-height:1.12;letter-spacing:-.025em}.mr-page-head p{margin:0;color:var(--mr-muted);font-size:11px}.mr-kicker{color:#3f779f;font-size:8px;font-weight:900;letter-spacing:.15em}.mr-head-actions{display:flex;align-items:center;justify-content:flex-end;gap:8px;flex-wrap:wrap}.mr-btn{min-height:35px;display:inline-flex;align-items:center;justify-content:center;gap:7px;padding:8px 12px;border:1px solid transparent;border-radius:8px;font-size:10px;font-weight:850;white-space:nowrap;transition:background .16s,border-color .16s,transform .16s}.mr-btn:active{transform:translateY(1px)}.mr-btn-primary{background:var(--mr-navy);border-color:var(--mr-navy);color:#fff}.mr-btn-primary:hover{background:#104578;border-color:#104578}.mr-btn-secondary{background:#fff;border-color:var(--mr-border-2);color:#304b60}.mr-btn-secondary:hover{background:#f8fbfd;border-color:#a9bdca}.mr-text-btn{padding:3px 0;border:0;background:transparent;color:#28638f;font-size:9px;font-weight:800}.mr-text-btn span{margin-left:3px}.panel{border:1px solid var(--mr-border);border-radius:var(--mr-radius);background:var(--mr-surface);box-shadow:var(--mr-shadow)}.mr-alert{display:flex;align-items:center;gap:10px;margin-bottom:12px;padding:10px 12px;border:1px solid #f0d89e;border-radius:9px;background:var(--mr-warn-bg);color:#74520c;font-size:10px;font-weight:650}.mr-alert-mark{width:18px;height:18px;flex:0 0 18px;display:grid;place-items:center;border-radius:50%;background:#f4dfa9;color:#805909;font-size:11px;font-weight:900}.mr-next{display:grid;grid-template-columns:160px minmax(0,1fr) auto;align-items:center;gap:14px;margin-bottom:12px;padding:14px 16px}.mr-next-label{display:flex;align-items:center;gap:8px;color:#648093;font-size:8px;font-weight:900;letter-spacing:.13em;white-space:nowrap}.mr-next-label .mr-live-dot{width:6px;height:6px;box-shadow:0 0 0 3px rgba(101,217,155,.13)}.mr-next-content{min-width:0}.mr-next-empty{color:#768897;font-size:10px}.mr-next-main{display:flex;align-items:center;gap:11px;min-width:0}.mr-next-date{min-width:74px;padding-right:11px;border-right:1px solid var(--mr-border)}.mr-next-date strong{display:block;color:var(--mr-navy);font-size:18px;line-height:1.05}.mr-next-date span{display:block;margin-top:3px;color:#788a98;font-size:8px;font-weight:750}.mr-next-detail{min-width:0}.mr-next-detail strong{display:block;overflow:hidden;color:#203c54;font-size:12px;text-overflow:ellipsis;white-space:nowrap}.mr-next-detail span{display:block;margin-top:3px;overflow:hidden;color:var(--mr-muted);font-size:9px;text-overflow:ellipsis;white-space:nowrap}.mr-next-time{color:#254b69;font-variant-numeric:tabular-nums;font-size:10px;font-weight:850;white-space:nowrap}.mr-next-action{display:flex;gap:6px}.mr-next-action:empty{display:none}.mr-filter{margin-bottom:12px;padding:0 13px}.mr-filter-heading{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px solid #e9eff3}.mr-filter-heading>div:first-child{display:flex;flex-direction:column;gap:3px}.mr-filter-heading strong{font-size:10px;color:#2c455b}.mr-filter-heading span{color:#84929d;font-size:8.5px}.mr-filter-controls{display:flex;align-items:center;justify-content:flex-end;gap:8px;flex-wrap:wrap}.mr-field-inline{display:flex;align-items:center;gap:6px;color:#748492;font-size:9px;font-weight:750}.mr-field-inline input,.mr-select{height:30px;padding:5px 8px;border:1px solid var(--mr-border-2);border-radius:7px;background:#fff;color:#31495c;font-size:9px}.mr-field-inline input{width:132px}.mr-select{min-width:122px}.mr-filter-footer{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 0;color:#748390;font-size:9px}.mr-filter-footer b{color:#304b60;font-variant-numeric:tabular-nums}.mr-filter-footer span:last-child{color:#467b9b;font-weight:750}.mr-table-panel{overflow:hidden;margin-bottom:12px}.mr-table-wrap{width:100%;overflow:auto}.mr-table{width:100%;border-collapse:collapse;min-width:720px;background:#fff}.mr-table thead th{position:sticky;top:66px;z-index:2;padding:9px 11px;border-bottom:1px solid #d6e0e7;background:#f0f5f8;color:#607483;text-align:left;font-size:8px;font-weight:900;letter-spacing:.085em;white-space:nowrap}.mr-table tbody td{padding:9px 11px;border-bottom:1px solid #e8eef2;color:#455c6e;font-size:9.5px;vertical-align:middle}.mr-table tbody tr:last-child td{border-bottom:0}.mr-table tbody tr:hover{background:#fafcfd}.mr-date-main{display:block;color:#233f57;font-size:9.5px;font-weight:850;white-space:nowrap}.mr-date-sub{display:block;margin-top:2px;color:#85939d;font-size:8px}.mr-assignment-cell strong{display:block;color:#274761;font-size:9.5px;font-weight:850}.mr-assignment-cell span{display:block;max-width:230px;margin-top:2px;overflow:hidden;color:#83909a;font-size:8px;text-overflow:ellipsis;white-space:nowrap}.mr-location{max-width:185px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.mr-time{color:#304e67!important;font-variant-numeric:tabular-nums;font-weight:800;white-space:nowrap}.mr-status{display:inline-flex;align-items:center;gap:5px;padding:4px 7px;border-radius:999px;background:#e8f1f7;color:#355d79;font-size:8px;font-weight:900;white-space:nowrap}.mr-status::before{width:5px;height:5px;border-radius:50%;background:currentColor;content:""}.mr-status.good{background:var(--mr-good-bg);color:var(--mr-good)}.mr-status.warn{background:var(--mr-warn-bg);color:var(--mr-warn)}.mr-status.bad{background:var(--mr-bad-bg);color:var(--mr-bad)}.mr-row-action{padding:5px 7px;border:1px solid #d4e0e7;border-radius:6px;background:#fff;color:#31668a;font-size:8px;font-weight:800;white-space:nowrap}.mr-row-action:hover{border-color:#93b6cb;background:#f3f8fb}.mr-empty{text-align:center;padding:37px 16px;color:#71818d}.mr-empty strong,.mr-empty span{display:block}.mr-empty strong{margin-top:8px;color:#3b5568;font-size:10px}.mr-empty span{margin-top:4px;font-size:9px}.mr-spinner{display:inline-block;width:18px;height:18px;border:2px solid #dbe6ed;border-top-color:#347ca6;border-radius:50%;animation:mr-spin .8s linear infinite}@keyframes mr-spin{to{transform:rotate(360deg)}}.mr-summary-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.mr-summary-card{min-width:0;padding:13px 15px}.mr-summary-top{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.mr-summary-top h2{margin:3px 0 0;color:#29465d;font-size:12px}.mr-hours-value{display:flex;align-items:baseline;gap:7px;margin:14px 0 6px}.mr-hours-value strong{color:#103e69;font-size:26px;line-height:1;font-weight:900;letter-spacing:-.04em}.mr-hours-value span{color:#788793;font-size:9px}.mr-summary-foot{color:#82909b;font-size:8.5px}.mr-balance-list{display:flex;gap:9px;flex-wrap:wrap;margin-top:12px}.mr-balance-item{min-width:112px;padding:8px 9px;border:1px solid #e2eaef;border-radius:8px;background:#f8fbfc}.mr-balance-item strong{display:block;color:#254960;font-size:14px}.mr-balance-item span{display:block;margin-top:2px;color:#7c8b97;font-size:8px}.mr-mobile-list{display:none}.mr-metric-row{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:11px;margin-bottom:13px}.mr-metric{min-width:0;padding:13px 14px}.mr-metric strong{display:block;margin-top:6px;color:#103e69;font-size:22px;line-height:1.1;font-weight:900}.mr-metric>span:last-child{display:block;margin-top:4px;color:#82909b;font-size:8.5px}.mr-metric .mr-metric-text{overflow:hidden;font-size:14px;text-overflow:ellipsis;white-space:nowrap}.mr-section-head{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;padding:13px 14px;border-bottom:1px solid #e9eff3}.mr-section-head h2{margin:0;color:#29465d;font-size:12px}.mr-section-head p{margin:4px 0 0;color:#82909b;font-size:8.5px}.mr-policy-note{display:flex;gap:9px;align-items:flex-start;padding:10px 12px;border:1px solid #d9e6ed;border-radius:9px;background:#f8fbfc;color:#71828f;font-size:9px;line-height:1.5}.mr-policy-note strong{flex:0 0 auto;color:#37596f}.mr-dialog{width:min(510px,calc(100vw - 28px));max-width:none;padding:0;border:1px solid #d5e0e7;border-radius:14px;background:#fff;color:var(--mr-ink);box-shadow:0 25px 90px rgba(10,31,49,.25)}.mr-dialog::backdrop{background:rgba(7,31,52,.46);backdrop-filter:blur(2px)}.mr-dialog form{padding:18px}.mr-dialog-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.mr-dialog-head h2{margin:4px 0 0;color:#163a58;font-size:19px}.mr-icon-btn{width:30px;height:30px;display:grid;place-items:center;border:1px solid var(--mr-border);border-radius:8px;background:#fff;color:#5e7282;font-size:20px;line-height:1}.mr-dialog-copy{margin:9px 0 14px;color:#728391;font-size:10px;line-height:1.5}.mr-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:11px}.mr-form-grid label{display:flex;flex-direction:column;gap:5px;color:#53697a;font-size:9px;font-weight:800}.mr-form-grid input,.mr-form-grid textarea{width:100%;padding:8px;border:1px solid #d3dfe6;border-radius:7px;background:#fff;color:#203b53;font-size:10px}.mr-form-grid textarea{resize:vertical}.mr-form-wide{grid-column:1/-1}.mr-dialog-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:16px}.mr-toast{position:fixed;right:18px;bottom:18px;z-index:60;max-width:min(420px,calc(100vw - 36px));padding:11px 14px;border:1px solid rgba(255,255,255,.1);border-radius:9px;background:#173a59;color:#fff;box-shadow:0 12px 34px rgba(0,0,0,.2);font-size:10px;font-weight:750;opacity:0;transform:translateY(8px);pointer-events:none;transition:opacity .18s,transform .18s}.mr-toast.show{opacity:1;transform:translateY(0)}.mr-toast.error{background:#8b3034}.mr-error-screen{position:fixed;inset:0;z-index:100;display:grid;place-items:center;padding:20px;background:rgba(239,245,248,.96)}.mr-error-card{max-width:410px;padding:28px;border:1px solid var(--mr-border);border-radius:14px;background:#fff;box-shadow:var(--mr-shadow);text-align:center}.mr-error-mark{width:36px;height:36px;display:grid;place-items:center;margin:0 auto 11px;border-radius:50%;background:#fff0e6;color:#a35d27;font-weight:900}.mr-error-card h2{margin:0;color:#153e5f;font-size:17px}.mr-error-card p{margin:8px 0 15px;color:#71818d;font-size:10px;line-height:1.5}.mr-error-card a{color:#24668f;font-size:10px;font-weight:800}.mr-sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
@media(max-width:1080px){.mr-layout{grid-template-columns:188px minmax(0,1fr)}.mr-main{padding:18px}.mr-next{grid-template-columns:138px minmax(0,1fr) auto}.mr-filter-heading{align-items:flex-start;flex-direction:column}.mr-filter-controls{justify-content:flex-start;width:100%}}
@media(max-width:760px){#myRosterRoot,.mr-shell{min-height:100vh}.mr-topbar{height:58px;padding:0 11px}.mr-brand{gap:8px}.mr-brand-mark{width:31px;height:31px;font-size:18px}.mr-brand-name{font-size:11px}.mr-brand-subtitle{font-size:7px;margin-top:4px}.mr-topbar-right{gap:8px}.mr-sync{font-size:0}.mr-sync-dot{width:7px;height:7px}.mr-profile{gap:6px}.mr-avatar{width:29px;height:29px;flex-basis:29px}.mr-profile-copy strong{max-width:128px;font-size:9px}.mr-profile-copy span{font-size:8px}.mr-layout{display:block;min-height:calc(100vh - 58px)}.mr-sidebar{position:sticky;top:58px;z-index:25;min-height:0;display:block;padding:6px 8px;border-right:0;border-bottom:1px solid var(--mr-border)}.mr-base-card,.mr-nav-title,.mr-sidebar-note{display:none}.mr-nav{flex-direction:row;gap:3px;overflow:auto;scrollbar-width:none}.mr-nav::-webkit-scrollbar{display:none}.mr-nav-item{width:auto;min-width:max-content;justify-content:center;gap:6px;padding:9px 10px;font-size:9px}.mr-nav-item.active{box-shadow:inset 0 -2px 0 var(--mr-blue)}.mr-nav-icon{width:auto;flex-basis:auto;font-size:12px}.mr-link-arrow{display:none}.mr-main{padding:14px 10px 24px}.mr-page-head{display:block;margin-bottom:12px}.mr-page-head h1{font-size:21px}.mr-page-head p{max-width:560px;font-size:10px}.mr-head-actions{justify-content:flex-start;margin-top:10px}.mr-btn{min-height:33px;padding:7px 10px;font-size:9px}.mr-next{grid-template-columns:1fr;gap:8px;padding:11px}.mr-next-label{font-size:7.5px}.mr-next-main{gap:8px}.mr-next-date{min-width:64px;padding-right:8px}.mr-next-date strong{font-size:16px}.mr-next-detail strong{font-size:10px}.mr-next-detail span{font-size:8px}.mr-next-time{font-size:9px}.mr-next-action{justify-content:flex-start}.mr-filter{padding:0 10px}.mr-filter-heading{gap:8px;padding:9px 0}.mr-filter-heading>div:first-child span{max-width:260px;line-height:1.35}.mr-filter-controls{display:grid;grid-template-columns:1fr 1fr;gap:6px}.mr-field-inline{justify-content:space-between;font-size:8px}.mr-field-inline input{width:calc(100% - 30px);min-width:95px;height:28px}.mr-select{grid-column:1/-1;width:100%;height:28px}.mr-filter-footer{font-size:8px}.mr-table-wrap{display:none}.mr-mobile-list{display:block}.mr-mobile-row{padding:10px;border-bottom:1px solid #e7edf1;background:#fff}.mr-mobile-row:last-child{border-bottom:0}.mr-mobile-head{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}.mr-mobile-date{color:#24445e;font-size:10px;font-weight:900}.mr-mobile-date span{display:block;margin-top:2px;color:#87939e;font-size:8px;font-weight:650}.mr-mobile-title{margin-top:5px;color:#31526a;font-size:9px;font-weight:850}.mr-mobile-location{margin-top:2px;color:#7f8d98;font-size:8px}.mr-mobile-times{display:flex;gap:12px;margin-top:7px;color:#61798b;font-size:8px}.mr-mobile-times b{color:#2e4b64}.mr-mobile-action{margin-top:8px}.mr-summary-grid{grid-template-columns:1fr;gap:8px}.mr-summary-card{padding:11px}.mr-hours-value{margin:10px 0 4px}.mr-hours-value strong{font-size:22px}.mr-metric-row{grid-template-columns:1fr;gap:7px}.mr-metric{padding:11px}.mr-metric strong{font-size:19px}.mr-section-head{padding:11px}.mr-policy-note{font-size:8px}.mr-table-panel{margin-bottom:9px}}
@media(max-width:420px){.mr-brand-subtitle{display:none}.mr-profile-copy{display:none}.mr-topbar-right{margin-left:auto}.mr-main{padding-left:8px;padding-right:8px}.mr-nav-item{padding:8px 8px}.mr-mobile-date{font-size:9px}.mr-status{padding:3px 6px;font-size:7px}.mr-form-grid{grid-template-columns:1fr}.mr-form-wide{grid-column:auto}.mr-dialog form{padding:14px}}
/* NetLine-inspired operational density with SKANDI ALTEA branding. */
.mr-device-unavailable{min-height:52vh;display:grid;place-items:center;padding:24px;background:#eef2f5;color:#17334b;font-family:Inter,ui-sans-serif,system-ui,sans-serif}
.mr-device-unavailable[hidden]{display:none!important}
.mr-device-unavailable>div{max-width:420px;padding:22px 24px;border:1px solid #cdd8e0;background:#fff;text-align:center}
.mr-device-unavailable strong,.mr-device-unavailable span{display:block}
.mr-device-unavailable strong{font-size:16px}
.mr-device-unavailable span{margin-top:7px;color:#607384;font-size:12px;line-height:1.5}
#myRosterRoot{--mr-canvas:#e9edf0;--mr-radius:4px;--mr-shadow:none;min-height:calc(100vh - 96px);font-size:12px;line-height:1.35}
#myRosterRoot .mr-topbar{height:54px;padding:0 16px}
#myRosterRoot .mr-brand{gap:9px}
#myRosterRoot .mr-brand-mark{width:30px;height:30px;border-radius:3px;font-size:18px}
#myRosterRoot .mr-brand-logo{width:auto;max-width:106px;height:29px;object-fit:contain}
#myRosterRoot .mr-brand-name{font-size:12px}
#myRosterRoot .mr-brand-subtitle{margin-top:3px;font-size:8px}
#myRosterRoot .mr-layout{grid-template-columns:194px minmax(0,1fr);min-height:calc(100vh - 54px)}
#myRosterRoot .mr-sidebar{top:54px;min-height:calc(100vh - 54px);padding:12px 10px}
#myRosterRoot .mr-base-card{padding:10px 11px;margin-bottom:14px;border-radius:3px;box-shadow:none}
#myRosterRoot .mr-nav-item{padding:8px 9px;border-radius:3px;font-size:10px}
#myRosterRoot .mr-sidebar-note{padding:9px 8px;font-size:8px}
#myRosterRoot .mr-main{padding:16px 18px 22px}
#myRosterRoot .mr-page-head{margin-bottom:12px}
#myRosterRoot .mr-page-head h1{font-size:21px}
#myRosterRoot .mr-page-head p{font-size:10px}
#myRosterRoot .panel,#myRosterRoot .mr-summary-card,#myRosterRoot .mr-metric{border-radius:3px;box-shadow:none}
#myRosterRoot .mr-next{gap:10px;margin-bottom:9px;padding:10px 12px}
#myRosterRoot .mr-filter{margin-bottom:9px;padding:0 10px}
#myRosterRoot .mr-filter-heading{padding:8px 0}
#myRosterRoot .mr-filter-footer{padding:6px 0;font-size:8px}
#myRosterRoot .mr-table-panel{margin-bottom:9px}
#myRosterRoot .mr-table{min-width:680px}
#myRosterRoot .mr-table thead th{top:54px;padding:7px 9px;background:#e5e2d8;color:#3e4b55;font-size:7.5px;letter-spacing:.06em}
#myRosterRoot .mr-table td{padding:6px 9px;border-bottom-color:#e5e7e8;font-size:9px}
#myRosterRoot .mr-date-main,#myRosterRoot .mr-time{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-variant-numeric:tabular-nums}
#myRosterRoot .mr-assignment-cell strong{font-size:10px}
#myRosterRoot .mr-assignment-cell span{font-size:8px}
#myRosterRoot .mr-btn{min-height:31px;padding:6px 10px;border-radius:3px;font-size:9px}
#myRosterRoot .mr-row-actions{display:flex;align-items:center;gap:5px;white-space:nowrap}
#myRosterRoot .mr-row-action{padding:3px 5px;border-radius:2px;font-size:8px}
#myRosterRoot .mr-summary-grid{gap:9px}
#myRosterRoot .mr-summary-card{padding:12px}
#myRosterRoot .mr-summary-top h2{font-size:13px}
#myRosterRoot .mr-metric-row{gap:8px;margin-bottom:9px}
#myRosterRoot .mr-metric{padding:10px 11px}
#myRosterRoot .mr-flight-search{margin-bottom:10px;padding:11px 12px}
#myRosterRoot .mr-flight-search-form{display:flex;align-items:flex-end;gap:9px;flex-wrap:wrap}
#myRosterRoot .mr-flight-term{flex:1 1 220px}
#myRosterRoot .mr-flight-term input{width:100%;min-width:180px}
#myRosterRoot .mr-flight-search-form .mr-field-inline input{width:136px}
#myRosterRoot .mr-flight-search-note{margin-top:8px;padding-top:7px;border-top:1px solid #e3e8eb;color:#6c7e8a;font-size:8px}
#myRosterRoot .mr-flight-table{min-width:840px}
#myRosterRoot .mr-flight-meta{display:block;margin-top:3px;color:#728391;font-size:8px}
#myRosterRoot .mr-section-head{padding:10px 12px}
#myRosterRoot .mr-section-head h2{font-size:12px}
#myRosterRoot .mr-section-head p{font-size:8px}
#myRosterRoot .mr-device-unavailable{display:none}
#briefingDialog.mr-briefing-dialog{width:min(940px,96vw);max-width:96vw;max-height:94vh;padding:0;border:1px solid #9ba9b3;border-radius:3px;background:#e2e5e7;color:#172b3d;box-shadow:0 16px 50px rgba(0,0,0,.28);overflow:auto}
#briefingDialog::backdrop{background:rgba(10,26,42,.6)}
.mr-briefing-toolbar{position:sticky;top:0;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:9px 12px;background:#082f5f;color:#fff}
.mr-briefing-toolbar>div{display:flex;gap:6px}
.mr-briefing-toolbar strong{font-size:11px}
.mr-briefing-paper{width:min(820px,100%);min-height:760px;margin:12px auto;padding:26px 34px;border:1px solid #c4c9cc;background:#fff;color:#101820;box-shadow:0 1px 7px rgba(0,0,0,.15);font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:10px;line-height:1.45}
.mr-cari-head{display:flex;align-items:center;justify-content:space-between;gap:18px;padding-bottom:12px;border-bottom:2px solid #102e4b}
.mr-cari-logo{width:auto;max-width:126px;height:38px;object-fit:contain}
.mr-cari-head-title{margin-right:auto}
.mr-cari-head>div:first-child strong,.mr-cari-head>div:first-child span,.mr-cari-stamp span,.mr-cari-stamp strong{display:block}
.mr-cari-head>div:first-child strong{font-family:Inter,Arial,sans-serif;font-size:17px;letter-spacing:.06em}
.mr-cari-head>div:first-child span{margin-top:4px;color:#3f5364;font-size:9px;font-weight:800;letter-spacing:.07em}
.mr-cari-stamp{text-align:right}
.mr-cari-stamp span,.mr-cari-grid span{color:#647582;font-size:7.5px;font-weight:800;letter-spacing:.08em}
.mr-cari-stamp strong{margin-top:3px;font-size:9px}
.mr-briefing-paper h2{margin:14px 0 4px;font-family:Inter,Arial,sans-serif;font-size:16px;letter-spacing:.015em}
.mr-cari-subtitle{margin:0;color:#5e6b74;font-size:8px}
.mr-cari-rule{margin:11px 0 8px;border-top:1px dashed #77838b}
.mr-briefing-paper h3{margin:0 0 8px;color:#213c55;font-size:9px;letter-spacing:.08em}
.mr-cari-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px 14px}
.mr-cari-grid>div{min-height:32px;padding:5px 7px;border:1px solid #d5dce0;background:#f7f8f8}
.mr-cari-grid strong{display:block;margin-top:3px;font-size:10px;font-weight:700;overflow-wrap:anywhere}
.mr-cari-table{width:100%;border-collapse:collapse}
.mr-cari-table th,.mr-cari-table td{padding:6px 7px;border:1px solid #bdc7cd;text-align:left;font-size:8px}
.mr-cari-table th{background:#e8e3d7;font-weight:800}
.mr-cari-checks{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.mr-cari-checks>div{padding:7px;border:1px solid #d5dce0;background:#fafbfb}
.mr-cari-note{margin-top:12px;padding:8px;border-left:3px solid #285ca8;background:#f1f5f7;color:#526274;font-size:8px}
.mr-cari-footer{margin-top:18px;padding-top:8px;border-top:1px solid #9daab1;color:#5e6b74;font-size:7px;letter-spacing:.03em}
@media(max-width:767px){
  #myRosterRoot{display:none!important}
  .mr-device-unavailable:not([hidden]){display:grid!important}
}
@media print{
  body *{visibility:hidden!important}
  #briefingDialog[open],#briefingDialog[open] *{visibility:visible!important}
  #briefingDialog.mr-briefing-dialog[open]{position:absolute;inset:0 auto auto 0;display:block;width:100%;max-width:none;max-height:none;margin:0;padding:0;border:0;overflow:visible;border-radius:0;background:#fff;box-shadow:none}
  #briefingDialog::backdrop{display:none}
  .mr-briefing-toolbar{display:none!important}
  .mr-briefing-paper{width:100%;min-height:0;margin:0;padding:12mm 13mm;border:0;box-shadow:none;font-size:9pt}
  .mr-cari-grid>div,.mr-cari-checks>div{break-inside:avoid}
  .mr-cari-footer{position:static}
  @page{size:A4 portrait;margin:12mm}
}
</style>
</head>
<body>
  <section class="mr-device-unavailable" id="desktopOnlyNotice" hidden aria-live="polite">
    <div><strong>MyRoster is available on desktop</strong><span>Open ALTEA MyRoster from a desktop browser to view schedules and OPS records.</span></div>
  </section>
  <div class="mr-shell" id="myRosterRoot">
    <header class="mr-topbar">
      <div class="mr-brand">
        <div class="mr-brand-mark" id="brandMark" aria-hidden="true">A</div>
        <img class="mr-brand-logo" id="alteaBrandLogo" alt="ALTEA" hidden>
        <div>
          <div class="mr-brand-name">ALTEA <span>MYROSTER</span></div>
          <div class="mr-brand-subtitle">SKANDI OPERATIONS</div>
        </div>
      </div>
      <div class="mr-topbar-right">
        <div class="mr-sync" id="syncState" data-state="loading"><span class="mr-sync-dot"></span><span id="syncLabel">Connecting to staff schedule</span></div>
        <div class="mr-profile" aria-live="polite">
          <div class="mr-avatar" id="staffInitials">S</div>
          <div class="mr-profile-copy"><strong id="staffName">SKANDI staff</strong><span id="staffMeta">Loading your profile…</span></div>
        </div>
      </div>
    </header>

    <div class="mr-layout">
      <aside class="mr-sidebar" aria-label="MyRoster navigation">
        <div class="mr-base-card"><span class="mr-overline">ASSIGNED BASE</span><strong id="baseCode">Loading</strong><span id="staffRole">Destination staff</span></div>
        <div class="mr-nav-title">MY WORK</div>
        <nav class="mr-nav">
          <button class="mr-nav-item active" data-nav="schedule" type="button"><span class="mr-nav-icon">▦</span><span>My schedule</span></button>
          <button class="mr-nav-item" data-nav="flights" type="button"><span class="mr-nav-icon">⌕</span><span>Flight search</span></button>
          <button class="mr-nav-item" data-nav="time" type="button"><span class="mr-nav-icon">◷</span><span>Time &amp; attendance</span></button>
          <button class="mr-nav-item" data-nav="requests" type="button"><span class="mr-nav-icon">↗</span><span>My requests</span></button>
          <a class="mr-nav-item mr-nav-link" id="groupTalkLink" href="#" hidden><span class="mr-nav-icon">▤</span><span>GroupTalk</span><span class="mr-link-arrow">↗</span></a>
        </nav>
        <div class="mr-sidebar-note"><span class="mr-note-icon">i</span><span>Your records are scoped to your staff profile. Flight search checks ALTEA data independently of your roster.</span></div>
      </aside>

      <main class="mr-main">
        <section class="mr-view active" id="schedulePanel" data-panel="schedule">
          <div class="mr-page-head">
            <div><div class="mr-kicker">DESTINATION OPERATIONS</div><h1>My schedule</h1><p>Shifts and local assignments published for your staff profile.</p></div>
            <div class="mr-head-actions"><button class="mr-btn mr-btn-secondary" id="exportBtn" type="button">Export schedule</button><button class="mr-btn mr-btn-primary" id="refreshBtn" type="button"><span aria-hidden="true">↻</span> Refresh</button></div>
          </div>

          <div class="mr-alert" id="scheduleAlert" role="status" hidden><span class="mr-alert-mark">!</span><span id="scheduleAlertText"></span></div>

          <section class="mr-next panel">
            <div class="mr-next-label"><span class="mr-live-dot"></span><span>NEXT ASSIGNMENT</span></div>
            <div class="mr-next-content" id="nextAssignment"><div class="mr-next-empty">Your upcoming SKANDI assignments will appear here when published.</div></div>
            <div class="mr-next-action" id="nextAction"></div>
          </section>

          <section class="mr-filter panel" aria-label="Schedule filters">
            <div class="mr-filter-heading"><div><strong>Roster view</strong><span>Personal schedule · destination local time when supplied</span></div><div class="mr-filter-controls">
              <label class="mr-field-inline">From <input type="date" id="dateFrom" aria-label="Schedule from date"></label>
              <label class="mr-field-inline">To <input type="date" id="dateTo" aria-label="Schedule to date"></label>
              <select id="statusFilter" class="mr-select" aria-label="Filter by status"><option value="ALL">All statuses</option><option value="SCHEDULED">Scheduled</option><option value="CONFIRMED">Confirmed</option><option value="COMPLETED">Completed</option><option value="CANCELLED">Cancelled</option></select>
            </div></div>
            <div class="mr-filter-footer"><span><b id="assignmentCount">0</b> assignments in this date range</span><span id="rangeBase">Assigned destination</span></div>
          </section>

          <section class="mr-table-panel panel" aria-label="My assignments">
            <div class="mr-table-wrap"><table class="mr-table">
              <thead><tr><th>DATE</th><th>ASSIGNMENT</th><th>LOCATION</th><th>START</th><th>END</th><th>STATUS</th><th><span class="mr-sr-only">Actions</span></th></tr></thead>
              <tbody id="scheduleBody"><tr><td colspan="7"><div class="mr-empty"><span class="mr-spinner"></span><strong>Loading your schedule</strong><span>Checking SKANDI assignment records…</span></div></td></tr></tbody>
            </table></div>
            <div class="mr-mobile-list" id="mobileSchedule"></div>
          </section>

          <div class="mr-summary-grid">
            <section class="mr-summary-card panel"><div class="mr-summary-top"><div><span class="mr-overline">TIME &amp; ATTENDANCE</span><h2>Recorded hours</h2></div><button class="mr-text-btn" data-nav="time" type="button">View details <span>→</span></button></div><div class="mr-hours-value"><strong id="hoursValue">—</strong><span>hours · last 30 days</span></div><div class="mr-summary-foot" id="clockSummary">No attendance event recorded in this period.</div></section>
            <section class="mr-summary-card panel"><div class="mr-summary-top"><div><span class="mr-overline">LEAVE</span><h2>Available balance</h2></div><button class="mr-text-btn" id="openTimeOff" type="button">Request time off <span>→</span></button></div><div class="mr-balance-list" id="balanceList"><span class="mr-summary-foot">No balance records are available.</span></div></section>
          </div>
        </section>

        <section class="mr-view" id="flightsPanel" data-panel="flights" hidden>
          <div class="mr-page-head"><div><div class="mr-kicker">ALTEA OPERATIONS</div><h1>Flight search</h1><p>Search live flight and published schedule records. Your own roster assignment is not required.</p></div></div>
          <section class="mr-flight-search panel" aria-label="Search ALTEA flights">
            <form id="flightSearchForm" class="mr-flight-search-form">
              <label class="mr-field-inline mr-flight-term">Flight number or airport code<input type="search" id="flightQuery" minlength="2" maxlength="80" autocomplete="off" placeholder="e.g. SK123 or ARN" required></label>
              <label class="mr-field-inline">From <input type="date" id="flightDateFrom" required></label>
              <label class="mr-field-inline">To <input type="date" id="flightDateTo" required></label>
              <button class="mr-btn mr-btn-primary" id="flightSearchButton" type="submit">Search flights</button>
            </form>
            <div class="mr-flight-search-note">Search covers operational FIDS and published ALTEA schedule rows for the selected dates, regardless of personal assignments.</div>
          </section>
          <section class="mr-table-panel panel" aria-label="Flight search results">
            <div class="mr-section-head"><div><h2>Flight records</h2><p id="flightSearchStatus">Enter a flight number or airport code to search.</p></div></div>
            <div class="mr-table-wrap"><table class="mr-table mr-flight-table"><thead><tr><th>DATE</th><th>FLIGHT</th><th>ROUTE</th><th>SCHEDULE</th><th>STATUS / GATE</th><th>AIRCRAFT</th><th></th></tr></thead><tbody id="flightResultsBody"><tr><td colspan="7"><div class="mr-empty"><strong>No search submitted</strong><span>Flight search does not depend on your personal schedule.</span></div></td></tr></tbody></table></div>
          </section>
        </section>

        <section class="mr-view" id="timePanel" data-panel="time" hidden>
          <div class="mr-page-head"><div><div class="mr-kicker">PERSONAL RECORD</div><h1>Time &amp; attendance</h1><p>Attendance events recorded against your assigned destination shifts.</p></div><button class="mr-btn mr-btn-secondary" id="timeRefreshBtn" type="button">Refresh records</button></div>
          <section class="mr-metric-row"><div class="mr-metric panel"><span class="mr-overline">RECORDED HOURS</span><strong id="timeHours">—</strong><span>Last 30 days</span></div><div class="mr-metric panel"><span class="mr-overline">LATEST EVENT</span><strong class="mr-metric-text" id="latestClock">No event recorded</strong><span id="latestClockTime">—</span></div><div class="mr-metric panel"><span class="mr-overline">ASSIGNED BASE</span><strong class="mr-metric-text" id="timeBase">—</strong><span id="timeRole">—</span></div></section>
          <section class="mr-table-panel panel"><div class="mr-section-head"><div><h2>Attendance history</h2><p>Events are saved to the SKANDI time record.</p></div></div><div class="mr-table-wrap"><table class="mr-table"><thead><tr><th>DATE &amp; TIME</th><th>EVENT</th><th>ASSIGNMENT</th><th>LOCATION</th><th>STATUS</th></tr></thead><tbody id="clockBody"></tbody></table></div><div class="mr-mobile-list" id="mobileClock"></div></section>
        </section>

        <section class="mr-view" id="requestsPanel" data-panel="requests" hidden>
          <div class="mr-page-head"><div><div class="mr-kicker">STAFF SELF-SERVICE</div><h1>My requests</h1><p>Time-off and schedule-change requests submitted from this staff account.</p></div><div class="mr-head-actions"><button class="mr-btn mr-btn-secondary" id="openShiftChange" type="button">Request a schedule change</button><button class="mr-btn mr-btn-primary" id="requestsTimeOff" type="button">Request time off</button></div></div>
          <section class="mr-table-panel panel"><div class="mr-section-head"><div><h2>Request history</h2><p>OPS reviews these requests in the ALTEA Operations Control queue.</p></div></div><div class="mr-table-wrap"><table class="mr-table"><thead><tr><th>SUBMITTED</th><th>REQUEST</th><th>DETAILS</th><th>STATUS</th><th>UPDATED</th></tr></thead><tbody id="requestsBody"></tbody></table></div><div class="mr-mobile-list" id="mobileRequests"></div></section>
          <div class="mr-policy-note"><strong>OPS handling</strong><span>MyRoster stores requests under your authenticated SKANDI staff ID. OPS reviews them; approving a schedule change does not publish a roster edit automatically.</span></div>
        </section>
      </main>
    </div>

    <dialog class="mr-dialog" id="timeOffDialog" aria-labelledby="timeOffTitle"><form method="dialog" id="timeOffForm"><div class="mr-dialog-head"><div><span class="mr-kicker">STAFF REQUEST</span><h2 id="timeOffTitle">Request time off</h2></div><button class="mr-icon-btn" value="cancel" aria-label="Close">×</button></div><p class="mr-dialog-copy">Your request will be sent for review. It does not change your published schedule.</p><div class="mr-form-grid"><label>Start date<input name="startDate" type="date" required></label><label>End date<input name="endDate" type="date" required></label><label class="mr-form-wide">Note for your manager<textarea name="notes" maxlength="400" rows="3" placeholder="Add any details that will help with the review."></textarea></label></div><div class="mr-dialog-actions"><button class="mr-btn mr-btn-secondary" value="cancel">Cancel</button><button class="mr-btn mr-btn-primary" id="submitTimeOff" type="button">Send request</button></div></form></dialog>
    <dialog class="mr-dialog" id="shiftChangeDialog" aria-labelledby="shiftChangeTitle"><form method="dialog" id="shiftChangeForm"><div class="mr-dialog-head"><div><span class="mr-kicker">STAFF REQUEST</span><h2 id="shiftChangeTitle">Request a schedule change</h2></div><button class="mr-icon-btn" value="cancel" aria-label="Close">×</button></div><p class="mr-dialog-copy" id="shiftChangeAssignment">Choose an assignment first, or describe the date you need reviewed.</p><div class="mr-form-grid"><label class="mr-form-wide">What needs to change?<textarea name="reason" maxlength="600" rows="4" required placeholder="Describe the requested change and your preferred outcome."></textarea></label></div><div class="mr-dialog-actions"><button class="mr-btn mr-btn-secondary" value="cancel">Cancel</button><button class="mr-btn mr-btn-primary" id="submitShiftChange" type="button">Send request</button></div></form></dialog>
    <dialog class="mr-briefing-dialog" id="briefingDialog" aria-labelledby="briefingDialogTitle"><div class="mr-briefing-toolbar"><strong id="briefingDialogTitle">CARI briefing card</strong><div><button class="mr-btn mr-btn-primary" id="printBriefing" type="button">Print / save PDF</button><button class="mr-btn mr-btn-secondary" id="closeBriefing" type="button">Close</button></div></div><article class="mr-briefing-paper" id="briefingPaper" aria-live="polite"></article></dialog>
    <div class="mr-toast" id="toast" role="status" aria-live="polite"></div>
    <div class="mr-error-screen" id="accessError" hidden><div class="mr-error-card"><div class="mr-error-mark">!</div><h2>MyRoster is unavailable for this account</h2><p id="accessErrorText">Your SKANDI destination staff profile could not be verified.</p><a href="/riaintra">Return to RIAINTRA sign in</a></div></div>
  </div>
  <script>(() => {
  "use strict";

  const SOURCE = "SKANDI_MYROSTER_EMBED";
  const PARENT_SOURCE = "SKANDI_WIX_PARENT";
  const root = document.getElementById("myRosterRoot");
  if (!root) return;
  const desktopOnlyNotice = document.getElementById("desktopOnlyNotice");
  const desktopViewport = typeof window.matchMedia === "function"
    ? window.matchMedia("(min-width: 768px)").matches
    : window.innerWidth >= 768;
  if (!desktopViewport) {
    root.hidden = true;
    if (desktopOnlyNotice) desktopOnlyNotice.hidden = false;
    return;
  }

  const $ = (selector) => root.querySelector(selector);
  const $$ = (selector) => [...root.querySelectorAll(selector)];
  const state = {
    boot: null,
    assignments: [],
    requests: [],
    clocks: [],
    timeOffBalances: [],
    pending: new Map(),
    flights: [],
    flightRequestId: "",
    selectedAssignment: null,
    activePanel: "schedule",
    lastSync: null,
    brandLogoUrl: "",
    loading: true
  };

  function text(value) { return String(value ?? ""); }
  function escapeHtml(value) {
    return text(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[character]);
  }
  function dateInputValue(value) {
    const date = value instanceof Date ? value : new Date(value);
    if (!Number.isFinite(date.getTime())) return "";
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }
  function offsetDate(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
  function setSync(label, status = "ready") {
    const host = $("#syncState");
    if (!host) return;
    host.dataset.state = status;
    $("#syncLabel").textContent = label;
  }
  function showToast(message, error = false) {
    const toast = $("#toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.toggle("error", error);
    toast.classList.add("show");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 3400);
  }
  function post(type, payload = {}) {
    window.parent.postMessage({ source: SOURCE, type, payload, timestamp: new Date().toISOString() }, "*");
  }
  function applyMasterConfig(config) {
    const logos = config?.brand?.assets?.logos || {};
    const logoUrl = text(logos.altea || logos.alteaWhite || logos.skandiGroupWhite).trim();
    if (!/^https:\/\//i.test(logoUrl)) return;
    state.brandLogoUrl = logoUrl;
    const logo = $("#alteaBrandLogo");
    if (!logo) return;
    logo.src = logoUrl;
    logo.hidden = false;
    $("#brandMark").hidden = true;
  }
  function requestFlightSearch() {
    const query = text($("#flightQuery")?.value).trim();
    const from = text($("#flightDateFrom")?.value).trim();
    const to = text($("#flightDateTo")?.value).trim();
    if (query.length < 2) return showToast("Enter at least two characters for a flight or airport search.", true);
    if (!from || !to || from > to) return showToast("Choose a valid flight search date range.", true);
    const button = $("#flightSearchButton");
    state.flightRequestId = `FLIGHT-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    if (button) button.disabled = true;
    $("#flightSearchStatus").textContent = "Searching canonical ALTEA flight data…";
    $("#flightResultsBody").innerHTML = '<tr><td colspan="7"><div class="mr-empty"><span class="mr-spinner"></span><strong>Searching ALTEA records</strong><span>Personal roster assignments are not used as a filter.</span></div></td></tr>';
    post("MYROSTER_FLIGHT_SEARCH_REQUEST", { query, from, to, requestId: state.flightRequestId });
  }
  function renderFlightResults(rows) {
    const body = $("#flightResultsBody");
    if (!body) return;
    state.flights = Array.isArray(rows) ? rows : [];
    if (!state.flights.length) {
      body.innerHTML = '<tr><td colspan="7"><div class="mr-empty"><strong>No matching live flight or schedule records</strong><span>The search is independent of your roster. This result means the selected ALTEA data sources returned no matching flight records.</span></div></td></tr>';
      return;
    }
    body.innerHTML = state.flights.map((flight) => {
      const departure = flight.departureTime || flight.estimatedTime || flight.actualTime || flight.scheduledTime || "—";
      const arrival = flight.arrivalTime || "";
      const route = [flight.origin, flight.viaPoint, flight.destination].filter(Boolean).join(" → ") || "Route not supplied";
      const status = [flight.status || "SCHEDULED", flight.gate ? `Gate ${flight.gate}` : ""].filter(Boolean).join(" · ");
      return `<tr><td><span class="mr-date-main">${escapeHtml(flight.departureDate || "—")}</span></td><td><div class="mr-assignment-cell"><strong>${escapeHtml(flight.flightNumber || "Flight number unavailable")}</strong><span>${escapeHtml(flight.airlineName || flight.source || "ALTEA")}</span></div></td><td>${escapeHtml(route)}</td><td class="mr-time">${escapeHtml(departure)}${arrival ? `<span class="mr-date-sub">Arr ${escapeHtml(arrival)}</span>` : ""}</td><td>${statusPill(status)}${flight.terminal ? `<span class="mr-flight-meta">Terminal ${escapeHtml(flight.terminal)}</span>` : ""}</td><td>${escapeHtml([flight.aircraftType, flight.registration].filter(Boolean).join(" · ") || "—")}</td><td><button class="mr-row-action" type="button" data-brief-flight="${escapeHtml(flight.id)}">CARI / Print</button></td></tr>`;
    }).join("");
  }
  function renderBriefing(flight = {}, assignment = null) {
    const profile = state.boot?.profile || {};
    const staffName = profile.displayName || profile.fullName || profile.preferredName || "Authenticated SKANDI staff member";
    const staffId = profile.agentId || profile.skId || "—";
    const flightNumber = flight.flightNumber || assignment?.flightNumber || assignment?.reference || assignment?.routeId || "—";
    const origin = flight.origin || assignment?.origin || "—";
    const destination = flight.destination || assignment?.destination || "—";
    const viaPoint = flight.viaPoint || assignment?.viaPoint || "";
    const date = flight.departureDate || (assignment?.startAt ? dateInputValue(assignment.startAt) : "—");
    const source = flight.source || (assignment ? "MyRoster assignment record" : "ALTEA flight search");
    const assignmentLabel = assignment ? assignmentTitle(assignment) : "No personal assignment linked to this search";
    const time = flight.departureTime || flight.estimatedTime || flight.actualTime || flight.scheduledTime || "—";
    const brandMark = state.brandLogoUrl ? `<img class="mr-cari-logo" src="${escapeHtml(state.brandLogoUrl)}" alt="ALTEA">` : "";
    const paper = $("#briefingPaper");
    if (!paper) return;
    paper.innerHTML = `<div class="mr-cari-head">${brandMark}<div class="mr-cari-head-title"><strong>SKANDI ALTEA</strong><span>CREW ASSIGNMENT &amp; ROSTER INFORMATION</span></div><div class="mr-cari-stamp"><span>GENERATED</span><strong>${escapeHtml(new Date().toISOString().replace("T", " ").slice(0, 16))}Z</strong></div></div>
      <h2>CARI OPERATIONAL BRIEFING CARD</h2><p class="mr-cari-subtitle">Operational details shown here are limited to the selected live flight or assignment record and your authenticated staff profile.</p>
      <div class="mr-cari-rule"></div><h3>FLIGHT / ROUTE IDENTIFICATION</h3><div class="mr-cari-grid"><div><span>FLIGHT / REF</span><strong>${escapeHtml(flightNumber)}</strong></div><div><span>DATE</span><strong>${escapeHtml(date)}</strong></div><div><span>ORIGIN</span><strong>${escapeHtml(origin)}</strong></div><div><span>VIA</span><strong>${escapeHtml(viaPoint || "Not supplied")}</strong></div><div><span>DESTINATION</span><strong>${escapeHtml(destination)}</strong></div><div><span>STATUS</span><strong>${escapeHtml(flight.status || "Not supplied")}</strong></div><div><span>DATA SOURCE</span><strong>${escapeHtml(source)}</strong></div></div>
      <div class="mr-cari-rule"></div><h3>SCHEDULE &amp; STATION DETAILS</h3><div class="mr-cari-grid"><div><span>SCHEDULED</span><strong>${escapeHtml(flight.scheduledTime || time)}</strong></div><div><span>ESTIMATED</span><strong>${escapeHtml(flight.estimatedTime || "Not supplied")}</strong></div><div><span>ACTUAL</span><strong>${escapeHtml(flight.actualTime || "Not supplied")}</strong></div><div><span>GATE / TERMINAL</span><strong>${escapeHtml([flight.gate, flight.terminal].filter(Boolean).join(" / ") || "Not supplied")}</strong></div><div><span>AIRCRAFT / REGISTRATION</span><strong>${escapeHtml([flight.aircraftType, flight.registration].filter(Boolean).join(" / ") || "Not supplied")}</strong></div><div><span>BAGGAGE BELT</span><strong>${escapeHtml(flight.belt || "Not supplied")}</strong></div></div>
      <div class="mr-cari-rule"></div><h3>AUTHENTICATED STAFF ASSIGNMENT</h3><table class="mr-cari-table"><thead><tr><th>STAFF ID</th><th>STAFF MEMBER</th><th>ROLE</th><th>BASE</th><th>ASSIGNMENT</th></tr></thead><tbody><tr><td>${escapeHtml(staffId)}</td><td>${escapeHtml(staffName)}</td><td>${escapeHtml(profile.jobTitle || profile.position || "Not supplied")}</td><td>${escapeHtml(state.boot?.base?.code || profile.baseCode || "Not supplied")}</td><td>${escapeHtml(assignmentLabel)}</td></tr></tbody></table>
      <div class="mr-cari-rule"></div><h3>BRIEFING CHECKLIST — COMPLETE WITH THE OPS TEAM</h3><div class="mr-cari-checks"><div>□ Review route and station information</div><div>□ Confirm current operational notices</div><div>□ Confirm local transfer / destination handover where applicable</div><div>□ Record safety briefing completion in the approved OPS workflow</div></div>
      <p class="mr-cari-note">This printable card does not record checklist completion and does not include other staff, passenger, or booking data. Those records remain in their authorized ALTEA / OPS workflows.</p><div class="mr-cari-footer">SKANDI ALTEA · CARI PRINT VIEW · SOURCE RECORDS: ${escapeHtml(source)}</div>`;
    openDialog($("#briefingDialog"));
  }
  function requestRefresh() {
    const from = $("#dateFrom")?.value || "";
    const to = $("#dateTo")?.value || "";
    state.loading = true;
    setSync("Syncing your schedule", "loading");
    post("MYROSTER_REFRESH_REQUEST", { from, to });
  }
  function action(type, payload, button, successText) {
    const requestId = `MYROSTER-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    state.pending.set(requestId, { button, successText });
    if (button) button.disabled = true;
    setSync("Saving staff record", "loading");
    post(type, { ...payload, requestId });
  }
  function toDate(value) {
    const parsed = new Date(value);
    return Number.isFinite(parsed.getTime()) ? parsed : null;
  }
  function dateParts(value, timeZone = "") {
    const date = toDate(value);
    if (!date) return { main: "Date not set", sub: "" };
    const options = { weekday: "short", day: "2-digit", month: "short" };
    if (timeZone) options.timeZone = timeZone;
    try {
      const parts = new Intl.DateTimeFormat(undefined, options).formatToParts(date);
      const part = (key) => parts.find((item) => item.type === key)?.value || "";
      return { main: `${part("day")} ${part("month")}`, sub: part("weekday") };
    } catch (_) {
      return { main: date.toLocaleDateString(undefined, { day: "2-digit", month: "short" }), sub: date.toLocaleDateString(undefined, { weekday: "short" }) };
    }
  }
  function formatTime(value, timeZone = "") {
    const date = toDate(value);
    if (!date) return "—";
    const options = { hour: "2-digit", minute: "2-digit", hour12: false };
    if (timeZone) options.timeZone = timeZone;
    try { return new Intl.DateTimeFormat(undefined, options).format(date); }
    catch (_) { return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }); }
  }
  function formatDateTime(value, timeZone = "") {
    const date = toDate(value);
    if (!date) return "—";
    const options = { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false };
    if (timeZone) options.timeZone = timeZone;
    try { return new Intl.DateTimeFormat(undefined, options).format(date); }
    catch (_) { return date.toLocaleString(undefined, { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }); }
  }
  function titleCase(value) {
    const clean = text(value).replace(/[_-]+/g, " ").trim().toLowerCase();
    return clean ? clean.replace(/\b\w/g, (letter) => letter.toUpperCase()) : "Scheduled";
  }
  function baseLabel() {
    const base = state.boot?.base || {};
    const profile = state.boot?.profile || {};
    const name = text(base.name || profile.baseName || base.city || profile.base || profile.station || "Assigned destination");
    const code = text(base.destinationCode || base.airportIata || profile.destinationCode || base.code || profile.baseCode || "");
    return code && code.toLowerCase() !== name.toLowerCase() ? `${name} · ${code}` : name;
  }
  function statusClass(value) {
    const status = text(value).toUpperCase();
    if (["COMPLETED", "CONFIRMED", "APPROVED", "RECORDED", "CLOCKED IN", "CLOCKED_OUT", "CLOCKED OUT"].includes(status)) return "good";
    if (["PENDING", "PENDING REVIEW", "REQUESTED", "IN REVIEW"].includes(status)) return "warn";
    if (["CANCELLED", "CANCELED", "DECLINED", "REJECTED", "DISRUPTED"].includes(status)) return "bad";
    return "";
  }
  function assignmentPeriod(assignment) {
    const start = toDate(assignment.startAt);
    const end = toDate(assignment.endAt);
    if (!start) return "Schedule time not supplied";
    const tz = assignment.timeZone || "";
    const startText = `${formatDateTime(assignment.startAt, tz)}${tz ? ` · ${tz}` : ""}`;
    if (!end) return startText;
    const sameDay = dateInputValue(start) === dateInputValue(end);
    return sameDay ? `${formatTime(assignment.startAt, tz)}–${formatTime(assignment.endAt, tz)}` : `${startText} – ${formatDateTime(assignment.endAt, tz)}`;
  }
  function visibleAssignments() {
    const from = $("#dateFrom")?.value || "";
    const to = $("#dateTo")?.value || "";
    const status = $("#statusFilter")?.value || "ALL";
    return state.assignments.filter((assignment) => {
      const start = toDate(assignment.startAt);
      const day = start ? dateInputValue(start) : "";
      if (from && day && day < from) return false;
      if (to && day && day > to) return false;
      if (status !== "ALL" && text(assignment.status).toUpperCase() !== status) return false;
      return true;
    }).sort((a, b) => (Date.parse(a.startAt || "") || 0) - (Date.parse(b.startAt || "") || 0));
  }
  function clockedIn() {
    const latest = state.clocks[0];
    if (!latest) return false;
    const type = text(latest.eventType).toUpperCase().replace(/[^A-Z]/g, "");
    return type.includes("IN") && !type.includes("OUT");
  }
  function setActivePanel(panel) {
    state.activePanel = panel;
    $$("[data-nav]").forEach((item) => item.classList.toggle("active", item.dataset.nav === panel));
    $$("[data-panel]").forEach((item) => {
      const active = item.dataset.panel === panel;
      item.classList.toggle("active", active);
      item.hidden = !active;
    });
    if (panel === "time") renderClock();
    if (panel === "requests") renderRequests();
    if (panel === "flights") $("#flightQuery")?.focus();
  }
  function renderProfile() {
    const profile = state.boot?.profile || {};
    const name = profile.displayName || profile.fullName || profile.preferredName || "SKANDI staff";
    const role = profile.jobTitle || profile.position || profile.accessRole || "Destination staff";
    const base = baseLabel();
    const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "S";
    $("#staffName").textContent = name;
    $("#staffMeta").textContent = role;
    $("#staffInitials").textContent = initials;
    $("#baseCode").textContent = base;
    $("#staffRole").textContent = role;
    $("#rangeBase").textContent = `Assigned destination · ${base}`;
    $("#timeBase").textContent = base;
    $("#timeRole").textContent = role;
    const groupTalk = (state.boot?.apps || []).find((app) => /grouptalk/i.test(`${app.id || ""} ${app.title || ""}`) && app.available !== false && app.path);
    const link = $("#groupTalkLink");
    if (groupTalk && link) {
      link.href = groupTalk.path;
      link.hidden = false;
    }
  }
  function assignmentTitle(assignment) {
    const source = text(assignment.sourceTable);
    if (assignment.label) return assignment.label;
    if (source === "driver_assignments") return "Transfer duty";
    if (source === "tour_assignments") return "Tour assignment";
    if (source === "airport_duty_assignments") return "Airport duty";
    if (source === "vehicle_assignments") return "Vehicle assignment";
    return "Destination shift";
  }
  function statusPill(value) {
    const label = titleCase(value || "Scheduled");
    return `<span class="mr-status ${statusClass(value)}">${escapeHtml(label)}</span>`;
  }
  function rowAction(assignment) {
    const canBrief = assignment.flightNumber || assignment.origin || assignment.destination || assignment.routeId || assignment.reference;
    const briefing = canBrief ? `<button class="mr-row-action" type="button" data-brief-assignment="${escapeHtml(assignment.id)}" data-source-table="${escapeHtml(assignment.sourceTable)}">CARI / Print</button>` : "";
    return `<div class="mr-row-actions">${briefing}<button class="mr-row-action" type="button" data-change="${escapeHtml(assignment.id)}" data-source-table="${escapeHtml(assignment.sourceTable)}">Request change</button></div>`;
  }
  function assignmentRow(assignment) {
    const date = dateParts(assignment.startAt, assignment.timeZone);
    const location = assignment.location || assignment.baseCode || baseLabel();
    const timeZone = assignment.timeZone || "";
    return `<tr>
      <td><span class="mr-date-main">${escapeHtml(date.main)}</span><span class="mr-date-sub">${escapeHtml(date.sub)}</span></td>
      <td><div class="mr-assignment-cell"><strong>${escapeHtml(assignmentTitle(assignment))}</strong><span>${escapeHtml(assignment.details || assignment.notes || assignment.reference || "")}</span></div></td>
      <td><span class="mr-location">${escapeHtml(location)}</span></td>
      <td class="mr-time">${escapeHtml(formatTime(assignment.startAt, timeZone))}</td>
      <td class="mr-time">${escapeHtml(formatTime(assignment.endAt, timeZone))}</td>
      <td>${statusPill(assignment.status)}</td>
      <td>${rowAction(assignment)}</td>
    </tr>`;
  }
  function mobileAssignment(assignment) {
    const date = dateParts(assignment.startAt, assignment.timeZone);
    const location = assignment.location || assignment.baseCode || baseLabel();
    const timeZone = assignment.timeZone || "";
    return `<article class="mr-mobile-row">
      <div class="mr-mobile-head"><div class="mr-mobile-date">${escapeHtml(date.main)}<span>${escapeHtml(date.sub)}</span></div>${statusPill(assignment.status)}</div>
      <div class="mr-mobile-title">${escapeHtml(assignmentTitle(assignment))}</div>
      <div class="mr-mobile-location">${escapeHtml(location)}${assignment.details ? ` · ${escapeHtml(assignment.details)}` : ""}</div>
      <div class="mr-mobile-times"><span>Start <b>${escapeHtml(formatTime(assignment.startAt, timeZone))}</b></span><span>End <b>${escapeHtml(formatTime(assignment.endAt, timeZone))}</b></span></div>
      <div class="mr-mobile-action">${rowAction(assignment)}</div>
    </article>`;
  }
  function nextAssignment() {
    const now = Date.now();
    return state.assignments.filter((assignment) => {
      const start = Date.parse(assignment.startAt || "");
      const status = text(assignment.status).toUpperCase();
      return Number.isFinite(start) && start >= now && !["CANCELLED", "CANCELED", "COMPLETED", "DECLINED"].includes(status);
    }).sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt))[0] || null;
  }
  function renderNext() {
    const host = $("#nextAssignment");
    const actionHost = $("#nextAction");
    const next = nextAssignment();
    if (!next) {
      host.innerHTML = '<div class="mr-next-empty">Your upcoming SKANDI assignments will appear here when published.</div>';
      actionHost.innerHTML = "";
      return;
    }
    const date = dateParts(next.startAt, next.timeZone);
    const location = next.location || next.baseCode || baseLabel();
    host.innerHTML = `<div class="mr-next-main"><div class="mr-next-date"><strong>${escapeHtml(date.main)}</strong><span>${escapeHtml(date.sub)}</span></div><div class="mr-next-detail"><strong>${escapeHtml(assignmentTitle(next))}</strong><span>${escapeHtml(location)}${next.details ? ` · ${escapeHtml(next.details)}` : ""}</span></div><div class="mr-next-time">${escapeHtml(assignmentPeriod(next))}</div></div>`;
    const type = clockedIn() ? "CLOCK_OUT" : "CLOCK_IN";
    const label = type === "CLOCK_OUT" ? "Clock out" : "Clock in";
    actionHost.innerHTML = `<button class="mr-btn mr-btn-primary" type="button" data-clock="${type}" data-assignment-id="${escapeHtml(next.id)}" data-source-table="${escapeHtml(next.sourceTable)}">${label}</button>`;
  }
  function renderSchedule() {
    const rows = visibleAssignments();
    $("#assignmentCount").textContent = String(rows.length);
    const body = $("#scheduleBody");
    const mobile = $("#mobileSchedule");
    if (!rows.length) {
      const message = '<div class="mr-empty"><strong>No published assignments in this date range</strong><span>When SKANDI publishes a shift or destination duty for you, it will appear here.</span></div>';
      body.innerHTML = `<tr><td colspan="7">${message}</td></tr>`;
      mobile.innerHTML = message;
    } else {
      body.innerHTML = rows.map(assignmentRow).join("");
      mobile.innerHTML = rows.map(mobileAssignment).join("");
    }
    renderNext();
    renderTimeSummary();
  }
  function renderTimeSummary() {
    const hours = Number(state.boot?.hoursLast30Days);
    const display = Number.isFinite(hours) ? new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(hours) : "—";
    $("#hoursValue").textContent = display;
    $("#timeHours").textContent = display;
    const latest = state.clocks[0];
    if (latest) {
      const status = clockedIn() ? "Clocked in" : titleCase(latest.eventType);
      $("#clockSummary").textContent = `${status} · ${formatDateTime(latest.eventAt, latest.timeZone)}`;
      $("#latestClock").textContent = status;
      $("#latestClockTime").textContent = formatDateTime(latest.eventAt, latest.timeZone);
    } else {
      $("#clockSummary").textContent = "No attendance event recorded in this period.";
      $("#latestClock").textContent = "No event recorded";
      $("#latestClockTime").textContent = "—";
    }
    const balances = state.timeOffBalances;
    $("#balanceList").innerHTML = balances.length ? balances.map((balance) => `<div class="mr-balance-item"><strong>${escapeHtml(balance.balanceHours ?? "—")} ${escapeHtml(balance.unit || "hrs")}</strong><span>${escapeHtml(titleCase(balance.type || "Time off"))}${balance.year ? ` · ${escapeHtml(balance.year)}` : ""}</span></div>`).join("") : '<span class="mr-summary-foot">No balance records are available for your profile.</span>';
  }
  function renderClock() {
    const rows = state.clocks;
    const body = $("#clockBody");
    const mobile = $("#mobileClock");
    if (!rows.length) {
      body.innerHTML = '<tr><td colspan="5"><div class="mr-empty"><strong>No attendance events recorded</strong><span>Time events connected to your staff ID will appear here.</span></div></td></tr>';
      mobile.innerHTML = '<div class="mr-empty"><strong>No attendance events recorded</strong><span>Time events connected to your staff ID will appear here.</span></div>';
      return;
    }
    body.innerHTML = rows.map((row) => `<tr><td>${escapeHtml(formatDateTime(row.eventAt, row.timeZone))}</td><td>${escapeHtml(titleCase(row.eventType))}</td><td>${escapeHtml(row.assignmentLabel || "—")}</td><td>${escapeHtml(row.location || baseLabel())}</td><td>${statusPill(row.status)}</td></tr>`).join("");
    mobile.innerHTML = rows.map((row) => `<article class="mr-mobile-row"><div class="mr-mobile-head"><strong>${escapeHtml(formatDateTime(row.eventAt, row.timeZone))}</strong>${statusPill(row.status)}</div><div class="mr-mobile-title">${escapeHtml(titleCase(row.eventType))}</div><div class="mr-mobile-location">${escapeHtml(row.assignmentLabel || row.location || "Assigned destination")}</div></article>`).join("");
  }
  function renderRequests() {
    const rows = state.requests;
    const body = $("#requestsBody");
    const mobile = $("#mobileRequests");
    if (!rows.length) {
      body.innerHTML = '<tr><td colspan="5"><div class="mr-empty"><strong>No requests submitted</strong><span>Time-off or schedule-change requests you submit will appear here.</span></div></td></tr>';
      mobile.innerHTML = '<div class="mr-empty"><strong>No requests submitted</strong><span>Time-off or schedule-change requests you submit will appear here.</span></div>';
      return;
    }
    body.innerHTML = rows.map((row) => `<tr><td>${escapeHtml(formatDateTime(row.createdAt))}</td><td>${escapeHtml(titleCase(row.requestType))}</td><td>${escapeHtml(row.summary || "—")}</td><td>${statusPill(row.status)}</td><td>${escapeHtml(formatDateTime(row.updatedAt || row.createdAt))}</td></tr>`).join("");
    mobile.innerHTML = rows.map((row) => `<article class="mr-mobile-row"><div class="mr-mobile-head"><strong>${escapeHtml(titleCase(row.requestType))}</strong>${statusPill(row.status)}</div><div class="mr-mobile-location">${escapeHtml(row.summary || "—")}</div><div class="mr-mobile-times"><span>Submitted <b>${escapeHtml(formatDateTime(row.createdAt))}</b></span></div></article>`).join("");
  }
  function render() {
    if (!state.boot?.ok) return;
    state.assignments = Array.isArray(state.boot.assignments) ? state.boot.assignments : [];
    state.requests = Array.isArray(state.boot.requests) ? state.boot.requests : [];
    state.clocks = Array.isArray(state.boot.clockEvents) ? state.boot.clockEvents : [];
    state.timeOffBalances = Array.isArray(state.boot.timeOffBalances) ? state.boot.timeOffBalances : [];
    renderProfile();
    renderSchedule();
    renderClock();
    renderRequests();
    const synced = state.boot.syncedAt ? formatDateTime(state.boot.syncedAt) : "";
    setSync(synced ? `Synced ${synced}` : "Connected to SKANDI schedule", "ready");
    state.loading = false;
    state.lastSync = Date.now();
  }
  function showAccessError(message) {
    const error = $("#accessError");
    const detail = $("#accessErrorText");
    if (detail) detail.textContent = message || "Your SKANDI destination staff profile could not be verified.";
    if (error) error.hidden = false;
  }
  function errorMessage(code) {
    const messages = {
      MYROSTER_DESTINATION_ACCESS_REQUIRED: "MyRoster is limited to staff assigned to a SKANDI destination or airport team.",
      MYROSTER_DESTINATION_BASE_REQUIRED: "Your SKANDI profile needs an assigned destination or base before this page can load.",
      STAFF_AUTH_REQUIRED: "Sign in to RIAINTRA to view your staff schedule.",
      STAFF_ACCESS_DENIED: "Your SKANDI staff access could not be confirmed.",
      MYROSTER_ASSIGNMENT_NOT_FOUND: "That assignment is no longer available for your staff account.",
      MYROSTER_TIMEOFF_DATES_INVALID: "Enter a valid time-off date range.",
      MYROSTER_REQUEST_REASON_REQUIRED: "Add a short note explaining your schedule-change request.",
      MYROSTER_FLIGHT_SEARCH_TERM_REQUIRED: "Enter at least two characters for a flight or airport search.",
      MYROSTER_FLIGHT_SEARCH_RANGE_INVALID: "Choose a flight search date range of up to 14 days.",
      MYROSTER_FLIGHT_SEARCH_INVALID: "The flight search could not be completed."
    };
    return messages[text(code)] || text(code) || "The request could not be completed. Refresh and try again.";
  }
  function openDialog(dialog) {
    if (!dialog) return;
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "open");
  }
  function closeDialog(dialog) {
    if (!dialog) return;
    if (typeof dialog.close === "function") dialog.close();
    else dialog.removeAttribute("open");
  }
  function submitTimeOff(button) {
    const form = $("#timeOffForm");
    const data = new FormData(form);
    const startDate = text(data.get("startDate")).trim();
    const endDate = text(data.get("endDate")).trim();
    const notes = text(data.get("notes")).trim();
    if (!startDate || !endDate || startDate > endDate) return showToast("Choose a valid start and end date.", true);
    action("MYROSTER_TIMEOFF_REQUEST", { startDate, endDate, notes }, button, "Time-off request submitted for review.");
  }
  function submitShiftChange(button) {
    const form = $("#shiftChangeForm");
    const reason = text(new FormData(form).get("reason")).trim();
    if (!reason) return showToast("Describe the schedule change you are requesting.", true);
    action("MYROSTER_SHIFT_CHANGE_REQUEST", { reason, assignment: state.selectedAssignment || null }, button, "Schedule-change request submitted for review.");
  }
  function downloadCsv() {
    const rows = visibleAssignments();
    if (!rows.length) return showToast("There are no assignments in this date range to export.", true);
    const columns = ["date", "assignment", "location", "start_at", "end_at", "status"];
    const csv = [columns.join(","), ...rows.map((row) => [
      row.startAt ? dateInputValue(row.startAt) : "",
      assignmentTitle(row), row.location || row.baseCode || "", row.startAt || "", row.endAt || "", row.status || ""
    ].map((value) => `"${text(value).replace(/"/g, '""')}"`).join(","))].join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "skandi-my-schedule.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  root.addEventListener("click", (event) => {
    if (event.target.closest("#closeBriefing")) { closeDialog($("#briefingDialog")); return; }
    if (event.target.closest("#printBriefing")) { window.print(); return; }
    const flightBriefing = event.target.closest("[data-brief-flight]");
    if (flightBriefing) {
      const flight = state.flights.find((row) => row.id === flightBriefing.dataset.briefFlight);
      if (flight) renderBriefing(flight);
      return;
    }
    const assignmentBriefing = event.target.closest("[data-brief-assignment]");
    if (assignmentBriefing) {
      const assignment = state.assignments.find((row) => row.id === assignmentBriefing.dataset.briefAssignment && row.sourceTable === assignmentBriefing.dataset.sourceTable);
      if (assignment) renderBriefing({}, assignment);
      return;
    }
    const groupTalk = event.target.closest("#groupTalkLink");
    if (groupTalk && groupTalk.href && groupTalk.getAttribute("href") !== "#") {
      event.preventDefault();
      post("MYROSTER_NAVIGATE", { path: groupTalk.pathname });
      return;
    }
    const nav = event.target.closest("[data-nav]");
    if (nav) { event.preventDefault(); setActivePanel(nav.dataset.nav); return; }
    const refresh = event.target.closest("#refreshBtn, #timeRefreshBtn");
    if (refresh) { requestRefresh(); return; }
    if (event.target.closest("#exportBtn")) { downloadCsv(); return; }
    if (event.target.closest("#openTimeOff, #requestsTimeOff")) { openDialog($("#timeOffDialog")); return; }
    if (event.target.closest("#openShiftChange")) { state.selectedAssignment = null; $("#shiftChangeAssignment").textContent = "Describe the date or assignment you need your local schedule team to review."; openDialog($("#shiftChangeDialog")); return; }
    const change = event.target.closest("[data-change]");
    if (change) {
      const assignment = state.assignments.find((row) => row.id === change.dataset.change && row.sourceTable === change.dataset.sourceTable);
      state.selectedAssignment = assignment ? { id: assignment.id, sourceTable: assignment.sourceTable, label: assignmentTitle(assignment), startAt: assignment.startAt } : null;
      const description = state.selectedAssignment ? `${state.selectedAssignment.label}${state.selectedAssignment.startAt ? ` · ${formatDateTime(state.selectedAssignment.startAt)}` : ""}` : "This assignment is no longer available.";
      $("#shiftChangeAssignment").textContent = `Assignment under review: ${description}`;
      openDialog($("#shiftChangeDialog"));
      return;
    }
    const clock = event.target.closest("[data-clock]");
    if (clock) {
      const eventType = clock.dataset.clock;
      const assignmentId = clock.dataset.assignmentId;
      const sourceTable = clock.dataset.sourceTable;
      if (!assignmentId || !sourceTable) return showToast("Select a published assignment before recording time.", true);
      action("MYROSTER_CLOCK_EVENT_REQUEST", { eventType, assignmentId, sourceTable }, clock, `${titleCase(eventType)} recorded.`);
      return;
    }
    if (event.target.closest("#submitTimeOff")) { submitTimeOff(event.target.closest("#submitTimeOff")); return; }
    if (event.target.closest("#submitShiftChange")) { submitShiftChange(event.target.closest("#submitShiftChange")); }
  });
  ["#dateFrom", "#dateTo", "#statusFilter"].forEach((selector) => $(selector)?.addEventListener("change", () => {
    if (selector === "#statusFilter") renderSchedule();
    else requestRefresh();
  }));
  $("#flightSearchForm")?.addEventListener("submit", (event) => { event.preventDefault(); requestFlightSearch(); });
  $("#briefingDialog")?.addEventListener("click", (event) => {
    if (event.target === $("#briefingDialog")) closeDialog($("#briefingDialog"));
  });
  $("#timeOffForm")?.addEventListener("submit", (event) => event.preventDefault());
  $("#shiftChangeForm")?.addEventListener("submit", (event) => event.preventDefault());

  window.addEventListener("message", (event) => {
    if (event.source !== window.parent) return;
    const message = event.data || {};
    if (message.source !== PARENT_SOURCE) return;
    const payload = message.payload || {};
    if (message.type === "SKANDI_MASTER_CONFIG") {
      applyMasterConfig(payload);
      return;
    }
    if (message.type === "MYROSTER_FLIGHT_SEARCH_RESULTS") {
      if (payload.requestId && state.flightRequestId && payload.requestId !== state.flightRequestId) return;
      const button = $("#flightSearchButton");
      if (button) button.disabled = false;
      state.flightRequestId = "";
      renderFlightResults(payload.flights);
      const count = Array.isArray(payload.flights) ? payload.flights.length : 0;
      $("#flightSearchStatus").textContent = count
        ? `${count} matching record${count === 1 ? "" : "s"} · ${payload.dateRange?.from || ""} to ${payload.dateRange?.to || ""} · ${payload.sources?.join(" + ") || "ALTEA"}`
        : `No matching records · ${payload.dateRange?.from || ""} to ${payload.dateRange?.to || ""} · searched ${payload.sources?.join(" + ") || "ALTEA"}`;
      return;
    }
    if (message.type === "MYROSTER_BOOTSTRAP") {
      state.boot = payload;
      state.loading = false;
      if (payload.ok === false || payload.authorized === false) {
        showAccessError(errorMessage(payload.reason || "STAFF_ACCESS_DENIED"));
        setSync("Staff access required", "error");
        return;
      }
      render();
      return;
    }
    if (message.type === "MYROSTER_ACTION_OK") {
      const pending = state.pending.get(payload.requestId);
      if (pending) {
        state.pending.delete(payload.requestId);
        if (pending.button) pending.button.disabled = false;
        if (pending.button?.id === "submitTimeOff") { closeDialog($("#timeOffDialog")); $("#timeOffForm").reset(); }
        if (pending.button?.id === "submitShiftChange") { closeDialog($("#shiftChangeDialog")); $("#shiftChangeForm").reset(); state.selectedAssignment = null; }
        showToast(pending.successText || "SKANDI staff record saved.");
      }
      setSync("Connected to SKANDI schedule", "ready");
      return;
    }
    if (message.type === "MYROSTER_ERROR") {
      if (state.flightRequestId && payload.requestId === state.flightRequestId) {
        state.flightRequestId = "";
        if ($("#flightSearchButton")) $("#flightSearchButton").disabled = false;
        $("#flightSearchStatus").textContent = errorMessage(payload.code || payload.message);
      }
      const pending = state.pending.get(payload.requestId);
      if (pending) {
        state.pending.delete(payload.requestId);
        if (pending.button) pending.button.disabled = false;
      }
      const messageText = errorMessage(payload.code || payload.message);
      if (/DESTINATION_ACCESS_REQUIRED|DESTINATION_BASE_REQUIRED|STAFF_AUTH_REQUIRED|STAFF_ACCESS_DENIED/.test(text(payload.code || payload.message))) showAccessError(messageText);
      showToast(messageText, true);
      setSync("Could not save or refresh", "error");
    }
  });

  const today = new Date();
  $("#dateFrom").value = dateInputValue(offsetDate(today, -14));
  $("#dateTo").value = dateInputValue(offsetDate(today, 60));
  $("#flightDateFrom").value = dateInputValue(today);
  $("#flightDateTo").value = dateInputValue(offsetDate(today, 6));
  setSync("Connecting to staff schedule", "loading");
  post("MASTER_CONFIG_REQUEST", { purpose: "ALTEA_LOGO" });
  post("MYROSTER_READY", { from: $("#dateFrom").value, to: $("#dateTo").value });
})();
</script>
</body>
</html>

```
