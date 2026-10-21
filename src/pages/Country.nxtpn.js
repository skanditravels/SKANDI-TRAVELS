// /src/pages/Country.nxtpn.js
// Country V12 — public Inventory content and canonical customer booking.
// Shared header/footer/session/settings remain owned by masterPage.js.
import wixLocationFrontend from "wix-location-frontend";
import { getDestinationFlowCatalog } from "backend/SKANDI_CORE/destinationFlow.web";
import { searchUnifiedOffers, createBookingCartFromOffer } from "backend/SKANDI_CORE/customerBooking.web";
import { createDestinationContent } from "public/destinationContent";
import { SITE_MAP, APP_ROUTES, isSafeInternalRoute } from "public/siteMap";
import { openCustomerLogin } from "public/customerAuthUi";

const VERSION = "V12-COUNTRY-2026.10.06";
const SOURCE = "SKANDI_DYNAMIC_COUNTRY_PAGE";
const PARENT = "SKANDI_WIX_PARENT";
const LANGUAGES = ["EN","SV","NO","DA","ES","FI","DE","FR-FR","FR-CA","TH"];
const CURRENCIES = ["USD","SEK","NOK","DKK","EUR"];
const TYPES = new Set(["COUNTRY_READY","UPDATE_SETTINGS","COUNTRY_SELECT_COUNTRY","COUNTRY_SEARCH_OFFERS","COUNTRY_SELECT_OFFER","COUNTRY_NAVIGATE","RESIZE_IFRAME"]);
let html = null, catalog = [], catalogJob = null, catalogLoadedAt = 0;
let pageJob = null, searchJob = null, selectionJob = null;
let settings = { language:"EN", currency:"USD" };
let currentCountry = null, discoveryTimer = null, discoveryCount = 0;
const bound = new Set();
const content = createDestinationContent(() => catalog, () => ({}), LANGUAGES);

function clean(v, max = 1000) { return String(v ?? "").trim().slice(0,max); }
function obj(v) { return v && typeof v === "object" && !Array.isArray(v) ? v : {}; }
function slug(v) { return clean(v,240).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/&/g," and ").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,""); }
function normalizeSettings(v = {}) {
  const language=clean(v.language,12).toUpperCase(), currency=clean(v.currency,3).toUpperCase();
  return { language:LANGUAGES.includes(language)?language:"EN", currency:CURRENCIES.includes(currency)?currency:"USD" };
}
function fail(code, publicMessage) { return Object.assign(new Error(publicMessage), {code,publicMessage}); }
function bounded(promise, ms = 25000) {
  let timer;
  return Promise.race([promise,new Promise((_,reject) => { timer=setTimeout(() => reject(fail("COUNTRY_TIMEOUT","This request took too long. Please try again.")),ms); })])
    .finally(() => clearTimeout(timer));
}
function post(type,payload = {},requestId = "") {
  html?.postMessage({ source:PARENT,type,payload,requestId,timestamp:new Date().toISOString() });
}
function report(error,message) {
  post("COUNTRY_ERROR",{
    action:message.type,
    code:/^[A-Z][A-Z0-9_]{1,79}$/.test(String(error?.code||""))?error.code:"COUNTRY_REQUEST_FAILED",
    message:clean(error?.publicMessage||"The request could not be completed. Please try again.",400)
  },message.requestId);
}
function navigate(raw) {
  const path=clean(raw,1600);
  if (!isSafeInternalRoute(path) || /[\\\u0000-\u0020]/.test(path) || /%5c|%0[0-9a-f]|%1[0-9a-f]/i.test(path) ||
      /(^|\/)\.\.?($|\/)/.test(decodeURIComponent(path.split(/[?#]/)[0])) ||
      /^\/_(?:functions|api)(?:\/|$)/i.test(path)) throw fail("COUNTRY_INVALID_ROUTE","This link is unavailable.");
  wixLocationFrontend.to(path);
}
async function ensureCatalog(force = false) {
  if (!force && catalogLoadedAt && Date.now()-catalogLoadedAt < 60000) return;
  if (!catalogJob) {
    catalogJob=bounded(getDestinationFlowCatalog({force})).then(result => {
      if (!result?.ok || !Array.isArray(result.records)) {
        throw fail(/^[A-Z][A-Z0-9_]{1,79}$/.test(result?.code||"")?result.code:"COUNTRY_CONTENT_UNAVAILABLE",
          "Country information is temporarily unavailable. Please try again.");
      }
      catalog=result.records;
      catalogLoadedAt=Date.now();
    }).finally(() => { catalogJob=null; });
  }
  await catalogJob;
}
function requestedCountry(payload = {}) {
  // An iframe URL does not inherit the Wix page's query string.
  return slug(wixLocationFrontend.query?.country || payload.slug || currentCountry?.slug);
}
function arrivals(record) {
  if (!record) return [];
  const matches = new Set([record.code,record.name,record.details?.countryCode,record.details?.countryName].map(slug).filter(Boolean));
  const linked = new Set();
  for (const row of catalog.filter(r => r.id===record.id || content.isUnder(r,record))) {
    if (row.details?.nearestAirportId) linked.add(row.details.nearestAirportId);
    if (row.details?.secondaryAirportId) linked.add(row.details.secondaryAirportId);
    if (row.details?.searchAirportIata) linked.add(row.details.searchAirportIata);
  }
  return content.airportDirectory().filter(a => /^[A-Z]{3}$/.test(a.iata) &&
    (matches.has(slug(a.country)) || linked.has(a.id) || linked.has(a.iata)));
}
async function loadCountry(message) {
  if (selectionJob) throw fail("COUNTRY_SELECTION_PENDING","Please finish the current offer selection first.");
  const payload=obj(message.payload), nextSettings=normalizeSettings(payload.settings || (message.type==="UPDATE_SETTINGS"?payload:settings));
  const countrySlug=requestedCountry(payload), key=JSON.stringify({countrySlug,...nextSettings});
  settings=nextSettings;
  if (pageJob?.key===key && (!pageJob.complete || (!payload.force && Date.now()-pageJob.completedAt<60000))) {
    pageJob.requestId=message.requestId;
    if (pageJob.complete) post("COUNTRY_PAGE_RESULT",pageJob.result,message.requestId);
    return pageJob.promise;
  }
  const job={key,requestId:message.requestId,settings:{...settings},promise:null,complete:false};
  pageJob=job; searchJob=null; currentCountry=null;
  job.promise=(async () => {
    try {
      await ensureCatalog(payload.force===true);
      if (pageJob!==job) return;
      const directory=content.records("COUNTRY").map(c => ({slug:slug(c.slug||c.name),name:c.name,code:c.code}));
      if (!directory.length) throw fail("COUNTRY_EMPTY","No countries are currently published.");
      const record=countrySlug?content.byTypeSlug("COUNTRY",countrySlug):null;
      if (countrySlug && !record) throw fail("COUNTRY_NOT_FOUND","This country is not currently published. Choose another country from Destinations.");
      currentCountry=record;
      const page=record?content.countryPage(record,job.settings.language):null;
      if (page) {
        page.arrivalAirports=arrivals(record);
        page.paths={hotels:SITE_MAP.destinations+"?country="+encodeURIComponent(page.slug)+"&view=hotels",
          packages:SITE_MAP.packages+"?country="+encodeURIComponent(page.slug),map:SITE_MAP.ourNetwork};
      }
      job.result={page,directory,settings:job.settings,routes:{...SITE_MAP,...APP_ROUTES},source:"SUPABASE_PUBLIC_INVENTORY"};
      job.complete=true; job.completedAt=Date.now();
      post("COUNTRY_PAGE_RESULT",job.result,job.requestId);
    } catch(error) { if(pageJob===job) {pageJob=null;report(error,{...message,requestId:job.requestId});} }
  })();
  return job.promise;
}
function validDate(value) {
  const s=clean(value,10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d=new Date(s+"T00:00:00Z");
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0,10)===s;
}
function bookingSearch(raw) {
  if (!currentCountry) throw fail("COUNTRY_REQUIRED","Choose a country before searching.");
  const originInput=clean(raw.origin,300);
  const airports=content.airportDirectory().filter(a => /^[A-Z]{3}$/.test(a.iata));
  const originCode=(originInput.match(/\(([A-Z]{3})\)$/i)?.[1] || originInput).toUpperCase();
  let origins=airports.filter(a=>a.iata===originCode);
  if (!origins.length) origins=airports.filter(a=>[a.name,a.city].some(v=>slug(v)===slug(originInput)));
  if(origins.length!==1) throw fail("COUNTRY_ORIGIN_REQUIRED","Choose a departure airport from the list.");
  const target=arrivals(currentCountry).find(a=>a.iata===clean(raw.destinationIata,3).toUpperCase());
  if(!target) throw fail("COUNTRY_ARRIVAL_REQUIRED","Choose an arrival airport in this country.");
  if(origins[0].iata===target.iata) throw fail("COUNTRY_INVALID_ROUTE","Departure and arrival airports must be different.");
  const departureDate=clean(raw.departureDate,10), returnDate=clean(raw.returnDate,10), adults=Number(raw.adults);
  if(!validDate(departureDate)||!validDate(returnDate)||departureDate<new Date().toISOString().slice(0,10)||returnDate<=departureDate)
    throw fail("COUNTRY_INVALID_DATES","Choose a departure date today or later and a return date after departure.");
  if(!Number.isInteger(adults)||adults<1||adults>9) throw fail("COUNTRY_INVALID_TRAVELERS","Choose between one and nine travellers.");
  return {productType:"holiday",tripType:"package",origin:origins[0].iata,originIata:origins[0].iata,
    originLabel:origins[0].city||origins[0].name,destination:target.iata,destinationIata:target.iata,
    destinationLabel:target.city||target.name,destinationCountry:currentCountry.code,destinationCountrySlug:slug(currentCountry.slug||currentCountry.name),
    departureDate,returnDate,checkInDate:departureDate,checkOutDate:returnDate,adults,children:0,infants:0,rooms:1,
    language:settings.language,locale:settings.language,currency:settings.currency};
}
async function search(message) {
  if(selectionJob) throw fail("COUNTRY_SELECTION_PENDING","Please finish the current offer selection first.");
  if(searchJob?.requestId===message.requestId) {
    if(searchJob.result) post("COUNTRY_OFFERS_RESULT",searchJob.result,message.requestId);
    return searchJob.promise;
  }
  searchJob=null;
  const query=bookingSearch(obj(message.payload?.search)), job={requestId:message.requestId,search:query,items:[],promise:null};
  searchJob=job;
  job.promise=(async()=>{
    try {
      const result=await bounded(searchUnifiedOffers({search:query}),85000);
      if(searchJob!==job) return;
      if(!Array.isArray(result?.items)) throw fail("COUNTRY_INVALID_OFFERS","Travel results are temporarily unavailable.");
      job.items=result.items;
      job.result={items:job.items,search:query,errors:(Array.isArray(result.errors)?result.errors:[]).map(e=>({
        source:["flight","hotel"].includes(e?.source)?e.source:"search",
        code:/^[A-Z][A-Z0-9_]{1,79}$/.test(e?.code||"")?e.code:"SEARCH_FAILED"
      }))};
      post("COUNTRY_OFFERS_RESULT",job.result,message.requestId);
    } catch(error) {if(searchJob===job){searchJob=null;report(error,message);}}
  })();
  return job.promise;
}
async function selectOffer(message) {
  if(selectionJob) return selectionJob.promise;
  const id=clean(message.payload?.offer?.id,180), offer=searchJob?.items.find(item=>item.id===id);
  if(!offer) throw fail("COUNTRY_OFFER_EXPIRED","Search again before selecting this offer.");
  const query=searchJob.search, job={promise:null,navigated:false};
  selectionJob=job;
  job.promise=(async()=>{
    try {
      let result=await createBookingCartFromOffer({offer,search:query});
      if(result?.requiresLogin) {
        try { await openCustomerLogin({sourcePage:"COUNTRY",reason:"BOOKING_CART_AUTH"}); }
        catch(_) { throw fail("LOGIN_CANCELLED","Sign in was cancelled. The offer was not saved."); }
        result=await createBookingCartFromOffer({offer,search:query});
      }
      if(result?.requiresLogin) throw fail("LOGIN_REQUIRED","Sign in to continue with this offer.");
      if(!result?.cartId) throw fail("COUNTRY_CART_UNCONFIRMED","The booking cart could not be confirmed. Please check My Booking.");
      const step=["offer","extras","transfer","apis","seats","payment","confirmation"].includes(result.step)?result.step:"offer";
      const token=clean(result.cartToken||result.token,300);
      post("COUNTRY_NAVIGATE_TO_OFFER",{cartId:result.cartId,step},message.requestId);
      navigate(APP_ROUTES.bookingFlow+"?step="+encodeURIComponent(step)+"&cartId="+encodeURIComponent(result.cartId)+(token?"&cartToken="+encodeURIComponent(token):""));
      job.navigated=true;
    } catch(error) {report(error,message);}
    finally {if(!job.navigated&&selectionJob===job) selectionJob=null;}
  })();
  return job.promise;
}
async function receive(event,embed) {
  let message=event?.data;
  if(typeof message==="string"){try{message=JSON.parse(message);}catch(_){return;}}
  if(!message||message.source!==SOURCE||!TYPES.has(message.type)) return;
  const requestId=clean(message.requestId,160);
  if(!requestId || (html && html!==embed)) return;
  if(!html) {
    if(!["COUNTRY_READY","UPDATE_SETTINGS"].includes(message.type)) return;
    html=embed;clearTimeout(discoveryTimer);
    console.info("[Country V12] Bridge attached to #"+clean(embed.id,120)+".");
  }
  message={...message,requestId,payload:obj(message.payload)};
  try {
    switch(message.type) {
      case "COUNTRY_READY": case "UPDATE_SETTINGS": await loadCountry(message); break;
      case "COUNTRY_SEARCH_OFFERS": await search(message); break;
      case "COUNTRY_SELECT_OFFER": await selectOffer(message); break;
      case "COUNTRY_SELECT_COUNTRY": {
        const target=content.byTypeSlug("COUNTRY",message.payload.slug);
        if(!target) throw fail("COUNTRY_NOT_FOUND","Choose a published country.");
        navigate(APP_ROUTES.country+"?country="+encodeURIComponent(slug(target.slug||target.name)));break;
      }
      case "COUNTRY_NAVIGATE": navigate(message.payload.path);break;
      case "RESIZE_IFRAME": {
        const height=Number(message.payload.height);
        if(Number.isFinite(height)&&height>0&&"height" in html) {try{html.height=Math.min(20000,Math.max(680,Math.round(height)));}catch(_){}}
        break;
      }
    }
  } catch(error){report(error,message);}
}
function discover() {
  if(html)return;
  discoveryCount++;
  let elements=[];
  try {
    const found=$w("HtmlComponent");
    elements=Array.isArray(found)?found:found&&(typeof found[Symbol.iterator]==="function"||typeof found.length==="number")?Array.from(found):found?[found]:[];
  } catch(_) {}
  for(const embed of elements) {
    if(!embed||typeof embed.onMessage!=="function"||typeof embed.postMessage!=="function")continue;
    const key=embed.id||embed;if(bound.has(key))continue;
    try{embed.onMessage(event=>receive(event,embed));bound.add(key);}catch(_){continue;}
    try{embed.postMessage({source:PARENT,type:"COUNTRY_HOST_READY",payload:{version:VERSION,embedId:clean(embed.id,120)},requestId:""});}catch(_){}
    if(html)return;
  }
  if(discoveryCount<40)discoveryTimer=setTimeout(discover,500);
  else console.error("[Country V12] No Country READY handshake received. Check the published Country HTML component.");
}
$w.onReady(discover);
