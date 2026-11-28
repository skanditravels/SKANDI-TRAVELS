// /src/backend/SKANDI_CORE/customerProfile.web.js
// B-011.28 customer-scoped My Profile / SKANDI Club web-method boundary.
// V12 transport repair: every frontend-callable export is declared directly with webMethod so Wix can generate stable proxies.

import { Permissions, webMethod } from "@wix/web-methods";
import { getCurrentCustomerMemberCore, getCustomerMemberFieldsCore } from "backend/SKANDI_CORE/customerSession";
import {
  getCustomerProfileBootstrapCore,
  getCustomerCheckoutTravelersCore,
  getCustomerClubRewardsCore,
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

async function memberContext(account) {
  const member = await getCurrentCustomerMemberCore({ account });
  const fields = getCustomerMemberFieldsCore(member);
  return {
    memberId: member._id || member.id,
    email: fields.loginEmail,
    emailVerified: member.loginEmailVerified === true,
    firstName: fields.firstName || "",
    lastName: fields.lastName || "",
    displayName: fields.displayName || member.profile?.nickname || "",
    member: account ? member : null
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

async function memberCall(handler, input = {}, account = false) {
  try {
    return await handler(await memberContext(account), input || {});
  } catch (error) {
    throw publicError(error);
  }
}

export const getCustomerProfileBootstrap = webMethod(Permissions.SiteMember, input => memberCall(getCustomerProfileBootstrapCore, input, true));
export const getCustomerCheckoutTravelers = webMethod(Permissions.SiteMember, () => memberCall(getCustomerCheckoutTravelersCore));
export const getCustomerClubRewards = webMethod(Permissions.SiteMember, () => memberCall(getCustomerClubRewardsCore));
export const updateCustomerProfile = webMethod(Permissions.SiteMember, input => memberCall(updateCustomerProfileCore, input, true));
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
