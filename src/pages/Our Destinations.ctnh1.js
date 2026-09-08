import wixLocation from "wix-location";
import { getInventoryDestinationIndex } from "backend/FINAL/destinationFlow.web";

const EMBED_ID="#htmlDestinations";
const CHILD_SOURCE="SKANDI_DESTINATIONS_INDEX";
const PARENT_SOURCE="SKANDI_WIX_PARENT";
let lastLanguage="EN";

const clean=(v,m=500)=>String(v??"").trim().slice(0,m);
const slug=v=>clean(v,180).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9-]+/g,"-").replace(/^-+|-+$/g,"");
const lang=v=>["EN","SV","NO","DA","FI"].includes(String(v||"EN").toUpperCase())?String(v||"EN").toUpperCase():"EN";
function html(){try{return $w(EMBED_ID)}catch(_){return null}}
function post(type,payload={}){html()?.postMessage?.({source:PARENT_SOURCE,type,payload,timestamp:new Date().toISOString()})}
function routeUrl(base,params={}){
  const q=new URLSearchParams();
  Object.entries(params).forEach(([k,v])=>{const x=slug(v);if(x)q.set(k,x)});
  return q.toString()?`${base}?${q}`:base;
}
function go(path){const p=clean(path,800);if(p)wixLocation.to(p)}

async function load(language=lastLanguage){
  lastLanguage=lang(language);
  post("DESTINATIONS_INDEX_LOADING",{loading:true});
  try{
    const result=await getInventoryDestinationIndex({language:lastLanguage});
    post("DESTINATIONS_INDEX_DATA",{countries:Array.isArray(result?.countries)?result.countries:[]});
  }catch(error){
    post("DESTINATIONS_INDEX_ERROR",{message:error?.message||"Destinations are temporarily unavailable."});
  }
}

$w.onReady(()=>{
  const el=html();
  if(!el?.onMessage){console.error(`[Destinations] Missing ${EMBED_ID}`);return}
  el.onMessage(async event=>{
    const m=event.data||{},p=m.payload||{};
    if(m.source!==CHILD_SOURCE)return;
    try{
      if(["DESTINATIONS_INDEX_READY","DESTINATIONS_INDEX_REFRESH","DESTINATIONS_LANGUAGE_CHANGE"].includes(m.type)){
        await load(p.language||lastLanguage);return;
      }
      if(m.type==="DESTINATIONS_OPEN_COUNTRY"){
        const country=slug(p.slug||p.countrySlug);
        if(country)go(routeUrl("/our-destinations/country",{country}));
        return;
      }
      if(m.type==="DESTINATIONS_OPEN_AREA"||m.type==="DESTINATIONS_OPEN_DESTINATION"){
        const country=slug(p.countrySlug);
        const destination=slug(p.destinationSlug||p.areaSlug);
        if(country&&destination)go(routeUrl("/our-destinations/country/destination",{country,destination}));
      }
    }catch(error){
      post("DESTINATIONS_INDEX_ERROR",{message:error?.message||"The request could not be completed."});
    }
  });
  setTimeout(()=>load(lastLanguage),350);
});
