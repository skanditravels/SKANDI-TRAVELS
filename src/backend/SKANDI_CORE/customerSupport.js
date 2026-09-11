// /src/backend/SKANDI_CORE/customerSupport.js
// SKANDI Support Center — canonical support domain core.
// R-003.7
//
// Ownership:
// - Supabase customer_support_cases/messages = canonical case/message history.
// - public.customer_profiles = canonical customer identity.
// - LiveKit = realtime room/agent transport only.
// - Wix Members = customer authentication; staffAuth = internal staff authentication.

import { restRequest } from "./supabaseServer.js";
import {
  getCustomerContext,
  customerOwnershipKeys
} from "./customerProfile.js";
import { requireStaffPortalSessionCore } from "./staffAuth.js";
import {
  getLiveKitSupportState,
  createCustomerLiveKitSession,
  createAgentLiveKitSession,
  liveKitSupportRoomName
} from "./livekitSupportClient.js";

const CASES = "customer_support_cases";
const MESSAGES = "customer_support_messages";
const MAX_CASES = 250;
const MAX_MESSAGES = 1000;
const MAX_MESSAGE = 20000;
const CHAT_SOURCE = "my-profile-chat";
const LIVEKIT_TOPIC = "skandi.support.chat";

function clean(value, max = 5000) {
  return String(value ?? "").trim().slice(0, max);
}

function lower(value, max = 5000) {
  return clean(value, max).toLowerCase();
}

function object(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function array(value) {
  return Array.isArray(value) ? value : [];
}

function nowIso() {
  return new Date().toISOString();
}

function publicError(code, message) {
  const error = new Error(message || code);
  error.code = code;
  error.publicMessage = message || "Support Center action failed.";
  return error;
}

function normalizeEmail(value) {
  const email = lower(value, 320);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

function normalizeStatus(value) {
  const v = lower(value || "open", 40).replace(/_/g, "-").replace(/\s+/g, "-");
  if (v === "onhold") return "on-hold";
  return ["new", "open", "pending", "on-hold", "solved", "closed"].includes(v) ? v : "open";
}

function dbStatus(value) {
  const status = normalizeStatus(value);
  return status === "on-hold" ? "On Hold" : status.charAt(0).toUpperCase() + status.slice(1);
}

function normalizePriority(value) {
  const v = lower(value || "normal", 40);
  return ["low", "normal", "high", "urgent"].includes(v) ? v : "normal";
}

function normalizeCategory(value) {
  return clean(value || "Support", 120) || "Support";
}

function uuidLike() {
  try {
    if (globalThis?.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  } catch (_) {}
  const seed = `${Date.now()}-${Math.random()}-${Math.random()}`;
  return seed.replace(/[^a-zA-Z0-9]/g, "").slice(0, 32);
}

function newCaseId() {
  return `CASE_${Date.now()}_${uuidLike().replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

function newMessageId() {
  return `MSG_${Date.now()}_${uuidLike().replace(/-/g, "").slice(0, 10).toUpperCase()}`;
}

async function selectRows(table, query) {
  return array(await restRequest({ table, method: "GET", query }));
}

async function insertRow(table, body) {
  return array(await restRequest({ table, method: "POST", body }))[0] || null;
}

async function patchRows(table, query, body) {
  return array(await restRequest({ table, method: "PATCH", query, body }));
}

async function deleteRows(table, query) {
  return array(await restRequest({ table, method: "DELETE", query }));
}

function ownershipOr(context) {
  const keys = customerOwnershipKeys(context);
  const clauses = [];
  if (keys.memberId) clauses.push(`member_id.eq.${keys.memberId}`);
  if (keys.wixMemberId) clauses.push(`wix_member_id.eq.${keys.wixMemberId}`);
  if (keys.supabaseUserId) clauses.push(`supabase_user_id.eq.${keys.supabaseUserId}`);
  if (!clauses.length) throw publicError("CUSTOMER_PROFILE_MISSING", "Your SKANDI profile could not be verified.");
  return `(${clauses.join(",")})`;
}

function casePayload(row) {
  return object(row?.payload);
}

function safeTraveler(row, context = null) {
  const payload = casePayload(row);
  const requester = object(payload.requester);
  const profile = context?.profile || {};
  const name = clean(
    requester.name ||
    payload.fullName ||
    [payload.firstName, payload.lastName].filter(Boolean).join(" ") ||
    profile.displayName || profile.fullName,
    200
  );
  return {
    id: clean(profile.id, 120) || null,
    name: name || "SKANDI Traveler",
    initials: (name || "ST").split(/\s+/).map(v => v[0]).join("").slice(0, 2).toUpperCase(),
    email: normalizeEmail(row?.email || requester.email || payload.email || profile.email),
    phone: clean(requester.phone || payload.phone || profile.phone, 80),
    organization: "",
    vip: Boolean(context?.clubProfile),
    plan: clean(context?.clubProfile?.tierName || payload.tier, 120),
    locale: clean(profile.preferredLanguage || payload.locale, 30),
    timezone: clean(payload.timezone, 80),
    notes: ""
  };
}

function caseDto(row, { customerContext = null, includePayload = false } = {}) {
  const payload = casePayload(row);
  const bookingRef = clean(payload.bookingRef || payload.bookingReference || payload.pnr, 100).toUpperCase();
  const status = normalizeStatus(row?.status);
  const priority = normalizePriority(row?.priority);
  const traveler = safeTraveler(row, customerContext);
  const dto = {
    id: clean(row?.case_id || row?.id, 140),
    internalId: clean(row?.id, 120),
    caseId: clean(row?.case_id, 140),
    case_id: clean(row?.case_id, 140),
    externalId: clean(row?.case_id, 140),
    subject: clean(row?.subject, 300) || "SKANDI Support case",
    category: normalizeCategory(row?.category),
    priority,
    status,
    source: clean(row?.source, 120),
    page: clean(row?.page, 200),
    tab: clean(row?.tab, 120),
    pnr: bookingRef,
    bookingRef,
    booking_ref: bookingRef,
    channel: clean(payload.channel, 40) || (row?.source === CHAT_SOURCE ? "chat" : "web"),
    channelLabel: clean(payload.channelLabel, 80) || (row?.source === CHAT_SOURCE ? "LiveKit Chat" : "Support Center"),
    type: clean(payload.type, 40) || "question",
    group: clean(payload.group, 120) || "Customer Experience",
    queue: clean(payload.queue, 120) || "open",
    tier: clean(payload.tier || customerContext?.clubProfile?.tierName, 120),
    createdAt: row?.created_at || "",
    updatedAt: row?.updated_at || row?.created_at || "",
    created_at: row?.created_at || "",
    updated_at: row?.updated_at || row?.created_at || "",
    assignedAgentId: clean(row?.assigned_agent_id, 120) || null,
    assignedAgentName: clean(row?.assigned_agent_name, 200),
    assigneeId: clean(row?.assigned_agent_id, 120) || null,
    assigneeName: clean(row?.assigned_agent_name, 200),
    tags: array(payload.tags).map(v => clean(v, 80)).filter(Boolean),
    followers: array(payload.followers),
    ccs: array(payload.ccs),
    unread: payload.unread === true,
    slaMinutes: Number(payload.slaMinutes) || null,
    summary: clean(payload.summary || payload.message || payload.description, 3000),
    requester: traveler,
    customer: traveler,
    travel: object(payload.travel),
    booking: object(payload.booking),
    livekitReady: Boolean(payload.livekit?.roomName)
  };
  if (includePayload) dto.payload = payload;
  return dto;
}

function messageDto(row) {
  const payload = object(row?.payload);
  const senderType = lower(row?.sender_type || payload.senderType, 40) || "customer";
  return {
    id: clean(row?.message_id || row?.id, 160),
    messageId: clean(row?.message_id || row?.id, 160),
    message_id: clean(row?.message_id || row?.id, 160),
    caseId: clean(row?.case_id, 160),
    case_id: clean(row?.case_id, 160),
    senderType,
    sender_type: senderType,
    senderName: clean(row?.sender_name || payload.senderName, 200) || (senderType === "agent" ? "SKANDI Support" : "Traveler"),
    sender_name: clean(row?.sender_name || payload.senderName, 200) || (senderType === "agent" ? "SKANDI Support" : "Traveler"),
    message: clean(row?.message, MAX_MESSAGE),
    content: clean(row?.message, MAX_MESSAGE),
    body: clean(row?.message, MAX_MESSAGE),
    channel: clean(row?.channel || payload.channel, 40) || "chat",
    private: payload.private === true,
    kind: payload.private === true ? "internal" : "public",
    createdAt: row?.created_at || "",
    created_at: row?.created_at || "",
    at: row?.created_at || ""
  };
}

async function messagesForCase(caseId, { includePrivate = true } = {}) {
  const rows = await selectRows(MESSAGES, {
    select: "*",
    case_id: `eq.${clean(caseId, 160)}`,
    order: "created_at.asc",
    limit: MAX_MESSAGES
  });
  return rows.map(messageDto).filter(item => includePrivate || item.private !== true);
}

async function getCaseRow(caseId) {
  const id = clean(caseId, 160);
  if (!id) throw publicError("SUPPORT_CASE_REQUIRED", "Choose a support case first.");
  const rows = await selectRows(CASES, { select: "*", case_id: `eq.${id}`, limit: 2 });
  if (rows.length !== 1) throw publicError("SUPPORT_CASE_NOT_FOUND", "That support case was not found.");
  return rows[0];
}

function customerOwnsCase(row, context) {
  const keys = customerOwnershipKeys(context);
  return Boolean(
    (keys.memberId && clean(row?.member_id, 160) === keys.memberId) ||
    (keys.wixMemberId && clean(row?.wix_member_id, 160) === keys.wixMemberId) ||
    (keys.supabaseUserId && clean(row?.supabase_user_id, 120) === keys.supabaseUserId)
  );
}

async function requireCustomerCase(caseId) {
  const context = await getCustomerContext({ required: true, createIfMissing: true });
  const row = await getCaseRow(caseId);
  if (!customerOwnsCase(row, context)) throw publicError("SUPPORT_CASE_FORBIDDEN", "That case does not belong to your profile.");
  return { context, row };
}

async function ensureLiveKitMetadata(row) {
  const payload = casePayload(row);
  const roomName = liveKitSupportRoomName(row);
  if (payload.livekit?.roomName === roomName) return row;
  const nextPayload = {
    ...payload,
    livekit: {
      ...object(payload.livekit),
      roomName,
      topic: LIVEKIT_TOPIC,
      provider: "livekit",
      updatedAt: nowIso()
    }
  };
  const rows = await patchRows(CASES, { id: `eq.${row.id}` }, { payload: nextPayload, updated_at: nowIso() });
  return rows[0] || { ...row, payload: nextPayload, updated_at: nowIso() };
}

async function persistMessage({ caseRow, customerContext = null, senderType, senderName, content, channel = "chat", privateNote = false, payload = {} }) {
  const text = clean(content, MAX_MESSAGE);
  if (!text) throw publicError("SUPPORT_MESSAGE_REQUIRED", "Write a message first.");
  const keys = customerContext ? customerOwnershipKeys(customerContext) : {};
  const row = await insertRow(MESSAGES, {
    message_id: newMessageId(),
    case_id: caseRow.case_id,
    member_id: keys.memberId || caseRow.member_id || null,
    wix_member_id: keys.wixMemberId || caseRow.wix_member_id || null,
    sender_type: clean(senderType, 40) || "customer",
    sender_name: clean(senderName, 200) || (senderType === "agent" ? "SKANDI Support" : "Traveler"),
    message: text,
    channel: clean(channel, 40) || "chat",
    payload: {
      ...object(payload),
      private: privateNote === true,
      transport: channel === "chat" ? "livekit" : channel
    },
    created_at: nowIso()
  });
  await patchRows(CASES, { id: `eq.${caseRow.id}` }, { updated_at: nowIso() });
  return messageDto(row || { message_id: newMessageId(), case_id: caseRow.case_id, sender_type: senderType, sender_name: senderName, message: text, channel, payload: { private: privateNote }, created_at: nowIso() });
}

async function createCaseRow({ context = null, anonymous = null, input = {}, source = "support-center", page = "", tab = "" }) {
  const profile = context?.profile || {};
  const keys = context ? customerOwnershipKeys(context) : {};
  const data = object(input);
  const firstName = clean(data.firstName || profile.firstName, 100);
  const lastName = clean(data.lastName || profile.lastName, 100);
  const fullName = clean(data.fullName || [firstName, lastName].filter(Boolean).join(" ") || profile.displayName, 200);
  const email = normalizeEmail(profile.email || data.email || anonymous?.email);
  if (!context && !email) throw publicError("SUPPORT_EMAIL_REQUIRED", "Enter a valid email address so SKANDI Support can follow up.");

  const caseId = newCaseId();
  const payload = {
    ...data,
    firstName,
    lastName,
    fullName,
    requester: {
      name: fullName || "Traveler",
      email,
      phone: clean(profile.phone || data.phone, 80)
    },
    bookingRef: clean(data.bookingRef || data.bookingReference || data.pnr, 100).toUpperCase(),
    channel: source === CHAT_SOURCE ? "chat" : clean(data.channel, 40) || "web",
    tier: clean(context?.clubProfile?.tierName || data.tier, 120),
    tags: array(data.tags).map(v => clean(v, 80)).filter(Boolean),
    supportSchemaVersion: "R-003.7",
    transportProvider: "livekit"
  };

  let row = await insertRow(CASES, {
    case_id: caseId,
    member_id: keys.memberId || null,
    wix_member_id: keys.wixMemberId || null,
    supabase_user_id: keys.supabaseUserId || null,
    email: email || null,
    subject: clean(data.subject, 300) || (source === CHAT_SOURCE ? "SKANDI Club Support" : "SKANDI Support request"),
    category: normalizeCategory(data.category || (source === CHAT_SOURCE ? "Club Support" : "Support")),
    priority: normalizePriority(data.priority || (context?.clubProfile ? "high" : "normal")),
    status: "Open",
    source: clean(source, 120),
    page: clean(page || data.page, 200),
    tab: clean(tab || data.tab, 120),
    payload,
    created_at: nowIso(),
    updated_at: nowIso()
  });
  if (!row) throw publicError("SUPPORT_CASE_CREATE_FAILED", "SKANDI Support could not create the case.");
  row = await ensureLiveKitMetadata(row);
  return row;
}

async function createCaseWithInitialMessage({ context = null, input = {}, source, page, tab, anonymous = null }) {
  const row = await createCaseRow({ context, input, source, page, tab, anonymous });
  const content = clean(input.message || input.description || input.content, MAX_MESSAGE);
  let initialMessage = null;
  if (content) {
    initialMessage = await persistMessage({
      caseRow: row,
      customerContext: context,
      senderType: "customer",
      senderName: clean(context?.profile?.displayName || input.fullName || [input.firstName, input.lastName].filter(Boolean).join(" "), 200) || "Traveler",
      content,
      channel: source === CHAT_SOURCE ? "chat" : "web",
      payload: { source, initial: true }
    });
  }
  return { row, initialMessage };
}

export async function getPublicSupportBootstrapCore() {
  const memberContext = await getCustomerContext({ required: false, createIfMissing: true }).catch(() => ({ loggedIn: false }));
  return {
    ok: true,
    loggedIn: memberContext?.loggedIn === true,
    profile: memberContext?.loggedIn ? memberContext.profile : null,
    clubProfile: memberContext?.loggedIn ? memberContext.clubProfile : null,
    supportPath: "/my-profile/support",
    livekit: await getLiveKitSupportState()
  };
}

async function assertPublicSubmissionRate(input = {}) {
  const email = normalizeEmail(input.email);
  if (!email) return;
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const recent = await selectRows(CASES, {
    select: "id",
    email: `eq.${email}`,
    source: "eq.public-help",
    created_at: `gte.${since}`,
    limit: 6
  });
  if (recent.length >= 5) {
    throw publicError("SUPPORT_RATE_LIMITED", "Too many support requests were submitted recently. Please use your existing case or try again later.");
  }
}

export async function createPublicSupportCaseCore(input = {}) {
  const context = await getCustomerContext({ required: false, createIfMissing: true }).catch(() => ({ loggedIn: false }));
  const linked = context?.loggedIn ? context : null;
  if (!linked) await assertPublicSubmissionRate(input);
  const { row, initialMessage } = await createCaseWithInitialMessage({
    context: linked,
    anonymous: linked ? null : { email: input.email },
    input,
    source: "public-help",
    page: "/help",
    tab: "how-can-we-help"
  });
  return {
    ok: true,
    case: caseDto(row, { customerContext: linked }),
    caseId: row.case_id,
    initialMessage
  };
}

export async function getCustomerSupportBootstrapCore(contextInput = {}) {
  const context = await getCustomerContext({ required: true, createIfMissing: true });
  const cases = await listCustomerCasesForContext(context);
  return {
    ok: true,
    profile: context.profile,
    clubProfile: context.clubProfile,
    supportContext: {
      bookingRef: clean(contextInput.bookingRef || contextInput.pnr, 100).toUpperCase(),
      topic: clean(contextInput.topic, 160),
      priorityRouting: Boolean(context.clubProfile)
    },
    livekit: await getLiveKitSupportState(),
    cases
  };
}

async function listCustomerCasesForContext(context) {
  const rows = await selectRows(CASES, {
    select: "*",
    or: ownershipOr(context),
    order: "updated_at.desc",
    limit: MAX_CASES
  });
  return rows.map(row => caseDto(row, { customerContext: context }));
}

export async function listCustomerSupportCasesCore() {
  const context = await getCustomerContext({ required: true, createIfMissing: true });
  return { ok: true, cases: await listCustomerCasesForContext(context) };
}

export async function createCustomerSupportCaseCore(input = {}) {
  const context = await getCustomerContext({ required: true, createIfMissing: true });
  const { row, initialMessage } = await createCaseWithInitialMessage({
    context,
    input: object(input.case && typeof input.case === "object" ? input.case : input),
    source: clean(input.source, 120) || "my-support",
    page: clean(input.page, 200) || "/my-profile/support",
    tab: clean(input.tab, 120) || "support-center"
  });
  const session = await createCustomerLiveKitSession({ caseRow: row, customerContext: context, ensureAgent: true });
  return {
    ok: true,
    case: caseDto(row, { customerContext: context }),
    caseId: row.case_id,
    initialMessage,
    livekitSession: session
  };
}

export async function getCustomerSupportCaseCore({ caseId } = {}) {
  const { context, row: raw } = await requireCustomerCase(caseId);
  const row = await ensureLiveKitMetadata(raw);
  const [messages, session] = await Promise.all([
    messagesForCase(row.case_id, { includePrivate: false }),
    createCustomerLiveKitSession({ caseRow: row, customerContext: context, ensureAgent: true })
  ]);
  return {
    ok: true,
    case: caseDto(row, { customerContext: context }),
    messages,
    livekitSession: session
  };
}

export async function addCustomerSupportMessageCore({ caseId, content, channel = "chat" } = {}) {
  const { context, row: raw } = await requireCustomerCase(caseId);
  const row = await ensureLiveKitMetadata(raw);
  const sentMessage = await persistMessage({
    caseRow: row,
    customerContext: context,
    senderType: "customer",
    senderName: context.profile?.displayName || "Traveler",
    content,
    channel,
    payload: { source: "customer-support-center" }
  });
  return {
    ok: true,
    sentMessage,
    case: caseDto({ ...row, updated_at: nowIso() }, { customerContext: context }),
    livekitSession: await createCustomerLiveKitSession({ caseRow: row, customerContext: context, ensureAgent: true })
  };
}

async function findOpenChatCase(context) {
  const rows = await selectRows(CASES, {
    select: "*",
    or: ownershipOr(context),
    source: `eq.${CHAT_SOURCE}`,
    order: "updated_at.desc",
    limit: 20
  });
  return rows.find(row => !["solved", "closed"].includes(normalizeStatus(row.status))) || null;
}

export async function startCustomerSupportChatCore({ page = "my-profile", tab = "overview", bookingRef = "" } = {}) {
  const context = await getCustomerContext({ required: true, createIfMissing: true });
  let row = await findOpenChatCase(context);
  if (!row) {
    row = await createCaseRow({
      context,
      input: {
        subject: "SKANDI Club Support",
        category: "Club Support",
        priority: context.clubProfile ? "high" : "normal",
        bookingRef,
        channel: "chat"
      },
      source: CHAT_SOURCE,
      page,
      tab
    });
  }
  const messages = await messagesForCase(row.case_id, { includePrivate: false });
  return {
    ok: true,
    case: caseDto(row, { customerContext: context }),
    messages,
    livekitSession: await createCustomerLiveKitSession({ caseRow: row, customerContext: context, ensureAgent: true })
  };
}

export async function sendCustomerSupportChatMessageCore({ caseId, content, page = "my-profile", tab = "overview", bookingRef = "" } = {}) {
  let detail;
  if (clean(caseId, 160)) {
    detail = await requireCustomerCase(caseId);
  } else {
    const started = await startCustomerSupportChatCore({ page, tab, bookingRef });
    detail = await requireCustomerCase(started.case.caseId);
  }
  const row = await ensureLiveKitMetadata(detail.row);
  const sentMessage = await persistMessage({
    caseRow: row,
    customerContext: detail.context,
    senderType: "customer",
    senderName: detail.context.profile?.displayName || "Traveler",
    content,
    channel: "chat",
    payload: { source: CHAT_SOURCE }
  });
  return {
    ok: true,
    case: caseDto(row, { customerContext: detail.context }),
    sentMessage,
    livekitSession: await createCustomerLiveKitSession({ caseRow: row, customerContext: detail.context, ensureAgent: true })
  };
}

function staffProfile(session) {
  const p = object(session?.profile);
  return {
    id: clean(p.id || p.agentUserId, 120),
    name: clean(p.displayName || p.preferredName || p.name || [p.firstName, p.lastName].filter(Boolean).join(" "), 200) || "SKANDI Support",
    email: normalizeEmail(p.email || p.corporateEmailAddress),
    initials: clean(p.initials, 8) || "SK"
  };
}

async function requireAgentSession() {
  const session = await requireStaffPortalSessionCore();
  return { session, agent: staffProfile(session) };
}

export async function listAgentSupportCasesCore(filters = {}) {
  await requireAgentSession();
  const query = { select: "*", order: "updated_at.desc", limit: MAX_CASES };
  const status = clean(filters.status, 40);
  const priority = clean(filters.priority, 40);
  const queue = clean(filters.queue, 80);
  if (status) query.status = `eq.${dbStatus(status)}`;
  if (priority) query.priority = `eq.${normalizePriority(priority)}`;
  const rows = await selectRows(CASES, query);
  let mapped = rows.map(row => caseDto(row, { includePayload: true }));
  if (queue && !["open", "all", "views"].includes(lower(queue, 40))) {
    mapped = mapped.filter(item => lower(item.queue, 80) === lower(queue, 80) || lower(item.category, 80).includes(lower(queue, 80)));
  }
  const q = lower(filters.search || filters.query, 200);
  if (q) mapped = mapped.filter(item => [item.caseId, item.subject, item.pnr, item.requester?.name, item.requester?.email, item.category, item.status, item.priority].join(" ").toLowerCase().includes(q));
  return { ok: true, cases: mapped };
}

export async function getAgentSupportBootstrapCore() {
  const { session, agent } = await requireAgentSession();
  const result = await listAgentSupportCasesCore({});
  return {
    ok: true,
    session: { agentId: agent.id, agentName: agent.name, agentEmail: agent.email, agentInitials: agent.initials },
    agent: { id: agent.id, name: agent.name, email: agent.email, initials: agent.initials, role: "agent" },
    cases: result.cases,
    users: [],
    groups: ["Customer Experience", "Club Support", "Claims", "Flight Operations", "Baggage Support"],
    macros: [],
    articles: [],
    triggers: [],
    automations: [],
    livekit: await getLiveKitSupportState(),
    authorization: {
      accessRole: session.accessRole,
      permissionPreset: session.permissionPreset,
      permissionGroups: session.permissionGroups,
      allowedApps: session.allowedApps
    }
  };
}

export async function getAgentSupportCaseCore({ caseId } = {}) {
  const { session } = await requireAgentSession();
  const row = await ensureLiveKitMetadata(await getCaseRow(caseId));
  const messages = await messagesForCase(row.case_id, { includePrivate: true });
  return {
    ok: true,
    case: { ...caseDto(row, { includePayload: true }), history: messages },
    messages,
    livekitSession: await createAgentLiveKitSession({ caseRow: row, staffSession: session, ensureAgent: false })
  };
}

export async function replyAgentSupportCaseCore({ caseId, content, privateNote = false, submitAs = "" } = {}) {
  const { session, agent } = await requireAgentSession();
  const row = await ensureLiveKitMetadata(await getCaseRow(caseId));
  const sentMessage = await persistMessage({
    caseRow: row,
    senderType: "agent",
    senderName: agent.name,
    content,
    channel: privateNote ? "internal" : "chat",
    privateNote,
    payload: { source: "agent-workspace", agentUserId: agent.id }
  });
  const patch = { updated_at: nowIso() };
  if (submitAs) patch.status = dbStatus(submitAs);
  if (!row.assigned_agent_id) {
    patch.assigned_agent_id = agent.id || null;
    patch.assigned_agent_name = agent.name;
  }
  const updated = (await patchRows(CASES, { id: `eq.${row.id}` }, patch))[0] || { ...row, ...patch };
  return {
    ok: true,
    sentMessage,
    privateNote: privateNote === true,
    case: caseDto(updated, { includePayload: true }),
    livekitSession: privateNote ? null : await createAgentLiveKitSession({ caseRow: updated, staffSession: session, ensureAgent: false })
  };
}

export async function updateAgentSupportCaseCore({ caseId, updates = {} } = {}) {
  const { agent } = await requireAgentSession();
  const row = await getCaseRow(caseId);
  const input = object(updates);
  const payload = { ...casePayload(row) };
  const patch = { updated_at: nowIso() };

  if (input.status !== undefined) patch.status = dbStatus(input.status);
  if (input.priority !== undefined) patch.priority = normalizePriority(input.priority);
  if (input.category !== undefined) patch.category = normalizeCategory(input.category);
  if (input.assigneeId !== undefined) patch.assigned_agent_id = clean(input.assigneeId, 120) || null;
  if (input.assigneeName !== undefined) patch.assigned_agent_name = clean(input.assigneeName, 200) || null;
  if (input.group !== undefined) payload.group = clean(input.group, 120);
  if (input.queue !== undefined) payload.queue = clean(input.queue, 120);
  if (input.type !== undefined) payload.type = clean(input.type, 40);
  if (input.followers !== undefined) payload.followers = array(input.followers).slice(0, 100);
  if (input.ccs !== undefined) payload.ccs = array(input.ccs).slice(0, 100);
  if (input.tags !== undefined) payload.tags = array(input.tags).map(v => clean(v, 80)).filter(Boolean).slice(0, 100);
  patch.payload = payload;

  if (input.internalNote?.content) {
    await persistMessage({
      caseRow: row,
      senderType: "agent",
      senderName: agent.name,
      content: input.internalNote.content,
      channel: "internal",
      privateNote: true,
      payload: { source: "agent-workspace", agentUserId: agent.id }
    });
  }
  if (input.call?.message?.body) {
    await persistMessage({
      caseRow: row,
      senderType: "agent",
      senderName: agent.name,
      content: input.call.message.body,
      channel: "voice",
      privateNote: false,
      payload: { source: "agent-workspace", call: { outcome: input.call.outcome, duration: input.call.duration } }
    });
  }

  const updated = (await patchRows(CASES, { id: `eq.${row.id}` }, patch))[0] || { ...row, ...patch };
  return { ok: true, case: caseDto(updated, { includePayload: true }) };
}

export async function createAgentSupportCaseCore(input = {}) {
  const { agent } = await requireAgentSession();
  const row = await createCaseRow({
    input: { ...object(input), priority: input.priority || "normal" },
    source: "agent-workspace",
    page: "/riaintra/customer-service",
    tab: "agent"
  });
  if (input.message || input.description) {
    await persistMessage({ caseRow: row, senderType: "agent", senderName: agent.name, content: input.message || input.description, channel: "internal", privateNote: true, payload: { source: "agent-workspace" } });
  }
  return { ok: true, case: caseDto(row, { includePayload: true }) };
}

export async function deleteAgentSupportCaseCore({ caseId } = {}) {
  await requireAgentSession();
  const row = await getCaseRow(caseId);
  await deleteRows(MESSAGES, { case_id: `eq.${row.case_id}` });
  await deleteRows(CASES, { id: `eq.${row.id}` });
  return { ok: true, caseId: row.case_id };
}
