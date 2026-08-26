import { getSecret } from "wix-secrets-backend";
import { fetch } from "wix-fetch";

async function cfg() {
  const [url,key] = await Promise.all([
    getSecret("SUPABASE_URL"),
    getSecret("SUPABASE_SERVICE_ROLE_KEY")
  ]);
  return {url:String(url||"").replace(/\/$/,""),key:String(key||"")};
}
async function sb(path,{method="get",body,prefer="return=representation"}={}) {
  const {url,key}=await cfg();
  const r=await fetch(`${url}/rest/v1/${path}`,{
    method,
    headers:{apikey:key,Authorization:`Bearer ${key}`,"Content-Type":"application/json",Prefer:prefer},
    body:body===undefined?undefined:JSON.stringify(body)
  });
  if(!r.ok)throw new Error(`Document access ${r.status}: ${(await r.text()).slice(0,500)}`);
  const t=await r.text(); return t?JSON.parse(t):null;
}
function codeValue(length=10){
  const chars="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out="";
  const a=new Uint32Array(length);
  crypto.getRandomValues(a);
  for(const v of a)out+=chars[v%chars.length];
  return out;
}
function packetNumber(){
  return `DOC-${new Date().toISOString().slice(0,10).replaceAll("-","")}-${Math.random().toString(36).slice(2,8).toUpperCase()}`;
}

export async function listPublicDefinitionsCore(){
  const rows=await sb(
    "document_definitions?active=eq.true&public_template_access=eq.OPEN&order=category.asc,code.asc"
  );
  return Array.isArray(rows)?rows:[];
}

export async function listBookingDocumentsCore({bookingId="",bookingReference=""}={}){
  const filters=["status=not.in.(ARCHIVED,CANCELLED)"];
  if(bookingId)filters.push(`booking_id=eq.${encodeURIComponent(bookingId)}`);
  const rows=await sb(`document_instances?${filters.join("&")}&order=created_at.desc`);
  if(!bookingId && bookingReference){
    return (Array.isArray(rows)?rows:[]).filter(r =>
      String(r.live_payload?.bookingReference||r.issued_payload?.bookingReference||"").toUpperCase() ===
      String(bookingReference).toUpperCase()
    );
  }
  return Array.isArray(rows)?rows:[];
}

export async function listDcsDocumentsCore({bookingId="",pnr="",travelerId=""}={}){
  const docs=await listBookingDocumentsCore({bookingId,bookingReference:pnr});
  const codes=await sb(
    "document_definitions?active=eq.true&departure_control_available=eq.true&select=code,name,sensitivity_class"
  );
  const allowed=new Map((Array.isArray(codes)?codes:[]).map(x=>[x.code,x]));
  return docs.filter(d =>
    allowed.has(d.document_code) &&
    (!travelerId || !d.traveler_id || d.traveler_id===travelerId)
  ).map(d=>({...d,definition:allowed.get(d.document_code)}));
}

export async function listDocuNetDefinitionsCore(){
  const rows=await sb(
    "document_definitions?active=eq.true&docunet_available=eq.true&order=category.asc,code.asc"
  );
  return Array.isArray(rows)?rows:[];
}

export async function createAccessPacketCore({
  bookingId="",bookingReference="",travelerId="",email="",documentIds=[],
  createdBy="",expiresHours=48
}={}){
  const cleanEmail=String(email||"").trim().toLowerCase();
  if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(cleanEmail))throw new Error("Valid customer email required.");
  if(!Array.isArray(documentIds)||!documentIds.length)throw new Error("Select at least one document.");
  const accessCode=codeValue(10);
  const number=packetNumber();
  const expiresAt=new Date(Date.now()+Math.max(1,Number(expiresHours||48))*3600000).toISOString();

  const rpc=await sb("rpc/skandi_create_document_access_packet",{
    method:"post",
    body:{
      p_packet_number:number,p_booking_id:bookingId||null,
      p_booking_reference:bookingReference||null,p_traveler_id:travelerId||null,
      p_email:cleanEmail,p_access_code:accessCode,p_expires_at:expiresAt,p_created_by:createdBy||null
    }
  });
  const packetId=typeof rpc==="string"?rpc:Array.isArray(rpc)?rpc[0]:rpc;
  await sb("document_access_packet_items",{
    method:"post",
    body:documentIds.map((documentId,index)=>({
      packet_id:packetId,document_id:documentId,action_type:"REVIEW_SIGN",required:true,sort_order:index
    }))
  });
  return {packetId,packetNumber:number,accessCode,expiresAt,email:cleanEmail};
}

export async function updateDefinitionAccessCore(code,accessPolicy={}){
  const allowed=[
    "public_template_access","customer_instance_access","allow_blank_fill","allow_blank_download",
    "allow_self_start","reservations_available","departure_control_available","docunet_available",
    "docunet_admin_available","sensitivity_class","official_source_url"
  ];
  const patch={updated_at:new Date().toISOString()};
  for(const key of allowed)if(key in accessPolicy)patch[key]=accessPolicy[key];
  const rows=await sb(`document_definitions?code=eq.${encodeURIComponent(code)}`,{method:"patch",body:patch});
  return Array.isArray(rows)?rows[0]:rows;
}

export { sb as documentAccessSupabase };
