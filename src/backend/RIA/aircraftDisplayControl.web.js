// backend/RIA/aircraftDisplayControl.web.js
// SKANDI Aircraft Display Control V9 — detailed aircraft authority linked to Inventory Control airlines.
// Version 2026.09.10.9

import { webMethod, Permissions } from "wix-web-module";
import { getStaffPortalSession } from "backend/RIA/staffPortalAuth.web";
import { restRequest } from "backend/RIA/supabaseServer.js";

const VERSION="2026.09.10.9";
const clean=(v,max=12000)=>String(v??"").trim().slice(0,max);
const upper=(v,max=12000)=>clean(v,max).toUpperCase();
const arr=v=>Array.isArray(v)?v:[];
const obj=v=>v&&typeof v==="object"&&!Array.isArray(v)?v:{};
const num=(v,fallback=0)=>Number.isFinite(Number(v))?Number(v):fallback;
const bool=(v,fallback=true)=>v===undefined||v===null||v===""?fallback:(v===true||v==="true"||v===1||v==="1");
function parseJson(v,fallback={}){if(v===undefined||v===null||v==="")return fallback;if(typeof v==="object")return v;try{return JSON.parse(String(v))}catch(_){return fallback}}
async function select(table,query={}){return arr(await restRequest({table,method:"GET",query,prefer:""}))}
async function requireAdmin(){
  const s=await getStaffPortalSession();
  if(!s||s.ok===false||s.authorized===false)throw new Error("AIRCRAFT_CONTROL_NOT_AUTHORIZED");
  const p=obj(s.profile); const permissions=new Set([...arr(s.permissions),...arr(s.apps),...arr(p.permission_keys),...arr(p.allowed_apps),...arr(p.permission_groups)].map(x=>clean(x,120).toLowerCase()));
  const role=upper(p.access_role||p.role,120);
  const allowed=role==="COMPANY_OWNER"||role==="SYSTEM_ADMIN"||permissions.has("system-admin")||permissions.has("inventory-control")||permissions.has("hr")||p.can_manage===true;
  if(!allowed)throw new Error("AIRCRAFT_CONTROL_ACCESS_DENIED");
  return s;
}
function qeq(v){return `eq.${clean(v,200)}`}

function airline(r={}){return{id:clean(r.ID||r["Record ID"],180),name:clean(r.Title||r.shortName,240),shortName:clean(r.shortName||r.Title,160),iataCode:upper(r.iataCode,8),icaoCode:upper(r.icaoCode,8),active:r.active===true,templates:parseJson(r.aircraftConfigurationsJson,[]),fleetSummary:parseJson(r.fleetSummaryJson,[]),aircraftFamilies:clean(r.aircraftFamiliesText,6000)}}
function aircraft(r={}){return{id:clean(r.id,80),airlineId:clean(r.airline_id,180),airlineCode:upper(r.airline_code,8),aircraftCode:upper(r.aircraft_code,80),aircraftName:clean(r.aircraft_name,240),manufacturer:clean(r.manufacturer,160),family:clean(r.family,160),variant:clean(r.variant,160),totalSeats:num(r.total_seats,0),configuration:obj(r.configuration),displayTitle:clean(r.display_title,300),displaySummary:clean(r.display_summary,12000),heroImageUrl:clean(r.hero_image_url,1800),exteriorImageUrl:clean(r.exterior_image_url,1800),seatmapImageUrl:clean(r.seatmap_image_url,1800),thumbnailImageUrl:clean(r.thumbnail_image_url,1800),defaultCabinCode:clean(r.default_cabin_code,80),defaultViewType:clean(r.default_view_type,80),walkthroughTitle:clean(r.walkthrough_title,300),walkthroughSubtitle:clean(r.walkthrough_subtitle,1200),walkthroughStartSceneCode:clean(r.walkthrough_start_scene_code,120),walkthroughAccuracyLabel:clean(r.walkthrough_accuracy_label,300),sourceUrl:clean(r.source_url,1800),sourceUrls:arr(r.source_urls),reviewNotes:clean(r.review_notes,12000),lastReviewed:clean(r.last_reviewed,20),status:upper(r.status||"DRAFT",40),customerVisible:r.customer_visible===true,staffVisible:r.staff_visible!==false,active:r.active!==false,sortOrder:num(r.sort_order,0),source:clean(r.source,120),sourceReference:clean(r.source_reference,500),createdAt:r.created_at||"",updatedAt:r.updated_at||""}}
function cabin(r={}){return{id:clean(r.id,80),aircraftId:clean(r.aircraft_id,80),cabinCode:upper(r.cabin_code,80),cabinName:clean(r.cabin_name,240),rank:num(r.rank,0),seatCount:num(r.seat_count,0),summary:clean(r.summary,6000),description:clean(r.description,12000),mealTitle:clean(r.meal_title,300),mealDescription:clean(r.meal_description,8000),amenities:obj(r.amenities),displaySettings:obj(r.display_settings),active:r.active!==false,sortOrder:num(r.sort_order,0)}}

const CHILDREN={
  cabin:{table:"travel_info_aircraft_cabins",parent:"aircraft_id",allowed:["aircraft_id","cabin_code","cabin_name","rank","seat_count","summary","description","meal_title","meal_description","amenities","display_settings","active","sort_order"]},
  view:{table:"travel_info_aircraft_views",parent:"aircraft_id",allowed:["aircraft_id","cabin_id","view_code","label","view_type","image_url","mobile_image_url","thumbnail_url","alt_text","caption","credit","is_default","active","sort_order"]},
  hotspot:{table:"travel_info_aircraft_hotspots",parent:"view_id",allowed:["view_id","hotspot_code","label","title","description","x","y","action","focus_x","focus_y","focus_zoom","target_cabin_code","thumbnail_url","active","sort_order"]},
  scene:{table:"travel_info_aircraft_walk_scenes",parent:"aircraft_id",allowed:["aircraft_id","scene_code","title","short_title","summary","image_url","mobile_image_url","forward_scene_code","back_scene_code","forward_label","back_label","active","sort_order"]},
  sceneHotspot:{table:"travel_info_aircraft_scene_hotspots",parent:"scene_id",allowed:["scene_id","hotspot_code","label","title","description","hotspot_type","x","y","action","target_cabin_code","active","sort_order"]}
};
function pick(input,fields){const out={};fields.forEach(k=>{if(input[k]!==undefined)out[k]=input[k]});return out}
function childDb(kind,item={}){
  const spec=CHILDREN[kind]; if(!spec)throw new Error("AIRCRAFT_CHILD_KIND_INVALID");
  const aliases={aircraft_id:item.aircraft_id||item.aircraftId,cabin_id:item.cabin_id||item.cabinId,view_id:item.view_id||item.viewId,scene_id:item.scene_id||item.sceneId,cabin_code:item.cabin_code||item.cabinCode,cabin_name:item.cabin_name||item.cabinName,seat_count:item.seat_count??item.seatCount,meal_title:item.meal_title||item.mealTitle,meal_description:item.meal_description||item.mealDescription,display_settings:item.display_settings||item.displaySettings,view_code:item.view_code||item.viewCode,view_type:item.view_type||item.viewType,image_url:item.image_url||item.imageUrl,mobile_image_url:item.mobile_image_url||item.mobileImageUrl,thumbnail_url:item.thumbnail_url||item.thumbnailUrl,alt_text:item.alt_text||item.altText,is_default:item.is_default??item.isDefault,hotspot_code:item.hotspot_code||item.hotspotCode,focus_x:item.focus_x??item.focusX,focus_y:item.focus_y??item.focusY,focus_zoom:item.focus_zoom??item.focusZoom,target_cabin_code:item.target_cabin_code||item.targetCabinCode,scene_code:item.scene_code||item.sceneCode,short_title:item.short_title||item.shortTitle,forward_scene_code:item.forward_scene_code||item.forwardSceneCode,back_scene_code:item.back_scene_code||item.backSceneCode,forward_label:item.forward_label||item.forwardLabel,back_label:item.back_label||item.backLabel,hotspot_type:item.hotspot_type||item.hotspotType,sort_order:item.sort_order??item.sortOrder,active:item.active!==false,rank:item.rank,summary:item.summary,description:item.description,title:item.title,label:item.label,action:item.action,x:item.x,y:item.y,caption:item.caption,credit:item.credit,amenities:item.amenities,display_settings:item.display_settings||item.displaySettings};
  return pick(aliases,spec.allowed);
}

async function recordBundle(id){
  const rows=await select("travel_info_aircraft",{select:"*",id:qeq(id),limit:"1"}); const a=rows[0]; if(!a)return null;
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
  return{aircraft:aircraft(a),cabins:cabins.map(cabin),views,hotspots,scenes,sceneHotspots};
}

export const getAircraftControlBootstrap=webMethod(Permissions.SiteMember,async()=>{
  await requireAdmin();
  const [airlines,aircraftRows]=await Promise.all([
    select("travel_info_airlines",{select:"*",active:"eq.true",order:"sort_order.asc"}),
    select("travel_info_aircraft",{select:"*",order:"airline_code.asc,sort_order.asc"})
  ]);
  return{ok:true,source:"AIRCRAFT_DISPLAY_CONTROL_V9",version:VERSION,airlines:airlines.map(airline),aircraft:aircraftRows.map(aircraft)};
});
export const getAircraftControlRecord=webMethod(Permissions.SiteMember,async(input={})=>{await requireAdmin();const id=clean(input.aircraftId,80);if(!id)throw new Error("AIRCRAFT_ID_REQUIRED");const record=await recordBundle(id);if(!record)throw new Error("AIRCRAFT_NOT_FOUND");return{ok:true,...record}});

export const saveAircraftControl=webMethod(Permissions.SiteMember,async(input={})=>{
  await requireAdmin(); const a=obj(input.aircraft||input); const id=clean(a.id,80);
  const body={airline_id:clean(a.airlineId||a.airline_id,180),airline_code:upper(a.airlineCode||a.airline_code,8),aircraft_code:upper(a.aircraftCode||a.aircraft_code,80),aircraft_name:clean(a.aircraftName||a.aircraft_name,240),manufacturer:clean(a.manufacturer,160),family:clean(a.family,160),variant:clean(a.variant,160),total_seats:num(a.totalSeats??a.total_seats,0),configuration:obj(a.configuration),display_title:clean(a.displayTitle||a.display_title,300),display_summary:clean(a.displaySummary||a.display_summary,12000),hero_image_url:clean(a.heroImageUrl||a.hero_image_url,1800),exterior_image_url:clean(a.exteriorImageUrl||a.exterior_image_url,1800),seatmap_image_url:clean(a.seatmapImageUrl||a.seatmap_image_url,1800),thumbnail_image_url:clean(a.thumbnailImageUrl||a.thumbnail_image_url,1800),default_cabin_code:upper(a.defaultCabinCode||a.default_cabin_code,80),default_view_type:clean(a.defaultViewType||a.default_view_type,80),walkthrough_title:clean(a.walkthroughTitle||a.walkthrough_title,300),walkthrough_subtitle:clean(a.walkthroughSubtitle||a.walkthrough_subtitle,1200),walkthrough_start_scene_code:clean(a.walkthroughStartSceneCode||a.walkthrough_start_scene_code,120),walkthrough_accuracy_label:clean(a.walkthroughAccuracyLabel||a.walkthrough_accuracy_label,300),source_url:clean(a.sourceUrl||a.source_url,1800),source_urls:arr(a.sourceUrls||a.source_urls),review_notes:clean(a.reviewNotes||a.review_notes,12000),last_reviewed:clean(a.lastReviewed||a.last_reviewed,20)||null,status:upper(a.status||"DRAFT",40),customer_visible:bool(a.customerVisible??a.customer_visible,false),staff_visible:bool(a.staffVisible??a.staff_visible,true),active:bool(a.active,true),sort_order:num(a.sortOrder??a.sort_order,0),source:clean(a.source||"AIRCRAFT_DISPLAY_CONTROL_V9",120),source_reference:clean(a.sourceReference||a.source_reference,500)};
  if(!body.airline_id||!body.aircraft_code||!body.aircraft_name)throw new Error("AIRCRAFT_REQUIRED_FIELDS_MISSING");
  let saved;
  if(id){saved=arr(await restRequest({table:"travel_info_aircraft",method:"PATCH",query:{id:qeq(id)},body,prefer:"return=representation"}))[0]}
  else{saved=arr(await restRequest({table:"travel_info_aircraft",method:"POST",body,prefer:"return=representation"}))[0]}
  return{ok:true,aircraft:aircraft(saved||body)};
});

export const archiveAircraftControl=webMethod(Permissions.SiteMember,async(input={})=>{await requireAdmin();const id=clean(input.aircraftId,80);if(!id)throw new Error("AIRCRAFT_ID_REQUIRED");await restRequest({table:"travel_info_aircraft",method:"PATCH",query:{id:qeq(id)},body:{active:false,customer_visible:false,staff_visible:false,status:"ARCHIVED"},prefer:"return=representation"});return{ok:true,id}});

export const saveAircraftControlChild=webMethod(Permissions.SiteMember,async(input={})=>{
  await requireAdmin();const kind=clean(input.kind,40);const spec=CHILDREN[kind];if(!spec)throw new Error("AIRCRAFT_CHILD_KIND_INVALID");const item=obj(input.item);const id=clean(item.id,80);const body=childDb(kind,item);if(!clean(body[spec.parent],120))throw new Error("AIRCRAFT_CHILD_PARENT_REQUIRED");
  const result=id?await restRequest({table:spec.table,method:"PATCH",query:{id:qeq(id)},body,prefer:"return=representation"}):await restRequest({table:spec.table,method:"POST",body,prefer:"return=representation"});
  return{ok:true,kind,item:arr(result)[0]||body};
});
export const archiveAircraftControlChild=webMethod(Permissions.SiteMember,async(input={})=>{await requireAdmin();const kind=clean(input.kind,40);const spec=CHILDREN[kind];const id=clean(input.id,80);if(!spec||!id)throw new Error("AIRCRAFT_CHILD_INPUT_INVALID");await restRequest({table:spec.table,method:"PATCH",query:{id:qeq(id)},body:{active:false},prefer:"return=representation"});return{ok:true,kind,id}});

export const smartFillAircraft=webMethod(Permissions.SiteMember,async(input={})=>{
  await requireAdmin();const airlineId=clean(input.airlineId||input.airline_id,180),code=upper(input.aircraftCode||input.aircraft_code,80),name=clean(input.aircraftName||input.aircraft_name,240).toLowerCase();
  if(!airlineId)throw new Error("AIRLINE_REQUIRED");const rows=await select("travel_info_airlines",{select:"*",ID:qeq(airlineId),limit:"1"});const a=rows[0];if(!a)return{ok:false,message:"Airline not found."};
  const templates=arr(parseJson(a.aircraftConfigurationsJson,[]));const matches=templates.filter(t=>(!code||upper(t.aircraftCode||t.code,80)===code)&&(!name||clean(t.aircraftName||t.name,240).toLowerCase().includes(name)));
  const t=matches.length===1?matches[0]:null;if(!t)return{ok:false,message:matches.length>1?"More than one fleet template matches. Refine aircraft code or name.":"No matching airline fleet template found.",matches:matches.slice(0,20)};
  return{ok:true,suggestion:{airlineId,airlineCode:upper(a.iataCode,8),aircraftCode:upper(t.aircraftCode||t.code,80),aircraftName:clean(t.aircraftName||t.name,240),manufacturer:clean(t.manufacturer,160),family:clean(t.family,160),variant:clean(t.variant,160),totalSeats:num(t.totalSeats||t.total_seats,0),configuration:obj(t.configuration),sourceUrl:clean(t.sourceUrl||t.source_url,1800),sourceUrls:arr(t.sourceUrls||t.source_urls)},message:"Fleet template matched. Review before saving."};
});

export const getCabinNormalizationPreview=webMethod(Permissions.SiteMember,async()=>{
  await requireAdmin();const rows=await select("travel_info_aircraft_cabins",{select:"*",active:"eq.true"});
  const canonical=new Set(["F","J","W","Y"]);const descriptive=new Set(["FIRST","BUSINESS","PREMIUM_ECONOMY","PREMIUM ECONOMY","ECONOMY"]);const byKey=new Map();
  rows.filter(r=>canonical.has(upper(r.cabin_code,80))).forEach(r=>byKey.set(`${r.aircraft_id}|${clean(r.cabin_name,240).toLowerCase()}|${num(r.seat_count,-1)}`,r));
  const duplicates=rows.filter(r=>descriptive.has(upper(r.cabin_code,80))&&byKey.has(`${r.aircraft_id}|${clean(r.cabin_name,240).toLowerCase()}|${num(r.seat_count,-1)}`));
  return{ok:true,duplicateDescriptiveRows:duplicates.length,affectedAircraft:new Set(duplicates.map(x=>x.aircraft_id)).size,duplicates:duplicates.slice(0,250).map(cabin)};
});
