import { sbSelect, sbInsert, eq, order } from "backend/supabaseClient";

const LEDGER = "skandi_points_ledger";

export async function listLedgerByMember(memberId, limit = 100) {
  return sbSelect(LEDGER, `select=*&${eq("member_id", memberId)}&${order("transaction_date", "desc")}&limit=${limit}`);
}

export async function insertLedgerRow(data) {
  const rows = await sbInsert(LEDGER, data);
  return rows[0] || null;
}
