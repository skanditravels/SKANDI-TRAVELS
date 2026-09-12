// /src/backend/SKANDI_CORE/customerBooking.web.js
// SKANDI Backend Base 1.0 — B-007 customer booking web-method boundary.

import { Permissions, webMethod } from "@wix/web-methods";
import { currentMember } from "wix-members-backend";
import {
  searchLiveFlightOffersCore,
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
  createCustomerCarBookingCore
} from "backend/SKANDI_CORE/customerBooking.js";

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
function publicMessage(error) {
  const out = new Error(String(error?.publicMessage || error?.message || "The booking request could not be completed.").slice(0, 500));
  out.name = "BookingError";
  out.code = /^[A-Z0-9_]{2,80}$/.test(String(error?.code || "").toUpperCase()) ? String(error.code).toUpperCase() : "BOOKING_REQUEST_FAILED";
  out.publicMessage = out.message;
  return out;
}
function any(handler) {
  return webMethod(Permissions.Anyone, async (input = {}) => {
    try { return await handler(input || {}); }
    catch (error) { throw publicMessage(error); }
  });
}
function member(handler) {
  return webMethod(Permissions.SiteMember, async (input = {}) => {
    try { return await handler(await memberContext(), input || {}); }
    catch (error) { throw publicMessage(error); }
  });
}

export const searchLiveFlightOffers = any(input => searchLiveFlightOffersCore(input));
export const searchLiveStays = any(input => searchLiveStaysCore(input));
export const fetchStayRates = any(input => fetchStayRatesCore(input));
export const quoteStay = any(input => quoteStayCore(input));
export const searchLiveCars = any(input => searchLiveCarsCore(input));
export const quoteCar = any(input => quoteCarCore(input));
export const getCarQuote = any(input => getCarQuoteCore(input));

export const createFlightCart = member(createFlightCartCore);
export const loadBookingCart = member((context, input) => loadBookingCartCore(context, input));
export const listCustomerBookingCarts = member(listCustomerBookingCartsCore);
export const acceptBookingOffer = member(acceptBookingOfferCore);
export const loadBookingExtras = member(loadBookingExtrasCore);
export const storeBookingExtras = member(storeBookingExtrasCore);
export const loadSignatureTransfers = member(loadSignatureTransfersCore);
export const storeSignatureTransfer = member(storeSignatureTransferCore);
export const saveBookingTravelers = member(saveBookingTravelersCore);
export const loadSeatMaps = member(loadSeatMapsCore);
export const storeSeatSelections = member(storeSeatSelectionsCore);
export const prepareBookingPayment = member(prepareBookingPaymentCore);
export const commitBooking = member(commitBookingCore);
export const reconcileBooking = member(reconcileBookingCore);
export const loadBookingConfirmation = member(loadBookingConfirmationCore);
export const loadBookingDocuments = member(loadBookingDocumentsCore);

export const createHotelCart = member(createHotelCartCore);
export const saveHotelGuests = member(saveHotelGuestsCore);
export const prepareHotelPayment = member(prepareHotelPaymentCore);
export const commitHotelBooking = member(commitHotelBookingCore);

export const createCarCart = member(createCarCartCore);
export const saveCarDriver = member(saveCarDriverCore);
export const prepareCarCheckout = member(prepareCarCheckoutCore);
export const commitCarBooking = member(commitCarBookingCore);
export const createCustomerCarBooking = member(createCustomerCarBookingCore);
