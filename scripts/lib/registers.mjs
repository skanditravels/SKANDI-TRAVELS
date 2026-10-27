import fs from 'node:fs/promises';
import path from 'node:path';
const cell=x=>String(x??'').replace(/\|/g,'\\|').replace(/\n/g,' ');
const csv=x=>'"'+String(x??'').replace(/"/g,'""')+'"';
export async function writeRegisters(root,out,manifest) {
  const rows=manifest.pages;
  const records=rows.map(p=>({key:p.key,name:p.controller?.split('/').pop().replace(/\.[^.]+\.js$/,'')||'UNVERIFIED',route:p.route,controller:p.controller||'UNVERIFIED',components:p.embedIds?.join(' / ')||(p.binding==='handshake'?'Discovered by existing controller; exact Wix ID requires live inspection':'UNVERIFIED'),
    source:p.aliasOf?`Alias of ${p.aliasOf}`:`${p.sourceDirectory}/${p.stem}.{html,css,js}`,family:p.family,chrome:p.chrome,output:p.output||(p.aliasOf?`Alias of ${p.aliasOf}`:'No current output'),status:p.status,
    receiver:p.status==='BUILT'?p.receiver:p.status==='ALIAS'?`Uses ${p.aliasOf} receiver`:'Not generated until a successful build',
    geometry:p.chrome==='public'?'Full width; 100 viewport-height iframe on mobile; desktop approved full-height scrolling; verify Wix breakpoint geometry':p.chrome==='none'?'Preserve approved application viewport and scrolling; no injected chrome':'Full viewport with family-specific header/footer; page workspace owns scrolling; verify Wix breakpoints',
    readiness:p.status==='BUILT'?'STATICALLY VERIFIED; REQUIRES LIVE TEST before installation':p.status==='ALIAS'?`Uses ${p.aliasOf}; no separate installation`:`NOT READY: ${p.error||p.blockers?.join('; ')||p.status}`,
    backend:p.backend?.join('; ')||'See existing controller',publication:'Run SKANDI Website Builder; it publishes dist/ and this successful page receiver together. Install this page-specific receiver into its existing Wix HTML component, publish Wix, then verify live.'}));
  const columns=Object.keys(records[0]||{});
  await fs.writeFile(path.join(out,'wix-installation.csv'),[columns.map(csv).join(','),...records.map(r=>columns.map(k=>csv(r[k])).join(','))].join('\n')+'\n');
  const mapped=new Set(rows.map(r=>r.controller).filter(Boolean));
  const controllers=(await fs.readdir(path.join(root,'src/pages'))).filter(f=>/\.[a-z0-9]+\.js$/i.test(f)&&!mapped.has('src/pages/'+f)).sort();
  const text=['# Generated website structure and Wix installation register','',
    'Route authority: `src/public/siteMap.js`. This file is generated evidence, not route configuration. A source mapping is not proof of Wix element installation.','',
    '| Key | Canonical route | Source triplet | Family / chrome | Controller | Status |',
    '| --- | --- | --- | --- | --- | --- |',...records.map(r=>'| '+[r.key,r.route,r.source,r.family+' / '+r.chrome,r.controller,r.status].map(cell).join(' | ')+' |'),'',
    '## Installation boundary','',
    'The CSV beside this file contains every route, exact source-verified controller/component ID candidates, geometry, receiver, backend owner and remaining checks. Multiple ID candidates mean the source supports those IDs; inspect Wix to identify the installed one. Install a receiver only for a BUILT route, using the page-specific path in the CSV and the existing Wix HTML component. Shared chrome and nested page components do not have separate route handshakes. Pending, blocked, failed and multi-component routes have no installable receiver.','',
    '## Unregistered or unresolved controllers','',
    'These actual repository controllers are preserved. No new route or build is invented for them. Some are Wix native app pages, popups, dynamic views or competing mappings. Their source slots are reserved under `skandi-embeds/_unregistered/`; their canonical route and embedding contract must be verified before promotion.','',
    ...controllers.map(c=>'- `src/pages/'+c+'`'),'',
    '## Readiness details','',...records.filter(r=>!['ALIAS','BUILT'].includes(r.status)).map(r=>'- **'+r.key+'**: '+r.readiness),''
  ].join('\n');
  await fs.writeFile(path.join(out,'website-structure.md'),text);
  return {records,controllers};
}
