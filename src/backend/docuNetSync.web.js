import { webMethod, Permissions } from "wix-web-module";
import { currentMember } from "wix-members-backend";
import { getSecret } from "wix-secrets-backend";
import { createClient } from "@supabase/supabase-js";
import {
  getDocuNetAdminBootstrap,
  searchDocuNetAdminDocuments,
  createDocuNetUpload,
  finalizeDocuNetUpload,
  saveDocuNetMetadata,
  getDocuNetViewerBootstrap
} from "backend/docuNet.web";

let clientPromise;

async function secretValue(name) {
  try { return await getSecret(name); } catch (_) { return ""; }
}

async function db() {
  if (!clientPromise) {
    clientPromise = Promise.all([
      secretValue("SUPABASE_URL"),
      secretValue("SUPABASE_SECRET_KEY"),
      secretValue("SUPABASE_SERVICE_ROLE_KEY")
    ]).then(([url, secretKey, legacyKey]) => {
      const key = secretKey || legacyKey;
      if (!url || !key) throw new Error("Supabase backend secrets are not configured.");
      return createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
        global: { headers: { "X-Client-Info": "skandi-docunet-sync/1.0" } }
      });
    });
  }
  return clientPromise;
}

const clean = (v, n=500) => String(v ?? "").trim().slice(0,n);

function normalizedCodes(value, fallback="ALL") {
  const src = Array.isArray(value) ? value : String(value || "").split(",");
  const out = [...new Set(src
    .map(v => String(v).trim().toUpperCase())
    .filter(v => v === "ALL" || /^[A-Z0-9_-]{2,24}$/.test(v))
  )];
  if (!out.length || out.includes("ALL")) return [fallback];
  return out;
}


const MARKET_CODES = new Set([
  "ALL","NYCXEC","STOXEC","BKKXEC","NYCGOP","ORLGOP","MIAGOP","LAXGOP","LASGOP","SFOGOP",
  "STOGOP","GOTGOP","KRNGOP","KRNICE","LLAGOP","BDNGOP","OSLGOP","TOSGOP","CPHGOP",
  "HELGOP","RVNGOP","JMKGOP","CHQGOP","HERGOP","SKGGOP","RHOGOP","JTRGOP","JSIGOP",
  "AGPGOP","ALCGOP","PMIGOP","TCIGOP","FUEGOP","LPAGOP","LPASWG","LPASEG",
  "BKKGOP","LNTGOP","HKTGOP","KBVGOP","USMGOP"
]);
const STATION_MARKET = {
  NYC:"NYCGOP", ORL:"ORLGOP", MIA:"MIAGOP", LAX:"LAXGOP", LAS:"LASGOP", SFO:"SFOGOP",
  STO:"STOGOP", GOT:"GOTGOP", KRN:"KRNGOP", LLA:"LLAGOP", BDN:"BDNGOP",
  OSL:"OSLGOP", TOS:"TOSGOP", CPH:"CPHGOP", HEL:"HELGOP", RVN:"RVNGOP",
  JMK:"JMKGOP", CHQ:"CHQGOP", HER:"HERGOP", SKG:"SKGGOP", RHO:"RHOGOP", JTR:"JTRGOP", JSI:"JSIGOP",
  AGP:"AGPGOP", ALC:"ALCGOP", PMI:"PMIGOP", TCI:"TCIGOP", FUE:"FUEGOP", LPA:"LPAGOP",
  BKK:"BKKGOP", LNT:"LNTGOP", HKT:"HKTGOP", KBV:"KBVGOP", USM:"USMGOP"
};
const ADMIN_ROLE_NAMES = new Set([
  "admin","administrator","site owner","super admin","system admin","docunet admin","document control","hr admin"
]);

function firstValue(...values) {
  return values.find(v => v !== undefined && v !== null && String(v).trim() !== "");
}
function customValue(member,key) {
  const fields = member?.customFields || member?.profile?.customFields || {};
  const value = fields[key];
  return value && typeof value === "object" ? firstValue(value.value,value.text,value.name) : value;
}
function roleNames(roles=[]) {
  return roles.map(r=>String(firstValue(r?.name,r?.title,r?.roleName,r?._id,""))).filter(Boolean);
}
function extractMarket(...values) {
  for (const rawValue of values) {
    const raw = String(rawValue || "").toUpperCase().replace(/[^A-Z0-9_-]/g,"");
    if (!raw) continue;
    if (MARKET_CODES.has(raw)) return raw;
    for (const code of MARKET_CODES) if (code !== "ALL" && raw.includes(code)) return code;
    if (STATION_MARKET[raw]) return STATION_MARKET[raw];
  }
  return "";
}
function normalizeAudience(value, department="") {
  const raw = String(value || "").trim().toUpperCase().replace(/\s+/g,"_");
  const allowed = new Set(["ALL","OPERATIONS","DESTINATION_STAFF","CUSTOMER_CARE","PARTNER_MANAGEMENT"]);
  if (allowed.has(raw)) return raw;
  const dep = String(department || "").toUpperCase();
  if (/CUSTOMER|CARE|SERVICE/.test(dep)) return "CUSTOMER_CARE";
  if (/PARTNER|SUPPLIER|COMMERCIAL/.test(dep)) return "PARTNER_MANAGEMENT";
  if (/DESTINATION|GUIDE|HOST|FIELD/.test(dep)) return "DESTINATION_STAFF";
  return "OPERATIONS";
}
async function currentActor() {
  const [member, roles] = await Promise.all([currentMember.getMember(), currentMember.getRoles()]);
  if (!member?._id) throw new Error("A signed-in staff account is required.");
  const email = String(firstValue(member.loginEmail,member.contactDetails?.emails?.[0],member.profile?.loginEmail,"")).trim().toLowerCase();
  const client = await db();
  let agentResponse = await client.from("agent_users").select("*").eq("wix_member_id",member._id).maybeSingle();
  if (agentResponse.error) throw new Error(agentResponse.error.message || "Unable to resolve staff profile.");
  if (!agentResponse.data && email) {
    agentResponse = await client.from("agent_users").select("*").ilike("email",email).maybeSingle();
    if (agentResponse.error) throw new Error(agentResponse.error.message || "Unable to resolve staff profile.");
  }
  const agent = agentResponse.data;
  if (!agent || agent.active === false || agent.authorized === false || agent.portal_access === false) {
    throw new Error("This staff account is not authorized for RIA INTRA.");
  }
  const rolesList = roleNames(roles);
  const canManage = Boolean(agent.can_manage) || rolesList.some(r=>ADMIN_ROLE_NAMES.has(r.trim().toLowerCase()));
  const service = String(firstValue(customValue(member,"serviceLine"),customValue(member,"service"),"ALL")).toUpperCase();
  const market = extractMarket(
    customValue(member,"operatingMarket"),
    customValue(member,"market"),
    agent.department,
    agent.base,
    agent.station
  ) || (canManage ? "ALL" : "ALL");
  const audience = normalizeAudience(
    firstValue(customValue(member,"docuNetAudience"),customValue(member,"department"),""),
    agent.department
  );
  const firstName = firstValue(member.contactDetails?.firstName,member.profile?.firstName,"");
  const lastName = firstValue(member.contactDetails?.lastName,member.profile?.lastName,"");
  return {
    id: member._id,
    agentUserId: agent.id,
    skandiId: agent.sk_id || "",
    name: agent.display_name || `${firstName} ${lastName}`.trim() || email || "Staff member",
    email: agent.email || email,
    roles: rolesList,
    canManage,
    service: ["ALL","DESTINATION","TRANSFERS","TOURS","PACKAGES"].includes(service) ? service : "ALL",
    market,
    audience
  };
}
function matchesApplicability(document,actor) {
  const matches=(values,value)=>Array.isArray(values) && (values.includes("ALL") || value === "ALL" || values.includes(value));
  return matches(document.services || ["ALL"],actor.service)
    && matches(document.markets || ["ALL"],actor.market)
    && matches(document.audiences || ["ALL"],actor.audience);
}
async function currentRevisionMap(client,documents) {
  const ids = documents.map(d=>d.current_revision_id).filter(Boolean);
  if (!ids.length) return new Map();
  const {data,error}=await client.from("docunet_revisions").select("*").in("id",ids);
  if (error) throw new Error(error.message || "Unable to load document revisions.");
  return new Map((data||[]).map(r=>[r.id,r]));
}
function viewerShape(document,revision,receipt) {
  return {
    id: document.id,
    code: document.document_code,
    title: document.title,
    short: document.short_title || document.title,
    group: document.group_name || document.category_text || "Company Manuals",
    owner: document.owner,
    revision: revision.revision,
    revisionDate: revision.effective_date || "",
    status: "Active",
    updated: Boolean(revision.published_at && new Date(revision.published_at) > new Date(Date.now()-30*86400000)),
    services: document.services || ["ALL"],
    markets: document.markets || ["ALL"],
    audiences: document.audiences || ["ALL"],
    pages: document.page_count || 1,
    summary: document.summary || "",
    searchText: revision.search_text || "",
    requiresAcknowledgement: Boolean(document.requires_acknowledgement),
    isCritical: Boolean(document.is_critical),
    acknowledgedAt: receipt?.acknowledged_at || null,
    viewedAt: receipt?.last_viewed_at || null
  };
}

function normalizedAccess(input={}) {
  const publicTemplateAccess = input.publicTemplateAccess === "OPEN" ? "OPEN" : "HIDDEN";
  const customerInstanceAccess = input.customerInstanceAccess === "SECURE_MEMBER_OR_ACCESS_CODE"
    ? "SECURE_MEMBER_OR_ACCESS_CODE" : "NONE";
  const sensitivity = new Set([
    "STANDARD","IDENTITY_PII","HEALTH","MINOR","FINANCIAL","OPERATIONAL_SAFETY","COMMERCIAL_CONTRACT"
  ]);
  return {
    publicTemplateAccess,
    customerInstanceAccess,
    allowBlankFill: Boolean(input.allowBlankFill || publicTemplateAccess === "OPEN"),
    allowBlankDownload: Boolean(input.allowBlankDownload),
    allowSelfStart: Boolean(input.allowSelfStart),
    reservationsAvailable: Boolean(input.reservationsAvailable),
    departureControlAvailable: Boolean(input.departureControlAvailable),
    docunetAvailable: input.docunetAvailable !== false,
    docunetAdminAvailable: input.docunetAdminAvailable !== false,
    sensitivityClass: sensitivity.has(String(input.sensitivityClass || "").toUpperCase())
      ? String(input.sensitivityClass).toUpperCase() : "STANDARD",
    officialSourceUrl: clean(input.officialSourceUrl, 1500)
  };
}

function definitionCategory(meta={}) {
  return clean(meta.category || "OPS", 80).toUpperCase().replace(/[^A-Z0-9_]+/g,"_") || "OPS";
}

function definitionType(meta={}) {
  return clean(meta.documentType || "DOCUMENT", 60).toUpperCase().replace(/[^A-Z0-9_]+/g,"_") || "DOCUMENT";
}

async function syncDefinition(client, meta={}) {
  const code = clean(meta.documentCode, 40).toUpperCase();
  if (!code) return;
  const access = normalizedAccess(meta.accessPolicy || {});
  const existing = await client.from("document_definitions")
    .select("id,code")
    .eq("code", code)
    .maybeSingle();
  if (existing.error) throw new Error(existing.error.message || "Unable to resolve document definition.");

  const policy = {
    name: clean(meta.title || code, 240),
    public_template_access: access.publicTemplateAccess,
    customer_instance_access: access.customerInstanceAccess,
    allow_blank_fill: access.allowBlankFill,
    allow_blank_download: access.allowBlankDownload,
    allow_self_start: access.allowSelfStart,
    reservations_available: access.reservationsAvailable,
    departure_control_available: access.departureControlAvailable,
    docunet_available: access.docunetAvailable,
    docunet_admin_available: access.docunetAdminAvailable,
    sensitivity_class: access.sensitivityClass,
    official_source_url: access.officialSourceUrl || null,
    active: true,
    updated_at: new Date().toISOString()
  };

  if (existing.data?.id) {
    const update = await client.from("document_definitions").update(policy).eq("id", existing.data.id);
    if (update.error) throw new Error(update.error.message || "Unable to synchronize document access policy.");
    return;
  }

  const insert = await client.from("document_definitions").insert({
    code,
    ...policy,
    category: definitionCategory(meta),
    document_type: definitionType(meta),
    generation_mode: "AUTO_PREFILL_STAFF",
    owner: clean(meta.owner || "SKANDI Travels", 120),
    render_profile: "pdf",
    template_version: clean(meta.revision || "1.0", 40),
    field_schema: {},
    settings: { source: "DOCUNET_CONTROLLED_PDF" },
    retention_years: 7
  });
  if (insert.error) throw new Error(insert.error.message || "Unable to create document definition.");
}

async function definitionMap(client, codes=[]) {
  const list = [...new Set(codes.map(v => clean(v,40).toUpperCase()).filter(Boolean))];
  if (!list.length) return new Map();
  const { data, error } = await client.from("document_definitions")
    .select("code,public_template_access,customer_instance_access,allow_blank_fill,allow_blank_download,allow_self_start,reservations_available,departure_control_available,docunet_available,docunet_admin_available,sensitivity_class,official_source_url")
    .in("code", list);
  if (error) throw new Error(error.message || "Unable to load DocuNet access policies.");
  return new Map((data || []).map(row => [row.code, row]));
}

function accessFromDefinition(row) {
  if (!row) return {
    publicTemplateAccess:"HIDDEN", customerInstanceAccess:"NONE",
    allowBlankFill:false, allowBlankDownload:false, allowSelfStart:false,
    reservationsAvailable:false, departureControlAvailable:false,
    docunetAvailable:true, docunetAdminAvailable:true,
    sensitivityClass:"STANDARD", officialSourceUrl:""
  };
  return {
    publicTemplateAccess: row.public_template_access || "HIDDEN",
    customerInstanceAccess: row.customer_instance_access || "NONE",
    allowBlankFill: Boolean(row.allow_blank_fill),
    allowBlankDownload: Boolean(row.allow_blank_download),
    allowSelfStart: Boolean(row.allow_self_start),
    reservationsAvailable: Boolean(row.reservations_available),
    departureControlAvailable: Boolean(row.departure_control_available),
    docunetAvailable: row.docunet_available !== false,
    docunetAdminAvailable: row.docunet_admin_available !== false,
    sensitivityClass: row.sensitivity_class || "STANDARD",
    officialSourceUrl: row.official_source_url || ""
  };
}

export const getDocuNetAdminBootstrapSynced = webMethod(Permissions.SiteMember, async () => {
  return getDocuNetAdminBootstrap();
});

export const searchDocuNetAdminDocumentsSynced = webMethod(Permissions.SiteMember, async (filters={}) => {
  const result = await searchDocuNetAdminDocuments(filters);
  const client = await db();
  const map = await definitionMap(client, (result.documents || []).map(d => d.documentCode));
  return {
    ...result,
    documents: (result.documents || []).map(d => ({
      ...d,
      accessPolicy: accessFromDefinition(map.get(String(d.documentCode || "").toUpperCase()))
    }))
  };
});

export const createDocuNetUploadSynced = webMethod(Permissions.SiteMember, async (args={}) => {
  const result = await createDocuNetUpload(args);
  const client = await db();
  const { data: session, error } = await client.from("docunet_upload_sessions")
    .select("metadata")
    .eq("request_id", result.requestId)
    .single();
  if (error) throw new Error(error.message || "Unable to synchronize upload metadata.");

  const original = args.metadata || {};
  const metadata = {
    ...(session?.metadata || {}),
    markets: original.markets !== undefined ? normalizedCodes(original.markets) : (session?.metadata?.markets || ["ALL"]),
    accessPolicy: normalizedAccess(original.accessPolicy || {})
  };
  const update = await client.from("docunet_upload_sessions")
    .update({ metadata })
    .eq("request_id", result.requestId);
  if (update.error) throw new Error(update.error.message || "Unable to preserve DocuNet upload metadata.");
  return result;
});

export const finalizeDocuNetUploadSynced = webMethod(Permissions.SiteMember, async ({requestId}={}) => {
  const client = await db();
  const session = await client.from("docunet_upload_sessions")
    .select("metadata")
    .eq("request_id", clean(requestId,100))
    .maybeSingle();
  if (session.error) throw new Error(session.error.message || "Unable to read DocuNet upload session.");

  const result = await finalizeDocuNetUpload({ requestId });
  if (session.data?.metadata) await syncDefinition(client, session.data.metadata);
  return result;
});

export const saveDocuNetMetadataSynced = webMethod(Permissions.SiteMember, async (metadata={}) => {
  const result = await saveDocuNetMetadata(metadata);
  const client = await db();
  if (result?.documentId && metadata.markets !== undefined) {
    const update = await client.from("docunet_documents")
      .update({ markets: normalizedCodes(metadata.markets) })
      .eq("id", result.documentId);
    if (update.error) throw new Error(update.error.message || "Unable to synchronize document markets.");
  }
  await syncDefinition(client, metadata);
  return result;
});

export const getDocuNetViewerBootstrapSynced = webMethod(Permissions.SiteMember, async () => {
  const actor = await currentActor();
  const client = await db();
  const {data:documents,error} = await client.from("docunet_documents")
    .select("*")
    .eq("publish_status","PUBLISHED")
    .is("deleted_at",null)
    .not("current_revision_id","is",null)
    .order("group_name",{ascending:true})
    .order("title",{ascending:true});
  if (error) throw new Error(error.message || "Unable to load DocuNet library.");

  const map = await definitionMap(client,(documents||[]).map(d=>d.document_code));
  const applicable = (documents||[]).filter(d=>{
    const access = accessFromDefinition(map.get(String(d.document_code||"").toUpperCase()));
    return access.docunetAvailable !== false && matchesApplicability(d,actor);
  });
  const revisions = await currentRevisionMap(client,applicable);
  const revisionIds=[...revisions.keys()];
  let receipts=[];
  if (revisionIds.length) {
    const response = await client.from("docunet_receipts")
      .select("*").eq("staff_id",actor.id).in("revision_id",revisionIds);
    if (response.error) throw new Error(response.error.message || "Unable to load DocuNet reading status.");
    receipts=response.data||[];
  }
  const receiptMap=new Map(receipts.map(r=>[r.revision_id,r]));
  return {
    session: actor,
    documents: applicable.map(d=>{
      const revision=revisions.get(d.current_revision_id);
      return revision ? {...viewerShape(d,revision,receiptMap.get(revision.id)),
        accessPolicy:accessFromDefinition(map.get(String(d.document_code||"").toUpperCase()))
      } : null;
    }).filter(Boolean),
    syncedAt:new Date().toISOString()
  };
});

export const getDocuNetDocumentAccessSynced = webMethod(Permissions.SiteMember, async ({documentId}={}) => {
  const actor=await currentActor();
  const client=await db();
  const id=clean(documentId,80);
  const doc=await client.from("docunet_documents").select("*")
    .eq("id",id).eq("publish_status","PUBLISHED").is("deleted_at",null).single();
  if (doc.error || !doc.data) throw new Error(doc.error?.message || "Document is not available.");
  if (!matchesApplicability(doc.data,actor)) throw new Error("This document is not assigned to your DocuNet.");
  const definitions=await definitionMap(client,[doc.data.document_code]);
  if (accessFromDefinition(definitions.get(String(doc.data.document_code||"").toUpperCase())).docunetAvailable === false) {
    throw new Error("This document is hidden from DocuNet.");
  }
  const revision=await client.from("docunet_revisions").select("*")
    .eq("id",doc.data.current_revision_id).eq("revision_status","PUBLISHED").single();
  if (revision.error || !revision.data) throw new Error(revision.error?.message || "Published revision is not available.");
  const signed=await client.storage.from(revision.data.storage_bucket).createSignedUrl(revision.data.storage_path,600);
  if (signed.error || !signed.data?.signedUrl) throw new Error(signed.error?.message || "Unable to open the controlled PDF.");
  const receipt=await client.rpc("docunet_record_receipt",{
    p_document_id:doc.data.id,p_revision_id:revision.data.id,p_staff_id:actor.id,
    p_staff_name:actor.name,p_staff_email:actor.email,p_acknowledge:false
  });
  if (receipt.error) throw new Error(receipt.error.message || "Unable to record document view.");
  return {documentId:doc.data.id,revisionId:revision.data.id,revision:revision.data.revision,signedUrl:signed.data.signedUrl,expiresIn:600};
});

export const acknowledgeDocuNetDocumentSynced = webMethod(Permissions.SiteMember, async ({documentId}={}) => {
  const actor=await currentActor();
  const client=await db();
  const id=clean(documentId,80);
  const doc=await client.from("docunet_documents").select("*")
    .eq("id",id).eq("publish_status","PUBLISHED").is("deleted_at",null).single();
  if (doc.error || !doc.data) throw new Error(doc.error?.message || "Document is not available.");
  if (!matchesApplicability(doc.data,actor)) throw new Error("This document is not assigned to your DocuNet.");
  const revision=await client.from("docunet_revisions").select("id,revision")
    .eq("id",doc.data.current_revision_id).eq("revision_status","PUBLISHED").single();
  if (revision.error || !revision.data) throw new Error(revision.error?.message || "Published revision is not available.");
  const receipt=await client.rpc("docunet_record_receipt",{
    p_document_id:doc.data.id,p_revision_id:revision.data.id,p_staff_id:actor.id,
    p_staff_name:actor.name,p_staff_email:actor.email,p_acknowledge:true
  });
  if (receipt.error) throw new Error(receipt.error.message || "Unable to acknowledge document.");
  await client.from("docunet_audit_events").insert({
    event_type:"DOCUMENT_ACKNOWLEDGED",document_id:doc.data.id,revision_id:revision.data.id,
    actor_id:actor.id,actor_name:actor.name,actor_email:actor.email,
    payload:{revision:revision.data.revision,agentUserId:actor.agentUserId,skandiId:actor.skandiId}
  });
  return {documentId:doc.data.id,revisionId:revision.data.id,acknowledgedAt:receipt.data?.acknowledgedAt || new Date().toISOString()};
});

export const getDocuNetAdminPreview = webMethod(Permissions.SiteMember, async ({documentId}={}) => {
  // Re-use admin bootstrap as the authorization gate.
  await getDocuNetAdminBootstrap();
  const client = await db();
  const id = clean(documentId,80);
  const doc = await client.from("docunet_documents")
    .select("id,title,current_revision_id")
    .eq("id", id)
    .is("deleted_at", null)
    .single();
  if (doc.error || !doc.data) throw new Error(doc.error?.message || "Document was not found.");

  let revision = null;
  if (doc.data.current_revision_id) {
    const current = await client.from("docunet_revisions")
      .select("*")
      .eq("id", doc.data.current_revision_id)
      .maybeSingle();
    if (current.error) throw new Error(current.error.message || "Unable to load current revision.");
    revision = current.data;
  }
  if (!revision) {
    const latest = await client.from("docunet_revisions")
      .select("*")
      .eq("document_id", id)
      .order("created_at", { ascending:false })
      .limit(1)
      .maybeSingle();
    if (latest.error) throw new Error(latest.error.message || "Unable to load latest revision.");
    revision = latest.data;
  }
  if (!revision) throw new Error("No PDF revision is available for preview.");

  const signed = await client.storage.from(revision.storage_bucket)
    .createSignedUrl(revision.storage_path, 10*60);
  if (signed.error || !signed.data?.signedUrl) throw new Error(signed.error?.message || "Unable to create preview URL.");
  return {
    documentId: id,
    title: doc.data.title,
    revision: revision.revision,
    signedUrl: signed.data.signedUrl,
    expiresIn: 600
  };
});
