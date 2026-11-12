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

test('destination directory narrows country, state, destination and area without cross-country results',async()=>{
 const dom=new JSDOM(await page('destinations'),{url:'https://example.test/destinations',runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window;w.matchMedia=()=>({matches:true,addEventListener(){},removeEventListener(){}});w.scrollTo=()=>{};
 let code=w.document.querySelector('script[data-skandi-part="destinations"]').textContent;
 code=code.replace('  cacheElements();','  cacheElements(); window.__geoTest={show(rows){state.model=normalizePayload({destinations:[],routes:[],hotels:[],airports:[],airlines:[],inventoryHierarchy:rows});renderDirectory()}};');
 w.eval(code);w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
 const rows=[{id:'us',type:'COUNTRY',code:'US',name:'United States'},{id:'se',type:'COUNTRY',code:'SE',name:'Sweden'},{id:'fl',type:'REGION',name:'Florida',parentId:'us'},{id:'ny',type:'REGION',name:'New York',parentId:'us'},{id:'st',type:'REGION',name:'Stockholm County',parentId:'se'},{id:'or',type:'DESTINATION',name:'Orlando',parentId:'fl'},{id:'nyc',type:'DESTINATION',name:'New York City',parentId:'ny'},{id:'sto',type:'DESTINATION',name:'Stockholm',parentId:'st'},{id:'ar',type:'AREA',name:'Disney Area',parentId:'or'},{id:'h',type:'HOTEL',name:'Disney Hotel',parentId:'ar'}];
 w.__geoTest.show(rows);
 let selects=w.document.querySelectorAll('#directoryGrid select');selects[0].value='us';selects[0].dispatchEvent(new w.Event('change'));
 selects=w.document.querySelectorAll('#directoryGrid select');assert.equal(selects[1].getAttribute('aria-label'),'State');assert(!selects[1].textContent.includes('Stockholm County'));
 selects[1].value='fl';selects[1].dispatchEvent(new w.Event('change'));
 selects=w.document.querySelectorAll('#directoryGrid select');assert(selects[2].textContent.includes('Orlando'));assert(!selects[2].textContent.includes('New York City'));
 selects[2].value='or';selects[2].dispatchEvent(new w.Event('change'));
 selects=w.document.querySelectorAll('#directoryGrid select');assert(selects[3].textContent.includes('Disney Area'));
 selects[3].value='ar';selects[3].dispatchEvent(new w.Event('change'));assert.match(w.document.getElementById('directoryGrid').textContent,/Disney Hotel/);
 selects=w.document.querySelectorAll('#directoryGrid select');selects[0].value='se';selects[0].dispatchEvent(new w.Event('change'));selects=w.document.querySelectorAll('#directoryGrid select');assert.equal(selects[1].getAttribute('aria-label'),'Region');assert.equal(selects[1].value,'');assert(!w.document.getElementById('directoryGrid').textContent.includes('Disney Hotel'));
 dom.window.close();
});
