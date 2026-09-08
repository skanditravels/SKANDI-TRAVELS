import wixLocation from "wix-location-frontend";
import { currentMember, authentication } from "wix-members-frontend";
import { getCustomerHeaderSession, subscribeCustomerNewsletter } from "backend/customerHeader.web";
import { session } from "wix-storage";
import { getInventoryHotelPage } from "backend/FINAL/destinationFlow.web";
import {
  searchUnifiedOffers,
  createBookingCartFromOffer,
  searchCollectionHotelStays
} from "backend/bookingOrchestratorCollection.web";

const EMBED_ID="#hotelDetailEmbed";
const CHILD_SOURCE="SKANDI_HOTEL_DETAIL";
const PARENT_SOURCE="SKANDI_WIX_PARENT";
let hotelPage=null;

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
  const p=parts(),i=p.indexOf("hotels"),after=i>=0?p.slice(i+1):p;
  return {
    countrySlug:slug(after[0]||wixLocation.query.country),
    destinationSlug:slug(after[1]||wixLocation.query.destination),
    areaSlug:after.length>=4?slug(after[2]||wixLocation.query.area):slug(wixLocation.query.area),
    hotelSlug:slug(after[after.length-1]||wixLocation.query.hotel)
  };
}
function addDays(date,days){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(clean(date,10)))return "";
  return new Date(Date.parse(`${date}T00:00:00Z`)+Math.max(1,Number(days)||1)*86400000).toISOString().slice(0,10);
}
function searchOf(p={}){
  const departureDate=clean(first(p.checkInDate,p.departureDate,wixLocation.query.checkIn,wixLocation.query.departureDate,wixLocation.query.QueryDepDate),10);
  const nights=Math.max(1,Number(first(p.nights,p.duration,wixLocation.query.nights,wixLocation.query.QueryDur,8))||8);
  const returnDate=clean(first(p.checkOutDate,p.returnDate,wixLocation.query.checkOut,wixLocation.query.returnDate),10)||addDays(departureDate,nights);
  return {
    tripType:"hotelOnly",
    destination:clean(first(p.destination,p.destinationIata,p.destinationCode,hotelPage?.searchAirportIata,hotelPage?.destinationName),160),
    destinationRegion:clean(first(p.destinationRegion,hotelPage?.destinationName),160),
    departureDate,returnDate,
    adults:Math.max(1,Number(first(p.adults,p.travelers,wixLocation.query.adults,2))||2),
    children:Math.max(0,Number(first(p.children,wixLocation.query.children,0))||0),
    childAges:arr(p.childAges),rooms:Math.max(1,Number(first(p.rooms,wixLocation.query.rooms,1))||1),
    currency:clean(first(p.currency,wixLocation.query.currency,"USD"),3).toUpperCase(),
    language:clean(first(p.language,p.locale,"EN"),12).toUpperCase()
  };
}
function sameHotel(item={}){
  const aid=clean(hotelPage?.providerAccommodationId,180);
  if(aid&&clean(item.accommodationId,180)===aid)return true;
  if(item.inventoryMasterId&&item.inventoryMasterId===hotelPage?.id)return true;
  return clean(item.title||item.name,240).toLowerCase()===clean(hotelPage?.name,240).toLowerCase();
}

$w.onReady(()=>{
  const html=$w(EMBED_ID);
  html.onMessage(async event=>{
    const m=event.data||{},p=m.payload||{};
    if(await handleSharedChrome(html,m,customerNavigate))return;if(m.source!==CHILD_SOURCE)return;
    try{
      if(m.type==="HOTEL_DETAIL_READY"){
        const r=route();
        const result=await getInventoryHotelPage({...r,language:p?.settings?.language||"EN"});
        hotelPage=result.page;
        hotelPage.selection={
          origin:clean(wixLocation.query.origin,100),
          departureDate:clean(first(wixLocation.query.QueryDepDate,wixLocation.query.departureDate),10),
          duration:Number(first(wixLocation.query.QueryDur,wixLocation.query.nights,8))||8,
          travelers:Number(first(wixLocation.query.adults,2))||2,
          meal:clean(first(wixLocation.query.SelectedMeals,"noselection"),80),
          roomKey:clean(wixLocation.query.RoomKey,160)
        };
        post(html,"HOTEL_DETAIL_DATA",{page:hotelPage,source:result.source,supplier:"DUFFEL_STAYS"});
        return;
      }
      if(m.type==="HOTEL_DETAIL_CHECK_AVAILABILITY"){
        if(!hotelPage)throw new Error("Hotel information is not loaded yet.");
        const search=searchOf(p.search||p);
        let items=[];
        if(hotelPage.providerAccommodationId){
          const r=await searchCollectionHotelStays({
            inventoryMasterId:hotelPage.id,accommodationId:hotelPage.providerAccommodationId,
            checkInDate:search.departureDate,checkOutDate:search.returnDate,
            adults:search.adults,children:search.children,childAges:search.childAges,rooms:search.rooms,fetchRates:true
          });
          items=arr(r?.items);
        }else{
          const r=await searchUnifiedOffers({search});
          items=arr(r?.items).filter(sameHotel);
        }
        post(html,"HOTEL_DETAIL_AVAILABILITY_RESULT",{items,search,supplier:"DUFFEL_STAYS"});
        return;
      }
      if(m.type==="HOTEL_DETAIL_SELECT_OFFER"){
        const offer=p.offer||{};
        if(!offer?.id&&!offer?.staySearchResultId)throw new Error("Select a live hotel rate first.");
        const search=searchOf(p.search||offer.searchContext||{});
        const cart=await createBookingCartFromOffer({offer,search});
        if(!cart?.cartId)throw new Error("The booking cart could not be created.");
        session.setItem("SKANDI_BOOKING_CART_ID",cart.cartId);
        if(cart.cartToken)session.setItem("SKANDI_BOOKING_CART_TOKEN",cart.cartToken);
        wixLocation.to(`/booking?step=offer&cartId=${encodeURIComponent(cart.cartId)}${cart.cartToken?`&cartToken=${encodeURIComponent(cart.cartToken)}`:""}`);
        return;
      }
    }catch(error){
      post(html,"HOTEL_DETAIL_ERROR",{message:error?.publicMessage||error?.message||"Hotel information is temporarily unavailable."});
    }
  });
  sendCustomerHeaderState(html).catch(()=>{});
});
