// /src/backend/SKANDI_CORE/careers.js
// SKANDI Careers Hub — B-011.1 canonical public recruiting/applicant core.

import {
  restRequest,
  storageCreateSignedUploadUrl,
  storageCreateSignedReadUrl,
  storageGetObjectInfo,
  storageUploadBase64Object
} from "backend/SKANDI_CORE/supabaseServer";
import { createHash, randomBytes, randomInt, randomUUID } from "crypto";

export const CAREERS_VERSION = "B-011.1";

const PRIVATE_BUCKET = "skandi-private-assets";
const CODE_TTL_MS = 15 * 60 * 1000;
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const UPLOAD_TTL_MS = 2 * 60 * 60 * 1000;
const MAX_APPLICATION_FILE_BYTES = 10 * 1024 * 1024;
const MAX_SIGNATURE_BYTES = 1536 * 1024;

const clean = (value, max = 6000) => String(value ?? "").trim().slice(0, max);
const lower = (value, max = 6000) => clean(value, max).toLowerCase();
const upper = (value, max = 6000) => clean(value, max).toUpperCase();
const arr = value => Array.isArray(value) ? value : [];
const obj = value => value && typeof value === "object" && !Array.isArray(value) ? value : {};
const first = (...values) => values.find(value => value !== undefined && value !== null && value !== "") ?? "";

function fail(code, publicMessage, status = 400) {
  const error = new Error(code);
  error.code = code;
  error.status = status;
  error.publicMessage = publicMessage || "The Careers request could not be completed.";
  throw error;
}

function sha(value) {
  return createHash("sha256").update(String(value ?? ""), "utf8").digest("hex");
}

function randomToken(bytes = 32) {
  return randomBytes(bytes).toString("hex");
}

function businessKey(prefix) {
  return `${prefix}-${Date.now()}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

function normalizeEmail(value) {
  const email = lower(value, 254);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fail("CAREERS_EMAIL_INVALID", "Enter a valid email address.");
  }
  return email;
}

function list(value, maxItems = 30, maxLength = 700) {
  const source = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/\r?\n|,/)
      : [];
  return source
    .map(item => clean(typeof item === "string" ? item : first(item?.title, item?.label, item?.name), maxLength))
    .filter(Boolean)
    .slice(0, maxItems);
}

function safeUrl(value) {
  const raw = clean(value, 5000);
  if (!raw) return "";
  try {
    const url = new URL(raw);
    return ["https:", "http:"].includes(url.protocol) ? url.href : "";
  } catch (_) {
    return "";
  }
}

function safeInternalPath(value) {
  const path = clean(value, 1200);
  if (!path.startsWith("/") || path.startsWith("//") || /[\x00-\x1F\x7F\\]/.test(path)) return "";
  return path;
}

function storageReference(bucket, path) {
  return `storage://${clean(bucket, 180)}/${clean(path, 3000).replace(/^\/+/, "")}`;
}

function parseStorageReference(value) {
  const raw = clean(value, 5000);
  const match = /^storage:\/\/([^/]+)\/(.+)$/i.exec(raw);
  return match ? { bucket: match[1], path: match[2] } : null;
}

async function select(table, query = {}) {
  const result = await restRequest({ table, method: "GET", query, prefer: "" });
  return Array.isArray(result) ? result : [];
}

async function insert(table, body) {
  const result = await restRequest({ table, method: "POST", body, prefer: "return=representation" });
  return Array.isArray(result) ? result[0] || null : result || null;
}

async function patch(table, query, body) {
  const result = await restRequest({ table, method: "PATCH", query, body, prefer: "return=representation" });
  return Array.isArray(result) ? result : [];
}

async function audit(action, entityId, payload = {}) {
  try {
    await restRequest({
      table: "career_audit_log",
      method: "POST",
      body: {
        action: clean(action, 120),
        entity_id: clean(entityId, 180) || null,
        actor_agent_user_id: null,
        actor_sk_id: null,
        payload: obj(payload),
        created_at: new Date().toISOString()
      },
      prefer: "return=minimal"
    });
  } catch (_) {}
}

function publicPosition(row = {}) {
  const payload = obj(row.payload);
  const status = upper(first(payload.status, row.active === false ? "ARCHIVED" : "PUBLISHED"), 80);
  if (row.active === false || ["DRAFT", "ARCHIVED", "HIDDEN", "SUSPENDED", "CLOSED"].includes(status)) return null;

  return {
    id: clean(row.id, 100),
    positionId: clean(first(row.position_id, row.id), 160),
    title: clean(row.title, 240),
    location: clean(first(payload.location, row.location), 240),
    category: clean(first(payload.category, payload.area, row.department), 180),
    contractType: clean(first(payload.contractType, payload.employmentType, row.employment_type), 120),
    level: clean(first(payload.level, payload.seniority), 120),
    workModel: clean(first(payload.workModel, payload.work_model), 120),
    deadline: clean(first(payload.deadline, payload.applicationDeadline), 40),
    summary: clean(first(payload.summary, payload.shortDescription, row.description), 2200),
    description: clean(row.description, 8000),
    salaryRange: clean(row.salary_range, 200),
    tags: list(payload.tags, 12, 100),
    responsibilities: list(first(payload.responsibilities, payload.whatYouWillDo), 30, 700),
    requirements: list(first(payload.requirements, payload.whatYouBring), 30, 700),
    benefits: list(first(payload.benefits, payload.whySkandi), 30, 700),
    featured: payload.featured === true,
    status
  };
}

function publicCareerSettings(rows = []) {
  const source = rows.find(row => clean(row.setting_key, 120) === "successfactors-recruiting") || rows[0] || {};
  const value = obj(source.setting_value);
  const publicValue = obj(first(value.public, obj(source.payload).public));
  return {
    heroEyebrow: clean(publicValue.heroEyebrow, 120),
    heroTitle: clean(publicValue.heroTitle, 240),
    heroCopy: clean(publicValue.heroCopy, 1200),
    talentPoolEnabled: publicValue.talentPoolEnabled !== false
  };
}

async function activePositionRow(positionId) {
  const id = clean(positionId, 160);
  if (!id) fail("CAREERS_POSITION_REQUIRED", "Select a current position before applying.");
  const rows = await select("career_positions", {
    select: "*",
    active: "eq.true",
    order: "updated_at.desc",
    limit: "500"
  });
  const row = rows.find(item => clean(item.position_id, 160) === id || clean(item.id, 160) === id);
  const mapped = row ? publicPosition(row) : null;
  if (!row || !mapped) fail("CAREERS_POSITION_NOT_AVAILABLE", "This position is no longer available.");
  return { row, mapped };
}

export async function getPublicCareerDataCore() {
  const [positionRows, settingsRows] = await Promise.all([
    select("career_positions", { select: "*", active: "eq.true", order: "created_at.desc", limit: "500" }),
    select("career_settings", { select: "setting_key,setting_value,payload,updated_at", order: "updated_at.desc", limit: "50" })
  ]);

  const positions = positionRows.map(publicPosition).filter(Boolean);

  return {
    ok: true,
    source: "SUPABASE_CAREERS",
    version: CAREERS_VERSION,
    positions,
    settings: publicCareerSettings(settingsRows),
    counts: {
      open: positions.length,
      bases: [...new Set(positions.map(item => item.location).filter(Boolean))].length,
      areas: [...new Set(positions.map(item => item.category).filter(Boolean))].length
    },
    generatedAt: new Date().toISOString()
  };
}

function safeFileName(value) {
  const name = clean(value, 220)
    .replace(/[^\w.\- ]+/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^\.+/, "");
  return name || `document-${randomUUID().slice(0, 8)}`;
}

function validateApplicationFile(file = {}) {
  const fileName = safeFileName(file.fileName || file.name);
  const sizeBytes = Number(file.sizeBytes || file.size || 0);
  const mimeType = lower(file.mimeType || file.type, 180);
  const extension = (fileName.split(".").pop() || "").toLowerCase();
  const allowedExtensions = new Set(["pdf", "doc", "docx"]);
  const allowedMime = new Set([
    "",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/octet-stream"
  ]);

  if (!allowedExtensions.has(extension) || !allowedMime.has(mimeType)) {
    fail("CAREERS_FILE_TYPE_INVALID", "Resume and cover-letter files must be PDF, DOC or DOCX.");
  }
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0 || sizeBytes > MAX_APPLICATION_FILE_BYTES) {
    fail("CAREERS_FILE_SIZE_INVALID", "Each application document must be 10 MB or smaller.");
  }

  return {
    kind: upper(file.kind, 30) === "COVER" ? "COVER" : "CV",
    fileName,
    mimeType: mimeType || "application/octet-stream",
    sizeBytes
  };
}

export async function prepareCareerApplicationUploadsCore(input = {}) {
  const email = normalizeEmail(input.email);
  const { mapped: position } = await activePositionRow(input.positionId);
  const files = arr(input.files).map(validateApplicationFile).slice(0, 2);

  if (!files.some(file => file.kind === "CV")) fail("CAREERS_CV_REQUIRED", "Resume / CV is required.");

  const today = new Date().toISOString().slice(0, 7).replace("-", "/");
  const emailHash = sha(email);
  const expiresAt = new Date(Date.now() + UPLOAD_TTL_MS).toISOString();
  const uploads = [];

  for (const file of files) {
    const uploadId = businessKey("APPFILE");
    const storagePath = `careers/applications/${today}/${randomUUID()}-${file.fileName}`;
    const signed = await storageCreateSignedUploadUrl({ bucket: PRIVATE_BUCKET, path: storagePath, upsert: false });

    await insert("career_application_files", {
      title: file.fileName,
      status: "UPLOAD_PENDING",
      payload: {
        kind: file.kind,
        bucket: PRIVATE_BUCKET,
        storagePath,
        mimeType: file.mimeType,
        sizeBytes: file.sizeBytes,
        expiresAt,
        emailHash,
        positionId: position.positionId
      },
      entity_id: uploadId,
      member_id: null,
      body: null,
      file_url: storageReference(PRIVATE_BUCKET, storagePath),
      active: true,
      updated_at: new Date().toISOString()
    });

    uploads.push({
      uploadId,
      kind: file.kind,
      fileName: file.fileName,
      method: "PUT",
      contentType: file.mimeType,
      signedUrl: signed.signedUrl,
      expiresAt
    });
  }

  return { ok: true, version: CAREERS_VERSION, uploads };
}

async function verifiedApplicationUpload(uploadId, { emailHash, positionId } = {}) {
  const id = clean(uploadId, 180);
  const row = (await select("career_application_files", {
    select: "*",
    entity_id: `eq.${id}`,
    active: "eq.true",
    limit: "1"
  }))[0];

  if (!row) fail("CAREERS_UPLOAD_NOT_FOUND", "An application upload could not be verified.");

  const payload = obj(row.payload);
  if (payload.emailHash !== emailHash || clean(payload.positionId, 160) !== clean(positionId, 160)) {
    fail("CAREERS_UPLOAD_OWNERSHIP_MISMATCH", "The uploaded document does not belong to this application.");
  }
  if (new Date(clean(payload.expiresAt, 80)).getTime() < Date.now()) {
    fail("CAREERS_UPLOAD_EXPIRED", "The application upload expired. Choose the file again.");
  }

  const info = await storageGetObjectInfo({ bucket: clean(payload.bucket, 180), path: clean(payload.storagePath, 3000) });
  const actualSize = Number(info?.metadata?.size ?? info?.metadata?.contentLength ?? info?.size ?? 0);

  if (actualSize && Number(payload.sizeBytes || 0) && actualSize !== Number(payload.sizeBytes)) {
    fail("CAREERS_UPLOAD_SIZE_MISMATCH", "An uploaded application document failed verification.");
  }

  return { row, payload };
}

export async function submitCareerApplicationCore(input = {}) {
  const application = obj(input);
  const email = normalizeEmail(application.email);
  const firstName = clean(application.firstName, 120);
  const lastName = clean(application.lastName, 120);
  const phone = clean(application.phone, 80);

  if (!firstName || !lastName || !phone) {
    fail("CAREERS_APPLICATION_REQUIRED_FIELDS", "First name, last name, email and phone are required.");
  }
  if (application.consent !== true) {
    fail("CAREERS_APPLICATION_CONSENT_REQUIRED", "Recruitment data consent is required.");
  }

  const { mapped: position } = await activePositionRow(application.positionId);
  const emailHash = sha(email);
  const verifiedUploads = [];

  for (const upload of arr(application.uploads).slice(0, 2)) {
    const verified = await verifiedApplicationUpload(upload.uploadId, { emailHash, positionId: position.positionId });
    verifiedUploads.push({
      kind: upper(upload.kind, 30) === "COVER" ? "COVER" : clean(verified.payload.kind, 30),
      ...verified
    });
  }

  const cv = verifiedUploads.find(item => item.kind === "CV");
  if (!cv) fail("CAREERS_CV_REQUIRED", "Resume / CV is required.");
  const cover = verifiedUploads.find(item => item.kind === "COVER") || null;

  const applicantId = businessKey("CAND");
  const appliedAt = new Date().toISOString();
  const fileSummary = verifiedUploads.map(item => ({
    uploadId: clean(item.row.entity_id, 180),
    kind: item.kind,
    fileName: clean(item.row.title, 240),
    storagePath: clean(item.payload.storagePath, 3000),
    bucket: clean(item.payload.bucket, 180),
    mimeType: clean(item.payload.mimeType, 180),
    sizeBytes: Number(item.payload.sizeBytes || 0)
  }));

  await insert("career_applicant_accounts", {
    applicant_id: applicantId,
    wix_member_id: null,
    position_id: position.positionId,
    first_name: firstName,
    last_name: lastName,
    email,
    phone,
    status: "APPLIED",
    resume_url: storageReference(cv.payload.bucket, cv.payload.storagePath),
    cover_letter_url: cover ? storageReference(cover.payload.bucket, cover.payload.storagePath) : null,
    payload: {
      positionTitle: position.title,
      preferredBase: clean(application.preferredBase, 180),
      earliestStartDate: clean(application.startDate, 40),
      motivation: clean(application.motivation, 8000),
      source: clean(application.source, 180),
      applicationFiles: fileSummary,
      consentAt: appliedAt,
      appliedAt,
      sourceSystem: "SKANDI_CAREERS_HUB"
    },
    created_at: appliedAt,
    updated_at: appliedAt
  });

  for (const item of verifiedUploads) {
    await patch("career_application_files", { id: `eq.${item.row.id}` }, {
      status: "UPLOADED",
      member_id: applicantId,
      payload: { ...item.payload, applicantId, uploadedAt: appliedAt },
      updated_at: appliedAt
    });
  }

  await audit("PUBLIC_APPLICATION_SUBMITTED", applicantId, { positionId: position.positionId, status: "APPLIED" });

  return {
    ok: true,
    applicationId: applicantId,
    applicantId,
    positionId: position.positionId,
    status: "APPLIED",
    message: "Application received. Keep your applicant email available for portal access."
  };
}

function genericAccessMessage() {
  return "If this email matches a SKANDI Careers application, the access-code request has been queued for Careers.";
}

export async function requestApplicantPortalCodeCore(input = {}) {
  const email = normalizeEmail(input.email);
  const applicants = await select("career_applicant_accounts", {
    select: "id,applicant_id,email,status,created_at",
    email: `eq.${email}`,
    order: "created_at.desc",
    limit: "50"
  });

  if (!applicants.length) return { ok: true, queued: true, message: genericAccessMessage() };

  const existing = await select("career_applicant_access_codes", {
    select: "*",
    member_id: `eq.${email}`,
    active: "eq.true",
    order: "created_at.desc",
    limit: "10"
  });

  const newestAt = existing[0]?.created_at ? new Date(existing[0].created_at).getTime() : 0;
  if (newestAt && Date.now() - newestAt < 60_000) {
    return { ok: true, queued: true, message: genericAccessMessage() };
  }

  if (existing.length) {
    await patch("career_applicant_access_codes", { member_id: `eq.${email}`, active: "eq.true" }, {
      status: "SUPERSEDED",
      active: false,
      updated_at: new Date().toISOString()
    });
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const salt = randomToken(16);
  const codeHash = sha(`${salt}:${code}`);
  const expiresAt = new Date(Date.now() + CODE_TTL_MS).toISOString();

  await insert("career_applicant_access_codes", {
    title: "Applicant portal access",
    entity_id: codeHash,
    member_id: email,
    status: "PENDING",
    body: null,
    file_url: null,
    active: true,
    payload: {
      salt,
      expiresAt,
      attempts: 0,
      maxAttempts: 5,
      applicantIds: applicants.map(item => clean(item.applicant_id, 160)).filter(Boolean),
      requestedAt: new Date().toISOString()
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  await insert("career_mailbox_messages", {
    message_key: businessKey("CAREER-MAIL"),
    candidate_id: clean(applicants[0]?.applicant_id, 160) || null,
    direction: "OUTBOUND",
    subject: "Your SKANDI Careers applicant portal access code",
    body: `Your SKANDI Careers access code is ${code}. It expires in 15 minutes.`,
    from_address: null,
    received_at: null,
    payload: {
      type: "APPLICANT_ACCESS_CODE",
      toAddress: email,
      deliveryStatus: "PENDING_PROVIDER",
      expiresAt,
      portalVisible: false
    },
    created_by_agent_user_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  await audit("APPLICANT_ACCESS_CODE_REQUESTED", sha(email).slice(0, 24), {
    queued: true,
    providerStatus: "PENDING_PROVIDER"
  });

  return {
    ok: true,
    queued: true,
    deliveryStatus: "PENDING_PROVIDER",
    message: genericAccessMessage()
  };
}

export async function verifyApplicantPortalCodeCore(input = {}) {
  const email = normalizeEmail(input.email);
  const code = clean(input.code, 20);

  if (!/^\d{6}$/.test(code)) {
    return { ok: false, code: "CAREERS_ACCESS_CODE_INVALID", error: "The access code is invalid or expired." };
  }

  const row = (await select("career_applicant_access_codes", {
    select: "*",
    member_id: `eq.${email}`,
    active: "eq.true",
    status: "eq.PENDING",
    order: "created_at.desc",
    limit: "1"
  }))[0];

  if (!row) return { ok: false, code: "CAREERS_ACCESS_CODE_INVALID", error: "The access code is invalid or expired." };

  const payload = obj(row.payload);
  const attempts = Number(payload.attempts || 0);
  const maxAttempts = Math.max(1, Number(payload.maxAttempts || 5));
  const expired = !payload.expiresAt || new Date(payload.expiresAt).getTime() < Date.now();

  if (expired || attempts >= maxAttempts) {
    await patch("career_applicant_access_codes", { id: `eq.${row.id}` }, {
      status: expired ? "EXPIRED" : "LOCKED",
      active: false,
      updated_at: new Date().toISOString()
    });
    return { ok: false, code: "CAREERS_ACCESS_CODE_INVALID", error: "The access code is invalid or expired." };
  }

  const valid = sha(`${clean(payload.salt, 200)}:${code}`) === clean(row.entity_id, 128);
  if (!valid) {
    const nextAttempts = attempts + 1;
    await patch("career_applicant_access_codes", { id: `eq.${row.id}` }, {
      payload: { ...payload, attempts: nextAttempts },
      status: nextAttempts >= maxAttempts ? "LOCKED" : "PENDING",
      active: nextAttempts < maxAttempts,
      updated_at: new Date().toISOString()
    });
    return { ok: false, code: "CAREERS_ACCESS_CODE_INVALID", error: "The access code is invalid or expired." };
  }

  await patch("career_applicant_access_codes", { id: `eq.${row.id}` }, {
    status: "USED",
    active: false,
    payload: { ...payload, usedAt: new Date().toISOString() },
    updated_at: new Date().toISOString()
  });

  await patch("career_applicant_sessions", { member_id: `eq.${email}`, active: "eq.true" }, {
    status: "SUPERSEDED",
    active: false,
    updated_at: new Date().toISOString()
  });

  const sessionToken = randomToken(32);
  const sessionHash = sha(sessionToken);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();

  await insert("career_applicant_sessions", {
    title: "Applicant portal session",
    entity_id: sessionHash,
    member_id: email,
    status: "ACTIVE",
    body: null,
    file_url: null,
    active: true,
    payload: { expiresAt, createdAt: new Date().toISOString() },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  await audit("APPLICANT_PORTAL_LOGIN", sha(email).slice(0, 24), { ok: true });

  return { ok: true, sessionToken, expiresAt };
}

async function applicantSession(sessionToken) {
  const token = clean(sessionToken, 300);
  if (!token) fail("CAREERS_SESSION_REQUIRED", "Sign in to the applicant portal again.", 401);

  const tokenHash = sha(token);
  const row = (await select("career_applicant_sessions", {
    select: "*",
    entity_id: `eq.${tokenHash}`,
    active: "eq.true",
    status: "eq.ACTIVE",
    limit: "1"
  }))[0];

  if (!row) fail("CAREERS_SESSION_INVALID", "Your applicant session expired. Sign in again.", 401);

  const payload = obj(row.payload);
  if (!payload.expiresAt || new Date(payload.expiresAt).getTime() < Date.now()) {
    await patch("career_applicant_sessions", { id: `eq.${row.id}` }, {
      status: "EXPIRED",
      active: false,
      updated_at: new Date().toISOString()
    });
    fail("CAREERS_SESSION_INVALID", "Your applicant session expired. Sign in again.", 401);
  }

  return { row, email: normalizeEmail(row.member_id) };
}

export async function logoutApplicantPortalSessionCore(input = {}) {
  const session = await applicantSession(input.sessionToken);
  await patch("career_applicant_sessions", { id: `eq.${session.row.id}` }, {
    status: "LOGGED_OUT",
    active: false,
    updated_at: new Date().toISOString()
  });
  return { ok: true };
}

function applicantApplication(row = {}, positionMap = new Map()) {
  const payload = obj(row.payload);
  const position = positionMap.get(clean(row.position_id, 160)) || {};
  return {
    applicationId: clean(first(row.applicant_id, row.id), 160),
    positionId: clean(row.position_id, 160),
    positionTitle: clean(first(payload.positionTitle, position.title, "SKANDI opportunity"), 240),
    location: clean(first(position.location, payload.preferredBase), 180),
    stage: clean(first(row.status, "Application received"), 100),
    status: clean(first(row.status, "Active"), 100),
    createdAt: clean(row.created_at, 80),
    updatedAt: clean(row.updated_at, 80)
  };
}

function publicPortalMessage(row = {}) {
  const payload = obj(row.payload);
  return {
    id: clean(row.id, 100),
    direction: clean(row.direction, 40),
    subject: clean(row.subject, 300),
    body: clean(row.body, 6000),
    createdAt: clean(first(row.received_at, row.created_at), 80),
    type: clean(payload.type, 100)
  };
}

function packetSummary(row = {}, documentCount = 0) {
  const payload = obj(row.payload);
  return {
    packetId: clean(first(row.packet_id, row.id), 160),
    title: clean(first(payload.title, payload.packetTitle, "Applicant documents"), 240),
    status: clean(first(row.status, "Pending"), 100),
    dueAt: clean(first(payload.dueAt, payload.due_at), 80),
    packetType: clean(first(payload.packetType, payload.type, "Document request"), 120),
    documentCount,
    createdAt: clean(row.created_at, 80)
  };
}

export async function getApplicantPortalDataCore(input = {}) {
  const session = await applicantSession(input.sessionToken);
  const applications = await select("career_applicant_accounts", {
    select: "*",
    email: `eq.${session.email}`,
    order: "created_at.desc",
    limit: "50"
  });

  if (!applications.length) {
    fail("CAREERS_APPLICANT_NOT_FOUND", "No Careers application is linked to this portal session.", 404);
  }

  const positionRows = await select("career_positions", {
    select: "position_id,title,location,department,employment_type,payload",
    order: "updated_at.desc",
    limit: "500"
  });
  const positionMap = new Map(positionRows.map(row => [clean(row.position_id, 160), row]));
  const applicantIds = new Set(applications.map(row => clean(row.applicant_id, 160)).filter(Boolean));

  const [packetRows, documentRows, messageRows] = await Promise.all([
    select("career_document_packets", { select: "*", order: "updated_at.desc", limit: "1000" }),
    select("career_documents", {
      select: "document_id,candidate_id,verification_status,payload,updated_at",
      order: "updated_at.desc",
      limit: "1000"
    }),
    select("career_mailbox_messages", {
      select: "id,message_key,candidate_id,direction,subject,body,received_at,payload,created_at",
      order: "created_at.desc",
      limit: "500"
    })
  ]);

  const relatedPackets = packetRows.filter(row => applicantIds.has(clean(row.candidate_id, 160)));
  const relatedDocuments = documentRows.filter(row => applicantIds.has(clean(row.candidate_id, 160)));

  const documentCountByCandidate = new Map();
  relatedDocuments.forEach(row => {
    const key = clean(row.candidate_id, 160);
    documentCountByCandidate.set(key, (documentCountByCandidate.get(key) || 0) + 1);
  });

  const messages = messageRows
    .filter(row => applicantIds.has(clean(row.candidate_id, 160)))
    .filter(row => {
      const payload = obj(row.payload);
      return payload.portalVisible === true || upper(payload.visibility, 40) === "APPLICANT";
    })
    .filter(row => upper(obj(row.payload).type, 80) !== "APPLICANT_ACCESS_CODE")
    .map(publicPortalMessage);

  const latest = applications[0];
  const latestPayload = obj(latest.payload);

  return {
    ok: true,
    version: CAREERS_VERSION,
    applicant: {
      firstName: clean(latest.first_name, 120),
      lastName: clean(latest.last_name, 120),
      email: session.email,
      phone: clean(latest.phone, 80),
      preferredBase: clean(latestPayload.preferredBase, 180)
    },
    applications: applications.map(row => applicantApplication(row, positionMap)),
    documentRequests: relatedPackets.map(row =>
      packetSummary(row, documentCountByCandidate.get(clean(row.candidate_id, 160)) || 0)
    ),
    messages,
    generatedAt: new Date().toISOString()
  };
}

async function signedDocumentUrl(row = {}) {
  const direct = safeUrl(row.file_url);
  if (direct) return direct;

  const payload = obj(row.payload);
  const storage = parseStorageReference(row.file_url) || (
    payload.storagePath ? {
      bucket: clean(payload.bucket || PRIVATE_BUCKET, 180),
      path: clean(payload.storagePath, 3000)
    } : null
  );

  if (!storage?.path) return "";

  try {
    const signed = await storageCreateSignedReadUrl({
      bucket: storage.bucket || PRIVATE_BUCKET,
      path: storage.path,
      expiresIn: 900,
      download: false
    });
    return signed.signedUrl || "";
  } catch (_) {
    return "";
  }
}

async function publicCareerDocument(row = {}) {
  const payload = obj(row.payload);
  return {
    id: clean(row.id, 100),
    documentId: clean(first(row.document_id, row.id), 160),
    title: clean(first(row.title, payload.title, "Applicant document"), 240),
    documentType: clean(first(row.document_type, payload.documentType, "Document"), 120),
    status: clean(first(row.verification_status, "PENDING"), 100),
    fileUrl: await signedDocumentUrl(row),
    bodyHtml: clean(first(payload.bodyHtml, payload.body_html), 30000),
    instructions: clean(payload.instructions, 3000)
  };
}

async function packetAuthorization(input = {}) {
  const sessionToken = clean(input.sessionToken, 300);
  const packetId = clean(input.packetId, 180);
  const directEmail = input.email ? normalizeEmail(input.email) : "";
  const directToken = clean(input.token, 500);

  let session = null;
  let applicantIds = new Set();

  if (sessionToken) {
    session = await applicantSession(sessionToken);
    const applications = await select("career_applicant_accounts", {
      select: "applicant_id,email",
      email: `eq.${session.email}`,
      limit: "50"
    });
    applicantIds = new Set(applications.map(row => clean(row.applicant_id, 160)).filter(Boolean));
  }

  let packet = null;

  if (packetId) {
    packet = (await select("career_document_packets", {
      select: "*",
      packet_id: `eq.${packetId}`,
      limit: "1"
    }))[0] || null;

    if (!packet) {
      packet = (await select("career_document_packets", {
        select: "*",
        id: `eq.${packetId}`,
        limit: "1"
      }))[0] || null;
    }
  } else if (directToken) {
    packet = (await select("career_document_packets", {
      select: "*",
      access_token: `eq.${directToken}`,
      limit: "1"
    }))[0] || null;
  }

  if (!packet) fail("CAREERS_DOCUMENT_PACKET_NOT_FOUND", "The document request could not be found.", 404);

  if (session) {
    if (!applicantIds.has(clean(packet.candidate_id, 160))) {
      fail("CAREERS_DOCUMENT_ACCESS_DENIED", "This document request does not belong to your applicant session.", 403);
    }
  } else {
    if (!directToken || !directEmail) {
      fail("CAREERS_DOCUMENT_ACCESS_REQUIRED", "Enter the document email and access token.", 401);
    }
    if (lower(packet.email, 254) !== directEmail) {
      fail("CAREERS_DOCUMENT_ACCESS_DENIED", "The document email and access token do not match.", 403);
    }
  }

  return { packet, session, email: session?.email || directEmail };
}

async function documentsForPacket(packet = {}) {
  const payload = obj(packet.payload);
  const rows = await select("career_documents", {
    select: "*",
    candidate_id: `eq.${clean(packet.candidate_id, 160)}`,
    order: "created_at.asc",
    limit: "100"
  });

  const requestedIds = new Set(list(first(payload.documentIds, payload.document_ids), 100, 180));
  const selected = requestedIds.size
    ? rows.filter(row =>
        requestedIds.has(clean(row.document_id, 180)) ||
        requestedIds.has(clean(row.id, 180))
      )
    : rows;

  return Promise.all(selected.map(publicCareerDocument));
}

export async function getCareerDocumentPacketCore(input = {}) {
  const auth = await packetAuthorization(input);
  const docs = await documentsForPacket(auth.packet);
  const candidate = (await select("career_applicant_accounts", {
    select: "first_name,last_name,email,phone,applicant_id",
    applicant_id: `eq.${clean(auth.packet.candidate_id, 160)}`,
    limit: "1"
  }))[0] || {};

  const payload = obj(auth.packet.payload);

  return {
    ok: true,
    version: CAREERS_VERSION,
    packet: {
      packetId: clean(first(auth.packet.packet_id, auth.packet.id), 160),
      title: clean(first(payload.title, payload.packetTitle, "Applicant Document Review"), 240),
      instructions: clean(first(payload.instructions, "Review the assigned document and complete the requested acknowledgement."), 4000),
      status: clean(auth.packet.status, 100),
      documents: docs
    },
    identity: {
      firstName: clean(candidate.first_name, 120),
      lastName: clean(candidate.last_name, 120),
      email: auth.email,
      phone: clean(candidate.phone, 80)
    }
  };
}

export async function submitCareerDocumentExecutionCore(input = {}) {
  const auth = await packetAuthorization(input);
  const docs = await documentsForPacket(auth.packet);
  const documentId = clean(input.documentId, 180);
  const document = docs.find(item => item.documentId === documentId || item.id === documentId);

  if (!document) fail("CAREERS_DOCUMENT_NOT_FOUND", "The selected applicant document could not be found.", 404);
  if (input.electronicConsent !== true) {
    fail("CAREERS_DOCUMENT_CONSENT_REQUIRED", "Electronic consent is required.");
  }

  const signatureName = clean(input.signatureName, 240);
  if (!signatureName) fail("CAREERS_DOCUMENT_SIGNATURE_NAME_REQUIRED", "Typed legal signature is required.");

  const decision = input.decision === "notApproved" ? "NOT_APPROVED" : "ACKNOWLEDGED";
  const signatureImageData = clean(input.signatureImageData, 2_500_000);

  if (input.hasSignature !== true || !/^data:image\/png;base64,/i.test(signatureImageData)) {
    fail("CAREERS_DOCUMENT_SIGNATURE_REQUIRED", "Drawn signature is required.");
  }

  const executedAt = new Date().toISOString();
  const signaturePath = `careers/signatures/${clean(auth.packet.candidate_id, 120)}/${randomUUID()}.png`;

  await storageUploadBase64Object({
    bucket: PRIVATE_BUCKET,
    path: signaturePath,
    dataBase64: signatureImageData,
    mimeType: "image/png",
    maxBytes: MAX_SIGNATURE_BYTES,
    upsert: false
  });

  const acknowledgement = await insert("document_acknowledgements", {
    title: `${document.title} — ${decision === "ACKNOWLEDGED" ? "Acknowledged" : "Not approved"}`,
    entity_id: document.documentId,
    member_id: auth.email,
    status: decision,
    body: clean(input.comment, 6000) || null,
    file_url: storageReference(PRIVATE_BUCKET, signaturePath),
    active: true,
    payload: {
      domain: "CAREERS",
      packetId: clean(first(auth.packet.packet_id, auth.packet.id), 160),
      candidateId: clean(auth.packet.candidate_id, 160),
      relationship: clean(input.relationship, 120),
      firstName: clean(input.firstName, 120),
      lastName: clean(input.lastName, 120),
      phone: clean(input.phone, 80),
      electronicConsent: true,
      signatureName,
      executedAt,
      source: "SKANDI_CAREERS_HUB"
    },
    created_at: executedAt,
    updated_at: executedAt
  });

  const documentRows = await select("career_documents", {
    select: "id,document_id,candidate_id,verification_status",
    candidate_id: `eq.${clean(auth.packet.candidate_id, 160)}`,
    limit: "100"
  });

  const targetRow = documentRows.find(row =>
    clean(row.document_id, 180) === document.documentId ||
    clean(row.id, 180) === document.id
  );

  if (targetRow?.id) {
    await patch("career_documents", { id: `eq.${targetRow.id}` }, {
      verification_status: decision,
      updated_at: executedAt
    });
  }

  const packetPayload = obj(auth.packet.payload);
  const requestedIds = new Set(list(first(packetPayload.documentIds, packetPayload.document_ids), 100, 180));
  const packetRows = requestedIds.size
    ? documentRows.filter(row =>
        requestedIds.has(clean(row.document_id, 180)) ||
        requestedIds.has(clean(row.id, 180))
      )
    : documentRows;

  const finalStatuses = new Set(["ACKNOWLEDGED", "VERIFIED", "NOT_APPROVED", "REJECTED"]);
  const allFinal = packetRows.length > 0 && packetRows.every(row => {
    if (targetRow?.id === row.id) return finalStatuses.has(decision);
    return finalStatuses.has(upper(row.verification_status, 100));
  });

  await patch("career_document_packets", { id: `eq.${auth.packet.id}` }, {
    status: allFinal ? "COMPLETED" : "IN_PROGRESS",
    updated_at: executedAt
  });

  await audit("APPLICANT_DOCUMENT_EXECUTED", document.documentId, {
    packetId: clean(first(auth.packet.packet_id, auth.packet.id), 160),
    decision
  });

  return {
    ok: true,
    acknowledgementId: acknowledgement?.id || "",
    documentId: document.documentId,
    status: decision,
    message: decision === "ACKNOWLEDGED"
      ? "Document acknowledgement recorded."
      : "Your decision was recorded."
  };
}

export async function getCareerPublicFormsCore() {
  const rows = await select("document_templates", {
    select: "*",
    active: "eq.true",
    order: "updated_at.desc",
    limit: "500"
  });

  const forms = [];

  for (const row of rows) {
    const payload = obj(row.payload);
    const scopes = list(first(payload.scope, payload.audience, payload.portals), 20, 120)
      .map(value => upper(value, 120));

    const careerPublic =
      payload.careerPublic === true ||
      payload.publicCareers === true ||
      scopes.some(value => ["CAREERS", "RECRUITING", "APPLICANT", "APPLICANTS"].includes(value));

    if (!careerPublic) continue;

    let fileUrl = safeUrl(row.file_url);
    if (!fileUrl) {
      const storage = parseStorageReference(row.file_url) || (
        payload.storagePath
          ? { bucket: clean(payload.bucket || PRIVATE_BUCKET, 180), path: clean(payload.storagePath, 3000) }
          : null
      );

      if (storage?.path) {
        try {
          fileUrl = (await storageCreateSignedReadUrl({
            bucket: storage.bucket || PRIVATE_BUCKET,
            path: storage.path,
            expiresIn: 900,
            download: false
          })).signedUrl || "";
        } catch (_) {}
      }
    }

    forms.push({
      id: clean(row.id, 100),
      code: clean(first(payload.code, row.entity_id, row.id), 120),
      title: clean(first(row.title, payload.title, "Career form"), 240),
      category: clean(first(payload.category, "Careers"), 120),
      summary: clean(first(payload.summary, row.body), 1800),
      allowBlankFill: payload.allowBlankFill === true && Boolean(safeInternalPath(payload.onlinePath)),
      onlinePath: safeInternalPath(payload.onlinePath),
      allowBlankDownload: payload.allowBlankDownload === true && Boolean(fileUrl),
      fileUrl,
      officialSourceUrl: safeUrl(payload.officialSourceUrl)
    });
  }

  return { ok: true, version: CAREERS_VERSION, documents: forms };
}
