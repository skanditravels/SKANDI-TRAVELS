import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {inventory} from '../scripts/lib/inventory.mjs';
import {compilePage} from '../scripts/lib/compile.mjs';
const require=createRequire(new URL('../scripts/package.json',import.meta.url));
const {JSDOM,VirtualConsole}=require('jsdom');
const {parse}=require('acorn');
const root=new URL('..',import.meta.url).pathname;

test('compiled Help Center mounts its support chat and emits both bridge ready messages',async t=>{
  const {rows}=await inventory(root), row=rows.find(x=>x.key==='support');
  assert.deepEqual(row.issues,[]);
  const html=await compilePage(root,row),sent=[],errors=[];
  const log=new VirtualConsole();log.on('jsdomError',e=>errors.push(e));
  const dom=new JSDOM(html,{url:'https://embed.example',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:log,beforeParse(w){Object.defineProperty(w,'parent',{value:{postMessage:m=>sent.push(m)}});w.HTMLElement.prototype.scrollIntoView=function(){};}});
  t.after(()=>dom.window.close());
  assert.ok(dom.window.document.querySelector('#skandi-app-root #alexandraChatBtn'));
  assert.ok(dom.window.document.querySelector('#skandi-support-chat-root #launcher'));
  assert.equal(dom.window.document.querySelector('#skandi-support-chat-root #messages').textContent.trim(),'');
  assert.ok(sent.some(x=>x.source==='SKANDI_SUPPORT_PUBLIC'&&x.type==='PUBLIC_SUPPORT_READY'));
  assert.ok(sent.some(x=>x.source==='SKANDI_SUPPORT_CHAT'&&x.type==='SUPPORT_CHAT_READY'));
  assert.deepEqual(errors.map(e=>e.message),[]);
});

test('one Wix component handles Help Center bootstrap and starts the shared LiveKit chat',async()=>{
  let code=await fs.readFile(new URL('../src/pages/Support.k0iqp.js',import.meta.url),'utf8');
  const imports=parse(code,{ecmaVersion:'latest',sourceType:'module'}).body.filter(x=>x.type==='ImportDeclaration');
  for(const n of imports.reverse())code=code.slice(0,n.start)+code.slice(n.end);
  let receive; const sent=[],calls=[];
  const embed={onMessage:fn=>{assert.equal(receive,undefined);receive=fn},postMessage:m=>sent.push(m)};
  const $w=id=>id==='#skandiHelpCenterEmbed'?embed:null;$w.onReady=fn=>fn();
  const noop=async()=>({ok:true});
  const ctx={$w,console,wixLocationFrontend:{query:{}},openCustomerLogin:noop,
    getCustomerSupportBootstrap:async()=>({ok:true,workflows:[]}),createCustomerSupportCase:noop,
    startAlexandraLiveKitSession:async input=>{calls.push(input);return {ok:true,session:{sessionId:'s',url:'wss://example.test',token:'token'}}},
    sendAlexandraAiMessage:noop,requestCustomerHumanHandoff:noop,addCustomerLiveSupportMessage:noop};
  vm.createContext(ctx);vm.runInContext(code,ctx);
  await receive({data:{source:'SKANDI_SUPPORT_PUBLIC',type:'PUBLIC_SUPPORT_READY'}});
  assert.ok(sent.some(m=>m.type==='PUBLIC_SUPPORT_BOOTSTRAP'));
  await receive({data:{source:'SKANDI_SUPPORT_CHAT',type:'SUPPORT_CHAT_READY'}});
  assert.ok(sent.some(m=>m.type==='SUPPORT_CHAT_BOOTSTRAP'));
  await receive({data:{source:'SKANDI_SUPPORT_PUBLIC',type:'PUBLIC_SUPPORT_OPEN_ALEXANDRA'}});
  assert.equal(calls.length,1);assert.ok(sent.some(m=>m.type==='SUPPORT_CHAT_OPEN'&&m.payload.alexandraSession.sessionId==='s'));
});

test('service desk stops retrying after a bootstrap error without an error-refresh loop',async t=>{
  const {rows}=await inventory(root), row=rows.find(x=>x.key==='serviceDesk');
  assert.deepEqual(row.issues,[]);
  const html=await compilePage(root,row),sent=[],timers=[],errors=[];
  const log=new VirtualConsole();log.on('jsdomError',e=>errors.push(e));
  let parent;
  const dom=new JSDOM(html,{url:'https://embed.example',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:log,beforeParse(w){
    parent={postMessage:m=>sent.push(m)};Object.defineProperty(w,'parent',{value:parent});
    w.setTimeout=(fn,delay)=>{timers.push({fn,delay});return timers.length};w.setInterval=()=>1;
  }});
  t.after(()=>dom.window.close());
  assert.ok(sent.some(m=>m.type==='AGENT_READY'));
  const countBefore=sent.filter(m=>m.type==='AGENT_READY').length;
  dom.window.dispatchEvent(new dom.window.MessageEvent('message',{source:parent,data:{source:'SKANDI_WIX_PARENT',type:'AGENT_ERROR',payload:{action:'AGENT_READY',message:'Not available'}}}));
  timers.filter(t=>t.delay===1000||t.delay===3000).forEach(t=>t.fn());
  assert.equal(sent.filter(m=>m.type==='AGENT_READY').length,countBefore);
  assert.equal(sent.filter(m=>m.type==='AGENT_REFRESH_CASES').length,0);
  assert.match(dom.window.document.querySelector('#topSub').textContent,/couldn.t load/i);
  assert.deepEqual(errors.map(e=>e.message),[]);
});
