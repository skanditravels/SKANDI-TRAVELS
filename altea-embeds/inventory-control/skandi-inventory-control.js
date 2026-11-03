
import React,{useEffect,useMemo,useRef,useState} from "react";
import {createRoot} from "react-dom/client";
import htm from "htm";
const html=htm.bind(React.createElement);


const SOURCE="SKANDI_INVENTORY_EMBED";
const PARENT="SKANDI_INVENTORY_PARENT";
const MASTER_PARENT="SKANDI_WIX_PARENT";
const VERSION="V12-INVENTORY-2026.10.09-ASSETS";
const TYPES=["COUNTRY","DESTINATION","AREA","AIRPORT","AIRLINE","SUPPLIER","HOTEL","GUIDED_TOUR","ACTIVITY","PARTNER_TICKET","TRANSFER","CAR_RENTAL","PACKAGE","ANCILLARY"];
const SELLABLE=new Set(["HOTEL","GUIDED_TOUR","ACTIVITY","PARTNER_TICKET","TRANSFER","CAR_RENTAL","PACKAGE","ANCILLARY"]);
const LABEL={COUNTRY:"Countries",DESTINATION:"Destinations",AREA:"Areas / Resorts",AIRPORT:"Airports",AIRLINE:"Airlines",SUPPLIER:"Suppliers",HOTEL:"Hotels",GUIDED_TOUR:"Guided Tours",ACTIVITY:"Activities",PARTNER_TICKET:"Partner Tickets",TRANSFER:"Transfers",CAR_RENTAL:"Car Rental",PACKAGE:"Packages",ANCILLARY:"Ancillaries"};
const MASTER_FILTERS=["COUNTRY","DESTINATION","AREA","AIRPORT","AIRLINE","SUPPLIER","HOTEL","TOURS_ACTIVITIES","PARTNER_TICKET","TRANSFER","CAR_RENTAL","PACKAGE","ANCILLARY"];
const MASTER_FILTER_LABEL={...LABEL,TOURS_ACTIVITIES:"Tours & Activities"};
const STATUS=["DRAFT","REVIEW","PUBLISHED","HIDDEN","SUSPENDED","ARCHIVED"];
const requests=new Map();
const REQUEST_TIMEOUT_MS=30000;


const INTERNAL_ISSUE_PATTERN=/(?:\b[A-Z][A-Z0-9]*_[A-Z0-9_]{2,}\b|\b(?:Wix|Duffel|Supabase|GraphQL|RLS|backend|web.?method|bootstrap|bridge|schema|database|provider|upstream|internal server|API endpoint|TypeError|ReferenceError|Cannot read properties|is not a function|HTTP [45][0-9]{2})\b)/i;
function logInventoryIssue(kind,details={}){
  // Internal-only diagnostics. Never include record data, customer data or credentials.
  console.error("[ALTEA Inventory Control]",{kind,at:new Date().toISOString(),...details});
}
function employeeErrorMessage(message,fallback="The action could not be completed. Please try again."){
  const raw=text(message).trim();
  if(/(?:AUTH_REQUIRED|NOT_AUTHENTICATED|SESSION_EXPIRED|LOGIN_REQUIRED)/i.test(raw))return "Your session has ended. Sign in again.";
  if(/(?:ACCESS_DENIED|PERMISSION_DENIED|FORBIDDEN|NOT_AUTHORIZED)/i.test(raw))return "You do not have access to this action.";
  if(/(?:RECORD_NOT_FOUND|ENTITY_NOT_FOUND)/i.test(raw))return "The selected record could not be found.";
  if(!raw||INTERNAL_ISSUE_PATTERN.test(raw)||raw.length>230)return fallback;
  return raw.replace(/\s*\[[A-Z][A-Z0-9_]{3,}\]\s*/g,"").trim()||fallback;
}
function sourceDisplayLabel(value){
  const key=text(value).toUpperCase();
  return ({DUFFEL:"Supplier information",SUPPLIER:"Supplier record",SKANDI_PARTNER:"SKANDI Partner",SKANDI:"SKANDI TRAVELS",MANUAL:"Entered by staff",INVENTORY_CONTROL:"ALTEA"})[key]||employeeErrorMessage(value,"Supplier");
}
function resourceTypeDisplay(value){
  return ({HOTEL:"Hotel",ACCOMMODATION:"Hotel",AIRLINE:"Airline",AIRPORT:"Airport",DESTINATION:"Destination",CITY:"City",AIRCRAFT:"Aircraft"})[text(value).toUpperCase()]||"Travel inventory";
}
function channelDisplayLabel(value,catalog){
  if(catalog?.catalogType==="SKANDI_PARTNER"&&value!=="AMADEUS")return `SKANDI Partner ${text(value).toUpperCase()==="DUFFEL"?"channel 1":"channel 2"}`;
  const key=text(value).toUpperCase();
  return ({AMADEUS:"ALTEA",DUFFEL:"Supplier channel 1",HOTELBEDS:"Supplier channel 2"})[key]||"Supplier";
}
function employeeAuditAction(value){
  return text(value).replace(/^(?:INVENTORY_|VOY_|ASSET_|SKANDI_)+/,"")
    .replace(/_/g," ").toLowerCase().replace(/\b\w/g,ch=>ch.toUpperCase())||"Updated";
}
function employeeAuditMessage(value){
  const raw=text(value).trim();
  if(!raw)return"—";
  return employeeErrorMessage(raw,"Operation recorded.")
    .replace(/\b(?:Wix|Duffel|Supabase|Amadeus|Hotelbeds)\b/gi,"Supplier");
}
function request(type,payload={}){
  const requestId=`INV-${Date.now()}-${Math.random().toString(36).slice(2,9)}`;
  return new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>{requests.delete(requestId);logInventoryIssue("request-timeout",{action:type,requestId});reject(new Error("The request took too long. Please try again."))},REQUEST_TIMEOUT_MS);
    requests.set(requestId,{resolve,reject,timer,type});
    window.parent.postMessage({source:SOURCE,type,payload,requestId,timestamp:new Date().toISOString()},"*");
  });
}
function sendReady(){
  window.parent.postMessage({source:SOURCE,type:"INVENTORY_V9_READY",payload:{version:VERSION},requestId:`READY-${Date.now()}`},"*");
}
const clone=v=>JSON.parse(JSON.stringify(v??null));
const text=v=>String(v??"");
const numOrNull=v=>v===""||v===null||v===undefined?null:(Number.isFinite(Number(v))?Number(v):null);
const bool=v=>v===true||v==="true"||v==="YES";
function setPath(obj,path,value){
  const keys=path.split(".");let cur=obj;
  keys.forEach((k,i)=>{if(i===keys.length-1)cur[k]=value;else{if(!cur[k]||typeof cur[k]!=="object"||Array.isArray(cur[k]))cur[k]={};cur=cur[k]}});
}
function getPath(obj,path){return path.split(".").reduce((a,k)=>a?.[k],obj)}
function blankRecord(type){
  return{id:"",publicId:"",entityType:type,code:"",name:"",slug:"",status:"DRAFT",active:true,customerVisible:false,staffVisible:true,alteaVisible:true,featured:false,homepageFeatured:false,sortPriority:100,parentEntityId:"",supplierEntityId:"",source:"SKANDI",sourceReference:"",details:{},commercial:{currency:"USD"},operations:{},seo:{},publication:{},payload:{}};
}
function recordBundle(type){return{record:blankRecord(type),localizedContent:[],media:[],relations:[],catalog:null}}
function statusPill(s){return html`<span className=${`pill ${text(s).toUpperCase()}`}>${s||"—"}</span>`}
function normalizeLocalized(row={}){
  return{...row,language:text(row.language||"EN").toUpperCase(),title:row.title||"",eyebrow:row.eyebrow||"",shortDescription:row.shortDescription??row.short_description??"",fullDescription:row.fullDescription??row.full_description??"",highlights:Array.isArray(row.highlights)?row.highlights:[],included:Array.isArray(row.included)?row.included:[],notIncluded:Array.isArray(row.notIncluded??row.not_included)?(row.notIncluded??row.not_included):[],importantInformation:row.importantInformation??row.important_information??"",seoTitle:row.seoTitle??row.seo_title??"",seoDescription:row.seoDescription??row.seo_description??"",content:row.content||{}}
}
function normalizeMedia(row={}){
  const payload=row.payload&&typeof row.payload==="object"&&!Array.isArray(row.payload)?row.payload:{};
  return{...row,id:row.id||"",mediaType:row.mediaType??row.media_type??"IMAGE",role:row.role||"GALLERY",url:row.url||"",altText:row.altText??row.alt_text??"",caption:row.caption||"",credit:row.credit||"",language:row.language||"",sortOrder:row.sortOrder??row.sort_order??100,active:row.active!==false,focalX:row.focalX??row.focal_x??null,focalY:row.focalY??row.focal_y??null,sourceKind:row.sourceKind??row.source_kind??"URL",storageBucket:row.storageBucket??row.storage_bucket??"",storagePath:row.storagePath??row.storage_path??"",payload,assetId:payload.assetId||row.assetId||""}
}
function normalizeRelation(row={}){
  return{...row,id:row.id||"",relationType:row.relationType??row.relation_type??"RELATED",targetEntityId:row.targetEntityId??row.target_entity_id??"",targetRecordType:row.targetRecordType??row.target_record_type??"",targetRecordId:row.targetRecordId??row.target_record_id??"",sequenceNo:row.sequenceNo??row.sequence_no??100,active:row.active!==false}
}


function Field({label,value,onChange,type="text",options=[],help,disabled=false,full=false,placeholder=""}){
  return html`<div className=${`field ${full?"full":""}`}><label>${label}</label>
    ${type==="textarea"
      ?html`<textarea className="textarea" value=${value??""} placeholder=${placeholder} disabled=${disabled} onInput=${e=>onChange(e.target.value)} />`
      :type==="select"
        ?html`<select className="select" value=${value??""} disabled=${disabled} onChange=${e=>onChange(e.target.value)}>
            ${!options.some(o=>(typeof o==="string"?o:o.value)==="")?html`<option value="">Choose…</option>`:null}
            ${options.map(o=>html`<option value=${typeof o==="string"?o:o.value}>${typeof o==="string"?o:o.label}</option>`)}
          </select>`
        :html`<input className="input" type=${type} value=${value??""} placeholder=${placeholder} disabled=${disabled} onInput=${e=>onChange(type==="number"?numOrNull(e.target.value):e.target.value)} />`}
    ${help?html`<small>${help}</small>`:null}
  </div>`
}
function ListField({label,value,onChange,separator="\n",splitPattern,parseItem,help,full=false,placeholder=""}){
  const values=Array.isArray(value)?value:[];
  const signature=JSON.stringify(values);
  const formatted=values.map(v=>typeof v==="string"?v:JSON.stringify(v)).join(separator);
  const [draft,setDraft]=useState(formatted);
  const emittedSignature=useRef(signature);
  useEffect(()=>{
    if(signature!==emittedSignature.current){emittedSignature.current=signature;setDraft(formatted)}
  },[signature,formatted]);
  function change(raw){
    const next=raw.split(splitPattern||(separator==="\n"?/\r?\n/:/,/))
      .map(parseItem||(v=>v.trim())).filter(v=>v!==null&&v!=="");
    emittedSignature.current=JSON.stringify(next);
    // Keep the typed delimiter/blank line visible while storing parsed values.
    // Save therefore always sees current data without depending on a blur event.
    setDraft(raw);onChange(next);
  }
  return html`<${Field} label=${label} type=${separator==="\n"?"textarea":"text"} value=${draft} onChange=${change} help=${help} full=${full} placeholder=${placeholder}/>`;
}
function Toggle({label,value,onChange}){
  return html`<div className="field"><label>${label}</label><select className="select" value=${value?"YES":"NO"} onChange=${e=>onChange(e.target.value==="YES")}><option>YES</option><option>NO</option></select></div>`
}


const SMART_ENUMS={
  currency:["USD","SEK","NOK","DKK","EUR","GBP","THB"],
  pricebasis:["PER_PERSON","PER_BOOKING","PER_NIGHT","PER_ROOM","PER_VEHICLE","PER_TICKET","PER_ITEM"],
  transfertype:["SHARED","PRIVATE","COACH","SHUTTLE","TAXI","RAIL","FERRY"],
  vehicletype:["SEDAN","SUV","VAN","MINIBUS","COACH","LIMOUSINE"],
  vehicleclass:["ECONOMY","COMPACT","MIDSIZE","FULLSIZE","PREMIUM","SUV","VAN"],
  tickettype:["STANDARD","TIMED_ENTRY","OPEN_DATED","EVENT","ATTRACTION","TRANSPORT"],
  deliverymethod:["DIGITAL","EMAIL","MOBILE","VOUCHER","BOX_OFFICE","HOTEL_DELIVERY"],
  suppliertype:["HOTEL","DMC","TRANSPORT","AIRLINE","TOUR_OPERATOR","ATTRACTION","TICKETING","CAR_RENTAL","OTHER"],
  packagetype:["CHARTER","DYNAMIC_PACKAGE","CITY_BREAK","SUN_PACKAGE","ESCORTED","CRUISE","OTHER"],
  ancillarytype:["BAGGAGE","SEAT","MEAL","LOUNGE","FAST_TRACK","TRANSFER","INSURANCE","OTHER"],
  unit:["PER_PERSON","PER_BOOKING","PER_ROOM","PER_NIGHT","PER_VEHICLE","PER_ITEM"],
  cabin:["FIRST","BUSINESS","PREMIUM_ECONOMY","ECONOMY"],
  cabinclass:["FIRST","BUSINESS","PREMIUM_ECONOMY","ECONOMY"],
  status:["DRAFT","REVIEW","PUBLISHED","HIDDEN","SUSPENDED","ARCHIVED","OPEN","CLOSED","ACTIVE","INACTIVE"],
  reviewstatus:["NOT_REVIEWED","IN_REVIEW","APPROVED","CHANGES_REQUIRED"],
  source:["SKANDI","SUPPLIER","DUFFEL","MANUAL","INVENTORY_CONTROL"]
};
// R-003.6 explicit editor contract. Known fields never infer their control type
// from the current value. The fallback editor below is only for unknown stored
// compatibility keys, so schema additions cannot make existing data disappear.
const ENUM={
  currency:["USD","SEK","NOK","DKK","EUR","GBP","THB"],
  priceBasis:["PER_PERSON","PER_BOOKING","PER_NIGHT","PER_ROOM","PER_VEHICLE","PER_TICKET","PER_ITEM"],
  propertyType:["RESORT","CITY","BOUTIQUE","APARTMENT","VILLA","OTHER"],
  smokingPolicy:["NON_SMOKING","DESIGNATED_AREAS","SMOKING_ALLOWED","UNKNOWN"],
  tourType:["SKANDI_GUIDED","PARTNER_GUIDED","PRIVATE","GROUP","WALKING","COACH","BOAT","COMBINATION"],
  difficulty:["EASY","MODERATE","CHALLENGING","DIFFICULT"],
  activityType:["EXPERIENCE","EXCURSION","WATER_SPORT","ADVENTURE","CULTURE","FOOD","WELLNESS","FAMILY","NIGHTLIFE","OTHER"],
  ticketType:["STANDARD","TIMED_ENTRY","OPEN_DATED","EVENT","ATTRACTION","TRANSPORT","MULTI_DAY","SEASON_PASS"],
  validityType:["DATE_TIME","DATE","OPEN_DATED","MULTI_DAY","SEASON_PASS"],
  deliveryMethod:["DIGITAL","EMAIL","MOBILE","VOUCHER","BOX_OFFICE","HOTEL_DELIVERY"],
  supplierType:["HOTEL","TOUR","TRANSFER","CAR_RENTAL","AIRLINE","TICKET","DMC","INSURANCE","OTHER"],
  contractStatus:["DRAFT","NEGOTIATION","ACTIVE","EXPIRING","EXPIRED","SUSPENDED","TERMINATED"],
  transferType:["SHARED_COACH","SHARED_MINIBUS","PRIVATE_CAR","PRIVATE_SUV","PRIVATE_VAN","LUXURY","WHEELCHAIR_ACCESSIBLE"],
  direction:["ARRIVAL","DEPARTURE","ROUNDTRIP"],
  transportMode:["COACH","MINIBUS","CAR","SUV","VAN","FERRY","BOAT","OTHER"],
  pickupType:["NONE","HOTEL","CENTRAL_POINT","CUSTOM"],
  pickupTimeBasis:["FIXED","FLIGHT_BASED","HOTEL_BASED","MANUAL"],
  returnPickupMethod:["FIXED","NOTIFIED","APP","SMS","HOTEL_RECEPTION","GUIDE"],
  vehicleCategory:["MINI","ECONOMY","COMPACT","MIDSIZE","FULLSIZE","SUV","PREMIUM","LUXURY","VAN","ELECTRIC","OTHER"],
  vehicleClass:["ECONOMY","COMPACT","MIDSIZE","FULLSIZE","PREMIUM","SUV","VAN","LUXURY","OTHER"],
  transmission:["AUTOMATIC","MANUAL"],
  fuel:["PETROL","DIESEL","HYBRID","ELECTRIC","OTHER"],
  mileagePolicy:["UNLIMITED","LIMITED","SUPPLIER_TERMS","OTHER"],
  fuelPolicy:["FULL_TO_FULL","SAME_TO_SAME","PREPURCHASE","SUPPLIER_TERMS","OTHER"],
  packageType:["CHARTER","DYNAMIC_PACKAGE","CITY_BREAK","SUN_PACKAGE","ESCORTED","CRUISE","OTHER"],
  ancillaryType:["BAGGAGE","SEAT","MEAL","INSURANCE","PRIORITY","LOUNGE","HOTEL_UPGRADE","TRANSFER_UPGRADE","CELEBRATION","AIRPORT_SERVICE","OTHER"]
};
const SF=(label,path,type="text",options=[],help="",refTypes=[])=>({label,path,type,options,help,refTypes});
const SL=(label,path,help="")=>({label,path,type:"list",help});
const SR=(label,path,fields,help="")=>({label,path,type:"repeat",fields,help});
const ENTITY_SCHEMAS={
  COUNTRY:{details:[
    SF("ISO Country Code","details.countryCode"),SF("Region / Sub-region","details.region"),SF("Timezone","details.timezone"),SF("Currency","details.currency","select",ENUM.currency),
    SF("Latitude","details.latitude","number"),SF("Longitude","details.longitude","number"),SF("Best Time to Visit","details.bestTimeToVisit","textarea"),SF("High Season","details.highSeason"),SF("Low Season","details.lowSeason"),
    SL("Tags","details.tags"),SL("Good For","details.goodFor"),SL("Signature Reasons","details.signatureReasons"),SF("Climate","details.climate","textarea")
  ]},
  DESTINATION:{details:[
    SF("Region / Sub-region","details.region"),SF("Nearest Airport","details.nearestAirportId","reference",[],"",["AIRPORT"]),SF("Secondary Airport","details.secondaryAirportId","reference",[],"",["AIRPORT"]),
    SF("Latitude","details.latitude","number"),SF("Longitude","details.longitude","number"),SF("Timezone","details.timezone"),SF("Currency","details.currency","select",ENUM.currency),
    SF("Best Time to Visit","details.bestTimeToVisit","textarea"),SF("High Season","details.highSeason"),SF("Low Season","details.lowSeason"),SL("Tags","details.tags"),SL("Good For","details.goodFor"),SL("Signature Reasons","details.signatureReasons"),SF("Climate","details.climate","textarea")
  ]},
  AREA:{details:[
    SF("Region / Sub-region","details.region"),SF("Nearest Airport","details.nearestAirportId","reference",[],"",["AIRPORT"]),SF("Secondary Airport","details.secondaryAirportId","reference",[],"",["AIRPORT"]),
    SF("Latitude","details.latitude","number"),SF("Longitude","details.longitude","number"),SF("Timezone","details.timezone"),SF("Currency","details.currency","select",ENUM.currency),SF("Best Time to Visit","details.bestTimeToVisit","textarea"),SL("Tags","details.tags"),SL("Good For","details.goodFor")
  ]},
  SUPPLIER:{details:[
    SF("Supplier Type","details.supplierType","select",ENUM.supplierType),SF("Legal Name","details.legalName"),SF("Country","details.country"),SF("Contact Name","details.contactName"),SF("Contact Email","details.contactEmail","email"),SF("Phone","details.phone"),SF("Website","details.website","url"),
    SF("Supplier Integration","details.apiProvider","boolean"),SF("Account Reference","details.accountReference"),SF("Contract Status","details.contractStatus","select",ENUM.contractStatus),SF("Payment Terms","details.paymentTerms","textarea"),SF("Commission Model","details.commissionModel")
  ]},
  HOTEL:{details:[
    SF("Brand","details.brand"),SF("Property Type","details.propertyType","select",ENUM.propertyType),SF("Destination","details.destinationId","reference",[],"",["DESTINATION"]),SF("Area / Resort","details.areaId","reference",[],"",["AREA"]),SF("Nearest Airport","details.nearestAirportId","reference",[],"",["AIRPORT"]),
    SF("Supplier Hotel Reference","details.providerAccommodationId"),SF("Address","details.address"),SF("City","details.city"),SF("Postal Code","details.postalCode"),SF("Latitude","details.latitude","number"),SF("Longitude","details.longitude","number"),
    SF("Official Star Rating","details.officialStarRating","number"),SF("SKANDI Rating","details.skandiRating","number"),SF("Guest Rating","details.guestRating","number"),SF("Review Count","details.reviewCount","number"),
    SF("Check-in Time","details.checkinTime","time"),SF("Check-out Time","details.checkoutTime","time"),SF("Minimum Check-in Age","details.minimumCheckinAge","number"),SF("Pets Allowed","details.petsAllowed","boolean"),SF("Smoking Policy","details.smokingPolicy","select",ENUM.smokingPolicy),
    SF("Distance to Beach km","details.distanceToBeach","number"),SF("Distance to Center km","details.distanceToCenter","number"),SF("Distance to Airport km","details.distanceToAirport","number"),SF("Transfer Time Minutes","details.transferTimeMinutes","number"),
    SL("Board Options","details.boardOptions"),SL("Facilities","details.facilities"),
    SR("Room Types","details.rooms",[SF("Code","code"),SF("Name","name"),SF("Room Type","roomType"),SF("Max Guests","maxGuests","number"),SF("Bed Type","bedType"),SF("Size m²","sizeSqm","number"),SF("Description","description","textarea")]),
    SR("Hotel Facts","details.facts",[SF("Label","label"),SF("Value","value")])
  ],operations:[SF("Booking Cutoff Hours","operations.bookingCutoffHours","number"),SF("Operational Notes","operations.notes","textarea")]},
  GUIDED_TOUR:{details:[
    SF("Destination","details.destinationId","reference",[],"",["DESTINATION"]),SF("Area / Resort","details.areaId","reference",[],"",["AREA"]),SF("Category","details.category"),SF("Tour Type","details.tourType","select",ENUM.tourType),SF("Duration Minutes","details.durationMinutes","number"),SF("Difficulty","details.difficulty","select",ENUM.difficulty),
    SF("Minimum Age","details.minimumAge","number"),SF("Child Policy","details.childPolicy","textarea"),SF("Accessibility","details.accessibility","textarea"),SL("Languages","details.languages")
  ],commercial:[SF("Currency","commercial.currency","select",ENUM.currency),SF("Price Basis","commercial.priceBasis","select",ENUM.priceBasis),SF("Supplier Cost","commercial.supplierCost","number"),SF("Public Price","commercial.publicPrice","number"),SF("Adult Price","commercial.adultPrice","number"),SF("Child Price","commercial.childPrice","number"),SF("Infant Price","commercial.infantPrice","number"),SF("Private Price","commercial.privatePrice","number")],operations:[
    SF("Guide Required","operations.guideRequired","boolean"),SF("Languages Required","operations.languagesRequired"),SF("Guide Briefing","operations.guideBriefing","textarea"),
    SR("Itinerary","operations.itinerary",[SF("Sequence","sequence","number"),SF("Stop Name","stopName"),SF("Duration Minutes","durationMinutes","number"),SF("Latitude","latitude","number"),SF("Longitude","longitude","number"),SF("Description","description","textarea")]),
    SR("Pickup Points","operations.pickups",[SF("Name","name"),SF("Hotel","hotelId","reference",[],"",["HOTEL"]),SF("Time Offset Minutes","timeOffsetMinutes","number"),SF("Instructions","instructions","textarea")]),
    SF("Booking Available","operations.bookingAvailable","boolean"),SF("Request Only","operations.requestOnly","boolean"),SF("Booking Cutoff Hours","operations.bookingCutoffHours","number"),SF("Minimum Units / Guests","operations.minimum","number"),SF("Maximum Units / Guests","operations.maximum","number"),SF("Cancellation Rule","operations.cancellationRule","textarea"),SF("Amendment Policy","operations.amendmentPolicy","textarea"),SF("Internal Operational Notes","operations.internalNotes","textarea")
  ]},
  ACTIVITY:{details:[
    SF("Destination","details.destinationId","reference",[],"",["DESTINATION"]),SF("Area / Resort","details.areaId","reference",[],"",["AREA"]),SF("Category","details.category"),SF("Subcategory","details.subcategory"),SF("Activity Type","details.activityType","select",ENUM.activityType),SF("Duration Minutes","details.durationMinutes","number"),
    SF("Start Location","details.startLocation"),SF("Meeting Point","details.meetingPoint","textarea"),SF("Pickup Available","details.pickupAvailable","boolean"),SF("Hotel Pickup Available","details.hotelPickupAvailable","boolean"),SF("Guide Type","details.guideType"),SF("Minimum Age","details.minimumAge","number"),SF("Maximum Age","details.maximumAge","number"),SF("Child Policy","details.childPolicy","textarea"),SF("Accessibility","details.accessibility","textarea"),SL("Languages","details.languages")
  ],commercial:[SF("Currency","commercial.currency","select",ENUM.currency),SF("Price Basis","commercial.priceBasis","select",ENUM.priceBasis),SF("Supplier Cost","commercial.supplierCost","number"),SF("Public Price","commercial.publicPrice","number"),SF("Adult Price","commercial.adultPrice","number"),SF("Child Price","commercial.childPrice","number")],operations:[SF("Booking Cutoff Hours","operations.bookingCutoffHours","number"),SF("Cancellation Policy","operations.cancellationPolicy","textarea"),SF("Operational Notes","operations.notes","textarea")]},
  PARTNER_TICKET:{details:[
    SF("Destination","details.destinationId","reference",[],"",["DESTINATION"]),SF("Area / Resort","details.areaId","reference",[],"",["AREA"]),SF("Vendor Ticket ID","details.vendorTicketId"),SF("Category","details.category"),SF("Ticket Type","details.ticketType","select",ENUM.ticketType),SF("Validity Type","details.validityType","select",ENUM.validityType),SF("Duration","details.duration"),SF("Venue / Meeting Location","details.meetingLocation"),SF("Restrictions","details.restrictions","textarea")
  ],commercial:[SF("Currency","commercial.currency","select",ENUM.currency),SF("Price Basis","commercial.priceBasis","select",ENUM.priceBasis),SF("Supplier Cost","commercial.supplierCost","number"),SF("Public Price","commercial.publicPrice","number"),SF("Adult Price","commercial.adultPrice","number"),SF("Child Price","commercial.childPrice","number")],operations:[SF("Delivery Method","operations.deliveryMethod","select",ENUM.deliveryMethod),SF("Booking Cutoff Hours","operations.bookingCutoffHours","number"),SF("Cancellation Policy","operations.cancellationPolicy","textarea"),SF("Operational Notes","operations.notes","textarea")]},
  TRANSFER:{details:[
    SF("Transfer Type","details.transferType","select",ENUM.transferType),SF("Direction","details.direction","select",ENUM.direction),SF("Airport","details.airportId","reference",[],"",["AIRPORT"]),SF("Destination","details.destinationId","reference",[],"",["DESTINATION"]),SF("Area / Resort","details.areaId","reference",[],"",["AREA"]),SF("Terminal","details.terminal"),SF("Arrival Hall","details.arrivalHall"),SF("Airport Exit Number","details.airportExitNumber"),SF("Waiting Area","details.waitingArea"),SF("Meeting Point","details.meetingPoint"),SF("Meeting Point Description","details.meetingPointDescription","textarea"),SF("Emergency Phone","details.emergencyPhone"),SF("Distance km","details.distanceKm","number"),SF("Zone Code","details.zoneCode"),SF("Zone Name","details.zoneName"),
    SF("Transport Mode","details.transportMode","select",ENUM.transportMode),SF("Vehicle Type","details.vehicleType"),SF("Vehicle Class","details.vehicleClass","select",ENUM.vehicleClass),SF("Vehicle Capacity","details.vehicleCapacity","number"),SF("Luggage Capacity","details.luggageCapacity","number"),SF("Published Time Min","details.publishedTimeMin","number"),SF("Published Time Max","details.publishedTimeMax","number"),SF("Shared Time Min","details.sharedTimeMin","number"),SF("Shared Time Max","details.sharedTimeMax","number"),SF("Direct Time Min","details.directTimeMin","number"),SF("Direct Time Max","details.directTimeMax","number"),SF("Air Conditioning","details.airConditioning","boolean"),SF("Wi-Fi","details.wifi","boolean"),SF("Toilet","details.toilet","boolean"),SF("Accessible Vehicle Available","details.accessibleVehicleAvailable","boolean"),SF("Accessible Vehicle Guaranteed","details.accessibleVehicleGuaranteed","boolean"),SF("Accessibility Request Required","details.accessibilityRequestRequired","boolean"),SF("Accessibility Notes","details.accessibilityNotes","textarea"),
    SR("Transfer Zones","details.zones",[SF("Code","code"),SF("Name","name"),SF("Description","description","textarea")])
  ],commercial:[SF("Currency","commercial.currency","select",ENUM.currency),SF("Price Basis","commercial.priceBasis","select",ENUM.priceBasis),SF("Supplier Cost","commercial.supplierCost","number"),SF("Public Price","commercial.publicPrice","number"),SF("One-way Supplier Cost","commercial.internalCostOneWay","number"),SF("One-way Public Price","commercial.oneWayPublicPrice","number"),SF("Roundtrip Supplier Cost","commercial.internalCostRoundtrip","number"),SF("Roundtrip Public Price","commercial.roundtripPublicPrice","number"),SF("Child Price","commercial.childPrice","number"),SF("Infant Price","commercial.infantPrice","number"),SF("Child Seat Fee","commercial.childSeatFee","number"),SF("Extra Bag Fee","commercial.extraBagFee","number"),SF("Sports Equipment Fee","commercial.sportsEquipmentFee","number")],operations:[
    SF("Flight Number Required","operations.flightNumberRequired","boolean"),SF("Flight Tracking Enabled","operations.flightTrackingEnabled","boolean"),SF("Delay Protection","operations.delayProtection","boolean"),SF("Maximum Delay Wait Minutes","operations.maximumDelayWaitMinutes","number"),SF("Meet & Greet","operations.meetAndGreet","boolean"),SF("One-way Available","operations.oneWayAvailable","boolean"),SF("Roundtrip Available","operations.roundtripAvailable","boolean"),SF("Hotel Pickup Type","operations.hotelPickupType","select",ENUM.pickupType),SF("Pickup Time Basis","operations.pickupTimeBasis","select",ENUM.pickupTimeBasis),SF("Return Pickup Method","operations.returnPickupMethod","select",ENUM.returnPickupMethod),SF("Reconfirmation Required","operations.reconfirmationRequired","boolean"),SF("Previous Day Notification","operations.previousDayNotification","boolean"),SF("SMS Enabled","operations.smsEnabled","boolean"),SF("App Notification Enabled","operations.appNotificationEnabled","boolean"),SF("Minimum Hotel Stops","operations.minimumHotelStops","number"),SF("Maximum Hotel Stops","operations.maximumHotelStops","number"),SF("Airport Arrival Buffer Minutes","operations.airportArrivalBufferMinutes","number"),SF("Pickup Location Instructions","operations.pickupLocationInstructions","textarea"),SF("After Baggage Instructions","operations.afterBaggageInstructions","textarea"),SF("No-show Rule","operations.noShowRule","textarea"),SF("Lost Baggage Delay Guidance","operations.lostBaggageDelayGuidance","textarea"),SF("Cancellation Policy","operations.cancellationPolicy","textarea"),SF("Amendment Policy","operations.amendmentPolicy","textarea"),SF("Internal Notes","operations.internalNotes","textarea")
  ]},
  CAR_RENTAL:{details:[
    SF("Destination","details.destinationId","reference",[],"",["DESTINATION"]),SF("Airport","details.airportId","reference",[],"",["AIRPORT"]),SF("Vehicle Category","details.vehicleCategory","select",ENUM.vehicleCategory),SF("Vehicle Name","details.vehicleName"),SF("Vehicle Class","details.vehicleClass","select",ENUM.vehicleClass),SF("Transmission","details.transmission","select",ENUM.transmission),SF("Fuel Type","details.fuelType","select",ENUM.fuel),SF("Seats","details.seats","number"),SF("Doors","details.doors","number"),SF("Large Bags","details.largeBags","number"),SF("Small Bags","details.smallBags","number"),SF("Air Conditioning","details.airConditioning","boolean"),SF("Minimum Driver Age","details.minimumDriverAge","number"),SF("Mileage Policy","details.mileagePolicy","select",ENUM.mileagePolicy),SF("Fuel Policy","details.fuelPolicy","select",ENUM.fuelPolicy),SF("Deposit Policy","details.depositPolicy","textarea"),SF("Insurance Summary","details.insuranceSummary","textarea"),SF("Pickup Location","details.pickupLocation"),SF("Drop-off Location","details.dropoffLocation")
  ],commercial:[SF("Currency","commercial.currency","select",ENUM.currency),SF("Price Basis","commercial.priceBasis","select",ENUM.priceBasis),SF("Supplier Cost","commercial.supplierCost","number"),SF("Public Price","commercial.publicPrice","number")],operations:[SF("Booking Cutoff Hours","operations.bookingCutoffHours","number"),SF("Cancellation Rule","operations.cancellationRule","textarea"),SF("Internal Operational Notes","operations.internalNotes","textarea")]},
  PACKAGE:{details:[
    SF("Destination","details.destinationId","reference",[],"",["DESTINATION"]),SF("Area / Resort","details.areaId","reference",[],"",["AREA"]),SF("Package Type","details.packageType","select",ENUM.packageType),SF("Start Date","details.startDate","date"),SF("End Date","details.endDate","date"),SF("Number of Days","details.numberOfDays","number"),SF("Number of Nights","details.numberOfNights","number")
  ],commercial:[SF("Currency","commercial.currency","select",ENUM.currency),SF("Price Basis","commercial.priceBasis","select",ENUM.priceBasis),SF("Supplier Cost","commercial.supplierCost","number"),SF("Public Price","commercial.publicPrice","number"),SF("Deposit Amount","commercial.depositAmount","number")],operations:[SF("Booking Flow","operations.bookingFlow","textarea"),SF("Booking Cutoff Hours","operations.bookingCutoffHours","number"),SF("Cancellation Rule","operations.cancellationRule","textarea"),SF("Internal Operational Notes","operations.internalNotes","textarea")]},
  ANCILLARY:{details:[
    SF("Extra Type","details.extraType","select",ENUM.ancillaryType),SF("Minimum Age","details.minimumAge","number"),SF("Maximum Age","details.maximumAge","number"),SF("Max Quantity","details.maxQuantity","number"),SF("Refundable","details.refundable","boolean"),SF("Changeable","details.changeable","boolean"),SF("Description","details.description","textarea")
  ],commercial:[SF("Currency","commercial.currency","select",ENUM.currency),SF("Price Basis","commercial.priceBasis","select",ENUM.priceBasis),SF("Supplier Cost","commercial.supplierCost","number"),SF("Public Price","commercial.publicPrice","number")],operations:[SF("Booking Cutoff Hours","operations.bookingCutoffHours","number"),SF("Cancellation Rule","operations.cancellationRule","textarea"),SF("Internal Operational Notes","operations.internalNotes","textarea")]},
  AIRPORT:{details:[
    SF("ICAO Code","details.icaoCode"),SF("Country","details.country"),SF("City","details.city"),SF("Timezone","details.timezone"),SF("Latitude","details.latitude","number"),SF("Longitude","details.longitude","number"),SF("Distance to City Center km","details.distanceToCityCenterKm","number"),SF("Website","details.website","url"),SF("Contact URL","details.contactUrl","url"),SF("Summary","details.summary","textarea"),SF("Information","details.information","textarea"),SF("Arrivals Information","details.arrivalInfo","textarea"),SF("Departures Information","details.departureInfo","textarea"),SF("Transfer Information","details.transferInfo","textarea"),SF("Check-in Information","details.checkinInfo","textarea"),SF("Security Information","details.securityInfo","textarea"),SF("Transport Information","details.transportInfo","textarea"),SF("Parking Information","details.parkingInfo","textarea"),SF("Lounges","details.lounges","textarea"),SF("Airport Hotels","details.airportHotels","textarea"),SF("Destinations Served","details.destinationsServing","textarea"),
    SR("Quick Facts","details.quickFactsJson",[SF("Label","label"),SF("Value","value")]),
    SR("Terminals","details.terminalsJson",[SF("Terminal","terminal"),SF("Name","name"),SF("Description","description","textarea")]),
    SR("Runways","details.runwaysJson",[SF("Runway","runway"),SF("Length","length"),SF("Surface","surface"),SF("Notes","notes","textarea")]),
    SR("Transport Options","details.transportJson",[SF("Type","type"),SF("Name","name"),SF("Description","description","textarea"),SF("URL","url","url")]),
    SR("Food & Drinks","details.foodDrinksJson",[SF("Name","name"),SF("Category","category"),SF("Terminal / Location","location"),SF("Notes","description","textarea")]),
    SR("Lost & Found","details.lostFoundJson",[SF("Name / Office","name"),SF("Location","location"),SF("Phone / Contact","contact"),SF("URL","url","url")]),
    SR("Reference links","details.sourceUrlsJson",[SF("Label","label"),SF("URL","url","url")])
  ]},
  AIRLINE:{details:[
    SF("ICAO Code","details.icaoCode"),SF("Short Name","details.shortName"),SF("Alliance","details.alliance"),SF("Brand Group","details.brandGroup"),SF("Country","details.country"),SF("City / Base","details.city"),SF("Website","details.website","url"),SF("Contact URL","details.contactUrl","url"),SF("Summary","details.summary","textarea"),SF("Check-in","details.checkIn","textarea"),SF("Boarding","details.boarding","textarea"),SF("Lounges","details.lounges","textarea"),SF("Loyalty Program","details.loyaltyProgram","textarea"),
    SR("Baggage Allowance","details.baggageAllowance",[SF("Cabin / Fare","name"),SF("Under-seat Bag","underSeatBag"),SF("Carry-on","overheadCarryOn"),SF("Checked Bag","checkedBag"),SF("Notes","description","textarea")]),
    SR("Food & Drinks","details.foodDrinksJson",[SF("Cabin / Fare","name"),SF("Service","service"),SF("Description","description","textarea")]),
    SR("Wi-Fi / Connectivity","details.wifiOnboardJson",[SF("Product / Supplier","name"),SF("Availability","availability"),SF("Price","price"),SF("Notes","description","textarea")]),
    SR("Ticket Types","details.ticketTypesJson",[SF("Name","name"),SF("Description","description","textarea")]),
    SR("Children / Infants","details.childrenInfantsJson",[SF("Passenger Type","passengerType"),SF("Rule / Allowance","rule"),SF("Description","description","textarea")]),
    SR("Delays / Cancellations","details.delaysCancellationsJson",[SF("Topic","title"),SF("Rule / Policy","description","textarea"),SF("URL","url","url")]),
    SR("Damaged Baggage","details.damagedBaggageJson",[SF("Topic","title"),SF("Procedure","description","textarea"),SF("URL","url","url")]),
    SR("Lost & Found","details.lostFoundJson",[SF("Topic","title"),SF("Procedure","description","textarea"),SF("URL","url","url")]),
    SR("Quick Facts","details.quickFactsJson",[SF("Label","label"),SF("Value","value")]),
    SR("Cabins","details.cabinsJson",[SF("Cabin","name"),SF("Code","code"),SF("Description","description","textarea")]),
    SR("Hubs","details.hubsJson",[SF("Airport Code","code"),SF("Airport / City","name")]),
    SR("Fleet Summary","details.fleetSummaryJson",[SF("Aircraft","aircraft"),SF("Count","count","number"),SF("Notes","notes","textarea")]),
    SR("Reference links","details.sourceUrlsJson",[SF("Label","label"),SF("URL","url","url")])
  ]}
};
const DEFAULT_COMMERCIAL=[SF("Currency","commercial.currency","select",ENUM.currency),SF("Price Basis","commercial.priceBasis","select",ENUM.priceBasis),SF("Supplier Cost","commercial.supplierCost","number"),SF("Public Price","commercial.publicPrice","number")];
const DEFAULT_OPERATIONS=[SF("Booking Cutoff Hours","operations.bookingCutoffHours","number"),SF("Operational Notes","operations.notes","textarea")];
function schemaFields(type,section){
  const own=ENTITY_SCHEMAS[type]?.[section];
  if(own)return own;
  if(section==="commercial"&&SELLABLE.has(type))return DEFAULT_COMMERCIAL;
  if(section==="operations"&&SELLABLE.has(type))return DEFAULT_OPERATIONS;
  return[];
}
function optionList(options,value){
  const base=(options||[]).map(o=>typeof o==="string"?{value:o,label:o}:o);
  const current=text(value).trim();
  if(current&&!base.some(o=>String(o.value)===current))return[{value:current,label:`Legacy / current · ${current}`},...base];
  return base;
}
function referenceList(records,types,value){
  const allowed=new Set(types||[]);
  const base=[{value:"",label:"Choose…"},...(records||[]).filter(r=>allowed.has(r.entityType)).map(r=>({value:r.id,label:`${r.code?`${r.code} · `:""}${r.name}`}))];
  const current=text(value).trim();
  if(current&&!base.some(o=>o.value===current))base.splice(1,0,{value:current,label:`Legacy / unresolved · ${current}`});
  return base;
}
function parseSchemaListLine(value){
  const line=String(value??"").trim();
  if(!line)return null;
  if((line.startsWith("{")&&line.endsWith("}"))||(line.startsWith("[")&&line.endsWith("]"))){
    try{return JSON.parse(line)}catch(_){return line}
  }
  return line
}
function SchemaScalar({field,value,onChange,records}){
  if(field.type==="boolean")return html`<${Toggle} label=${field.label} value=${value===true} onChange=${onChange}/>`;
  if(field.type==="list")return html`<${ListField} label=${field.label+" — one per line"} value=${value} onChange=${onChange} parseItem=${parseSchemaListLine} help=${field.help}/>`;
  if(field.type==="reference")return html`<${Field} label=${field.label} type="select" options=${referenceList(records,field.refTypes,value)} value=${value||""} onChange=${onChange} help=${field.help}/>`;
  if(field.type==="select")return html`<${Field} label=${field.label} type="select" options=${optionList(field.options,value)} value=${value??""} onChange=${onChange} help=${field.help}/>`;
  return html`<${Field} label=${field.label} type=${field.type||"text"} value=${value??""} onChange=${onChange} help=${field.help} full=${field.type==="textarea"}/>`;
}
function normalizeStructuredRows(value,fields=[]){
  const first=fields[0]?.path||"value", second=fields[1]?.path||"description";
  let parsed=value;
  if(typeof parsed==="string"){const raw=parsed.trim();if(!raw)return[];try{parsed=JSON.parse(raw)}catch(_){return[{[first]:raw}]}}
  if(Array.isArray(parsed))return parsed.filter(v=>v!==null&&v!==undefined&&v!=="").map(v=>v&&typeof v==="object"&&!Array.isArray(v)?v:{[first]:String(v)});
  if(parsed&&typeof parsed==="object"){
    if(fields.some(f=>Object.prototype.hasOwnProperty.call(parsed,f.path)))return[parsed];
    return Object.entries(parsed).map(([k,v])=>({[first]:k,[second]:v&&typeof v==="object"?JSON.stringify(v):String(v??"")}));
  }
  return parsed===null||parsed===undefined?[]:[{[first]:String(parsed)}];
}
function RepeatSchemaEditor({field,record,update,records}){
  const raw=getPath(record,field.path);const rows=normalizeStructuredRows(raw,field.fields);
  const add=()=>{const item={};for(const f of field.fields)item[f.path]=f.type==="boolean"?false:f.type==="number"?0:"";update(field.path,[...rows,item])};
  return html`<div className="smartgroup full"><div className="paneltitle"><span>${field.label}</span><button className="btn small" onClick=${add}>+ Add</button></div>${field.help?html`<div className="sub">${field.help}</div>`:null}
    ${rows.length?rows.map((row,i)=>html`<div className="smartobject"><div className="paneltitle"><span>${field.label} ${i+1}</span><button className="btn small danger" onClick=${()=>update(field.path,rows.filter((_,x)=>x!==i))}>Remove</button></div><div className="formgrid three">${field.fields.map(f=>html`<${SchemaScalar} field=${f} records=${records} value=${row?.[f.path]} onChange=${v=>update(field.path,rows.map((x,idx)=>idx===i?{...x,[f.path]:v}:x))}/>` )}</div></div>`):html`<div className="smartempty">No ${field.label.toLowerCase()} yet. Add the first one here.</div>`}
  </div>`;
}
function ExplicitSchemaEditor({type,section,record,update,records}){
  const fields=schemaFields(type,section);
  if(!fields.length)return html`<div className="smartempty">No additional fields for this section.</div>`;
  return html`<div className="formgrid three">${fields.map(field=>field.type==="repeat"?html`<${RepeatSchemaEditor} field=${field} record=${record} update=${update} records=${records}/>`:html`<${SchemaScalar} field=${field} records=${records} value=${getPath(record,field.path)} onChange=${v=>update(field.path,v)}/>` )}</div>`;
}
function knownSectionKeys(type,section){return schemaFields(type,section).map(f=>f.path.split(".")[1]).filter(Boolean)}


function prettyKey(key){
  return text(key).replace(/[_-]+/g," ").replace(/([a-z0-9])([A-Z])/g,"$1 $2").replace(/\b\w/g,m=>m.toUpperCase());
}
function keyToken(path){
  return text(path).split(".").pop().replace(/[^a-z0-9]/gi,"").toLowerCase();
}
function smartOptions(path,value){
  const token=keyToken(path);
  const options=SMART_ENUMS[token];
  if(!options)return null;
  const current=text(value).trim();
  return current&&!options.includes(current)?[current,...options]:options;
}
function smartTextType(path,value){
  const token=keyToken(path);
  if(/date$|reviewed$|validfrom$|validto$|publishat$|unpublishat$/.test(token))return"date";
  if(/time$|checkin$|checkout$|std$|sta$/.test(token))return"time";
  if(/email/.test(token))return"email";
  if(/url|website|link/.test(token))return"url";
  if(/description|summary|information|notes|content|policy|instructions|reason|message/.test(token)||text(value).length>140)return"textarea";
  return"text";
}
function SmartValueEditor({label,path,value,onChange,full=false}){
  if(Array.isArray(value)){
    const objects=value.some(v=>v&&typeof v==="object"&&!Array.isArray(v));
    if(!objects){
      return html`<${ListField} label=${label+" — one per line"} value=${value} onChange=${onChange} full=${full}/>`
    }
    return html`<div className="smartgroup"><div className="smarttitle">${label}</div>
      ${value.length?value.map((item,i)=>html`<div className="smartobject"><div className="paneltitle"><span>Item ${i+1}</span><button className="btn small danger" onClick=${()=>onChange(value.filter((_,x)=>x!==i))}>Remove</button></div><${SmartObjectEditor} value=${item||{}} onChange=${next=>onChange(value.map((x,idx)=>idx===i?next:x))}/></div>`):html`<div className="smartempty">No list items.</div>`}
    </div>`
  }
  if(value&&typeof value==="object"){
    return html`<div className="smartgroup"><div className="smarttitle">${label}</div><${SmartObjectEditor} value=${value} onChange=${onChange}/></div>`
  }
  if(typeof value==="boolean"){
    return html`<${Toggle} label=${label} value=${value} onChange=${onChange}/>`
  }
  const options=smartOptions(path,value);
  if(options){
    return html`<${Field} label=${label} type="select" options=${options} value=${value??""} onChange=${onChange} full=${full}/>`
  }
  const type=typeof value==="number"?"number":smartTextType(path,value);
  return html`<${Field} label=${label} type=${type} value=${value??""} onChange=${onChange} full=${full||type==="textarea"}/>`
}
function SmartObjectEditor({value,onChange,exclude=[]}){
  const obj=value&&typeof value==="object"&&!Array.isArray(value)?value:{};
  const hidden=new Set(exclude.map(x=>text(x)));
  const entries=Object.entries(obj).filter(([k])=>!hidden.has(k));
  if(!entries.length)return html`<div className="smartempty">No additional details.</div>`;
  return html`<div className="formgrid three">${entries.map(([k,v])=>html`<${SmartValueEditor} label=${prettyKey(k)} path=${k} value=${v} onChange=${next=>onChange({...obj,[k]:next})}/>` )}</div>`
}
function ConfigurationEditor({value,onChange}){
  const rows=Object.entries(value&&typeof value==="object"&&!Array.isArray(value)?value:{});
  const setRow=(index,key,seats)=>{
    const next={};
    rows.forEach(([k,v],i)=>{if(i===index){if(text(key).trim())next[text(key).trim()]=Math.max(0,Number(seats)||0)}else next[k]=v});
    onChange(next);
  };
  const add=()=>{
    let name="Economy";let i=2;while(Object.prototype.hasOwnProperty.call(value||{},name)){name=`Cabin ${i++}`}
    onChange({...value,[name]:0});
  };
  return html`<div className="smartgroup"><div className="paneltitle"><span>Cabin Seat Configuration</span><button className="btn small" onClick=${add}>+ Cabin</button></div>
    ${rows.length?html`<div className="smartlist">${rows.map(([k,v],i)=>html`<div className="smartrow"><div className="formgrid"><${Field} label="Cabin / Product Name" value=${k} onChange=${name=>setRow(i,name,v)}/><${Field} label="Seats" type="number" value=${v} onChange=${seats=>setRow(i,k,seats)}/></div><button className="btn small danger" onClick=${()=>{const next={...value};delete next[k];onChange(next)}}>Remove</button></div>`)}</div>`:html`<div className="smartempty">No cabin seat configuration stored. Add a cabin to build the configuration.</div>`}
  </div>`
}
const COMMON_AMENITIES=["Wi-Fi","Seatback entertainment","Streaming entertainment","USB-A power","USB-C power","AC power","Meal service","Snack service","Extra legroom","Lie-flat seat","Priority boarding","Lounge access"];
function AmenitiesEditor({value,onChange}){
  const list=Array.isArray(value)?value:[];
  const objectMode=list.some(v=>v&&typeof v==="object");
  const [choice,setChoice]=useState(COMMON_AMENITIES[0]);
  if(objectMode){
    return html`<div className="smartgroup"><div className="paneltitle"><span>Cabin Amenities</span><button className="btn small" onClick=${()=>onChange([...list,{label:"",available:true}])}>+ Amenity</button></div>
      ${list.map((item,i)=>html`<div className="smartobject"><div className="paneltitle"><span>Amenity ${i+1}</span><button className="btn small danger" onClick=${()=>onChange(list.filter((_,x)=>x!==i))}>Remove</button></div><${SmartObjectEditor} value=${item||{}} onChange=${next=>onChange(list.map((x,idx)=>idx===i?next:x))}/></div>`)}
    </div>`
  }
  return html`<div className="smartgroup"><div className="paneltitle"><span>Cabin Amenities</span><div className="toolbar"><select className="select w240" value=${choice} onChange=${e=>setChoice(e.target.value)}>${COMMON_AMENITIES.map(x=>html`<option value=${x}>${x}</option>`)}</select><button className="btn small" onClick=${()=>{if(!list.includes(choice))onChange([...list,choice])}}>Add</button></div></div>
    ${list.length?html`<div className="smartlist">${list.map((item,i)=>html`<div className="smartrow"><${Field} label=${`Amenity ${i+1}`} value=${text(item)} onChange=${v=>onChange(list.map((x,idx)=>idx===i?v:x))}/><button className="btn small danger" onClick=${()=>onChange(list.filter((_,x)=>x!==i))}>Remove</button></div>`)}</div>`:html`<div className="smartempty">No amenities have been added.</div>`}
  </div>`
}
let modalLockDepth=0;
let modalLockSnapshot=null;
function lockDocumentScroll(){
  if(modalLockDepth===0){
    modalLockSnapshot={
      htmlOverflow:document.documentElement.style.overflow,
      bodyOverflow:document.body.style.overflow,
      htmlOverscroll:document.documentElement.style.overscrollBehavior,
      bodyOverscroll:document.body.style.overscrollBehavior
    };
    document.documentElement.style.overflow="hidden";
    document.body.style.overflow="hidden";
    document.documentElement.style.overscrollBehavior="none";
    document.body.style.overscrollBehavior="none";
  }
  modalLockDepth++;
}
function unlockDocumentScroll(){
  modalLockDepth=Math.max(0,modalLockDepth-1);
  if(modalLockDepth===0&&modalLockSnapshot){
    document.documentElement.style.overflow=modalLockSnapshot.htmlOverflow;
    document.body.style.overflow=modalLockSnapshot.bodyOverflow;
    document.documentElement.style.overscrollBehavior=modalLockSnapshot.htmlOverscroll;
    document.body.style.overscrollBehavior=modalLockSnapshot.bodyOverscroll;
    modalLockSnapshot=null;
  }
}
function Modal({title,onClose,children,wide=false,actions=null}){
  useEffect(()=>{lockDocumentScroll();return unlockDocumentScroll},[]);
  return html`<div className="modalback" onMouseDown=${e=>{if(e.target===e.currentTarget)onClose()}}>
    <div className=${`modal ${wide?"wide":""}`} role="dialog" aria-modal="true">
      <div className="modalhead"><h2>${title}</h2><div className="toolbar">${actions}<button className="btn small" onClick=${onClose}>Close</button></div></div>
      <div className="modalbody">${children}</div>
    </div>
  </div>`
}
function Pagination({page,totalPages,total,pageSize=100,onPage}){
  if(!total)return null;
  const start=(page-1)*pageSize+1,end=Math.min(page*pageSize,total);
  return html`<div className="pager"><div className="pagerinfo">Showing ${start}–${end} of ${total} · Page ${page} of ${totalPages}</div><div className="pagerbuttons"><button className="btn small" disabled=${page<=1} onClick=${()=>onPage(Math.max(1,page-1))}>‹ Previous Page</button><button className="btn small" disabled=${page>=totalPages} onClick=${()=>onPage(Math.min(totalPages,page+1))}>Next Page ></button></div></div>`
}


const ASSET_ROOTS=["SKANDI","AIRLINES","AIRCRAFT","AIRPORTS","COUNTRIES","DESTINATIONS","AREAS","HOTELS","TRANSFERS","TOURS","ACTIVITIES","TICKETS","CAR RENTAL","SUPPLIERS","PARTNERS","EMPLOYEES","UNIFORMS","VOY"];
const ROOT_BY_ENTITY={AIRLINE:"AIRLINES",AIRPORT:"AIRPORTS",COUNTRY:"COUNTRIES",DESTINATION:"DESTINATIONS",AREA:"AREAS",HOTEL:"HOTELS",TRANSFER:"TRANSFERS",GUIDED_TOUR:"TOURS",ACTIVITY:"ACTIVITIES",PARTNER_TICKET:"TICKETS",CAR_RENTAL:"CAR RENTAL",SUPPLIER:"SUPPLIERS"};
function humanBytes(bytes){const n=Number(bytes)||0;if(!n)return"—";const u=["B","KB","MB","GB"];let i=0,v=n;while(v>=1024&&i<u.length-1){v/=1024;i++}return`${v>=10||i===0?v.toFixed(0):v.toFixed(1)} ${u[i]}`}
async function sha256File(file){const d=await crypto.subtle.digest("SHA-256",await file.arrayBuffer());return Array.from(new Uint8Array(d)).map(b=>b.toString(16).padStart(2,"0")).join("")}
function assetContextForRecord(rec,role="GALLERY"){
  const root=ROOT_BY_ENTITY[rec.entityType]||"SKANDI";
  const folder=root==="SKANDI"?(LABEL[rec.entityType]||rec.entityType||"Inventory"):(rec.name||rec.code||`Draft ${rec.entityType}`);
  const subfolder=root==="SKANDI"?(rec.name||rec.code||"General"):"";
  return{visibility:"PUBLIC",assetType:"IMAGE",libraryRoot:root,libraryFolder:folder,librarySubfolder:subfolder,category:role,brand:"SKANDI",system:"Inventory Control",contextSystem:"Inventory Control",contextRecordType:rec.entityType,contextRecordId:rec.id||"",fieldName:"media",role};
}
function assetContextForAircraft(boot,aircraft,category,fieldName,subfolder=""){
  const airline=(boot.airlines||[]).find(x=>x.id===aircraft.airlineId||x.code===aircraft.airlineCode);
  const airlineName=airline?.name||aircraft.airlineCode||"Unknown Airline";
  return{visibility:"PUBLIC",assetType:"IMAGE",libraryRoot:"AIRLINES",libraryFolder:airlineName,librarySubfolder:["Aircraft",aircraft.aircraftName||aircraft.aircraftCode||"Aircraft",subfolder].filter(Boolean).join(" / "),category,brand:"SKANDI",system:"Inventory Control",contextSystem:"Inventory Control",contextRecordType:"AIRCRAFT",contextRecordId:aircraft.id||"",fieldName,role:category};
}
function AssetCard({asset,onUse,onOpen,manageOnly=false}){
  const preview=asset.previewUrl||asset.publicUrl||"";
  return html`<div className="assetcard"><div className="assetthumb">${asset.assetType==="IMAGE"&&preview?html`<img src=${preview} alt=${asset.altText||asset.displayName||""}/>`:html`<span className="assettype">${asset.assetType==="DOCUMENT"?"DOC":asset.assetType||"FILE"}</span>`}</div>
    <div className="assetbody"><div className="assetname" title=${asset.displayName}>${asset.displayName||asset.originalName}</div><div className="assetpath">${asset.folderPath||`${asset.libraryRoot} / ${asset.libraryFolder}`}</div>
      <div className="assetbadges"><span className=${`badge ${asset.visibility==="PRIVATE"?"private":"public"}`}>${asset.visibility}</span><span className="badge">${humanBytes(asset.sizeBytes)}</span>${asset.isKnownDuplicate?html`<span className="badge dup">Duplicate ×${asset.duplicateCount}</span>`:null}${asset.source==="LEGACY_STORAGE_INDEX"?html`<span className="badge">Legacy indexed</span>`:null}</div>
      <div className="assetactions">${!manageOnly&&onUse?html`<button className="btn small primary" onClick=${()=>onUse(asset)}>Use Asset</button>`:null}${onOpen?html`<button className="btn small" onClick=${()=>onOpen(asset)}>Open</button>`:null}</div>
    </div></div>`
}
const ASSET_CATEGORIES=["General","PRIMARY","HERO","CARD","MOBILE","GALLERY","OG","LOGO","MAP","ROOM","THUMBNAIL","AIRCRAFT","CABIN","WALKTHROUGH","HOTSPOT","DOCUMENT","FORM"];
function AssetLibraryModal({context,onClose,onSelect,manageOnly=false,setBusy,setToast}){
  const [assets,setAssets]=useState([]),[search,setSearch]=useState("");
  const [root,setRoot]=useState(context?.libraryRoot||"SKANDI"),[folder,setFolder]=useState(context?.libraryFolder||""),[subfolder,setSubfolder]=useState(context?.librarySubfolder||""),[category,setCategory]=useState(context?.category||"");
  const [visibility,setVisibility]=useState(context?.visibility||"PUBLIC"),[assetType,setAssetType]=useState(context?.assetType||"");
  const [file,setFile]=useState(null),[hash,setHash]=useState(""),[dup,setDup]=useState(null),[uploading,setUploading]=useState(false),[page,setPage]=useState(1);
  const locked=!!context?.lockedContext;
  async function load(){
    try{const r=await request("INVENTORY_ASSET_LIST",{visibility:visibility||undefined,assetType:assetType||undefined,libraryRoot:root||undefined,...(locked&&folder?{libraryFolder:folder}:{} )});setAssets(r.assets||[]);setPage(1)}
    catch(e){setToast(e.message,true)}
  }
  useEffect(()=>{load()},[root,visibility,assetType]);
  async function chooseFile(f){
    setFile(f||null);setDup(null);setHash("");if(!f)return;
    try{setUploading(true);const digest=await sha256File(f);setHash(digest);const r=await request("INVENTORY_ASSET_CHECK_DUPLICATE",{sha256:digest,sizeBytes:f.size,mimeType:f.type,originalName:f.name});
      if((r.exactDuplicates||[]).length)setDup({exact:r.exactDuplicates,possible:[]});else if((r.possibleLegacyDuplicates||[]).length)setDup({exact:[],possible:r.possibleLegacyDuplicates})}
    catch(e){setToast(e.message,true)}finally{setUploading(false)}
  }
  async function openAsset(asset){
    try{
      if(asset.publicUrl){window.open(asset.publicUrl,"_blank","noopener,noreferrer");return}
      const result=await request("INVENTORY_ASSET_ACCESS_URL",{assetId:asset.id,expiresIn:600});
      if(result.url)window.open(result.url,"_blank","noopener,noreferrer");
    }catch(e){setToast(e.message,true)}
  }
  async function upload(allowPossibleDuplicate=false){
    if(!file)return setToast("Choose a file first.",true);if(!root||!folder)return setToast("Choose an Asset Library root and folder.",true);
    try{setUploading(true);setBusy("Uploading to SKANDI Asset Library…");const digest=hash||await sha256File(file);
      const prep=await request("INVENTORY_ASSET_PREPARE_UPLOAD",{file:{name:file.name,type:file.type,size:file.size},sha256:digest,visibility,assetType:assetType||undefined,libraryRoot:root,libraryFolder:folder,librarySubfolder:subfolder,category,brand:context?.brand||"SKANDI",system:context?.system||"Inventory Control",contextSystem:context?.contextSystem||"Inventory Control",contextRecordType:context?.contextRecordType||"",contextRecordId:context?.contextRecordId||"",fieldName:context?.fieldName||"",role:context?.role||category,allowPossibleDuplicate});
      if(prep.duplicate){setDup({exact:prep.exactDuplicates||[],possible:[]});return}if(prep.needsReview){setDup({exact:[],possible:prep.possibleLegacyDuplicates||[]});return}
      const response=await fetch(prep.upload.signedUrl,{method:"PUT",headers:{"content-type":file.type,"cache-control":`max-age=${prep.upload.cacheControl||3600}`,"x-upsert":"false"},body:file});
      if(!response.ok)throw new Error(`Asset upload failed (${response.status}).`);
      const done=await request("INVENTORY_ASSET_FINALIZE_UPLOAD",{requestId:prep.requestId});if(!done.asset)throw new Error("Asset uploaded but could not be registered.");
      setToast(done.duplicate?"That file already existed. Reusing the existing asset.":"Asset uploaded and registered.");await load();
      if(!manageOnly&&onSelect){onSelect(done.asset);onClose()}else{setFile(null);setHash("");setDup(null)}
    }catch(e){setToast(e.message,true)}finally{setBusy("");setUploading(false)}
  }
  const folders=[...new Set(assets.map(a=>text(a.libraryFolder).trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
  const subfolders=[...new Set(assets.filter(a=>!folder||a.libraryFolder===folder).map(a=>text(a.librarySubfolder).trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
  const categories=[...new Set([...ASSET_CATEGORIES,...assets.filter(a=>(!folder||a.libraryFolder===folder)&&(!subfolder||a.librarySubfolder===subfolder)).map(a=>text(a.category).trim()).filter(Boolean)])].sort((a,b)=>a.localeCompare(b));
  const folderOptions=optionList([{value:"",label:"All folders"},...folders.map(v=>({value:v,label:v}))],folder);
  const subfolderOptions=optionList([{value:"",label:"All / no subfolder"},...subfolders.map(v=>({value:v,label:v}))],subfolder);
  const categoryOptions=optionList([{value:"",label:"All categories"},...categories.map(v=>({value:v,label:v}))],category);
  const filtered=assets.filter(a=>(!folder||a.libraryFolder===folder)&&(!subfolder||a.librarySubfolder===subfolder)&&(!category||a.category===category)&&(!search||[a.displayName,a.originalName,a.folderPath,a.category,...(a.tags||[])].join(" ").toLowerCase().includes(search.toLowerCase())));
  const pageSize=100,totalPages=Math.max(1,Math.ceil(filtered.length/pageSize)),safePage=Math.min(page,totalPages),pageAssets=filtered.slice((safePage-1)*pageSize,safePage*pageSize);
  return html`<${Modal} title=${manageOnly?"SKANDI Asset Library":"Choose from SKANDI Asset Library"} onClose=${onClose} wide=${true}>
    <div className="notice">Existing assets are always shown before upload. Reuse an existing file whenever possible; exact SHA-256 duplicates are blocked.</div>
    <div className="assetfilters" style=${{marginTop:"12px"}}>
      <${Field} label="Library Root" type="select" options=${ASSET_ROOTS} value=${root} disabled=${locked} onChange=${v=>{setRoot(v);if(!locked){setFolder("");setSubfolder("");setCategory("")}setPage(1)}}/>
      <${Field} label="Folder" type="select" options=${folderOptions} value=${folder} disabled=${locked} onChange=${v=>{setFolder(v);setSubfolder("");setPage(1)}}/><${Field} label="Subfolder" type="select" options=${subfolderOptions} value=${subfolder} disabled=${locked} onChange=${v=>{setSubfolder(v);setPage(1)}}/><${Field} label="Category" type="select" options=${categoryOptions} value=${category} disabled=${locked} onChange=${v=>{setCategory(v);setPage(1)}}/>
      ${manageOnly?html`<${Field} label="Visibility" type="select" options=${["PUBLIC","PRIVATE"]} value=${visibility} onChange=${v=>{setVisibility(v);setPage(1)}}/>`:null}
      ${manageOnly?html`<${Field} label="File Type" type="select" options=${[{value:"",label:"All"},...["IMAGE","DOCUMENT","FORM","VIDEO","AUDIO","OTHER"]]} value=${assetType} onChange=${v=>{setAssetType(v);setPage(1)}}/>`:null}
      <div className="field full"><label>Search Existing Assets</label><div className="toolbar"><input className="input" value=${search} onInput=${e=>{setSearch(e.target.value);setPage(1)}} placeholder="Name, folder, tag…"/><button className="btn" onClick=${load}>Refresh</button></div></div>
    </div>
    <div className="paneltitle"><span>Available Assets · ${filtered.length}</span><span className="assetfolder">${root}${folder?` → ${folder}`:""}${subfolder?` → ${subfolder}`:""}</span></div>
    <${Pagination} page=${safePage} totalPages=${totalPages} total=${filtered.length} pageSize=${pageSize} onPage=${setPage}/>
    ${pageAssets.length?html`<div className="assetgrid">${pageAssets.map(a=>html`<${AssetCard} asset=${a} onUse=${onSelect} onOpen=${openAsset} manageOnly=${manageOnly}/>` )}</div>`:html`<div className="empty">No existing assets match these filters.</div>`}
    <${Pagination} page=${safePage} totalPages=${totalPages} total=${filtered.length} pageSize=${pageSize} onPage=${setPage}/>
    <div className="assetsection"><div className="uploadzone"><strong>Upload only if the file is not already available</strong>
      ${manageOnly&&!locked?html`<div className="notice">Choose the business folder above, e.g. AIRLINES → British Airways or SKANDI → Marketing.</div>`:null}
      <input className="fileinput" type="file" accept=${assetType==="IMAGE"?"image/*":undefined} onChange=${e=>chooseFile(e.target.files?.[0]||null)}/>
      ${file?html`<div><b>${file.name}</b> · ${humanBytes(file.size)} · ${file.type||"unknown type"}</div>`:null}${uploading?html`<div className="sub">Checking file and Asset Library…</div>`:null}
      ${dup?.exact?.length?html`<div className="dupbox"><b>Exact file already exists.</b><div className="sub">Upload is disabled. Use the existing asset.</div><div className="assetgrid" style=${{marginTop:"8px"}}>${dup.exact.map(a=>html`<${AssetCard} asset=${a} onUse=${onSelect} onOpen=${openAsset} manageOnly=${manageOnly}/>` )}</div></div>`:null}
      ${dup?.possible?.length?html`<div className="dupbox"><b>Possible legacy duplicate found.</b><div className="sub">Check these older files before creating another copy.</div><div className="assetgrid" style=${{marginTop:"8px"}}>${dup.possible.map(a=>html`<${AssetCard} asset=${a} onUse=${onSelect} onOpen=${openAsset} manageOnly=${manageOnly}/>` )}</div><div className="assetactions"><button className="btn" onClick=${()=>upload(true)}>I checked — upload as new anyway</button></div></div>`:null}
      ${file&&!dup?.exact?.length&&!dup?.possible?.length?html`<button className="btn cyan" disabled=${uploading} onClick=${()=>upload(false)}>Upload to ${visibility==="PRIVATE"?"Private":"Public"} Asset Library</button>`:null}
    </div></div>
  <//>`
}
function AssetField({label,value,assetId,context,onSelect,setBusy,setToast,help=""}){
  const [open,setOpen]=useState(false);
  return html`<div className="field full"><label>${label}</label><div className="assetcurrent">${value?html`<div className="preview"><img src=${value} alt=${label}/></div>`:html`<div className="preview">No asset selected</div>`}
    <div className="toolbar"><button className="btn" onClick=${()=>setOpen(true)}>${value?"Replace / Browse Asset Library":"Browse Asset Library / Upload"}</button>${value?html`<span className="sub">${assetId?"Managed Asset Library file":"Legacy linked image — replace through Asset Library when edited"}</span>`:null}</div>${help?html`<small>${help}</small>`:null}</div>
    ${open?html`<${AssetLibraryModal} context=${{...context,lockedContext:true}} onClose=${()=>setOpen(false)} onSelect=${a=>{onSelect(a);setOpen(false)}} setBusy=${setBusy} setToast=${setToast}/>`:null}
  </div>`
}
function AssetLibraryPanel({setBusy,setToast}){
  const [open,setOpen]=useState(false),[snapshot,setSnapshot]=useState(null);
  async function load(){try{setBusy("Loading Asset Library…");setSnapshot(await request("INVENTORY_ASSET_LIST",{}))}catch(e){setToast(e.message,true)}finally{setBusy("")}}
  useEffect(()=>{load()},[]);
  const assets=snapshot?.assets||[],publicCount=assets.filter(a=>a.visibility==="PUBLIC").length,privateCount=assets.filter(a=>a.visibility==="PRIVATE").length,duplicates=assets.filter(a=>a.isKnownDuplicate).length;
  return html`<div className="card panel"><div className="assetlibraryhero"><div><div className="eyebrow">PLATFORM STANDARD</div><div className="sectiontitle">SKANDI Asset Library</div><div className="sub">Search, upload and manage SKANDI files.</div></div><div className="toolbar"><button className="btn" onClick=${load}>Refresh</button><button className="btn primary" onClick=${()=>setOpen(true)}>Open Library / Upload</button></div></div>
    <div className="stats" style=${{marginTop:"14px"}}><div className="stat"><span>Indexed Assets</span><strong>${assets.length}</strong></div><div className="stat"><span>Public</span><strong>${publicCount}</strong></div><div className="stat"><span>Private</span><strong>${privateCount}</strong></div><div className="stat"><span>Known Duplicate Rows</span><strong>${duplicates}</strong></div><div className="stat"><span>Folder Roots</span><strong>${snapshot?.roots?.length||0}</strong></div></div>
    <div className="notice">New files must be organized by business meaning, e.g. AIRLINES → British Airways, HOTELS → Scandic Continental, DESTINATIONS → Stockholm, or SKANDI → Marketing.</div>
    ${open?html`<${AssetLibraryModal} context=${{libraryRoot:"SKANDI",libraryFolder:"",visibility:"PUBLIC",assetType:""}} manageOnly=${true} onClose=${()=>{setOpen(false);load()}} setBusy=${setBusy} setToast=${setToast}/>`:null}
  </div>`
}


function RecordEditor({bundle,languages,records,onClose,onSaved,setBusy,setToast}){
  const [draft,setDraft]=useState(()=>clone(bundle));
  const [tab,setTab]=useState("identity");
  const [lang,setLang]=useState(languages?.[0]||"EN");
  const [assetPicker,setAssetPicker]=useState(null);
  const [assetUrl,setAssetUrl]=useState("");const [assetRole,setAssetRole]=useState("GALLERY");const [assetAlt,setAssetAlt]=useState("");
  const rec=draft.record;
  const refs=records||[];
  const update=(path,value)=>setDraft(d=>{const n=clone(d);setPath(n.record,path,value);return n});
  const localized=useMemo(()=>{const a=(draft.localizedContent||[]).map(normalizeLocalized);for(const l of languages||[])if(!a.some(x=>x.language===l))a.push(normalizeLocalized({language:l}));return a},[draft.localizedContent,languages]);
  const currentLang=localized.find(x=>x.language===lang)||localized[0]||normalizeLocalized({language:lang});
  const updateLang=(key,value)=>setDraft(d=>{const rows=(d.localizedContent||[]).map(normalizeLocalized);let i=rows.findIndex(x=>x.language===lang);if(i<0){rows.push(normalizeLocalized({language:lang}));i=rows.length-1}rows[i]={...rows[i],[key]:value};return{...d,localizedContent:rows}});
  const media=(draft.media||[]).map(normalizeMedia);
  const relations=(draft.relations||[]).map(normalizeRelation);
  const catalog=draft.catalog||{catalogType:"NONE",partnerTier:"",searchable:false,featured:false,homepageFeatured:false,searchPriority:rec.sortPriority||100,searchKeywords:[],marketCodes:["ALL"],salesChannels:["WEB"],publicLabel:"",badge:"",validFrom:"",validTo:"",notes:"",active:true};
  const setCatalog=(k,v)=>setDraft(d=>({...d,catalog:{...(d.catalog||catalog),[k]:v}}));
  const parentOptions=[{value:"",label:"None"},...refs.filter(x=>x.id!==rec.id&&["COUNTRY","DESTINATION","AREA"].includes(x.entityType)).map(x=>({value:x.id,label:`${x.entityType} · ${x.name}`}))];
  const supplierOptions=[{value:"",label:"None"},...refs.filter(x=>x.entityType==="SUPPLIER").map(x=>({value:x.id,label:x.name}))];


  const detailKnown=[...knownSectionKeys(rec.entityType,"details"),"logoLockupUrl","logoSymbolUrl","logoUrl","logoIconUrl","heroImageUrl","imageUrl","mediaAssets","media_assets","duffel"];
  const commercialKnown=knownSectionKeys(rec.entityType,"commercial");
  const operationsKnown=knownSectionKeys(rec.entityType,"operations");
  const setSection=(key,next)=>setDraft(d=>({...d,record:{...d.record,[key]:next}}));
  function addUrlAsset(){
    const url=text(assetUrl).trim();
    if(!/^https?:\/\//i.test(url)){setToast("Enter a valid https:// or http:// asset URL.",true);return}
    const next=normalizeMedia({role:assetRole||"GALLERY",url,altText:text(assetAlt).trim(),sourceKind:"URL",active:true,sortOrder:(media.length+1)*10,payload:{source:"MANUAL_URL"}});
    setDraft(d=>({...d,media:[...(d.media||[]),next]}));setAssetUrl("");setAssetAlt("");setToast("Asset URL added. Save the record to persist it.");
  }
  function useRecordAsset(index,asset,isNew=false){
    setDraft(d=>{
      const rows=(d.media||[]).map(normalizeMedia);
      const prior=isNew?normalizeMedia({role:"GALLERY",sortOrder:(rows.length+1)*10}):rows[index];
      const next={...prior,url:asset.publicUrl||asset.previewUrl||"",storageBucket:asset.bucket,storagePath:asset.storagePath,sourceKind:"ASSET_LIBRARY",altText:prior.altText||asset.altText||asset.displayName||"",payload:{...(prior.payload||{}),assetId:asset.id,assetCode:asset.assetCode}};
      if(isNew)rows.push(next);else rows[index]=next;
      return{...d,media:rows};
    });
    setAssetPicker(null);
  }
  async function save(status){
    try{
      setBusy("Saving complete record bundle…");
      const payload=clone(draft);
      payload.record.status=status;
      payload.record.details={...(payload.record.details||{})};
      for(const key of ["logoLockupUrl","logoSymbolUrl","logoUrl","logoIconUrl","heroImageUrl","imageUrl","mediaAssets","media_assets"])delete payload.record.details[key];
      payload.localizedContent=localized;
      payload.media=media;
      payload.relations=relations;
      payload.catalog=catalog.catalogType==="NONE"?{...catalog,catalogType:"NONE"}:catalog;
      const result=await request("INVENTORY_V9_SAVE_BUNDLE",{bundle:payload});
      const saved=result?.bundle?.record||result?.record||payload.record;
      const savedMedia=result?.bundle?.media||payload.media||[];
      for(const m of savedMedia){const assetId=m?.payload?.assetId||m?.assetId;if(assetId&&saved?.id)try{await request("INVENTORY_ASSET_REGISTER_USAGE",{assetId,system:"Inventory Control",recordType:saved.entityType||rec.entityType,recordId:saved.id,usageRole:m.role||m.media_type||"MEDIA",fieldName:"inventory_media_assets"})}catch(_){}}
      onSaved(result);setToast("Record, content, media, relations, catalog and Asset Library links saved together.");onClose();
    }catch(e){setToast(e.message,true)}finally{setBusy("")}
  }


  const tabs=["identity","details","commercial","operations","content","media","relations","catalog","publishing"];
  return html`<${Modal} title=${`${rec.entityType} · ${rec.name||"New record"}`} onClose=${onClose} wide=${true}
    actions=${html`<button className="btn small" onClick=${()=>save(rec.status||"DRAFT")}>Save</button><button className="btn small" onClick=${()=>save("REVIEW")}>Review</button><button className="btn small cyan" onClick=${()=>save("PUBLISHED")}>Publish</button>`}>
    <div className="tabs">${tabs.map(t=>html`<button className=${`tab ${tab===t?"active":""}`} onClick=${()=>setTab(t)}>${t[0].toUpperCase()+t.slice(1)}</button>`)}</div>
    ${tab==="identity"?html`<div className="formgrid three">
      <${Field} label="Record Type" value=${rec.entityType} disabled=${true}/>
      <${Field} label=${rec.entityType==="AIRPORT"?"IATA Code":rec.entityType==="AIRLINE"?"IATA Code":"System Code"} value=${rec.code} onChange=${v=>update("code",v)}/>
      <${Field} label="Master Name / Title" value=${rec.name} onChange=${v=>update("name",v)}/>
      <${Field} label="URL Slug" value=${rec.slug} onChange=${v=>update("slug",v)} help="Leave blank to generate from the title."/>
      <${Field} label="Public ID" value=${rec.publicId} onChange=${()=>{}} disabled=${true} help=${rec.id?"Assigned by SKANDI TRAVELS.":"Assigned when the record is saved."}/>
      <${Field} label="Status" type="select" options=${STATUS} value=${rec.status||"DRAFT"} onChange=${v=>update("status",v)}/>
      <${Field} label="Sort Priority" type="number" value=${rec.sortPriority} onChange=${v=>update("sortPriority",v)}/>
      ${["DESTINATION","AREA"].includes(rec.entityType)?html`<${Field} label="Parent Geography" type="select" options=${parentOptions} value=${rec.parentEntityId||""} onChange=${v=>update("parentEntityId",v)} />`:null}
      ${SELLABLE.has(rec.entityType)?html`<${Field} label="Supplier" type="select" options=${supplierOptions} value=${rec.supplierEntityId||""} onChange=${v=>update("supplierEntityId",v)} />`:null}
      <${Toggle} label="Active" value=${rec.active!==false} onChange=${v=>update("active",v)}/>
      <${Toggle} label="Customer Visible" value=${rec.customerVisible===true} onChange=${v=>update("customerVisible",v)}/>
      <${Toggle} label="Staff Visible" value=${rec.staffVisible!==false} onChange=${v=>update("staffVisible",v)}/>
      <${Toggle} label="ALTEA Visible" value=${rec.alteaVisible!==false} onChange=${v=>update("alteaVisible",v)}/>
    </div>`:null}
    ${tab==="details"?html`<div>
      <div className="notice">Complete the fields needed for this record.</div>
      <div style=${{marginTop:"12px"}}><${ExplicitSchemaEditor} type=${rec.entityType} section="details" record=${rec} update=${update} records=${refs}/></div>
      <div className="hr"></div><div className="sectiontitle">Additional Stored Fields</div>
      <${SmartObjectEditor} value=${rec.details||{}} exclude=${detailKnown} onChange=${v=>setSection("details",v)}/>
    </div>`:null}
    ${tab==="commercial"?html`<div>
      <${ExplicitSchemaEditor} type=${rec.entityType} section="commercial" record=${rec} update=${update} records=${refs}/>
      <div className="hr"></div><div className="sectiontitle">Additional Commercial Fields</div>
      <${SmartObjectEditor} value=${rec.commercial||{}} exclude=${commercialKnown} onChange=${v=>setSection("commercial",v)}/>
    </div>`:null}
    ${tab==="operations"?html`<div>
      <${ExplicitSchemaEditor} type=${rec.entityType} section="operations" record=${rec} update=${update} records=${refs}/>
      <div className="hr"></div><div className="sectiontitle">Additional Operational Fields</div>
      <${SmartObjectEditor} value=${rec.operations||{}} exclude=${operationsKnown} onChange=${v=>setSection("operations",v)}/>
    </div>`:null}
    ${tab==="content"?html`<div>
      <div className="langtabs">${languages.map(l=>html`<button className=${`lang ${lang===l?"active":""}`} onClick=${()=>setLang(l)}>${l}</button>`)}</div>
      <div className="formgrid">
        <${Field} label="Page Title" value=${currentLang.title} onChange=${v=>updateLang("title",v)}/>
        <${Field} label="Eyebrow" value=${currentLang.eyebrow} onChange=${v=>updateLang("eyebrow",v)}/>
        <${Field} label="Short Description" type="textarea" value=${currentLang.shortDescription} onChange=${v=>updateLang("shortDescription",v)} full=${true}/>
        <${Field} label="Full Description" type="textarea" value=${currentLang.fullDescription} onChange=${v=>updateLang("fullDescription",v)} full=${true}/>
        <${ListField} key=${lang} label="Highlights — one per line" value=${currentLang.highlights} onChange=${v=>updateLang("highlights",v)}/>
        <${Field} label="Important Information" type="textarea" value=${currentLang.importantInformation} onChange=${v=>updateLang("importantInformation",v)}/>
        <${Field} label="SEO Title" value=${currentLang.seoTitle} onChange=${v=>updateLang("seoTitle",v)}/>
        <${Field} label="SEO Description" type="textarea" value=${currentLang.seoDescription} onChange=${v=>updateLang("seoDescription",v)}/>
      </div>
    </div>`:null}
    ${tab==="media"?html`<div>
      <div className="paneltitle"><span>Assets</span><button className="btn small" onClick=${()=>setAssetPicker({index:-1,isNew:true,context:assetContextForRecord(rec,"GALLERY")})}>+ Browse / Upload Asset</button></div>
      <div className="notice">Choose an image from Asset Library or add an image link. Supplier-managed images are updated during refresh.</div>
      <div className="asseturladd"><${Field} label="Asset URL" type="url" value=${assetUrl} onChange=${setAssetUrl}/><${Field} label="Role" type="select" options=${["PRIMARY","HERO","CARD","MOBILE","GALLERY","OG","LOGO","MAP","ROOM","THUMBNAIL"]} value=${assetRole} onChange=${setAssetRole}/><${Field} label="Alt Text" value=${assetAlt} onChange=${setAssetAlt}/><button className="btn primary" onClick=${addUrlAsset}>Add URL Asset</button></div>
      ${media.length?media.map((m,i)=>{const providerOwned=(m.payload?.provider||m.source)==="DUFFEL";return html`<div className=${`mediaitem ${providerOwned?"providerowned":""}`}><div className="formgrid three">
        <${Field} label="Role" type="select" options=${["PRIMARY","HERO","CARD","MOBILE","GALLERY","OG","LOGO","MAP","ROOM","THUMBNAIL"]} value=${m.role} disabled=${providerOwned} onChange=${v=>setDraft(d=>{const x=[...(d.media||[])];x[i]={...x[i],role:v};return{...d,media:x}})}/>
        <${Field} label="Alt Text" value=${m.altText} onChange=${v=>setDraft(d=>{const x=[...(d.media||[])];x[i]={...x[i],altText:v};return{...d,media:x}})}/>
        <${Field} label="Caption" value=${m.caption||""} onChange=${v=>setDraft(d=>{const x=[...(d.media||[])];x[i]={...x[i],caption:v};return{...d,media:x}})}/>
        <${Field} label="Credit" value=${m.credit||""} onChange=${v=>setDraft(d=>{const x=[...(d.media||[])];x[i]={...x[i],credit:v};return{...d,media:x}})}/>
        <${Field} label="Focal X %" type="number" value=${m.focalX??""} onChange=${v=>setDraft(d=>{const x=[...(d.media||[])];x[i]={...x[i],focalX:v};return{...d,media:x}})}/>
        <${Field} label="Focal Y %" type="number" value=${m.focalY??""} onChange=${v=>setDraft(d=>{const x=[...(d.media||[])];x[i]={...x[i],focalY:v};return{...d,media:x}})}/>
      </div><div className="assetcurrent" style=${{marginTop:"8px"}}>${m.url?html`<div className="preview"><img src=${m.url} alt=${m.altText||""}/></div>`:html`<div className="preview">No asset selected</div>`}<div className="toolbar">${providerOwned?html`<span className="providersource">${catalog.catalogType==="SKANDI_PARTNER"?"SKANDI Partner-managed image":"Supplier-managed image"}</span>`:html`<button className="btn small" onClick=${()=>setAssetPicker({index:i,isNew:false,context:assetContextForRecord(rec,m.role||"GALLERY")})}>Replace / Browse Asset Library</button>`}<span className="sub">${m.assetId||m.sourceKind==="ASSET_LIBRARY"?"Managed Asset Library file":m.sourceKind==="URL"?"URL asset":"Linked image"}</span>${providerOwned?null:html`<button className="btn small danger" onClick=${()=>setDraft(d=>({...d,media:(d.media||[]).filter((_,x)=>x!==i)}))}>Remove from record</button>`}</div></div></div>`}):html`<div className="empty">No assets attached. Add a URL or browse the Asset Library.</div>`}
      ${assetPicker?html`<${AssetLibraryModal} context=${{...assetPicker.context,lockedContext:true}} onClose=${()=>setAssetPicker(null)} onSelect=${asset=>useRecordAsset(assetPicker.index,asset,assetPicker.isNew)} setBusy=${setBusy} setToast=${setToast}/>`:null}
    </div>`:null}
    ${tab==="relations"?html`<div>
      <div className="paneltitle"><span>Relations</span><button className="btn small" onClick=${()=>setDraft(d=>({...d,relations:[...(d.relations||[]),normalizeRelation({})]}))}>+ Add Relation</button></div>
      ${relations.length?relations.map((r,i)=>html`<div className="relitem"><div className="formgrid three">
        <${Field} label="Relation Type" value=${r.relationType} onChange=${v=>setDraft(d=>{const a=[...(d.relations||[])];a[i]={...a[i],relationType:v};return{...d,relations:a}})}/>
        <${Field} label="Target Record" type="select" options=${[{value:"",label:"Choose…" },...refs.filter(x=>x.id!==rec.id).map(x=>({value:x.id,label:`${x.entityType} · ${x.name}`}))]} value=${r.targetEntityId||r.targetRecordId||""} onChange=${v=>setDraft(d=>{const a=[...(d.relations||[])];const target=refs.find(x=>x.id===v);a[i]={...a[i],targetEntityId:target&&!["AIRPORT","AIRLINE"].includes(target.entityType)?v:"",targetRecordType:target&&["AIRPORT","AIRLINE"].includes(target.entityType)?target.entityType:"",targetRecordId:target&&["AIRPORT","AIRLINE"].includes(target.entityType)?v:""};return{...d,relations:a}})}/>
        <button className="btn danger" onClick=${()=>setDraft(d=>({...d,relations:(d.relations||[]).filter((_,x)=>x!==i)}))}>Remove</button>
      </div></div>`):html`<div className="empty">No relations.</div>`}
    </div>`:null}
    ${tab==="catalog"?html`<div className="formgrid three">
      <${Field} label="Website Placement" type="select" options=${[{value:"NONE",label:"None"},{value:"SKANDI_COLLECTION",label:"SKANDI TRAVELS"},{value:"SKANDI_PARTNER",label:"SKANDI Partner"}]} value=${catalog.catalogType||"NONE"} onChange=${v=>setCatalog("catalogType",v)}/>
      <${Field} label="Partner Tier" value=${catalog.partnerTier||""} onChange=${v=>setCatalog("partnerTier",v)}/>
      <${Field} label="Search Priority" type="number" value=${catalog.searchPriority??100} onChange=${v=>setCatalog("searchPriority",v)}/>
      <${Toggle} label="Searchable" value=${catalog.searchable===true} onChange=${v=>setCatalog("searchable",v)}/>
      <${Toggle} label="Featured" value=${catalog.featured===true} onChange=${v=>setCatalog("featured",v)}/>
      <${Toggle} label="Homepage Featured" value=${catalog.homepageFeatured===true} onChange=${v=>setCatalog("homepageFeatured",v)}/>
      <${Field} label="Public Label" value=${catalog.publicLabel||""} onChange=${v=>setCatalog("publicLabel",v)}/>
      <${Field} label="Badge" value=${catalog.badge||""} onChange=${v=>setCatalog("badge",v)}/>
      <${ListField} label="Search Keywords — comma separated" value=${catalog.searchKeywords} separator=", " onChange=${v=>setCatalog("searchKeywords",v)} full=${true}/>
      <${ListField} label="Market Codes — comma separated" value=${catalog.marketCodes} separator=", " onChange=${v=>setCatalog("marketCodes",v)}/>
      <${ListField} label="Sales Channels — comma separated" value=${catalog.salesChannels} separator=", " onChange=${v=>setCatalog("salesChannels",v)}/>
      <${Toggle} label="Active Placement" value=${catalog.active!==false} onChange=${v=>setCatalog("active",v)}/>
    </div>`:null}
    ${tab==="publishing"?html`<div>
      <div className="formgrid three">
        <${Field} label="SEO Title" value=${rec.seo?.title||rec.seo?.seoTitle||""} onChange=${v=>update("seo.title",v)}/>
        <${Field} label="Website Address" type="url" value=${rec.seo?.canonicalUrl||""} onChange=${v=>update("seo.canonicalUrl",v)}/>
        <${Toggle} label="Exclude from Search Engines" value=${rec.seo?.noIndex===true} onChange=${v=>update("seo.noIndex",v)}/>
        <${Field} label="SEO Description" type="textarea" value=${rec.seo?.description||rec.seo?.seoDescription||""} onChange=${v=>update("seo.description",v)} full=${true}/>
        <${ListField} label="SEO Keywords — one per line" value=${rec.seo?.keywords} onChange=${v=>update("seo.keywords",v)}/>
        <${Field} label="Review Status" type="select" options=${SMART_ENUMS.reviewstatus} value=${rec.publication?.reviewStatus||"NOT_REVIEWED"} onChange=${v=>update("publication.reviewStatus",v)}/>
        <${Field} label="Publish Date" type="date" value=${rec.publication?.publishAt||""} onChange=${v=>update("publication.publishAt",v)}/>
        <${Field} label="Unpublish Date" type="date" value=${rec.publication?.unpublishAt||""} onChange=${v=>update("publication.unpublishAt",v)}/>
        <${Field} label="Content Owner" value=${rec.publication?.owner||""} onChange=${v=>update("publication.owner",v)}/>
        <${Field} label="Approved By" value=${rec.publication?.approvedBy||""} onChange=${v=>update("publication.approvedBy",v)}/>
        <${Field} label="Source" type="select" options=${(smartOptions("source",rec.source||"SKANDI")||[]).map(value=>({value,label:sourceDisplayLabel(value)}))} value=${rec.source||"SKANDI"} onChange=${v=>update("source",v)}/>
        <${Field} label="Source Reference" value=${rec.sourceReference||""} onChange=${v=>update("sourceReference",v)}/>
      </div>
      <div className="hr"></div><div className="sectiontitle">Additional SEO Fields</div>
      <${SmartObjectEditor} value=${rec.seo||{}} exclude=${["title","seoTitle","canonicalUrl","noIndex","description","seoDescription","keywords"]} onChange=${v=>setSection("seo",v)}/>
      <div className="hr"></div><div className="sectiontitle">Additional Publication Fields</div>
      <${SmartObjectEditor} value=${rec.publication||{}} exclude=${["reviewStatus","publishAt","unpublishAt","owner","approvedBy"]} onChange=${v=>setSection("publication",v)}/>
    </div>`:null}
  <//>`;
}




function safeUrl(url){const v=text(url);return /^https?:\/\//i.test(v)?v:""}
function ProviderDetailGrid({resource,type}){
  const rows=[];
  const add=(label,value,kind="text")=>{if(value===undefined||value===null||value===""||(Array.isArray(value)&&!value.length))return;rows.push({label,value,kind})};
  add("Supplier Reference",resource?.id);
  add("Name",resource?.name);
  add("IATA code",resource?.iataCode);
  add("ICAO code",resource?.icaoCode);
  add("Country",resource?.iataCountryCode||resource?.location?.address?.countryCode);
  add("City",resource?.cityName||resource?.location?.address?.cityName);
  add("Time zone",resource?.timeZone);
  add("Latitude",resource?.latitude??resource?.location?.latitude);
  add("Longitude",resource?.longitude??resource?.location?.longitude);
  add("Rating",resource?.rating);
  add("Review score",resource?.reviewScore);
  add("Review count",resource?.reviewCount);
  add("Brand",resource?.brand?.name);
  add("Brand ID",resource?.brand?.id);
  add("Chain",resource?.chain?.name);
  add("Chain ID",resource?.chain?.id);
  add("Loyalty programme",resource?.supportedLoyaltyProgramme);
  add("Phone",resource?.phoneNumber);
  add("Email",resource?.email);
  add("Conditions of carriage",resource?.conditionsOfCarriageUrl,"url");
  add("Logo symbol",resource?.logoSymbolUrl,"url");
  add("Logo lockup",resource?.logoLockupUrl,"url");
  add("Airports",Array.isArray(resource?.airports)?resource.airports.map(x=>`${x.iataCode||""} ${x.name||""}`.trim()).join(", "):"");
  add("Address",resource?.location?.address?[resource.location.address.lineOne,resource.location.address.cityName,resource.location.address.region,resource.location.address.postalCode,resource.location.address.countryCode].filter(Boolean).join(", "):"");
  return html`<div className="detailgrid">${rows.map(r=>html`<div className="detailcell"><small>${r.label}</small><div>${r.kind==="url"&&safeUrl(r.value)?html`<a href=${r.value} target="_blank" rel="noreferrer">${r.value}</a>`:text(r.value)}</div></div>`)}</div>`
}

function ProviderWorkspace({boot,setBoot,setBusy,setToast,masterFilter,setView}){
  const [mode,setMode]=useState("collection");
  const [resourceType,setResourceType]=useState("HOTEL");
  const [query,setQuery]=useState("");
  const [results,setResults]=useState([]);
  const [detail,setDetail]=useState(null);
  const [editor,setEditor]=useState(null);
  const [destinationId,setDestinationId]=useState("");
  const [areaId,setAreaId]=useState("");
  const [countryId,setCountryId]=useState("");
  const [rates,setRates]=useState([]);
  const [rateEdit,setRateEdit]=useState(null);
  const [rateLookup,setRateLookup]=useState("");
  const [rateLookupResults,setRateLookupResults]=useState([]);
  const destinations=(boot.records||[]).filter(r=>r.entityType==="DESTINATION"&&r.status!=="ARCHIVED");
  const areas=(boot.records||[]).filter(r=>r.entityType==="AREA"&&r.status!=="ARCHIVED");
  const countries=(boot.records||[]).filter(r=>r.entityType==="COUNTRY"&&r.status!=="ARCHIVED");
  const typeOptions=[["HOTEL","Hotels"],["AIRLINE","Airlines"],["AIRPORT","Airports"],["DESTINATION","Destinations / Cities"],["AIRCRAFT","Aircraft reference"]];
  const providerMatchesScope=!masterFilter||["HOTEL","AIRLINE","AIRPORT","DESTINATION"].includes(masterFilter);
  useEffect(()=>{
    if(masterFilter&&masterFilter!=="HOTEL")setMode("collection");
    if(["HOTEL","AIRLINE","AIRPORT","DESTINATION"].includes(masterFilter)){
      setResourceType(masterFilter);setResults([]);setDetail(null);
    }
  },[masterFilter]);


  async function search(){
    if(!providerMatchesScope)return setToast("Select Hotels, Airlines, Airports, Destinations or All to search suppliers.",true);
    if(resourceType==="HOTEL"&&query.trim().length<3)return setToast("Enter at least 3 characters for a hotel search.",true);
    if(["AIRPORT","DESTINATION"].includes(resourceType)&&!query.trim())return setToast("Enter an airport, city or IATA code.",true);
    try{setBusy(`Searching ${resourceType.toLowerCase()}…`);const r=await request("INVENTORY_PROVIDER_SEARCH",{resourceType,query:query.trim(),limit:60});setResults(r.items||[]);setDetail(null);if(!(r.items||[]).length)setToast("No matching results found.")}catch(e){setToast(e.message,true)}finally{setBusy("")}
  }
  async function inspect(item){
    try{setBusy("Loading supplier details…");const r=await request("INVENTORY_PROVIDER_GET_RESOURCE",{resourceType:item.entityType,providerId:item.providerId});setDetail(r)}catch(e){setToast(e.message,true)}finally{setBusy("")}
  }
  async function openExisting(item){
    const existing=item?.existingRecord;if(!existing?.id)return;
    if(item.entityType==="HOTEL"){setView("property");return}
    try{setBusy("Opening record…");const r=await request("INVENTORY_V9_GET_RECORD",{id:existing.id,entityType:item.entityType});setEditor(r)}catch(e){setToast(e.message,true)}finally{setBusy("")}
  }
  async function importItem(item,{linkExisting=false}={}){
    if(item.entityType==="AIRCRAFT")return setToast("Aircraft is reference-only here. Use Aircraft & Cabin Studio for SKANDI aircraft configuration.",true);
    if(item.importSupported===false)return setToast("This record cannot be added.",true);
    if(linkExisting&&!confirm(`Link ${item.name} to the existing SKANDI ${item.entityType.toLowerCase()} record?`))return;
    if(!linkExisting&&!confirm(`Add ${item.name} to Travel Inventory as a draft?`))return;
    const payload={resourceType:item.entityType,providerId:item.providerId,linkExisting};
    if(item.entityType==="HOTEL"){if(destinationId)payload.destinationId=destinationId;if(areaId)payload.areaId=areaId}
    if(item.entityType==="DESTINATION"&&countryId)payload.parentEntityId=countryId;
    try{
      setBusy(linkExisting?"Linking supplier record…":"Adding to Travel Inventory…");
      const r=await request("INVENTORY_PROVIDER_IMPORT",payload);
      if(r.conflict){setToast("A matching SKANDI record already exists. Use Link Supplier instead.",true);return}
      setToast(r.alreadyExists?"This record is already in Travel Inventory.":(r.linked?"Supplier information linked to the SKANDI record.":"Added to Travel Inventory as a draft."));
      const record=r.bundle?.record||r.bundle?.bundle?.record;
      if(record?.id){
        if(item.entityType==="HOTEL"){
          const snapshot=await request("INVENTORY_V9_REFRESH",{});
          setBoot(snapshot);
          setView("property");
        }else{const full=await request("INVENTORY_V9_GET_RECORD",{id:record.id,entityType:item.entityType});setEditor(full)}
      }
      const refreshed=await request("INVENTORY_PROVIDER_SEARCH",{resourceType,query:query.trim(),limit:60});setResults(refreshed.items||[]);
    }catch(e){setToast(e.message,true)}finally{setBusy("")}
  }
  async function refreshSource(item){
    const existing=item?.existingRecord;if(!existing?.id)return;
    if(!confirm(`Update supplier details for ${existing.name||item.name}? SKANDI edits will be kept.`))return;
    try{setBusy("Updating supplier details…");await request("INVENTORY_PROVIDER_REFRESH",{entityType:item.entityType,id:existing.id});setToast("Supplier details updated. SKANDI edits were kept.");const r=await request("INVENTORY_PROVIDER_SEARCH",{resourceType,query:query.trim(),limit:60});setResults(r.items||[])}catch(e){setToast(e.message,true)}finally{setBusy("")}
  }
  async function loadRates(){
    try{setBusy("Loading negotiated rates…");const r=await request("INVENTORY_NEGOTIATED_RATES_LIST",{limit:200});setRates(r.items||[])}catch(e){setToast(e.message,true)}finally{setBusy("")}
  }
  useEffect(()=>{if(mode==="rates"&&!rates.length)loadRates()},[mode]);
  function newRate(){setRateEdit({id:"",displayName:"",rateAccessCode:"",liveMode:false,scope:"accommodations",chainId:"",accommodationIds:[]})}
  async function editRate(row){
    try{setBusy("Loading negotiated rate…");const r=await request("INVENTORY_NEGOTIATED_RATE_GET",{id:row.id});const x=r.item||row;setRateEdit({...x,scope:x.chainId?"chain":"accommodations",accommodationIds:x.accommodationIds||[]})}catch(e){setToast(e.message,true)}finally{setBusy("")}
  }
  async function saveRate(){
    const x=rateEdit||{};const payload={id:x.id,displayName:x.displayName,rateAccessCode:x.rateAccessCode};
    if(x.scope==="chain")payload.chainId=x.chainId;else payload.accommodationIds=x.accommodationIds||[];
    try{setBusy(x.id?"Updating negotiated rate…":"Creating negotiated rate…");await request(x.id?"INVENTORY_NEGOTIATED_RATE_UPDATE":"INVENTORY_NEGOTIATED_RATE_CREATE",payload);setRateEdit(null);setRateLookupResults([]);setToast(x.id?"Negotiated rate updated.":"Negotiated rate created.");await loadRates()}catch(e){setToast(e.message,true)}finally{setBusy("")}
  }
  async function deleteRate(row){
    if(!confirm(`Delete negotiated rate ${row.displayName}? This changes the supplier rate setup.`))return;
    try{setBusy("Deleting negotiated rate…");await request("INVENTORY_NEGOTIATED_RATE_DELETE",{id:row.id});setToast("Negotiated rate deleted.");await loadRates()}catch(e){setToast(e.message,true)}finally{setBusy("")}
  }
  async function searchRateHotels(){
    if(rateLookup.trim().length<3)return setToast("Enter at least 3 characters to find a hotel.",true);
    try{setBusy("Searching hotels…");const r=await request("INVENTORY_PROVIDER_SEARCH",{resourceType:"HOTEL",query:rateLookup.trim(),limit:25});setRateLookupResults(r.items||[])}catch(e){setToast(e.message,true)}finally{setBusy("")}
  }
  async function chooseRateHotel(item,scope){
    try{
      setBusy("Loading hotel source details…");const r=await request("INVENTORY_PROVIDER_GET_RESOURCE",{resourceType:"HOTEL",providerId:item.providerId});const hotel=r.resource||{};
      if(scope==="chain"){
        if(!hotel.chain?.id)return setToast("No chain reference was found for this hotel.",true);
        setRateEdit(x=>({...x,scope:"chain",chainId:hotel.chain.id,accommodationIds:[]}));setToast(`Using chain ${hotel.chain.name||hotel.chain.id}.`)
      }else{
        setRateEdit(x=>({...x,scope:"accommodations",chainId:"",accommodationIds:Array.from(new Set([...(x.accommodationIds||[]),item.providerId]))}));setToast(`${item.name} added to the negotiated-rate scope.`)
      }
    }catch(e){setToast(e.message,true)}finally{setBusy("")}
  }
  function removeAccommodation(id){setRateEdit(x=>({...x,accommodationIds:(x.accommodationIds||[]).filter(v=>v!==id)}))}


  const detailItem=detail?.item||null, detailResource=detail?.resource||null;
  return html`<div>
    <div className="providerhero"><div><h2>Supplier Directory</h2><p>Find and manage supplier records.</p></div></div>
    <div className="tabs">${[["collection","Add to Inventory"],["rates","Negotiated Hotel Rates"]].map(([k,l])=>html`<button className=${`tab ${mode===k?"active":""}`} disabled=${k==="rates"&&Boolean(masterFilter)&&masterFilter!=="HOTEL"} onClick=${()=>setMode(k)}>${l}</button>`)}</div>
    ${!providerMatchesScope?html`<div className="notice warn">Select a supported category to search suppliers. Hotels are managed in Property Director.</div>`:null}


    ${mode==="collection"?html`<div className="grid">
      <div className="card panel"><div className="paneltitle"><span>Find a Supplier</span><span className="matchtag duffel">Supplier</span></div>
        <div className="formgrid three"><${Field} label="Resource type" type="select" value=${resourceType} options=${typeOptions.map(([value,label])=>({value,label}))} disabled=${Boolean(masterFilter)} onChange=${v=>{setResourceType(v);setResults([]);setDetail(null)}}/><${Field} label="Search" full=${true} value=${query} onChange=${setQuery} help=${resourceType==="HOTEL"?"Hotel name, city or property search term":"Name, city, IATA/ICAO or aircraft code"}/><div className="field"><label>Search Supplier</label><button className="btn primary" disabled=${!providerMatchesScope} onClick=${search}>Search</button></div></div>
        ${resourceType==="DESTINATION"?html`<div className="scopebox" style=${{marginTop:"10px"}}><div className="sectiontitle">Import geography</div><div className="field"><label>Parent country for new SKANDI destination</label><select className="select" value=${countryId} onChange=${e=>setCountryId(e.target.value)}><option value="">No parent yet · keep Draft</option>${countries.map(r=>html`<option value=${r.id}>${r.code} · ${r.name}</option>`)}</select></div></div>`:null}
        ${resourceType==="HOTEL"?html`<div className="scopebox" style=${{marginTop:"10px"}}><div className="sectiontitle">Optional SKANDI geography</div><div className="formgrid"><div className="field"><label>Destination</label><select className="select" value=${destinationId} onChange=${e=>setDestinationId(e.target.value)}><option value="">Assign later</option>${destinations.map(r=>html`<option value=${r.id}>${r.code} · ${r.name}</option>`)}</select></div><div className="field"><label>Area / Resort</label><select className="select" value=${areaId} onChange=${e=>setAreaId(e.target.value)}><option value="">Assign later</option>${areas.map(r=>html`<option value=${r.id}>${r.code} · ${r.name}</option>`)}</select></div></div></div>`:null}
      </div>
      <div className="card panel"><div className="paneltitle"><span>Search results</span><span className="pill">${results.length}</span></div>
        ${results.length?html`<div className="tablewrap"><table className="table"><thead><tr><th>Resource</th><th>Code</th><th>Supplier Reference</th><th>Status</th><th></th></tr></thead><tbody>${results.map(item=>html`<tr><td><div className="providerresult"><div className="providerlogo">${item.preview?.logoSymbolUrl?html`<img src=${item.preview.logoSymbolUrl}/>`:html`<b>${item.code||item.entityType.slice(0,3)}</b>`}</div><div><b>${item.name||"Unnamed resource"}</b><div className="sub">${item.secondary||resourceTypeDisplay(item.entityType||item.providerResourceType)}</div></div></div></td><td><b>${item.code||"—"}</b></td><td>${item.providerId}</td><td>${item.alreadyInSkandiCollection?html`<span className="matchtag collection">${item.existingRecord?.collectionType==="SKANDI_PARTNER"?"SKANDI Partner":"In Inventory"}</span>`:item.canonicalMatch?html`<span className="matchtag match">Existing record</span>`:item.importSupported===false?html`<span className="matchtag block">Reference only</span>`:html`<span className="matchtag duffel">${item.existingRecord?.collectionType==="SKANDI_PARTNER"?"SKANDI Partner":"Supplier only"}</span>`}</td><td><div className="provideractions"><button className="btn small" onClick=${()=>inspect(item)}>Details</button>${item.alreadyInSkandiCollection?html`<button className="btn small" onClick=${()=>openExisting(item)}>Open</button><button className="btn small" onClick=${()=>refreshSource(item)}>Refresh</button>`:item.canonicalMatch?html`<button className="btn small cyan" onClick=${()=>importItem(item,{linkExisting:true})}>Link Supplier</button>`:item.importSupported!==false?html`<button className="btn small primary" onClick=${()=>importItem(item)}>Add to Inventory</button>`:null}</div></td></tr>`)}</tbody></table></div>`:html`<div className="empty">Search Supplier to find hotels, airlines, airports, destinations/cities or aircraft references.</div>`}
      </div>
    </div>`:null}


    ${mode==="rates"?html`<div className="grid"><div className="card panel"><div className="paneltitle"><span>Negotiated hotel rates</span><div className="toolbar"><button className="btn" onClick=${loadRates}>Refresh</button><button className="btn primary" onClick=${newRate}>+ Negotiated Rate</button></div></div><div className="notice">Manage negotiated hotel rates.</div><div className="tablewrap" style=${{marginTop:"12px"}}><table className="table"><thead><tr><th>Display name</th><th>RAC</th><th>Environment</th><th>Scope</th><th>Supplier Reference</th><th></th></tr></thead><tbody>${rates.length?rates.map(r=>html`<tr><td><b>${r.displayName}</b></td><td>${r.rateAccessCode}</td><td>${r.liveMode?"LIVE":"TEST"}</td><td>${r.chainId?`Chain · ${r.chainId}`:`${(r.accommodationIds||[]).length} accommodation(s)`}</td><td>${r.id}</td><td><div className="provideractions"><button className="btn small" onClick=${()=>editRate(r)}>Edit</button><button className="btn small danger" onClick=${()=>deleteRate(r)}>Delete</button></div></td></tr>`):html`<tr><td colSpan="6"><div className="empty">No negotiated rates found.</div></td></tr>`}</tbody></table></div></div></div>`:null}


    ${detail?html`<${Modal} title=${`Supplier Details · ${detailItem?.name||detailResource?.name||resourceType}`} onClose=${()=>setDetail(null)} actions=${html`<button className="btn" onClick=${()=>setDetail(null)}>Close</button>`}><div className="notice">Review the supplier details before adding or linking the record.</div><div className="hr"></div><${ProviderDetailGrid} resource=${detailResource||detailItem?.preview||{}} type=${detail?.entityType||resourceType}/>${detailResource?.description?html`<div><div className="hr"></div><div className="sectiontitle">Supplier description</div><div className="notice">${detailResource.description}</div></div>`:null}</${Modal}>`:null}


    ${editor&&editor?.record?.entityType!=="HOTEL"&&editor?.bundle?.record?.entityType!=="HOTEL"?html`<${RecordEditor} bundle=${editor.bundle||editor} languages=${boot.languages||["EN"]} records=${boot.records||[]} onClose=${()=>setEditor(null)} onSaved=${()=>{}} setBusy=${setBusy} setToast=${setToast}/>`:null}


    ${rateEdit?html`<${Modal} title=${rateEdit.id?"Edit Negotiated Hotel Rate":"Create Negotiated Hotel Rate"} onClose=${()=>{setRateEdit(null);setRateLookupResults([])}} actions=${html`<button className="btn" onClick=${()=>{setRateEdit(null);setRateLookupResults([])}}>Cancel</button><button className="btn primary" onClick=${saveRate}>${rateEdit.id?"Save Changes":"Create Rate"}</button>`}><div className="formgrid three"><${Field} label="Display name" value=${rateEdit.displayName} onChange=${v=>setRateEdit(x=>({...x,displayName:v}))}/><${Field} label="Rate access code (RAC)" value=${rateEdit.rateAccessCode} disabled=${Boolean(rateEdit.id)} onChange=${v=>setRateEdit(x=>({...x,rateAccessCode:v.toUpperCase()}))} help=${rateEdit.id?"The rate access code cannot be changed after creation.":"Provided by the hotel/chain."}/><${Field} label="Scope" type="select" value=${rateEdit.scope} options=${[{value:"accommodations",label:"Specific accommodations"},{value:"chain",label:"Hotel chain"}]} onChange=${v=>setRateEdit(x=>({...x,scope:v,chainId:v==="chain"?x.chainId:"",accommodationIds:v==="accommodations"?x.accommodationIds:[]}))}/></div>
      <div className="scopebox" style=${{marginTop:"12px"}}><div className="sectiontitle">Find hotel / chain</div><div className="filters"><div className="field grow"><label>Hotel search</label><input className="input" value=${rateLookup} onInput=${e=>setRateLookup(e.target.value)} placeholder="Search hotel or chain"/></div><button className="btn" onClick=${searchRateHotels}>Search hotels</button></div>${rateLookupResults.length?html`<div className="tablewrap" style=${{marginTop:"10px"}}><table className="table"><thead><tr><th>Hotel</th><th>Supplier Reference</th><th></th></tr></thead><tbody>${rateLookupResults.map(item=>html`<tr><td><b>${item.name}</b><div className="sub">${item.secondary}</div></td><td>${item.providerId}</td><td><div className="provideractions"><button className="btn small" onClick=${()=>chooseRateHotel(item,"accommodations")}>Add Hotel</button><button className="btn small" onClick=${()=>chooseRateHotel(item,"chain")}>Use Its Chain</button></div></td></tr>`)}</tbody></table></div>`:null}</div>
      ${rateEdit.scope==="chain"?html`<div className="field" style=${{marginTop:"12px"}}><label>Chain Reference</label><input className="input" value=${rateEdit.chainId||""} onInput=${e=>setRateEdit(x=>({...x,chainId:e.target.value}))} placeholder="chn_…"/><small>Choose a hotel to use its chain.</small></div>`:html`<div style=${{marginTop:"12px"}}><${ListField} label="Hotel References" value=${rateEdit.accommodationIds} splitPattern=${/[\r\n,]+/} onChange=${v=>setRateEdit(x=>({...x,accommodationIds:v}))} placeholder="acc_… one per line"/><div className="selectedlist">${(rateEdit.accommodationIds||[]).map(id=>html`<span className="selectedchip">${id}<button onClick=${()=>removeAccommodation(id)}>×</button></span>`)}</div></div>`}
      <div className="notice" style=${{marginTop:"12px"}}>Enter a name and rate access code, then choose a hotel or chain.</div></${Modal}>`:null}
  </div>`
}


function MasterRecords({boot,setBoot,setBusy,setToast,masterFilter,setMasterFilter,setView}){
  const type=masterFilter;
  const setType=next=>{setMasterFilter(next);if(next==="HOTEL")setView("property")};
  useEffect(()=>{if(type==="HOTEL")setView("property")},[type,setView]);
  const [tourSubtype,setTourSubtype]=useState("");
  const [statusFilter,setStatusFilter]=useState("");
  const [customerFilter,setCustomerFilter]=useState("");
  const [alteaFilter,setAlteaFilter]=useState("");
  const [sortBy,setSortBy]=useState("UPDATED_DESC");
  const [search,setSearch]=useState("");
  const [page,setPage]=useState(1);
  const [editor,setEditor]=useState(null);
  const [createPicker,setCreatePicker]=useState(false);
  const [createType,setCreateType]=useState("");
  const createTypeLabels={COUNTRY:"Country",DESTINATION:"Destination",AREA:"Area / Resort",AIRPORT:"Airport",AIRLINE:"Airline",SUPPLIER:"Supplier",HOTEL:"Hotel",GUIDED_TOUR:"Guided Tour",ACTIVITY:"Activity",PARTNER_TICKET:"Partner Ticket",TRANSFER:"Transfer",CAR_RENTAL:"Car Rental",PACKAGE:"Package",ANCILLARY:"Ancillary"};
  const matchesType=r=>r.entityType!=="HOTEL"&&(!type||(type==="TOURS_ACTIVITIES"?["GUIDED_TOUR","ACTIVITY"].includes(r.entityType)&&(!tourSubtype||r.entityType===tourSubtype):r.entityType===type));
  const filtered=(boot.records||[]).filter(r=>matchesType(r)&&(!statusFilter||r.status===statusFilter)&&(!customerFilter||(customerFilter==="YES"?r.customerVisible===true:r.customerVisible!==true))&&(!alteaFilter||(alteaFilter==="YES"?r.alteaVisible===true:r.alteaVisible!==true))&&(!search||[r.code,r.name,r.slug,r.entityType,r.status].join(" ").toLowerCase().includes(search.toLowerCase())));
  const records=[...filtered].sort((a,b)=>sortBy==="TITLE_ASC"?text(a.name).localeCompare(text(b.name)):sortBy==="CODE_ASC"?text(a.code).localeCompare(text(b.code)):sortBy==="TYPE_ASC"?`${a.entityType}|${a.name}`.localeCompare(`${b.entityType}|${b.name}`):text(b.updatedAt).localeCompare(text(a.updatedAt)));
  const pageSize=100,totalPages=Math.max(1,Math.ceil(records.length/pageSize)),safePage=Math.min(page,totalPages),pageRecords=records.slice((safePage-1)*pageSize,safePage*pageSize);
  async function open(r){
    if(r.entityType==="HOTEL"){setView("property");return}
    try{setBusy("Loading complete record…");const x=await request("INVENTORY_V9_GET_RECORD",{id:r.id,entityType:r.entityType});setEditor(x)}catch(e){setToast(e.message,true)}finally{setBusy("")}
  }
  async function archived(r,e){
    e.stopPropagation();if(r.entityType==="HOTEL"){setView("property");return}
    if(!confirm(`Archive ${r.name}?`))return;
    try{setBusy("Archiving record…");await request("INVENTORY_V9_ARCHIVE_RECORD",{id:r.id,entityType:r.entityType});setToast("Record archived.")}catch(err){setToast(err.message,true)}finally{setBusy("")}
  }
  function startCreate(){
    if(type==="HOTEL"){setView("property");return}
    if(type){setEditor(recordBundle(type));return}
    setCreateType("");
    setCreatePicker(true);
  }
  function confirmCreate(){
    if(createType==="HOTEL"){setCreatePicker(false);setMasterFilter("HOTEL");setView("property");return}
    if(!createType)return setToast("Choose a record type.",true);
    setCreatePicker(false);
    setType(createType);
    setTourSubtype("");
    setPage(1);
    setEditor(recordBundle(createType));
  }
  const createButtons=type==="HOTEL"
    ?html`<button className="btn primary" onClick=${()=>setView("property")}>Open Property Director</button>`
    :type==="TOURS_ACTIVITIES"
    ?html`<div className="toolbar"><button className="btn primary" onClick=${()=>setEditor(recordBundle("GUIDED_TOUR"))}>+ New Guided Tour</button><button className="btn primary" onClick=${()=>setEditor(recordBundle("ACTIVITY"))}>+ New Activity</button></div>`
    :html`<button className="btn primary" onClick=${startCreate}>+ New ${type?(createTypeLabels[type]||LABEL[type]||type):"Record"}</button>`;
  return html`<div className="card panel">
    <div className="paneltitle"><span>Travel Inventory</span>${createButtons}</div>
    <div className="notice">Hotels are managed in Property Director.</div>
    <div className="filters"><div className="field w240"><label>Record Family</label><select className="select" value=${type} onChange=${e=>{setType(e.target.value);setTourSubtype("");setPage(1)}}><option value="">All</option>${MASTER_FILTERS.map(t=>html`<option value=${t}>${MASTER_FILTER_LABEL[t]}</option>`)}</select></div>${type==="TOURS_ACTIVITIES"?html`<div className="field w240"><label>Product Type</label><select className="select" value=${tourSubtype} onChange=${e=>{setTourSubtype(e.target.value);setPage(1)}}><option value="">All Tours & Activities</option><option value="GUIDED_TOUR">Guided Tour</option><option value="ACTIVITY">Activity</option></select></div>`:null}<div className="field w180"><label>Status</label><select className="select" value=${statusFilter} onChange=${e=>{setStatusFilter(e.target.value);setPage(1)}}><option value="">All statuses</option>${STATUS.map(s=>html`<option value=${s}>${s}</option>`)}</select></div><div className="field w180"><label>Customer Visible</label><select className="select" value=${customerFilter} onChange=${e=>{setCustomerFilter(e.target.value);setPage(1)}}><option value="">All</option><option value="YES">Yes</option><option value="NO">No</option></select></div><div className="field w180"><label>ALTEA Visible</label><select className="select" value=${alteaFilter} onChange=${e=>{setAlteaFilter(e.target.value);setPage(1)}}><option value="">All</option><option value="YES">Yes</option><option value="NO">No</option></select></div><div className="field w240"><label>Sort</label><select className="select" value=${sortBy} onChange=${e=>{setSortBy(e.target.value);setPage(1)}}><option value="UPDATED_DESC">Recently updated</option><option value="TITLE_ASC">Title A–Z</option><option value="CODE_ASC">Code A–Z</option><option value="TYPE_ASC">Type / Title</option></select></div><div className="field grow"><label>Search</label><input className="input" value=${search} onInput=${e=>{setSearch(e.target.value);setPage(1)}} placeholder="Code, title, slug, type or status"/></div></div>
    <${Pagination} page=${safePage} totalPages=${totalPages} total=${records.length} pageSize=${pageSize} onPage=${setPage}/>
    <div className="tablewrap"><table className="table"><thead><tr><th>Type</th><th>Code</th><th>Title</th><th>Status</th><th>Customer</th><th>ALTEA</th><th>Updated</th><th></th></tr></thead><tbody>
      ${pageRecords.length?pageRecords.map(r=>html`<tr className="clickrow" onClick=${()=>open(r)}><td>${r.entityType==="GUIDED_TOUR"?"Guided Tour":r.entityType==="ACTIVITY"?"Activity":r.entityType}</td><td><b>${r.code}</b></td><td>${r.name}</td><td>${statusPill(r.status)}</td><td>${r.customerVisible?"Yes":"No"}</td><td>${r.alteaVisible?"Yes":"No"}</td><td>${text(r.updatedAt).slice(0,10)}</td><td><button className="btn small danger" onClick=${e=>archived(r,e)}>Archive</button></td></tr>`):html`<tr><td colSpan="8"><div className="empty">No matching records.</div></td></tr>`}
    </tbody></table></div>
    <${Pagination} page=${safePage} totalPages=${totalPages} total=${records.length} pageSize=${pageSize} onPage=${setPage}/>
    ${createPicker?html`<${Modal} title="Add Inventory Record" onClose=${()=>setCreatePicker(false)} actions=${html`<button className="btn small primary" onClick=${confirmCreate}>Continue</button>`}>
      <div className="formgrid"><${Field} label="Record Type" type="select" options=${TYPES.filter(t=>t!=="HOTEL").map(t=>({value:t,label:createTypeLabels[t]||LABEL[t]||t}))} value=${createType} onChange=${setCreateType} help="Choose the Inventory record family to add. The existing record editor opens as a Draft."/></div>
    <//>`:null}
    ${editor?html`<${RecordEditor} bundle=${editor.bundle||editor} languages=${boot.languages||["EN"]} records=${boot.records||[]} onClose=${()=>setEditor(null)} onSaved=${()=>{}} setBusy=${setBusy} setToast=${setToast}/>`:null}
  </div>`
}


function DatedInventory({boot,setBusy,setToast}){
  const [family,setFamily]=useState("");
  const [entity,setEntity]=useState("");
  const [edit,setEdit]=useState(null);
  const [liveDated,setLiveDated]=useState(()=>Array.isArray(boot.dated)?boot.dated:[]);
  const [lastSync,setLastSync]=useState(null);
  const syncInFlight=useRef(false);
  const mountedRef=useRef(true);
  const allSellable=(boot.records||[]).filter(r=>SELLABLE.has(r.entityType));
  const matchesFamily=r=>!family||(family==="TOURS_ACTIVITIES"?["GUIDED_TOUR","ACTIVITY"].includes(r.entityType):r.entityType===family);
  const sellable=allSellable.filter(matchesFamily);
  const rows=liveDated.filter(r=>{
    if(entity)return r.entityId===entity;
    if(!family)return true;
    const product=allSellable.find(x=>x.id===r.entityId);return product&&matchesFamily(product);
  });
  const master=allSellable.find(r=>r.id===entity);


  async function loadDated({silent=false,entityId=entity}={}){
    if(syncInFlight.current)return;
    syncInFlight.current=true;
    try{
      if(!silent)setBusy("Refreshing dated capacity…");
      const result=await request("INVENTORY_V9_GET_DATED",entityId?{entityId}:{});
      const next=Array.isArray(result?.inventory)?result.inventory:Array.isArray(result?.dated)?result.dated:[];
      if(mountedRef.current){setLiveDated(next);setLastSync(new Date())}
    }catch(e){
      if(!silent&&mountedRef.current)setToast(e.message,true);
    }finally{
      syncInFlight.current=false;
      if(!silent&&mountedRef.current)setBusy("");
    }
  }


  useEffect(()=>{
    setLiveDated(Array.isArray(boot.dated)?boot.dated:[]);
  },[boot.dated]);


  useEffect(()=>{
    mountedRef.current=true;
    loadDated({silent:true,entityId:entity});
    const timer=setInterval(()=>loadDated({silent:true,entityId:entity}),15000);
    const onFocus=()=>loadDated({silent:true,entityId:entity});
    const onVisibility=()=>{if(document.visibilityState==="visible")loadDated({silent:true,entityId:entity})};
    window.addEventListener("focus",onFocus);
    document.addEventListener("visibilitychange",onVisibility);
    return()=>{
      mountedRef.current=false;
      clearInterval(timer);
      window.removeEventListener("focus",onFocus);
      document.removeEventListener("visibilitychange",onVisibility);
    };
  },[entity]);


  async function save(){
    try{
      setBusy("Saving dated inventory…");
      await request("INVENTORY_V9_SAVE_DATED",{row:edit});
      setEdit(null);
      await loadDated({silent:true,entityId:entity});
      setToast("Dated inventory saved.");
    }catch(e){setToast(e.message,true)}finally{setBusy("")}
  }
  async function del(row){
    if(!confirm("Delete this dated inventory row?"))return;
    try{
      setBusy("Deleting dated inventory…");
      await request("INVENTORY_V9_DELETE_DATED",{id:row.id});
      await loadDated({silent:true,entityId:entity});
      setToast("Dated inventory deleted.");
    }catch(e){setToast(e.message,true)}finally{setBusy("")}
  }
  const newRow=()=>{if(!entity)return setToast("Choose a product first.",true);setEdit({id:"",entityId:entity,inventoryType:master?.entityType||"GENERAL",serviceDate:"",startTime:"",endTime:"",variantCode:"",variantName:"",capacityTotal:0,held:0,sold:0,waitlistLimit:0,overbookingLimit:0,stopSale:false,blackout:false,status:"OPEN",supplierCost:0,publicPrice:0,adultPrice:0,childPrice:0,infantPrice:0,privatePrice:0,currency:"USD",priceBasis:"PER_PERSON",bookingCutoffHours:0,minStay:0,maxStay:0,releaseDays:0,supplierReference:"",payload:{}})};
  return html`<div className="card panel"><div className="paneltitle"><span>${family==="TOURS_ACTIVITIES"?"Tours & Activities Inventory":"Dated Capacity & Pricing"}</span><div className="toolbar"><span className="sub">${lastSync?`Live · ${lastSync.toLocaleTimeString([], {hour:"2-digit",minute:"2-digit",second:"2-digit"})}`:"Live sync starting…"}</span><button className="btn" onClick=${()=>loadDated({silent:false,entityId:entity})}>Refresh Capacity</button><button className="btn primary" onClick=${newRow}>+ Add Date / Variant</button></div></div>
    <div className="filters"><div className="field w240"><label>Product Family</label><select className="select" value=${family} onChange=${e=>{setFamily(e.target.value);setEntity("")}}><option value="">All sellable products</option><option value="HOTEL">Hotels</option><option value="TOURS_ACTIVITIES">Tours & Activities</option><option value="PARTNER_TICKET">Partner Tickets</option><option value="TRANSFER">Transfers</option><option value="CAR_RENTAL">Car Rental</option><option value="PACKAGE">Packages</option><option value="ANCILLARY">Ancillaries</option></select></div><div className="field grow"><label>Product</label><select className="select" value=${entity} onChange=${e=>setEntity(e.target.value)}><option value="">All in selected family</option>${sellable.map(r=>html`<option value=${r.id}>${r.entityType==="GUIDED_TOUR"?"Guided Tour":r.entityType==="ACTIVITY"?"Activity":r.entityType} · ${r.name}</option>`)}</select></div></div>
    <div className="tablewrap"><table className="table"><thead><tr><th>Date</th><th>Product</th><th>Variant</th><th>Capacity</th><th>Held</th><th>Sold</th><th>Available</th><th>Price</th><th>Status</th><th></th></tr></thead><tbody>
      ${rows.length?rows.map(r=>html`<tr className="clickrow" onClick=${()=>setEdit(clone(r))}><td>${r.serviceDate}</td><td>${(boot.records||[]).find(x=>x.id===r.entityId)?.name||r.entityId}</td><td>${r.variantName||r.variantCode||"Default"}</td><td>${r.capacityTotal??0}</td><td>${r.held??0}</td><td>${r.sold??0}</td><td><b>${r.available??0}</b></td><td>${r.publicPrice??r.adultPrice??0} ${r.currency||""}</td><td>${statusPill(r.status)}</td><td><button className="btn small danger" onClick=${e=>{e.stopPropagation();del(r)}}>Delete</button></td></tr>`):html`<tr><td colSpan="10"><div className="empty">No dated inventory exists yet. Zero rows is a valid state until capacity is loaded.</div></td></tr>`}
    </tbody></table></div>
    ${edit?html`<${Modal} title="Dated Inventory" onClose=${()=>setEdit(null)} actions=${html`<button className="btn small cyan" onClick=${save}>Save</button>`}><div className="formgrid three">
      ${[["Service Date","serviceDate","date"],["Start Time","startTime","time"],["End Time","endTime","time"],["Variant Code","variantCode"],["Variant Name","variantName"],["Capacity Total","capacityTotal","number"],["Held","held","number"],["Sold","sold","number"],["Waitlist Limit","waitlistLimit","number"],["Overbooking Limit","overbookingLimit","number"],["Public Price","publicPrice","number"],["Adult Price","adultPrice","number"],["Child Price","childPrice","number"],["Infant Price","infantPrice","number"],["Private Price","privatePrice","number"],["Supplier Cost","supplierCost","number"],["Currency","currency","select",ENUM.currency],["Price Basis","priceBasis","select",ENUM.priceBasis],["Booking Cutoff Hours","bookingCutoffHours","number"],["Minimum Stay","minStay","number"],["Maximum Stay","maxStay","number"],["Release Days","releaseDays","number"],["Supplier Reference","supplierReference"]].map(([label,k,t="text",opts=[]])=>html`<${Field} label=${label} type=${t} options=${opts} value=${edit[k]??""} onChange=${v=>setEdit(x=>({...x,[k]:v}))}/>`)}
      <${Toggle} label="Stop Sale" value=${edit.stopSale===true} onChange=${v=>setEdit(x=>({...x,stopSale:v}))}/><${Toggle} label="Blackout" value=${edit.blackout===true} onChange=${v=>setEdit(x=>({...x,blackout:v}))}/>
    </div><div className="notice" style=${{marginTop:"12px"}}>Available units and status are calculated when you save.</div><div className="hr"></div><div className="sectiontitle">Additional Dated Inventory Controls</div><${SmartObjectEditor} value=${edit.payload||{}} onChange=${v=>setEdit(x=>({...x,payload:v}))}/></${Modal}>`:null}
  </div>`
}
function AirInventory({boot,setBusy,setToast}){
  const [kind,setKind]=useState("flight");
  const [edit,setEdit]=useState(null);
  const data=kind==="flight"?boot.air?.flight:kind==="class"?boot.air?.classes:kind==="schedule"?boot.air?.schedule:boot.air?.nesting;
  const configs={
    flight:[["flight_number","Flight"],["departure_date","Date"],["board_point","Origin"],["off_point","Destination"],["equipment_type","Equipment"],["physical_capacity","Capacity"],["yield_index","Yield Index"],["control_mode","Control Mode"],["revenue_band","Revenue Band"],["status","Status"]],
    class:[["flight_number","Flight"],["departure_date","Date"],["board_point","Origin"],["off_point","Destination"],["class_code","Class"],["cabin","Cabin"],["nest","Nest"],["authorized","Authorized"],["sold","Sold"],["available","Available"],["overbooking_limit","Overbooking"],["status","Status"]],
    schedule:[["season_code","Season"],["flight_number","Flight"],["days_of_operation","Days"],["board_point","Origin"],["off_point","Destination"],["via_point","Via"],["std","STD"],["sta","STA"],["equipment_type","Equipment"],["capacity","Capacity"],["effective_date","Effective"],["discontinue_date","Discontinue"],["status","Status"]],
    nesting:[["flight_number","Flight"],["departure_date","Date"],["board_point","Origin"],["off_point","Destination"],["class_code","Class"],["cabin","Cabin"],["nest","Nest"],["parent_class","Parent Class"],["bid_price","Bid Price"],["hurdle","Hurdle"],["authorized","Authorized"],["protection","Protection"],["status","Status"]]
  };
  const cols=configs[kind],rows=data||[];
  const airports=(boot.records||[]).filter(r=>r.entityType==="AIRPORT");
  const airportOptions=(current)=>optionList(airports.map(a=>({value:a.code,label:`${a.code} · ${a.name}`})),current);
  const equipmentOptions=(current)=>optionList([...new Map((boot.aircraft||[]).filter(a=>a.aircraftCode).map(a=>[a.aircraftCode,{value:a.aircraftCode,label:`${a.aircraftCode} · ${a.aircraftName||a.variant||"Aircraft"}`}])).values()],current);
  function editorFor(k,l){
    const value=edit[k]??"";
    if(["board_point","off_point","via_point"].includes(k))return html`<${Field} label=${l} type="select" options=${airportOptions(value)} value=${value} onChange=${v=>setEdit(x=>({...x,[k]:v}))}/>`;
    if(k==="equipment_type")return html`<${Field} label=${l} type="select" options=${equipmentOptions(value)} value=${value} onChange=${v=>setEdit(x=>({...x,[k]:v}))}/>`;
    if(k==="cabin")return html`<${Field} label=${l} type="select" options=${optionList(["FIRST","BUSINESS","PREMIUM_ECONOMY","ECONOMY"],value)} value=${value} onChange=${v=>setEdit(x=>({...x,[k]:v}))}/>`;
    if(k==="status")return html`<${Field} label=${l} type="select" options=${optionList(["OPEN","CLOSED","ACTIVE","INACTIVE","CANCELLED"],value)} value=${value} onChange=${v=>setEdit(x=>({...x,[k]:v}))}/>`;
    const t=["physical_capacity","yield_index","nest","authorized","sold","available","overbooking_limit","capacity","bid_price","hurdle","protection"].includes(k)?"number":["departure_date","effective_date","discontinue_date"].includes(k)?"date":["std","sta"].includes(k)?"time":"text";
    return html`<${Field} label=${l} type=${t} value=${value} onChange=${v=>setEdit(x=>({...x,[k]:v}))}/>`;
  }
  async function save(){
    try{setBusy("Saving air inventory…");await request("INVENTORY_V9_SAVE_AIR_ROW",{kind,item:edit});setEdit(null);setToast("Air inventory saved.")}catch(e){setToast(e.message,true)}finally{setBusy("")}
  }
  return html`<div className="card panel"><div className="paneltitle"><span>Air Inventory & Revenue Control</span><button className="btn primary" onClick=${()=>setEdit({status:"OPEN",payload:{}})}>+ New ${kind}</button></div>
    <div className="notice">Choose an airport and aircraft from the available records.</div>
    <div className="tabs">${[["flight","Flight Legs"],["class","Booking Classes"],["schedule","Schedules"],["nesting","Nesting / Revenue"]].map(([k,l])=>html`<button className=${`tab ${kind===k?"active":""}`} onClick=${()=>setKind(k)}>${l}</button>`)}</div>
    <div className="tablewrap"><table className="table"><thead><tr>${cols.map(([k,l])=>html`<th>${l}</th>`)}</tr></thead><tbody>
      ${rows.length?rows.map(r=>html`<tr className="clickrow" onClick=${()=>setEdit(clone(r))}>${cols.map(([k])=>html`<td>${k==="status"?statusPill(r[k]):text(r[k])||"—"}</td>`)}</tr>`):html`<tr><td colSpan=${cols.length}><div className="empty">No ${kind} inventory rows have been loaded yet.</div></td></tr>`}
    </tbody></table></div>
    ${edit?html`<${Modal} title=${`Air Inventory · ${kind}`} onClose=${()=>setEdit(null)} actions=${html`<button className="btn small cyan" onClick=${save}>Save</button>`}><div className="formgrid three">${cols.map(([k,l])=>editorFor(k,l))}<div className="full"><div className="sectiontitle">Additional Air Inventory Controls</div><${SmartObjectEditor} value=${edit.payload||{}} onChange=${v=>setEdit(x=>({...x,payload:v}))}/></div></div></${Modal}>`:null}
  </div>`
}


function DraggableHotspot({item,index,onMove,onSelect}){
  const [drag,setDrag]=useState(false);
  function move(e){
    if(!drag)return;
    const rect=e.currentTarget.parentElement.getBoundingClientRect();
    const x=Math.max(0,Math.min(100,((e.clientX-rect.left)/rect.width)*100));
    const y=Math.max(0,Math.min(100,((e.clientY-rect.top)/rect.height)*100));
    onMove(x,y);
  }
  return html`<div className=${`hotspot ${drag?"dragging":""}`} style=${{left:`${item.x??50}%`,top:`${item.y??50}%`}} onPointerDown=${e=>{e.currentTarget.setPointerCapture(e.pointerId);setDrag(true)}} onPointerMove=${move} onPointerUp=${()=>setDrag(false)} onClick=${e=>{e.stopPropagation();onSelect?.()}}>${index+1}<div className="hotlabel">${item.label||item.title||`Hotspot ${index+1}`}</div></div>`
}


function AircraftStudio({boot,setBusy,setToast}){
  const [filter,setFilter]=useState("");
  const [selected,setSelected]=useState(null);
  const [bundle,setBundle]=useState(null);
  const [mode,setMode]=useState("aircraft");
  const [childEdit,setChildEdit]=useState(null);
  const [activeView,setActiveView]=useState(null);
  const [placeHotspot,setPlaceHotspot]=useState(false);
  const list=(boot.aircraft||[]).filter(a=>!filter||[a.airlineCode,a.aircraftCode,a.aircraftName,a.manufacturer].join(" ").toLowerCase().includes(filter.toLowerCase()));
  async function open(a){
    try{setBusy("Opening aircraft digital twin…");const x=await request("INVENTORY_V9_GET_AIRCRAFT",{aircraftId:a.id});setSelected(a.id);setBundle(x);setActiveView(x.views?.[0]||null)}catch(e){setToast(e.message,true)}finally{setBusy("")}
  }
  async function sync(){
    if(!confirm("Reconcile airline fleet templates with Aircraft & Cabin Studio? Existing curated imagery and content will be preserved."))return;
    try{setBusy("Reconciling aircraft and cabins…");const r=await request("INVENTORY_V9_SMART_SYNC_AIRCRAFT",{buildMissingCabins:true});setToast(r.message||"Fleet synchronization complete.")}catch(e){setToast(e.message,true)}finally{setBusy("")}
  }
  async function saveAircraft(){
    try{setBusy("Saving aircraft…");const refs=bundle.aircraft?._assetRefs||{};const r=await request("INVENTORY_V9_SAVE_AIRCRAFT",{aircraft:bundle.aircraft});
      for(const [field,asset] of Object.entries(refs))if(asset?.id&&r.aircraft?.id)try{await request("INVENTORY_ASSET_REGISTER_USAGE",{assetId:asset.id,system:"Inventory Control",recordType:"AIRCRAFT",recordId:r.aircraft.id,usageRole:field,fieldName:field})}catch(_){}
      setBundle(b=>({...b,aircraft:{...r.aircraft,_assetRefs:refs}}));setToast("Aircraft and Asset Library links saved.")}
    catch(e){setToast(e.message,true)}finally{setBusy("")}
  }
  async function saveChild(){
    try{setBusy("Saving cabin experience…");const refs=childEdit.item?._assetRefs||{};const saved=await request("INVENTORY_V9_SAVE_AIRCRAFT_CHILD",{kind:childEdit.kind,item:childEdit.item});
      for(const [field,asset] of Object.entries(refs))if(asset?.id&&saved.item?.id)try{await request("INVENTORY_ASSET_REGISTER_USAGE",{assetId:asset.id,system:"Inventory Control",recordType:`AIRCRAFT_${childEdit.kind.toUpperCase()}`,recordId:saved.item.id,usageRole:field,fieldName:field})}catch(_){}
      setChildEdit(null);const r=await request("INVENTORY_V9_GET_AIRCRAFT",{aircraftId:selected});setBundle(r);setActiveView(v=>r.views?.find(x=>x.id===v?.id)||r.views?.[0]||null);setToast("Cabin experience and Asset Library links saved.")}
    catch(e){setToast(e.message,true)}finally{setBusy("")}
  }
  if(!bundle){
    return html`<div className="card panel"><div className="paneltitle"><span>Aircraft & Cabin Studio</span><button className="btn cyan" onClick=${sync}>Smart Sync Fleet</button></div>
      <div className="notice">Aircraft Display Control is now part of Inventory Control. Airline fleet configuration, aircraft records, cabins, views, hotspots and walkthroughs are reconciled here as one product experience.</div>
      <div className="filters" style=${{marginTop:"12px"}}><div className="field grow"><label>Find Aircraft</label><input className="input" value=${filter} onInput=${e=>setFilter(e.target.value)} placeholder="Airline, code, family or aircraft"/></div></div>
      <div className="tablewrap"><table className="table"><thead><tr><th>Airline</th><th>Aircraft</th><th>Name</th><th>Seats</th><th>Status</th><th>Cabin Readiness</th></tr></thead><tbody>${list.map(a=>html`<tr className="clickrow" onClick=${()=>open(a)}><td><b>${a.airlineCode}</b></td><td>${a.aircraftCode}</td><td>${a.aircraftName}</td><td>${a.totalSeats??"—"}</td><td>${statusPill(a.status)}</td><td>${a.heroImageUrl||a.seatmapImageUrl?"Media linked":"Needs media"}</td></tr>`)}</tbody></table></div>
    </div>`
  }
  const a=bundle.aircraft,allCabins=bundle.cabins||[],views=bundle.views||[],hotspots=bundle.hotspots||[],scenes=bundle.scenes||[];
  function uiCabinCode(value=""){
    const v=String(value??"").trim().toUpperCase().replace(/[_-]+/g," ");
    if(/FIRST|LA PREMI/.test(v))return "F";
    if(/BUSINESS|SIGNATURE CLASS|DELTA ONE|POLARIS|CLUB WORLD|ROYAL SILK/.test(v))return "J";
    if(/PREMIUM|PLUS|COMFORT/.test(v)&&!/BUSINESS/.test(v))return "W";
    return "Y";
  }
  const cabinMap=new Map();
  for(const c of allCabins.filter(c=>c.active!==false)){
    const rawCode=String(c.cabinCode??c.cabin_code??"").trim().toUpperCase();
    const canonicalCode=uiCabinCode(rawCode||c.cabinName||c.cabin_name);
    const cabinName=String(c.cabinName??c.cabin_name??"").trim().toLowerCase();
    const seatCount=Number(c.seatCount??c.seat_count??0)||0;
    const key=`${canonicalCode}|${cabinName}|${seatCount}`;
    const previous=cabinMap.get(key);
    const isCanonical=["F","J","W","Y"].includes(rawCode);
    const previousCode=String(previous?.cabinCode??previous?.cabin_code??"").trim().toUpperCase();
    if(!previous||(isCanonical&&!["F","J","W","Y"].includes(previousCode)))cabinMap.set(key,c);
  }
  const cabins=[...cabinMap.values()];
  const seatTotal=cabins.reduce((s,c)=>s+(Number(c.seatCount??c.seat_count)||0),0);
  const currentHotspots=activeView?hotspots.filter(h=>h.view_id===activeView.id):[];
  const setA=(k,v)=>setBundle(b=>({...b,aircraft:{...b.aircraft,[k]:v}}));
  const mapTotal=Math.max(1,seatTotal);
  const childFields={
    cabin:[["Cabin Code","cabin_code"],["Cabin Name","cabin_name"],["Seat Count","seat_count","number"],["Rank","rank","number"],["Summary","summary","textarea"],["Description","description","textarea"],["Meal Title","meal_title"],["Meal Description","meal_description","textarea"],["Sort Order","sort_order","number"]],
    view:[["Cabin ID","cabin_id"],["View Code","view_code"],["Label","label"],["View Type","view_type"],["Alt Text","alt_text"],["Caption","caption","textarea"],["Credit","credit"],["Sort Order","sort_order","number"]],
    hotspot:[["Hotspot Code","hotspot_code"],["Label","label"],["Title","title"],["Description","description","textarea"],["Action","action"],["Focus X %","focus_x","number"],["Focus Y %","focus_y","number"],["Focus Zoom","focus_zoom","number"],["Target Cabin Code","target_cabin_code"],["Sort Order","sort_order","number"]],
    scene:[["Scene Code","scene_code"],["Title","title"],["Short Title","short_title"],["Summary","summary","textarea"],["Forward Scene Code","forward_scene_code"],["Back Scene Code","back_scene_code"],["Forward Label","forward_label"],["Back Label","back_label"],["Sort Order","sort_order","number"]]
  };
  function setAircraftAsset(field,asset){setBundle(b=>({...b,aircraft:{...b.aircraft,[field]:asset.publicUrl||asset.previewUrl||"",_assetRefs:{...(b.aircraft?._assetRefs||{}),[field]:asset}}}))}
  function setChildAsset(field,asset){setChildEdit(d=>({...d,item:{...d.item,[field]:asset.publicUrl||asset.previewUrl||"",_assetRefs:{...(d.item?._assetRefs||{}),[field]:asset}}}))}
  function pointFromEvent(e){
    const rect=e.currentTarget.getBoundingClientRect();
    return{
      x:Math.max(0,Math.min(100,Math.round((((e.clientX-rect.left)/rect.width)*100)*10)/10)),
      y:Math.max(0,Math.min(100,Math.round((((e.clientY-rect.top)/rect.height)*100)*10)/10))
    };
  }
  function clickPlaceHotspot(e){
    if(!placeHotspot||!activeView)return;
    if(e.target.closest?.(".hotspot"))return;
    const point=pointFromEvent(e);
    setPlaceHotspot(false);
    startChild("hotspot",{view_id:activeView.id,hotspot_code:`HOT_${currentHotspots.length+1}`,label:"New hotspot",title:"",description:"",x:point.x,y:point.y,action:"DETAIL",active:true,sort_order:(currentHotspots.length+1)*10});
  }
  function startChild(kind,item={}){
    const base={...item,active:item.active!==false,sort_order:item.sort_order??item.sortOrder??100};
    if(kind==="cabin"){
      // Cabin reads are camelCase; the editor and write contract use snake_case.
      base.aircraft_id=item.aircraft_id??item.aircraftId??a.id;
      base.cabin_code=item.cabin_code??item.cabinCode??"";
      base.cabin_name=item.cabin_name??item.cabinName??"";
      base.seat_count=item.seat_count??item.seatCount??null;
      base.meal_title=item.meal_title??item.mealTitle??"";
      base.meal_description=item.meal_description??item.mealDescription??"";
      base.display_settings=item.display_settings??item.displaySettings??{};
      base.rank=item.rank??100;
    }
    if(kind==="cabin"&&!base.aircraft_id)base.aircraft_id=a.id;
    if(kind==="view"&&!base.aircraft_id)base.aircraft_id=a.id;
    if(kind==="scene"&&!base.aircraft_id)base.aircraft_id=a.id;
    if(kind==="hotspot"&&!base.view_id)base.view_id=activeView?.id||"";
    setChildEdit({kind,item:base});
  }
  return html`<div className="card panel"><div className="paneltitle"><span>${a.airlineCode} · ${a.aircraftName}</span><div className="toolbar"><button className="btn small" onClick=${()=>{setBundle(null);setSelected(null)}}>Back to Fleet</button><button className="btn small cyan" onClick=${sync}>Smart Sync</button><button className="btn small primary" onClick=${saveAircraft}>Save Aircraft</button></div></div>
    <div className="kpirow"><div className="kpi"><b>${a.totalSeats??"—"}</b> aircraft seats</div><div className="kpi"><b>${seatTotal}</b> cabin seats</div><div className="kpi"><b>${cabins.length}</b> cabins</div><div className="kpi"><b>${views.length}</b> views</div><div className="kpi"><b>${hotspots.length}</b> hotspots</div><div className="kpi"><b>${scenes.length}</b> walkthrough scenes</div></div>
    <div className="cabinmap" style=${{margin:"13px 0"}}>${cabins.length?cabins.map(c=>html`<div className="cabinzone" style=${{flex:`${Math.max(1,(Number(c.seatCount)||1)/mapTotal)}`}}><div><b>${c.cabinCode} · ${c.cabinName}</b><small>${c.seatCount??0} seats</small></div></div>`):html`<div className="empty">No cabin records.</div>`}</div>
    ${a.totalSeats!==null&&a.totalSeats!==seatTotal?html`<div className="notice warn">Seat reconciliation needs review: aircraft total is ${a.totalSeats}, while active cabins total ${seatTotal}.</div>`:null}
    <div className="tabs" style=${{marginTop:"12px"}}>${["aircraft","cabins","views","hotspots","walkthrough"].map(k=>html`<button className=${`tab ${mode===k?"active":""}`} onClick=${()=>setMode(k)}>${k[0].toUpperCase()+k.slice(1)}</button>`)}</div>
    ${mode==="aircraft"?html`<div className="split"><div className="formgrid">
      ${[["Aircraft Code","aircraftCode"],["Aircraft Name","aircraftName"],["Manufacturer","manufacturer"],["Family","family"],["Variant","variant"],["Total Seats","totalSeats","number"],["Display Title","displayTitle"],["Default Cabin Code","defaultCabinCode"],["Default View Type","defaultViewType"],["Walkthrough Title","walkthroughTitle"],["Walkthrough Subtitle","walkthroughSubtitle"],["Walkthrough Start Scene","walkthroughStartSceneCode"],["Accuracy Label","walkthroughAccuracyLabel"],["Source URL","sourceUrl"],["Review Notes","reviewNotes","textarea"]].map(([l,k,t="text"])=>html`<${Field} label=${l} type=${t} value=${a[k]??""} onChange=${v=>setA(k,v)}/>`)}
      <div className="full"><div className="sectiontitle">Aircraft Assets</div></div>
      <${AssetField} label="Hero Image" value=${a.heroImageUrl} assetId=${a._assetRefs?.heroImageUrl?.id} context=${assetContextForAircraft(boot,a,"Hero","hero_image_url")} onSelect=${asset=>setAircraftAsset("heroImageUrl",asset)} setBusy=${setBusy} setToast=${setToast}/>
      <${AssetField} label="Exterior Image" value=${a.exteriorImageUrl} assetId=${a._assetRefs?.exteriorImageUrl?.id} context=${assetContextForAircraft(boot,a,"Exterior","exterior_image_url")} onSelect=${asset=>setAircraftAsset("exteriorImageUrl",asset)} setBusy=${setBusy} setToast=${setToast}/>
      <${AssetField} label="Seat Map Image" value=${a.seatmapImageUrl} assetId=${a._assetRefs?.seatmapImageUrl?.id} context=${assetContextForAircraft(boot,a,"Seat Map","seatmap_image_url")} onSelect=${asset=>setAircraftAsset("seatmapImageUrl",asset)} setBusy=${setBusy} setToast=${setToast}/>
      <${AssetField} label="Thumbnail Image" value=${a.thumbnailImageUrl} assetId=${a._assetRefs?.thumbnailImageUrl?.id} context=${assetContextForAircraft(boot,a,"Thumbnail","thumbnail_image_url")} onSelect=${asset=>setAircraftAsset("thumbnailImageUrl",asset)} setBusy=${setBusy} setToast=${setToast}/>
      <${Toggle} label="Customer Visible" value=${a.customerVisible===true} onChange=${v=>setA("customerVisible",v)}/><${Toggle} label="Active" value=${a.active!==false} onChange=${v=>setA("active",v)}/>
    </div><div><div className="preview">${a.heroImageUrl?html`<img src=${a.heroImageUrl}/>`:"Choose a hero image from the SKANDI Asset Library."}</div><div className="hr"></div><${ConfigurationEditor} value=${a.configuration||{}} onChange=${v=>setA("configuration",v)}/></div></div>`:null}
    ${mode==="cabins"?html`<div><div className="paneltitle"><span>Cabin Configuration</span><button className="btn small" onClick=${()=>startChild("cabin",{cabin_code:"Y",cabin_name:"Economy",seat_count:null})}>+ Cabin</button></div>${cabins.map(c=>html`<div className="childitem" onClick=${()=>startChild("cabin",c)}><b>${c.cabinCode} · ${c.cabinName}</b> · ${c.seatCount??0} seats <span className="sub">${c.summary||""}</span></div>`)}</div>`:null}
    ${mode==="views"?html`<div><div className="paneltitle"><span>Cabin Views & Images</span><button className="btn small" onClick=${()=>startChild("view",{view_code:`VIEW_${views.length+1}`,label:"Cabin view",view_type:"CABIN",image_url:""})}>+ View</button></div><div className="grid" style=${{gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))"}}>${views.map(v=>html`<div className="childitem"><div className="preview" onClick=${()=>{setActiveView(v);setMode("hotspots")}}>${v.image_url?html`<img src=${v.image_url} alt=${v.alt_text||""}/>`:"No image"}</div><div style=${{marginTop:"8px"}}><b>${v.label}</b> · ${v.view_type}</div><button className="btn small" onClick=${()=>startChild("view",v)}>Edit</button></div>`)}</div></div>`:null}
    ${mode==="hotspots"?html`<div><div className="paneltitle"><span>Interactive Hotspot Canvas</span><div className="toolbar"><select className="select w240" value=${activeView?.id||""} onChange=${e=>{setActiveView(views.find(v=>v.id===e.target.value)||null);setPlaceHotspot(false)}}>${views.map(v=>html`<option value=${v.id}>${v.label}</option>`)}</select><button className=${`btn small ${placeHotspot?"cyan":""}`} disabled=${!activeView} onClick=${()=>setPlaceHotspot(v=>!v)}>${placeHotspot?"Cancel Placement":"Click Image to Place Hotspot"}</button></div></div>
      ${activeView?html`<div className=${`studioimg ${placeHotspot?"place":""}`} onClick=${clickPlaceHotspot}>${activeView.image_url?html`<img src=${activeView.image_url}/>`:null}${currentHotspots.map((h,i)=>html`<${DraggableHotspot} item=${h} index=${i} onSelect=${()=>startChild("hotspot",h)} onMove=${(x,y)=>setBundle(b=>({...b,hotspots:b.hotspots.map(k=>k.id===h.id?{...k,x,y}:k)}))}/>`)} </div>
      <div className="positionbar"><span className=${`positionreadout ${placeHotspot?"placementon":""}`}>${placeHotspot?"Placement tool active — click the exact feature on the image":"Create: click “Click Image to Place Hotspot”. Reposition: drag an existing marker."}</span><span className="sub">Coordinates are calculated automatically and stored by the system.</span></div>`:html`<div className="empty">Create or select a cabin view first.</div>`}
    </div>`:null}
    ${mode==="walkthrough"?html`<div><div className="paneltitle"><span>Walkthrough Scenes</span><button className="btn small" onClick=${()=>startChild("scene",{scene_code:`SCENE_${scenes.length+1}`,title:"Cabin scene",image_url:""})}>+ Scene</button></div><div className="grid" style=${{gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))"}}>${scenes.map(s=>html`<div className="childitem"><div className="preview">${s.image_url?html`<img src=${s.image_url}/>`:"No image"}</div><div style=${{marginTop:"8px"}}><b>${s.title}</b><div className="sub">${s.summary||""}</div></div><button className="btn small" onClick=${()=>startChild("scene",s)}>Edit</button></div>`)}</div><div className="notice" style=${{marginTop:"12px"}}>Scene-to-scene navigation is stored on each walkthrough scene. Scene hotspots remain normalized child records and are preserved by Inventory Control even when you edit the scene itself.</div></div>`:null}
    ${childEdit?html`<${Modal} title=${`Aircraft Studio · ${childEdit.kind}`} onClose=${()=>setChildEdit(null)} actions=${html`<button className="btn small cyan" onClick=${saveChild}>Save</button>`}><div className="formgrid three">${childFields[childEdit.kind].map(([l,k,t="text"])=>html`<${Field} label=${l} type=${t} value=${childEdit.item[k]??""} onChange=${v=>setChildEdit(d=>({...d,item:{...d.item,[k]:v}}))}/>`)}
      ${childEdit.kind==="view"?html`<div className="full"><div className="sectiontitle">View Assets</div><${AssetField} label="Main Cabin View" value=${childEdit.item.image_url} assetId=${childEdit.item._assetRefs?.image_url?.id} context=${assetContextForAircraft(boot,a,"Cabin View","image_url",`Views / ${childEdit.item.label||childEdit.item.view_code||"Cabin"}`)} onSelect=${asset=>setChildAsset("image_url",asset)} setBusy=${setBusy} setToast=${setToast}/><${AssetField} label="Mobile Cabin View" value=${childEdit.item.mobile_image_url} assetId=${childEdit.item._assetRefs?.mobile_image_url?.id} context=${assetContextForAircraft(boot,a,"Cabin View Mobile","mobile_image_url",`Views / ${childEdit.item.label||childEdit.item.view_code||"Cabin"} / Mobile`)} onSelect=${asset=>setChildAsset("mobile_image_url",asset)} setBusy=${setBusy} setToast=${setToast}/><${AssetField} label="View Thumbnail" value=${childEdit.item.thumbnail_url} assetId=${childEdit.item._assetRefs?.thumbnail_url?.id} context=${assetContextForAircraft(boot,a,"Thumbnail","thumbnail_url",`Views / ${childEdit.item.label||childEdit.item.view_code||"Cabin"}`)} onSelect=${asset=>setChildAsset("thumbnail_url",asset)} setBusy=${setBusy} setToast=${setToast}/></div>`:null}
      ${childEdit.kind==="hotspot"?html`<div className="full"><div className="sectiontitle">Hotspot Asset</div><${AssetField} label="Hotspot Thumbnail" value=${childEdit.item.thumbnail_url} assetId=${childEdit.item._assetRefs?.thumbnail_url?.id} context=${assetContextForAircraft(boot,a,"Hotspot Thumbnail","thumbnail_url",`Hotspots / ${childEdit.item.label||childEdit.item.hotspot_code||"Feature"}`)} onSelect=${asset=>setChildAsset("thumbnail_url",asset)} setBusy=${setBusy} setToast=${setToast}/></div>`:null}
      ${childEdit.kind==="scene"?html`<div className="full"><div className="sectiontitle">Walkthrough Assets</div><${AssetField} label="Walkthrough Scene Image" value=${childEdit.item.image_url} assetId=${childEdit.item._assetRefs?.image_url?.id} context=${assetContextForAircraft(boot,a,"Walkthrough","image_url",`Walkthrough / ${childEdit.item.title||childEdit.item.scene_code||"Scene"}`)} onSelect=${asset=>setChildAsset("image_url",asset)} setBusy=${setBusy} setToast=${setToast}/><${AssetField} label="Mobile Walkthrough Image" value=${childEdit.item.mobile_image_url} assetId=${childEdit.item._assetRefs?.mobile_image_url?.id} context=${assetContextForAircraft(boot,a,"Walkthrough Mobile","mobile_image_url",`Walkthrough / ${childEdit.item.title||childEdit.item.scene_code||"Scene"} / Mobile`)} onSelect=${asset=>setChildAsset("mobile_image_url",asset)} setBusy=${setBusy} setToast=${setToast}/></div>`:null}
      <${Toggle} label="Active" value=${childEdit.item.active!==false} onChange=${v=>setChildEdit(d=>({...d,item:{...d.item,active:v}}))}/>${childEdit.kind==="hotspot"?html`<div className="full"><div className="positionbar"><span className="positionreadout">Image position: ${Number(childEdit.item.x??50).toFixed(1)}% × ${Number(childEdit.item.y??50).toFixed(1)}%</span><span className="sub">Position is set by clicking or dragging on the cabin image, not by manually entering X/Y.</span></div></div>`:null}${childEdit.kind==="cabin"?html`<div className="full"><${AmenitiesEditor} value=${childEdit.item.amenities||[]} onChange=${v=>setChildEdit(d=>({...d,item:{...d.item,amenities:v}}))}/></div>`:null}</div></${Modal}>`:null}
  </div>`
}


function Quality({boot,setBusy,setToast}){
  const [q,setQ]=useState(null);
  async function run(){
    try{setBusy("Running Inventory quality control…");setQ(await request("INVENTORY_V9_QUALITY",{}))}catch(e){setToast(e.message,true)}finally{setBusy("")}
  }
  useEffect(()=>{run()},[]);
  if(!q)return html`<div className="card panel"><div className="empty">Preparing quality report…</div></div>`;
  const issues=q.issues||{};
  return html`<div className="grid">
    <div className="card panel"><div className="paneltitle"><span>Publishing & Quality Control</span><button className="btn" onClick=${run}>Run Again</button></div>
      <div className="stats">${[["Travel Records",q.counts?.canonical],["Searchable Catalog",q.counts?.searchableCatalog],["Aircraft",q.counts?.aircraft],["Cabins",q.counts?.cabins],["Cabin Views",q.counts?.views]].map(([l,v])=>html`<div className="stat"><span>${l}</span><strong>${v??0}</strong></div>`)}</div>
      <div className="notice">${q.aircraftSync?.missing?`${q.aircraftSync.missing} aircraft records need attention.`:"Aircraft records are up to date."}</div>
    </div>
    ${[["Cabin seat mismatches",issues.cabinSeatMismatches],["Aircraft without cabins",issues.aircraftWithoutCabins],["Aircraft without views",issues.aircraftWithoutViews],["Published hotel/destination records without media",issues.publicRecordsWithoutMedia]].map(([title,rows])=>html`<div className="card panel"><div className="paneltitle"><span>${title}</span><span className="pill">${rows?.length||0}</span></div>${rows?.length?html`<div className="tablewrap"><table className="table"><tbody>${rows.slice(0,100).map(r=>html`<tr>${Object.entries(r).slice(0,6).map(([k,v])=>html`<td><b>${k}</b><br/>${text(v)}</td>`)}</tr>`)}</tbody></table></div>`:html`<div className="empty">No issues found.</div>`}</div>`)}
  </div>`
}


function Audit({setBusy,setToast}){
  const [rows,setRows]=useState([]);
  async function load(){try{setBusy("Loading audit…");const r=await request("INVENTORY_V9_GET_AUDIT",{limit:300});setRows(r.audit||[])}catch(e){setToast(e.message,true)}finally{setBusy("")}}
  useEffect(()=>{load()},[]);
  return html`<div className="card panel"><div className="paneltitle"><span>Inventory Audit</span><button className="btn" onClick=${load}>Refresh</button></div><div className="tablewrap"><table className="table"><thead><tr><th>Time</th><th>Event</th><th>Domain</th><th>Record</th><th>Message</th><th>Agent</th></tr></thead><tbody>${rows.length?rows.map(r=>html`<tr><td>${text(r.timestamp).replace("T"," ").slice(0,19)}</td><td>${employeeAuditAction(r.eventType)}</td><td>${employeeAuditAction(r.domain)}</td><td>${r.entityId||r.productKey||"—"}</td><td>${employeeAuditMessage(r.message)}</td><td>${r.agentName||""}</td></tr>`):html`<tr><td colSpan="6"><div className="empty">No audit events.</div></td></tr>`}</tbody></table></div></div>`
}



/* Property Director — original five-module reference layout, canonical V12 HOTEL record bundles. */
function PDField({label,value,onChange,type="text",options=[],disabled=false,help="",placeholder="",full=false}){
  return html`<${Field} label=${label} value=${value??""} onChange=${onChange||(()=>{})} type=${type} options=${options} disabled=${disabled} help=${help} placeholder=${placeholder} full=${full}/>`;
}
function PDSection({children,title,actions=null,first=false}){
  return html`<div className=${first?"sectiontitle":"sectiontitle pd-module-title"}>${title}${actions?html`<span>${actions}</span>`:null}</div>${children}`;
}
/* Property Director map: presentation-only; coordinates persist through the existing hotel bundle save. */
let propertyMapModulePromise = null;
function loadPropertyMapModule(){
  if(!propertyMapModulePromise){
    propertyMapModulePromise=(async()=>{
      const cssUrl="https://unpkg.com/maplibre-gl@6.15.0/dist/maplibre-gl.css";
      if(!document.querySelector('link[data-skandi-property-map-css]')){
        const sheet=document.createElement("link");
        sheet.rel="stylesheet";
        sheet.href=cssUrl;
        sheet.setAttribute("data-skandi-property-map-css","");
        document.head.appendChild(sheet);
      }
      return import("https://unpkg.com/maplibre-gl@6.15.0/dist/maplibre-gl.mjs");
    })().catch(error=>{propertyMapModulePromise=null;throw error});
  }
  return propertyMapModulePromise;
}
function propertyMapCoordinates(latitude,longitude){
  if(latitude==null||longitude==null||String(latitude).trim()===""||String(longitude).trim()==="")return null;
  const lat=Number(latitude),lng=Number(longitude);
  if(!Number.isFinite(lat)||!Number.isFinite(lng)||lat < -90||lat > 90||lng < -180||lng > 180)return null;
  return {lat,lng};
}
function PDPropertyMap({latitude,longitude,onCoordinates}){
  const containerRef=useRef(null);
  const mapRef=useRef(null);
  const markerRef=useRef(null);
  const createMarkerRef=useRef(null);
  const latestCoordinatesRef=useRef({latitude,longitude});
  const onCoordinatesRef=useRef(onCoordinates);
  const [loadingState,setLoadingState]=useState("loading");
  latestCoordinatesRef.current={latitude,longitude};
  onCoordinatesRef.current=onCoordinates;
  useEffect(()=>{
    let active=true;
    loadPropertyMapModule().then(lib=>{
      const host=containerRef.current;
      if(!active||!host)return;
      const initial=propertyMapCoordinates(latestCoordinatesRef.current.latitude,latestCoordinatesRef.current.longitude);
      const map=new lib.Map({
        container:host,
        style:"https://tiles.openfreemap.org/styles/liberty",
        center:initial?[initial.lng,initial.lat]:[0,20],
        zoom:initial?13:1.6,
        attributionControl:true
      });
      mapRef.current=map;
      map.addControl(new lib.NavigationControl({showCompass:false}),"top-right");
      const setMarker=point=>{
        if(!markerRef.current){
          markerRef.current=new lib.Marker({color:"#005EB8",draggable:true})
            .setLngLat([point.lng,point.lat]).addTo(map);
          markerRef.current.on("dragend",()=>{
            const p=markerRef.current?.getLngLat();
            if(p)onCoordinatesRef.current(Number(p.lat.toFixed(6)),Number(p.lng.toFixed(6)));
          });
        }else markerRef.current.setLngLat([point.lng,point.lat]);
      };
      createMarkerRef.current=setMarker;
      if(initial)setMarker(initial);
      map.on("click",event=>{
        const point=event.lngLat;
        if(!point)return;
        setMarker(point);
        onCoordinatesRef.current(Number(point.lat.toFixed(6)),Number(point.lng.toFixed(6)));
      });
      map.on("load",()=>{if(active){map.resize();setLoadingState("ready")}});
      map.on("error",event=>{
        console.warn("[SKANDI Property Map] Map rendering issue",event?.error||event);
        if(active&&!map.isStyleLoaded())setLoadingState("unavailable");
      });
      requestAnimationFrame(()=>{if(active)map.resize()});
    }).catch(error=>{
      console.warn("[SKANDI Property Map] Map unavailable",error);
      if(active)setLoadingState("unavailable");
    });
    return()=>{
      active=false;
      createMarkerRef.current=null;
      markerRef.current=null;
      if(mapRef.current){mapRef.current.remove();mapRef.current=null;}
    };
  },[]);
  useEffect(()=>{
    const map=mapRef.current;
    if(!map||!createMarkerRef.current)return;
    const point=propertyMapCoordinates(latitude,longitude);
    if(point){
      createMarkerRef.current(point);
      map.easeTo({center:[point.lng,point.lat],zoom:Math.max(map.getZoom(),11),duration:250});
    }else if(markerRef.current){
      markerRef.current.remove();
      markerRef.current=null;
    }
  },[latitude,longitude]);
  return html`<div>
    <div className="pd-map" aria-label="Property location map">
      <div ref=${containerRef} style=${{position:"absolute",inset:"0",width:"100%",height:"100%"}}></div>
      ${loadingState!=="ready"?html`<div className="pd-map-empty" style=${{position:"relative",pointerEvents:"none",background:"#E1E6EB",padding:"10px"}}>${loadingState==="unavailable"?"Map unavailable. Enter coordinates above.":"Loading property map…"}</div>`:null}
    </div>
    <div className="pd-muted" style=${{marginTop:"4px"}}>Select a location or drag the pin to set coordinates.</div>
  </div>`;
}
function PDPropertyWorkspace({bundle,boot,onClose,onSaved,setBusy,setToast}){
  const [draft,setDraft]=useState(()=>clone(bundle));
  const [tab,setTab]=useState("MASTER");
  const [lang,setLang]=useState("SV");
  const [translationBusy,setTranslationBusy]=useState(false);
  const [translationReview,setTranslationReview]=useState({});
  const [assetPicker,setAssetPicker]=useState(null);
  const [auditRows,setAuditRows]=useState([]);
  const [auditError,setAuditError]=useState("");
  const [auditLoading,setAuditLoading]=useState(false);
  const rec=draft.record;
  const d=rec.details||{};
  const catalog=draft.catalog||{};
  const rooms=Array.isArray(d.rooms)?d.rooms:[];
  const sells=Array.isArray(d.sellingRooms)?d.sellingRooms:[];
  const channels=Array.isArray(d.channels)?d.channels:[];
  const mappings=Array.isArray(d.mappings)?d.mappings:[];
  const facilities=Array.isArray(d.facilities)?d.facilities:[];
  const facts=Array.isArray(d.facts)?d.facts:[];
  const media=(draft.media||[]).map(normalizeMedia);
  const languages=[...new Set(["EN",...(boot.languages||[]),"SV","NO","DA","FI"].map(x=>String(x).toUpperCase()))];
  const localized=(draft.localizedContent||[]).map(normalizeLocalized);
  const en=localized.find(x=>x.language==="EN")||normalizeLocalized({language:"EN"});
  const current=localized.find(x=>x.language===lang)||normalizeLocalized({language:lang});
  const geography=(boot.records||[]).filter(x=>["DESTINATION","AREA"].includes(x.entityType));
  const airports=(boot.records||[]).filter(x=>x.entityType==="AIRPORT");
  const destOptions=[{value:"",label:"Choose..."},...geography.filter(x=>x.entityType==="DESTINATION").map(x=>({value:x.id,label:`${x.code||""} ${x.name}`}))];
  const areaOptions=[{value:"",label:"Choose..."},...geography.filter(x=>x.entityType==="AREA").map(x=>({value:x.id,label:`${x.code||""} ${x.name}`}))];
  const airportOptions=[{value:"",label:"Choose..."},...airports.map(x=>({value:x.id,label:`${x.code||""} ${x.name}`}))];
  function update(path,value){setDraft(old=>{const next=clone(old);setPath(next.record,path,value);return next})}
  function setDetails(name,val){update(`details.${name}`,val)}
  function setCatalog(name,val){setDraft(old=>({...old,catalog:{...(old.catalog||{}),[name]:val}}))}
  function setLangValue(name,val){setDraft(old=>{const next=clone(old);if(!Array.isArray(next.localizedContent))next.localizedContent=[];let i=next.localizedContent.findIndex(x=>String(x.language).toUpperCase()===lang);if(i<0){next.localizedContent.push(normalizeLocalized({language:lang}));i=next.localizedContent.length-1;}next.localizedContent[i]={...next.localizedContent[i],[name]:val};return next});if(lang==="EN")setTranslationReview(old=>Object.fromEntries(Object.keys(old).map(code=>[code,true])))}
  function setLangArray(name,position,value,action="set"){
    setDraft(old=>{const next=clone(old);if(!Array.isArray(next.localizedContent))next.localizedContent=[];
      let i=next.localizedContent.findIndex(x=>String(x.language).toUpperCase()===lang);
      if(i<0){next.localizedContent.push(normalizeLocalized({language:lang}));i=next.localizedContent.length-1;}
      const row=normalizeLocalized(next.localizedContent[i]);const items=[...(Array.isArray(row[name])?row[name]:[])];
      if(action==="add")items.push("");else if(action==="drop")items.splice(position,1);else items[position]=value;
      row[name]=items;next.localizedContent[i]=row;return next});
    if(lang==="EN")setTranslationReview(old=>Object.fromEntries(Object.keys(old).map(code=>[code,true])));
  }
  const englishEditable=lang==="EN";
  function generateEnglishDraft(){
    const hotelName=text(rec.name).trim();
    if(!hotelName){setToast("Enter the property name before preparing English content.",true);return}
    const location=[text(d.city).trim(),text(d.countryName||d.country).trim()].filter(Boolean).join(", ");
    const featureList=Array.isArray(d.facilities)?d.facilities.filter(x=>typeof x==="string"&&x.trim()).slice(0,5):[];
    const base=location?`${hotelName} is located in ${location}.`:`${hotelName} is a hotel.`;
    const amenities=featureList.length?` Facilities include ${featureList.join(", ")}.`:"";
    const shortDescription=base+amenities;
    const operations=[d.checkIn?`Check-in: ${d.checkIn}.`:"",d.checkOut?`Check-out: ${d.checkOut}.`:""].filter(Boolean).join(" ");
    const title=hotelName;
    const seoTitle=location?`${hotelName} | ${text(d.city).trim()}`:hotelName;
    const seoDescription=`${hotelName}${location?` in ${location}`:""}. ${featureList.length?`Facilities: ${featureList.join(", ")}.`:"View property details with SKANDI TRAVELS."}`.slice(0,160);
    const suggested={title,shortDescription,fullDescription:[shortDescription,operations].filter(Boolean).join("\n\n"),seoTitle:seoTitle.slice(0,60),seoDescription};
    const englishFields=Object.keys(suggested);
    setDraft(old=>{const next=clone(old);if(!Array.isArray(next.localizedContent))next.localizedContent=[];let i=next.localizedContent.findIndex(x=>String(x.language).toUpperCase()==="EN");if(i<0){next.localizedContent.push(normalizeLocalized({language:"EN"}));i=next.localizedContent.length-1}
      const row=normalizeLocalized(next.localizedContent[i]);for(const key of englishFields){if(!text(row[key]).trim())row[key]=suggested[key]}next.localizedContent[i]=row;return next});
    setTranslationReview(old=>Object.fromEntries(Object.keys(old).map(code=>[code,true])));
    setToast("English draft prepared from recorded property information. Review the content before translating.");
  }
  async function translateFromEN(){
    if(lang==="EN")return;
    const source=normalizeLocalized((draft.localizedContent||[]).find(x=>String(x.language).toUpperCase()==="EN")||{});
    const translatableKeys=["title","eyebrow","shortDescription","fullDescription","importantInformation","seoTitle","seoDescription","highlights","included","notIncluded"];
    const input={};for(const key of translatableKeys){const value=source[key];if(Array.isArray(value)&&value.length)input[key]=value;else if(typeof value==="string"&&value.trim())input[key]=value.trim()}
    if(!Object.keys(input).length){setToast("Enter or generate English property content first.",true);return}
    const existing=(draft.localizedContent||[]).find(x=>String(x.language).toUpperCase()===lang);
    if(existing&&translatableKeys.some(key=>Array.isArray(existing[key])?existing[key].length:typeof existing[key]==="string"&&existing[key].trim())){
      if(!confirm(`Replace the current ${lang} text with a new translation from English? Manual edits in that language will be overwritten.`))return;
    }
    try{
      setTranslationBusy(true);
      setBusy(`Generating ${lang} content…`);
      const result=await request("INVENTORY_V9_TRANSLATE_HOTEL_CONTENT",{entityType:"HOTEL",targetLanguage:lang,source:input});
      if(result?.ok!==true||result.targetLanguage!==lang||!result.translated||result.reviewRequired!==true)throw new Error("Language generation did not return complete content.");
      const translated=result.translated;
      if(!Object.keys(input).every(key=>Object.prototype.hasOwnProperty.call(translated,key)))throw new Error("Some property content was not translated.");
      setDraft(old=>{const next=clone(old);if(!Array.isArray(next.localizedContent))next.localizedContent=[];let index=next.localizedContent.findIndex(x=>String(x.language).toUpperCase()===lang);
        const updated={...normalizeLocalized(index>=0?next.localizedContent[index]:{language:lang}),...translated,language:lang};if(index<0)next.localizedContent.push(updated);else next.localizedContent[index]=updated;return next});
      setTranslationReview(old=>({...old,[lang]:true}));
      setToast(`${lang} content generated. Review names, facts and wording, then save the property.`);
    }catch(error){setToast(error?.message||"Language generation could not be completed.",true)}
    finally{setBusy("");setTranslationBusy(false)}
  }
  function editRoomOccupancy(index,field,value){setDraft(old=>{const next=clone(old);const rows=Array.isArray(next.record.details.rooms)?next.record.details.rooms:[];next.record.details.rooms=rows.map((r,i)=>{if(i!==index)return r;const updated={...r,[field]:value};updated.maxGuests=(Number(updated.adults)||0)+(Number(updated.children)||0);return updated});return next})}
  function editDetailRow(key,index,name,value){setDraft(old=>{const next=clone(old);const rows=Array.isArray(next.record.details?.[key])?next.record.details[key]:[];next.record.details[key]=rows.map((v,i)=>i===index?{...v,[name]:value}:v);return next})}
  function appendDetailRow(key,row){setDetails(key,[...(Array.isArray(d[key])?d[key]:[]),row])}
  function dropDetailRow(key,index){setDetails(key,(Array.isArray(d[key])?d[key]:[]).filter((_,i)=>i!==index))}
  function newId(){return (typeof crypto!=="undefined"&&crypto.randomUUID)?crypto.randomUUID():`PD-${Date.now()}-${Math.random().toString(36).slice(2,12)}`}
  function updateMap(roomId,channelId,key,value){const i=mappings.findIndex(x=>x.roomId===roomId&&x.channelId===channelId);const newMap=i<0?{roomId,channelId,roomCode:"",rateCode:"",[key]:value}:{...mappings[i],[key]:value};setDetails("mappings",i<0?[...mappings,newMap]:mappings.map((x,j)=>i===j?newMap:x))}
  function addMediaAsset(asset){if(asset.visibility!=="PUBLIC"||!(asset.publicUrl||asset.previewUrl))return setToast("Select a public image with a usable URL from Asset Library.",true);const existing=media.find(m=>m.payload?.assetId===asset.id);if(existing)return setToast("This Asset Library image is already linked to the property.");const added=normalizeMedia({role:"GALLERY",url:asset.publicUrl||asset.previewUrl,sourceKind:"ASSET_LIBRARY",storageBucket:asset.bucket||"",storagePath:asset.storagePath||"",altText:asset.altText||asset.displayName||"",active:true,sortOrder:(media.length+1)*10,payload:{assetId:asset.id,assetCode:asset.assetCode||"",tag:"General",roomLink:""}});setDraft(old=>({...old,media:[...(old.media||[]),added]}));setAssetPicker(null)}
  function updateMedia(i,key,value){setDraft(old=>{const next=clone(old);if(key.startsWith("payload.")){const k=key.split(".")[1];next.media[i].payload={...(next.media[i].payload||{}),[k]:value};}else next.media[i][key]=value;return next})}
  async function archiveProperty(){
    if(!rec.id||rec.status==="ARCHIVED")return;
    if(!confirm(`Archive property ${rec.name||rec.code||rec.id}? This removes it from active and customer-visible inventory.`))return;
    try{
      setBusy("Archiving property…");
      const result=await request("INVENTORY_V9_ARCHIVE_RECORD",{id:rec.id,entityType:"HOTEL"});
      if(result?.ok!==true)throw new Error("The property could not be archived.");
      setToast("Property archived.");
      await onSaved?.({id:rec.id,entityType:"HOTEL",status:"ARCHIVED"});
      onClose();
    }catch(error){setToast(error.message||"Property archive failed.",true)}
    finally{setBusy("")}
  }
  async function save(){
    if(Object.values(translationReview).some(Boolean)){setToast("Review and confirm generated translations before saving the property.",true);return;}
    try{
      setBusy("Saving property…");
      const payload=clone(draft);
      payload.record.details={...(payload.record.details||{})};
      for(const key of ["logoLockupUrl","logoSymbolUrl","logoUrl","logoIconUrl","heroImageUrl","imageUrl","mediaAssets","media_assets"])delete payload.record.details[key];
      if(!payload.catalog)payload.catalog={catalogType:"NONE",partnerTier:"",searchable:false,featured:false,homepageFeatured:false,searchPriority:100,searchKeywords:[],marketCodes:["ALL"],salesChannels:["WEB"],active:true};
      const response=await request("INVENTORY_V9_SAVE_BUNDLE",{bundle:payload});
      if(response?.ok!==true||!response?.bundle?.record?.id)throw new Error("The property could not be saved.");
      const saved=response.bundle;
      for(const m of saved.media||[]){const id=m?.payload?.assetId||m?.assetId;if(id)try{await request("INVENTORY_ASSET_REGISTER_USAGE",{assetId:id,system:"Inventory Control",recordType:"HOTEL",recordId:saved.record.id,usageRole:m.role||"MEDIA",fieldName:"inventory_media_assets"})}catch(err){setToast(`Property saved; asset usage registration failed: ${err.message}`,true)}}
      setDraft(clone(saved));
      setToast("Property saved.");
      await onSaved?.(saved.record);
    }catch(err){setToast(err.message||"Property save failed.",true)}finally{setBusy("")}
  }
  async function getAudit(){if(!rec.id){setAuditRows([]);return;}setAuditLoading(true);setAuditError("");try{const r=await request("INVENTORY_V9_GET_AUDIT",{limit:300});const events=Array.isArray(r.audit)?r.audit:[];setAuditRows(events.filter(a=>String(a.entityId||a.recordId||"")===String(rec.id)))}catch(err){setAuditError(err.message)}finally{setAuditLoading(false)}}
  useEffect(()=>{if(tab==="AUDIT")getAudit()},[tab,rec.id]);
  const addressIsObject=!!(d.address&&typeof d.address==="object"&&!Array.isArray(d.address));
  const addressText=addressIsObject?(d.address.line1||d.address.addressLine1||d.address.street||""):d.address||"";
  const setAddress=v=>addressIsObject?update("details.address.line1",v):setDetails("address",v);
  const distKm=d.distanceToAirport??"";
  const miles=distKm===""?"":Number.isFinite(Number(distKm))?(Number(distKm)*0.621371).toFixed(2):"";
  const status=rec.status||"DRAFT";
  const facilityGroups=[{name:"Wellness",items:["Pool","Spa","Gym","Sauna"]},{name:"Business",items:["Meeting Rooms","Co-working Space"]},{name:"Logistics",items:["EV Charging","Parking","Free Wi-Fi","Restaurant","Pet Friendly"]}];
  const published=rec.status==="PUBLISHED";
  const locName=(id)=>((boot.records||[]).find(x=>x.id===id)?.name)||"";
  const renderMaster=()=>html`<div className="card panel">
    <${PDSection} title="General Information" first=${true}>
      <div className="formgrid three">
        <${PDField} label="System Code" value=${rec.code} onChange=${v=>update("code",v)} help="Unique property code"/>
        <${PDField} label="Master Name" value=${rec.name} onChange=${v=>update("name",v)}/>
        <${PDField} label="Brand / Chain" value=${d.brand||""} onChange=${v=>setDetails("brand",v)} help="Supplier details may change after refresh"/>
        <${PDField} label="Property Type" type="select" options=${ENUM.propertyType} value=${d.propertyType||""} onChange=${v=>setDetails("propertyType",v)}/>
        <${PDField} label="SKANDI Tier" type="select" options=${["SIGNATURE","SELECT","ESSENTIAL","CLASSIC"]} value=${catalog.partnerTier||""} onChange=${v=>setCatalog("partnerTier",v)}/>
        <${PDField} label="Settlement Currency" type="select" options=${ENUM.currency} value=${rec.commercial?.currency||"USD"} onChange=${v=>update("commercial.currency",v)}/>
        <${PDField} label="URL Slug" value=${rec.slug||""} onChange=${v=>update("slug",v)} help="Blank = generated from Master Name"/>
        <${PDField} label="Public ID" value=${rec.publicId||""} disabled=${true} help="Assigned by SKANDI TRAVELS"/>
        <${PDField} label="Status" type="select" options=${STATUS} value=${status} onChange=${v=>update("status",v)}/>
      </div>
    </${PDSection}>
    <${PDSection} title="Geography & Routing">
      <div className="formgrid">
        <div>
          <div className="formgrid"><${PDField} label="Destination" type="select" options=${destOptions} value=${d.destinationId||""} onChange=${v=>setDetails("destinationId",v)}/><${PDField} label="Area / Resort" type="select" options=${areaOptions} value=${d.areaId||""} onChange=${v=>setDetails("areaId",v)}/></div>
          <div className="formgrid" style=${{marginTop:"12px"}}><${PDField} label="Address" value=${addressText} onChange=${setAddress}/><${PDField} label="City" value=${d.city||""} onChange=${v=>setDetails("city",v)}/></div>
          <div className="formgrid" style=${{marginTop:"12px"}}><${PDField} label="Postal Code" value=${d.postalCode||""} onChange=${v=>setDetails("postalCode",v)}/><${PDField} label="Country" value=${d.countryName||d.country||""} onChange=${v=>setDetails("countryName",v)}/></div>
          <div className="formgrid" style=${{marginTop:"12px"}}><${PDField} label="Nearest Airport" type="select" value=${d.nearestAirportId||""} options=${airportOptions} onChange=${v=>setDetails("nearestAirportId",v)}/><${PDField} label="Transfer Time (Min)" type="number" value=${d.transferTimeMinutes??""} onChange=${v=>setDetails("transferTimeMinutes",v)}/></div>
          <div className="pd-field-row" style=${{marginTop:"12px"}}><${PDField} label="Distance to Airport (km)" type="number" value=${distKm} onChange=${v=>setDetails("distanceToAirport",v)}/><span style=${{fontSize:"10px",flex:"0 0 auto"}}>⇄</span><${PDField} label="Distance (mi)" type="number" value=${miles} onChange=${v=>setDetails("distanceToAirport",v===""?null:Number(v)/0.621371)}/></div>
          ${Number(distKm)>25&&!d.transferTimeMinutes?html`<div className="notice warn" style=${{marginTop:"8px"}}>Distance exceeds 25 km. Confirm transfer information.</div>`:null}
        </div>
        <div><div className="pd-field-row"><${PDField} label="Latitude" type="number" value=${d.latitude??""} onChange=${v=>setDetails("latitude",v)}/><${PDField} label="Longitude" type="number" value=${d.longitude??""} onChange=${v=>setDetails("longitude",v)}/></div><${PDPropertyMap} latitude=${d.latitude} longitude=${d.longitude} onCoordinates=${(latitude,longitude)=>setDraft(old=>{const next=clone(old);next.record.details={...(next.record.details||{}),latitude,longitude};return next})}/></div>
      </div>
    </${PDSection}>
    <${PDSection} title="Facilities & Ratings">
      <div className="formgrid four"><${PDField} label="Star Rating" type="number" value=${d.officialStarRating??""} onChange=${v=>setDetails("officialStarRating",v)}/><${PDField} label="Editorial Rating" type="number" value=${d.skandiRating??""} onChange=${v=>setDetails("skandiRating",v)}/><${PDField} label="Guest Rating" type="number" value=${d.guestRating??""} onChange=${v=>setDetails("guestRating",v)}/><${PDField} label="Review Count" type="number" value=${d.reviewCount??""} onChange=${v=>setDetails("reviewCount",v)}/></div>
      <div className="notice" style=${{marginTop:"12px"}}>Enable facilities. Assign one HERO facility for primary display.</div>
      <div className="formgrid three">${facilityGroups.map(group=>html`<div><div className="sectiontitle">${group.name}</div>${group.items.map(name=>html`<label className="pd-check-row"><input type="checkbox" checked=${facilities.includes(name)} onChange=${()=>{const active=facilities.includes(name);setDetails("facilities",active?facilities.filter(x=>x!==name):[...facilities,name]);if(active&&d.heroFacility===name)setDetails("heroFacility","")}}/><span>${name}</span>${facilities.includes(name)?html`<button className=${`btn small ${d.heroFacility===name?"cyan":""}`} type="button" onClick=${e=>{e.preventDefault();setDetails("heroFacility",name)}}>HERO</button>`:null}</label>`)}</div>`)}</div>
      <${ListField} label="Other Facilities — one per line" value=${facilities.filter(x=>!facilityGroups.some(group=>group.items.includes(x)))} onChange=${v=>setDetails("facilities",[...facilities.filter(x=>facilityGroups.some(group=>group.items.includes(x))),...v])}/>
    </${PDSection}>
    <${PDSection} title="Policies & Operational Facts">
      <div className="formgrid three"><${PDField} label="Check-in Time" type="time" value=${d.checkinTime||""} onChange=${v=>setDetails("checkinTime",v)}/><${PDField} label="Check-out Time" type="time" value=${d.checkoutTime||""} onChange=${v=>setDetails("checkoutTime",v)}/><${PDField} label="Min Age" type="number" value=${d.minimumCheckinAge??""} onChange=${v=>setDetails("minimumCheckinAge",v)}/></div>
      <div className="smartgroup" style=${{marginTop:"12px"}}><div className="smarttitle"><span>Hotel Facts</span><button className="btn small" onClick=${()=>appendDetailRow("facts",{label:"",value:""})}>+ APPEND FACT</button></div>
        ${facts.length?html`<div className="smartlist">${facts.map((f,i)=>html`<div className="smartrow"><div className="formgrid"><${PDField} label="Label" value=${f.label||""} onChange=${v=>editDetailRow("facts",i,"label",v)}/><${PDField} label="Value" value=${f.value||""} onChange=${v=>editDetailRow("facts",i,"value",v)}/></div><button className="btn small danger" onClick=${()=>dropDetailRow("facts",i)}>DROP</button></div>`)}</div>`:html`<div className="empty">No operational facts assigned.</div>`}
      </div>
    </${PDSection}>
    <${PDSection} title="Publishing & Visibility">
      <div className="formgrid three"><${Toggle} label="Active" value=${rec.active!==false} onChange=${v=>update("active",v)}/><${Toggle} label="Customer Visible" value=${rec.customerVisible===true} onChange=${v=>update("customerVisible",v)}/><${Toggle} label="ALTEA Visible" value=${rec.alteaVisible!==false} onChange=${v=>update("alteaVisible",v)}/></div>
    </${PDSection}>
  </div>`;
  const renderRooms=()=>html`<div className="card panel">
    <div className="paneltitle"><span>Physical Inventory (Constraints)</span><button className="btn primary small" onClick=${()=>appendDetailRow("rooms",{code:"",name:"",roomType:"",bedType:"",adults:2,children:0,maxGuests:2,sizeSqm:"",window:true})}>+ NEW PHY ROOM</button></div>
    <div className="tablewrap"><table className="table"><thead><tr><th>INT Code</th><th>Bedding</th><th>ADT</th><th>CHD</th><th>CAP</th><th>SQM</th><th>WIN</th><th>Actions</th></tr></thead><tbody>
      ${rooms.length?rooms.map((r,i)=>html`<tr><td><input className="input" value=${r.code||""} onInput=${e=>editDetailRow("rooms",i,"code",e.target.value)} placeholder="STD-TWN"/></td><td><input className="input" value=${r.bedType||""} onInput=${e=>editDetailRow("rooms",i,"bedType",e.target.value)} placeholder="2 TWIN"/></td><td><input className="input" type="number" style=${{width:"56px"}} value=${r.adults??r.maxGuests??0} onInput=${e=>editRoomOccupancy(i,"adults",numOrNull(e.target.value))}/></td><td><input className="input" type="number" style=${{width:"56px"}} value=${r.children??0} onInput=${e=>editRoomOccupancy(i,"children",numOrNull(e.target.value))}/></td><td><b>${r.maxGuests??((Number(r.adults)||0)+(Number(r.children)||0))}</b></td><td><input className="input" style=${{width:"80px"}} value=${r.sizeSqm??""} onInput=${e=>editDetailRow("rooms",i,"sizeSqm",e.target.value)}/></td><td><select className="select" value=${r.window===false?"NO":"YES"} onChange=${e=>editDetailRow("rooms",i,"window",e.target.value==="YES")}><option value="YES">YES</option><option value="NO">NO</option></select></td><td><div className="pd-flex"><button className="btn small" onClick=${()=>appendDetailRow("rooms",{...r,code:`${r.code||"ROOM"}-COPY`})}>CLONE</button><button className="btn small danger" onClick=${()=>dropDetailRow("rooms",i)}>DROP</button></div></td></tr>`):html`<tr><td colSpan="8"><div className="empty">No physical room definitions.</div></td></tr>`}
    </tbody></table></div>
    ${rooms.some(r=>r.window===false)?html`<div className="notice warn">Windowless rooms require accurate customer-facing description. Check the stored room descriptions before publishing.</div>`:null}
    <div className="paneltitle pd-module-title"><span>Selling Configurations (Marketing)</span><button className="btn primary small" onClick=${()=>appendDetailRow("sellingRooms",{id:newId(),physId:"",name:"",priority:100,active:true})}>+ NEW SELL PKG</button></div>
    <div className="tablewrap"><table className="table"><thead><tr><th>Physical Link</th><th>Display Name</th><th>Priority</th><th>Active</th><th>Action</th></tr></thead><tbody>
      ${sells.length?sells.map((r,i)=>html`<tr><td><select className="select" value=${r.physId||""} onChange=${e=>editDetailRow("sellingRooms",i,"physId",e.target.value)}><option value="">Select PHY...</option>${rooms.map(p=>html`<option value=${p.code}>${p.code||"New room"}</option>`)}</select></td><td><input className="input" value=${r.name||""} onInput=${e=>editDetailRow("sellingRooms",i,"name",e.target.value)}/></td><td><input className="input" type="number" style=${{width:"76px"}} value=${r.priority??100} onInput=${e=>editDetailRow("sellingRooms",i,"priority",numOrNull(e.target.value))}/></td><td><select className="select" value=${r.active!==false?"YES":"NO"} onChange=${e=>editDetailRow("sellingRooms",i,"active",e.target.value==="YES")}><option>YES</option><option>NO</option></select></td><td><button className="btn small danger" onClick=${()=>{dropDetailRow("sellingRooms",i);setDetails("mappings",mappings.filter(x=>x.roomId!==r.id))}}>DROP</button></td></tr>`):html`<tr><td colSpan="5"><div className="empty">No selling packages defined.</div></td></tr>`}
    </tbody></table></div><div className="pd-muted">Configure rooms and selling packages. Availability is managed separately.</div>
  </div>`;
  const renderChannels=()=>html`<div className="card panel">
    <div className="paneltitle"><span>Property Channels</span><button className="btn primary small" onClick=${()=>appendDetailRow("channels",{id:newId(),provider:"AMADEUS",propId:"",active:true})}>+ ADD CHANNEL</button></div>
    <div className="tablewrap"><table className="table"><thead><tr><th>Channel</th><th>Property ID</th><th>Status</th><th>Actions</th></tr></thead><tbody>
      ${channels.length?channels.map((r,i)=>html`<tr><td><select className="select" value=${r.provider||""} onChange=${e=>editDetailRow("channels",i,"provider",e.target.value)}><option value="AMADEUS">ALTEA</option><option value="DUFFEL">Supplier channel 1</option><option value="HOTELBEDS">Supplier channel 2</option></select></td><td><input className="input" value=${r.propId||""} onInput=${e=>editDetailRow("channels",i,"propId",e.target.value)}/></td><td><select className="select" value=${r.active!==false?"YES":"NO"} onChange=${e=>editDetailRow("channels",i,"active",e.target.value==="YES")}><option>YES</option><option>NO</option></select></td><td><button className="btn small danger" onClick=${()=>{dropDetailRow("channels",i);setDetails("mappings",mappings.filter(x=>x.channelId!==r.id))}}>DROP</button></td></tr>`):html`<tr><td colSpan="4"><div className="empty">No channel identifiers recorded.</div></td></tr>`}
    </tbody></table></div>
    <div className="paneltitle pd-module-title">Distribution Matrix</div>
    <div className="notice">Enter the room and rate codes for each channel.</div>
    <div className="tablewrap pd-scroll"><table className="table"><thead><tr><th style=${{minWidth:"200px"}}>Selling Package</th>${channels.map(c=>html`<th>${channelDisplayLabel(c.provider,catalog)}<div className="pd-muted">${c.propId||"No ID"}</div></th>`)}</tr></thead><tbody>
      ${sells.length?sells.map(s=>html`<tr><td><b>${s.name||"Unnamed package"}</b></td>${channels.map(c=>{const m=mappings.find(x=>x.roomId===s.id&&x.channelId===c.id)||{};return html`<td className=${`matrix-cell ${!m.roomCode?"matrix-missing":""}`}><div className="pd-flex" style=${{flexWrap:"nowrap"}}><input className="matrix-input" value=${m.roomCode||""} placeholder="RM CD" aria-label=${`${s.name} ${channelDisplayLabel(c.provider,catalog)} room code`} onInput=${e=>updateMap(s.id,c.id,"roomCode",e.target.value)}/><input className="matrix-input" value=${m.rateCode||""} placeholder="RT CD" aria-label=${`${s.name} ${channelDisplayLabel(c.provider,catalog)} rate code`} onInput=${e=>updateMap(s.id,c.id,"rateCode",e.target.value)}/></div></td>`})}</tr>`):html`<tr><td colSpan=${channels.length+1}><div className="empty">Matrix requires selling packages.</div></td></tr>`}
    </tbody></table></div>
  </div>`;
  const renderCms=()=>html`<div className="card panel">
    <div className="paneltitle">Multilingual Content</div>
    <div className="pd-flex" style=${{justifyContent:"space-between",alignItems:"flex-end",marginBottom:"12px",gap:"10px",flexWrap:"wrap"}}>
      <div className="field w240"><label>Content Language</label><select className="select" value=${lang} onChange=${e=>setLang(e.target.value)}><option value="EN">EN · English source</option>${languages.filter(x=>x!=="EN").map(x=>html`<option value=${x}>${({SV:"Swedish",NO:"Norwegian",DA:"Danish",FI:"Finnish",DE:"German",FR:"French",ES:"Spanish",IT:"Italian",NL:"Dutch",PT:"Portuguese",EL:"Greek"})[x]||x} (${x})</option>`)}</select></div>
      <div className="toolbar"><button className="btn" onClick=${generateEnglishDraft}>Prepare English Draft</button>${!englishEditable?html`<button className="btn cyan" disabled=${translationBusy} onClick=${translateFromEN}>${translationBusy?"TRANSLATING…":`GENERATE ${lang} TRANSLATION`}</button>`:null}</div>
    </div>
    <div className="split-screen">
      <div style=${{background:"#F9FAFB",padding:"12px",border:"1px solid var(--line2)"}}>
        <div className="sectiontitle" style=${{marginTop:0}}>English Source</div>
        <div className="pd-muted" style=${{marginBottom:"8px"}}>Select English above to edit this source.</div>
        <${PDField} label="Content Title" value=${en.title||""} disabled=${true}/>
        <${PDField} label="Short Description" type="textarea" value=${en.shortDescription||""} disabled=${true}/>
        <${PDField} label="Full Description" type="textarea" value=${en.fullDescription||""} disabled=${true}/>
        <${PDField} label="SEO Title" value=${en.seoTitle||""} disabled=${true}/>
        <${PDField} label="SEO Description" type="textarea" value=${en.seoDescription||""} disabled=${true}/>
      </div>
      <div>
        <div className="sectiontitle" style=${{marginTop:0}}>${englishEditable?"Edit English Source":`Translation (${lang})`}</div>
        ${translationReview[lang]?html`<div className="notice warn"><div>Review the generated content, property names, and local details before saving.</div><button className="btn small" style=${{marginTop:"6px"}} onClick=${()=>setTranslationReview(old=>({...old,[lang]:false}))}>CONFIRM ${lang} CONTENT REVIEWED</button></div>`:null}
        <${PDField} label="Content Title" value=${current.title||""} onChange=${v=>setLangValue("title",v)}/>
        <${PDField} label="Short Description" type="textarea" value=${current.shortDescription||""} onChange=${v=>setLangValue("shortDescription",v)}/>
        <${PDField} label="Full Description" type="textarea" value=${current.fullDescription||""} onChange=${v=>setLangValue("fullDescription",v)}/>
        <${PDField} label="Section Heading" value=${current.eyebrow||""} onChange=${v=>setLangValue("eyebrow",v)}/>
        ${["highlights","included","notIncluded"].map((name)=>html`<div className="smartgroup"><div className="smarttitle"><span>${({highlights:"Highlights",included:"Included",notIncluded:"Not Included"})[name]}</span><button className="btn small" onClick=${()=>setLangArray(name,0,"","add")}>+ ADD</button></div>${(current[name]||[]).map((item,index)=>html`<div className="pd-flex" style=${{alignItems:"flex-start",marginBottom:"6px"}}><input className="input" aria-label=${`${name} item ${index+1}`} value=${item} onInput=${e=>setLangArray(name,index,e.target.value)}/><button className="btn small danger" onClick=${()=>setLangArray(name,index,"","drop")}>REMOVE</button></div>`)}</div>`)}
        <${PDField} label="Important Information" type="textarea" value=${current.importantInformation||""} onChange=${v=>setLangValue("importantInformation",v)}/>
        <div className="sectiontitle">Website Search Details</div>
        <${PDField} label="SEO Title" value=${current.seoTitle||""} onChange=${v=>setLangValue("seoTitle",v)}/>
        <div className=${`char-count ${(current.seoTitle||"").length>60?"over":""}`}>${(current.seoTitle||"").length} / 60</div>
        <${PDField} label="SEO Description" type="textarea" value=${current.seoDescription||""} onChange=${v=>setLangValue("seoDescription",v)}/>
        <div className=${`char-count ${(current.seoDescription||"").length>160?"over":""}`}>${(current.seoDescription||"").length} / 160</div>
        <div className="seo-preview" style=${{marginTop:"12px"}}><div className="seo-url">skanditravels.com &gt; hotels &gt; ${rec.slug||"hotel"}</div><div className="seo-title">${current.seoTitle||"Page Title"}</div><div className="seo-desc">${current.seoDescription||"Page description will appear here in search results."}</div></div>
      </div>
    </div>
    <div className="paneltitle pd-module-title"><span>Media Repository</span><button className="btn primary small" onClick=${()=>setAssetPicker(assetContextForRecord(rec,"GALLERY"))}>+ ADD ASSET</button></div>
    <div className="media-grid">${media.length?media.map((m,i)=>html`<div className="media-card"><div className="assetthumb" style=${{height:"120px"}}>${m.url?html`<img className="media-img" alt=${m.altText||"Property image"} src=${m.url}/>`:html`<span>Image unavailable</span>`}</div><${PDField} label="Asset name / Alt" value=${m.altText||""} onChange=${v=>updateMedia(i,"altText",v)}/><${PDField} label="Media Role" type="select" options=${["HERO","GALLERY","ROOM","CARD","MOBILE","THUMBNAIL","LOGO"]} value=${m.role||"GALLERY"} onChange=${v=>updateMedia(i,"role",v)} disabled=${(m.payload?.provider||m.source)==="DUFFEL"}/><${PDField} label="Photo Tag" type="select" options=${["Exterior","Lobby","Room","Bathroom","General"]} value=${m.payload?.tag||"General"} onChange=${v=>updateMedia(i,"payload.tag",v)}/>${m.role==="ROOM"?html`<${PDField} label="Room Package" type="select" options=${[{value:"",label:"Select package"},...sells.map(s=>({value:s.id,label:s.name||s.id}))]} value=${m.payload?.roomLink||""} onChange=${v=>updateMedia(i,"payload.roomLink",v)}/>`:null}<button className="btn small danger" disabled=${(m.payload?.provider||m.source)==="DUFFEL"} onClick=${()=>setDraft(old=>({...old,media:old.media.filter((_,j)=>j!==i)}))}>DROP ASSET</button>${(m.payload?.provider||m.source)==="DUFFEL"?html`<div className="pd-muted">${catalog.catalogType==="SKANDI_PARTNER"?"SKANDI Partner-managed":"Supplier-managed"}</div>`:null}</div>`):html`<div className="empty" style=${{gridColumn:"1/-1"}}>No media assigned.</div>`}</div>
    ${assetPicker?html`<${AssetLibraryModal} context=${assetPicker} onClose=${()=>setAssetPicker(null)} onSelect=${addMediaAsset} setBusy=${setBusy} setToast=${setToast}/>`:null}
  </div>`;
  const renderAudit=()=>html`<div className="card panel">
    <div className="paneltitle">Property Verification</div>
    <div className="notice warn">Verification is currently unavailable. You can review property history below.</div>
    <div className="formgrid three"><${PDField} label="Source Type" type="select" options=${["Official Website","GDS Audit","Direct Contract","Phone Call"]} disabled=${true}/><${PDField} label="Verification URL / Notes" disabled=${true}/><div className="field"><label>Action</label><button className="btn cyan" disabled=${true} title="Verification is currently unavailable">LOG VERIFICATION</button></div></div>
    <div className="paneltitle pd-module-title"><span>Transaction Ledger</span><button className="btn small" disabled=${auditLoading} onClick=${getAudit}>REFRESH</button></div>
    ${auditError?html`<div className="notice bad">${employeeErrorMessage(auditError)}</div>`:null}
    <div className="tablewrap"><table className="table"><thead><tr><th>Timestamp</th><th>Operator</th><th>Action</th><th>Message</th></tr></thead><tbody>${auditRows.length?auditRows.map(x=>html`<tr><td>${String(x.timestamp||"").replace("T"," ").slice(0,19)}</td><td>${x.agentName||"—"}</td><td>${employeeAuditAction(x.eventType)}</td><td>${employeeAuditMessage(x.message)}</td></tr>`):html`<tr><td colSpan="4"><div className="empty">${auditLoading?"Retrieving property history…":"No matching property audit events."}</div></td></tr>`}</tbody></table></div>
  </div>`;
  return html`<div className="property-workspace" style=${{display:"flex",flexDirection:"column",height:"100%"}}>
    <div className="top"><div><button className="btn small" onClick=${onClose} style=${{marginBottom:"8px"}}>‹ BACK TO DIRECTORY</button><h1>[${rec.code||"NEW"}] ${rec.name||"New Property"}</h1></div><div className="toolbar"><div className="pd-header-status">${statusPill(status)}</div>${rec.id&&status!=="ARCHIVED"?html`<button className="btn small danger" onClick=${archiveProperty}>ARCHIVE PROPERTY</button>`:null}<button className="btn primary" onClick=${save}>COMMIT WORKSPACE</button></div></div>
    <div className="tabs">${[["MASTER","1. Master & Geo"],["ROOMS","2. Inventory Models"],["CHANNELS","3. Channel Matrix"],["CMS","4. Content & Media"],["AUDIT","5. Audit Gate"]].map(([id,label])=>html`<button className=${`tab ${tab===id?"active":""}`} onClick=${()=>setTab(id)}>${label}</button>`)}</div>
    <div className="property-body">${tab==="MASTER"?renderMaster():tab==="ROOMS"?renderRooms():tab==="CHANNELS"?renderChannels():tab==="CMS"?renderCms():renderAudit()}</div>
  </div>`;
}
function PropertyDirector({boot,masterFilter,setBusy,setToast,onSaved}){
  const [query,setQuery]=useState("");
  const [status,setStatus]=useState("");
  const [active,setActive]=useState(null);
  const [page,setPage]=useState(1);
  const canViewHotels=!masterFilter||masterFilter==="HOTEL";
  useEffect(()=>{if(!canViewHotels)setActive(null)},[canViewHotels]);
  const rows=(boot.records||[]).filter(x=>x.entityType==="HOTEL");
  const filtered=canViewHotels?rows.filter(h=>(!status||h.status===status)&&(!query||[h.name,h.code,h.slug,h.details?.city].join(" ").toLowerCase().includes(query.toLowerCase()))):[];
  const hotels=[...filtered].sort((a,b)=>text(a.name).localeCompare(text(b.name)));
  const pageSize=100;
  const totalPages=Math.max(1,Math.ceil(hotels.length/pageSize));
  const currentPage=Math.min(page,totalPages);
  const visible=hotels.slice((currentPage-1)*pageSize,currentPage*pageSize);
  async function openHotel(h){try{setBusy("Loading property…");const result=await request("INVENTORY_V9_GET_RECORD",{id:h.id,entityType:"HOTEL"});if(!result?.record||result.record.entityType!=="HOTEL")throw new Error("Hotel record was not returned from Inventory.");setActive(result)}catch(err){setToast(err.message,true)}finally{setBusy("")}}
  function createHotel(){setActive(recordBundle("HOTEL"))}
  if(active)return html`<${PDPropertyWorkspace} bundle=${active} boot=${boot} onClose=${()=>setActive(null)} onSaved=${onSaved} setBusy=${setBusy} setToast=${setToast}/>`;
  return html`<div className="grid">
    <div className="top"><div><div className="eyebrow">RIAINTRA / ALTEA</div><h1>Property Master Directory</h1><div className="sub">Choose a hotel to view or edit its details.</div></div><div className="toolbar"><button className="btn primary" disabled=${!canViewHotels} onClick=${createHotel}>+ INITIALIZE PROPERTY</button></div></div>
    ${!canViewHotels?html`<div className="notice warn">Master Filter is ${MASTER_FILTER_LABEL[masterFilter]||masterFilter}. Choose HOTELS or GLOBAL PORTFOLIO to open the property directory.</div>`:html`<div className="card panel">
      <div className="filters"><div className="field grow"><label>Property / Code</label><input className="input" value=${query} onInput=${e=>{setQuery(e.target.value);setPage(1)}} placeholder="Search real hotel records"/></div><div className="field w180"><label>Status</label><select className="select" value=${status} onChange=${e=>{setStatus(e.target.value);setPage(1)}}><option value="">ALL STATUSES</option>${STATUS.map(s=>html`<option value=${s}>${s}</option>`)}</select></div></div>
      <div className="tablewrap"><table className="table"><thead><tr><th>Type</th><th>Sys Code</th><th>Master Title</th><th>Dest</th><th>Status</th><th>Actions</th></tr></thead><tbody>
        ${visible.length?visible.map(h=>html`<tr className="clickrow" onClick=${()=>openHotel(h)}><td>${h.details?.propertyType||"HOTEL"}</td><td><b>${h.code||"—"}</b></td><td>${h.name||"—"}</td><td>${(boot.records||[]).find(x=>x.id===h.details?.destinationId)?.code||h.details?.destinationCode||"—"}</td><td>${statusPill(h.status)}</td><td><button className="btn small" onClick=${e=>{e.stopPropagation();openHotel(h)}}>OPEN</button></td></tr>`):html`<tr><td colSpan="6"><div className="empty">No matching hotels found.</div></td></tr>`}
      </tbody></table></div><${Pagination} page=${currentPage} totalPages=${totalPages} total=${hotels.length} pageSize=${pageSize} onPage=${setPage}/>
    </div>`}
  </div>`;
}

function Overview({boot,setView,masterFilter}){
  const q=boot.quality||{},s=boot.stats||{};
  const scopedRecords=(boot.records||[]).filter(r=>!masterFilter||(masterFilter==="TOURS_ACTIVITIES"?["GUIDED_TOUR","ACTIVITY"].includes(r.entityType):r.entityType===masterFilter));
  const scopedCount=scopedRecords.length;
  const inScope=Boolean(masterFilter);
  return html`<div className="grid">
    <div className="stats">${(inScope?[["Records in scope",scopedCount],["Published",scopedRecords.filter(r=>r.status==="PUBLISHED").length],["Active",scopedRecords.filter(r=>r.active!==false).length],["Customer visible",scopedRecords.filter(r=>r.customerVisible===true).length],["ALTEA visible",scopedRecords.filter(r=>r.alteaVisible!==false).length]]:[["Travel Records",s.total],["Catalog Placements",s.catalog],["Searchable",s.searchableCatalog],["Aircraft",s.aircraft],["Cabins",s.cabins]]).map(([l,v])=>html`<div className="card stat"><span>${l}</span><strong>${v??0}</strong></div>`)}</div>
    <div className="split"><div className="card panel"><div className="paneltitle">Inventory Families</div><div className="grid" style=${{gridTemplateColumns:"repeat(auto-fit,minmax(145px,1fr))"}}>${Object.entries(s.byType||{}).filter(([k])=>!masterFilter||masterFilter===k||(masterFilter==="TOURS_ACTIVITIES"&&["GUIDED_TOUR","ACTIVITY"].includes(k))).map(([k,v])=>html`<button className="btn" onClick=${()=>setView(k==="HOTEL"?"property":"master")}><b>${LABEL[k]||k}</b><br/><span className="sub">${v} records</span></button>`)}</div></div>
      <div className="card panel"><div className="paneltitle">Aircraft Sync Health</div><div className="kpirow"><div className="kpi"><b>${q.aircraftSync?.fleetTemplates??0}</b> fleet templates</div><div className="kpi"><b>${q.aircraftSync?.aircraftRecords??0}</b> aircraft records</div><div className="kpi"><b>${q.aircraftSync?.missing??0}</b> missing</div></div><div className=${`notice ${q.aircraftSync?.missing?"warn":""}`} style=${{marginTop:"12px"}}>${q.aircraftSync?.missing?"Open Aircraft & Cabin Studio and run Smart Sync to create missing records in Review.":"Fleet master is currently reconciled."}</div></div>
    </div>
    <div className="card panel"><div className="paneltitle">Operational Inventory</div><div className="stats">${[["Dated Capacity",s.dated],["Flight Legs",s.flightLegs],["Booking Classes",s.flightClasses],["Schedules",s.schedules],["Nesting Controls",s.nesting]].map(([l,v])=>html`<div className="stat"><span>${l}</span><strong>${v??0}</strong><em>${v?"loaded":"no rows yet"}</em></div>`)}</div></div>
  </div>`
}


function App(){
  const [boot,setBoot]=useState(null);
  const [view,setView]=useState("overview");
  const [masterFilter,setMasterFilter]=useState("");
  const [busy,setBusy]=useState("Connecting Inventory Control…");
  const [toast,setToastState]=useState(null);
  const [masterConfig,setMasterConfig]=useState(null);
  const [connectionError,setConnectionError]=useState("");
  function setToast(message,error=false){
    const display=error?employeeErrorMessage(message):text(message);
    if(error&&!requests.size&&INTERNAL_ISSUE_PATTERN.test(text(message)))logInventoryIssue("ui-error",{kind:"technical-response"});
    setToastState({message:display,error});setTimeout(()=>setToastState(null),4200);
  }
  async function refresh(){
    try{setBusy("Refreshing Inventory Control…");setConnectionError("");const r=await request("INVENTORY_V9_REFRESH",{});setBoot(r)}catch(e){if(!boot)setConnectionError(employeeErrorMessage(e.message,"Unable to load Inventory Control. Select Refresh to try again."));setToast(e.message,true)}finally{setBusy("")}
  }
  useEffect(()=>{
    let bootstrapSettled=false;
    let readyInterval=null;
    let bridgeWatchdog=null;
    function clearReadyTimers(){
      if(readyInterval!==null){clearInterval(readyInterval);readyInterval=null;}
      if(bridgeWatchdog!==null){clearTimeout(bridgeWatchdog);bridgeWatchdog=null;}
    }
    function message(e){
      if(e.source!==window.parent)return;
      const m=e.data||{};
      if(m.source===MASTER_PARENT && m.type==="SKANDI_MASTER_CONFIG"){setMasterConfig(m.payload||{});return}
      if(m.source!==PARENT)return;
      if(m.type==="INVENTORY_V9_HOST_READY"){if(!bootstrapSettled)sendReady();return}
      if(m.type==="INVENTORY_V9_BOOTSTRAP"){
        bootstrapSettled=true;clearReadyTimers();setBoot(m.payload);setConnectionError("");setBusy("");
      }
      if(m.type==="INVENTORY_ERROR"){
        const code=String(m.payload?.code||"");
        const raw=String(m.payload?.message||"Inventory request failed.");
        const p=requests.get(m.requestId);
        logInventoryIssue("backend-response",{action:p?.type||"connection",requestId:String(m.requestId||""),code});
        if(p){clearTimeout(p.timer);requests.delete(m.requestId);const error=new Error(raw);error.code=code;p.reject(error)}
        else if(String(m.requestId||"").startsWith("READY-")){
          bootstrapSettled=true;clearReadyTimers();setBusy("");setConnectionError("Unable to load Inventory Control. Select Refresh to try again.");
        }
        else setToast(raw,true);
        return;
      }
      if(m.type==="INVENTORY_V9_PROGRESS")return;
      const p=requests.get(m.requestId);
      if(p){clearTimeout(p.timer);requests.delete(m.requestId);p.resolve(m.payload||{});}
    }
    window.addEventListener("message",message);
    // The Wix component may mount after the first ready notification. Retry
    // only this read-only handshake; never automatically replay mutations.
    readyInterval=setInterval(()=>{if(!bootstrapSettled)sendReady()},1500);
    bridgeWatchdog=setTimeout(()=>{
      bootstrapSettled=true;clearReadyTimers();setBusy("");
      logInventoryIssue("connection-timeout",{action:"INVENTORY_V9_READY"});
      setConnectionError("Unable to load Inventory Control. Select Refresh to try again.");
    },REQUEST_TIMEOUT_MS);
    sendReady();
    window.parent.postMessage({source:SOURCE,type:"SKANDI_MASTER_CONFIG_REQUEST",payload:{}}, "*");
    return()=>{window.removeEventListener("message",message);clearReadyTimers()}
  },[]);


  const nav=[["overview","Workspace Dashboard"],["provider","Supplier & Distribution"],["master","Travel Inventory"],["property","Property Director"],["assets","Asset Library"],["dated","Inventory & Capacity"],["air","Air Inventory"],["aircraft","Aircraft & Cabin Studio"],["quality","Publishing & QA"],["audit","Audit"]];
  return html`<div className="shell">
    <header className="global-header">
      <div className="global-brand"><strong>ALTEA</strong><span className="system-label">SKANDI TRAVELS · INVENTORY CONTROL</span></div>
      <div className="global-controls">
        <div className="global-scope"><label htmlFor="inventoryMasterScope">Master Filter:</label><select id="inventoryMasterScope" aria-label="Master Filter" value=${masterFilter} onChange=${e=>setMasterFilter(e.target.value)}><option value="">GLOBAL PORTFOLIO</option>${MASTER_FILTERS.map(t=>html`<option value=${t}>${(MASTER_FILTER_LABEL[t]||t).toUpperCase()}</option>`)}</select></div>
        <span className="operator">OPE: RIAINTRA</span>
      </div>
    </header>
    <div className="shell-body"><aside className="sidebar"><div className="group">Navigation</div>${nav.map(([k,l])=>html`<button className=${`navbtn ${view===k?"active":""}`} onClick=${()=>setView(k)}>${l}</button>`)}</aside>
    <main className="main"><div className="top"><div><div className="eyebrow">SKANDI TRAVELS · ALTEA · RIAINTRA</div><h1>${nav.find(x=>x[0]===view)?.[1]||"Inventory Control"}</h1><div className="sub">Manage travel inventory, hotels, suppliers, rates and aircraft.</div></div><div className="toolbar"><button className="btn" onClick=${refresh}>Refresh</button></div></div>
      ${masterFilter&&!["overview","master","property","provider"].includes(view)?html`<div className="scope-label">Showing ${MASTER_FILTER_LABEL[masterFilter]||masterFilter}.</div>`:null}
      ${!boot?html`<div className="card panel"><div className=${`notice ${connectionError?"bad":""}`}><b>${connectionError?"Inventory Control is unavailable":"Connecting to Inventory Control…"}</b>${connectionError?html`<div style=${{marginTop:"8px"}}>${connectionError}</div>`:null}</div></div>`:
        view==="overview"?html`<${Overview} boot=${boot} setView=${setView} masterFilter=${masterFilter}/>`:
        view==="provider"?html`<${ProviderWorkspace} boot=${boot} setBoot=${setBoot} setBusy=${setBusy} setToast=${setToast} masterFilter=${masterFilter} setView=${setView}/>`:
        view==="master"?html`<${MasterRecords} boot=${boot} setBoot=${setBoot} setBusy=${setBusy} setToast=${setToast} masterFilter=${masterFilter} setMasterFilter=${setMasterFilter} setView=${setView}/>`:
        view==="property"?html`<${PropertyDirector} boot=${boot} masterFilter=${masterFilter} setBusy=${setBusy} setToast=${setToast} onSaved=${refresh}/>`:
        view==="assets"?html`<${AssetLibraryPanel} setBusy=${setBusy} setToast=${setToast}/>`:
        view==="dated"?html`<${DatedInventory} boot=${boot} setBusy=${setBusy} setToast=${setToast}/>`:
        view==="air"?html`<${AirInventory} boot=${boot} setBusy=${setBusy} setToast=${setToast}/>`:
        view==="aircraft"?html`<${AircraftStudio} boot=${boot} setBusy=${setBusy} setToast=${setToast}/>`:
        view==="quality"?html`<${Quality} boot=${boot} setBusy=${setBusy} setToast=${setToast}/>`:
        html`<${Audit} setBusy=${setBusy} setToast=${setToast}/>`}
    </main></div>
    ${busy?html`<div className="loading"><div className="loaderbox">${busy}</div></div>`:null}
    ${toast?html`<div className=${`toast ${toast.error?"error":""}`}>${toast.message}</div>`:null}
  </div>`
}
createRoot(document.getElementById("root")).render(html`<${React.StrictMode}><${App}/></${React.StrictMode}>`); 
