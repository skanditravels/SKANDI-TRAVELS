import { webMethod, Permissions } from "wix-web-module";
import { currentMember } from "wix-members-backend";
import { getSecret } from "wix-secrets-backend";
import { fetch } from "wix-fetch";
import { findAgentByMemberOrEmail, isAgentAuthorized } from "./staffPortalAuth.repository.js";

const URL_SECRET="SUPABASE_URL";
const KEY_SECRET="SUPABASE_SERVICE_ROLE_KEY";
const AIRCRAFT_ASSET_BUCKET="aircraft-assets";
const AIRLINE_RPC="get_aircraft_display_airlines";
const AIRLINE_VIEW="aircraft_display_airlines";
const AIRLINE_LEGACY_TABLE="travel_info_airlines";
const MAX_AIRCRAFT_ASSET_BYTES=15*1024*1024;
const T={airlines:"aircraft_display_airlines",aircraft:"travel_info_aircraft",cabins:"travel_info_aircraft_cabins",views:"travel_info_aircraft_views",hotspots:"travel_info_aircraft_hotspots",scenes:"travel_info_aircraft_walk_scenes",sceneHotspots:"travel_info_aircraft_scene_hotspots"};
let cfgCache=null;
let airlineCatalogCache={rows:null,expiresAt:0};
let lastAirlineSource="";
let lastAirlineReadErrors=[];

const text=(v,m=1000)=>String(v??"").trim().slice(0,m);
const upper=(v,m=100)=>text(v,m).toUpperCase();
const integer=(v,f=null)=>v===""||v==null?f:(Number.isFinite(Number(v))?Math.round(Number(v)):f);
const number=(v,f=null)=>v===""||v==null?f:(Number.isFinite(Number(v))?Number(v):f);
const bool=(v,f=true)=>v===true||v==="true"||v===1||v==="1"?true:v===false||v==="false"||v===0||v==="0"?false:f;
const uuid=v=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(v||""));
const obj=v=>v&&typeof v==="object"&&!Array.isArray(v)?v:{};
const arr=v=>Array.isArray(v)?v:(v==null||v===""?[]:[v]);
const uniq=v=>[...new Set((v||[]).map(x=>text(x,2000)).filter(Boolean))];
function parse(v,f){if(v==null||v==="")return f;if(typeof v==="object")return v;try{return JSON.parse(String(v))??f}catch(_){return f}}
function qs(q={}){const s=Object.entries(q).filter(([,v])=>v!==undefined&&v!==null&&v!=="").map(([k,v])=>`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join("&");return s?`?${s}`:""}

async function config(){if(cfgCache?.url&&cfgCache?.key)return cfgCache;const url=String(await getSecret(URL_SECRET)||"").replace(/\/$/,"");const key=String(await getSecret(KEY_SECRET)||"").trim();if(!url||!key)throw new Error("Supabase secrets are missing.");cfgCache={url,key};return cfgCache}
async function db(table,query={},options={}){const {url,key}=await config();const r=await fetch(`${url}/rest/v1/${table}${qs(query)}`,{method:options.method||"GET",headers:{apikey:key,Authorization:`Bearer ${key}`,"Content-Type":"application/json",...(options.prefer?{Prefer:options.prefer}:{}),...(options.headers||{})},body:options.body===undefined?undefined:JSON.stringify(options.body)});const raw=await r.text();let p=null;if(raw){try{p=JSON.parse(raw)}catch(_){p=raw}}if(!r.ok)throw new Error(p?.message||p?.error||`Supabase ${table} request failed (${r.status}).`);return p}


async function rpc(name,body={}){
  const {url,key}=await config();
  const response=await fetch(
    `${url}/rest/v1/rpc/${encodeURIComponent(name)}`,
    {
      method:"POST",
      headers:{
        apikey:key,
        Authorization:`Bearer ${key}`,
        "Content-Type":"application/json"
      },
      body:JSON.stringify(body||{})
    }
  );

  const raw=await response.text();
  let payload=null;

  if(raw){
    try{payload=JSON.parse(raw)}
    catch(_){payload=raw}
  }

  if(!response.ok){
    throw new Error(
      payload?.message||
      payload?.error||
      `Supabase RPC ${name} failed (${response.status}).`
    );
  }

  return payload;
}


function storageObjectPath(path=""){
  return String(path||"")
    .split("/")
    .map(encodeURIComponent)
    .join("/");
}
function storagePublicUrl(baseUrl,bucket,path){
  return `${String(baseUrl||"").replace(/\/$/,"")}/storage/v1/object/public/${encodeURIComponent(bucket)}/${storageObjectPath(path)}`;
}
function cleanAssetPart(value,fallback="asset"){
  const part=String(value||"")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g,"-")
    .replace(/-+/g,"-")
    .replace(/^-|-$/g,"")
    .slice(0,100);
  return part||fallback;
}
function assetExtension(mime=""){
  const m=String(mime||"").toLowerCase();
  if(m==="image/jpeg"||m==="image/jpg")return"jpg";
  if(m==="image/png")return"png";
  if(m==="image/webp")return"webp";
  if(m==="image/avif")return"avif";
  if(m==="image/gif")return"gif";
  return"";
}
function assetObjectPath(input={}){
  const aircraftPart=cleanAssetPart(
    input.aircraftCode||
    input.aircraft_code||
    input.aircraftId||
    input.aircraft_id||
    "draft-aircraft",
    "draft-aircraft"
  );
  const scope=cleanAssetPart(input.scope||"aircraft","aircraft");
  const role=cleanAssetPart(input.assetRole||input.asset_role||"image","image");
  const recordPart=cleanAssetPart(
    input.recordCode||
    input.record_code||
    input.recordId||
    input.record_id||
    scope,
    scope
  );
  const ext=assetExtension(input.mimeType||input.mime_type||"");
  const stamp=new Date().toISOString().replace(/[-:.TZ]/g,"").slice(0,14);
  const random=Math.random().toString(36).slice(2,9);

  if(scope==="aircraft"){
    return `aircraft/${aircraftPart}/${role}/${stamp}-${random}.${ext}`;
  }
  return `aircraft/${aircraftPart}/${scope}/${recordPart}/${role}-${stamp}-${random}.${ext}`;
}
async function createSignedAircraftAssetUpload(input={}){
  await requireStaff(true);

  const mime=text(input.mimeType||input.mime_type||"",120).toLowerCase();
  const ext=assetExtension(mime);
  const size=Number(input.size||input.fileSize||input.file_size||0);

  if(!ext){
    throw new Error("Only JPEG, PNG, WebP, AVIF and GIF images are allowed.");
  }
  if(!Number.isFinite(size)||size<=0){
    throw new Error("Image file size is required.");
  }
  if(size>MAX_AIRCRAFT_ASSET_BYTES){
    throw new Error("Aircraft image is too large. Maximum size is 15 MB.");
  }

  const objectPath=assetObjectPath({...input,mimeType:mime});
  const {url,key}=await config();

  const response=await fetch(
    `${url}/storage/v1/object/upload/sign/${encodeURIComponent(AIRCRAFT_ASSET_BUCKET)}/${storageObjectPath(objectPath)}`,
    {
      method:"POST",
      headers:{
        apikey:key,
        Authorization:`Bearer ${key}`,
        "Content-Type":"application/json"
      },
      body:"{}"
    }
  );

  const raw=await response.text();
  let data=null;
  if(raw){
    try{data=JSON.parse(raw)}catch(_){data=raw}
  }

  if(!response.ok){
    throw new Error(
      data?.message||
      data?.error||
      `Could not create aircraft asset upload (${response.status}).`
    );
  }

  let signedUrl=String(
    data?.signedUrl||
    data?.signedURL||
    data?.url||
    ""
  ).trim();

  if(!signedUrl){
    throw new Error("Supabase did not return a signed aircraft asset upload URL.");
  }

  if(!/^https?:\/\//i.test(signedUrl)){
    if(signedUrl.startsWith("/storage/v1/")){
      signedUrl=`${url}${signedUrl}`;
    }else if(signedUrl.startsWith("/object/")){
      signedUrl=`${url}/storage/v1${signedUrl}`;
    }else{
      signedUrl=`${url}/storage/v1/${signedUrl.replace(/^\/+/,"")}`;
    }
  }

  return{
    ok:true,
    bucket:AIRCRAFT_ASSET_BUCKET,
    objectPath,
    signedUrl,
    token:String(data?.token||""),
    publicUrl:storagePublicUrl(url,AIRCRAFT_ASSET_BUCKET,objectPath),
    mimeType:mime,
    size,
    fileName:text(input.fileName||input.file_name||"",240),
    assetRole:text(input.assetRole||input.asset_role||"image",80),
    scope:text(input.scope||"aircraft",80)
  };
}

function displayName(a={}){return a.preferred_name||a.display_name||a.full_name||[a.first_name,a.last_name].filter(Boolean).join(" ")||a.email||a.sk_id||"Staff"}
function role(a={}){return text(a.role||a.job_title||a.position||"",100)}
function canManage(a={}){if(a.can_manage===true||a.canManage===true)return true;return new Set(["owner","company_owner","admin","super_admin","superadmin","manager","operations_manager","operations_admin","travel_info_admin","altea_admin","content_admin"]).has(role(a).toLowerCase().replace(/[\s-]+/g,"_"))}
async function requireStaff(write=false){const m=await currentMember.getMember().catch(()=>null);if(!m)throw new Error("Staff login required.");const agent=await findAgentByMemberOrEmail({memberId:m._id||m.id||"",email:m.loginEmail||m.email||m.contactDetails?.emails?.[0]||""});if(!agent||!isAgentAuthorized(agent))throw new Error("You are not authorized to access Aircraft Display Control.");if(write&&!canManage(agent))throw new Error("Aircraft Display Control write permission required.");return agent}
function session(a={}){return{id:a.id||"",skId:a.sk_id||"",displayName:displayName(a),email:a.email||a.corporate_email_address||"",role:role(a),department:a.department||"",base:a.base||a.station||"",canManageAircraft:canManage(a)}}

function infer(name="",code=""){const s=`${name} ${code}`.toUpperCase();let manufacturer="";if(s.includes("AIRBUS")||/\bA(220|300|310|318|319|320|321|330|340|350|380)\b/.test(s))manufacturer="Airbus";else if(s.includes("BOEING")||/\b(707|717|727|737|747|757|767|777|787)\b/.test(s)||/\b7M[789]\b/.test(s))manufacturer="Boeing";else if(s.includes("EMBRAER")||/\bE(170|175|190|195)\b/.test(s))manufacturer="Embraer";else if(s.includes("ATR"))manufacturer="ATR";else if(s.includes("DASH 8")||s.includes("DHC-")||s.includes("DE HAVILLAND"))manufacturer="De Havilland Canada";else if(s.includes("BOMBARDIER")||s.includes("CRJ"))manufacturer="Bombardier";let family="";if(/A220|221|223/.test(s))family="A220";else if(/A3(18|19|20|21)|\b31[89]\b|\b32[A-Z0-9]\b/.test(s))family="A320 Family";else if(/A330|\b33[A-Z0-9]\b/.test(s))family="A330";else if(/A340|\b34[346]\b/.test(s))family="A340";else if(/A350|\b35[19]\b/.test(s))family="A350";else if(/A380|\b388\b/.test(s))family="A380";else if(/737|\b73[A-Z0-9]\b|\b7M[789]\b/.test(s))family="737";else if(/747|\b74[A-Z0-9]\b/.test(s))family="747";else if(/757|\b75[A-Z0-9]\b/.test(s))family="757";else if(/767|\b76[A-Z0-9]\b/.test(s))family="767";else if(/777|\b77[A-Z0-9]\b/.test(s))family="777";else if(/787|\b78[A-Z0-9]\b/.test(s))family="787 Dreamliner";else if(/E170|E175|E190|E195/.test(s))family="E-Jet";else if(/ATR\s*72|AT7/.test(s))family="ATR 72";let variant=text(name,180);if(manufacturer&&variant.toLowerCase().startsWith(manufacturer.toLowerCase()))variant=variant.slice(manufacturer.length).trim();return{manufacturer,family,variant}}
function cabinCode(name=""){const k=upper(name,120);if(k.includes("FIRST")||k==="F")return"F";if(k.includes("BUSINESS")||k.includes("CLUB")||k.includes("DELTA ONE")||k.includes("POLARIS")||k.includes("SIGNATURE")||k.includes("ROYAL SILK")||k.includes("MINT")||k.includes("SAGA PREMIUM"))return"J";if(k.includes("PREMIUM ECONOMY")||k.includes("PREMIUM COMFORT")||k.includes("PREMIUM SELECT")||k.includes("WORLD TRAVELLER PLUS")||k==="PREMIUM")return"W";if(k.includes("ECONOMY")||k.includes("MAIN CABIN")||k.includes("WORLD TRAVELLER")||k==="CORE"||k==="GO")return"Y";return k.replace(/[^A-Z0-9]/g,"").slice(0,4)||"CAB"}
const cabinRank=c=>({F:10,J:20,W:30,Y:40}[upper(c,10)]||100);
function cabinTemplates(configuration={}){return Object.entries(obj(configuration)).map(([name,seats],i)=>{const code=cabinCode(name),count=integer(seats,null);return{cabinCode:code,cabinName:text(name,160),rank:cabinRank(code),seatCount:count,summary:count==null?text(name,160):`${text(name,160)} · ${count} seats`,description:count==null?`${text(name,160)} cabin.`:`${text(name,160)} cabin with ${count} seats in this published aircraft configuration.`,amenities:[],active:true,sortOrder:cabinRank(code)+i}}).sort((a,b)=>a.rank-b.rank||a.sortOrder-b.sortOrder)}

function mapAirline(row={}){
  const inventory=obj(row.inventory_details);

  const a={
    id:text(
      row.airline_id||
      row.ID||
      row.id||
      row["Record ID"]||
      "",
      160
    ),
    name:text(
      row.airline_name||
      row.Title||
      row.title||
      "",
      220
    ),
    shortName:text(
      row.short_name||
      row.shortName||
      row.airline_name||
      row.Title||
      "",
      160
    ),
    iataCode:upper(
      row.iata_code||
      row.iataCode||
      inventory.iata||
      "",
      20
    ),
    icaoCode:upper(
      row.icao_code||
      row.icaoCode||
      inventory.icao||
      "",
      20
    ),
    website:text(
      row.website||
      inventory.website||
      "",
      1600
    ),
    summary:text(
      row.summary||
      "",
      4000
    ),
    heroAircraftUrl:text(
      row.hero_aircraft_url||
      row.heroAircraftUrl||
      inventory.heroImageUrl||
      inventory.heroAircraftUrl||
      "",
      2000
    ),
    aircraftFamiliesText:text(
      row.aircraft_families_text||
      row.aircraftFamiliesText||
      "",
      4000
    ),
    aircraftConfigLastReviewed:text(
      row.aircraft_config_last_reviewed||
      row.aircraftConfigLastReviewed||
      "",
      80
    ),
    aircraftConfigSourceUrls:arr(
      parse(
        row.aircraft_config_source_urls_json||
        row.aircraftConfigSourceUrlsJson||
        [],
        []
      )
    )
      .map(x=>text(x,1600))
      .filter(Boolean),
    reviewNotes:text(
      row.aircraft_config_review_notes||
      row.aircraftConfigReviewNotes||
      "",
      5000
    ),
    active:row.active!==false,
    staffVisible:row.staff_visible!==false,
    status:upper(row.status||"",40),
    slug:text(row.slug||row["Record ID"]||"",180)
  };

  const raw=parse(
    row.aircraft_configurations_json||
    row.aircraftConfigurationsJson||
    inventory.aircraftConfigurationsJson||
    [],
    []
  );

  a.aircraftConfigurations=
    (Array.isArray(raw)?raw:[])
      .map((c,i)=>normalizeTemplate(a,c,i))
      .filter(t=>t.aircraftCode||t.aircraftName);

  return a;
}

function normalizeTemplate(a,c={},i=0){const aircraftName=text(c.aircraftName||c.name||c.aircraft||"",220),aircraftCode=upper(c.aircraftCode||c.code||c.iataCode||"",80),totalSeats=integer(c.totalSeats??c.seats,null),configuration=obj(c.configuration||c.cabins||{}),inf=infer(aircraftName,aircraftCode),cabins=cabinTemplates(configuration),sourceUrl=text(c.sourceUrl||c.source||"",1600),sourceUrls=uniq([sourceUrl,...arr(a.aircraftConfigSourceUrls)]),airlineLabel=a.shortName||a.name||a.iataCode||"",notes=text(c.notes||c.summary||"",4000),displayTitle=aircraftName&&airlineLabel&&!aircraftName.toLowerCase().includes(airlineLabel.toLowerCase())?`${airlineLabel} ${aircraftName}`:aircraftName;return{templateId:`${a.id}:${aircraftCode||"AIRCRAFT"}:${totalSeats??"NA"}:${i}`,airlineId:a.id,airlineName:a.name,airlineCode:a.iataCode||a.icaoCode||a.id,aircraftCode,aircraftName,manufacturer:inf.manufacturer,family:inf.family,variant:inf.variant,totalSeats,configuration,cabinTemplates:cabins,defaultCabinCode:cabins[0]?.cabinCode||"",displayTitle,displaySummary:notes||(aircraftName&&totalSeats?`${aircraftName} configured with ${totalSeats} seats.`:aircraftName),heroImageUrl:a.heroAircraftUrl||"",thumbnailImageUrl:a.heroAircraftUrl||"",sourceUrl,sourceUrls,reviewNotes:notes,lastReviewed:a.aircraftConfigLastReviewed||"",walkthroughTitle:aircraftName?`Explore the ${aircraftName}`:"Explore the aircraft",walkthroughSubtitle:"Take a look around the cabin before you fly.",walkthroughAccuracyLabel:"Aircraft and cabin configuration are representative and may vary by operating aircraft.",operatorBrand:text(c.operatorBrand||a.shortName||a.name,180),notes}}

function mapAircraft(r={}){return{id:r.id||"",airlineId:r.airline_id||"",airlineCode:r.airline_code||"",aircraftCode:r.aircraft_code||"",aircraftName:r.aircraft_name||"",manufacturer:r.manufacturer||"",family:r.family||"",variant:r.variant||"",totalSeats:r.total_seats??null,configuration:obj(r.configuration),displayTitle:r.display_title||"",displaySummary:r.display_summary||"",heroImageUrl:r.hero_image_url||"",exteriorImageUrl:r.exterior_image_url||"",seatmapImageUrl:r.seatmap_image_url||"",thumbnailImageUrl:r.thumbnail_image_url||"",defaultCabinCode:r.default_cabin_code||"",defaultViewType:r.default_view_type||"CABIN",walkthroughTitle:r.walkthrough_title||"",walkthroughSubtitle:r.walkthrough_subtitle||"",walkthroughStartSceneCode:r.walkthrough_start_scene_code||"",walkthroughAccuracyLabel:r.walkthrough_accuracy_label||"",sourceUrl:r.source_url||"",sourceUrls:Array.isArray(r.source_urls)?r.source_urls:[],reviewNotes:r.review_notes||"",lastReviewed:r.last_reviewed||"",status:r.status||"DRAFT",customerVisible:r.customer_visible!==false,staffVisible:r.staff_visible!==false,active:r.active!==false,sortOrder:r.sort_order??100,source:r.source||"SKANDI",sourceReference:r.source_reference||"",createdAt:r.created_at||"",updatedAt:r.updated_at||""}}
function mapCabin(r={}){return{id:r.id||"",aircraftId:r.aircraft_id||"",cabinCode:r.cabin_code||"",cabinName:r.cabin_name||"",rank:r.rank??100,seatCount:r.seat_count??null,summary:r.summary||"",description:r.description||"",mealTitle:r.meal_title||"",mealDescription:r.meal_description||"",amenities:Array.isArray(r.amenities)?r.amenities:[],displaySettings:obj(r.display_settings),active:r.active!==false,sortOrder:r.sort_order??100,updatedAt:r.updated_at||""}}
function mapView(r={}){return{id:r.id||"",aircraftId:r.aircraft_id||"",cabinId:r.cabin_id||"",viewCode:r.view_code||"",label:r.label||"",viewType:r.view_type||"CABIN",imageUrl:r.image_url||"",mobileImageUrl:r.mobile_image_url||"",thumbnailUrl:r.thumbnail_url||"",altText:r.alt_text||"",caption:r.caption||"",credit:r.credit||"",isDefault:r.is_default===true,active:r.active!==false,sortOrder:r.sort_order??100,updatedAt:r.updated_at||""}}
function mapHotspot(r={}){return{id:r.id||"",viewId:r.view_id||"",hotspotCode:r.hotspot_code||"",label:r.label||"",title:r.title||"",description:r.description||"",x:number(r.x,50),y:number(r.y,50),action:r.action||"DETAIL",focusX:number(r.focus_x,null),focusY:number(r.focus_y,null),focusZoom:number(r.focus_zoom,null),targetCabinCode:r.target_cabin_code||"",thumbnailUrl:r.thumbnail_url||"",active:r.active!==false,sortOrder:r.sort_order??100}}
function mapScene(r={}){return{id:r.id||"",aircraftId:r.aircraft_id||"",sceneCode:r.scene_code||"",title:r.title||"",shortTitle:r.short_title||"",summary:r.summary||"",imageUrl:r.image_url||"",mobileImageUrl:r.mobile_image_url||"",forwardSceneCode:r.forward_scene_code||"",backSceneCode:r.back_scene_code||"",forwardLabel:r.forward_label||"",backLabel:r.back_label||"",active:r.active!==false,sortOrder:r.sort_order??100}}
function mapSceneHotspot(r={}){return{id:r.id||"",sceneId:r.scene_id||"",hotspotCode:r.hotspot_code||"",label:r.label||"",title:r.title||"",description:r.description||"",hotspotType:r.hotspot_type||"FEATURE",x:number(r.x,50),y:number(r.y,50),action:r.action||"",targetCabinCode:r.target_cabin_code||"",active:r.active!==false,sortOrder:r.sort_order??100}}

async function rawAirlineCatalog(force=false){
  const now=Date.now();

  if(
    !force &&
    Array.isArray(airlineCatalogCache.rows) &&
    airlineCatalogCache.expiresAt>now
  ){
    return airlineCatalogCache.rows;
  }

  const errors=[];
  let rows=null;
  let source="";

  // 1) Primary path: dedicated normalized RPC.
  try{
    const rpcRows=await rpc(AIRLINE_RPC,{});
    if(Array.isArray(rpcRows)&&rpcRows.length){
      rows=rpcRows;
      source=`rpc:${AIRLINE_RPC}`;
    }else{
      errors.push("Airline RPC returned no rows.");
    }
  }catch(error){
    errors.push(`RPC: ${error?.message||error}`);
  }

  // 2) Fallback: normalized view.
  if(!rows){
    try{
      const viewRows=await db(
        AIRLINE_VIEW,
        {
          select:
            "airline_id,airline_name,short_name,iata_code,icao_code,website,summary,"+
            "hero_aircraft_url,aircraft_families_text,aircraft_configurations_json,"+
            "aircraft_config_source_urls_json,aircraft_config_review_notes,"+
            "aircraft_config_last_reviewed,active,staff_visible,status,slug",
          active:"eq.true",
          order:"airline_name.asc",
          limit:1000
        }
      );

      if(Array.isArray(viewRows)&&viewRows.length){
        rows=viewRows;
        source=`view:${AIRLINE_VIEW}`;
      }else{
        errors.push("Normalized airline view returned no rows.");
      }
    }catch(error){
      errors.push(`View: ${error?.message||error}`);
    }
  }

  // 3) Final fallback: legacy source table using only known live columns.
  if(!rows){
    try{
      const legacyRows=await db(
        AIRLINE_LEGACY_TABLE,
        {
          select:
            "ID,Title,shortName,iataCode,icaoCode,website,summary,heroAircraftUrl,"+
            "aircraftFamiliesText,aircraftConfigurationsJson,aircraftConfigSourceUrlsJson,"+
            "aircraftConfigReviewNotes,aircraftConfigLastReviewed,active,staff_visible,status,slug",
          active:"eq.true",
          limit:1000
        }
      );

      if(Array.isArray(legacyRows)&&legacyRows.length){
        rows=legacyRows;
        source=`table:${AIRLINE_LEGACY_TABLE}`;
      }else{
        errors.push("Legacy airline table returned no rows.");
      }
    }catch(error){
      errors.push(`Table: ${error?.message||error}`);
    }
  }

  lastAirlineSource=source;
  lastAirlineReadErrors=errors;

  if(!Array.isArray(rows)||!rows.length){
    throw new Error(
      errors.length
        ? `Airline catalog failed. ${errors.join(" | ")}`
        : "Airline catalog returned no rows."
    );
  }

  airlineCatalogCache={
    rows,
    expiresAt:now+30000
  };

  return rows;
}

async function listAirlines(force=false){
  const rows=await rawAirlineCatalog(force);

  return rows
    .map(mapAirline)
    .filter(a=>a.id&&a.name&&a.active)
    .sort((a,b)=>a.name.localeCompare(b.name));
}

async function listAircraft(){const rows=await db(T.aircraft,{select:"*",order:"sort_order.asc,aircraft_name.asc",limit:1000});return(rows||[]).map(mapAircraft)}
async function airlineById(id){
  const key=text(id,160);
  if(!key)return null;

  const normalizedKey=upper(key,40);
  const airlines=await listAirlines();

  return airlines.find(a=>
    a.id===key ||
    a.slug===key ||
    a.iataCode===normalizedKey ||
    a.icaoCode===normalizedKey
  )||null;
}

function pickTemplate(a,input={}){let matches=a?.aircraftConfigurations||[];if(!matches.length)return{template:null,matches:[]};const code=upper(input.aircraftCode||input.aircraft_code||"",80),name=text(input.aircraftName||input.aircraft_name||"",220).toLowerCase(),seats=integer(input.totalSeats??input.total_seats,null);if(code){const x=matches.filter(t=>upper(t.aircraftCode,80)===code);if(x.length)matches=x}if(name){const x=matches.filter(t=>{const n=t.aircraftName.toLowerCase();return n===name||n.includes(name)||name.includes(n)});if(x.length)matches=x}if(seats!=null){const x=matches.filter(t=>t.totalSeats===seats);if(x.length)matches=x}return{template:matches[0]||null,matches}}

function smart(input={},a=null,t=null,overwrite=false){const currentConfig=obj(input.configuration||input.config||{}),aircraftName=text(input.aircraftName||input.aircraft_name,220)||t?.aircraftName||"",aircraftCode=upper(input.aircraftCode||input.aircraft_code,80)||t?.aircraftCode||"",inf=infer(aircraftName||t?.aircraftName||"",aircraftCode||t?.aircraftCode||"");const choose=(cur,sug)=>overwrite?(sug!==undefined&&sug!==null&&sug!==""?sug:cur):(cur!==undefined&&cur!==null&&cur!==""?cur:sug);const configuration=Object.keys(currentConfig).length?currentConfig:obj(t?.configuration),cabins=cabinTemplates(configuration),sources=uniq([...arr(input.sourceUrls||input.source_urls),...arr(t?.sourceUrls),t?.sourceUrl||""]);return{...input,airlineId:text(input.airlineId||input.airline_id,160)||a?.id||"",airlineCode:upper(input.airlineCode||input.airline_code,40)||a?.iataCode||a?.icaoCode||"",aircraftCode:choose(aircraftCode,t?.aircraftCode||aircraftCode)||"",aircraftName:choose(aircraftName,t?.aircraftName||aircraftName)||"",manufacturer:choose(text(input.manufacturer,120),t?.manufacturer||inf.manufacturer)||"",family:choose(text(input.family,120),t?.family||inf.family)||"",variant:choose(text(input.variant,180),t?.variant||inf.variant)||"",totalSeats:choose(integer(input.totalSeats??input.total_seats,null),t?.totalSeats),configuration,displayTitle:choose(text(input.displayTitle||input.display_title,260),t?.displayTitle||aircraftName)||"",displaySummary:choose(text(input.displaySummary||input.display_summary,5000),t?.displaySummary||"")||"",heroImageUrl:text(input.heroImageUrl||input.hero_image_url,2000)||t?.heroImageUrl||a?.heroAircraftUrl||"",exteriorImageUrl:text(input.exteriorImageUrl||input.exterior_image_url,2000),seatmapImageUrl:text(input.seatmapImageUrl||input.seatmap_image_url,2000),thumbnailImageUrl:text(input.thumbnailImageUrl||input.thumbnail_image_url,2000)||t?.thumbnailImageUrl||t?.heroImageUrl||a?.heroAircraftUrl||"",defaultCabinCode:choose(upper(input.defaultCabinCode||input.default_cabin_code,40),t?.defaultCabinCode||cabins[0]?.cabinCode||"")||"",defaultViewType:upper(input.defaultViewType||input.default_view_type,40)||"CABIN",walkthroughTitle:choose(text(input.walkthroughTitle||input.walkthrough_title,300),t?.walkthroughTitle||(aircraftName?`Explore the ${aircraftName}`:""))||"",walkthroughSubtitle:choose(text(input.walkthroughSubtitle||input.walkthrough_subtitle,3000),t?.walkthroughSubtitle||"")||"",walkthroughStartSceneCode:upper(input.walkthroughStartSceneCode||input.walkthrough_start_scene_code,80),walkthroughAccuracyLabel:choose(text(input.walkthroughAccuracyLabel||input.walkthrough_accuracy_label,1000),t?.walkthroughAccuracyLabel||"")||"",sourceUrl:text(input.sourceUrl||input.source_url,1600)||t?.sourceUrl||a?.website||"",sourceUrls:sources,reviewNotes:choose(text(input.reviewNotes||input.review_notes,5000),t?.reviewNotes||"")||"",lastReviewed:text(input.lastReviewed||input.last_reviewed,80)||t?.lastReviewed||"",status:["DRAFT","REVIEW","PUBLISHED","HIDDEN","SUSPENDED","ARCHIVED"].includes(upper(input.status||"DRAFT",40))?upper(input.status||"DRAFT",40):"DRAFT",customerVisible:bool(input.customerVisible??input.customer_visible,true),staffVisible:bool(input.staffVisible??input.staff_visible,true),active:bool(input.active,true),sortOrder:integer(input.sortOrder??input.sort_order,100),source:upper(input.source||"SKANDI",80)||"SKANDI",sourceReference:text(input.sourceReference||input.source_reference||(t?`airline-config:${a?.id||""}:${t.aircraftCode}:${t.totalSeats??""}`:""),1000)}}
function aircraftRow(input,a,t){const s=smart(input,a,t,false);if(!s.airlineId)throw new Error("Airline is required.");if(!s.airlineCode)throw new Error("The selected airline is missing an IATA/ICAO code.");if(!s.aircraftCode)throw new Error("Aircraft code is required. Select a fleet template or enter the code.");if(!s.aircraftName)throw new Error("Aircraft name is required.");return{airline_id:s.airlineId,airline_code:s.airlineCode,aircraft_code:s.aircraftCode,aircraft_name:s.aircraftName,manufacturer:s.manufacturer||null,family:s.family||null,variant:s.variant||null,total_seats:s.totalSeats,configuration:obj(s.configuration),display_title:s.displayTitle||null,display_summary:s.displaySummary||null,hero_image_url:s.heroImageUrl||null,exterior_image_url:s.exteriorImageUrl||null,seatmap_image_url:s.seatmapImageUrl||null,thumbnail_image_url:s.thumbnailImageUrl||null,default_cabin_code:s.defaultCabinCode||null,default_view_type:s.defaultViewType||"CABIN",walkthrough_title:s.walkthroughTitle||null,walkthrough_subtitle:s.walkthroughSubtitle||null,walkthrough_start_scene_code:s.walkthroughStartSceneCode||null,walkthrough_accuracy_label:s.walkthroughAccuracyLabel||null,source_url:s.sourceUrl||null,source_urls:uniq(s.sourceUrls||[]),review_notes:s.reviewNotes||null,last_reviewed:/^\d{4}-\d{2}-\d{2}$/.test(s.lastReviewed||"")?s.lastReviewed:null,status:s.status,customer_visible:s.customerVisible,staff_visible:s.staffVisible,active:s.active,sort_order:s.sortOrder,source:s.source||"SKANDI",source_reference:s.sourceReference||null,updated_at:new Date().toISOString()}}

async function rawAircraft(id){if(!uuid(id))throw new Error("Valid aircraft ID is required.");const rows=await db(T.aircraft,{select:"*",id:`eq.${id}`,limit:1});return rows?.[0]||null}
async function record(id){const master=await rawAircraft(id);if(!master)throw new Error("Aircraft was not found.");const[cabins,views,scenes]=await Promise.all([db(T.cabins,{select:"*",aircraft_id:`eq.${id}`,order:"rank.asc,sort_order.asc,cabin_name.asc",limit:500}),db(T.views,{select:"*",aircraft_id:`eq.${id}`,order:"sort_order.asc,label.asc",limit:500}),db(T.scenes,{select:"*",aircraft_id:`eq.${id}`,order:"sort_order.asc,title.asc",limit:500})]);const vids=(views||[]).map(x=>x.id).filter(uuid),sids=(scenes||[]).map(x=>x.id).filter(uuid);const[hotspots,sceneHotspots]=await Promise.all([vids.length?db(T.hotspots,{select:"*",view_id:`in.(${vids.join(",")})`,order:"sort_order.asc,label.asc",limit:2000}):Promise.resolve([]),sids.length?db(T.sceneHotspots,{select:"*",scene_id:`in.(${sids.join(",")})`,order:"sort_order.asc,label.asc",limit:2000}):Promise.resolve([])]);return{aircraft:mapAircraft(master),cabins:(cabins||[]).map(mapCabin),views:(views||[]).map(mapView),hotspots:(hotspots||[]).map(mapHotspot),scenes:(scenes||[]).map(mapScene),sceneHotspots:(sceneHotspots||[]).map(mapSceneHotspot),lastSync:new Date().toISOString()}}

async function saveChild(table,id,natural,body){if(id&&uuid(id)){const rows=await db(table,{id:`eq.${id}`},{method:"PATCH",body:{...body,updated_at:new Date().toISOString()},prefer:"return=representation"});return rows?.[0]||null}if(natural){const ex=await db(table,{select:"id",...natural,limit:1});if(ex?.[0]?.id){const rows=await db(table,{id:`eq.${ex[0].id}`},{method:"PATCH",body:{...body,updated_at:new Date().toISOString()},prefer:"return=representation"});return rows?.[0]||null}}const rows=await db(table,{}, {method:"POST",body,prefer:"return=representation"});return rows?.[0]||null}
async function del(table,id){if(!uuid(id))throw new Error("Valid record ID is required.");await db(table,{id:`eq.${id}`},{method:"DELETE",prefer:"return=minimal"});return{ok:true,id}}

async function syncCabins(id,overwrite=false){const a=await rawAircraft(id);if(!a)throw new Error("Aircraft was not found.");const templates=cabinTemplates(a.configuration||{});if(!templates.length)return{ok:true,created:0,updated:0,skipped:0,message:"No cabin configuration is available on this aircraft."};const existing=await db(T.cabins,{select:"*",aircraft_id:`eq.${id}`,limit:500}),byCode=new Map((existing||[]).map(x=>[upper(x.cabin_code,40),x]));let created=0,updated=0,skipped=0;for(const t of templates){const cur=byCode.get(upper(t.cabinCode,40));if(!cur){await db(T.cabins,{}, {method:"POST",body:{aircraft_id:id,cabin_code:t.cabinCode,cabin_name:t.cabinName,rank:t.rank,seat_count:t.seatCount,summary:t.summary,description:t.description,amenities:[],display_settings:{},active:true,sort_order:t.sortOrder},prefer:"return=minimal"});created++;continue}const patch={};if(overwrite||cur.seat_count==null)patch.seat_count=t.seatCount;if(overwrite||!text(cur.summary))patch.summary=t.summary;if(overwrite||!text(cur.description))patch.description=t.description;if(overwrite||!text(cur.cabin_name))patch.cabin_name=t.cabinName;if(Object.keys(patch).length){patch.updated_at=new Date().toISOString();await db(T.cabins,{id:`eq.${cur.id}`},{method:"PATCH",body:patch,prefer:"return=minimal"});updated++}else skipped++}return{ok:true,created,updated,skipped,message:`Cabin sync complete: ${created} created, ${updated} updated, ${skipped} unchanged.`}}

function smartPatch(raw,s){const p={};for(const[dbKey,key]of[["manufacturer","manufacturer"],["family","family"],["variant","variant"],["display_title","displayTitle"],["display_summary","displaySummary"],["hero_image_url","heroImageUrl"],["thumbnail_image_url","thumbnailImageUrl"],["default_cabin_code","defaultCabinCode"],["walkthrough_title","walkthroughTitle"],["walkthrough_subtitle","walkthroughSubtitle"],["walkthrough_accuracy_label","walkthroughAccuracyLabel"],["source_url","sourceUrl"],["review_notes","reviewNotes"],["source_reference","sourceReference"]])if((raw[dbKey]==null||raw[dbKey]==="")&&s[key]!=null&&s[key]!=="")p[dbKey]=s[key];if(raw.total_seats==null&&s.totalSeats!=null)p.total_seats=s.totalSeats;if((!raw.configuration||typeof raw.configuration!=="object"||Array.isArray(raw.configuration)||!Object.keys(raw.configuration).length)&&Object.keys(obj(s.configuration)).length)p.configuration=obj(s.configuration);if((!Array.isArray(raw.source_urls)||!raw.source_urls.length)&&s.sourceUrls?.length)p.source_urls=s.sourceUrls;if(!raw.last_reviewed&&/^\d{4}-\d{2}-\d{2}$/.test(s.lastReviewed||""))p.last_reviewed=s.lastReviewed;if(!raw.airline_code&&s.airlineCode)p.airline_code=s.airlineCode;if(Object.keys(p).length)p.updated_at=new Date().toISOString();return p}
async function batched(items,n,fn){const out=[];for(let i=0;i<items.length;i+=n)out.push(...await Promise.all(items.slice(i,i+n).map(fn)));return out}


export const createAircraftAssetUpload=webMethod(
  Permissions.Anyone,
  async(input={})=>{
    try{
      return await createSignedAircraftAssetUpload(input);
    }catch(e){
      throw new Error(e?.message||"Aircraft asset upload could not be prepared.");
    }
  }
);

export const completeAircraftAssetUpload=webMethod(
  Permissions.Anyone,
  async(input={})=>{
    try{
      await requireStaff(true);
      const objectPath=text(input.objectPath||input.object_path||"",1200);
      const publicUrl=text(input.publicUrl||input.public_url||"",2200);
      if(!objectPath||!objectPath.startsWith("aircraft/")){
        throw new Error("Invalid aircraft asset path.");
      }
      if(!publicUrl||!publicUrl.includes(`/storage/v1/object/public/${AIRCRAFT_ASSET_BUCKET}/`)){
        throw new Error("Invalid aircraft asset public URL.");
      }
      return{
        ok:true,
        bucket:AIRCRAFT_ASSET_BUCKET,
        objectPath,
        publicUrl,
        imageUrl:publicUrl,
        assetRole:text(input.assetRole||input.asset_role||"image",80),
        scope:text(input.scope||"aircraft",80),
        uploadedAt:new Date().toISOString()
      };
    }catch(e){
      throw new Error(e?.message||"Aircraft asset upload could not be completed.");
    }
  }
);

export const getAircraftControlBootstrap=webMethod(
  Permissions.Anyone,
  async()=>{
    try{
      const agent=await requireStaff(false);

      const aircraft=await listAircraft();

      let airlines=[];
      let airlineReadError="";

      try{
        airlines=await listAirlines(true);
      }catch(error){
        airlineReadError=
          error?.message||
          "Aircraft airline master data could not be loaded.";
      }

      const aircraftTemplates=
        airlines.flatMap(
          a=>a.aircraftConfigurations||[]
        );

      return{
        ok:true,
        session:session(agent),
        portalSession:session(agent),
        airlines,
        aircraft,
        aircraftTemplates,
        stats:{
          airlines:airlines.length,
          aircraft:aircraft.length,
          templates:aircraftTemplates.length
        },
        airlineSource:lastAirlineSource||"",
        airlineReadOk:airlines.length>0,
        airlineReadError,
        airlineReadErrors:lastAirlineReadErrors||[],
        lastSync:new Date().toISOString()
      };
    }catch(e){
      throw new Error(
        e?.message||
        "Aircraft Display Control bootstrap failed."
      );
    }
  }
);

export const getAircraftControlRecord=webMethod(Permissions.Anyone,async({aircraftId}={})=>{try{await requireStaff(false);return{ok:true,...await record(aircraftId)}}catch(e){throw new Error(e?.message||"Aircraft record could not be loaded.")}});
export const smartFillAircraft=webMethod(Permissions.Anyone,async(input={})=>{try{await requireStaff(false);const id=text(input.airlineId||input.airline_id,160);if(!id)throw new Error("Select an airline before using Smart Fill.");const a=await airlineById(id);if(!a)throw new Error("Selected airline was not found.");const{template,matches}=pickTemplate(a,input),suggestion=smart(input,a,template,true);return{ok:true,suggestion,template,matches,ambiguous:matches.length>1,message:matches.length>1?`Found ${matches.length} matching fleet configurations. Choose the correct seat configuration if needed.`:template?`Matched ${template.aircraftName} (${template.aircraftCode}).`:"No exact fleet template matched; manufacturer/family fields were inferred where possible."}}catch(e){throw new Error(e?.message||"Aircraft Smart Fill failed.")}});

export const saveAircraftControlAircraft=webMethod(Permissions.Anyone,async(input={})=>{try{await requireStaff(true);const a=await airlineById(text(input.airlineId||input.airline_id,160));if(!a)throw new Error("Selected airline was not found.");const{template}=pickTemplate(a,input),row=aircraftRow(input,a,template);let id=text(input.id||input.aircraftId,160);if(!uuid(id)){const ex=await db(T.aircraft,{select:"id",airline_id:`eq.${row.airline_id}`,aircraft_code:`eq.${row.aircraft_code}`,aircraft_name:`eq.${row.aircraft_name}`,limit:1});id=ex?.[0]?.id||""}const rows=uuid(id)?await db(T.aircraft,{id:`eq.${id}`},{method:"PATCH",body:row,prefer:"return=representation"}):await db(T.aircraft,{}, {method:"POST",body:row,prefer:"return=representation"});const saved=rows?.[0];if(!saved?.id)throw new Error("Aircraft record was not saved.");return{ok:true,aircraft:mapAircraft(saved),smartMatched:Boolean(template),lastSync:new Date().toISOString()}}catch(e){throw new Error(e?.message||"Aircraft could not be saved.")}});

export const deleteAircraftControlAircraft=webMethod(Permissions.Anyone,async({id}={})=>{try{await requireStaff(true);if(!uuid(id))throw new Error("Valid aircraft ID is required.");const[views,scenes]=await Promise.all([db(T.views,{select:"id",aircraft_id:`eq.${id}`,limit:1000}),db(T.scenes,{select:"id",aircraft_id:`eq.${id}`,limit:1000})]),vids=(views||[]).map(x=>x.id).filter(uuid),sids=(scenes||[]).map(x=>x.id).filter(uuid);if(vids.length)await db(T.hotspots,{view_id:`in.(${vids.join(",")})`},{method:"DELETE",prefer:"return=minimal"});if(sids.length)await db(T.sceneHotspots,{scene_id:`in.(${sids.join(",")})`},{method:"DELETE",prefer:"return=minimal"});await Promise.all([db(T.views,{aircraft_id:`eq.${id}`},{method:"DELETE",prefer:"return=minimal"}),db(T.scenes,{aircraft_id:`eq.${id}`},{method:"DELETE",prefer:"return=minimal"}),db(T.cabins,{aircraft_id:`eq.${id}`},{method:"DELETE",prefer:"return=minimal"})]);await db(T.aircraft,{id:`eq.${id}`},{method:"DELETE",prefer:"return=minimal"});return{ok:true,id}}catch(e){throw new Error(e?.message||"Aircraft could not be deleted.")}});

export const saveAircraftControlCabin=webMethod(Permissions.Anyone,async(input={})=>{try{await requireStaff(true);const aircraftId=text(input.aircraftId,160),cabinName=text(input.cabinName,180),code=upper(input.cabinCode,40);if(!uuid(aircraftId))throw new Error("Valid aircraft ID is required.");if(!cabinName||!code)throw new Error("Cabin name and cabin code are required.");const row=await saveChild(T.cabins,input.id,{aircraft_id:`eq.${aircraftId}`,cabin_code:`eq.${code}`},{aircraft_id:aircraftId,cabin_code:code,cabin_name:cabinName,rank:integer(input.rank,100),seat_count:integer(input.seatCount,null),summary:text(input.summary,3000)||null,description:text(input.description,6000)||null,meal_title:text(input.mealTitle,500)||null,meal_description:text(input.mealDescription,5000)||null,amenities:uniq(input.amenities||[]),display_settings:obj(input.displaySettings),active:bool(input.active,true),sort_order:integer(input.sortOrder,100)});return{ok:true,recordType:"cabin",record:mapCabin(row)}}catch(e){throw new Error(e?.message||"Cabin could not be saved.")}});
export const deleteAircraftControlCabin=webMethod(Permissions.Anyone,async({id}={})=>{try{await requireStaff(true);await del(T.cabins,id);return{ok:true,recordType:"cabin",id}}catch(e){throw new Error(e?.message||"Cabin could not be deleted.")}});

export const saveAircraftControlView=webMethod(Permissions.Anyone,async(input={})=>{try{await requireStaff(true);const aircraftId=text(input.aircraftId,160),cabinId=text(input.cabinId,160),viewCode=upper(input.viewCode,80),label=text(input.label,240),imageUrl=text(input.imageUrl,2000);if(!uuid(aircraftId))throw new Error("Valid aircraft ID is required.");if(!viewCode||!label)throw new Error("View code and label are required.");if(!imageUrl)throw new Error("View image URL is required.");const row=await saveChild(T.views,input.id,{aircraft_id:`eq.${aircraftId}`,view_code:`eq.${viewCode}`},{aircraft_id:aircraftId,cabin_id:uuid(cabinId)?cabinId:null,view_code:viewCode,label,view_type:upper(input.viewType,40)||"CABIN",image_url:imageUrl,mobile_image_url:text(input.mobileImageUrl,2000)||null,thumbnail_url:text(input.thumbnailUrl,2000)||null,alt_text:text(input.altText,500)||null,caption:text(input.caption,5000)||null,credit:text(input.credit,500)||null,is_default:bool(input.isDefault,false),active:bool(input.active,true),sort_order:integer(input.sortOrder,100)});if(row?.is_default===true)await db(T.views,{aircraft_id:`eq.${aircraftId}`,id:`neq.${row.id}`},{method:"PATCH",body:{is_default:false,updated_at:new Date().toISOString()},prefer:"return=minimal"});return{ok:true,recordType:"view",record:mapView(row)}}catch(e){throw new Error(e?.message||"Aircraft view could not be saved.")}});
export const deleteAircraftControlView=webMethod(Permissions.Anyone,async({id}={})=>{try{await requireStaff(true);if(!uuid(id))throw new Error("Valid view ID is required.");await db(T.hotspots,{view_id:`eq.${id}`},{method:"DELETE",prefer:"return=minimal"});await del(T.views,id);return{ok:true,recordType:"view",id}}catch(e){throw new Error(e?.message||"Aircraft view could not be deleted.")}});

export const saveAircraftControlHotspot=webMethod(Permissions.Anyone,async(input={})=>{try{await requireStaff(true);const viewId=text(input.viewId,160),code=upper(input.hotspotCode,80),label=text(input.label,240);if(!uuid(viewId))throw new Error("Select a view first.");if(!code||!label)throw new Error("Hotspot code and label are required.");const row=await saveChild(T.hotspots,input.id,{view_id:`eq.${viewId}`,hotspot_code:`eq.${code}`},{view_id:viewId,hotspot_code:code,label,title:text(input.title,500)||null,description:text(input.description,5000)||null,x:number(input.x,50),y:number(input.y,50),action:upper(input.action,80)||"DETAIL",focus_x:number(input.focusX,null),focus_y:number(input.focusY,null),focus_zoom:number(input.focusZoom,null),target_cabin_code:upper(input.targetCabinCode,40)||null,thumbnail_url:text(input.thumbnailUrl,2000)||null,active:bool(input.active,true),sort_order:integer(input.sortOrder,100)});return{ok:true,recordType:"hotspot",record:mapHotspot(row)}}catch(e){throw new Error(e?.message||"Hotspot could not be saved.")}});
export const deleteAircraftControlHotspot=webMethod(Permissions.Anyone,async({id}={})=>{try{await requireStaff(true);await del(T.hotspots,id);return{ok:true,recordType:"hotspot",id}}catch(e){throw new Error(e?.message||"Hotspot could not be deleted.")}});

export const saveAircraftControlScene=webMethod(Permissions.Anyone,async(input={})=>{try{await requireStaff(true);const aircraftId=text(input.aircraftId,160),code=upper(input.sceneCode,80),title=text(input.title,240),imageUrl=text(input.imageUrl,2000);if(!uuid(aircraftId))throw new Error("Valid aircraft ID is required.");if(!code||!title)throw new Error("Scene code and title are required.");if(!imageUrl)throw new Error("Scene image URL is required.");const row=await saveChild(T.scenes,input.id,{aircraft_id:`eq.${aircraftId}`,scene_code:`eq.${code}`},{aircraft_id:aircraftId,scene_code:code,title,short_title:text(input.shortTitle,240)||null,summary:text(input.summary,5000)||null,image_url:imageUrl,mobile_image_url:text(input.mobileImageUrl,2000)||null,forward_scene_code:upper(input.forwardSceneCode,80)||null,back_scene_code:upper(input.backSceneCode,80)||null,forward_label:text(input.forwardLabel,240)||null,back_label:text(input.backLabel,240)||null,active:bool(input.active,true),sort_order:integer(input.sortOrder,100)});return{ok:true,recordType:"scene",record:mapScene(row)}}catch(e){throw new Error(e?.message||"Walkthrough scene could not be saved.")}});
export const deleteAircraftControlScene=webMethod(Permissions.Anyone,async({id}={})=>{try{await requireStaff(true);if(!uuid(id))throw new Error("Valid scene ID is required.");await db(T.sceneHotspots,{scene_id:`eq.${id}`},{method:"DELETE",prefer:"return=minimal"});await del(T.scenes,id);return{ok:true,recordType:"scene",id}}catch(e){throw new Error(e?.message||"Walkthrough scene could not be deleted.")}});

export const saveAircraftControlSceneHotspot=webMethod(Permissions.Anyone,async(input={})=>{try{await requireStaff(true);const sceneId=text(input.sceneId,160),code=upper(input.hotspotCode,80),label=text(input.label,240);if(!uuid(sceneId))throw new Error("Select a walkthrough scene first.");if(!code||!label)throw new Error("Hotspot code and label are required.");const row=await saveChild(T.sceneHotspots,input.id,{scene_id:`eq.${sceneId}`,hotspot_code:`eq.${code}`},{scene_id:sceneId,hotspot_code:code,label,title:text(input.title,500)||null,description:text(input.description,5000)||null,hotspot_type:upper(input.hotspotType,80)||"FEATURE",x:number(input.x,50),y:number(input.y,50),action:upper(input.action,80)||null,target_cabin_code:upper(input.targetCabinCode,40)||null,active:bool(input.active,true),sort_order:integer(input.sortOrder,100)});return{ok:true,recordType:"sceneHotspot",record:mapSceneHotspot(row)}}catch(e){throw new Error(e?.message||"Scene hotspot could not be saved.")}});
export const deleteAircraftControlSceneHotspot=webMethod(Permissions.Anyone,async({id}={})=>{try{await requireStaff(true);await del(T.sceneHotspots,id);return{ok:true,recordType:"sceneHotspot",id}}catch(e){throw new Error(e?.message||"Scene hotspot could not be deleted.")}});

export const syncAircraftCabinsFromConfiguration=webMethod(Permissions.Anyone,async({aircraftId,overwrite=false}={})=>{try{await requireStaff(true);const result=await syncCabins(aircraftId,bool(overwrite,false));return{...result,aircraftId,record:await record(aircraftId)}}catch(e){throw new Error(e?.message||"Cabin configuration sync failed.")}});

export const smartSyncAircraftCatalog=webMethod(Permissions.Anyone,async({buildMissingCabins=true}={})=>{try{await requireStaff(true);const[airlines,rawAircraft,rawCabins]=await Promise.all([listAirlines(),db(T.aircraft,{select:"*",limit:1000}),db(T.cabins,{select:"*",limit:3000})]),aMap=new Map(airlines.map(a=>[a.id,a])),cMap=new Map();for(const c of rawCabins||[]){if(!cMap.has(c.aircraft_id))cMap.set(c.aircraft_id,[]);cMap.get(c.aircraft_id).push(c)}let aircraftUpdated=0,aircraftMatched=0,cabinCreated=0,cabinUpdated=0,skipped=0;await batched(rawAircraft||[],8,async raw=>{const a=aMap.get(raw.airline_id);if(!a){skipped++;return}const{template}=pickTemplate(a,{aircraftCode:raw.aircraft_code,aircraftName:raw.aircraft_name,totalSeats:raw.total_seats});if(template)aircraftMatched++;const s=smart(mapAircraft(raw),a,template,false),patch=smartPatch(raw,s);if(Object.keys(patch).length){await db(T.aircraft,{id:`eq.${raw.id}`},{method:"PATCH",body:patch,prefer:"return=minimal"});aircraftUpdated++}if(!buildMissingCabins)return;const configuration=Object.keys(obj(raw.configuration)).length?raw.configuration:obj(s.configuration),templates=cabinTemplates(configuration);if(!templates.length)return;const existing=cMap.get(raw.id)||[],byCode=new Map(existing.map(c=>[upper(c.cabin_code,40),c]));for(const t of templates){const cur=byCode.get(upper(t.cabinCode,40));if(!cur){await db(T.cabins,{}, {method:"POST",body:{aircraft_id:raw.id,cabin_code:t.cabinCode,cabin_name:t.cabinName,rank:t.rank,seat_count:t.seatCount,summary:t.summary,description:t.description,amenities:[],display_settings:{},active:true,sort_order:t.sortOrder},prefer:"return=minimal"});cabinCreated++;continue}const cp={};if(cur.seat_count==null)cp.seat_count=t.seatCount;if(!text(cur.summary))cp.summary=t.summary;if(!text(cur.description))cp.description=t.description;if(Object.keys(cp).length){cp.updated_at=new Date().toISOString();await db(T.cabins,{id:`eq.${cur.id}`},{method:"PATCH",body:cp,prefer:"return=minimal"});cabinUpdated++}}});return{ok:true,aircraftMatched,aircraftUpdated,cabinCreated,cabinUpdated,skipped,message:`Smart Sync complete: ${aircraftMatched} aircraft matched to airline fleet data, ${aircraftUpdated} aircraft enriched, ${cabinCreated} cabins created, ${cabinUpdated} cabins enriched.`,lastSync:new Date().toISOString()}}catch(e){throw new Error(e?.message||"Aircraft Smart Sync failed.")}});
