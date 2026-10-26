const {chromium}=require('playwright');
const fs=require('fs'),http=require('http'),path=require('path');
const root=path.resolve(__dirname,'..');
(async()=>{
const {EDITORIAL_PAGE_CATALOG}=await import(root+'/src/public/siteMap.js');
const {WEBSITE_STYLE_PROPERTIES}=await import(root+'/src/public/websiteDesign.js');
const preview='<!doctype html><html><head><style>body{font-family:Arial;background:white}#card{padding:24px;border:1px solid #ccc}h1{color:#022e64}</style></head><body><article id="card"><h1 id="headline">Existing SKANDI headline</h1><p id="copy">Existing copy stays here.</p><a id="cta" href="/destinations">Explore</a></article></body></html>';
const host=`<!doctype html><html><body style="margin:0"><iframe id="app" src="/dist/media-control/index.html" style="width:100vw;height:100vh;border:0"></iframe><script>
window.saved=[];let revision=0;let draft={version:1,elements:[]};const iframe=document.getElementById('app');const catalog=${JSON.stringify(EDITORIAL_PAGE_CATALOG)},properties=${JSON.stringify(WEBSITE_STYLE_PROPERTIES)};
function send(type,payload){iframe.contentWindow.postMessage({source:'SKANDI_WIX_PARENT',type,payload},'*')}
window.addEventListener('message',e=>{const m=e.data||{},p=m.payload||{};if(e.source!==iframe.contentWindow)return;
if(m.type==='MEDIA_CONTROL_READY'||m.type==='MEDIA_CONTROL_CATALOG_REQUEST'){send('MEDIA_CONTROL_EDITORIAL_CATALOG',{pages:catalog,styleProperties:properties});send('MEDIA_CONTROL_LIBRARY',{assets:[]})}
if(m.type==='MASTER_CONFIG_REQUEST')send('SKANDI_MASTER_CONFIG',{currentPath:'/riaintra/success-factors/media-control'});
if(m.type==='MEDIA_CONTROL_WEBSITE_ACTION'){let result;const input=p.input||{};
if(p.action==='GET_WEBSITE_DESIGN')result={ok:true,page:{key:input.pageKey,path:'/'},revision,draft};
if(p.action==='GET_WEBSITE_PREVIEW')result={ok:true,html:${JSON.stringify(preview)}};
if(p.action==='SAVE_WEBSITE_DESIGN'){draft=input.design;revision++;saved.push(input);result={ok:true,revision,draft};}
if(p.action==='SEARCH_MEDIA_SOURCES')result={ok:true,items:[]};
send('MEDIA_CONTROL_WEBSITE_RESULT',{requestId:p.requestId,action:p.action,result});}
});</script></body></html>`;
const server=http.createServer((req,res)=>{if(req.url==='/host'){res.setHeader('content-type','text/html');return res.end(host)}const file=path.resolve(root,'.'+req.url.split('?')[0]);if(!file.startsWith(root+'/')){res.statusCode=403;return res.end()}try{res.setHeader('content-type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(file))}catch{res.statusCode=404;res.end()}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({executablePath:process.env.SKANDI_TEST_CHROMIUM || undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});const results=[];
try{for(const width of [1440,390]){
const page=await browser.newPage({viewport:{width,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.stack));await page.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.abort());page.on('dialog',d=>d.accept());await page.goto(base+'/host');
const app=page.frames().find(f=>f.url().endsWith('/dist/media-control/index.html'));
await app.locator('[data-module="website"]').click();
await app.locator('[data-we="page"]').selectOption('home');await app.locator('[data-we-action="load"]').click();
await app.locator('[data-we="status"]').filter({hasText:'Draft loaded'}).waitFor();
const child=await (await app.locator('iframe[data-we=preview]').elementHandle()).contentFrame();if(!child)throw new Error('Preview frame missing');
await child.locator('#headline').click();await app.locator('[data-we="text"]').fill('Edited in Media Control');await app.locator('[data-we="text"]').blur();await child.waitForFunction(()=>document.querySelector('#headline').textContent==='Edited in Media Control');
await app.locator('[data-we="viewport"]').selectOption('mobile');await app.locator('[data-we-style="font-size"]').fill('28');await app.locator('[data-we-style="font-size"]').blur();await child.waitForFunction(()=>getComputedStyle(document.querySelector('#headline')).fontSize==='28px');
await app.locator('[data-we-action="save"]').click();await app.locator('[data-we="status"]').filter({hasText:'Draft saved'}).waitFor();
await app.locator('[data-we-action="publish"]').click();await app.locator('[data-we="status"]').filter({hasText:'Published.'}).waitFor();
const bounds=await app.locator('#panel-websiteeditor').boundingBox();if(bounds.x<0||bounds.width>width+1)throw new Error('Editor exceeds viewport');const saved=await page.evaluate(()=>saved);if(saved.length!==2||saved[1].action!=='PUBLISH')throw new Error('Save/publish contract failed');
results.push({width,errors,savedActions:saved.map(x=>x.action),text:saved[1].design.elements[0].text});await page.close();}
}finally{await browser.close();await new Promise(r=>server.close(r));}
console.log(JSON.stringify(results,null,2));if(results.some(r=>r.errors.length))process.exitCode=1;
})().catch(e=>{console.error(e);process.exit(1)});
