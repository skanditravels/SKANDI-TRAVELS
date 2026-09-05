import { webMethod, Permissions } from "wix-web-module";
import { currentMember } from "wix-members-backend";
import { getSecret } from "wix-secrets-backend";
import { fetch } from "wix-fetch";
import {
  findAgentByMemberOrEmail,
  isAgentAuthorized,
  publicAgent
} from "backend/RIA/staffPortalAuth.repository.js";

const AIRCRAFT_TABLE="travel_info_aircraft";
const CABIN_TABLE="travel_info_aircraft_cabins";
const VIEW_TABLE="travel_info_aircraft_views";
const HOTSPOT_TABLE="travel_info_aircraft_hotspots";
const SCENE_TABLE="travel_info_aircraft_walk_scenes";
const SCENE_HOTSPOT_TABLE="travel_info_aircraft_scene_hotspots";
const AIRLINE_TABLE="travel_info_airlines";

let supabaseConfigPromise=null;
async function readSecret(name){try{return text(await getSecret(name),10000)}catch(_){return""}}
async function supabaseConfig(){if(supabaseConfigPromise)return supabaseConfigPromise;supabaseConfigPromise=(async()=>{const[url,k1,k2]=await Promise.all([readSecret("SUPABASE_URL"),readSecret("SUPABASE_SECRET_KEY"),readSecret("SUPABASE_SERVICE_ROLE_KEY")]);const clean=url.replace(/\/+$/,"");const key=k1||k2;if(!/^https:\/\/[^/]+\.supabase\.co$/i.test(clean))throw new Error("SUPABASE_URL is missing or invalid.");if(!key)throw new Error("Supabase server key is missing.");return{url:clean,key,modern:key.startsWith("sb_secret_")}})();try{return await supabaseConfigPromise}catch(e){supabaseConfigPromise=null;throw e}}
function encodeQuery(query={}){const q=Object.entries(query).filter(([,v])=>v!==undefined&&v!==null&&v!=="").map(([k,v])=>`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join("&");return q?`?${q}`:""}
async function restRequest({table,method="GET",query={},body,prefer="return=representation"}){const{url,key,modern}=await supabaseConfig();const headers={apikey:key,Accept:"application/json","Content-Type":"application/json"};if(!modern)headers.Authorization=`Bearer ${key}`;if(prefer)headers.Prefer=prefer;const r=await fetch(`${url}/rest/v1/${table}${encodeQuery(query)}`,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});const raw=await r.text();let data=null;if(raw){try{data=JSON.parse(raw)}catch(_){data=raw}}if(!r.ok)throw new Error(`Supabase ${method} failed (${r.status}): ${typeof data==="string"?data:(data?.message||data?.error||JSON.stringify(data||{}))}`);return data}

const STATUS=new Set(["DRAFT","REVIEW","PUBLISHED","HIDDEN","SUSPENDED","ARCHIVED"]);
const VIEW_TYPES=new Set(["CABIN","SEATBACK","ROWS","FRONT","REAR","MEAL","SEATMAP","EXTERIOR","OTHER"]);
const text=(v,m=500)=>String(v??"").trim().slice(0,m);
const upper=(v,m=100)=>text(v,m).toUpperCase();
const bool=(v,f=false)=>v===undefined||v===null||v===""?f:(v===true||v==="true"||v===1||v==="1");
const int=(v,f=0)=>Number.isFinite(Number(v))?Math.round(Number(v)):f;
const num=(v,f=null)=>Number.isFinite(Number(v))?Number(v):f;
const obj=v=>v&&typeof v==="object"&&!Array.isArray(v)?v:{};
const arr=v=>Array.isArray(v)?v:[];
const first=rows=>Array.isArray(rows)&&rows.length?rows[0]:null;
const codeify=v=>text(v,100).toUpperCase().replace(/[^A-Z0-9]+/g,"_").replace(/^_+|_+$/g,"");

async function requireStaff(){
  const member=await currentMember.getMember().catch(()=>null);
  if(!member) throw new Error("Staff login required.");
  const memberId=member._id||member.id||"";
  const email=member.loginEmail||member.email||member.contactDetails?.emails?.[0]||"";
  const agent=await findAgentByMemberOrEmail({memberId,email});
  if(!agent||!isAgentAuthorized(agent)) throw new Error("You are not authorized to access Aircraft Display Control.");
  return {member,agent};
}

function mapAircraft(r={}){return{
  id:r.id||"",airlineId:r.airline_id||"",airlineCode:r.airline_code||"",aircraftCode:r.aircraft_code||"",aircraftName:r.aircraft_name||"",
  manufacturer:r.manufacturer||"",family:r.family||"",variant:r.variant||"",totalSeats:r.total_seats??null,configuration:r.configuration||{},
  displayTitle:r.display_title||"",displaySummary:r.display_summary||"",heroImageUrl:r.hero_image_url||"",exteriorImageUrl:r.exterior_image_url||"",
  seatmapImageUrl:r.seatmap_image_url||"",thumbnailImageUrl:r.thumbnail_image_url||"",defaultCabinCode:r.default_cabin_code||"",
  defaultViewType:r.default_view_type||"CABIN",walkthroughTitle:r.walkthrough_title||"",walkthroughSubtitle:r.walkthrough_subtitle||"",
  walkthroughStartSceneCode:r.walkthrough_start_scene_code||"",walkthroughAccuracyLabel:r.walkthrough_accuracy_label||"",sourceUrl:r.source_url||"",
  sourceUrls:r.source_urls||[],reviewNotes:r.review_notes||"",lastReviewed:r.last_reviewed||"",status:r.status||"DRAFT",
  customerVisible:r.customer_visible!==false,staffVisible:r.staff_visible!==false,active:r.active!==false,sortOrder:r.sort_order??100,
  source:r.source||"SKANDI",sourceReference:r.source_reference||"",updatedAt:r.updated_at||""
}}
function mapCabin(r={}){return{id:r.id||"",aircraftId:r.aircraft_id||"",cabinCode:r.cabin_code||"",cabinName:r.cabin_name||"",rank:r.rank??100,seatCount:r.seat_count??null,summary:r.summary||"",description:r.description||"",mealTitle:r.meal_title||"",mealDescription:r.meal_description||"",amenities:r.amenities||[],displaySettings:r.display_settings||{},active:r.active!==false,sortOrder:r.sort_order??100}}
function mapView(r={}){return{id:r.id||"",aircraftId:r.aircraft_id||"",cabinId:r.cabin_id||"",viewCode:r.view_code||"",label:r.label||"",viewType:r.view_type||"CABIN",imageUrl:r.image_url||"",mobileImageUrl:r.mobile_image_url||"",thumbnailUrl:r.thumbnail_url||"",altText:r.alt_text||"",caption:r.caption||"",credit:r.credit||"",isDefault:r.is_default===true,active:r.active!==false,sortOrder:r.sort_order??100}}
function mapHotspot(r={}){return{id:r.id||"",viewId:r.view_id||"",hotspotCode:r.hotspot_code||"",label:r.label||"",title:r.title||"",description:r.description||"",x:r.x??50,y:r.y??50,action:r.action||"DETAIL",focusX:r.focus_x??null,focusY:r.focus_y??null,focusZoom:r.focus_zoom??null,targetCabinCode:r.target_cabin_code||"",thumbnailUrl:r.thumbnail_url||"",active:r.active!==false,sortOrder:r.sort_order??100}}
function mapScene(r={}){return{id:r.id||"",aircraftId:r.aircraft_id||"",sceneCode:r.scene_code||"",title:r.title||"",shortTitle:r.short_title||"",summary:r.summary||"",imageUrl:r.image_url||"",mobileImageUrl:r.mobile_image_url||"",forwardSceneCode:r.forward_scene_code||"",backSceneCode:r.back_scene_code||"",forwardLabel:r.forward_label||"",backLabel:r.back_label||"",active:r.active!==false,sortOrder:r.sort_order??100}}
function mapSceneHotspot(r={}){return{id:r.id||"",sceneId:r.scene_id||"",hotspotCode:r.hotspot_code||"",label:r.label||"",title:r.title||"",description:r.description||"",hotspotType:r.hotspot_type||"FEATURE",x:r.x??50,y:r.y??50,action:r.action||"",targetCabinCode:r.target_cabin_code||"",active:r.active!==false,sortOrder:r.sort_order??100}}

async function airlineOptions(){
  const rows=await restRequest({
    table:AIRLINE_TABLE,
    query:{
      select:'"ID",title,"iataCode","icaoCode",active,status,customer_visible',
      order:'title.asc',
      limit:500
    }
  });

  return arr(rows)
    .filter(r=>r.active!==false)
    .map(r=>({
      id:r.ID||"",
      name:r.title||"",
      iataCode:r.iataCode||"",
      icaoCode:r.icaoCode||"",
      status:r.status||"PUBLISHED",
      customerVisible:r.customer_visible!==false
    }));
}

async function getBundle(aircraftId){
  const id=text(aircraftId,80); if(!id) throw new Error("Aircraft ID is required.");
  const [a,c,v,h,s,sh]=await Promise.all([
    restRequest({table:AIRCRAFT_TABLE,query:{select:"*",id:`eq.${id}`,limit:1}}),
    restRequest({table:CABIN_TABLE,query:{select:"*",aircraft_id:`eq.${id}`,order:"sort_order.asc,rank.asc,cabin_name.asc",limit:500}}),
    restRequest({table:VIEW_TABLE,query:{select:"*",aircraft_id:`eq.${id}`,order:"sort_order.asc,label.asc",limit:1000}}),
    restRequest({table:HOTSPOT_TABLE,query:{select:"*",order:"sort_order.asc,label.asc",limit:5000}}),
    restRequest({table:SCENE_TABLE,query:{select:"*",aircraft_id:`eq.${id}`,order:"sort_order.asc,title.asc",limit:1000}}),
    restRequest({table:SCENE_HOTSPOT_TABLE,query:{select:"*",order:"sort_order.asc,label.asc",limit:5000}})
  ]);
  const aircraft=first(a); if(!aircraft) throw new Error("Aircraft not found.");
  const viewIds=new Set(arr(v).map(x=>x.id)); const sceneIds=new Set(arr(s).map(x=>x.id));
  return {aircraft:mapAircraft(aircraft),cabins:arr(c).map(mapCabin),views:arr(v).map(mapView),hotspots:arr(h).filter(x=>viewIds.has(x.view_id)).map(mapHotspot),scenes:arr(s).map(mapScene),sceneHotspots:arr(sh).filter(x=>sceneIds.has(x.scene_id)).map(mapSceneHotspot)};
}

export const getAircraftDisplayBootstrap=webMethod(Permissions.SiteMember,async(input={})=>{
  const {agent}=await requireStaff();
  const query={select:"*",order:"airline_code.asc,sort_order.asc,aircraft_name.asc",limit:2000};
  if(input.airlineId) query.airline_id=`eq.${text(input.airlineId,100)}`;
  if(input.status) query.status=`eq.${upper(input.status,30)}`;
  const rows=await restRequest({table:AIRCRAFT_TABLE,query});
  const q=text(input.query,160).toLowerCase();
  const aircraft=arr(rows).map(mapAircraft).filter(x=>!q||[x.airlineCode,x.aircraftCode,x.aircraftName,x.family,x.variant].join(" ").toLowerCase().includes(q));
  return {ok:true,session:publicAgent(agent),airlines:await airlineOptions(),aircraft,lastSync:new Date().toISOString()};
});

export const getAircraftDisplayRecord=webMethod(Permissions.SiteMember,async({aircraftId}={})=>{await requireStaff();return{ok:true,...await getBundle(aircraftId)}});

export const saveAircraftDisplayRecord=webMethod(Permissions.SiteMember,async(input={})=>{
  await requireStaff();
  const id=text(input.id,80),airlineId=text(input.airlineId,120); if(!airlineId) throw new Error("Airline is required.");
const airlines=await restRequest({
  table:AIRLINE_TABLE,
  query:{
    select:'"ID",title,"iataCode"',
    "ID":`eq.${airlineId}`,
    limit:1
  }
});  const aircraftName=text(input.aircraftName,180); if(!aircraftName) throw new Error("Aircraft name is required.");
  const aircraftCode=codeify(input.aircraftCode||aircraftName); if(!aircraftCode) throw new Error("Aircraft code is required.");
  const status=STATUS.has(upper(input.status,30))?upper(input.status,30):"DRAFT";
  const viewType=VIEW_TYPES.has(upper(input.defaultViewType,30))?upper(input.defaultViewType,30):"CABIN";
  const row={airline_id:airlineId,airline_code:text(airline.iataCode,20),aircraft_code:aircraftCode,aircraft_name:aircraftName,manufacturer:text(input.manufacturer,100),family:text(input.family,120),variant:text(input.variant,120),total_seats:int(input.totalSeats,null),configuration:obj(input.configuration),display_title:text(input.displayTitle||aircraftName,180),display_summary:text(input.displaySummary,4000),hero_image_url:text(input.heroImageUrl,3000),exterior_image_url:text(input.exteriorImageUrl,3000),seatmap_image_url:text(input.seatmapImageUrl,3000),thumbnail_image_url:text(input.thumbnailImageUrl,3000),default_cabin_code:codeify(input.defaultCabinCode),default_view_type:viewType,walkthrough_title:text(input.walkthroughTitle,220),walkthrough_subtitle:text(input.walkthroughSubtitle,2000),walkthrough_start_scene_code:codeify(input.walkthroughStartSceneCode),walkthrough_accuracy_label:text(input.walkthroughAccuracyLabel,500),source_url:text(input.sourceUrl,3000),source_urls:arr(input.sourceUrls).map(x=>text(x,3000)).filter(Boolean),review_notes:text(input.reviewNotes,4000),last_reviewed:text(input.lastReviewed,10)||null,status,customer_visible:bool(input.customerVisible,true),staff_visible:bool(input.staffVisible,true),active:bool(input.active,true),sort_order:int(input.sortOrder,100),source:"SKANDI",source_reference:"aircraft-display-control",updated_at:new Date().toISOString()};
  const rows=await restRequest({table:AIRCRAFT_TABLE,method:id?"PATCH":"POST",query:id?{id:`eq.${id}`}:{},body:id?row:{...row},prefer:"return=representation"});
  const saved=first(rows); return{ok:true,aircraft:mapAircraft(saved)};
});

export const deleteAircraftDisplayRecord=webMethod(Permissions.SiteMember,async({id}={})=>{await requireStaff();const rid=text(id,80);if(!rid)throw new Error("Aircraft ID is required.");await restRequest({table:AIRCRAFT_TABLE,method:"DELETE",query:{id:`eq.${rid}`},prefer:"return=minimal"});return{ok:true,id:rid}});

export const saveAircraftCabin=webMethod(Permissions.SiteMember,async(input={})=>{await requireStaff();const id=text(input.id,80),aircraftId=text(input.aircraftId,80);if(!aircraftId)throw new Error("Aircraft is required.");const cabinName=text(input.cabinName,160);if(!cabinName)throw new Error("Cabin name is required.");const row={aircraft_id:aircraftId,cabin_code:codeify(input.cabinCode||cabinName),cabin_name:cabinName,rank:int(input.rank,100),seat_count:int(input.seatCount,null),summary:text(input.summary,2000),description:text(input.description,5000),meal_title:text(input.mealTitle,300),meal_description:text(input.mealDescription,3000),amenities:arr(input.amenities).map(x=>text(x,300)).filter(Boolean),display_settings:obj(input.displaySettings),active:bool(input.active,true),sort_order:int(input.sortOrder,100),updated_at:new Date().toISOString()};const rows=await restRequest({table:CABIN_TABLE,method:id?"PATCH":"POST",query:id?{id:`eq.${id}`}:{},body:row});return{ok:true,cabin:mapCabin(first(rows))}});
export const deleteAircraftCabin=webMethod(Permissions.SiteMember,async({id}={})=>{await requireStaff();await restRequest({table:CABIN_TABLE,method:"DELETE",query:{id:`eq.${text(id,80)}`},prefer:"return=minimal"});return{ok:true}});

export const saveAircraftView=webMethod(Permissions.SiteMember,async(input={})=>{await requireStaff();const id=text(input.id,80),aircraftId=text(input.aircraftId,80);const imageUrl=text(input.imageUrl,3000);if(!aircraftId||!imageUrl)throw new Error("Aircraft and image URL are required.");const vt=VIEW_TYPES.has(upper(input.viewType,30))?upper(input.viewType,30):"CABIN";const row={aircraft_id:aircraftId,cabin_id:text(input.cabinId,80)||null,view_code:codeify(input.viewCode||input.label||vt),label:text(input.label,180)||vt,view_type:vt,image_url:imageUrl,mobile_image_url:text(input.mobileImageUrl,3000),thumbnail_url:text(input.thumbnailUrl,3000),alt_text:text(input.altText,500),caption:text(input.caption,1000),credit:text(input.credit,500),is_default:bool(input.isDefault,false),active:bool(input.active,true),sort_order:int(input.sortOrder,100),updated_at:new Date().toISOString()};if(row.is_default){await restRequest({table:VIEW_TABLE,method:"PATCH",query:{aircraft_id:`eq.${aircraftId}`},body:{is_default:false}}).catch(()=>null)}const rows=await restRequest({table:VIEW_TABLE,method:id?"PATCH":"POST",query:id?{id:`eq.${id}`}:{},body:row});return{ok:true,view:mapView(first(rows))}});
export const deleteAircraftView=webMethod(Permissions.SiteMember,async({id}={})=>{await requireStaff();await restRequest({table:VIEW_TABLE,method:"DELETE",query:{id:`eq.${text(id,80)}`},prefer:"return=minimal"});return{ok:true}});

export const saveAircraftHotspot=webMethod(Permissions.SiteMember,async(input={})=>{await requireStaff();const id=text(input.id,80),viewId=text(input.viewId,80);if(!viewId)throw new Error("View is required.");const label=text(input.label,160);if(!label)throw new Error("Label is required.");const row={view_id:viewId,hotspot_code:codeify(input.hotspotCode||label),label,title:text(input.title||label,200),description:text(input.description,2000),x:num(input.x,50),y:num(input.y,50),action:upper(input.action||"DETAIL",50),focus_x:num(input.focusX,null),focus_y:num(input.focusY,null),focus_zoom:num(input.focusZoom,null),target_cabin_code:codeify(input.targetCabinCode),thumbnail_url:text(input.thumbnailUrl,3000),active:bool(input.active,true),sort_order:int(input.sortOrder,100),updated_at:new Date().toISOString()};const rows=await restRequest({table:HOTSPOT_TABLE,method:id?"PATCH":"POST",query:id?{id:`eq.${id}`}:{},body:row});return{ok:true,hotspot:mapHotspot(first(rows))}});
export const deleteAircraftHotspot=webMethod(Permissions.SiteMember,async({id}={})=>{await requireStaff();await restRequest({table:HOTSPOT_TABLE,method:"DELETE",query:{id:`eq.${text(id,80)}`},prefer:"return=minimal"});return{ok:true}});

export const saveAircraftWalkScene=webMethod(Permissions.SiteMember,async(input={})=>{await requireStaff();const id=text(input.id,80),aircraftId=text(input.aircraftId,80),title=text(input.title,200),imageUrl=text(input.imageUrl,3000);if(!aircraftId||!title||!imageUrl)throw new Error("Aircraft, title and image URL are required.");const row={aircraft_id:aircraftId,scene_code:codeify(input.sceneCode||title),title,short_title:text(input.shortTitle,120),summary:text(input.summary,2000),image_url:imageUrl,mobile_image_url:text(input.mobileImageUrl,3000),forward_scene_code:codeify(input.forwardSceneCode),back_scene_code:codeify(input.backSceneCode),forward_label:text(input.forwardLabel,160),back_label:text(input.backLabel,160),active:bool(input.active,true),sort_order:int(input.sortOrder,100),updated_at:new Date().toISOString()};const rows=await restRequest({table:SCENE_TABLE,method:id?"PATCH":"POST",query:id?{id:`eq.${id}`}:{},body:row});return{ok:true,scene:mapScene(first(rows))}});
export const deleteAircraftWalkScene=webMethod(Permissions.SiteMember,async({id}={})=>{await requireStaff();await restRequest({table:SCENE_TABLE,method:"DELETE",query:{id:`eq.${text(id,80)}`},prefer:"return=minimal"});return{ok:true}});

export const saveAircraftSceneHotspot=webMethod(Permissions.SiteMember,async(input={})=>{await requireStaff();const id=text(input.id,80),sceneId=text(input.sceneId,80),label=text(input.label,160);if(!sceneId||!label)throw new Error("Scene and label are required.");const row={scene_id:sceneId,hotspot_code:codeify(input.hotspotCode||label),label,title:text(input.title||label,200),description:text(input.description,2000),hotspot_type:upper(input.hotspotType||"FEATURE",50),x:num(input.x,50),y:num(input.y,50),action:upper(input.action,50),target_cabin_code:codeify(input.targetCabinCode),active:bool(input.active,true),sort_order:int(input.sortOrder,100),updated_at:new Date().toISOString()};const rows=await restRequest({table:SCENE_HOTSPOT_TABLE,method:id?"PATCH":"POST",query:id?{id:`eq.${id}`}:{},body:row});return{ok:true,hotspot:mapSceneHotspot(first(rows))}});
export const deleteAircraftSceneHotspot=webMethod(Permissions.SiteMember,async({id}={})=>{await requireStaff();await restRequest({table:SCENE_HOTSPOT_TABLE,method:"DELETE",query:{id:`eq.${text(id,80)}`},prefer:"return=minimal"});return{ok:true}});
