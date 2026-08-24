import { currentMember } from "wix-members-backend";
import { getSecret } from "wix-secrets-backend";
import { Permissions, webMethod } from "wix-web-module";
import { getMagazineManagerSupabase } from "./supabaseAdmin";

const PUBLIC_ORGANIZATION_SECRET = "VOY_PUBLIC_ORGANIZATION_ID";
const EDITOR_ROLES = new Set(["manager", "admin", "owner", "super_admin"]);
const ENTITY_TYPES = new Set([
  "article", "asset", "campaign", "approval", "category", "banner",
  "travel_card", "brand_kit", "quality_report", "distribution_kit",
  "print_package", "api_attribution"
]);
const ISSUE_STATUSES = new Set(["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"]);
const PAGE_STATUSES = new Set(["DRAFT", "IN PROGRESS", "REVIEW", "APPROVED", "PUBLISHED"]);
const PAGE_TEMPLATES = new Set([
  "cover", "contents", "brand-feature", "offers", "section-opener", "feature",
  "destination-grid", "nightlife", "experiences", "travel-well", "airline-guide",
  "airline-profile", "onboard-guide", "airport-guide", "route-map",
  "transfer-promise", "signature-collection", "back-cover"
]);
const ALLOWED_FONTS = new Set([
  "Montserrat", "Inter", "Playfair Display", "Cormorant Garamond", "Georgia", "Arial"
]);
const IMAGE_FITS = new Set(["cover", "contain", "fill", "scale-down", "none"]);

export const getVoyAdminBootstrap = protectedMethod("getVoyAdminBootstrap", async () => {
  const context = await getEditorContext();
  const { supabase, organizationId } = context;

  const [issuesResult, pagesResult, entitiesResult] = await Promise.all([
    supabase.from("voy_issues").select("*").eq("organization_id", organizationId).order("updated_at", { ascending: false }),
    supabase.from("voy_pages").select("*").eq("organization_id", organizationId).order("issue_id", { ascending: true }).order("page_no", { ascending: true }),
    supabase.from("voy_entities").select("entity_type, entity_id, issue_id, data, is_active, updated_at").eq("organization_id", organizationId).eq("is_active", true).order("updated_at", { ascending: false })
  ]);

  assertQuery(issuesResult, "admin_issues");
  assertQuery(pagesResult, "admin_pages");
  assertQuery(entitiesResult, "admin_entities");

  return {
    ok: true,
    profile: context.profile,
    role: context.role,
    ...buildAdminPayload(issuesResult.data || [], pagesResult.data || [], entitiesResult.data || [])
  };
});

export const saveVoyIssue = protectedMethod("saveVoyIssue", async (input = {}) => {
  const context = await getEditorContext();
  const issue = await upsertIssue(context, input.issue || input.item || input);
  return { ok: true, issue };
});

export const saveVoyIssuePackage = protectedMethod("saveVoyIssuePackage", async (input = {}) => {
  const context = await getEditorContext();
  const issue = await upsertIssue(context, input.issue || {});
  const pages = await upsertPages(context, input.pages || [], issue.issueId);
  return { ok: true, issue, pages };
});

export const saveVoyPage = protectedMethod("saveVoyPage", async (input = {}) => {
  const context = await getEditorContext();
  const pages = await upsertPages(context, [input.page || input.item || input]);
  return { ok: true, page: pages[0] };
});

export const saveVoyPages = protectedMethod("saveVoyPages", async (input = {}) => {
  const context = await getEditorContext();
  const pages = await upsertPages(context, input.pages || [], input.issueId);
  return { ok: true, pages };
});

export const reorderVoyPages = protectedMethod("reorderVoyPages", async (input = {}) => {
  const context = await getEditorContext();
  const issueId = requiredId(input.issueId, "issueId");
  const rows = Array.isArray(input.pages) ? input.pages : [];
  if (!rows.length || rows.length > 500) throw new Error("VOY_INVALID_PAGE_ORDER");

  const seen = new Set();
  for (const item of rows) {
    const pageId = requiredId(item.pageId, "pageId");
    const pageNo = integerInRange(item.pageNo, 1, 500, "pageNo");
    if (seen.has(pageNo)) throw new Error("VOY_DUPLICATE_PAGE_NUMBER");
    seen.add(pageNo);
    const result = await context.supabase.from("voy_pages").update({
      page_no: pageNo,
      updated_by_wix_member_id: context.wixMemberId
    }).eq("organization_id", context.organizationId).eq("issue_id", issueId).eq("page_id", pageId);
    assertQuery(result, "reorder_page");
  }
  return { ok: true, issueId, count: rows.length };
});

export const deleteVoyPage = protectedMethod("deleteVoyPage", async (input = {}) => {
  const context = await getEditorContext();
  const pageId = requiredId(input.pageId, "pageId");
  const result = await context.supabase.from("voy_pages").delete().eq("organization_id", context.organizationId).eq("page_id", pageId);
  assertQuery(result, "delete_page");
  return { ok: true, pageId };
});

export const deleteVoyIssue = protectedMethod("deleteVoyIssue", async (input = {}) => {
  const context = await getEditorContext();
  const issueId = requiredId(input.issueId, "issueId");
  const current = await context.supabase.from("voy_issues").select("publish_status").eq("organization_id", context.organizationId).eq("issue_id", issueId).maybeSingle();
  assertQuery(current, "delete_issue_lookup");
  if (current.data?.publish_status === "PUBLISHED") throw new Error("VOY_ARCHIVE_BEFORE_DELETE");
  const result = await context.supabase.from("voy_issues").delete().eq("organization_id", context.organizationId).eq("issue_id", issueId);
  assertQuery(result, "delete_issue");
  return { ok: true, issueId };
});

export const publishVoyIssue = protectedMethod("publishVoyIssue", async (input = {}) => {
  const context = await getEditorContext();
  if (input.issue) await upsertIssue(context, input.issue);
  if (Array.isArray(input.pages) && input.pages.length) {
    await upsertPages(context, input.pages, input.issueId || input.issue?.issueId);
  }

  const issueId = requiredId(input.issueId || input.issue?.issueId, "issueId");
  const result = await context.supabase.rpc("publish_voy_issue", {
    p_organization_id: context.organizationId,
    p_issue_id: issueId,
    p_wix_member_id: context.wixMemberId
  });
  assertQuery(result, "publish_issue");
  const published = Array.isArray(result.data) ? result.data[0] : result.data;
  if (!published) throw new Error("VOY_PUBLISH_EMPTY_RESULT");
  const slug = published.payload?.issue?.slug || issueId;
  return {
    ok: true,
    issueId,
    revision: published.revision,
    publishedAt: published.published_at,
    publicUrl: `/voy-magazine?issue=${encodeURIComponent(slug)}`
  };
});

export const archiveVoyIssue = protectedMethod("archiveVoyIssue", async (input = {}) => {
  const context = await getEditorContext();
  const issueId = requiredId(input.issueId, "issueId");
  const [issueResult, publicationResult] = await Promise.all([
    context.supabase.from("voy_issues").update({ publish_status: "ARCHIVED", featured: false, updated_by_wix_member_id: context.wixMemberId }).eq("organization_id", context.organizationId).eq("issue_id", issueId),
    context.supabase.from("voy_publications").update({ is_current: false }).eq("organization_id", context.organizationId).eq("issue_id", issueId).eq("is_current", true)
  ]);
  assertQuery(issueResult, "archive_issue");
  assertQuery(publicationResult, "archive_publication");
  return { ok: true, issueId };
});

export const saveVoyEntity = protectedMethod("saveVoyEntity", async (input = {}) => {
  const context = await getEditorContext();
  const entityType = normalizeEntityType(input.entityType || input.type);
  const item = sanitizeJsonObject(input.item || input.data || {});
  const entityId = requiredId(input.entityId || inferEntityId(entityType, item), "entityId");
  const issueId = optionalId(input.issueId || item.issueId || item.issue_id);

  const existing = await context.supabase.from("voy_entities").select("created_by_wix_member_id").eq("organization_id", context.organizationId).eq("entity_type", entityType).eq("entity_id", entityId).maybeSingle();
  assertQuery(existing, "entity_lookup");

  const result = await context.supabase.from("voy_entities").upsert({
    organization_id: context.organizationId,
    entity_type: entityType,
    entity_id: entityId,
    issue_id: issueId || null,
    data: { ...item, entityId },
    is_active: input.isActive !== false,
    created_by_wix_member_id: existing.data?.created_by_wix_member_id || context.wixMemberId,
    updated_by_wix_member_id: context.wixMemberId
  }, { onConflict: "organization_id,entity_type,entity_id" }).select("entity_type, entity_id, issue_id, data, is_active, updated_at").single();
  assertQuery(result, "save_entity");
  return { ok: true, entity: mapEntityRow(result.data) };
});

export const deleteVoyEntity = protectedMethod("deleteVoyEntity", async (input = {}) => {
  const context = await getEditorContext();
  const entityType = normalizeEntityType(input.entityType || input.type);
  const entityId = requiredId(input.entityId, "entityId");
  const result = await context.supabase.from("voy_entities").delete().eq("organization_id", context.organizationId).eq("entity_type", entityType).eq("entity_id", entityId);
  assertQuery(result, "delete_entity");
  return { ok: true, entityType, entityId };
});

export const getVoyPublicBootstrap = publicMethod("getVoyPublicBootstrap", async () => {
  const supabase = await getMagazineManagerSupabase();
  const organizationId = await getPublicOrganizationId();
  const [publicationsResult, entitiesResult] = await Promise.all([
    supabase.from("voy_publications").select("issue_id, revision, payload, published_at").eq("organization_id", organizationId).eq("is_current", true).order("published_at", { ascending: false }).limit(50),
    supabase.from("voy_entities").select("entity_type, entity_id, issue_id, data").eq("organization_id", organizationId).eq("is_active", true).in("entity_type", ["category", "banner", "travel_card"]).order("updated_at", { ascending: false })
  ]);
  assertQuery(publicationsResult, "public_publications");
  assertQuery(entitiesResult, "public_entities");

  const issues = [];
  const pages = [];
  for (const row of publicationsResult.data || []) {
    const payload = row.payload && typeof row.payload === "object" ? row.payload : {};
    if (!payload.issue) continue;
    issues.push({
      ...payload.issue,
      issueId: payload.issue.issueId || row.issue_id,
      revision: row.revision,
      publishedAt: payload.issue.publishedAt || row.published_at
    });
    for (const page of Array.isArray(payload.pages) ? payload.pages : []) {
      pages.push({ ...page, issueId: page.issueId || row.issue_id });
    }
  }

  const publishedIssueIds = new Set(issues.map((issue) => String(issue.issueId)));
  const publicEntities = (entitiesResult.data || []).filter((row) => !row.issue_id || publishedIssueIds.has(String(row.issue_id)));
  const grouped = groupEntityData(publicEntities);
  return {
    ok: true,
    issues,
    pages,
    categories: grouped.category || [],
    banners: grouped.banner || [],
    travelCards: grouped.travel_card || [],
    interactions: []
  };
});

export const trackVoyInteraction = publicMethod("trackVoyInteraction", async (input = {}) => {
  const supabase = await getMagazineManagerSupabase();
  const organizationId = await getPublicOrganizationId();
  const issueId = requiredId(input.issueId, "issueId");
  await assertPublicIssue(supabase, organizationId, issueId);
  const eventType = cleanText(input.eventType || input.type, 100) || "interaction";
  const metadata = sanitizeJsonObject(input.metadata || {});
  if (JSON.stringify(metadata).length > 8000) throw new Error("VOY_INTERACTION_METADATA_TOO_LARGE");
  const result = await supabase.from("voy_interactions").insert({
    organization_id: organizationId,
    issue_id: issueId,
    interaction_id: cleanText(input.interactionId, 160),
    event_type: eventType,
    page_no: input.page ? integerInRange(input.page, 1, 500, "page") : null,
    metadata
  });
  assertQuery(result, "track_interaction");
  return { ok: true };
});

export const saveVoyIssueForMember = memberMethod("saveVoyIssueForMember", async (input = {}) => {
  const member = await currentMember.getMember();
  const wixMemberId = getWixMemberId(member);
  if (!wixMemberId) throw new Error("VOY_NOT_AUTHENTICATED");
  const organizationId = await getPublicOrganizationId();
  const supabase = await getMagazineManagerSupabase();
  const issueId = requiredId(input.issueId, "issueId");
  await assertPublicIssue(supabase, organizationId, issueId);
  const result = await supabase.from("voy_saved_issues").upsert({
    organization_id: organizationId,
    wix_member_id: wixMemberId,
    issue_id: issueId,
    saved_at: new Date().toISOString()
  }, { onConflict: "organization_id,wix_member_id,issue_id" });
  assertQuery(result, "save_member_issue");
  return { ok: true, issueId };
});

function protectedMethod(name, handler) {
  return webMethod(Permissions.SiteMember, async (input = {}) => {
    try { return await handler(input); } catch (error) { throwSafeError(name, error); }
  });
}
function memberMethod(name, handler) {
  return webMethod(Permissions.SiteMember, async (input = {}) => {
    try { return await handler(input); } catch (error) { throwSafeError(name, error); }
  });
}
function publicMethod(name, handler) {
  return webMethod(Permissions.Anyone, async (input = {}) => {
    try { return await handler(input); } catch (error) { throwSafeError(name, error); }
  });
}

async function getEditorContext() {
  const member = await currentMember.getMember();
  const wixMemberId = getWixMemberId(member);
  if (!wixMemberId) throw new Error("VOY_NOT_AUTHENTICATED");
  const supabase = await getMagazineManagerSupabase();
  const membershipResult = await supabase.from("dashboard_members").select("organization_id, role").eq("wix_member_id", wixMemberId).eq("is_active", true).maybeSingle();
  assertQuery(membershipResult, "editor_membership");
  const membership = membershipResult.data;
  const role = String(membership?.role || "").toLowerCase();
  if (!membership || !EDITOR_ROLES.has(role)) throw new Error("VOY_EDITOR_ACCESS_DENIED");
  return {
    supabase,
    wixMemberId,
    organizationId: membership.organization_id,
    role,
    profile: {
      name: displayName(member),
      email: member?.loginEmail || member?.profile?.email || "",
      role
    }
  };
}

async function getPublicOrganizationId() {
  const value = cleanText(await getSecret(PUBLIC_ORGANIZATION_SECRET), 80);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw new Error("VOY_PUBLIC_ORGANIZATION_NOT_CONFIGURED");
  }
  return value;
}

async function assertPublicIssue(supabase, organizationId, issueId) {
  const result = await supabase.from("voy_publications").select("issue_id").eq("organization_id", organizationId).eq("issue_id", issueId).eq("is_current", true).maybeSingle();
  assertQuery(result, "public_issue_lookup");
  if (!result.data) throw new Error("VOY_ISSUE_NOT_FOUND");
}

async function upsertIssue(context, input = {}) {
  const issue = normalizeIssue(input);
  const existing = await context.supabase.from("voy_issues").select("created_by_wix_member_id, revision, publish_status").eq("organization_id", context.organizationId).eq("issue_id", issue.issue_id).maybeSingle();
  assertQuery(existing, "issue_lookup");

  const savedStatus = existing.data?.publish_status;
  if (savedStatus === "PUBLISHED" || savedStatus === "ARCHIVED") issue.publish_status = savedStatus;
  else if (!new Set(["DRAFT", "REVIEW"]).has(issue.publish_status)) issue.publish_status = "DRAFT";

  const result = await context.supabase.from("voy_issues").upsert({
    organization_id: context.organizationId,
    ...issue,
    revision: existing.data?.revision || 1,
    created_by_wix_member_id: existing.data?.created_by_wix_member_id || context.wixMemberId,
    updated_by_wix_member_id: context.wixMemberId
  }, { onConflict: "organization_id,issue_id" }).select("*").single();
  assertQuery(result, "save_issue");
  return mapIssueRow(result.data);
}

async function upsertPages(context, inputPages, fallbackIssueId = "") {
  if (!Array.isArray(inputPages) || !inputPages.length || inputPages.length > 500) throw new Error("VOY_INVALID_PAGES");
  const normalized = inputPages.map((page) => normalizePage({ ...page, issueId: page.issueId || fallbackIssueId }));
  const pageIds = normalized.map((page) => page.page_id);
  const existingResult = await context.supabase.from("voy_pages").select("page_id, created_by_wix_member_id, revision").eq("organization_id", context.organizationId).in("page_id", pageIds);
  assertQuery(existingResult, "pages_lookup");
  const existing = new Map((existingResult.data || []).map((row) => [row.page_id, row]));
  const rows = normalized.map((page) => ({
    organization_id: context.organizationId,
    ...page,
    revision: existing.get(page.page_id)?.revision || 1,
    created_by_wix_member_id: existing.get(page.page_id)?.created_by_wix_member_id || context.wixMemberId,
    updated_by_wix_member_id: context.wixMemberId
  }));
  const result = await context.supabase.from("voy_pages").upsert(rows, { onConflict: "organization_id,page_id" }).select("*");
  assertQuery(result, "save_pages");
  return (result.data || []).map(mapPageRow).sort((a, b) => a.pageNo - b.pageNo);
}

function normalizeIssue(input = {}) {
  const issueId = requiredId(input.issueId || input.issue_id || input._id, "issueId");
  const title = cleanText(input.title, 240);
  if (!title) throw new Error("VOY_ISSUE_TITLE_REQUIRED");
  return {
    issue_id: issueId,
    title,
    edition: cleanText(input.edition, 160),
    slug: slugify(input.slug || title),
    summary: cleanText(input.summary, 6000),
    cover_image_url: cleanUrl(input.coverImageUrl || input.cover_image_url),
    publish_status: enumValue(String(input.publishStatus || input.publish_status || "DRAFT").toUpperCase(), ISSUE_STATUSES, "DRAFT"),
    publish_date: cleanDate(input.publishDate || input.publish_date),
    featured: Boolean(input.featured),
    categories: stringArray(input.categories, 40, 120),
    destinations: stringArray(input.destinations, 60, 160),
    search_text: cleanText(input.searchText || input.search_text, 20000),
    print_settings: cleanText(input.printSettings || input.print_settings, 6000),
    pdf_url: cleanUrl(input.pdfUrl || input.pdf_url || input.fileUrl),
    public_url: cleanUrlOrPath(input.publicUrl || input.public_url)
  };
}

function normalizePage(input = {}) {
  const pageId = requiredId(input.pageId || input.page_id || input._id, "pageId");
  const issueId = requiredId(input.issueId || input.issue_id, "issueId");
  const title = cleanText(input.title, 300);
  if (!title) throw new Error("VOY_PAGE_TITLE_REQUIRED");
  const template = cleanText(input.template, 80) || "feature";
  if (!PAGE_TEMPLATES.has(template)) throw new Error(`VOY_UNSUPPORTED_TEMPLATE:${template}`);
  const statusRaw = String(input.status || "DRAFT").toUpperCase();
  return {
    issue_id: issueId,
    page_id: pageId,
    page_no: integerInRange(input.pageNo || input.page_no, 1, 500, "pageNo"),
    template,
    status: enumValue(statusRaw, PAGE_STATUSES, "DRAFT"),
    category: cleanText(input.category, 160),
    kicker: cleanText(input.kicker, 300),
    title,
    deck: cleanText(input.deck, 6000),
    body: cleanText(input.body, 100000),
    image_url: cleanUrl(input.imageUrl || input.image_url),
    secondary_image_url: cleanUrl(input.secondaryImageUrl || input.secondary_image_url),
    image_credit: cleanText(input.imageCredit || input.image_credit, 1000),
    image_fit: enumValue(input.imageFit || input.image_fit, IMAGE_FITS, "cover"),
    image_position: cleanImagePosition(input.imagePosition || input.image_position),
    destination: cleanText(input.destination, 300),
    cta_label: cleanText(input.ctaLabel || input.cta_label, 160),
    cta_path: cleanPath(input.ctaPath || input.cta_path),
    background_color: cleanHex(input.backgroundColor || input.background_color, "#ffffff"),
    text_color: cleanHex(input.textColor || input.text_color, "#103154"),
    accent_color: cleanHex(input.accentColor || input.accent_color, "#4dcad6"),
    heading_font: fontValue(input.headingFont || input.heading_font, "Montserrat"),
    body_font: fontValue(input.bodyFont || input.body_font, "Inter"),
    footer_text: cleanText(input.footerText || input.footer_text || "VOY by SKANDI · skanditravels.com", 500),
    blocks: sanitizeJsonArray(input.blocks),
    seo_notes: cleanText(input.seoNotes || input.seo_notes, 10000)
  };
}

function mapIssueRow(row = {}) {
  return {
    issueId: row.issue_id,
    title: row.title,
    edition: row.edition || "",
    slug: row.slug || "",
    summary: row.summary || "",
    coverImageUrl: row.cover_image_url || "",
    publishStatus: row.publish_status || "DRAFT",
    publishDate: row.publish_date || null,
    publishedAt: row.published_at || null,
    featured: row.featured === true,
    categories: row.categories || [],
    destinations: row.destinations || [],
    searchText: row.search_text || "",
    printSettings: row.print_settings || "",
    pdfUrl: row.pdf_url || "",
    publicUrl: row.public_url || "",
    revision: row.revision || 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapPageRow(row = {}) {
  return {
    pageId: row.page_id,
    issueId: row.issue_id,
    pageNo: row.page_no,
    template: row.template,
    status: row.status,
    category: row.category || "",
    kicker: row.kicker || "",
    title: row.title || "",
    deck: row.deck || "",
    body: row.body || "",
    imageUrl: row.image_url || "",
    secondaryImageUrl: row.secondary_image_url || "",
    imageCredit: row.image_credit || "",
    imageFit: row.image_fit || "cover",
    imagePosition: row.image_position || "center center",
    destination: row.destination || "",
    ctaLabel: row.cta_label || "",
    ctaPath: row.cta_path || "",
    backgroundColor: row.background_color || "#ffffff",
    textColor: row.text_color || "#103154",
    accentColor: row.accent_color || "#4dcad6",
    headingFont: row.heading_font || "Montserrat",
    bodyFont: row.body_font || "Inter",
    footerText: row.footer_text || "VOY by SKANDI · skanditravels.com",
    blocks: row.blocks || [],
    seoNotes: row.seo_notes || "",
    revision: row.revision || 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapEntityRow(row = {}) {
  return {
    ...(row.data && typeof row.data === "object" ? row.data : {}),
    entityType: row.entity_type,
    entityId: row.entity_id,
    issueId: row.issue_id || "",
    active: row.is_active !== false,
    updatedAt: row.updated_at
  };
}

function buildAdminPayload(issueRows, pageRows, entityRows) {
  const grouped = groupEntityData(entityRows);
  return {
    issues: issueRows.map(mapIssueRow),
    pages: pageRows.map(mapPageRow),
    articles: grouped.article || [],
    assets: grouped.asset || [],
    campaigns: grouped.campaign || [],
    approvals: grouped.approval || [],
    categories: grouped.category || [],
    banners: grouped.banner || [],
    travelCards: grouped.travel_card || [],
    brandKits: grouped.brand_kit || [],
    qualityReports: grouped.quality_report || [],
    distributionKits: grouped.distribution_kit || [],
    printPackages: grouped.print_package || [],
    apiAttributions: grouped.api_attribution || []
  };
}

function groupEntityData(rows) {
  const out = {};
  for (const row of rows || []) {
    const key = row.entity_type;
    if (!out[key]) out[key] = [];
    out[key].push(mapEntityRow(row));
  }
  return out;
}

function normalizeEntityType(value) {
  const type = cleanText(value, 80).toLowerCase();
  if (!ENTITY_TYPES.has(type)) throw new Error("VOY_INVALID_ENTITY_TYPE");
  return type;
}
function inferEntityId(type, item = {}) {
  const keys = {
    article: ["articleId", "article_id", "_id"],
    asset: ["assetId", "asset_id", "_id", "id"],
    campaign: ["campaignId", "campaign_id", "_id"],
    approval: ["approvalId", "approval_id", "_id"],
    category: ["categoryId", "category_id", "_id"],
    banner: ["bannerId", "banner_id", "_id"],
    travel_card: ["cardId", "card_id", "_id"],
    brand_kit: ["brandKitId", "brand_kit_id", "name"],
    quality_report: ["reportId", "report_id", "_id"],
    distribution_kit: ["kitId", "kit_id", "_id"],
    print_package: ["packageId", "package_id", "_id"],
    api_attribution: ["attributionId", "attribution_id", "_id"]
  };
  for (const key of keys[type] || []) if (item[key]) return String(item[key]);
  return `${type}-${Date.now()}`;
}

function cleanText(value, max = 5000) { return String(value ?? "").trim().slice(0, max); }
function requiredId(value, label) {
  const v = cleanText(value, 180);
  if (!v || !/^[A-Za-z0-9._:-]+$/.test(v)) throw new Error(`VOY_INVALID_${String(label).toUpperCase()}`);
  return v;
}
function optionalId(value) { const v = cleanText(value, 180); return v ? requiredId(v, "id") : ""; }
function integerInRange(value, min, max, label) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < min || n > max) throw new Error(`VOY_INVALID_${String(label).toUpperCase()}`);
  return n;
}
function enumValue(value, allowed, fallback) { const v = String(value || "").trim(); return allowed.has(v) ? v : fallback; }
function cleanDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}
function cleanUrl(value) {
  const v = cleanText(value, 4000);
  if (!v) return "";
  return /^https:\/\//i.test(v) ? v : "";
}
function cleanUrlOrPath(value) {
  const v = cleanText(value, 4000);
  if (!v) return "";
  return /^https:\/\//i.test(v) || /^\/(?!\/)/.test(v) ? v : "";
}
function cleanPath(value) {
  const v = cleanText(value, 2000);
  if (!v) return "";
  return /^\/(?!\/)/.test(v) || /^https:\/\//i.test(v) ? v : "";
}
function cleanHex(value, fallback) { const v = String(value || "").trim(); return /^#[0-9A-Fa-f]{6}$/.test(v) ? v : fallback; }
function fontValue(value, fallback) { const v = cleanText(value, 80); return ALLOWED_FONTS.has(v) ? v : fallback; }
function cleanImagePosition(value) {
  const v = cleanText(value || "center center", 60);
  return /^[a-z0-9.% -]+$/i.test(v) ? v : "center center";
}
function stringArray(value, maxItems = 50, maxLen = 160) {
  const list = Array.isArray(value) ? value : String(value || "").split(",");
  return list.map((x) => cleanText(x, maxLen)).filter(Boolean).slice(0, maxItems);
}
function sanitizeJsonArray(value) {
  let list = value;
  if (typeof value === "string") {
    try { list = JSON.parse(value); } catch (_) { list = []; }
  }
  if (!Array.isArray(list)) return [];
  return JSON.parse(JSON.stringify(list.slice(0, 100)));
}
function sanitizeJsonObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const clean = JSON.parse(JSON.stringify(value));
  if (JSON.stringify(clean).length > 100000) throw new Error("VOY_ENTITY_TOO_LARGE");
  return clean;
}
function slugify(value) {
  const slug = cleanText(value, 240).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 180);
  if (!slug) throw new Error("VOY_INVALID_SLUG");
  return slug;
}
function getWixMemberId(member = {}) { return String(member?._id || member?.id || ""); }
function displayName(member = {}) {
  return member?.profile?.nickname || member?.profile?.title || [member?.contactDetails?.firstName, member?.contactDetails?.lastName].filter(Boolean).join(" ") || member?.loginEmail || "VOY Editor";
}
function assertQuery(result, label) {
  if (result?.error) {
    console.error(`[VOY] Supabase ${label} failed`, result.error);
    throw new Error(`VOY_SERVICE_UNAVAILABLE:${label}`);
  }
}
function throwSafeError(name, error) {
  const message = error instanceof Error ? error.message : String(error || "VOY_SERVICE_UNAVAILABLE");
  console.error(`[VOY] ${name} failed`, error);
  const allowed = message.startsWith("VOY_") ? message : `VOY_SERVICE_UNAVAILABLE:${name}`;
  throw new Error(allowed);
}
