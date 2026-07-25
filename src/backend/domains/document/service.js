import { requireCustomerContext } from "backend/core/authContext";
import { nowIso } from "backend/core/response";
import { publishEvent } from "backend/core/eventBus";
import { listByMember, createRecord, updateRecord } from "backend/domains/document/repository";
import { mapDocument } from "backend/domains/document/mapper";

export async function listCurrentCustomerDocuments() {
  const ctx = await requireCustomerContext();
  const rows = await listByMember(ctx.memberId);
  return rows.map(mapDocument);
}

export async function createCurrentCustomerDocument(payload = {}) {
  const ctx = await requireCustomerContext();
  const row = await createRecord({
    ...payload,
    member_id: ctx.memberId,
    wix_member_id: ctx.wixMemberId,
    supabase_user_id: ctx.supabaseUserId,
    created_at: payload.created_at || nowIso(),
    updated_at: payload.updated_at || nowIso()
  });
  await publishEvent("DOCUMENT_CREATED", { id: row?.id }, ctx);
  return mapDocument(row);
}

export async function updateCurrentCustomerDocument(id, payload = {}) {
  const ctx = await requireCustomerContext();
  const row = await updateRecord(id, ctx.memberId, { ...payload, updated_at: nowIso() });
  await publishEvent("DOCUMENT_UPDATED", { id }, ctx);
  return mapDocument(row);
}
