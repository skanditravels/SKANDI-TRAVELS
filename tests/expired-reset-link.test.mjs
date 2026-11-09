import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import * as registry from '../src/public/siteMap.js';
import {createStaffActivitySession} from '../src/public/riaintraSession.js';

const require = createRequire(new URL('../scripts/package.json', import.meta.url));
const {JSDOM} = require('jsdom');
const {parse} = require('acorn');
const read = file => fs.readFile(new URL('../' + file, import.meta.url), 'utf8');

test('auth router prefix resolves both system pages without weakening embed identity', async () => {
  let source = await read('src/pages/masterPage.js');
  for (const n of parse(source, {ecmaVersion:'latest', sourceType:'module'}).body.filter(n => n.type === 'ImportDeclaration').reverse()) source = source.slice(0, n.start) + source.slice(n.end);
  const ctx = {...registry, createStaffActivitySession, console, setTimeout, clearTimeout, setInterval, clearInterval, URL, URLSearchParams,
    wixWindowFrontend:{viewMode:'Site', formFactor:'Desktop'},
    wixLocationFrontend:{baseUrl:'https://www.skanditravels.com', prefix:'auth', path:['expired-reset-link']},
    wixSiteFrontend:{currentPage:{url:'/expired-reset-link', name:'Expired Reset Link'}},
    local:{getItem:()=>null}, session:{getItem:()=>null}, consentPolicy:{getCurrentConsentPolicy:()=>({policy:{}})}, $w:Object.assign(()=>[],{onReady:()=>{}})};
  vm.createContext(ctx); vm.runInContext(source + '\nglobalThis.identity = compiledIdentity;', ctx);
  assert.equal(ctx.identity({id:'expiredResetEmbed'}).key, 'expiredResetLink');
  assert.equal(ctx.identity({id:'html1'}).allowed, false);
  ctx.wixLocationFrontend.path = ['auth','access-restricted'];
  ctx.wixSiteFrontend.currentPage = {url:'/access-restricted'};
  assert.equal(ctx.identity({id:'html1'}).key, 'accessRestricted');
  ctx.wixLocationFrontend.prefix = '';
  ctx.wixLocationFrontend.path = ['search'];
  ctx.wixSiteFrontend.currentPage = {url:'/search'};
  assert.equal(ctx.identity({id:'searchResultsEmbed'}).key, 'search');
});

test('page requests recovery and login, handles responses, and safely renders editorial text', async t => {
  const outer = new JSDOM('<!doctype html><iframe></iframe>', {runScripts:'outside-only', url:'https://www.skanditravels.com/'});
  t.after(() => outer.window.close());
  const frame = outer.window.document.querySelector('iframe').contentWindow;
  frame.document.body.innerHTML = await read('skandi-embeds/expired-reset-link/skandi-expired-reset-link.html');
  const sent = [];
  outer.window.postMessage = message => sent.push(message);
  frame.eval(await read('skandi-embeds/expired-reset-link/skandi-expired-reset-link.js'));
  assert.equal(sent[0].type, 'SKANDI_PRESENTATION_READY');
  const click = action => frame.document.querySelector(`[data-action="${action}"]`).click();
  const receive = (type, requestId, payload = {}, source = outer.window) => frame.dispatchEvent(new frame.MessageEvent('message', {source, data:{source:'SKANDI_WIX_PARENT',type,requestId,payload}}));
  click('reset');
  let request = sent.at(-1);
  assert.equal(request.type, 'EXPIRED_RESET_AUTH');
  assert.equal(request.payload.action, 'reset');
  receive('EXPIRED_RESET_AUTH_RESULT', 'wrong-id', {message:'Wrong response'});
  assert.notEqual(frame.document.querySelector('[role="status"]').textContent, 'Wrong response');
  receive('EXPIRED_RESET_AUTH_OPENING', request.requestId);
  receive('EXPIRED_RESET_AUTH_RESULT', request.requestId, {message:'Check your inbox.'});
  assert.equal(frame.document.querySelector('[role="status"]').textContent, 'Check your inbox.');
  click('login'); request = sent.at(-1);
  assert.equal(request.payload.action, 'login');
  receive('EXPIRED_RESET_AUTH_RESULT', request.requestId, {message:'Closed.'});
  const heading = frame.document.querySelector('#expired-reset-title');
  receive('SKANDI_PRESENTATION_DATA', '', {path:'/other', contentBlocks:[{contentId:'expired-reset-link-title',value:'Wrong page'}]});
  assert.equal(heading.textContent, 'This link has expired');
  receive('SKANDI_PRESENTATION_DATA', '', {path:registry.SITE_MAP.expiredResetLink, contentBlocks:[{contentId:'expired-reset-link-title',value:'<safe text>'}]});
  assert.equal(heading.textContent, '<safe text>');
  assert.equal(heading.children.length, 0);
  Object.defineProperty(frame.history, 'length', {value:1, configurable:true});
  click('back');
  assert.equal(sent.at(-1).type, 'EXPIRED_RESET_BACK');
  let backCalls = 0, fallback;
  Object.defineProperty(frame.history, 'length', {value:2, configurable:true});
  Object.defineProperty(frame.history, 'back', {value:() => {backCalls++;}, configurable:true});
  const oldSetTimeout = frame.setTimeout.bind(frame);
  frame.setTimeout = (fn, delay) => delay === 1500 ? (fallback = fn, 42) : oldSetTimeout(fn, delay);
  click('back');
  assert.equal(backCalls, 1);
  fallback();
  assert.equal(sent.at(-1).type, 'EXPIRED_RESET_BACK');
});

test('page controller uses existing Wix recovery and Club login, prevents duplicate prompts and rejects unknown actions', async () => {
  let onReady, onMessage, finishReset;
  const replies = [], destinations = [], loginContexts = [];
  const embed = {onMessage:fn => {onMessage=fn;}, postMessage:m => replies.push(m)};
  const $w = id => {assert.equal(id, '#expiredResetEmbed'); return embed;};
  $w.onReady = fn => {onReady=fn;};
  const authentication = {promptForgotPassword:() => new Promise(resolve => {finishReset=resolve;})};
  const location = {to:async path => {destinations.push(path);}};
  const openLogin = async context => {loginContexts.push(context); return {action:'SIGNED_IN'};};
  let code = await read('src/pages/Expired Reset Link.anxhe.js');
  code = code.replace('import wixLocationFrontend from "wix-location-frontend";', 'const wixLocationFrontend = __location;')
    .replace('import { authentication } from "wix-members-frontend";', 'const authentication = __authentication;')
    .replace('import { SITE_MAP } from "public/siteMap";', 'const SITE_MAP = __routes;')
    .replace('import { openCustomerLogin } from "public/customerAuthUi";', 'const openCustomerLogin = __openLogin;');
  vm.runInNewContext(code, {$w, __location:location, __authentication:authentication, __routes:registry.SITE_MAP, __openLogin:openLogin, console});
  onReady();
  const send = (source, type, action, requestId) => onMessage({data:{source,type,payload:{action},requestId}});
  await send('OTHER', 'EXPIRED_RESET_AUTH', 'reset', 'expired-reset-1-1');
  await send('SKANDI_EXPIRED_RESET_LINK', 'EXPIRED_RESET_AUTH', 'other', 'expired-reset-1-2');
  assert.equal(replies.length, 0);
  const first = send('SKANDI_EXPIRED_RESET_LINK', 'EXPIRED_RESET_AUTH', 'reset', 'expired-reset-1-3');
  assert.equal(replies.at(-1).type, 'EXPIRED_RESET_AUTH_OPENING');
  await send('SKANDI_EXPIRED_RESET_LINK', 'EXPIRED_RESET_AUTH', 'reset', 'expired-reset-1-4');
  assert.match(replies.at(-1).payload.message, /open window/);
  finishReset(); await first;
  assert.match(replies.at(-1).payload.message, /If the email matches/);
  await send('SKANDI_EXPIRED_RESET_LINK', 'EXPIRED_RESET_AUTH', 'login', 'expired-reset-1-5');
  assert.equal(loginContexts[0].sourcePage, 'EXPIRED_RESET_LINK');
  assert.deepEqual(destinations, ['/skandi-club']);
  await send('SKANDI_EXPIRED_RESET_LINK', 'EXPIRED_RESET_BACK', '', '');
  assert.deepEqual(destinations, ['/skandi-club','/forgot-password']);
});
