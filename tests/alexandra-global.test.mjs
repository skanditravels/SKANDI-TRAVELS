import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
import test from 'node:test';
import vm from 'node:vm';
import { getSiteRoute, isSafeInternalRoute, normalizeSitePath, PAGE_BUILD_INTEGRATIONS, SITE_MAP } from '../src/public/siteMap.js';

const require = createRequire(new URL('../scripts/package.json', import.meta.url));
const { parse } = require('acorn');
const { JSDOM } = require('jsdom');
const source = await fs.readFile(new URL('../src/public/alexandraGlobalBridge.js', import.meta.url), 'utf8');
const browserSource = await fs.readFile(new URL('../skandi-embeds/global/alexandra/skandi-alexandra-chat.js', import.meta.url), 'utf8');
const browserMarkup = await fs.readFile(new URL('../skandi-embeds/global/alexandra/skandi-alexandra-chat.html', import.meta.url), 'utf8');
const imports = parse(source, { ecmaVersion: 'latest', sourceType: 'module' }).body.filter(node => node.type === 'ImportDeclaration');
let code = source;
for (const node of imports.reverse()) code = code.slice(0, node.start) + code.slice(node.end);
code = code.replace(/^export /gm, '') + '\n({ bindAlexandraGlobal });';

const storageKey = 'skandi_alexandra_livekit_chat_v12';
const greetingKey = 'skandi_alexandra_greeting_seen';
const fakeRoom = { sessionId:'session-1', roomName:'room-1', url:'wss://example.test', token:'only-in-memory', resumeTicket:'slot-proof' };
const tick = () => new Promise(resolve => setImmediate(resolve));

function fakeEmbed(parentType = '$w.Section') {
  const sent = [], classes = new Set();
  let receive, visible = false;
  return {
    sent, classes, get visible() { return visible; },
    show() { visible = true; },
    hide() { visible = false; },
    parent: { type: parentType, customClassList: { add: key => classes.add(key), remove: key => classes.delete(key) } },
    onMessage(handler) { assert.equal(receive, undefined, 'only one listener per widget'); receive = handler; },
    postMessage(data) { sent.push(data); },
    receive(type, payload = {}, instance = 'widget-1') { return receive({ data: { source:'SKANDI_SUPPORT_CHAT', type, payload:{ instance, ...payload } } }); }
  };
}

function controller({ store = new Map(), panel = fakeEmbed(), initialPath = '/flights', start, human } = {}) {
  const requests = [], paths = [];
  const timers = new Map();
  let timerId = 0;
  let member = 'member-one';
  const api = vm.runInNewContext(code, {
    setTimeout: callback => { timers.set(++timerId, callback); return timerId; },
    clearTimeout: id => timers.delete(id),
    session: { getItem: key => store.get(key), setItem: (key, value) => store.set(key, value), removeItem: key => store.delete(key) },
    currentMember: { getMember: async () => member && { _id: member } },
    SITE_MAP, PAGE_BUILD_INTEGRATIONS, getSiteRoute, isSafeInternalRoute, normalizeSitePath, console,
    startAlexandraLiveKitSession: async input => { requests.push(input); return start ? start(input) : { ok:true, session:fakeRoom }; },
    getCustomerSupportBootstrap: async () => ({ workflows: [] }),
    getCustomerSupportCase: async () => ({ livekitSession: { ...fakeRoom, roomName:'support-room' } }),
    requestCustomerHumanHandoff: async () => human || { caseId:'case-1', status:'queued' }
  });
  const options = { wixSelector: id => id === '#skandiAlexandraGlobalEmbed' && panel, enabled: () => true, navigate: path => paths.push(path), settings: () => ({ locale:'sv-SE', currency:'SEK' }), initialPath };
  const bridge = api.bindAlexandraGlobal(options);
  return {
    bridge, panel, requests, store, paths, options, timers,
    showScheduledGreeting() {
      for (const [id, callback] of [...timers]) {
        timers.delete(id);
        callback();
      }
    },
    bind:api.bindAlexandraGlobal, memberAs: value => { member = value; }
  };
}

test('every public page uses the existing chat host and one dispatch, including Booking and native commerce', async () => {
  const { panel, requests, bridge, store, bind, options } = controller();
  await panel.receive('SUPPORT_CHAT_READY');
  assert.equal(panel.visible, true);
  await panel.receive('SUPPORT_CHAT_START_ALEXANDRA');
  await panel.receive('SUPPORT_CHAT_SNAPSHOT', { messages:[{ role:'assistant', content:'Your itinerary' }], draft:'Work in progress' });
  assert.equal(requests.length, 1);
  assert.equal(requests[0].pagePath, '/flights');
  assert.equal(requests[0].currency, 'SEK');
  assert.ok(panel.classes.has('skandi-alexandra-host-open'));
  assert.equal(store.get(storageKey).includes(fakeRoom.token), false);
  assert.equal(store.get(storageKey).includes(fakeRoom.resumeTicket), true);
  for (const path of ['/travel-info', '/booking', '/the-store', '/about/support', '/the-store/store-checkout']) {
    assert.equal(bind({ ...options, initialPath:path }), bridge);
    await panel.receive('SUPPORT_CHAT_READY');
    assert.equal(panel.visible, true);
    assert.ok(panel.classes.has('skandi-alexandra-host-open'));
  }
  assert.equal(requests.length, 1);
  assert.equal(panel.sent.filter(message => message.type === 'SUPPORT_CHAT_OPEN').length, 1);
  assert.equal(panel.sent.some(message => message.type === 'SUPPORT_CHAT_FORCE_CLOSE'), false);
});

test('a fresh Wix document restores the draft and rejoins the original chat before another dispatch', async () => {
  const first = controller();
  await first.panel.receive('SUPPORT_CHAT_READY');
  await first.panel.receive('SUPPORT_CHAT_START_ALEXANDRA');
  await first.panel.receive('SUPPORT_CHAT_SNAPSHOT', { messages:[{role:'user',content:'Confirm my plans'}], draft:'And the hotel?' });
  const next = controller({ store:first.store, initialPath:'/the-store' });
  await next.panel.receive('SUPPORT_CHAT_READY', {}, 'widget-2');
  const hydrated = next.panel.sent.find(message => message.type === 'SUPPORT_CHAT_RESTORE');
  assert.equal(hydrated.payload.open, true);
  assert.equal(hydrated.payload.messages[0].content, 'Confirm my plans');
  assert.equal(hydrated.payload.draft, 'And the hotel?');
  assert.equal(next.requests.length, 1);
  assert.equal(next.requests[0].resumeTicket, fakeRoom.resumeTicket);
  const resumed = next.panel.sent.find(message => message.type === 'SUPPORT_CHAT_OPEN');
  assert.equal(resumed.payload.alexandraSession.roomName, fakeRoom.roomName);
  assert.equal(resumed.payload.alexandraSession.resumeTicket, undefined);
});

test('replacing the global frame reconnects a minimized conversation without expanding it', async () => {
  const { panel, requests } = controller();
  await panel.receive('SUPPORT_CHAT_READY');
  await panel.receive('SUPPORT_CHAT_START_ALEXANDRA');
  await panel.receive('SUPPORT_CHAT_PANEL_CLOSE');
  await panel.receive('SUPPORT_CHAT_READY', {}, 'widget-2');
  assert.equal(requests.length, 2);
  assert.equal(requests[1].resumeTicket, fakeRoom.resumeTicket);
  assert.equal(panel.sent.filter(m => m.type === 'SUPPORT_CHAT_OPEN').at(-1).payload.open, false);
  assert.equal(panel.classes.has('skandi-alexandra-host-open'), false);
});

test('the host layout is applied to a Wix Section without restyling the enclosing page', async () => {
  const panel = fakeEmbed('$w.Page');
  const { bridge } = controller({ panel });
  await panel.receive('SUPPORT_CHAT_READY');
  await bridge.open();
  assert.equal(panel.visible, true);
  assert.equal(panel.classes.size, 0);
});

test('the Help Center opens the global chat and ignores a second iframe announcing itself', async () => {
  const { bridge, panel, requests } = controller({initialPath:'/about/support'});
  await panel.receive('SUPPORT_CHAT_READY');
  const inline = fakeEmbed();
  await bridge.handleSupportMessage(inline, { source:'SKANDI_SUPPORT_CHAT', type:'SUPPORT_CHAT_READY', payload:{ instance:'inline' } });
  assert.ok(inline.sent.some(m => m.type === 'SUPPORT_CHAT_HOST_STATE' && !m.payload.active));
  await bridge.open();
  assert.equal(requests.length, 1);
  assert.ok(panel.sent.some(m => m.type === 'SUPPORT_CHAT_OPEN'));
  assert.equal(inline.sent.some(m => m.type === 'SUPPORT_CHAT_OPEN'), false);
});

test('the checkout, order confirmation and profile receivers restore the same chat when a Wix section is unavailable', async () => {
  const first = controller();
  await first.panel.receive('SUPPORT_CHAT_READY');
  await first.panel.receive('SUPPORT_CHAT_START_ALEXANDRA');
  await first.panel.receive('SUPPORT_CHAT_SNAPSHOT', { draft:'Checkout support question' });
  for (const key of ['storeCheckout', 'storeConfirmation', 'myProfile']) {
    const next = controller({ panel:null, initialPath:getSiteRoute(key), store:first.store });
    const candidate = { ...fakeEmbed(), id:PAGE_BUILD_INTEGRATIONS[key].embedIds[0].slice(1) };
    const message = { source:'SKANDI_SUPPORT_CHAT', type:'SUPPORT_CHAT_READY', payload:{ instance:key } };
    assert.equal(await next.bridge.handlePageChatMessage({ ...candidate, id:'someOtherEmbed' }, message), false);
    assert.equal(await next.bridge.handlePageChatMessage(candidate, { ...message, type:'SUPPORT_CHAT_SNAPSHOT' }), true);
    assert.equal(next.requests.length, 0);
    assert.equal(await next.bridge.handlePageChatMessage(candidate, message), true);
    const restored = candidate.sent.find(m => m.type === 'SUPPORT_CHAT_RESTORE');
    assert.equal(restored.payload.draft, 'Checkout support question');
    assert.equal(restored.payload.open, true);
    assert.equal(next.requests[0].resumeTicket, fakeRoom.resumeTicket);
  }
});

test('duplicate ready messages, navigation, and a reload can only show one greeting per tab session', async () => {
  const first = controller();
  const greet = { greetingSupported: true };
  await first.panel.receive('SUPPORT_CHAT_READY', greet);
  await first.panel.receive('SUPPORT_CHAT_READY', greet);
  assert.equal(first.timers.size, 1);
  first.bridge.onRouteChange('/travel-info');
  assert.equal(first.timers.size, 0);
  await first.panel.receive('SUPPORT_CHAT_READY', greet);
  first.showScheduledGreeting();
  assert.equal(first.store.get(greetingKey), '1');
  assert.equal(first.panel.sent.at(-1).payload.greeting, true);
  assert.ok(first.panel.classes.has('skandi-alexandra-host-greeting'));
  assert.equal(first.requests.length, 0);
  await first.panel.receive('SUPPORT_CHAT_GREETING_DISMISS');
  assert.equal(first.panel.sent.at(-1).payload.greeting, false);
  assert.equal(first.panel.classes.has('skandi-alexandra-host-greeting'), false);
  first.bridge.onRouteChange('/booking');
  await first.panel.receive('SUPPORT_CHAT_READY', greet, 'widget-2');
  assert.equal(first.timers.size, 0);
  const reloaded = controller({store:first.store});
  await reloaded.panel.receive('SUPPORT_CHAT_READY', greet);
  assert.equal(reloaded.timers.size, 0);

  const newTab = controller();
  await newTab.panel.receive('SUPPORT_CHAT_READY', greet);
  newTab.showScheduledGreeting();
  assert.equal(newTab.panel.sent.at(-1).payload.greeting, true);
  newTab.bridge.onRouteChange('/about');
  assert.equal(newTab.panel.classes.has('skandi-alexandra-host-greeting'), false);
  await newTab.panel.receive('SUPPORT_CHAT_READY', greet, 'widget-3');
  assert.equal(newTab.timers.size, 0);
});

test('opening Alexandra early consumes the greeting without showing it after minimizing', async () => {
  const first = controller();
  await first.panel.receive('SUPPORT_CHAT_READY', { greetingSupported: true });
  await first.panel.receive('SUPPORT_CHAT_PANEL_OPEN');
  await first.panel.receive('SUPPORT_CHAT_PANEL_CLOSE');
  first.showScheduledGreeting();
  assert.equal(first.store.get(greetingKey), '1');
  assert.equal(first.panel.sent.some(message => message.payload.greeting), false);
});

test('internal navigation blocks the widget and a new member cannot see the old transcript', async () => {
  const { bridge, panel, memberAs, requests, store } = controller();
  await panel.receive('SUPPORT_CHAT_READY');
  await panel.receive('SUPPORT_CHAT_START_ALEXANDRA');
  await panel.receive('SUPPORT_CHAT_SNAPSHOT', { messages:[{ role:'user', content:'Prior member transcript' }], draft:'Private draft' });
  bridge.onRouteChange('/riaintra/success-factors');
  assert.equal(panel.visible, false);
  assert.equal(await bridge.open(), false);
  assert.equal(requests.length, 1);
  assert.ok(panel.sent.some(message => message.type === 'SUPPORT_CHAT_FORCE_CLOSE'));
  memberAs('member-two');
  bridge.onRouteChange('/cars');
  await panel.receive('SUPPORT_CHAT_READY', {}, 'widget-2');
  await bridge.refreshIdentity();
  assert.equal(requests.length, 1);
  assert.equal(store.has(storageKey), false);
  const restored = panel.sent.filter(message => message.type === 'SUPPORT_CHAT_RESTORE').at(-1);
  assert.equal(restored.payload.messages.length, 0);
  assert.equal(restored.payload.draft, '');
});

test('mobile navigation can open the same host or load the Help Center only when the host is absent', async () => {
  const mounted = controller();
  await mounted.panel.receive('SUPPORT_CHAT_READY');
  await mounted.bridge.openFromMobile('mobile-click');
  assert.equal(mounted.requests.length, 1);
  assert.equal(mounted.paths.length, 0);
  const fallback = controller({ panel:null });
  await fallback.bridge.openFromMobile('mobile-click');
  assert.deepEqual(fallback.paths, ['/about/support']);
  const help = controller({ panel:null, initialPath:'/about/support', store:fallback.store });
  const inline = fakeEmbed();
  await help.bridge.handleSupportMessage(inline, { source:'SKANDI_SUPPORT_CHAT', type:'SUPPORT_CHAT_READY', payload:{ instance:'inline' } });
  assert.ok(inline.sent.some(m => m.type === 'SUPPORT_CHAT_OPEN'));
});

test('an expired room keeps the transcript and waits for a deliberate retry', async () => {
  const store = new Map([[storageKey, JSON.stringify({ memberId:'member-one', open:true, resumeTicket:'expired', messages:[{role:'user',content:'Earlier question'}] })]]);
  const { panel, requests } = controller({ store, start: input => input.resumeTicket ? { ok:false, code:'ALEXANDRA_SESSION_ENDED' } : { ok:true, session:fakeRoom } });
  await panel.receive('SUPPORT_CHAT_READY');
  assert.equal(requests.length, 1);
  assert.equal(requests[0].resumeTicket, 'expired');
  assert.ok(panel.sent.some(m => m.type === 'SUPPORT_CHAT_ERROR' && m.payload.message.includes('Your messages are here')));
  assert.equal(panel.sent.find(m => m.type === 'SUPPORT_CHAT_RESTORE').payload.messages[0].content, 'Earlier question');
  await panel.receive('SUPPORT_CHAT_START_ALEXANDRA');
  assert.equal(requests.length, 2);
  assert.equal(requests[1].resumeTicket, undefined);
});

test('the actual widget keeps its LiveKit room on minimize and ignores messages from a different frame',async t => {
  const sent = [], parent = { postMessage: message => sent.push(message) };
  const dom = new JSDOM(browserMarkup, { runScripts:'outside-only', url:'https://embed.example', pretendToBeVisual:true });
  t.after(() => dom.window.close());
  const w = dom.window;
  Object.defineProperty(w, 'parent', { value: parent });
  const rooms = [];
  class Room {
    constructor() { rooms.push(this); this.callbacks = new Map(); this.localParticipant = { sendText:async () => {} }; }
    registerTextStreamHandler(topic, fn) { this.reply = fn; }
    registerRpcMethod() {}
    on(name, handler) { this.callbacks.set(name, handler); }
    async connect(_url, _token, options) { this.connectOptions = options; this.state = 'connected'; }
    async disconnect() { this.state = 'disconnected'; }
  }
  w.LivekitClient = { Room, RoomEvent:{ TrackSubscribed:'track', TrackUnsubscribed:'untrack', Disconnected:'disconnected', Reconnecting:'reconnecting', Reconnected:'reconnected' } };
  w.eval(browserSource);
  const send = (type, payload, source = parent) => w.dispatchEvent(new w.MessageEvent('message', {source, data:{source:'SKANDI_WIX_PARENT',type,payload}}));
  send('SUPPORT_CHAT_RESTORE', {active:true, open:true, draft:'Still typing', messages:[{role:'assistant',content:'Earlier reply'}]});
  send('SUPPORT_CHAT_OPEN', {alexandraSession:fakeRoom});
  await tick();
  assert.equal(rooms[0].connectOptions.autoSubscribe, false);
  assert.equal(rooms[0].callbacks.has('track'), false);
  assert.equal(w.document.querySelector('audio, #humanBtn'), null);
  send('SUPPORT_CHAT_FORCE_CLOSE', {}, {});
  assert.equal(rooms[0].state, 'connected');
  w.document.querySelector('#closeBtn').click();
  await rooms[0].reply({readAll:async () => 'Reply while minimized'}, {identity:'alexandra'});
  w.document.querySelector('#launcher').click();
  send('SUPPORT_CHAT_OPEN', {alexandraSession:fakeRoom});
  await tick();
  assert.equal(rooms.length, 1);
  assert.equal(w.document.querySelector('#input').value, 'Still typing');
  assert.match(w.document.querySelector('#messages').textContent, /Reply while minimized/);
  assert.ok(sent.some(m => m.type === 'SUPPORT_CHAT_PANEL_CLOSE'));
});

test('the portrait follows the launcher and the greeting can open the chat or be dismissed', t => {
  const sent = [], parent = { postMessage: message => sent.push(message) };
  const dom = new JSDOM(browserMarkup, { runScripts:'outside-only', url:'https://embed.example', pretendToBeVisual:true });
  t.after(() => dom.window.close());
  const w = dom.window;
  Object.defineProperty(w, 'parent', { value: parent });
  w.eval(browserSource);
  const widget = id => w.document.getElementById(id);
  const receive = payload => w.dispatchEvent(new w.MessageEvent('message', {
    source:parent, data:{source:'SKANDI_WIX_PARENT', type:'SUPPORT_CHAT_HOST_STATE', payload}
  }));
  const portrait = widget('alexandraPortrait');
  widget('alexandraPortraitImage').dispatchEvent(new w.Event('load'));
  receive({active:true, greeting:true, language:'SV'});
  assert.equal(widget('greetingOpen').textContent, 'Hej, kan jag hjälpa dig?');
  assert.equal(portrait.parentElement.id, 'launcher');
  assert.equal(portrait.hidden, false);
  assert.equal(widget('alexandraGreeting').hidden, false);
  widget('greetingDismiss').click();
  assert.equal(widget('alexandraGreeting').hidden, true);
  assert.equal(widget('launcher').getAttribute('aria-expanded'), 'false');
  assert.ok(sent.some(message => message.type === 'SUPPORT_CHAT_GREETING_DISMISS'));

  receive({active:true, greeting:true, language:'EN'});
  widget('greetingOpen').click();
  assert.equal(widget('alexandraGreeting').hidden, true);
  assert.equal(widget('launcher').getAttribute('aria-expanded'), 'true');
  assert.equal(portrait.parentElement.id, 'avatarSlot');
  widget('closeBtn').click();
  assert.equal(portrait.parentElement.id, 'launcher');
  assert.equal(widget('alexandraGreeting').hidden, true);
});
