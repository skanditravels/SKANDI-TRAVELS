import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {extractDocument,splitDocument,restoreDocument} from '../scripts/lib/split-html-ref.mjs';
import {normalizeHTML} from '../scripts/lib/compile.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');

test('every HTML_REF payload is mapped and reconstructs exactly from its split files',async()=>{
  const map=JSON.parse(await fs.readFile(path.join(root,'scripts/html-ref-sources.json'),'utf8'));
  const mergedBooking=map.find(m=>m.source==='HTML_REF/skandi/Booking/README.md');
  assert.ok(mergedBooking,'Merged Booking reference must remain classified.');
  assert.equal(mergedBooking.disposition,'SOURCE CONFLICT');
  assert.equal(mergedBooking.directory,'skandi-embeds/booking-flow/html-ref');
  assert.match(mergedBooking.note,/bookingFlow route resolves to Home/);
  const alexandra=map.find(m=>m.source==='HTML_REF/riaintra/Alexandra Chat.md');
  assert.ok(alexandra,'The latest integrated Alexandra source must be mapped.');
  assert.equal(alexandra.disposition,'SEPARATE COMPONENT');
  assert.equal(alexandra.directory,'skandi-embeds/global/alexandra');
  assert.equal(alexandra.stem,'skandi-alexandra-chat');
  assert.match(alexandra.note,/sitewide/);
  const legacyAlexandra=map.find(m=>m.source==='HTML_REF/skandi/Alexandra Chat.md');
  assert.equal(legacyAlexandra.disposition,'LEGACY REFERENCE');
  assert.equal(legacyAlexandra.directory,'skandi-embeds/global/html-ref');
  const duplicateLauncher=map.find(m=>m.source==='HTML_REF/riaintra/Alexandra Global Launcher.md');
  assert.equal(duplicateLauncher.disposition,'DUPLICATE SOURCE');
  assert.equal(duplicateLauncher.directory,'skandi-embeds/global/alexandra');
  const sources=new Set(map.map(m=>m.source));
  for(const relative of (await fs.readdir(path.join(root,'HTML_REF'),{recursive:true})).filter(p=>p.endsWith('.md'))) {
    const file='HTML_REF/'+relative,original=extractDocument(await fs.readFile(path.join(root,file),'utf8'));
    if(original===null)continue;
    assert.ok(sources.has(file),'Unmapped source: '+file);
    const m=map.find(m=>m.source===file),split=splitDocument(original,m.stem);
    assert.equal(restoreDocument(split.files[m.stem+'.html'],split.files,split.replacements),original,file);
    const linkedHTML=await fs.readFile(path.join(root,m.directory,m.stem+'.html'),'utf8');
    for(const [name,content] of Object.entries(split.files)) {
      try{await fs.access(path.join(root,m.directory,name));}
      catch(error){
        if(error.code!=='ENOENT')throw error;
        // Shared runtimes and named editor modules need not duplicate numbered
        // sidecars. Require the exact extracted bytes in a linked local file.
        const links=[...linkedHTML.matchAll(/(?:src|href)="([^"?#]+)"/g)].map(m=>m[1]).filter(u=>!/^([a-z]+:|\/)/i.test(u));
        const contents=await Promise.all(links.map(async link=>{try{return await fs.readFile(path.resolve(root,m.directory,link),'utf8');}catch{return null;}}));
        assert.ok(contents.some(value=>value?.trim()===content.trim()),'Missing split content: '+file+' / '+name);
      }
    }
  }
});

test('HTML_REF changes trigger the source-validation workflow',async()=>{
  const workflow=await fs.readFile(path.join(root,'.github/workflows/skandi-app-build.yml'),'utf8');
  const push=workflow.slice(workflow.indexOf('  push:'),workflow.indexOf('  pull_request:'));
  const pull=workflow.slice(workflow.indexOf('  pull_request:'),workflow.indexOf('\n\nconcurrency:'));
  assert.match(push,/HTML_REF\/\*\*/);
  assert.match(pull,/HTML_REF\/\*\*/);
});

test('latest My Profile and sitewide Alexandra sidecars match their authoritative payloads',async()=>{
  const map=JSON.parse(await fs.readFile(path.join(root,'scripts/html-ref-sources.json'),'utf8'));
  for(const source of ['HTML_REF/skandi/SKANDI Club My Profile.md','HTML_REF/riaintra/Alexandra Chat.md']) {
    const m=map.find(row=>row.source===source),original=extractDocument(await fs.readFile(path.join(root,source),'utf8'));
    assert.ok(m,source+' must be mapped');
    const split=splitDocument(original,m.stem);
    for(const [name,content] of Object.entries(split.files))
      assert.equal(await fs.readFile(path.join(root,m.directory,name),'utf8'),content,source+' / '+name);
  }
  const master=await fs.readFile(path.join(root,'src/pages/masterPage.js'),'utf8');
  const bridge=await fs.readFile(path.join(root,'src/public/alexandraGlobalBridge.js'),'utf8');
  const profileMap=map.find(row=>row.source==='HTML_REF/skandi/SKANDI Club My Profile.md');
  const profileJS=await fs.readFile(path.join(root,profileMap.directory,profileMap.stem+'.js'),'utf8');
  const siteMap=await fs.readFile(path.join(root,'src/public/siteMap.js'),'utf8');
  const legacyBooking=await fs.readFile(path.join(root,'src/pages/Booking.e8twe.js'),'utf8');
  assert.match(profileJS,/data-route="\/\?cartId=/);
  assert.doesNotMatch(profileJS,/data-route="\/booking\?cartId=/);
  assert.match(siteMap,/bookingFlow:\s*SITE_MAP\.home/);
  assert.match(legacyBooking,/wixLocationFrontend\.to\(SITE_MAP\.home/);
  assert.match(master,/bindAlexandraGlobal\(/);
  assert.match(master,/enabled:\s*\(\)\s*=>\s*!isInternalPath\(currentPathString\(\)\)/);
  assert.match(bridge,/#skandiAlexandraGlobalEmbed/);
  assert.match(bridge,/riaintra\|altea\|intra\|staff\|admin/);
});

test('splitting preserves execution positions, modules, external libraries, data scripts and inert templates',()=>{
  const original='<!doctype html><html><head><style media="print">p{color:red}</style><script src="https://example.com/library.js" defer></script></head><body><script id="first">window.order=[1];</script><p>Content</p><style>p{color:blue}</style><script type="module">export const value=2;</script><script type="application/json">{"data":true}</script><template><style>.inert{}</style><script>inert();</script></template><script>window.order.push(3);</script></body></html>';
  const split=splitDocument(original,'example'),html=split.files['example.html'];
  assert.equal(split.counts.css,2);assert.equal(split.counts.js,3);
  assert.ok(html.indexOf('example.js')<html.indexOf('<p>Content'));
  assert.match(html,/<script type="module" src="example.part-02.js"><\/script>/);
  assert.match(html,/<link rel="stylesheet" href="example.css" media="print">/);
  assert.match(html,/<script src="https:\/\/example.com\/library.js" defer><\/script>/);
  assert.match(html,/<script type="application\/json">\{"data":true\}<\/script>/);
  assert.ok(html.includes('<template><style>.inert{}</style><script>inert();</script></template>'));
  assert.equal(restoreDocument(html,split.files,split.replacements),original);
});

test('extractor excludes Markdown accidentally placed before the document inside an HTML fence',()=>{
  assert.equal(extractDocument('# Documentation\n```html\n\n## Change log\n- Prose\n<!doctype html><html><body>Page</body></html>\n```\n'),'<!doctype html><html><body>Page</body></html>\n');
  assert.throws(()=>extractDocument('```html\n<html></html>\n```\n```html\n<html></html>\n```'),/Multiple HTML payloads/);
});

test('compiler reads explicit local sidecars once and preserves additional CSS/script order',async t=>{
  const directory=await fs.mkdtemp(path.join(os.tmpdir(),'skandi-linked-'));t.after(()=>fs.rm(directory,{recursive:true,force:true}));
  const original='<!doctype html><html lang="en"><head><style>.x{color:red}</style><style media="screen">.x{color:blue}</style></head><body><p class="x">Page</p><script>window.order=[1];</script><script>window.order.push(2);</script></body></html>';
  const split=splitDocument(original,'page');for(const [name,content] of Object.entries(split.files))await fs.writeFile(path.join(directory,name),content);
  const normalized=await normalizeHTML(split.files['page.html'],split.files['page.css'],split.files['page.js'],{root:directory,file:'page.html',mount:'app'});
  assert.equal(normalized.js.match(/window.order=\[1\]/g).length,1);
  assert.ok(normalized.js.indexOf('order=[1]')<normalized.js.indexOf('order.push(2)'));
  assert.ok(normalized.css.indexOf('color:red')<normalized.css.indexOf('color:blue'));
  assert.match(normalized.css,/@media screen/);
});

test('split stylesheet links between final scripts are styles, while actual interleaved markup remains rejected',async t=>{
  const directory=await fs.mkdtemp(path.join(os.tmpdir(),'skandi-body-styles-'));t.after(()=>fs.rm(directory,{recursive:true,force:true}));
  const original='<!doctype html><html><head><style>.x{color:red}</style></head><body><p class="x">Page</p><script>window.order=[1];</script><style id="extension-style">.x{color:blue}</style><script>window.order.push(2);</script></body></html>';
  const split=splitDocument(original,'page');for(const [name,content] of Object.entries(split.files))await fs.writeFile(path.join(directory,name),content);
  const options={root:directory,file:'page.html',mount:'app'};
  const normalized=await normalizeHTML(split.files['page.html'],split.files['page.css'],split.files['page.js'],options);
  const inline=await normalizeHTML(original,'/* inline styles */','/* inline scripts */',options);
  assert.equal(normalized.css.trim(),inline.css.trim());
  assert.equal(normalized.js.trim(),inline.js.trim());
  assert.ok(normalized.css.indexOf('color:red')<normalized.css.indexOf('color:blue'));
  assert.equal(normalized.js.match(/window.order=\[1\]/g).length,1);
  assert.ok(normalized.js.indexOf('order=[1]')<normalized.js.indexOf('order.push(2)'));
  for(const unsafe of ['<div>Late page content</div>','<link rel="preload" href="late.js" as="script">']) {
    const html=split.files['page.html'].replace('</body>',unsafe+'</body>');
    await assert.rejects(normalizeHTML(html,split.files['page.css'],split.files['page.js'],options),/executable scripts interleaved with markup/);
  }
});
