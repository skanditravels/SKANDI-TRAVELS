import wixLocationFrontend from "wix-location-frontend";
import { getHotelDetailPage } from "backend/destinationInventory.web";
import { searchUnifiedOffers, createBookingCartFromOffer } from "backend/bookingOrchestrator.web";
const HTML_ID="#hotelDetailHtml",HTML_SOURCE="SKANDI_HOTEL_DETAIL",PARENT_SOURCE="SKANDI_WIX_PARENT";let currentPage=null;

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

function route(){const p=(Array.isArray(wixLocationFrontend.path)?wixLocationFrontend.path:[]).map(clean).filter(Boolean),i=p.lastIndexOf("destinations");let h=p[i+4]||"";if(["hotel","hotels","hotell"].includes(h))h=p[i+5]||"";return{countrySlug:p[i+1]||"",destinationSlug:p[i+2]||"",areaSlug:p[i+3]||"",hotelSlug:h}}
async function load(el,p={},id=""){const r={...route(),...obj(p.query),...p};const result=await getHotelDetailPage({...r,language:p.settings?.language||p.language||"EN",currency:p.settings?.currency||p.currency||"USD"});currentPage=result.page;send(el,"HOTEL_DETAIL_DATA",{page:currentPage},id)}
function staySearch(raw={}){const s={...obj(raw),tripType:"hotelOnly",productType:"hotelOnly"};s.destination=s.destination||currentPage?.searchAirportIata||currentPage?.destinationIata||currentPage?.destinationName||"";s.destinationRegion=s.destinationRegion||currentPage?.areaName||currentPage?.destinationName||"";return s}
function onlyThisHotel(items){const wanted=String(currentPage?.providerAccommodationId||"");if(!wanted)return items;return items.filter(item=>String(item.accommodationId||item.hotel?.id||"")===wanted)}
$w.onReady(()=>{let el;try{el=$w(HTML_ID)}catch(e){console.error(e);return}el.onMessage(async ev=>{const m=parse(ev.data);if(!m||m.source!==HTML_SOURCE)return;const p=payload(m),id=String(m.requestId||p.requestId||"");try{if(m.type==="HOTEL_DETAIL_READY"||m.type==="HOTEL_DETAIL_REFRESH"){await load(el,p,id);return}if(m.type==="HOTEL_DETAIL_CHECK_AVAILABILITY"){const r=await searchUnifiedOffers({search:staySearch(p.search)});const items=onlyThisHotel(Array.isArray(r?.items)?r.items:[]);send(el,"HOTEL_DETAIL_AVAILABILITY_RESULT",{...(r||{}),items},id);return}if(m.type==="HOTEL_DETAIL_SELECT_OFFER"){const offer=obj(p.offer);const r=await chooseOffer(offer,staySearch(p.search||offer.searchContext));send(el,"HOTEL_DETAIL_SELECTED",r,id);return}if(m.type==="HOTEL_DETAIL_NAVIGATE")navigate(p.path)}catch(e){send(el,"HOTEL_DETAIL_ERROR",{message:e?.message||"Hotel request failed."},id)}});load(el).catch(e=>send(el,"HOTEL_DETAIL_ERROR",{message:e.message}))});
