export function mapFavorite(row = {}) {
  return {
    id: row.id,
    memberId: row.member_id,
    wixMemberId: row.wix_member_id,
    supabaseUserId: row.supabase_user_id,
    title: row.title || row.item_title || row.document_title || row.subject || "",
    status: row.status || "",
    active: row.active !== false,
    createdAt: row.created_at || "",
    updatedAt: row.updated_at || "",
    payload: row.payload || {},
    raw: row
  };
}
