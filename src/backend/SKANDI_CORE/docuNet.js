// /src/backend/SKANDI_CORE/docuNet.js
// V12 canonical DocuNet viewer/publisher implementation.

import {
  restRequest,
  storageCreateSignedUploadUrl,
  storageCreateSignedReadUrl,
  storageGetObjectInfo,
  storageListObjects,
  storageCopyObject,
  storageRemoveObjects
} from "backend/SKANDI_CORE/supabaseServer";
import { requireStaffPortalSessionCore } from "backend/SKANDI_CORE/staffAuth";
import { getAdobePdfPropertiesFromUrl } from "backend/SKANDI_CORE/adobePdf";

const BUCKET = "docunet-controlled";
const clean = (v, n = 500) => String(v ?? "").trim().slice(0, n);
const arr = v => Array.isArray(v) ? v : [];
const first = v => Array.isArray(v) && v.length ? v[0] : null;
const lower = v => clean(v, 300).toLowerCase();
const codes = (v, fallback = "ALL") => {
  const out = [...new Set(
    (Array.isArray(v) ? v : String(v || "").split(","))
      .map(x => clean(x, 24).toUpperCase())
      .filter(x => x === "ALL" || /^[A-Z0-9_-]{2,24}$/.test(x))
  )];
  return !out.length || out.includes("ALL") ? [fallback] : out;
};

function perms(s = {}) {
  const p = s.profile || {};
  return new Set([
    ...arr(s.permissionKeys),
    ...arr(s.permissions),
    ...arr(s.allowedApps),
    ...arr(s.permissionGroups),
    ...arr(s.apps),
    ...arr(p.permissionKeys),
    ...arr(p.allowedApps),
    ...arr(p.permissionGroups)
  ].map(x => lower(typeof x === "string" ? x : (x?.id || x?.key || x?.permission))).filter(Boolean));
}

async function access(admin = false) {
  const s = await requireStaffPortalSessionCore();
  if (!admin) return s;
  const k = perms(s);
  if (!(
    s.isSystemAdmin === true ||
    s.canManage === true ||
    k.has("*") ||
    k.has("all") ||
    k.has("docunet") ||
    k.has("docunet-admin") ||
    k.has("document-control") ||
    k.has("documents.manage")
  )) throw new Error("DOCUNET_ADMIN_ACCESS_REQUIRED");
  return s;
}

function actor(s = {}) {
  const p = s.profile || {};
  const a = s.staff || {};
  return {
    id: clean(s.agentId || a.id || p.id, 100),
    skId: clean(s.skId || a.skId || p.skId || p.sk_id, 40).toUpperCase(),
    name: clean(s.displayName || a.displayName || a.name || p.displayName || p.name || "Staff", 180),
    email: clean(s.email || a.email || p.email, 254),
    service: clean(s.service || a.service || p.service || "ALL", 30).toUpperCase(),
    market: clean(s.market || a.market || p.market || "ALL", 30).toUpperCase(),
    audience: clean(s.audience || a.audience || p.audience || "ALL", 40).toUpperCase()
  };
}

function applies(doc, a) {
  const match = (xs, v) => arr(xs).includes("ALL") || v === "ALL" || arr(xs).includes(v);
  return match(doc.services || ["ALL"], a.service) &&
    match(doc.markets || ["ALL"], a.market) &&
    match(doc.audiences || ["ALL"], a.audience);
}

function matchesFilter(values, filter) {
  const target = clean(filter, 40).toUpperCase();
  if (!target) return true;
  const normalized = arr(values).map(x => clean(x, 40).toUpperCase());
  return normalized.includes("ALL") || normalized.includes(target);
}

async function defs(codesList = []) {
  const list = [...new Set(codesList.map(x => clean(x, 40).toUpperCase()).filter(Boolean))];
  if (!list.length) return new Map();
  const rows = await restRequest({
    table: "document_definitions",
    query: {
      select: "code,public_template_access,customer_instance_access,allow_blank_fill,allow_blank_download,allow_self_start,reservations_available,departure_control_available,docunet_available,docunet_admin_available,sensitivity_class,official_source_url",
      code: `in.(${list.join(",")})`,
      limit: 1000
    }
  });
  return new Map(rows.map(r => [r.code, r]));
}

function accessPolicy(r) {
  return {
    publicTemplateAccess: r?.public_template_access || "HIDDEN",
    customerInstanceAccess: r?.customer_instance_access || "NONE",
    allowBlankFill: r?.allow_blank_fill === true,
    allowBlankDownload: r?.allow_blank_download === true,
    allowSelfStart: r?.allow_self_start === true,
    reservationsAvailable: r?.reservations_available === true,
    departureControlAvailable: r?.departure_control_available === true,
    docunetAvailable: r?.docunet_available !== false,
    docunetAdminAvailable: r?.docunet_admin_available !== false,
    sensitivityClass: r?.sensitivity_class || "STANDARD",
    officialSourceUrl: r?.official_source_url || ""
  };
}

function adminDoc(d, r) {
  return {
    _id: d.id,
    id: d.id,
    title: d.title,
    shortTitle: d.short_title,
    documentCode: d.document_code,
    code: d.document_code,
    owner: d.owner,
    documentType: d.document_type,
    category: d.category_text,
    group: d.group_name,
    summary: d.summary,
    tags: d.tags || [],
    services: d.services || ["ALL"],
    markets: d.markets || ["ALL"],
    audiences: d.audiences || ["ALL"],
    audience: (d.audiences || []).join(","),
    publishStatus: d.publish_status,
    requiresAcknowledgement: d.requires_acknowledgement,
    isCritical: d.is_critical,
    pageCount: d.page_count,
    pages: d.page_count,
    revision: r?.revision || "",
    effectiveDate: r?.effective_date || "",
    latestFileName: r?.file_name || "",
    latestStoragePath: r?.storage_path || "",
    createdAt: d.created_at,
    updatedAt: d.updated_at
  };
}

async function revisionMap(docs) {
  const ids = docs.map(d => d.current_revision_id).filter(Boolean);
  if (!ids.length) return new Map();
  const rows = await restRequest({
    table: "docunet_revisions",
    query: { select: "*", id: `in.(${ids.join(",")})`, limit: 1000 }
  });
  return new Map(rows.map(r => [r.id, r]));
}

async function audit(a, event, payload = {}, documentId = null, revisionId = null) {
  await restRequest({
    table: "docunet_audit_events",
    method: "POST",
    body: {
      event_type: event,
      document_id: documentId,
      revision_id: revisionId,
      actor_id: a.id || a.skId || null,
      actor_name: a.name,
      actor_email: a.email || null,
      payload
    }
  });
}

export async function getDocuNetAdminBootstrapCore() {
  const s = await access(true);
  const cats = await restRequest({
    table: "docunet_categories",
    query: { select: "*", order: "sort_order.asc", limit: 500 }
  });
  return {
    session: actor(s),
    categories: cats.map(c => ({
      _id: c.id,
      id: c.id,
      title: c.title,
      name: c.title,
      description: c.description,
      sortOrder: c.sort_order,
      active: c.active
    }))
  };
}

export async function searchDocuNetAdminDocumentsCore(filters = {}) {
  await access(true);
  let rows = await restRequest({
    table: "docunet_documents",
    query: { select: "*", deleted_at: "is.null", order: "updated_at.desc", limit: 500 }
  });
  const q = lower(filters.query);
  if (filters.publishStatus) rows = rows.filter(x => x.publish_status === filters.publishStatus);
  if (filters.documentType) rows = rows.filter(x => x.document_type === filters.documentType);
  if (filters.category) rows = rows.filter(x => x.category_text === filters.category);
  if (filters.service) rows = rows.filter(x => matchesFilter(x.services, filters.service));
  if (filters.market) rows = rows.filter(x => matchesFilter(x.markets, filters.market));
  if (filters.audience) rows = rows.filter(x => matchesFilter(x.audiences, filters.audience));
  if (q) {
    rows = rows.filter(x => [
      x.title,
      x.short_title,
      x.document_code,
      x.category_text,
      x.summary,
      ...arr(x.tags)
    ].join(" ").toLowerCase().includes(q));
  }
  const rm = await revisionMap(rows);
  const dm = await defs(rows.map(x => x.document_code));
  return {
    documents: rows
      .map(d => ({
        ...adminDoc(d, rm.get(d.current_revision_id)),
        accessPolicy: accessPolicy(dm.get(d.document_code))
      }))
      .filter(d => d.accessPolicy.docunetAdminAvailable !== false)
  };
}

function safeFile(name) {
  const n = clean(name, 180).replace(/[^A-Za-z0-9._-]/g, "-").replace(/-+/g, "-");
  return n.toLowerCase().endsWith(".pdf") ? n : `${n || "document"}.pdf`;
}

function metadata(m = {}) {
  const code = clean(m.documentCode, 40).toUpperCase().replace(/[^A-Z0-9._-]/g, "");
  if (!code) throw new Error("DOCUNET_DOCUMENT_CODE_REQUIRED");
  const title = clean(m.title, 240);
  if (!title) throw new Error("DOCUNET_TITLE_REQUIRED");
  return {
    documentId: clean(m.documentId, 80),
    title,
    shortTitle: clean(m.shortTitle || title, 100),
    documentCode: code,
    owner: clean(m.owner || "SKANDI Travels", 120),
    revision: clean(m.revision || "1.0", 40).replace(/[^A-Za-z0-9._-]/g, ""),
    documentType: clean(m.documentType || "Manual", 40),
    category: clean(m.category || "Operations", 120),
    group: clean(m.group || m.category || "Company Manuals", 120),
    services: codes(m.services),
    markets: codes(m.markets),
    audiences: codes(m.audiences || m.audience),
    effectiveDate: clean(m.effectiveDate, 10) || null,
    publishStatus: ["DRAFT", "PUBLISHED", "ARCHIVED"].includes(String(m.publishStatus).toUpperCase())
      ? String(m.publishStatus).toUpperCase()
      : "DRAFT",
    pageCount: Math.max(1, Math.min(100000, Number(m.pageCount || m.pages || 1))),
    tags: arr(m.tags).length
      ? arr(m.tags).map(x => clean(x, 60)).filter(Boolean)
      : String(m.tags || "").split(",").map(x => clean(x, 60)).filter(Boolean),
    requiresAcknowledgement: m.requiresAcknowledgement === true,
    isCritical: m.isCritical === true,
    summary: clean(m.summary, 4000),
    searchText: clean(m.searchText, 50000),
    accessPolicy: m.accessPolicy || {}
  };
}

export async function createDocuNetUploadCore({ requestId, metadata: meta, file } = {}) {
  const s = await access(true);
  const a = actor(s);
  const m = metadata(meta);
  const request = clean(requestId, 100);
  if (!request) throw new Error("DOCUNET_REQUEST_ID_REQUIRED");
  if (!file || file.type !== "application/pdf" || !Number(file.size) || Number(file.size) > 50 * 1024 * 1024) {
    throw new Error("DOCUNET_VALID_PDF_REQUIRED");
  }
  const path = `${m.documentCode.toLowerCase()}/${m.revision}/${request}-${safeFile(file.name)}`;
  await restRequest({
    table: "docunet_upload_sessions",
    method: "POST",
    body: {
      request_id: request,
      actor_id: a.id || a.skId,
      storage_bucket: BUCKET,
      storage_path: path,
      metadata: {
        ...m,
        file: {
          name: safeFile(file.name),
          size: Number(file.size),
          type: "application/pdf",
          lastModified: Number(file.lastModified || 0)
        }
      },
      expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
    }
  });
  const signed = await storageCreateSignedUploadUrl({ bucket: BUCKET, path, upsert: false });
  return {
    requestId: request,
    uploadUrl: signed.signedUrl,
    method: "PUT",
    headers: { "x-upsert": "false" },
    bucket: BUCKET,
    path
  };
}

async function syncDefinition(m) {
  const existing = first(await restRequest({
    table: "document_definitions",
    query: { select: "id,code", code: `eq.${m.documentCode}`, limit: 1 }
  }));
  const ap = m.accessPolicy || {};
  const patch = {
    name: m.title,
    public_template_access: ap.publicTemplateAccess === "OPEN" ? "OPEN" : "HIDDEN",
    customer_instance_access: ap.customerInstanceAccess === "SECURE_MEMBER_OR_ACCESS_CODE"
      ? "SECURE_MEMBER_OR_ACCESS_CODE"
      : "NONE",
    allow_blank_fill: ap.allowBlankFill === true,
    allow_blank_download: ap.allowBlankDownload === true,
    allow_self_start: ap.allowSelfStart === true,
    reservations_available: ap.reservationsAvailable === true,
    departure_control_available: ap.departureControlAvailable === true,
    docunet_available: ap.docunetAvailable !== false,
    docunet_admin_available: ap.docunetAdminAvailable !== false,
    sensitivity_class: clean(ap.sensitivityClass || "STANDARD", 60).toUpperCase(),
    official_source_url: clean(ap.officialSourceUrl, 1500) || null,
    active: true,
    updated_at: new Date().toISOString()
  };
  if (existing) {
    await restRequest({
      table: "document_definitions",
      method: "PATCH",
      query: { id: `eq.${existing.id}` },
      body: patch
    });
  } else {
    await restRequest({
      table: "document_definitions",
      method: "POST",
      body: {
        code: m.documentCode,
        ...patch,
        category: m.category.toUpperCase().replace(/[^A-Z0-9_]+/g, "_"),
        document_type: m.documentType.toUpperCase().replace(/[^A-Z0-9_]+/g, "_"),
        generation_mode: "CONTROLLED_PDF",
        owner: m.owner,
        render_profile: "pdf",
        template_version: m.revision,
        field_schema: {},
        settings: { source: "DOCUNET_CONTROLLED_PDF" },
        retention_years: 7
      }
    });
  }
}

export async function finalizeDocuNetUploadCore({ requestId } = {}) {
  const s = await access(true);
  const a = actor(s);
  const request = clean(requestId, 100);
  const session = first(await restRequest({
    table: "docunet_upload_sessions",
    query: { select: "*", request_id: `eq.${request}`, limit: 1 }
  }));
  if (!session) throw new Error("DOCUNET_UPLOAD_SESSION_NOT_FOUND");
  if (session.actor_id !== (a.id || a.skId)) throw new Error("DOCUNET_UPLOAD_SESSION_OWNER_MISMATCH");
  if (session.completed_at) throw new Error("DOCUNET_UPLOAD_ALREADY_FINALIZED");

  const info = await storageGetObjectInfo({ bucket: session.storage_bucket, path: session.storage_path });
  const source = await storageCreateSignedReadUrl({
    bucket: session.storage_bucket,
    path: session.storage_path,
    expiresIn: 900
  });
  const adobe = await getAdobePdfPropertiesFromUrl({ url: source.signedUrl, pageLevel: false });

  const m = session.metadata || {};
  const f = m.file || {};
  const verifiedPageCount = Math.max(1, Math.min(100000, Number(adobe.pageCount || m.pageCount || 1)));
  const now = new Date().toISOString();

  let doc = m.documentId ? first(await restRequest({
    table: "docunet_documents",
    query: { select: "*", id: `eq.${m.documentId}`, deleted_at: "is.null", limit: 1 }
  })) : null;
  if (!doc) {
    doc = first(await restRequest({
      table: "docunet_documents",
      query: { select: "*", document_code: `eq.${m.documentCode}`, deleted_at: "is.null", limit: 1 }
    }));
  }

  const docBody = {
    document_code: m.documentCode,
    title: m.title,
    short_title: m.shortTitle,
    owner: m.owner,
    document_type: m.documentType,
    category_text: m.category,
    group_name: m.group,
    summary: m.summary || "",
    tags: m.tags || [],
    services: m.services || ["ALL"],
    markets: m.markets || ["ALL"],
    audiences: m.audiences || ["ALL"],
    publish_status: m.publishStatus,
    requires_acknowledgement: m.requiresAcknowledgement === true,
    is_critical: m.isCritical === true,
    page_count: verifiedPageCount,
    updated_by: a.skId || a.id,
    updated_at: now
  };

  if (doc) {
    doc = first(await restRequest({
      table: "docunet_documents",
      method: "PATCH",
      query: { id: `eq.${doc.id}` },
      body: docBody
    })) || { ...doc, ...docBody };
  } else {
    doc = first(await restRequest({
      table: "docunet_documents",
      method: "POST",
      body: { ...docBody, created_by: a.skId || a.id, created_at: now }
    }));
  }

  const rev = first(await restRequest({
    table: "docunet_revisions",
    method: "POST",
    body: {
      document_id: doc.id,
      revision: m.revision || "1.0",
      effective_date: m.effectiveDate,
      revision_status: m.publishStatus === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
      storage_bucket: session.storage_bucket,
      storage_path: session.storage_path,
      file_name: f.name || safeFile("document.pdf"),
      file_size: Number(adobe.fileSize || info?.metadata?.size || info?.size || f.size || 1),
      mime_type: "application/pdf",
      search_text: m.searchText || "",
      checksum_sha256: null,
      created_by: a.skId || a.id,
      published_at: m.publishStatus === "PUBLISHED" ? now : null
    }
  }));

  await restRequest({
    table: "docunet_documents",
    method: "PATCH",
    query: { id: `eq.${doc.id}` },
    body: { current_revision_id: rev.id, updated_at: now }
  });
  await restRequest({
    table: "docunet_upload_sessions",
    method: "PATCH",
    query: { request_id: `eq.${request}` },
    body: { completed_at: now }
  });
  await syncDefinition({ ...m, pageCount: verifiedPageCount });
  await audit(a, "DOCUNET_REVISION_CREATED", {
    revision: m.revision,
    fileName: f.name,
    pdfProvider: "ADOBE_PDF_SERVICES",
    pageCount: verifiedPageCount,
    pdfVersion: adobe.pdfVersion || "",
    providerFileSize: adobe.fileSize || null,
    encrypted: adobe.encrypted === true
  }, doc.id, rev.id);

  return {
    ok: true,
    documentId: doc.id,
    revisionId: rev.id,
    pageCount: verifiedPageCount,
    pdfValidation: {
      provider: "ADOBE_PDF_SERVICES",
      pdfVersion: adobe.pdfVersion || "",
      encrypted: adobe.encrypted === true
    }
  };
}

export async function saveDocuNetMetadataCore(meta = {}) {
  const s = await access(true);
  const a = actor(s);
  const m = metadata(meta);
  const id = clean(m.documentId, 80);
  if (!id) throw new Error("DOCUNET_DOCUMENT_ID_REQUIRED");
  const rows = await restRequest({
    table: "docunet_documents",
    method: "PATCH",
    query: { id: `eq.${id}`, deleted_at: "is.null" },
    body: {
      title: m.title,
      short_title: m.shortTitle,
      owner: m.owner,
      document_type: m.documentType,
      category_text: m.category,
      group_name: m.group,
      summary: m.summary,
      tags: m.tags,
      services: m.services,
      markets: m.markets,
      audiences: m.audiences,
      publish_status: m.publishStatus,
      requires_acknowledgement: m.requiresAcknowledgement,
      is_critical: m.isCritical,
      page_count: m.pageCount,
      updated_by: a.skId || a.id,
      updated_at: new Date().toISOString()
    }
  });
  await syncDefinition(m);
  return { ok: true, documentId: first(rows)?.id || id };
}

export async function setDocuNetDocumentStatusCore({ documentId, publishStatus } = {}) {
  const s = await access(true);
  const a = actor(s);
  const status = String(publishStatus || "").toUpperCase();
  if (!["DRAFT", "PUBLISHED", "ARCHIVED"].includes(status)) throw new Error("DOCUNET_STATUS_INVALID");
  const rows = await restRequest({
    table: "docunet_documents",
    method: "PATCH",
    query: { id: `eq.${clean(documentId, 80)}` },
    body: {
      publish_status: status,
      updated_by: a.skId || a.id,
      updated_at: new Date().toISOString(),
      ...(status === "ARCHIVED" ? { archived_at: new Date().toISOString() } : {})
    }
  });
  return { ok: true, document: first(rows) || null };
}

export async function deleteDocuNetDocumentCore({ documentId } = {}) {
  const s = await access(true);
  const a = actor(s);
  const id = clean(documentId, 80);
  await restRequest({
    table: "docunet_documents",
    method: "PATCH",
    query: { id: `eq.${id}` },
    body: {
      deleted_at: new Date().toISOString(),
      updated_by: a.skId || a.id,
      updated_at: new Date().toISOString()
    }
  });
  await audit(a, "DOCUNET_DOCUMENT_DELETED", {}, id, null);
  return { ok: true, documentId: id };
}

export async function saveDocuNetCategoryCore(category = {}) {
  await access(true);
  const id = clean(category.id || category._id || category.categoryId, 80);
  const body = {
    title: clean(category.title || category.name, 160),
    description: clean(category.description, 1000),
    sort_order: Number(category.sortOrder || 0),
    active: category.active !== false,
    updated_at: new Date().toISOString()
  };
  if (!body.title) throw new Error("DOCUNET_CATEGORY_TITLE_REQUIRED");
  const rows = id
    ? await restRequest({ table: "docunet_categories", method: "PATCH", query: { id: `eq.${id}` }, body })
    : await restRequest({ table: "docunet_categories", method: "POST", body });
  return { ok: true, category: first(rows) || body };
}

export async function deleteDocuNetCategoryCore({ categoryId } = {}) {
  await access(true);
  await restRequest({
    table: "docunet_categories",
    method: "DELETE",
    query: { id: `eq.${clean(categoryId, 80)}` }
  });
  return { ok: true };
}

export async function searchDocuNetAuditCore() {
  await access(true);
  const rows = await restRequest({
    table: "docunet_audit_events",
    query: { select: "*", order: "created_at.desc", limit: 500 }
  });
  return {
    events: rows.map(r => ({
      ...r,
      eventType: r.event_type,
      createdAt: r.created_at,
      staffName: r.actor_name,
      staffEmail: r.actor_email
    }))
  };
}

export async function getDocuNetAdminPreviewCore({ documentId } = {}) {
  await access(true);
  return documentAccess(documentId, true);
}

async function documentAccess(documentId, admin = false) {
  const s = await access(admin);
  const a = actor(s);
  const id = clean(documentId, 80);
  const doc = first(await restRequest({
    table: "docunet_documents",
    query: { select: "*", id: `eq.${id}`, deleted_at: "is.null", limit: 1 }
  }));
  if (!doc) throw new Error("DOCUNET_DOCUMENT_NOT_FOUND");
  if (!admin && doc.publish_status !== "PUBLISHED") throw new Error("DOCUNET_DOCUMENT_NOT_PUBLISHED");
  if (!admin && !applies(doc, a)) throw new Error("DOCUNET_DOCUMENT_NOT_APPLICABLE");

  let rev = doc.current_revision_id ? first(await restRequest({
    table: "docunet_revisions",
    query: { select: "*", id: `eq.${doc.current_revision_id}`, limit: 1 }
  })) : null;
  if (!rev) {
    rev = first(await restRequest({
      table: "docunet_revisions",
      query: { select: "*", document_id: `eq.${id}`, order: "created_at.desc", limit: 1 }
    }));
  }
  if (!rev) throw new Error("DOCUNET_REVISION_NOT_FOUND");

  const signed = await storageCreateSignedReadUrl({
    bucket: rev.storage_bucket,
    path: rev.storage_path,
    expiresIn: 600
  });

  if (!admin) {
    const receipt = first(await restRequest({
      table: "docunet_receipts",
      query: {
        select: "*",
        document_id: `eq.${id}`,
        revision_id: `eq.${rev.id}`,
        staff_id: `eq.${a.skId || a.id}`,
        limit: 1
      }
    }));
    if (receipt) {
      await restRequest({
        table: "docunet_receipts",
        method: "PATCH",
        query: { id: `eq.${receipt.id}` },
        body: {
          last_viewed_at: new Date().toISOString(),
          view_count: Number(receipt.view_count || 0) + 1,
          updated_at: new Date().toISOString()
        }
      });
    } else {
      await restRequest({
        table: "docunet_receipts",
        method: "POST",
        body: {
          document_id: id,
          revision_id: rev.id,
          staff_id: a.skId || a.id,
          staff_name: a.name,
          staff_email: a.email || null,
          first_viewed_at: new Date().toISOString(),
          last_viewed_at: new Date().toISOString(),
          view_count: 1
        }
      });
    }
    await audit(a, "DOCUNET_VIEWED", {}, id, rev.id);
  }

  return {
    documentId: id,
    title: doc.title,
    code: doc.document_code,
    revision: rev.revision,
    revisionDate: rev.effective_date || "",
    pages: doc.page_count,
    requiresAcknowledgement: doc.requires_acknowledgement,
    isCritical: doc.is_critical,
    signedUrl: signed.signedUrl,
    expiresIn: 600
  };
}

export async function getDocuNetViewerBootstrapCore() {
  const s = await access(false);
  const a = actor(s);
  const rows = (await restRequest({
    table: "docunet_documents",
    query: {
      select: "*",
      publish_status: "eq.PUBLISHED",
      deleted_at: "is.null",
      order: "group_name.asc,title.asc",
      limit: 500
    }
  })).filter(d => applies(d, a));
  const rm = await revisionMap(rows);
  const dm = await defs(rows.map(x => x.document_code));
  const receipts = await restRequest({
    table: "docunet_receipts",
    query: {
      select: "document_id,revision_id,last_viewed_at,acknowledged_at",
      staff_id: `eq.${a.skId || a.id}`,
      limit: 1000
    }
  });
  const rec = new Map(receipts.map(r => [`${r.document_id}:${r.revision_id}`, r]));
  const documents = rows.map(d => {
    const r = rm.get(d.current_revision_id);
    const receipt = r ? rec.get(`${d.id}:${r.id}`) : null;
    const ap = accessPolicy(dm.get(d.document_code));
    return {
      id: d.id,
      code: d.document_code,
      title: d.title,
      short: d.short_title || d.title,
      group: d.group_name || d.category_text || "Company Manuals",
      owner: d.owner,
      revision: r?.revision || "",
      revisionDate: r?.effective_date || "",
      status: "Active",
      updated: Boolean(r?.published_at && Date.parse(r.published_at) > Date.now() - 30 * 86400000),
      services: d.services,
      markets: d.markets,
      audiences: d.audiences,
      pages: d.page_count,
      summary: d.summary,
      searchText: r?.search_text || "",
      requiresAcknowledgement: d.requires_acknowledgement,
      isCritical: d.is_critical,
      acknowledgedAt: receipt?.acknowledged_at || null,
      viewedAt: receipt?.last_viewed_at || null,
      accessPolicy: ap
    };
  }).filter(d => d.accessPolicy.docunetAvailable !== false);
  return {
    session: a,
    documents,
    categories: [...new Set(documents.map(d => d.group))]
  };
}

export async function getDocuNetDocumentAccessCore({ documentId } = {}) {
  return documentAccess(documentId, false);
}

export async function acknowledgeDocuNetDocumentCore({ documentId, revisionId } = {}) {
  const s = await access(false);
  const a = actor(s);
  const id = clean(documentId, 80);
  const rev = clean(revisionId, 80);
  const receipt = first(await restRequest({
    table: "docunet_receipts",
    query: {
      select: "*",
      document_id: `eq.${id}`,
      staff_id: `eq.${a.skId || a.id}`,
      limit: 1
    }
  }));
  if (!receipt) throw new Error("DOCUNET_VIEW_REQUIRED_BEFORE_ACKNOWLEDGEMENT");
  const now = new Date().toISOString();
  await restRequest({
    table: "docunet_receipts",
    method: "PATCH",
    query: { id: `eq.${receipt.id}` },
    body: {
      acknowledged_at: now,
      acknowledgement_revision: rev || null,
      updated_at: now
    }
  });
  await audit(a, "DOCUNET_ACKNOWLEDGED", { revision: rev }, id, receipt.revision_id);
  return { ok: true, documentId: id, acknowledgedAt: now };
}

// V12 controlled bucket administration. Raw files are NOT automatically approved staff documents.
// Every entry point authorizes staff on the server; never trust client-provided role/status.
function safeStoragePdfPath(value) {
  const path = clean(value, 900);
  if (!path || path.startsWith("/") || path.includes("\\") || path.includes("//") ||
      path.split("/").some(v => v === ".." || v === "." || !v) ||
      /[?#%\x00-\x1f]/.test(path) || !/^[a-z0-9_.@()\- /]+\.pdf$/i.test(path)) {
    throw new Error("DOCUNET_STORAGE_PDF_PATH_INVALID");
  }
  return path;
}
function standardPath(path) {
  return `supabase://${BUCKET}/${path}`;
}
async function referenceReport(path) {
  const [revisions, sessions, legal, attachments, templates] = await Promise.all([
    restRequest({ table: "docunet_revisions", query: { select: "id,document_id,revision,revision_status,storage_path", storage_bucket: `eq.${BUCKET}`, storage_path: `eq.${path}`, limit: 100 } }),
    restRequest({ table: "docunet_upload_sessions", query: { select: "request_id,completed_at,expires_at", storage_bucket: `eq.${BUCKET}`, storage_path: `eq.${path}`, limit: 100 } }),
    restRequest({ table: "legal_policies", query: { select: "policy_id,status", pdf_file_url: `eq.${standardPath(path)}`, limit: 100 } }),
    restRequest({ table: "document_attachments", query: { select: "id,storage_provider,storage_key", storage_key: `in.("${path}","${BUCKET}/${path}")`, limit: 100 } }),
    restRequest({ table: "document_templates", query: { select: "id", file_url: `eq.${standardPath(path)}`, limit: 100 } })
  ]);
  const activeUploads = arr(sessions).filter(v => !v.completed_at && Date.parse(v.expires_at || "") > Date.now());
  return { revisions: arr(revisions), activeUploads, legal: arr(legal), attachments: arr(attachments), templates: arr(templates) };
}
function assertNoExternalReferences(report) {
  if (report.legal.length || report.attachments.length || report.templates.length || report.activeUploads.length) {
    throw new Error("DOCUNET_STORAGE_REFERENCED_BY_OTHER_SYSTEM");
  }
}
function mimePdf(info) {
  const type = lower(info?.mimetype || info?.mime_type || info?.metadata?.mimetype || info?.metadata?.mime_type || "application/pdf");
  if (type !== "application/pdf") throw new Error("DOCUNET_STORAGE_EXPECTED_PDF");
}

export async function listDocuNetStorageCore({ prefix = "", search = "" } = {}) {
  await access(true);
  const match = lower(search).slice(0, 150);
  const start = clean(prefix, 400).replace(/^\/+|\/+$/g, "");
  if (start && (start.includes("..") || start.includes("\\") || /[?#%]/.test(start))) throw new Error("DOCUNET_STORAGE_PREFIX_INVALID");
  const folders = [start];
  const seenDirs = new Set();
  const files = [];
  const seenPaths = new Set();
  let truncated = false;
  while (folders.length) {
    if (seenDirs.size >= 200 || files.length >= 1000) { truncated = true; break; }
    const folder = folders.shift();
    if (seenDirs.has(folder)) continue;
    seenDirs.add(folder);
    if (folder.split("/").length > 10) { truncated = true; continue; }
    for (let offset = 0; offset < 1000; offset += 100) {
      const batch = await storageListObjects({ bucket: BUCKET, prefix: folder, limit: 100, offset });
      if (!Array.isArray(batch)) throw new Error("DOCUNET_STORAGE_LIST_INVALID");
      for (const obj of batch) {
        const name = clean(obj?.name, 600);
        if (!name) continue;
        const path = !folder || !name.startsWith(`${folder}/`) ? [folder, name].filter(Boolean).join("/") : name;
        if (!obj.id && !obj.metadata) {
          if (!folders.includes(path) && !seenDirs.has(path)) folders.push(path);
          continue;
        }
        if (!path.toLowerCase().endsWith(".pdf") || seenPaths.has(path)) continue;
        seenPaths.add(path);
        if (match && !path.toLowerCase().includes(match)) continue;
        files.push({ path, name: path.split("/").pop(), bytes: Number(obj.metadata?.size || 0), createdAt: obj.created_at || "", mimeType: obj.metadata?.mimetype || "application/pdf" });
      }
      if (batch.length < 100) break;
      if (offset === 900) truncated = true;
    }
  }
  const [revisions, legal, attachments] = await Promise.all([
    restRequest({ table: "docunet_revisions", query: { select: "id,document_id,storage_path", storage_bucket: `eq.${BUCKET}`, limit: 5000 } }),
    restRequest({ table: "legal_policies", query: { select: "policy_id,pdf_file_url", limit: 500 } }),
    restRequest({ table: "document_attachments", query: { select: "storage_key", limit: 5000 } })
  ]);
  const revisionMap = new Map();
  for (const r of arr(revisions)) revisionMap.set(r.storage_path, [...(revisionMap.get(r.storage_path) || []), r.id]);
  const legalPaths = new Set(arr(legal).map(r => clean(r.pdf_file_url, 1500)).filter(Boolean));
  const attachmentKeys = new Set(arr(attachments).map(r => clean(r.storage_key, 1500)).filter(Boolean));
  return {
    bucket: BUCKET,
    private: true,
    truncated,
    files: files.map(f => ({
      ...f,
      registered: Boolean(revisionMap.get(f.path)?.length),
      revisionCount: (revisionMap.get(f.path) || []).length,
      linkedElsewhere: legalPaths.has(standardPath(f.path)) || attachmentKeys.has(f.path) || attachmentKeys.has(`${BUCKET}/${f.path}`)
    }))
  };
}

export async function getDocuNetStoragePreviewCore({ path } = {}) {
  await access(true);
  const source = safeStoragePdfPath(path);
  await storageGetObjectInfo({ bucket: BUCKET, path: source });
  const signed = await storageCreateSignedReadUrl({ bucket: BUCKET, path: source, expiresIn: 600 });
  return { path: source, title: source.split("/").pop(), signedUrl: signed.signedUrl, expiresIn: 600 };
}

export async function registerDocuNetStoredPdfCore({ path, metadata: raw } = {}) {
  const session = await access(true);
  const a = actor(session);
  const sourcePath = safeStoragePdfPath(path);
  const m = metadata({ ...raw, publishStatus: "DRAFT" });
  const refs = await referenceReport(sourcePath);
  if (refs.revisions.length || refs.activeUploads.length) throw new Error("DOCUNET_STORAGE_ALREADY_REGISTERED_OR_PENDING");
  const info = await storageGetObjectInfo({ bucket: BUCKET, path: sourcePath });
  mimePdf(info);
  const signed = await storageCreateSignedReadUrl({ bucket: BUCKET, path: sourcePath, expiresIn: 900 });
  const properties = await getAdobePdfPropertiesFromUrl({ url: signed.signedUrl, pageLevel: false });
  const pages = Number(properties.pageCount);
  if (!Number.isInteger(pages) || pages < 1) throw new Error("DOCUNET_STORAGE_PDF_PAGE_COUNT_UNVERIFIED");
  const existing = first(await restRequest({ table: "docunet_documents", query: { select: "id", document_code: `eq.${m.documentCode}`, deleted_at: "is.null", limit: 2 } }));
  if (existing && existing.id !== m.documentId) throw new Error("DOCUNET_DOCUMENT_CODE_ALREADY_EXISTS");
  if (m.documentId && (!existing || existing.id !== m.documentId)) throw new Error("DOCUNET_DOCUMENT_ID_CODE_MISMATCH");
  const now = new Date().toISOString();
  const docData = {
    document_code: m.documentCode, title: m.title, short_title: m.shortTitle, owner: m.owner,
    document_type: m.documentType, category_text: m.category, group_name: m.group, summary: m.summary,
    tags: m.tags, services: m.services, markets: m.markets, audiences: m.audiences,
    publish_status: "DRAFT", requires_acknowledgement: m.requiresAcknowledgement, is_critical: m.isCritical,
    page_count: pages, updated_by: a.skId || a.id, updated_at: now
  };
  const rows = existing
    ? await restRequest({ table: "docunet_documents", method: "PATCH", query: { id: `eq.${existing.id}` }, body: docData })
    : await restRequest({ table: "docunet_documents", method: "POST", body: { ...docData, created_by: a.skId || a.id, created_at: now } });
  const doc = first(rows) || { ...docData, id: existing?.id };
  if (!doc.id) throw new Error("DOCUNET_STORAGE_DOCUMENT_WRITE_FAILED");
  const revs = await restRequest({ table: "docunet_revisions", query: { select: "id", document_id: `eq.${doc.id}`, revision: `eq.${m.revision}`, limit: 1 } });
  if (revs.length) throw new Error("DOCUNET_REVISION_ALREADY_EXISTS");
  const revRows = await restRequest({ table: "docunet_revisions", method: "POST", body: {
    document_id: doc.id, revision: m.revision, effective_date: m.effectiveDate,
    revision_status: "DRAFT", storage_bucket: BUCKET, storage_path: sourcePath,
    file_name: sourcePath.split("/").pop(), file_size: Number(info?.metadata?.size || info?.size || properties.fileSize || 0),
    mime_type: "application/pdf", search_text: m.searchText || "", checksum_sha256: null, created_by: a.skId || a.id
  }});
  const revision = first(revRows);
  if (!revision?.id) throw new Error("DOCUNET_STORAGE_REVISION_WRITE_FAILED");
  await restRequest({ table: "docunet_documents", method: "PATCH", query: { id: `eq.${doc.id}` }, body: { current_revision_id: revision.id, updated_at: now } });
  await syncDefinition({ ...m, pageCount: pages });
  await audit(a, "DOCUNET_STORAGE_REGISTERED", { path: sourcePath, source: "EXISTING_BUCKET_PDF", revision: m.revision }, doc.id, revision.id);
  return { ok: true, documentId: doc.id, revisionId: revision.id, status: "DRAFT", pageCount: pages };
}

export async function renameDocuNetStorageObjectCore({ path, destinationPath } = {}) {
  const session = await access(true);
  const a = actor(session);
  const source = safeStoragePdfPath(path);
  const target = safeStoragePdfPath(destinationPath);
  if (source === target) throw new Error("DOCUNET_STORAGE_NO_RENAME_CHANGE");
  await storageGetObjectInfo({ bucket: BUCKET, path: source });
  const refs = await referenceReport(source);
  assertNoExternalReferences(refs);
  const targetRefs = await referenceReport(target);
  if (targetRefs.revisions.length || targetRefs.legal.length || targetRefs.attachments.length || targetRefs.activeUploads.length) {
    throw new Error("DOCUNET_STORAGE_DESTINATION_REFERENCED");
  }
  // Copy first, preserve the old object until the authoritative revision path has been updated.
  await storageCopyObject({ bucket: BUCKET, sourcePath: source, destinationPath: target });
  if (refs.revisions.length) {
    // One PostgREST update statement relinks every revision referencing this object.
    const changed = await restRequest({
      table: "docunet_revisions", method: "PATCH",
      query: { storage_bucket: `eq.${BUCKET}`, storage_path: `eq.${source}` },
      body: { storage_path: target, file_name: target.split("/").pop() }
    });
    if (changed.length !== refs.revisions.length) throw new Error("DOCUNET_STORAGE_REVISION_RELINK_INCOMPLETE_SOURCE_PRESERVED");
  }
  const remaining = await referenceReport(source);
  assertNoExternalReferences(remaining);
  if (remaining.revisions.length) throw new Error("DOCUNET_STORAGE_SOURCE_STILL_REFERENCED_CLEANUP_REQUIRED");
  // Storage removal is deliberately last; a cleanup failure leaves the copied file recoverable.
  await storageRemoveObjects({ bucket: BUCKET, paths: [source] });
  await audit(a, "DOCUNET_STORAGE_MOVED", { source, destination: target, revisionCount: refs.revisions.length }, refs.revisions[0]?.document_id || null, refs.revisions[0]?.id || null);
  return { ok: true, path: target, movedRevisions: refs.revisions.length };
}

export async function deleteDocuNetUnregisteredStorageObjectCore({ path } = {}) {
  const session = await access(true);
  const a = actor(session);
  const source = safeStoragePdfPath(path);
  const refs = await referenceReport(source);
  assertNoExternalReferences(refs);
  if (refs.revisions.length) throw new Error("DOCUNET_STORAGE_REVISION_MUST_BE_RETAINED");
  await storageGetObjectInfo({ bucket: BUCKET, path: source });
  await storageRemoveObjects({ bucket: BUCKET, paths: [source] });
  await audit(a, "DOCUNET_STORAGE_UNLINKED_PDF_DELETED", { path: source });
  return { ok: true, path: source };
}
