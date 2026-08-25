// backend/FINAL/flightStatusService.web.js
// Self-contained Aviationstack implementation. Do not combine with legacy
// flightStatusProvider.js / flightStatusMapper.js.

import { webMethod, Permissions } from "wix-web-module";
import { secrets } from "wix-secrets-backend.v2";
import { elevate } from "wix-auth";
import { fetch } from "wix-fetch";

const getSecretValue = elevate(secrets.getSecretValue);
const BASE = "https://api.aviationstack.com/v1";

function clean(v,max=300){return String(v??"").trim().slice(0,max)}
function upper(v){return clean(v).toUpperCase()}
function secretText(r){
  if(typeof r==="string") return r.trim();
  return clean(r?.value ?? r?.secretValue ?? r?.secret?.value ?? "",5000);
}
async function apiKey(){
  for(const name of ["AVIATIONSTACK_API_KEY","AVIATIONSTACK_ACCESS_KEY","aviationstack","AVIATIONSTACK"]){
    try{
      const value=secretText(await getSecretValue(name));
      if(value) return value;
    }catch(_){}
  }
  throw new Error("AVIATIONSTACK_API_KEY_MISSING");
}
function validDate(v){
  const value=clean(v,10);
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : new Date().toISOString().slice(0,10);
}
function normalize(item={}){
  const d=item.departure||{}, a=item.arrival||{}, f=item.flight||{}, airline=item.airline||{};
  return {
    flightIata:f.iata||item.flight_iata||"",
    flightIcao:f.icao||item.flight_icao||"",
    flightNumber:f.number||item.flight_number||"",
    airlineName:airline.name||item.airline_name||"",
    airlineIata:airline.iata||item.airline_iata||"",
    status:item.flight_status||item.status||"scheduled",
    departure:{
      airport:d.airport||"",iata:d.iata||"",icao:d.icao||"",
      terminal:d.terminal||"",gate:d.gate||"",
      scheduled:d.scheduled||"",estimated:d.estimated||"",actual:d.actual||"",delay:d.delay||""
    },
    arrival:{
      airport:a.airport||"",iata:a.iata||"",icao:a.icao||"",
      terminal:a.terminal||"",gate:a.gate||"",
      scheduled:a.scheduled||"",estimated:a.estimated||"",actual:a.actual||"",delay:a.delay||""
    },
    aircraft:item.aircraft||{},
    live:item.live||null
  };
}
async function call(params={}){
  const key=await apiKey();
  const q=new URLSearchParams({access_key:key,limit:"100",...params});
  const res=await fetch(`${BASE}/flights?${q.toString()}`);
  const raw=await res.text();
  const json=raw?JSON.parse(raw):{};
  if(!res.ok || json.error) throw new Error(json?.error?.message||`AVIATIONSTACK_HTTP_${res.status}`);
  return json;
}
function validate(payload={}){
  const mode=clean(payload.mode||"flight").toLowerCase();
  const out={
    mode:["flight","route","airport"].includes(mode)?mode:"flight",
    flightNumber:upper(payload.flightNumber),
    from:upper(payload.from),
    to:upper(payload.to),
    airport:upper(payload.airport),
    date:validDate(payload.date),
    boardType:clean(payload.boardType||"departures").toLowerCase()==="arrivals"?"arrivals":"departures"
  };
  if(out.mode==="flight"&&!out.flightNumber) throw new Error("Enter a flight number.");
  if(out.mode==="route"&&!out.from&&!out.to) throw new Error("Enter at least a From or To airport.");
  if(out.mode==="airport"&&!out.airport) throw new Error("Enter an airport code.");
  return out;
}

export const searchFlightStatus = webMethod(
  Permissions.Anyone,
  async (payload={}) => {
    const p=validate(payload);
    const params={flight_date:p.date};
    if(p.mode==="flight") params.flight_iata=p.flightNumber;
    if(p.mode==="route"){
      if(p.from) params.dep_iata=p.from;
      if(p.to) params.arr_iata=p.to;
    }
    if(p.mode==="airport"){
      params[p.boardType==="arrivals"?"arr_iata":"dep_iata"]=p.airport;
    }

    const json=await call(params);
    return {
      ok:true,
      items:(Array.isArray(json.data)?json.data:[]).map(normalize),
      pagination:json.pagination||{},
      source:"aviationstack",
      searchedAt:new Date().toISOString()
    };
  }
);
