// /src/public/destinationContent.js
// V12 — shared public-catalog presentation functions, extracted from Our Destinations.
// Both Wix controllers use the same projections; data still comes from destinationFlow.web.
import { SITE_MAP } from "public/siteMap";

export function createDestinationContent(getCatalog, getFlowState = () => ({}), languages = ["EN", "SV", "NO", "DA"]) {
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
function coordinate(value,max){if(value===null||value===undefined||value==="")return null;const n=Number(value);return Number.isFinite(n)&&Math.abs(n)<=max?n:null;}
function normalizeLanguage(value) { const v = clean(value || "EN", 12).toUpperCase(); return languages.includes(v) ? v : "EN"; }
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


function records(type) { const target = clean(type, 60).toUpperCase(); return getCatalog().filter(r => clean(r.entityType, 60).toUpperCase() === target); }
function byId(id) {
  const needle = clean(id, 160);
  return getCatalog().find(r => clean(r.id, 160) === needle || clean(r.publicId, 160) === needle) || null;
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
  return getCatalog().filter(r => (!allowed.size || allowed.has(clean(r.entityType, 60).toUpperCase())) && isDirectChild(r, parent));
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
  const fallback = rows.find(r => clean(r.language,12).toUpperCase() === "EN") || rows[0] || {};
  const selected = rows.find(r => clean(r.language,12).toUpperCase() === target) || fallback;
  return Object.fromEntries([...new Set([...Object.keys(fallback),...Object.keys(selected)])].map(key => {
    const value = selected[key];
    const empty = value == null || (typeof value === "string" && !value.trim()) || (Array.isArray(value) && !value.length);
    return [key, empty ? fallback[key] : value];
  }));
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
  const measure = (...values) => {
    for (const value of values) if (value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value))) return Number(value);
    return null;
  };
  return arr(obj(record?.details).climate).map((item,index) => ({
    month:numeric(item.month,index+1), temperature:measure(item.temperature,item.avg_high_c,item.high,item.day), rain:measure(item.rain,item.precipitation_mm,item.rainfall),
    high:measure(item.avg_high_c,item.high,item.temperature,item.day), low:measure(item.avg_low_c,item.low,item.night,item.temperature), sun:measure(item.daylight_hours,item.sun,item.sunHours),
    water:measure(item.water,item.waterTemperature,item.sea), dry:measure(item.dry,item.dryDays), air:measure(item.air,item.avg_high_c,item.high,item.temperature)
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
  const q=new URLSearchParams(); if(data.countrySlug)q.set("country",data.countrySlug); if(data.destinationSlug)q.set("destination",data.destinationSlug); if(data.areaSlug)q.set("area",data.areaSlug); if(data.hotelSlug)q.set("hotel",data.hotelSlug); if(data.hotelId)q.set("hotelId",data.hotelId); if(level==="hotels"||level==="hotel")q.set("view",level); const qs=q.toString();
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
  return {id:record.id,inventoryMasterId:record.id,publicId:record.publicId,hotelId:record.publicId||record.id,hotelSlug,slug:hotelSlug,name:clean(record.name,500),location:clean(first(d.city,d.areaName,d.destinationName,h.area?.name,h.destination?.name,h.country?.name),500),image:cardImageOf(record),imageUrl:cardImageOf(record),heroImage:imageOf(record),classification:numeric(d.officialStarRating,d.classification,d.stars),standard:numeric(d.officialStarRating,d.classification,d.stars),guestRating:numeric(d.guestRating,d.reviewScore),reviewCount:numeric(d.reviewCount),beachDistance:numeric(d.distanceToBeach,99999),centerDistance:numeric(d.distanceToCenter,99999),longitude:coordinate(d.longitude,180),latitude:coordinate(d.latitude,90),facilities:arr(d.facilities),tags:arr(d.tags),boardOptions:arr(d.boardOptions),meal:clean(arr(d.boardOptions)[0],200),skandiTier:tier,collection:tier,details:d,description:summaryOf(record,language),summary:summaryOf(record,language),countrySlug:h.countrySlug,destinationSlug:h.destinationSlug,areaSlug:h.areaSlug,path:customPath("hotel",{countrySlug:h.countrySlug,destinationSlug:h.destinationSlug,areaSlug:h.areaSlug,hotelSlug,hotelId:record.id})};
}
function countryPage(record,language){
  const browse=[...new Map([...directChildren(record,["DESTINATION","AREA"]),...records("DESTINATION").filter(r=>isUnder(r,record))].map(r=>[r.id,r])).values()],d=obj(record.details),regions=browse.map(child=>{const type=clean(child.entityType,60).toUpperCase(),destinationSlug=type==="DESTINATION"?slug(child.slug||child.name):"",areaSlug=type==="AREA"?slug(child.slug||child.name):"";return{name:clean(child.name,500),slug:slug(child.slug||child.name),image:cardImageOf(child),description:summaryOf(child,language),hotelCount:hotelsForScope(child).length,path:type==="AREA"?customPath("area",{countrySlug:slug(record.slug||record.name),areaSlug}):customPath("destination",{countrySlug:slug(record.slug||record.name),destinationSlug}),hotelsPath:customPath("hotels",{countrySlug:slug(record.slug||record.name),destinationSlug,areaSlug})}});
  const practical=arr(d.practicalInfo).map(i=>({icon:clean(first(i.icon,"•"),20),title:clean(first(i.title,i.label),500),summary:clean(first(i.summary,i.text,i.description),5000),path:clean(first(i.path,i.url,"/travel-info"),1000)})).filter(i=>i.title||i.summary);
  const inspiration=arr(d.inspiration).map(i=>({image:mediaUrl(first(i.image,i.imageUrl)),title:clean(first(i.title,i.name),500),path:clean(first(i.path,i.url,"/voy-magazine"),1000)})).filter(i=>i.title);
  const airlines=arr(d.airlines).map(item=>{if(typeof item==="string"){const a=byTypeSlug("AIRLINE",item)||records("AIRLINE").find(r=>clean(r.code,20).toUpperCase()===clean(item,20).toUpperCase());return a?{code:clean(a.code,20),name:clean(a.name,500),summary:summaryOf(a,language),path:"/flights"}:{code:clean(item,20),name:clean(item,500),summary:"",path:"/flights"}}const r=obj(item);return{code:clean(first(r.code,r.iata),20),name:clean(first(r.name,r.title),500),summary:clean(first(r.summary,r.description),2000),path:clean(first(r.path,r.url,"/flights"),1000)}});
  return{airports:airportDirectory(),id:record.id,name:clean(record.name,500),slug:slug(record.slug||record.name),code:clean(record.code,20).toUpperCase(),hero:heroFor(record,language),directory:records("COUNTRY").map(c=>({slug:slug(c.slug||c.name),name:clean(c.name,500)})),facts:countryFacts(record),intro:introFor(record,language),stories:stories(record),regions,weather:clean(first(d.weatherSummary,d.weather,d.climateSummary),5000),climate:climate(record),info:practical,inspiration,airlines,faqs:faqs(record)};
}
function destinationPage(record,language){
  const country=countryOf(record),areas=directChildren(record,["AREA"]),directHotels=directChildren(record,["HOTEL"]),d=obj(record.details);
  const areaCards=areas.map(area=>({name:clean(area.name,500),slug:slug(area.slug||area.name),image:cardImageOf(area),description:summaryOf(area,language),hotelCount:hotelsForScope(area).length,path:customPath("area",{countrySlug:slug(country?.slug||country?.name),destinationSlug:slug(record.slug||record.name),areaSlug:slug(area.slug||area.name)}),hotelsPath:customPath("hotels",{countrySlug:slug(country?.slug||country?.name),destinationSlug:slug(record.slug||record.name),areaSlug:slug(area.slug||area.name)})}));
  return{airports:airportDirectory(),id:record.id,name:clean(record.name,500),slug:slug(record.slug||record.name),countrySlug:slug(country?.slug||country?.name),countryName:clean(country?.name,500),countryCode:clean(country?.code,20).toUpperCase(),hero:heroFor(record,language,country?.name||""),hotelsPath:customPath("hotels",{countrySlug:slug(country?.slug||country?.name),destinationSlug:slug(record.slug||record.name)}),directory:directoryDestinations(),quickFacts:quickFacts(record,{countryName:country?.name||""}),intro:introFor(record,language),stories:stories(record),hotels:directHotels.map(h=>previewHotel(h,language)),guide:guide(record),climate:climate(record),weatherSummary:clean(first(d.weatherSummary,d.weather,d.climateSummary),5000),areas:areaCards,inspiration:arr(d.inspiration).map(i=>({image:mediaUrl(first(i.image,i.imageUrl)),title:clean(first(i.title,i.name),500),path:clean(first(i.path,i.url,"/voy-magazine"),1000)})).filter(i=>i.title),faqs:faqs(record)};
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
  const country=byTypeSlug("COUNTRY",countrySlug)||null,destination=byTypeSlug("DESTINATION",destinationSlug),area=byTypeSlug("AREA",areaSlug),scope=area||destination||country,scopeName=clean(first(area?.name,destination?.name,country?.name,"Hotels"),500);
  return{airports:airportDirectory(),name:scopeName,countrySlug:slug(country?.slug||country?.name),countryName:clean(country?.name,500),destinationSlug:slug(destination?.slug||destination?.name),destinationName:clean(destination?.name,500),areaSlug:slug(area?.slug||area?.name),areaName:clean(area?.name,500),slug:slug(area?.slug||destination?.slug||country?.slug||scopeName),heroImage:imageOf(scope),intro:summaryOf(scope,language),description:descriptionOf(scope,language),previewHotels:hotelsForScope(scope).map(h=>previewHotel(h,language))};
}
function normalizeRoom(room={},gallery=[]){return{id:clean(first(room.id,room.code,slug(room.name)),160),code:clean(room.code,80),name:clean(room.name,500),description:clean(room.description,6000),image:mediaUrl(first(room.image,room.photo,gallery[0])),capacity:numeric(room.maxGuests,room.capacity),size:numeric(room.sizeSqm,room.size)?`${numeric(room.sizeSqm,room.size)} m²`:"",bedType:clean(room.bedType,160),roomType:clean(room.roomType,160),features:arr(first(room.features,room.amenities,[]))}}
function hotelPage(record,language,query={}){
  const d=obj(record.details),h=hierarchy(record),gallery=imagesOf(record),lat=coordinate(first(d.latitude,record.latitude),90),lng=coordinate(first(d.longitude,record.longitude),180),address=[d.address,d.postalCode,d.city].filter(Boolean).join(", "),food=obj(first(d.food,d.foodDrink,d.dining,{})),poolBeach=obj(first(d.poolBeach,d.poolAndBeach,{})),activities=obj(first(d.activities,d.trainingActivities,{})),accessibility=obj(first(d.accessibility,{})),tier=clean(first(d.skandiTier,d.collection),60).toUpperCase();
  const dep=clean(first(query.QueryDepDate,query.departureDate,query.checkIn),10),explicit=clean(first(query.returnDate,query.checkOutDate),10),legacy=Math.max(0,numeric(query.QueryDur,query.nights,query.duration)),ret=validDate(explicit)?explicit:(validDate(dep)&&legacy?addDays(dep,legacy):"");
  return{airports:airportDirectory(),id:record.id,hotelKey:record.publicId||record.id,hotelSlug:slug(record.slug||record.name),providerHotelId:clean(first(d.duffelAccommodationId,d.providerAccommodationId),180),name:clean(record.name,500),countrySlug:h.countrySlug,countryName:clean(h.country?.name,500),destinationSlug:h.destinationSlug,destinationName:clean(h.destination?.name,500),areaSlug:h.areaSlug,areaName:clean(h.area?.name,500),destinationCode:clean(first(d.searchAirportIata,d.destinationIata),20).toUpperCase(),gallery,heroImage:gallery[0]||"",summary:summaryOf(record,language),about:descriptionOf(record,language),important:clean(first(localized(record,language).importantInformation,d.importantInformation),6000),skandiTier:tier,collection:tier,officialClassification:numeric(d.officialStarRating,d.classification,d.stars),classification:numeric(d.officialStarRating,d.classification,d.stars),skandiRating:numeric(d.skandiRating),guestRating:numeric(d.guestRating),reviewCount:numeric(d.reviewCount),highlights:[...new Set([...arr(d.tags),...arr(d.goodFor),...arr(d.facilities).slice(0,5)].map(v=>clean(v,120)).filter(Boolean))].slice(0,10),facts:pageFacts(record).map(i=>({label:clean(first(i.label,i.title,i.key),300),value:clean(first(i.value,i.text,i.description),1000)})),roomsIntro:clean(first(d.roomsIntro,d.roomDescription),5000),rooms:arr(d.rooms).map(r=>normalizeRoom(r,gallery)),food,accessibility,poolBeach,activities,locationTransfer:{text:clean(first(d.locationText,d.locationDescription),5000),address,latitude:lat,longitude:lng,airportDistance:numeric(d.distanceToAirport)?`${numeric(d.distanceToAirport)} km`:"",transferTime:numeric(d.transferTimeMinutes)?`${numeric(d.transferTimeMinutes)} min`:"",centerDistance:numeric(d.distanceToCenter)?`${numeric(d.distanceToCenter)} km`:"",beachDistance:numeric(d.distanceToBeach)?`${numeric(d.distanceToBeach)} m`:"",phone:clean(first(d.phone,d.contactPhone),100),email:clean(first(d.email,d.contactEmail),254)},climate:climate(record).map(i=>({month:i.month,air:i.air||i.high||i.temperature,water:i.water})),reviews:arr(d.reviews),selection:{origin:clean(query.origin,100),departureDate:dep,returnDate:ret,nights:nightsBetween(dep,ret),travelers:numeric(query.adults,2)||2,meal:clean(first(query.SelectedMeals,"noselection"),80),roomKey:clean(query.RoomKey,160)},supplier:"DUFFEL_STAYS",liveAvailability:true};
}
function hotelSearch(payload={},record={}){
  const d=obj(record.details),departureDate=clean(first(payload.checkInDate,payload.departureDate),10);let returnDate=clean(first(payload.checkOutDate,payload.returnDate),10);if(!validDate(returnDate)&&validDate(departureDate)){const legacy=Math.max(0,Number(first(payload.nights,payload.duration,0))||0);if(legacy)returnDate=addDays(departureDate,legacy)}
  return v9BookingSearch({...payload,tripType:"hotelOnly",productType:"hotel",accommodationType:"hotel",destination:clean(first(payload.destination,payload.destinationIata,payload.destinationCode,d.searchAirportIata,d.city,getFlowState().destinationSlug),160),destinationRegion:clean(first(payload.destinationRegion,d.city),160),departureDate,returnDate,adults:Math.max(1,Number(first(payload.adults,payload.travelers,2))||2),children:Math.max(0,Number(first(payload.children,0))||0),childAges:arr(payload.childAges),rooms:Math.max(1,Number(first(payload.rooms,1))||1)},record);
}
function sameAccommodation(item,record){const d=obj(record.details),target=clean(first(d.duffelAccommodationId,d.providerAccommodationId),180);if(target)return clean(item.accommodationId,180)===target;const a=lower(record.name,500).replace(/[^a-z0-9]/g,""),b=lower(first(item.title,item.name),500).replace(/[^a-z0-9]/g,"");return Boolean(a&&b&&a===b)}
function liveHotel(item,language="EN"){
  const accommodationId=clean(item.accommodationId,180),titleKey=lower(first(item.title,item.name),500),matched=records("HOTEL").find(record=>{const d=obj(record.details);return(accommodationId&&[d.duffelAccommodationId,d.providerAccommodationId].map(v=>clean(v,180)).includes(accommodationId))||(titleKey&&lower(record.name,500)===titleKey)}),preview=matched?previewHotel(matched,language):{};
  return{...preview,...item,id:clean(first(item.id,item.staySearchResultId,preview.id),180),name:clean(first(preview.name,item.title,item.name),500),image:clean(first(preview.image,item.imageUrl),1800),imageUrl:clean(first(preview.image,item.imageUrl),1800),location:clean(first(preview.location,item.location),500),price:numeric(item.total,item.price?.total,item.price?.amount,item.cheapestRateTotalAmount),currency:normalizeCurrency(first(item.currency,item.price?.currency,item.cheapestRateTotalCurrency,"USD")),isLive:true,offer:{...item,itemType:"hotel",tripType:"hotelOnly"},supplier:"DUFFEL_STAYS"};
}

return { records, byId, byTypeSlug, relationTarget, relatedRecords, parentOf, ancestors, countryOf, destinationOf, areaOf, isDirectChild, directChildren, isUnder, hotelsForScope, localized, mediaRows, mediaUrl, imagesOf, imageOf, cardImageOf, summaryOf, descriptionOf, paragraphs, pageFacts, climate, faqs, signature, guide, stories, quickFacts, countryFacts, introFor, heroFor, hierarchy, customPath, directoryDestinations, directoryAreas, airportDirectory, airportFromValue, airportFor, v9BookingSearch, previewHotel, countryPage, destinationPage, areaPage, hotelListPage, normalizeRoom, hotelPage, hotelSearch, sameAccommodation, liveHotel };
}
