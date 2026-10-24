#!/usr/bin/env node
import {execFileSync,spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
export function publish(cwd=process.cwd()) {
  const git=(...args)=>execFileSync('git',args,{cwd,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
  git('add','-A','--','dist/');
  const paths=git('diff','--cached','--name-only','-z').split('\0').filter(Boolean);
  if(paths.some(p=>!p.startsWith('dist/')))throw new Error('Refusing to commit staged files outside dist/.');
  const diff=spawnSync('git',['diff','--cached','--quiet','--','dist/'],{cwd});
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
