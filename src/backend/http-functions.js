import {
  ok,
  notFound,
  serverError
} from "wix-http-functions";

import {
  sbSelect
} from "backend/supabaseClient";

const POLICY_TABLE = "legal_policies";
const DIRECT_TYPES = ["cookies", "privacy", "accessibility", "terms", "bookingTerms"];

function clean(value, max = 5000) {
  return String(value ?? "").trim().slice(0, max);
}

function normalizePublicType(value) {
  const raw = clean(value, 40);
  const compact = raw.toLowerCase().replace(/[\s_-]/g, "");

  if (!raw || compact === "custom" || compact === "library") {
    return "";
  }

  if (compact === "bookingterms") return "bookingTerms";

  return DIRECT_TYPES.find(
    (type) => type.toLowerCase() === compact
  ) || "";
}

function routeFor(row = {}) {
  const type = normalizePublicType(row.public_type);

  if (type) {
    return `/about/legal/policies?type=${encodeURIComponent(type)}`;
  }

  return `/about/legal/policies?slug=${encodeURIComponent(row.slug || "")}`;
}

function publicPolicy(row = {}) {
  return {
    _id: row.policy_id,
    policyId: row.policy_id,
    documentId: row.document_id,
    title: row.title || "Legal Document",
    slug: row.slug || "",
    scope: row.scope || "external",
    brand: row.brand || "SKANDI TRAVELS",
    publicType: row.public_type || "custom",
    status: row.status || "Published",
    category: row.category || "Legal",
    summary: row.summary || "",
    introductionHtml: row.introduction_html || "",
    sections: Array.isArray(row.sections) ? row.sections : [],
    toc: Array.isArray(row.toc) ? row.toc : [],
    bodyHtml: row.body_html || "",
    bodyPlainText: row.body_plain_text || "",
    effectiveDate: row.effective_date || "",
    reviewDate: row.review_date || "",
    owner: row.owner || "Legal / Compliance",
    approvedBySkId: row.approved_by_sk_id || "",
    approvedByName: row.approved_by_name || "",
    version: row.version || "1.0",
    acknowledgementRequired: row.acknowledgement_required === true,
    featured: row.featured === true,
    active: row.active !== false,
    sortOrder: Number(row.sort_order || 999),
    route: routeFor(row),
    createdAt: row.created_at || "",
    updatedAt: row.updated_at || "",
    publishedAt: row.published_at || ""
  };
}

function jsonResponse(payload) {
  return ok({
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "cache-control": "no-store, no-cache, must-revalidate, max-age=0"
    },
    body: JSON.stringify(payload)
  });
}

function jsonNotFound(payload) {
  return notFound({
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "cache-control": "no-store, no-cache, must-revalidate, max-age=0"
    },
    body: JSON.stringify(payload)
  });
}

function jsonServerError() {
  return serverError({
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "cache-control": "no-store, no-cache, must-revalidate, max-age=0"
    },
    body: JSON.stringify({
      ok: false,
      message: "Legal information is temporarily unavailable."
    })
  });
}

async function publishedExternalPolicies() {
  const rows = await sbSelect(
    POLICY_TABLE,
    "select=*&scope=eq.external&status=eq.Published&active=eq.true&order=sort_order.asc,title.asc"
  );

  return (Array.isArray(rows) ? rows : []).map(publicPolicy);
}

export async function get_legalHub() {
  try {
    const policies = await publishedExternalPolicies();

    const directPages = DIRECT_TYPES
      .map((type) =>
        policies.find((policy) => policy.publicType === type)
      )
      .filter(Boolean);

    return jsonResponse({
      ok: true,
      settings: {
        title: "Legal Information",
        subtitle: "Find SKANDI Travels public policies, terms, statements and legal notices."
      },
      directPages,
      policies,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("[legalHub]", error);
    return jsonServerError();
  }
}

export async function get_legalDocument(request) {
  try {
    const url = new URL(request.url);
    const type = normalizePublicType(url.searchParams.get("type") || "");
    const slug = clean(url.searchParams.get("slug") || "", 180)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const documentId = clean(url.searchParams.get("documentId") || "", 100).toLowerCase();
    const policyId = clean(url.searchParams.get("policyId") || "", 120).toLowerCase();

    const policies = await publishedExternalPolicies();

    const policy = policies.find((item) => {
      if (type) return item.publicType === type;
      if (slug) return String(item.slug || "").toLowerCase() === slug;
      if (documentId) return String(item.documentId || "").toLowerCase() === documentId;
      if (policyId) return String(item.policyId || "").toLowerCase() === policyId;
      return false;
    });

    if (!policy) {
      return jsonNotFound({
        ok: false,
        message: "This legal document is not published or is unavailable."
      });
    }

    return jsonResponse({
      ok: true,
      document: policy,
      viewerContext: "public",
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("[legalDocument]", error);
    return jsonServerError();
  }
}
