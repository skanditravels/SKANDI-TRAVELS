// /src/backend/SKANDI_CORE/legalPolicy.js
// SKANDI Legal — B-011.2 canonical public legal-content core.
//
// Public Legal reads only published, active, external policies from the
// canonical Supabase legal_policies table. Policy Control is the editorial
// owner of those records; this module is the public-safe read projection.
//
// No browser Supabase access, no HTTP-function bypass, no parallel registry.

import { restRequest } from "backend/SKANDI_CORE/supabaseServer";
import { SITE_MAP } from "public/siteMap";

export const LEGAL_POLICY_VERSION = "B-011.3";

const clean = (value, max = 6000) => String(value ?? "").trim().slice(0, max);
const lower = (value, max = 200) => clean(value, max).toLowerCase();
const bool = value => value === true;
const num = (value, fallback = 999) => Number.isFinite(Number(value)) ? Number(value) : fallback;

function safeHttps(value) {
  const url = clean(value, 3000);
  return /^https:\/\//i.test(url) ? url : "";
}

function policyRoute(row = {}) {
  const slug = clean(row.slug, 240);
  const policyId = clean(row.policy_id, 180);
  const documentId = clean(row.document_id, 180);

  if (slug) return `${SITE_MAP.policies}?slug=${encodeURIComponent(slug)}`;
  if (policyId) return `${SITE_MAP.policies}?policyId=${encodeURIComponent(policyId)}`;
  if (documentId) return `${SITE_MAP.policies}?documentId=${encodeURIComponent(documentId)}`;
  return SITE_MAP.policies;
}

function publicPolicy(row = {}) {
  return {
    policyId: clean(row.policy_id, 180),
    documentId: clean(row.document_id, 180),
    title: clean(row.title, 600),
    slug: clean(row.slug, 240),
    scope: lower(row.scope, 80) || "external",
    brand: clean(row.brand, 160),
    publicType: clean(row.public_type, 120),
    status: clean(row.status, 80),
    category: clean(row.category, 240),
    summary: clean(row.summary, 3000),
    effectiveDate: row.effective_date || null,
    version: clean(row.version, 80),
    pdfUrl: safeHttps(row.pdf_file_url),
    pdfFileName: clean(row.pdf_file_name, 280),
    featured: bool(row.featured),
    active: row.active !== false,
    sortOrder: num(row.sort_order),
    publishedAt: row.published_at || null,
    updatedAt: row.updated_at || null,
    route: policyRoute(row)
  };
}

function publicSection(section = {}) {
  const children = Array.isArray(section?.children)
    ? section.children.map(publicSection)
    : [];

  return {
    id: clean(section?.id, 180),
    title: clean(section?.title, 1000),
    bodyHtml: clean(section?.bodyHtml ?? section?.body_html, 250000),
    children
  };
}

function publicDocument(row = {}) {
  return {
    ...publicPolicy(row),
    introductionHtml: clean(row.introduction_html, 250000),
    sections: Array.isArray(row.sections) ? row.sections.map(publicSection) : [],
    bodyHtml: clean(row.body_html, 500000),
    bodyPlainText: clean(row.body_plain_text, 500000),
    reviewDate: row.review_date || null,
    owner: clean(row.owner, 240) || "Legal / Compliance",
    approvedByName: clean(row.approved_by_name, 240),
    acknowledgementRequired: bool(row.acknowledgement_required)
  };
}

const PUBLIC_META_SELECT =
  "policy_id,document_id,title,slug,scope,brand,public_type,status,category,summary," +
  "effective_date,version,pdf_file_url,pdf_file_name,featured,active,sort_order," +
  "published_at,updated_at,deleted_at";

const PUBLIC_DOCUMENT_SELECT =
  PUBLIC_META_SELECT +
  ",introduction_html,sections,body_html,body_plain_text,review_date,owner," +
  "approved_by_name,acknowledgement_required";

const DIRECT_TYPE_ORDER = Object.freeze([
  "privacy",
  "cookies",
  "bookingterms",
  "accessibility",
  "terms"
]);

function directRank(policy = {}) {
  const type = lower(policy.publicType, 120).replace(/[^a-z0-9]/g, "");
  const index = DIRECT_TYPE_ORDER.indexOf(type);
  if (index >= 0) return index;
  return policy.featured ? DIRECT_TYPE_ORDER.length : DIRECT_TYPE_ORDER.length + 100;
}

function publicBaseQuery(select) {
  return {
    select,
    scope: "eq.external",
    status: "eq.Published",
    active: "eq.true",
    deleted_at: "is.null"
  };
}

function identifierFilter(input = {}) {
  const slug = clean(input.slug, 240);
  const policyId = clean(input.policyId ?? input.policy_id, 180);
  const documentId = clean(input.documentId ?? input.document_id, 180);
  const type = clean(input.type ?? input.publicType, 120);

  if (slug) return { slug: `eq.${slug}` };
  if (policyId) return { policy_id: `eq.${policyId}` };
  if (documentId) return { document_id: `eq.${documentId}` };
  if (type) return { public_type: `ilike.${type}` };

  throw new Error("LEGAL_DOCUMENT_IDENTIFIER_REQUIRED");
}

function suggestedRank(candidate = {}, current = {}) {
  let score = 0;

  if (
    candidate.category &&
    current.category &&
    lower(candidate.category, 240) === lower(current.category, 240)
  ) score += 80;

  if (
    candidate.publicType &&
    current.publicType &&
    lower(candidate.publicType, 120) === lower(current.publicType, 120)
  ) score += 25;

  if (candidate.featured) score += 15;

  const directIndex = DIRECT_TYPE_ORDER.indexOf(
    lower(candidate.publicType, 120).replace(/[^a-z0-9]/g, "")
  );
  if (directIndex >= 0) score += Math.max(0, 10 - directIndex);

  score += Math.max(0, 5 - Math.min(5, Math.floor(num(candidate.sortOrder) / 250)));

  return score;
}

function emailValue(value) {
  const email = lower(value, 320);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("LEGAL_ACK_EMAIL_INVALID");
  }
  return email;
}

function acknowledgementDecision(value) {
  const decision = clean(value, 40);
  if (!["approved", "notApproved"].includes(decision)) {
    throw new Error("LEGAL_ACK_DECISION_INVALID");
  }
  return decision;
}

function signatureImage(value) {
  const raw = clean(value, 700000);
  if (!raw || !/^data:image\/png;base64,[A-Za-z0-9+/=\s]+$/i.test(raw)) {
    throw new Error("LEGAL_ACK_SIGNATURE_REQUIRED");
  }
  return raw;
}

function acknowledgementSubmissionId(value) {
  const id = clean(value, 180);
  if (!id || !/^[A-Za-z0-9._:-]{12,180}$/.test(id)) {
    throw new Error("LEGAL_ACK_SUBMISSION_ID_INVALID");
  }
  return id;
}

function acknowledgementPayload(input = {}, document = {}) {
  const firstName = clean(input.firstName, 160);
  const lastName = clean(input.lastName, 160);
  const emailAddress = emailValue(input.emailAddress ?? input.email);
  const phoneNumber = clean(input.phoneNumber ?? input.phone, 120);
  const relationship = clean(input.relationship, 120) || "Customer";
  const decision = acknowledgementDecision(input.decision);
  const comment = clean(input.comment, 5000);
  const electronicConsent = input.electronicConsent === true;
  const signatureName = clean(input.signatureName, 320);
  const signatureImageData = signatureImage(input.signatureImageData);
  const submissionId = acknowledgementSubmissionId(input.submissionId);
  const submittedVersion = clean(input.policyVersion, 80);

  if (!firstName || !lastName) throw new Error("LEGAL_ACK_NAME_REQUIRED");
  if (!electronicConsent) throw new Error("LEGAL_ACK_CONSENT_REQUIRED");
  if (!signatureName) throw new Error("LEGAL_ACK_TYPED_SIGNATURE_REQUIRED");
  if (decision === "notApproved" && !comment) throw new Error("LEGAL_ACK_COMMENT_REQUIRED");
  if (submittedVersion && submittedVersion !== document.version) {
    throw new Error("LEGAL_ACK_POLICY_VERSION_CHANGED");
  }

  return {
    submissionId,
    source: "PUBLIC_LEGAL_POLICY",
    sourcePage: SITE_MAP.policies,
    policyId: document.policyId,
    documentId: document.documentId,
    policyTitle: document.title,
    policySlug: document.slug,
    policyVersion: document.version,
    policyCategory: document.category,
    decision,
    relationship,
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`.trim(),
    emailAddress,
    phoneNumber,
    comment,
    electronicConsent: true,
    signatureName,
    signatureImageData,
    signatureTimestamp: new Date().toISOString(),
    acknowledgementRequired: true
  };
}

async function getAcknowledgementPolicy(input = {}) {
  const filter = identifierFilter(input);

  const rows = await restRequest({
    table: "legal_policies",
    method: "GET",
    query: {
      ...publicBaseQuery(
        "policy_id,document_id,title,slug,scope,brand,public_type,status,category," +
        "summary,effective_date,version,featured,active,sort_order,published_at,updated_at," +
        "deleted_at,acknowledgement_required"
      ),
      ...filter,
      acknowledgement_required: "eq.true",
      limit: "1"
    },
    prefer: ""
  });

  const row = Array.isArray(rows) ? rows[0] : null;
  if (!row) throw new Error("LEGAL_ACK_NOT_REQUIRED");

  const document = {
    ...publicPolicy(row),
    acknowledgementRequired: row.acknowledgement_required === true
  };

  if (!document.acknowledgementRequired) throw new Error("LEGAL_ACK_NOT_REQUIRED");
  return document;
}

export async function getPublicLegalHubCore() {
  const rows = await restRequest({
    table: "legal_policies",
    method: "GET",
    query: {
      ...publicBaseQuery(PUBLIC_META_SELECT),
      order: "sort_order.asc,title.asc",
      limit: "500"
    },
    prefer: ""
  });

  const policies = (Array.isArray(rows) ? rows : [])
    .map(publicPolicy)
    .filter(item => item.active && item.scope === "external" && lower(item.status, 80) === "published");

  const directPages = policies
    .filter(item => clean(item.publicType, 120) || item.featured)
    .sort((a, b) => {
      const rank = directRank(a) - directRank(b);
      if (rank) return rank;
      const sort = a.sortOrder - b.sortOrder;
      if (sort) return sort;
      return a.title.localeCompare(b.title);
    })
    .slice(0, 8);

  return {
    ok: true,
    source: "SUPABASE_LEGAL_POLICIES",
    version: LEGAL_POLICY_VERSION,
    directPages,
    policies,
    settings: {},
    generatedAt: new Date().toISOString()
  };
}

export async function getPublicLegalDocumentCore(input = {}) {
  const filter = identifierFilter(input);

  const [documentRows, suggestionRows] = await Promise.all([
    restRequest({
      table: "legal_policies",
      method: "GET",
      query: {
        ...publicBaseQuery(PUBLIC_DOCUMENT_SELECT),
        ...filter,
        limit: "1"
      },
      prefer: ""
    }),
    restRequest({
      table: "legal_policies",
      method: "GET",
      query: {
        ...publicBaseQuery(PUBLIC_META_SELECT),
        order: "sort_order.asc,title.asc",
        limit: "500"
      },
      prefer: ""
    })
  ]);

  const row = Array.isArray(documentRows) ? documentRows[0] : null;
  if (!row) throw new Error("LEGAL_DOCUMENT_NOT_FOUND");

  const document = publicDocument(row);

  const suggestedDocuments = (Array.isArray(suggestionRows) ? suggestionRows : [])
    .map(publicPolicy)
    .filter(item =>
      item.active &&
      item.scope === "external" &&
      lower(item.status, 80) === "published" &&
      item.policyId !== document.policyId
    )
    .sort((a, b) => {
      const score = suggestedRank(b, document) - suggestedRank(a, document);
      if (score) return score;
      const sort = a.sortOrder - b.sortOrder;
      if (sort) return sort;
      return a.title.localeCompare(b.title);
    })
    .slice(0, 4);

  return {
    ok: true,
    source: "SUPABASE_LEGAL_POLICIES",
    version: LEGAL_POLICY_VERSION,
    viewerContext: "public",
    backPath: SITE_MAP.legal,
    policyPath: SITE_MAP.policies,
    document,
    suggestedDocuments,
    generatedAt: new Date().toISOString()
  };
}

export async function submitPublicLegalAcknowledgementCore(input = {}) {
  const document = await getAcknowledgementPolicy(input);
  const payload = acknowledgementPayload(input, document);

  const existing = await restRequest({
    table: "document_acknowledgements",
    method: "GET",
    query: {
      select: "id,status,created_at,entity_id",
      entity_id: `eq.${document.policyId}`,
      "payload->>submissionId": `eq.${payload.submissionId}`,
      limit: "1"
    },
    prefer: ""
  });

  const prior = Array.isArray(existing) ? existing[0] : null;
  if (prior?.id) {
    return {
      ok: true,
      idempotent: true,
      acknowledgementId: prior.id,
      status: prior.status || "",
      submittedAt: prior.created_at || null,
      message: "This acknowledgement has already been recorded."
    };
  }

  const status = payload.decision === "approved"
    ? "ACKNOWLEDGED"
    : "NOT_ACKNOWLEDGED";

  const created = await restRequest({
    table: "document_acknowledgements",
    method: "POST",
    body: {
      title: `${document.title} — ${status === "ACKNOWLEDGED" ? "Acknowledged" : "Not acknowledged"}`,
      entity_id: document.policyId,
      member_id: null,
      status,
      body: payload.comment || "",
      file_url: null,
      active: true,
      payload
    },
    prefer: "return=representation"
  });

  const row = Array.isArray(created) ? created[0] : created;

  return {
    ok: true,
    idempotent: false,
    acknowledgementId: row?.id || "",
    status,
    submittedAt: row?.created_at || payload.signatureTimestamp,
    message:
      status === "ACKNOWLEDGED"
        ? "Your policy acknowledgement has been recorded."
        : "Your response has been recorded as not acknowledged."
  };
}
