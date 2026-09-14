import { SITE_MAP, APP_ROUTES, isSafeInternalRoute } from "public/siteMap.js";
// /src/pages/Our Destinations.ctnh1.js
// SKANDI Destination Flow V9.2 — B-010 canonical backend convergence.
// Preserves the installed V9.2 HTML/message contract while eliminating legacy RIA/FINAL/orchestrator imports.


import wixLocation from "wix-location-frontend";
import { authentication } from "wix-members-frontend";
import { session } from "wix-storage";
import {
  searchUnifiedOffers,
  createBookingCartFromOffer,
  searchLiveStays
} from "backend/SKANDI_CORE/customerBooking.web";
import { getDestinationFlowCatalog } from "backend/SKANDI_CORE/destinationFlow.web";


const DESTINATION_EMBED_IDS = ["#htmlDestinations", "#destinationFlowEmbed", "#htmlDestination", "#destinationsEmbed"];
const FLOW_SOURCE = "SKANDI_DESTINATION_FLOW";
const INDEX_SOURCE = "SKANDI_DESTINATIONS_INDEX";
const COUNTRY_SOURCE = "SKANDI_DYNAMIC_COUNTRY_PAGE";
const DESTINATION_SOURCE = "SKANDI_DYNAMIC_DESTINATION_PAGE";
const AREA_SOURCE = "SKANDI_DYNAMIC_DESTINATION_AREA";
const HOTEL_SEARCH_SOURCES = new Set(["SKANDI_AREA_HOTEL_SEARCH", "SKANDI_HOTEL_SEARCH"]);
const HOTEL_DETAIL_SOURCE = "SKANDI_HOTEL_DETAIL";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";
const PROTOCOL_VERSION = "2026.09.13.destination-b010";


let catalog = [];
let catalogPromise = null;
let flowState = { level:"index", countrySlug:"", destinationSlug:"", areaSlug:"", hotelSlug:"", hotelId:"" };


function post(html, type, payload = {}) {
  html.postMessage({ source:PARENT_SOURCE, type, payload, timestamp:new Date().toISOString() });
}
function clean(value, max = 5000) { return String(value ?? "").trim().slice(0, max); }
function lower(value, max = 5000) { return clean(value, max).toLowerCase(); }
function slug(value) {
  return clean(value, 240).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function arr(value) { return Array.isArray(value) ? value : []; }
function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
function first(...values) { return values.find(value => value !== undefined && value !== null && value !== "") ?? ""; }
function numeric(...values) {
  for (const value of values) { const n = Number(value); if (Number.isFinite(n)) return n; }
  return 0;
}
function normalizeLanguage(value) { const v = clean(value || "EN", 12).toUpperCase(); return ["EN","SV","NO","DA"].includes(v) ? v : "EN"; }
function normalizeCurrency(value) { const v = clean(value || "USD", 3).toUpperCase(); return ["USD","SEK","NOK","DKK","EUR"].includes(v) ? v : "USD"; }
function validDate(value) { return /^\d{4}-\d{2}-\d{2}$/.test(clean(value, 10)); }
function addDays(date, days) {
  if (!validDate(date)) return "";
  const number = Math.max(1, Math.min(60, Number(days) || 1));
  return new Date(Date.parse(`${date}T00:00:00Z`) + number * 86400000).toISOString().slice(0, 10);
}
function nightsBetween(from, to) {
  if (!validDate(from) || !validDate(to)) return 0;
  const value = Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000);
  return value > 0 ? value : 0;
}
function assertDateRange(search = {}) {
  const from = clean(search.departureDate || search.checkInDate, 10);
  const to = clean(search.returnDate || search.checkOutDate, 10);
  if (!validDate(from) || !validDate(to)) throw new Error("Select both From and To dates.");
  if (nightsBetween(from, to) < 1) throw new Error("To date must be after From date.");
  return { from, to };
}


function firstDestinationEmbed() {
  for (const id of DESTINATION_EMBED_IDS) {
    try {
      const candidate = $w(id);
      if (candidate && typeof candidate.onMessage === "function" && typeof candidate.postMessage === "function") return candidate;
    } catch (_) {}
  }
  console.error(`[Destination Flow B-010] No HTML Component found. Checked: ${DESTINATION_EMBED_IDS.join(", ")}`);
  return null;
}


async function ensureCatalog() {
  if (catalog.length) return catalog;
  if (!catalogPromise) {
    catalogPromise = getDestinationFlowCatalog({}).then(result => {
      if (!result?.ok) {
        const error = new Error(clean(result?.publicMessage || "Destination inventory is unavailable.", 500));
        error.code = clean(result?.code || "DESTINATION_BACKEND_REQUEST_FAILED", 160);
        throw error;
      }
      catalog = arr(result.records);
      return catalog;
    }).finally(() => { catalogPromise = null; });
  }
  return catalogPromise;
}
function records(type) { const target = clean(type, 60).toUpperCase(); return catalog.filter(r => clean(r.entityType, 60).toUpperCase() === target); }
function byId(id) {
  const needle = clean(id, 160);
  return catalog.find(r => clean(r.id, 160) === needle || clean(r.publicId, 160) === needle) || null;
}
function byTypeSlug(type, value) {
  const needle = slug(value); if (!needle) return null;
  return records(type).find(r => [r.slug, r.name, r.code, r.publicId].some(v => slug(v) === needle)) || null;
}
function relationTarget(record, relationTypes = [], targetTypes = []) {
  const rels = new Set(arr(relationTypes).map(v => clean(v, 80).toUpperCase()));
  const types = new Set(arr(targetTypes).map(v => clean(v, 80).toUpperCase()));
  for (const relation of arr(record?.relations)) {
    const rel = clean(first(relation.relationType, relation.type), 80).toUpperCase();
    const targetType = clean(first(relation.targetEntityType, relation.targetType), 80).toUpperCase();
    if (rels.size && !rels.has(rel)) continue;
    if (types.size && !types.has(targetType)) continue;
    const target = byId(first(relation.targetEntityId, relation.targetId, relation.entityId))
      || byTypeSlug(targetType, first(relation.targetSlug, relation.slug, relation.targetName));
    if (target) return target;
  }
  return null;
}
function relatedRecords(record, relationTypes = [], entityTypes = []) {
  const rels = new Set(arr(relationTypes).map(v => clean(v, 80).toUpperCase()));
  const types = new Set(arr(entityTypes).map(v => clean(v, 80).toUpperCase()));
  return arr(record?.relations).filter(relation => {
    const rel = clean(first(relation.relationType, relation.type), 80).toUpperCase();
    const type = clean(first(relation.targetEntityType, relation.targetType), 80).toUpperCase();
    return (!rels.size || rels.has(rel)) && (!types.size || types.has(type));
  }).map(relation => byId(first(relation.targetEntityId, relation.targetId))
    || byTypeSlug(first(relation.targetEntityType, relation.targetType), first(relation.targetSlug, relation.targetName)))
    .filter(Boolean);
}
function parentOf(record) { return record ? (byId(record.parentEntityId) || relationTarget(record, ["PARENT"], [])) : null; }
function ancestors(record) {
  const result = [], seen = new Set(); let current = record;
  while (current) {
    const parent = parentOf(current); if (!parent || seen.has(parent.id)) break;
    seen.add(parent.id); result.push(parent); current = parent;
  }
  return result;
}
function countryOf(record) {
  if (!record) return null; if (record.entityType === "COUNTRY") return record;
  const d = obj(record.details);
  return byId(first(d.countryId, d.countryEntityId)) || relationTarget(record, ["COUNTRY"], ["COUNTRY"])
    || ancestors(record).find(x => x.entityType === "COUNTRY") || null;
}
function destinationOf(record) {
  if (!record) return null; if (record.entityType === "DESTINATION") return record;
  const d = obj(record.details);
  return byId(first(d.destinationId, d.destinationEntityId)) || relationTarget(record, ["DESTINATION"], ["DESTINATION"])
    || ancestors(record).find(x => x.entityType === "DESTINATION") || null;
}
function areaOf(record) {
  if (!record) return null; if (record.entityType === "AREA") return record;
  const d = obj(record.details);
  return byId(first(d.areaId, d.areaEntityId)) || relationTarget(record, ["AREA"], ["AREA"])
    || ancestors(record).find(x => x.entityType === "AREA") || null;
}
function isDirectChild(child, parent) {
  if (!child || !parent) return false;
  if (clean(child.parentEntityId, 160) === clean(parent.id, 160)) return true;
  return arr(child.relations).some(r => clean(first(r.relationType, r.type), 80).toUpperCase() === "PARENT"
    && clean(first(r.targetEntityId, r.targetId), 160) === clean(parent.id, 160));
}
function directChildren(parent, types = []) {
  const allowed = new Set(arr(types).map(v => clean(v, 60).toUpperCase()));
  return catalog.filter(r => (!allowed.size || allowed.has(clean(r.entityType, 60).toUpperCase())) && isDirectChild(r, parent));
}
function isUnder(record, ancestor) {
  if (!record || !ancestor) return false; if (record.id === ancestor.id) return true;
  if (ancestors(record).some(x => x.id === ancestor.id)) return true;
  const d = obj(record.details), type = clean(ancestor.entityType, 60).toUpperCase();
  if (type === "COUNTRY" && [d.countryId,d.countryEntityId].map(clean).includes(clean(ancestor.id))) return true;
  if (type === "DESTINATION" && [d.destinationId,d.destinationEntityId].map(clean).includes(clean(ancestor.id))) return true;
  if (type === "AREA" && [d.areaId,d.areaEntityId].map(clean).includes(clean(ancestor.id))) return true;
  return false;
}
function hotelsForScope(scope) { return !scope ? records("HOTEL") : records("HOTEL").filter(h => isUnder(h, scope)); }


function localized(record, language = "EN") {
  const rows = arr(record?.localized), target = normalizeLanguage(language);
  return rows.find(r => clean(r.language,12).toUpperCase() === target)
    || rows.find(r => clean(r.language,12).toUpperCase() === "EN") || rows[0] || {};
}
function mediaRows(record) { return arr(record?.media).filter(Boolean).sort((a,b) => numeric(a.sortOrder,a.sort_order)-numeric(b.sortOrder,b.sort_order)); }
function mediaUrl(value) {
  if (typeof value === "string") return clean(value, 1800);
  return clean(first(value?.url, value?.publicUrl, value?.public_url, value?.src, value?.imageUrl), 1800);
}
function imagesOf(record) {
  const rows = mediaRows(record), hero = rows.filter(r => r.isHero === true || clean(r.role,60).toUpperCase() === "HERO");
  const rest = rows.filter(r => !hero.includes(r)); const d = obj(record?.details);
  return [...new Set([...hero.map(mediaUrl), ...rest.map(mediaUrl), mediaUrl(d.heroImage), mediaUrl(d.image), mediaUrl(record?.heroImage), mediaUrl(record?.image)].filter(Boolean))];
}
function imageOf(record) { return imagesOf(record)[0] || ""; }
function cardImageOf(record) {
  const card = mediaRows(record).find(r => r.isCard === true || clean(r.role,60).toUpperCase() === "CARD");
  return mediaUrl(card) || imageOf(record);
}
function summaryOf(record, language = "EN") {
  const l = localized(record, language), d = obj(record?.details), seo = obj(record?.seo);
  return clean(first(l.shortDescription,l.short_description,l.description,d.shortDescription,d.summary,seo.description,d.description),8000);
}
function descriptionOf(record, language = "EN") {
  const l = localized(record, language), d = obj(record?.details);
  return clean(first(l.fullDescription,l.full_description,l.description,d.longDescription,d.description,summaryOf(record,language)),20000);
}
function paragraphs(value) {
  if (Array.isArray(value)) return value.map(v => clean(v,5000)).filter(Boolean);
  return clean(value,20000).split(/\n\s*\n|\r?\n/).map(v => v.trim()).filter(Boolean);
}
function pageFacts(record) { const d=obj(record?.details); return arr(first(d.pageFacts,d.quickFactsJson,d.quickFacts,d.facts,[])); }
function climate(record) {
  return arr(obj(record?.details).climate).map((item,index) => ({
    month:numeric(item.month,index+1), temperature:numeric(item.temperature,item.high,item.day), rain:numeric(item.rain,item.rainfall),
    high:numeric(item.high,item.temperature,item.day), low:numeric(item.low,item.night,item.temperature), sun:numeric(item.sun,item.sunHours),
    water:numeric(item.water,item.waterTemperature,item.sea), dry:numeric(item.dry,item.dryDays), air:numeric(item.air,item.high,item.temperature)
  }));
}
function faqs(record) {
  return arr(obj(record?.details).faqs).map(item => ({
    question:clean(first(item.question,item.q,item.title),2000), answer:clean(first(item.answer,item.a,item.text),6000),
    q:clean(first(item.q,item.question,item.title),2000), a:clean(first(item.a,item.answer,item.text),6000)
  })).filter(item => item.question || item.q);
}
function signature(record) {
  const d=obj(record?.details), raw=d.signature;
  if (Array.isArray(raw)) return { title:clean(raw[0]?.title||record?.name,500), copy:clean(first(raw[0]?.copy,raw[0]?.text,raw[0]?.description),5000), points:raw.map(i=>clean(first(i.point,i.title,i.text,i.description),1000)).filter(Boolean) };
  const v=obj(raw); return { title:clean(first(v.title,v.heading,record?.name),500), copy:clean(first(v.copy,v.text,v.description),5000), points:arr(first(v.points,v.items,[])).map(i=>clean(typeof i==="string"?i:first(i.text,i.title,i.description),1200)).filter(Boolean) };
}
function guide(record) {
  const d=obj(record?.details), raw=first(d.guide,d.guideSections,{});
  if (raw && typeof raw === "object" && !Array.isArray(raw)) return Object.fromEntries(Object.entries(raw).map(([key,value]) => {
    const item=typeof value === "string" ? {text:value} : obj(value);
    return [slug(key)||key,{title:clean(first(item.title,item.heading,key),500),text:clean(first(item.text,item.description,item.body),7000),image:mediaUrl(first(item.image,item.imageUrl))}];
  }));
  return Object.fromEntries(arr(raw).map((item,index)=>{const key=slug(first(item.key,item.category,item.title,`guide-${index+1}`))||`guide-${index+1}`;return [key,{title:clean(first(item.title,item.heading,item.category),500),text:clean(first(item.text,item.description,item.body),7000),image:mediaUrl(first(item.image,item.imageUrl))}]}));
}
function stories(record) {
  const d=obj(record?.details), raw=arr(d.stories).length?arr(d.stories):arr(d.guideSections);
  return raw.slice(0,6).map(i=>({title:clean(first(i.title,i.heading,i.category),500),body:clean(first(i.body,i.text,i.description),5000)})).filter(i=>i.title||i.body);
}
function quickFacts(record, extra={}) {
  const d=obj(record.details), rows=pageFacts(record).map(i=>({label:clean(first(i.label,i.title,i.key),300),labelKey:clean(i.labelKey,120),value:clean(first(i.value,i.text,i.description),1000)})).filter(i=>i.value);
  if(rows.length)return rows.slice(0,7);
  return [["Country",extra.countryName],["Arrival airport",clean(first(d.nearestAirportIata,d.searchAirportIata),20)],["Typical transfer",numeric(d.transferTimeMinutes)?`${numeric(d.transferTimeMinutes)} min`:""],["Currency",clean(d.currency,100)],["Time zone",clean(d.timezone,120)],["Popular season",clean(first(d.popularSeason,d.season),300)],["Best for",arr(first(d.goodFor,d.bestFor,[])).join(" · ")]].filter(([,v])=>v).map(([label,value])=>({label,value})).slice(0,7);
}
function countryFacts(record) {
  const d=obj(record.details), rows=pageFacts(record).map(i=>({label:clean(first(i.label,i.title,i.key),300),value:clean(first(i.value,i.text,i.description),1000)})).filter(i=>i.value);
  return rows.length?rows.slice(0,8):quickFacts(record,{countryName:record.name});
}
function introFor(record, language="EN") {
  const d=obj(record.details), l=localized(record,language), sig=signature(record), copy=first(d.introParagraphs,l.fullDescription,l.full_description,d.longDescription,d.description,summaryOf(record,language));
  return {title:clean(first(d.introTitle,l.title,record.name),500),paragraphs:paragraphs(copy).slice(0,8),signature:clean(first(sig.copy,l.importantInformation),5000),signatureTitle:sig.title||record.name,signatureCopy:clean(first(sig.copy,l.importantInformation),5000),signaturePoints:sig.points};
}
function heroFor(record, language="EN", parentName="") {
  const d=obj(record.details), l=localized(record,language);
  return {kicker:clean(first(d.heroKicker,d.kicker,parentName?`SKANDI · ${parentName}`:"SKANDI DESTINATIONS"),500),title:clean(first(d.heroTitle,l.heroTitle,l.title,record.name),1000),summary:clean(first(d.heroSummary,l.shortDescription,l.short_description,summaryOf(record,language)),5000),images:imagesOf(record)};
}
function hierarchy(record) {
  const country=countryOf(record),destination=destinationOf(record),area=areaOf(record);
  return {country,destination,area,countrySlug:slug(country?.slug||country?.name),destinationSlug:slug(destination?.slug||destination?.name),areaSlug:slug(area?.slug||area?.name)};
}
function customPath(level,data={}) {
  const q=new URLSearchParams(); if(data.countrySlug)q.set("country",data.countrySlug); if(data.destinationSlug)q.set("destination",data.destinationSlug); if(data.areaSlug)q.set("area",data.areaSlug); if(data.hotelSlug)q.set("hotel",data.hotelSlug); if(data.hotelId)q.set("hotelId",data.hotelId); if(level==="hotels")q.set("view","hotels"); const qs=q.toString();
  return `${SITE_MAP.destinations}${qs?`?${qs}`:""}`;
}
function directoryDestinations(){return records("DESTINATION").map(d=>{const c=countryOf(d);return{countrySlug:slug(c?.slug||c?.name),countryName:clean(c?.name,500),destinationSlug:slug(d.slug||d.name),slug:slug(d.slug||d.name),name:clean(d.name,500)}})}
function directoryAreas(){return records("AREA").map(a=>{const c=countryOf(a),d=destinationOf(a);return{countrySlug:slug(c?.slug||c?.name),countryName:clean(c?.name,500),destinationSlug:slug(d?.slug||d?.name),destinationName:clean(d?.name,500),areaSlug:slug(a.slug||a.name),name:clean(a.name,500)}})}


function airportDirectory() {
  return records("AIRPORT").map(record=>{const d=obj(record.details);return{id:record.id,publicId:record.publicId,iata:clean(first(d.iata,record.code),3).toUpperCase(),icao:clean(d.icao,4).toUpperCase(),code:clean(first(d.iata,record.code),3).toUpperCase(),name:clean(record.name,500),city:clean(d.city,500),country:clean(d.country,500)}}).filter(i=>i.iata).sort((a,b)=>`${a.city} ${a.name}`.localeCompare(`${b.city} ${b.name}`));
}
function airportFromValue(value) {
  const raw=clean(value,500); if(!raw)return null; const code=raw.match(/\(([A-Z0-9]{3,4})\)\s*$/i)?.[1]||raw, compact=slug(code).replace(/-/g,"");
  return records("AIRPORT").find(record=>{const d=obj(record.details),vals=[first(d.iata,record.code),d.icao,record.name,d.city,`${d.city||""} ${record.name||""}`].map(v=>slug(v).replace(/-/g,""));return vals.some(v=>v&&(v===compact||(compact.length>=3&&v.startsWith(compact))))})||null;
}
function airportFor(record) {
  if(!record)return null;if(clean(record.entityType,60).toUpperCase()==="AIRPORT")return record;const d=obj(record.details),explicit=clean(first(d.searchAirportIata,d.destinationIata,d.nearestAirportIata,d.arrivalAirportIata,d.iata),4).toUpperCase();
  if(explicit){const hit=records("AIRPORT").find(a=>{const x=obj(a.details);return[clean(first(x.iata,a.code),4),clean(x.icao,4)].map(v=>v.toUpperCase()).includes(explicit)});if(hit)return hit}
  const related=relationTarget(record,["NEAREST_AIRPORT","ARRIVAL_AIRPORT","AIRPORT"],["AIRPORT"]);if(related)return related;const parent=parentOf(record);return parent&&parent.id!==record.id?airportFor(parent):null;
}
function v9BookingSearch(search={},scopeRecord=null){
  const raw=obj(search),departureDate=clean(first(raw.departureDate,raw.checkInDate),10);let returnDate=clean(first(raw.returnDate,raw.checkOutDate),10);
  if(!validDate(returnDate)&&validDate(departureDate)){const old=Math.max(0,numeric(raw.nights,raw.duration,raw.QueryDur));if(old)returnDate=addDays(departureDate,old)}
  const originAirport=airportFromValue(first(raw.originIata,raw.origin)),destinationAirport=airportFor(scopeRecord),destinationType=clean(scopeRecord?.entityType,60).toUpperCase();
  const canonical=["DESTINATION","AREA"].includes(destinationType)?clean(first(scopeRecord.code,scopeRecord.slug,scopeRecord.publicId),160):clean(first(raw.destinationCode,raw.destinationRegion,raw.destination),160);
  const destinationIata=destinationAirport?clean(first(obj(destinationAirport.details).iata,destinationAirport.code),3).toUpperCase():clean(raw.destinationIata,3).toUpperCase();
  return {...raw,origin:originAirport?clean(first(obj(originAirport.details).iata,originAirport.code),3).toUpperCase():clean(raw.origin,500),originIata:originAirport?clean(first(obj(originAirport.details).iata,originAirport.code),3).toUpperCase():clean(raw.originIata,3).toUpperCase(),originLabel:originAirport?clean(first(obj(originAirport.details).city,originAirport.name),500):clean(raw.originLabel,500),departureDate,returnDate,checkInDate:departureDate,checkOutDate:returnDate,nights:nightsBetween(departureDate,returnDate),destination:destinationIata||clean(raw.destination,160),destinationIata,destinationCode:canonical||clean(raw.destinationCode,160),destinationRegion:canonical||clean(raw.destinationRegion,160),destinationType:destinationType||clean(raw.destinationType,60),language:normalizeLanguage(first(raw.language,raw.locale,"EN")),locale:normalizeLanguage(first(raw.locale,raw.language,"EN")),currency:normalizeCurrency(raw.currency)};
}


function previewHotel(record, language="EN") {
  const d=obj(record.details),h=hierarchy(record),tier=clean(first(d.skandiTier,d.collection),60).toUpperCase(),hotelSlug=slug(record.slug||record.name);
  return {id:record.id,inventoryMasterId:record.id,publicId:record.publicId,hotelId:record.publicId||record.id,hotelSlug,slug:hotelSlug,name:clean(record.name,500),location:clean(first(d.city,d.areaName,d.destinationName,h.area?.name,h.destination?.name,h.country?.name),500),image:cardImageOf(record),imageUrl:cardImageOf(record),heroImage:imageOf(record),classification:numeric(d.officialStarRating,d.classification,d.stars),standard:numeric(d.officialStarRating,d.classification,d.stars),guestRating:numeric(d.guestRating,d.reviewScore),reviewCount:numeric(d.reviewCount),beachDistance:numeric(d.distanceToBeach,99999),centerDistance:numeric(d.distanceToCenter,99999),longitude:numeric(d.longitude),latitude:numeric(d.latitude),facilities:arr(d.facilities),tags:arr(d.tags),boardOptions:arr(d.boardOptions),meal:clean(arr(d.boardOptions)[0],200),skandiTier:tier,collection:tier,details:d,description:summaryOf(record,language),summary:summaryOf(record,language),countrySlug:h.countrySlug,destinationSlug:h.destinationSlug,areaSlug:h.areaSlug,path:customPath("hotel",{countrySlug:h.countrySlug,destinationSlug:h.destinationSlug,areaSlug:h.areaSlug,hotelSlug,hotelId:record.id})};
}
function countryPage(record,language){
  const browse=directChildren(record,["DESTINATION","AREA"]),d=obj(record.details),regions=browse.map(child=>{const type=clean(child.entityType,60).toUpperCase(),destinationSlug=type==="DESTINATION"?slug(child.slug||child.name):"",areaSlug=type==="AREA"?slug(child.slug||child.name):"";return{name:clean(child.name,500),slug:slug(child.slug||child.name),image:cardImageOf(child),description:summaryOf(child,language),hotelCount:hotelsForScope(child).length,path:type==="AREA"?customPath("area",{countrySlug:slug(record.slug||record.name),areaSlug}):customPath("destination",{countrySlug:slug(record.slug||record.name),destinationSlug}),hotelsPath:customPath("hotels",{countrySlug:slug(record.slug||record.name),destinationSlug,areaSlug})}});
  const practical=arr(d.practicalInfo).map(i=>({icon:clean(first(i.icon,"•"),20),title:clean(first(i.title,i.label),500),summary:clean(first(i.summary,i.text,i.description),5000),path:clean(first(i.path,i.url,"/travel-info"),1000)})).filter(i=>i.title||i.summary);
  const inspiration=arr(d.inspiration).map(i=>({image:mediaUrl(first(i.image,i.imageUrl)),title:clean(first(i.title,i.name),500),path:clean(first(i.path,i.url,"/voy-magazine"),1000)})).filter(i=>i.title);
  const airlines=arr(d.airlines).map(item=>{if(typeof item==="string"){const a=byTypeSlug("AIRLINE",item)||records("AIRLINE").find(r=>clean(r.code,20).toUpperCase()===clean(item,20).toUpperCase());return a?{code:clean(a.code,20),name:clean(a.name,500),summary:summaryOf(a,language),path:"/flights"}:{code:clean(item,20),name:clean(item,500),summary:"",path:"/flights"}}const r=obj(item);return{code:clean(first(r.code,r.iata),20),name:clean(first(r.name,r.title),500),summary:clean(first(r.summary,r.description),2000),path:clean(first(r.path,r.url,"/flights"),1000)}});
  return{airports:airportDirectory(),id:record.id,name:clean(record.name,500),slug:slug(record.slug||record.name),code:clean(record.code,20).toUpperCase(),hero:heroFor(record,language),directory:records("COUNTRY").map(c=>({slug:slug(c.slug||c.name),name:clean(c.name,500)})),facts:countryFacts(record),intro:introFor(record,language),stories:stories(record),regions,weather:clean(first(d.weatherSummary,d.weather,d.climateSummary),5000),climate:climate(record),info:practical,inspiration,airlines,faqs:faqs(record)};
}
function destinationPage(record,language){
  const country=countryOf(record),areas=directChildren(record,["AREA"]),directHotels=directChildren(record,["HOTEL"]),d=obj(record.details);
  const areaCards=areas.map(area=>({name:clean(area.name,500),slug:slug(area.slug||area.name),image:cardImageOf(area),description:summaryOf(area,language),hotelCount:hotelsForScope(area).length,path:customPath("area",{countrySlug:slug(country?.slug||country?.name),destinationSlug:slug(record.slug||record.name),areaSlug:slug(area.slug||area.name)}),hotelsPath:customPath("hotels",{countrySlug:slug(country?.slug||country?.name),destinationSlug:slug(record.slug||record.name),areaSlug:slug(area.slug||area.name)})}));
  return{airports:airportDirectory(),id:record.id,name:clean(record.name,500),slug:slug(record.slug||record.name),countrySlug:slug(country?.slug||country?.name),countryName:clean(country?.name,500),countryCode:clean(country?.code,20).toUpperCase(),hero:heroFor(record,language,country?.name||""),directory:directoryDestinations(),quickFacts:quickFacts(record,{countryName:country?.name||""}),intro:introFor(record,language),stories:stories(record),hotels:directHotels.map(h=>previewHotel(h,language)),guide:guide(record),climate:climate(record),weatherSummary:clean(first(d.weatherSummary,d.weather,d.climateSummary),5000),areas:areaCards,inspiration:arr(d.inspiration).map(i=>({image:mediaUrl(first(i.image,i.imageUrl)),title:clean(first(i.title,i.name),500),path:clean(first(i.path,i.url,"/voy-magazine"),1000)})).filter(i=>i.title),faqs:faqs(record)};
}
function areaPage(record,language){
  const country=countryOf(record),destination=destinationOf(record),d=obj(record.details),hotelCards=directChildren(record,["HOTEL"]).map(h=>previewHotel(h,language));
  const siblings=records("AREA").filter(area=>area.id!==record.id&&((destination&&destinationOf(area)?.id===destination.id)||(!destination&&country&&countryOf(area)?.id===country.id)));
  const excursions=[...relatedRecords(record,["FEATURED_GUIDED_TOUR","FEATURED_ACTIVITY","RELATED_ACTIVITY"],["GUIDED_TOUR","ACTIVITY"]).map(i=>({image:cardImageOf(i),title:clean(i.name,500),summary:summaryOf(i,language),path:"/tours"})),...arr(d.excursions).map(i=>({image:mediaUrl(first(i.image,i.imageUrl)),title:clean(first(i.title,i.name),500),summary:clean(first(i.summary,i.description),5000),path:clean(first(i.path,i.url,"/tours"),1000)}))];
  const practicalFacts=arr(d.practicalInfo).map(i=>({icon:clean(first(i.icon,"•"),20),title:clean(first(i.title,i.label),500),text:clean(first(i.text,i.summary,i.description),5000)})).filter(i=>i.title||i.text);
  const tr=relatedRecords(record,["TRANSFER"],["TRANSFER"])[0]||null,td=obj(tr?.details),airport=byId(d.nearestAirportId)||relationTarget(record,["NEAREST_AIRPORT"],["AIRPORT"]);
  const transfer={airport:clean(first(airport?.code,airport?.name,d.nearestAirportIata,d.searchAirportIata),500),time:numeric(d.transferTimeMinutes,td.transferTimeMinutes)?`${numeric(d.transferTimeMinutes,td.transferTimeMinutes)} min`:"",modes:arr(first(d.transferModes,td.modes,[])),combination:clean(first(d.transferCombination,td.combination),1000),summary:clean(first(d.transferSummary,summaryOf(tr,language)),5000)};
  const match=obj(first(d.match,d.areaMatch,{}));
  return{airports:airportDirectory(),id:record.id,name:clean(record.name,500),slug:slug(record.slug||record.name),countrySlug:slug(country?.slug||country?.name),countryName:clean(country?.name,500),countryCode:clean(country?.code,20).toUpperCase(),destinationSlug:slug(destination?.slug||destination?.name),destinationName:clean(destination?.name,500),hero:heroFor(record,language,destination?.name||country?.name||""),directory:directoryAreas(),quickFacts:quickFacts(record,{countryName:country?.name||""}),intro:introFor(record,language),goodToKnow:arr(first(d.goodToKnow,d.goodFor,[])).map(i=>clean(typeof i==="string"?i:first(i.text,i.title,i.description),1200)).filter(Boolean),match:{title:clean(first(match.title,record.name),500),copy:clean(first(match.copy,match.text,summaryOf(record,language)),5000),values:{beach:numeric(match.beach),dining:numeric(match.dining),evening:numeric(match.evening),family:numeric(match.family),calm:numeric(match.calm),active:numeric(match.active)}},hotels:hotelCards,hotelsPath:customPath("hotels",{countrySlug:slug(country?.slug||country?.name),destinationSlug:slug(destination?.slug||destination?.name),areaSlug:slug(record.slug||record.name)}),guide:guide(record),excursions,practicalFacts,transfer,climate:climate(record),weatherSummary:clean(first(d.weatherSummary,d.weather,d.climateSummary),5000),reviews:obj(first(d.reviewSummary,d.reviewsSummary,{})),nearby:siblings.map(a=>{const c=countryOf(a),x=destinationOf(a);return{image:cardImageOf(a),name:clean(a.name,500),description:summaryOf(a,language),countrySlug:slug(c?.slug||c?.name),destinationSlug:slug(x?.slug||x?.name),areaSlug:slug(a.slug||a.name)}}),inspiration:arr(d.inspiration).map(i=>({image:mediaUrl(first(i.image,i.imageUrl)),title:clean(first(i.title,i.name),500),path:clean(first(i.path,i.url,"/voy-magazine"),1000)})).filter(i=>i.title),faqs:faqs(record)};
}
function hotelListPage(countrySlug,destinationSlug,areaSlug,language){
  const country=byTypeSlug("COUNTRY",countrySlug)||records("COUNTRY")[0]||null,destination=byTypeSlug("DESTINATION",destinationSlug),area=byTypeSlug("AREA",areaSlug),scope=area||destination||country,scopeName=clean(first(area?.name,destination?.name,country?.name,"Hotels"),500);
  return{airports:airportDirectory(),name:scopeName,countrySlug:slug(country?.slug||country?.name),countryName:clean(country?.name,500),destinationSlug:slug(destination?.slug||destination?.name),destinationName:clean(destination?.name,500),areaSlug:slug(area?.slug||area?.name),areaName:clean(area?.name,500),slug:slug(area?.slug||destination?.slug||country?.slug||scopeName),heroImage:imageOf(scope),intro:summaryOf(scope,language),description:descriptionOf(scope,language),previewHotels:hotelsForScope(scope).map(h=>previewHotel(h,language))};
}
function normalizeRoom(room={},gallery=[]){return{id:clean(first(room.id,room.code,slug(room.name)),160),code:clean(room.code,80),name:clean(room.name,500),description:clean(room.description,6000),image:mediaUrl(first(room.image,room.photo,gallery[0])),capacity:numeric(room.maxGuests,room.capacity),size:numeric(room.sizeSqm,room.size)?`${numeric(room.sizeSqm,room.size)} m²`:"",bedType:clean(room.bedType,160),roomType:clean(room.roomType,160),features:arr(first(room.features,room.amenities,[]))}}
function hotelPage(record,language,query={}){
  const d=obj(record.details),h=hierarchy(record),gallery=imagesOf(record),lat=Number(first(d.latitude,record.latitude)),lng=Number(first(d.longitude,record.longitude)),address=[d.address,d.postalCode,d.city].filter(Boolean).join(", "),food=obj(first(d.food,d.foodDrink,d.dining,{})),poolBeach=obj(first(d.poolBeach,d.poolAndBeach,{})),activities=obj(first(d.activities,d.trainingActivities,{})),accessibility=obj(first(d.accessibility,{})),tier=clean(first(d.skandiTier,d.collection),60).toUpperCase();
  const dep=clean(first(query.QueryDepDate,query.departureDate,query.checkIn),10),explicit=clean(first(query.returnDate,query.checkOutDate),10),legacy=Math.max(0,numeric(query.QueryDur,query.nights,query.duration)),ret=validDate(explicit)?explicit:(validDate(dep)&&legacy?addDays(dep,legacy):"");
  return{airports:airportDirectory(),id:record.id,hotelKey:record.publicId||record.id,hotelSlug:slug(record.slug||record.name),providerHotelId:clean(first(d.duffelAccommodationId,d.providerAccommodationId),180),name:clean(record.name,500),countrySlug:h.countrySlug,countryName:clean(h.country?.name,500),destinationSlug:h.destinationSlug,destinationName:clean(h.destination?.name,500),areaSlug:h.areaSlug,areaName:clean(h.area?.name,500),destinationCode:clean(first(d.searchAirportIata,d.destinationIata),20).toUpperCase(),gallery,heroImage:gallery[0]||"",summary:summaryOf(record,language),about:descriptionOf(record,language),important:clean(first(localized(record,language).importantInformation,d.importantInformation),6000),skandiTier:tier,collection:tier,officialClassification:numeric(d.officialStarRating,d.classification,d.stars),classification:numeric(d.officialStarRating,d.classification,d.stars),skandiRating:numeric(d.skandiRating),guestRating:numeric(d.guestRating),reviewCount:numeric(d.reviewCount),highlights:[...new Set([...arr(d.tags),...arr(d.goodFor),...arr(d.facilities).slice(0,5)].map(v=>clean(v,120)).filter(Boolean))].slice(0,10),facts:pageFacts(record).map(i=>({label:clean(first(i.label,i.title,i.key),300),value:clean(first(i.value,i.text,i.description),1000)})),roomsIntro:clean(first(d.roomsIntro,d.roomDescription),5000),rooms:arr(d.rooms).map(r=>normalizeRoom(r,gallery)),food,accessibility,poolBeach,activities,locationTransfer:{text:clean(first(d.locationText,d.locationDescription),5000),address,latitude:Number.isFinite(lat)?lat:null,longitude:Number.isFinite(lng)?lng:null,airportDistance:numeric(d.distanceToAirport)?`${numeric(d.distanceToAirport)} km`:"",transferTime:numeric(d.transferTimeMinutes)?`${numeric(d.transferTimeMinutes)} min`:"",centerDistance:numeric(d.distanceToCenter)?`${numeric(d.distanceToCenter)} km`:"",beachDistance:numeric(d.distanceToBeach)?`${numeric(d.distanceToBeach)} m`:"",phone:clean(first(d.phone,d.contactPhone),100),email:clean(first(d.email,d.contactEmail),254)},climate:climate(record).map(i=>({month:i.month,air:i.air||i.high||i.temperature,water:i.water})),reviews:arr(d.reviews),selection:{origin:clean(query.origin,100),departureDate:dep,returnDate:ret,nights:nightsBetween(dep,ret),travelers:numeric(query.adults,2)||2,meal:clean(first(query.SelectedMeals,"noselection"),80),roomKey:clean(query.RoomKey,160)},supplier:"DUFFEL_STAYS",liveAvailability:true};
}
function hotelSearch(payload={},record={}){
  const d=obj(record.details),departureDate=clean(first(payload.checkInDate,payload.departureDate),10);let returnDate=clean(first(payload.checkOutDate,payload.returnDate),10);if(!validDate(returnDate)&&validDate(departureDate)){const legacy=Math.max(0,Number(first(payload.nights,payload.duration,0))||0);if(legacy)returnDate=addDays(departureDate,legacy)}
  return v9BookingSearch({...payload,tripType:"hotelOnly",productType:"hotel",accommodationType:"hotel",destination:clean(first(payload.destination,payload.destinationIata,payload.destinationCode,d.searchAirportIata,d.city,flowState.destinationSlug),160),destinationRegion:clean(first(payload.destinationRegion,d.city),160),departureDate,returnDate,adults:Math.max(1,Number(first(payload.adults,payload.travelers,2))||2),children:Math.max(0,Number(first(payload.children,0))||0),childAges:arr(payload.childAges),rooms:Math.max(1,Number(first(payload.rooms,1))||1)},record);
}
function sameAccommodation(item,record){const d=obj(record.details),target=clean(first(d.duffelAccommodationId,d.providerAccommodationId),180);if(target&&clean(item.accommodationId,180)===target)return true;const a=lower(record.name,500).replace(/[^a-z0-9]/g,""),b=lower(first(item.title,item.name),500).replace(/[^a-z0-9]/g,"");return Boolean(a&&b&&a===b)}
function liveHotel(item,language="EN"){
  const accommodationId=clean(item.accommodationId,180),titleKey=lower(first(item.title,item.name),500),matched=records("HOTEL").find(record=>{const d=obj(record.details);return(accommodationId&&[d.duffelAccommodationId,d.providerAccommodationId].map(v=>clean(v,180)).includes(accommodationId))||(titleKey&&lower(record.name,500)===titleKey)}),preview=matched?previewHotel(matched,language):{};
  return{...preview,...item,id:clean(first(item.id,item.staySearchResultId,preview.id),180),name:clean(first(preview.name,item.title,item.name),500),image:clean(first(preview.image,item.imageUrl),1800),imageUrl:clean(first(preview.image,item.imageUrl),1800),location:clean(first(preview.location,item.location),500),price:numeric(item.total,item.price?.total,item.price?.amount,item.cheapestRateTotalAmount),currency:normalizeCurrency(first(item.currency,item.price?.currency,item.cheapestRateTotalCurrency,"USD")),isLive:true,offer:{...item,itemType:"hotel",tripType:"hotelOnly"},supplier:"DUFFEL_STAYS"};
}


async function makeCart(offer, search) {
  let cart = await createBookingCartFromOffer({ offer, search });
  if (cart?.requiresLogin) {
    try { await authentication.promptLogin(); } catch (_) {}
    cart = await createBookingCartFromOffer({ offer, search });
  }
  if (!cart?.cartId) throw new Error(cart?.message || "The booking cart could not be created.");
  session.setItem("SKANDI_BOOKING_CART_ID", cart.cartId);
  if (cart.cartToken) session.setItem("SKANDI_BOOKING_CART_TOKEN", cart.cartToken);
  return cart;
}
function bookingUrl(cart){return `${APP_ROUTES.bookingFlow}?step=offer&cartId=${encodeURIComponent(cart.cartId)}${cart.cartToken?`&cartToken=${encodeURIComponent(cart.cartToken)}`:""}`}
function resolveHotel(payload={}){const q=obj(payload.query);return(q.hotelId&&byId(q.hotelId))||byTypeSlug("HOTEL",first(q.hotel,payload.hotelSlug,flowState.hotelSlug))||(flowState.hotelId&&byId(flowState.hotelId))||null}
function safeExternalPath(path){const value=clean(path,1200);return value.startsWith("/")&&!value.startsWith("//")&&!/^(javascript|data|vbscript):/i.test(value)?value:""}
function wixInitialFlowState(){let query={},path=[];try{query=obj(wixLocation.query)}catch(_){}try{path=arr(wixLocation.path).map(v=>clean(v,240))}catch(_){}const countrySlug=slug(first(query.country,query.countrySlug)),destinationSlug=slug(first(query.destination,query.destinationSlug)),areaSlug=slug(first(query.area,query.areaSlug)),hotelSlug=slug(first(query.hotel,query.hotelSlug)),hotelId=clean(first(query.hotelId,query.inventoryMasterId),160),view=lower(query.view,40);let level="index";if(view==="hotel"||hotelSlug||hotelId)level="hotel";else if(view==="hotels")level="hotels";else if(areaSlug)level="area";else if(destinationSlug)level="destination";else if(countrySlug)level="country";const idx=path.findIndex(p=>["destinations","our-destinations"].includes(lower(p,80)));if(idx>=0&&level==="index"){const meaningful=path.slice(idx+1).filter(Boolean).filter(p=>!["country","destination","area","hotel-list"].includes(lower(p,80)));if(meaningful[0])return{level:meaningful.length>=3?"area":meaningful.length>=2?"destination":"country",countrySlug:slug(meaningful[0]),destinationSlug:slug(meaningful[1]),areaSlug:slug(meaningful[2]),hotelSlug:"",hotelId:""}}return{level,countrySlug,destinationSlug,areaSlug,hotelSlug,hotelId}}
function sameFlowState(a={},b={}){return["level","countrySlug","destinationSlug","areaSlug","hotelSlug","hotelId"].every(k=>clean(a[k],300)===clean(b[k],300))}
function syncWixFlowQuery(next={}){try{if(!wixLocation?.queryParams)return;const desired={};if(next.countrySlug)desired.country=slug(next.countrySlug);if(next.destinationSlug)desired.destination=slug(next.destinationSlug);if(next.areaSlug)desired.area=slug(next.areaSlug);if(next.level==="hotels")desired.view="hotels";if(next.level==="hotel"){desired.view="hotel";if(next.hotelSlug)desired.hotel=slug(next.hotelSlug);if(next.hotelId)desired.hotelId=clean(next.hotelId,160)}const keys=["country","destination","area","view","hotel","hotelId"],current=obj(wixLocation.query),remove=keys.filter(k=>!desired[k]&&current[k]!==undefined);if(remove.length)wixLocation.queryParams.remove(remove);if(Object.entries(desired).some(([k,v])=>clean(current[k],300)!==clean(v,300)))wixLocation.queryParams.add(desired)}catch(error){console.warn("[Destination Flow B-010] URL sync failed.",error?.message||error)}}


$w.onReady(function(){
  const html=firstDestinationEmbed(); if(!html)return;
  html.onMessage(async event=>{
    const message=event.data||{},source=clean(message.source,120),type=clean(message.type,160),payload=obj(message.payload);
    try{
      if(source===FLOW_SOURCE){
        if(type==="DESTINATION_FLOW_READY"){flowState={...flowState,...payload};await ensureCatalog();return}
        if(type==="DESTINATION_FLOW_STATE_CHANGED"){flowState={...flowState,...payload};syncWixFlowQuery(flowState);return}
        if(type==="DESTINATION_FLOW_RESIZE"){const requested=Number(payload.height),height=Number.isFinite(requested)?Math.max(680,Math.min(30000,Math.round(requested))):1200;try{if("height" in html)html.height=height}catch(_){}return}
        if(type==="DESTINATION_FLOW_NAVIGATE_EXTERNAL"){const path=safeExternalPath(payload.path);if(path)wixLocation.to(path);return}
      }
      if(source===INDEX_SOURCE&&type==="DESTINATIONS_INDEX_READY"){
        await ensureCatalog();const language=normalizeLanguage(payload.language),countries=records("COUNTRY").map(country=>{const children=directChildren(country,["DESTINATION","AREA"]);return{id:country.id,code:clean(country.code,20),slug:slug(country.slug||country.name),name:clean(country.name,500),image:cardImageOf(country),heroImage:imageOf(country),cardImage:cardImageOf(country),intro:summaryOf(country,language),description:summaryOf(country,language),areaCount:children.length,hotelCount:hotelsForScope(country).length,areas:children.slice(0,6).map(child=>{const isArea=child.entityType==="AREA";return{name:clean(child.name,500),slug:slug(child.slug||child.name),destinationSlug:isArea?"":slug(child.slug||child.name),areaSlug:isArea?slug(child.slug||child.name):"",path:isArea?customPath("area",{countrySlug:slug(country.slug||country.name),areaSlug:slug(child.slug||child.name)}):customPath("destination",{countrySlug:slug(country.slug||country.name),destinationSlug:slug(child.slug||child.name)})}})}});post(html,"DESTINATIONS_INDEX_DATA",{countries});return
      }
      if(source===COUNTRY_SOURCE){
        if(type==="COUNTRY_READY"){await ensureCatalog();const record=byTypeSlug("COUNTRY",first(payload.slug,flowState.countrySlug));if(!record)throw new Error("Country not found.");post(html,"COUNTRY_PAGE_RESULT",{page:countryPage(record,normalizeLanguage(payload.settings?.language))});return}
        if(type==="COUNTRY_SEARCH_OFFERS"){const scope=byTypeSlug("COUNTRY",first(payload.countrySlug,flowState.countrySlug)),search=v9BookingSearch(payload.search||{},scope);assertDateRange(search);const result=await searchUnifiedOffers({search});post(html,"COUNTRY_OFFERS_RESULT",{items:arr(result?.items),search});return}
        if(type==="COUNTRY_SELECT_OFFER"){const search=payload.search||payload.searchContext||payload.offer?.searchContext||{},cart=await makeCart(payload.offer||{},search);wixLocation.to(bookingUrl(cart));return}
      }
      if(source===DESTINATION_SOURCE){
        if(type==="DESTINATION_READY"){await ensureCatalog();const record=byTypeSlug("DESTINATION",first(payload.destinationSlug,flowState.destinationSlug));if(!record)throw new Error("Destination not found.");post(html,"DESTINATION_PAGE_RESULT",{page:destinationPage(record,normalizeLanguage(payload.settings?.language))});return}
        if(type==="DESTINATION_SEARCH_OFFERS"){const scope=byTypeSlug("DESTINATION",first(payload.destinationSlug,flowState.destinationSlug)),search=v9BookingSearch(payload.search||{},scope);assertDateRange(search);const result=await searchUnifiedOffers({search});post(html,"DESTINATION_OFFERS_RESULT",{items:arr(result?.items),search});return}
        if(type==="DESTINATION_SELECT_OFFER"){const search=payload.search||payload.searchContext||payload.offer?.searchContext||{},cart=await makeCart(payload.offer||{},search);wixLocation.to(bookingUrl(cart));return}
      }
      if(source===AREA_SOURCE){
        if(type==="AREA_READY"){await ensureCatalog();const record=byTypeSlug("AREA",first(payload.areaSlug,flowState.areaSlug));if(!record)throw new Error("Holiday area not found.");post(html,"AREA_PAGE_RESULT",{page:areaPage(record,normalizeLanguage(payload.settings?.language))});return}
        if(type==="AREA_SEARCH_OFFERS"){const scope=byTypeSlug("AREA",first(payload.areaSlug,flowState.areaSlug)),search=v9BookingSearch(payload.search||{},scope);assertDateRange(search);const result=await searchUnifiedOffers({search});post(html,"AREA_OFFERS_RESULT",{items:arr(result?.items),search});return}
        if(type==="AREA_SELECT_OFFER"){const search=payload.search||payload.searchContext||payload.offer?.searchContext||{},cart=await makeCart(payload.offer||{},search);wixLocation.to(bookingUrl(cart));return}
      }
      if(HOTEL_SEARCH_SOURCES.has(source)){
        if(type==="HOTEL_SEARCH_READY"){await ensureCatalog();post(html,"HOTEL_SEARCH_PAGE_RESULT",{page:hotelListPage(first(payload.countrySlug,flowState.countrySlug),first(payload.destinationSlug,flowState.destinationSlug),first(payload.areaSlug,flowState.areaSlug),normalizeLanguage(payload.settings?.language))});return}
        if(type==="HOTEL_SEARCH_RUN"){await ensureCatalog();const raw=payload.search||{},scope=byTypeSlug("AREA",first(raw.destinationAreaSlug,flowState.areaSlug))||byTypeSlug("DESTINATION",first(raw.destinationSlug,flowState.destinationSlug))||byTypeSlug("COUNTRY",first(raw.destinationCountrySlug,flowState.countrySlug)),search=hotelSearch(raw,scope||{});assertDateRange(search);const result=await searchUnifiedOffers({search});const language=normalizeLanguage(first(search.language,search.locale,"EN"));post(html,"HOTEL_SEARCH_RESULTS",{items:arr(result?.items).filter(i=>i.itemType==="hotel").map(i=>liveHotel(i,language)),search,supplier:"DUFFEL_STAYS"});return}
        if(type==="HOTEL_SEARCH_SELECT"){const offer=payload.offer||payload.hotel?.offer||payload.hotel||{},search=payload.search||offer.searchContext||{},cart=await makeCart(offer,search);post(html,"HOTEL_SEARCH_BOOKING_CART",cart);wixLocation.to(bookingUrl(cart));return}
        if(type==="HOTEL_SEARCH_FAVOURITE"){wixLocation.to("/my-profile?tab=favourites");return}
      }
      if(source===HOTEL_DETAIL_SOURCE){
        if(type==="HOTEL_DETAIL_READY"){await ensureCatalog();const record=resolveHotel(payload);if(!record)throw new Error("Hotel not found.");post(html,"HOTEL_DETAIL_DATA",{page:hotelPage(record,normalizeLanguage(payload.settings?.language),obj(payload.query)),supplier:"DUFFEL_STAYS"});return}
        if(type==="HOTEL_DETAIL_CHECK_AVAILABILITY"){
          await ensureCatalog();const record=resolveHotel({...payload,query:{hotel:flowState.hotelSlug,hotelId:flowState.hotelId}});if(!record)throw new Error("Hotel information is not loaded yet.");const search=hotelSearch(payload.search||payload,record);assertDateRange(search);const d=obj(record.details),accommodationId=clean(first(d.duffelAccommodationId,d.providerAccommodationId),180);let items=[];
          if(accommodationId){const targeted=await searchLiveStays({accommodationId,checkInDate:search.departureDate,checkOutDate:search.returnDate,adults:search.adults,children:search.children,childAges:search.childAges,rooms:search.rooms,fetchRates:true});items=arr(targeted?.items).map(item=>({...item,itemType:"hotel",productType:"HOTEL",provider:"Duffel",source:"LIVE_STAY",sourceLabel:"Live hotel availability",price:{amount:Number(item.total||item.cheapestRateTotalAmount||0),total:Number(item.total||item.cheapestRateTotalAmount||0),currency:item.currency||item.cheapestRateTotalCurrency||search.currency},total:Number(item.total||item.cheapestRateTotalAmount||0),currency:item.currency||item.cheapestRateTotalCurrency||search.currency,tripType:"hotelOnly",searchContext:search}))}
          else{const result=await searchUnifiedOffers({search});items=arr(result?.items).filter(item=>item.itemType==="hotel"&&sameAccommodation(item,record))}
          post(html,"HOTEL_DETAIL_AVAILABILITY_RESULT",{items,search,supplier:"DUFFEL_STAYS"});return
        }
        if(type==="HOTEL_DETAIL_SELECT_OFFER"){const offer=payload.offer||{};if(!offer?.id&&!offer?.staySearchResultId)throw new Error("Select a live hotel rate first.");const record=resolveHotel({query:{hotel:flowState.hotelSlug,hotelId:flowState.hotelId}})||{},search=hotelSearch(payload.search||offer.searchContext||{},record),cart=await makeCart(offer,search);post(html,"HOTEL_DETAIL_BOOKING_CART",cart);wixLocation.to(bookingUrl(cart));return}
        if(type==="HOTEL_DETAIL_FAVOURITE"){wixLocation.to("/my-profile?tab=favourites");return}
      }
    }catch(error){
      const messageText=error?.publicMessage||error?.message||"Destination information is temporarily unavailable.";
      if(source===INDEX_SOURCE){post(html,"DESTINATIONS_INDEX_ERROR",{message:messageText});return}
      if(source===COUNTRY_SOURCE){post(html,"COUNTRY_ERROR",{message:messageText});return}
      if(source===DESTINATION_SOURCE){post(html,"DESTINATION_ERROR",{message:messageText});return}
      if(source===AREA_SOURCE){post(html,"AREA_ERROR",{message:messageText});return}
      if(HOTEL_SEARCH_SOURCES.has(source)){post(html,"HOTEL_SEARCH_ERROR",{message:messageText});return}
      if(source===HOTEL_DETAIL_SOURCE){post(html,"HOTEL_DETAIL_ERROR",{message:messageText});return}
      console.error("[Destination Flow B-010] Unhandled error.",error);
    }
  });
  try{if(typeof wixLocation.onChange==="function")wixLocation.onChange(()=>{const next=wixInitialFlowState();if(!sameFlowState(next,flowState)){flowState={...flowState,...next};post(html,"DESTINATION_FLOW_SET_STATE",{state:next})}})}catch(error){console.warn("[Destination Flow B-010] Wix location change listener unavailable.",error?.message||error)}
  const initialState=wixInitialFlowState();flowState={...flowState,...initialState};post(html,"DESTINATION_FLOW_HOST_READY",{protocolVersion:PROTOCOL_VERSION,embedId:clean(html.id,80),initialState,readyAt:new Date().toISOString()});
});
