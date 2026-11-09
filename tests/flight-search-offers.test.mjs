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

test('place lookup is directly registered as a public Wix web method',async()=>{
  const source=await read('src/backend/SKANDI_CORE/travelReference.web.js');
  const ast=parse(source,{ecmaVersion:'latest',sourceType:'module'});
  const exportNode=ast.body.find(n=>n.type==='ExportNamedDeclaration'&&n.declaration?.declarations?.some(d=>d.id?.name==='searchDuffelPlaces'));
  const declaration=exportNode?.declaration?.declarations?.find(d=>d.id.name==='searchDuffelPlaces');
  assert.equal(declaration?.init?.callee?.name,'webMethod');
  assert.equal(declaration?.init?.arguments?.[0]?.object?.name,'Permissions');
  assert.equal(declaration?.init?.arguments?.[0]?.property?.name,'Anyone');
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

test('outbound selection is a draft and only compatible complete return offers can reach the host',async t=>{
  const {doc,sent,host}=await bookingFrame(t),first=sampleOffer('off_light'),second=sampleOffer('off_standard','economy','Standard',500),later=sampleOffer('off_later','economy','Light',450);
  later.slices[1].segments[0].marketingFlightNumber='905';later.slices[1].segments[0].departingAt='2027-03-08T20:00:00';
  for(const item of [first,second,later])item.slices[0].segments[0].operatingCarrier={iataCode:'D8',name:'SAS Connect'};
  host('BOOKING_SEARCH_RESULTS',{search:{origin:'STO',destination:'NYC',tripType:'flightOnly'},items:[first,second,later],errors:[]});
  assert.equal(doc.querySelectorAll('.flight-result').length,1);assert.equal(doc.querySelectorAll('.itinerary-leg').length,1);
  assert.match(doc.querySelector('#flight-stage-heading').textContent,/outbound/i);
  doc.querySelector('[data-action="flight-details"]').click();
  for(const detail of [/Airbus A320neo/,/Operated by SAS Connect/,/1h 30m transfer/,/Meal included/,/390 kg for all travelers/])assert.match(doc.querySelector('.flight-details').textContent,detail);
  assert.match(doc.querySelector('[data-action="flight-classes"]').textContent,/Select Flights/);
  doc.querySelector('[data-action="flight-classes"]').click();assert.equal(sent.at(-1).type,'BOOKING_UPSELL_REQUEST');assert.equal(doc.querySelectorAll('.fare-option').length,2);
  doc.querySelector('[data-action="choose-flight-ticket"][data-id="off_light"]').click();
  assert.equal(sent.some(x=>x.type==='BOOKING_SEARCH_SELECT'),false);assert.match(doc.querySelector('.travel-planner').textContent,/Outbound/);assert.match(doc.querySelector('.travel-planner').textContent,/Round trip from/);
  assert.match(doc.querySelector('#flight-stage-heading').textContent,/return/i);assert.equal(doc.querySelectorAll('.flight-result').length,2);
  assert.equal(doc.querySelectorAll('.itinerary-leg').length,2);assert([...doc.querySelectorAll('.itinerary-leg')].every(row=>row.textContent.includes('JFK')));
  [...doc.querySelectorAll('[data-action="flight-classes"]')].at(1).click();
  assert.equal(doc.querySelector('[data-action="choose-flight-ticket"][data-id="off_standard"]'),null);
  doc.querySelector('[data-action="choose-flight-ticket"][data-id="off_later"]').click();
  assert.equal(sent.at(-1).type,'BOOKING_SEARCH_SELECT');assert.equal(sent.at(-1).offerId,'off_later');
});

test('upsell cabins are ordered, default to the searched class and never invent missing details',async t=>{
  const {doc,sent,host}=await bookingFrame(t),base=sampleOffer('off_base');base.slices=base.slices.slice(0,1);
  delete base.totalEmissionsKg;delete base.slices[0].segments[0].passengers[0].cabinAmenities;
  const business=sampleOffer('off_business','business','Business Flex',1200);business.slices=business.slices.slice(0,1);business.totalEmissionsKg='550';
  host('BOOKING_SEARCH_RESULTS',{search:{origin:'ARN',destination:'JFK',tripType:'flightOnly',cabinClass:'business'},items:[base,business],errors:[]});
  doc.querySelector('[data-action="flight-details"]').click();assert.match(doc.querySelector('.flight-details').textContent,/Meal information not provided/);assert.match(doc.querySelector('.flight-details').textContent,/CO₂ estimate not provided/);
  doc.querySelector('[data-action="flight-classes"]').click();
  const tabs=[...doc.querySelectorAll('[data-action="choose-cabin"]')];assert.deepEqual(tabs.map(x=>x.dataset.cabin),['economy','business']);assert.equal(tabs[1].getAttribute('aria-pressed'),'true');
  assert.match(doc.querySelector('.fare-options').textContent,/Business Flex/);assert.match(doc.querySelector('.flight-details').textContent,/550 kg for all travelers/);
  doc.querySelector('[data-action="choose-flight-ticket"][data-id="off_business"]').click();assert.equal(sent.at(-1).offerId,'off_business');
});

test('stops, available airlines, class and price sorting use the actual matching offers',async t=>{
  const {w,doc,host}=await bookingFrame(t),sas=sampleOffer('sas'),sasBusiness=sampleOffer('sas_biz','business','Business',900),ay=sampleOffer('ay','economy','Light',300);
  for(const x of [sas,sasBusiness,ay])x.slices=x.slices.slice(0,1);
  ay.owner={name:'Finnair',iataCode:'AY'};ay.slices[0].segments=ay.slices[0].segments.slice(0,1);ay.slices[0].segments[0].marketingCarrier=ay.owner;ay.slices[0].segments[0].marketingFlightNumber='1';
  host('BOOKING_SEARCH_RESULTS',{search:{origin:'ARN',destination:'JFK',tripType:'flightOnly',currency:'USD'},items:[sas,sasBusiness,ay],errors:[]});
  assert.deepEqual([...doc.querySelectorAll('input[name="filter-airline"]')].map(x=>x.value).sort(),['AY','SK']);
  const change=(id,value)=>{const e=doc.getElementById(id);e.value=value;e.dispatchEvent(new w.Event('change',{bubbles:true}))};
  change('filter-stops','0');assert.equal(doc.querySelectorAll('.flight-result').length,1);assert.match(doc.querySelector('.flight-result').textContent,/Finnair/);
  change('filter-stops','any');const airline=doc.querySelector('input[value="SK"]');airline.checked=true;airline.dispatchEvent(new w.Event('change',{bubbles:true}));assert.equal(doc.querySelectorAll('.flight-result').length,1);assert.match(doc.querySelector('.flight-result').textContent,/SAS/);
  change('filter-cabin','business');assert.match(doc.querySelector('.flight-result-actions').textContent,/900/);doc.querySelector('[data-action="flight-classes"]').click();assert.equal(doc.querySelector('[data-cabin="business"]').getAttribute('aria-pressed'),'true');assert.match(doc.querySelector('.fare-options').textContent,/Business/);
  doc.querySelector('[data-action="clear-flight-filters"]')?.click();
});

test('SKANDI suggestions require both top-ten-percent thresholds and rank the actual collection tier',async t=>{
  const {doc,host}=await bookingFrame(t),offers=[];
  for(let i=0;i<20;i++){
    const offer=sampleOffer('off_'+i,'economy','Light',i<2?100:500+i);offer.slices=offer.slices.slice(0,1);offer.slices[0].duration=i<2?'PT2H':'PT5H';
    offer.slices[0].segments[0].marketingFlightNumber=String(100+i);
    if(i===1){offer.owner={name:'Finnair',iataCode:'AY'};offer.slices[0].segments.forEach(s=>s.marketingCarrier=offer.owner)}
    offers.push(offer);
  }
  const search={origin:'ARN',destination:'JFK',tripType:'flightOnly',currency:'USD'};
  host('BOOKING_SEARCH_RESULTS',{search,items:offers,errors:[],recommendation:{available:true,airlines:[{code:'SK',tier:'PARTNER'},{code:'AY',tier:'EXCELSIOR'}]}});
  const rows=[...doc.querySelectorAll('.flight-result')];assert.equal(rows.length,20);assert.match(rows[0].textContent,/SKANDI Excelsior Collection/);assert.match(rows[1].textContent,/SKANDI Partner/);assert.equal(doc.querySelectorAll('.suggestion-label').length,2);
  const noQualifiers=offers.map(x=>({...x,price:{...x.price},slices:x.slices.map(y=>({...y}))}));noQualifiers[0].price.amount=50;noQualifiers[0].slices[0].duration='PT9H';noQualifiers[1].price.amount=900;noQualifiers[1].slices[0].duration='PT1H';noQualifiers[2].slices[0].duration='PT8H';noQualifiers[3].slices[0].duration='PT2H';
  host('BOOKING_SEARCH_RESULTS',{search,items:noQualifiers,errors:[],recommendation:{available:true,airlines:[{code:'SK',tier:'PARTNER'},{code:'AY',tier:'EXCELSIOR'}]}});assert.equal(doc.querySelectorAll('.suggestion-label').length,0);assert.match(doc.querySelector('.recommendation-note').textContent,/No flight meets/);
  host('BOOKING_SEARCH_RESULTS',{search,items:offers,errors:[],recommendation:{available:false,airlines:[]}});
  assert.equal(doc.querySelectorAll('.suggestion-label').length,0);assert.match(doc.querySelector('.recommendation-note').textContent,/temporarily unavailable/);
});

test('planner shows selected extras without presenting an unconfirmed total as final',async t=>{
  const {doc,host}=await bookingFrame(t),offer=sampleOffer('off_cart'),cart={status:'Open',productType:'FLIGHT_ONLY',currency:'USD',total:400,taxes:30,selectedOffer:offer,extras:[]};
  host('BOOKING_EXTRAS_LOADED',{cart,items:[{id:'bag',title:'Extra bag',price:{amount:35,currency:'USD'},maximumQuantity:1}],selectedExtras:[]});
  const input=doc.querySelector('[data-extra="bag"]');input.checked=true;input.dispatchEvent(new doc.defaultView.Event('change',{bubbles:true}));
  const planner=doc.querySelector('.travel-planner').textContent;assert.match(planner,/Extra bag/);assert.match(planner,/35/);assert.match(planner,/Current trip quote/);assert.match(planner,/confirmed in the total during checkout/);assert.match(planner,/Taxes and charges included/);
});

test('flights with a different technical stop are not merged into the same itinerary',async t=>{
  const {doc,host}=await bookingFrame(t),first=sampleOffer('off_direct'),different=sampleOffer('off_stop');
  different.slices[0].segments[0].stops=[{airport:{iataCode:'GOT'},duration:'PT35M'}];
  host('BOOKING_SEARCH_RESULTS',{search:{origin:'ARN',destination:'JFK',tripType:'flightOnly'},items:[first,different],errors:[]});
  assert.equal(doc.querySelectorAll('.flight-result').length,2);
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
  const ctx=vm.createContext({console,setTimeout,clearTimeout,URLSearchParams,session:{setItem(){},removeItem(){}},readBookingSearch:()=>({search}),searchUnifiedOffers:async()=>({items:[base],errors:[],recommendation:{available:true,airlines:[{code:'SK',tier:'PARTNER'}]}}),getFlightUpsells:async input=>{upsellCalls.push(input);return {items:[upgrade],available:true}},createBookingCartFromOffer:async input=>{selected.push(input.offer.id);return {cartId:'cart-1'}},loadBookingCart:async()=>({status:'Open',productType:'FLIGHT_ONLY'}),SITE_MAP:{home:'/'},APP_ROUTES:{bookingFlow:'/booking'},isSafeInternalRoute:()=>true});
  vm.runInContext(code+';this.factory=createBookingFlowHost;',ctx);const host=ctx.factory({html:{postMessage:m=>sent.push(m)},location:{queryParams:{add(){},remove(){}}}});
  await host.startSearch('search-1');await host.handleMessage({source:'SKANDI_BOOKING_OFFER',type:'BOOKING_OFFER_READY'});
  assert.equal(sent.find(m=>m.type==='BOOKING_SEARCH_RESULTS').payload.recommendation.airlines[0].tier,'PARTNER');
  await host.handleMessage({source:'SKANDI_BOOKING_OFFER',type:'BOOKING_UPSELL_REQUEST',offerId:'off_forged'});assert.equal(upsellCalls.length,0);
  await host.handleMessage({source:'SKANDI_BOOKING_OFFER',type:'BOOKING_UPSELL_REQUEST',offerId:'off_base'});assert.equal(upsellCalls.length,1);assert.equal(sent.at(-1).type,'BOOKING_UPSELL_RESULT');
  await host.handleMessage({source:'SKANDI_BOOKING_OFFER',type:'BOOKING_SEARCH_SELECT',offerId:'off_upgrade'});assert.deepEqual(selected,['off_upgrade']);
});

test('airline tier metadata uses published, visible canonical inventory and returns only safe codes and tiers',async()=>{
  const source=await read('src/backend/SKANDI_CORE/publicContent.js');let request;
  const upper=(v,n)=>String(v??'').trim().slice(0,n).toUpperCase(),first=(...v)=>v.find(x=>x!==undefined&&x!==null&&x!=='')||'';
  const ctx=vm.createContext({upper,first,obj:v=>v&&typeof v==='object'?v:{},PUBLISHED:'eq.PUBLISHED',ACTIVE:'eq.true',COLLECTION_TYPES:'in.(SKANDI_COLLECTION,SKANDI_PARTNER)',MAX_PUBLIC_ROWS:'1000',select:async(table,query)=>{request={table,query};return [{code:'SK',collection_type:'SKANDI_PARTNER',details:{secret:'not returned'}},{code:'AY',collection_type:'SKANDI_COLLECTION',partner_tier:'Signature Collection'},{code:'SAS',collection_type:'SKANDI_PARTNER'},{code:'AA',collection_type:'SKANDI_COLLECTION',partner_tier:'unknown'}]}});
  vm.runInContext(functionSource(source,'getPublicAirlineRecommendationTiersCore')+';this.run=getPublicAirlineRecommendationTiersCore;',ctx);
  const rows=await ctx.run();assert.equal(request.table,'inventory_canonical_entities_v');assert.equal(request.query.entity_type,'eq.AIRLINE');assert.equal(request.query.status,'eq.PUBLISHED');assert.equal(request.query.active,'eq.true');assert.equal(request.query.customer_visible,'eq.true');
  assert.deepEqual(JSON.parse(JSON.stringify(rows)),[{code:'SK',tier:'PARTNER'},{code:'AY',tier:'SIGNATURE'}]);
});

test('a recommendation metadata failure never suppresses live flight offers',async()=>{
  const source=await read('src/backend/SKANDI_CORE/customerBooking.js');
  const ctx=vm.createContext({console:{error(){}},record:x=>x||{},unifiedTripType:()=> 'flightOnly',searchLiveFlightOffersCore:async()=>({items:[{id:'off_live'}]}),getPublicAirlineRecommendationTiersCore:async()=>{throw new Error('inventory unavailable')},publicFlightItems:x=>x.items,nowIso:()=> '2027-01-01',safeCode:x=>x,text:x=>String(x||'')});
  vm.runInContext(functionSource(source,'searchUnifiedOffersCore')+';this.run=searchUnifiedOffersCore;',ctx);
  const out=await ctx.run({search:{}});assert.equal(out.items[0].id,'off_live');assert.equal(out.errors.length,0);assert.equal(out.recommendation.available,false);
  ctx.getPublicAirlineRecommendationTiersCore=async()=>[{code:'SK',tier:'PARTNER'}];const available=await ctx.run({search:{}});assert.equal(available.recommendation.available,true);assert.equal(available.recommendation.airlines[0].tier,'PARTNER');
});


test('compiled Booking page initializes and renders the new planner and filters',async t=>{
  const {inventory}=await import('../scripts/lib/inventory.mjs'),{compilePage}=await import('../scripts/lib/compile.mjs');
  const root=new URL('..',import.meta.url).pathname,row=(await inventory(root)).rows.find(x=>x.key==='bookingFlow');assert.deepEqual(row.issues,[]);
  const built=await compilePage(root,row),sent=[],errors=[],{VirtualConsole}=require('jsdom'),log=new VirtualConsole();log.on('jsdomError',e=>errors.push(e));
  const dom=new JSDOM(built,{url:'https://embed.example/',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:log,beforeParse:w=>{w.postMessage=m=>sent.push(m);w.scrollTo=()=>{}}});t.after(()=>dom.window.close());
  assert(sent.some(m=>m.type==='BOOKING_OFFER_READY'));
  dom.window.dispatchEvent(new dom.window.MessageEvent('message',{source:dom.window,data:{source:'SKANDI_WIX_PARENT',type:'BOOKING_SEARCH_RESULTS',payload:{search:{origin:'ARN',destination:'JFK',tripType:'flightOnly'},items:[sampleOffer('off_build')],errors:[]}}}));
  assert.match(dom.window.document.querySelector('.travel-planner').textContent,/Travel Planner/);assert(dom.window.document.querySelector('#filter-stops'));assert(dom.window.document.querySelector('[data-action="flight-classes"]'));assert.deepEqual(errors,[]);
});


test('refresh removes previous offers while replacement availability is loading',async t=>{
  const {doc,host}=await bookingFrame(t),search={origin:'ARN',destination:'JFK',tripType:'flightOnly'};
  host('BOOKING_SEARCH_RESULTS',{search,items:[sampleOffer('off_before_refresh')],errors:[]});assert.equal(doc.querySelectorAll('.flight-result').length,1);
  host('BOOKING_SEARCH_LOADING',{search});assert.equal(doc.querySelectorAll('.flight-result').length,0);assert.match(doc.getElementById('root-offer').textContent,/Searching live availability/);
});
