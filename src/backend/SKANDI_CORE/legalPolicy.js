// /src/backend/SKANDI_CORE/legalPolicy.js
// SKANDI Legal — B-011.1 canonical public legal-content core.
//
// Public Legal reads only published, active, external policies from the
// canonical Supabase legal_policies table. Policy Control is the editorial
// owner of those records; this module is the public-safe read projection.
//
// No browser Supabase access, no HTTP-function bypass, no parallel registry.

import { restRequest } from "backend/SKANDI_CORE/supabaseServer";
import { SITE_MAP } from "public/siteMap";

export const LEGAL_POLICY_VERSION = "B-011.1";

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

export async function getPublicLegalHubCore() {
  const rows = await restRequest({
    table: "legal_policies",
    method: "GET",
    query: {
      select: "policy_id,document_id,title,slug,scope,brand,public_type,status,category,summary,effective_date,version,pdf_file_url,pdf_file_name,featured,active,sort_order,published_at,updated_at,deleted_at",
      scope: "eq.external",
      status: "eq.Published",
      active: "eq.true",
      deleted_at: "is.null",
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
