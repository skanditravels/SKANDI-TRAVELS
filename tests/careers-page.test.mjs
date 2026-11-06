import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(new URL('../scripts/package.json',import.meta.url));const {JSDOM,VirtualConsole}=require('jsdom');
test('careers loads real positions through the parent bridge and keeps applicant sign-in distinct',async t=>{
 const html=await fs.readFile(new URL('../skandi-embeds/careers/skandi-careers.html',import.meta.url),'utf8');
 const js=await fs.readFile(new URL('../skandi-embeds/careers/skandi-careers.js',import.meta.url),'utf8');
 const dom=new JSDOM(html,{runScripts:'outside-only',url:'https://html.test',virtualConsole:new VirtualConsole()});t.after(()=>dom.window.close());
 const w=dom.window,messages=[],parent={postMessage:m=>messages.push(m)};Object.defineProperty(w,'parent',{value:parent});
 w.HTMLCanvasElement.prototype.getContext=()=>({clearRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},scale(){}});w.matchMedia=()=>({matches:false});w.requestAnimationFrame=cb=>w.setTimeout(cb,0);w.HTMLElement.prototype.scrollIntoView=function(){};
 w.eval(js);assert.ok(messages.some(m=>m.type==='CAREERS_READY'));
 w.dispatchEvent(new w.MessageEvent('message',{source:parent,data:{source:'SKANDI_WIX_PARENT',type:'CAREERS_DATA',payload:{positions:[{id:'job1',title:'Guest Services Manager',status:'PUBLISHED'}]}}}));
 assert.match(w.document.querySelector('#jobList').textContent,/Guest Services Manager/);
 assert.ok(w.document.querySelector('#careerApplicantLoginEmail'));assert.equal(w.document.querySelector('#loginEmail'),null);
});
