import { currentMember } from "wix-members-backend";
import { getRuntimeConfig } from "./supabaseAdminServer";

function firstEmail(member) {
  return (
    member?.loginEmail ||
    member?.contactDetails?.emails?.[0] ||
    member?.contact?.emails?.[0] ||
    ""
  );
}

function displayName(member) {
  const first =
    member?.contactDetails?.firstName || member?.profile?.firstName || "";
  const last =
    member?.contactDetails?.lastName || member?.profile?.lastName || "";
  return (
    [first, last].filter(Boolean).join(" ") ||
    member?.profile?.nickname ||
    firstEmail(member) ||
    "Super Administrator"
  );
}

export async function requireSuperAdmin() {
  const member = await currentMember.getMember();
  const memberId = String(member?._id || member?.id || "").trim();

  if (!memberId) {
    const error = new Error("A signed-in Wix member is required.");
    error.code = "SUPER_ADMIN_NOT_SIGNED_IN";
    throw error;
  }

  const config = await getRuntimeConfig();
  if (!config.superAdminMemberIds.has(memberId)) {
    const error = new Error("This Wix member is not on the super-admin allowlist.");
    error.code = "SUPER_ADMIN_FORBIDDEN";
    throw error;
  }

  return Object.freeze({
    id: memberId,
    email: firstEmail(member),
    displayName: displayName(member)
  });
}
