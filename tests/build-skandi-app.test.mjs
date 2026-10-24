import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {build} from '../scripts/build-skandi-app.mjs';
import {compilePage,scopeSelector,cssFor,hash} from '../scripts/lib/compile.mjs';
import {inventory,scaffold} from '../scripts/lib/inventory.mjs';
import {publish} from '../scripts/publish-skandi-build.mjs';
import * as canonical from '../src/public/siteMap.js';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(new URL('../scripts/package.json',import.meta.url));
const {JSDOM,VirtualConsole}=require('jsdom');
const write=async(root,file,text)=>{await fs.mkdir(path.dirname(path.join(root,file)),{recursive:true});await fs.writeFile(path.join(root,file),text);};
async function fixture(t, extra={}) {
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'skandi-builder-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));
  const routes={home:'/',search:'/search',successFactors:'/riaintra/success-factors',alteaLaunchpad:'/riaintra/success-factors/altea',alteaReservations:'/riaintra/success-factors/altea/reservations',bookingFlow:'/booking',...extra};
  const metadata=Object.fromEntries(Object.keys(routes).map(key=>[key,{controller:`src/pages/${key}.test.js`,embedIds:['#'+key+'Embed'],sources:['TEST_'+key.toUpperCase()]}]));
  const code=`export const SITE_MAP=${JSON.stringify(routes)};export const APP_ROUTES={};export const PAGE_BUILD_INTEGRATIONS=${JSON.stringify(metadata)};export const EDITORIAL_PAGE_CATALOG=[];export const INTERNAL_PATH_PREFIXES=['/riaintra','/altea','/_functions'];export const ALTEA_PATH_PREFIXES=['/riaintra/success-factors/altea','/riaintra/altea','/altea'];export const CHROME_FREE_PATHS=['/booking'];\n`+
  ['isSafeInternalRoute','normalizeSitePath','getPageFamily','getPageChrome','resolveBuildRoute'].map(k=>'export '+canonical[k].toString()).join('\n');
  await write(root,'src/public/siteMap.js',code);await write(root,'package.json','{"type":"module"}');
  for(const [key,m] of Object.entries(metadata))await write(root,m.controller,`// ${m.embedIds[0]} ${m.sources[0]}\nexport const bridge=true;`);
  for(const file of ['skandi-shell.css','skandi-shell.js'])await write(root,'skandi-embeds/global/'+file,await fs.readFile(path.join(ROOT,'skandi-embeds/global',file),'utf8'));
  for(const family of ['public','riaintra','altea'])for(const role of family==='public'?['header','footer','mobile-nav']:['header','footer']) {
    const directory=family==='public'?'global':family+'-global',stem=(family==='public'?'skandi':family)+'-'+role;
    await write(root,`skandi-embeds/${directory}/${stem}.html`,`<div id="${family}-${role}">${family} ${role}</div>`);
    await write(root,`skandi-embeds/${directory}/${stem}.css`,':root{--brand:blue}html,body{margin:0}.content{color:blue}');
    await write(root,`skandi-embeds/${directory}/${stem}.js`,`const SOURCE=${JSON.stringify(stem)};`);
  }
  await scaffold(root);return root;
}
async function page(root,key,{html=`<section id="${key}-content">${key}</section>`,css='body.search-mode .content{color:red}',js=`const SOURCE='TEST_${key.toUpperCase()}';window.parent.postMessage({source:SOURCE,type:'READY',requestId:'req-1'},'*');`}={}) {
  const row=(await inventory(root)).rows.find(r=>r.key===key);
  for(const [i,text] of [html,css,js].entries())await write(root,row.files[i],text);
}
const run=root=>build({root,log:()=>{}});
const htmlOf=(root,slug)=>fs.readFile(path.join(root,'dist',slug,'index.html'),'utf8');

test('compiles Home and multiple pages with three distinct chrome families and chrome-free routes',async t=>{
  const root=await fixture(t);for(const key of ['home','search','successFactors','alteaReservations','bookingFlow'])await page(root,key);
  const {errors,built,manifest}=await run(root);assert.deepEqual(errors,[]);assert.equal(built.length,5);
  for(const [slug,chrome] of [['home','public'],['success-factors','riaintra'],['altea-reservations','altea'],['booking-flow','none']]){
    const html=await htmlOf(root,slug),dom=new JSDOM(html);t.after(()=>dom.window.close());
    assert.equal(dom.window.document.querySelectorAll('html').length,1);assert.equal(dom.window.document.querySelectorAll('iframe').length,0);
    assert.equal(dom.window.document.getElementById('skandi-shell-root').dataset.skandiChrome,chrome);
    for(const family of ['public','riaintra','altea'])assert.equal(Boolean(dom.window.document.getElementById(family+'-header')),chrome===family);
  }
  assert.equal(manifest.pages.find(p=>p.key==='home').output,'dist/home/index.html');
  assert.equal(manifest.pages.find(p=>p.key==='home').sha256,hash(await htmlOf(root,'home')));
  const home=await htmlOf(root,'home');assert.match(home,/@media \(max-width:1020px\)/);assert.match(home,/#skandi-global-header-root,#skandi-global-footer-root \{ display:none!important/);assert.match(home,/env\(safe-area-inset-bottom/);assert.match(home,/font-size:16px!important/);
});

test('scoping preserves body/html state, functional selectors, child combinators and keyframes',async()=>{
  assert.match(scopeSelector('body.search-mode #flight-selector','app'),/^body.search-mode #app #flight-selector$/);
  assert.match(scopeSelector('html body.search-mode > .result','app'),/^html body.search-mode #app > .result$/);
  assert.equal(scopeSelector(':root,html,body','app'),'#app,#app,#app');
  assert.match(scopeSelector('body:not(.busy) .row, :is(.a,.b)','app'),/body:not\(\.busy\) #app .row,\s*#app\s+:is\(\.a,.b\)/);
  const css=await cssFor('@keyframes spin{to{opacity:0}}.x{animation:spin 1s}#y{background:url(https://example.com/a.png)}','app','skandi-embeds/home/x.css',ROOT);
  assert.match(css,/@keyframes app-spin/);assert.match(css,/animation:app-spin 1s/);assert.doesNotMatch(css,/#app to/);assert.match(css,/https:\/\/example.com\/a.png/);
});

test('legacy complete documents preserve styles, scripts, templates, SVG, datasets and handlers without double execution',async t=>{
  const root=await fixture(t);
  await page(root,'home',{html:'<!doctype html><html lang="sv"><head><style>.label{color:red}</style></head><body class="search-mode"><button id="tap" onclick="tap(event)" data-item="one">Tap</button><template id="template"><svg viewBox="0 0 1 1"><path d="M0 0"/></svg><script>window.templateExecuted=true;</script></template><script>document.title="Updated page title";let n=0;function tap(){window.clicked=++n;}window.executions=(window.executions||0)+1;</script></body></html>',css:'/* styles are in the legacy document */',js:'/* script is in the legacy document */'});
  const result=await run(root);assert.deepEqual(result.errors,[]);
  const dom=new JSDOM(await htmlOf(root,'home'),{runScripts:'dangerously',url:'https://test.example',beforeParse:w=>{w.scrollTo=()=>{};}});t.after(()=>dom.window.close());
  assert.equal(dom.window.document.title,'Updated page title');assert.equal(dom.window.document.documentElement.lang,'sv');assert.equal(dom.window.document.body.className,'search-mode');
  dom.window.document.getElementById('tap').click();assert.equal(dom.window.clicked,1);assert.equal(dom.window.executions,1);assert.equal(dom.window.templateExecuted,undefined);
  assert.ok(dom.window.document.getElementById('template').content.querySelector('svg'));assert.equal(dom.window.document.getElementById('tap').dataset.item,'one');
});

test('overlapping legacy sidecars, invalid JavaScript, missing assets and duplicate IDs fail with page/file evidence',async t=>{
  const root=await fixture(t);
  for(const [content,expected] of [
    [{html:'<div id="duplicate"></div><div id="duplicate"></div>'},/home.*skandi-home\.html.*duplicate id/],
    [{js:'const broken = ;'},/home.*skandi-home\.js/],
    [{css:'.hero{background:url(missing.png)}'},/home.*missing asset missing.png/],
    [{html:'<div>Legacy</div><script>window.inline=true;</script>'},/inline JavaScript and sidecar/],
    [{html:'<iframe src="https://example.com"></iframe>'},/nested iframe/]
  ]){await page(root,'home',content);const result=await run(root);assert.ok(result.errors.some(e=>expected.test(e)),result.errors.join('\n'));assert.equal(result.manifest.pages.find(p=>p.key==='home').output,null);}
});

test('blank slots stay pending; partial source names exact missing files; stale artifacts are retained but withdrawn',async t=>{
  const root=await fixture(t);let result=await run(root);assert.equal(result.built.length,0);assert.equal(result.manifest.pages[0].status,'PENDING SOURCE');
  await page(root,'home');await run(root);const before=await htmlOf(root,'home');
  await write(root,'skandi-embeds/home/skandi-home.js','');result=await run(root);
  const row=result.manifest.pages.find(p=>p.key==='home');assert.equal(row.status,'FAILED');assert.match(row.error,/INCOMPLETE SOURCE: skandi-embeds\/home\/skandi-home.js/);assert.equal(row.output,null);assert.equal(row.retainedArtifact,true);assert.equal(await htmlOf(root,'home'),before);
  for(const ext of ['html','css','js'])await fs.rm(path.join(root,'skandi-embeds/home/skandi-home.'+ext));
  result=await run(root);assert.equal(result.manifest.pages[0].status,'PENDING SOURCE');assert.equal(result.manifest.pages[0].output,null);assert.equal(await htmlOf(root,'home'),before);
});

test('route aliases and query views share a build; nested and explicit template routes keep their identity',async t=>{
  const root=await fixture(t,{country:'/destinations/:country',myProfile:'/my-profile'});
  const file=path.join(root,'src/public/siteMap.js');let source=await fs.readFile(file,'utf8');source=source.replace('export const APP_ROUTES={};','export const APP_ROUTES={homeAlias:"/",myTrips:"/my-profile?tab=trips"};');await fs.writeFile(file,source);
  await page(root,'country');await page(root,'alteaReservations');const {manifest,errors}=await run(root);assert.deepEqual(errors,[]);
  assert.equal(manifest.pages.find(p=>p.key==='homeAlias').aliasOf,'home');assert.equal(manifest.pages.find(p=>p.key==='myTrips').aliasOf,'myProfile');assert.equal(manifest.pages.find(p=>p.key==='country').dynamic,true);
  const {reg}=await inventory(root);assert.equal(reg.resolveBuildRoute('/destinations/sweden').key,'country');assert.equal(reg.resolveBuildRoute('/unknown'),null);assert.equal(reg.resolveBuildRoute('/riaintra/success-factors/altea/reservations').key,'alteaReservations');
});

test('conflicting routes, unverified controllers and multi-component mappings cannot produce runnable output',async t=>{
  await assert.rejects(fixture(t,{secondHome:'/'}),/Conflicting controllers/);
  const other=await fixture(t);await page(other,'home');await fs.rm(path.join(other,'src/pages/home.test.js'));let result=await run(other);assert.equal(result.manifest.pages[0].status,'BLOCKED INTEGRATION');assert.equal(result.manifest.pages[0].output,null);
  const file=path.join(other,'src/public/siteMap.js');let text=await fs.readFile(file,'utf8');text=text.replace('"controller":"src/pages/search.test.js"','"binding":"multi-component","controller":"src/pages/search.test.js"');await fs.writeFile(file,text);await page(other,'search');result=await run(other);assert.equal(result.manifest.pages.find(p=>p.key==='search').status,'BLOCKED INTEGRATION');
});

test('local assets are verified and embedded; external asset URLs are preserved',async t=>{
  const root=await fixture(t);await write(root,'skandi-embeds/home/icon.svg','<svg xmlns="http://www.w3.org/2000/svg"/>');
  await page(root,'home',{html:'<img id="logo" src="icon.svg"><img src="https://static.wixstatic.com/a.png">',css:'.logo{background:url(icon.svg)}'});const result=await run(root);assert.deepEqual(result.errors,[]);const html=await htmlOf(root,'home');assert.match(html,/data:image\/svg\+xml;base64/);assert.match(html,/https:\/\/static.wixstatic.com\/a.png/);
});

test('missing internal chrome blocks only that family; completed public pages still build',async t=>{
  const root=await fixture(t);await page(root,'home');await page(root,'successFactors');await write(root,'skandi-embeds/riaintra-global/riaintra-header.html','<!-- SKANDI_PENDING_SOURCE -->');const result=await run(root);assert.deepEqual(result.errors,[]);assert.deepEqual(result.built,['home']);assert.equal(result.manifest.pages.find(p=>p.key==='successFactors').status,'BLOCKED INTEGRATION');
});

test('identical consecutive builds are byte-for-byte idempotent regardless of GITHUB_SHA',async t=>{
  const root=await fixture(t);await page(root,'home');await page(root,'search');await run(root);const files=['manifest.json','website-structure.md','wix-installation.csv','home/index.html','search/index.html'];const before=await Promise.all(files.map(f=>fs.readFile(path.join(root,'dist',f),'utf8')));process.env.GITHUB_SHA='a'.repeat(40);await run(root);delete process.env.GITHUB_SHA;assert.deepEqual(await Promise.all(files.map(f=>fs.readFile(path.join(root,'dist',f),'utf8'))),before);
});

test('repository outputs preserve IDs and contracts; failed sources are unadvertised; legacy Home receiver is unchanged',async t=>{
  const out=await fs.mkdtemp(path.join(os.tmpdir(),'skandi-actual-'));t.after(()=>fs.rm(out,{recursive:true,force:true}));
  const result=await build({root:ROOT,out,log:()=>{}});
  for(const row of result.manifest.pages)if(!['BUILT','ALIAS'].includes(row.status))assert.equal(row.output,null);
  for(const [key,slug,source] of [['home','home','SKANDI_HOME'],['flightStatus','flight-status','SKANDI_FLIGHT_STATUS'],['riaintra','riaintra','SKANDI_STAFF_LOGIN']]) {
    const entry=result.manifest.pages.find(p=>p.key===key);
    if(entry.status!=='BUILT'){assert.equal(entry.output,null);continue;}
    const html=await fs.readFile(path.join(out,slug,'index.html'),'utf8');assert.ok(html.includes(source));assert.ok(html.includes('SKANDI_WIX_PARENT'));assert.ok(html.includes('postMessage'));
    const dom=new JSDOM(html);t.after(()=>dom.window.close());const ids=Array.from(dom.window.document.querySelectorAll('[id]'),n=>n.id);assert.equal(new Set(ids).size,ids.length);assert.equal(result.manifest.pages.find(p=>p.key===key).status,'BUILT');
  }
  const old=execFileSync('git',['show','HEAD:skandi-embeds/receiver/skandi-wix-receiver.html'],{cwd:ROOT,encoding:'utf8'});assert.equal(await fs.readFile(path.join(ROOT,'skandi-embeds/receiver/skandi-wix-receiver.html'),'utf8'),old);
  assert.equal(execFileSync('git',['diff','--name-only','--','src/backend/'],{cwd:ROOT,encoding:'utf8'}),'');
});

test('workflow supports every dist file, PR validation, deterministic dependencies and no Pages deployment',async()=>{
  const yaml=await fs.readFile(path.join(ROOT,'.github/workflows/skandi-app-build.yml'),'utf8');assert.match(yaml,/name: SKANDI Website Builder/);assert.match(yaml,/workflow_dispatch:/);assert.match(yaml,/pull_request:/);assert.match(yaml,/npm ci --prefix scripts/);assert.match(yaml,/concurrency:/);assert.match(yaml,/publish-skandi-build.mjs/);assert.doesNotMatch(yaml,/actions\/(?:deploy-pages|upload-pages|configure-pages)/);assert.doesNotMatch(yaml,/dist\/(?:home|flight-status)\/index.html/);await fs.access(path.join(ROOT,'scripts/package-lock.json'));
});

test('publisher stages multiple generated pages, commits once and rejects concurrent main changes',async t=>{
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'skandi-publish-'));t.after(()=>fs.rm(dir,{recursive:true,force:true}));const remote=path.join(dir,'remote.git'),repo=path.join(dir,'repo');await fs.mkdir(repo);
  const git=(...args)=>execFileSync('git',args,{cwd:repo,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
  git('init','--bare',remote);git('init','-b','main');git('config','user.name','Test');git('config','user.email','test@example.invalid');await write(repo,'README.md','initial');git('add','.');git('commit','-m','Initial');git('remote','add','origin',remote);git('push','-u','origin','main');
  await write(repo,'dist/home/index.html','home');await write(repo,'dist/search/index.html','search');assert.equal(publish(repo),true);const sha=git('rev-parse','HEAD');assert.equal(publish(repo),false);assert.equal(git('rev-parse','HEAD'),sha);assert.equal(git('ls-tree','-r','--name-only','HEAD','dist/').split('\n').length,2);
  git('commit','--allow-empty','-m','unpublished local change');await write(repo,'dist/home/index.html','changed');assert.throws(()=>publish(repo),/main changed during compilation/);
});
