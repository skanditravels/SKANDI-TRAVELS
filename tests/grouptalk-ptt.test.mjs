import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
import test from 'node:test';
import vm from 'node:vm';

const require = createRequire(new URL('../scripts/package.json', import.meta.url));
const { parse } = require('acorn');
const source = await fs.readFile(new URL('../altea-embeds/group-talk/skandi-group-talk.js', import.meta.url), 'utf8');
const ast = parse(source, { ecmaVersion: 'latest' });
const functions = ['setMic', 'startPtt', 'stopPtt'].map(name => {
  const node = ast.body.find(item => item.type === 'FunctionDeclaration' && item.id.name === name);
  assert.ok(node, `${name} exists`);
  return source.slice(node.start, node.end);
}).join('\n');

function deferred() {
  let resolve;
  const promise = new Promise(r => { resolve = r; });
  return { promise, resolve };
}

function setup(connect, microphone) {
  const room = { localParticipant: { setMicrophoneEnabled: microphone } };
  const events = [];
  const state = { activeGroup: { groupId: 'group-1', capabilities: { canTalk: true } }, room, pttHeld: false, speaking: false, pttSequence: 0, micQueue: Promise.resolve(), mode: 'desktop' };
  const context = { state, connectLiveKit: () => connect(room), gid: () => state.activeGroup.groupId,
    document: { body: { classList: { add() {}, remove() {} } } }, $: () => null,
    micLevelStart() {}, micLevelStop() {}, sendPtt: type => events.push(type), toast: message => { throw new Error(message); } };
  vm.createContext(context);
  vm.runInContext(`${functions}\nthis.start = startPtt; this.stop = stopPtt;`, context);
  return { ...context, events, room };
}

test('releasing while connecting never enables the microphone', async () => {
  const connection = deferred();
  const calls = [];
  const app = setup(() => connection.promise, async value => calls.push(value));
  const start = app.start();
  await app.stop();
  connection.resolve(app.room);
  await start;
  assert.deepEqual(calls, [false]);
  assert.ok(!app.events.includes('PTT_DOWN_DESKTOP'));
});

test('release serializes mute after a microphone enable still in progress', async () => {
  const enabling = deferred();
  const entered = deferred();
  const calls = [];
  const app = setup(room => Promise.resolve(room), async value => {
    calls.push(value);
    if (value) { entered.resolve(); await enabling.promise; }
  });
  const start = app.start();
  await entered.promise;
  const stop = app.stop();
  assert.deepEqual(calls, [true]);
  enabling.resolve();
  await Promise.all([start, stop]);
  assert.deepEqual(calls, [true, false]);
  assert.ok(!app.events.includes('PTT_DOWN_DESKTOP'));
});

test('a rapid new press waits for the previous release to mute', async () => {
  const enabling = deferred();
  const entered = deferred();
  const calls = [];
  const app = setup(room => Promise.resolve(room), async value => {
    calls.push(value);
    if (value && calls.length === 1) { entered.resolve(); await enabling.promise; }
  });
  const first = app.start();
  await entered.promise;
  const stop = app.stop();
  const second = app.start();
  enabling.resolve();
  await Promise.all([first, stop, second]);
  assert.deepEqual(calls, [true, false, true]);
  assert.equal(app.events.filter(type => type === 'PTT_DOWN_DESKTOP').length, 1);
  await app.stop();
  assert.equal(calls.at(-1), false);
});
