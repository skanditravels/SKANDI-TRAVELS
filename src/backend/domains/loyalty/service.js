import { requireCustomerContext } from "src/backend/core/authContext";
import { uid } from "src/backend/core/response";
import { listLedgerByMember, insertLedgerRow } from "src/backend/domains/loyalty/repository";
import { mapPointsLedgerRow } from "src/backend/domains/loyalty/mapper";
import { publishEvent } from "src/backend/core/eventBus";

export async function getCurrentCustomerPoints() {
  const ctx = await requireCustomerContext();
  const rows = await listLedgerByMember(ctx.memberId);

  const confirmed = rows.filter((r) => r.status === "Confirmed").reduce((sum, r) => sum + Number(r.amount || 0), 0);
  const pending = rows.filter((r) => r.status === "Pending").reduce((sum, r) => sum + Number(r.amount || 0), 0);

  return { confirmed, pending, recent: rows.slice(0, 25).map(mapPointsLedgerRow) };
}

export async function addPointsTransaction(ctx, { type, amount, description, status = "Pending", payload = {} }) {
  const row = await insertLedgerRow({
    transaction_id: uid("PTS"),
    member_id: ctx.memberId,
    wix_member_id: ctx.wixMemberId,
    supabase_user_id: ctx.supabaseUserId,
    type,
    amount,
    description,
    status,
    is_manual_adjustment: false,
    payload
  });

  await publishEvent("LOYALTY_POINTS_TRANSACTION_CREATED", { transactionId: row?.transaction_id }, ctx);
  return mapPointsLedgerRow(row);
}
