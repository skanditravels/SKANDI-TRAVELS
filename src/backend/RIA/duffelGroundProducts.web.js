import { webMethod, Permissions } from "wix-web-module";
import { currentMember } from "wix-members-backend";
import { duffelRequest, ProviderError } from "backend/duffelClient";
import { sbInsert, sbSelect, sbUpdate, eq } from "backend/supabaseClient";
import { getStaffPortalSession } from "backend/RIA/staffPortalAuth.web";


const AIRPORTS = "travel_info_airports";
const DESTINATIONS = "inventory_master_entities";
const BOOKINGS = "altea_bookings";
const COMPONENTS = "altea_booking_components";
const HISTORY = "altea_pnr_history";
const LINKS = "customer_profiles_booking_links";


const clean = (v, max = 2000) => String(v ?? "").trim().slice(0, max);
const upper = (v, max = 2000) => clean(v, max).toUpperCase();
const lower = (v, max = 2000) => clean(v, max).toLowerCase();
const money = v => Number.isFinite(Number(v)) ? Number(v) : 0;
const safeArray = v => Array.isArray(v) ? v : [];
const isUuid = v => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(clean(v));


function publicError(code, message) {
  const e = new Error(message);
  e.code = code;
  e.publicMessage = message;
  return e;
}
function isoDate(value, label = "date") {
  const v = clean(value, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) throw publicError("INVALID_DATE", `Enter a valid ${label}.`);
  const d = new Date(`${v}T00:00:00Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== v) throw publicError("INVALID_DATE", `Enter a valid ${label}.`);
  return v;
}
function futureDate(value, label) {
  const v = isoDate(value, label);
  if (v < new Date().toISOString().slice(0, 10)) throw publicError("DATE_IN_PAST", `${label} must be today or later.`);
  return v;
}
function hhmm(value, label) {
  const v = clean(value, 5);
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(v)) throw publicError("INVALID_TIME", `Enter a valid ${label} time.`);
  return v;
}
function countryCode(value) {
  const v = upper(value, 2);
  if (!/^[A-Z]{2}$/.test(v)) throw publicError("INVALID_COUNTRY", "Choose a valid two-letter residence country.");
  return v;
}
function e164(value) {
  const v = clean(value, 20);
  if (!/^\+[1-9]\d{7,14}$/.test(v)) throw publicError("INVALID_PHONE", "Enter the phone number in international format, for example +12125550123.");
  return v;
}
function email(value) {
  const v = lower(value, 254);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) throw publicError("INVALID_EMAIL", "Enter a valid email address.");
  return v;
}
function resourceId(value, prefix, label) {
  const v = clean(value, 180);
  if (!new RegExp(`^${prefix}[A-Za-z0-9_]+$`).test(v)) throw publicError("INVALID_RESOURCE_ID", `The ${label} reference is invalid.`);
  return v;
}


async function resolveLocation(input = {}) {
  const explicitLat = Number(input.latitude);
  const explicitLon = Number(input.longitude);
  if (Number.isFinite(explicitLat) && Number.isFinite(explicitLon) && Math.abs(explicitLat) <= 90 && Math.abs(explicitLon) <= 180 && (explicitLat !== 0 || explicitLon !== 0)) {
    return { latitude: explicitLat, longitude: explicitLon, label: clean(input.label || input.locationText || "Location", 160), iata: upper(input.iata, 3) };
  }


  const needleRaw = clean(input.iata || input.locationId || input.locationText || input.destination || input.destinationSlug, 180);
  if (!needleRaw) throw publicError("LOCATION_REQUIRED", "Choose a destination, airport, pickup or drop-off location.");
  const needle = lower(needleRaw, 180);
  const iataNeedle = upper(needleRaw, 3);


  const airports = await sbSelect(AIRPORTS, "select=iata,title,locationCity,country,latitude,longitude,active,published,customer_visible&limit=500").catch(() => []);
  const usableAirports = safeArray(airports).filter(r => Number.isFinite(Number(r.latitude)) && Number.isFinite(Number(r.longitude)) && (Number(r.latitude) !== 0 || Number(r.longitude) !== 0));
  let airport = usableAirports.find(r => upper(r.iata, 3) === iataNeedle);
  if (!airport) {
    airport = usableAirports.find(r => [r.locationCity, r.title, r.country, r.iata].map(v => lower(v, 200)).join(" ").includes(needle));
  }
  if (airport) {
    return { latitude: Number(airport.latitude), longitude: Number(airport.longitude), label: clean(airport.locationCity || airport.title || airport.iata, 160), iata: upper(airport.iata, 3) };
  }


  const destinations = await sbSelect(DESTINATIONS, "select=id,public_id,code,name,slug,details&entity_type=eq.DESTINATION&active=eq.true&limit=500").catch(() => []);
  let destination = safeArray(destinations).find(r => [r.code, r.slug, r.public_id, r.name].map(v => lower(v, 220)).includes(needle));
  if (!destination) destination = safeArray(destinations).find(r => [r.code, r.slug, r.public_id, r.name].map(v => lower(v, 220)).join(" ").includes(needle));
  if (destination) {
    const d = destination.details || {};
    const lat = Number(d.latitude);
    const lon = Number(d.longitude);
    if (Number.isFinite(lat) && Number.isFinite(lon) && (lat !== 0 || lon !== 0)) {
      return { latitude: lat, longitude: lon, label: clean(destination.name, 160), iata: upper(d.searchAirportIata, 3) };
    }
    const fallbackIata = upper(d.searchAirportIata, 3);
    const fallback = usableAirports.find(r => upper(r.iata, 3) === fallbackIata);
    if (fallback) return { latitude: Number(fallback.latitude), longitude: Number(fallback.longitude), label: clean(destination.name, 160), iata: fallbackIata };
  }


  throw publicError("LOCATION_NOT_FOUND", "That location is not yet mapped to coordinates in SKANDI Travel Info.");
}


function stayGuestTypes(input = {}, rooms = 1) {
  const adults = Math.max(1, Math.min(9, Number(input.adults || 1)));
  const children = Math.max(0, Math.min(8, Number(input.children || 0)));
  if (adults < rooms) throw publicError("ROOM_ADULT_MISMATCH", "Each hotel room needs at least one adult guest.");
  const ages = safeArray(input.childAges).map(Number).filter(n => Number.isFinite(n) && n >= 0 && n <= 17).slice(0, children);
  const guests = [];
  for (let i = 0; i < adults; i += 1) guests.push({ type: "adult" });
  for (let i = 0; i < children; i += 1) guests.push({ type: "child", age: ages[i] ?? 8 });
  return guests;
}


function normalizeStaySearchResult(result = {}) {
  const a = result.accommodation || {};
  const address = a.location?.address || a.address || {};
  return {
    id: result.id || "",
    staySearchResultId: result.id || "",
    accommodationId: a.id || "",
    title: a.name || "Accommodation",
    name: a.name || "Accommodation",
    description: a.description || "",
    rating: Number(a.rating || a.star_rating || 0),
    imageUrl: a.photos?.[0]?.url || a.images?.[0]?.url || "",
    address: {
      lineOne: address.line_one || "",
      city: address.city_name || address.city || "",
      postalCode: address.postal_code || "",
      countryCode: address.country_code || ""
    },
    cheapestRateTotalAmount: money(result.cheapest_rate_total_amount),
    cheapestRateTotalCurrency: upper(result.cheapest_rate_total_currency || result.cheapest_rate_currency || "USD", 3),
    total: money(result.cheapest_rate_total_amount),
    currency: upper(result.cheapest_rate_total_currency || result.cheapest_rate_currency || "USD", 3),
    supplier: "DUFFEL",
    source: "DUFFEL_STAYS"
  };
}


function ratesFromSearchResult(result = {}) {
  const out = [];
  for (const room of safeArray(result?.accommodation?.rooms)) {
    for (const rate of safeArray(room?.rates)) {
      if (!rate?.id) continue;
      out.push({
        id: rate.id,
        rateId: rate.id,
        roomName: room?.name || "Room",
        roomDescription: room?.description || "",
        roomPhotos: safeArray(room?.photos).map(p => p?.url).filter(Boolean),
        totalAmount: money(rate.total_amount),
        totalCurrency: upper(rate.total_currency || "USD", 3),
        baseAmount: money(rate.base_amount),
        taxAmount: money(rate.tax_amount),
        cancellationTimeline: safeArray(rate.cancellation_timeline),
        boardType: rate.board_type || rate.board_name || "",
        expiresAt: rate.expires_at || null,
        paymentType: rate.payment_type || null,
        conditions: safeArray(rate.conditions)
      });
    }
  }
  return out.sort((a, b) => a.totalAmount - b.totalAmount);
}


function normalizeStayBooking(b = {}) {
  const bookedRate = safeArray(b?.accommodation?.rooms).flatMap(room => safeArray(room?.rates))[0] || {};
  return {
    id: b.id || "",
    reference: b.reference || "",
    status: b.status || "",
    quoteId: b.quote_id || b?.metadata?.quote_id || "",
    checkInDate: b.check_in_date || null,
    checkOutDate: b.check_out_date || null,
    rooms: Number(b.rooms || 0),
    totalAmount: money(b.total_amount || bookedRate.total_amount),
    totalCurrency: upper(b.total_currency || bookedRate.total_currency || "USD", 3),
    paymentType: bookedRate.payment_type || b.payment_type || "",
    accommodation: b.accommodation ? {
      id: b.accommodation.id || "",
      name: b.accommodation.name || "",
      address: b.accommodation.location?.address || b.accommodation.address || null,
      phoneNumber: b.accommodation.phone_number || "",
      checkInInformation: b.accommodation.check_in_information || null
    } : null,
    guests: safeArray(b.guests).map(g => ({ givenName: g.given_name || "", familyName: g.family_name || "" })),
    cancelledAt: b.cancelled_at || null,
    confirmedAt: b.confirmed_at || null
  };
}


function normalizeCarLocation(loc = {}) {
  return {
    name: loc.name || "",
    phoneNumber: loc.phone_number || "",
    address: loc.address ? {
      lineOne: loc.address.line_one || "",
      city: loc.address.city_name || "",
      region: loc.address.region || "",
      postalCode: loc.address.postal_code || "",
      countryCode: loc.address.country_code || ""
    } : null,
    geographicCoordinates: loc.geographic_coordinates ? {
      latitude: Number(loc.geographic_coordinates.latitude),
      longitude: Number(loc.geographic_coordinates.longitude)
    } : null,
    additionalInformation: safeArray(loc.additional_information)
  };
}


function normalizeCar(car = {}) {
  return {
    name: car.name || "Vehicle",
    code: car.code || "",
    category: car.category || "",
    type: car.type || "",
    transmission: car.transmission || "",
    fuel: car.fuel || "",
    maxPassengers: Number(car.max_passengers || 0),
    airConditioning: car.air_conditioning === true,
    baggage: car.baggage || null,
    images: safeArray(car.images).map(i => i?.url).filter(Boolean)
  };
}


function normalizeCarRate(rate = {}) {
  return {
    id: rate.id || "",
    rateId: rate.id || "",
    totalAmount: money(rate.total_amount),
    totalCurrency: upper(rate.total_currency || "USD", 3),
    baseAmount: money(rate.base_amount),
    baseCurrency: upper(rate.base_currency || rate.total_currency || "USD", 3),
    paymentType: rate.payment_type || "",
    supplier: rate.supplier ? { name: rate.supplier.name || "", logoUrl: rate.supplier.logo_url || "" } : null,
    pickupLocation: normalizeCarLocation(rate.pickup_location),
    dropoffLocation: normalizeCarLocation(rate.dropoff_location),
    car: normalizeCar(rate.car),
    conditions: safeArray(rate.conditions),
    charges: safeArray(rate.charges),
    mileage: rate.mileage || null,
    source: "DUFFEL_CARS"
  };
}


function normalizeCarQuote(q = {}) {
  return {
    id: q.id || "",
    quoteId: q.id || "",
    totalAmount: money(q.total_amount),
    totalCurrency: upper(q.total_currency || "USD", 3),
    baseAmount: money(q.base_amount),
    baseCurrency: upper(q.base_currency || q.total_currency || "USD", 3),
    paymentType: q.payment_type || "",
    supplier: q.supplier ? { name: q.supplier.name || "", logoUrl: q.supplier.logo_url || "" } : null,
    pickupDate: q.pickup_date || null,
    pickupTime: q.pickup_time || "",
    dropoffDate: q.dropoff_date || null,
    dropoffTime: q.dropoff_time || "",
    pickupLocation: normalizeCarLocation(q.pickup_location),
    dropoffLocation: normalizeCarLocation(q.dropoff_location),
    car: normalizeCar(q.car),
    conditions: safeArray(q.conditions),
    charges: safeArray(q.charges),
    privacyPolicies: safeArray(q.privacy_policies),
    source: "DUFFEL_CARS"
  };
}


function normalizeCarBooking(b = {}) {
  return {
    id: b.id || "",
    reference: b.reference || "",
    status: b.status || "",
    quoteId: b.quote_id || "",
    paymentType: b.payment_type || "",
    totalAmount: money(b.total_amount),
    totalCurrency: upper(b.total_currency || "USD", 3),
    confirmedAt: b.confirmed_at || null,
    cancelledAt: b.cancelled_at || null,
    pickupDate: b.pickup_date || null,
    pickupTime: b.pickup_time || "",
    dropoffDate: b.dropoff_date || null,
    dropoffTime: b.dropoff_time || "",
    pickupLocation: normalizeCarLocation(b.pickup_location),
    dropoffLocation: normalizeCarLocation(b.dropoff_location),
    car: normalizeCar(b.car),
    supplier: b.supplier ? { name: b.supplier.name || "", logoUrl: b.supplier.logo_url || "" } : null,
    driver: b.driver ? { givenName: b.driver.given_name || "", familyName: b.driver.family_name || "", email: b.driver.email || "", phoneNumber: b.driver.phone_number || "", dateOfBirth: b.driver.date_of_birth || null } : null,
    conditions: safeArray(b.conditions),
    charges: safeArray(b.charges),
    privacyPolicies: safeArray(b.privacy_policies)
  };
}


async function requireStaff() {
  const session = await getStaffPortalSession();
  if (!session?.loggedIn || !session?.authorized) throw publicError("AUTH_REQUIRED", "An authorized SKANDI staff session is required.");
  return session;
}


async function requireMember() {
  const member = await currentMember.getMember();
  if (!member?._id) throw publicError("LOGIN_REQUIRED", "Sign in to manage or book this trip.");
  return member;
}


function driverPayload(input = {}) {
  const driver = input.driver || {};
  return {
    given_name: clean(driver.givenName || driver.firstName, 80),
    family_name: clean(driver.familyName || driver.lastName, 80),
    email: email(driver.email),
    phone_number: e164(driver.phoneNumber || driver.phone),
    date_of_birth: isoDate(driver.dateOfBirth, "driver date of birth")
  };
}


async function searchStaysInternal(input = {}) {
  const checkIn = futureDate(input.checkInDate || input.departureDate, "check-in date");
  const checkOut = futureDate(input.checkOutDate || input.returnDate, "check-out date");
  if (checkOut <= checkIn) throw publicError("INVALID_STAY_DATES", "Check-out must be after check-in.");
  const rooms = Math.max(1, Math.min(9, Number(input.rooms || 1)));
  const rawAccommodationIds = safeArray(input.accommodationIds).length
    ? safeArray(input.accommodationIds)
    : (input.accommodationId ? [input.accommodationId] : []);
  const accommodationIds = rawAccommodationIds
    .map(id => resourceId(id, "acc_", "accommodation"))
    .slice(0, 100);
  let location = null;
  const data = {
    rooms,
    mobile: false,
    guests: stayGuestTypes(input, rooms),
    free_cancellation_only: input.freeCancellationOnly === true,
    check_in_date: checkIn,
    check_out_date: checkOut
  };
  if (accommodationIds.length) {
    data.accommodation = { ids: accommodationIds, fetch_rates: input.fetchRates !== false };
  } else {
    location = await resolveLocation(input.location || input);
    data.location = {
      radius: Math.max(1, Math.min(50, Number(input.radiusKm || 25))),
      geographic_coordinates: { longitude: location.longitude, latitude: location.latitude }
    };
  }
  if (input.instantPayment === true || input.instantPayment === false) data.instant_payment = input.instantPayment;
  const response = await duffelRequest("/stays/search", { method: "POST", body: { data } });
  return { location, searchId: response?.data?.id || "", items: safeArray(response?.data?.results).map(normalizeStaySearchResult).filter(i => i.id) };
}


export const searchDuffelStays = webMethod(Permissions.Anyone, async input => searchStaysInternal(input || {}));


export const fetchDuffelStayRates = webMethod(Permissions.Anyone, async ({ searchResultId = "" } = {}) => {
  const id = resourceId(searchResultId, "srr_", "stay search result");
  const response = await duffelRequest(`/stays/search_results/${encodeURIComponent(id)}/actions/fetch_all_rates`, { method: "POST" });
  return { searchResultId: id, accommodation: normalizeStaySearchResult(response?.data || {}), rates: ratesFromSearchResult(response?.data || {}) };
});


export const quoteDuffelStay = webMethod(Permissions.Anyone, async ({ rateId = "" } = {}) => {
  const id = resourceId(rateId, "rat_", "stay rate");
  const response = await duffelRequest("/stays/quotes", { method: "POST", body: { data: { rate_id: id } } });
  const q = response?.data || {};
  const quoteRates = safeArray(q.rooms).flatMap(room => safeArray(room?.rates));
  const selectedRate = quoteRates[0] || {};
  return { quote: {
    id: q.id || "",
    quoteId: q.id || "",
    totalAmount: money(q.total_amount),
    totalCurrency: upper(q.total_currency || "USD", 3),
    taxAmount: money(q.tax_amount),
    taxCurrency: upper(q.tax_currency || q.total_currency || "USD", 3),
    expiresAt: q.expires_at || null,
    accommodation: q.accommodation ? { id: q.accommodation.id || "", name: q.accommodation.name || "" } : null,
    rooms: safeArray(q.rooms),
    paymentType: selectedRate.payment_type || "",
    availablePaymentMethods: safeArray(selectedRate.available_payment_methods),
    dueAtAccommodationAmount: money(selectedRate.due_at_accommodation_amount),
    dueAtAccommodationCurrency: upper(selectedRate.due_at_accommodation_currency || q.total_currency || "USD", 3),
    cancellationTimeline: safeArray(selectedRate.cancellation_timeline),
    conditions: safeArray(selectedRate.conditions),
    supportedLoyaltyProgramme: q.supported_loyalty_programme || null
  } };
});


export const searchDuffelCars = webMethod(Permissions.Anyone, async (input = {}) => {
  const pickupDate = futureDate(input.pickupDate, "pickup date");
  const dropoffDate = futureDate(input.dropoffDate, "drop-off date");
  if (dropoffDate < pickupDate) throw publicError("INVALID_CAR_DATES", "Drop-off must be on or after pickup.");
  const pickupTime = hhmm(input.pickupTime || "10:00", "pickup");
  const dropoffTime = hhmm(input.dropoffTime || "10:00", "drop-off");
  const age = Math.max(18, Math.min(99, Number(input.driverAge || 30)));
  const residence = countryCode(input.residenceCountry || input.residenceCountryCode || "US");
  const pickup = await resolveLocation({ ...(input.pickupLocation || {}), locationId: input.pickupLocationId, locationText: input.pickupLocationText, iata: input.pickupIata });
  const dropoff = input.sameLocation === false ? await resolveLocation({ ...(input.dropoffLocation || {}), locationId: input.dropoffLocationId, locationText: input.dropoffLocationText, iata: input.dropoffIata }) : pickup;
  const response = await duffelRequest("/cars/search", { method: "POST", body: { data: {
    pickup_time: pickupTime,
    pickup_location: { radius: Math.max(1, Math.min(50, Number(input.radiusKm || 10))), geographic_coordinates: { longitude: pickup.longitude, latitude: pickup.latitude } },
    pickup_date: pickupDate,
    dropoff_time: dropoffTime,
    dropoff_location: { radius: Math.max(1, Math.min(50, Number(input.radiusKm || 10))), geographic_coordinates: { longitude: dropoff.longitude, latitude: dropoff.latitude } },
    dropoff_date: dropoffDate,
    driver: { residence_country_code: residence, age }
  }}});
  return { searchId: response?.data?.id || "", pickup, dropoff, items: safeArray(response?.data?.rates).map(normalizeCarRate).filter(r => r.id) };
});


export const quoteDuffelCar = webMethod(Permissions.Anyone, async ({ rateId = "" } = {}) => {
  const id = resourceId(rateId, "rae_", "car rate");
  const response = await duffelRequest("/cars/quotes", { method: "POST", body: { data: { rate_id: id } } });
  return { quote: normalizeCarQuote(response?.data || {}) };
});


export const createDuffelComponentClientKey = webMethod(Permissions.SiteMember, async () => {
  await requireMember();
  const response = await duffelRequest("/identity/component_client_keys", { method: "POST", body: {} });
  return { componentClientKey: clean(response?.data?.component_client_key, 5000) };
});


async function createCarBookingInternal(input = {}, member = null) {
  const quoteId = resourceId(input.quoteId, "qut_", "car quote");
  const latestQuote = (await duffelRequest(`/cars/quotes/${encodeURIComponent(quoteId)}`).catch(() => null))?.data || null;
  const paymentType = lower(latestQuote?.payment_type || input.paymentType, 30);
  const privacyPolicies = safeArray(latestQuote?.privacy_policies);
  if (privacyPolicies.length && input.privacyPoliciesAccepted !== true) {
    throw publicError(
      "CAR_PRIVACY_ACCEPTANCE_REQUIRED",
      "The customer must independently accept the rental privacy policy disclosures before the car can be booked."
    );
  }
  const privacyAcceptedAt = privacyPolicies.length ? new Date().toISOString() : "";
  const data = {
    quote_id: quoteId,
    driver: driverPayload(input),
    metadata: {
      integration: member ? "skandi_customer" : "skandi_staff",
      ...(privacyPolicies.length ? {
        privacy_policies_accepted: "true",
        privacy_policies_accepted_at: privacyAcceptedAt,
        privacy_policy_count: String(privacyPolicies.length)
      } : {}),
      ...(input.alteaBookingId ? { altea_booking_id: clean(input.alteaBookingId, 36) } : {})
    }
  };
  if (input.inboundFlightNumber) data.inbound_flight_number = clean(input.inboundFlightNumber, 20);
  if (input.supplierLoyaltyProgrammeAccountNumber) data.supplier_loyalty_programme_account_number = clean(input.supplierLoyaltyProgrammeAccountNumber, 80);
  if (paymentType && paymentType !== "postpaid") {
    const sessionId = resourceId(input.threeDSecureSessionId, "3ds_", "3-D Secure session");
    data.payment = { method: "card", three_d_secure_session_id: sessionId };
  }
  const response = await duffelRequest("/cars/bookings", { method: "POST", body: { data } });
  return normalizeCarBooking(response?.data || {});
}


async function createStandaloneCustomerCarAltea(member, carBooking, input = {}) {
  const ref = `SKCAR-${Date.now().toString(36).toUpperCase()}`;
  const driver = input.driver || {};
  const rows = await sbInsert(BOOKINGS, {
    booking_reference: ref,
    pnr_locator: carBooking.reference || null,
    booking_type: "CONFIRMED",
    product_type: "CAR_RENTAL_ONLY",
    customer_member_id: member._id,
    customer_email: lower(driver.email || member.loginEmail || "", 254) || null,
    customer_name: clean(`${driver.givenName || driver.firstName || ""} ${driver.familyName || driver.lastName || ""}`, 180) || null,
    status: "confirmed",
    payment_status: carBooking.paymentType === "postpaid" ? "pay_at_supplier" : "supplier_card_confirmed",
    fulfillment_status: "confirmed",
    origin: clean(carBooking.pickupLocation?.name, 120) || null,
    destination: clean(carBooking.dropoffLocation?.name, 120) || null,
    departure_date: carBooking.pickupDate,
    return_date: carBooking.dropoffDate,
    currency: carBooking.totalCurrency,
    total_amount: carBooking.totalAmount,
    tax_amount: 0,
    source_page: "car-rental",
    source_channel: "customer",
    supplier: "DUFFEL",
    supplier_order_id: carBooking.id,
    supplier_booking_reference: carBooking.reference || null,
    ticketing_status: "not_applicable",
    payload: { provider: "DUFFEL", carBooking: { id: carBooking.id, reference: carBooking.reference, paymentType: carBooking.paymentType } }
  });
  const booking = safeArray(rows)[0];
  if (!booking?.id) throw publicError("ALTEA_SYNC_FAILED", "The car was booked but the SKANDI trip file could not be created. Contact SKANDI with the supplier reference before retrying.");
  await sbInsert(COMPONENTS, {
    booking_id: booking.id,
    component_type: "CAR_RENTAL",
    supplier: "DUFFEL",
    supplier_reference: carBooking.id,
    title: [carBooking.car?.name, carBooking.supplier?.name].filter(Boolean).join(" · ") || "Car Rental",
    status: upper(carBooking.status || "CONFIRMED", 30),
    quantity: 1,
    currency: carBooking.totalCurrency,
    unit_amount: carBooking.totalAmount,
    total_amount: carBooking.totalAmount,
    payload: { reference: carBooking.reference, quoteId: carBooking.quoteId, paymentType: carBooking.paymentType, pickupDate: carBooking.pickupDate, dropoffDate: carBooking.dropoffDate, pickupLocation: carBooking.pickupLocation, dropoffLocation: carBooking.dropoffLocation, car: carBooking.car }
  });
  await sbInsert(LINKS, { member_id: member._id, booking_reference: ref, last_name: clean(input.driver?.familyName || input.driver?.lastName, 100) || null, status: "Linked", linked_at: new Date().toISOString(), booking_id: booking.id, payload: {} }).catch(() => null);
  await sbInsert(HISTORY, { booking_id: booking.id, pnr_locator: carBooking.reference || null, event_type: "DUFFEL_CAR_BOOKING_CREATED", payload: { supplierBookingId: carBooking.id }, supplier: "DUFFEL" });
  return booking;
}


export const createCustomerDuffelCarBooking = webMethod(Permissions.SiteMember, async (input = {}) => {
  const member = await requireMember();
  const booking = await createCarBookingInternal(input, member);
  let alteaBookingId = clean(input.alteaBookingId, 36);
  if (alteaBookingId && isUuid(alteaBookingId)) {
    const owned = await sbSelect(BOOKINGS, `select=id,customer_member_id&${eq("id", alteaBookingId)}&limit=1`);
    if (!owned?.[0] || clean(owned[0].customer_member_id, 100) !== member._id) throw publicError("BOOKING_ACCESS_DENIED", "That booking does not belong to this account.");
    await syncGroundComponent(alteaBookingId, "CAR_RENTAL", booking, "DUFFEL_CAR_BOOKING_CREATED");
  } else {
    const row = await createStandaloneCustomerCarAltea(member, booking, input);
    alteaBookingId = row.id;
  }
  return { ok: true, booking, alteaBookingId };
});


export const getCustomerDuffelCarBooking = webMethod(Permissions.SiteMember, async ({ bookingId = "", alteaBookingId = "" } = {}) => {
  const member = await requireMember();
  if (!isUuid(alteaBookingId)) throw publicError("BOOKING_REQUIRED", "Choose the SKANDI trip containing this car rental.");
  const owned = await sbSelect(BOOKINGS, `select=id,customer_member_id&${eq("id", alteaBookingId)}&limit=1`);
  if (!owned?.[0] || clean(owned[0].customer_member_id, 100) !== member._id) throw publicError("BOOKING_ACCESS_DENIED", "That booking does not belong to this account.");
  const supplierId = resourceId(bookingId, "boo_", "car booking");
  const linked = await sbSelect(COMPONENTS, `select=id&${eq("booking_id", alteaBookingId)}&${eq("supplier", "DUFFEL")}&${eq("supplier_reference", supplierId)}&limit=1`);
  if (!linked?.[0]) throw publicError("BOOKING_ACCESS_DENIED", "That car rental is not attached to this SKANDI trip.");
  const response = await duffelRequest(`/cars/bookings/${encodeURIComponent(supplierId)}`);
  return { booking: normalizeCarBooking(response?.data || {}) };
});


export const cancelCustomerDuffelCarBooking = webMethod(Permissions.SiteMember, async ({ bookingId = "", alteaBookingId = "" } = {}) => {
  const member = await requireMember();
  if (!isUuid(alteaBookingId)) throw publicError("BOOKING_REQUIRED", "Choose the SKANDI trip containing this car rental.");
  const owned = await sbSelect(BOOKINGS, `select=id,customer_member_id&${eq("id", alteaBookingId)}&limit=1`);
  if (!owned?.[0] || clean(owned[0].customer_member_id, 100) !== member._id) throw publicError("BOOKING_ACCESS_DENIED", "That booking does not belong to this account.");
  const supplierId = resourceId(bookingId, "boo_", "car booking");
  const response = await duffelRequest(`/cars/bookings/${encodeURIComponent(supplierId)}/actions/cancel`, { method: "POST" });
  const booking = normalizeCarBooking(response?.data || {});
  await syncGroundComponent(alteaBookingId, "CAR_RENTAL", booking, "DUFFEL_CAR_BOOKING_CANCELLED");
  return { ok: true, booking };
});


async function syncGroundComponent(alteaBookingId, type, providerBooking, eventType) {
  if (!isUuid(alteaBookingId)) throw publicError("INVALID_BOOKING_ID", "The ALTEA booking reference is invalid.");
  const supplierRef = clean(providerBooking.id, 180);
  const existing = await sbSelect(COMPONENTS, `select=id&${eq("booking_id", alteaBookingId)}&${eq("supplier", "DUFFEL")}&${eq("supplier_reference", supplierRef)}&limit=1`).catch(() => []);
  const title = type === "HOTEL"
    ? clean(providerBooking.accommodation?.name || "Hotel", 220)
    : clean([providerBooking.car?.name, providerBooking.supplier?.name].filter(Boolean).join(" · ") || "Car Rental", 220);
  const row = {
    booking_id: alteaBookingId,
    component_type: type,
    supplier: "DUFFEL",
    supplier_reference: supplierRef,
    title,
    status: upper(providerBooking.status || "CONFIRMED", 30),
    quantity: 1,
    currency: upper(providerBooking.totalCurrency || "USD", 3),
    unit_amount: money(providerBooking.totalAmount),
    total_amount: money(providerBooking.totalAmount),
    payload: type === "HOTEL"
      ? { reference: providerBooking.reference, checkInDate: providerBooking.checkInDate, checkOutDate: providerBooking.checkOutDate, accommodation: providerBooking.accommodation }
      : { reference: providerBooking.reference, quoteId: providerBooking.quoteId, paymentType: providerBooking.paymentType, pickupDate: providerBooking.pickupDate, dropoffDate: providerBooking.dropoffDate, pickupLocation: providerBooking.pickupLocation, dropoffLocation: providerBooking.dropoffLocation, car: providerBooking.car }
  };
  if (existing?.[0]?.id) await sbUpdate(COMPONENTS, existing[0].id, row);
  else await sbInsert(COMPONENTS, row);
  await sbInsert(HISTORY, { booking_id: alteaBookingId, event_type: eventType, supplier: "DUFFEL", payload: { supplierReference: supplierRef } });
  return true;
}




function stayGuestsForBooking(input = {}) {
  const guests = safeArray(input.guests).map(g => ({
    given_name: clean(g.givenName || g.firstName, 80),
    family_name: clean(g.familyName || g.lastName, 80)
  })).filter(g => g.given_name && g.family_name);
  if (!guests.length) throw publicError("GUEST_REQUIRED", "Add at least one hotel guest.");
  return guests;
}


async function createStayBookingInternal(input = {}, member = null) {
  const quoteId = resourceId(input.quoteId, "quo_", "stay quote");
  const data = {
    quote_id: quoteId,
    guests: stayGuestsForBooking(input),
    email: email(input.email || member?.loginEmail),
    phone_number: e164(input.phoneNumber || input.phone),
    metadata: {
      integration: member ? "skandi_customer" : "skandi_staff",
      quote_id: quoteId,
      ...(input.alteaBookingId ? { altea_booking_id: clean(input.alteaBookingId, 36) } : {})
    }
  };
  if (input.specialRequests) data.accommodation_special_requests = clean(input.specialRequests, 500);
  if (input.loyaltyProgrammeAccountNumber) data.loyalty_programme_account_number = clean(input.loyaltyProgrammeAccountNumber, 80);
  if (input.threeDSecureSessionId) {
    data.payment = { three_d_secure_session_id: resourceId(input.threeDSecureSessionId, "3ds_", "3-D Secure session") };
  }
  const response = await duffelRequest("/stays/bookings", { method: "POST", body: { data } });
  if (!response?.data?.id && response?.status === 202) {
    throw publicError(
      "BOOKING_PENDING_CONFIRMATION",
      "The hotel booking is still being confirmed by the accommodation. Do not submit another payment. SKANDI will reconcile it using the Duffel request reference."
    );
  }
  return normalizeStayBooking(response?.data || {});
}


async function createStandaloneCustomerStayAltea(member, stayBooking, input = {}) {
  const ref = `SKHOT-${Date.now().toString(36).toUpperCase()}`;
  const firstGuest = safeArray(input.guests)[0] || {};
  const rows = await sbInsert(BOOKINGS, {
    booking_reference: ref,
    pnr_locator: stayBooking.reference || null,
    booking_type: "CONFIRMED",
    product_type: "HOTEL_ONLY",
    customer_member_id: member._id,
    customer_email: lower(input.email || member.loginEmail || "", 254) || null,
    customer_name: clean(`${firstGuest.givenName || firstGuest.firstName || ""} ${firstGuest.familyName || firstGuest.lastName || ""}`, 180) || null,
    status: "confirmed",
    payment_status: input.threeDSecureSessionId ? "supplier_card_confirmed" : "paid_from_duffel_balance",
    fulfillment_status: "confirmed",
    origin: clean(stayBooking.accommodation?.name, 120) || null,
    destination: clean(stayBooking.accommodation?.name, 120) || null,
    departure_date: stayBooking.checkInDate,
    return_date: stayBooking.checkOutDate,
    currency: stayBooking.totalCurrency,
    total_amount: stayBooking.totalAmount,
    tax_amount: 0,
    source_page: "hotels",
    source_channel: "customer",
    supplier: "DUFFEL",
    supplier_order_id: stayBooking.id,
    supplier_booking_reference: stayBooking.reference || null,
    supplier_offer_id: clean(input.quoteId, 180) || null,
    ticketing_status: "not_applicable",
    payload: { provider: "DUFFEL", stayBooking: { id: stayBooking.id, reference: stayBooking.reference, quoteId: input.quoteId || "" } }
  });
  const booking = safeArray(rows)[0];
  if (!booking?.id) throw publicError("ALTEA_SYNC_FAILED", "The hotel was booked but the SKANDI trip file could not be created. Contact SKANDI with the hotel reference before retrying.");
  await syncGroundComponent(booking.id, "HOTEL", stayBooking, "DUFFEL_STAY_BOOKING_CREATED");
  await sbInsert(LINKS, {
    member_id: member._id,
    booking_reference: ref,
    last_name: clean(firstGuest.familyName || firstGuest.lastName, 100) || null,
    status: "Linked",
    linked_at: new Date().toISOString(),
    booking_id: booking.id,
    payload: {}
  }).catch(() => null);
  return booking;
}


export const createCustomerDuffelStayBooking = webMethod(Permissions.SiteMember, async (input = {}) => {
  const member = await requireMember();
  const booking = await createStayBookingInternal(input, member);
  let alteaBookingId = clean(input.alteaBookingId, 36);
  if (alteaBookingId && isUuid(alteaBookingId)) {
    const owned = await sbSelect(BOOKINGS, `select=id,customer_member_id&${eq("id", alteaBookingId)}&limit=1`);
    if (!owned?.[0] || clean(owned[0].customer_member_id, 100) !== member._id) throw publicError("BOOKING_ACCESS_DENIED", "That booking does not belong to this account.");
    await syncGroundComponent(alteaBookingId, "HOTEL", booking, "DUFFEL_STAY_BOOKING_CREATED");
  } else {
    const row = await createStandaloneCustomerStayAltea(member, booking, input);
    alteaBookingId = row.id;
  }
  return { ok: true, booking, alteaBookingId };
});


export const getCustomerDuffelStayBooking = webMethod(Permissions.SiteMember, async ({ bookingId = "", alteaBookingId = "" } = {}) => {
  const member = await requireMember();
  if (!isUuid(alteaBookingId)) throw publicError("BOOKING_REQUIRED", "Choose the SKANDI trip containing this hotel.");
  const owned = await sbSelect(BOOKINGS, `select=id,customer_member_id&${eq("id", alteaBookingId)}&limit=1`);
  if (!owned?.[0] || clean(owned[0].customer_member_id, 100) !== member._id) throw publicError("BOOKING_ACCESS_DENIED", "That booking does not belong to this account.");
  const supplierId = resourceId(bookingId, "bok_", "stay booking");
  const linked = await sbSelect(COMPONENTS, `select=id&${eq("booking_id", alteaBookingId)}&${eq("supplier", "DUFFEL")}&${eq("supplier_reference", supplierId)}&limit=1`);
  if (!linked?.[0]) throw publicError("BOOKING_ACCESS_DENIED", "That hotel booking is not attached to this SKANDI trip.");
  const response = await duffelRequest(`/stays/bookings/${encodeURIComponent(supplierId)}`);
  return { booking: normalizeStayBooking(response?.data || {}) };
});


export const cancelCustomerDuffelStayBooking = webMethod(Permissions.SiteMember, async ({ bookingId = "", alteaBookingId = "" } = {}) => {
  const member = await requireMember();
  if (!isUuid(alteaBookingId)) throw publicError("BOOKING_REQUIRED", "Choose the SKANDI trip containing this hotel.");
  const owned = await sbSelect(BOOKINGS, `select=id,customer_member_id&${eq("id", alteaBookingId)}&limit=1`);
  if (!owned?.[0] || clean(owned[0].customer_member_id, 100) !== member._id) throw publicError("BOOKING_ACCESS_DENIED", "That booking does not belong to this account.");
  const supplierId = resourceId(bookingId, "bok_", "stay booking");
  const linked = await sbSelect(COMPONENTS, `select=id&${eq("booking_id", alteaBookingId)}&${eq("supplier", "DUFFEL")}&${eq("supplier_reference", supplierId)}&limit=1`);
  if (!linked?.[0]) throw publicError("BOOKING_ACCESS_DENIED", "That hotel booking is not attached to this SKANDI trip.");
  const response = await duffelRequest(`/stays/bookings/${encodeURIComponent(supplierId)}/actions/cancel`, { method: "POST" });
  const booking = normalizeStayBooking(response?.data || {});
  await syncGroundComponent(alteaBookingId, "HOTEL", booking, "DUFFEL_STAY_BOOKING_CANCELLED");
  return { ok: true, booking };
});




export const createDuffelComponentClientKeyStaff = webMethod(Permissions.SiteMember, async () => {
  await requireStaff();
  const response = await duffelRequest("/identity/component_client_keys", { method: "POST", body: {} });
  return { componentClientKey: clean(response?.data?.component_client_key, 5000) };
});


export const createDuffelStayBookingStaff = webMethod(Permissions.SiteMember, async (input = {}) => {
  await requireStaff();
  const booking = await createStayBookingInternal(input, null);
  if (isUuid(input.alteaBookingId)) await syncGroundComponent(input.alteaBookingId, "HOTEL", booking, "DUFFEL_STAY_BOOKING_CREATED");
  return { booking };
});
export const getDuffelStayBookingStaff = webMethod(Permissions.SiteMember, async ({ bookingId = "" } = {}) => {
  await requireStaff();
  const id = resourceId(bookingId, "bok_", "stay booking");
  const response = await duffelRequest(`/stays/bookings/${encodeURIComponent(id)}`);
  return { booking: normalizeStayBooking(response?.data || {}) };
});


export const cancelDuffelStayBookingStaff = webMethod(Permissions.SiteMember, async ({ bookingId = "", alteaBookingId = "" } = {}) => {
  await requireStaff();
  const id = resourceId(bookingId, "bok_", "stay booking");
  const response = await duffelRequest(`/stays/bookings/${encodeURIComponent(id)}/actions/cancel`, { method: "POST" });
  const booking = normalizeStayBooking(response?.data || {});
  if (isUuid(alteaBookingId)) await syncGroundComponent(alteaBookingId, "HOTEL", booking, "DUFFEL_STAY_BOOKING_CANCELLED");
  return { booking };
});


export const getDuffelCarBookingStaff = webMethod(Permissions.SiteMember, async ({ bookingId = "" } = {}) => {
  await requireStaff();
  const id = resourceId(bookingId, "boo_", "car booking");
  const response = await duffelRequest(`/cars/bookings/${encodeURIComponent(id)}`);
  return { booking: normalizeCarBooking(response?.data || {}) };
});


export const createDuffelCarBookingStaff = webMethod(Permissions.SiteMember, async (input = {}) => {
  await requireStaff();
  const booking = await createCarBookingInternal(input, null);
  if (isUuid(input.alteaBookingId)) await syncGroundComponent(input.alteaBookingId, "CAR_RENTAL", booking, "DUFFEL_CAR_BOOKING_CREATED");
  return { booking };
});


export const cancelDuffelCarBookingStaff = webMethod(Permissions.SiteMember, async ({ bookingId = "", alteaBookingId = "" } = {}) => {
  await requireStaff();
  const id = resourceId(bookingId, "boo_", "car booking");
  const response = await duffelRequest(`/cars/bookings/${encodeURIComponent(id)}/actions/cancel`, { method: "POST" });
  const booking = normalizeCarBooking(response?.data || {});
  if (isUuid(alteaBookingId)) await syncGroundComponent(alteaBookingId, "CAR_RENTAL", booking, "DUFFEL_CAR_BOOKING_CANCELLED");
  return { booking };
});


export const syncDuffelStayBookingToAltea = webMethod(Permissions.SiteMember, async ({ alteaBookingId = "", stayBooking = null, bookingId = "" } = {}) => {
  await requireStaff();
  let b = stayBooking;
  if (!b && bookingId) b = normalizeStayBooking((await duffelRequest(`/stays/bookings/${encodeURIComponent(resourceId(bookingId, "bok_", "stay booking"))}`)).data || {});
  if (!b?.id) throw publicError("STAY_BOOKING_REQUIRED", "A Duffel stay booking is required.");
  await syncGroundComponent(alteaBookingId, "HOTEL", b, "DUFFEL_STAY_BOOKING_SYNCED");
  return { ok: true };
});


export const syncDuffelCarBookingToAltea = webMethod(Permissions.SiteMember, async ({ alteaBookingId = "", carBooking = null, bookingId = "" } = {}) => {
  await requireStaff();
  let b = carBooking;
  if (!b && bookingId) b = normalizeCarBooking((await duffelRequest(`/cars/bookings/${encodeURIComponent(resourceId(bookingId, "boo_", "car booking"))}`)).data || {});
  if (!b?.id) throw publicError("CAR_BOOKING_REQUIRED", "A Duffel car booking is required.");
  await syncGroundComponent(alteaBookingId, "CAR_RENTAL", b, "DUFFEL_CAR_BOOKING_SYNCED");
  return { ok: true };
});


export function sanitizeGroundProviderError(error) {
  if (error instanceof ProviderError) return publicError(error.code || "DUFFEL_ERROR", error.publicMessage || "Duffel could not complete the request.");
  return error;
}
