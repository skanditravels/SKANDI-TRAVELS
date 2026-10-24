#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {parse as parseJS} from 'acorn';
import postcss from 'postcss';
import {extractDocument,splitDocument,restoreDocument,digest} from './lib/split-html-ref.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const mappings=JSON.parse(await fs.readFile(path.join(root,'scripts/html-ref-sources.json'),'utf8'));
const planned=new Map(),records=[];
const read=p=>fs.readFile(path.join(root,p),'utf8');
for(const m of mappings) {
  const original=extractDocument(await read(m.source));
  if(!original)throw new Error(m.source+': no HTML payload found.');
  const split=splitDocument(original,m.stem);
  if(restoreDocument(split.files[m.stem+'.html'],split.files,split.replacements)!==original)throw new Error(m.source+': lossless reconstruction failed.');
  const diagnostics=split.errors.map(e=>`Original HTML line ${e.line}: ${e.code}`);
  for(const r of split.replacements) {
    try {
      if(r.name.endsWith('.css'))postcss.parse(split.files[r.name]);
      else parseJS(split.files[r.name],{ecmaVersion:'latest',sourceType:r.type==='module'?'module':'script'});
    } catch(e) {diagnostics.push(`${r.name}: original source syntax: ${e.message}`);}
  }
  const outputs=[];
  for(const [name,content] of Object.entries(split.files)) {
    const target=m.directory+'/'+name;
    if(planned.has(target)&&planned.get(target)!==content)throw new Error('Conflicting source target: '+target);
    planned.set(target,content);outputs.push({path:target,sha256:digest(content),bytes:Buffer.byteLength(content)});
  }
  records.push({...m,htmlSha256:digest(original),htmlBytes:Buffer.byteLength(original),counts:split.counts,diagnostics,outputs,replacements:split.replacements});
}
const docs=(await fs.readdir(path.join(root,'HTML_REF'),{recursive:true})).filter(f=>f.endsWith('.md')).map(f=>'HTML_REF/'+f).sort();
const documentationOnly=[];
for(const source of docs)if(!mappings.some(m=>m.source===source)) {
  if(extractDocument(await read(source)))throw new Error('Unmapped HTML payload: '+source);
  documentationOnly.push(source);
}
// Validate every target before the first write. Existing authored source is
// never overwritten, including a developer's subsequent edits to an import.
for(const [target,content] of planned) {
  const current=await read(target).catch(e=>{if(e.code==='ENOENT')return '';throw e;});
  if(current.trim()&&!current.includes('SKANDI_PENDING_SOURCE')&&current!==content)throw new Error('Refusing to overwrite authored source: '+target);
}
if(process.argv.includes('--write')) {
  for(const [target,content] of planned) {
    await fs.mkdir(path.dirname(path.join(root,target)),{recursive:true});
    await fs.writeFile(path.join(root,target),content);
  }
  const manifest={schemaVersion:1,method:'Exact source-range extraction. External scripts, module attributes, JSON/import maps, inert templates, markup and execution order are retained.',sources:records,documentationOnly};
  await fs.writeFile(path.join(root,'docs/html-ref-import.json'),JSON.stringify(manifest,null,2)+'\n');
}
console.log(`${records.length} HTML payloads; ${planned.size} split files; ${documentationOnly.length} documentation-only files; all payloads reconstruct exactly.`);
console.log(process.argv.includes('--write')?'Wrote split source and docs/html-ref-import.json.':'Dry run; use --write to create files. Existing authored source is protected.');
