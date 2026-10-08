# INFO / LOG — Store Control

- Canonical source identity: `/HTML_REF/riaintra/The Store Control.md`
- System area: `RIAINTRA`
- Wix page/controller: `/src/pages/The Store Control.y10le.js`
- Customer/internal route: `/riaintra/success-factors/store-control`
- Installed HTML element: `#storeControlEmbed`
- Complete replacement embed supplied as: `/embed/Store-Control.html` (paste into that Wix HTML component).
- Canonical backend chain: `backend/SKANDI_CORE/storeCartV3.web.js → storefront.js → Wix Stores V3 / eCommerce / native wix-marketing.v2 coupons`.
- Authority: SiteMember facade plus canonical requireStaffPortalSessionCore / Store administrator authorization before all merchant APIs.
- Status: V12 repair candidate; VERIFIED local tests / STATICALLY VERIFIED source contracts / REQUIRES LIVE TEST.
- Last source verification: 2026-10-07. Prepared against `skanditravels/SKANDI-TRAVELS`, `main`, commit `b7909cc5edbd87899bd9468577fc8e36eeb5d3fa`, retaining the approved V12 repairs.
- Intended source only: this package has not changed published Wix, GitHub or Supabase.
- Dependencies and live gates: existing masterPage/siteMap/staff/provider dependencies; rebuild and publish matching page, facade, core and embed together. See README for exact installation and live checks.

## Historical INFO / LOG (preserved)

Earlier route, component, controller and status claims below are historical; the current INFO above and latest repair entry supersede conflicting metadata.

No prior Store Control HTML_REF exists in the inspected Git tree or approved V12 source. Created from the complete user-supplied Store Control HTML.

## 2026-10-07 — V12 complete-chain repair

Migrates the disconnected supplied SKANDI_STOREFRONT_ADMIN / flat-payload embed onto the existing SKANDI_STORE_CONTROL_V3 / nested-payload page contract. Existing V3 exports remain. Connects product/variant edits, stock by location and revision, bulk prices, orders, category assignment and persisted inactive coupon drafts. Success follows backend confirmation. Ready-to-ship is a merchant comment; fulfillment is the Wix fulfillment API. Session Activity is explicitly local, not a persistent audit database.

Local verification covers syntax, imports/exports, embed boot, provider contracts with mocks, stale replies, cart failure propagation, same-instance order submission deduplication, order ownership boundaries, administrator authorization and inventory revision conflicts. These tests do not prove a live provider request, payment, data write or production build. No database migration is required.

Store Control uses one source (`SKANDI_STORE_CONTROL_V3`) and parent `SKANDI_WIX_PARENT`, with payload objects. Added requests: STORE_CONTROL_UPDATE_INVENTORY, STORE_CONTROL_UPDATE_ORDER, STORE_CONTROL_SAVE_COLLECTION, STORE_CONTROL_SAVE_PROMOTION. Existing product/variant/category/bulk request handlers are retained. Replies include STORE_CONTROL_BOOTSTRAP, PRODUCT, MUTATION_OK, BULK_RESULT, PROGRESS, IDLE and ERROR. Orders are limited to the latest 100; coupon listing is the first page returned by Wix. Cancel does not refund/restock; archive does not change payment; fulfillment can trigger the site’s configured notification. Coupon drafts are inactive until activated in Wix. Collection creation and product assignments are separate operations; individual failures are reported.

## Complete intended HTML

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"/>
<title>SKANDI Store Control Center</title>
<style>
:root{
  --blue:#022e64;
  --blue2:#0b3a7a;
  --cyan:#5FC7CF;
  --bg:#f3f5f8;
  --panel:#ffffff;
  --panel2:#f8fafc;
  --line:#d1d5db;
  --line2:#9ca3af;
  --text:#111827;
  --muted:#6b7280;
  --ok:#15803d;
  --warn:#b45309;
  --bad:#b91c1c;
  --dark:#020617;
  --dark2:#0b1220;
  --shadow:0 18px 50px rgba(15,23,42,.16);
  --radius:12px;
  --font:Tahoma,"Segoe UI",system-ui,-apple-system,BlinkMacSystemFont,sans-serif;
  --mono:"Consolas","Courier New",ui-monospace,monospace;

  /* compatibility names used by the backend-style shell */
  --hm-black:var(--dark);
  --hm-black-2:var(--dark2);
  --hm-red:var(--cyan);
  --hm-red-dark:var(--blue2);
  --hm-ink:var(--text);
  --hm-text:var(--text);
  --hm-muted:var(--muted);
  --hm-soft:var(--bg);
  --hm-line:var(--line);
  --hm-card:var(--panel);
  --hm-card-2:var(--panel2);
  --hm-success:var(--ok);
  --hm-warning:var(--warn);
  --hm-danger:var(--bad);
  --hm-blue:var(--blue);
  --hm-shadow:var(--shadow);
  --radius-sm:8px;
  --radius-md:12px;
  --radius-lg:16px;
}
*{box-sizing:border-box}
html,body{
  margin:0;
  min-height:100%;
  background:var(--hm-soft);
  color:var(--hm-text);
  font-family:Arial, Helvetica, sans-serif;
  font-size:12px;
}
body{overflow:auto}
button,input,select,textarea{font:inherit}
button{cursor:pointer}
#skInternalChrome{
  display:none!important;
  height:0!important;
  min-height:0!important;
  overflow:hidden!important;
}

/* SKANDI backend using the supplied operational system visual language */
.skandi-hm-ops{
  min-height:100vh;
  display:grid;
  grid-template-columns:258px minmax(0,1fr);
  background:
    linear-gradient(180deg,var(--bg) 0%,var(--panel2) 100%);
}
.ops-rail{
  background:#071b44;
  color:#fff;
  min-height:100vh;
  position:sticky;
  top:0;
  display:flex;
  flex-direction:column;
  border-right:1px solid var(--dark);
  box-shadow:6px 0 20px rgba(0,0,0,.06);
}
.ops-brand{
  padding:22px 18px 18px;
  border-bottom:1px solid rgba(255,255,255,.12);
}
.ops-brand__label{
  color:var(--line2);
  text-transform:uppercase;
  letter-spacing:.14em;
  font-size:10px;
  font-weight:700;
  margin-bottom:10px;
}
.ops-brand__mark{
  color:#fff;
  font-size:26px;
  line-height:1;
  letter-spacing:.04em;
  font-weight:900;
}
.ops-brand__tag{
  margin-top:10px;
  color:var(--line);
  line-height:1.45;
  font-size:11px;
}
.ops-brand__tag b{
  color:#fff;
  font-weight:900;
}
.ops-rail-search{
  padding:14px 14px 10px;
  border-bottom:1px solid rgba(255,255,255,.08);
}
.ops-rail-search input{
  width:100%;
  height:34px;
  border:1px solid rgba(255,255,255,.16);
  background:var(--dark2);
  color:#fff;
  outline:0;
  padding:0 11px;
  border-radius:var(--radius-sm);
}
.ops-rail-search input::placeholder{color:var(--line2)}
.ops-menu{
  padding:14px 10px;
  display:flex;
  flex-direction:column;
  gap:4px;
  overflow:auto;
}
.ops-menu__section{
  margin:10px 8px 6px;
  color:var(--line2);
  text-transform:uppercase;
  letter-spacing:.12em;
  font-size:9px;
  font-weight:800;
}
.nav-btn{
  appearance:none;
  border:0;
  width:100%;
  background:transparent;
  color:var(--line);
  min-height:40px;
  display:grid;
  grid-template-columns:28px minmax(0,1fr) auto;
  align-items:center;
  gap:9px;
  padding:8px 10px;
  text-align:left;
  border-left:3px solid transparent;
  border-radius:0;
  font-weight:700;
}
.nav-btn:hover{
  background:var(--blue2);
  color:#fff;
}
.nav-btn.active{
  background:#fff;
  color:#111;
  border-left-color:var(--hm-red);
}
.nav-icon{
  width:24px;
  height:24px;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  border-radius:50%;
  background:rgba(255,255,255,.12);
  color:inherit;
  font-family:Arial, Helvetica, sans-serif;
  font-size:10px;
  font-weight:900;
}
.nav-btn.active .nav-icon{
  background:var(--hm-red);
  color:#fff;
}
.nav-count{
  color:var(--line2);
  font-family:"Courier New",monospace;
  font-size:10px;
}
.nav-btn.active .nav-count{color:var(--muted)}
.ops-rail-footer{
  margin-top:auto;
  padding:15px 16px 18px;
  border-top:1px solid rgba(255,255,255,.10);
  color:var(--line);
  line-height:1.55;
}
.ops-rail-footer strong{
  display:block;
  color:#fff;
  margin-bottom:5px;
}
.ops-rail-footer .mini-led{
  display:inline-block;
  width:7px;
  height:7px;
  border-radius:50%;
  background:var(--ok);
  margin-right:6px;
  box-shadow:0 0 0 3px rgba(31,191,117,.16);
}

/* main */
.ops-main{
  min-width:0;
  display:flex;
  flex-direction:column;
}
.ops-topbar{
  min-height:68px;
  background:#fff;
  border-bottom:1px solid var(--hm-line);
  display:grid;
  grid-template-columns:minmax(250px,1fr) minmax(350px,560px) auto;
  gap:18px;
  align-items:center;
  padding:0 22px;
  position:sticky;
  top:0;
  z-index:40;
}
.ops-page-title{
  min-width:0;
}
.ops-page-title .eyebrow{
  color:var(--hm-red);
  text-transform:uppercase;
  letter-spacing:.12em;
  font-size:10px;
  font-weight:900;
}
.ops-page-title strong{
  display:block;
  margin-top:4px;
  color:#111;
  font-size:18px;
  line-height:1.1;
  letter-spacing:-.01em;
}
.ops-page-title span{
  display:block;
  margin-top:4px;
  color:var(--hm-muted);
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
}
.ops-command{
  display:grid;
  grid-template-columns:1fr auto;
  gap:8px;
  align-items:center;
}
.input,select,textarea{
  width:100%;
  border:1px solid var(--hm-line);
  background:#fff;
  color:#111;
  border-radius:var(--radius-sm);
  outline:0;
  transition:border .12s ease, box-shadow .12s ease;
}
.input,select{height:34px;padding:0 10px}
textarea{min-height:86px;padding:9px 10px;resize:vertical}
.input:focus,select:focus,textarea:focus{
  border-color:#111;
  box-shadow:0 0 0 2px rgba(0,0,0,.08);
}
.ops-meta{
  display:flex;
  align-items:center;
  justify-content:flex-end;
  gap:8px;
  white-space:nowrap;
}
.meta-chip,.health-toggle,.badge{
  min-height:30px;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  gap:7px;
  border:1px solid var(--hm-line);
  background:#fff;
  color:var(--text);
  padding:0 9px;
  font-size:10px;
  font-weight:900;
  text-transform:uppercase;
  letter-spacing:.04em;
}
.health-dot{
  width:8px;
  height:8px;
  border-radius:50%;
  background:var(--ok);
  box-shadow:0 0 0 3px rgba(8,127,91,.14);
}
.ops-subnav{
  min-height:42px;
  background:var(--panel2);
  border-bottom:1px solid var(--hm-line);
  display:flex;
  align-items:center;
  gap:7px;
  padding:0 22px;
  overflow:auto;
}
.ops-subnav span{
  color:var(--muted);
  font-weight:800;
  text-transform:uppercase;
  letter-spacing:.08em;
  font-size:10px;
}
.ops-subnav button{
  border:1px solid var(--hm-line);
  background:#fff;
  color:var(--text);
  min-height:28px;
  padding:0 9px;
  border-radius:999px;
  font-weight:800;
  font-size:10px;
}
.ops-subnav button:hover{border-color:#111}
.uniform-status-bar{margin:14px 22px 0}
.toast{
  display:none;
  border:1px solid #111;
  background:#111;
  color:#fff;
  padding:10px 12px;
  border-radius:var(--radius-sm);
  font-weight:800;
  box-shadow:var(--hm-shadow);
}
.ops-workspace{
  padding:14px 22px 34px;
  display:flex;
  flex-direction:column;
  gap:14px;
}
.panel{
  display:none;
  background:var(--hm-card);
  border:1px solid var(--hm-line);
  border-radius:var(--radius-md);
  box-shadow:0 1px 0 rgba(0,0,0,.02);
  overflow:hidden;
}
.panel.active{display:block}
.panel-header{
  min-height:58px;
  padding:12px 14px;
  background:#fff;
  border-bottom:1px solid var(--hm-line);
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:14px;
}
.panel-heading{min-width:0}
.panel-kicker{
  color:var(--hm-red);
  text-transform:uppercase;
  letter-spacing:.12em;
  font-weight:900;
  font-size:9px;
}
.panel h3{
  margin:4px 0 0;
  color:#111;
  font-size:15px;
  font-weight:900;
  letter-spacing:-.01em;
}
.panel h3::after{
  content:attr(data-subtitle);
  display:block;
  margin-top:4px;
  color:var(--hm-muted);
  font-size:11px;
  font-weight:500;
  letter-spacing:0;
  text-transform:none;
}
.panel-tools{
  display:flex;
  align-items:center;
  gap:7px;
  flex-wrap:wrap;
}
.panel-body{padding:14px}
.dashboard-grid{
  display:grid;
  grid-template-columns:repeat(4,minmax(0,1fr));
  gap:12px;
}
.kv-grid{
  display:grid;
  grid-template-columns:repeat(4,minmax(0,1fr));
  gap:12px;
}
.kv-tile,.metric-card,.ops-card{
  background:#fff;
  border:1px solid var(--hm-line);
  border-radius:var(--radius-md);
  padding:13px;
  min-height:92px;
}
.kv-tile{
  display:flex;
  flex-direction:column-reverse;
  justify-content:flex-end;
  gap:10px;
  border-top:3px solid #111;
}
.kv-tile span,.metric-label{
  color:var(--hm-muted);
  text-transform:uppercase;
  letter-spacing:.08em;
  font-weight:900;
  font-size:10px;
}
.kv-tile b,.metric-value{
  color:#111;
  font-size:26px;
  line-height:1;
  font-weight:900;
  letter-spacing:-.04em;
}
.metric-note{
  color:var(--hm-muted);
  margin-top:8px;
  line-height:1.45;
}
.ops-dashboard-lower{
  margin-top:14px;
  display:grid;
  grid-template-columns:1.1fr .9fr;
  gap:14px;
}
.process-list{
  display:grid;
  gap:8px;
}
.process-row{
  display:grid;
  grid-template-columns:110px 1fr auto;
  gap:10px;
  align-items:center;
  border:1px solid var(--hm-line);
  background:var(--panel2);
  padding:10px;
}
.process-row b{
  color:#111;
  font-weight:900;
}
.process-row span{color:var(--hm-muted)}
.progress-track{
  height:7px;
  border-radius:99px;
  background:var(--line);
  overflow:hidden;
}
.progress-fill{
  height:100%;
  background:#111;
  width:50%;
}
.ops-alert{
  border-left:3px solid var(--hm-red);
  background:var(--panel2);
  padding:12px;
  line-height:1.5;
}
.ops-alert strong{color:#111;display:block;margin-bottom:4px}
.form-grid{
  display:grid;
  grid-template-columns:repeat(4,minmax(130px,1fr));
  gap:10px;
}
.field{
  min-width:0;
  display:flex;
  flex-direction:column;
  gap:5px;
}
.field.wide{grid-column:span 2}
.field.full{grid-column:1 / -1}
.label{
  color:var(--muted);
  text-transform:uppercase;
  letter-spacing:.08em;
  font-size:10px;
  font-weight:900;
}
.row{
  display:flex;
  justify-content:flex-end;
  align-items:center;
  gap:7px;
  flex-wrap:wrap;
}
.form-actions{
  margin-top:12px;
  padding-top:12px;
  border-top:1px solid var(--hm-line);
}
.btn,.button{
  border:1px solid var(--hm-line);
  background:#fff;
  color:#111;
  min-height:32px;
  padding:0 10px;
  border-radius:var(--radius-sm);
  font-size:10px;
  font-weight:900;
  text-transform:uppercase;
  letter-spacing:.04em;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  gap:6px;
}
.btn:hover,.button:hover{border-color:#111;background:var(--panel2)}
.btn.primary,.button.primary{
  background:#111;
  border-color:#111;
  color:#fff;
}
.btn.ok{background:var(--ok);border-color:var(--ok);color:#fff}
.btn.warn{background:var(--warn);border-color:var(--warn);color:#fff}
.btn.bad{background:var(--bad);border-color:var(--bad);color:#fff}
.btn.red,.button.red{background:var(--hm-red);border-color:var(--hm-red);color:#fff}
.upload-box{
  border:1px solid var(--hm-line);
  background:var(--panel2);
  border-radius:var(--radius-md);
  padding:12px;
}
.upload-drop{
  display:grid;
  grid-template-columns:minmax(0,1fr) auto;
  grid-template-areas:"title button" "text button";
  gap:4px 12px;
  align-items:center;
  min-height:72px;
  border:1px dashed var(--line2);
  background:#fff;
  padding:14px;
  cursor:pointer;
}
.upload-drop:hover{border-color:#111}
.upload-drop__title{
  grid-area:title;
  color:#111;
  font-size:13px;
  font-weight:900;
}
.upload-drop__text{
  grid-area:text;
  color:var(--hm-muted);
  line-height:1.4;
}
.upload-drop__button{
  grid-area:button;
  background:#111;
  color:#fff;
  min-height:32px;
  padding:0 12px;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  font-size:10px;
  font-weight:900;
  text-transform:uppercase;
  letter-spacing:.04em;
}
.upload-input{
  position:absolute;
  width:1px;
  height:1px;
  overflow:hidden;
  opacity:0;
  pointer-events:none;
}
.upload-preview{
  margin-top:10px;
  display:grid;
  gap:8px;
}
.upload-card{
  display:grid;
  grid-template-columns:54px minmax(0,1fr) auto;
  align-items:center;
  gap:10px;
  border:1px solid var(--hm-line);
  background:#fff;
  padding:9px;
}
.upload-thumb{
  width:54px;
  height:54px;
  border:1px solid var(--hm-line);
  background:var(--panel2);
  display:flex;
  align-items:center;
  justify-content:center;
  overflow:hidden;
  color:#111;
  font-weight:900;
  font-size:11px;
}
.upload-thumb img{
  width:100%;
  height:100%;
  object-fit:cover;
  display:block;
}
.upload-name{
  color:#111;
  font-weight:900;
  overflow-wrap:anywhere;
}
.upload-meta{
  color:var(--hm-muted);
  margin-top:3px;
  line-height:1.4;
}
.upload-main{
  display:inline-flex;
  align-items:center;
  gap:6px;
  color:#111;
  font-size:10px;
  font-weight:900;
  text-transform:uppercase;
  letter-spacing:.04em;
  white-space:nowrap;
}
.upload-remove{
  border:0;
  background:rgba(185,28,28,.10);
  color:var(--bad);
  min-height:28px;
  padding:0 8px;
  font-size:10px;
  font-weight:900;
  text-transform:uppercase;
}
.upload-existing,.upload-empty,.upload-rule{
  color:var(--hm-muted);
  line-height:1.45;
}
.upload-existing{
  border:1px solid var(--hm-line);
  background:#fff;
  padding:9px;
}
.upload-empty{
  border:1px dashed var(--line2);
  background:#fff;
  padding:12px;
}
.upload-rule{
  margin-top:8px;
  font-size:11px;
}
.table{
  display:flex;
  flex-direction:column;
  gap:0;
  border:1px solid var(--hm-line);
  border-radius:var(--radius-md);
  overflow:auto;
  background:#fff;
}
.admin-row{
  display:grid;
  grid-template-columns:minmax(0,1fr) auto;
  gap:12px;
  align-items:center;
  min-height:54px;
  padding:11px 12px;
  border-bottom:1px solid var(--hm-line);
}
.admin-row:last-child{border-bottom:0}
.admin-row:hover{background:var(--panel2)}
.item-title{
  color:#111;
  font-size:12px;
  font-weight:900;
  line-height:1.25;
  overflow-wrap:anywhere;
}
.item-sub{
  margin-top:4px;
  color:var(--hm-muted);
  line-height:1.45;
  overflow-wrap:anywhere;
}
.empty{
  border:1px dashed var(--line2);
  background:var(--panel2);
  color:var(--hm-muted);
  padding:28px;
  text-align:center;
}
.list-with-toolbar{
  margin-top:14px;
}
.list-titlebar{
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:10px;
  padding:0 0 8px;
}
.list-titlebar strong{
  color:#111;
  font-size:12px;
  text-transform:uppercase;
  letter-spacing:.08em;
}
.status-strip{
  display:grid;
  grid-template-columns:repeat(5,minmax(0,1fr));
  border:1px solid var(--hm-line);
  background:#fff;
  margin-bottom:14px;
}
.status-strip div{
  padding:10px 12px;
  border-right:1px solid var(--hm-line);
}
.status-strip div:last-child{border-right:0}
.status-strip span{
  display:block;
  color:var(--hm-muted);
  font-size:10px;
  text-transform:uppercase;
  letter-spacing:.08em;
  font-weight:900;
}
.status-strip b{
  display:block;
  margin-top:4px;
  color:#111;
  font-size:13px;
}
.mono{
  font-family:"Courier New", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}
.pill,.status-badge{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  border-radius:999px;
  min-height:22px;
  padding:0 8px;
  font-size:10px;
  font-weight:900;
  text-transform:uppercase;
  letter-spacing:.04em;
}
.pill.ok,.status-shipped{background:rgba(21,128,61,.10);color:var(--ok)}
.pill.warn,.status-pending{background:rgba(180,83,9,.12);color:var(--warn)}
.pill.bad,.status-cancelled{background:rgba(185,28,28,.10);color:var(--bad)}
.pill.info,.status-picking{background:rgba(2,46,100,.10);color:var(--blue)}
.ops-note{
  color:var(--hm-muted);
  line-height:1.5;
}
.hidden-compat{
  position:absolute!important;
  width:1px!important;
  height:1px!important;
  overflow:hidden!important;
  opacity:0!important;
  pointer-events:none!important;
}
@media(max-width:1180px){
  .ops-topbar{grid-template-columns:1fr;position:static;height:auto;padding:14px 16px}
  .ops-meta{justify-content:flex-start;flex-wrap:wrap}
  .dashboard-grid,.kv-grid,.status-strip{grid-template-columns:repeat(2,minmax(0,1fr))}
  .ops-dashboard-lower{grid-template-columns:1fr}
  .form-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
  .field.wide,.field.full{grid-column:1 / -1}
}
@media(max-width:820px){
  .skandi-hm-ops{grid-template-columns:1fr}
  .ops-rail{position:static;min-height:auto}
  .ops-menu{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}
  .ops-menu__section{grid-column:1 / -1}
  .ops-command{grid-template-columns:1fr}
  .dashboard-grid,.kv-grid,.status-strip,.form-grid{grid-template-columns:1fr}
  .ops-workspace{padding:12px}
  .uniform-status-bar{margin:12px 12px 0}
  .admin-row{grid-template-columns:1fr}
  .row{justify-content:stretch}
  .btn,.button{width:auto}
}
@media(max-width:540px){
  .ops-menu{grid-template-columns:1fr}
  .ops-meta>*{width:100%;justify-content:center}
  .btn,.button{width:100%}
}




/* Supplied SKANDI blue/cyan palette overrides */
html,body{
  background:var(--bg);
  color:var(--text);
  font-family:var(--font);
}
button,input,select,textarea{font-family:var(--font)}
.skandi-hm-ops{
  background:linear-gradient(180deg,var(--bg) 0%,var(--panel2) 100%);
}
.ops-rail{
  background:linear-gradient(180deg,var(--dark) 0%,var(--dark2) 100%);
  border-right-color:var(--dark2);
}
.ops-brand__mark{color:#fff}
.ops-brand__label,.ops-menu__section,.nav-count{color:var(--line2)}
.ops-rail-search input{
  background:var(--dark2);
  border-color:rgba(209,213,219,.18);
}
.nav-btn:hover{
  background:rgba(95,199,207,.12);
  color:#fff;
}
.nav-btn.active{
  background:var(--panel);
  color:var(--blue);
  border-left-color:var(--cyan);
}
.nav-btn.active .nav-icon{
  background:var(--cyan);
  color:var(--dark);
}
.nav-btn.active .nav-count{color:var(--blue2)}
.ops-topbar,.panel-header,.kv-tile,.metric-card,.ops-card,.panel,.table,.admin-row,.status-strip,.upload-card,.upload-existing{
  background:var(--panel);
}
.ops-subnav,.process-row,.upload-box,.empty{
  background:var(--panel2);
}
.ops-page-title .eyebrow,.panel-kicker{
  color:var(--blue);
}
.ops-page-title strong,.panel h3,.kv-tile b,.metric-value,.process-row b,.item-title,.list-titlebar strong,.status-strip b,.upload-name,.upload-drop__title{
  color:var(--text);
}
.input,select,textarea,.meta-chip,.health-toggle,.badge,.ops-subnav button,.btn,.button{
  border-color:var(--line);
  background:var(--panel);
  color:var(--text);
}
.input:focus,select:focus,textarea:focus{
  border-color:var(--cyan);
  box-shadow:0 0 0 3px rgba(95,199,207,.20);
}
.ops-subnav button:hover,.btn:hover,.button:hover,.upload-drop:hover{
  border-color:var(--cyan);
}
.toast,.btn.primary,.button.primary,.upload-drop__button{
  background:var(--blue);
  border-color:var(--blue);
  color:#fff;
}
.btn.primary:hover,.button.primary:hover,.upload-drop__button:hover{
  background:var(--blue2);
  border-color:var(--blue2);
}
.btn.red,.button.red{
  background:var(--cyan);
  border-color:var(--cyan);
  color:var(--dark);
}
.btn.ok{background:var(--ok);border-color:var(--ok);color:#fff}
.btn.warn{background:var(--warn);border-color:var(--warn);color:#fff}
.btn.bad{background:var(--bad);border-color:var(--bad);color:#fff}
.kv-tile{
  border-top-color:var(--blue);
}
.progress-fill{
  background:linear-gradient(90deg,var(--blue),var(--cyan));
}
.ops-alert{
  border-left-color:var(--cyan);
  background:var(--panel2);
}
.health-dot,.ops-rail-footer .mini-led{
  background:var(--ok);
  box-shadow:0 0 0 3px rgba(21,128,61,.16);
}
.upload-drop{
  border-color:var(--line2);
  background:var(--panel);
}
.upload-thumb{
  background:var(--panel2);
  color:var(--blue);
}
.upload-remove{
  background:rgba(185,28,28,.10);
  color:var(--bad);
}
.pill.ok,.status-shipped{background:rgba(21,128,61,.10);color:var(--ok)}
.pill.warn,.status-pending{background:rgba(180,83,9,.12);color:var(--warn)}
.pill.bad,.status-cancelled{background:rgba(185,28,28,.10);color:var(--bad)}
.pill.info,.status-picking{background:rgba(2,46,100,.10);color:var(--blue)}
.ops-rail-footer strong,.nav-btn .nav-icon{color:inherit}
.mono{font-family:var(--mono)}

/* Store-control functional helpers; visual tokens match the replica shell. */
.code{font-family:var(--mono);font-size:11px;color:var(--muted)}
.stock-low{color:var(--bad);font-weight:900}
.stock-ok{color:var(--ok);font-weight:900}
.stock-watch{color:var(--warn);font-weight:900}
pre{
  margin:0;
  background:var(--dark);
  color:#dbeafe;
  border-radius:var(--radius-md);
  padding:14px;
  overflow:auto;
  font-size:12px;
  line-height:1.45;
  font-family:var(--mono);
}

</style>
</head>
<body>

<div class="skandi-hm-ops app-shell app">
  <aside class="ops-rail uniform-sidebar side-rail" aria-label="SKANDI Store backend navigation">
    <div class="ops-brand">
      <div class="ops-brand__label">SKANDI GROUP</div>
      <div class="ops-brand__mark">THE STORE</div>
      <div class="ops-brand__tag"><b>Control Center</b></div>
    </div>

    <div class="ops-rail-search">
      <input id="query" class="input search" type="search" placeholder="Search SKU, product, order, customer…" />
    </div>

    <nav id="sideNav" class="ops-menu nav-group">
      <div class="ops-menu__section">Operations</div>
      <button class="nav-btn nav-button active" data-panel="dashboard" type="button"><span class="nav-icon">D</span><span>Dashboard</span></button>
      <button class="nav-btn nav-button" data-panel="orders" type="button"><span class="nav-icon">O</span><span>Order Queue</span><span class="nav-count">ECOM</span></button>
      <button class="nav-btn nav-button" data-panel="products" type="button"><span class="nav-icon">P</span><span>Product Catalog</span><span class="nav-count">SKU</span></button>
      <button class="nav-btn nav-button" data-panel="inventory" type="button"><span class="nav-icon">I</span><span>Inventory</span><span class="nav-count">VAR</span></button>

      <div class="ops-menu__section">Configuration</div>
      <button class="nav-btn nav-button" data-panel="collections" type="button"><span class="nav-icon">C</span><span>Collections</span><span class="nav-count">SET</span></button>
      <button class="nav-btn nav-button" data-panel="discounts" type="button"><span class="nav-icon">%</span><span>Promotions</span><span class="nav-count">RULE</span></button>

      <div class="ops-menu__section">Trace</div>
      <button class="nav-btn nav-button" data-panel="audit" type="button"><span class="nav-icon">L</span><span>Session Activity</span><span class="nav-count">LOG</span></button>
    </nav>

    <div class="ops-rail-footer">
      <strong><span class="mini-led"></span>Operating with no issues</strong>
      Operator: <span class="mono">STOREFRONT</span><br>
      Access: <span class="mono">RETAIL</span><br>
      Sync: <span class="mono">LIVE</span>
    </div>
  </aside>

  <main class="ops-main main-shell uniform-workspace">
    <div class="uniform-status-bar">
      <div class="toast" id="status">Loading Store Control...</div>
    </div>

    <section class="ops-workspace workspace uniform-content" id="workspace">
      <section class="panel active" id="panel-dashboard">
        <div class="panel-header">
          <div class="panel-heading">
            <div class="panel-kicker">Control overview</div>
            <h3 data-subtitle="Live Storefront totals, connection state, and admin readiness.">Store operations status</h3>
          </div>
          <div class="panel-tools">
            <span class="pill ok">Store control</span>
            <span class="pill info mono">LIVE ADMIN</span>
          </div>
        </div>
        <div class="panel-body">
          <div class="status-strip">
            <div><span>System</span><b>Storefront</b></div>
            <div><span>Owner</span><b>SKANDI</b></div>
            <div><span>Mode</span><b>Admin</b></div>
            <div><span>Queue</span><b>Live Sync</b></div>
            <div><span>Style</span><b>Backend Ops</b></div>
          </div>
          <div class="kv-grid" id="statsGrid"></div>
          <div class="ops-dashboard-lower">
            <div class="ops-card">
              <div class="panel-kicker">Store health</div>
              <h3 data-subtitle="Operational snapshot from products, inventory, orders, and Storefront permissions.">Backend checks</h3>
              <div class="process-list" id="healthFeed"></div>
            </div>
            <div class="ops-card">
              <div class="panel-kicker">Stock attention</div>
              <h3 data-subtitle="Products below reorder threshold returned by Storefront inventory.">Critical stock</h3>
              <div id="lowStockFeed"></div>
            </div>
          </div>
        </div>
      </section>

      <section class="panel" id="panel-orders">
        <div class="panel-header">
          <div class="panel-heading">
            <div class="panel-kicker">Order management</div>
            <h3 data-subtitle="Review the Storefront order queue and send fulfilment actions through SKANDI.">Storefront order queue</h3>
          </div>
          <div class="panel-tools">
            <select class="select" id="orderFilter" style="width:190px">
              <option value="">All statuses</option>
              <option value="PAID">Paid</option>
              <option value="NOT_FULFILLED">Unfulfilled</option>
              <option value="PARTIALLY_FULFILLED">Partially fulfilled</option>
              <option value="FULFILLED">Fulfilled</option>
              <option value="CANCELED">Canceled</option>
            </select>
            <button class="btn primary red" id="refreshOrdersBtn" type="button">Refresh Orders</button>
          </div>
        </div>
        <div class="panel-body">
          <div class="status-strip">
            <div><span>Payment</span><b>From Wix</b></div>
            <div><span>Pick</span><b>Unfulfilled</b></div>
            <div><span>Pack</span><b>Order note</b></div>
            <div><span>Ship</span><b>Tracking</b></div>
            <div><span>Activity</span><b>This session</b></div>
          </div>
          <div class="table" id="orderPipeline"></div>

          <div class="list-with-toolbar">
            <div class="list-titlebar"><strong>Fulfillment action</strong><span class="ops-note">Send order lifecycle updates to SKANDI Storefront.</span></div>
            <div class="form-grid">
              <div class="field"><label class="label" for="fulfillmentOrderId">Order ID</label><input class="input" id="fulfillmentOrderId" placeholder="Storefront order ID"/></div>
              <div class="field"><label class="label" for="fulfillmentStatus">Action</label><select class="select" id="fulfillmentStatus"><option value="READY">Add ready-to-ship note</option><option value="FULFILLED">Mark fulfilled</option><option value="CANCELED">Cancel order</option><option value="ARCHIVED">Archive order</option></select></div>
              <div class="field"><label class="label" for="carrier">Carrier</label><input class="input" id="carrier" placeholder="DHL / PostNord / Bring"/></div>
              <div class="field"><label class="label" for="trackingNumber">Tracking Number</label><input class="input" id="trackingNumber" placeholder="Tracking number"/></div>
              <div class="field full"><label class="label" for="orderNote">Internal Note</label><textarea class="textarea" id="orderNote" placeholder="Note saved with the ready-to-ship action"></textarea></div>
            </div>
            <div class="row form-actions"><button class="btn primary red" id="sendFulfillmentBtn" type="button">Send Fulfillment Update</button><button class="btn" id="clearFulfillmentBtn" type="button">Clear</button></div>
          </div>
        </div>
      </section>

      <section class="panel" id="panel-products">
        <div class="panel-header">
          <div class="panel-heading">
            <div class="panel-kicker">Product data</div>
            <h3 data-subtitle="Create, update, hide, and publish Storefront products through SKANDI.">Product catalog</h3>
          </div>
          <div class="panel-tools">
            <span class="pill info" id="productModeBadge">New product</span>
          </div>
        </div>
        <div class="panel-body">
          <div class="form-grid">
            <div class="field wide"><label class="label" for="productName">Product Name</label><input class="input" id="productName" placeholder="Cabin crew blazer"/></div>
            <div class="field"><label class="label" for="productSku">SKU</label><input class="input" id="productSku" placeholder="SKD-BLZ-001"/></div>
            <div class="field"><label class="label" for="productVariant">Variant to edit</label><select class="select" id="productVariant"></select></div><div class="field"><label class="label" for="productPrice">Price</label><input class="input" id="productPrice" type="number" step="0.01" min="0" placeholder="49.00"/></div>
            <div class="field"><label class="label" for="productCurrency">Currency</label><input readonly class="input" id="productCurrency" value="USD" placeholder="USD"/></div>
            <div class="field"><label class="label" for="productCollection">Collection</label><select class="select" id="productCollection"></select></div>
            <div class="field"><label class="label" for="productVisible">Visibility</label><select class="select" id="productVisible"><option value="true">Visible</option><option value="false">Hidden</option></select></div>
            <div class="field"><label class="label" for="productWeight">Weight</label><input class="input" id="productWeight" type="number" step="0.01" min="0" placeholder="0.4"/></div>
            <div class="field"><label class="label" for="productTrackInventory">Track Inventory</label><select class="select" id="productTrackInventory"><option value="true">Track stock</option><option value="false">Do not track</option></select></div>
            <div class="field full"><label class="label" for="productDescription">Description</label><textarea class="textarea" id="productDescription" placeholder="Product description visible in Storefront"></textarea></div>
            <div class="field full">
              <label class="label">Product media</label>
              <div class="upload-box">
                <div class="upload-existing">Product media is managed in the canonical Supabase Media Control. Store Control never creates duplicate Data URL media.</div>
                <div class="row" style="justify-content:flex-start;margin-top:8px">
                  <button class="btn primary" id="openMediaControlBtn" type="button">Open Media Control</button>
                </div>
              </div>
            </div>
          </div>
          <div class="row form-actions">
            <button class="btn primary red" id="saveProductBtn" type="button">Save Product</button>
            <button class="btn" id="clearProductBtn" type="button">Clear Product</button>
            <div class="field"><label>Bulk product IDs</label><textarea class="input" id="bulkProductIds"></textarea><select id="bulkPriceOperation" class="select"><option value="PERCENT">Percent change</option><option value="SET">Set price</option><option value="ADD">Add amount</option><option value="SUBTRACT">Subtract amount</option></select><input id="bulkPriceValue" class="input" type="number" step="0.01"><button id="bulkPriceBtn" class="btn" type="button">Update selected prices</button></div><button class="btn bad" id="deleteProductBtn" type="button">Hide Product</button>
          </div>
          <div class="list-with-toolbar">
            <div class="list-titlebar"><strong>Product records</strong><span class="ops-note">Live products returned by SKANDI Storefront.</span></div>
            <div class="table" id="productsTable"></div>
          </div>
        </div>
      </section>

      <section class="panel" id="panel-inventory">
        <div class="panel-header">
          <div class="panel-heading">
            <div class="panel-kicker">Inventory control</div>
            <h3 data-subtitle="Update storefront inventory per product or variant.">Inventory board</h3>
          </div>
          <div class="panel-tools">
            <span class="pill warn">Elevated backend required</span>
            <button class="btn primary red" id="refreshInventoryBtn" type="button">Refresh Inventory</button>
          </div>
        </div>
        <div class="panel-body">
          <div class="form-grid">
            <div class="field wide"><label class="label" for="inventoryRecord">Stock record / location</label><select class="select" id="inventoryRecord"></select></div><div class="field"><label class="label" for="inventoryProductId">Product ID</label><input class="input" readonly id="inventoryProductId" placeholder="Product ID"/></div>
            <div class="field"><label class="label" for="inventoryVariantId">Variant ID</label><input class="input" readonly id="inventoryVariantId" placeholder="Variant ID, optional"/></div>
            <div class="field"><label class="label" for="inventorySku">SKU</label><input class="input" id="inventorySku" placeholder="SKU reference"/></div>
            <div class="field"><label class="label" for="inventoryMode">Mode</label><select class="select" id="inventoryMode"><option value="SET">Set exact quantity</option><option value="INCREMENT">Increment quantity</option><option value="DECREMENT">Decrement quantity</option></select></div>
            <div class="field"><label class="label" for="inventoryQuantity">Quantity</label><input class="input" id="inventoryQuantity" type="number" step="1" placeholder="10"/></div>
            <div class="field"><label class="label" for="inventoryTracked">Tracking</label><select class="select" id="inventoryTracked"><option value="true">Tracked</option><option value="false">Not tracked</option></select></div>
            <div class="field full"><label class="label" for="inventoryReason">Reason (session note)</label><textarea class="textarea" id="inventoryReason" placeholder="Stock count, return, damaged item, supplier delivery..."></textarea></div>
          </div>
          <div class="row form-actions"><button class="btn primary red" id="updateInventoryBtn" type="button">Update Inventory</button><button class="btn" id="clearInventoryBtn" type="button">Clear</button></div>
          <div class="list-with-toolbar">
            <div class="list-titlebar"><strong>Inventory records</strong><span class="ops-note">Current stock levels, low-stock flags, and variant tracking.</span></div>
            <div class="table" id="inventoryTable"></div>
          </div>
        </div>
      </section>

      <section class="panel" id="panel-collections">
        <div class="panel-header">
          <div class="panel-heading">
            <div class="panel-kicker">Store setup</div>
            <h3 data-subtitle="Create/update collections and assign Storefront products to collection groups.">Collection manager</h3>
          </div>
        </div>
        <div class="panel-body">
          <div class="form-grid">
            <div class="field wide"><label class="label" for="collectionId">Assign products to collection</label><select class="select" id="collectionId"></select></div><div class="field wide"><label class="label" for="collectionTitle">Collection Name</label><input class="input" id="collectionTitle" placeholder="Storefront Essentials"/></div>
            <div class="field"><label class="label" for="collectionSlug">Slug</label><input class="input" id="collectionSlug" placeholder="uniform-essentials"/></div>
            <div class="field full"><label class="label" for="collectionDescription">Description</label><textarea class="textarea" id="collectionDescription" placeholder="Collection description"></textarea></div>
            <div class="field full"><label class="label" for="collectionProductIds">Product IDs</label><textarea class="textarea" id="collectionProductIds" placeholder="One product ID per line, or comma separated"></textarea></div>
          </div>
          <div class="row form-actions">
            <button class="btn primary red" id="saveCollectionBtn" type="button">Create Collection</button>
            <button class="btn" id="assignCollectionBtn" type="button">Assign Products</button>
            <button class="btn" id="clearCollectionBtn" type="button">Clear</button>
          </div>
          <div class="list-with-toolbar">
            <div class="list-titlebar"><strong>Collection records</strong><span class="ops-note">Returned by SKANDI Storefront.</span></div>
            <div class="table" id="collectionsList"></div>
          </div>
        </div>
      </section>

      <section class="panel" id="panel-discounts">
        <div class="panel-header">
          <div class="panel-heading">
            <div class="panel-kicker">Promotion rules</div>
            <h3 data-subtitle="Draft store promotions/coupons for SKANDI Storefront.">Promotions</h3>
          </div>
          <div class="panel-tools"><span class="pill warn">Draft workflow</span></div>
        </div>
        <div class="panel-body">
          <div class="form-grid">
            <div class="field wide"><label class="label" for="promoName">Promotion Name</label><input class="input" id="promoName" placeholder="Crew launch discount"/></div>
            <div class="field"><label class="label" for="promoCode">Code</label><input class="input" id="promoCode" placeholder="CREW10"/></div>
            <div class="field"><label class="label" for="promoType">Type</label><select class="select" id="promoType"><option value="PERCENT">Percent</option><option value="AMOUNT">Amount</option><option value="FREE_SHIPPING">Free shipping</option></select></div>
            <div class="field"><label class="label" for="promoValue">Value</label><input class="input" id="promoValue" type="number" step="0.01" placeholder="10"/></div>
            <div class="field"><label class="label" for="promoStarts">Starts</label><input class="input" id="promoStarts" type="date"/></div>
            <div class="field"><label class="label" for="promoEnds">Ends</label><input class="input" id="promoEnds" type="date"/></div>
            <div class="field full"><label class="label" for="promoScope">Scope</label><textarea class="textarea" id="promoScope" placeholder="Collections, product IDs, staff segment, limits..."></textarea></div>
          </div>
          <div class="row form-actions"><button class="btn primary red" id="savePromoBtn" type="button">Save Promotion Draft</button><button class="btn" id="clearPromoBtn" type="button">Clear</button></div>
          <div class="list-with-toolbar">
            <div class="list-titlebar"><strong>Promotion records</strong><span class="ops-note">Local drafts plus SKANDI Storefront responses.</span></div>
            <div class="table" id="promotionsList"></div>
          </div>
        </div>
      </section>
      <section class="panel" id="panel-audit">
        <div class="panel-header">
          <div class="panel-heading">
            <div class="panel-kicker">Trace events</div>
            <h3 data-subtitle="Local actions plus audit events returned by SKANDI Storefront.">Audit log</h3>
          </div>
          <div class="panel-tools"><button class="btn primary red" id="clearAuditBtn" type="button">Clear Local Audit</button></div>
        </div>
        <div class="panel-body">
          <div class="table" id="auditTable"></div>
        </div>
      </section>
    </section>
  </main>
</div>

<script>

const SOURCE="SKANDI_STORE_CONTROL_V3";
const PARENT="SKANDI_WIX_PARENT";
const STOREFRONT_APP_ID="215238eb-22a5-4c36-9e7b-e7c08025e04e";
let backendResponded=false, BUSY=false;
let detail=null,lastMutation=null;
function busy(v){BUSY=v;document.querySelectorAll("button").forEach(b=>b.disabled=v)}
let state={
  session:{},
  stats:{products:"—",orders:"—",openOrders:"—",lowStock:"—",collections:"—",revenue:"—"},
  products:[],
  orders:[],
  inventory:[],
  collections:[],
  promotions:[],
  audit:[],
  editingProductId:"",
  productUploads:[],
  mainUploadIndex:null,
  storeUrl:""
};

const $=id=>document.getElementById(id);
const money=(v,c="USD")=>{const n=Number(v||0);try{return new Intl.NumberFormat("en-US",{style:"currency",currency:c||"USD"}).format(n)}catch(e){return "$"+n.toFixed(2)}}
function esc(v=""){return String(v??"").replace(/[&<>"']/g,s=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[s]))}
function post(type,payload={}){
  if(/^STORE_CONTROL_(CREATE_|SAVE_|SET_|BULK_|DELETE_|UPDATE_)/.test(type)){if(BUSY)return;lastMutation={type,payload};busy(true);status("Saving to Wix…")}
  window.parent.postMessage({source:SOURCE,type,payload,timestamp:new Date().toISOString()},"*")
}
function audit(action,detail,mode=""){state.audit.unshift({time:new Date().toISOString(),action,detail,mode});renderAudit()}
function status(msg,mode=""){const e=$("status");e.textContent=msg||"";e.style.display=msg?"block":"none";e.style.background=mode==="error"?"#b91c1c":mode==="ok"?"#15803d":mode==="warn"?"#b45309":"#020617"}
function arr(v){return Array.isArray(v)?v:String(v||"").split(/[\n,]/).map(x=>x.trim()).filter(Boolean)}
function bool(v){return v===true||String(v)==="true"}
function activePanel(name){
  const labels={
    dashboard:["Store Control Center","Live store operations, product maintenance, order fulfilment, and inventory control."],
    orders:["Storefront Orders","Operate payment, picking, fulfilment, tracking, and cancellations."],
    products:["Product Catalog","Create, update, hide, and publish Storefront products."],
    inventory:["Inventory Control","Update product and variant stock through SKANDI Storefront inventory."],
    collections:["Collection Manager","Manage store collections and product routing."],
    discounts:["Promotions","Draft and send promotion/coupon payloads to SKANDI Storefront."],
    audit:["Session Activity","Actions confirmed during this browser session."]
  };
  document.querySelectorAll("[data-panel]").forEach(b=>b.classList.toggle("active",b.dataset.panel===name));
  document.querySelectorAll(".panel[id^='panel-']").forEach(p=>p.classList.toggle("active",p.id===`panel-${name}`));
  if($("currentWorkspaceTitle")&&labels[name])$("currentWorkspaceTitle").textContent=labels[name][0];
  if($("currentWorkspaceSubtitle")&&labels[name])$("currentWorkspaceSubtitle").textContent=labels[name][1];
}
document.querySelectorAll("[data-panel]").forEach(b=>b.onclick=()=>activePanel(b.dataset.panel));
document.querySelectorAll("[data-panel-jump]").forEach(b=>b.onclick=()=>activePanel(b.dataset.panelJump));

function seedData(){
  state={
    ...state,
    stats:{products:"—",orders:"—",openOrders:"—",lowStock:"—",collections:"—",revenue:"—"},
    products:[],
    inventory:[],
    orders:[],
    collections:[],
    promotions:[],
    audit:[{time:new Date().toISOString(),action:"SESSION_START",detail:"Storefront session initialized.",mode:"ok"}]
  };
}

function render(p={}){
  state={...state,...p};
  if(p && Object.keys(p).length){backendResponded=true}
  if($("apiBadge")){
    $("apiBadge").textContent=backendResponded?(Object.keys(state.serviceErrors||{}).length?"Partially connected":"Storefront connected"):"Connection pending";
    $("apiBadge").className="pill "+(backendResponded?"ok":"warn");
  }
  renderStats();
  renderHealth();
  renderProducts();
  renderInventory();
  renderOrders();
  renderCollections();
  renderPromotions();
  renderAudit();
  renderCollectionOptions();
}
function renderStats(){
  const stats=[
    ["Products",state.stats.products??state.products.length],
    ["Open orders (latest 100)",state.stats.openOrders??"Unavailable"],
    ["Low Stock",state.stats.lowStock??"Unavailable"],
    ["Collections",state.stats.categories??"—"]
  ];
  $("statsGrid").innerHTML=stats.map(([k,v])=>`<div class="kv-tile"><b>${esc(v)}</b><span>${esc(k)}</span></div>`).join("");
}
function renderHealth(){
  const checks=[
    ["Product service",backendResponded?"Connected":"Waiting for Storefront connection",backendResponded?"live":"warn"],
    ["Inventory service",state.serviceErrors?.inventory|| (backendResponded?"Ready":"Connection required"),backendResponded&&!state.serviceErrors?.inventory?"live":"warn"],
    ["Order service",state.serviceErrors?.orders||(backendResponded?"Latest 100 orders":"Connection required"),backendResponded&&!state.serviceErrors?.orders?"live":"warn"],
    ["Store session",backendResponded?"Live":"Pending",backendResponded?"live":"warn"]
  ];
  $("healthFeed").innerHTML=checks.map(([a,b,m])=>`<article class="admin-row"><div><div class="item-title">${esc(a)}</div><div class="item-sub">${esc(b)}</div></div><span class="pill ${m==="live"?"ok":"warn"}">${m==="live"?"Ready":"Pending"}</span></article>`).join("");
  const low=state.inventory.filter(i=>Number(i.quantity)<=5).slice(0,5);
  $("lowStockFeed").innerHTML=low.length?low.map(i=>`<article class="admin-row"><div><div class="item-title">${esc(i.name)}</div><div class="item-sub">${esc(i.sku)} · ${esc(i.variant||"Default")}</div></div><span class="pill bad">${esc(i.quantity)} left</span></article>`).join(""):`<div class="item-sub">No low-stock items returned.</div>`;
}
function stockClass(q){q=Number(q||0);return q<=0?"stock-low":q<=5?"stock-watch":"stock-ok"}
function renderProducts(){
  const q=($("query")?.value||"").toLowerCase();
  const rows=state.products.filter(p=>!q||[p.name,p.sku,p.id].join(" ").toLowerCase().includes(q));
  $("productsTable").innerHTML=rows.map(p=>`
    <article class="admin-row">
      <div>
        <div class="item-title">${esc(p.name)}</div>
        <div class="item-sub"><span class="mono">${esc(p.id||"")}</span> · SKU ${esc(p.sku||"—")} · ${esc(money(p.price,p.currency))}</div>
      </div>
      <div class="row">
        <span class="pill ${p.stock==null?"info":Number(p.stock)<=0?"bad":Number(p.stock)<=5?"warn":"ok"}">${esc(p.stock??"—")} stock</span>
        <span class="pill ${p.visible!==false?"ok":"warn"}">${p.visible!==false?"Visible":"Hidden"}</span>
        <button class="btn" data-edit-product="${esc(p.id)}" type="button">Adjust</button>
      </div>
    </article>`).join("") || `<div class="empty">No products returned.</div>`;
  document.querySelectorAll("[data-edit-product]").forEach(btn=>btn.onclick=()=>editProduct(btn.dataset.editProduct));
}

function renderInventory(){
  const q=($("query")?.value||"").toLowerCase();
  const rows=state.inventory.filter(i=>!q||[i.name,i.sku,i.productId,i.variantId].join(" ").toLowerCase().includes(q));
  $("inventoryTable").innerHTML=rows.map(i=>`
    <article class="admin-row">
      <div>
        <div class="item-title">${esc(i.name)} · ${esc(i.variant||"Default")}</div>
        <div class="item-sub"><span class="mono">${esc(i.productId||"")}</span> · SKU ${esc(i.sku||"—")} · ${esc(i.variantId||"base")} · Location ${esc(i.locationId||"default")}</div>
      </div>
      <div class="row">
        <span class="pill ${Number(i.quantity||0)<=0?"bad":Number(i.quantity||0)<=5?"warn":"ok"}">${esc(i.quantity??"—")} qty</span>
        <span class="pill ${i.tracked!==false?"info":"warn"}">${i.tracked!==false?"Tracked":"Not tracked"}</span>
        <button class="btn" data-inv-product="${esc(i.productId)}" data-inventory-id="${esc(i.id)}" data-inv-variant="${esc(i.variantId||"")}" type="button">Adjust</button>
      </div>
    </article>`).join("") || `<div class="empty">No inventory records returned.</div>`;
  document.querySelectorAll("[data-inv-product]").forEach(btn=>btn.onclick=()=>{
    const item=state.inventory.find(i=>i.id===btn.dataset.inventoryId);
    if(!item)return;
    $("inventoryRecord").value=item.id;
    $("inventoryProductId").value=item.productId||"";
    $("inventoryVariantId").value=item.variantId||"";
    $("inventorySku").value=item.sku||"";
    $("inventoryQuantity").value=item.quantity??"";
    $("inventoryTracked").value=String(item.tracked!==false);
    activePanel("inventory");
  });
}

function orderLane(status,label){
  const rows=state.orders.filter(o=>String(o.fulfillmentStatus||"").toUpperCase()===status || (status==="UNFULFILLED" && !o.fulfillmentStatus));
  return rows.map(o=>`
    <article class="admin-row">
      <div>
        <div class="item-title">${esc(label)} · #${esc(o.number||o.id)}</div>
        <div class="item-sub">${esc(o.customer||"Customer")} · ${esc(o.items||0)} items · ${esc(money(o.total,o.currency))}</div>
      </div>
      <div class="row">
        <span class="pill info">${esc(label)}</span>
        <button class="btn" data-order-fill="${esc(o.id)}" type="button">Action</button>
      </div>
    </article>`).join("");
}

function renderOrders(){
  const filter=$("orderFilter")?.value||"ALL";
  const rows=state.orders.filter(o=>filter==="ALL"||filter==="all"||!filter||o.fulfillmentStatus===filter||o.paymentStatus===filter||o.status===filter);
  $("orderPipeline").innerHTML=rows.map(o=>`
    <article class="admin-row">
      <div>
        <div class="item-title">#${esc(o.number||o.id)} · ${esc(o.customer||"Customer")}</div>
        <div class="item-sub">${esc(o.items||0)} items · ${esc(money(o.total,o.currency))} · ${esc(o.paymentStatus||"—")} · ${esc(new Date(o.created||Date.now()).toLocaleString())}</div>
      </div>
      <div class="row">
        <span class="pill ${String(o.fulfillmentStatus||"UNFULFILLED").toUpperCase()==="FULFILLED"?"ok":String(o.fulfillmentStatus||"").toUpperCase()==="READY"?"info":"warn"}">${esc(o.fulfillmentStatus||"UNFULFILLED")}</span>
        <button class="btn" data-order-fill="${esc(o.id)}" type="button">Action</button>
      </div>
    </article>`).join("") || `<div class="empty">No orders returned.</div>`;
  document.querySelectorAll("[data-order-fill]").forEach(btn=>btn.onclick=()=>{
    $("fulfillmentOrderId").value=btn.dataset.orderFill;
    activePanel("orders");
  });
}

function renderCollections(){
  $("collectionsList").innerHTML=state.collections.map(c=>`
    <article class="admin-row">
      <div><div class="item-title">${esc(c.name)}</div><div class="item-sub code">${esc(c.id)} · /${esc(c.slug||"")}</div></div>
      <div class="row"><span class="pill ${c.visible!==false?"ok":"warn"}">${c.visible!==false?"Visible":"Hidden"}</span><span class="pill info">${esc(c.products||0)} products</span></div>
    </article>`).join("") || `<div class="item-sub">No collections returned.</div>`;
}
function renderCollectionOptions(){
  const select=$("productCollection");
  const value=select.value;
  select.innerHTML=`<option value="">No collection</option>`+state.collections.map(c=>`<option value="${esc(c.id)}">${esc(c.name)}</option>`).join("");
  if([...select.options].some(o=>o.value===value)) select.value=value;
  const collection=$("collectionId"),selected=collection.value;
  collection.innerHTML='<option value="">Select collection for assignment</option>'+state.collections.map(c=>`<option value="${esc(c.id)}">${esc(c.name)}</option>`).join("");collection.value=selected;
  const inv=$("inventoryRecord"),iv=inv.value;
  inv.innerHTML='<option value="">Select stock record</option>'+state.inventory.map(i=>`<option value="${esc(i.id)}">${esc(i.name)} · ${esc(i.variantId)} · ${esc(i.locationId||"default")}</option>`).join("");inv.value=iv;
}
function renderPromotions(){
  $("promotionsList").innerHTML=state.promotions.map(p=>`
    <article class="admin-row">
      <div><div class="item-title">${esc(p.name)}</div><div class="item-sub">${esc(p.code)} · ${esc(p.type)} ${esc(p.value||"")}</div></div>
      <span class="pill ${p.status==="Active"?"ok":"warn"}">${esc(p.status||"Draft")}</span>
    </article>`).join("") || `<div class="item-sub">No promotions returned.</div>`;
}
function renderAudit(){
  $("auditTable").innerHTML=state.audit.map(a=>`
    <article class="admin-row">
      <div>
        <div class="item-title">${esc(a.action)}</div>
        <div class="item-sub">${esc(a.detail)}</div>
      </div>
      <span class="pill ${a.mode==="warn"?"warn":a.mode==="error"?"bad":"info"}">${esc(new Date(a.time).toLocaleString())}</span>
    </article>
  `).join("") || `<div class="empty">No audit records.</div>`;
}

function editProduct(id){status("Loading full product and variants…");post("STORE_CONTROL_OPEN_PRODUCT",{productId:id})}
function fillProduct(p){
  detail=p;state.editingProductId=p.id;
  $("productModeBadge").textContent="Editing "+p.name;
  $("productName").value=p.name||"";$("productCurrency").value=p.currency||state.currency||"USD";
  $("productCollection").value=p.categoryIds?.[0]||"";$("productVisible").value=String(p.visible!==false);
  $("productDescription").value=p.plainDescription||"";
  $("productVariant").innerHTML=(p.variants||[]).map(v=>`<option value="${esc(v.id)}">${esc(v.label||v.sku||v.id)}</option>`).join("");
  fillVariant();activePanel("products");
}
function fillVariant(){const v=detail?.variants?.find(x=>x.id===$("productVariant").value);if(!v)return;$("productSku").value=v.sku||"";$("productPrice").value=v.actualPrice??"";$("productWeight").value=v.weight??"";$("productTrackInventory").value=String(v.inventory?.some(i=>i.trackQuantity));$("productTrackInventory").disabled=true;}
function clearProduct(){
  state.editingProductId="";detail=null;$("productVariant").innerHTML="";$("productTrackInventory").disabled=false;
  state.productUploads=[];
  state.mainUploadIndex=null;
  $("productModeBadge").textContent="New product";
  ["productName","productSku","productPrice","productCurrency","productCollection","productWeight","productDescription"].forEach(id=>$(id).value=id==="productCurrency"?"USD":"");
  $("productVisible").value="true";
  $("productTrackInventory").value="true";
  renderMediaPreview();
}
function renderMediaPreview(){const box=$("productMediaPreview");if(box)box.textContent="Manage product media in Media Control."}
function saveProduct(){
  const name=$("productName").value.trim(),price=$("productPrice").value;
  if(!name||price===""||!Number.isFinite(Number(price))||Number(price)<0){status("Name and a non-negative price are required.","error");return}
  const variant={id:$("productVariant").value,sku:$("productSku").value.trim(),actualPrice:Number(price),weight:Number($("productWeight").value||0)};
  const selected=$("productCollection").value;
  const product={name,description:$("productDescription").value.trim(),visible:bool($("productVisible").value),...variant,trackQuantity:bool($("productTrackInventory").value),quantity:0,inStock:true,categoryIds:selected?[selected]:[]};
  if(detail){
    // Preserve other memberships when changing the primary collection shown here.
    const ids=[...new Set([...(detail.categoryIds||[]).slice(1),...(selected?[selected]:[])])];
    post("STORE_CONTROL_SAVE_CORE",{productId:detail.id,patch:{name:product.name,description:product.description,visible:product.visible,revision:detail.revision,variant,categoryIds:ids}});
  }else post("STORE_CONTROL_CREATE_PRODUCT",{product});
}
function deleteProduct(){
  if(!state.editingProductId){status("Select a product first.","warn");return}
  post("STORE_CONTROL_SET_VISIBILITY",{productId:state.editingProductId,visible:false});
}
function updateInventory(){
  const record=state.inventory.find(i=>i.id===$("inventoryRecord").value);
  if(!record){status("Select a stock record and location first.","error");return}
  const q=$("inventoryQuantity").value;
  if(q===""||!Number.isInteger(Number(q))||Number(q)<0){status("Enter a non-negative whole-number quantity.","error");return}
  post("STORE_CONTROL_UPDATE_INVENTORY",{inventoryId:record.id,revision:record.revision,mode:$("inventoryMode").value,quantity:Number(q),tracked:bool($("inventoryTracked").value),reason:$("inventoryReason").value.trim()});
}
function sendFulfillment(){
  const payload={
    orderId:$("fulfillmentOrderId").value.trim(),
    action:$("fulfillmentStatus").value,
    carrier:$("carrier").value.trim(),
    trackingNumber:$("trackingNumber").value.trim(),
    note:$("orderNote").value.trim()
  };
  if(!payload.orderId){status("Order ID is required.","error");return}
  if(["CANCELED","FULFILLED"].includes(payload.action)){
    const verb=payload.action==="CANCELED"?"CANCEL":"FULFILL";
    const detail=verb==="CANCEL"?"Cancellation does not refund or restock the order.":"This fulfills all remaining items. Wix may send its configured shipping notification.";
    if(!window.confirm(detail+" Continue?"))return;
    payload.confirmation=verb+" "+payload.orderId;
  }
  post("STORE_CONTROL_UPDATE_ORDER",payload);
}
function saveCollection(assignOnly=false){
  const payload={
    name:$("collectionTitle").value.trim(),
    slug:$("collectionSlug").value.trim(),
    description:$("collectionDescription").value.trim(),
    productIds:arr($("collectionProductIds").value),
    assignOnly,categoryId:$("collectionId").value
  };
  if(!payload.name && !assignOnly){status("Collection name is required.","error");return}
  if(assignOnly && !payload.productIds.length){status("Add product IDs before assigning.","error");return}
  if(assignOnly&&!payload.categoryId){status("Select an existing collection.","error");return}
  post("STORE_CONTROL_SAVE_COLLECTION",payload);
}
function savePromo(){
  const payload={
    name:$("promoName").value.trim(),
    code:$("promoCode").value.trim(),
    type:$("promoType").value,
    value:Number($("promoValue").value||0),
    starts:$("promoStarts").value,
    ends:$("promoEnds").value,
    scope:$("promoScope").value.trim()
  };
  if(!payload.name || !payload.code){status("Promotion name and code are required.","error");return}
  post("STORE_CONTROL_SAVE_PROMOTION",payload);
}
function load(){post("STORE_CONTROL_READY",{})}
function refresh(){status("Refreshing Wix data…");post("STORE_CONTROL_REFRESH",{query:$("query").value})}
window.addEventListener("message",event=>{
  if(event.source!==window.parent)return;const m=event.data||{};if(m.source!==PARENT)return;const p=m.payload||{};
  if(m.type==="STORE_CONTROL_PARENT_READY"){load();return}
  if(m.type==="STORE_CONTROL_BOOTSTRAP"){
    backendResponded=true;
    const inventory=(p.inventory||[]).map(i=>({...i,tracked:i.trackQuantity,name:p.products?.find(x=>x.id===i.productId)?.name||i.productId}));
    render({...p,inventory,products:(p.products||[]).map(x=>({...x,price:x.minPrice,stock:!p.serviceErrors?.inventory && inventory.some(i=>i.productId===x.id&&i.tracked)?inventory.filter(i=>i.productId===x.id&&i.tracked).reduce((n,i)=>n+Number(i.quantity||0),0):null})),collections:(p.categories||[]).map(c=>({...c,products:c.itemCounter}))});
    const errors=Object.values(p.serviceErrors||{});status(errors.length?errors.join(" "):p.scope||"Wix data refreshed.",errors.length?"warn":"");return;
  }
  if(m.type==="STORE_CONTROL_PRODUCT"){fillProduct(p.product);status("Product loaded.");return}
  if(m.type==="STORE_CONTROL_PROGRESS"){busy(true);status(p.message||"Working…");return}
  if(m.type==="STORE_CONTROL_IDLE"){busy(false);return}
  if(m.type==="STORE_CONTROL_MUTATION_OK"){
    if(p.product)fillProduct(p.product);
    status(p.message||"Saved to Wix.","ok");audit(p.action||"SAVE",(p.message||"Wix confirmed the update.")+(lastMutation?.payload?.reason?" Session note: "+lastMutation.payload.reason:""),"ok");
    (p.results||[]).filter(x=>!x.ok).forEach(x=>audit("ASSIGNMENT_FAILED",x.productId,"error"));return;
  }
  if(m.type==="STORE_CONTROL_BULK_RESULT"){status(`${p.succeeded||0} updated; ${p.failed||0} failed.`,p.failed?"warn":"ok");(p.results||[]).forEach(x=>audit("BULK_PRICE",x.productId+": "+(x.ok?"Saved":x.message),x.ok?"ok":"error"));return}
  if(m.type==="STORE_CONTROL_ERROR"){busy(false);status(p.message||"The action failed. Refresh before retrying.","error");audit(p.stage||"ERROR",p.message||"Action failed.","error");}
});

if($("refreshBtn")) $("refreshBtn").onclick=load;
if($("syncStoreBtn")) $("syncStoreBtn").onclick=()=>refresh("SKANDI_STOREFRONT_FULL_SYNC");
if($("openStoreBtn")) $("openStoreBtn").onclick=()=>{post("STORE_CONTROL_NAVIGATE",{path:"/the-store"});};
$("refreshOrdersBtn").onclick=()=>refresh("SKANDI_STOREFRONT_ORDERS_REFRESH");
if($("refreshProductsBtn")) $("refreshProductsBtn").onclick=()=>refresh("SKANDI_STOREFRONT_PRODUCTS_REFRESH");
$("refreshInventoryBtn").onclick=()=>refresh("SKANDI_STOREFRONT_INVENTORY_REFRESH");
if($("refreshCollectionsBtn")) $("refreshCollectionsBtn").onclick=()=>refresh("SKANDI_STOREFRONT_COLLECTIONS_REFRESH");
$("openMediaControlBtn")?.addEventListener("click",()=>post("STORE_CONTROL_NAVIGATE",{path:"/riaintra/success-factors/media-control"}));
$("saveProductBtn").onclick=saveProduct;
$("clearProductBtn").onclick=clearProduct;
$("deleteProductBtn").onclick=deleteProduct;
$("updateInventoryBtn").onclick=updateInventory;
$("clearInventoryBtn").onclick=()=>["inventoryRecord","inventoryProductId","inventoryVariantId","inventorySku","inventoryQuantity","inventoryReason"].forEach(id=>$(id).value="");
$("sendFulfillmentBtn").onclick=sendFulfillment;
$("clearFulfillmentBtn").onclick=()=>["fulfillmentOrderId","carrier","trackingNumber","orderNote"].forEach(id=>$(id).value="");
$("saveCollectionBtn").onclick=()=>saveCollection(false);
$("assignCollectionBtn").onclick=()=>saveCollection(true);
$("clearCollectionBtn").onclick=()=>["collectionTitle","collectionSlug","collectionDescription","collectionProductIds"].forEach(id=>$(id).value="");
$("savePromoBtn").onclick=savePromo;
$("clearPromoBtn").onclick=()=>["promoName","promoCode","promoValue","promoStarts","promoEnds","promoScope"].forEach(id=>$(id).value="");
$("clearAuditBtn").onclick=()=>{state.audit=[];renderAudit();};
$("query").addEventListener("input",()=>{renderProducts();renderInventory();});
$("orderFilter").addEventListener("change",renderOrders);

$("productVariant").onchange=fillVariant;
$("inventoryRecord").onchange=()=>{const i=state.inventory.find(x=>x.id===$("inventoryRecord").value);if(!i)return;$("inventoryProductId").value=i.productId;$("inventoryVariantId").value=i.variantId;$("inventoryQuantity").value=i.quantity??"";$("inventoryTracked").value=String(i.tracked);};
$("bulkPriceBtn").onclick=()=>{const value=$("bulkPriceValue").value;if(value===""||!Number.isFinite(Number(value))){status("Enter a price adjustment.","error");return}post("STORE_CONTROL_BULK_PRICE",{productIds:arr($("bulkProductIds").value),operation:$("bulkPriceOperation").value,value:Number(value),compareAtMode:"KEEP"})};
seedData();render();load();

</script>
</body>
</html>
```
