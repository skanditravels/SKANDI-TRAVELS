import { webMethod, Permissions } from 'wix-web-module';
import { restRequest } from '../RIA/supabaseServer.js';

function text(value, max = 1000) { return String(value || '').trim().slice(0, max); }
function safeUrl(value) { return /^https:\/\//i.test(text(value)) ? text(value) : ''; }
function mapArticle(row = {}) { return { id: row.id || '', articleId: row.article_id || row.id || '', categoryId: row.category_id || '', title: row.title || '', excerpt: row.excerpt || '', body: row.body || '', imageUrl: safeUrl(row.image_url), publishedAt: row.published_at || '', payload: row.payload || {} }; }

export const getPublicNewsroomData = webMethod(Permissions.Anyone, async () => {
  const [categories, articles] = await Promise.all([
    restRequest({ table: 'newsroom_categories', query: { select: '*', active: 'eq.true', order: 'title.asc', limit: 200 } }),
    restRequest({ table: 'newsroom_articles', query: { select: '*', status: 'eq.PUBLISHED', order: 'published_at.desc,updated_at.desc', limit: 500 } }),
  ]);
  return { ok: true, categories: (categories || []).map((row) => ({ id: row.id, categoryId: row.category_id || row.id, title: row.title || '', slug: row.slug || '', payload: row.payload || {} })), articles: (articles || []).map(mapArticle) };
});

export const subscribeToNewsroom = webMethod(Permissions.Anyone, async (input = {}) => {
  const email = text(input.email, 240).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('NEWSROOM_EMAIL_INVALID');
  const existing = await restRequest({ table: 'customer_newsletter_subscribers', query: { select: '*', email: `eq.${email}`, limit: 1 } });
  const body = { email, first_name: text(input.firstName, 120) || null, last_name: text(input.lastName, 120) || null, source: 'NEWSROOM', status: 'SUBSCRIBED', consent: input.consent !== false, subscribed_at: new Date().toISOString(), payload: { ...input }, updated_at: new Date().toISOString() };
  if (existing?.[0]) await restRequest({ table: 'customer_newsletter_subscribers', method: 'PATCH', query: { id: `eq.${existing[0].id}` }, body });
  else await restRequest({ table: 'customer_newsletter_subscribers', method: 'POST', body: { ...body, created_at: new Date().toISOString() } });
  return { ok: true, message: 'Subscription saved.' };
});
