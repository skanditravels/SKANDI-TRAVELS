import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {inventory} from '../scripts/lib/inventory.mjs';
import {compilePage} from '../scripts/lib/compile.mjs';
const require=createRequire(new URL('../scripts/package.json',import.meta.url));
const {JSDOM}=require('jsdom');
const root=fileURLToPath(new URL('..',import.meta.url));
const {rows}=await inventory(root);
const pages={};
for(const key of ['successFactors','mail','docunet','serviceDesk']) pages[key]=await compilePage(root,rows.find(row=>row.key===key));
function mount(key,part,{mobile=true,hook}={}){
 const dom=new JSDOM(pages[key],{url:'https://example.test/riaintra/success-factors',runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window,sent=[];w.matchMedia=q=>({matches:mobile&&/max-width/.test(q),addEventListener(){},removeEventListener(){}});w.scrollTo=()=>{};w.postMessage=m=>sent.push(m);
 let code=w.document.querySelector(`script[data-skandi-part="${part}"]`).textContent;
 if(hook) code=code.replace('    initializePortal();',hook+'\n    initializePortal();');
 w.eval(code);sent.length=0;
 const receive=(type,payload={})=>w.dispatchEvent(new w.MessageEvent('message',{source:w,origin:'https://example.test',data:{source:'SKANDI_WIX_PARENT',type,payload}}));
 return {dom,w,d:w.document,sent,receive};
}
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));

test('Mail opens folders, composes, reads a selected message, and returns to its list',()=>{
 const {dom,d,receive,sent}=mount('mail','mail');const app=d.querySelector('.app');
 receive('MAIL_BOOTSTRAP',{profile:{id:'synthetic'},messages:[{id:'m1',subject:'Synthetic subject',fromName:'Test Sender',preview:'Preview'}]});
 d.getElementById('mobileFoldersBtn').click();assert(app.classList.contains('mobile-folders-open'));assert.equal(d.getElementById('mobileFoldersBtn').getAttribute('aria-expanded'),'true');
 d.querySelector('[data-folder="Sent"]').click();assert(!app.classList.contains('mobile-folders-open'));assert.equal(d.getElementById('folderHeading').textContent,'Sent Items');
 receive('MAIL_LIST_RESPONSE',{messages:[{id:'m1',subject:'Synthetic subject'}]});d.querySelector('.mail-item').click();assert(app.classList.contains('mobile-reading'));assert(sent.some(m=>m.type==='MAIL_GET_REQUEST'&&m.payload.messageId==='m1'));assert.match(d.getElementById('readingContent').textContent,/Loading message/);
 receive('MAIL_GET_RESPONSE',{message:{id:'m1',subject:'Synthetic subject',bodyPlain:'Synthetic body'}});assert.match(d.getElementById('readingContent').textContent,/Synthetic body/);
 d.getElementById('mobileMailBack').click();assert(!app.classList.contains('mobile-reading'));
 d.getElementById('mobileComposeBtn').click();assert(d.getElementById('composeBackdrop').classList.contains('open'));
 dom.window.close();
});

test('Mail preserves the composer until send is confirmed and displays failures beside it',async()=>{
 const {dom,d,receive,sent}=mount('mail','mail');receive('MAIL_BOOTSTRAP',{profile:{id:'synthetic'},messages:[]});d.getElementById('mobileComposeBtn').click();
 d.getElementById('composeTo').value='someone@example.test';d.getElementById('composeSubject').value='Synthetic';d.getElementById('composeBody').value='Synthetic body';
 d.getElementById('composeForm').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));await tick();
 assert(sent.some(m=>m.type==='MAIL_SEND_REQUEST'));assert(d.getElementById('composeBackdrop').classList.contains('open'));assert(d.querySelector('#composeForm [type="submit"]').disabled);
 receive('MAIL_ERROR',{action:'MAIL_SEND_REQUEST',message:'Send failed'});assert.equal(d.getElementById('composeMessage').textContent,'Send failed');assert.equal(d.getElementById('composeBody').value,'Synthetic body');assert(!d.querySelector('#composeForm [type="submit"]').disabled);
 dom.window.close();
});

test('Mail sends only once while waiting and closes the composer after confirmation',async()=>{
 const {dom,d,receive,sent}=mount('mail','mail');receive('MAIL_BOOTSTRAP',{profile:{id:'synthetic'},messages:[]});d.getElementById('mobileComposeBtn').click();
 d.getElementById('composeTo').value='someone@example.test';d.getElementById('composeSubject').value='Synthetic';d.getElementById('composeBody').value='Synthetic body';
 const form=d.getElementById('composeForm');form.dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));form.dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));await tick();
 assert.equal(sent.filter(m=>m.type==='MAIL_SEND_REQUEST').length,1);receive('MAIL_SEND_RESPONSE',{});assert(!d.getElementById('composeBackdrop').classList.contains('open'));assert.equal(d.getElementById('folderHeading').textContent,'Sent Items');assert(sent.some(m=>m.type==='MAIL_LIST_REQUEST'&&m.payload.folder==='Sent'));dom.window.close();
});

test('Mail does not send a message with attachments silently omitted',async()=>{
 const {dom,d,receive,sent}=mount('mail','mail');receive('MAIL_BOOTSTRAP',{profile:{id:'synthetic'},messages:[]});d.getElementById('mobileComposeBtn').click();d.getElementById('composeTo').value='someone@example.test';d.getElementById('composeSubject').value='Synthetic';d.getElementById('composeBody').value='Synthetic body';
 Object.defineProperty(d.getElementById('composeFiles'),'files',{configurable:true,value:[{name:'large.txt',size:11*1024*1024}]});d.getElementById('composeForm').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));await tick();assert(!sent.some(m=>m.type==='MAIL_SEND_REQUEST'));assert.match(d.getElementById('composeMessage').textContent,/10 MB/);assert(d.getElementById('composeBackdrop').classList.contains('open'));dom.window.close();
});

test('Mail displays a reading failure inside the reading view',()=>{
 const {dom,d,receive}=mount('mail','mail');receive('MAIL_BOOTSTRAP',{profile:{id:'synthetic'},messages:[{id:'m1'}]});d.querySelector('.mail-item').click();receive('MAIL_ERROR',{action:'MAIL_GET_REQUEST',message:'Unable to load'});assert.match(d.getElementById('readingContent').textContent,/Unable to load/);assert(d.querySelector('.app').classList.contains('mobile-reading'));dom.window.close();
});

test('DocuNet starts with the mobile inspector closed and lets employees open and close it',()=>{
 const {dom,d}=mount('docunet','docunet');const pane=d.getElementById('inspector');assert(pane.classList.contains('hidden'));d.getElementById('inspectorBtn').click();assert(!pane.classList.contains('hidden'));d.getElementById('inspectorCloseBtn').click();assert(pane.classList.contains('hidden'));dom.window.close();
});

test('Service Desk exposes its queue and context, one panel at a time',()=>{
 const {dom,d}=mount('serviceDesk','service-desk');const app=d.querySelector('.app');d.getElementById('mobileQueueBtn').click();assert(app.classList.contains('mobile-queue-open'));assert.equal(d.getElementById('mobileQueueBtn').getAttribute('aria-expanded'),'true');d.getElementById('mobileContextBtn').click();assert(!app.classList.contains('mobile-queue-open'));assert(app.classList.contains('mobile-context-open'));d.getElementById('mobileContextClose').click();assert(!app.classList.contains('mobile-context-open'));dom.window.close();
});

test('remembered workspace views are allowlisted, scoped to authenticated staff and never authorize HR',()=>{
 const hook=`window.__mobileTest={boot(id){importBootstrap({profile:{id,role:'Driver'},currentUserRole:'Driver'});},pick(view){setRoute(view)},restore(){restoreWorkspaceView();parseRoute()},view(){return currentView},key(){return workspacePreferenceKey()}};`;
 const {dom,w}=mount('successFactors','success-factors',{hook});const t=w.__mobileTest;t.boot('employee-A');t.pick('tasks');const keyA=t.key();assert.equal(w.localStorage.getItem(keyA),'tasks');assert(!keyA.includes('employee-A'));
 w.history.replaceState(null,'',w.location.pathname);t.boot('employee-B');t.restore();assert.equal(t.view(),'home');assert.notEqual(t.key(),keyA);
 w.history.replaceState(null,'',w.location.pathname);t.boot('employee-A');t.restore();assert.equal(t.view(),'tasks');w.localStorage.setItem(keyA,'hr');w.history.replaceState(null,'',w.location.pathname);t.restore();assert.equal(t.view(),'home');
 w.history.replaceState(null,'','#/hr/workforce');t.restore();assert.equal(t.view(),'home');
 w.history.replaceState(null,'','#/news');w.localStorage.setItem(keyA,'tasks');t.restore();assert.equal(t.view(),'news');dom.window.close();
});
