# SKANDI INFO / LOG — V12 DOCUMENT SYSTEM CONVERGENCE

- Source identity: `/HTML_REF/riaintra/Staff Document Control.md`.
- Display/page name: Staff Document Control.
- System area: `RIAINTRA`.
- Wix controller: `/src/pages/Staff Document Control.ycgof.js`.
- Route/context: `REQUIRES LIVE ROUTE VERIFICATION`.
- Wix HTML element: `#documentControlHtml`.
- Child source: `SKANDI_DOCUMENT_CONTROL`; parent source: `SKANDI_WIX_PARENT`.
- Current status: **STATICALLY VERIFIED — REQUIRES LIVE TEST** after Wix installation/publication.
- Source-of-truth status: complete intended V12 HTML payload below.
- Canonical ownership: `backend/SKANDI_CORE/documentControl.web.js` → `documentControl.js` → document definitions, rules, instances, events and compliance records.
- Authentication/authorization: public customer surfaces retain the existing customer/member boundary; internal surfaces require canonical `staffAuth` server authorization. Client-provided roles are not authority.
- Database verification: relevant tables/columns were inspected read-only against the active SKANDI Supabase project on 2026-10-13. No database rows, schema, policies or storage objects were changed.
- Document source archive: the supplied Dropbox folder could not be opened from the available runtime. No Dropbox document content was guessed or imported. The existing Supabase catalog remains authoritative for document definitions/rules until those source files are explicitly ingested.
- Last verified: 2026-10-13 UTC.
- Change log:
  - 2026-10-13 — Converged this surface onto `backend/SKANDI_CORE`, removed legacy/missing backend namespace dependency, preserved supplied HTML design/behavior, and documented the complete runtime chain.
  - 2026-10-13 — Restored missing Agent/Station elements referenced by the supplied script, corrected malformed CSS, and connected Create/Issue actions to the canonical document core.

## COMPLETE INTENDED HTML

```html
<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>SKANDI Document Control</title>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700;800;900&display=swap" rel="stylesheet">
<style>
:root{
  --navy:#022e64;
  --navy2:#011f45;
  --cyan:#5fc7cf;
  --bg:#eef2f6;
  --panel:#ffffff;
  --line:#d7dde5;
  --line-dark:#aeb8c4;
  --text:#101828;
  --muted:#667085;
  --ok:#087443;
  --warn:#986b16;
  --danger:#b42318;
  --soft:#f7f9fb;
  --sk-blue:#022e64;
  --sk-blue-soft:#285ca8;
  --sk-blue2:#0b3a7a;
  --sk-light:#d7e6ff;
  --sk-pale:#f6faff;
  --sk-bg:#f7faff;
  --sk-border:#dbe3ef;
  --sk-border-soft:#eef2f7;
  --sk-text:#111;
  --sk-body:#555;
  --sk-muted:#667085;
  --sk-cyan:#5FC7CF;
  --sk-ok:#087443;
  --sk-danger:#8a1f1f;
  --sk-warning-bg:#fffbeb;
  --sk-warning-border:#fde68a;
  --sk-warning-text:#92400e;
  --sk-shadow:0 8px 26px rgba(0,0,0,.08);
  --sk-shadow-strong:0 14px 34px rgba(0,0,0,.12);
}
*{box-sizing:border-box;margin:0;padding:0}
html,body{  width:100%;
  min-height:100%;
  font-family:"Montserrat",system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
  background:#fff;
  color:var(--sk-text);
  overflow-x:hidden;}
button,input,select,textarea{font:inherit}
button{cursor:pointer}
.shell{min-height:100vh;display:flex;flex-direction:column}
.topbar{
    transition: all 0.3s ease;    
  width:100%;
  min-height:420px;
  background: linear-gradient(rgba(2, 46, 100, 0.6), rgba(2, 46, 100, 0.8)), url("https://static.wixstatic.com/media/394052_d7ab279398944473a66a85d02041278f~mv2.png") center/cover;
  padding:76px 32px 54px;
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  text-align:center;
}
.brand{  font-size:12px;
  font-weight:800;
  color:var(--sk-cyan);
  text-transform:uppercase;
  letter-spacing:.14em;
  margin-bottom:10px;}
.brand small{  font-size:clamp(36px,4vw,56px);
  line-height:1.1;
  letter-spacing:-.04em;
  font-weight:700;
  color:#fff;
  margin-bottom:16px;}
.topmeta{display:flex;align-items:center;gap:9px;flex-wrap:wrap;justify-content:flex-end}
.badge{border:1px solid rgba(255,255,255,.28);padding:5px 7px;font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:.04em}
.main{flex:1;display:flex;min-height:0}
.sidebar{width:220px;background:#fff;border-right:1px solid var(--line);padding:12px 0;flex:0 0 auto}
.navbtn{width:100%;border:0;background:transparent;text-align:left;padding:10px 14px;color:#344054;font-weight:800;font-size:10px;border-left:3px solid transparent}
.navbtn:hover,.navbtn.active{background:#f3f8fb;color:var(--navy);border-left-color:var(--cyan)}
.content{flex:1;min-width:0;padding:18px}
.pagehead{  font-size:30px;
  font-weight:700;
  color:var(--sk-blue);
  margin-bottom:12px;
  letter-spacing:-.04em;
  text-align:center;}
.pagehead h1{  color:#555;
  font-size:30px;
  line-height:1.6;
  margin-bottom:32px;
  max-width:780px;
  text-align:center;
  margin-inline:auto;}
.pagehead p{margin:4px 0 0;color:var(--muted);font-size:10px;line-height:1.5}
.actions{display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end}
.btn{min-height:36px;border:1px solid var(--navy);background:#fff;color:var(--navy);font-size:9px;font-weight:900;padding:0 11px;text-transform:uppercase;letter-spacing:.04em}
.btn.primary{background:var(--navy);color:#fff}
.btn.secondary{border-color:#9da9b7;color:#344054}
.btn.danger{border-color:var(--danger);color:var(--danger)}
.btn:disabled{opacity:.5;cursor:not-allowed}
.card{background:#fff;border:1px solid var(--line);margin-bottom:12px}
.cardhead{padding:9px 11px;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;gap:10px}
.cardhead strong{font-size:10px;color:var(--navy);text-transform:uppercase;letter-spacing:.05em}
.cardbody{padding:11px}
.metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;margin-bottom:12px}
.metric{background:#fff;border:1px solid var(--line);padding:10px}
.metric .n{font-size:21px;font-weight:900;color:var(--navy)}
.metric .l{font-size:8px;color:var(--muted);text-transform:uppercase;font-weight:800;margin-top:3px}
.tablewrap{overflow:auto}
table{width:100%;border-collapse:collapse;background:#fff;font-size:9px}
th{background:#f4f6f8;color:#344054;text-align:left;font-size:8px;text-transform:uppercase;letter-spacing:.04em;padding:7px;border-bottom:1px solid var(--line);white-space:nowrap}
td{padding:7px;border-bottom:1px solid #edf0f3;vertical-align:top}
tr:hover td{background:#fbfcfd}
.status{font-size:8px;font-weight:900;text-transform:uppercase;padding:4px 6px;display:inline-block;border:1px solid #bbc6d2;background:#f7f9fb;color:#344054}
.status.ok{color:var(--ok);border-color:#9dceb6;background:#f1faf5}
.status.warn{color:var(--warn);border-color:#ddc586;background:#fff9e8}
.status.bad{color:var(--danger);border-color:#e1aaa5;background:#fff4f3}
.filters{display:grid;grid-template-columns:2fr repeat(3,1fr);gap:8px}
.field label{display:block;font-size:7px;text-transform:uppercase;font-weight:900;color:var(--muted);margin:0 0 4px}
.control{width:100%;height:35px;border:1px solid #bcc6d1;background:#fff;padding:0 8px;color:#101828;font-size:9px;outline:0}
textarea.control{height:auto;min-height:70px;padding:8px;resize:vertical}
.control:focus{border-color:var(--cyan);box-shadow:0 0 0 2px rgba(95,199,207,.16)}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:9px}
.grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}
.notice{border-left:4px solid var(--cyan);background:#f2fbfc;padding:9px 11px;font-size:9px;line-height:1.5;margin-bottom:10px}
.notice.warn{border-left-color:#c89f45;background:#fff9ea}
.notice.bad{border-left-color:var(--danger);background:#fff4f3}
.drawer{position:fixed;top:58px;right:-560px;bottom:0;width:min(560px,100vw);background:#fff;border-left:1px solid var(--line);z-index:50;transition:.2s;box-shadow:-20px 0 45px rgba(1,31,69,.14);overflow:auto}
.drawer.open{right:0}
.drawerhead{position:sticky;top:0;background:#fff;border-bottom:1px solid var(--line);padding:12px;display:flex;align-items:center;justify-content:space-between;gap:10px;z-index:2}
.drawerbody{padding:12px}
.empty{padding:25px;text-align:center;color:var(--muted);font-size:10px}
.code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:8px;color:#344054;background:#f3f5f7;padding:3px 5px}
@media(max-width:900px){
 .sidebar{display:none}.content{padding:10px}.metrics{grid-template-columns:1fr 1fr}.filters{grid-template-columns:1fr 1fr}.grid3{grid-template-columns:1fr}
}
@media(max-width:560px){
 .topbar{height:auto;min-height:58px;padding:10px}.main{display:block}.metrics,.filters,.grid2{grid-template-columns:1fr}.pagehead{display:block}.actions{justify-content:flex-start;margin-top:10px}
}
</style></head>
<body><div class="shell">
<div class="topbar"><div class="brand">SKANDI TRAVELS<br><small>DOCUMENT CONTROL</small></div><div class="topmeta"><span class="badge" id="agent">STAFF</span><span class="badge" id="station">GLOBAL</span></div></div>
<div class="main">
<aside class="sidebar"><button class="navbtn active" data-tab="instances">Documents</button><button class="navbtn" data-tab="definitions">Definitions</button><button class="navbtn" data-tab="rules">Automation Rules</button><button class="navbtn" data-tab="events">Events</button><button class="navbtn" data-tab="compliance">Compliance</button></aside>
<main class="content">
<div class="pagehead"><div><h1 id="pageTitle">Documents</h1><p id="pageDesc">Live, issued and historical SKANDI documents.</p></div><div class="actions"><button class="btn" id="refreshBtn">Refresh</button><button class="btn primary" id="newBtn">Create document</button></div></div>
<div class="metrics"><div class="metric"><div class="n" id="mDraft">0</div><div class="l">Draft / waiting</div></div><div class="metric"><div class="n" id="mReady">0</div><div class="l">Ready</div></div><div class="metric"><div class="n" id="mIssued">0</div><div class="l">Issued</div></div><div class="metric"><div class="n" id="mErrors">0</div><div class="l">Exceptions</div></div></div>
<div class="card"><div class="cardhead"><strong>Search & filter</strong></div><div class="cardbody"><div class="filters"><div class="field"><label>Search</label><input class="control" id="search" placeholder="PNR, document no., passenger, supplier..."></div><div class="field"><label>Category</label><select class="control" id="category"><option value="">All</option></select></div><div class="field"><label>Status</label><select class="control" id="statusFilter"><option value="">All</option><option>DRAFT</option><option>READY</option><option>ISSUED</option><option>SENT</option><option>ACKNOWLEDGED</option></select></div><div class="field"><label>Station</label><input class="control" id="stationFilter"></div></div></div></div>
<div class="card"><div class="cardhead"><strong id="tableTitle">Document instances</strong><span id="count">0</span></div><div class="tablewrap"><table><thead id="thead"></thead><tbody id="tbody"></tbody></table></div></div>
</main></div></div>
<div class="drawer" id="drawer"><div class="drawerhead"><strong id="drawerTitle">Document</strong><button class="btn secondary" id="drawerClose">Close</button></div><div class="drawerbody" id="drawerBody"></div></div>
<script>
(() => {
"use strict";
const SOURCE="SKANDI_DOCUMENT_CONTROL",PARENT="SKANDI_WIX_PARENT";const $=id=>document.getElementById(id),$$=s=>Array.from(document.querySelectorAll(s));
let state={tab:"instances",instances:[],definitions:[],rules:[],events:[],compliance:[]};
function post(type,payload={}){window.parent.postMessage({source:SOURCE,type,payload,timestamp:new Date().toISOString()},"*")}
function sc(s){s=String(s||"").toUpperCase();if(["ISSUED","SENT","ACKNOWLEDGED","READY","VALID","VERIFIED"].includes(s))return"ok";if(["DRAFT","WAITING_FOR_DATA","WAITING_FOR_SIGNATURE","UNDER_REVIEW","PENDING"].includes(s))return"warn";if(["ERROR","REJECTED","EXPIRED","INVALID"].includes(s))return"bad";return""}
function cols(){if(state.tab==="definitions")return["code","name","category","generation_mode","owner","template_version"];if(state.tab==="rules")return["rule_key","event_type","document_code","mode","scope","active"];if(state.tab==="events")return["event_type","booking_id","service_id","processing_status","occurred_at"];if(state.tab==="compliance")return["requirement_code","subject_type","subject_id","status","expires_at","verified_by"];return["document_number","document_code","booking_id","service_id","status","version","updated_at"]}
function rows(){return state[state.tab]||[]}
function render(){
 const search=$("search").value.toLowerCase(),status=$("statusFilter").value,category=$("category").value,station=$("stationFilter").value.toLowerCase();let data=rows().filter(r=>{const txt=JSON.stringify(r).toLowerCase();if(search&&!txt.includes(search))return false;if(status&&String(r.status||r.processing_status)!==status)return false;if(category&&String(r.category||"")!==category)return false;if(station&&!String(r.station_code||"").toLowerCase().includes(station))return false;return true});
 $("count").textContent=data.length;const c=cols();$("thead").innerHTML="<tr>"+c.map(x=>`<th>${x.replaceAll("_"," ")}</th>`).join("")+"<th></th></tr>";$("tbody").innerHTML=data.map((r,i)=>"<tr>"+c.map(k=>`<td>${k.includes("status")?`<span class="status ${sc(r[k])}">${r[k]??""}</span>`:(r[k]??"")}</td>`).join("")+`<td><button class="btn secondary" data-row="${i}">Open</button></td></tr>`).join("");
 $("mDraft").textContent=state.instances.filter(x=>["DRAFT","WAITING_FOR_DATA","WAITING_FOR_SIGNATURE","WAITING_FOR_APPROVAL"].includes(String(x.status))).length;$("mReady").textContent=state.instances.filter(x=>String(x.status)==="READY").length;$("mIssued").textContent=state.instances.filter(x=>["ISSUED","SENT","ACKNOWLEDGED"].includes(String(x.status))).length;$("mErrors").textContent=state.events.filter(x=>String(x.processing_status)==="ERROR").length;
}
function openDrawer(row){const d=$("drawer");$("drawerTitle").textContent=row.document_number||row.code||row.rule_key||row.requirement_code||row.event_type||"Details";$("drawerBody").innerHTML=`<div class="notice">${row.name||"SKANDI controlled record"}</div><pre class="code" style="white-space:pre-wrap">${JSON.stringify(row,null,2)}</pre>${row.id&&state.tab==="instances"?`<div class="actions" style="margin-top:12px"><button class="btn primary" data-issue="${row.id}">Issue</button><button class="btn" data-view="${row.id}">View document</button></div>`:""}`;d.classList.add("open")}
$("tbody").addEventListener("click",e=>{const b=e.target.closest("[data-row]");if(b)openDrawer(rows()[Number(b.dataset.row)])});
$("drawerBody").addEventListener("click",e=>{const issue=e.target.closest("[data-issue]"),view=e.target.closest("[data-view]");if(issue)post("DOCUMENT_CONTROL_ISSUE",{documentId:issue.dataset.issue});if(view)post("DOCUMENT_CONTROL_VIEW",{documentId:view.dataset.view})});
$$(".navbtn").forEach(b=>b.addEventListener("click",()=>{$$(".navbtn").forEach(x=>x.classList.remove("active"));b.classList.add("active");state.tab=b.dataset.tab;const titles={instances:"Documents",definitions:"Definitions",rules:"Automation Rules",events:"Events",compliance:"Compliance"};$("pageTitle").textContent=titles[state.tab];$("tableTitle").textContent=titles[state.tab];render();post("DOCUMENT_CONTROL_TAB",{tab:state.tab})}));
["search","category","statusFilter","stationFilter"].forEach(id=>$(id).addEventListener("input",render));$("drawerClose").addEventListener("click",()=> $("drawer").classList.remove("open"));$("refreshBtn").addEventListener("click",()=>post("DOCUMENT_CONTROL_REFRESH",{tab:state.tab}));$("newBtn").addEventListener("click",()=>{const documentCode=(prompt("Document code (for example A17):")||"").trim().toUpperCase();if(!documentCode)return;const bookingId=(prompt("Booking ID / cart ID (optional):")||"").trim();const serviceId=(prompt("Service ID (optional):")||"").trim();post("DOCUMENT_CONTROL_CREATE",{documentCode,bookingId,serviceId,station:$("station").textContent||"GLOBAL"})});
window.addEventListener("message",e=>{let m=e.data;if(typeof m==="string"){try{m=JSON.parse(m)}catch{return}}if(!m||typeof m!=="object")return;if(m.source&&m.source!==PARENT)return;const p=m.payload||{};if(m.type==="DOCUMENT_CONTROL_BOOTSTRAP"){state={...state,...p};const cats=[...new Set(state.definitions.map(x=>x.category).filter(Boolean))].sort();$("category").innerHTML='<option value="">All</option>'+cats.map(c=>`<option>${c}</option>`).join("");$("agent").textContent=p.agent||"STAFF";$("station").textContent=p.station||"GLOBAL";render()}if(m.type==="DOCUMENT_CONTROL_DATA"){state[p.tab]=Array.isArray(p.rows)?p.rows:[];render()}if(m.type==="DOCUMENT_CONTROL_CREATED"){alert(`Document created: ${p.document?.document_number||"created"}`)}if(m.type==="DOCUMENT_CONTROL_ERROR"){alert(p.message||"Document Control action failed.")}});
post("DOCUMENT_CONTROL_READY");
})();
</script></body></html>
```
