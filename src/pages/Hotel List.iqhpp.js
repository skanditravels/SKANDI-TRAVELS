import wixLocationFrontend from "wix-location-frontend";
import { getAreaHotelSearchPage } from "backend/destinationInventory.web";
import { searchUnifiedOffers, createBookingCartFromOffer } from "backend/bookingOrchestrator.web";
const HTML_ID="#areaHotelsHtml",HTML_SOURCE="SKANDI_AREA_HOTEL_SEARCH",PARENT_SOURCE="SKANDI_WIX_PARENT";let currentPage=null;

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

function route(){const p=(Array.isArray(wixLocationFrontend.path)?wixLocationFrontend.path:[]).map(clean).filter(Boolean),i=p.lastIndexOf("destinations");return{countrySlug:p[i+1]||"",destinationSlug:p[i+2]||"",areaSlug:p[i+3]||""}}
async function load(el,p={},id=""){const r={...route(),...p};const result=await getAreaHotelSearchPage({countrySlug:clean(r.countrySlug),destinationSlug:clean(r.destinationSlug),areaSlug:clean(r.areaSlug),language:r.settings?.language||r.language||"EN",currency:r.settings?.currency||r.currency||"USD"});currentPage=result.page;send(el,"HOTEL_SEARCH_PAGE_RESULT",{page:currentPage},id)}
function staySearch(raw={}){const s={...obj(raw),tripType:"hotelOnly",productType:"hotelOnly"};s.destination=s.destination||currentPage?.searchAirportIata||currentPage?.destinationIata||currentPage?.destinationName||"";s.destinationRegion=s.destinationRegion||currentPage?.name||currentPage?.destinationName||"";return s}
$w.onReady(()=>{let el;try{el=$w(HTML_ID)}catch(e){console.error(e);return}el.onMessage(async ev=>{const m=parse(ev.data);if(!m||m.source!==HTML_SOURCE)return;const p=payload(m),id=String(m.requestId||p.requestId||"");try{if(m.type==="HOTEL_SEARCH_READY"||m.type==="HOTEL_SEARCH_REFRESH"){await load(el,p,id);return}if(m.type==="HOTEL_SEARCH_RUN"){const r=await searchUnifiedOffers({search:staySearch(p.search)});send(el,"HOTEL_SEARCH_RESULTS",{...(r||{}),items:Array.isArray(r?.items)?r.items:[]},id);return}if(m.type==="HOTEL_SEARCH_SELECT"){const offer=obj(p.offer||p.hotel?.offer||p.hotel);const r=await chooseOffer(offer,staySearch(p.search||offer.searchContext));send(el,"HOTEL_SEARCH_SELECTED",r,id);return}if(m.type==="HOTEL_SEARCH_VIEW_HOTEL"){navigate(p.path||p.hotel?.path);return}if(m.type==="HOTEL_SEARCH_NAVIGATE")navigate(p.path)}catch(e){send(el,"HOTEL_SEARCH_ERROR",{message:e?.message||"Hotel search failed."},id)}});load(el).catch(e=>send(el,"HOTEL_SEARCH_ERROR",{message:e.message}))});
