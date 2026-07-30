import { webMethod, Permissions } from 'wix-web-module';
import { restRequest } from './RIA/supabaseServer.js';

function text(value, max = 1000) { return String(value || '').trim().slice(0, max); }
function id() { return `CLM-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`; }

export const processIncomingClaim = webMethod(Permissions.Anyone, async (input = {}) => {
  const firstName = text(input.firstName, 120); const lastName = text(input.lastName, 120); const email = text(input.dynamicData?.contactEmail || input.email, 240).toLowerCase(); const message = text(input.userMessage || input.message, 12000);
  if (!firstName || !lastName || !message) return { success: false, error: 'CLAIM_REQUIRED_FIELDS_MISSING' };
  const claimId = id(); const rows = await restRequest({ table: 'customer_support_requests', method: 'POST', body: { member_id: null, email: email || null, name: `${firstName} ${lastName}`.trim(), category: text(input.issue || 'TRAVEL_CLAIM', 120), subject: `${text(input.airline, 120) || 'Travel'} claim ${claimId}`, message, status: 'RECEIVED', priority: 'NORMAL', payload: { claimId, airline: text(input.airline, 120), membershipStatus: text(input.status, 120), dynamicData: input.dynamicData && typeof input.dynamicData === 'object' ? input.dynamicData : {}, submittedAt: new Date().toISOString() }, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } });
  return { success: true, claimId: rows?.[0]?.id || claimId, autoApproved: false, status: 'RECEIVED' };
});
