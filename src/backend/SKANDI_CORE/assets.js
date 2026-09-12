// /src/backend/SKANDI_CORE/assets.js
// SKANDI Backend Base 1.0 — B-003 canonical Asset Library business logic.
//
// One physical file = one platform_assets row.
// Many systems/records may reference the same physical asset through platform_asset_usages.
// New uploads are allowed only to skandi-public-assets / skandi-private-assets.

import { randomUUID } from "crypto";
import {
  restRequest,
  storageCreateSignedUploadUrl,
  storageCreateSignedReadUrl,
  storageGetObjectInfo,
  storageGetPublicUrl
} from "backend/SKANDI_CORE/supabaseServer.js";
import { requireStaffPortalSessionCore } from "backend/SKANDI_CORE/staffAuth.js";

export const ASSET_CORE_VERSION = "BACKEND-BASE-1.0/B-003";

const PUBLIC_BUCKET = "skandi-public-assets";
const PRIVATE_BUCKET = "skandi-private-assets";
const ACTIVE = "ACTIVE";
const LIBRARY_ROOTS = new Set([
  "SKANDI","AIRLINES","AIRCRAFT","AIRPORTS","COUNTRIES","DESTINATIONS","AREAS",
  "HOTELS","TRANSFERS","TOURS","ACTIVITIES","TICKETS","CAR RENTAL","SUPPLIERS",
  "PARTNERS","EMPLOYEES","UNIFORMS","VOY"
]);
const MAX_PUBLIC_BYTES = 100 * 1024 * 1024;
const MAX_PRIVATE_BYTES = 200 * 1024 * 1024;

const PUBLIC_MIME = new Set([
  "image/jpeg","image/png","image/webp","image/avif","image/gif","image/svg+xml",
  "application/pdf","video/mp4","video/webm","audio/mpeg","audio/wav"
]);
const PRIVATE_MIME = new Set([
  ...PUBLIC_MIME,
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain","text/csv","application/json"
]);

const clean=(v,max=10000)=>String(v??"").trim().slice(0,max);
const upper=(v,max=10000)=>clean(v,max).toUpperCase();
const lower=(v,max=10000)=>clean(v,max).toLowerCase();
const arr=v=>Array.isArray(v)?v:[];
const obj=v=>v&&typeof v==="object"&&!Array.isArray(v)?v:{};
const isUuid=v=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(clean(v,80));
const qeq=v=>`eq.${clean(v,500)}`;

function uniqueStrings(value){
  return [...new Set(arr(value).map(x=>clean(x,300)).filter(Boolean))];
}
function slugSegment(value,fallback="general"){
  const out=lower(value,240)
    .normalize("NFKD").replace(/[\u0300-\u036f]/g,"")
    .replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,120);
  return out||fallback;
}
function safeFileName(name){
  const input=clean(name,240).normalize("NFKD").replace(/[\u0300-\u036f]/g,"");
  const dot=input.lastIndexOf(".");
  const rawBase=dot>0?input.slice(0,dot):input;
  const rawExt=dot>0?input.slice(dot+1):"";
  const base=slugSegment(rawBase,"asset").slice(0,140);
  const ext=rawExt.replace(/[^a-z0-9]/gi,"").toLowerCase().slice(0,12);
  return ext?`${base}.${ext}`:base;
}
function extensionOf(name){
  const safe=safeFileName(name);
  const i=safe.lastIndexOf(".");
  return i>0?safe.slice(i+1):"";
}
function classifyAssetType(mime,name=""){
  const m=lower(mime,180);
  if(m.startsWith("image/"))return"IMAGE";
  if(m.startsWith("video/"))return"VIDEO";
  if(m.startsWith("audio/"))return"AUDIO";
  if(m==="application/pdf")return"DOCUMENT";
  if(/\.(doc|docx|xls|xlsx|ppt|pptx|csv|txt|json)$/i.test(name))return"DOCUMENT";
  return"OTHER";
}
function publicAssetUrl(asset){
  return clean(asset.public_url,5000);
}
function normalizeAsset(row={}){
  return{
    id:clean(row.id,80),assetCode:clean(row.asset_code,120),
    bucket:clean(row.bucket,120),storagePath:clean(row.storage_path,3000),
    visibility:upper(row.visibility,20),assetType:upper(row.asset_type,30),
    mimeType:lower(row.mime_type,180),originalName:clean(row.original_name,300),
    displayName:clean(row.display_name,300),extension:lower(row.extension,20),
    sizeBytes:Number(row.size_bytes||0),sha256:lower(row.sha256,80),
    legacyEtag:clean(row.legacy_etag,300),libraryRoot:clean(row.library_root,180),
    libraryFolder:clean(row.library_folder,240),librarySubfolder:clean(row.library_subfolder,500),
    folderPath:clean(row.folder_path,1000),category:clean(row.category,180),
    brand:clean(row.brand,180),system:clean(row.system,180),tags:arr(row.tags),
    altText:clean(row.alt_text,1000),caption:clean(row.caption,3000),credit:clean(row.credit,500),
    widthPx:row.width_px??null,heightPx:row.height_px??null,status:upper(row.status,30),
    source:clean(row.source,120),publicUrl:publicAssetUrl(row),
    previewUrl:row.visibility==="PUBLIC"?publicAssetUrl(row):"",
    createdAt:row.created_at||"",updatedAt:row.updated_at||""
  };
}
function actorId(session){return isUuid(session?.profile?.id)?session.profile.id:null}

async function requireAssetAccess({write=false}={}){
  const session=await requireStaffPortalSessionCore();
  if(!write)return session;

  const profile=obj(session.profile);
  const keys=new Set([
    ...arr(session.permissionKeys),...arr(session.permissions),...arr(session.allowedApps),
    ...arr(session.permissionGroups),...arr(profile.permissionKeys),...arr(profile.allowedApps),
    ...arr(profile.permissionGroups)
  ].map(x=>lower(typeof x==="string"?x:(x?.id||x?.key||x?.permission),160)).filter(Boolean));

  const canWrite =
    lower(session.permissionPreset||profile.permissionPreset,80)==="all" ||
    session.canManage===true || profile.canManage===true ||
    ["system-admin","asset-library","inventory-control","marketing","content","newsroom",
     "docunet","uniform-center","hr","travel-info"].some(k=>keys.has(k));

  if(!canWrite){
    const e=new Error("ASSET_WRITE_ACCESS_DENIED");e.code="ASSET_WRITE_ACCESS_DENIED";throw e;
  }
  return session;
}
async function select(table,query={}){
  const rows=await restRequest({table,method:"GET",query,prefer:""});
  return arr(rows);
}
async function readAsset(id){
  const row=(await select("platform_assets",{select:"*",id:qeq(id),limit:"1"}))[0];
  if(!row)throw new Error("ASSET_NOT_FOUND");
  return row;
}
function dedupeKey(row={}){
  if(clean(row.sha256,80))return`SHA:${lower(row.sha256,80)}`;
  if(clean(row.legacy_etag,300)&&Number(row.size_bytes||0)>0){
    return`LEG:${clean(row.legacy_etag,300)}:${Number(row.size_bytes)}`;
  }
  return"";
}
async function possibleLegacyMatches({sizeBytes,mimeType,originalName}){
  if(!Number(sizeBytes))return[];
  const rows=await select("platform_assets",{
    select:"*",status:"eq.ACTIVE",size_bytes:`eq.${Number(sizeBytes)}`,limit:"80"
  });
  const mime=lower(mimeType,180),name=lower(originalName,300);
  return rows
    .filter(r=>!r.sha256)
    .filter(r=>!mime||lower(r.mime_type,180)===mime)
    .sort((a,b)=>{
      const an=lower(a.original_name,300)===name?1:0;
      const bn=lower(b.original_name,300)===name?1:0;
      return bn-an;
    })
    .slice(0,20)
    .map(normalizeAsset);
}
async function exactShaMatches(sha256){
  const hash=lower(sha256,80);
  if(!/^[a-f0-9]{64}$/.test(hash))return[];
  return (await select("platform_assets",{
    select:"*",status:"eq.ACTIVE",sha256:qeq(hash),order:"created_at.asc",limit:"50"
  })).map(normalizeAsset);
}

export async function listAssetsCore(input={}){
  await requireAssetAccess();
  const query={select:"*",status:"eq.ACTIVE",order:"library_root.asc,library_folder.asc,display_name.asc",limit:"1000"};
  if(clean(input.visibility))query.visibility=qeq(upper(input.visibility,20));
  if(clean(input.assetType))query.asset_type=qeq(upper(input.assetType,30));
  if(clean(input.libraryRoot))query.library_root=qeq(clean(input.libraryRoot,180));
  if(clean(input.libraryFolder))query.library_folder=qeq(clean(input.libraryFolder,240));
  if(clean(input.category))query.category=qeq(clean(input.category,180));

  let rows=(await select("platform_assets",query)).map(normalizeAsset);
  const search=lower(input.search,200);
  if(search){
    rows=rows.filter(a=>[
      a.displayName,a.originalName,a.assetCode,a.libraryRoot,a.libraryFolder,
      a.librarySubfolder,a.category,a.brand,a.system,...a.tags
    ].join(" ").toLowerCase().includes(search));
  }

  const counts=new Map();
  rows.forEach(a=>{
    const key=a.sha256?`SHA:${a.sha256}`:(a.legacyEtag&&a.sizeBytes?`LEG:${a.legacyEtag}:${a.sizeBytes}`:"");
    if(key)counts.set(key,(counts.get(key)||0)+1);
  });

  rows=rows.map(a=>{
    const key=a.sha256?`SHA:${a.sha256}`:(a.legacyEtag&&a.sizeBytes?`LEG:${a.legacyEtag}:${a.sizeBytes}`:"");
    return{...a,duplicateCount:key?counts.get(key)||1:1,isKnownDuplicate:key?(counts.get(key)||1)>1:false};
  });

  const roots=[...new Set(rows.map(a=>a.libraryRoot).filter(Boolean))].sort();
  const folders=[...new Set(rows.map(a=>`${a.libraryRoot}\u0000${a.libraryFolder}`))]
    .map(v=>{const [root,folder]=v.split("\u0000");return{root,folder}})
    .sort((a,b)=>`${a.root}/${a.folder}`.localeCompare(`${b.root}/${b.folder}`));

  return{ok:true,version:ASSET_CORE_VERSION,assets:rows,roots,folders,total:rows.length};
}

export async function checkAssetDuplicateCore(input={}){
  await requireAssetAccess();
  const sha256=lower(input.sha256,80);
  const exact=await exactShaMatches(sha256);
  const possible=exact.length?[]:await possibleLegacyMatches({
    sizeBytes:Number(input.sizeBytes||0),
    mimeType:input.mimeType,
    originalName:input.originalName
  });
  return{ok:true,exactDuplicates:exact,possibleLegacyDuplicates:possible};
}

export async function prepareAssetUploadCore(input={}){
  const session=await requireAssetAccess({write:true});
  const file=obj(input.file);
  const visibility=upper(input.visibility||"PUBLIC",20);
  if(!["PUBLIC","PRIVATE"].includes(visibility))throw new Error("ASSET_VISIBILITY_INVALID");

  const originalName=clean(file.name||input.originalName,300);
  const mimeType=lower(file.type||input.mimeType,180);
  const sizeBytes=Number(file.size||input.sizeBytes||0);
  const sha256=lower(input.sha256,80);
  if(!originalName||!mimeType||!sizeBytes||!/^[a-f0-9]{64}$/.test(sha256)){
    throw new Error("ASSET_FILE_METADATA_INVALID");
  }

  const allowed=visibility==="PUBLIC"?PUBLIC_MIME:PRIVATE_MIME;
  const maxBytes=visibility==="PUBLIC"?MAX_PUBLIC_BYTES:MAX_PRIVATE_BYTES;
  if(!allowed.has(mimeType))throw new Error("ASSET_MIME_NOT_ALLOWED");
  if(sizeBytes>maxBytes)throw new Error("ASSET_FILE_TOO_LARGE");

  const exact=await exactShaMatches(sha256);
  if(exact.length){
    return{ok:true,duplicate:true,exactDuplicates:exact,upload:null};
  }

  const possible=await possibleLegacyMatches({sizeBytes,mimeType,originalName});
  if(possible.length&&!input.allowPossibleDuplicate){
    return{ok:true,needsReview:true,possibleLegacyDuplicates:possible,upload:null};
  }

  const libraryRoot=upper(input.libraryRoot,180);
  const libraryFolder=clean(input.libraryFolder,240);
  if(!LIBRARY_ROOTS.has(libraryRoot))throw new Error("ASSET_LIBRARY_ROOT_INVALID");
  const librarySubfolder=clean(input.librarySubfolder,500);
  const category=clean(input.category,180);
  if(!libraryRoot||!libraryFolder)throw new Error("ASSET_FOLDER_REQUIRED");

  const bucket=visibility==="PUBLIC"?PUBLIC_BUCKET:PRIVATE_BUCKET;
  const safeName=safeFileName(originalName);
  const date=new Date();
  const year=String(date.getUTCFullYear());
  const month=String(date.getUTCMonth()+1).padStart(2,"0");
  const subParts=librarySubfolder
    ? librarySubfolder.split(/[/>]+/).map(v=>slugSegment(v)).filter(Boolean)
    : [];
  const segments=[
    slugSegment(libraryRoot),
    slugSegment(libraryFolder),
    ...subParts,
    slugSegment(category||classifyAssetType(mimeType,originalName).toLowerCase()),
    year,month,
    `${randomUUID()}-${safeName}`
  ];
  const storagePath=segments.join("/");
  const signed=await storageCreateSignedUploadUrl({bucket,path:storagePath,upsert:false});
  const requestId=`ASSET-UP-${randomUUID()}`;
  const requestedAssetType=upper(input.assetType,30);
  const assetType=["IMAGE","DOCUMENT","FORM","VIDEO","AUDIO","OTHER"].includes(requestedAssetType)
    ? requestedAssetType
    : classifyAssetType(mimeType,originalName);
  const metadata={
    role:clean(input.role,120),
    contextSystem:clean(input.contextSystem||input.system,180),
    contextRecordType:clean(input.contextRecordType,120),
    contextRecordId:clean(input.contextRecordId,180),
    fieldName:clean(input.fieldName,180)
  };

  await restRequest({
    table:"platform_asset_upload_sessions",method:"POST",prefer:"return=minimal",
    body:{
      request_id:requestId,
      actor_agent_user_id:actorId(session),
      bucket,storage_path:storagePath,visibility,asset_type:assetType,
      mime_type:mimeType,original_name:originalName,
      display_name:clean(input.displayName||originalName,300),
      size_bytes:sizeBytes,sha256,library_root:libraryRoot,library_folder:libraryFolder,
      library_subfolder:librarySubfolder||null,category:category||assetType,
      brand:clean(input.brand||"SKANDI",180),system:clean(input.system||input.contextSystem||"Platform",180),
      tags:uniqueStrings(input.tags),alt_text:clean(input.altText,1000)||null,
      caption:clean(input.caption,3000)||null,credit:clean(input.credit,500)||null,
      metadata,
      expires_at:new Date(Date.now()+2*60*60*1000).toISOString()
    }
  });

  return{
    ok:true,duplicate:false,needsReview:false,requestId,
    upload:{
      signedUrl:signed.signedUrl,token:signed.token,bucket,storagePath,
      method:"PUT",contentType:mimeType,cacheControl:visibility==="PUBLIC"?"31536000":"3600"
    },
    possibleLegacyDuplicates:possible
  };
}

export async function finalizeAssetUploadCore(input={}){
  const session=await requireAssetAccess({write:true});
  const requestId=clean(input.requestId,160);
  if(!requestId)throw new Error("ASSET_UPLOAD_REQUEST_REQUIRED");

  const upload=(await select("platform_asset_upload_sessions",{
    select:"*",request_id:qeq(requestId),actor_agent_user_id:qeq(actorId(session)),limit:"1"
  }))[0];
  if(!upload)throw new Error("ASSET_UPLOAD_SESSION_NOT_FOUND");
  if(upload.finalized_at)throw new Error("ASSET_UPLOAD_ALREADY_FINALIZED");
  if(new Date(upload.expires_at).getTime()<Date.now())throw new Error("ASSET_UPLOAD_SESSION_EXPIRED");

  const exact=await exactShaMatches(upload.sha256);
  if(exact.length){
    return{ok:true,duplicate:true,asset:exact[0]};
  }

  const info=await storageGetObjectInfo({bucket:upload.bucket,path:upload.storage_path});
  const authoritativeSize=Number(info?.metadata?.size??info?.metadata?.contentLength??info?.size??0);
  const authoritativeMime=lower(info?.metadata?.mimetype??info?.metadata?.contentType??upload.mime_type,180);
  if(authoritativeSize&&authoritativeSize!==Number(upload.size_bytes)){
    throw new Error("ASSET_UPLOADED_SIZE_MISMATCH");
  }
  if(authoritativeMime&&authoritativeMime!==lower(upload.mime_type,180)){
    throw new Error("ASSET_UPLOADED_MIME_MISMATCH");
  }

  const assetCode=`AST-${new Date().toISOString().slice(0,10).replaceAll("-","")}-${randomUUID().slice(0,8).toUpperCase()}`;
  const publicUrl=upload.visibility==="PUBLIC"
    ? (await storageGetPublicUrl({bucket:upload.bucket,path:upload.storage_path})).publicUrl
    : null;
  const folderPath=[upload.library_root,upload.library_folder,upload.library_subfolder].filter(Boolean).join(" / ");

  let inserted=null;
  try{
    inserted=(await restRequest({
      table:"platform_assets",method:"POST",prefer:"return=representation",
      body:{
        asset_code:assetCode,bucket:upload.bucket,storage_path:upload.storage_path,
        visibility:upload.visibility,asset_type:upload.asset_type,mime_type:upload.mime_type,
        original_name:upload.original_name,display_name:upload.display_name,
        extension:extensionOf(upload.original_name)||null,size_bytes:Number(upload.size_bytes),
        sha256:upload.sha256,legacy_etag:clean(info?.metadata?.eTag||info?.metadata?.etag,300)||null,
        library_root:upload.library_root,library_folder:upload.library_folder,
        library_subfolder:upload.library_subfolder||null,folder_path:folderPath,
        category:upload.category||null,brand:upload.brand||null,system:upload.system||null,
        tags:arr(upload.tags),alt_text:upload.alt_text||null,caption:upload.caption||null,
        credit:upload.credit||null,status:"ACTIVE",source:"SKANDI_ASSET_LIBRARY",
        public_url:publicUrl,created_by_agent_user_id:actorId(session),updated_by_agent_user_id:actorId(session)
      }
    }))?.[0];
  }catch(error){
    // Database-level unique hash guard wins concurrent races.
    const race=await exactShaMatches(upload.sha256);
    if(race.length){
      await restRequest({
        table:"platform_asset_upload_sessions",method:"PATCH",query:{request_id:qeq(requestId)},
        body:{finalized_at:new Date().toISOString()},prefer:"return=minimal"
      });
      return{ok:true,duplicate:true,asset:race[0]};
    }
    throw error;
  }

  if(!inserted?.id)throw new Error("ASSET_REGISTRATION_FAILED");

  const meta=obj(upload.metadata);
  if(clean(meta.contextSystem)){
    await registerAssetUsageCore({
      assetId:inserted.id,system:meta.contextSystem,recordType:meta.contextRecordType,
      recordId:meta.contextRecordId,usageRole:meta.role,fieldName:meta.fieldName
    },session);
  }

  await restRequest({
    table:"platform_asset_upload_sessions",method:"PATCH",query:{request_id:qeq(requestId)},
    body:{finalized_at:new Date().toISOString()},prefer:"return=minimal"
  });

  return{ok:true,duplicate:false,asset:normalizeAsset(inserted)};
}

export async function getAssetAccessUrlCore(input={}){
  await requireAssetAccess();
  const row=await readAsset(clean(input.assetId,80));
  if(row.status!==ACTIVE)throw new Error("ASSET_NOT_ACTIVE");
  if(row.visibility==="PUBLIC"){
    const publicUrl=row.public_url||(await storageGetPublicUrl({bucket:row.bucket,path:row.storage_path})).publicUrl;
    return{ok:true,url:publicUrl,expiresIn:null,visibility:"PUBLIC"};
  }
  const signed=await storageCreateSignedReadUrl({
    bucket:row.bucket,path:row.storage_path,expiresIn:Number(input.expiresIn)||600,
    download:input.download===true
  });
  return{ok:true,url:signed.signedUrl,expiresIn:signed.expiresIn,visibility:"PRIVATE"};
}

export async function registerAssetUsageCore(input={},sessionOverride=null){
  const session=sessionOverride||await requireAssetAccess({write:true});
  const assetId=clean(input.assetId,80);
  if(!isUuid(assetId))throw new Error("ASSET_ID_INVALID");
  await readAsset(assetId);

  const system=clean(input.system,180);
  if(!system)throw new Error("ASSET_USAGE_SYSTEM_REQUIRED");

  const recordType=clean(input.recordType,120);
  const recordId=clean(input.recordId,180);
  const usageRole=clean(input.usageRole,120);
  const fieldName=clean(input.fieldName,180);

  const usageQuery={select:"*",asset_id:qeq(assetId),system:qeq(system),limit:"50"};
  let matches=await select("platform_asset_usages",usageQuery);
  const same=(row)=>
    clean(row.record_type,120)===recordType &&
    clean(row.record_id,180)===recordId &&
    clean(row.usage_role,120)===usageRole &&
    clean(row.field_name,180)===fieldName;
  const existing=matches.find(same);

  if(existing?.id){
    const updated=(await restRequest({
      table:"platform_asset_usages",method:"PATCH",query:{id:qeq(existing.id)},
      body:{active:true,updated_at:new Date().toISOString()},prefer:"return=representation"
    }))?.[0];
    return{ok:true,usage:updated||existing};
  }

  const created=(await restRequest({
    table:"platform_asset_usages",method:"POST",prefer:"return=representation",
    body:{
      asset_id:assetId,system,record_type:recordType||null,record_id:recordId||null,
      usage_role:usageRole||null,field_name:fieldName||null,active:true,
      payload:obj(input.payload),created_by_agent_user_id:actorId(session)
    }
  }))?.[0];
  return{ok:true,usage:created};
}

export async function archiveAssetCore(input={}){
  const session=await requireAssetAccess({write:true});
  const id=clean(input.assetId,80);
  const asset=await readAsset(id);
  const usages=await select("platform_asset_usages",{select:"id,system,record_type,record_id,usage_role",asset_id:qeq(id),active:"eq.true",limit:"250"});
  if(usages.length&&!input.force){
    return{ok:true,blocked:true,reason:"ASSET_IN_USE",asset:normalizeAsset(asset),usages};
  }
  await restRequest({
    table:"platform_assets",method:"PATCH",query:{id:qeq(id)},
    body:{status:"ARCHIVED",updated_by_agent_user_id:actorId(session),updated_at:new Date().toISOString()},
    prefer:"return=minimal"
  });
  return{ok:true,blocked:false,assetId:id};
}
