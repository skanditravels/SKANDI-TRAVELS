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
