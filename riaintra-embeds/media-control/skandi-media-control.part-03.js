
(()=>{"use strict";
const SOURCE="SKANDI_MEDIA_CONTROL",PARENT="SKANDI_WIX_PARENT";
const $=id=>document.getElementById(id);
const esc=v=>String(v??"").replace(/[&<>"']/g,s=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[s]));
const media={assets:[],buckets:[],target:null,pending:null,pendingAccess:null,bucket:"",query:"",requested:false};

function post(type,payload={}){window.parent.postMessage({source:SOURCE,type,payload,timestamp:new Date().toISOString()},"*")}
function toast(t){const e=$("skMediaToast");if(!e)return;e.textContent=t;e.style.display="block";clearTimeout(toast.t);toast.t=setTimeout(()=>e.style.display="none",2300)}
function bytes(n){n=Number(n||0);if(!n)return"0 B";const u=["B","KB","MB","GB"];let i=0;while(n>=1024&&i<u.length-1){n/=1024;i++}return`${n.toFixed(i?1:0)} ${u[i]}`}
function isPublicAsset(a){return a?.public===true||String(a?.visibility||"").toUpperCase()==="PUBLIC"}
function isImageAsset(a){return a?.isImage===true||String(a?.assetType||"").toUpperCase()==="IMAGE"||String(a?.mimeType||"").toLowerCase().startsWith("image/")}
function normalizeAsset(a={}){
  const publicAsset=isPublicAsset(a);
  const publicUrl=a.publicUrl||a.previewUrl||a.imageUrl||a.url||a.readUrl||"";
  return{
    ...a,
    assetId:a.assetId||a.id||"",
    public:publicAsset,
    isImage:isImageAsset(a),
    imageUrl:publicAsset?publicUrl:(a.imageUrl||""),
    readUrl:a.readUrl||a.previewUrl||a.publicUrl||a.url||"",
    url:a.url||a.publicUrl||a.previewUrl||a.readUrl||"",
    path:a.path||a.storagePath||"",
    name:a.name||a.displayName||a.originalName||a.assetCode||"Asset",
    size:Number(a.size??a.sizeBytes??0),
    bucket:a.bucket||""
  }
}
function deriveBuckets(assets){
  const map=new Map();
  assets.forEach(a=>{
    const id=String(a.bucket||"").trim();
    if(!id)return;
    const prior=map.get(id);
    if(!prior)map.set(id,{id,name:id,public:isPublicAsset(a)});
    else if(isPublicAsset(a))prior.public=true
  });
  return[...map.values()].sort((a,b)=>a.name.localeCompare(b.name))
}
function requestMedia(){media.requested=true;post("VOY_MEDIA_LIBRARY_REQUEST",{search:media.query||""})}
function fieldTargetFor(input){if(input.id==="issueCoverImage")return"issue:cover";if(input.id==="pageImageUrl")return"page:imageUrl";if(input.id==="pageSecondaryImageUrl")return"page:secondaryImageUrl";if(input.id==="cardImageUrl")return"travelCard:imageUrl";if(input.id==="newsPostImage")return"newsPost:heroImage";if(input.id==="webMediaUrl")return"website:media";if(input.dataset.blockField&&input.dataset.blockIndex!==undefined)return`block:${input.dataset.blockIndex}:${input.dataset.blockField}`;return""}
function changeLabel(field){const label=field?.querySelector(".label");if(!label)return;label.textContent=label.textContent.replace(/\s*URL\s*$/i," asset").replace(/image url/ig,"image asset").replace(/logo url/ig,"logo asset")}
function enhanceInput(input){
  if(!input||input.dataset.supabaseAsset==="1")return;
  const target=fieldTargetFor(input);if(!target)return;
  input.dataset.supabaseAsset="1";input.readOnly=true;input.classList.add("sk-media-locked");input.placeholder="Select or upload a Supabase asset";
  const field=input.closest(".field");changeLabel(field);
  const row=document.createElement("div");row.className="sk-media-field-actions";
  row.innerHTML=`${input.value?`<img class="sk-media-mini" src="${esc(input.value)}" alt="">`:""}<button type="button" class="btn" data-sk-media-choose="${esc(target)}">Choose asset</button><button type="button" class="btn" data-sk-media-upload="${esc(target)}">Upload</button>`;
  field?.appendChild(row)
}
function enhanceFields(){
  ["issueCoverImage","pageImageUrl","pageSecondaryImageUrl","cardImageUrl","newsPostImage"].forEach(id=>enhanceInput($(id)));
  document.querySelectorAll("[data-block-field='imageUrl'],[data-block-field='logoUrl'],[data-block-field='secondaryLogoUrl']").forEach(enhanceInput);
  const assetsPanel=document.querySelector("#panel-assets .panel.scroll:last-child");
  if(assetsPanel&&!assetsPanel.querySelector("[data-sk-media-library]")){
    const box=document.createElement("div");box.dataset.skMediaLibrary="1";
    box.innerHTML=`<div class="row" style="margin-bottom:8px"><button class="btn" type="button" data-sk-media-refresh>Refresh Supabase assets</button><button class="btn primary" type="button" data-sk-media-upload="library">Upload image</button><button class="btn dark" type="button" data-sk-media-open-control>Open Media Control</button></div><div class="sk-media-buckets" data-sk-media-buckets></div><div class="sk-media-grid" data-sk-media-assets></div>`;
    assetsPanel.prepend(box);requestMedia()
  }
}
function usable(a){return a&&isPublicAsset(a)&&isImageAsset(a)&&!!(a.imageUrl||a.url||a.readUrl)}
function card(a,selectable=false){
  const url=a.readUrl||a.imageUrl||a.url||"";
  return `<article class="sk-media-card"><div class="sk-media-thumb">${a.isImage&&url?`<img src="${esc(url)}" alt="${esc(a.name||"Asset")}">`:`<span>${esc((a.mimeType||"FILE").split("/").pop().toUpperCase())}</span>`}</div><div class="sk-media-card-body"><div class="sk-media-card-title" title="${esc(a.path||"")}">${esc(a.name||a.path||"Asset")}</div><div class="sk-media-card-meta"><span class="${a.public?"sk-media-public":"sk-media-private"}">${a.public?"Public":"Private"}</span> · ${esc(a.bucket||"")}<br>${esc(a.path||"")}<br>${esc(a.mimeType||"")} · ${bytes(a.size)}</div><div class="row" style="margin-top:5px">${a.assetId?`<button type="button" class="btn" data-sk-media-preview="${esc(a.assetId)}">Preview</button>`:""}${selectable&&usable(a)?`<button type="button" class="btn primary" data-sk-media-use="${esc(a.assetId)}">Use asset</button>`:""}${selectable&&!usable(a)?`<span class="help">${a.public?"Not an image":"Private · view only"}</span>`:""}</div></div></article>`
}
function filteredAssets(){const q=(media.query||"").toLowerCase();return media.assets.filter(a=>(!media.bucket||a.bucket===media.bucket)&&(!q||[a.bucket,a.path,a.name,a.mimeType,a.libraryRoot,a.libraryFolder,a.category,a.brand,a.system,...(Array.isArray(a.tags)?a.tags:[])].join(" ").toLowerCase().includes(q)))}
function renderEmbeddedLibrary(){const bhost=document.querySelector("[data-sk-media-buckets]");const ahost=document.querySelector("[data-sk-media-assets]");if(bhost)bhost.innerHTML=`<button type="button" class="sk-media-bucket ${!media.bucket?"active":""}" data-sk-media-bucket="">All</button>`+media.buckets.map(b=>`<button type="button" class="sk-media-bucket ${media.bucket===b.id?"active":""}" data-sk-media-bucket="${esc(b.id)}">${esc(b.name||b.id)} · ${b.public?"public":"private"}</button>`).join("");if(ahost){const rows=filteredAssets().slice(0,80);ahost.innerHTML=rows.length?rows.map(a=>card(a,true)).join(""):`<div class="empty">${media.requested?"No Supabase assets match this view.":"Loading Supabase assets…"}</div>`}}
function renderPicker(){const sel=$("skMediaBucketFilter");if(sel){const val=sel.value||media.bucket;sel.innerHTML=`<option value="">All buckets</option>`+media.buckets.map(b=>`<option value="${esc(b.id)}">${esc(b.name||b.id)} · ${b.public?"public":"private"}</option>`).join("");sel.value=media.bucket||val||""}const grid=$("skMediaPickerGrid");if(grid){const rows=filteredAssets();grid.innerHTML=rows.length?rows.map(a=>card(a,true)).join(""):`<div class="empty">No assets found.</div>`}}
function openPicker(target){media.target=target||null;$("skMediaPicker")?.classList.add("show");$("skMediaPicker")?.setAttribute("aria-hidden","false");requestMedia()}
function closePicker(){$("skMediaPicker")?.classList.remove("show");$("skMediaPicker")?.setAttribute("aria-hidden","true")}
function targetInput(target){if(!target)return null;if(target==="issue:cover")return $("issueCoverImage");if(target==="page:imageUrl")return $("pageImageUrl");if(target==="page:secondaryImageUrl")return $("pageSecondaryImageUrl");if(target==="travelCard:imageUrl")return $("cardImageUrl");if(target==="newsPost:heroImage")return $("newsPostImage");if(target==="website:media")return $("webMediaUrl");const m=target.match(/^block:(\d+):(imageUrl|logoUrl|secondaryLogoUrl)$/);if(m)return document.querySelector(`[data-block-index="${m[1]}"][data-block-field="${m[2]}"]`);return null}
function applyAsset(raw){const asset=normalizeAsset(raw);if(!usable(asset)){toast(asset?.public?"Only image assets can be used here.":"Private bucket assets are view-only for public VOY content.");return}const input=targetInput(media.target);if(!input&&media.target!=="library"){toast("The target field is no longer open.");return}if(input){input.value=asset.imageUrl||asset.url||asset.readUrl||"";input.dispatchEvent(new Event("input",{bubbles:true}));input.dispatchEvent(new Event("change",{bubbles:true}));const actions=input.parentElement?.querySelector(".sk-media-field-actions");const img=actions?.querySelector(".sk-media-mini");if(img)img.src=input.value;else if(actions&&input.value){const pic=document.createElement("img");pic.className="sk-media-mini";pic.src=input.value;actions.prepend(pic)}}toast("Supabase asset selected.");closePicker()}
function chooseUpload(target){media.target=target||"library";$("skVoyMediaFile").value="";$("skVoyMediaFile").click()}
async function sha256(file){const hash=await crypto.subtle.digest("SHA-256",await file.arrayBuffer());return[...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,"0")).join("")}
function uploadPayload(file,hash,allowPossibleDuplicate=false){return{clientRequestId:media.pending?.clientRequestId||"",file:{name:file.name,type:file.type||"application/octet-stream",size:file.size},originalName:file.name,mimeType:file.type||"application/octet-stream",sizeBytes:file.size,sha256:hash,visibility:"PUBLIC",assetType:"IMAGE",libraryRoot:"VOY",libraryFolder:"Magazine",librarySubfolder:"Uploads",displayName:file.name,category:"IMAGE",brand:"SKANDI",system:"VOY",tags:["VOY","Magazine"],contextSystem:"VOY",contextRecordType:"MAGAZINE_MEDIA",fieldName:media.target||"library",allowPossibleDuplicate}}
async function startUpload(file){
  if(!file)return;
  const clientRequestId=`voy-media-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
  media.pending={clientRequestId,file,target:media.target,sha256:"",preparePayload:null};
  document.body.classList.add("sk-media-uploading");
  try{const hash=await sha256(file);media.pending.sha256=hash;media.pending.preparePayload=uploadPayload(file,hash,false);post("VOY_MEDIA_UPLOAD_CREATE",media.pending.preparePayload)}
  catch(err){document.body.classList.remove("sk-media-uploading");media.pending=null;toast(err.message||"Unable to prepare upload.")}
}
async function uploadSigned(p){
  if(!media.pending)return;
  const file=media.pending.file,upload=p.upload||{};
  if(!file||!upload.signedUrl)throw new Error("Upload authorization is incomplete.");
  media.pending.backendRequestId=p.requestId||"";
  const headers={"Content-Type":upload.contentType||file.type||"application/octet-stream"};if(upload.token)headers["x-upsert"]="false";
  const r=await fetch(upload.signedUrl,{method:upload.method||"PUT",headers,body:file});
  if(!r.ok)throw new Error(`Upload failed (${r.status})`);
  post("VOY_MEDIA_UPLOAD_FINALIZE",{requestId:p.requestId})
}
function requestPreview(raw){const asset=normalizeAsset(raw);const url=asset.readUrl||asset.imageUrl||asset.url||"";if(url){window.open(url,"_blank","noopener,noreferrer");return}if(!asset.assetId)return;media.pendingAccess={assetId:asset.assetId,purpose:"preview"};post("VOY_MEDIA_REFRESH_URL",{assetId:asset.assetId,expiresIn:600,purpose:"preview"})}

document.addEventListener("click",e=>{
  const old=e.target.closest('[data-action="open-asset-upload"]');if(old){e.preventDefault();e.stopImmediatePropagation();chooseUpload("library");return}
  const choose=e.target.closest("[data-sk-media-choose]");if(choose){e.preventDefault();e.stopImmediatePropagation();openPicker(choose.dataset.skMediaChoose);return}
  const upload=e.target.closest("[data-sk-media-upload]");if(upload){e.preventDefault();e.stopImmediatePropagation();chooseUpload(upload.dataset.skMediaUpload);return}
  const refresh=e.target.closest("[data-sk-media-refresh]");if(refresh){e.preventDefault();e.stopImmediatePropagation();requestMedia();return}
  const open=e.target.closest("[data-sk-media-open-control]");if(open){e.preventDefault();e.stopImmediatePropagation();post("VOY_OPEN_MEDIA_CONTROL",{});return}
  const b=e.target.closest("[data-sk-media-bucket]");if(b){media.bucket=b.dataset.skMediaBucket||"";renderEmbeddedLibrary();renderPicker();return}
  const use=e.target.closest("[data-sk-media-use]");if(use){applyAsset(media.assets.find(a=>String(a.assetId)===String(use.dataset.skMediaUse)));return}
  const pre=e.target.closest("[data-sk-media-preview]");if(pre){requestPreview(media.assets.find(a=>String(a.assetId)===String(pre.dataset.skMediaPreview)));return}
},true);

$("skMediaClose")?.addEventListener("click",closePicker);
$("skMediaRefresh")?.addEventListener("click",requestMedia);
$("skMediaUpload")?.addEventListener("click",()=>chooseUpload(media.target||"library"));
$("skMediaOpenControl")?.addEventListener("click",()=>post("VOY_OPEN_MEDIA_CONTROL",{}));
$("skMediaBucketFilter")?.addEventListener("change",e=>{media.bucket=e.target.value||"";renderEmbeddedLibrary();renderPicker()});
$("skMediaQuery")?.addEventListener("input",e=>{media.query=e.target.value||"";renderPicker();renderEmbeddedLibrary()});
$("skVoyMediaFile")?.addEventListener("change",e=>startUpload(e.target.files?.[0]));
$("skMediaPicker")?.addEventListener("click",e=>{if(e.target===$("skMediaPicker"))closePicker()});

window.addEventListener("message",async e=>{
  const m=e.data||{};if(m.source&&m.source!==PARENT)return;const p=m.payload||{};
  try{
    if(m.type==="VOY_MEDIA_LIBRARY_RESULT"){media.assets=(p.assets||[]).map(normalizeAsset);media.buckets=deriveBuckets(media.assets);media.requested=true;renderEmbeddedLibrary();renderPicker();return}
    if(m.type==="VOY_MEDIA_UPLOAD_READY"){
      if(!media.pending)return;
      if(p.duplicate){const existing=(p.exactDuplicates||[]).map(normalizeAsset)[0];document.body.classList.remove("sk-media-uploading");const target=media.pending.target;media.pending=null;if(existing){media.target=target;if(target==="library")toast("Existing identical asset reused.");else applyAsset(existing)}requestMedia();return}
      if(p.needsReview){const proceed=confirm("A possible existing legacy asset has the same file size/type. Upload another physical copy anyway?");if(!proceed){document.body.classList.remove("sk-media-uploading");media.pending=null;return}media.pending.preparePayload={...media.pending.preparePayload,allowPossibleDuplicate:true};post("VOY_MEDIA_UPLOAD_CREATE",media.pending.preparePayload);return}
      await uploadSigned(p);return
    }
    if(m.type==="VOY_MEDIA_UPLOAD_COMPLETE"){document.body.classList.remove("sk-media-uploading");const target=media.pending?.target;media.pending=null;if(p.asset){const asset=normalizeAsset(p.asset);media.target=target;if(target==="library")toast(p.duplicate?"Existing identical asset reused.":"Upload complete.");else applyAsset(asset)}requestMedia();return}
    if(m.type==="VOY_MEDIA_REFRESH_URL_RESULT"){const id=p.assetId||media.pendingAccess?.assetId||"";const a=media.assets.find(x=>String(x.assetId)===String(id));if(a&&p.url){a.readUrl=p.url;a.url=p.url;if(media.pendingAccess?.purpose==="preview")window.open(p.url,"_blank","noopener,noreferrer");renderEmbeddedLibrary();renderPicker()}media.pendingAccess=null;return}
    if(m.type==="VOY_ADMIN_ERROR"&&(["VOY_MEDIA_","VOY_ASSET_UPLOAD_"].some(prefix=>String(p.action||"").startsWith(prefix)))){document.body.classList.remove("sk-media-uploading");media.pending=null;toast(p.message||"Media Control error.");return}
  }catch(err){document.body.classList.remove("sk-media-uploading");media.pending=null;toast(err.message||"Media Control error.")}
});

let queued=false;const observer=new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;enhanceFields()})});observer.observe(document.body,{childList:true,subtree:true});enhanceFields();
})();
