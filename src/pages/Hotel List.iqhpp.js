import wixLocationFrontend from "wix-location-frontend";
import { currentMember, authentication } from "wix-members-frontend";
import { getCustomerHeaderSession, subscribeCustomerNewsletter } from "backend/customerHeader.web";
import { session } from "wix-storage";
import { getInventoryHotelBrowsePage } from "backend/FINAL/destinationFlow.web";
import { searchUnifiedOffers, createBookingCartFromOffer } from "backend/bookingOrchestratorCollection.web";

const EMBED_ID="#hotelsEmbed";
const CHILD_SOURCES=new Set(["SKANDI_AREA_HOTEL_SEARCH","SKANDI_HOTEL_SEARCH"]);
const PARENT_SOURCE="SKANDI_WIX_PARENT";
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
    destinationSlug:slug(q.destination||q.destinationSlug||q.region||""),
    areaSlug:slug(q.area||q.areaSlug||"")
  };
}
function normalizeSearch(s={}){
  return{
    tripType:"hotelOnly",
    destination:clean(first(s.destination,s.destinationIata,s.searchAirportIata,pageContext?.searchAirportIata,pageContext?.destinationIata,pageContext?.name),160),
    destinationRegion:clean(first(s.destinationRegion,pageContext?.name),160),
    departureDate:clean(first(s.checkInDate,s.departureDate,wixLocationFrontend.query.checkIn,wixLocationFrontend.query.departureDate),10),
    returnDate:clean(first(s.checkOutDate,s.returnDate,wixLocationFrontend.query.checkOut,wixLocationFrontend.query.returnDate),10),
    adults:Math.max(1,Number(first(s.adults,wixLocationFrontend.query.adults,2))||2),
    children:Math.max(0,Number(first(s.children,wixLocationFrontend.query.children,0))||0),
    childAges:arr(s.childAges),
    rooms:Math.max(1,Number(first(s.rooms,wixLocationFrontend.query.rooms,1))||1),
    currency:clean(first(s.currency,wixLocationFrontend.query.currency,"USD"),3).toUpperCase(),
    language:clean(first(s.language,s.locale,"EN"),12).toUpperCase()
  };
}
function canonicalFor(item={}){
  const hotels=arr(pageContext?.hotels);
  const id=clean(item.inventoryMasterId||item.hotelInventoryMasterId||item.id,120);
  if(id){
    const x=hotels.find(h=>h.id===id||h.inventoryMasterId===id||h.publicId===id||h.hotelId===id);
    if(x)return x;
  }
  const s=slug(item.hotelSlug||item.slug||item.name||item.title||"");
  if(s){
    const x=hotels.find(h=>slug(h.hotelSlug||h.slug||h.name)===s);
    if(x)return x;
  }
  const aid=clean(item.accommodationId||item.providerAccommodationId,180);
  if(aid){
    const x=hotels.find(h=>clean(h.providerAccommodationId,180)===aid);
    if(x)return x;
  }
  return null;
}
function liveHotel(item={}){
  const h=canonicalFor(item)||{};
  return{
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
async function loadPage(html,p={}){
  const base=route();
  const countrySlug=slug(p.countrySlug||base.countrySlug);
  const destinationSlug=slug(p.destinationSlug||p.region||base.destinationSlug);
  const areaSlug=slug(p.areaSlug||base.areaSlug);
  if(!countrySlug)throw new Error("Missing country in Hotel List page URL.");
  const result=await getInventoryHotelBrowsePage({
    countrySlug,destinationSlug,areaSlug,
    language:p?.settings?.language||p.language||"EN"
  });
  pageContext=result.page;
  currentPage=pageContext;
  post(html,"HOTEL_SEARCH_PAGE_RESULT",{page:pageContext,source:result.source});
}
function openHotel(payload={}){
  const incoming=payload.hotel||payload;
  const h=canonicalFor(incoming)||incoming||{};
  const country=slug(h.countrySlug||pageContext?.countrySlug||route().countrySlug);
  const destination=slug(h.destinationSlug||pageContext?.destinationSlug||route().destinationSlug);
  const area=slug(h.areaSlug||pageContext?.areaSlug||route().areaSlug);
  const hotel=slug(h.hotelSlug||h.slug||h.name);
  const hotelId=clean(h.inventoryMasterId||h.id,120);
  if(!hotel&&!hotelId)throw new Error("Hotel link is missing its Inventory Control identity.");
  wixLocationFrontend.to(hotelDetailUrl(country,destination,area,hotel,hotelId));
}

$w.onReady(()=>{
  const html=$w(EMBED_ID);
  html.onMessage(async event=>{
    const m=event.data||{},p=m.payload||{};
    if(await handleSharedChrome(html,m,customerNavigate))return;
    if(!CHILD_SOURCES.has(m.source))return;
    try{
      if(m.type==="HOTEL_SEARCH_READY"||m.type==="HOTEL_SEARCH_REFRESH"){await loadPage(html,p);return}
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
        wixLocationFrontend.to(`/booking?step=offer&cartId=${encodeURIComponent(cart.cartId)}${cart.cartToken?`&cartToken=${encodeURIComponent(cart.cartToken)}`:""}`);
        return;
      }
      if(m.type==="HOTEL_SEARCH_VIEW_HOTEL"){openHotel(p);return}
      if(m.type==="HOTEL_SEARCH_NAVIGATE")customerNavigate(p.path);
    }catch(error){
      post(html,"HOTEL_SEARCH_ERROR",{message:error?.publicMessage||error?.message||"Hotel data is temporarily unavailable."});
    }
  });
  sendCustomerHeaderState(html).catch(()=>{});
  setTimeout(()=>loadPage(html,{}).catch(e=>post(html,"HOTEL_SEARCH_ERROR",{message:e.message})),450);
});
