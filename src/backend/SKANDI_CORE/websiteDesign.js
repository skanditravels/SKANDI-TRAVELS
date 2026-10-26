// Media Control website designs reuse the canonical editorial organization and
// voy_entities store. No provider, booking, inventory or policy records are written.
import { restRequest, storageGetPublicUrl } from 'backend/SKANDI_CORE/supabaseServer';
import { ensureEditorialContext } from 'backend/SKANDI_CORE/publicContent';
import { publicWebsitePage, validateWebsiteDesign } from 'public/websiteDesign';
import { resolveWebsiteFont } from 'backend/SKANDI_CORE/mediaControlSources';

const schema='magazine_manager';
const eq=v=>`eq.${v}`;
const keyFor=key=>'WEBSITE-DESIGN-'+key;
async function read(context,page) {
  const result=await restRequest({schema,table:'voy_entities',method:'GET',query:{select:'*',organization_id:eq(context.organizationId),entity_type:'eq.campaign',entity_id:eq(keyFor(page.key)),limit:'1'}});
  return Array.isArray(result)?result[0]:null;
}
export async function resolveWebsiteAssets(design,{published=false}={}) {
  const safe=validateWebsiteDesign(design),ids=[...new Set(safe.elements.map(e=>e.assetId).filter(Boolean))],assets=new Map();
  for(let i=0;i<ids.length;i+=50) {
    const rows=await restRequest({table:'platform_assets',method:'GET',query:{select:'id,bucket,storage_path,alt_text,credit',id:`in.(${ids.slice(i,i+50).join(',')})`,status:'eq.ACTIVE',visibility:'eq.PUBLIC',asset_type:'eq.IMAGE',bucket:'eq.skandi-public-assets',limit:'50'}});
    for(const asset of rows||[]) assets.set(asset.id,asset);
  }
  for(const element of safe.elements) if(element.assetId) {
    const asset=assets.get(element.assetId);if(!asset)throw new Error('WEBSITE_PUBLIC_ASSET_REQUIRED');
    element.assetUrl=(await storageGetPublicUrl({bucket:asset.bucket,path:asset.storage_path})).publicUrl;
    element.credit=String(asset.credit||'');
    if(!Object.hasOwn(element,'alt'))element.alt=String(asset.alt_text||'');
  }
  safe.fonts=published?safe.fonts.map(font=>{
    const stored=design.fonts.find(f=>f.id===font.id&&f.weight===font.weight);
    if(!/^[a-zA-Z0-9 _-]+$/.test(stored.family)||!/^https:\/\/cdn\.jsdelivr\.net\/fontsource\/fonts\/[a-z0-9-]+@\d+\.\d+\.\d+(?:-[\w.-]+)?\/[a-z0-9-]+\.woff2$/.test(stored.url))throw new Error('WEBSITE_PUBLISHED_FONT_INVALID');
    return {...font,family:stored.family,url:stored.url};
  }):await Promise.all(safe.fonts.map(resolveWebsiteFont));
  return safe;
}
export async function getWebsiteDesignCore(input={}) {
  const context=await ensureEditorialContext(),page=publicWebsitePage(input.pageKey),row=await read(context,page);
  const data=row?.data||{};
  return {ok:true,page,revision:Number(data.revision||0),draft:data.draft||{version:1,elements:[]},published:data.publishedDesign||null,previousPublished:data.previousPublished||null,updatedAt:row?.updated_at||null};
}
export async function saveWebsiteDesignCore(input={}) {
  const context=await ensureEditorialContext(),page=publicWebsitePage(input.pageKey),row=await read(context,page),data=row?.data||{};
  const revision=Number(data.revision||0);
  if(!Number.isInteger(input.expectedRevision)||input.expectedRevision!==revision)throw new Error('WEBSITE_EDIT_CONFLICT');
  if(!['SAVE','PUBLISH','RESTORE_PUBLISHED','ROLLBACK'].includes(input.action))throw new Error('WEBSITE_ACTION_INVALID');
  const draft=await resolveWebsiteAssets(input.action==='RESTORE_PUBLISHED'?(data.publishedDesign||{elements:[]}):input.action==='ROLLBACK'?(data.previousPublished||{elements:[]}):input.design,{published:['RESTORE_PUBLISHED','ROLLBACK'].includes(input.action)});
  if(input.action==='ROLLBACK'&&!data.previousPublished)throw new Error('WEBSITE_NO_PREVIOUS_PUBLICATION');
  const publish=['PUBLISH','ROLLBACK'].includes(input.action),now=new Date().toISOString();
  const next={...data,scope:'WEBSITE',presentationKind:'WEBSITE_DESIGN',pagePath:page.path,pageKey:page.key,title:page.key,revision:revision+1,draft,
    publishedDesign:publish?draft:data.publishedDesign||null,previousPublished:publish?data.publishedDesign||null:data.previousPublished||null,
    publishedAt:publish?now:data.publishedAt||null};
  const body={organization_id:context.organizationId,entity_type:'campaign',entity_id:keyFor(page.key),data:next,is_active:true,updated_at:now,updated_by_wix_member_id:context.wixMemberId};
  let result;
  if(row) result=await restRequest({schema,table:'voy_entities',method:'PATCH',query:{id:eq(row.id),organization_id:eq(context.organizationId),updated_at:eq(row.updated_at),'data->>revision':eq(revision)},body,prefer:'return=representation'});
  else result=await restRequest({schema,table:'voy_entities',method:'POST',body:{...body,created_at:now,created_by_wix_member_id:context.wixMemberId},prefer:'return=representation'});
  if(!Array.isArray(result)||result.length!==1)throw new Error('WEBSITE_EDIT_CONFLICT');
  return {ok:true,page,revision:next.revision,draft,published:next.publishedDesign,previousPublished:next.previousPublished,updatedAt:now};
}
export async function getPublishedWebsiteDesignCore({organizationId,path}) {
  const rows=await restRequest({schema,table:'voy_entities',method:'GET',query:{select:'data',organization_id:eq(organizationId),entity_type:'eq.campaign',is_active:'eq.true','data->>presentationKind':'eq.WEBSITE_DESIGN','data->>pagePath':eq(path),limit:'2'}});
  if(!rows?.length||!rows[0].data?.publishedDesign)return null;
  if(rows.length!==1)throw new Error('WEBSITE_DUPLICATE_PAGE_DESIGN');
  return resolveWebsiteAssets(rows[0].data.publishedDesign,{published:true});
}
