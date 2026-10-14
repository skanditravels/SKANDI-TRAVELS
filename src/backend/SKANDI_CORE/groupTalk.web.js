// /src/backend/SKANDI_CORE/customerProfile.web.js
// B-011.28 customer-scoped My Profile / SKANDI Club web-method boundary.
// V12 transport repair: every frontend-callable export is declared directly with webMethod so Wix can generate stable proxies.

import { Permissions, webMethod } from "@wix/web-methods";
import { currentMember } from "wix-members-backend";
import {
  getCustomerProfileBootstrapCore,
  updateCustomerProfileCore,
  saveCustomerTravelerCore,
  removeCustomerTravelerCore,
  markCustomerNotificationReadCore,
  removeCustomerFavoriteCore,
  linkCustomerBookingCore,
  getCustomerBookingDetailCore,
  quoteCustomerFlightCancellationCore,
  confirmCustomerFlightCancellationCore,
  searchCustomerFlightChangesCore,
  createCustomerPendingFlightChangeCore,
  prepareCustomerFlightChangePaymentCore,
  confirmCustomerFlightChangeCore,
  listCustomerPostBookingBaggageCore,
  prepareCustomerPostBookingBaggageCore,
  confirmCustomerPostBookingBaggageCore,
  listCustomerAirlineInitiatedChangesCore,
  acceptCustomerAirlineInitiatedChangeCore,
  cancelCustomerStayCore,
  cancelCustomerCarCore,
  getCustomerDocumentCore
} from "backend/SKANDI_CORE/customerProfile";

async function memberContext() {
  const member = await currentMember.getMember();
  if (!member?._id) {
    const error = new Error("Sign in to manage your SKANDI profile.");
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

function publicError(error) {
  const out = new Error(String(error?.publicMessage || error?.message || "The profile request could not be completed.").slice(0, 500));
  out.name = "CustomerProfileError";
  out.code = /^[A-Z0-9_]{2,100}$/.test(String(error?.code || "").toUpperCase())
    ? String(error.code).toUpperCase()
    : "CUSTOMER_PROFILE_REQUEST_FAILED";
  out.publicMessage = out.message;
  return out;
}

async function memberCall(handler, input = {}) {
  try {
    return await handler(await memberContext(), input || {});
  } catch (error) {
    throw publicError(error);
  }
}

export const getCustomerProfileBootstrap = webMethod(Permissions.SiteMember, input => memberCall(getCustomerProfileBootstrapCore, input));
export const updateCustomerProfile = webMethod(Permissions.SiteMember, input => memberCall(updateCustomerProfileCore, input));
export const saveCustomerTraveler = webMethod(Permissions.SiteMember, input => memberCall(saveCustomerTravelerCore, input));
export const removeCustomerTraveler = webMethod(Permissions.SiteMember, input => memberCall(removeCustomerTravelerCore, input));
export const markCustomerNotificationRead = webMethod(Permissions.SiteMember, input => memberCall(markCustomerNotificationReadCore, input));
export const removeCustomerFavorite = webMethod(Permissions.SiteMember, input => memberCall(removeCustomerFavoriteCore, input));
export const linkCustomerBooking = webMethod(Permissions.SiteMember, input => memberCall(linkCustomerBookingCore, input));
export const getCustomerBookingDetail = webMethod(Permissions.SiteMember, input => memberCall(getCustomerBookingDetailCore, input));
export const quoteCustomerFlightCancellation = webMethod(Permissions.SiteMember, input => memberCall(quoteCustomerFlightCancellationCore, input));
export const confirmCustomerFlightCancellation = webMethod(Permissions.SiteMember, input => memberCall(confirmCustomerFlightCancellationCore, input));
export const searchCustomerFlightChanges = webMethod(Permissions.SiteMember, input => memberCall(searchCustomerFlightChangesCore, input));
export const createCustomerPendingFlightChange = webMethod(Permissions.SiteMember, input => memberCall(createCustomerPendingFlightChangeCore, input));
export const prepareCustomerFlightChangePayment = webMethod(Permissions.SiteMember, input => memberCall(prepareCustomerFlightChangePaymentCore, input));
export const confirmCustomerFlightChange = webMethod(Permissions.SiteMember, input => memberCall(confirmCustomerFlightChangeCore, input));
export const listCustomerPostBookingBaggage = webMethod(Permissions.SiteMember, input => memberCall(listCustomerPostBookingBaggageCore, input));
export const prepareCustomerPostBookingBaggage = webMethod(Permissions.SiteMember, input => memberCall(prepareCustomerPostBookingBaggageCore, input));
export const confirmCustomerPostBookingBaggage = webMethod(Permissions.SiteMember, input => memberCall(confirmCustomerPostBookingBaggageCore, input));
export const listCustomerAirlineInitiatedChanges = webMethod(Permissions.SiteMember, input => memberCall(listCustomerAirlineInitiatedChangesCore, input));
export const acceptCustomerAirlineInitiatedChange = webMethod(Permissions.SiteMember, input => memberCall(acceptCustomerAirlineInitiatedChangeCore, input));
export const cancelCustomerStay = webMethod(Permissions.SiteMember, input => memberCall(cancelCustomerStayCore, input));
export const cancelCustomerCar = webMethod(Permissions.SiteMember, input => memberCall(cancelCustomerCarCore, input));
export const getCustomerDocument = webMethod(Permissions.SiteMember, input => memberCall(getCustomerDocumentCore, input));
