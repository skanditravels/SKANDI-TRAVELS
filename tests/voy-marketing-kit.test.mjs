import test from 'node:test';
import assert from 'node:assert/strict';
import {createVoyMarketingKit} from '../src/public/voyMarketingKit.js';
test('marketing drafts use provided issue content and track existing booking links',()=>{
  const result=createVoyMarketingKit({kit:{name:'Nordic journeys',market:'US',angle:'Explore Stockholm',ctaPath:'/destinations/explore?city=stockholm#hotels',utmCampaign:'winter launch'},pages:[{title:'Stockholm'}]});
  assert.equal(result.trackedLink,'/destinations/explore?city=stockholm&utm_campaign=winter+launch#hotels');
  assert.deepEqual(result.drafts.map(x=>x.channel),['Newsletter','Social caption','Agency brief']);
  assert.match(result.drafts[0].copy,/Explore Stockholm/);
  assert.match(result.drafts[2].copy,/Market: US/);
  assert.doesNotMatch(result.drafts[0].copy,/guaranteed|discount/i);
});
test('marketing drafts reject unsafe links and empty launch names',()=>{
  for(const ctaPath of ['javascript:alert(1)','//evil.example','http://evil.example','https://name:pass@example.com/'])assert.throws(()=>createVoyMarketingKit({kit:{name:'Issue',ctaPath}}));
  assert.throws(()=>createVoyMarketingKit({kit:{}}));
  assert.match(createVoyMarketingKit({kit:{name:'Issue'}}).drafts[0].copy,/Add a booking link/);
});
test('Media Control sends edited draft text when saving a launch kit',async t=>{
  const {createRequire}=await import('node:module');
  const require=createRequire(new URL('../scripts/package.json',import.meta.url));
  const {JSDOM,VirtualConsole}=require('jsdom');
  const {inventory}=await import('../scripts/lib/inventory.mjs');
  const {compilePage}=await import('../scripts/lib/compile.mjs');
  const root=new URL('..',import.meta.url).pathname;
  const row=(await inventory(root)).rows.find(x=>x.key==='mediaControl');
  const html=await compilePage(root,row),sent=[],errors=[],log=new VirtualConsole();
  log.on('jsdomError',e=>errors.push(e.message));
  const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://embed.example',pretendToBeVisual:true,virtualConsole:log,beforeParse:w=>{w.postMessage=x=>sent.push(x);w.confirm=()=>true;w.TextDecoder=TextDecoder;w.TextEncoder=TextEncoder;w.requestAnimationFrame=()=>0;}});
  t.after(()=>dom.window.close());const w=dom.window;
  w.dispatchEvent(new w.MessageEvent('message',{data:{source:'SKANDI_WIX_PARENT',type:'VOY_DISTRIBUTION_KIT_RESULT',payload:{result:{kitId:'k',name:'Launch',summary:'Draft',drafts:[{channel:'Newsletter',copy:'Original'}]}}}}));
  const draft=w.document.querySelector('[data-kit-draft]');assert.ok(draft);draft.value='Edited by staff';draft.dispatchEvent(new w.Event('input',{bubbles:true}));
  w.document.querySelector('[data-action="save-distribution-kit"]').click();
  assert.equal(sent.find(x=>x.type==='VOY_DISTRIBUTION_KIT_SAVE').payload.kit.drafts[0].copy,'Edited by staff');assert.deepEqual(errors,[]);
});
