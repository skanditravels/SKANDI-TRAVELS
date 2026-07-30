import { webMethod, Permissions } from "wix-web-module";
import { currentMember } from "wix-members-backend";
import { getSecret } from "wix-secrets-backend";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "docunet-controlled";
const MAX_PDF_BYTES = 150 * 1024 * 1024;
const SIGNED_READ_SECONDS = 10 * 60;
const ADMIN_ROLE_NAMES = new Set([
  "admin",
  "administrator",
  "site owner",
  "super admin",
  "system admin",
  "docunet admin",
  "document control",
  "hr admin"
]);

const SERVICE_CODES = new Set(["ALL", "DESTINATION", "TRANSFERS", "TOURS", "PACKAGES"]);
const MARKET_CODES = new Set(["ALL", "USNYC", "SESTO", "GRHER"]);
const AUDIENCE_CODES = new Set(["ALL", "OPERATIONS", "DESTINATION_STAFF", "CUSTOMER_CARE", "PARTNER_MANAGEMENT"]);

let supabasePromise;

async function supabase() {
  if (!supabasePromise) {
    supabasePromise = Promise.all([
      getSecret("SUPABASE_URL"),
      getSecret("SUPABASE_SERVICE_ROLE_KEY")
    ]).then(([url, serviceRoleKey]) => {
      if (!url || !serviceRoleKey) {
        throw new Error("Supabase backend secrets are not configured.");
      }
      return createClient(url, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
        global: { headers: { "X-Client-Info": "skandi-wix-docunet/1.0" } }
      });
    });
  }
  return supabasePromise;
}

function firstValue(...values) {
  return values.find(value => value !== undefined && value !== null && String(value).trim() !== "");
}

function customValue(member, key) {
  const fields = member?.customFields || member?.profile?.customFields || {};
  const value = fields[key];
  return typeof value === "object" && value !== null ? firstValue(value.value, value.text, value.name) : value;
}

function roleNames(roles = []) {
  return roles
    .map(role => String(firstValue(role.name, role.title, role.roleName, role._id, "")))
    .filter(Boolean);
}

async function getActor() {
  const [member, roles] = await Promise.all([
    currentMember.getMember(),
    currentMember.getRoles()
  ]);
  if (!member?._id) {
    throw new Error("A signed-in staff account is required.");
  }

  const email = firstValue(
    member.loginEmail,
    member.contactDetails?.emails?.[0],
    member.profile?.loginEmail,
    ""
  );
  const firstName = firstValue(member.contactDetails?.firstName, member.profile?.firstName, "");
  const lastName = firstValue(member.contactDetails?.lastName, member.profile?.lastName, "");
  const name = `${firstName} ${lastName}`.trim() || firstValue(member.profile?.nickname, email, "Staff member");

  return {
    id: member._id,
    name,
    email,
    roles: roleNames(roles),
    service: String(firstValue(customValue(member, "serviceLine"), customValue(member, "service"), "ALL")).toUpperCase(),
    market: String(firstValue(customValue(member, "operatingMarket"), customValue(member, "market"), "ALL")).toUpperCase(),
    audience: String(firstValue(customValue(member, "docuNetAudience"), customValue(member, "department"), "ALL")).toUpperCase(),
    skandiId: String(firstValue(customValue(member, "skandiId"), customValue(member, "SKANDI ID"), ""))
  };
}

function isAdmin(actor) {
  return actor.roles.some(role => ADMIN_ROLE_NAMES.has(role.trim().toLowerCase()));
}

async function requireAdmin() {
  const actor = await getActor();
  if (!isAdmin(actor)) {
    throw new Error("Document Control administrator access is required.");
  }
  return actor;
}

function cleanText(value, max = 500) {
  return String(value ?? "").trim().slice(0, max);
}

function cleanCode(value) {
  const code = cleanText(value, 40).toUpperCase().replace(/[^A-Z0-9._-]/g, "");
  if (!code) throw new Error("Document code is required.");
  return code;
}

function cleanRevision(value) {
  const revision = cleanText(value, 40).replace(/[^A-Za-z0-9._-]/g, "");
  if (!revision) throw new Error("Revision is required.");
  return revision;
}

function cleanArray(value, allowed, fallback = "ALL") {
  const source = Array.isArray(value) ? value : String(value || "").split(",");
  const result = [...new Set(source.map(item => String(item).trim().toUpperCase()).filter(item => allowed.has(item)))];
  if (!result.length || result.includes("ALL")) return [fallback];
  return result;
}

function cleanTags(value) {
  const source = Array.isArray(value) ? value : String(value || "").split(",");
  return [...new Set(source.map(tag => cleanText(tag, 60)).filter(Boolean))].slice(0, 30);
}

function sanitizeMetadata(input = {}) {
  const title = cleanText(input.title, 240);
  if (!title) throw new Error("Document title is required.");
  return {
    documentId: cleanText(input.documentId, 80),
    title,
    shortTitle: cleanText(input.shortTitle, 100),
    documentCode: cleanCode(input.documentCode),
    owner: cleanText(input.owner, 120) || "SKANDI Travels",
    revision: cleanRevision(input.revision),
    documentType: cleanText(input.documentType, 40) || "Manual",
    category: cleanText(input.category, 120),
    group: cleanText(input.group, 120) || cleanText(input.category, 120),
    services: cleanArray(input.services, SERVICE_CODES),
    markets: cleanArray(input.markets, MARKET_CODES),
    audiences: cleanArray(input.audiences || input.audience, AUDIENCE_CODES),
    effectiveDate: cleanText(input.effectiveDate, 10),
    publishStatus: ["DRAFT", "PUBLISHED", "ARCHIVED"].includes(String(input.publishStatus).toUpperCase())
      ? String(input.publishStatus).toUpperCase()
      : "DRAFT",
    pageCount: Math.max(1, Math.min(100000, Number(input.pageCount || input.pages || 1))),
    tags: cleanTags(input.tags),
    requiresAcknowledgement: Boolean(input.requiresAcknowledgement),
    isCritical: Boolean(input.isCritical),
    summary: cleanText(input.summary, 4000),
    searchText: cleanText(input.searchText, 50000)
  };
}

function safeFileName(name) {
  const base = cleanText(name, 180).replace(/[^A-Za-z0-9._-]/g, "-").replace(/-+/g, "-");
  return base.toLowerCase().endsWith(".pdf") ? base : `${base || "document"}.pdf`;
}

function throwIf(error, fallback) {
  if (error) throw new Error(error.message || fallback);
}

async function categoryId(client, title) {
  if (!title) return null;
  const { data, error } = await client
    .from("docunet_categories")
    .select("id")
    .ilike("title", title)
    .maybeSingle();
  throwIf(error, "Unable to resolve document category.");
  return data?.id || null;
}

async function audit(client, actor, eventType, payload = {}, documentId = null, revisionId = null) {
  const { error } = await client.from("docunet_audit_events").insert({
    event_type: eventType,
    document_id: documentId,
    revision_id: revisionId,
    actor_id: actor.id,
    actor_name: actor.name,
    actor_email: actor.email,
    payload
  });
  throwIf(error, "Unable to write DocuNet audit event.");
}

async function currentRevisions(client, documents) {
  const ids = documents.map(document => document.current_revision_id).filter(Boolean);
  if (!ids.length) return new Map();
  const { data, error } = await client
    .from("docunet_revisions")
    .select("*")
    .in("id", ids);
  throwIf(error, "Unable to load document revisions.");
  return new Map((data || []).map(revision => [revision.id, revision]));
}

function adminDocument(document, revision) {
  return {
    _id: document.id,
    id: document.id,
    title: document.title,
    shortTitle: document.short_title,
    documentCode: document.document_code,
    code: document.document_code,
    owner: document.owner,
    documentType: document.document_type,
    category: document.category_text,
    group: document.group_name,
    summary: document.summary,
    tags: document.tags,
    services: document.services,
    markets: document.markets,
    audiences: document.audiences,
    audience: (document.audiences || []).join(","),
    publishStatus: document.publish_status,
    requiresAcknowledgement: document.requires_acknowledgement,
    isCritical: document.is_critical,
    pageCount: document.page_count,
    pages: document.page_count,
    revision: revision?.revision || "",
    effectiveDate: revision?.effective_date || "",
    latestFileName: revision?.file_name || "",
    latestStoragePath: revision?.storage_path || "",
    createdAt: document.created_at,
    updatedAt: document.updated_at
  };
}

function adminCategory(category) {
  return {
    _id: category.id,
    id: category.id,
    title: category.title,
    name: category.title,
    description: category.description,
    sortOrder: category.sort_order,
    active: category.active
  };
}

function viewerDocument(document, revision, receipt) {
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
    updated: Boolean(revision.published_at && new Date(revision.published_at) > new Date(Date.now() - 30 * 86400000)),
    services: document.services,
    markets: document.markets,
    audiences: document.audiences,
    pages: document.page_count,
    summary: document.summary,
    searchText: revision.search_text,
    requiresAcknowledgement: document.requires_acknowledgement,
    isCritical: document.is_critical,
    acknowledgedAt: receipt?.acknowledged_at || null,
    viewedAt: receipt?.last_viewed_at || null
  };
}

function matchesApplicability(document, actor) {
  const matches = (values, value) => values.includes("ALL") || value === "ALL" || values.includes(value);
  return matches(document.services || ["ALL"], actor.service)
    && matches(document.markets || ["ALL"], actor.market)
    && matches(document.audiences || ["ALL"], actor.audience);
}

export const getDocuNetAdminBootstrap = webMethod(Permissions.SiteMember, async () => {
  const actor = await requireAdmin();
  const client = await supabase();
  const { data: categories, error } = await client
    .from("docunet_categories")
    .select("*")
    .order("sort_order", { ascending: true });
  throwIf(error, "Unable to load DocuNet categories.");
  return { session: actor, categories: (categories || []).map(adminCategory) };
});

export const searchDocuNetAdminDocuments = webMethod(Permissions.SiteMember, async (filters = {}) => {
  await requireAdmin();
  const client = await supabase();
  let query = client
    .from("docunet_documents")
    .select("*")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(500);

  if (filters.publishStatus) query = query.eq("publish_status", cleanText(filters.publishStatus, 20));
  if (filters.documentType) query = query.eq("document_type", cleanText(filters.documentType, 40));
  if (filters.category) query = query.eq("category_text", cleanText(filters.category, 120));
  if (filters.service) query = query.contains("services", [cleanText(filters.service, 30)]);
  if (filters.market) query = query.contains("markets", [cleanText(filters.market, 30)]);
  if (filters.audience) query = query.contains("audiences", [cleanText(filters.audience, 40)]);

  const { data, error } = await query;
  throwIf(error, "Unable to search DocuNet documents.");
  let documents = data || [];
  const search = cleanText(filters.query, 120).toLowerCase();
  if (search) {
    documents = documents.filter(document =>
      [
        document.title,
        document.short_title,
        document.document_code,
        document.category_text,
        document.summary,
        ...(document.tags || [])
      ].join(" ").toLowerCase().includes(search)
    );
  }
  const revisions = await currentRevisions(client, documents);
  return { documents: documents.map(document => adminDocument(document, revisions.get(document.current_revision_id))) };
});

export const createDocuNetUpload = webMethod(Permissions.SiteMember, async ({ requestId, metadata, file } = {}) => {
  const actor = await requireAdmin();
  const client = await supabase();
  const clean = sanitizeMetadata(metadata);
  const request = cleanText(requestId, 100);
  if (!request) throw new Error("Upload request ID is required.");
  if (!file || file.type !== "application/pdf" || !Number(file.size) || Number(file.size) > MAX_PDF_BYTES) {
    throw new Error("A valid PDF within the 150 MB limit is required.");
  }

  const path = `${clean.documentCode.toLowerCase()}/${clean.revision}/${request}-${safeFileName(file.name)}`;
  const storedMetadata = {
    ...clean,
    file: {
      name: safeFileName(file.name),
      size: Number(file.size),
      type: "application/pdf",
      lastModified: Number(file.lastModified || 0)
    }
  };

  const { error: sessionError } = await client.from("docunet_upload_sessions").insert({
    request_id: request,
    actor_id: actor.id,
    storage_bucket: BUCKET,
    storage_path: path,
    metadata: storedMetadata,
    expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
  });
  throwIf(sessionError, "Unable to create upload session.");

  const { data, error } = await client.storage.from(BUCKET).createSignedUploadUrl(path, { upsert: false });
  if (error || !data?.signedUrl) {
    await client.from("docunet_upload_sessions").delete().eq("request_id", request);
    throw new Error(error?.message || "Unable to create signed PDF upload URL.");
  }

  return {
    requestId: request,
    uploadUrl: data.signedUrl,
    method: "PUT",
    headers: { "x-upsert": "false" },
    bucket: BUCKET,
    path
  };
});

export const finalizeDocuNetUpload = webMethod(Permissions.SiteMember, async ({ requestId } = {}) => {
  const actor = await requireAdmin();
  const client = await supabase();
  const request = cleanText(requestId, 100);

  const { data: session, error: sessionError } = await client
    .from("docunet_upload_sessions")
    .select("*")
    .eq("request_id", request)
    .eq("actor_id", actor.id)
    .maybeSingle();
  throwIf(sessionError, "Unable to verify upload session.");
  if (!session) throw new Error("Upload session was not found.");

  const lastSlash = session.storage_path.lastIndexOf("/");
  const folder = session.storage_path.slice(0, lastSlash);
  const fileName = session.storage_path.slice(lastSlash + 1);
  const { data: objects, error: listError } = await client.storage
    .from(session.storage_bucket)
    .list(folder, { search: fileName, limit: 10 });
  throwIf(listError, "Unable to verify uploaded PDF.");
  if (!(objects || []).some(object => object.name === fileName)) {
    throw new Error("The PDF upload could not be verified in Supabase Storage.");
  }

  const { data, error } = await client.rpc("docunet_finalize_revision", {
    p_request_id: request,
    p_actor_id: actor.id,
    p_actor_name: actor.name,
    p_actor_email: actor.email
  });
  throwIf(error, "Unable to publish DocuNet revision.");
  return data;
});

export const saveDocuNetMetadata = webMethod(Permissions.SiteMember, async (metadata = {}) => {
  const actor = await requireAdmin();
  const client = await supabase();
  const clean = sanitizeMetadata({ ...metadata, revision: metadata.revision || "METADATA" });
  const category = await categoryId(client, clean.category);
  const payload = {
    document_code: clean.documentCode,
    title: clean.title,
    short_title: clean.shortTitle,
    owner: clean.owner,
    document_type: clean.documentType,
    category_id: category,
    category_text: clean.category,
    group_name: clean.group,
    summary: clean.summary,
    tags: clean.tags,
    services: clean.services,
    markets: clean.markets,
    audiences: clean.audiences,
    publish_status: clean.publishStatus === "PUBLISHED" ? "DRAFT" : clean.publishStatus,
    requires_acknowledgement: clean.requiresAcknowledgement,
    is_critical: clean.isCritical,
    page_count: clean.pageCount,
    updated_by: actor.id
  };

  let documentId = clean.documentId;
  let result;
  if (documentId) {
    const response = await client.from("docunet_documents").update(payload).eq("id", documentId).select("*").single();
    throwIf(response.error, "Unable to update document metadata.");
    result = response.data;
  } else {
    const response = await client.from("docunet_documents").insert({
      ...payload,
      created_by: actor.id
    }).select("*").single();
    throwIf(response.error, "Unable to create document metadata.");
    result = response.data;
    documentId = result.id;
  }
  await audit(client, actor, "DOCUMENT_METADATA_SAVED", { documentCode: clean.documentCode }, documentId);
  return { documentId, document: adminDocument(result, null) };
});

export const setDocuNetDocumentStatus = webMethod(Permissions.SiteMember, async ({ documentId, publishStatus } = {}) => {
  const actor = await requireAdmin();
  const client = await supabase();
  const status = String(publishStatus || "").toUpperCase();
  if (!["PUBLISHED", "ARCHIVED"].includes(status)) throw new Error("Invalid publication status.");
  const { data, error } = await client
    .from("docunet_documents")
    .update({
      publish_status: status,
      archived_at: status === "ARCHIVED" ? new Date().toISOString() : null,
      updated_by: actor.id
    })
    .eq("id", cleanText(documentId, 80))
    .is("deleted_at", null)
    .select("id,current_revision_id")
    .single();
  throwIf(error, "Unable to update document status.");
  if (data.current_revision_id) {
    const revisionStatus = status === "PUBLISHED" ? "PUBLISHED" : "ARCHIVED";
    const revisionUpdate = await client.from("docunet_revisions")
      .update({ revision_status: revisionStatus, published_at: status === "PUBLISHED" ? new Date().toISOString() : null })
      .eq("id", data.current_revision_id);
    throwIf(revisionUpdate.error, "Unable to update revision status.");
  }
  await audit(client, actor, `DOCUMENT_${status}`, {}, data.id, data.current_revision_id);
  return { documentId: data.id, publishStatus: status };
});

export const deleteDocuNetDocument = webMethod(Permissions.SiteMember, async ({ documentId } = {}) => {
  const actor = await requireAdmin();
  const client = await supabase();
  const id = cleanText(documentId, 80);
  const { data: revisions, error: revisionError } = await client
    .from("docunet_revisions")
    .select("storage_path")
    .eq("document_id", id);
  throwIf(revisionError, "Unable to load document revisions.");

  await audit(client, actor, "DOCUMENT_DELETED", {
    storagePaths: (revisions || []).map(revision => revision.storage_path)
  }, id);
  const { error } = await client.from("docunet_documents").delete().eq("id", id);
  throwIf(error, "Unable to delete document.");
  const paths = (revisions || []).map(revision => revision.storage_path).filter(Boolean);
  if (paths.length) {
    const remove = await client.storage.from(BUCKET).remove(paths);
    throwIf(remove.error, "Document record was deleted, but one or more PDF files could not be removed.");
  }
  return { documentId: id, deleted: true };
});

export const saveDocuNetCategory = webMethod(Permissions.SiteMember, async (category = {}) => {
  const actor = await requireAdmin();
  const client = await supabase();
  const title = cleanText(category.title, 120);
  if (!title) throw new Error("Category title is required.");
  const payload = {
    title,
    description: cleanText(category.description, 1000),
    sort_order: Number(category.sortOrder || 0),
    active: category.active !== false
  };
  let data;
  if (category.categoryId) {
    const result = await client.from("docunet_categories").update(payload).eq("id", cleanText(category.categoryId, 80)).select("*").single();
    throwIf(result.error, "Unable to update category.");
    data = result.data;
  } else {
    const result = await client.from("docunet_categories").insert(payload).select("*").single();
    throwIf(result.error, "Unable to create category.");
    data = result.data;
  }
  await audit(client, actor, "CATEGORY_SAVED", { categoryId: data.id, title });
  return data;
});

export const deleteDocuNetCategory = webMethod(Permissions.SiteMember, async ({ categoryId } = {}) => {
  const actor = await requireAdmin();
  const client = await supabase();
  const id = cleanText(categoryId, 80);
  const { error } = await client.from("docunet_categories").delete().eq("id", id);
  throwIf(error, "Unable to delete category.");
  await audit(client, actor, "CATEGORY_DELETED", { categoryId: id });
  return { categoryId: id, deleted: true };
});

export const searchDocuNetAudit = webMethod(Permissions.SiteMember, async () => {
  await requireAdmin();
  const client = await supabase();
  const { data, error } = await client.from("docunet_audit_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);
  throwIf(error, "Unable to load DocuNet audit history.");
  return {
    events: (data || []).map(event => ({
      _id: event.id,
      eventType: event.event_type,
      documentId: event.document_id,
      revisionId: event.revision_id,
      staffName: event.actor_name,
      staffEmail: event.actor_email,
      payload: event.payload,
      createdAt: event.created_at
    }))
  };
});

export const getDocuNetViewerBootstrap = webMethod(Permissions.SiteMember, async () => {
  const actor = await getActor();
  const client = await supabase();
  const { data: documents, error } = await client
    .from("docunet_documents")
    .select("*")
    .eq("publish_status", "PUBLISHED")
    .is("deleted_at", null)
    .not("current_revision_id", "is", null)
    .order("group_name", { ascending: true })
    .order("title", { ascending: true });
  throwIf(error, "Unable to load DocuNet library.");

  const applicable = (documents || []).filter(document => matchesApplicability(document, actor));
  const revisions = await currentRevisions(client, applicable);
  const revisionIds = [...revisions.keys()];
  let receipts = [];
  if (revisionIds.length) {
    const response = await client.from("docunet_receipts")
      .select("*")
      .eq("staff_id", actor.id)
      .in("revision_id", revisionIds);
    throwIf(response.error, "Unable to load DocuNet reading status.");
    receipts = response.data || [];
  }
  const receiptMap = new Map(receipts.map(receipt => [receipt.revision_id, receipt]));
  return {
    session: actor,
    documents: applicable
      .map(document => {
        const revision = revisions.get(document.current_revision_id);
        return revision ? viewerDocument(document, revision, receiptMap.get(revision.id)) : null;
      })
      .filter(Boolean),
    syncedAt: new Date().toISOString()
  };
});

export const getDocuNetDocumentAccess = webMethod(Permissions.SiteMember, async ({ documentId } = {}) => {
  const actor = await getActor();
  const client = await supabase();
  const id = cleanText(documentId, 80);
  const { data: document, error } = await client.from("docunet_documents")
    .select("*")
    .eq("id", id)
    .eq("publish_status", "PUBLISHED")
    .is("deleted_at", null)
    .single();
  throwIf(error, "Document is not available.");
  if (!matchesApplicability(document, actor)) throw new Error("This document is not assigned to your DocuNet.");

  const { data: revision, error: revisionError } = await client.from("docunet_revisions")
    .select("*")
    .eq("id", document.current_revision_id)
    .eq("revision_status", "PUBLISHED")
    .single();
  throwIf(revisionError, "Published revision is not available.");
  const { data: signed, error: signedError } = await client.storage.from(revision.storage_bucket)
    .createSignedUrl(revision.storage_path, SIGNED_READ_SECONDS);
  throwIf(signedError, "Unable to open the controlled PDF.");
  await client.rpc("docunet_record_receipt", {
    p_document_id: document.id,
    p_revision_id: revision.id,
    p_staff_id: actor.id,
    p_staff_name: actor.name,
    p_staff_email: actor.email,
    p_acknowledge: false
  });
  return {
    documentId: document.id,
    revisionId: revision.id,
    revision: revision.revision,
    signedUrl: signed.signedUrl,
    expiresIn: SIGNED_READ_SECONDS
  };
});

export const acknowledgeDocuNetDocument = webMethod(Permissions.SiteMember, async ({ documentId } = {}) => {
  const actor = await getActor();
  const client = await supabase();
  const id = cleanText(documentId, 80);
  const { data: document, error } = await client.from("docunet_documents")
    .select("id,current_revision_id,services,markets,audiences,publish_status")
    .eq("id", id)
    .eq("publish_status", "PUBLISHED")
    .is("deleted_at", null)
    .single();
  throwIf(error, "Document is not available.");
  if (!matchesApplicability(document, actor)) throw new Error("This document is not assigned to your DocuNet.");
  const { data: revision, error: revisionError } = await client.from("docunet_revisions")
    .select("id,revision")
    .eq("id", document.current_revision_id)
    .single();
  throwIf(revisionError, "Published revision is not available.");
  const { data, error: receiptError } = await client.rpc("docunet_record_receipt", {
    p_document_id: document.id,
    p_revision_id: revision.id,
    p_staff_id: actor.id,
    p_staff_name: actor.name,
    p_staff_email: actor.email,
    p_acknowledge: true
  });
  throwIf(receiptError, "Unable to acknowledge document.");
  await audit(client, actor, "DOCUMENT_ACKNOWLEDGED", { revision: revision.revision }, document.id, revision.id);
  return { documentId: document.id, revisionId: revision.id, acknowledgedAt: data?.acknowledgedAt || new Date().toISOString() };
});
