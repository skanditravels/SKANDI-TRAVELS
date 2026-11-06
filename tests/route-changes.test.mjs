import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import * as routes from '../src/public/siteMap.js';
const require=createRequire(new URL('../scripts/package.json',import.meta.url));
const {parse}=require('acorn');
const {JSDOM,VirtualConsole}=require('jsdom');

test('canonical merged routes and transfers resolve to their intended pages',()=>{
  assert.equal(routes.SITE_MAP.tours,'/tours-activities');
  assert.equal(routes.SITE_MAP.activities,routes.SITE_MAP.tours);
  assert.equal(routes.SITE_MAP.ourNetwork,routes.SITE_MAP.destinations);
  assert.equal(routes.SITE_MAP.transfers,'/travel-info?section=transfers');
  assert.equal(routes.resolveBuildRoute(routes.SITE_MAP.transfers).key,'travelInfo');
});

test('airport actions preserve the transfer section when adding airport information',async()=>{
  for(const filename of ['Travel Info.m43d6.js','Flight Status.cn7ah.js']) {
    let source=await fs.readFile(new URL('../src/pages/'+filename,import.meta.url),'utf8');
    for(const node of parse(source,{ecmaVersion:'latest',sourceType:'module'}).body.filter(n=>n.type==='ImportDeclaration').reverse())source=source.slice(0,node.start)+source.slice(node.end);
    const c={URLSearchParams,console,setTimeout,clearTimeout,$w:{onReady:()=>{}},wixLocationFrontend:{query:{}},SITE_MAP:routes.SITE_MAP,APP_ROUTES:routes.APP_ROUTES};
    vm.createContext(c);vm.runInContext(source+'\nglobalThis.makeRoute=routeWithQuery;',c);
    assert.equal(c.makeRoute(routes.SITE_MAP.transfers,{airport:'JFK'}),'/travel-info?section=transfers&airport=JFK');
  }
});

test('travel information opens the transfer directory when the page controller requests it',async t=>{
  const html=await fs.readFile(new URL('../skandi-embeds/travel-info/skandi-travel-info.html',import.meta.url),'utf8');
  const js=await fs.readFile(new URL('../skandi-embeds/travel-info/skandi-travel-info.js',import.meta.url),'utf8');
  const dom=new JSDOM(html,{runScripts:'outside-only',url:'https://example.test',virtualConsole:new VirtualConsole()});t.after(()=>dom.window.close());
  const w=dom.window;w.matchMedia=()=>({matches:false});w.HTMLElement.prototype.scrollIntoView=function(){};w.requestAnimationFrame=cb=>w.setTimeout(cb,0);
  w.eval(js);
  w.dispatchEvent(new w.MessageEvent('message',{data:{source:'SKANDI_WIX_PARENT',type:'TRAVEL_INFO_DATA',payload:{initialSection:'transfers'}}}));
  assert.match(w.document.getElementById('tiDirectoryHeading').textContent,/Transfer Information/);
  assert.equal(w.document.querySelector('[data-filter="transfers"]').getAttribute('aria-pressed'),'true');
});

test('Explore renders the selected country even when Wix keeps the current page mounted',async()=>{
  let source=await fs.readFile(new URL('../src/pages/Explore.nxtpn.js',import.meta.url),'utf8');
  for(const node of parse(source,{ecmaVersion:'latest',sourceType:'module'}).body.filter(n=>n.type==='ImportDeclaration').reverse()) {
    source=source.slice(0,node.start)+source.slice(node.end);
  }
  const records=[{id:'gr',slug:'greece',name:'Greece'},{id:'se',slug:'sweden',name:'Sweden'}];
  const posted=[],navigated=[];
  const context={
    ...routes,console,setTimeout,clearTimeout,$w:{onReady:()=>{}},
    wixLocationFrontend:{query:{country:'greece'},to:path=>navigated.push(path)},
    getDestinationFlowCatalog:async()=>({ok:true,records}),
    createDestinationContent:()=>({
      records:()=>records,byTypeSlug:(_,slug)=>records.find(row=>row.slug===slug),
      countryPage:record=>({...record}),isUnder:()=>false,airportDirectory:()=>[]
    })
  };
  vm.createContext(context);vm.runInContext(source,context);
  const embed={id:'exploreEmbed',postMessage:message=>posted.push(message)};
  await context.receive({data:{source:'SKANDI_DYNAMIC_COUNTRY_PAGE',type:'COUNTRY_READY',requestId:'ready'}},embed);
  await context.receive({data:{source:'SKANDI_DYNAMIC_COUNTRY_PAGE',type:'COUNTRY_SELECT_COUNTRY',requestId:'select',payload:{slug:'sweden'}}},embed);
  assert.equal(posted.at(-1).requestId,'select');
  assert.equal(posted.at(-1).payload.page.name,'Sweden');
  assert.deepEqual(navigated,['/destinations/explore?country=sweden']);
});
