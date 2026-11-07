import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import * as routes from '../src/public/siteMap.js';

const require=createRequire(new URL('../scripts/package.json',import.meta.url));
const {JSDOM}=require('jsdom');
const {parse}=require('acorn');
const source=name=>fs.readFile(new URL('../'+name,import.meta.url),'utf8');
const withoutImports=code=>code.replace(/^import .+;$/gm,'').replace(/^export /gm,'');

test('Inventory structured editors preserve nested values instead of serializing them',async()=>{
  const text=await source('altea-embeds/inventory-control/skandi-inventory-control.js');
  const tree=parse(text,{ecmaVersion:'latest',sourceType:'module'});
  const names=['parseStructuredInput','normalizeStructuredRows'];
  const code=names.map(name=>{const n=tree.body.find(x=>x.type==='FunctionDeclaration'&&x.id.name===name);assert.ok(n);return text.slice(n.start,n.end)}).join('\n');
  const context=vm.createContext({JSON});
  vm.runInContext(`${code}\nthis.inspect={parseStructuredInput,normalizeStructuredRows}`,context);
  assert.equal(context.inspect.parseStructuredInput('[{"month":"July"}]')[0].month,'July');
  const rows=context.inspect.normalizeStructuredRows({first:{text:'hello'}},[{path:'name'},{path:'description'}]);
  assert.equal(rows[0].description.text,'hello');
  assert.equal(typeof rows[0].description,'object');
});

test('hotel projection keeps localised details, images, units and assigned airport',async()=>{
  const airport={id:'airport-1',entityType:'AIRPORT',code:'ARN',name:'Arlanda',details:{}};
  const h={id:'hotel-1',entityType:'HOTEL',name:'Hotel One',details:{nearestAirportId:'airport-1',providerAccommodationId:'acc_123',distanceToBeach:1.5,address:{line1:'Main St 2',line2:'Floor 1'},postalCode:'123',city:'Town',facilities:['Wi-Fi','Pool'],boardOptions:['Breakfast'],checkinTime:'15:00',checkoutTime:'11:00',petsAllowed:false,rooms:[{code:'STD',name:'Standard',roomType:'City view',description:'A quiet room',maxGuests:2}]},localized:[{language:'EN',highlights:['Central'],included:['Breakfast'],notIncluded:['Parking']}],media:[{url:'https://example.com/hotel.jpg',role:'HERO',altText:'Front',caption:'The hotel'}]};
  const context=vm.createContext({...routes,URLSearchParams});
  vm.runInContext(withoutImports(await source('src/public/destinationContent.js')),context);
  const page=context.createDestinationContent(()=>[h,airport]).hotelPage(h,'EN');
  assert.equal(page.flightsAvailable,true);
  assert.equal(page.locationTransfer.beachDistance,'1.5 km');
  assert.equal(page.locationTransfer.address,'Main St 2, Floor 1, 123, Town');
  assert.equal(page.highlights[0],'Central');
  assert.equal(page.facilities[1],'Pool');
  assert.equal(page.policies.petsAllowed,false);
  assert.equal(page.rooms[0].roomType,'City view');
  assert.equal(page.galleryMedia[0].alt,'Front');
});

test('hotel page renders structured content as readable labelled details',async t=>{
  const base='skandi-embeds/hotel-list/skandi-hotel-list';
  const dom=new JSDOM(await source(base+'.html'),{runScripts:'outside-only',url:'https://example.test'});t.after(()=>dom.window.close());
  const w=dom.window,sent=[];w.postMessage=message=>sent.push(message);w.eval(await source(base+'.js'));
  const page={id:'h-1',name:'Hotel One',bookable:false,summary:'A stay',about:'A place',gallery:['https://example.com/h.jpg'],galleryMedia:[{url:'https://example.com/h.jpg',alt:'Hotel front',caption:'Entrance'}],facilities:['FREE_WIFI','Pool'],policies:{petsAllowed:false,checkIn:'15:00'},included:['Breakfast'],notIncluded:['Parking'],highlights:['Central'],rooms:[{name:'Standard',roomType:'City view',description:'A quiet room'}],food:{breakfast:'{"description":"Buffet"}'},locationTransfer:{beachDistance:'1.5 km'}};
  w.dispatchEvent(new w.MessageEvent('message',{source:w,data:{source:'SKANDI_WIX_PARENT',type:'HOTEL_DETAIL_DATA',requestId:sent.at(-1).requestId,payload:{page,routes:{...routes.SITE_MAP,...routes.APP_ROUTES}}}}));
  const detail=w.document.getElementById('hotelDetail');
  assert.match(detail.textContent,/Buffet/);assert.match(detail.textContent,/Pets allowedNo/);
  assert.match(detail.textContent,/Not included/);assert.match(detail.textContent,/1.5 km/);
  assert.ok(!detail.textContent.includes('[object Object]'));assert.ok(!detail.textContent.includes('{"description"'));
  assert.equal(detail.querySelector('.hs-gallery img').alt,'Hotel front');
  assert.match(detail.querySelector('.hs-room summary').textContent,/Standard/);
});

test('Travel Info receives public hotel details and omits operational fields',async()=>{
  const master={id:'h-1',entity_type:'HOTEL',name:'Hotel One',details:{facilities:['Pool','FREE_WIFI'],rooms:[{name:'Standard',description:'Comfortable',internalNotes:'private'}],checkinTime:'15:00',petsAllowed:false,internalNotes:'private'},localized:[{language:'EN',shortDescription:'A stay',highlights:['Central'],included:['Breakfast']},{language:'SV',shortDescription:''}],media:[]};
  const restRequest=async({table})=>table==='inventory_public_entities_v'?[master]:[];
  const ctx=vm.createContext({restRequest,URLSearchParams});vm.runInContext(withoutImports(await source('src/backend/SKANDI_CORE/publicContentInventoryProjection.js')),ctx);
  const out=await ctx.applyInventoryAuthorityToTravelInfoCore({language:'SV',airlines:[],airports:[]});
  const hotel=out.hotels[0];
  assert.equal(hotel.summary,'A stay');assert.equal(hotel.sections.facilities.body[0],'Pool');assert.equal(hotel.sections.facilities.body[1],'FREE WIFI');
  assert.equal(hotel.sections.policies.body['Pets allowed'],false);
  assert.equal(hotel.sections.rooms.body[0].name,'Standard');
  assert.equal(hotel.sections.rooms.body[0].internalNotes,undefined);
  assert.equal(hotel.internalNotes,undefined);
  assert.match(hotel.path,/hotelId=h-1/);
});
