import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const {JSDOM}=require('../scripts/node_modules/jsdom');
const root=new URL('../',import.meta.url);
const read=async path=>fs.readFile(new URL(path,root),'utf8');
const id='13b7f361-f47e-4a28-93bf-1cbcc8ce6624';
const draftId='2fd786f7-9ae9-4383-9ce6-675569a22657';

async function workspaceHarness({role='OWNER',record,revisionRecord}={}){
 const source=(await read('src/backend/SKANDI_CORE/automationsWorkspace.js')).replace(/^import .*;\s*$/gm,'').replace(/^export /gm,'');
 const calls=[];
 const current=record||{_id:id,revision:'4',origin:'USER',configuration:{status:'INACTIVE',trigger:{appId:id,triggerKey:'hello'},actions:{},rootActionIds:[]}};
 const mock={
  getAutomation:async()=>structuredClone(current),
  getAutomationRevision:async(...args)=>{calls.push(['revision',...args]);return {automation:structuredClone(revisionRecord||current)}},
  updateAutomation:async(...args)=>{calls.push(['update',...args]);current.configuration=args[1].configuration;return structuredClone(current)},
  validateAutomation:async()=>({status:'VALID'}),
  getOrCreateDraftAutomation:async()=>structuredClone(current),
  queryAutomationsWithDrafts:async()=>({automations:[structuredClone(current)],pagingMetadata:{hasNext:false}})
 };
 const provider=new Proxy(mock,{get:(o,k)=>o[k]||async function(){throw new Error('Unexpected provider call: '+String(k))}});
 const ctx={auth:{elevate:x=>x},automationsV2:provider,triggerCatalog:provider,actionCatalog:provider,automationEmailAction:provider,randomUUID:()=>id,
 requireStaffPortalSessionCore:async()=>({accessRole:role,profile:{}}),getVoyAdminBootstrapCore:async()=>({campaigns:[]}),saveVoyEntityCore:async()=>({ok:true,entity:{}}),deleteVoyEntityCore:async()=>({ok:true}),getAutomationAdminSnapshotCore:async()=>({automations:[]}),EMAIL_PLATFORM:{},EMAIL_WORKFLOWS:{},COMMON_DYNAMIC_VARIABLE_KEYS:[],console};
 vm.createContext(ctx);vm.runInContext(source+'\nthis.exposed={redactDefinition,restoreDefinition,connectionFields,content,setAutomationStatusCore,saveAutomationDraftCore};',ctx);
 return {api:ctx.exposed,calls,current};
}

test('protected values remain server side and cannot be replaced',async()=>{
 const {api}=await workspaceHarness();const source={api_key:'original',nested:{authorizationHeader:'Bearer abc',ordinary:'ok'}};
 const visible=api.redactDefinition(source);
 assert.equal(visible.api_key,'[protected]');assert.equal(visible.nested.authorizationHeader,'[protected]');
 assert.equal(api.restoreDefinition(visible,source).api_key,'original');
 assert.throws(()=>api.restoreDefinition({...visible,api_key:'replacement'},source),/Protected values/);
});

test('status updates preserve optional override schemas and require a verified revision',async()=>{
 const full={_id:id,revision:'4',origin:'USER',configuration:{status:'INACTIVE',trigger:{appId:id,triggerKey:'hello',overrideOutputSchema:{type:'object'}},actions:{},rootActionIds:[]}};
 const {api,calls}=await workspaceHarness({revisionRecord:full});const result=await api.setAutomationStatusCore({automationId:id,revision:'4',active:true,confirm:true});
 assert.equal(result.status,'ACTIVE');assert.deepEqual(Array.from(calls[0][2].fields),['OVERRIDE_SCHEMA']);assert.equal(calls[1][2].configuration.trigger.overrideOutputSchema.type,'object');
 const mismatch=await workspaceHarness({revisionRecord:{...full,revision:'5'}});
 await assert.rejects(mismatch.api.setAutomationStatusCore({automationId:id,revision:'4',active:true,confirm:true}),/could not be confirmed/);
 assert.equal(mismatch.calls.some(x=>x[0]==='update'),false);
});

test('non-administrators cannot change workflow status',async()=>{
 const {api,calls}=await workspaceHarness({role:'STAFF'});
 await assert.rejects(api.setAutomationStatusCore({automationId:id,revision:'4',active:true,confirm:true}),/administrator access/);assert.equal(calls.length,0);
});

test('provider-owned workflow connections cannot be changed by a draft save',async()=>{
 const old={_id:draftId,revision:'2',origin:'PREINSTALLED',draftInfo:{originalAutomationId:id},configuration:{status:'INACTIVE',trigger:{appId:id,triggerKey:'hello'},rootActionIds:['a'],actions:{a:{type:'APP_DEFINED',appDefinedInfo:{postActionIds:['b']}},b:{type:'DELAY',delayInfo:{postActionIds:[]}}}}};
 const {api}=await workspaceHarness({record:old});const definition={name:'Test',configuration:structuredClone(old.configuration)};definition.configuration.actions.a.appDefinedInfo.postActionIds=[];
 await assert.rejects(api.saveAutomationDraftCore({draftId,originalId:id,revision:'2',definition}),/Reconnecting steps/);
});

test('HTML and visual message content use the service composer JSON envelope',async()=>{
 const {api}=await workspaceHarness();const html='<!doctype html><html><body>Hello</body></html>';
 const result=api.content({sourceMode:'HTML',subject:'Subject',preheader:'',htmlSource:html});assert.deepEqual(JSON.parse(result.composer.composerDataJson),{html});
});

test('interface displays system terminology while preserving provider identifiers',async()=>{
 const html=await read('riaintra-embeds/automation-control/skandi-automation-control.html');
 const js=await read('riaintra-embeds/automation-control/skandi-automation-control.js');
 const dom=new JSDOM(html,{runScripts:'outside-only',url:'https://example.test/'});const {window:w}=dom;const messages=[];
 w.postMessage=(m)=>messages.push(m);w.eval(js);w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
 const request=messages.find(m=>m.type==='AUTOMATION_CONSOLE_REFRESH');assert.ok(request);
 w.dispatchEvent(new w.MessageEvent('message',{source:w,data:{source:'SKANDI_WIX_PARENT',type:'AUTOMATION_CONSOLE_BOOTSTRAP',requestId:request.requestId,payload:{live:{automations:[]},workspace:{templates:[],triggers:[],actions:[]},platform:{workflows:[{workflowKey:'WIX_CUSTOM',category:'Wix example',audiences:['CUSTOMER']}]}}}}));
 await new Promise(resolve=>setTimeout(resolve,0));const opt=w.document.querySelector('#catalogWorkflow option[value="WIX_CUSTOM"]');assert.ok(opt);assert.doesNotMatch(opt.textContent,/wix/i);
 assert.doesNotMatch(w.document.body.textContent,/\bwix\b/i);dom.window.close();
});

test('automation snapshot paginates and separates standalone drafts from live counts',async()=>{
 const source=(await read('src/backend/SKANDI_CORE/automationControl.js')).replace(/import[\s\S]*?from\s+["'][^"']+["'];\s*/g,'').replace(/^export /gm,'');
 let calls=0;const rows=Array.from({length:101},(_,i)=>({_id:'entry-'+i,name:'Workflow '+i,origin:'USER',configuration:{status:'ACTIVE',trigger:{triggerKey:'event'},actions:{}}}));
 const context={automationsV2:{queryAutomationsWithDrafts:async ({query})=>{calls++;return query.cursorPaging.cursor?{automations:[...rows.slice(100),{_id:'draft',name:'Draft',draftInfo:{},configuration:{}}],pagingMetadata:{hasNext:false}}:{automations:rows.slice(0,100),pagingMetadata:{hasNext:true,cursors:{next:'page-two'}}}}},auth:{elevate:x=>x},requireStaffPortalSessionCore:async()=>({accessRole:'OWNER'}),
 lower:v=>String(v||'').toLowerCase(),upper:v=>String(v||'').toUpperCase(),text:(v,n)=>String(v||'').slice(0,n),stringArray:v=>Array.isArray(v)?v:[],SkandiError:class extends Error{},
 generateAutomationEmailActionMapping:()=>{},getAutomationEmailPlatformSnapshot:()=>{},inspectAutomationEmailAction:()=>{},previewAutomationEmailAction:()=>{},syncAutomationEmailAction:()=>{},console};
 vm.createContext(context);vm.runInContext(source+'\nthis.snapshot=getAutomationAdminSnapshotCore;',context);const result=await context.snapshot();
 assert.equal(calls,2);assert.equal(result.automations.length,102);assert.equal(result.counts.active,101);assert.equal(result.counts.drafts,1);
});

test('only the audited empty sandbox preview passes the compiler frame policy',async()=>{
 const {normalizeHTML}=await import('../scripts/lib/compile.mjs');const path=await import('node:path');const {fileURLToPath}=await import('node:url');
 const dir=fileURLToPath(root),file=path.join(dir,'riaintra-embeds/automation-control/skandi-automation-control.html');
 const opts={root:dir,file,mount:'skandi-app-root'};
 const allowed='<html><body><iframe id="emailPreview" class="preview" title="Message preview" sandbox hidden></iframe></body></html>';
 await normalizeHTML(allowed,'','',opts);
 await assert.rejects(normalizeHTML(allowed.replace('sandbox hidden','sandbox="allow-scripts" hidden'),'','',opts),/nested iframe/);
 await assert.rejects(normalizeHTML(allowed.replace('sandbox hidden','sandbox src="https://example.com" hidden'),'','',opts),/nested iframe/);
});
