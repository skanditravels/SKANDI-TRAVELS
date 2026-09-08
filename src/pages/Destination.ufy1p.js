import wixLocationFrontend from "wix-location-frontend";
import { currentMember, authentication } from "wix-members-frontend";
import { getCustomerHeaderSession, subscribeCustomerNewsletter } from "backend/customerHeader.web";
import { getInventoryDestinationPage } from "backend/FINAL/destinationFlow.web";
import { searchUnifiedOffers, createBookingCartFromOffer } from "backend/bookingOrchestratorCollection.web";
const HTML_ID="#destinationDetailHtml",HTML_SOURCE="SKANDI_DYNAMIC_DESTINATION_PAGE",PARENT_SOURCE="SKANDI_WIX_PARENT";let currentPage=null;
const obj=v=>v&&typeof v==="object"&&!Array.isArray(v)?v:{},parse=v=>{if(typeof v==="string"){try{return JSON.parse(v)}catch(_){return null}}return obj(v)},clean=v=>String(v||"").trim().toLowerCase().replace(/[^a-z0-9-]/g,"");
function payload(m){return{...obj(m),...obj(m?.payload)}} function send(el,type,data={},requestId=""){el.postMessage({source:PARENT_SOURCE,type,requestId,payload:{...obj(data),requestId},timestamp:new Date().toISOString()})} function bridgePost(el,type,data={}){send(el,type,data)}
function navigate(path){const p=String(path||"").trim();if(p&&(p.startsWith("/")||/^https?:\/\//i.test(p)))wixLocationFrontend.to(p)}

const HEADER_SOURCE="SKANDI_CUSTOMER_HEADER_EXPANDBAR";
const FOOTER_SOURCE="SKANDI_CUSTOMER_FOOTER";
let headerLoadPromise=null;
function guestHeaderState(){return{loggedIn:false,displayName:"",points:0,tierName:"",menu:[]}}
async function sendCustomerHeaderState(html,force=false){
  if(headerLoadPromise&&!force)return headerLoadPromise;
  headerLoadPromise=(async()=>{
    try{
      const member=await currentMember.getMember();
      if(!member){bridgePost(html,"CUSTOMER_HEADER_STATE",guestHeaderState());return}
      const s=await getCustomerHeaderSession();
      bridgePost(html,"CUSTOMER_HEADER_STATE",{loggedIn:true,displayName:s?.displayName||s?.name||s?.member?.displayName||member?.profile?.nickname||member?.profile?.title||member?.loginEmail||"",points:Number(s?.points||s?.clubPoints||s?.rewards?.points||0),tierName:s?.tierName||s?.tier||s?.clubTier||"",menu:Array.isArray(s?.menu)?s.menu:[]});
    }catch(error){console.error("[Customer header]",error);bridgePost(html,"CUSTOMER_HEADER_STATE",guestHeaderState())}
    finally{headerLoadPromise=null}
  })();
  return headerLoadPromise;
}
async function handleSharedChrome(html,m,navigatePath){
  const p=m?.payload||{};
  if(m.source===HEADER_SOURCE){
    if(m.type==="HEADER_READY"){await sendCustomerHeaderState(html);return true}
    if(m.type==="HEADER_NAVIGATE"){navigatePath(m.path||p.path);return true}
    if(m.type==="HEADER_SEARCH"){navigatePath("/search");return true}
    if(m.type==="HEADER_LOGIN"){try{await authentication.promptLogin()}catch(_){ }await sendCustomerHeaderState(html,true);return true}
    if(m.type==="HEADER_LOGOUT"){try{await Promise.resolve(authentication.logout())}catch(_){ }bridgePost(html,"CUSTOMER_HEADER_STATE",guestHeaderState());navigatePath("/home");return true}
    return false;
  }
  if(m.source===FOOTER_SOURCE){
    if(m.type==="FOOTER_READY"){bridgePost(html,"CUSTOMER_FOOTER_STATE",{ready:true});return true}
    if(m.type==="FOOTER_NAVIGATE"){navigatePath(m.path||p.path);return true}
    if(m.type==="FOOTER_STAFF_LOGIN"){navigatePath("/riaintra");return true}
    if(m.type==="FOOTER_NEWSLETTER_SIGNUP"){
      const email=String(m.email||p.email||"").trim();
      if(!email){bridgePost(html,"FOOTER_NEWSLETTER_RESULT",{ok:false,code:"EMAIL_REQUIRED",message:"Please enter your email address."});return true}
      try{const r=await subscribeCustomerNewsletter({email,source:p.source||"Customer Page Footer"});bridgePost(html,"FOOTER_NEWSLETTER_RESULT",{ok:true,message:r?.status==="updated"?"Your subscription is already active.":"Thank you for subscribing.",...(r||{})})}
      catch(error){bridgePost(html,"FOOTER_NEWSLETTER_RESULT",{ok:false,message:error?.message||"Newsletter signup failed."})}
      return true;
    }
  }
  return false;
}

function route(){const p=(Array.isArray(wixLocationFrontend.path)?wixLocationFrontend.path:[]).map(clean).filter(Boolean),i=p.lastIndexOf("destinations");return{countrySlug:p[i+1]||"",destinationSlug:p[i+2]||""}} function bookingUrl(r){const q=new URLSearchParams({step:r?.step||"offer",cartId:String(r?.cartId||"")});if(r?.cartToken)q.set("cartToken",String(r.cartToken));return `/booking?${q}`}
async function load(el,p={},id=""){const q={...route(),...p},r=await getInventoryDestinationPage({countrySlug:clean(q.countrySlug),destinationSlug:clean(q.destinationSlug),language:q.settings?.language||q.language||"EN"});currentPage=r.page;send(el,"DESTINATION_PAGE_RESULT",{page:currentPage,source:r.source},id)}
function liveSearch(raw={}){const s={...obj(raw),tripType:"holiday"};if(!s.destination)s.destination=currentPage?.searchAirportIata||"";s.destinationRegion=s.destinationRegion||currentPage?.name||"";return s}
$w.onReady(()=>{const el=$w(HTML_ID);el.onMessage(async ev=>{const m=parse(ev.data);if(!m)return;try{if(await handleSharedChrome(el,m,navigate))return;if(m.source!==HTML_SOURCE)return;const p=payload(m),id=String(m.requestId||p.requestId||"");if(m.type==="DESTINATION_READY"||m.type==="DESTINATION_REFRESH"){await load(el,p,id);return}if(m.type==="DESTINATION_SEARCH_OFFERS"){const r=await searchUnifiedOffers({search:liveSearch(p.search)});send(el,"DESTINATION_OFFERS_RESULT",{...(r||{}),items:Array.isArray(r?.items)?r.items:[]},id);return}if(m.type==="DESTINATION_SELECT_OFFER"){const offer=obj(p.offer),search=liveSearch(p.search||offer.searchContext||{}),r=await createBookingCartFromOffer({offer,search});if(!r?.cartId)throw new Error("Could not create booking cart.");navigate(bookingUrl(r));return}if(m.type==="DESTINATION_NAVIGATE")navigate(p.path)}catch(e){send(el,"DESTINATION_ERROR",{message:e?.publicMessage||e?.message||"Destination request failed."})}});sendCustomerHeaderState(el).catch(()=>{});setTimeout(()=>load(el).catch(e=>send(el,"DESTINATION_ERROR",{message:e.message})),250)});
