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
  const sources=new Set(map.map(m=>m.source));
  for(const relative of (await fs.readdir(path.join(root,'HTML_REF'),{recursive:true})).filter(p=>p.endsWith('.md'))) {
    const file='HTML_REF/'+relative,original=extractDocument(await fs.readFile(path.join(root,file),'utf8'));
    if(original===null)continue;
    assert.ok(sources.has(file),'Unmapped source: '+file);
    const m=map.find(m=>m.source===file),split=splitDocument(original,m.stem);
    assert.equal(restoreDocument(split.files[m.stem+'.html'],split.files,split.replacements),original,file);
    for(const name of Object.keys(split.files))await fs.access(path.join(root,m.directory,name));
  }
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
