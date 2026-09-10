// /src/backend/SKANDI_CORE/inventory.js
// SKANDI Inventory Control — canonical business logic.
// Recovery R-003 source of truth.
// No webMethod wrappers, no routes, no UI code.

import { randomUUID } from "crypto";
import { restRequest } from "./supabaseServer.js";
import { getStaffPortalSessionCore } from "./staffAuth.js";

export const INVENTORY_CORE_VERSION = "R-003.1";

const MASTER_TYPES = new Set([
  "COUNTRY","DESTINATION","AREA","SUPPLIER","HOTEL","GUIDED_TOUR","ACTIVITY",
  "PARTNER_TICKET","TRANSFER","CAR_RENTAL","PACKAGE","ANCILLARY"
]);
const REFERENCE_TYPES = new Set(["AIRPORT","AIRLINE"]);
const STATUS = new Set(["DRAFT","REVIEW","PUBLISHED","HIDDEN","SUSPENDED","ARCHIVED"]);
const CATALOG_TYPES = new Set(["NONE","SKANDI_COLLECTION","SKANDI_PARTNER"]);
const MEDIA_ROLES = new Set(["PRIMARY","HERO","CARD","MOBILE","GALLERY","OG","LOGO","MAP","ROOM","THUMBNAIL"]);

const AIR_TABLES = Object.freeze({
  flight:{
    table:"inventory_flight_legs",
    allowed:["flight_number","departure_date","board_point","off_point","equipment_type","physical_capacity","yield_index","control_mode","revenue_band","status","source","last_sync_at","payload"],
    required:["flight_number","departure_date","board_point","off_point"]
  },
  class:{
    table:"inventory_flight_classes",
    allowed:["flight_leg_id","flight_number","departure_date","board_point","off_point","class_code","cabin","nest","authorized","sold","available","waitlist_limit","overbooking_limit","protection","status","note","payload"],
    required:["flight_number","departure_date","board_point","off_point","class_code"]
  },
  schedule:{
    table:"inventory_schedule_lines",
    allowed:["season_code","flight_number","days_of_operation","board_point","off_point","via_point","std","sta","equipment_type","capacity","effective_date","discontinue_date","status","payload"],
    required:["flight_number","board_point","off_point"]
  },
  nesting:{
    table:"inventory_nesting_controls",
    allowed:["flight_number","departure_date","board_point","off_point","class_code","cabin","nest","parent_class","bid_price","hurdle","min_stay","waitlist_limit","overbooking_limit","authorized","protection","waitlist_policy","status","payload"],
    required:["flight_number","departure_date","board_point","off_point","class_code"]
  }
});

const AIRCRAFT_CHILDREN = Object.freeze({
  cabin:{
    table:"travel_info_aircraft_cabins",
    parent:"aircraft_id",
    allowed:["aircraft_id","cabin_code","cabin_name","rank","seat_count","summary","description","meal_title","meal_description","amenities","display_settings","active","sort_order"]
  },
  view:{
    table:"travel_info_aircraft_views",
    parent:"aircraft_id",
    allowed:["aircraft_id","cabin_id","view_code","label","view_type","image_url","mobile_image_url","thumbnail_url","alt_text","caption","credit","is_default","active","sort_order"]
  },
  hotspot:{
    table:"travel_info_aircraft_hotspots",
    parent:"view_id",
    allowed:["view_id","hotspot_code","label","title","description","x","y","action","focus_x","focus_y","focus_zoom","target_cabin_code","thumbnail_url","active","sort_order"]
  },
  scene:{
    table:"travel_info_aircraft_walk_scenes",
    parent:"aircraft_id",
    allowed:["aircraft_id","scene_code","title","short_title","summary","image_url","mobile_image_url","forward_scene_code","back_scene_code","forward_label","back_label","active","sort_order"]
  },
  sceneHotspot:{
    table:"travel_info_aircraft_scene_hotspots",
    parent:"scene_id",
    allowed:["scene_id","hotspot_code","label","title","description","hotspot_type","x","y","action","target_cabin_code","active","sort_order"]
  }
});

const clean=(v,max=12000)=>String(v??"").trim().slice(0,max);
const upper=(v,max=12000)=>clean(v,max).toUpperCase();
const lower=(v,max=12000)=>clean(v,max).toLowerCase();
const array=v=>Array.isArray(v)?v:[];
const object=v=>v&&typeof v==="object"&&!Array.isArray(v)?v:{};
const bool=(v,fallback=false)=>v===undefined||v===null||v===""?fallback:(v===true||v==="true"||v===1||v==="1"||upper(v)==="YES");
const isUuid=v=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(clean(v,80));
const qeq=v=>`eq.${clean(v,300)}`;
const now=()=>new Date().toISOString();

function nullableNumber(v,{integer=false,min=null,max=null}={}){
  if(v===undefined||v===null||v==="") return null;
  const n=Number(v);
  if(!Number.isFinite(n)) return null;
  let out=integer?Math.round(n):n;
  if(min!==null) out=Math.max(min,out);
  if(max!==null) out=Math.min(max,out);
  return out;
}
function safeStatus(v, fallback="DRAFT"){
  const s=upper(v,40);
  return STATUS.has(s)?s:fallback;
}
function slugify(v){
  return lower(v,300).normalize("NFKD").replace(/[\u0300-\u036f]/g,"")
    .replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,240);
}
function uniqueStrings(v){
  return [...new Set(array(v).map(x=>clean(x,500)).filter(Boolean))];
}
function parseJson(v,fallback={}){
  if(v===undefined||v===null||v==="") return fallback;
  if(typeof v==="object") return v;
  try{return JSON.parse(String(v))}catch(_){return fallback}
}
function pick(source,keys){
  const out={};
  for(const key of keys) if(source?.[key]!==undefined) out[key]=source[key];
  return out;
}
function stripImmutable(row={}){
  const out={...row};
  for(const key of ["id","ID","created_at","updated_at","Created Date","Record ID"]) delete out[key];
  return out;
}
async function select(table,query={}){
  const result=await restRequest({table,method:"GET",query,prefer:""});
  return array(result);
}

async function requireInventoryAccess({write=false}={}){
  const session=await getStaffPortalSessionCore();
  if(!session?.loggedIn || !session?.authorized) {
    const e=new Error("INVENTORY_AUTH_REQUIRED"); e.code="INVENTORY_AUTH_REQUIRED"; throw e;
  }
  const p=object(session.profile);
  const permissions=new Set([
    ...array(session.permissionKeys),...array(session.permissions),
    ...array(session.allowedApps),...array(session.permissionGroups),
    ...array(p.permissionKeys),...array(p.allowedApps),...array(p.permissionGroups)
  ].map(x=>lower(typeof x==="string"?x:(x?.id||x?.key||x?.permission),160)).filter(Boolean));

  const all=lower(session.permissionPreset||p.permissionPreset,80)==="all" || permissions.has("system-admin");
  const inventory=permissions.has("inventory-control") || permissions.has("inventory");
  if(!all&&!inventory){
    const e=new Error("INVENTORY_ACCESS_DENIED"); e.code="INVENTORY_ACCESS_DENIED"; throw e;
  }
  if(write && !(all || inventory || session.canManage===true || p.canManage===true)){
    const e=new Error("INVENTORY_WRITE_ACCESS_DENIED"); e.code="INVENTORY_WRITE_ACCESS_DENIED"; throw e;
  }
  return session;
}

function actorId(session){return isUuid(session?.profile?.id)?session.profile.id:null}
function actorName(session){
  const p=object(session?.profile);
  return clean(p.displayName||p.fullName||p.preferredName||p.skId,200)||null;
}
async function audit(session,eventType,entityTable,entityId,message,payload={}){
  try{
    await restRequest({
      table:"master_inventory_audit",method:"POST",prefer:"return=minimal",
      body:{
        event_type:clean(eventType,120),
        domain:"INVENTORY_CONTROL",
        entity_table:clean(entityTable,180)||null,
        entity_id:clean(entityId,180)||null,
        source:"SKANDI_CORE_INVENTORY",
        message:clean(message,1000)||null,
        payload:object(payload),
        created_by_agent_user_id:actorId(session),
        created_by_name:actorName(session)
      }
    });
  }catch(error){console.warn("[SKANDI Inventory audit]",error)}
}

function normalizeMaster(row={}){
  return{
    id:clean(row.id,80),publicId:clean(row.public_id,180),entityType:upper(row.entity_type,40),
    code:clean(row.code,180),name:clean(row.name,300),slug:clean(row.slug,240),
    status:upper(row.status,40),active:row.active!==false,customerVisible:row.customer_visible===true,
    staffVisible:row.staff_visible!==false,alteaVisible:row.altea_visible!==false,
    featured:row.featured===true,homepageFeatured:row.homepage_featured===true,
    sortPriority:nullableNumber(row.sort_priority,{integer:true})??100,
    parentEntityId:clean(row.parent_entity_id,80),supplierEntityId:clean(row.supplier_entity_id,80),
    source:clean(row.source,120),sourceReference:clean(row.source_reference,800),
    details:object(row.details),commercial:object(row.commercial),operations:object(row.operations),
    seo:object(row.seo),publication:object(row.publication),payload:object(row.payload),
    sourceTable:"inventory_master_entities",sourceId:clean(row.id,80),
    createdAt:row.created_at||"",updatedAt:row.updated_at||""
  };
}
function normalizeCanonical(row={}){
  return{
    id:clean(row.id,100),publicId:clean(row.public_id,180),entityType:upper(row.entity_type,40),
    code:clean(row.code,180),name:clean(row.name,300),slug:clean(row.slug,240),
    status:upper(row.status,40),active:row.active!==false,customerVisible:row.customer_visible===true,
    staffVisible:row.staff_visible!==false,alteaVisible:row.altea_visible!==false,
    featured:row.featured===true,homepageFeatured:row.homepage_featured===true,
    sortPriority:nullableNumber(row.sort_priority,{integer:true})??100,
    parentEntityId:clean(row.parent_entity_id,80),
    details:object(row.details),commercial:object(row.commercial),operations:object(row.operations),
    seo:object(row.seo),publication:object(row.publication),payload:object(row.payload),
    localized:array(row.localized),media:array(row.media),relations:array(row.relations),
    sourceTable:clean(row.source_table,100),sourceId:clean(row.source_id||row.id,100),
    updatedAt:row.updated_at||""
  };
}
function normalizeCatalog(row={}){
  return{
    id:clean(row.id,80),targetEntityId:clean(row.target_entity_id,80),
    targetRecordType:upper(row.target_record_type,40),targetRecordId:clean(row.target_record_id,100),
    targetCode:clean(row.target_code,180),catalogType:upper(row.catalog_type||"NONE",80),
    partnerTier:upper(row.partner_tier,80),searchable:row.searchable===true,featured:row.featured===true,
    homepageFeatured:row.homepage_featured===true,searchPriority:nullableNumber(row.search_priority,{integer:true,min:0})??100,
    searchKeywords:array(row.search_keywords),marketCodes:array(row.market_codes),salesChannels:array(row.sales_channels),
    publicLabel:clean(row.public_label,300),badge:clean(row.badge,160),validFrom:clean(row.valid_from,20),
    validTo:clean(row.valid_to,20),notes:clean(row.notes,4000),active:row.active!==false
  };
}
function normalizeDated(row={}){
  return{
    id:clean(row.id,80),entityId:clean(row.entity_id,80),inventoryType:upper(row.inventory_type,80),
    serviceDate:clean(row.service_date,20),startTime:clean(row.start_time,20),endTime:clean(row.end_time,20),
    variantCode:clean(row.variant_code,120),variantName:clean(row.variant_name,240),
    capacityTotal:nullableNumber(row.capacity_total,{integer:true,min:0}),
    held:nullableNumber(row.held,{integer:true,min:0}),sold:nullableNumber(row.sold,{integer:true,min:0}),
    available:nullableNumber(row.available,{integer:true,min:0}),
    waitlistLimit:nullableNumber(row.waitlist_limit,{integer:true,min:0}),
    overbookingLimit:nullableNumber(row.overbooking_limit,{integer:true,min:0}),
    stopSale:row.stop_sale===true,blackout:row.blackout===true,status:upper(row.status,40),
    supplierCost:nullableNumber(row.supplier_cost),publicPrice:nullableNumber(row.public_price),
    adultPrice:nullableNumber(row.adult_price),childPrice:nullableNumber(row.child_price),
    infantPrice:nullableNumber(row.infant_price),privatePrice:nullableNumber(row.private_price),
    currency:upper(row.currency,8),priceBasis:upper(row.price_basis,40),
    bookingCutoffHours:nullableNumber(row.booking_cutoff_hours,{integer:true,min:0}),
    minStay:nullableNumber(row.min_stay,{integer:true,min:0}),maxStay:nullableNumber(row.max_stay,{integer:true,min:0}),
    releaseDays:nullableNumber(row.release_days,{integer:true,min:0}),
    supplierReference:clean(row.supplier_reference,500),payload:object(row.payload)
  };
}
function normalizeAirline(row={}){
  return{
    id:clean(row.ID||row["Record ID"],100),publicId:clean(row.ID||row["Record ID"],100),
    entityType:"AIRLINE",code:upper(row.iataCode,8),name:clean(row.Title||row.shortName,300),
    slug:clean(row.slug,240),status:upper(row.status||"PUBLISHED",40),active:row.active!==false,
    customerVisible:row.customer_visible!==false,staffVisible:row.staff_visible!==false,
    alteaVisible:row.altea_visible!==false,featured:row.featured===true,homepageFeatured:row.homepage_featured===true,
    sortPriority:nullableNumber(row.sort_order,{integer:true})??100,
    parentEntityId:"",source:clean(row.source,120),sourceReference:clean(row.source_reference,800),
    details:{
      ...object(row.inventory_details),icaoCode:upper(row.icaoCode,8),shortName:clean(row.shortName,160),
      alliance:clean(row.alliance,160),brandGroup:clean(row.brandGroup,160),
      country:clean(row.locationCountry,160),city:clean(row.locationCity,160),website:clean(row.website,1000),
      summary:clean(row.summary,8000)
    },
    commercial:object(row.commercial),operations:object(row.operations),seo:object(row.seo),
    publication:object(row.publication),payload:object(row.payload),
    sourceTable:"travel_info_airlines",sourceId:clean(row.ID,100),sourceRecord:row,
    createdAt:row["Created Date"]||"",updatedAt:row.updated_at||""
  };
}
function normalizeAirport(row={}){
  return{
    id:clean(row.ID,100),publicId:clean(row.ID,100),entityType:"AIRPORT",code:upper(row.iata,8),
    name:clean(row.title,300),slug:clean(row.slug,240),status:upper(row.status||"PUBLISHED",40),
    active:row.active!==false,customerVisible:row.customer_visible!==false,staffVisible:row.staff_visible!==false,
    alteaVisible:row.altea_visible!==false,featured:row.featured===true,homepageFeatured:row.homepage_featured===true,
    sortPriority:nullableNumber(row.sort_order??row.sortOrder,{integer:true})??100,parentEntityId:"",
    source:clean(row.source,120),sourceReference:clean(row.source_reference,800),
    details:{
      ...object(row.inventory_details),icaoCode:upper(row.icao,8),country:clean(row.country,160),
      city:clean(row.locationCity,160),timezone:clean(row.timezone,160),
      latitude:nullableNumber(row.latitude),longitude:nullableNumber(row.longitude),
      distanceToCityCenterKm:nullableNumber(row.distanceToCityCenterKm),
      website:clean(row.website,1000),summary:clean(row.summary,8000)
    },
    commercial:object(row.commercial),operations:object(row.operations),seo:object(row.seo),
    publication:object(row.publication),payload:object(row.payload),
    sourceTable:"travel_info_airports",sourceId:clean(row.ID,100),sourceRecord:row,
    createdAt:row.created_at||"",updatedAt:row.updated_at||""
  };
}

function normalizeAircraft(row={}){
  return{
    id:clean(row.id,80),airlineId:clean(row.airline_id,120),airlineCode:upper(row.airline_code,8),
    aircraftCode:upper(row.aircraft_code,80),aircraftName:clean(row.aircraft_name,240),
    manufacturer:clean(row.manufacturer,160),family:clean(row.family,160),variant:clean(row.variant,160),
    totalSeats:nullableNumber(row.total_seats,{integer:true,min:0}),configuration:object(row.configuration),
    displayTitle:clean(row.display_title,300),displaySummary:clean(row.display_summary,12000),
    heroImageUrl:clean(row.hero_image_url,2000),exteriorImageUrl:clean(row.exterior_image_url,2000),
    seatmapImageUrl:clean(row.seatmap_image_url,2000),thumbnailImageUrl:clean(row.thumbnail_image_url,2000),
    defaultCabinCode:upper(row.default_cabin_code,80),defaultViewType:upper(row.default_view_type||"CABIN",80),
    walkthroughTitle:clean(row.walkthrough_title,300),walkthroughSubtitle:clean(row.walkthrough_subtitle,1200),
    walkthroughStartSceneCode:clean(row.walkthrough_start_scene_code,120),
    walkthroughAccuracyLabel:clean(row.walkthrough_accuracy_label,300),
    sourceUrl:clean(row.source_url,2000),sourceUrls:array(row.source_urls),reviewNotes:clean(row.review_notes,12000),
    lastReviewed:clean(row.last_reviewed,20),status:upper(row.status||"DRAFT",40),
    customerVisible:row.customer_visible===true,staffVisible:row.staff_visible!==false,
    active:row.active!==false,sortOrder:nullableNumber(row.sort_order,{integer:true})??100,
    source:clean(row.source,120),sourceReference:clean(row.source_reference,500),
    createdAt:row.created_at||"",updatedAt:row.updated_at||""
  };
}
function normalizeCabin(row={}){
  return{
    id:clean(row.id,80),aircraftId:clean(row.aircraft_id,80),cabinCode:upper(row.cabin_code,80),
    cabinName:clean(row.cabin_name,240),rank:nullableNumber(row.rank,{integer:true})??100,
    seatCount:nullableNumber(row.seat_count,{integer:true,min:0}),summary:clean(row.summary,6000),
    description:clean(row.description,12000),mealTitle:clean(row.meal_title,300),
    mealDescription:clean(row.meal_description,8000),amenities:parseJson(row.amenities,[]),
    displaySettings:object(row.display_settings),active:row.active!==false,
    sortOrder:nullableNumber(row.sort_order,{integer:true})??100
  };
}

function canonicalCabinCode(label=""){
  const v=upper(label,160).replace(/[_-]+/g," ");
  if(/FIRST|LA PREMI/.test(v)) return "F";
  if(/BUSINESS|SIGNATURE CLASS|DELTA ONE|POLARIS|CLUB WORLD|ROYAL SILK/.test(v)) return "J";
  if(/PREMIUM|PLUS|COMFORT/.test(v) && !/BUSINESS/.test(v)) return "W";
  return "Y";
}
function cabinRank(code){return ({F:10,J:20,W:30,Y:40})[code]||100}
function templateCabins(configuration={}){
  const grouped=new Map();
  for(const [name,value] of Object.entries(object(configuration))){
    const seats=nullableNumber(value,{integer:true,min:0})||0;
    if(!name||!seats)continue;
    const code=canonicalCabinCode(name);
    const current=grouped.get(code)||{code,names:[],seatCount:0};
    current.names.push(clean(name,160)); current.seatCount+=seats; grouped.set(code,current);
  }
  return [...grouped.values()].map(x=>({
    cabinCode:x.code,cabinName:x.names.join(" + "),seatCount:x.seatCount,
    rank:cabinRank(x.code),sortOrder:cabinRank(x.code)
  }));
}
function inferManufacturer(name=""){
  if(/^Airbus\b/i.test(name))return"Airbus";
  if(/^Boeing\b/i.test(name))return"Boeing";
  if(/^Embraer\b/i.test(name))return"Embraer";
  if(/^ATR\b/i.test(name))return"ATR";
  return"";
}
function inferFamily(name=""){
  const m=clean(name,240).match(/\b(A2\d\d|A3\d\d|A220|A320|A321|A330|A340|A350|A380|737|747|757|767|777|787|E\d{3}|E-Jet|ATR\s?\d{2})\b/i);
  return m?upper(m[1],80):"";
}
function airlineTemplates(rows=[]){
  const out=[];
  for(const row of rows){
    const templates=parseJson(row.aircraftConfigurationsJson,[]);
    if(!Array.isArray(templates))continue;
    templates.forEach((t,index)=>{
      const aircraftCode=upper(t?.aircraftCode||t?.code,80);
      const aircraftName=clean(t?.aircraftName||t?.name,240);
      if(!aircraftCode||!aircraftName)return;
      out.push({
        airlineId:clean(row.ID,100),airlineCode:upper(row.iataCode,8),
        airlineName:clean(row.Title||row.shortName,240),aircraftCode,aircraftName,
        totalSeats:nullableNumber(t?.totalSeats??t?.total_seats,{integer:true,min:0}),
        configuration:object(t?.configuration),sourceUrl:clean(t?.sourceUrl||t?.source_url,2000),
        sourceUrls:array(t?.sourceUrls||t?.source_urls),notes:clean(t?.notes,12000),templateIndex:index
      });
    });
  }
  return out;
}
function aircraftTemplateKey(t={}){
  return [clean(t.airlineId,100),upper(t.aircraftCode,80),t.totalSeats??"",lower(t.aircraftName,240)].join("|");
}
function aircraftRowKey(a={}){
  return [clean(a.airline_id||a.airlineId,100),upper(a.aircraft_code||a.aircraftCode,80),a.total_seats??a.totalSeats??"",lower(a.aircraft_name||a.aircraftName,240)].join("|");
}
function syncHealth(airlines=[],aircraft=[]){
  const templates=airlineTemplates(airlines);
  const active=aircraft.filter(a=>a.active!==false&&upper(a.status,40)!=="ARCHIVED");
  const existing=new Set(active.map(aircraftRowKey));
  const templateSet=new Set(templates.map(aircraftTemplateKey));
  const missing=templates.filter(t=>!existing.has(aircraftTemplateKey(t)));
  const unmatched=active.filter(a=>!templateSet.has(aircraftRowKey(a)));
  return{
    fleetTemplates:templates.length,aircraftRecords:active.length,
    matched:templates.length-missing.length,missing:missing.length,manualOrUnmatched:unmatched.length,
    missingPreview:missing.slice(0,40).map(t=>({airlineCode:t.airlineCode,aircraftCode:t.aircraftCode,aircraftName:t.aircraftName,totalSeats:t.totalSeats}))
  };
}

async function supportedLanguages(){
  const rows=await select("inventory_localized_content",{select:"language",limit:"5000"});
  return [...new Set(["EN","SV","NO","DA",...rows.map(r=>upper(r.language,8)).filter(Boolean)])];
}
async function catalogRows(){
  return (await select("inventory_catalog_entries",{select:"*",order:"search_priority.asc",limit:"1000"})).map(normalizeCatalog);
}
function catalogForRecord(entries,record){
  return entries.find(e=>
    (record.sourceTable==="inventory_master_entities" && e.targetEntityId===record.id) ||
    (record.sourceTable!=="inventory_master_entities" &&
      e.targetRecordType===record.entityType && e.targetRecordId===record.id)
  ) || null;
}

export async function getInventoryBootstrapCore(input={}){
  const session=await requireInventoryAccess();
  const [canonical,sources,catalog,airlinesRaw,aircraftRaw,dated,flight,classes,schedule,nesting,languages]=await Promise.all([
    select("inventory_canonical_entities_v",{select:"*",order:"entity_type.asc,sort_priority.asc",limit:"3000"}),
    select("inventory_source_registry",{select:"*",active:"eq.true",limit:"250"}),
    catalogRows(),
    select("travel_info_airlines",{select:"*",active:"eq.true",order:"sort_order.asc",limit:"250"}),
    select("travel_info_aircraft",{select:"*",order:"airline_code.asc,sort_order.asc",limit:"1200"}),
    select("inventory_dated_inventory",{select:"*",order:"service_date.desc",limit:"1200"}),
    select("inventory_flight_legs",{select:"*",order:"departure_date.desc,flight_number.asc",limit:"800"}),
    select("inventory_flight_classes",{select:"*",order:"departure_date.desc,flight_number.asc,class_code.asc",limit:"1600"}),
    select("inventory_schedule_lines",{select:"*",order:"effective_date.desc,flight_number.asc",limit:"800"}),
    select("inventory_nesting_controls",{select:"*",order:"departure_date.desc,flight_number.asc,class_code.asc",limit:"1600"}),
    supportedLanguages()
  ]);
  const records=canonical.map(normalizeCanonical);
  const byType={};
  for(const r of records) byType[r.entityType]=(byType[r.entityType]||0)+1;

  const cabinRows=await select("travel_info_aircraft_cabins",{select:"aircraft_id,cabin_code,cabin_name,seat_count,active",active:"eq.true",limit:"3000"});
  const sums=new Map();
  for(const c of cabinRows) sums.set(clean(c.aircraft_id,80),(sums.get(clean(c.aircraft_id,80))||0)+(nullableNumber(c.seat_count,{integer:true})||0));
  const mismatches=aircraftRaw.filter(a=>a.active!==false && (nullableNumber(a.total_seats,{integer:true})||0)!==(sums.get(clean(a.id,80))||0)).length;

  return{
    ok:true,source:"SKANDI_INVENTORY_CORE",version:INVENTORY_CORE_VERSION,
    session:{
      profile:object(session.profile),accessRole:session.accessRole,permissionPreset:session.permissionPreset,
      permissionKeys:array(session.permissionKeys),allowedApps:array(session.allowedApps)
    },
    languages,records,catalog,sourceRegistry:sources,
    airlines:airlinesRaw.map(normalizeAirline),aircraft:aircraftRaw.map(normalizeAircraft),
    dated:dated.map(normalizeDated),air:{flight,classes,schedule,nesting},
    stats:{
      total:records.length,byType,aircraft:aircraftRaw.length,cabins:cabinRows.length,
      dated:dated.length,flightLegs:flight.length,flightClasses:classes.length,schedules:schedule.length,nesting:nesting.length,
      catalog:catalog.length,searchableCatalog:catalog.filter(c=>c.active&&c.searchable).length
    },
    quality:{aircraftSync:syncHealth(airlinesRaw,aircraftRaw),cabinSeatMismatches:mismatches}
  };
}

async function getMasterBundle(id){
  const row=(await select("inventory_master_entities",{select:"*",id:qeq(id),limit:"1"}))[0];
  if(!row)throw new Error("INVENTORY_RECORD_NOT_FOUND");
  const [localized,media,relations,catalog]=await Promise.all([
    select("inventory_localized_content",{select:"*",entity_id:qeq(id),order:"language.asc"}),
    select("inventory_media_assets",{select:"*",entity_id:qeq(id),order:"sort_order.asc"}),
    select("inventory_entity_relations",{select:"*",source_entity_id:qeq(id),order:"sequence_no.asc"}),
    select("inventory_catalog_entries",{select:"*",target_entity_id:qeq(id),limit:"1"})
  ]);
  return{record:normalizeMaster(row),localizedContent:localized,media,relations,catalog:catalog[0]?normalizeCatalog(catalog[0]):null};
}
async function getReferenceBundle(type,id){
  const isAirline=type==="AIRLINE";
  const table=isAirline?"travel_info_airlines":"travel_info_airports";
  const rows=await select(table,{select:"*",ID:qeq(id),limit:"1"});
  const raw=rows[0];
  if(!raw)throw new Error("INVENTORY_RECORD_NOT_FOUND");
  const record=isAirline?normalizeAirline(raw):normalizeAirport(raw);
  const relations=await select("inventory_entity_relations",{
    select:"*",source_record_type:qeq(type),source_record_id:qeq(id),order:"sequence_no.asc"
  });
  const cat=await select("inventory_catalog_entries",{
    select:"*",target_record_type:qeq(type),target_record_id:qeq(id),limit:"1"
  });
  const localizedContent=array(raw.localized_content);
  const media=array(raw.media_assets);
  return{record,localizedContent,media,relations,catalog:cat[0]?normalizeCatalog(cat[0]):null};
}

export async function getInventoryRecordCore(input={}){
  await requireInventoryAccess();
  const id=clean(input.id||input.entityId,100);
  let type=upper(input.entityType,40);
  if(!id)throw new Error("INVENTORY_ID_REQUIRED");
  if(type==="AIRCRAFT") return getAircraftRecordCore({aircraftId:id});
  if(MASTER_TYPES.has(type))return{ok:true,...await getMasterBundle(id)};
  if(REFERENCE_TYPES.has(type))return{ok:true,...await getReferenceBundle(type,id)};

  const canonical=(await select("inventory_canonical_entities_v",{select:"*",id:qeq(id),limit:"1"}))[0];
  if(!canonical)throw new Error("INVENTORY_RECORD_NOT_FOUND");
  type=upper(canonical.entity_type,40);
  if(MASTER_TYPES.has(type))return{ok:true,...await getMasterBundle(id)};
  if(REFERENCE_TYPES.has(type))return{ok:true,...await getReferenceBundle(type,id)};
  throw new Error("INVENTORY_RECORD_TYPE_UNSUPPORTED");
}

async function assertUniqueMaster(record){
  const type=upper(record.entityType||record.entity_type,40);
  const id=clean(record.id,80);
  const code=upper(record.code,180);
  const slug=lower(record.slug,240);
  const rows=await select("inventory_master_entities",{select:"id,entity_type,code,slug",entity_type:qeq(type),limit:"3000"});
  if(code && rows.some(r=>upper(r.code,180)===code && clean(r.id,80)!==id)) throw new Error("INVENTORY_DUPLICATE_CODE");
  if(slug && rows.some(r=>lower(r.slug,240)===slug && clean(r.id,80)!==id)) throw new Error("INVENTORY_DUPLICATE_SLUG");
}
async function assertNoHierarchyCycle(record){
  const id=clean(record.id,80), parent=clean(record.parentEntityId||record.parent_entity_id,80);
  if(!id||!parent)return;
  if(id===parent)throw new Error("INVENTORY_PARENT_CYCLE");
  const rows=await select("inventory_master_entities",{select:"id,parent_entity_id",limit:"3000"});
  const children=new Map();
  for(const r of rows){
    const p=clean(r.parent_entity_id,80);
    if(!p)continue;
    if(!children.has(p))children.set(p,[]);
    children.get(p).push(clean(r.id,80));
  }
  const stack=[id],seen=new Set();
  while(stack.length){
    const current=stack.pop();
    if(seen.has(current))continue;
    seen.add(current);
    for(const child of children.get(current)||[]){
      if(child===parent)throw new Error("INVENTORY_PARENT_CYCLE");
      stack.push(child);
    }
  }
}

function masterBody(record,session){
  const type=upper(record.entityType||record.entity_type,40);
  const code=upper(record.code,180);
  const name=clean(record.name,300);
  if(!MASTER_TYPES.has(type))throw new Error("INVENTORY_MASTER_TYPE_INVALID");
  if(!code||!name)throw new Error("INVENTORY_REQUIRED_FIELDS_MISSING");
  return{
    public_id:clean(record.publicId||record.public_id,180)||`${type.toLowerCase()}-${randomUUID()}`,
    entity_type:type,code,name,
    slug:clean(record.slug,240)||slugify(name),
    status:safeStatus(record.status),
    active:bool(record.active,true),
    customer_visible:bool(record.customerVisible??record.customer_visible,false),
    staff_visible:bool(record.staffVisible??record.staff_visible,true),
    altea_visible:bool(record.alteaVisible??record.altea_visible,true),
    featured:bool(record.featured,false),
    homepage_featured:bool(record.homepageFeatured??record.homepage_featured,false),
    sort_priority:nullableNumber(record.sortPriority??record.sort_priority,{integer:true,min:0})??100,
    parent_entity_id:isUuid(record.parentEntityId||record.parent_entity_id)?clean(record.parentEntityId||record.parent_entity_id,80):null,
    supplier_entity_id:isUuid(record.supplierEntityId||record.supplier_entity_id)?clean(record.supplierEntityId||record.supplier_entity_id,80):null,
    source:clean(record.source||"SKANDI",120),
    source_reference:clean(record.sourceReference||record.source_reference,800)||null,
    details:object(record.details),commercial:object(record.commercial),operations:object(record.operations),
    seo:object(record.seo),publication:object(record.publication),payload:object(record.payload),
    updated_by_agent_user_id:actorId(session)
    // Catalog/search fields are intentionally NOT written here.
  };
}

function referenceBody(type,record,catalog){
  const details=object(record.details), code=upper(record.code,8), name=clean(record.name,300);
  if(!code||!name)throw new Error("INVENTORY_REQUIRED_FIELDS_MISSING");
  const common={
    slug:clean(record.slug,240)||slugify(name),active:bool(record.active,true),
    status:safeStatus(record.status,"PUBLISHED"),
    customer_visible:bool(record.customerVisible??record.customer_visible,true),
    staff_visible:bool(record.staffVisible??record.staff_visible,true),
    altea_visible:bool(record.alteaVisible??record.altea_visible,true),
    featured:bool(record.featured,false),homepage_featured:bool(record.homepageFeatured??record.homepage_featured,false),
    source:clean(record.source||"SKANDI",120),source_reference:clean(record.sourceReference||record.source_reference,800)||null,
    inventory_details:details,commercial:object(record.commercial),operations:object(record.operations),
    seo:object(record.seo),publication:object(record.publication),payload:object(record.payload),
    localized_content:array(record.localizedContent),media_assets:array(record.media)
  };
  if(type==="AIRLINE"){
    return{
      ...common,Title:name,shortName:clean(details.shortName||name,160),
      iataCode:code,icaoCode:upper(details.icaoCode,8),alliance:clean(details.alliance,160)||null,
      brandGroup:clean(details.brandGroup,160)||null,locationCountry:clean(details.country,160)||null,
      locationCity:clean(details.city,160)||null,website:clean(details.website,1000)||null,
      summary:clean(details.summary,8000)||null,sort_order:nullableNumber(record.sortPriority,{integer:true,min:0})??100,
      published:safeStatus(record.status,"PUBLISHED")==="PUBLISHED",
      searchable:catalog?.searchable===true,
      collection_type:catalog?.catalogType&&catalog.catalogType!=="NONE"?catalog.catalogType:"NONE",
      partner_tier:catalog?.partnerTier||null,
      search_priority:catalog?.searchPriority??100,
      search_keywords:array(catalog?.searchKeywords)
    };
  }
  return{
    ...common,title:name,iata:code,icao:upper(details.icaoCode,8),country:clean(details.country,160)||null,
    locationCity:clean(details.city,160)||null,timezone:clean(details.timezone,160)||null,
    latitude:nullableNumber(details.latitude),longitude:nullableNumber(details.longitude),
    distanceToCityCenterKm:nullableNumber(details.distanceToCityCenterKm),
    website:clean(details.website,1000)||null,summary:clean(details.summary,8000)||null,
    sort_order:nullableNumber(record.sortPriority,{integer:true,min:0})??100,
    sortOrder:nullableNumber(record.sortPriority,{integer:true,min:0})??100,
    published:safeStatus(record.status,"PUBLISHED")==="PUBLISHED"
  };
}

function localizedBody(entityId,row={}){
  return{
    entity_id:entityId,language:upper(row.language||"EN",8),
    title:clean(row.title,500)||null,eyebrow:clean(row.eyebrow,300)||null,
    short_description:clean(row.shortDescription??row.short_description,8000)||null,
    full_description:clean(row.fullDescription??row.full_description,30000)||null,
    highlights:uniqueStrings(row.highlights),included:uniqueStrings(row.included),
    not_included:uniqueStrings(row.notIncluded??row.not_included),
    important_information:clean(row.importantInformation??row.important_information,16000)||null,
    seo_title:clean(row.seoTitle??row.seo_title,500)||null,
    seo_description:clean(row.seoDescription??row.seo_description,1000)||null,
    content:object(row.content)
  };
}
function mediaBody(entityId,row={},index=0){
  const role=upper(row.role||"GALLERY",80);
  return{
    entity_id:entityId,media_type:upper(row.mediaType??row.media_type??"IMAGE",40),
    url:clean(row.url,3000),alt_text:clean(row.altText??row.alt_text,1000)||null,
    caption:clean(row.caption,3000)||null,credit:clean(row.credit,500)||null,
    language:upper(row.language,8)||null,sort_order:nullableNumber(row.sortOrder??row.sort_order,{integer:true,min:0})??((index+1)*10),
    is_primary:role==="PRIMARY"||bool(row.isPrimary??row.is_primary,false),
    is_card:role==="CARD"||bool(row.isCard??row.is_card,false),
    is_hero:role==="HERO"||bool(row.isHero??row.is_hero,false),
    is_mobile:role==="MOBILE"||bool(row.isMobile??row.is_mobile,false),
    active:bool(row.active,true),payload:object(row.payload),role:MEDIA_ROLES.has(role)?role:"GALLERY",
    storage_bucket:clean(row.storageBucket??row.storage_bucket,180)||null,
    storage_path:clean(row.storagePath??row.storage_path,1000)||null,
    mime_type:clean(row.mimeType??row.mime_type,160)||null,
    file_size_bytes:nullableNumber(row.fileSizeBytes??row.file_size_bytes,{integer:true,min:0}),
    width_px:nullableNumber(row.widthPx??row.width_px,{integer:true,min:0}),
    height_px:nullableNumber(row.heightPx??row.height_px,{integer:true,min:0}),
    focal_x:nullableNumber(row.focalX??row.focal_x,{min:0,max:100}),
    focal_y:nullableNumber(row.focalY??row.focal_y,{min:0,max:100}),
    source_kind:upper(row.sourceKind??row.source_kind??"URL",40)
  };
}
function relationBody(record,row={},index=0){
  const isExternal=REFERENCE_TYPES.has(upper(record.entityType,40));
  const targetId=clean(row.targetEntityId??row.target_entity_id,80);
  const targetType=upper(row.targetRecordType??row.target_record_type,40);
  const targetRecordId=clean(row.targetRecordId??row.target_record_id,100);
  if(!targetId&&!targetRecordId)return null;
  const externalTarget=REFERENCE_TYPES.has(targetType);
  return{
    source_entity_id:isExternal?null:clean(record.id,80),
    source_record_type:isExternal?upper(record.entityType,40):null,
    source_record_id:isExternal?clean(record.id,100):null,
    target_entity_id:externalTarget?null:(isUuid(targetId)?targetId:null),
    target_record_type:externalTarget?targetType:null,
    target_record_id:externalTarget?(targetRecordId||targetId||null):null,
    relation_type:upper(row.relationType??row.relation_type??"RELATED",80),
    sequence_no:nullableNumber(row.sequenceNo??row.sequence_no,{integer:true,min:0})??((index+1)*10),
    active:bool(row.active,true),payload:object(row.payload)
  };
}
function catalogBody(record,row={}){
  const type=upper(record.entityType,40);
  const catalogType=upper(row.catalogType??row.catalog_type??"NONE",80);
  if(!CATALOG_TYPES.has(catalogType))throw new Error("INVENTORY_CATALOG_TYPE_INVALID");
  if(catalogType==="NONE")return null;
  const isExternal=REFERENCE_TYPES.has(type);
  return{
    target_entity_id:isExternal?null:clean(record.id,80),
    target_record_type:type,
    target_record_id:clean(record.id,100),
    target_code:upper(record.code,180),
    catalog_type:catalogType,partner_tier:upper(row.partnerTier??row.partner_tier,80)||null,
    searchable:bool(row.searchable,false),featured:bool(row.featured,false),
    homepage_featured:bool(row.homepageFeatured??row.homepage_featured,false),
    search_priority:nullableNumber(row.searchPriority??row.search_priority,{integer:true,min:0})??100,
    search_keywords:uniqueStrings(row.searchKeywords??row.search_keywords),
    market_codes:uniqueStrings(row.marketCodes??row.market_codes).map(x=>upper(x,20)),
    sales_channels:uniqueStrings(row.salesChannels??row.sales_channels).map(x=>upper(x,40)),
    public_label:clean(row.publicLabel??row.public_label,300)||null,
    badge:clean(row.badge,160)||null,valid_from:clean(row.validFrom??row.valid_from,20)||null,
    valid_to:clean(row.validTo??row.valid_to,20)||null,notes:clean(row.notes,4000)||null,
    active:bool(row.active,true)
  };
}

async function saveCatalog(session,record,catalogInput){
  const type=upper(record.entityType,40), id=clean(record.id,100);
  const query=REFERENCE_TYPES.has(type)
    ? {target_record_type:qeq(type),target_record_id:qeq(id),limit:"1"}
    : {target_entity_id:qeq(id),limit:"1"};
  const existing=(await select("inventory_catalog_entries",{select:"*",...query}))[0];
  const body=catalogBody(record,catalogInput||{catalogType:"NONE"});
  if(!body){
    if(existing?.id) await restRequest({table:"inventory_catalog_entries",method:"DELETE",query:{id:qeq(existing.id)},prefer:"return=minimal"});
    return null;
  }
  body.updated_by_agent_user_id=actorId(session);
  let saved;
  if(existing?.id){
    saved=(await restRequest({table:"inventory_catalog_entries",method:"PATCH",query:{id:qeq(existing.id)},body,prefer:"return=representation"}))?.[0];
  }else{
    body.created_by_agent_user_id=actorId(session);
    saved=(await restRequest({table:"inventory_catalog_entries",method:"POST",body,prefer:"return=representation"}))?.[0];
  }
  return saved?normalizeCatalog(saved):normalizeCatalog(body);
}

async function syncMasterChildren(session,record,bundle){
  const entityId=clean(record.id,80);
  if(Array.isArray(bundle.localizedContent)){
    const existing=await select("inventory_localized_content",{select:"id,language",entity_id:qeq(entityId),limit:"100"});
    const byLang=new Map(existing.map(r=>[upper(r.language,8),r]));
    for(const item of bundle.localizedContent){
      const body=localizedBody(entityId,item), old=byLang.get(body.language);
      if(old?.id)await restRequest({table:"inventory_localized_content",method:"PATCH",query:{id:qeq(old.id)},body,prefer:"return=representation"});
      else await restRequest({table:"inventory_localized_content",method:"POST",body,prefer:"return=representation"});
    }
  }
  if(Array.isArray(bundle.media)){
    const existing=await select("inventory_media_assets",{select:"id",entity_id:qeq(entityId),limit:"500"});
    const keep=new Set();
    for(let i=0;i<bundle.media.length;i++){
      const item=bundle.media[i],body=mediaBody(entityId,item,i);
      if(!body.url)continue;
      const id=clean(item.id,80);
      if(id){
        keep.add(id);
        await restRequest({table:"inventory_media_assets",method:"PATCH",query:{id:qeq(id)},body,prefer:"return=representation"});
      }else{
        const saved=(await restRequest({table:"inventory_media_assets",method:"POST",body,prefer:"return=representation"}))?.[0];
        if(saved?.id)keep.add(saved.id);
      }
    }
    for(const old of existing)if(!keep.has(clean(old.id,80))){
      await restRequest({table:"inventory_media_assets",method:"PATCH",query:{id:qeq(old.id)},body:{active:false},prefer:"return=minimal"});
    }
  }
  if(Array.isArray(bundle.relations)){
    const existing=await select("inventory_entity_relations",{select:"id",source_entity_id:qeq(entityId),limit:"500"});
    for(const old of existing) await restRequest({table:"inventory_entity_relations",method:"DELETE",query:{id:qeq(old.id)},prefer:"return=minimal"});
    const rows=bundle.relations.map((x,i)=>relationBody(record,x,i)).filter(Boolean);
    if(rows.length)await restRequest({table:"inventory_entity_relations",method:"POST",body:rows,prefer:"return=representation"});
  }
  const catalog=await saveCatalog(session,record,bundle.catalog);
  // Compatibility editorial flags mirror catalog featured state, while search merchandising remains catalog-owned.
  const featured=catalog?.featured===true||catalog?.homepageFeatured===true;
  const home=catalog?.homepageFeatured===true;
  await restRequest({table:"inventory_master_entities",method:"PATCH",query:{id:qeq(entityId)},body:{featured,homepage_featured:home,updated_by_agent_user_id:actorId(session)},prefer:"return=minimal"});
  return catalog;
}

async function syncReferenceChildren(session,record,bundle){
  const type=upper(record.entityType,40), id=clean(record.id,100);
  const sourceTable=type==="AIRLINE"?"travel_info_airlines":"travel_info_airports";
  if(Array.isArray(bundle.relations)){
    const existing=await select("inventory_entity_relations",{select:"id",source_record_type:qeq(type),source_record_id:qeq(id),limit:"500"});
    for(const old of existing)await restRequest({table:"inventory_entity_relations",method:"DELETE",query:{id:qeq(old.id)},prefer:"return=minimal"});
    const rows=bundle.relations.map((x,i)=>relationBody(record,x,i)).filter(Boolean);
    if(rows.length)await restRequest({table:"inventory_entity_relations",method:"POST",body:rows,prefer:"return=representation"});
  }
  const catalog=await saveCatalog(session,record,bundle.catalog);
  const patch={
    localized_content:Array.isArray(bundle.localizedContent)?bundle.localizedContent:array(record.localizedContent),
    media_assets:Array.isArray(bundle.media)?bundle.media:array(record.media),
    featured:catalog?.featured===true||catalog?.homepageFeatured===true,
    homepage_featured:catalog?.homepageFeatured===true
  };
  if(type==="AIRLINE"){
    patch.searchable=catalog?.searchable===true;
    patch.collection_type=catalog?.catalogType||"NONE";
    patch.partner_tier=catalog?.partnerTier||null;
    patch.search_priority=catalog?.searchPriority??100;
    patch.search_keywords=array(catalog?.searchKeywords);
  }
  await restRequest({table:sourceTable,method:"PATCH",query:{ID:qeq(id)},body:patch,prefer:"return=minimal"});
  return catalog;
}


async function snapshotBundleForRollback(recordInput={}){
  const type=upper(recordInput.entityType||recordInput.entity_type,40);
  const id=clean(recordInput.id,100);
  if(!id)return{type,id:"",created:true};

  if(MASTER_TYPES.has(type)){
    const primary=(await select("inventory_master_entities",{select:"*",id:qeq(id),limit:"1"}))[0]||null;
    const [localized,media,relations,catalog]=await Promise.all([
      select("inventory_localized_content",{select:"*",entity_id:qeq(id),limit:"500"}),
      select("inventory_media_assets",{select:"*",entity_id:qeq(id),limit:"1000"}),
      select("inventory_entity_relations",{select:"*",source_entity_id:qeq(id),limit:"1000"}),
      select("inventory_catalog_entries",{select:"*",target_entity_id:qeq(id),limit:"50"})
    ]);
    return{type,id,created:!primary,primary,localized,media,relations,catalog};
  }

  if(REFERENCE_TYPES.has(type)){
    const table=type==="AIRLINE"?"travel_info_airlines":"travel_info_airports";
    const primary=(await select(table,{select:"*",ID:qeq(id),limit:"1"}))[0]||null;
    const [relations,catalog]=await Promise.all([
      select("inventory_entity_relations",{select:"*",source_record_type:qeq(type),source_record_id:qeq(id),limit:"1000"}),
      select("inventory_catalog_entries",{select:"*",target_record_type:qeq(type),target_record_id:qeq(id),limit:"50"})
    ]);
    return{type,id,created:!primary,table,primary,relations,catalog};
  }

  return{type,id,created:false};
}

async function restoreRows(table,currentQuery,rows=[]){
  const current=await select(table,{select:"id",...currentQuery,limit:"2000"});
  for(const row of current){
    if(row?.id)await restRequest({table,method:"DELETE",query:{id:qeq(row.id)},prefer:"return=minimal"});
  }
  if(rows.length){
    await restRequest({table,method:"POST",body:rows,prefer:"return=minimal"});
  }
}

async function compensateBundleSave(snapshot,savedRecord=null){
  try{
    const type=upper(snapshot?.type,40);
    const newId=clean(savedRecord?.id,100);

    if(snapshot?.created){
      if(!newId)return;
      if(MASTER_TYPES.has(type)){
        await restRequest({table:"inventory_master_entities",method:"DELETE",query:{id:qeq(newId)},prefer:"return=minimal"});
      }else if(REFERENCE_TYPES.has(type)){
        const table=type==="AIRLINE"?"travel_info_airlines":"travel_info_airports";
        await restRequest({table,method:"DELETE",query:{ID:qeq(newId)},prefer:"return=minimal"});
      }
      return;
    }

    const id=clean(snapshot?.id,100);
    if(!id||!snapshot?.primary)return;

    if(MASTER_TYPES.has(type)){
      const primary=stripImmutable(snapshot.primary);
      await restRequest({table:"inventory_master_entities",method:"PATCH",query:{id:qeq(id)},body:primary,prefer:"return=minimal"});
      await restoreRows("inventory_localized_content",{entity_id:qeq(id)},array(snapshot.localized));
      await restoreRows("inventory_media_assets",{entity_id:qeq(id)},array(snapshot.media));
      await restoreRows("inventory_entity_relations",{source_entity_id:qeq(id)},array(snapshot.relations));
      await restoreRows("inventory_catalog_entries",{target_entity_id:qeq(id)},array(snapshot.catalog));
      return;
    }

    if(REFERENCE_TYPES.has(type)){
      const table=type==="AIRLINE"?"travel_info_airlines":"travel_info_airports";
      const primary={...snapshot.primary};
      delete primary.ID;
      delete primary.created_at;
      delete primary.updated_at;
      delete primary["Created Date"];
      delete primary["Record ID"];
      await restRequest({table,method:"PATCH",query:{ID:qeq(id)},body:primary,prefer:"return=minimal"});
      await restoreRows("inventory_entity_relations",{source_record_type:qeq(type),source_record_id:qeq(id)},array(snapshot.relations));
      await restoreRows("inventory_catalog_entries",{target_record_type:qeq(type),target_record_id:qeq(id)},array(snapshot.catalog));
    }
  }catch(error){
    console.error("[SKANDI Inventory] Compensating rollback failed.",error);
  }
}

async function savePrimary(session,bundle){
  const r=object(bundle.record),type=upper(r.entityType||r.entity_type,40);
  if(MASTER_TYPES.has(type)){
    await assertUniqueMaster(r);await assertNoHierarchyCycle(r);
    const id=clean(r.id,80),body=masterBody(r,session);
    if(id){
      const saved=(await restRequest({table:"inventory_master_entities",method:"PATCH",query:{id:qeq(id)},body,prefer:"return=representation"}))?.[0];
      return normalizeMaster(saved||{...body,id});
    }
    body.created_by_agent_user_id=actorId(session);
    const saved=(await restRequest({table:"inventory_master_entities",method:"POST",body,prefer:"return=representation"}))?.[0];
    if(!saved?.id)throw new Error("INVENTORY_CREATE_FAILED");
    return normalizeMaster(saved);
  }
  if(REFERENCE_TYPES.has(type)){
    const isAirline=type==="AIRLINE",table=isAirline?"travel_info_airlines":"travel_info_airports";
    const id=clean(r.id,100)||(isAirline?randomUUID():"");
    const record={...r,id,localizedContent:bundle.localizedContent,media:bundle.media};
    const preCatalog=bundle.catalog?normalizeCatalog(bundle.catalog):null;
    const body=referenceBody(type,record,preCatalog);
    if(id){
      const exists=(await select(table,{select:"ID",ID:qeq(id),limit:"1"}))[0];
      if(exists){
        const saved=(await restRequest({table,method:"PATCH",query:{ID:qeq(id)},body,prefer:"return=representation"}))?.[0];
        return isAirline?normalizeAirline(saved||{...body,ID:id}):normalizeAirport(saved||{...body,ID:id});
      }
    }
    if(isAirline)body.ID=id||randomUUID();
    const saved=(await restRequest({table,method:"POST",body,prefer:"return=representation"}))?.[0];
    if(!saved?.ID)throw new Error("INVENTORY_CREATE_FAILED");
    return isAirline?normalizeAirline(saved):normalizeAirport(saved);
  }
  throw new Error("INVENTORY_RECORD_TYPE_UNSUPPORTED");
}

export async function saveInventoryBundleCore(input={}){
  const session=await requireInventoryAccess({write:true});
  const bundle=object(input.bundle||input);
  const type=upper(bundle?.record?.entityType||bundle?.record?.entity_type,40);
  if(!MASTER_TYPES.has(type)&&!REFERENCE_TYPES.has(type))throw new Error("INVENTORY_RECORD_TYPE_UNSUPPORTED");

  const rollback=await snapshotBundleForRollback(bundle.record);
  let record=null;

  try{
    // One public server operation owns the complete save. If a later child/catalog
    // write fails, the previous state is restored before the error returns.
    record=await savePrimary(session,bundle);
    const normalizedBundle={...bundle,record};
    const catalog=MASTER_TYPES.has(type)
      ? await syncMasterChildren(session,record,normalizedBundle)
      : await syncReferenceChildren(session,record,normalizedBundle);

    await audit(session,"INVENTORY_BUNDLE_SAVED",record.sourceTable,record.id,`${type} ${record.code} saved.`,{
      status:record.status,catalogType:catalog?.catalogType||"NONE"
    });

    return{ok:true,bundle:{...(await getInventoryRecordCore({id:record.id,entityType:type})),catalog}};
  }catch(error){
    await compensateBundleSave(rollback,record);
    await audit(session,"INVENTORY_BUNDLE_ROLLED_BACK",record?.sourceTable||type,record?.id||rollback?.id||null,
      `Inventory save was rolled back: ${clean(error?.message||error,500)}`,{type});
    throw error;
  }
}

export async function archiveInventoryRecordCore(input={}){
  const session=await requireInventoryAccess({write:true});
  const id=clean(input.id,100),type=upper(input.entityType,40);
  if(!id)throw new Error("INVENTORY_ID_REQUIRED");
  if(MASTER_TYPES.has(type)){
    await restRequest({table:"inventory_master_entities",method:"PATCH",query:{id:qeq(id)},body:{status:"ARCHIVED",active:false,customer_visible:false,updated_by_agent_user_id:actorId(session)},prefer:"return=minimal"});
  }else if(REFERENCE_TYPES.has(type)){
    const table=type==="AIRLINE"?"travel_info_airlines":"travel_info_airports";
    await restRequest({table,method:"PATCH",query:{ID:qeq(id)},body:{status:"ARCHIVED",active:false,customer_visible:false},prefer:"return=minimal"});
  }else throw new Error("INVENTORY_RECORD_TYPE_UNSUPPORTED");
  await audit(session,"INVENTORY_RECORD_ARCHIVED",type,id,`${type} record archived.`,{});
  return{ok:true,id,type};
}

export async function getDatedInventoryCore(input={}){
  await requireInventoryAccess();
  const entityId=clean(input.entityId,80);
  const query={select:"*",order:"service_date.asc",limit:"1200"};
  if(entityId)query.entity_id=qeq(entityId);
  const rows=await select("inventory_dated_inventory",query);
  return{ok:true,inventory:rows.map(normalizeDated)};
}
export async function saveDatedInventoryCore(input={}){
  const session=await requireInventoryAccess({write:true});
  const r=object(input.row||input),id=clean(r.id,80),entityId=clean(r.entityId??r.entity_id,80);
  const serviceDate=clean(r.serviceDate??r.service_date,20);
  if(!isUuid(entityId)||!serviceDate)throw new Error("DATED_INVENTORY_INPUT_INVALID");
  const cap=nullableNumber(r.capacityTotal??r.capacity_total,{integer:true,min:0});
  const held=nullableNumber(r.held,{integer:true,min:0});
  const sold=nullableNumber(r.sold,{integer:true,min:0});
  const over=nullableNumber(r.overbookingLimit??r.overbooking_limit,{integer:true,min:0});
  const available=cap===null?null:Math.max(cap+(over||0)-(held||0)-(sold||0),0);
  let status=upper(r.status||"OPEN",40);
  if(bool(r.blackout,false))status="BLACKOUT";
  else if(bool(r.stopSale??r.stop_sale,false))status="STOP_SALE";
  else if(cap!==null&&available===0)status="SOLD_OUT";
  const body={
    entity_id:entityId,inventory_type:upper(r.inventoryType??r.inventory_type??"GENERAL",80),
    service_date:serviceDate,start_time:clean(r.startTime??r.start_time,20)||null,end_time:clean(r.endTime??r.end_time,20)||null,
    variant_code:clean(r.variantCode??r.variant_code,120)||null,variant_name:clean(r.variantName??r.variant_name,240)||null,
    capacity_total:cap,held,sold,available,
    waitlist_limit:nullableNumber(r.waitlistLimit??r.waitlist_limit,{integer:true,min:0}),
    overbooking_limit:over,stop_sale:bool(r.stopSale??r.stop_sale,false),blackout:bool(r.blackout,false),status,
    supplier_cost:nullableNumber(r.supplierCost??r.supplier_cost),public_price:nullableNumber(r.publicPrice??r.public_price),
    adult_price:nullableNumber(r.adultPrice??r.adult_price),child_price:nullableNumber(r.childPrice??r.child_price),
    infant_price:nullableNumber(r.infantPrice??r.infant_price),private_price:nullableNumber(r.privatePrice??r.private_price),
    currency:upper(r.currency||"USD",8),price_basis:upper(r.priceBasis??r.price_basis??"PER_PERSON",40),
    booking_cutoff_hours:nullableNumber(r.bookingCutoffHours??r.booking_cutoff_hours,{integer:true,min:0}),
    min_stay:nullableNumber(r.minStay??r.min_stay,{integer:true,min:0}),max_stay:nullableNumber(r.maxStay??r.max_stay,{integer:true,min:0}),
    release_days:nullableNumber(r.releaseDays??r.release_days,{integer:true,min:0}),
    supplier_reference:clean(r.supplierReference??r.supplier_reference,500)||null,payload:object(r.payload),
    updated_by_agent_user_id:actorId(session)
  };
  let saved;
  if(id)saved=(await restRequest({table:"inventory_dated_inventory",method:"PATCH",query:{id:qeq(id)},body,prefer:"return=representation"}))?.[0];
  else{
    body.created_by_agent_user_id=actorId(session);
    saved=(await restRequest({table:"inventory_dated_inventory",method:"POST",body,prefer:"return=representation"}))?.[0];
  }
  await audit(session,id?"DATED_INVENTORY_UPDATED":"DATED_INVENTORY_CREATED","inventory_dated_inventory",saved?.id||id,"Dated inventory saved.",{entityId,serviceDate});
  return{ok:true,item:normalizeDated(saved||body)};
}
export async function deleteDatedInventoryCore(input={}){
  const session=await requireInventoryAccess({write:true});
  const id=clean(input.id,80);if(!id)throw new Error("DATED_INVENTORY_ID_REQUIRED");
  await restRequest({table:"inventory_dated_inventory",method:"DELETE",query:{id:qeq(id)},prefer:"return=minimal"});
  await audit(session,"DATED_INVENTORY_DELETED","inventory_dated_inventory",id,"Dated inventory row deleted.",{});
  return{ok:true,id};
}

export async function getAirInventoryCore(input={}){
  await requireInventoryAccess();
  const f=upper(input.flightNumber,20),date=clean(input.departureDate,20),board=upper(input.boardPoint,8),off=upper(input.offPoint,8),season=upper(input.seasonCode,40);
  const common={};
  if(f)common.flight_number=qeq(f);if(date)common.departure_date=qeq(date);if(board)common.board_point=qeq(board);if(off)common.off_point=qeq(off);
  const [flight,classes,schedule,nesting]=await Promise.all([
    select("inventory_flight_legs",{select:"*",...common,order:"departure_date.desc,flight_number.asc",limit:"800"}),
    select("inventory_flight_classes",{select:"*",...common,order:"departure_date.desc,flight_number.asc,class_code.asc",limit:"1600"}),
    select("inventory_schedule_lines",{select:"*",...(f?{flight_number:qeq(f)}:{}),...(board?{board_point:qeq(board)}:{}),...(off?{off_point:qeq(off)}:{}),...(season?{season_code:qeq(season)}:{}),order:"effective_date.desc,flight_number.asc",limit:"800"}),
    select("inventory_nesting_controls",{select:"*",...common,order:"departure_date.desc,flight_number.asc,class_code.asc",limit:"1600"})
  ]);
  return{ok:true,flight,classes,schedule,nesting};
}
export async function saveAirInventoryRowCore(input={}){
  const session=await requireInventoryAccess({write:true});
  const kind=clean(input.kind,20),spec=AIR_TABLES[kind];
  if(!spec)throw new Error("AIR_INVENTORY_KIND_INVALID");
  const item=object(input.item),id=clean(item.id,80),body=pick(item,spec.allowed);
  for(const field of spec.required)if(!clean(body[field],180))throw new Error(`AIR_INVENTORY_${upper(field)}_REQUIRED`);
  const numberFields=new Set(["physical_capacity","yield_index","authorized","sold","available","waitlist_limit","overbooking_limit","protection","capacity","nest","bid_price","hurdle","min_stay"]);
  for(const field of numberFields)if(field in body)body[field]=nullableNumber(body[field],{min:0});
  if(body.board_point)body.board_point=upper(body.board_point,8);
  if(body.off_point)body.off_point=upper(body.off_point,8);
  if(body.flight_number)body.flight_number=upper(body.flight_number,20);
  if(body.class_code)body.class_code=upper(body.class_code,8);
  if(body.cabin)body.cabin=upper(body.cabin,20);
  if(body.status)body.status=upper(body.status,40);
  if(body.payload!==undefined)body.payload=object(body.payload);
  let saved;
  if(id)saved=(await restRequest({table:spec.table,method:"PATCH",query:{id:qeq(id)},body,prefer:"return=representation"}))?.[0];
  else{
    body.created_by_agent_user_id=actorId(session);
    saved=(await restRequest({table:spec.table,method:"POST",body,prefer:"return=representation"}))?.[0];
  }
  await audit(session,"AIR_INVENTORY_SAVED",spec.table,saved?.id||id,`${kind} record saved.`,{});
  return{ok:true,kind,item:saved||body};
}

async function aircraftBundle(id){
  const a=(await select("travel_info_aircraft",{select:"*",id:qeq(id),limit:"1"}))[0];
  if(!a)return null;
  const [cabins,views,scenes]=await Promise.all([
    select("travel_info_aircraft_cabins",{select:"*",aircraft_id:qeq(id),order:"sort_order.asc"}),
    select("travel_info_aircraft_views",{select:"*",aircraft_id:qeq(id),order:"sort_order.asc"}),
    select("travel_info_aircraft_walk_scenes",{select:"*",aircraft_id:qeq(id),order:"sort_order.asc"})
  ]);
  const viewIds=views.map(v=>v.id).filter(Boolean),sceneIds=scenes.map(v=>v.id).filter(Boolean);
  const [hotspots,sceneHotspots]=await Promise.all([
    viewIds.length?select("travel_info_aircraft_hotspots",{select:"*",view_id:`in.(${viewIds.join(",")})`,order:"sort_order.asc"}):[],
    sceneIds.length?select("travel_info_aircraft_scene_hotspots",{select:"*",scene_id:`in.(${sceneIds.join(",")})`,order:"sort_order.asc"}):[]
  ]);
  return{aircraft:normalizeAircraft(a),cabins:cabins.map(normalizeCabin),views,hotspots,scenes,sceneHotspots};
}
export async function getAircraftBootstrapCore(){
  await requireInventoryAccess();
  const [airlines,aircraft]=await Promise.all([
    select("travel_info_airlines",{select:"*",active:"eq.true",order:"sort_order.asc",limit:"250"}),
    select("travel_info_aircraft",{select:"*",order:"airline_code.asc,sort_order.asc",limit:"1200"})
  ]);
  return{ok:true,version:INVENTORY_CORE_VERSION,airlines:airlines.map(normalizeAirline),aircraft:aircraft.map(normalizeAircraft),sync:syncHealth(airlines,aircraft)};
}
export async function getAircraftRecordCore(input={}){
  await requireInventoryAccess();
  const id=clean(input.aircraftId||input.id,80);if(!id)throw new Error("AIRCRAFT_ID_REQUIRED");
  const bundle=await aircraftBundle(id);if(!bundle)throw new Error("AIRCRAFT_NOT_FOUND");
  return{ok:true,...bundle};
}
export async function saveAircraftCore(input={}){
  const session=await requireInventoryAccess({write:true});
  const a=object(input.aircraft||input),id=clean(a.id,80);
  const airlineId=clean(a.airlineId??a.airline_id,120),airlineCode=upper(a.airlineCode??a.airline_code,8);
  const code=upper(a.aircraftCode??a.aircraft_code,80),name=clean(a.aircraftName??a.aircraft_name,240);
  if(!airlineId||!airlineCode||!code||!name)throw new Error("AIRCRAFT_REQUIRED_FIELDS_MISSING");
  const body={
    airline_id:airlineId,airline_code:airlineCode,aircraft_code:code,aircraft_name:name,
    manufacturer:clean(a.manufacturer,160)||null,family:clean(a.family,160)||null,variant:clean(a.variant,160)||null,
    total_seats:nullableNumber(a.totalSeats??a.total_seats,{integer:true,min:0}),
    configuration:object(a.configuration),display_title:clean(a.displayTitle??a.display_title,300)||null,
    display_summary:clean(a.displaySummary??a.display_summary,12000)||null,
    hero_image_url:clean(a.heroImageUrl??a.hero_image_url,2000)||null,
    exterior_image_url:clean(a.exteriorImageUrl??a.exterior_image_url,2000)||null,
    seatmap_image_url:clean(a.seatmapImageUrl??a.seatmap_image_url,2000)||null,
    thumbnail_image_url:clean(a.thumbnailImageUrl??a.thumbnail_image_url,2000)||null,
    default_cabin_code:upper(a.defaultCabinCode??a.default_cabin_code,80)||null,
    default_view_type:upper(a.defaultViewType??a.default_view_type??"CABIN",80),
    walkthrough_title:clean(a.walkthroughTitle??a.walkthrough_title,300)||null,
    walkthrough_subtitle:clean(a.walkthroughSubtitle??a.walkthrough_subtitle,1200)||null,
    walkthrough_start_scene_code:clean(a.walkthroughStartSceneCode??a.walkthrough_start_scene_code,120)||null,
    walkthrough_accuracy_label:clean(a.walkthroughAccuracyLabel??a.walkthrough_accuracy_label,300)||null,
    source_url:clean(a.sourceUrl??a.source_url,2000)||null,source_urls:uniqueStrings(a.sourceUrls??a.source_urls),
    review_notes:clean(a.reviewNotes??a.review_notes,12000)||null,last_reviewed:clean(a.lastReviewed??a.last_reviewed,20)||null,
    status:safeStatus(a.status),customer_visible:bool(a.customerVisible??a.customer_visible,false),
    staff_visible:bool(a.staffVisible??a.staff_visible,true),active:bool(a.active,true),
    sort_order:nullableNumber(a.sortOrder??a.sort_order,{integer:true,min:0})??100,
    source:clean(a.source||"INVENTORY_CONTROL",120),source_reference:clean(a.sourceReference??a.source_reference,500)||null
  };
  let saved;
  if(id)saved=(await restRequest({table:"travel_info_aircraft",method:"PATCH",query:{id:qeq(id)},body,prefer:"return=representation"}))?.[0];
  else saved=(await restRequest({table:"travel_info_aircraft",method:"POST",body,prefer:"return=representation"}))?.[0];
  await audit(session,id?"AIRCRAFT_UPDATED":"AIRCRAFT_CREATED","travel_info_aircraft",saved?.id||id,`${airlineCode} ${code} aircraft saved.`,{});
  return{ok:true,aircraft:normalizeAircraft(saved||{...body,id})};
}
export async function archiveAircraftCore(input={}){
  const session=await requireInventoryAccess({write:true});
  const id=clean(input.aircraftId||input.id,80);if(!id)throw new Error("AIRCRAFT_ID_REQUIRED");
  await restRequest({table:"travel_info_aircraft",method:"PATCH",query:{id:qeq(id)},body:{status:"ARCHIVED",active:false,customer_visible:false,staff_visible:false},prefer:"return=minimal"});
  await audit(session,"AIRCRAFT_ARCHIVED","travel_info_aircraft",id,"Aircraft archived.",{});
  return{ok:true,id};
}
function aircraftChildBody(kind,item={}){
  const spec=AIRCRAFT_CHILDREN[kind];if(!spec)throw new Error("AIRCRAFT_CHILD_KIND_INVALID");
  const aliases={
    aircraft_id:item.aircraft_id??item.aircraftId,cabin_id:item.cabin_id??item.cabinId,
    view_id:item.view_id??item.viewId,scene_id:item.scene_id??item.sceneId,
    cabin_code:upper(item.cabin_code??item.cabinCode,80),cabin_name:clean(item.cabin_name??item.cabinName,240),
    rank:nullableNumber(item.rank,{integer:true,min:0}),seat_count:nullableNumber(item.seat_count??item.seatCount,{integer:true,min:0}),
    summary:clean(item.summary,6000)||null,description:clean(item.description,12000)||null,
    meal_title:clean(item.meal_title??item.mealTitle,300)||null,meal_description:clean(item.meal_description??item.mealDescription,8000)||null,
    amenities:item.amenities!==undefined?item.amenities:[],display_settings:object(item.display_settings??item.displaySettings),
    view_code:upper(item.view_code??item.viewCode,120),label:clean(item.label,300),view_type:upper(item.view_type??item.viewType??"CABIN",80),
    image_url:clean(item.image_url??item.imageUrl,2000),mobile_image_url:clean(item.mobile_image_url??item.mobileImageUrl,2000)||null,
    thumbnail_url:clean(item.thumbnail_url??item.thumbnailUrl,2000)||null,alt_text:clean(item.alt_text??item.altText,1000)||null,
    caption:clean(item.caption,3000)||null,credit:clean(item.credit,500)||null,is_default:bool(item.is_default??item.isDefault,false),
    hotspot_code:upper(item.hotspot_code??item.hotspotCode,120),title:clean(item.title,300)||null,
    x:nullableNumber(item.x,{min:0,max:100})??50,y:nullableNumber(item.y,{min:0,max:100})??50,
    action:upper(item.action||"DETAIL",80),focus_x:nullableNumber(item.focus_x??item.focusX,{min:0,max:100}),
    focus_y:nullableNumber(item.focus_y??item.focusY,{min:0,max:100}),focus_zoom:nullableNumber(item.focus_zoom??item.focusZoom,{min:1,max:5}),
    target_cabin_code:upper(item.target_cabin_code??item.targetCabinCode,80)||null,
    scene_code:upper(item.scene_code??item.sceneCode,120),short_title:clean(item.short_title??item.shortTitle,160)||null,
    forward_scene_code:upper(item.forward_scene_code??item.forwardSceneCode,120)||null,back_scene_code:upper(item.back_scene_code??item.backSceneCode,120)||null,
    forward_label:clean(item.forward_label??item.forwardLabel,160)||null,back_label:clean(item.back_label??item.backLabel,160)||null,
    hotspot_type:upper(item.hotspot_type??item.hotspotType??"FEATURE",80),
    active:bool(item.active,true),sort_order:nullableNumber(item.sort_order??item.sortOrder,{integer:true,min:0})??100
  };
  const body=pick(aliases,spec.allowed);
  if(kind==="cabin"&&(!body.cabin_code||!body.cabin_name))throw new Error("AIRCRAFT_CABIN_REQUIRED_FIELDS_MISSING");
  if((kind==="view"||kind==="scene")&&!body.image_url)throw new Error("AIRCRAFT_IMAGE_REQUIRED");
  return body;
}
export async function saveAircraftChildCore(input={}){
  const session=await requireInventoryAccess({write:true});
  const kind=clean(input.kind,40),spec=AIRCRAFT_CHILDREN[kind],item=object(input.item);
  if(!spec)throw new Error("AIRCRAFT_CHILD_KIND_INVALID");
  const id=clean(item.id,80),body=aircraftChildBody(kind,item);
  let saved;
  if(id)saved=(await restRequest({table:spec.table,method:"PATCH",query:{id:qeq(id)},body,prefer:"return=representation"}))?.[0];
  else saved=(await restRequest({table:spec.table,method:"POST",body,prefer:"return=representation"}))?.[0];
  await audit(session,"AIRCRAFT_CHILD_SAVED",spec.table,saved?.id||id,`${kind} saved.`,{});
  return{ok:true,kind,item:saved||body};
}
export async function archiveAircraftChildCore(input={}){
  const session=await requireInventoryAccess({write:true});
  const kind=clean(input.kind,40),spec=AIRCRAFT_CHILDREN[kind],id=clean(input.id,80);
  if(!spec||!id)throw new Error("AIRCRAFT_CHILD_INPUT_INVALID");
  await restRequest({table:spec.table,method:"PATCH",query:{id:qeq(id)},body:{active:false},prefer:"return=minimal"});
  await audit(session,"AIRCRAFT_CHILD_ARCHIVED",spec.table,id,`${kind} archived.`,{});
  return{ok:true,kind,id};
}
export async function smartSyncAircraftCore(input={}){
  const session=await requireInventoryAccess({write:true});
  const buildMissingCabins=input.buildMissingCabins!==false;
  const [airlines,aircraft,cabins]=await Promise.all([
    select("travel_info_airlines",{select:"*",active:"eq.true",limit:"250"}),
    select("travel_info_aircraft",{select:"*",limit:"1600"}),
    select("travel_info_aircraft_cabins",{select:"*",limit:"3000"})
  ]);
  const byKey=new Map(aircraft.filter(a=>a.active!==false).map(a=>[aircraftRowKey(a),a]));
  const cabinsByAircraft=new Map();
  for(const c of cabins){
    const id=clean(c.aircraft_id,80);if(!cabinsByAircraft.has(id))cabinsByAircraft.set(id,[]);
    cabinsByAircraft.get(id).push(c);
  }
  let created=0,updated=0,unchanged=0,cabinsCreated=0;
  for(const t of airlineTemplates(airlines)){
    const key=aircraftTemplateKey(t);let existing=byKey.get(key);
    if(!existing){
      const body={
        airline_id:t.airlineId,airline_code:t.airlineCode,aircraft_code:t.aircraftCode,aircraft_name:t.aircraftName,
        manufacturer:inferManufacturer(t.aircraftName)||null,family:inferFamily(t.aircraftName)||null,total_seats:t.totalSeats,
        configuration:t.configuration,display_title:t.aircraftName,display_summary:`${t.aircraftName}${t.totalSeats?` · ${t.totalSeats} seats`:""}.`,
        source_url:t.sourceUrl||null,source_urls:t.sourceUrls,review_notes:t.notes||null,status:"REVIEW",
        customer_visible:false,staff_visible:true,active:true,sort_order:100,source:"INVENTORY_CONTROL_SYNC",
        source_reference:"travel_info_airlines.aircraftConfigurationsJson"
      };
      existing=(await restRequest({table:"travel_info_aircraft",method:"POST",body,prefer:"return=representation"}))?.[0];
      if(!existing)continue;byKey.set(key,existing);created++;
    }else{
      const patch={};
      if(!clean(existing.manufacturer)){const x=inferManufacturer(t.aircraftName);if(x)patch.manufacturer=x}
      if(!clean(existing.family)){const x=inferFamily(t.aircraftName);if(x)patch.family=x}
      if(existing.total_seats===null&&t.totalSeats!==null)patch.total_seats=t.totalSeats;
      if(!Object.keys(object(existing.configuration)).length&&Object.keys(t.configuration).length)patch.configuration=t.configuration;
      if(!clean(existing.display_title))patch.display_title=t.aircraftName;
      if(!clean(existing.display_summary))patch.display_summary=`${t.aircraftName}${t.totalSeats?` · ${t.totalSeats} seats`:""}.`;
      if(!clean(existing.source_url)&&t.sourceUrl)patch.source_url=t.sourceUrl;
      if(!array(existing.source_urls).length&&t.sourceUrls.length)patch.source_urls=t.sourceUrls;
      if(Object.keys(patch).length){
        existing=(await restRequest({table:"travel_info_aircraft",method:"PATCH",query:{id:qeq(existing.id)},body:patch,prefer:"return=representation"}))?.[0]||existing;
        updated++;
      }else unchanged++;
    }
    if(buildMissingCabins&&existing?.id){
      const current=cabinsByAircraft.get(existing.id)||[];
      const currentCodes=new Set(current.filter(c=>c.active!==false).map(c=>canonicalCabinCode(c.cabin_code||c.cabin_name)));
      const missing=templateCabins(t.configuration).filter(c=>!currentCodes.has(c.cabinCode));
      if(missing.length){
        const rows=missing.map(c=>({
          aircraft_id:existing.id,cabin_code:c.cabinCode,cabin_name:c.cabinName,rank:c.rank,seat_count:c.seatCount,
          summary:`${c.cabinName} cabin imported from the airline fleet configuration. Review customer-facing amenities and images before publication.`,
          description:null,meal_title:null,meal_description:null,amenities:[],display_settings:{source:"INVENTORY_CONTROL_SYNC",reviewRequired:true},
          active:true,sort_order:c.sortOrder
        }));
        const saved=await restRequest({table:"travel_info_aircraft_cabins",method:"POST",body:rows,prefer:"return=representation"});
        cabinsCreated+=array(saved).length;cabinsByAircraft.set(existing.id,current.concat(array(saved)));
      }
    }
  }
  const refreshed=await select("travel_info_aircraft",{select:"*",limit:"1600"});
  const sync=syncHealth(airlines,refreshed);
  await audit(session,"AIRCRAFT_SMART_SYNC","travel_info_aircraft",null,"Aircraft fleet synchronization completed.",{created,updated,unchanged,cabinsCreated});
  return{ok:true,created,updated,unchanged,cabinsCreated,sync,message:`Smart Sync complete: ${created} aircraft created for review, ${updated} records enriched, ${cabinsCreated} missing cabin records created. Curated images and existing customer content were preserved.`};
}
export async function getCabinNormalizationPreviewCore(){
  await requireInventoryAccess();
  const rows=await select("travel_info_aircraft_cabins",{select:"*",active:"eq.true",limit:"3000"});
  const canonical=new Set(["F","J","W","Y"]), descriptive=new Set(["FIRST","BUSINESS","PREMIUM_ECONOMY","PREMIUM ECONOMY","ECONOMY"]);
  const byKey=new Map();
  for(const r of rows.filter(r=>canonical.has(upper(r.cabin_code,80))))byKey.set(`${r.aircraft_id}|${lower(r.cabin_name,240)}|${r.seat_count??""}`,r);
  const duplicates=rows.filter(r=>descriptive.has(upper(r.cabin_code,80))&&byKey.has(`${r.aircraft_id}|${lower(r.cabin_name,240)}|${r.seat_count??""}`));
  return{ok:true,duplicateDescriptiveRows:duplicates.length,affectedAircraft:new Set(duplicates.map(x=>x.aircraft_id)).size,duplicates:duplicates.slice(0,250).map(normalizeCabin)};
}

export async function getInventoryAuditCore(input={}){
  await requireInventoryAccess();
  const limit=Math.min(500,Math.max(1,Number(input.limit)||200));
  const rows=await select("master_inventory_audit",{select:"*",order:"created_at.desc",limit:String(limit)});
  return{ok:true,audit:rows.map(r=>({
    id:r.id,timestamp:r.created_at,eventType:r.event_type,domain:r.domain,entityTable:r.entity_table,
    entityId:r.entity_id,productKey:r.product_key,flightNumber:r.flight_number,classCode:r.class_code,
    message:r.message,agentName:r.created_by_name,payload:object(r.payload)
  }))};
}
export async function getInventoryQualityCore(){
  await requireInventoryAccess();
  const [airlines,aircraft,cabins,views,hotspots,scenes,sceneHotspots,canonical,catalog]=await Promise.all([
    select("travel_info_airlines",{select:"*",active:"eq.true",limit:"250"}),
    select("travel_info_aircraft",{select:"*",active:"eq.true",limit:"1600"}),
    select("travel_info_aircraft_cabins",{select:"*",active:"eq.true",limit:"3000"}),
    select("travel_info_aircraft_views",{select:"id,aircraft_id,cabin_id,image_url,is_default,active",active:"eq.true",limit:"3000"}),
    select("travel_info_aircraft_hotspots",{select:"*",active:"eq.true",limit:"5000"}),
    select("travel_info_aircraft_walk_scenes",{select:"*",active:"eq.true",limit:"3000"}),
    select("travel_info_aircraft_scene_hotspots",{select:"*",active:"eq.true",limit:"5000"}),
    select("inventory_canonical_entities_v",{select:"*",limit:"3000"}),
    catalogRows()
  ]);
  const sums=new Map(),counts=new Map();
  for(const c of cabins){const id=clean(c.aircraft_id,80);sums.set(id,(sums.get(id)||0)+(nullableNumber(c.seat_count,{integer:true})||0));counts.set(id,(counts.get(id)||0)+1)}
  const mismatch=aircraft.filter(a=>(nullableNumber(a.total_seats,{integer:true})||0)!==(sums.get(clean(a.id,80))||0));
  const noCabins=aircraft.filter(a=>!counts.get(clean(a.id,80)));
  const noViews=aircraft.filter(a=>!views.some(v=>clean(v.aircraft_id,80)===clean(a.id,80)));
  const publicNoMedia=canonical.map(normalizeCanonical).filter(r=>r.active&&r.customerVisible&&r.status==="PUBLISHED"&&["HOTEL","DESTINATION","AREA"].includes(r.entityType)&&!r.media.length);
  return{
    ok:true,generatedAt:now(),aircraftSync:syncHealth(airlines,aircraft),
    counts:{canonical:canonical.length,catalog:catalog.length,searchableCatalog:catalog.filter(c=>c.active&&c.searchable).length,aircraft:aircraft.length,cabins:cabins.length,views:views.length,hotspots:hotspots.length,walkScenes:scenes.length,sceneHotspots:sceneHotspots.length},
    issues:{
      cabinSeatMismatches:mismatch.map(a=>({id:a.id,airlineCode:a.airline_code,aircraftCode:a.aircraft_code,name:a.aircraft_name,totalSeats:a.total_seats,cabinSeats:sums.get(clean(a.id,80))||0})),
      aircraftWithoutCabins:noCabins.map(a=>({id:a.id,airlineCode:a.airline_code,aircraftCode:a.aircraft_code,name:a.aircraft_name})),
      aircraftWithoutViews:noViews.map(a=>({id:a.id,airlineCode:a.airline_code,aircraftCode:a.aircraft_code,name:a.aircraft_name})),
      publicRecordsWithoutMedia:publicNoMedia.map(r=>({id:r.id,type:r.entityType,code:r.code,name:r.name}))
    }
  };
}
