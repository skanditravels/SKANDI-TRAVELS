
import React,{useEffect,useMemo,useState} from "react";
import {createRoot} from "react-dom/client";
import htm from "htm";
const html=htm.bind(React.createElement);
const roots=new WeakMap();
const A=v=>Array.isArray(v)?v:[];
const O=v=>v&&typeof v==="object"&&!Array.isArray(v)?v:{};
const T=v=>String(v??"").trim();
const N=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;
const raw=(o,...keys)=>{for(const k of keys){if(o&&o[k]!==undefined&&o[k]!==null&&o[k]!=="")return o[k]}return""};
const human=v=>T(v).replace(/[_-]+/g," ").replace(/\b\w/g,c=>c.toUpperCase());
const canonical=(code,name="")=>{const v=T(code||name).toUpperCase().replace(/[_-]+/g," ");if(["F","J","W","Y"].includes(v))return v;if(/FIRST|LA PREMI/.test(v))return"F";if(/BUSINESS|SIGNATURE CLASS|DELTA ONE|POLARIS|CLUB WORLD|ROYAL SILK/.test(v))return"J";if(/PREMIUM|PLUS|COMFORT/.test(v)&&!/BUSINESS/.test(v))return"W";return"Y"};
const rank=c=>({F:4,J:3,W:2,Y:1})[c]||0;
const cabinLabel=c=>({F:"First",J:"Business",W:"Premium",Y:"Economy"})[c]||c;
const emit=(type,payload={})=>window.parent.postMessage({source:"SKANDI_PUBLIC_TRAVEL_INFO",type,payload,timestamp:new Date().toISOString()},"*");
const navigate=path=>emit("MASTER_NAVIGATE",{path});
function transition(fn){if(!matchMedia("(prefers-reduced-motion: reduce)").matches&&document.startViewTransition){try{return document.startViewTransition(fn)}catch(_){}}return fn()}
function normalizeAircraft(a){return{...a,_id:T(raw(a,"id")),_code:T(raw(a,"aircraft_code","aircraftCode")),_name:T(raw(a,"display_title","displayTitle","aircraft_name","aircraftName"))||T(raw(a,"aircraft_code","aircraftCode"))||"Aircraft",_aircraftName:T(raw(a,"aircraft_name","aircraftName")),_manufacturer:T(raw(a,"manufacturer")),_family:T(raw(a,"family")),_variant:T(raw(a,"variant")),_seats:N(raw(a,"total_seats","totalSeats")),_hero:T(raw(a,"hero_image_url","heroImageUrl","exterior_image_url","exteriorImageUrl")),_seatmap:T(raw(a,"seatmap_image_url","seatmapImageUrl")),_configuration:O(raw(a,"configuration"))}}
function normalizeCabins(bundle,aircraftId){
  const source=A(bundle?.cabins).filter(c=>T(raw(c,"aircraft_id","aircraftId"))===T(aircraftId)&&raw(c,"active")!==false);const map=new Map();
  source.forEach(c=>{const code=canonical(raw(c,"cabin_code","cabinCode"),raw(c,"cabin_name","cabinName"));const name=T(raw(c,"cabin_name","cabinName"))||cabinLabel(code);const seats=N(raw(c,"seat_count","seatCount"));const key=`${code}|${name.toLowerCase()}|${seats}`;const canonicalCode=["F","J","W","Y"].includes(T(raw(c,"cabin_code","cabinCode")).toUpperCase());const old=map.get(key);if(!old||canonicalCode)map.set(key,{...c,_id:T(raw(c,"id")),_code:code,_name:name,_seats:seats,_rank:rank(code)})});
  return[...map.values()].sort((a,b)=>b._rank-a._rank||N(raw(a,"sort_order","sortOrder"))-N(raw(b,"sort_order","sortOrder")))
}
function legacyData(airline){const s=O(airline?.sections);return O(s.inflightExperience?.data||s.inflightExperience||airline?.inflightExperience||{})}
function legacyClassFor(legacy,cabin){const classes=A(legacy.classes);if(!classes.length)return null;const code=cabin?cabin._code:"Y";return classes.find(c=>canonical(c.id,c.label)===code)||classes.find(c=>T(c.label).toLowerCase().includes(cabinLabel(code).toLowerCase()))||classes[0]}
function amenityItems(cabin,legacyClass){
  const out=[];const add=(label,value="")=>{label=T(label);value=T(value);if(label&&!out.some(x=>x.label.toLowerCase()===label.toLowerCase()))out.push({label,value})};const am=raw(cabin,"amenities");
  if(Array.isArray(am))am.forEach(v=>typeof v==="string"?add(v):add(v?.label||v?.title,v?.value||v?.description));
  else Object.entries(O(am)).forEach(([k,v])=>{if(v===false||v===null||v==="")return;if(typeof v==="object")add(human(k),v.value||v.description||v.label||v.title||"");else add(human(k),v===true?"":String(v))});
  A(legacyClass?.amenities).forEach(v=>typeof v==="string"?add(v):add(v?.label||v?.title,v?.value||v?.description));return out.slice(0,16)
}
function configuredSeatLayout(cabin){const ds=O(raw(cabin,"display_settings","displaySettings"));const layout=raw(ds,"seatLayout","layout","seat_layout");if(Array.isArray(layout))return layout.map(g=>Array.isArray(g)?g.map(T).filter(Boolean):[]).filter(g=>g.length);if(typeof layout==="string"&&/^\d(?:-\d)+$/.test(layout)){let letter=0;return layout.split("-").map(count=>Array.from({length:N(count)},()=>String.fromCharCode(65+letter++)))}return[]}
function viewsFor(bundle,aircraft,cabin,legacyClass){
  const canonicalViews=A(bundle.views).filter(v=>T(raw(v,"aircraft_id","aircraftId"))===aircraft._id&&(T(raw(v,"cabin_id","cabinId"))===cabin?._id||!T(raw(v,"cabin_id","cabinId"))));
  if(canonicalViews.length)return canonicalViews.map(v=>({...v,_id:T(raw(v,"id")),_label:T(raw(v,"label","view_code","viewCode","view_type","viewType"))||"Cabin view",_image:T(raw(v,"image_url","imageUrl","mobile_image_url","mobileImageUrl"))}));
  return A(legacyClass?.views).map((v,i)=>({...v,_id:T(v.id)||`legacy-view-${i}`,_label:T(v.label||v.title)||"Cabin view",_image:T(v.image||v.imageUrl),_legacyHotspots:A(v.hotspots)}))
}
function hotspotsFor(bundle,view){return view?A(bundle.hotspots).filter(h=>T(raw(h,"view_id","viewId"))===T(view._id)).map((h,i)=>({...h,_id:T(raw(h,"id","hotspot_code","hotspotCode"))||`hot-${i}`})):[]}
function scenesFor(bundle,aircraft){return A(bundle.walkScenes||bundle.scenes).filter(s=>T(raw(s,"aircraft_id","aircraftId"))===aircraft._id).sort((a,b)=>N(raw(a,"sort_order","sortOrder"))-N(raw(b,"sort_order","sortOrder"))).map(s=>({...s,_code:T(raw(s,"scene_code","sceneCode"))}))}
function sceneHotspotsFor(bundle,scene){return scene?A(bundle.sceneHotspots).filter(h=>T(raw(h,"scene_id","sceneId"))===T(scene.id)).map((h,i)=>({...h,_id:T(raw(h,"id","hotspot_code","hotspotCode"))||`scene-hot-${i}`})):[]}
function useMobile(){const [m,setM]=useState(matchMedia("(max-width:760px)").matches);useEffect(()=>{const q=matchMedia("(max-width:760px)");const f=()=>setM(q.matches);q.addEventListener?.("change",f);return()=>q.removeEventListener?.("change",f)},[]);return m}

const css=`
.cab-root{--cab-navy:#061a30;--cab-blue:#0b3a7a;--cab-aqua:#5fc7cf;--cab-ivory:#fbfaf6;--cab-champ:#d1bc98;--cab-text:#102033;--cab-muted:#65758a;--cab-line:rgba(2,46,100,.12);font-family:Montserrat,Inter,system-ui,sans-serif;color:var(--cab-text)}
.cab-shell{border:1px solid var(--cab-line);border-radius:30px;overflow:hidden;background:var(--cab-ivory);box-shadow:0 22px 60px rgba(2,46,100,.1)}
.cab-top{position:relative;overflow:hidden;background:linear-gradient(145deg,#05192e,#0a3159);color:#fff;padding:28px 28px 22px}.cab-top:after{content:"";position:absolute;width:320px;height:320px;border-radius:50%;right:-120px;top:-190px;border:1px solid rgba(95,199,207,.18)}.cab-kicker{position:relative;z-index:1;color:#91dce2;font-size:9px;font-weight:850;text-transform:uppercase;letter-spacing:.16em}.cab-top h3{position:relative;z-index:1;margin:8px 0 7px;font-size:clamp(24px,3.5vw,38px);font-weight:550;line-height:1;letter-spacing:-.05em}.cab-top p{position:relative;z-index:1;margin:0;max-width:760px;color:#b9cee1;font-size:10.5px;line-height:1.65}
.cab-selectors{border-bottom:1px solid var(--cab-line);background:#fff}.cab-aircraft-strip,.cab-mode-strip,.cab-cabin-strip,.cab-view-strip{display:flex;gap:7px;overflow-x:auto;scrollbar-width:none;padding:10px 15px}.cab-aircraft-strip::-webkit-scrollbar,.cab-mode-strip::-webkit-scrollbar,.cab-cabin-strip::-webkit-scrollbar,.cab-view-strip::-webkit-scrollbar{display:none}.cab-aircraft-strip{border-bottom:1px solid var(--cab-line)}.cab-pill{white-space:nowrap;border:1px solid var(--cab-line);border-radius:999px;background:#fff;color:#52677e;padding:9px 12px;font-size:8.5px;font-weight:800}.cab-pill[data-active="true"]{background:var(--cab-navy);border-color:var(--cab-navy);color:#fff}.cab-pill.cab-cabin[data-active="true"]{background:var(--cab-aqua);border-color:var(--cab-aqua);color:#06263c}
.cab-body{padding:18px}.cab-grid{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(250px,.55fr);gap:14px}.cab-card{border:1px solid var(--cab-line);border-radius:22px;background:#fff;overflow:hidden}.cab-pad{padding:20px}.cab-title{margin:0 0 7px;color:#022e64;font-size:15px;font-weight:700}.cab-copy{margin:0;color:var(--cab-muted);font-size:10px;line-height:1.65;white-space:pre-line}.cab-facts{display:flex;gap:7px;flex-wrap:wrap;margin-top:14px}.cab-fact{padding:8px 10px;border:1px solid var(--cab-line);border-radius:12px;background:#f8fafc}.cab-fact b{display:block;font-size:11px;color:#022e64}.cab-fact span{display:block;margin-top:2px;font-size:7.5px;color:#728196;text-transform:uppercase;letter-spacing:.06em}
.cab-aircraft-visual{position:relative;min-height:330px;background:linear-gradient(145deg,#e8f0f5,#f9faf7);overflow:hidden;display:grid;place-items:center}.cab-aircraft-visual img{width:100%;height:330px;object-fit:cover}.cab-visual-fallback{display:grid;place-items:center;text-align:center;color:#31516e;padding:28px}.cab-plane-svg{width:min(390px,80%);height:auto;opacity:.78}.cab-visual-fallback strong{display:block;margin-top:12px;color:#022e64;font-size:13px}.cab-visual-fallback span{display:block;margin-top:6px;color:#6d7f91;font-size:9px;line-height:1.5}.cab-cabin-list{display:grid;gap:8px;margin-top:15px}.cab-cabin-card{width:100%;border:1px solid var(--cab-line);border-radius:15px;background:#fff;padding:13px;text-align:left;color:#102033}.cab-cabin-card:hover,.cab-cabin-card[data-active="true"]{border-color:rgba(95,199,207,.75);box-shadow:0 7px 20px rgba(2,46,100,.06)}.cab-cabin-card strong{display:block;color:#022e64;font-size:10.5px}.cab-cabin-card span{display:block;margin-top:3px;color:#6b7c8e;font-size:8.5px}
.cab-media{position:relative;min-height:420px;background:linear-gradient(145deg,#0a2848,#0c355c);overflow:hidden}.cab-media img{width:100%;height:420px;object-fit:cover;transition:opacity .28s ease}.cab-media-fallback{height:420px;display:grid;place-items:center;text-align:center;padding:32px;color:#c3d5e5}.cab-media-fallback strong{display:block;font-size:22px;font-weight:550}.cab-media-fallback span{display:block;margin:8px auto 0;max-width:420px;font-size:9.5px;line-height:1.6;color:#9eb6cb}.cab-hotspot{position:absolute;transform:translate(-50%,-50%);width:26px;height:26px;border-radius:50%;border:1px solid rgba(255,255,255,.8);background:rgba(95,199,207,.94);color:#06263c;font-size:8px;font-weight:900;box-shadow:0 0 0 5px rgba(95,199,207,.12);display:grid;place-items:center}.cab-hotspot:hover,.cab-hotspot[data-active="true"]{box-shadow:0 0 0 9px rgba(95,199,207,.15)}.cab-hotspot-label{position:absolute;left:16px;right:16px;bottom:16px;max-width:420px;padding:13px 14px;border-radius:15px;background:rgba(3,17,31,.8);backdrop-filter:blur(12px);color:#fff;border:1px solid rgba(255,255,255,.15)}.cab-hotspot-label strong{display:block;font-size:10px}.cab-hotspot-label span{display:block;margin-top:4px;color:#c0d1df;font-size:8.5px;line-height:1.5}.cab-amenities{display:flex;gap:6px;flex-wrap:wrap;margin-top:14px}.cab-amenity{padding:6px 8px;border-radius:999px;background:#f3f7f9;border:1px solid var(--cab-line);font-size:8px;color:#486076}.cab-amenity b{color:#223f58}
.cab-empty{border:1px dashed rgba(2,46,100,.2);border-radius:18px;padding:28px;text-align:center;color:#6c7d8f;background:#fbfcfc}.cab-empty strong{display:block;color:#022e64;font-size:13px;margin-bottom:6px}.cab-empty span{font-size:9.5px;line-height:1.55}
.cab-layout{padding:18px}.cab-layout-note{padding:10px 12px;border-radius:12px;background:#f6f8fa;color:#647689;font-size:8.5px;line-height:1.55;margin-bottom:13px}.cab-seatrows{display:grid;gap:7px;justify-content:center;overflow:auto;padding:8px 0}.cab-row{display:flex;align-items:center;gap:6px}.cab-rowno{width:20px;text-align:right;color:#8290a0;font-size:7.5px}.cab-seatgroup{display:flex;gap:4px}.cab-aisle{width:16px}.cab-seat{width:32px;height:34px;border:1px solid rgba(2,46,100,.18);border-radius:10px 10px 7px 7px;background:#eef3f6;color:#37536c;font-size:8px;font-weight:800}.cab-seat:hover,.cab-seat[data-active="true"]{border-color:#5fc7cf;background:#e2f6f7;color:#022e64}.cab-seatinfo{margin-top:14px;border-top:1px solid var(--cab-line);padding-top:14px}.cab-seatinfo strong{display:block;color:#022e64;font-size:12px}.cab-seatinfo span{display:block;margin-top:4px;color:#6b7c8e;font-size:9px;line-height:1.5}
.cab-scenes{display:grid;grid-template-columns:190px minmax(0,1fr);gap:12px}.cab-scene-list{display:grid;gap:6px;align-content:start;max-height:480px;overflow:auto}.cab-scene-btn{border:1px solid var(--cab-line);border-radius:13px;background:#fff;color:#51647a;padding:11px;text-align:left;font-size:8.5px}.cab-scene-btn[data-active="true"]{border-color:#5fc7cf;background:#edfafa;color:#022e64}.cab-scene-btn strong{display:block;font-size:9.5px}.cab-scene-btn span{display:block;margin-top:3px;color:#7c8a99}.cab-scene-nav{display:flex;gap:8px;justify-content:space-between;margin-top:9px}.cab-action{min-height:39px;border:1px solid var(--cab-line);border-radius:999px;background:#fff;color:#022e64;padding:0 13px;font-size:8.5px;font-weight:800}.cab-action:disabled{opacity:.4}.cab-action-primary{background:#022e64;color:#fff;border-color:#022e64}
.cab-map-card{padding:22px}.cab-map-svg{width:100%;height:auto;display:block;max-height:520px}.cab-zone{cursor:pointer;transition:opacity .15s,filter .15s}.cab-zone:hover,.cab-zone[data-active="true"]{filter:brightness(1.08)}.cab-zone-label{font-size:9px;font-weight:700;fill:#123a5d;text-anchor:middle;pointer-events:none}.cab-map-note{margin-top:12px;color:#6f8092;font-size:8.5px;line-height:1.55}.cab-footer{padding:13px 18px;border-top:1px solid var(--cab-line);background:#fff;display:flex;align-items:center;justify-content:space-between;gap:12px}.cab-footer span{color:#708195;font-size:8.5px;line-height:1.45}.cab-footer button{border:0;border-radius:999px;background:#022e64;color:#fff;padding:9px 12px;font-size:8.5px;font-weight:800}
@media(max-width:900px){.cab-grid{grid-template-columns:1fr}.cab-scenes{grid-template-columns:1fr}.cab-scene-list{display:flex;overflow-x:auto;max-height:none}.cab-scene-btn{min-width:150px}.cab-media,.cab-media img,.cab-media-fallback{height:360px;min-height:360px}}
@media(max-width:560px){.cab-shell{border-radius:22px}.cab-top{padding:22px 18px 18px}.cab-body{padding:10px}.cab-media,.cab-media img,.cab-media-fallback{height:300px;min-height:300px}.cab-pad{padding:16px}.cab-aircraft-visual,.cab-aircraft-visual img{min-height:260px;height:260px}.cab-footer{display:block}.cab-footer button{margin-top:8px;width:100%}.cab-aircraft-strip,.cab-mode-strip,.cab-cabin-strip,.cab-view-strip{padding-left:10px;padding-right:10px}.cab-seat{width:28px;height:31px}.cab-aisle{width:10px}}
@media(prefers-reduced-motion:reduce){.cab-root *{transition:none!important;animation:none!important}}

/* SKANDI Travel Info v12 cabin visual alignment */
.cab-root{
  --cab-home-primary:linear-gradient(135deg,#022e64,#0b5c85);
  --cab-home-white:#fff;
  --cab-home-aqua:#d9f1f1;
  --cab-home-sand:#f2e9dc;
  --cab-home-ice:#e9eef8;
  --cab-home-section:#f3f6f8;
  --cab-home-brown:#3c2f20;
}
.cab-shell{
  background:var(--cab-home-section);
  border-color:rgba(2,46,100,.08);
  box-shadow:0 24px 64px rgba(2,46,100,.13);
}
.cab-top{
  background:var(--cab-home-primary);
  isolation:isolate;
}
.cab-top:before{
  content:"";
  position:absolute;
  inset:0;
  z-index:0;
  pointer-events:none;
  opacity:.48;
  background:
    radial-gradient(circle at 82% 10%,rgba(95,199,207,.28),transparent 28%),
    linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),
    linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px);
  background-size:auto,38px 38px,38px 38px;
  animation:cabGridDrift 18s linear infinite;
}
.cab-top>*{position:relative;z-index:1}
@keyframes cabGridDrift{to{background-position:center,76px 38px,38px 76px}}
.cab-selectors{
  background:rgba(255,255,255,.96);
  backdrop-filter:blur(16px);
}
.cab-pill{
  transition:transform .18s ease,background .18s ease,border-color .18s ease,box-shadow .18s ease;
}
.cab-pill:hover{
  transform:translateY(-1px);
  border-color:#5fc7cf;
  box-shadow:0 5px 14px rgba(2,46,100,.07);
}
.cab-pill[data-active="true"]{
  background:linear-gradient(135deg,#022e64,#0b5c85);
  border-color:#022e64;
}
.cab-pill.cab-cabin[data-active="true"]{
  background:#d9f1f1;
  border-color:#5fc7cf;
  color:#022e64;
}
.cab-body{
  background:
    radial-gradient(circle at 90% 4%,rgba(95,199,207,.08),transparent 20%),
    var(--cab-home-section);
}
.cab-card{
  border-color:rgba(2,46,100,.08);
  box-shadow:0 8px 24px rgba(2,46,100,.055);
  transition:transform .26s cubic-bezier(.16,1,.3,1),box-shadow .26s ease,border-color .18s ease;
}
.cab-card:hover{
  border-color:rgba(95,199,207,.34);
  box-shadow:0 16px 34px rgba(2,46,100,.10);
}
.cab-grid>.cab-card:nth-child(2){
  background:#e9eef8;
}
.cab-aircraft-visual{
  background:linear-gradient(145deg,#d9f1f1,#e9eef8);
}
.cab-media{
  background:linear-gradient(135deg,#022e64,#0b5c85);
}
.cab-media:after{
  content:"";
  position:absolute;
  inset:0;
  pointer-events:none;
  background:
    radial-gradient(circle at 84% 12%,rgba(95,199,207,.16),transparent 28%),
    linear-gradient(120deg,rgba(255,255,255,.08),transparent 38%);
}
.cab-hotspot{
  z-index:3;
  animation:cabHotPulse 2.2s ease-out infinite;
}
@keyframes cabHotPulse{
  0%,100%{box-shadow:0 0 0 5px rgba(95,199,207,.12)}
  50%{box-shadow:0 0 0 11px rgba(95,199,207,.04)}
}
.cab-hotspot-label{z-index:4}
.cab-cabin-card{
  transition:transform .2s ease,border-color .2s ease,box-shadow .2s ease;
}
.cab-cabin-card:hover{
  transform:translateY(-2px);
}
.cab-fact:nth-child(4n+1){background:#fff}
.cab-fact:nth-child(4n+2){background:#d9f1f1}
.cab-fact:nth-child(4n+3){background:#f2e9dc}
.cab-fact:nth-child(4n+4){background:#e9eef8}
.cab-amenity:nth-child(4n+1){background:#fff}
.cab-amenity:nth-child(4n+2){background:#d9f1f1}
.cab-amenity:nth-child(4n+3){background:#f2e9dc}
.cab-amenity:nth-child(4n+4){background:#e9eef8}
.cab-seat{
  transition:transform .15s ease,background .15s ease,border-color .15s ease,box-shadow .15s ease;
}
.cab-seat:hover{
  transform:translateY(-2px);
  box-shadow:0 5px 12px rgba(2,46,100,.10);
}
.cab-action-primary,.cab-footer button{
  background:linear-gradient(135deg,#022e64,#0b5c85);
}
@media(prefers-reduced-motion:reduce){
  .cab-top:before,.cab-hotspot{animation:none!important}
}


/* V11/V12 hybrid cabin — photo first, light chrome, V12 interactions */
.cab-shell{background:#fff;border-color:#e2e9f1;border-radius:24px;box-shadow:0 16px 44px rgba(2,46,100,.10)}
.cab-top{background:#fff;color:#022e64;padding:22px 22px 17px;border-bottom:1px solid #e2e9f1}
.cab-top:before,.cab-top:after{display:none!important}
.cab-kicker{color:#0b5c85;font-size:9px}.cab-top h3{color:#022e64;font-size:clamp(22px,3vw,32px);font-weight:650}.cab-top p{display:none}
.cab-selectors{background:#fff;border-bottom:1px solid #e2e9f1}.cab-aircraft-strip{border-bottom:1px solid #eef2f6}
.cab-pill{font-size:9px;border-color:#dfe7ef;color:#476079;background:#f8fafc}.cab-pill[data-active="true"]{background:#022e64;color:#fff;border-color:#022e64}.cab-pill.cab-cabin[data-active="true"]{background:#d9f1f1;color:#022e64;border-color:#5fc7cf}
.cab-body{padding:14px;background:#fff}.cab-grid{grid-template-columns:minmax(0,1.72fr) minmax(235px,.58fr);gap:12px}.cab-card{border-color:#e2e9f1;border-radius:18px;box-shadow:0 5px 18px rgba(2,46,100,.04)}.cab-grid>.cab-card:nth-child(2){background:#f7f9fc}
.cab-media{min-height:540px;border-radius:18px;background:#061932}.cab-media img{height:540px;transition:transform .65s cubic-bezier(.16,1,.3,1),filter .3s ease}.cab-media:hover img{transform:scale(1.018);filter:saturate(1.04)}.cab-media-fallback{height:540px}
.cab-hotspot{width:32px;height:32px;border:2px solid #fff;background:#5fc7cf;box-shadow:0 0 0 7px rgba(95,199,207,.15),0 10px 28px rgba(0,0,0,.25);transition:transform .2s ease,box-shadow .2s ease}.cab-hotspot:before{content:"";position:absolute;inset:-3px;border-radius:50%;border:1px solid rgba(255,255,255,.64);animation:cabHybridPulse 1.9s ease-out infinite}.cab-hotspot:hover,.cab-hotspot[data-active="true"]{transform:translate(-50%,-50%) scale(1.12);box-shadow:0 0 0 11px rgba(95,199,207,.10),0 14px 34px rgba(0,0,0,.28)}@keyframes cabHybridPulse{0%{transform:scale(.72);opacity:.85}100%{transform:scale(1.85);opacity:0}}
.cab-hotspot-label{left:18px;right:18px;bottom:18px;max-width:520px;background:rgba(255,255,255,.94);color:#022e64;border:1px solid rgba(255,255,255,.72);box-shadow:0 12px 34px rgba(0,0,0,.18)}.cab-hotspot-label strong{font-size:11px}.cab-hotspot-label span{color:#50647a;font-size:9.5px}
.cab-pad{padding:18px}.cab-title{font-size:14px}.cab-copy{font-size:10.5px}.cab-amenity{background:#fff;border-color:#dfe7ef;padding:7px 9px;font-size:8.5px}
.cab-cabin-card{border-color:#dfe7ef;border-radius:13px;background:#fff}.cab-cabin-card:hover,.cab-cabin-card[data-active="true"]{background:#edf8f8;border-color:#5fc7cf;box-shadow:none}
.cab-aircraft-visual{min-height:390px;background:#eef4fb}.cab-aircraft-visual img{height:390px;object-fit:cover}
.cab-scenes{grid-template-columns:165px minmax(0,1fr)}.cab-scene-btn{font-size:9px;border-color:#dfe7ef}.cab-scene-btn span{display:none}.cab-scene-btn[data-active="true"]{background:#edf8f8;border-color:#5fc7cf}
.cab-footer{padding:11px 15px;border-top:1px solid #e2e9f1}.cab-footer span{display:none}.cab-footer{justify-content:flex-end}.cab-footer button{font-size:9px;padding:10px 14px}
.cab-layout-note,.cab-map-note{display:none!important}
@media(max-width:900px){.cab-grid{grid-template-columns:1fr}.cab-media,.cab-media img,.cab-media-fallback{height:470px;min-height:470px}.cab-aircraft-visual,.cab-aircraft-visual img{min-height:330px;height:330px}}
@media(max-width:560px){.cab-top{padding:19px 16px 14px}.cab-body{padding:8px}.cab-media,.cab-media img,.cab-media-fallback{height:360px;min-height:360px}.cab-aircraft-visual,.cab-aircraft-visual img{min-height:280px;height:280px}.cab-scenes{grid-template-columns:1fr}}
/* V12 immersive cabin navigation: uses published aircraft imagery and scene links only. */
.cab-smart-media{position:relative;overflow:hidden;background:#061a30!important;border-radius:18px}
.cab-immersive-viewer{position:relative;min-height:560px;height:clamp(420px,57vw,680px);overflow:hidden;touch-action:none;cursor:grab;outline-offset:-4px;background:linear-gradient(140deg,#041325,#0a3d63);color:#fff;isolation:isolate}
.cab-immersive-viewer:active{cursor:grabbing}
.cab-immersive-viewer:fullscreen{height:100dvh;width:100vw}
.cab-immersive-frame{position:absolute;inset:0;overflow:hidden}
.cab-immersive-frame:after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,rgba(0,12,28,.52),transparent 22%,transparent 66%,rgba(0,12,28,.38));z-index:2}
.cab-photo-plane{position:absolute;inset:0;transform-origin:center;will-change:transform;transition:transform .14s linear}
.cab-immersive-image{width:100%!important;height:100%!important;min-height:0!important;object-fit:cover;user-select:none;-webkit-user-drag:none;pointer-events:none;max-width:none}
.cab-ambient-motion{animation:cabAmbientDrift 13s ease-in-out infinite alternate}
@keyframes cabAmbientDrift{from{filter:saturate(1.0);transform:scale(1)}to{filter:saturate(1.055);transform:scale(1.045)}}
.cab-panorama-canvas{display:block;width:100%;height:100%;background:#071a2e}
.cab-viewer-top{position:absolute;z-index:7;top:0;left:0;right:0;padding:18px 20px;display:flex;align-items:flex-start;justify-content:space-between;gap:14px;pointer-events:none}
.cab-viewer-heading{display:grid;gap:4px;max-width:50%;min-width:0;text-shadow:0 2px 12px #0009}
.cab-viewer-heading span{font-size:8px;letter-spacing:.12em;font-weight:800;color:#aadce7}
.cab-viewer-heading strong{font-size:clamp(13px,1.5vw,20px);font-weight:700;letter-spacing:-.02em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cab-viewer-tools{display:flex;align-items:center;gap:5px;flex-wrap:wrap;justify-content:flex-end;pointer-events:auto}
.cab-glass-tool{min-width:36px;height:36px;padding:0 9px;border-radius:10px;background:rgba(5,23,45,.70);color:#fff;border:1px solid rgba(255,255,255,.35);backdrop-filter:blur(12px);font-size:14px;font-weight:750;display:grid;place-items:center;box-shadow:0 6px 18px #0003;transition:background .18s,border-color .18s}
.cab-glass-tool:hover,.cab-glass-tool[aria-pressed="true"]{background:#d9f1f1;color:#022e64;border-color:#5fc7cf}
.cab-glass-tool:disabled{opacity:.36;cursor:not-allowed}
.cab-viewer-instructions{position:absolute;z-index:5;left:18px;bottom:16px;display:flex;gap:7px;align-items:center;flex-wrap:wrap;max-width:calc(100% - 36px);padding:9px 12px;border-radius:10px;background:rgba(3,17,35,.64);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,.14);font-size:9px;font-weight:650;color:#e7f8ff;pointer-events:none}
.cab-immersive-viewer .cab-hotspot{z-index:4;width:30px;height:30px}
.cab-immersive-viewer .cab-hotspot-label{z-index:9;max-width:440px;left:17px;right:17px;bottom:67px;background:rgba(255,255,255,.95);color:#022e64;pointer-events:auto;padding-right:40px}
.cab-immersive-viewer .cab-hotspot-label span{color:#566b7a}
.cab-hotspot-close{position:absolute;right:9px;top:8px;width:27px;height:27px;border:0;background:#e9eef8;color:#022e64;border-radius:8px;font-size:18px}
.cab-feature-rail{display:flex;gap:6px;overflow-x:auto;scrollbar-width:thin;padding:9px;background:#fff;border-top:1px solid #e2e9f1}
.cab-feature-rail button{white-space:nowrap;border:1px solid #dce9f0;border-radius:9px;background:#f6f9fc;padding:8px 10px;color:#315270;font-size:9px;font-weight:700}
.cab-feature-rail button[data-active="true"]{background:#d9f1f1;border-color:#5fc7cf;color:#022e64}
.cab-immersive-fallback{height:100%;min-height:420px}
.cab-smart-walk{display:grid;gap:13px}
.cab-walk-overview{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:6px 4px 10px}
.cab-walk-eyebrow{display:block;color:#0b5c85;letter-spacing:.16em;font-size:9px;font-weight:800}
.cab-walk-overview h4{margin:6px 0 5px;color:#022e64;font-size:clamp(20px,2.5vw,30px);letter-spacing:-.04em;font-weight:700}
.cab-walk-overview p{margin:0;color:#617487;font-size:10px;line-height:1.55}
.cab-walk-top-actions{display:flex;flex-wrap:wrap;gap:7px;flex:0 0 auto}
.cab-smart-walk-layout{display:grid;grid-template-columns:minmax(165px,.28fr) minmax(0,1fr);gap:12px;align-items:start}
.cab-walk-map{border:1px solid #e2e9f1;border-radius:17px;background:#f9fbfd;padding:17px 12px;position:sticky;top:16px}
.cab-walk-map-title{display:flex;justify-content:space-between;gap:12px;padding:0 5px 13px;font-size:9px;letter-spacing:.11em;font-weight:800;color:#355b74;border-bottom:1px solid #e2e9f1}
.cab-walk-map-title span{letter-spacing:0;color:#8196a5}
.cab-walk-map-list{display:grid;max-height:600px;overflow:auto;padding:12px 0;scrollbar-width:thin}
.cab-walk-stop{position:relative;display:grid;grid-template-columns:31px minmax(0,1fr);gap:9px;align-items:center;min-height:65px;border:0;background:transparent;border-radius:9px;padding:8px 4px;color:#51677d;text-align:left}
.cab-walk-stop:before{content:"";position:absolute;width:1px;top:0;bottom:0;left:19px;background:#c9d9e5}
.cab-walk-stop:first-child:before{top:50%}.cab-walk-stop:last-child:before{bottom:50%}
.cab-walk-node{position:relative;z-index:1;width:30px;height:30px;display:grid;place-items:center;border-radius:50%;background:#fff;border:1px solid #ccdce7;font-size:9px;font-weight:800;color:#58758e}
.cab-walk-stop[data-active="true"]{background:#e9f6f8;color:#022e64}
.cab-walk-stop[data-active="true"] .cab-walk-node{background:#022e64;color:#fff;border-color:#022e64;box-shadow:0 0 0 4px #d9f1f1}
.cab-walk-stop strong{display:block;font-size:10px;line-height:1.38}
.cab-walk-stop small{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin-top:3px;color:#8290a0;font-size:8px;line-height:1.4}
.cab-walk-map-footer{padding:11px 5px 0;margin:0;border-top:1px solid #e2e9f1;font-size:9px;color:#8191a1;line-height:1.5}
.cab-walk-stage{min-width:0;display:grid;gap:9px}
.cab-walk-scene-meta{display:flex;align-items:center;justify-content:space-between;gap:15px;background:#f1f6fa;border:1px solid #e2e9f1;border-radius:13px;padding:10px 13px}
.cab-walk-scene-meta>div:first-child{display:flex;gap:9px;align-items:center;min-width:0}
.cab-walk-scene-meta span{font-size:8px;font-weight:800;letter-spacing:.1em;color:#0b5c85;white-space:nowrap}
.cab-walk-scene-meta strong{font-size:10px;font-weight:800;color:#022e64;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cab-walk-autoprogress{height:4px;width:min(115px,24%);flex:none;border-radius:10px;background:#d7e6ee;overflow:hidden}
.cab-walk-autoprogress i{display:block;width:100%;height:100%;background:#0b5c85;transform-origin:left;animation:cabTourProgress 7.2s linear both}
@keyframes cabTourProgress{from{transform:scaleX(0)}to{transform:scaleX(1)}}
.cab-walk-scene-swap{animation:cabSceneReveal .65s cubic-bezier(.16,1,.3,1) both;min-width:0}
@keyframes cabSceneReveal{from{opacity:.4;transform:scale(.985);filter:blur(4px)}to{opacity:1;transform:none;filter:none}}
.cab-walk-navigation{display:grid;grid-template-columns:1fr 1fr;gap:9px}
.cab-walk-navigation button{min-height:62px;display:flex;align-items:center;justify-content:space-between;gap:9px;border-radius:12px;border:1px solid #dfe8ef;background:#f5f8fb;padding:11px 14px;color:#022e64;text-align:left}
.cab-walk-navigation button:disabled{opacity:.4;cursor:not-allowed}
.cab-walk-navigation button>span:first-child:last-child{min-width:0}
.cab-walk-navigation button>span[aria-hidden="true"]{font-size:24px;font-weight:400;color:#0b5c85}
.cab-walk-navigation button small{display:block;font-size:8px;font-weight:800;letter-spacing:.12em;color:#6c889a}
.cab-walk-navigation button strong{display:block;margin-top:4px;font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cab-walk-navigation .cab-walk-next{background:#022e64;color:#fff;border-color:#022e64;text-align:right}
.cab-walk-navigation .cab-walk-next small,.cab-walk-navigation .cab-walk-next>span[aria-hidden="true"]{color:#a4dce3}
@media(max-width:1000px){.cab-smart-walk-layout{grid-template-columns:1fr}.cab-walk-map{position:static}.cab-walk-map-list{display:flex;overflow-x:auto;max-height:none;padding:10px 0;gap:8px}.cab-walk-stop{flex:0 0 165px;border:1px solid #e2e9f1;background:#fff;padding:11px;grid-template-columns:24px 1fr}.cab-walk-stop:before{display:none}.cab-walk-node{width:24px;height:24px}.cab-walk-map-footer{display:none}}
@media(max-width:660px){.cab-walk-overview{display:block}.cab-walk-top-actions{margin-top:12px}.cab-immersive-viewer{height:65svh;min-height:350px;max-height:560px}.cab-viewer-top{padding:11px;display:block}.cab-viewer-heading{max-width:100%}.cab-viewer-heading strong{font-size:14px}.cab-viewer-tools{margin-top:12px;justify-content:flex-start}.cab-glass-tool{width:34px;height:34px}.cab-walk-scene-meta{padding:9px}.cab-walk-navigation button{padding:9px}.cab-walk-navigation button strong{font-size:9px}.cab-viewer-instructions{font-size:8px}.cab-immersive-viewer .cab-hotspot-label{left:10px;right:10px;bottom:60px}}
@media(prefers-reduced-motion:reduce){.cab-ambient-motion,.cab-walk-scene-swap,.cab-walk-autoprogress i{animation:none!important}.cab-photo-plane{transition:none!important}}

.cab-walk-scene-swap{position:relative}
.cab-aisle-move{position:absolute;z-index:8;bottom:20%;left:50%;transform:translateX(-50%);display:grid;place-items:center;gap:3px;padding:9px 17px;border-radius:14px;border:1px solid rgba(255,255,255,.78);background:rgba(217,241,241,.93);color:#022e64;box-shadow:0 8px 28px #0005;backdrop-filter:blur(12px);font-size:9px;letter-spacing:.11em;transition:transform .2s ease,box-shadow .2s ease;white-space:nowrap}
.cab-aisle-move>span{font-size:23px;line-height:1;font-weight:700}
.cab-aisle-move:hover{transform:translateX(-50%) translateY(-4px);box-shadow:0 14px 32px #0005}
@media(max-width:660px){.cab-aisle-move{bottom:23%;padding:7px 12px;font-size:8px}.cab-aisle-move>span{font-size:17px}}
@media(prefers-reduced-motion:reduce){.cab-aisle-move{transition:none!important}}

`;

function PlaneSilhouette(){return html`<svg className="cab-plane-svg" viewBox="0 0 520 180" aria-hidden="true"><path d="M260 12c-9 0-15 15-17 34l-7 43-155 37c-12 3-18 10-16 17 2 7 11 9 21 7l145-21-5 34-45 16c-8 3-11 8-9 13 2 5 8 6 15 4l73-13 73 13c7 2 13 1 15-4 2-5-1-10-9-13l-45-16-5-34 145 21c10 2 19 0 21-7 2-7-4-14-16-17l-155-37-7-43c-2-19-8-34-17-34Z" fill="#8fb1c8" opacity=".82"/></svg>`}
function AircraftVisual({aircraft}){return html`<div className="cab-aircraft-visual">${aircraft._hero?html`<img src=${aircraft._hero} alt=${`${aircraft._name} aircraft`}/>`:html`<div className="cab-visual-fallback"><div><${PlaneSilhouette}/><strong>${aircraft._name}</strong><span>Illustrative aircraft orientation. Published configuration details are shown alongside it.</span></div></div>`}</div>`}
function Facts({aircraft,cabins}){const f=[["Aircraft code",aircraft._code],["Manufacturer",aircraft._manufacturer],["Family",aircraft._family],["Variant",aircraft._variant],["Total seats",aircraft._seats||""]].filter(([,v])=>T(v));return html`<div className="cab-facts">${f.map(([k,v])=>html`<span className="cab-fact"><b>${v}</b><span>${k}</span></span>`)}${cabins.length?html`<span className="cab-fact"><b>${cabins.length}</b><span>Published cabins</span></span>`:null}</div>`}
function Overview({aircraft,cabins,cabinId,setCabin}){return html`<div className="cab-grid"><div className="cab-card"><${AircraftVisual} aircraft=${aircraft}/><div className="cab-pad"><h4 className="cab-title">${aircraft._name}</h4><p className="cab-copy">${T(raw(aircraft,"display_summary","displaySummary"))||"Explore the published aircraft configuration and cabin products."}</p><${Facts} aircraft=${aircraft} cabins=${cabins}/></div></div><aside className="cab-card cab-pad"><h4 className="cab-title">Cabins on this aircraft</h4><p className="cab-copy">Select a cabin to keep it active as you move through the explorer.</p><div className="cab-cabin-list">${cabins.length?cabins.map(c=>html`<button className="cab-cabin-card" data-active=${c._id===cabinId?"true":"false"} onClick=${()=>setCabin(c._id)}><strong>${c._name}</strong><span>${[c._code,c._seats?`${c._seats} seats`:""].filter(Boolean).join(" · ")}</span></button>`):html`<div className="cab-empty"><strong>Cabin details are not available for this aircraft.</strong><span>Aircraft information remains available above.</span></div>`}</div></aside></div>`}
const cabClamp=(v,min,max)=>Math.min(max,Math.max(min,v));
const cabReducedMotion=()=>typeof matchMedia==="function"&&matchMedia("(prefers-reduced-motion: reduce)").matches;
const cabIsPanoType=v=>/(^|[^A-Z0-9])(360|PANO|PANORAMA|EQUIRECTANGULAR|SPHERICAL)($|[^A-Z0-9])/i.test(T(v));

function PanoramaCanvas({image,yaw,pitch,zoom,onFailure}){
  const canvasRef=React.useRef(null),rendererRef=React.useRef(null),cameraRef=React.useRef({yaw,pitch,zoom});
  cameraRef.current={yaw,pitch,zoom};
  useEffect(()=>{
    const canvas=canvasRef.current;if(!canvas||!image)return;
    let disposed=false,raf=0,observer=null,texture=null,program=null,buffer=null;
    const gl=canvas.getContext("webgl",{alpha:false,antialias:false,preserveDrawingBuffer:false});
    if(!gl){onFailure?.();return}
    const vert=`attribute vec2 aPosition;void main(){gl_Position=vec4(aPosition,0.0,1.0);}`;
    const frag=`precision highp float;
    uniform sampler2D uImage;uniform vec2 uResolution;uniform float uYaw;uniform float uPitch;uniform float uFov;
    const float PI=3.141592653589793;
    void main(){
      vec2 p=(gl_FragCoord.xy/uResolution)*2.0-1.0;
      p.x*=uResolution.x/uResolution.y;
      vec3 ray=normalize(vec3(p*tan(uFov*0.5),1.0));
      float cp=cos(uPitch),sp=sin(uPitch),cy=cos(uYaw),sy=sin(uYaw);
      vec3 t=vec3(ray.x,ray.y*cp+ray.z*sp,-ray.y*sp+ray.z*cp);
      vec3 d=normalize(vec3(t.x*cy+t.z*sy,t.y,-t.x*sy+t.z*cy));
      vec2 uv=vec2(fract(0.5+atan(d.x,d.z)/(2.0*PI)),0.5+asin(clamp(d.y,-1.0,1.0))/PI);
      gl_FragColor=texture2D(uImage,uv);
    }`;
    const shader=(type,source)=>{const sh=gl.createShader(type);gl.shaderSource(sh,source);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS)){gl.deleteShader(sh);throw Error("WEBGL_SHADER_UNSUPPORTED")}return sh};
    try{
      const v=shader(gl.VERTEX_SHADER,vert),f=shader(gl.FRAGMENT_SHADER,frag);program=gl.createProgram();gl.attachShader(program,v);gl.attachShader(program,f);gl.linkProgram(program);gl.deleteShader(v);gl.deleteShader(f);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error("WEBGL_LINK_UNSUPPORTED");
      buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
      gl.useProgram(program);const pos=gl.getAttribLocation(program,"aPosition");gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
      gl.uniform1i(gl.getUniformLocation(program,"uImage"),0);
    }catch(_){onFailure?.();return}
    let ready=false;
    const imageEl=new Image();imageEl.crossOrigin="anonymous";imageEl.decoding="async";
    const draw=(y,p,z)=>{
      if(!ready||disposed||gl.isContextLost())return;
      const w=Math.max(1,canvas.clientWidth),h=Math.max(1,canvas.clientHeight),d=Math.min(window.devicePixelRatio||1,2);
      const pw=Math.max(1,Math.floor(w*d)),ph=Math.max(1,Math.floor(h*d));
      if(canvas.width!==pw||canvas.height!==ph){canvas.width=pw;canvas.height=ph}
      gl.viewport(0,0,pw,ph);gl.useProgram(program);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);
      gl.uniform2f(gl.getUniformLocation(program,"uResolution"),pw,ph);
      gl.uniform1f(gl.getUniformLocation(program,"uYaw"),y*Math.PI/180);
      gl.uniform1f(gl.getUniformLocation(program,"uPitch"),p*Math.PI/180);
      gl.uniform1f(gl.getUniformLocation(program,"uFov"),(75/z)*Math.PI/180);
      gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
    };
    imageEl.onload=()=>{
      if(disposed)return;
      try{
        texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,imageEl);
        ready=true;rendererRef.current=draw;
        draw(cameraRef.current.yaw,cameraRef.current.pitch,cameraRef.current.zoom);
        if(typeof ResizeObserver!=="undefined"){observer=new ResizeObserver(()=>draw(cameraRef.current.yaw,cameraRef.current.pitch,cameraRef.current.zoom));observer.observe(canvas)}
      }catch(_){if(!disposed)onFailure?.()}
    };
    imageEl.onerror=()=>{if(!disposed)onFailure?.()};imageEl.src=image;
    return()=>{disposed=true;rendererRef.current=null;cancelAnimationFrame(raf);observer?.disconnect();imageEl.onload=null;imageEl.onerror=null;if(texture)gl.deleteTexture(texture);if(buffer)gl.deleteBuffer(buffer);if(program)gl.deleteProgram(program)};
  },[image]);
  useEffect(()=>{rendererRef.current?.(yaw,pitch,zoom)},[yaw,pitch,zoom]);
  return html`<canvas ref=${canvasRef} className="cab-panorama-canvas" aria-hidden="true"/>`;
}

function MediaStage({image,alt,hotspots=[],active,setActive,fallbackTitle,fallbackCopy,viewType="",sceneKey=""}){
  const viewerRef=React.useRef(null),gestureRef=React.useRef(null);
  const [camera,setCamera]=useState({x:0,y:0,yaw:0,pitch:0,zoom:1});
  const [imageInfo,setImageInfo]=useState(null),[imageError,setImageError]=useState(false);
  const [pano,setPano]=useState(false),[panoError,setPanoError]=useState(false);
  const [fullscreen,setFullscreen]=useState(false),[activity,setActivity]=useState(false);
  const selected=hotspots.find(h=>h._id===active)||null;
  const eligiblePano=Boolean(imageInfo&&imageInfo.w>=1024&&Math.abs(imageInfo.w/imageInfo.h-2)<.11);
  const isPano=eligiblePano&&pano&&!panoError;
  useEffect(()=>{setCamera({x:0,y:0,yaw:0,pitch:0,zoom:1});setImageInfo(null);setImageError(false);setPanoError(false);setPano(false);setActivity(false)},[image,sceneKey]);
  useEffect(()=>{if(eligiblePano&&cabIsPanoType(viewType)&&!panoError)setPano(true)},[eligiblePano,viewType,panoError]);
  useEffect(()=>{const listener=()=>setFullscreen(document.fullscreenElement===viewerRef.current);document.addEventListener("fullscreenchange",listener);return()=>document.removeEventListener("fullscreenchange",listener)},[]);
  const changeZoom=delta=>{setActivity(true);setCamera(c=>({...c,zoom:cabClamp(c.zoom+delta,1,2.5)}))};
  const pointerDown=e=>{if(!image||imageError||e.button!==0||e.target.closest("button"))return;gestureRef.current={id:e.pointerId,x:e.clientX,y:e.clientY,camera};setActivity(true);e.currentTarget.setPointerCapture?.(e.pointerId)};
  const pointerMove=e=>{const g=gestureRef.current;if(!g||e.pointerId!==g.id)return;const w=Math.max(1,e.currentTarget.clientWidth),h=Math.max(1,e.currentTarget.clientHeight);const dx=e.clientX-g.x,dy=e.clientY-g.y;
    if(isPano)setCamera(c=>({...c,yaw:g.camera.yaw-dx/w*125,pitch:cabClamp(g.camera.pitch+dy/h*85,-78,78)}));
    else {const max=Math.max(3,(g.camera.zoom-1)*40+3);setCamera(c=>({...c,x:cabClamp(g.camera.x+dx/w*100,-max,max),y:cabClamp(g.camera.y+dy/h*100,-max,max)}))}
  };
  const pointerUp=e=>{if(gestureRef.current?.id===e.pointerId)gestureRef.current=null};
  const handleKey=e=>{if(e.target!==e.currentTarget)return;const factor=e.shiftKey?2:1;let used=true;switch(e.key){
    case"ArrowLeft":case"a":case"A":setCamera(c=>({...c,yaw:c.yaw-12*factor,x:cabClamp(c.x+6*factor,-50,50)}));break;
    case"ArrowRight":case"d":case"D":setCamera(c=>({...c,yaw:c.yaw+12*factor,x:cabClamp(c.x-6*factor,-50,50)}));break;
    case"ArrowUp":case"w":case"W":setCamera(c=>({...c,pitch:cabClamp(c.pitch+9*factor,-78,78),y:cabClamp(c.y+6*factor,-50,50)}));break;
    case"ArrowDown":case"s":case"S":setCamera(c=>({...c,pitch:cabClamp(c.pitch-9*factor,-78,78),y:cabClamp(c.y-6*factor,-50,50)}));break;
    case"+":case"=":changeZoom(.18);break;
    case"-":case"_":changeZoom(-.18);break;
    case"0":setCamera({x:0,y:0,yaw:0,pitch:0,zoom:1});break;
    default:used=false}
    if(used){e.preventDefault();setActivity(true)}
  };
  const focusHotspot=h=>{setActive?.(h._id);setActivity(true);const fx=raw(h,"focus_x","focusX"),fy=raw(h,"focus_y","focusY"),fz=raw(h,"focus_zoom","focusZoom");
    if(fx!==""||fy!==""||fz!=="")setCamera(c=>({...c,x:fx!==""?cabClamp((50-N(fx,50))*.2,-35,35):c.x,y:fy!==""?cabClamp((50-N(fy,50))*.2,-35,35):c.y,zoom:fz!==""?cabClamp(N(fz,1.3),1,2.5):c.zoom}));
    if(isPano)setCamera(c=>({...c,yaw:(N(raw(h,"x","xPercent"),50)/100-.5)*360,pitch:(.5-N(raw(h,"y","yPercent"),50)/100)*150}));
  };
  const toggleFullscreen=()=>{const node=viewerRef.current;if(!node)return;if(document.fullscreenElement===node){document.exitFullscreen?.().catch?.(()=>{})}else{const res=node.requestFullscreen?.();res?.catch?.(()=>{})}};
  const title=T(fallbackTitle||alt||"Cabin view");
  return html`<div className="cab-card cab-smart-media"><div ref=${viewerRef} className="cab-immersive-viewer" tabIndex="0" role="region" aria-label=${`${title}. Drag to look around, scroll or use zoom controls, arrow keys to adjust camera.`} onPointerDown=${pointerDown} onPointerMove=${pointerMove} onPointerUp=${pointerUp} onPointerCancel=${pointerUp} onLostPointerCapture=${()=>{gestureRef.current=null}} onKeyDown=${handleKey} onWheel=${e=>{if(!image||imageError)return;e.preventDefault();changeZoom(e.deltaY>0?-.14:.14)}}>
    ${image&&!imageError?html`<div className="cab-immersive-frame">
      ${isPano?html`<${PanoramaCanvas} image=${image} yaw=${camera.yaw} pitch=${camera.pitch} zoom=${camera.zoom} onFailure=${()=>{setPanoError(true);setPano(false)}}/>`:html`<div className="cab-photo-plane" style=${{transform:`translate3d(${camera.x}%,${camera.y}%,0) scale(${Math.max(1.08,camera.zoom)})`}}><img className=${`cab-immersive-image ${activity||cabReducedMotion()?"":"cab-ambient-motion"}`} src=${image} alt=${alt} draggable="false" onLoad=${e=>{const im=e.currentTarget;setImageInfo({w:im.naturalWidth,h:im.naturalHeight})}} onError=${()=>setImageError(true)}/>${hotspots.map((h,i)=>html`<button type="button" className="cab-hotspot" key=${h._id||i} data-active=${h._id===active?"true":"false"} style=${{left:`${cabClamp(N(raw(h,"x","xPercent"),50),0,100)}%`,top:`${cabClamp(N(raw(h,"y","yPercent"),50),0,100)}%`}} aria-label=${T(h.label||h.title||`Cabin feature ${i+1}`)} onClick=${()=>focusHotspot(h)}>${i+1}</button>`)}</div>`}
    </div>`:html`<div className="cab-media-fallback cab-immersive-fallback"><div><strong>${imageError?"Unable to display this cabin image":title}</strong><span>${imageError?"The published cabin image could not be loaded.":fallbackCopy}</span></div></div>`}
    <div className="cab-viewer-top"><div className="cab-viewer-heading"><span>SKANDI CABIN EXPLORER</span><strong>${title}</strong></div><div className="cab-viewer-tools">
      ${eligiblePano?html`<button type="button" className="cab-glass-tool" aria-pressed=${isPano} onClick=${()=>{setActivity(true);setPano(!isPano)}} title="Use 360-degree projection only with equirectangular panorama photography">${isPano?"PHOTO":"360°"}</button>`:null}
      <button type="button" className="cab-glass-tool" onClick=${()=>changeZoom(-.2)} disabled=${!image||camera.zoom<=1} aria-label="Zoom out">−</button>
      <button type="button" className="cab-glass-tool" onClick=${()=>changeZoom(.2)} disabled=${!image||camera.zoom>=2.5} aria-label="Zoom in">+</button>
      <button type="button" className="cab-glass-tool" onClick=${()=>{setCamera({x:0,y:0,yaw:0,pitch:0,zoom:1});setActivity(false)}} aria-label="Reset view">↺</button>
      <button type="button" className="cab-glass-tool" onClick=${toggleFullscreen} aria-label=${fullscreen?"Exit fullscreen":"Enter fullscreen"}>${fullscreen?"↙":"⤢"}</button>
    </div></div>
    ${image&&!imageError?html`<div className="cab-viewer-instructions">${isPano?"Drag to turn · scroll to zoom":"Drag to explore · scroll to zoom"}<span aria-hidden="true">·</span> Arrow keys supported</div>`:null}
    ${selected?html`<div className="cab-hotspot-label" role="status"><strong>${T(selected.title||selected.label||"Cabin feature")}</strong>${T(selected.description||selected.summary||"")?html`<span>${T(selected.description||selected.summary)}</span>`:null}<button type="button" className="cab-hotspot-close" onClick=${()=>setActive?.("")} aria-label="Close feature detail">×</button></div>`:null}
  </div>${hotspots.length?html`<div className="cab-feature-rail" aria-label="Cabin features">${hotspots.map((h,i)=>html`<button type="button" key=${h._id||i} data-active=${h._id===active?"true":"false"} onClick=${()=>focusHotspot(h)}>${i+1}. ${T(h.label||h.title||"Feature")}</button>`)}</div>`:null}</div>`;
}

function CabinExplorer({bundle,aircraft,cabin,legacyClass}){
  const views=useMemo(()=>viewsFor(bundle,aircraft,cabin,legacyClass),[bundle,aircraft._id,cabin?._id]);const defaultView=views.find(v=>raw(v,"is_default","isDefault")===true)||views[0];const[viewId,setViewId]=useState(defaultView?._id||"");useEffect(()=>setViewId((views.find(v=>raw(v,"is_default","isDefault")===true)||views[0])?._id||""),[aircraft._id,cabin?._id]);const view=views.find(v=>v._id===viewId)||views[0];const canonicalHot=hotspotsFor(bundle,view);const hotspots=canonicalHot.length?canonicalHot:A(view?._legacyHotspots).map((h,i)=>({...h,_id:T(h.id||h.hotspotId)||`legacy-${i}`}));const[hot,setHot]=useState(hotspots[0]?._id||"");useEffect(()=>setHot(hotspots[0]?._id||""),[viewId]);const amenities=amenityItems(cabin,legacyClass);const desc=T(raw(cabin,"description","summary"))||T(raw(legacyClass,"summary"));
  return html`<div>${views.length?html`<div className="cab-view-strip">${views.map(v=>html`<button className="cab-pill" data-active=${v._id===view?._id?"true":"false"} onClick=${()=>transition(()=>setViewId(v._id))}>${v._label}</button>`)}</div>`:null}<div className="cab-grid"><${MediaStage} image=${view?._image||""} alt=${`${cabin?._name||"Cabin"} cabin view`} hotspots=${hotspots} active=${hot} setActive=${setHot} fallbackTitle=${cabin?._name||"Cabin explorer"} fallbackCopy=${views.length?"An image is not available for this view.":"No cabin imagery is currently published for this configuration."} viewType=${T(raw(view,"view_type","viewType"))}/><aside className="cab-card cab-pad"><h4 className="cab-title">${cabin?._name||"Cabin"}</h4><p className="cab-copy">${desc||"Cabin details will appear here when available."}</p>${amenities.length?html`<div className="cab-amenities">${amenities.map(a=>html`<span className="cab-amenity"><b>${a.label}</b>${a.value?` · ${a.value}`:""}</span>`)}</div>`:html`<div className="cab-empty" style=${{marginTop:"14px"}}><strong>Amenities are not available for this cabin.</strong><span>We do not infer cabin features that are not in the airline information.</span></div>`}<div className="cab-layout-note" style=${{marginTop:"14px"}}>${views.length?`${views.length} view${views.length===1?"":"s"} for this aircraft/cabin context.`:"Cabin views are not currently published."}</div></aside></div></div>`
}
function SeatExperience({aircraft,cabin,legacyClass}){const layout=configuredSeatLayout(cabin);const amenities=amenityItems(cabin,legacyClass);const[selected,setSelected]=useState("");if(!layout.length)return html`<div className="cab-grid"><div className="cab-card cab-pad"><div className="cab-empty"><strong>Cabin layout preview is not available.</strong><span>Seat positions, pitch, width and recline are not inferred. Seat availability is shown during booking.</span></div></div><aside className="cab-card cab-pad"><h4 className="cab-title">${cabin?._name||"Seat experience"}</h4><p className="cab-copy">${T(raw(cabin,"description","summary"))||"Published cabin information appears here when available."}</p>${amenities.length?html`<div className="cab-amenities">${amenities.map(a=>html`<span className="cab-amenity"><b>${a.label}</b>${a.value?` · ${a.value}`:""}</span>`)}</div>`:null}</aside></div>`;
  const rows=[1,2,3];return html`<div className="cab-grid"><div className="cab-card cab-layout"><div className="cab-layout-note"><strong>Cabin layout preview.</strong> This is an informational representation based on the published cabin layout setting, not a live seat map.</div><div className="cab-seatrows">${rows.map(r=>html`<div className="cab-row"><span className="cab-rowno">${r}</span>${layout.map((group,gi)=>html`<${React.Fragment} key=${gi}><span className="cab-seatgroup">${group.map(letter=>{const id=`${r}${letter}`;return html`<button className="cab-seat" data-active=${selected===id?"true":"false"} onClick=${()=>setSelected(id)}>${id}</button>`})}</span>${gi<layout.length-1?html`<span className="cab-aisle"></span>`:null}</${React.Fragment}>`)}</div>`)}</div><div className="cab-seatinfo"><strong>${selected||"Select a representative seat"}</strong><span>${selected?`${cabin?._name||"Cabin"} · availability, restrictions and pricing are shown during booking.`:"Choose a seat in the preview to see its cabin context."}</span></div></div><aside className="cab-card cab-pad"><h4 className="cab-title">Seat & cabin features</h4>${amenities.length?html`<div className="cab-amenities">${amenities.map(a=>html`<span className="cab-amenity"><b>${a.label}</b>${a.value?` · ${a.value}`:""}</span>`)}</div>`:html`<div className="cab-empty"><strong>Seat features are not available.</strong><span>Only configured cabin information is shown.</span></div>`}</aside></div>`
}
function Walkthrough({bundle,aircraft}){
  const scenes=useMemo(()=>scenesFor(bundle,aircraft),[bundle,aircraft._id]);
  const start=T(raw(aircraft,"walkthrough_start_scene_code","walkthroughStartSceneCode"));
  const initial=()=>scenes.some(s=>s._code===start)?start:scenes[0]?._code||"";
  const [code,setCode]=useState(initial);
  const [auto,setAuto]=useState(!cabReducedMotion());
  const [visible,setVisible]=useState(!document.hidden);
  const [hot,setHot]=useState("");
  useEffect(()=>{setCode(initial());setAuto(!cabReducedMotion());setHot("")},[aircraft._id]);
  useEffect(()=>{const onVisibility=()=>setVisible(!document.hidden);document.addEventListener("visibilitychange",onVisibility);return()=>document.removeEventListener("visibilitychange",onVisibility)},[]);
  const index=Math.max(0,scenes.findIndex(s=>s._code===code));
  const scene=scenes[index];
  const validCode=ref=>scenes.some(s=>s._code===ref&&s._code!==scene?._code)?ref:"";
  const nextCode=scene?validCode(T(raw(scene,"forward_scene_code","forwardSceneCode")))||scenes[index+1]?._code||"":"";
  const backCode=scene?validCode(T(raw(scene,"back_scene_code","backSceneCode")))||scenes[index-1]?._code||"":"";
  const hotspots=scene?sceneHotspotsFor(bundle,scene):[];
  const image=scene?T(raw(scene,"image_url","imageUrl","mobile_image_url","mobileImageUrl")):"";
  useEffect(()=>{setHot("")},[scene?._code]);
  useEffect(()=>{if(!auto||!visible||!nextCode||!image||cabReducedMotion())return;const id=window.setTimeout(()=>transition(()=>setCode(nextCode)),7200);return()=>window.clearTimeout(id)},[auto,visible,code,nextCode,image]);
  useEffect(()=>{if(!nextCode)return;const next=scenes.find(s=>s._code===nextCode);const url=T(raw(next,"image_url","imageUrl","mobile_image_url","mobileImageUrl"));if(!url)return;const preload=new Image();preload.src=url;return()=>{preload.src=""}},[nextCode,aircraft._id]);
  const visit=(target,manual=true)=>{if(!target||!scenes.some(s=>s._code===target))return;if(manual)setAuto(false);transition(()=>setCode(target))};
  if(!scenes.length)return html`<div className="cab-empty"><strong>No published cabin walkthrough is available for this aircraft.</strong><span>Cabin Explorer shows any available published cabin photography. Interactive walking requires linked walkthrough scenes configured for this aircraft.</span></div>`;
  const sceneTitle=T(scene?.short_title||scene?.shortTitle||scene?.title)||`Cabin stop ${index+1}`;
  return html`<div className="cab-smart-walk">
    <div className="cab-walk-overview"><div><span className="cab-walk-eyebrow">EXPLORE THE AIRCRAFT</span><h4>Walk through the cabin</h4><p>Move through published cabin scenes, look around each view, or follow the guided tour.</p></div>
      <div className="cab-walk-top-actions"><button type="button" className="cab-action" onClick=${()=>visit(initial())}>Start at entrance</button><button type="button" className="cab-action cab-action-primary" aria-pressed=${auto} disabled=${scenes.length<2||!image} onClick=${()=>setAuto(v=>!v)}>${auto&&nextCode?"Pause tour":auto?"Tour finished":"Start auto-tour"}</button></div>
    </div>
    <div className="cab-smart-walk-layout">
      <nav className="cab-walk-map" aria-label="Cabin tour stops"><div className="cab-walk-map-title">CABIN ROUTE <span>${index+1} / ${scenes.length}</span></div><div className="cab-walk-map-list">${scenes.map((s,i)=>html`<button type="button" key=${s._code||i} className="cab-walk-stop" data-active=${s._code===scene._code?"true":"false"} aria-current=${s._code===scene._code?"step":undefined} onClick=${()=>visit(s._code)}><span className="cab-walk-node">${String(i+1).padStart(2,"0")}</span><span><strong>${T(s.short_title||s.shortTitle||s.title)||s._code}</strong>${T(s.summary)?html`<small>${T(s.summary)}</small>`:null}</span></button>`)}</div><p className="cab-walk-map-footer">The route follows the published walkthrough sequence. Views may vary by aircraft configuration.</p></nav>
      <section className="cab-walk-stage" aria-label="Interactive cabin scene"><div className="cab-walk-scene-meta"><div><span>STOP ${String(index+1).padStart(2,"0")}</span><strong>${sceneTitle}</strong></div>${auto&&nextCode&&visible?html`<div className="cab-walk-autoprogress" role="progressbar" aria-label="Time until next cabin view"><i key=${scene._code}/></div>`:null}</div>
        <div className="cab-walk-scene-swap" key=${scene._code} onPointerDown=${()=>setAuto(false)}><${MediaStage} image=${image} alt=${T(scene.title)||"Aircraft cabin walkthrough"} hotspots=${hotspots} active=${hot} setActive=${setHot} fallbackTitle=${sceneTitle} fallbackCopy=${T(scene.summary)||"There is no published image for this stop."} sceneKey=${scene._code}/>${nextCode&&image?html`<button type="button" className="cab-aisle-move" onClick=${()=>visit(nextCode)} aria-label=${`Walk forward to ${T(scenes.find(s=>s._code===nextCode)?.title)||"next cabin stop"}`}><span aria-hidden="true">↑</span><strong>WALK FORWARD</strong></button>`:null}</div>
        <div className="cab-walk-navigation"><button type="button" disabled=${!backCode} onClick=${()=>visit(backCode)} aria-label="Move to previous cabin stop"><span aria-hidden="true">←</span><span><small>WALK BACK</small><strong>${backCode?T((scenes.find(s=>s._code===backCode)?.short_title)||(scenes.find(s=>s._code===backCode)?.title)||"Previous stop"):"Entrance"}</strong></span></button>
        <button type="button" className="cab-walk-next" disabled=${!nextCode} onClick=${()=>visit(nextCode)} aria-label="Move to next cabin stop"><span><small>WALK FORWARD</small><strong>${nextCode?T((scenes.find(s=>s._code===nextCode)?.short_title)||(scenes.find(s=>s._code===nextCode)?.title)||"Next stop"):"End of cabin"}</strong></span><span aria-hidden="true">→</span></button></div>
      </section>
    </div>
  </div>`;
}

function AircraftMap({aircraft,cabins,cabinId,setCabin}){const total=Math.max(1,cabins.reduce((n,c)=>n+Math.max(1,c._seats),0));let y=95;const zones=cabins.map(c=>{const h=Math.max(38,(Math.max(1,c._seats)/total)*245);const z={c,y,h};y+=h;return z});return html`<div className="cab-grid"><div className="cab-card cab-map-card"><h4 className="cab-title">Cabin layout overview</h4><p className="cab-copy">Illustrative nose-to-tail orientation generated from the configured cabin records. It is not an engineering diagram.</p><svg className="cab-map-svg" viewBox="0 0 360 470" role="img" aria-label="Illustrative aircraft cabin orientation"><path d="M180 18c-31 0-53 56-58 126l-7 183c-2 58 26 112 65 125 39-13 67-67 65-125l-7-183C233 74 211 18 180 18Z" fill="#e7eef2" stroke="#9db4c5" stroke-width="2"/><path d="M121 218 30 282l8 22 84-28M239 218l91 64-8 22-84-28" fill="#d9e5eb" stroke="#9db4c5" stroke-width="2"/>${zones.map(({c,y,h})=>html`<g className="cab-zone" data-active=${c._id===cabinId?"true":"false"} onClick=${()=>setCabin(c._id)} onKeyDown=${e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();setCabin(c._id)}}} role="button" tabIndex="0" aria-label=${`Select ${c._name}`}><rect x="137" y=${y} width="86" height=${h-3} rx="14" fill=${c._id===cabinId?"#9de0e5":"#f9fbfc"} stroke=${c._id===cabinId?"#5fc7cf":"#bfd0dc"}/><text className="cab-zone-label" x="180" y=${y+h/2}>${c._name}</text></g>`)}</svg><div className="cab-map-note">Cabin-zone length is proportional to configured seat counts. Door, galley, lavatory and wing relationships appear only when configured.</div></div><aside className="cab-card cab-pad"><h4 className="cab-title">Cabins</h4><div className="cab-cabin-list">${cabins.map(c=>html`<button className="cab-cabin-card" data-active=${c._id===cabinId?"true":"false"} onClick=${()=>setCabin(c._id)}><strong>${c._name}</strong><span>${[c._code,c._seats?`${c._seats} seats`:""].filter(Boolean).join(" · ")}</span></button>`)}</div></aside></div>`}
function App({bundle,airline}){
  useMobile();const aircrafts=useMemo(()=>A(bundle?.aircraft).map(normalizeAircraft),[bundle]);const[aircraftId,setAircraftId]=useState(aircrafts[0]?._id||"");const aircraft=aircrafts.find(a=>a._id===aircraftId)||aircrafts[0];const cabins=useMemo(()=>aircraft?normalizeCabins(bundle,aircraft._id):[],[bundle,aircraft?._id]);const[cabinId,setCabinId]=useState(cabins[0]?._id||"");useEffect(()=>setCabinId(cabins[0]?._id||""),[aircraft?._id]);const cabin=cabins.find(c=>c._id===cabinId)||cabins[0];const[mode,setMode]=useState(()=>{const first=aircrafts[0];if(!first)return"overview";if(scenesFor(bundle,first).some(s=>T(raw(s,"image_url","imageUrl"))))return"walk";if(A(bundle?.views).some(v=>T(raw(v,"aircraft_id","aircraftId"))===first._id))return"cabin";return"overview"});const legacy=legacyData(airline),legacyClass=legacyClassFor(legacy,cabin);if(!aircraft)return html`<div className="cab-root"><style>${css}</style><div className="cab-shell"><div className="cab-empty" style=${{margin:"18px"}}><strong>Aircraft information is not currently available.</strong><span>The airline guide remains available above.</span></div></div></div>`;const modes=[["overview","Overview"],["cabin","Cabin Explorer"],["seat","Seat Experience"],["walk","Walkthrough"],["map","Aircraft Map"]];return html`<div className="cab-root"><style>${css}</style><section className="cab-shell"><header className="cab-top"><div className="cab-kicker">SKANDI · Aircraft & Cabin Explorer</div><h3>${T(airline?.name||airline?.title||aircraft.airline_code||"Airline")} · ${aircraft._name}</h3><p>Explore the aircraft and cabin experience. Aircraft substitutions can occur, and seat availability is shown during booking.</p></header><div className="cab-selectors"><div className="cab-aircraft-strip">${aircrafts.map(a=>html`<button className="cab-pill" data-active=${a._id===aircraft._id?"true":"false"} onClick=${()=>transition(()=>setAircraftId(a._id))}>${a._code||"Aircraft"} · ${a._name}</button>`)}</div><div className="cab-mode-strip">${modes.map(([id,label])=>html`<button className="cab-pill" data-active=${mode===id?"true":"false"} onClick=${()=>transition(()=>setMode(id))}>${label}</button>`)}</div>${cabins.length?html`<div className="cab-cabin-strip">${cabins.map(c=>html`<button className="cab-pill cab-cabin" data-active=${c._id===cabin?._id?"true":"false"} onClick=${()=>transition(()=>setCabinId(c._id))}>${c._name}${c._code?` · ${c._code}`:""}</button>`)}</div>`:null}</div><div className="cab-body">${mode==="overview"?html`<${Overview} aircraft=${aircraft} cabins=${cabins} cabinId=${cabinId} setCabin=${setCabinId}/>`:mode==="cabin"?html`<${CabinExplorer} bundle=${bundle} aircraft=${aircraft} cabin=${cabin} legacyClass=${legacyClass}/>`:mode==="seat"?html`<${SeatExperience} aircraft=${aircraft} cabin=${cabin} legacyClass=${legacyClass}/>`:mode==="walk"?html`<${Walkthrough} bundle=${bundle} aircraft=${aircraft}/>`:html`<${AircraftMap} aircraft=${aircraft} cabins=${cabins} cabinId=${cabinId} setCabin=${setCabinId}/>`}</div><footer className="cab-footer"><span>Aircraft and cabin information is provided for travel planning. The operating airline may change aircraft or configuration.</span><button type="button" onClick=${()=>navigate("/flights")}>Explore flights</button></footer></section></div>`
}
function mount(element,bundle,airline){if(!element)return;let root=roots.get(element);if(!root){root=createRoot(element);roots.set(element,root)}root.render(html`<${App} bundle=${bundle||{}} airline=${airline||{}}/>`)}
window.SKANDIOnboardReact={mount,version:"React 19.3 / SKANDI V12"};
window.dispatchEvent(new Event("SKANDI_ONBOARD_REACT_READY"));
const pending=window.__SKANDI_ONBOARD_PENDING__;if(pending){const el=document.getElementById(pending.elementId||"onboardReactRoot");if(el)mount(el,pending.bundle,pending.airline)}
