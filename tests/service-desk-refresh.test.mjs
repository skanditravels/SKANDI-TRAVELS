import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
import { inventory } from '../scripts/lib/inventory.mjs';
import { compilePage } from '../scripts/lib/compile.mjs';
const require=createRequire(new URL('../scripts/package.json',import.meta.url));
const {JSDOM,VirtualConsole}=require('jsdom');
const root=new URL('..',import.meta.url).pathname;

test('background support updates preserve the reply editor and display new messages',async t=>{
  const {rows}=await inventory(root),row=rows.find(r=>r.key==='serviceDesk');
  const html=await compilePage(root,row),sent=[];let parent;const log=new VirtualConsole();
  const dom=new JSDOM(html,{url:'https://embed.example',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:log,beforeParse(w){parent={postMessage:m=>sent.push(m)};Object.defineProperty(w,'parent',{value:parent});}});
  t.after(()=>dom.window.close());const w=dom.window,doc=w.document;
  assert.equal(w.getComputedStyle(doc.querySelector('.top')).color, 'rgb(23, 33, 43)');
  assert.equal(w.getComputedStyle(doc.querySelector('.top .icon')).color, 'rgb(23, 33, 43)');
  assert.equal(w.getComputedStyle(doc.querySelector('.talk')).color, 'rgb(255, 255, 255)');
  const c={id:'case-1',caseId:'case-1',externalId:'case-1',subject:'Travel question',status:'open',priority:'normal',createdAt:'2026-11-08T00:00:00Z',updatedAt:'2026-11-08T00:00:00Z',requester:{name:'Traveler',email:'test@example.invalid'}};
  function receive(type,payload){w.dispatchEvent(new w.MessageEvent('message',{source:parent,data:{source:'SKANDI_WIX_PARENT',type,payload}}))}
  receive('AGENT_BOOTSTRAP',{cases:[c],session:{agentId:1,agentName:'Agent'}});
  doc.querySelector('#queueList [data-open]').click();
  const editor=doc.querySelector('#editor');assert.ok(editor);editor.value='An unfinished reply';editor.dispatchEvent(new w.Event('input'));editor.focus();
  receive('AGENT_CASE_LIST',{backgroundSync:true,cases:[c]});
  assert.equal(doc.querySelector('#editor'),editor);assert.equal(editor.value,'An unfinished reply');assert.equal(doc.activeElement,editor);
  receive('AGENT_CASE_DETAIL',{backgroundSync:true,case:{...c,history:[{id:'msg-1',senderType:'customer',body:'New incoming message',createdAt:'2026-11-08T01:00:00Z'}]}});
  assert.equal(doc.querySelector('#editor'),editor);assert.equal(editor.value,'An unfinished reply');assert.equal(doc.activeElement,editor);
  assert.match(doc.querySelector('#conversation').textContent,/New incoming message/);
  assert.doesNotMatch(doc.querySelector('#toasts').textContent,/Case loaded|Cases refreshed/);
});

test('media toolbar no longer contains obsolete counters or updater calls',async()=>{
  const html=await fs.readFile(new URL('../riaintra-embeds/media-control/skandi-media-control.html',import.meta.url),'utf8');
  const js=await fs.readFile(new URL('../riaintra-embeds/media-control/skandi-media-control.js',import.meta.url),'utf8');
  assert.doesNotMatch(html,/id="stat(?:Issues|Pages|Articles|Assets|Ready)"/);
  assert.doesNotMatch(js,/\bupdateStats\(/);
});

test('internal desktop shell scrolls as a document and keeps mobile form sizing',async()=>{
  const css=await fs.readFile(new URL('../skandi-embeds/global/skandi-shell.css',import.meta.url),'utf8');
  assert.match(css,/@media\s*\(min-width:\s*1021px\)[\s\S]*?\[data-skandi-chrome="riaintra"\][\s\S]*?height:\s*auto;[\s\S]*?overflow:\s*visible/);
  assert.match(css,/font-size:\s*max\(16px,\s*1em\)\s*!important/);
});
