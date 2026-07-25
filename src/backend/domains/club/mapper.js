export function mapClubProfile(row = {}, tier = null, points = null) {
  if (!row) return null;
  return {
    id: row.id,
    memberId: row.member_id,
    clubId: row.club_id,
    status: row.status || "Active",
    tier,
    points,
    enrolledAt: row.enrolled_at || row.created_at || "",
    raw: row
  };
}
