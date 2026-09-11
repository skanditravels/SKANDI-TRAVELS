// /src/backend/SKANDI_CORE/internalMail.js
// SKANDI canonical RIA Mail business core.
// R-003.9
//
// Source of truth:
// - Wix Members authenticates the browser staff session.
// - SKANDI_CORE/staffAuth.js resolves/authorizes public.agent_users.
// - Supabase public.internal_mail_* owns durable mailbox state.
// - Supabase Storage bucket internal-mail-attachments owns private attachments.
// - Matrix/Wix CMS Mail* collections are retired from this path.

import { requireStaffPortalSessionCore } from "./staffAuth.js";
import {
  restRequest,
  storageUploadBase64Object,
  storageCreateSignedReadUrl
} from "./supabaseServer.js";

const TABLES = Object.freeze({
  accounts: "internal_mail_accounts",
  threads: "internal_mail_threads",
  messages: "internal_mail_messages",
  recipients: "internal_mail_recipients",
  entries: "internal_mail_entries",
  attachments: "internal_mail_attachments",
  events: "internal_mail_events"
});

const ATTACHMENT_BUCKET = "internal-mail-attachments";
const INTERNAL_DOMAIN = "skanditravels.com";
const MAX_LIST = 500;
const MAX_BODY = 20000;
const MAX_SUBJECT = 200;
const MAX_ATTACHMENTS = 10;
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

const ALLOWED_ATTACHMENT_MIME = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/plain"
]);

const UI_TO_DB_MAILBOX = Object.freeze({
  Inbox: "inbox",
  Unread: "inbox",
  Sent: "sent",
  Drafts: "drafts",
  Archive: "archive",
  Deleted: "trash"
});

const DB_TO_UI_MAILBOX = Object.freeze({
  inbox: "Inbox",
  sent: "Sent",
  drafts: "Drafts",
  archive: "Archive",
  trash: "Deleted"
});

function clean(value, max = 5000) {
  return String(value ?? "").trim().slice(0, max);
}

function lower(value, max = 5000) {
  return clean(value, max).toLowerCase();
}

function upper(value, max = 5000) {
  return clean(value, max).toUpperCase();
}

function isoNow() {
  return new Date().toISOString();
}

function array(value) {
  if (Array.isArray(value)) return value.map((item) => clean(item, 500)).filter(Boolean);
  if (!value) return [];
  return String(value).split(/[;,]+/).map((item) => clean(item, 500)).filter(Boolean);
}

function first(rows) {
  return Array.isArray(rows) && rows.length ? rows[0] : null;
}

function uuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const r = Math.floor(Math.random() * 16);
    const v = char === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(clean(value, 80));
}

function eventId() {
  return Date.now() * 1000 + Math.floor(Math.random() * 1000);
}

function sanitizeFileName(value) {
  const file = clean(value, 255) || "attachment";
  return file
    .normalize("NFKD")
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(0, 180) || "attachment";
}

function accountDto(account = {}) {
  return {
    accountId: clean(account.id, 80),
    skId: clean(account.sk_id, 40),
    alias: lower(account.address, 254),
    email: lower(account.address, 254),
    displayName: clean(account.display_name, 120),
    role: clean(account.job_title, 120),
    jobTitle: clean(account.job_title, 120),
    department: clean(account.department, 120),
    active: account.active === true,
    isSystemAccount: !account.sk_id
  };
}

function profileDto(session, account) {
  const p = session?.profile || {};
  return {
    id: clean(p.agentUserId || p.id, 80),
    agentUserId: clean(p.agentUserId || p.id, 80),
    skId: clean(p.skId, 40),
    name: clean([p.firstName, p.lastName].filter(Boolean).join(" ") || p.displayName || p.fullName, 180),
    displayName: clean([p.firstName, p.lastName].filter(Boolean).join(" ") || p.displayName || p.fullName, 180),
    firstName: clean(p.firstName, 100),
    lastName: clean(p.lastName, 100),
    email: lower(p.email || p.corporateEmailAddress, 254),
    alias: lower(account?.address || p.email || p.corporateEmailAddress, 254),
    role: clean(p.accessRole || p.role, 100),
    jobTitle: clean(p.jobTitle || p.position, 180),
    position: clean(p.position || p.jobTitle, 180),
    department: clean(p.department || p.departmentCode || p.departmentId, 180),
    departmentCode: clean(p.departmentCode, 80),
    base: clean(p.base || p.baseCode || p.station, 160),
    baseCode: clean(p.baseCode, 80),
    station: clean(p.station || p.base, 160),
    profilePhoto: clean(p.badgePhotoUrl, 1000),
    profilePhotoUrl: clean(p.badgePhotoUrl, 1000),
    canManage: session?.canManage === true
  };
}

function assertMailAccess(session) {
  const allowed = new Set(array(session?.allowedApps).map((v) => lower(v, 100)));
  const perms = new Set(array(session?.permissionKeys).map((v) => lower(v, 100)));
  const role = upper(session?.accessRole || session?.profile?.accessRole, 80);
  const privileged = session?.isSystemAdmin === true || ["OWNER", "COMPANY_OWNER", "SUPER_ADMIN"].includes(role);
  if (privileged || allowed.has("mail") || perms.has("mail") || perms.has("h-mail")) return;
  const error = new Error("MAIL_ACCESS_DENIED");
  error.code = "MAIL_ACCESS_DENIED";
  throw error;
}

async function requireMailSession() {
  const session = await requireStaffPortalSessionCore();
  assertMailAccess(session);
  return session;
}

async function findAccountForSession(session) {
  const p = session.profile || {};
  const agentUserId = clean(p.agentUserId || p.id, 80);
  const skId = upper(p.skId, 40);
  const email = lower(p.email || p.corporateEmailAddress, 254);

  let account = null;
  if (isUuid(agentUserId)) {
    account = first(await restRequest({
      table: TABLES.accounts,
      query: { select: "*", legacy_agent_user_id: `eq.${agentUserId}`, limit: 1 }
    }));
  }
  if (!account && skId) {
    account = first(await restRequest({
      table: TABLES.accounts,
      query: { select: "*", sk_id: `eq.${skId}`, limit: 1 }
    }));
  }
  if (!account && email) {
    account = first(await restRequest({
      table: TABLES.accounts,
      query: { select: "*", address: `ilike.${email}`, limit: 1 }
    }));
  }
  return account;
}

async function ensureCurrentMailAccount(session) {
  const p = session.profile || {};
  const agentUserId = clean(p.agentUserId || p.id, 80);
  const skId = upper(p.skId, 40);
  const email = lower(p.email || p.corporateEmailAddress, 254);
  const displayName = clean([p.firstName, p.lastName].filter(Boolean).join(" ") || p.displayName || p.fullName || email || skId || "Staff", 120);
  if (!skId || !email || !email.endsWith(`@${INTERNAL_DOMAIN}`)) {
    throw new Error("MAIL_ACCOUNT_IDENTITY_INCOMPLETE");
  }

  const desired = {
    legacy_agent_user_id: isUuid(agentUserId) ? agentUserId : null,
    sk_id: skId,
    address: email,
    display_name: displayName,
    job_title: clean(p.jobTitle || p.position, 120) || null,
    department: clean(p.departmentCode || p.department || p.departmentId, 120) || null,
    active: p.active !== false,
    updated_at: isoNow()
  };

  let account = await findAccountForSession(session);
  if (account) {
    const changed =
      clean(account.legacy_agent_user_id, 80) !== clean(desired.legacy_agent_user_id, 80) ||
      upper(account.sk_id, 40) !== skId ||
      lower(account.address, 254) !== email ||
      clean(account.display_name, 120) !== displayName ||
      clean(account.job_title, 120) !== clean(desired.job_title, 120) ||
      clean(account.department, 120) !== clean(desired.department, 120) ||
      account.active !== desired.active;

    if (changed) {
      const rows = await restRequest({
        table: TABLES.accounts,
        method: "PATCH",
        query: { id: `eq.${account.id}` },
        body: desired
      });
      account = first(rows) || { ...account, ...desired };
    }
  } else {
    const rows = await restRequest({
      table: TABLES.accounts,
      method: "POST",
      body: { ...desired, created_at: isoNow() }
    });
    account = first(rows);
  }

  if (!account || account.active !== true) throw new Error("MAIL_ACCOUNT_INACTIVE");
  return account;
}

async function context() {
  const session = await requireMailSession();
  const account = await ensureCurrentMailAccount(session);
  return { session, account };
}

async function logEvent({ accountId = null, action, messageId = null, threadId = null, metadata = {} }) {
  try {
    await restRequest({
      table: TABLES.events,
      method: "POST",
      body: {
        id: eventId(),
        actor_account_id: accountId || null,
        action: clean(action, 80),
        message_id: isUuid(messageId) ? messageId : null,
        thread_id: isUuid(threadId) ? threadId : null,
        metadata: metadata && typeof metadata === "object" ? metadata : {},
        created_at: isoNow()
      }
    });
  } catch (_) {
    // Mail actions must not fail solely because audit persistence fails.
  }
}

async function activeDirectory() {
  const rows = await restRequest({
    table: TABLES.accounts,
    query: { select: "*", active: "eq.true", order: "display_name.asc", limit: 1000 }
  });
  return Array.isArray(rows) ? rows : [];
}

async function accountMap(ids = []) {
  const unique = [...new Set(ids.filter(isUuid))];
  if (!unique.length) return new Map();
  const rows = await restRequest({
    table: TABLES.accounts,
    query: { select: "*", id: `in.(${unique.join(",")})`, limit: 1000 }
  });
  return new Map((rows || []).map((row) => [row.id, row]));
}

async function messageRows(ids = []) {
  const unique = [...new Set(ids.filter(isUuid))];
  if (!unique.length) return [];
  return restRequest({
    table: TABLES.messages,
    query: { select: "*", id: `in.(${unique.join(",")})`, limit: MAX_LIST }
  });
}

async function recipientRows(ids = []) {
  const unique = [...new Set(ids.filter(isUuid))];
  if (!unique.length) return [];
  return restRequest({
    table: TABLES.recipients,
    query: { select: "*", message_id: `in.(${unique.join(",")})`, limit: 2000 }
  });
}

async function attachmentRows(ids = []) {
  const unique = [...new Set(ids.filter(isUuid))];
  if (!unique.length) return [];
  return restRequest({
    table: TABLES.attachments,
    query: { select: "*", message_id: `in.(${unique.join(",")})`, limit: 1000 }
  });
}

function uiFolder(dbMailbox) {
  return DB_TO_UI_MAILBOX[lower(dbMailbox, 30)] || "Inbox";
}

function dbMailbox(ui) {
  return UI_TO_DB_MAILBOX[clean(ui, 30)] || "inbox";
}

function recipientSummary(message, recipients, accounts, currentAccountId) {
  const to = recipients
    .filter((row) => row.message_id === message.id && row.recipient_type === "to")
    .map((row) => accounts.get(row.account_id))
    .filter(Boolean)
    .map((row) => row.display_name || row.address);

  if (message.status === "draft" && !to.length) {
    const draftTo = array(message?.draft_recipients?.to);
    return draftTo.join(", ");
  }
  if (message.sender_account_id === currentAccountId) return to.join(", ");
  return "";
}

function publicMessage({ message, entry, sender, toSummary = "", attachmentCount = 0, currentAccountId, priority = "Normal" }) {
  const outbound = message.sender_account_id === currentAccountId;
  return {
    id: message.id,
    messageId: message.id,
    threadId: message.thread_id,
    parentMessageId: message.reply_to_message_id || "",
    fromAlias: lower(sender?.address, 254),
    fromName: clean(sender?.display_name || sender?.address || "Unknown sender", 180),
    sender: clean(sender?.display_name || sender?.address || "Unknown sender", 180),
    toSummary,
    subject: clean(message.subject || "(No subject)", MAX_SUBJECT),
    body: clean(message.body_plain, MAX_BODY),
    bodyPlain: clean(message.body_plain, MAX_BODY),
    preview: clean(message.body_plain, 180),
    sentAt: message.sent_at || message.updated_at || message.created_at,
    createdAt: message.created_at,
    folder: uiFolder(entry?.mailbox),
    read: entry?.is_read === true,
    unread: entry?.is_read === false,
    flagged: entry?.starred === true,
    archived: entry?.mailbox === "archive",
    deletedForOwner: entry?.mailbox === "trash",
    direction: outbound ? "OUTBOUND" : "INBOUND",
    hasAttachments: attachmentCount > 0,
    attachmentCount,
    status: message.status,
    priority: clean(priority || "Normal", 20) || "Normal"
  };
}

function countsFromEntries(entries = []) {
  const counts = { Inbox: 0, Sent: 0, Drafts: 0, Archive: 0, Deleted: 0, Unread: 0, Flagged: 0 };
  for (const entry of entries) {
    const folder = uiFolder(entry.mailbox);
    counts[folder] = (counts[folder] || 0) + 1;
    if (entry.mailbox === "inbox" && entry.is_read === false) counts.Unread += 1;
    if (entry.starred === true && entry.mailbox !== "trash") counts.Flagged += 1;
  }
  return counts;
}

async function sentMetadataMap(ids = []) {
  const unique = [...new Set(ids.filter(isUuid))];
  if (!unique.length) return new Map();
  const rows = await restRequest({
    table: TABLES.events,
    query: {
      select: "message_id,metadata,created_at",
      message_id: `in.(${unique.join(",")})`,
      action: "eq.MAIL_SENT",
      order: "created_at.desc",
      limit: 1000
    }
  });
  const map = new Map();
  for (const row of rows || []) {
    if (!map.has(row.message_id)) map.set(row.message_id, row.metadata || {});
  }
  return map;
}

async function listForAccount(account, { folder = "Inbox", filter = "all", search = "" } = {}) {
  const allEntries = await restRequest({
    table: TABLES.entries,
    query: {
      select: "*",
      account_id: `eq.${account.id}`,
      order: "updated_at.desc",
      limit: MAX_LIST
    }
  });

  const targetMailbox = dbMailbox(folder);
  let entries = (allEntries || []).filter((entry) => entry.mailbox === targetMailbox);
  if (clean(folder, 30) === "Unread" || clean(filter, 30) === "unread") {
    entries = entries.filter((entry) => entry.is_read === false);
  }
  if (clean(filter, 30) === "flagged") {
    entries = entries.filter((entry) => entry.starred === true);
  }

  const ids = entries.map((entry) => entry.message_id);
  const messages = await messageRows(ids);
  const messageById = new Map((messages || []).map((message) => [message.id, message]));
  const senders = await accountMap((messages || []).map((message) => message.sender_account_id));
  const recipients = await recipientRows(ids);
  const recipientAccounts = await accountMap(recipients.map((row) => row.account_id));
  const attachments = await attachmentRows(ids);
  const sentMetadata = await sentMetadataMap(ids);
  const attachmentCount = new Map();
  for (const row of attachments || []) attachmentCount.set(row.message_id, (attachmentCount.get(row.message_id) || 0) + 1);

  const term = lower(search, 500);
  const output = [];
  for (const entry of entries) {
    const message = messageById.get(entry.message_id);
    if (!message) continue;
    const sender = senders.get(message.sender_account_id);
    const toSummary = recipientSummary(message, recipients || [], recipientAccounts, account.id);
    const dto = publicMessage({
      message,
      entry,
      sender,
      toSummary,
      attachmentCount: attachmentCount.get(message.id) || 0,
      currentAccountId: account.id,
      priority: sentMetadata.get(message.id)?.priority || "Normal"
    });
    if (term) {
      const searchable = lower(`${dto.subject} ${dto.fromName} ${dto.fromAlias} ${dto.toSummary} ${dto.bodyPlain}`, 25000);
      if (!searchable.includes(term)) continue;
    }
    output.push(dto);
  }

  output.sort((a, b) => new Date(b.sentAt || 0).getTime() - new Date(a.sentAt || 0).getTime());
  return {
    ok: true,
    folder: clean(folder, 30) || "Inbox",
    filter: clean(filter, 30) || "all",
    messages: output,
    counts: countsFromEntries(allEntries || [])
  };
}

async function getOwnedEntry(accountId, messageId) {
  if (!isUuid(messageId)) throw new Error("MAIL_MESSAGE_ID_INVALID");
  return first(await restRequest({
    table: TABLES.entries,
    query: {
      select: "*",
      account_id: `eq.${accountId}`,
      message_id: `eq.${messageId}`,
      limit: 1
    }
  }));
}

async function getMessage(messageId) {
  return first(await restRequest({
    table: TABLES.messages,
    query: { select: "*", id: `eq.${messageId}`, limit: 1 }
  }));
}

async function canAccessThread(accountId, threadId) {
  if (!isUuid(threadId)) return false;
  const rows = await restRequest({
    table: TABLES.messages,
    query: { select: "id", thread_id: `eq.${threadId}`, limit: 200 }
  });
  const ids = (rows || []).map((row) => row.id);
  if (!ids.length) return false;
  const entries = await restRequest({
    table: TABLES.entries,
    query: {
      select: "message_id",
      account_id: `eq.${accountId}`,
      message_id: `in.(${ids.join(",")})`,
      limit: 1
    }
  });
  return Array.isArray(entries) && entries.length > 0;
}

async function resolveRecipientAccounts(values = []) {
  const directory = await activeDirectory();
  const byAddress = new Map(directory.map((row) => [lower(row.address, 254), row]));
  const bySkId = new Map(directory.filter((row) => row.sk_id).map((row) => [upper(row.sk_id, 40), row]));
  const result = [];
  const invalid = [];

  for (const raw of array(values)) {
    const account = byAddress.get(lower(raw, 254)) || bySkId.get(upper(raw, 40));
    if (!account) invalid.push(clean(raw, 254));
    else result.push(account);
  }
  return { result, invalid };
}

function dedupeRecipients(toRows, ccRows, bccRows) {
  const seen = new Set();
  const output = [];
  for (const [type, rows] of [["to", toRows], ["cc", ccRows], ["bcc", bccRows]]) {
    for (const row of rows) {
      if (seen.has(row.id)) continue;
      seen.add(row.id);
      output.push({ type, account: row });
    }
  }
  return output;
}

async function createThread(account, subject, explicitId = "") {
  const id = isUuid(explicitId) ? explicitId : uuid();
  const now = isoNow();
  const rows = await restRequest({
    table: TABLES.threads,
    method: "POST",
    body: {
      id,
      subject: clean(subject || "(No subject)", MAX_SUBJECT) || "(No subject)",
      created_by_account_id: account.id,
      last_message_at: null,
      created_at: now,
      updated_at: now
    }
  });
  return first(rows);
}

async function insertDraftMessage(account, payload, threadId) {
  const id = uuid();
  const now = isoNow();
  const rows = await restRequest({
    table: TABLES.messages,
    method: "POST",
    body: {
      id,
      thread_id: threadId,
      sender_account_id: account.id,
      reply_to_message_id: isUuid(payload.parentMessageId) ? payload.parentMessageId : null,
      subject: clean(payload.subject || "(No subject)", MAX_SUBJECT) || "(No subject)",
      body_plain: clean(payload.bodyPlain || payload.body, MAX_BODY),
      status: "draft",
      draft_recipients: {
        to: array(payload.to),
        cc: array(payload.cc),
        bcc: array(payload.bcc)
      },
      sent_at: null,
      created_at: now,
      updated_at: now
    }
  });
  await restRequest({
    table: TABLES.entries,
    method: "POST",
    body: {
      message_id: id,
      account_id: account.id,
      mailbox: "drafts",
      is_read: true,
      read_at: now,
      starred: false,
      archived_at: null,
      deleted_at: null,
      created_at: now,
      updated_at: now
    }
  });
  return first(rows);
}

async function ownedDraft(accountId, draftId) {
  if (!isUuid(draftId)) return null;
  const entry = await getOwnedEntry(accountId, draftId);
  if (!entry || entry.mailbox !== "drafts") return null;
  const message = await getMessage(draftId);
  if (!message || message.sender_account_id !== accountId || message.status !== "draft") return null;
  return { entry, message };
}

async function upsertDraft(account, payload) {
  const now = isoNow();
  let draft = await ownedDraft(account.id, payload.draftId);
  if (!draft) {
    let threadId = "";
    if (isUuid(payload.threadId) && await canAccessThread(account.id, payload.threadId)) threadId = payload.threadId;
    if (!threadId) threadId = (await createThread(account, payload.subject)).id;
    const message = await insertDraftMessage(account, payload, threadId);
    draft = { message, entry: await getOwnedEntry(account.id, message.id) };
  } else {
    const rows = await restRequest({
      table: TABLES.messages,
      method: "PATCH",
      query: { id: `eq.${draft.message.id}` },
      body: {
        subject: clean(payload.subject || "(No subject)", MAX_SUBJECT) || "(No subject)",
        body_plain: clean(payload.bodyPlain || payload.body, MAX_BODY),
        reply_to_message_id: isUuid(payload.parentMessageId) ? payload.parentMessageId : draft.message.reply_to_message_id,
        draft_recipients: { to: array(payload.to), cc: array(payload.cc), bcc: array(payload.bcc) },
        updated_at: now
      }
    });
    draft.message = first(rows) || { ...draft.message, ...payload, updated_at: now };
  }
  return draft;
}

async function storeAttachments(account, message, files = []) {
  const attachments = arrayObjects(files).slice(0, MAX_ATTACHMENTS);
  const saved = [];
  for (const file of attachments) {
    const fileName = sanitizeFileName(file.fileName || file.name);
    const mimeType = lower(file.mimeType || file.type, 150);
    const sizeBytes = Math.floor(Number(file.sizeBytes || file.size || 0));
    if (!fileName || !file.dataBase64) throw new Error("MAIL_ATTACHMENT_DATA_MISSING");
    if (!ALLOWED_ATTACHMENT_MIME.has(mimeType)) throw new Error("MAIL_ATTACHMENT_TYPE_NOT_ALLOWED");
    if (!sizeBytes || sizeBytes > MAX_ATTACHMENT_BYTES) throw new Error("MAIL_ATTACHMENT_SIZE_INVALID");

    const existing = await restRequest({
      table: TABLES.attachments,
      query: { select: "id", message_id: `eq.${message.id}`, file_name: `eq.${fileName}`, limit: 1 }
    });
    if (existing?.length) continue;

    const objectPath = `mail/${account.id}/${message.id}/${uuid()}-${fileName}`;
    const uploaded = await storageUploadBase64Object({
      bucket: ATTACHMENT_BUCKET,
      path: objectPath,
      dataBase64: file.dataBase64,
      mimeType,
      maxBytes: MAX_ATTACHMENT_BYTES,
      upsert: false
    });

    const rows = await restRequest({
      table: TABLES.attachments,
      method: "POST",
      body: {
        message_id: message.id,
        uploaded_by_account_id: account.id,
        object_path: uploaded.path,
        file_name: fileName,
        mime_type: mimeType,
        size_bytes: uploaded.sizeBytes,
        created_at: isoNow()
      }
    });
    const row = first(rows);
    if (row) saved.push(row);
  }
  return saved;
}

function arrayObjects(value) {
  return Array.isArray(value) ? value.filter((item) => item && typeof item === "object") : [];
}

async function finalizeSend(account, draft, payload) {
  const toResolved = await resolveRecipientAccounts(payload.to);
  const ccResolved = await resolveRecipientAccounts(payload.cc);
  const bccResolved = await resolveRecipientAccounts(payload.bcc);
  const invalid = [...toResolved.invalid, ...ccResolved.invalid, ...bccResolved.invalid];
  if (invalid.length) throw new Error(`MAIL_RECIPIENT_NOT_FOUND:${invalid.slice(0, 5).join(",")}`);

  const recipients = dedupeRecipients(toResolved.result, ccResolved.result, bccResolved.result);
  if (!recipients.length) throw new Error("MAIL_RECIPIENT_REQUIRED");

  await storeAttachments(account, draft.message, payload.attachments || []);

  const now = isoNow();
  await restRequest({
    table: TABLES.recipients,
    method: "POST",
    body: recipients.map(({ type, account: recipient }) => ({
      message_id: draft.message.id,
      account_id: recipient.id,
      recipient_type: type,
      delivered_at: now,
      created_at: now
    }))
  });

  const messageRowsUpdated = await restRequest({
    table: TABLES.messages,
    method: "PATCH",
    query: { id: `eq.${draft.message.id}` },
    body: {
      subject: clean(payload.subject || draft.message.subject || "(No subject)", MAX_SUBJECT) || "(No subject)",
      body_plain: clean(payload.bodyPlain || payload.body || draft.message.body_plain, MAX_BODY),
      status: "sent",
      draft_recipients: {},
      sent_at: now,
      updated_at: now
    }
  });
  const message = first(messageRowsUpdated) || { ...draft.message, status: "sent", sent_at: now };

  await restRequest({
    table: TABLES.entries,
    method: "PATCH",
    query: { message_id: `eq.${message.id}`, account_id: `eq.${account.id}` },
    body: {
      mailbox: "sent",
      is_read: true,
      read_at: now,
      archived_at: null,
      deleted_at: null,
      updated_at: now
    }
  });

  const recipientEntries = recipients
    .filter(({ account: recipient }) => recipient.id !== account.id)
    .map(({ account: recipient }) => ({
      message_id: message.id,
      account_id: recipient.id,
      mailbox: "inbox",
      is_read: false,
      read_at: null,
      starred: false,
      archived_at: null,
      deleted_at: null,
      created_at: now,
      updated_at: now
    }));
  if (recipientEntries.length) {
    await restRequest({ table: TABLES.entries, method: "POST", body: recipientEntries });
  }

  await restRequest({
    table: TABLES.threads,
    method: "PATCH",
    query: { id: `eq.${message.thread_id}` },
    body: { last_message_at: now, updated_at: now }
  });

  await logEvent({
    accountId: account.id,
    action: "MAIL_SENT",
    messageId: message.id,
    threadId: message.thread_id,
    metadata: {
      toCount: recipients.filter((r) => r.type === "to").length,
      ccCount: recipients.filter((r) => r.type === "cc").length,
      bccCount: recipients.filter((r) => r.type === "bcc").length,
      priority: clean(payload.priority || "Normal", 20) || "Normal"
    }
  });
  return message;
}

export async function getMailBootstrapCore() {
  const { session, account } = await context();
  const [directoryRows, inbox] = await Promise.all([
    activeDirectory(),
    listForAccount(account, { folder: "Inbox" })
  ]);

  return {
    ok: true,
    profile: profileDto(session, account),
    account: accountDto(account),
    apps: session.apps || [],
    connection: { connected: true, provider: "SUPABASE_INTERNAL_MAIL" },
    directory: { accounts: directoryRows.map(accountDto), groups: [] },
    branding: {
      companyName: "SKANDI Travels",
      website: "https://www.skanditravels.com",
      slogan: "Signature Travels, Unforgettable Moments."
    },
    ...inbox
  };
}

export async function getMailDirectoryCore() {
  await requireMailSession();
  return { ok: true, accounts: (await activeDirectory()).map(accountDto), groups: [] };
}

export async function listMailMessagesCore(payload = {}) {
  const { account } = await context();
  return listForAccount(account, payload);
}

export async function getMailMessageCore({ messageId } = {}) {
  const { account } = await context();
  const entry = await getOwnedEntry(account.id, messageId);
  if (!entry) throw new Error("MAIL_MESSAGE_NOT_AVAILABLE");
  const message = await getMessage(messageId);
  if (!message) throw new Error("MAIL_MESSAGE_NOT_FOUND");

  const sender = first(await restRequest({
    table: TABLES.accounts,
    query: { select: "*", id: `eq.${message.sender_account_id}`, limit: 1 }
  }));
  const recipients = await restRequest({
    table: TABLES.recipients,
    query: { select: "*", message_id: `eq.${message.id}`, limit: 1000 }
  });
  const recipientAccounts = await accountMap((recipients || []).map((r) => r.account_id));
  const senderOwns = message.sender_account_id === account.id;
  const recipientDto = (recipients || [])
    .filter((row) => senderOwns || row.recipient_type !== "bcc" || row.account_id === account.id)
    .map((row) => {
      const target = recipientAccounts.get(row.account_id) || {};
      return {
        type: upper(row.recipient_type, 10),
        alias: lower(target.address, 254),
        name: clean(target.display_name || target.address, 180),
        skId: clean(target.sk_id, 40)
      };
    });

  const attachmentData = await restRequest({
    table: TABLES.attachments,
    query: { select: "*", message_id: `eq.${message.id}`, order: "created_at.asc", limit: 100 }
  });
  const attachments = [];
  for (const item of attachmentData || []) {
    const signed = await storageCreateSignedReadUrl({
      bucket: ATTACHMENT_BUCKET,
      path: item.object_path,
      expiresIn: 600,
      download: true
    });
    attachments.push({
      attachmentId: item.id,
      fileName: item.file_name,
      mimeType: item.mime_type,
      sizeBytes: Number(item.size_bytes || 0),
      mediaUrl: signed.signedUrl,
      url: signed.signedUrl
    });
  }

  let currentEntry = entry;
  if (!entry.is_read) {
    const now = isoNow();
    const rows = await restRequest({
      table: TABLES.entries,
      method: "PATCH",
      query: { message_id: `eq.${message.id}`, account_id: `eq.${account.id}` },
      body: { is_read: true, read_at: now, updated_at: now }
    });
    currentEntry = first(rows) || { ...entry, is_read: true, read_at: now };
  }

  const messageMetadata = await sentMetadataMap([message.id]);
  const dto = publicMessage({
    message,
    entry: currentEntry,
    sender,
    toSummary: recipientSummary(message, recipients || [], recipientAccounts, account.id),
    attachmentCount: attachments.length,
    currentAccountId: account.id,
    priority: messageMetadata.get(message.id)?.priority || "Normal"
  });
  dto.attachments = attachments;
  dto.toSummary = recipientDto.filter((r) => r.type === "TO").map((r) => r.alias || r.name).filter(Boolean).join(", ");
  dto.ccSummary = recipientDto.filter((r) => r.type === "CC").map((r) => r.alias || r.name).filter(Boolean).join(", ");
  dto.bccSummary = senderOwns
    ? recipientDto.filter((r) => r.type === "BCC").map((r) => r.alias || r.name).filter(Boolean).join(", ")
    : "";
  return { ok: true, message: dto, recipients: recipientDto };
}

export async function saveMailDraftCore(payload = {}) {
  const { account } = await context();
  const draft = await upsertDraft(account, payload);
  await logEvent({ accountId: account.id, action: "MAIL_DRAFT_SAVED", messageId: draft.message.id, threadId: draft.message.thread_id });
  return { ok: true, draftId: draft.message.id, message: "Draft saved." };
}

export async function sendMailMessageCore(payload = {}) {
  const { account } = await context();
  const body = clean(payload.bodyPlain || payload.body, MAX_BODY);
  const subject = clean(payload.subject, MAX_SUBJECT);
  if (!subject) throw new Error("MAIL_SUBJECT_REQUIRED");
  if (!body) throw new Error("MAIL_BODY_REQUIRED");
  if (!array(payload.to).length && !array(payload.cc).length && !array(payload.bcc).length) {
    throw new Error("MAIL_RECIPIENT_REQUIRED");
  }

  let draft = await ownedDraft(account.id, payload.draftId);
  if (!draft) draft = await upsertDraft(account, payload);
  else draft = await upsertDraft(account, { ...payload, draftId: draft.message.id });

  if (isUuid(payload.parentMessageId)) {
    const parentEntry = await getOwnedEntry(account.id, payload.parentMessageId);
    if (!parentEntry) throw new Error("MAIL_PARENT_MESSAGE_NOT_AVAILABLE");
  }

  const message = await finalizeSend(account, draft, payload);
  return {
    ok: true,
    messageId: message.id,
    threadId: message.thread_id,
    message: publicMessage({
      message,
      entry: { mailbox: "sent", is_read: true, starred: false },
      sender: account,
      currentAccountId: account.id,
      priority: clean(payload.priority || "Normal", 20) || "Normal"
    })
  };
}

export async function updateMailUserStateCore({ messageId, action, folder } = {}) {
  const { account } = await context();
  const entry = await getOwnedEntry(account.id, messageId);
  if (!entry) throw new Error("MAIL_MESSAGE_NOT_AVAILABLE");
  const now = isoNow();
  const normalized = clean(action, 40);
  const next = { updated_at: now };

  if (normalized === "markRead") {
    next.is_read = true;
    next.read_at = now;
  } else if (normalized === "markUnread") {
    next.is_read = false;
    next.read_at = null;
  } else if (normalized === "flag" || normalized === "unflag") {
    next.starred = normalized === "unflag" ? false : !entry.starred;
  } else if (normalized === "archive") {
    next.mailbox = "archive";
    next.archived_at = now;
    next.deleted_at = null;
  } else if (normalized === "deleteForMe") {
    next.mailbox = "trash";
    next.deleted_at = now;
    next.archived_at = null;
  } else if (normalized === "restore") {
    next.mailbox = dbMailbox(folder || "Inbox");
    next.deleted_at = null;
    next.archived_at = next.mailbox === "archive" ? now : null;
  } else if (normalized === "move") {
    next.mailbox = dbMailbox(folder || "Inbox");
    next.archived_at = next.mailbox === "archive" ? now : null;
    next.deleted_at = next.mailbox === "trash" ? now : null;
  } else {
    throw new Error("MAIL_STATE_ACTION_NOT_SUPPORTED");
  }

  await restRequest({
    table: TABLES.entries,
    method: "PATCH",
    query: { message_id: `eq.${messageId}`, account_id: `eq.${account.id}` },
    body: next
  });
  await logEvent({ accountId: account.id, action: `MAIL_${upper(normalized, 60)}`, messageId, metadata: { folder: folder || "" } });
  return { ok: true, message: "Mailbox updated." };
}

export async function getMailDiagnosticsCore() {
  const { session, account } = await context();
  const [threads, messages, entries, recipients, attachments] = await Promise.all([
    restRequest({ table: TABLES.threads, query: { select: "id", limit: 1 } }),
    restRequest({ table: TABLES.messages, query: { select: "id", limit: 1 } }),
    restRequest({ table: TABLES.entries, query: { select: "message_id", account_id: `eq.${account.id}`, limit: 1 } }),
    restRequest({ table: TABLES.recipients, query: { select: "message_id", limit: 1 } }),
    restRequest({ table: TABLES.attachments, query: { select: "id", limit: 1 } })
  ]);
  return {
    ok: true,
    provider: "SUPABASE_INTERNAL_MAIL",
    account: accountDto(account),
    profile: profileDto(session, account),
    objects: {
      internal_mail_threads: Array.isArray(threads),
      internal_mail_messages: Array.isArray(messages),
      internal_mail_entries: Array.isArray(entries),
      internal_mail_recipients: Array.isArray(recipients),
      internal_mail_attachments: Array.isArray(attachments)
    }
  };
}
