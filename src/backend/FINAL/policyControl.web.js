import { webMethod, Permissions } from "wix-web-module";
import { currentMember } from "wix-members-backend";
import { secrets } from "wix-secrets-backend.v2";
import { elevate } from "wix-auth";
import { fetch } from "wix-fetch";

const POLICY_TABLE = "legal_policies";
const REVISION_TABLE = "legal_policy_revisions";
const AGENT_TABLE = "agent_users";
const PDF_BUCKET = "docunet-controlled";
const PDF_SIGN_SECONDS = 15 * 60;

const POLICY_STATUSES = new Set([
  "Draft",
  "In Review",
  "Approved",
  "Published",
  "Archived",
  "Superseded",
  "Deleted"
]);
const POLICY_SCOPES = new Set(["external", "internal"]);
const POLICY_BRANDS = new Set(["SKANDI TRAVELS", "ALTEA"]);
const REVIEW_MODES = new Set(["none", "months", "custom"]);
const PUBLIC_TYPES = new Set(["cookies", "privacy", "accessibility", "terms", "bookingTerms"]);

const ADMIN_ROLE_NAMES = new Set([
  "admin",
  "administrator",
  "site owner",
  "company owner",
  "super admin",
  "system admin",
  "policy control",
  "policy admin",
  "policy manager",
  "legal admin",
  "content admin",
  "hr admin",
  "hr manager",
  "operations admin",
  "destination controller"
]);

const elevatedGetSecretValue = elevate(secrets.getSecretValue);
let configPromise = null;

function clean(value, max = 5000) {
  return String(value ?? "").trim().slice(0, max);
}
function lower(value, max = 5000) {
  return clean(value, max).toLowerCase();
}
function upper(value, max = 5000) {
  return clean(value, max).toUpperCase();
}
function bool(value, fallback = false) {
  if (value === true || value === "true" || value === 1 || value === "1") return true;
  if (value === false || value === "false" || value === 0 || value === "0") return false;
  return fallback;
}
function num(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
function arr(value) {
  return Array.isArray(value) ? value : [];
}
function first(rows) {
  return Array.isArray(rows) && rows.length ? rows[0] : null;
}
function nowIso() {
  return new Date().toISOString();
}
function uid(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`.toUpperCase();
}
function slugify(value) {
  return clean(value, 180)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}
function secretString(response) {
  if (typeof response === "string") return response.trim();
  return clean(
    response?.value ??
    response?.secretValue ??
    response?.secret?.value ??
    "",
    20000
  );
}
async function readSecret(name) {
  const result = await elevatedGetSecretValue(name);
  const value = secretString(result);
  if (!value) throw new Error(`WIX_SECRET_EMPTY_${name}`);
  return value;
}
async function getConfig() {
  if (configPromise) return configPromise;
  configPromise = (async () => {
    const baseUrl = (await readSecret("SUPABASE_URL")).replace(/\/+$/, "");
    let apiKey = "";
    try {
      apiKey = await readSecret("SUPABASE_SECRET_KEY");
    } catch (_) {
      apiKey = await readSecret("SUPABASE_SERVICE_ROLE_KEY");
    }
    if (!/^https:\/\/[^/]+\.supabase\.co$/i.test(baseUrl)) {
      throw new Error("SUPABASE_URL_INVALID");
    }
    if (!apiKey) throw new Error("SUPABASE_SERVER_KEY_MISSING");
    const keyType =
      apiKey.startsWith("sb_secret_")
        ? "modern-secret"
        : apiKey.startsWith("eyJ")
          ? "legacy-jwt"
          : "api-key";
    return { baseUrl, apiKey, keyType };
  })();

  try {
    return await configPromise;
  } catch (error) {
    configPromise = null;
    throw error;
  }
}
function headersFor(config, extra = {}) {
  const headers = {
    apikey: config.apiKey,
    Accept: "application/json",
    ...extra
  };
  if (config.keyType === "legacy-jwt") {
    headers.Authorization = `Bearer ${config.apiKey}`;
  }
  return headers;
}
function buildQuery(query = {}) {
  const parts = Object.entries(query)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  return parts.length ? `?${parts.join("&")}` : "";
}
async function dbRequest(table, {
  method = "GET",
  query = {},
  body,
  prefer = ""
} = {}) {
  if (![POLICY_TABLE, REVISION_TABLE, AGENT_TABLE].includes(table)) {
    throw new Error("POLICY_DB_TABLE_NOT_ALLOWED");
  }

  const config = await getConfig();
  const response = await fetch(
    `${config.baseUrl}/rest/v1/${table}${buildQuery(query)}`,
    {
      method,
      headers: headersFor(config, {
        "Content-Type": "application/json",
        ...(prefer ? { Prefer: prefer } : {})
      }),
      body: body === undefined ? undefined : JSON.stringify(body)
    }
  );

  const raw = await response.text();
  let payload = null;
  if (raw) {
    try {
      payload = JSON.parse(raw);
    } catch (_) {
      payload = raw;
    }
  }

  if (!response.ok) {
    const detail = clean(payload?.message || payload?.details || payload?.error || "", 240);
    const error = new Error(detail || `Policy database request failed (${response.status}).`);
    error.code = `POLICY_DB_HTTP_${response.status}`;
    throw error;
  }
  return payload;
}

function memberEmail(member = {}) {
  const emails = member?.contactDetails?.emails;
  const firstEmail = Array.isArray(emails) ? emails[0] : emails;
  return lower(
    member.loginEmail ||
    firstEmail ||
    member?.profile?.email ||
    member.email ||
    "",
    254
  );
}
function roleName(role = {}) {
  return lower(role.name || role.title || role.roleName || role._id || "", 120);
}
function payloadTokens(value, output = []) {
  if (value === null || value === undefined || value === "") return output;
  if (Array.isArray(value)) {
    value.forEach((item) => payloadTokens(item, output));
    return output;
  }
  if (typeof value === "object") {
    Object.entries(value).forEach(([key, item]) => {
      if (item === true) output.push(lower(key, 120));
      else payloadTokens(item, output);
    });
    return output;
  }
  output.push(lower(value, 200));
  return output;
}
async function findAgent(member) {
  const memberId = clean(member?._id || member?.id, 160);
  const email = memberEmail(member);
  const select = [
    "id","agent_id","member_id","wix_member_id","email","corporate_email_address",
    "sk_id","first_name","last_name","preferred_name","display_name","job_title",
    "department","station","base","active","status","employment_status",
    "portal_access","authorized","can_manage","payload"
  ].join(",");

  if (memberId) {
    let row = first(await dbRequest(AGENT_TABLE, {
      query: { select, wix_member_id: `eq.${memberId}`, limit: 1 }
    }));
    if (row) return row;
    row = first(await dbRequest(AGENT_TABLE, {
      query: { select, member_id: `eq.${memberId}`, limit: 1 }
    }));
    if (row) return row;
  }

  if (email) {
    let row = first(await dbRequest(AGENT_TABLE, {
      query: { select, corporate_email_address: `ilike.${email}`, limit: 1 }
    }));
    if (row) return row;
    row = first(await dbRequest(AGENT_TABLE, {
      query: { select, email: `ilike.${email}`, limit: 1 }
    }));
    if (row) return row;
  }

  return null;
}
function agentDisplayName(agent = {}) {
  return clean(
    agent.preferred_name ||
    agent.display_name ||
    [agent.first_name, agent.last_name].filter(Boolean).join(" ") ||
    agent.corporate_email_address ||
    agent.email ||
    agent.sk_id ||
    "Staff",
    180
  );
}
function blockedAgent(agent = {}) {
  const state = lower(agent.status || agent.employment_status, 80);
  return ["suspended", "terminated", "blocked", "inactive", "furloughed"].includes(state);
}
async function requirePolicyAdmin() {
  const member = await currentMember.getMember({ fieldsets: ["FULL"] }).catch(() => null);
  if (!member?._id) throw new Error("Staff sign-in is required.");

  const [agent, roles] = await Promise.all([
    findAgent(member),
    currentMember.getRoles().catch(() => [])
  ]);

  if (!agent) throw new Error("Your staff profile could not be found.");
  if (agent.active !== true || agent.portal_access !== true || agent.authorized !== true || blockedAgent(agent)) {
    throw new Error("Your staff profile is not authorized for RIAINTRA.");
  }

  const tokens = [
    ...arr(roles).map(roleName),
    lower(agent.job_title, 120),
    ...payloadTokens(agent.payload)
  ].filter(Boolean);

  const canManage = agent.can_manage === true;
  const roleAllowed = tokens.some((token) => {
    if (ADMIN_ROLE_NAMES.has(token)) return true;
    return (
      token === "all" ||
      token === "manage" ||
      token === "policy-control" ||
      token === "policy.control" ||
      token === "policy-admin" ||
      token === "policy-manager" ||
      token === "legal.manage" ||
      token === "content.manage"
    );
  });

  if (!canManage && !roleAllowed) {
    throw new Error("Policy Control permission is required.");
  }

  return {
    memberId: clean(member._id, 160),
    skId: upper(agent.sk_id, 40),
    name: agentDisplayName(agent),
    role: clean(agent.job_title || "", 120),
    department: clean(agent.department || "", 120),
    base: clean(agent.station || agent.base || "", 80),
    canManage: true
  };
}

function sanitizeHtml(value) {
  let html = String(value || "");
  html = html
    .replace(/<\s*(script|style|iframe|object|embed|form|input|button|textarea|select|meta|link|base)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<\s*(script|style|iframe|object|embed|form|input|button|textarea|select|meta|link|base)\b[^>]*\/?>/gi, "")
    .replace(/\son[a-z]+\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi, "")
    .replace(/\sstyle\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi, "")
    .replace(/javascript\s*:/gi, "");
  return html.slice(0, 200000);
}
function htmlToText(value) {
  return clean(
    String(value || "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<\/li>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/[ \t]{2,}/g, " ")
      .replace(/\n{3,}/g, "\n\n"),
    100000
  );
}
function sanitizeSections(items, depth = 0) {
  if (depth > 3) return [];
  return arr(items).slice(0, 150).map((item) => ({
    id: clean(item?.id, 80) || uid("SEC"),
    title: clean(item?.title, 300) || "Untitled Section",
    bodyHtml: sanitizeHtml(item?.bodyHtml || item?.body_html || ""),
    children: sanitizeSections(item?.children || [], depth + 1)
  }));
}
function flattenSections(items = [], prefix = []) {
  const output = [];
  arr(items).forEach((item, index) => {
    const path = [...prefix, index + 1];
    const number = path.join(".");
    const entry = {
      id: item.id,
      number,
      label: path.length === 1 ? `${number}.` : number,
      depth: path.length - 1,
      anchor: `section-${number.replace(/\./g, "-")}`,
      title: item.title,
      bodyHtml: item.bodyHtml
    };
    output.push(entry);
    output.push(...flattenSections(item.children || [], path));
  });
  return output;
}
function buildDocument(introductionHtml, sections) {
  const flat = flattenSections(sections);
  const body = [
    introductionHtml || "",
    ...flat.map((item) => {
      const h = Math.min(6, 2 + item.depth);
      return `<section id="${item.anchor}"><h${h}>${item.label} ${item.title}</h${h}>${item.bodyHtml}</section>`;
    })
  ].join("");
  return {
    toc: flat.map(({ id, number, label, depth, anchor, title }) => ({
      id, number, label, depth, anchor, title
    })),
    bodyHtml: body,
    bodyPlainText: [
      htmlToText(introductionHtml),
      ...flat.map((item) => `${item.label} ${item.title}\n${htmlToText(item.bodyHtml)}`)
    ].filter(Boolean).join("\n\n")
  };
}
function simpleHash(value) {
  const text = JSON.stringify(value);
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}
function bumpVersion(value) {
  const match = /^(\d+)(?:\.(\d+))?$/.exec(clean(value || "1.0", 30));
  if (!match) return "1.1";
  return `${Number(match[1])}.${Number(match[2] || 0) + 1}`;
}
function addMonths(dateValue, months) {
  if (!dateValue || !months) return null;
  const d = new Date(`${String(dateValue).slice(0, 10)}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  d.setUTCMonth(d.getUTCMonth() + Number(months));
  return d.toISOString().slice(0, 10);
}
function normalizeReviewMode(value) {
  const mode = lower(value, 20);
  return REVIEW_MODES.has(mode) ? mode : "none";
}
function reviewDateFor(source) {
  const mode = normalizeReviewMode(source.reviewMode || source.review_mode);
  if (mode === "none") return null;
  if (mode === "custom") return clean(source.reviewDate || source.review_date, 10) || null;
  const months = Math.max(1, num(source.reviewIntervalMonths || source.review_interval_months, 12));
  return addMonths(source.effectiveDate || source.effective_date, months);
}
function reviewInfo(reviewDate) {
  if (!reviewDate) return { state: "none", daysRemaining: null, label: "No review" };
  const target = new Date(`${String(reviewDate).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(target.getTime())) return { state: "none", daysRemaining: null, label: "No review" };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.ceil((target.getTime() - today.getTime()) / 86400000);
  if (days < 0) return { state: "overdue", daysRemaining: days, label: `Overdue by ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"}` };
  if (days <= 31) return { state: "dueSoon", daysRemaining: days, label: `Review in ${days} day${days === 1 ? "" : "s"}` };
  return { state: "scheduled", daysRemaining: days, label: `Review in ${days} days` };
}
function normalizeStatus(value, fallback = "Draft") {
  const status = clean(value || fallback, 30);
  return POLICY_STATUSES.has(status) ? status : fallback;
}
function normalizeScope(value) {
  const scope = lower(value, 20);
  return POLICY_SCOPES.has(scope) ? scope : "external";
}
function normalizeBrand(value) {
  const brand = upper(value, 40);
  return POLICY_BRANDS.has(brand) ? brand : "SKANDI TRAVELS";
}
function normalizePublicType(value) {
  const compact = lower(value, 40).replace(/[\s_-]/g, "");
  if (!compact || compact === "custom" || compact === "library") return null;
  if (compact === "bookingterms") return "bookingTerms";
  for (const type of PUBLIC_TYPES) {
    if (type.toLowerCase() === compact) return type;
  }
  return null;
}
function routeFor(row = {}) {
  if (row.scope === "internal") {
    return `/riaintra/success-factors/legal-internal/policies-internal?slug=${encodeURIComponent(row.slug || "")}`;
  }
  if (row.public_type) {
    return `/about/legal/policies?type=${encodeURIComponent(row.public_type)}`;
  }
  return `/about/legal/policies?slug=${encodeURIComponent(row.slug || "")}`;
}
function mapPolicy(row = {}) {
  const policy = {
    _id: row.policy_id,
    policyId: row.policy_id,
    documentId: row.document_id,
    title: row.title,
    slug: row.slug,
    scope: row.scope,
    brand: row.brand,
    publicType: row.public_type || "custom",
    status: row.status,
    category: row.category,
    summary: row.summary,
    introductionHtml: row.introduction_html,
    sections: arr(row.sections),
    toc: arr(row.toc),
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
    acknowledgementRequired: row.acknowledgement_required === true,
    featured: row.featured === true,
    active: row.active === true,
    sortOrder: num(row.sort_order, 999),
    pdfFileUrl: row.pdf_file_url || "",
    pdfFileName: row.pdf_file_name || "",
    pdfGeneratedAt: row.pdf_generated_at || "",
    pdfStatus: row.pdf_status || "pending",
    pdfError: row.pdf_error || "",
    sourcePdfName: row.source_pdf_name || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedAt: row.published_at,
    deletedAt: row.deleted_at,
    route: routeFor(row)
  };
  policy.review = reviewInfo(policy.reviewDate);
  return policy;
}
function reviewSummary(policies) {
  return policies.reduce((summary, policy) => {
    if (["Archived", "Deleted"].includes(policy.status)) return summary;
    if (policy.review?.state === "dueSoon") summary.dueSoon += 1;
    if (policy.review?.state === "overdue") summary.overdue += 1;
    return summary;
  }, { dueSoon: 0, overdue: 0 });
}
async function allPolicyRows() {
  return (await dbRequest(POLICY_TABLE, {
    query: {
      select: "*",
      order: "sort_order.asc,updated_at.desc",
      limit: 1000
    }
  })) || [];
}
async function findPolicy(id) {
  if (!id) return null;
  return first(await dbRequest(POLICY_TABLE, {
    query: { select: "*", policy_id: `eq.${clean(id, 120)}`, limit: 1 }
  }));
}
async function assertUnique(record, currentId = "") {
  const rows = await allPolicyRows();
  const conflict = rows.find((row) => {
    if (row.policy_id === currentId) return false;
    if (lower(row.document_id) === lower(record.document_id)) return true;
    if (lower(row.slug) === lower(record.slug)) return true;
    return Boolean(
      record.scope === "external" &&
      record.public_type &&
      row.scope === "external" &&
      row.public_type === record.public_type &&
      row.status !== "Deleted"
    );
  });
  if (conflict) {
    throw new Error("Document ID, slug and external policy slot must be unique.");
  }
}
function changedFields(previous, next) {
  if (!previous) return ["created"];
  const fields = [
    "document_id","title","slug","scope","brand","public_type","status","category",
    "summary","introduction_html","sections","effective_date","review_mode",
    "review_interval_months","review_date","owner","acknowledgement_required",
    "featured","active","sort_order","pdf_status","deleted_at"
  ];
  return fields.filter((field) =>
    JSON.stringify(previous[field] ?? null) !== JSON.stringify(next[field] ?? null)
  );
}
function historySnapshot(row = {}) {
  const copy = { ...row };
  delete copy.body_plain_text;
  return copy;
}
async function saveRevision(previous, next, actor, action, summary) {
  await dbRequest(REVISION_TABLE, {
    method: "POST",
    prefer: "return=minimal",
    body: {
      revision_id: uid("REV"),
      policy_id: next.policy_id,
      action: clean(action || "Updated", 120),
      version_from: previous?.version || null,
      version_to: next.version || null,
      change_summary: clean(summary || `${action || "Updated"} by ${actor.skId}.`, 1200),
      changed_fields: changedFields(previous, next),
      previous_snapshot: previous ? historySnapshot(previous) : null,
      snapshot: historySnapshot(next),
      created_at: nowIso(),
      created_by_sk_id: actor.skId || null,
      created_by_name: actor.name || null
    }
  });
}
function toRecord(source = {}, actor, existing = null) {
  const title = clean(source.title, 240);
  const documentId = upper(source.documentId || source.document_id, 80);
  const slug = slugify(source.slug || title || documentId);
  const scope = normalizeScope(source.scope);
  const brand = normalizeBrand(source.brand);
  const publicType = scope === "external"
    ? normalizePublicType(source.publicType || source.public_type)
    : null;
  const effectiveDate = clean(source.effectiveDate || source.effective_date, 10);
  const reviewMode = normalizeReviewMode(source.reviewMode || source.review_mode);
  const reviewIntervalMonths = reviewMode === "months"
    ? Math.max(1, num(source.reviewIntervalMonths || source.review_interval_months, 12))
    : null;
  const reviewDate = reviewDateFor({
    ...source,
    effectiveDate,
    reviewMode,
    reviewIntervalMonths
  });
  const introductionHtml = sanitizeHtml(source.introductionHtml || source.introduction_html || "");
  const sections = sanitizeSections(source.sections || []);
  const generated = buildDocument(introductionHtml, sections);

  if (!title) throw new Error("Policy Name is required.");
  if (!documentId) throw new Error("Document ID is required.");
  if (!slug) throw new Error("Slug is required.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(effectiveDate)) throw new Error("A valid Effective Date is required.");
  if (!sections.length) throw new Error("Add at least one numbered section.");

  const hashPayload = {
    title, documentId, slug, scope, brand, publicType,
    category: clean(source.category || "Legal", 100),
    summary: clean(source.summary, 2000),
    introductionHtml, sections, effectiveDate,
    reviewMode, reviewIntervalMonths, reviewDate,
    owner: clean(source.owner || "Legal / Compliance", 200),
    acknowledgementRequired: bool(source.acknowledgementRequired, false)
  };
  const contentHash = simpleHash(hashPayload);
  const contentChanged = Boolean(existing && existing.content_hash !== contentHash);
  const version = existing
    ? (contentChanged ? bumpVersion(existing.version) : existing.version)
    : clean(source.version || "1.0", 30) || "1.0";

  return {
    policy_id: existing?.policy_id || clean(source._id || source.policyId, 120) || uid("POL"),
    document_id: documentId,
    title,
    slug,
    scope,
    brand,
    public_type: publicType,
    status: normalizeStatus(source.status, existing?.status || "Draft"),
    category: clean(source.category || "Legal", 100),
    summary: clean(source.summary, 2000),
    introduction_html: introductionHtml,
    sections,
    toc: generated.toc,
    body_html: generated.bodyHtml,
    body_plain_text: generated.bodyPlainText,
    effective_date: effectiveDate,
    review_mode: reviewMode,
    review_interval_months: reviewIntervalMonths,
    review_date: reviewDate,
    owner: clean(source.owner || "Legal / Compliance", 200),
    approved_by_sk_id: actor.skId || existing?.approved_by_sk_id || null,
    approved_by_name: actor.name || existing?.approved_by_name || null,
    version,
    content_hash: contentHash,
    pdf_file_url: existing?.pdf_file_url || null,
    pdf_file_name: existing?.pdf_file_name || null,
    pdf_generated_at: existing?.pdf_generated_at || null,
    pdf_status: contentChanged ? "pending" : (existing?.pdf_status || "pending"),
    pdf_error: contentChanged ? null : (existing?.pdf_error || null),
    source_pdf_name: clean(source.sourcePdfName || source.source_pdf_name || existing?.source_pdf_name || "", 300) || null,
    acknowledgement_required: bool(source.acknowledgementRequired, existing?.acknowledgement_required === true),
    featured: bool(source.featured, existing?.featured === true),
    active: existing ? existing.active === true : false,
    sort_order: Math.round(num(source.sortOrder, existing?.sort_order ?? 999)),
    created_at: existing?.created_at || nowIso(),
    created_by_sk_id: existing?.created_by_sk_id || actor.skId || null,
    created_by_name: existing?.created_by_name || actor.name || null,
    updated_at: nowIso(),
    updated_by_sk_id: actor.skId || null,
    updated_by_name: actor.name || null,
    published_at: existing?.published_at || null,
    deleted_at: existing?.deleted_at || null,
    deleted_by_sk_id: existing?.deleted_by_sk_id || null,
    deleted_by_name: existing?.deleted_by_name || null
  };
}

function pdfSafe(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[^\x20-\x7E\n]/g, "?")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}
function wrapText(text, width = 88) {
  const paragraphs = String(text || "").split(/\n+/);
  const output = [];
  paragraphs.forEach((paragraph) => {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);
    if (!words.length) {
      output.push("");
      return;
    }
    let line = "";
    words.forEach((word) => {
      const candidate = line ? `${line} ${word}` : word;
      if (candidate.length > width && line) {
        output.push(line);
        line = word;
      } else {
        line = candidate;
      }
    });
    if (line) output.push(line);
  });
  return output;
}
function buildSimplePdf(policy) {
  const lines = [
    policy.title || "SKANDI Policy",
    `Document ID: ${policy.documentId || ""}`,
    `Version: ${policy.version || ""}`,
    `Effective Date: ${policy.effectiveDate || ""}`,
    `Classification: ${policy.scope === "internal" ? "Internal Use Only" : "External Publication"}`,
    "",
    policy.summary || "",
    "",
    policy.bodyPlainText || ""
  ].flatMap((line) => wrapText(line, 88));

  const pages = [];
  for (let i = 0; i < lines.length; i += 48) pages.push(lines.slice(i, i + 48));
  if (!pages.length) pages.push([""]);

  const objects = [];
  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  const pageRefs = [];
  objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";

  pages.forEach((pageLines, index) => {
    const pageObj = 4 + index * 2;
    const contentObj = pageObj + 1;
    pageRefs.push(`${pageObj} 0 R`);
    const commands = [
      "BT",
      "/F1 10 Tf",
      "50 755 Td",
      "14 TL",
      ...pageLines.map((line) => `(${pdfSafe(line)}) Tj T*`),
      "ET"
    ].join("\n");
    objects[pageObj] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentObj} 0 R >>`;
    objects[contentObj] = `<< /Length ${commands.length} >>\nstream\n${commands}\nendstream`;
  });
  objects[2] = `<< /Type /Pages /Count ${pages.length} /Kids [${pageRefs.join(" ")}] >>`;

  let pdf = "%PDF-1.4\n%SKANDI\n";
  const offsets = [0];
  for (let i = 1; i < objects.length; i++) {
    offsets[i] = pdf.length;
    pdf += `${i} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let i = 1; i < objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return pdf;
}
function storageObjectPath(value) {
  return String(value || "").split("/").map(encodeURIComponent).join("/");
}
async function uploadPolicyPdf(row) {
  const config = await getConfig();
  const policy = mapPolicy(row);
  const pdf = buildSimplePdf(policy);
  const fileName = `${slugify(policy.documentId || policy.title || "policy")}-v${slugify(policy.version || "1-0")}.pdf`;
  const objectPath = `policies/${slugify(policy.documentId || row.policy_id)}/${Date.now()}-${fileName}`;
  const response = await fetch(
    `${config.baseUrl}/storage/v1/object/${encodeURIComponent(PDF_BUCKET)}/${storageObjectPath(objectPath)}`,
    {
      method: "POST",
      headers: headersFor(config, {
        "Content-Type": "application/pdf",
        "x-upsert": "true"
      }),
      body: pdf
    }
  );
  const raw = await response.text();
  if (!response.ok) {
    let detail = "";
    try {
      const parsed = JSON.parse(raw);
      detail = clean(parsed?.message || parsed?.error || "", 200);
    } catch (_) {}
    throw new Error(detail || `Policy PDF upload failed (${response.status}).`);
  }
  return {
    fileUrl: `supabase://${PDF_BUCKET}/${objectPath}`,
    fileName,
    generatedAt: nowIso()
  };
}
async function signStorageObject(bucket, objectPath, expiresIn = PDF_SIGN_SECONDS) {
  const config = await getConfig();
  const response = await fetch(
    `${config.baseUrl}/storage/v1/object/sign/${encodeURIComponent(bucket)}/${storageObjectPath(objectPath)}`,
    {
      method: "POST",
      headers: headersFor(config, { "Content-Type": "application/json" }),
      body: JSON.stringify({ expiresIn })
    }
  );
  const raw = await response.text();
  let payload = {};
  try { payload = raw ? JSON.parse(raw) : {}; } catch (_) {}
  if (!response.ok) throw new Error(clean(payload?.message || "Could not create PDF download link.", 220));
  const signed = payload.signedURL || payload.signedUrl || payload.signed_url || "";
  if (!signed) throw new Error("Could not create PDF download link.");
  if (/^https?:\/\//i.test(signed)) return signed;
  return `${config.baseUrl}/storage/v1${signed.startsWith("/") ? signed : `/${signed}`}`;
}
async function addPdfUrl(policy) {
  const stored = clean(policy?.pdfFileUrl, 2000);
  if (!stored) return { ...policy, pdfUrl: "" };
  if (/^https?:\/\//i.test(stored)) return { ...policy, pdfUrl: stored };
  const match = /^supabase:\/\/([^/]+)\/(.+)$/.exec(stored);
  if (!match) return { ...policy, pdfUrl: "" };
  try {
    return { ...policy, pdfUrl: await signStorageObject(match[1], match[2]) };
  } catch (_) {
    return { ...policy, pdfUrl: "" };
  }
}
async function generateAndAttachPdf(row) {
  try {
    const file = await uploadPolicyPdf(row);
    const updated = first(await dbRequest(POLICY_TABLE, {
      method: "PATCH",
      query: { policy_id: `eq.${row.policy_id}` },
      prefer: "return=representation",
      body: {
        pdf_file_url: file.fileUrl,
        pdf_file_name: file.fileName,
        pdf_generated_at: file.generatedAt,
        pdf_status: "ready",
        pdf_error: null,
        updated_at: nowIso()
      }
    })) || {
      ...row,
      pdf_file_url: file.fileUrl,
      pdf_file_name: file.fileName,
      pdf_generated_at: file.generatedAt,
      pdf_status: "ready",
      pdf_error: null
    };
    return { row: updated, warning: "" };
  } catch (error) {
    const message = clean(error?.message || "PDF generation failed.", 500);
    const updated = first(await dbRequest(POLICY_TABLE, {
      method: "PATCH",
      query: { policy_id: `eq.${row.policy_id}` },
      prefer: "return=representation",
      body: {
        pdf_status: "error",
        pdf_error: message,
        updated_at: nowIso()
      }
    })) || { ...row, pdf_status: "error", pdf_error: message };
    return { row: updated, warning: message };
  }
}

function filterPolicies(rows, input = {}) {
  const search = lower(input.search, 200);
  const scope = lower(input.scope, 20);
  const status = clean(input.status, 30);
  return rows.map(mapPolicy).filter((policy) => {
    if (scope && scope !== "all" && policy.scope !== scope) return false;
    if (status && status !== "all" && policy.status !== status) return false;
    if (!search) return true;
    return [
      policy.title, policy.documentId, policy.slug, policy.brand,
      policy.category, policy.summary
    ].join(" ").toLowerCase().includes(search);
  });
}

export const getPolicyControlBootstrap = webMethod(Permissions.SiteMember, async () => {
  try {
    const profile = await requirePolicyAdmin();
    const policies = (await allPolicyRows()).map(mapPolicy);
    return {
      ok: true,
      authorized: true,
      profile,
      policies,
      reviewSummary: reviewSummary(policies)
    };
  } catch (error) {
    return {
      ok: false,
      authorized: false,
      error: clean(error?.message || "Policy Control could not be loaded.", 240)
    };
  }
});

export const listPolicyDocuments = webMethod(Permissions.SiteMember, async (input = {}) => {
  await requirePolicyAdmin();
  const policies = filterPolicies(await allPolicyRows(), input);
  return {
    ok: true,
    policies,
    reviewSummary: reviewSummary(policies)
  };
});

export const getPolicyDocument = webMethod(Permissions.SiteMember, async (input = {}) => {
  await requirePolicyAdmin();
  const id = clean(input._id || input.policyId, 120);
  const row = await findPolicy(id);
  if (!row) throw new Error("Policy not found.");
  const revisions = (await dbRequest(REVISION_TABLE, {
    query: {
      select: "*",
      policy_id: `eq.${row.policy_id}`,
      order: "created_at.desc",
      limit: 250
    }
  })) || [];
  return {
    ok: true,
    policy: await addPdfUrl(mapPolicy(row)),
    revisions: revisions.map((revision) => ({
      _id: revision.revision_id,
      action: revision.action,
      versionFrom: revision.version_from,
      versionTo: revision.version_to,
      changeSummary: revision.change_summary,
      changedFields: arr(revision.changed_fields),
      createdAt: revision.created_at,
      createdBySkId: revision.created_by_sk_id,
      createdByName: revision.created_by_name
    }))
  };
});

export const savePolicyDocument = webMethod(Permissions.SiteMember, async (input = {}) => {
  const actor = await requirePolicyAdmin();
  const source = input.policy || input || {};
  const id = clean(source._id || source.policyId, 120);
  const existing = id ? await findPolicy(id) : null;
  const record = toRecord(source, actor, existing);
  await assertUnique(record, existing?.policy_id || "");

  let saved;
  if (existing) {
    saved = first(await dbRequest(POLICY_TABLE, {
      method: "PATCH",
      query: { policy_id: `eq.${existing.policy_id}` },
      prefer: "return=representation",
      body: record
    }));
  } else {
    saved = first(await dbRequest(POLICY_TABLE, {
      method: "POST",
      prefer: "return=representation",
      body: record
    }));
  }
  if (!saved) saved = record;

  await saveRevision(
    existing,
    saved,
    actor,
    existing ? "Saved" : "Created",
    input.changeSummary || (existing ? "Policy saved from Policy Control." : "Policy created from Policy Control.")
  );

  const pdfResult = await generateAndAttachPdf(saved);
  return {
    ok: true,
    policy: await addPdfUrl(mapPolicy(pdfResult.row)),
    message: existing ? "Policy saved." : "Policy created.",
    pdfWarning: pdfResult.warning || ""
  };
});

export const publishPolicyDocument = webMethod(Permissions.SiteMember, async (input = {}) => {
  const actor = await requirePolicyAdmin();
  const id = clean(input._id || input.policyId, 120);
  const existing = await findPolicy(id);
  if (!existing) throw new Error("Policy not found.");
  if (!arr(existing.sections).length) throw new Error("Add at least one section before publishing.");

  const saved = first(await dbRequest(POLICY_TABLE, {
    method: "PATCH",
    query: { policy_id: `eq.${id}` },
    prefer: "return=representation",
    body: {
      status: "Published",
      active: true,
      approved_by_sk_id: actor.skId || null,
      approved_by_name: actor.name || null,
      published_at: nowIso(),
      updated_at: nowIso(),
      updated_by_sk_id: actor.skId || null,
      updated_by_name: actor.name || null,
      pdf_status: "pending",
      pdf_error: null
    }
  })) || { ...existing, status: "Published", active: true };

  await saveRevision(
    existing,
    saved,
    actor,
    "Published",
    input.changeSummary || "Policy published from Policy Control."
  );

  const pdfResult = await generateAndAttachPdf(saved);
  return {
    ok: true,
    policy: await addPdfUrl(mapPolicy(pdfResult.row)),
    message: "Policy published.",
    pdfWarning: pdfResult.warning || ""
  };
});

export const archivePolicyDocument = webMethod(Permissions.SiteMember, async (input = {}) => {
  const actor = await requirePolicyAdmin();
  const id = clean(input._id || input.policyId, 120);
  const existing = await findPolicy(id);
  if (!existing) throw new Error("Policy not found.");

  const saved = first(await dbRequest(POLICY_TABLE, {
    method: "PATCH",
    query: { policy_id: `eq.${id}` },
    prefer: "return=representation",
    body: {
      status: "Archived",
      active: false,
      updated_at: nowIso(),
      updated_by_sk_id: actor.skId || null,
      updated_by_name: actor.name || null
    }
  })) || { ...existing, status: "Archived", active: false };

  await saveRevision(existing, saved, actor, "Archived", input.changeSummary || "Policy archived.");
  return { ok: true, policy: await addPdfUrl(mapPolicy(saved)), message: "Policy archived." };
});

export const deletePolicyDocument = webMethod(Permissions.SiteMember, async (input = {}) => {
  const actor = await requirePolicyAdmin();
  const id = clean(input._id || input.policyId, 120);
  const existing = await findPolicy(id);
  if (!existing) throw new Error("Policy not found.");

  const saved = first(await dbRequest(POLICY_TABLE, {
    method: "PATCH",
    query: { policy_id: `eq.${id}` },
    prefer: "return=representation",
    body: {
      status: "Deleted",
      active: false,
      public_type: null,
      deleted_at: nowIso(),
      deleted_by_sk_id: actor.skId || null,
      deleted_by_name: actor.name || null,
      updated_at: nowIso(),
      updated_by_sk_id: actor.skId || null,
      updated_by_name: actor.name || null
    }
  })) || { ...existing, status: "Deleted", active: false, public_type: null };

  await saveRevision(
    existing,
    saved,
    actor,
    "Deleted",
    input.changeSummary || "Policy deleted from use; audit history retained."
  );

  const policies = (await allPolicyRows()).map(mapPolicy);
  return {
    ok: true,
    policies,
    reviewSummary: reviewSummary(policies),
    message: "Policy deleted from use. Audit history retained."
  };
});

export const regeneratePolicyPdf = webMethod(Permissions.SiteMember, async (input = {}) => {
  const actor = await requirePolicyAdmin();
  const id = clean(input._id || input.policyId, 120);
  const existing = await findPolicy(id);
  if (!existing) throw new Error("Policy not found.");

  const result = await generateAndAttachPdf(existing);
  await saveRevision(
    existing,
    result.row,
    actor,
    "PDF regenerated",
    input.changeSummary || "Policy PDF regenerated."
  );
  return {
    ok: true,
    policy: await addPdfUrl(mapPolicy(result.row)),
    message: result.warning ? "Policy saved, but PDF generation needs attention." : "Policy PDF regenerated.",
    pdfWarning: result.warning || ""
  };
});

function inferPublicType(title) {
  const value = lower(title, 300);
  if (value.includes("cookie")) return "cookies";
  if (value.includes("privacy")) return "privacy";
  if (value.includes("accessibility")) return "accessibility";
  if (value.includes("booking") && value.includes("term")) return "bookingTerms";
  if (value.includes("term")) return "terms";
  return "custom";
}
function parseImportedPolicy(text, fileName = "") {
  const cleanText = String(text || "").replace(/\r/g, "");
  const lines = cleanText.split("\n").map((line) => line.trim()).filter(Boolean);
  const title = clean(lines[0] || fileName.replace(/\.pdf$/i, "") || "Imported Policy", 240);
  const effectiveMatch = cleanText.match(/effective\s+date\s*[:\-]?\s*([A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4}|\d{4}-\d{2}-\d{2}|\d{1,2}[\/.-]\d{1,2}[\/.-]\d{4})/i);
  let effectiveDate = new Date().toISOString().slice(0, 10);
  if (effectiveMatch) {
    const d = new Date(effectiveMatch[1]);
    if (!Number.isNaN(d.getTime())) effectiveDate = d.toISOString().slice(0, 10);
    else if (/^\d{4}-\d{2}-\d{2}$/.test(effectiveMatch[1])) effectiveDate = effectiveMatch[1];
  }
  const versionMatch = cleanText.match(/\bversion\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)*)/i);
  const numbered = [];
  lines.forEach((line) => {
    const match = /^(\d+(?:\.\d+){0,3})\.?\s+(.+)$/.exec(line);
    if (match) numbered.push({ number: match[1], title: clean(match[2], 300) });
  });
  const sections = numbered.length
    ? numbered.filter((item) => !item.number.includes(".")).map((item) => ({
        id: uid("SEC"),
        title: item.title,
        bodyHtml: "<p>Review imported text and add the section body.</p>",
        children: []
      }))
    : [{
        id: uid("SEC"),
        title: "Imported Policy",
        bodyHtml: `<p>${sanitizeHtml(cleanText.slice(0, 12000).replace(/\n/g, "<br>"))}</p>`,
        children: []
      }];

  return {
    title,
    documentId: upper(slugify(title).replace(/-/g, "_"), 80),
    slug: slugify(title),
    scope: /internal use only/i.test(cleanText) ? "internal" : "external",
    brand: /\bALTEA\b/i.test(cleanText) ? "ALTEA" : "SKANDI TRAVELS",
    publicType: inferPublicType(title),
    status: "Draft",
    category: "Legal",
    summary: "",
    introductionHtml: "",
    sections,
    effectiveDate,
    reviewMode: "none",
    reviewIntervalMonths: 12,
    reviewDate: "",
    owner: "Legal / Compliance",
    version: versionMatch ? clean(versionMatch[1], 30) : "1.0",
    sourcePdfName: clean(fileName, 300)
  };
}
export const parsePolicyPdfText = webMethod(Permissions.SiteMember, async (input = {}) => {
  await requirePolicyAdmin();
  const text = clean(input.text, 250000);
  if (!text) throw new Error("The uploaded PDF did not contain readable text.");
  return {
    ok: true,
    prefill: parseImportedPolicy(text, clean(input.fileName, 300)),
    message: "PDF text analyzed. Review all imported fields before saving."
  };
});
