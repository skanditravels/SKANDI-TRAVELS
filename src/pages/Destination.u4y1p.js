import wixLocationFrontend from "wix-location-frontend";
import { currentMember, authentication } from "wix-members-frontend";
import { getCustomerHeaderSession, subscribeCustomerNewsletter } from "backend/customerHeader.web";
import { getInventoryDestinationPage } from "backend/FINAL/destinationFlow.web";
import { searchUnifiedOffers, createBookingCartFromOffer } from "backend/bookingOrchestratorCollection.web";

const HTML_ID="#destinationDetailHtml";
const HTML_SOURCE="SKANDI_DYNAMIC_DESTINATION_PAGE";
const PARENT_SOURCE="SKANDI_WIX_PARENT";
let currentPage=null;
let pageContext=null;
const clean=(v,m=500)=>String(v??"").trim().slice(0,m);
const slug=v=>clean(v,180).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/&/g," and ").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");
const obj=v=>v&&typeof v==="object"&&!Array.isArray(v)?v:{};
const arr=v=>Array.isArray(v)?v:[];
const first=(...v)=>v.find(x=>x!==undefined&&x!==null&&x!=="")??"";
function parse(v){if(typeof v==="string"){try{return JSON.parse(v)}catch(_){return null}}return obj(v)}
function payload(m){return{...obj(m),...obj(m?.payload)}}
function send(el,type,data={},requestId=""){el.postMessage({source:PARENT_SOURCE,type,requestId,payload:{...obj(data),requestId},timestamp:new Date().toISOString()})}
function bridgePost(el,type,data={}){send(el,type,data)}

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
      bridgePost(html,"CUSTOMER_HEADER_STATE",{
        loggedIn:true,
        displayName:s?.displayName||s?.name||s?.member?.displayName||member?.profile?.nickname||member?.profile?.title||member?.loginEmail||"",
        points:Number(s?.points||s?.clubPoints||s?.rewards?.points||0),
        tierName:s?.tierName||s?.tier||s?.clubTier||"",
        menu:Array.isArray(s?.menu)?s.menu:[]
      });
    }catch(error){
      console.error("[Customer header]",error);
      bridgePost(html,"CUSTOMER_HEADER_STATE",guestHeaderState());
    }finally{headerLoadPromise=null}
  })();
  return headerLoadPromise;
}
async function handleSharedChrome(html,m,navigatePath){
  const p=m?.payload||{};
  if(m.source===HEADER_SOURCE){
    if(m.type==="HEADER_READY"){await sendCustomerHeaderState(html);return true}
    if(m.type==="HEADER_NAVIGATE"){navigatePath(m.path||p.path);return true}
    if(m.type==="HEADER_SEARCH"){navigatePath("/search");return true}
    if(m.type==="HEADER_LOGIN"){
      try{await authentication.promptLogin()}catch(_){}
      await sendCustomerHeaderState(html,true);return true
    }
    if(m.type==="HEADER_LOGOUT"){
      try{await Promise.resolve(authentication.logout())}catch(_){}
      bridgePost(html,"CUSTOMER_HEADER_STATE",guestHeaderState());
      navigatePath("/home");return true
    }
    return false;
  }
  if(m.source===FOOTER_SOURCE){
    if(m.type==="FOOTER_READY"){bridgePost(html,"CUSTOMER_FOOTER_STATE",{ready:true});return true}
    if(m.type==="FOOTER_NAVIGATE"){navigatePath(m.path||p.path);return true}
    if(m.type==="FOOTER_STAFF_LOGIN"){navigatePath("/riaintra");return true}
    if(m.type==="FOOTER_NEWSLETTER_SIGNUP"){
      const email=String(m.email||p.email||"").trim();
      if(!email){
        bridgePost(html,"FOOTER_NEWSLETTER_RESULT",{ok:false,code:"EMAIL_REQUIRED",message:"Please enter your email address."});
        return true;
      }
      try{
        const r=await subscribeCustomerNewsletter({email,source:p.source||"Customer Page Footer"});
        bridgePost(html,"FOOTER_NEWSLETTER_RESULT",{
          ok:true,
          message:r?.status==="updated"?"Your subscription is already active.":"Thank you for subscribing.",
          ...(r||{})
        });
      }catch(error){
        bridgePost(html,"FOOTER_NEWSLETTER_RESULT",{ok:false,message:error?.message||"Newsletter signup failed."});
      }
      return true;
    }
  }
  return false;
}

function routeUrl(base,params={}){
  const q=new URLSearchParams();
  Object.entries(params).forEach(([k,v])=>{
    const x=slug(v);
    if(x)q.set(k,x);
  });
  const s=q.toString();
  return s?`${base}?${s}`:base;
}
function countryUrl(country){return routeUrl("/our-destinations/country",{country})}
function destinationUrl(country,destination){
  return routeUrl("/our-destinations/country/destination",{country,destination});
}
function areaUrl(country,destination,area){
  return routeUrl("/our-destinations/country/destination/area",{country,destination,area});
}
function hotelListUrl(country,destination,area=""){
  return routeUrl("/our-destinations/country/destination/area/hotel-list",{country,destination,area});
}
function hotelDetailUrl(country,destination,area="",hotel="",hotelId=""){
  const q=new URLSearchParams();
  const values={country:slug(country),destination:slug(destination),area:slug(area),hotel:slug(hotel)};
  Object.entries(values).forEach(([k,v])=>{if(v)q.set(k,v)});
  const id=clean(hotelId,120);
  if(id)q.set("hotelId",id);
  return `/hotel-detail?${q.toString()}`;
}
function normalizeInventoryPath(value){
  const input=clean(value,1000);
  if(!input)return "";
  if(/^https?:\/\//i.test(input)||/^mailto:/i.test(input)||/^tel:/i.test(input))return input;
  if(input.startsWith("/our-destinations")||input.startsWith("/hotel-detail"))return input;

  const [rawPath,rawQuery=""]=input.split("?");
  const query=new URLSearchParams(rawQuery);

  if(rawPath==="/destinations"||rawPath==="/destinations/")return "/our-destinations";

  if(rawPath.startsWith("/destinations/")){
    const seg=rawPath.split("/").filter(Boolean).slice(1).map(slug).filter(Boolean);
    const hotelsIndex=seg.indexOf("hotels");
    if(hotelsIndex>=0){
      const country=seg[0]||query.get("country")||"";
      const destination=seg[1]||query.get("destination")||query.get("region")||"";
      const area=hotelsIndex>=3?seg[2]:(query.get("area")||"");
      const hotel=seg[hotelsIndex+1]||query.get("hotel")||"";
      return hotel
        ? hotelDetailUrl(country,destination,area,hotel,query.get("hotelId")||"")
        : hotelListUrl(country,destination,area);
    }
    if(seg.length===1)return countryUrl(seg[0]);
    if(seg.length===2)return destinationUrl(seg[0],seg[1]);
    if(seg.length>=3)return areaUrl(seg[0],seg[1],seg[2]);
  }

  if(rawPath==="/hotels"||rawPath.startsWith("/hotels/")){
    const seg=rawPath.split("/").filter(Boolean).slice(1).map(slug).filter(Boolean);
    const country=slug(query.get("country")||seg[0]||currentPage?.countrySlug||pageContext?.countrySlug||"");
    const destination=slug(query.get("destination")||query.get("region")||seg[1]||currentPage?.destinationSlug||pageContext?.destinationSlug||"");
    let area=slug(query.get("area")||(seg.length>=4?seg[2]:"")||currentPage?.areaSlug||pageContext?.areaSlug||"");
    let hotel=slug(query.get("hotel")||(seg.length>=4?seg[3]:""));
    if(!query.get("area")&&!query.get("hotel")&&seg.length===3){
      const third=slug(seg[2]);
      const hotels=arr(currentPage?.hotels||pageContext?.hotels);
      const isHotel=hotels.some(h=>slug(h?.hotelSlug||h?.slug||h?.name)===third);
      if(isHotel){hotel=third;area=""}else{area=third}
    }
    return hotel
      ? hotelDetailUrl(country,destination,area,hotel,query.get("hotelId")||"")
      : hotelListUrl(country,destination,area);
  }
  return input;
}

function navigate(path){
  const p=normalizeInventoryPath(path);
  if(p&&(p.startsWith("/")||/^https?:\/\//i.test(p)))wixLocationFrontend.to(p);
}
function route(){
  const q=obj(wixLocationFrontend.query);
  return{countrySlug:slug(q.country||q.countrySlug||""),destinationSlug:slug(q.destination||q.destinationSlug||"")};
}
function bookingUrl(r){
  const q=new URLSearchParams({step:r?.step||"offer",cartId:String(r?.cartId||"")});
  if(r?.cartToken)q.set("cartToken",String(r.cartToken));
  return `/booking?${q}`;
}
async function load(el,p={},id=""){
  const base=route();
  const countrySlug=slug(p.countrySlug||base.countrySlug);
  const destinationSlug=slug(p.destinationSlug||p.slug||base.destinationSlug);
  if(!countrySlug||!destinationSlug)throw new Error("Missing country or destination in page URL.");
  const r=await getInventoryDestinationPage({
    countrySlug,destinationSlug,
    language:p.settings?.language||p.language||"EN"
  });
  currentPage=r.page;
  send(el,"DESTINATION_PAGE_RESULT",{page:currentPage,source:r.source},id);
}
function liveSearch(raw={}){
  const s={...obj(raw),tripType:"holiday"};
  if(!s.destination)s.destination=currentPage?.searchAirportIata||"";
  s.destinationRegion=s.destinationRegion||currentPage?.name||"";
  return s;
}
$w.onReady(()=>{
  const el=$w(HTML_ID);
  el.onMessage(async ev=>{
    const m=parse(ev.data);
    if(!m)return;
    try{
      if(await handleSharedChrome(el,m,navigate))return;
      if(m.source!==HTML_SOURCE)return;
      const p=payload(m),id=String(m.requestId||p.requestId||"");
      if(m.type==="DESTINATION_READY"||m.type==="DESTINATION_REFRESH"){await load(el,p,id);return}
      if(m.type==="DESTINATION_SEARCH_OFFERS"){
        const r=await searchUnifiedOffers({search:liveSearch(p.search)});
        send(el,"DESTINATION_OFFERS_RESULT",{...(r||{}),items:Array.isArray(r?.items)?r.items:[]},id);return;
      }
      if(m.type==="DESTINATION_SELECT_OFFER"){
        const offer=obj(p.offer),search=liveSearch(p.search||offer.searchContext||{});
        const r=await createBookingCartFromOffer({offer,search});
        if(!r?.cartId)throw new Error("Could not create booking cart.");
        navigate(bookingUrl(r));return;
      }
      if(m.type==="DESTINATION_NAVIGATE")navigate(p.path);
    }catch(e){send(el,"DESTINATION_ERROR",{message:e?.publicMessage||e?.message||"Destination request failed."})}
  });
  sendCustomerHeaderState(el).catch(()=>{});
  setTimeout(()=>load(el).catch(e=>send(el,"DESTINATION_ERROR",{message:e.message})),300);
});
