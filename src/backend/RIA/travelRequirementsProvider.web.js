// backend/RIA/travelRequirementsProvider.web.js
// SKANDI V9.12.1 approved external travel-requirements provider adapter.
// This never claims Timatic/IATA authority unless an authorized provider URL/token is configured.
import { fetch } from "wix-fetch";
import { secrets } from "wix-secrets-backend.v2";
import { elevate } from "wix-auth";

const elevatedGetSecretValue = elevate(secrets.getSecretValue);
const clean=(v,n=6000)=>String(v??"").trim().slice(0,n);
const arr=v=>Array.isArray(v)?v:[];
async function secret(name){try{const r=await elevatedGetSecretValue(name);return clean(r?.value??r?.secretValue??r?.secret?.value??r,2000)}catch(_){return ""}}

export async function checkExternalTravelRequirements({cart,travelers=[]}={}){
  const url=await secret("TRAVEL_REQUIREMENTS_PROVIDER_URL");
  const token=await secret("TRAVEL_REQUIREMENTS_PROVIDER_TOKEN");
  if(!url||!token)return{connected:false,status:"NEEDS_PROVIDER",provider:"NONE",summary:"No authorized external travel-requirements provider is configured.",fields:[],notices:["SKANDI guidance can be shown, but it is not a live Timatic/IATA boarding decision."]};
  const response=await fetch(url,{method:"post",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({origin:cart?.searchContext?.origin||"",destination:cart?.searchContext?.destination||"",departureDate:cart?.searchContext?.departureDate||"",returnDate:cart?.searchContext?.returnDate||"",transitPoints:arr(cart?.searchContext?.transitPoints),travelers:arr(travelers).map(t=>({id:t.id||t.travelerId,nationality:t.nationality,residenceCountry:t.residenceCountry,documentType:t.documentType||t.documents?.[0]?.documentType,documentIssuingCountry:t.documentIssuingCountry||t.documents?.[0]?.issuingCountry,documentExpiryDate:t.documentExpiry||t.expiryDate||t.documents?.[0]?.expiryDate,dateOfBirth:t.dateOfBirth}))})});
  let json={};try{json=await response.json()}catch(_){}
  if(!response.ok)return{connected:true,status:"PROVIDER_ERROR",provider:clean(json.provider||"CONFIGURED",100),summary:clean(json.message||json.error||"Travel requirements provider returned an error.",1200),fields:[],notices:["Verify the configured requirements provider before relying on this result."]};
  return{connected:true,status:clean(json.status||"PROVIDER_RESULT",100),provider:clean(json.provider||"CONFIGURED",100),summary:clean(json.summary||"Travel requirements checked.",2000),decision:json.decision||json.result||null,fields:arr(json.fields),notices:arr(json.notices),raw:json};
}
