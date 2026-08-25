// backend/FINAL/hotelDetailService.web.js
import { webMethod, Permissions } from "wix-web-module";
import { secrets } from "wix-secrets-backend.v2";
import { elevate } from "wix-auth";
import { fetch } from "wix-fetch";

const getSecretValue = elevate(secrets.getSecretValue);

function clean(v,max=500){return String(v??"").trim().slice(0,max)}
function secretText(r){
  if(typeof r==="string") return r.trim();
  return clean(r?.value ?? r?.secretValue ?? r?.secret?.value ?? "",5000);
}
async function secret(name,fallback=""){
  try { return secretText(await getSecretValue(name)) || fallback; }
  catch (_) { return fallback; }
}
async function config(){
  const url = (await secret("SUPABASE_URL")).replace(/\/+$/,"");
  let key = await secret("SUPABASE_SECRET_KEY");
  let legacy = false;
  if(!key){key=await secret("SUPABASE_SERVICE_ROLE_KEY");legacy=true}
  if(!/^https:\/\/[^/]+\.supabase\.co$/i.test(url)) throw new Error("SUPABASE_URL_INVALID");
  if(!key) throw new Error("SUPABASE_SERVER_KEY_MISSING");
  return {url,key,legacy:legacy || !key.startsWith("sb_secret_")};
}
function headers(c){
  const h={apikey:c.key,Accept:"application/json","Content-Type":"application/json"};
  if(c.legacy) h.Authorization=`Bearer ${c.key}`;
  return h;
}
function slug(v){return clean(v,160).toLowerCase().replace(/[^a-z0-9-]+/g,"-").replace(/^-+|-+$/g,"")}
async function queryRows(filters){
  const c=await config();
  const params=new URLSearchParams({select:"*",limit:"50"});
  Object.entries(filters).forEach(([k,v])=>{if(v) params.set(k,`eq.${v}`)});
  const res=await fetch(`${c.url}/rest/v1/destination_hotels?${params.toString()}`,{headers:headers(c)});
  const raw=await res.text();
  if(!res.ok) throw new Error(`HOTEL_DETAIL_HTTP_${res.status}`);
  return raw?JSON.parse(raw):[];
}

export const getHotelDetailPage = webMethod(
  Permissions.Anyone,
  async (input={}) => {
    const hotelSlug=slug(input.hotelSlug||input.slug||input.hotel);
    const areaSlug=slug(input.areaSlug||input.area);
    const destinationSlug=slug(input.destinationSlug||input.destination);
    const countrySlug=slug(input.countrySlug||input.country);

    let rows=[];
    if(hotelSlug) rows=await queryRows({slug:hotelSlug});
    if(!rows.length && input.hotelId) rows=await queryRows({id:clean(input.hotelId,120)});
    const row=rows[0]||null;
    if(!row) return {ok:false,notFound:true,hotel:null};

    if(areaSlug && row.area_slug && slug(row.area_slug)!==areaSlug) return {ok:false,notFound:true,hotel:null};
    if(destinationSlug && row.destination_slug && slug(row.destination_slug)!==destinationSlug) return {ok:false,notFound:true,hotel:null};
    if(countrySlug && row.country_slug && slug(row.country_slug)!==countrySlug) return {ok:false,notFound:true,hotel:null};

    return {ok:true,hotel:row,page:row};
  }
);
