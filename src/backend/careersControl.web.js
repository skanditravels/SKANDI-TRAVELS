import { webMethod, Permissions } from 'wix-web-module';
import { randomUUID } from 'crypto';

import { restRequest } from './RIA/supabaseServer.js';
import { HR_ROLES, requireInternalAgent, text, upper, writeInternalAudit } from './RIA/internalAccess.js';

function now() { return new Date().toISOString(); }
function id(prefix) { return `${prefix}-${randomUUID().replace(/-/g, '').slice(0, 16).toUpperCase()}`; }
function itemOf(input = {}) { return input?.item && typeof input.item === 'object' ? input.item : input || {}; }
function isUuid(value) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || '')); }
function dateOnly(value) {
  const result = String(value || '').slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(result) ? result : '';
}
function addDays(date, days) {
  const parsed = dateOnly(date);
  if (!parsed) return '';
  const [year, month, day] = parsed.split('-').map(Number);
  const value = new Date(Date.UTC(year, month - 1, day + Number(days || 0)));
  return value.toISOString().slice(0, 10);
}
function dayDistance(from, to) {
  const start = dateOnly(from);
  const end = dateOnly(to);
  if (!start || !end) return 0;
  return Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86400000);
}
function sensitiveKey(key) {
  return /(token|secret|password|authorization|api[_-]?key|service[_-]?role)/i.test(String(key || ''));
}
function safeClientValue(value, depth = 0) {
  if (depth > 5 || value === null || value === undefined) return null;
  if (Array.isArray(value)) return value.map((item) => safeClientValue(item, depth + 1));
  if (typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !sensitiveKey(key))
    .map(([key, item]) => [key, safeClientValue(item, depth + 1)]));
}

async function requireRecruiter() {
  return requireInternalAgent({ roles: HR_ROLES });
}

async function audit(agent, action, entityId, payload = {}) {
  await Promise.all([
    restRequest({
      table: 'career_audit_log', method: 'POST',
      body: {
        action: text(action, 120),
        entity_id: text(entityId, 120) || null,
        actor_agent_user_id: agent.id,
        actor_sk_id: agent.sk_id || null,
        payload,
        created_at: now(),
      },
      prefer: 'return=minimal',
    }),
    writeInternalAudit({ agent, action: `CAREERS_${action}`, target: entityId || null, after: payload }),
  ]);
}

function candidateMap(row = {}) {
  const payload = safeClientValue(row.payload && typeof row.payload === 'object' ? row.payload : {}) || {};
  return {
    ...payload,
    _id: row.id || '',
    id: row.id || '',
    candidateId: row.applicant_id || row.id || '',
    applicantId: row.applicant_id || row.id || '',
    firstName: row.first_name || payload.firstName || '',
    lastName: row.last_name || payload.lastName || '',
    email: row.email || '',
    phone: row.phone || '',
    positionId: row.position_id || payload.positionId || '',
    status: row.status || payload.status || 'NEW',
    stage: payload.stage || row.status || 'NEW',
    resumeUrl: row.resume_url || payload.resumeUrl || '',
    coverLetterUrl: row.cover_letter_url || payload.coverLetterUrl || '',
  };
}

function jobMap(row = {}) {
  const payload = safeClientValue(row.payload && typeof row.payload === 'object' ? row.payload : {}) || {};
  return {
    ...payload,
    _id: row.id || '',
    id: row.id || '',
    jobPostingId: row.position_id || row.id || '',
    positionId: row.position_id || row.id || '',
    title: row.title || '',
    department: row.department || '',
    location: row.location || '',
    employmentType: row.employment_type || '',
    salaryRange: row.salary_range || '',
    description: row.description || '',
    active: row.active === true,
    status: payload.status || (row.active ? 'PUBLISHED' : 'DRAFT'),
  };
}

function candidateLookup(rows = []) {
  const lookup = new Map();
  for (const row of rows || []) {
    if (row?.id) lookup.set(String(row.id), String(row.id));
    if (row?.applicant_id) lookup.set(String(row.applicant_id), String(row.id || row.applicant_id));
  }
  return lookup;
}

function displayCandidateId(rawCandidateId, lookup) {
  const key = String(rawCandidateId || '');
  return lookup.get(key) || key;
}

function scopedMap(row = {}, lookup) {
  const payload = safeClientValue(row.payload && typeof row.payload === 'object' ? row.payload : {}) || {};
  return {
    ...payload,
    _id: row.id || '',
    id: row.id || '',
    candidateId: displayCandidateId(row.candidate_id, lookup),
    applicantId: row.candidate_id || '',
  };
}

function historyMap(row = {}, lookup) {
  return {
    ...scopedMap(row, lookup),
    startDate: dateOnly(row.start_date),
    endDate: dateOnly(row.end_date),
    verificationStatus: row.verification_status || 'PENDING',
    status: row.payload?.status || row.verification_status || 'PENDING',
  };
}

function documentMap(row = {}, lookup) {
  return {
    ...scopedMap(row, lookup),
    documentId: row.document_id || row.id || '',
    documentType: row.document_type || 'OTHER',
    title: row.title || '',
    fileUrl: row.file_url || '',
    verificationStatus: row.verification_status || 'REQUESTED',
    status: row.payload?.status || row.verification_status || 'REQUESTED',
  };
}

function vettingMap(row = {}, lookup) {
  return {
    ...scopedMap(row, lookup),
    vettingId: row.vetting_id || row.id || '',
    status: row.status || 'STARTED',
    requestedAt: row.requested_at || row.created_at || '',
  };
}

function packetMap(row = {}, lookup) {
  const payload = safeClientValue(row.payload && typeof row.payload === 'object' ? row.payload : {}) || {};
  return {
    _id: row.id || '',
    id: row.id || '',
    packetId: row.packet_id || row.id || '',
    candidateId: displayCandidateId(row.candidate_id, lookup),
    applicantId: row.candidate_id || '',
    email: row.email || '',
    name: text(payload.name || payload.packetName || payload.title, 240) || 'Document packet',
    status: row.status || 'QUEUED',
    resendCount: Number(row.resend_count || 0),
    createdAt: row.created_at || '',
    updatedAt: row.updated_at || '',
  };
}

function interviewMap(row = {}, lookup) {
  return {
    ...scopedMap(row, lookup),
    interviewId: row.interview_id || row.id || '',
    type: row.interview_type || 'INTERVIEW',
    scheduledAt: row.scheduled_at || '',
    status: row.status || 'SCHEDULED',
  };
}

function trainingMap(row = {}, lookup) {
  return {
    ...scopedMap(row, lookup),
    trainingRecordId: row.training_record_id || row.id || '',
    course: row.course || '',
    validUntil: dateOnly(row.valid_until),
    completedAt: row.completed_at || '',
    status: row.status || 'PENDING',
  };
}

function onboardingMap(row = {}, lookup) {
  return {
    ...scopedMap(row, lookup),
    taskId: row.task_id || row.id || '',
    taskName: row.task_name || '',
    dueAt: row.due_at || '',
    completedAt: row.completed_at || '',
    status: row.status || 'OPEN',
  };
}

function gapMap(row = {}, lookup) {
  const payload = safeClientValue(row.payload && typeof row.payload === 'object' ? row.payload : {}) || {};
  return {
    ...payload,
    _id: row.id || '',
    id: row.id || '',
    gapId: row.id || '',
    candidateId: displayCandidateId(row.candidate_id, lookup),
    applicantId: row.candidate_id || '',
    startDate: dateOnly(row.start_date),
    endDate: dateOnly(row.end_date),
    gapDays: Number(row.gap_days || 0),
    status: row.status || 'OPEN',
    previousHistoryId: row.previous_history_id || '',
    nextHistoryId: row.next_history_id || '',
  };
}

function mailboxMap(row = {}, lookup) {
  return {
    _id: row.id || '',
    id: row.id || '',
    messageId: row.message_key || row.id || '',
    candidateId: displayCandidateId(row.candidate_id, lookup),
    applicantId: row.candidate_id || '',
    direction: row.direction || 'INBOUND',
    subject: row.subject || '',
    from: row.from_address || '',
    email: row.from_address || '',
    latestSnippet: text(row.body, 320),
    receivedAt: row.received_at || row.created_at || '',
  };
}

function outboundMap(row = {}) {
  return {
    _id: row.id || '',
    id: row.id || '',
    entityId: row.entity_id || '',
    to: row.member_id || '',
    email: row.member_id || '',
    subject: row.title || '',
    status: row.status || 'QUEUED',
    createdAt: row.created_at || '',
    updatedAt: row.updated_at || '',
  };
}

function integrationMap(row = {}) {
  const payload = safeClientValue(row.payload && typeof row.payload === 'object' ? row.payload : {}) || {};
  return {
    ...payload,
    _id: row.id || '',
    id: row.id || '',
    name: row.integration_key || payload.name || 'Integration',
    system: row.integration_key || payload.system || 'Integration',
    status: row.status || payload.status || 'UNKNOWN',
    checkedAt: row.checked_at || row.created_at || '',
    message: text(payload.message || payload.description, 1000),
  };
}

function auditMap(row = {}) {
  const payload = safeClientValue(row.payload && typeof row.payload === 'object' ? row.payload : {}) || {};
  return {
    _id: row.id || '',
    id: row.id || '',
    entityId: row.entity_id || '',
    eventType: row.action || 'CAREERS_EVENT',
    actor: row.actor_sk_id || '',
    actorName: row.actor_sk_id || '',
    createdAt: row.created_at || '',
    message: text(payload.message || payload.description || payload.status, 1000),
  };
}

function settingsMap(rows = []) {
  const output = {};
  for (const row of rows || []) {
    const value = safeClientValue(row.setting_value ?? row.payload);
    if (row.setting_key === 'CAREERS_CONTROL' && value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(output, value);
    } else if (row.setting_key) {
      output[row.setting_key] = value;
    }
  }
  return output;
}

async function selectOne(table, column, value) {
  if (!value) return null;
  const rows = await restRequest({ table, query: { select: '*', [column]: `eq.${text(value, 160)}`, limit: 1 } });
  return rows?.[0] || null;
}

async function findCandidate(candidateKey) {
  const key = text(candidateKey, 160);
  if (!key) return null;
  const primaryColumn = isUuid(key) ? 'id' : 'applicant_id';
  let candidate = await selectOne('career_applicant_accounts', primaryColumn, key);
  if (!candidate) candidate = await selectOne('career_applicant_accounts', primaryColumn === 'id' ? 'applicant_id' : 'id', key);
  return candidate;
}

async function requireCandidate(candidateKey) {
  const candidate = await findCandidate(candidateKey);
  if (!candidate) throw new Error('CAREERS_CANDIDATE_NOT_FOUND');
  return { candidate, candidateId: candidate.applicant_id || candidate.id, uiCandidateId: candidate.id || candidate.applicant_id };
}

async function writeOutboundMessage({ entityId, title, body, email, payload = {} }) {
  const rows = await restRequest({
    table: 'outbound_messages', method: 'POST',
    body: {
      title: text(title, 240),
      entity_id: text(entityId, 120) || null,
      member_id: text(email, 240) || null,
      status: 'QUEUED',
      body: text(body, 8000),
      active: true,
      payload: { channel: 'EMAIL', purpose: 'CAREERS_DOCUMENT_PACKET', ...payload },
      created_at: now(),
      updated_at: now(),
    },
  });
  return rows?.[0] || null;
}

export const getCareersBootstrap = webMethod(Permissions.SiteMember, async (input = {}) => {
  await requireRecruiter();
  const limit = Math.min(Math.max(Number(input.limit) || 500, 1), 1000);
  const [
    candidates,
    jobs,
    histories,
    documents,
    vettings,
    packets,
    settings,
    snapshots,
    auditRows,
    interviews,
    trainingRecords,
    onboardingTasks,
    historyGaps,
    outboundMessages,
    mailboxMessages,
    templates,
    packetItems,
  ] = await Promise.all([
    restRequest({ table: 'career_applicant_accounts', query: { select: '*', order: 'updated_at.desc', limit } }),
    restRequest({ table: 'career_positions', query: { select: '*', order: 'updated_at.desc', limit } }),
    restRequest({ table: 'career_candidate_history', query: { select: '*', order: 'updated_at.desc', limit } }),
    restRequest({ table: 'career_documents', query: { select: '*', order: 'updated_at.desc', limit } }),
    restRequest({ table: 'career_sra_vetting', query: { select: '*', order: 'updated_at.desc', limit } }),
    restRequest({ table: 'career_document_packets', query: { select: '*', order: 'updated_at.desc', limit } }),
    restRequest({ table: 'career_settings', query: { select: '*', order: 'setting_key.asc', limit: 200 } }),
    restRequest({ table: 'career_integration_snapshots', query: { select: '*', order: 'checked_at.desc', limit: 100 } }),
    restRequest({ table: 'career_audit_log', query: { select: '*', order: 'created_at.desc', limit: 500 } }),
    restRequest({ table: 'career_interviews', query: { select: '*', order: 'scheduled_at.desc', limit } }),
    restRequest({ table: 'career_training_records', query: { select: '*', order: 'updated_at.desc', limit } }),
    restRequest({ table: 'career_onboarding_tasks', query: { select: '*', order: 'due_at.asc', limit } }),
    restRequest({ table: 'career_history_gaps', query: { select: '*', status: 'eq.OPEN', order: 'start_date.desc', limit } }),
    restRequest({ table: 'outbound_messages', query: { select: 'id,title,entity_id,member_id,status,created_at,updated_at,payload', 'payload->>purpose': 'eq.CAREERS_DOCUMENT_PACKET', order: 'created_at.desc', limit } }),
    restRequest({ table: 'career_mailbox_messages', query: { select: 'id,message_key,candidate_id,direction,subject,body,from_address,received_at,created_at', order: 'received_at.desc', limit } }),
    restRequest({ table: 'document_templates', query: { select: 'id,title,status,body,file_url,active,created_at,updated_at', order: 'updated_at.desc', limit: 200 } }),
    restRequest({ table: 'document_packet_items', query: { select: 'id,title,entity_id,status,file_url,active,created_at,updated_at', order: 'updated_at.desc', limit } }),
  ]);
  const lookup = candidateLookup(candidates || []);
  const names = new Map();
  for (const candidate of candidates || []) {
    const name = `${candidate.first_name || ''} ${candidate.last_name || ''}`.trim() || candidate.email || '';
    if (candidate.id) names.set(String(candidate.id), name);
    if (candidate.applicant_id) names.set(String(candidate.applicant_id), name);
  }
  const withCandidateName = (row) => ({
    ...row,
    candidateName: row.candidateName || names.get(String(row.candidateId || row.applicantId || '')) || '',
  });
  const mappedVetting = (vettings || []).map((row) => vettingMap(row, lookup));
  return {
    ok: true,
    candidates: (candidates || []).map(candidateMap),
    jobPostings: (jobs || []).map(jobMap),
    jobs: (jobs || []).map(jobMap),
    historySegments: (histories || []).map((row) => withCandidateName(historyMap(row, lookup))),
    documents: (documents || []).map((row) => withCandidateName(documentMap(row, lookup))),
    sraVetting: mappedVetting.map(withCandidateName),
    vettingCases: mappedVetting.map(withCandidateName),
    documentPackets: (packets || []).map((row) => withCandidateName(packetMap(row, lookup))),
    documentPacketItems: (packetItems || []).map((row) => ({
      _id: row.id || '',
      id: row.id || '',
      packetId: row.entity_id || '',
      title: row.title || '',
      status: row.status || '',
      fileUrl: row.file_url || '',
      active: row.active !== false,
    })),
    documentTemplates: (templates || []).map((row) => ({
      _id: row.id || '',
      id: row.id || '',
      title: row.title || '',
      status: row.status || '',
      description: text(row.body, 1000),
      fileUrl: row.file_url || '',
      active: row.active !== false,
    })),
    settings: settingsMap(settings || []),
    integrationSnapshots: (snapshots || []).map(integrationMap),
    audit: (auditRows || []).map(auditMap),
    auditEvents: (auditRows || []).map(auditMap),
    interviews: (interviews || []).map((row) => withCandidateName(interviewMap(row, lookup))),
    trainingRecords: (trainingRecords || []).map((row) => withCandidateName(trainingMap(row, lookup))),
    onboardingTasks: (onboardingTasks || []).map((row) => withCandidateName(onboardingMap(row, lookup))),
    historyGaps: (historyGaps || []).map((row) => withCandidateName(gapMap(row, lookup))),
    outboundMessages: (outboundMessages || []).map(outboundMap),
    mailboxThreads: (mailboxMessages || []).map((row) => withCandidateName(mailboxMap(row, lookup))),
    mailboxMessages: (mailboxMessages || []).map((row) => withCandidateName(mailboxMap(row, lookup))),
    views: { dashboard: {}, applicants: {}, postings: {} },
  };
});

export const saveCandidate = webMethod(Permissions.SiteMember, async (input = {}) => {
  const { agent } = await requireRecruiter();
  const item = itemOf(input);
  const email = text(item.email, 240).toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('CAREERS_CANDIDATE_EMAIL_INVALID');
  let existing = item._id || item.id ? await selectOne('career_applicant_accounts', 'id', item._id || item.id) : null;
  const requestedCandidateId = text(item.candidateId || item.applicantId, 120);
  if (!existing && requestedCandidateId) existing = await selectOne('career_applicant_accounts', 'applicant_id', requestedCandidateId);
  const candidateId = requestedCandidateId || existing?.applicant_id || id('CAN');
  const body = {
    applicant_id: candidateId,
    wix_member_id: text(item.wixMemberId, 120) || null,
    position_id: text(item.positionId || item.jobPostingId, 120) || null,
    first_name: text(item.firstName, 120) || null,
    last_name: text(item.lastName, 120) || null,
    email,
    phone: text(item.phone, 80) || null,
    status: upper(item.stage || item.status || 'NEW', 80),
    resume_url: text(item.resumeUrl, 1000) || null,
    cover_letter_url: text(item.coverLetterUrl, 1000) || null,
    payload: {
      ...(existing?.payload || {}),
      ...item,
      candidateId,
      stage: upper(item.stage || item.status || existing?.status || 'NEW', 80),
    },
    updated_at: now(),
  };
  const rows = existing
    ? await restRequest({ table: 'career_applicant_accounts', method: 'PATCH', query: { id: `eq.${existing.id}` }, body })
    : await restRequest({ table: 'career_applicant_accounts', method: 'POST', body });
  const saved = rows?.[0] || existing;
  await audit(agent, existing ? 'CANDIDATE_UPDATED' : 'CANDIDATE_CREATED', saved?.id || candidateId, { candidateId: saved?.applicant_id || candidateId });
  return { ok: true, candidate: candidateMap(saved) };
});

export const saveJobPosting = webMethod(Permissions.SiteMember, async (input = {}) => {
  const { agent } = await requireRecruiter();
  const item = itemOf(input);
  const title = text(item.title || item.jobTitle, 240);
  if (!title) throw new Error('CAREERS_JOB_TITLE_REQUIRED');
  let existing = item._id || item.id ? await selectOne('career_positions', 'id', item._id || item.id) : null;
  const requestedPositionId = text(item.jobPostingId || item.positionId, 120);
  if (!existing && requestedPositionId) existing = await selectOne('career_positions', 'position_id', requestedPositionId);
  const positionId = requestedPositionId || existing?.position_id || id('JOB');
  const body = {
    position_id: positionId,
    title,
    department: text(item.department, 160) || null,
    location: text(item.location || item.station, 160) || null,
    employment_type: text(item.employmentType, 120) || null,
    salary_range: text(item.salaryRange, 240) || null,
    description: text(item.description, 12000) || null,
    active: item.active === true || upper(item.status) === 'PUBLISHED',
    payload: { ...(existing?.payload || {}), ...item, status: upper(item.status || (item.active ? 'PUBLISHED' : 'DRAFT'), 80) },
    updated_at: now(),
  };
  const rows = existing
    ? await restRequest({ table: 'career_positions', method: 'PATCH', query: { id: `eq.${existing.id}` }, body })
    : await restRequest({ table: 'career_positions', method: 'POST', body });
  const saved = rows?.[0] || existing;
  await audit(agent, existing ? 'JOB_UPDATED' : 'JOB_CREATED', saved?.id || positionId, { positionId: saved?.position_id || positionId });
  return { ok: true, jobPosting: jobMap(saved) };
});

export const publishJobPosting = webMethod(Permissions.SiteMember, async (input = {}) => {
  const { agent } = await requireRecruiter();
  const item = itemOf(input);
  const key = text(item._id || item.id || item.jobPostingId || item.positionId, 120);
  const existing = await selectOne('career_positions', isUuid(key) ? 'id' : 'position_id', key);
  if (!existing) throw new Error('CAREERS_JOB_NOT_FOUND');
  const rows = await restRequest({
    table: 'career_positions',
    method: 'PATCH',
    query: { id: `eq.${existing.id}` },
    body: {
      active: true,
      payload: { ...(existing.payload || {}), ...item, status: 'PUBLISHED', publishedAt: now() },
      updated_at: now(),
    },
  });
  const saved = rows?.[0] || existing;
  await audit(agent, 'JOB_PUBLISHED', saved.id, { positionId: saved.position_id });
  return { ok: true, jobPosting: jobMap(saved) };
});

export const moveCandidateStage = webMethod(Permissions.SiteMember, async (input = {}) => {
  const { agent } = await requireRecruiter();
  const candidateKey = text(input.candidateId || input.id || input._id, 120);
  const stage = upper(input.targetStage || input.stage || input.toStage || input.status, 80);
  if (!candidateKey || !stage) throw new Error('CAREERS_STAGE_INPUT_REQUIRED');
  const { candidate, candidateId } = await requireCandidate(candidateKey);
  const rows = await restRequest({
    table: 'career_applicant_accounts',
    method: 'PATCH',
    query: { id: `eq.${candidate.id}` },
    body: {
      status: stage,
      payload: { ...(candidate.payload || {}), stage, stageChangedAt: now(), stageChangedBy: agent.id },
      updated_at: now(),
    },
  });
  const saved = rows?.[0] || candidate;
  await audit(agent, 'CANDIDATE_STAGE_MOVED', saved.id, { candidateId, stage });
  return { ok: true, candidate: candidateMap(saved) };
});

function historyGap(previous = {}, current = {}) {
  const previousEnd = dateOnly(previous.end_date);
  const nextStart = dateOnly(current.start_date);
  const distance = dayDistance(previousEnd, nextStart);
  const gapDays = Math.max(0, distance - 1);
  if (!previousEnd || !nextStart || gapDays <= 30) return null;
  return {
    previousHistoryId: previous.id || null,
    nextHistoryId: current.id || null,
    startDate: addDays(previousEnd, 1),
    endDate: addDays(nextStart, -1),
    gapDays,
  };
}

export const detectHistoryGaps = webMethod(Permissions.SiteMember, async (input = {}) => {
  const { agent } = await requireRecruiter();
  const key = text(typeof input === 'object' ? input.candidateId || input.id || input._id : input, 120);
  const { candidate, candidateId } = await requireCandidate(key);
  const rows = await restRequest({
    table: 'career_candidate_history',
    query: { select: '*', candidate_id: `eq.${candidateId}`, order: 'start_date.asc', limit: 500 },
  });
  const existingRows = await restRequest({
    table: 'career_history_gaps',
    query: { select: '*', candidate_id: `eq.${candidateId}`, limit: 500 },
  });
  const existingByKey = new Map((existingRows || []).map((row) => [row.gap_key, row]));
  const detected = [];
  for (let index = 1; index < (rows || []).length; index += 1) {
    const gap = historyGap(rows[index - 1], rows[index]);
    if (!gap) continue;
    const gapKey = `${candidateId}:${gap.previousHistoryId || ''}:${gap.nextHistoryId || ''}`;
    const body = {
      gap_key: gapKey,
      candidate_id: candidateId,
      previous_history_id: gap.previousHistoryId,
      next_history_id: gap.nextHistoryId,
      start_date: gap.startDate || null,
      end_date: gap.endDate || null,
      gap_days: gap.gapDays,
      status: 'OPEN',
      payload: { candidateId, candidateName: `${candidate.first_name || ''} ${candidate.last_name || ''}`.trim(), ...gap },
      updated_at: now(),
    };
    const existing = existingByKey.get(gapKey);
    const saved = existing
      ? (await restRequest({ table: 'career_history_gaps', method: 'PATCH', query: { id: `eq.${existing.id}` }, body }))?.[0] || existing
      : (await restRequest({ table: 'career_history_gaps', method: 'POST', body }))?.[0];
    if (saved) detected.push(saved);
  }
  await audit(agent, 'HISTORY_GAPS_DETECTED', candidate.id, { candidateId, gapCount: detected.length });
  const lookup = candidateLookup([candidate]);
  return { ok: true, candidateId: candidate.id, gaps: detected.map((row) => gapMap(row, lookup)) };
});

export const createHistorySegment = webMethod(Permissions.SiteMember, async (input = {}) => {
  const { agent } = await requireRecruiter();
  const item = itemOf(input);
  const { candidate, candidateId } = await requireCandidate(item.candidateId || item.applicantId || item.id || item._id);
  const key = text(item.historySegmentId || item.segmentId || item._id || item.id, 120);
  const existing = key && isUuid(key) ? await selectOne('career_candidate_history', 'id', key) : null;
  const body = {
    candidate_id: candidateId,
    start_date: dateOnly(item.startDate || item.start_date) || null,
    end_date: dateOnly(item.endDate || item.end_date) || null,
    verification_status: upper(item.verificationStatus || item.status || existing?.verification_status || 'DRAFT', 80),
    payload: {
      ...(existing?.payload || {}),
      ...item,
      employer: text(item.employer || item.organization || item.title, 240) || 'New history segment',
      status: upper(item.status || existing?.verification_status || 'DRAFT', 80),
    },
    updated_at: now(),
  };
  const rows = existing
    ? await restRequest({ table: 'career_candidate_history', method: 'PATCH', query: { id: `eq.${existing.id}` }, body })
    : await restRequest({ table: 'career_candidate_history', method: 'POST', body });
  const saved = rows?.[0] || existing;
  await audit(agent, existing ? 'HISTORY_SEGMENT_UPDATED' : 'HISTORY_SEGMENT_CREATED', saved?.id || '', { candidateId });
  return { ok: true, segment: historyMap(saved, candidateLookup([candidate])) };
});

export const resolveHistoryGap = webMethod(Permissions.SiteMember, async (input = {}) => {
  const { agent } = await requireRecruiter();
  const item = itemOf(input);
  const { candidate, candidateId } = await requireCandidate(item.candidateId || item.applicantId || item.id || item._id);
  let gap = item.gapId && isUuid(item.gapId) ? await selectOne('career_history_gaps', 'id', item.gapId) : null;
  if (!gap) {
    const rows = await restRequest({
      table: 'career_history_gaps',
      query: {
        select: '*',
        candidate_id: `eq.${candidateId}`,
        start_date: `eq.${dateOnly(item.startDate || item.start_date)}`,
        end_date: `eq.${dateOnly(item.endDate || item.end_date)}`,
        limit: 1,
      },
    });
    gap = rows?.[0] || null;
  }
  if (!gap) throw new Error('CAREERS_HISTORY_GAP_NOT_FOUND');
  const rows = await restRequest({
    table: 'career_history_gaps',
    method: 'PATCH',
    query: { id: `eq.${gap.id}` },
    body: {
      status: 'RESOLVED',
      resolved_by_agent_user_id: agent.id,
      resolved_at: now(),
      resolution_note: text(item.resolutionNote || item.note, 2000) || null,
      payload: { ...(gap.payload || {}), resolutionNote: text(item.resolutionNote || item.note, 2000) || '' },
      updated_at: now(),
    },
  });
  const saved = rows?.[0] || gap;
  await audit(agent, 'HISTORY_GAP_RESOLVED', saved.id, { candidateId });
  return { ok: true, gap: gapMap(saved, candidateLookup([candidate])) };
});

export const startSraVetting = webMethod(Permissions.SiteMember, async (input = {}) => {
  const { agent } = await requireRecruiter();
  const { candidate, candidateId } = await requireCandidate(input.candidateId || input.id || input._id);
  const vettingId = id('SRA');
  const rows = await restRequest({
    table: 'career_sra_vetting',
    method: 'POST',
    body: {
      vetting_id: vettingId,
      candidate_id: candidateId,
      status: 'STARTED',
      requested_by_agent_user_id: agent.id,
      requested_at: now(),
      payload: safeClientValue(input) || {},
    },
  });
  const saved = rows?.[0] || null;
  await audit(agent, 'SRA_VETTING_STARTED', saved?.id || vettingId, { candidateId, vettingId });
  return { ok: true, vetting: vettingMap(saved, candidateLookup([candidate])) };
});

export const verifyDocument = webMethod(Permissions.SiteMember, async (input = {}) => {
  const { agent } = await requireRecruiter();
  const idValue = text(typeof input === 'object' ? input.documentId || input.id || input._id : input, 120);
  if (!idValue) throw new Error('CAREERS_DOCUMENT_REQUIRED');
  const document = await selectOne('career_documents', isUuid(idValue) ? 'id' : 'document_id', idValue);
  if (!document) throw new Error('CAREERS_DOCUMENT_NOT_FOUND');
  const rows = await restRequest({
    table: 'career_documents',
    method: 'PATCH',
    query: { id: `eq.${document.id}` },
    body: {
      verification_status: 'VERIFIED',
      verified_by_agent_user_id: agent.id,
      verified_at: now(),
      updated_at: now(),
    },
  });
  const saved = rows?.[0] || document;
  const candidate = await findCandidate(saved.candidate_id);
  await audit(agent, 'DOCUMENT_VERIFIED', saved.id, { documentId: saved.document_id || saved.id });
  return { ok: true, document: documentMap(saved, candidateLookup(candidate ? [candidate] : [])) };
});

export const verifyHistorySegment = webMethod(Permissions.SiteMember, async (input = {}) => {
  const { agent } = await requireRecruiter();
  const segmentId = text(input.segmentId || input.historySegmentId || input.id || input._id, 120);
  if (!segmentId) throw new Error('CAREERS_HISTORY_SEGMENT_REQUIRED');
  const segment = await selectOne('career_candidate_history', 'id', segmentId);
  if (!segment) throw new Error('CAREERS_HISTORY_SEGMENT_NOT_FOUND');
  const rows = await restRequest({
    table: 'career_candidate_history',
    method: 'PATCH',
    query: { id: `eq.${segment.id}` },
    body: {
      verification_status: 'VERIFIED',
      verified_by_agent_user_id: agent.id,
      verified_at: now(),
      updated_at: now(),
    },
  });
  const saved = rows?.[0] || segment;
  const candidate = await findCandidate(saved.candidate_id);
  await audit(agent, 'HISTORY_SEGMENT_VERIFIED', saved.id, { candidateId: saved.candidate_id });
  return { ok: true, segment: historyMap(saved, candidateLookup(candidate ? [candidate] : [])) };
});

export const createDocumentUploadRequest = webMethod(Permissions.SiteMember, async (input = {}) => {
  const { agent } = await requireRecruiter();
  const { candidate, candidateId } = await requireCandidate(input.candidateId || input.applicantId || input.id || input._id);
  const documentId = id('DOC');
  const rows = await restRequest({
    table: 'career_documents',
    method: 'POST',
    body: {
      document_id: documentId,
      candidate_id: candidateId,
      document_type: text(input.documentType || input.type, 120) || 'OTHER',
      title: text(input.title, 240) || 'Document upload requested',
      verification_status: 'REQUESTED',
      requested_by_agent_user_id: agent.id,
      payload: safeClientValue(input) || {},
    },
  });
  const saved = rows?.[0] || null;
  await audit(agent, 'DOCUMENT_UPLOAD_REQUESTED', saved?.id || documentId, { candidateId, documentId });
  return { ok: true, document: documentMap(saved, candidateLookup([candidate])) };
});

export const createDocumentPacketForCandidate = webMethod(Permissions.SiteMember, async (input = {}) => {
  const { agent } = await requireRecruiter();
  const { candidate, candidateId } = await requireCandidate(input.candidateId || input.applicantId || input.id || input._id);
  const packetId = id('PKT');
  const token = randomUUID().replace(/-/g, '');
  const rows = await restRequest({
    table: 'career_document_packets',
    method: 'POST',
    body: {
      packet_id: packetId,
      candidate_id: candidateId,
      email: candidate.email,
      status: 'QUEUED',
      access_token: token,
      created_by_agent_user_id: agent.id,
      payload: { name: 'SKANDI document packet', candidateId },
    },
  });
  const packet = rows?.[0] || null;
  await writeOutboundMessage({
    entityId: packetId,
    title: 'SKANDI document packet',
    body: 'A document packet is ready for your secure completion.',
    email: candidate.email,
    payload: { packetId, token, candidateId, executionPath: '/careers/documents' },
  });
  await audit(agent, 'DOCUMENT_PACKET_CREATED', packet?.id || packetId, { candidateId, packetId });
  return { ok: true, packet: packetMap(packet, candidateLookup([candidate])) };
});

export const resendDocumentPacket = webMethod(Permissions.SiteMember, async (input = {}) => {
  const { agent } = await requireRecruiter();
  const packetKey = text(input.packetId || input.id || input._id, 120);
  const packet = await selectOne('career_document_packets', isUuid(packetKey) ? 'id' : 'packet_id', packetKey);
  if (!packet) throw new Error('CAREERS_PACKET_NOT_FOUND');
  const rows = await restRequest({
    table: 'career_document_packets',
    method: 'PATCH',
    query: { id: `eq.${packet.id}` },
    body: {
      status: 'QUEUED',
      sent_at: now(),
      resend_count: Number(packet.resend_count || 0) + 1,
      updated_at: now(),
    },
  });
  const saved = rows?.[0] || packet;
  await writeOutboundMessage({
    entityId: saved.packet_id,
    title: 'SKANDI document packet reminder',
    body: 'Your secure document packet is awaiting completion.',
    email: saved.email,
    payload: { packetId: saved.packet_id, token: saved.access_token, candidateId: saved.candidate_id, executionPath: '/careers/documents' },
  });
  const candidate = await findCandidate(saved.candidate_id);
  await audit(agent, 'DOCUMENT_PACKET_RESENT', saved.id, { packetId: saved.packet_id });
  return { ok: true, packet: packetMap(saved, candidateLookup(candidate ? [candidate] : [])) };
});

export const saveCareerInterview = webMethod(Permissions.SiteMember, async (input = {}) => {
  const { agent } = await requireRecruiter();
  const item = itemOf(input);
  const { candidate, candidateId } = await requireCandidate(item.candidateId || item.applicantId || item.id || item._id);
  const recordId = text(item._id || item.id, 120);
  let existing = recordId && isUuid(recordId) ? await selectOne('career_interviews', 'id', recordId) : null;
  const requestedInterviewId = text(item.interviewId, 120);
  if (!existing && requestedInterviewId) existing = await selectOne('career_interviews', 'interview_id', requestedInterviewId);
  const interviewId = requestedInterviewId || existing?.interview_id || id('INT');
  const body = {
    interview_id: interviewId,
    candidate_id: candidateId,
    interview_type: upper(item.type || item.interviewType || 'INTERVIEW', 120),
    scheduled_at: item.scheduledAt || item.date || null,
    status: upper(item.status || existing?.status || 'SCHEDULED', 80),
    owner_agent_user_id: agent.id,
    payload: safeClientValue(item) || {},
    updated_at: now(),
  };
  const rows = existing
    ? await restRequest({ table: 'career_interviews', method: 'PATCH', query: { id: `eq.${existing.id}` }, body })
    : await restRequest({ table: 'career_interviews', method: 'POST', body });
  const saved = rows?.[0] || existing;
  await audit(agent, existing ? 'INTERVIEW_UPDATED' : 'INTERVIEW_CREATED', saved?.id || interviewId, { candidateId, interviewId });
  return { ok: true, interview: interviewMap(saved, candidateLookup([candidate])) };
});

export const saveCareerTrainingRecord = webMethod(Permissions.SiteMember, async (input = {}) => {
  const { agent } = await requireRecruiter();
  const item = itemOf(input);
  const { candidate, candidateId } = await requireCandidate(item.candidateId || item.applicantId || item.id || item._id);
  const recordId = text(item._id || item.id, 120);
  let existing = recordId && isUuid(recordId) ? await selectOne('career_training_records', 'id', recordId) : null;
  const requestedTrainingRecordId = text(item.trainingRecordId, 120);
  if (!existing && requestedTrainingRecordId) existing = await selectOne('career_training_records', 'training_record_id', requestedTrainingRecordId);
  const trainingRecordId = requestedTrainingRecordId || existing?.training_record_id || id('TRN');
  const course = text(item.course || item.trainingName || item.title, 240);
  if (!course) throw new Error('CAREERS_TRAINING_COURSE_REQUIRED');
  const body = {
    training_record_id: trainingRecordId,
    candidate_id: candidateId,
    course,
    status: upper(item.status || existing?.status || 'PENDING', 80),
    valid_until: dateOnly(item.validUntil || item.expiresAt || item.expiryDate) || null,
    completed_at: item.completedAt || null,
    owner_agent_user_id: agent.id,
    payload: safeClientValue(item) || {},
    updated_at: now(),
  };
  const rows = existing
    ? await restRequest({ table: 'career_training_records', method: 'PATCH', query: { id: `eq.${existing.id}` }, body })
    : await restRequest({ table: 'career_training_records', method: 'POST', body });
  const saved = rows?.[0] || existing;
  await audit(agent, existing ? 'TRAINING_UPDATED' : 'TRAINING_CREATED', saved?.id || trainingRecordId, { candidateId, trainingRecordId });
  return { ok: true, trainingRecord: trainingMap(saved, candidateLookup([candidate])) };
});

export const saveCareerOnboardingTask = webMethod(Permissions.SiteMember, async (input = {}) => {
  const { agent } = await requireRecruiter();
  const item = itemOf(input);
  const { candidate, candidateId } = await requireCandidate(item.candidateId || item.applicantId || item.id || item._id);
  const recordId = text(item._id || item.id, 120);
  let existing = recordId && isUuid(recordId) ? await selectOne('career_onboarding_tasks', 'id', recordId) : null;
  const requestedTaskId = text(item.taskId, 120);
  if (!existing && requestedTaskId) existing = await selectOne('career_onboarding_tasks', 'task_id', requestedTaskId);
  const taskId = requestedTaskId || existing?.task_id || id('ONB');
  const taskName = text(item.taskName || item.title, 240);
  if (!taskName) throw new Error('CAREERS_ONBOARDING_TASK_REQUIRED');
  const body = {
    task_id: taskId,
    candidate_id: candidateId,
    task_name: taskName,
    status: upper(item.status || existing?.status || 'OPEN', 80),
    due_at: item.dueAt || item.dueDate || null,
    completed_at: item.completedAt || null,
    owner_agent_user_id: agent.id,
    payload: safeClientValue(item) || {},
    updated_at: now(),
  };
  const rows = existing
    ? await restRequest({ table: 'career_onboarding_tasks', method: 'PATCH', query: { id: `eq.${existing.id}` }, body })
    : await restRequest({ table: 'career_onboarding_tasks', method: 'POST', body });
  const saved = rows?.[0] || existing;
  await audit(agent, existing ? 'ONBOARDING_TASK_UPDATED' : 'ONBOARDING_TASK_CREATED', saved?.id || taskId, { candidateId, taskId });
  return { ok: true, onboardingTask: onboardingMap(saved, candidateLookup([candidate])) };
});

export const scheduleCareerMaintenance = webMethod(Permissions.SiteMember, async (input = {}) => {
  const { agent } = await requireRecruiter();
  const item = itemOf(input);
  const maintenanceId = text(item.maintenanceId || item.id, 120) || id('MNT');
  const confirmed = item.confirmed === true;
  const rows = await restRequest({
    table: 'career_maintenance_schedule',
    method: 'POST',
    body: {
      maintenance_id: maintenanceId,
      status: confirmed ? 'CONFIRMED' : 'REQUESTED',
      scheduled_at: item.scheduledAt || item.windowStart || null,
      confirmed_at: confirmed ? now() : null,
      requested_by_agent_user_id: agent.id,
      payload: safeClientValue(item) || {},
    },
  });
  const saved = rows?.[0] || null;
  await audit(agent, confirmed ? 'MAINTENANCE_CONFIRMED' : 'MAINTENANCE_REQUESTED', saved?.id || maintenanceId, { maintenanceId, confirmed });
  return {
    ok: true,
    maintenance: {
      id: saved?.id || '',
      maintenanceId: saved?.maintenance_id || maintenanceId,
      status: saved?.status || (confirmed ? 'CONFIRMED' : 'REQUESTED'),
      scheduledAt: saved?.scheduled_at || null,
    },
    message: confirmed
      ? 'Maintenance request confirmed and recorded; no production maintenance was started automatically.'
      : 'Maintenance request recorded; confirm an approved maintenance window before any operational change.',
  };
});

export const saveSettings = webMethod(Permissions.SiteMember, async (input = {}) => {
  const { agent } = await requireRecruiter();
  const item = itemOf(input);
  const settingKey = text(item.settingKey || item.key || item._id || item.id, 120) || 'CAREERS_CONTROL';
  const existing = await selectOne('career_settings', 'setting_key', settingKey);
  const settingValue = item.value ?? item.settingValue ?? item;
  const body = {
    setting_key: settingKey,
    setting_value: safeClientValue(settingValue) || {},
    payload: safeClientValue(item) || {},
    updated_by_agent_user_id: agent.id,
    updated_at: now(),
  };
  const rows = existing
    ? await restRequest({ table: 'career_settings', method: 'PATCH', query: { id: `eq.${existing.id}` }, body })
    : await restRequest({ table: 'career_settings', method: 'POST', body });
  const saved = rows?.[0] || existing;
  await audit(agent, 'SETTINGS_SAVED', settingKey, {});
  return { ok: true, setting: { id: saved?.id || '', settingKey, value: safeClientValue(saved?.setting_value ?? settingValue) } };
});

export const testCareerIntegrations = webMethod(Permissions.SiteMember, async () => {
  const { agent } = await requireRecruiter();
  const snapshot = {
    checkedAt: now(),
    services: {
      database: 'OK',
      outboundMailbox: 'QUEUED',
      inboundMailbox: 'PENDING_CONFIGURATION',
    },
  };
  const rows = await restRequest({
    table: 'career_integration_snapshots',
    method: 'POST',
    body: {
      integration_key: 'CAREERS_CONTROL',
      status: 'OK',
      checked_at: now(),
      payload: snapshot,
      created_by_agent_user_id: agent.id,
    },
  });
  await audit(agent, 'INTEGRATIONS_TESTED', rows?.[0]?.id || '', snapshot);
  return { ok: true, snapshot: integrationMap(rows?.[0] || snapshot) };
});

export const exportAuditPackage = webMethod(Permissions.SiteMember, async (input = {}) => {
  await requireRecruiter();
  const rows = await restRequest({
    table: 'career_audit_log',
    query: { select: '*', order: 'created_at.desc', limit: Math.min(Math.max(Number(input.limit) || 5000, 1), 10000) },
  });
  const mapped = (rows || []).map(auditMap);
  const header = ['created_at', 'action', 'entity_id', 'actor_sk_id', 'message'];
  const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const csv = [
    header.join(','),
    ...mapped.map((row) => [
      row.createdAt,
      row.eventType,
      row.entityId,
      row.actor,
      row.message,
    ].map(escape).join(',')),
  ].join('\n');
  return {
    ok: true,
    fileName: `careers-audit-${new Date().toISOString().slice(0, 10)}.csv`,
    csv,
    count: mapped.length,
  };
});
