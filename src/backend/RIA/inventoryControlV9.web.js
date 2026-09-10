// backend/RIA/inventoryControlV9.web.js
// SKANDI Unified Inventory Control V9.12 — master data, dated inventory, air controls, aircraft/cabin studio.
// Version 2026.09.10.12

import { webMethod, Permissions } from "wix-web-module";
import { getStaffPortalSession } from "backend/RIA/staffPortalAuth.web";
import { restRequest } from "backend/RIA/supabaseServer.js";

const VERSION="2026.09.10.12";
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
  if(!s||s.ok===false||s.authorized===false)throw new Error("INVENTORY_CONTROL_NOT_AUTHORIZED");
  const p=obj(s.profile); const permissions=new Set([...arr(s.permissions),...arr(s.apps),...arr(p.permission_keys),...arr(p.allowed_apps),...arr(p.permission_groups)].map(x=>clean(x,120).toLowerCase()));
  const role=upper(p.access_role||p.role,120);
  const allowed=["OWNER","COMPANY_OWNER","SUPER_ADMIN","SYSTEM_ADMIN"].includes(role)||clean(p.permission_preset||p.permissionPreset,120).toLowerCase()==="all"||permissions.has("system-admin")||permissions.has("inventory-control")||permissions.has("hr")||p.can_manage===true;
  if(!allowed)throw new Error("INVENTORY_CONTROL_ACCESS_DENIED");
  return s;
}
function qeq(v){return `eq.${clean(v,200)}`}

function isBlank(v){
  if(v===undefined||v===null||v==="") return true;
  if(Array.isArray(v)) return v.length===0;
  if(typeof v==="object") return Object.keys(v).length===0;
  return false;
}
function normalizeName(v){return clean(v,300).toLowerCase().replace(/\s+/g," ").trim()}
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
  Object.entries(obj(configuration)).forEach(([name,value])=>{
    const seats=Math.max(0,Math.round(num(value,0)));
    if(!name||!seats)return;
    const code=canonicalCabinCode(name);
    const existing=grouped.get(code)||{code,names:[],seatCount:0};
    existing.names.push(clean(name,160)); existing.seatCount+=seats; grouped.set(code,existing);
  });
  return Array.from(grouped.values()).map(x=>({
    cabinCode:x.code,
    cabinName:x.names.length===1?x.names[0]:x.names.join(" + "),
    seatCount:x.seatCount,
    rank:cabinRank(x.code),
    sortOrder:cabinRank(x.code)
  }));
}
function inferManufacturer(name=""){
  const n=clean(name,240);
  if(/^Airbus\b/i.test(n))return "Airbus";
  if(/^Boeing\b/i.test(n))return "Boeing";
  if(/^Embraer\b/i.test(n))return "Embraer";
  if(/^ATR\b/i.test(n))return "ATR";
  return "";
}
function inferFamily(name=""){
  const n=clean(name,240);
  const m=n.match(/\b(A2\d\d|A3\d\d|A220|A320|A321|A330|A340|A350|A380|737|747|757|767|777|787|E\d{3}|E-Jet|ATR\s?\d{2})\b/i);
  return m?m[1].toUpperCase():"";
}
function fleetTemplates(airlineRows=[]){
  const output=[];
  for(const row of arr(airlineRows)){
    const templates=parseJson(row.aircraftConfigurationsJson,[]);
    if(!Array.isArray(templates))continue;
    templates.forEach((t,index)=>{
      const code=upper(t?.aircraftCode||t?.code,80),name=clean(t?.aircraftName||t?.name,240),total=Math.max(0,Math.round(num(t?.totalSeats??t?.total_seats,0)));
      if(!code||!name)return;
      output.push({
        airlineId:clean(row.ID||row["Record ID"],180),airlineCode:upper(row.iataCode,8),airlineName:clean(row.Title||row.shortName,240),
        aircraftCode:code,aircraftName:name,totalSeats:total,configuration:obj(t?.configuration),
        sourceUrl:clean(t?.sourceUrl||t?.source_url,1800),sourceUrls:arr(t?.sourceUrls||t?.source_urls),notes:clean(t?.notes,12000),
        operatorBrand:clean(t?.operatorBrand,240),templateIndex:index
      });
    });
  }
  return output;
}
function templateKey(t={}){return `${clean(t.airlineId,180)}|${upper(t.aircraftCode,80)}|${num(t.totalSeats,-1)}|${normalizeName(t.aircraftName)}`}
function aircraftKey(a={}){return `${clean(a.airline_id||a.airlineId,180)}|${upper(a.aircraft_code||a.aircraftCode,80)}|${num(a.total_seats??a.totalSeats,-1)}|${normalizeName(a.aircraft_name||a.aircraftName)}`}
function computeSyncHealth(airlineRows=[],aircraftRows=[]){
  const templates=fleetTemplates(airlineRows),activeAircraft=arr(aircraftRows).filter(a=>a.active!==false&&upper(a.status,40)!=="ARCHIVED");
  const existing=new Set(activeAircraft.map(aircraftKey));
  const templateKeys=new Set(templates.map(templateKey));
  const missing=templates.filter(t=>!existing.has(templateKey(t)));
  const unmatched=activeAircraft.filter(a=>!templateKeys.has(aircraftKey(a)));
  return {fleetTemplates:templates.length,aircraftRecords:activeAircraft.length,matched:templates.length-missing.length,missing:missing.length,manualOrUnmatched:unmatched.length,missingPreview:missing.slice(0,40).map(t=>({airlineCode:t.airlineCode,aircraftCode:t.aircraftCode,aircraftName:t.aircraftName,totalSeats:t.totalSeats}))};
}

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
  return{ok:true,source:"INVENTORY_CONTROL_V9_12",version:VERSION,airlines:airlines.map(airline),aircraft:aircraftRows.map(aircraft),sync:computeSyncHealth(airlines,aircraftRows)};
});
export const getAircraftControlRecord=webMethod(Permissions.SiteMember,async(input={})=>{await requireAdmin();const id=clean(input.aircraftId,80);if(!id)throw new Error("AIRCRAFT_ID_REQUIRED");const record=await recordBundle(id);if(!record)throw new Error("AIRCRAFT_NOT_FOUND");return{ok:true,...record}});

export const saveAircraftControl=webMethod(Permissions.SiteMember,async(input={})=>{
  await requireAdmin(); const a=obj(input.aircraft||input); const id=clean(a.id,80);
  const body={airline_id:clean(a.airlineId||a.airline_id,180),airline_code:upper(a.airlineCode||a.airline_code,8),aircraft_code:upper(a.aircraftCode||a.aircraft_code,80),aircraft_name:clean(a.aircraftName||a.aircraft_name,240),manufacturer:clean(a.manufacturer,160),family:clean(a.family,160),variant:clean(a.variant,160),total_seats:num(a.totalSeats??a.total_seats,0),configuration:obj(a.configuration),display_title:clean(a.displayTitle||a.display_title,300),display_summary:clean(a.displaySummary||a.display_summary,12000),hero_image_url:clean(a.heroImageUrl||a.hero_image_url,1800),exterior_image_url:clean(a.exteriorImageUrl||a.exterior_image_url,1800),seatmap_image_url:clean(a.seatmapImageUrl||a.seatmap_image_url,1800),thumbnail_image_url:clean(a.thumbnailImageUrl||a.thumbnail_image_url,1800),default_cabin_code:upper(a.defaultCabinCode||a.default_cabin_code,80),default_view_type:clean(a.defaultViewType||a.default_view_type,80),walkthrough_title:clean(a.walkthroughTitle||a.walkthrough_title,300),walkthrough_subtitle:clean(a.walkthroughSubtitle||a.walkthrough_subtitle,1200),walkthrough_start_scene_code:clean(a.walkthroughStartSceneCode||a.walkthrough_start_scene_code,120),walkthrough_accuracy_label:clean(a.walkthroughAccuracyLabel||a.walkthrough_accuracy_label,300),source_url:clean(a.sourceUrl||a.source_url,1800),source_urls:arr(a.sourceUrls||a.source_urls),review_notes:clean(a.reviewNotes||a.review_notes,12000),last_reviewed:clean(a.lastReviewed||a.last_reviewed,20)||null,status:upper(a.status||"DRAFT",40),customer_visible:bool(a.customerVisible??a.customer_visible,false),staff_visible:bool(a.staffVisible??a.staff_visible,true),active:bool(a.active,true),sort_order:num(a.sortOrder??a.sort_order,0),source:clean(a.source||"INVENTORY_CONTROL_V9_12",120),source_reference:clean(a.sourceReference||a.source_reference,500)};
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


export const smartSyncAllAircraft=webMethod(Permissions.SiteMember,async(input={})=>{
  await requireAdmin();
  const buildMissingCabins=input.buildMissingCabins!==false;
  const [airlineRows,aircraftRows,cabinRows]=await Promise.all([
    select("travel_info_airlines",{select:"*",active:"eq.true",order:"sort_order.asc"}),
    select("travel_info_aircraft",{select:"*"}),
    select("travel_info_aircraft_cabins",{select:"*"})
  ]);
  const templates=fleetTemplates(airlineRows);
  const byKey=new Map(aircraftRows.map(a=>[aircraftKey(a),a]));
  const cabinsByAircraft=new Map();
  cabinRows.forEach(c=>{const id=clean(c.aircraft_id,80);if(!cabinsByAircraft.has(id))cabinsByAircraft.set(id,[]);cabinsByAircraft.get(id).push(c)});
  let created=0,updated=0,cabinsCreated=0,skippedArchived=0,unchanged=0;
  const createdRecords=[];

  for(const t of templates){
    const key=templateKey(t);
    let existing=byKey.get(key)||null;
    if(existing&&upper(existing.status,40)==="ARCHIVED"){skippedArchived+=1;continue}
    if(!existing){
      const body={
        airline_id:t.airlineId,airline_code:t.airlineCode,aircraft_code:t.aircraftCode,aircraft_name:t.aircraftName,
        manufacturer:inferManufacturer(t.aircraftName),family:inferFamily(t.aircraftName),variant:"",total_seats:t.totalSeats||null,
        configuration:t.configuration,display_title:t.aircraftName,
        display_summary:`${t.aircraftName}${t.totalSeats?` · ${t.totalSeats} seats`:""}. Review this imported fleet configuration before customer publication.`,
        default_cabin_code:"Y",default_view_type:"CABIN",source_url:t.sourceUrl,source_urls:t.sourceUrls,
        review_notes:t.notes,last_reviewed:null,status:"REVIEW",customer_visible:false,staff_visible:true,active:true,sort_order:100,
        source:"INVENTORY_CONTROL_V9_SYNC",source_reference:"travel_info_airlines.aircraftConfigurationsJson"
      };
      existing=arr(await restRequest({table:"travel_info_aircraft",method:"POST",body,prefer:"return=representation"}))[0];
      if(!existing)continue;
      byKey.set(key,existing);aircraftRows.push(existing);created+=1;createdRecords.push(existing);
    }else{
      const patch={};
      if(isBlank(existing.manufacturer)){const v=inferManufacturer(t.aircraftName);if(v)patch.manufacturer=v}
      if(isBlank(existing.family)){const v=inferFamily(t.aircraftName);if(v)patch.family=v}
      if(isBlank(existing.total_seats)&&t.totalSeats)patch.total_seats=t.totalSeats;
      if(isBlank(existing.configuration)&&Object.keys(t.configuration).length)patch.configuration=t.configuration;
      if(isBlank(existing.display_title))patch.display_title=t.aircraftName;
      if(isBlank(existing.display_summary))patch.display_summary=`${t.aircraftName}${t.totalSeats?` · ${t.totalSeats} seats`:""}.`;
      if(isBlank(existing.source_url)&&t.sourceUrl)patch.source_url=t.sourceUrl;
      if(isBlank(existing.source_urls)&&t.sourceUrls.length)patch.source_urls=t.sourceUrls;
      if(isBlank(existing.review_notes)&&t.notes)patch.review_notes=t.notes;
      if(isBlank(existing.source_reference))patch.source_reference="travel_info_airlines.aircraftConfigurationsJson";
      if(Object.keys(patch).length){
        const patched=arr(await restRequest({table:"travel_info_aircraft",method:"PATCH",query:{id:qeq(existing.id)},body:patch,prefer:"return=representation"}))[0];
        if(patched){existing=patched;byKey.set(key,existing)}
        updated+=1;
      }else unchanged+=1;
    }

    if(buildMissingCabins&&existing?.id){
      const current=cabinsByAircraft.get(existing.id)||[];
      const currentCodes=new Set(current.filter(c=>c.active!==false).map(c=>canonicalCabinCode(c.cabin_code||c.cabin_name)));
      const missing=templateCabins(t.configuration).filter(c=>!currentCodes.has(c.cabinCode));
      if(missing.length){
        const rows=missing.map(c=>({
          aircraft_id:existing.id,cabin_code:c.cabinCode,cabin_name:c.cabinName,rank:c.rank,seat_count:c.seatCount,
          summary:`${c.cabinName} cabin imported from the airline fleet configuration. Review customer-facing amenities and images before publication.`,
          description:"",meal_title:"",meal_description:"",amenities:{},display_settings:{source:"INVENTORY_CONTROL_V9_SYNC",reviewRequired:true},active:true,sort_order:c.sortOrder
        }));
        const saved=arr(await restRequest({table:"travel_info_aircraft_cabins",method:"POST",body:rows,prefer:"return=representation"}));
        cabinsCreated+=saved.length;cabinsByAircraft.set(existing.id,current.concat(saved));
      }
    }
  }
  const refreshedAircraft=await select("travel_info_aircraft",{select:"*"});
  const sync=computeSyncHealth(airlineRows,refreshedAircraft);
  return{ok:true,version:VERSION,created,updated,unchanged,cabinsCreated,skippedArchived,sync,createdAircraft:createdRecords.map(aircraft),message:`Smart Sync complete: ${created} aircraft created for review, ${updated} derived records filled, ${cabinsCreated} missing cabin records created. Curated media and existing content were not overwritten.`};
});

export const getCabinNormalizationPreview=webMethod(Permissions.SiteMember,async()=>{
  await requireAdmin();const rows=await select("travel_info_aircraft_cabins",{select:"*",active:"eq.true"});
  const canonical=new Set(["F","J","W","Y"]);const descriptive=new Set(["FIRST","BUSINESS","PREMIUM_ECONOMY","PREMIUM ECONOMY","ECONOMY"]);const byKey=new Map();
  rows.filter(r=>canonical.has(upper(r.cabin_code,80))).forEach(r=>byKey.set(`${r.aircraft_id}|${clean(r.cabin_name,240).toLowerCase()}|${num(r.seat_count,-1)}`,r));
  const duplicates=rows.filter(r=>descriptive.has(upper(r.cabin_code,80))&&byKey.has(`${r.aircraft_id}|${clean(r.cabin_name,240).toLowerCase()}|${num(r.seat_count,-1)}`));
  return{ok:true,duplicateDescriptiveRows:duplicates.length,affectedAircraft:new Set(duplicates.map(x=>x.aircraft_id)).size,duplicates:duplicates.slice(0,250).map(cabin)};
});


/* ==========================================================================\n   UNIFIED INVENTORY CONTROL V9.12\n   ========================================================================== */

const MASTER_TYPES=new Set(["COUNTRY","DESTINATION","AREA","SUPPLIER","HOTEL","GUIDED_TOUR","ACTIVITY","PARTNER_TICKET","TRANSFER","CAR_RENTAL","PACKAGE","ANCILLARY"]);
const AIR_TABLES={
  flight:{table:"inventory_flight_legs",allowed:["flight_number","departure_date","board_point","off_point","equipment_type","physical_capacity","yield_index","control_mode","revenue_band","status","source","last_sync_at","payload"]},
  class:{table:"inventory_flight_classes",allowed:["flight_leg_id","flight_number","departure_date","board_point","off_point","class_code","cabin","nest","authorized","sold","available","waitlist_limit","overbooking_limit","protection","status","note","payload"]},
  schedule:{table:"inventory_schedule_lines",allowed:["season_code","flight_number","days_of_operation","board_point","off_point","via_point","std","sta","equipment_type","capacity","effective_date","discontinue_date","status","payload"]},
  nesting:{table:"inventory_nesting_controls",allowed:["flight_number","departure_date","board_point","off_point","class_code","cabin","nest","parent_class","bid_price","hurdle","min_stay","waitlist_limit","overbooking_limit","authorized","protection","waitlist_policy","status","payload"]}
};
function isUuid(v){return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(clean(v,80))}
function safeStatus(v){const s=upper(v,30);return ["DRAFT","REVIEW","PUBLISHED","HIDDEN","SUSPENDED","ARCHIVED"].includes(s)?s:"DRAFT"}
function masterRow(r={}){return{id:clean(r.id,80),publicId:clean(r.public_id,180),entityType:upper(r.entity_type,40),code:clean(r.code,180),name:clean(r.name,300),slug:clean(r.slug,240),status:upper(r.status,30),active:r.active!==false,customerVisible:r.customer_visible===true,staffVisible:r.staff_visible!==false,alteaVisible:r.altea_visible!==false,featured:r.featured===true,homepageFeatured:r.homepage_featured===true,sortPriority:num(r.sort_priority,100),parentEntityId:clean(r.parent_entity_id,80),supplierEntityId:clean(r.supplier_entity_id,80),source:clean(r.source,120),sourceReference:clean(r.source_reference,800),details:obj(r.details),commercial:obj(r.commercial),operations:obj(r.operations),seo:obj(r.seo),publication:obj(r.publication),payload:obj(r.payload),searchable:r.searchable===true,collectionType:clean(r.collection_type,80),partnerTier:clean(r.partner_tier,80),searchPriority:num(r.search_priority,100),searchKeywords:arr(r.search_keywords),sourceTable:"inventory_master_entities",sourceId:clean(r.id,80),createdAt:r.created_at||"",updatedAt:r.updated_at||""}}
function canonicalRow(r={}){return{id:clean(r.id,80),publicId:clean(r.public_id,180),entityType:upper(r.entity_type,40),code:clean(r.code,180),name:clean(r.name,300),slug:clean(r.slug,240),status:upper(r.status,30),active:r.active!==false,customerVisible:r.customer_visible===true,staffVisible:r.staff_visible!==false,alteaVisible:r.altea_visible!==false,featured:r.featured===true,homepageFeatured:r.homepage_featured===true,sortPriority:num(r.sort_priority,100),parentEntityId:clean(r.parent_entity_id,80),details:obj(r.details),commercial:obj(r.commercial),operations:obj(r.operations),seo:obj(r.seo),publication:obj(r.publication),payload:obj(r.payload),localized:arr(r.localized),media:arr(r.media),relations:arr(r.relations),sourceTable:clean(r.source_table,80),updatedAt:r.updated_at||""}}
function datedRow(r={}){return{id:clean(r.id,80),entityId:clean(r.entity_id,80),inventoryType:clean(r.inventory_type,80),serviceDate:clean(r.service_date,20),startTime:clean(r.start_time,20),endTime:clean(r.end_time,20),variantCode:clean(r.variant_code,120),variantName:clean(r.variant_name,240),capacityTotal:num(r.capacity_total,0),held:num(r.held,0),sold:num(r.sold,0),available:num(r.available,0),waitlistLimit:num(r.waitlist_limit,0),overbookingLimit:num(r.overbooking_limit,0),stopSale:r.stop_sale===true,blackout:r.blackout===true,status:upper(r.status,40),supplierCost:num(r.supplier_cost,0),publicPrice:num(r.public_price,0),adultPrice:num(r.adult_price,0),childPrice:num(r.child_price,0),infantPrice:num(r.infant_price,0),privatePrice:num(r.private_price,0),currency:upper(r.currency,8),priceBasis:upper(r.price_basis,40),bookingCutoffHours:num(r.booking_cutoff_hours,0),minStay:num(r.min_stay,0),maxStay:num(r.max_stay,0),releaseDays:num(r.release_days,0),supplierReference:clean(r.supplier_reference,500),payload:obj(r.payload)}}
async function auditInventory(session,eventType,entityTable,entityId,message,payload={}){try{const p=obj(session?.profile);await restRequest({table:"master_inventory_audit",method:"POST",body:{event_type:eventType,domain:"INVENTORY_CONTROL",entity_table:entityTable,entity_id:clean(entityId,180)||null,source:"inventory-control-v9.12",message:clean(message,1000),payload,created_by_agent_user_id:isUuid(p.id)?p.id:null,created_by_name:clean(p.displayName||p.name||p.full_name||p.sk_id,200)||null},prefer:"return=minimal"})}catch(e){console.warn("[Inventory audit]",e)}}

export const getUnifiedInventoryBootstrap=webMethod(Permissions.SiteMember,async(input={})=>{
  const session=await requireAdmin();
  const [canonical,sources,airlines,aircraftRows,dated,flight,classes,schedule,nesting]=await Promise.all([
    select("inventory_canonical_entities_v",{select:"*",order:"entity_type.asc,sort_priority.asc",limit:"2500"}),
    select("inventory_source_registry",{select:"*",active:"eq.true",limit:"200"}),
    select("travel_info_airlines",{select:"*",active:"eq.true",order:"sort_order.asc"}),
    select("travel_info_aircraft",{select:"*",order:"airline_code.asc,sort_order.asc"}),
    select("inventory_dated_inventory",{select:"*",order:"service_date.desc",limit:"800"}),
    select("inventory_flight_legs",{select:"*",order:"departure_date.desc,flight_number.asc",limit:"400"}),
    select("inventory_flight_classes",{select:"*",order:"departure_date.desc,flight_number.asc,class_code.asc",limit:"800"}),
    select("inventory_schedule_lines",{select:"*",order:"effective_date.desc,flight_number.asc",limit:"400"}),
    select("inventory_nesting_controls",{select:"*",order:"departure_date.desc,flight_number.asc,class_code.asc",limit:"800"})
  ]);
  const sync=computeSyncHealth(airlines,aircraftRows);
  const byType={};canonical.forEach(r=>{const t=upper(r.entity_type,40);byType[t]=(byType[t]||0)+1});
  const cabinRows=await select("travel_info_aircraft_cabins",{select:"aircraft_id,cabin_code,cabin_name,seat_count,active",active:"eq.true",limit:"2000"});
  const cabinSums=new Map();cabinRows.forEach(c=>{const id=clean(c.aircraft_id,80);cabinSums.set(id,(cabinSums.get(id)||0)+num(c.seat_count,0))});
  const mismatches=aircraftRows.filter(a=>a.active!==false&&num(a.total_seats,0)!==(cabinSums.get(clean(a.id,80))||0)).length;
  return{ok:true,source:"INVENTORY_CONTROL_V9_12",version:VERSION,session:{profile:obj(session.profile),permissions:arr(session.permissions),apps:arr(session.apps)},records:canonical.map(canonicalRow),sourceRegistry:sources,airlines:airlines.map(airline),aircraft:aircraftRows.map(aircraft),dated:dated.map(datedRow),air:{flight,classes,schedule,nesting},stats:{total:canonical.length,byType,aircraft:aircraftRows.length,cabins:cabinRows.length,dated:dated.length,flightLegs:flight.length,flightClasses:classes.length,schedules:schedule.length,nesting:nesting.length},quality:{aircraftSync:sync,cabinSeatMismatches:mismatches}};
});

export const getUnifiedInventoryRecord=webMethod(Permissions.SiteMember,async(input={})=>{
  await requireAdmin();const id=clean(input.id||input.entityId,80),type=upper(input.entityType,40);if(!id)throw new Error("INVENTORY_ID_REQUIRED");
  if(type==="AIRCRAFT")return getAircraftControlRecord({aircraftId:id});
  const canonical=(await select("inventory_canonical_entities_v",{select:"*",id:qeq(id),limit:"1"}))[0];
  if(!canonical)throw new Error("INVENTORY_RECORD_NOT_FOUND");
  if(MASTER_TYPES.has(upper(canonical.entity_type,40))){
    const row=(await select("inventory_master_entities",{select:"*",id:qeq(id),limit:"1"}))[0];
    const [localized,media,relations,dated]=await Promise.all([
      select("inventory_localized_content",{select:"*",entity_id:qeq(id),order:"language.asc"}),
      select("inventory_media_assets",{select:"*",entity_id:qeq(id),order:"sort_order.asc"}),
      select("inventory_entity_relations",{select:"*",source_entity_id:qeq(id),order:"sequence_no.asc"}),
      select("inventory_dated_inventory",{select:"*",entity_id:qeq(id),order:"service_date.asc",limit:"500"})
    ]);
    return{ok:true,record:masterRow(row||canonical),localized,media,relations,dated:dated.map(datedRow)};
  }
  if(upper(canonical.entity_type,40)==="AIRLINE"){
    const rows=await select("travel_info_airlines",{select:"*",iataCode:qeq(canonical.code),limit:"1"});return{ok:true,record:{...canonicalRow(canonical),sourceRecord:rows[0]||{}}};
  }
  if(upper(canonical.entity_type,40)==="AIRPORT"){
    const rows=await select("travel_info_airports",{select:"*",iata:qeq(canonical.code),limit:"1"});return{ok:true,record:{...canonicalRow(canonical),sourceRecord:rows[0]||{}}};
  }
  return{ok:true,record:canonicalRow(canonical)};
});

export const saveUnifiedInventoryRecord=webMethod(Permissions.SiteMember,async(input={})=>{
  const session=await requireAdmin();const r=obj(input.record||input);const type=upper(r.entityType||r.entity_type,40);if(!type)throw new Error("ENTITY_TYPE_REQUIRED");
  if(type==="AIRCRAFT")return saveAircraftControl({aircraft:r});
  if(!MASTER_TYPES.has(type))throw new Error("REFERENCE_RECORD_USE_SPECIAL_EDITOR");
  const id=clean(r.id,80);const body={public_id:clean(r.publicId||r.public_id,180)||`${type.toLowerCase()}-${Date.now()}`,entity_type:type,code:clean(r.code,180),name:clean(r.name,300),slug:clean(r.slug,240)||clean(r.name,300).toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""),status:safeStatus(r.status),active:bool(r.active,true),customer_visible:bool(r.customerVisible??r.customer_visible,false),staff_visible:bool(r.staffVisible??r.staff_visible,true),altea_visible:bool(r.alteaVisible??r.altea_visible,true),featured:bool(r.featured,false),homepage_featured:bool(r.homepageFeatured??r.homepage_featured,false),sort_priority:num(r.sortPriority??r.sort_priority,100),parent_entity_id:isUuid(r.parentEntityId||r.parent_entity_id)?clean(r.parentEntityId||r.parent_entity_id,80):null,supplier_entity_id:isUuid(r.supplierEntityId||r.supplier_entity_id)?clean(r.supplierEntityId||r.supplier_entity_id,80):null,source:clean(r.source||"SKANDI",120),source_reference:clean(r.sourceReference||r.source_reference,800)||null,details:obj(r.details),commercial:obj(r.commercial),operations:obj(r.operations),seo:obj(r.seo),publication:obj(r.publication),payload:obj(r.payload),searchable:bool(r.searchable,false),collection_type:upper(r.collectionType||r.collection_type||"NONE",80),partner_tier:clean(r.partnerTier||r.partner_tier,80)||null,search_priority:num(r.searchPriority??r.search_priority,100),search_keywords:arr(r.searchKeywords||r.search_keywords)};
  if(!body.code||!body.name)throw new Error("INVENTORY_REQUIRED_FIELDS_MISSING");
  let saved;if(id){saved=arr(await restRequest({table:"inventory_master_entities",method:"PATCH",query:{id:qeq(id)},body:{...body,updated_by_agent_user_id:isUuid(session?.profile?.id)?session.profile.id:null},prefer:"return=representation"}))[0]}else{saved=arr(await restRequest({table:"inventory_master_entities",method:"POST",body:{...body,created_by_agent_user_id:isUuid(session?.profile?.id)?session.profile.id:null,updated_by_agent_user_id:isUuid(session?.profile?.id)?session.profile.id:null},prefer:"return=representation"}))[0]}
  await auditInventory(session,id?"MASTER_UPDATED":"MASTER_CREATED","inventory_master_entities",saved?.id||id,`${type} ${body.code} saved.`,{status:body.status});return{ok:true,record:masterRow(saved||body)};
});

export const saveInventoryLocalizedContent=webMethod(Permissions.SiteMember,async(input={})=>{const session=await requireAdmin();const entityId=clean(input.entityId,80),language=upper(input.language||"EN",8);if(!isUuid(entityId))throw new Error("ENTITY_ID_REQUIRED");const body={entity_id:entityId,language,title:clean(input.title,500)||null,eyebrow:clean(input.eyebrow,300)||null,short_description:clean(input.shortDescription||input.short_description,8000)||null,full_description:clean(input.fullDescription||input.full_description,30000)||null,highlights:arr(input.highlights),included:arr(input.included),not_included:arr(input.notIncluded||input.not_included),important_information:clean(input.importantInformation||input.important_information,16000)||null,seo_title:clean(input.seoTitle||input.seo_title,500)||null,seo_description:clean(input.seoDescription||input.seo_description,1000)||null,content:obj(input.content)};const existing=(await select("inventory_localized_content",{select:"id",entity_id:qeq(entityId),language:qeq(language),limit:"1"}))[0];const saved=existing?arr(await restRequest({table:"inventory_localized_content",method:"PATCH",query:{id:qeq(existing.id)},body,prefer:"return=representation"}))[0]:arr(await restRequest({table:"inventory_localized_content",method:"POST",body,prefer:"return=representation"}))[0];await auditInventory(session,"LOCALIZED_CONTENT_SAVED","inventory_localized_content",saved?.id,"${language} localized content saved.",{entityId,language});return{ok:true,item:saved}});

export const saveInventoryMediaAsset=webMethod(Permissions.SiteMember,async(input={})=>{const session=await requireAdmin();const id=clean(input.id,80),entityId=clean(input.entityId||input.entity_id,80);if(!isUuid(entityId)||!clean(input.url,2000))throw new Error("MEDIA_INPUT_INVALID");const body={entity_id:entityId,media_type:upper(input.mediaType||input.media_type||"IMAGE",40),url:clean(input.url,3000),alt_text:clean(input.altText||input.alt_text,1000)||null,caption:clean(input.caption,3000)||null,credit:clean(input.credit,500)||null,language:upper(input.language,8)||null,sort_order:num(input.sortOrder??input.sort_order,100),is_primary:bool(input.isPrimary??input.is_primary,false),is_card:bool(input.isCard??input.is_card,false),is_hero:bool(input.isHero??input.is_hero,false),is_mobile:bool(input.isMobile??input.is_mobile,false),active:bool(input.active,true),payload:obj(input.payload),role:upper(input.role||"GALLERY",80),storage_bucket:clean(input.storageBucket||input.storage_bucket,180)||null,storage_path:clean(input.storagePath||input.storage_path,1000)||null,mime_type:clean(input.mimeType||input.mime_type,160)||null,width_px:num(input.widthPx??input.width_px,0)||null,height_px:num(input.heightPx??input.height_px,0)||null,focal_x:Number.isFinite(Number(input.focalX??input.focal_x))?Number(input.focalX??input.focal_x):null,focal_y:Number.isFinite(Number(input.focalY??input.focal_y))?Number(input.focalY??input.focal_y):null,source_kind:upper(input.sourceKind||input.source_kind||"URL",40)};const saved=id?arr(await restRequest({table:"inventory_media_assets",method:"PATCH",query:{id:qeq(id)},body,prefer:"return=representation"}))[0]:arr(await restRequest({table:"inventory_media_assets",method:"POST",body,prefer:"return=representation"}))[0];await auditInventory(session,"MEDIA_SAVED","inventory_media_assets",saved?.id||id,"Inventory media saved.",{entityId,role:body.role});return{ok:true,item:saved}});

export const saveInventoryDatedRow=webMethod(Permissions.SiteMember,async(input={})=>{const session=await requireAdmin();const id=clean(input.id,80),entityId=clean(input.entityId||input.entity_id,80);if(!isUuid(entityId)||!clean(input.serviceDate||input.service_date,20))throw new Error("DATED_INVENTORY_INPUT_INVALID");const cap=Math.max(0,Math.round(num(input.capacityTotal??input.capacity_total,0))),held=Math.max(0,Math.round(num(input.held,0))),sold=Math.max(0,Math.round(num(input.sold,0))),over=Math.max(0,Math.round(num(input.overbookingLimit??input.overbooking_limit,0)));const body={entity_id:entityId,inventory_type:upper(input.inventoryType||input.inventory_type||"GENERAL",80),service_date:clean(input.serviceDate||input.service_date,20),start_time:clean(input.startTime||input.start_time,20)||null,end_time:clean(input.endTime||input.end_time,20)||null,variant_code:clean(input.variantCode||input.variant_code,120)||null,variant_name:clean(input.variantName||input.variant_name,240)||null,capacity_total:cap,held,sold,available:Math.max(cap+over-held-sold,0),waitlist_limit:Math.max(0,Math.round(num(input.waitlistLimit??input.waitlist_limit,0))),overbooking_limit:over,stop_sale:bool(input.stopSale??input.stop_sale,false),blackout:bool(input.blackout,false),status:upper(input.status||"OPEN",40),supplier_cost:num(input.supplierCost??input.supplier_cost,0),public_price:num(input.publicPrice??input.public_price,0),adult_price:num(input.adultPrice??input.adult_price,0),child_price:num(input.childPrice??input.child_price,0),infant_price:num(input.infantPrice??input.infant_price,0),private_price:num(input.privatePrice??input.private_price,0),currency:upper(input.currency||"USD",8),price_basis:upper(input.priceBasis||input.price_basis||"PER_PERSON",40),booking_cutoff_hours:Math.max(0,Math.round(num(input.bookingCutoffHours??input.booking_cutoff_hours,0))),min_stay:Math.max(0,Math.round(num(input.minStay??input.min_stay,0))),max_stay:Math.max(0,Math.round(num(input.maxStay??input.max_stay,0))),release_days:Math.max(0,Math.round(num(input.releaseDays??input.release_days,0))),supplier_reference:clean(input.supplierReference||input.supplier_reference,500)||null,payload:obj(input.payload),updated_by_agent_user_id:isUuid(session?.profile?.id)?session.profile.id:null};if(!id)body.created_by_agent_user_id=isUuid(session?.profile?.id)?session.profile.id:null;const saved=id?arr(await restRequest({table:"inventory_dated_inventory",method:"PATCH",query:{id:qeq(id)},body,prefer:"return=representation"}))[0]:arr(await restRequest({table:"inventory_dated_inventory",method:"POST",body,prefer:"return=representation"}))[0];await auditInventory(session,id?"DATED_UPDATED":"DATED_CREATED","inventory_dated_inventory",saved?.id||id,"Dated inventory saved.",{entityId,serviceDate:body.service_date});return{ok:true,item:datedRow(saved||body)}});

export const saveAirInventoryRow=webMethod(Permissions.SiteMember,async(input={})=>{const session=await requireAdmin();const kind=clean(input.kind,20),spec=AIR_TABLES[kind];if(!spec)throw new Error("AIR_INVENTORY_KIND_INVALID");const item=obj(input.item);const id=clean(item.id,80);const body=pick(item,spec.allowed);if(item.payload!==undefined)body.payload=obj(item.payload);const saved=id?arr(await restRequest({table:spec.table,method:"PATCH",query:{id:qeq(id)},body,prefer:"return=representation"}))[0]:arr(await restRequest({table:spec.table,method:"POST",body:{...body,created_by_agent_user_id:isUuid(session?.profile?.id)?session.profile.id:null},prefer:"return=representation"}))[0];await auditInventory(session,"AIR_INVENTORY_SAVED",spec.table,saved?.id||id,`${kind} record saved.`,{});return{ok:true,kind,item:saved||body}});

export const getInventoryQualityReport=webMethod(Permissions.SiteMember,async()=>{await requireAdmin();const [airlineRows,aircraftRows,cabins,views,hotspots,scenes,sceneHotspots,canonical]=await Promise.all([select("travel_info_airlines",{select:"*",active:"eq.true"}),select("travel_info_aircraft",{select:"*",active:"eq.true"}),select("travel_info_aircraft_cabins",{select:"*",active:"eq.true"}),select("travel_info_aircraft_views",{select:"id,aircraft_id,cabin_id,image_url,is_default,active",active:"eq.true"}),select("travel_info_aircraft_hotspots",{select:"*",active:"eq.true"}),select("travel_info_aircraft_walk_scenes",{select:"*",active:"eq.true"}),select("travel_info_aircraft_scene_hotspots",{select:"*",active:"eq.true"}),select("inventory_canonical_entities_v",{select:"id,entity_type,status,active,customer_visible,staff_visible,altea_visible,parent_entity_id,source_table",limit:"2500"})]);const cabinSum=new Map(),cabinCount=new Map();cabins.forEach(c=>{const id=clean(c.aircraft_id,80);cabinSum.set(id,(cabinSum.get(id)||0)+num(c.seat_count,0));cabinCount.set(id,(cabinCount.get(id)||0)+1)});const mismatches=aircraftRows.filter(a=>num(a.total_seats,0)!==(cabinSum.get(clean(a.id,80))||0));const noCabins=aircraftRows.filter(a=>!cabinCount.get(clean(a.id,80)));const noViews=aircraftRows.filter(a=>!views.some(v=>clean(v.aircraft_id,80)===clean(a.id,80)));const publicWithoutMedia=canonical.filter(r=>r.active===true&&r.customer_visible===true&&upper(r.status,30)==="PUBLISHED"&&["HOTEL","DESTINATION","AREA"].includes(upper(r.entity_type,40))).filter(r=>!arr(r.media).length);return{ok:true,generatedAt:new Date().toISOString(),aircraftSync:computeSyncHealth(airlineRows,aircraftRows),counts:{canonical:canonical.length,aircraft:aircraftRows.length,cabins:cabins.length,views:views.length,hotspots:hotspots.length,walkScenes:scenes.length,sceneHotspots:sceneHotspots.length},issues:{cabinSeatMismatches:mismatches.map(a=>({id:a.id,airlineCode:a.airline_code,aircraftCode:a.aircraft_code,name:a.aircraft_name,totalSeats:a.total_seats,cabinSeats:cabinSum.get(clean(a.id,80))||0})),aircraftWithoutCabins:noCabins.map(a=>({id:a.id,airlineCode:a.airline_code,aircraftCode:a.aircraft_code,name:a.aircraft_name})),aircraftWithoutViews:noViews.map(a=>({id:a.id,airlineCode:a.airline_code,aircraftCode:a.aircraft_code,name:a.aircraft_name})),publicRecordsWithoutMedia:publicWithoutMedia.length}}});
