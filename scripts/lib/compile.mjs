import fs from 'node:fs/promises';
import path from 'node:path';
import {Script} from 'node:vm';
import {createHash} from 'node:crypto';
import {parse as parseJS} from 'acorn';
import {parse,parseFragment,serialize,serializeOuter} from 'parse5';
import postcss from 'postcss';
import selectorParser from 'postcss-selector-parser';
import {read,triplet} from './inventory.mjs';

export const hash = value => createHash('sha256').update(value).digest('hex');
export const escapeHTML = value => String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
const safeJS = js => js.replace(/<\/script/gi,'<\\/script');
const safeCSS = css => css.replace(/<\/style/gi,'<\\/style');
const attr = (n,key) => n.attrs?.find(a=>a.name===key)?.value;
function walk(node, fn, inert=false) { fn(node,inert); for(const child of [...(node.childNodes||[])]) walk(child,fn,inert); if(node.content) walk(node.content,fn,true); }
const remove = n => {const a=n.parentNode?.childNodes;if(a)a.splice(a.indexOf(n),1);};
const setAttr = (n,key,value) => {const a=n.attrs.find(a=>a.name===key);if(a)a.value=value;else n.attrs.push({name:key,value});};
const mime = {'.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.gif':'image/gif','.svg':'image/svg+xml','.webp':'image/webp','.avif':'image/avif','.woff':'font/woff','.woff2':'font/woff2','.ico':'image/x-icon','.mp4':'video/mp4','.pdf':'application/pdf'};
async function localFile(root,from,url) {
  const plain=url.split(/[?#]/)[0];
  const file=path.resolve(root,path.dirname(from),decodeURIComponent(plain));
  const rel=path.relative(root,file);
  if(rel.startsWith('..')||path.isAbsolute(rel)) throw new Error(`${from}: asset escapes repository: ${url}`);
  const real=await fs.realpath(file).catch(()=>{throw new Error(`${from}: missing asset ${url}`);});
  if(!real.startsWith(await fs.realpath(root)+path.sep)) throw new Error(`${from}: asset symlink escapes repository: ${url}`);
  return {file:real,rel};
}
async function asset(root,from,url) {
  if(!url || /^(?:[a-z][\w+.-]*:|\/|#)/i.test(url)) return url;
  const {file}=await localFile(root,from,url);
  const data=await fs.readFile(file);
  if(data.length>10*1024*1024) throw new Error(`${from}: local asset exceeds 10 MiB; use its approved public asset URL: ${url}`);
  return `data:${mime[path.extname(file).toLowerCase()]||'application/octet-stream'};base64,${data.toString('base64')}` + (url.includes('#')?'#'+url.split('#')[1]:'');
}
export function scopeSelector(source,mount) {
  return selectorParser(selectors=>selectors.each(sel=>{
    // Preserve real document state and insert the component boundary after the
    // whole html/body ancestor chain (including functional pseudo-classes).
    const nodes=[...sel.nodes];let i=0,last=-1,state=false;
    while(i<nodes.length) {
      const n=nodes[i];
      if(!((n.type==='tag' && /^(html|body)$/i.test(n.value))||(n.type==='pseudo'&&n.value===':root'))) break;
      last=i;if(n.type==='pseudo') n.replaceWith(selectorParser.tag({value:'html'}));i++;
      while(i<nodes.length && nodes[i].type!=='combinator') {state=true;last=i;i++;}
      if(i<nodes.length && nodes[i].type==='combinator' && i+1<nodes.length && nodes[i+1].type==='tag' && /^(html|body)$/i.test(nodes[i+1].value)) {last=i;i++;continue;}
      break;
    }
    const mountNode=selectorParser.id({value:mount.replace(/^#/,'')});
    if(last>=0 && !state) {
      for(let j=0;j<=last;j++) sel.nodes[0].remove();
      sel.prepend(mountNode);
    } else if(last>=0) {
      const after=sel.nodes[last];
      sel.insertAfter(after,selectorParser.combinator({value:' '}));
      sel.insertAfter(sel.nodes[last+1],mountNode);
    } else {
      mountNode.spaces.before=sel.first.spaces.before;sel.first.spaces.before='';
      sel.prepend(selectorParser.combinator({value:' '}));sel.prepend(mountNode);
    }
  })).processSync(source);
}
export async function cssFor(source,mount,file,root) {
  const ast=postcss.parse(source,{from:file}),animations=new Map();
  ast.walkAtRules(rule=>{
    if(/keyframes$/i.test(rule.name)) {const old=rule.params;const next=mount+'-'+old;animations.set(old,next);rule.params=next;}
    if(rule.name.toLowerCase()==='import') throw new Error(`${file}: @import must be resolved into the CSS source or a font stylesheet link in HTML`);
  });
  ast.walkRules(rule=>{
    let p=rule.parent;while(p){if(p.type==='atrule'&&/keyframes$/i.test(p.name))return;p=p.parent;}
    if(rule.selector.includes('&')) throw new Error(`${file}: flatten nested CSS selectors before compilation`);
    rule.selector=scopeSelector(rule.selector,mount);
  });
  const work=[];
  ast.walkDecls(decl=>{
    if(/^(?:-webkit-)?animation(?:-name)?$/.test(decl.prop)) for(const [old,next] of animations) decl.value=decl.value.replace(new RegExp('(?<![\\w-])'+old.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?![\\w-])','g'),next);
    const matches=[...decl.value.matchAll(/url\(\s*(["']?)(.*?)\1\s*\)/gi)];
    if(matches.length) work.push((async()=>{for(const m of matches) decl.value=decl.value.replace(m[0],`url("${await asset(root,file,m[2].trim())}")`);})());
  });
  await Promise.all(work);return ast.toString();
}
export async function normalizeHTML(html,css,js,{root,file,mount}) {
  const full=/<(?:!doctype|html|head|body)(?:\s|>)/i.test(html),errors=[];
  const tree=(full?parse:parseFragment)(html,{sourceCodeLocationInfo:true,onParseError:e=>errors.push(e)});
  const fatal=errors.filter(e=>e.code!=='missing-doctype');
  if(fatal.length) throw new Error(`${file}:${fatal[0].startLine}: invalid HTML (${fatal[0].code})`);
  const nodes=[],inertNodes=new Set();walk(tree,(n,inert)=>{nodes.push(n);if(inert)inertNodes.add(n);});
  if(nodes.some(n=>n.tagName==='iframe')) throw new Error(`${file}: nested iframe is not supported; retain the existing Wix integration`);
  if(nodes.some(n=>n.tagName==='base')) throw new Error(`${file}: <base> changes receiver/navigation ownership; use explicit asset URLs`);
  const bodies=nodes.filter(n=>n.tagName==='body'),heads=nodes.filter(n=>n.tagName==='head');
  const head=heads[0],body=bodies[0];
  const bodyAttrs=body?.attrs||[],htmlNode=nodes.find(n=>n.tagName==='html');
  for(const a of [...bodyAttrs,...(htmlNode?.attrs||[])]) if(!['lang','dir','class','style','id'].includes(a.name) && !a.name.startsWith('data-') && !a.name.startsWith('on')) throw new Error(`${file}: unsupported document attribute ${a.name}; move it to page markup`);
  const inlineCSS=[],inlineJS=[],external=[],moduleScripts=[],handlers=[],tasks=[];
  let linkedCSS=false,linkedJS=false;
  let scriptStarted=false;
  for(const n of [...(body?.childNodes||tree.childNodes||[])]) {
    // Splitting an inline <style> creates a stylesheet <link> in the same
    // position. Both are style sources, not late application markup.
    const stylesheet=n.tagName==='style'||(n.tagName==='link'&&attr(n,'rel')==='stylesheet');
    if(n.tagName==='script') scriptStarted=true;
    else if(scriptStarted && n.tagName && !stylesheet) throw new Error(`${file}: executable scripts interleaved with markup; move scripts after page markup before splitting`);
  }
  for(const n of nodes) {
    if(inertNodes.has(n)&&['script','style'].includes(n.tagName))continue;
    if(n.tagName==='style') {inlineCSS.push(serialize(n));remove(n);}
    if(n.tagName==='script') {
      const type=(attr(n,'type')||'').toLowerCase();
      if(type && !['text/javascript','application/javascript'].includes(type)) {
        if(type==='importmap') {
          const source=(n.childNodes||[]).map(c=>c.value||'').join('');
          try { JSON.parse(source); } catch(e) { throw new Error(`${file}: invalid import map JSON: ${e.message}`); }
          external.push(serializeOuter(n));remove(n);
          continue;
        }
        if(type==='module') {
          const src=attr(n,'src');
          if(src&&/^(?:https?:)?\/\//i.test(src)) {
            moduleScripts.push(serializeOuter(n));remove(n);
            continue;
          }
          const code=src
            ?await fs.readFile((await localFile(root,file,src)).file,'utf8')
            :n.sourceCodeLocation?.startTag&&n.sourceCodeLocation?.endTag
              ?html.slice(n.sourceCodeLocation.startTag.endOffset,n.sourceCodeLocation.endTag.startOffset)
              :(n.childNodes||[]).map(c=>c.value||'').join('');
          parseJS(code,{ecmaVersion:'latest',sourceType:'module'});
          const attrs=(n.attrs||[]).filter(a=>!(src&&a.name==='src')).map(a=>` ${a.name}="${escapeHTML(a.value)}"`).join('');
          moduleScripts.push(`<script${attrs}>${safeJS(code)}</script>`);remove(n);
          continue;
        }
        continue; // JSON, JSON-LD and inert templates retain their original bytes.
      }
      const src=attr(n,'src');
      if(src) {
        if(/^(https?:)?\/\//.test(src)) {
          const pinnedMapLibre=/^https:\/\/unpkg\.com\/maplibre-gl@\d+\.\d+\.\d+\/dist\/maplibre-gl\.js(?:[?#].*)?$/.test(src);
          if(attr(n,'async')!==undefined || (attr(n,'defer')!==undefined&&!pinnedMapLibre)) throw new Error(`${file}: async/defer external script ordering is ambiguous; use a blocking library script or bundle into .js`);
          external.push(serializeOuter(n));
        } else {
          const {file:target}=await localFile(root,file,src);
          const content=await fs.readFile(target,'utf8');inlineJS.push(content);
          if(target===path.resolve(root,file.replace(/\.html$/,'.js'))) {
            if(content!==js)throw new Error(`${file}: linked primary JavaScript differs from sidecar`);
            linkedJS=true;
          }
        }
      } else inlineJS.push(serialize(n));
      remove(n);
    }
    if(n.tagName==='link' && attr(n,'rel')==='stylesheet') {
      const href=attr(n,'href')||'';
      if(/^https:\/\/fonts\.googleapis\.com\//.test(href)) {external.push(serializeOuter(n));remove(n);}
      else if(!/^(?:[a-z]+:|\/)/i.test(href)) {
        const {file:target}=await localFile(root,file,href);
        const content=await fs.readFile(target,'utf8');
        const media=attr(n,'media');inlineCSS.push(media?`@media ${media}{\n${content}\n}`:content);remove(n);
        if(target===path.resolve(root,file.replace(/\.html$/,'.css'))) {
          if(content!==css)throw new Error(`${file}: linked primary CSS differs from sidecar`);
          linkedCSS=true;
        }
      }
      else if(/^https:\/\/unpkg\.com\/maplibre-gl@\d+(?:\.\d+){0,2}\/dist\/maplibre-gl\.css(?:[?#].*)?$/.test(href)) {
        // Compiled pages run inside their own Wix HTML-component iframe.
        external.push(serializeOuter(n));remove(n);
      } else throw new Error(`${file}: external stylesheet cannot be scoped: ${href}; put its rules in the CSS source`);
    }
    if(n.attrs) for(const a of [...n.attrs]) {
      if(/^on[a-z]+$/.test(a.name)) {
        if(['html','body'].includes(n.tagName)) throw new Error(`${file}: move ${n.tagName}.${a.name} into the JS source`);
        const index=handlers.length;setAttr(n,'data-skandi-handler-'+index,'');n.attrs=n.attrs.filter(x=>x!==a);
        handlers.push({index,event:a.name.slice(2),code:a.value});
      }
      if((['src','poster'].includes(a.name) && n.tagName!=='script') || (a.name==='href' && n.tagName==='link' && attr(n,'rel')!=='stylesheet')) tasks.push(asset(root,file,a.value).then(v=>a.value=v));
      if(a.name==='srcset' && !a.value.startsWith('data:')) tasks.push((async()=>{a.value=(await Promise.all(a.value.split(',').map(async chunk=>{const [url,...size]=chunk.trim().split(/\s+/);return [await asset(root,file,url),...size].join(' ');}))).join(', ');})());
      if(a.name==='style') tasks.push((async()=>{const parsed=postcss.parse(`a{${a.value}}`);const d=[];parsed.walkDecls(x=>d.push(x));for(const x of d)for(const m of [...x.value.matchAll(/url\(\s*(["']?)(.*?)\1\s*\)/gi)])x.value=x.value.replace(m[0],`url("${await asset(root,file,m[2])}")`);a.value=parsed.first.nodes.map(x=>x.toString()).join(';');})());
      if(a.name==='href' && ['image','use'].includes(n.tagName) && !a.value.startsWith('#')) tasks.push(asset(root,file,a.value).then(v=>a.value=v));
    }
  }
  await Promise.all(tasks);
  const combine=(inside,outside,kind,linked)=>{
    if(linked)return inside.join('\n'); // Explicit local links define order, including .part-NN sources.
    const joined=inside.join('\n').trim();if(!joined)return outside;
    if(joined===outside.trim())return outside;
    // Empty/comment-only sidecars explicitly allow a legacy inline-only document.
    const significant=outside.replace(/\/\*[\s\S]*?\*\//g,'').replace(/^\s*\/\/.*$/gm,'').trim();
    if(significant)throw new Error(`${file}: inline ${kind} and sidecar ${kind} overlap or have ambiguous order; consolidate into the sidecar (no code was discarded)`);
    return joined;
  };
  let headHTML='';
  if(head) for(const n of head.childNodes||[]) {
    if(n.tagName==='title' || (n.tagName==='meta'&&(attr(n,'charset')!==undefined||attr(n,'name')==='viewport')))continue;
    headHTML+=serializeOuter(n);
  }
  let markup=full?serialize(body):serialize(tree);
  // Keep document classes on the actual document for body.state selectors.
  const documentAttrs={body:bodyAttrs,html:htmlNode?.attrs||[]};
  const titleNode=head?.childNodes?.find(n=>n.tagName==='title');
  const title=titleNode?.childNodes?.map(n=>n.value||'').join('')||'';
  return {title,html:markup,css:combine(inlineCSS,css,'CSS',linkedCSS),js:combine(inlineJS,js,'JavaScript',linkedJS),headHTML,external,moduleScripts,handlers,documentAttrs};
}
function scopedScript(js,mount,handlers=[]) {
  const binds=handlers.map(h=>`__root.querySelector('[data-skandi-handler-${h.index}]').addEventListener(${JSON.stringify(h.event)},function(event){const result=(function(event){${h.code}\n}).call(this,event);if(result===false){event.preventDefault();}});`).join('\n');
  return `(function(){\nconst __root=window.document.getElementById(${JSON.stringify(mount)});\nconst document=new Proxy(window.document,{get(target,key){if(key==='getElementById')return id=>{const el=target.getElementById(id);return el&&(__root===el||__root.contains(el))?el:null;};if(key==='querySelector'||key==='querySelectorAll')return selector=>{if(/^(?:html|body|head|meta|title|link)(?:[\\s.#[:]|$)/i.test(selector)&&!selector.includes(' '))return target[key](selector);return __root[key](selector);};if(key==='getElementsByClassName'||key==='getElementsByTagName')return value=>__root[key](value);const value=Reflect.get(target,key,target);return typeof value==='function'?value.bind(target):value;},set(target,key,value){return Reflect.set(target,key,value,target);}});\n${js}\n${binds}\n})();`;
}
function adapt(js,key) {
  if(key==='mobile-nav')return js.replaceAll('window.parent===window','(window.parent===window||Boolean(window.__SKANDI_SHELL__))').replaceAll('window.parent!==window','(window.parent!==window&&!window.__SKANDI_SHELL__)');
  if(key==='header')return js.replace(/post\(\s*["']SKANDI_EMBED_RESIZE["']\s*,\s*\{\s*height\s*:\s*118\s*\}\s*\)\s*;/g,'/* Compiled shell owns component geometry. */');
  if(key==='home')return js.replace(/send\(\s*["']RESIZE_IFRAME["']\s*,\s*\{\s*height\s*\}\s*\)\s*;/g,'/* Compiled shell owns component geometry. */');
  return js;
}
function privateIds(part,prefix,names) {
  for(const id of names) {
    const next=prefix+'-'+id;
    part.html=part.html.replace(new RegExp('id="'+id+'"','g'),'id="'+next+'"');
    part.css=part.css.replace(new RegExp('#'+id+'(?![\\w-])','g'),'#'+next);
    // These audited global components look up these IDs only through $().
    // Do not rename object fields, message data, or arbitrary string literals.
    part.js=part.js.replace(new RegExp('(\\$\\(\\s*)(["\\\'])'+id+'\\2(\\s*\\))','g'),'$1"'+next+'"$3');
  }
}
export const chromeParts = family => family==='none'?[]:family==='public'?[
  {key:'header',directory:'skandi-embeds/global',stem:'skandi-header',mount:'skandi-global-header-root'},
  {key:'footer',directory:'skandi-embeds/global',stem:'skandi-footer',mount:'skandi-global-footer-root'},
  {key:'mobile-nav',directory:'skandi-embeds/global',stem:'skandi-mobile-nav',mount:'skandi-mobile-nav-container'}
]:['header','footer'].map(key=>({key,directory:`skandi-embeds/${family}-global`,stem:`${family}-${key}`,mount:`${family}-global-${key}-root`}));
export async function compilePage(root,page) {
  // Media Control is itself a complete application with an isolated email editor.
  // Preserve its document and execution positions instead of flattening it into
  // another application's DOM. The receiver still enforces the staff boundary.
  if(page.key==='mediaControl')return compileMediaControl(root,page);
  const descriptors=[...chromeParts(page.chrome),{key:page.slug,directory:page.sourceDirectory,stem:page.stem,mount:'skandi-app-root'},
    ...(page.components||[]).map(component=>({key:component.key,directory:component.sourceDirectory,stem:component.stem,mount:component.mount}))];
  const reservedIds=[['skandi-shell-root','compiler'],...(page.key==='home'?[['skandi-home-content','compiler']]:[]),...descriptors.map(d=>[d.mount,'compiler'])];
  const parts=[],ids=new Map(reservedIds);
  for(const d of descriptors) {
    const input=await triplet(root,d.directory,d.stem);
    if(input.status!=='COMPLETE SOURCE')throw new Error(`[${page.key} / ${d.key}] ${input.status}: ${input.missing.join(', ')}`);
    let [html,css,js]=input.contents;
    // The standalone header and FIDS both own searchBtn. Only the compiled
    // header copy receives a private DOM ID; canonical source/message IDs stay intact.
    if(d.key==='header'&&d.stem==='skandi-header') {
      html=html.replace(/id="searchBtn"/g,'id="skandi-header-searchBtn"');
      css=css.replace(/#searchBtn\b/g,'#skandi-header-searchBtn');
      js=js.replace(/(["'])searchBtn\1/g,'"skandi-header-searchBtn"');
    }
    try {
      const part=await normalizeHTML(html,css,js,{root,file:input.files[0],mount:d.mount});
      if(d.key==='mobile-nav')privateIds(part,'skandi-mobile',['status','closeBtn']);
      if(d.stem==='riaintra-header')privateIds(part,'riaintra-header',['mobileNav','desktopNav','productName']);
      if(d.stem==='altea-footer')privateIds(part,'altea-footer',['sysClock','clockTime','clockDate']);
      walk(parseFragment(part.html),n=>{const id=attr(n,'id');if(id){if(ids.has(id))throw new Error(`duplicate id="${id}" (also in ${ids.get(id)})`);ids.set(id,input.files[0]);}});
      for(const attrs of Object.values(part.documentAttrs)) for(const a of attrs) if(a.name==='id') {if(ids.has(a.value))throw new Error(`duplicate document id ${a.value}`);ids.set(a.value,input.files[0]);}
      if(d.key!==page.slug && (part.documentAttrs.body.length || part.documentAttrs.html.some(a=>a.name!=='lang')))throw new Error('global component document attributes are ambiguous; use a fragment');
      const cssMount=page.key==='home'&&d.key==='home'?'skandi-home-content':d.mount;
      part.css=await cssFor(part.css,cssMount,input.files[1],root);
      const jsForShell=/^(riaintra|altea)-(header|footer)$/.test(d.stem)
        ?part.js.replace(/post\(\s*["']SKANDI_EMBED_RESIZE["']\s*,\s*\{\s*height\s*:\s*\d+\s*\}\s*\)\s*;/g,'/* Compiled shell owns internal chrome geometry. */')
        :part.js;
      part.script=scopedScript(adapt(jsForShell,d.key),d.mount,part.handlers);
      new Script(part.script,{filename:input.files[2]});
      parts.push({...d,...part});
    } catch(e) {throw new Error(`[${page.key} / ${d.key}] ${input.files.join(', ')}: ${e.message.replaceAll(root+path.sep,'')}`);}
  }
  const pagePart=parts.find(p=>p.key===page.slug);if(!pagePart)throw new Error(`[${page.key}] Main page source did not compile.`);const style=parts.map(p=>`<style data-skandi-part="${p.key}">${safeCSS(p.css)}</style>`);
  let shellCSS=page.chrome==='public'?(await read(root,'skandi-embeds/global/skandi-shell.css')).replaceAll('#skandi-mobile-nav-root','#skandi-mobile-nav-container'):
    `html,body{margin:0;width:100%;min-height:100%;}*,*::before,*::after{box-sizing:border-box}#skandi-shell-root{min-height:100vh;min-width:0;display:flex;flex-direction:column}#skandi-app-root{flex:1;min-width:0;position:relative}${page.chrome==='none'?'':`#${page.chrome}-global-header-root,#${page.chrome}-global-footer-root{flex:none}`}@media(max-width:767px){input:not([type=hidden]),select,textarea{font-size:16px!important}}`;
  if(['riaintra','altea'].includes(page.chrome)) {
    const family=page.chrome,height=family==='riaintra'?52:48;
    shellCSS+=`html,body{height:100%;overflow:hidden}#skandi-shell-root{height:100vh;height:100dvh;min-height:0;overflow:hidden}#skandi-app-root{height:auto;min-height:0;overflow:auto}#${family}-global-header-root{position:relative;height:${height}px;min-height:${height}px;overflow:visible;z-index:2000}#${family}-global-footer-root{height:auto;overflow:visible;z-index:2000}#riaintra-global-header-root .shellbar{position:absolute}#altea-global-footer-root .status-bar{position:relative}@media(max-width:600px){#riaintra-global-footer-root .wrap{display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px}#riaintra-global-footer-root .footer-left{flex-wrap:wrap;gap:6px}}`;
  }
  const shellJS=await read(root,'skandi-embeds/global/skandi-shell.js');new Script(shellJS,{filename:'skandi-shell.js'});
  const render=p=>{
    if(!p)return '';
    if(page.key==='home'&&p.key==='home') {
      const bookingPart=parts.find(part=>part.key==='booking-flow');
      return `<div id="${p.mount}"><div id="skandi-home-content">${p.html}</div>${bookingPart?`<div id="${bookingPart.mount}" hidden>${bookingPart.html}</div>`:''}</div>`;
    }
    return `<div id="${p.mount}">${p.html}</div>`;
  };
  const header=parts.find(p=>p.key==='header'),footer=parts.find(p=>p.key==='footer'),mobile=parts.find(p=>p.key==='mobile-nav');
  const attrs=(list,omitLanguage=false)=>list.filter(a=>!omitLanguage||!['lang','dir'].includes(a.name)).map(a=>` ${a.name}="${escapeHTML(a.value)}"`).join('');
  const pageBodyAttrs=attrs(pagePart.documentAttrs.body),pageHTMLAttrs=attrs(pagePart.documentAttrs.html,true);
  const lang=pagePart.documentAttrs.html.find(a=>a.name==='lang')?.value||'en';
  const dir=pagePart.documentAttrs.html.find(a=>a.name==='dir')?.value;
  const scripts=parts.filter(p=>p!==pagePart).concat(pagePart).map(p=>`<script data-skandi-part="${p.key}">${safeJS(p.script)}</script>`);
  const moduleScripts=parts.flatMap(p=>p.moduleScripts||[]);
  if(page.family==='public') {
    const runtime=await read(root,'skandi-embeds/global/skandi-website-design.js');
    new Script(runtime,{filename:'skandi-website-design.js'});
    scripts.push(`<script data-skandi-part="website-design">window.SKANDI_WEBSITE_DESIGN_CONFIG=${safeJS(JSON.stringify({pageKey:page.key,path:page.route}))};${safeJS(runtime)}</script>`);
  }
  const html=`<!doctype html>\n<html lang="${escapeHTML(lang)}"${dir?` dir="${escapeHTML(dir)}"`:''}${pageHTMLAttrs}>\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n<meta name="theme-color" content="#022e64">\n<title>${escapeHTML(pagePart.title || page.title+' | SKANDI')}</title>\n<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">\n${[...new Set(parts.flatMap(p=>[p.headHTML,...p.external]).filter(Boolean))].join('\n')}\n${style.join('\n')}\n<style data-skandi-part="shell">${safeCSS(shellCSS)}</style>\n</head>\n<body${pageBodyAttrs}>\n<div id="skandi-shell-root" data-skandi-page="${page.slug}" data-skandi-key="${page.key}" data-skandi-family="${page.family}" data-skandi-chrome="${page.chrome}">\n${render(header)}\n${render(pagePart)}\n${render(footer)}\n${render(mobile)}\n</div>\n<script data-skandi-part="skandi-shell-runtime">${safeJS(shellJS)}</script>\n${scripts.join('\n')}\n${moduleScripts.join('\n')}\n</body>\n</html>\n`;
  // Validate serialized scripts too: HTML escaping must never publish invalid JS.
  walk(parse(html),n=>{if(n.tagName==='script'&&!attr(n,'src')){const type=(attr(n,'type')||'').toLowerCase(),code=(n.childNodes||[]).map(c=>c.value||'').join('');if(type==='module')parseJS(code,{ecmaVersion:'latest',sourceType:'module'});else if(!type||['text/javascript','application/javascript'].includes(type))new Script(code,{filename:page.output});}});
  return html;
}

async function compileMediaControl(root,page) {
  const input=await triplet(root,page.sourceDirectory,page.stem);
  if(input.status!=='COMPLETE SOURCE')throw new Error('Media Control source is incomplete');
  let html=input.contents[0];
  const tree=parse(html,{sourceCodeLocationInfo:true}),nodes=[];walk(tree,n=>nodes.push(n));
  const replacements=[];
  for(const node of nodes) {
    const stylesheet=node.tagName==='link'&&attr(node,'rel')==='stylesheet';
    const script=node.tagName==='script'&&attr(node,'src');
    const url=stylesheet?attr(node,'href'):script?attr(node,'src'):null;
    if(!url||/^(?:[a-z]+:|\/)/i.test(url))continue;
    const location=node.sourceCodeLocation;
    if(!location)continue;
    const target=await localFile(root,input.files[0],url),content=await fs.readFile(target.file,'utf8');
    if(script)new Script(content,{filename:target.rel});
    if(stylesheet)postcss.parse(content,{from:target.rel});
    const attributes=(node.attrs||[]).filter(a=>!['src','href','rel'].includes(a.name)).map(a=>` ${a.name}="${escapeHTML(a.value)}"`).join('');
    replacements.push({start:location.startOffset,end:location.endOffset,value:stylesheet?`<style${attributes}>${safeCSS(content)}</style>`:`<script${attributes}>${safeJS(content)}</script>`});
  }
  for(const replacement of replacements.sort((a,b)=>b.start-a.start))html=html.slice(0,replacement.start)+replacement.value+html.slice(replacement.end);
  const shellJS=await read(root,'skandi-embeds/global/skandi-shell.js');
  let body;walk(parse(html,{sourceCodeLocationInfo:true}),n=>{if(n.tagName==='body')body=n;});
  const start=body?.sourceCodeLocation?.startTag?.endOffset,end=body?.sourceCodeLocation?.endTag?.startOffset;
  if(!start||!end)throw new Error('Media Control requires a complete body element');
  html=html.slice(0,start)+`<div id="skandi-shell-root" data-skandi-key="${escapeHTML(page.key)}" data-skandi-page="${escapeHTML(page.slug)}" data-skandi-family="riaintra" style="height:100%;min-height:0"><div id="skandi-app-root" style="height:100%;min-height:0">`+html.slice(start,end)+`</div></div><script>${safeJS(shellJS)}</script>`+html.slice(end);
  walk(parse(html),n=>{if(n.tagName==='script'&&!attr(n,'src')&&(!attr(n,'type')||/javascript/.test(attr(n,'type'))))new Script(serialize(n),{filename:page.output});});
  return html;
}
