import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
const backend=await fs.readFile(new URL('../src/backend/SKANDI_CORE/inventory.js',import.meta.url),'utf8');
const ui=await fs.readFile(new URL('../altea-embeds/inventory-control/skandi-inventory-control.js',import.meta.url),'utf8');
function extract(source,name){
 const constMarker=`const ${name}=`;
 const fnMarker=`function ${name}(`;
 let start=source.indexOf(constMarker);
 if(start>=0){const end=source.indexOf('};',start);assert.ok(end>start,name);return source.slice(start,end+2)}
 start=source.indexOf(fnMarker);assert.ok(start>=0,name);
 const next=source.slice(start+1).search(/\n(?:function |const |async function |export )/);
 return next<0?source.slice(start):source.slice(start,start+1+next);
}
const obj=v=>v&&typeof v==='object'&&!Array.isArray(v)?v:{};
test('airline edits synchronize legacy reader fields without overwriting untouched records',()=>{
 const c=vm.createContext({JSON,Object,object:obj});vm.runInContext(['AIRLINE_DETAIL_COLUMNS','airlineComparable','airlineLegacyPatch'].map(n=>extract(backend,n)).join('\n')+'\nthis.patch=airlineLegacyPatch',c);
 const old={inventory_details:{boarding:{sequence:['one']},baggageAllowance:[{cabin_type:'Economy',fares:[{name:'Saver'}]}]},boarding:'old legacy',baggageAllowence:'old baggage',contactUrl:'https://old.example'};
 assert.deepEqual(Object.keys(c.patch({...old.inventory_details},old)),[]);
 const updated=c.patch({...old.inventory_details,boarding:{sequence:['two']},contactUrl:'https://new.example'},old);
 assert.deepEqual(Object.keys(updated).sort(),['boarding','contactUrl']);assert.equal(updated.boarding,'{"sequence":["two"]}');assert.equal(updated.contactUrl,'https://new.example');
 const hubs=c.patch({hubsJson:[{airport:'BKK',role:'Hub'}]},{});assert.equal(hubs.hubsJson[0].airport,'BKK');
});
test('older airline source values appear until a staff edit overrides them',()=>{
 const c=vm.createContext({getPath:(o,p)=>p.split('.').reduce((v,k)=>v?.[k],o)});vm.runInContext(extract(ui,'AIRLINE_LEGACY_FIELDS')+'\n'+extract(ui,'airlineFieldValue')+'\nthis.value=airlineFieldValue',c);
 const rec={details:{},sourceRecord:{baggageAllowence:'legacy'}};
 assert.equal(c.value(rec,{path:'details.baggageAllowance'}),'legacy');rec.details.baggageAllowance='updated';assert.equal(c.value(rec,{path:'details.baggageAllowance'}),'updated');rec.details.baggageAllowance='';assert.equal(c.value(rec,{path:'details.baggageAllowance'}),'');
});
test('new rows never copy existing content',()=>{
 const c=vm.createContext({Array,Object});vm.runInContext(extract(ui,'emptyStructuredTemplate')+'\nthis.empty=emptyStructuredTemplate',c);
 const result=c.empty({name:'Saver',fares:[{name:'value'}],settings:{enabled:true,count:8}});assert.equal(result.name,'');assert.equal(result.fares.length,0);assert.equal(result.settings.enabled,false);assert.equal(result.settings.count,null);
});
