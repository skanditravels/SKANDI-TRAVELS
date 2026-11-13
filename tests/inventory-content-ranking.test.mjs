import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import { inventorySearchPriority } from '../src/backend/SKANDI_CORE/inventoryRanking.js';

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
