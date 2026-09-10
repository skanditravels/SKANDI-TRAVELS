// backend/alexandraBot.web.js
// SKANDI Alexandra Smart Custom Bot Engine V9.12
// Stateful deterministic router over live SKANDI Travel Info / Inventory sources.

import { webMethod, Permissions } from "wix-web-module";
import { restRequest } from "backend/RIA/supabaseServer.js";

const VERSION="2026.09.10.12";
const STATES=Object.freeze({
  IDLE:"IDLE",
  SUPPORT_ISSUE:"SUPPORT_ISSUE",
  SUPPORT_EMAIL:"SUPPORT_EMAIL",
  BAGGAGE_AIRLINE:"BAGGAGE_AIRLINE",
  AIRPORT_CODE:"AIRPORT_CODE",
  AIRLINE_CODE:"AIRLINE_CODE",
  REQUIREMENTS_DESTINATION:"REQUIREMENTS_DESTINATION",
  BOOKING_REFERENCE:"BOOKING_REFERENCE"
});
const INTENTS=[
  {intent:"GREETING",patterns:["hello","hi","hey","hej","hello alexandra","good morning","good evening"]},
  {intent:"BAGGAGE",patterns:["baggage","bag allowance","luggage","checked bag","carry on","hand baggage"]},
  {intent:"AIRLINE",patterns:["airline","onboard","on board","cabin","seat","wifi","wi-fi","meal","aircraft","plane"]},
  {intent:"AIRPORT",patterns:["airport","terminal","lounge","security","airport transfer","arrival hall"]},
  {intent:"REQUIREMENTS",patterns:["passport","visa","entry requirement","travel requirement","immigration","transit rule"]},
  {intent:"TRANSFER",patterns:["transfer","coach","bus transfer","pickup","pick up","meeting point"]},
  {intent:"HOTEL",patterns:["hotel","room","check in hotel","accommodation","resort"]},
  {intent:"TOUR",patterns:["tour","activity","excursion","ticket","voucher","things to do"]},
  {intent:"BOOKING",patterns:["booking","reservation","pnr","my trip","change booking","cancel booking","booking reference"]},
  {intent:"SUPPORT",patterns:["support","human","agent","person","ticket","contact someone","speak to someone","help me"]}
];
const clean=(v,n=12000)=>String(v??"").trim().slice(0,n);
const lower=v=>clean(v).toLowerCase();
const arr=v=>Array.isArray(v)?v:[];
const obj=v=>v&&typeof v==="object"&&!Array.isArray(v)?v:{};
function sessionOf(value={}){const s=obj(value);return{currentState:Object.values(STATES).includes(s.currentState)?s.currentState:STATES.IDLE,userData:obj(s.userData),history:arr(s.history).slice(-20)}}
function detect(message){for(const m of INTENTS)if(m.patterns.some(p=>message.includes(p)))return m.intent;return null}
function airlineCode(input){const m=clean(input,200).toUpperCase().match(/\b[A-Z0-9]{2}\b/);return m?m[0]:""}
function airportCode(input){const m=clean(input,200).toUpperCase().match(/\b[A-Z]{3}\b/);return m?m[0]:""}
async function select(table,query={}){const r=await restRequest({table,method:"GET",query,prefer:""});return arr(r)}
function response(reply,s,extra={}){return{ok:true,version:VERSION,reply,answer:reply,updatedSession:s,...extra}}
function pushHistory(s,role,text){s.history=[...s.history,{role,text:clean(text,2000),at:new Date().toISOString()}].slice(-20)}
async function findAirline(codeOrName){const rows=await select("travel_info_airlines",{select:"*",active:"eq.true",customer_visible:"eq.true",published:"eq.true",limit:"100"});const q=lower(codeOrName);return rows.find(r=>lower(r.iataCode)===q||lower(r.Title)===q||lower(r.shortName)===q)||rows.find(r=>`${lower(r.Title)} ${lower(r.shortName)} ${lower(r.iataCode)}`.includes(q))||null}
async function findAirport(codeOrName){const rows=await select("travel_info_airports",{select:"*",active:"eq.true",customer_visible:"eq.true",published:"eq.true",limit:"100"});const q=lower(codeOrName);return rows.find(r=>lower(r.iata)===q)||rows.find(r=>`${lower(r.title)} ${lower(r.locationCity)} ${lower(r.iata)}`.includes(q))||null}
function baggageText(a={}){const raw=clean(a.baggageAllowence,16000);if(!raw)return"I don't have a published baggage allowance for this airline yet.";try{const x=JSON.parse(raw);return typeof x==="string"?x:JSON.stringify(x,null,2)}catch(_){return raw}}
async function createSupport(data={}){const ticket=`TRAVEL-${Date.now()}-${Math.random().toString(36).slice(2,7).toUpperCase()}`;await restRequest({table:"travel_info_support_requests",method:"POST",body:{title:`Alexandra support ${ticket}`,slug:ticket.toLowerCase(),category:clean(data.category||"Alexandra",120),body:clean(data.issue,12000),image_url:"",active:true,sort_order:0,payload:{ticketId:ticket,email:clean(data.email,400).toLowerCase(),name:clean(data.name,300),bookingReference:clean(data.bookingReference,120),source:"alexandra-v9-12",status:"New",createdAt:new Date().toISOString()}},prefer:"return=representation"});return ticket}
async function searchInventory(types,query){const rows=await select("inventory_master_entities",{select:"id,public_id,entity_type,code,name,slug,status,active,customer_visible,altea_visible,details,commercial,operations",active:"eq.true",customer_visible:"eq.true",status:"eq.PUBLISHED",limit:"500"});const set=new Set(types);const q=lower(query);return rows.filter(r=>set.has(clean(r.entity_type).toUpperCase())&&(!q||`${lower(r.name)} ${lower(r.code)} ${lower(JSON.stringify(r.details||{}))}`.includes(q))).slice(0,6)}

export const processAlexandraMessage=webMethod(Permissions.Anyone,async(input={})=>{
  const message=clean(input.message||input.question,2000);if(!message)return{ok:false,reply:"Please type a message.",updatedSession:sessionOf(input.session)};
  const s=sessionOf(input.session);pushHistory(s,"user",message);const v=lower(message);let reply="",action=null,cards=[];

  switch(s.currentState){
    case STATES.SUPPORT_ISSUE:
      s.userData.issue=message;s.currentState=STATES.SUPPORT_EMAIL;reply="Got it. What email address should SKANDI use for updates?";break;
    case STATES.SUPPORT_EMAIL:{
      const email=message.match(/\b[^\s@]+@[^\s@]+\.[^\s@]+\b/i)?.[0]||"";
      if(!email){reply="That email address doesn't look complete. Please enter a valid email address.";break}
      s.userData.email=email;const ticket=await createSupport(s.userData);s.currentState=STATES.IDLE;reply=`Thank you. I created support request ${ticket}. The SKANDI team can use ${email} for updates.`;action={type:"SUPPORT_CREATED",ticketId:ticket};break;
    }
    case STATES.BAGGAGE_AIRLINE:{
      const a=await findAirline(message);if(!a){reply="I couldn't match that airline. Try its name or two-letter IATA code.";break}reply=`${a.Title||a.shortName||a.iataCode}: ${baggageText(a)}`;s.currentState=STATES.IDLE;action={type:"OPEN_AIRLINE",airlineId:a.ID,airlineCode:a.iataCode};break;
    }
    case STATES.AIRLINE_CODE:{
      const a=await findAirline(message);if(!a){reply="I couldn't match that airline. Try its name or IATA code.";break}reply=`I found ${a.Title||a.shortName}. I can open its airline guide and the interactive aircraft, cabin and seat experience.`;s.currentState=STATES.IDLE;action={type:"OPEN_AIRLINE",airlineId:a.ID,airlineCode:a.iataCode};break;
    }
    case STATES.AIRPORT_CODE:{
      const a=await findAirport(message);if(!a){reply="I couldn't match that airport. Try the airport name, city or three-letter IATA code.";break}reply=`I found ${a.title||a.iata}. I can open terminals, transport, lounges and practical airport information.`;s.currentState=STATES.IDLE;action={type:"OPEN_AIRPORT",airportId:a.ID,airportCode:a.iata};break;
    }
    case STATES.REQUIREMENTS_DESTINATION:
      s.userData.destination=message;s.currentState=STATES.IDLE;reply="Travel requirements depend on nationality, routing and travel date. I can open the requirements tool for this destination; always verify final entry rules with the relevant authorities before travel.";action={type:"OPEN_REQUIREMENTS",destination:message};break;
    case STATES.BOOKING_REFERENCE:
      s.userData.bookingReference=clean(message,120);s.currentState=STATES.IDLE;reply="For privacy, I won't expose personal booking details from an unauthenticated reference in chat. Open My Trips while signed in, or I can create a support request and include this reference.";action={type:"OPEN_MY_TRIPS",bookingReference:s.userData.bookingReference};break;
    default:{
      const intent=detect(v);
      if(intent==="GREETING")reply="Hi, I'm Alexandra, SKANDI Travels' digital customer service agent. I can help with baggage, airports, airlines and onboard experience, travel requirements, hotels, transfers, tours, bookings or human support.";
      else if(intent==="BAGGAGE"){const c=airlineCode(message);if(c){const a=await findAirline(c);if(a){reply=`${a.Title||a.shortName}: ${baggageText(a)}`;action={type:"OPEN_AIRLINE",airlineId:a.ID,airlineCode:a.iataCode}}else{s.currentState=STATES.BAGGAGE_AIRLINE;reply="Which airline are you flying with?"}}else{s.currentState=STATES.BAGGAGE_AIRLINE;reply="Which airline are you flying with? Give me the airline name or IATA code."}}
      else if(intent==="AIRLINE"){const c=airlineCode(message);if(c){const a=await findAirline(c);if(a){reply=`I found ${a.Title||a.shortName}. Open its interactive aircraft, cabin and seat experience below.`;action={type:"OPEN_AIRLINE",airlineId:a.ID,airlineCode:a.iataCode}}else{s.currentState=STATES.AIRLINE_CODE;reply="Which airline should I open?"}}else{s.currentState=STATES.AIRLINE_CODE;reply="Which airline would you like to explore?"}}
      else if(intent==="AIRPORT"){const c=airportCode(message);if(c){const a=await findAirport(c);if(a){reply=`I found ${a.title||c}.`;action={type:"OPEN_AIRPORT",airportId:a.ID,airportCode:a.iata}}else{s.currentState=STATES.AIRPORT_CODE;reply="Which airport should I look up?"}}else{s.currentState=STATES.AIRPORT_CODE;reply="Which airport? You can give me the name, city or IATA code."}}
      else if(intent==="REQUIREMENTS"){s.currentState=STATES.REQUIREMENTS_DESTINATION;reply="What destination are you travelling to?"}
      else if(intent==="TRANSFER"){cards=await searchInventory(["TRANSFER"],message.replace(/transfer|coach|bus|pickup|meeting point/ig,""));reply=cards.length?`I found ${cards.length} published SKANDI transfer option${cards.length===1?"":"s"}.`:`I couldn't match a published transfer from that message. You can browse Transfers or tell me the airport/destination.`;action={type:"OPEN_LIBRARY",library:"transfers"}}
      else if(intent==="HOTEL"){cards=await searchInventory(["HOTEL"],message.replace(/hotel|accommodation|resort/ig,""));reply=cards.length?`I found ${cards.length} published hotel match${cards.length===1?"":"es"}.`:`I can open the SKANDI hotel information library.`;action={type:"OPEN_LIBRARY",library:"hotels"}}
      else if(intent==="TOUR"){cards=await searchInventory(["GUIDED_TOUR","ACTIVITY","PARTNER_TICKET"],message.replace(/tour|activity|excursion|ticket|voucher/ig,""));reply=cards.length?`I found ${cards.length} published experience match${cards.length===1?"":"es"}.`:`I can open tours, activities and ticket information.`;action={type:"OPEN_LIBRARY",library:"tours"}}
      else if(intent==="BOOKING"){s.currentState=STATES.BOOKING_REFERENCE;reply="I can help route you to your trip securely. What is your SKANDI booking reference?"}
      else if(intent==="SUPPORT"){s.currentState=STATES.SUPPORT_ISSUE;reply="I can open a support request. Please describe what happened or what you need help with."}
      else reply="I didn't find a precise match yet. Try an airline or airport code, ask about baggage, passport/visa, a transfer, hotel, tour, booking, or say ‘contact support’.";
    }
  }
  pushHistory(s,"assistant",reply);
  return response(reply,s,{action,cards:cards.map(r=>({id:r.id,type:r.entity_type,code:r.code,name:r.name,slug:r.slug}))});
});
