import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs/promises';
import {createRequire} from 'node:module';

const require = createRequire(new URL('../scripts/package.json', import.meta.url));
const {JSDOM} = require('jsdom');
const read = file => fs.readFile(new URL('../' + file, import.meta.url), 'utf8');

async function bookingFrame(t) {
  const outer = new JSDOM('<!doctype html><iframe></iframe>', {runScripts:'outside-only', url:'https://www.skanditravels.com/'});
  t.after(() => outer.window.close());
  const frame = outer.window.document.querySelector('iframe').contentWindow;
  frame.scrollTo = () => {};
  frame.document.body.innerHTML = await read('skandi-embeds/booking/skandi-booking-flow.html');
  const messages = [];
  outer.window.postMessage = message => messages.push(message);
  frame.eval(await read('skandi-embeds/booking/skandi-booking-flow.js'));
  const host = (type, payload = {}, extra = {}) => frame.dispatchEvent(new frame.MessageEvent('message', {
    source:outer.window, data:{source:'SKANDI_WIX_PARENT', type, payload, ...extra}
  }));
  return {frame, messages, host, doc:frame.document};
}

const search = {origin:'JFK', destination:'ARN', tripType:'flightOnly'};

test('an expired booking search offers a working route home instead of an unusable refresh', async t => {
  const {doc, messages, host} = await bookingFrame(t);
  host('BOOKING_STEP_ACTIVE', {step:'offer'});
  host('BOOKING_ERROR', {}, {message:'Your search session is missing or has expired.', retryable:false});
  assert.match(doc.querySelector('#status-offer').textContent, /expired/);
  assert.equal(doc.querySelector('[data-action="refresh-results"]'), null);
  doc.querySelector('[data-action="back-home"]').click();
  assert.equal(messages.at(-1).type, 'BOOKING_NAVIGATE');
  assert.equal(messages.at(-1).path, '/home');
});

test('empty results, provider failures, partial results, retry and selection are distinguished', async t => {
  const {doc, messages, host} = await bookingFrame(t);
  host('BOOKING_SEARCH_LOADING', {search});
  assert.match(doc.querySelector('#root-offer').textContent, /Searching live availability/);
  assert.doesNotMatch(doc.querySelector('#root-offer').textContent, /No live offers are available/);
  host('BOOKING_SEARCH_RESULTS', {search, items:[], errors:[]});
  assert.match(doc.querySelector('#root-offer').textContent, /No live offers are available/);
  doc.querySelector('[data-action="refresh-results"]').click();
  assert.equal(messages.at(-1).type, 'BOOKING_SEARCH_REFRESH');
  host('BOOKING_SEARCH_LOADING', {search});
  host('BOOKING_SEARCH_RESULTS', {search, items:[], errors:[{source:'flight', message:'internal provider detail'}]});
  assert.match(doc.querySelector('#root-offer').textContent, /could not load availability/i);
  assert.doesNotMatch(doc.body.textContent, /internal provider detail|No live offers are available/);
  assert.match(doc.querySelector('#status-offer').textContent, /could not be loaded/i);
  host('BOOKING_SEARCH_LOADING', {search});
  host('BOOKING_SEARCH_RESULTS', {search, items:[{id:'offer-1', routeSummary:'JFK to ARN', price:{amount:100,currency:'USD'}}], errors:[{source:'hotel'}]});
  assert.match(doc.querySelector('#status-offer').textContent, /Some availability could not be loaded/);
  assert.match(doc.querySelector('#root-offer').textContent, /JFK to ARN/);
  doc.querySelector('[data-action="select-offer"]').click();
  assert.equal(messages.at(-1).type, 'BOOKING_SEARCH_SELECT');
  assert.equal(messages.at(-1).offerId, 'offer-1');
});

test('a failed search request stays retryable without claiming no offers exist', async t => {
  const {doc, messages, host} = await bookingFrame(t);
  host('BOOKING_SEARCH_LOADING', {search});
  host('BOOKING_ERROR', {}, {message:'The booking service is unavailable.'});
  assert.match(doc.querySelector('#status-offer').textContent, /unavailable/);
  assert.match(doc.querySelector('#root-offer').textContent, /could not load availability/i);
  assert.doesNotMatch(doc.querySelector('#root-offer').textContent, /No live offers are available/);
  doc.querySelector('[data-action="refresh-results"]').click();
  assert.equal(messages.at(-1).type, 'BOOKING_SEARCH_REFRESH');
});

test('the booking confirmation dependency is declared and locked', async () => {
  const pkg = JSON.parse(await read('package.json'));
  const lock = JSON.parse(await read('package-lock.json'));
  assert.equal(pkg.dependencies['@wix/automations'], '1.0.503');
  assert.equal(lock.packages[''].dependencies['@wix/automations'], pkg.dependencies['@wix/automations']);
  assert.equal(lock.packages['node_modules/@wix/automations'].version, pkg.dependencies['@wix/automations']);
  const wixLock = (await read('wix.lock')).replace(/\\\r?\n/g, '');
  const siteDependencies = wixLock.slice(wixLock.indexOf('["user-code", ['));
  assert.match(siteDependencies, /\["@wix\/automations", "npm:1\.0\.503"\]/);
});
