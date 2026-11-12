import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
const source=await fs.readFile(new URL('../src/backend/SKANDI_CORE/inventory.js',import.meta.url),'utf8');
const ui=await fs.readFile(new URL('../altea-embeds/inventory-control/skandi-inventory-control.js',import.meta.url),'utf8');
function extract(name){const start=source.indexOf(`async function ${name}(`);assert.ok(start>=0);const match=source.slice(start+1).search(/\n(?:async function |function |export )/);return match<0?source.slice(start):source.slice(start,start+1+match)}
function links(records){
 const calls=[];const clean=v=>String(v??'').trim(),upper=v=>clean(v).toUpperCase();
 const select=async(table,query)=>{calls.push({table,query});return (records[table]||[]).filter(row=>Object.entries(query).every(([k,v])=>k==='select'||k==='limit'||String(row[k])===v.slice(3)))};
 const context=vm.createContext({clean,upper,select,qeq:v=>'eq.'+v});vm.runInContext(extract('validateAircraftChildLinks')+'\nthis.validate=validateAircraftChildLinks',context);return {validate:context.validate,calls};
}
test('cabin images cannot point to another aircraft and blank cabin is allowed',async()=>{
 const {validate}=links({travel_info_aircraft:[{id:'a'}],travel_info_aircraft_cabins:[{id:'own',aircraft_id:'a'},{id:'other',aircraft_id:'b'}]});
 await assert.doesNotReject(()=>validate('view',{aircraft_id:'a',cabin_id:'own'}));
 await assert.doesNotReject(()=>validate('view',{aircraft_id:'a',cabin_id:null}));
 await assert.rejects(()=>validate('view',{aircraft_id:'a',cabin_id:'other'}),/belonging to this aircraft/);
});
test('hotspots use the cabin belonging to the selected image aircraft',async()=>{
 const {validate}=links({travel_info_aircraft_views:[{id:'view',aircraft_id:'a'}],travel_info_aircraft_cabins:[{id:'c',aircraft_id:'a',cabin_code:'J'},{id:'x',aircraft_id:'b',cabin_code:'F'}]});
 await assert.doesNotReject(()=>validate('hotspot',{view_id:'view',target_cabin_code:'J'}));
 await assert.rejects(()=>validate('hotspot',{view_id:'view',target_cabin_code:'F'}),/target cabin/);
 await assert.rejects(()=>validate('hotspot',{view_id:'view'}, {id:'h',view_id:'different'}),/cannot be moved/);
});
test('walkthrough links stay within the aircraft and cannot target the same scene',async()=>{
 const {validate}=links({travel_info_aircraft:[{id:'a'}],travel_info_aircraft_walk_scenes:[{id:'s2',aircraft_id:'a',scene_code:'SECOND'},{id:'s3',aircraft_id:'b',scene_code:'OTHER'}]});
 await assert.doesNotReject(()=>validate('scene',{aircraft_id:'a',scene_code:'FIRST',forward_scene_code:'SECOND'}));
 await assert.rejects(()=>validate('scene',{aircraft_id:'a',scene_code:'FIRST',forward_scene_code:'OTHER'}),/belonging to this aircraft/);
 await assert.rejects(()=>validate('scene',{aircraft_id:'a',scene_code:'FIRST',forward_scene_code:'FIRST'}),/itself/);
});
test('aircraft form provides linked selections and a creation path',()=>{
 assert.match(ui,/\+ Add Aircraft/);assert.match(ui,/Operating airline/);assert.match(ui,/cabin_ref:cabins\.map/);assert.match(ui,/scene_ref:scenes\.filter/);assert.match(ui,/onCommit=.*INVENTORY_V9_SAVE_AIRCRAFT_CHILD/);
});
test('generated child codes do not collide with existing or inactive items',()=>{
 const start=ui.indexOf('function nextAircraftChildCode('),end=ui.indexOf('\nfunction AircraftStudio(',start);assert.ok(start>=0&&end>start);
 const c=vm.createContext({text:v=>String(v??''),Set});vm.runInContext(ui.slice(start,end)+'\nthis.next=nextAircraftChildCode',c);
 assert.equal(c.next('VIEW',[{view_code:'VIEW_1'},{view_code:'view_2',active:false}],'view_code'),'VIEW_3');
});
