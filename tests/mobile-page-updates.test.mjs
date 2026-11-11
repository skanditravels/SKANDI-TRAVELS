import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(new URL('../scripts/package.json',import.meta.url));
const {JSDOM,VirtualConsole}=require('jsdom');
const read=path=>fs.readFile(new URL('../'+path,import.meta.url),'utf8');
const mobile=()=>({matches:true,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}});
test('baggage finder refreshes with the public airline payload and filters published details',async()=>{
 const markup=await read('skandi-embeds/travel-info/skandi-travel-info.html');
 const js=await read('skandi-embeds/travel-info/skandi-travel-info.js');
 const dom=new JSDOM(markup,{runScripts:'outside-only',url:'https://www.skanditravels.com/travel-info',virtualConsole:new VirtualConsole()});
 const w=dom.window;w.matchMedia=mobile;w.scrollTo=()=>{};w.requestAnimationFrame=fn=>w.setTimeout(fn,0);w.eval(js);
 w.document.querySelector('[data-action="baggage"]').click();
 assert.match(w.document.querySelector('#tiBagCount').textContent,/Loading/);
 const airlines=[{id:'one',name:'Test Airline',iataCode:'TA',baggage:{mode:'structured',cabins:[{cabinType:'Economy',fares:[{name:'Standard',underSeatBag:'1 small bag',checkedBag:'23 kg'}]}]}},{id:'two',name:'Other Air',iataCode:'OA',baggage:{mode:'narrative',text:'Check airline rules'}}];
 w.dispatchEvent(new w.MessageEvent('message',{source:w,data:{source:'SKANDI_WIX_PARENT',type:'TRAVEL_INFO_DATA',payload:{airlines}}}));
 assert.match(w.document.querySelector('#tiBagCount').textContent,/2 of 2/);
 const input=w.document.querySelector('#tiBagSearch');input.value='23 kg';input.dispatchEvent(new w.Event('input',{bubbles:true}));
 assert.match(w.document.querySelector('#tiBagResults').textContent,/Test Airline/);assert.doesNotMatch(w.document.querySelector('#tiBagResults').textContent,/Other Air/);
 input.value='';input.dispatchEvent(new w.Event('input',{bubbles:true}));const cabin=w.document.querySelector('#tiBagCabin');cabin.value='Economy';cabin.dispatchEvent(new w.Event('change',{bubbles:true}));assert.match(w.document.querySelector('#tiBagCount').textContent,/1 of 2/);
 w.document.querySelector('#tiBagClear').click();assert.match(w.document.querySelector('#tiBagCount').textContent,/2 of 2/);assert.equal(w.document.querySelector('#tiAlexandraLauncher'),null);w.close();
});
test('booking mobile presentation tracks the actual rendered journey step',async()=>{
 const source=await read('skandi-embeds/booking/skandi-booking-flow.js');const marker='/* Presentation enhancement for the existing, single-component booking journey. */';const start=source.lastIndexOf(marker);assert.ok(start>=0);const code=source.slice(start);
 const dom=new JSDOM('<!doctype html><div id="skandi-app-root"><div class="flow-view active-view" id="view-offer"><div class="flow-stepper"><span class="flow-step active"><span class="flow-label">Offer</span></span><span class="flow-step"><span class="flow-label">Travelers</span></span></div><div class="travel-planner"><div class="panel-head"><h2>Travel Planner</h2></div></div><div class="booking-filters"></div></div></div>',{runScripts:'outside-only',url:'https://example.test'});
 const w=dom.window;w.matchMedia=mobile;w.requestAnimationFrame=fn=>w.setTimeout(fn,0);w.eval(code);
 assert.equal(w.document.querySelector('.booking-app-stage').textContent,'Offer');assert.equal(w.document.querySelector('.booking-app-progress').getAttribute('aria-valuenow'),'1');assert.ok(w.document.querySelector('.booking-app-planner'));assert.ok(w.document.body.classList.contains('booking-app-enhanced'));
 const steps=w.document.querySelectorAll('.flow-step');steps[0].classList.remove('active');steps[1].classList.add('active');await new Promise(r=>setTimeout(r,20));assert.equal(w.document.querySelector('.booking-app-stage').textContent,'Travelers');assert.equal(w.document.querySelector('.booking-app-progress').getAttribute('aria-valuenow'),'2');w.close();
});
test('Home traveler summary follows the existing traveler counters',async()=>{
 const source=await read('skandi-embeds/home/skandi-home.js');const marker='/* Mobile-only interaction improvements; all search and navigation messages stay with Home. */';const start=source.lastIndexOf(marker);assert.ok(start>=0);
 const markup='<div id="skandi-app-root"><div id="skandi-home-content"><div id="panel-flights"><div class="pax-row"><div class="field"><label>Adults</label><div class="counter"><button data-step="-1">−</button><span>1</span><button data-step="1">+</button></div></div><div class="field"><label>Children</label><div class="counter"><button data-step="-1">−</button><span>0</span><button data-step="1">+</button></div></div></div><div id="ageFields"></div></div></div></div>';
 const dom=new JSDOM(markup,{runScripts:'outside-only',url:'https://example.test'});const w=dom.window;w.matchMedia=mobile;w.requestAnimationFrame=fn=>w.setTimeout(fn,0);w.eval(source.slice(start));
 assert.equal(w.document.querySelector('.home-travelers-summary').textContent,'1 Adults');const spans=w.document.querySelectorAll('.counter span');spans[1].textContent='2';await new Promise(r=>setTimeout(r,10));assert.match(w.document.querySelector('.home-travelers-summary').textContent,/2 Children/);w.close();
});
