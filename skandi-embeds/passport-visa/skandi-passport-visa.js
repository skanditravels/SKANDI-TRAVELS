
(()=>{"use strict";
const SOURCE="SKANDI_PASSPORT_VISA_PAGE";
const PARENT="SKANDI_WIX_PARENT";
const VERSION="V12-PASSPORT-VISA-2026.10.11";
const $=id=>document.getElementById(id);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let DATA={requirements:[],guidance:[],destinations:[]};
let destinationLimit=12;
let lastSearch=null;

function post(type,payload={}){
  window.parent.postMessage({source:SOURCE,type,payload,timestamp:new Date().toISOString()},"*");
}
function text(v){return String(v??"").trim()}
function upper(v,max=80){return text(v).toUpperCase().slice(0,max)}
function setBusy(isBusy){
  const button=$("requirementsSearch");
  button.disabled=!!isBusy;
  button.textContent=isBusy?"Checking…":"Check requirements";
}
function setStatus(message,tone=""){
  const el=$("lookupStatus");
  el.className=`lookup-status${tone?` ${tone}`:""}`;
  el.textContent=message;
}
function destinationCode(value){
  const raw=text(value);
  if(!raw)return"";
  const exact=(DATA.destinations||[]).find(x=>text(x.title).toLowerCase()===raw.toLowerCase()||text(x.code).toLowerCase()===raw.toLowerCase());
  return upper(exact?.code||raw,12);
}
function renderDatalist(){
  const seen=new Set();
  const rows=(DATA.destinations||[]).filter(x=>{
    const value=text(x.title||x.code);
    const key=`${value.toLowerCase()}|${upper(x.code,20)}`;
    if(!value||seen.has(key))return false;
    seen.add(key);
    return true;
  }).slice(0,800);
  $("destinationOptions").innerHTML=rows.map(x=>`<option value="${esc(x.title||x.code||"")}">${x.code?esc(x.code):""}</option>`).join("");
}
function destinationHaystack(x){
  return `${x.title||""} ${x.code||""} ${x.type||""} ${x.passportSummary||""} ${x.visaSummary||""} ${x.importantInformation||""}`.toLowerCase();
}
function renderDestinations(){
  const q=text($("destinationFilter").value).toLowerCase();
  const all=(DATA.destinations||[]).filter(x=>!q||destinationHaystack(x).includes(q));
  const rows=all.slice(0,destinationLimit);
  $("destinationCount").textContent=all.length?`${Math.min(rows.length,all.length)} of ${all.length}`:"";
  $("destinationResults").innerHTML=rows.length?rows.map(x=>{
    const blocks=[];
    if(x.passportSummary)blocks.push(`<div class="destination-block"><span class="destination-label">Passport</span><p>${esc(x.passportSummary)}</p></div>`);
    if(x.visaSummary)blocks.push(`<div class="destination-block"><span class="destination-label">Visa / authorization</span><p>${esc(x.visaSummary)}</p></div>`);
    if(x.importantInformation)blocks.push(`<div class="destination-block"><span class="destination-label">Important</span><p>${esc(x.importantInformation)}</p></div>`);
    return `<article class="destination-card"><div class="destination-card-head"><h3>${esc(x.title||x.code||"Destination")}</h3><div class="destination-code">${esc(x.code||x.type||"")}</div></div>${blocks.join("")||`<div class="destination-block"><p>No additional document summary is currently published for this destination.</p></div>`}</article>`;
  }).join(""):`<div class="destination-empty">${q?"No published destination guidance matches this filter.":"No destination-specific passport or visa summaries are currently published in Inventory Control."}</div>`;
  const more=$("loadMoreDestinations");
  more.hidden=rows.length>=all.length||!all.length;
}
function resetSearch(){
  ["nationality","residenceCountry","origin","destination","departureDate","returnDate"].forEach(id=>{$(id).value=""});
  lastSearch=null;
  setBusy(false);
  setStatus("Enter your nationality and destination to begin.");
  $("lookupResult").innerHTML="";
  $("nationality").focus();
}
function validateDates(){
  const departure=$("departureDate").value;
  const returning=$("returnDate").value;
  if(departure&&returning&&returning<departure){
    setStatus("Return date cannot be earlier than departure date.","warning");
    return false;
  }
  return true;
}
function search(){
  const nationality=upper($("nationality").value,3);
  const destination=destinationCode($("destination").value);
  if(!nationality||!destination){
    setStatus("Nationality and destination are required.","warning");
    (!nationality?$("nationality"):$("destination")).focus();
    return;
  }
  if(!validateDates())return;
  lastSearch={
    language:"EN",
    nationality,
    residenceCountry:upper($("residenceCountry").value,3),
    origin:upper($("origin").value,12),
    destination,
    departureDate:$("departureDate").value||"",
    returnDate:$("returnDate").value||"",
    documentType:"PASSPORT"
  };
  setBusy(true);
  setStatus("Checking the connected SKANDI travel-requirements source…");
  $("lookupResult").innerHTML="";
  post("PASSPORT_VISA_SEARCH",lastSearch);
}
function renderLookup(result={}){
  setBusy(false);
  const connected=result.connected===true;
  const summary=text(result.summary)||"Travel requirements checked.";
  setStatus(summary,connected?"success":"warning");
  const fields=(Array.isArray(result.fields)?result.fields:[]).filter(x=>x&&(x.label||x.key||x.value));
  const guidance=Array.isArray(result.guidance)?result.guidance:[];
  const notices=Array.isArray(result.notices)?result.notices:[];
  const provider=text(result.provider)||"SKANDI guidance";
  const routeParts=[lastSearch?.nationality,lastSearch?.origin,lastSearch?.destination].filter(Boolean);
  const routeLabel=routeParts.length?routeParts.join(" · "):"Trip document check";
  let html=`<div class="result-summary"><div class="result-summary-row"><div><div class="result-meta">${connected?"Connected requirement result":"Guidance result"}</div><h3>${esc(routeLabel)}</h3><p>${esc(summary)}</p></div><div class="result-source">Source: ${esc(provider)}${result.status?`<br>${esc(result.status)}`:""}</div></div></div>`;
  const cards=[];
  fields.forEach(x=>cards.push(`<article class="result-card"><div class="result-meta">${esc(x.category||x.status||"Requirement")}</div><h4>${esc(x.label||x.key||"Requirement")}</h4><p>${esc(x.value||"")}</p></article>`));
  guidance.forEach(x=>cards.push(`<article class="result-card"><div class="result-meta">SKANDI guidance</div><h4>${esc(x.title||"Travel requirement")}</h4><p>${esc(x.body||"")}</p></article>`));
  if(notices.length)cards.push(`<article class="result-card"><div class="result-meta">Important</div><h4>Notices</h4><ul class="result-list">${notices.map(n=>`<li>${esc(n)}</li>`).join("")}</ul></article>`);
  if(result.officialSourcesRequired)cards.push(`<article class="result-card authority-card"><div class="result-meta">Final authority</div><h4>Verify before travel</h4><p>Confirm the final requirements with official government, border-control and visa-authority sources. The operating carrier may also perform its own document validation before boarding.</p></article>`);
  html+=cards.length?`<div class="result-grid">${cards.join("")}</div>`:`<article class="result-card authority-card"><div class="result-meta">No detailed fields returned</div><h4>Official verification required</h4><p>No detailed requirement fields were returned for this search. Do not interpret that as confirmation that no visa, authorization or document condition applies.</p></article>`;
  $("lookupResult").innerHTML=html;
  $("lookupResult").focus({preventScroll:true});
}

$("requirementsSearch").addEventListener("click",search);
$("resetSearch").addEventListener("click",resetSearch);
["nationality","destination"].forEach(id=>$(id).addEventListener("keydown",event=>{if(event.key==="Enter")search()}));
$("backToTravelInfo").addEventListener("click",()=>post("PASSPORT_VISA_NAVIGATE",{path:"/travel-info"}));
$("officialHelp").addEventListener("click",()=>post("PASSPORT_VISA_NAVIGATE",{path:"/travel-info"}));
$("destinationFilter").addEventListener("input",()=>{destinationLimit=12;renderDestinations()});
$("loadMoreDestinations").addEventListener("click",()=>{destinationLimit+=12;renderDestinations()});

window.addEventListener("message",event=>{
  let message=event.data;
  if(typeof message==="string"){try{message=JSON.parse(message)}catch(_){return}}
  if(!message||message.source!==PARENT)return;
  if(message.type==="PASSPORT_VISA_HOST_READY"){
    post("PASSPORT_VISA_READY",{language:"EN",version:VERSION});
    return;
  }
  if(message.type==="PASSPORT_VISA_LOADING"){
    setStatus("Loading SKANDI destination guidance…");
    return;
  }
  if(message.type==="PASSPORT_VISA_DATA"){
    DATA=message.payload&&typeof message.payload==="object"?message.payload:DATA;
    renderDatalist();
    renderDestinations();
    setStatus("Enter your nationality and destination to begin.");
    return;
  }
  if(message.type==="PASSPORT_VISA_SEARCHING"){
    setBusy(true);
    setStatus("Checking the connected SKANDI travel-requirements source…");
    return;
  }
  if(message.type==="PASSPORT_VISA_SEARCH_RESULT"){
    renderLookup(message.payload||{});
    return;
  }
  if(message.type==="PASSPORT_VISA_SEARCH_ERROR"){
    setBusy(false);
    setStatus(message.payload?.message||"Travel requirements search is unavailable.","warning");
    return;
  }
  if(message.type==="PASSPORT_VISA_ERROR"){
    setBusy(false);
    setStatus(message.payload?.message||"Passport and visa guidance is unavailable.","warning");
  }
});

post("PASSPORT_VISA_READY",{language:"EN",version:VERSION});
})();
