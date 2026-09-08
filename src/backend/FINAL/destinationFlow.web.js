import { webMethod, Permissions } from "wix-web-module";
import { secrets } from "wix-secrets-backend.v2";
import { elevate } from "wix-auth";
import { fetch } from "wix-fetch";

const clean=(v,m=1000)=>String(v??"").trim().slice(0,m);
const upper=(v,m=100)=>clean(v,m).toUpperCase();
const lower=(v,m=1000)=>clean(v,m).toLowerCase();
const arr=v=>Array.isArray(v)?v:[];
const obj=v=>v&&typeof v==="object"&&!Array.isArray(v)?v:{};
const num=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
const slug=v=>clean(v,200).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/&/g," and ").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");
const LEVELS=new Set(["COUNTRY","DESTINATION","AREA"]);


// Public destination browsing reads the published Inventory Control view directly.
// This keeps the entire country -> hotel flow in one backend module and avoids a
// missing/old publicInventory.js or supabaseClient.js dependency breaking the page.
const elevatedGetSecretValue=elevate(secrets.getSecretValue);
let publicCfgPromise=null;
function secretValue(r){return typeof r==="string"?r.trim():String(r?.value??r?.secretValue??r?.secret?.value??"").trim()}
async function publicSecret(name){const v=secretValue(await elevatedGetSecretValue(name));if(!v)throw new Error(`WIX_SECRET_EMPTY_${name}`);return v}
async function publicCfg(){
  if(publicCfgPromise)return publicCfgPromise;
  publicCfgPromise=(async()=>{
    const url=(await publicSecret("SUPABASE_URL")).replace(/\/+$/,"");
    let key="";try{key=await publicSecret("SUPABASE_SECRET_KEY")}catch(_){key=await publicSecret("SUPABASE_SERVICE_ROLE_KEY")}
    if(!/^https:\/\/[^/]+\.supabase\.co$/i.test(url))throw new Error("SUPABASE_URL_INVALID");
    if(!key)throw new Error("SUPABASE_SERVER_KEY_MISSING");
    return{url,key,legacyJwt:key.startsWith("eyJ")};
  })();
  try{return await publicCfgPromise}catch(e){publicCfgPromise=null;throw e}
}
async function publicRows(entityType){
  const c=await publicCfg();
  const type=upper(entityType,50);
  const qs=["select=*",`entity_type=eq.${encodeURIComponent(type)}`,"order=sort_priority.asc,name.asc","limit=1000"].join("&");
  const res=await fetch(`${c.url}/rest/v1/inventory_public_entities_v?${qs}`,{headers:{apikey:c.key,...(c.legacyJwt?{Authorization:`Bearer ${c.key}`}:{})}});
  const raw=await res.text();let data=[];if(raw){try{data=JSON.parse(raw)}catch(_){throw new Error("SUPABASE_INVALID_PUBLIC_INVENTORY_RESPONSE")}}
  if(!res.ok)throw new Error(data?.message||data?.error||`SUPABASE_PUBLIC_INVENTORY_${res.status}`);
  return Array.isArray(data)?data:[];
}
function arrayValue(v){
  if(Array.isArray(v))return v;
  if(v==null||v==="")return [];
  if(typeof v==="string"){try{const p=JSON.parse(v);if(Array.isArray(p))return p}catch(_){};return []}
  return [];
}
function localizedValue(row,language){
  const list=arrayValue(row.localized),lng=upper(language||"EN",10);
  return list.find(x=>upper(x?.language,10)===lng)||list.find(x=>upper(x?.language,10)==="EN")||list[0]||{};
}
function normalizePublicRow(row,language="EN"){
  const l=localizedValue(row,language),det=obj(row.details),com=obj(row.commercial),seo=obj(row.seo),media=arrayValue(row.media).filter(x=>x?.url);
  const hero=media.find(x=>x.isHero||x.is_hero)||media.find(x=>x.isPrimary||x.is_primary)||media.find(x=>x.isCard||x.is_card)||media[0]||{};
  const card=media.find(x=>x.isCard||x.is_card)||media.find(x=>x.isHero||x.is_hero)||media.find(x=>x.isPrimary||x.is_primary)||media[0]||{};
  return{
    id:row.id,publicId:row.public_id||"",entityType:row.entity_type||"",code:row.code||"",
    name:clean(l.title||row.name,500),baseName:row.name||"",slug:row.slug||"",
    featured:Boolean(row.featured),homepageFeatured:Boolean(row.homepage_featured),sortPriority:Number(row.sort_priority||100),
    parentEntityId:row.parent_entity_id||"",details:det,commercial:com,seo,
    localized:l,localizedAll:arrayValue(row.localized),media,heroImage:hero.url||"",cardImage:card.url||"",gallery:media.map(x=>x.url),
    description:clean(l.shortDescription||l.short_description||det.shortDescription||det.description||det.summary||seo.description||"",5000),
    fullDescription:clean(l.fullDescription||l.full_description||det.fullDescription||"",20000),
    highlights:arrayValue(l.highlights||det.highlights),price:{amount:num(com.publicPrice||com.public_price,0),currency:upper(com.currency||"USD",3)},
    updatedAt:row.updated_at||""
  };
}
async function listPublicInventoryInternal({entityType,language="EN",limit=1000}={}){
  const rows=await publicRows(entityType);
  return rows.slice(0,Math.min(Math.max(Number(limit)||1,1),1000)).map(r=>normalizePublicRow(r,language));
}

function d(r){return obj(r?.details)}
function level(r){return upper(d(r).level,20)}
function byId(rows){return new Map(rows.map(x=>[x.id,x]))}
function same(a,b){return clean(a,200)!==""&&clean(a,200)===clean(b,200)}
function image(r){return clean(r?.heroImage||r?.cardImage||r?.gallery?.[0],1400)}
function images(r){return [...new Set([...(arr(r?.gallery)),image(r)].filter(Boolean))]}
function paragraphs(r){
  const x=d(r);
  const direct=arr(x.introParagraphs).filter(Boolean);
  if(direct.length)return direct;
  return [r?.fullDescription||r?.description||""].filter(Boolean);
}
function facts(r){
  const x=d(r);
  return arr(x.pageFacts||x.quickFacts||x.facts).map(v=>{
    if(typeof v==="string")return {label:"",value:v};
    return {label:clean(v?.label||v?.name,120),labelKey:clean(v?.labelKey,120),value:clean(v?.value,500)};
  });
}
function hero(r,kicker="SKANDI DESTINATIONS"){
  const x=d(r),h=obj(x.hero);
  return {
    kicker:clean(h.kicker||x.heroKicker||kicker,200),
    title:clean(h.title||x.heroTitle||r?.name,500),
    summary:clean(h.summary||x.heroSummary||r?.fullDescription||r?.description,5000),
    images:arr(h.images).length?arr(h.images):images(r)
  };
}
function intro(r){
  const x=d(r),i=obj(x.intro);
  return {
    title:clean(i.title||x.introTitle||r?.name,500),
    paragraphs:arr(i.paragraphs).length?arr(i.paragraphs):paragraphs(r),
    signatureTitle:clean(i.signatureTitle||x.signatureTitle||"",500),
    signatureCopy:clean(i.signatureCopy||x.signatureCopy||"",5000),
    signaturePoints:arr(i.signaturePoints||x.signaturePoints||x.signature)
  };
}
function basePage(r){
  const x=d(r);
  return {
    ...x,
    id:r.id,inventoryMasterId:r.id,publicId:r.publicId||"",entityType:r.entityType||"",
    code:r.code||"",slug:r.slug||"",name:r.name||"",title:r.name||"",
    description:r.description||"",fullDescription:r.fullDescription||"",
    featured:!!r.featured,homepageFeatured:!!r.homepageFeatured,sortPriority:Number(r.sortPriority||100),
    parentEntityId:r.parentEntityId||"",details:x,commercial:obj(r.commercial),seo:obj(r.seo),
    media:arr(r.media),gallery:arr(r.gallery),heroImage:image(r),cardImage:r.cardImage||"",
    hero:hero(r),quickFacts:facts(r),facts:facts(r),intro:intro(r),
    stories:arr(x.stories),climate:arr(x.climate),weatherSummary:clean(x.weatherSummary||x.weather,5000),
    weather:clean(x.weather||x.weatherSummary,5000),info:arr(x.info),inspiration:arr(x.inspiration),
    airlines:arr(x.airlines),faqs:arr(x.faqs),guide:obj(x.guide),goodToKnow:arr(x.goodToKnow),
    match:obj(x.match),practical:arr(x.practical),transfers:arr(x.transfers),
    reviews:obj(x.reviews),updatedAt:r.updatedAt||""
  };
}

async function inventory(language="EN"){
  const [countryRows,destinationRows,areaRows,hotels,airports,activities,tours]=await Promise.all([
    listPublicInventoryInternal({entityType:"COUNTRY",language,limit:1000}),
    listPublicInventoryInternal({entityType:"DESTINATION",language,limit:1000}),
    listPublicInventoryInternal({entityType:"AREA",language,limit:1000}),
    listPublicInventoryInternal({entityType:"HOTEL",language,limit:1000}),
    listPublicInventoryInternal({entityType:"AIRPORT",language,limit:1000}),
    listPublicInventoryInternal({entityType:"ACTIVITY",language,limit:1000}),
    listPublicInventoryInternal({entityType:"GUIDED_TOUR",language,limit:1000})
  ]);
  // Accept legacy level-tagged rows too, but canonical entity_type is authoritative.
  const countries=[...countryRows,...destinationRows.filter(x=>level(x)==="COUNTRY")].filter((x,i,a)=>a.findIndex(y=>y.id===x.id)===i);
  const destinationsOnly=destinationRows.filter(x=>level(x)!=="COUNTRY"&&level(x)!=="AREA");
  const areas=[...areaRows,...destinationRows.filter(x=>level(x)==="AREA")].filter((x,i,a)=>a.findIndex(y=>y.id===x.id)===i);
  const destinations=[...countries,...destinationsOnly,...areas];
  const allMap=byId(destinations);
  const countryMap=byId(countries);
  const destinationMap=byId(destinationsOnly);
  const areaMap=byId(areas);

  function countryFor(place){
    if(!place)return null;
    if(place.entityType==="COUNTRY"||level(place)==="COUNTRY")return place;
    const x=d(place);
    const direct=countryMap.get(place.parentEntityId)||countryMap.get(x.countryId);
    if(direct)return direct;
    const cc=upper(x.countryCode,10),cn=lower(x.countryName,200);
    return countries.find(c=>(cc&&upper(c.code,10)===cc)||(cn&&lower(c.name,200)===cn))||null;
  }
  function destinationFor(areaOrHotel){
    if(!areaOrHotel)return null;
    if(areaOrHotel.entityType==="DESTINATION"&&level(areaOrHotel)!=="AREA"&&level(areaOrHotel)!=="COUNTRY")return areaOrHotel;
    const x=d(areaOrHotel);
    if(areaOrHotel.entityType==="AREA"||level(areaOrHotel)==="AREA"){
      return destinationMap.get(areaOrHotel.parentEntityId)||destinationMap.get(x.destinationId)||null;
    }
    return destinationMap.get(x.destinationId)||destinationMap.get(areaOrHotel.parentEntityId)||null;
  }
  function areaFor(hotel){
    const x=d(hotel);
    return areaMap.get(x.areaId)||areaMap.get(hotel.parentEntityId)||null;
  }
  function airportFor(record){
    const x=d(record);
    return airports.find(a=>same(a.id,x.nearestAirportId))||null;
  }
  return {destinations,hotels,airports,activities:[...activities,...tours],countries,destinationsOnly,areas,allMap,countryMap,destinationMap,areaMap,countryFor,destinationFor,areaFor,airportFor};
}

function iataFor(r,ctx){
  const x=d(r),ap=ctx.airportFor(r);
  return upper(x.searchAirportIata||x.destinationIata||x.airportIata||ap?.code||d(ap).iata,3);
}
function countryPath(c){return c?`/destinations/${c.slug}`:"/destinations"}
function destinationPath(c,dst){return c&&dst?`/destinations/${c.slug}/${dst.slug}`:countryPath(c)}
function areaPath(c,dst,a){return c&&dst&&a?`/destinations/${c.slug}/${dst.slug}/${a.slug}`:destinationPath(c,dst)}
function hotelsPath(c,dst,a=null){return c&&dst?`/hotels/${c.slug}/${dst.slug}${a?`/${a.slug}`:""}`:"/hotels"}
function hotelPath(c,dst,a,h){return h?`${hotelsPath(c,dst,a)}/${h.slug}`:"/hotels"}

function hotelCard(h,ctx){
  const x=d(h),a=ctx.areaFor(h),dst=ctx.destinationFor(h)||ctx.destinationFor(a),c=ctx.countryFor(dst);
  const tier=upper(x.skandiTier,30);
  return {
    ...basePage(h),
    id:h.id,inventoryMasterId:h.id,hotelId:h.publicId||h.id,publicId:h.publicId||"",
    hotelSlug:h.slug,name:h.name,slug:h.slug,
    countryId:c?.id||"",countrySlug:c?.slug||"",countryName:c?.name||"",countryCode:c?.code||"",
    destinationId:dst?.id||"",destinationSlug:dst?.slug||"",destinationName:dst?.name||"",
    areaId:a?.id||"",areaSlug:a?.slug||"",areaName:a?.name||"",
    path:hotelPath(c,dst,a,h),
    browsePath:hotelsPath(c,dst,a),
    image:image(h),imageUrl:image(h),gallery:arr(h.gallery),
    location:clean(x.address||[a?.name,dst?.name].filter(Boolean).join(", ")||x.city,500),
    rating:num(x.skandiRating||x.officialStarRating||x.guestRating,0),
    classification:num(x.officialStarRating,0),standard:num(x.officialStarRating,0),
    guestRating:num(x.guestRating,0),reviewCount:num(x.reviewCount,0),
    summary:h.description||h.fullDescription||"",
    tags:arr(x.facilities),facilities:arr(x.facilities),rooms:arr(x.rooms),facts:arr(x.facts),
    boardOptions:arr(x.boardOptions),beachDistance:num(x.distanceToBeach,0),centerDistance:num(x.distanceToCenter,0),
    skandiTier:tier,collection:tier.toLowerCase(),collectionLabel:tier?`SKANDI ${tier[0]+tier.slice(1).toLowerCase()}`:"",
    providerAccommodationId:clean(x.providerAccommodationId||x.duffelAccommodationId||x.liveAccommodationId,200),
    searchAirportIata:upper(x.searchAirportIata||iataFor(dst,ctx),3),
    destinationIata:upper(x.searchAirportIata||iataFor(dst,ctx),3),
    price:h.price?.amount?{amount:Number(h.price.amount),currency:h.price.currency||"USD"}:null,
    isLive:false
  };
}
function activityCard(x,ctx){
  const det=d(x),a=ctx.areaMap.get(det.areaId),dst=ctx.destinationMap.get(det.destinationId)||ctx.destinationFor(a),c=ctx.countryFor(dst);
  return {...basePage(x),countrySlug:c?.slug||"",destinationSlug:dst?.slug||"",areaSlug:a?.slug||"",
    location:[a?.name,dst?.name].filter(Boolean).join(", "),image:image(x),path:clean(det.path||"",600)};
}
function directory(ctx){
  return ctx.areas.map(a=>{
    const dst=ctx.destinationFor(a),c=ctx.countryFor(dst);
    return {id:a.id,countrySlug:c?.slug||"",countryName:c?.name||"",countryCode:c?.code||"",
      destinationSlug:dst?.slug||"",destinationName:dst?.name||"",areaSlug:a.slug,slug:a.slug,name:a.name,path:areaPath(c,dst,a)};
  });
}
function destinationDirectory(ctx){
  return ctx.destinationsOnly.map(dst=>{
    const c=ctx.countryFor(dst);
    return {id:dst.id,countrySlug:c?.slug||"",countryName:c?.name||"",countryCode:c?.code||"",
      destinationSlug:dst.slug,slug:dst.slug,name:dst.name,path:destinationPath(c,dst)};
  });
}
function areaCard(a,ctx){
  const dst=ctx.destinationFor(a),c=ctx.countryFor(dst);
  const hotels=ctx.hotels.filter(h=>same(d(h).areaId,a.id));
  return {...basePage(a),countrySlug:c?.slug||"",countryName:c?.name||"",destinationSlug:dst?.slug||"",
    destinationName:dst?.name||"",areaSlug:a.slug,path:areaPath(c,dst,a),hotelsPath:hotelsPath(c,dst,a),
    image:image(a),hotelCount:hotels.length};
}
function destinationCard(dst,ctx){
  const c=ctx.countryFor(dst),areas=ctx.areas.filter(a=>same(a.parentEntityId,dst.id)||same(d(a).destinationId,dst.id));
  const areaIds=new Set(areas.map(a=>a.id));
  const hotels=ctx.hotels.filter(h=>same(d(h).destinationId,dst.id)||areaIds.has(d(h).areaId)||same(h.parentEntityId,dst.id));
  return {...basePage(dst),countrySlug:c?.slug||"",countryName:c?.name||"",countryCode:c?.code||"",
    destinationSlug:dst.slug,path:destinationPath(c,dst),hotelsPath:hotelsPath(c,dst),
    image:image(dst),hotelCount:hotels.length,areaCount:areas.length,
    searchAirportIata:iataFor(dst,ctx),destinationIata:iataFor(dst,ctx)};
}

async function getIndex(input={}){
  const ctx=await inventory(input.language||input.locale||"EN");
  const countries=ctx.countries.map(c=>{
    const children=ctx.destinationsOnly.filter(x=>ctx.countryFor(x)?.id===c.id).map(x=>destinationCard(x,ctx));
    const childIds=new Set(children.map(x=>x.id));
    const childAreas=ctx.areas.filter(a=>childIds.has(ctx.destinationFor(a)?.id));
    const areaIds=new Set(childAreas.map(a=>a.id));
    const hotelCount=ctx.hotels.filter(h=>childIds.has(ctx.destinationFor(h)?.id)||areaIds.has(ctx.areaFor(h)?.id)).length;
    return {...basePage(c),countrySlug:c.slug,path:countryPath(c),image:image(c),
      destinations:children,areas:children,areaCount:children.length,hotelCount};
  }).filter(c=>c.destinations.length>0);
  return {ok:true,source:"INVENTORY_CONTROL",countries,totalCountries:countries.length};
}
async function getCountry(input={}){
  const ctx=await inventory(input.language||input.locale||"EN");
  const c=ctx.countries.find(x=>slug(x.slug)===slug(input.slug)||upper(x.code,10)===upper(input.code,10));
  if(!c)throw new Error("Published country not found in Inventory Control.");
  const destinations=ctx.destinationsOnly.filter(x=>ctx.countryFor(x)?.id===c.id).map(x=>destinationCard(x,ctx));
  const ids=new Set(destinations.map(x=>x.id));
  const areas=ctx.areas.filter(a=>ids.has(ctx.destinationFor(a)?.id)).map(a=>areaCard(a,ctx));
  const areaIds=new Set(areas.map(a=>a.id));
  const hotels=ctx.hotels.filter(h=>ids.has(ctx.destinationFor(h)?.id)||areaIds.has(ctx.areaFor(h)?.id)).map(h=>hotelCard(h,ctx));
  const p=basePage(c);
  return {ok:true,source:"INVENTORY_CONTROL",page:{...p,countrySlug:c.slug,countryName:c.name,countryCode:c.code,
    directory:ctx.countries.map(x=>({slug:x.slug,code:x.code,name:x.name,path:countryPath(x)})),
    regions:destinations,destinations,areas,hotels,previewHotels:hotels.slice(0,12),
    searchAirportIata:"",destinationIata:""}};
}
async function getDestination(input={}){
  const ctx=await inventory(input.language||input.locale||"EN");
  const c=ctx.countries.find(x=>slug(x.slug)===slug(input.countrySlug));
  if(!c)throw new Error("Published country not found in Inventory Control.");
  const dst=ctx.destinationsOnly.find(x=>slug(x.slug)===slug(input.destinationSlug)&&ctx.countryFor(x)?.id===c.id);
  if(!dst)throw new Error("Published destination not found in Inventory Control.");
  const areas=ctx.areas.filter(a=>ctx.destinationFor(a)?.id===dst.id).map(a=>areaCard(a,ctx));
  const areaIds=new Set(areas.map(a=>a.id));
  const hotels=ctx.hotels.filter(h=>same(d(h).destinationId,dst.id)||same(h.parentEntityId,dst.id)||areaIds.has(d(h).areaId)).map(h=>hotelCard(h,ctx));
  const acts=ctx.activities.filter(x=>same(d(x).destinationId,dst.id)||areaIds.has(d(x).areaId)).map(x=>activityCard(x,ctx));
  const p=basePage(dst);
  return {ok:true,source:"INVENTORY_CONTROL",page:{...p,countrySlug:c.slug,countryName:c.name,countryCode:c.code,
    destinationSlug:dst.slug,directory:destinationDirectory(ctx),areas,hotels,previewHotels:hotels.slice(0,12),
    activities:acts,excursions:acts,searchAirportIata:iataFor(dst,ctx),destinationIata:iataFor(dst,ctx),
    hotelsPath:hotelsPath(c,dst)}};
}
async function getArea(input={}){
  const ctx=await inventory(input.language||input.locale||"EN");
  const c=ctx.countries.find(x=>slug(x.slug)===slug(input.countrySlug));
  const dst=ctx.destinationsOnly.find(x=>slug(x.slug)===slug(input.destinationSlug)&&ctx.countryFor(x)?.id===c?.id);
  const a=ctx.areas.find(x=>slug(x.slug)===slug(input.areaSlug)&&ctx.destinationFor(x)?.id===dst?.id);
  if(!c||!dst||!a)throw new Error("Published holiday area not found in Inventory Control.");
  const hotels=ctx.hotels.filter(h=>ctx.areaFor(h)?.id===a.id).map(h=>hotelCard(h,ctx));
  const acts=ctx.activities.filter(x=>same(d(x).areaId,a.id)).map(x=>activityCard(x,ctx));
  const nearby=ctx.areas.filter(x=>ctx.destinationFor(x)?.id===dst.id&&x.id!==a.id).map(x=>areaCard(x,ctx));
  const p=basePage(a);
  return {ok:true,source:"INVENTORY_CONTROL",page:{...p,countrySlug:c.slug,countryName:c.name,countryCode:c.code,
    destinationSlug:dst.slug,destinationName:dst.name,areaSlug:a.slug,directory:directory(ctx),
    hotels,previewHotels:hotels,activities:acts,excursions:acts,nearby,
    searchAirportIata:iataFor(a,ctx)||iataFor(dst,ctx),destinationIata:iataFor(a,ctx)||iataFor(dst,ctx),
    hotelsPath:hotelsPath(c,dst,a)}};
}
async function getHotelBrowse(input={}){
  if(clean(input.areaSlug))return getArea(input);
  if(clean(input.destinationSlug)){
    const result=await getDestination(input);
    const p=result.page;
    return {...result,page:{...p,slug:p.destinationSlug,areaSlug:"",areaName:"",name:p.name,
      intro:p.description||p.fullDescription||"",previewHotels:p.hotels,hotels:p.hotels}};
  }
  const result=await getCountry({slug:input.countrySlug,language:input.language||input.locale});
  const p=result.page;
  return {...result,page:{...p,slug:p.countrySlug,destinationSlug:"",destinationName:"",areaSlug:"",areaName:"",name:p.name,
    intro:p.description||p.fullDescription||"",previewHotels:p.hotels,hotels:p.hotels,hotelsPath:`/hotels/${p.countrySlug}`}};
}
async function getHotel(input={}){
  const lng=input.language||input.locale||"EN";
  const ctx=await inventory(lng);
  let h=null;
  if(input.hotelId)h=ctx.hotels.find(x=>same(x.id,input.hotelId)||same(x.publicId,input.hotelId));
  if(!h&&input.publicId)h=ctx.hotels.find(x=>upper(x.publicId,180)===upper(input.publicId,180));
  if(!h&&input.hotelSlug)h=ctx.hotels.find(x=>slug(x.slug)===slug(input.hotelSlug));
  if(!h&&input.slug)h=ctx.hotels.find(x=>slug(x.slug)===slug(input.slug));
  if(!h)throw new Error("Published hotel not found in Inventory Control.");
  const card=hotelCard(h,ctx),x=d(h),a=ctx.areaFor(h),dst=ctx.destinationFor(h)||ctx.destinationFor(a),c=ctx.countryFor(dst);
  if(input.countrySlug&&slug(input.countrySlug)!==slug(c?.slug))throw new Error("Hotel does not belong to this country in Inventory Control.");
  if(input.destinationSlug&&slug(input.destinationSlug)!==slug(dst?.slug))throw new Error("Hotel does not belong to this destination in Inventory Control.");
  if(input.areaSlug&&slug(input.areaSlug)!==slug(a?.slug))throw new Error("Hotel does not belong to this area in Inventory Control.");
  const lt={...obj(x.locationTransfer),address:clean(x.address||obj(x.locationTransfer).address,500),
    latitude:num(x.latitude,null),longitude:num(x.longitude,null),
    airportDistance:x.distanceToAirport?`${x.distanceToAirport} km`:clean(obj(x.locationTransfer).airportDistance,100),
    transferTime:x.transferTimeMinutes?`${x.transferTimeMinutes} min`:clean(obj(x.locationTransfer).transferTime,100),
    centerDistance:x.distanceToCenter?`${x.distanceToCenter} m`:clean(obj(x.locationTransfer).centerDistance,100),
    beachDistance:x.distanceToBeach?`${x.distanceToBeach} m`:clean(obj(x.locationTransfer).beachDistance,100)};
  return {ok:true,source:"INVENTORY_CONTROL",page:{...card,
    officialClassification:num(x.officialStarRating,0),classification:num(x.officialStarRating,0),
    skandiRating:num(x.skandiRating,0),guestRating:num(x.guestRating||x.skandiRating,0),
    food:obj(x.food),accessibility:obj(x.accessibility),poolBeach:obj(x.poolBeach),
    activities:obj(x.activities),locationTransfer:lt,climate:arr(x.climate),reviews:arr(x.reviews),
    selection:{origin:"",departureDate:"",duration:8,travelers:2,meal:"noselection",roomKey:""}}};
}

export const getInventoryDestinationIndex=webMethod(Permissions.Anyone,getIndex);
export const getInventoryCountryPage=webMethod(Permissions.Anyone,getCountry);
export const getInventoryDestinationPage=webMethod(Permissions.Anyone,getDestination);
export const getInventoryAreaPage=webMethod(Permissions.Anyone,getArea);
export const getInventoryHotelBrowsePage=webMethod(Permissions.Anyone,getHotelBrowse);
export const getInventoryHotelPage=webMethod(Permissions.Anyone,getHotel);
