
import { sbSelect, eq } from "backend/supabaseClient";

const VIEW="inventory_public_entities_v";
const DATED_VIEW="inventory_public_dated_v";

const clean=(v,m=2000)=>String(v??"").trim().slice(0,m);
const upper=(v,m=2000)=>clean(v,m).toUpperCase();
const num=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
const obj=v=>v&&typeof v==="object"&&!Array.isArray(v)?v:{};
function arr(v){
  if(Array.isArray(v)) return v;
  if(v==null||v==="") return [];
  if(typeof v==="string"){
    const s=v.trim(); if(!s)return [];
    try{const p=JSON.parse(s);if(Array.isArray(p))return p}catch(_){}
    return s.split(/[\n,]/).map(x=>x.trim()).filter(Boolean);
  }
  return [v];
}
function lang(input={}) {
  const x=upper(input.language||input.locale||"EN",10);
  return ["EN","SV","NO","DA","FI"].includes(x)?x:"EN";
}
function localized(row,lng){
  const list=arr(row.localized);
  return list.find(x=>upper(x?.language,10)===lng)||list.find(x=>upper(x?.language,10)==="EN")||list[0]||{};
}
function media(row){return arr(row.media).filter(x=>x?.url)}
function hero(row){
  const m=media(row);
  return m.find(x=>x.isHero)||m.find(x=>x.isPrimary)||m.find(x=>x.isCard)||m[0]||{};
}
function card(row){
  const m=media(row);
  return m.find(x=>x.isCard)||m.find(x=>x.isHero)||m.find(x=>x.isPrimary)||m[0]||{};
}
function norm(row,lng="EN"){
  const l=localized(row,lng),d=obj(row.details),c=obj(row.commercial),s=obj(row.seo);
  return {
    id:row.id,publicId:row.public_id,entityType:row.entity_type,code:row.code,
    name:clean(l.title||row.name,500),baseName:row.name,slug:row.slug||"",
    featured:Boolean(row.featured),homepageFeatured:Boolean(row.homepage_featured),
    sortPriority:Number(row.sort_priority||100),parentEntityId:row.parent_entity_id||"",
    details:d,commercial:c,seo:s,localized:l,localizedAll:arr(row.localized),
    media:media(row),heroImage:hero(row).url||"",cardImage:card(row).url||"",
    gallery:media(row).map(x=>x.url),relations:arr(row.relations),
    description:clean(l.shortDescription||d.shortDescription||d.description||d.summary||s.description||"",5000),
    fullDescription:clean(l.fullDescription||d.fullDescription||"",20000),
    highlights:arr(l.highlights||d.highlights),
    price:{amount:num(c.publicPrice,0),currency:upper(c.currency||"USD",3),priceBasis:clean(c.priceBasis,50)},
    updatedAt:row.updated_at
  };
}
export async function listPublicInventoryInternal(input={}){
  const lng=lang(input),type=upper(input.entityType||input.type,50);
  let q="select=*&order=sort_priority.asc,name.asc";
  if(type)q+=`&${eq("entity_type",type)}`;
  let items=((await sbSelect(VIEW,q))||[]).map(r=>norm(r,lng));
  if(input.featured===true)items=items.filter(x=>x.featured);
  if(input.homepageFeatured===true)items=items.filter(x=>x.homepageFeatured);
  const search=clean(input.query,200).toLowerCase();
  if(search)items=items.filter(x=>[x.publicId,x.code,x.name,x.slug,x.description].join(" ").toLowerCase().includes(search));
  return items.slice(0,Math.min(Math.max(Number(input.limit||500),1),1000));
}
export async function getPublicInventoryRecordInternal(input={}){
  const list=await listPublicInventoryInternal({entityType:input.entityType||input.type,language:input.language,limit:1000});
  const id=clean(input.id,100),pid=upper(input.publicId,160),code=upper(input.code,100),slug=clean(input.slug,200).toLowerCase();
  return list.find(x=>(id&&x.id===id)||(pid&&upper(x.publicId,160)===pid)||(code&&upper(x.code,100)===code)||(slug&&x.slug.toLowerCase()===slug))||null;
}
export async function getPublicDatedInventoryInternal(input={}){
  if(!input.entityId)return [];
  const rows=(await sbSelect(DATED_VIEW,`select=*&${eq("entity_id",input.entityId)}&order=service_date.asc,start_time.asc`))||[];
  return rows.map(r=>({
    id:r.id,entityId:r.entity_id,serviceDate:r.service_date,startTime:r.start_time||"",endTime:r.end_time||"",
    variantCode:r.variant_code||"",variantName:r.variant_name||"",capacityTotal:Number(r.capacity_total||0),
    available:Number(r.available||0),status:r.status,publicPrice:num(r.public_price,0),
    adultPrice:num(r.adult_price,0),childPrice:num(r.child_price,0),infantPrice:num(r.infant_price,0),
    privatePrice:num(r.private_price,0),currency:r.currency,priceBasis:r.price_basis
  }));
}
function iata(x){const d=x.details||{};return upper(d.searchAirportIata||d.destinationIata||d.airportIata||d.iata||"",3)}
function tags(x){return arr(x.details?.tags)}
function destinationCard(x,country=""){
  return {id:x.id,title:x.name,name:x.name,country,slug:x.slug,destinationCode:iata(x)||x.code,iata:iata(x),
    description:x.description,imageUrl:x.cardImage||x.heroImage,fromPrice:x.price.amount,currency:x.price.currency,
    tags:tags(x).slice(0,5),path:`/destinations?destination=${encodeURIComponent(x.slug)}`};
}
function hotelCard(x,destination=""){
  const d=x.details||{};
  return {id:x.id,hotelId:x.publicId||x.code,code:x.code,name:x.name,title:x.name,slug:x.slug,
    areaId:d.areaId||d.destinationId||x.parentEntityId||"",destinationId:d.destinationId||x.parentEntityId||"",
    location:d.address||d.city||destination,area:destination||d.city||"",city:d.city||"",
    airportIata:upper(d.searchAirportIata||"",3),nearestAirportIata:upper(d.searchAirportIata||"",3),
    destinationIata:upper(d.searchAirportIata||"",3),rating:num(d.skandiRating||d.officialStarRating||d.guestRating,0),
    guestRating:num(d.guestRating,0),reviewCount:Number(d.reviewCount||0),price:x.price.amount,currency:x.price.currency,
    badge:d.skandiTier||"SKANDI selected",tags:arr(d.facilities),image:x.cardImage||x.heroImage,gallery:x.gallery,
    short:x.description,bullets:arr(d.facilities).slice(0,6),facts:arr(d.facts),rooms:arr(d.rooms),climate:arr(d.climate),
    map:d.address||d.city||x.name,providerAccommodationId:d.providerAccommodationId||""};
}
export async function getDestinationFinderDataInternal(input={}){
  const [dest,hotels]=await Promise.all([
    listPublicInventoryInternal({entityType:"DESTINATION",language:input.language,limit:1000}),
    listPublicInventoryInternal({entityType:"HOTEL",language:input.language,limit:1000})
  ]);
  const countries=dest.filter(x=>upper(x.details?.level,20)==="COUNTRY");
  const areas=dest.filter(x=>upper(x.details?.level,20)!=="COUNTRY");
  const countryFor=a=>{
    if(a.parentEntityId&&countries.some(c=>c.id===a.parentEntityId))return a.parentEntityId;
    const cc=upper(a.details?.countryCode,20),cn=clean(a.details?.countryName,200).toLowerCase();
    const c=countries.find(x=>(cc&&upper(x.code,20)===cc)||(cn&&x.name.toLowerCase()===cn));
    return c?.id||(countries.length===1?countries[0].id:"");
  };
  return {
    countries:countries.map(c=>({id:c.id,name:c.name,slug:c.slug,code:c.code,iata:iata(c),airportIata:iata(c),
      nearestAirportIata:iata(c),destinationIata:iata(c),title:c.name,intro:c.fullDescription||c.description,
      image:c.heroImage||c.cardImage,gallery:c.gallery,tags:tags(c),card:c.description})),
    areas:areas.map(a=>({id:a.id,countryId:countryFor(a),name:a.name,slug:a.slug,region:a.details?.region||"",
      image:a.heroImage||a.cardImage,tags:tags(a),iata:iata(a),airportIata:iata(a),nearestAirportIata:iata(a),
      destinationIata:iata(a),title:a.name,description:a.fullDescription||a.description,
      coordinates:{latitude:num(a.details?.latitude,0),longitude:num(a.details?.longitude,0)},map:a.name})),
    hotels:hotels.map(h=>{const a=areas.find(x=>x.id===(h.details?.areaId||h.details?.destinationId||h.parentEntityId));
      const v=hotelCard(h,a?.name||"");v.countryId=a?countryFor(a):"";return v;})
  };
}
export async function getHomeContentInternal(input={}){
  const [dest,hotels,packages,activities,tours,transfers,airports]=await Promise.all([
    listPublicInventoryInternal({entityType:"DESTINATION",language:input.language,limit:100}),
    listPublicInventoryInternal({entityType:"HOTEL",language:input.language,limit:100}),
    listPublicInventoryInternal({entityType:"PACKAGE",language:input.language,limit:100}),
    listPublicInventoryInternal({entityType:"ACTIVITY",language:input.language,limit:100}),
    listPublicInventoryInternal({entityType:"GUIDED_TOUR",language:input.language,limit:100}),
    listPublicInventoryInternal({entityType:"TRANSFER",language:input.language,limit:100}),
    listPublicInventoryInternal({entityType:"AIRPORT",language:input.language,limit:1000})
  ]);
  const countries=dest.filter(x=>upper(x.details?.level,20)==="COUNTRY");
  const places=dest.filter(x=>upper(x.details?.level,20)!=="COUNTRY");
  const featuredPlaces=places.filter(x=>x.homepageFeatured);
  const destinations=(featuredPlaces.length?featuredPlaces:places.length?places:countries).slice(0,8).map(x=>destinationCard(x,x.details?.countryName||""));
  const pool=[...packages,...hotels,...activities,...tours,...transfers];
  const hp=pool.filter(x=>x.homepageFeatured),f=pool.filter(x=>x.featured);
  const offers=(hp.length?hp:f.length?f:pool).slice(0,8).map(x=>{
    const d=x.details||{};
    return {id:x.id,title:x.name,description:x.description,imageUrl:x.cardImage||x.heroImage,
      badge:d.skandiTier||d.category||x.entityType.replaceAll("_"," "),destinationCode:upper(d.searchAirportIata||"",3),
      fromPrice:x.price.amount,currency:x.price.currency,tags:arr(d.tags||d.facilities).slice(0,5),
      path:x.entityType==="HOTEL"?`/hotels?hotel=${encodeURIComponent(x.slug)}`:
        x.entityType==="PACKAGE"?`/packages?package=${encodeURIComponent(x.slug)}`:
        x.entityType==="TRANSFER"?`/transfers?transfer=${encodeURIComponent(x.slug)}`:`/tours?activity=${encodeURIComponent(x.slug)}`,
      search:{tripType:x.entityType==="HOTEL"?"hotelOnly":x.entityType==="PACKAGE"?"package":"activity",
        destination:upper(d.searchAirportIata||"",3),currency:x.price.currency,
        hotelIds:x.entityType==="HOTEL"&&d.providerAccommodationId?[d.providerAccommodationId]:undefined}};
  });
  return {
    airports:airports.map(a=>({city:a.details?.city||a.name,name:a.name,iata:upper(a.details?.iata||a.code,3),
      icao:upper(a.details?.icao,4),country:a.details?.country||""})).filter(a=>a.iata),
    destinations,offers,
    trust:[
      {title:"Live availability",text:"Travel prices are checked before payment."},
      {title:"Controlled inventory",text:"Published products come directly from SKANDI Inventory Control."},
      {title:"One journey",text:"Flights, stays and local services stay connected."},
      {title:"SKANDI support",text:"Help before, during and after your journey."}
    ],
    tripTypes:[
      {title:"Flight + Hotel",text:"Bundle live flights with SKANDI stays.",icon:"â",action:"holidays"},
      {title:"Only flights",text:"Search live flight offers.",icon:"ð«",action:"flights"},
      {title:"Only hotels",text:"Browse published SKANDI hotels.",icon:"ð¨",action:"hotels"},
      {title:"Tours & Activities",text:"Browse published experiences.",icon:"â",path:"/tours"},
      {title:"Transfers",text:"Airport and private transfers.",icon:"â",path:"/transfers"},
      {title:"Travel guides",text:"Explore destinations.",icon:"â",path:"/destinations"}
    ],
    why:[
      {title:"One source of truth",text:"Public travel content is controlled from Inventory Control."},
      {title:"Smart availability",text:"Dated inventory controls what can actually be sold."},
      {title:"Structured product data",text:"Hotels, destinations and local products share one model."},
      {title:"Support throughout",text:"SKANDI support stays connected to the journey."}
    ]
  };
}
