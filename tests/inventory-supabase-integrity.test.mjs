import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import { createRequire } from 'node:module';
const require=createRequire(new URL('../scripts/package.json',import.meta.url));
const {parse}=require('acorn');
const code=await fs.readFile(new URL('../src/backend/SKANDI_CORE/inventory.js',import.meta.url),'utf8');
const ast=parse(code,{ecmaVersion:'latest',sourceType:'module'});
function functionCode(name){const n=ast.body.map(x=>x.type==='ExportNamedDeclaration'?x.declaration:x).find(x=>x?.type==='FunctionDeclaration'&&x.id.name===name);assert.ok(n,name);return code.slice(n.start,n.end)}
const clean=(v,max=5000)=>String(v??'').trim().slice(0,max);
const base={clean,array:v=>Array.isArray(v)?v:[],upper:(v,max=80)=>clean(v,max).toUpperCase(),object:v=>v&&typeof v==='object'&&!Array.isArray(v)?v:{},JSON,Set,Map,console};

test('localized JSONB entries remain structured when saved',()=>{
 const ctx=vm.createContext({...base});vm.runInContext([functionCode('localizedList'),functionCode('localizedBody'),'this.make=localizedBody'].join('\n'),ctx);
 const record=ctx.make('entity',{highlights:['Central',{label:'Beach',description:'Nearby'}],included:[{name:'Breakfast'}],notIncluded:['Parking']});
 assert.equal(record.highlights[1].label,'Beach');assert.equal(record.included[0].name,'Breakfast');assert.notEqual(record.highlights[1],'[object Object]');
});

test('media cannot be moved from another product or replaced with a raw URL',async()=>{
 let writes=0;
 const ctx=vm.createContext({...base,qeq:x=>'eq.'+x,select:async(table)=>table==='inventory_media_assets'?[{id:'existing',url:'https://example.test/old.jpg'}]:[],restRequest:async()=>{writes++;return[]},resolveAssetBackedMedia:async(id,item)=>({url:item.url}),saveCatalog:async()=>null,actorId:()=>null});
 vm.runInContext(functionCode('syncMasterChildren')+'\nthis.sync=syncMasterChildren',ctx);
 await assert.rejects(()=>ctx.sync({}, {id:'product'}, {media:[{id:'other',url:'https://example.test/old.jpg'}]}),/INVENTORY_MEDIA_RECORD_MISMATCH/);
 await assert.rejects(()=>ctx.sync({}, {id:'product'}, {media:[{id:'existing',url:'https://example.test/new.jpg'}]}),/INVENTORY_ASSET_LIBRARY_REQUIRED/);
 assert.equal(writes,0);
});

test('save reports an unconfirmed restore instead of claiming rollback succeeded',async()=>{
 const events=[];
 const ctx=vm.createContext({...base,MASTER_TYPES:new Set(['HOTEL']),REFERENCE_TYPES:new Set(),requireInventoryAccess:async()=>({}),snapshotBundleForRollback:async()=>({id:'hotel'}),savePrimary:async()=>({id:'hotel'}),syncMasterChildren:async()=>{throw Error('write failed')},compensateBundleSave:async()=>false,audit:async(_s,event)=>events.push(event)});
 vm.runInContext(functionCode('saveInventoryBundleCore')+'\nthis.save=saveInventoryBundleCore',ctx);
 await assert.rejects(()=>ctx.save({bundle:{record:{entityType:'HOTEL'}}}),e=>e.message==='INVENTORY_BUNDLE_RESTORE_FAILED'&&/could not be fully restored/.test(e.publicMessage));
 assert.deepEqual(events,['INVENTORY_BUNDLE_RESTORE_FAILED']);
});

test('hotel tier display recognizes existing collection aliases',async()=>{
 const text=await fs.readFile(new URL('../altea-embeds/inventory-control/skandi-inventory-control.js',import.meta.url),'utf8');
 const tree=parse(text,{ecmaVersion:'latest',sourceType:'module'});const n=tree.body.find(x=>x.type==='FunctionDeclaration'&&x.id.name==='hotelTierForDisplay');assert.ok(n);
 const ctx=vm.createContext({text:v=>String(v??'')});vm.runInContext(text.slice(n.start,n.end)+'\nthis.tier=hotelTierForDisplay',ctx);
 assert.equal(ctx.tier('SIGNATURE','SIGNATURE COLLECTION'),'SIGNATURE');
 assert.equal(ctx.tier(null,'SIGNATURE COLLECTION'),'SIGNATURE');
 assert.equal(ctx.tier('','CUSTOM'),'CUSTOM');
});

test('tour text renders structured entries as readable labels',async()=>{
 const text=await fs.readFile(new URL('../src/backend/SKANDI_CORE/toursActivities.js',import.meta.url),'utf8');const tree=parse(text,{ecmaVersion:'latest',sourceType:'module'});
 const n=tree.body.find(x=>x.type==='FunctionDeclaration'&&x.id.name==='lists');assert.ok(n);
 const ctx=vm.createContext({arr:v=>Array.isArray(v)?v:[],clean});vm.runInContext(text.slice(n.start,n.end)+'\nthis.lists=lists',ctx);
 assert.equal(ctx.lists([{name:'Breakfast'},'Central'])[0],'Breakfast');
 assert.equal(ctx.lists([{name:'Breakfast'},'Central'])[1],'Central');
 assert.equal(ctx.lists([{unknown:'Private'}]).length,0);
});
