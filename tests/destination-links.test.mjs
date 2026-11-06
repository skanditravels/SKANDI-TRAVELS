import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import * as routes from '../src/public/siteMap.js';

const require = createRequire(new URL('../scripts/package.json', import.meta.url));
const { JSDOM } = require('jsdom');
const source = name => fs.readFile(new URL('../'+name, import.meta.url), 'utf8');
const withoutImports = code => code.replace(/^import .+;$/gm, '').replace(/^export /gm, '');

test('hotel and destination links resolve to their dedicated public pages', async () => {
  const h = { id:'hotel-1', entityType:'HOTEL', slug:'lake-house', name:'Lake House', details:{} };
  const c = { id:'sweden', entityType:'COUNTRY', slug:'sweden', name:'Sweden', details:{latitude:62,longitude:15} };
  const place = { id:'stockholm', parentEntityId:c.id, entityType:'DESTINATION', slug:'stockholm', name:'Stockholm', details:{latitude:59.3,longitude:18.1} };
  const context = vm.createContext({ ...routes, URLSearchParams });
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
  const core = vm.createContext({ callPublicContentRpc:async()=>map });
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
  const context=vm.createContext({ ...routes,$w,wixLocation,console,getPublicNetworkMapData:core.getPublicNetworkMapDataCore });
  vm.runInContext(withoutImports(await source('src/pages/Our Destinations.wfe5g.js')), context);
  onReady();
  const send = data=>onMessage({data:{source:'SKANDI_PUBLIC_NETWORK_MAP',...data}});
  await send({type:'SKANDI_MAP_READY'});
  assert.equal(messages[0].payload.selection.id,'ARN');
  assert.equal(messages[0].payload.airports[0].id,'ARN');
  assert.equal(messages[0].payload.airlines[0].id,'SK');
  await send({type:'SKANDI_MAP_STATE',state:{type:'destination',id:'stockholm'}});
  await send({type:'SKANDI_MAP_NAVIGATE',url:'/destinations/explore/hotel-list?hotelId=hotel-1'});
  assert.deepEqual(urlChanges,['destination:stockholm','/destinations/explore/hotel-list?hotelId=hotel-1']);
  onChange();
  assert.equal(messages.at(-1).type,'SKANDI_MAP_SELECTION');
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
