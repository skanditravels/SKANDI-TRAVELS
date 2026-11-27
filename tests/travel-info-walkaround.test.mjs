import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import vm from 'node:vm';

const require=createRequire(new URL('../scripts/package.json',import.meta.url));
const {JSDOM}=require('jsdom');
const read=path=>readFile(new URL('../skandi-embeds/travel-info/'+path,import.meta.url),'utf8');
const [markup,guide,walkaround]=await Promise.all(['skandi-travel-info.html','skandi-travel-info.js','skandi-travel-info.part-03.js'].map(read));

function fixture(t,airlines){
  const dom=new JSDOM(markup,{runScripts:'outside-only',url:'https://www.skanditravels.com/travel-info'});
  const window=dom.window;
  const outbound=[];
  window.postMessage=message=>outbound.push(message);
  window.matchMedia=()=>({matches:true,addEventListener(){},removeEventListener(){}});
  window.scrollTo=()=>{};
  window.requestAnimationFrame=()=>0;
  window.HTMLElement.prototype.scrollIntoView=function(){};
  window.CSS??={};
  window.CSS.escape??=value=>value;
  window.eval(guide);
  t.after(()=>window.close());
  const receive=(type,payload)=>window.dispatchEvent(new window.MessageEvent('message',{source:window,data:{source:'SKANDI_WIX_PARENT',type,payload}}));
  receive('TRAVEL_INFO_DATA',{airlines});
  const get=selector=>window.document.querySelector(selector);
  get('[data-library="airlines"],[data-action="airlines"]')?.click();
  const open=name=>{
    const label='Open '+name;
    [...window.document.querySelectorAll('button[aria-label]')].find(button=>button.getAttribute('aria-label')===label).click();
  };
  return {window,get,open,receive,outbound};
}

test('airline guide shows one fare and route deadlines while keeping fleet prose out of the walkaround',t=>{
  const sas={id:'sk',name:'SAS',iataCode:'SK',summary:'Directory introduction',website:'https://www.flysas.com/',
    cabins:[{name:'Economy',code:'Y'},{name:'Premium',code:'W'}],
    checkInDeadline:'Scandinavia & Europe — 45 minutes before departure\n\nAsia & North America — Economy and Premium: 90 minutes',
    baggage:{mode:'structured',cabins:[{cabinType:'Economy',fares:[
      {name:'Light',underSeatBag:'Small bag',checkedBag:'Not included'},
      {name:'Standard',underSeatBag:'Small bag',checkedBag:'23 kg'}
    ]}]},
    fleetSummary:[{aircraft:'Airbus A350-900',notes:'Long technical marketing paragraph'}]
  };
  const {window,get,open}=fixture(t,[sas]);
  open('SAS');
  assert.equal(get('#tiDetailMount h1').textContent,'SAS');
  assert.equal(get('#tiAirlineTab-before').getAttribute('aria-selected'),'true');
  assert.match(get('.ti-airline-deadlines').textContent,/Asia & North America.*90 minutes/s);
  const fare=get('#tiAirlineFare');
  fare.value='1';
  fare.dispatchEvent(new window.Event('change',{bubbles:true}));
  assert.match(get('[data-airline-fare]:not([hidden])').textContent,/23 kg/);
  assert.match(get('#tiAirlinePanel-aircraft').textContent,/Airbus A350-900/);
  assert.doesNotMatch(get('#tiDetailMount').textContent,/Directory introduction|Long technical marketing paragraph/);
  assert.equal(get('#tiAirlinePanel-aircraft').hidden,true);
});

test('aircraft responses are correlated when passengers switch airline and a failed load can be retried',t=>{
  const {window,get,open,receive,outbound}=fixture(t,[{id:'sk',name:'SAS',iataCode:'SK'},{id:'other',name:'Other Air',iataCode:'OA'}]);
  const rendered=[];
  window.SKANDIOnboardReact={mount:(host,bundle)=>rendered.push([host.id,bundle.airlineKey]),unmount:()=>{}};
  open('SAS');
  get('#tiAirlineTab-aircraft').click();
  const first=outbound.filter(m=>m.type==='TRAVEL_INFO_REQUEST_AIRCRAFT').at(-1).payload;
  assert.equal(first.airlineKey,'sk');
  get('#tiBack').click();
  open('Other Air');
  get('#tiAirlineTab-aircraft').click();
  const second=outbound.filter(m=>m.type==='TRAVEL_INFO_REQUEST_AIRCRAFT').at(-1).payload;
  receive('TRAVEL_INFO_AIRCRAFT_DATA',{...first,aircraft:[]});
  assert.deepEqual(rendered,[]);
  receive('TRAVEL_INFO_ERROR',{...second,scope:'aircraft'});
  get('#onboardReactRoot button').click();
  const retry=outbound.filter(m=>m.type==='TRAVEL_INFO_REQUEST_AIRCRAFT').at(-1).payload;
  assert.notEqual(retry.requestId,second.requestId);
  receive('TRAVEL_INFO_AIRCRAFT_DATA',{...second,aircraft:[]});
  assert.deepEqual(rendered,[]);
  receive('TRAVEL_INFO_AIRCRAFT_DATA',{...retry,aircraft:[]});
  assert.deepEqual(rendered,[['onboardReactRoot','other']]);
});

function projectionModel(){
  const start=walkaround.indexOf('const list='),end=walkaround.indexOf('function PanoramaCanvas(');
  const context=vm.createContext({URL});
  vm.runInContext(walkaround.slice(start,end)+'\nthis.make=makeWalkaround;this.project=projectPanorama;',context);
  return context;
}

test('walkaround uses explicit links, retains legacy imagery and does not link inactive or neighboring scenes',()=>{
  const {make}=projectionModel();
  const a={id:'plane',walkthroughStartSceneCode:'BOARD'};
  const photo='https://media.example/cabin.jpg';
  const scene=(id,code,title,extra={})=>({id,aircraft_id:a.id,scene_code:code,title,image_url:photo,...extra});
  const bundle={
    walkScenes:[
      scene('next','MID','Middle'),
      scene('board','BOARD','Boarding door',{forward_scene_code:'MID'}),
      scene('hidden','HIDDEN','Archived',{active:false})
    ],
    views:[{id:'view',aircraft_id:a.id,label:'Seat photo',image_url:photo}],
    sceneHotspots:[
      {id:'move',scene_id:'board',action:'MOVE:VIEW:VIEW',label:'Seat photo',x:25,y:40},
      {id:'inspect',scene_id:'board',action:'SEAT_ROW',label:'Row 12',x:30,y:60},
      {id:'note',scene_id:'board',label:'Overhead bins',description:'Use the bins above your row.'},
      {id:'bad',scene_id:'board',action:'MOVE:SCENE:HIDDEN'},
      {id:'inactive',scene_id:'board',label:'Inactive feature',active:false}
    ]
  };
  const model=make(bundle,a,{});
  assert.equal(model.start,'SCENE:BOARD');
  assert.equal(model.stops.length,3);
  const [mid,door,view]=model.stops;
  assert.equal(mid.moves.length,0);
  assert.equal(door.moves[0].target,'SCENE:NEXT');
  assert.equal(door.points.map(p=>p.kind).join(','),'move,inspect,note');
  assert.equal(door.points[0].target,view.ref);
  assert.equal(door.points[1].focusX,.3);
  assert.equal(door.points[1].focusY,.6);
});

test('movement shows the real destination and separates scenes with identical names',()=>{
  const {make}=projectionModel();
  const aircraft={id:'plane',walkthroughStartSceneCode:'BOARD'};
  const photo='https://media.example/cabin.jpg';
  const bundle={
    walkScenes:[
      {id:'board',aircraft_id:'plane',scene_code:'BOARD',title:'Entrance',image_url:photo,forward_scene_code:'ECONOMY_A',forward_label:'SAS Business'},
      {id:'eco-a',aircraft_id:'plane',scene_code:'ECONOMY_A',title:'Economy',image_url:photo}
    ],
    views:[{id:'eco-b',aircraft_id:'plane',label:'Economy',image_url:photo}],
    sceneHotspots:[{id:'move',scene_id:'board',action:'MOVE:VIEW:ECO-B',title:'SAS Business',x:40,y:50}]
  };
  const model=make(bundle,aircraft,{});
  const [board,first,second]=model.stops;
  assert.equal(first.title,'Economy · View 1');
  assert.equal(second.title,'Economy · View 2');
  assert.equal(board.moves[0].title,first.title);
  assert.equal(board.points[0].title,second.title);
  assert.equal(board.points[0].target,second.ref);
});

test('a panorama point follows the same angle as the camera and disappears behind it',()=>{
  const {project}=projectionModel();
  const camera={yaw:90,pitch:0,zoom:1};
  const center=project(.75,.5,camera,1.5);
  assert.ok(Math.abs(center.x-.5)<.00001);
  assert.ok(Math.abs(center.y-.5)<.00001);
  assert.equal(project(.25,.5,camera,1.5),null);
});
