import { requireCustomerContext } from "backend/core/authContext";
import { nowIso } from "backend/core/response";
import { publishEvent } from "backend/core/eventBus";
import { listByMember, createRecord, updateRecord } from "ackend/domains/traveler/repository";
import { mapTraveler } from "backend/domains/traveler/mapper";

export async function listCurrentCustomerTravelers() {
  const ctx = await requireCustomerContext();
  const rows = await listByMember(ctx.memberId);
  return rows.map(mapTraveler);
}

export async function createCurrentCustomerTraveler(payload = {}) {
  const ctx = await requireCustomerContext();
  const row = await createRecord({
    ...payload,
    member_id: ctx.memberId,
    wix_member_id: ctx.wixMemberId,
    supabase_user_id: ctx.supabaseUserId,
    created_at: payload.created_at || nowIso(),
    updated_at: payload.updated_at || nowIso()
  });
  await publishEvent("TRAVELER_CREATED", { id: row?.id }, ctx);
  return mapTraveler(row);
}

export async function updateCurrentCustomerTraveler(id, payload = {}) {
  const ctx = await requireCustomerContext();
  const row = await updateRecord(id, ctx.memberId, { ...payload, updated_at: nowIso() });
  await publishEvent("TRAVELER_UPDATED", { id }, ctx);
  return mapTraveler(row);
}
