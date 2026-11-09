import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { compilePage } from '../scripts/lib/compile.mjs';
const require=createRequire(new URL('../scripts/package.json',import.meta.url));
const {JSDOM}=require('jsdom');
const root=fileURLToPath(new URL('..',import.meta.url));
const manifest=JSON.parse(await fs.readFile(new URL('../dist/manifest.json',import.meta.url),'utf8'));
const markup=await compilePage(root,manifest.pages.find(p=>p.key==='successFactors'));

function setup(){
  const dom=new JSDOM(markup,{url:'https://example.test/riaintra/success-factors',runScripts:'outside-only',pretendToBeVisual:true});
  const w=dom.window, sent=[], diagnostics=[];
  const code=w.document.querySelector('script[data-skandi-part="success-factors"]').textContent;
  w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});
  w.postMessage=(message)=>sent.push(message);
  w.addEventListener('skandi:outbound',e=>diagnostics.push(e.detail));
  w.Blob=Blob;
  let blob=null; w.URL.createObjectURL=value=>(blob=value,'blob:offer-test');w.URL.revokeObjectURL=()=>{};
  w.HTMLAnchorElement.prototype.click=function(){};
  const hook=`window.__offerTest={boot(candidate,job){portalState.connected=true;portalState.profile={role:'HR Admin',successFactorsAccess:{manage:true,recruiting:true,fullHr:true}};currentUserRole='HR Admin';portalState.hr=normalizeHrData({authorized:true,recruiting:{candidates:[candidate],jobPostings:[job]}});},openHire:openHireCandidateDialog,openOffer:openRecruitingOfferComposer};\n    initializePortal();`;
  assert(code.includes('    initializePortal();'));
  w.eval(code.replace('    initializePortal();',hook));
  const candidate={id:'f13df58c-f374-4fd1-a4b8-00b4fd3415a7',first_name:'Ada',last_name:'Jones',email:'ada@example.test',status:'offer',position_id:'JOB-1',payload:{}};
  const job={position_id:'JOB-1',title:'Travel Advisor',department:'Sales',location:'New York',employment_type:'Full-time'};
  w.__offerTest.boot(candidate,job); sent.length=0; diagnostics.length=0;
  return {w,dom,sent,diagnostics,candidate,blob:()=>blob};
}

test('the supplied offer can be completed, exported and submitted from the hire dialog',async()=>{
  const t=setup(), {w,candidate}=t;
  w.__offerTest.openHire(candidate.id);
  w.document.querySelector('[data-action="careers-prepare-hire-offer"]').click();
  const root=w.document.getElementById('sfOfferComposerMount').shadowRoot;
  assert(root,'offer editor mounts without a nested iframe');
  assert.equal(root.querySelector('[name="candidate_first_name"]').value,'Ada');
  assert.equal(root.querySelector('[name="job_title"]').value,'Travel Advisor');
  const brand=root.querySelector('[name="operating_brand"]');
  assert.deepEqual([...brand.options].map(x=>x.value),['','SKANDI Group','SKANDI Travels']);
  const inputs={offer_date:'2026-11-09',candidate_first_name:'Ada',candidate_full_name:'Ada Jones',legal_employer:'Example LLC',operating_brand:'SKANDI Travels',job_title:'Travel Advisor',department:'Sales',reports_to:'Manager',employment_type:'Full-time',start_date:'2026-12-01',work_location:'New York',schedule:'40 hours a week',travel:'None',responsibilities:'Help travelers <img src=x onerror=alert(1)>',base_pay:'$25 per hour',payday:'Weekly',classification:'Nonexempt',additional_pay:'None',benefits:'Per applicable policy.',acceptance_deadline:'2026-11-20',contact_name:'HR',contact_email:'hr@example.test',signer_name:'Taylor',signer_title:'Manager'};
  for(const [name,value] of Object.entries(inputs)){const input=root.querySelector(`[name="${name}"]`);assert(input,name);input.value=value;input.dispatchEvent(new w.Event('input',{bubbles:true}));}
  assert.equal(root.querySelector('#sfo-letter img'),null);
  assert(root.querySelector('#sfo-letter').textContent.includes('<img src=x onerror=alert(1)>'));
  root.getElementById('sfo-download-button').click();
  const exported=await t.blob().text();assert(exported.includes('&lt;img'));assert(!exported.includes('<script'));
  w.document.querySelector('[data-action="careers-use-offer"]').click();
  const form=w.document.getElementById('careerHireForm');assert(form,'returns to the hire dialog');
  form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
  const message=t.sent.find(x=>x.type==='CAREERS_MOVE_CANDIDATE_STAGE');
  assert.equal(message.payload.candidateId,candidate.id);assert.equal(message.payload.offerDetails.base_pay,'$25 per hour');
  assert.equal(t.diagnostics.find(x=>x.type==='CAREERS_MOVE_CANDIDATE_STAGE').payload.offerDetails,'[redacted]');
  t.dom.window.close();
});

test('the offer is optional and an incomplete offer cannot be attached',()=>{
  const t=setup(), {w,candidate}=t;
  w.__offerTest.openHire(candidate.id);w.document.querySelector('[data-action="careers-prepare-hire-offer"]').click();
  const root=w.document.getElementById('sfOfferComposerMount').shadowRoot;
  w.document.querySelector('[data-action="careers-use-offer"]').click();
  assert(root.getElementById('sfo-form-status').textContent.includes('required'));
  assert(w.document.getElementById('sfOfferComposerMount'),'invalid offer remains open');
  w.document.querySelector('[data-action="close-dialog"]').click();
  w.__offerTest.openHire(candidate.id);w.document.getElementById('careerHireForm').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
  assert.equal(t.sent.find(x=>x.type==='CAREERS_MOVE_CANDIDATE_STAGE').payload.offerDetails,null);
  t.dom.window.close();
});
