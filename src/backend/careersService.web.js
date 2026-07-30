import { webMethod, Permissions } from 'wix-web-module';
import { randomInt, randomUUID } from 'crypto';

import { restRequest } from './RIA/supabaseServer.js';
import { text } from './RIA/internalAccess.js';

function code() { return String(randomInt(100000, 1000000)); }
function token() { return `CAP-${randomUUID().replace(/-/g, '')}`; }
function email(value) { return text(value, 240).toLowerCase(); }

function publicJob(row = {}) {
  const payload = row.payload && typeof row.payload === 'object' ? row.payload : {};
  return { id: row.id, positionId: row.position_id || row.id, title: row.title || '', department: row.department || '', location: row.location || '', employmentType: row.employment_type || '', salaryRange: row.salary_range || '', description: row.description || '', ...payload };
}

export const getPublicCareerData = webMethod(Permissions.Anyone, async () => {
  const rows = await restRequest({ table: 'career_positions', query: { select: '*', active: 'eq.true', order: 'updated_at.desc', limit: 200 } });
  return { ok: true, jobs: (rows || []).map(publicJob), jobPostings: (rows || []).map(publicJob) };
});

export const submitCareerApplication = webMethod(Permissions.Anyone, async (input = {}) => {
  const application = input.application && typeof input.application === 'object' ? input.application : input;
  const applicantEmail = email(application.email);
  if (!applicantEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(applicantEmail)) throw new Error('CAREERS_APPLICATION_EMAIL_INVALID');
  const applicantId = text(application.applicantId, 120) || `APP-${Date.now().toString(36).toUpperCase()}`;
  const body = { applicant_id: applicantId, position_id: text(application.positionId || application.jobPostingId, 120) || null, first_name: text(application.firstName, 120) || null, last_name: text(application.lastName, 120) || null, email: applicantEmail, phone: text(application.phone, 80) || null, status: 'NEW', resume_url: text(application.resumeUrl, 1000) || null, cover_letter_url: text(application.coverLetterUrl, 1000) || null, payload: application, updated_at: new Date().toISOString() };
  const existingRows = await restRequest({ table: 'career_applicant_accounts', query: { select: '*', email: `eq.${applicantEmail}`, position_id: `eq.${body.position_id || ''}`, limit: 1 } });
  const existing = existingRows?.[0];
  const rows = existing
    ? await restRequest({ table: 'career_applicant_accounts', method: 'PATCH', query: { id: `eq.${existing.id}` }, body })
    : await restRequest({ table: 'career_applicant_accounts', method: 'POST', body });
  return { ok: true, applicantId: rows?.[0]?.applicant_id || applicantId, status: 'RECEIVED' };
});

export const requestApplicantPortalCode = webMethod(Permissions.Anyone, async (input = {}) => {
  const applicantEmail = email(input.email);
  if (!applicantEmail) throw new Error('CAREERS_PORTAL_EMAIL_REQUIRED');
  const candidates = await restRequest({ table: 'career_applicant_accounts', query: { select: 'id,applicant_id,email', email: `eq.${applicantEmail}`, limit: 1 } });
  const candidate = candidates?.[0];
  if (!candidate) return { ok: true, message: 'If an applicant account exists, a sign-in code will be sent.' };
  const oneTimeCode = code();
  await restRequest({ table: 'career_applicant_access_codes', method: 'POST', body: { title: 'Applicant portal access', entity_id: candidate.applicant_id || candidate.id, member_id: applicantEmail, status: 'ACTIVE', body: oneTimeCode, active: true, payload: { expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString() } } });
  await restRequest({ table: 'outbound_messages', method: 'POST', body: { title: 'SKANDI applicant portal code', entity_id: candidate.applicant_id || candidate.id, member_id: applicantEmail, status: 'QUEUED', body: `Your access code is ${oneTimeCode}. It expires in 15 minutes.`, active: true, payload: { channel: 'EMAIL', purpose: 'APPLICANT_PORTAL_CODE' } } });
  return { ok: true, message: 'If an applicant account exists, a sign-in code will be sent.' };
});

export const verifyApplicantPortalCode = webMethod(Permissions.Anyone, async (input = {}) => {
  const applicantEmail = email(input.email);
  const oneTimeCode = text(input.code, 20);
  if (!applicantEmail || !oneTimeCode) return { ok: false, code: 'INVALID_CODE' };
  const rows = await restRequest({ table: 'career_applicant_access_codes', query: { select: '*', member_id: `eq.${applicantEmail}`, body: `eq.${oneTimeCode}`, status: 'eq.ACTIVE', active: 'eq.true', order: 'created_at.desc', limit: 1 } });
  const access = rows?.[0];
  const expiresAt = access?.payload?.expiresAt ? new Date(access.payload.expiresAt) : null;
  if (!access || (expiresAt && expiresAt.getTime() < Date.now())) return { ok: false, code: 'INVALID_CODE' };
  const sessionToken = token();
  await Promise.all([
    restRequest({ table: 'career_applicant_access_codes', method: 'PATCH', query: { id: `eq.${access.id}` }, body: { active: false, status: 'USED', updated_at: new Date().toISOString() }, prefer: 'return=minimal' }),
    restRequest({ table: 'career_applicant_sessions', method: 'POST', body: { title: 'Applicant portal session', entity_id: sessionToken, member_id: applicantEmail, status: 'ACTIVE', active: true, payload: { candidateId: access.entity_id, expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString() } } }),
  ]);
  return { ok: true, sessionToken };
});

export const getApplicantPortalData = webMethod(Permissions.Anyone, async ({ sessionToken } = {}) => {
  const tokenValue = text(sessionToken, 200);
  const sessions = await restRequest({ table: 'career_applicant_sessions', query: { select: '*', entity_id: `eq.${tokenValue}`, status: 'eq.ACTIVE', active: 'eq.true', limit: 1 } });
  const session = sessions?.[0];
  const expiresAt = session?.payload?.expiresAt ? new Date(session.payload.expiresAt) : null;
  if (!session || (expiresAt && expiresAt.getTime() < Date.now())) throw new Error('CAREERS_PORTAL_SESSION_INVALID');
  const candidateId = session.payload?.candidateId || '';
  const [applicants, packets] = await Promise.all([
    restRequest({ table: 'career_applicant_accounts', query: { select: '*', applicant_id: `eq.${candidateId}`, limit: 1 } }),
    restRequest({ table: 'career_document_packets', query: { select: 'packet_id,status,created_at,updated_at', candidate_id: `eq.${candidateId}`, order: 'created_at.desc', limit: 100 } }).catch(() => []),
  ]);
  const applicant = applicants?.[0] || {};
  return { ok: true, applicant: { applicantId: applicant.applicant_id || '', firstName: applicant.first_name || '', lastName: applicant.last_name || '', email: applicant.email || '', status: applicant.status || '' }, documentRequests: packets || [] };
});
