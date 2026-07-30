import { webMethod, Permissions } from 'wix-web-module';
import { isUuid, requireInternalAgent, text, writeInternalAudit } from '../RIA/internalAccess.js';
import { restRequest } from '../RIA/supabaseServer.js';

function now() { return new Date().toISOString(); }
function key(prefix) { return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`; }
function safeUrl(value) { const url = text(value, 2000); return /^https:\/\//i.test(url) ? url : ''; }
async function requireEditor() { return requireInternalAgent({ capability: 'manage' }); }
async function one(table, id, namedColumn) { if (!id) return null; const query = isUuid(id) ? { select: '*', id: `eq.${id}`, limit: 1 } : { select: '*', [namedColumn]: `eq.${text(id, 160)}`, limit: 1 }; const rows = await restRequest({ table, query }); return rows?.[0] || null; }
async function audit(agent, action, target, after = {}) { await writeInternalAudit({ agent, action: `NEWSROOM_${action}`, target, after }).catch(() => null); }
function categoryMap(row = {}) { return { id: row.id || '', categoryId: row.category_id || row.id || '', title: row.title || '', slug: row.slug || '', active: row.active === true, payload: row.payload || {} }; }
function articleMap(row = {}) { return { id: row.id || '', articleId: row.article_id || row.id || '', categoryId: row.category_id || '', title: row.title || '', excerpt: row.excerpt || '', body: row.body || '', imageUrl: safeUrl(row.image_url), status: row.status || 'DRAFT', publishedAt: row.published_at || '', payload: row.payload || {} }; }

async function newsroomAdminData() {
  const [categories, posts, media, contacts] = await Promise.all([
    restRequest({ table: 'newsroom_categories', query: { select: '*', order: 'title.asc', limit: 500 } }),
    restRequest({ table: 'newsroom_articles', query: { select: '*', order: 'updated_at.desc', limit: 1000 } }),
    restRequest({ table: 'newsroom_media_assets', query: { select: '*', order: 'updated_at.desc', limit: 1000 } }),
    restRequest({ table: 'newsroom_press_contacts', query: { select: '*', order: 'name.asc', limit: 500 } }),
  ]);
  return { ok: true, categories: (categories || []).map(categoryMap), posts: (posts || []).map(articleMap), media: media || [], contacts: contacts || [] };
}

export const listNewsroomAdminData = webMethod(Permissions.SiteMember, async () => {
  await requireEditor();
  return newsroomAdminData();
});

export const getNewsroomAdminBootstrap = webMethod(Permissions.SiteMember, async () => {
  const { profile } = await requireEditor();
  return { ...(await newsroomAdminData()), profile, apps: [] };
});

export const saveNewsroomCategory = webMethod(Permissions.SiteMember, async (input = {}) => {
  const { agent } = await requireEditor(); const item = input.item || input; const categoryId = text(item.categoryId || item.id, 160) || key('CAT'); const existing = await one('newsroom_categories', categoryId, 'category_id'); const body = { category_id: categoryId, title: text(item.title, 240) || 'Untitled category', slug: text(item.slug, 240) || null, active: item.active !== false, payload: { ...(existing?.payload || {}), ...item }, updated_at: now() };
  const rows = existing ? await restRequest({ table: 'newsroom_categories', method: 'PATCH', query: { id: `eq.${existing.id}` }, body }) : await restRequest({ table: 'newsroom_categories', method: 'POST', body: { ...body, created_at: now() } }); const saved = rows?.[0] || existing; await audit(agent, 'CATEGORY_SAVED', saved?.id, { categoryId }); return { ok: true, category: categoryMap(saved || {}) };
});

export const saveNewsroomPost = webMethod(Permissions.SiteMember, async (input = {}) => {
  const { agent } = await requireEditor(); const item = input.item || input; const articleId = text(item.articleId || item.id, 160) || key('NEWS'); const existing = await one('newsroom_articles', articleId, 'article_id'); const body = { article_id: articleId, category_id: text(item.categoryId, 160) || null, title: text(item.title, 500) || 'Untitled post', excerpt: text(item.excerpt, 3000) || null, body: text(item.body || item.content, 50000) || null, image_url: safeUrl(item.imageUrl || item.image_url) || null, status: text(item.status || existing?.status || 'DRAFT', 60).toUpperCase(), published_at: item.publishedAt || existing?.published_at || null, payload: { ...(existing?.payload || {}), ...item }, updated_at: now() };
  const rows = existing ? await restRequest({ table: 'newsroom_articles', method: 'PATCH', query: { id: `eq.${existing.id}` }, body }) : await restRequest({ table: 'newsroom_articles', method: 'POST', body: { ...body, created_at: now() } }); const saved = rows?.[0] || existing; await audit(agent, 'POST_SAVED', saved?.id, { articleId }); return { ok: true, post: articleMap(saved || {}) };
});

export const publishNewsroomPost = webMethod(Permissions.SiteMember, async (input = {}) => {
  const { agent } = await requireEditor(); const id = text(input.id || input.articleId, 160); const existing = await one('newsroom_articles', id, 'article_id'); if (!existing) throw new Error('NEWSROOM_POST_NOT_FOUND'); const rows = await restRequest({ table: 'newsroom_articles', method: 'PATCH', query: { id: `eq.${existing.id}` }, body: { status: 'PUBLISHED', published_at: now(), updated_at: now() } }); const saved = rows?.[0] || existing; await audit(agent, 'POST_PUBLISHED', saved.id); return { ok: true, post: articleMap(saved) };
});

export const archiveNewsroomPost = webMethod(Permissions.SiteMember, async (input = {}) => {
  const { agent } = await requireEditor(); const id = text(input.id || input.articleId, 160); const existing = await one('newsroom_articles', id, 'article_id'); if (!existing) throw new Error('NEWSROOM_POST_NOT_FOUND'); const rows = await restRequest({ table: 'newsroom_articles', method: 'PATCH', query: { id: `eq.${existing.id}` }, body: { status: 'ARCHIVED', updated_at: now() } }); const saved = rows?.[0] || existing; await audit(agent, 'POST_ARCHIVED', saved.id); return { ok: true, post: articleMap(saved) };
});

export const saveNewsroomMediaAsset = webMethod(Permissions.SiteMember, async (input = {}) => {
  const { agent } = await requireEditor(); const item = input.item || input; const assetId = text(item.assetId || item.id, 160) || key('MEDIA'); const existing = await one('newsroom_media_assets', assetId, 'asset_id'); const body = { asset_id: assetId, title: text(item.title, 500) || null, url: safeUrl(item.url || item.fileUrl || item.imageUrl) || null, mime_type: text(item.mimeType || item.mime_type, 120) || null, payload: { ...(existing?.payload || {}), ...item }, updated_at: now() }; const rows = existing ? await restRequest({ table: 'newsroom_media_assets', method: 'PATCH', query: { id: `eq.${existing.id}` }, body }) : await restRequest({ table: 'newsroom_media_assets', method: 'POST', body: { ...body, created_at: now() } }); const saved = rows?.[0] || existing; await audit(agent, 'MEDIA_SAVED', saved?.id, { assetId }); return { ok: true, media: saved || null };
});

export const saveNewsroomPressContact = webMethod(Permissions.SiteMember, async (input = {}) => {
  const { agent } = await requireEditor(); const item = input.item || input; const contactId = text(item.contactId || item.id, 160) || key('PRESS'); const existing = await one('newsroom_press_contacts', contactId, 'contact_id'); const body = { contact_id: contactId, name: text(item.name, 240) || null, email: text(item.email, 240).toLowerCase() || null, phone: text(item.phone, 80) || null, active: item.active !== false, payload: { ...(existing?.payload || {}), ...item }, updated_at: now() }; const rows = existing ? await restRequest({ table: 'newsroom_press_contacts', method: 'PATCH', query: { id: `eq.${existing.id}` }, body }) : await restRequest({ table: 'newsroom_press_contacts', method: 'POST', body: { ...body, created_at: now() } }); const saved = rows?.[0] || existing; await audit(agent, 'PRESS_CONTACT_SAVED', saved?.id, { contactId }); return { ok: true, contact: saved || null };
});
