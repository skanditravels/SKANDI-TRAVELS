import { webMethod, Permissions } from "wix-web-module";
import wixData from "wix-data";
import { currentMember } from "wix-members-backend";

const CATEGORIES = "NewsroomCategories";
const POSTS = "NewsroomPosts";
const MEDIA = "NewsroomMediaAssets";
const CONTACTS = "NewsroomPressContacts";
const SETTINGS = "NewsroomSettings";
const SUBSCRIPTIONS = "NewsroomSubscriptions";
const AGENTS = "AgentUsers";
const HISTORY = "History";

const EDITOR_ROLES = new Set([
  "SUPER_ADMIN",
  "OWNER",
  "COMPANY_OWNER",
  "ADMIN",
  "NEWSROOM_ADMIN",
  "EDITORIAL_ADMIN",
  "COMMUNICATIONS_MANAGER",
  "MARKETING_MANAGER",
  "PR_MANAGER",
  "HR_ADMIN",
  "HR_MANAGER"
]);

function now() { return new Date(); }
function uid(prefix) { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`.toUpperCase(); }
function arr(value) { return Array.isArray(value) ? value : value ? String(value).split(",").map((x) => x.trim()).filter(Boolean) : []; }
function up(value) { return String(value || "").trim().toUpperCase(); }
function slugify(value) {
  return String(value || "").trim().toLowerCase().normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}
function cleanKey(value) {
  return String(value || "").trim().toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}
function stripHtml(html = "") {
  return String(html || "")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
function safeHtml(html = "") {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/\son\w+\s*=\s*(["']).*?\1/gi, "")
    .replace(/javascript\s*:/gi, "");
}
function displayName(agent = {}) {
  return agent.title || agent.preferredName || [agent.firstName, agent.lastName].filter(Boolean).join(" ") || agent.email || "Editor";
}
function canEditNewsroom(agent = {}) {
  const role = up(agent.role);
  const permissions = arr(agent.permissions).map(up);
  return EDITOR_ROLES.has(role) || [
    "ALL", "ADMIN", "NEWSROOM-CONTROL", "NEWSROOM-ADMIN", "EDITORIAL-ADMIN", "COMMUNICATIONS"
  ].some((p) => permissions.includes(p));
}
function memberEmail(member = {}) {
  return member.loginEmail || member.contactDetails?.emails?.[0] || member.contactDetails?.email || member.email || "";
}

async function findAgent(member) {
  const memberId = member?._id || member?.id || "";
  const email = memberEmail(member);

  if (memberId) {
    const byMember = await wixData.query(AGENTS).eq("wixMemberId", memberId).limit(1).find({ suppressAuth: true }).catch(() => ({ items: [] }));
    if (byMember.items?.length) return byMember.items[0];
  }
  if (email) {
    const byEmail = await wixData.query(AGENTS).eq("email", email).limit(1).find({ suppressAuth: true }).catch(() => ({ items: [] }));
    if (byEmail.items?.length) return byEmail.items[0];
  }
  return null;
}

async function getCurrentAgent() {
  const member = await currentMember.getMember({ fieldsets: ["FULL"] });
  if (!member?._id && !member?.id) throw new Error("Not signed in.");
  const agent = await findAgent(member);
  if (!agent || agent.active === false) throw new Error("Staff profile not found or inactive.");
  return { member, agent };
}

async function log(agent, action, entityType, entityId, details = {}, outcome = "OK") {
  try {
    await wixData.insert(HISTORY, {
      title: `${action} · ${entityType}`,
      eventType: action,
      entityType,
      entityId: String(entityId || ""),
      details,
      outcome,
      skId: agent?.skId || "",
      userName: displayName(agent),
      createdAt: now()
    }, { suppressAuth: true });
  } catch (_) {}
}

function publicCategory(item = {}) {
  return {
    categoryId: item.categoryId,
    title: item.title,
    description: item.description || "",
    sortOrder: item.sortOrder || 999,
    featured: item.featured === true,
    heroVideoUrl: item.heroVideoUrl || "",
    heroImage: item.heroImage || "",
    color: item.color || ""
  };
}
function publicPost(item = {}) {
  return {
    postId: item.postId,
    slug: item.slug,
    title: item.title,
    categoryId: item.categoryId,
    contentType: item.contentType || "Press Release",
    kicker: item.kicker || "",
    summary: item.summary || "",
    bodyHtml: safeHtml(item.bodyHtml || ""),
    bodyPlainText: item.bodyPlainText || stripHtml(item.bodyHtml || ""),
    heroImage: item.heroImage || "",
    heroVideoUrl: item.heroVideoUrl || "",
    thumbnailImage: item.thumbnailImage || item.heroImage || "",
    location: item.location || "",
    authorDisplayName: item.authorDisplayName || "SKANDI Communications",
    publishDate: item.publishDate || null,
    featured: item.featured === true,
    priority: Number(item.priority || 999),
    tags: item.tags || "",
    relatedPostIds: arr(item.relatedPostIds)
  };
}
function publicMedia(item = {}) {
  return {
    assetId: item.assetId,
    title: item.title,
    assetType: item.assetType || "Photo",
    categoryId: item.categoryId || "",
    description: item.description || "",
    fileUrl: item.fileUrl || "",
    previewImage: item.previewImage || "",
    mimeType: item.mimeType || "",
    fileSizeBytes: Number(item.fileSizeBytes || 0),
    downloadName: item.downloadName || item.title || "",
    copyrightOwner: item.copyrightOwner || "SKANDI Group",
    creditLine: item.creditLine || "© SKANDI Group",
    usageRights: item.usageRights || "",
    allowedUsage: arr(item.allowedUsage),
    licenseType: item.licenseType || "Press Use",
    expiryDate: item.expiryDate || null,
    featured: item.featured === true,
    sortOrder: Number(item.sortOrder || 999)
  };
}
function publicContact(item = {}) {
  return {
    contactId: item.contactId,
    name: item.name || item.title,
    roleTitle: item.roleTitle || "",
    region: item.region || "",
    email: item.email || "",
    phone: item.phone || "",
    photo: item.photo || "",
    availabilityText: item.availabilityText || "",
    sortOrder: item.sortOrder || 999
  };
}

async function getPublicSettings() {
  const res = await wixData.query(SETTINGS).eq("active", true).limit(1000).find({ suppressAuth: true }).catch(() => ({ items: [] }));
  const out = {};
  for (const item of res.items || []) out[item.settingKey] = item.valueJson || item.valueText || "";
  return out;
}

export const getPublicNewsroomData = webMethod(Permissions.Anyone, async function () {
  const today = new Date();
  const [categoriesRes, postsRes, mediaRes, contactsRes, settings] = await Promise.all([
    wixData.query(CATEGORIES).eq("active", true).ascending("sortOrder").limit(1000).find({ suppressAuth: true }).catch(() => ({ items: [] })),
    wixData.query(POSTS).eq("active", true).eq("status", "Published").descending("publishDate").limit(1000).find({ suppressAuth: true }).catch(() => ({ items: [] })),
    wixData.query(MEDIA).eq("active", true).ascending("sortOrder").limit(1000).find({ suppressAuth: true }).catch(() => ({ items: [] })),
    wixData.query(CONTACTS).eq("active", true).ascending("sortOrder").limit(100).find({ suppressAuth: true }).catch(() => ({ items: [] })),
    getPublicSettings()
  ]);

  const posts = (postsRes.items || [])
    .filter((p) => !p.embargoUntil || new Date(p.embargoUntil) <= today)
    .map(publicPost);

  return {
    ok: true,
    categories: (categoriesRes.items || []).map(publicCategory),
    posts,
    mediaAssets: (mediaRes.items || []).map(publicMedia),
    pressContacts: (contactsRes.items || []).map(publicContact),
    settings
  };
});

export const subscribeToNewsroom = webMethod(Permissions.Anyone, async function ({ email = "", name = "", organization = "", interests = [] } = {}) {
  const cleanEmail = String(email || "").trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) return { ok: false, error: "Valid email is required." };

  const existing = await wixData.query(SUBSCRIPTIONS).eq("email", cleanEmail).limit(1).find({ suppressAuth: true }).catch(() => ({ items: [] }));
  const item = {
    title: cleanEmail,
    email: cleanEmail,
    name: String(name || "").trim(),
    organization: String(organization || "").trim(),
    interests: arr(interests),
    status: "Subscribed",
    consentText: "Subscribed to SKANDI newsroom updates.",
    updatedAt: now()
  };

  if (existing.items?.length) {
    const saved = await wixData.update(SUBSCRIPTIONS, { ...existing.items[0], ...item }, { suppressAuth: true });
    return { ok: true, subscription: saved, message: "Subscription updated." };
  }
  const saved = await wixData.insert(SUBSCRIPTIONS, { ...item, subscriptionId: uid("NEWS-SUB"), createdAt: now() }, { suppressAuth: true });
  return { ok: true, subscription: saved, message: "Subscribed." };
});

export const getNewsroomAdminBootstrap = webMethod(Permissions.SiteMember, async function () {
  try {
    const { agent } = await getCurrentAgent();
    if (!canEditNewsroom(agent)) {
      await log(agent, "LOAD_NEWSROOM_CONTROL", "System", "", {}, "DENIED");
      return { ok: false, authorized: false, error: "Newsroom Control access required." };
    }
    const data = await listNewsroomAdminData({});
    return {
      ok: true,
      authorized: true,
      profile: { skId: agent.skId || "", name: displayName(agent), role: agent.role || "", base: agent.base || agent.station || "" },
      ...data
    };
  } catch (error) {
    return { ok: false, authorized: false, error: error.message || "Newsroom Control failed to load." };
  }
});

export const listNewsroomAdminData = webMethod(Permissions.SiteMember, async function ({ search = "" } = {}) {
  const { agent } = await getCurrentAgent();
  if (!canEditNewsroom(agent)) throw new Error("Newsroom Control access required.");

  const [categories, posts, media, contacts, settings] = await Promise.all([
    wixData.query(CATEGORIES).ascending("sortOrder").limit(1000).find({ suppressAuth: true }).catch(() => ({ items: [] })),
    wixData.query(POSTS).descending("updatedAt").limit(1000).find({ suppressAuth: true }).catch(() => ({ items: [] })),
    wixData.query(MEDIA).ascending("sortOrder").limit(1000).find({ suppressAuth: true }).catch(() => ({ items: [] })),
    wixData.query(CONTACTS).ascending("sortOrder").limit(1000).find({ suppressAuth: true }).catch(() => ({ items: [] })),
    wixData.query(SETTINGS).ascending("settingKey").limit(1000).find({ suppressAuth: true }).catch(() => ({ items: [] }))
  ]);

  let postItems = posts.items || [];
  const q = String(search || "").toLowerCase().trim();
  if (q) postItems = postItems.filter((p) => [p.title, p.postId, p.categoryId, p.summary, p.tags, p.location, p.status].join(" ").toLowerCase().includes(q));

  return { ok: true, categories: categories.items || [], posts: postItems, mediaAssets: media.items || [], pressContacts: contacts.items || [], settings: settings.items || [] };
});

function normalizeCategory(payload = {}, agent = {}) {
  const title = String(payload.title || "").trim();
  if (!title) throw new Error("Category title is required.");
  return {
    title,
    categoryId: cleanKey(payload.categoryId || title),
    description: String(payload.description || payload.summary || "").trim(),
    sortOrder: Number(payload.sortOrder || 999),
    active: payload.active !== false,
    featured: payload.featured === true,
    heroVideoUrl: String(payload.heroVideoUrl || "").trim(),
    heroImage: String(payload.heroImage || "").trim(),
    color: String(payload.color || "").trim(),
    updatedAt: now(),
    updatedBySkId: agent.skId || ""
  };
}

function normalizePost(payload = {}, agent = {}) {
  const title = String(payload.title || "").trim();
  if (!title) throw new Error("Post title is required.");
  const postId = cleanKey(payload.postId || `news-${Date.now()}`);
  const bodyHtml = safeHtml(payload.bodyHtml || payload.body || payload.content || "");
  const publishDateValue = payload.publishDate || payload.publishAt || payload.publish_at;
  return {
    title,
    postId,
    slug: slugify(payload.slug || title),
    categoryId: cleanKey(payload.categoryId || "press-releases"),
    contentType: String(payload.contentType || payload.type || "Press Release").trim(),
    kicker: String(payload.kicker || "").trim(),
    summary: String(payload.summary || payload.excerpt || "").trim(),
    bodyHtml,
    bodyPlainText: String(payload.bodyPlainText || stripHtml(bodyHtml)).trim(),
    heroImage: String(payload.heroImage || payload.heroImageUrl || payload.imageUrl || "").trim(),
    heroVideoUrl: String(payload.heroVideoUrl || "").trim(),
    thumbnailImage: String(payload.thumbnailImage || payload.heroImage || payload.heroImageUrl || payload.imageUrl || "").trim(),
    location: String(payload.location || "").trim(),
    authorDisplayName: String(payload.authorDisplayName || "SKANDI Communications").trim(),
    publishDate: publishDateValue ? new Date(publishDateValue) : now(),
    embargoUntil: payload.embargoUntil ? new Date(payload.embargoUntil) : null,
    status: String(payload.status || "Draft").replace(/^DRAFT$/i, "Draft").trim(),
    active: payload.active === true,
    featured: payload.featured === true,
    priority: Number(payload.priority || 999),
    tags: payload.tags || "",
    mediaAssetIds: arr(payload.mediaAssetIds),
    relatedPostIds: arr(payload.relatedPostIds),
    seoTitle: payload.seoTitle || title,
    seoDescription: payload.seoDescription || payload.summary || payload.excerpt || "",
    updatedAt: now(),
    updatedBySkId: agent.skId || ""
  };
}

function normalizeMedia(payload = {}, agent = {}) {
  const title = String(payload.title || "").trim();
  if (!title) throw new Error("Media title is required.");
  return {
    title,
    assetId: cleanKey(payload.assetId || title),
    assetType: String(payload.assetType || "Photo").trim(),
    categoryId: cleanKey(payload.categoryId || ""),
    description: String(payload.description || "").trim(),
    fileUrl: String(payload.fileUrl || "").trim(),
    previewImage: String(payload.previewImage || "").trim(),
    mimeType: String(payload.mimeType || "").trim(),
    fileSizeBytes: Number(payload.fileSizeBytes || 0),
    downloadName: String(payload.downloadName || title).trim(),
    copyrightOwner: String(payload.copyrightOwner || "SKANDI Group").trim(),
    creditLine: String(payload.creditLine || "© SKANDI Group").trim(),
    usageRights: String(payload.usageRights || "").trim(),
    allowedUsage: arr(payload.allowedUsage),
    licenseType: String(payload.licenseType || "Press Use").trim(),
    expiryDate: payload.expiryDate ? new Date(payload.expiryDate) : null,
    active: payload.active !== false,
    featured: payload.featured === true,
    sortOrder: Number(payload.sortOrder || 999),
    updatedAt: now(),
    updatedBySkId: agent.skId || ""
  };
}

function normalizeContact(payload = {}) {
  const name = String(payload.name || payload.title || "").trim();
  if (!name) throw new Error("Contact name is required.");
  return {
    title: name,
    contactId: cleanKey(payload.contactId || name),
    name,
    roleTitle: String(payload.roleTitle || payload.position || "").trim(),
    region: String(payload.region || payload.market || "").trim(),
    email: String(payload.email || "").trim(),
    phone: String(payload.phone || "").trim(),
    photo: String(payload.photo || "").trim(),
    availabilityText: String(payload.availabilityText || payload.notes || payload.summary || "").trim(),
    sortOrder: Number(payload.sortOrder || 999),
    active: payload.active !== false,
    updatedAt: now()
  };
}

async function upsert(collectionId, payload, idField, normalized) {
  if (payload._id) {
    const existing = await wixData.get(collectionId, payload._id, { suppressAuth: true });
    return wixData.update(collectionId, { ...existing, ...normalized }, { suppressAuth: true });
  }
  const res = await wixData.query(collectionId).eq(idField, normalized[idField]).limit(1).find({ suppressAuth: true });
  if (res.items?.length) return wixData.update(collectionId, { ...res.items[0], ...normalized }, { suppressAuth: true });
  return wixData.insert(collectionId, { ...normalized, createdAt: now() }, { suppressAuth: true });
}

async function resolvePost({ _id = "", postId = "" } = {}) {
  if (_id) {
    try { return await wixData.get(POSTS, _id, { suppressAuth: true }); } catch (_) {}
  }
  const cleanPostId = cleanKey(postId);
  if (cleanPostId) {
    const result = await wixData.query(POSTS).eq("postId", cleanPostId).limit(1).find({ suppressAuth: true });
    if (result.items?.length) return result.items[0];
  }
  throw new Error("Newsroom post not found.");
}

export const saveNewsroomCategory = webMethod(Permissions.SiteMember, async function (payload = {}) {
  const { agent } = await getCurrentAgent();
  if (!canEditNewsroom(agent)) return { ok: false, error: "Newsroom Control access required." };
  try {
    const saved = await upsert(CATEGORIES, payload, "categoryId", normalizeCategory(payload, agent));
    await log(agent, "SAVE_CATEGORY", "NewsroomCategory", saved.categoryId, { _id: saved._id });
    return { ok: true, category: saved, message: "Category saved." };
  } catch (error) { return { ok: false, error: error.message || "Category save failed." }; }
});

export const saveNewsroomPost = webMethod(Permissions.SiteMember, async function (payload = {}) {
  const { agent } = await getCurrentAgent();
  if (!canEditNewsroom(agent)) return { ok: false, error: "Newsroom Control access required." };
  try {
    const saved = await upsert(POSTS, payload, "postId", normalizePost(payload, agent));
    await log(agent, "SAVE_POST", "NewsroomPost", saved.postId, { _id: saved._id, status: saved.status });
    return { ok: true, post: saved, message: "Post saved." };
  } catch (error) { return { ok: false, error: error.message || "Post save failed." }; }
});

export const publishNewsroomPost = webMethod(Permissions.SiteMember, async function (input = {}) {
  const { agent } = await getCurrentAgent();
  if (!canEditNewsroom(agent)) return { ok: false, error: "Newsroom Control access required." };
  try {
    const existing = await resolvePost(input);
    const saved = await wixData.update(POSTS, {
      ...existing,
      status: "Published",
      active: true,
      publishDate: existing.publishDate || now(),
      updatedAt: now(),
      updatedBySkId: agent.skId || ""
    }, { suppressAuth: true });
    await log(agent, "PUBLISH_POST", "NewsroomPost", saved.postId, { _id: saved._id });
    return { ok: true, post: saved, message: "Post published." };
  } catch (error) { return { ok: false, error: error.message || "Post publish failed." }; }
});

export const archiveNewsroomPost = webMethod(Permissions.SiteMember, async function (input = {}) {
  const { agent } = await getCurrentAgent();
  if (!canEditNewsroom(agent)) return { ok: false, error: "Newsroom Control access required." };
  try {
    const existing = await resolvePost(input);
    const saved = await wixData.update(POSTS, {
      ...existing,
      status: "Archived",
      active: false,
      updatedAt: now(),
      updatedBySkId: agent.skId || ""
    }, { suppressAuth: true });
    await log(agent, "ARCHIVE_POST", "NewsroomPost", saved.postId, { _id: saved._id });
    return { ok: true, post: saved, message: "Post archived." };
  } catch (error) { return { ok: false, error: error.message || "Post archive failed." }; }
});

export const saveNewsroomMediaAsset = webMethod(Permissions.SiteMember, async function (payload = {}) {
  const { agent } = await getCurrentAgent();
  if (!canEditNewsroom(agent)) return { ok: false, error: "Newsroom Control access required." };
  try {
    const saved = await upsert(MEDIA, payload, "assetId", normalizeMedia(payload, agent));
    await log(agent, "SAVE_MEDIA", "NewsroomMediaAsset", saved.assetId, { _id: saved._id });
    return { ok: true, media: saved, message: "Media asset saved." };
  } catch (error) { return { ok: false, error: error.message || "Media save failed." }; }
});

export const saveNewsroomPressContact = webMethod(Permissions.SiteMember, async function (payload = {}) {
  const { agent } = await getCurrentAgent();
  if (!canEditNewsroom(agent)) return { ok: false, error: "Newsroom Control access required." };
  try {
    const saved = await upsert(CONTACTS, payload, "contactId", normalizeContact(payload));
    await log(agent, "SAVE_CONTACT", "NewsroomPressContact", saved.contactId, { _id: saved._id });
    return { ok: true, contact: saved, message: "Press contact saved." };
  } catch (error) { return { ok: false, error: error.message || "Contact save failed." }; }
});
