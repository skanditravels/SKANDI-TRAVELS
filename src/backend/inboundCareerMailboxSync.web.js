import { webMethod, Permissions } from 'wix-web-module';
import { getSecret } from 'wix-secrets-backend';
import { fetch } from 'wix-fetch';

import { restRequest } from './RIA/supabaseServer.js';
import { HR_ROLES, requireInternalAgent, text } from './RIA/internalAccess.js';

export const syncCareerMailboxReplies = webMethod(Permissions.SiteMember, async (input = {}) => {
  const { agent } = await requireInternalAgent({ roles: HR_ROLES });
  const webhookUrl = text(await getSecret('CAREERS_MAILBOX_SYNC_URL').catch(() => ''), 1000);
  if (!webhookUrl) return { ok: true, providerConfigured: false, imported: 0, messages: [] };
  const response = await fetch(webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ limit: Math.min(Math.max(Number(input.limit) || 100, 1), 500) }) });
  if (!response.ok) throw new Error(`CAREERS_MAILBOX_SYNC_HTTP_${response.status}`);
  const data = await response.json().catch(() => ({}));
  const messages = Array.isArray(data?.messages) ? data.messages : [];
  const imported = [];
  for (const message of messages.slice(0, 500)) {
    const rows = await restRequest({ table: 'career_mailbox_messages', method: 'POST', body: { message_key: text(message.id || message.messageId, 200), candidate_id: text(message.candidateId, 120) || null, direction: 'INBOUND', subject: text(message.subject, 500) || null, body: text(message.body, 12000) || null, from_address: text(message.from, 240) || null, received_at: message.receivedAt || new Date().toISOString(), payload: message, created_by_agent_user_id: agent.id } });
    imported.push(rows?.[0] || null);
  }
  return { ok: true, providerConfigured: true, imported: imported.filter(Boolean).length, messages: imported.filter(Boolean) };
});
