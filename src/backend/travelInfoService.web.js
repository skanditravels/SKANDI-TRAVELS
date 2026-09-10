// backend/travelInfoService.web.js
// SKANDI Travel Info V9 — Inventory Control + Aircraft Display Control unified public service.
// Version 2026.09.10.11

import { webMethod, Permissions } from "wix-web-module";
import { fetch } from "wix-fetch";
import { secrets } from "wix-secrets-backend.v2";
import { elevate } from "wix-auth";
import { restRequest } from "backend/RIA/supabaseServer.js";

const elevatedGetSecretValue = elevate(secrets.getSecretValue);
const VERSION = "2026.09.10.11";
const PUBLIC_AIRCRAFT_STATUS = "PUBLISHED";
const SUPPORTED_LANGUAGES = new Set(["EN","SV","NO","DA","FI"]);

const clean = (v, max=8000) => String(v ?? "").trim().slice(0,max);
const upper = (v, max=8000) => clean(v,max).toUpperCase();
const arr = v => Array.isArray(v) ? v : [];
const obj = v => v && typeof v === "object" && !Array.isArray(v) ? v : {};
const num = v => Number.isFinite(Number(v)) ? Number(v) : null;
const first = (...xs) => xs.find(v => v !== undefined && v !== null && v !== "") ?? "";

function parseJson(value, fallback=null) {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "object") return value;
  try { return JSON.parse(String(value)); } catch (_) { return fallback; }
}
function slug(value) {
  return clean(value,240).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .replace(/&/g," and ").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");
}
function normalizeLanguage(value) {
  const lang = upper(value,8);
  return SUPPORTED_LANGUAGES.has(lang) ? lang : "EN";
}
function publicInventoryEntity(row={}) {
  return row.active === true && row.customer_visible === true && upper(row.status,30) === "PUBLISHED";
}
function publicAircraft(row={}) {
  return row.active === true && row.customer_visible === true && upper(row.status,30) === PUBLIC_AIRCRAFT_STATUS;
}
function normalizedStringArray(value) {
  if (Array.isArray(value)) return value.map(x=>clean(x,500)).filter(Boolean);
  const parsed = parseJson(value, null);
  if (Array.isArray(parsed)) return parsed.map(x=>clean(x,500)).filter(Boolean);
  return clean(value,4000) ? [clean(value,4000)] : [];
}

async function select(table, query={}) {
  const result = await restRequest({ table, method:"GET", query, prefer:"" });
  return arr(result);
}
async function insert(table, body) {
  const result = await restRequest({ table, method:"POST", body, prefer:"return=representation" });
  return arr(result)[0] || null;
}

function airlineRecord(row={}, aircraftCount=0) {
  const baggageParsed = parseJson(row.baggageAllowence, null);
  const baggage = Array.isArray(baggageParsed) || (baggageParsed && typeof baggageParsed === "object")
    ? { mode:"structured", data:baggageParsed }
    : { mode:"narrative", text:clean(row.baggageAllowence,16000) };
  return {
    id: clean(row.ID || row["Record ID"] || row.iataCode,180),
    name: clean(row.Title || row.shortName,240),
    shortName: clean(row.shortName || row.Title,120),
    iataCode: upper(row.iataCode,8),
    icaoCode: upper(row.icaoCode,8),
    country: clean(row.locationCountry,120),
    city: clean(row.locationCity,120),
    alliance: clean(row.alliance,120),
    brandGroup: clean(row.brandGroup,120),
    website: clean(row.website,1200),
    contactUrl: clean(row.contactUrl,1200),
    summary: clean(row.summary,12000),
    logo: clean(row.logoFile || row.logoIcon,1800),
    logoIcon: clean(row.logoIcon,1800),
    heroImage: clean(row.heroAircraftUrl,1800),
    primaryColor: clean(row.primaryColor,40),
    accentColor: clean(row.accentColor,40),
    quickFacts: parseJson(row.quickFactsJson, []),
    hubs: parseJson(row.hubsJson, []),
    sections: parseJson(row.sectionsJson, {}),
    foodDrinks: parseJson(row.foodDrinksJson, []),
    wifiOnboard: parseJson(row.wifiOnboardJson, []),
    delayCancellation: parseJson(row.delayCancellationJson, []),
    damagedBaggage: parseJson(row.damagedBaggageJson, []),
    lostFound: parseJson(row.lostFoundJson, []),
    childrenInfants: parseJson(row.childrenInfantsJson, []),
    ticketTypes: parseJson(row.ticketTypesJson, []),
    checkInDeadline: clean(row.checkInDeadline,1200),
    boarding: clean(row.boarding,6000),
    lounges: clean(row.lounges,6000),
    loyaltyProgram: clean(row.loyaltyProgram,240),
    loyaltyProgramUrl: clean(row.loyaltyProgramUrl,1200),
    baggage,
    aircraftFamilies: normalizedStringArray(row.aircraftFamiliesText),
    aircraftCount,
    sourceUrls: normalizedStringArray(row.sourceUrlsJson),
    lastReviewed: clean(row.lastReviewed,80)
  };
}

function airportRecord(row={}) {
  return {
    id: clean(row.ID || row.itemId || row.iata,180),
    code: upper(row.iata,8),
    iata: upper(row.iata,8),
    icao: upper(row.icao,8),
    name: clean(row.title,240),
    city: clean(row.locationCity,160),
    country: clean(row.country,160),
    timezone: clean(row.timezone,120),
    latitude: num(row.latitude),
    longitude: num(row.longitude),
    distanceToCityCenterKm: num(row.distanceToCityCenterKm),
    website: clean(row.website,1200),
    contactUrl: clean(row.contactUrl,1200),
    summary: clean(row.summary || row.body,12000),
    information: clean(row.information,12000),
    heroImage: clean(row.heroImageUrl || row.image_url,1800),
    logo: clean(row.logoUrl || row.logoIconUrl,1800),
    quickFacts: arr(row.quickFactsJson),
    transport: arr(row.transportJson),
    terminals: arr(row.terminalsJson),
    runways: arr(row.runwaysJson),
    foodDrinks: arr(row.foodDrinksJson),
    lostFound: arr(row.lostFoundJson),
    lounges: clean(row.lounges,6000),
    airportHotels: clean(row.airportHotels,6000),
    destinationsServing: clean(row.destinationsServing,6000),
    sections: arr(row.sectionsJson),
    lastReviewed: clean(row.lastReviewed,80)
  };
}

function localizedFor(entityId, language, rows=[]) {
  const exact = rows.find(r => clean(r.entity_id,80) === entityId && upper(r.language,8) === language);
  const en = rows.find(r => clean(r.entity_id,80) === entityId && upper(r.language,8) === "EN");
  return exact || en || {};
}
function mediaFor(entityId, rows=[]) {
  return rows.filter(r => clean(r.entity_id,80) === entityId && r.active !== false)
    .sort((a,b)=>Number(a.sort_order||0)-Number(b.sort_order||0));
}
function inventoryRecord(row={}, localizedRows=[], mediaRows=[], language="EN") {
  const id = clean(row.id,80);
  const l = localizedFor(id, language, localizedRows);
  const details = obj(row.details); const commercial = obj(row.commercial); const operations = obj(row.operations); const payload = obj(row.payload);
  const media = mediaFor(id, mediaRows);
  const hero = media.find(x=>x.is_hero===true) || media.find(x=>x.is_primary===true) || media[0] || {};
  const type = upper(row.entity_type,40);
  return {
    id, publicId:clean(row.public_id,160), type,
    code:clean(row.code,160), name:clean(l.title || row.name,300), title:clean(l.title || row.name,300), slug:clean(row.slug || slug(row.name),240),
    eyebrow:clean(l.eyebrow,240), summary:clean(l.short_description || first(details.summary,payload.summary),12000),
    description:clean(l.full_description || first(details.description,payload.description),24000),
    highlights:arr(l.highlights), included:arr(l.included), notIncluded:arr(l.not_included), importantInformation:clean(l.important_information,12000),
    heroImage:clean(hero.url || first(details.heroImage,payload.heroImage),1800),
    gallery:media.map(m=>({url:clean(m.url,1800),alt:clean(m.alt_text,400),caption:clean(m.caption,1000),role:clean(m.role,80)})),
    details, commercial, operations, payload,
    city:clean(first(details.city,operations.city,payload.city),160), country:clean(first(details.country,operations.country,payload.country),160),
    destination:clean(first(details.destination,operations.destination,payload.destination),200),
    durationText:clean(first(details.durationText,operations.durationText,payload.durationText),200),
    meetingPoint:clean(first(details.meetingPoint,operations.meetingPoint,payload.meetingPoint),1000),
    fromLocation:clean(first(details.fromLocation,operations.fromLocation,payload.fromLocation),1000),
    toLocation:clean(first(details.toLocation,operations.toLocation,payload.toLocation),1000),
    starRating:num(first(details.starRating,payload.starRating)),
    bookingUrl:clean(first(commercial.bookingUrl,payload.bookingUrl),1600),
    partnerTier:clean(row.partner_tier,80), featured:row.featured===true
  };
}

function faqGroup(row={}) { return { id:clean(row.group_id || row.id,120), title:clean(row.title,300), subtitle:clean(row.subtitle,1200), eyebrow:clean(row.eyebrow,240), icon:clean(row.icon,80), sortOrder:Number(row.sort_order||0) }; }
function faq(row={}) { return { id:clean(row.topicId || row.id,120), groupId:clean(row.groupId,120), title:clean(row.title,500), subtitle:clean(row.subtitle,1000), body:clean(row.body,16000), bullets:arr(row.bulletsJson), tags:clean(row.tags,1200), featured:row.featured===true, actionType:clean(row.actionType,80), actionTarget:clean(row.actionTarget,1200), linkedLibrary:clean(row.linkedLibrary,80), sortOrder:Number(row.sort_order||0) }; }

function requirementRecord(row={}) {
  const p = obj(row.payload);
  return { id:clean(row.id,80), title:clean(row.title,300), slug:clean(row.slug,240), category:clean(row.category,120), body:clean(row.body,16000), image:clean(row.image_url,1800), ...p };
}

async function buildTravelInfoPayload(input={}) {
  const language = normalizeLanguage(input.language);
  const [airlinesRaw, airportsRaw, aircraftRaw, groupsRaw, faqRaw, articlesRaw, entitiesRaw, localizedRaw, mediaRaw, requirementsRaw] = await Promise.all([
    select("travel_info_airlines", {select:"*",active:"eq.true",customer_visible:"eq.true",published:"eq.true",order:"sort_order.asc"}),
    select("travel_info_airports", {select:"*",active:"eq.true",customer_visible:"eq.true",published:"eq.true",order:"sort_order.asc"}),
    select("travel_info_aircraft", {select:"id,airline_id,airline_code,status,active,customer_visible",active:"eq.true",customer_visible:"eq.true",status:"eq.PUBLISHED"}),
    select("travel_info_faq_groups", {select:"*",active:"eq.true",order:"sort_order.asc"}),
    select("travel_info_faq", {select:"*",active:"eq.true",order:"sort_order.asc"}),
    select("travel_info_articles", {select:"*",active:"eq.true",customer_visible:"eq.true",order:"sort_order.asc"}),
    select("inventory_master_entities", {select:"*",entity_type:"in.(HOTEL,TRANSFER,TOUR,ACTIVITY,TICKET)",active:"eq.true",customer_visible:"eq.true",status:"eq.PUBLISHED",order:"sort_priority.asc"}),
    select("inventory_localized_content", {select:"*",language:`in.(EN,${language})`}),
    select("inventory_media_assets", {select:"*",active:"eq.true",order:"sort_order.asc"}),
    select("travel_requirements", {select:"*",active:"eq.true",order:"sort_order.asc"})
  ]);

  const counts = {};
  aircraftRaw.forEach(a => { const k=clean(a.airline_id || a.airline_code,180); if(k) counts[k]=(counts[k]||0)+1; });
  const airlines = airlinesRaw.map(r => airlineRecord(r, counts[clean(r.ID,180)] || counts[upper(r.iataCode,8)] || 0));
  const records = entitiesRaw.filter(publicInventoryEntity).map(r=>inventoryRecord(r,localizedRaw,mediaRaw,language));
  const byType = type => records.filter(r=>r.type===type);

  return {
    ok:true,
    source:"SKANDI_TRAVEL_INFO_V9",
    version:VERSION,
    generatedAt:new Date().toISOString(),
    language,
    airlines,
    airports:airportsRaw.map(airportRecord),
    hotels:byType("HOTEL"),
    transfers:byType("TRANSFER"),
    tours:byType("TOUR"),
    activities:byType("ACTIVITY"),
    tickets:byType("TICKET"),
    helpCenter:{groups:groupsRaw.map(faqGroup),topics:faqRaw.map(faq)},
    articles:articlesRaw.map(r=>({id:clean(r.id,80),title:clean(r.title,400),slug:clean(r.slug,240),category:clean(r.category,120),excerpt:clean(r.excerpt,2000),body:clean(r.body,20000),image:clean(r.image_url,1800),path:clean(r.path,1000),kicker:clean(r.kicker,240),tags:arr(r.tags)})),
    travelRequirements:requirementsRaw.map(requirementRecord),
    sync:{
      airlines:airlines.length, airports:airportsRaw.length, aircraft:aircraftRaw.length,
      hotels:byType("HOTEL").length, transfers:byType("TRANSFER").length, tours:byType("TOUR").length,
      activities:byType("ACTIVITY").length, tickets:byType("TICKET").length,
      faq:faqRaw.length, faqGroups:groupsRaw.length, articles:articlesRaw.length, requirements:requirementsRaw.length
    }
  };
}

export const getTravelInfoPayload = webMethod(Permissions.Anyone, async (input={}) => buildTravelInfoPayload(input));

export const getTravelInfoAircraft = webMethod(Permissions.Anyone, async (input={}) => {
  const aircraftId = clean(input.aircraftId,80);
  const airlineId = clean(input.airlineId,180);
  const airlineCode = upper(input.airlineCode,8);
  const query = {select:"*",active:"eq.true",customer_visible:"eq.true",status:"eq.PUBLISHED",order:"sort_order.asc"};
  if (aircraftId) query.id = `eq.${aircraftId}`;
  else if (airlineId) query.airline_id = `eq.${airlineId}`;
  else if (airlineCode) query.airline_code = `eq.${airlineCode}`;
  else return {ok:false,error:"AIRLINE_OR_AIRCRAFT_REQUIRED",aircraft:[]};

  const aircraft = (await select("travel_info_aircraft", query)).filter(publicAircraft);
  const ids = aircraft.map(a=>clean(a.id,80)).filter(Boolean);
  if (!ids.length) return {ok:true,aircraft:[],cabins:[],views:[],hotspots:[],scenes:[],sceneHotspots:[]};
  const inIds = `in.(${ids.join(",")})`;
  const [cabins,views,scenes] = await Promise.all([
    select("travel_info_aircraft_cabins", {select:"*",aircraft_id:inIds,active:"eq.true",order:"sort_order.asc"}),
    select("travel_info_aircraft_views", {select:"*",aircraft_id:inIds,active:"eq.true",order:"sort_order.asc"}),
    select("travel_info_aircraft_walk_scenes", {select:"*",aircraft_id:inIds,active:"eq.true",order:"sort_order.asc"})
  ]);
  const viewIds = views.map(v=>clean(v.id,80)).filter(Boolean);
  const sceneIds = scenes.map(v=>clean(v.id,80)).filter(Boolean);
  const [hotspots,sceneHotspots] = await Promise.all([
    viewIds.length ? select("travel_info_aircraft_hotspots", {select:"*",view_id:`in.(${viewIds.join(",")})`,active:"eq.true",order:"sort_order.asc"}) : [],
    sceneIds.length ? select("travel_info_aircraft_scene_hotspots", {select:"*",scene_id:`in.(${sceneIds.join(",")})`,active:"eq.true",order:"sort_order.asc"}) : []
  ]);
  return {ok:true,source:"AIRCRAFT_DISPLAY_CONTROL_V9",aircraft,cabins,views,hotspots,scenes,sceneHotspots};
});

export const createTravelInfoSupportRequest = webMethod(Permissions.Anyone, async (input={}) => {
  const message = clean(input.message,12000);
  if (!message) return {ok:false,error:"MESSAGE_REQUIRED",message:"Please enter a message."};
  const now = new Date().toISOString();
  const ticket = `TRAVEL-${Date.now()}-${Math.random().toString(36).slice(2,7).toUpperCase()}`;
  const saved = await insert("travel_info_support_requests", {
    title:`Travel Info request ${ticket}`,
    slug:ticket.toLowerCase(),
    category:clean(input.category || "General",120),
    body:message,
    image_url:"",
    active:true,
    sort_order:0,
    payload:{ticketId:ticket,name:clean(input.name,300),email:clean(input.email,400).toLowerCase(),bookingReference:clean(input.bookingReference,120),source:"travel-info-v9",status:"New",createdAt:now}
  });
  return {ok:true,ticketId:ticket,id:saved?.id || "",message:"Your request has been received."};
});

async function openWeatherKey() {
  const r = await elevatedGetSecretValue("OPENWEATHER_API_KEY");
  return clean(r?.value ?? r?.secretValue ?? r?.secret?.value ?? r,500);
}
export const getTravelWeather = webMethod(Permissions.Anyone, async (input={}) => {
  const key = await openWeatherKey();
  if (!key) return {ok:false,source:"OPENWEATHER",locations:[],error:"WEATHER_NOT_CONFIGURED"};
  const locations = arr(input.locations).slice(0,8);
  if (!locations.length) return {ok:true,source:"OPENWEATHER",locations:[]};
  const output=[];
  for (const l of locations) {
    const lat=num(l.latitude ?? l.lat), lon=num(l.longitude ?? l.lng ?? l.lon);
    if (lat===null || lon===null) continue;
    const url=`https://api.openweathermap.org/data/2.5/weather?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&appid=${encodeURIComponent(key)}&units=metric`;
    try {
      const response=await fetch(url,{method:"get"}); const raw=await response.json();
      if(!response.ok) throw new Error("WEATHER_HTTP_"+response.status);
      output.push({ok:true,id:clean(l.id||l.code,120),title:clean(l.title||l.name,240),latitude:lat,longitude:lon,tempC:num(raw?.main?.temp),feelsLikeC:num(raw?.main?.feels_like),humidity:num(raw?.main?.humidity),condition:clean(raw?.weather?.[0]?.main,120),description:clean(raw?.weather?.[0]?.description,240),icon:clean(raw?.weather?.[0]?.icon,20)});
    } catch(error) { output.push({ok:false,id:clean(l.id||l.code,120),title:clean(l.title||l.name,240),error:clean(error?.message,240)}); }
  }
  return {ok:true,source:"OPENWEATHER",generatedAt:new Date().toISOString(),locations:output};
});

function tokenize(s="") { return clean(s,4000).toLowerCase().split(/[^a-z0-9]+/).filter(x=>x.length>2); }
export const askTravelInfoAgent = webMethod(Permissions.Anyone, async (input={}) => {
  const question=clean(input.question,2000); if(!question) return {ok:false,answer:"Please enter a travel question."};
  const data=await buildTravelInfoPayload({language:input.language||"EN"});
  const terms=new Set(tokenize(question));
  const pool=[...arr(data?.helpCenter?.topics).map(x=>({...x,kind:"FAQ"})),...arr(data?.airlines).map(x=>({...x,kind:"Airline"})),...arr(data?.airports).map(x=>({...x,kind:"Airport"}))];
  const scored=pool.map(x=>{const text=tokenize(`${x.title||x.name||""} ${x.subtitle||""} ${x.body||x.summary||""}`);let score=0;text.forEach(t=>{if(terms.has(t))score+=1});return{x,score}}).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,3);
  if(!scored.length) return {ok:true,answer:"I couldn't find a precise match in the current SKANDI Travel Info library. Please use the support form for itinerary-specific help.",matches:[]};
  const best=scored[0].x; const answer=clean(best.body || best.summary || best.subtitle || `${best.title||best.name} is available in SKANDI Travel Info.`,1800);
  return {ok:true,answer,matches:scored.map(s=>({kind:s.x.kind,title:s.x.title||s.x.name||"",score:s.score}))};
});
