
(()=>{
"use strict";

const SOURCE="SKANDI_SUPPORT_PUBLIC";
const PARENT="SKANDI_WIX_PARENT";
const PARENT_ORIGIN=(()=>{
  try{return document.referrer?new URL(document.referrer).origin:"*"}
  catch(_){return"*"}
})();

const FALLBACK_WORKFLOWS=[
  {key:"general",title:"General Support",summary:"General questions that do not fit another category.",topics:[
    {key:"general-question",title:"General Question"},{key:"feedback",title:"Feedback"},{key:"other",title:"Other"}
  ],requiredFields:["subject","message"]},
  {key:"booking",title:"Booking Help",summary:"Existing SKANDI bookings, changes and booking questions.",topics:[
    {key:"manage-booking",title:"Manage My Booking"},{key:"booking-document",title:"Booking Document"},{key:"booking-other",title:"Other Booking Question"}
  ],requiredFields:["subject","message"]},
  {key:"flight",title:"Flights",summary:"Flight changes, disruptions, connections and airline issues.",topics:[
    {key:"schedule-change",title:"Schedule Change / Cancellation"},{key:"name-correction",title:"Name Correction"},{key:"missed-connection",title:"Missed Connection"},{key:"upgrade-inquiry",title:"Upgrade Inquiry"}
  ],requiredFields:["flightAirline","flightNumber","depAirport","arrAirport","subject","message"]},
  {key:"baggage",title:"Baggage",summary:"Delayed, damaged or missing baggage and property.",topics:[
    {key:"delayed-baggage",title:"Delayed Baggage"},{key:"damaged-baggage",title:"Damaged Baggage"},{key:"lost-items-on-board",title:"Lost Items on Board"}
  ],requiredFields:["bagType","bagColor","bagBrand","subject","message"]},
  {key:"hotel",title:"Hotel & Destination",summary:"Hotel, room, destination and in-resort support.",topics:[
    {key:"room-modification",title:"Room Modification"},{key:"check-in-issue",title:"Check-in Issue"},{key:"quality-complaint",title:"Quality Complaint"}
  ],requiredFields:["subject","message"]},
  {key:"refund",title:"Refunds & Compensation",summary:"Refund, compensation and duplicate-charge requests.",topics:[
    {key:"flight-delay-compensation",title:"Flight Delay / Compensation"},{key:"cancelled-trip-refund",title:"Cancelled Trip Refund"},{key:"duplicate-charge",title:"Duplicate Charge"}
  ],requiredFields:["subject","message"]},
  {key:"documents",title:"Travel Documents",summary:"Booking confirmations, tickets, vouchers and travel documents.",topics:[
    {key:"missing-document",title:"Missing Travel Document"},{key:"incorrect-document",title:"Incorrect Travel Document"},{key:"document-question",title:"Document Question"}
  ],requiredFields:["subject","message"]},
  {key:"payment",title:"Payment",summary:"Payment, receipts and billing questions.",topics:[
    {key:"payment-failed",title:"Payment Failed"},{key:"receipt-invoice",title:"Receipt / Invoice"},{key:"payment-other",title:"Other Payment Question"}
  ],requiredFields:["subject","message"]},
  {key:"club",title:"SKANDI Club",summary:"Membership, points, tier and account questions.",topics:[
    {key:"points",title:"Points"},{key:"tier",title:"Membership Tier"},{key:"club-account",title:"Club Account"}
  ],requiredFields:["subject","message"]},
  {key:"tech",title:"Technical & Account",summary:"Website, app, account and sign-in issues.",topics:[
    {key:"account-access",title:"Cannot access account"},{key:"booking-error",title:"Error during booking"},{key:"other-website-issue",title:"Other website issue"}
  ],requiredFields:["subject","message"]}
];

const FIELD_MAP={
  subject:"caseSubject",
  message:"caseDescription",
  flightAirline:"flightAirline",
  flightNumber:"flightNumber",
  depAirport:"depAirport",
  arrAirport:"arrAirport",
  bagTag:"bagTag",
  bagType:"bagType",
  bagColor:"bagColor",
  bagBrand:"bagBrand",
  hasPir:"hasPir",
  pirNumber:"pirNumber"
};

let bootstrap={};
let workflows=FALLBACK_WORKFLOWS;
let articles=[];
let supportLoggedIn=false;
let selectedFiles=[];

const $=id=>document.getElementById(id);
const val=id=>($(id)?.value||"").trim();
const esc=value=>String(value??"").replace(/[&<>'"]/g,c=>({
  "&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"
}[c]));

function requestId(){
  if(window.crypto?.randomUUID)return window.crypto.randomUUID();
  return `req-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
}

function post(type,payload={}){
  window.parent.postMessage({
    source:SOURCE,
    type,
    requestId:requestId(),
    payload,
    timestamp:new Date().toISOString()
  },PARENT_ORIGIN);
}

function setStatus(message,mode=""){
  const node=$("status");
  if(!node)return;
  node.textContent=message||"";
  node.className=message?`status show ${mode}`:"status";
}

function setRequired(ids,required){
  ids.forEach(id=>{
    const el=$(id);
    if(!el)return;
    if(required)el.setAttribute("required","true");
    else el.removeAttribute("required");
  });
}

function currentWorkflow(){
  return workflows.find(item=>String(item.key)===val("caseCategory"))||null;
}

function renderWorkflowOptions(){
  const select=$("caseCategory");
  const previous=select.value;
  select.innerHTML='<option value="">Select Category</option>';
  workflows.forEach(item=>{
    const option=document.createElement("option");
    option.value=String(item.key||"");
    option.textContent=String(item.title||item.key||"Support");
    select.appendChild(option);
  });
  if(workflows.some(item=>String(item.key)===previous))select.value=previous;
}

function renderTopicOptions(preferred=""){
  const select=$("caseSubCategory");
  const workflow=currentWorkflow();
  select.innerHTML='<option value="">Select Specific Topic</option>';
  (Array.isArray(workflow?.topics)?workflow.topics:[]).forEach(topic=>{
    const option=document.createElement("option");
    option.value=String(topic.key||topic.value||topic.title||"");
    option.textContent=String(topic.title||topic.label||topic.key||"Topic");
    select.appendChild(option);
  });
  if(preferred && [...select.options].some(o=>o.value===preferred))select.value=preferred;
}

function applyWorkflowRequirements(){
  Object.values(FIELD_MAP).forEach(id=>setRequired([id],false));
  setRequired(["caseSubject","caseDescription"],true);

  const workflow=currentWorkflow();
  const required=Array.isArray(workflow?.requiredFields)?workflow.requiredFields:[];
  required.forEach(field=>{
    const id=FIELD_MAP[field];
    if(id)setRequired([id],true);
  });

  const isFlight=val("caseCategory")==="flight";
  const isBaggage=val("caseCategory")==="baggage";

  $("flightDetailsModule").classList.toggle("active",isFlight);
  $("baggageDetailsModule").classList.toggle("active",isBaggage);

  if(!isFlight)setRequired(["flightAirline","flightNumber","depAirport","arrAirport"],false);
  if(!isBaggage)setRequired(["hasPir","pirNumber","bagTag","bagType","bagColor","bagBrand"],false);

  if(isBaggage){
    setRequired(["hasPir"],true);
    updatePirRequirement();
  }else{
    $("pirNumberWrap").style.display="none";
    $("pirGuidance").className="status";
    $("pirGuidance").textContent="";
  }
}

function toggleBookingFields(){
  const show=val("hasBooking")==="yes";
  $("bookingFields").classList.toggle("active",show);
  setRequired(["pnrField","dateField","destDropdown"],show);
}

function updatePirRequirement(){
  const baggage=val("caseCategory")==="baggage";
  const selection=val("hasPir");
  const show=baggage&&selection==="yes";
  $("pirNumberWrap").style.display=show?"block":"none";
  setRequired(["pirNumber"],show);

  const guidance=$("pirGuidance");
  if(baggage&&selection==="no"){
    const workflow=currentWorkflow();
    const message=
      workflow?.guidance?.noPir ||
      "A SKANDI support case does not replace the formal baggage report/PIR required by the operating airline or airport baggage service. Please report delayed or damaged checked baggage to the operating carrier or baggage service as soon as possible.";
    guidance.textContent=message;
    guidance.className="status show";
  }else{
    guidance.textContent="";
    guidance.className="status";
  }
}

function handleCategoryChange(preferredTopic=""){
  renderTopicOptions(preferredTopic);
  applyWorkflowRequirements();
}

function articlePath(article={}){
  const path=String(article.path||article.url||"").trim();
  return path.startsWith("/")&&!path.startsWith("//")?path:"";
}

function articleHaystack(article={}){
  return[
    article.title,article.summary,article.excerpt,article.category,article.keywords
  ].join(" ").toLowerCase();
}

function openHelpItem(item={}){
  const path=articlePath(item);
  if(path){
    post("PUBLIC_SUPPORT_NAVIGATE",{path});
    return;
  }

  const category=String(item.category||"").trim().toLowerCase();
  if(category&&workflows.some(w=>String(w.key).toLowerCase()===category)){
    $("caseCategory").value=category;
    handleCategoryChange();
  }
  document.getElementById("requestDetailsSection")?.scrollIntoView({behavior:"smooth",block:"start"});
}

function renderPopularTopics(){
  const list=$("faqList");
  const popular=(articles||[]).slice(0,5);

  if(popular.length){
    list.innerHTML=popular.map((item,index)=>`
      <li><button class="faq-link" type="button" data-article-index="${index}">
        ${esc(item.title||"Help article")}
      </button></li>
    `).join("");
    return;
  }

  const fallback=workflows.slice(0,5);
  list.innerHTML=fallback.map(item=>`
    <li><button class="faq-link" type="button" data-workflow-key="${esc(item.key)}">
      ${esc(item.title)}
    </button></li>
  `).join("");
}

function runSearch(){
  const query=val("helpSearch").toLowerCase();
  const wrap=$("helpSearchResults");

  if(!query){
    wrap.classList.add("hidden");
    wrap.innerHTML="";
    return;
  }

  const matches=(articles||[])
    .filter(item=>articleHaystack(item).includes(query))
    .slice(0,8);

  if(!matches.length){
    const workflowMatches=workflows
      .filter(item=>`${item.title} ${item.summary} ${(item.topics||[]).map(t=>t.title).join(" ")}`.toLowerCase().includes(query))
      .slice(0,6);

    wrap.innerHTML=`<div class="search-results-card">${
      workflowMatches.length
        ? workflowMatches.map(item=>`
            <button class="search-result" type="button" data-search-workflow="${esc(item.key)}">
              <strong>${esc(item.title)}</strong>
              <span>${esc(item.summary||"Open the support form with this category selected.")}</span>
            </button>`).join("")
        : `<div class="search-result" style="cursor:default"><strong>No matching help article</strong><span>You can still submit a request below.</span></div>`
    }</div>`;
  }else{
    wrap.innerHTML=`<div class="search-results-card">${
      matches.map((item,index)=>`
        <button class="search-result" type="button" data-search-article="${index}">
          <strong>${esc(item.title||"Help article")}</strong>
          <span>${esc(item.summary||item.excerpt||item.category||"")}</span>
        </button>
      `).join("")
    }</div>`;
    wrap.dataset.searchIds=JSON.stringify(matches.map(item=>articles.indexOf(item)));
  }

  wrap.classList.remove("hidden");
}

function applyProfile(payload={}){
  const profile=payload.profile||null;
  const notice=$("memberLinkedNotice");
  const linked=Boolean(profile&&profile.loggedIn!==false&&(profile.memberId||profile.email));

  if(!linked){
    if(notice)notice.style.display="none";
    ["firstName","lastName","email"].forEach(id=>{
      const field=$(id);
      if(!field)return;
      field.readOnly=false;
      field.removeAttribute("aria-readonly");
      field.title="";
    });
    return;
  }

  const firstName=profile.firstName||profile.first_name||"";
  const lastName=profile.lastName||profile.last_name||"";
  const email=profile.email||"";
  const phone=profile.phone||"";

  if($("firstName"))$("firstName").value=firstName;
  if($("lastName"))$("lastName").value=lastName;
  if($("email"))$("email").value=email;
  if($("phone")&&phone)$("phone").value=phone.replace(/^\+\d+\s*/,"");

  ["firstName","lastName","email"].forEach(id=>{
    const field=$(id);
    if(!field)return;
    field.readOnly=true;
    field.setAttribute("aria-readonly","true");
    field.title="Linked to your signed-in SKANDI profile";
  });

  if(notice){
    notice.textContent=`Signed in as ${[firstName,lastName].filter(Boolean).join(" ")||email}. This request will be linked to your SKANDI profile and appear in SKANDI Support Center.`;
    notice.style.display="block";
  }
}

function updateSupportChannels(payload={}){
  const loggedIn=Boolean(payload.loggedIn||payload.profile?.loggedIn||payload.profile?.memberId);
  supportLoggedIn=loggedIn;
  const human=$("humanSupportBtn");
  const hint=$("humanSupportHint");
  if(human){
    human.dataset.loggedIn=loggedIn?"true":"false";
    human.textContent=loggedIn
      ?"Chat with a Human SKANDI Customer Service Agent"
      :"Sign in for live human chat";
  }
  if(hint){
    const status=String(payload.humanSupport?.status||"");
    hint.textContent=!loggedIn
      ?"Sign in to use live human chat."
      :status==="online"
        ?"Human Customer Service is currently available."
        :"You can still request a human. If no agent is immediately available, your case will remain in the Support queue.";
  }
}

function applyPrefill(prefill={}){
  const category=String(prefill.category||"").trim();
  const topic=String(prefill.subCategory||"").trim();
  if(category&&workflows.some(item=>String(item.key)===category)){
    $("caseCategory").value=category;
    handleCategoryChange(topic);
  }
}

function applyBootstrap(payload={}){
  bootstrap=payload&&typeof payload==="object"?payload:{};

  const supplied=Array.isArray(bootstrap.workflows)?bootstrap.workflows.filter(Boolean):[];
  workflows=supplied.length?supplied:FALLBACK_WORKFLOWS;
  articles=Array.isArray(bootstrap.articles)?bootstrap.articles.filter(Boolean):[];

  renderWorkflowOptions();
  renderPopularTopics();
  applyProfile(bootstrap);
  updateSupportChannels(bootstrap);
  applyPrefill(bootstrap.prefill||{});
}

function selectedFileSummary(){
  if(!selectedFiles.length)return"No files selected.";
  return selectedFiles.map(file=>file.name).join(", ");
}

function validateFiles(files){
  const selected=Array.from(files||[]).slice(0,3);
  const total=selected.reduce((sum,file)=>sum+Number(file.size||0),0);
  const allowed=selected.every(file=>
    ["application/pdf","image/jpeg","image/png"].includes(String(file.type||"").toLowerCase()) ||
    /\.(pdf|jpe?g|png)$/i.test(file.name||"")
  );
  if(!allowed){
    setStatus("Only PDF, JPG and PNG files are accepted.","error");
    return null;
  }
  if(total>10*1024*1024){
    setStatus("Supporting files must be 10 MB or less in total.","error");
    return null;
  }
  if((files||[]).length>3){
    setStatus("Only the first 3 supporting files will be included.","");
  }
  return selected;
}

function updateFiles(files){
  const valid=validateFiles(files);
  if(!valid)return;
  selectedFiles=valid;
  $("fileSummary").textContent=selectedFileSummary();
}

$("hasBooking").addEventListener("change",toggleBookingFields);
$("caseCategory").addEventListener("change",()=>handleCategoryChange());
$("hasPir").addEventListener("change",updatePirRequirement);

$("helpSearchBtn").addEventListener("click",runSearch);
$("helpSearch").addEventListener("keydown",event=>{
  if(event.key==="Enter"){
    event.preventDefault();
    runSearch();
  }
});

$("faqList").addEventListener("click",event=>{
  const articleButton=event.target.closest("[data-article-index]");
  if(articleButton){
    openHelpItem(articles[Number(articleButton.dataset.articleIndex)]||{});
    return;
  }
  const workflowButton=event.target.closest("[data-workflow-key]");
  if(workflowButton){
    $("caseCategory").value=workflowButton.dataset.workflowKey||"";
    handleCategoryChange();
    document.getElementById("requestDetailsSection")?.scrollIntoView({behavior:"smooth",block:"start"});
  }
});

$("helpSearchResults").addEventListener("click",event=>{
  const articleButton=event.target.closest("[data-search-article]");
  if(articleButton){
    let ids=[];
    try{ids=JSON.parse($("helpSearchResults").dataset.searchIds||"[]")}catch(_){}
    const sourceIndex=ids[Number(articleButton.dataset.searchArticle)];
    openHelpItem(articles[sourceIndex]||{});
    return;
  }
  const workflowButton=event.target.closest("[data-search-workflow]");
  if(workflowButton){
    $("caseCategory").value=workflowButton.dataset.searchWorkflow||"";
    handleCategoryChange();
    $("helpSearchResults").classList.add("hidden");
    document.getElementById("requestDetailsSection")?.scrollIntoView({behavior:"smooth",block:"start"});
  }
});

document.querySelectorAll("[data-support-nav]").forEach(link=>{
  link.addEventListener("click",event=>{
    event.preventDefault();
    post("PUBLIC_SUPPORT_NAVIGATE",{path:link.dataset.supportNav||link.getAttribute("href")||""});
  });
});

$("alexandraChatBtn").addEventListener("click",()=>post("PUBLIC_SUPPORT_OPEN_ALEXANDRA",{}));
$("humanSupportBtn").addEventListener("click",()=>{
  if($("humanSupportBtn").dataset.loggedIn!=="true"){
    post("PUBLIC_SUPPORT_LOGIN",{reason:"HUMAN_SUPPORT"});
    return;
  }
  post("PUBLIC_SUPPORT_REQUEST_HUMAN",{
    reason:"Customer requested a Human SKANDI Customer Service Agent from the Help Center."
  });
});
$("mySupportCasesBtn").addEventListener("click",()=>{
  if(!supportLoggedIn){
    post("PUBLIC_SUPPORT_LOGIN",{reason:"MY_SUPPORT_CASES"});
    return;
  }
  post("PUBLIC_SUPPORT_NAVIGATE",{path:"/my-profile?section=support&view=cases"});
});
$("clubLoginBtn").addEventListener("click",()=>post("PUBLIC_SUPPORT_LOGIN",{reason:"SKANDI_CLUB_SUPPORT"}));

$("fileBrowseBtn").addEventListener("click",()=>$("fileInput").click());
$("fileInput").addEventListener("change",()=>updateFiles($("fileInput").files));

const drop=$("fileDrop");
["dragenter","dragover"].forEach(type=>drop.addEventListener(type,event=>{
  event.preventDefault();
  drop.classList.add("dragover");
}));
["dragleave","drop"].forEach(type=>drop.addEventListener(type,event=>{
  event.preventDefault();
  drop.classList.remove("dragover");
}));
drop.addEventListener("drop",event=>{
  const files=event.dataTransfer?.files;
  if(files)updateFiles(files);
});

$("publicSupportForm").addEventListener("submit",event=>{
  event.preventDefault();

  if(!$("publicSupportForm").checkValidity()){
    $("publicSupportForm").reportValidity();
    return;
  }

  $("submitBtn").disabled=true;
  setStatus("Submitting your request…");

  const firstName=val("firstName");
  const lastName=val("lastName");

  post("PUBLIC_SUPPORT_CREATE_CASE",{
    firstName,
    lastName,
    fullName:`${firstName} ${lastName}`.trim(),
    email:val("email"),
    phone:`${val("phonePrefix")} ${val("phone")}`.trim(),
    nationality:val("nationality"),
    countryOfResidence:val("countryOfResidence"),
    hasBooking:val("hasBooking"),
    bookingRef:val("pnrField"),
    supplier:val("supplierField"),
    travelDate:val("dateField"),
    destination:val("destDropdown"),
    category:val("caseCategory"),
    subCategory:val("caseSubCategory"),
    subject:val("caseSubject"),
    message:val("caseDescription"),
    flightAirline:val("flightAirline"),
    flightNumber:val("flightNumber"),
    depAirport:val("depAirport"),
    arrAirport:val("arrAirport"),
    hasPir:val("hasPir"),
    pirNumber:val("pirNumber"),
    bagTag:val("bagTag"),
    bagType:val("bagType"),
    bagColor:val("bagColor"),
    bagBrand:val("bagBrand"),
    bagAddress:val("bagAddress"),
    attachedFileNames:selectedFiles.map(file=>file.name),
    source:"help-center",
    sourceChannel:"HELP_CENTER",
    sourcePage:"/about/support"
  });
});

window.addEventListener("message",event=>{
  let msg=event.data;
  if(typeof msg==="string"){
    try{msg=JSON.parse(msg)}catch(_){return}
  }
  if(!msg||typeof msg!=="object")return;
  if(msg.source!==PARENT)return;

  if(msg.type==="PUBLIC_SUPPORT_BOOTSTRAP"){
    applyBootstrap(msg.payload||{});
    return;
  }

  if(msg.type==="PUBLIC_SUPPORT_CASE_CREATED"){
    const ref=msg.payload?.caseRef||msg.payload?.caseId||"";
    setStatus(
      ref
        ?`Your request has been submitted. Reference: ${ref}. SKANDI Support will follow up by email.`
        :"Your request has been submitted. SKANDI Support will follow up by email.",
      "ok"
    );
    $("publicSupportForm").reset();
    selectedFiles=[];
    $("fileSummary").textContent="No files selected.";
    $("submitBtn").disabled=false;
    toggleBookingFields();
    renderWorkflowOptions();
    handleCategoryChange();
    applyProfile(bootstrap);
    return;
  }

  if(msg.type==="PUBLIC_SUPPORT_ERROR"){
    setStatus(msg.payload?.message||"Support request failed.","error");
    $("submitBtn").disabled=false;
  }
});

renderWorkflowOptions();
renderPopularTopics();
toggleBookingFields();
handleCategoryChange();
updatePirRequirement();
post("PUBLIC_SUPPORT_READY",{page:"/about/support"});
})();
