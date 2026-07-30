import { webMethod, Permissions } from 'wix-web-module';
import { restRequest } from './RIA/supabaseServer.js';

function text(value, max = 1000) { return String(value || '').trim().slice(0, max); }
function now() { return new Date().toISOString(); }
function executionItem(row = {}) { return { id: row.id || '', documentId: row.document_id || row.entity_id || row.id || '', documentType: row.document_type || '', title: row.title || '', fileUrl: row.file_url || '', verificationStatus: row.verification_status || row.status || '' }; }
async function findCareerPacket(email, token) {
  const rows = await restRequest({ table: 'career_document_packets', query: { select: '*', email: `eq.${email}`, access_token: `eq.${token}`, limit: 1 } });
  return rows?.[0] || null;
}
async function findLegacyPacket(email, token) {
  const rows = await restRequest({ table: 'document_packets', query: { select: '*', active: 'eq.true', limit: 1000 } });
  return (rows || []).find((row) => String(row.payload?.email || '').toLowerCase() === email && String(row.payload?.token || '') === token) || null;
}
async function findPacket(input = {}) {
  const email = text(input.email, 240).toLowerCase(); const token = text(input.token, 500);
  if (!email || !token) throw new Error('DOCUMENT_PACKET_ACCESS_REQUIRED');
  const career = await findCareerPacket(email, token);
  const legacy = career ? null : await findLegacyPacket(email, token);
  return { email, token, career, legacy };
}

export const getDocumentPacketForExecution = webMethod(Permissions.Anyone, async (input = {}) => {
  const match = await findPacket(input); const packet = match.career || match.legacy;
  if (!packet) throw new Error('DOCUMENT_PACKET_NOT_FOUND');
  if (String(packet.status || '').toUpperCase() === 'COMPLETED') return { ok: true, completed: true, packet: { id: packet.id, packetId: packet.packet_id || packet.entity_id || packet.id, status: packet.status } };
  const items = match.career
    ? await restRequest({ table: 'career_documents', query: { select: 'id,document_id,document_type,title,file_url,verification_status,payload', candidate_id: `eq.${packet.candidate_id}`, limit: 100 } })
    : await restRequest({ table: 'document_packet_items', query: { select: 'id,title,entity_id,status,body,file_url,payload', entity_id: `eq.${packet.entity_id || packet.id}`, limit: 100 } });
  return { ok: true, completed: false, packet: { id: packet.id, packetId: packet.packet_id || packet.entity_id || packet.id, status: packet.status || 'QUEUED', title: packet.title || packet.payload?.title || 'Document packet', items: (items || []).map(executionItem) } };
});

export const submitDocumentExecution = webMethod(Permissions.Anyone, async (input = {}) => {
  const match = await findPacket(input); const packet = match.career || match.legacy; if (!packet) throw new Error('DOCUMENT_PACKET_NOT_FOUND');
  const acknowledgement = { accepted: input.accepted === true, signerName: text(input.signerName || input.name, 240), signedAt: now(), answers: input.answers && typeof input.answers === 'object' ? input.answers : {} };
  if (acknowledgement.accepted !== true) throw new Error('DOCUMENT_EXECUTION_ACCEPTANCE_REQUIRED');
  if (match.career) {
    await restRequest({ table: 'career_document_packets', method: 'PATCH', query: { id: `eq.${packet.id}` }, body: { status: 'COMPLETED', sent_at: packet.sent_at || now(), payload: { ...(packet.payload || {}), execution: acknowledgement }, updated_at: now() } });
  } else {
    await restRequest({ table: 'document_packets', method: 'PATCH', query: { id: `eq.${packet.id}` }, body: { status: 'COMPLETED', payload: { ...(packet.payload || {}), execution: acknowledgement }, updated_at: now() } });
  }
  const rows = await restRequest({ table: 'document_acknowledgements', method: 'POST', body: { title: packet.title || packet.payload?.title || 'Document acknowledgement', entity_id: packet.packet_id || packet.entity_id || packet.id, member_id: match.email, status: 'SIGNED', body: '', active: true, payload: acknowledgement, created_at: now(), updated_at: now() } });
  return { ok: true, acknowledgementId: rows?.[0]?.id || '', status: 'COMPLETED' };
});
