// SKANDI customer booking orchestrator
// Canonical customer booking provider is backend-only; public payloads use SKANDI labels.
// Public web methods never expose provider credentials.

import { webMethod, Permissions } from "wix-web-module";
import { randomUUID } from "crypto";
import {
  travelProviderRequest,
  prepareSecurePaymentIntent,
  retrieveSecurePaymentIntent,
  attachAirOrderToPaymentIntent,
  getSecurePaymentPublishableKey,
  getTravelProviderEnvironment
} from "./liveTravelProvider.js";
import { restRequest } from "./RIA/supabaseServer.js";
import {
  loadBookingCart,
  requireBookingCartAccess
} from "./bookingCart.repository.js";

const MAX_TRAVELERS = 9;
const MAX_RESULTS = 30;
const ZERO_DECIMAL_CURRENCIES = new Set([
  "BIF", "CLP", "DJF", "GNF", "JPY", "KMF", "KRW", "MGA", "PYG",
  "RWF", "UGX", "VND", "VUV", "XAF", "XOF", "XPF"
]);

function text(value, max = 500) {
  return String(value ?? "").trim().slice(0, max);
}

function money(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function roundMoney(value) {
  return Math.round((money(value) + Number.EPSILON) * 100) / 100;
}

function cleanCurrency(value, fallback = "USD") {
  const currency = text(value, 3).toUpperCase();
  return /^[A-Z]{3}$/.test(currency) ? currency : fallback;
}

function isoDate(value) {
  const v = text(value, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : "";
}

function futureDate(value, label) {
  const v = isoDate(value);
  if (!v) throw new Error(`BOOKING_${label}_DATE_REQUIRED`);
  const start = Date.parse(`${v}T00:00:00Z`);
  const today = new Date();
  const floorToday = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  if (!Number.isFinite(start) || start < floorToday) {
    throw new Error(`BOOKING_${label}_DATE_INVALID`);
  }
  return v;
}

function cartCode() {
  return `SKC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function cartAccessToken() {
  return `${randomUUID()}${randomUUID()}`.replace(/-/g, "");
}

function amountToMinor(amount, currency) {
  const numeric = Number(amount);
  if (!Number.isFinite(numeric) || numeric < 0) {
    throw new Error("BOOKING_PAYMENT_AMOUNT_INVALID");
  }
  const upper = cleanCurrency(currency);
  return ZERO_DECIMAL_CURRENCIES.has(upper)
    ? Math.round(numeric)
    : Math.round(numeric * 100);
}

function providerAmountString(amount, currency) {
  const numeric = money(amount);
  const upper = cleanCurrency(currency);
  return ZERO_DECIMAL_CURRENCIES.has(upper)
    ? String(Math.round(numeric))
    : roundMoney(numeric).toFixed(2);
}

function cabinClass(value) {
  const raw = text(value || "economy", 30).toLowerCase().replace(/\s+/g, "_");
  if (["economy", "premium_economy", "business", "first"].includes(raw)) return raw;
  return "economy";
}

function normalizeSearch(input = {}) {
  const source = input && typeof input === "object" ? input : {};
  const tripType = text(source.tripType || "flightOnly", 40);
  const adults = Math.max(1, Math.min(MAX_TRAVELERS, Number(source.adults) || 1));
  const children = Math.max(0, Math.min(MAX_TRAVELERS - adults, Number(source.children) || 0));
  const infants = Math.max(0, Math.min(adults, Math.min(MAX_TRAVELERS - adults - children, Number(source.infants) || 0)));
  const childAges = Array.isArray(source.childAges) ? source.childAges : [];
  const infantAges = Array.isArray(source.infantAges) ? source.infantAges : [];

  return {
    ...source,
    tripType,
    origin: text(source.origin, 3).toUpperCase(),
    destination: text(source.destination, 100),
    destinationRegion: text(source.destinationRegion, 160),
    departureDate: isoDate(source.departureDate),
    returnDate: isoDate(source.returnDate),
    adults,
    children,
    infants,
    childAges,
    infantAges,
    rooms: Math.max(1, Math.min(4, Number(source.rooms) || 1)),
    travelClass: cabinClass(source.travelClass || source.cabinClass),
    nonStop: source.nonStop === true,
    currency: cleanCurrency(source.currency || "USD"),
    language: text(source.language || source.locale || "EN", 12).toUpperCase()
  };
}

function flightPassengers(search) {
  const output = [];
  for (let i = 0; i < search.adults; i += 1) output.push({ type: "adult" });
  for (let i = 0; i < search.children; i += 1) {
    const age = Math.max(2, Math.min(17, Number(search.childAges[i]) || 8));
    output.push({ age });
  }
  for (let i = 0; i < search.infants; i += 1) {
    const age = Math.max(0, Math.min(1, Number(search.infantAges[i]) || 0));
    output.push({ age });
  }
  if (output.length > MAX_TRAVELERS) throw new Error("BOOKING_TOO_MANY_TRAVELERS");
  return output;
}

function stayGuests(search) {
  const output = [];
  for (let i = 0; i < search.adults; i += 1) output.push({ type: "adult" });
  for (let i = 0; i < search.children; i += 1) {
    output.push({
      type: "child",
      age: Math.max(2, Math.min(17, Number(search.childAges[i]) || 8))
    });
  }
  // Stays does not need lap infants counted as a separate room occupancy.
  return output;
}

function flightSlices(search) {
  const origin = text(search.origin, 3).toUpperCase();
  const destination = text(search.destination, 3).toUpperCase();
  if (!/^[A-Z]{3}$/.test(origin) || !/^[A-Z]{3}$/.test(destination) || origin === destination) {
    throw new Error("BOOKING_FLIGHT_ROUTE_INVALID");
  }
  const departureDate = futureDate(search.departureDate, "DEPARTURE");
  const slices = [{ origin, destination, departure_date: departureDate }];
  if (search.returnDate) {
    const returnDate = futureDate(search.returnDate, "RETURN");
    if (returnDate < departureDate) throw new Error("BOOKING_RETURN_DATE_INVALID");
    slices.push({ origin: destination, destination: origin, departure_date: returnDate });
  }
  return slices;
}

function firstSegment(offer) {
  return offer?.slices?.[0]?.segments?.[0] || null;
}

function lastSegment(offer) {
  const slices = Array.isArray(offer?.slices) ? offer.slices : [];
  const slice = slices[slices.length - 1];
  const segments = Array.isArray(slice?.segments) ? slice.segments : [];
  return segments[segments.length - 1] || null;
}

function durationLabel(offer) {
  const slices = (offer?.slices || []).map((slice) => slice?.duration).filter(Boolean);
  return slices.join(" / ");
}

function mapFlightOffer(offer, search) {
  const first = firstSegment(offer);
  const last = lastSegment(offer);
  const origin = first?.origin?.iata_code || search.origin || "";
  const destination = offer?.slices?.[0]?.destination?.iata_code || search.destination || "";
  const owner = offer?.owner || first?.marketing_carrier || {};
  const currency = cleanCurrency(offer?.total_currency || search.currency);
  const total = money(offer?.total_amount);

  return {
    id: offer?.id || "",
    offerId: offer?.id || "",
    itemType: "FLIGHT",
    productType: "FLIGHT",
    provider: "SKANDI",
    source: "LIVE_AIR",
    sourceLabel: owner?.name || "Live airline availability",
    title: `${origin} → ${destination}`,
    routeSummary: `${origin} → ${destination}`,
    summary: [
      owner?.name || "Live airline offer",
      durationLabel(offer),
      (offer?.slices || []).length > 1 ? "Round trip" : "One way"
    ].filter(Boolean).join(" · "),
    price: { amount: total, total, currency },
    total,
    currency,
    tripType: "Flight",
    expiresAt: offer?.expires_at || null,
    departureAt: first?.departing_at || null,
    arrivalAt: last?.arriving_at || null,
    badges: ["Live fare"],
    searchContext: search
  };
}

function accommodationImage(accommodation) {
  return accommodation?.photos?.[0]?.url || accommodation?.rooms?.[0]?.photos?.[0]?.url || "";
}

function mapStayResult(result, search) {
  const accommodation = result?.accommodation || {};
  const address = accommodation?.location?.address || {};
  const currency = cleanCurrency(result?.cheapest_rate_currency || search.currency);
  const total = money(result?.cheapest_rate_total_amount);
  const city = address?.city_name || text(search.destination, 100);
  const rating = Number(accommodation?.rating || 0);

  return {
    id: result?.id || "",
    staySearchResultId: result?.id || "",
    accommodationId: accommodation?.id || "",
    itemType: "HOTEL",
    productType: "HOTEL",
    provider: "SKANDI",
    source: "LIVE_STAY",
    sourceLabel: "Live hotel availability",
    title: accommodation?.name || city || "Hotel",
    summary: [
      city,
      rating ? `${rating}-star` : "",
      accommodation?.review_score ? `Guest score ${accommodation.review_score}` : ""
    ].filter(Boolean).join(" · "),
    description: accommodation?.description || "",
    imageUrl: accommodationImage(accommodation),
    price: { amount: total, total, currency },
    total,
    currency,
    tripType: "Hotel",
    expiresAt: result?.expires_at || null,
    checkInDate: result?.check_in_date || search.departureDate || "",
    checkOutDate: result?.check_out_date || search.returnDate || "",
    rooms: result?.rooms || search.rooms || 1,
    badges: ["Live hotel rate"],
    searchContext: search
  };
}

function packageItems(flights, stays, search) {
  const output = [];
  const sortedFlights = [...flights].sort((a, b) => money(a.total) - money(b.total)).slice(0, 10);
  const sortedStays = [...stays].sort((a, b) => money(a.total) - money(b.total)).slice(0, 12);
  for (const stay of sortedStays) {
    const flight = sortedFlights.find((candidate) => candidate.currency === stay.currency);
    if (!flight) continue;
    const total = roundMoney(flight.total + stay.total);
    output.push({
      id: `PKG-${flight.offerId}-${stay.staySearchResultId}`,
      itemType: "PACKAGE",
      productType: "PACKAGE",
      provider: "SKANDI",
      source: "SKANDI_PACKAGE",
      sourceLabel: "SKANDI Flight + Hotel",
      title: `${flight.routeSummary} · ${stay.title}`,
      summary: [
        `${Number(search.nights) || Math.max(1, dayDifference(search.departureDate, search.returnDate))} nights`,
        stay.title,
        flight.sourceLabel
      ].filter(Boolean).join(" · "),
      price: { amount: total, total, currency: flight.currency },
      total,
      currency: flight.currency,
      tripType: "Flight + Hotel",
      flightOfferId: flight.offerId,
      staySearchResultId: stay.staySearchResultId,
      accommodationId: stay.accommodationId,
      imageUrl: stay.imageUrl,
      badges: ["Flight + Hotel", "Live pricing"],
      flight,
      stay,
      searchContext: search
    });
    if (output.length >= 20) break;
  }
  return output;
}

function dayDifference(from, to) {
  const a = Date.parse(`${isoDate(from)}T00:00:00Z`);
  const b = Date.parse(`${isoDate(to)}T00:00:00Z`);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b <= a) return 0;
  return Math.round((b - a) / 86400000);
}

async function searchFlights(search) {
  const response = await travelProviderRequest("/air/offer_requests", {
    method: "POST",
    query: { return_offers: true, supplier_timeout: 15000 },
    body: {
      data: {
        slices: flightSlices(search),
        passengers: flightPassengers(search),
        cabin_class: search.travelClass,
        max_connections: search.nonStop ? 0 : 1
      }
    }
  });

  return (response?.data?.offers || [])
    .filter((offer) => offer && !offer.partial && offer.id && Number(offer.total_amount) > 0)
    .map((offer) => mapFlightOffer(offer, search))
    .sort((a, b) => a.total - b.total)
    .slice(0, MAX_RESULTS);
}

async function airportDirectory() {
  const rows = await restRequest({
    table: "travel_info_airports",
    query: {
      select: "iata,title,locationCity,country,latitude,longitude,published,customer_visible",
      limit: 200
    }
  });
  return Array.isArray(rows) ? rows : [];
}

async function resolveStayLocation(search) {
  const needleRaw = text(search.destination || search.destinationRegion, 160);
  const needle = needleRaw.toLowerCase();
  if (!needle) throw new Error("BOOKING_HOTEL_DESTINATION_REQUIRED");
  const rows = await airportDirectory();
  const iataNeedle = needleRaw.toUpperCase();
  const usable = rows.filter((row) => Number.isFinite(Number(row.latitude)) && Number.isFinite(Number(row.longitude)));
  let match = usable.find((row) => text(row.iata, 3).toUpperCase() === iataNeedle);
  if (!match) {
    match = usable.find((row) => {
      const haystack = [row.locationCity, row.title, row.country, row.iata]
        .map((value) => text(value, 200).toLowerCase())
        .join(" ");
      return haystack.includes(needle);
    });
  }
  if (!match) throw new Error("BOOKING_HOTEL_DESTINATION_NOT_FOUND");
  return {
    latitude: Number(match.latitude),
    longitude: Number(match.longitude),
    label: text(match.locationCity || match.title || match.iata, 160),
    iata: text(match.iata, 3).toUpperCase()
  };
}

async function searchStays(search) {
  const checkIn = futureDate(search.departureDate, "CHECK_IN");
  const checkOut = futureDate(search.returnDate, "CHECK_OUT");
  if (checkOut <= checkIn) throw new Error("BOOKING_CHECK_OUT_DATE_INVALID");
  const location = await resolveStayLocation(search);

  const response = await travelProviderRequest("/stays/search", {
    method: "POST",
    body: {
      data: {
        rooms: search.rooms || 1,
        mobile: false,
        location: {
          radius: 25,
          geographic_coordinates: {
            longitude: location.longitude,
            latitude: location.latitude
          }
        },
        guests: stayGuests(search),
        free_cancellation_only: false,
        check_in_date: checkIn,
        check_out_date: checkOut
      }
    }
  });

  return (response?.data?.results || [])
    .filter((result) => result && result.id && Number(result.cheapest_rate_total_amount) > 0)
    .map((result) => mapStayResult(result, { ...search, destination: location.iata || search.destination }))
    .sort((a, b) => a.total - b.total)
    .slice(0, MAX_RESULTS);
}

async function retrieveFlightOffer(offerId) {
  const id = text(offerId, 160);
  if (!/^off_[A-Za-z0-9_]+$/.test(id)) throw new Error("BOOKING_LIVE_OFFER_INVALID");
  const response = await travelProviderRequest(`/air/offers/${encodeURIComponent(id)}`, {
    query: { return_available_services: true }
  });
  const offer = response?.data;
  if (!offer?.id || !offer?.expires_at || Date.parse(offer.expires_at) <= Date.now()) {
    throw new Error("BOOKING_OFFER_EXPIRED");
  }
  return offer;
}

function allStayRates(searchResult) {
  const rates = [];
  for (const room of searchResult?.accommodation?.rooms || []) {
    for (const rate of room?.rates || []) {
      if (!rate?.id || !Number(rate.total_amount)) continue;
      rates.push({
        ...rate,
        roomName: room?.name || "Room",
        roomPhotos: room?.photos || []
      });
    }
  }
  return rates;
}

async function createStayQuote(searchResultId) {
  const id = text(searchResultId, 160);
  if (!/^srr_[A-Za-z0-9_]+$/.test(id)) throw new Error("BOOKING_HOTEL_RESULT_INVALID");
  const refreshed = await travelProviderRequest(
    `/stays/search_results/${encodeURIComponent(id)}/actions/fetch_all_rates`,
    { method: "POST" }
  );
  const searchResult = refreshed?.data;
  const rates = allStayRates(searchResult)
    .filter((rate) => !rate.expires_at || Date.parse(rate.expires_at) > Date.now())
    .sort((a, b) => money(a.total_amount) - money(b.total_amount));
  if (!rates.length) throw new Error("BOOKING_HOTEL_RATE_UNAVAILABLE");
  const rate = rates[0];
  const quoteResponse = await travelProviderRequest("/stays/quotes", {
    method: "POST",
    body: { data: { rate_id: rate.id } }
  });
  const quote = quoteResponse?.data;
  if (!quote?.id) throw new Error("BOOKING_HOTEL_QUOTE_FAILED");
  return { quote, rate, searchResult };
}

async function cartRow(cartId) {
  const rows = await restRequest({
    table: "booking_carts",
    query: { select: "*", cart_id: `eq.${text(cartId, 120)}`, limit: 1 }
  });
  return rows?.[0] || null;
}

async function securedCart(cartId, token) {
  const cart = await cartRow(cartId);
  if (!cart) throw new Error("BOOKING_CART_NOT_FOUND");
  requireBookingCartAccess(cart, token);
  return cart;
}


function displayOfferForCart(row = {}) {
  const payload = row.payload && typeof row.payload === "object" ? row.payload : {};
  const flight = payload.flight?.offer || null;
  const stay = payload.stay?.quote || null;
  const hasAir = Boolean(flight);
  const hasHotel = Boolean(stay);
  const airlineName = flight?.owner?.name || "";
  const hotelName = stay?.accommodation?.name || "";
  const route = flight?.routeSummary || "";
  const productType = hasAir && hasHotel
    ? "Flight + Hotel"
    : hasAir
      ? "Flight"
      : hasHotel
        ? "Hotel"
        : text(payload.productType || "", 40);

  let title = "Selected travel offer";
  let summary = "";
  if (hasAir && hasHotel) {
    title = [route, hotelName].filter(Boolean).join(" · ") || "Flight + Hotel";
    summary = [airlineName, hotelName, "Flight + Hotel"].filter(Boolean).join(" · ");
  } else if (hasAir) {
    title = route || "Flight";
    summary = [airlineName, flight?.slices?.length > 1 ? "Round trip" : "One way"].filter(Boolean).join(" · ");
  } else if (hasHotel) {
    title = hotelName || "Hotel";
    summary = [
      stay?.roomName || "",
      stay?.boardType || "",
      stay?.accommodation?.address?.city_name || stay?.accommodation?.address?.city || ""
    ].filter(Boolean).join(" · ");
  }

  return {
    title,
    summary,
    routeSummary: route,
    travelType: productType,
    airlineName,
    hotelName,
    sourceLabel: airlineName || (hasHotel ? "Live hotel availability" : "SKANDI"),
    termsSummary: "Fare, hotel, cancellation and supplier conditions apply."
  };
}

function safeCart(row = {}, items = []) {
  const payload = row.payload && typeof row.payload === "object" ? row.payload : {};
  const {
    cartAccessToken: _token,
    paymentIntentClientSecret: _clientSecret,
    provider: _provider,
    ...safePayload
  } = payload;
  const currency = cleanCurrency(row.currency || "USD");
  const total = money(row.total);
  return {
    id: row.id || "",
    cartId: row.cart_id || "",
    status: row.status || "Open",
    currency,
    subtotal: money(row.subtotal),
    taxes: money(row.taxes),
    total,
    totalPrice: { amount: total, total, currency },
    selectedOfferId: row.selected_offer_id || "",
    selectedOffer: displayOfferForCart(row),
    expiresAt: row.expires_at || "",
    source: "SKANDI",
    items,
    ...safePayload
  };
}

async function patchCart(cart, patch = {}, payloadPatch = {}) {
  const rows = await restRequest({
    table: "booking_carts",
    method: "PATCH",
    query: { id: `eq.${cart.id}` },
    body: {
      ...patch,
      payload: { ...(cart.payload || {}), ...payloadPatch },
      updated_at: new Date().toISOString()
    }
  });
  return rows?.[0] || { ...cart, ...patch, payload: { ...(cart.payload || {}), ...payloadPatch } };
}

async function cartItems(cartId) {
  const rows = await restRequest({
    table: "booking_cart_items",
    query: { select: "*", cart_id: `eq.${text(cartId, 120)}`, order: "created_at.asc", limit: 100 }
  });
  return Array.isArray(rows) ? rows : [];
}

async function insertCartItem(cartId, item) {
  await restRequest({
    table: "booking_cart_items",
    method: "POST",
    body: {
      cart_id: cartId,
      item_type: item.itemType,
      item_id: item.itemId,
      title: item.title,
      quantity: 1,
      unit_price: item.amount,
      total: item.amount,
      payload: item.payload || {}
    },
    prefer: "return=minimal"
  });
}

function minimumExpiry(values, fallbackMinutes = 30) {
  const valid = values
    .map((value) => Date.parse(String(value || "")))
    .filter((value) => Number.isFinite(value) && value > Date.now());
  const fallback = Date.now() + fallbackMinutes * 60 * 1000;
  return new Date(valid.length ? Math.min(...valid, fallback) : fallback).toISOString();
}

function publicFlightSnapshot(offer) {
  const mapped = mapFlightOffer(offer, {});
  return {
    id: offer.id,
    totalAmount: offer.total_amount,
    totalCurrency: offer.total_currency,
    taxAmount: offer.tax_amount || "0",
    expiresAt: offer.expires_at || null,
    owner: offer.owner ? {
      id: offer.owner.id || null,
      iataCode: offer.owner.iata_code || null,
      name: offer.owner.name || null,
      logoSymbolUrl: offer.owner.logo_symbol_url || null
    } : null,
    passengers: (offer.passengers || []).map((p) => ({ id: p.id, type: p.type || null, age: p.age ?? null })),
    slices: (offer.slices || []).map((slice) => ({
      id: slice.id || null,
      duration: slice.duration || null,
      origin: slice.origin ? { iataCode: slice.origin.iata_code || null, name: slice.origin.name || null } : null,
      destination: slice.destination ? { iataCode: slice.destination.iata_code || null, name: slice.destination.name || null } : null,
      segments: (slice.segments || []).map((segment) => ({
        id: segment.id || null,
        departingAt: segment.departing_at || null,
        arrivingAt: segment.arriving_at || null,
        origin: segment.origin ? { iataCode: segment.origin.iata_code || null, name: segment.origin.name || null } : null,
        destination: segment.destination ? { iataCode: segment.destination.iata_code || null, name: segment.destination.name || null } : null,
        marketingCarrier: segment.marketing_carrier ? { name: segment.marketing_carrier.name || null, iataCode: segment.marketing_carrier.iata_code || null } : null,
        marketingFlightNumber: segment.marketing_carrier_flight_number || null
      }))
    })),
    routeSummary: mapped.routeSummary
  };
}

function publicStaySnapshot(searchResult, quote, rate) {
  const accommodation = searchResult?.accommodation || quote?.accommodation || {};
  return {
    searchResultId: searchResult?.id || null,
    quoteId: quote?.id || null,
    quoteExpiresAt: quote?.expires_at || rate?.expires_at || null,
    rateId: rate?.id || null,
    totalAmount: quote?.total_amount || rate?.total_amount || "0",
    totalCurrency: quote?.total_currency || rate?.total_currency || null,
    taxAmount: quote?.tax_amount || rate?.tax_amount || "0",
    roomName: rate?.roomName || null,
    boardType: rate?.board_type || null,
    accommodation: accommodation ? {
      id: accommodation.id || null,
      name: accommodation.name || null,
      rating: accommodation.rating || null,
      reviewScore: accommodation.review_score || null,
      imageUrl: accommodationImage(accommodation),
      address: accommodation.location?.address || null
    } : null
  };
}

function getPayload(cart) {
  return cart?.payload && typeof cart.payload === "object" ? cart.payload : {};
}

function hasFlight(cart) {
  return Boolean(getPayload(cart)?.flight?.offerId);
}

function hasStay(cart) {
  return Boolean(getPayload(cart)?.stay?.searchResultId);
}

function optionPrice(row = {}, fallbackCurrency = "USD") {
  const commercial = row.commercial && typeof row.commercial === "object" ? row.commercial : {};
  const amount = money(
    commercial.publicPrice ??
    commercial.price ??
    commercial.livePrice ??
    commercial.basePrice ??
    0
  );
  return {
    amount,
    total: amount,
    currency: cleanCurrency(commercial.currency || fallbackCurrency)
  };
}

async function listPublishedMasterOptions(entityType, fallbackCurrency = "USD") {
  const rows = await restRequest({
    table: "inventory_master_entities",
    query: {
      select: "id,public_id,code,name,details,commercial,payload,sort_priority",
      entity_type: `eq.${entityType}`,
      active: "eq.true",
      customer_visible: "eq.true",
      status: "eq.PUBLISHED",
      order: "sort_priority.asc,updated_at.desc",
      limit: 100
    }
  }).catch(() => []);

  return (Array.isArray(rows) ? rows : []).map((row) => {
    const details = row.details && typeof row.details === "object" ? row.details : {};
    const payload = row.payload && typeof row.payload === "object" ? row.payload : {};
    const price = optionPrice(row, fallbackCurrency);
    return {
      id: row.id,
      publicId: row.public_id || "",
      code: row.code || "",
      type: text(details.extraType || details.transferType || entityType, 80).toUpperCase(),
      title: row.name || details.name || "SKANDI service",
      description: text(
        details.shortDescription ||
        details.description ||
        details.customerDescription ||
        payload.shortDescription ||
        payload.description ||
        "",
        3000
      ),
      includes: Array.isArray(details.includes) ? details.includes.slice(0, 20) : [],
      price,
      details,
      payload
    };
  });
}

function optionCurrencyCompatible(option, cartCurrency) {
  const amount = money(option?.price?.amount);
  if (amount <= 0) return true;
  return cleanCurrency(option?.price?.currency || cartCurrency) === cleanCurrency(cartCurrency);
}

async function availableAncillaryOptions(cart) {
  const options = await listPublishedMasterOptions("ANCILLARY", cart.currency || "USD");
  return options.filter((item) => optionCurrencyCompatible(item, cart.currency));
}

function transferMatchesCart(option, cart) {
  const search = getPayload(cart).search || {};
  const details = option?.details || {};
  const destination = text(search.destination, 100).toUpperCase();
  if (!destination) return true;

  const candidates = [
    details.airportIata,
    details.airportCode,
    details.destinationIata,
    details.destinationCode,
    details.destination,
    details.area,
    details.country
  ].map((v) => text(v, 160).toUpperCase()).filter(Boolean);

  return !candidates.length || candidates.some((value) =>
    value === destination || value.includes(destination) || destination.includes(value)
  );
}

async function availableTransferOptions(cart) {
  const options = await listPublishedMasterOptions("TRANSFER", cart.currency || "USD");
  return options
    .filter((item) => optionCurrencyCompatible(item, cart.currency))
    .filter((item) => transferMatchesCart(item, cart));
}

function selectedOptionTotal(options = [], currency = "USD") {
  let total = 0;
  for (const option of Array.isArray(options) ? options : []) {
    const price = option?.price || {};
    const amount = money(price.amount ?? price.total);
    if (amount <= 0) continue;
    if (cleanCurrency(price.currency || currency) !== cleanCurrency(currency)) {
      throw new Error("BOOKING_ADDON_CURRENCY_MISMATCH");
    }
    total += amount;
  }
  return total;
}

async function liveSeatServiceCatalog(offerId) {
  if (!offerId) return new Map();
  const response = await travelProviderRequest("/air/seat_maps", {
    query: { offer_id: offerId }
  });
  const catalog = new Map();
  for (const seatMap of Array.isArray(response?.data) ? response.data : []) {
    for (const cabin of seatMap?.cabins || []) {
      for (const row of cabin?.rows || []) {
        for (const section of row?.sections || []) {
          for (const element of section?.elements || []) {
            if (element?.type !== "seat") continue;
            for (const service of element?.available_services || []) {
              if (!service?.id) continue;
              catalog.set(service.id, {
                id: service.id,
                amount: money(service.total_amount),
                currency: cleanCurrency(service.total_currency || "USD"),
                passengerIds: service.passenger_ids || (service.passenger_id ? [service.passenger_id] : []),
                segmentIds: service.segment_ids || (service.segment_id ? [service.segment_id] : []),
                seat: element.designator || ""
              });
            }
          }
        }
      }
    }
  }
  return catalog;
}

async function priceSeatSelections(cart, currency) {
  const payload = getPayload(cart);
  const selections = payload.seatSelections && typeof payload.seatSelections === "object"
    ? Object.values(payload.seatSelections)
    : [];
  if (!payload.flight?.offerId || !selections.length) {
    return { total: 0, services: [] };
  }

  const catalog = await liveSeatServiceCatalog(payload.flight.offerId);
  const services = [];
  let total = 0;
  for (const selection of selections) {
    const serviceId = text(selection?.serviceId, 160);
    if (!serviceId) continue;
    const service = catalog.get(serviceId);
    if (!service) throw new Error("BOOKING_SEAT_UNAVAILABLE");
    if (service.currency !== cleanCurrency(currency)) throw new Error("BOOKING_SEAT_CURRENCY_MISMATCH");
    total += service.amount;
    services.push(service);
  }
  return { total: roundMoney(total), services };
}



function cartReferenceFromProviders(airOrder, stayBooking, cartId) {
  return airOrder?.booking_reference || stayBooking?.reference || cartId;
}

function travelerName(value, ...keys) {
  for (const key of keys) {
    const v = text(value?.[key], 80);
    if (v) return v;
  }
  return "";
}

function normalizeCountryCode(value) {
  const v = text(value, 3).toUpperCase();
  return /^[A-Z]{2}$/.test(v) ? v : "";
}

function normalizeGender(value) {
  const v = text(value, 10).toLowerCase();
  if (["m", "male"].includes(v)) return "m";
  if (["f", "female"].includes(v)) return "f";
  return "";
}

function normalizeTitle(value, gender) {
  const v = text(value, 10).toLowerCase();
  if (["mr", "ms", "mrs", "miss", "dr"].includes(v)) return v;
  if (gender === "m") return "mr";
  if (gender === "f") return "ms";
  return "";
}

function buildAirPassengers(cart, refreshedOffer) {
  const payload = getPayload(cart);
  const travelers = Array.isArray(payload.travelers) ? payload.travelers : [];
  const offerPassengers = Array.isArray(refreshedOffer?.passengers) ? refreshedOffer.passengers : [];
  const contact = payload.contact || {};
  if (travelers.length !== offerPassengers.length) throw new Error("BOOKING_TRAVELER_COUNT_MISMATCH");

  const email = text(contact.email || cart.email, 254).toLowerCase();
  const phone = text(contact.phone || contact.phoneNumber || contact.mobile, 20);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("BOOKING_CONTACT_EMAIL_INVALID");
  if (!/^\+[1-9]\d{7,14}$/.test(phone)) throw new Error("BOOKING_CONTACT_PHONE_INVALID");

  return travelers.map((traveler, index) => {
    const offerPassenger = offerPassengers[index];
    const givenName = travelerName(traveler, "givenName", "firstName", "first_name") || text(traveler?.name?.firstName || traveler?.name?.givenName, 80);
    const familyName = travelerName(traveler, "familyName", "lastName", "last_name") || text(traveler?.name?.lastName || traveler?.name?.familyName, 80);
    const bornOn = isoDate(traveler.dateOfBirth || traveler.bornOn || traveler.birthDate);
    const gender = normalizeGender(traveler.gender || traveler.sex);
    const title = normalizeTitle(traveler.title, gender);
    if (!givenName || !familyName || !bornOn) throw new Error("BOOKING_TRAVELER_DETAILS_INCOMPLETE");

    const passenger = {
      id: offerPassenger.id,
      given_name: givenName,
      family_name: familyName,
      born_on: bornOn,
      email,
      phone_number: phone
    };
    if (gender) passenger.gender = gender;
    if (title) passenger.title = title;

    const primaryDocument = Array.isArray(traveler?.documents) ? traveler.documents[0] || {} : {};
    const documentNumber = text(
      traveler.documentNumber || traveler.passportNumber || primaryDocument.number || primaryDocument.documentNumber,
      50
    ).toUpperCase();
    const expiresOn = isoDate(
      traveler.documentExpiry || traveler.passportExpiry || primaryDocument.expiryDate || primaryDocument.expiresOn
    );
    const issuingCountryCode = normalizeCountryCode(
      traveler.issuingCountryCode ||
      traveler.documentIssuingCountry ||
      primaryDocument.issuanceCountry ||
      primaryDocument.issuingCountryCode ||
      traveler.nationality
    );
    if (documentNumber && expiresOn && issuingCountryCode) {
      passenger.identity_documents = [{
        type: "passport",
        unique_identifier: documentNumber,
        issuing_country_code: issuingCountryCode,
        expires_on: expiresOn
      }];
    }
    return passenger;
  });
}

function buildStayGuests(cart) {
  const payload = getPayload(cart);
  const travelers = Array.isArray(payload.travelers) ? payload.travelers : [];
  if (!travelers.length) throw new Error("BOOKING_TRAVELER_REQUIRED");
  return travelers.map((traveler) => {
    const givenName = travelerName(traveler, "givenName", "firstName", "first_name") || text(traveler?.name?.firstName || traveler?.name?.givenName, 80);
    const familyName = travelerName(traveler, "familyName", "lastName", "last_name") || text(traveler?.name?.lastName || traveler?.name?.familyName, 80);
    const bornOn = isoDate(traveler.dateOfBirth || traveler.bornOn || traveler.birthDate);
    if (!givenName || !familyName || !bornOn) throw new Error("BOOKING_TRAVELER_DETAILS_INCOMPLETE");
    return { given_name: givenName, family_name: familyName, born_on: bornOn };
  });
}

async function refreshCartPricing(cart) {
  const payload = getPayload(cart);
  let flightOffer = null;
  let stayQuote = null;
  let stayRate = null;
  let staySearchResult = null;
  let total = 0;
  let taxes = 0;
  let currency = cleanCurrency(cart.currency || "USD");
  const expiries = [];

  if (payload.flight?.offerId) {
    flightOffer = await retrieveFlightOffer(payload.flight.offerId);
    currency = cleanCurrency(flightOffer.total_currency, currency);
    total += money(flightOffer.total_amount);
    taxes += money(flightOffer.tax_amount);
    expiries.push(flightOffer.expires_at);
  }

  if (payload.stay?.searchResultId) {
    const stay = await createStayQuote(payload.stay.searchResultId);
    stayQuote = stay.quote;
    stayRate = stay.rate;
    staySearchResult = stay.searchResult;
    const stayCurrency = cleanCurrency(stayQuote.total_currency || stayRate.total_currency, currency);
    if (total > 0 && stayCurrency !== currency) throw new Error("BOOKING_PACKAGE_CURRENCY_MISMATCH");
    currency = stayCurrency;
    total += money(stayQuote.total_amount || stayRate.total_amount);
    taxes += money(stayQuote.tax_amount || stayRate.tax_amount);
    expiries.push(stayQuote.expires_at || stayRate.expires_at);
  }

  if (!flightOffer && !stayQuote) throw new Error("BOOKING_CART_EMPTY");

  total += selectedOptionTotal(payload.selectedExtras || [], currency);
  if (payload.signatureTransfer) {
    total += selectedOptionTotal([payload.signatureTransfer], currency);
  }

  const seatPricing = await priceSeatSelections(cart, currency);
  total += seatPricing.total;

  const expiresAt = minimumExpiry(expiries, 25);
  const updatedPayload = {
    ...payload,
    seatPricing: {
      total: seatPricing.total,
      currency,
      services: seatPricing.services
    },
    ...(flightOffer ? { flight: { ...payload.flight, offer: publicFlightSnapshot(flightOffer) } } : {}),
    ...(stayQuote ? {
      stay: {
        ...payload.stay,
        quote: publicStaySnapshot(staySearchResult, stayQuote, stayRate)
      }
    } : {})
  };

  const updated = await patchCart(
    cart,
    {
      currency,
      subtotal: roundMoney(total),
      taxes: roundMoney(taxes),
      total: roundMoney(total),
      expires_at: expiresAt
    },
    updatedPayload
  );
  return { cart: updated, flightOffer, stayQuote, stayRate, staySearchResult };
}

export const getHomeBootstrap = webMethod(Permissions.Anyone, async () => ({
  ok: true,
  provider: "SKANDI",
  providers: ["LIVE_AIR", "LIVE_STAYS"],
  searchModes: ["package", "flightOnly", "hotelOnly", "signaturePackage"],
  defaultSearchMode: "package",
  searchDefaults: { currency: "USD", adults: 2, rooms: 1, max: 30 },
  environment: await getTravelProviderEnvironment()
}));

export const searchUnifiedOffers = webMethod(Permissions.Anyone, async ({ search = {} } = {}) => {
  const normalized = normalizeSearch(search);
  const mode = normalized.tripType.toLowerCase();

  if (mode === "hotelonly") {
    const stays = await searchStays(normalized);
    return { ok: true, provider: "SKANDI", mode: "hotelOnly", items: stays };
  }

  if (mode === "package" || mode === "signaturepackage" || mode === "holiday") {
    if (!normalized.returnDate) {
      const nights = Math.max(1, Number(normalized.nights) || 7);
      const departure = futureDate(normalized.departureDate, "DEPARTURE");
      normalized.returnDate = new Date(Date.parse(`${departure}T00:00:00Z`) + nights * 86400000)
        .toISOString().slice(0, 10);
    }
    const [flights, stays] = await Promise.all([
      searchFlights(normalized),
      searchStays({ ...normalized, rooms: normalized.rooms || 1 })
    ]);
    const items = packageItems(flights, stays, normalized);
    return {
      ok: true,
      provider: "SKANDI",
      mode: "package",
      items,
      meta: { flightCount: flights.length, hotelCount: stays.length, packageCount: items.length }
    };
  }

  const flights = await searchFlights(normalized);
  return { ok: true, provider: "SKANDI", mode: "flightOnly", items: flights };
});

export const createBookingCartFromOffer = webMethod(Permissions.Anyone, async ({ offer, search = {} } = {}) => {
  const supplied = offer && typeof offer === "object" ? offer : {};
  const normalized = normalizeSearch(search || supplied.searchContext || {});
  const type = text(supplied.itemType || supplied.productType || "FLIGHT", 20).toUpperCase();
  const cartId = cartCode();
  const accessToken = cartAccessToken();

  let flightOffer = null;
  let stay = null;
  let currency = cleanCurrency(supplied.currency || supplied.price?.currency || normalized.currency);
  let total = 0;
  let taxes = 0;
  const expiries = [];
  const payload = {
    version: 3,
    provider: "SKANDI",
    productType: type,
    search: normalized,
    cartAccessToken: accessToken,
    workflow: { step: "offer", termsAccepted: false },
    selectedExtras: [],
    seatSelections: {}
  };

  if (type === "FLIGHT" || type === "PACKAGE") {
    const offerId = text(supplied.flightOfferId || supplied.offerId || supplied.id, 160);
    flightOffer = await retrieveFlightOffer(offerId);
    currency = cleanCurrency(flightOffer.total_currency, currency);
    total += money(flightOffer.total_amount);
    taxes += money(flightOffer.tax_amount);
    expiries.push(flightOffer.expires_at);
    payload.flight = {
      offerId: flightOffer.id,
      offer: publicFlightSnapshot(flightOffer)
    };
  }

  if (type === "HOTEL" || type === "PACKAGE") {
    const searchResultId = text(supplied.staySearchResultId || supplied.id, 160);
    stay = await createStayQuote(searchResultId);
    const stayCurrency = cleanCurrency(stay.quote.total_currency || stay.rate.total_currency, currency);
    if (flightOffer && stayCurrency !== currency) throw new Error("BOOKING_PACKAGE_CURRENCY_MISMATCH");
    currency = stayCurrency;
    total += money(stay.quote.total_amount || stay.rate.total_amount);
    taxes += money(stay.quote.tax_amount || stay.rate.tax_amount);
    expiries.push(stay.quote.expires_at || stay.rate.expires_at);
    payload.stay = {
      searchResultId,
      quote: publicStaySnapshot(stay.searchResult, stay.quote, stay.rate)
    };
  }

  if (!flightOffer && !stay) throw new Error("BOOKING_OFFER_INVALID");

  const expiresAt = minimumExpiry(expiries, 25);
  const selectedOfferId = flightOffer?.id || stay?.quote?.id || stay?.rate?.id || supplied.id || null;
  const cartRows = await restRequest({
    table: "booking_carts",
    method: "POST",
    body: {
      cart_id: cartId,
      status: "Open",
      currency,
      subtotal: roundMoney(total),
      taxes: roundMoney(taxes),
      total: roundMoney(total),
      selected_offer_id: selectedOfferId,
      expires_at: expiresAt,
      source: "SKANDI",
      payload
    }
  });
  const cart = cartRows?.[0];
  if (!cart?.id) throw new Error("BOOKING_CART_CREATE_FAILED");

  if (flightOffer) {
    const mapped = mapFlightOffer(flightOffer, normalized);
    await insertCartItem(cartId, {
      itemType: "FLIGHT_OFFER",
      itemId: flightOffer.id,
      title: mapped.routeSummary,
      amount: money(flightOffer.total_amount),
      payload: { provider: "SKANDI_LIVE_AIR", expiresAt: flightOffer.expires_at }
    });
  }
  if (stay) {
    const hotel = stay.searchResult?.accommodation?.name || "Hotel";
    await insertCartItem(cartId, {
      itemType: "HOTEL_OFFER",
      itemId: stay.quote.id,
      title: hotel,
      amount: money(stay.quote.total_amount || stay.rate.total_amount),
      payload: {
        provider: "SKANDI_LIVE_STAY",
        searchResultId: payload.stay.searchResultId,
        rateId: stay.rate.id,
        quoteId: stay.quote.id
      }
    });
  }

  const nextPath = `/booking?step=offer&cartId=${encodeURIComponent(cartId)}&cartToken=${encodeURIComponent(accessToken)}`;
  return {
    ok: true,
    provider: "SKANDI",
    cartId,
    cartAccessToken: accessToken,
    cart: safeCart(cart, await cartItems(cartId)),
    step: "offer",
    nextPath
  };
});

export const getBookingCart = webMethod(Permissions.Anyone, async ({ cartId, cartToken } = {}) => {
  const cart = await loadBookingCart(cartId, cartToken);
  return cart;
});

export const saveOfferDecision = webMethod(Permissions.Anyone, async ({ cartId, cartToken, termsAccepted } = {}) => {
  if (termsAccepted !== true) throw new Error("BOOKING_TERMS_REQUIRED");
  const cart = await securedCart(cartId, cartToken);
  const saved = await patchCart(cart, { status: "OfferAccepted" }, {
    workflow: {
      ...(getPayload(cart).workflow || {}),
      step: "extras",
      termsAccepted: true,
      offerAcceptedAt: new Date().toISOString()
    }
  });
  return { ok: true, cart: safeCart(saved, await cartItems(cartId)) };
});

export const getBookingExtras = webMethod(Permissions.Anyone, async ({ cartId, cartToken } = {}) => {
  const cart = await securedCart(cartId, cartToken);
  const extras = await availableAncillaryOptions(cart);
  return {
    ok: true,
    cart: safeCart(cart),
    extras,
    selectedExtras: Array.isArray(getPayload(cart).selectedExtras) ? getPayload(cart).selectedExtras : []
  };
});

export const saveBookingExtras = webMethod(Permissions.Anyone, async ({ cartId, cartToken, selectedExtras = [] } = {}) => {
  const cart = await securedCart(cartId, cartToken);
  const available = await availableAncillaryOptions(cart);
  const byId = new Map(available.map((item) => [String(item.id), item]));
  const requestedIds = (Array.isArray(selectedExtras) ? selectedExtras : [])
    .map((item) => String(item?.id || item?.publicId || item?.code || ""))
    .filter(Boolean);
  const extras = requestedIds.map((id) => byId.get(id)).filter(Boolean);
  if (extras.length !== requestedIds.length) {
    throw new Error("BOOKING_EXTRA_INVALID");
  }

  const transferOptions = await availableTransferOptions(cart);
  const requiresSignatureTransfer = transferOptions.length > 0;
  const saved = await patchCart(cart, {}, {
    selectedExtras: extras,
    workflow: {
      ...(getPayload(cart).workflow || {}),
      step: requiresSignatureTransfer ? "transfer" : "apis"
    }
  });
  return { ok: true, cart: safeCart(saved), requiresSignatureTransfer };
});

export const getSignatureTransferOptions = webMethod(Permissions.Anyone, async ({ cartId, cartToken } = {}) => {
  const cart = await securedCart(cartId, cartToken);
  const options = await availableTransferOptions(cart);
  return {
    ok: true,
    cartId: cart.cart_id,
    options,
    message: options.length
      ? "SKANDI Signature transfer options are available for this trip."
      : "No SKANDI Signature transfer is available for this trip."
  };
});

export const saveSignatureTransfer = webMethod(Permissions.Anyone, async ({ cartId, cartToken, transfer } = {}) => {
  const cart = await securedCart(cartId, cartToken);
  let confirmedTransfer = null;
  if (transfer) {
    const available = await availableTransferOptions(cart);
    confirmedTransfer = available.find((item) => String(item.id) === String(transfer?.id || ""));
    if (!confirmedTransfer) throw new Error("BOOKING_TRANSFER_INVALID");
  }

  const saved = await patchCart(cart, {}, {
    signatureTransfer: confirmedTransfer,
    workflow: { ...(getPayload(cart).workflow || {}), step: "apis" }
  });
  return { ok: true, cart: safeCart(saved) };
});

export const savePassengerApisAndReprice = webMethod(Permissions.Anyone, async ({ cartId, cartToken, travelers = [], contact = {} } = {}) => {
  const cart = await securedCart(cartId, cartToken);
  const people = Array.isArray(travelers) ? travelers.slice(0, MAX_TRAVELERS) : [];
  if (!people.length) throw new Error("BOOKING_TRAVELER_REQUIRED");
  const contactEmail = text(contact.email, 254).toLowerCase();
  const saved = await patchCart(
    cart,
    { email: contactEmail || cart.email || null },
    {
      travelers: people,
      contact,
      workflow: {
        ...(getPayload(cart).workflow || {}),
        step: hasFlight(cart) ? "seats" : "payment",
        apisSavedAt: new Date().toISOString()
      }
    }
  );
  const repriced = await refreshCartPricing(saved);
  return { ok: true, cart: safeCart(repriced.cart), repriced: true };
});

export const bookingHasFlight = webMethod(Permissions.Anyone, async ({ cartId, cartToken } = {}) => {
  const cart = await securedCart(cartId, cartToken);
  return hasFlight(cart);
});

export const prepareBookingPayment = webMethod(Permissions.Anyone, async ({ cartId, cartToken } = {}) => {
  let cart = await securedCart(cartId, cartToken);
  const repriced = await refreshCartPricing(cart);
  cart = repriced.cart;
  const payload = getPayload(cart);
  const referenceId = payload.flight?.offerId || payload.stay?.quote?.quoteId || cart.cart_id;
  const amount = amountToMinor(cart.total, cart.currency);
  const selectionSignature = `cart:${cart.cart_id}:v3`;
  const idempotencyKey = `skandi_${cart.cart_id}_${amount}_${cart.currency}`.slice(0, 255);
  const [paymentIntent, publishableKey] = await Promise.all([
    prepareSecurePaymentIntent({
      amount,
      currency: cart.currency,
      offerId: referenceId,
      selectionSignature,
      idempotencyKey
    }),
    getSecurePaymentPublishableKey()
  ]);
  if (!paymentIntent?.id || !paymentIntent?.client_secret) throw new Error("BOOKING_PAYMENT_SETUP_FAILED");

  const updated = await patchCart(cart, { status: "PaymentPending" }, {
    paymentIntentId: paymentIntent.id,
    paymentReferenceId: referenceId,
    paymentSelectionSignature: selectionSignature,
    workflow: { ...(payload.workflow || {}), step: "payment", paymentPreparedAt: new Date().toISOString() }
  });

  return {
    ok: true,
    provider: "Stripe",
    cart: safeCart(updated),
    payment: {
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      publishableKey,
      amount: roundMoney(updated.total),
      currency: updated.currency,
      status: paymentIntent.status
    }
  };
});

async function verifyCustomerPayment(cart, paymentIntentId) {
  const payload = getPayload(cart);
  const expectedId = text(payload.paymentIntentId, 160);
  const id = text(paymentIntentId || expectedId, 160);
  if (!id || id !== expectedId || !/^pi_[A-Za-z0-9_]+$/.test(id)) throw new Error("BOOKING_PAYMENT_REFERENCE_INVALID");
  const payment = await retrieveSecurePaymentIntent(id);
  if (payment?.status !== "succeeded") throw new Error("BOOKING_PAYMENT_NOT_COMPLETE");
  if (cleanCurrency(payment.currency) !== cleanCurrency(cart.currency)) throw new Error("BOOKING_PAYMENT_CURRENCY_MISMATCH");
  if (Number(payment.amount_received) !== amountToMinor(cart.total, cart.currency)) throw new Error("BOOKING_PAYMENT_AMOUNT_MISMATCH");
  if (text(payment.metadata?.offer_id, 160) !== text(payload.paymentReferenceId, 160)) throw new Error("BOOKING_PAYMENT_OFFER_MISMATCH");
  if (text(payment.metadata?.selection_signature, 255) !== text(payload.paymentSelectionSignature, 255)) throw new Error("BOOKING_PAYMENT_SELECTION_MISMATCH");
  return payment;
}

async function createAirOrder(cart, paymentIntentId) {
  const payload = getPayload(cart);
  if (!payload.flight?.offerId) return null;
  const offer = await retrieveFlightOffer(payload.flight.offerId);
  const passengers = buildAirPassengers(cart, offer);
  const payloadSeatPricing = payload.seatPricing && typeof payload.seatPricing === "object"
    ? payload.seatPricing
    : {};
  const serviceIds = Array.from(new Set(
    (Array.isArray(payloadSeatPricing.services) ? payloadSeatPricing.services : [])
      .map((service) => text(service?.id, 160))
      .filter(Boolean)
  ));
  const airProviderTotal = roundMoney(
    money(offer.total_amount) + money(payloadSeatPricing.total)
  );

  const orderData = {
    type: "instant",
    selected_offers: [offer.id],
    passengers,
    payments: [{
      type: "balance",
      amount: providerAmountString(airProviderTotal, offer.total_currency),
      currency: offer.total_currency
    }],
    metadata: {
      integration: "skandi_customer",
      skandi_cart_id: cart.cart_id,
      payment_intent_id: paymentIntentId
    }
  };
  if (serviceIds.length) {
    orderData.services = serviceIds.map((id) => ({ id, quantity: 1 }));
  }

  const response = await travelProviderRequest("/air/orders", {
    method: "POST",
    body: { data: orderData }
  });
  if (!response?.data?.id) throw new Error("BOOKING_AIR_ORDER_STATUS_UNKNOWN");
  return response.data;
}

async function createStayBooking(cart) {
  const payload = getPayload(cart);
  if (!payload.stay?.searchResultId) return null;
  const quoteData = await createStayQuote(payload.stay.searchResultId);
  const quote = quoteData.quote;
  const contact = payload.contact || {};
  const email = text(contact.email || cart.email, 254).toLowerCase();
  const phone = text(contact.phone || contact.phoneNumber || contact.mobile, 20);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("BOOKING_CONTACT_EMAIL_INVALID");
  if (!/^\+[1-9]\d{7,14}$/.test(phone)) throw new Error("BOOKING_CONTACT_PHONE_INVALID");
  const response = await travelProviderRequest("/stays/bookings", {
    method: "POST",
    body: {
      data: {
        quote_id: quote.id,
        phone_number: phone,
        guests: buildStayGuests(cart),
        email,
        metadata: {
          integration: "skandi_customer",
          skandi_cart_id: cart.cart_id
        }
      }
    }
  });
  if (!response?.data?.id) throw new Error("BOOKING_HOTEL_BOOKING_STATUS_UNKNOWN");
  return response.data;
}

export const authorizePaymentAndCommitBooking = webMethod(Permissions.Anyone, async ({
  cartId,
  cartToken,
  termsAccepted,
  paymentIntentId
} = {}) => {
  if (termsAccepted !== true) throw new Error("BOOKING_TERMS_REQUIRED");
  let cart = await securedCart(cartId, cartToken);
  const payload = getPayload(cart);
  if (cart.status === "Confirmed" && payload.bookingReference) {
    return {
      ok: true,
      recoveredExistingBooking: true,
      bookingReference: payload.bookingReference,
      cart: safeCart(cart)
    };
  }

  await verifyCustomerPayment(cart, paymentIntentId);
  cart = await patchCart(cart, { status: "CommitInProgress" }, {
    workflow: { ...(payload.workflow || {}), step: "confirmation", commitStartedAt: new Date().toISOString() }
  });

  let airOrder = null;
  let stayBooking = null;
  try {
    // For packages, create the hotel first, then the airline. Persist each provider result
    // before moving on so an ambiguous provider response is never silently retried.
    if (hasStay(cart)) {
      stayBooking = await createStayBooking(cart);
      cart = await patchCart(cart, {}, {
        providerProgress: {
          ...(getPayload(cart).providerProgress || {}),
          stayBookingId: stayBooking.id,
          stayReference: stayBooking.reference || null,
          stayConfirmedAt: new Date().toISOString()
        }
      });
    }
    if (hasFlight(cart)) {
      airOrder = await createAirOrder(cart, paymentIntentId);
      cart = await patchCart(cart, {}, {
        providerProgress: {
          ...(getPayload(cart).providerProgress || {}),
          airOrderId: airOrder.id,
          airBookingReference: airOrder.booking_reference || null,
          airConfirmedAt: new Date().toISOString()
        }
      });
      attachAirOrderToPaymentIntent(paymentIntentId, airOrder.id).catch(() => {});
    }
  } catch (error) {
    await patchCart(cart, { status: "ManualReconciliationRequired" }, {
      bookingCommitError: {
        code: text(error?.code || error?.message || "PROVIDER_COMMIT_FAILED", 120),
        recordedAt: new Date().toISOString()
      }
    });
    throw error;
  }

  const bookingReference = cartReferenceFromProviders(airOrder, stayBooking, cart.cart_id);
  const travelDocuments = [];
  if (airOrder?.documents) {
    for (const document of airOrder.documents) {
      travelDocuments.push({
        id: document.id || null,
        type: document.type || "air",
        uniqueIdentifier: document.unique_identifier || null
      });
    }
  }

  cart = await patchCart(cart, { status: "Confirmed" }, {
    bookingReference,
    airOrder: airOrder ? {
      id: airOrder.id,
      bookingReference: airOrder.booking_reference || null,
      bookingReferences: airOrder.booking_references || [],
      totalAmount: airOrder.total_amount || null,
      totalCurrency: airOrder.total_currency || null
    } : null,
    stayBooking: stayBooking ? {
      id: stayBooking.id,
      reference: stayBooking.reference || null,
      status: stayBooking.status || "confirmed",
      checkInDate: stayBooking.check_in_date || null,
      checkOutDate: stayBooking.check_out_date || null
    } : null,
    travelDocuments,
    workflow: {
      ...(getPayload(cart).workflow || {}),
      step: "confirmation",
      confirmedAt: new Date().toISOString()
    }
  });

  return {
    ok: true,
    bookingReference,
    cart: safeCart(cart),
    airOrder: getPayload(cart).airOrder,
    stayBooking: getPayload(cart).stayBooking
  };
});

export const priceCachedOffer = webMethod(Permissions.Anyone, async ({ offerId } = {}) => {
  const offer = await retrieveFlightOffer(offerId);
  return {
    ok: true,
    provider: "SKANDI",
    offer: publicFlightSnapshot(offer)
  };
});
