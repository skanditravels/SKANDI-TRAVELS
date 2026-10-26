// Read-only discovery and explicit imports into the canonical Supabase Asset Library.
import { fetch } from 'wix-fetch';
import { createHash } from 'crypto';
import { ensureEditorialContext } from 'backend/SKANDI_CORE/publicContent';
import { prepareAssetUploadCore, finalizeAssetUploadCore } from 'backend/SKANDI_CORE/assets';
import { storageUploadBase64Object } from 'backend/SKANDI_CORE/supabaseServer';
import { publicWebsitePage } from 'public/websiteDesign';

const ROOT='https://raw.githubusercontent.com/skanditravels/SKANDI-TRAVELS/main/';
const text=v=>String(v||'').replace(/<[^>]*>/g,'').slice(0,2000);
const fontCache=new Map();
export async function resolveWebsiteFont(input={}) {
  if(!/^[-a-z0-9]{1,80}$/.test(input.id))throw new Error('WEBSITE_FONT_INVALID');
  const key=input.id+':'+input.weight,cached=fontCache.get(key);
  if(cached&&cached.until>Date.now())return cached.font;
  const [font,version]=await Promise.all([json('https://api.fontsource.org/v1/fonts/'+input.id),json('https://api.fontsource.org/v1/version/'+input.id)]);
  const weight=Number(input.weight||400),url=font.variants?.[weight]?.normal?.latin?.url?.woff2;
  if(!url||!/^\d+\.\d+\.\d+(?:-[\w.-]+)?$/.test(version.latest))throw new Error('WEBSITE_FONT_VARIANT_UNAVAILABLE');
  const parsed=new URL(url);
  if(parsed.origin!=='https://cdn.jsdelivr.net'||!parsed.pathname.startsWith('/fontsource/fonts/'+input.id+'@'))throw new Error('WEBSITE_FONT_SOURCE_INVALID');
  const result={id:input.id,weight,family:text(font.family).replace(/[^a-zA-Z0-9 _-]/g,''),url:url.replace('@latest/','@'+version.latest+'/')};
  fontCache.set(key,{font:result,until:Date.now()+3600000});return result;
}
export async function getWebsiteFontCore(input={}) {await ensureEditorialContext();return {ok:true,font:await resolveWebsiteFont(input)};}
async function json(url) {
  const response=await fetch(url,{method:'GET',headers:{Accept:'application/json'}});
  if(!response.ok)throw new Error('MEDIA_SOURCE_HTTP_'+response.status);
  return response.json();
}
export async function getWebsitePreviewCore(input={}) {
  await ensureEditorialContext();const page=publicWebsitePage(input.pageKey);
  const manifest=await json(ROOT+'dist/manifest.json');
  const row=manifest.pages?.find(p=>p.key===page.key&&p.family==='public');
  if(!row||row.status!=='BUILT'||!/^dist\/[a-z0-9-]+\/index\.html$/.test(row.output))throw new Error('WEBSITE_PREVIEW_REQUIRES_SUCCESSFUL_MAIN_BUILD');
  const response=await fetch(ROOT+row.output,{method:'GET'});
  if(!response.ok)throw new Error('WEBSITE_PREVIEW_UNAVAILABLE');
  const html=await response.text();
  if(html.length>4000000||createHash('sha256').update(html).digest('hex')!==row.sha256)throw new Error('WEBSITE_PREVIEW_INTEGRITY_FAILED');
  return {ok:true,page,html};
}
async function commons(id,query) {
  const params=new URLSearchParams({action:'query',format:'json',formatversion:'2',prop:'imageinfo',iiprop:'url|size|mime|extmetadata',iiurlwidth:'800'});
  if(id){if(!/^\d+$/.test(String(id)))throw new Error('MEDIA_SOURCE_ID_INVALID');params.set('pageids',String(id));}
  else {params.set('generator','search');params.set('gsrsearch',query);params.set('gsrnamespace','6');params.set('gsrlimit','20');}
  const result=await json('https://commons.wikimedia.org/w/api.php?'+params);
  return (result.query?.pages||[]).flatMap(p=>{
    const i=p.imageinfo?.[0],m=i?.extmetadata||{};if(!i||!/^image\/(jpeg|png|webp|gif)$/.test(i.mime))return [];
    return [{provider:'wikimedia',id:String(p.pageid),title:text(p.title),url:i.url,thumbnail:i.thumburl||i.url,mime:i.mime,
      creator:text(m.Artist?.value),license:text(m.LicenseShortName?.value),licenseUrl:text(m.LicenseUrl?.value),sourceUrl:i.descriptionurl,credit:text(m.Attribution?.value||m.Artist?.value),size:i.size}];
  });
}
async function openverse(id,query) {
  if(id&&!/^[a-f0-9-]{36}$/i.test(id))throw new Error('MEDIA_SOURCE_ID_INVALID');
  const result=await json('https://api.openverse.org/v1/images/'+(id?encodeURIComponent(id)+'/':'?q='+encodeURIComponent(query)+'&page_size=20&license_type=commercial,modification'));
  return (id?[result]:result.results||[]).map(i=>({provider:'openverse',id:i.id,title:text(i.title),thumbnail:i.thumbnail,url:i.url,
    creator:text(i.creator),license:text(i.license),licenseUrl:i.license_url,sourceUrl:i.foreign_landing_url,credit:text(i.attribution),size:i.filesize}));
}
export async function searchMediaSourcesCore(input={}) {
  await ensureEditorialContext();const query=String(input.query||'').trim().slice(0,150);
  if(query.length<2)throw new Error('MEDIA_SEARCH_QUERY_REQUIRED');
  if(input.provider==='wikimedia')return {ok:true,items:await commons(null,query)};
  if(input.provider==='openverse')return {ok:true,items:await openverse(null,query)};
  if(input.provider==='fontsource') {
    const items=await json('https://api.fontsource.org/v1/fonts?family='+encodeURIComponent(query));
    return {ok:true,items:items.slice(0,30).map(i=>({provider:'fontsource',id:i.id,title:i.family,category:i.category,weights:i.weights,sourceUrl:'https://fontsource.org/fonts/'+i.id}))};
  }
  throw new Error('MEDIA_SOURCE_UNSUPPORTED');
}
export async function importMediaSourceCore(input={}) {
  await ensureEditorialContext();
  if(input.licenseReviewed!==true)throw new Error('MEDIA_LICENSE_REVIEW_REQUIRED');
  const item=input.provider==='wikimedia'?(await commons(input.id))[0]:input.provider==='openverse'?(await openverse(input.id))[0]:null;
  if(!item)throw new Error('MEDIA_SOURCE_NOT_FOUND');
  return uploadSourceItem(item,input,['upload.wikimedia.org']);
}
export async function importWebsiteImageCore(input={}) {
  const source=await getWebsitePreviewCore(input);
  const url=new URL(String(input.url||''));
  if(!source.html.replaceAll('&amp;','&').includes(url.href))throw new Error('WEBSITE_IMAGE_NOT_IN_SOURCE');
  return uploadSourceItem({url:url.href,title:'Website image',sourceUrl:url.href},input,['static.wixstatic.com','images.unsplash.com','upload.wikimedia.org']);
}
async function uploadSourceItem(item,input,hosts) {
  // This importer only fetches files from Wikimedia's controlled image host.
  // Openverse results from other hosts remain searchable; download and upload
  // them via the existing Asset Library instead of allowing arbitrary server URLs.
  const url=new URL(item.url);
  if(url.protocol!=='https:'||!hosts.includes(url.hostname)||url.username||url.password||(url.port&&url.port!=='443'))throw new Error('MEDIA_SOURCE_USE_LIBRARY_UPLOAD');
  if(item.size&&Number(item.size)>8*1024*1024)throw new Error('MEDIA_SOURCE_TOO_LARGE');
  const response=await fetch(url.href,{method:'GET',redirect:'error',size:8*1024*1024,timeout:15000});
  if(!response.ok)throw new Error('MEDIA_SOURCE_DOWNLOAD_FAILED');
  const mime=(response.headers.get('content-type')||'').split(';')[0].toLowerCase();
  if(!['image/jpeg','image/png','image/webp','image/gif'].includes(mime))throw new Error('MEDIA_SOURCE_IMAGE_TYPE_INVALID');
  const buffer=Buffer.from(await response.arrayBuffer());
  if(!buffer.length||buffer.length>8*1024*1024)throw new Error('MEDIA_SOURCE_TOO_LARGE');
  const sha256=createHash('sha256').update(buffer).digest('hex');
  const credit=[text(item.creator).slice(0,200),text(item.license).slice(0,100),text(item.licenseUrl).slice(0,300),text(item.sourceUrl).slice(0,1000)].filter(Boolean).join(' | ');
  const prepared=await prepareAssetUploadCore({file:{name:decodeURIComponent(url.pathname.split('/').pop()),type:mime,size:buffer.length},sha256,visibility:'PUBLIC',libraryRoot:'SKANDI',libraryFolder:'Website',category:'Editorial',displayName:item.title,credit:item.license?credit:"",caption:credit,system:'Media Control',allowPossibleDuplicate:input.allowPossibleDuplicate===true});
  if(prepared.duplicate)return {ok:true,asset:prepared.exactDuplicates.find(a=>a.visibility==='PUBLIC')||null,duplicate:true};
  if(!prepared.upload)return prepared;
  await storageUploadBase64Object({bucket:prepared.upload.bucket,path:prepared.upload.storagePath,dataBase64:buffer.toString('base64'),mimeType:mime,maxBytes:8*1024*1024,upsert:false});
  return finalizeAssetUploadCore({requestId:prepared.requestId});
}
