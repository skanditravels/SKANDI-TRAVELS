export function mapCustomerProfile(row = {}) {
  return {
    id: row.id,
    memberId: row.member_id,
    wixMemberId: row.wix_member_id,
    supabaseUserId: row.supabase_user_id,
    firstName: row.first_name || "",
    lastName: row.last_name || "",
    displayName: row.display_name || row.email || "Member",
    email: row.email || row.auth_email || "",
    phone: row.phone || "",
    preferredCurrency: row.preferred_currency || "",
    customerType: row.customer_type || "",
    accessibilityNeedsGeneral: row.accessibility_needs_general || "",
    marketingConsent: row.marketing_consent === true,
    termsAcceptedAt: row.terms_accepted_at || "",
    privacyAcceptedAt: row.privacy_accepted_at || "",
    isLoyaltyMember: row.is_loyalty_member === true,
    clubNumber: row.club_number || "",
    status: row.status || "Active",
    raw: row
  };
}
