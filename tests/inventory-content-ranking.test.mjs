import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import { inventorySearchPriority, rankInventoryRows, loadInventoryRankings, loadAllInventoryRows } from '../src/backend/SKANDI_CORE/inventoryRanking.js';

const source=await fs.readFile(new URL('../src/backend/SKANDI_CORE/inventory.js',import.meta.url),'utf8');
const section=source.slice(source.indexOf('const TRANSLATABLE_INVENTORY_FIELDS='),source.indexOf('async function getMasterBundle(')).replace('export async function','async function');
function translator(response,allow=true){
  let calls=0;
  const ctx=vm.createContext({requireInventoryAccess:async()=>{if(!allow)throw Error('DENIED')},upper:v=>String(v||'').toUpperCase(),object:v=>v&&typeof v==='object'&&!Array.isArray(v)?v:{},openai:()=>({}),generateText:async()=>{calls++;return {text:response}},JSON,Error,String,Object,Array,Boolean});
  vm.runInContext(section+'\nthis.translate=translateInventoryContentCore',ctx);
  return {translate:ctx.translate,calls:()=>calls};
}
test('collection ranking honors service levels before featured status',()=>{
 const row=(tier,featured=false)=>({catalog_type:'SKANDI_COLLECTION',partner_tier:tier,featured});
 assert.ok(inventorySearchPriority(row('EXCELSIOR'))<inventorySearchPriority(row('SIGNATURE',true)));
 assert.ok(inventorySearchPriority(row('SIGNATURE'))<inventorySearchPriority(row('SELECT',true)));
 assert.ok(inventorySearchPriority(row('SELECT'))<inventorySearchPriority({catalog_type:'SKANDI_PARTNER',featured:true}));
 assert.ok(inventorySearchPriority({catalog_type:'SKANDI_PARTNER'})<inventorySearchPriority({}));
 assert.ok(inventorySearchPriority(row('SELECT',true))<inventorySearchPriority(row('SELECT')));
 assert.equal(inventorySearchPriority(row('SIGNATURE COLLECTION')),inventorySearchPriority(row('SIGNATURE')));
});
test('translation preserves structured content and requires review',async()=>{
 const t=translator(JSON.stringify({title:'Hej',highlights:['Strand',{label:'Pool'}]}));
 const result=await t.translate({targetLanguage:'SV',source:{title:'Hello',highlights:['Beach',{label:'Pool'}],untrusted:'ignored'}});
 assert.equal(result.translated.title,'Hej');assert.equal(result.translated.highlights[1].label,'Pool');assert.equal(result.reviewRequired,true);assert.equal('untrusted' in result.translated,false);
});
test('translation rejects missing items, altered URLs and unsupported languages',async()=>{
 const t=translator(JSON.stringify({highlights:['Strand']}));
 await assert.rejects(()=>t.translate({targetLanguage:'SV',source:{highlights:['Beach','Pool']}}),e=>/incomplete/i.test(e.publicMessage));
 const u=translator(JSON.stringify({highlights:[{link:'https://elsewhere.test'}]}));
 await assert.rejects(()=>u.translate({targetLanguage:'SV',source:{highlights:[{link:'https://example.test'}]}}),e=>/incomplete/i.test(e.publicMessage));
 await assert.rejects(()=>t.translate({targetLanguage:'XX',source:{title:'Hello'}}),e=>/supported/i.test(e.publicMessage));
});
test('translation checks write access before calling the service',async()=>{
 const t=translator('{}',false);await assert.rejects(()=>t.translate({targetLanguage:'SV',source:{title:'Hello'}}),/DENIED/);assert.equal(t.calls(),0);
});

test('network inventory search uses the canonical rank while retaining unmatched map records',async()=>{
 const code=await fs.readFile(new URL('../src/backend/SKANDI_CORE/networkMap.js',import.meta.url),'utf8');
 const records=[{id:'h1',publicId:'HOTEL-H1',entityType:'HOTEL',code:'H1',name:'Z Hotel',sortPriority:11,details:{},relations:[]},{id:'h2',entityType:'HOTEL',code:'H2',name:'A Hotel',sortPriority:31,details:{},relations:[]}];
 const ctx=vm.createContext({Date,String,Array,Promise,callPublicContentRpc:async()=>({hotels:[{id:'h2',name:'A Hotel'},{id:'unknown',name:'Other'},{id:'h1',name:'Z Hotel'}]}),getDestinationFlowCatalogCore:async()=>({ok:true,records})});
 vm.runInContext(code.replace(/^import .*;\s*$/gm,'').replace('export async function','async function')+'\nthis.run=getPublicNetworkMapDataCore',ctx);
 const result=await ctx.run();
 assert.deepEqual(Array.from(result.hotels,x=>x.id),['h1','h2','unknown']);
 assert.equal(result.inventoryHierarchy.find(x=>x.id==='h1').searchPriority,11);
});

test('flight context compares priority before featured status',async()=>{
 const code=await fs.readFile(new URL('../src/backend/SKANDI_CORE/flightStatus.js',import.meta.url),'utf8');
 const start=code.indexOf('function entitySort('),end=code.indexOf('\nexport async function',start);assert.ok(start>=0&&end>start);
 const ctx=vm.createContext({Number,text:v=>String(v??'')});vm.runInContext(code.slice(start,end)+'\nthis.compare=entitySort',ctx);
 assert.ok(ctx.compare({featured:false,sortPriority:11,title:'Z'},{featured:true,sortPriority:30,title:'A'})<0);
});


test('staff ranking uses active dated catalog levels and otherwise falls back to featured',()=>{
 const rows=[{id:'s',name:'Select',featured:true},{id:'e',name:'Excelsior'},{id:'expired',name:'Expired',featured:false}];
 const catalog=[{target_entity_id:'s',catalog_type:'SKANDI_COLLECTION',partner_tier:'SELECT',featured:true},{target_entity_id:'e',catalog_type:'SKANDI_COLLECTION',partner_tier:'EXCELSIOR',featured:false},{target_entity_id:'expired',catalog_type:'SKANDI_COLLECTION',partner_tier:'EXCELSIOR',valid_to:'2020-01-01'}];
 assert.deepEqual(rankInventoryRows(rows,catalog,'2026-11-13').map(x=>x.id),['e','s','expired']);
});
test('staff search fetches subsequent inventory and catalog pages before ordering',async()=>{
 const calls=[];const select=async(table,q)=>{calls.push([table,q.offset]);return q.offset==='0'?Array.from({length:1000},(_,i)=>({id:i})): [{id:'last'}]};
 assert.equal((await loadInventoryRankings(select)).length,1001);
 assert.equal((await loadAllInventoryRows(select,{order:'id.asc'})).length,1001);
 assert.deepEqual(calls.map(x=>x[1]),['0','1000','0','1000']);
});
