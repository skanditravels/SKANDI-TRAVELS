import { webMethod, Permissions } from 'wix-web-module';
import { requireInternalAgent, text, writeInternalAudit } from 'backend/RIA/internalAccess.js';
import { restRequest } from 'backend/RIA/supabaseServer.js';

function now() { return new Date().toISOString(); }
function messageMap(row = {}) { const payload = row.payload && typeof row.payload === 'object' ? row.payload : {}; return { id: row.id || '', subject: row.title || '', body: row.body || '', to: row.member_id || '', status: row.status || '', folder: payload.folder || (row.status === 'DRAFT' ? 'Drafts' : 'Sent'), from: payload.from || '', createdAt: row.created_at || '', updatedAt: row.updated_at || '', payload }; }
async function access() { return requireInternalAgent(); }
async function allMessages(limit = 1000) { const rows = await restRequest({ table: 'outbound_messages', query: { select: '*', order: 'updated_at.desc,created_at.desc', limit } }); return (rows || []).map(messageMap); }
async function audit(agent, action, target, after = {}) { await writeInternalAudit({ agent, action: `MAIL_${action}`, target, after }).catch(() => null); }
async function listMessagesForAgent(agent, input = {}) { const folder = text(input.folder || 'Inbox', 80); const all = await allMessages(Math.min(Math.max(Number(input.limit) || 500, 1), 1000)); const messages = all.filter((message) => folder === 'All' || message.folder === folder || (folder === 'Inbox' && message.to.toLowerCase() === String(agent.email || '').toLowerCase())).slice(0, 500); return { ok: true, folder, messages }; }

export const listMailMessages = webMethod(Permissions.SiteMember, async (input = {}) => {
  const { agent } = await access(); return listMessagesForAgent(agent, input);
});

export const getMailMessage = webMethod(Permissions.SiteMember, async (input = {}) => { await access(); const id = text(input.id || input.messageId, 160); if (!id) throw new Error('MAIL_MESSAGE_REQUIRED'); const rows = await restRequest({ table: 'outbound_messages', query: { select: '*', id: `eq.${id}`, limit: 1 } }); const row = rows?.[0]; if (!row) throw new Error('MAIL_MESSAGE_NOT_FOUND'); return { ok: true, message: messageMap(row) }; });

export const getMailBootstrap = webMethod(Permissions.SiteMember, async () => { const { agent, profile } = await access(); const data = await listMessagesForAgent(agent, { folder: 'Inbox', limit: 100 }); return { ...data, profile, apps: [] }; });

export const sendMailMessage = webMethod(Permissions.SiteMember, async (input = {}) => {
  const { agent } = await access(); const to = text(input.to || input.recipient || input.email, 240).toLowerCase(); const body = text(input.body || input.content, 12000); if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) throw new Error('MAIL_RECIPIENT_INVALID'); if (!body) throw new Error('MAIL_BODY_REQUIRED'); const rows = await restRequest({ table: 'outbound_messages', method: 'POST', body: { title: text(input.subject, 500) || '(No subject)', entity_id: `MAIL-${Date.now()}`, member_id: to, status: 'QUEUED', body, active: true, payload: { ...input, channel: 'INTERNAL_MAIL', folder: 'Sent', from: agent.email || agent.sk_id || '', sentBy: agent.id, queuedAt: now() }, created_at: now(), updated_at: now() } }); const saved = rows?.[0] || null; await audit(agent, 'MESSAGE_QUEUED', saved?.id, { to }); return { ok: true, message: messageMap(saved || {}) };
});

export const saveMailDraft = webMethod(Permissions.SiteMember, async (input = {}) => {
  const { agent } = await access(); const id = text(input.id || input.messageId, 160); const body = { title: text(input.subject, 500) || '(No subject)', member_id: text(input.to || input.recipient, 240).toLowerCase() || null, status: 'DRAFT', body: text(input.body || input.content, 12000), active: true, payload: { ...input, channel: 'INTERNAL_MAIL', folder: 'Drafts', from: agent.email || agent.sk_id || '', savedBy: agent.id }, updated_at: now() }; let saved; if (id) { const rows = await restRequest({ table: 'outbound_messages', method: 'PATCH', query: { id: `eq.${id}` }, body }); saved = rows?.[0] || null; } else { const rows = await restRequest({ table: 'outbound_messages', method: 'POST', body: { ...body, entity_id: `DRAFT-${Date.now()}`, created_at: now() } }); saved = rows?.[0] || null; } await audit(agent, 'DRAFT_SAVED', saved?.id); return { ok: true, message: messageMap(saved || {}) };
});

export const updateMailUserState = webMethod(Permissions.SiteMember, async (input = {}) => {
  const { agent } = await access(); const id = text(input.id || input.messageId, 160); if (!id) throw new Error('MAIL_MESSAGE_REQUIRED'); const rows = await restRequest({ table: 'outbound_messages', query: { select: '*', id: `eq.${id}`, limit: 1 } }); const row = rows?.[0]; if (!row) throw new Error('MAIL_MESSAGE_NOT_FOUND'); const payload = { ...(row.payload || {}), userState: { ...((row.payload || {}).userState || {}), [agent.id]: { ...(input.state || {}), updatedAt: now() } } }; const savedRows = await restRequest({ table: 'outbound_messages', method: 'PATCH', query: { id: `eq.${row.id}` }, body: { payload, updated_at: now() } }); const saved = savedRows?.[0] || row; await audit(agent, 'STATE_UPDATED', saved.id); return { ok: true, message: messageMap(saved) };
});

export const getMailDirectory = webMethod(Permissions.SiteMember, async () => { await access(); const rows = await restRequest({ table: 'agent_users', query: { select: 'id,sk_id,email,preferred_name,display_name,first_name,last_name,role,department,active,authorized,portal_access', active: 'eq.true', limit: 1000 } }); const contacts = (rows || []).filter((row) => row.authorized === true && row.portal_access === true).map((row) => ({ id: row.id, skId: row.sk_id || '', email: row.email || '', name: row.preferred_name || row.display_name || [row.first_name, row.last_name].filter(Boolean).join(' '), role: row.role || '', department: row.department || '' })); return { ok: true, contacts }; });
