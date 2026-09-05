import wixLocationFrontend from "wix-location-frontend";
import { getCountryDestinationPage } from "backend/destinationInventory.web";
import { searchUnifiedOffers, createBookingCartFromOffer } from "backend/bookingOrchestrator.web";

const HTML_ID="#countryDestinationHtml";
const HTML_SOURCE="SKANDI_DYNAMIC_COUNTRY_PAGE";
const PARENT_SOURCE="SKANDI_WIX_PARENT";
let currentPage=null;

function obj(v){return v&&typeof v==="object"&&!Array.isArray(v)?v:{}}
function parse(v){if(typeof v==="string"){try{return JSON.parse(v)}catch(_){return null}}return obj(v)}
function payload(m){return {...obj(m),...obj(m?.payload)}}
function send(el,type,data={},requestId=""){el.postMessage({source:PARENT_SOURCE,type,requestId,payload:{...obj(data),requestId},timestamp:new Date().toISOString()})}
function clean(v){return String(v||"").trim().toLowerCase().replace(/[^a-z0-9-]/g,"")}
function query(){return obj(wixLocationFrontend.query)}
function allowedPath(path){return path.startsWith("/")||/^https?:\/\//i.test(path)||/^mailto:/i.test(path)||/^tel:/i.test(path)}
function navigate(path){const target=String(path||"").trim();if(target&&allowedPath(target))wixLocationFrontend.to(target)}
function accessUrl(result){const allowed=["offer","extras","transfer","apis","seats","payment","confirmation"];const step=allowed.includes(result?.step)?result.step:"offer";const q=new URLSearchParams({step,cartId:String(result?.cartId||"")});if(result?.cartToken)q.set("cartToken",String(result.cartToken));return `/booking?${q.toString()}`}
async function chooseOffer(offer,search){let result=await createBookingCartFromOffer({offer,search});if(!result?.cartId)throw new Error(result?.message||"Could not create booking cart.");navigate(accessUrl(result));return result}

function routeSlug(){const p=Array.isArray(wixLocationFrontend.path)?wixLocationFrontend.path:[];return clean(p[p.length-1]||"")}
async function load(el,p={},requestId=""){const result=await getCountryDestinationPage({slug:clean(p.slug)||routeSlug(),language:p.settings?.language||p.language||"EN",currency:p.settings?.currency||p.currency||"USD"});currentPage=result.page;send(el,"COUNTRY_PAGE_RESULT",{page:currentPage},requestId)}
function liveSearch(raw={},destinationIata=""){const s={...obj(raw),tripType:"holiday"};if(!s.destination)s.destination=destinationIata||currentPage?.searchAirportIata||currentPage?.destinationIata||"";if(!s.destinationRegion)s.destinationRegion=currentPage?.name||"";return s}
async function searchCountry(raw={}){
  const airports=[...new Set((currentPage?.destinations||[]).map(x=>x.searchAirportIata||x.destinationIata).filter(x=>/^[A-Z]{3}$/.test(String(x||"").toUpperCase())))].slice(0,6);
  if(!airports.length){
    const one=liveSearch(raw);
    if(!/^[A-Z]{3}$/.test(String(one.destination||"").toUpperCase()))throw new Error("Add a Search Airport IATA to at least one published destination in Inventory Control.");
    return searchUnifiedOffers({search:one});
  }
  const results=await Promise.all(airports.map(iata=>searchUnifiedOffers({search:liveSearch(raw,String(iata).toUpperCase())}).catch(()=>({items:[]}))));
  const items=results.flatMap(r=>Array.isArray(r?.items)?r.items:[]).sort((a,b)=>Number(a.total||a.price?.amount||0)-Number(b.total||b.price?.amount||0)).slice(0,30);
  return {ok:true,provider:"SKANDI",mode:"holiday",items};
}
$w.onReady(function(){let el;try{el=$w(HTML_ID)}catch(e){console.error(e);return}el.onMessage(async event=>{const m=parse(event.data);if(!m||m.source!==HTML_SOURCE)return;const p=payload(m),id=String(m.requestId||p.requestId||"");try{if(m.type==="COUNTRY_READY"||m.type==="COUNTRY_REFRESH"){await load(el,p,id);return}if(m.type==="COUNTRY_SELECT_COUNTRY"){navigate(`/destinations/${clean(p.slug)}`);return}if(m.type==="COUNTRY_SEARCH_OFFERS"){const result=await searchCountry(p.search);send(el,"COUNTRY_OFFERS_RESULT",{...(result||{}),items:Array.isArray(result?.items)?result.items:[]},id);return}if(m.type==="COUNTRY_SELECT_OFFER"){const result=await chooseOffer(obj(p.offer),liveSearch(p.search||p.searchContext||p.offer?.searchContext));send(el,"COUNTRY_OFFER_SELECTED",result,id);return}if(m.type==="COUNTRY_NAVIGATE")navigate(p.path)}catch(error){console.error("[Country]",error);send(el,"COUNTRY_ERROR",{message:error?.message||"Country page request failed."},id)}});load(el,{slug:routeSlug()}).catch(e=>send(el,"COUNTRY_ERROR",{message:e.message}))});
