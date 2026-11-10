import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { compilePage } from '../scripts/lib/compile.mjs';
import * as definitions from '../src/backend/SKANDI_CORE/rosterAssignments.js';

const require=createRequire(new URL('../scripts/package.json',import.meta.url));
const {JSDOM}=require('jsdom');
const {parse}=require('acorn');
const core=new URL('../src/backend/SKANDI_CORE/',import.meta.url);
const readCore=name=>fs.readFile(new URL(name,core),'utf8');
const strip=code=>code.replace(/^import .+;$/gm,'').replace(/^export /gm,'');
const staff={permissionGroups:['destination'],profile:{agentUserUuid:'staff-uuid',agentId:'SK-OWNER',jobTitle:'Destination Guide',baseCode:'BASE'}};
const assignments=[
  {id:'published',employee_id:'SK-OWNER',status:'SCHEDULED',start_time:'2026-11-07T09:00:00Z',end_time:'2026-11-07T12:00:00Z',payload:{kind:'BUS',opsTransportVersion:1,label:'Airport transfer',vehicleName:'Coach',registration:'ABC 123',seatCapacity:40,passengerCount:12,stops:['Airport','Hotel']}},
  {id:'draft',employee_id:'SK-OWNER',status:'DRAFT',start_time:'2026-11-07T13:00:00Z',end_time:'2026-11-07T14:00:00Z',payload:{kind:'BUS',opsTransportVersion:1,label:'Draft'}},
  {id:'other',employee_id:'SK-OTHER',status:'SCHEDULED',start_time:'2026-11-07T15:00:00Z',end_time:'2026-11-07T16:00:00Z',payload:{kind:'BUS',opsTransportVersion:1,label:'Other employee'}}
];

test('EOS and MyRoster expose only the employee’s published bus service',async()=>{
  for(const [file,method] of [['eos.js','getEosBootstrapCore'],['myRoster.js','getMyRosterBootstrapCore']]){
    const ctx=vm.createContext({...definitions,requireStaffPortalSessionCore:async()=>staff,restRequest:async({table})=>table==='vehicle_assignments'?assignments:[]});
    vm.runInContext(strip(await readCore(file)),ctx);
    const result=await ctx[method]({from:'2026-11-06',to:'2026-11-08'});
    assert.deepEqual(Array.from(result.assignments,x=>x.id),['published'],file);
    assert.equal(result.assignments[0].transport.registration,'ABC 123');
    assert.deepEqual(Array.from(result.assignments[0].transport.stops),['Airport','Hotel']);
  }
});

test('legacy vehicle records keep their original roster behavior',()=>{
  const legacy={status:'DRAFT',payload:{kind:'BUS',label:'Legacy'}};
  assert.equal(definitions.rosterAssignmentVisible(legacy,'vehicle_assignments'),true);
  assert.equal(definitions.rosterTransportDetails(legacy,legacy.payload),null);
});

test('transport compliance is denied before any database read to ordinary staff',async()=>{
  let reads=0,session=staff;
  const ctx=vm.createContext({requireStaffPortalSessionCore:async()=>session,restRequest:async()=>{reads++;return []}});
  vm.runInContext(strip(await readCore('documentControl.js')),ctx);
  await assert.rejects(ctx.getTransportComplianceBootstrapCore(),/DOCUMENT_CONTROL_ACCESS_REQUIRED/);
  assert.equal(reads,0);
  session={canManage:true,allowedApps:['documents'],profile:{}};
  await assert.rejects(ctx.getTransportComplianceBootstrapCore(),/DOCUMENT_CONTROL_ACCESS_REQUIRED/);
  assert.equal(reads,0);
  session={permissionKeys:['transport-compliance'],profile:{}};
  assert.deepEqual(Array.from((await ctx.getTransportComplianceBootstrapCore()).records),[]);
  assert.equal(reads,2);
});

test('only authorized OPS writers can submit a vehicle; actor comes from the session',async()=>{
  let session={permissionGroups:['operations'],profile:{skId:'SK-ADMIN'}},requests=[];
  const ctx=vm.createContext({...definitions,requireStaffPortalSessionCore:async()=>session,restRequest:async()=>[],rpcRequest:async x=>{requests.push(x);return {id:'saved'}}});
  vm.runInContext(strip(await readCore('opsControl.js')),ctx);
  const payload={name:'Coach',registration:'ABC',countryCode:'SE',baseCode:'ARN',capacity:40,status:'AVAILABLE',serviceClass:'STANDARD',actor:'SPOOFED'};
  await assert.rejects(ctx.handleOpsControlActionCore({type:'SAVE_TRANSPORT_VEHICLE',payload}),/OPS_CONTROL_WRITE_DENIED/);
  assert.equal(requests.length,0);
  session={permissionGroups:['occ'],profile:{skId:'SK-ADMIN'}};
  await ctx.handleOpsControlActionCore({type:'SAVE_TRANSPORT_VEHICLE',payload});
  assert.equal(requests.length,1);
  assert.equal(requests[0].body.p_data.actor,'SK-ADMIN');
});

test('document verification requires an attachment or an explicit review reference',async()=>{
  const src=await readCore('orgStructure.js');
  const node=parse(src,{ecmaVersion:'latest',sourceType:'module'}).body.map(n=>n.type==='ExportNamedDeclaration'?n.declaration:n).find(n=>n?.id?.name==='verifyRecruitingDocumentCore');
  const id='11111111-1111-4111-8111-111111111111';let changes=0,record={id,file_url:null,payload:{},updated_at:'2026-11-10T00:00:00Z'};
  const ctx=vm.createContext({requireRecruiting:async()=>({profile:{id}}),text:(x,n)=>String(x??'').trim().slice(0,n),UUID:/^[0-9a-f-]{36}$/i,SkandiError:class extends Error{},select:async()=>[record],firstRow:x=>x[0],portalObject:x=>x||{},recruitingAudit:async()=>{},restRequest:async({body})=>{changes++;return [{...record,...body}]}});
  vm.runInContext(src.slice(node.start,node.end)+';this.verify=verifyRecruitingDocumentCore',ctx);
  await assert.rejects(ctx.verify({documentId:id}),/RECRUITING_DOCUMENT_EVIDENCE_REQUIRED/);
  assert.equal(changes,0);
  const out=await ctx.verify({documentId:id,evidenceReference:'Secure personnel file ref 53'});
  assert.equal(out.document.verification_status,'VERIFIED');assert.equal(out.document.payload.verificationEvidenceReference,'Secure personnel file ref 53');
});

test('deployment dates are validated against existing dates on partial updates',async()=>{
  const src=await readCore('orgStructure.js');
  const node=parse(src,{ecmaVersion:'latest',sourceType:'module'}).body.find(n=>n.type==='FunctionDeclaration'&&n.id.name==='validateDocumentDateOrder');
  const ctx=vm.createContext({SkandiError:class extends Error{}});
  vm.runInContext(src.slice(node.start,node.end)+';this.validate=validateDocumentDateOrder',ctx);
  assert.throws(()=>ctx.validate({deploymentStartDate:'2027-02-01',deploymentEndDate:'2027-01-01'},{deploymentEndDate:'2027-01-01'}),/HR_DEPLOYMENT_DATE_ORDER/);
  assert.doesNotThrow(()=>ctx.validate({deploymentStartDate:'2027-01-01',deploymentEndDate:'2027-02-01'},{deploymentEndDate:'2027-02-01'}));
});

test('OPS service editor opens, sends a local-time assignment and displays a save error beside its button',async()=>{
  const root=fileURLToPath(new URL('..',import.meta.url));
  const manifest=JSON.parse(await fs.readFile(new URL('../dist/manifest.json',import.meta.url),'utf8'));
  const markup=await compilePage(root,manifest.pages.find(page=>page.key==='opsControl'));
  const dom=new JSDOM(markup,{url:'https://example.test/ops',runScripts:'outside-only',pretendToBeVisual:true});
  const w=dom.window,sent=[];w.postMessage=message=>sent.push(message);w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});
  w.eval(w.document.querySelector('script[data-skandi-part="ops-control"]').textContent);
  w.dispatchEvent(new w.MessageEvent('message',{source:w,data:{source:'SKANDI_WIX_PARENT',type:'OPS_BOOTSTRAP',payload:{transport:{available:true,canEdit:true,vehicles:[{id:'11111111-1111-4111-8111-111111111111',name:'Coach',registration:'ABC',countryCode:'SE',baseCode:'ARN',capacity:40,status:'AVAILABLE'}],staff:[{id:'SK01',name:'Alex'}],suppliers:[],assignments:[{id:'22222222-2222-4222-8222-222222222222',label:'Transfer',vehicleId:'11111111-1111-4111-8111-111111111111',employeeId:'SK01',startAt:'2030-01-01T10:00:00Z',endAt:'2030-01-01T11:00:00Z',passengerCount:10,capacity:40,status:'SCHEDULED',stops:[],updatedAt:'2026-11-10T00:00:00Z'}]}}}}));
  w.document.querySelector('[data-transport-service]').click();
  assert.equal(w.document.querySelector('#transportServiceTitle').textContent,'Edit bus service');
  const form=w.document.getElementById('transportServiceModal');
  assert.equal(form.elements.label.value,'Transfer');
  form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
  const action=sent.find(x=>x.type==='OPS_ACTION'&&x.payload.action==='SAVE_TRANSPORT_ASSIGNMENT');assert(action);
  assert.equal(action.payload.payload.employeeId,'SK01');
  assert.equal(action.payload.payload.startAt,new Date(form.elements.startAt.value).toISOString());
  w.dispatchEvent(new w.MessageEvent('message',{source:w,data:{source:'SKANDI_WIX_PARENT',type:'OPS_ERROR',payload:{requestId:action.payload.requestId,message:'Vehicle overlaps another service.'}}}));
  assert.equal(w.document.getElementById('transportServiceError').textContent,'Vehicle overlaps another service.');
  assert.equal(form.querySelector('[type="submit"]').disabled,false);
  dom.window.close();
});

test('a task can be assigned only to the candidate’s linked employee, without granting staff access',async()=>{
  const src=await readCore('orgStructure.js');
  const node=parse(src,{ecmaVersion:'latest',sourceType:'module'}).body.map(n=>n.type==='ExportNamedDeclaration'?n.declaration:n).find(n=>n?.id?.name==='saveRecruitingOnboardingTaskCore');
  const candidateId='11111111-1111-4111-8111-111111111111',employeeId='22222222-2222-4222-8222-222222222222';
  let linked=false,saved=null;
  const ctx=vm.createContext({requireRecruiting:async()=>({profile:{id:'33333333-3333-4333-8333-333333333333'}}),text:(x,n)=>String(x??'').trim().slice(0,n),upper:(x,n)=>String(x??'').trim().slice(0,n).toUpperCase(),UUID:/^[0-9a-f-]{36}$/i,firstRow:x=>x?.[0],portalObject:x=>x||{},generateBusinessKey:()=> 'ONB-TEST',COMPLETE_ONBOARDING_TASK:new Set(['COMPLETE','COMPLETED']),SkandiError:class extends Error{},recruitingAudit:async()=>{},select:async table=>table==='career_applicant_accounts'?[{id:candidateId,status:'HIRED',payload:{staffOnboarding:{agentUserId:employeeId}}}]:[],findAgent:async()=>linked?{id:employeeId,active:true,payload:{successFactors:{recruitingApplicantId:candidateId}}}:null,restRequest:async({body})=>{saved=body;return [{id:'task-1',...body}]}});
  vm.runInContext(src.slice(node.start,node.end)+';this.saveTask=saveRecruitingOnboardingTaskCore',ctx);
  await assert.rejects(ctx.saveTask({candidateId,taskName:'Induction',assignee:'EMPLOYEE'}),/RECRUITING_ONBOARDING_EMPLOYEE_NOT_LINKED/);
  assert.equal(saved,null);
  linked=true;
  await ctx.saveTask({candidateId,taskName:'Induction',assignee:'EMPLOYEE',notes:'Arrange uniform pickup'});
  assert.equal(saved.owner_agent_user_id,employeeId);assert.equal(saved.payload.notes,'Arrange uniform pickup');
  assert.equal(saved.status,'OPEN');
});
