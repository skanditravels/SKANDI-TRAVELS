import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {compilePage} from '../scripts/lib/compile.mjs';

const require=createRequire(new URL('../scripts/package.json',import.meta.url));
const {JSDOM}=require('jsdom');
const {parse}=require('acorn');
const root=fileURLToPath(new URL('..',import.meta.url));
const manifest=JSON.parse(await fs.readFile(new URL('../dist/manifest.json',import.meta.url),'utf8'));
const markup=await compilePage(root,manifest.pages.find(page=>page.key==='successFactors'));

function setup(tab='employment') {
  const dom=new JSDOM(markup,{url:'https://example.test/riaintra/success-factors',runScripts:'outside-only',pretendToBeVisual:true});
  const w=dom.window,sent=[];
  w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});
  w.postMessage=message=>sent.push(message);
  const code=w.document.querySelector('script[data-skandi-part="success-factors"]').textContent;
  const hook=`window.__workspaceTest={boot(record,catalog,tab){portalState.connected=true;portalState.profile={id:'viewer',role:'HR Admin',successFactorsAccess:{manage:true,fullHr:true,workforce:true,employee:true,organization:true,recruiting:true}};currentUserRole='HR Admin';portalState.hr=normalizeHrData({authorized:true});portalState.hr.staff=[record];portalState.hr.orgCatalog=catalog;currentView='hr';currentHrView='employee';currentHrEmployeeTab=tab;hrSelectedEmployeeId=record.id;renderPortal();},home(){currentView='home';renderPortal();},receive:onParentMessage};\n    initializePortal();`;
  w.eval(code.replace('    initializePortal();',hook));
  const catalog={ok:true,departments:[{id:'SALES',name:'Sales'},{id:'OPS',name:'Operations'}],bases:[{code:'NYC',name:'New York',country_code:'US'},{code:'MIA',name:'Miami',country_code:'US'}],roles:[{role_id:'ADVISOR',title:'Advisor',department_id:'SALES',active:true},{role_id:'HOST',title:'Host',department_id:'OPS',active:true}],roleBaseRules:[{role_id:'ADVISOR',base_code:'NYC',active:true},{role_id:'HOST',base_code:'NYC',active:true},{role_id:'HOST',base_code:'MIA',active:true}],permissionPresets:[{preset_id:'staff'}],countryRules:[{country_code:'US',country_name:'United States',active:true,employment_enabled:true}]};
  const record={id:'employee-1',firstName:'Alex',lastName:'Example',countryCode:'US',baseCode:'NYC',departmentId:'SALES',roleId:'ADVISOR',homeAddressCity:'New York'};
  w.__workspaceTest.boot(record,catalog,tab);sent.length=0;
  return {w,dom,sent,catalog,record};
}

test('base controls department choices and department controls eligible positions',()=>{
  const t=setup(),d=t.w.document;
  const base=d.getElementById('orgBaseSelect'),dept=d.getElementById('orgDepartmentSelect'),role=d.getElementById('orgRoleSelect');
  assert.equal(dept.value,'SALES');assert.equal(role.value,'ADVISOR');
  base.value='MIA';base.dispatchEvent(new t.w.Event('change',{bubbles:true}));
  assert.deepEqual([...dept.options].map(x=>x.value),['','OPS']);assert.equal(role.value,'');
  dept.value='OPS';dept.dispatchEvent(new t.w.Event('change',{bubbles:true}));
  assert.deepEqual([...role.options].map(x=>x.value),['','HOST']);
  t.dom.window.close();
});

test('drafts survive tab changes and background updates without rerendering an edited form',()=>{
  const t=setup('personal'),d=t.w.document;
  let city=d.querySelector('#hrEmployeeForm [name="homeAddressCity"]');assert(city);
  city.value='Umeå';city.dispatchEvent(new t.w.Event('input',{bubbles:true}));
  const form=d.getElementById('hrEmployeeForm');
  t.w.__workspaceTest.receive({data:{source:'SKANDI_WIX_PARENT',type:'HR_ORG_CATALOG',payload:t.catalog},source:t.w,origin:'https://example.test'});
  assert.equal(d.getElementById('hrEmployeeForm'),form);assert.equal(city.value,'Umeå');
  d.querySelector('[data-action="hr-employee-tab"][data-view="employment"]').click();
  d.querySelector('[data-action="hr-employee-tab"][data-view="personal"]').click();
  city=d.querySelector('#hrEmployeeForm [name="homeAddressCity"]');assert.equal(city.value,'Umeå');
  d.getElementById('hrEmployeeForm').dispatchEvent(new t.w.Event('submit',{bubbles:true,cancelable:true}));
  const item=t.sent.find(message=>message.type==='HR_STAFF_SAVE').payload.item;
  assert.equal(item.homeAddressCity,'Umeå');
  assert.equal(Object.hasOwn(item,'roleId'),false);
  assert.equal(Object.hasOwn(item,'corporateEmail'),false);
  assert.equal(Object.hasOwn(item,'homeAddressCountry'),false);
  t.dom.window.close();
});

test('a repeated bootstrap keeps the current employee view and form',()=>{
  const t=setup('personal'),d=t.w.document;
  t.w.history.replaceState(null,'','#/hr/workforce');
  const form=d.getElementById('hrEmployeeForm');
  t.w.__workspaceTest.receive({data:{source:'SKANDI_WIX_PARENT',type:'INTRANET_BOOTSTRAP',payload:{profile:{id:'viewer',role:'HR Admin',successFactorsAccess:{manage:true,fullHr:true,workforce:true,employee:true,organization:true,recruiting:true}},currentUserRole:'HR Admin'}},source:t.w,origin:'https://example.test'});
  assert.equal(d.getElementById('hrEmployeeForm'),form);
  t.dom.window.close();
});

test('intranet images come from the registered presentation slots',()=>{
  const t=setup(),d=t.w.document;
  t.w.__workspaceTest.home();
  t.w.__workspaceTest.receive({data:{source:'SKANDI_WIX_PARENT',type:'SKANDI_PRESENTATION_DATA',payload:{mediaSlots:[{slotId:'riaintra-welcome',assetUrl:'https://assets.example.test/welcome.png'},{slotId:'riaintra-team',assetUrl:'https://assets.example.test/team.png'}]}},source:t.w,origin:'https://example.test'});
  assert.equal(d.querySelector('.sf-welcome-image')?.src,'https://assets.example.test/welcome.png');
  assert.equal(d.querySelector('.sf-team-image')?.src,'https://assets.example.test/team.png');
  t.dom.window.close();
});

test('address selection fills matching fields and background directory data does not navigate',async()=>{
  const t=setup('personal'),d=t.w.document;
  const address=d.querySelector('[name="homeAddressStreet"]');address.value='123 Main';address.dispatchEvent(new t.w.Event('input',{bubbles:true}));
  await new Promise(resolve=>setTimeout(resolve,850));
  const request=t.sent.find(message=>message.type==='HR_ADDRESS_SUGGEST');assert(request);
  t.w.__workspaceTest.receive({data:{source:'SKANDI_WIX_PARENT',type:'HR_ADDRESS_SUGGESTIONS',payload:{requestId:request.payload.requestId,items:[{label:'123 Main Street, New York',street:'123 Main Street',city:'New York',state:'NY',postalCode:'10001',country:'United States'}]}},source:t.w,origin:'https://example.test'});
  d.querySelector('[data-action="select-address"]').click();
  assert.equal(d.querySelector('[name="homeAddressStreet"]').value,'123 Main Street');
  assert.equal(d.querySelector('[name="homeAddressPostalCode"]').value,'10001');
  const form=d.getElementById('hrEmployeeForm');
  t.w.__workspaceTest.receive({data:{source:'SKANDI_WIX_PARENT',type:'INTRANET_COLLEAGUES',payload:{items:[],background:true}},source:t.w,origin:'https://example.test'});
  assert.equal(d.getElementById('hrEmployeeForm'),form);
  t.dom.window.close();
});

test('identity fields use country selections, date controls and last-four validation',()=>{
  const t=setup('personal'),d=t.w.document;
  assert.equal(d.querySelector('[name="nationalIdCountry"]').tagName,'SELECT');
  assert.equal(d.querySelector('[name="passportIssueDate"]').type,'date');
  const id=d.querySelector('[name="passportNumberLast4"]');assert.equal(id.maxLength,4);id.value='AB12';assert(id.checkValidity());
  id.value='A!2';assert(!id.checkValidity());
  t.dom.window.close();
});

test('a failed save is shown beside its button without a notification banner',()=>{
  const t=setup('personal'),d=t.w.document;
  const city=d.querySelector('[name="homeAddressCity"]');city.value='Boston';city.dispatchEvent(new t.w.Event('input',{bubbles:true}));
  const form=d.getElementById('hrEmployeeForm');form.dispatchEvent(new t.w.Event('submit',{bubbles:true,cancelable:true}));
  t.w.__workspaceTest.receive({data:{source:'SKANDI_WIX_PARENT',type:'HR_ERROR',payload:{action:'HR_STAFF_SAVE',message:'Could not save employee.'}},source:t.w,origin:'https://example.test'});
  const button=d.querySelector('[form="hrEmployeeForm"]');assert.equal(button.nextElementSibling?.textContent,'Could not save employee.');
  assert.equal(d.querySelectorAll('.toast').length,0);
  t.dom.window.close();
});

test('document date ordering is checked against the existing saved date on partial edits',async()=>{
  const src=await fs.readFile(new URL('../src/backend/SKANDI_CORE/orgStructure.js',import.meta.url),'utf8');
  const node=parse(src,{ecmaVersion:'latest',sourceType:'module'}).body.find(n=>n.type==='FunctionDeclaration'&&n.id.name==='validateDocumentDateOrder');
  const ctx=vm.createContext({SkandiError:class extends Error {}});
  vm.runInContext(src.slice(node.start,node.end)+';this.fn=validateDocumentDateOrder;',ctx);
  assert.throws(()=>ctx.fn({passportIssueDate:'2026-10-01',passportExpiryDate:'2026-01-01'},{passportExpiryDate:'2026-01-01'}),/HR_DOCUMENT_DATE_ORDER/);
  assert.doesNotThrow(()=>ctx.fn({passportIssueDate:'2026-10-01',passportExpiryDate:'2027-01-01'},{passportExpiryDate:'2027-01-01'}));
});

test('saving another tab never injects empty corporate email or photo values',async()=>{
  const src=await fs.readFile(new URL('../src/pages/Success Factors.sh6tw.js',import.meta.url),'utf8');
  const node=parse(src,{ecmaVersion:'latest',sourceType:'module'}).body.find(n=>n.type==='FunctionDeclaration'&&n.id.name==='employeeInput');
  const ctx=vm.createContext({});vm.runInContext(src.slice(node.start,node.end)+';this.fn=employeeInput;',ctx);
  const actual=ctx.fn({id:'employee-1',homeAddressCity:'Umeå'});
  assert.equal(actual.agentUserId,'employee-1');assert.equal(Object.hasOwn(actual,'corporateEmail'),false);assert.equal(Object.hasOwn(actual,'badgePhotoUrl'),false);
  assert.equal(ctx.fn({id:'employee-1',corporateEmailAddress:'new@example.test'}).corporateEmail,'new@example.test');
});

test('address lookup requires a staff session and requests permanent address results',async()=>{
  const src=await fs.readFile(new URL('../src/backend/SKANDI_CORE/orgStructure.js',import.meta.url),'utf8');
  const node=parse(src,{ecmaVersion:'latest',sourceType:'module'}).body.map(n=>n.type==='ExportNamedDeclaration'?n.declaration:n).find(n=>n?.type==='FunctionDeclaration'&&n.id.name==='suggestSuccessFactorsAddressCore');
  let called='',authorized=0;
  const ctx=vm.createContext({URLSearchParams,Date,addressLookupWindows:new Map(),requireStaffPortalSessionCore:async()=>{authorized++;return {profile:{id:'staff-1'}}},text:(x,max)=>String(x||'').trim().slice(0,max),elevatedGetSecret:async()=>({value:'pk.example.token'}),SkandiError:class extends Error {},fetch:async url=>{called=url;return {ok:true,json:async()=>({features:[{properties:{name:'123 Main Street',full_address:'123 Main Street, New York, NY',context:{place:{name:'New York'},region:{region_code:'NY'},postcode:{name:'10001'},country:{name:'United States'}}}}]})}}});
  vm.runInContext(src.slice(node.start,node.end)+';this.fn=suggestSuccessFactorsAddressCore;',ctx);
  const result=await ctx.fn({query:'123 Main',country:'US'});
  assert.equal(authorized,1);assert.equal(new URL(called).searchParams.get('permanent'),'true');assert.equal(result.items[0].postalCode,'10001');assert.equal(Object.hasOwn(result.items[0],'coordinates'),false);
});
