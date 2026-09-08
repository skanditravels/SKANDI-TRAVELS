import wixLocationFrontend from "wix-location-frontend";
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
let pageContext=null;
let currentPage=null;

const clean=(v,m=500)=>String(v??"").trim().slice(0,m);
const slug=v=>clean(v,180).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/&/g," and ").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");
const obj=v=>v&&typeof v==="object"&&!Array.isArray(v)?v:{};
const arr=v=>Array.isArray(v)?v:[];
const first=(...v)=>v.find(x=>x!==undefined&&x!==null&&x!=="")??"";
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

function customerNavigate(path){
  const p=normalizeInventoryPath(path);
  if(p&&(p.startsWith("/")||/^https?:\/\//i.test(p)))wixLocationFrontend.to(p);
}
function route(){
  const q=obj(wixLocationFrontend.query);
  return{
    countrySlug:slug(q.country||q.countrySlug||""),
    destinationSlug:slug(q.destination||q.destinationSlug||""),
    areaSlug:slug(q.area||q.areaSlug||""),
    hotelSlug:slug(q.hotel||q.hotelSlug||""),
    hotelId:clean(q.hotelId||q.inventoryMasterId||"",120)
  };
}
function addDays(date,days){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(clean(date,10)))return "";
  return new Date(Date.parse(`${date}T00:00:00Z`)+Math.max(1,Number(days)||1)*86400000).toISOString().slice(0,10);
}
function searchOf(p={}){
  const q=obj(wixLocationFrontend.query);
  const departureDate=clean(first(p.checkInDate,p.departureDate,q.checkIn,q.departureDate,q.QueryDepDate),10);
  const nights=Math.max(1,Number(first(p.nights,p.duration,q.nights,q.QueryDur,8))||8);
  const returnDate=clean(first(p.checkOutDate,p.returnDate,q.checkOut,q.returnDate),10)||addDays(departureDate,nights);
  return{
    tripType:"hotelOnly",
    destination:clean(first(p.destination,p.destinationIata,p.destinationCode,hotelPage?.searchAirportIata,hotelPage?.destinationName),160),
    destinationRegion:clean(first(p.destinationRegion,hotelPage?.destinationName),160),
    departureDate,returnDate,
    adults:Math.max(1,Number(first(p.adults,p.travelers,q.adults,2))||2),
    children:Math.max(0,Number(first(p.children,q.children,0))||0),
    childAges:arr(p.childAges),
    rooms:Math.max(1,Number(first(p.rooms,q.rooms,1))||1),
    currency:clean(first(p.currency,q.currency,"USD"),3).toUpperCase(),
    language:clean(first(p.language,p.locale,"EN"),12).toUpperCase()
  };
}
function sameHotel(item={}){
  const aid=clean(hotelPage?.providerAccommodationId,180);
  if(aid&&clean(item.accommodationId,180)===aid)return true;
  if(item.inventoryMasterId&&item.inventoryMasterId===hotelPage?.id)return true;
  return clean(item.title||item.name,240).toLowerCase()===clean(hotelPage?.name,240).toLowerCase();
}
async function loadHotel(html,p={}){
  const r=route();
  const hotelSlug=slug(p.hotelSlug||p.slug||r.hotelSlug);
  const hotelId=clean(p.hotelId||p.inventoryMasterId||r.hotelId,120);
  if(!hotelSlug&&!hotelId)throw new Error("Missing hotel in Hotel Detail page URL.");
  const result=await getInventoryHotelPage({
    hotelSlug,hotelId,
    countrySlug:slug(p.countrySlug||r.countrySlug),
    destinationSlug:slug(p.destinationSlug||r.destinationSlug),
    areaSlug:slug(p.areaSlug||r.areaSlug),
    language:p?.settings?.language||p.language||"EN"
  });
  hotelPage=result.page;
  pageContext=hotelPage;
  currentPage=hotelPage;
  const q=obj(wixLocationFrontend.query);
  hotelPage.selection={
    origin:clean(q.origin,100),
    departureDate:clean(first(q.QueryDepDate,q.departureDate),10),
    duration:Number(first(q.QueryDur,q.nights,8))||8,
    travelers:Number(first(q.adults,2))||2,
    meal:clean(first(q.SelectedMeals,"noselection"),80),
    roomKey:clean(q.RoomKey,160)
  };
  post(html,"HOTEL_DETAIL_DATA",{page:hotelPage,source:result.source,supplier:"DUFFEL_STAYS"});
}

$w.onReady(()=>{
  const html=$w(EMBED_ID);
  html.onMessage(async event=>{
    const m=event.data||{},p=m.payload||{};
    if(await handleSharedChrome(html,m,customerNavigate))return;
    if(m.source!==CHILD_SOURCE)return;
    try{
      if(m.type==="HOTEL_DETAIL_READY"||m.type==="HOTEL_DETAIL_REFRESH"){await loadHotel(html,p);return}
      if(m.type==="HOTEL_DETAIL_CHECK_AVAILABILITY"){
        if(!hotelPage)throw new Error("Hotel information is not loaded yet.");
        const search=searchOf(p.search||p);
        let items=[];
        if(hotelPage.providerAccommodationId){
          const r=await searchCollectionHotelStays({
            inventoryMasterId:hotelPage.id,
            accommodationId:hotelPage.providerAccommodationId,
            checkInDate:search.departureDate,
            checkOutDate:search.returnDate,
            adults:search.adults,
            children:search.children,
            childAges:search.childAges,
            rooms:search.rooms,
            fetchRates:true
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
        wixLocationFrontend.to(`/booking?step=offer&cartId=${encodeURIComponent(cart.cartId)}${cart.cartToken?`&cartToken=${encodeURIComponent(cart.cartToken)}`:""}`);
        return;
      }
      if(m.type==="HOTEL_DETAIL_NAVIGATE")customerNavigate(p.path);
    }catch(error){
      post(html,"HOTEL_DETAIL_ERROR",{message:error?.publicMessage||error?.message||"Hotel information is temporarily unavailable."});
    }
  });
  sendCustomerHeaderState(html).catch(()=>{});
  setTimeout(()=>loadHotel(html,{}).catch(e=>post(html,"HOTEL_DETAIL_ERROR",{message:e.message})),450);
});
