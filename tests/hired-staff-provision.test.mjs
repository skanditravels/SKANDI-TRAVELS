import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const require=createRequire(new URL('../scripts/package.json',import.meta.url));
const {parse}=require('acorn');
const source=await fs.readFile(new URL('../src/backend/SKANDI_CORE/orgStructure.js',import.meta.url),'utf8');
const nodes=parse(source,{ecmaVersion:'latest',sourceType:'module'}).body.map(x=>x.type==='ExportNamedDeclaration'?x.declaration:x);
const functionSource=name=>{const n=nodes.find(x=>x.type==='FunctionDeclaration'&&x.id.name===name);assert.ok(n,name);return source.slice(n.start,n.end)};
function harness(options={}) {
  let candidate={id:'candidate-1',applicant_id:'C-1',status:'dgr',first_name:'Ada',last_name:'Jones',email:'ada@example.test',wix_member_id:null,payload:{nested:{wixMemberId:'hidden'}}};
  let agent=null,created=0,patches=0;
  class SkandiError extends Error {constructor(code,msg,opts){super(opts?.publicMessage||msg);this.code=code}}
  const c={SkandiError,Date, requireRecruiting:async()=>({profile:{id:'actor'}}),requireHr:async()=>{if(options.denyHr)throw new Error('HR_MANAGE_ACCESS_REQUIRED')},
    text:(v,n)=>String(v||'').trim().slice(0,n),upper:(v,n)=>String(v||'').trim().toUpperCase().slice(0,n),normalizeCorporateEmail:v=>{if(!/^.+@.+\..+$/.test(v))throw new Error('invalid email');return v.toLowerCase()},firstRow:a=>a?.[0]||null,
    select:async table=>table==='career_applicant_accounts'?[candidate]:agent?[agent]:[],
    findWixMemberByCorporateEmail:async email=>options.memberEmail===email?{id:options.memberId||'wix-1'}:agent&&email==='ada@company.test'?{id:'wix-new'}:null,
    memberSummary:item=>item,
    createEmployeeCore:async input=>{assert.equal(input.passwordEmailForNewMemberOnly,true);if(options.createFails)throw new Error('CREATE_FAILED');created++;agent={id:'agent-1',sk_id:'SK1234',wix_member_id:'wix-new',payload:{successFactors:{recruitingApplicantId:input.recruitingApplicantId}}};return {employee:{id:'agent-1',skId:'SK1234'},wixMember:{member:{id:'wix-new'}}}},
    safeAgent:a=>({id:a.id,skId:a.sk_id}),provisionWixMemberForAgent:async()=>{throw new Error('unexpected recovery')},
    restRequest:async req=>{patches++;candidate={...candidate,...req.body};return [candidate]},recruitingAudit:async()=>{},
  };
  vm.createContext(c);vm.runInContext(functionSource('safeRecruitingCandidate')+'\n'+functionSource('updateRecruitingCandidateStageCore')+'\nthis.run=updateRecruitingCandidateStageCore',c);
  return {run:c.run,state:()=>({candidate,agent,created,patches}),candidate:()=>candidate};
}
test('Hired creates a staff account and stores the member ID only in the backend candidate record',async()=>{
  const h=harness();const result=await h.run({id:'candidate-1',status:'hired',staffEmail:'ada@company.test'});
  assert.equal(h.state().created,1);assert.equal(h.state().candidate.wix_member_id,'wix-new');assert.equal(result.candidate.wix_member_id,undefined);assert.equal(result.candidate.payload.nested.wixMemberId,undefined);assert.equal(result.employee.skId,'SK1234');
  await h.run({id:'candidate-1',status:'hired',staffEmail:'ada@company.test'});assert.equal(h.state().created,1);
});
test('Hired requires HR rights, a staff email and a matching existing member account',async()=>{
  const denied=harness({denyHr:true});await assert.rejects(denied.run({id:'candidate-1',status:'hired',staffEmail:'ada@company.test'}),/HR_MANAGE/);assert.equal(denied.state().created,0);
  const missing=harness();await assert.rejects(missing.run({id:'candidate-1',status:'hired'}),/invalid email/);assert.equal(missing.state().patches,0);
  const existing=harness({memberEmail:'ada@example.test',memberId:'wix-existing'});await assert.rejects(existing.run({id:'candidate-1',status:'hired',staffEmail:'ada@company.test'}),/different email/);assert.equal(existing.state().created,0);
});
test('a failed account creation never marks the candidate hired; ordinary stages do not create accounts',async()=>{
  const failed=harness({createFails:true});await assert.rejects(failed.run({id:'candidate-1',status:'hired',staffEmail:'ada@company.test'}),/CREATE_FAILED/);assert.equal(failed.state().candidate.status,'dgr');
  const normal=harness();await normal.run({id:'candidate-1',status:'interview'});assert.equal(normal.state().candidate.status,'interview');assert.equal(normal.state().created,0);
});
