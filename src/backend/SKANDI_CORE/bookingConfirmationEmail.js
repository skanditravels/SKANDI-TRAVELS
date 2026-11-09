// /src/backend/SKANDI_CORE/bookingConfirmationEmail.js
// SKANDI V12 — confirmed customer-cart -> Wix Booking Confirmation automation.
// Booking state, supplier identities and payment remain owned by customerBooking/bookingCart.
// This component dispatches only; Wix Automations owns the branded email and delivery.

import { customTrigger } from "@wix/automations";
import { auth } from "@wix/essentials";
import { secrets } from "wix-secrets-backend.v2";
import { elevate } from "wix-auth";
import { loadBookingCartCore } from "backend/SKANDI_CORE/customerBooking";
import { updateOwnedCart } from "backend/SKANDI_CORE/bookingCart";
import { restRequest } from "backend/SKANDI_CORE/supabaseServer";
import { text } from "backend/SKANDI_CORE/platformValidation";

const runTrigger = auth.elevate(customTrigger.runTrigger);
const getSecretValue = elevate(secrets.getSecretValue);
const DELIVERY_TABLE = "customer_notifications";
const SECRET_NAME = "SKANDI_BOOKING_CONFIRMATION_TRIGGER_ID";
const GUEST_READY_SECRET = "SKANDI_GUEST_BOOKING_CONFIRMATION_READY";
const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MANAGE_BOOKING_URL = "https://www.skanditravels.com/my-profile?section=trips&view=upcoming";
const GUEST_HELP_URL = "https://www.skanditravels.com/about/support";

const array = value => Array.isArray(value) ? value : [];
const object = value => value && typeof value === "object" && !Array.isArray(value) ? value : {};
const str = (value, limit = 1200) => text(value, limit)
  .replace(/[<>\u0000-\u001F\u007F]/g, " ")
  .replace(/\$\{|\{\{|\}\}/g, " ")
  .trim();
const asLine = parts => parts.map(v => str(v, 200)).filter(Boolean).join(" · ");
const safeIso = value => str(value, 50);
const triggerTimestamp = value => {
  const timestamp = Date.parse(str(value, 50));
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString().replace(/\.\d{3}Z$/, "Z") : "";
};
const eq = value => `eq.${String(value ?? "")}`;

function error(code, message) {
  const value = new Error(message);
  value.code = code;
  return value;
}
function sourceValue(...items) {
  return items.map(value => str(value, 240)).find(Boolean) || "";
}
function price(value, currency) {
  const num = Number(value);
  const c = str(currency, 3).toUpperCase();
  if (!Number.isFinite(num) || num < 0 || !/^[A-Z]{3}$/.test(c)) {
    throw error("BOOKING_EMAIL_AMOUNT_UNVERIFIED", "Confirmed cart lacks a valid amount or currency.");
  }
  try {
    const fractional = new Intl.NumberFormat("en-US", {style:"currency",currency:c}).resolvedOptions();
    const formatted = new Intl.NumberFormat("en-US", {style:"decimal", minimumFractionDigits:fractional.minimumFractionDigits, maximumFractionDigits:fractional.maximumFractionDigits}).format(num);
    return `${c} ${formatted}`;
  } catch (_) {
    throw error("BOOKING_EMAIL_CURRENCY_UNSUPPORTED", "The recorded currency is not supported by the email formatter.");
  }
}
function passengerNames(cart = {}) {
  return array(cart.travelers).map(p => asLine([
    [p.givenName, p.familyName].filter(Boolean).join(" "),
    p.paxType && p.paxType !== "ADT" ? p.paxType : ""
  ])).filter(Boolean);
}
function flightSegments(cart = {}) {
  const slices = array(cart.airOrder?.slices);
  return slices.flatMap(slice => array(slice.segments).map(segment => {
    const carrier = object(segment.marketingCarrier);
    const operator = object(segment.operatingCarrier);
    const flight = asLine([
      sourceValue(carrier.iataCode, carrier.name),
      sourceValue(segment.marketingFlightNumber, segment.flightNumber)
    ]);
    const sector = [sourceValue(segment.origin?.iataCode, segment.origin?.name),
      sourceValue(segment.destination?.iataCode, segment.destination?.name)].filter(Boolean).join(" → ");
    const dates = [safeIso(segment.departingAt), safeIso(segment.arrivingAt)].filter(Boolean).join(" → ");
    const operatedBy = operator.name && operator.name !== carrier.name ? `Operated by ${str(operator.name,120)}` : "";
    return asLine([flight, sector, dates, operatedBy]);
  })).filter(Boolean);
}
function hotelSummary(cart = {}) {
  const stay = object(cart.stayBooking);
  const quote = object(cart.stayQuote);
  if (!stay.id && !quote.id) return "";
  const accommodation = object(stay.accommodation || quote.accommodation);
  const room = array(stay.rooms)[0] || object(quote.room);
  return asLine([
    sourceValue(accommodation.name, quote.accommodationName),
    sourceValue(room.name, room.roomName),
    sourceValue(stay.checkInDate, quote.checkInDate) && `Check-in: ${sourceValue(stay.checkInDate, quote.checkInDate)}`,
    sourceValue(stay.checkOutDate, quote.checkOutDate) && `Check-out: ${sourceValue(stay.checkOutDate, quote.checkOutDate)}`,
    sourceValue(stay.reference) && `Hotel reference: ${sourceValue(stay.reference)}`
  ]);
}
function carSummary(cart = {}) {
  const car = object(cart.carBooking);
  const quote = object(cart.carQuote);
  if (!car.id && !quote.id) return "";
  const vehicle = object(car.car || quote.car);
  return asLine([
    sourceValue(vehicle.name, vehicle.description, quote.title),
    sourceValue(car.pickupDateTime, quote.pickupDateTime) && `Pickup: ${sourceValue(car.pickupDateTime, quote.pickupDateTime)}`,
    sourceValue(car.dropoffDateTime, quote.dropoffDateTime) && `Return: ${sourceValue(car.dropoffDateTime, quote.dropoffDateTime)}`,
    sourceValue(car.reference) && `Rental reference: ${sourceValue(car.reference)}`
  ]);
}
function cancellationSummary(row) {
  const payload = object(row.payload);
  const confirmedConditions = object(payload.airOrder?.conditions);
  const conditions = Object.keys(confirmedConditions).length ? confirmedConditions : object(payload.selectedOffer?.conditions);
  const lines = [["refund_before_departure", "Refund before departure"], ["change_before_departure", "Changes before departure"]].map(([key,label]) => {
    const rule = object(conditions[key]);
    if (typeof rule.allowed !== "boolean") return "";
    let result = `${label}: ${rule.allowed ? "allowed" : "not allowed"}`;
    if (rule.allowed && rule.penalty_amount != null && rule.penalty_currency) {
      try { result += `; fee ${price(rule.penalty_amount, rule.penalty_currency)}`; }
      catch (_) { result += "; fee details are unavailable"; }
    }
    return result;
  }).filter(Boolean);
  if (!lines.length) return "The provider did not return complete cancellation or change conditions. Contact SKANDI for details.";
  if (String(payload.productType || "").toUpperCase().includes("PACKAGE")) lines.push("Hotel conditions may differ; contact SKANDI for the confirmed rate terms.");
  return lines.join(" | ");
}
function confirmedPayload(row, cart, contactId, memberId) {
  const payload = object(row.payload);
  const air = object(payload.airOrder);
  const stay = object(payload.stayBooking);
  const car = object(payload.carBooking);
  const reference = sourceValue(payload.bookingReference, air.bookingReference, stay.reference, car.reference);
  const providerRef = sourceValue(air.bookingReference, stay.reference, car.reference);
  const email = sourceValue(row.email);
  const status = sourceValue(row.status);
  const paymentStatus = sourceValue(payload.payment?.status);
  const productType = str(payload.productType, 60).toUpperCase();
  const segments = flightSegments(cart);
  const travelers = passengerNames(cart);
  const seats = Object.values(object(cart.seatSelections)).map(s => str(s?.designator, 20)).filter(Boolean);
  const extras = array(cart.extras).map(x => sourceValue(x.title, x.name, x.serviceId)).filter(Boolean);
  const transfer = object(cart.transfer);
  const transferDescription = sourceValue(transfer.title, transfer.name, transfer.description, transfer.serviceName);
  const amount = price(row.total, row.currency);
  const confirmationDate = triggerTimestamp(payload.flow?.confirmedAt || row.updated_at);
  const bookingDate = triggerTimestamp(row.created_at || payload.flow?.createdAt || row.updated_at).slice(0, 10);
  if (status !== "Confirmed" || !email || !reference || !paymentStatus) {
    throw error("BOOKING_EMAIL_SOURCE_INCOMPLETE", "Confirmed booking requires a verified email and reference.");
  }
  if (contactId && !GUID.test(contactId)) throw error("BOOKING_EMAIL_CONTACT_INVALID", "The Wix contact ID is invalid.");
  if ((productType === "HOTEL_ONLY" || productType.includes("PACKAGE")) && !stay.id) {
    throw error("BOOKING_EMAIL_HOTEL_UNCONFIRMED", "A booked hotel is missing from the confirmed cart.");
  }
  if ((productType === "CAR_RENTAL_ONLY" || productType.includes("CAR_RENTAL")) && !car.id) {
    throw error("BOOKING_EMAIL_CAR_UNCONFIRMED", "A booked car is missing from the confirmed cart.");
  }
  if ((productType.includes("FLIGHT") || productType.includes("PACKAGE")) && (!air.id || !segments.length)) {
    throw error("BOOKING_EMAIL_AIR_UNCONFIRMED", "Confirmed flight details are missing from the cart.");
  }
  if (Number(cart.travelerCount) > 0 && !travelers.length) {
    throw error("BOOKING_EMAIL_TRAVELERS_UNAVAILABLE", "Confirmed traveler names could not be verified.");
  }
  return {
    ...(contactId ? {contactId} : {}),
    ...(memberId ? {memberId} : {}),
    bookingId: str(row.cart_id, 50),
    bookingReference: reference,
    supplierReference: providerRef,
    customerEmail: email,
    productType: sourceValue(payload.productType, "SKANDI booking"),
    ...(confirmationDate ? {confirmationDate} : {}),
    ...(bookingDate ? {bookingDate} : {}),
    flightDetails: segments.length ? segments.join(" | ") : "Not part of this booking",
    travelerDetails: travelers.length ? travelers.join(" | ") : "Contact SKANDI for traveler details",
    hotelDetails: hotelSummary(cart) || "Not part of this booking",
    carDetails: carSummary(cart) || "Not part of this booking",
    seatDetails: seats.length ? seats.join(", ") : "No confirmed seat assignment recorded",
    extrasDetails: extras.length ? extras.join(" | ") : "No extra services recorded",
    transferDetails: transferDescription || "No transfer selected",
    totalAmount: amount,
    currency: str(row.currency, 3).toUpperCase(),
    paymentStatus,
    cancellationTerms: cancellationSummary(row),
    manageBookingUrl: memberId ? MANAGE_BOOKING_URL : GUEST_HELP_URL,
    documentCenterUrl: memberId ? MANAGE_BOOKING_URL : GUEST_HELP_URL,
    confirmationSource: "SKANDI_V12_CUSTOMER_CHECKOUT"
  };
}
async function triggerId() {
  const result = await getSecretValue(SECRET_NAME);
  const id = str(typeof result === "string" ? result : result?.value ?? result?.secretValue ?? result?.secret?.value, 100);
  if (!GUID.test(id)) throw error("BOOKING_EMAIL_TRIGGER_NOT_CONFIGURED", `Configure Wix secret ${SECRET_NAME} with the actual Wix custom-trigger ID.`);
  return id;
}
function guestEmailError() {
  const value = error("BOOKING_CONFIRMATION_UNAVAILABLE", "Booking confirmation is temporarily unavailable. Please try again or contact SKANDI before paying.");
  value.publicMessage = value.message;
  return value;
}
// The existing Wix draft addresses its message to the customerEmail trigger
// field. Use the email saved on the owned cart; never trust an input contact ID.
export async function prepareGuestConfirmationCore(context, cartId) {
  if (!context?.guestHash) return;
  const loaded = await loadBookingCartCore(context, {cartId});
  const row = loaded.row;
  const email = str(row.email,254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw guestEmailError();
  try {
    await triggerId();
    // A trigger ID alone does not prove its automation is active or correctly
    // configured. Fail closed until the published confirmation is verified.
    const ready = await getSecretValue(GUEST_READY_SECRET);
    const value = str(typeof ready === "string" ? ready : ready?.value ?? ready?.secretValue ?? ready?.secret?.value, 20).toLowerCase();
    if (value !== "true") throw guestEmailError();
    await updateOwnedCart(context, row.cart_id, {payload:{...object(row.payload), guestReceiptEmail:email}});
  } catch (_) { throw guestEmailError(); }
}
async function claimed(id) {
  const records = await restRequest({table:DELIVERY_TABLE,query:{select:"id,notification_id,payload",notification_id:eq(id),limit:1}});
  return array(records)[0] || null;
}
async function claim(id, context, row, bookingRef) {
  const body = {
    notification_id: id,
    member_id: str(context.memberId, 180) || null,
    wix_member_id: str(context.memberId, 180) || null,
    type: "BOOKING_CONFIRMATION_EMAIL",
    title: "Booking confirmation email",
    message: "Booking confirmation delivery was requested.",
    entity_type: "BOOKING_CART",
    entity_id: str(row.cart_id, 50),
    action_path: context.memberId ? "/my-profile?section=trips&view=upcoming" : "/about/support",
    read: true,
    payload: { deliveryState:"DISPATCHING", reference:bookingRef, startedAt:new Date().toISOString() }
  };
  try {
    const rows = await restRequest({table:DELIVERY_TABLE,method:"POST",body});
    const saved = array(rows)[0];
    if (!saved?.id) throw error("BOOKING_EMAIL_CLAIM_NOT_PERSISTED", "Cannot reserve a unique delivery record.");
    return { claimed:true, record:saved };
  } catch (cause) {
    const existing = await claimed(id);
    if (existing) return { claimed:false, record:existing };
    throw cause;
  }
}
async function recordOutcome(id, current, state, description) {
  const last = object(current.payload);
  const payload = {...last, deliveryState:state, updatedAt:new Date().toISOString(), detail:str(description,200)};
  await restRequest({table:DELIVERY_TABLE,method:"PATCH",query:{notification_id:eq(id)},body:{payload}});
}

// Call only from customerBooking.web.js AFTER a canonical booking core has returned Confirmed.
// Neither a frontend booking ID nor a page claim can authorize this action.
export async function dispatchConfirmedBookingEmailCore(context, bookingId) {
  if (!context?.memberId && !context?.guestHash) throw error("BOOKING_EMAIL_AUTH_REQUIRED", "A verified booking session is required.");
  const cartId = str(bookingId, 50);
  const loaded = await loadBookingCartCore(context, {cartId}, {includeTravelers:true});
  const row = loaded.row;
  if (!row || row.status !== "Confirmed" || !row.cart_id) {
    throw error("BOOKING_EMAIL_NOT_CONFIRMED", "The booking has not reached Confirmed state.");
  }
  if (context.guestHash) {
    if (str(row.payload?.guestReceiptEmail,254).toLowerCase() !== str(row.email,254).toLowerCase()) {
      throw error("BOOKING_EMAIL_RECIPIENT_MISMATCH", "The guest booking recipient could not be verified.");
    }
  }
  const data = confirmedPayload(row, loaded.cart, str(context.contactId,100), str(context.memberId,180));
  const configuredTrigger = await triggerId();
  const deliveryId = `SKANDI_BOOKING_CONFIRMED:${row.cart_id}`;
  const reserved = await claim(deliveryId, context, row, data.bookingReference);
  if (!reserved.claimed) return {status:"ALREADY_DISPATCH_REQUESTED", bookingId:row.cart_id};

  try {
    await runTrigger({triggerId:configuredTrigger, payload:data});
  } catch (cause) {
    try { await recordOutcome(deliveryId, reserved.record, "REQUIRES_REVIEW", cause?.code || cause?.message || "Trigger outcome unknown"); }
    catch (auditError) { console.error("[SKANDI][BookingEmail] failed to persist failure state", auditError); }
    throw error("BOOKING_EMAIL_TRIGGER_FAILED", "Wix did not confirm acceptance of the booking email trigger; review before retrying.");
  }
  try { await recordOutcome(deliveryId, reserved.record, "TRIGGER_ACCEPTED", "Wix Automation trigger returned successfully; actual email delivery not yet verified."); }
  catch (auditError) { console.error("[SKANDI][BookingEmail] trigger accepted but audit update failed", auditError); }
  return {status:"TRIGGER_ACCEPTED", bookingId:row.cart_id};
}
