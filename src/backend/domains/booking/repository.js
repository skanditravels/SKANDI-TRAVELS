import { sbSelect, sbInsert, sbUpdate, eq, and, order } from "backend/supabaseClient";

const TABLE = "customer_bookings";

export async function listByMember(memberId, limit = 100) {
  return sbSelect(TABLE, `select=*&${eq("member_id", memberId)}&${order("created_at", "desc")}&limit=${limit}`);
}

export async function getById(id) {
  const rows = await sbSelect(TABLE, `select=*&${eq("id", id)}&limit=1`);
  return rows[0] || null;
}

export async function createRecord(data) {
  const rows = await sbInsert(TABLE, data);
  return rows[0] || null;
}

export async function updateRecord(id, memberId, body) {
  const rows = await sbUpdate(TABLE, and(eq("id", id), eq("member_id", memberId)), body);
  return rows[0] || null;
}
