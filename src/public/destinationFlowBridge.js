// /src/public/destinationFlowBridge.js
// Canonical Wix bridge for the merged explorer and the existing standalone entry pages.
import wixLocation from "wix-location-frontend";
import { getDestinationFlowCatalog } from "backend/SKANDI_CORE/destinationFlow.web";
import { createDestinationContent } from "public/destinationContent";
import { startBookingSearch } from "public/bookingSearch";
import { SITE_MAP, APP_ROUTES, isSafeInternalRoute } from "public/siteMap";

const PARENT = "SKANDI_WIX_PARENT";
const SOURCES = {flow:"SKANDI_DESTINATION_FLOW",index:"SKANDI_DESTINATIONS_INDEX",country:"SKANDI_DYNAMIC_COUNTRY_PAGE",destination:"SKANDI_DYNAMIC_DESTINATION_PAGE",area:"SKANDI_DYNAMIC_DESTINATION_AREA",hotels:"SKANDI_AREA_HOTEL_SEARCH",hotel:"SKANDI_HOTEL_DETAIL"};
const READY = {index:"DESTINATIONS_INDEX_READY",country:"COUNTRY_READY",destination:"DESTINATION_READY",area:"AREA_READY",hotels:"HOTEL_SEARCH_READY",hotel:"HOTEL_DETAIL_READY"};
const ERRORS = {flow:"DESTINATION_FLOW_ERROR",index:"DESTINATIONS_INDEX_ERROR",country:"COUNTRY_ERROR",destination:"DESTINATION_ERROR",area:"AREA_ERROR",hotels:"HOTEL_SEARCH_ERROR",hotel:"HOTEL_DETAIL_ERROR"};
const LANGUAGES = ["EN","SV","NO","DA","ES","FI","DE","FR-FR","FR-CA","TH"];
const clean = (v,n=500) => String(v ?? "").trim().slice(0,n);
const obj = v => v && typeof v === "object" && !Array.isArray(v) ? v : {};
const slug = v => clean(v,240).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/&/g," and ").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");
const fail = (code,message) => Object.assign(new Error(message),{code,publicMessage:message});
function bounded(promise) {
  let timer;
  return Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(fail("DESTINATION_TIMEOUT","Destination information took too long to load. Select Retry.")),25000);})]).finally(()=>clearTimeout(timer));
}
export function bindDestinationFlow($w, entry = "index") {
  let html = null, merged = false, catalog = [], catalogJob = null, loadedAt = 0, discoveryTimer = null;
  let flowState = initialState(), settings = {language:"EN",currency:"USD"};
  const bound = new Set(), jobs = new Map();
  const content = createDestinationContent(()=>catalog,()=>flowState,LANGUAGES);
  function initialState() {
    const q = obj(wixLocation.query);
    const state = {countrySlug:slug(q.country),destinationSlug:slug(q.destination),areaSlug:slug(q.area),hotelSlug:slug(q.hotel),hotelId:clean(q.hotelId,160)};
    const level = q.view === "hotel" || state.hotelSlug || state.hotelId ? "hotel" : q.view === "hotels" ? "hotels" : state.areaSlug ? "area" : state.destinationSlug ? "destination" : state.countrySlug ? "country" : entry;
    return {...state,level};
  }
  function post(type,payload={},requestId="",flowEpoch="") { html?.postMessage({source:PARENT,type,payload,requestId,flowEpoch,timestamp:new Date().toISOString()}); }
  function report(kind,error,m) {
    post(ERRORS[kind]||ERRORS.flow,{action:m.type,code:clean(error?.code||"DESTINATION_REQUEST_FAILED",100),message:clean(error?.publicMessage||"Destination information is temporarily unavailable. Select Retry.",500)},m.requestId||"",m.flowEpoch||"");
  }
  async function ensureCatalog(force=false) {
    if (!force && loadedAt && Date.now()-loadedAt<60000) return;
    if (!catalogJob) catalogJob=bounded(getDestinationFlowCatalog({force})).then(result=>{
      if (!result?.ok || !Array.isArray(result.records)) throw fail(result?.code||"DESTINATION_CONTENT_UNAVAILABLE",result?.publicMessage||"Destination information is temporarily unavailable.");
      catalog=result.records; loadedAt=Date.now();
    }).finally(()=>{catalogJob=null;});
    await catalogJob;
  }
  function navigate(raw) {
    let path=clean(raw,1600);
    if (path==="/home") path=SITE_MAP.home;
    if (!isSafeInternalRoute(path)||/[\\\u0000-\u0020]/.test(path)||/%5c|%0[0-9a-f]|%1[0-9a-f]/i.test(path)) throw fail("DESTINATION_INVALID_ROUTE","This link is unavailable.");
    const u=new URL(path,"https://www.skanditravels.com"),parts=u.pathname.split("/").filter(Boolean);
    if(["destinations","our-destinations","hotels"].includes(parts[0])&&parts.length>1&&!u.search&&!parts.includes("map")&&parts[1]!=="country"){
      const hotels=parts[0]==="hotels"||parts[parts.length-1]==="hotels";
      if(parts[parts.length-1]==="hotels")parts.pop();
      path=content.customPath(hotels?"hotels":"destination",{countrySlug:slug(decodeURIComponent(parts[1]||"")),destinationSlug:slug(decodeURIComponent(parts[2]||"")),areaSlug:slug(decodeURIComponent(parts[3]||""))});
    }
    if(u.pathname==="/hotel-detail")path=content.customPath("hotel",{countrySlug:u.searchParams.get("country")||"",destinationSlug:u.searchParams.get("destination")||"",areaSlug:u.searchParams.get("area")||"",hotelSlug:u.searchParams.get("hotel")||"",hotelId:u.searchParams.get("hotelId")||""});
    wixLocation.to(path);
  }
  function settingsFrom(p) {
    const s=obj(p.settings||p),language=clean(s.language||settings.language,12).toUpperCase(),currency=clean(s.currency||settings.currency,3).toUpperCase();
    settings={language:LANGUAGES.includes(language)?language:"EN",currency:["USD","SEK","NOK","DKK","EUR"].includes(currency)?currency:"USD"};
    return settings;
  }
  function context(p={}) {
    const q=obj(p.query), outer=merged?flowState:initialState();
    return {...outer,countrySlug:slug(p.countrySlug||q.country||outer.countrySlug),destinationSlug:slug(p.destinationSlug||q.destination||outer.destinationSlug),areaSlug:slug(p.areaSlug||q.area||outer.areaSlug),hotelSlug:slug(p.hotelSlug||q.hotel||outer.hotelSlug),hotelId:clean(p.hotelId||q.hotelId||outer.hotelId,160)};
  }
  function recordFor(kind,p={}) {
    const c=context(p),key=kind==="country"?p.slug||c.countrySlug:kind==="destination"?p.slug||c.destinationSlug:kind==="area"?p.slug||c.areaSlug:c.hotelSlug;
    const r=kind==="hotel"&&c.hotelId?content.byId(c.hotelId):content.byTypeSlug(kind.toUpperCase(),key);
    if (!r || r.entityType!==kind.toUpperCase()) throw fail("DESTINATION_NOT_FOUND","This item is not currently published. Choose another destination.");
    const country=c.countrySlug?content.byTypeSlug("COUNTRY",c.countrySlug):null;
    if (kind!=="country"&&c.countrySlug&&(!country||!content.isUnder(r,country))) throw fail("DESTINATION_SCOPE_MISMATCH","This item does not belong to the selected country.");
    const destination=c.destinationSlug?content.byTypeSlug("DESTINATION",c.destinationSlug):null;
    if(["area","hotel"].includes(kind)&&c.destinationSlug&&(!destination||!content.isUnder(r,destination)))throw fail("DESTINATION_SCOPE_MISMATCH","This item does not belong to the selected destination.");
    const area=c.areaSlug?content.byTypeSlug("AREA",c.areaSlug):null;
    if(kind==="hotel"&&c.areaSlug&&(!area||!content.isUnder(r,area)))throw fail("DESTINATION_SCOPE_MISMATCH","This hotel does not belong to the selected area.");
    return r;
  }
  function directory() {return content.records("COUNTRY").map(c=>({slug:slug(c.slug||c.name),name:c.name,code:c.code}));}
  function arrivals(record) {
    const country=record.entityType==="COUNTRY"?record:content.countryOf(record);
    const names=new Set([country?.name,country?.code,country?.details?.countryName,country?.details?.countryCode].map(slug).filter(Boolean));
    const linked=new Set();
    for (const r of catalog.filter(r=>r.id===record.id||content.isUnder(r,record))) for(const k of ["nearestAirportId","secondaryAirportId","searchAirportIata"]) if(r.details?.[k])linked.add(r.details[k]);
    const airports=content.airportDirectory().filter(a=>/^[A-Z]{3}$/.test(a.iata));
    return airports.filter(a=>names.has(slug(a.country))||linked.has(a.id)||linked.has(a.iata));
  }
  function countryPage(r) {
    const page=content.countryPage(r,settings.language);
    return {...page,arrivalAirports:arrivals(r),paths:{hotels:content.customPath("hotels",{countrySlug:page.slug}),packages:SITE_MAP.packages,map:SITE_MAP.ourNetwork}};
  }
  async function pageResult(kind,m) {
    const p=obj(m.payload),job={id:m.requestId||"",flowEpoch:m.flowEpoch||"",promise:null};
    settingsFrom(p);
    const key=JSON.stringify([kind,context(p),p.slug,settings]);
    const old=jobs.get(kind);
    if(old?.key===key&&!p.force){old.id=job.id;old.flowEpoch=job.flowEpoch;if(old.result)post(old.type,old.result,old.id,old.flowEpoch);return old.promise;}
    job.key=key;jobs.set(kind,job);
    job.promise=(async()=>{
      try {
        await ensureCatalog(p.force===true);if(jobs.get(kind)!==job)return;
        let type,result;
        if(kind==="index") {
          const countries=content.records("COUNTRY").map(r=>({id:r.id,code:r.code,slug:slug(r.slug||r.name),name:r.name,image:content.cardImageOf(r),cardImage:content.cardImageOf(r),intro:content.summaryOf(r,settings.language),areaCount:content.directChildren(r,["DESTINATION","AREA"]).length,hotelCount:content.hotelsForScope(r).length,areas:content.directChildren(r,["DESTINATION","AREA"]).slice(0,6).map(a=>({name:a.name,slug:slug(a.slug||a.name),destinationSlug:a.entityType==="DESTINATION"?slug(a.slug||a.name):"",areaSlug:a.entityType==="AREA"?slug(a.slug||a.name):""}))}));
          type="DESTINATIONS_INDEX_DATA";result={countries};
        } else if(kind==="country") {
          const key=slug(p.slug||context(p).countrySlug),r=key?recordFor(kind,{...p,slug:key}):null;
          type="COUNTRY_PAGE_RESULT";result={page:r?countryPage(r):null,directory:directory()};
        } else if(kind==="destination"||kind==="area") {
          const r=recordFor(kind,p);type=kind==="destination"?"DESTINATION_PAGE_RESULT":"AREA_PAGE_RESULT";
          result={page:kind==="destination"?content.destinationPage(r,settings.language):content.areaPage(r,settings.language)};
        } else if(kind==="hotels") {
          const c=context(p);
          for(const [k,v] of [["country",c.countrySlug],["destination",c.destinationSlug],["area",c.areaSlug]])if(v)recordFor(k,{...p,slug:v});
          const page=content.hotelListPage(c.countrySlug,c.destinationSlug,c.areaSlug,settings.language);
          if(c.countrySlug&&!c.destinationSlug&&!c.areaSlug)page.arrivalAirports=arrivals(recordFor("country",{...p,slug:c.countrySlug}));
          type="HOTEL_SEARCH_PAGE_RESULT";result={page};
        } else if(kind==="hotel") {
          type="HOTEL_DETAIL_DATA";result={page:content.hotelPage(recordFor(kind,p),settings.language,obj(p.query))};
        }
        job.type=type;job.result={...result,settings:{...settings},routes:{...SITE_MAP,...APP_ROUTES},source:"SUPABASE_PUBLIC_INVENTORY"};
        post(type,job.result,job.id,job.flowEpoch);
      }catch(e){if(jobs.get(kind)===job){jobs.delete(kind);report(kind,e,{...m,requestId:job.id,flowEpoch:job.flowEpoch});}}
    })();return job.promise;
  }
  async function search(kind,m) {
    await ensureCatalog();const p=obj(m.payload),raw=obj(p.search||p.searchContext||p.offer?.searchContext),c=context(p);
    let scope=kind==="hotels"?(c.areaSlug?recordFor("area",p):c.destinationSlug?recordFor("destination",p):c.countrySlug?recordFor("country",p):null):recordFor(kind,p);
    if(kind==="hotels"&&(!scope||scope.entityType==="COUNTRY")){
      const arrival=scope&&arrivals(scope).find(a=>a.iata===clean(raw.destinationIata,3).toUpperCase());
      if(!arrival)throw fail("HOTEL_LOCATION_REQUIRED","Choose where you want to stay before searching.");
      scope=content.byId(arrival.id);
    }
    let search=kind==="hotel"||kind==="hotels"?content.hotelSearch(raw,scope||{}):content.v9BookingSearch(raw,scope);
    if(kind==="country") {
      const target=arrivals(scope).find(a=>a.iata===clean(raw.destinationIata,3).toUpperCase());
      if(!target)throw fail("COUNTRY_ARRIVAL_REQUIRED","Choose an arrival airport in this country.");
      search={...search,destination:target.iata,destinationIata:target.iata,destinationLabel:target.city||target.name};
    }
    const hotelOnly=kind==="hotel"||kind==="hotels";
    search={...search,tripType:hotelOnly?"hotelOnly":"package",productType:hotelOnly?"hotel":"holiday",...settings,locale:settings.language};
    if(hotelOnly){const d=scope?.details||{},lat=d.latitude,lon=d.longitude;if(lat!==null&&lat!==undefined&&lat!==""&&lon!==null&&lon!==undefined&&lon!==""&&Number.isFinite(Number(lat))&&Number.isFinite(Number(lon))&&Math.abs(Number(lat))<=90&&Math.abs(Number(lon))<=180)search.location={latitude:Number(lat),longitude:Number(lon),label:scope.name};}
    if(kind==="hotel") {
      const d=scope.details||{},id=clean(d.duffelAccommodationId||d.providerAccommodationId,180);
      if(!id)throw fail("HOTEL_MAPPING_REQUIRED","Live booking is not configured for this hotel yet. Contact SKANDI for availability.");
      search.accommodationId=id;
    }
    const from=search.departureDate,to=search.returnDate;
    const date=v=>/^\d{4}-\d{2}-\d{2}$/.test(v||"")&&Number.isFinite(Date.parse(v+"T00:00:00Z"))&&new Date(v+"T00:00:00Z").toISOString().slice(0,10)===v;
    if(!date(from)||!date(to)||from<new Date().toISOString().slice(0,10)||to<=from)throw fail("DESTINATION_INVALID_DATES","Choose valid future travel dates.");
    if(!hotelOnly&&!/^[A-Z]{3}$/.test(search.origin||""))throw fail("DESTINATION_ORIGIN_REQUIRED","Choose a departure airport from the list.");
    const path=startBookingSearch(search,"DESTINATIONS");
    post("BOOKING_SEARCH_NAVIGATING",{path},m.requestId||"",m.flowEpoch||"");navigate(path);
  }
  async function receive(event,embed) {
    let m=event?.data;if(typeof m==="string"){try{m=JSON.parse(m);}catch(_){return;}}
    if(!m||typeof m!=="object")return;
    const kind=Object.keys(SOURCES).find(k=>SOURCES[k]===m.source)||(m.source==="SKANDI_HOTEL_SEARCH"?"hotels":"");
    if(!kind||(html&&html!==embed))return;
    if(!html) {
      if(m.type!=="DESTINATION_FLOW_READY"&&!Object.values(READY).includes(m.type))return;
      html=embed;merged=kind==="flow";clearTimeout(discoveryTimer);
    }
    const p=obj(m.payload);
    try {
      if(kind==="flow") {
        if(m.type==="DESTINATION_FLOW_READY") {post("DESTINATION_FLOW_HOST_READY",{initialState:flowState,protocolVersion:"V12",routes:{...SITE_MAP,...APP_ROUTES}});return;}
        if(m.type==="DESTINATION_FLOW_REFRESH"){await ensureCatalog(true);jobs.clear();post("DESTINATION_FLOW_SET_STATE",{state:flowState});return;}
        if(m.type==="DESTINATION_FLOW_STATE_CHANGED"){
          if(!["index","country","destination","area","hotels","hotel"].includes(p.level))return;
          const next={level:p.level,countrySlug:slug(p.countrySlug),destinationSlug:slug(p.destinationSlug),areaSlug:slug(p.areaSlug),hotelSlug:slug(p.hotelSlug),hotelId:clean(p.hotelId,160)};
          if(JSON.stringify(next)!==JSON.stringify(flowState))jobs.clear();
          flowState=next;
          const query={};for(const [k,v] of [["country",flowState.countrySlug],["destination",flowState.destinationSlug],["area",flowState.areaSlug],["hotel",flowState.hotelSlug],["hotelId",flowState.hotelId]])if(v)query[k]=v;
          if(["hotels","hotel"].includes(p.level))query.view=p.level;
          const remove=["country","destination","area","hotel","hotelId","view"].filter(k=>!query[k]&&wixLocation.query?.[k]!==undefined);
          if(remove.length)wixLocation.queryParams?.remove(remove);wixLocation.queryParams?.add(query);return;
        }
        if(m.type==="DESTINATION_FLOW_NAVIGATE_EXTERNAL"){navigate(p.path);return;}
        if(m.type==="DESTINATION_FLOW_RESIZE"){const h=Number(p.height);if(Number.isFinite(h)&&"height" in html){try{html.height=Math.max(680,Math.min(30000,h));}catch(_){}}return;}
      }
      if(m.type===READY[kind]||m.type==="DESTINATION_REFRESH"||kind==="country"&&m.type==="UPDATE_SETTINGS")return pageResult(kind,m);
      if(m.type==="RESIZE_IFRAME"||m.type==="SKANDI_EMBED_RESIZE"){const h=Number(p.height||m.height);if(Number.isFinite(h)&&"height" in html){try{html.height=Math.max(680,Math.min(30000,h));}catch(_){}}return;}
      if(["COUNTRY_SEARCH_OFFERS","DESTINATION_SEARCH_OFFERS","AREA_SEARCH_OFFERS","COUNTRY_SELECT_OFFER","DESTINATION_SELECT_OFFER","AREA_SELECT_OFFER","HOTEL_SEARCH_RUN","HOTEL_DETAIL_CHECK_AVAILABILITY","HOTEL_SEARCH_SELECT","HOTEL_DETAIL_SELECT_OFFER"].includes(m.type))return await search(kind,m);
      if(m.type==="COUNTRY_SELECT_COUNTRY") {const r=content.byTypeSlug("COUNTRY",p.slug);if(!r)throw fail("COUNTRY_NOT_FOUND","Choose a published country.");navigate(APP_ROUTES.country+"?country="+encodeURIComponent(slug(r.slug||r.name)));return;}
      if(["COUNTRY_NAVIGATE","DESTINATION_NAVIGATE","AREA_NAVIGATE","HOTEL_SEARCH_NAVIGATE","HOTEL_DETAIL_NAVIGATE"].includes(m.type)){navigate(p.path||m.path);return;}
      if(m.type==="HOTEL_SEARCH_VIEW_HOTEL"){const h=obj(p.hotel||p),r=content.byId(h.inventoryMasterId||h.id)||content.byTypeSlug("HOTEL",h.hotelSlug||h.slug);if(!r)throw fail("HOTEL_NOT_FOUND","Select a published hotel.");navigate(content.previewHotel(r,settings.language).path);return;}
      if(m.type.endsWith("_FAVOURITE"))navigate(APP_ROUTES.myProfile+"?tab=favourites");
    }catch(error){report(kind,error,m);}
  }
  let attempts=0;
  function discover() {
    if(html)return;attempts++;
    const found=[];
    for(const id of ["#countryDestinationHtml","#destinationDetailHtml","#htmlDestinations","#destinationFlowEmbed","#htmlDestination","#destinationsEmbed"]){try{const e=$w(id);if(e)found.push(e);}catch(_){}}
    try{const list=$w("HtmlComponent");if(Array.isArray(list))found.push(...list);else if(list&&typeof list.forEach==="function")list.forEach(e=>found.push(e));else if(list&&typeof list[Symbol.iterator]==="function")found.push(...list);}catch(_){}
    for(const embed of found){if(!embed||typeof embed.onMessage!=="function"||typeof embed.postMessage!=="function")continue;const key=embed.id||embed;if(bound.has(key))continue;bound.add(key);embed.onMessage(e=>receive(e,embed));embed.postMessage({source:PARENT,type:"DESTINATION_BRIDGE_READY",payload:{version:"V12"}});embed.postMessage({source:PARENT,type:"COUNTRY_HOST_READY",payload:{version:"V12"}});}
    if(attempts<60)discoveryTimer=setTimeout(discover,500);
    else console.error("[Destinations V12] No destination embed handshake received.");
  }
  discover();
}
