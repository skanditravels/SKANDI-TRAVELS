
(()=>{
"use strict";

const VERSION="B-011.1";
const SOURCE="SKANDI_CAREERS_HUB";
const PARENT="SKANDI_WIX_PARENT";
const $=id=>document.getElementById(id);

const state={
  jobs:[],
  settings:{},
  selectedJob:null,
  applyStep:1,
  hubView:"jobs",
  portalTab:"applications",
  sessionToken:"",
  portalData:null,
  packet:null,
  docs:[],
  currentDoc:null,
  publicForms:[],
  hasSignature:false,
  signatureContext:null,
  pendingUploadRequest:"",
  uploadFiles:new Map()
};

function post(type,payload={}){
  window.parent.postMessage({
    source:SOURCE,
    type,
    payload,
    timestamp:new Date().toISOString()
  },"*");
}
function esc(value){
  return String(value??"").replace(/[&<>'"]/g,c=>({
    "&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"
  }[c]));
}
function arr(value){
  return Array.isArray(value)
    ?value
    :(value?String(value).split(",").map(item=>item.trim()).filter(Boolean):[]);
}
function unique(values){
  return [...new Set(values.filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b)));
}
function safeUrl(value){
  const raw=String(value||"").trim();
  if(!raw)return"";
  try{
    const url=new URL(raw);
    return["https:","http:"].includes(url.protocol)?url.href:"";
  }catch(_){return""}
}
function safeInternalPath(value){
  const path=String(value||"").trim();
  return path.startsWith("/")&&!path.startsWith("//")&&!/[\\\x00-\x1F\x7F]/.test(path)?path:"";
}
function sanitizeHtml(value){
  const template=document.createElement("template");
  template.innerHTML=String(value||"");
  template.content.querySelectorAll("script,style,iframe,object,embed,form,link,meta").forEach(node=>node.remove());
  template.content.querySelectorAll("*").forEach(node=>{
    [...node.attributes].forEach(attribute=>{
      const name=attribute.name.toLowerCase();
      const val=attribute.value.trim();
      if(name.startsWith("on")||["style","srcdoc"].includes(name)){
        node.removeAttribute(attribute.name);
        return;
      }
      if(["href","src","action"].includes(name)){
        const okay=val.startsWith("/")||/^https?:\/\//i.test(val)||/^mailto:/i.test(val)||/^tel:/i.test(val)||val.startsWith("#");
        if(!okay)node.removeAttribute(attribute.name);
      }
    });
  });
  return template.innerHTML;
}
function showLoading(on,title="Working",copy="Please wait."){
  $("loading").classList.toggle("show",Boolean(on));
  $("loading").setAttribute("aria-hidden",on?"false":"true");
  $("loadingTitle").textContent=title;
  $("loadingCopy").textContent=copy;
}
function toast(message,error=false){
  const node=$("toast");
  node.textContent=String(message||"");
  node.classList.toggle("error",Boolean(error));
  node.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer=setTimeout(()=>node.classList.remove("show"),3600);
}
function setStatus(id,message,tone=""){
  const node=$(id);
  node.textContent=String(message||"");
  node.className=`status ${tone}`.trim();
  node.classList.toggle("hidden",!message);
}
function requestHeight(){
  clearTimeout(requestHeight.timer);
  requestHeight.timer=setTimeout(()=>{
    post("CAREERS_HEIGHT",{height:Math.ceil(document.documentElement.scrollHeight+12)});
  },70);
}

function setHubView(view,{scroll=true}={}){
  const next=["jobs","portal","documents"].includes(view)?view:"jobs";
  state.hubView=next;
  document.querySelectorAll("[data-hub-view]").forEach(section=>{
    section.classList.toggle("active",section.dataset.hubView===next);
  });
  document.querySelectorAll(".hub-switch").forEach(button=>{
    button.classList.toggle("active",button.dataset.openView===next);
  });
  if(scroll){
    document.querySelector(".switcher-shell")?.scrollIntoView({behavior:"smooth",block:"start"});
  }
  requestHeight();
}

/* ---------- opportunities ---------- */
function options(element,values,allLabel){
  element.innerHTML=`<option value="">${esc(allLabel)}</option>`+
    values.map(value=>`<option value="${esc(value)}">${esc(value)}</option>`).join("");
}
function filteredJobs(){
  const q=String($("keyword").value||"").toLowerCase().trim();
  const loc=$("locationFilter").value,cat=$("categoryFilter").value,typ=$("typeFilter").value,lev=$("levelFilter").value;
  return state.jobs.filter(job=>{
    const hay=[job.title,job.location,job.category,job.summary,job.description,job.level,job.workModel,...arr(job.tags)].join(" ").toLowerCase();
    return(!q||hay.includes(q))&&(!loc||job.location===loc)&&(!cat||job.category===cat)&&(!typ||job.contractType===typ)&&(!lev||job.level===lev);
  });
}
function renderJobFilters(){
  options($("locationFilter"),unique(state.jobs.map(j=>j.location)),"All locations");
  options($("categoryFilter"),unique(state.jobs.map(j=>j.category)),"All areas");
  options($("typeFilter"),unique(state.jobs.map(j=>j.contractType)),"All contract types");
  options($("levelFilter"),unique(state.jobs.map(j=>j.level)),"All levels");
}
function renderJobs(){
  const rows=filteredJobs();
  $("statOpen").textContent=state.jobs.length;
  $("statBases").textContent=unique(state.jobs.map(j=>j.location)).length;
  $("statAreas").textContent=unique(state.jobs.map(j=>j.category)).length;
  $("searchMeta").textContent=rows.length===state.jobs.length
    ?`${rows.length} current role${rows.length===1?"":"s"}`
    :`${rows.length} matching role${rows.length===1?"":"s"}`;

  $("jobList").innerHTML=rows.length?rows.map(job=>`
    <button class="job" type="button" data-job="${esc(job.positionId)}">
      <span>
        <h3>${esc(job.title||"SKANDI opportunity")}</h3>
        <span class="job-meta">${esc([job.location,job.category,job.contractType].filter(Boolean).join(" · "))}</span>
        <span class="pill-row">${arr(job.tags).slice(0,4).map(tag=>`<span class="pill">${esc(tag)}</span>`).join("")}</span>
      </span>
      <span class="job-side">
        ${job.level?`<strong>${esc(job.level)}</strong><br>`:""}
        ${job.workModel?`${esc(job.workModel)}<br>`:""}
        ${job.deadline?`Apply by ${esc(job.deadline)}`:""}
      </span>
      <span class="job-arrow" aria-hidden="true">→</span>
    </button>
  `).join(""):`<div class="status">No published positions match the current filters.</div>`;
  requestHeight();
}
function openJob(positionId){
  state.selectedJob=state.jobs.find(job=>job.positionId===positionId)||null;
  const job=state.selectedJob;
  if(!job)return;
  $("detailTitle").textContent=job.title||"SKANDI opportunity";
  $("detailMeta").textContent=[job.location,job.category,job.contractType,job.level].filter(Boolean).join(" · ");
  $("detailIntro").textContent=job.summary||job.description||"";
  const responsibilities=arr(job.responsibilities),requirements=arr(job.requirements),benefits=arr(job.benefits);
  $("detailResp").innerHTML=(responsibilities.length?responsibilities:["Responsibilities are described in the published position details."]).map(x=>`<li>${esc(x)}</li>`).join("");
  $("detailReq").innerHTML=(requirements.length?requirements:["Requirements are described in the published position details."]).map(x=>`<li>${esc(x)}</li>`).join("");
  $("detailBenefits").innerHTML=(benefits.length?benefits:["Role-specific employment information is confirmed during the recruiting process."]).map(x=>`<li>${esc(x)}</li>`).join("");
  $("detailDeadline").textContent=job.deadline?`Apply by ${job.deadline}`:"";
  $("jobDrawer").classList.add("active");
  $("jobDrawer").setAttribute("aria-hidden","false");
}
function closeJob(){
  $("jobDrawer").classList.remove("active");
  $("jobDrawer").setAttribute("aria-hidden","true");
}
function openApply(){
  if(!state.selectedJob)return;
  closeJob();
  state.applyStep=1;
  $("applyTitle").textContent=`Apply: ${state.selectedJob.title}`;
  $("applyMeta").textContent=[state.selectedJob.location,state.selectedJob.category,state.selectedJob.contractType].filter(Boolean).join(" · ");
  $("applyModal").classList.add("active");
  $("applyModal").setAttribute("aria-hidden","false");
  renderApplyStep();
}
function closeApply(){
  $("applyModal").classList.remove("active");
  $("applyModal").setAttribute("aria-hidden","true");
  $("applyError").style.display="none";
}
function renderApplyStep(){
  document.querySelectorAll("[data-apply-step]").forEach(section=>{
    section.classList.toggle("active",Number(section.dataset.applyStep)===state.applyStep);
  });
  document.querySelectorAll(".step-pill").forEach((pill,index)=>pill.classList.toggle("active",index<state.applyStep));
  $("stepLabel").textContent=`Step ${state.applyStep} of 3`;
  $("applyBackBtn").style.visibility=state.applyStep===1?"hidden":"visible";
  $("applyNextBtn").textContent=state.applyStep===3?"Submit application":"Next";
  if(state.applyStep===3){
    $("applicationSummary").textContent=[
      [$("firstName").value,$("lastName").value].filter(Boolean).join(" "),
      $("email").value,
      state.selectedJob?.title
    ].filter(Boolean).join(" · ");
  }
}
function fileInfo(input,kind){
  const file=input.files&&input.files[0];
  return file?{kind,fileName:file.name,mimeType:file.type,sizeBytes:file.size}:null;
}
function validateApplyStep(){
  const node=$("applyError");
  node.style.display="none";
  node.textContent="";
  if(state.applyStep===1&&(!$("firstName").value.trim()||!$("lastName").value.trim()||!$("email").value.trim()||!$("phone").value.trim())){
    node.textContent="First name, last name, email and phone are required.";node.style.display="block";return false;
  }
  if(state.applyStep===2&&!fileInfo($("cvFile"),"CV")){
    node.textContent="Resume / CV is required.";node.style.display="block";return false;
  }
  if(state.applyStep===3&&!$("applicationConsent").checked){
    node.textContent="Recruitment data consent is required.";node.style.display="block";return false;
  }
  return true;
}
function prepareApplicationUpload(){
  const files=[fileInfo($("cvFile"),"CV"),fileInfo($("coverFile"),"COVER")].filter(Boolean);
  const requestId=`CAREERS-UP-${Date.now()}`;
  state.pendingUploadRequest=requestId;
  state.uploadFiles.clear();
  files.forEach(info=>{
    state.uploadFiles.set(info.kind,info.kind==="CV"?$("cvFile").files[0]:$("coverFile").files[0]);
  });
  showLoading(true,"Preparing application","Creating secure private upload links for your application documents.");
  post("CAREERS_UPLOAD_PREPARE",{
    requestId,
    email:$("email").value.trim(),
    positionId:state.selectedJob?.positionId||"",
    files
  });
}
async function uploadPreparedFiles(payload){
  if(payload.requestId!==state.pendingUploadRequest)return;
  const uploads=Array.isArray(payload.uploads)?payload.uploads:[];
  try{
    for(const upload of uploads){
      const file=state.uploadFiles.get(upload.kind);
      if(!file)throw new Error(`Missing local ${upload.kind} file.`);
      const response=await fetch(upload.signedUrl,{
        method:upload.method||"PUT",
        headers:{"Content-Type":upload.contentType||file.type||"application/octet-stream"},
        body:file
      });
      if(!response.ok)throw new Error(`Secure upload failed (${response.status}).`);
    }
    $("loadingTitle").textContent="Submitting application";
    $("loadingCopy").textContent="Saving your application to SKANDI Recruiting.";
    post("CAREERS_APPLY",{application:{
      positionId:state.selectedJob?.positionId||"",
      positionTitle:state.selectedJob?.title||"",
      firstName:$("firstName").value.trim(),
      lastName:$("lastName").value.trim(),
      email:$("email").value.trim(),
      phone:$("phone").value.trim(),
      preferredBase:$("preferredBase").value.trim(),
      startDate:$("startDate").value,
      motivation:$("motivation").value.trim(),
      source:$("source").value,
      consent:$("applicationConsent").checked===true,
      uploads:uploads.map(upload=>({uploadId:upload.uploadId,kind:upload.kind}))
    }});
  }catch(error){
    showLoading(false);
    toast(error?.message||"Application document upload failed.",true);
  }
}

/* ---------- applicant portal ---------- */
function setPortalTab(tab){
  const next=["applications","messages","documents","profile"].includes(tab)?tab:"applications";
  state.portalTab=next;
  document.querySelectorAll("[data-portal-tab]").forEach(button=>button.classList.toggle("active",button.dataset.portalTab===next));
  ["applications","messages","documents","profile"].forEach(name=>{
    $(`${name}PortalView`).classList.toggle("hidden",name!==next);
  });
  requestHeight();
}
function renderPortal(){
  const data=state.portalData||{},applicant=data.applicant||{};
  $("portalLoginState").classList.add("hidden");
  $("portalDashboard").classList.remove("hidden");
  $("welcome").textContent=`Welcome${applicant.firstName?" "+applicant.firstName:""}`;

  const applications=Array.isArray(data.applications)?data.applications:[];
  $("applicationsPortalView").innerHTML=applications.length
    ?`<div class="portal-grid">${applications.map(item=>`
      <article class="portal-item">
        <h3>${esc(item.positionTitle||"SKANDI opportunity")}</h3>
        <div class="meta">${esc([item.location,item.createdAt].filter(Boolean).join(" · "))}</div>
        <span class="pill">${esc(item.stage||item.status||"Application received")}</span>
      </article>`).join("")}</div>`
    :`<div class="status">No applications were found for this applicant session.</div>`;

  const messages=Array.isArray(data.messages)?data.messages:[];
  $("messagesPortalView").innerHTML=messages.length
    ?`<section class="card"><div class="card-body">${messages.map(message=>`
      <article class="message-item"><strong>${esc(message.subject||"Careers message")}</strong>
      <div class="meta" style="margin-top:4px">${esc(message.createdAt||"")}</div><p>${esc(message.body||"")}</p></article>`).join("")}</div></section>`
    :`<div class="status">No applicant-visible messages are currently published.</div>`;

  const documents=Array.isArray(data.documentRequests)?data.documentRequests:[];
  $("documentsPortalView").innerHTML=documents.length
    ?`<div class="portal-grid">${documents.map(item=>`
      <article class="portal-item"><h3>${esc(item.title||"Applicant documents")}</h3>
      <div class="meta">${esc(item.status||"Pending")}${item.dueAt?` · Due ${esc(item.dueAt)}`:""}${item.documentCount?` · ${esc(item.documentCount)} document${Number(item.documentCount)===1?"":"s"}`:""}</div>
      <span class="pill">${esc(item.packetType||"Document request")}</span>
      <div style="margin-top:12px"><button class="btn small" type="button" data-open-packet="${esc(item.packetId)}">Open documents</button></div></article>`).join("")}</div>`
    :`<div class="status">No applicant document requests are currently assigned.</div>`;

  $("profilePortalView").innerHTML=`
    <div class="profile-list">
      <div class="profile-cell"><span>Name</span><strong>${esc([applicant.firstName,applicant.lastName].filter(Boolean).join(" ")||"—")}</strong></div>
      <div class="profile-cell"><span>Email</span><strong>${esc(applicant.email||"—")}</strong></div>
      <div class="profile-cell"><span>Phone</span><strong>${esc(applicant.phone||"—")}</strong></div>
      <div class="profile-cell"><span>Preferred base</span><strong>${esc(applicant.preferredBase||"—")}</strong></div>
    </div>
    <div class="status" style="margin-top:12px">If your personal details need to be corrected, contact SKANDI Careers so the recruiting record remains controlled.</div>`;
  setPortalTab(state.portalTab);
}
function portalLoggedOut(){
  state.sessionToken="";
  state.portalData=null;
  $("portalDashboard").classList.add("hidden");
  $("portalLoginState").classList.remove("hidden");
  $("loginCode").value="";
  setStatus("portalLoginStatus","","");
  requestHeight();
}

/* ---------- forms & documents ---------- */
function renderPublicForms(){
  const forms=state.publicForms||[];
  $("publicFormsGrid").innerHTML=forms.length?forms.map(form=>`
    <article class="form-card">
      <div class="form-code">${esc(form.code||"FORM")} · ${esc(form.category||"Careers")}</div>
      <h3>${esc(form.title||"Career form")}</h3>
      <p>${esc(form.summary||"Published SKANDI Careers form.")}</p>
      <div class="form-actions">
        ${form.allowBlankFill&&safeInternalPath(form.onlinePath)?`<button class="btn small" type="button" data-form-path="${esc(form.onlinePath)}">Fill online</button>`:""}
        ${form.allowBlankDownload&&safeUrl(form.fileUrl)?`<button class="btn secondary small" type="button" data-form-url="${esc(form.fileUrl)}">Open form</button>`:""}
        ${safeUrl(form.officialSourceUrl)?`<button class="btn secondary small" type="button" data-form-url="${esc(form.officialSourceUrl)}">Official source</button>`:""}
      </div>
    </article>`).join(""):`<div class="status">No public Careers forms are currently published.</div>`;
  requestHeight();
}
function openPacketFromPortal(packetId){
  if(!state.sessionToken){
    toast("Sign in to Applicant Portal again.",true);
    setHubView("portal");
    return;
  }
  showLoading(true,"Loading applicant documents","Retrieving the assigned document packet.");
  post("APPLICANT_OPEN_DOCUMENT",{sessionToken:state.sessionToken,packetId});
}
function loadDirectPacket(){
  const email=$("inviteEmail").value.trim(),token=$("inviteToken").value.trim();
  if(!email||!token){
    setStatus("documentAccessStatus","Enter the document email and access token.","error");
    return;
  }
  showLoading(true,"Loading applicant documents","Checking the document request and access token.");
  post("DOCUMENT_PACKET_LOAD_REQUEST",{email,token});
}
function renderDocumentPacket(payload){
  const packet=payload.packet||{},identity=payload.identity||{};
  state.packet=packet;
  state.docs=Array.isArray(packet.documents)?packet.documents:[];
  state.currentDoc=state.docs[0]||null;
  $("documentPacketTitle").textContent=packet.title||"Applicant document review";
  $("documentPacketInstructions").textContent=packet.instructions||"Review the assigned document before completing the acknowledgement.";
  $("docFirstName").value=identity.firstName||"";
  $("docLastName").value=identity.lastName||"";
  $("docEmail").value=identity.email||$("inviteEmail").value||"";
  $("docPhone").value=identity.phone||"";
  $("docChooser").innerHTML=state.docs.map((doc,index)=>`<button class="btn secondary small" type="button" data-doc-index="${index}">${esc(doc.title||`Document ${index+1}`)}</button>`).join("");
  $("documentWorkspace").classList.remove("hidden");
  if(state.docs.length)openDocument(0);
  setHubView("documents",{scroll:false});
  showLoading(false);
  setStatus("documentAccessStatus",state.docs.length?"Document request loaded.":"The packet has no assigned documents.","ok");
  $("documentWorkspace").scrollIntoView({behavior:"smooth",block:"start"});
}
function openDocument(index){
  state.currentDoc=state.docs[index]||null;
  const doc=state.currentDoc;
  if(!doc)return;
  $("viewerTitle").textContent=doc.title||"Applicant document";
  $("viewerStatus").textContent=doc.documentType||doc.status||"Review before signing";
  const url=safeUrl(doc.fileUrl);
  if(url){
    $("pdfViewer").classList.remove("hidden");
    $("bodyViewer").classList.add("hidden");
    $("pdfViewer").src=url;
  }else{
    $("pdfViewer").src="about:blank";
    $("pdfViewer").classList.add("hidden");
    $("bodyViewer").classList.remove("hidden");
    $("bodyViewer").innerHTML=sanitizeHtml(doc.bodyHtml||"<p>No document body was provided.</p>");
  }
  resetSignature();
  requestHeight();
}
function collectDocumentExecution(){
  return{
    sessionToken:state.sessionToken||"",
    packetId:state.packet?.packetId||"",
    email:$("docEmail").value.trim()||$("inviteEmail").value.trim(),
    token:$("inviteToken").value.trim(),
    relationship:$("relationship").value,
    firstName:$("docFirstName").value.trim(),
    lastName:$("docLastName").value.trim(),
    phone:$("docPhone").value.trim(),
    documentId:state.currentDoc?.documentId||"",
    decision:document.querySelector("input[name='decision']:checked")?.value||"approved",
    comment:$("comment").value.trim(),
    electronicConsent:$("documentConsent").checked===true,
    signatureName:$("signatureName").value.trim(),
    hasSignature:state.hasSignature,
    signatureImageData:state.hasSignature?$("signaturePad").toDataURL("image/png"):""
  };
}
function submitDocument(){
  const payload=collectDocumentExecution();
  if(!state.currentDoc){setStatus("documentSubmitStatus","Select an assigned document first.","error");return}
  if(!payload.firstName||!payload.lastName||!payload.email){setStatus("documentSubmitStatus","Complete the identity fields.","error");return}
  if(!payload.electronicConsent){setStatus("documentSubmitStatus","Electronic consent is required.","error");return}
  if(!payload.signatureName){setStatus("documentSubmitStatus","Typed legal signature is required.","error");return}
  if(!state.hasSignature){
    $("signaturePad").classList.add("invalid");
    setStatus("documentSubmitStatus","Drawn signature is required.","error");
    return;
  }
  showLoading(true,"Recording document decision","Saving the acknowledgement and signature securely.");
  post("DOCUMENT_EXEC_SUBMIT",payload);
}
function setupSignaturePad(){
  const canvas=$("signaturePad"),ctx=canvas.getContext("2d");
  ctx.lineWidth=3;ctx.lineCap="round";ctx.strokeStyle="#022e64";
  state.signatureContext=ctx;
  let drawing=false;
  function point(event){
    const rect=canvas.getBoundingClientRect(),source=event.touches?event.touches[0]:event;
    return{x:(source.clientX-rect.left)*(canvas.width/rect.width),y:(source.clientY-rect.top)*(canvas.height/rect.height)};
  }
  function start(event){event.preventDefault();drawing=true;const p=point(event);ctx.beginPath();ctx.moveTo(p.x,p.y)}
  function move(event){if(!drawing)return;event.preventDefault();const p=point(event);ctx.lineTo(p.x,p.y);ctx.stroke();state.hasSignature=true;canvas.classList.remove("invalid")}
  function end(){drawing=false}
  ["mousedown","touchstart"].forEach(type=>canvas.addEventListener(type,start,{passive:false}));
  ["mousemove","touchmove"].forEach(type=>canvas.addEventListener(type,move,{passive:false}));
  ["mouseup","mouseleave","touchend"].forEach(type=>canvas.addEventListener(type,end));
}
function resetSignature(){
  const canvas=$("signaturePad");
  state.signatureContext?.clearRect(0,0,canvas.width,canvas.height);
  state.hasSignature=false;
  canvas.classList.remove("invalid");
  $("documentConsent").checked=false;
  $("signatureName").value="";
  $("comment").value="";
  setStatus("documentSubmitStatus","","");
}

/* ---------- controls ---------- */
document.addEventListener("click",event=>{
  const viewButton=event.target.closest("[data-open-view]");
  if(viewButton){setHubView(viewButton.dataset.openView);return}

  const job=event.target.closest("[data-job]");
  if(job){openJob(job.dataset.job);return}

  if(event.target.closest("[data-close-drawer]")){closeJob();return}
  if(event.target.closest("[data-close-apply]")){closeApply();return}

  const portalTab=event.target.closest("[data-portal-tab]");
  if(portalTab){setPortalTab(portalTab.dataset.portalTab);return}

  const packet=event.target.closest("[data-open-packet]");
  if(packet){openPacketFromPortal(packet.dataset.openPacket);return}

  const doc=event.target.closest("[data-doc-index]");
  if(doc){openDocument(Number(doc.dataset.docIndex));return}

  const internalForm=event.target.closest("[data-form-path]");
  if(internalForm){
    const path=safeInternalPath(internalForm.dataset.formPath);
    if(path)post("CAREERS_NAVIGATE",{path});
    return;
  }

  const externalForm=event.target.closest("[data-form-url]");
  if(externalForm){
    const url=safeUrl(externalForm.dataset.formUrl);
    if(url)window.open(url,"_blank","noopener,noreferrer");
  }
});

["keyword","locationFilter","categoryFilter","typeFilter","levelFilter"].forEach(id=>$(id).addEventListener("input",renderJobs));
$("searchBtn").onclick=renderJobs;
$("detailApply").onclick=openApply;
$("applyBackBtn").onclick=()=>{if(state.applyStep>1){state.applyStep--;renderApplyStep()}};
$("applyNextBtn").onclick=()=>{
  if(!validateApplyStep())return;
  if(state.applyStep<3){state.applyStep++;renderApplyStep();return}
  prepareApplicationUpload();
};

$("requestCodeBtn").onclick=()=>{
  const email=$("careerApplicantLoginEmail").value.trim();
  if(!email){setStatus("portalLoginStatus","Enter the email used in your application.","error");return}
  showLoading(true,"Requesting access","Checking the Careers applicant record.");
  post("APPLICANT_PORTAL_REQUEST_CODE",{email});
};
$("loginBtn").onclick=()=>{
  const email=$("careerApplicantLoginEmail").value.trim(),code=$("loginCode").value.trim();
  if(!email||!code){setStatus("portalLoginStatus","Enter your applicant email and access code.","error");return}
  showLoading(true,"Opening applicant portal","Verifying the applicant access code.");
  post("APPLICANT_PORTAL_LOGIN",{email,code});
};
$("logoutBtn").onclick=()=>{
  if(state.sessionToken)post("APPLICANT_PORTAL_LOGOUT",{sessionToken:state.sessionToken});
  else portalLoggedOut();
};

$("loadDocumentBtn").onclick=loadDirectPacket;
$("documentSupportBtn").onclick=()=>post("DOCUMENT_SUPPORT_REQUEST",{email:$("inviteEmail").value.trim()});
$("clearSignatureBtn").onclick=resetSignature;
$("submitDocumentBtn").onclick=submitDocument;

/* ---------- parent responses ---------- */
window.addEventListener("message",event=>{
  if(event.source!==window.parent)return;
  let message=event.data;
  if(typeof message==="string"){try{message=JSON.parse(message)}catch(_){return}}
  if(!message||typeof message!=="object"||message.source!==PARENT)return;
  const payload=message.payload||{};

  if(message.type==="CAREERS_HOST_READY"){
    if(payload.email)$("inviteEmail").value=payload.email;
    if(payload.token)$("inviteToken").value=payload.token;
    if(payload.view)setHubView(payload.view,{scroll:false});
    if(payload.view==="documents"&&payload.email&&payload.token)setTimeout(loadDirectPacket,120);
    return;
  }

  if(message.type==="CAREERS_DATA"){
    state.jobs=Array.isArray(payload.positions)?payload.positions:[];
    state.settings=payload.settings||{};
    renderJobFilters();
    renderJobs();
    return;
  }

  if(message.type==="CAREERS_UPLOAD_READY"){
    uploadPreparedFiles(payload);
    return;
  }

  if(message.type==="CAREERS_APPLICATION_RESULT"){
    showLoading(false);
    closeApply();
    toast(payload.message||"Application received.");
    if($("email").value)$("careerApplicantLoginEmail").value=$("email").value;
    setHubView("portal");
    setStatus("portalLoginStatus","Application submitted. Request an applicant access code when you want to return to your application.","ok");
    return;
  }

  if(message.type==="APPLICANT_PORTAL_CODE_RESULT"){
    showLoading(false);
    setStatus("portalLoginStatus",payload.message||"Access code request received.",payload.ok===false?"error":"ok");
    return;
  }

  if(message.type==="APPLICANT_PORTAL_LOGIN_RESULT"){
    showLoading(false);
    if(!payload.ok){
      setStatus("portalLoginStatus",payload.error||payload.message||"Could not sign in.","error");
      return;
    }
    state.sessionToken=payload.sessionToken||"";
    state.portalData=payload;
    renderPortal();
    return;
  }

  if(message.type==="APPLICANT_PORTAL_DATA"){
    state.portalData=payload;
    if(payload.sessionToken)state.sessionToken=payload.sessionToken;
    renderPortal();
    return;
  }

  if(message.type==="APPLICANT_PORTAL_LOGOUT_RESULT"){
    portalLoggedOut();
    toast("Signed out of Applicant Portal.");
    return;
  }

  if(message.type==="CAREERS_PUBLIC_FORMS_DATA"){
    state.publicForms=Array.isArray(payload.documents)?payload.documents:[];
    renderPublicForms();
    return;
  }

  if(message.type==="DOCUMENT_PACKET_DATA"){
    renderDocumentPacket(payload);
    return;
  }

  if(message.type==="DOCUMENT_EXECUTION_RESULT"){
    showLoading(false);
    setStatus("documentSubmitStatus",payload.message||"Document decision recorded.",payload.ok===false?"error":"ok");
    toast(payload.message||"Document decision recorded.",payload.ok===false);
    if(payload.ok!==false&&state.sessionToken)post("APPLICANT_PORTAL_REFRESH",{sessionToken:state.sessionToken});
    return;
  }

  if(message.type==="CAREERS_ERROR"){
    showLoading(false);
    const text=payload.message||"Careers is temporarily unavailable.";
    toast(text,true);
    if(state.hubView==="portal")setStatus("portalLoginStatus",text,"error");
    if(state.hubView==="documents"){
      setStatus("documentAccessStatus",text,"error");
      setStatus("documentSubmitStatus",text,"error");
    }
  }
});

if("ResizeObserver"in window)new ResizeObserver(requestHeight).observe(document.body);
else window.addEventListener("resize",requestHeight);

setupSignaturePad();
post("CAREERS_READY",{version:VERSION});
requestHeight();

})();
