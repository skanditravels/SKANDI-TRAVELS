import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import { createRequire } from 'node:module';
const require = createRequire(new URL('../scripts/package.json', import.meta.url));
const { parse } = require('acorn');
const core = await fs.readFile(new URL('../src/backend/SKANDI_CORE/orgStructure.js', import.meta.url), 'utf8');
const automation = await fs.readFile(new URL('../src/backend/SKANDI_CORE/hireAutomation.js', import.meta.url), 'utf8');
const ast = parse(core, { ecmaVersion:'latest', sourceType:'module' }).body.map(n => n.type === 'ExportNamedDeclaration' ? n.declaration : n);
const fn = name => { const n=ast.find(x=>x?.type==='FunctionDeclaration' && x.id.name===name); assert.ok(n, name); return core.slice(n.start,n.end); };
const declaration = name => { const n=ast.find(x=>x?.type==='VariableDeclaration' && x.declarations.some(d=>d.id.name===name)); assert.ok(n,name); return core.slice(n.start,n.end); };

function automationHarness({ secret='7d0adf85-dda4-4e37-8786-4206bdbd9087', error=false }={}) {
  let calls=[];
  const context = { auth:{elevate:f=>f}, secrets:{getSecretValue:async()=>({value:secret})},
    customTrigger:{runTrigger:async p=>{calls.push(p); if(error) throw Error('timeout');}}, Boolean, String };
  vm.createContext(context);
  vm.runInContext(automation.replace(/^import .*;\s*$/gm,'').replace(/^export /gm,'')+'\nthis.make=makeHireAutomationPayload;this.dispatch=dispatchHireAutomation;',context);
  return { ...context, calls };
}

test('Wix trigger receives the approved event and a verified contact ID only', async()=>{
  const h=automationHarness();
  const payload=h.make({candidate:{id:'candidate',applicant_id:'C-1',first_name:'Ada',last_name:'Jones',email:'ada@example.test',wix_member_id:'private'},employee:{sk_id:'AJ1234',contact_id:'c74534c5-49b1-40fd-8034-f27e4b384c1e'},event:{eventId:'hire-1',occurredAt:'2026-11-09T00:00:00Z'},offer:{job_title:'Advisor',base_pay:'$25 per hour'}});
  assert.equal(payload.contactId,'c74534c5-49b1-40fd-8034-f27e4b384c1e'); assert.equal(payload.basePay,'$25 per hour');
  assert.equal(payload.wix_member_id,undefined); assert.equal(payload.candidateEmail,'ada@example.test');
  assert.equal((await h.dispatch(payload)).state,'accepted'); assert.equal(h.calls.length,1);
  assert.equal(h.calls[0].triggerId,'7d0adf85-dda4-4e37-8786-4206bdbd9087');
  assert.equal(h.make({employee:{contact_id:'member-not-a-uuid'}}).contactId,undefined);
});
test('missing configuration and an ambiguous Wix failure are reported without fake success',async()=>{
  const missing=automationHarness({secret:''}); assert.equal((await missing.dispatch({})).state,'not_configured'); assert.equal(missing.calls.length,0);
  const timeout=automationHarness({error:true}); assert.equal((await timeout.dispatch({})).state,'unconfirmed'); assert.equal(timeout.calls.length,1);
});

function offerHarness(){
  class SkandiError extends Error {constructor(code,message,options){super(options?.publicMessage||message);this.code=code;}}
  const ctx={SkandiError,Date,Object,String,Set,isoDateOnly:value=>{const d=new Date(value);return Number.isNaN(d.getTime())?'':d.toISOString().slice(0,10)}};
  vm.createContext(ctx); vm.runInContext(declaration('OFFER_FIELD_LIMITS')+'\n'+declaration('OPTIONAL_OFFER_FIELDS')+'\n'+fn('normalizeHireOffer')+'\nthis.normalize=normalizeHireOffer;',ctx);
  return ctx.normalize;
}
const sampleOffer={offer_date:'2026-11-09',candidate_first_name:'Ada',candidate_full_name:'Ada Jones',legal_employer:'Example LLC',operating_brand:'SKANDI Travels',job_title:'Advisor',department:'Sales',reports_to:'Manager',employment_type:'Full-time',start_date:'2026-12-01',work_location:'New York',schedule:'40 hours per week',travel:'None',responsibilities:'Assist travelers.',base_pay:'$25 per hour',payday:'Weekly',classification:'Nonexempt',additional_pay:'None',benefits:'As described in the policy.',acceptance_deadline:'2026-11-20',contact_name:'HR',contact_email:'hr@example.test',contact_phone:'',signer_name:'Taylor',signer_title:'Manager'};
test('server validates offer completeness, selected candidate and dates',()=>{
  const normalize=offerHarness(), candidate={first_name:'Ada',last_name:'Jones'};
  assert.equal(normalize(sampleOffer,candidate).base_pay,'$25 per hour');
  assert.equal(normalize(null,candidate),null);
  assert.throws(()=>normalize({...sampleOffer,candidate_full_name:'Other Person'},candidate),e=>e.code==='HR_OFFER_CANDIDATE_MISMATCH');
  assert.throws(()=>normalize({...sampleOffer,start_date:'2026-02-30'},candidate),e=>e.code==='HR_OFFER_DATE_INVALID');
  assert.throws(()=>normalize({...sampleOffer,base_pay:''},candidate),e=>e.code==='HR_OFFER_INCOMPLETE');
});
test('offer terms and member/contact identifiers stay out of non-HR candidate projections',()=>{
  const ctx={Object,Array,Set};vm.createContext(ctx);vm.runInContext(fn('safeRecruitingCandidate')+'\nthis.safe=safeRecruitingCandidate;',ctx);
  const record={id:'c1',wix_member_id:'private-member',payload:{staffOnboarding:{offerDetails:sampleOffer,contactId:'private-contact'}}};
  const ordinary=ctx.safe(record), hr=ctx.safe(record,{includeOffer:true});
  assert.equal(ordinary.wix_member_id,undefined);assert.equal(ordinary.payload.staffOnboarding.offerDetails,undefined);
  assert.equal(hr.payload.staffOnboarding.offerDetails.base_pay,'$25 per hour');assert.equal(hr.payload.staffOnboarding.contactId,undefined);
});

function deliveryHarness({states=['accepted'],deny=false,markConflict=false}={}) {
  const candidateId='f13df58c-f374-4fd1-a4b8-00b4fd3415a7';
  let candidate={id:candidateId,applicant_id:'C-1',first_name:'Ada',last_name:'Jones',email:'ada@example.test',status:'hired',updated_at:'v1',payload:{staffOnboarding:{skId:'AJ1234',corporateEmail:'ada@skanditravels.com',offerDetails:sampleOffer,hireAutomation:{eventId:'hire-1',occurredAt:'2026-11-09T00:00:00Z',state:'pending'}}}};
  let writes=0,calls=0;
  class SkandiError extends Error {constructor(code,msg){super(msg);this.code=code;}}
  const ctx={ SkandiError,Date,UUID:/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i,
    portalObject:v=>v&&typeof v==='object'&&!Array.isArray(v)?v:{}, firstRow:x=>x?.[0]||null, text:(v,n)=>String(v||'').trim().slice(0,n), upper:(v,n)=>String(v||'').trim().toUpperCase().slice(0,n),
    requireRecruiting:async()=>{if(deny)throw Error('DENIED');return {profile:{id:'actor'}}},requireHr:async()=>{},
    safeRecruitingCandidate:v=>v, recruitingAudit:async()=>{}, makeHireAutomationPayload:x=>x,
    dispatchHireAutomation:async()=>({state:states[Math.min(calls++,states.length-1)],contactLinked:false}),
    select:async table=>table==='career_applicant_accounts'?[candidate]:[],
    restRequest:async req=>{writes++;if(markConflict&&writes===2)return [];if(req.query.updated_at!==`eq.${candidate.updated_at}`)return [];candidate={...candidate,...req.body,updated_at:`v${writes+1}`};return [candidate];}
  };
  vm.createContext(ctx);vm.runInContext(fn('dispatchRecruitingHireAutomation')+'\n'+fn('retryRecruitingHireAutomationCore')+'\nthis.run=retryRecruitingHireAutomationCore;',ctx);
  return {run:ctx.run,id:candidateId,state:()=>candidate,calls:()=>calls};
}
test('a confirmed event is recorded and an accidental retry does not send it twice',async()=>{
  const h=deliveryHarness(); assert.equal((await h.run({id:h.id})).hireAutomation.state,'accepted');
  assert.equal(h.state().payload.staffOnboarding.hireAutomation.state,'accepted');
  assert.equal((await h.run({id:h.id})).hireAutomation.state,'accepted'); assert.equal(h.calls(),1);
});
test('an unconfirmed event remains visible and may be manually retried by authorized HR',async()=>{
  const h=deliveryHarness({states:['unconfirmed','accepted']});
  assert.equal((await h.run({id:h.id})).hireAutomation.state,'unconfirmed');
  assert.equal(h.state().payload.staffOnboarding.hireAutomation.state,'unconfirmed');
  assert.equal((await h.run({id:h.id})).hireAutomation.state,'accepted');assert.equal(h.calls(),2);
  const denied=deliveryHarness({deny:true});await assert.rejects(denied.run({id:denied.id}),/DENIED/);assert.equal(denied.calls(),0);
});
test('concurrent retry requests cannot both claim the same pending event',async()=>{
  const h=deliveryHarness();const results=await Promise.all([h.run({id:h.id}),h.run({id:h.id})]);
  assert.equal(h.calls(),1);assert.deepEqual(results.map(x=>x.hireAutomation.state).sort(),['accepted','conflict']);
});
test('failure to record an accepted attempt is reported as unconfirmed',async()=>{
  const h=deliveryHarness({markConflict:true});assert.equal((await h.run({id:h.id})).hireAutomation.state,'unconfirmed');assert.equal(h.calls(),1);
});
test('documented Wix trigger example matches the emitted payload keys and types',async()=>{
  const readme=await fs.readFile(new URL('../riaintra-embeds/success-factors/README.md',import.meta.url),'utf8');
  const example=JSON.parse(readme.match(/```json\s*([\s\S]*?)```/)[1]);
  const h=automationHarness();const actual=h.make({employee:{contact_id:example.contactId}});
  assert.deepEqual(Object.keys(example).sort(),Object.keys(actual).sort());
  for(const key of Object.keys(example)) assert.equal(typeof example[key],typeof actual[key],key);
});
test('page message and site-member facade use the canonical authorized retry method',async()=>{
  const page=await fs.readFile(new URL('../src/pages/Success Factors.sh6tw.js',import.meta.url),'utf8');
  const facade=await fs.readFile(new URL('../src/backend/SKANDI_CORE/orgStructure.web.js',import.meta.url),'utf8');
  assert.match(page,/case "CAREERS_RETRY_HIRE_AUTOMATION"/);assert.match(page,/offerDetails:\s*payload\.offerDetails/);
  assert.match(facade,/retryRecruitingHireAutomation\s*=\s*webMethod\(Permissions\.SiteMember/);
  assert.match(fn('retryRecruitingHireAutomationCore'),/requireRecruiting\(\{ manage:true \}\)/);
  assert.match(fn('retryRecruitingHireAutomationCore'),/requireHr\(\{ manage:true \}\)/);
});
