import { webMethod, Permissions } from "wix-web-module";
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
    generation_mode: "CONTROLLED_PDF",
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
  const result = await getDocuNetViewerBootstrap();
  const client = await db();
  const map = await definitionMap(client, (result.documents || []).map(d => d.code));
  const documents = (result.documents || [])
    .map(d => {
      const def = map.get(String(d.code || "").toUpperCase());
      return { ...d, accessPolicy: accessFromDefinition(def) };
    })
    .filter(d => d.accessPolicy.docunetAvailable !== false);
  return { ...result, documents };
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
