import { requireCustomerContext } from "src/backend/core/authContext";
import { nowIso } from "src/backend/core/response";
import { publishEvent } from "src/backend/core/eventBus";
import { listByMember, createRecord, updateRecord } from "src/backend/domains/favorite/repository";
import { mapFavorite } from "src/backend/domains/favorite/mapper";

export async function listCurrentCustomerFavorites() {
  const ctx = await requireCustomerContext();
  const rows = await listByMember(ctx.memberId);
  return rows.map(mapFavorite);
}

export async function createCurrentCustomerFavorite(payload = {}) {
  const ctx = await requireCustomerContext();
  const row = await createRecord({
    ...payload,
    member_id: ctx.memberId,
    wix_member_id: ctx.wixMemberId,
    supabase_user_id: ctx.supabaseUserId,
    created_at: payload.created_at || nowIso(),
    updated_at: payload.updated_at || nowIso()
  });
  await publishEvent("FAVORITE_CREATED", { id: row?.id }, ctx);
  return mapFavorite(row);
}

export async function updateCurrentCustomerFavorite(id, payload = {}) {
  const ctx = await requireCustomerContext();
  const row = await updateRecord(id, ctx.memberId, { ...payload, updated_at: nowIso() });
  await publishEvent("FAVORITE_UPDATED", { id }, ctx);
  return mapFavorite(row);
}
