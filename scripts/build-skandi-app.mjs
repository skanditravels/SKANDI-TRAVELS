#!/usr/bin/env node
/** SKANDI V12 universal compiler. Routes and integration bindings live in siteMap.js. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {inventory,scaffold,read,triplet} from './lib/inventory.mjs';
import {compilePage,chromeParts,hash} from './lib/compile.mjs';
import {pageReceiverPath,renderPageReceiver} from './lib/page-receiver.mjs';
import {writeRegisters} from './lib/registers.mjs';
const HERE=path.dirname(fileURLToPath(import.meta.url));
export async function build({root=process.env.SKANDI_REPO_ROOT||path.resolve(HERE,'..'),out=process.env.SKANDI_OUTPUT_DIR||path.join(root,'dist'),log=console.log,failOnFamilies=null}={}) {
  const {rows}=await inventory(root),errors=[],pageFailures=[],built=[];
  const recordFailure=(row,error)=>{pageFailures.push(error);if(!failOnFamilies||failOnFamilies.includes(row.family))errors.push(error);};
  const globals={};
  for(const family of ['public','riaintra','altea']) {
    globals[family]=[];
    for(const d of chromeParts(family)) {
      const t=await triplet(root,d.directory,d.stem);
      globals[family].push({component:d.stem,status:t.status,missing:t.missing});
    }
  }
  await fs.mkdir(out,{recursive:true});
  for(const row of rows) {
    if(row.status==='ALIAS')continue;
    row.sourceStatus=row.status;
    row.blockers=[...row.issues];
    row.blockers.push(...(globals[row.chrome]||[]).filter(c=>c.status!=='COMPLETE SOURCE').map(c=>`${c.component}: ${c.status} (${c.missing.join(', ')})`));
    if(row.status==='INCOMPLETE SOURCE') {
      row.status='FAILED';row.error=`[${row.key}] INCOMPLETE SOURCE: ${row.missing.join(', ')}`;recordFailure(row,row.error);
    } else if(row.status==='COMPLETE SOURCE' && row.blockers.length) {
      row.status='BLOCKED INTEGRATION';
    } else if(row.status==='COMPLETE SOURCE') {
      try {
        const html=await compilePage(root,row);
        const receiver=await renderPageReceiver(root,row);
        const dest=path.join(out,row.slug,'index.html');
        const receiverRelative=pageReceiverPath(row);
        const receiverDest=path.join(root,receiverRelative);
        await fs.mkdir(path.dirname(dest),{recursive:true});
        await fs.mkdir(path.dirname(receiverDest),{recursive:true});
        const temp=dest+'.tmp',receiverTemp=receiverDest+'.tmp';
        await fs.writeFile(temp,html);await fs.writeFile(receiverTemp,receiver);
        await fs.rename(receiverTemp,receiverDest);await fs.rename(temp,dest);
        row.status='BUILT';row.receiver=receiverRelative;row.sha256=hash(html);row.bytes=Buffer.byteLength(html);built.push(row.key);
      } catch(e) {row.status='FAILED';row.error=e.message;recordFailure(row,e.message);}
    }
    if(row.status!=='BUILT') {
      delete row.receiver;
      row.retainedArtifact=await fs.stat(path.join(out,row.slug,'index.html')).then(()=>true,()=>false);
      row.output=null; // Retain installed legacy URLs, but never advertise them as a current build.
    }
  }
  const canonical=new Map(rows.filter(r=>r.status!=='ALIAS').map(r=>[r.key,r]));
  for(const row of rows.filter(r=>r.status==='ALIAS')) row.targetStatus=canonical.get(row.aliasOf)?.status||'UNKNOWN';
  const files=await fs.readdir(out,{withFileTypes:true});
  const orphanedArtifacts=[];
  for(const f of files) if(f.isDirectory()&&!rows.some(p=>p.slug===f.name)) {
    if(await fs.stat(path.join(out,f.name,'index.html')).then(()=>true,()=>false))orphanedArtifacts.push({path:`dist/${f.name}/index.html`,status:'RETAINED UNREGISTERED ARTIFACT',advertised:false});
  }
  const manifest={schemaVersion:2,routeAuthority:'src/public/siteMap.js',pages:rows,globalComponents:globals,orphanedArtifacts};
  await fs.writeFile(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
  await writeRegisters(root,out,manifest);
  for(const row of rows) log(`${row.key}: ${row.status}${row.output?' -> '+row.output:''}${row.error?' — '+row.error:''}`);
  log(`Built ${built.length}; pending ${rows.filter(p=>p.status==='PENDING SOURCE').length}; blocked ${rows.filter(p=>p.status==='BLOCKED INTEGRATION').length}; aliases ${rows.filter(p=>p.status==='ALIAS').length}; failed pages ${pageFailures.length}; workflow-gated failures ${errors.length}.`);
  return {manifest,errors,pageFailures,built};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const root=process.env.SKANDI_REPO_ROOT||path.resolve(HERE,'..');
  const task=process.argv.includes('--scaffold')?scaffold(root):process.argv.includes('--inventory')?inventory(root).then(({rows})=>console.log(rows.map(r=>`${r.key}: ${r.status}`).join('\n'))):build({failOnFamilies:process.argv.includes('--fail-on-public')?['public']:null});
  task.then(result=>{if(result?.errors?.length)process.exitCode=1;}).catch(e=>{console.error('SKANDI_BUILD_FAILED:',e.message);process.exitCode=1;});
}
