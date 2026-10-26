import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {publicWebsitePage,validateWebsiteDesign} from '../src/public/websiteDesign.js';
const require=createRequire(new URL('../scripts/package.json',import.meta.url));
const {JSDOM}=require('jsdom');
const runtime=await fs.readFile(new URL('../skandi-embeds/global/skandi-website-design.js',import.meta.url),'utf8');
test('public editor rejects internal routes, unknown keys and executable content',()=>{
  for(const key of ['mediaControl','riaintra','alteaReservations','missing','__proto__','toString'])assert.throws(()=>publicWebsitePage(key));
  assert.deepEqual(publicWebsitePage('myTrips'),publicWebsitePage('myProfile'));
  for(const element of [{selector:'script'},{selector:'#x',href:'javascript:alert(1)'},{selector:'#x',styles:{all:{color:'red;}body{display:none'}}},{selector:'#x',styles:{all:{'background-image':'url(https://evil.example)'}}},{selector:'#x',styles:{all:{position:'fixed'}}}])assert.throws(()=>validateWebsiteDesign({elements:[element]}));
  assert.equal(validateWebsiteDesign({elements:[{selector:'#title',text:'<script>plain text</script>',styles:{mobile:{'font-size':'24px'}}}]}).elements[0].text,'<script>plain text</script>');
});
test('runtime preserves child controls, ignores foreign messages, applies responsive rules and restores originals',async t=>{
  const dom=new JSDOM('<!doctype html><html><head></head><body><div id="skandi-shell-root" data-skandi-family="public"><h1 id="title">Original <button id="action">Click</button></h1><img id="photo" src="old.jpg" srcset="old2.jpg 2x"></div></body></html>',{runScripts:'dangerously',pretendToBeVisual:true,beforeParse:w=>{w.postMessage=()=>{};}});t.after(()=>{dom.window.__skandiWebsiteDesign?.destroy?.();dom.window.close();});
  const w=dom.window;w.SKANDI_WEBSITE_DESIGN_CONFIG={path:'/'};w.eval(runtime);
  const deliver=(payload,source=w)=>w.dispatchEvent(new w.MessageEvent('message',{source,data:{source:'SKANDI_WIX_PARENT',type:'SKANDI_PRESENTATION_DATA',payload:{path:'/',websiteDesign:payload}}}));
  const design={elements:[{selector:'#title',text:'New title',styles:{all:{color:'#022e64'},mobile:{'font-size':'24px'}}}]};
  deliver(design,{});assert.match(w.document.getElementById('title').textContent,/Original/);
  let clicked=false;w.document.getElementById('action').onclick=()=>clicked=true;deliver(design);w.document.getElementById('action').click();assert.ok(clicked);assert.equal(w.document.getElementById('title').firstChild.nodeValue,'New title');
  assert.match(w.document.querySelector('[data-website-design]').textContent,/@media\(max-width:767px\).*font-size:24px/s);
  const replacement=w.document.createElement('h1');replacement.id='title';replacement.textContent='Re-rendered';w.document.getElementById('title').replaceWith(replacement);
  await new Promise(r=>setTimeout(r,50));assert.equal(replacement.textContent,'New title');
  deliver({elements:[]});assert.equal(replacement.textContent,'Re-rendered');
});
test('public runtime never mounts in internal compiled pages',t=>{
  const dom=new JSDOM('<div id="skandi-shell-root" data-skandi-family="altea"></div>',{runScripts:'dangerously'});t.after(()=>dom.window.close());dom.window.SKANDI_WEBSITE_DESIGN_CONFIG={path:'/altea'};dom.window.eval(runtime);assert.equal(dom.window.document.querySelector('[data-website-design]'),null);
});
test('drafts do not leak; publication is explicit and concurrent saves are rejected',async()=>{
  let row=null,authorized=true;
  const context={organizationId:'org',wixMemberId:'staff'};
  const restRequest=async request=>{
    if(request.table==='platform_assets'){assert.equal(request.query.visibility,'eq.PUBLIC');assert.equal(request.query.bucket,'eq.skandi-public-assets');return [];}
    assert.equal(request.table,'voy_entities');
    if(request.method==='GET')return row?[structuredClone(row)]:[];
    if(request.method==='POST'){if(row)throw new Error('duplicate');row={...request.body,id:1};return [structuredClone(row)];}
    if(request.method==='PATCH'){if(request.query['data->>revision']!=='eq.'+row.data.revision)return [];row={...row,...request.body};return [structuredClone(row)];}
    throw new Error('unexpected request');
  };
  let source=await fs.readFile(new URL('../src/backend/SKANDI_CORE/websiteDesign.js',import.meta.url),'utf8');
  source=source.replace(/^import .*;\n/gm,'').replace(/export /g,'');
  const factory=vm.runInNewContext('(function(restRequest,ensureEditorialContext,publicWebsitePage,validateWebsiteDesign,storageGetPublicUrl,resolveWebsiteFont){'+source+';return {getWebsiteDesignCore,saveWebsiteDesignCore,getPublishedWebsiteDesignCore};})');
  const api=factory(restRequest,async()=>{if(!authorized)throw new Error('VOY_EDITOR_ACCESS_DENIED');return context;},publicWebsitePage,validateWebsiteDesign,()=>{throw new Error('no assets expected');},()=>{throw new Error('no fonts expected');});
  const input={pageKey:'home',expectedRevision:0,action:'SAVE',design:{elements:[{selector:'#title',text:'Draft'}]}};
  await api.saveWebsiteDesignCore(input);assert.equal(row.data.publishedDesign,null);
  assert.equal(await api.getPublishedWebsiteDesignCore({organizationId:'org',path:'/'}),null);
  await assert.rejects(api.saveWebsiteDesignCore(input),/WEBSITE_EDIT_CONFLICT/);
  await api.saveWebsiteDesignCore({...input,expectedRevision:1,action:'PUBLISH'});assert.equal((await api.getPublishedWebsiteDesignCore({organizationId:'org',path:'/'})).elements[0].text,'Draft');
  await api.saveWebsiteDesignCore({...input,expectedRevision:2,design:{elements:[{selector:'#title',text:'Private revision'}]}});assert.equal((await api.getPublishedWebsiteDesignCore({organizationId:'org',path:'/'})).elements[0].text,'Draft');
  const results=await Promise.allSettled([api.saveWebsiteDesignCore({...input,expectedRevision:3}),api.saveWebsiteDesignCore({...input,expectedRevision:3})]);assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
  await assert.rejects(api.saveWebsiteDesignCore({...input,expectedRevision:4,design:{elements:[{selector:'#photo',assetId:'00000000-0000-0000-0000-000000000000'}]}}),/PUBLIC_ASSET_REQUIRED/);
  await api.saveWebsiteDesignCore({...input,expectedRevision:4,action:'PUBLISH',design:{elements:[{selector:'#title',text:'Second publication'}]}});
  await api.saveWebsiteDesignCore({...input,expectedRevision:5,action:'ROLLBACK'});
  assert.equal((await api.getPublishedWebsiteDesignCore({organizationId:'org',path:'/'})).elements[0].text,'Draft');
  authorized=false;await assert.rejects(api.saveWebsiteDesignCore({...input,expectedRevision:6}),/ACCESS_DENIED/);
});
test('preview selection prefers stable editorial hooks over sibling positions',t=>{
  const dom=new JSDOM('<main><h2 data-content-id="hero-title">Title</h2></main>',{runScripts:'dangerously'});const w=dom.window;
  t.after(()=>{w.__skandiWebsiteDesign?.destroy?.();w.close();});
  const sent=[];w.postMessage=m=>sent.push(m);w.SKANDI_WEBSITE_DESIGN_CONFIG={preview:true,nonce:'test'};w.eval(runtime);
  w.document.querySelector('h2').click();
  const selection=sent.find(m=>m.type==='WEBSITE_PREVIEW_SELECTED');
  assert.ok(selection,JSON.stringify(sent));assert.equal(selection.payload.selector,'[data-content-id="hero-title"]');
});
