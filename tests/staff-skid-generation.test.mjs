import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import { createRequire } from 'node:module';

const require = createRequire(new URL('../scripts/package.json', import.meta.url));
const { parse } = require('acorn');
const source = await fs.readFile(new URL('../src/backend/SKANDI_CORE/orgStructure.js', import.meta.url), 'utf8');
const nodes = parse(source, { ecmaVersion: 'latest', sourceType: 'module' }).body.map(n => n.type === 'ExportNamedDeclaration' ? n.declaration : n);
function fn(name) { const n = nodes.find(x => x.type === 'FunctionDeclaration' && x.id.name === name); assert.ok(n, name); return source.slice(n.start,n.end); }

function harness({ race = false, otherConflict = false } = {}) {
  const seen = new Set(); const inserted = []; let draws = 0; let posts = 0;
  class SkandiError extends Error { constructor(code, message) { super(message); this.code=code; } }
  const c = {
    SkandiError, Date, DEFAULT_ACCESS_ROLE:'READ_ONLY', DEFAULT_PERMISSION_PRESET:'read-only',
    text:(v,n)=>String(v || '').trim().slice(0,n), firstRow:v=>v?.[0] || null,
    randomInt:()=>[1234,1234,5,9999][draws++ % 4],
    requireHr:async()=>({profile:{id:'manager'}}), normalizeCorporateEmail:v=>v,
    select:async (table,q)=>q.sk_id && seen.has(q.sk_id.slice(3)) ? [{id:'already-exists'}] : [],
    restRequest:async req=>{
      if(req.table !== 'agent_users' || req.method !== 'POST') return [];
      posts++;
      if(otherConflict) { const e=new Error('other unique constraint'); e.supabase={code:'23505'}; throw e; }
      if(race && posts===1) { seen.add(req.body.sk_id); const e=new Error('sk_id collision'); e.supabase={code:'23505'}; throw e; }
      seen.add(req.body.sk_id); inserted.push(req.body); return [{id:'employee',...req.body}];
    },
    hrProfilePatch:()=>({}), provisionWixMemberForAgent:async()=>({ok:true,linked:true,member:{id:'private-wix-id'}}),
    findAgent:async()=>null, safeAgent:x=>({skId:x.sk_id}), errorCode:e=>e.code || 'ERROR', console,
  };
  vm.createContext(c); vm.runInContext(['skIdInitials','uniqueSkId','createEmployeeCore'].map(fn).join('\n')+'\nthis.initials=skIdInitials;this.generate=uniqueSkId;this.create=createEmployeeCore;',c);
  return { ...c, seen, inserted, posts:()=>posts };
}

test('initials normalize Nordic and European names and retain the existing format', async()=>{
  const h=harness();
  assert.equal(h.initials('Åsa','Østergård'),'AO');
  assert.equal(h.initials('Émile','Ülker'),'EU');
  assert.equal(await h.generate('Samuel','Higberg'),'SH1234');
  await assert.rejects(h.generate('李','Higberg'), e=>e.code==='HR_SKID_NAME_INITIAL_INVALID');
});
test('generates a new ID after a claimed random value, preserving leading zeroes',async()=>{
  const h=harness(); h.seen.add('SH1234');
  assert.equal(await h.generate('Samuel','Higberg'),'SH0005');
});
test('a concurrent SK-ID collision is retried at insert, without changing the supplied name',async()=>{
  const h=harness({race:true});
  const result=await h.create({firstName:'Samuel',lastName:'Higberg',corporateEmail:'samuel@example.test',skId:'ZZ9999'});
  assert.equal(result.employee.skId,'SH0005'); assert.equal(h.posts(),2); assert.equal(h.inserted[0].agent_id,'SH0005');
});
test('other uniqueness errors are not retried or hidden',async()=>{
  const h=harness({otherConflict:true});
  await assert.rejects(h.create({firstName:'Samuel',lastName:'Higberg',corporateEmail:'samuel@example.test'}),/other unique constraint/);
  assert.equal(h.posts(),1);
});
test('the planned corporate address uses the unique email field while Wix sign-in and personal email remain separate',async()=>{
  const h=harness();
  await h.create({firstName:'Ada',lastName:'Jones',corporateEmail:'ada.jones@skanditravels.com',personalEmail:'ada@example.test',wixLoginEmail:'ada@example.test'});
  assert.equal(h.inserted[0].corporate_email_address,'ada.jones@skanditravels.com');
  assert.equal(h.inserted[0].email,'ada.jones@skanditravels.com');
  assert.equal(h.inserted[0].payload.successFactors.personalEmail,'ada@example.test');
  assert.equal(h.inserted[0].payload.successFactors.wixLoginEmail,'ada@example.test');
  assert.equal(h.inserted[0].payload.successFactors.workspaceProvisioningStatus,'PLANNED');
});
