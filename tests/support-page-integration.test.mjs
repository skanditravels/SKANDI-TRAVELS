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

test('chat does not claim connection or discard an unsent message when LiveKit is unavailable',async t=>{
  const {rows}=await inventory(root),row=rows.find(x=>x.key==='support');
  const html=await compilePage(root,row),sent=[];
  let parent;const dom=new JSDOM(html,{url:'https://embed.example',runScripts:'dangerously',pretendToBeVisual:true,beforeParse(w){parent={postMessage:m=>sent.push(m)};Object.defineProperty(w,'parent',{value:parent});w.HTMLElement.prototype.scrollIntoView=function(){};}});
  t.after(()=>dom.window.close());const w=dom.window,doc=w.document;
  assert.equal(doc.querySelector('#fileBrowseBtn').disabled,true);
  w.dispatchEvent(new w.MessageEvent('message',{source:parent,data:{source:'SKANDI_WIX_PARENT',type:'SUPPORT_CHAT_OPEN',payload:{mode:'ALEXANDRA',alexandraSession:{url:'wss://example.test',token:'test'}}}}));
  await new Promise(resolve=>setImmediate(resolve));
  assert.match(doc.querySelector('#messages').textContent,/could not connect/i);
  assert.doesNotMatch(doc.querySelector('#messages').textContent,/Hi, I’m Alexandra/);
  doc.querySelector('#input').value='Keep this draft';doc.querySelector('#sendBtn').click();
  assert.equal(doc.querySelector('#input').value,'Keep this draft');
  assert.ok(sent.some(m=>m.type==='SUPPORT_CHAT_START_ALEXANDRA'));
});

test('service desk marks support audio ready only after microphone access succeeds',async t=>{
  const source=await fs.readFile(new URL('../riaintra-embeds/service-desk/skandi-service-desk.part-02.js',import.meta.url),'utf8');
  const dom=new JSDOM('<!doctype html><body></body>',{url:'https://embed.example',runScripts:'outside-only'});t.after(()=>dom.window.close());
  const w=dom.window;let allowMic=false,ready=0,failed=0;
  class Room{constructor(){this.state='connected';this.remoteParticipants=new Map();this.localParticipant={identity:'agent',setMicrophoneEnabled:async()=>{if(!allowMic)throw new Error('denied')}}}on(){}registerTextStreamHandler(){}async connect(){}async startAudio(){}async disconnect(){}}
  w.LivekitClient={Room,RoomEvent:{TrackSubscribed:'track',Disconnected:'disconnected'}};
  w.addEventListener('skandi-support-audio-ready',()=>ready++);w.addEventListener('skandi-support-audio-failed',()=>failed++);w.eval(source);
  const send=()=>w.dispatchEvent(new w.MessageEvent('message',{data:{source:'SKANDI_WIX_PARENT',type:'AGENT_LIVEKIT_SESSION',payload:{case:{caseId:'test'},livekitSession:{url:'wss://example.test',token:'test',roomName:'test'}}}}));
  w.dispatchEvent(new w.CustomEvent('skandi-support-audio-start'));send();await new Promise(resolve=>setImmediate(resolve));assert.equal(ready,0);assert.equal(failed,1);
  allowMic=true;send();await new Promise(resolve=>setImmediate(resolve));assert.equal(ready,1);
});

test('closing support audio while microphone permission is pending turns it back off',async t=>{
  const source=await fs.readFile(new URL('../riaintra-embeds/service-desk/skandi-service-desk.part-02.js',import.meta.url),'utf8');
  const dom=new JSDOM('<!doctype html><body></body>',{url:'https://embed.example',runScripts:'outside-only'});t.after(()=>dom.window.close());const w=dom.window;
  let resolveMic,ready=0;const calls=[];const permission=new Promise(resolve=>{resolveMic=resolve});
  class Room{constructor(){this.state='connected';this.remoteParticipants=new Map();this.localParticipant={identity:'agent',setMicrophoneEnabled:async value=>{calls.push(value);if(value)await permission}}}on(){}registerTextStreamHandler(){}async connect(){}async startAudio(){}async disconnect(){}}
  w.LivekitClient={Room,RoomEvent:{TrackSubscribed:'track',Disconnected:'disconnected'}};w.addEventListener('skandi-support-audio-ready',()=>ready++);w.eval(source);
  w.dispatchEvent(new w.CustomEvent('skandi-support-audio-start'));
  w.dispatchEvent(new w.MessageEvent('message',{data:{source:'SKANDI_WIX_PARENT',type:'AGENT_LIVEKIT_SESSION',payload:{case:{caseId:'test'},livekitSession:{url:'wss://example.test',token:'test',roomName:'test'}}}}));
  await new Promise(resolve=>setImmediate(resolve));assert.deepEqual(calls,[true]);
  w.dispatchEvent(new w.CustomEvent('skandi-support-audio-end'));resolveMic();await new Promise(resolve=>setImmediate(resolve));
  assert.equal(ready,0);assert.equal(calls.at(-1),false);
});
