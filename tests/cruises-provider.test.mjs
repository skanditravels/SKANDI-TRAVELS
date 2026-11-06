import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import {createRequire} from 'node:module';

const require = createRequire(new URL('../scripts/package.json', import.meta.url));
const {parse} = require('acorn');

async function makeActor(response) {
  const source = await fs.readFile(new URL('../src/backend/SKANDI_CORE/cruises.js', import.meta.url), 'utf8');
  const node = parse(source, {ecmaVersion: 'latest', sourceType: 'module'}).body.find(n => n.type === 'FunctionDeclaration' && n.id.name === 'runRoyalCaribbeanActor');
  const context = {
    readSecret: async () => 'test-token', APIFY_TOKEN_SECRET: 'secret', APIFY_SYNC_URL: 'https://example.invalid',
    PROVIDER_SYNC_TIMEOUT_SECONDS: 1, PROVIDER_MEMORY_MB: 128, PROVIDER_MAX_ROWS: 20, PROVIDER_BUILD: 'test',
    fetch: async () => response, providerActorInput: () => ({}), clean: value => String(value || ''),
    publicError: (code, message) => Object.assign(new Error(message), {code}),
  };
  vm.createContext(context);
  return vm.runInContext(`(${source.slice(node.start, node.end)})`, context);
}

test('cruise provider reads the response and never treats malformed success as an empty result', async () => {
  const actor = await makeActor({ok: true, json: async () => [{id: 'sailing'}]});
  assert.equal((await actor('caribbean'))[0].id, 'sailing');
  for (const response of [
    {ok: true, json: async () => {throw new Error('invalid JSON');}},
    {ok: true, json: async () => ({unexpected: true})},
  ]) {
    const invalidActor = await makeActor(response);
    await assert.rejects(invalidActor('caribbean'), {code: 'CRUISES_PROVIDER_INVALID_RESPONSE'});
  }
  const deniedActor = await makeActor({ok: false, status: 401, json: async () => {throw new Error('invalid JSON');}});
  await assert.rejects(deniedActor('caribbean'), {code: 'CRUISES_PROVIDER_AUTH'});
});
