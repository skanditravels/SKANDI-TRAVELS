# SKANDI INFO / LOG — Corporate Finance Control V12

- Source identity: `/HTML_REF/riaintra/Finance Control.md`.
- Wix controller: `/src/pages/Finance Control.gboi3.js`.
- HTML element: `#corporateFinanceEmbed`.
- Child source: `SKANDI_CORPORATE_FINANCE_CONTROL`; parent source: `SKANDI_WIX_PARENT`.
- Canonical backend: `/src/backend/SKANDI_CORE/financeControl.web.js` → `financeControl.js` → `supabaseServer.js`.
- Status: **STATICALLY VERIFIED — REQUIRES LIVE TEST**.
- The previous page controller mixed HR/Payroll legacy namespaces, `public/internalHtmlBridge`, and a missing/non-V12 `backend/corporateFinance` import. This replacement removes those dependencies.
- The web facade intentionally uses direct named `webMethod(...)` declarations only to avoid the class of Wix proxy failures that surface as `(0, s.someFunction) is not a function`.
- Read-only schema verification on 2026-10-14 confirmed the finance/commerce/operations sources used by this version: `finance_ledger_entries`, `invoices`, `invoice_payments`, `expenses`, `sales_receipts`, `storefront_orders`, `payment_events`, `altea_bookings`, `altea_booking_components`, `tour_activity_inventory`, `airport_transfers`, payroll tables, `employee_tax_profiles`, and finance document definitions.
- Existing data is adapted into the Finance Control UI view-model; no duplicate finance tables were created.
- Unsupported UI mutations whose canonical storage contract is not present in the verified schema are rejected with an explicit error instead of reporting false success.
- No assertion is made that every jurisdictional tax/legal rule is automatically encoded. Existing tax profiles, HR jurisdiction data, finance documents and persisted operational amounts remain source data; legal/tax completeness requires the applicable authoritative rule sources.
- No Supabase schema/data mutation was performed while preparing this package.

## CHANGE LOG
- 2026-10-14 — Replaced the legacy/mixed page bridge with the V12 chain, added direct web facade exports, added verified finance objects to the canonical Supabase transport allowlist, connected real booking/store/tour/transfer/payment/payroll sources, repaired initial bootstrap, repaired missing profile DOM references, and made save/error handling fail-closed rather than returning false success.

## COMPLETE INTENDED HTML

```html
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"/>
<meta name="theme-color" content="#022e64"/>
<title>SKANDI Corporate Finance Control</title>
<style>
:root{
  --sk-blue:#0a6ed1;--sk-blue2:#085caf;--sk-cyan:#5FC7CF;
  --sk-text:#1d2d3e;--sk-muted:#a7afbd;--sk-bg:#f3f4f6;--sk-bg2:#fff;--sk-bg3:#354a5f;
  --sk-panel:#fff;--sk-panel2:rgba(255, 255, 255, 0.8);--sk-line:#3f4146;--sk-line2:#555861;--sk-field:#202124;
  --sk-ok:#65c97a;--sk-warn:#d6a445;--sk-bad:#bb0000;--sk-selected:#29486d;--sk-hover:#33383f;
  --sk-font:Tahoma,"Segoe UI",system-ui,-apple-system,BlinkMacSystemFont,sans-serif;--sk-mono:Consolas,"Courier New",monospace;
  --chromeTopH:76px;--chromeMenuH:32px;--chromeH:calc(var(--chromeTopH) + var(--chromeMenuH));
}
*{box-sizing:border-box}
html,body{height:100%;margin:0;overflow:hidden;background:#0f1012;color:var(--sk-text);font-family:var(--sk-font)}
button,input,select,textarea{font:inherit}button{cursor:pointer;touch-action:manipulation}
button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible{outline:2px solid var(--sk-cyan);outline-offset:2px}
.hidden{display:none!important}
.app{height:calc(100dvh - var(--chromeH));display:grid;grid-template-columns:254px minmax(0,1fr);min-height:0;background:#fff;border-top:1px solid #070707}
.sidebar{min-height:0;background:var(--sk-bg3);border-right:1px solid #0d0d0e;border-top:1px solid #0d0d0e;color:var(--sk-panel2);padding:10px 10px 8px;overflow:auto}
.side-search{width:100%;height:28px;background:rgba(255, 255, 255, 0.8);border:1px solid #383a3e;border-radius:5px;color:#e8edf7;padding:4px 8px;font-size:12px;margin-bottom:10px}
.nav-title{font-size:10px;color:#fff;text-transform:uppercase;letter-spacing:.14em;margin:15px 8px 4px}
.nav-btn{width:100%;border:0;background:transparent;color:var(--sk-panel2);text-align:left;padding:7px 8px;border-radius:5px;display:flex;align-items:center;gap:7px;font-size:12px;min-height:31px}
.nav-btn:hover{background:var(--sk-panel2);color:var(--sk-text)}.nav-btn.active{background:var(--sk-blue);color:#e6f1ff}.nav-icon{width:17px;text-align:center;opacity:.9}.nav-label{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.workspace{min-height:0;display:flex;flex-direction:column;background:var(--sk-bg);overflow:hidden}
.topline{min-height:48px;border-bottom:0px solid #2a2b2d;background:#354a5f;display:flex;align-items:center;gap:12px;padding:8px 12px}
.brand{display:flex;align-items:center;gap:5px;font-size:20px;font-weight:800;color:#d7d8d9;letter-spacing:-.02em;white-space:nowrap}.sub{font-size:12px;color:#a9b0bd;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.actions{display:flex;gap:6px;align-items:center}.mobile-menu-btn{display:none}.drawer-backdrop{display:none}
.btn{border:1px solid #4a4d53;background:linear-gradient(#4775b8,#284f83);border-color:#5e84b9;color:#f4f6fa;border-radius:6px;padding:6px 11px;font-size:12px;min-height:29px}
.btn:hover{filter:brightness(1.08)}.btn.primary{background:linear-gradient(#4775b8,#284f83);border-color:#5e84b9}.btn.ok{background:linear-gradient(#357345,#285b35);border-color:#4b9360}.btn.warn{background:linear-gradient(#80602c,#60431f);border-color:#b58a3d}.btn.bad{background:linear-gradient(#833c3c,#5d2929);border-color:#a95858}
.input,select,textarea{background:var(--sk-panel2);border:1px solid #474a51;border-radius:5px;color:var(--sk-text);padding:6px 8px;min-height:30px;font-size:12px}textarea{resize:vertical;min-height:70px}.input[readonly],textarea[readonly],select:disabled{opacity:.85;background:#242529}
.toolbar{border-bottom:1px solid #2c2d30;background:#354a5f;padding:8px 12px;display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.toolbar .input{min-width:150px}.toolbar .search{min-width:240px;flex:1}
.badge{display:inline-flex;align-items:center;gap:5px;border:1px solid #4a4d53;border-radius:999px;background:#354a5f;color:#cad2df;padding:3px 8px;font-size:11px}.badge b{font-family:var(--sk-mono);color:#fff}
.status-line{display:none;margin:8px 12px 0;padding:7px 10px;border-radius:6px;font-size:12px}.status-line.ok{display:block;border:1px solid #355680;background:#17283d;color:#bbd9ff}.status-line.error{display:block;border:1px solid #703333;background:#2c1718;color:#ffb5b5}.status-line.warn{display:block;border:1px solid #6b5425;background:#2c2416;color:#e3bd6f}
.content{flex:1;min-height:0;overflow:hidden;position:relative}.view{display:none;height:100%;min-height:0;overflow:auto;padding:10px 12px;gap:10px}.view.active{display:flex;flex-direction:column}
.panel{border:1px solid #3f4248;border-radius:7px;background:#242526;min-height:0;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 12px 28px rgba(0,0,0,.16)}
.panel h3{margin:0;padding:10px 12px;border-bottom:1px solid #3f4248;font-size:13px;color:#f7f8fa;text-transform:uppercase;letter-spacing:.08em}.panel-body{padding:10px 12px;overflow:auto;min-height:0;flex:1}
.split{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(340px,.8fr);gap:10px;min-height:0;flex:1}.three{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.two{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.stack{display:flex;flex-direction:column;gap:10px;min-height:0}
.kpis{display:grid;grid-template-columns:repeat(6,minmax(120px,1fr));gap:8px}.kpi{border:1px solid #3d4046;background:linear-gradient(180deg,#242526,#1b1c1f);border-radius:8px;padding:9px}.kpi small{display:block;color:#aab2bf;font-size:10px;text-transform:uppercase;letter-spacing:.1em}.kpi b{font-size:22px;line-height:1.2}.kpi span{display:block;font-size:10px;color:#87909f;margin-top:2px}
.table-shell{min-height:0;overflow:auto;border:1px solid #3b3d42;border-radius:6px;background:#1a1b1d}.grid{width:100%;border-collapse:collapse;table-layout:fixed;font-size:12px;color:#ecf1f8}
.grid th{position:sticky;top:0;z-index:2;background:linear-gradient(#333438,#27282b);border-bottom:1px solid #4a4c52;border-right:1px solid #4a4c52;text-align:left;padding:7px 8px;font-size:11px;letter-spacing:.02em;color:#f0f1f3}
.grid td{border-bottom:1px solid #34363a;border-right:1px solid #34363a;padding:5px 8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;height:27px}.grid tr:nth-child(odd) td{background:#202123}.grid tr:nth-child(even) td{background:#171819}.grid tr:hover td{background:#2d3238}
.form-grid{display:grid;grid-template-columns:repeat(4,minmax(150px,1fr));gap:8px}.field{display:flex;flex-direction:column;gap:3px}.field.wide{grid-column:span 2}.field.full{grid-column:1/-1}.label{font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:#aab2bf}.field input,.field select,.field textarea{width:100%}
.pill{display:inline-flex;align-items:center;border:1px solid #4b5563;border-radius:999px;padding:2px 8px;font-size:10px;background:#111827;color:#e5e7eb;text-transform:uppercase}.pill.ok{border-color:#22c55e;color:#bbf7d0}.pill.warn{border-color:#f59e0b;color:#fde68a}.pill.bad{border-color:#ef4444;color:#fecaca}.pill.info{border-color:#60a5fa;color:#bfdbfe}
.notice{border:1px solid #3d4652;background:#1b2028;border-left:4px solid var(--sk-cyan);border-radius:7px;padding:9px;font-size:12px;line-height:1.45;color:#d9dee8}.muted{color:#aeb6c3;font-size:11px}.row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.right{margin-left:auto}.money-pos{color:#bbf7d0}.money-neg{color:#fecaca}
.viewer{height:520px;border:1px solid #3d4046;border-radius:8px;background:var(--sk-panel2);overflow:hidden;display:grid;grid-template-rows:auto minmax(0,1fr)}.viewer-head{min-height:34px;display:flex;gap:8px;align-items:center;padding:7px 9px;background:#202632;border-bottom:1px solid #3d4652}.viewer iframe{width:100%;height:100%;border:0;background:#fff}.viewer-empty{display:grid;place-items:center;color:#9ca3af;font-size:12px;text-align:center;padding:20px}
.toast{position:fixed;right:12px;bottom:12px;background:#020617;color:#fff;padding:10px 12px;border-radius:6px;font-size:12px;display:none;z-index:7000}
@media(max-width:1200px){.kpis{grid-template-columns:repeat(3,1fr)}.form-grid{grid-template-columns:repeat(2,1fr)}.split{grid-template-columns:1fr}}
@media(max-width:820px){
  :root{--chromeTopH:64px;--chromeMenuH:32px}
  html,body{overflow:auto}.sk-chrome-top{grid-template-columns:minmax(0,1fr) auto;gap:8px;padding:6px 8px}.sk-chrome-logo-left{height:32px}.sk-chrome-altea-wrap,.sk-chrome-user{display:none}.sk-chrome-title{font-size:11px}.sk-chrome-subtitle{display:none}.sk-chrome-clock{min-width:72px;height:44px;padding:5px 7px}.sk-menu-button{padding:0 10px;font-size:11px}.sk-help-menu{display:none}
  .app{height:calc(100dvh - var(--chromeH));min-height:0;grid-template-columns:1fr;overflow:hidden}.mobile-menu-btn{display:inline-flex;align-items:center;gap:6px;flex:0 0 auto}.drawer-backdrop{display:none;position:fixed;left:0;right:0;top:var(--chromeH);bottom:0;background:rgba(0,0,0,.58);z-index:9997}body.drawer-open{overflow:hidden}body.drawer-open .drawer-backdrop{display:block}
  .sidebar{position:fixed;top:var(--chromeH);left:0;bottom:0;width:min(86vw,322px);max-height:none;z-index:9998;transform:translateX(-105%);transition:transform .22s ease;box-shadow:18px 0 42px rgba(0,0,0,.55);border-right:1px solid #3f4146}body.drawer-open .sidebar{transform:translateX(0)}
  .workspace{min-height:calc(100dvh - var(--chromeH));height:calc(100dvh - var(--chromeH))}.content{overflow:visible}.view.active{overflow:auto}.kpis{grid-template-columns:repeat(2,1fr)}.form-grid,.two,.three{grid-template-columns:1fr}.field.wide{grid-column:auto}.viewer{height:400px}
}
@media print{.use-global-chrome,.sidebar,.toolbar,.topline .actions,.toast,.drawer-backdrop{display:none!important}.app{display:block;height:auto}.workspace,.content,.view.active{display:block;height:auto;overflow:visible}.btn{display:none!important}.panel{break-inside:avoid}}

/* Header removed for embedded/no-header layout.
   The DOM is kept in place for existing scripts/backend hooks, but the visible chrome is hidden. */
.use-global-chrome{
  display:none!important;
  background:var(--sk-panel2);
  height:0!important;
  min-height:0!important;
  max-height:0!important;
  overflow:hidden!important;
}
.app{
  height:100dvh!important;
  border-top:0!important;
}
@media(max-width:820px){
  .app{
    height:100dvh!important;
  }
  .drawer-backdrop{
    top:0!important;
  }
  .sidebar{
    top:0!important;
  }
  .workspace{
    min-height:100dvh!important;
    height:100dvh!important;
  }
}

</style>
</head>
<body>
<div class="use-global-chrome">
  <div id="skInternalChrome" class="sk-chrome" data-page-name="CORPORATE FINANCE">
    <nav class="sk-menu-bar" aria-label="Internal classic menu">
      <div class="sk-menu"><button class="sk-menu-button" type="button">FILE</button><div class="sk-menu-dropdown">
        <button class="sk-menu-item" type="button" data-action="print"><span>Print</span><span class="sk-menu-shortcut">⌘P</span></button>
        <div class="sk-menu-sep"></div><button class="sk-menu-item" type="button" data-action="logout"><span>Logout</span><span class="sk-menu-shortcut">HOME</span></button>
      </div></div>
      <div class="sk-menu"><button class="sk-menu-button" type="button">FINANCE</button><div class="sk-menu-dropdown">
        <button class="sk-menu-item" data-view="home">Finance Home</button><button class="sk-menu-item" data-view="pnl">Corporate P&L</button><button class="sk-menu-item" data-view="journal">Universal Journal</button><button class="sk-menu-item" data-view="costcenters">Cost Centers</button>
      </div></div>
      <div class="sk-menu"><button class="sk-menu-button" type="button">OPERATIONS</button><div class="sk-menu-dropdown">
        <button class="sk-menu-item" data-view="expenses">Expense Reports</button><button class="sk-menu-item" data-view="purchases">Purchase Tracker</button><button class="sk-menu-item" data-view="invoices">Invoice Studio</button><button class="sk-menu-item" data-view="payments">Bank / Payments</button>
      </div></div>
      <div class="sk-menu"><button class="sk-menu-button" type="button">CONTROL</button><div class="sk-menu-dropdown">
        <button class="sk-menu-item" data-view="payrollsettings">Payroll Finance Settings</button><button class="sk-menu-item" data-view="taxcurrency">Tax / Currency</button><button class="sk-menu-item" data-view="approvals">Approvals</button><button class="sk-menu-item" data-view="audit">Audit</button>
      </div></div>
      <div class="sk-menu sk-help-menu"><button class="sk-menu-button" type="button">HELP</button><div class="sk-menu-dropdown" style="left:auto;right:0">
        <div class="sk-search-wrap"><input id="skChromeSearchInput" class="sk-search-input" placeholder="Search finance…" /><div id="skChromeSearchResults" class="sk-search-results"></div></div>
      </div></div>
    </nav>
  </div>
</div>

<div class="app">
  <aside class="sidebar" id="sidebar" aria-label="Corporate Finance navigation">
    <input id="sideSearch" class="side-search" placeholder="Search finance module"/>
    <div class="nav-title">Corporate Control</div>
    <button class="nav-btn active" data-view="home"><span class="nav-icon">▣</span><span class="nav-label">Finance Home</span></button>
    <button class="nav-btn" data-view="pnl"><span class="nav-icon">▤</span><span class="nav-label">Corporate P&L</span></button>
    <button class="nav-btn" data-view="journal"><span class="nav-icon">▦</span><span class="nav-label">Universal Journal</span></button>
    <div class="nav-title">Finance Operations</div>
    <button class="nav-btn" data-view="expenses"><span class="nav-icon">▣</span><span class="nav-label">Expense Reports</span></button>
    <button class="nav-btn" data-view="purchases"><span class="nav-icon">▣</span><span class="nav-label">Purchase Tracker</span></button>
    <button class="nav-btn" data-view="invoices"><span class="nav-icon">▣</span><span class="nav-label">Invoice Studio</span></button>
    <button class="nav-btn" data-view="payments"><span class="nav-icon">▣</span><span class="nav-label">Bank / Payments</span></button>
    <div class="nav-title">Corporate Settings</div>
    <button class="nav-btn" data-view="costcenters"><span class="nav-icon">▣</span><span class="nav-label">Cost Centers</span></button>
    <button class="nav-btn" data-view="payrollsettings"><span class="nav-icon">▣</span><span class="nav-label">Payroll Finance Settings</span></button>
    <button class="nav-btn" data-view="taxcurrency"><span class="nav-icon">▣</span><span class="nav-label">Tax / Currency / Benefits</span></button>
    <button class="nav-btn" data-view="approvals"><span class="nav-icon">▣</span><span class="nav-label">Approvals / Policies</span></button>
    <div class="nav-title">Oversight</div>
    <button class="nav-btn" data-view="integrations"><span class="nav-icon">▣</span><span class="nav-label">Data Intake</span></button>
    <button class="nav-btn" data-view="audit"><span class="nav-icon">▣</span><span class="nav-label">Audit</span></button>
  </aside>

  <main class="workspace">
    <div class="topline">
      <button class="btn mobile-menu-btn" id="mobileMenuBtn" type="button" aria-controls="sidebar" aria-expanded="false">☰ Menu</button>
      <div class="brand">
  <img src="https://static.wixstatic.com/media/394052_cd31153a91694b14a27c5f756f8089bd~mv2.png" alt="SKANDI" style="height: 20px;">
  Corporate Finance Control
</div>
      <div class="sub" id="pageContext">Corporate finance settings, P&L, invoices, expenses, payroll financial rules</div>
      <div class="actions">
        <button class="btn" data-action="print">Print</button>
        <button class="btn primary" data-action="refresh">Refresh Data</button>
      </div>
    </div>
    <div class="toolbar">
      <span class="badge">Journal <b id="journalCount">0</b></span>
      <span class="badge">Open approvals <b id="approvalCount">0</b></span>
      <select id="companyFilter" class="input"><option value="all">All companies</option></select>
      <select id="periodFilter" class="input"><option value="all">All periods</option></select>
      <input id="globalSearch" class="input search" placeholder="Search invoices, expenses, purchase orders, suppliers, cost centers, receipts…" />
      <button class="btn ok" data-action="save-current">Save Current</button>
    </div>
    <div class="status-line" id="statusBox"></div>
    <div class="content">
      <section class="view active" id="view-home"></section>
      <section class="view" id="view-pnl"></section>
      <section class="view" id="view-journal"></section>
      <section class="view" id="view-expenses"></section>
      <section class="view" id="view-purchases"></section>
      <section class="view" id="view-invoices"></section>
      <section class="view" id="view-payments"></section>
      <section class="view" id="view-costcenters"></section>
      <section class="view" id="view-payrollsettings"></section>
      <section class="view" id="view-taxcurrency"></section>
      <section class="view" id="view-approvals"></section>
      <section class="view" id="view-integrations"></section>
      <section class="view" id="view-audit"></section>
    </div>
  </main>
</div>
<div class="drawer-backdrop" id="drawerBackdrop" aria-hidden="true"></div>
<div class="toast" id="toast"></div>

<script>
(function(){
"use strict";
const SOURCE="SKANDI_CORPORATE_FINANCE_CONTROL",PARENT="SKANDI_WIX_PARENT";
const $=id=>document.getElementById(id);
const esc=v=>String(v??"").replace(/[&<>"']/g,s=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[s]));
const nowIso=()=>new Date().toISOString();
const uid=p=>(p||"FIN")+"-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,8).toUpperCase();
const money=(v,c="")=>`${c?esc(c)+" ":""}${Number(v||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const state={view:"home",connected:false,busy:false,lastRefresh:null,pdfUrl:"",data:{
  FinanceUniversalJournal:[],FinanceDocumentHeader:[],FinanceCompanyCode:[],FinanceCurrency:[],FinanceFxRate:[],FinanceGLAccount:[],FinanceCostCenter:[],FinanceProfitCenter:[],FinanceCostCenterBudget:[],
  FinanceExpenseReports:[],FinanceExpenseReportLines:[],FinanceReceipts:[],FinancePurchaseRequests:[],FinancePurchaseOrders:[],FinancePurchaseOrderLines:[],FinancePurchaseReceipts:[],
  FinanceSupplierInvoice:[],FinanceSupplierInvoiceLine:[],FinanceCustomerInvoice:[],FinanceCustomerInvoiceLine:[],FinanceInvoicePdfFiles:[],FinanceInvoiceTemplates:[],
  FinanceBankAccount:[],FinanceBankStatementLine:[],FinanceCommerceOrderMirror:[],FinanceCommercePaymentMirror:[],
  FinancePayrollTaxProfiles:[],FinancePayrollBenefitPlans:[],FinancePayrollDeductionRules:[],FinancePayrollGlMappings:[],FinanceApprovalPolicies:[],FinanceCorporateSettings:[],
  FinanceWorkflowCase:[],FinanceAuditEvent:[],IntegrationInboundEvent:[]
}};
const views={
  home:"Corporate finance command center",
  pnl:"Full profit and loss with drilldown",
  journal:"Universal Journal source of truth",
  expenses:"Expense reports and receipt control",
  purchases:"Purchase requests, POs, receipts and supplier tracking",
  invoices:"Invoice creation, PDF viewer and payment status",
  payments:"Bank accounts, payments and statement matching",
  costcenters:"Cost centers, budgets, profit centers and spend controls",
  payrollsettings:"Payroll financial rules, taxes, benefits, deductions and GL mappings",
  taxcurrency:"Currencies, FX rates, tax profiles and benefit finance settings",
  approvals:"Approval policies and exception inbox",
  integrations:"Commerce, booking, bank, payroll and operational data intake",
  audit:"Audit trail and immutable finance evidence"
};
function post(type,payload={}){window.parent.postMessage({source:SOURCE,type,payload,timestamp:nowIso()},"*")}
function status(msg,mode="ok"){const e=$("statusBox");e.textContent=msg||"";e.className="status-line "+mode;e.style.display=msg?"block":"none";if(msg&&mode!=="error")setTimeout(()=>{e.style.display="none"},4200)}
function toast(msg){const e=$("toast");e.textContent=msg;e.style.display="block";setTimeout(()=>e.style.display="none",2600)}
function col(name){return state.data[name]||[]}
function sum(arr,fn){return arr.reduce((a,x)=>a+Number(fn(x)||0),0)}
function byId(collection,id){return col(collection).find(x=>(x._id||x.id||x[Object.keys(x)[0]])===id)||{}}
function val(id){return ($(id)?.value||"").trim()}
function num(id){return Number(val(id)||0)}
function setValue(id,value){if($(id))$(id).value=value??""}
function opts(collection,key,label,fallback=[]){let arr=[...new Set(col(collection).map(x=>x[key]).filter(Boolean).concat(fallback))];return arr.map(x=>`<option value="${esc(x)}">${esc(label?((col(collection).find(r=>r[key]===x)||{})[label]||x):x)}</option>`).join("")}
function pill(v){let u=String(v||"").toUpperCase(),c=u.includes("APPROVED")||u.includes("POSTED")||u.includes("PAID")||u.includes("ACTIVE")||u.includes("CLEARED")?"ok":u.includes("REJECT")||u.includes("BLOCK")||u.includes("ERROR")||u.includes("OVERDUE")?"bad":u.includes("PEND")||u.includes("DRAFT")||u.includes("OPEN")||u.includes("REVIEW")?"warn":"info";return `<span class="pill ${c}">${esc(v||"—")}</span>`}
function table(items, cols, empty="No records.", rowAction=""){
  const head=cols.map(c=>`<th style="width:${c.w||"auto"}">${esc(c.h)}</th>`).join("");
  const body=items.length?items.map((x,i)=>`<tr ${rowAction?`data-row-action="${esc(rowAction)}" data-row-index="${i}"`:""}>${cols.map(c=>`<td>${c.f?c.f(x,i):esc(x[c.k])}</td>`).join("")}</tr>`).join(""):`<tr><td colspan="${cols.length}"><div class="notice">${esc(empty)}</div></td></tr>`;
  return `<div class="table-shell"><table class="grid"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
}
function filtered(items, fields){const q=$("globalSearch").value.toLowerCase(), co=$("companyFilter").value;return items.filter(x=>(co==="all"||!x.companyCode||x.companyCode===co)&&(!q||fields.map(f=>String(x[f]||"")).join(" ").toLowerCase().includes(q)))}
function save(collection,item,label){state.busy=true;status(`Saving ${label||collection}...`,"ok");post("FINANCE_SAVE_RECORD",{collection,item})}
function saveComplex(action,payload,label){state.busy=true;status(`Saving ${label||"record"}...`,"ok");post(action,payload)}
function refresh(){status("Refreshing finance data...","ok");post("CORPORATE_FINANCE_REFRESH",{})}
function renderTop(){
  $("pageContext").textContent=views[state.view]||"Corporate Finance";
  $("journalCount").textContent=col("FinanceUniversalJournal").length;
  $("approvalCount").textContent=col("FinanceWorkflowCase").filter(x=>String(x.status||"").toLowerCase().includes("pending")||String(x.status||"").toLowerCase().includes("open")).length;
  const cos=["all",...new Set(col("FinanceCompanyCode").map(x=>x.companyCode).filter(Boolean))];
  const currentCo=$("companyFilter").value||"all";
  $("companyFilter").innerHTML=cos.map(x=>`<option value="${esc(x)}">${esc(x==="all"?"All companies":x)}</option>`).join("");
  $("companyFilter").value=cos.includes(currentCo)?currentCo:"all";
  const periods=["all",...new Set(col("FinanceUniversalJournal").map(x=>`${x.fiscalYear||""}-${String(x.fiscalPeriod||"").padStart(2,"0")}`).filter(x=>x!=="-"))];
  const curP=$("periodFilter").value||"all";
  $("periodFilter").innerHTML=periods.map(x=>`<option value="${esc(x)}">${esc(x==="all"?"All periods":x)}</option>`).join("");
  $("periodFilter").value=periods.includes(curP)?curP:"all";
  document.querySelectorAll("[data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===state.view));
  Object.keys(views).forEach(v=>$("view-"+v)?.classList.toggle("active",v===state.view));
}
function ledgerFiltered(){
  let a=filtered(col("FinanceUniversalJournal"),["journalDocumentId","glAccountId","sourceDocumentId","sourceModule","companyCode","ledgerId"]);
  let p=$("periodFilter").value;
  if(p&&p!=="all")a=a.filter(x=>`${x.fiscalYear||""}-${String(x.fiscalPeriod||"").padStart(2,"0")}`===p);
  return a;
}
function pnlStats(){
  const lines=ledgerFiltered();
  const revenue=sum(lines.filter(x=>String(x.accountType||"").toLowerCase()==="revenue" || String(x.glAccountId||"").startsWith("4")),x=>Math.abs(Number(x.amountGroup||x.amountCompanyCode||x.amountTransaction||0)));
  const expense=sum(lines.filter(x=>String(x.accountType||"").toLowerCase()==="expense" || String(x.glAccountId||"").startsWith("5") || String(x.glAccountId||"").startsWith("6")),x=>Math.abs(Number(x.amountGroup||x.amountCompanyCode||x.amountTransaction||0)));
  const tax=sum(lines.filter(x=>String(x.glAccountId||"").toLowerCase().includes("tax")||String(x.taxCode||"")),x=>Math.abs(Number(x.amountGroup||x.amountCompanyCode||x.amountTransaction||0)));
  const payroll=sum(lines.filter(x=>String(x.sourceModule||"").toLowerCase().includes("payroll")||String(x.glAccountId||"").toLowerCase().includes("wage")),x=>Math.abs(Number(x.amountGroup||x.amountCompanyCode||x.amountTransaction||0)));
  return {revenue,expense,tax,payroll,net:revenue-expense};
}
function homeView(){
  const s=pnlStats(), openInvoices=col("FinanceSupplierInvoice").filter(x=>!["POSTED","PAID","REVERSED"].includes(String(x.paymentStatus||x.postingStatus||"").toUpperCase())).length+col("FinanceCustomerInvoice").filter(x=>!["PAID","CLEARED"].includes(String(x.paymentStatus||"").toUpperCase())).length;
  const pendingExpenses=col("FinanceExpenseReports").filter(x=>String(x.status||"").toUpperCase().includes("PENDING")||String(x.status||"").toUpperCase().includes("DRAFT")).length;
  const purchases=col("FinancePurchaseRequests").filter(x=>!["CLOSED","REJECTED"].includes(String(x.status||"").toUpperCase())).length;
  return `<div class="kpis">
    <div class="kpi"><small>Revenue</small><b>${money(s.revenue)}</b><span>Current filter</span></div>
    <div class="kpi"><small>Expenses</small><b>${money(s.expense)}</b><span>Booked costs</span></div>
    <div class="kpi"><small>Net profit</small><b class="${s.net>=0?"money-pos":"money-neg"}">${money(s.net)}</b><span>P&L result</span></div>
    <div class="kpi"><small>Open invoices</small><b>${openInvoices}</b><span>AP + AR</span></div>
    <div class="kpi"><small>Expense reports</small><b>${pendingExpenses}</b><span>Pending/draft</span></div>
    <div class="kpi"><small>Purchases</small><b>${purchases}</b><span>Open requests</span></div>
  </div>
  <div class="split">
    <div class="stack">
      <div class="panel"><h3>Corporate finance command center</h3><div class="panel-body">
        <div class="notice">This is the central finance office for SKANDI corporate controllers. Use it to manage P&L, expense reports, purchases, invoices, receipts, payment tracking, cost centers, taxes, currencies, benefits, payroll financial rules, and approval controls.</div>
        <div style="margin-top:10px">${table(ledgerFiltered().slice(0,12),[
          {h:"Date",w:".8fr",f:x=>esc(String(x.postingDate||x.createdAt||"").slice(0,10))},{h:"Company",w:".7fr",f:x=>esc(x.companyCode)},{h:"Account",w:".8fr",f:x=>esc(x.glAccountId)},{h:"Source",w:"1fr",f:x=>esc(x.sourceModule||x.sourceDocumentType)},{h:"Amount",w:".9fr",f:x=>money(x.amountGroup||x.amountCompanyCode||x.amountTransaction,x.groupCurrency||x.companyCodeCurrency||x.transactionCurrency)}
        ],"No Universal Journal lines received yet.")}</div>
      </div></div>
      <div class="panel"><h3>Controller exception inbox</h3><div class="panel-body">${table(col("FinanceWorkflowCase").slice(0,8),[
        {h:"Case",w:".8fr",f:x=>esc(x.workflowCaseId||x.caseNumber||x._id)},{h:"Type",w:".7fr",f:x=>esc(x.caseType)},{h:"Document",w:"1fr",f:x=>esc(x.sourceDocumentId)},{h:"Owner",w:".8fr",f:x=>esc(x.assignedTo)},{h:"Status",w:".7fr",f:x=>pill(x.status)}
      ],"No approval cases received.")}</div></div>
    </div>
    <div class="stack">
      <div class="panel"><h3>Quick actions</h3><div class="panel-body"><div class="row">
        <button class="btn primary" data-view="invoices">Create invoice</button><button class="btn primary" data-view="expenses">New expense report</button><button class="btn primary" data-view="purchases">New purchase</button><button class="btn" data-view="payrollsettings">Payroll settings</button><button class="btn" data-view="costcenters">Cost center budgets</button>
      </div></div></div>
      <div class="panel"><h3>Recent receipts / PDFs</h3><div class="panel-body">${table(col("FinanceReceipts").concat(col("FinanceInvoicePdfFiles")).slice(0,8),[
        {h:"Title",w:"1fr",f:x=>esc(x.title||x.fileName||x.receiptNumber||x.invoiceNumber)},{h:"Amount",w:".7fr",f:x=>money(x.amount||x.grossAmount,x.currency)},{h:"Source",w:".7fr",f:x=>esc(x.sourceType||x.documentType||"Document")},{h:"Status",w:".7fr",f:x=>pill(x.status||x.approvalStatus)}
      ],"No receipts or PDF files received.")}</div></div>
    </div>
  </div>`;
}
function pnlView(){
  const s=pnlStats(), lines=ledgerFiltered();
  const byAccount={}; lines.forEach(x=>{let k=x.glAccountId||"Unassigned";byAccount[k]=(byAccount[k]||0)+Number(x.amountGroup||x.amountCompanyCode||x.amountTransaction||0)});
  const rows=Object.entries(byAccount).map(([account,amount])=>({account,amount,type:String(account).startsWith("4")?"Revenue":String(account).startsWith("5")||String(account).startsWith("6")?"Expense":"Other"})).sort((a,b)=>a.account.localeCompare(b.account));
  return `<div class="kpis"><div class="kpi"><small>Total revenue</small><b>${money(s.revenue)}</b></div><div class="kpi"><small>Total expenses</small><b>${money(s.expense)}</b></div><div class="kpi"><small>Net profit</small><b class="${s.net>=0?"money-pos":"money-neg"}">${money(s.net)}</b></div><div class="kpi"><small>Payroll cost</small><b>${money(s.payroll)}</b></div><div class="kpi"><small>Tax movement</small><b>${money(s.tax)}</b></div><div class="kpi"><small>Journal lines</small><b>${lines.length}</b></div></div>
  <div class="split"><div class="panel"><h3>Full Profit & Loss</h3><div class="panel-body">${table(rows,[
    {h:"Account",w:"1fr",f:x=>esc(x.account)},{h:"Type",w:".7fr",f:x=>esc(x.type)},{h:"Amount",w:".8fr",f:x=>`<span class="${x.amount<0?"money-neg":"money-pos"}">${money(Math.abs(x.amount))}</span>`}
  ],"No P&L account movements available.")}</div></div>
  <div class="panel"><h3>Filters and reporting</h3><div class="panel-body"><div class="notice">The P&L is calculated from Universal Journal lines only. Filter by company or period from the toolbar. Drill-down is by account and source document.</div><div class="row" style="margin-top:10px"><button class="btn" data-action="export-report">Export report</button><button class="btn" data-action="refresh">Refresh data</button></div></div></div></div>`;
}
function journalView(){
  return `<div class="panel"><h3>Universal Journal</h3><div class="panel-body">${table(ledgerFiltered(),[
    {h:"Doc",w:".8fr",f:x=>esc(x.journalDocumentId)},{h:"Line",w:".35fr",f:x=>esc(x.lineNo)},{h:"Company",w:".55fr",f:x=>esc(x.companyCode)},{h:"Ledger",w:".55fr",f:x=>esc(x.ledgerId)},{h:"Account",w:".7fr",f:x=>esc(x.glAccountId)},{h:"Source",w:".75fr",f:x=>esc(x.sourceModule)},{h:"Text",w:"1fr",f:x=>esc(x.lineText||x.sourceDocumentId)},{h:"Amount",w:".8fr",f:x=>money(x.amountGroup||x.amountCompanyCode||x.amountTransaction,x.groupCurrency||x.companyCodeCurrency||x.transactionCurrency)},{h:"Status",w:".6fr",f:x=>pill(x.postingStatus)}
  ],"No journal lines received from finance data.")}</div></div>`;
}
function expensesView(){
  const co=opts("FinanceCompanyCode","companyCode","companyName",["SK01"]), cur=opts("FinanceCurrency","currencyCode","currencyName",["USD","EUR","SEK"]);
  const cc=opts("FinanceCostCenter","costCenterId","costCenterName",["CORP-FIN"]);
  return `<div class="split"><div class="stack"><div class="panel"><h3>New expense report</h3><div class="panel-body"><div class="form-grid">
    <div class="field"><label class="label">Company</label><select id="erCompany">${co}</select></div>
    <div class="field"><label class="label">Employee SK-ID</label><input id="erEmployee" class="input" placeholder="SK-0001"></div>
    <div class="field"><label class="label">Report date</label><input id="erDate" class="input" type="date"></div>
    <div class="field"><label class="label">Currency</label><select id="erCurrency">${cur}</select></div>
    <div class="field"><label class="label">Category</label><select id="erCategory"><option>Travel</option><option>Meals</option><option>Hotel</option><option>Transport</option><option>Uniform</option><option>Office</option><option>Training</option><option>Other</option></select></div>
    <div class="field"><label class="label">Cost center</label><select id="erCostCenter">${cc}</select></div>
    <div class="field"><label class="label">Gross amount</label><input id="erGross" class="input" type="number" step="0.01"></div>
    <div class="field"><label class="label">Tax amount</label><input id="erTax" class="input" type="number" step="0.01"></div>
    <div class="field wide"><label class="label">Receipt/PDF URL</label><input id="erReceiptUrl" class="input" placeholder="https://..."></div>
    <div class="field wide"><label class="label">Business purpose</label><input id="erPurpose" class="input" placeholder="Client meeting, destination inspection, airport transfer, etc."></div>
    <div class="field full"><label class="label">Notes</label><textarea id="erNotes"></textarea></div>
  </div><div class="row" style="margin-top:10px"><button class="btn primary" data-action="save-expense-report">Save expense report</button><button class="btn ok" data-action="submit-expense-report">Submit for approval</button><button class="btn" data-action="view-expense-receipt">View receipt</button></div></div></div>
  <div class="panel"><h3>Expense reports</h3><div class="panel-body">${table(filtered(col("FinanceExpenseReports"),["reportNumber","employeeId","status","purpose","companyCode"]),[
    {h:"Report",w:".8fr",f:x=>esc(x.reportNumber||x.expenseReportId||x._id)},{h:"Employee",w:".7fr",f:x=>esc(x.employeeId)},{h:"Date",w:".55fr",f:x=>esc(String(x.reportDate||"").slice(0,10))},{h:"Amount",w:".7fr",f:x=>money(x.grossAmount,x.currency)},{h:"Cost center",w:".7fr",f:x=>esc(x.costCenterId)},{h:"Status",w:".7fr",f:x=>pill(x.status)}
  ],"No expense reports received.","expense")}</div></div></div>
  <div class="panel"><h3>Receipt / evidence viewer</h3><div class="panel-body">${viewerHtml()}</div></div></div>`;
}
function purchasesView(){
  const co=opts("FinanceCompanyCode","companyCode","companyName",["SK01"]), cur=opts("FinanceCurrency","currencyCode","currencyName",["USD","EUR","SEK"]), cc=opts("FinanceCostCenter","costCenterId","costCenterName",["CORP-FIN"]);
  return `<div class="split"><div class="stack"><div class="panel"><h3>Purchase tracker</h3><div class="panel-body"><div class="form-grid">
    <div class="field"><label class="label">Company</label><select id="prCompany">${co}</select></div><div class="field"><label class="label">Supplier ID</label><input id="prSupplier" class="input" placeholder="SUP-0001"></div>
    <div class="field"><label class="label">Request date</label><input id="prDate" class="input" type="date"></div><div class="field"><label class="label">Currency</label><select id="prCurrency">${cur}</select></div>
    <div class="field"><label class="label">Category</label><select id="prCategory"><option>Hotel contract</option><option>Transport</option><option>Marketing</option><option>IT</option><option>Uniform</option><option>Office</option><option>Maintenance</option><option>Other</option></select></div>
    <div class="field"><label class="label">Cost center</label><select id="prCostCenter">${cc}</select></div><div class="field"><label class="label">Amount</label><input id="prAmount" class="input" type="number" step="0.01"></div><div class="field"><label class="label">Need by</label><input id="prNeedBy" class="input" type="date"></div>
    <div class="field wide"><label class="label">Title</label><input id="prTitle" class="input" placeholder="Purchase title"></div><div class="field wide"><label class="label">PO / receipt PDF URL</label><input id="prReceiptUrl" class="input" placeholder="https://..."></div>
    <div class="field full"><label class="label">Description</label><textarea id="prDescription"></textarea></div>
  </div><div class="row" style="margin-top:10px"><button class="btn primary" data-action="save-purchase-request">Save purchase request</button><button class="btn ok" data-action="create-purchase-order">Create PO</button><button class="btn" data-action="view-purchase-receipt">View receipt</button></div></div></div>
  <div class="panel"><h3>Open purchases</h3><div class="panel-body">${table(filtered(col("FinancePurchaseRequests"),["requestNumber","title","supplierId","category","status","companyCode"]),[
    {h:"Request",w:".8fr",f:x=>esc(x.requestNumber||x.purchaseRequestId||x._id)},{h:"Title",w:"1fr",f:x=>esc(x.title)},{h:"Supplier",w:".7fr",f:x=>esc(x.supplierId)},{h:"Amount",w:".7fr",f:x=>money(x.amount,x.currency)},{h:"Status",w:".7fr",f:x=>pill(x.status)}
  ],"No purchase requests received.","purchase")}</div></div></div>
  <div class="panel"><h3>Purchase receipt / PO viewer</h3><div class="panel-body">${viewerHtml()}</div></div></div>`;
}
function invoicesView(){
  const co=opts("FinanceCompanyCode","companyCode","companyName",["SK01"]), cur=opts("FinanceCurrency","currencyCode","currencyName",["USD","EUR","SEK"]), cc=opts("FinanceCostCenter","costCenterId","costCenterName",["CORP-FIN"]);
  return `<div class="split"><div class="stack"><div class="panel"><h3>Invoice Studio</h3><div class="panel-body"><div class="form-grid">
    <div class="field"><label class="label">Invoice type</label><select id="invType"><option value="CUSTOMER">Customer invoice</option><option value="SUPPLIER">Supplier invoice</option></select></div>
    <div class="field"><label class="label">Company</label><select id="invCompany">${co}</select></div><div class="field"><label class="label">Partner ID</label><input id="invPartner" class="input" placeholder="Customer or supplier ID"></div>
    <div class="field"><label class="label">Invoice date</label><input id="invDate" class="input" type="date"></div><div class="field"><label class="label">Due date</label><input id="invDue" class="input" type="date"></div><div class="field"><label class="label">Currency</label><select id="invCurrency">${cur}</select></div>
    <div class="field"><label class="label">Line description</label><input id="invLineText" class="input" placeholder="Service or product"></div><div class="field"><label class="label">Cost center</label><select id="invCostCenter">${cc}</select></div>
    <div class="field"><label class="label">Net amount</label><input id="invNet" class="input" type="number" step="0.01"></div><div class="field"><label class="label">Tax amount</label><input id="invTax" class="input" type="number" step="0.01"></div>
    <div class="field wide"><label class="label">PDF URL</label><input id="invPdfUrl" class="input" placeholder="https://..."></div><div class="field wide"><label class="label">Reference</label><input id="invRef" class="input" placeholder="Booking, order, PO, contract or project reference"></div>
    <div class="field full"><label class="label">Invoice note</label><textarea id="invNote"></textarea></div>
  </div><div class="row" style="margin-top:10px"><button class="btn primary" data-action="save-invoice">Save invoice</button><button class="btn ok" data-action="post-invoice">Save + post invoice</button><button class="btn" data-action="view-invoice-pdf">View PDF</button><button class="btn" data-action="print-pdf">Print PDF</button></div></div></div>
  <div class="panel"><h3>Invoices</h3><div class="panel-body">${table(filtered(col("FinanceCustomerInvoice").map(x=>({...x,type:"Customer"})).concat(col("FinanceSupplierInvoice").map(x=>({...x,type:"Supplier"}))),["invoiceNumber","customerId","supplierId","paymentStatus","postingStatus","companyCode"]),[
    {h:"Type",w:".55fr",f:x=>esc(x.type)},{h:"Invoice",w:".8fr",f:x=>esc(x.invoiceNumber||x.customerInvoiceId||x.supplierInvoiceId)},{h:"Partner",w:".8fr",f:x=>esc(x.customerId||x.supplierId)},{h:"Date",w:".55fr",f:x=>esc(String(x.invoiceDate||"").slice(0,10))},{h:"Amount",w:".7fr",f:x=>money(x.grossAmount,x.currency)},{h:"Status",w:".7fr",f:x=>pill(x.paymentStatus||x.postingStatus)}
  ],"No invoices received.","invoice")}</div></div></div>
  <div class="panel"><h3>PDF / receipt viewer</h3><div class="panel-body">${viewerHtml()}</div></div></div>`;
}
function viewerHtml(){return `<div class="viewer"><div class="viewer-head"><span class="badge">VIEWER <b>PDF / RECEIPT</b></span><button class="btn" data-action="clear-viewer">Clear</button>${state.pdfUrl?`<button class="btn" data-action="open-viewer-new">Open</button>`:""}</div>${state.pdfUrl?`<iframe id="pdfFrame" src="${esc(state.pdfUrl)}"></iframe>`:`<div class="viewer-empty">Select a document or paste a PDF/receipt URL, then choose View.</div>`}</div>`}
function paymentsView(){
  const co=opts("FinanceCompanyCode","companyCode","companyName",["SK01"]), cur=opts("FinanceCurrency","currencyCode","currencyName",["USD","EUR","SEK"]);
  return `<div class="split"><div class="panel"><h3>Bank account / statement line</h3><div class="panel-body"><div class="form-grid">
    <div class="field"><label class="label">Company</label><select id="bankCompany">${co}</select></div><div class="field"><label class="label">Bank account ID</label><input id="bankAccountId" class="input" placeholder="BANK-SK01-EUR"></div><div class="field"><label class="label">Currency</label><select id="bankCurrency">${cur}</select></div><div class="field"><label class="label">GL account</label><input id="bankGl" class="input" placeholder="100000"></div>
    <div class="field wide"><label class="label">Bank name</label><input id="bankName" class="input"></div><div class="field wide"><label class="label">IBAN / masked account</label><input id="bankIban" class="input"></div>
    <div class="field"><label class="label">Statement date</label><input id="stmtDate" class="input" type="date"></div><div class="field"><label class="label">Amount</label><input id="stmtAmount" class="input" type="number" step="0.01"></div><div class="field wide"><label class="label">Payment reference</label><input id="stmtReference" class="input"></div>
  </div><div class="row" style="margin-top:10px"><button class="btn primary" data-action="save-bank-account">Save bank account</button><button class="btn ok" data-action="save-bank-line">Save statement line</button></div></div></div>
  <div class="panel"><h3>Bank / payment lines</h3><div class="panel-body">${table(col("FinanceBankStatementLine").concat(col("FinanceCommercePaymentMirror")),[
    {h:"Date",w:".7fr",f:x=>esc(String(x.valueDate||x.settledAt||x.capturedAt||"").slice(0,10))},{h:"Reference",w:"1fr",f:x=>esc(x.paymentReference||x.bankReference||x.externalPaymentId)},{h:"Amount",w:".7fr",f:x=>money(x.amount||x.capturedAmount||x.netSettlementAmount,x.currency||x.transactionCurrency)},{h:"Status",w:".7fr",f:x=>pill(x.matchStatus||x.clearingStatus||x.paymentStatus)}
  ],"No bank or payment lines received.")}</div></div></div>`;
}
function costCentersView(){
  const co=opts("FinanceCompanyCode","companyCode","companyName",["SK01"]), cur=opts("FinanceCurrency","currencyCode","currencyName",["USD","EUR","SEK"]);
  return `<div class="split"><div class="stack"><div class="panel"><h3>Cost center and budget control</h3><div class="panel-body"><div class="form-grid">
    <div class="field"><label class="label">Company</label><select id="ccCompany">${co}</select></div><div class="field"><label class="label">Cost center ID</label><input id="ccId" class="input" placeholder="CORP-FIN"></div><div class="field wide"><label class="label">Cost center name</label><input id="ccName" class="input" placeholder="Corporate Finance"></div>
    <div class="field"><label class="label">Type</label><select id="ccType"><option>Corporate</option><option>Destination</option><option>Airport</option><option>Transport</option><option>Marketing</option><option>Payroll</option><option>IT</option><option>Finance</option></select></div>
    <div class="field"><label class="label">Manager SK-ID</label><input id="ccManager" class="input"></div><div class="field"><label class="label">Budget year</label><input id="ccBudgetYear" class="input" type="number" value="${new Date().getFullYear()}"></div><div class="field"><label class="label">Currency</label><select id="ccCurrency">${cur}</select></div>
    <div class="field"><label class="label">Budget amount</label><input id="ccBudgetAmount" class="input" type="number" step="0.01"></div><div class="field"><label class="label">Approval limit</label><input id="ccApprovalLimit" class="input" type="number" step="0.01"></div>
  </div><div class="row" style="margin-top:10px"><button class="btn primary" data-action="save-cost-center">Save cost center</button><button class="btn ok" data-action="save-cost-budget">Save budget</button><button class="btn" data-action="save-approval-policy">Save approval policy</button></div></div></div>
  <div class="panel"><h3>Cost centers</h3><div class="panel-body">${table(col("FinanceCostCenter"),[
    {h:"Cost center",w:".8fr",f:x=>esc(x.costCenterId)},{h:"Name",w:"1fr",f:x=>esc(x.costCenterName)},{h:"Type",w:".7fr",f:x=>esc(x.costCenterType)},{h:"Manager",w:".7fr",f:x=>esc(x.managerEmployeeId)},{h:"Active",w:".5fr",f:x=>pill(x.isActive===false?"Inactive":"Active")}
  ],"No cost centers received.")}</div></div></div>
  <div class="panel"><h3>Budgets and controls</h3><div class="panel-body">${table(col("FinanceCostCenterBudget").concat(col("FinanceApprovalPolicies")),[
    {h:"Object",w:"1fr",f:x=>esc(x.budgetId||x.policyId||x.costCenterId)},{h:"Year",w:".5fr",f:x=>esc(x.fiscalYear||x.year||"")},{h:"Amount/Limit",w:".8fr",f:x=>money(x.budgetAmount||x.approvalLimit,x.currency)},{h:"Status",w:".7fr",f:x=>pill(x.status||x.policyStatus)}
  ],"No budgets or approval policies received.")}</div></div></div>`;
}
function payrollSettingsView(){
  const co=opts("FinanceCompanyCode","companyCode","companyName",["SK01"]), cur=opts("FinanceCurrency","currencyCode","currencyName",["USD","EUR","SEK"]);
  return `<div class="split"><div class="panel"><h3>Payroll finance settings</h3><div class="panel-body"><div class="form-grid">
    <div class="field"><label class="label">Company</label><select id="payCompany">${co}</select></div><div class="field"><label class="label">Country / region</label><input id="payCountry" class="input" placeholder="US / SE / DK / NO"></div><div class="field"><label class="label">Currency</label><select id="payCurrency">${cur}</select></div><div class="field"><label class="label">Pay frequency</label><select id="payFrequency"><option>Monthly</option><option>Bi-weekly</option><option>Weekly</option><option>Semi-monthly</option></select></div>
    <div class="field wide"><label class="label">Tax profile name</label><input id="taxProfileName" class="input" placeholder="Sweden monthly payroll tax profile"></div><div class="field"><label class="label">Employer tax %</label><input id="employerTaxPercent" class="input" type="number" step="0.01"></div><div class="field"><label class="label">Employee tax % default</label><input id="employeeTaxPercent" class="input" type="number" step="0.01"></div>
    <div class="field wide"><label class="label">Benefit plan</label><input id="benefitPlanName" class="input" placeholder="Health / insurance / pension plan"></div><div class="field"><label class="label">Employer cost</label><input id="benefitEmployerCost" class="input" type="number" step="0.01"></div><div class="field"><label class="label">Employee deduction</label><input id="benefitEmployeeDeduction" class="input" type="number" step="0.01"></div>
    <div class="field"><label class="label">Wage expense GL</label><input id="payrollWageGl" class="input" placeholder="500000"></div><div class="field"><label class="label">Tax liability GL</label><input id="payrollTaxGl" class="input" placeholder="210000"></div><div class="field"><label class="label">Benefit liability GL</label><input id="payrollBenefitGl" class="input" placeholder="215000"></div><div class="field"><label class="label">Payroll clearing GL</label><input id="payrollClearingGl" class="input" placeholder="220000"></div>
    <div class="field full"><label class="label">Rule notes</label><textarea id="payrollRuleNotes" placeholder="Union agreement, local tax handling, benefit eligibility, sick/vacation accrual notes"></textarea></div>
  </div><div class="row" style="margin-top:10px"><button class="btn primary" data-action="save-payroll-tax-profile">Save tax profile</button><button class="btn ok" data-action="save-benefit-plan">Save benefit plan</button><button class="btn" data-action="save-payroll-gl-mapping">Save GL mapping</button></div></div></div>
  <div class="panel"><h3>Payroll settings records</h3><div class="panel-body">${table(col("FinancePayrollTaxProfiles").concat(col("FinancePayrollBenefitPlans")).concat(col("FinancePayrollGlMappings")).concat(col("FinancePayrollDeductionRules")),[
    {h:"Type",w:".7fr",f:x=>esc(x.settingType||x.profileType||x.planType||x.mappingType||"Payroll")},{h:"Name",w:"1fr",f:x=>esc(x.profileName||x.planName||x.mappingName||x.ruleName)},{h:"Company",w:".55fr",f:x=>esc(x.companyCode)},{h:"Country",w:".55fr",f:x=>esc(x.countryCode)},{h:"Status",w:".65fr",f:x=>pill(x.status||"Active")}
  ],"No payroll finance settings received.")}</div></div></div>`;
}
function taxCurrencyView(){
  const co=opts("FinanceCompanyCode","companyCode","companyName",["SK01"]);
  return `<div class="split"><div class="panel"><h3>Tax / currency / corporate settings</h3><div class="panel-body"><div class="form-grid">
    <div class="field"><label class="label">Currency code</label><input id="curCode" class="input" placeholder="USD"></div><div class="field wide"><label class="label">Currency name</label><input id="curName" class="input" placeholder="US Dollar"></div><div class="field"><label class="label">Minor unit</label><input id="curMinor" class="input" type="number" value="2"></div>
    <div class="field"><label class="label">Tax code</label><input id="taxCode" class="input" placeholder="VAT25"></div><div class="field"><label class="label">Country</label><input id="taxCountry" class="input" placeholder="SE"></div><div class="field"><label class="label">Rate %</label><input id="taxRate" class="input" type="number" step="0.01"></div><div class="field"><label class="label">Tax account</label><input id="taxAccount" class="input" placeholder="260000"></div>
    <div class="field"><label class="label">Company</label><select id="corpCompany">${co}</select></div><div class="field wide"><label class="label">Setting key</label><input id="corpSettingKey" class="input" placeholder="default_group_currency"></div><div class="field"><label class="label">Setting value</label><input id="corpSettingValue" class="input" placeholder="USD"></div>
  </div><div class="row" style="margin-top:10px"><button class="btn primary" data-action="save-currency">Save currency</button><button class="btn ok" data-action="save-tax-code">Save tax code</button><button class="btn" data-action="save-corporate-setting">Save corporate setting</button></div></div></div>
  <div class="panel"><h3>Tax and currency data</h3><div class="panel-body">${table(col("FinanceCurrency").concat(col("FinanceTaxCode")).concat(col("FinanceCorporateSettings")),[
    {h:"ID",w:".8fr",f:x=>esc(x.currencyCode||x.taxCode||x.settingKey)},{h:"Name",w:"1fr",f:x=>esc(x.currencyName||x.taxType||x.settingName)},{h:"Country/Company",w:".7fr",f:x=>esc(x.countryCode||x.companyCode)},{h:"Value",w:".8fr",f:x=>esc(x.ratePercent!=null?x.ratePercent+"%":x.settingValue||x.minorUnit)},{h:"Status",w:".6fr",f:x=>pill(x.isActive===false?"Inactive":"Active")}
  ],"No tax/currency records received.")}</div></div></div>`;
}
function approvalsView(){
  return `<div class="split"><div class="panel"><h3>Approval policies</h3><div class="panel-body">${table(col("FinanceApprovalPolicies"),[
    {h:"Policy",w:"1fr",f:x=>esc(x.policyName||x.policyId)},{h:"Object",w:".8fr",f:x=>esc(x.objectType)},{h:"Limit",w:".7fr",f:x=>money(x.approvalLimit,x.currency)},{h:"Role",w:".8fr",f:x=>esc(x.approverRole)},{h:"Status",w:".7fr",f:x=>pill(x.status||"Active")}
  ],"No approval policies received.")}</div></div><div class="panel"><h3>Workflow inbox</h3><div class="panel-body">${table(col("FinanceWorkflowCase"),[
    {h:"Case",w:".7fr",f:x=>esc(x.workflowCaseId||x._id)},{h:"Type",w:".65fr",f:x=>esc(x.caseType)},{h:"Document",w:"1fr",f:x=>esc(x.sourceDocumentId)},{h:"Assigned",w:".7fr",f:x=>esc(x.assignedTo)},{h:"Status",w:".7fr",f:x=>pill(x.status)}
  ],"No approval cases received.")}</div></div></div>`;
}
function integrationsView(){
  return `<div class="split"><div class="panel"><h3>Data intake monitor</h3><div class="panel-body">${table(col("IntegrationInboundEvent"),[
    {h:"Source",w:".8fr",f:x=>esc(x.sourceSystemCode)},{h:"Event",w:".8fr",f:x=>esc(x.eventType)},{h:"Object",w:"1fr",f:x=>esc(x.externalObjectId)},{h:"Received",w:".7fr",f:x=>esc(String(x.receivedAt||"").slice(0,16))},{h:"Status",w:".7fr",f:x=>pill(x.processingStatus)}
  ],"No inbound events received.")}</div></div><div class="panel"><h3>Storefront commerce intake</h3><div class="panel-body">${table(col("FinanceCommerceOrderMirror"),[
    {h:"Order",w:".8fr",f:x=>esc(x.orderNumber||x.externalOrderId)},{h:"Date",w:".65fr",f:x=>esc(String(x.orderDate||"").slice(0,10))},{h:"Amount",w:".7fr",f:x=>money(x.grossAmount,x.transactionCurrency)},{h:"Payment",w:".7fr",f:x=>pill(x.paymentStatus)},{h:"Posting",w:".7fr",f:x=>pill(x.financePostingStatus)}
  ],"No storefront orders received.")}</div></div></div>`;
}
function auditView(){
  return `<div class="panel"><h3>Audit trail</h3><div class="panel-body">${table(col("FinanceAuditEvent"),[
    {h:"Time",w:".8fr",f:x=>esc(String(x.timestamp||x.createdAt||"").slice(0,19))},{h:"Event",w:".8fr",f:x=>esc(x.eventType)},{h:"Entity",w:".8fr",f:x=>esc(x.entityType)},{h:"Object",w:"1fr",f:x=>esc(x.entityId)},{h:"User",w:".7fr",f:x=>esc(x.userId)},{h:"Reason",w:"1fr",f:x=>esc(x.reasonCode||x.reason)}
  ],"No audit events received.")}</div></div>`;
}
function render(){
  renderTop();
  const map={home:homeView,pnl:pnlView,journal:journalView,expenses:expensesView,purchases:purchasesView,invoices:invoicesView,payments:paymentsView,costcenters:costCentersView,payrollsettings:payrollSettingsView,taxcurrency:taxCurrencyView,approvals:approvalsView,integrations:integrationsView,audit:auditView};
  const el=$("view-"+state.view); if(el)el.innerHTML=(map[state.view]||homeView)();
  const search=$("skChromeSearchInput"); if(search && !$("skChromeSearchResults").dataset.ready){$("skChromeSearchResults").dataset.ready="1";search.addEventListener("keydown",e=>{if(e.key==="Enter"){$("globalSearch").value=search.value;render();}})}
}
function collectExpense(statusValue){
  const id=uid("EXP"); return {
    report:{expenseReportId:id,reportNumber:id,companyCode:val("erCompany"),employeeId:val("erEmployee"),reportDate:val("erDate"),currency:val("erCurrency"),grossAmount:num("erGross"),taxAmount:num("erTax"),costCenterId:val("erCostCenter"),category:val("erCategory"),purpose:val("erPurpose"),notes:val("erNotes"),status:statusValue||"Draft"},
    line:{expenseReportId:id,lineNo:1,category:val("erCategory"),grossAmount:num("erGross"),taxAmount:num("erTax"),currency:val("erCurrency"),costCenterId:val("erCostCenter"),description:val("erPurpose")},
    receipt:{receiptId:uid("RCT"),expenseReportId:id,title:val("erPurpose")||"Expense receipt",fileUrl:val("erReceiptUrl"),amount:num("erGross"),currency:val("erCurrency"),sourceType:"Expense report",status:"Attached"}
  }
}
function collectPurchase(createPo=false){
  const id=uid("PR"); return {request:{purchaseRequestId:id,requestNumber:id,companyCode:val("prCompany"),supplierId:val("prSupplier"),requestDate:val("prDate"),currency:val("prCurrency"),amount:num("prAmount"),category:val("prCategory"),costCenterId:val("prCostCenter"),needBy:val("prNeedBy"),title:val("prTitle"),description:val("prDescription"),status:createPo?"PO Requested":"Open",receiptUrl:val("prReceiptUrl")},
    createPo};
}
function collectInvoice(postIt=false){
  const type=val("invType"), id=uid(type==="CUSTOMER"?"AR":"AP"), net=num("invNet"), tax=num("invTax"), gross=net+tax;
  return {invoiceType:type,postIt,invoice:{[type==="CUSTOMER"?"customerInvoiceId":"supplierInvoiceId"]:id,invoiceNumber:id,companyCode:val("invCompany"),[type==="CUSTOMER"?"customerId":"supplierId"]:val("invPartner"),invoiceDate:val("invDate"),dueDate:val("invDue"),currency:val("invCurrency"),netAmount:net,taxAmount:tax,grossAmount:gross,referenceNumber:val("invRef"),note:val("invNote"),paymentStatus:"Open",postingStatus:postIt?"Ready to post":"Draft"},
    line:{invoiceId:id,lineNo:1,description:val("invLineText"),netAmount:net,taxAmount:tax,grossAmount:gross,costCenterId:val("invCostCenter"),currency:val("invCurrency")},
    pdf:{invoicePdfId:uid("PDF"),invoiceId:id,invoiceNumber:id,documentType:type==="CUSTOMER"?"Customer invoice":"Supplier invoice",fileUrl:val("invPdfUrl"),status:"Attached"}};
}
function currentSave(){
  const v=state.view;
  if(v==="expenses")return saveComplex("FINANCE_SAVE_EXPENSE_REPORT",collectExpense("Draft"),"expense report");
  if(v==="purchases")return saveComplex("FINANCE_SAVE_PURCHASE_REQUEST",collectPurchase(false),"purchase request");
  if(v==="invoices")return saveComplex("FINANCE_SAVE_INVOICE",collectInvoice(false),"invoice");
  if(v==="costcenters")return save("FinanceCostCenter",{costCenterId:val("ccId"),companyCode:val("ccCompany"),costCenterName:val("ccName"),costCenterType:val("ccType"),managerEmployeeId:val("ccManager"),isActive:true},"cost center");
  if(v==="payrollsettings")return save("FinancePayrollTaxProfiles",{profileId:uid("TAXP"),companyCode:val("payCompany"),countryCode:val("payCountry"),currency:val("payCurrency"),payFrequency:val("payFrequency"),profileName:val("taxProfileName"),employerTaxPercent:num("employerTaxPercent"),employeeTaxPercent:num("employeeTaxPercent"),notes:val("payrollRuleNotes"),status:"Active"},"payroll tax profile");
  if(v==="taxcurrency")return save("FinanceCorporateSettings",{settingId:uid("SET"),companyCode:val("corpCompany"),settingKey:val("corpSettingKey"),settingValue:val("corpSettingValue"),status:"Active"},"corporate setting");
  status("Nothing editable is active in this view.","warn");
}
document.addEventListener("click",e=>{
  const view=e.target.closest("[data-view]"); if(view){state.view=view.dataset.view;document.body.classList.remove("drawer-open");render();return;}
  const action=e.target.closest("[data-action]"); if(!action)return; const a=action.dataset.action;
  if(a==="print")window.print();
  else if(a==="logout")post("INTERNAL_LOGOUT",{});
  else if(a==="refresh")refresh();
  else if(a==="save-current")currentSave();
  else if(a==="save-expense-report")saveComplex("FINANCE_SAVE_EXPENSE_REPORT",collectExpense("Draft"),"expense report");
  else if(a==="submit-expense-report")saveComplex("FINANCE_SAVE_EXPENSE_REPORT",collectExpense("Pending approval"),"expense report");
  else if(a==="view-expense-receipt"){state.pdfUrl=val("erReceiptUrl");render();}
  else if(a==="save-purchase-request")saveComplex("FINANCE_SAVE_PURCHASE_REQUEST",collectPurchase(false),"purchase request");
  else if(a==="create-purchase-order")saveComplex("FINANCE_SAVE_PURCHASE_REQUEST",collectPurchase(true),"purchase order");
  else if(a==="view-purchase-receipt"){state.pdfUrl=val("prReceiptUrl");render();}
  else if(a==="save-invoice")saveComplex("FINANCE_SAVE_INVOICE",collectInvoice(false),"invoice");
  else if(a==="post-invoice")saveComplex("FINANCE_SAVE_INVOICE",collectInvoice(true),"invoice posting");
  else if(a==="view-invoice-pdf"){state.pdfUrl=val("invPdfUrl");render();}
  else if(a==="print-pdf"){$("pdfFrame")?.contentWindow?.print?.();}
  else if(a==="clear-viewer"){state.pdfUrl="";render();}
  else if(a==="open-viewer-new"&&state.pdfUrl)window.open(state.pdfUrl,"_blank");
  else if(a==="save-bank-account")save("FinanceBankAccount",{bankAccountId:val("bankAccountId"),companyCode:val("bankCompany"),bankName:val("bankName"),iban:val("bankIban"),currency:val("bankCurrency"),glAccountId:val("bankGl"),isActive:true,approvalStatus:"Pending approval"},"bank account");
  else if(a==="save-bank-line")save("FinanceBankStatementLine",{bankStatementLineId:uid("BSL"),bankAccountId:val("bankAccountId"),valueDate:val("stmtDate"),amount:num("stmtAmount"),currency:val("bankCurrency"),paymentReference:val("stmtReference"),matchStatus:"Unmatched"},"bank statement line");
  else if(a==="save-cost-center")save("FinanceCostCenter",{costCenterId:val("ccId"),companyCode:val("ccCompany"),costCenterName:val("ccName"),costCenterType:val("ccType"),managerEmployeeId:val("ccManager"),isActive:true},"cost center");
  else if(a==="save-cost-budget")save("FinanceCostCenterBudget",{budgetId:uid("BUD"),costCenterId:val("ccId"),companyCode:val("ccCompany"),fiscalYear:num("ccBudgetYear"),currency:val("ccCurrency"),budgetAmount:num("ccBudgetAmount"),status:"Approved"},"cost center budget");
  else if(a==="save-approval-policy")save("FinanceApprovalPolicies",{policyId:uid("POL"),policyName:`${val("ccId")} approval policy`,companyCode:val("ccCompany"),objectType:"Spend",costCenterId:val("ccId"),approvalLimit:num("ccApprovalLimit"),currency:val("ccCurrency"),status:"Active"},"approval policy");
  else if(a==="save-payroll-tax-profile")save("FinancePayrollTaxProfiles",{profileId:uid("TAXP"),settingType:"Tax profile",companyCode:val("payCompany"),countryCode:val("payCountry"),currency:val("payCurrency"),payFrequency:val("payFrequency"),profileName:val("taxProfileName"),employerTaxPercent:num("employerTaxPercent"),employeeTaxPercent:num("employeeTaxPercent"),notes:val("payrollRuleNotes"),status:"Active"},"payroll tax profile");
  else if(a==="save-benefit-plan")save("FinancePayrollBenefitPlans",{benefitPlanId:uid("BEN"),settingType:"Benefit plan",companyCode:val("payCompany"),countryCode:val("payCountry"),currency:val("payCurrency"),planName:val("benefitPlanName"),employerCost:num("benefitEmployerCost"),employeeDeduction:num("benefitEmployeeDeduction"),status:"Active"},"benefit plan");
  else if(a==="save-payroll-gl-mapping")save("FinancePayrollGlMappings",{mappingId:uid("MAP"),settingType:"GL mapping",companyCode:val("payCompany"),countryCode:val("payCountry"),currency:val("payCurrency"),mappingName:`${val("payCompany")} payroll GL mapping`,wageExpenseGl:val("payrollWageGl"),taxLiabilityGl:val("payrollTaxGl"),benefitLiabilityGl:val("payrollBenefitGl"),payrollClearingGl:val("payrollClearingGl"),status:"Active"},"payroll GL mapping");
  else if(a==="save-currency")save("FinanceCurrency",{currencyCode:val("curCode"),currencyName:val("curName"),minorUnit:num("curMinor"),isActive:true},"currency");
  else if(a==="save-tax-code")save("FinanceTaxCode",{taxCode:val("taxCode"),countryCode:val("taxCountry"),ratePercent:num("taxRate"),taxAccountId:val("taxAccount"),isActive:true},"tax code");
  else if(a==="save-corporate-setting")save("FinanceCorporateSettings",{settingId:uid("SET"),companyCode:val("corpCompany"),settingKey:val("corpSettingKey"),settingValue:val("corpSettingValue"),status:"Active"},"corporate setting");
  else if(a==="export-report"){const payload={view:state.view,company:$("companyFilter").value,period:$("periodFilter").value,generatedAt:nowIso(),data:state.data};const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const link=document.createElement("a");link.href=url;link.download=`SKANDI-Finance-${state.view}-${new Date().toISOString().slice(0,10)}.json`;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);toast("Finance report exported.");}
});
document.addEventListener("input",e=>{if(["globalSearch","companyFilter","periodFilter"].includes(e.target.id))render()});
$("mobileMenuBtn").onclick=()=>document.body.classList.add("drawer-open");$("drawerBackdrop").onclick=()=>document.body.classList.remove("drawer-open");
window.addEventListener("message", e => {
  const m = e.data || {};
  if (m.source && m.source !== PARENT) return;

  const p = m.payload || {};

  if (m.type === "CORPORATE_FINANCE_BOOTSTRAP") {
    state.connected = true;
    state.busy = false;
    state.lastRefresh = nowIso();

    const canonicalData = p.data && typeof p.data === "object" ? p.data : {};
    state.data = {
      ...state.data,
      ...canonicalData
    };

    if (!Array.isArray(state.data.FinanceUniversalJournal) || !state.data.FinanceUniversalJournal.length) {
      state.data.FinanceUniversalJournal = (p.entries || []).map(entry => ({
        journalDocumentId: entry.journalDocumentId || entry.entry_id || entry.sourceId || entry._id || entry.id || "",
        companyCode: entry.companyCode || entry.metadata?.companyCode || "SKANDI",
        postingDate: entry.postingDate || entry.transaction_date || entry.occurredAt || entry.createdAt || "",
        glAccountId: entry.glAccountId || entry.account_code || entry.category || entry.account || "",
        accountType: entry.accountType || entry.account || "",
        sourceModule: entry.sourceModule || entry.source_type || entry.source || "",
        sourceDocumentType: entry.sourceDocumentType || entry.reference_type || entry.sourceType || "",
        sourceDocumentId: entry.sourceDocumentId || entry.source_id || entry.reference_id || entry.sourceId || "",
        amountGroup: entry.amountGroup ?? entry.amount ?? 0,
        amountCompanyCode: entry.amountCompanyCode ?? entry.amount ?? 0,
        amountTransaction: entry.amountTransaction ?? entry.amount ?? 0,
        groupCurrency: entry.groupCurrency || entry.currency || "USD",
        companyCodeCurrency: entry.companyCodeCurrency || entry.currency || "USD",
        transactionCurrency: entry.transactionCurrency || entry.currency || "USD",
        fiscalYear: entry.fiscalYear || String(entry.period || entry.transaction_date || "").slice(0, 4),
        fiscalPeriod: entry.fiscalPeriod || String(entry.period || entry.transaction_date || "").slice(5, 7),
        taxCode: entry.taxCode || ""
      }));
    }

    if (p.profile) {
      const setText = (id, value) => { const node = $(id); if (node) node.textContent = value || "—"; };
      setText("skChromeUserName", p.profile.name || "Finance user");
      setText("skChromeSkid", p.profile.skId);
      setText("skChromePosition", p.profile.role);
      setText("skChromeBase", p.profile.base);
    }

    const warnings = Array.isArray(p.warnings) ? p.warnings : [];
    if (warnings.length) {
      status(`Finance data loaded with ${warnings.length} source warning${warnings.length === 1 ? "" : "s"}. Review Data Intake for source availability.`, "warn");
    } else {
      status("Finance data refreshed.", "ok");
    }
    render();
  }

  if (m.type === "CORPORATE_FINANCE_ERROR" || m.type === "INVOICE_ERROR") {
    state.busy = false;
    status(p.message || m.message || "Finance action failed.", "error");
  }

  if (
    m.type === "FINANCE_SAVE_RESULT" ||
    m.type === "FINANCE_ACTION_RESULT" ||
    m.type === "INVOICE_DRAFT_RESULT" ||
    m.type === "INVOICE_UPDATE_RESULT" ||
    m.type === "INVOICE_ISSUE_RESULT" ||
    m.type === "INVOICE_PAYMENT_RESULT" ||
    m.type === "INVOICE_VOID_RESULT" ||
    m.type === "INVOICE_PDF_RESULT"
  ) {
    state.busy = false;
    toast(p.message || "Invoice action completed.");

    if (p.pdfUrl) {
      state.pdfUrl = p.pdfUrl;
    }

    refresh();
  }
});

post("CORPORATE_FINANCE_REFRESH",{});

})();
</script>
</body>
</html>
```
