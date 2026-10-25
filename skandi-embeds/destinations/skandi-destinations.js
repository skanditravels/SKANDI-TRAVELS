
/* =========================================================
   CONFIG / CONTRACT
   ========================================================= */
const HTML_SOURCE = "SKANDI_PUBLIC_NETWORK_MAP";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";
const MAP_STYLE_URL = "https://tiles.openfreemap.org/styles/dark";
const BOOKING_ROUTE = "/booking";
const HOTEL_SEARCH_ROUTE = "/hotels";
const COUNTRY_ROUTE = "/destinations/country";
const DESTINATION_ROUTE = "/destinations/country/destination";
const SAFE_PROTOCOLS = new Set(["http:","https:"]);
const REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const SAVE_DATA = Boolean(navigator.connection && navigator.connection.saveData);
const IS_MOBILE = () => window.matchMedia("(max-width: 820px)").matches;

/* =========================================================
   STATE
   ========================================================= */
const state = {
  mode:"explore",
  selectionType:null,
  selectionId:null,
  selectedAirlineId:null,
  selectedRegion:null,
  searchOpen:false,
  destinationDirectoryOpen:false,
  panelOpen:false,
  mobileSheetState:"peek",
  mapReady:false,
  dataState:"idle",
  dataReceived:false,
  retryCount:0,
  hover:{type:null,id:null},
  payload:null,
  model:{destinations:[],hotels:[],airports:[],airlines:[],routes:[],regions:[],stats:{}},
  map:null,
  mapInitialized:false,
  pendingPayload:null,
  routeAnimationFrame:0,
  resizeObserver:null
};

const el = {};
function cacheElements(){
  ["networkHero","networkMap","networkMeta","modeRail","regionStrip","searchOpen","searchLayer","searchClose","networkSearch","searchResults","mapTooltip","detailPanel","panelClose","panelImage","panelBody","mobileSheet","mobileSheetContent","sheetSnap","zoomIn","zoomOut","resetMap","mapStatus","mapStatusText","mapRetry","selectionLive","featuredDestinations","collectionChapter","collectionRail","airlineChapter","airlineRail","planJourney","directoryGrid","destinationsListOpen","destinationsListPage","destinationsListBack","destinationsAlphabet","destinationsListContent"].forEach(id=>{el[id]=document.getElementById(id)});
}

/* =========================================================
   UTILITIES / VALIDATION
   ========================================================= */
function firstDefined(...values){return values.find(v=>v!==undefined&&v!==null&&v!=="") ?? ""}
function cleanString(value,max=500){return String(value??"").trim().slice(0,max)}
function cleanId(value){return cleanString(value,160)}
function toNumber(value){
  if(typeof value==="number"&&Number.isFinite(value))return value;
  if(typeof value==="string"){
    const n=Number(value.trim().replace(",","."));
    return Number.isFinite(n)?n:null;
  }
  return null;
}
function validCoordinate(lat,lng){return Number.isFinite(lat)&&Number.isFinite(lng)&&lat>=-90&&lat<=90&&lng>=-180&&lng<=180}
function toArray(value){
  if(Array.isArray(value))return value.map(v=>cleanString(typeof v==="object"?firstDefined(v.code,v.id,v.name,v.label):v,120)).filter(Boolean);
  if(typeof value==="string")return value.split(",").map(v=>v.trim()).filter(Boolean);
  return [];
}
function unique(values){return [...new Set((values||[]).map(v=>cleanString(v,180)).filter(Boolean))]}
function slugify(value){return cleanString(value,120).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}
function safeUrl(value){
  const raw=cleanString(value,1500);
  if(!raw)return "";
  if(raw.startsWith("/"))return raw;
  if(raw.startsWith("?"))return raw;
  if(/^[a-z0-9][a-z0-9/_-]*(\?.*)?$/i.test(raw))return "/"+raw.replace(/^\/+/,"");
  try{
    const url=new URL(raw,window.location.origin);
    if(!SAFE_PROTOCOLS.has(url.protocol))return "";
    return url.href;
  }catch{return ""}
}
function getLocation(item={}){
  const nested=item.location||item.geoLocation||item.coordinates||item.addressLocation||item.mapLocation||{};
  const lat=toNumber(firstDefined(item.lat,item.latitude,item.Latitude,nested.lat,nested.latitude,Array.isArray(item.coordinates)?item.coordinates[1]:""));
  const lng=toNumber(firstDefined(item.lng,item.lon,item.long,item.longitude,item.Longitude,nested.lng,nested.lon,nested.long,nested.longitude,Array.isArray(item.coordinates)?item.coordinates[0]:""));
  return {lat,lng,valid:validCoordinate(lat,lng)};
}
function imageUrl(item={}){return safeUrl(firstDefined(item.heroImage,item.image,item.mainImage,item.coverImage,item.imageUrl,item.media?.hero?.url,item.asset?.publicUrl))}
function pageUrl(item={}){
  const direct=safeUrl(firstDefined(item.pageUrl,item.url,item.link,item.pageLink,item.href));
  if(direct)return direct;
  if(Array.isArray(item.linked)){
    for(const linked of item.linked){const candidate=safeUrl(linked&&firstDefined(linked.url,linked.pageUrl,linked.href));if(candidate)return candidate}
  }
  return "";
}
function mapDataMessagePayload(data){
  if(typeof data==="string"){try{data=JSON.parse(data)}catch{return null}}
  if(!data||typeof data!=="object")return null;
  if(data.source&&data.source!==PARENT_SOURCE)return null;
  const type=cleanString(data.type).toUpperCase();
  if(type&&type!=="SKANDI_MAP_DATA"&&type!=="SKANDI-MAP-DATA")return null;
  const payload=data.payload||data.data||data;
  if(!payload||typeof payload!=="object")return null;
  if(!["destinations","routes","hotels","airports","airlines"].some(k=>Array.isArray(payload[k])))return null;
  return payload;
}
function logger(event,detail={}){console.info("[SKANDI NETWORK]",event,detail)}
function analytics(event,detail={}){
  try{window.parent?.postMessage({source:HTML_SOURCE,type:"SKANDI_MAP_ANALYTICS",event,detail},"*")}catch{}
}

/* =========================================================
   NORMALIZATION
   ========================================================= */
function normalizeDestination(item={},derived=false){
  const loc=getLocation(item);
  const id=cleanId(firstDefined(item.publicId,item.id,item.code,item.Code,item.slug,item._id,item.iata,item.IATA));
  const iata=cleanString(firstDefined(item.iata,item.IATA,item.airportCode),8).toUpperCase();
  return {
    id:id||slugify(firstDefined(item.name,item.title,item.city)),
    slug:cleanString(firstDefined(item.slug,item.urlSlug,slugify(firstDefined(item.name,item.title,item.city))),160),
    name:cleanString(firstDefined(item.name,item.title,item.destinationName,item.city,item.label,item.code),180),
    country:cleanString(firstDefined(item.country,item.Country,item.locationCountry),120),
    region:cleanString(firstDefined(item.region,item.Region,item.subRegion,item.continent,item.country),120),
    iata,
    lat:loc.lat,lng:loc.lng,mappable:loc.valid,
    summary:cleanString(firstDefined(item.summary,item.description,item.shortDescription,item.excerpt,item.editorial),900),
    tags:unique(toArray(firstDefined(item.tags,item.Tags,item.categories,item.goodFor))),
    pageUrl:pageUrl(item),
    heroImage:imageUrl(item),
    airportIds:unique(toArray(firstDefined(item.airportIds,item.airports))),
    hotelIds:unique(toArray(firstDefined(item.hotelIds,item.hotels))),
    routeIds:unique(toArray(firstDefined(item.routeIds,item.routes))),
    airlineIds:unique(toArray(firstDefined(item.airlineIds,item.airlines))),
    featured:Boolean(firstDefined(item.featured,item.homepageFeatured,item.homepage_featured,false)),
    priority:Number(firstDefined(item.displayPriority,item.sortPriority,item.sort_priority,item.searchPriority,9999))||9999,
    derived
  };
}
function looksAirportLike(item={}){
  const iata=cleanString(firstDefined(item.iata,item.IATA,item.airportCode,item.code),8);
  const text=[item.summary,item.description,item.title,item.name].map(v=>cleanString(v).toLowerCase()).join(" ");
  return Boolean(iata&&iata.length===3&&(text.includes("airport")||item.icao||item.ICAO||item.airportCode));
}
function normalizeAirport(item={}){
  const loc=getLocation(item);
  const iata=cleanString(firstDefined(item.iata,item.IATA,item.code,item.airportCode,item.id),8).toUpperCase();
  return {
    id:cleanId(firstDefined(item.id,item.publicId,iata,item._id))||iata,
    iata,
    icao:cleanString(firstDefined(item.icao,item.ICAO),8).toUpperCase(),
    name:cleanString(firstDefined(item.airportName,item.title,item.name,iata),180),
    city:cleanString(firstDefined(item.city,item.locationCity,item.destination,item.name),140),
    country:cleanString(firstDefined(item.country,item.Country,item.locationCountry),120),
    region:cleanString(firstDefined(item.region,item.Region,item.country),120),
    lat:loc.lat,lng:loc.lng,mappable:loc.valid,
    summary:cleanString(firstDefined(item.summary,item.description,item.information),700),
    destinationIds:unique(toArray(firstDefined(item.destinationIds,item.destinations,item.destinationId))),
    airlineIds:unique(toArray(firstDefined(item.airlineIds,item.airlines))),
    pageUrl:pageUrl(item),heroImage:imageUrl(item)
  };
}
function normalizeHotel(item={}){
  const loc=getLocation(item);
  const explicitCollection=firstDefined(item.collectionStatus,item.isCollection,item.skandiCollection,item.collection,item.collectionApproved,item.selected,undefined);
  const isCollection=explicitCollection===undefined?false:Boolean(explicitCollection)&&String(explicitCollection).toLowerCase()!=="false";
  return {
    id:cleanId(firstDefined(item.publicId,item.id,item.hotelId,item.code,item._id)),
    slug:cleanString(firstDefined(item.slug,item.urlSlug,slugify(firstDefined(item.name,item.title,item.hotelName))),160),
    name:cleanString(firstDefined(item.name,item.title,item.hotelName),180),
    destinationId:cleanId(firstDefined(item.destinationId,item.destinationCode,item.destCode,item.destination?.id,item.city)),
    area:cleanString(firstDefined(item.area,item.neighborhood,item.region,item.destination),140),
    city:cleanString(firstDefined(item.city,item.destination),140),
    country:cleanString(firstDefined(item.country),120),
    region:cleanString(firstDefined(item.region,item.country),120),
    lat:loc.lat,lng:loc.lng,mappable:loc.valid,
    summary:cleanString(firstDefined(item.summary,item.description,item.shortDescription,item.publicDescription),800),
    tags:unique(toArray(firstDefined(item.tags,item.publicTags,item.amenities,item.highlights))),
    pageUrl:pageUrl(item),image:imageUrl(item),
    starRating:cleanString(firstDefined(item.starRating,item.stars),20),
    tier:cleanString(firstDefined(item.collectionTier,item.tier,item.category),80),
    isCollection
  };
}
function normalizeAirline(item={}){
  const iata=cleanString(firstDefined(item.iata,item.IATA,item.code,item.airlineCode),8).toUpperCase();
  return {
    id:cleanId(firstDefined(item.id,item.publicId,item.recordId,iata,item.icao,item.name))||iata||slugify(item.name),
    iata,
    icao:cleanString(firstDefined(item.icao,item.ICAO),8).toUpperCase(),
    name:cleanString(firstDefined(item.name,item.title,item.shortName,iata),160),
    logo:safeUrl(firstDefined(item.logo,item.logoUrl,item.logoFile,item.logoIcon,item.logoIconUrl)),
    pageUrl:pageUrl(item),
    partnerStatus:Boolean(firstDefined(item.partnerStatus,item.partner,item.isPartner,item.selected,true))
  };
}
function normalizeRoute(item={}){
  const fromId=cleanId(firstDefined(item.fromId,item.fromCode,item.originId,item.originCode,item.from,item.origin,item.originIata)).toUpperCase();
  const toId=cleanId(firstDefined(item.toId,item.toCode,item.destinationId,item.destinationCode,item.to,item.destination,item.destinationIata)).toUpperCase();
  return {
    id:cleanId(firstDefined(item.publicId,item.id,item.code,item.routeCode,item._id,`${fromId}-${toId}`)),
    fromId,toId,
    via:unique(toArray(firstDefined(item.via,item.viaCodes,item.viaIds,item.stops,item.stopCodes))),
    label:cleanString(firstDefined(item.label,item.name,item.title),140),
    airlineIds:unique(toArray(firstDefined(item.airlineIds,item.airlines,item.carriers,item.airline))).map(v=>v.toUpperCase()),
    tags:unique(toArray(firstDefined(item.tags,item.Tags))),
    pageUrl:pageUrl(item),
    direct:firstDefined(item.direct,item.isDirect,item.nonstop,undefined),
    seasonal:firstDefined(item.seasonal,item.isSeasonal,undefined),
    priority:Number(firstDefined(item.displayPriority,item.priority,item.sortPriority,9999))||9999,
    featured:Boolean(firstDefined(item.featured,item.selected,false))
  };
}
function derivedDestinationsFromAirports(airports,hotels){
  const groups=new Map();
  airports.forEach(a=>{
    const key=[a.city||a.name,a.country].join("|").toLowerCase();
    if(!key.replace("|","").trim())return;
    if(!groups.has(key))groups.set(key,[]);
    groups.get(key).push(a);
  });
  return [...groups.values()].map(group=>{
    const primary=group.find(a=>a.mappable)||group[0];
    const relatedHotels=hotels.filter(h=>[h.city,h.destinationId].some(v=>cleanString(v).toLowerCase()===cleanString(primary.city||primary.name).toLowerCase()||cleanString(v).toUpperCase()===primary.iata));
    return normalizeDestination({
      id:`city:${slugify(primary.city||primary.name)}:${slugify(primary.country)}`,
      slug:slugify(primary.city||primary.name),
      name:primary.city||primary.name,
      country:primary.country,
      region:primary.region||primary.country,
      lat:primary.lat,lng:primary.lng,
      summary:relatedHotels[0]?.summary||"",
      airportIds:group.map(a=>a.iata||a.id),
      hotelIds:relatedHotels.map(h=>h.id),
      heroImage:relatedHotels[0]?.image||primary.heroImage||""
    },true);
  });
}
function groupRoutes(routes){
  const grouped=new Map();
  routes.forEach(route=>{
    if(!route.fromId||!route.toId)return;
    const pair=[route.fromId,route.toId].sort();
    const key=pair.join("↔");
    const current=grouped.get(key);
    if(!current){grouped.set(key,{...route,id:key,fromId:pair[0],toId:pair[1],airlineIds:[...route.airlineIds],sourceRouteIds:[route.id],directions:new Set([`${route.fromId}>${route.toId}`])})}
    else{
      current.airlineIds=unique([...current.airlineIds,...route.airlineIds]);
      current.tags=unique([...current.tags,...route.tags]);
      current.sourceRouteIds.push(route.id);
      current.directions.add(`${route.fromId}>${route.toId}`);
      current.featured=current.featured||route.featured;
      current.priority=Math.min(current.priority,route.priority);
      if(!current.label&&route.label)current.label=route.label;
    }
  });
  return [...grouped.values()].map(r=>({...r,directions:[...r.directions]}));
}
function normalizePayload(payload={}){
  const rawDestinations=Array.isArray(payload.destinations)?payload.destinations:[];
  const rawAirports=Array.isArray(payload.airports)?payload.airports:[];
  const rawHotels=Array.isArray(payload.hotels)?payload.hotels:[];
  const rawAirlines=Array.isArray(payload.airlines)?payload.airlines:[];
  const rawRoutes=Array.isArray(payload.routes)?payload.routes:[];

  const hotels=rawHotels.map(normalizeHotel).filter(h=>h.id&&h.name&&h.isCollection);
  const explicitAirports=rawAirports.map(normalizeAirport).filter(a=>a.id&&a.iata);
  const legacyAirports=rawDestinations.filter(looksAirportLike).map(normalizeAirport).filter(a=>a.id&&a.iata);
  const airports=dedupeById(explicitAirports.length?explicitAirports:legacyAirports);
  let destinations=rawDestinations.filter(item=>!looksAirportLike(item)||rawAirports.length>0).map(item=>normalizeDestination(item,false)).filter(d=>d.id&&d.name);
  if(!destinations.length&&airports.length)destinations=derivedDestinationsFromAirports(airports,hotels);

  hotels.forEach(h=>{
    const destination=resolveDestinationForHotel(h,destinations,airports);
    if(destination){h.destinationId=destination.id;destination.hotelIds=unique([...destination.hotelIds,h.id])}
  });
  airports.forEach(a=>{
    const destination=destinations.find(d=>d.airportIds.some(id=>id.toUpperCase()===(a.iata||a.id).toUpperCase()))||destinations.find(d=>cleanString(d.name).toLowerCase()===cleanString(a.city).toLowerCase());
    if(destination){a.destinationIds=unique([...a.destinationIds,destination.id]);destination.airportIds=unique([...destination.airportIds,a.iata||a.id])}
  });

  const routes=groupRoutes(rawRoutes.map(normalizeRoute).filter(r=>r.fromId&&r.toId));
  const derivedAirlineCodes=unique(routes.flatMap(r=>r.airlineIds));
  const airlines=dedupeById([
    ...rawAirlines.map(normalizeAirline).filter(a=>a.id&&a.name&&a.partnerStatus),
    ...derivedAirlineCodes.map(code=>normalizeAirline({id:code,iata:code,name:code,partnerStatus:true}))
  ]);

  routes.forEach(r=>{
    const from=resolveNetworkNode(r.fromId,destinations,airports);
    const to=resolveNetworkNode(r.toId,destinations,airports);
    r.fromNode=from||null;r.toNode=to||null;r.mappable=Boolean(from?.mappable&&to?.mappable);
    destinations.forEach(d=>{
      const ids=new Set([d.id.toUpperCase(),d.iata.toUpperCase(),...d.airportIds.map(v=>v.toUpperCase())]);
      if(ids.has(r.fromId)||ids.has(r.toId)){d.routeIds=unique([...d.routeIds,r.id]);d.airlineIds=unique([...d.airlineIds,...r.airlineIds])}
    });
    airports.forEach(a=>{if([a.iata,a.id].map(v=>cleanString(v).toUpperCase()).includes(r.fromId)||[a.iata,a.id].map(v=>cleanString(v).toUpperCase()).includes(r.toId))a.airlineIds=unique([...a.airlineIds,...r.airlineIds])});
  });

  const regions=unique((Array.isArray(payload.regions)?payload.regions.map(v=>typeof v==="object"?firstDefined(v.name,v.label,v.id):v):[]).concat(destinations.map(d=>d.region||d.country))).sort((a,b)=>a.localeCompare(b));
  const stats={destinations:destinations.length,routes:routes.length,hotels:hotels.length,airlines:airlines.length,airports:airports.length};
  return {destinations,hotels,airports,airlines,routes,regions,stats,publicNote:cleanString(payload.publicNote,500),generatedAt:payload.generatedAt||""};
}
function dedupeById(items){const seen=new Set();return items.filter(item=>{const key=cleanString(item.id||item.iata||item.name).toLowerCase();if(!key||seen.has(key))return false;seen.add(key);return true})}
function resolveDestinationForHotel(h,destinations,airports){
  const keys=[h.destinationId,h.city,h.area,h.region].map(v=>cleanString(v).toLowerCase()).filter(Boolean);
  return destinations.find(d=>[d.id,d.slug,d.name,d.iata,...d.airportIds].map(v=>cleanString(v).toLowerCase()).some(v=>keys.includes(v)))||destinations.find(d=>cleanString(d.country).toLowerCase()===cleanString(h.country).toLowerCase()&&cleanString(d.name).toLowerCase()===cleanString(h.city).toLowerCase())||null;
}
function resolveNetworkNode(id,destinations=state.model.destinations,airports=state.model.airports){
  const key=cleanString(id).toUpperCase();
  return airports.find(a=>[a.id,a.iata,a.icao].map(v=>cleanString(v).toUpperCase()).includes(key))||destinations.find(d=>[d.id,d.iata,d.slug,...d.airportIds].map(v=>cleanString(v).toUpperCase()).includes(key))||null;
}

/* =========================================================
   GEO HELPERS
   ========================================================= */
function toRad(v){return v*Math.PI/180}function toDeg(v){return v*180/Math.PI}
function greatCircleGeometry(a,b,steps=96){
  if(!a?.mappable||!b?.mappable)return null;
  const φ1=toRad(a.lat),λ1=toRad(a.lng),φ2=toRad(b.lat),λ2=toRad(b.lng);
  const cosΔ=Math.sin(φ1)*Math.sin(φ2)+Math.cos(φ1)*Math.cos(φ2)*Math.cos(λ2-λ1);
  const Δ=Math.acos(Math.min(1,Math.max(-1,cosΔ)));
  if(!Number.isFinite(Δ)||Δ===0)return {type:"LineString",coordinates:[[a.lng,a.lat],[b.lng,b.lat]]};
  const points=[];
  for(let i=0;i<=steps;i++){
    const t=i/steps;
    const A=Math.sin((1-t)*Δ)/Math.sin(Δ),B=Math.sin(t*Δ)/Math.sin(Δ);
    const x=A*Math.cos(φ1)*Math.cos(λ1)+B*Math.cos(φ2)*Math.cos(λ2);
    const y=A*Math.cos(φ1)*Math.sin(λ1)+B*Math.cos(φ2)*Math.sin(λ2);
    const z=A*Math.sin(φ1)+B*Math.sin(φ2);
    const φ=Math.atan2(z,Math.sqrt(x*x+y*y));
    const λ=Math.atan2(y,x);
    points.push([toDeg(λ),toDeg(φ)]);
  }
  const lines=[[]];
  for(let i=0;i<points.length;i++){
    if(i&&Math.abs(points[i][0]-points[i-1][0])>180)lines.push([]);
    lines[lines.length-1].push(points[i]);
  }
  const validLines=lines.filter(line=>line.length>1);
  return validLines.length===1?{type:"LineString",coordinates:validLines[0]}:{type:"MultiLineString",coordinates:validLines};
}
function boundsForFeatures(items){
  if(!window.maplibregl)return null;
  const bounds=new maplibregl.LngLatBounds();let count=0;
  items.forEach(item=>{if(item?.mappable){bounds.extend([item.lng,item.lat]);count++}});
  return count?bounds:null;
}
function pointFeature(item,type,props={}){return {type:"Feature",id:item.id,geometry:{type:"Point",coordinates:[item.lng,item.lat]},properties:{id:item.id,type,name:item.name||item.city||item.iata||"",...props}}}
function emptyFC(){return {type:"FeatureCollection",features:[]}}

/* =========================================================
   MAP INITIALIZATION / STYLE
   ========================================================= */
function initMap(){
  if(state.mapInitialized)return;
  if(!window.maplibregl){showMapFailure("The interactive atlas could not start in this browser.");return}
  state.mapInitialized=true;
  try{
    state.map=new maplibregl.Map({
      container:"networkMap",
      style:MAP_STYLE_URL,
      center:[14,48],
      zoom:2.15,
      minZoom:1.25,
      maxZoom:13,
      attributionControl:false,
      logoPosition:"bottom-left",
      renderWorldCopies:false,
      cooperativeGestures:true,
      dragRotate:false,
      pitchWithRotate:false,
      maxPitch:48,
      fadeDuration:REDUCED_MOTION?0:220
    });
    state.map.addControl(new maplibregl.AttributionControl({compact:true}),"bottom-right");
    state.map.on("load",onMapLoad);
    state.map.on("error",event=>logger("map_error",{message:event?.error?.message||"unknown"}));
    let lastObservedWidth=0;
    let lastObservedHeight=0;
    let resizeRaf=0;
    state.resizeObserver=new ResizeObserver(entries=>{
      const rect=entries?.[0]?.contentRect;
      if(!rect)return;
      const width=Math.round(rect.width);
      const height=Math.round(rect.height);
      if(Math.abs(width-lastObservedWidth)<2 && Math.abs(height-lastObservedHeight)<2)return;
      lastObservedWidth=width;
      lastObservedHeight=height;
      cancelAnimationFrame(resizeRaf);
      resizeRaf=requestAnimationFrame(()=>state.map?.resize());
    });
    state.resizeObserver.observe(el.networkHero);
  }catch(error){logger("map_init_failed",{message:error.message});showMapFailure("The interactive atlas could not start in this browser.")}
}
function onMapLoad(){
  state.mapReady=true;
  el.networkHero.classList.add("map-ready");
  const loadingVeil=document.getElementById("mapLoading");
  if(loadingVeil)loadingVeil.remove();
  rethemeBaseMap();
  if(!IS_MOBILE()&&typeof state.map.setProjection==="function"){
    try{state.map.setProjection({type:"globe"})}catch(error){logger("globe_unavailable",{message:error.message})}
  }
  installNetworkSourcesAndLayers();
  installMapInteractions();
  if(state.pendingPayload){const payload=state.pendingPayload;state.pendingPayload=null;applyPayload(payload)}else{renderModel()}
  logger("map_ready");
}
function rethemeBaseMap(){
  const map = state.map;
  if(!map) return;

  const layers = map.getStyle()?.layers || [];

  layers.forEach(layer => {
    const id = String(layer.id || "").toLowerCase();

    try{
      /* -----------------------------------------------------
         REMOVE VISUAL NOISE
         ----------------------------------------------------- */
      if(
        id.includes("poi") ||
        id.includes("transit") ||
        id.includes("road") ||
        id.includes("motorway") ||
        id.includes("highway") ||
        id.includes("street") ||
        id.includes("building") ||
        id.includes("housenumber") ||
        id.includes("aeroway")
      ){
        map.setLayoutProperty(layer.id, "visibility", "none");
        return;
      }

      /* -----------------------------------------------------
         LAND / WORLD CANVAS

         OpenFreeMap Dark primarily uses the background layer
         as the visible land/world base.
         ----------------------------------------------------- */
      if(layer.type === "background"){
        map.setPaintProperty(
          layer.id,
          "background-color",
          "#D4DEDC"
        );
        return;
      }

      /* -----------------------------------------------------
         FILLS
         ----------------------------------------------------- */
      if(layer.type === "fill"){

        /* Ocean, lakes and rivers */
        if(
          id.includes("water") ||
          id.includes("ocean") ||
          id.includes("lake") ||
          id.includes("river")
        ){
          map.setPaintProperty(
            layer.id,
            "fill-color",
            "#F7F8F5"
          );

          map.setPaintProperty(
            layer.id,
            "fill-opacity",
            1
          );

          return;
        }

        /* Parks / forests / nature */
        if(
          id.includes("park") ||
          id.includes("wood") ||
          id.includes("forest") ||
          id.includes("grass") ||
          id.includes("vegetation")
        ){
          map.setPaintProperty(
            layer.id,
            "fill-color",
            "#C3D2CF"
          );

          map.setPaintProperty(
            layer.id,
            "fill-opacity",
            0.78
          );

          return;
        }

        /* Ice / glaciers */
        if(
          id.includes("glacier") ||
          id.includes("ice") ||
          id.includes("snow")
        ){
          map.setPaintProperty(
            layer.id,
            "fill-color",
            "#F7FAFA"
          );

          map.setPaintProperty(
            layer.id,
            "fill-opacity",
            0.92
          );

          return;
        }

        /* Remaining terrain / land cover */
        if(
          id.includes("land") ||
          id.includes("landcover") ||
          id.includes("earth") ||
          id.includes("natural")
        ){
          map.setPaintProperty(
            layer.id,
            "fill-color",
            "#D4DEDC"
          );

          map.setPaintProperty(
            layer.id,
            "fill-opacity",
            0.9
          );

          return;
        }
      }

      /* -----------------------------------------------------
         BORDERS / COASTLINES
         ----------------------------------------------------- */
      if(layer.type === "line"){

        if(
          id.includes("boundary") ||
          id.includes("admin") ||
          id.includes("border")
        ){
          map.setPaintProperty(
            layer.id,
            "line-color",
            "rgba(2,46,100,.25)"
          );

          map.setPaintProperty(
            layer.id,
            "line-width",
            [
              "interpolate",
              ["linear"],
              ["zoom"],
              1, 0.45,
              5, 0.75,
              9, 1
            ]
          );

          map.setPaintProperty(
            layer.id,
            "line-opacity",
            0.8
          );

          return;
        }

        if(
          id.includes("water") ||
          id.includes("river")
        ){
          map.setPaintProperty(
            layer.id,
            "line-color",
            "rgba(31,107,163,.22)"
          );

          map.setPaintProperty(
            layer.id,
            "line-opacity",
            0.72
          );

          return;
        }
      }

      /* -----------------------------------------------------
         LABELS
         ----------------------------------------------------- */
      if(layer.type === "symbol"){

        /* Countries */
        if(
          id.includes("country") ||
          id.includes("state")
        ){
          map.setPaintProperty(
            layer.id,
            "text-color",
            "rgba(2,46,100,.80)"
          );

          map.setPaintProperty(
            layer.id,
            "text-halo-color",
            "rgba(251,250,246,.92)"
          );

          map.setPaintProperty(
            layer.id,
            "text-halo-width",
            1.35
          );

          return;
        }

        /* Cities / settlements */
        if(
          id.includes("city") ||
          id.includes("place") ||
          id.includes("settlement") ||
          id.includes("town") ||
          id.includes("village")
        ){
          map.setPaintProperty(
            layer.id,
            "text-color",
            "rgba(83,109,121,.82)"
          );

          map.setPaintProperty(
            layer.id,
            "text-halo-color",
            "rgba(251,250,246,.90)"
          );

          map.setPaintProperty(
            layer.id,
            "text-halo-width",
            1.25
          );

          return;
        }

        /* Hide unrelated labels */
        map.setLayoutProperty(
          layer.id,
          "visibility",
          "none"
        );
      }
    }catch(error){
      logger("map_retheme_layer_skip",{
        layer:layer.id,
        message:error?.message || "unsupported paint property"
      });
    }
  });

  /* -------------------------------------------------------
     LIGHT NORDIC ATMOSPHERE

     This replaces the current dark globe fog with a
     porcelain / smoke atmosphere.
     ------------------------------------------------------- */
  try{
    map.setFog?.({color:"rgba(245,241,234,.08)","high-color":"rgba(95,199,207,.06)","space-color":"#D4DEDC","horizon-blend":.05,"star-intensity":0});
  }catch(error){
    logger("map_fog_retheme_skip",{
      message:error?.message || "fog unavailable"
    });
  }
}
function addGeoSource(id,options={}){if(!state.map.getSource(id))state.map.addSource(id,{type:"geojson",data:emptyFC(),...options})}
function installNetworkSourcesAndLayers(){
  const map=state.map;
  addGeoSource("sk-destinations");
  addGeoSource("sk-airports");
  addGeoSource("sk-hotels",{cluster:true,clusterMaxZoom:9,clusterRadius:48}); 
  addGeoSource("sk-routes",{lineMetrics:true});
  addGeoSource("sk-route-pulse");

  map.addLayer({id:"sk-routes-base",type:"line",source:"sk-routes",paint:{"line-color":["case",["boolean",["feature-state","selected"],false],"#5FC7CF",["boolean",["feature-state","hover"],false],"#0B477E","#1F6BA3"],"line-width":["interpolate",["linear"],["zoom"],1,1.15,6,2],"line-opacity":["case",["boolean",["feature-state","dimmed"],false],.06,["boolean",["feature-state","selected"],false],.98,["boolean",["feature-state","hover"],false],.78,.30]}});
  map.addLayer({id:"sk-routes-hit",type:"line",source:"sk-routes",paint:{"line-color":"rgba(0,0,0,0)","line-width":16,"line-opacity":0}});
  map.addLayer({id:"sk-route-pulse",type:"circle",source:"sk-route-pulse",paint:{"circle-radius":4.5,"circle-color":"#022E64","circle-stroke-color":"rgba(255,255,255,.82)","circle-stroke-width":1.2,"circle-opacity":.92,"circle-blur":.32}});

  map.addLayer({id:"sk-hotel-clusters",type:"circle",source:"sk-hotels",filter:["has","point_count"],paint:{"circle-color":"#AD9270","circle-radius":["step",["get","point_count"],18,5,22,12,27],"circle-stroke-color":"#FBFAF6","circle-stroke-width":2,"circle-opacity":.97}});
  map.addLayer({id:"sk-hotel-cluster-count",type:"symbol",source:"sk-hotels",filter:["has","point_count"],layout:{"text-field":"{point_count_abbreviated}","text-size":10,"text-font":["Noto Sans Bold"]},paint:{"text-color":"#FBFAF6"}});
  map.addLayer({id:"sk-hotels",type:"symbol",source:"sk-hotels",filter:["!",["has","point_count"]],layout:{"text-field":"◆","text-size":["interpolate",["linear"],["zoom"],2,10,8,16],"text-allow-overlap":true},paint:{"text-color":"#AD9270","text-halo-color":"rgba(251,250,246,.98)","text-halo-width":1.7,"text-opacity":["case",["boolean",["feature-state","dimmed"],false],.14,["boolean",["feature-state","selected"],false],1,.96]}});

  map.addLayer({id:"sk-airports",type:"symbol",source:"sk-airports",layout:{"text-field":"■","text-size":["interpolate",["linear"],["zoom"],2,8,8,12],"text-allow-overlap":true},paint:{"text-color":"#F5F1EA","text-halo-color":"#173747","text-halo-width":1.55,"text-opacity":["case",["boolean",["feature-state","dimmed"],false],.14,["boolean",["feature-state","selected"],false],1,.92]}});
  map.addLayer({id:"sk-airport-labels",type:"symbol",source:"sk-airports",minzoom:3.3,layout:{"text-field":["get","iata"],"text-size":9,"text-offset":[0,-1.8],"text-allow-overlap":false},paint:{"text-color":"rgba(2,46,100,.96)","text-halo-color":"rgba(245,241,234,.96)","text-halo-width":1.25}});

  map.addLayer({id:"sk-destination-halo",type:"circle",source:"sk-destinations",paint:{"circle-radius":["case",["boolean",["feature-state","selected"],false],21,["boolean",["feature-state","hover"],false],15,10],"circle-color":"rgba(95,199,207,0)","circle-stroke-color":"rgba(95,199,207,.68)","circle-stroke-width":["case",["boolean",["feature-state","selected"],false],2.5,1.25],"circle-opacity":["case",["boolean",["feature-state","dimmed"],false],.08,.82]}});
  map.addLayer({id:"sk-destinations",type:"circle",source:"sk-destinations",paint:{"circle-radius":["case",["boolean",["feature-state","selected"],false],7,["boolean",["feature-state","hover"],false],6,5],"circle-color":"#022E64","circle-stroke-color":"#72D5DC","circle-stroke-width":2.15,"circle-opacity":["case",["boolean",["feature-state","dimmed"],false],.24,1]}});
  map.addLayer({id:"sk-destination-labels",type:"symbol",source:"sk-destinations",layout:{"text-field":["get","name"],"text-size":["interpolate",["linear"],["zoom"],2,9,5,11,9,12],"text-offset":[0,-1.55],"text-anchor":"bottom","text-optional":true,"text-max-width":12},paint:{"text-color":"rgba(23,55,71,.92)","text-halo-color":"rgba(245,241,234,.96)","text-halo-width":1.4,"text-opacity":["case",["boolean",["feature-state","dimmed"],false],.17,1]}});
}

/* =========================================================
   MAP DATA SOURCES
   ========================================================= */
function renderModel(){
  renderMeta();renderRegions();renderModes();renderEditorial();renderDirectory();
  if(!state.mapReady)return;
  updateMapSources();applyMode();fitDefaultBounds(false);
}
function updateMapSources(){
  const {destinations,hotels,airports,routes}=state.model;
  const destFeatures=destinations.filter(d=>d.mappable).map(d=>pointFeature(d,"destination",{name:d.name,country:d.country,region:d.region,derived:d.derived?1:0}));
  const hotelFeatures=hotels.filter(h=>h.mappable).map(h=>pointFeature(h,"hotel",{name:h.name,destinationId:h.destinationId,area:h.area,country:h.country}));
  const airportFeatures=airports.filter(a=>a.mappable).map(a=>pointFeature(a,"airport",{name:a.name,iata:a.iata,city:a.city,country:a.country}));
  const routeFeatures=routes.filter(r=>r.mappable).map(r=>{
    const geometry=greatCircleGeometry(r.fromNode,r.toNode);
    return geometry?{type:"Feature",id:r.id,geometry,properties:{id:r.id,fromId:r.fromId,toId:r.toId,airlineIds:r.airlineIds.join("|"),featured:r.featured?1:0}}:null;
  }).filter(Boolean);
  state.map.getSource("sk-destinations")?.setData({type:"FeatureCollection",features:destFeatures});
  state.map.getSource("sk-hotels")?.setData({type:"FeatureCollection",features:hotelFeatures});
  state.map.getSource("sk-airports")?.setData({type:"FeatureCollection",features:airportFeatures});
  state.map.getSource("sk-routes")?.setData({type:"FeatureCollection",features:routeFeatures});
  logger("payload_counts",state.model.stats);
}
function applyMode(){
  if(!state.mapReady)return;
  const map=state.map;
  const hasHotels=state.model.hotels.some(h=>h.mappable);const hasAirlines=state.model.airlines.length>0&&state.model.routes.some(r=>r.airlineIds.length);
  const collectionOpacity=state.mode==="collection"?1:state.mode==="explore"?.78:.42;
  const routeOpacity=state.mode==="airlines"?.36:state.mode==="collection"?.08:state.mode==="destinations"?.13:.22;
  try{
    map.setPaintProperty("sk-hotels","text-opacity",collectionOpacity);
    map.setPaintProperty("sk-hotel-clusters","circle-opacity",collectionOpacity);
    map.setPaintProperty("sk-hotel-cluster-count","text-opacity",collectionOpacity);
    map.setPaintProperty("sk-routes-base","line-opacity",routeOpacity);
    map.setLayoutProperty("sk-hotels","visibility",hasHotels?"visible":"none");
    map.setLayoutProperty("sk-hotel-clusters","visibility",hasHotels?"visible":"none");
    map.setLayoutProperty("sk-hotel-cluster-count","visibility",hasHotels?"visible":"none");
    map.setLayoutProperty("sk-airports","visibility",state.mode==="airlines"||state.selectionType?"visible":"none");
    map.setLayoutProperty("sk-airport-labels","visibility",state.mode==="airlines"||state.selectionType?"visible":"none");
    if(state.mode==="airlines"&&!hasAirlines)setMode("explore",false);
  }catch{}
  applyFeatureStates();
}
function renderMeta(){
  const s=state.model.stats;el.networkMeta.replaceChildren();
  const values=[];
  if(s.destinations)values.push(`${s.destinations} ${s.destinations===1?"destination":"destinations"}`);
  if(s.hotels)values.push(`${s.hotels} Collection ${s.hotels===1?"stay":"stays"}`);
  if(s.airlines)values.push(`${s.airlines} ${s.airlines===1?"airline partner":"airline partners"}`);
  if(s.routes)values.push(`${s.routes} ${s.routes===1?"connection":"connections"}`);
  if(!values.length)values.push("Network content is being updated");
  values.forEach(text=>{const span=document.createElement("span");span.textContent=text;el.networkMeta.append(span)});
}
function renderRegions(){
  el.regionStrip.replaceChildren();
  if(state.model.regions.length<2){el.regionStrip.hidden=true;return}
  el.regionStrip.hidden=false;
  const all=createRegionButton("All",null);el.regionStrip.append(all);
  state.model.regions.forEach(region=>el.regionStrip.append(createRegionButton(region,region)));
}
function createRegionButton(label,value){const b=document.createElement("button");b.type="button";b.className="region-btn"+(state.selectedRegion===value?" active":"");b.textContent=label;b.addEventListener("click",()=>setRegion(value));return b}
function renderModes(){
  const hasHotels=state.model.hotels.length>0;const hasAirlines=state.model.airlines.length>0&&state.model.routes.some(r=>r.airlineIds.length);
  el.modeRail.querySelector('[data-mode="collection"]').hidden=!hasHotels;
  el.modeRail.querySelector('[data-mode="airlines"]').hidden=!hasAirlines;
}

/* =========================================================
   MAP INTERACTIONS
   ========================================================= */
function installMapInteractions(){
  const map=state.map;
  const layers=[
    {layer:"sk-destinations",type:"destination"},
    {layer:"sk-hotels",type:"hotel"},
    {layer:"sk-airports",type:"airport"},
    {layer:"sk-routes-hit",type:"route"}
  ];
  layers.forEach(({layer,type})=>{
    map.on("mousemove",layer,event=>handleHover(type,event));
    map.on("mouseleave",layer,()=>clearHover());
    map.on("click",layer,event=>handleMapClick(type,event));
  });
  map.on("click","sk-hotel-clusters",event=>{
    const feature=event.features?.[0];if(!feature)return;
    const clusterId=feature.properties.cluster_id;
    state.map.getSource("sk-hotels").getClusterExpansionZoom(clusterId,(err,zoom)=>{if(err)return;state.map.easeTo({center:feature.geometry.coordinates,zoom:Math.min(zoom,11),duration:cameraDuration(650)})});
  });
}
function handleHover(type,event){
  const feature=event.features?.[0];if(!feature)return;
  const id=cleanId(feature.properties?.id||feature.id);if(!id)return;
  if(state.hover.id!==id||state.hover.type!==type){clearHover();state.hover={type,id};setFeatureState(type,id,{hover:true})}
  state.map.getCanvas().style.cursor="pointer";
  showTooltip(type,id,event.point);
}
function clearHover(){
  if(state.hover.id)setFeatureState(state.hover.type,state.hover.id,{hover:false});
  state.hover={type:null,id:null};if(state.map)state.map.getCanvas().style.cursor="";hideTooltip();
}
function handleMapClick(type,event){const feature=event.features?.[0];const id=cleanId(feature?.properties?.id||feature?.id);if(id)selectObject(type,id,{camera:true,history:true})}
function setFeatureState(type,id,value){
  const source={destination:"sk-destinations",hotel:"sk-hotels",airport:"sk-airports",route:"sk-routes"}[type];if(!source||!state.map?.getSource(source))return;
  try{state.map.setFeatureState({source,id},value)}catch{}
}
function showTooltip(type,id,point){
  if(IS_MOBILE())return;
  const obj=getObject(type,id);if(!obj)return;
  el.mapTooltip.querySelector("strong").textContent=obj.name||routeTitle(obj)||obj.iata||"Network";
  el.mapTooltip.querySelector("span").textContent=tooltipSecondary(type,obj);
  el.mapTooltip.style.left=`${point.x}px`;el.mapTooltip.style.top=`${point.y}px`;el.mapTooltip.classList.add("visible");
}
function hideTooltip(){el.mapTooltip.classList.remove("visible")}
function tooltipSecondary(type,obj){
  if(type==="destination")return [obj.country,countsForDestination(obj)].filter(Boolean).join(" · ");
  if(type==="hotel")return ["SKANDI Collection",obj.area||obj.city].filter(Boolean).join(" · ");
  if(type==="airport")return [obj.iata,obj.city,obj.country].filter(Boolean).join(" · ");
  if(type==="route")return [obj.fromId+" → "+obj.toId,airlineNames(obj.airlineIds).join(", ")].filter(Boolean).join(" · ");
  return "";
}
function countsForDestination(dest){
  const hotelCount=state.model.hotels.filter(h=>h.destinationId===dest.id).length;
  const routeCount=state.model.routes.filter(r=>destinationTouchesRoute(dest,r)).length;
  return [hotelCount?`${hotelCount} Collection ${hotelCount===1?"stay":"stays"}`:"",routeCount?`${routeCount} ${routeCount===1?"connection":"connections"}`:""].filter(Boolean).join(" · ");
}

/* =========================================================
   SELECTION / CAMERA / FILTER STATES
   ========================================================= */
function getObject(type,id){
  const list={destination:state.model.destinations,hotel:state.model.hotels,airport:state.model.airports,airline:state.model.airlines,route:state.model.routes}[type]||[];
  const key=cleanId(id).toLowerCase();return list.find(x=>cleanId(x.id).toLowerCase()===key||cleanId(x.iata).toLowerCase()===key||cleanId(x.slug).toLowerCase()===key)||null;
}
function selectObject(type,id,options={}){
  const obj=getObject(type,id);if(!obj)return;
  stopRouteAnimation();
  state.selectionType=type;state.selectionId=obj.id;state.panelOpen=true;
  if(type==="airline"){state.selectedAirlineId=obj.id;state.mode="airlines"}
  else if(state.mode==="airlines"&&type!=="route")state.selectedAirlineId=null;
  applyFeatureStates();renderSelection(obj,type);syncModeButtons();
  if(options.camera!==false)focusSelection(type,obj);
  if(options.history!==false)writeDeepLink(type,obj);
  analytics(`network_${type==="hotel"?"collection":type}_open`,{id:publicSelectionId(type,obj)});
  if(type==="route")startRouteAnimation(obj);
}
function clearSelection({camera=false,history=true}={}){
  stopRouteAnimation();state.selectionType=null;state.selectionId=null;state.panelOpen=false;state.selectedAirlineId=state.mode==="airlines"?state.selectedAirlineId:null;
  el.detailPanel.classList.remove("open");el.detailPanel.setAttribute("aria-hidden","true");el.mobileSheet.classList.remove("open");
  applyFeatureStates();if(camera)fitDefaultBounds(true);if(history)clearDeepLink();
}
function applyFeatureStates(){
  if(!state.mapReady)return;
  const {destinations,hotels,airports,routes}=state.model;
  const selectedType=state.selectionType,selected=getObject(selectedType,state.selectionId);
  const selectedAirline=state.selectedAirlineId;
  const region=state.selectedRegion;
  const activeDestIds=new Set();const activeAirportIds=new Set();const activeHotelIds=new Set();const activeRouteIds=new Set();

  if(selectedType==="destination"&&selected){activeDestIds.add(selected.id);hotels.filter(h=>h.destinationId===selected.id).forEach(h=>activeHotelIds.add(h.id));airports.filter(a=>a.destinationIds.includes(selected.id)||selected.airportIds.includes(a.iata||a.id)).forEach(a=>activeAirportIds.add(a.id));routes.filter(r=>destinationTouchesRoute(selected,r)).forEach(r=>activeRouteIds.add(r.id))}
  if(selectedType==="hotel"&&selected){activeHotelIds.add(selected.id);if(selected.destinationId)activeDestIds.add(selected.destinationId)}
  if(selectedType==="airport"&&selected){activeAirportIds.add(selected.id);selected.destinationIds.forEach(id=>activeDestIds.add(id));routes.filter(r=>routeTouchesNode(r,selected)).forEach(r=>activeRouteIds.add(r.id))}
  if(selectedType==="route"&&selected){activeRouteIds.add(selected.id);[selected.fromNode,selected.toNode].forEach(node=>{if(!node)return;if(state.model.airports.includes(node))activeAirportIds.add(node.id);else activeDestIds.add(node.id)});const toDest=findDestinationForNode(selected.toNode);if(toDest)activeDestIds.add(toDest.id)}
  if(selectedAirline){routes.filter(r=>routeHasAirline(r,selectedAirline)).forEach(r=>{activeRouteIds.add(r.id);[r.fromNode,r.toNode].forEach(node=>{if(node&&state.model.airports.includes(node))activeAirportIds.add(node.id);const dest=findDestinationForNode(node);if(dest)activeDestIds.add(dest.id)})})}

  destinations.forEach(d=>setFeatureState("destination",d.id,{selected:selectedType==="destination"&&selected?.id===d.id,dimmed:shouldDimDestination(d,activeDestIds,region,selectedAirline)}));
  hotels.forEach(h=>setFeatureState("hotel",h.id,{selected:selectedType==="hotel"&&selected?.id===h.id,dimmed:shouldDimGeneric(h.id,activeHotelIds,region&&h.region!==region,Boolean(selectedType||selectedAirline))}));
  airports.forEach(a=>setFeatureState("airport",a.id,{selected:selectedType==="airport"&&selected?.id===a.id,dimmed:shouldDimGeneric(a.id,activeAirportIds,region&&a.region!==region,Boolean(selectedType||selectedAirline))}));
  routes.forEach(r=>setFeatureState("route",r.id,{selected:selectedType==="route"&&selected?.id===r.id,dimmed:shouldDimRoute(r,activeRouteIds,region,selectedAirline)}));

  try{
    const showAirports=Boolean(selectedType||selectedAirline||state.mode==="airlines");
    state.map.setLayoutProperty("sk-airports","visibility",showAirports?"visible":"none");state.map.setLayoutProperty("sk-airport-labels","visibility",showAirports?"visible":"none");
  }catch{}
}
function shouldDimDestination(d,active,region,airline){if(region&&d.region!==region&&d.country!==region)return true;if((state.selectionType||airline)&&active.size)return !active.has(d.id);return false}
function shouldDimGeneric(id,active,regionMismatch,selectionPresent){if(regionMismatch)return true;if(selectionPresent&&active.size)return !active.has(id);return false}
function shouldDimRoute(r,active,region,airline){if(airline&&!routeHasAirline(r,airline))return true;if(state.selectionType&&active.size&&!active.has(r.id))return true;if(region){const a=findDestinationForNode(r.fromNode),b=findDestinationForNode(r.toNode);if(![a,b].some(d=>d&&(d.region===region||d.country===region)))return true}return false}
function destinationTouchesRoute(dest,route){const ids=new Set([dest.id.toUpperCase(),dest.iata.toUpperCase(),...dest.airportIds.map(v=>v.toUpperCase())]);return ids.has(route.fromId)||ids.has(route.toId)}
function routeTouchesNode(route,node){const ids=[node.id,node.iata,node.icao].map(v=>cleanString(v).toUpperCase());return ids.includes(route.fromId)||ids.includes(route.toId)}
function routeHasAirline(route,airlineId){const airline=getObject("airline",airlineId);const keys=new Set([airlineId,airline?.id,airline?.iata,airline?.icao].map(v=>cleanString(v).toUpperCase()));return route.airlineIds.some(id=>keys.has(id.toUpperCase()))}
function findDestinationForNode(node){if(!node)return null;if(state.model.destinations.includes(node))return node;return state.model.destinations.find(d=>d.airportIds.map(v=>v.toUpperCase()).includes(cleanString(node.iata||node.id).toUpperCase())||cleanString(d.name).toLowerCase()===cleanString(node.city).toLowerCase())||null}
function setMode(mode,track=true){
  if(!["explore","destinations","collection","airlines"].includes(mode))return;
  if(mode==="collection"&&!state.model.hotels.length)return;
  if(mode==="airlines"&&!(state.model.airlines.length&&state.model.routes.some(r=>r.airlineIds.length)))return;
  state.mode=mode;if(mode!=="airlines")state.selectedAirlineId=null;syncModeButtons();applyMode();if(track)analytics("network_mode_change",{mode});
  if(mode==="collection")fitBoundsFor(state.model.hotels,true);else if(mode==="destinations")fitBoundsFor(state.model.destinations,true);
  if(mode==="airlines")openAirlineSearch();
}
function syncModeButtons(){el.modeRail.querySelectorAll("[data-mode]").forEach(b=>{const active=b.dataset.mode===state.mode;b.classList.toggle("active",active);b.setAttribute("aria-pressed",String(active))})}
function setRegion(region){state.selectedRegion=region;renderRegions();applyFeatureStates();const items=region?state.model.destinations.filter(d=>d.region===region||d.country===region):state.model.destinations;fitBoundsFor(items,true);analytics("network_region_change",{region:region||"all"})}
function focusSelection(type,obj){
  if(!state.mapReady)return;
  const duration=cameraDuration(type==="route"?950:720);
  if(type==="route"){const nodes=[obj.fromNode,obj.toNode].filter(Boolean);fitBoundsFor(nodes,true,{duration,padding:panelPadding()});return}
  if(type==="airline"){const routes=state.model.routes.filter(r=>routeHasAirline(r,obj.id));fitBoundsFor(routes.flatMap(r=>[r.fromNode,r.toNode]).filter(Boolean),true,{duration,padding:panelPadding()});return}
  if(obj.mappable){state.map.easeTo({center:[obj.lng,obj.lat],zoom:type==="hotel"?9:type==="airport"?7:5.4,duration,padding:panelPadding(),essential:true})}
}
function cameraDuration(ms){return REDUCED_MOTION?60:ms}
function panelPadding(){return IS_MOBILE()?{top:170,bottom:190,left:36,right:36}:{top:90,bottom:90,left:80,right:470}}
function fitBoundsFor(items,animate=false,options={}){const bounds=boundsForFeatures(items);if(!bounds||bounds.isEmpty?.())return;state.map.fitBounds(bounds,{padding:options.padding||panelPadding(),maxZoom:6.3,duration:animate?cameraDuration(options.duration||800):0,essential:true})}
function fitDefaultBounds(animate=true){
  const items=[...state.model.destinations.filter(d=>d.mappable),...state.model.airports.filter(a=>a.mappable&&state.model.routes.some(r=>routeTouchesNode(r,a))),...state.model.hotels.filter(h=>h.mappable)];
  if(items.length)fitBoundsFor(items,animate,{padding:IS_MOBILE()?{top:150,bottom:110,left:35,right:35}:{top:150,bottom:90,left:90,right:90}});else state.map?.easeTo({center:[12,45],zoom:2,duration:animate?cameraDuration(700):0});
}

/* =========================================================
   SELECTION PANELS
   ========================================================= */
function renderSelection(obj,type){
  const fragment=buildPanelFragment(obj,type);
  el.panelBody.replaceChildren(fragment.cloneNode(true));
  renderPanelImage(obj,type);
  el.detailPanel.classList.add("open");el.detailPanel.setAttribute("aria-hidden","false");

  el.mobileSheetContent.replaceChildren();
  const mobileMedia=document.createElement("div");mobileMedia.className="panel-media";
  const fallback=document.createElement("div");fallback.className="panel-fallback";fallback.textContent="SKANDI Network";mobileMedia.append(fallback);
  const image=document.createElement("img");image.alt="";image.loading="lazy";mobileMedia.append(image);
  const body=document.createElement("div");body.className="panel-body";body.append(buildPanelFragment(obj,type));
  el.mobileSheetContent.append(mobileMedia,body);
  loadImage(image,selectionImage(obj,type));
  el.mobileSheet.classList.add("open");setSheetSnap("peek");
  const announcement=selectionAnnouncement(obj,type);el.selectionLive.textContent=announcement;
}
function buildPanelFragment(obj,type){
  const frag=document.createDocumentFragment();
  const eyebrow=document.createElement("div");eyebrow.className="panel-eyebrow";eyebrow.textContent=panelEyebrow(type,obj);frag.append(eyebrow);
  const title=document.createElement("h2");title.className="panel-title";title.textContent=panelTitle(type,obj);frag.append(title);
  const metaText=panelMeta(type,obj);if(metaText){const meta=document.createElement("div");meta.className="panel-meta";meta.textContent=metaText;frag.append(meta)}
  const copyText=panelCopy(type,obj);if(copyText){const copy=document.createElement("p");copy.className="panel-copy";copy.textContent=copyText;frag.append(copy)}
  const tags=panelTags(type,obj);if(tags.length){const list=document.createElement("div");list.className="tag-list";tags.slice(0,6).forEach(text=>{const tag=document.createElement("span");tag.className="tag";tag.textContent=text;list.append(tag)});frag.append(list)}
  const facts=panelFacts(type,obj);if(facts.length){const grid=document.createElement("div");grid.className="panel-facts";facts.slice(0,4).forEach(([label,value])=>{const f=document.createElement("div");f.className="fact";const small=document.createElement("small");small.textContent=label;const strong=document.createElement("strong");strong.textContent=value;f.append(small,strong);grid.append(f)});frag.append(grid)}
  const related=panelRelated(type,obj);if(related.length){const wrap=document.createElement("div");wrap.className="related-list";const heading=document.createElement("p");heading.className="related-title";heading.textContent=relatedTitle(type);wrap.append(heading);related.slice(0,6).forEach(item=>{const b=document.createElement("button");b.type="button";b.className="related-item";const strong=document.createElement("strong");strong.textContent=item.label;const span=document.createElement("span");span.textContent=item.meta||"View";b.append(strong,span);b.addEventListener("click",()=>selectObject(item.type,item.id,{camera:true,history:true}));wrap.append(b)});frag.append(wrap)}
  const actions=panelActions(type,obj);if(actions.length){const wrap=document.createElement("div");wrap.className="panel-actions";actions.forEach((action,index)=>{const b=document.createElement("button");b.type="button";b.className=`panel-action ${index===0?"primary":"secondary"}`;b.textContent=action.label;b.addEventListener("click",action.onClick);wrap.append(b)});frag.append(wrap)}
  return frag;
}
function panelEyebrow(type,obj){return {destination:[obj.country,obj.region].filter(Boolean).join(" / ")||"Destination",hotel:"SKANDI Collection",airport:"Airport",airline:"Partner airline",route:"Journey"}[type]||"SKANDI Network"}
function panelTitle(type,obj){return type==="route"?routeTitle(obj):obj.name||obj.iata||"Network"}
function panelMeta(type,obj){if(type==="destination")return countsForDestination(obj);if(type==="hotel")return [obj.area||obj.city,obj.country].filter(Boolean).join(" · ");if(type==="airport")return [obj.iata,obj.icao,obj.city,obj.country].filter(Boolean).join(" · ");if(type==="airline")return [obj.iata,obj.icao].filter(Boolean).join(" · ");if(type==="route")return airlineNames(obj.airlineIds).join(" · ");return ""}
function panelCopy(type,obj){if(type==="route"){const d=findDestinationForNode(obj.toNode);return d?.summary||"A published SKANDI network connection. Select the journey action to continue into the existing booking flow."}return obj.summary||({destination:"Explore this published SKANDI destination and the Collection stays and connections linked to it.",hotel:"A handpicked SKANDI Collection stay in this destination.",airport:"An airport serving the published SKANDI network.",airline:"Explore this partner airline’s published SKANDI network relationships."}[type]||"")}
function panelTags(type,obj){if(type==="route")return unique([...(obj.tags||[]),...airlineNames(obj.airlineIds)]);return unique(obj.tags||[])}
function panelFacts(type,obj){
  if(type==="destination")return [["Collection",String(state.model.hotels.filter(h=>h.destinationId===obj.id).length)],["Airports",String(airportsForDestination(obj).length)],["Connections",String(state.model.routes.filter(r=>destinationTouchesRoute(obj,r)).length)],["Region",obj.region||obj.country||"Published network"]];
  if(type==="hotel")return [["Destination",getObject("destination",obj.destinationId)?.name||obj.city||"Published destination"],["Category",obj.tier||"SKANDI Collection"],["Rating",obj.starRating?`${obj.starRating} stars`:"Not published"],["Live price","On request"]];
  if(type==="airport")return [["IATA",obj.iata||"—"],["City",obj.city||"—"],["Connections",String(state.model.routes.filter(r=>routeTouchesNode(r,obj)).length)],["Partners",String(unique(state.model.routes.filter(r=>routeTouchesNode(r,obj)).flatMap(r=>r.airlineIds)).length)]];
  if(type==="airline"){const routes=state.model.routes.filter(r=>routeHasAirline(r,obj.id));return [["IATA",obj.iata||"—"],["Connections",String(routes.length)],["Destinations",String(unique(routes.flatMap(r=>[findDestinationForNode(r.fromNode)?.id,findDestinationForNode(r.toNode)?.id])).length)],["Role","Partner airline"]]}
  if(type==="route")return [["From",obj.fromId],["To",obj.toId],["Partners",String(obj.airlineIds.length)],["Collection",String(collectionAtRouteDestination(obj).length)]];
  return [];
}
function panelRelated(type,obj){
  if(type==="destination")return [...airportsForDestination(obj).map(a=>({type:"airport",id:a.id,label:`${a.iata} · ${a.city||a.name}`,meta:"Airport"})),...state.model.hotels.filter(h=>h.destinationId===obj.id).map(h=>({type:"hotel",id:h.id,label:h.name,meta:"Collection"})),...state.model.routes.filter(r=>destinationTouchesRoute(obj,r)).map(r=>({type:"route",id:r.id,label:routeTitle(r),meta:airlineNames(r.airlineIds).slice(0,2).join(", ")||"Connection"}))];
  if(type==="airport")return state.model.routes.filter(r=>routeTouchesNode(r,obj)).map(r=>({type:"route",id:r.id,label:routeTitle(r),meta:airlineNames(r.airlineIds).slice(0,2).join(", ")||"Connection"}));
  if(type==="airline")return state.model.routes.filter(r=>routeHasAirline(r,obj.id)).map(r=>({type:"route",id:r.id,label:routeTitle(r),meta:"Connection"}));
  if(type==="route")return collectionAtRouteDestination(obj).map(h=>({type:"hotel",id:h.id,label:h.name,meta:"Collection"}));
  return [];
}
function relatedTitle(type){return {destination:"In this destination",airport:"Published connections",airline:"Airline network",route:"Collection at destination"}[type]||"Related"}
function panelActions(type,obj){
  const actions=[];
  if(type==="destination"){
    if(obj.pageUrl)actions.push({label:`Explore ${obj.name}`,onClick:()=>navigate(obj.pageUrl,{type:"destination",id:publicSelectionId(type,obj)})});
    actions.push({label:"Plan a trip",onClick:()=>bookDestination(obj)});
  }
  if(type==="hotel"){
    if(obj.pageUrl)actions.push({label:"View hotel",onClick:()=>navigate(obj.pageUrl,{type:"hotel",id:publicSelectionId(type,obj)})});
    actions.push({label:"Check availability",onClick:()=>bookHotel(obj)});
  }
  if(type==="airport"){
    if(obj.pageUrl)actions.push({label:"View airport guide",onClick:()=>navigate(obj.pageUrl,{type:"airport",id:obj.iata})});
    actions.push({label:`Search from ${obj.iata||"airport"}`,onClick:()=>bookFromAirport(obj)});
  }
  if(type==="airline"){
    if(obj.pageUrl)actions.push({label:"View airline guide",onClick:()=>navigate(obj.pageUrl,{type:"airline",id:obj.iata||obj.id})});
    actions.push({label:"Show network",onClick:()=>{state.selectedAirlineId=obj.id;applyFeatureStates();focusSelection("airline",obj)}});
  }
  if(type==="route"){
    const destination=findDestinationForNode(obj.toNode);if(destination?.pageUrl)actions.push({label:"Explore destination",onClick:()=>navigate(destination.pageUrl,{type:"destination",id:publicSelectionId("destination",destination)})});
    actions.push({label:"Search this route",onClick:()=>bookRoute(obj)});
  }
  return actions;
}
function renderPanelImage(obj,type){loadImage(el.panelImage,selectionImage(obj,type))}
function selectionImage(obj,type){if(type==="route")return findDestinationForNode(obj.toNode)?.heroImage||"";if(type==="airline")return obj.logo||"";return obj.heroImage||obj.image||""}
function loadImage(img,url){img.classList.remove("loaded");img.removeAttribute("src");if(!url||SAVE_DATA)return;img.onload=()=>img.classList.add("loaded");img.onerror=()=>{img.classList.remove("loaded");img.removeAttribute("src")};img.src=url}
function selectionAnnouncement(obj,type){if(type==="destination")return `${obj.name} selected. ${countsForDestination(obj)||"Destination details available."}`;if(type==="hotel")return `${obj.name} selected. SKANDI Collection stay.`;if(type==="airport")return `${obj.iata||obj.name} selected. Airport details available.`;if(type==="airline")return `${obj.name} selected. Partner airline network highlighted.`;if(type==="route")return `${routeTitle(obj)} selected. Journey details available.`;return "Selection updated."}
function routeTitle(route){const from=route.fromNode?.city||route.fromNode?.name||route.fromId;const to=route.toNode?.city||route.toNode?.name||route.toId;return `${from} to ${to}`}
function airlineNames(ids){return unique(ids.map(id=>getObject("airline",id)?.name||getObject("airline",id)?.iata||id))}
function airportsForDestination(dest){return state.model.airports.filter(a=>a.destinationIds.includes(dest.id)||dest.airportIds.map(v=>v.toUpperCase()).includes((a.iata||a.id).toUpperCase())||cleanString(a.city).toLowerCase()===cleanString(dest.name).toLowerCase())}
function collectionAtRouteDestination(route){const d=findDestinationForNode(route.toNode);return d?state.model.hotels.filter(h=>h.destinationId===d.id):[]}

/* =========================================================
   SELECTED ROUTE MOTION
   ========================================================= */
function startRouteAnimation(route){
  if(REDUCED_MOTION||!state.mapReady||!route.mappable)return;
  const geometry=greatCircleGeometry(route.fromNode,route.toNode,160);if(!geometry)return;
  const points=geometry.type==="LineString"?geometry.coordinates:geometry.coordinates.flat();if(points.length<2)return;
  let start=performance.now();
  const tick=now=>{
    if(state.selectionType!=="route"||state.selectionId!==route.id)return;
    const duration=Math.max(4200,Math.min(9000,points.length*42));const t=((now-start)%duration)/duration;const idx=Math.min(points.length-1,Math.floor(t*(points.length-1)));
    state.map.getSource("sk-route-pulse")?.setData({type:"FeatureCollection",features:[{type:"Feature",geometry:{type:"Point",coordinates:points[idx]},properties:{}}]});
    state.routeAnimationFrame=requestAnimationFrame(tick);
  };
  state.routeAnimationFrame=requestAnimationFrame(tick);
}
function stopRouteAnimation(){if(state.routeAnimationFrame)cancelAnimationFrame(state.routeAnimationFrame);state.routeAnimationFrame=0;state.map?.getSource("sk-route-pulse")?.setData(emptyFC())}

/* =========================================================
   SEARCH
   ========================================================= */
function openSearch(query=""){
  state.searchOpen=true;el.searchLayer.classList.add("open");el.searchLayer.setAttribute("aria-hidden","false");el.networkSearch.value=query;renderSearchResults(query);setTimeout(()=>el.networkSearch.focus(),30);analytics("network_search",{open:true})
}
function closeSearch(){state.searchOpen=false;el.searchLayer.classList.remove("open");el.searchLayer.setAttribute("aria-hidden","true");el.searchOpen.focus()}
function openAirlineSearch(){openSearch("");el.networkSearch.placeholder="Search partner airlines";renderSearchResults("",["airline"])}
function renderSearchResults(query="",restrictTypes=null){
  const q=cleanString(query,120).toLowerCase();const groups=[];
  const defs=[
    ["destination","Destinations",state.model.destinations,d=>[d.name,d.country,d.region,d.iata,d.slug]],
    ["hotel","Collection",state.model.hotels,h=>[h.name,h.city,h.country,h.area]],
    ["airport","Airports",state.model.airports,a=>[a.iata,a.icao,a.name,a.city,a.country]],
    ["airline","Airlines",state.model.airlines,a=>[a.iata,a.icao,a.name]],
    ["route","Connections",state.model.routes,r=>[r.fromId,r.toId,routeTitle(r),...r.airlineIds]]
  ];
  defs.forEach(([type,label,list,haystack])=>{
    if(restrictTypes&&!restrictTypes.includes(type))return;
    const matched=list.filter(item=>!q||haystack(item).join(" ").toLowerCase().includes(q)).slice(0,8);if(matched.length)groups.push({type,label,items:matched})
  });
  el.searchResults.replaceChildren();
  if(!groups.length){const empty=document.createElement("div");empty.className="search-empty";empty.textContent=q?"No published network result matches that search.":"Start typing to search destinations, Collection stays, airports and partner airlines.";el.searchResults.append(empty);return}
  groups.forEach(group=>{
    const section=document.createElement("section");section.className="search-group";
    const label=document.createElement("div");label.className="search-group-label";label.textContent=group.label;section.append(label);
    group.items.forEach(item=>section.append(buildSearchResult(group.type,item)));
    el.searchResults.append(section);
  });
}
function buildSearchResult(type,item){
  const b=document.createElement("button");b.type="button";b.className="search-result";b.dataset.type=type;b.dataset.id=item.id;
  const icon=document.createElement("div");icon.className="result-icon"+(type==="hotel"?" collection":"");const iconText=document.createElement("span");iconText.textContent=type==="destination"?"DST":type==="hotel"?"S":type==="airport"?(item.iata||"APT"):type==="airline"?(item.iata||"AIR"):"↔";icon.append(iconText);
  const copy=document.createElement("div");copy.className="result-copy";const strong=document.createElement("strong");strong.textContent=type==="route"?routeTitle(item):item.name||item.iata;const sub=document.createElement("span");sub.textContent=searchSecondary(type,item);copy.append(strong,sub);
  const kind=document.createElement("span");kind.className="result-type";kind.textContent=type==="hotel"?"Collection":type;
  b.append(icon,copy,kind);b.addEventListener("click",()=>{closeSearch();selectObject(type,item.id,{camera:true,history:true})});return b;
}
function searchSecondary(type,item){if(type==="destination")return [item.country,item.region].filter(Boolean).join(" · ");if(type==="hotel")return [item.area||item.city,item.country].filter(Boolean).join(" · ");if(type==="airport")return [item.name,item.city,item.country].filter(Boolean).join(" · ");if(type==="airline")return "Partner airline";if(type==="route")return airlineNames(item.airlineIds).join(" · ")||`${item.fromId} → ${item.toId}`;return ""}

/* =========================================================
   EDITORIAL / DIRECTORY
   ========================================================= */
function renderEditorial(){renderFeatured();renderCollection();renderAirlines()}
function renderFeatured(){
  el.featuredDestinations.replaceChildren();
  const items=[...state.model.destinations].sort((a,b)=>(Number(b.featured)-Number(a.featured))||a.priority-b.priority||a.name.localeCompare(b.name)).slice(0,3);
  if(!items.length){const p=document.createElement("p");p.className="chapter-intro";p.textContent="Published destination stories will appear here as the network is updated.";el.featuredDestinations.append(p);return}
  items.forEach(d=>{
    const b=document.createElement("button");b.type="button";b.className="feature-card";
    if(d.heroImage&&!SAVE_DATA){const img=document.createElement("img");img.alt="";img.loading="lazy";img.src=d.heroImage;img.onerror=()=>img.remove();b.append(img)}
    const copy=document.createElement("div");copy.className="feature-card-copy";const small=document.createElement("small");small.textContent=[d.country,d.region].filter(Boolean)[0]||"Destination";const strong=document.createElement("strong");strong.textContent=d.name;const span=document.createElement("span");span.textContent=d.summary||countsForDestination(d)||"Explore this published SKANDI destination.";copy.append(small,strong,span);b.append(copy);b.addEventListener("click",()=>{scrollToMap();selectObject("destination",d.id,{camera:true,history:true})});el.featuredDestinations.append(b)
  });
}
function renderCollection(){
  el.collectionRail.replaceChildren();el.collectionChapter.hidden=!state.model.hotels.length;
  state.model.hotels.slice(0,12).forEach(h=>{
    const b=document.createElement("button");b.type="button";b.className="collection-card";
    const media=document.createElement("div");media.className="collection-card-media";if(h.image&&!SAVE_DATA){const img=document.createElement("img");img.alt="";img.loading="lazy";img.src=h.image;img.onerror=()=>img.remove();media.append(img)}const badge=document.createElement("span");badge.className="collection-badge";badge.textContent="SKANDI Collection";media.append(badge);
    const copy=document.createElement("div");copy.className="collection-copy";const small=document.createElement("small");small.textContent=[h.area||h.city,h.country].filter(Boolean).join(" · ");const strong=document.createElement("strong");strong.textContent=h.name;const p=document.createElement("p");p.textContent=h.summary||"Handpicked by SKANDI.";copy.append(small,strong,p);b.append(media,copy);b.addEventListener("click",()=>{scrollToMap();selectObject("hotel",h.id,{camera:true,history:true})});el.collectionRail.append(b)
  });
}
function renderAirlines(){
  el.airlineRail.replaceChildren();el.airlineChapter.hidden=!state.model.airlines.length;
  state.model.airlines.forEach(a=>{
    const b=document.createElement("button");b.type="button";b.className="airline-chip";if(a.logo&&!SAVE_DATA){const img=document.createElement("img");img.alt="";img.loading="lazy";img.src=a.logo;img.onerror=()=>img.remove();b.append(img)}const copy=document.createElement("div");const strong=document.createElement("strong");strong.textContent=a.name;const small=document.createElement("small");const count=state.model.routes.filter(r=>routeHasAirline(r,a.id)).length;small.textContent=[a.iata,count?`${count} ${count===1?"connection":"connections"}`:"Partner airline"].filter(Boolean).join(" · ");copy.append(strong,small);b.append(copy);b.addEventListener("click",()=>{scrollToMap();setMode("airlines",true);selectObject("airline",a.id,{camera:true,history:true})});el.airlineRail.append(b)
  });
}

function countryRoute(countryName){
  const slug=slugify(countryName);
  return slug?`${COUNTRY_ROUTE}?country=${encodeURIComponent(slug)}`:"";
}
function destinationRoute(destination){
  const countrySlug=slugify(destination?.country||"");
  const destinationSlug=cleanString(destination?.slug||slugify(destination?.name||""),160);
  if(!countrySlug||!destinationSlug)return destination?.pageUrl||"";
  return `${DESTINATION_ROUTE}?country=${encodeURIComponent(countrySlug)}&destination=${encodeURIComponent(destinationSlug)}`;
}
function renderDestinationsList(){
  if(!el.destinationsListContent||!el.destinationsAlphabet)return;
  el.destinationsListContent.replaceChildren();
  el.destinationsAlphabet.replaceChildren();

  const grouped=new Map();
  [...state.model.destinations]
    .filter(destination=>destination?.name)
    .sort((a,b)=>(a.name||"").localeCompare(b.name||"",undefined,{sensitivity:"base"}))
    .forEach(destination=>{
      const country=cleanString(destination.country||"Other destinations",120);
      if(!grouped.has(country))grouped.set(country,[]);
      grouped.get(country).push(destination);
    });

  const countries=[...grouped.entries()]
    .sort(([a],[b])=>a.localeCompare(b,undefined,{sensitivity:"base"}));

  if(!countries.length){
    const empty=document.createElement("div");
    empty.className="destinations-list-empty";
    empty.textContent=state.dataState==="error"?"Destinations are unavailable right now. Return to the network and try again.":"Published destinations are loading.";
    el.destinationsListContent.append(empty);
    return;
  }

  const letters=new Map();
  countries.forEach(([country])=>{
    const letter=(country[0]||"#").toUpperCase();
    if(!letters.has(letter))letters.set(letter,`destination-country-${slugify(country)||"other"}`);
  });
  [...letters.entries()].sort(([a],[b])=>a.localeCompare(b)).forEach(([letter,target])=>{
    const link=document.createElement("a");
    link.href=`#${target}`;
    link.textContent=letter;
    link.addEventListener("click",event=>{
      event.preventDefault();
      document.getElementById(target)?.scrollIntoView({behavior:REDUCED_MOTION?"auto":"smooth",block:"start"});
    });
    el.destinationsAlphabet.append(link);
  });

  countries.forEach(([country,destinations])=>{
    const section=document.createElement("section");
    section.className="destination-country";
    section.id=`destination-country-${slugify(country)||"other"}`;

    const countryColumn=document.createElement("div");
    const heading=document.createElement("button");
    heading.type="button";
    heading.className="destination-country-name";
    heading.textContent=country;

    const countryPath=country==="Other destinations"?"":countryRoute(country);
    if(countryPath){
      heading.addEventListener("click",()=>navigate(countryPath,{type:"country",country:slugify(country)}));
    }else{
      heading.disabled=true;
    }

    const count=document.createElement("span");
    count.className="destination-country-count";
    count.textContent=`${destinations.length} ${destinations.length===1?"destination":"destinations"}`;
    countryColumn.append(heading,count);

    const list=document.createElement("div");
    list.className="destination-country-list";
    destinations
      .sort((a,b)=>(a.name||"").localeCompare(b.name||"",undefined,{sensitivity:"base"}))
      .forEach(destination=>{
        const button=document.createElement("button");
        button.type="button";
        button.className="destination-list-link";
        button.textContent=destination.name;
        const path=destinationRoute(destination);
        if(path){
          button.addEventListener("click",()=>navigate(path,{
            type:"destination",
            country:slugify(destination.country||""),
            destination:destination.slug||slugify(destination.name)
          }));
        }else{
          button.disabled=true;
        }
        list.append(button);
      });

    section.append(countryColumn,list);
    el.destinationsListContent.append(section);
  });
}
function openDestinationsList(){
  if(!el.destinationsListPage)return;
  renderDestinationsList();
  state.destinationDirectoryOpen=true;
  el.destinationsListPage.hidden=false;
  document.body.classList.add("destinations-directory-open");
  requestAnimationFrame(()=>{
    el.destinationsListPage.scrollTop=0;
    el.destinationsListBack?.focus();
  });
}
function closeDestinationsList(){
  if(!el.destinationsListPage||!state.destinationDirectoryOpen)return;
  state.destinationDirectoryOpen=false;
  el.destinationsListPage.hidden=true;
  document.body.classList.remove("destinations-directory-open");
  el.destinationsListOpen?.focus();
}

function renderDirectory(){
  el.directoryGrid.replaceChildren();
  const groups=[
    ["Destinations","destination",state.model.destinations],
    ["SKANDI Collection","hotel",state.model.hotels],
    ["Partner airlines","airline",state.model.airlines],
    ["Airports","airport",state.model.airports]
  ].filter(([, ,items])=>items.length);
  groups.forEach(([title,type,items])=>{
    const group=document.createElement("section");group.className="directory-group";const h=document.createElement("h3");h.textContent=title;const list=document.createElement("div");list.className="directory-list";
    items.slice(0,30).forEach(item=>{const b=document.createElement("button");b.type="button";b.className="directory-link";b.textContent=type==="airport"?`${item.iata} · ${item.city||item.name}`:item.name||item.iata;b.addEventListener("click",()=>{scrollToMap();selectObject(type,item.id,{camera:true,history:true})});list.append(b)});group.append(h,list);el.directoryGrid.append(group)
  });
}
function scrollToMap(){document.getElementById("networkApp").scrollIntoView({behavior:REDUCED_MOTION?"auto":"smooth",block:"start"})}

/* =========================================================
   NAVIGATION / BOOKING / DEEP LINKS
   ========================================================= */
function navigate(url,context={}){
  const safe=safeUrl(url);if(!safe)return;
  analytics("network_navigation",context);
  try{window.parent?.postMessage({source:HTML_SOURCE,type:"SKANDI_MAP_NAVIGATE",url:safe,context},"*")}catch{}
  try{window.open(safe,"_top")}catch{}
}
function bookingUrl(params={}){const url=new URL(BOOKING_ROUTE,window.location.origin);Object.entries(params).forEach(([k,v])=>{if(v!==undefined&&v!==null&&String(v)!=="")url.searchParams.set(k,String(v))});return url.pathname+url.search}
function bookRoute(route){analytics("network_booking_click",{kind:"route",origin:route.fromId,destination:route.toId});navigate(bookingUrl({origin:route.fromId,destination:route.toId}),{kind:"route",origin:route.fromId,destination:route.toId})}
function bookDestination(dest){const airport=airportsForDestination(dest)[0];const destination=airport?.iata||dest.iata||dest.slug||dest.name;analytics("network_booking_click",{kind:"destination",destination});navigate(bookingUrl({destination}),{kind:"destination",destination})}
function bookHotel(hotel){const dest=getObject("destination",hotel.destinationId);const destination=dest?.slug||dest?.name||hotel.city||hotel.destinationId;const url=new URL(HOTEL_SEARCH_ROUTE,window.location.origin);if(destination)url.searchParams.set("destination",destination);if(hotel.slug)url.searchParams.set("hotel",hotel.slug);analytics("network_booking_click",{kind:"hotel",hotel:hotel.slug||hotel.id,destination});navigate(url.pathname+url.search,{kind:"hotel",hotel:hotel.slug||hotel.id,destination})}
function bookFromAirport(airport){analytics("network_booking_click",{kind:"airport",origin:airport.iata});navigate(bookingUrl({origin:airport.iata}),{kind:"airport",origin:airport.iata})}
function publicSelectionId(type,obj){return type==="airport"?obj.iata:type==="airline"?(obj.iata||obj.id):type==="destination"?(obj.slug||obj.id):type==="hotel"?(obj.slug||obj.id):type==="route"?`${obj.fromId}-${obj.toId}`:obj.id}
function writeDeepLink(type,obj){
  const params=new URLSearchParams();params.set(type,publicSelectionId(type,obj));if(state.selectedRegion)params.set("region",state.selectedRegion);
  const next=`${location.pathname}?${params.toString()}`;try{history.replaceState({type,id:publicSelectionId(type,obj)},"",next)}catch{}
  try{window.parent?.postMessage({source:HTML_SOURCE,type:"SKANDI_MAP_STATE",state:{type,id:publicSelectionId(type,obj),region:state.selectedRegion||""}},"*")}catch{}
}
function clearDeepLink(){try{history.replaceState({},"",location.pathname)}catch{};try{window.parent?.postMessage({source:HTML_SOURCE,type:"SKANDI_MAP_STATE",state:{}},"*")}catch{}}
function applyDeepLink(){
  const p=new URLSearchParams(location.search);const types=["destination","hotel","airport","airline","route"];for(const type of types){const value=p.get(type);if(!value)continue;if(type==="route"){const key=value.replace("-","↔");const route=state.model.routes.find(r=>r.id===key||`${r.fromId}-${r.toId}`===value||`${r.toId}-${r.fromId}`===value);if(route){selectObject("route",route.id,{camera:true,history:false});return}}
    const obj=getObject(type,value);if(obj){selectObject(type,obj.id,{camera:true,history:false});return}
  }
}

/* =========================================================
   MOBILE SHEET
   ========================================================= */
function setSheetSnap(snap){state.mobileSheetState=snap;el.mobileSheet.dataset.snap=snap;el.sheetSnap.textContent=snap==="peek"?"Expand":snap==="medium"?"Full":"Collapse";el.sheetSnap.setAttribute("aria-label",snap==="full"?"Collapse details":"Expand details")}
function cycleSheet(){setSheetSnap(state.mobileSheetState==="peek"?"medium":state.mobileSheetState==="medium"?"full":"peek")}
function installSheetGestures(){
  let startY=0,active=false;
  el.mobileSheet.addEventListener("pointerdown",e=>{if(e.target.closest("button,a")||el.mobileSheetContent.scrollTop>0)return;active=true;startY=e.clientY;el.mobileSheet.setPointerCapture?.(e.pointerId)});
  el.mobileSheet.addEventListener("pointerup",e=>{if(!active)return;active=false;const dy=e.clientY-startY;if(Math.abs(dy)<36)return;if(dy<0)setSheetSnap(state.mobileSheetState==="peek"?"medium":"full");else setSheetSnap(state.mobileSheetState==="full"?"medium":"peek")});
}


function installNetworkDynamics(){
  const selector=".chapter-head,.feature-card,.collection-card,.airline-chip,.plan-band,.directory-group";
  const reactiveSelector=".feature-card,.collection-card,.airline-chip,.plan-band,.directory-group";
  const seen=new WeakSet();

  const revealObserver=(!REDUCED_MOTION&&"IntersectionObserver" in window)
    ? new IntersectionObserver(entries=>{
        entries.forEach(entry=>{
          if(!entry.isIntersecting)return;
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        });
      },{threshold:.12,rootMargin:"0px 0px -7% 0px"})
    : null;

  function enhance(root=document){
    root.querySelectorAll?.(selector).forEach(node=>{
      if(seen.has(node))return;
      seen.add(node);
      node.classList.add("fx-reveal");
      if(reactiveSelector.split(",").some(s=>node.matches(s))){
        node.classList.add("fx-reactive");
        const surface=document.createElement("span");
        surface.className="fx-surface";
        surface.setAttribute("aria-hidden","true");
        node.append(surface);
      }
      if(revealObserver)revealObserver.observe(node);
      else node.classList.add("is-visible");
    });
  }

  enhance(document);

  const mutationObserver=new MutationObserver(records=>{
    records.forEach(record=>{
      record.addedNodes.forEach(node=>{
        if(node.nodeType!==1)return;
        if(node.matches?.(selector)){
          const holder=document.createElement("div");
          holder.append(node.cloneNode(false));
        }
        enhance(node);
        if(node.matches?.(selector)){
          if(!seen.has(node)){
            seen.add(node);
            node.classList.add("fx-reveal");
            if(node.matches(reactiveSelector)){
              node.classList.add("fx-reactive");
              const surface=document.createElement("span");
              surface.className="fx-surface";
              surface.setAttribute("aria-hidden","true");
              node.append(surface);
            }
            if(revealObserver)revealObserver.observe(node);
            else node.classList.add("is-visible");
          }
        }
      });
    });
  });
  mutationObserver.observe(document.body,{childList:true,subtree:true});
  state.motionObserver=mutationObserver;
  state.revealObserver=revealObserver;

  if(!REDUCED_MOTION&&matchMedia("(pointer:fine)").matches){
    let active=null;
    document.addEventListener("pointermove",event=>{
      const card=event.target.closest?.(reactiveSelector);
      if(active&&active!==card){
        active.style.removeProperty("--mx");
        active.style.removeProperty("--my");
        active.style.transform="";
      }
      active=card||null;
      if(!card)return;
      const rect=card.getBoundingClientRect();
      if(!rect.width||!rect.height)return;
      const x=((event.clientX-rect.left)/rect.width)*100;
      const y=((event.clientY-rect.top)/rect.height)*100;
      const ry=(x-50)*0.035;
      const rx=(50-y)*0.028;
      card.style.setProperty("--mx",`${x.toFixed(1)}%`);
      card.style.setProperty("--my",`${y.toFixed(1)}%`);
      card.style.transform=`perspective(900px) translateY(-4px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
    },{passive:true});

    document.addEventListener("pointerout",event=>{
      const card=event.target.closest?.(reactiveSelector);
      if(!card||card.contains(event.relatedTarget))return;
      card.style.transform="";
      card.style.removeProperty("--mx");
      card.style.removeProperty("--my");
      if(active===card)active=null;
    },{passive:true});
  }
}


/* =========================================================
   STATUS / ERROR / BRIDGE
   ========================================================= */
function setStatus(message,{tone="info",retry=false}={}){el.mapStatusText.textContent=message||"";el.mapStatus.dataset.tone=tone;el.mapRetry.hidden=!retry;el.mapStatus.hidden=!message}
function showMapFailure(message){state.dataState="error";el.networkHero.classList.add("map-ready");setStatus(message,{tone:"error",retry:true});renderDirectory()}
function requestRefresh(){try{window.parent?.postMessage({source:HTML_SOURCE,type:"SKANDI_MAP_REFRESH"},"*");setStatus("Refreshing the published network…",{tone:"info"})}catch{}}
function notifyReady(){try{window.parent?.postMessage({source:HTML_SOURCE,type:"SKANDI_MAP_READY"},"*")}catch{}}
function applyPayload(payload){
  try{
    const previousSelection={type:state.selectionType,id:state.selectionId};state.payload=payload;state.model=normalizePayload(payload);state.dataReceived=true;state.dataState="ready";if(state.destinationDirectoryOpen)renderDestinationsList();
    if(state.mapReady)renderModel();else state.pendingPayload=payload;
    setStatus("");
    if(previousSelection.id&&getObject(previousSelection.type,previousSelection.id))selectObject(previousSelection.type,previousSelection.id,{camera:false,history:false});else if(previousSelection.id)clearSelection({camera:false,history:false});
    else applyDeepLink();
    analytics("network_view",state.model.stats);
  }catch(error){logger("payload_render_failed",{message:error.message});setStatus("We couldn't load the network right now.",{tone:"error",retry:true})}
}
window.loadMapData=applyPayload;

/* Listener-first bridge: attached before READY is ever sent. */
window.addEventListener("message",event=>{
  let data=event.data;if(typeof data==="string"){try{data=JSON.parse(data)}catch{return}}
  if(!data||typeof data!=="object")return;
  if(data.source&&data.source!==PARENT_SOURCE)return;
  const type=cleanString(data.type).toUpperCase();
  if(type==="SKANDI_MAP_ERROR"){
    logger("parent_error",{message:cleanString(data.message||data.payload?.message)});
    if(state.retryCount<1){state.retryCount++;setTimeout(requestRefresh,900);return}
    setStatus("We couldn't load the network right now.",{tone:"error",retry:true});return;
  }
  const payload=mapDataMessagePayload(data);if(payload)applyPayload(payload);
});

/* =========================================================
   BOOTSTRAP / EVENTS
   ========================================================= */
document.addEventListener("DOMContentLoaded",()=>{
  cacheElements();
  installNetworkDynamics();
  el.destinationsListOpen.addEventListener("click",openDestinationsList);
  el.destinationsListBack.addEventListener("click",closeDestinationsList);
  el.modeRail.addEventListener("click",e=>{const b=e.target.closest("[data-mode]");if(b)setMode(b.dataset.mode,true)});
  el.searchOpen.addEventListener("click",()=>{el.networkSearch.placeholder="Search the SKANDI network";openSearch()});
  el.searchClose.addEventListener("click",closeSearch);
  el.searchLayer.addEventListener("click",e=>{if(e.target===el.searchLayer)closeSearch()});
  el.networkSearch.addEventListener("input",e=>renderSearchResults(e.target.value,state.mode==="airlines"?["airline"]:null));
  el.networkSearch.addEventListener("keydown",e=>{if(e.key==="Escape")closeSearch();if(e.key==="ArrowDown"){e.preventDefault();el.searchResults.querySelector(".search-result")?.focus()}});
  el.searchResults.addEventListener("keydown",e=>{const buttons=[...el.searchResults.querySelectorAll(".search-result")];const i=buttons.indexOf(document.activeElement);if(e.key==="ArrowDown"){e.preventDefault();buttons[Math.min(buttons.length-1,i+1)]?.focus()}if(e.key==="ArrowUp"){e.preventDefault();if(i<=0)el.networkSearch.focus();else buttons[i-1]?.focus()}if(e.key==="Escape")closeSearch()});
  el.panelClose.addEventListener("click",()=>clearSelection({camera:false,history:true}));
  el.sheetSnap.addEventListener("click",cycleSheet);installSheetGestures();
  el.zoomIn.addEventListener("click",()=>state.map?.zoomIn({duration:cameraDuration(250)}));el.zoomOut.addEventListener("click",()=>state.map?.zoomOut({duration:cameraDuration(250)}));el.resetMap.addEventListener("click",()=>{clearSelection({camera:false,history:true});state.selectedRegion=null;state.selectedAirlineId=null;state.mode="explore";syncModeButtons();renderRegions();applyMode();fitDefaultBounds(true)});
  el.mapRetry.addEventListener("click",requestRefresh);
  el.planJourney.addEventListener("click",()=>{const selected=getObject(state.selectionType,state.selectionId);if(state.selectionType==="route")bookRoute(selected);else if(state.selectionType==="destination")bookDestination(selected);else navigate(BOOKING_ROUTE,{kind:"general"})});
  document.addEventListener("keydown",e=>{if(e.key==="Escape"){if(state.destinationDirectoryOpen)closeDestinationsList();else if(state.searchOpen)closeSearch();else if(state.panelOpen)clearSelection({camera:false,history:true})}if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k"){e.preventDefault();openSearch()}});

  initMap();
  notifyReady();
  state.dataState="loading";
  setStatus("Loading the published SKANDI network…",{tone:"info"});
  setTimeout(()=>{if(!state.dataReceived&&state.retryCount<1){state.retryCount++;requestRefresh()}},4500);
});

window.addEventListener("beforeunload",()=>{stopRouteAnimation();state.resizeObserver?.disconnect();state.motionObserver?.disconnect?.();state.revealObserver?.disconnect?.();try{state.map?.remove()}catch{}});
