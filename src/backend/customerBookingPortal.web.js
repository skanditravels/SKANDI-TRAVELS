import { webMethod, Permissions } from "wix-web-module";
import { currentMember } from "wix-members-backend";
import {
  sbInsert,
  sbSelect,
  sbUpdate,
  eq
} from "backend/supabaseClient";
import { duffelRequest } from "src/backend/duffelClient";

const T = {
  bookings: "altea_bookings",
  passengers: "altea_passengers",
  history: "altea_pnr_history",
  components: "altea_booking_components",
  documents: "altea_booking_documents",
  links: "customer_profiles_booking_links",
  inventory: "inventory_master_entities",
  dated: "inventory_dated_inventory",
  media: "inventory_media_assets"
};

const RECOMMENDATION_TYPES = new Set([
  "TRANSFER",
  "GUIDED_TOUR",
  "ACTIVITY",
  "PARTNER_TICKET",
  "PACKAGE",
  "ANCILLARY"
]);

const REMOVABLE_COMPONENT_STATUSES = new Set(["SELECTED", "REQUESTED"]);
const BOOKING_SELECT = [
  "id",
  "booking_reference",
  "pnr_locator",
  "booking_type",
  "product_type",
  "customer_member_id",
  "customer_email",
  "customer_name",
  "status",
  "payment_status",
  "fulfillment_status",
  "origin",
  "destination",
  "departure_date",
  "return_date",
  "currency",
  "total_amount",
  "tax_amount",
  "source_channel",
  "supplier",
  "supplier_order_id",
  "supplier_booking_reference",
  "ticketing_status",
  "payload",
  "created_at",
  "updated_at"
].join(",");

function clean(value, max = 5000) {
  return String(value ?? "").trim().slice(0, max);
}
function upper(value, max = 5000) {
  return clean(value, max).toUpperCase();
}
function lower(value, max = 5000) {
  return clean(value, max).toLowerCase();
}
function first(rows) {
  return Array.isArray(rows) && rows.length ? rows[0] : null;
}
function arr(value) {
  if (Array.isArray(value)) return value;
  return [];
}
function obj(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}
function bool(value) {
  return value === true || value === "true" || value === 1 || value === "1";
}
function num(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
function nowIso() {
  return new Date().toISOString();
}
function publicError(message, code = "CUSTOMER_BOOKING_ACTION_FAILED") {
  const error = new Error(message);
  error.code = code;
  error.publicMessage = message;
  return error;
}
function memberEmail(member = {}) {
  const emails = member?.contactDetails?.emails;
  const contactEmail = Array.isArray(emails) ? emails[0] : emails;
  return lower(member.loginEmail || contactEmail || member?.profile?.email || member.email || "", 254);
}
function memberLastName(member = {}) {
  return clean(member?.contactDetails?.lastName || member?.profile?.lastName || "", 120);
}
async function requireMember() {
  const member = await currentMember.getMember({ fieldsets: ["FULL"] }).catch(() => null);
  if (!member?._id) throw publicError("Sign in to view your trips.", "NOT_LOGGED_IN");
  return member;
}
function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(clean(value, 80));
}
function dateOnly(value) {
  const text = clean(value, 30);
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : "";
}
function safePayload(row = {}) {
  return obj(row.payload);
}
function safeAvailableActions(row = {}) {
  const values = arr(safePayload(row).availableActions)
    .map((value) => lower(value, 60))
    .filter((value) => /^[a-z0-9_-]{1,60}$/.test(value));
  return [...new Set(values)];
}
function maskedDocumentNumber(value = "") {
  const text = clean(value, 80);
  if (!text) return "";
  const last4 = text.slice(-4);
  return last4 ? `•••• ${last4}` : "";
}
function bookingReference(row = {}) {
  return clean(row.booking_reference || row.supplier_booking_reference || row.pnr_locator || row.id, 120);
}
function customerStatus(row = {}) {
  const status = lower(row.status, 40);
  if (status === "ticketed") return "Confirmed";
  if (status === "confirmed") return "Confirmed";
  if (status === "cancelled") return "Cancelled";
  if (status === "warning") return "Needs attention";
  if (["payment_pending", "payment_authorized", "priced", "cart", "draft"].includes(status)) return "In progress";
  return status ? status.replace(/_/g, " ") : "Booking";
}
function customerPaymentStatus(row = {}) {
  const value = lower(row.payment_status, 50);
  if (value === "paid" || value === "captured") return "Paid";
  if (value === "refunded") return "Refunded";
  if (value === "partially_refunded") return "Partially refunded";
  if (value === "unpaid") return "Unpaid";
  return value ? value.replace(/_/g, " ") : "Pending";
}
function daysUntil(date) {
  const d = Date.parse(`${dateOnly(date)}T00:00:00Z`);
  if (!Number.isFinite(d)) return null;
  return Math.ceil((d - Date.now()) / 86400000);
}
function tripPhase(row = {}) {
  const start = dateOnly(row.departure_date);
  const end = dateOnly(row.return_date || row.departure_date);
  const today = new Date().toISOString().slice(0, 10);
  if (lower(row.status) === "cancelled") return "cancelled";
  if (start && today < start) return "upcoming";
  if (start && end && today >= start && today <= end) return "current";
  if (end && today > end) return "past";
  return "upcoming";
}
function publicBooking(row = {}, passengerCount = 0, openTasks = 0) {
  const actions = safeAvailableActions(row);
  return {
    id: row.id,
    _id: row.id,
    bookingReference: bookingReference(row),
    airlineBookingReference: clean(row.supplier_booking_reference || row.pnr_locator, 80),
    pnr: clean(row.supplier_booking_reference || row.pnr_locator, 80),
    title: clean(safePayload(row).tripTitle || safePayload(row).title || `${row.origin || ""}${row.origin && row.destination ? " → " : ""}${row.destination || ""}` || "SKANDI Trip", 240),
    origin: upper(row.origin, 10),
    destination: upper(row.destination, 10),
    startDate: row.departure_date || "",
    endDate: row.return_date || "",
    departureDate: row.departure_date || "",
    returnDate: row.return_date || "",
    passengerCount: Number(passengerCount || 0),
    status: customerStatus(row),
    paymentStatus: customerPaymentStatus(row),
    fulfillmentStatus: clean(row.fulfillment_status, 80),
    ticketingStatus: clean(row.ticketing_status, 80),
    productType: clean(row.product_type, 80),
    phase: tripPhase(row),
    daysUntilDeparture: daysUntil(row.departure_date),
    currency: upper(row.currency || "USD", 3),
    totalAmount: num(row.total_amount, 0),
    openTasks: Number(openTasks || 0),
    canRequestChange: actions.includes("change") || actions.includes("change_order"),
    canCancel: actions.includes("cancel") || actions.includes("cancel_order"),
    path: `/my-profile?tab=trips&booking=${encodeURIComponent(row.id)}`,
    updatedAt: row.updated_at || ""
  };
}
function publicPassenger(row = {}) {
  return {
    id: row.id,
    passengerRef: clean(row.passenger_ref, 80),
    passengerType: clean(row.pax_type || "ADT", 20),
    firstName: clean(row.first_name, 120),
    lastName: clean(row.last_name, 120),
    displayName: clean(row.display_name || [row.first_name, row.last_name].filter(Boolean).join(" "), 240),
    dateOfBirth: row.date_of_birth || "",
    nationality: clean(row.nationality, 80),
    apisStatus: clean(row.apis_status || "not_started", 50),
    documentStatus: clean(row.document_status || "not_checked", 50),
    checkinStatus: clean(row.checkin_status || "not_checked_in", 50),
    seatNumber: clean(row.seat_number, 20),
    sequenceNumber: clean(row.sequence_number, 30)
  };
}
function publicComponent(row = {}) {
  const payload = obj(row.payload);
  return {
    id: row.id,
    componentType: upper(row.component_type, 50),
    supplier: upper(row.supplier || "SKANDI", 40),
    sourceEntityId: row.source_entity_id || "",
    title: clean(row.title, 240),
    status: upper(row.status, 50),
    quantity: Number(row.quantity || 1),
    currency: upper(row.currency || "USD", 3),
    unitAmount: num(row.unit_amount, 0),
    totalAmount: num(row.total_amount, 0),
    serviceDate: dateOnly(payload.serviceDate || payload.selectedServiceDate),
    requestOnly: bool(payload.requestOnly),
    customerAdded: payload.customerAdded === true,
    canRemove:
      upper(row.supplier || "SKANDI", 40) === "SKANDI" &&
      payload.customerAdded === true &&
      REMOVABLE_COMPONENT_STATUSES.has(upper(row.status, 50))
  };
}
function publicDocument(row = {}) {
  return {
    id: row.id,
    passengerId: row.passenger_id || "",
    provider: upper(row.provider || "SKANDI", 40),
    documentType: upper(row.document_type, 80),
    documentNumberMasked: maskedDocumentNumber(row.document_number),
    status: clean(row.status || "ACTIVE", 50),
    createdAt: row.created_at || ""
  };
}

async function bookingPassengers(bookingId) {
  return (await sbSelect(T.passengers, `select=*&${eq("booking_id", bookingId)}&order=created_at.asc&limit=100`)) || [];
}
async function bookingComponents(bookingId) {
  return (await sbSelect(T.components, `select=*&${eq("booking_id", bookingId)}&order=created_at.asc&limit=250`)) || [];
}
async function bookingDocuments(bookingId) {
  return (await sbSelect(T.documents, `select=*&${eq("booking_id", bookingId)}&order=created_at.desc&limit=250`)) || [];
}
async function linkedBookingIds(memberId) {
  const rows = (await sbSelect(T.links, `select=booking_id,status&${eq("member_id", memberId)}&limit=500`)) || [];
  return rows.filter((row) => row.booking_id && lower(row.status || "active") !== "removed").map((row) => row.booking_id);
}
async function insertHistory(booking, eventType, payload = {}) {
  try {
    await sbInsert(T.history, {
      booking_id: booking?.id || null,
      pnr_locator: bookingReference(booking),
      command: null,
      event_type: eventType,
      before_state: null,
      after_state: null,
      payload,
      created_by_agent_user_id: null,
      supplier: upper(booking?.supplier || "SKANDI", 40),
      created_at: nowIso()
    });
  } catch (_error) {}
}
async function upsertLink(member, booking, source, lastName = "") {
  const memberId = member._id;
  const existing = first(await sbSelect(
    T.links,
    `select=*&${eq("member_id", memberId)}&${eq("booking_id", booking.id)}&limit=1`
  ));
  const patch = {
    member_id: memberId,
    booking_id: booking.id,
    booking_reference: bookingReference(booking),
    last_name: clean(lastName, 120) || null,
    status: "Active",
    linked_at: existing?.linked_at || nowIso(),
    verified_at: nowIso(),
    link_source: clean(source, 50),
    payload: { ...(obj(existing?.payload)), source: clean(source, 50) },
    updated_at: nowIso()
  };
  if (existing?.id) {
    const rows = await sbUpdate(T.links, eq("id", existing.id), patch);
    return rows?.[0] || { ...existing, ...patch };
  }
  const rows = await sbInsert(T.links, { ...patch, created_at: nowIso() });
  return rows?.[0] || patch;
}
async function autoLinkBookings(member) {
  const memberId = member._id;
  const email = memberEmail(member);
  const linked = new Set(await linkedBookingIds(memberId));

  const directlyOwned = (await sbSelect(
    T.bookings,
    `select=${BOOKING_SELECT}&${eq("customer_member_id", memberId)}&order=departure_date.desc&limit=500`
  )) || [];
  for (const row of directlyOwned) {
    linked.add(row.id);
    await upsertLink(member, row, "member_id").catch(() => null);
  }

  if (email) {
    const emailMatches = (await sbSelect(
      T.bookings,
      `select=${BOOKING_SELECT}&${eq("customer_email", email)}&order=created_at.desc&limit=100`
    )) || [];
    for (const row of emailMatches) {
      if (row.customer_member_id && row.customer_member_id !== memberId) continue;
      if (!row.customer_member_id) {
        await sbUpdate(T.bookings, eq("id", row.id), {
          customer_member_id: memberId,
          updated_at: nowIso()
        });
        row.customer_member_id = memberId;
        await insertHistory(row, "CUSTOMER_AUTO_LINKED", { memberId, linkSource: "verified_login_email" });
      }
      linked.add(row.id);
      await upsertLink(member, row, "verified_login_email").catch(() => null);
    }
  }
  return linked;
}
async function ownedBookings(member) {
  const linked = await autoLinkBookings(member);
  if (!linked.size) return [];
  const all = (await sbSelect(T.bookings, `select=${BOOKING_SELECT}&order=departure_date.desc&limit=1000`)) || [];
  return all.filter((row) => linked.has(row.id) && (!row.customer_member_id || row.customer_member_id === member._id));
}
async function requireOwnedBooking(member, bookingId) {
  const id = clean(bookingId, 80);
  if (!isUuid(id)) throw publicError("This trip could not be found.", "BOOKING_NOT_FOUND");
  const rows = await ownedBookings(member);
  const booking = rows.find((row) => row.id === id);
  if (!booking) throw publicError("This trip could not be found in your account.", "BOOKING_NOT_FOUND");
  return booking;
}
function openTaskCount(passengers = []) {
  let count = 0;
  for (const passenger of passengers) {
    if (!["complete", "completed", "verified", "ok"].includes(lower(passenger.apis_status, 50))) count += 1;
    if (["required", "failed", "manual_review", "not_checked"].includes(lower(passenger.document_status, 50))) count += 1;
  }
  return count;
}
async function bookingSummaries(rows) {
  const out = [];
  for (const row of rows) {
    const passengers = await bookingPassengers(row.id);
    out.push(publicBooking(row, passengers.length, openTaskCount(passengers)));
  }
  return out.sort((a, b) => {
    const phases = { current: 0, upcoming: 1, past: 2, cancelled: 3 };
    const phaseDelta = (phases[a.phase] ?? 9) - (phases[b.phase] ?? 9);
    if (phaseDelta) return phaseDelta;
    return String(a.startDate || "").localeCompare(String(b.startDate || ""));
  });
}

function destinationCodes(booking, destinationEntities = []) {
  const codes = new Set([
    upper(booking.destination, 10),
    upper(safePayload(booking).destinationIata, 10),
    upper(safePayload(booking).searchAirportIata, 10)
  ].filter(Boolean));
  const destinationEntity = destinationEntities.find((entity) => {
    const details = obj(entity.details);
    return codes.has(upper(entity.code, 10)) || codes.has(upper(details.searchAirportIata, 10));
  }) || null;
  if (destinationEntity) {
    codes.add(upper(destinationEntity.code, 10));
    codes.add(upper(obj(destinationEntity.details).searchAirportIata, 10));
  }
  return { codes, destinationEntity };
}
function inventoryMatchesDestination(entity, context) {
  const details = obj(entity.details);
  const ids = [entity.parent_entity_id, details.destinationId, details.areaId].filter(Boolean);
  if (context.destinationEntity && ids.includes(context.destinationEntity.id)) return true;
  const codes = [details.searchAirportIata, details.destinationIata, details.airportIata]
    .map((value) => upper(value, 10))
    .filter(Boolean);
  return codes.some((code) => context.codes.has(code));
}
async function mediaForEntities(ids = []) {
  if (!ids.length) return new Map();
  const rows = (await sbSelect(T.media, "select=entity_id,url,is_primary,is_card,is_hero,sort_order,active&active=eq.true&order=sort_order.asc&limit=2000")) || [];
  const wanted = new Set(ids);
  const map = new Map();
  for (const row of rows) {
    if (!wanted.has(row.entity_id) || !row.url) continue;
    if (!map.has(row.entity_id)) map.set(row.entity_id, []);
    map.get(row.entity_id).push(row);
  }
  return map;
}
async function datedAvailability(entityId, booking) {
  const from = dateOnly(booking.departure_date);
  const to = dateOnly(booking.return_date || booking.departure_date);
  let query = `select=*&${eq("entity_id", entityId)}&order=service_date.asc&limit=500`;
  if (from) query += `&service_date=gte.${encodeURIComponent(from)}`;
  if (to) query += `&service_date=lte.${encodeURIComponent(to)}`;
  return (await sbSelect(T.dated, query)) || [];
}
function candidateImage(rows = []) {
  return clean(
    rows.find((row) => row.is_card)?.url ||
    rows.find((row) => row.is_hero)?.url ||
    rows.find((row) => row.is_primary)?.url ||
    rows[0]?.url || "",
    2000
  );
}
function recommendationPriority(entityType, hasHotel, hasTransfer) {
  if (entityType === "TRANSFER" && !hasTransfer) return 10;
  if (entityType === "ACTIVITY") return 30;
  if (entityType === "GUIDED_TOUR") return 31;
  if (entityType === "PARTNER_TICKET") return 32;
  if (entityType === "ANCILLARY") return 50;
  if (entityType === "PACKAGE") return 60;
  if (entityType === "TRANSFER") return 71;
  return 100;
}
async function recommendationsForBooking(booking, components) {
  const inventory = (await sbSelect(
    T.inventory,
    "select=id,public_id,entity_type,code,name,slug,parent_entity_id,details,commercial,operations,sort_priority&status=eq.PUBLISHED&active=eq.true&customer_visible=eq.true&order=sort_priority.asc&limit=2000"
  )) || [];
  const destinationEntities = inventory.filter((row) => row.entity_type === "DESTINATION");
  const context = destinationCodes(booking, destinationEntities);
  if (!context.codes.size && !context.destinationEntity) return [];

  const existingEntityIds = new Set(components.map((row) => row.source_entity_id).filter(Boolean));
  const hasHotel = components.some((row) => upper(row.component_type, 40) === "HOTEL" && upper(row.status, 40) !== "REMOVED") || upper(booking.product_type, 80).includes("HOTEL") || upper(booking.product_type, 80).includes("PACKAGE");
  const hasTransfer = components.some((row) => upper(row.component_type, 40) === "TRANSFER" && upper(row.status, 40) !== "REMOVED") || upper(booking.product_type, 80) === "TRANSFER_ONLY";

  const candidates = inventory.filter((entity) =>
    RECOMMENDATION_TYPES.has(entity.entity_type) &&
    !existingEntityIds.has(entity.id) &&
    inventoryMatchesDestination(entity, context)
  );
  const mediaMap = await mediaForEntities(candidates.map((row) => row.id));
  const recommendations = [];

  for (const entity of candidates) {
    const operations = obj(entity.operations);
    const commercial = obj(entity.commercial);
    const details = obj(entity.details);
    const dated = await datedAvailability(entity.id, booking).catch(() => []);
    const openDated = dated.filter((row) =>
      upper(row.status, 40) === "OPEN" &&
      row.stop_sale !== true &&
      row.blackout !== true &&
      Number(row.available || 0) > 0
    );
    const hasDatedRows = dated.length > 0;
    const requestOnly = operations.requestOnly === true || operations.bookingAvailable === false;
    if (hasDatedRows && !openDated.length && !requestOnly) continue;

    const priceRow = openDated.find((row) => Number(row.public_price || row.adult_price || 0) > 0) || openDated[0] || null;
    const publicPrice = num(priceRow?.public_price || priceRow?.adult_price || commercial.publicPrice, 0);
    const currency = upper(priceRow?.currency || commercial.currency || booking.currency || "USD", 3);
    const serviceDate = dateOnly(priceRow?.service_date || booking.departure_date);
    const actionMode = requestOnly ? "REQUEST" : publicPrice > 0 ? "ADD" : "REQUEST";
    recommendations.push({
      entityId: entity.id,
      publicId: entity.public_id,
      entityType: entity.entity_type,
      title: clean(entity.name, 240),
      slug: clean(entity.slug, 240),
      imageUrl: candidateImage(mediaMap.get(entity.id) || []),
      summary: clean(details.shortDescription || details.description || details.summary || "", 800),
      serviceDate,
      currency,
      price: publicPrice,
      requestOnly,
      actionMode,
      bookingAvailable: operations.bookingAvailable === true,
      availability: hasDatedRows ? openDated.reduce((sum, row) => sum + Number(row.available || 0), 0) : null,
      priority: recommendationPriority(entity.entity_type, hasHotel, hasTransfer),
      path: entity.entity_type === "TRANSFER"
        ? "/transfers"
        : ["ACTIVITY", "GUIDED_TOUR", "PARTNER_TICKET"].includes(entity.entity_type)
          ? "/tours"
          : "/my-profile?tab=trips"
    });
  }

  return recommendations
    .sort((a, b) => a.priority - b.priority || a.title.localeCompare(b.title))
    .slice(0, 24);
}

function liveSupplierRecommendations(booking, components) {
  const activeTypes = new Set(components
    .filter(row => upper(row.status, 40) !== "REMOVED")
    .map(row => upper(row.component_type, 40)));
  const productType = upper(booking.product_type, 80);
  const hasHotel = activeTypes.has("HOTEL") || productType === "HOTEL_ONLY" || productType.includes("PACKAGE");
  const hasCar = activeTypes.has("CAR_RENTAL") || productType === "CAR_RENTAL_ONLY";
  const destination = clean(booking.destination || booking.payload?.search?.destination || "", 160);
  const origin = clean(booking.origin || booking.payload?.search?.origin || "", 160);
  const from = dateOnly(booking.departure_date);
  const to = dateOnly(booking.return_date || booking.departure_date);
  const base = [];
  if (!hasHotel && destination && from && to && to > from) {
    const q = new URLSearchParams({ destination, checkIn: from, checkOut: to, bookingId: booking.id, adults: "2", rooms: "1" });
    base.push({
      entityId: "DUFFEL_STAYS_LIVE", publicId: "DUFFEL_STAYS_LIVE", entityType: "HOTEL",
      title: `Find a stay in ${destination}`, imageUrl: "",
      summary: "Live accommodation availability and current room rates for your actual trip dates.",
      serviceDate: from, currency: upper(booking.currency || "USD",3), price: 0,
      requestOnly: false, actionMode: "LIVE_SEARCH", bookingAvailable: true, availability: null,
      priority: 18, supplier: "DUFFEL", path: `/hotels?${q.toString()}`
    });
  }
  if (!hasCar && destination && from && to) {
    const pickup = destination || origin;
    const q = new URLSearchParams({ pickupLocationText: pickup, dropoffLocationText: pickup, pickupDate: from, dropoffDate: to, pickupTime: "10:00", dropoffTime: "10:00", driverAge: "30", residenceCountry: "US", bookingId: booking.id });
    base.push({
      entityId: "DUFFEL_CARS_LIVE", publicId: "DUFFEL_CARS_LIVE", entityType: "CAR_RENTAL",
      title: `Rent a car in ${destination}`, imageUrl: "",
      summary: "Live Duffel car availability matched to this trip. Final rate and payment requirements are confirmed before booking.",
      serviceDate: from, currency: upper(booking.currency || "USD",3), price: 0,
      requestOnly: false, actionMode: "LIVE_SEARCH", bookingAvailable: true, availability: null,
      priority: 40, supplier: "DUFFEL", path: `/car-rental?${q.toString()}`
    });
  }
  return base;
}

async function detailForBooking(member, booking) {
  const [passengers, components, documents] = await Promise.all([
    bookingPassengers(booking.id),
    bookingComponents(booking.id),
    bookingDocuments(booking.id)
  ]);
  const localRecommendations = await recommendationsForBooking(booking, components);
  const recommendations = [...liveSupplierRecommendations(booking, components), ...localRecommendations]
    .sort((a,b) => Number(a.priority||100)-Number(b.priority||100))
    .slice(0,24);
  const summary = publicBooking(booking, passengers.length, openTaskCount(passengers));
  return {
    ...summary,
    passengers: passengers.map(publicPassenger),
    components: components.filter((row) => upper(row.status, 50) !== "REMOVED").map(publicComponent),
    documents: documents.map(publicDocument),
    recommendations,
    tasks: passengers.flatMap((passenger) => {
      const out = [];
      const name = clean(passenger.display_name || `${passenger.first_name || ""} ${passenger.last_name || ""}`.trim(), 180) || "Traveler";
      if (!["complete", "completed", "verified", "ok"].includes(lower(passenger.apis_status, 50))) {
        out.push({ type: "APIS", title: `Passenger information required for ${name}`, path: "/booking?step=apis" });
      }
      if (["required", "failed", "manual_review", "not_checked"].includes(lower(passenger.document_status, 50))) {
        out.push({ type: "DOCUMENT", title: `Travel document review for ${name}`, path: "/my-profile?tab=documents" });
      }
      return out;
    }),
    supplierActions: {
      canRequestChange: summary.canRequestChange,
      canCancel: summary.canCancel,
      airlineExtrasManagedBySupplier: upper(booking.supplier, 40) === "DUFFEL"
    }
  };
}

async function findClaimBooking(reference) {
  const ref = upper(reference, 120);
  if (!ref || !/^[A-Z0-9-]{2,120}$/.test(ref)) return null;
  const fields = ["booking_reference", "supplier_booking_reference", "pnr_locator"];
  for (const field of fields) {
    const rows = await sbSelect(T.bookings, `select=${BOOKING_SELECT}&${eq(field, ref)}&limit=5`).catch(() => []);
    const row = first(rows);
    if (row) return row;
  }
  return null;
}

export const getCustomerBookingHubState = webMethod(Permissions.SiteMember, async () => {
  const member = await requireMember();
  const bookings = await ownedBookings(member);
  const summaries = await bookingSummaries(bookings);
  return {
    ok: true,
    bookingHubVersion: "2026-09-07-duffel-flights-stays-cars",
    bookings: summaries,
    trips: summaries,
    counts: {
      upcoming: summaries.filter((item) => item.phase === "upcoming").length,
      current: summaries.filter((item) => item.phase === "current").length,
      past: summaries.filter((item) => item.phase === "past").length,
      needsAttention: summaries.filter((item) => item.openTasks > 0).length
    }
  };
});

export const getCustomerBookingDetail = webMethod(Permissions.SiteMember, async ({ bookingId = "" } = {}) => {
  const member = await requireMember();
  const booking = await requireOwnedBooking(member, bookingId);
  return { ok: true, booking: await detailForBooking(member, booking) };
});

export const claimCustomerBooking = webMethod(Permissions.SiteMember, async ({ bookingReference: reference = "", lastName = "" } = {}) => {
  const member = await requireMember();
  const booking = await findClaimBooking(reference);
  const submittedLastName = lower(lastName, 120);
  if (!booking || !submittedLastName) {
    throw publicError("We could not verify that booking with those details.", "BOOKING_CLAIM_FAILED");
  }
  if (booking.customer_member_id && booking.customer_member_id !== member._id) {
    throw publicError("We could not verify that booking with those details.", "BOOKING_CLAIM_FAILED");
  }
  const passengers = await bookingPassengers(booking.id);
  const matches = passengers.some((passenger) => lower(passenger.last_name, 120) === submittedLastName);
  if (!matches) {
    throw publicError("We could not verify that booking with those details.", "BOOKING_CLAIM_FAILED");
  }
  await sbUpdate(T.bookings, eq("id", booking.id), {
    customer_member_id: member._id,
    customer_email: booking.customer_email || memberEmail(member) || null,
    updated_at: nowIso()
  });
  booking.customer_member_id = member._id;
  await upsertLink(member, booking, "booking_reference_last_name", lastName);
  await insertHistory(booking, "CUSTOMER_BOOKING_CLAIMED", {
    memberId: member._id,
    verification: "booking_reference_last_name"
  });
  return { ok: true, booking: await detailForBooking(member, booking) };
});

export const addCustomerTripExtra = webMethod(Permissions.SiteMember, async ({ bookingId = "", entityId = "", quantity = 1, serviceDate = "" } = {}) => {
  const member = await requireMember();
  const booking = await requireOwnedBooking(member, bookingId);
  const id = clean(entityId, 80);
  if (["DUFFEL_STAYS_LIVE", "DUFFEL_CARS_LIVE"].includes(id)) {
    throw publicError("LIVE_SUPPLIER_SEARCH_REQUIRED", "Hotels and car rentals are booked from live Duffel availability. Open the live search from My Trips instead.");
  }
  if (!isUuid(id)) throw publicError("That trip extra is not available.", "EXTRA_NOT_AVAILABLE");
  const components = await bookingComponents(booking.id);
  if (components.some((row) => row.source_entity_id === id && upper(row.status, 40) !== "REMOVED")) {
    throw publicError("That extra is already attached to this trip.", "EXTRA_ALREADY_ADDED");
  }
  const recommendations = await recommendationsForBooking(booking, components);
  const recommendation = recommendations.find((item) => item.entityId === id);
  if (!recommendation) throw publicError("That trip extra is not available for this booking.", "EXTRA_NOT_AVAILABLE");

  const q = Math.min(Math.max(Math.round(Number(quantity || 1)), 1), 9);
  const selectedDate = dateOnly(serviceDate || recommendation.serviceDate);
  const status = recommendation.requestOnly ? "REQUESTED" : "SELECTED";
  const rows = await sbInsert(T.components, {
    booking_id: booking.id,
    component_type: recommendation.entityType,
    supplier: "SKANDI",
    source_entity_id: recommendation.entityId,
    supplier_reference: null,
    title: recommendation.title,
    status,
    quantity: q,
    currency: recommendation.currency,
    unit_amount: recommendation.price,
    total_amount: recommendation.price * q,
    payload: {
      customerAdded: true,
      addedBy: "customer-portal",
      addedAt: nowIso(),
      inventoryPublicId: recommendation.publicId,
      requestOnly: recommendation.requestOnly,
      serviceDate: selectedDate || null,
      customerActionMode: recommendation.actionMode
    },
    created_by_agent_user_id: null,
    created_at: nowIso(),
    updated_at: nowIso()
  });
  const component = first(rows);
  await insertHistory(booking, "CUSTOMER_TRIP_EXTRA_ADDED", {
    componentId: component?.id || null,
    entityId: recommendation.entityId,
    entityType: recommendation.entityType,
    status
  });
  return {
    ok: true,
    message: recommendation.requestOnly
      ? `${recommendation.title} request added to your trip.`
      : `${recommendation.title} added to your trip. Complete any required payment or confirmation shown in My Trips.`,
    booking: await detailForBooking(member, booking)
  };
});

export const removeCustomerTripExtra = webMethod(Permissions.SiteMember, async ({ bookingId = "", componentId = "" } = {}) => {
  const member = await requireMember();
  const booking = await requireOwnedBooking(member, bookingId);
  const id = clean(componentId, 80);
  if (!isUuid(id)) throw publicError("That trip extra could not be removed.", "EXTRA_REMOVE_NOT_ALLOWED");
  const row = first(await sbSelect(T.components, `select=*&${eq("id", id)}&${eq("booking_id", booking.id)}&limit=1`));
  const payload = obj(row?.payload);
  if (
    !row ||
    upper(row.supplier || "SKANDI", 40) !== "SKANDI" ||
    payload.customerAdded !== true ||
    !REMOVABLE_COMPONENT_STATUSES.has(upper(row.status, 50))
  ) {
    throw publicError("This trip item can no longer be removed online.", "EXTRA_REMOVE_NOT_ALLOWED");
  }
  await sbUpdate(T.components, eq("id", id), {
    status: "REMOVED",
    payload: { ...payload, removedBy: "customer-portal", removedAt: nowIso() },
    updated_at: nowIso()
  });
  await insertHistory(booking, "CUSTOMER_TRIP_EXTRA_REMOVED", { componentId: id });
  return { ok: true, message: "Trip extra removed.", booking: await detailForBooking(member, booking) };
});

export const quoteCustomerAirCancellation = webMethod(Permissions.SiteMember, async ({ bookingId = "" } = {}) => {
  const member = await requireMember();
  const booking = await requireOwnedBooking(member, bookingId);
  if (upper(booking.supplier, 40) !== "DUFFEL") {
    throw publicError("Online airline cancellation is not available for this booking.", "CANCELLATION_NOT_AVAILABLE");
  }
  const orderId = clean(booking.supplier_order_id, 160);
  if (!/^ord_[A-Za-z0-9_-]+$/.test(orderId)) {
    throw publicError("This airline booking cannot be cancelled online yet.", "CANCELLATION_NOT_AVAILABLE");
  }
  const orderResponse = await duffelRequest(`/air/orders/${encodeURIComponent(orderId)}`);
  const order = orderResponse.data || {};
  const availableActions = arr(order.available_actions).map((value) => lower(value, 60));
  if (!availableActions.includes("cancel") && !availableActions.includes("cancel_order")) {
    throw publicError("The airline does not currently allow online cancellation for this booking.", "CANCELLATION_NOT_AVAILABLE");
  }
  const response = await duffelRequest("/air/order_cancellations", {
    method: "POST",
    body: { data: { order_id: orderId } }
  });
  const cancellation = response.data || {};
  await insertHistory(booking, "CUSTOMER_CANCELLATION_QUOTED", {
    cancellationId: cancellation.id || null,
    refundAmount: cancellation.refund_amount || "0",
    refundCurrency: cancellation.refund_currency || booking.currency || ""
  });
  return {
    ok: true,
    quote: {
      id: clean(cancellation.id, 160),
      refundAmount: num(cancellation.refund_amount, 0),
      refundCurrency: upper(cancellation.refund_currency || booking.currency || "USD", 3),
      expiresAt: cancellation.expires_at || "",
      paidBooking: ["paid", "captured"].includes(lower(booking.payment_status, 40))
    }
  };
});

export const confirmCustomerAirCancellation = webMethod(Permissions.SiteMember, async ({ bookingId = "", cancellationId = "" } = {}) => {
  const member = await requireMember();
  const booking = await requireOwnedBooking(member, bookingId);
  if (upper(booking.supplier, 40) !== "DUFFEL") {
    throw publicError("Online airline cancellation is not available for this booking.", "CANCELLATION_NOT_AVAILABLE");
  }
  const id = clean(cancellationId, 160);
  if (!id) throw publicError("The cancellation quote is missing.", "CANCELLATION_QUOTE_REQUIRED");
  const quoteResponse = await duffelRequest(`/air/order_cancellations/${encodeURIComponent(id)}`);
  const quote = quoteResponse.data || {};
  if (clean(quote.order_id, 160) !== clean(booking.supplier_order_id, 160)) {
    throw publicError("The cancellation quote does not belong to this booking.", "CANCELLATION_NOT_ALLOWED");
  }
  const refundAmount = num(quote.refund_amount, 0);
  const paidBooking = ["paid", "captured"].includes(lower(booking.payment_status, 40));

  // Do not cancel the supplier order before SKANDI can safely reconcile a paid customer refund.
  if (paidBooking && refundAmount > 0) {
    await insertHistory(booking, "CUSTOMER_CANCELLATION_REQUESTED", {
      cancellationId: id,
      refundAmount,
      refundCurrency: quote.refund_currency || booking.currency || "",
      requiresPaymentRefund: true
    });
    return {
      ok: true,
      requiresStaffRefund: true,
      message: "Your cancellation request has been submitted. SKANDI will finalize the airline cancellation together with the payment refund so the two stay in sync."
    };
  }

  const confirmed = await duffelRequest(
    `/air/order_cancellations/${encodeURIComponent(id)}/actions/confirm`,
    { method: "POST", body: { data: {} } }
  );
  await sbUpdate(T.bookings, eq("id", booking.id), {
    status: "cancelled",
    fulfillment_status: "cancelled",
    ticketing_status: "cancelled",
    updated_at: nowIso()
  });
  booking.status = "cancelled";
  booking.fulfillment_status = "cancelled";
  booking.ticketing_status = "cancelled";
  await insertHistory(booking, "CUSTOMER_CANCELLATION_CONFIRMED", {
    cancellationId: id,
    refundAmount,
    refundCurrency: quote.refund_currency || booking.currency || ""
  });
  return {
    ok: true,
    requiresStaffRefund: false,
    message: "Your airline booking has been cancelled.",
    cancellation: {
      id: clean(confirmed.data?.id || id, 160),
      refundAmount,
      refundCurrency: upper(quote.refund_currency || booking.currency || "USD", 3)
    },
    booking: await detailForBooking(member, booking)
  };
});
