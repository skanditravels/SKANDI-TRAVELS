import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import { createRequire } from 'node:module';

const require = createRequire(new URL('../scripts/package.json',import.meta.url));
const { parse } = require('acorn');
const src=await fs.readFile(new URL('../src/backend/SKANDI_CORE/staffAuth.js',import.meta.url),'utf8');
const nodes=parse(src,{ecmaVersion:'latest',sourceType:'module'}).body.map(n=>n.type==='ExportNamedDeclaration'?n.declaration:n);
const node=nodes.find(n=>n.type==='FunctionDeclaration'&&n.id.name==='loginStaffWithSkIdCore');
assert.ok(node);
function setup(agent) {
  let used='';
  const c={agent, normalizeSkId:v=>v, isValidSkId:v=>/^[A-Z]{2}\d{4}$/.test(v),
    findAgentBySkId:async()=>agent, assertIdentity:()=>{}, resolveAuthorization:async()=>({}),
    email:v=>v||'', authentication:{login:async e=>{used=e;return {token:'t'}}}, loginToken:x=>x.token,
    tryWriteStaffLoginAudit:async()=>{}, authorized:()=>({profile:{},apps:[],allowedApps:[],permissionKeys:[],permissionGroups:[]}),
    SkandiError:class extends Error {constructor(code){super(code);this.code=code}}, errorCode:e=>e.code||'ERROR', publicLoginMessage:x=>x
  };
  vm.createContext(c);vm.runInContext(src.slice(node.start,node.end)+';this.run=loginStaffWithSkIdCore',c);
  return {run:c.run,used:()=>used};
}
test('new pre-provisioned hire signs in through their existing Wix email',async()=>{
  const h=setup({id:'a',corporate_email_address:'ada.jones@skanditravels.com',email:'ada@example.test',payload:{successFactors:{wixLoginEmail:'ada@example.test'}}});
  await h.run({skId:'AJ1234',password:'test'});assert.equal(h.used(),'ada@example.test');
});
test('older staff continue to use their existing corporate Wix login',async()=>{
  const h=setup({id:'a',corporate_email_address:'ada.jones@skanditravels.com',email:'ada@example.test'});
  await h.run({skId:'AJ1234',password:'test'});assert.equal(h.used(),'ada.jones@skanditravels.com');
});
