
(()=>{
"use strict";

const SOURCE="SKANDI_LEGAL_HUB";
const PARENT="SKANDI_WIX_PARENT";
const PARENT_ORIGIN=(()=>{
  try{return document.referrer?new URL(document.referrer).origin:"*"}
  catch(_){return"*"}
})();

const $=id=>document.getElementById(id);

let data={
  directPages:[],
  policies:[],
  settings:{}
};
let loaded=false;
let bridgeSettled=false;
let bridgeRetries=0;
let bridgeRetryTimer=null;
function requestInitialHub(){
  if(bridgeSettled||bridgeRetries>=5)return;
  bridgeRetries++;
  post("LEGAL_HUB_READY",{});
  bridgeRetryTimer=setTimeout(requestInitialHub,1800);
}
function settleInitialHub(){
  bridgeSettled=true;
  if(bridgeRetryTimer){clearTimeout(bridgeRetryTimer);bridgeRetryTimer=null;}
}

function post(type,payload={}){
  window.parent.postMessage({
    source:SOURCE,
    type,
    payload,
    timestamp:new Date().toISOString()
  },PARENT_ORIGIN);
}

function esc(value){
  return String(value??"").replace(/[&<>'"]/g,c=>({
    "&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"
  }[c]));
}

function safePath(value){
  const path=String(value||"").trim();
  return path.startsWith("/")&&!path.startsWith("//")?path:"";
}

function formatDate(value){
  if(!value)return"";
  const raw=String(value).slice(0,10);
  const date=new Date(`${raw}T12:00:00Z`);
  return Number.isNaN(date.getTime())
    ?""
    :date.toLocaleDateString(undefined,{
      year:"numeric",
      month:"short",
      day:"numeric",
      timeZone:"UTC"
    });
}

function isPublishedExternal(policy={}){
  return String(policy.scope||"external").toLowerCase()==="external" &&
    String(policy.status||"Published").toLowerCase()==="published" &&
    policy.active!==false;
}

function searchableText(policy={}){
  return[
    policy.title,
    policy.documentId,
    policy.category,
    policy.summary,
    policy.version,
    policy.slug,
    policy.publicType
  ].join(" ").toLowerCase();
}

function visiblePolicies(){
  const query=($("search").value||"").toLowerCase().trim();
  return(data.policies||[])
    .filter(isPublishedExternal)
    .filter(policy=>!query||searchableText(policy).includes(query));
}

function visibleDirectPages(){
  return(data.directPages||[]).filter(isPublishedExternal);
}

function iconMarkup(type){
  const key=String(type||"").toLowerCase();
  if(key==="privacy"){
    return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10V8a5 5 0 0 1 10 0v2"/><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M12 14v2"/></svg>`;
  }
  if(key==="cookies"){
    return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 13.5A7.5 7.5 0 1 1 10.5 4a4 4 0 0 0 5 5 4 4 0 0 0 4.5 4.5Z"/><path d="M8 12h.01M11 16h.01M15 13h.01"/></svg>`;
  }
  if(key==="accessibility"){
    return `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="4.5" r="2"/><path d="M5 8.5c4-1.2 10-1.2 14 0M12 8.5v11M8.5 12l3.5 2 3.5-2M8 20l4-6 4 6"/></svg>`;
  }
  if(key==="bookingterms"){
    return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 13h18M7 9l5-5 5 5M8 13v6M16 13v6M5 20h14"/></svg>`;
  }
  if(key==="terms"){
    return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h8l3 3v15H7z"/><path d="M15 3v4h4M10 11h5M10 15h5"/></svg>`;
  }
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h9l3 3v15H6z"/><path d="M9 11h6M9 15h6"/></svg>`;
}

function routeFor(policy={}){
  return safePath(policy.route||policy.url) ||
    (policy.slug?`/about/legal/policies?slug=${encodeURIComponent(policy.slug)}`:"/about/legal/policies");
}

function navigatePolicy(policy={}){
  const path=routeFor(policy);
  if(path)post("LEGAL_NAVIGATE",{path});
}

function cardMarkup(policy,index){
  const version=policy.version?`Version ${esc(policy.version)}`:"";
  const effective=policy.effectiveDate?`Effective ${esc(formatDate(policy.effectiveDate))}`:"";
  const meta=[version,effective].filter(Boolean).join(" · ");

  return `<button class="card" type="button" data-direct-index="${index}">
    <div class="icon">${iconMarkup(policy.publicType)}</div>
    <h3>${esc(policy.title||"Legal document")}</h3>
    <p>${esc(policy.summary||"Read the current published SKANDI legal document.")}</p>
    <div class="card-action">
      <span>${esc(meta||policy.category||"Legal")}</span>
      <span>Open →</span>
    </div>
  </button>`;
}

function rowMarkup(policy,index){
  const meta=[
    policy.category||"Legal",
    policy.version?`Version ${policy.version}`:"",
    policy.effectiveDate?`Effective ${formatDate(policy.effectiveDate)}`:""
  ].filter(Boolean).join(" · ");

  return `<article class="row">
    <div class="row-main">
      <h3>${esc(policy.title||"Legal document")}</h3>
      ${policy.summary?`<p class="copy">${esc(policy.summary)}</p>`:""}
      <div class="meta">${esc(meta)}</div>
    </div>
    <div class="row-actions">
      <button class="btn secondary" type="button" data-policy-index="${index}">Open</button>
    </div>
  </article>`;
}

function render(){
  const settings=data.settings||{};
  if(settings.title)$("heroTitle").textContent=settings.title;
  if(settings.subtitle)$("heroSubtitle").textContent=settings.subtitle;

  if(!loaded){
    requestHeight();
    return;
  }

  const direct=visibleDirectPages();
  $("directGrid").innerHTML=direct.length
    ?direct.map(cardMarkup).join("")
    :`<div class="empty">No featured legal documents are currently available.</div>`;

  const rows=visiblePolicies();
  $("count").textContent=`${rows.length} document${rows.length===1?"":"s"}`;

  $("policyList").innerHTML=rows.length
    ?rows.map(rowMarkup).join("")
    :`<div class="empty">No matching public policies found.</div>`;

  $("statusNote").textContent=data.generatedAt
    ?`Published legal library loaded from SKANDI Policy Control.`
    :"";

  $("directGrid").dataset.visibleIds=JSON.stringify(direct.map(item=>item.policyId||item.slug||item.documentId||""));
  $("policyList").dataset.visibleIds=JSON.stringify(rows.map(item=>item.policyId||item.slug||item.documentId||""));

  requestHeight();
}

function policyByVisibleId(kind,index){
  const host=kind==="direct"?$("directGrid"):$("policyList");
  let ids=[];
  try{ids=JSON.parse(host.dataset.visibleIds||"[]")}catch(_){}
  const id=ids[index];
  const pool=kind==="direct"?visibleDirectPages():visiblePolicies();
  return pool.find(item=>(item.policyId||item.slug||item.documentId||"")===id)||pool[index]||null;
}

function showLoadError(message){
  loaded=true;
  $("directGrid").innerHTML=`<div class="empty error">${esc(message||"Legal information is temporarily unavailable.")}</div>`;
  $("policyList").innerHTML=`<div class="empty error">Published Policy Control data could not be loaded.</div>`;
  $("count").textContent="";
  $("statusNote").textContent="";
  requestHeight();
}

let heightTimer=0;
function requestHeight(){
  clearTimeout(heightTimer);
  heightTimer=setTimeout(()=>{
    post("LEGAL_HUB_HEIGHT",{
      height:Math.ceil(document.documentElement.scrollHeight)
    });
  },50);
}

$("search").addEventListener("input",render);
$("searchBtn").addEventListener("click",render);
$("search").addEventListener("keydown",event=>{
  if(event.key==="Enter"){
    event.preventDefault();
    render();
  }
});

$("directGrid").addEventListener("click",event=>{
  const button=event.target.closest("[data-direct-index]");
  if(!button)return;
  const policy=policyByVisibleId("direct",Number(button.dataset.directIndex));
  if(policy)navigatePolicy(policy);
});

$("policyList").addEventListener("click",event=>{
  const button=event.target.closest("[data-policy-index]");
  if(!button)return;
  const policy=policyByVisibleId("policy",Number(button.dataset.policyIndex));
  if(policy)navigatePolicy(policy);
});

window.addEventListener("message",event=>{
  let message=event.data;
  if(typeof message==="string"){
    try{message=JSON.parse(message)}catch(_){return}
  }
  if(!message||typeof message!=="object")return;
  if(message.source&&message.source!==PARENT)return;

  if(message.type==="LEGAL_HUB_PARENT_READY"){
    if(!bridgeSettled)post("LEGAL_HUB_READY",{});
    return;
  }

  if(message.type==="LEGAL_HUB_DATA"){
    settleInitialHub();
    const payload=message.payload||{};
    data={
      directPages:Array.isArray(payload.directPages)?payload.directPages:[],
      policies:Array.isArray(payload.policies)?payload.policies:[],
      settings:payload.settings&&typeof payload.settings==="object"?payload.settings:{},
      generatedAt:payload.generatedAt||""
    };
    loaded=true;
    render();
    return;
  }

  if(message.type==="LEGAL_HUB_ERROR"||message.type==="LEGAL_ERROR"){
    settleInitialHub();
    showLoadError(message.payload?.message);
  }
});

if("ResizeObserver"in window){
  new ResizeObserver(requestHeight).observe(document.body);
}else{
  window.addEventListener("resize",requestHeight);
}

requestInitialHub();
requestHeight();
})();
