import test from 'node:test';
import assert from 'node:assert/strict';
import {loadOwnedBusServices} from '../src/backend/SKANDI_CORE/opsTransportRoster.js';
const serviceId='11111111-1111-4111-8111-111111111111',otherId='22222222-2222-4222-8222-222222222222';
const service={id:serviceId,employee_id:null,status:'SCHEDULED',payload:{kind:'BUS',opsTransportVersion:2,label:'Airport transfer'}};
function mock({links=[],rows=[service],failure=false}={}) {return async ({table,query})=>{if(failure)throw new Error('DATABASE_UNAVAILABLE');if(table==='ops_transport_staff')return links;if(table==='vehicle_assignments')return rows;throw Error(table);};}
test('each assigned Host or driver receives the same service under their own identity',async()=>{
 for(const id of ['SK01','SK02']){
  const links=[{service_id:serviceId,employee_id:id,role:id==='SK01'?'DRIVER':'HOST',status:'SCHEDULED'}];
  const rows=await loadOwnedBusServices({identifiers:[id],restRequest:mock({links}),select:'id,employee_id,payload,status'});
  assert.equal(rows.length,1);assert.equal(rows[0].id,serviceId);assert.equal(rows[0].employee_id,id);assert.equal(rows[0].payload.label,'Airport transfer');
 }
});
test('rejects foreign memberships, mismatched service ids, drafts and legacy records',async()=>{
 const links=[{service_id:otherId,employee_id:'SK99',role:'HOST',status:'SCHEDULED'},{service_id:serviceId,employee_id:'SK01',role:'HOST',status:'SCHEDULED'}];
 for(const rows of [[{...service,id:otherId}],[{...service,status:'DRAFT'}],[{...service,payload:{kind:'BUS',opsTransportVersion:1}}]]) {
  assert.deepEqual(await loadOwnedBusServices({identifiers:['SK01'],restRequest:mock({links,rows}),select:'id,payload,status'}),[]);
 }
});
test('deduplicates roles and refuses to hide provider failures',async()=>{
 const links=[{service_id:serviceId,employee_id:'SK01',role:'HOST',status:'SCHEDULED'},{service_id:serviceId,employee_id:'SK01',role:'HOST',status:'SCHEDULED'}];
 const rows=await loadOwnedBusServices({identifiers:['SK01','SK01'],restRequest:mock({links}),select:'id,payload,status'});
 assert.equal(rows.length,1);assert.deepEqual(rows[0].payload.staffRoles,['HOST']);
 await assert.rejects(loadOwnedBusServices({identifiers:['SK01'],restRequest:mock({failure:true}),select:'id'}),/DATABASE_UNAVAILABLE/);
});
test('removes internal staffing, approval and supplier contact fields',async()=>{
 const links=[{service_id:serviceId,employee_id:'SK01',role:'HOST',status:'CONFIRMED'}];
 const row={...service,payload:{...service.payload,staff:[{staffId:'SK99'}],noHostApproval:{approvedBy:'SK03'},supplierDriverPhone:'5550000'}};
 const [result]=await loadOwnedBusServices({identifiers:['SK01'],restRequest:mock({links,rows:[row]}),select:'id,payload,status'});
 assert.equal(Object.hasOwn(result.payload,'staff'),false);assert.equal(Object.hasOwn(result.payload,'noHostApproval'),false);assert.equal(Object.hasOwn(result.payload,'supplierDriverPhone'),false);
 assert.deepEqual(result.payload.staffRoles,['HOST']);
});

test('loads every membership page without truncating an employee roster',async()=>{
 const links=Array.from({length:7},(_,i)=>({service_id:`00000000-0000-4000-8000-${String(i+1).padStart(12,'0')}`,employee_id:'SK01',role:'HOST',status:'SCHEDULED'}));
 const restRequest=async({table,query})=>table==='ops_transport_staff'?links.slice(Number(query.offset),Number(query.offset)+Number(query.limit)):[{...service,id:query.id.slice(3)}];
 const rows=await loadOwnedBusServices({identifiers:['SK01'],restRequest,select:'id,payload,status',limit:2});
 assert.equal(rows.length,7);
});

test('EOS and MyRoster each include the same assigned service without exposing other staff',async()=>{
 const fs=await import('node:fs/promises'),vm=await import('node:vm');
 const definitions=await import('../src/backend/SKANDI_CORE/rosterAssignments.js');
 const session={permissionGroups:['destination'],profile:{agentUserUuid:'staff-uuid',agentId:'SK01',jobTitle:'Destination Guide',baseCode:'BASE'}};
 const serviceRow={...service,start_time:'2026-11-07T09:00:00Z',end_time:'2026-11-07T12:00:00Z',payload:{...service.payload,vehicleName:'Coach',registration:'ABC',staff:[{staffId:'SK99'}]}};
 for(const [file,method] of [['eos.js','getEosBootstrapCore'],['myRoster.js','getMyRosterBootstrapCore']]){
  const restRequest=async({table,query})=>table==='ops_transport_staff'?[{service_id:serviceId,employee_id:'SK01',role:'HOST',status:'SCHEDULED'}]:table==='vehicle_assignments'&&query.id?[serviceRow]:[];
  const context=vm.default.createContext({...definitions,loadOwnedBusServices,requireStaffPortalSessionCore:async()=>session,restRequest});
  const source=await fs.readFile(new URL('../src/backend/SKANDI_CORE/'+file,import.meta.url),'utf8');
  vm.default.runInContext(source.replace(/^import .+;$/gm,'').replace(/^export /gm,''),context);
  const result=await context[method]({from:'2026-11-06',to:'2026-11-08'});
  assert.equal(result.assignments.length,1,file);assert.equal(result.assignments[0].transport.registration,'ABC');
  if(result.assignments[0].payload)assert.equal(result.assignments[0].payload.staff,undefined);
 }
});
