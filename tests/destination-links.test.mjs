import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import * as routes from '../src/public/siteMap.js';
import { inventoryCardImage } from '../src/public/inventoryMedia.js';

const require = createRequire(new URL('../scripts/package.json', import.meta.url));
const { JSDOM } = require('jsdom');
const source = name => fs.readFile(new URL('../'+name, import.meta.url), 'utf8');
const withoutImports = code => code.replace(/^import .+;$/gm, '').replace(/^export /gm, '');

test('hotel and destination links resolve to their dedicated public pages', async () => {
  const h = { id:'hotel-1', entityType:'HOTEL', slug:'lake-house', name:'Lake House', details:{} };
  const c = { id:'sweden', entityType:'COUNTRY', slug:'sweden', name:'Sweden', details:{latitude:62,longitude:15} };
  const place = { id:'stockholm', parentEntityId:c.id, entityType:'DESTINATION', slug:'stockholm', name:'Stockholm', details:{latitude:59.3,longitude:18.1} };
  const context = vm.createContext({ ...routes, inventoryCardImage, URLSearchParams });
  vm.runInContext(withoutImports(await source('src/public/destinationContent.js')), context);
  const content = context.createDestinationContent(()=>[h,c,place]);
  assert.equal(content.previewHotel(h).bookable,false);
  assert.equal(content.previewHotel(h).path,'/destinations/explore/hotel-list?hotel=lake-house&hotelId=hotel-1&view=hotel');
  assert.equal(routes.resolveBuildRoute(content.previewHotel(h).path).key,'hotelList');
  const data = content.countryPage(c,'EN');
  assert.equal(data.map.places[0].latitude,59.3);
  assert.equal(data.map.places[0].path,'/destinations/explore/hotel-list?country=sweden&destination=stockholm&view=hotels');
});

test('map data keeps airports and airlines and Wix receives a stable pin URL', async () => {
  const map = { airports:[{id:'ARN'}], airlines:[{id:'SK'}], destinations:[] };
  const core = vm.createContext({ ...routes, URLSearchParams, callPublicContentRpc:async()=>map, getDestinationFlowCatalogCore:async()=>({ok:true,records:[]}) });
  vm.runInContext(withoutImports(await source('src/public/destinationContent.js')),core);
  vm.runInContext(withoutImports(await source('src/backend/SKANDI_CORE/networkMap.js')),core);
  const messages=[], urlChanges=[];
  let onMessage, onReady, onChange;
  const mapHtml={ onMessage:cb=>{onMessage=cb;}, postMessage:message=>messages.push(message) };
  const $w=()=>mapHtml;
  $w.onReady=cb=>{onReady=cb;};
  const wixLocation={
    query:{pin:'airport:ARN'}, onChange:cb=>{onChange=cb;}, to:path=>urlChanges.push(path),
    queryParams:{add:query=>urlChanges.push(query.pin),remove:()=>{}}
  };
  const context=vm.createContext({ ...routes,$w,wixLocation,console,URLSearchParams,getPublicNetworkMapData:core.getPublicNetworkMapDataCore });
  vm.runInContext(withoutImports(await source('src/pages/Our Destinations.wfe5g.js')), context);
  onReady();
  const send = data=>onMessage({data:{source:'SKANDI_PUBLIC_NETWORK_MAP',...data}});
  await send({type:'SKANDI_MAP_READY'});
  assert.equal(messages[0].payload.selection.id,'ARN');
  assert.equal(messages[0].payload.airports[0].id,'ARN');
  assert.equal(messages[0].payload.airlines[0].id,'SK');
  await send({type:'SKANDI_MAP_STATE',state:{type:'destination',id:'stockholm'}});
  await send({type:'SKANDI_MAP_STATE',state:{type:'destination',id:'city:stockholm:sweden'}});
  await send({type:'SKANDI_MAP_NAVIGATE',url:'/destinations/explore/hotel-list?hotelId=hotel-1'});
  assert.deepEqual(urlChanges,['destination:stockholm','destination:city:stockholm:sweden','/destinations/explore/hotel-list?hotelId=hotel-1']);
  wixLocation.query={pin:'destination:city:stockholm:sweden'};
  onChange();
  assert.equal(messages.at(-1).type,'SKANDI_MAP_SELECTION');
  assert.equal(messages.at(-1).payload.id,'city:stockholm:sweden');
  wixLocation.query={country:'sweden',destination:'stockholm'};
  onReady();
  assert.equal(urlChanges.at(-1),'/destinations/explore?country=sweden&destination=stockholm');
});

test('Hotel List links directly to an unlinked property and its detail blocks booking', async t => {
  const base='skandi-embeds/hotel-list/skandi-hotel-list';
  const dom=new JSDOM(await source(base+'.html'),{runScripts:'outside-only',url:'https://example.test'});
  t.after(()=>dom.window.close());
  const w=dom.window, sent=[];
  w.postMessage=message=>sent.push(message);
  w.eval(await source(base+'.js'));
  const hotel={id:'h-1',name:'Lake House',bookable:false,summary:'On the lake',path:routes.APP_ROUTES.hotelList+'?hotelId=h-1'};
  const send=(type,page)=>{
    w.dispatchEvent(new w.MessageEvent('message',{source:w,data:{source:'SKANDI_WIX_PARENT',type,
      requestId:sent.at(-1).requestId,payload:{page,routes:{...routes.SITE_MAP,...routes.APP_ROUTES}}}}));
  };
  send('HOTEL_SEARCH_PAGE_RESULT',{previewHotels:[hotel]});
  assert.match(w.document.querySelector('#hotelCards a').href,/hotel-list\?hotelId=h-1$/);
  w.document.getElementById('hotelRetry').click();
  send('HOTEL_DETAIL_DATA',hotel);
  assert.equal(w.document.getElementById('hotelTitle').textContent,'Lake House');
  assert.equal(w.document.getElementById('hotelBook').disabled,true);
  assert.equal(w.document.getElementById('hotelUnavailable').hidden,false);
});

test('a retained Wix hotel embed opens a property even when the link emits no location event', async t => {
  const base='skandi-embeds/hotel-list/skandi-hotel-list';
  const dom=new JSDOM(await source(base+'.html'),{runScripts:'outside-only',url:'https://example.test'});
  t.after(()=>dom.window.close());
  const w=dom.window;
  const listQuery={country:'sweden',destination:'stockholm',view:'hotels'};
  const listPath=routes.APP_ROUTES.hotelList;
  const place={id:'sto',name:'Stockholm',entityType:'DESTINATION',parentEntityId:'se'};
  const records=[
    {id:'se',name:'Sweden',entityType:'COUNTRY'},place,
    {id:'scc',name:'Scandic Continental',entityType:'HOTEL',parentEntityId:place.id,details:{summary:'Beside Stockholm Central Station.'}}
  ];
  let receive,change,navigated;
  const messages=[], requests=[];
  const wixLocation={
    query:listQuery,
    onChange:fn=>{change=fn;},
    to:path=>{navigated=new URL(path,'https://example.test');}
  };
  const embed={
    id:'hotelsEmbed',onMessage:fn=>{receive=fn;},
    postMessage:data=>{messages.push(data);w.dispatchEvent(new w.MessageEvent('message',{source:w,data}));}
  };
  const context=vm.createContext({...routes,wixLocation,URLSearchParams,URL,inventoryCardImage,setTimeout,clearTimeout,
    getDestinationFlowCatalog:async()=>({ok:true,records})});
  vm.runInContext(withoutImports(await source('src/public/destinationContent.js')),context);
  vm.runInContext(withoutImports(await source('src/public/destinationFlowBridge.js')),context);
  context.bindDestinationFlow(()=>embed,'hotels',{embedId:'#hotelsEmbed',sources:['SKANDI_AREA_HOTEL_SEARCH']});
  const send=data=>receive({data:{source:'SKANDI_AREA_HOTEL_SEARCH',...data}});
  w.postMessage=data=>requests.push(send(data));
  w.eval(await source(base+'.js'));
  await Promise.all(requests.splice(0));
  const title=w.document.getElementById('hotelTitle');
  assert.equal(title.textContent,'Hotels in Stockholm');
  const link=w.document.querySelector('#hotelCards a').dataset.path;
  await send({type:'HOTEL_SEARCH_NAVIGATE',payload:{path:link}});
  await Promise.all(requests.splice(0));
  assert.equal(title.textContent,'Scandic Continental');
  assert.equal(w.document.getElementById('hotelDirectory').hidden,true);
  assert.equal(messages.at(-1).type,'HOTEL_DETAIL_DATA');
  assert.equal(navigated.searchParams.get('hotelId'),'scc');
  const openedMessages=messages.length;
  change({path:listPath.slice(1).split('/'),query:Object.fromEntries(navigated.searchParams)});
  assert.equal(messages.length,openedMessages);
  change({path:listPath.slice(1).split('/'),query:listQuery});
  await Promise.all(requests.splice(0));
  assert.equal(title.textContent,'Hotels in Stockholm');
  assert.equal(w.document.getElementById('hotelDirectory').hidden,false);
  assert.equal(w.document.querySelector('#hotelCards a').dataset.path,link);
  const count=messages.length;
  change({path:listPath.slice(1).split('/'),query:{...listQuery,ref:'campaign'}});
  assert.equal(messages.length,count);
});


test('geography links narrow descendants through region and area, including existing details',async()=>{
 const records=[{id:'us',entityType:'COUNTRY',name:'United States'}, {id:'fl',entityType:'REGION',name:'Florida',parentEntityId:'us'}, {id:'orl',entityType:'DESTINATION',name:'Orlando',parentEntityId:'fl'}, {id:'disney',entityType:'AREA',name:'Disney Area',parentEntityId:'orl'}, {id:'hotel',entityType:'HOTEL',name:'Hotel',details:{areaId:'disney'}}];
 const context=vm.createContext({...routes,inventoryCardImage,URLSearchParams});vm.runInContext(withoutImports(await source('src/public/destinationContent.js')),context);
 const c=context.createDestinationContent(()=>records);const hotel=records.at(-1);
 for(const ancestor of records.slice(0,4))assert.equal(c.isUnder(hotel,ancestor),true,ancestor.name);
 assert.equal(c.regionOf(hotel).name,'Florida');assert.equal(c.countryOf(hotel).name,'United States');
 assert.equal(c.hotelsForScope(records[1])[0].id,'hotel');
 assert.equal(c.countryPage(records[0],'EN').regions[0].path,'/destinations/explore?country=united-states&region=florida');
 const scoped=c.countryPage(records[3],'EN');
 assert.equal(scoped.paths.hotels,'/destinations/explore/hotel-list?country=united-states&region=florida&destination=orlando&area=disney-area&view=hotels');
 assert.deepEqual(Array.from(scoped.breadcrumbs,item=>item.name),['United States','Florida','Orlando','Disney Area']);
 assert.equal(c.resolveGeography({countrySlug:'united-states',regionSlug:'florida',areaSlug:'disney-area'}).id,'disney');
 assert.equal(c.resolveGeography({countrySlug:'sweden',regionSlug:'florida'}),undefined);
 assert.equal(c.hotelListPage('united-states','','','EN','florida').previewHotels[0].id,'hotel');
});

test('Explore resolves optional levels, canonical hotel links and older Florida links',async()=>{
 const records=[
  {id:'us',entityType:'COUNTRY',name:'United States'},
  {id:'fl',entityType:'STATE',name:'Florida',parentEntityId:'us'},
  {id:'cf',entityType:'REGION',name:'Central Florida',parentEntityId:'fl'},
  {id:'or',entityType:'CITY',name:'Orlando',parentEntityId:'cf'},
  {id:'mi',entityType:'CITY',name:'Miami',parentEntityId:'fl'},
  {id:'dw',entityType:'AREA',name:'Disney World',parentEntityId:'or'},
  {id:'hotel',entityType:'HOTEL',name:'Disney Hotel',parentEntityId:'dw',details:{destinationId:'or',regionId:'fl'}}
 ];
 const context=vm.createContext({...routes,inventoryCardImage,URLSearchParams});
 vm.runInContext(withoutImports(await source('src/public/destinationContent.js')),context);
 const content=context.createDestinationContent(()=>records);
 const old=content.resolveGeography({countrySlug:'united-states',regionSlug:'florida',destinationSlug:'orlando',areaSlug:'disney-world'});
 assert.equal(old.id,'dw');
 assert.equal(content.countryPage(records[0],'EN').regions[0].path,'/destinations/explore?country=united-states&state=florida');
 assert.deepEqual(Array.from(content.countryPage(records[1],'EN').regions,item=>item.name),['Central Florida','Miami']);
 assert.deepEqual(Array.from(content.breadcrumbsFor(records.at(-1)),item=>item.name),['United States','Florida','Central Florida','Orlando','Disney World']);
 assert.equal(content.previewHotel(records.at(-1)).path,'/destinations/explore/hotel-list?country=united-states&state=florida&region=central-florida&city=orlando&area=disney-world&hotel=disney-hotel&hotelId=hotel&view=hotel');
 assert.equal(content.hotelListPage('united-states','','','EN','central-florida','florida','orlando').previewHotels[0].name,'Disney Hotel');
 assert.equal(content.resolveGeography({stateSlug:'florida',regionSlug:'central-florida',citySlug:'miami'}),undefined);
});
