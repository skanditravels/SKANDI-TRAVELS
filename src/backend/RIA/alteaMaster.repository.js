import { getSecret } from "wix-secrets-backend";
import { fetch } from "wix-fetch";

const SUPABASE_URL_SECRET = "SUPABASE_URL";
const SUPABASE_KEY_SECRET = "SUPABASE_SERVICE_ROLE_KEY";

let cachedConfig = null;

async function getConfig() {
  if (cachedConfig) return cachedConfig;

  const url = String(await getSecret(SUPABASE_URL_SECRET) || "").replace(/\/$/, "");
  const key = String(await getSecret(SUPABASE_KEY_SECRET) || "");

  if (!url || !key) {
    throw new Error("Supabase secrets are missing.");
  }

  cachedConfig = { url, key };
  return cachedConfig;
}

async function supabaseRequest(path, options = {}) {
  const { url, key } = await getConfig();

  const response = await fetch(`${url}/rest/v1/${path}`, {
    method: options.method || "GET",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: options.prefer || "return=representation",
      ...(options.headers || {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(data?.message || data?.error || `Supabase request failed: ${response.status}`);
  }

  return data;
}

function cleanText(value, max = 180) {
  return String(value || "").trim().slice(0, max);
}

function cleanLocator(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8);
}

function cleanDate(value) {
  const text = String(value || "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
}

function money(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

export async function getAlteaDashboardSnapshot() {
  const today = new Date().toISOString().slice(0, 10);

  const [bookings, queue, flights, sync] = await Promise.all([
    supabaseRequest(
      "altea_bookings?select=id,booking_reference,pnr_locator,customer_name,status,payment_status,origin,destination,departure_date,total_amount,currency,created_at&order=created_at.desc&limit=30"
    ),
    supabaseRequest(
      "altea_queue_items?select=id,queue_number,queue_category,priority,title,status,pnr_locator,booking_reference,created_at&status=in.(open,working)&order=priority.asc,created_at.asc&limit=30"
    ),
    supabaseRequest(
      `altea_fids_flights?select=id,flight_key,flight_number,origin,destination,departure_date,scheduled_time,gate,status&departure_date=eq.${today}&order=scheduled_time.asc&limit=40`
    ),
    supabaseRequest(
      "altea_sync_events?select=id,source_system,event_type,status,message,created_at&order=created_at.desc&limit=20"
    )
  ]);

  return {
    bookings: bookings || [],
    queue: queue || [],
    flights: flights || [],
    sync: sync || [],
    stats: {
      activeBookings: (bookings || []).filter((b) =>
        ["draft", "cart", "priced", "payment_pending", "confirmed", "ticketed", "warning"].includes(b.status)
      ).length,
      openQueue: (queue || []).filter((q) => q.status === "open").length,
      workingQueue: (queue || []).filter((q) => q.status === "working").length,
      todayFlights: (flights || []).length,
      syncWarnings: (sync || []).filter((s) => s.status === "warning" || s.status === "failed").length
    }
  };
}

export async function searchAlteaBookings(query = "") {
  const q = cleanText(query, 80);

  if (!q) {
    return supabaseRequest(
      "altea_bookings?select=id,booking_reference,pnr_locator,customer_name,customer_email,status,payment_status,origin,destination,departure_date,total_amount,currency,created_at&order=created_at.desc&limit=50"
    );
  }

  const encoded = encodeURIComponent(`*${q}*`);

  return supabaseRequest(
    `altea_bookings?select=id,booking_reference,pnr_locator,customer_name,customer_email,status,payment_status,origin,destination,departure_date,total_amount,currency,created_at&or=(booking_reference.ilike.${encoded},pnr_locator.ilike.${encoded},customer_name.ilike.${encoded},customer_email.ilike.${encoded})&order=created_at.desc&limit=50`
  );
}

export async function getAlteaBookingDetails(bookingId) {
  const id = cleanText(bookingId, 80);
  if (!id) throw new Error("Missing booking ID.");

  const [bookingRows, passengers, segments, documents, history, queue] = await Promise.all([
    supabaseRequest(`altea_bookings?id=eq.${encodeURIComponent(id)}&select=*&limit=1`),
    supabaseRequest(`altea_passengers?booking_id=eq.${encodeURIComponent(id)}&select=*&order=created_at.asc`),
    supabaseRequest(`altea_segments?booking_id=eq.${encodeURIComponent(id)}&select=*&order=start_date.asc`),
    supabaseRequest(`altea_documents?booking_id=eq.${encodeURIComponent(id)}&select=*&order=created_at.desc`),
    supabaseRequest(`altea_pnr_history?booking_id=eq.${encodeURIComponent(id)}&select=*&order=created_at.desc&limit=80`),
    supabaseRequest(`altea_queue_items?booking_id=eq.${encodeURIComponent(id)}&select=*&order=created_at.desc`)
  ]);

  const booking = bookingRows?.[0] || null;
  if (!booking) throw new Error("Booking not found.");

  return {
    booking,
    passengers: passengers || [],
    segments: segments || [],
    documents: documents || [],
    history: history || [],
    queue: queue || []
  };
}

export async function createAlteaBookingDraft(input = {}, agentUserId = null) {
  const body = {
    booking_reference: cleanText(input.bookingReference || generateBookingReference(), 40),
    cart_id: cleanText(input.cartId, 80) || null,
    pnr_locator: cleanLocator(input.pnrLocator) || null,

    booking_type: cleanText(input.bookingType, 40) || "DRAFT",
    product_type: cleanText(input.productType, 40) || "FLIGHT_ONLY",

    customer_member_id: cleanText(input.customerMemberId, 80) || null,
    customer_email: cleanText(input.customerEmail, 180) || null,
    customer_name: cleanText(input.customerName, 180) || null,

    status: cleanText(input.status, 40) || "draft",
    payment_status: cleanText(input.paymentStatus, 40) || "unpaid",
    fulfillment_status: cleanText(input.fulfillmentStatus, 40) || "pending",

    origin: cleanText(input.origin, 10) || null,
    destination: cleanText(input.destination, 10) || null,
    departure_date: cleanDate(input.departureDate),
    return_date: cleanDate(input.returnDate),

    currency: cleanText(input.currency, 8) || "SEK",
    total_amount: money(input.totalAmount),
    tax_amount: money(input.taxAmount),

    source_page: cleanText(input.sourcePage, 120) || "riaintra-altea",
    source_channel: cleanText(input.sourceChannel, 80) || "riaintra-altea",

    created_by_agent_user_id: agentUserId || null,
    assigned_agent_user_id: agentUserId || null,

    payload: input.payload || {}
  };

  const rows = await supabaseRequest("altea_bookings", {
    method: "POST",
    body
  });

  const booking = rows?.[0];

  if (booking?.id) {
    await insertPnrHistory({
      bookingId: booking.id,
      pnrLocator: booking.pnr_locator,
      eventType: "booking_draft_created",
      afterState: booking,
      agentUserId
    });
  }

  return booking || null;
}

export async function updateAlteaBooking(bookingId, input = {}, agentUserId = null) {
  const id = cleanText(bookingId, 80);
  if (!id) throw new Error("Missing booking ID.");

  const body = {
    customer_email: cleanText(input.customerEmail, 180) || null,
    customer_name: cleanText(input.customerName, 180) || null,
    status: cleanText(input.status, 40) || "draft",
    payment_status: cleanText(input.paymentStatus, 40) || "unpaid",
    fulfillment_status: cleanText(input.fulfillmentStatus, 40) || "pending",
    origin: cleanText(input.origin, 10) || null,
    destination: cleanText(input.destination, 10) || null,
    departure_date: cleanDate(input.departureDate),
    return_date: cleanDate(input.returnDate),
    currency: cleanText(input.currency, 8) || "SEK",
    total_amount: money(input.totalAmount),
    tax_amount: money(input.taxAmount),
    assigned_agent_user_id: input.assignedAgentUserId || agentUserId || null,
    payload: input.payload || {}
  };

  const rows = await supabaseRequest(`altea_bookings?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    body
  });

  const booking = rows?.[0];

  if (booking?.id) {
    await insertPnrHistory({
      bookingId: booking.id,
      pnrLocator: booking.pnr_locator,
      eventType: "booking_updated",
      afterState: booking,
      agentUserId
    });
  }

  return booking || null;
}

export async function upsertAlteaPassengers(bookingId, passengers = []) {
  const id = cleanText(bookingId, 80);
  if (!id) throw new Error("Missing booking ID.");

  await supabaseRequest(`altea_passengers?booking_id=eq.${encodeURIComponent(id)}`, {
    method: "DELETE",
    prefer: "return=minimal"
  });

  const body = passengers.map((p, index) => ({
    booking_id: id,
    passenger_ref: cleanText(p.passengerRef || `P${index + 1}`, 20),
    pax_type: cleanText(p.paxType, 8) || "ADT",
    first_name: cleanText(p.firstName, 100) || null,
    last_name: cleanText(p.lastName, 100) || null,
    display_name: cleanText(
      p.displayName || [p.firstName, p.lastName].filter(Boolean).join(" "),
      180
    ) || null,
    gender: cleanText(p.gender, 20) || null,
    date_of_birth: cleanDate(p.dateOfBirth),
    nationality: cleanText(p.nationality, 10) || null,
    passport_hash: p.passportHash || null,
    passport_last4: p.passportLast4 || null,
    passport_encrypted: p.passportEncrypted || null,
    apis_status: cleanText(p.apisStatus, 40) || "not_started",
    document_status: cleanText(p.documentStatus, 40) || "not_checked",
    checkin_status: cleanText(p.checkinStatus, 40) || "not_checked_in",
    seat_number: cleanText(p.seatNumber, 10) || null,
    sequence_number: cleanText(p.sequenceNumber, 20) || null,
    payload: p.payload || {}
  }));

  if (!body.length) return [];

  return supabaseRequest("altea_passengers", {
    method: "POST",
    body
  });
}

export async function upsertAlteaSegments(bookingId, segments = []) {
  const id = cleanText(bookingId, 80);
  if (!id) throw new Error("Missing booking ID.");

  await supabaseRequest(`altea_segments?booking_id=eq.${encodeURIComponent(id)}`, {
    method: "DELETE",
    prefer: "return=minimal"
  });

  const body = segments.map((s) => ({
    booking_id: id,
    segment_type: cleanText(s.segmentType, 30) || "flight",
    segment_ref: cleanText(s.segmentRef, 40) || null,
    supplier_code: cleanText(s.supplierCode, 40) || null,
    supplier_name: cleanText(s.supplierName, 160) || null,
    status: cleanText(s.status, 40) || "holding",
    origin: cleanText(s.origin, 10) || null,
    destination: cleanText(s.destination, 10) || null,
    start_date: cleanDate(s.startDate),
    end_date: cleanDate(s.endDate),
    start_time: cleanText(s.startTime, 12) || null,
    end_time: cleanText(s.endTime, 12) || null,
    flight_number: cleanText(s.flightNumber, 20) || null,
    cabin_class: cleanText(s.cabinClass, 40) || null,
    booking_class: cleanText(s.bookingClass, 10) || null,
    hotel_name: cleanText(s.hotelName, 180) || null,
    room_type: cleanText(s.roomType, 120) || null,
    board_basis: cleanText(s.boardBasis, 80) || null,
    transfer_type: cleanText(s.transferType, 80) || null,
    excursion_name: cleanText(s.excursionName, 180) || null,
    quantity: Number(s.quantity || 1),
    currency: cleanText(s.currency, 8) || "SEK",
    unit_amount: money(s.unitAmount),
    total_amount: money(s.totalAmount),
    payload: s.payload || {}
  }));

  if (!body.length) return [];

  return supabaseRequest("altea_segments", {
    method: "POST",
    body
  });
}
export async function getOfferCacheByCacheId(offerCacheId) {
  const id = cleanText(offerCacheId, 120);

  if (!id) {
    throw new Error("Missing offer cache ID.");
  }

  const rows = await supabaseRequest(
    `altea_offer_cache?offer_cache_id=eq.${encodeURIComponent(id)}&select=*&limit=1`
  );

  return rows?.[0] || null;
}
export async function saveOfferCache(input = {}, agentUserId = null) {
  const body = {
    offer_cache_id: cleanText(input.offerCacheId || cryptoId("OFC"), 80),
    source: cleanText(input.source, 40) || "amadeus",
    search_key: cleanText(input.searchKey, 220) || null,
    product_type: cleanText(input.productType, 40) || "FLIGHT_ONLY",
    origin: cleanText(input.origin, 10) || null,
    destination: cleanText(input.destination, 10) || null,
    departure_date: cleanDate(input.departureDate),
    return_date: cleanDate(input.returnDate),
    adults: Number(input.adults || 1),
    currency: cleanText(input.currency, 8) || "SEK",
    price_total: money(input.priceTotal),
    price_tax: money(input.priceTax),
    expires_at: input.expiresAt || new Date(Date.now() + 20 * 60 * 1000).toISOString(),
    payload: input.payload || {},
    created_by_agent_user_id: agentUserId || null
  };

  const rows = await supabaseRequest("altea_offer_cache", {
    method: "POST",
    body
  });

  return rows?.[0] || null;
}

export async function listPackageInventory(filters = {}) {
  const params = [
    "select=*",
    "active=eq.true",
    "order=start_date.asc",
    "limit=100"
  ];

  if (filters.itemType) {
    params.push(`item_type=eq.${encodeURIComponent(cleanText(filters.itemType, 40))}`);
  }

  if (filters.destination) {
    params.push(`destination=eq.${encodeURIComponent(cleanText(filters.destination, 10))}`);
  }

  return supabaseRequest(`altea_package_inventory?${params.join("&")}`);
}

export async function saveQueueItem(input = {}, agentUserId = null) {
  const body = {
    queue_number: cleanText(input.queueNumber, 20) || "1",
    queue_category: cleanText(input.queueCategory, 80) || null,
    priority: Number(input.priority || 50),
    booking_id: input.bookingId || null,
    pnr_locator: cleanLocator(input.pnrLocator) || null,
    booking_reference: cleanText(input.bookingReference, 40) || null,
    title: cleanText(input.title, 180) || "Queue item",
    description: cleanText(input.description, 1000) || null,
    status: cleanText(input.status, 40) || "open",
    assigned_agent_user_id: input.assignedAgentUserId || agentUserId || null,
    payload: input.payload || {}
  };

  const rows = await supabaseRequest("altea_queue_items", {
    method: "POST",
    body
  });

  return rows?.[0] || null;
}

export async function updateQueueItemStatus(queueItemId, status, agentUserId = null) {
  const id = cleanText(queueItemId, 80);
  if (!id) throw new Error("Missing queue item ID.");

  const rows = await supabaseRequest(`altea_queue_items?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: {
      status: cleanText(status, 40) || "working",
      assigned_agent_user_id: agentUserId || null
    }
  });

  return rows?.[0] || null;
}

export async function saveFidsFlight(input = {}, agentUserId = null) {
  const body = {
    flight_key: cleanText(input.flightKey || `${input.flightNumber}-${input.departureDate}`, 80),
    flight_number: cleanText(input.flightNumber, 20),
    airline_code: cleanText(input.airlineCode, 10) || null,
    airline_name: cleanText(input.airlineName, 100) || null,
    origin: cleanText(input.origin, 10) || null,
    destination: cleanText(input.destination, 10) || null,
    departure_date: cleanDate(input.departureDate),
    scheduled_time: cleanText(input.scheduledTime, 12) || null,
    estimated_time: cleanText(input.estimatedTime, 12) || null,
    actual_time: cleanText(input.actualTime, 12) || null,
    gate: cleanText(input.gate, 20) || null,
    terminal: cleanText(input.terminal, 20) || null,
    belt: cleanText(input.belt, 20) || null,
    status: cleanText(input.status, 40) || "ON_TIME",
    aircraft_type: cleanText(input.aircraftType, 40) || null,
    registration: cleanText(input.registration, 40) || null,
    payload: input.payload || {},
    updated_by_agent_user_id: agentUserId || null
  };

  const rows = await supabaseRequest("altea_fids_flights", {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=representation"
    },
    body
  });

  return rows?.[0] || null;
}

export async function insertPnrHistory({
  bookingId,
  pnrLocator,
  command,
  eventType,
  beforeState,
  afterState,
  payload,
  agentUserId
}) {
  const rows = await supabaseRequest("altea_pnr_history", {
    method: "POST",
    body: {
      booking_id: bookingId || null,
      pnr_locator: cleanLocator(pnrLocator) || null,
      command: cleanText(command, 120) || null,
      event_type: cleanText(eventType, 80) || "event",
      before_state: beforeState || null,
      after_state: afterState || null,
      payload: payload || {},
      created_by_agent_user_id: agentUserId || null
    }
  });

  return rows?.[0] || null;
}

export async function insertSyncEvent({
  sourceSystem,
  eventType,
  entityType,
  entityId,
  status,
  message,
  payload,
  agentUserId
}) {
  const rows = await supabaseRequest("altea_sync_events", {
    method: "POST",
    body: {
      source_system: cleanText(sourceSystem, 80) || "altea",
      event_type: cleanText(eventType, 100) || "event",
      entity_type: cleanText(entityType, 80) || null,
      entity_id: cleanText(entityId, 100) || null,
      status: cleanText(status, 40) || "success",
      message: cleanText(message, 500) || null,
      payload: payload || {},
      created_by_agent_user_id: agentUserId || null
    }
  });

  return rows?.[0] || null;
}

function generateBookingReference() {
  return `SK${Date.now().toString(36).toUpperCase().slice(-8)}`;
}

function cryptoId(prefix) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}