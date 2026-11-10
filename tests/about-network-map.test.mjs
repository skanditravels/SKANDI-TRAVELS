import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import * as routes from '../src/public/siteMap.js';

const require=createRequire(new URL('../scripts/package.json',import.meta.url));
const {JSDOM}=require('jsdom');
const read=path=>fs.readFile(new URL('../'+path,import.meta.url),'utf8');
const withoutImports=code=>code.replace(/^import .+;$/gm,'').replace(/^export /gm,'');
const tick=()=>new Promise(resolve=>setTimeout(resolve,20));

async function aboutFixture(t){
  const dom=new JSDOM(await read('skandi-embeds/about/skandi-about.html'),{url:'https://www.skanditravels.com/about',runScripts:'outside-only',pretendToBeVisual:true});
  t.after(()=>dom.window.close());
  const w=dom.window,sent=[];w.postMessage=message=>sent.push(message);
  w.eval(await read('skandi-embeds/about/skandi-about.js'));
  const receive=(type,payload={},source=w)=>w.dispatchEvent(new w.MessageEvent('message',{source,data:{source:'SKANDI_WIX_PARENT',type,payload}}));
  return {w,d:w.document,sent,receive};
}

test('About shows the published network in compact searchable groups and opens map selections',async t=>{
  const {w,d,sent,receive}=await aboutFixture(t);
  receive('ABOUT_NETWORK_DATA',{
    destinations:[{id:'new-york',name:'New York',country:'United States'},{id:'stockholm',name:'Stockholm',country:'Sweden'},{id:'gothenburg',name:'Gothenburg',country:'Sweden'}],
    airports:[],airlines:[{id:'SK',name:'SAS',partnerStatus:true},{id:'not-public',name:'Hidden airline',partnerStatus:false}],routes:[{airlines:['SK']}]
  });
  assert.equal(d.getElementById('aboutNetworkStatus').hidden,true);
  assert.equal(d.querySelectorAll('.about-airline-link').length,1);
  assert.equal(d.querySelector('.about-airline-link').textContent,'SAS');
  assert.deepEqual([...d.querySelectorAll('.about-network-country summary strong')].map(x=>x.textContent),['Sweden','United States']);
  assert.equal(d.getElementById('aboutDestinationCount').textContent,'3 destinations');
  const search=d.getElementById('aboutDestinationSearch');search.value='stock';search.dispatchEvent(new w.Event('input',{bubbles:true}));
  const item=d.querySelector('.about-destination-link');assert.equal(item.textContent,'Stockholm');
  assert.equal(new URL(item.href).searchParams.get('destination'),'stockholm');
  item.click();assert.equal(sent.at(-1).type,'ABOUT_NAVIGATE');assert.match(sent.at(-1).payload.path,/^\/destinations\?destination=stockholm$/);
  search.value='no match';search.dispatchEvent(new w.Event('input',{bubbles:true}));assert.match(d.getElementById('aboutNetworkDestinations').textContent,/No destinations match/);
  receive('SKANDI_MASTER_CONFIG',{settings:{language:'SV'},routes:{destinations:'/destinations'}});
  assert.equal(d.getElementById('aboutDestinationsHeading').textContent,'Våra destinationer');
});

test('Derived cities link back to the same map IDs even when the IDs contain colons',async t=>{
  const {d,receive}=await aboutFixture(t);
  receive('ABOUT_NETWORK_DATA',{destinations:[],airports:[{iata:'ARN',city:'Stockholm',country:'Sweden'},{iata:'BMA',city:'Stockholm',country:'Sweden'}],airlines:[],routes:[]});
  const item=d.querySelector('.about-destination-link');assert.equal(item.textContent,'Stockholm');
  const id=new URL(item.href).searchParams.get('destination');assert.equal(id,'city:stockholm:sweden');
  let ready,handler;const messages=[];const embed={onMessage:fn=>handler=fn,postMessage:message=>messages.push(message)};
  const $w=()=>embed;$w.onReady=fn=>ready=fn;
  const context=vm.createContext({...routes,$w,console,wixLocation:{query:{destination:id},onChange(){},queryParams:{add(){},remove(){}},to(){}},getPublicNetworkMapData:async()=>({destinations:[],airports:[],airlines:[],routes:[]})});
  vm.runInContext(withoutImports(await read('src/pages/Our Destinations.wfe5g.js')),context);ready();
  await handler({data:{source:'SKANDI_PUBLIC_NETWORK_MAP',type:'SKANDI_MAP_READY'}});
  assert.equal(messages[0].payload.selection.id,id);
});

test('About only links to airport-derived cities and route airlines that the map can resolve',async t=>{
  const {d,receive}=await aboutFixture(t);
  receive('ABOUT_NETWORK_DATA',{destinations:[],airports:[{iata:'ARN',airportName:'Stockholm Arlanda Airport',country:'Sweden'}],airlines:[],routes:[{airline:'INVALID'},{from:'ARN',to:'JFK',airline:'SK'}]});
  assert.equal(new URL(d.querySelector('.about-destination-link').href).searchParams.get('destination'),'city:stockholm-arlanda-airport:sweden');
  assert.deepEqual([...d.querySelectorAll('.about-airline-link')].map(link=>link.textContent),['SK']);
  receive('ABOUT_NETWORK_DATA',{destinations:[{destinationName:'No map ID'}],airports:[],airlines:[],routes:[]});
  assert.equal(d.querySelectorAll('.about-destination-link').length,0);
});

test('About reports network failures separately and retries without replacing About content',async t=>{
  const {d,sent,receive}=await aboutFixture(t);
  receive('ABOUT_NETWORK_DATA',{destinations:[{id:'unsafe',name:'<img src=x>',country:'Sweden'}],airlines:[],routes:[],airports:[]},{});
  assert.equal(d.querySelectorAll('.about-destination-link').length,0);
  receive('ABOUT_NETWORK_ERROR');assert.equal(d.getElementById('aboutNetworkRetry').hidden,false);
  assert.match(d.getElementById('aboutNetworkStatus').textContent,/temporarily unavailable/);
  d.getElementById('aboutNetworkRetry').click();assert.equal(sent.at(-1).type,'ABOUT_NETWORK_REFRESH');
  receive('ABOUT_NETWORK_DATA',{destinations:[{id:'safe',name:'<img src=x>',country:'Sweden'}],airlines:[],routes:[],airports:[]});
  assert.equal(d.querySelector('.about-destination-link').textContent,'<img src=x>');
  assert.equal(d.querySelector('.about-destination-link img'),null);
});

test('About controller loads the existing network facade independently and can retry it',async()=>{
  let onReady,onMessage,fail=true;const sent=[];
  const embed={postMessage:message=>sent.push(message),onMessage:fn=>onMessage=fn};
  const $w=()=>embed;$w.onReady=fn=>onReady=fn;
  const context=vm.createContext({...routes,$w,console,wixLocationFrontend:{to(){}},
    getPublicAboutPayload:async()=>({collection:{items:[]}}),
    getPublicNetworkMapData:async()=>{if(fail)throw Error('unavailable');return {destinations:[{id:'sto'}],airports:[],airlines:[],routes:[]};}
  });
  vm.runInContext(withoutImports(await read('src/pages/About.xcftf.js')),context);onReady();
  await onMessage({data:{source:'SKANDI_ABOUT_PAGE',type:'ABOUT_PAGE_READY',payload:{language:'EN'}}});
  assert(sent.some(item=>item.type==='ABOUT_PAGE_DATA'));assert(sent.some(item=>item.type==='ABOUT_NETWORK_ERROR'));
  fail=false;await onMessage({data:{source:'SKANDI_ABOUT_PAGE',type:'ABOUT_NETWORK_REFRESH'}});
  const result=sent.findLast(item=>item.type==='ABOUT_NETWORK_DATA');assert.equal(result.payload.destinations[0].id,'sto');
});

test('Map controls remain operable after the directory and airline chapter move',async t=>{
  const dom=new JSDOM(await read('skandi-embeds/destinations/skandi-destinations.html'),{url:'https://www.skanditravels.com/destinations',runScripts:'outside-only',pretendToBeVisual:true});
  t.after(()=>dom.window.close());const w=dom.window,d=w.document;
  w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});
  w.ResizeObserver=class{observe(){}disconnect(){}};
  class Bounds{extend(){return this}isEmpty(){return false}}
  class MapMock{
    constructor(){this.sources={};this.canvas=d.createElement('canvas')}
    addControl(){} on(type,fn){if(type==='load')setTimeout(()=>fn(),0);return this} getStyle(){return {layers:[]}}
    getSource(id){return this.sources[id]} addSource(id){this.sources[id]={setData(){}}} addLayer(){} getLayer(){return true}
    setPaintProperty(){} setLayoutProperty(){} setFeatureState(){} getCanvas(){return this.canvas} easeTo(){} fitBounds(){} resize(){} remove(){}
  }
  w.maplibregl={Map:MapMock,LngLatBounds:Bounds,AttributionControl:class{}};
  w.eval(await read('skandi-embeds/destinations/skandi-destinations.js'));
  d.dispatchEvent(new w.Event('DOMContentLoaded'));await tick();
  w.loadMapData({destinations:[{id:'sto',name:'Stockholm',country:'Sweden',latitude:59,longitude:18},{id:'nyc',name:'New York',country:'United States',latitude:40,longitude:-74}],airports:[],airlines:[],routes:[],hotels:[]});
  assert(d.querySelector('.map-interface .map-toolbar'));assert(d.querySelector('.map-interface .map-key'));
  assert.equal(d.getElementById('destinationsListPage'),null);assert.equal(d.getElementById('airlineChapter'),null);
  assert.equal(d.getElementById('networkDirectory').open,false);
  d.querySelector('[data-mode="destinations"]').click();assert.equal(d.querySelector('[data-mode="destinations"]').getAttribute('aria-pressed'),'true');
  const sweden=[...d.querySelectorAll('.region-btn')].find(button=>button.textContent==='Sweden');sweden.click();
  assert.equal([...d.querySelectorAll('.region-btn')].find(button=>button.textContent==='Sweden').getAttribute('aria-pressed'),'true');
  d.getElementById('searchOpen').click();assert(d.getElementById('searchLayer').classList.contains('open'));
  d.getElementById('searchClose').click();assert(!d.getElementById('searchLayer').classList.contains('open'));
  assert(d.getElementById('directoryGrid').querySelectorAll('button').length>=2);
});

test('Published network links remain available when the map library fails',async t=>{
  const dom=new JSDOM(await read('skandi-embeds/destinations/skandi-destinations.html'),{url:'https://www.skanditravels.com/destinations',runScripts:'outside-only',pretendToBeVisual:true});
  t.after(()=>dom.window.close());const w=dom.window,d=w.document;
  w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});
  w.eval(await read('skandi-embeds/destinations/skandi-destinations.js'));
  d.dispatchEvent(new w.Event('DOMContentLoaded'));
  w.loadMapData({destinations:[{id:'sto',name:'Stockholm',country:'Sweden'}],airports:[],airlines:[],routes:[],hotels:[]});
  assert.equal(d.querySelector('.directory-link').textContent,'Stockholm');
  assert.equal(d.getElementById('networkDirectory').open,true);
  assert.match(d.getElementById('mapStatusText').textContent,/couldn’t start/);
  assert.equal(d.getElementById('mapStatus').hidden,false);
});
