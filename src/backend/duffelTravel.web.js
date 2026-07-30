// src/backend/duffelTravel.web.js
// Authenticated Wix web-method facade for Duffel Flights API v2.

import { Permissions, webMethod } from "wix-web-module";
import {
  ProviderError,
  duffelRequest,
  createStripePaymentIntent,
  retrieveStripePaymentIntent,
  attachDuffelOrderToPaymentIntent,
  getStripePublishableKey,
  getProviderEnvironment
} from "src/backend/duffelClient";
import { getStaffPortalSession } from "src/backend/RIA/staffPortalAuth.web";

const CABIN_CLASSES = new Set(["economy", "premium_economy", "business", "first"]);
const PASSENGER_TYPES = new Set(["adult"]);
const ORDER_TYPES = new Set(["instant", "hold"]);
const TITLES = new Set(["mr", "ms", "mrs", "miss", "dr"]);
const GENDERS = new Set(["m", "f"]);
const IDENTITY_DOCUMENT_TYPES = new Set([
  "passport",
  "tax_id",
  "known_traveler_number",
  "passenger_redress_number"
]);
const ZERO_DECIMAL_CURRENCIES = new Set([
  "BIF", "CLP", "DJF", "GNF", "JPY", "KMF", "KRW", "MGA", "PYG", "RWF", "UGX", "VND", "VUV", "XAF", "XOF", "XPF"
]);

export const getDuffelWorkspaceBootstrap = secureWebMethod(async () => {
  const [environment, ordersResponse] = await Promise.all([
    getProviderEnvironment(),
    duffelRequest("/air/orders", {
      query: { limit: 25, sort: "-created_at" }
    })
  ]);

  return {
    environment,
    defaultCurrency: "USD",
    orders: (ordersResponse.data || []).map(normalizeOrder)
  };
});

export const searchDuffelOffers = secureWebMethod(async (input) => {
  const request = validateOfferSearch(input);
  const response = await duffelRequest("/air/offer_requests", {
    method: "POST",
    query: {
      return_offers: true,
      supplier_timeout: request.supplierTimeout
    },
    body: {
      data: {
        slices: request.slices.map((slice) => ({
          origin: slice.origin,
          destination: slice.destination,
          departure_date: slice.departureDate
        })),
        passengers: request.passengers,
        cabin_class: request.cabinClass,
        max_connections: request.maxConnections
      }
    }
  });

  const offers = (response.data?.offers || [])
    .filter((offer) => !offer.partial)
    .map(normalizeOffer);

  return {
    offerRequestId: response.data?.id || null,
    offers
  };
});

export const refreshDuffelOffer = secureWebMethod(async (input) => {
  const offerId = assertResourceId(input?.offerId, "off_", "offer");
  const offer = await retrieveOffer(offerId);
  assertBookableOffer(offer);
  return { offer: normalizeOffer(offer) };
});

export const getDuffelSeatMaps = secureWebMethod(async (input) => {
  const offerId = assertResourceId(input?.offerId, "off_", "offer");
  const response = await duffelRequest("/air/seat_maps", {
    query: { offer_id: offerId }
  });
  return {
    seatMaps: (response.data || []).map(normalizeSeatMap)
  };
});

export const prepareDuffelPayment = secureWebMethod(async (input) => {
  const offerId = assertResourceId(input?.offerId, "off_", "offer");
  const services = validateServiceSelectionShape(input?.services);
  const pricedOffer = await priceOffer(offerId, services);
  const amount = amountToMinor(pricedOffer.total_amount, pricedOffer.total_currency);
  const signature = selectionSignature(services);
  const idempotencyKey = [
    "skandi",
    offerId,
    signature || "no-services",
    String(amount),
    String(pricedOffer.total_currency).toLowerCase()
  ].join("_").slice(0, 255);

  const [paymentIntent, publishableKey] = await Promise.all([
    createStripePaymentIntent({
      amount,
      currency: pricedOffer.total_currency,
      offerId,
      selectionSignature: signature,
      idempotencyKey
    }),
    getStripePublishableKey()
  ]);

  if (!paymentIntent?.id || !paymentIntent?.client_secret) {
    throw portalError("PAYMENT_SETUP_FAILED", "Secure payment could not be prepared.");
  }

  return {
    payment: {
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      publishableKey,
      amount: pricedOffer.total_amount,
      currency: pricedOffer.total_currency,
      status: paymentIntent.status
    },
    offer: normalizeOffer(pricedOffer)
  };
});

export const listDuffelOrders = secureWebMethod(async (input) => {
  const limit = clampInteger(input?.limit, 1, 200, 50);
  const response = await duffelRequest("/air/orders", {
    query: {
      limit,
      sort: "-created_at"
    }
  });
  return {
    orders: (response.data || []).map(normalizeOrder),
    page: response.meta || null
  };
});

export const getDuffelOrder = secureWebMethod(async (input) => {
  const query = cleanString(input?.orderIdOrReference, 100);
  if (!query) throw portalError("ORDER_REFERENCE_REQUIRED", "Enter a Duffel order ID or booking reference.");

  const order = await retrieveOrder(query);
  return { order: normalizeOrder(order) };
});

export const createDuffelOrder = secureWebMethod(async (input) => {
  const offerId = assertResourceId(input?.offerId, "off_", "offer");
  const orderType = cleanString(input?.orderType, 20).toLowerCase();
  if (!ORDER_TYPES.has(orderType)) throw portalError("INVALID_ORDER_TYPE", "Choose instant purchase or hold.");

  const services = validateServiceSelectionShape(input?.services);
  const pricedOffer = await priceOffer(offerId, services);
  const existingOrder = await findOrderByOfferId(offerId);
  const paymentIntentId = input?.paymentIntentId
    ? assertResourceId(input.paymentIntentId, "pi_", "payment reference")
    : null;

  if (existingOrder) {
    const existingPaymentId = existingOrder.metadata?.payment_intent_id || null;
    if ((orderType === "hold" && existingOrder.type === "hold") || (paymentIntentId && paymentIntentId === existingPaymentId)) {
      return {
        order: normalizeOrder(existingOrder),
        recoveredExistingOrder: true
      };
    }
    throw portalError(
      "OFFER_ALREADY_BOOKED",
      "This offer already has an order. Retrieve it instead of creating another booking."
    );
  }

  if (orderType === "hold") {
    if (pricedOffer.payment_requirements?.requires_instant_payment) {
      throw portalError("HOLD_NOT_AVAILABLE", "The airline requires immediate payment for this offer.");
    }
    if (services.length) {
      throw portalError("HOLD_SERVICES_NOT_AVAILABLE", "Paid seats and baggage cannot be added while creating a hold order.");
    }
    if (paymentIntentId) {
      throw portalError("PAYMENT_NOT_ALLOWED_FOR_HOLD", "Do not attach a customer payment to a hold order.");
    }
  }

  const passengers = buildOrderPassengers(input?.passengers, pricedOffer);
  const metadata = {
    integration: "skandi_duffel",
    ...(cleanString(input?.internalReference, 100)
      ? { internal_reference: cleanString(input.internalReference, 100) }
      : {})
  };

  const data = {
    type: orderType,
    selected_offers: [offerId],
    passengers,
    metadata
  };

  if (orderType === "instant") {
    if (!paymentIntentId) throw portalError("PAYMENT_REQUIRED", "Secure payment must be completed before booking.");
    await verifyPaymentIntent({
      paymentIntentId,
      offerId,
      services,
      amount: pricedOffer.total_amount,
      currency: pricedOffer.total_currency
    });

    data.services = services;
    data.payments = [{
      type: "balance",
      amount: pricedOffer.total_amount,
      currency: pricedOffer.total_currency
    }];
    data.metadata.payment_intent_id = paymentIntentId;
  }

  const response = await duffelRequest("/air/orders", {
    method: "POST",
    body: { data }
  });

  let order = response.data;
  if (!order?.id && response.status === 202) {
    order = await waitForOrderByOfferId(offerId);
  }
  if (!order?.id) {
    throw portalError(
      "ORDER_STATUS_UNKNOWN",
      "The airline order is still resolving. Do not submit another payment; retrieve the order using the selected offer."
    );
  }

  if (paymentIntentId) {
    attachDuffelOrderToPaymentIntent(paymentIntentId, order.id).catch(() => {
      // Booking must not be reported as failed because reconciliation metadata could not be attached.
    });
  }

  return {
    order: normalizeOrder(order),
    recoveredExistingOrder: false
  };
});

export const createDuffelOrderCancellation = secureWebMethod(async (input) => {
  const orderId = assertResourceId(input?.orderId, "ord_", "order");
  const order = await retrieveOrder(orderId);
  if (!(order.available_actions || []).includes("cancel")) {
    throw portalError("CANCELLATION_NOT_AVAILABLE", "The airline does not currently allow API cancellation for this order.");
  }

  const response = await duffelRequest("/air/order_cancellations", {
    method: "POST",
    body: {
      data: { order_id: orderId }
    }
  });

  return {
    cancellation: normalizeCancellation(response.data)
  };
});

export const confirmDuffelOrderCancellation = secureWebMethod(async (input) => {
  const cancellationId = assertGenericResourceId(input?.cancellationId, "cancellation");
  const response = await duffelRequest(
    `/air/order_cancellations/${encodeURIComponent(cancellationId)}/actions/confirm`,
    { method: "POST", body: { data: {} } }
  );
  const cancellation = response.data;
  const orderId = assertResourceId(cancellation?.order_id, "ord_", "order");
  const order = await retrieveOrder(orderId);

  return {
    cancellation: normalizeCancellation(cancellation),
    order: normalizeOrder(order),
    customerRefundRequired: Boolean(order.metadata?.payment_intent_id && Number(cancellation?.refund_amount || 0) > 0)
  };
});

async function retrieveOffer(offerId) {
  const response = await duffelRequest(`/air/offers/${encodeURIComponent(offerId)}`, {
    query: { return_available_services: true }
  });
  return response.data;
}

async function priceOffer(offerId, serviceSelections) {
  const latestOffer = await retrieveOffer(offerId);
  assertBookableOffer(latestOffer);
  await validateServicesAgainstLatestOffer(latestOffer, serviceSelections);

  const response = await duffelRequest(`/air/offers/${encodeURIComponent(offerId)}/actions/price`, {
    method: "POST",
    body: {
      data: {
        intended_services: serviceSelections
      }
    }
  });

  assertBookableOffer(response.data);
  return response.data;
}

async function validateServicesAgainstLatestOffer(offer, selections) {
  if (!selections.length) return;

  const available = new Map((offer.available_services || []).map((service) => [service.id, service]));
  const unknownIds = selections.filter((selection) => !available.has(selection.id)).map((selection) => selection.id);

  if (unknownIds.length) {
    const seatResponse = await duffelRequest("/air/seat_maps", {
      query: { offer_id: offer.id }
    });
    for (const seatMap of seatResponse.data || []) {
      for (const service of rawSeatServices(seatMap)) {
        available.set(service.id, service);
      }
    }
  }

  for (const selection of selections) {
    const service = available.get(selection.id);
    if (!service) {
      throw portalError("SERVICE_UNAVAILABLE", "A selected seat or baggage service is no longer available.");
    }
    const maximumQuantity = Number(service.maximum_quantity || 1);
    if (selection.quantity > maximumQuantity) {
      throw portalError("INVALID_SERVICE_QUANTITY", "A selected service quantity exceeds the airline limit.");
    }
    if (service.total_currency && service.total_currency !== offer.total_currency) {
      throw portalError("SERVICE_CURRENCY_MISMATCH", "A selected service has a different currency from the offer.");
    }
  }
}

async function verifyPaymentIntent({ paymentIntentId, offerId, services, amount, currency }) {
  const paymentIntent = await retrieveStripePaymentIntent(paymentIntentId);
  const expectedAmount = amountToMinor(amount, currency);
  const expectedSignature = selectionSignature(services);

  if (paymentIntent.status !== "succeeded") {
    throw portalError(
      "PAYMENT_NOT_COMPLETE",
      `Payment is ${cleanString(paymentIntent.status, 40) || "not complete"}. Complete or verify payment before booking.`
    );
  }
  if (String(paymentIntent.currency || "").toUpperCase() !== String(currency).toUpperCase()) {
    throw portalError("PAYMENT_CURRENCY_MISMATCH", "The completed payment currency does not match the refreshed offer.");
  }
  if (Number(paymentIntent.amount_received) !== expectedAmount) {
    throw portalError("PAYMENT_AMOUNT_MISMATCH", "The completed payment amount does not match the latest airline price.");
  }
  if (paymentIntent.metadata?.offer_id !== offerId) {
    throw portalError("PAYMENT_OFFER_MISMATCH", "The payment belongs to a different flight offer.");
  }
  if ((paymentIntent.metadata?.selection_signature || "") !== expectedSignature) {
    throw portalError("PAYMENT_SERVICE_MISMATCH", "The paid seats or baggage do not match the current selection.");
  }
}

async function retrieveOrder(orderIdOrReference) {
  if (String(orderIdOrReference).startsWith("ord_")) {
    const orderId = assertResourceId(orderIdOrReference, "ord_", "order");
    const response = await duffelRequest(`/air/orders/${encodeURIComponent(orderId)}`);
    return response.data;
  }

  const bookingReference = cleanString(orderIdOrReference, 20).toUpperCase();
  if (!/^[A-Z0-9-]{2,20}$/.test(bookingReference)) {
    throw portalError("INVALID_BOOKING_REFERENCE", "The booking reference format is invalid.");
  }

  const response = await duffelRequest("/air/orders", {
    query: {
      limit: 20,
      booking_reference: bookingReference,
      sort: "-created_at"
    }
  });
  const order = (response.data || []).find(
    (candidate) => String(candidate.booking_reference || "").toUpperCase() === bookingReference
  );
  if (!order) throw portalError("ORDER_NOT_FOUND", "No Duffel order matches that booking reference.");
  return order;
}

async function findOrderByOfferId(offerId) {
  const response = await duffelRequest("/air/orders", {
    query: {
      limit: 5,
      offer_id: offerId,
      sort: "-created_at"
    }
  });
  return response.data?.[0] || null;
}

async function waitForOrderByOfferId(offerId) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const order = await findOrderByOfferId(offerId);
    if (order) return order;
  }
  return null;
}

function validateOfferSearch(input) {
  const source = input && typeof input === "object" ? input : {};
  const slices = Array.isArray(source.slices) ? source.slices : [];
  const passengers = Array.isArray(source.passengers) ? source.passengers : [];
  if (slices.length < 1 || slices.length > 2) throw portalError("INVALID_SLICES", "Use one or two flight slices.");
  if (passengers.length < 1 || passengers.length > 9) throw portalError("INVALID_PASSENGERS", "Use between one and nine travelers.");

  const validatedSlices = slices.map((slice) => {
    const origin = assertIataCode(slice?.origin, "origin");
    const destination = assertIataCode(slice?.destination, "destination");
    if (origin === destination) throw portalError("INVALID_ROUTE", "Origin and destination must be different.");
    const departureDate = assertFutureIsoDate(slice?.departureDate, "departure date");
    return { origin, destination, departureDate };
  });
  if (validatedSlices.length === 2 && validatedSlices[1].departureDate < validatedSlices[0].departureDate) {
    throw portalError("INVALID_RETURN_DATE", "Return must be on or after departure.");
  }

  let adultCount = 0;
  const validatedPassengers = passengers.map((passenger) => {
    if (passenger?.type) {
      const type = cleanString(passenger.type, 30).toLowerCase();
      if (!PASSENGER_TYPES.has(type)) throw portalError("INVALID_PASSENGER_TYPE", "Adult travelers must use the adult type.");
      adultCount += 1;
      return { type };
    }
    const age = clampInteger(passenger?.age, 0, 17, null);
    if (age === null) throw portalError("INVALID_PASSENGER_AGE", "Traveler ages must be whole numbers from 0 to 17.");
    return { age };
  });

  const infantCount = validatedPassengers.filter((passenger) => passenger.age === 0 || passenger.age === 1).length;
  if (adultCount < 1) throw portalError("ADULT_REQUIRED", "At least one adult is required.");
  if (infantCount > adultCount) throw portalError("INFANT_ASSIGNMENT_INVALID", "Each lap infant needs a different responsible adult.");

  const cabinClass = cleanString(source.cabinClass, 30).toLowerCase();
  if (!CABIN_CLASSES.has(cabinClass)) throw portalError("INVALID_CABIN_CLASS", "Choose a supported cabin class.");

  return {
    slices: validatedSlices,
    passengers: validatedPassengers,
    cabinClass,
    maxConnections: clampInteger(source.maxConnections, 0, 2, 1),
    supplierTimeout: clampInteger(source.supplierTimeout, 2000, 20000, 15000)
  };
}

function validateServiceSelectionShape(value) {
  if (value == null) return [];
  if (!Array.isArray(value) || value.length > 36) {
    throw portalError("INVALID_SERVICES", "The selected services are invalid.");
  }

  const seen = new Set();
  return value.map((selection) => {
    const id = assertResourceId(selection?.id, "ase_", "service");
    if (seen.has(id)) throw portalError("DUPLICATE_SERVICE", "The same service cannot be selected twice.");
    seen.add(id);
    return {
      id,
      quantity: clampInteger(selection?.quantity, 1, 9, 1)
    };
  });
}

function buildOrderPassengers(value, offer) {
  if (!Array.isArray(value) || value.length !== (offer.passengers || []).length) {
    throw portalError("PASSENGER_COUNT_MISMATCH", "Traveler details do not match the refreshed offer.");
  }

  const offerPassengers = new Map((offer.passengers || []).map((passenger) => [passenger.id, passenger]));
  const seen = new Set();
  const result = value.map((passenger) => {
    const id = assertResourceId(passenger?.id, "pas_", "traveler");
    if (!offerPassengers.has(id) || seen.has(id)) {
      throw portalError("PASSENGER_ID_MISMATCH", "Traveler details do not match the refreshed offer.");
    }
    seen.add(id);

    const title = cleanString(passenger?.title, 10).toLowerCase();
    const gender = cleanString(passenger?.gender, 5).toLowerCase();
    if (!TITLES.has(title)) throw portalError("INVALID_PASSENGER_TITLE", "A traveler title is missing or invalid.");
    if (!GENDERS.has(gender)) throw portalError("INVALID_PASSENGER_GENDER", "A traveler gender is missing or invalid.");

    const givenName = assertPersonName(passenger?.givenName, "given name");
    const familyName = assertPersonName(passenger?.familyName, "family name");
    const bornOn = assertPastIsoDate(passenger?.bornOn, "date of birth");
    const email = cleanString(passenger?.email, 254).toLowerCase();
    const phoneNumber = cleanString(passenger?.phoneNumber, 20);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw portalError("INVALID_PASSENGER_EMAIL", "A traveler email address is invalid.");
    if (!/^\+[1-9]\d{7,14}$/.test(phoneNumber)) throw portalError("INVALID_PASSENGER_PHONE", "Use an E.164 traveler phone number.");

    const identityDocuments = validateIdentityDocuments(passenger?.identityDocuments);
    if (offer.passenger_identity_documents_required && !identityDocuments.length) {
      throw portalError("IDENTITY_DOCUMENT_REQUIRED", "The airline requires a passport for every traveler.");
    }

    return {
      id,
      title,
      given_name: givenName,
      family_name: familyName,
      born_on: bornOn,
      gender,
      email,
      phone_number: phoneNumber,
      ...(identityDocuments.length ? { identity_documents: identityDocuments } : {})
    };
  });

  if (seen.size !== offerPassengers.size) {
    throw portalError("PASSENGER_ID_MISMATCH", "Traveler details do not match the refreshed offer.");
  }

  const infants = (offer.passengers || []).filter(isInfantPassenger);
  const adults = (offer.passengers || []).filter(isAdultPassenger);
  if (infants.length > adults.length) {
    throw portalError("INFANT_ASSIGNMENT_INVALID", "Each lap infant needs a different responsible adult.");
  }
  infants.forEach((infant, index) => {
    const adult = result.find((passenger) => passenger.id === adults[index].id);
    if (adult) adult.infant_passenger_id = infant.id;
  });

  return result;
}

function validateIdentityDocuments(value) {
  if (value == null) return [];
  if (!Array.isArray(value) || value.length > 4) {
    throw portalError("INVALID_IDENTITY_DOCUMENT", "Traveler identity documents are invalid.");
  }
  return value.map((document) => {
    const type = cleanString(document?.type, 40).toLowerCase();
    const uniqueIdentifier = cleanString(document?.uniqueIdentifier, 50).toUpperCase();
    const issuingCountryCode = cleanString(document?.issuingCountryCode, 2).toUpperCase();
    const expiresOn = cleanString(document?.expiresOn, 10);
    if (!IDENTITY_DOCUMENT_TYPES.has(type)) throw portalError("INVALID_IDENTITY_DOCUMENT_TYPE", "The identity document type is unsupported.");
    if (!/^[A-Z0-9-]{3,50}$/.test(uniqueIdentifier)) throw portalError("INVALID_IDENTITY_DOCUMENT_NUMBER", "The identity document number is invalid.");
    if (!/^[A-Z]{2}$/.test(issuingCountryCode)) throw portalError("INVALID_ISSUING_COUNTRY", "Use a two-letter issuing country code.");
    if (!isIsoDate(expiresOn) || expiresOn <= todayIso()) throw portalError("INVALID_DOCUMENT_EXPIRY", "The identity document must expire in the future.");
    return {
      type,
      unique_identifier: uniqueIdentifier,
      issuing_country_code: issuingCountryCode,
      expires_on: expiresOn
    };
  });
}

function normalizeOffer(offer) {
  const passengers = (offer?.passengers || []).map((passenger) => ({
    id: passenger.id,
    type: passenger.type || null,
    age: Number.isInteger(passenger.age) ? passenger.age : null
  }));
  const passengerLabels = new Map(passengers.map((passenger, index) => [passenger.id, `Traveler ${index + 1}`]));

  return {
    id: offer?.id,
    liveMode: Boolean(offer?.live_mode),
    createdAt: offer?.created_at || null,
    expiresAt: offer?.expires_at || null,
    isExpired: !offer?.expires_at || new Date(offer.expires_at).getTime() <= Date.now(),
    totalAmount: offer?.total_amount,
    totalCurrency: offer?.total_currency,
    taxAmount: offer?.tax_amount || null,
    taxCurrency: offer?.tax_currency || null,
    owner: normalizeCarrier(offer?.owner),
    passengers,
    requiresInstantPayment: Boolean(offer?.payment_requirements?.requires_instant_payment),
    paymentRequiredBy: offer?.payment_requirements?.payment_required_by || null,
    priceGuaranteeExpiresAt: offer?.payment_requirements?.price_guarantee_expires_at || null,
    identityDocumentRequired: Boolean(offer?.passenger_identity_documents_required),
    supportedIdentityDocumentTypes: offer?.supported_passenger_identity_document_types || [],
    conditions: offer?.conditions || {},
    slices: (offer?.slices || []).map(normalizeSlice),
    availableServices: (offer?.available_services || []).map((service) => normalizeService(service, {
      passengerLabel: (service.passenger_ids || []).map((id) => passengerLabels.get(id) || id).join(", "),
      segmentLabel: (service.segment_ids || []).join(", ")
    }))
  };
}

function normalizeOrder(order) {
  const slices = (order?.slices || []).map(normalizeSlice);
  const route = slices.map((slice) => `${slice.origin?.iataCode || "—"}–${slice.destination?.iataCode || "—"}`).join(" / ");
  const status = order?.cancelled_at
    ? "cancelled"
    : order?.type === "hold" && order?.payment_status?.awaiting_payment
      ? "held"
      : "confirmed";

  return {
    id: order?.id,
    bookingReference: order?.booking_reference || null,
    bookingReferences: order?.booking_references || [],
    offerId: order?.offer_id || null,
    type: order?.type || null,
    status,
    route,
    createdAt: order?.created_at || null,
    cancelledAt: order?.cancelled_at || null,
    syncedAt: order?.synced_at || null,
    paymentRequiredBy: order?.payment_required_by || null,
    priceGuaranteedExpiresAt: order?.price_guaranteed_expires_at || null,
    totalAmount: order?.total_amount,
    totalCurrency: order?.total_currency,
    passengerCount: (order?.passengers || []).length,
    availableActions: order?.available_actions || [],
    slices,
    documents: (order?.documents || []).map((document) => ({
      id: document.id || null,
      type: document.type || null,
      uniqueIdentifier: document.unique_identifier || null,
      passengerIds: document.passenger_ids || []
    }))
  };
}

function normalizeSlice(slice) {
  return {
    id: slice?.id || null,
    duration: slice?.duration || null,
    origin: normalizeLocation(slice?.origin),
    destination: normalizeLocation(slice?.destination),
    fareBrandName: slice?.fare_brand_name || null,
    segments: (slice?.segments || []).map(normalizeSegment)
  };
}

function normalizeSegment(segment) {
  return {
    id: segment?.id || null,
    duration: segment?.duration || null,
    departingAt: segment?.departing_at || null,
    arrivingAt: segment?.arriving_at || null,
    origin: normalizeLocation(segment?.origin),
    destination: normalizeLocation(segment?.destination),
    originTerminal: segment?.origin_terminal || null,
    destinationTerminal: segment?.destination_terminal || null,
    marketingCarrier: normalizeCarrier(segment?.marketing_carrier),
    marketingFlightNumber: segment?.marketing_carrier_flight_number || null,
    operatingCarrier: normalizeCarrier(segment?.operating_carrier),
    operatingFlightNumber: segment?.operating_carrier_flight_number || null,
    aircraft: segment?.aircraft ? {
      id: segment.aircraft.id || null,
      iataCode: segment.aircraft.iata_code || null,
      name: segment.aircraft.name || null
    } : null
  };
}

function normalizeCarrier(carrier) {
  if (!carrier) return null;
  return {
    id: carrier.id || null,
    iataCode: carrier.iata_code || null,
    name: carrier.name || null,
    logoSymbolUrl: carrier.logo_symbol_url || null,
    logoLockupUrl: carrier.logo_lockup_url || null
  };
}

function normalizeLocation(location) {
  if (!location) return null;
  return {
    id: location.id || null,
    iataCode: location.iata_code || null,
    name: location.name || null,
    cityName: location.city_name || location.city?.name || null,
    countryCode: location.iata_country_code || null,
    timeZone: location.time_zone || null
  };
}

function normalizeService(service, labels = {}) {
  return {
    id: service?.id,
    type: service?.type || null,
    label: serviceLabel(service),
    totalAmount: service?.total_amount,
    totalCurrency: service?.total_currency,
    maximumQuantity: Number(service?.maximum_quantity || 1),
    passengerId: service?.passenger_id || service?.passenger_ids?.[0] || null,
    passengerIds: service?.passenger_ids || (service?.passenger_id ? [service.passenger_id] : []),
    passengerName: labels.passengerLabel || null,
    segmentId: service?.segment_id || service?.segment_ids?.[0] || null,
    segmentIds: service?.segment_ids || (service?.segment_id ? [service.segment_id] : []),
    segmentLabel: labels.segmentLabel || null
  };
}

function normalizeSeatMap(seatMap) {
  const seats = [];
  for (const cabin of seatMap?.cabins || []) {
    for (const row of cabin?.rows || []) {
      for (const section of row?.sections || []) {
        for (const element of section?.elements || []) {
          if (element?.type !== "seat") continue;
          seats.push({
            designator: element.designator || null,
            cabinName: cabin.cabin_class_marketing_name || cabin.cabin_class || null,
            disclosures: element.disclosures || [],
            availableServices: (element.available_services || []).map((service) => ({
              ...normalizeService({
                ...service,
                type: "seat",
                segment_id: seatMap.segment_id || service.segment_id
              }),
              label: `Seat ${element.designator || ""}`.trim()
            }))
          });
        }
      }
    }
  }

  return {
    id: seatMap?.id || null,
    sliceId: seatMap?.slice_id || null,
    segmentId: seatMap?.segment_id || null,
    seats
  };
}

function normalizeCancellation(cancellation) {
  if (!cancellation?.id) throw portalError("INVALID_CANCELLATION_RESPONSE", "Duffel did not return a valid cancellation quote.");
  return {
    id: cancellation.id,
    orderId: cancellation.order_id || null,
    refundAmount: cancellation.refund_amount || "0.00",
    refundCurrency: cancellation.refund_currency || null,
    expiresAt: cancellation.expires_at || null,
    confirmedAt: cancellation.confirmed_at || null
  };
}

function rawSeatServices(seatMap) {
  const services = [];
  for (const cabin of seatMap?.cabins || []) {
    for (const row of cabin?.rows || []) {
      for (const section of row?.sections || []) {
        for (const element of section?.elements || []) {
          for (const service of element?.available_services || []) services.push(service);
        }
      }
    }
  }
  return services;
}

function serviceLabel(service) {
  if (service?.type === "baggage") return "Additional baggage";
  if (service?.type === "seat") return "Seat selection";
  return String(service?.type || "Additional service").replace(/_/g, " ");
}

function assertBookableOffer(offer) {
  if (!offer?.id) throw portalError("OFFER_NOT_FOUND", "The selected offer could not be found.");
  if (offer.partial) throw portalError("PARTIAL_OFFER", "A partial offer cannot be booked directly.");
  if (!offer.expires_at || new Date(offer.expires_at).getTime() <= Date.now()) {
    throw portalError("OFFER_EXPIRED", "The selected offer expired. Search again for a current option.");
  }
  if (!offer.total_amount || !offer.total_currency) {
    throw portalError("INVALID_OFFER_PRICE", "The airline did not return a complete offer price.");
  }
}

function isInfantPassenger(passenger) {
  return passenger?.type === "infant_without_seat" || passenger?.age === 0 || passenger?.age === 1;
}

function isAdultPassenger(passenger) {
  return passenger?.type === "adult" || (Number.isInteger(passenger?.age) && passenger.age >= 18);
}

function selectionSignature(services) {
  return [...services]
    .sort((left, right) => left.id.localeCompare(right.id))
    .map((service) => `${service.id}:${service.quantity}`)
    .join("|");
}

function amountToMinor(amount, currency) {
  const code = cleanString(currency, 3).toUpperCase();
  if (!/^[A-Z]{3}$/.test(code)) throw portalError("INVALID_CURRENCY", "The offer currency is invalid.");
  const raw = String(amount || "").trim();
  if (!/^\d+(\.\d+)?$/.test(raw)) throw portalError("INVALID_AMOUNT", "The offer amount is invalid.");

  const decimals = ZERO_DECIMAL_CURRENCIES.has(code) ? 0 : 2;
  const [whole, fraction = ""] = raw.split(".");
  if (decimals === 0) {
    const rounded = Math.round(Number(raw));
    if (!Number.isSafeInteger(rounded)) throw portalError("INVALID_AMOUNT", "The offer amount is too large.");
    return rounded;
  }

  const normalizedFraction = `${fraction}00`.slice(0, 2);
  const minor = Number(whole) * 100 + Number(normalizedFraction);
  if (!Number.isSafeInteger(minor)) throw portalError("INVALID_AMOUNT", "The offer amount is too large.");
  return minor;
}

function secureWebMethod(handler) {
  return webMethod(Permissions.SiteMember, async (input = {}) => {
    try {
      const session = await getStaffPortalSession();
      if (!session?.loggedIn || !session?.authorized) {
        throw portalError("AUTH_REQUIRED", "An authorized SKANDI staff session is required.");
      }
      return await handler(input);
    } catch (error) {
      throw sanitizeError(error);
    }
  });
}

function sanitizeError(error) {
  const safe = new Error(
    cleanString(error?.publicMessage, 300) ||
    (error instanceof ProviderError ? "The travel provider could not complete the request." : "The reservation backend could not complete the request.")
  );
  safe.name = "ReservationError";
  safe.code = cleanErrorCode(error?.code);
  safe.publicMessage = safe.message;
  return safe;
}

function portalError(code, message) {
  const error = new Error(message);
  error.name = "ReservationError";
  error.code = code;
  error.publicMessage = message;
  return error;
}

function cleanErrorCode(value) {
  const code = cleanString(value, 60).toUpperCase();
  return /^[A-Z0-9_]+$/.test(code) ? code : "RESERVATION_ACTION_FAILED";
}

function assertResourceId(value, prefix, label) {
  const id = cleanString(value, 120);
  const pattern = new RegExp(`^${prefix}[A-Za-z0-9_]+$`);
  if (!pattern.test(id)) throw portalError("INVALID_RESOURCE_ID", `The ${label} ID is invalid.`);
  return id;
}

function assertGenericResourceId(value, label) {
  const id = cleanString(value, 120);
  if (!/^[a-z]{3,12}_[A-Za-z0-9_]+$/.test(id)) throw portalError("INVALID_RESOURCE_ID", `The ${label} ID is invalid.`);
  return id;
}

function assertIataCode(value, label) {
  const code = cleanString(value, 3).toUpperCase();
  if (!/^[A-Z]{3}$/.test(code)) throw portalError("INVALID_IATA_CODE", `The ${label} must be a three-letter IATA code.`);
  return code;
}

function assertFutureIsoDate(value, label) {
  const date = cleanString(value, 10);
  if (!isIsoDate(date) || date < todayIso()) throw portalError("INVALID_DATE", `The ${label} must be today or later.`);
  return date;
}

function assertPastIsoDate(value, label) {
  const date = cleanString(value, 10);
  if (!isIsoDate(date) || date >= todayIso()) throw portalError("INVALID_DATE", `The ${label} must be a valid past date.`);
  return date;
}

function isIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function assertPersonName(value, label) {
  const name = cleanString(value, 70);
  if (name.length < 1 || /[<>{}[\]\\]/.test(name)) throw portalError("INVALID_PASSENGER_NAME", `The traveler ${label} is invalid.`);
  return name;
}

function cleanString(value, maxLength) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function clampInteger(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < min || number > max) return fallback;
  return number;
}
