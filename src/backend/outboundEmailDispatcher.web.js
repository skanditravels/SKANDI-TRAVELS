import { webMethod, Permissions } from 'wix-web-module';
import { getSecret } from 'wix-secrets-backend';
import { fetch } from 'wix-fetch';

import { restRequest } from './RIA/supabaseServer.js';
import { HR_ROLES, requireInternalAgent, text } from './RIA/internalAccess.js';

async function dispatchOne(row, webhookUrl) {
  if (!webhookUrl) return { id: row.id, dispatched: false, reason: 'EMAIL_PROVIDER_NOT_CONFIGURED' };
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: row.id, to: row.member_id, subject: row.title, body: row.body, payload: row.payload || {} }),
  });
  if (!response.ok) throw new Error(`CAREERS_EMAIL_PROVIDER_HTTP_${response.status}`);
  await restRequest({ table: 'outbound_messages', method: 'PATCH', query: { id: `eq.${row.id}` }, body: { status: 'SENT', updated_at: new Date(), payload: { ...(row.payload || {}), dispatchedAt: new Date().toISOString() } }, prefer: 'return=minimal' });
  return { id: row.id, dispatched: true };
}

export const dispatchQueuedCareerEmails = webMethod(Permissions.SiteMember, async (input = {}) => {
  await requireInternalAgent({ roles: HR_ROLES });
  const limit = Math.min(Math.max(Number(input.limit) || 50, 1), 200);
  const [rows, webhookUrl] = await Promise.all([
    restRequest({ table: 'outbound_messages', query: { select: '*', status: 'eq.QUEUED', order: 'created_at.asc', limit } }),
    getSecret('CAREERS_EMAIL_WEBHOOK_URL').catch(() => ''),
  ]);
  const results = [];
  for (const row of rows || []) {
    try {
      results.push(await dispatchOne(row, text(webhookUrl, 1000)));
    } catch (error) {
      await restRequest({ table: 'outbound_messages', method: 'PATCH', query: { id: `eq.${row.id}` }, body: { status: 'FAILED', updated_at: new Date().toISOString(), payload: { ...(row.payload || {}), dispatchError: 'EMAIL_PROVIDER_FAILED' } }, prefer: 'return=minimal' }).catch(() => null);
      results.push({ id: row.id, dispatched: false, reason: 'EMAIL_PROVIDER_FAILED' });
    }
  }
  return { ok: true, providerConfigured: Boolean(webhookUrl), queued: (rows || []).length, results };
});
