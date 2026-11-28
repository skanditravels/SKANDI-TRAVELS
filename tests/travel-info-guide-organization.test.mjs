import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import {createRequire} from 'node:module';

const require=createRequire(new URL('../scripts/package.json',import.meta.url));
const {JSDOM,VirtualConsole}=require('jsdom');
const base=new URL('../skandi-embeds/travel-info/skandi-travel-info',import.meta.url);
const [markup,script,airportFids]=await Promise.all([
  fs.readFile(new URL(base.href+'.html'),'utf8'),
  fs.readFile(new URL(base.href+'.js'),'utf8'),
  fs.readFile(new URL('../skandi-embeds/flight-status/airport-fids.js',import.meta.url),'utf8')
]);

function setup(t,data) {
  const errors=[],messages=[];
  const console=new VirtualConsole();
  console.on('jsdomError',error=>errors.push(error));
  const dom=new JSDOM(markup,{runScripts:'outside-only',url:'https://example.test/travel-info',virtualConsole:console});
  const w=dom.window;
  t.after(()=>w.close());
  w.matchMedia=()=>({matches:true});
  w.CSS??={};
  w.CSS.escape=value=>value;
  w.HTMLElement.prototype.scrollIntoView=function(){};
  w.scrollTo=()=>{};
  w.requestAnimationFrame=()=>0;
  w.postMessage=message=>messages.push(message);
  w.eval(airportFids+'\n'+script);
  const receive=(type,payload)=>w.dispatchEvent(new w.MessageEvent('message',{source:w,data:{source:'SKANDI_WIX_PARENT',type,payload}}));
  receive('TRAVEL_INFO_DATA',data);
  const get=selector=>w.document.querySelector(selector);
  function open(category,title) {
    get('[data-filter="'+category+'"]').click();
    const button=[...w.document.querySelectorAll('#tiDirectoryList button')].find(element=>element.getAttribute('aria-label')==='Open '+title);
    assert.ok(button,'guide available in '+category);
    button.click();
    assert.equal(get('#tiDetailMount h1')?.textContent,title);
    return button;
  }
  return {w,get,open,receive,messages,errors};
}

test('the directory offers trip stages in help and searches by airport name and code',t=>{
  const {w,get,messages,open,errors}=setup(t,{
    airports:[{id:'JFK',title:'John F. Kennedy International Airport',iata:'JFK',city:'New York City'}],
    helpCenter:{groups:[{id:'before',title:'Before you travel'},{id:'day',title:'Day of travel'}],topics:[
      {id:'passport',title:'Passports',groupId:'before',body:'Check the entry requirements.'},
      {id:'checkin',title:'Airport check-in',groupId:'day',body:'See your operating airline.'}
    ]}
  });
  assert.equal(get('#tiDirectoryHeading').textContent,'Travel help');
  assert.equal(get('#tiLoadMoreWrap').hidden,true);
  const stage=get('#tiJourneyFilter');
  stage.value='day';
  stage.dispatchEvent(new w.Event('change',{bubbles:true}));
  assert.match(get('#tiDirectoryList').textContent,/Airport check-in/);
  assert.doesNotMatch(get('#tiDirectoryList').textContent,/Passports/);

  get('#tiHeroSearch').click();
  const search=get('#tiSearchInput');
  search.value='terminal JFK';
  search.dispatchEvent(new w.Event('input',{bubbles:true}));
  assert.match(get('#tiSearchResults').textContent,/John F. Kennedy/);
  get('[data-close-search]').click();

  const trigger=open('airports','John F. Kennedy International Airport');
  assert.equal(get('#tiJourneyFilterWrap').hidden,true);
  assert.equal(messages.some(m=>m.type==='TRAVEL_INFO_AIRPORT_CONTEXT_REQUEST'),true);
  get('#tiBack').click();
  assert.equal(w.document.activeElement,trigger);
  assert.deepEqual(errors,[]);
});

test('hotel, transfer, experience, ticket and help guides all render complete detail pages',t=>{
  const {get,open,messages,errors}=setup(t,{
    hotels:[{id:'h',name:'Stockholm Hotel',address:'Central Street 1',body:'Beside the station',path:'/destinations/hotels/h',sections:{
      policies:{body:{'Check-in':'15:00','Check-out':'11:00','Pets allowed':false}},
      rooms:{body:[{name:'Standard room',bedType:'King'}]}
    }}],
    transfers:[{id:'transfer',name:'Airport coach',fromLocation:'Terminal 5',toLocation:'City center',sections:{
      transferDetails:{body:{'Meeting point':'Exit 2','Meeting instructions':'Find the SKANDI sign','Luggage capacity':2,'Minimum journey time (minutes)':30,'Maximum journey time (minutes)':45}}
    }}],
    tours:[{id:'tour',name:'Old Town walk',meetingPoint:'Main square',durationText:'90 minutes'}],
    activities:[{id:'activity',name:'Kayaking',body:'A guided paddle',sections:{practical:{body:{'Minimum age':12}}}}],
    tickets:[{id:'ticket',name:'Museum admission',meetingPoint:'East entrance',sections:{important:{body:'Show your voucher at the entrance.'}}}],
    helpCenter:{topics:[{id:'faq',title:'Where is my voucher?',body:'Open your booking to find your voucher.',actionTarget:'/my-profile'}]},
    articles:[{id:'article',title:'Preparing for departure',body:'Bring your travel documents.'}]
  });
  const cases=[
    ['hotels','Stockholm Hotel',/Stay details.*Central Street 1.*Check-in.*15:00.*Check-out.*11:00/s],
    ['transfers','Airport coach',/Pickup & drop-off.*Terminal 5.*City center.*Exit 2.*Estimated journey time.*30–45 min/s],
    ['tours','Old Town walk',/When & where.*Main square.*90 minutes/s],
    ['activities','Kayaking',/A guided paddle.*Minimum age.*12/s],
    ['tickets','Museum admission',/Venue & entry.*East entrance.*Show your voucher/s],
    ['faq','Where is my voucher?',/Answer.*Open your booking/s],
    ['faq','Preparing for departure',/Answer.*Bring your travel documents/s]
  ];
  for(const [category,title,expected] of cases){
    open(category,title);
    assert.match(get('#tiDetailMount').textContent,expected);
    assert.doesNotMatch(get('#tiDetailMount').textContent,/\[object Object\]|At a glance|Continue your journey/);
    if(category==='hotels'){
      get('[data-detail-path]').click();
      assert.equal(messages.at(-1).payload.path,'/destinations/hotels/h');
    }
    get('#tiBack').click();
  }
  assert.deepEqual(errors,[]);
});

test('airport guide groups terminals, transport and services with the existing arrivals and departures board',t=>{
  const airport={
    id:'JFK',name:'Kennedy Airport',iata:'JFK',city:'New York',timezone:'America/New_York',
    terminals:[{terminal:'4',description:'International terminal'}],
    transport:[{name:'AirTrain',description:'Connect to the subway'}],
    parkingInfo:'Book parking through the airport.',
    lounges:[{name:'Terminal 4 Lounge',location:'After security'}],
    destinationsServing:[{name:'London Heathrow'}]
  };
  const {get,open,receive,messages,errors}=setup(t,{airports:[airport]});
  open('airports','Kennedy Airport');
  assert.equal(get('[data-ti-swedavia]'),null);
  assert.equal(get('[data-airport-tab="overview"]').textContent,'Terminals & check-in');
  assert.equal(get('[data-airport-panel="overview"] h2').textContent,'Terminals');
  const request=messages.find(m=>m.type==='TRAVEL_INFO_AIRPORT_CONTEXT_REQUEST');
  receive('TRAVEL_INFO_AIRPORT_CONTEXT_RESULT',{requestId:request.payload.requestId,airport:{iata:'JFK',transport:[],terminals:[]},commerce:{}});
  get('[data-airport-tab="transport"]').click();
  assert.match(get('[data-airport-panel="transport"]').textContent,/AirTrain.*parking/s);
  get('[data-airport-tab="services"]').click();
  assert.match(get('[data-airport-panel="services"]').textContent,/Terminal 4 Lounge/);
  assert.match(get('[data-airport-panel="services"]').textContent,/Destinations served.*London Heathrow/s);
  assert.equal(get('[data-airport-tab="routes"]'),null);
  get('[data-airport-tab="flight-info"]').click();
  assert.equal(messages.at(-1).payload.boardType,'departures');
  get('[data-ti-board-type="arrivals"]').click();
  assert.equal(messages.at(-1).type,'TRAVEL_INFO_AIRPORT_FLIGHTS_REQUEST');
  assert.equal(messages.at(-1).payload.boardType,'arrivals');
  assert.equal(get('#tiAirportPlaceHeader').textContent,'From');
  assert.deepEqual(errors,[]);
});

test('Swedavia panels request only open sections, localize labels and protect wait times',async t=>{
  const airports=[
    {id:'ARN',title:'Stockholm Arlanda Airport',iata:'ARN',terminals:[{name:'Terminal 5'}],destinationsServing:[{name:'Old route guide'}]},
    {id:'LLA',title:'Luleå Airport',iata:'LLA'}
  ];
  const {w,get,open,receive,messages,errors}=setup(t,{airports});
  const queries=()=>messages.filter(m=>m.type==='TRAVEL_INFO_SWEDAVIA_REQUEST');
  const settle=()=>new Promise(resolve=>w.setTimeout(resolve,0));
  async function reveal(scope){
    const panel=get('[data-ti-swedavia="'+scope+'"]');
    panel.querySelector('summary').click();
    await settle();
    assert.equal(panel.open,true);
    assert.equal(queries().at(-1)?.payload.scope,scope);
    return panel;
  }
  function reply(payload){
    receive('TRAVEL_INFO_SWEDAVIA_RESULT',{...queries().at(-1).payload,status:'ready',...payload});
  }
  open('airports','Stockholm Arlanda Airport');
  assert.equal(queries().length,0);
  const security=await reveal('security');
  const measuredAt=new Date().toISOString();
  reply({requestId:'old-request',items:[{name:'Wrong airport or request'}]});
  assert.doesNotMatch(security.textContent,/Wrong airport/);
  reply({items:[
    {name:'Security T5',terminal:'T5',fastTrack:false,minutes:0,measuredAt,validUntil:Date.now()+300_000},
    {name:'Fast track',fastTrack:true,minutes:90,overflow:true,measuredAt,validUntil:Date.now()+300_000},
    {name:'Stale line',minutes:80,measuredAt,validUntil:Date.now()-1000}
  ]});
  assert.match(security.textContent,/0\s+min/);
  assert.match(security.textContent,/Queue exceeds the monitored area/);
  assert.match(security.textContent,/Reading out of date/);
  assert.doesNotMatch(security.textContent,/(90|80)\s+min/);
  assert.equal(security.querySelectorAll('time').length,1);

  receive('SKANDI_MASTER_CONFIG',{settings:{language:'SV'}});
  assert.match(security.textContent,/Väntetider i säkerhetskontrollen/);
  assert.equal(queries().length,1);
  get('[data-airport-tab="services"]').click();
  const dining=get('[data-ti-swedavia="services"]');
  assert.equal(queries().at(-1).payload.scope,'services');
  assert.equal(queries().at(-1).payload.language,'sv');
  const venues=[{name:'Terminal café',terminal:'Terminal 5',place:'After security',beforeSecurity:false,openingHours:'06:00–21:00',description:'<script>unsafe</script>'},
    ...Array.from({length:13},(_,index)=>({name:'Bistro '+(index+1),terminal:'Terminal 2',beforeSecurity:index%2===0}))];
  reply({
    providerLanguage:'en',
    groups:{
      restaurants:{status:'ready',items:venues},
      shops:{status:'unavailable'},
      services:{status:'ready',items:[{name:'Information desk',terminal:'Terminal 5'}]}
    }
  });
  const directory=scope=>get('[data-ti-swedavia="'+scope+'"]');
  function filter(scope,key,value){
    const field=directory(scope).querySelector('[data-ti-swedavia-filter="'+key+'"]');
    field.value=value;
    field.dispatchEvent(new w.Event(key==='query'?'input':'change',{bubbles:true}));
  }
  assert.equal(dining.querySelectorAll('li').length,12);
  dining.querySelector('[data-ti-swedavia-more]').click();
  assert.equal(dining.querySelectorAll('li').length,14);
  const terminal=dining.querySelector('[data-ti-swedavia-filter="terminal"]');
  assert.deepEqual(Array.from(terminal.options,option=>option.value),['','Terminal 2','Terminal 5']);
  filter('services','terminal','Terminal 5');
  filter('services','query','cafe');
  assert.equal(dining.querySelectorAll('li').length,1);
  assert.match(dining.textContent,/Terminal café.*Efter säkerhetskontrollen.*Öppettider.*06:00–21:00/s);
  assert.doesNotMatch(dining.querySelector('li').textContent,/After security/);
  assert.equal(dining.querySelector('li h3').getAttribute('lang'),'en');
  assert.equal(dining.querySelector('script'),null);
  filter('services','area','before');
  assert.match(dining.textContent,/Inga resultat matchar dina filter/);
  filter('services','area','');
  filter('services','query','');
  dining.querySelector('[data-ti-swedavia-category="shops"]').click();
  assert.match(dining.textContent,/tillfälligt otillgänglig/);
  dining.querySelector('[data-ti-swedavia-category="services"]').click();
  assert.match(dining.textContent,/Information desk/);

  assert.equal(queries().filter(m=>m.payload.scope==='routes').length,0);
  get('[data-airport-tab="routes"]').click();
  const routes=directory('routes');
  assert.doesNotMatch(get('#tiDetailMount').textContent,/Destinations served|Old route guide/);
  reply({items:[{iata:'CPH',city:'Köpenhamn',name:'Kastrup',airlines:['SAS']},{iata:'HEL',city:'Helsinki',airlines:['Finnair']}]});
  filter('routes','airline','SAS');
  assert.match(routes.textContent,/Köpenhamn.*CPH.*SAS/s);
  assert.doesNotMatch(routes.querySelector('[data-ti-swedavia-body]').textContent,/Helsinki/);
  filter('routes','query','kopenhamn cph');
  assert.equal(routes.querySelectorAll('li').length,1);
  get('[data-airport-tab="transport"]').click();
  const parking=await reveal('parking');
  reply({status:'unavailable'});
  assert.match(parking.textContent,/tillfälligt otillgänglig/);
  parking.querySelector('[data-ti-swedavia-refresh]').click();
  reply({bookingUrl:'https://www.swedavia.se/parkering/',items:[{name:'P1'}]});
  assert.equal(parking.querySelector('a').href,'https://www.swedavia.se/parkering/');
  assert.match(parking.textContent,/P1/);

  get('#tiBack').click();
  open('airports','Luleå Airport');
  assert.equal(get('[data-ti-swedavia="security"]'),null);
  assert.ok(get('[data-ti-swedavia="services"]'));
  assert.deepEqual(errors,[]);
});

test('the Travel Info board shows official remarks, codeshares and local update time',t=>{
  const {get,open,receive,messages,errors}=setup(t,{airports:[{id:'ARN',iata:'ARN',title:'Arlanda'}]});
  open('airports','Arlanda');
  get('[data-airport-tab="flight-info"]').click();
  const request=messages.at(-1);
  const board={
    requestId:request.payload.requestId,
    meta:{provider:'swedavia',providerUpdatedAt:'2026-11-28T12:30:00Z'},
    items:[{
      id:'SK903|ARN|EWR',flightIata:'SK903',airlineIata:'SK',airlineName:'SAS',codeshareFlightIatas:['DL1234'],
      status:'scheduled',fidsRemarks:{en:'Go to gate',sv:'Gå till gate'},checkInDesks:'14–20',
      departure:{scheduledLocal:'14:53',terminal:'T5',gate:'F62'},arrival:{airport:'Newark',airportSv:'New York Newark',iata:'EWR'}
    }]
  };
  receive('TRAVEL_INFO_AIRPORT_FLIGHTS_RESULT',board);
  const casing=get('.flight-board-shell.airport-fids-screen');
  assert.equal(casing.dataset.fidsDirection,'departures');
  assert.match(casing.querySelector('.board-brand').textContent,/Departures.*Arlanda.*ARN/s);
  const headers=Array.from(casing.querySelectorAll('.board-columns [role="columnheader"]'),column=>column.textContent);
  assert.deepEqual(headers,['Time','To','Airline','Flight','Codeshare','Terminal','Remarks','Gate']);
  const labels=Array.from(get('#tiAirportFlightRows .fids-row').children,column=>column.dataset.label);
  assert.deepEqual(labels,headers);
  assert.match(get('#tiAirportFlightRows').textContent,/14:53.*SK 903.*DL 1234.*Go to gate.*14–20.*F62/s);
  assert.match(get('#tiAirportBoardMeta').textContent,/Source: Swedavia.*13:30/s);
  assert.doesNotMatch(get('#tiAirportFlightRows').textContent,/FINAL CALL|ON TIME/);
  receive('SKANDI_MASTER_CONFIG',{settings:{language:'SV'}});
  assert.match(get('#tiAirportFlightRows').textContent,/Gå till gate/);
  assert.equal(get('#tiAirportPlaceHeader').textContent,'Till / To');
  assert.deepEqual(errors,[]);
});
