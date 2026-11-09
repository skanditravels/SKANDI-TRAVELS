import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {formatFlightPlaces} from '../src/public/flightPlaces.js';

const require=createRequire(new URL('../scripts/package.json',import.meta.url));
const {JSDOM}=require('jsdom');
const {parse}=require('acorn');
const read=path=>fs.readFile(new URL('../'+path,import.meta.url),'utf8');
const functionSource=(code,name)=>{const ast=parse(code,{ecmaVersion:'latest',sourceType:'module'});const node=ast.body.map(n=>n.type==='ExportNamedDeclaration'?n.declaration:n).find(n=>n?.type==='FunctionDeclaration'&&n.id.name===name);assert(node,`Missing ${name}`);return code.slice(node.start,node.end)};
const city={placeType:'city',name:'Stockholm',cityName:'Stockholm',iataCode:'STO',iataCityCode:'STO',iataCountryCode:'SE',airports:[{name:'Stockholm Arlanda Airport',iataCode:'ARN',icaoCode:'ESSA'},{name:'Stockholm Bromma Airport',iataCode:'BMA',icaoCode:'ESSB'}]};
const airport={placeType:'airport',name:'Stockholm Arlanda Airport',cityName:'Stockholm',iataCode:'ARN',iataCityCode:'STO',icaoCode:'ESSA',iataCountryCode:'SE'};

test('city and airport suggestions show distinct provider codes and helpful searchable details',()=>{
  const result=formatFlightPlaces([city,airport]);
  assert.deepEqual(result.map(x=>[x.type,x.value,x.label]),[['CITY','STO','Stockholm (STO)'],['AIRPORT','ARN','Stockholm Arlanda Airport (ARN)']]);
  for(const text of ['Sweden','Scandinavia','Stockholm','ESSA','ARN','STO'])assert.match(result[1].subtitle,new RegExp(text));
  assert.equal(formatFlightPlaces([{...airport,name:'Arlanda'}])[0].label,'Stockholm – Arlanda Airport (ARN)');
  assert.equal(formatFlightPlaces([{...city,airports:city.airports.slice(0,1)}]).length,0);
});

test('existing airport metadata preserves verified city and ICAO codes in Home content',async()=>{
  const source=await read('src/backend/SKANDI_CORE/homeContent.js');const ctx=vm.createContext({obj:x=>x||{},upper:(x,n)=>String(x||'').toUpperCase().slice(0,n),clean:(x,n)=>String(x||'').slice(0,n)});
  vm.runInContext(functionSource(source,'airportDto')+';this.run=airportDto;',ctx);
  const airport=ctx.run({id:'arn',code:'ARN',name:'Stockholm Arlanda Airport',details:{city:'Stockholm',icaoCode:'ESSA',duffel:{iataCityCode:'STO'},country:'Sweden'}});
  assert.equal(airport.iata,'ARN');assert.equal(airport.icao,'ESSA');assert.equal(airport.cityCode,'STO');
});

test('Home flight search selects a provider city and airport with their types intact',async t=>{
  const outer=new JSDOM('<!doctype html><iframe></iframe>',{runScripts:'outside-only',url:'https://www.skanditravels.com/',pretendToBeVisual:true});t.after(()=>outer.window.close());
  const w=outer.window.document.querySelector('iframe').contentWindow,doc=w.document,sent=[];w.scrollTo=()=>{};outer.window.postMessage=message=>sent.push(message);
  doc.body.innerHTML=await read('skandi-embeds/home/skandi-home.html');w.eval(await read('skandi-embeds/home/skandi-home.js'));
  const from=doc.getElementById('from');from.focus();from.value='Stockholm';from.dispatchEvent(new w.Event('input',{bubbles:true}));
  await new Promise(resolve=>setTimeout(resolve,400));const request=sent.find(x=>x.type==='HOME_FLIGHT_PLACES_QUERY');assert(request);
  w.dispatchEvent(new w.MessageEvent('message',{source:outer.window,data:{source:'SKANDI_WIX_PARENT',type:'HOME_FLIGHT_PLACES_RESULT',requestId:request.requestId,payload:{inputId:'from',query:'Stockholm',items:formatFlightPlaces([city,airport])}}}));
  const options=[...doc.querySelectorAll('#fromSuggestions .airport-option')];assert(options.some(x=>x.textContent.includes('Stockholm (STO)')));assert(options.some(x=>x.textContent.includes('ESSA')));
  options.find(x=>x.textContent.includes('Stockholm (STO)')).click();assert.equal(doc.getElementById('fromIata').value,'STO');assert.equal(from.dataset.placeType,'CITY');
});

test('Flights search ignores stale place responses and passes selected city types to booking',async t=>{
  const dom=new JSDOM(await read('skandi-embeds/flights/skandi-flights.html'),{runScripts:'outside-only',url:'https://embed.example/',pretendToBeVisual:true});t.after(()=>dom.window.close());
  const w=dom.window,doc=w.document,sent=[];w.postMessage=message=>sent.push(message);w.eval(await read('skandi-embeds/flights/skandi-flights.js'));
  const ready=sent.find(x=>x.type==='FLIGHTS_READY');const deliver=(type,payload,requestId)=>w.dispatchEvent(new w.MessageEvent('message',{source:w,data:{source:'SKANDI_WIX_PARENT',type,payload,requestId}}));
  deliver('FLIGHTS_CONTENT',{airports:[{iata:'JFK',city:'New York',name:'Kennedy'}],destinations:[],offers:[]},ready.requestId);
  const from=doc.getElementById('flight-from');from.focus();from.value='Stock';from.dispatchEvent(new w.Event('input',{bubbles:true}));await new Promise(resolve=>setTimeout(resolve,400));const old=sent.find(x=>x.type==='FLIGHTS_PLACES_QUERY');
  from.value='Stockholm';from.dispatchEvent(new w.Event('input',{bubbles:true}));await new Promise(resolve=>setTimeout(resolve,400));const current=sent.filter(x=>x.type==='FLIGHTS_PLACES_QUERY').at(-1);
  deliver('FLIGHTS_PLACES_RESULT',{inputId:'flight-from',query:'Stock',items:formatFlightPlaces([airport])},old.requestId);
  assert.doesNotMatch(doc.getElementById('flight-from-list').textContent,/Arlanda/);
  deliver('FLIGHTS_PLACES_RESULT',{inputId:'flight-from',query:'Stockholm',items:formatFlightPlaces([city,airport])},current.requestId);
  [...doc.querySelectorAll('#flight-from-list [data-index]')].find(x=>x.textContent.includes('Stockholm (STO)')).click();
  const to=doc.getElementById('flight-to');to.value='JFK';to.dispatchEvent(new w.Event('input',{bubbles:true}));doc.querySelector('#flight-to-list [data-index]').click();doc.getElementById('flight-submit').click();
  const search=sent.find(x=>x.type==='FLIGHTS_SEARCH').payload.search;assert.equal(search.origin,'STO');assert.equal(search.originType,'CITY');assert.equal(search.destination,'JFK');assert.equal(search.destinationType,'AIRPORT');
});

test('Home and Flights hosts return correlated provider suggestions only for their flight fields',async()=>{
  const home=await read('src/pages/Home.n73w8.js'),homeReplies=[];
  const homeCtx=vm.createContext({obj:x=>x||{},clean:(x,n)=>String(x||'').trim().slice(0,n),boundedRead:x=>x,searchDuffelPlaces:async()=>({items:[city,airport]}),formatFlightPlaces,postToHtml:(html,type,payload,id)=>homeReplies.push({type,payload,id})});
  vm.runInContext(functionSource(home,'handleHomeMessage')+';this.run=handleHomeMessage;',homeCtx);
  await homeCtx.run({}, {type:'HOME_FLIGHT_PLACES_QUERY',requestId:'h1',payload:{inputId:'from',query:'Stockholm'}});
  assert.equal(homeReplies[0].id,'h1');assert.equal(homeReplies[0].payload.items[0].iata,'STO');
  await homeCtx.run({}, {type:'HOME_FLIGHT_PLACES_QUERY',requestId:'h2',payload:{inputId:'other',query:'Stockholm'}});assert.equal(homeReplies.length,1);
  let source=await read('src/public/flightsPageHost.js');const ast=parse(source,{ecmaVersion:'latest',sourceType:'module'});for(const node of ast.body.filter(n=>n.type==='ImportDeclaration').reverse())source=source.slice(0,node.start)+source.slice(node.end);source=source.replace(/export function /g,'function ');
  const replies=[],context=vm.createContext({setTimeout,clearTimeout,searchDuffelPlaces:async()=>({items:[city,airport]}),formatFlightPlaces});vm.runInContext(source+';this.factory=createFlightsPageHost;',context);
  const host=context.factory({post:(type,payload,id)=>replies.push({type,payload,id}),navigate(){},settings:()=>({})});
  await host({type:'FLIGHTS_PLACES_QUERY',requestId:'f1',payload:{inputId:'flight-from',query:'Stockholm'}});assert.equal(replies[0].type,'FLIGHTS_PLACES_RESULT');assert.equal(replies[0].id,'f1');assert.equal(replies[0].payload.items[0].iata,'STO');
});

test('an airport selected by its exact code cannot be replaced by another airport in the same city',async()=>{
  const code=await read('src/backend/SKANDI_CORE/bookingMapper.js');
  const functions=['placeMatches','assertOfferMatchesSearch'].map(name=>functionSource(code,name)).join('\n');
  const upper=(x,n)=>String(x||'').trim().toUpperCase().slice(0,n),ctx=vm.createContext({upper,arr:x=>Array.isArray(x)?x:[],bookingError:(code,message)=>Object.assign(new Error(message),{code})});
  vm.runInContext(functions+';this.check=assertOfferMatchesSearch;',ctx);
  const offer={slices:[{origin:{iataCode:'BUR',iataCityCode:'LAX'},destination:{iataCode:'JFK',iataCityCode:'NYC'},segments:[{departingAt:'2027-03-01T08:00:00'}]}]};
  const slice={origin:'LAX',destination:'JFK',originType:'CITY',destinationType:'AIRPORT',departureDate:'2027-03-01'};
  assert.equal(ctx.check(offer,{slices:[slice]}),true);
  assert.throws(()=>ctx.check(offer,{slices:[{...slice,originType:'AIRPORT'}]}),/route changed/i);
  assert.throws(()=>ctx.check(offer,{slices:[{...slice,destination:'LGA'}]}),/route changed/i);
  const citySlice={slices:[{origin:{iataCode:'LAX',type:'city'},destination:{iataCode:'JFK'},segments:[{origin:{iataCode:'BUR',iataCityCode:'LAX'},destination:{iataCode:'JFK'},departingAt:'2027-03-01T08:00:00'}]}]};
  assert.throws(()=>ctx.check(citySlice,{slices:[{...slice,originType:'AIRPORT'}]}),/route changed/i);
});

test('outbound and return search retain the selected city and airport types',async()=>{
  const source=await read('src/backend/SKANDI_CORE/bookingMapper.js');
  const ctx=vm.createContext({record:x=>x||{},arr:x=>Array.isArray(x)?x:[],iata:x=>String(x).toUpperCase(),isoDate:x=>x,upper:(x,n)=>String(x||'').toUpperCase().slice(0,n),lower:(x,n)=>String(x||'').toLowerCase().slice(0,n),CABINS:new Set(['economy']),bookingError:(c,m)=>new Error(m)});
  vm.runInContext(functionSource(source,'toDuffelOfferSearch')+';this.run=toDuffelOfferSearch;',ctx);
  const result=ctx.run({origin:'STO',originType:'CITY',destination:'JFK',destinationType:'AIRPORT',departureDate:'2027-03-01',returnDate:'2027-03-08',adults:1});
  assert.equal(result.searchContext.slices[0].originType,'CITY');assert.equal(result.searchContext.slices[0].destinationType,'AIRPORT');
  assert.equal(result.searchContext.slices[1].originType,'AIRPORT');assert.equal(result.searchContext.slices[1].destinationType,'CITY');
});

async function bookingFrame(t){
  const outer=new JSDOM('<!doctype html><iframe></iframe>',{runScripts:'outside-only',url:'https://www.skanditravels.com/'});t.after(()=>outer.window.close());
  const w=outer.window.document.querySelector('iframe').contentWindow;w.scrollTo=()=>{};w.document.body.innerHTML=await read('skandi-embeds/booking/skandi-booking-flow.html');
  const sent=[];outer.window.postMessage=message=>sent.push(message);w.eval(await read('skandi-embeds/booking/skandi-booking-flow.js'));
  const host=(type,payload={})=>w.dispatchEvent(new w.MessageEvent('message',{source:outer.window,data:{source:'SKANDI_WIX_PARENT',type,payload}}));
  return {w,doc:w.document,sent,host};
}
function sampleOffer(id,cabin='economy',fare='Light',amount=400){
  const carrier={name:'SAS',iataCode:'SK',logoSymbolUrl:'https://assets.example.test/sk.svg'};
  const passenger={cabinClass:cabin,cabinClassMarketingName:fare,baggages:[{type:'checked',quantity:1}],cabinAmenities:{meal:{available:true,cost:'free'}}};
  const segment=(origin,destination,departure,arrival,number)=>({origin,destination,departingAt:departure,arrivingAt:arrival,duration:'PT1H20M',marketingCarrier:carrier,marketingFlightNumber:number,operatingCarrier:carrier,aircraft:{name:'Airbus A320neo'},passengers:[passenger],stops:[]});
  const arn={iataCode:'ARN',iataCityCode:'STO',timeZone:'Europe/Stockholm'},cph={iataCode:'CPH',timeZone:'Europe/Copenhagen'},jfk={iataCode:'JFK',iataCityCode:'NYC',timeZone:'America/New_York'};
  return {id,itemType:'flight',totalAmount:String(amount),totalCurrency:'USD',price:{amount,currency:'USD'},totalEmissionsKg:'390',owner:carrier,conditions:{change_before_departure:{allowed:true,penalty_amount:'50',penalty_currency:'USD'}},slices:[{origin:arn,destination:jfk,duration:'PT10H10M',fareBrandName:fare,segments:[segment(arn,cph,'2027-03-01T08:00:00','2027-03-01T09:20:00','400'),segment(cph,jfk,'2027-03-01T10:50:00','2027-03-01T14:10:00','900')]},{origin:jfk,destination:arn,duration:'PT8H',fareBrandName:fare,segments:[segment(jfk,arn,'2027-03-08T18:00:00','2027-03-09T08:00:00','901')]}]};
}

test('one itinerary groups bookable fares, preserves return routing and shows verified segment details',async t=>{
  const {doc,sent,host}=await bookingFrame(t),first=sampleOffer('off_light'),second=sampleOffer('off_standard','economy','Standard',500);
  host('BOOKING_SEARCH_RESULTS',{search:{origin:'STO',destination:'NYC',tripType:'flightOnly'},items:[first,second],errors:[]});
  assert.equal(doc.querySelectorAll('.flight-result').length,1);
  const rows=[...doc.querySelectorAll('.itinerary-leg')];assert.equal(rows.length,2);
  assert.match(rows[0].textContent,/ARN/);assert.match(rows[0].textContent,/JFK/);assert.match(rows[1].textContent,/JFK/);assert.match(rows[1].textContent,/ARN/);
  doc.querySelector('[data-action="flight-details"]').click();
  assert.match(doc.querySelector('.flight-details').textContent,/Airbus A320neo/);
  assert.match(doc.querySelector('.flight-details').textContent,/1h 30m transfer/);
  assert.match(doc.querySelector('.flight-details').textContent,/Meal included/);
  assert.match(doc.querySelector('.flight-details').textContent,/390 kg for all travelers/);
  doc.querySelector('[data-action="flight-classes"]').click();assert.equal(sent.at(-1).type,'BOOKING_UPSELL_REQUEST');
  assert.equal(doc.querySelectorAll('.fare-option').length,2);
  doc.querySelector('[data-action="select-offer"][data-id="off_standard"]').click();
  assert.equal(sent.at(-1).type,'BOOKING_SEARCH_SELECT');assert.equal(sent.at(-1).offerId,'off_standard');
});

test('upsell cabins are selectable only when returned and missing details are not invented',async t=>{
  const {doc,sent,host}=await bookingFrame(t),base=sampleOffer('off_base');
  delete base.totalEmissionsKg;delete base.slices[0].segments[0].passengers[0].cabinAmenities;
  host('BOOKING_SEARCH_RESULTS',{search:{origin:'ARN',destination:'JFK',tripType:'flightOnly'},items:[base],errors:[]});
  doc.querySelector('[data-action="flight-details"]').click();assert.match(doc.querySelector('.flight-details').textContent,/Meal information not provided/);assert.match(doc.querySelector('.flight-details').textContent,/CO₂ estimate not provided/);
  doc.querySelector('[data-action="flight-classes"]').click();assert.equal(doc.querySelectorAll('[data-action="choose-cabin"]').length,1);
  host('BOOKING_UPSELL_RESULT',{offerId:'off_base',available:true,items:[sampleOffer('off_business','business','Business Flex',1200)]});
  assert.equal(doc.querySelectorAll('[data-action="choose-cabin"]').length,2);
  doc.querySelector('[data-cabin="business"]').click();assert.match(doc.querySelector('.fare-options').textContent,/Business Flex/);
  doc.querySelector('[data-action="select-offer"][data-id="off_business"]').click();assert.equal(sent.at(-1).offerId,'off_business');
});

test('flight-and-hotel packages retain their original selectable ID and show each direction',async t=>{
  const {doc,sent,host}=await bookingFrame(t),flight=sampleOffer('off_package');
  const pack={id:'PKG-off_package-stay_1',itemType:'PACKAGE',price:{amount:1400,currency:'USD'},flight,stay:{title:'Hotel Example'}};
  host('BOOKING_SEARCH_RESULTS',{search:{origin:'ARN',destination:'JFK',tripType:'package'},items:[pack],errors:[]});
  assert.equal(doc.querySelectorAll('.itinerary-leg').length,2);assert.match(doc.querySelector('.package-hotel').textContent,/Hotel Example/);
  doc.querySelector('[data-action="package-details"]').click();assert.match(doc.querySelector('.flight-details').textContent,/Airbus A320neo/);
  doc.querySelector('[data-action="select-offer"]').click();assert.equal(sent.at(-1).offerId,pack.id);
});

test('the provider upsell request uses the documented endpoint and does not invent offers',async()=>{
  const source=await read('src/backend/SKANDI_CORE/duffelAir.js');let request;
  const ctx=vm.createContext({resourceId:x=>x,arr:x=>Array.isArray(x)?x:[],normalizeOffer:x=>x,duffelRequest:async(path,options)=>{request={path,options};return {data:[{id:'off_up'}, {id:'off_partial',partial:true}]}}});
  vm.runInContext(functionSource(source,'getDuffelUpsellOffersCore')+';this.run=getDuffelUpsellOffersCore;',ctx);
  const output=await ctx.run({offerId:'off_base'});assert.equal(request.path,'/air/offers/off_base/upsell_offers');assert.equal(request.options.method,'POST');assert.equal(request.options.retrySafe,false);assert.equal(output.offers.length,1);
});

test('upsells from a different itinerary or expired provider offer are excluded',async()=>{
  const source=await read('src/backend/SKANDI_CORE/customerBooking.js');
  const ctx=vm.createContext({text:x=>String(x||''),bookingError:(code,msg)=>Object.assign(new Error(msg),{code}),toDuffelOfferSearch:()=>({searchContext:{}}),refreshDuffelOfferCore:async()=>({offer:{key:'same'}}),assertOfferMatchesSearch:()=>true,flightJourneyKey:o=>o.key,arr:x=>Array.isArray(x)?x:[],hasValidFlightPrice:o=>o.totalAmount!==undefined,getDuffelUpsellOffersCore:async()=>({offers:[{id:'off_good',key:'same',totalAmount:'400'},{id:'off_wrong',key:'different',totalAmount:'400'},{id:'off_old',key:'same',totalAmount:'400',isExpired:true},{id:'off_unpriced',key:'same'}]}),mapOfferForHome:o=>o,publicFlightItems:r=>r.items});
  vm.runInContext(functionSource(source,'getFlightUpsellsCore')+';this.run=getFlightUpsellsCore;',ctx);
  const result=await ctx.run({offerId:'off_base',search:{}});assert.deepEqual(Array.from(result.items,x=>x.id),['off_good']);
});

test('booking host requests upsells only for a current search offer and selects the returned offer ID',async()=>{
  let code=await read('src/public/bookingFlowHost.js');const ast=parse(code,{ecmaVersion:'latest',sourceType:'module'});
  for(const node of ast.body.filter(n=>n.type==='ImportDeclaration').reverse())code=code.slice(0,node.start)+code.slice(node.end);
  code=code.replace(/export function /g,'function ');
  const sent=[],upsellCalls=[],selected=[],base=sampleOffer('off_base'),upgrade=sampleOffer('off_upgrade','business','Business Flex',1200);
  const search={origin:'ARN',destination:'JFK',departureDate:'2027-03-01',tripType:'flightOnly'};
  const ctx=vm.createContext({console,setTimeout,clearTimeout,URLSearchParams,session:{setItem(){},removeItem(){}},readBookingSearch:()=>({search}),searchUnifiedOffers:async()=>({items:[base],errors:[]}),getFlightUpsells:async input=>{upsellCalls.push(input);return {items:[upgrade],available:true}},createBookingCartFromOffer:async input=>{selected.push(input.offer.id);return {cartId:'cart-1'}},loadBookingCart:async()=>({status:'Open',productType:'FLIGHT_ONLY'}),SITE_MAP:{home:'/'},APP_ROUTES:{bookingFlow:'/booking'},isSafeInternalRoute:()=>true});
  vm.runInContext(code+';this.factory=createBookingFlowHost;',ctx);const host=ctx.factory({html:{postMessage:m=>sent.push(m)},location:{queryParams:{add(){},remove(){}}}});
  await host.startSearch('search-1');await host.handleMessage({source:'SKANDI_BOOKING_OFFER',type:'BOOKING_OFFER_READY'});
  await host.handleMessage({source:'SKANDI_BOOKING_OFFER',type:'BOOKING_UPSELL_REQUEST',offerId:'off_forged'});assert.equal(upsellCalls.length,0);
  await host.handleMessage({source:'SKANDI_BOOKING_OFFER',type:'BOOKING_UPSELL_REQUEST',offerId:'off_base'});assert.equal(upsellCalls.length,1);assert.equal(sent.at(-1).type,'BOOKING_UPSELL_RESULT');
  await host.handleMessage({source:'SKANDI_BOOKING_OFFER',type:'BOOKING_SEARCH_SELECT',offerId:'off_upgrade'});assert.deepEqual(selected,['off_upgrade']);
});
