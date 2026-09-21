// /src/backend/SKANDI_CORE/reservations.js
// SKANDI ALTEA Reservations — canonical SKANDI-owned booking/operations logic.
// SKANDI Backend Base 1.0 — B-007 Reservations core.
// Preserves the accepted R-006.9 booking, Inventory, Club, document and DCS behavior.
// Staff ground-product persistence is owned here; provider HTTP stays in duffelGround.js.
// Customer confirmed-cart -> ALTEA synchronization remains database-trigger owned.


import { createHash } from "crypto";
import { restRequest, rpcRequest } from "backend/SKANDI_CORE/supabaseServer";
import { getStaffPortalSessionCore } from "backend/SKANDI_CORE/staffAuth";
import {
  prepareAssetUploadCore,
  finalizeAssetUploadCore,
  registerAssetUsageCore
} from "backend/SKANDI_CORE/assets";
import { checkExternalTravelRequirements } from "backend/SKANDI_CORE/travelRequirements";
import { renderBookingConfirmation } from "backend/SKANDI_CORE/bookingConfirmation";
import { renderAtbTicket } from "backend/SKANDI_CORE/atbTicket";
import { renderBagTag } from "backend/SKANDI_CORE/bagTag";
import { renderInvoice } from "backend/SKANDI_CORE/invoice";


export const RESERVATIONS_CORE_VERSION = "BACKEND-BASE-1.0-B007.5";


const clean=(v,n=12000)=>String(v??"").trim().slice(0,n);
const upper=(v,n=12000)=>clean(v,n).toUpperCase();
const lower=(v,n=12000)=>clean(v,n).toLowerCase();
const arr=v=>Array.isArray(v)?v:[];
const obj=v=>v&&typeof v==="object"&&!Array.isArray(v)?v:{};
const isUuid=v=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(clean(v,80));
const qeq=v=>`eq.${clean(v,500)}`;
const now=()=>new Date().toISOString();


const PRODUCT_TYPES=new Set([
  "CHARTER_PACKAGE","FLIGHT_ONLY","HOTEL_ONLY","TRANSFER_ONLY",
  "EXCURSION_ONLY","CAR_RENTAL_ONLY","MIXED_PACKAGE"
]);
const BOOKING_STATUSES=new Set([
  "draft","cart","priced","payment_pending","payment_authorized",
  "confirmed","ticketed","cancelled","reopened","warning"
]);
const PAX_TYPES=new Set(["ADT","CHD","INF","YTH","SRC"]);
const APIS_STATUSES=new Set(["not_started","pending","passed","failed","manual_review"]);
const DOCUMENT_TYPES=new Set([
  "booking_confirmation","boarding_pass","baggage_tag","voucher",
  "ticket","emd","invoice","apis_report"
]);
const DOCUMENT_STATUSES=new Set(["draft","issued","voided","reissued","sent","failed"]);
const DOCUMENT_UI_TO_STORAGE=Object.freeze({
  DRAFT:"draft",ACTIVE:"issued",ISSUED:"issued",SENT:"sent",VOID:"voided",VOIDED:"voided",
  REFUNDED:"voided",SUPERSEDED:"reissued",REISSUED:"reissued",FAILED:"failed"
});
const DOCUMENT_STORAGE_TO_UI=Object.freeze({
  draft:"DRAFT",issued:"ACTIVE",sent:"ACTIVE",voided:"VOID",reissued:"SUPERSEDED",failed:"FAILED"
});
function storageDocumentStatus(value){
  const raw=upper(value,40);
  const mapped=DOCUMENT_UI_TO_STORAGE[raw]||lower(value,40);
  if(!DOCUMENT_STATUSES.has(mapped))throw new Error("DOCUMENT_STATUS_INVALID");
  return mapped;
}
function uiDocumentStatus(value){return DOCUMENT_STORAGE_TO_UI[lower(value,40)]||upper(value,40)||"DRAFT";}
const SELLABLE_TYPES=new Set([
  "HOTEL","TRANSFER","GUIDED_TOUR","ACTIVITY","PARTNER_TICKET",
  "PACKAGE","ANCILLARY","CAR_RENTAL"
]);


function normalizedPermissionValues(session){
  const p=obj(session?.profile);
  return new Set([
    ...arr(session?.permissionKeys),...arr(session?.permissions),
    ...arr(session?.allowedApps),...arr(session?.permissionGroups),
    ...arr(p.permissionKeys),...arr(p.allowedApps),...arr(p.permissionGroups)
  ].map(x=>lower(typeof x==="string"?x:(x?.id||x?.key||x?.permission),160)).filter(Boolean));
}
export async function requireReservationsAccessCore({write=false}={}){
  const session=await getStaffPortalSessionCore();
  if(!session?.loggedIn||!session?.authorized){
    const e=new Error("AUTH_REQUIRED");e.code="AUTH_REQUIRED";throw e;
  }
  const p=obj(session.profile),keys=normalizedPermissionValues(session);
  const all=lower(session.permissionPreset||p.permissionPreset,80)==="all"||keys.has("system-admin");
  const hasApp=all||keys.has("altea")||keys.has("occ_controller")||keys.has("sales")||keys.has("dcs")||
    arr(session.allowedApps).map(x=>lower(typeof x==="string"?x:(x?.id||x?.key),100)).includes("altea");
  if(!hasApp){
    const e=new Error("ALTEA_ACCESS_DENIED");e.code="ALTEA_ACCESS_DENIED";throw e;
  }
  if(write&&!all&&lower(session.permissionPreset||p.permissionPreset,80)==="read-only"){
    const e=new Error("ALTEA_WRITE_ACCESS_DENIED");e.code="ALTEA_WRITE_ACCESS_DENIED";throw e;
  }
  return session;
}
function actor(session){return isUuid(session?.profile?.id)?session.profile.id:null}
async function select(table,query={}){return arr(await restRequest({table,method:"GET",query,prefer:""}))}
async function insert(table,body){return arr(await restRequest({table,method:"POST",body,prefer:"return=representation"}))}
async function patch(table,query,body){return arr(await restRequest({table,method:"PATCH",query,body,prefer:"return=representation"}))}
async function remove(table,query){return restRequest({table,method:"DELETE",query,prefer:"return=minimal"})}


const BAGGAGE_RULE_CACHE_TTL_MS=10*60*1000;
let baggageRuleCache={expiresAt:0,rows:[]};

function referenceKey(value){return upper(value,240).replace(/[^A-Z0-9]+/g,"")}
function cabinFamily(value){
  const v=upper(value,160);
  if(!v)return"";
  if(v.includes("FIRST"))return"FIRST";
  if(v.includes("BUSINESS")||v.includes("DELTA ONE")||v.includes("CLUB WORLD"))return"BUSINESS";
  if(v.includes("PREMIUM"))return"PREMIUM_ECONOMY";
  if(v.includes("ECONOMY")||v.includes("MAIN CABIN")||v.includes("WORLD TRAVELLER"))return"ECONOMY";
  return referenceKey(v);
}
function carrierAliases(value){
  return upper(value,120).split(/[\/,;|]+/).map(x=>x.trim()).filter(Boolean);
}
function routeAliases(origin,destination){
  const a=upper(origin,8),b=upper(destination,8);
  if(!a||!b)return new Set();
  return new Set([`${a}${b}`,`${a}-${b}`,`${a}_${b}`,`${a}/${b}`,`${a}>${b}`].map(referenceKey));
}
function baggageTextFromDuffel(items=[]){
  const parts=arr(items).map(item=>{
    const quantity=Number.isFinite(Number(item?.quantity))?Number(item.quantity):null;
    const type=clean(item?.type||"baggage",80).replaceAll("_"," ");
    const weight=Number.isFinite(Number(item?.weight))?Number(item.weight):null;
    const unit=upper(item?.weightUnit||item?.weight_unit||"",10);
    const qty=quantity===null?"":`${quantity} × `;
    const wt=weight===null?"":` (${weight}${unit?` ${unit}`:""})`;
    return `${qty}${type}${wt}`.trim();
  }).filter(Boolean);
  return parts.join(" · ");
}
function baggageTextFromRule(rule={}){
  const payload=obj(rule.payload),allowance=obj(obj(payload.fare).baggage_allowance);
  const checked=clean(allowance.checked_bag||payload.checked_bag,300);
  const overhead=clean(allowance.overhead_carry_on||payload.overhead_carry_on,300);
  const underSeat=clean(allowance.under_seat_bag||payload.under_seat_bag,300);
  const detailed=[checked&&`Checked: ${checked}`,overhead&&`Cabin: ${overhead}`,underSeat&&`Personal item: ${underSeat}`].filter(Boolean);
  if(detailed.length)return detailed.join(" · ");
  const pieces=Number(rule.checkedBagsIncluded);
  const kg=Number(rule.checkedBagWeightKg);
  if(Number.isFinite(pieces)){
    if(pieces<=0)return"Checked baggage not included";
    return `${pieces} checked bag${pieces===1?"":"s"} included${Number.isFinite(kg)?` · ${kg} kg each`:""}`;
  }
  return clean(rule.body||rule.title,600);
}
async function loadBaggageRules(){
  if(baggageRuleCache.expiresAt>Date.now())return baggageRuleCache.rows;
  const rows=await select("baggage_allowance",{
    select:"id,ruleId,airlineCode,routeId,fareBrand,cabinClass,checkedBagsIncluded,checkedBagWeightKg,cabinBagsIncluded,cabinBagWeightKg,sportsEquipmentPolicy,infantPolicy,effectiveFrom,effectiveTo,sourceUrl,title,body,payload,active,sort_order",
    active:"eq.true",
    limit:"2000"
  });
  baggageRuleCache={expiresAt:Date.now()+BAGGAGE_RULE_CACHE_TTL_MS,rows};
  return rows;
}
function ruleIsEffective(rule,travelDate){
  const date=clean(travelDate,10).slice(0,10);
  if(!date)return true;
  const from=clean(rule.effectiveFrom,10),to=clean(rule.effectiveTo,10);
  if(from&&date<from)return false;
  if(to&&date>to)return false;
  return true;
}
function resolveBaggageRule({rules=[],carrierCodes=[],origin="",destination="",fareBrand="",cabinClass="",travelDate=""}={}){
  const codeRanks=new Map();
  carrierCodes.map(x=>upper(x,12)).filter(Boolean).forEach((code,index)=>{
    if(!codeRanks.has(code))codeRanks.set(code,Math.max(1,4-index));
  });
  if(!codeRanks.size)return null;
  const routeKeys=routeAliases(origin,destination);
  const fareKey=referenceKey(fareBrand);
  const cabinKey=cabinFamily(cabinClass);
  let best=null;
  for(const rule of rules){
    if(rule.active===false||!ruleIsEffective(rule,travelDate))continue;
    const aliases=carrierAliases(rule.airlineCode);
    const carrierRank=Math.max(0,...aliases.map(code=>codeRanks.get(code)||0));
    if(!carrierRank)continue;
    const ruleRoute=referenceKey(rule.routeId);
    if(ruleRoute&&routeKeys.size&&!routeKeys.has(ruleRoute))continue;
    const ruleFare=referenceKey(rule.fareBrand);
    const ruleCabin=cabinFamily(rule.cabinClass);
    let score=carrierRank*100;
    const matchedBy=["AIRLINE"];
    if(ruleRoute&&routeKeys.has(ruleRoute)){score+=90;matchedBy.push("ROUTE");}
    else if(!ruleRoute)score+=10;
    if(fareKey&&ruleFare){
      if(fareKey===ruleFare){score+=80;matchedBy.push("FARE_BRAND");}
      else if(fareKey.includes(ruleFare)||ruleFare.includes(fareKey)){score+=55;matchedBy.push("FARE_BRAND");}
    }
    if(cabinKey&&ruleCabin&&cabinKey===ruleCabin){score+=40;matchedBy.push("CABIN");}
    if(!fareKey&&!cabinKey&&rules.filter(x=>carrierAliases(x.airlineCode).some(code=>codeRanks.has(code))).length>1)continue;
    const sort=Number.isFinite(Number(rule.sort_order))?Number(rule.sort_order):999999;
    if(!best||score>best.score||(score===best.score&&sort<best.sort))best={rule,score,sort,matchedBy};
  }
  if(!best)return null;
  const r=best.rule;
  return{
    source:"SKANDI_BAGGAGE_ALLOWANCE",sourceRank:2,fallback:true,
    matchedBy:best.matchedBy,matchScore:best.score,
    confidence:best.matchedBy.includes("FARE_BRAND")||best.matchedBy.includes("ROUTE")?"HIGH":best.matchedBy.includes("CABIN")?"MEDIUM":"LOW",
    ruleId:r.ruleId||r.id||"",airlineCode:r.airlineCode||"",routeId:r.routeId||"",
    fareBrand:r.fareBrand||"",cabinClass:r.cabinClass||"",
    checkedBagsIncluded:r.checkedBagsIncluded??null,
    checkedBagWeightKg:r.checkedBagWeightKg==null?null:Number(r.checkedBagWeightKg),
    cabinBagsIncluded:r.cabinBagsIncluded??null,
    cabinBagWeightKg:r.cabinBagWeightKg==null?null:Number(r.cabinBagWeightKg),
    sportsEquipmentPolicy:r.sportsEquipmentPolicy||"",infantPolicy:r.infantPolicy||"",
    sourceUrl:r.sourceUrl||"",title:r.title||"",description:r.body||"",
    display:baggageTextFromRule(r)
  };
}
function duffelBaggageAllowance(passenger={}){
  const baggages=arr(passenger.baggages);
  if(!baggages.length)return null;
  return{
    source:"DUFFEL",sourceRank:1,fallback:false,matchedBy:["DUFFEL_SEGMENT_PASSENGER"],
    confidence:"AUTHORITATIVE",baggages,
    display:baggageTextFromDuffel(baggages)||"Duffel baggage allowance returned"
  };
}
async function enrichFlightEntityWithBaggage(entity={},rules=[]){
  const ownerCode=upper(entity.owner?.iataCode||entity.owner?.iata_code,12);
  let fallbackUsed=false;
  const slices=arr(entity.slices).map(slice=>{
    const fareBrand=clean(slice.fareBrandName||slice.fare_brand_name,160);
    const segments=arr(slice.segments).map(segment=>{
      const origin=upper(segment.origin?.iataCode||segment.origin?.iata_code||segment.origin,8);
      const destination=upper(segment.destination?.iataCode||segment.destination?.iata_code||segment.destination,8);
      const carrierCodes=[
        ownerCode,
        upper(segment.marketingCarrier?.iataCode||segment.marketing_carrier?.iata_code,12),
        upper(segment.operatingCarrier?.iataCode||segment.operating_carrier?.iata_code,12)
      ].filter(Boolean);
      const travelDate=clean(segment.departingAt||segment.departing_at,30).slice(0,10);
      const passengers=arr(segment.passengers).map(passenger=>{
        const primary=duffelBaggageAllowance(passenger);
        if(primary)return{...passenger,baggageAllowance:primary};
        const fallback=resolveBaggageRule({
          rules,carrierCodes,origin,destination,fareBrand,
          cabinClass:passenger.cabinClass||passenger.cabin_class||passenger.cabinClassMarketingName||passenger.cabin_class_marketing_name,
          travelDate
        });
        if(fallback)fallbackUsed=true;
        return{...passenger,baggageAllowance:fallback};
      });
      let segmentAllowance=null;
      if(!passengers.length||passengers.every(p=>!p.baggageAllowance)){
        segmentAllowance=resolveBaggageRule({rules,carrierCodes,origin,destination,fareBrand,cabinClass:"",travelDate});
        if(segmentAllowance)fallbackUsed=true;
      }
      return{...segment,passengers,baggageAllowance:segmentAllowance};
    });
    return{...slice,segments};
  });
  return{
    ...entity,slices,
    flightDataSources:["DUFFEL","SKANDI_BAGGAGE_ALLOWANCE"],
    baggageFallbackUsed:fallbackUsed
  };
}
export async function enrichDuffelFlightPayloadCore(payload={}){
  const rules=await loadBaggageRules();
  const out={...obj(payload)};
  if(Array.isArray(payload.offers)){
    out.offers=await Promise.all(payload.offers.map(offer=>enrichFlightEntityWithBaggage(offer,rules)));
  }
  if(payload.offer)out.offer=await enrichFlightEntityWithBaggage(payload.offer,rules);
  if(payload.order)out.order=await enrichFlightEntityWithBaggage(payload.order,rules);
  out.flightDataSources=["DUFFEL","SKANDI_BAGGAGE_ALLOWANCE"];
  return out;
}
function buildFlightDetails(source={}){
  const slices=arr(source.slices);
  const flattened=[];
  slices.forEach((slice,sliceIndex)=>{
    arr(slice.segments).forEach((segment,segmentIndex)=>{
      const marketingCode=upper(segment.marketingCarrier?.iataCode||segment.marketing_carrier?.iata_code,12);
      const operatingCode=upper(segment.operatingCarrier?.iataCode||segment.operating_carrier?.iata_code,12);
      flattened.push({
        segId:`${sliceIndex+1}.${segmentIndex+1}`,
        id:segment.id||"",
        flightNumber:`${marketingCode}${clean(segment.marketingFlightNumber||segment.marketing_carrier_flight_number,20)}`,
        marketingCarrierCode:marketingCode,
        operatingCarrierCode:operatingCode,
        operatingCarrier:segment.operatingCarrier?.name||segment.operating_carrier?.name||"",
        origin:segment.origin?.iataCode||segment.origin?.iata_code||segment.origin||"",
        originTerminal:segment.originTerminal||segment.origin_terminal||"",
        destination:segment.destination?.iataCode||segment.destination?.iata_code||segment.destination||"",
        destinationTerminal:segment.destinationTerminal||segment.destination_terminal||"",
        departingAt:segment.departingAt||segment.departing_at||null,
        arrivingAt:segment.arrivingAt||segment.arriving_at||null,
        aircraft:segment.aircraft?.name||segment.aircraft?.iataCode||segment.aircraft?.iata_code||"",
        aircraftCode:segment.aircraft?.iataCode||segment.aircraft?.iata_code||"",
        duration:segment.duration||slice.duration||"",
        rbd:"—",
        fareBrand:slice.fareBrandName||slice.fare_brand_name||"",
        passengers:arr(segment.passengers).map(p=>({
          passengerId:p.passengerId||p.passenger_id||p.id||"",
          fareBasisCode:p.fareBasisCode||p.fare_basis_code||"",
          cabinClass:p.cabinClass||p.cabin_class||"",
          cabinClassMarketingName:p.cabinClassMarketingName||p.cabin_class_marketing_name||"",
          cabinBrand:slice.fareBrandName||slice.fare_brand_name||p.cabinClassMarketingName||p.cabin_class_marketing_name||p.cabinClass||p.cabin_class||"",
          baggage:p.baggageAllowance?.display||"",
          baggageSource:p.baggageAllowance?.source||"",
          baggageSourceRank:p.baggageAllowance?.sourceRank||null,
          baggageAllowance:p.baggageAllowance||null
        })),
        baggageAllowance:segment.baggageAllowance||null
      });
    });
  });
  const conditions=obj(source.conditions);
  const refund=obj(conditions.refund_before_departure||conditions.refundBeforeDeparture);
  const change=obj(conditions.change_before_departure||conditions.changeBeforeDeparture);
  const total=Number(source.totalAmount??source.total_amount??0);
  const tax=Number(source.taxAmount??source.tax_amount??0);
  const baseRaw=source.baseAmount??source.base_amount;
  const base=baseRaw==null?Math.max(0,total-(Number.isFinite(tax)?tax:0)):Number(baseRaw);
  return{
    provider:"DUFFEL",
    sourcePriority:["DUFFEL","SKANDI_BAGGAGE_ALLOWANCE"],
    baggageFallbackUsed:flattened.some(seg=>seg.baggageAllowance?.sourceRank===2||seg.passengers.some(p=>p.baggageSourceRank===2)),
    slicesCount:slices.length,
    segments:flattened,
    pricingRecord:{
      baseAmount:Number.isFinite(base)?base:0,
      taxAmount:Number.isFinite(tax)?tax:0,
      totalAmount:Number.isFinite(total)?total:0,
      currency:upper(source.totalCurrency||source.total_currency||source.baseCurrency||source.base_currency||"USD",3),
      fareBrand:slices[0]?.fareBrandName||slices[0]?.fare_brand_name||"",
      validatingCarrier:source.owner?.iataCode||source.owner?.iata_code||flattened[0]?.marketingCarrierCode||"",
      paymentDeadline:source.paymentRequiredBy||source.payment_required_by||source.expiresAt||source.expires_at||null
    },
    miniRules:{
      refundable:refund.allowed===true,
      refundPenalty:refund.penalty_amount??refund.penaltyAmount??null,
      changeable:change.allowed===true,
      changePenalty:change.penalty_amount??change.penaltyAmount??null
    }
  };
}


function bookingView(r={}){
  const p=obj(r.payload);
  return{
    id:r.id,bookingReference:r.booking_reference||"",cartId:r.cart_id||"",
    pnrLocator:r.pnr_locator||"",bookingType:r.booking_type||"",
    productType:r.product_type||"FLIGHT_ONLY",customerMemberId:r.customer_member_id||"",
    customerEmail:r.customer_email||"",customerName:r.customer_name||"",
    status:r.status||"draft",paymentStatus:r.payment_status||"unpaid",
    fulfillmentStatus:r.fulfillment_status||"pending",origin:r.origin||"",
    destination:r.destination||"",departureDate:r.departure_date||"",
    returnDate:r.return_date||"",startDate:r.departure_date||"",endDate:r.return_date||"",
    currency:r.currency||"SEK",totalAmount:Number(r.total_amount||0),
    taxAmount:Number(r.tax_amount||0),sourcePage:r.source_page||"",
    sourceChannel:r.source_channel||"",supplier:r.supplier||"SKANDI",
    supplierOrderId:r.supplier_order_id||"",supplierBookingReference:r.supplier_booking_reference||"",
    supplierOfferId:r.supplier_offer_id||"",paymentReference:r.payment_reference||"",
    ticketingStatus:r.ticketing_status||"pending",assignedAgentUserId:r.assigned_agent_user_id||"",
    dcsAuthority:p.dcsAuthority||"",operatingControl:p.operatingControl||"",
    isCharter:p.isCharter===true,tripTitle:p.tripTitle||"",transferControl:p.transferControl||"",
    packageStatus:p.packageStatus||"",tourOperatorCode:p.tourOperatorCode||"",
    destinationResortZone:p.destinationResortZone||"",durationNights:Number(p.durationNights||0)||0,
    mealBoard:p.mealBoard||"",roomTypeCode:p.roomTypeCode||"",passengerAges:arr(p.passengerAges),
    notes:p.notes||"",flightDetails:p.flightDetails||null,payload:p,
    createdAt:r.created_at||"",updatedAt:r.updated_at||""
  };
}
function passengerView(r={}){
  const p=obj(r.payload);
  return{
    id:r.id,bookingId:r.booking_id,passengerRef:r.passenger_ref||"",
    paxType:r.pax_type||"ADT",firstName:r.first_name||"",lastName:r.last_name||"",
    displayName:r.display_name||[r.first_name,r.last_name].filter(Boolean).join(" "),
    gender:r.gender||"",dateOfBirth:r.date_of_birth||"",nationality:r.nationality||"",
    passportLast4:r.passport_last4||"",apisStatus:r.apis_status||"not_started",
    documentStatus:r.document_status||"not_checked",checkinStatus:r.checkin_status||"not_checked_in",
    seatNumber:r.seat_number||"",sequenceNumber:r.sequence_number||"",
    supplierPassengerId:r.supplier_passenger_id||"",boardingStatus:p.boardingStatus||"",
    baggageCount:Number(p.baggageCount||0),baggageWeight:Number(p.baggageWeight||0),
    payload:p,createdAt:r.created_at||"",updatedAt:r.updated_at||""
  };
}
function componentView(r={}){
  const p=obj(r.payload);
  return{
    id:r.id,componentId:r.id,bookingId:r.booking_id,componentType:r.component_type,
    entityType:r.component_type,supplier:r.supplier||"SKANDI",sourceEntityId:r.source_entity_id||"",
    supplierReference:r.supplier_reference||"",title:r.title||"",status:r.status||"",
    quantity:Number(r.quantity||1),currency:r.currency||"",
    unitAmount:Number(r.unit_amount||0),totalAmount:Number(r.total_amount||0),
    serviceDate:p.serviceDate||p.startDate||"",startDate:p.startDate||p.serviceDate||"",
    endDate:p.endDate||"",passengerCount:Number(p.passengerCount||0),
    operationalNotes:p.operationalNotes||"",payload:p,createdAt:r.created_at||"",updatedAt:r.updated_at||""
  };
}
function documentView(r={}){
  const p=obj(r.payload);
  return{
    id:r.id,bookingId:r.booking_id||"",passengerId:r.passenger_id||"",
    documentType:upper(p.renderVariant||r.document_type,80),storageDocumentType:r.document_type,
    documentNumber:r.document_number||"",status:uiDocumentStatus(r.status),
    storageStatus:lower(r.status,40),pdfUrl:r.pdf_url||"",htmlSnapshot:r.html_snapshot||"",
    assetId:p.assetId||"",assetCode:p.assetCode||"",assetStatus:p.assetStatus||"",
    contentType:p.contentType||"text/html",renderFormat:p.renderFormat||"HTML",
    provider:p.provider||"SKANDI",authority:p.authority||"",payload:p,
    issuedAt:r.issued_at||"",createdAt:r.created_at||"",updatedAt:r.updated_at||""
  };
}
function historyView(r={}){
  return{
    id:r.id,bookingId:r.booking_id||"",pnrLocator:r.pnr_locator||"",
    command:r.command||"",eventType:r.event_type||"",beforeState:r.before_state||null,
    afterState:r.after_state||null,payload:obj(r.payload),supplier:r.supplier||"",
    createdAt:r.created_at||""
  };
}
function segmentView(r={}){
  return{
    id:r.id,bookingId:r.booking_id||"",segmentType:r.segment_type||"",
    segmentRef:r.segment_ref||"",supplier:r.supplier||"",status:r.status||"",
    origin:r.origin||"",destination:r.destination||"",departureDate:r.departure_date||"",
    returnDate:r.return_date||"",departureTime:r.departure_time||"",arrivalTime:r.arrival_time||"",
    flightNumber:r.flight_number||"",cabin:r.cabin||"",bookingClass:r.booking_class||"",
    hotelName:r.hotel_name||"",roomType:r.room_type||"",boardBasis:r.board_basis||"",
    transferType:r.transfer_type||"",excursionName:r.excursion_name||"",
    quantity:r.quantity??null,amount:r.amount??null,currency:r.currency||"",payload:obj(r.payload)
  };
}
async function bookingRow(id){
  if(!isUuid(id))return null;
  return (await select("altea_bookings",{select:"*",id:qeq(id),limit:"1"}))[0]||null;
}
async function passengerRow(id){
  if(!isUuid(id))return null;
  return (await select("altea_passengers",{select:"*",id:qeq(id),limit:"1"}))[0]||null;
}
async function componentRow(id){
  if(!isUuid(id))return null;
  return (await select("altea_booking_components",{select:"*",id:qeq(id),limit:"1"}))[0]||null;
}
async function history(bookingId,eventType,payload={},session=null){
  const b=await bookingRow(bookingId);
  return insert("altea_pnr_history",{
    booking_id:isUuid(bookingId)?bookingId:null,pnr_locator:b?.pnr_locator||null,
    event_type:upper(eventType,100),payload:obj(payload),
    created_by_agent_user_id:actor(session),supplier:"SKANDI"
  });
}
function safeBookingStatus(v,fallback="draft"){
  const x=lower(v,80);return BOOKING_STATUSES.has(x)?x:fallback;
}
function safeProductType(v,fallback="FLIGHT_ONLY"){
  const x=upper(v,80);return PRODUCT_TYPES.has(x)?x:fallback;
}
function safePaxType(v){
  const x=upper(v,10);return PAX_TYPES.has(x)?x:"ADT";
}
function safeApis(v){
  const x=lower(v,40);return APIS_STATUSES.has(x)?x:"not_started";
}


export async function getAlteaBookingWorkspaceCore(input={}){
  await requireReservationsAccessCore();
  const id=clean(input.bookingId||input.id,80);
  let b=null;
  if(isUuid(id))b=await bookingRow(id);
  if(!b&&clean(input.bookingReference)){
    b=(await select("altea_bookings",{select:"*",booking_reference:qeq(clean(input.bookingReference,120)),limit:"1"}))[0]||null;
  }
  if(!b)throw new Error("BOOKING_NOT_FOUND");
  const [passengers,components,segments,documents,bookingDocuments,pnrHistory]=await Promise.all([
    select("altea_passengers",{select:"*",booking_id:qeq(b.id),order:"created_at.asc",limit:"500"}),
    select("altea_booking_components",{select:"*",booking_id:qeq(b.id),order:"created_at.asc",limit:"1000"}),
    select("altea_segments",{select:"*",booking_id:qeq(b.id),order:"created_at.asc",limit:"1000"}),
    select("altea_documents",{select:"*",booking_id:qeq(b.id),order:"created_at.desc",limit:"500"}),
    select("altea_booking_documents",{select:"*",booking_id:qeq(b.id),order:"created_at.desc",limit:"500"}),
    select("altea_pnr_history",{select:"*",booking_id:qeq(b.id),order:"created_at.desc",limit:"1000"})
  ]);
  return{ok:true,workspace:{
    booking:bookingView(b),passengers:passengers.map(passengerView),
    components:components.map(componentView),segments:segments.map(segmentView),
    documents:documents.map(documentView),bookingDocuments,
    history:pnrHistory.map(historyView)
  }};
}


export async function searchAlteaBookingsCore(input={}){
  await requireReservationsAccessCore();
  const q=lower(input.query,250),status=lower(input.status,80);
  let rows=await select("altea_bookings",{select:"*",order:"updated_at.desc",limit:"800"});
  if(status)rows=rows.filter(r=>lower(r.status,80)===status);
  if(q)rows=rows.filter(r=>[
    r.booking_reference,r.pnr_locator,r.customer_name,r.customer_email,
    r.supplier_order_id,r.supplier_booking_reference,r.origin,r.destination,r.booking_type,r.product_type
  ].join(" ").toLowerCase().includes(q));
  return{ok:true,bookings:rows.slice(0,250).map(bookingView)};
}


export async function getAlteaUnifiedBootstrapCore(input={}){
  const session=await requireReservationsAccessCore();
  const [bookings,requirements]=await Promise.all([
    searchAlteaBookingsCore({query:input.query||""}),
    select("travel_requirements",{select:"*",active:"eq.true",order:"sort_order.asc",limit:"300"})
  ]);
  return{
    ok:true,version:RESERVATIONS_CORE_VERSION,bookings:bookings.bookings,
    requirements:requirements.map(r=>({id:r.id,title:r.title||"Travel requirement",category:r.category||"GUIDANCE",body:r.body||"",payload:obj(r.payload)})),
    travelRequirementsProvider:"SKANDI_GUIDANCE",
    session:{profile:obj(session.profile),accessRole:session.accessRole,permissionPreset:session.permissionPreset},
    capabilities:{
      unifiedReservations:true,inventoryControl:true,atomicInventory:true,transferDcs:true,
      transferDcsPersistence:true,skandiClub:true,documents:true,assetLibraryDocuments:true,
      packageBuilder:true,customerConfirmedSync:"DATABASE_TRIGGER"
    }
  };
}


export async function createAlteaLocalBookingCore(input={}){
  const session=await requireReservationsAccessCore({write:true});
  const ref=upper(input.bookingReference,120).replace(/[^A-Z0-9-]/g,"")||
    `SK${Date.now().toString().slice(-8)}${Math.random().toString(36).slice(2,4).toUpperCase()}`;
  const productType=safeProductType(input.productType||input.bookingType,"MIXED_PACKAGE");
  const bookingType=upper(input.bookingType||"SKANDI_LOCAL",80);
  const rows=await insert("altea_bookings",{
    booking_reference:ref,pnr_locator:clean(input.pnrLocator,80)||ref,
    booking_type:bookingType,product_type:productType,
    customer_member_id:clean(input.customerMemberId,160)||null,
    customer_email:lower(input.customerEmail,400)||null,
    customer_name:clean(input.customerName,300)||null,
    status:safeBookingStatus(input.status,"draft"),
    payment_status:lower(input.paymentStatus||"unpaid",80),
    fulfillment_status:lower(input.fulfillmentStatus||"pending",80),
    origin:upper(input.origin,12)||null,destination:upper(input.destination,12)||null,
    departure_date:clean(input.departureDate||input.startDate,20)||null,
    return_date:clean(input.returnDate||input.endDate,20)||null,
    currency:upper(input.currency||"USD",3),total_amount:Math.max(0,Number(input.totalAmount||0)),
    source_page:"ALTEA_RESERVATIONS",source_channel:"riaintra-altea",
    created_by_agent_user_id:actor(session),assigned_agent_user_id:actor(session),
    supplier:"SKANDI",ticketing_status:"pending",
    payload:{
      tripTitle:clean(input.tripTitle,300),notes:clean(input.notes,4000),
      dcsAuthority:upper(input.dcsAuthority,40),operatingControl:upper(input.operatingControl,40),
      isCharter:input.isCharter===true,createdIn:"SKANDI_CORE_RESERVATIONS"
    }
  });
  const booking=rows[0];if(!booking?.id)throw new Error("BOOKING_CREATE_FAILED");
  await history(booking.id,"LOCAL_BOOKING_CREATED",{bookingReference:ref},session);
  return getAlteaBookingWorkspaceCore({bookingId:booking.id});
}


function bookingPatch(input={}){
  const p=obj(input),db={},payload={};
  if(p.bookingType!==undefined)db.booking_type=upper(p.bookingType,80);
  if(p.productType!==undefined)db.product_type=safeProductType(p.productType);
  if(p.status!==undefined)db.status=safeBookingStatus(p.status);
  if(p.paymentStatus!==undefined)db.payment_status=lower(p.paymentStatus,80);
  if(p.fulfillmentStatus!==undefined)db.fulfillment_status=lower(p.fulfillmentStatus,80);
  if(p.customerName!==undefined)db.customer_name=clean(p.customerName,300)||null;
  if(p.customerEmail!==undefined)db.customer_email=lower(p.customerEmail,400)||null;
  if(p.origin!==undefined)db.origin=upper(p.origin,12)||null;
  if(p.destination!==undefined)db.destination=upper(p.destination,12)||null;
  if(p.startDate!==undefined||p.departureDate!==undefined)db.departure_date=clean(p.startDate||p.departureDate,20)||null;
  if(p.endDate!==undefined||p.returnDate!==undefined)db.return_date=clean(p.endDate||p.returnDate,20)||null;
  if(p.currency!==undefined)db.currency=upper(p.currency,3);
  if(p.totalAmount!==undefined)db.total_amount=Math.max(0,Number(p.totalAmount||0));
  if(p.assignedAgentUserId!==undefined)db.assigned_agent_user_id=isUuid(p.assignedAgentUserId)?p.assignedAgentUserId:null;
  for(const key of ["tripTitle","transferControl","packageStatus","dcsAuthority","operatingControl","isCharter","notes","tourOperatorCode","destinationResortZone","durationNights","mealBoard","roomTypeCode","passengerAges"]){
    if(p[key]!==undefined)payload[key]=p[key];
  }
  return{db,payload};
}
export async function updateAlteaBookingCore(input={}){
  const session=await requireReservationsAccessCore({write:true});
  const id=clean(input.bookingId,80);if(!isUuid(id))throw new Error("BOOKING_REQUIRED");
  const before=await bookingRow(id);if(!before)throw new Error("BOOKING_NOT_FOUND");
  const mapped=bookingPatch(input.patch||{});
  const body={...mapped.db,updated_at:now()};
  if(Object.keys(mapped.payload).length)body.payload={...obj(before.payload),...mapped.payload};
  const updated=(await patch("altea_bookings",{id:qeq(id)},body))[0]||before;
  await history(id,"BOOKING_UPDATED",{changed:Object.keys({...mapped.db,...mapped.payload})},session);
  return{ok:true,booking:bookingView(updated)};
}


function passengerPatch(input={},before={}){
  const p=obj(input),body={},payload={...obj(before.payload)};
  if(p.firstName!==undefined)body.first_name=clean(p.firstName,160)||null;
  if(p.lastName!==undefined)body.last_name=clean(p.lastName,160)||null;
  if(p.displayName!==undefined)body.display_name=clean(p.displayName,300)||null;
  if(p.paxType!==undefined)body.pax_type=safePaxType(p.paxType);
  if(p.gender!==undefined)body.gender=upper(p.gender,20)||null;
  if(p.dateOfBirth!==undefined)body.date_of_birth=clean(p.dateOfBirth,20)||null;
  if(p.nationality!==undefined)body.nationality=upper(p.nationality,3)||null;
  if(p.apisStatus!==undefined)body.apis_status=safeApis(p.apisStatus);
  if(p.documentStatus!==undefined)body.document_status=lower(p.documentStatus,80);
  if(p.checkinStatus!==undefined)body.checkin_status=lower(p.checkinStatus,80);
  if(p.seatNumber!==undefined)body.seat_number=upper(p.seatNumber,20)||null;
  if(p.sequenceNumber!==undefined)body.sequence_number=clean(p.sequenceNumber,30)||null;
  if(p.boardingStatus!==undefined)payload.boardingStatus=upper(p.boardingStatus,80);
  if(p.baggageCount!==undefined)payload.baggageCount=Math.max(0,Number(p.baggageCount||0));
  if(p.baggageWeight!==undefined)payload.baggageWeight=Math.max(0,Number(p.baggageWeight||0));
  if(p.payload&&typeof p.payload==="object")Object.assign(payload,p.payload);
  body.payload=payload;body.updated_at=now();
  return body;
}
export async function updateAlteaPassengerCore(input={}){
  const session=await requireReservationsAccessCore({write:true});
  const id=clean(input.passengerId,80);if(!isUuid(id))throw new Error("PASSENGER_REQUIRED");
  const before=await passengerRow(id);if(!before)throw new Error("PASSENGER_NOT_FOUND");
  const updated=(await patch("altea_passengers",{id:qeq(id)},passengerPatch(input.patch||input,before)))[0]||before;
  await history(input.bookingId||before.booking_id,"PASSENGER_UPDATED",{passengerId:id},session);
  return{ok:true,passenger:passengerView(updated)};
}
export async function createAlteaPassengerCore(input={}){
  const session=await requireReservationsAccessCore({write:true});
  const bookingId=clean(input.bookingId,80);if(!isUuid(bookingId)||!(await bookingRow(bookingId)))throw new Error("BOOKING_REQUIRED");
  const existing=await select("altea_passengers",{select:"id",booking_id:qeq(bookingId),limit:"500"});
  const passengerRef=clean(input.passengerRef,80)||`PAX${existing.length+1}`;
  const first=clean(input.firstName,160),last=clean(input.lastName,160);
  const rows=await insert("altea_passengers",{
    booking_id:bookingId,passenger_ref:passengerRef,pax_type:safePaxType(input.paxType),
    first_name:first||null,last_name:last||null,
    display_name:clean(input.displayName,300)||[first,last].filter(Boolean).join(" ")||null,
    gender:upper(input.gender,20)||null,date_of_birth:clean(input.dateOfBirth,20)||null,
    nationality:upper(input.nationality,3)||null,apis_status:safeApis(input.apisStatus),
    document_status:lower(input.documentStatus||"not_checked",80),
    checkin_status:lower(input.checkinStatus||"not_checked_in",80),
    seat_number:upper(input.seatNumber,20)||null,sequence_number:clean(input.sequenceNumber,30)||null,
    payload:obj(input.payload),supplier_passenger_id:clean(input.supplierPassengerId,160)||null
  });
  const passenger=rows[0];if(!passenger?.id)throw new Error("PASSENGER_CREATE_FAILED");
  await history(bookingId,"PASSENGER_CREATED",{passengerId:passenger.id,passengerRef},session);
  return{ok:true,passenger:passengerView(passenger)};
}
export async function addAlteaHistoryNoteCore(input={}){
  const session=await requireReservationsAccessCore({write:true});
  const bookingId=clean(input.bookingId,80);if(!isUuid(bookingId))throw new Error("BOOKING_REQUIRED");
  const note=clean(input.note||input.message,4000);if(!note)throw new Error("HISTORY_NOTE_REQUIRED");
  const rows=await history(bookingId,input.eventType||"AGENT_NOTE",{note},session);
  return{ok:true,history:rows.map(historyView)};
}
export async function getAlteaDocumentCore(input={}){
  await requireReservationsAccessCore();
  const id=clean(input.documentId,80);
  if(!isUuid(id))throw new Error("DOCUMENT_REQUIRED");
  const row=(await select("altea_documents",{select:"*",id:qeq(id),limit:"1"}))[0];
  if(!row)throw new Error("DOCUMENT_NOT_FOUND");
  if(input.bookingId&&clean(input.bookingId,80)!==String(row.booking_id||""))throw new Error("DOCUMENT_BOOKING_MISMATCH");
  return{ok:true,document:documentView(row)};
}

export async function updateAlteaDocumentStatusCore(input={}){
  const session=await requireReservationsAccessCore({write:true});
  const id=clean(input.documentId,80);if(!isUuid(id))throw new Error("DOCUMENT_REQUIRED");
  const before=(await select("altea_documents",{select:"*",id:qeq(id),limit:"1"}))[0];
  if(!before)throw new Error("DOCUMENT_NOT_FOUND");
  const status=storageDocumentStatus(input.status);
  const updated=(await patch("altea_documents",{id:qeq(id)},{status,updated_at:now()}))[0]||before;
  await patch("altea_booking_documents",{provider_document_id:qeq(id)},{
    status:status==="issued"||status==="sent"||status==="reissued"?"ACTIVE":status.toUpperCase(),
    updated_at:now()
  });
  await history(before.booking_id,"DOCUMENT_STATUS_UPDATED",{documentId:id,status},session);
  return{ok:true,document:documentView(updated)};
}
export async function updateAlteaBookingComponentCore(input={}){
  const session=await requireReservationsAccessCore({write:true});
  const id=clean(input.componentId,80);if(!isUuid(id))throw new Error("BOOKING_COMPONENT_NOT_FOUND");
  const before=await componentRow(id);if(!before)throw new Error("BOOKING_COMPONENT_NOT_FOUND");
  if(upper(input.status||input.patch?.status,80)==="REMOVED"){
    return releaseReservationInventoryComponentCore({componentId:id});
  }
  const p=obj(input.patch||input),body={};
  if(p.title!==undefined)body.title=clean(p.title,400);
  if(p.status!==undefined)body.status=upper(p.status,80);
  if(p.quantity!==undefined)body.quantity=Math.max(1,Math.min(99,Number(p.quantity||1)));
  if(p.currency!==undefined)body.currency=upper(p.currency,3)||null;
  if(p.unitAmount!==undefined)body.unit_amount=Math.max(0,Number(p.unitAmount||0));
  if(p.totalAmount!==undefined)body.total_amount=Math.max(0,Number(p.totalAmount||0));
  if(p.supplierReference!==undefined)body.supplier_reference=clean(p.supplierReference,300)||null;
  if(p.payload!==undefined)body.payload={...obj(before.payload),...obj(p.payload)};
  body.updated_at=now();
  const updated=(await patch("altea_booking_components",{id:qeq(id)},body))[0]||before;
  await history(before.booking_id,"COMPONENT_UPDATED",{componentId:id},session);
  return{ok:true,component:componentView(updated)};
}


function supplierStatus(order={}){
  const s=lower(order.status,80);
  if(s.includes("cancel"))return"cancelled";
  if(s.includes("ticket"))return"ticketed";
  if(s.includes("confirm")||s==="active")return"confirmed";
  return"confirmed";
}
function orderReference(order={},input={}){
  return upper(order.bookingReference||order.booking_reference||order.reference||input.bookingReference,120).replace(/[^A-Z0-9-]/g,"")||
    `DUF-${clean(order.id,120).replace(/[^A-Za-z0-9]/g,"").slice(-10).toUpperCase()}`;
}
function orderPassengers(order={}){
  const direct=arr(order.passengers);
  if(direct.length)return direct;
  const fromSlices=arr(order.slices).flatMap(s=>arr(s.passengers));
  const seen=new Set();return fromSlices.filter(p=>{const k=p.id||`${p.givenName}-${p.familyName}`;if(seen.has(k))return false;seen.add(k);return true});
}
export async function syncDuffelOrderToAlteaCore(input={}){
  const session=await requireReservationsAccessCore({write:true});
  const rawOrder=obj(input.order);if(!clean(rawOrder.id,160))throw new Error("DUFFEL_ORDER_REQUIRED");
  const bookingInput=obj(input.bookingInput);
  const enriched=await enrichDuffelFlightPayloadCore({order:rawOrder,offer:obj(bookingInput.offer)});
  const order=obj(enriched.order);
  const referenceOffer=obj(enriched.offer);
  const flightSource=arr(referenceOffer.slices).length?referenceOffer:order;
  const flightDetails=buildFlightDetails(flightSource);
  const ref=orderReference(order,bookingInput);
  let existing=(await select("altea_bookings",{select:"*",booking_reference:qeq(ref),limit:"1"}))[0]||null;
  if(!existing){
    existing=(await select("altea_bookings",{select:"*",supplier:qeq("DUFFEL"),supplier_order_id:qeq(clean(order.id,160)),limit:"1"}))[0]||null;
  }
  const firstSlice=arr(order.slices)[0]||{};
  const lastSlice=arr(order.slices).at(-1)||firstSlice;
  const origin=upper(order.origin||firstSlice.origin?.iataCode||firstSlice.origin?.iata_code||firstSlice.origin,12);
  const destination=upper(order.destination||lastSlice.destination?.iataCode||lastSlice.destination?.iata_code||lastSlice.destination,12);
  const body={
    booking_reference:ref,pnr_locator:clean(order.bookingReference||order.booking_reference||ref,80),
    booking_type:"DUFFEL_ORDER",product_type:"FLIGHT_ONLY",
    customer_email:lower(bookingInput.customerEmail||bookingInput.email||order.email,400)||existing?.customer_email||null,
    customer_name:clean(bookingInput.customerName||order.customerName,300)||existing?.customer_name||null,
    status:supplierStatus(order),payment_status:existing?.payment_status||"payment_authorized",
    fulfillment_status:existing?.fulfillment_status||"pending",
    origin:origin||existing?.origin||null,destination:destination||existing?.destination||null,
    departure_date:clean(order.departureDate||firstSlice.departureDate||firstSlice.segments?.[0]?.departingAt,20).slice(0,10)||existing?.departure_date||null,
    return_date:clean(order.returnDate||lastSlice.arrivalDate,20).slice(0,10)||existing?.return_date||null,
    currency:upper(order.currency||order.totalCurrency||bookingInput.currency||existing?.currency||"USD",3),
    total_amount:Math.max(0,Number(order.totalAmount??order.total_amount??existing?.total_amount??0)),
    source_page:"ALTEA_RESERVATIONS",source_channel:"riaintra-altea",
    assigned_agent_user_id:actor(session),supplier:"DUFFEL",supplier_order_id:clean(order.id,160),
    supplier_booking_reference:clean(order.bookingReference||order.booking_reference,160)||null,
    supplier_offer_id:clean(bookingInput.offerId||order.offerId,160)||null,
    ticketing_status:lower(order.ticketingStatus||existing?.ticketing_status||"pending",80),
    payload:{...obj(existing?.payload),duffelOrder:order,flightDetails,
      flightDataSources:["DUFFEL","SKANDI_BAGGAGE_ALLOWANCE"],lastSupplierSyncAt:now()}
  };
  let saved;
  if(existing?.id)saved=(await patch("altea_bookings",{id:qeq(existing.id)},body))[0]||existing;
  else{
    body.created_by_agent_user_id=actor(session);
    saved=(await insert("altea_bookings",body))[0];
  }
  if(!saved?.id)throw new Error("ALTEA_DUFFEL_SYNC_FAILED");


  const pax=orderPassengers(order);
  for(let i=0;i<pax.length;i++){
    const p=obj(pax[i]),pref=clean(p.id||p.passengerRef,120)||`PAX${i+1}`;
    const existingP=(await select("altea_passengers",{select:"*",booking_id:qeq(saved.id),passenger_ref:qeq(pref),limit:"1"}))[0]||null;
    const first=clean(p.givenName||p.firstName||p.given_name,160),last=clean(p.familyName||p.lastName||p.family_name,160);
    const pb={
      booking_id:saved.id,passenger_ref:pref,pax_type:safePaxType(p.type||p.paxType),
      first_name:first||null,last_name:last||null,display_name:[first,last].filter(Boolean).join(" ")||null,
      gender:upper(p.gender,20)||null,date_of_birth:clean(p.bornOn||p.dateOfBirth||p.born_on,20)||null,
      nationality:upper(p.nationality,3)||null,supplier_passenger_id:clean(p.id,160)||null,
      payload:{...obj(existingP?.payload),duffelPassenger:p}
    };
    if(existingP?.id)await patch("altea_passengers",{id:qeq(existingP.id)},pb);
    else await insert("altea_passengers",pb);
  }
  await history(saved.id,input.eventType||"DUFFEL_ORDER_SYNCED",{supplierOrderId:order.id,bookingReference:ref},session);
  return getAlteaBookingWorkspaceCore({bookingId:saved.id});
}


function groundBookingType(value){
  const t=upper(value,80);
  if(t==="HOTEL"||t==="STAY"||t==="STAYS")return"HOTEL";
  if(t==="CAR"||t==="CARS"||t==="CAR_RENTAL")return"CAR_RENTAL";
  throw new Error("GROUND_COMPONENT_TYPE_INVALID");
}
function groundBookingTitle(type,b={}){
  if(type==="HOTEL")return clean(b.accommodation?.name||b.title||"Hotel",220);
  return clean([b.car?.name,b.supplier?.name].filter(Boolean).join(" · ")||b.title||"Car Rental",220);
}
function groundBookingPayload(type,b={}){
  if(type==="HOTEL")return{
    provider:"DUFFEL",reference:b.reference||"",quoteId:b.quoteId||"",
    checkInDate:b.checkInDate||null,checkOutDate:b.checkOutDate||null,
    paymentType:b.paymentType||"",accommodation:b.accommodation||null,
    guests:arr(b.guests),cancelledAt:b.cancelledAt||null,confirmedAt:b.confirmedAt||null
  };
  return{
    provider:"DUFFEL",reference:b.reference||"",quoteId:b.quoteId||"",paymentType:b.paymentType||"",
    pickupDate:b.pickupDate||null,pickupTime:b.pickupTime||"",dropoffDate:b.dropoffDate||null,
    dropoffTime:b.dropoffTime||"",pickupLocation:b.pickupLocation||null,dropoffLocation:b.dropoffLocation||null,
    car:b.car||null,supplier:b.supplier||null,driver:b.driver||null,conditions:arr(b.conditions),charges:arr(b.charges),
    privacyPolicies:arr(b.privacyPolicies),cancelledAt:b.cancelledAt||null,confirmedAt:b.confirmedAt||null
  };
}
export async function syncDuffelGroundBookingToAlteaCore(input={}){
  const session=await requireReservationsAccessCore({write:true});
  const bookingId=clean(input.alteaBookingId||input.bookingId,80);
  if(!isUuid(bookingId)||!(await bookingRow(bookingId)))throw new Error("BOOKING_NOT_FOUND");
  const providerBooking=obj(input.providerBooking||input.booking);
  const supplierReference=clean(providerBooking.id,180);
  if(!supplierReference)throw new Error("DUFFEL_GROUND_BOOKING_REQUIRED");
  const type=groundBookingType(input.componentType||input.type||input.productType);
  const existing=(await select("altea_booking_components",{
    select:"*",booking_id:qeq(bookingId),supplier:qeq("DUFFEL"),supplier_reference:qeq(supplierReference),limit:"1"
  }))[0]||null;
  const amount=Math.max(0,Number(providerBooking.totalAmount||0));
  const body={
    booking_id:bookingId,component_type:type,supplier:"DUFFEL",supplier_reference:supplierReference,
    title:groundBookingTitle(type,providerBooking),status:upper(providerBooking.status||"CONFIRMED",40),quantity:1,
    currency:upper(providerBooking.totalCurrency||existing?.currency||"USD",3),unit_amount:amount,total_amount:amount,
    payload:{...obj(existing?.payload),...groundBookingPayload(type,providerBooking),lastSupplierSyncAt:now()},updated_at:now()
  };
  let saved;
  if(existing?.id)saved=(await patch("altea_booking_components",{id:qeq(existing.id)},body))[0]||existing;
  else saved=(await insert("altea_booking_components",body))[0]||null;
  if(!saved?.id)throw new Error("ALTEA_GROUND_SYNC_FAILED");
  await history(bookingId,input.eventType||`DUFFEL_${type}_BOOKING_SYNCED`,{
    componentId:saved.id,supplierReference,eventType:input.eventType||null
  },session);
  return getAlteaBookingWorkspaceCore({bookingId});
}


export async function searchReservationInventoryCore(input={}){
  await requireReservationsAccessCore();
  const q=lower(input.query,200),type=upper(input.entityType||input.type,80),date=clean(input.serviceDate,20);
  const types=type&&SELLABLE_TYPES.has(type)?new Set([type]):SELLABLE_TYPES;
  const rows=await select("inventory_master_entities",{
    select:"id,public_id,entity_type,code,name,slug,status,active,altea_visible,details,commercial,operations,source,source_reference",
    active:"eq.true",altea_visible:"eq.true",limit:"1500",order:"sort_priority.asc"
  });
  const items=rows.filter(r=>types.has(upper(r.entity_type))&&["PUBLISHED","REVIEW"].includes(upper(r.status))&&
    (!q||`${r.code} ${r.name} ${JSON.stringify(r.details||{})}`.toLowerCase().includes(q))).slice(0,300);
  const ids=items.map(x=>x.id);let dated=[];
  if(ids.length){
    const query={select:"*",entity_id:`in.(${ids.join(",")})`,order:"service_date.asc,start_time.asc",limit:"1800"};
    if(date)query.service_date=qeq(date);
    dated=await select("inventory_dated_inventory",query);
  }
  return{ok:true,items:items.map(r=>{
    const d=obj(r.details),c=obj(r.commercial),o=obj(r.operations);
    return{...r,publicId:r.public_id,entityType:r.entity_type,city:d.city||o.city||"",
      destination:d.destination||o.destination||"",category:d.category||"",
      publicPrice:Number(c.publicPrice??c.price??0)||0,currency:upper(c.currency||"USD",3),
      dated:dated.filter(x=>x.entity_id===r.id).map(x=>({...x,datedInventoryId:x.id,serviceDate:x.service_date,
        variantCode:x.variant_code,variantName:x.variant_name,publicPrice:Number(x.public_price??x.adult_price??0)||0,
        currency:upper(x.currency||c.currency||"USD",3),available:Number(x.available??0)||0,
        stopSale:x.stop_sale===true,blackout:x.blackout===true}))
    };
  }),serviceDate:date};
}
export async function addReservationInventoryComponentCore(input={}){
  const session=await requireReservationsAccessCore({write:true});
  if(!isUuid(input.bookingId)||!isUuid(input.entityId))throw new Error("INVENTORY_COMPONENT_INPUT_INVALID");
  const datedRows=await select("inventory_dated_inventory",{select:"id,status,stop_sale,blackout,available",entity_id:qeq(input.entityId),limit:"250"});
  if(datedRows.length&&!isUuid(input.datedInventoryId))throw new Error("DATED_INVENTORY_SELECTION_REQUIRED");
  const result=await rpcRequest({
    functionName:"inventory_altea_add_component_v9",
    body:{p_booking_id:input.bookingId,p_entity_id:input.entityId,
      p_dated_inventory_id:isUuid(input.datedInventoryId)?input.datedInventoryId:null,
      p_quantity:Math.max(1,Math.min(99,Number(input.quantity||1))),p_agent_user_id:actor(session)}
  });
  return{ok:true,component:Array.isArray(result)?result[0]:result};
}
export async function releaseReservationInventoryComponentCore(input={}){
  const session=await requireReservationsAccessCore({write:true});
  if(!isUuid(input.componentId))throw new Error("BOOKING_COMPONENT_NOT_FOUND");
  const c=await componentRow(input.componentId);if(!c)throw new Error("BOOKING_COMPONENT_NOT_FOUND");
  if(upper(c.supplier)!=="SKANDI"&&!c.source_entity_id)throw new Error("SUPPLIER_COMPONENT_MUST_BE_SERVICED_EXTERNALLY");
  const result=await rpcRequest({
    functionName:"inventory_altea_release_component_v9",
    body:{p_component_id:input.componentId,p_agent_user_id:actor(session)}
  });
  return{ok:true,component:Array.isArray(result)?result[0]:result};
}
export async function getReservationInventoryStatusCore(input={}){
  await requireReservationsAccessCore();
  if(!isUuid(input.bookingId))throw new Error("BOOKING_REQUIRED");
  const [booking,components]=await Promise.all([
    bookingRow(input.bookingId),
    select("altea_booking_components",{select:"*",booking_id:qeq(input.bookingId),order:"created_at.asc"})
  ]);
  return{ok:true,booking:booking?bookingView(booking):null,components:components.map(componentView)};
}

export async function resolveReservationDestinationCore(input={}){
  await requireReservationsAccessCore();
  const raw=clean(input.query||input.destination||input.locationText||input.iata,200);
  const lat=Number(input.latitude),lon=Number(input.longitude);
  if(Number.isFinite(lat)&&Number.isFinite(lon)&&Math.abs(lat)<=90&&Math.abs(lon)<=180&&(lat!==0||lon!==0)){
    return{ok:true,location:{latitude:lat,longitude:lon,label:raw||"Location",iata:upper(input.iata,3)}};
  }
  if(!raw)throw new Error("DESTINATION_REQUIRED");
  const q=lower(raw,200),iata=upper(raw,3);
  const rows=await select("inventory_master_entities",{select:"id,entity_type,code,name,slug,details,active,status",active:"eq.true",limit:"2000"});
  const allowed=new Set(["COUNTRY","DESTINATION","AREA","HOTEL"]);
  const candidates=rows.filter(r=>allowed.has(upper(r.entity_type,40)));
  const exact=candidates.find(r=>[r.code,r.slug,r.name,obj(r.details).searchAirportIata,obj(r.details).nearestAirportIata].some(v=>lower(v,200)===q||upper(v,3)===iata));
  const fuzzy=exact||candidates.find(r=>[r.code,r.slug,r.name,obj(r.details).countryName,obj(r.details).region].map(v=>lower(v,300)).join(" ").includes(q));
  if(!fuzzy)throw new Error("DESTINATION_NOT_MAPPED");
  const d=obj(fuzzy.details),latitude=Number(d.latitude),longitude=Number(d.longitude);
  if(!Number.isFinite(latitude)||!Number.isFinite(longitude)||(latitude===0&&longitude===0))throw new Error("DESTINATION_COORDINATES_REQUIRED");
  return{ok:true,location:{latitude,longitude,label:fuzzy.name||raw,iata:upper(d.searchAirportIata||d.nearestAirportIata,3)},entity:{id:fuzzy.id,entityType:fuzzy.entity_type,code:fuzzy.code,name:fuzzy.name}};
}


function customerProfileView(r={},tier=null,pointsBalance=0){
  const p=obj(r.payload),isClub=r.is_loyalty_member===true;
  return{
    id:r.id,customerProfileId:r.id,memberId:r.member_id||"",
    firstName:r.first_name||"",lastName:r.last_name||"",
    name:r.display_name||[r.first_name,r.last_name].filter(Boolean).join(" ")||r.email||r.member_id||"Customer",
    email:r.email||"",phone:r.phone||"",customerType:r.customer_type||"CUSTOMER",
    preferredCurrency:r.preferred_currency||"",status:r.status||"ACTIVE",
    isLoyaltyMember:isClub,memberNumber:isClub?String(r.club_number||""):"",
    tier:isClub?(tier?.tier_name||tier?.tier_key||"MEMBER"):"SKANDI MEMBER",
    pointsBalance:Number(pointsBalance||0)||0,
    accessibilityNeeds:r.accessibility_needs_general||"",
    marketingConsent:r.marketing_consent===true,
    payload:p,
    preferences:{
      seat:p.seatPreference||p.seat_preference||"",
      dietary:p.dietaryPrefs||p.dietary_prefs||"",
      meals:arr(p.mealPreferences||p.meal_preferences),
      frequentFlyer:arr(p.frequentFlyerPrograms||p.frequent_flyer_programs),
      hotelLoyalty:arr(p.hotelLoyaltyPrograms||p.hotel_loyalty_programs),
      carLoyalty:arr(p.carRentalLoyaltyPrograms||p.car_rental_loyalty_programs)
    },
    emergencyContacts:arr(p.emergencyContacts||p.emergency_contacts),
    billingAddress:obj(p.billingAddress||p.billing_address),
    storedPaymentMethods:arr(p.paymentMethods||p.payment_methods).map(x=>({
      id:clean(x?.id,120),brand:clean(x?.brand||x?.network,40),last4:clean(x?.last4,4),
      expMonth:Number(x?.expMonth||x?.exp_month||0)||null,expYear:Number(x?.expYear||x?.exp_year||0)||null,
      label:clean(x?.label||x?.displayName,120)
    }))
  };
}
async function customerPoints(memberId=""){
  if(!memberId)return 0;
  const rows=await select("skandi_points_ledger",{select:"amount,status",member_id:qeq(memberId),limit:"5000"});
  return rows.filter(x=>!['VOID','CANCELLED','REVERSED'].includes(upper(x.status,40))).reduce((sum,x)=>sum+(Number(x.amount)||0),0);
}
async function customerProfileById(id){
  if(!isUuid(id))return null;
  const row=(await select("customer_profiles",{select:"*",id:qeq(id),limit:"1"}))[0]||null;
  if(!row)return null;
  const tiers=await select("club_tiers",{select:"*",active:"eq.true",limit:"100"});
  const tier=tiers.find(t=>t.id===row.club_tier_id)||null;
  return customerProfileView(row,tier,await customerPoints(row.member_id));
}
export async function searchSkandiClubMembersCore(input={}){
  await requireReservationsAccessCore();
  const q=lower(input.query,200),searchType=lower(input.searchType||"all",30),membership=lower(input.membershipFilter||"all",30);
  const [rows,tiers]=await Promise.all([
    select("customer_profiles",{select:"*",limit:"500",order:"updated_at.desc"}),
    select("club_tiers",{select:"*",active:"eq.true",limit:"100"})
  ]);
  const tierMap=new Map(tiers.map(t=>[t.id,t]));
  let matched=rows;
  if(membership==="members")matched=matched.filter(r=>r.is_loyalty_member===true);
  if(membership==="not_enrolled")matched=matched.filter(r=>r.is_loyalty_member!==true);
  if(q){
    matched=matched.filter(r=>{
      const values={
        name:`${r.display_name||""} ${r.first_name||""} ${r.last_name||""}`,
        email:r.email||"",
        member:`${r.member_id||""} ${r.club_number||""}`,
        all:`${r.display_name||""} ${r.first_name||""} ${r.last_name||""} ${r.email||""} ${r.member_id||""} ${r.club_number||""} ${r.customer_type||""}`
      };
      return lower(values[searchType]??values.all,1000).includes(q);
    });
  }
  const members=[];
  for(const row of matched.slice(0,100)){
    members.push(customerProfileView(row,tierMap.get(row.club_tier_id)||null,await customerPoints(row.member_id)));
  }
  return{ok:true,members,source:"customer_profiles"};
}
export async function getCustomerProfileCore(input={}){
  await requireReservationsAccessCore();
  const profile=await customerProfileById(input.customerProfileId||input.memberId);
  if(!profile)throw new Error("CUSTOMER_PROFILE_NOT_FOUND");
  const [travelers,documents]=await Promise.all([
    select("customer_travelers",{select:"*",member_id:qeq(profile.memberId),active:"eq.true",order:"is_primary.desc,created_at.asc",limit:"100"}),
    select("customer_travel_documents",{select:"*",member_id:qeq(profile.memberId),order:"created_at.desc",limit:"200"})
  ]);
  return{ok:true,profile:{...profile,
    travelers:travelers.map(t=>({
      id:t.id,travelerType:t.traveler_type||"TRAVELER",firstName:t.first_name||"",middleName:t.middle_name||"",lastName:t.last_name||"",
      name:t.display_name||[t.first_name,t.middle_name,t.last_name].filter(Boolean).join(" "),dateOfBirth:t.date_of_birth||null,
      gender:t.gender||"",email:t.email||"",phone:t.phone||"",passportLast4:t.passport_last4||"",passportExpiry:t.passport_expiry||null,
      dietaryPrefs:t.dietary_prefs||"",accessibilityNeeds:t.accessibility_needs||"",isPrimary:t.is_primary===true,payload:obj(t.payload)
    })),
    documents:documents.map(d=>({
      id:d.id,travelerId:d.traveler_id||null,documentType:d.document_type||"",title:d.document_title||"",
      last4:d.document_number_last4||"",issueDate:d.issue_date||null,expiryDate:d.expiry_date||null,status:d.status||"",payload:obj(d.payload)
    }))
  }};
}
export async function linkSkandiClubMemberCore(input={}){
  const session=await requireReservationsAccessCore({write:true});
  const passengerId=clean(input.passengerId,80),profileId=clean(input.customerProfileId||input.memberId,80);
  if(!isUuid(passengerId)||!isUuid(profileId))throw new Error("CUSTOMER_LINK_INPUT_INVALID");
  const [passenger,profile]=await Promise.all([passengerRow(passengerId),customerProfileById(profileId)]);
  if(!passenger||!profile)throw new Error("CUSTOMER_PROFILE_OR_PASSENGER_NOT_FOUND");

  const travelerRows=await select("customer_travelers",{
    select:"*",member_id:qeq(profile.memberId),active:"eq.true",order:"is_primary.desc,created_at.asc",limit:"100"
  });
  const requestedTravelerId=clean(input.travelerId,80);
  const sourceTraveler=(isUuid(requestedTravelerId)?travelerRows.find(x=>x.id===requestedTravelerId):null)||travelerRows.find(x=>x.is_primary===true)||travelerRows[0]||null;
  const docs=sourceTraveler?await select("customer_travel_documents",{
    select:"id,traveler_id,document_type,document_title,document_number_last4,issue_date,expiry_date,status,payload",
    member_id:qeq(profile.memberId),traveler_id:qeq(sourceTraveler.id),order:"created_at.desc",limit:"50"
  }):[];

  const payload={
    ...obj(passenger.payload),
    customerProfile:profile,customerProfileId:profile.id,
    sourceCustomerTravelerId:sourceTraveler?.id||null,
    sourceTravelDocumentRefs:docs.map(d=>({
      id:d.id,documentType:d.document_type||"",title:d.document_title||"",last4:d.document_number_last4||"",
      issueDate:d.issue_date||null,expiryDate:d.expiry_date||null,status:d.status||""
    })),
    contact:{email:sourceTraveler?.email||profile.email||"",phone:sourceTraveler?.phone||profile.phone||""},
    travelPreferences:{
      seat:obj(sourceTraveler?.payload).seatPreference||profile.preferences?.seat||"",
      dietary:sourceTraveler?.dietary_prefs||profile.preferences?.dietary||"",
      meals:profile.preferences?.meals||[],
      accessibility:sourceTraveler?.accessibility_needs||profile.accessibilityNeeds||"",
      frequentFlyer:profile.preferences?.frequentFlyer||[],hotelLoyalty:profile.preferences?.hotelLoyalty||[],carLoyalty:profile.preferences?.carLoyalty||[]
    },
    ...(profile.isLoyaltyMember?{clubProfile:profile}:{})
  };
  const passengerBody={payload,updated_at:now()};
  if(sourceTraveler){
    passengerBody.first_name=clean(sourceTraveler.first_name,160)||passenger.first_name||null;
    passengerBody.last_name=clean(sourceTraveler.last_name,160)||passenger.last_name||null;
    passengerBody.display_name=clean(sourceTraveler.display_name,300)||[sourceTraveler.first_name,sourceTraveler.middle_name,sourceTraveler.last_name].filter(Boolean).join(" ")||passenger.display_name||null;
    passengerBody.date_of_birth=clean(sourceTraveler.date_of_birth,20)||passenger.date_of_birth||null;
    passengerBody.gender=upper(sourceTraveler.gender,20)||passenger.gender||null;
  }
  await patch("altea_passengers",{id:qeq(passenger.id)},passengerBody);

  let booking=null;
  if(isUuid(input.bookingId)){
    booking=await bookingRow(input.bookingId);
    await patch("altea_bookings",{id:qeq(input.bookingId)},{customer_member_id:profile.memberId,customer_email:profile.email||booking?.customer_email||null,customer_name:profile.name||booking?.customer_name||null,updated_at:now()});
    const existing=await select("customer_profiles_booking_links",{select:"id",booking_id:qeq(input.bookingId),member_id:qeq(profile.memberId),limit:"1"});
    if(!existing.length){
      await insert("customer_profiles_booking_links",{
        member_id:profile.memberId,booking_id:input.bookingId,booking_reference:booking?.booking_reference||null,
        last_name:profile.lastName||null,status:"ACTIVE",linked_at:now(),link_source:"ALTEA",verified_at:now(),
        payload:{customerProfileId:profile.id,passengerId:passenger.id,travelerId:sourceTraveler?.id||null,linkedByAgentUserId:actor(session)}
      });
    }
  }
  await history(input.bookingId||passenger.booking_id,"CUSTOMER_PROFILE_LINKED",{
    passengerId:passenger.id,customerProfileId:profile.id,memberId:profile.memberId,clubNumber:profile.memberNumber||null,
    travelerId:sourceTraveler?.id||null,transferredFields:sourceTraveler?["name","dateOfBirth","gender","contact","preferences","secureDocumentRefs"]:["customerProfile","contact","preferences"]
  },session);
  const refreshed=await customerProfileById(profile.id);
  return{ok:true,passengerId:passenger.id,customerProfile:refreshed||profile,member:refreshed||profile,
    message:profile.isLoyaltyMember?"SKANDI Club customer profile transferred to passenger.":"SKANDI Member customer profile transferred to passenger."};
}
export async function adjustSkandiClubPointsCore(input={}){
  const session=await requireReservationsAccessCore({write:true});
  const profile=await customerProfileById(input.customerProfileId||input.memberId);
  if(!profile||!profile.isLoyaltyMember)throw new Error("SKANDI_CLUB_MEMBER_REQUIRED");
  const delta=Math.trunc(Number(input.delta||0)),reason=clean(input.reason,1000);
  if(!delta)throw new Error("POINTS_DELTA_REQUIRED");if(!reason)throw new Error("POINTS_REASON_REQUIRED");
  const booking=isUuid(input.bookingId)?await bookingRow(input.bookingId):null;
  await insert("skandi_points_ledger",{
    transaction_id:`ALTEA-${Date.now()}-${Math.random().toString(36).slice(2,8).toUpperCase()}`,
    member_id:profile.memberId,booking_id:booking?.id||null,booking_reference:booking?.booking_reference||null,
    transaction_date:now(),type:delta>0?"MANUAL_CREDIT":"MANUAL_DEBIT",amount:delta,description:reason,
    status:"POSTED",is_manual_adjustment:true,admin_id:actor(session)||null,
    payload:{source:"ALTEA",passengerId:input.passengerId||null,customerProfileId:profile.id}
  });
  const updated={...profile,pointsBalance:await customerPoints(profile.memberId)};
  await history(input.bookingId,"SKANDI_CLUB_POINTS_ADJUSTED",{customerProfileId:profile.id,memberId:profile.memberId,passengerId:input.passengerId||null,delta,reason,balance:updated.pointsBalance},session);
  return{ok:true,passengerId:input.passengerId||"",customerProfile:updated,member:updated,message:`SKANDI Club points updated by ${delta}.`};
}


function normalizeRequirement(r={}){return{id:r.id,title:r.title||"Travel requirement",category:r.category||"GUIDANCE",body:r.body||"",payload:obj(r.payload)}}
export async function checkAlteaTravelRequirementsCore(input={}){
  const session=await requireReservationsAccessCore({write:true});
  const b=await bookingRow(input.bookingId),p=await passengerRow(input.passengerId);
  const traveler={id:p?.id||input.passengerId,nationality:upper(input.nationality||p?.nationality,3),
    residenceCountry:upper(input.residenceCountry,3),dateOfBirth:input.dateOfBirth||p?.date_of_birth||null,
    documentType:upper(input.documentType||"PASSPORT",40),documentIssuingCountry:upper(input.documentIssuingCountry,3),
    documentExpiry:input.documentExpiry||null};
  const cart={searchContext:{origin:upper(input.origin||b?.origin,12),destination:upper(input.destination||b?.destination,12),
    departureDate:b?.departure_date||"",returnDate:b?.return_date||"",transitPoints:arr(input.transitPoints)}};
  let external={connected:false,status:"NEEDS_PROVIDER",provider:"NONE"};
  try{external=await checkExternalTravelRequirements({cart,travelers:[traveler]})}catch(_){}
  const local=(await select("travel_requirements",{select:"*",active:"eq.true",order:"sort_order.asc",limit:"300"})).map(normalizeRequirement);
  const needles=[traveler.nationality,cart.searchContext.origin,cart.searchContext.destination,...arr(cart.searchContext.transitPoints)].filter(Boolean).map(x=>lower(x,100));
  const matches=local.filter(r=>{const hay=`${r.title} ${r.category} ${r.body} ${JSON.stringify(r.payload)}`.toLowerCase();return !needles.length||needles.some(k=>hay.includes(k))});
  const decision=external.connected
    ?{status:external.status,summary:external.summary,provider:external.provider,result:external.decision||external.raw||null,notices:external.notices||[]}
    :{status:matches.length?"SKANDI_GUIDANCE_MATCHED":"GUIDANCE_ONLY",
      summary:matches.length?"SKANDI guidance matched this passenger/route. This is not a live Timatic/IATA boarding decision.":"No route-specific SKANDI requirement record matched. Confirm official entry requirements before travel.",
      provider:"SKANDI_GUIDANCE",guidance:matches.slice(0,30),
      notices:["No live Timatic/IATA decision is represented unless an authorized external provider is connected."]};
  if(p){
    await patch("altea_passengers",{id:qeq(p.id)},{payload:{...obj(p.payload),travelRequirementStatus:decision.status,
      travelRequirementDecision:decision,travelRequirementCheckedAt:now()},updated_at:now()});
  }
  await history(input.bookingId||p?.booking_id,"TRAVEL_REQUIREMENTS_CHECKED",{passengerId:p?.id||input.passengerId,provider:decision.provider,status:decision.status},session);
  return{ok:true,provider:decision.provider,decision};
}



function requestedDocumentSpec(value,component=null){
  const t=upper(value||"BOOKING_CONFIRMATION",80).replace(/[\s-]+/g,"_");
  if(["ETKT","E_TICKET","EMD","AIRLINE_BOARDING_PASS","AIRLINE_BAG_TAG"].includes(t))throw new Error("SUPPLIER_DOCUMENT_AUTHORITY_REQUIRED");
  if(t==="BOOKING_CONFIRMATION"||t==="CONFIRMATION")return{storageType:"booking_confirmation",variant:"BOOKING_CONFIRMATION"};
  if(t==="BOARDING_PASS"||t==="BOARDING_CARD")return{storageType:"boarding_pass",variant:"BOARDING_CARD"};
  if(t==="BAG_TAG"||t==="BAGGAGE_TAG")return{storageType:"baggage_tag",variant:"BAGGAGE_TAG"};
  if(t==="TRANSFER_TICKET"||t==="TRANSFER_DOCUMENT"||t.startsWith("TRANSFER_"))return{storageType:"voucher",variant:"TRANSFER_TICKET"};
  if(t==="TOUR_TICKET"||t==="ACTIVITY_TICKET"||t==="EXCURSION_TICKET"||t.startsWith("TOUR_")||t.startsWith("ACTIVITY_")||t.startsWith("EXCURSION_"))return{storageType:"voucher",variant:"TOUR_TICKET"};
  if(t==="INVOICE")return{storageType:"invoice",variant:"INVOICE"};
  if(t==="APIS_REPORT")return{storageType:"apis_report",variant:"APIS_REPORT"};
  if(t==="TICKET")return{storageType:"ticket",variant:"SERVICE_VOUCHER"};
  if(t.includes("VOUCHER")){
    const ct=upper(component?.component_type||component?.componentType,80);
    if(ct.includes("TRANSFER"))return{storageType:"voucher",variant:"TRANSFER_TICKET"};
    if(ct.includes("TOUR")||ct.includes("ACTIVITY")||ct.includes("EXCURSION")||ct.includes("GUIDED"))return{storageType:"voucher",variant:"TOUR_TICKET"};
    return{storageType:"voucher",variant:"SERVICE_VOUCHER"};
  }
  return{storageType:"booking_confirmation",variant:"BOOKING_CONFIRMATION"};
}
function requestedDocNumber(value,variant){
  const v=upper(value,120).replace(/[^A-Z0-9-]/g,"").slice(0,80);
  const prefix={
    BOOKING_CONFIRMATION:"BC",BOARDING_CARD:"BP",BAGGAGE_TAG:"BAG",
    TRANSFER_TICKET:"TRF",TOUR_TICKET:"TOUR",SERVICE_VOUCHER:"VCH",
    INVOICE:"INV",APIS_REPORT:"APIS"
  }[upper(variant,40)]||"DOC";
  return v||`SK-${prefix}-${Date.now().toString().slice(-10)}`;
}
function isSkandiDcsBooking(b={}){
  const p=obj(b.payload);
  const bookingType=upper(b.booking_type,80);
  const productType=upper(b.product_type,80);
  const dcsAuthority=upper(p.dcsAuthority,40);
  const operatingControl=upper(p.operatingControl,40);
  const explicitCharter=p.isCharter===true||lower(p.isCharter,20)==="true";

  return dcsAuthority==="SKANDI"||
    operatingControl==="SKANDI"||
    explicitCharter||
    bookingType.includes("CHARTER")||
    productType.includes("CHARTER");
}
async function hasTransferAuthority(bookingId,componentId=""){
  const rows=await select("altea_booking_components",{select:"id,booking_id,component_type,status",booking_id:qeq(bookingId),limit:"500"});
  return rows.some(c=>(!componentId||c.id===componentId)&&upper(c.component_type,80).includes("TRANSFER")&&!["REMOVED","CANCELLED"].includes(upper(c.status,80)));
}
function isTourComponent(component={}){
  const type=upper(component.component_type||component.componentType,80);
  return type.includes("TOUR")||type.includes("ACTIVITY")||type.includes("EXCURSION")||type.includes("GUIDED");
}
function baggageLicensePlate(input={},booking={},passenger={},segments=[]){
  const bp=obj(booking.payload),pp=obj(passenger?.payload);
  const seg=arr(segments).find(s=>upper(s.segment_type||s.segmentType,80).includes("FLIGHT"))||arr(segments)[0]||{};
  const sp=obj(seg.payload);
  const candidate=clean(
    input.licensePlate||input.baggageLicensePlate||
    pp.baggageLicensePlate||pp.baggageTagLicensePlate||
    sp.baggageLicensePlate||bp.baggageLicensePlate,
    40
  ).replace(/\D/g,"");
  if(!/^\d{10}$/.test(candidate))throw new Error("BAGGAGE_LICENSE_PLATE_10_DIGITS_REQUIRED");
  return candidate;
}
async function generatedDocumentContext(bookingId,input={}){
  const [passengers,components,segments,documents]=await Promise.all([
    select("altea_passengers",{select:"*",booking_id:qeq(bookingId),order:"created_at.asc",limit:"500"}),
    select("altea_booking_components",{select:"*",booking_id:qeq(bookingId),order:"created_at.asc",limit:"1000"}),
    select("altea_segments",{select:"*",booking_id:qeq(bookingId),order:"created_at.asc",limit:"1000"}),
    select("altea_documents",{select:"*",booking_id:qeq(bookingId),order:"created_at.desc",limit:"500"})
  ]);
  const passenger=isUuid(input.passengerId)?passengers.find(x=>x.id===input.passengerId)||null:passengers[0]||null;
  const requestedComponentId=clean(input.componentId||input.departureId,80);
  const component=isUuid(requestedComponentId)?components.find(x=>x.id===requestedComponentId)||null:null;
  const requestedSegmentId=clean(input.segmentId,80);
  const segment=isUuid(requestedSegmentId)?segments.find(x=>x.id===requestedSegmentId)||null:
    segments.find(x=>upper(x.segment_type,80).includes("FLIGHT"))||segments[0]||null;
  return{passengers,components,segments,documents,passenger,component,segment};
}
function controlledFallbackHtml(variant,b,p=null,authority="SKANDI_BOOKING"){
  const ref=clean(b?.booking_reference||b?.pnr_locator||b?.id,120);
  const name=clean(p?.display_name||`${p?.first_name||""} ${p?.last_name||""}`.trim()||b?.customer_name||"Customer",300);
  const notice=authority==="SKANDI_TRANSFER"
    ?"SKANDI ground-service document."
    :authority==="SKANDI_TOUR"
      ?"SKANDI tour/activity service document."
      :"SKANDI-controlled booking document.";
  return`<!doctype html><html><head><meta charset="utf-8"><title>SKANDI ${clean(variant,120)}</title></head><body style="font-family:Arial,sans-serif;padding:32px;color:#17212b"><h1 style="color:#005eb8">SKANDI TRAVELS</h1><h2>${clean(variant,120).replaceAll("_"," ")}</h2><p><b>Booking reference:</b> ${ref}</p><p><b>Passenger/Customer:</b> ${name}</p><p>${notice}</p></body></html>`;
}
function bagTagSegmentsFromFlightDetails(booking,context){
  if(arr(context?.segments).length)return context.segments;
  return arr(obj(obj(booking?.payload).flightDetails).segments).map(segment=>({
    id:segment.id||"",
    destination:segment.destination||"",
    departingAt:segment.departingAt||null,
    departureDate:clean(segment.departingAt,30).slice(0,10),
    marketingFlightNumber:clean(segment.flightNumber,30).replace(/^[A-Z0-9]{2,3}/,""),
    marketingCarrier:{iataCode:segment.marketingCarrierCode||clean(segment.flightNumber,3).replace(/[^A-Z0-9]/g,"")},
    carrier:segment.marketingCarrierCode||"",
    aircraft:segment.aircraftCode?{iataCode:segment.aircraftCode,name:segment.aircraft||""}:null
  }));
}
function renderGeneratedDocument({spec,booking,context,documentNumber,authority,input}){
  if(spec.variant==="BOOKING_CONFIRMATION"){
    return renderBookingConfirmation({
      booking,passengers:context.passengers,segments:context.segments,
      components:context.components,documents:context.documents,
      documentNumber,generatedAt:now(),preview:false
    });
  }
  if(spec.variant==="BAGGAGE_TAG"){
    const pp=obj(context.passenger?.payload);
    const segments=bagTagSegmentsFromFlightDetails(booking,context);
    const passenger={
      ...obj(context.passenger),
      bnNumber:input.bnNumber||context.passenger?.sequence_number||context.passenger?.sequenceNumber||"",
      baggageWeight:input.weightKg??pp.baggageWeight??0,
      baggageCount:input.pieceCount||pp.baggageCount||1,
      bagIndex:input.pieceNumber||pp.bagIndex||1,
      cabinClass:input.cabinClass||pp.cabinClass||"",
      firstName:context.passenger?.first_name||context.passenger?.firstName||"",
      lastName:context.passenger?.last_name||context.passenger?.lastName||"",
      title:pp.title||""
    };
    return renderBagTag({
      booking,passenger,segments,
      documentNumber,licensePlate:baggageLicensePlate(input,booking,context.passenger,segments),
      airlineName:input.airlineName||obj(booking.payload).flightDetails?.pricingRecord?.validatingCarrier||booking.supplier||"SKANDI"
    });
  }
  if(["BOARDING_CARD","TRANSFER_TICKET","TOUR_TICKET"].includes(spec.variant)){
    return renderAtbTicket({
      variant:spec.variant,booking,passenger:context.passenger||{},
      segment:context.segment||{},component:context.component||{},
      documentNumber,authority,
      bcbpPayload:input.bcbpPayload||input.barcodePayload||""
    });
  }
  if(spec.variant==="INVOICE"){
    return renderInvoice({
      booking,passengers:context.passengers,components:context.components,
      documentNumber,generatedAt:now()
    });
  }
  return controlledFallbackHtml(spec.variant,booking,context.passenger,authority);
}
async function prepareGeneratedHtmlAsset({html,booking,documentId,documentNumber,documentType,manifestId=""}){
  const isZpl=upper(documentType,80)==="BAGGAGE_TAG";
  const mimeType=isZpl?"text/plain":"text/html";
  const extension=isZpl?"zpl":"html";
  const bytes=new TextEncoder().encode(html);
  const sha256=createHash("sha256").update(html,"utf8").digest("hex");
  const ref=clean(booking.booking_reference||booking.pnr_locator||booking.id,120);
  const fileName=`${ref}-${documentNumber||documentType}.${extension}`.replace(/[^A-Za-z0-9._-]+/g,"-");
  const prepared=await prepareAssetUploadCore({
    file:{name:fileName,type:mimeType,size:bytes.byteLength},
    sha256,visibility:"PRIVATE",assetType:"DOCUMENT",
    libraryRoot:"SKANDI",libraryFolder:"ALTEA Reservations",
    librarySubfolder:`Bookings / ${ref}`,category:manifestId?"Manifests":"Documents",
    brand:"SKANDI",system:"ALTEA Reservations",contextSystem:"ALTEA Reservations",
    contextRecordType:manifestId?"OPERATIONAL_MANIFEST":"ALTEA_DOCUMENT",
    contextRecordId:manifestId||documentId,fieldName:"generated_file",role:documentType
  });
  if(prepared.duplicate&&prepared.exactDuplicates?.[0]){
    return{duplicate:true,asset:prepared.exactDuplicates[0]};
  }
  return{
    duplicate:false,requestId:prepared.requestId,upload:prepared.upload,
    content:html,mimeType,documentId,manifestId
  };
}
export async function previewAlteaBookingConfirmationCore(input={}){
  await requireReservationsAccessCore();
  const id=clean(input.bookingId,80);if(!isUuid(id))throw new Error("BOOKING_REQUIRED");
  const booking=await bookingRow(id);if(!booking)throw new Error("BOOKING_NOT_FOUND");
  const context=await generatedDocumentContext(id,input);
  return{ok:true,bookingId:id,bookingReference:booking.booking_reference||booking.pnr_locator||id,
    html:renderBookingConfirmation({booking,passengers:context.passengers,segments:context.segments,
      components:context.components,documents:context.documents,documentNumber:"PREVIEW",generatedAt:now(),preview:true})};
}

export async function generateAlteaBookingDocumentCore(input={}){
  const session=await requireReservationsAccessCore({write:true});
  const id=clean(input.bookingId,80);if(!isUuid(id))throw new Error("BOOKING_REQUIRED");
  const b=await bookingRow(id);if(!b)throw new Error("BOOKING_NOT_FOUND");
  const context=await generatedDocumentContext(id,input);
  const spec=requestedDocumentSpec(input.documentType,context.component);
  let authority="SKANDI_BOOKING";

  if(spec.variant==="BOARDING_CARD"||spec.variant==="BAGGAGE_TAG"){
    if(!isSkandiDcsBooking(b))throw new Error("SKANDI_DCS_AUTHORITY_REQUIRED");
    authority="SKANDI_CHARTER_DCS";
  }
  if(spec.variant==="TRANSFER_TICKET"){
    const componentId=clean(input.componentId||input.departureId,80);
    if(!(await hasTransferAuthority(id,componentId)))throw new Error("SKANDI_TRANSFER_AUTHORITY_REQUIRED");
    authority="SKANDI_TRANSFER";
  }
  if(spec.variant==="TOUR_TICKET"){
    if(!context.component||!isTourComponent(context.component)||["REMOVED","CANCELLED"].includes(upper(context.component.status,80))){
      throw new Error("SKANDI_TOUR_AUTHORITY_REQUIRED");
    }
    authority="SKANDI_TOUR";
  }
  if(["BOARDING_CARD","BAGGAGE_TAG","TRANSFER_TICKET","TOUR_TICKET"].includes(spec.variant)&&!context.passenger){
    throw new Error("PASSENGER_REQUIRED");
  }

  const number=requestedDocNumber(input.documentNumber,spec.variant);
  const html=renderGeneratedDocument({spec,booking:b,context,documentNumber:number,authority,input});
  const rows=await insert("altea_documents",{
    booking_id:id,passenger_id:context.passenger?.id||null,document_type:spec.storageType,document_number:number,
    status:"draft",pdf_url:null,html_snapshot:html,issued_at:null,issued_by_agent_user_id:actor(session),
    payload:{source:"SKANDI_CORE_RESERVATIONS",bookingReference:b.booking_reference,provider:"SKANDI",
      authority,renderVariant:spec.variant,
      contentType:spec.variant==="BAGGAGE_TAG"?"text/plain":"text/html",
      renderFormat:spec.variant==="BAGGAGE_TAG"?"ZPL":"HTML",
      componentId:input.componentId||input.departureId||null,
      segmentId:input.segmentId||context.segment?.id||null,assetStatus:"PENDING"}
  });
  const d=rows[0];if(!d?.id)throw new Error("DOCUMENT_CREATE_FAILED");
  const warnings=[];
  try{
    await insert("altea_booking_documents",{
      booking_id:id,passenger_id:context.passenger?.id||null,provider:"SKANDI",provider_document_id:d.id,
      document_type:spec.storageType,document_number:number,status:"DRAFT",
      payload:{alteaDocumentId:d.id,authority,renderVariant:spec.variant,
        contentType:spec.variant==="BAGGAGE_TAG"?"text/plain":"text/html",
        renderFormat:spec.variant==="BAGGAGE_TAG"?"ZPL":"HTML",
        componentId:input.componentId||input.departureId||null,
        segmentId:input.segmentId||context.segment?.id||null,assetStatus:"PENDING"}
    });
  }catch(error){
    warnings.push({code:"BOOKING_DOCUMENT_LINK_WRITE_FAILED",message:clean(error?.message,240)});
  }

  let assetUpload=null;
  try{
    assetUpload=await prepareGeneratedHtmlAsset({html,booking:b,documentId:d.id,documentNumber:number,documentType:spec.variant});
    if(assetUpload.duplicate&&assetUpload.asset){
      await linkGeneratedAsset({documentId:d.id,asset:assetUpload.asset,session});
      assetUpload=null;
    }
  }catch(error){
    const assetCode=upper(error?.code||error?.message||"ASSET_PREPARE_FAILED",80).replace(/[^A-Z0-9_]/g,"_").slice(0,80)||"ASSET_PREPARE_FAILED";
    warnings.push({code:assetCode,message:"Document generated, but Asset Library upload preparation failed."});
    try{
      await patch("altea_documents",{id:qeq(d.id)},{
        payload:{...obj(d.payload),assetStatus:"PREPARE_FAILED",assetErrorCode:assetCode},updated_at:now()
      });
    }catch(_){}
  }

  await history(id,"DOCUMENT_GENERATED",{
    documentId:d.id,documentType:spec.storageType,renderVariant:spec.variant,
    documentNumber:number,authority,assetUploadRequired:!!assetUpload,warnings:warnings.map(x=>x.code)
  },session);
  const current=(await select("altea_documents",{select:"*",id:qeq(d.id),limit:"1"}))[0]||d;
  return{
    ok:true,document:documentView(current),assetUpload,warnings,
    message:warnings.length
      ?`SKANDI ${spec.variant.replaceAll("_"," ").toLowerCase()} generated. ${warnings.length} persistence warning(s) require review.`
      :`SKANDI ${spec.variant.replaceAll("_"," ").toLowerCase()} generated. File persistence is handled by the Platform Asset Library.`
  };
}

async function linkGeneratedAsset({documentId,manifestId,asset,session}){
  if(documentId){
    const d=(await select("altea_documents",{select:"*",id:qeq(documentId),limit:"1"}))[0];
    if(!d)throw new Error("DOCUMENT_NOT_FOUND");
    const payload={...obj(d.payload),assetId:asset.id,assetCode:asset.assetCode,assetStatus:"STORED"};
    await patch("altea_documents",{id:qeq(documentId)},{status:"issued",issued_at:d.issued_at||now(),payload,updated_at:now()});
    await patch("altea_booking_documents",{provider_document_id:qeq(documentId)},{status:"ACTIVE",payload:{alteaDocumentId:documentId,assetId:asset.id,assetCode:asset.assetCode}});
    await registerAssetUsageCore({assetId:asset.id,system:"ALTEA Reservations",recordType:"ALTEA_DOCUMENT",recordId:documentId,usageRole:d.document_type,fieldName:"generated_file"},session);
    return;
  }
  if(manifestId){
    const m=(await select("operational_manifests",{select:"*",id:qeq(manifestId),limit:"1"}))[0];
    if(!m)throw new Error("MANIFEST_NOT_FOUND");
    await patch("operational_manifests",{id:qeq(manifestId)},{payload:{...obj(m.payload),assetId:asset.id,assetCode:asset.assetCode,assetStatus:"STORED"}});
    await registerAssetUsageCore({assetId:asset.id,system:"ALTEA Reservations",recordType:"OPERATIONAL_MANIFEST",recordId:manifestId,usageRole:"MANIFEST",fieldName:"generated_file"},session);
  }
}
export async function finalizeGeneratedReservationsAssetCore(input={}){
  const session=await requireReservationsAccessCore({write:true});
  const finalized=await finalizeAssetUploadCore({requestId:input.requestId});
  if(!finalized?.asset)throw new Error("GENERATED_ASSET_FINALIZE_FAILED");
  await linkGeneratedAsset({documentId:clean(input.documentId,80),manifestId:clean(input.manifestId,80),asset:finalized.asset,session});
  const workspace=isUuid(input.bookingId)?(await getAlteaBookingWorkspaceCore({bookingId:input.bookingId})).workspace:null;
  return{ok:true,asset:finalized.asset,workspace};
}
export async function requestAlteaDocumentDeliveryCore(input={}){
  const session=await requireReservationsAccessCore({write:true});
  const id=clean(input.bookingId,80);if(!isUuid(id))throw new Error("BOOKING_REQUIRED");
  await history(id,"DOCUMENT_DELIVERY_REQUESTED",{documentType:upper(input.documentType,80),documentId:input.documentId||null,
    componentId:input.componentId||null,recipient:clean(input.recipient,400)},session);
  return{ok:true,status:"QUEUED",message:"Document delivery request recorded for the SKANDI mail/document workflow."};
}
export async function updateAlteaDcsPassengerCore(input={}){
  const session=await requireReservationsAccessCore({write:true});
  const p=await passengerRow(input.passengerId);if(!p)throw new Error("PASSENGER_NOT_FOUND");
  const bookingId=input.bookingId||p.booking_id;
  const b=await bookingRow(bookingId);
  if(!b||!isSkandiDcsBooking(b))throw new Error("SKANDI_DCS_AUTHORITY_REQUIRED");
  const change=obj(input.patch),body=passengerPatch(change,p);
  const updated=(await patch("altea_passengers",{id:qeq(p.id)},body))[0]||p;
  await history(bookingId,"DCS_PASSENGER_UPDATED",{passengerId:p.id,patch:change},session);
  return{ok:true,passenger:passengerView(updated)};
}


function transferDeparture(component,booking,passengers){
  const p=obj(component.payload),state=obj(p.transferDcsState);
  const service=clean(p.serviceNumber||p.transferNumber||component.supplier_reference||`TRF-${String(component.id).slice(0,8).toUpperCase()}`,120);
  return{id:String(component.id),componentId:component.id,bookingId:component.booking_id,serviceNumber:service,
    origin:clean(p.pickupLocation||p.origin||booking?.origin||"Airport / pickup",500),
    destination:clean(p.dropoffLocation||p.destination||p.hotelName||booking?.destination||"Hotel / destination",500),
    date:clean(p.serviceDate||p.startDate||booking?.departure_date,20),
    scheduled:clean(p.serviceTime||p.pickupTime||"—",30),
    estimated:clean(state.estimated||p.estimatedDeparture||p.serviceTime||p.pickupTime||"—",30),
    bay:clean(state.bay||p.bay||p.meetingPoint||"—",300),
    vehicle:clean(state.vehicle||p.vehicleName||p.vehicleType||"Coach",300),
    vehicleRegistration:clean(state.vehicleRegistration||p.vehicleRegistration,100),
    capacity:Number(state.capacity||p.capacity||p.vehicleCapacity||50)||50,booked:passengers.length,
    driver:clean(state.driver||p.driverName||"—",300),guide:clean(state.guide||p.guideName||p.hostName||"—",300),
    terminal:clean(p.terminal||p.airportTerminal,80),associatedFlight:clean(p.associatedFlight||p.flightNumber,80),
    status:upper(state.status||p.transferStatus||p.operationalStatus||"OPEN",80),
    raw:{...component,payload:p,passengers:passengers.map(x=>({...passengerView(x),transferDcs:obj(x.payload?.transferDcs)}))}
  };
}
export async function getTransferDcsBootstrapCore(input={}){
  await requireReservationsAccessCore();
  const rows=await select("altea_booking_components",{select:"*",order:"created_at.desc",limit:"1200"});
  let transfers=rows.filter(c=>upper(c.component_type,80).includes("TRANSFER")&&!["REMOVED","CANCELLED"].includes(upper(c.status,80)));
  if(isUuid(input.bookingId))transfers=transfers.filter(c=>c.booking_id===input.bookingId);
  const bids=[...new Set(transfers.map(c=>c.booking_id).filter(Boolean))];
  if(!bids.length)return{ok:true,departures:[],persistenceAvailable:true};
  const [bookings,pax]=await Promise.all([
    select("altea_bookings",{select:"*",id:`in.(${bids.join(",")})`,limit:"1000"}),
    select("altea_passengers",{select:"*",booking_id:`in.(${bids.join(",")})`,limit:"5000"})
  ]);
  const bm=new Map(bookings.map(b=>[b.id,b]));
  return{ok:true,departures:transfers.map(c=>transferDeparture(c,bm.get(c.booking_id),pax.filter(x=>x.booking_id===c.booking_id))),persistenceAvailable:true};
}
export async function updateTransferDcsPassengerCore(input={}){
  const session=await requireReservationsAccessCore({write:true});
  const p=await passengerRow(input.passengerId);if(!p)throw new Error("PASSENGER_NOT_FOUND");
  const dep=clean(input.departureId||input.componentId,100);if(!dep)throw new Error("TRANSFER_DEPARTURE_REQUIRED");
  const payload=obj(p.payload),td=obj(payload.transferDcs);
  td[dep]={...obj(td[dep]),...obj(input.patch),updatedAt:now()};payload.transferDcs=td;
  if(input.patch?.bags!==undefined)payload.baggageCount=Math.max(0,Number(input.patch.bags||0));
  if(input.patch?.weight!==undefined)payload.baggageWeight=Math.max(0,Number(input.patch.weight||0));
  await patch("altea_passengers",{id:qeq(p.id)},{payload,updated_at:now()});
  await history(input.bookingId||p.booking_id,"TRANSFER_DCS_PASSENGER_UPDATED",{departureId:dep,passengerId:p.id,patch:obj(input.patch)},session);
  return{ok:true,passengerId:p.id};
}
export async function updateTransferDcsDepartureCore(input={}){
  const session=await requireReservationsAccessCore({write:true});
  const c=await componentRow(input.componentId||input.departureId);if(!c)throw new Error("TRANSFER_COMPONENT_NOT_FOUND");
  if(!upper(c.component_type,80).includes("TRANSFER"))throw new Error("TRANSFER_COMPONENT_REQUIRED");
  const payload=obj(c.payload);payload.transferDcsState={...obj(payload.transferDcsState),...obj(input.patch),updatedAt:now()};
  await patch("altea_booking_components",{id:qeq(c.id)},{payload,updated_at:now()});
  await history(input.bookingId||c.booking_id,"TRANSFER_DCS_DEPARTURE_UPDATED",{componentId:c.id,patch:obj(input.patch)},session);
  return{ok:true,componentId:c.id};
}
export async function recordTransferDcsDocumentCore(input={}){
  return generateAlteaBookingDocumentCore({...input,componentId:input.componentId||input.departureId,
    documentType:input.documentType||"TRANSFER_DOCUMENT"});
}
function manifestHtml(type,b,passengers,components,number){
  const rows=passengers.map((p,i)=>`<tr><td>${i+1}</td><td>${clean(p.display_name||`${p.first_name||""} ${p.last_name||""}`,300)}</td><td>${clean(p.pax_type,12)}</td><td>${clean(p.seat_number||"",20)}</td><td>${clean(p.checkin_status||"",80)}</td></tr>`).join("");
  return`<!doctype html><html><head><meta charset="utf-8"><title>${number}</title></head><body style="font-family:Arial,sans-serif;padding:28px"><h1>SKANDI TRAVELS</h1><h2>${clean(type,100)} MANIFEST</h2><p><b>${number}</b> · Booking ${clean(b.booking_reference||b.pnr_locator||b.id,120)}</p><p>${clean(b.origin,12)} → ${clean(b.destination,12)} · ${clean(b.departure_date,20)}</p><table border="1" cellspacing="0" cellpadding="6"><tr><th>#</th><th>Passenger</th><th>Type</th><th>Seat</th><th>Status</th></tr>${rows}</table><p>Components: ${components.length}</p></body></html>`;
}
export async function sendAlteaManifestCore(input={}){
  const session=await requireReservationsAccessCore({write:true});
  const b=await bookingRow(input.bookingId);if(!b)throw new Error("BOOKING_NOT_FOUND");
  const [passengers,components]=await Promise.all([
    select("altea_passengers",{select:"*",booking_id:qeq(b.id),order:"created_at.asc"}),
    select("altea_booking_components",{select:"*",booking_id:qeq(b.id),order:"created_at.asc"})
  ]);
  const type=upper(input.manifestType||"PASSENGERS",80),number=`MAN-${Date.now().toString().slice(-10)}`;
  const html=manifestHtml(type,b,passengers,components,number);
  const rows=await insert("operational_manifests",{
    title:`${type} · ${b.booking_reference||b.pnr_locator||b.id}`,status:"READY",
    manifest_number:number,route:[b.origin,b.destination].filter(Boolean).join("-")||null,
    departure:b.departure_date?`${b.departure_date}T00:00:00Z`:null,
    payload:{bookingId:b.id,bookingReference:b.booking_reference,pnrLocator:b.pnr_locator,manifestType:type,
      passengers,components,generatedAt:now(),assetStatus:"PENDING"}
  });
  const manifest=rows[0];if(!manifest?.id)throw new Error("MANIFEST_CREATE_FAILED");
  let assetUpload=await prepareGeneratedHtmlAsset({html,booking:b,manifestId:manifest.id,documentNumber:number,documentType:"manifest"});
  if(assetUpload.duplicate&&assetUpload.asset){await linkGeneratedAsset({manifestId:manifest.id,asset:assetUpload.asset,session});assetUpload=null}
  await history(b.id,"MANIFEST_GENERATED",{manifestId:manifest.id,manifestNumber:number,manifestType:type,assetUploadRequired:!!assetUpload},session);
  return{ok:true,manifest,assetUpload,message:"Operational manifest generated. File persistence is handled by the Platform Asset Library."};
}
