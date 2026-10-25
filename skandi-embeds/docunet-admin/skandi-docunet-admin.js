
const SOURCE="SKANDI_DOCUNET_ADMIN";
const MODULE="SKANDI_DOCUNET_ADMIN";
const SCHEMA_VERSION="SKANDI_DOCUNET_V1";
const SERVICE_LABELS={ALL:"All Services",DESTINATION:"Destination Services",TRANSFERS:"Transfers",TOURS:"Tours & Activities",PACKAGES:"Travel Packages"};
const MARKET_LABELS={ALL:"All Markets",USNYC:"USNYC · New York",SESTO:"SESTO · Stockholm",GRHER:"GRHER · Crete"};
const AUDIENCE_LABELS={ALL:"All Teams",OPERATIONS:"Operations",DESTINATION_STAFF:"Destination Staff",CUSTOMER_CARE:"Customer Care",PARTNER_MANAGEMENT:"Partner Management"};
let state={session:{},categories:[],documents:[],audit:[],storageFiles:[],existingStoragePath:"",editingDocId:"",editingCatId:"",previewUrl:"",selectedPdfFile:null,pendingUpload:null,uploadRequestId:"",uploadInFlight:false};
const MAX_PDF_BYTES=50*1024*1024;

const $=id=>document.getElementById(id);
function post(type,payload={}){window.parent.postMessage({source:SOURCE,module:MODULE,schemaVersion:SCHEMA_VERSION,type,...payload},"*")}
function initLocalUtilities(){
  document.querySelectorAll("[data-global-path]").forEach(button=>{
    button.onclick=()=>post("NAVIGATE",{path:button.dataset.globalPath});
  });
  const security=$("globalSecurityBtn");
  if(security)security.onclick=()=>alert("Authenticated staff session · Controlled internal access · Supabase credentials remain backend-only.");
}
function esc(v=""){return String(v??"").replace(/[&<>"']/g,s=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[s]))}
function arr(v){return Array.isArray(v)?v:String(v||"").split(",").map(x=>x.trim()).filter(Boolean)}
function selectedCodes(id){
  const values=[...$(id).selectedOptions].map(o=>o.value).filter(Boolean);
  if(values.includes("ALL"))return ["ALL"];
  return values.length?values:["ALL"];
}
function setSelectedCodes(id,values){
  const selected=arr(values);const normalized=selected.length?selected:["ALL"];
  [...$(id).options].forEach(option=>option.selected=normalized.includes(option.value));
}
function labels(values,map){return arr(values).map(value=>map[value]||value)}
function normalizedAudienceValues(d){
  const values=arr(d.audiences||d.applicability?.audiences||d.audience);
  const aliases={"All staff":"ALL","Ground Operations":"OPERATIONS","Admin":"OPERATIONS","Management":"OPERATIONS"};
  return values.length?values.map(value=>aliases[value]||value):["ALL"];
}
function status(msg,mode=""){const e=$("status");e.textContent=msg||"";e.className=msg?`status show ${mode}`:"status"}
function fmt(v){if(!v)return "";try{return new Date(v).toLocaleDateString()}catch(e){return String(v)}}
function activePanel(name){
  if(name==="storage")refreshStorage();
  document.querySelectorAll("[data-panel]").forEach(b=>b.classList.toggle("active",b.dataset.panel===name));
  document.querySelectorAll(".panel").forEach(p=>p.classList.toggle("active",p.id===`panel-${name}`));
}
function categoryTitles(){return state.categories.map(c=>c.title||c.name||c.category).filter(Boolean)}
function setCategoryOptions(){
  const opts=`<option value="">All</option>`+categoryTitles().map(c=>`<option>${esc(c)}</option>`).join("");
  $("docCategory").innerHTML=opts;
  $("category").innerHTML=categoryTitles().map(c=>`<option>${esc(c)}</option>`).join("");
}
function docFilters(){return {query:$("docQuery").value.trim(),category:$("docCategory").value,publishStatus:$("docStatus").value,documentType:$("docType").value,service:$("docService").value,market:$("docMarket").value,audience:$("docAudience").value,admin:true,schemaVersion:SCHEMA_VERSION}}
function load(){status("Loading document control...");post("ADMIN_BOOTSTRAP")}
function searchDocs(){status("Searching documents...");post("ADMIN_SEARCH_DOCS",{filters:docFilters()})}
function renderBootstrap(payload){
  state.session=payload.session||{};state.categories=payload.categories||[];setCategoryOptions();
  renderCategories();
  post("ADMIN_SEARCH_DOCS",{filters:docFilters()});
  post("ADMIN_AUDIT_SEARCH",{});
}
function pills(d){
  const p=[];
  p.push(`<span class="pill ${d.publishStatus==="PUBLISHED"?"green":d.publishStatus==="ARCHIVED"?"red":"orange"}">${esc(d.publishStatus||"DRAFT")}</span>`);
  p.push(`<span class="pill">${esc(d.category||"Uncategorised")}</span>`);
  p.push(`<span class="pill">${esc(d.documentType||"Document")}</span>`);
  if(d.revision)p.push(`<span class="pill gray">Rev ${esc(d.revision)}</span>`);
  const serviceValues=arr(d.services||d.applicability?.services);
  const marketValues=arr(d.markets||d.applicability?.markets);
  const audienceValues=normalizedAudienceValues(d);
  if(serviceValues.length)p.push(`<span class="pill">${esc(labels(serviceValues,SERVICE_LABELS).join(", "))}</span>`);
  if(marketValues.length)p.push(`<span class="pill gray">${esc(labels(marketValues,MARKET_LABELS).join(", "))}</span>`);
  if(audienceValues.length)p.push(`<span class="pill gray">${esc(labels(audienceValues,AUDIENCE_LABELS).join(", "))}</span>`);
  if(d.requiresAcknowledgement)p.push(`<span class="pill orange">Ack required</span>`);
  if(d.isCritical)p.push(`<span class="pill red">Critical</span>`);
  return p.join("");
}
function renderDocs(payload){
  state.documents=payload.documents||[];
  if(!state.documents.length){$("docTable").innerHTML=`<div class="card"><p>No documents found.</p></div>`;status("");return;}
  $("docTable").innerHTML=state.documents.map(d=>`
    <article class="row">
      <div>
        <div class="meta">${pills(d)}</div>
        <h3>${esc(d.title)}</h3>
        <p>${esc(d.documentCode||"")} · ${esc(d.summary||"")} ${d.effectiveDate?" · Effective "+esc(fmt(d.effectiveDate)):""}</p>
      </div>
      <div class="actions">
        ${(d.latestStoragePath||d.publishStatus==="PUBLISHED")?`<button class="btn secondary" data-preview-id="${esc(d._id)}" data-title="${esc(d.title)}">Read/preview</button>`:""}
        <button class="btn secondary" data-edit="${esc(d._id)}">Adjust</button>
        <button class="btn" data-revise="${esc(d._id)}">New revision</button>
        ${d.publishStatus==="ARCHIVED"?`<button class="btn green" data-restore="${esc(d._id)}">Restore</button>`:`<button class="btn warn" data-archive="${esc(d._id)}">Archive</button>`}
        <button class="btn danger" data-delete="${esc(d._id)}">Delete</button>
      </div>
    </article>`).join("");
  document.querySelectorAll("[data-preview-id]").forEach(b=>b.onclick=()=>post("ADMIN_DOC_PREVIEW",{documentId:b.dataset.previewId,title:b.dataset.title}));
  document.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>editDoc(b.dataset.edit,false));
  document.querySelectorAll("[data-revise]").forEach(b=>b.onclick=()=>editDoc(b.dataset.revise,true));
  document.querySelectorAll("[data-archive]").forEach(b=>b.onclick=()=>post("ADMIN_DOC_STATUS",{documentId:b.dataset.archive,publishStatus:"ARCHIVED"}));
  document.querySelectorAll("[data-restore]").forEach(b=>b.onclick=()=>post("ADMIN_DOC_STATUS",{documentId:b.dataset.restore,publishStatus:"PUBLISHED"}));
  document.querySelectorAll("[data-delete]").forEach(b=>b.onclick=()=>{if(confirm("Remove this document from the active register? The PDFs and revision/audit history are retained."))post("ADMIN_DOC_DELETE",{documentId:b.dataset.delete})});
  status("");
}
function preview(url,title){
  state.previewUrl=url;$("viewerTitle").textContent=title||"Document preview";$("viewerMeta").textContent=url;$("pdfFrame").src=`${url}#toolbar=1&navpanes=1&view=FitH`;$("viewer").classList.add("open");window.scrollTo({top:0,behavior:"smooth"});
}
function bytesLabel(bytes){
  const units=["B","KB","MB","GB"];let value=Number(bytes||0),i=0;
  while(value>=1024&&i<units.length-1){value/=1024;i++;}
  return `${value.toFixed(i?1:0)} ${units[i]}`;
}
function fileState(message,mode=""){
  const el=$("uploadFileState");if(!el)return;
  el.textContent=message;el.className=`file-state ${mode}`.trim();
}
function validatePdf(file){
  if(!file)return "Select a PDF file.";
  const name=String(file.name||"");
  const pdfType=file.type==="application/pdf"||/\.pdf$/i.test(name);
  if(!pdfType)return "Only PDF files are accepted.";
  if(!file.size)return "The selected PDF is empty.";
  if(file.size>MAX_PDF_BYTES)return `The PDF exceeds the ${bytesLabel(MAX_PDF_BYTES)} limit.`;
  return "";
}
function selectPdf(file){
  const error=validatePdf(file);
  if(error){state.selectedPdfFile=null;fileState(error,"error");status(error,"warn");return false;}
  state.existingStoragePath="";$("saveDocBtn").textContent="Upload PDF and publish record";state.selectedPdfFile=file;
  fileState(`${file.name} · ${bytesLabel(file.size)} · PDF READY`,"ready");
  $("uploadEngineStatus").textContent="PDF selected and ready for secure Supabase upload.";
  status("PDF selected. Complete the metadata and publish when ready.","ok");
  return true;
}
function setUploadBusy(busy,message=""){
  state.uploadInFlight=busy;
  $("saveDocBtn").disabled=busy;
  $("docControlUploadButton").disabled=busy;
  if(message)fileState(message,busy?"uploading":"ready");
}
function requestSupabaseUpload(){
  const meta=collectDoc();
  if(!meta.title||!meta.documentCode||!meta.revision)return status("Title, code and revision are required.","warn");
  const input=$("docControlUploadButton");
  const file=state.selectedPdfFile||input.files?.[0];
  const error=validatePdf(file);
  if(error){fileState(error,"error");return status(error,"warn");}
  state.selectedPdfFile=file;
  state.uploadRequestId=`DOCUP-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
  state.pendingUpload={metadata:meta,file};
  setUploadBusy(true,`REQUESTING SIGNED SUPABASE URL · ${file.name}`);
  status("Requesting secure Supabase upload authorization...","warn");
  post("ADMIN_SUPABASE_UPLOAD_INIT",{
    requestId:state.uploadRequestId,
    metadata:meta,
    file:{name:file.name,size:file.size,type:file.type||"application/pdf",lastModified:file.lastModified},
    storageProvider:"SUPABASE"
  });
}
async function uploadToSupabase(payload){
  const pending=state.pendingUpload;
  if(!pending||!pending.file)return status("The selected PDF is no longer available. Select it again.","error");
  if(payload.requestId&&payload.requestId!==state.uploadRequestId)return;
  const uploadUrl=payload.uploadUrl||payload.signedUrl;
  if(!uploadUrl){setUploadBusy(false);return status("Supabase upload authorization did not include an upload URL.","error");}
  try{
    const headers={"Content-Type":pending.file.type||"application/pdf",...(payload.headers||{})};
    setUploadBusy(true,`UPLOADING TO SUPABASE · ${pending.file.name} · ${bytesLabel(pending.file.size)}`);
    status("Uploading PDF directly to Supabase Storage...","warn");
    const response=await fetch(uploadUrl,{method:payload.method||"PUT",headers,body:pending.file});
    if(!response.ok){let detail="";try{detail=await response.text()}catch(_e){}throw new Error(`Upload failed (${response.status})${detail?`: ${detail.slice(0,240)}`:""}`);}
    fileState(`${pending.file.name} · UPLOAD COMPLETE · WAITING FOR RECORD SAVE`,"ready");
    status("PDF uploaded. Saving the controlled document record...","warn");
    post("ADMIN_DOC_SAVE_WITH_UPLOAD",{
      requestId:state.uploadRequestId,
      metadata:pending.metadata,
      storageProvider:"SUPABASE",
      file:{name:pending.file.name,size:pending.file.size,type:pending.file.type||"application/pdf",lastModified:pending.file.lastModified},
      storage:{bucket:payload.bucket||"",path:payload.path||payload.storagePath||"",publicUrl:payload.publicUrl||"",signedReadUrl:payload.signedReadUrl||""}
    });
  }catch(error){
    setUploadBusy(false);
    fileState(`UPLOAD FAILED · ${error.message}`,"error");
    status(error.message||"Supabase PDF upload failed.","error");
    post("ADMIN_SUPABASE_UPLOAD_FAILED",{requestId:state.uploadRequestId,message:error.message||"Upload failed"});
  }
}
function bindPdfUpload(){
  const input=$("docControlUploadButton"),drop=$("pdfDropzone");
  input.addEventListener("change",()=>selectPdf(input.files?.[0]));
  ["dragenter","dragover"].forEach(type=>drop.addEventListener(type,e=>{e.preventDefault();if(!state.uploadInFlight)drop.classList.add("dragover")}));
  ["dragleave","drop"].forEach(type=>drop.addEventListener(type,e=>{e.preventDefault();drop.classList.remove("dragover")}));
  drop.addEventListener("drop",e=>{if(state.uploadInFlight)return;const file=e.dataTransfer?.files?.[0];if(file&&selectPdf(file)){try{const dt=new DataTransfer();dt.items.add(file);input.files=dt.files}catch(_e){}}});
  drop.addEventListener("keydown",e=>{if((e.key==="Enter"||e.key===" ")&&!state.uploadInFlight&&e.target===drop){e.preventDefault();input.click()}});
}
function clearDoc(){state.existingStoragePath="";$("saveDocBtn").textContent="Upload PDF and publish record";
  state.editingDocId="";state.selectedPdfFile=null;state.pendingUpload=null;state.uploadRequestId="";state.uploadInFlight=false;$("editorTitle").textContent="Add document / new revision";
  ["title","shortTitle","documentCode","revision","effectiveDate","tags","summary","searchText"].forEach(id=>$(id).value="");
  $("owner").value="SKANDI Travels";$("pageCount").value="1";$("documentType").value="Manual";$("publishStatus").value="PUBLISHED";$("requiresAcknowledgement").value="false";$("isCritical").value="false";
  setSelectedCodes("services",["ALL"]);setSelectedCodes("markets",["ALL"]);setSelectedCodes("audiences",["ALL"]);
  const input=$("docControlUploadButton");if(input){input.value="";input.disabled=false;}$("saveDocBtn").disabled=false;
  fileState("No PDF selected");$("uploadEngineStatus").textContent="PDF validation occurs before the Supabase upload request.";
  if($("publicTemplateAccess"))$("publicTemplateAccess").value="HIDDEN";
  if($("customerInstanceAccess"))$("customerInstanceAccess").value="NONE";
  if($("allowBlankDownload"))$("allowBlankDownload").value="false";
  if($("allowBlankFill"))$("allowBlankFill").value="false";
  if($("allowSelfStart"))$("allowSelfStart").value="false";
  if($("reservationsAvailable"))$("reservationsAvailable").value="false";
  if($("departureControlAvailable"))$("departureControlAvailable").value="false";
  if($("docunetAvailable"))$("docunetAvailable").value="true";
  if($("sensitivityClass"))$("sensitivityClass").value="STANDARD";
  if($("officialSourceUrl"))$("officialSourceUrl").value="";
}
function editDoc(id,revisionMode){state.existingStoragePath="";$("saveDocBtn").textContent="Upload PDF and publish record";
  const d=state.documents.find(x=>x._id===id)||{};
  activePanel("editor");state.editingDocId=id;
  $("editorTitle").textContent=revisionMode?"Add new revision":"Adjust document";
  $("title").value=d.title||"";$("shortTitle").value=d.shortTitle||d.short||"";$("documentCode").value=d.documentCode||d.code||"";$("owner").value=d.owner||"SKANDI Travels";$("revision").value=revisionMode?"":(d.revision||"");$("pageCount").value=Number(d.pageCount||d.pages||1);
  $("documentType").value=d.documentType||"Manual";$("category").value=d.category||d.group||"";
  setSelectedCodes("services",d.services||d.applicability?.services||["ALL"]);setSelectedCodes("markets",d.markets||d.applicability?.markets||["ALL"]);setSelectedCodes("audiences",normalizedAudienceValues(d));
  $("effectiveDate").value=d.effectiveDate?String(d.effectiveDate).slice(0,10):"";$("publishStatus").value=d.publishStatus==="ARCHIVED"?"DRAFT":(d.publishStatus||"PUBLISHED");
  $("tags").value=arr(d.tags).join(", ");$("requiresAcknowledgement").value=String(!!d.requiresAcknowledgement);$("isCritical").value=String(!!d.isCritical);$("summary").value=d.summary||"";$("searchText").value=d.searchText||"";const ap=d.accessPolicy||{};if($("publicTemplateAccess"))$("publicTemplateAccess").value=ap.publicTemplateAccess||d.publicTemplateAccess||"HIDDEN";if($("customerInstanceAccess"))$("customerInstanceAccess").value=ap.customerInstanceAccess||d.customerInstanceAccess||"NONE";if($("allowBlankDownload"))$("allowBlankDownload").value=String(!!(ap.allowBlankDownload??d.allowBlankDownload));if($("allowBlankFill"))$("allowBlankFill").value=String(!!(ap.allowBlankFill??d.allowBlankFill));if($("allowSelfStart"))$("allowSelfStart").value=String(!!(ap.allowSelfStart??d.allowSelfStart));if($("reservationsAvailable"))$("reservationsAvailable").value=String(!!(ap.reservationsAvailable??d.reservationsAvailable));if($("departureControlAvailable"))$("departureControlAvailable").value=String(!!(ap.departureControlAvailable??d.departureControlAvailable));if($("docunetAvailable"))$("docunetAvailable").value=String(ap.docunetAvailable??d.docunetAvailable??true);if($("sensitivityClass"))$("sensitivityClass").value=ap.sensitivityClass||d.sensitivityClass||"STANDARD";if($("officialSourceUrl"))$("officialSourceUrl").value=ap.officialSourceUrl||d.officialSourceUrl||"";
  status(revisionMode?"Select a PDF and enter the new revision before saving.":"Adjust metadata, or select a PDF to replace/add a revision.","warn");
}
function collectDoc(){
  const services=selectedCodes("services"),markets=selectedCodes("markets"),audiences=selectedCodes("audiences");
  const metadata={documentId:state.editingDocId,title:$("title").value.trim(),shortTitle:$("shortTitle").value.trim(),documentCode:$("documentCode").value.trim(),owner:$("owner").value.trim()||"SKANDI Travels",revision:$("revision").value.trim(),documentType:$("documentType").value,category:$("category").value,group:$("category").value,services,markets,audiences,audience:audiences.join(","),applicability:{services,markets,audiences},effectiveDate:$("effectiveDate").value,publishStatus:$("publishStatus").value,pageCount:Math.max(1,Number($("pageCount").value||1)),pages:Math.max(1,Number($("pageCount").value||1)),tags:arr($("tags").value),requiresAcknowledgement:$("requiresAcknowledgement").value==="true",isCritical:$("isCritical").value==="true",summary:$("summary").value.trim(),searchText:$("searchText").value.trim(),schemaVersion:SCHEMA_VERSION};
  metadata.accessPolicy={publicTemplateAccess:$("publicTemplateAccess")?.value||"HIDDEN",customerInstanceAccess:$("customerInstanceAccess")?.value||"NONE",allowBlankDownload:$("allowBlankDownload")?.value==="true",allowBlankFill:$("allowBlankFill")?.value==="true",allowSelfStart:$("allowSelfStart")?.value==="true",reservationsAvailable:$("reservationsAvailable")?.value==="true",departureControlAvailable:$("departureControlAvailable")?.value==="true",docunetAvailable:$("docunetAvailable")?.value!=="false",docunetAdminAvailable:true,sensitivityClass:$("sensitivityClass")?.value||"STANDARD",officialSourceUrl:$("officialSourceUrl")?.value.trim()||""};metadata.viewerMapping={id:metadata.documentId||metadata.documentCode.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""),code:metadata.documentCode,title:metadata.title,short:metadata.shortTitle||metadata.title,group:metadata.group,owner:metadata.owner,revision:metadata.revision,revisionDate:metadata.effectiveDate,status:metadata.publishStatus==="PUBLISHED"?"Active":metadata.publishStatus==="ARCHIVED"?"Archived":"Draft",updated:true,services,markets,audiences,pages:metadata.pages};
  return metadata;
}
function renderCategories(){
  setCategoryOptions();
  if(!state.categories.length){$("catTable").innerHTML=`<p>No categories yet.</p>`;return;}
  $("catTable").innerHTML=state.categories.map(c=>`
    <article class="row">
      <div>
        <div class="meta"><span class="pill ${c.active===false?"red":"green"}">${c.active===false?"Hidden":"Active"}</span><span class="pill gray">Order ${esc(c.sortOrder??"")}</span></div>
        <h3>${esc(c.title||c.name)}</h3><p>${esc(c.description||"")}</p>
      </div>
      <div class="actions"><button class="btn secondary" data-catedit="${esc(c._id)}">Adjust</button><button class="btn danger" data-catdelete="${esc(c._id)}">Delete</button></div>
    </article>`).join("");
  document.querySelectorAll("[data-catedit]").forEach(b=>b.onclick=()=>editCat(b.dataset.catedit));
  document.querySelectorAll("[data-catdelete]").forEach(b=>b.onclick=()=>{if(confirm("Delete category? Documents keep their category text but this folder option is removed."))post("ADMIN_CATEGORY_DELETE",{categoryId:b.dataset.catdelete})});
}
function clearCat(){state.editingCatId="";$("catEditorTitle").textContent="Add category";$("catTitle").value="";$("catDescription").value="";$("catSortOrder").value="10";$("catActive").value="true"}
function editCat(id){const c=state.categories.find(x=>x._id===id)||{};state.editingCatId=id;$("catEditorTitle").textContent="Adjust category";$("catTitle").value=c.title||c.name||"";$("catDescription").value=c.description||"";$("catSortOrder").value=c.sortOrder||10;$("catActive").value=String(c.active!==false)}
function collectCat(){return {categoryId:state.editingCatId,title:$("catTitle").value.trim(),description:$("catDescription").value.trim(),sortOrder:Number($("catSortOrder").value||0),active:$("catActive").value==="true"}}

function refreshStorage(){
  const query=$('storageQuery').value.trim();
  $('storageSummary').textContent='Reading the private Supabase bucket…';
  post('ADMIN_STORAGE_LIST',{filters:{search:query}});
}
function storagePreview(path){post('ADMIN_STORAGE_PREVIEW',{path});}
function renderStorage(data={}){
  state.storageFiles=data.files||[];
  $('storageSummary').textContent=`${state.storageFiles.length} PDF object(s) found in ${data.bucket||'docunet-controlled'}${data.truncated?' · listing capped; narrow the search':''}. Published DocuNet documents are managed in Document register.`;
  $('storageTable').innerHTML=state.storageFiles.length?state.storageFiles.map(f=>`
    <article class="row">
      <div><h3>${esc(f.name)}</h3><p>${esc(f.path)} · ${Number(f.bytes||0).toLocaleString()} bytes</p>
        <p>${f.registered?'Registered revision':'Not in DocuNet'}${f.linkedElsewhere?' · Linked in another system':''}</p></div>
      <div class="actions">
        <button class="btn secondary" data-store-preview="${esc(f.path)}">Preview</button>
        <button class="btn secondary" data-store-register="${esc(f.path)}" ${f.registered?'disabled':''}>Register draft</button>
        <button class="btn secondary" data-store-move="${esc(f.path)}" ${f.linkedElsewhere?'disabled':''}>Rename / move</button>
        <button class="btn danger" data-store-delete="${esc(f.path)}" ${(f.registered||f.linkedElsewhere)?'disabled':''}>Delete PDF</button>
      </div>
    </article>`).join(''):'<div class="card"><p>No PDF objects match this search.</p></div>';
  document.querySelectorAll('[data-store-preview]').forEach(b=>b.onclick=()=>storagePreview(b.dataset.storePreview));
  document.querySelectorAll('[data-store-register]').forEach(b=>b.onclick=()=>{
    const path=b.dataset.storeRegister,filename=path.split('/').pop();
    clearDoc();state.existingStoragePath=path;activePanel('editor');
    $('title').value=filename.replace(/\.pdf$/i,'').replace(/[-_]/g,' ');
    $('documentCode').value=filename.replace(/\.pdf$/i,'').replace(/[^a-z0-9]/gi,'-').replace(/^-|-$/g,'').toUpperCase().slice(0,40);
    $('revision').value='1.0';$('publishStatus').value='DRAFT';
    $('editorTitle').textContent='Register existing Supabase PDF as draft';
    $('saveDocBtn').textContent='Register existing PDF as draft';
    status('Review document metadata and audience settings. This action does not re-upload or automatically publish the source PDF.','warn');
  });
  document.querySelectorAll('[data-store-move]').forEach(b=>b.onclick=()=>{
    const path=b.dataset.storeMove;
    const target=prompt('Enter the complete new PDF path (folder/filename.pdf). The original path will be retired only after references have been updated.',path);
    if(target&&target!==path&&confirm(`Move this PDF?\n${path}\n→ ${target}`)){
      status('Copying PDF and updating revision references…');post('ADMIN_STORAGE_MOVE',{path,destinationPath:target});
    }
  });
  document.querySelectorAll('[data-store-delete]').forEach(b=>b.onclick=()=>{
    const path=b.dataset.storeDelete;
    if(confirm(`PERMANENTLY delete this unregistered, unreferenced PDF from Supabase Storage?\n${path}\nThis cannot be undone.`)){
      status('Checking references before physical deletion…');post('ADMIN_STORAGE_DELETE',{path});
    }
  });
}
function registerExistingStoragePdf(){
  const metadata=collectDoc();
  if(!metadata.documentCode||!metadata.title||!metadata.revision)return status('Document code, title and revision are required.','warn');
  if(!confirm(`Register ${state.existingStoragePath} as a DRAFT? It will not be automatically published.`))return;
  status('Validating stored PDF with Adobe and registering a controlled draft…');
  post('ADMIN_STORAGE_REGISTER',{path:state.existingStoragePath,metadata:{...metadata,publishStatus:'DRAFT'}});
}

function renderAudit(payload){
  state.audit=payload.events||[];
  $("auditTable").innerHTML=state.audit.length?state.audit.map(a=>`<article class="row"><div><div class="meta"><span class="pill">${esc(a.eventType)}</span><span class="pill gray">${esc(fmt(a.createdAt))}</span></div><h3>${esc(a.staffName||a.staffEmail||"System")}</h3><p>${esc(JSON.stringify(a.payload||{}))}</p></div></article>`).join(""):`<div class="card"><p>No audit events found.</p></div>`;
}
document.querySelectorAll("[data-panel]").forEach(b=>b.onclick=()=>activePanel(b.dataset.panel));
$("refreshBtn").onclick=load;$("staffPageBtn").onclick=()=>post("ADMIN_NAVIGATE_STAFF");$("searchDocsBtn").onclick=searchDocs;$("docQuery").addEventListener("keydown",e=>{if(e.key==="Enter")searchDocs()});
["docCategory","docStatus","docType","docService","docMarket","docAudience"].forEach(id=>$(id).onchange=searchDocs);
$("saveDocBtn").onclick=()=>state.existingStoragePath?registerExistingStoragePdf():requestSupabaseUpload();
$("storageRefreshBtn").onclick=refreshStorage;$("storageQuery").addEventListener("keydown",e=>{if(e.key==="Enter")refreshStorage()});
$("saveMetaBtn").onclick=()=>{const meta=collectDoc();if(!meta.title||!meta.documentCode)return status("Title and code are required.","warn");status("Saving metadata...");post("ADMIN_DOC_SAVE_METADATA",{metadata:meta})};
$("clearDocBtn").onclick=clearDoc;$("saveCatBtn").onclick=()=>{const category=collectCat();if(!category.title)return status("Category title is required.","warn");post("ADMIN_CATEGORY_SAVE",{category})};$("clearCatBtn").onclick=clearCat;
$("closeViewerBtn").onclick=()=>{$("viewer").classList.remove("open");$("pdfFrame").src=""};$("openFullBtn").onclick=()=>state.previewUrl?window.open(state.previewUrl,"_blank"):"";
window.addEventListener("message",e=>{
  const m=e.data||{};if(!String(m.type||"").startsWith("ADMIN_"))return;
  if(m.type==="ADMIN_BOOTSTRAP_RESULT")renderBootstrap(m.payload||{});
  if(m.type==="ADMIN_SUPABASE_UPLOAD_READY")uploadToSupabase(m.payload||m);
  if(m.type==="ADMIN_SUPABASE_UPLOAD_ERROR"){setUploadBusy(false);fileState(m.message||"Supabase upload authorization failed.","error");status(m.message||"Supabase upload authorization failed.","error");}
  if(m.type==="ADMIN_DOC_SEARCH_RESULT")renderDocs(m.payload||{documents:[]});
  if(m.type==="ADMIN_DOC_PREVIEW_RESULT"){const p=m.payload||{};if(p.signedUrl)preview(p.signedUrl,p.title||"Document preview");else status("Preview URL was not returned.","error");}
  if(m.type==="ADMIN_CATEGORIES_RESULT"){state.categories=m.payload.categories||[];renderCategories();status(m.message||"Categories updated.","ok");}
  if(m.type==="ADMIN_DOC_RESULT"){status(m.message||"Document saved.","ok");clearDoc();activePanel("documents");searchDocs();post("ADMIN_AUDIT_SEARCH",{});}
  if(m.type==="ADMIN_STORAGE_LIST_RESULT")renderStorage(m.payload||{});
  if(m.type==="ADMIN_STORAGE_PREVIEW_RESULT"){const p=m.payload||{};if(p.signedUrl)preview(p.signedUrl,p.title||"PDF preview");else status("Storage PDF preview URL unavailable.","error");}
  if(m.type==="ADMIN_STORAGE_REGISTER_RESULT"){state.existingStoragePath="";clearDoc();status(m.message||"Existing PDF registered as draft.","ok");activePanel("storage");post("ADMIN_SEARCH_DOCS",{filters:{}});post("ADMIN_AUDIT_SEARCH",{});}
  if(m.type==="ADMIN_STORAGE_MUTATION_RESULT"){status(m.message||"Storage file updated.","ok");refreshStorage();post("ADMIN_SEARCH_DOCS",{filters:{}});post("ADMIN_AUDIT_SEARCH",{});}
  if(m.type==="ADMIN_AUDIT_RESULT")renderAudit(m.payload||{events:[]});
  if(m.type==="ADMIN_ERROR"){setUploadBusy(false);status(m.message||"Admin action failed.","error");}
});
bindPdfUpload();
initLocalUtilities();
post("ADMIN_READY",{storageProvider:"SUPABASE",htmlUploadControl:"docControlUploadButton",viewerSchema:{version:SCHEMA_VERSION,fields:["id","code","title","short","group","owner","revision","revisionDate","status","updated","services","markets","audiences","pages"]}});
