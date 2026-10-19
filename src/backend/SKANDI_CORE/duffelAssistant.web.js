// /src/backend/SKANDI_CORE/duffelAssistant.web.js
// Wix site-member facade for short-lived Duffel Assistant keys.

import { Permissions, webMethod } from "@wix/web-methods";
import { currentMember } from "wix-members-backend";
import { createCustomerDuffelAssistantSessionCore } from "backend/SKANDI_CORE/duffelAssistant";

async function currentCustomerContext() {
  const member = await currentMember.getMember();
  if (!member?._id) {
    const error = new Error("Sign in to manage your Duffel bookings.");
    error.code = "LOGIN_REQUIRED";
    error.publicMessage = error.message;
    throw error;
  }
  const firstName = String(member.contactDetails?.firstName || member.profile?.nickname || "").trim();
  const lastName = String(member.contactDetails?.lastName || "").trim();
  return {
    memberId: member._id,
    email: String(member.loginEmail || member.contactDetails?.emails?.[0] || "").trim().toLowerCase(),
    firstName,
    lastName,
    displayName: String(member.profile?.nickname || [firstName, lastName].filter(Boolean).join(" ") || "").trim()
  };
}

export const createCustomerDuffelAssistantSession = webMethod(Permissions.SiteMember, async (input = {}) => {
  try {
    const context = await currentCustomerContext();
    const request = input && typeof input === "object" && !Array.isArray(input) ? input : {};
    return await createCustomerDuffelAssistantSessionCore(context, {
      bookingId: String(request.bookingId || "").slice(0, 80),
      resourceType: String(request.resourceType || "").slice(0, 10),
      issueType: String(request.issueType || "").slice(0, 20)
    });
  } catch (cause) {
    const e = new Error(String(cause?.publicMessage || "The Assistant could not open. Please try again or contact SKANDI Support.").slice(0, 400));
    e.name = "DuffelAssistantError";
    e.code = /^[A-Z0-9_]{2,100}$/.test(String(cause?.code || "")) ? cause.code : "DUFFEL_ASSISTANT_UNAVAILABLE";
    e.publicMessage = e.message;
    throw e;
  }
});
