// /src/backend/SKANDI_CORE/bookingMapper.js
// SKANDI Backend Base 1.0 — B-006 booking validation and public mapping.

import { text, lower, upper, record } from "backend/SKANDI_CORE/platformValidation.js";

const CABINS = new Set(["economy", "premium_economy", "business", "first"]);
const TITLES = new Set(["mr", "ms", "mrs", "miss", "dr"]);
const GENDERS = new Set(["m", "f"]);

export function bookingError(code, message, status = 400, details = null) {
  const error = new Error(message);
  error.name = "BookingError";
  error.code = upper(code || "BOOKING_ERROR", 80);
  error.publicMessage = message;
  error.status = Number(status || 400);
  error.details = details;
  return error;
}
function arr(value) { return Array.isArray(value) ? value : []; }
function number(value, fallback = 0) { const n = Number(value); return Number.isFinite(n) ? n : fallback; }
function isoDate(value, label, { future = false, past = false } = {}) {
  const v = text(value, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) throw bookingError("INVALID_DATE", `Enter a valid ${label}.`);
  const d = new Date(`${v}T00:00:00Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== v) throw bookingError("INVALID_DATE", `Enter a valid ${label}.`);
  const today = new Date().toISOString().slice(0, 10);
  if (future && v < today) throw bookingError("INVALID_DATE", `${label} must be today or later.`);
  if (past && v >= today) throw bookingError("INVALID_DATE", `${label} must be in the past.`);
  return v;
}
function iata(value, label) {
  const v = upper(value, 3);
  if (!/^[A-Z]{3}$/.test(v)) throw bookingError("INVALID_IATA_CODE", `${label} must be a three-letter airport/city code.`);
  return v;
}
function email(value) {
  const v = lower(value, 254);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) throw bookingError("INVALID_EMAIL", "Enter a valid email address.");
  return v;
}
function phone(value) {
  const v = text(value, 20);
  if (!/^\+[1-9]\d{7,14}$/.test(v)) throw bookingError("INVALID_PHONE", "Use an international phone number, for example +12125550123.");
  return v;
}
function personName(value, label) {
  const v = text(value, 80);
  if (v.length < 1 || !/^[\p{L}\p{M}' .-]+$/u.test(v)) throw bookingError("INVALID_TRAVELER_NAME", `Enter a valid ${label}.`);
  return v;
}

export function toDuffelOfferSearch(input = {}) {
  const source = record(input);
  const slices = arr(source.slices).length ? source.slices : [{
    origin: source.origin || source.from,
    destination: source.destination || source.to,
    departureDate: source.departureDate || source.departure_date
  }, ...(source.returnDate ? [{
    origin: source.destination || source.to,
    destination: source.origin || source.from,
    departureDate: source.returnDate
  }] : [])];
  if (slices.length < 1 || slices.length > 2) throw bookingError("INVALID_SLICES", "Use one-way or return flight search.");
  const normalizedSlices = slices.map((slice) => ({
    origin: iata(slice.origin, "Origin"),
    destination: iata(slice.destination, "Destination"),
    departureDate: isoDate(slice.departureDate, "departure date", { future: true })
  }));
  if (normalizedSlices.some(s => s.origin === s.destination)) throw bookingError("INVALID_ROUTE", "Origin and destination must be different.");
  if (normalizedSlices[1] && normalizedSlices[1].departureDate < normalizedSlices[0].departureDate) throw bookingError("INVALID_RETURN_DATE", "Return must be on or after departure.");

  let passengers = arr(source.passengers);
  if (!passengers.length) {
    const adults = Math.max(1, Math.min(9, Number(source.adults || 1)));
    const children = Math.max(0, Math.min(8, Number(source.children || 0)));
    const infants = Math.max(0, Math.min(adults, Number(source.infants || 0)));
    const childAges = arr(source.childAges);
    passengers = [
      ...Array.from({ length: adults }, () => ({ type: "adult" })),
      ...Array.from({ length: children }, (_, i) => ({ age: Math.max(2, Math.min(17, Number(childAges[i] ?? 8))) })),
      ...Array.from({ length: infants }, () => ({ age: 1 }))
    ];
  }
  if (passengers.length < 1 || passengers.length > 9) throw bookingError("INVALID_PASSENGERS", "A booking can contain 1–9 travelers.");
  const normalizedPassengers = passengers.map((p) => p?.type ? { type: lower(p.type, 30) } : { age: Math.max(0, Math.min(17, Number(p?.age))) });
  const adults = normalizedPassengers.filter(p => p.type === "adult").length;
  const infants = normalizedPassengers.filter(p => Number.isInteger(p.age) && p.age < 2).length;
  if (adults < 1) throw bookingError("ADULT_REQUIRED", "At least one adult traveler is required.");
  if (infants > adults) throw bookingError("INFANT_ASSIGNMENT_INVALID", "Each infant requires a separate adult traveler.");

  const cabinClass = lower(source.cabinClass || source.cabin_class || "economy", 30);
  if (!CABINS.has(cabinClass)) throw bookingError("INVALID_CABIN_CLASS", "Choose a supported cabin class.");
  const searchContext = {
    origin: normalizedSlices[0].origin,
    destination: normalizedSlices[0].destination,
    departureDate: normalizedSlices[0].departureDate,
    returnDate: normalizedSlices[1]?.departureDate || null,
    slices: normalizedSlices,
    passengerCount: normalizedPassengers.length,
    cabinClass
  };
  return {
    coreRequest: {
      slices: normalizedSlices,
      passengers: normalizedPassengers,
      cabinClass,
      maxConnections: Math.max(0, Math.min(2, Number(source.maxConnections ?? 1))),
      supplierTimeout: Math.max(2000, Math.min(20000, Number(source.supplierTimeout ?? 15000)))
    },
    searchContext
  };
}

export function mapOfferForHome(offer = {}, searchContext = {}) {
  const slices = arr(offer.slices);
  const first = slices[0] || {};
  const segments = slices.flatMap(slice => arr(slice.segments));
  return {
    id: offer.id,
    provider: "Duffel",
    totalAmount: offer.totalAmount,
    totalCurrency: offer.totalCurrency,
    expiresAt: offer.expiresAt,
    owner: offer.owner,
    origin: first.origin,
    destination: first.destination,
    slices,
    operatingCarriers: segments.map(s => s.operatingCarrier).filter(Boolean),
    stops: Math.max(0, segments.length - slices.length),
    searchContext
  };
}

export function mapOfferForCart(offer = {}) {
  const slices = arr(offer.slices);
  const routeSummary = slices.map(s => `${s.origin?.iataCode || "—"}–${s.destination?.iataCode || "—"}`).join(" / ");
  return {
    id: offer.id,
    totalAmount: offer.totalAmount,
    totalCurrency: offer.totalCurrency,
    taxAmount: offer.taxAmount,
    taxCurrency: offer.taxCurrency,
    expiresAt: offer.expiresAt,
    isExpired: offer.isExpired === true,
    owner: offer.owner,
    passengers: arr(offer.passengers),
    requiresInstantPayment: offer.requiresInstantPayment === true,
    identityDocumentRequired: offer.identityDocumentRequired === true,
    supportedIdentityDocumentTypes: arr(offer.supportedIdentityDocumentTypes),
    conditions: offer.conditions || {},
    availableServices: arr(offer.availableServices),
    slices,
    routeSummary,
    summary: routeSummary
  };
}

export function assertOfferMatchesSearch(offer = {}, searchContext = {}) {
  const slices = arr(offer.slices);
  const expected = arr(searchContext.slices);
  if (!slices.length || !expected.length) throw bookingError("OFFER_ROUTE_MISMATCH", "The live airline offer no longer matches this search.");
  if (slices.length !== expected.length) throw bookingError("OFFER_ROUTE_MISMATCH", "The live airline offer no longer matches the selected journey.");
  expected.forEach((e, i) => {
    const s = slices[i] || {};
    if (upper(s.origin?.iataCode, 3) !== upper(e.origin, 3) || upper(s.destination?.iataCode, 3) !== upper(e.destination, 3)) {
      throw bookingError("OFFER_ROUTE_MISMATCH", "The airline offer route changed. Search again.");
    }
    const date = String(s.segments?.[0]?.departingAt || "").slice(0, 10);
    if (date && e.departureDate && date !== e.departureDate) throw bookingError("OFFER_DATE_MISMATCH", "The airline offer date changed. Search again.");
  });
  return true;
}

function identityDocuments(value) {
  return arr(value).slice(0, 4).map(doc => {
    const type = lower(doc.type || "passport", 40);
    const uniqueIdentifier = upper(doc.uniqueIdentifier || doc.number, 50);
    const issuingCountryCode = upper(doc.issuingCountryCode || doc.issuingCountry, 2);
    const expiresOn = isoDate(doc.expiresOn || doc.expiryDate, "document expiry", { future: true });
    if (!/^[A-Z0-9-]{3,50}$/.test(uniqueIdentifier)) throw bookingError("INVALID_DOCUMENT_NUMBER", "A travel document number is invalid.");
    if (!/^[A-Z]{2}$/.test(issuingCountryCode)) throw bookingError("INVALID_ISSUING_COUNTRY", "Use a two-letter issuing country code.");
    return { type, uniqueIdentifier, issuingCountryCode, expiresOn };
  });
}

export function buildDuffelPassengers(travelers, contact, offer = {}) {
  const expected = arr(offer.passengers);
  const input = arr(travelers);
  if (!expected.length || input.length !== expected.length) throw bookingError("PASSENGER_COUNT_MISMATCH", "Traveler details do not match the selected airline offer.");
  const seen = new Set();
  const passengers = input.map((traveler, index) => {
    const expectedPassenger = expected[index] || {};
    const id = text(traveler.id || traveler.passengerId || expectedPassenger.id, 180);
    if (!id || !expected.some(p => p.id === id) || seen.has(id)) throw bookingError("PASSENGER_ID_MISMATCH", "Traveler details do not match the airline offer.");
    seen.add(id);
    const title = lower(traveler.title, 10);
    const gender = lower(traveler.gender || traveler.sex, 5);
    if (!TITLES.has(title)) throw bookingError("INVALID_PASSENGER_TITLE", "Choose a traveler title.");
    if (!GENDERS.has(gender)) throw bookingError("INVALID_PASSENGER_GENDER", "Choose a traveler gender.");
    const docs = identityDocuments(traveler.identityDocuments || traveler.documents);
    if (offer.identityDocumentRequired && !docs.length) throw bookingError("IDENTITY_DOCUMENT_REQUIRED", "The airline requires a passport or identity document for each traveler.");
    return {
      id,
      title,
      gender,
      givenName: personName(traveler.givenName || traveler.firstName, "given name"),
      familyName: personName(traveler.familyName || traveler.lastName, "family name"),
      bornOn: isoDate(traveler.bornOn || traveler.dateOfBirth || traveler.birthDate, "date of birth", { past: true }),
      nationality: upper(traveler.nationality || traveler.nationalityCode, 2) || null,
      email: email(traveler.email || contact?.email),
      phoneNumber: phone(traveler.phoneNumber || traveler.phone || contact?.phoneNumber || contact?.phone),
      identityDocuments: docs
    };
  });
  const normalizedContact = {
    email: email(contact?.email || passengers[0]?.email),
    phoneNumber: phone(contact?.phoneNumber || contact?.phone || passengers[0]?.phoneNumber)
  };
  return { passengers, contact: normalizedContact };
}

export function toDuffelOrderPassengers(value = []) {
  return arr(value).map(p => ({
    id: p.id,
    title: p.title,
    gender: p.gender,
    givenName: p.givenName,
    familyName: p.familyName,
    bornOn: p.bornOn,
    email: p.email,
    phoneNumber: p.phoneNumber,
    identityDocuments: arr(p.identityDocuments)
  }));
}

export function travelerTriggerProjection(value = []) {
  return arr(value).map(p => ({
    id: p.id,
    type: "ADT",
    paxType: "ADT",
    givenName: p.givenName,
    familyName: p.familyName,
    gender: p.gender,
    bornOn: p.bornOn,
    dateOfBirth: p.bornOn,
    nationality: p.nationality || null
  }));
}

export function combineServiceSelections(payload = {}) {
  const result = [];
  const seen = new Set();
  for (const extra of arr(payload.extras)) {
    const id = text(extra.id || extra.serviceId, 180);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    result.push({ id, quantity: Math.max(1, Math.min(9, Number(extra.quantity) || 1)) });
  }
  for (const seat of Object.values(record(payload.seatSelections))) {
    const id = text(seat?.serviceId || seat?.id, 180);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    result.push({ id, quantity: 1 });
  }
  return result;
}

export function toPublicCart(row = {}, sensitive = null) {
  const payload = record(row.payload);
  return {
    cartId: row.cart_id,
    status: row.status,
    currency: row.currency,
    subtotal: row.subtotal,
    taxes: row.taxes,
    total: row.total,
    expiresAt: row.expires_at,
    source: row.source,
    productType: payload.productType || "flight",
    selectedOffer: payload.selectedOffer || null,
    stayQuote: payload.stayQuote || null,
    extras: arr(payload.extras),
    transfer: payload.transfer || null,
    seatSelections: record(payload.seatSelections),
    seatsSkipped: payload.seatsSkipped === true,
    travelerCount: Number(payload.travelerCount || sensitive?.passengers?.length || 0),
    flow: record(payload.flow),
    payment: payload.payment ? {
      paymentIntentId: payload.payment.paymentIntentId || null,
      amount: payload.payment.amount || null,
      currency: payload.payment.currency || null,
      status: payload.payment.status || null,
      captureMethod: payload.payment.captureMethod || null
    } : null,
    reconciliation: payload.reconciliation || null,
    bookingReference: payload.bookingReference || payload.airOrder?.bookingReference || payload.stayBooking?.reference || null,
    airOrder: payload.airOrder || null,
    stayBooking: payload.stayBooking || null,
    travelers: sensitive ? travelerTriggerProjection(sensitive.passengers) : undefined
  };
}
