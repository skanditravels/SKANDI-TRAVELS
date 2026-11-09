import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
import {compilePage} from '../scripts/lib/compile.mjs';

const require = createRequire(new URL('../scripts/package.json', import.meta.url));
const {JSDOM} = require('jsdom');
const root = new URL('..', import.meta.url).pathname;
const page = {key:'riaintra', slug:'riaintra', title:'RIAINTRA', route:'/riaintra', family:'riaintra', chrome:'none', mobileNavigation:false, sourceDirectory:'riaintra-embeds/riaintra', stem:'riaintra'};

async function loginPage(t) {
  const html = await compilePage(root, page);
  const outer = new JSDOM('<!doctype html><iframe></iframe>', {url:'https://www.skanditravels.com/riaintra',runScripts:'outside-only',pretendToBeVisual:true});
  t.after(() => outer.window.close());
  const w = outer.window.document.querySelector('iframe').contentWindow;
  const messages = [];
  outer.window.postMessage = message => messages.push(message);
  w.matchMedia = () => ({matches:false,addEventListener(){}});
  w.requestAnimationFrame = fn => fn();
  w.document.open(); w.document.write(html); w.document.close();
  w.eval(w.document.querySelector('script[data-skandi-part="riaintra"]').textContent);
  const receive = (type, payload = {}, requestId = '') => w.dispatchEvent(new w.MessageEvent('message', {source:outer.window,data:{source:'SKANDI_WIX_PARENT',type,payload,requestId}}));
  return {w,doc:w.document,messages,receive,html};
}

test('compiled login loads both master logos and recovers after a failed image', async t => {
  const {w,doc,messages,receive,html} = await loginPage(t);
  assert.equal(doc.querySelector('#login-drop-btn'), null);
  assert.doesNotMatch(html, /Go to staff sign in|\[LEAVE_PLACEHOLDER\]/i);
  assert.deepEqual(messages.slice(-2).map(x => x.type), ['MASTER_CONFIG_REQUEST','STAFF_LOGIN_READY']);
  const first = doc.querySelector('[data-master-logo="riaHeader"]');
  const second = doc.querySelector('[data-master-logo="groupMemberWhite"]');
  const firstFallback = doc.querySelector('[data-logo-fallback="riaHeader"]');
  const secondFallback = doc.querySelector('[data-logo-fallback="groupMemberWhite"]');
  assert.equal(first.hidden,true); assert.equal(second.hidden,true);
  assert.equal(firstFallback.hidden,false); assert.equal(secondFallback.hidden,false);
  const logos = {riaHeader:'https://assets.example/ria.svg',groupMemberWhite:'https://assets.example/group.svg'};
  receive('SKANDI_MASTER_CONFIG',{brand:{assets:{logos}}});
  assert.equal(first.src,logos.riaHeader); assert.equal(second.src,logos.groupMemberWhite);
  first.dispatchEvent(new w.Event('load')); second.dispatchEvent(new w.Event('load'));
  assert.equal(first.hidden,false); assert.equal(second.hidden,false);
  assert.equal(firstFallback.hidden,true); assert.equal(secondFallback.hidden,true);
  first.dispatchEvent(new w.Event('error'));
  assert.equal(first.hidden,true); assert.equal(firstFallback.hidden,false);
  receive('SKANDI_MASTER_CONFIG',{brand:{assets:{logos}}});
  first.dispatchEvent(new w.Event('load'));
  assert.equal(first.hidden,false); assert.equal(firstFallback.hidden,true);
  receive('SKANDI_MASTER_CONFIG',{brand:{assets:{logos:{}}}});
  assert.equal(first.hidden,true); assert.equal(second.hidden,true);
});

test('login validation, request correlation, password visibility and reset remain functional', async t => {
  const {w,doc,messages,receive} = await loginPage(t);
  const user = doc.getElementById('login-username'), password = doc.getElementById('login-password');
  const form = doc.getElementById('login-form'), submit = doc.getElementById('login-submit');
  const visibility = doc.getElementById('password-visibility');
  const send = () => form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
  receive('STAFF_LOGIN_NOTICE',{message:'Enter your SK-ID and password to sign in. Your session ends after 30 minutes of inactivity.'});
  assert.equal(doc.getElementById('login-notice').textContent,'');
  assert.match(doc.querySelector('.login-security').textContent,/30 minutes/);
  send(); assert.match(doc.getElementById('login-error').textContent,/valid SK-ID/);
  user.value='ab-1234'; user.dispatchEvent(new w.Event('input',{bubbles:true}));
  assert.equal(user.value,'AB1234');
  password.value='example-password'; visibility.click();
  assert.equal(password.type,'text'); assert.equal(visibility.getAttribute('aria-pressed'),'true');
  visibility.click(); assert.equal(password.type,'password');
  send();
  const login = messages.find(x=>x.type==='STAFF_LOGIN_REQUEST');
  assert.equal(login.payload.skId,'AB1234'); assert.equal(login.payload.password,'example-password');
  assert(login.requestId); assert.equal(submit.disabled,true);
  receive('STAFF_LOGIN_ERROR',{message:'Ignore stale response.'},'different-id');
  assert.equal(submit.disabled,true);
  receive('STAFF_LOGIN_ERROR',{message:'The SK-ID or password is incorrect.'},login.requestId);
  assert.equal(submit.disabled,false); assert.match(doc.getElementById('login-error').textContent,/incorrect/);
  doc.getElementById('forgot-password').click();
  const reset = messages.find(x=>x.type==='STAFF_FORGOT_PASSWORD');
  assert(reset.requestId); assert.equal(submit.disabled,true);
  receive('STAFF_LOGIN_NOTICE',{message:'Password reset was closed.'},reset.requestId);
  assert.equal(submit.disabled,false); assert.match(doc.getElementById('login-notice').textContent,/closed/);
});
