// /src/backend/SKANDI_CORE/duffelGround.js
// SKANDI Backend Base 1.0 — B-005R1 canonical Duffel Stays/Cars provider core.
// Pure provider layer: no Wix member/staff auth, no Supabase/ALTEA persistence and no Stripe.
// Booking ownership and synchronization stay in customerBooking/reservations.

import { duffelRequest } from "backend/SKANDI_CORE/duffelClient.js";

function arr(v) { return Array.isArray(v) ? v : []; }
function clean(v, max = 500) { return String(v ?? "").trim().slice(0, max); }
function upper(v, max = 500) { return clean(v, max).toUpperCase(); }
function lower(v, max = 500) { return clean(v, max).toLowerCase(); }
function money(v) { const n = Number(v); return Number.isFinite(n) ? n.toFixed(2) : "0.00"; }
function fail(code, message, status = 400) { const e = new Error(message); e.name = "DuffelGroundError"; e.code = code; e.status = status; e.publicMessage = message; return e; }
function id(value, prefix, label) { const x = clean(value, 220); if (!new RegExp(`^${prefix}[A-Za-z0-9_]+$`).test(x)) throw fail("INVALID_RESOURCE_ID", `The ${label} reference is invalid.`); return x; }
function calendarDate(value, label) {
  const x = clean(value, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(x)) throw fail("INVALID_DATE", `The ${label} is invalid.`);
  const parsed = new Date(`${x}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== x) throw fail("INVALID_DATE", `The ${label} is invalid.`);
  return x;
}
function futureDate(value, label) {
  const x = calendarDate(value, label);
  if (x < new Date().toISOString().slice(0, 10)) throw fail("INVALID_DATE", `The ${label} must be today or later.`);
  return x;
}
function time(value, label) { const x = clean(value, 5); if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(x)) throw fail("INVALID_TIME", `The ${label} time is invalid.`); return x; }
function email(value) { const x = lower(value, 254); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x)) throw fail("INVALID_EMAIL", "Enter a valid email address."); return x; }
function phone(value) { const x = clean(value, 20); if (!/^\+[1-9]\d{7,14}$/.test(x)) throw fail("INVALID_PHONE", "Enter a phone number in international format."); return x; }
function coordinate(value, min, max, label) { const n = Number(value); if (!Number.isFinite(n) || n < min || n > max) throw fail("INVALID_LOCATION", `The ${label} coordinate is invalid.`); return n; }

function normalizeAccommodation(a = {}) {
  const address = a.location?.address || a.address || {};
  return {
    id: a.id || "", name: a.name || "Accommodation", description: a.description || "",
    rating: Number(a.rating || a.star_rating || 0), reviewScore: Number(a.review_score || 0), reviewCount: Number(a.review_count || 0),
    photos: arr(a.photos).map(p => p?.url).filter(Boolean), phoneNumber: a.phone_number || "", email: a.email || "",
    address: { lineOne: address.line_one || "", city: address.city_name || address.city || "", region: address.region || "", postalCode: address.postal_code || "", countryCode: address.country_code || "" },
    coordinates: a.location?.geographic_coordinates ? { latitude: Number(a.location.geographic_coordinates.latitude), longitude: Number(a.location.geographic_coordinates.longitude) } : null,
    checkInInformation: a.check_in_information || null, amenities: arr(a.amenities), brand: a.brand || null, chain: a.chain || null
  };
}

function normalizeStaySearchResult(result = {}) {
  const a = normalizeAccommodation(result.accommodation || {});
  return {
    id: result.id || "", staySearchResultId: result.id || "", accommodationId: a.id,
    title: a.name, name: a.name, description: a.description, rating: a.rating,
    imageUrl: a.photos[0] || "", address: a.address,
    cheapestRateTotalAmount: money(result.cheapest_rate_total_amount),
    cheapestRateTotalCurrency: upper(result.cheapest_rate_total_currency || result.cheapest_rate_currency || "USD", 3),
    total: money(result.cheapest_rate_total_amount), currency: upper(result.cheapest_rate_total_currency || result.cheapest_rate_currency || "USD", 3),
    expiresAt: result.expires_at || null, rooms: Number(result.rooms || 0), guests: arr(result.guests),
    accommodation: a, supplier: "DUFFEL", source: "DUFFEL_STAYS"
  };
}

function ratesFromSearchResult(result = {}) {
  const out = [];
  for (const room of arr(result?.accommodation?.rooms)) {
    for (const rate of arr(room?.rates)) {
      if (!rate?.id) continue;
      out.push({
        id: rate.id, rateId: rate.id, roomName: room.name || "Room", roomDescription: room.description || "",
        roomPhotos: arr(room.photos).map(p => p?.url).filter(Boolean),
        totalAmount: money(rate.total_amount), totalCurrency: upper(rate.total_currency || "USD", 3),
        baseAmount: money(rate.base_amount), taxAmount: money(rate.tax_amount), feeAmount: money(rate.fee_amount),
        cancellationTimeline: arr(rate.cancellation_timeline), boardType: rate.board_type || rate.board_name || "",
        expiresAt: rate.expires_at || null, paymentType: rate.payment_type || null,
        availablePaymentMethods: arr(rate.available_payment_methods), conditions: arr(rate.conditions),
        dueAtAccommodationAmount: money(rate.due_at_accommodation_amount),
        dueAtAccommodationCurrency: upper(rate.due_at_accommodation_currency || rate.total_currency || "USD", 3)
      });
    }
  }
  return out.sort((a, b) => Number(a.totalAmount) - Number(b.totalAmount));
}

function normalizeStayQuote(q = {}) {
  const rates = arr(q.rooms).flatMap(room => arr(room?.rates));
  const selected = rates[0] || {};
  return {
    id: q.id || "", quoteId: q.id || "", totalAmount: money(q.total_amount), totalCurrency: upper(q.total_currency || "USD", 3),
    taxAmount: money(q.tax_amount), taxCurrency: upper(q.tax_currency || q.total_currency || "USD", 3),
    feeAmount: money(q.fee_amount), baseAmount: money(q.base_amount), expiresAt: q.expires_at || null,
    checkInDate: q.check_in_date || null, checkOutDate: q.check_out_date || null,
    accommodation: q.accommodation ? normalizeAccommodation(q.accommodation) : null,
    rooms: arr(q.rooms), guests: arr(q.guests), paymentType: selected.payment_type || "",
    availablePaymentMethods: arr(selected.available_payment_methods),
    dueAtAccommodationAmount: money(selected.due_at_accommodation_amount || q.due_at_accommodation_amount),
    dueAtAccommodationCurrency: upper(selected.due_at_accommodation_currency || q.due_at_accommodation_currency || q.total_currency || "USD", 3),
    cancellationTimeline: arr(selected.cancellation_timeline), conditions: arr(selected.conditions),
    supportedLoyaltyProgramme: q.supported_loyalty_programme || null
  };
}

function normalizeStayBooking(b = {}) {
  const bookedRate = arr(b?.accommodation?.rooms).flatMap(room => arr(room?.rates))[0] || {};
  return {
    id: b.id || "", reference: b.reference || "", status: b.status || "", quoteId: b.quote_id || b?.metadata?.quote_id || "",
    checkInDate: b.check_in_date || null, checkOutDate: b.check_out_date || null, rooms: Number(b.rooms || 0),
    totalAmount: money(b.total_amount || bookedRate.total_amount), totalCurrency: upper(b.total_currency || bookedRate.total_currency || "USD", 3),
    paymentType: bookedRate.payment_type || b.payment_type || "",
    accommodation: b.accommodation ? normalizeAccommodation(b.accommodation) : null,
    guests: arr(b.guests).map(g => ({ givenName: g.given_name || "", familyName: g.family_name || "" })),
    cancelledAt: b.cancelled_at || null, confirmedAt: b.confirmed_at || null
  };
}

function normalizeCarLocation(loc = {}) {
  return {
    name: loc.name || "", phoneNumber: loc.phone_number || "",
    address: loc.address ? { lineOne: loc.address.line_one || "", city: loc.address.city_name || "", region: loc.address.region || "", postalCode: loc.address.postal_code || "", countryCode: loc.address.country_code || "" } : null,
    geographicCoordinates: loc.geographic_coordinates ? { latitude: Number(loc.geographic_coordinates.latitude), longitude: Number(loc.geographic_coordinates.longitude) } : null,
    openingHours: arr(loc.opening_hours), additionalInformation: arr(loc.additional_information)
  };
}
function normalizeCar(car = {}) { return { name: car.name || "Vehicle", code: car.code || "", category: car.category || "", type: car.type || "", transmission: car.transmission || "", fuel: car.fuel || "", maxPassengers: Number(car.max_passengers || 0), airConditioning: car.air_conditioning === true, baggage: car.baggage || null, images: arr(car.images).map(i => i?.url).filter(Boolean) }; }
function normalizeCarRate(rate = {}) { return { id: rate.id || "", rateId: rate.id || "", totalAmount: money(rate.total_amount), totalCurrency: upper(rate.total_currency || "USD", 3), baseAmount: money(rate.base_amount), baseCurrency: upper(rate.base_currency || rate.total_currency || "USD", 3), paymentType: rate.payment_type || "", supplier: rate.supplier ? { name: rate.supplier.name || "", logoUrl: rate.supplier.logo_url || "" } : null, pickupLocation: normalizeCarLocation(rate.pickup_location), dropoffLocation: normalizeCarLocation(rate.dropoff_location), car: normalizeCar(rate.car), conditions: arr(rate.conditions), charges: arr(rate.charges), mileage: rate.mileage || null, source: "DUFFEL_CARS" }; }
function normalizeCarQuote(q = {}) { return { id: q.id || "", quoteId: q.id || "", totalAmount: money(q.total_amount), totalCurrency: upper(q.total_currency || "USD", 3), baseAmount: money(q.base_amount), baseCurrency: upper(q.base_currency || q.total_currency || "USD", 3), paymentType: q.payment_type || "", supplier: q.supplier ? { name: q.supplier.name || "", logoUrl: q.supplier.logo_url || "" } : null, pickupDate: q.pickup_date || null, pickupTime: q.pickup_time || "", dropoffDate: q.dropoff_date || null, dropoffTime: q.dropoff_time || "", pickupLocation: normalizeCarLocation(q.pickup_location), dropoffLocation: normalizeCarLocation(q.dropoff_location), car: normalizeCar(q.car), conditions: arr(q.conditions), charges: arr(q.charges), privacyPolicies: arr(q.privacy_policies), mileage: q.mileage || null, source: "DUFFEL_CARS" }; }
function normalizeCarBooking(b = {}) { return { id: b.id || "", reference: b.reference || "", status: b.status || "", quoteId: b.quote_id || "", paymentType: b.payment_type || "", totalAmount: money(b.total_amount), totalCurrency: upper(b.total_currency || "USD", 3), confirmedAt: b.confirmed_at || null, cancelledAt: b.cancelled_at || null, pickupDate: b.pickup_date || null, pickupTime: b.pickup_time || "", dropoffDate: b.dropoff_date || null, dropoffTime: b.dropoff_time || "", pickupLocation: normalizeCarLocation(b.pickup_location), dropoffLocation: normalizeCarLocation(b.dropoff_location), car: normalizeCar(b.car), supplier: b.supplier ? { name: b.supplier.name || "", logoUrl: b.supplier.logo_url || "" } : null, driver: b.driver ? { givenName: b.driver.given_name || "", familyName: b.driver.family_name || "", email: b.driver.email || "", phoneNumber: b.driver.phone_number || "", dateOfBirth: b.driver.date_of_birth || null } : null, conditions: arr(b.conditions), charges: arr(b.charges), privacyPolicies: arr(b.privacy_policies) }; }

function groundLocation(value = {}, fallbackRadius = 10) {
  const source = value.geographicCoordinates || value.geographic_coordinates || value;
  return {
    radius: Math.max(1, Math.min(100, Number(value.radiusKm || value.radius || fallbackRadius) || fallbackRadius)),
    geographic_coordinates: {
      longitude: coordinate(source.longitude, -180, 180, "longitude"),
      latitude: coordinate(source.latitude, -90, 90, "latitude")
    }
  };
}

function stayGuests(input = {}, rooms = 1) {
  if (arr(input.guests).length) return arr(input.guests).slice(0, 18).map(g => g?.type ? { type: lower(g.type, 20), ...(g.age !== undefined ? { age: Math.max(0, Math.min(17, Number(g.age))) } : {}) } : { type: "adult" });
  const adults = Math.max(1, Math.min(18, Number(input.adults || rooms || 1)));
  const ages = arr(input.childAges).slice(0, 16);
  return [...Array.from({ length: adults }, () => ({ type: "adult" })), ...ages.map(age => ({ type: "child", age: Math.max(0, Math.min(17, Number(age) || 0)) }))];
}

export async function searchDuffelStaysCore(input = {}) {
  const checkInDate = futureDate(input.checkInDate || input.departureDate, "check-in date");
  const checkOutDate = futureDate(input.checkOutDate || input.returnDate, "check-out date");
  if (checkOutDate <= checkInDate) throw fail("INVALID_STAY_DATES", "Check-out must be after check-in.");
  const rooms = Math.max(1, Math.min(9, Number(input.rooms || 1)));
  const accommodationIds = (arr(input.accommodationIds).length ? arr(input.accommodationIds) : (input.accommodationId ? [input.accommodationId] : [])).map(x => id(x, "acc_", "accommodation")).slice(0, 100);
  const data = { rooms, mobile: input.mobile === true, guests: stayGuests(input, rooms), free_cancellation_only: input.freeCancellationOnly === true, check_in_date: checkInDate, check_out_date: checkOutDate };
  let location = null;
  if (accommodationIds.length) data.accommodation = { ids: accommodationIds, fetch_rates: input.fetchRates !== false };
  else {
    location = input.location || input;
    data.location = groundLocation(location, Number(input.radiusKm || 25));
  }
  if (input.instantPayment === true || input.instantPayment === false) data.instant_payment = input.instantPayment;
  if (arr(input.negotiatedRateIds).length) data.negotiated_rate_ids = arr(input.negotiatedRateIds).map(x => clean(x, 180)).filter(Boolean).slice(0, 50);
  const response = await duffelRequest("/stays/search", { method: "POST", body: { data }, retrySafe: false });
  return { location, searchId: response.data?.id || "", items: arr(response.data?.results).map(normalizeStaySearchResult).filter(i => i.id), requestId: response.requestId || null, correlationId: response.correlationId || null };
}

export async function fetchDuffelStayRatesCore({ searchResultId = "" } = {}) {
  const searchId = id(searchResultId, "srr_", "stay search result");
  const response = await duffelRequest(`/stays/search_results/${encodeURIComponent(searchId)}/actions/fetch_all_rates`, { method: "POST", body: { data: {} }, retrySafe: false });
  return { searchResultId: searchId, accommodation: normalizeStaySearchResult(response.data || {}), rates: ratesFromSearchResult(response.data || {}) };
}

export async function quoteDuffelStayCore({ rateId = "" } = {}) {
  const rate = id(rateId, "rat_", "stay rate");
  const response = await duffelRequest("/stays/quotes", { method: "POST", body: { data: { rate_id: rate } }, retrySafe: false });
  return { quote: normalizeStayQuote(response.data || {}) };
}

export async function getDuffelStayQuoteCore({ quoteId = "" } = {}) {
  const quote = id(quoteId, "quo_", "stay quote");
  const response = await duffelRequest(`/stays/quotes/${encodeURIComponent(quote)}`, { retrySafe: true });
  return { quote: normalizeStayQuote(response.data || {}) };
}

function stayGuestPayload(value) {
  const guests = arr(value).map(g => ({ given_name: clean(g.givenName || g.firstName, 80), family_name: clean(g.familyName || g.lastName, 80) })).filter(g => g.given_name && g.family_name);
  if (!guests.length) throw fail("GUEST_REQUIRED", "Add at least one hotel guest.");
  return guests;
}

export async function createDuffelStayBookingCore(input = {}) {
  const quoteId = id(input.quoteId, "quo_", "stay quote");
  const data = {
    quote_id: quoteId,
    guests: stayGuestPayload(input.guests),
    email: email(input.email), phone_number: phone(input.phoneNumber || input.phone),
    metadata: { integration: clean(input.integration || "skandi_provider", 40), quote_id: quoteId, ...(input.internalReference ? { internal_reference: clean(input.internalReference, 100) } : {}) }
  };
  if (input.specialRequests) data.accommodation_special_requests = clean(input.specialRequests, 500);
  if (input.loyaltyProgrammeAccountNumber) data.loyalty_programme_account_number = clean(input.loyaltyProgrammeAccountNumber, 80);
  if (input.threeDSecureSessionId) data.payment = { method: "card", three_d_secure_session_id: id(input.threeDSecureSessionId, "3ds_", "3-D Secure session") };
  const response = await duffelRequest("/stays/bookings", { method: "POST", body: { data }, timeoutMs: 130000, retrySafe: false });
  if (response.status === 202 || !response.data?.id) return { booking: response.data?.id ? normalizeStayBooking(response.data) : null, reconciliationRequired: true, providerStatus: response.status, requestId: response.requestId || null, providerRequestId: response.requestId || null, correlationId: response.correlationId || null };
  return { booking: normalizeStayBooking(response.data), reconciliationRequired: false, requestId: response.requestId || null, correlationId: response.correlationId || null };
}

export async function getDuffelStayBookingCore({ bookingId = "" } = {}) {
  const booking = id(bookingId, "bok_", "stay booking");
  const response = await duffelRequest(`/stays/bookings/${encodeURIComponent(booking)}`, { retrySafe: true });
  return { booking: normalizeStayBooking(response.data || {}) };
}

export async function cancelDuffelStayBookingCore({ bookingId = "" } = {}) {
  const booking = id(bookingId, "bok_", "stay booking");
  const response = await duffelRequest(`/stays/bookings/${encodeURIComponent(booking)}/actions/cancel`, { method: "POST", timeoutMs: 130000, retrySafe: false });
  if (response.status === 202 || !response.data?.id) return { booking: response.data?.id ? normalizeStayBooking(response.data) : null, reconciliationRequired: true, providerStatus: response.status, requestId: response.requestId || null, correlationId: response.correlationId || null };
  return { booking: normalizeStayBooking(response.data) };
}

export async function searchDuffelCarsCore(input = {}) {
  const pickupDate = futureDate(input.pickupDate, "pickup date"), dropoffDate = futureDate(input.dropoffDate, "drop-off date");
  if (dropoffDate < pickupDate) throw fail("INVALID_CAR_DATES", "Drop-off must be on or after pickup.");
  const pickupTime = time(input.pickupTime || "10:00", "pickup"), dropoffTime = time(input.dropoffTime || "10:00", "drop-off");
  const pickup = groundLocation(input.pickupLocation || input, Number(input.radiusKm || 10));
  const dropoff = groundLocation(input.dropoffLocation || input.pickupLocation || input, Number(input.radiusKm || 10));
  const age = Math.max(18, Math.min(99, Number(input.driverAge || 30)));
  const residence = upper(input.residenceCountry || input.residenceCountryCode || "US", 2);
  if (!/^[A-Z]{2}$/.test(residence)) throw fail("INVALID_COUNTRY", "The driver residence country is invalid.");
  const response = await duffelRequest("/cars/search", { method: "POST", body: { data: {
    pickup_time: pickupTime, pickup_location: pickup, pickup_date: pickupDate,
    dropoff_time: dropoffTime, dropoff_location: dropoff, dropoff_date: dropoffDate,
    driver: { residence_country_code: residence, age }
  } }, retrySafe: false });
  return { searchId: response.data?.id || "", pickup, dropoff, items: arr(response.data?.rates).map(normalizeCarRate).filter(r => r.id), requestId: response.requestId || null, correlationId: response.correlationId || null };
}

export async function quoteDuffelCarCore({ rateId = "" } = {}) {
  const rate = id(rateId, "rae_", "car rate");
  const response = await duffelRequest("/cars/quotes", { method: "POST", body: { data: { rate_id: rate } }, retrySafe: false });
  return { quote: normalizeCarQuote(response.data || {}) };
}

export async function getDuffelCarQuoteCore({ quoteId = "" } = {}) {
  const quote = id(quoteId, "qut_", "car quote");
  const response = await duffelRequest(`/cars/quotes/${encodeURIComponent(quote)}`, { retrySafe: true });
  return { quote: normalizeCarQuote(response.data || {}) };
}

export async function createDuffelComponentClientKeyCore(input = {}) {
  const data = {};
  if (input.userId) data.user_id = clean(input.userId, 180);
  if (input.orderId) data.order_id = clean(input.orderId, 180);
  if (input.bookingId) data.booking_id = clean(input.bookingId, 180);
  const response = await duffelRequest("/identity/component_client_keys", { method: "POST", body: Object.keys(data).length ? { data } : {}, retrySafe: false });
  return { componentClientKey: clean(response.data?.component_client_key, 5000), component_client_key: clean(response.data?.component_client_key, 5000) };
}

function driverPayload(input = {}) {
  const d = input.driver || input;
  const out = { given_name: clean(d.givenName || d.firstName, 80), family_name: clean(d.familyName || d.lastName, 80), email: email(d.email), phone_number: phone(d.phoneNumber || d.phone), date_of_birth: calendarDate(d.dateOfBirth || d.bornOn, "driver date of birth") };
  if (!out.given_name || !out.family_name) throw fail("DRIVER_NAME_REQUIRED", "Enter the driver's full name.");
  return out;
}

export async function createDuffelCarBookingCore(input = {}) {
  const quoteId = id(input.quoteId, "qut_", "car quote");
  const latest = await getDuffelCarQuoteCore({ quoteId });
  const paymentType = lower(latest.quote?.paymentType || input.paymentType, 30);
  if (!["postpaid", "guarantee", "prepaid"].includes(paymentType)) throw fail("CAR_PAYMENT_TYPE_INVALID", "The rental supplier returned an unsupported payment type.");
  const data = { quote_id: quoteId, driver: driverPayload(input), metadata: { integration: clean(input.integration || "skandi_provider", 40), ...(input.internalReference ? { internal_reference: clean(input.internalReference, 100) } : {}) } };
  if (input.inboundFlightNumber) data.inbound_flight_number = clean(input.inboundFlightNumber, 20);
  if (input.supplierLoyaltyProgrammeAccountNumber) data.supplier_loyalty_programme_account_number = clean(input.supplierLoyaltyProgrammeAccountNumber, 80);
  if (paymentType !== "postpaid") data.payment = { method: "card", three_d_secure_session_id: id(input.threeDSecureSessionId, "3ds_", "3-D Secure session") };
  const response = await duffelRequest("/cars/bookings", { method: "POST", body: { data }, timeoutMs: 130000, retrySafe: false });
  if (response.status === 202 || !response.data?.id) return { booking: response.data?.id ? normalizeCarBooking(response.data) : null, reconciliationRequired: true, providerStatus: response.status, requestId: response.requestId || null, providerRequestId: response.requestId || null, correlationId: response.correlationId || null };
  return { booking: normalizeCarBooking(response.data), reconciliationRequired: false, requestId: response.requestId || null, correlationId: response.correlationId || null };
}

export async function getDuffelCarBookingCore({ bookingId = "" } = {}) {
  const booking = id(bookingId, "boo_", "car booking");
  const response = await duffelRequest(`/cars/bookings/${encodeURIComponent(booking)}`, { retrySafe: true });
  return { booking: normalizeCarBooking(response.data || {}) };
}

export async function cancelDuffelCarBookingCore({ bookingId = "" } = {}) {
  const booking = id(bookingId, "boo_", "car booking");
  const response = await duffelRequest(`/cars/bookings/${encodeURIComponent(booking)}/actions/cancel`, { method: "POST", timeoutMs: 130000, retrySafe: false });
  if (response.status === 202 || !response.data?.id) return { booking: response.data?.id ? normalizeCarBooking(response.data) : null, reconciliationRequired: true, providerStatus: response.status, requestId: response.requestId || null, correlationId: response.correlationId || null };
  return { booking: normalizeCarBooking(response.data) };
}
