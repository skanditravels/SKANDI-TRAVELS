import { sbSelect, sbUpdate, eq } from "backend/supabaseClient";

const TABLE = "customer_profiles";

export async function getCustomerProfileByMemberId(memberId) {
  const rows = await sbSelect(TABLE, `select=*&${eq("member_id", memberId)}&limit=1`);
  return rows[0] || null;
}

export async function getCustomerProfileByWixMemberId(wixMemberId) {
  const rows = await sbSelect(TABLE, `select=*&${eq("wix_member_id", wixMemberId)}&limit=1`);
  return rows[0] || null;
}

export async function updateCustomerProfile(profileId, body) {
  const rows = await sbUpdate(TABLE, eq("id", profileId), body);
  return rows[0] || null;
}
