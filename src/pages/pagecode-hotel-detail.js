import wixLocationFrontend from "wix-location-frontend";
import { currentMember, authentication } from "wix-members-frontend";
import { searchUnifiedOffers, createBookingCartFromOffer } from "backend/bookingOrchestrator.web";
import { getCustomerHeaderSession, subscribeCustomerNewsletter } from "backend/customerHeader.web";
import { getHotelDetailPage } from "backend/FINAL/hotelDetailService.web";

/*
 * Primary route:
 * /destinations/{country}/{destination}/{area}/{hotel}
 *
 * Optional alias supported by this parser:
 * /destinations/{country}/{destination}/{area}/hotels/{hotel}
 *
 * HTML Component ID: #hotelDetailHtml
 */
const HTML_ID = "#hotelDetailHtml";
const HOTEL_SOURCE = "SKANDI_HOTEL_DETAIL";
const HEADER_SOURCE = "SKANDI_CUSTOMER_HEADER_EXPANDBAR";
const FOOTER_SOURCE = "SKANDI_CUSTOMER_FOOTER";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";
const LANGUAGES = ["EN","SV","NO","DA","ES","FI","DE","FR-FR","FR-CA","TH"];
const CURRENCIES = ["USD","SEK","NOK","DKK","EUR"];
let settings = { language:"EN", currency:"USD" };
let headerPromise = null;
let pagePromise = null;
let route = { countrySlug:"thailand", destinationSlug:"phuket", areaSlug:"karon", hotelSlug:"beyond-karon" };

function obj(v){return v&&typeof v==="object"&&!Array.isArray(v)?v:{}}
function parse(data){if(typeof data==="string"){try{return JSON.parse(data)}catch(_){return null}}return obj(data)}
function payload(message){return {...obj(message),...obj(message?.payload)}}
function clean(value,fallback){return String(value||fallback).trim().toLowerCase().replace(/[^a-z0-9-]/g,"")||fallback}
function normalizeSettings(value={}){const language=String(value.language||"").toUpperCase(),currency=String(value.currency||"").toUpperCase();return{language:LANGUAGES.includes(language)?language:"EN",currency:CURRENCIES.includes(currency)?currency:"USD"}}
function html(){try{const el=$w(HTML_ID);if(!el||typeof el.onMessage!=="function"||typeof el.postMessage!=="function")throw new Error(`${HTML_ID} is not an HTML Component.`);return el}catch(error){console.error("[Hotel Detail] HTML component missing.",error);return null}}
function send(el,type,payloadData={},requestId=""){el.postMessage({source:PARENT_SOURCE,type,requestId,payload:{...obj(payloadData),requestId},timestamp:new Date().toISOString()})}
function sendError(el,error,requestId=""){send(el,"HOTEL_DETAIL_ERROR",{message:error?.message||"Hotel information is temporarily unavailable."},requestId)}
function closePanels(el){send(el,"CLOSE_CUSTOMER_HEADER_PANELS",{})}
function navigate(el,path){const target=String(path||"").trim();if(!target)return;if(!(target.startsWith("/")||/^https?:\/\//i.test(target)||/^mailto:/i.test(target)||/^tel:/i.test(target))){console.warn("[Hotel Detail] Blocked navigation",target);return}closePanels(el);wixLocationFrontend.to(target)}
function parseRoute(){const parts=(Array.isArray(wixLocationFrontend.path)?wixLocationFrontend.path:[]).map(x=>String(x||"").toLowerCase()).filter(Boolean);const i=parts.lastIndexOf("destinations");if(i>=0&&parts.length>=i+5){const optional=parts[i+4];return{countrySlug:clean(parts[i+1],"thailand"),destinationSlug:clean(parts[i+2],"phuket"),areaSlug:clean(parts[i+3],"karon"),hotelSlug:clean(["hotel","hotels","hotell"].includes(optional)?parts[i+5]:optional,"beyond-karon")}}return route}
function query(){return obj(wixLocationFrontend.query)}
function guest(){return{loggedIn:false,displayName:"",points:0,tierName:"",menu:[]}}
async function memberSafe(){try{return await currentMember.getMember()}catch(_){return null}}
async function sendHeader(el,force=false){if(headerPromise&&!force)return headerPromise;headerPromise=(async()=>{try{const member=await memberSafe();if(!member){send(el,"CUSTOMER_HEADER_STATE",guest());return guest()}const session=await getCustomerHeaderSession();const state={loggedIn:true,displayName:session?.displayName||session?.name||session?.member?.displayName||member?.profile?.nickname||member?.loginEmail||"",points:Number(session?.points||session?.clubPoints||session?.rewards?.points||0),tierName:session?.tierName||session?.tier||session?.clubTier||"",menu:Array.isArray(session?.menu)?session.menu:[]};send(el,"CUSTOMER_HEADER_STATE",state);return state}catch(error){console.error("[Hotel Detail] Header failed.",error);send(el,"CUSTOMER_HEADER_STATE",guest());return guest()}finally{headerPromise=null}})();return headerPromise}
async function loadPage(el,force=false,requestId=""){if(pagePromise&&!force)return pagePromise;pagePromise=(async()=>{try{const result=await getHotelDetailPage({...route,language:settings.language,locale:settings.language,currency:settings.currency,query:query()});send(el,"HOTEL_DETAIL_DATA",result?.page?{page:result.page}:result,requestId);return result}catch(error){console.error("[Hotel Detail] Page load failed.",error);sendError(el,error,requestId);return null}finally{pagePromise=null}})();return pagePromise}
async function login(el){closePanels(el);try{await authentication.promptLogin()}catch(error){console.info("[Hotel Detail] Login cancelled.",error)}await sendHeader(el,true)}
async function logout(el){closePanels(el);try{await Promise.resolve(authentication.logout())}catch(error){console.warn("[Hotel Detail] Logout error.",error)}send(el,"CUSTOMER_HEADER_STATE",guest());wixLocationFrontend.to("/home")}
async function headerMessage(el,message){const p=payload(message);switch(message.type){case"HEADER_READY":await sendHeader(el);return true;case"HEADER_NAVIGATE":navigate(el,p.path);return true;case"HEADER_SEARCH":navigate(el,"/search");return true;case"HEADER_LOGIN":await login(el);return true;case"HEADER_LOGOUT":await logout(el);return true;case"UPDATE_SETTINGS":settings=normalizeSettings(p);await loadPage(el,true);return true;default:return false}}
async function footerMessage(el,message){const p=payload(message);switch(message.type){case"FOOTER_READY":send(el,"CUSTOMER_FOOTER_STATE",{ready:true});return true;case"FOOTER_NAVIGATE":navigate(el,p.path);return true;case"FOOTER_STAFF_LOGIN":navigate(el,"/riaintra");return true;case"FOOTER_NEWSLETTER_SIGNUP":{const email=String(p.email||"").trim();if(!email){send(el,"FOOTER_NEWSLETTER_RESULT",{ok:false,message:"Please enter your email address."});return true}try{const result=await subscribeCustomerNewsletter({email,source:p.source||"Hotel Detail Footer"});send(el,"FOOTER_NEWSLETTER_RESULT",{ok:true,message:result?.status==="updated"?"Your subscription is already active.":"Thank you for subscribing.",...(result||{})})}catch(error){send(el,"FOOTER_NEWSLETTER_RESULT",{ok:false,message:error?.message||"Newsletter signup failed."})}return true}default:return false}}
async function hotelMessage(el,message){const p=payload(message),requestId=String(message.requestId||p.requestId||"");switch(message.type){case"HOTEL_DETAIL_READY":settings=normalizeSettings(p.settings||settings);route=parseRoute();await Promise.all([sendHeader(el),loadPage(el,false,requestId)]);return true;case"HOTEL_DETAIL_REFRESH":await loadPage(el,true,requestId);return true;case"UPDATE_SETTINGS":settings=normalizeSettings(p);await loadPage(el,true,requestId);return true;case"HOTEL_DETAIL_CHECK_AVAILABILITY":{const raw=obj(p.search);const search={...raw,productType:raw.productType||"holiday",accommodationType:"hotel",countrySlug:raw.countrySlug||route.countrySlug,destinationSlug:raw.destinationSlug||route.destinationSlug,areaSlug:raw.areaSlug||route.areaSlug,hotelSlug:raw.hotelSlug||route.hotelSlug,language:settings.language,locale:settings.language,currency:settings.currency};const result=await searchUnifiedOffers({search});const items=(Array.isArray(result?.items)?result.items:[]).filter(item=>{const h=item?.hotel||item?.accommodation||item;const slug=String(h?.slug||h?.hotelSlug||"").toLowerCase();const id=String(h?.id||h?.hotelId||"");if(raw.providerHotelId&&id)return id===String(raw.providerHotelId);if(slug)return slug===route.hotelSlug;return true});send(el,"HOTEL_DETAIL_AVAILABILITY_RESULT",{...(result||{}),items},requestId);return true}case"HOTEL_DETAIL_SELECT_OFFER":{const offer=obj(p.offer),search=obj(p.search);if(!Object.keys(offer).length)throw new Error("A live hotel offer is required before booking.");let result=await createBookingCartFromOffer({offer,search});if(result?.requiresLogin){await login(el);result=await createBookingCartFromOffer({offer,search})}if(result?.requiresLogin)throw new Error(result?.message||"Sign in to continue.");if(!result?.cartId)throw new Error("No booking cart ID was returned.");const allowed=["offer","extras","transfer","apis","seats","payment","confirmation"],step=allowed.includes(result.step)?result.step:"offer";send(el,"HOTEL_DETAIL_SELECTED",result,requestId);navigate(el,`/booking?step=${encodeURIComponent(step)}&cartId=${encodeURIComponent(result.cartId)}`);return true}case"HOTEL_DETAIL_FAVOURITE":if(!(await memberSafe()))await login(el);send(el,"HOTEL_DETAIL_FAVOURITE_RESULT",{ok:true,hotelId:p.hotelId||route.hotelSlug},requestId);return true;case"HOTEL_DETAIL_NAVIGATE":navigate(el,p.path);return true;default:return false}}
$w.onReady(function(){const el=html();if(!el)return;route=parseRoute();el.onMessage(async event=>{const message=parse(event.data);if(!message?.type)return;const requestId=String(message.requestId||message.payload?.requestId||"");try{if(message.source===HOTEL_SOURCE){await hotelMessage(el,message);return}if(message.source===HEADER_SOURCE){await headerMessage(el,message);return}if(message.source===FOOTER_SOURCE){await footerMessage(el,message);return}console.warn("[Hotel Detail] Unknown source",message.source)}catch(error){console.error(`[Hotel Detail] ${message.type} failed.`,error);sendError(el,error,requestId)}});Promise.all([sendHeader(el),loadPage(el)]).catch(error=>sendError(el,error))});
