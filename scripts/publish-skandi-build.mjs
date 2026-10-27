#!/usr/bin/env node
import {execFileSync,spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
export function publish(cwd=process.cwd()) {
  const git=(...args)=>execFileSync('git',args,{cwd,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
  const manifest=JSON.parse(fs.readFileSync(path.join(cwd,'dist/manifest.json'),'utf8'));
  if(!Array.isArray(manifest.pages))throw new Error('Generated build manifest has no page list.');
  const receiverPaths=[...new Set(manifest.pages.filter(page=>page.status==='BUILT').map(page=>{
    const expected=path.posix.join(String(page.sourceDirectory||''),`${String(page.stem||'')}.receiver.html`);
    if(page.receiver!==expected||!/^((skandi-embeds|riaintra-embeds)\/[a-z0-9/-]+)\/[a-z0-9-]+\.receiver\.html$/.test(expected)||expected.includes('..'))throw new Error(`Invalid generated receiver mapping for ${page.key||'unknown page'}.`);
    if(!fs.existsSync(path.join(cwd,expected)))throw new Error(`Built page receiver is missing: ${expected}`);
    return expected;
  }))];
  const allowedPaths=['dist/',...receiverPaths];
  git('add','-A','--',...allowedPaths);
  const paths=git('diff','--cached','--name-only','-z').split('\0').filter(Boolean);
  if(paths.some(p=>!p.startsWith('dist/')&&!receiverPaths.includes(p)))throw new Error('Refusing to commit staged files outside generated dist/ and successful page receivers.');
  const diff=spawnSync('git',['diff','--cached','--quiet','--',...allowedPaths],{cwd});
  if(diff.status===0){console.log('No generated changes; no commit created.');return false;}
  if(diff.status!==1)throw new Error('Could not inspect staged generated changes.');
  const base=git('rev-parse','HEAD');
  git('fetch','origin','main');
  if(git('rev-parse','origin/main')!==base)throw new Error('main changed during compilation. Rerun SKANDI Website Builder; generated output was not pushed.');
  git('commit','-m','Build SKANDI website');
  try{git('push','origin','HEAD:main');}catch(e){throw new Error('Generated output was not pushed. Branch protection or permissions may require a reviewed PR. Git reported: '+String(e.stderr||e.message));}
  console.log(`Committed and pushed ${paths.length} generated files.`);return true;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))try{publish();}catch(e){console.error(e.message);process.exitCode=1;}
