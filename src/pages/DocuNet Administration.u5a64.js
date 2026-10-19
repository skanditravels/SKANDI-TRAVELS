import wixLocation from "wix-location-frontend";
import {
  getDocuNetAdminBootstrap,setDocuNetDocumentStatus,deleteDocuNetDocument,saveDocuNetCategory,
  deleteDocuNetCategory,searchDocuNetAudit,searchDocuNetAdminDocuments,createDocuNetUpload,
  finalizeDocuNetUpload,saveDocuNetMetadata,getDocuNetAdminPreview,
  listDocuNetStorage,getDocuNetStoragePreview,registerDocuNetStoredPdf,
  renameDocuNetStorageObject,deleteDocuNetUnregisteredStorageObject
} from "backend/SKANDI_CORE/docuNet.web";
const SOURCE="SKANDI_DOCUNET_ADMIN",PARENT="SKANDI_WIX_PARENT",HTML_ID="#docuNetAdminEmbed",STAFF_PATH="/riaintra/success-factors/docunet";
const send=(html,type,payload={},message="")=>html.postMessage({source:PARENT,type,payload,...(message?{message}:{}),timestamp:new Date().toISOString()});
async function categories(){const b=await getDocuNetAdminBootstrap();return{categories:b.categories||[]}}
$w.onReady(()=>{const html=$w(HTML_ID);html.onMessage(async event=>{const m=event.data||{};if(m.source!==SOURCE)return;try{let p;switch(m.type){
case"ADMIN_READY":case"ADMIN_BOOTSTRAP":send(html,"ADMIN_BOOTSTRAP_RESULT",await getDocuNetAdminBootstrap());return;
case"ADMIN_SEARCH_DOCS":send(html,"ADMIN_DOC_SEARCH_RESULT",await searchDocuNetAdminDocuments(m.filters||m.payload||{}));return;
case"ADMIN_SUPABASE_UPLOAD_INIT":p=await createDocuNetUpload({requestId:m.requestId,metadata:m.metadata||{},file:m.file||{}});send(html,"ADMIN_SUPABASE_UPLOAD_READY",p);return;
case"ADMIN_DOC_SAVE_WITH_UPLOAD":p=await finalizeDocuNetUpload({requestId:m.requestId});send(html,"ADMIN_DOC_RESULT",p,"Document revision saved and synchronized.");return;
case"ADMIN_DOC_SAVE_METADATA":p=await saveDocuNetMetadata(m.metadata||{});send(html,"ADMIN_DOC_RESULT",p,"Document metadata saved and synchronized.");return;
case"ADMIN_DOC_STATUS":p=await setDocuNetDocumentStatus({documentId:m.documentId,publishStatus:m.publishStatus});send(html,"ADMIN_DOC_RESULT",p,"Document status updated.");return;
case"ADMIN_DOC_DELETE":p=await deleteDocuNetDocument({documentId:m.documentId});send(html,"ADMIN_DOC_RESULT",p,"Document removed from the active register; revisions retained.");return;
case"ADMIN_DOC_PREVIEW":p=await getDocuNetAdminPreview({documentId:m.documentId});send(html,"ADMIN_DOC_PREVIEW_RESULT",{...p,title:m.title||p.title});return;
case"ADMIN_CATEGORY_SAVE":await saveDocuNetCategory(m.category||{});send(html,"ADMIN_CATEGORIES_RESULT",await categories(),"Category saved.");return;
case"ADMIN_CATEGORY_DELETE":await deleteDocuNetCategory({categoryId:m.categoryId});send(html,"ADMIN_CATEGORIES_RESULT",await categories(),"Category deleted.");return;
case"ADMIN_AUDIT_SEARCH":send(html,"ADMIN_AUDIT_RESULT",await searchDocuNetAudit());return;
case"ADMIN_STORAGE_LIST":send(html,"ADMIN_STORAGE_LIST_RESULT",await listDocuNetStorage(m.filters||{}));return;
case"ADMIN_STORAGE_PREVIEW":send(html,"ADMIN_STORAGE_PREVIEW_RESULT",await getDocuNetStoragePreview({path:m.path}));return;
case"ADMIN_STORAGE_REGISTER":p=await registerDocuNetStoredPdf({path:m.path,metadata:m.metadata||{}});send(html,"ADMIN_STORAGE_REGISTER_RESULT",p,"Existing PDF registered as a draft. Review it before publishing.");return;
case"ADMIN_STORAGE_MOVE":p=await renameDocuNetStorageObject({path:m.path,destinationPath:m.destinationPath});send(html,"ADMIN_STORAGE_MUTATION_RESULT",p,"PDF renamed/moved and references updated.");return;
case"ADMIN_STORAGE_DELETE":p=await deleteDocuNetUnregisteredStorageObject({path:m.path});send(html,"ADMIN_STORAGE_MUTATION_RESULT",p,"Unregistered PDF permanently deleted.");return;
case"ADMIN_NAVIGATE_STAFF":wixLocation.to(STAFF_PATH);return;
case"NAVIGATE":if(m.path)wixLocation.to(m.path);return;
}}catch(error){send(html,m.type==="ADMIN_SUPABASE_UPLOAD_INIT"?"ADMIN_SUPABASE_UPLOAD_ERROR":"ADMIN_ERROR",{},error?.message||"DocuNet Admin action failed.")}})});
