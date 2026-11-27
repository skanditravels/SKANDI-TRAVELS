import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import {createRequire} from 'node:module';

const require=createRequire(new URL('../scripts/package.json',import.meta.url));
const {JSDOM,VirtualConsole}=require('jsdom');
const base=new URL('../skandi-embeds/travel-info/skandi-travel-info',import.meta.url);
const [markup,script]=await Promise.all(['.html','.js'].map(ext=>fs.readFile(new URL(base.href+ext),'utf8')));

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
  w.eval(script);
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
    lounges:[{name:'Terminal 4 Lounge',location:'After security'}]
  };
  const {get,open,receive,messages,errors}=setup(t,{airports:[airport]});
  open('airports','Kennedy Airport');
  assert.equal(get('[data-airport-tab="overview"]').textContent,'Terminals & check-in');
  assert.equal(get('[data-airport-panel="overview"] h2').textContent,'Terminals');
  const request=messages.find(m=>m.type==='TRAVEL_INFO_AIRPORT_CONTEXT_REQUEST');
  receive('TRAVEL_INFO_AIRPORT_CONTEXT_RESULT',{requestId:request.payload.requestId,airport:{iata:'JFK',transport:[],terminals:[]},commerce:{}});
  get('[data-airport-tab="transport"]').click();
  assert.match(get('[data-airport-panel="transport"]').textContent,/AirTrain.*parking/s);
  get('[data-airport-tab="services"]').click();
  assert.match(get('[data-airport-panel="services"]').textContent,/Terminal 4 Lounge/);
  get('[data-airport-tab="flight-info"]').click();
  assert.equal(messages.at(-1).payload.boardType,'departures');
  get('[data-ti-board-type="arrivals"]').click();
  assert.equal(messages.at(-1).type,'TRAVEL_INFO_AIRPORT_FLIGHTS_REQUEST');
  assert.equal(messages.at(-1).payload.boardType,'arrivals');
  assert.equal(get('#tiAirportPlaceHeader').textContent,'From');
  assert.deepEqual(errors,[]);
});
