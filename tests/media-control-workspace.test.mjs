import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {inventory} from '../scripts/lib/inventory.mjs';
import {compilePage} from '../scripts/lib/compile.mjs';
const require=createRequire(new URL('../scripts/package.json',import.meta.url));
const {JSDOM,VirtualConsole}=require('jsdom');
const root=fileURLToPath(new URL('..',import.meta.url));
const {rows}=await inventory(root),html=await compilePage(root,rows.find(p=>p.key==='mediaControl'));
const catalog=[{key:'home',path:'/',label:'Home',editorial:true,presentationRuntime:true,sections:[{id:'hero',label:'Hero',fields:[{id:'hero-title',label:'Title'}],mediaSlots:[]}]}];
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));
function setup(){
 const sent=[],errors=[],virtualConsole=new VirtualConsole();virtualConsole.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM(html,{url:'https://example.test/riaintra/success-factors/media-control',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole,beforeParse(w){w.TextDecoder=globalThis.TextDecoder;w.TextEncoder=globalThis.TextEncoder;w.matchMedia=()=>({matches:true,addEventListener(){},removeEventListener(){}});w.CSS={supports:()=>true};w.confirm=()=>true;w.postMessage=m=>sent.push(m)}});
 const w=dom.window,d=w.document;
 const receive=(type,payload={},source=w)=>w.dispatchEvent(new w.MessageEvent('message',{source,origin:'https://example.test',data:{source:'SKANDI_WIX_PARENT',type,payload}}));
 receive('MEDIA_CONTROL_EDITORIAL_CATALOG',{pages:catalog,styleProperties:['color','font-size']});
 receive('VOY_ADMIN_BOOTSTRAP_RESULT',{issues:[],pages:[],articles:[],assets:[],session:{privateValue:'not-for-browser-storage'}});
 return {w,d,dom,sent,errors,receive};
}

test('overview has task-oriented navigation and stores only interface preferences',t=>{
 const {w,d,dom,errors}=setup();t.after(()=>dom.window.close());assert.equal(d.querySelector('#mmPageTitle').textContent,'Overview');assert(d.querySelector('[data-panel="websiteeditor"]'));assert(d.querySelector('[data-module="newsroom"]'));assert(!d.querySelector('[data-module="chargebrite"]'));assert.equal(d.querySelector('.mc-toolbar').hidden,true);
 const saved=w.localStorage.getItem('SKANDI_MEDIA_CONTROL_UI_V1');assert(saved);assert(!saved.includes('not-for-browser-storage'));assert(!saved.includes('assets'));assert.deepEqual(errors,[]);
 d.getElementById('mobileMenuBtn').click();assert.equal(d.getElementById('mobileMenuBtn').getAttribute('aria-expanded'),'true');d.getElementById('mcCloseMenu').click();assert.equal(d.getElementById('mobileMenuBtn').getAttribute('aria-expanded'),'false');
});

test('background updates and workspace navigation do not erase unsaved page copy',t=>{
 const {w,d,dom,receive}=setup();t.after(()=>dom.window.close());d.querySelector('[data-panel="websiteeditor"]').click();d.querySelector('[data-panel="webcontent"]').click();const field=d.getElementById('webContentValue');assert(field);field.value='Unfinished copy';field.dispatchEvent(new w.Event('input',{bubbles:true}));
 receive('VOY_ADMIN_BOOTSTRAP_RESULT',{issues:[],pages:[],articles:[],assets:[]});assert.equal(d.getElementById('webContentValue'),field);assert.equal(field.value,'Unfinished copy');
 d.querySelector('[data-module="overview"]').click();d.querySelector('[data-module="website"]').click();d.querySelector('[data-panel="webcontent"]').click();assert.equal(d.getElementById('webContentValue').value,'Unfinished copy');
 d.querySelector('[data-save-web-content]').click();receive('VOY_ADMIN_ERROR',{action:'VOY_ADMIN_SAVE_ARTICLE',message:'Could not save copy.'});assert.equal(d.querySelector('.mc-inline-error')?.textContent,'Could not save copy.');assert.equal(field.value,'Unfinished copy');
});

test('quality checks use actual loaded content and do not claim automatic fact verification',t=>{
 const {d,dom,receive}=setup();t.after(()=>dom.window.close());receive('VOY_ADMIN_BOOTSTRAP_RESULT',{issues:[{issueId:'i1',title:'Test issue'}],pages:[{issueId:'i1',pageId:'p1',title:'Test title',body:'A word word appears.'}],articles:[],assets:[]});d.querySelector('[data-module="review"]').click();d.querySelector('[data-panel="quality"]').click();d.querySelector('[data-action="copy-chief-review"]').click();assert.match(d.querySelector('.mc-quality-result').textContent,/repeated adjacent word/i);d.querySelector('[data-action="fact-check-claims"]').click();assert.match(d.querySelector('.mc-quality-result').textContent,/does not verify claims automatically/i);assert(d.querySelector('#panel-quality button[disabled]'));
});

test('untrusted child messages cannot replace server-owned data',t=>{
 const {d,dom,receive}=setup();t.after(()=>dom.window.close());receive('VOY_ADMIN_BOOTSTRAP_RESULT',{issues:[{issueId:'bad',title:'Untrusted issue'}]},{});d.querySelector('[data-module="voy"]').click();d.querySelector('[data-panel="issues"]').click();assert.doesNotMatch(d.querySelector('#panel-issues').textContent,/Untrusted issue/);
});

test('page editor sends structured content through the existing draft action',async t=>{
 const {w,d,dom,sent,receive}=setup();t.after(()=>dom.window.close());d.querySelector('[data-panel="websiteeditor"]').click();const choose=d.querySelector('[data-we="page"]');choose.value='home';d.querySelector('[data-we-action="load"]').click();await tick();
 let request=sent.find(x=>x.type==='MEDIA_CONTROL_WEBSITE_ACTION'&&x.payload.action==='GET_WEBSITE_DESIGN');assert(request);receive('MEDIA_CONTROL_WEBSITE_RESULT',{requestId:request.payload.requestId,result:{page:{key:'home'},revision:1,draft:{version:1,elements:[]}}});await tick();
 request=sent.find(x=>x.type==='MEDIA_CONTROL_WEBSITE_ACTION'&&x.payload.action==='GET_WEBSITE_PREVIEW');assert(request);receive('MEDIA_CONTROL_WEBSITE_RESULT',{requestId:request.payload.requestId,result:{html:'<!doctype html><html><head></head><body><div id="skandi-app-root"><section id="hero">Example</section></div></body></html>'}});await tick();
 const frame=d.querySelector('[data-we="preview"]');const nonce=frame.srcdoc.match(/"nonce":"([^"]+)"/)?.[1];assert(nonce);w.dispatchEvent(new w.MessageEvent('message',{source:frame.contentWindow,data:{source:'SKANDI_WEBSITE_PREVIEW',type:'WEBSITE_PREVIEW_SELECTED',nonce,payload:{selector:'#hero',tag:'section',text:'Example',canAddBlocks:true,styles:{}}}}));
 d.querySelector('[data-we-add-block="heading"]').click();const block=d.querySelector('[data-we-block-field="text"]');assert(block);block.value='New welcome';block.dispatchEvent(new w.Event('input',{bubbles:true}));block.dispatchEvent(new w.Event('change',{bubbles:true}));d.querySelector('[data-we-action="save"]').click();await tick();
 const save=sent.find(x=>x.type==='MEDIA_CONTROL_WEBSITE_ACTION'&&x.payload.action==='SAVE_WEBSITE_DESIGN');assert(save);assert.equal(save.payload.input.action,'SAVE');assert.equal(save.payload.input.design.elements[0].blocks[0].text,'New welcome');assert(d.querySelector('[data-we-action="publish"]').disabled);receive('MEDIA_CONTROL_WEBSITE_RESULT',{requestId:save.payload.requestId,result:{revision:2,draft:save.payload.input.design}});await tick();assert(!d.querySelector('[data-we-action="publish"]').disabled);
});

test('an earlier save acknowledgement does not erase changes made while it was in flight',t=>{
 const {w,d,dom,sent,receive}=setup();t.after(()=>dom.window.close());d.querySelector('[data-panel="websiteeditor"]').click();d.querySelector('[data-panel="webcontent"]').click();const field=d.getElementById('webContentValue');field.value='First version';field.dispatchEvent(new w.Event('input',{bubbles:true}));d.querySelector('[data-save-web-content]').click();
 const pending=sent.find(x=>x.type==='VOY_ADMIN_SAVE_ARTICLE');assert(pending?.payload?.requestId);field.value='Newer unsaved version';field.dispatchEvent(new w.Event('input',{bubbles:true}));receive('VOY_ADMIN_SAVED',{action:'VOY_ADMIN_SAVE_ARTICLE',requestId:pending.payload.requestId});receive('VOY_ADMIN_BOOTSTRAP_RESULT',{issues:[],pages:[],articles:[],assets:[]});assert.equal(d.getElementById('webContentValue'),field);assert.equal(field.value,'Newer unsaved version');
});

test('VOY editorial assets and the shared asset library are kept distinct',t=>{
 const {d,dom,receive}=setup();t.after(()=>dom.window.close());receive('VOY_ADMIN_BOOTSTRAP_RESULT',{issues:[],pages:[],articles:[],assets:[{assetId:'editorial-one',license:'review',creator:'Test',sourceUrl:'https://example.test'}]});receive('MEDIA_CONTROL_LIBRARY',{assets:[{id:'a'},{id:'b'}]});d.querySelector('[data-module="voy"]').click();const card=[...d.querySelectorAll('#panel-dashboard .kpi')].find(x=>x.textContent.includes('VOY assets'));assert(card);assert.equal(card.querySelector('b').textContent,'1');
});

test('asset library searches and paginates the loaded assets without losing the search',async t=>{
 const {w,d,dom,sent,receive}=setup();t.after(()=>dom.window.close());await new Promise(resolve=>setTimeout(resolve,40));
 const request=sent.filter(x=>x.type==='VOY_MEDIA_LIBRARY_REQUEST').at(-1);assert(request?.payload?.requestId);assert(!request.payload.search);
 const assets=Array.from({length:151},(_,i)=>({assetId:`asset-${i}`,name:`Image ${String(i).padStart(3,'0')}`,bucket:'public',public:true,isImage:true,imageUrl:`https://example.test/image-${i}.jpg`}));
 receive('VOY_MEDIA_LIBRARY_RESULT',{requestId:request.payload.requestId,assets});d.querySelector('[data-module="assets"]').click();
 assert.equal(d.querySelectorAll('[data-sk-media-assets] .sk-media-card').length,24);assert.match(d.querySelector('[data-sk-media-count]').textContent,/1–24 of 151/);
 d.querySelector('[data-sk-media-next]').click();assert.match(d.querySelector('[data-sk-media-count]').textContent,/25–48 of 151/);
 const search=d.querySelector('[data-sk-media-library-query]');search.value='Image 150';search.dispatchEvent(new w.Event('input',{bubbles:true}));assert.equal(d.querySelectorAll('[data-sk-media-assets] .sk-media-card').length,1);
 receive('VOY_ADMIN_BOOTSTRAP_RESULT',{issues:[],pages:[],articles:[],assets:[]});assert.equal(d.querySelector('[data-sk-media-library-query]'),search);assert.equal(search.value,'Image 150');
});

test('library errors are shown by the action and stale responses are ignored',async t=>{
 const {d,dom,sent,receive}=setup();t.after(()=>dom.window.close());await new Promise(resolve=>setTimeout(resolve,40));d.querySelector('[data-module="assets"]').click();const first=sent.filter(x=>x.type==='VOY_MEDIA_LIBRARY_REQUEST').at(-1);
 const refresh=d.querySelector('[data-sk-media-refresh]');refresh.click();const next=sent.filter(x=>x.type==='VOY_MEDIA_LIBRARY_REQUEST').at(-1);assert.notEqual(first.payload.requestId,next.payload.requestId);
 receive('VOY_MEDIA_LIBRARY_RESULT',{requestId:first.payload.requestId,assets:[{assetId:'old',name:'Stale image'}]});assert.doesNotMatch(d.querySelector('[data-sk-media-assets]').textContent,/Stale image/);
 receive('VOY_ADMIN_ERROR',{action:'VOY_MEDIA_LIBRARY_REQUEST',requestId:next.payload.requestId,message:'Library could not be reached.'});assert.equal(refresh.nextElementSibling?.textContent,'Library could not be reached.');assert.match(d.querySelector('[data-sk-media-assets]').textContent,/could not be loaded/i);
});

test('connection tests use the approved bridge and show actual success or failure',async t=>{
 const {d,dom,sent,receive}=setup();t.after(()=>dom.window.close());d.querySelector('[data-module="review"]').click();d.querySelector('[data-panel="api"]').click();await new Promise(resolve=>setTimeout(resolve,40));
 const testButton=d.querySelector('[data-mi-test="wikimedia"]');assert(testButton);assert.equal(testButton.closest('.mi-card').querySelector('[data-mi-state]').textContent,'Not tested');testButton.click();
 const request=sent.filter(x=>x.type==='MEDIA_CONTROL_WEBSITE_ACTION'&&x.payload.action==='TEST_MEDIA_CONNECTOR').at(-1);assert.equal(request.payload.input.provider,'wikimedia');receive('MEDIA_CONTROL_WEBSITE_RESULT',{requestId:request.payload.requestId,result:{ok:true,count:3}});await tick();assert.match(testButton.closest('.mi-card').querySelector('[data-mi-state]').textContent,/Responded · 3 results/);
 testButton.click();const failed=sent.filter(x=>x.type==='MEDIA_CONTROL_WEBSITE_ACTION'&&x.payload.action==='TEST_MEDIA_CONNECTOR').at(-1);receive('MEDIA_CONTROL_ERROR',{requestId:failed.payload.requestId,message:'Service is unavailable.'});await tick();assert.equal(testButton.nextElementSibling.textContent,'Service is unavailable.');assert.equal(testButton.closest('.mi-card').querySelector('[data-mi-state]').textContent,'Could not verify');
});

test('writing suggestions require an explicit apply action and retain the current draft',async t=>{
 const {w,d,dom,sent,receive}=setup();t.after(()=>dom.window.close());receive('VOY_ADMIN_BOOTSTRAP_RESULT',{issues:[{issueId:'i',title:'Issue'}],pages:[{issueId:'i',pageId:'p',title:'Stockholm',body:'Original copy',template:'feature'}],articles:[],assets:[]});d.querySelector('[data-module="voy"]').click();d.querySelector('[data-panel="builder"]').click();
 const body=d.getElementById('pageBody');assert.equal(body.value,'Original copy');d.querySelector('[data-media-writing="pageBody"]').click();const generate=d.querySelector('[data-mi-generate]');assert(generate);generate.click();const request=sent.filter(x=>x.type==='MEDIA_CONTROL_WEBSITE_ACTION'&&x.payload.action==='CREATE_EDITORIAL_SUGGESTION').at(-1);assert.equal(request.payload.input.text,'Original copy');receive('MEDIA_CONTROL_WEBSITE_RESULT',{requestId:request.payload.requestId,result:{suggestion:'A better draft'}});await tick();assert.equal(body.value,'Original copy');assert.equal(d.querySelector('[data-mi-suggestion]').value,'A better draft');d.querySelector('[data-mi-apply]').click();assert.equal(body.value,'A better draft');
});

test('VOY print output uses real page content without the preview examples',t=>{
 const {w,d,dom,receive}=setup();t.after(()=>dom.window.close());receive('VOY_ADMIN_BOOTSTRAP_RESULT',{issues:[{issueId:'i',title:'Issue'}],pages:[{issueId:'i',pageId:'p',pageNo:1,title:'My issue page',deck:'Actual deck',body:'Actual body',template:'offers',blocks:[]}],articles:[],assets:[]});d.querySelector('[data-module="voy"]').click();d.querySelector('[data-panel="builder"]').click();let printed=false;w.print=()=>{printed=true};d.querySelector('[data-action="print-page"]').click();assert(printed);const output=d.getElementById('voy-print-root');assert.match(output.textContent,/My issue page/);assert.doesNotMatch(output.textContent,/Athens city break|Santorini escape|Start writing the article/);w.dispatchEvent(new w.Event('afterprint'));assert.equal(d.getElementById('voy-print-root'),null);
});

test('Canva browsing paginates and reports configuration failures by its button',async t=>{
 const {d,dom,sent,receive}=setup();t.after(()=>dom.window.close());d.querySelector('[data-module="review"]').click();d.querySelector('[data-panel="api"]').click();await new Promise(resolve=>setTimeout(resolve,40));
 const browse=d.querySelector('[data-mi-canva]');browse.click();let request=sent.filter(x=>x.payload?.action==='LIST_CANVA_TEMPLATES').at(-1);receive('MEDIA_CONTROL_ERROR',{requestId:request.payload.requestId,message:'Canva is not connected.'});await tick();assert.equal(browse.nextElementSibling.textContent,'Canva is not connected.');
 browse.click();request=sent.filter(x=>x.payload?.action==='LIST_CANVA_TEMPLATES').at(-1);receive('MEDIA_CONTROL_WEBSITE_RESULT',{requestId:request.payload.requestId,result:{templates:[{id:'a',title:'Campaign',createUrl:'https://www.canva.com/design/a/remix'}],continuation:'next-token'}});await tick();assert.match(d.querySelector('[data-mi-canva-results]').textContent,/Campaign/);d.querySelector('[data-mi-canva-more]').click();request=sent.filter(x=>x.payload?.action==='LIST_CANVA_TEMPLATES').at(-1);assert.equal(request.payload.input.continuation,'next-token');receive('MEDIA_CONTROL_WEBSITE_RESULT',{requestId:request.payload.requestId,result:{templates:[{id:'b',title:'Newsletter',createUrl:''}],continuation:''}});await tick();assert.match(d.querySelector('[data-mi-canva-results]').textContent,/Newsletter/);assert.equal(d.querySelector('[data-mi-canva-more]'),null);
});

test('destination research renders cited links and does not overwrite inventory',async t=>{
 const {d,dom,sent,receive}=setup();t.after(()=>dom.window.close());d.querySelector('[data-module="review"]').click();d.querySelector('[data-panel="research"]').click();await new Promise(resolve=>setTimeout(resolve,40));d.querySelector('[data-mi-destination]').value='Stockholm';d.querySelector('[data-mi-research]').click();const request=sent.filter(x=>x.payload?.action==='RESEARCH_DESTINATION').at(-1);assert.equal(request.payload.input.destination,'Stockholm');receive('MEDIA_CONTROL_WEBSITE_RESULT',{requestId:request.payload.requestId,result:{destination:'Stockholm',sources:[{title:'Stockholm',summary:'Source description',url:'https://en.wikipedia.org/wiki/Stockholm'}]}});await tick();const link=d.querySelector('[data-mi-research-results] a');assert.equal(link.getAttribute('href'),'https://en.wikipedia.org/wiki/Stockholm');assert(!sent.some(x=>/INVENTORY|SAVE/.test(x.type)&&x.type!=='MEDIA_CONTROL_WEBSITE_ACTION'));await new Promise(resolve=>setTimeout(resolve,60));
});
