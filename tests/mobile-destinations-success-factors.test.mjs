import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {inventory} from '../scripts/lib/inventory.mjs';
import {compilePage} from '../scripts/lib/compile.mjs';
const require=createRequire(new URL('../scripts/package.json',import.meta.url));
const {JSDOM}=require('jsdom');
const root=fileURLToPath(new URL('..',import.meta.url));
const {rows}=await inventory(root);
async function page(key){return compilePage(root,rows.find(r=>r.key===key));}

test('mobile map detail opens at medium height and closes accessibly',async()=>{
 const dom=new JSDOM(await page('destinations'),{url:'https://example.test/destinations',runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window;w.matchMedia=()=>({matches:true,addEventListener(){},removeEventListener(){}});w.scrollTo=()=>{};
 let code=w.document.querySelector('script[data-skandi-part="destinations"]').textContent;
 code=code.replace('  cacheElements();','  cacheElements(); window.__detailTest={show(){renderSelection({id:"TST",name:"Test airport",iata:"TST",tags:[]},"airport")}};');
 w.eval(code);w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
 const sheet=w.document.getElementById('mobileSheet');assert.equal(sheet.getAttribute('aria-hidden'),'true');
 w.__detailTest.show();assert.equal(sheet.dataset.snap,'medium');assert.equal(sheet.getAttribute('aria-hidden'),'false');assert.equal(sheet.inert,false);
 w.document.getElementById('mobileSheetClose').click();assert.equal(sheet.getAttribute('aria-hidden'),'true');assert.equal(sheet.inert,true);assert(!sheet.classList.contains('open'));dom.window.close();
});

test('staff workspace timeout can be retried and accepts a later authorized bootstrap',async()=>{
 const dom=new JSDOM(await page('successFactors'),{url:'https://example.test/riaintra/success-factors',runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window,sent=[];let timeout;
 w.matchMedia=()=>({matches:true,addEventListener(){},removeEventListener(){}});w.scrollTo=()=>{};w.postMessage=m=>sent.push(m);
 const realTimeout=w.setTimeout.bind(w);w.setTimeout=(fn,delay,...rest)=>delay===18000?(timeout=fn,123):realTimeout(fn,delay,...rest);
 w.clearTimeout=id=>{if(id===123)timeout=null;};
 let code=w.document.querySelector('script[data-skandi-part="success-factors"]').textContent;
 code=code.replace('    initializePortal();',`    window.__workspaceTest={boot(){importBootstrap({profile:{id:'synthetic',role:'Driver'},currentUserRole:'Driver',tasks:[]});renderPortal()}, table(){return renderRecordTable([{name:'Example'}],[["Employee",["name"]]],{action:'open-record'})}};\n    initializePortal();`);
 w.eval(code);assert(timeout);timeout();assert.match(w.document.body.textContent,/Taking longer than expected/);
 sent.length=0;w.document.querySelector('[data-action="request-bootstrap"]').click();assert(sent.some(m=>m.type==='INTRANET_READY'));assert.match(w.document.body.textContent,/Connecting to RIAINTRA/);
 w.__workspaceTest.boot();assert.equal(w.document.querySelectorAll('.sf-shortcut').length,3);assert.match(w.document.body.textContent,/0 open items/);
 w.document.querySelector('.sf-shortcut[data-route="tasks"]').click();assert.equal(w.location.hash,'#/tasks');
 const holder=w.document.createElement('div');holder.innerHTML=w.__workspaceTest.table();assert.equal(holder.querySelector('td').dataset.label,'Employee');assert.equal(holder.querySelector('td').textContent,'Example');assert.equal(holder.querySelector('tr[data-action]').dataset.action,'open-record');dom.window.close();
});
