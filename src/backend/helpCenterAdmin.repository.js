import { requireInternalAgent, text, writeInternalAudit } from './RIA/internalAccess.js';
import { restRequest } from './RIA/supabaseServer.js';

export const TRAVEL_INFO_TABLES = new Set([
  'travel_info_airports', 'travel_info_airlines', 'travel_info_transfers', 'travel_info_tours',
  'travel_info_tickets', 'travel_info_hotels', 'travel_info_faq', 'travel_info_articles',
]);
function now() { return new Date().toISOString(); }
function key(prefix) { return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`; }
function item(row = {}) { return { id: row.id || '', title: row.title || '', slug: row.slug || '', category: row.category || '', body: row.body || '', imageUrl: row.image_url || '', active: row.active !== false, sortOrder: Number(row.sort_order || 0), payload: row.payload || {}, ...(row.payload && typeof row.payload === 'object' ? row.payload : {}) }; }
function tableFor(input = {}) { const candidate = String(input.table || input.recordType || input.type || 'travel_info_articles'); return TRAVEL_INFO_TABLES.has(candidate) ? candidate : 'travel_info_articles'; }

async function access() { return requireInternalAgent({ capability: 'manage' }); }
async function audit(agent, action, target, after = {}) { await writeInternalAudit({ agent, action: `TRAVEL_INFO_${action}`, target, after }).catch(() => null); }

export async function getTravelInfoAdminDataInternal() {
  const { profile } = await access();
  const pairs = await Promise.all([...TRAVEL_INFO_TABLES].map(async (table) => [table, await restRequest({ table, query: { select: '*', order: 'sort_order.asc,title.asc', limit: 1000 } }).catch(() => [])]));
  const records = {};
  for (const [table, rows] of pairs) records[table] = (rows || []).map(item);
  return { ok: true, profile, apps: [], records, ...records };
}

export async function saveTravelInfoRecordInternal(input = {}) {
  const { agent } = await access(); const record = input.record || input.item || input; const table = tableFor({ ...input, ...record }); const id = text(record.id || record._id, 120); const existing = id ? (await restRequest({ table, query: { select: '*', id: `eq.${id}`, limit: 1 } }))[0] : null;
  const body = { title: text(record.title, 500) || 'Untitled record', slug: text(record.slug, 240) || key('TRAVEL').toLowerCase(), category: text(record.category, 160) || null, body: text(record.body || record.content, 50000) || null, image_url: /^https:\/\//i.test(text(record.imageUrl || record.image_url, 2000)) ? text(record.imageUrl || record.image_url, 2000) : null, active: record.active !== false, sort_order: Number(record.sortOrder ?? record.sort_order) || 0, payload: { ...(existing?.payload || {}), ...record }, updated_at: now() };
  const rows = existing ? await restRequest({ table, method: 'PATCH', query: { id: `eq.${existing.id}` }, body }) : await restRequest({ table, method: 'POST', body: { ...body, created_at: now() } }); const saved = rows?.[0] || existing; await audit(agent, 'RECORD_SAVED', saved?.id, { table }); return { ok: true, table, record: item(saved || {}) };
}

export async function archiveTravelInfoRecordInternal(input = {}) {
  const { agent } = await access(); const table = tableFor(input); const id = text(input.id || input.itemId || input.recordId, 120); if (!id) throw new Error('TRAVEL_INFO_RECORD_REQUIRED'); const rows = await restRequest({ table, method: 'PATCH', query: { id: `eq.${id}` }, body: { active: false, updated_at: now() } }); const saved = rows?.[0] || null; await audit(agent, 'RECORD_ARCHIVED', id, { table }); return { ok: true, table, record: item(saved || {}) };
}

export async function getHelpCenterAdminDataInternal() {
  const base = await getTravelInfoAdminDataInternal();
  const articles = base.records.travel_info_articles || [];
  const topics = base.records.travel_info_faq || [];
  return { ...base, groups: articles.filter((row) => row.category === 'HELP_GROUP' || row.payload?.kind === 'GROUP'), topics, access: { profile: base.profile } };
}

export async function saveHelpCenterGroupInternal(input = {}) {
  const group = input.group || input.item || input; return saveTravelInfoRecordInternal({ table: 'travel_info_articles', item: { ...group, category: 'HELP_GROUP', payload: { ...(group.payload || {}), ...group, kind: 'GROUP' } } });
}
export async function saveHelpCenterTopicInternal(input = {}) {
  const topic = input.topic || input.item || input; return saveTravelInfoRecordInternal({ table: 'travel_info_faq', item: { ...topic, category: text(topic.category || 'HELP_TOPIC', 160), payload: { ...(topic.payload || {}), ...topic, kind: 'TOPIC' } } });
}
export async function archiveHelpCenterGroupInternal(input = {}) { return archiveTravelInfoRecordInternal({ table: 'travel_info_articles', itemId: typeof input === 'object' ? input.itemId || input.id : input }); }
export async function archiveHelpCenterTopicInternal(input = {}) { return archiveTravelInfoRecordInternal({ table: 'travel_info_faq', itemId: typeof input === 'object' ? input.itemId || input.id : input }); }
