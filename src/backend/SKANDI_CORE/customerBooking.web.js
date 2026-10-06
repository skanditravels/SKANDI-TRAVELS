// /src/backend/SKANDI_CORE/customerBooking.web.js
// SKANDI V12 — canonical customer booking web-method boundary.


import { Permissions, webMethod } from "@wix/web-methods";
import { currentMember } from "wix-members-backend";
import {
  searchLiveFlightOffersCore,
  searchUnifiedOffersCore,
  createBookingCartFromOfferCore,
  createFlightCartCore,
  loadBookingCartCore,
  listCustomerBookingCartsCore,
  acceptBookingOfferCore,
  loadBookingExtrasCore,
  storeBookingExtrasCore,
  loadSignatureTransfersCore,
  storeSignatureTransferCore,
  saveBookingTravelersCore,
  loadSeatMapsCore,
  storeSeatSelectionsCore,
  prepareBookingPaymentCore,
  commitBookingCore,
  reconcileBookingCore,
  loadBookingConfirmationCore,
  loadBookingDocumentsCore,
  searchLiveStaysCore,
  fetchStayRatesCore,
  quoteStayCore,
  createHotelCartCore,
  saveHotelGuestsCore,
  prepareHotelPaymentCore,
  commitHotelBookingCore,
  searchLiveCarsCore,
  quoteCarCore,
  getCarQuoteCore,
  createCarCartCore,
  saveCarDriverCore,
  prepareCarCheckoutCore,
  commitCarBookingCore,
  createCustomerCarBookingCore,
  loadBookingRequirementsCore,
  refreshBookingRequirementsCore,
  createCarComponentClientKeyCore,
  loadCustomerCarBookingCore,
  cancelCustomerCarBookingCore
} from "backend/SKANDI_CORE/customerBooking";


async function memberContext() {
  const member = await currentMember.getMember();
  if (!member?._id) {
    const error = new Error("Sign in to continue with this booking.");
    error.code = "LOGIN_REQUIRED";
    error.publicMessage = error.message;
    throw error;
  }
  return {
    memberId: member._id,
    email: String(member.loginEmail || member.contactDetails?.emails?.[0] || "").toLowerCase()
  };
}
async function optionalMemberContext() {
  try {
    const member = await currentMember.getMember();
    if (!member?._id) return null;
    return {
      memberId: member._id,
      email: String(member.loginEmail || member.contactDetails?.emails?.[0] || "").toLowerCase()
    };
  } catch (_) {
    return null;
  }
}
function publicMessage(error) {
  const out = new Error(String(error?.publicMessage || "The booking request could not be completed.").slice(0, 500));
  out.name = "BookingError";
  out.code = /^[A-Z0-9_]{2,80}$/.test(String(error?.code || "").toUpperCase()) ? String(error.code).toUpperCase() : "BOOKING_REQUEST_FAILED";
  out.publicMessage = out.message;
  return out;
}
async function publicCall(handler, input = {}) {
  try { return await handler(input || {}); }
  catch (error) { throw publicMessage(error); }
}
async function memberCall(handler, input = {}) {
  try { return await handler(await memberContext(), input || {}); }
  catch (error) { throw publicMessage(error); }
}


export const searchLiveFlightOffers = webMethod(Permissions.Anyone, (input = {}) => publicCall(searchLiveFlightOffersCore, input));
export const searchUnifiedOffers = webMethod(Permissions.Anyone, (input = {}) => publicCall(searchUnifiedOffersCore, input));
export const createBookingCartFromOffer = webMethod(Permissions.Anyone, async (input = {}) => {
  try { return await createBookingCartFromOfferCore(await optionalMemberContext(), input || {}); }
  catch (error) { throw publicMessage(error); }
});
export const searchLiveStays = webMethod(Permissions.Anyone, (input = {}) => publicCall(searchLiveStaysCore, input));
export const fetchStayRates = webMethod(Permissions.Anyone, (input = {}) => publicCall(fetchStayRatesCore, input));
export const quoteStay = webMethod(Permissions.Anyone, (input = {}) => publicCall(quoteStayCore, input));
export const searchLiveCars = webMethod(Permissions.Anyone, (input = {}) => publicCall(searchLiveCarsCore, input));
export const quoteCar = webMethod(Permissions.Anyone, (input = {}) => publicCall(quoteCarCore, input));
export const getCarQuote = webMethod(Permissions.Anyone, (input = {}) => publicCall(getCarQuoteCore, input));


export const createFlightCart = webMethod(Permissions.SiteMember, (input = {}) => memberCall(createFlightCartCore, input));
export const loadBookingCart = webMethod(Permissions.SiteMember, (input = {}) => memberCall(async (context, input) => {
  const loaded = await loadBookingCartCore(context, input, { includeTravelers: input.view === "apis" });
  return loaded.cart;
}, input));
export const listCustomerBookingCarts = webMethod(Permissions.SiteMember, (input = {}) => memberCall(listCustomerBookingCartsCore, input));
export const acceptBookingOffer = webMethod(Permissions.SiteMember, (input = {}) => memberCall(acceptBookingOfferCore, input));
export const loadBookingExtras = webMethod(Permissions.SiteMember, (input = {}) => memberCall(loadBookingExtrasCore, input));
export const storeBookingExtras = webMethod(Permissions.SiteMember, (input = {}) => memberCall(storeBookingExtrasCore, input));
export const loadSignatureTransfers = webMethod(Permissions.SiteMember, (input = {}) => memberCall(loadSignatureTransfersCore, input));
export const storeSignatureTransfer = webMethod(Permissions.SiteMember, (input = {}) => memberCall(storeSignatureTransferCore, input));
export const saveBookingTravelers = webMethod(Permissions.SiteMember, (input = {}) => memberCall(saveBookingTravelersCore, input));
export const loadSeatMaps = webMethod(Permissions.SiteMember, (input = {}) => memberCall(loadSeatMapsCore, input));
export const storeSeatSelections = webMethod(Permissions.SiteMember, (input = {}) => memberCall(storeSeatSelectionsCore, input));
export const prepareBookingPayment = webMethod(Permissions.SiteMember, (input = {}) => memberCall(prepareBookingPaymentCore, input));
export const commitBooking = webMethod(Permissions.SiteMember, (input = {}) => memberCall(commitBookingCore, input));
export const reconcileBooking = webMethod(Permissions.SiteMember, (input = {}) => memberCall(reconcileBookingCore, input));
export const loadBookingConfirmation = webMethod(Permissions.SiteMember, (input = {}) => memberCall(loadBookingConfirmationCore, input));
export const loadBookingDocuments = webMethod(Permissions.SiteMember, (input = {}) => memberCall(loadBookingDocumentsCore, input));


export const createHotelCart = webMethod(Permissions.SiteMember, (input = {}) => memberCall(createHotelCartCore, input));
export const saveHotelGuests = webMethod(Permissions.SiteMember, (input = {}) => memberCall(saveHotelGuestsCore, input));
export const prepareHotelPayment = webMethod(Permissions.SiteMember, (input = {}) => memberCall(prepareHotelPaymentCore, input));
export const commitHotelBooking = webMethod(Permissions.SiteMember, (input = {}) => memberCall(commitHotelBookingCore, input));


export const createCarCart = webMethod(Permissions.SiteMember, (input = {}) => memberCall(createCarCartCore, input));
export const saveCarDriver = webMethod(Permissions.SiteMember, (input = {}) => memberCall(saveCarDriverCore, input));
export const prepareCarCheckout = webMethod(Permissions.SiteMember, (input = {}) => memberCall(prepareCarCheckoutCore, input));
export const commitCarBooking = webMethod(Permissions.SiteMember, (input = {}) => memberCall(commitCarBookingCore, input));
export const createCustomerCarBooking = webMethod(Permissions.SiteMember, (input = {}) => memberCall(createCustomerCarBookingCore, input));


export const loadBookingRequirements = webMethod(Permissions.SiteMember, (input = {}) => memberCall(loadBookingRequirementsCore, input));
export const refreshBookingRequirements = webMethod(Permissions.SiteMember, (input = {}) => memberCall(refreshBookingRequirementsCore, input));
export const createCarComponentClientKey = webMethod(Permissions.SiteMember, (input = {}) => memberCall(() => createCarComponentClientKeyCore(), input));
export const loadCustomerCarBooking = webMethod(Permissions.SiteMember, (input = {}) => memberCall(loadCustomerCarBookingCore, input));
export const cancelCustomerCarBooking = webMethod(Permissions.SiteMember, (input = {}) => memberCall(cancelCustomerCarBookingCore, input));
