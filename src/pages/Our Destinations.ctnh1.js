// /src/pages/Our Destinations.ctnh1.js
// SKANDI Destination Flow V9.2 — B-011.20 catalog synchronization recovery.
// Preserves the installed V9.2 HTML/message contract while eliminating legacy RIA/FINAL/orchestrator imports.
import { createDestinationContent } from "public/destinationContent";
import { SITE_MAP, APP_ROUTES, isSafeInternalRoute } from "public/siteMap.js";
import { openCustomerLogin } from "public/customerAuthUi.js";
import wixLocation from "wix-location-frontend";
import { session } from "wix-storage";
import {
  searchUnifiedOffers,
  createBookingCartFromOffer,
  searchLiveStays
} from "backend/SKANDI_CORE/customerBooking.web.js";
import { getDestinationFlowCatalog } from "backend/SKANDI_CORE/destinationFlow.web.js";


const DESTINATION_EMBED_IDS = ["#htmlDestinations", "#destinationFlowEmbed", "#htmlDestination", "#destinationsEmbed"];
const FLOW_SOURCE = "SKANDI_DESTINATION_FLOW";
const INDEX_SOURCE = "SKANDI_DESTINATIONS_INDEX";
const COUNTRY_SOURCE = "SKANDI_DYNAMIC_COUNTRY_PAGE";
const DESTINATION_SOURCE = "SKANDI_DYNAMIC_DESTINATION_PAGE";
const AREA_SOURCE = "SKANDI_DYNAMIC_DESTINATION_AREA";
const HOTEL_SEARCH_SOURCES = new Set(["SKANDI_AREA_HOTEL_SEARCH", "SKANDI_HOTEL_SEARCH"]);
const HOTEL_DETAIL_SOURCE = "SKANDI_HOTEL_DETAIL";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";
const PROTOCOL_VERSION = "2026.09.16.destination-b01120";
const CLIENT_CATALOG_TTL_MS = 15_000;


let catalog = [];
let catalogPromise = null;
let catalogLoadedAt = 0;
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


function catalogCounts() {
  return catalog.reduce((acc, record) => {
    const type = clean(record?.entityType, 60).toUpperCase() || "UNKNOWN";
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});
}
function catalogFingerprint(recordsValue = catalog) {
  return arr(recordsValue)
    .map(record => `${clean(record?.id,160)}:${clean(record?.updatedAt,80)}`)
    .sort()
    .join("|");
}
async function ensureCatalog({ force = false } = {}) {
  const isFresh = catalog.length && (Date.now() - catalogLoadedAt) < CLIENT_CATALOG_TTL_MS;
  if (!force && isFresh) return catalog;
  if (!catalogPromise) {
    catalogPromise = getDestinationFlowCatalog({ force: force === true }).then(result => {
      if (!result?.ok) {
        const error = new Error(clean(result?.publicMessage || "Destination inventory is unavailable.", 500));
        error.code = clean(result?.code || "DESTINATION_BACKEND_REQUEST_FAILED", 160);
        throw error;
      }
      catalog = arr(result.records);
      catalogLoadedAt = Date.now();
      return catalog;
    }).finally(() => { catalogPromise = null; });
  }
  return catalogPromise;
}
function hostReadyPayload(html, initialState = flowState, extra = {}) {
  return {
    protocolVersion: PROTOCOL_VERSION,
    embedId: clean(html?.id, 80),
    initialState: { ...initialState },
    source: "SUPABASE_PUBLIC_INVENTORY",
    counts: catalogCounts(),
    catalogLoadedAt: catalogLoadedAt ? new Date(catalogLoadedAt).toISOString() : null,
    ...extra,
    readyAt: new Date().toISOString()
  };
}
const content = createDestinationContent(() => catalog, () => flowState);


async function makeCart(offer, search) {
  let cart = await createBookingCartFromOffer({ offer, search });
  if (cart?.requiresLogin) {
    try { await openCustomerLogin({ sourcePage: "DESTINATIONS", reason: "BOOKING_CART_AUTH" }); } catch (_) {}
    cart = await createBookingCartFromOffer({ offer, search });
  }
  if (!cart?.cartId) throw new Error(cart?.message || "The booking cart could not be created.");
  session.setItem("SKANDI_BOOKING_CART_ID", cart.cartId);
  if (cart.cartToken) session.setItem("SKANDI_BOOKING_CART_TOKEN", cart.cartToken);
  return cart;
}
function bookingUrl(cart){return `${APP_ROUTES.bookingFlow}?step=offer&cartId=${encodeURIComponent(cart.cartId)}${cart.cartToken?`&cartToken=${encodeURIComponent(cart.cartToken)}`:""}`}
function resolveHotel(payload={}){const q=obj(payload.query);return(q.hotelId&&content.byId(q.hotelId))||content.byTypeSlug("HOTEL",first(q.hotel,payload.hotelSlug,flowState.hotelSlug))||(flowState.hotelId&&content.byId(flowState.hotelId))||null}
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
        if(type==="DESTINATION_FLOW_READY"){
          flowState={...flowState,...payload};
          await ensureCatalog({force:true});
          post(html,"DESTINATION_FLOW_HOST_READY",hostReadyPayload(html,flowState,{resync:true}));
          post(html,"DESTINATION_FLOW_CATALOG_SYNCED",{source:"SUPABASE_PUBLIC_INVENTORY",counts:catalogCounts(),catalogLoadedAt:new Date(catalogLoadedAt).toISOString()});
          return
        }
        if(type==="DESTINATION_FLOW_REFRESH"){
          const before=catalogFingerprint();
          await ensureCatalog({force:true});
          const changed=before!==catalogFingerprint();
          post(html,"DESTINATION_FLOW_CATALOG_SYNCED",{source:"SUPABASE_PUBLIC_INVENTORY",counts:catalogCounts(),changed,catalogLoadedAt:new Date(catalogLoadedAt).toISOString()});
          post(html,"DESTINATION_FLOW_SET_STATE",{state:{...flowState},refreshToken:Date.now()});
          return
        }
        if(type==="DESTINATION_FLOW_STATE_CHANGED"){flowState={...flowState,...payload};syncWixFlowQuery(flowState);return}
        if(type==="DESTINATION_FLOW_RESIZE"){const requested=Number(payload.height),height=Number.isFinite(requested)?Math.max(680,Math.min(30000,Math.round(requested))):1200;try{if("height" in html)html.height=height}catch(_){}return}
        if(type==="DESTINATION_FLOW_NAVIGATE_EXTERNAL"){const path=safeExternalPath(payload.path);if(path)wixLocation.to(path);return}
      }
      if(source===INDEX_SOURCE&&type==="DESTINATIONS_INDEX_READY"){
        post(html,"DESTINATIONS_INDEX_LOADING",{});
        await ensureCatalog();
        const language=normalizeLanguage(payload.language),countries=content.records("COUNTRY").map(country=>{const children=content.directChildren(country,["DESTINATION","AREA"]);return{id:country.id,code:clean(country.code,20),slug:slug(country.slug||country.name),name:clean(country.name,500),image:content.cardImageOf(country),heroImage:content.imageOf(country),cardImage:content.cardImageOf(country),intro:content.summaryOf(country,language),description:content.summaryOf(country,language),areaCount:children.length,hotelCount:content.hotelsForScope(country).length,areas:children.slice(0,6).map(child=>{const isArea=child.entityType==="AREA";return{name:clean(child.name,500),slug:slug(child.slug||child.name),destinationSlug:isArea?"":slug(child.slug||child.name),areaSlug:isArea?slug(child.slug||child.name):"",path:isArea?content.customPath("area",{countrySlug:slug(country.slug||country.name),areaSlug:slug(child.slug||child.name)}):content.customPath("destination",{countrySlug:slug(country.slug||country.name),destinationSlug:slug(child.slug||child.name)})}})}});
        if(!countries.length)throw new Error("No published destinations are currently available.");
        post(html,"DESTINATIONS_INDEX_DATA",{countries,source:"SUPABASE_PUBLIC_INVENTORY",counts:catalogCounts(),catalogLoadedAt:new Date(catalogLoadedAt).toISOString()});return
      }
      if(source===COUNTRY_SOURCE){
        if(type==="COUNTRY_READY"){await ensureCatalog();const record=content.byTypeSlug("COUNTRY",first(payload.slug,flowState.countrySlug));if(!record)throw new Error("Country not found.");post(html,"COUNTRY_PAGE_RESULT",{page:content.countryPage(record,normalizeLanguage(payload.settings?.language))});return}
        if(type==="COUNTRY_SEARCH_OFFERS"){const scope=content.byTypeSlug("COUNTRY",first(payload.countrySlug,flowState.countrySlug)),search=content.v9BookingSearch(payload.search||{},scope);assertDateRange(search);const result=await searchUnifiedOffers({search});post(html,"COUNTRY_OFFERS_RESULT",{items:arr(result?.items),search});return}
        if(type==="COUNTRY_SELECT_OFFER"){const search=payload.search||payload.searchContext||payload.offer?.searchContext||{},cart=await makeCart(payload.offer||{},search);wixLocation.to(bookingUrl(cart));return}
      }
      if(source===DESTINATION_SOURCE){
        if(type==="DESTINATION_READY"){await ensureCatalog();const record=content.byTypeSlug("DESTINATION",first(payload.destinationSlug,flowState.destinationSlug));if(!record)throw new Error("Destination not found.");post(html,"DESTINATION_PAGE_RESULT",{page:content.destinationPage(record,normalizeLanguage(payload.settings?.language))});return}
        if(type==="DESTINATION_SEARCH_OFFERS"){const scope=content.byTypeSlug("DESTINATION",first(payload.destinationSlug,flowState.destinationSlug)),search=content.v9BookingSearch(payload.search||{},scope);assertDateRange(search);const result=await searchUnifiedOffers({search});post(html,"DESTINATION_OFFERS_RESULT",{items:arr(result?.items),search});return}
        if(type==="DESTINATION_SELECT_OFFER"){const search=payload.search||payload.searchContext||payload.offer?.searchContext||{},cart=await makeCart(payload.offer||{},search);wixLocation.to(bookingUrl(cart));return}
      }
      if(source===AREA_SOURCE){
        if(type==="AREA_READY"){await ensureCatalog();const record=content.byTypeSlug("AREA",first(payload.areaSlug,flowState.areaSlug));if(!record)throw new Error("Holiday area not found.");post(html,"AREA_PAGE_RESULT",{page:content.areaPage(record,normalizeLanguage(payload.settings?.language))});return}
        if(type==="AREA_SEARCH_OFFERS"){const scope=content.byTypeSlug("AREA",first(payload.areaSlug,flowState.areaSlug)),search=content.v9BookingSearch(payload.search||{},scope);assertDateRange(search);const result=await searchUnifiedOffers({search});post(html,"AREA_OFFERS_RESULT",{items:arr(result?.items),search});return}
        if(type==="AREA_SELECT_OFFER"){const search=payload.search||payload.searchContext||payload.offer?.searchContext||{},cart=await makeCart(payload.offer||{},search);wixLocation.to(bookingUrl(cart));return}
      }
      if(HOTEL_SEARCH_SOURCES.has(source)){
        if(type==="HOTEL_SEARCH_READY"){await ensureCatalog();post(html,"HOTEL_SEARCH_PAGE_RESULT",{page:content.hotelListPage(first(payload.countrySlug,flowState.countrySlug),first(payload.destinationSlug,flowState.destinationSlug),first(payload.areaSlug,flowState.areaSlug),normalizeLanguage(payload.settings?.language))});return}
        if(type==="HOTEL_SEARCH_RUN"){await ensureCatalog();const raw=payload.search||{},scope=content.byTypeSlug("AREA",first(raw.destinationAreaSlug,flowState.areaSlug))||content.byTypeSlug("DESTINATION",first(raw.destinationSlug,flowState.destinationSlug))||content.byTypeSlug("COUNTRY",first(raw.destinationCountrySlug,flowState.countrySlug)),search=content.hotelSearch(raw,scope||{});assertDateRange(search);const result=await searchUnifiedOffers({search});const language=normalizeLanguage(first(search.language,search.locale,"EN"));post(html,"HOTEL_SEARCH_RESULTS",{items:arr(result?.items).filter(i=>i.itemType==="hotel").map(i=>content.liveHotel(i,language)),search,supplier:"DUFFEL_STAYS"});return}
        if(type==="HOTEL_SEARCH_SELECT"){const offer=payload.offer||payload.hotel?.offer||payload.hotel||{},search=payload.search||offer.searchContext||{},cart=await makeCart(offer,search);post(html,"HOTEL_SEARCH_BOOKING_CART",cart);wixLocation.to(bookingUrl(cart));return}
        if(type==="HOTEL_SEARCH_FAVOURITE"){wixLocation.to("/my-profile?tab=favourites");return}
      }
      if(source===HOTEL_DETAIL_SOURCE){
        if(type==="HOTEL_DETAIL_READY"){await ensureCatalog();const record=resolveHotel(payload);if(!record)throw new Error("Hotel not found.");post(html,"HOTEL_DETAIL_DATA",{page:content.hotelPage(record,normalizeLanguage(payload.settings?.language),obj(payload.query)),supplier:"DUFFEL_STAYS"});return}
        if(type==="HOTEL_DETAIL_CHECK_AVAILABILITY"){
          await ensureCatalog();const record=resolveHotel({...payload,query:{hotel:flowState.hotelSlug,hotelId:flowState.hotelId}});if(!record)throw new Error("Hotel information is not loaded yet.");const search=content.hotelSearch(payload.search||payload,record);assertDateRange(search);const d=obj(record.details),accommodationId=clean(first(d.duffelAccommodationId,d.providerAccommodationId),180);let items=[];
          if(accommodationId){const targeted=await searchLiveStays({accommodationId,checkInDate:search.departureDate,checkOutDate:search.returnDate,adults:search.adults,children:search.children,childAges:search.childAges,rooms:search.rooms,fetchRates:true});items=arr(targeted?.items).map(item=>({...item,itemType:"hotel",productType:"HOTEL",provider:"Duffel",source:"LIVE_STAY",sourceLabel:"Live hotel availability",price:{amount:Number(item.total||item.cheapestRateTotalAmount||0),total:Number(item.total||item.cheapestRateTotalAmount||0),currency:item.currency||item.cheapestRateTotalCurrency||search.currency},total:Number(item.total||item.cheapestRateTotalAmount||0),currency:item.currency||item.cheapestRateTotalCurrency||search.currency,tripType:"hotelOnly",searchContext:search}))}
          else{const result=await searchUnifiedOffers({search});items=arr(result?.items).filter(item=>item.itemType==="hotel"&&content.sameAccommodation(item,record))}
          post(html,"HOTEL_DETAIL_AVAILABILITY_RESULT",{items,search,supplier:"DUFFEL_STAYS"});return
        }
        if(type==="HOTEL_DETAIL_SELECT_OFFER"){const offer=payload.offer||{};if(!offer?.id&&!offer?.staySearchResultId)throw new Error("Select a live hotel rate first.");const record=resolveHotel({query:{hotel:flowState.hotelSlug,hotelId:flowState.hotelId}})||{},search=content.hotelSearch(payload.search||offer.searchContext||{},record),cart=await makeCart(offer,search);post(html,"HOTEL_DETAIL_BOOKING_CART",cart);wixLocation.to(bookingUrl(cart));return}
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
  const initialState=wixInitialFlowState();
  flowState={...flowState,...initialState};
  post(html,"DESTINATION_FLOW_HOST_READY",hostReadyPayload(html,initialState));
  void ensureCatalog({force:true})
    .then(()=>post(html,"DESTINATION_FLOW_CATALOG_SYNCED",{source:"SUPABASE_PUBLIC_INVENTORY",counts:catalogCounts(),catalogLoadedAt:new Date(catalogLoadedAt).toISOString()}))
    .catch(error=>post(html,"DESTINATION_FLOW_ERROR",{code:clean(error?.code||"DESTINATION_BACKEND_REQUEST_FAILED",160),message:error?.publicMessage||error?.message||"Destination information is temporarily unavailable."}));
});
