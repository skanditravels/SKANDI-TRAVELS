import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
const root=new URL('../',import.meta.url);
const read=path=>fs.readFile(new URL(path,root),'utf8');

test('portal exposes the automation editor only to its backend-authorized administrators',async()=>{
 const s=await read('src/backend/SKANDI_CORE/staffAuth.js');
 const defs=s.slice(s.indexOf('const APP_CATALOG'),s.indexOf('function memberId')).replace('export function','function');
 const funcs=s.slice(s.indexOf('function isWildcardAllowed'),s.indexOf('function unauthorized'));
 const paths=new Proxy({},{get:(_,k)=>'/'+String(k)});
 const ctx={SITE_MAP:paths,APP_ROUTES:paths,PRIVILEGED_ACCESS_ROLES:new Set(['SUPER_ADMIN','OWNER','COMPANY_OWNER']),stringArray:x=>Array.isArray(x)?x:[],lower:x=>String(x||'').toLowerCase(),upper:x=>String(x||'').toUpperCase(),text:x=>String(x||'')};
 vm.createContext(ctx);vm.runInContext(defs+'\n'+funcs+'\nthis.api={portalApps,alteaApps,getSuccessFactorsApps}',ctx);
 const auth={allowedApps:[],permissionKeys:[],permissionGroups:[],accessRoleCode:'STAFF',canManage:false,isSystemAdmin:false};
 const ids=a=>Array.from(a,x=>x.id);
 assert.ok(ids(ctx.api.portalApps({...auth,accessRoleCode:'OWNER'})).includes('automation-control'));
 assert.ok(ids(ctx.api.portalApps({...auth,permissionGroups:['system-admin']})).includes('automation-control'));
 assert.ok(!ids(ctx.api.portalApps({...auth,allowedApps:['*']})).includes('automation-control'));
 const general=ctx.api.portalApps(auth);assert.ok(ids(general).includes('docunet-viewer'));assert.ok(!ids(general).includes('docunet'));assert.ok(!ids(general).includes('docunet-admin'));
 const rosterAuth={...auth,allowedApps:['myroster']};assert.ok(ids(ctx.api.portalApps(rosterAuth)).includes('altea'));
 assert.ok(ids(ctx.api.alteaApps({...rosterAuth,accessRole:'STAFF'})).includes('myroster'));
});

test('asset organization keeps physical links intact, requires write permission and rejects stale edits',async()=>{
 let s=await read('src/backend/SKANDI_CORE/assets.js');s=s.replace(/import[\s\S]*?from\s+["'][^"']+["'];\s*/g,'').replace(/export\s+/g,'');
 const id='13b7f361-f47e-4a28-93bf-1cbcc8ce6624';let writes=[];let canWrite=true;
 const row={id,status:'ACTIVE',updated_at:'2026-01-01T00:00:00Z',library_root:'SKANDI',library_folder:'Old',display_name:'Old name',bucket:'skandi-public-assets',storage_path:'old/stable.png',public_url:'https://example.test/stable.png'};
 const ctx={getStaffPortalSessionCore:async()=>({loggedIn:true,authorized:true,canManage:canWrite,profile:{id}}),restRequest:async req=>{if(req.method==='GET')return [row];writes.push(req);return [{...row,...req.body}]},randomUUID:()=>id,console};
 vm.createContext(ctx);vm.runInContext(s+'\nthis.organize=organizeAssetCore;',ctx);
 const input={assetId:id,expectedUpdatedAt:row.updated_at,displayName:'New name',libraryRoot:'SKANDI',libraryFolder:'Photos',librarySubfolder:'Trips / Sweden'};
 const result=await ctx.organize(input);assert.equal(result.asset.folderPath,'SKANDI / Photos / Trips / Sweden');assert.equal(result.asset.publicUrl,row.public_url);assert.equal(writes[0].body.storage_path,undefined);assert.equal(writes[0].body.public_url,undefined);
 writes=[];await assert.rejects(ctx.organize({...input,expectedUpdatedAt:'stale'}),/ASSET_CHANGED_RELOAD/);assert.equal(writes.length,0);
 await assert.rejects(ctx.organize({...input,librarySubfolder:'../other'}),/ASSET_FOLDER_INVALID/);canWrite=false;await assert.rejects(ctx.organize(input),/ASSET_WRITE_ACCESS_DENIED/);
});

test('finance backend rejects ordinary staff before any data access',async()=>{
 let source=await read('src/backend/SKANDI_CORE/financeControl.js');source=source.replace(/^import .*;\s*$/gm,'').replace(/^export /gm,'');
 let session={accessRole:'STAFF',allowedApps:['mail'],permissionKeys:[],permissionGroups:[]};let reads=0;
 class SkandiError extends Error{constructor(code,message){super(message);this.code=code}}
 const ctx={requireStaffPortalSessionCore:async()=>session,restRequest:async()=>{reads++;return []},SkandiError,console};vm.createContext(ctx);vm.runInContext(source+'\nthis.bootstrap=getFinanceControlBootstrapCore;',ctx);
 await assert.rejects(ctx.bootstrap(),/Finance access is required/);assert.equal(reads,0);
 session={...session,allowedApps:['finance-control']};const result=await ctx.bootstrap();assert.equal(result.ok,true);assert.ok(reads>0);
});
