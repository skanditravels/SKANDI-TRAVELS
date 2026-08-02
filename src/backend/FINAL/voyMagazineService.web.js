import { currentMember } from "wix-members-backend";
import { getSecret } from "wix-secrets-backend";
import { Permissions, webMethod } from "wix-web-module";
import { getMagazineManagerSupabase } from "./supabaseAdmin";

const PUBLIC_ORGANIZATION_SECRET = "VOY_PUBLIC_ORGANIZATION_ID";
const EDITOR_ROLES = new Set(["manager", "admin"]);
const ENTITY_TYPES = new Set([
  "article",
  "asset",
  "campaign",
  "approval",
  "category",
  "banner",
  "travel_card",
  "brand_kit",
  "quality_report",
  "distribution_kit",
  "print_package",
  "api_attribution"
]);
const ISSUE_STATUSES = new Set(["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"]);
const PAGE_STATUSES = new Set([
  "DRAFT",
  "IN PROGRESS",
  "REVIEW",
  "APPROVED",
  "PUBLISHED"
]);
const PAGE_TEMPLATES = new Set([
  "cover",
  "contents",
  "brand-feature",
  "offers",
  "section-opener",
  "feature",
  "destination-grid",
  "nightlife",
  "experiences",
  "travel-well",
  "airline-guide",
  "onboard-guide",
  "airport-guide",
  "route-map",
  "signature-collection",
  "back-cover"
]);
const ALLOWED_FONTS = new Set([
  "Montserrat",
  "Inter",
  "Playfair Display",
  "Cormorant Garamond",
  "Georgia",
  "Arial"
]);

export const getVoyAdminBootstrap = protectedMethod(
  "getVoyAdminBootstrap",
  async () => {
    const context = await getEditorContext();
    const { supabase, organizationId } = context;

    const [issuesResult, pagesResult, entitiesResult] = await Promise.all([
      supabase
        .from("voy_issues")
        .select("*")
        .eq("organization_id", organizationId)
        .order("updated_at", { ascending: false }),
      supabase
        .from("voy_pages")
        .select("*")
        .eq("organization_id", organizationId)
        .order("issue_id", { ascending: true })
        .order("page_no", { ascending: true }),
      supabase
        .from("voy_entities")
        .select("entity_type, entity_id, issue_id, data, is_active, updated_at")
        .eq("organization_id", organizationId)
        .eq("is_active", true)
        .order("updated_at", { ascending: false })
    ]);

    assertQuery(issuesResult, "admin_issues");
    assertQuery(pagesResult, "admin_pages");
    assertQuery(entitiesResult, "admin_entities");

    return {
      ok: true,
      profile: context.profile,
      role: context.role,
      ...buildAdminPayload(
        issuesResult.data || [],
        pagesResult.data || [],
        entitiesResult.data || []
      )
    };
  }
);

export const saveVoyIssue = protectedMethod("saveVoyIssue", async (input = {}) => {
  const context = await getEditorContext();
  const issue = await upsertIssue(context, input.issue || input.item || input);
  return { ok: true, issue };
});

export const saveVoyIssuePackage = protectedMethod(
  "saveVoyIssuePackage",
  async (input = {}) => {
    const context = await getEditorContext();
    const issue = await upsertIssue(context, input.issue || {});
    const pages = await upsertPages(context, input.pages || [], issue.issueId);
    return { ok: true, issue, pages };
  }
);

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

export const reorderVoyPages = protectedMethod(
  "reorderVoyPages",
  async (input = {}) => {
    const context = await getEditorContext();
    const issueId = requiredId(input.issueId, "issueId");
    const rows = Array.isArray(input.pages) ? input.pages : [];

    if (!rows.length || rows.length > 500) {
      throw new Error("VOY_INVALID_PAGE_ORDER");
    }

    const seenNumbers = new Set();
    for (const item of rows) {
      const pageId = requiredId(item.pageId, "pageId");
      const pageNo = integerInRange(item.pageNo, 1, 500, "pageNo");
      if (seenNumbers.has(pageNo)) {
        throw new Error("VOY_DUPLICATE_PAGE_NUMBER");
      }
      seenNumbers.add(pageNo);

      const result = await context.supabase
        .from("voy_pages")
        .update({
          page_no: pageNo,
          updated_by_wix_member_id: context.wixMemberId
        })
        .eq("organization_id", context.organizationId)
        .eq("issue_id", issueId)
        .eq("page_id", pageId);
      assertQuery(result, "reorder_page");
    }

    return { ok: true, issueId, count: rows.length };
  }
);

export const deleteVoyPage = protectedMethod("deleteVoyPage", async (input = {}) => {
  const context = await getEditorContext();
  const pageId = requiredId(input.pageId, "pageId");
  const result = await context.supabase
    .from("voy_pages")
    .delete()
    .eq("organization_id", context.organizationId)
    .eq("page_id", pageId);
  assertQuery(result, "delete_page");
  return { ok: true, pageId };
});

export const deleteVoyIssue = protectedMethod("deleteVoyIssue", async (input = {}) => {
  const context = await getEditorContext();
  const issueId = requiredId(input.issueId, "issueId");

  const currentResult = await context.supabase
    .from("voy_issues")
    .select("publish_status")
    .eq("organization_id", context.organizationId)
    .eq("issue_id", issueId)
    .maybeSingle();
  assertQuery(currentResult, "delete_issue_lookup");

  if (currentResult.data && currentResult.data.publish_status === "PUBLISHED") {
    throw new Error("VOY_ARCHIVE_BEFORE_DELETE");
  }

  const result = await context.supabase
    .from("voy_issues")
    .delete()
    .eq("organization_id", context.organizationId)
    .eq("issue_id", issueId);
  assertQuery(result, "delete_issue");
  return { ok: true, issueId };
});

export const publishVoyIssue = protectedMethod(
  "publishVoyIssue",
  async (input = {}) => {
    const context = await getEditorContext();

    if (input.issue) {
      await upsertIssue(context, input.issue);
    }
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
    if (!published) {
      throw new Error("VOY_PUBLISH_EMPTY_RESULT");
    }

    const slug = published.payload?.issue?.slug || issueId;
    return {
      ok: true,
      issueId,
      revision: published.revision,
      publishedAt: published.published_at,
      publicUrl: `/voy-magazine?issue=${encodeURIComponent(slug)}`
    };
  }
);

export const archiveVoyIssue = protectedMethod(
  "archiveVoyIssue",
  async (input = {}) => {
    const context = await getEditorContext();
    const issueId = requiredId(input.issueId, "issueId");

    const [issueResult, publicationResult] = await Promise.all([
      context.supabase
        .from("voy_issues")
        .update({
          publish_status: "ARCHIVED",
          featured: false,
          updated_by_wix_member_id: context.wixMemberId
        })
        .eq("organization_id", context.organizationId)
        .eq("issue_id", issueId),
      context.supabase
        .from("voy_publications")
        .update({ is_current: false })
        .eq("organization_id", context.organizationId)
        .eq("issue_id", issueId)
        .eq("is_current", true)
    ]);
    assertQuery(issueResult, "archive_issue");
    assertQuery(publicationResult, "archive_publication");
    return { ok: true, issueId };
  }
);

export const saveVoyEntity = protectedMethod("saveVoyEntity", async (input = {}) => {
  const context = await getEditorContext();
  const entityType = normalizeEntityType(input.entityType || input.type);
  const item = sanitizeJsonObject(input.item || input.data || {});
  const entityId = requiredId(
    input.entityId || inferEntityId(entityType, item),
    "entityId"
  );
  const issueId = optionalId(input.issueId || item.issueId || item.issue_id);

  const existingResult = await context.supabase
    .from("voy_entities")
    .select("created_by_wix_member_id")
    .eq("organization_id", context.organizationId)
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .maybeSingle();
  assertQuery(existingResult, "entity_lookup");

  const result = await context.supabase
    .from("voy_entities")
    .upsert(
      {
        organization_id: context.organizationId,
        entity_type: entityType,
        entity_id: entityId,
        issue_id: issueId || null,
        data: { ...item, entityId },
        is_active: input.isActive !== false,
        created_by_wix_member_id:
          existingResult.data?.created_by_wix_member_id || context.wixMemberId,
        updated_by_wix_member_id: context.wixMemberId
      },
      { onConflict: "organization_id,entity_type,entity_id" }
    )
    .select("entity_type, entity_id, issue_id, data, is_active, updated_at")
    .single();
  assertQuery(result, "save_entity");
  return { ok: true, entity: mapEntityRow(result.data) };
});

export const deleteVoyEntity = protectedMethod("deleteVoyEntity", async (input = {}) => {
  const context = await getEditorContext();
  const entityType = normalizeEntityType(input.entityType || input.type);
  const entityId = requiredId(input.entityId, "entityId");
  const result = await context.supabase
    .from("voy_entities")
    .delete()
    .eq("organization_id", context.organizationId)
    .eq("entity_type", entityType)
    .eq("entity_id", entityId);
  assertQuery(result, "delete_entity");
  return { ok: true, entityType, entityId };
});

export const getVoyPublicBootstrap = publicMethod(
  "getVoyPublicBootstrap",
  async () => {
    const supabase = await getMagazineManagerSupabase();
    const organizationId = await getPublicOrganizationId();

    const [publicationsResult, entitiesResult] = await Promise.all([
      supabase
        .from("voy_publications")
        .select("issue_id, revision, payload, published_at")
        .eq("organization_id", organizationId)
        .eq("is_current", true)
        .order("published_at", { ascending: false })
        .limit(50),
      supabase
        .from("voy_entities")
        .select("entity_type, entity_id, issue_id, data")
        .eq("organization_id", organizationId)
        .eq("is_active", true)
        .in("entity_type", ["category", "banner", "travel_card"])
        .order("updated_at", { ascending: false })
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
    const publicEntities = (entitiesResult.data || []).filter(
      (row) => !row.issue_id || publishedIssueIds.has(String(row.issue_id))
    );
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
  }
);

export const trackVoyInteraction = publicMethod(
  "trackVoyInteraction",
  async (input = {}) => {
    const supabase = await getMagazineManagerSupabase();
    const organizationId = await getPublicOrganizationId();
    const issueId = requiredId(input.issueId, "issueId");
    await assertPublicIssue(supabase, organizationId, issueId);
    const eventType = cleanText(input.eventType || input.type, 100, "interaction");
    const metadata = sanitizeJsonObject(input.metadata || {});
    if (JSON.stringify(metadata).length > 8000) {
      throw new Error("VOY_INTERACTION_METADATA_TOO_LARGE");
    }

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
  }
);

export const saveVoyIssueForMember = memberMethod(
  "saveVoyIssueForMember",
  async (input = {}) => {
    const member = await currentMember.getMember();
    const wixMemberId = getWixMemberId(member);
    if (!wixMemberId) throw new Error("VOY_NOT_AUTHENTICATED");
    const organizationId = await getPublicOrganizationId();
    const supabase = await getMagazineManagerSupabase();
    const issueId = requiredId(input.issueId, "issueId");
    await assertPublicIssue(supabase, organizationId, issueId);
    const result = await supabase.from("voy_saved_issues").upsert(
      {
        organization_id: organizationId,
        wix_member_id: wixMemberId,
        issue_id: issueId,
        saved_at: new Date().toISOString()
      },
      { onConflict: "organization_id,wix_member_id,issue_id" }
    );
    assertQuery(result, "save_member_issue");
    return { ok: true, issueId };
  }
);

function protectedMethod(name, handler) {
  return webMethod(Permissions.SiteMember, async (input = {}) => {
    try {
      return await handler(input);
    } catch (error) {
      throwSafeError(name, error);
    }
  });
}

function memberMethod(name, handler) {
  return webMethod(Permissions.SiteMember, async (input = {}) => {
    try {
      return await handler(input);
    } catch (error) {
      throwSafeError(name, error);
    }
  });
}

function publicMethod(name, handler) {
  return webMethod(Permissions.Anyone, async (input = {}) => {
    try {
      return await handler(input);
    } catch (error) {
      throwSafeError(name, error);
    }
  });
}

async function getEditorContext() {
  const member = await currentMember.getMember();
  const wixMemberId = getWixMemberId(member);
  if (!wixMemberId) throw new Error("VOY_NOT_AUTHENTICATED");

  const supabase = await getMagazineManagerSupabase();
  const membershipResult = await supabase
    .from("dashboard_members")
    .select("organization_id, role")
    .eq("wix_member_id", wixMemberId)
    .eq("is_active", true)
    .maybeSingle();
  assertQuery(membershipResult, "editor_membership");
  const membership = membershipResult.data;

  if (!membership || !EDITOR_ROLES.has(membership.role)) {
    throw new Error("VOY_EDITOR_ACCESS_DENIED");
  }

  return {
    supabase,
    wixMemberId,
    organizationId: membership.organization_id,
    role: membership.role,
    profile: {
      name: displayName(member),
      email: member?.loginEmail || member?.profile?.email || "",
      role: membership.role
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
  const result = await supabase
    .from("voy_publications")
    .select("issue_id")
    .eq("organization_id", organizationId)
    .eq("issue_id", issueId)
    .eq("is_current", true)
    .maybeSingle();
  assertQuery(result, "public_issue_lookup");
  if (!result.data) throw new Error("VOY_ISSUE_NOT_FOUND");
}

async function upsertIssue(context, input) {
  const issue = normalizeIssue(input);
  const existingResult = await context.supabase
    .from("voy_issues")
    .select("created_by_wix_member_id, revision, publish_status")
    .eq("organization_id", context.organizationId)
    .eq("issue_id", issue.issue_id)
    .maybeSingle();
  assertQuery(existingResult, "issue_lookup");

  const savedStatus = existingResult.data?.publish_status;
  if (savedStatus === "PUBLISHED" || savedStatus === "ARCHIVED") {
    issue.publish_status = savedStatus;
  } else if (!new Set(["DRAFT", "REVIEW"]).has(issue.publish_status)) {
    issue.publish_status = "DRAFT";
  }

  const result = await context.supabase
    .from("voy_issues")
    .upsert(
      {
        organization_id: context.organizationId,
        ...issue,
        revision: existingResult.data?.revision || 1,
        created_by_wix_member_id:
          existingResult.data?.created_by_wix_member_id || context.wixMemberId,
        updated_by_wix_member_id: context.wixMemberId
      },
      { onConflict: "organization_id,issue_id" }
    )
    .select("*")
    .single();
  assertQuery(result, "save_issue");
  return mapIssueRow(result.data);
}

async function upsertPages(context, inputPages, fallbackIssueId = "") {
  if (!Array.isArray(inputPages) || !inputPages.length || inputPages.length > 500) {
    throw new Error("VOY_INVALID_PAGES");
  }

  const normalized = inputPages.map((page) =>
    normalizePage({ ...page, issueId: page.issueId || fallbackIssueId })
  );
  const pageIds = normalized.map((page) => page.page_id);
  const existingResult = await context.supabase
    .from("voy_pages")
    .select("page_id, created_by_wix_member_id, revision")
    .eq("organization_id", context.organizationId)
    .in("page_id", pageIds);
  assertQuery(existingResult, "pages_lookup");
  const existing = new Map(
    (existingResult.data || []).map((row) => [row.page_id, row])
  );

  const rows = normalized.map((page) => ({
    organization_id: context.organizationId,
    ...page,
    revision: existing.get(page.page_id)?.revision || 1,
    created_by_wix_member_id:
      existing.get(page.page_id)?.created_by_wix_member_id || context.wixMemberId,
    updated_by_wix_member_id: context.wixMemberId
  }));
  const result = await context.supabase
    .from("voy_pages")
    .upsert(rows, { onConflict: "organization_id,page_id" })
    .select("*");
  assertQuery(result, "save_pages");
  return (result.data || []).map(mapPageRow).sort((a, b) => a.pageNo - b.pageNo);
}

function normalizeIssue(input = {}) {
  const issueId = requiredId(input.issueId || input.issue_id || input._id, "issueId");
  const title = cleanText(input.title, 240);
  if (!title) throw new Error("VOY_ISSUE_TITLE_REQUIRED");
  const slug = slugify(input.slug || title);
  return {
    issue_id: issueId,
    title,
    edition: cleanText(input.edition, 160),
    slug,
    summary: cleanText(input.summary, 6000),
    cover_image_url: cleanUrl(input.coverImageUrl || input.cover_image_url),
    publish_status: enumValue(input.publishStatus || input.publish_status, ISSUE_STATUSES, "DRAFT"),
    publish_date: cleanDate(input.publishDate || input.publish_date),
    featured: Boolean(input.featured),
    categories: stringArray(input.categories, 40, 120),
    destinations: stringArray(input.destinations, 60, 160),
    search_text: cleanText(input.searchText || input.search_text, 30000),
    print_settings: cleanText(input.printSettings || input.print_settings, 1000),
    pdf_url: cleanUrl(input.pdfUrl || input.pdf_url),
    public_url: cleanPathOrUrl(input.publicUrl || input.public_url)
  };
}

function normalizePage(input = {}) {
  const pageId = requiredId(input.pageId || input.page_id || input._id, "pageId");
  const issueId = requiredId(input.issueId || input.issue_id, "issueId");
  const title = cleanText(input.title, 300);
  if (!title) throw new Error("VOY_PAGE_TITLE_REQUIRED");
  const template = cleanText(input.template, 80);
  if (!PAGE_TEMPLATES.has(template)) throw new Error("VOY_INVALID_PAGE_TEMPLATE");
  const blocks = Array.isArray(input.blocks) ? input.blocks : [];
  if (blocks.length > 100 || JSON.stringify(blocks).length > 100000) {
    throw new Error("VOY_PAGE_BLOCKS_TOO_LARGE");
  }

  return {
    issue_id: issueId,
    page_id: pageId,
    page_no: integerInRange(input.pageNo || input.page_no, 1, 500, "pageNo"),
    template,
    status: enumValue(input.status, PAGE_STATUSES, "DRAFT"),
    category: cleanText(input.category, 160),
    kicker: cleanText(input.kicker, 240),
    title,
    deck: cleanText(input.deck, 3000),
    body: cleanText(input.body, 60000),
    image_url: cleanUrl(input.imageUrl || input.image_url),
    secondary_image_url: cleanUrl(input.secondaryImageUrl || input.secondary_image_url),
    image_credit: cleanText(input.imageCredit || input.image_credit, 1000),
    destination: cleanText(input.destination, 240),
    cta_label: cleanText(input.ctaLabel || input.cta_label, 160),
    cta_path: cleanPathOrUrl(input.ctaPath || input.cta_path),
    background_color: cleanHex(input.backgroundColor || input.background_color, "#ffffff"),
    text_color: cleanHex(input.textColor || input.text_color, "#103154"),
    accent_color: cleanHex(input.accentColor || input.accent_color, "#4dcad6"),
    heading_font: fontValue(input.headingFont || input.heading_font, "Montserrat"),
    body_font: fontValue(input.bodyFont || input.body_font, "Inter"),
    footer_text: cleanText(input.footerText || input.footer_text, 500),
    blocks: sanitizeJsonArray(blocks),
    seo_notes: cleanText(input.seoNotes || input.seo_notes, 10000)
  };
}

function mapIssueRow(row) {
  return {
    issueId: row.issue_id,
    title: row.title,
    edition: row.edition,
    slug: row.slug,
    summary: row.summary,
    coverImageUrl: row.cover_image_url,
    publishStatus: row.publish_status,
    publishDate: row.publish_date,
    publishedAt: row.published_at,
    featured: row.featured,
    categories: row.categories || [],
    destinations: row.destinations || [],
    searchText: row.search_text,
    printSettings: row.print_settings,
    pdfUrl: row.pdf_url,
    publicUrl: row.public_url,
    revision: row.revision,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapPageRow(row) {
  return {
    pageId: row.page_id,
    issueId: row.issue_id,
    pageNo: row.page_no,
    template: row.template,
    status: row.status,
    category: row.category,
    kicker: row.kicker,
    title: row.title,
    deck: row.deck,
    body: row.body,
    imageUrl: row.image_url,
    secondaryImageUrl: row.secondary_image_url,
    imageCredit: row.image_credit,
    destination: row.destination,
    ctaLabel: row.cta_label,
    ctaPath: row.cta_path,
    backgroundColor: row.background_color,
    textColor: row.text_color,
    accentColor: row.accent_color,
    headingFont: row.heading_font,
    bodyFont: row.body_font,
    footerText: row.footer_text,
    blocks: row.blocks || [],
    seoNotes: row.seo_notes,
    revision: row.revision,
    updatedAt: row.updated_at
  };
}

function mapEntityRow(row) {
  return {
    entityType: row.entity_type,
    entityId: row.entity_id,
    issueId: row.issue_id || "",
    isActive: row.is_active,
    updatedAt: row.updated_at,
    ...(row.data || {})
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
    distributionKits: grouped.distribution_kit || [],
    brandKit: (grouped.brand_kit || [])[0] || undefined,
    apiStatus: grouped.api_attribution || []
  };
}

function groupEntityData(rows) {
  return rows.reduce((groups, row) => {
    const type = row.entity_type;
    if (!groups[type]) groups[type] = [];
    groups[type].push({
      ...(row.data || {}),
      entityId: row.entity_id,
      issueId: row.issue_id || row.data?.issueId || ""
    });
    return groups;
  }, {});
}

function normalizeEntityType(value) {
  const type = cleanText(value, 80).toLowerCase().replace(/[ -]+/g, "_");
  if (!ENTITY_TYPES.has(type)) throw new Error("VOY_INVALID_ENTITY_TYPE");
  return type;
}

function inferEntityId(type, item) {
  const keys = {
    article: ["articleId", "article_id"],
    asset: ["assetId", "asset_id"],
    campaign: ["campaignId", "campaign_id"],
    approval: ["approvalId", "approval_id"],
    category: ["categoryId", "category_id"],
    banner: ["bannerId", "banner_id"],
    travel_card: ["cardId", "card_id"],
    brand_kit: ["brandKitId", "brand_kit_id", "name"],
    quality_report: ["reportId", "report_id"],
    distribution_kit: ["kitId", "kit_id"],
    print_package: ["packageId", "package_id"],
    api_attribution: ["attributionId", "attribution_id"]
  };
  for (const key of keys[type] || []) {
    if (item[key]) return item[key];
  }
  return `${type}-${Date.now()}`;
}

function assertQuery(result, stage) {
  if (!result?.error) return;
  const error = new Error(result.error.message || "SUPABASE_QUERY_FAILED");
  error.code = result.error.code || "SUPABASE_QUERY_FAILED";
  error.stage = stage;
  throw error;
}

function throwSafeError(operation, error) {
  const message = error instanceof Error ? error.message : String(error || "");
  const safePrefixes = [
    "VOY_NOT_AUTHENTICATED",
    "VOY_EDITOR_ACCESS_DENIED",
    "VOY_PUBLIC_ORGANIZATION_NOT_CONFIGURED",
    "VOY_ISSUE_NOT_FOUND",
    "VOY_ISSUE_HAS_NO_PAGES",
    "VOY_ARCHIVE_BEFORE_DELETE",
    "VOY_ISSUE_TITLE_REQUIRED",
    "VOY_PAGE_TITLE_REQUIRED",
    "VOY_INVALID_",
    "VOY_DUPLICATE_",
    "VOY_PAGE_BLOCKS_TOO_LARGE"
  ];
  console.error(`[VOY] ${operation} failed.`, {
    code: error?.code || null,
    stage: error?.stage || null,
    message
  });
  if (safePrefixes.some((prefix) => message.includes(prefix))) {
    throw new Error(message.match(/VOY_[A-Z0-9_]+/)?.[0] || message);
  }
  throw new Error("VOY_SERVICE_UNAVAILABLE");
}

function getWixMemberId(member) {
  const value = member?._id || member?.id;
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function displayName(member) {
  const profile = member?.profile || {};
  return (
    [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim() ||
    profile.nickname ||
    member?.loginEmail ||
    "SKANDI Editor"
  );
}

function requiredId(value, field) {
  const id = cleanText(value, 180);
  if (!id || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,179}$/.test(id)) {
    throw new Error(`VOY_INVALID_${String(field).toUpperCase()}`);
  }
  return id;
}

function optionalId(value) {
  return value ? requiredId(value, "ID") : "";
}

function cleanText(value, maxLength = 1000, fallback = "") {
  if (value === null || value === undefined) return fallback;
  return String(value).replace(/\u0000/g, "").trim().slice(0, maxLength);
}

function slugify(value) {
  const slug = cleanText(value, 240)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180);
  if (!slug) throw new Error("VOY_INVALID_SLUG");
  return slug;
}

function cleanDate(value) {
  const text = cleanText(value, 20);
  if (!text) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text.slice(0, 10))) {
    throw new Error("VOY_INVALID_DATE");
  }
  return text.slice(0, 10);
}

function cleanUrl(value) {
  const text = cleanText(value, 3000);
  if (!text) return "";
  try {
    const url = new URL(text);
    if (url.protocol !== "https:") throw new Error("protocol");
    return url.toString();
  } catch (error) {
    throw new Error("VOY_INVALID_URL");
  }
}

function cleanPathOrUrl(value) {
  const text = cleanText(value, 3000);
  if (!text) return "";
  if (text.startsWith("/") && !text.startsWith("//")) return text;
  return cleanUrl(text);
}

function cleanHex(value, fallback) {
  const text = cleanText(value, 10);
  return /^#[0-9a-f]{6}$/i.test(text) ? text.toLowerCase() : fallback;
}

function fontValue(value, fallback) {
  const font = cleanText(value, 80);
  return ALLOWED_FONTS.has(font) ? font : fallback;
}

function enumValue(value, allowed, fallback) {
  const normalized = cleanText(value, 80).toUpperCase();
  return allowed.has(normalized) ? normalized : fallback;
}

function integerInRange(value, min, max, field) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < min || number > max) {
    throw new Error(`VOY_INVALID_${String(field).toUpperCase()}`);
  }
  return number;
}

function stringArray(value, maxItems, maxItemLength) {
  const array = Array.isArray(value)
    ? value
    : String(value || "").split(",");
  return [...new Set(array.map((item) => cleanText(item, maxItemLength)).filter(Boolean))].slice(
    0,
    maxItems
  );
}

function sanitizeJsonObject(value) {
  const cloned = JSON.parse(JSON.stringify(value && typeof value === "object" ? value : {}));
  if (Array.isArray(cloned)) throw new Error("VOY_INVALID_JSON_OBJECT");
  return cloned;
}

function sanitizeJsonArray(value) {
  const cloned = JSON.parse(JSON.stringify(Array.isArray(value) ? value : []));
  return cloned.slice(0, 100);
}
