// /src/backend/SKANDI_CORE/reservationsExperience.js
// SKANDI ALTEA Reservations v12 — Amadeus-style reservation experience helpers.
// Canonical data ownership: Duffel reference imports -> Inventory Control/Supabase -> ALTEA Reservations.
// Live offers/orders remain provider transactions; this core only reads canonical Inventory reference/master data.

import { restRequest } from "backend/SKANDI_CORE/supabaseServer";
import { requireReservationsAccessCore } from "backend/SKANDI_CORE/reservations";

const ACTIVE = "eq.true";
const ALTEA_VISIBLE = "eq.true";

function clean(value, max = 1000) { return String(value ?? "").trim().slice(0, max); }
function upper(value, max = 1000) { return clean(value, max).toUpperCase(); }
function object(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
function array(value) { return Array.isArray(value) ? value : []; }
function qeq(value) { return `eq.${clean(value, 500)}`; }
function isUuid(value) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(clean(value, 80)); }
function error(code, message) { const e = new Error(code); e.code = code; e.publicMessage = message; return e; }

async function select(table, query = {}) {
  const rows = await restRequest({ table, method: "GET", query, prefer: "" });
  return Array.isArray(rows) ? rows : [];
}

function normalizeNeedle(value = "") {
  return clean(value, 160).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export async function searchReservationAirportsCore(input = {}) {
  await requireReservationsAccessCore();
  const queryText = clean(input.query, 120);
  const needle = normalizeNeedle(queryText);
  const field = clean(input.field, 30);
  if (needle.length < 2) return { ok: true, field, query: queryText, items: [] };

  // Airport facts come from the canonical Inventory-Control-owned reference table.
  const rows = await select("travel_info_airports", {
    select: "ID,iata,icao,title,locationCity,country,timezone,latitude,longitude,inventory_details,source,source_reference,status,active,altea_visible",
    active: ACTIVE,
    altea_visible: ALTEA_VISIBLE,
    order: "sort_order.asc,title.asc",
    limit: "1500"
  });

  const items = rows.map(row => {
    const details = object(row.inventory_details);
    const iata = upper(row.iata, 8);
    const icao = upper(row.icao, 12);
    const name = clean(row.title, 300);
    const city = clean(row.locationCity || details.city, 200);
    const country = clean(row.country || details.country || details.countryCode, 160);
    const values = [iata, icao, name, city, country];
    const normalized = values.map(normalizeNeedle);
    let rank = 0;
    if (normalizeNeedle(iata) === needle) rank += 1000;
    if (normalizeNeedle(icao) === needle) rank += 900;
    if (normalizeNeedle(iata).startsWith(needle)) rank += 700;
    if (normalizeNeedle(city).startsWith(needle)) rank += 500;
    if (normalizeNeedle(name).startsWith(needle)) rank += 450;
    if (normalized.some(v => v.includes(needle))) rank += 200;
    return {
      id: clean(row.ID, 100), iata, icao, name, city, country,
      timezone: clean(row.timezone || details.timezone, 160),
      latitude: row.latitude ?? details.latitude ?? null,
      longitude: row.longitude ?? details.longitude ?? null,
      source: clean(row.source, 120), sourceReference: clean(row.source_reference, 800), rank
    };
  }).filter(item => item.rank > 0)
    .sort((a, b) => b.rank - a.rank || a.iata.localeCompare(b.iata))
    .slice(0, 12)
    .map(({ rank, ...item }) => item);

  return { ok: true, field, query: queryText, items };
}

function finalFlightDestination(booking = {}) {
  const payload = object(booking.payload);
  const offer = object(payload.offer || payload.selectedOffer || payload.duffelOffer);
  const order = object(payload.order || payload.duffelOrder);
  const slices = array(order.slices).length ? array(order.slices) : array(offer.slices);
  const lastSlice = slices[slices.length - 1] || {};
  const segments = array(lastSlice.segments);
  const lastSegment = segments[segments.length - 1] || {};
  return upper(
    lastSegment?.destination?.iataCode || lastSegment?.destination?.iata_code ||
    lastSlice?.destination?.iataCode || lastSlice?.destination?.iata_code ||
    booking.destination,
    8
  );
}

function inventoryMatch(item = {}, context = {}) {
  const details = object(item.details);
  const type = upper(item.entity_type, 40);
  const arrival = context.arrivalAirport;
  const destination = normalizeNeedle(context.destination);
  const haystack = normalizeNeedle([
    item.code, item.name, details.destination, details.destinationName, details.city,
    details.country, details.destinationCode, details.airportIata, details.searchAirportIata,
    details.nearestAirportIata, details.secondaryAirportIata
  ].filter(Boolean).join(" "));
  let score = 0;
  const reasons = [];
  const airportFields = [details.airportIata, details.searchAirportIata, details.nearestAirportIata, details.secondaryAirportIata].map(v => upper(v, 8));
  if (arrival && airportFields.includes(arrival)) {
    score += type === "TRANSFER" ? 1000 : 600;
    reasons.push(`Matches arrival airport ${arrival}`);
  }
  if (destination && haystack.includes(destination)) {
    score += type === "TRANSFER" ? 500 : 350;
    reasons.push(`Matches destination ${context.destination}`);
  }
  if (type === "TRANSFER" && arrival && upper(details.airportIata, 8) === arrival) score += 300;
  return { score, reasons };
}

export async function getReservationComponentSuggestionsCore(input = {}) {
  await requireReservationsAccessCore();
  const bookingId = clean(input.bookingId, 80);
  if (!isUuid(bookingId)) throw error("BOOKING_REQUIRED", "Open a booking before loading itinerary suggestions.");
  const booking = (await select("altea_bookings", { select: "*", id: qeq(bookingId), limit: "1" }))[0];
  if (!booking) throw error("BOOKING_NOT_FOUND", "The booking could not be found.");

  const arrivalAirport = finalFlightDestination(booking);
  const destination = clean(booking.destination, 160);
  const context = { arrivalAirport, destination, departureDate: clean(booking.departure_date, 20), returnDate: clean(booking.return_date, 20) };
  const rows = await select("inventory_master_entities", {
    select: "id,public_id,entity_type,code,name,status,active,staff_visible,altea_visible,sort_priority,details,commercial,operations,payload",
    entity_type: "in.(TRANSFER,HOTEL,GUIDED_TOUR,ACTIVITY,PARTNER_TICKET,CAR_RENTAL)",
    active: ACTIVE,
    altea_visible: ALTEA_VISIBLE,
    status: "eq.PUBLISHED",
    order: "sort_priority.asc,name.asc",
    limit: "2000"
  });

  const items = rows.map(row => {
    const match = inventoryMatch(row, context);
    const commercial = object(row.commercial);
    const details = object(row.details);
    return {
      id: row.id, entityId: row.id, publicId: row.public_id || "", entityType: upper(row.entity_type, 40),
      code: row.code || "", name: row.name || row.code || "", destination: details.destination || details.destinationName || details.city || "",
      airportIata: upper(details.airportIata || details.searchAirportIata, 8),
      publicPrice: commercial.publicPrice ?? commercial.oneWayPublicPrice ?? null,
      currency: upper(commercial.currency || details.currency || "", 8),
      priceBasis: commercial.priceBasis || "", reason: match.reasons.join(" · "), score: match.score
    };
  }).filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, 24);

  return { ok: true, bookingId, context, items };
}

export async function deleteUnconfirmedAlteaBookingCore(input = {}) {
  await requireReservationsAccessCore({ write: true });
  const bookingId = clean(input.bookingId || input.id, 80);
  if (!isUuid(bookingId)) throw error("BOOKING_REQUIRED", "Open the unconfirmed booking you want to delete.");
  const booking = (await select("altea_bookings", { select: "*", id: qeq(bookingId), limit: "1" }))[0];
  if (!booking) return { ok: true, bookingId, deleted: true, alreadyDeleted: true };

  const status = upper(booking.status, 40);
  const payment = upper(booking.payment_status, 40);
  const ticketing = upper(booking.ticketing_status, 40);
  const hasSupplierCommitment = Boolean(
    clean(booking.supplier_order_id) || clean(booking.supplier_booking_reference) || clean(booking.amadeus_order_id) ||
    clean(booking.fulfillment_reference) || clean(booking.payment_reference) || Number(booking.paid_amount || 0) > 0
  );
  const committedPayment = ["PAID", "CAPTURED", "AUTHORIZED", "SUCCEEDED", "SETTLED"].includes(payment);
  const ticketed = ticketing && !["PENDING", "NOT_TICKETED", "NONE", ""].includes(ticketing);
  if (!["DRAFT", "CART", "CREATED", "PRICED", "PENDING"].includes(status) || hasSupplierCommitment || committedPayment || ticketed) {
    throw error("BOOKING_DELETE_NOT_ALLOWED", "Only an unconfirmed booking file with no supplier booking, payment, fulfillment or ticket can be deleted.");
  }

  const [components, segments, documents] = await Promise.all([
    select("altea_booking_components", { select: "id,status,supplier_reference", booking_id: qeq(bookingId), limit: "500" }),
    select("altea_segments", { select: "id,status", booking_id: qeq(bookingId), limit: "500" }),
    select("altea_booking_documents", { select: "id,status", booking_id: qeq(bookingId), limit: "500" })
  ]);
  const liveComponents = components.filter(row => !["REMOVED", "CANCELLED", "CANCELED", "VOID"].includes(upper(row.status, 40)) || clean(row.supplier_reference));
  if (liveComponents.length || segments.length || documents.length) {
    throw error("BOOKING_DELETE_NOT_ALLOWED", "This booking file already contains a committed itinerary component or document and cannot be deleted as an empty draft.");
  }

  await restRequest({ table: "altea_bookings", method: "DELETE", query: { id: qeq(bookingId) }, prefer: "return=minimal" });
  return { ok: true, bookingId, reference: booking.booking_reference || booking.pnr_locator || bookingId, deleted: true };
}
