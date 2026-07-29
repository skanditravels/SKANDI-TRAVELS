import { requireCustomerContext } from "src/backend/core/authContext";
import { clean, uid, nowIso } from "src/backend/core/response";
import { publishEvent } from "src/ackend/core/eventBus";
import {
  createSupportCase,
  createSupportMessage,
  listCases,
  listCasesByMember,
  getCaseByCaseId,
  listMessagesByCaseId,
  updateCase
} from "src/backend/domains/support/repository";
import { mapSupportCase, mapSupportMessage } from "src/backend/domains/support/mapper";

export async function createCustomerCase(input = {}) {
  const ctx = await requireCustomerContext();
  const message = clean(input.message || input.content);
  if (!message) throw new Error("Message is required.");

  const row = await createSupportCase({
    case_id: uid("CASE"),
    member_id: ctx.memberId,
    wix_member_id: ctx.wixMemberId,
    supabase_user_id: ctx.supabaseUserId,
    email: ctx.email,
    subject: clean(input.subject) || "Customer support request",
    category: clean(input.category || "General"),
    priority: clean(input.priority || "Normal"),
    status: "Open",
    source: clean(input.source || "my-profile"),
    page: clean(input.page || ""),
    tab: clean(input.tab || ""),
    payload: input.payload || input || {},
    created_at: nowIso(),
    updated_at: nowIso()
  });

  await createSupportMessage({
    message_id: uid("MSG"),
    case_id: row.case_id,
    member_id: ctx.memberId,
    wix_member_id: ctx.wixMemberId,
    sender_type: "Customer",
    sender_name: ctx.profile?.display_name || "Customer",
    message,
    channel: "Alexandra",
    payload: input,
    created_at: nowIso()
  });

  await publishEvent("SUPPORT_CASE_CREATED", { caseId: row.case_id }, ctx);
  return mapSupportCase(row);
}

export async function listCurrentCustomerCases() {
  const ctx = await requireCustomerContext();
  return (await listCasesByMember(ctx.memberId)).map(mapSupportCase);
}

export async function listAgentCases(filters = {}) {
  return (await listCases(100)).map(mapSupportCase);
}

export async function getAgentCaseDetail(caseId) {
  const row = await getCaseByCaseId(caseId);
  const messages = await listMessagesByCaseId(caseId);
  return { case: row ? mapSupportCase(row) : null, messages: messages.map(mapSupportMessage) };
}

export async function replyAgentCase({ caseId, content } = {}) {
  const ctx = await requireCustomerContext();
  const message = clean(content);
  if (!caseId) throw new Error("Case ID is required.");
  if (!message) throw new Error("Reply content is required.");

  const row = await createSupportMessage({
    message_id: uid("MSG"),
    case_id: caseId,
    sender_type: "Agent",
    sender_name: ctx.profile?.display_name || ctx.email || "SKANDI Agent",
    message,
    channel: "CustomerServiceCenter",
    created_at: nowIso()
  });

  await updateCase(caseId, { status: "WaitingOnCustomer", updated_at: nowIso() });
  await publishEvent("SUPPORT_AGENT_REPLIED", { caseId }, ctx);
  return mapSupportMessage(row);
}

export async function updateAgentCase({ caseId, updates = {} } = {}) {
  if (!caseId) throw new Error("Case ID is required.");
  const body = { updated_at: nowIso() };

  if (updates.status) body.status = clean(updates.status);
  if (updates.priority) body.priority = clean(updates.priority);
  if (updates.category) body.category = clean(updates.category);
  if (updates.assignedAgentId) body.assigned_agent_id = clean(updates.assignedAgentId);
  if (updates.assignedAgentName) body.assigned_agent_name = clean(updates.assignedAgentName);

  return mapSupportCase(await updateCase(caseId, body));
}
