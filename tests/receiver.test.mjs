import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
import {webcrypto,createHash} from 'node:crypto';
import vm from 'node:vm';
import * as registry from '../src/public/siteMap.js';
import {renderPageReceiver} from '../scripts/lib/page-receiver.mjs';
const require=createRequire(new URL('../scripts/package.json',import.meta.url));
const {JSDOM,VirtualConsole}=require('jsdom');
const {parse}=require('acorn');
const receiver=await fs.readFile(new URL('../skandi-embeds/receiver/skandi-wix-universal-receiver.html',import.meta.url),'utf8');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
async function settled(h){for(let i=0;i<200;i++){if(h.writes.length||!h.w.document.getElementById('skandi-loader-error')?.hidden)return;await new Promise(r=>setTimeout(r,5));}throw new Error('Receiver did not settle');}
async function harness(t,{internal=false,unknown=false,stale=false,receiverSource=receiver,receiverPath='',identityChanges={},specialPage='',frame=''}={}) {
  const dom=new JSDOM(receiverSource,{runScripts:'outside-only',url:'https://html-component.example',virtualConsole:new VirtualConsole()});t.after(()=>dom.window.close());
  const w=dom.window,messages=[],calls=[],writes=[];let interval;
  const parent={postMessage:m=>messages.push(m)};Object.defineProperty(w,'parent',{value:parent});Object.defineProperty(w,'crypto',{value:webcrypto});w.TextEncoder=TextEncoder;w.AbortController=AbortController;
  w.setInterval=fn=>{interval=fn;return 1;};w.clearInterval=()=>{};
  w.document.open=()=>{};w.document.close=()=>{};w.document.write=x=>writes.push(x);
  const key=specialPage|| (internal?'alteaReservations':'search'),slug=specialPage|| (internal?'altea-reservations':'search'),route=specialPage==='careers'?'/about/careers':specialPage==='voy'?'/voy-magazine':internal?'/riaintra/success-factors/altea/reservations':'/search',family=internal?'altea':'public';
  const html=`<!doctype html><html><body><div id="skandi-shell-root" data-skandi-key="${key}" data-skandi-family="${family}" data-skandi-chrome="${family}">${frame}</div></body></html>`;
  const page={key,slug,route,family,chrome:family,status:'BUILT',output:`dist/${slug}/index.html`,receiver:receiverPath||`skandi-embeds/${slug}/skandi-${slug}.receiver.html`,requiresStaff:internal,sha256:stale?'0'.repeat(64):createHash('sha256').update(html).digest('hex')};
  w.fetch=async url=>{calls.push(url);return{ok:true,text:async()=>url.endsWith('manifest.json')?JSON.stringify({schemaVersion:2,pages:unknown?[]:[page]}):html};};
  w.eval([...w.document.querySelectorAll('script')].at(-1).textContent);
  const nonce=messages[0].payload.receiverRequestId;
  const identity={allowed:true,key,route,family,chrome:family,embedId:internal?'#alteaReservationsEmbed':'#searchResultsEmbed',staffAuthorized:!internal,...identityChanges};
  const message=(changes={})=>({source:'SKANDI_WIX_PARENT',type:'SKANDI_MASTER_CONFIG',payload:{receiverRequestId:nonce,compiledPage:{...identity,...changes}}});
  const send=(data=message(),origin='https://www.skanditravels.com',source=parent)=>w.dispatchEvent(new w.MessageEvent('message',{data,origin,source}));
  return {w,messages,calls,writes,send,message,interval:()=>interval(),html};
}

test('receiver ignores spoofed windows, origins, unrelated messages and unmatched handshake nonces',async t=>{
  const h=await harness(t);h.send(h.message(),'https://untrusted.example');h.send(h.message(),'https://www.skanditravels.com',{});const m=h.message();m.payload.receiverRequestId='unmatched';h.send(m);await tick();assert.equal(h.calls.length,0);assert.equal(h.writes.length,0);
});

test('receiver accepts the exact verified Wix Studio preview origin and rejects other preview hosts',async t=>{
  const preview=await harness(t);preview.send(preview.message(),'https://skanditravels-my-site-2.editor.wix.com');await settled(preview);assert.equal(preview.writes[0],preview.html);
  const other=await harness(t);other.send(other.message(),'https://another-site.editor.wix.com');await tick();assert.equal(other.calls.length,0);assert.equal(other.writes.length,0);
});

test('receiver resolves the parent canonical page, verifies integrity and replaces the original document',async t=>{
  const h=await harness(t);h.send();await settled(h);assert.equal(h.writes[0],h.html);assert.equal(h.w.__SKANDI_RECEIVER_CONTEXT__.key,'search');assert.ok(h.calls.some(u=>u.endsWith('/dist/search/index.html')));assert.ok(h.calls.every(u=>!u.includes('/dist/home/')));
});

test('generated receivers are identical and use parent identity with manifest validation',async t=>{
  const search=await renderPageReceiver(new URL('..',import.meta.url).pathname,{key:'search'});
  const home=await renderPageReceiver(new URL('..',import.meta.url).pathname,{key:'home'});
  assert.equal(search,home);
  const h=await harness(t,{receiverSource:search,identityChanges:{route:'/wrong'}});h.send();await settled(h);
  assert.equal(h.writes.length,0);
});

test('receiver allows only the two audited blank document viewers',async t=>{
  const cases=[['voy','<iframe id="fallbackFrame" class="reader-fallback" title="VOY PDF fallback reader"></iframe>'],['careers','<iframe id="pdfViewer" title="Applicant document viewer" src="about:blank"></iframe>']];
  for(const [specialPage,frame] of cases) {
    const valid=await harness(t,{specialPage,frame});valid.send();await settled(valid);assert.equal(valid.writes.length,1);
    const bad=await harness(t,{specialPage,frame:frame.replace('<iframe ','<iframe srcdoc="x" ')});bad.send();await settled(bad);assert.equal(bad.writes.length,0);
    const other=await harness(t,{frame});other.send();await settled(other);assert.equal(other.writes.length,0);
  }
});

test('unknown pages never default to Home, failed integrity never executes, startup retries are bounded',async t=>{
  for(const options of [{unknown:true},{stale:true}]){const h=await harness(t,options);h.send();await settled(h);assert.equal(h.writes.length,0);assert.equal(h.w.document.getElementById('skandi-loader-error').hidden,false);assert.ok(h.calls.every(u=>!u.includes('/dist/home/')));}
  const h=await harness(t);for(let i=0;i<41;i++)h.interval();assert.equal(h.messages.filter(m=>m.type==='MASTER_CONFIG_REQUEST').length,40);assert.match(h.w.document.getElementById('skandi-loader-reference').textContent,/Error ID: SK-02-/);assert.doesNotMatch(h.w.document.getElementById('skandi-receiver-status').textContent,/handshake|backend|wix/i);
  const error=h.messages.find(m=>m.type==='SKANDI_RECEIVER_ERROR');
  assert.equal(error.payload.referenceId,h.w.document.getElementById('skandi-loader-reference').textContent.replace('Error ID: ',''));
  assert.equal(error.payload.receiverRequestId,h.messages[0].payload.receiverRequestId);
});

test('internal build requires parent staff authorization before requesting HTML',async t=>{
  const h=await harness(t,{internal:true});h.send();await settled(h);assert.equal(h.writes.length,0);assert.ok(h.calls.every(u=>u.endsWith('manifest.json')));
  const allowed=await harness(t,{internal:true});allowed.send(allowed.message({staffAuthorized:true}));await settled(allowed);assert.equal(allowed.writes.length,1);
});

test('master derives page identity from canonical route and owning component, and rejects anonymous staff access',async()=>{
  let source=await fs.readFile(new URL('../src/pages/masterPage.js',import.meta.url),'utf8');
  const ast=parse(source,{ecmaVersion:'latest',sourceType:'module'}),imports=ast.body.filter(n=>n.type==='ImportDeclaration');
  for(const n of imports.reverse())source=source.slice(0,n.start)+source.slice(n.end);
  const context={...registry,console,setTimeout,clearTimeout,setInterval,clearInterval,URL,URLSearchParams,
    wixWindowFrontend:{viewMode:'Site',formFactor:'Desktop'},wixLocationFrontend:{baseUrl:'https://www.skanditravels.com',path:[]},wixSiteFrontend:{currentPage:{url:'/search',name:'Search'}},local:{getItem:()=>null},session:{getItem:()=>null},consentPolicy:{getCurrentConsentPolicy:()=>({policy:{}})},$w:Object.assign(()=>[],{onReady:()=>{}})};
  vm.createContext(context);vm.runInContext(source+'\nglobalThis.getIdentity=compiledIdentity;globalThis.masterMessage=handleMasterMessage;globalThis.setReceiverRequest=(e,id)=>receiverRequests.set(e,id);',context);
  assert.equal(context.getIdentity({id:'searchResultsEmbed'}).key,'search');assert.equal(context.getIdentity({id:'skandiHeaderEmbed'}).allowed,false);
  context.wixSiteFrontend.currentPage={url:'/home',name:'Home',type:'static',isHomePage:true};
  const homeIdentity=context.getIdentity({id:'htmlHome'});
  assert.equal(homeIdentity.allowed,true);assert.equal(homeIdentity.key,'home');assert.equal(homeIdentity.route,'/');
  context.wixSiteFrontend.currentPage={url:'/unknown',name:'Unknown',type:'static',isHomePage:false};assert.equal(context.getIdentity({id:'searchResultsEmbed'}).allowed,false);
  context.wixSiteFrontend.currentPage.url=registry.SITE_MAP.alteaReservations;assert.equal(context.getIdentity({id:'alteaReservationsEmbed'},{authorized:false}).allowed,false);assert.equal(context.getIdentity({id:'alteaReservationsEmbed'},{authorized:true}).family,'altea');
  context.wixSiteFrontend.currentPage.url=registry.SITE_MAP.riaintra;assert.equal(context.getIdentity({id:'staffLoginEmbed'},{authorized:false}).allowed,true);
  context.wixSiteFrontend.currentPage.url=registry.APP_ROUTES.bookingFlow;
  const bookingIdentity=context.getIdentity({id:'bookingFlowEmbed'});
  assert.equal(bookingIdentity.allowed,true);assert.equal(bookingIdentity.key,'bookingFlow');assert.equal(bookingIdentity.route,'/booking');
  assert.equal(context.getIdentity({id:'bookingOfferEmbed'}).allowed,false);
  context.wixSiteFrontend.currentPage.url=registry.APP_ROUTES.myRoster;
  context.wixWindowFrontend.formFactor='Desktop';
  assert.equal(context.getIdentity({id:'myRosterEmbed'},{authorized:true}).allowed,true);
  context.wixWindowFrontend.formFactor='Mobile';
  assert.equal(context.getIdentity({id:'myRosterEmbed'},{authorized:true}).allowed,false);
  context.wixSiteFrontend.currentPage.url=registry.SITE_MAP.eos;
  assert.equal(context.getIdentity({id:'eosEmbed'},{authorized:true}).allowed,true);
  context.wixWindowFrontend.formFactor='Tablet';
  assert.equal(context.getIdentity({id:'eosEmbed'},{authorized:true}).allowed,false);
  context.wixWindowFrontend.formFactor='Desktop';
  assert.equal(context.getIdentity({id:'eosEmbed'},{authorized:true}).allowed,false);
});

test('receiver error references are logged only for the component and request that initiated them',async()=>{
  let source=await fs.readFile(new URL('../src/pages/masterPage.js',import.meta.url),'utf8');
  for(const n of parse(source,{ecmaVersion:'latest',sourceType:'module'}).body.filter(n=>n.type==='ImportDeclaration').reverse())source=source.slice(0,n.start)+source.slice(n.end);
  const logged=[];const ctx={...registry,console:{error:(...args)=>logged.push(args)},setTimeout,clearTimeout,setInterval,clearInterval,URL,URLSearchParams,
    wixWindowFrontend:{viewMode:'Site',formFactor:'Desktop'},wixLocationFrontend:{baseUrl:'https://www.skanditravels.com',path:[]},wixSiteFrontend:{currentPage:{url:'/search',name:'Search'}},local:{getItem:()=>null},session:{getItem:()=>null},consentPolicy:{getCurrentConsentPolicy:()=>({policy:{}})},$w:Object.assign(()=>[],{onReady:()=>{}})};
  vm.createContext(ctx);vm.runInContext(source+'\nglobalThis.masterMessage=handleMasterMessage;globalThis.track=(e,id)=>receiverRequests.set(e,id);',ctx);
  const embed={id:'searchResultsEmbed'},other={id:'other'},payload={receiverRequestId:'abcd-1234',referenceId:'SK-02-20261106-ABCDEF123456',code:'CONNECTION'};
  ctx.track(embed,payload.receiverRequestId);
  await ctx.masterMessage(other,{source:'SKANDI_UNIVERSAL_RECEIVER',type:'SKANDI_RECEIVER_ERROR',payload});
  await ctx.masterMessage(embed,{source:'SKANDI_UNIVERSAL_RECEIVER',type:'SKANDI_RECEIVER_ERROR',payload:{...payload,receiverRequestId:'other'}});
  assert.equal(logged.length,0);
  await ctx.masterMessage(embed,{source:'SKANDI_UNIVERSAL_RECEIVER',type:'SKANDI_RECEIVER_ERROR',payload});
  assert.equal(logged.length,1);assert.equal(logged[0][1].referenceId,payload.referenceId);
  await ctx.masterMessage(embed,{source:'SKANDI_UNIVERSAL_RECEIVER',type:'SKANDI_RECEIVER_ERROR',payload});
  assert.equal(logged.length,1);
});
