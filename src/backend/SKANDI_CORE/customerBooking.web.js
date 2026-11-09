// /src/backend/SKANDI_CORE/customerBooking.web.js
// SKANDI V12 — canonical customer booking web-method boundary.


import { Permissions, webMethod } from "@wix/web-methods";
import { currentMember } from "wix-members-backend";
import { randomBytes, createHash } from "crypto";
import {
  searchLiveFlightOffersCore,
  getFlightUpsellsCore,
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
import { dispatchConfirmedBookingEmailCore, prepareGuestConfirmationCore } from "backend/SKANDI_CORE/bookingConfirmationEmail";


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
function guestContext(token) {
  const value = String(token || "");
  if (!/^[a-f0-9]{64}$/.test(value)) {
    const error = new Error("Your secure booking session has expired. Start a new search or contact SKANDI for help.");
    error.code = "BOOKING_SESSION_EXPIRED"; error.publicMessage = error.message; throw error;
  }
  return {guestHash:createHash("sha256").update(value, "utf8").digest("hex")};
}
async function bookingContext(input = {}) {
  return input.cartToken ? guestContext(input.cartToken) : memberContext();
}
async function bookingCall(handler, input = {}, {preflightEmail = false} = {}) {
  try {
    const context = await bookingContext(input);
    // A visitor-facing method never reaches its handler without an ownership
    // check, even if a future core handler is changed to omit its own check.
    const loaded = await loadBookingCartCore(context, input);
    if (preflightEmail && context.guestHash) {
      if (!["PaymentReady","PaymentPending"].includes(loaded.row.status)) {
        const error = new Error("Complete traveler details and seat selection before continuing to payment.");
        error.code = "BOOKING_NOT_READY"; error.publicMessage = error.message; throw error;
      }
      await prepareGuestConfirmationCore(context, input.cartId);
    }
    return await handler(context, input);
  } catch (error) { throw publicMessage(error); }
}

// Notification delivery is a secondary side effect. Never reverse a completed
// supplier booking or re-run a payment because Wix mail delivery is unavailable.
// The server-owned booking ID is reloaded with member ownership before dispatch.
async function confirmedMemberCall(handler, input = {}) {
  try {
    const context = await memberContext();
    const result = await handler(context, input || {});
    const status = String(result?.status || result?.cart?.status || "");
    const cartId = String(result?.cartId || result?.cart?.cartId || input?.cartId || "");
    if (status === "Confirmed" && cartId) {
      try {
        const member = await currentMember.getMember({fieldsets:["FULL"]});
        if (!member?._id || member._id !== context.memberId) throw new Error("WIX_MEMBER_SESSION_CHANGED");
        await dispatchConfirmedBookingEmailCore({...context, contactId:String(member.contactId || "")}, cartId);
      }
      catch (mailError) {
        console.error("[SKANDI][BookingEmail] Confirmed booking email dispatch requires attention", {
          cartId, code:mailError?.code || "BOOKING_EMAIL_ERROR", message:mailError?.message || ""
        });
      }
    }
    return result;
  } catch (error) { throw publicMessage(error); }
}
async function confirmedBookingCall(handler, input = {}) {
  try {
    const context = await bookingContext(input);
    const initial = await loadBookingCartCore(context, input);
    if (context.guestHash && (!initial.row.payload?.guestReceiptEmail ||
        String(initial.row.payload?.guestReceiptEmail || "").toLowerCase() !== String(initial.row.email || "").toLowerCase())) {
      const error = new Error("Booking confirmation is temporarily unavailable. Please contact SKANDI before paying.");
      error.code = "BOOKING_CONFIRMATION_UNAVAILABLE"; error.publicMessage = error.message; throw error;
    }
    const result = await handler(context, input);
    const status = String(result?.status || result?.cart?.status || "");
    const cartId = String(result?.cartId || result?.cart?.cartId || input?.cartId || "");
    if (status === "Confirmed" && cartId) {
      try {
        if (context.guestHash) {
          await dispatchConfirmedBookingEmailCore(context, cartId);
        } else {
          const member = await currentMember.getMember({fieldsets:["FULL"]});
          if (!member?._id || member._id !== context.memberId) throw new Error("WIX_MEMBER_SESSION_CHANGED");
          await dispatchConfirmedBookingEmailCore({...context,contactId:String(member.contactId || "")}, cartId);
        }
      } catch (mailError) {
        console.error("[SKANDI][BookingEmail] Confirmed booking email dispatch requires attention", {cartId, code:mailError?.code || "BOOKING_EMAIL_ERROR"});
      }
    }
    return result;
  } catch (error) { throw publicMessage(error); }
}

export const searchLiveFlightOffers = webMethod(Permissions.Anyone, (input = {}) => publicCall(searchLiveFlightOffersCore, input));
export const getFlightUpsells = webMethod(Permissions.Anyone, (input = {}) => publicCall(getFlightUpsellsCore, input));
export const searchUnifiedOffers = webMethod(Permissions.Anyone, (input = {}) => publicCall(searchUnifiedOffersCore, input));
// The browser saves this capability before attempting to create a cart, so an
// interrupted request can safely recover the cart without creating another.
export const beginGuestBookingSession = webMethod(Permissions.Anyone, () => ({cartToken:randomBytes(32).toString("hex")}));
export const createBookingCartFromOffer = webMethod(Permissions.Anyone, async (input = {}) => {
  try {
    const member = await optionalMemberContext();
    const context = member || guestContext(input.cartToken);
    const result = await createBookingCartFromOfferCore(context, input || {});
    return {...result,cartToken:context.guestHash ? String(input.cartToken) : ""};
  }
  catch (error) { throw publicMessage(error); }
});
export const searchLiveStays = webMethod(Permissions.Anyone, (input = {}) => publicCall(searchLiveStaysCore, input));
export const fetchStayRates = webMethod(Permissions.Anyone, (input = {}) => publicCall(fetchStayRatesCore, input));
export const quoteStay = webMethod(Permissions.Anyone, (input = {}) => publicCall(quoteStayCore, input));
export const searchLiveCars = webMethod(Permissions.Anyone, (input = {}) => publicCall(searchLiveCarsCore, input));
export const quoteCar = webMethod(Permissions.Anyone, (input = {}) => publicCall(quoteCarCore, input));
export const getCarQuote = webMethod(Permissions.Anyone, (input = {}) => publicCall(getCarQuoteCore, input));


export const createFlightCart = webMethod(Permissions.SiteMember, (input = {}) => memberCall(createFlightCartCore, input));
export const loadBookingCart = webMethod(Permissions.Anyone, (input = {}) => bookingCall(async (context, input) => {
  const loaded = await loadBookingCartCore(context, input, { includeTravelers: input.view === "apis" });
  if (input.view === "apis" && loaded.sensitive) {
    const people = loaded.sensitive.passengers || loaded.sensitive.guests || [];
    return {...loaded.cart, travelers:people.map(person => {
      const document = Array.isArray(person.identityDocuments) ? person.identityDocuments[0] || {} : {};
      return {id:person.id, title:person.title, givenName:person.givenName, familyName:person.familyName,
        bornOn:person.bornOn, gender:person.gender, nationality:person.nationality,
        documentNumber:document.uniqueIdentifier, documentCountry:document.issuingCountryCode, documentExpiry:document.expiresOn};
    }), contact:{email:loaded.sensitive.contact?.email || "", phoneNumber:loaded.sensitive.contact?.phoneNumber || ""}};
  }
  return loaded.cart;
}, input));
export const listCustomerBookingCarts = webMethod(Permissions.SiteMember, (input = {}) => memberCall(listCustomerBookingCartsCore, input));
export const acceptBookingOffer = webMethod(Permissions.Anyone, (input = {}) => bookingCall(acceptBookingOfferCore, input));
export const loadBookingExtras = webMethod(Permissions.Anyone, (input = {}) => bookingCall(loadBookingExtrasCore, input));
export const storeBookingExtras = webMethod(Permissions.Anyone, (input = {}) => bookingCall(storeBookingExtrasCore, input));
export const loadSignatureTransfers = webMethod(Permissions.Anyone, (input = {}) => bookingCall(loadSignatureTransfersCore, input));
export const storeSignatureTransfer = webMethod(Permissions.Anyone, (input = {}) => bookingCall(storeSignatureTransferCore, input));
export const saveBookingTravelers = webMethod(Permissions.Anyone, (input = {}) => bookingCall(saveBookingTravelersCore, input));
export const loadSeatMaps = webMethod(Permissions.Anyone, (input = {}) => bookingCall(loadSeatMapsCore, input));
export const storeSeatSelections = webMethod(Permissions.Anyone, (input = {}) => bookingCall(storeSeatSelectionsCore, input));
export const prepareBookingPayment = webMethod(Permissions.Anyone, (input = {}) => bookingCall(prepareBookingPaymentCore, input, {preflightEmail:true}));
export const commitBooking = webMethod(Permissions.Anyone, (input = {}) => confirmedBookingCall(commitBookingCore, input));
export const reconcileBooking = webMethod(Permissions.Anyone, (input = {}) => confirmedBookingCall(reconcileBookingCore, input));
export const loadBookingConfirmation = webMethod(Permissions.Anyone, (input = {}) => bookingCall(loadBookingConfirmationCore, input));
export const loadBookingDocuments = webMethod(Permissions.Anyone, (input = {}) => bookingCall(loadBookingDocumentsCore, input));


export const createHotelCart = webMethod(Permissions.SiteMember, (input = {}) => memberCall(createHotelCartCore, input));
export const saveHotelGuests = webMethod(Permissions.Anyone, (input = {}) => bookingCall(saveHotelGuestsCore, input));
export const prepareHotelPayment = webMethod(Permissions.Anyone, (input = {}) => bookingCall(prepareHotelPaymentCore, input, {preflightEmail:true}));
export const commitHotelBooking = webMethod(Permissions.Anyone, (input = {}) => confirmedBookingCall(commitHotelBookingCore, input));


export const createCarCart = webMethod(Permissions.SiteMember, (input = {}) => memberCall(createCarCartCore, input));
export const saveCarDriver = webMethod(Permissions.SiteMember, (input = {}) => memberCall(saveCarDriverCore, input));
export const prepareCarCheckout = webMethod(Permissions.SiteMember, (input = {}) => memberCall(prepareCarCheckoutCore, input));
export const commitCarBooking = webMethod(Permissions.SiteMember, (input = {}) => confirmedMemberCall(commitCarBookingCore, input));
export const createCustomerCarBooking = webMethod(Permissions.SiteMember, (input = {}) => confirmedMemberCall(createCustomerCarBookingCore, input));


export const loadBookingRequirements = webMethod(Permissions.Anyone, (input = {}) => bookingCall(loadBookingRequirementsCore, input));
export const refreshBookingRequirements = webMethod(Permissions.Anyone, (input = {}) => bookingCall(refreshBookingRequirementsCore, input));
export const createCarComponentClientKey = webMethod(Permissions.SiteMember, (input = {}) => memberCall(() => createCarComponentClientKeyCore(), input));
export const loadCustomerCarBooking = webMethod(Permissions.SiteMember, (input = {}) => memberCall(loadCustomerCarBookingCore, input));
export const cancelCustomerCarBooking = webMethod(Permissions.SiteMember, (input = {}) => memberCall(cancelCustomerCarBookingCore, input));

