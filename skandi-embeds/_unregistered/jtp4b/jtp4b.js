
(() => {
"use strict";
const SOURCE="SKANDI_CUSTOMER_DOCUMENT_CENTER",PARENT="SKANDI_WIX_PARENT"; const $=id=>document.getElementById(id);
let bookingId="",docs=[];
function post(type,payload={}){window.parent.postMessage({source:SOURCE,type,payload,timestamp:new Date().toISOString()},"*")}
function statusClass(s){s=String(s||"").toUpperCase();if(["ISSUED","SENT","ACKNOWLEDGED","READY"].includes(s))return"ok";if(["WAITING_FOR_DATA","WAITING_FOR_SIGNATURE","WAITING_FOR_APPROVAL","REQUIRED"].includes(s))return"warn";if(["CANCELLED","REJECTED"].includes(s))return"bad";return""}
function friendlyStatus(s){return String(s||"DRAFT").replaceAll("_"," ")}
function groupFor(doc){const s=String(doc.status||"").toUpperCase();if(["WAITING_FOR_DATA","WAITING_FOR_SIGNATURE","WAITING_FOR_APPROVAL","REQUIRED"].includes(s))return"Action required";if(["ISSUED","SENT","ACKNOWLEDGED"].includes(s))return"Issued documents";if(String(doc.document_code||"").startsWith("F")||String(doc.document_code||"").startsWith("P10"))return"Travel changes";return"Upcoming / preparing"}
function render(){
 const root=$("documents");root.innerHTML="";
 const groups={"Action required":[],"Upcoming / preparing":[],"Issued documents":[],"Travel changes":[]};
 docs.forEach(d=>(groups[groupFor(d)]||groups["Upcoming / preparing"]).push(d));
 $("mAction").textContent=groups["Action required"].length;$("mReady").textContent=groups["Upcoming / preparing"].filter(d=>["READY","DRAFT"].includes(String(d.status).toUpperCase())).length;$("mIssued").textContent=groups["Issued documents"].length;$("mChanges").textContent=groups["Travel changes"].length;
 Object.entries(groups).forEach(([name,rows])=>{if(!rows.length)return;const h=document.createElement("div");h.className="sectiontitle";h.textContent=name;root.appendChild(h);rows.forEach(doc=>{const item=document.createElement("div");item.className="docitem";item.innerHTML=`<div class="docicon">${String(doc.document_code||"DOC").slice(0,3)}</div><div><h3>${doc.definition_name||doc.document_code||"Document"}</h3><p>${doc.document_number||"Preparing"} · ${friendlyStatus(doc.status)}</p></div><div class="docactions"><button class="btn secondary" data-open="${doc.id}">Open</button>${["WAITING_FOR_SIGNATURE","WAITING_FOR_DATA","REQUIRED"].includes(String(doc.status).toUpperCase())?`<button class="btn primary" data-action="${doc.id}">Complete</button>`:""}</div>`;root.appendChild(item)})});
 if(!docs.length)root.innerHTML='<div class="empty">No travel documents have been created for this booking yet.</div>';
}
const rootClick=e=>{const open=e.target.closest("[data-open]"),action=e.target.closest("[data-action]");if(open)post("CUSTOMER_DOCUMENT_OPEN",{documentId:open.dataset.open});if(action)post("CUSTOMER_DOCUMENT_COMPLETE",{documentId:action.dataset.action})};
$("documents").addEventListener("click",rootClick);$("refreshBtn").addEventListener("click",()=>post("CUSTOMER_DOCUMENT_REFRESH",{bookingId}));$("closeBtn").addEventListener("click",()=>post("CUSTOMER_DOCUMENT_CLOSE"));
window.addEventListener("message",e=>{let m=e.data;if(typeof m==="string"){try{m=JSON.parse(m)}catch{return}}if(!m||typeof m!=="object")return;if(m.source&&m.source!==PARENT)return;const p=m.payload||{};if(m.type==="CUSTOMER_DOCUMENTS_LOAD"){bookingId=String(p.bookingId||"");$("bookingBadge").textContent=bookingId||"BOOKING";docs=Array.isArray(p.documents)?p.documents:[];render()}if(m.type==="CUSTOMER_DOCUMENTS_ERROR"){document.getElementById("documents").innerHTML=`<div class="notice bad">${String(p.message||"Travel documents are unavailable.")}</div>`}});
post("CUSTOMER_DOCUMENT_CENTER_READY");
})();
