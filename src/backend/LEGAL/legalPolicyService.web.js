import { webMethod, Permissions } from "wix-web-module";
import { createHash } from "crypto";
import sanitizeHtml from "sanitize-html";
import {
  sbInsert,
  sbSelect,
  sbUpdate,
  eq
} from "backend/supabaseClient";
import { uid, nowIso } from "backend/core/response";
import { getStaffPortalSession } from "backend/RIA/staffPortalAuth.web";
import {
  buildAndStorePolicyPdf,
  getPolicyPdfDownloadUrl
} from "backend/LEGAL/policyPdfService";

const POLICY_TABLE = "legal_policies";
const REVISION_TABLE = "legal_policy_revisions";
const DIRECT_TYPES = ["cookies", "privacy", "accessibility", "terms", "bookingTerms"];
const SCOPES = new Set(["external", "internal"]);
const BRANDS = new Set(["SKANDI TRAVELS", "ALTEA"]);
const REVIEW_MODES = new Set(["none", "months", "custom"]);
const ADMIN_TOKENS = new Set([
  "super admin",
  "administrator",
  "legal admin",
  "content admin",
  "policy admin",
  "hr admin",
  "policy.control",
  "legal.manage",
  "content.manage"
]);

function cleanText(value, max = 5000) {
  return String(value ?? "").trim().slice(0, max);
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function boolValue(value, fallback = false) {
  if (value === true || value === "true" || value === 1 || value === "1") return true;
  if (value === false || value === "false" || value === 0 || value === "0") return false;
  return fallback;
}

function numberValue(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeScope(value) {
  const normalized = cleanText(value, 20).toLowerCase();
  return SCOPES.has(normalized) ? normalized : "external";
}

function normalizeBrand(value) {
  const normalized = cleanText(value, 40).toUpperCase();
  return BRANDS.has(normalized) ? normalized : "SKANDI TRAVELS";
}

function normalizeReviewMode(value) {
  const normalized = cleanText(value, 20).toLowerCase();
  return REVIEW_MODES.has(normalized) ? normalized : "none";
}

function slugify(value) {
  return cleanText(value, 180)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function normalizePublicType(value) {
  const raw = String(value || "").trim();
  const compact = raw.toLowerCase().replace(/[\s_-]/g, "");
  if (!raw || compact === "custom" || compact === "library") return "";
  if (compact === "bookingterms") return "bookingTerms";
  return DIRECT_TYPES.find((type) => type.toLowerCase() === compact) || "";
}

function sanitizeRichHtml(value) {
  return sanitizeHtml(String(value || ""), {
    allowedTags: [
      "p", "br", "strong", "b", "em", "i", "u", "s",
      "ul", "ol", "li", "a", "blockquote",
      "table", "thead", "tbody", "tr", "th", "td"
    ],
    allowedAttributes: {
      a: ["href", "target", "rel", "data-policy-slug", "data-policy-scope"],
      td: ["colspan", "rowspan"],
      th: ["colspan", "rowspan"]
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowProtocolRelative: false,
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: {
          ...attribs,
          target: "_top",
          rel: "noopener noreferrer"
        }
      })
    }
  });
}

function htmlToPlain(value) {
  return cleanText(
    String(value || "")
      .replace(/<br\s*\/?\s*>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<\/li>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/\s+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]{2,}/g, " "),
    100000
  );
}

function sanitizeSections(input, depth = 0) {
  if (depth > 3) return [];
  return safeArray(input).slice(0, 150).map((item) => ({
    id: cleanText(item?.id, 80) || uid("SEC"),
    title: cleanText(item?.title, 300) || "Untitled Section",
    bodyHtml: sanitizeRichHtml(item?.bodyHtml || item?.body_html || ""),
    children: sanitizeSections(item?.children, depth + 1)
  }));
}

function flattenSections(items = [], prefix = []) {
  const output = [];
  safeArray(items).forEach((item, index) => {
    const path = [...prefix, index + 1];
    const number = path.join(".");
    output.push({
      id: item.id,
      number,
      label: path.length === 1 ? `${number}.` : number,
      title: item.title,
      bodyHtml: item.bodyHtml,
      depth: path.length - 1,
      anchor: `section-${number.replace(/\./g, "-")}`
    });
    output.push(...flattenSections(item.children || [], path));
  });
  return output;
}

function buildDocumentHtml(introductionHtml, sections) {
  const flat = flattenSections(sections);
  const sectionsHtml = flat.map((item) => {
    const headingLevel = Math.min(6, 2 + item.depth);
    return `<section id="${item.anchor}" data-section-number="${item.number}"><h${headingLevel}><span class="section-number">${item.label}</span> ${item.title}</h${headingLevel}>${item.bodyHtml}</section>`;
  }).join("");
  return {
    bodyHtml: `${introductionHtml || ""}${sectionsHtml}`,
    bodyPlainText: `${htmlToPlain(introductionHtml)}\n\n${flat.map((item) => `${item.label} ${item.title}\n${htmlToPlain(item.bodyHtml)}`).join("\n\n")}`.trim(),
    toc: flat.map(({ id, number, label, title, depth, anchor }) => ({ id, number, label, title, depth, anchor }))
  };
}

function canonicalHash(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function bumpVersion(value) {
  const parts = cleanText(value || "1.0", 30).split(".");
  const major = Number.parseInt(parts[0], 10);
  const minor = Number.parseInt(parts[1] || "0", 10);
  if (Number.isFinite(major) && Number.isFinite(minor)) return `${major}.${minor + 1}`;
  return "1.1";
}

function addMonths(dateValue, months) {
  if (!dateValue || !months) return null;
  const date = new Date(`${String(dateValue).slice(0, 10)}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  date.setUTCMonth(date.getUTCMonth() + months);
  return date.toISOString().slice(0, 10);
}

function calculateReviewDate(policy) {
  const mode = normalizeReviewMode(policy.reviewMode || policy.review_mode);
  if (mode === "none") return null;
  if (mode === "custom") return policy.reviewDate || policy.review_date || null;
  const months = Math.max(1, numberValue(policy.reviewIntervalMonths || policy.review_interval_months, 12));
  return addMonths(policy.effectiveDate || policy.effective_date, months);
}

function reviewStatus(reviewDate) {
  if (!reviewDate) return { state: "none", daysRemaining: null, label: "No review" };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(`${String(reviewDate).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return { state: "none", daysRemaining: null, label: "No review" };
  const days = Math.ceil((date.getTime() - today.getTime()) / 86400000);
  if (days < 0) return { state: "overdue", daysRemaining: days, label: `Overdue by ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"}` };
  if (days <= 31) return { state: "dueSoon", daysRemaining: days, label: `Review in ${days} day${days === 1 ? "" : "s"}` };
  return { state: "scheduled", daysRemaining: days, label: `Review in ${days} days` };
}

function normalizeProfile(session = {}) {
  const source = session.profile || session.staff || session.user || session.data?.profile || {};
  const firstName = cleanText(source.firstName || source.first_name, 80);
  const lastName = cleanText(source.lastName || source.last_name, 80);
  const name = cleanText(source.name || source.displayName || source.display_name || [firstName, lastName].filter(Boolean).join(" ") || source.email, 160);
  const skId = cleanText(source.skId || source.skID || source.sk_id || source.employeeId || source.employee_id, 40).toUpperCase();
  return {
    ...source,
    name,
    skId,
    role: cleanText(source.role || source.position || source.jobTitle || source.job_title, 120),
    department: cleanText(source.department, 120),
    base: cleanText(source.base || source.station, 80),
    photo: source.photo || source.imageUrl || source.image_url || source.profilePhoto || ""
  };
}

function tokensFrom(value, output = []) {
  if (!value) return output;
  if (Array.isArray(value)) {
    value.forEach((item) => tokensFrom(item, output));
    return output;
  }
  if (typeof value === "object") {
    Object.entries(value).forEach(([key, enabled]) => {
      if (enabled === true) output.push(String(key).toLowerCase());
      else tokensFrom(enabled, output);
    });
    return output;
  }
  output.push(String(value).toLowerCase());
  return output;
}

async function requireStaff() {
  const session = await getStaffPortalSession();
  if (!session || session.ok === false) throw new Error("Staff authentication is required.");
  const profile = normalizeProfile(session);
  if (!profile.skId) throw new Error("A valid SK-ID is required.");
  return { session, profile };
}

async function requirePolicyAdmin() {
  const { session, profile } = await requireStaff();
  const tokens = tokensFrom([
    profile.role,
    profile.roles,
    profile.permission,
    profile.permissions,
    profile.access,
    profile.accessRoles,
    profile.dutyCode,
    session.permissions,
    session.roles
  ]);
  const allowed = Boolean(
    profile.isSuperAdmin ||
    profile.superAdmin ||
    session.isSuperAdmin ||
    tokens.some((token) => ADMIN_TOKENS.has(token.trim()))
  );
  if (!allowed) throw new Error("Policy Control permission is required.");
  return profile;
}

function routeFor(policy = {}) {
  const scope = normalizeScope(policy.scope);
  if (scope === "internal") {
    return `/riaintra/success-factors/legal-internal/policies-internal?slug=${encodeURIComponent(policy.slug || "")}`;
  }
  const type = normalizePublicType(policy.public_type || policy.publicType);
  if (type) return `/about/legal/policies?type=${encodeURIComponent(type)}`;
  return `/about/legal/policies?slug=${encodeURIComponent(policy.slug || "")}`;
}

function dbToPolicy(row = {}) {
  const policy = {
    _id: row.policy_id,
    policyId: row.policy_id,
    documentId: row.document_id,
    title: row.title,
    slug: row.slug,
    scope: row.scope,
    brand: row.brand,
    internalUseOnly: row.scope === "internal",
    publicType: row.public_type || "custom",
    status: row.status,
    category: row.category,
    summary: row.summary,
    introductionHtml: row.introduction_html,
    sections: row.sections || [],
    toc: row.toc || [],
    bodyHtml: row.body_html,
    bodyPlainText: row.body_plain_text,
    effectiveDate: row.effective_date,
    reviewMode: row.review_mode,
    reviewIntervalMonths: row.review_interval_months,
    reviewDate: row.review_date,
    owner: row.owner,
    approvedBySkId: row.approved_by_sk_id,
    approvedByName: row.approved_by_name,
    version: row.version,
    pdfFileUrl: row.pdf_file_url,
    pdfFileName: row.pdf_file_name,
    pdfGeneratedAt: row.pdf_generated_at,
    pdfStatus: row.pdf_status,
    pdfError: row.pdf_error,
    sourcePdfName: row.source_pdf_name,
    acknowledgementRequired: row.acknowledgement_required,
    featured: row.featured,
    active: row.active,
    sortOrder: row.sort_order,
    route: routeFor(row),
    createdAt: row.created_at,
    createdBySkId: row.created_by_sk_id,
    createdByName: row.created_by_name,
    updatedAt: row.updated_at,
    updatedBySkId: row.updated_by_sk_id,
    updatedByName: row.updated_by_name,
    publishedAt: row.published_at,
    deletedAt: row.deleted_at,
    deletedBySkId: row.deleted_by_sk_id,
    deletedByName: row.deleted_by_name
  };
  policy.review = reviewStatus(policy.reviewDate);
  return policy;
}

async function addDownloadUrl(policy) {
  if (!policy?.pdfFileUrl) return { ...policy, pdfUrl: "" };
  try {
    return {
      ...policy,
      pdfUrl: await getPolicyPdfDownloadUrl(policy.pdfFileUrl, policy.pdfFileName)
    };
  } catch (_) {
    return { ...policy, pdfUrl: "" };
  }
}

function toDatabase(source = {}, profile = {}, existing = null) {
  const title = cleanText(source.title, 240);
  const documentId = cleanText(source.documentId || source.document_id, 80).toUpperCase();
  const slug = slugify(source.slug || title || documentId);
  const scope = normalizeScope(source.scope);
  const brand = normalizeBrand(source.brand);
  const publicType = scope === "external" ? normalizePublicType(source.publicType || source.public_type) : "";
  const introductionHtml = sanitizeRichHtml(source.introductionHtml || source.introduction_html || "");
  const sections = sanitizeSections(source.sections);
  const generated = buildDocumentHtml(introductionHtml, sections);
  const reviewMode = normalizeReviewMode(source.reviewMode || source.review_mode);
  const reviewIntervalMonths = reviewMode === "months"
    ? Math.max(1, numberValue(source.reviewIntervalMonths || source.review_interval_months, 12))
    : null;
  const reviewDate = calculateReviewDate({ ...source, reviewMode, reviewIntervalMonths });
  const now = nowIso();

  if (!title) throw new Error("Policy Name is required.");
  if (!documentId) throw new Error("Document ID is required.");
  if (!slug) throw new Error("Slug is required.");
  if (!source.effectiveDate && !source.effective_date) throw new Error("Effective Date is required.");
  if (!sections.length) throw new Error("Add at least one numbered section.");

  const hashPayload = {
    title,
    documentId,
    slug,
    scope,
    brand,
    publicType,
    category: cleanText(source.category || "Legal", 100),
    summary: cleanText(source.summary, 2000),
    introductionHtml,
    sections,
    effectiveDate: source.effectiveDate || source.effective_date,
    reviewMode,
    reviewIntervalMonths,
    reviewDate,
    owner: cleanText(source.owner || "Legal / Compliance", 200),
    acknowledgementRequired: boolValue(source.acknowledgementRequired, false)
  };
  const contentHash = canonicalHash(hashPayload);
  const contentChanged = Boolean(existing && existing.content_hash !== contentHash);
  const version = existing
    ? (contentChanged ? bumpVersion(existing.version) : existing.version)
    : "1.0";

  return {
    policy_id: existing?.policy_id || source._id || source.policyId || uid("POL"),
    document_id: documentId,
    title,
    slug,
    scope,
    brand,
    public_type: publicType || null,
    status: cleanText(source.status || existing?.status || "Draft", 30),
    category: cleanText(source.category || "Legal", 100),
    summary: cleanText(source.summary, 2000),
    introduction_html: introductionHtml,
    sections,
    toc: generated.toc,
    body_html: generated.bodyHtml,
    body_plain_text: generated.bodyPlainText,
    effective_date: source.effectiveDate || source.effective_date || null,
    review_mode: reviewMode,
    review_interval_months: reviewIntervalMonths,
    review_date: reviewDate,
    owner: cleanText(source.owner || "Legal / Compliance", 200),
    approved_by_sk_id: profile.skId || null,
    approved_by_name: profile.name || null,
    version,
    content_hash: contentHash,
    pdf_file_url: contentChanged ? null : existing?.pdf_file_url || null,
    pdf_file_name: contentChanged ? null : existing?.pdf_file_name || null,
    pdf_generated_at: contentChanged ? null : existing?.pdf_generated_at || null,
    pdf_status: contentChanged || !existing ? "pending" : existing?.pdf_status || "pending",
    pdf_error: null,
    source_pdf_name: cleanText(source.sourcePdfName || source.source_pdf_name || existing?.source_pdf_name, 240) || null,
    acknowledgement_required: boolValue(source.acknowledgementRequired, false),
    featured: boolValue(source.featured, false),
    active: boolValue(source.active, existing?.active || false),
    sort_order: numberValue(source.sortOrder, existing?.sort_order || 999),
    created_at: existing?.created_at || now,
    created_by_sk_id: existing?.created_by_sk_id || profile.skId || null,
    created_by_name: existing?.created_by_name || profile.name || null,
    updated_at: now,
    updated_by_sk_id: profile.skId || null,
    updated_by_name: profile.name || null,
    published_at: existing?.published_at || null,
    deleted_at: existing?.deleted_at || null,
    deleted_by_sk_id: existing?.deleted_by_sk_id || null,
    deleted_by_name: existing?.deleted_by_name || null,
    _contentChanged: contentChanged
  };
}

function snapshotForHistory(row = {}) {
  const copy = { ...row };
  delete copy._contentChanged;
  return copy;
}

function changedFields(previous, next) {
  if (!previous) return ["created"];
  const fields = [
    "document_id", "title", "slug", "scope", "brand", "public_type", "status",
    "category", "summary", "introduction_html", "sections", "effective_date",
    "review_mode", "review_interval_months", "review_date", "owner",
    "acknowledgement_required", "featured", "active", "sort_order",
    "deleted_at", "deleted_by_sk_id"
  ];
  return fields.filter((field) => JSON.stringify(previous[field] ?? null) !== JSON.stringify(next[field] ?? null));
}

async function saveRevision({ previous = null, next, profile, action = "Updated", summary = "" }) {
  await sbInsert(REVISION_TABLE, {
    revision_id: uid("REV"),
    policy_id: next.policy_id,
    action,
    version_from: previous?.version || null,
    version_to: next.version || null,
    change_summary: cleanText(summary || `${action} by ${profile.skId}.`, 1200),
    changed_fields: changedFields(previous, next),
    previous_snapshot: previous ? snapshotForHistory(previous) : null,
    snapshot: snapshotForHistory(next),
    created_at: nowIso(),
    created_by_sk_id: profile.skId || null,
    created_by_name: profile.name || null
  });
}

async function selectAllPolicies() {
  return (await sbSelect(POLICY_TABLE, "select=*&order=sort_order.asc&order=updated_at.desc")) || [];
}

async function findPolicyById(id) {
  const rows = await sbSelect(POLICY_TABLE, `select=*&${eq("policy_id", id)}&limit=1`);
  return rows?.[0] || null;
}

async function ensureUnique(record, currentId = "") {
  const rows = await selectAllPolicies();
  const conflict = rows.find((row) => {
    if (row.policy_id === currentId) return false;
    if (String(row.document_id).toLowerCase() === String(record.document_id).toLowerCase()) return true;
    if (String(row.slug).toLowerCase() === String(record.slug).toLowerCase()) return true;
    return Boolean(record.scope === "external" && record.public_type && row.scope === "external" && row.public_type === record.public_type);
  });
  if (conflict) throw new Error("Document ID, slug, and external policy slot must be unique.");
}

async function generatePdfAndUpdate(row) {
  try {
    const result = await buildAndStorePolicyPdf(dbToPolicy(row));
    const updatedRows = await sbUpdate(POLICY_TABLE, eq("policy_id", row.policy_id), {
      pdf_file_url: result.fileUrl,
      pdf_file_name: result.fileName,
      pdf_generated_at: result.generatedAt,
      pdf_status: "ready",
      pdf_error: null
    });
    return { row: updatedRows?.[0] || { ...row, pdf_file_url: result.fileUrl, pdf_file_name: result.fileName, pdf_generated_at: result.generatedAt, pdf_status: "ready" }, warning: "" };
  } catch (error) {
    const message = cleanText(error?.message || "PDF generation failed.", 1000);
    const updatedRows = await sbUpdate(POLICY_TABLE, eq("policy_id", row.policy_id), {
      pdf_status: "error",
      pdf_error: message
    });
    return { row: updatedRows?.[0] || { ...row, pdf_status: "error", pdf_error: message }, warning: message };
  }
}

function filterPolicies(rows, input = {}) {
  const search = cleanText(input.search, 200).toLowerCase();
  const status = cleanText(input.status, 40);
  const scope = cleanText(input.scope, 20);
  return rows.map(dbToPolicy).filter((policy) => {
    if (status && status !== "all" && policy.status !== status) return false;
    if (scope && scope !== "all" && policy.scope !== scope) return false;
    if (!search) return true;
    return [policy.title, policy.documentId, policy.slug, policy.category, policy.brand, policy.summary]
      .join(" ").toLowerCase().includes(search);
  });
}

function reviewSummary(policies) {
  return policies.reduce((summary, policy) => {
    if (["Archived", "Deleted"].includes(policy.status)) return summary;
    if (policy.review.state === "dueSoon") summary.dueSoon += 1;
    if (policy.review.state === "overdue") summary.overdue += 1;
    return summary;
  }, { dueSoon: 0, overdue: 0 });
}

function inferPublicType(title) {
  const value = String(title || "").toLowerCase();
  if (value.includes("cookie")) return "cookies";
  if (value.includes("privacy")) return "privacy";
  if (value.includes("accessibility")) return "accessibility";
  if (value.includes("booking") && value.includes("term")) return "bookingTerms";
  if (value.includes("term")) return "terms";
  return "custom";
}

function paragraphHtml(lines) {
  const output = [];
  let list = [];
  const flushList = () => {
    if (!list.length) return;
    output.push(`<ul>${list.map((item) => `<li>${sanitizeHtml(item, { allowedTags: [] })}</li>`).join("")}</ul>`);
    list = [];
  };
  safeArray(lines).forEach((line) => {
    const value = cleanText(line, 5000);
    if (!value) {
      flushList();
      return;
    }
    if (/^[•●*-]\s*/.test(value)) {
      list.push(value.replace(/^[•●*-]\s*/, ""));
      return;
    }
    flushList();
    output.push(`<p>${sanitizeHtml(value, { allowedTags: [] })}</p>`);
  });
  flushList();
  return output.join("");
}

function parsePolicyText(text, fileName = "") {
  const rawLines = String(text || "")
    .replace(/\r/g, "")
    .replace(/[●•]/g, "•")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim());

  const lines = rawLines.filter((line) => {
    if (!line) return true;
    if (/^Issued to .+\| Version .+\|.+\| Page \d+ of \d+$/i.test(line)) return false;
    if (/^.+\| Effective Date:\s*.+$/i.test(line) && !/^Effective Date:/i.test(line)) return false;
    if (/^Page \d+ of \d+$/i.test(line)) return false;
    return true;
  });

  const joined = lines.join("\n");
  const effectiveMatch = joined.match(/Effective Date:\s*([A-Za-z]{3,9}\s+\d{1,2},\s+\d{4}|\d{4}-\d{2}-\d{2})/i);
  const versionMatches = [...joined.matchAll(/Version:\s*([0-9]+(?:\.[0-9]+)*)/gi)];
  const updatedByMatch = joined.match(/(?:Updated By|Approved By):\s*([A-Z]{2}\d{4,}|[A-Za-z0-9-]+)/i);
  const ownerMatch = joined.match(/Owner:\s*(.+)/i);
  const internal = /Internal Use Only/i.test(joined);
  const brand = /\bALTEA\b/i.test(joined) && !/SKANDI TRAVELS/i.test(joined) ? "ALTEA" : "SKANDI TRAVELS";

  const dateIso = (() => {
    if (!effectiveMatch) return "";
    const parsed = new Date(effectiveMatch[1]);
    return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
  })();

  const ignored = new Set(["Document Control"]);
  const title = lines.find((line) => {
    if (!line || ignored.has(line)) return false;
    if (/^(SKANDI|ALTEA|Effective Date:|Version:|Last Updated:|Updated By:|Owner:|Notes:)/i.test(line)) return false;
    if (/^\d+(?:\.\d+)*\.?\s+/.test(line) || /^[A-Z]\.\s+/.test(line)) return false;
    return /(Policy|Procedure|Terms|Statement|Notice|Standard|Guide)$/i.test(line);
  }) || cleanText(fileName.replace(/\.pdf$/i, "").replace(/[-_]+/g, " "), 240) || "Imported Policy";

  const roots = [];
  const stack = [];
  let current = null;
  let bodyLines = [];
  let introLines = [];
  let foundSection = false;

  const flushBody = () => {
    if (current) current.bodyHtml = paragraphHtml(bodyLines);
    bodyLines = [];
  };

  lines.forEach((line) => {
    if (!line) {
      if (current) bodyLines.push("");
      else if (!foundSection) introLines.push("");
      return;
    }
    if (line === title || /^Effective Date:/i.test(line)) return;
    if (/^(Document Control|Version:|Last Updated:|Updated By:|Approved By:|Owner:|Notes:)/i.test(line)) return;

    const numeric = line.match(/^(\d+(?:\.\d+)*)\.?\s+(.+)$/);
    const alpha = line.match(/^([A-Z])\.\s+(.+)$/);
    if (numeric || alpha) {
      flushBody();
      foundSection = true;
      const depth = numeric ? Math.min(3, numeric[1].split(".").length - 1) : 1;
      const section = {
        id: uid("SEC"),
        title: cleanText((numeric ? numeric[2] : alpha[2]), 300),
        bodyHtml: "",
        children: []
      };
      if (depth === 0 || !stack[depth - 1]) {
        roots.push(section);
      } else {
        stack[depth - 1].children.push(section);
      }
      stack[depth] = section;
      stack.splice(depth + 1);
      current = section;
      return;
    }

    if (foundSection && current) bodyLines.push(line);
    else introLines.push(line);
  });
  flushBody();

  if (!roots.length) {
    roots.push({
      id: uid("SEC"),
      title: "Imported Content",
      bodyHtml: paragraphHtml(lines.filter(Boolean)),
      children: []
    });
    introLines = [];
  }

  const introductionHtml = paragraphHtml(introLines);
  const summary = cleanText(htmlToPlain(introductionHtml).split(/\n\n/)[0], 500);
  return {
    title,
    documentId: cleanText(title.replace(/[^A-Za-z0-9]+/g, " ").split(" ").filter(Boolean).map((part) => part[0]).join("").slice(0, 12), 20).toUpperCase() || "POLICY",
    slug: slugify(title),
    scope: internal ? "internal" : "external",
    brand,
    publicType: internal ? "custom" : inferPublicType(title),
    effectiveDate: dateIso,
    reviewMode: "none",
    reviewIntervalMonths: 12,
    owner: cleanText(ownerMatch?.[1], 200) || "Legal / Compliance",
    approvedBySkId: cleanText(updatedByMatch?.[1], 40),
    version: versionMatches.length ? versionMatches[versionMatches.length - 1][1] : "1.0",
    summary,
    introductionHtml,
    sections: roots,
    sourcePdfName: cleanText(fileName, 240)
  };
}

export const getPublicLegalHub = webMethod(Permissions.Anyone, async () => {
  const rows = await sbSelect(
    POLICY_TABLE,
    "select=*&scope=eq.external&status=eq.Published&active=eq.true&order=sort_order.asc&order=title.asc"
  );
  const policies = (rows || []).map(dbToPolicy);
  const directPages = DIRECT_TYPES.map((type) => policies.find((policy) => policy.publicType === type)).filter(Boolean);
  return {
    ok: true,
    settings: {
      title: "Legal Information",
      subtitle: "Find SKANDI Travels public policies, terms, statements and legal notices."
    },
    directPages,
    policies
  };
});

export const getPublicLegalDocument = webMethod(Permissions.Anyone, async (input = {}) => {
  const type = normalizePublicType(input.type);
  const slug = slugify(input.slug || "");
  const rows = await sbSelect(
    POLICY_TABLE,
    "select=*&scope=eq.external&status=eq.Published&active=eq.true&order=updated_at.desc"
  );
  const row = (rows || []).find((item) => type ? item.public_type === type : slug ? item.slug === slug : false);
  if (!row) return { ok: false, message: "This legal document is not published or is unavailable." };
  return { ok: true, document: await addDownloadUrl(dbToPolicy(row)), viewerContext: "public" };
});

export const getInternalLegalHub = webMethod(Permissions.SiteMember, async () => {
  const { profile } = await requireStaff();
  const rows = await sbSelect(
    POLICY_TABLE,
    "select=*&scope=eq.internal&status=eq.Published&active=eq.true&order=sort_order.asc&order=title.asc"
  );
  return { ok: true, profile, policies: (rows || []).map(dbToPolicy) };
});

export const getInternalLegalDocument = webMethod(Permissions.SiteMember, async (input = {}) => {
  const { profile } = await requireStaff();
  const slug = slugify(input.slug || "");
  if (!slug) return { ok: false, message: "A policy slug is required." };
  const rows = await sbSelect(
    POLICY_TABLE,
    `select=*&scope=eq.internal&status=eq.Published&active=eq.true&${eq("slug", slug)}&limit=1`
  );
  const row = rows?.[0];
  if (!row) return { ok: false, message: "This internal policy is not published or is unavailable." };
  return { ok: true, profile, document: await addDownloadUrl(dbToPolicy(row)), viewerContext: "internal" };
});

export const getPolicyAdminBootstrap = webMethod(Permissions.SiteMember, async () => {
  const profile = await requirePolicyAdmin();
  const policies = (await selectAllPolicies()).map(dbToPolicy);
  return { ok: true, profile, policies, reviewSummary: reviewSummary(policies) };
});

export const adminListLegalPolicies = webMethod(Permissions.SiteMember, async (input = {}) => {
  await requirePolicyAdmin();
  const policies = filterPolicies(await selectAllPolicies(), input);
  return { ok: true, policies, reviewSummary: reviewSummary(policies) };
});

export const adminGetLegalPolicy = webMethod(Permissions.SiteMember, async (input = {}) => {
  await requirePolicyAdmin();
  const row = await findPolicyById(cleanText(input._id || input.policyId, 100));
  if (!row) throw new Error("Policy not found.");
  const revisions = await sbSelect(
    REVISION_TABLE,
    `select=*&${eq("policy_id", row.policy_id)}&order=created_at.desc&limit=250`
  );
  return {
    ok: true,
    policy: await addDownloadUrl(dbToPolicy(row)),
    revisions: (revisions || []).map((revision) => ({
      _id: revision.revision_id,
      action: revision.action,
      versionFrom: revision.version_from,
      versionTo: revision.version_to,
      changeSummary: revision.change_summary,
      changedFields: revision.changed_fields || [],
      createdAt: revision.created_at,
      createdBySkId: revision.created_by_sk_id,
      createdByName: revision.created_by_name
    }))
  };
});

export const adminSaveLegalPolicy = webMethod(Permissions.SiteMember, async (input = {}) => {
  const profile = await requirePolicyAdmin();
  const source = input.policy || {};
  const id = cleanText(source._id || source.policyId, 100);
  const existing = id ? await findPolicyById(id) : null;
  const record = toDatabase(source, profile, existing);
  const contentChanged = record._contentChanged;
  delete record._contentChanged;
  await ensureUnique(record, existing?.policy_id || "");

  let saved;
  if (existing) {
    const rows = await sbUpdate(POLICY_TABLE, eq("policy_id", existing.policy_id), record);
    saved = rows?.[0] || record;
    await saveRevision({
      previous: existing,
      next: saved,
      profile,
      action: contentChanged ? "Content updated" : "Metadata saved",
      summary: input.changeSummary || (contentChanged ? "Policy content changed and version advanced automatically." : "Policy saved without a version change.")
    });
  } else {
    const rows = await sbInsert(POLICY_TABLE, record);
    saved = rows?.[0] || record;
    await saveRevision({ previous: null, next: saved, profile, action: "Created", summary: input.changeSummary || "Policy created." });
  }

  const pdfResult = await generatePdfAndUpdate(saved);
  return {
    ok: true,
    policy: await addDownloadUrl(dbToPolicy(pdfResult.row)),
    message: existing ? "Policy saved." : "Policy created.",
    pdfWarning: pdfResult.warning
  };
});

export const adminPublishLegalPolicy = webMethod(Permissions.SiteMember, async (input = {}) => {
  const profile = await requirePolicyAdmin();
  const id = cleanText(input._id || input.policyId, 100);
  const existing = await findPolicyById(id);
  if (!existing) throw new Error("Policy not found.");
  if (!safeArray(existing.sections).length) throw new Error("Add at least one section before publishing.");

  const rows = await sbUpdate(POLICY_TABLE, eq("policy_id", id), {
    status: "Published",
    active: true,
    approved_by_sk_id: profile.skId,
    approved_by_name: profile.name,
    published_at: nowIso(),
    updated_at: nowIso(),
    updated_by_sk_id: profile.skId,
    updated_by_name: profile.name,
    pdf_status: "pending",
    pdf_error: null
  });
  const saved = rows?.[0] || { ...existing, status: "Published", active: true, approved_by_sk_id: profile.skId, approved_by_name: profile.name };
  await saveRevision({ previous: existing, next: saved, profile, action: "Published", summary: input.changeSummary || "Policy published." });
  const pdfResult = await generatePdfAndUpdate(saved);
  return {
    ok: true,
    policy: await addDownloadUrl(dbToPolicy(pdfResult.row)),
    message: "Policy published.",
    pdfWarning: pdfResult.warning
  };
});

export const adminArchiveLegalPolicy = webMethod(Permissions.SiteMember, async (input = {}) => {
  const profile = await requirePolicyAdmin();
  const id = cleanText(input._id || input.policyId, 100);
  const existing = await findPolicyById(id);
  if (!existing) throw new Error("Policy not found.");
  const rows = await sbUpdate(POLICY_TABLE, eq("policy_id", id), {
    status: "Archived",
    active: false,
    updated_at: nowIso(),
    updated_by_sk_id: profile.skId,
    updated_by_name: profile.name
  });
  const saved = rows?.[0] || { ...existing, status: "Archived", active: false };
  await saveRevision({ previous: existing, next: saved, profile, action: "Archived", summary: input.changeSummary || "Policy archived." });
  return { ok: true, policy: await addDownloadUrl(dbToPolicy(saved)), message: "Policy archived." };
});

export const adminDeleteLegalPolicy = webMethod(Permissions.SiteMember, async (input = {}) => {
  const profile = await requirePolicyAdmin();
  const id = cleanText(input._id || input.policyId, 100);
  if (!id) throw new Error("Policy ID is required.");
  const existing = await findPolicyById(id);
  if (!existing) throw new Error("Policy not found.");
  const rows = await sbUpdate(POLICY_TABLE, eq("policy_id", id), {
    status: "Deleted",
    active: false,
    public_type: null,
    deleted_at: nowIso(),
    deleted_by_sk_id: profile.skId,
    deleted_by_name: profile.name,
    updated_at: nowIso(),
    updated_by_sk_id: profile.skId,
    updated_by_name: profile.name
  });
  const saved = rows?.[0] || {
    ...existing,
    status: "Deleted",
    active: false,
    public_type: null,
    deleted_at: nowIso(),
    deleted_by_sk_id: profile.skId,
    deleted_by_name: profile.name
  };
  await saveRevision({
    previous: existing,
    next: saved,
    profile,
    action: "Deleted",
    summary: input.changeSummary || "Policy removed from use. The record and full audit history were retained."
  });
  const policies = (await selectAllPolicies()).map(dbToPolicy);
  return {
    ok: true,
    policies,
    reviewSummary: reviewSummary(policies.filter((policy) => policy.status !== "Deleted")),
    message: "Policy deleted from use. Audit history retained."
  };
});

export const adminRegenerateLegalPolicyPdf = webMethod(Permissions.SiteMember, async (input = {}) => {
  const profile = await requirePolicyAdmin();
  const id = cleanText(input._id || input.policyId, 100);
  const existing = await findPolicyById(id);
  if (!existing) throw new Error("Policy not found.");
  const result = await generatePdfAndUpdate(existing);
  await saveRevision({ previous: existing, next: result.row, profile, action: "PDF regenerated", summary: input.changeSummary || "Standard letter-size PDF regenerated." });
  return {
    ok: true,
    policy: await addDownloadUrl(dbToPolicy(result.row)),
    message: result.warning ? "Policy PDF generation failed." : "Policy PDF regenerated.",
    pdfWarning: result.warning
  };
});

export const adminParseLegalPolicyPdfText = webMethod(Permissions.SiteMember, async (input = {}) => {
  await requirePolicyAdmin();
  const text = cleanText(input.text, 250000);
  if (!text) throw new Error("The uploaded PDF did not contain readable text.");
  return {
    ok: true,
    prefill: parsePolicyText(text, cleanText(input.fileName, 240)),
    message: "PDF text analyzed. Review all imported fields before saving."
  };
});
