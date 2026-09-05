import { webMethod, Permissions } from "wix-web-module";
import { getSecret } from "wix-secrets-backend";
import { fetch } from "wix-fetch";

const TABLES = Object.freeze({
  airlines:"travel_info_airlines", airports:"travel_info_airports",
  hotels:"travel_info_hotels", transfers:"travel_info_transfers",
  tours:"travel_info_tours", activities:"travel_info_activities",
  tickets:"travel_info_tickets", faq:"travel_info_faq",
  faqGroups:"travel_info_faq_groups", articles:"travel_info_articles",
  requirements:"travel_requirements", baggage:"baggage_allowance",
  support:"travel_info_support_requests"
});
let configPromise=null;
const text=(v,m=10000)=>String(v??"").trim().slice(0,m);
const obj=v=>v&&typeof v==="object"&&!Array.isArray(v)?v:{};
function arr(v){if(Array.isArray(v))return v;if(v==null||v==="")return[];if(typeof v==="string"){try{const p=JSON.parse(v);return Array.isArray(p)?p:[p]}catch(_){return[v]}}return[v]}
const first=(...v)=>v.find(x=>x!==undefined&&x!==null&&String(x).trim()!=="");
const num=(v,f=null)=>Number.isFinite(Number(v))?Number(v):f;
const has=(o,k)=>Object.prototype.hasOwnProperty.call(o||{},k);
function parse(v,f=null){if(v&&typeof v==="object")return v;if(typeof v==="string"&&v.trim()){try{return JSON.parse(v)}catch(_){}}return f}
function safeSlug(v){return text(v,180).toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}
function titleFromSlug(v){return text(v,180).replace(/^\/+|\/+$/g,"").split("/").pop().replace(/[-_]+/g," ").replace(/\b\w/g,c=>c.toUpperCase())}
function publicMedia(v){const raw=text(v,3000);if(!raw)return"";if(/^https:\/\//i.test(raw))return raw;const m=raw.match(/^wix:(?:image|vector):\/\/v1\/([^/#]+)/i);return m?`https://static.wixstatic.com/media/${m[1]}`:raw}
function localized(row){const list=arr(row?.localized_content);return list.find(x=>text(x?.language,12).toUpperCase()==="EN")||list[0]||{}}
function inventory(row){return obj(row?.inventory_details)}
function media(row,kind="hero"){const list=arr(row?.media_assets).filter(x=>x&&x.active!==false);const x=(kind==="hero"?list.find(x=>x.isHero===true||x.is_hero===true):null)||(kind==="card"?list.find(x=>x.isCard===true||x.is_card===true):null)||list.find(x=>x.isPrimary===true||x.is_primary===true)||list[0];return publicMedia(x?.url||"")}
function isPublic(row={}){const status=text(row.status,30).toUpperCase();if(status&&status!=="PUBLISHED")return false;if(has(row,"customer_visible")&&row.customer_visible===false)return false;if(has(row,"published")&&row.published===false)return false;if(has(row,"active")&&row.active===false)return false;return true}
function sortRows(rows){return [...rows].sort((a,b)=>{const aa=Number(first(a.sort_order,a.sortOrder,999)),bb=Number(first(b.sort_order,b.sortOrder,999));return aa!==bb?aa-bb:text(first(a.Title,a.title,a.slug)).localeCompare(text(first(b.Title,b.title,b.slug)))})}
async function secret(name){try{return text(await getSecret(name),10000)}catch(_){return""}}
async function config(){if(configPromise)return configPromise;configPromise=(async()=>{const[url,k1,k2]=await Promise.all([secret("SUPABASE_URL"),secret("SUPABASE_SECRET_KEY"),secret("SUPABASE_SERVICE_ROLE_KEY")]);const clean=text(url).replace(/\/+$/,""),key=k1||k2;if(!/^https:\/\/[^/]+\.supabase\.co$/i.test(clean))throw new Error("SUPABASE_URL is missing or invalid.");if(!key)throw new Error("Supabase server key is missing.");if(key.startsWith("sb_publishable_"))throw new Error("Travel Info requires a server-only Supabase key.");return{url:clean,key,modern:key.startsWith("sb_secret_")}})();try{return await configPromise}catch(e){configPromise=null;throw e}}
async function db(path,{method="GET",body,prefer=""}={}){const{url,key,modern}=await config();const headers={apikey:key,Accept:"application/json","Content-Type":"application/json"};if(!modern)headers.Authorization=`Bearer ${key}`;if(prefer)headers.Prefer=prefer;const r=await fetch(`${url}/rest/v1/${String(path).replace(/^\/+/,"")}`,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});const raw=await r.text();let data=null;if(raw){try{data=JSON.parse(raw)}catch(_){data=raw}}if(!r.ok)throw new Error(`Supabase ${method} failed (${r.status}): ${typeof data==="string"?data:(data?.message||data?.error||JSON.stringify(data||{}))}`);return data}
async function selectAll(table){const rows=await db(`${table}?select=*`);return sortRows((Array.isArray(rows)?rows:[]).filter(isPublic))}
async function selectSafe(table){try{return await selectAll(table)}catch(e){console.warn(`[Travel Info] ${table}:`,e?.message||e);return[]}}

function sectionObject(v){const p=parse(v,null);return p&&!Array.isArray(p)&&typeof p==="object"?p:{}}
function mapAirline(row={}){
  const inv=inventory(row),loc=localized(row),payload=obj(row.payload);
  const title=first(loc.title,row.Title,row.title,inv.name,payload.name,row.shortName,"Airline");
  const iata=text(first(row.iataCode,inv.iata,payload.iataCode,payload.iata_code),12);
  const baggage=first(row.baggageAllowence,inv.baggageAllowence,payload.baggageAllowence,payload.baggageAllowance);
  const sections=sectionObject(first(row.sectionsJson,inv.sections,payload.sections));
  return {
    ...payload,...inv,
    id:first(row.ID,row["Record ID"],row.id,payload.id,iata),
    recordId:first(row["Record ID"],row.ID,row.id,payload.id),
    title,name:title,shortName:first(row.shortName,inv.shortName,payload.shortName,title),
    initials:iata,iataCode:iata,icaoCode:text(first(row.icaoCode,inv.icao,payload.icaoCode),12),
    country:first(row.locationCountry,inv.country,payload.country,""),
    city:first(row.locationCity,inv.city,payload.city,""),
    alliance:first(row.alliance,inv.alliance,payload.alliance,""),
    brandGroup:first(row.brandGroup,inv.brandGroup,payload.brandGroup,""),
    hub:first(row.hub,inv.hub,payload.hub,""),hubs:parse(first(row.hubsJson,inv.hubs,payload.hubs),[]),
    website:first(row.website,inv.website,payload.website,""),
    contactUrl:first(row.contactUrl,inv.contactUrl,payload.contactUrl,row.website,""),
    summary:first(loc.shortDescription,loc.short_description,row.summary,inv.summary,payload.summary,""),
    intro:first(loc.fullDescription,loc.full_description,row.summary,inv.summary,payload.intro,payload.summary,""),
    logo:publicMedia(first(row.logoFile,row.logoIcon,inv.logoUrl,inv.logoIconUrl,payload.logo,payload.logoUrl,media(row,"card"),"")),
    heroImage:publicMedia(first(row.heroAircraftUrl,inv.heroImageUrl,payload.heroImage,media(row,"hero"),"")),
    color:first(row.primaryColor,inv.primaryColor,payload.primaryColor,"#022e64"),
    accent:first(row.accentColor,inv.accentColor,payload.accentColor,"#d7e6ff"),
    meta:arr(first(row.meta,inv.meta,payload.meta)).length?arr(first(row.meta,inv.meta,payload.meta)):[iata,first(row.locationCountry,inv.country),first(row.alliance,inv.alliance)].filter(Boolean),
    sections,
    baggageAllowence:typeof baggage==="string"?baggage:JSON.stringify(baggage||[]),
    baggageAllowance:parse(baggage,[]),
    checkInDeadline:first(row.checkInDeadline,inv.checkInDeadline,payload.checkInDeadline,""),
    lounges:parse(first(row.lounges,inv.lounges,payload.lounges),first(row.lounges,inv.lounges,"")),
    boarding:parse(first(row.boarding,inv.boarding,payload.boarding),null),
    ticketTypes:parse(first(row.ticketTypesJson,inv.ticketTypes,payload.ticketTypes),null),
    cabins:parse(first(row.cabinsJson,inv.cabins,payload.cabins),null),
    food:parse(first(row.foodDrinksJson,inv.foodDrinks,payload.food,payload.foodDrinks),null),
    wifi:parse(first(row.wifiOnboardJson,inv.wifiOnboard,payload.wifi),null),
    irregularities:parse(first(row.delayCancellationJson,inv.delayCancellation,payload.irregularities),null),
    damaged:parse(first(row.damagedBaggageJson,inv.damagedBaggage,payload.damaged),null),
    lost:parse(first(row.lostFoundJson,inv.lostFound,payload.lost),null),
    kids:parse(first(row.childrenInfantsJson,inv.childrenInfants,payload.kids),null),
    sourceUrls:arr(first(row.sourceUrlsJson,row.servicePolicySourceUrlsJson,inv.sourceUrls,payload.sourceUrls)),
    inflightExperience:first(inv.inflightExperience,payload.inflightExperience,sections.inflightExperience,null),
    aircraftConfigurations:parse(first(row.aircraftConfigurationsJson,inv.aircraftConfigurations,payload.aircraftConfigurations),null),
    fleetSummary:parse(first(row.fleetSummaryJson,inv.fleetSummary,payload.fleetSummary),null),
    loyaltyProgram:first(row.loyaltyProgram,inv.loyaltyProgram,payload.loyaltyProgram,""),
    loyaltyProgramUrl:first(row.loyaltyProgramUrl,inv.loyaltyProgramUrl,payload.loyaltyProgramUrl,"")
  };
}
function mapAirport(row={}){
  const inv=inventory(row),loc=localized(row),payload=obj(row.payload);
  const code=text(first(row.iata,inv.iata,payload.iata,payload.iataCode),3).toUpperCase();
  const title=first(loc.title,row.title,inv.name,payload.name,code||"Airport");
  return {
    ...payload,...inv,
    id:first(row.ID,row.id,row.itemId,code),recordId:first(row.ID,row.id,row.itemId,code),
    code,iata:code,icao:text(first(row.icao,inv.icao,payload.icao),8).toUpperCase(),
    title,name:title,city:first(row.locationCity,inv.city,payload.city,""),
    country:first(row.country,inv.country,payload.country,""),region:first(inv.region,payload.region,""),
    summary:first(loc.shortDescription,loc.short_description,row.summary,row.information,inv.summary,payload.summary,""),
    intro:first(loc.fullDescription,loc.full_description,row.information,row.summary,inv.information,payload.intro,""),
    tagline:first(row.summary,row.information,inv.tagline,payload.tagline,""),
    logo:publicMedia(first(row.logoUrl,row.logoIconUrl,inv.logoUrl,payload.logo,media(row,"card"),"")),
    heroImage:publicMedia(first(row.heroImageUrl,inv.heroImageUrl,payload.heroImage,media(row,"hero"),"")),
    latitude:num(first(row.latitude,inv.latitude,payload.latitude)),longitude:num(first(row.longitude,inv.longitude,payload.longitude)),
    timezone:first(row.timezone,inv.timezone,payload.timezone,""),website:first(row.website,inv.website,payload.website,""),
    contactUrl:first(row.contactUrl,inv.contactUrl,payload.contactUrl,row.website,""),
    distanceToCityCenterKm:num(first(row.distanceToCityCenterKm,inv.distanceToCityCenterKm,payload.distanceToCityCenterKm)),
    quickFacts:arr(first(row.quickFactsJson,inv.quickFacts,payload.quickFacts)).map(x=>parse(x,x)),
    transport:arr(first(row.transportJson,inv.transport,payload.transport)).map(x=>parse(x,x)),
    runways:arr(first(row.runwaysJson,inv.runways,payload.runways)).map(x=>parse(x,x)),
    terminals:arr(first(row.terminalsJson,inv.terminals,payload.terminals)).map(x=>parse(x,x)),
    lounges:parse(first(row.lounges,inv.lounges,payload.lounges),first(row.lounges,inv.lounges,"")),
    foodDrinks:arr(first(row.foodDrinksJson,inv.foodDrinks,payload.foodDrinks)).map(x=>parse(x,x)),
    airportHotels:parse(first(row.airportHotels,inv.airportHotels,payload.airportHotels),first(row.airportHotels,inv.airportHotels,"")),
    lostFound:arr(first(row.lostFoundJson,inv.lostFound,payload.lostFound)).map(x=>parse(x,x)),
    destinationsServing:first(row.destinationsServing,inv.destinationsServing,payload.destinationsServing,""),
    sections:sectionObject(first(row.sectionsJson,inv.sections,payload.sections)),
    sectionsJson:parse(first(row.sectionsJson,inv.sectionsJson,payload.sectionsJson),null),
    meta:arr(first(row.meta,inv.meta,payload.meta)).length?arr(first(row.meta,inv.meta,payload.meta)):[code,first(row.locationCity,inv.city),first(row.country,inv.country)].filter(Boolean),
    badges:[first(row.locationCity,inv.city),first(row.country,inv.country),code].filter(Boolean),
    sourceUrls:arr(first(row.sourceUrlsJson,inv.sourceUrls,payload.sourceUrls))
  };
}
function mapLibrary(type,row={}){
  const payload=obj(row.payload),inv=inventory(row),loc=localized(row);
  const title=first(loc.title,payload.name,payload.title,row.title,inv.name,titleFromSlug(row.slug),"Travel information");
  return {
    ...payload,...inv,id:first(payload.id,payload.recordId,row.id,row.ID),recordId:first(payload.recordId,payload.id,row.id,row.ID),
    type,slug:first(payload.slug,row.slug,safeSlug(title)),title,name:title,category:first(payload.category,row.category,""),
    publicType:first(payload.publicType,payload.activityType,payload.transferType,payload.ticketType,row.category,""),
    city:first(payload.city,inv.city,""),country:first(payload.country,inv.country,""),region:first(payload.region,payload.destination,inv.region,""),
    destination:first(payload.destination,payload.region,inv.destination,""),
    summary:first(loc.shortDescription,loc.short_description,payload.summary,row.body,""),
    intro:first(loc.fullDescription,loc.full_description,payload.intro,payload.summary,row.body,""),
    heroImage:publicMedia(first(payload.heroImage,payload.hero_image,row.image_url,media(row,"hero"),"")),
    logo:publicMedia(first(payload.logo,payload.logoUrl,media(row,"card"),"")),
    badges:arr(first(payload.badges,payload.badgesJson)),amenities:arr(first(payload.amenities,payload.amenitiesJson)),
    included:arr(first(payload.included,payload.includedJson)),gallery:arr(first(payload.gallery,payload.galleryJson)).map(publicMedia),
    sections:sectionObject(first(payload.sections,payload.sectionsJson)),bookingUrl:first(payload.bookingUrl,payload.booking_url,""),
    meetingPoint:first(payload.meetingPoint,payload.meeting_point,""),fromLocation:first(payload.fromLocation,payload.from_location,""),
    toLocation:first(payload.toLocation,payload.to_location,""),starRating:num(first(payload.starRating,payload.star_rating)),
    durationText:first(payload.durationText,payload.duration_text,""),difficulty:first(payload.difficulty,""),
    latitude:num(first(payload.latitude,inv.latitude)),longitude:num(first(payload.longitude,inv.longitude))
  };
}

function mapFaqTopic(row={},source="faq"){
  const p=obj(row.payload);
  const groupId=text(first(row.groupId,row.group_id,p.groupId,row.category,"general"),100).toLowerCase().replace(/[^a-z0-9_-]+/g,"-");
  return {topicId:first(row.topicId,p.topicId,row.id),groupId,title:first(p.question,row.title,p.title,"Travel information"),
    subtitle:first(row.subtitle,p.subtitle,p.summary,""),body:first(p.answer,row.body,p.body,p.summary,""),
    bullets:arr(first(row.bulletsJson,p.bullets,p.bulletsJson)),tags:first(row.tags,p.tags,""),
    actionType:first(row.actionType,p.actionType,"article"),actionTarget:first(row.actionTarget,p.actionTarget,""),
    linkedLibrary:first(row.linkedLibrary,p.linkedLibrary,""),sortOrder:Number(first(row.sort_order,p.sortOrder,999)),
    active:row.active!==false&&p.active!==false,featured:row.featured===true||p.featured===true,source};
}
function mapFaqGroup(row={}){return{groupId:first(row.group_id,row.groupId,row.id),title:first(row.title,"General"),subtitle:first(row.subtitle,""),eyebrow:first(row.eyebrow,"SKANDI Help Center"),icon:first(row.icon,"support"),sortOrder:Number(first(row.sort_order,999)),active:row.active!==false}}
function fallbackGroups(topics=[]){const m=new Map();for(const t of topics){if(!m.has(t.groupId))m.set(t.groupId,{groupId:t.groupId,title:text(t.groupId).replace(/[-_]+/g," ").replace(/\b\w/g,c=>c.toUpperCase()),subtitle:"",eyebrow:"SKANDI Help Center",icon:"support",sortOrder:m.size+1,active:true})}return[...m.values()]}
function buildRequirements(rows=[]){
  const out={countries:[],visaDurations:{},passportValidityRules:{},healthRules:{},transitRules:{},airlineOverrides:{},disclaimer:"Travel rules change. Check official destination and carrier guidance before departure."};
  for(const base of rows){const row={...obj(base.payload),...base},type=first(row.ruleType,row.rule_type,row.category,""),key=first(row.key,row.region,row.countryName,row.country_name,row.slug,""),value=parse(first(row.value,row.valueJson,row.value_json,row.valueText,row.value_text,row.body,""),first(row.value,row.body,""));
    if(type==="country")out.countries.push({name:first(row.countryName,row.country_name,row.title,""),region:first(row.region,row.key,"")});
    else if(type==="visaDuration"&&key)out.visaDurations[key]=value;
    else if(type==="passportValidity"&&key)out.passportValidityRules[key]=value;
    else if(type==="health"&&key)out.healthRules[key]=arr(value);
    else if(type==="transit"&&key)out.transitRules[key]=value;
    else if(type==="airlineOverride"&&key)out.airlineOverrides[key]=arr(value);
    else if(type==="disclaimer")out.disclaimer=String(value||out.disclaimer);
  }return out;
}
function buildBaggage(rows=[]){const baggageRules={},loyaltyPrograms={},excessBaggagePricing={};for(const base of rows){const row={...obj(base.payload),...base},key=first(row.airlineKey,row.airline_key,row.id);if(!key)continue;baggageRules[key]={name:first(row.airlineName,row.airline_name,row.title,key),logo:publicMedia(first(row.logo,row.logoUrl,row.image_url,"")),classes:obj(parse(first(row.classes,row.classesJson,row.classes_json),{}))};Object.assign(loyaltyPrograms,obj(parse(first(row.loyaltyPrograms,row.loyaltyProgramsJson,row.loyalty_programs_json),{})));const e=parse(first(row.excessPricing,row.excessPricingJson,row.excess_pricing_json),null);if(e)excessBaggagePricing[key]=obj(e)}return{baggageRules,loyaltyPrograms,excessBaggagePricing}}
async function buildPayload(){
  const [airlineRows,airportRows,hotelRows,transferRows,tourRows,activityRows,ticketRows,faqRows,faqGroupRows,articleRows,requirementRows,baggageRows]=await Promise.all([
    selectSafe(TABLES.airlines),selectSafe(TABLES.airports),selectSafe(TABLES.hotels),selectSafe(TABLES.transfers),selectSafe(TABLES.tours),selectSafe(TABLES.activities),
    selectSafe(TABLES.tickets),selectSafe(TABLES.faq),selectSafe(TABLES.faqGroups),selectSafe(TABLES.articles),selectSafe(TABLES.requirements),selectSafe(TABLES.baggage)
  ]);
  const airlines={};for(const x of airlineRows.map(mapAirline)){if(x.id)airlines[x.id]=x}
  const topics=[...faqRows.map(r=>mapFaqTopic(r,"faq")),...articleRows.map(r=>mapFaqTopic(r,"article"))].filter(x=>x.active!==false).sort((a,b)=>a.sortOrder-b.sortOrder);
  const groups=(faqGroupRows.length?faqGroupRows.map(mapFaqGroup).filter(x=>x.active!==false):fallbackGroups(topics)).sort((a,b)=>a.sortOrder-b.sortOrder);
  const baggage=buildBaggage(baggageRows);
  return{
    generatedAt:new Date().toISOString(),
    meta:{source:"SUPABASE_TRAVEL_INFO",tables:{airlines:airlineRows.length,airports:airportRows.length,hotels:hotelRows.length,transfers:transferRows.length,tours:tourRows.length,activities:activityRows.length,tickets:ticketRows.length,faq:faqRows.length,faqGroups:faqGroupRows.length,articles:articleRows.length,requirements:requirementRows.length,baggage:baggageRows.length}},
    airlines,airports:airportRows.map(mapAirport).filter(x=>x.id),
    hotels:hotelRows.map(r=>mapLibrary("hotels",r)),transfers:transferRows.map(r=>mapLibrary("transfers",r)),
    tours:tourRows.map(r=>mapLibrary("tours",r)),activities:activityRows.map(r=>mapLibrary("activities",r)),tickets:ticketRows.map(r=>mapLibrary("tickets",r)),
    helpCenter:{groups,topics},travelRequirements:buildRequirements(requirementRows),
    baggageRules:baggage.baggageRules,loyaltyPrograms:baggage.loyaltyPrograms,excessBaggagePricing:baggage.excessBaggagePricing
  };
}
export const getTravelInfoPayload=webMethod(Permissions.Anyone,async()=>buildPayload());

function ref(prefix){return`${prefix}-${new Date().toISOString().slice(0,10).replaceAll("-","")}-${Math.random().toString(36).slice(2,8).toUpperCase()}`}
export const createTravelInfoSupportRequest=webMethod(Permissions.Anyone,async(input={})=>{
  const message=text(input.message,5000);if(!message)return{ok:false,message:"Message is required."};const ticketId=ref("TRAVEL"),now=new Date().toISOString();
  const record={title:`Travel Info request ${ticketId}`,slug:ticketId.toLowerCase(),category:text(input.category||"General",100),body:message,active:true,sort_order:0,payload:{ticketId,source:"travel-info",name:text(input.name,200),email:text(input.email,254).toLowerCase(),bookingReference:text(input.bookingReference,100),category:text(input.category||"General",100),message,status:"New",createdAt:now}};
  const rows=await db(TABLES.support,{method:"POST",body:record,prefer:"return=representation"}),saved=Array.isArray(rows)?rows[0]:rows;
  return{ok:true,ticketId,id:saved?.id||"",message:"Your request has been received."};
});
function norm(v){return text(v,10000).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"")}
export const askTravelInfoAgent=webMethod(Permissions.Anyone,async(input={})=>{
  const question=text(input.question,1500);if(!question)return{ok:false,answer:"Please type a travel information question."};const q=norm(question),data=await buildPayload(),c=[];
  Object.values(data.airlines||{}).forEach(x=>c.push({title:x.name,body:[x.summary,x.intro,x.checkInDeadline].filter(Boolean).join("\n")}));
  (data.airports||[]).forEach(x=>c.push({title:x.name,body:[x.summary,x.intro].filter(Boolean).join("\n")}));
  for(const k of["hotels","transfers","tours","activities","tickets"])(data[k]||[]).forEach(x=>c.push({title:x.name,body:[x.summary,x.intro].filter(Boolean).join("\n")}));
  (data.helpCenter?.topics||[]).forEach(x=>c.push({title:x.title,body:[x.body,...arr(x.bullets)].filter(Boolean).join("\n")}));
  const words=q.split(/\s+/).filter(w=>w.length>2),ranked=c.map(x=>({...x,score:words.reduce((s,w)=>s+(norm(`${x.title} ${x.body}`).includes(w)?1:0),0)+(norm(`${x.title} ${x.body}`).includes(q)?5:0)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score);
  if(!ranked.length)return{ok:true,answer:"I could not find that answer in the published SKANDI Travel Information records. Please contact SKANDI support for help.",source:"TRAVEL_INFO_ONLY"};
  return{ok:true,answer:`${ranked[0].title}\n\n${ranked[0].body}`.slice(0,3500),source:"TRAVEL_INFO_ONLY"};
});

async function weatherLocations(){const rows=await selectSafe(TABLES.airports);return rows.filter(r=>Number.isFinite(Number(r.latitude))&&Number.isFinite(Number(r.longitude))).sort((a,b)=>{const af=(a.homepage_featured===true?2:0)+(a.featured===true?1:0),bf=(b.homepage_featured===true?2:0)+(b.featured===true?1:0);return af!==bf?bf-af:Number(first(a.sort_order,a.sortOrder,999))-Number(first(b.sort_order,b.sortOrder,999))}).slice(0,4).map(r=>({locationId:text(first(r.iata,r.ID,r.id),100).toUpperCase(),title:first(r.locationCity,r.title,r.iata,"Airport"),label:first(r.locationCity,r.title,r.iata,"Airport"),airportHint:text(r.iata,3).toUpperCase(),country:first(r.country,""),latitude:Number(r.latitude),longitude:Number(r.longitude)}))}
export const getTravelWeather=webMethod(Permissions.Anyone,async()=>{
  const locations=await weatherLocations();if(!locations.length)return{ok:false,source:"OPENWEATHER",status:"no_locations",locations:[],message:"No published Travel Info airports with coordinates are available."};
  const key=await secret("OPENWEATHER_API_KEY");if(!key)return{ok:false,source:"OPENWEATHER",status:"setup_needed",locations:[],message:"Weather service is not configured."};
  const results=await Promise.all(locations.map(async l=>{try{const u=`https://api.openweathermap.org/data/2.5/weather?lat=${encodeURIComponent(l.latitude)}&lon=${encodeURIComponent(l.longitude)}&appid=${encodeURIComponent(key)}&units=metric`,r=await fetch(u),raw=await r.text();let d={};try{d=JSON.parse(raw)}catch(_){}if(!r.ok)throw new Error(d?.message||`Weather request failed (${r.status})`);return{...l,ok:true,status:"live",condition:first(d?.weather?.[0]?.main,d?.weather?.[0]?.description,""),description:first(d?.weather?.[0]?.description,""),iconUrl:d?.weather?.[0]?.icon?`https://openweathermap.org/img/wn/${encodeURIComponent(d.weather[0].icon)}@2x.png`:"",tempC:num(d?.main?.temp),feelsLikeC:num(d?.main?.feels_like),humidity:num(d?.main?.humidity),windSpeed:num(d?.wind?.speed),source:"OpenWeather"}}catch(e){return{...l,ok:false,status:"error",error:text(e?.message||e,300),source:"OpenWeather"}}}));
  return{ok:results.some(x=>x.ok),source:"OPENWEATHER",status:results.some(x=>x.ok)?"live":"error",updatedAt:new Date().toISOString(),locations:results};
});
