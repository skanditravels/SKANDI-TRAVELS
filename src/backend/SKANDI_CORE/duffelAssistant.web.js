// /src/backend/SKANDI_CORE/duffelAssistant.web.js
// V12 Wix site-member boundary for Duffel Assistant and its Customer Service log.

import { Permissions, webMethod } from "@wix/web-methods";
import { currentMember } from "wix-members-backend";
import {
  createCustomerDuffelAssistantSessionCore,
  recordCustomerDuffelAssistantEventCore,
  getCustomerDuffelAssistantActivityCore,
  verifyCustomerDuffelAssistantBookingCore
} from "backend/SKANDI_CORE/duffelAssistant";

async function currentCustomerContext() {
  const member = await currentMember.getMember();
  if (!member?._id) {
    const error = new Error("Sign in to manage your SKANDI travel support.");
    error.code = "LOGIN_REQUIRED";
    error.publicMessage = error.message;
    throw error;
  }
  const firstName = String(member.contactDetails?.firstName || member.profile?.nickname || "").trim();
  const lastName = String(member.contactDetails?.lastName || "").trim();
  return {
    memberId: member._id,
    email: String(member.loginEmail || member.contactDetails?.emails?.[0] || "").trim().toLowerCase(),
    firstName, lastName,
    displayName: String(member.profile?.nickname || [firstName, lastName].filter(Boolean).join(" ") || "").trim()
  };
}
function publicError(cause) {
  const e = new Error(String(cause?.publicMessage || "The Assistant request could not be completed. Contact SKANDI Support if it continues.").slice(0, 400));
  e.name = "DuffelAssistantError";
  e.code = /^[A-Z0-9_]{2,100}$/.test(String(cause?.code || "")) ? cause.code : "DUFFEL_ASSISTANT_UNAVAILABLE";
  e.publicMessage = e.message;
  return e;
}
async function memberCall(handler, input = {}) {
  try { return await handler(await currentCustomerContext(), input && typeof input === "object" && !Array.isArray(input) ? input : {}); }
  catch (cause) { throw publicError(cause); }
}

export const createCustomerDuffelAssistantSession = webMethod(Permissions.SiteMember,
  input => memberCall(createCustomerDuffelAssistantSessionCore, input));
export const recordCustomerDuffelAssistantEvent = webMethod(Permissions.SiteMember,
  input => memberCall(recordCustomerDuffelAssistantEventCore, input));
export const getCustomerDuffelAssistantActivity = webMethod(Permissions.SiteMember,
  input => memberCall(getCustomerDuffelAssistantActivityCore, input));

export const verifyCustomerDuffelAssistantBooking = webMethod(Permissions.SiteMember,
  input => memberCall(verifyCustomerDuffelAssistantBookingCore, input));
