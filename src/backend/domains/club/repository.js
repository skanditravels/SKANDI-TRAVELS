import { sbSelect, sbInsert, eq } from "backend/supabaseClient";

const CLUB = "club_profiles";
const TIERS = "club_tiers";

export async function getClubByMemberId(memberId) {
  const rows = await sbSelect(CLUB, `select=*&${eq("member_id", memberId)}&limit=1`);
  return rows[0] || null;
}

export async function createClubProfile(data) {
  const rows = await sbInsert(CLUB, data);
  return rows[0] || null;
}

export async function getDefaultTier() {
  const rows = await sbSelect(TIERS, "select=*&tier_key=eq.member&limit=1");
  return rows[0] || null;
}

export async function getTierById(id) {
  if (!id) return getDefaultTier();
  const rows = await sbSelect(TIERS, `select=*&${eq("id", id)}&limit=1`);
  return rows[0] || null;
}
