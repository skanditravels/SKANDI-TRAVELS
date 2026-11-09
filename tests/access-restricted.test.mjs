import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {PAGE_BUILD_INTEGRATIONS, SITE_MAP, resolveBuildRoute} from '../src/public/siteMap.js';

const require = createRequire(new URL('../scripts/package.json', import.meta.url));
const {JSDOM} = require('jsdom');
const read = file => fs.readFile(new URL('../' + file, import.meta.url), 'utf8');

test('restricted page binds the Wix auth route and sends only supported navigation intents', async t => {
  assert.equal(resolveBuildRoute('/auth/access-restricted').key, 'accessRestricted');
  assert.deepEqual(PAGE_BUILD_INTEGRATIONS.accessRestricted.embedIds, ['#html1']);
  const outer = new JSDOM('<!doctype html><iframe></iframe>', {runScripts:'outside-only', url:'https://www.skanditravels.com/'});
  t.after(() => outer.window.close());
  const frame = outer.window.document.querySelector('iframe').contentWindow;
  frame.document.body.innerHTML = await read('skandi-embeds/access-restricted/skandi-access-restricted.html');
  const messages = [];
  outer.window.postMessage = message => messages.push(message);
  frame.eval(await read('skandi-embeds/access-restricted/skandi-access-restricted.js'));
  assert.equal(messages[0].type, 'SKANDI_PRESENTATION_READY');
  frame.document.querySelector('[data-destination="support"]').click();
  assert.equal(messages.at(-1).type, 'ACCESS_RESTRICTED_NAVIGATE');
  assert.equal(messages.at(-1).payload.destination, 'support');
  const title = frame.document.querySelector('#restricted-title');
  frame.dispatchEvent(new frame.MessageEvent('message', {source:outer.window, data:{source:'SKANDI_WIX_PARENT',type:'SKANDI_PRESENTATION_DATA',payload:{path:'/other',contentBlocks:[{contentId:'access-restricted-title',value:'Wrong page'}]}}}));
  assert.equal(title.textContent, 'Access restricted');
  frame.dispatchEvent(new frame.MessageEvent('message', {source:outer.window, data:{source:'SKANDI_WIX_PARENT',type:'SKANDI_PRESENTATION_DATA',payload:{path:'/auth/access-restricted',contentBlocks:[{contentId:'access-restricted-title',value:'<safe text>'}]}}}));
  assert.equal(title.textContent, '<safe text>');
  assert.equal(title.children.length, 0);
  frame.dispatchEvent(new frame.MessageEvent('message', {source:outer.window, data:{source:'SKANDI_WIX_PARENT',type:'ACCESS_RESTRICTED_NAVIGATION_ERROR'}}));
  assert.match(frame.document.querySelector('[role="status"]').textContent, /couldn’t open/);
});

test('page controller rejects unknown sources and destinations', async () => {
  let onReady, onMessage;
  const navigations = [], replies = [];
  const embed = {onMessage:fn => {onMessage = fn;}, postMessage:msg => replies.push(msg)};
  const $w = id => {assert.equal(id, '#html1'); return embed;};
  $w.onReady = fn => {onReady = fn;};
  const location = {to:async path => {navigations.push(path);}};
  const code = (await read('src/pages/Access Restricted.m6vln.js'))
    .replace('import wixLocationFrontend from "wix-location-frontend";', 'const wixLocationFrontend = __location;')
    .replace('import { SITE_MAP } from "public/siteMap";', 'const SITE_MAP = __routes;');
  vm.runInNewContext(code, {$w, __location:location, __routes:SITE_MAP, console});
  onReady();
  await onMessage({data:{source:'OTHER', type:'ACCESS_RESTRICTED_NAVIGATE', payload:{destination:'home'}}});
  await onMessage({data:{source:'SKANDI_ACCESS_RESTRICTED', type:'ACCESS_RESTRICTED_NAVIGATE', payload:{destination:'https://example.com'}}});
  assert.deepEqual(navigations, []);
  await onMessage({data:{source:'SKANDI_ACCESS_RESTRICTED', type:'ACCESS_RESTRICTED_NAVIGATE', payload:{destination:'home'}}});
  await onMessage({data:{source:'SKANDI_ACCESS_RESTRICTED', type:'ACCESS_RESTRICTED_NAVIGATE', payload:{destination:'support'}}});
  assert.deepEqual(navigations, ['/', '/about/support']);
  assert.deepEqual(replies, []);
});
