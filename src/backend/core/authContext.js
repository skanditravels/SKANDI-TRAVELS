import { currentMember } from "wix-members-backend";
import { sbSelect, sbInsert, sbUpdate, eq } from "backend/supabaseClient";
import { clean, nowIso } from "backend/core/response";

const PROFILE_TABLE = "customer_profiles";

export async function getCurrentWixMemberSafe() {
  try {
    const member = await currentMember.getMember({ fieldsets: ["FULL"] });

    if (!member?._id) return null;

    return {
      wixMemberId: member._id,
      memberId: member._id,
      email:
        member.loginEmail ||
        member.contactDetails?.emails?.[0] ||
        "",
      firstName:
        member.profile?.firstName ||
        member.contactDetails?.firstName ||
        "",
      lastName:
        member.profile?.lastName ||
        member.contactDetails?.lastName ||
        "",
      nickname:
        member.profile?.nickname ||
        ""
    };
  } catch (error) {
    return null;
  }
}

export async function requireCustomerContext() {
  const member = await getCurrentWixMemberSafe();

  if (!member?.wixMemberId) {
    const error = new Error("NOT_LOGGED_IN");
    error.code = "NOT_LOGGED_IN";
    throw error;
  }

  const profile = await getOrCreateCustomerProfile(member);

  return {
    authProvider: "wix",
    wixMemberId: member.wixMemberId,
    memberId: member.memberId,
    supabaseUserId: profile.supabase_user_id || null,
    email: member.email || profile.email || "",
    member,
    profile
  };
}

export async function getOrCreateCustomerProfile(member) {
  const existing = await sbSelect(
    PROFILE_TABLE,
    `select=*&${eq("wix_member_id", member.wixMemberId)}&limit=1`
  );

  if (existing.length) return existing[0];

  const fallbackExisting = await sbSelect(
    PROFILE_TABLE,
    `select=*&${eq("member_id", member.memberId)}&limit=1`
  );

  if (fallbackExisting.length) {
    const row = fallbackExisting[0];

    const updated = await sbUpdate(
      PROFILE_TABLE,
      eq("id", row.id),
      {
        wix_member_id: member.wixMemberId,
        auth_provider: "wix",
        auth_email: member.email || row.email || "",
        last_login_at: nowIso()
      }
    );

    return updated?.[0] || row;
  }

  const displayName =
    [member.firstName, member.lastName].filter(Boolean).join(" ") ||
    member.nickname ||
    (member.email ? member.email.split("@")[0] : "") ||
    "Member";

  try {
    const created = await sbInsert(PROFILE_TABLE, {
      member_id: member.memberId,
      wix_member_id: member.wixMemberId,
      auth_provider: "wix",
      auth_email: member.email,
      email: member.email,
      first_name: clean(member.firstName),
      last_name: clean(member.lastName),
      display_name: displayName,
      status: "Active",
      is_loyalty_member: false,
      last_login_at: nowIso(),
      payload: {
        source: "WixMembers",
        createdBy: "authContext"
      }
    });

    return created?.[0];
  } catch (error) {
    if (String(error.message || "").includes("duplicate key")) {
      const retry = await sbSelect(
        PROFILE_TABLE,
        `select=*&${eq("member_id", member.memberId)}&limit=1`
      );

      if (retry.length) return retry[0];
    }

    throw error;
  }
}
