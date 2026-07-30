import { webMethod, Permissions } from 'wix-web-module';
import { currentMember } from 'wix-members-backend';
import { restRequest } from '../RIA/supabaseServer.js';

function text(value, max = 1000) { return String(value || '').trim().slice(0, max); }
function mapPolicy(row = {}) { const payload = row.payload && typeof row.payload === 'object' ? row.payload : {}; return { id: row.id || '', policyId: row.entity_id || row.id || '', title: row.title || '', body: row.body || '', fileUrl: row.file_url || '', status: row.status || '', active: row.active === true, type: payload.type || payload.policyType || '', version: payload.version || '', ...payload }; }
async function publicPolicies() { const rows = await restRequest({ table: 'policy_documents', query: { select: '*', active: 'eq.true', order: 'updated_at.desc', limit: 500 } }); return (rows || []).filter((row) => ['PUBLISHED', 'PUBLIC', 'ACTIVE', ''].includes(String(row.status || '').toUpperCase())).map(mapPolicy); }

export const getPublicLegalHubPayload = webMethod(Permissions.Anyone, async () => ({ ok: true, documents: await publicPolicies() }));
async function publicLegalDocument(input = {}) {
  const type = text(input.type || input.policyType || input.id, 120).toLowerCase();
  const documents = await publicPolicies();
  const document = documents.find((item) => [item.id, item.policyId, item.type].map((value) => String(value || '').toLowerCase()).includes(type)) || null;
  if (!document) throw new Error('LEGAL_DOCUMENT_NOT_FOUND');
  return { ok: true, document };
}
export const getPublicLegalDocument = webMethod(Permissions.Anyone, publicLegalDocument);
export const getPolicyAcknowledgementPacket = webMethod(Permissions.Anyone, async (input = {}) => {
  const result = await publicLegalDocument(input);
  return { ok: true, packet: { policy: result.document, acknowledgementRequired: true } };
});
export const submitPublicPolicyAcknowledgement = webMethod(Permissions.Anyone, async (input = {}) => {
  const policy = await publicLegalDocument(input);
  const member = await currentMember.getMember().catch(() => null);
  const rows = await restRequest({ table: 'policy_acknowledgments', method: 'POST', body: { title: policy.document.title, entity_id: policy.document.policyId, member_id: member?._id || member?.id || text(input.email, 240) || null, status: 'ACKNOWLEDGED', body: '', active: true, payload: { policyId: policy.document.policyId, version: policy.document.version || '', email: text(input.email, 240).toLowerCase(), acknowledgedAt: new Date().toISOString() }, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } });
  return { ok: true, acknowledgementId: rows?.[0]?.id || '' };
});
