import wixLocationFrontend from "wix-location-frontend";
import { currentMember, authentication } from "wix-members-frontend";
import { searchUnifiedOffers, createBookingCartFromOffer } from "backend/bookingOrchestrator.web";
import { getCustomerHeaderSession, subscribeCustomerNewsletter } from "backend/customerHeader.web";
import { getCountryDestinationPage } from "backend/FINAL/countryDestinationService.web";

/*
 * Wix dynamic route: /destinations/{country}
 * HTML Component ID: #countryDestinationHtml
 */
const HTML_ID = "#countryDestinationHtml";
const COUNTRY_SOURCE = "SKANDI_DYNAMIC_COUNTRY_PAGE";
const HEADER_SOURCE = "SKANDI_CUSTOMER_HEADER_EXPANDBAR";
const FOOTER_SOURCE = "SKANDI_CUSTOMER_FOOTER";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";

const LANGUAGES = ["EN","SV","NO","DA","ES","FI","DE","FR-FR","FR-CA","TH"];
const CURRENCIES = ["USD","SEK","NOK","DKK","EUR"];
let settings = { language:"EN", currency:"USD" };
let currentSlug = "thailand";
let headerPromise = null;
let pagePromise = null;

const asObject = value => value && typeof value === "object" && !Array.isArray(value) ? value : {};
function parseMessage(data){ if(typeof data === "string"){ try{return JSON.parse(data);}catch(error){console.warn("[Country] Invalid JSON message.",error);return null;} } return asObject(data); }
function payloadOf(message){ return {...asObject(message),...asObject(message?.payload)}; }
function normalizeSettings(value={}){ const language=String(value.language||"").toUpperCase(); const currency=String(value.currency||"").toUpperCase(); return {language:LANGUAGES.includes(language)?language:"EN",currency:CURRENCIES.includes(currency)?currency:"USD"}; }
function htmlComponent(){ try{const html=$w(HTML_ID); if(!html||typeof html.onMessage!=="function"||typeof html.postMessage!=="function") throw new Error(`${HTML_ID} is not an HTML Component.`); return html;}catch(error){console.error("[Country] HTML component unavailable.",error);return null;} }
function send(html,type,payload={},requestId=""){ html.postMessage({source:PARENT_SOURCE,type,requestId,payload:{...asObject(payload),requestId},timestamp:new Date().toISOString()}); }
function errorToHtml(html,error,requestId=""){ send(html,"COUNTRY_ERROR",{message:error?.message||"The country page could not be loaded."},requestId); }
function closePanels(html){ send(html,"CLOSE_CUSTOMER_HEADER_PANELS",{}); }
function navigate(html,path){ const target=String(path||"").trim(); if(!target)return; if(!(target.startsWith("/")||/^https?:\/\//i.test(target)||/^mailto:/i.test(target)||/^tel:/i.test(target))){console.warn(`[Country] Blocked navigation: ${target}`);return;} closePanels(html); wixLocationFrontend.to(target); }
function routeSlug(){ const path=Array.isArray(wixLocationFrontend.path)?wixLocationFrontend.path:[]; const last=String(path[path.length-1]||"").trim().toLowerCase(); return last && last!=="destinations" ? decodeURIComponent(last) : "thailand"; }
function guestHeader(){ return {loggedIn:false,displayName:"",points:0,tierName:"",menu:[]}; }

async function memberSafe(){ try{return await currentMember.getMember();}catch(_){return null;} }
async function sendHeader(html,force=false){ if(headerPromise&&!force)return headerPromise; headerPromise=(async()=>{try{const member=await memberSafe(); if(!member){const guest=guestHeader();send(html,"CUSTOMER_HEADER_STATE",guest);return guest;} const session=await getCustomerHeaderSession(); const contact=asObject(member.contactDetails); const profile=asObject(member.profile); const state={loggedIn:true,displayName:session?.displayName||session?.name||session?.member?.displayName||profile.nickname||[contact.firstName,contact.lastName].filter(Boolean).join(" ")||member.loginEmail||"",points:Number(session?.points||session?.clubPoints||session?.rewards?.points||0),tierName:session?.tierName||session?.tier||session?.clubTier||"",menu:Array.isArray(session?.menu)?session.menu:[]}; send(html,"CUSTOMER_HEADER_STATE",state);return state;}catch(error){console.error("[Country] Header state failed.",error);const guest=guestHeader();send(html,"CUSTOMER_HEADER_STATE",guest);return guest;}finally{headerPromise=null;}})(); return headerPromise; }

async function loadCountry(html,slug=currentSlug,force=false,requestId=""){ currentSlug=String(slug||routeSlug()).trim().toLowerCase()||"thailand"; settings=normalizeSettings(settings); if(pagePromise&&!force)return pagePromise; pagePromise=(async()=>{try{const result=await getCountryDestinationPage({slug:currentSlug,language:settings.language,locale:settings.language,currency:settings.currency}); if(result?.clientFallback){send(html,"COUNTRY_CLIENT_FALLBACK",{slug:result.slug||currentSlug},requestId);return result;} if(!result?.page&&!result?.slug) throw new Error("No published country content was returned."); send(html,"COUNTRY_PAGE_RESULT",{page:result.page||result},requestId); return result;}catch(error){console.error(`[Country] Failed to load ${currentSlug}.`,error);errorToHtml(html,error,requestId);return null;}finally{pagePromise=null;}})(); return pagePromise; }

async function login(html){ closePanels(html); try{await authentication.promptLogin();}catch(error){console.info("[Country] Login cancelled.",error);} await sendHeader(html,true); }
async function logout(html){ closePanels(html); try{await Promise.resolve(authentication.logout());}catch(error){console.warn("[Country] Logout error.",error);} send(html,"CUSTOMER_HEADER_STATE",guestHeader()); wixLocationFrontend.to("/home"); }

async function handleHeader(html,message){ const p=payloadOf(message); switch(message.type){case "HEADER_READY":await sendHeader(html);return true;case "HEADER_NAVIGATE":navigate(html,p.path);return true;case "HEADER_SEARCH":send(html,"COUNTRY_FOCUS_SEARCH",{});return true;case "HEADER_LOGIN":await login(html);return true;case "HEADER_LOGOUT":await logout(html);return true;case "UPDATE_SETTINGS":settings=normalizeSettings(p);await loadCountry(html,currentSlug,true);return true;default:return false;} }
async function handleFooter(html,message){ const p=payloadOf(message); switch(message.type){case "FOOTER_READY":send(html,"CUSTOMER_FOOTER_STATE",{ready:true});return true;case "FOOTER_NAVIGATE":navigate(html,p.path);return true;case "FOOTER_STAFF_LOGIN":navigate(html,"/riaintra");return true;case "FOOTER_NEWSLETTER_SIGNUP":{const email=String(p.email||"").trim();if(!email){send(html,"FOOTER_NEWSLETTER_RESULT",{ok:false,code:"EMAIL_REQUIRED",message:"Please enter your email address."});return true;}try{const result=await subscribeCustomerNewsletter({email,source:p.source||"Country Footer"});send(html,"FOOTER_NEWSLETTER_RESULT",{ok:true,code:result?.status==="updated"?"ALREADY_ACTIVE":"SUBSCRIBED",message:result?.status==="updated"?"Your subscription is already active.":"Thank you for subscribing.",...(result||{})});}catch(error){send(html,"FOOTER_NEWSLETTER_RESULT",{ok:false,code:"SIGNUP_FAILED",message:error?.message||"Newsletter signup failed."});}return true;}default:return false;} }

async function handleCountry(html,message){ const p=payloadOf(message),requestId=String(message.requestId||p.requestId||""); switch(message.type){
  case "COUNTRY_READY": settings=normalizeSettings(p.settings||settings); currentSlug=String(p.slug||routeSlug()).toLowerCase(); await Promise.all([sendHeader(html),loadCountry(html,currentSlug,false,requestId)]); return true;
  case "COUNTRY_SELECT_COUNTRY": {const slug=String(p.slug||"").trim().toLowerCase(); if(!slug)return true; navigate(html,`/destinations/${encodeURIComponent(slug)}`); return true;}
  case "COUNTRY_REFRESH": await loadCountry(html,currentSlug,true,requestId); return true;
  case "UPDATE_SETTINGS": settings=normalizeSettings(p); await loadCountry(html,currentSlug,true,requestId); return true;
  case "COUNTRY_SEARCH_OFFERS": {const raw=asObject(p.search); const search={...raw,productType:raw.productType||"holiday",destinationCountry:raw.destinationCountry||p.countryCode||"",destinationSlug:raw.destinationSlug||p.countrySlug||currentSlug,language:settings.language,locale:settings.language,currency:settings.currency}; const result=await searchUnifiedOffers({search}); send(html,"COUNTRY_OFFERS_RESULT",{...(result||{}),items:Array.isArray(result?.items)?result.items:[]},requestId); return true;}
  case "COUNTRY_SELECT_OFFER": {const offer=asObject(p.offer);const search=asObject(p.search||p.searchContext||offer.searchContext);let result=await createBookingCartFromOffer({offer,search:{...search,language:settings.language,currency:settings.currency}});if(result?.requiresLogin){await login(html);result=await createBookingCartFromOffer({offer,search:{...search,language:settings.language,currency:settings.currency}});}if(result?.requiresLogin)throw new Error(result?.message||"Sign in to continue.");if(!result?.cartId)throw new Error("No booking cart ID was returned.");const allowed=["offer","extras","transfer","apis","seats","payment","confirmation"];const step=allowed.includes(result.step)?result.step:"offer";send(html,"COUNTRY_OFFER_SELECTED",result,requestId);navigate(html,`/booking?step=${encodeURIComponent(step)}&cartId=${encodeURIComponent(result.cartId)}`);return true;}
  case "COUNTRY_NAVIGATE": navigate(html,p.path); return true;
  default:return false;
} }

$w.onReady(function(){ const html=htmlComponent(); if(!html)return; currentSlug=routeSlug(); html.onMessage(async event=>{const message=parseMessage(event.data);if(!message?.type)return;const requestId=String(message.requestId||message.payload?.requestId||"");try{if(message.source===COUNTRY_SOURCE){await handleCountry(html,message);return;}if(message.source===HEADER_SOURCE){await handleHeader(html,message);return;}if(message.source===FOOTER_SOURCE){await handleFooter(html,message);return;}console.warn(`[Country] Unknown source: ${message.source||"none"}`);}catch(error){console.error(`[Country] ${message.type} failed.`,error);errorToHtml(html,error,requestId);}}); Promise.all([sendHeader(html),loadCountry(html,currentSlug)]).catch(error=>errorToHtml(html,error)); });
