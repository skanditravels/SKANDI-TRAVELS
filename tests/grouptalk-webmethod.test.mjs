import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';
import { createRequire } from 'node:module';

const require = createRequire(new URL('../scripts/package.json', import.meta.url));
const { parse } = require('acorn');

test('GroupTalk page methods are directly exposed as Wix web methods', async () => {
  let source = await fs.readFile(new URL('../src/backend/SKANDI_CORE/groupTalk.web.js', import.meta.url), 'utf8');
  const syntax = parse(source, { ecmaVersion: 'latest', sourceType: 'module' });
  const methods = syntax.body.filter(node => node.type === 'ExportNamedDeclaration');
  assert.equal(methods.length, 19);
  for (const method of methods) {
    const value = method.declaration.declarations[0].init;
    assert.equal(value.type, 'CallExpression');
    assert.equal(value.callee.name, 'webMethod');
    assert.equal(value.arguments[0].object.name, 'Permissions');
    assert.equal(value.arguments[0].property.name, 'Anyone');
  }

  const calls = [];
  const core = new Proxy({}, { get: (_, name) => input => {
    calls.push({ name, input });
    if (input.denied) throw new Error('GROUPTALK_ACCESS_DISABLED');
    return { ok: true };
  } });
  source = source.replace(/^import .*;$/gm, '').replace(/^export /gm, '');
  const names = methods.map(node => node.declaration.declarations[0].id.name);
  const context = { core, Permissions: { Anyone: 'Anyone' }, webMethod: (_, handler) => handler };
  vm.createContext(context);
  vm.runInContext(`${source}\nthis.methods = { ${names.join(', ')} };`, context);
  assert.equal((await context.methods.getPhoneBook({ groupId: 'staff' })).ok, true);
  assert.equal(calls.at(-1).name, 'getPhoneBookCore');
  await assert.rejects(context.methods.getGroupTalkBootstrap({ denied: true }), /GROUPTALK_ACCESS_DISABLED/);
});

test('radio tones use the existing authorized GroupTalk broadcast', async () => {
  const source = await fs.readFile(new URL('../src/backend/SKANDI_CORE/groupTalk.js', import.meta.url), 'utf8');
  const {body} = parse(source, {ecmaVersion:'latest', sourceType:'module'});
  const allowed = body.find(node=>node.declarations?.[0]?.id.name==='ALLOWED_EVENTS');
  const trigger = body.find(node=>node.declaration?.id?.name==='triggerGroupTalkEventCore').declaration;
  const calls = [];
  const context = vm.createContext({
    staff:async()=>({}), profile:()=>({skId:'TEST01'}), upper:value=>String(value).toUpperCase(),
    requireGroup:async(_staff, id)=>({group:{id,group_key:id},public:{capabilities:{canTalk:id==='dispatch'}}}),
    clean:value=>String(value??''), now:()=>new Date().toISOString(), audit(){}, history(){},
    async broadcast(group,event,data){calls.push({group,event,data});return {ok:true};}
  });
  vm.runInContext(source.slice(allowed.start,allowed.end)+'\n'+source.slice(trigger.start,trigger.end)+'\nthis.send=triggerGroupTalkEventCore;',context);
  await assert.rejects(context.send({type:'TONE_SIGNAL',groupId:'listen-only'}),/GROUPTALK_TALK_DISABLED/);
  assert.equal(calls.length,0);
  assert.equal((await context.send({type:'TONE_SIGNAL',groupId:'dispatch'})).realtime.ok,true);
  assert.equal(calls[0].event,'grouptalk-event');
  assert.equal(calls[0].data.type,'TONE_SIGNAL');
  assert.equal(calls[0].data.groupId,'dispatch');
});
