import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {parse} from 'acorn';
import {createHash} from 'node:crypto';

export const kebab = value => value.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
export async function read(root, file) { return fs.readFile(path.join(root, file), 'utf8'); }
export const meaningful = source => Boolean(source?.trim()) && !source.includes('SKANDI_PENDING_SOURCE');
export async function registry(root) {
  const text = await read(root, 'src/public/siteMap.js');
  parse(text, {ecmaVersion:'latest',sourceType:'module'});
  // Load the selected checkout, including fixtures, never the compiler checkout's routes.
  return import(pathToFileURL(path.join(root,'src/public/siteMap.js')).href + '?source=' + createHash('sha256').update(text).digest('hex'));
}
export async function triplet(root, directory, stem) {
  const files = ['html','css','js'].map(ext => `${directory}/${stem}.${ext}`);
  const contents = await Promise.all(files.map(file => read(root,file).catch(e => { if(e.code==='ENOENT') return ''; throw e; })));
  const filled = contents.map(meaningful);
  return {files,contents,status:filled.every(Boolean)?'COMPLETE SOURCE':filled.some(Boolean)?'INCOMPLETE SOURCE':'PENDING SOURCE',missing:files.filter((_,i)=>!filled[i])};
}
function moduleImports(ast) { return ast.body.filter(n=>n.type==='ImportDeclaration').map(n=>({module:n.source.value,names:n.specifiers.filter(s=>s.type==='ImportSpecifier').map(s=>s.imported.name)})); }
function exportedNames(ast) {
  const names = new Set();
  for(const n of ast.body) if(n.type==='ExportNamedDeclaration') {
    if(n.declaration?.id) names.add(n.declaration.id.name);
    for(const d of n.declaration?.declarations||[]) if(d.id.type==='Identifier') names.add(d.id.name);
    for(const s of n.specifiers||[]) names.add(s.exported.name);
  }
  return names;
}
export async function integrationEvidence(root, metadata) {
  if(!metadata?.controller) return {issues:['No verified canonical controller mapping.'],backend:[],messages:[]};
  const issues=[], backend=[], messages=[];
  let code;
  try { code=await read(root,metadata.controller); } catch { return {issues:[`Missing controller ${metadata.controller}`],backend,messages}; }
  let ast;
  try { ast=parse(code,{ecmaVersion:'latest',sourceType:'module'}); } catch(e) { return {issues:[`${metadata.controller}: ${e.message}`],backend,messages}; }
  for(const id of metadata.embedIds||[]) if(!code.includes(id)) issues.push(`Controller no longer declares ${id}`);
  for(const source of metadata.sources||[]) if(!code.includes(source)) issues.push(`Controller no longer declares source ${source}`);
  for(const imp of moduleImports(ast)) {
    if(!/^(backend|public)\//.test(imp.module)) continue;
    const file='src/'+imp.module+(/\.js$/.test(imp.module)?'':'.js');
    if(imp.module.startsWith('backend/')) backend.push(file);
    try {
      const target=parse(await read(root,file),{ecmaVersion:'latest',sourceType:'module'});
      const exports=exportedNames(target);
      for(const name of imp.names) if(!exports.has(name)) issues.push(`${file}: imported export ${name} is absent`);
    } catch(e) { issues.push(`${file}: ${e.code==='ENOENT'?'missing imported module':e.message}`); }
  }
  for(const match of code.matchAll(/["']([A-Z][A-Z0-9_]{3,})["']/g)) messages.push(match[1]);
  if(metadata.binding==='multi-component') issues.push(metadata.note || 'Multiple HTML components require a verified controller migration.');
  return {issues,backend:[...new Set(backend)],messages:[...new Set(messages)].sort()};
}
export async function inventory(root) {
  const reg=await registry(root), routes={...reg.SITE_MAP,...reg.APP_ROUTES};
  for(const key of Object.keys(reg.SITE_MAP||{})) if(reg.APP_ROUTES?.[key] && reg.APP_ROUTES[key]!==reg.SITE_MAP[key]) throw new Error(`Route key conflict: ${key}`);
  const rows=[],seen=new Map(),folders=new Map(),shapes=new Map();
  for(const [key,route] of Object.entries(routes)) {
    if(!reg.isSafeInternalRoute(route)) throw new Error(`Invalid canonical route ${key}: ${route}`);
    const pathname=reg.normalizeSitePath(route),alias=seen.get(pathname);
    const meta=reg.PAGE_BUILD_INTEGRATIONS?.[key]||{};
    if(alias) {
      if(meta.controller && meta.controller!==alias.controller && !meta.legacyRedirect) throw new Error(`Conflicting controllers for route ${pathname}: ${alias.key}, ${key}`);
      const controller=meta.legacyRedirect?meta.controller:alias.controller;
      if(meta.legacyRedirect) {
        const evidence=await integrationEvidence(root,{controller,embedIds:[],sources:[]});
        if(evidence.issues.length) throw new Error(`Invalid legacy redirect controller for ${key}: ${evidence.issues.join('; ')}`);
      }
      rows.push({key,route,status:'ALIAS',aliasOf:alias.key,slug:alias.slug,family:alias.family,chrome:alias.chrome,sourceDirectory:alias.sourceDirectory,stem:alias.stem,controller,embedIds:alias.embedIds,legacyRedirect:meta.legacyRedirect===true});
      continue;
    }
    if(/[?#]/.test(route)) throw new Error(`Query view ${key} has no canonical base route ${pathname}`);
    const slug=kebab(key), directory=meta.sourceDirectory||`skandi-embeds/${slug}`;
    const stem=meta.stem||`skandi-${slug}`;
    if(!/^[a-z0-9-]+$/.test(slug) || !/^[a-z0-9-]+$/.test(stem) || !/^(?:skandi-embeds|riaintra-embeds)\/[a-z0-9/-]+$/.test(directory) || directory.includes('..')) throw new Error(`Unsafe source mapping: ${key}`);
    const folderKey=directory+'/'+stem;
    if(folders.has(folderKey)) throw new Error(`Conflicting source mapping ${folderKey}`);
    folders.set(folderKey,key);
    const shape=pathname.replace(/:[a-z][\w]*|\[[a-z][\w]*\]/g,':parameter');
    if(shapes.has(shape)) throw new Error(`Conflicting template routes ${key} and ${shapes.get(shape)}`);
    shapes.set(shape,key);
    const source=await triplet(root,directory,stem), components=[];
    const componentFolders=new Set([folderKey]);
    for(const component of meta.components||[]) {
      const componentKey=String(component.key||'').trim();
      const componentDirectory=component.sourceDirectory||`skandi-embeds/${slug}/${componentKey}`;
      const componentStem=component.stem||`skandi-${slug}-${componentKey}`;
      const mount=component.mount||`skandi-${kebab(componentKey)}-root`;
      if(!/^[a-z0-9-]+$/.test(componentKey) || !/^[a-z0-9-]+$/.test(componentStem) || !/^(?:skandi-embeds|riaintra-embeds)\/[a-z0-9/-]+$/.test(componentDirectory) || componentDirectory.includes('..') || !/^[A-Za-z][A-Za-z0-9_-]*$/.test(mount)) throw new Error(`Unsafe component source mapping: ${key}/${componentKey}`);
      const componentFolder=componentDirectory+'/'+componentStem;
      if(folders.has(componentFolder)||componentFolders.has(componentFolder)) throw new Error(`Conflicting source mapping ${componentFolder}`);
      componentFolders.add(componentFolder);
      folders.set(componentFolder,`${key}/${componentKey}`);
      const part=await triplet(root,componentDirectory,componentStem);
      components.push({key:componentKey,sourceDirectory:componentDirectory,stem:componentStem,mount,sources:component.sources||[],...part});
    }
    const evidence=await integrationEvidence(root,meta);
    const row={key,route,slug,title:reg.EDITORIAL_PAGE_CATALOG?.find(p=>p.key===key)?.label||meta.controller?.split('/').pop().replace(/\.[^.]+\.js$/,'')||key,
      family:reg.getPageFamily(route),chrome:reg.getPageChrome(route),sourceDirectory:directory,stem,
      controller:meta.controller||null,embedIds:meta.embedIds||[],sources:meta.sources||[],components,binding:meta.binding||'explicit',
      requiresStaff:reg.getPageFamily(route)!=='public' && meta.publicEntry!==true,
      status:source.status,files:source.files,missing:source.missing,issues:evidence.issues,backend:evidence.backend,messages:evidence.messages,
      output:`dist/${slug}/index.html`,dynamic:shape!==pathname};
    rows.push(row);seen.set(pathname,row);
  }
  return {reg,rows};
}
export async function scaffold(root) {
  const {rows}=await inventory(root);
  for(const row of rows.filter(p=>p.status!=='ALIAS')) {
    for(const file of [...row.files,...(row.components||[]).flatMap(component=>component.files)]) {
      await fs.mkdir(path.dirname(path.join(root,file)),{recursive:true});
      const mark=file.endsWith('.html')?'<!-- SKANDI_PENDING_SOURCE: replace with complete page markup. -->\n':'/* SKANDI_PENDING_SOURCE: replace with complete page source. */\n';
      await fs.writeFile(path.join(root,file),mark,{flag:'wx'}).catch(e=>{if(e.code!=='EEXIST')throw e;});
    }
  }
  for(const family of ['riaintra','altea']) for(const part of ['header','footer']) for(const ext of ['html','css','js']) {
    const file=path.join(root,`skandi-embeds/${family}-global/${family}-${part}.${ext}`);
    await fs.mkdir(path.dirname(file),{recursive:true});
    await fs.writeFile(file,ext==='html'?'<!-- SKANDI_PENDING_SOURCE: approved global component required. -->\n':'/* SKANDI_PENDING_SOURCE: approved global component required. */\n',{flag:'wx'}).catch(e=>{if(e.code!=='EEXIST')throw e;});
  }
  // Preserve unmapped native/plugin/dynamic controllers as pending slots, never
  // infer a route from a display name. The generated register lists them all.
  const mapped=new Set(rows.map(r=>r.controller));
  for(const name of (await fs.readdir(path.join(root,'src/pages'))).filter(n=>/\.[a-z0-9]+\.js$/i.test(n))) {
    if(mapped.has('src/pages/'+name))continue;
    const id=name.split('.').at(-2),directory=`skandi-embeds/_unregistered/${id}`;
    for(const ext of ['html','css','js']) {
      const target=path.join(root,directory,`${id}.${ext}`);
      await fs.mkdir(path.dirname(target),{recursive:true});
      await fs.writeFile(target,ext==='html'?'<!-- SKANDI_PENDING_SOURCE: canonical route/controller mapping required before compilation. -->\n':'/* SKANDI_PENDING_SOURCE: canonical route/controller mapping required before compilation. */\n',{flag:'wx'}).catch(e=>{if(e.code!=='EEXIST')throw e;});
    }
    await fs.writeFile(path.join(root,directory,'README.md'),`# Unregistered Wix controller\n\nExisting controller: src/pages/${name}.\n\nCanonical route and HTML component mapping are unverified. These source slots cannot be compiled or installed until their route and integration are verified in the existing canonical registry. Preserve the installed Wix implementation.\n`);
  }
  return rows;
}
