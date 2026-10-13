# SKANDI INFO / LOG — V12 DOCUMENT SYSTEM CONVERGENCE

- Source identity: `/HTML_REF/riaintra/Transport Compliance.md`.
- Display/page name: Transport Compliance.
- System area: `RIAINTRA`.
- Wix controller: `/src/pages/Transport Compliance Control.bsgb8.js`.
- Route/context: `REQUIRES LIVE ROUTE VERIFICATION`.
- Wix HTML element: `#transportComplianceHtml`.
- Child source: `SKANDI_TRANSPORT_COMPLIANCE_CONTROL`; parent source: `SKANDI_WIX_PARENT`.
- Current status: **STATICALLY VERIFIED — REQUIRES LIVE TEST** after Wix installation/publication.
- Source-of-truth status: complete intended V12 HTML payload below.
- Canonical ownership: `backend/SKANDI_CORE/documentControl.web.js` → `documentControl.js` → `compliance_requirements` / `compliance_records`.
- Authentication/authorization: public customer surfaces retain the existing customer/member boundary; internal surfaces require canonical `staffAuth` server authorization. Client-provided roles are not authority.
- Database verification: relevant tables/columns were inspected read-only against the active SKANDI Supabase project on 2026-10-13. No database rows, schema, policies or storage objects were changed.
- Document source archive: the supplied Dropbox folder could not be opened from the available runtime. No Dropbox document content was guessed or imported. The existing Supabase catalog remains authoritative for document definitions/rules until those source files are explicitly ingested.
- Last verified: 2026-10-13 UTC.
- Change log:
  - 2026-10-13 — Converged this surface onto `backend/SKANDI_CORE`, removed legacy/missing backend namespace dependency, preserved supplied HTML design/behavior, and documented the complete runtime chain.
  - 2026-10-13 — Corrected malformed CSS and connected verification to the verified compliance requirement/record schema without fabricating subjects or evidence.

## COMPLETE INTENDED HTML

```html
<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>SKANDI Transport Compliance</title>
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
  background: linear-gradient(rgba(2, 46, 100, 0.6), rgba(2, 46, 100, 0.8)), url("https://static.wixstatic.com/media/394052_c532724ec4814dd583bbf0fee6154569~mv2.png") center/cover;
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
.pagehead h1{font-size:20px;margin:0;color:var(--navy)}
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

.compliance-grid{display:grid;grid-template-columns:320px 1fr;gap:12px}.subject-list button{display:block;width:100%;border:0;border-bottom:1px solid var(--line);background:#fff;text-align:left;padding:9px}.subject-list button:hover,.subject-list button.active{background:#f2f8fb}.subject-list strong{display:block;font-size:9px;color:var(--navy)}.subject-list span{font-size:8px;color:var(--muted)}.req{border:1px solid var(--line);padding:9px;margin-bottom:7px;display:grid;grid-template-columns:1fr auto;gap:8px}.req strong{font-size:9px}.req p{margin:3px 0 0;font-size:8px;color:var(--muted)}@media(max-width:800px){.compliance-grid{grid-template-columns:1fr}}
</style></head>
<body><div class="shell"><div class="topbar"><div class="brand">SKANDI TRAVELS<br><small>U.S. TRANSPORT COMPLIANCE</small></div></div>
<main class="content">
<div class="pagehead"><div><h1>Transport compliance</h1><p>Company, driver and vehicle eligibility for SKANDI-operated transfers and tours.</p></div><div class="actions"><button class="btn" id="refreshBtn">Refresh</button><button class="btn primary" id="verifyBtn">Verify record</button></div></div>
<div class="notice warn">A document upload does not automatically make a driver, vehicle or company compliant. Evidence must be verified and valid on the service date.</div>
<div class="metrics"><div class="metric"><div class="n" id="mValid">0</div><div class="l">Valid</div></div><div class="metric"><div class="n" id="mDue">0</div><div class="l">Expiring soon</div></div><div class="metric"><div class="n" id="mMissing">0</div><div class="l">Missing</div></div><div class="metric"><div class="n" id="mBlocked">0</div><div class="l">Dispatch blocked</div></div></div>
<div class="compliance-grid">
<div class="card"><div class="cardhead"><strong>Subjects</strong></div><div class="subject-list" id="subjects"></div></div>
<div class="card"><div class="cardhead"><strong id="subjectTitle">Select a subject</strong><span id="dispatchState" class="status">—</span></div><div class="cardbody"><div id="requirements"><div class="empty">Select a company, driver or vehicle.</div></div></div></div>
</div>
</main></div>
<script>
(() => {
"use strict";
const SOURCE="SKANDI_TRANSPORT_COMPLIANCE_CONTROL",PARENT="SKANDI_WIX_PARENT";const $=id=>document.getElementById(id);let subjects=[],records=[],requirements=[],selected=null;
function post(type,payload={}){window.parent.postMessage({source:SOURCE,type,payload,timestamp:new Date().toISOString()},"*")}
function cls(s){s=String(s||"");if(["VALID","VERIFIED"].includes(s))return"ok";if(["EXPIRING","PENDING","NOT_VERIFIED"].includes(s))return"warn";return"bad"}
function renderSubjects(){$("subjects").innerHTML=subjects.map((s,i)=>`<button data-i="${i}" class="${selected===s?"active":""}"><strong>${s.name||s.id}</strong><span>${s.type} · ${s.station||""}</span></button>`).join("")||'<div class="empty">No subjects loaded.</div>'}
function renderReq(){if(!selected)return;const filtered=records.filter(r=>r.subject_type===selected.type&&r.subject_id===selected.id);$("subjectTitle").textContent=`${selected.type} · ${selected.name||selected.id}`;const items=requirements.filter(q=>!q.subjectTypes||q.subjectTypes.includes(selected.type));$("requirements").innerHTML=items.map(q=>{const rec=filtered.find(r=>r.requirement_code===q.code),st=rec?.status||"MISSING";return`<div class="req"><div><strong>${q.code} · ${q.name}</strong><p>${q.authority} · expires: ${rec?.expires_at||"—"} · ref: ${rec?.reference_number||"—"}</p></div><div><span class="status ${cls(st)}">${st}</span><br><button class="btn secondary" data-req="${q.code}" style="margin-top:5px">Open</button></div></div>`}).join("")||'<div class="empty">No requirements.</div>';const blocked=items.some(q=>{const rec=filtered.find(r=>r.requirement_code===q.code);return !rec||!["VALID","VERIFIED"].includes(rec.status)});$("dispatchState").textContent=blocked?"DISPATCH BLOCKED":"ELIGIBLE";$("dispatchState").className=`status ${blocked?"bad":"ok"}`}
$("subjects").addEventListener("click",e=>{const b=e.target.closest("[data-i]");if(!b)return;selected=subjects[Number(b.dataset.i)];renderSubjects();renderReq()});
$("requirements").addEventListener("click",e=>{const b=e.target.closest("[data-req]");if(b&&selected)post("TRANSPORT_COMPLIANCE_OPEN",{subject:selected,requirementCode:b.dataset.req})});
$("refreshBtn").addEventListener("click",()=>post("TRANSPORT_COMPLIANCE_REFRESH"));$("verifyBtn").addEventListener("click",()=>{if(!selected)return;const requirementCode=(prompt("Requirement code to verify:")||"").trim().toUpperCase();if(!requirementCode)return;const referenceNumber=(prompt("Reference / licence number (optional):")||"").trim();const expiresAt=(prompt("Expiry date YYYY-MM-DD (optional):")||"").trim();post("TRANSPORT_COMPLIANCE_VERIFY",{subject:selected,requirementCode,referenceNumber,expiresAt})});
window.addEventListener("message",e=>{let m=e.data;if(typeof m==="string"){try{m=JSON.parse(m)}catch{return}}if(!m||typeof m!=="object")return;if(m.source&&m.source!==PARENT)return;const p=m.payload||{};if(m.type==="TRANSPORT_COMPLIANCE_LOAD"){subjects=p.subjects||[];records=p.records||[];requirements=p.requirements||[];selected=subjects[0]||null;renderSubjects();renderReq();$("mValid").textContent=records.filter(x=>["VALID","VERIFIED"].includes(x.status)).length;$("mDue").textContent=records.filter(x=>x.status==="EXPIRING").length;$("mMissing").textContent=Math.max(0,requirements.length-records.length);$("mBlocked").textContent=subjects.filter(s=>s.dispatchBlocked).length}if(m.type==="TRANSPORT_COMPLIANCE_ERROR"){alert(p.message||"Compliance action failed.")}});
post("TRANSPORT_COMPLIANCE_READY");
})();
</script></body></html>
```
