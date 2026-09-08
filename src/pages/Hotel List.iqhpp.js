import wixLocation from "wix-location-frontend";
import { currentMember, authentication } from "wix-members-frontend";
import { getCustomerHeaderSession, subscribeCustomerNewsletter } from "backend/customerHeader.web";
import { session } from "wix-storage";
import { getInventoryHotelBrowsePage } from "backend/FINAL/destinationFlow.web";
import {
  searchUnifiedOffers,
  createBookingCartFromOffer
} from "backend/bookingOrchestratorCollection.web";

const EMBED_ID="#hotelsEmbed";
const CHILD_SOURCE="SKANDI_HOTEL_SEARCH";
const PARENT_SOURCE="SKANDI_WIX_PARENT";
let pageContext=null;

const clean=(v,m=500)=>String(v??"").trim().slice(0,m);
const arr=v=>Array.isArray(v)?v:[];
const obj=v=>v&&typeof v==="object"&&!Array.isArray(v)?v:{};
const first=(...v)=>v.find(x=>x!==undefined&&x!==null&&x!=="")??"";
const slug=v=>clean(v,180).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/&/g," and ").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");
function post(html,type,payload={}){html.postMessage({source:PARENT_SOURCE,type,payload,timestamp:new Date().toISOString()})}
function bridgePost(html,type,data={}){post(html,type,data)}

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
function customerNavigate(path){const p=clean(path,700);if(p&&(p.startsWith("/")||/^https?:\/\//i.test(p)))wixLocation.to(p)}
function parts(){return arr(wixLocation.path).map(x=>decodeURIComponent(String(x)))}
function route(){
  const p=parts(),q=wixLocation.query||{},i=p.indexOf("hotels");
  const after=i>=0?p.slice(i+1):[];
  return {
    countrySlug:slug(first(q.country,after[0])),
    destinationSlug:slug(first(q.destination,q.region,after[1])),
    areaSlug:slug(first(q.area,after.length>=4?after[2]:""))
  };
}
function normalizeSearch(s={}){
  return {
    tripType:"hotelOnly",
    destination:clean(first(s.destination,s.destinationIata,s.searchAirportIata,pageContext?.searchAirportIata,pageContext?.destinationIata,pageContext?.name),160),
    destinationRegion:clean(first(s.destinationRegion,pageContext?.name),160),
    departureDate:clean(first(s.checkInDate,s.departureDate,wixLocation.query.checkIn,wixLocation.query.departureDate),10),
    returnDate:clean(first(s.checkOutDate,s.returnDate,wixLocation.query.checkOut,wixLocation.query.returnDate),10),
    adults:Math.max(1,Number(first(s.adults,wixLocation.query.adults,2))||2),
    children:Math.max(0,Number(first(s.children,wixLocation.query.children,0))||0),
    childAges:arr(s.childAges),
    rooms:Math.max(1,Number(first(s.rooms,wixLocation.query.rooms,1))||1),
    currency:clean(first(s.currency,wixLocation.query.currency,"USD"),3).toUpperCase(),
    language:clean(first(s.language,s.locale,"EN"),12).toUpperCase()
  };
}
function canonicalFor(item={}){
  const hotels=arr(pageContext?.hotels);
  const mid=clean(item.inventoryMasterId||item.hotelInventoryMasterId,100);
  if(mid){const x=hotels.find(h=>h.id===mid||h.inventoryMasterId===mid);if(x)return x}
  const aid=clean(item.accommodationId||item.providerAccommodationId,180);
  if(aid){const x=hotels.find(h=>clean(h.providerAccommodationId,180)===aid);if(x)return x}
  const title=clean(item.title||item.hotelName||item.name,240).toLowerCase();
  return title?hotels.find(h=>clean(h.name,240).toLowerCase()===title)||null:null;
}
function liveHotel(item={}){
  const h=canonicalFor(item)||{};
  return {
    ...h,...item,
    id:clean(first(item.id,item.staySearchResultId,h.id)),
    inventoryMasterId:h.id||item.inventoryMasterId||"",
    publicId:h.publicId||"",
    name:clean(first(h.name,item.title,item.hotelName),240),
    slug:h.slug||"",
    hotelSlug:h.hotelSlug||h.slug||"",
    path:h.path||"",
    image:h.image||h.imageUrl||item.imageUrl||"",
    imageUrl:h.image||h.imageUrl||item.imageUrl||"",
    location:h.location||item.location||pageContext?.name||"",
    standard:Number(h.standard||h.classification||0),
    guestRating:Number(h.guestRating||0),
    beachDistance:Number(h.beachDistance||h.details?.distanceToBeach||0),
    centerDistance:Number(h.centerDistance||h.details?.distanceToCenter||0),
    features:arr(h.features||h.tags||h.facilities),
    price:Number(first(item.total,item.price?.total,item.price?.amount,0))||0,
    currency:clean(first(item.currency,item.price?.currency,"USD"),3).toUpperCase(),
    isLive:true,offer:item
  };
}

$w.onReady(()=>{
  const html=$w(EMBED_ID);
  html.onMessage(async event=>{
    const m=event.data||{},p=m.payload||{};
    if(await handleSharedChrome(html,m,customerNavigate))return;if(m.source!==CHILD_SOURCE)return;
    try{
      if(m.type==="HOTEL_SEARCH_READY"){
        const r={...route(),...p};
        const result=await getInventoryHotelBrowsePage({
          countrySlug:slug(r.countrySlug),destinationSlug:slug(r.destinationSlug),areaSlug:slug(r.areaSlug),
          language:p?.settings?.language||p.language||"EN"
        });
        pageContext=result.page;
        post(html,"HOTEL_SEARCH_PAGE_RESULT",{page:pageContext,source:result.source});
        return;
      }
      if(m.type==="HOTEL_SEARCH_RUN"){
        const search=normalizeSearch(p.search||{});
        const result=await searchUnifiedOffers({search});
        post(html,"HOTEL_SEARCH_RESULTS",{items:arr(result?.items).map(liveHotel),search,supplier:"DUFFEL_STAYS"});
        return;
      }
      if(m.type==="HOTEL_SEARCH_SELECT"){
        const offer=p.offer||p.hotel?.offer||{};
        if(!offer?.id&&!offer?.staySearchResultId)throw new Error("Check live availability before booking this hotel.");
        const search=normalizeSearch(p.search||offer.searchContext||{});
        const cart=await createBookingCartFromOffer({offer,search});
        if(!cart?.cartId)throw new Error("The booking cart could not be created.");
        session.setItem("SKANDI_BOOKING_CART_ID",cart.cartId);
        if(cart.cartToken)session.setItem("SKANDI_BOOKING_CART_TOKEN",cart.cartToken);
        wixLocation.to(`/booking?step=offer&cartId=${encodeURIComponent(cart.cartId)}${cart.cartToken?`&cartToken=${encodeURIComponent(cart.cartToken)}`:""}`);
        return;
      }
      if(m.type==="HOTEL_SEARCH_VIEW_HOTEL"){
        const path=clean(p.path||p.hotel?.path,700);
        if(path.startsWith("/hotels/"))wixLocation.to(path);
        return;
      }
    }catch(error){
      post(html,"HOTEL_SEARCH_ERROR",{message:error?.publicMessage||error?.message||"Hotel data is temporarily unavailable."});
    }
  });
  sendCustomerHeaderState(html).catch(()=>{});
});
