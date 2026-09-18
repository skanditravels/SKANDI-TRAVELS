// /src/backend/SKANDI_CORE/customerProfile.web.js
// B-011.28 customer-scoped My Profile / SKANDI Club web-method boundary.

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
} from "backend/SKANDI_CORE/customerProfile.js";

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
  out.code = /^[A-Z0-9_]{2,100}$/.test(String(error?.code || "").toUpperCase()) ? String(error.code).toUpperCase() : "CUSTOMER_PROFILE_REQUEST_FAILED";
  out.publicMessage = out.message;
  return out;
}
function member(handler) {
  return webMethod(Permissions.SiteMember, async (input = {}) => {
    try { return await handler(await memberContext(), input || {}); }
    catch (error) { throw publicError(error); }
  });
}

export const getCustomerProfileBootstrap = member(getCustomerProfileBootstrapCore);
export const updateCustomerProfile = member(updateCustomerProfileCore);
export const saveCustomerTraveler = member(saveCustomerTravelerCore);
export const removeCustomerTraveler = member(removeCustomerTravelerCore);
export const markCustomerNotificationRead = member(markCustomerNotificationReadCore);
export const removeCustomerFavorite = member(removeCustomerFavoriteCore);
export const linkCustomerBooking = member(linkCustomerBookingCore);
export const getCustomerBookingDetail = member(getCustomerBookingDetailCore);
export const quoteCustomerFlightCancellation = member(quoteCustomerFlightCancellationCore);
export const confirmCustomerFlightCancellation = member(confirmCustomerFlightCancellationCore);
export const searchCustomerFlightChanges = member(searchCustomerFlightChangesCore);
export const createCustomerPendingFlightChange = member(createCustomerPendingFlightChangeCore);
export const prepareCustomerFlightChangePayment = member(prepareCustomerFlightChangePaymentCore);
export const confirmCustomerFlightChange = member(confirmCustomerFlightChangeCore);
export const listCustomerPostBookingBaggage = member(listCustomerPostBookingBaggageCore);
export const prepareCustomerPostBookingBaggage = member(prepareCustomerPostBookingBaggageCore);
export const confirmCustomerPostBookingBaggage = member(confirmCustomerPostBookingBaggageCore);
export const listCustomerAirlineInitiatedChanges = member(listCustomerAirlineInitiatedChangesCore);
export const acceptCustomerAirlineInitiatedChange = member(acceptCustomerAirlineInitiatedChangeCore);
export const cancelCustomerStay = member(cancelCustomerStayCore);
export const cancelCustomerCar = member(cancelCustomerCarCore);
export const getCustomerDocument = member(getCustomerDocumentCore);
