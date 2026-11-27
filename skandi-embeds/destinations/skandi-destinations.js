
/* =========================================================
   CONFIG / CONTRACT
   ========================================================= */
const HTML_SOURCE = "SKANDI_PUBLIC_NETWORK_MAP";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";
const MAP_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";
let paths = { atlas:"/destinations", explore:"/destinations/explore", hotels:"/destinations/explore/hotel-list", booking:"/booking" };
const SAFE_PROTOCOLS = new Set(["http:","https:"]);
const REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const SAVE_DATA = Boolean(navigator.connection && navigator.connection.saveData);
const IS_MOBILE = () => window.matchMedia("(max-width: 820px)").matches;

/* =========================================================
   STATE
   ========================================================= */
const state = {
  mode:"destinations",
  selectionType:null,
  selectionId:null,
  selectedAirlineId:null,
  selectedRegion:null,
  searchOpen:false,
  panelOpen:false,
  mobileSheetState:"peek",
  mapReady:false,
  dataReceived:false,
  retryCount:0,
  hover:{type:null,id:null},
  model:{destinations:[],hotels:[],airports:[],airlines:[],routes:[],regions:[],stats:{}},
  map:null,
  mapInitialized:false,
  mapFailed:false,
  fallback:null,
  mapStartTimer:null,
  searchTrigger:null,
  browseOpen:false,
  linkedSelection:null,
  siteBridge:false,
  routeAnimationFrame:0,
  resizeObserver:null
};

const el = {};
function cacheElements(){
  ["networkHero","networkMap","fallbackMap","fallbackPins","fallbackCredit","modeRail","regionStrip",
    "searchOpen","browseOpen","searchLayer","searchClose","switchSearch","switchBrowse","searchInputWrap",
    "networkSearch","searchResults","mapTooltip","detailPanel","panelClose","panelImage","panelBody",
    "mobileSheet","mobileSheetContent","mobileSheetClose","sheetSnap","zoomIn","zoomOut","resetMap",
    "mapStatus","mapStatusText","mapRetry","selectionLive","directoryGrid"
  ].forEach(id=>{el[id]=document.getElementById(id)});
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
    if(!value.trim())return null;
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
  if(raw.startsWith("/"))return raw.startsWith("//")?"":raw;
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
    summary:cleanString(item.placeSummary ?? item.summary ?? item.shortDescription,900),
    explorePath:cleanString(item.explorePath,1500),guideName:cleanString(item.guideName,180),
    hotelsPath:cleanString(item.hotelsPath,1500),
    tags:unique(toArray(firstDefined(item.tags,item.Tags,item.categories,item.goodFor))),
    pageUrl:pageUrl(item),
    heroImage:imageUrl(item),
    airportIds:unique(toArray(firstDefined(item.airportIds,item.airports))),
    hotelIds:unique(toArray(firstDefined(item.hotelIds,item.hotels))),
    routeIds:unique(toArray(firstDefined(item.routeIds,item.routes))),
    airlineIds:unique(toArray(firstDefined(item.airlineIds,item.airlines))),
    featured:Boolean(firstDefined(item.featured,item.homepageFeatured,item.homepage_featured,false)),
    priority:Number(firstDefined(item.searchPriority,item.displayPriority,item.sortPriority,item.sort_priority,9999))||9999,
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
    searchPriority:Number.isFinite(Number(item.searchPriority))?Number(item.searchPriority):51,
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
    pageUrl:pageUrl(item),image:imageUrl(item),detailPath:cleanString(item.detailPath,1500),
    starRating:cleanString(firstDefined(item.starRating,item.stars),20),
    tier:cleanString(firstDefined(item.collectionTier,item.tier,item.category),80),
    searchPriority:Number.isFinite(Number(item.searchPriority))?Number(item.searchPriority):51,
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
    searchPriority:Number.isFinite(Number(item.searchPriority))?Number(item.searchPriority):51,
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
  return {destinations,hotels,airports,airlines,routes,regions,inventoryHierarchy:Array.isArray(payload.inventoryHierarchy)?payload.inventoryHierarchy:null,stats,publicNote:cleanString(payload.publicNote,500),generatedAt:payload.generatedAt||""};
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
  state.mapInitialized=true;
  if(!window.maplibregl){showMapFailure();return}
  try{
    const map=new maplibregl.Map({
      container:el.networkMap,style:MAP_STYLE_URL,center:[14,48],zoom:2.15,minZoom:1.25,maxZoom:13,
      attributionControl:false,renderWorldCopies:false,cooperativeGestures:false,
      dragRotate:false,pitchWithRotate:false,maxPitch:0,fadeDuration:REDUCED_MOTION?0:120
    });
    state.map=map;
    map.addControl(new maplibregl.AttributionControl({compact:true}),"bottom-right");
    map.on("load",()=>{
      if(state.map!==map)return;
      try{onMapLoad()}catch(error){logger("map_start_failed",{message:error.message});showMapFailure()}
    });
    map.on("error",event=>{
      if(state.map!==map)return;
      logger("map_error",{message:event?.error?.message||"unknown"});
    });
    map.getCanvas().addEventListener("webglcontextlost",()=>{
      if(state.map===map)showMapFailure();
    });
    state.mapStartTimer=setTimeout(()=>{if(!state.mapReady)showMapFailure()},8000);
    if("ResizeObserver" in window){
      state.resizeObserver=new ResizeObserver(()=>{if(state.map===map)map.resize()});
      state.resizeObserver.observe(el.networkHero);
    }
  }catch(error){logger("map_init_failed",{message:error.message});showMapFailure()}
}
function onMapLoad(){
  clearTimeout(state.mapStartTimer);
  rethemeBaseMap();
  installNetworkSourcesAndLayers();
  installMapInteractions();
  state.mapReady=true;
  renderModel();
  if(state.dataReceived)setStatus("");
  const selected=getObject(state.selectionType,state.selectionId);
  if(selected)focusSelection(state.selectionType,selected);
  logger("map_ready");
}
function renderOverview(){
  if(!state.fallback)return;
  const {destinations,hotels,airports,routes}=state.model, region=state.selectedRegion;
  const selected=(type,item)=>state.selectionType===type&&state.selectionId===item.id;
  const inRegion=item=>!region||item.region===region||item.country===region;
  const points=[
    ["destination",destinations,state.mode==="destinations"||state.mode==="explore"],
    ["hotel",hotels,state.mode==="collection"||state.mode==="explore"],
    ["airport",airports,state.mode==="airlines"]
  ].flatMap(([type,items,show])=>items.filter(item=>item.mappable&&(selected(type,item)||show&&inRegion(item)))
    .map(item=>({type,item,selected:selected(type,item)})));
  const lines=routes.filter(route=>route.mappable&&(selected("route",route)||
    state.mode==="airlines"&&(!state.selectedAirlineId||routeHasAirline(route,state.selectedAirlineId))&&
    [route.fromNode,route.toNode].some(inRegion)))
    .flatMap(route=>{const geometry=greatCircleGeometry(route.fromNode,route.toNode);
      return !geometry?[]:geometry.type==="LineString"?[geometry.coordinates]:geometry.coordinates;});
  state.fallback.setFeatures(points,lines);
}
function rethemeBaseMap(){
  const map=state.map;
  for(const layer of map.getStyle()?.layers||[]){
    const id=layer.id.toLowerCase();
    if(layer.type==="background") map.setPaintProperty(layer.id,"background-color","#f6f5ef");
    if(layer.type==="fill"&&/^water/.test(id)) map.setPaintProperty(layer.id,"fill-color","#c3dce8");
    if(layer.type==="symbol"&&/poi|transportation|road|housenumber/.test(id)) map.setLayoutProperty(layer.id,"visibility","none");
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
  renderRegions();renderModes();renderDirectory();
  if(state.searchOpen&&!state.browseOpen)renderSearchResults(el.networkSearch.value);
  if(state.mapReady)updateMapSources();
  applyFeatureStates();
  fitDefaultBounds(false);
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
function renderRegions(){
  el.regionStrip.replaceChildren();
  if(state.model.regions.length<2){el.regionStrip.hidden=true;return}
  el.regionStrip.hidden=false;
  const label=document.createElement("label");
  const name=document.createElement("span");name.textContent="Map area";
  const select=document.createElement("select");
  select.append(new Option("All places",""));
  state.model.regions.forEach(region=>select.append(new Option(region,region)));
  select.value=state.selectedRegion||"";
  select.addEventListener("change",()=>setRegion(select.value||null));
  label.append(name,select);el.regionStrip.append(label);
}
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
    {layer:"sk-hotels",type:"hotel"},
    {layer:"sk-destinations",type:"destination"},
    {layer:"sk-airports",type:"airport"},
    {layer:"sk-routes-hit",type:"route"}
  ];
  map.on("mousemove",event=>{
    const hit=mapHit(event.point);
    if(hit?.layer!=="sk-hotel-clusters"&&hit)handleHover(hit.type,{features:[hit.feature],point:event.point});
    else clearHover();
  });
  map.getCanvas().addEventListener("mouseleave",clearHover);
  map.on("click",event=>{
    const hit=mapHit(event.point);
    if(!hit)return;
    if(hit.layer!=="sk-hotel-clusters"){handleMapClick(hit.type,{features:[hit.feature]});return;}
    const {properties,geometry}=hit.feature;
    map.getSource("sk-hotels").getClusterExpansionZoom(properties.cluster_id).then(zoom=>{
      map.easeTo({center:geometry.coordinates,zoom:Math.min(zoom,11),duration:cameraDuration(650)});
    }).catch(()=>{});
  });
  function mapHit(point){
    const picks=[{layer:"sk-hotel-clusters"},...layers];
    if(state.mode==="airlines"){
      picks.sort((a,b)=>Number(b.type==="airport")-Number(a.type==="airport"));
    }
    const tolerance=IS_MOBILE()?15:5;
    const features=map.queryRenderedFeatures([[point.x-tolerance,point.y-tolerance],[point.x+tolerance,point.y+tolerance]],{layers:picks.map(p=>p.layer)});
    for(const pick of picks){
      const feature=features.find(f=>f.layer.id===pick.layer);
      if(feature)return {...pick,feature};
    }
    return null;
  }
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
  const key=cleanId(id).toLowerCase();
  return list.find(x=>cleanId(x.id).toLowerCase()===key)||
    list.find(x=>cleanId(x.iata).toLowerCase()===key||cleanId(x.slug).toLowerCase()===key)||null;
}
function selectObject(type,id,options={}){
  const obj=getObject(type,id);if(!obj)return;
  stopRouteAnimation();
  state.selectionType=type;state.selectionId=obj.id;state.panelOpen=true;
  if(type==="airline"){state.selectedAirlineId=obj.id;state.mode="airlines"}
  else if(state.mode==="airlines"&&type!=="route")state.selectedAirlineId=null;
  if(options.history!==false&&state.selectedRegion&&obj.country&&obj.country!==state.selectedRegion&&obj.region!==state.selectedRegion){
    state.selectedRegion=null;renderRegions();
  }
  renderSelection(obj,type);applyFeatureStates();syncModeButtons();
  if(options.focus)(IS_MOBILE()?el.mobileSheetContent:el.panelBody).querySelector(".panel-title")?.focus();
  if(options.camera!==false)focusSelection(type,obj);
  if(options.history!==false)writeDeepLink(type,obj);
  analytics(`network_${type==="hotel"?"collection":type}_open`,{id:publicSelectionId(type,obj)});
  if(type==="route")startRouteAnimation(obj);
}
function clearSelection({camera=false,history=true}={}){
  stopRouteAnimation();state.selectionType=null;state.selectionId=null;state.panelOpen=false;state.selectedAirlineId=state.mode==="airlines"?state.selectedAirlineId:null;
  el.detailPanel.classList.remove("open");el.detailPanel.setAttribute("aria-hidden","true");el.detailPanel.inert=true;el.mobileSheet.classList.remove("open");el.mobileSheet.setAttribute("aria-hidden","true");el.mobileSheet.inert=true;
  applyFeatureStates();if(camera)fitDefaultBounds(true);if(history)clearDeepLink();
}
function applyFeatureStates(){
  renderOverview();
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

  const showPlaces=state.mode==="destinations"||state.mode==="explore"||selectedType==="destination";
  const showHotels=state.mode==="collection"||state.mode==="explore"||selectedType==="hotel";
  const showAirports=state.mode==="airlines"||selectedType==="airport"||selectedType==="route";
  const showRoutes=state.mode==="airlines"||selectedType==="route";
  [
    [showPlaces,["sk-destinations","sk-destination-halo","sk-destination-labels"]],
    [showHotels,["sk-hotels","sk-hotel-clusters","sk-hotel-cluster-count"]],
    [showAirports,["sk-airports","sk-airport-labels"]],
    [showRoutes,["sk-routes-base","sk-routes-hit","sk-route-pulse"]]
  ].forEach(([visible,layers])=>layers.forEach(layer=>state.map.setLayoutProperty(layer,"visibility",visible?"visible":"none")));
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
  if(mode==="airlines"&&!(state.model.airlines.length&&state.model.routes.length))return;
  if(state.panelOpen)clearSelection({history:true});
  state.mode=mode;
  state.selectedAirlineId=null;
  syncModeButtons();applyFeatureStates();fitDefaultBounds(true);
  if(track)analytics("network_mode_change",{mode});
}
function syncModeButtons(){
  el.modeRail.querySelectorAll("[data-mode]").forEach(button=>{
    const active=button.dataset.mode===state.mode;
    button.classList.toggle("active",active);button.setAttribute("aria-pressed",String(active));
  });
}
function setRegion(region){
  if(state.panelOpen)clearSelection({history:true});
  state.selectedRegion=region;applyFeatureStates();fitDefaultBounds(true);
  analytics("network_region_change",{region:region||"all"});
}
function focusSelection(type,obj){
  if(!obj)return;
  const duration=cameraDuration(type==="route"?850:630),padding=panelPadding(true);
  if(type==="route"){fitBoundsFor([obj.fromNode,obj.toNode].filter(Boolean),true,{duration,padding});return}
  if(type==="airline"){
    const routes=state.model.routes.filter(r=>routeHasAirline(r,obj.id));
    fitBoundsFor(routes.flatMap(r=>[r.fromNode,r.toNode]).filter(Boolean),true,{duration,padding});return;
  }
  if(!obj.mappable)return;
  if(state.fallback){state.fallback.fit([obj],padding,type==="hotel"?75:22);return}
  if(state.mapReady)state.map.easeTo({center:[obj.lng,obj.lat],zoom:type==="hotel"?9:type==="airport"?7:5.4,duration,padding});
}
function cameraDuration(ms){return REDUCED_MOTION?0:ms}
function panelPadding(selected=false){
  const {clientWidth:width,clientHeight:height}=el.networkHero;
  const toolbar=el.modeRail.closest(".map-interface")?.getBoundingClientRect();
  if(IS_MOBILE())return {top:Math.min(toolbar?.height+24||24,height*.38),bottom:selected?Math.min(height*.42,230):70,left:20,right:20};
  return {top:28,bottom:40,left:Math.min(toolbar?.width+36||36,width*.42),right:selected?Math.min(width*.42,399):28};
}
function fitBoundsFor(items,animate=false,options={}){
  const padding=options.padding||panelPadding();
  if(state.fallback){state.fallback.fit(items,padding);return}
  if(!state.mapReady)return;
  const bounds=boundsForFeatures(items);
  if(bounds&&!bounds.isEmpty?.())state.map.fitBounds(bounds,{padding,maxZoom:6.3,duration:animate?cameraDuration(options.duration||760):0});
}
function fitDefaultBounds(animate=true){
  const {destinations,hotels,routes}=state.model;
  const items=state.mode==="collection"?hotels:state.mode==="airlines"?routes.flatMap(r=>[r.fromNode,r.toNode].filter(Boolean)):destinations;
  const region=state.selectedRegion,scope=items.filter(item=>item.mappable&&(!region||item.region===region||item.country===region));
  if(scope.length||state.fallback)fitBoundsFor(scope,animate);
  else if(state.mapReady)state.map.jumpTo({center:[12,45],zoom:2,padding:panelPadding()});
}

/* =========================================================
   SELECTION PANELS
   ========================================================= */
function renderSelection(obj,type){
  el.panelBody.replaceChildren(buildPanelFragment(obj,type));
  loadImage(el.panelImage,selectionImage(obj,type));
  el.detailPanel.scrollTop=0;
  el.detailPanel.classList.add("open");el.detailPanel.inert=false;el.detailPanel.setAttribute("aria-hidden","false");

  const image=document.createElement("img");image.className="panel-image";image.alt="";image.hidden=true;
  const body=document.createElement("div");body.className="panel-body";body.append(buildPanelFragment(obj,type));
  el.mobileSheetContent.replaceChildren(body,image);
  el.mobileSheetContent.scrollTop=0;
  loadImage(image,selectionImage(obj,type));
  el.mobileSheet.classList.add("open");el.mobileSheet.inert=false;el.mobileSheet.setAttribute("aria-hidden","false");
  setSheetSnap("medium");
  el.selectionLive.textContent=selectionAnnouncement(obj,type);
}
function buildPanelFragment(obj,type){
  const frag=document.createDocumentFragment();
  const context={destination:obj.country,hotel:"SKANDI Collection",airport:"Airport",airline:"Partner airline",route:"Partner route"}[type];
  if(context){const label=document.createElement("div");label.className="panel-eyebrow";label.textContent=context;frag.append(label)}
  const title=document.createElement("h2");title.className="panel-title";title.tabIndex=-1;title.textContent=panelTitle(type,obj);frag.append(title);
  const metaText=panelMeta(type,obj);
  if(metaText){const meta=document.createElement("div");meta.className="panel-meta";meta.textContent=metaText;frag.append(meta)}
  const actions=document.createElement("div");actions.className="panel-actions";
  panelActions(type,obj).forEach((action,index)=>{
    const button=document.createElement("button");button.type="button";
    button.className="panel-action "+(index===0?"primary":"secondary");
    button.textContent=action.label;button.addEventListener("click",action.onClick);actions.append(button);
  });
  frag.append(actions);
  const raw=type==="route"?findDestinationForNode(obj.toNode)?.summary:obj.summary;
  const copy=cleanString(raw,900).split(/\n/)[0];
  if(copy){
    const text=document.createElement("p");text.className="panel-copy";
    text.textContent=copy.length>220?copy.slice(0,220).replace(/\s+\S*$/,"")+"…":copy;frag.append(text);
  }
  const related=panelRelated(type,obj);
  if(related.length){
    const wrap=document.createElement("div");
    const heading=document.createElement("p");heading.className="related-title";heading.textContent=relatedTitle(type);wrap.append(heading);
    related.slice(0,6).forEach(item=>{
      const button=document.createElement("button");button.type="button";button.className="related-item";
      const name=document.createElement("strong");name.textContent=item.label;
      const detail=document.createElement("span");detail.textContent=item.meta;
      button.append(name,detail);button.addEventListener("click",event=>selectObject(item.type,item.id,{focus:event.detail===0}));wrap.append(button);
    });
    frag.append(wrap);
  }
  const share=document.createElement("button");share.type="button";share.className="panel-share";share.textContent="Share map link";
  share.addEventListener("click",()=>shareMapLink(type,obj));frag.append(share);
  return frag;
}
function panelTitle(type,obj){return type==="route"?routeTitle(obj):obj.name||obj.iata||"Network"}
function panelMeta(type,obj){
  if(type==="destination")return "";
  const details={
    hotel:[obj.city||obj.area,obj.country,obj.starRating?`${obj.starRating} stars`:""],
    airport:[obj.iata,obj.city,obj.country],
    airline:[obj.iata,obj.icao],
    route:type==="route"?airlineNames(obj.airlineIds):[]
  };
  return unique(details[type]||[]).join(" · ");
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
    if(obj.explorePath)actions.push({label:`Explore ${obj.guideName||obj.name}`,onClick:()=>navigate(obj.explorePath)});
    if(obj.hotelsPath)actions.push({label:"View hotels",onClick:()=>navigate(obj.hotelsPath)});
    if(!obj.explorePath&&!obj.hotelsPath)actions.push({label:"Plan a trip",onClick:()=>bookDestination(obj)});
  }
  if(type==="hotel"){
    actions.push({label:"View hotel",onClick:()=>bookHotel(obj)});
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
    const destination=findDestinationForNode(obj.toNode);if(destination?.explorePath)actions.push({label:"Explore destination",onClick:()=>navigate(destination.explorePath)});
    actions.push({label:"Search this route",onClick:()=>bookRoute(obj)});
  }
  return actions;
}
function selectionImage(obj,type){if(type==="route")return findDestinationForNode(obj.toNode)?.heroImage||"";if(type==="airline")return obj.logo||"";return obj.heroImage||obj.image||""}
function loadImage(img,url){
  img.hidden=true;img.removeAttribute("src");
  if(!url||SAVE_DATA)return;
  img.onload=()=>{img.hidden=false};
  img.onerror=()=>{img.hidden=true};
  img.src=url;
}
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
function openSearch(browse=false){
  state.searchOpen=true;
  state.searchTrigger=browse?el.browseOpen:el.searchOpen;
  el.searchLayer.classList.add("open");el.searchLayer.inert=false;el.searchLayer.setAttribute("aria-hidden","false");
  setSearchView(browse);
}
function setSearchView(browse){
  state.browseOpen=browse;
  el.switchSearch.setAttribute("aria-pressed",String(!browse));
  el.switchBrowse.setAttribute("aria-pressed",String(browse));
  el.searchInputWrap.hidden=browse;
  el.searchResults.hidden=browse;
  el.directoryGrid.hidden=!browse;
  if(browse){renderDirectory();el.directoryGrid.querySelector("select")?.focus()}
  else{renderSearchResults(el.networkSearch.value);el.networkSearch.focus()}
}
function closeSearch(){
  if(!state.searchOpen)return;
  state.searchOpen=false;
  el.searchLayer.classList.remove("open");el.searchLayer.inert=true;el.searchLayer.setAttribute("aria-hidden","true");
  state.searchTrigger?.focus();
}
function placeType(type){return {country:"Country",region:"Region",destination:"Destination",area:"Area",hotel:"Hotel",collection:"Collection",airport:"Airport",airline:"Airline",route:"Route"}[type]}
function renderSearchResults(query=""){
  const tokens=slugify(query).split("-").filter(Boolean);
  const hierarchy=state.model.inventoryHierarchy||[];
  const groups=[
    ["destination","Places",state.model.destinations,item=>[item.name,item.country,item.region,item.iata,item.slug]],
    ["collection","Collection hotels",state.model.hotels,item=>[item.name,item.city,item.country,item.area]],
    ["hotel","Hotels",hierarchy.filter(row=>row.path&&row.type==="HOTEL"&&!state.model.hotels.some(h=>h.detailPath===row.path||h.id===row.id)),item=>[item.name,...(item.parentNames||[])]],
    ["geography","Countries and areas",hierarchy.filter(row=>row.path&&["COUNTRY","REGION","AREA"].includes(row.type)),item=>[item.name,...(item.parentNames||[])]],
    ["airport","Airports",state.model.airports,item=>[item.iata,item.icao,item.name,item.city,item.country]],
    ["airline","Airlines",state.model.airlines,item=>[item.iata,item.icao,item.name]],
    ["route","Routes",state.model.routes,item=>[item.fromId,item.toId,routeTitle(item),...item.airlineIds]]
  ];
  el.searchResults.replaceChildren();
  for(const [type,label,list,terms] of groups){
    const matched=list.filter(item=>{
      const text=slugify(terms(item).filter(Boolean).join(" "));
      return tokens.every(token=>text.includes(token));
    }).sort((a,b)=>(a.searchPriority??a.priority??51)-(b.searchPriority??b.priority??51)||String(a.name||a.iata||"").localeCompare(String(b.name||b.iata||""))).slice(0,tokens.length?8:4);
    if(!matched.length)continue;
    const group=document.createElement("section");group.className="search-group";
    const heading=document.createElement("h3");heading.className="search-group-label";heading.textContent=label;group.append(heading);
    matched.forEach(item=>group.append(buildSearchResult(type,item)));
    el.searchResults.append(group);
  }
  if(!el.searchResults.children.length){
    const empty=document.createElement("p");empty.className="search-empty";
    empty.textContent=!state.dataReceived?"Loading places…":"No places match this search.";el.searchResults.append(empty);
  }
}
function buildSearchResult(type,item){
  const button=document.createElement("button");button.type="button";button.className="search-result";
  const copy=document.createElement("span");copy.className="result-copy";
  const name=document.createElement("strong");name.textContent=type==="route"?routeTitle(item):item.name||item.iata;
  const sub=document.createElement("span");sub.textContent=searchSecondary(type,item);
  const kind=document.createElement("span");kind.className="result-type";kind.textContent=placeType(type==="geography"?item.type.toLowerCase():type);
  copy.append(name,sub);button.append(copy,kind);
  button.addEventListener("click",()=>{
    closeSearch();
    if(type==="geography"||type==="hotel")navigate(item.path);
    else selectObject(type==="collection"?"hotel":type,item.id,{focus:true});
  });
  return button;
}
function searchSecondary(type,item){
  const labels={
    destination:[item.country,item.region],collection:[item.city||item.area,item.country],airport:[item.iata,item.city,item.country],
    route:type==="route"?airlineNames(item.airlineIds):[]
  };
  return unique(labels[type]||item.parentNames||[]).join(" · ");
}

function renderDirectory(){
  el.directoryGrid.replaceChildren();
  const hierarchy=state.model.inventoryHierarchy;
  if(!Array.isArray(hierarchy)||!hierarchy.length){
    const message=document.createElement("p");message.textContent=state.dataReceived?"Search to browse the places on this map.":"Loading places…";
    el.directoryGrid.append(message);
    state.model.destinations.slice(0,20).forEach(item=>el.directoryGrid.append(buildSearchResult("destination",item)));
    return;
  }
  const byId=new Map();
  hierarchy.forEach(row=>{byId.set(row.id,row);if(row.publicId)byId.set(row.publicId,row)});
  const types=["COUNTRY","REGION","DESTINATION","AREA"],rank={COUNTRY:4,REGION:3,DESTINATION:2,AREA:1};
  const selected=state.directorySelection||(state.directorySelection={COUNTRY:"",REGION:"",DESTINATION:"",AREA:""});
  function ancestors(row){
    const seen=new Set([row.id]),path=[],queue=[row];
    while(queue.length){
      const current=queue.shift(),d=current.details||{};
      const ids=[current.parentId,d.countryId,d.regionId,d.destinationId,d.areaId,...(current.relations||[]).map(r=>r.id)];
      for(const id of ids){
        const parent=byId.get(id);
        if(!parent||seen.has(parent.id)||(rank[parent.type]||0)<=(rank[current.type]||0))continue;
        seen.add(parent.id);path.push(parent);queue.push(parent);
      }
    }
    return path;
  }
  const under=(row,id)=>!id||row.id===id||ancestors(row).some(place=>place.id===id);
  const filters=document.createElement("div");filters.className="directory-filters";
  const country=byId.get(selected.COUNTRY);
  const isUS=["US","USA","UNITED STATES","UNITED STATES OF AMERICA"].includes(String(country?.code||country?.name||"").toUpperCase());
  types.forEach((type,index)=>{
    const label=document.createElement("label"),name=document.createElement("span"),select=document.createElement("select");
    name.textContent=type==="REGION"&&isUS?"State":placeType(type.toLowerCase());
    select.setAttribute("aria-label",name.textContent);
    select.append(new Option(index===0?"All countries":index===1?(isUS?"All states":"All regions"):index===2?"All destinations":"All areas",""));
    const options=hierarchy.filter(row=>row.type===type&&types.slice(0,index).every(t=>under(row,selected[t])))
      .sort((a,b)=>a.name.localeCompare(b.name));
    options.forEach(row=>select.append(new Option(row.name,row.id)));
    select.value=selected[type];select.disabled=!options.length;
    select.addEventListener("change",()=>{
      selected[type]=select.value;types.slice(index+1).forEach(t=>selected[t]="");
      renderDirectory();
      el.directoryGrid.querySelectorAll("select")[index]?.focus();
    });
    label.append(name,select);filters.append(label);
  });
  el.directoryGrid.append(filters);
  const filtered=types.some(type=>selected[type]);
  const choices=hierarchy.filter(row=>filtered?types.every(t=>under(row,selected[t])):row.type==="COUNTRY")
    .sort((a,b)=>(rank[b.type]||0)-(rank[a.type]||0)||a.name.localeCompare(b.name)).slice(0,34);
  if(!choices.length){const empty=document.createElement("p");empty.textContent="No places match these filters.";el.directoryGrid.append(empty)}
  for(const row of choices){
    const button=document.createElement("button");button.type="button";button.className="directory-link";
    const name=document.createElement("strong");name.textContent=row.name;
    const type=document.createElement("span");type.className="result-type";type.textContent=row.type==="REGION"&&isUS?"State":placeType(row.type.toLowerCase());
    button.append(name,type);
    button.addEventListener("click",()=>{
      closeSearch();
      if(row.path){navigate(row.path);return}
      const chain=[row,...ancestors(row)],params=new URLSearchParams();
      types.forEach(level=>{
        const item=chain.find(place=>place.type===level);
        if(item)params.set(level.toLowerCase(),item.slug||slugify(item.name));
      });
      if(row.type==="HOTEL")params.set("hotelId",row.id);
      navigate((row.type==="HOTEL"?paths.hotels:paths.explore)+"?"+params);
    });
    el.directoryGrid.append(button);
  }
}

/* =========================================================
   NAVIGATION / BOOKING / DEEP LINKS
   ========================================================= */
function navigate(url,context={}){
  const safe=safeUrl(url);if(!safe)return;
  analytics("network_navigation",context);
  if(!state.siteBridge || window.parent===window || /^https?:\/\//i.test(safe)){
    window.open(new URL(safe,"https://www.skanditravels.com").href,"_top");
    return;
  }
  window.parent.postMessage({source:HTML_SOURCE,type:"SKANDI_MAP_NAVIGATE",url:safe,context},"*");
}
function bookingUrl(params={}){const url=new URL(paths.booking,"https://www.skanditravels.com");Object.entries(params).forEach(([k,v])=>{if(v!==undefined&&v!==null&&String(v)!=="")url.searchParams.set(k,String(v))});return url.pathname+url.search}
function bookRoute(route){analytics("network_booking_click",{kind:"route",origin:route.fromId,destination:route.toId});navigate(bookingUrl({origin:route.fromId,destination:route.toId}),{kind:"route",origin:route.fromId,destination:route.toId})}
function bookDestination(dest){const airport=airportsForDestination(dest)[0];const destination=airport?.iata||dest.iata||dest.slug||dest.name;analytics("network_booking_click",{kind:"destination",destination});navigate(bookingUrl({destination}),{kind:"destination",destination})}
function bookHotel(hotel){
  const query=new URLSearchParams({hotelId:hotel.id});
  if(hotel.slug) query.set("hotel",hotel.slug);
  navigate(hotel.detailPath||paths.hotels+"?"+query.toString(),{kind:"hotel",hotel:hotel.id});
}
function bookFromAirport(airport){analytics("network_booking_click",{kind:"airport",origin:airport.iata});navigate(bookingUrl({origin:airport.iata}),{kind:"airport",origin:airport.iata})}
function publicSelectionId(type,obj){
  return type==="route"?`${obj.fromId}-${obj.toId}`:type==="airport"?(obj.iata||obj.id):obj.id;
}
function mapLink(type,obj){
  const query=new URLSearchParams({pin:type+":"+publicSelectionId(type,obj)});
  return paths.atlas+"?"+query.toString();
}
async function shareMapLink(type,obj){
  const url=new URL(mapLink(type,obj),"https://www.skanditravels.com").href;
  try {
    if(navigator.share) await navigator.share({title:panelTitle(type,obj),url});
    else await navigator.clipboard.writeText(url);
    el.selectionLive.textContent="Map link ready";
  } catch(error){
    if(error?.name!=="AbortError") el.selectionLive.textContent="Copy the map link from the address bar.";
  }
}
function writeDeepLink(type,obj){
  const id=publicSelectionId(type,obj);
  if(window.parent===window) history.replaceState({type,id},"",mapLink(type,obj));
  else window.parent.postMessage({source:HTML_SOURCE,type:"SKANDI_MAP_STATE",state:{type,id}},"*");
}
function clearDeepLink(){
  if(window.parent===window) history.replaceState({},"",paths.atlas);
  else window.parent.postMessage({source:HTML_SOURCE,type:"SKANDI_MAP_STATE",state:{}},"*");
}
function applyDeepLink(selection){
  const {type,id}=selection||{};
  if(!["destination","hotel","airport","airline","route"].includes(type)||!id)return;
  const obj=type==="route"?state.model.routes.find(r=>publicSelectionId(type,r)===id||`${r.toId}-${r.fromId}`===id):getObject(type,id);
  if(obj && (state.selectionId!==obj.id || state.selectionType!==type)) selectObject(type,obj.id,{camera:true,history:false});
}

/* =========================================================
   MOBILE SHEET
   ========================================================= */
function setSheetSnap(snap){
  state.mobileSheetState=snap;el.mobileSheet.dataset.snap=snap;
  el.sheetSnap.textContent=snap==="full"?"Show less":"Expand";
  el.sheetSnap.setAttribute("aria-label",snap==="full"?"Collapse details":"Expand details");
}
function cycleSheet(){setSheetSnap(state.mobileSheetState==="full"?"medium":"full")}
function installSheetGestures(){
  const handle=el.sheetSnap.parentElement;
  let start=null;
  handle.addEventListener("pointerdown",event=>{
    if(event.target.closest("button"))return;
    start=event.clientY;handle.setPointerCapture?.(event.pointerId);
  });
  handle.addEventListener("pointerup",event=>{
    if(start!==null&&Math.abs(event.clientY-start)>30)setSheetSnap(event.clientY<start?"full":"medium");
    start=null;
  });
  handle.addEventListener("pointercancel",()=>{start=null});
}

/* =========================================================
   STATUS / ERROR / BRIDGE
   ========================================================= */
function setStatus(message,{tone="info",retry=false}={}){el.mapStatusText.textContent=message||"";el.mapStatus.dataset.tone=tone;el.mapRetry.hidden=!retry;el.mapStatus.hidden=!message}
function showMapFailure(){
  state.mapReady=false;state.mapFailed=true;
  clearTimeout(state.mapStartTimer);
  state.resizeObserver?.disconnect();
  stopRouteAnimation();
  const oldMap=state.map;state.map=null;
  try{oldMap?.remove()}catch{}
  el.networkMap.hidden=true;
  try{state.fallback=createNetworkOverview(el.fallbackMap,el.fallbackPins,(type,id,focus)=>selectObject(type,id,{focus}))}
  catch(error){logger("overview_unavailable",{message:error.message})}
  el.fallbackMap.hidden=!state.fallback;
  el.fallbackCredit.hidden=!state.fallback;
  [el.zoomIn,el.zoomOut,el.resetMap].forEach(button=>{button.disabled=!state.fallback});
  renderOverview();fitDefaultBounds(false);
  if(state.dataReceived){
    setStatus(state.fallback?"":"Map unavailable. Search or browse places to continue.");
    if(state.selectionId)focusSelection(state.selectionType,getObject(state.selectionType,state.selectionId));
  }
}
function requestRefresh(){
  window.parent?.postMessage({source:HTML_SOURCE,type:"SKANDI_MAP_REFRESH"},"*");
  setStatus("Loading places…");
}
function notifyReady(){try{window.parent?.postMessage({source:HTML_SOURCE,type:"SKANDI_MAP_READY"},"*")}catch{}}
function applyPayload(payload){
  try{
    if(payload.paths){paths={...paths,...payload.paths};state.siteBridge=true;}
    if(payload.selection)state.linkedSelection=payload.selection;
    const previousSelection={type:state.selectionType,id:state.selectionId};state.model=normalizePayload(payload);state.dataReceived=true;
    renderModel();
    setStatus(state.mapReady||state.fallback?"":state.mapFailed?"Map unavailable. Search or browse places to continue.":"Loading map…");
    if(previousSelection.id&&getObject(previousSelection.type,previousSelection.id))selectObject(previousSelection.type,previousSelection.id,{camera:false,history:false});else if(previousSelection.id)clearSelection({camera:false,history:false});
    else applyDeepLink(state.linkedSelection);
    analytics("network_view",state.model.stats);
  }catch(error){logger("payload_render_failed",{message:error.message});setStatus("We couldn't load the network right now.",{tone:"error",retry:true})}
}
window.loadMapData=applyPayload;

/* Listener-first bridge: attached before READY is ever sent. */
window.addEventListener("message",event=>{
  let data=event.data;if(typeof data==="string"){try{data=JSON.parse(data)}catch{return}}
  if(event.source!==window.parent||!data||typeof data!=="object")return;
  if(data.source&&data.source!==PARENT_SOURCE)return;
  const type=cleanString(data.type).toUpperCase();
  if(type==="SKANDI_MAP_SELECTION"){
    state.linkedSelection=data.payload;
    if(!state.linkedSelection?.id && state.panelOpen)clearSelection({history:false});
    else applyDeepLink(state.linkedSelection);
    return;
  }
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
  el.modeRail.addEventListener("click",event=>{const button=event.target.closest("[data-mode]");if(button)setMode(button.dataset.mode)});
  el.searchOpen.addEventListener("click",()=>openSearch());
  el.browseOpen.addEventListener("click",()=>openSearch(true));
  el.switchSearch.addEventListener("click",()=>setSearchView(false));
  el.switchBrowse.addEventListener("click",()=>setSearchView(true));
  el.searchClose.addEventListener("click",closeSearch);
  el.searchLayer.addEventListener("click",event=>{if(event.target===el.searchLayer)closeSearch()});
  el.searchLayer.addEventListener("keydown",event=>{
    if(event.key!=="Tab")return;
    const controls=[...el.searchLayer.querySelectorAll("button,input,select")].filter(control=>!control.disabled&&!control.closest("[hidden]"));
    const first=controls[0],last=controls.at(-1);
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus()}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus()}
  });
  el.networkSearch.addEventListener("input",event=>renderSearchResults(event.target.value));
  el.networkSearch.addEventListener("keydown",event=>{
    if(event.key==="ArrowDown"){event.preventDefault();el.searchResults.querySelector(".search-result")?.focus()}
  });
  el.searchResults.addEventListener("keydown",event=>{
    const buttons=[...el.searchResults.querySelectorAll(".search-result")],index=buttons.indexOf(document.activeElement);
    if(event.key==="ArrowDown"){event.preventDefault();buttons[Math.min(buttons.length-1,index+1)]?.focus()}
    if(event.key==="ArrowUp"){event.preventDefault();(buttons[index-1]||el.networkSearch).focus()}
  });
  const closePanel=()=>{clearSelection({history:true});el.searchOpen.focus()};
  el.panelClose.addEventListener("click",closePanel);
  el.mobileSheetClose.addEventListener("click",closePanel);
  el.sheetSnap.addEventListener("click",cycleSheet);installSheetGestures();
  el.zoomIn.addEventListener("click",()=>{
    if(state.fallback)state.fallback.zoom(1.5);
    else state.map?.zoomIn({duration:cameraDuration(220)});
  });
  el.zoomOut.addEventListener("click",()=>{
    if(state.fallback)state.fallback.zoom(1/1.5);
    else state.map?.zoomOut({duration:cameraDuration(220)});
  });
  el.resetMap.addEventListener("click",()=>{
    state.selectedRegion=null;state.selectedAirlineId=null;state.mode="destinations";
    clearSelection();syncModeButtons();renderRegions();fitDefaultBounds(true);
  });
  el.mapRetry.addEventListener("click",requestRefresh);
  document.addEventListener("keydown",event=>{
    if(event.key!=="Escape")return;
    if(state.searchOpen)closeSearch();
    else if(state.panelOpen)closePanel();
  });

  setStatus("Loading places…");
  initMap();
  notifyReady();
  setTimeout(()=>{if(!state.dataReceived&&state.retryCount<1){state.retryCount++;requestRefresh()}},4500);
  setTimeout(()=>{if(!state.dataReceived)setStatus("Places couldn’t load. Try again.",{tone:"error",retry:true})},16000);
});
window.addEventListener("pagehide",event=>{
  if(event.persisted)return;
  clearTimeout(state.mapStartTimer);
  stopRouteAnimation();state.resizeObserver?.disconnect();state.fallback?.destroy();
  try{state.map?.remove()}catch{}
});
