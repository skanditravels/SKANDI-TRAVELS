import { currentMember } from 'wix-members-backend';
import { secrets } from 'wix-secrets-backend.v2';
import { elevate } from 'wix-auth';
import Pusher from 'pusher';
import { findAgentByMemberOrEmail, isAgentAuthorized } from './RIA/staffPortalAuth.repository.js';
import { restRequest } from './RIA/supabaseServer.js';

const getSecretValue = elevate(secrets.getSecretValue);
function text(value, max = 12000) { return String(value || '').trim().slice(0, max); }
async function requireAgent() {
  const member = await currentMember.getMember({ fieldsets: ['FULL'] }).catch(() => null);
  const agent = await findAgentByMemberOrEmail({ memberId: member?._id || member?.id || '', email: member?.loginEmail || member?.email || member?.contactDetails?.emails?.[0] || '' });
  if (!agent || !isAgentAuthorized(agent)) throw new Error('STAFF_ACCESS_DENIED');
  return agent;
}
async function pusherClient() {
  const [appId, key, secret, cluster] = await Promise.all(['PUSHER_APP_ID', 'PUSHER_KEY', 'PUSHER_SECRET', 'PUSHER_CLUSTER'].map(async (name) => String(await getSecretValue(name) || '').trim()));
  if (!appId || !key || !secret || !cluster) throw new Error('PUSHER_NOT_CONFIGURED');
  return new Pusher({ appId, key, secret, cluster, useTLS: true });
}

export async function insertMessageToPostgres(input = {}) {
  const agent = await requireAgent(); const caseId = text(input.caseId, 160); const message = text(input.text || input.message, 12000); if (!caseId || !message) return { success: false, error: 'SUPPORT_MESSAGE_REQUIRED' }; const rows = await restRequest({ table: 'customer_support_messages', method: 'POST', body: { message_id: `AGT-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, case_id: caseId, member_id: null, wix_member_id: null, sender_type: 'Agent', sender_name: agent.preferred_name || agent.display_name || agent.email || agent.sk_id, message, channel: 'CustomerServiceCenter', payload: { attachmentUrls: Array.isArray(input.attachmentUrls) ? input.attachmentUrls.slice(0, 10) : [], agentId: agent.id }, created_at: new Date().toISOString() } }); return { success: true, messageId: rows?.[0]?.id || '' };
}

export async function triggerPusherEvent(channel, eventName, payload = {}) {
  await requireAgent(); const safeChannel = text(channel, 200); const safeEvent = text(eventName, 120); if (!/^private-case-[A-Za-z0-9_-]+$/.test(safeChannel) || safeEvent !== 'new-message') return { success: false, error: 'PUSHER_EVENT_NOT_ALLOWED' }; const client = await pusherClient(); await client.trigger(safeChannel, safeEvent, { sender: text(payload.sender, 240), text: text(payload.text, 12000), type: text(payload.type, 40) || 'agent' }); return { success: true };
}
