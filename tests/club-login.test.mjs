import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { createRequire } from 'node:module';
const require = createRequire(new URL('../scripts/package.json', import.meta.url));
const { JSDOM } = require('jsdom');

async function core(mocks) {
  let source = await readFile(new URL('../src/backend/SKANDI_CORE/clubLogin.js', import.meta.url), 'utf8');
  source = source.replace(/^import .*;\s*$/gm, '').replace('export async function loginClubMemberCore', 'async function loginClubMemberCore');
  const context = vm.createContext(mocks);
  return new vm.Script(`${source}\nloginClubMemberCore`).runInContext(context);
}

test('Club login releases the Wix token only to a verified non-staff member', async () => {
  const calls=[];
  const mocks={ wixCaptcha:{authorize:async()=>calls.push('captcha')},authentication:{login:async()=>{calls.push('wix');return 'session-token';}},findWixMemberByCorporateEmail:async()=>({id:'wix-id',loginEmail:'member@example.test'}),findAgentByMember:async()=>null };
  const login=await core(mocks);
  const result=await login({email:'member@example.test',password:'private',captchaToken:'token'});
  assert.equal(result.sessionToken,'session-token');
  assert.deepEqual(calls,['captcha','wix']);
  mocks.findAgentByMember=async()=>({id:'staff-id'});
  await assert.rejects(login({email:'member@example.test',password:'private',captchaToken:'token'}),/couldn't sign you in/);
  mocks.findAgentByMember=async()=>{throw new Error('database down')};
  await assert.rejects(login({email:'member@example.test',password:'private',captchaToken:'token'}),/couldn't sign you in/);
});

test('Club login fails closed before authentication when CAPTCHA fails', async () => {
  let loggedIn=false;
  const login=await core({wixCaptcha:{authorize:async()=>{throw Error('invalid token')}},authentication:{login:async()=>{loggedIn=true}},findWixMemberByCorporateEmail:async()=>null,findAgentByMember:async()=>null});
  await assert.rejects(login({email:'member@example.test',password:'private',captchaToken:'invalid'}),/couldn't sign you in/);
  assert.equal(loggedIn,false);
});

test('popup sends credentials only to the verified site origin and requires CAPTCHA', async t => {
  const html=await readFile(new URL('../skandi-embeds/club-login-popup/skandi-club-login-popup.html',import.meta.url),'utf8');
  const sent=[]; let parent;
  const dom=new JSDOM(html,{url:'https://www-skanditravels-com.filesusr.com/html/example',referrer:'https://www.skanditravels.com/skandi-club',runScripts:'dangerously',beforeParse(w){parent={postMessage:(message,origin)=>sent.push({message,origin})};Object.defineProperty(w,'parent',{value:parent});}});
  t.after(()=>dom.window.close());
  const w=dom.window,doc=w.document;
  assert.equal(doc.querySelector('#clubSubmit').disabled,true);
  w.dispatchEvent(new w.MessageEvent('message',{source:parent,origin:'https://www.skanditravels.com',data:{source:'SKANDI_WIX_PARENT',type:'SKANDI_CLUB_CAPTCHA',payload:{verified:true}}}));
  assert.equal(doc.querySelector('#clubSubmit').disabled,false);
  doc.querySelector('#clubEmail').value='member@example.test';doc.querySelector('#clubPassword').value='private';
  doc.querySelector('#clubLoginForm').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
  const request=sent.find(x=>x.message.type==='SKANDI_CLUB_LOGIN_SUBMIT');
  assert.equal(request.origin,'https://www.skanditravels.com');
  assert.equal(doc.querySelector('#clubPassword').value,'');
  assert.equal(doc.querySelector('#clubSubmit').disabled,true);
});
