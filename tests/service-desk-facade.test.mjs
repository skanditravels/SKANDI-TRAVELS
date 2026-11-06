import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const require=createRequire(new URL('../scripts/package.json',import.meta.url));const {parse}=require('acorn');
test('agent Duffel methods remain site-member methods and pass authorization failures through',async()=>{
 let code=await fs.readFile(new URL('../src/backend/SKANDI_CORE/duffelAssistant.web.js',import.meta.url),'utf8');
 for(const n of parse(code,{ecmaVersion:'latest',sourceType:'module'}).body.filter(n=>n.type==='ImportDeclaration').reverse())code=code.slice(0,n.start)+code.slice(n.end);
 code=code.replace(/\bexport\s+const\s+/g,'globalThis.');
 const calls=[],denied=Object.assign(new Error('SUPPORT_AGENT_ACCESS_DENIED'),{code:'SUPPORT_AGENT_ACCESS_DENIED'});
 const fn=name=>async input=>{calls.push([name,input]);throw denied};
 const ctx={Permissions:{SiteMember:'site-member'},webMethod:(permission,handler)=>({permission,handler}),currentMember:{},createCustomerDuffelAssistantSessionCore:fn('customer'),recordCustomerDuffelAssistantEventCore:fn('customer'),getCustomerDuffelAssistantActivityCore:fn('customer'),verifyCustomerDuffelAssistantBookingCore:fn('customer'),getAgentDuffelSupportContextCore:fn('context'),verifyAgentDuffelSupportBookingCore:fn('verify'),routeAgentDuffelSupportCaseCore:fn('route'),prepareAgentDuffelSupportHandoffCore:fn('handoff')};
 vm.createContext(ctx);vm.runInContext(code,ctx);
 for(const name of ['getAgentDuffelSupportContext','verifyAgentDuffelSupportBooking','routeAgentDuffelSupportCase','prepareAgentDuffelSupportHandoff']){
  assert.equal(ctx[name].permission,'site-member');await assert.rejects(ctx[name].handler({caseId:'case_abc'}),/SUPPORT_AGENT_ACCESS_DENIED/);
 }
 assert.equal(calls.length,4);
 const core=await fs.readFile(new URL('../src/backend/SKANDI_CORE/duffelAssistant.js',import.meta.url),'utf8');
 const support=await fs.readFile(new URL('../src/backend/SKANDI_CORE/customerSupport.js',import.meta.url),'utf8');
 assert.match(core,/async function agentAssistantCase[\s\S]*?getAgentSupportCaseCore\(/);
 assert.match(support,/export async function getAgentSupportCaseCore[\s\S]*?requireSupportAgentCore\(/);
});
