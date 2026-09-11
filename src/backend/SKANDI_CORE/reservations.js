// /src/backend/SKANDI_CORE/reservations.js
// SKANDI ALTEA Reservations — canonical SKANDI-owned booking/operations logic.
// Recovery R-005 source of truth for Inventory sales, Club, documents,
// travel-requirements orchestration, transfer Departure Control and manifests.
//
// Duffel supplier adapters remain separate internal dependencies until R-006.
// Customer confirmed-cart -> ALTEA synchronization remains database-trigger owned.


import { createHash } from "crypto";
import { restRequest, rpcRequest } from "./supabaseServer.js";
import { getStaffPortalSessionCore } from "./staffAuth.js";
import {
  prepareAssetUploadCore,
  finalizeAssetUploadCore,
  registerAssetUsageCore
} from "./assets.js";
import { checkExternalTravelRequirements } from "./providers/travelRequirements.js";
import { renderBookingConfirmation } from "./documents/bookingConfirmation.js";
import { renderAtbTicket } from "./documents/atbTicket.js";
import { renderBagTag } from "./documents/bagTag.js";
import { renderInvoice } from "./documents/invoice.js";


export const RESERVATIONS_CORE_VERSION = "R-006.9";


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
    packageStatus:p.packageStatus||"",notes:p.notes||"",payload:p,
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
    documentNumber:r.document_number||"",status:upper(r.status,40),
    storageStatus:r.status,pdfUrl:r.pdf_url||"",htmlSnapshot:r.html_snapshot||"",
    assetId:p.assetId||"",assetCode:p.assetCode||"",assetStatus:p.assetStatus||"",
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
  for(const key of ["tripTitle","transferControl","packageStatus","dcsAuthority","operatingControl","isCharter","notes"]){
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
  const status=lower(input.status,40);if(!DOCUMENT_STATUSES.has(status))throw new Error("DOCUMENT_STATUS_INVALID");
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
  const order=obj(input.order);if(!clean(order.id,160))throw new Error("DUFFEL_ORDER_REQUIRED");
  const bookingInput=obj(input.bookingInput);
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
    payload:{...obj(existing?.payload),duffelOrder:order,lastSupplierSyncAt:now()}
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


function clubView(r={}){
  const p=obj(r.payload);
  return{id:r.id,memberId:r.member_id,memberNumber:clean(p.memberNumber||p.member_number||r.club_id||r.member_id,100),
    clubId:r.club_id,name:clean(p.name||p.displayName||p.customerName||p.fullName||r.member_id,300),
    email:clean(p.email||p.customerEmail,400),tier:upper(p.tier||p.tierName||"MEMBER",80),
    pointsBalance:Number(p.pointsBalance??p.points??0)||0,status:r.status||"Active",
    dateOfBirth:r.date_of_birth||null,nationalityId:r.nationality_id||null,
    homeAirportId:r.home_airport_id||null,payload:p};
}
export async function searchSkandiClubMembersCore(input={}){
  await requireReservationsAccessCore();
  const q=lower(input.query,200);
  const rows=await select("club_profiles",{select:"*",limit:"500",order:"updated_at.desc"});
  return{ok:true,members:rows.map(clubView).filter(x=>!q||`${x.memberNumber} ${x.memberId} ${x.name} ${x.email}`.toLowerCase().includes(q)).slice(0,100)};
}
export async function linkSkandiClubMemberCore(input={}){
  const session=await requireReservationsAccessCore({write:true});
  if(!isUuid(input.passengerId)||!isUuid(input.memberId))throw new Error("CLUB_LINK_INPUT_INVALID");
  const [p,members]=await Promise.all([passengerRow(input.passengerId),select("club_profiles",{select:"*",id:qeq(input.memberId),limit:"1"})]);
  const member=members[0];if(!p||!member)throw new Error("CLUB_MEMBER_OR_PASSENGER_NOT_FOUND");
  const view=clubView(member),payload={...obj(p.payload),clubProfile:view,clubProfileId:member.id};
  await patch("altea_passengers",{id:qeq(p.id)},{payload,updated_at:now()});
  if(isUuid(input.bookingId))await patch("altea_bookings",{id:qeq(input.bookingId)},{customer_member_id:member.member_id,updated_at:now()});
  await history(input.bookingId||p.booking_id,"SKANDI_CLUB_LINKED",{passengerId:p.id,memberId:member.id,memberNumber:view.memberNumber},session);
  return{ok:true,passengerId:p.id,member:view,message:"SKANDI Club member linked to passenger."};
}
export async function adjustSkandiClubPointsCore(input={}){
  const session=await requireReservationsAccessCore({write:true});
  if(!isUuid(input.memberId))throw new Error("CLUB_MEMBER_REQUIRED");
  const row=(await select("club_profiles",{select:"*",id:qeq(input.memberId),limit:"1"}))[0];
  if(!row)throw new Error("CLUB_MEMBER_NOT_FOUND");
  const delta=Math.trunc(Number(input.delta||0)),reason=clean(input.reason,1000);
  if(!delta)throw new Error("POINTS_DELTA_REQUIRED");if(!reason)throw new Error("POINTS_REASON_REQUIRED");
  const p=obj(row.payload),next=Math.max(0,(Number(p.pointsBalance??p.points??0)||0)+delta);
  p.pointsBalance=next;p.points=next;p.lastPointsAdjustment={delta,reason,at:now(),actorId:actor(session)};
  const updated=(await patch("club_profiles",{id:qeq(row.id)},{payload:p,updated_at:now()}))[0]||{...row,payload:p};
  await history(input.bookingId,"SKANDI_CLUB_POINTS_ADJUSTED",{memberId:row.id,passengerId:input.passengerId||null,delta,reason,balance:next},session);
  return{ok:true,passengerId:input.passengerId||"",member:clubView(updated),message:`SKANDI Club points updated by ${delta}.`};
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
  const [passengers,components,segments]=await Promise.all([
    select("altea_passengers",{select:"*",booking_id:qeq(bookingId),order:"created_at.asc",limit:"500"}),
    select("altea_booking_components",{select:"*",booking_id:qeq(bookingId),order:"created_at.asc",limit:"1000"}),
    select("altea_segments",{select:"*",booking_id:qeq(bookingId),order:"created_at.asc",limit:"1000"})
  ]);
  const passenger=isUuid(input.passengerId)?passengers.find(x=>x.id===input.passengerId)||null:passengers[0]||null;
  const requestedComponentId=clean(input.componentId||input.departureId,80);
  const component=isUuid(requestedComponentId)?components.find(x=>x.id===requestedComponentId)||null:null;
  const requestedSegmentId=clean(input.segmentId,80);
  const segment=isUuid(requestedSegmentId)?segments.find(x=>x.id===requestedSegmentId)||null:
    segments.find(x=>upper(x.segment_type,80).includes("FLIGHT"))||segments[0]||null;
  return{passengers,components,segments,passenger,component,segment};
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
function renderGeneratedDocument({spec,booking,context,documentNumber,authority,input}){
  if(spec.variant==="BOOKING_CONFIRMATION"){
    return renderBookingConfirmation({
      booking,passengers:context.passengers,segments:context.segments,
      components:context.components,documentNumber,generatedAt:now()
    });
  }
  if(spec.variant==="BAGGAGE_TAG"){
    return renderBagTag({
      booking,passenger:context.passenger||{},segments:context.segments,
      documentNumber,licensePlate:baggageLicensePlate(input,booking,context.passenger,context.segments),
      weightKg:input.weightKg??context.passenger?.payload?.baggageWeight,
      pieceNumber:input.pieceNumber||1,
      pieceCount:input.pieceCount||context.passenger?.payload?.baggageCount||1,
      journeyStatus:input.journeyStatus||context.passenger?.payload?.baggageStatus,
      issuedAt:now()
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
  const bytes=new TextEncoder().encode(html);
  const sha256=createHash("sha256").update(html,"utf8").digest("hex");
  const ref=clean(booking.booking_reference||booking.pnr_locator||booking.id,120);
  const fileName=`${ref}-${documentNumber||documentType}.html`.replace(/[^A-Za-z0-9._-]+/g,"-");
  const prepared=await prepareAssetUploadCore({
    file:{name:fileName,type:"text/html",size:bytes.byteLength},
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
    content:html,mimeType:"text/html",documentId,manifestId
  };
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
      authority,renderVariant:spec.variant,componentId:input.componentId||input.departureId||null,
      segmentId:input.segmentId||context.segment?.id||null,assetStatus:"PENDING"}
  });
  const d=rows[0];if(!d?.id)throw new Error("DOCUMENT_CREATE_FAILED");
  await insert("altea_booking_documents",{
    booking_id:id,passenger_id:context.passenger?.id||null,provider:"SKANDI",provider_document_id:d.id,
    document_type:spec.storageType,document_number:number,status:"DRAFT",
    payload:{alteaDocumentId:d.id,authority,renderVariant:spec.variant,
      componentId:input.componentId||input.departureId||null,
      segmentId:input.segmentId||context.segment?.id||null,assetStatus:"PENDING"}
  });
  let assetUpload=await prepareGeneratedHtmlAsset({html,booking:b,documentId:d.id,documentNumber:number,documentType:spec.variant});
  if(assetUpload.duplicate&&assetUpload.asset){
    await linkGeneratedAsset({documentId:d.id,asset:assetUpload.asset,session});
    assetUpload=null;
  }
  await history(id,"DOCUMENT_GENERATED",{
    documentId:d.id,documentType:spec.storageType,renderVariant:spec.variant,
    documentNumber:number,authority,assetUploadRequired:!!assetUpload
  },session);
  const current=(await select("altea_documents",{select:"*",id:qeq(d.id),limit:"1"}))[0]||d;
  return{
    ok:true,document:documentView(current),assetUpload,
    message:`SKANDI ${spec.variant.replaceAll("_"," ").toLowerCase()} generated. File persistence is handled by the Platform Asset Library.`
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
